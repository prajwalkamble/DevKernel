/**
 * The shape of a console run: what you can write in, and what comes back.
 *
 * Every language the console offers reduces to the same protocol — take the
 * source, call one named function once per test case, hand back either a
 * JSON-encodable value or the text of the exception it threw. Comparing those
 * values against the expected ones is deliberately *not* the runtime's job; it
 * happens once, in TypeScript, in `compare.ts`, so that "correct" means exactly
 * the same thing in Python as it does in JavaScript.
 */

/**
 * Every language the practice console offers. All of them execute here, in the
 * browser: JavaScript and TypeScript on the JS worker, Python on a CPython
 * build compiled to WebAssembly, and the compiled languages on the
 * interpreters in `lib/runtimes`.
 */
import type { JudgeType } from "@/content/practice";

export type PracticeLanguage =
  | "c"
  | "cpp"
  | "go"
  | "java"
  | "javascript"
  | "python"
  | "rust"
  | "typescript";

/**
 * A problem's test cases, flattened for a runtime.
 *
 * Deliberately not the `Judge` object itself. This crosses a `postMessage`
 * boundary into workers that must not import the content tree, and it carries
 * only what running the code needs — the expected answers stay on this side,
 * because a runtime that knew them could not be trusted to report what the
 * code actually returned.
 */
export interface JudgeSpec {
  entry: string;
  params: JudgeType[];
  returns: JudgeType;
  cases: unknown[][];
}

export type CaseStatus = "pass" | "fail" | "error";

export interface CaseResult {
  /** Index into `judge.cases`, so the UI can pair this with its inputs. */
  index: number;
  status: CaseStatus;
  /** What the function returned. Absent when it threw instead. */
  received?: unknown;
  /** The exception, formatted by the language it came from. */
  error?: string;
}

/**
 * How the run as a whole ended.
 *
 * `failed` means the code ran and got something wrong, which is the useful
 * outcome. The rest mean it never got that far, and each is worth telling apart:
 * a timeout usually means an infinite loop, a `no-entry` means the function is
 * misspelled or nested inside something, and a `runtime-error` before any case
 * means the file itself does not load.
 */
export type RunStatus =
  | "passed"
  | "failed"
  | "no-entry"
  | "compile-error"
  | "runtime-error"
  | "timeout"
  | "cancelled"
  /**
   * The code is fine; this runtime does not cover something it used.
   *
   * Kept distinct from every other outcome on purpose. The compiled languages
   * run on interpreters written for this site rather than on real toolchains,
   * so they will meet things they do not implement — and reporting that as a
   * failure would tell someone their correct solution is wrong, which is the
   * one mistake a practice tool must never make.
   */
  | "unsupported";

export interface RunOutcome {
  status: RunStatus;
  cases: CaseResult[];
  /** Whatever the solution printed, in order. Debug prints survive the run. */
  stdout: string[];
  /** Set when the run never reached the cases — the reason it did not. */
  message?: string;
  durationMs: number;
}

/**
 * One case as a runtime reports it: the value, or the exception, and nothing
 * else. A runtime never decides whether an answer is right — it does not have
 * the expected value, and that is on purpose.
 */
export interface RawCaseResult {
  index: number;
  value?: unknown;
  error?: string;
}

/** What a worker sends back. Kept flat so the message handler stays a switch. */
export type WorkerMessage =
  | { type: "ready" }
  | { type: "stdout"; text: string }
  // One case at a time as it finishes, then the whole set. The running commentary
  // is what makes a timeout useful: "four passed, then it hung on n = 35" says
  // something, where a bare "timed out" says nothing.
  | { type: "case"; case: RawCaseResult }
  | { type: "cases"; cases: RawCaseResult[] }
  | { type: "failed"; status: Exclude<RunStatus, "passed" | "failed">; message: string };
