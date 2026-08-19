/**
 * The worker that grades C, C++, Go, Java and Rust.
 *
 * The interpreters are synchronous tree-walkers, so a solution with a runaway
 * loop would freeze the page if it ran on the main thread — Stop would not
 * respond and neither would anything else. Off here, the same hang is just a
 * thread the main side can terminate, which is what makes the watchdog in
 * `runner.ts` able to report a timeout at all.
 *
 * It speaks the same message protocol as the JavaScript and Python workers next
 * door, so `JudgeRunner` treats all three the same way.
 *
 * Unlike those two this one is bundled rather than served from `public/`: it
 * imports the interpreters, which are TypeScript modules.
 */
import { runInterpreted, type InterpretedPracticeLanguage } from "./interpreted";
import type { JudgeSpec, WorkerMessage } from "./types";

interface Request {
  code: string;
  spec: JudgeSpec;
  language: InterpretedPracticeLanguage;
}

function post(message: WorkerMessage) {
  self.postMessage(message);
}

self.onmessage = (event: MessageEvent<Request>) => {
  const { code, spec, language } = event.data;

  // Nothing to boot, so the main side can start its run watchdog immediately
  // rather than waiting out the longer startup budget.
  post({ type: "ready" });

  try {
    const run = runInterpreted(spec, language, code, (result) =>
      post({ type: "case", case: result })
    );

    for (const line of run.stdout) post({ type: "stdout", text: line });

    if (run.status) {
      post({ type: "failed", status: run.status, message: run.message ?? "" });
      return;
    }
    post({ type: "cases", cases: run.cases });
  } catch (error) {
    // Anything reaching here is a fault in the interpreter rather than in the
    // solution, so it is reported as the runtime stopping — not as a wrong
    // answer, which it is not.
    post({
      type: "failed",
      status: "runtime-error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
