/**
 * The playground's Python engine: a Pyodide worker, kept alive between runs.
 *
 * Deliberately not a hook. The worker is a live thread with its own lifetime
 * and a multi-second first boot, so it outlives any single render and the React
 * layer only subscribes to it.
 */
import type { RuntimeLine, RuntimeResult } from "./runtimes/types";

/** Booting CPython legitimately takes seconds; a run that long is a loop. */
const BOOT_MS = 60_000;
const RUN_MS = 15_000;

let worker: Worker | null = null;
let booted = false;

function ensureWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("/judge/python-playground-worker.js", window.location.origin), {
      type: "module",
    });
  }
  return worker;
}

/** Throws the worker away, so the next run starts from a clean interpreter. */
export function resetPython(): void {
  worker?.terminate();
  worker = null;
  booted = false;
}

/**
 * Runs a script and resolves once it finishes, with everything it printed.
 *
 * Output is collected rather than streamed because the other in-browser
 * runtimes deliver theirs complete, and the console renders one list either
 * way — matching them keeps the playground's behaviour uniform across
 * languages.
 */
export function runPython(source: string): Promise<RuntimeResult> {
  return new Promise((resolve) => {
    const active = ensureWorker();
    const lines: RuntimeLine[] = [];
    const id = Math.random().toString(36).slice(2);

    const finish = (extra?: RuntimeLine, exitCode: number | null = 0) => {
      clearTimeout(timer);
      active.removeEventListener("message", onMessage);
      if (extra) lines.push(extra);
      resolve({ lines, exitCode });
    };

    const timer = setTimeout(
      () => {
        // A hung run leaves the interpreter in an unknown state, so the worker
        // goes with it rather than being reused for the next attempt.
        resetPython();
        finish(
          {
            level: "error",
            text: booted
              ? "Stopped: the program ran for too long (this usually means an infinite loop)."
              : "Stopped: CPython did not finish downloading in time.",
          },
          1
        );
      },
      booted ? RUN_MS : BOOT_MS
    );

    const onMessage = (event: MessageEvent) => {
      const message = event.data ?? {};
      if (message.type === "stdout") {
        booted = true;
        for (const text of String(message.text).split("\n")) lines.push({ level: "log", text });
        return;
      }
      if (message.type === "stderr") {
        booted = true;
        for (const text of String(message.text).split("\n")) lines.push({ level: "warn", text });
        return;
      }
      if (message.type === "done" && message.id === id) {
        booted = true;
        finish();
        return;
      }
      if (message.type === "error" && message.id === id) {
        booted = true;
        finish({ level: "error", text: message.message }, 1);
      }
    };

    active.addEventListener("message", onMessage);
    active.postMessage({ type: "run", source, id });
  });
}
