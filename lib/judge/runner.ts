/**
 * The worker side of the console: creating runtimes, feeding them code, and
 * killing them when they stop answering.
 *
 * Deliberately a plain object rather than a hook. None of this is React state —
 * a Worker is a live thread with its own lifetime, and the page happens to be
 * one of its observers. Keeping it out here means the React layer is a thin
 * subscription, and this can be reasoned about (and torn down) on its own.
 */

import type { Judge } from "@/content/practice";
import { transpileTypeScript } from "@/lib/transpile";
import { gradeCases, toSpec } from "./grade";
import { isInterpreted, type InterpretedPracticeLanguage } from "./interpreted";
import type {
  PracticeLanguage,
  RawCaseResult,
  RunOutcome,
  WorkerMessage,
} from "./types";

/**
 * Two budgets, because the two things being waited on are nothing alike.
 * Downloading and starting CPython is a one-off that legitimately takes
 * seconds; a solution that has not returned in ten is a loop that never will.
 */
const BOOT_MS = 60_000;
const RUN_MS = 10_000;

/**
 * Which worker a language runs on.
 *
 * Three rather than two, and every language now has one: the compiled
 * languages go to `interpreted`, which hosts the tree-walkers from
 * `lib/runtimes`. Nothing is handed off to a toolchain outside the browser.
 */
type RuntimeKind = "python" | "javascript" | "interpreted";

export { gradeCases, toSpec };

export type JudgePhase = "idle" | "booting" | "running";

export interface RunListener {
  onPhase: (phase: JudgePhase) => void;
  onOutcome: (outcome: RunOutcome) => void;
}



export class JudgeRunner {
  private workers: Partial<Record<RuntimeKind, Worker>> = {};
  private watchdog: ReturnType<typeof setTimeout> | null = null;
  private active: RuntimeKind | null = null;
  /** Bumped on every run, so a message from a terminated worker is ignored. */
  private generation = 0;

  private clearWatchdog() {
    if (this.watchdog !== null) {
      clearTimeout(this.watchdog);
      this.watchdog = null;
    }
  }

  private drop(kind: RuntimeKind) {
    this.workers[kind]?.terminate();
    delete this.workers[kind];
  }

  private worker(kind: RuntimeKind): { worker: Worker; fresh: boolean } {
    const existing = this.workers[kind];
    if (existing) return { worker: existing, fresh: false };
    // The first two are hand-written files served from `public/`; the third is
    // bundled, because it imports the interpreters and those are TypeScript.
    const worker =
      kind === "python"
        ? new Worker("/judge/python-worker.js", { type: "module" })
        : kind === "interpreted"
          ? new Worker(new URL("./interpretedWorker.ts", import.meta.url), { type: "module" })
          : new Worker("/judge/js-worker.js");
    this.workers[kind] = worker;
    return { worker, fresh: true };
  }

  async run(
    judge: Judge,
    language: PracticeLanguage,
    source: string,
    listener: RunListener
  ): Promise<void> {
    const generation = ++this.generation;
    const startedAt = Date.now();
    const stdout: string[] = [];
    const finished: RawCaseResult[] = [];
    let code = source;

    listener.onPhase("running");

    if (language === "typescript") {
      const transpiled = await transpileTypeScript(source, "typescript");
      if (generation !== this.generation) return;
      code = transpiled.code;
      // Kept rather than treated as fatal: TypeScript still emits usable
      // JavaScript for most complaints, and a type error you can see beside a
      // passing run teaches more than a refusal to run at all.
      stdout.push(...transpiled.diagnostics.map((line) => `TypeScript: ${line}`));
    }

    const kind: RuntimeKind = language === "python"
      ? "python"
      : isInterpreted(language)
        ? "interpreted"
        : "javascript";
    this.active = kind;
    this.clearWatchdog();

    const { worker, fresh } = this.worker(kind);
    const booting = fresh && kind === "python";
    listener.onPhase(booting ? "booting" : "running");

    const finish = (result: Omit<RunOutcome, "durationMs">) => {
      if (generation !== this.generation) return;
      this.clearWatchdog();
      this.active = null;
      listener.onPhase("idle");
      listener.onOutcome({ ...result, durationMs: Date.now() - startedAt });
    };

    const arm = (ms: number) => {
      this.clearWatchdog();
      this.watchdog = setTimeout(() => {
        this.drop(kind);
        // Whatever finished before the hang is kept and marked: which case it
        // stopped on is usually the answer to why it stopped.
        const graded = gradeCases(judge, finished, stdout);
        const stuck = judge.cases.length - finished.length;
        finish({
          status: "timeout",
          cases: graded.cases,
          stdout,
          message:
            `No answer after ${Math.round(ms / 1000)} seconds, with ${stuck} case${stuck === 1 ? "" : "s"} left to run. ` +
            "Either a loop whose condition never becomes false, or an approach whose cost has caught up with the input size.",
        });
      }, ms);
    };

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      if (generation !== this.generation) return;
      const message = event.data;
      switch (message.type) {
        case "ready":
          listener.onPhase("running");
          arm(RUN_MS);
          break;
        case "stdout":
          stdout.push(message.text);
          break;
        case "case":
          finished.push(message.case);
          break;
        case "cases":
          finish(gradeCases(judge, message.cases, stdout));
          break;
        case "failed":
          finish({ status: message.status, cases: [], stdout, message: message.message });
          break;
      }
    };

    worker.onerror = (event) => {
      this.drop(kind);
      finish({
        status: "runtime-error",
        cases: [],
        stdout,
        message: event.message || "The runtime stopped unexpectedly.",
      });
    };

    arm(booting ? BOOT_MS : RUN_MS);
    worker.postMessage({
      code,
      spec: toSpec(judge),
      // Only the interpreted worker reads this; the other two host one language
      // each and have nothing to choose between.
      language: language as InterpretedPracticeLanguage,
    });
  }

  stop(listener: RunListener) {
    if (this.active === null) return;
    this.generation++;
    this.clearWatchdog();
    this.drop(this.active);
    this.active = null;
    listener.onPhase("idle");
    listener.onOutcome({ status: "cancelled", cases: [], stdout: [], durationMs: 0 });
  }

  dispose() {
    this.generation++;
    this.clearWatchdog();
    for (const kind of ["python", "javascript", "interpreted"] as RuntimeKind[]) this.drop(kind);
    this.active = null;
  }
}
