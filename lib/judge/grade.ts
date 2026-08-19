/**
 * Turning raw values into verdicts, and a problem into the spec a runtime gets.
 *
 * Split out from `runner.ts` because that file constructs Workers and reaches
 * for `import.meta.url`, which confines it to a browser bundle. This half is
 * pure: it runs in a worker, in a test harness, or in Node, which is what lets
 * the console's verdicts be checked from a terminal.
 */
import type { Judge } from "@/content/practice";
import { matches } from "./compare";
import type {
  CaseResult,
  JudgeSpec,
  RawCaseResult,
  RunOutcome,
  RunStatus,
} from "./types";

/**
 * What a runtime is told about a problem.
 *
 * The expected answers are deliberately absent: a runtime that knew them could
 * not be trusted to report what the code actually returned.
 */
export function toSpec(judge: Judge): JudgeSpec {
  return {
    entry: judge.entry,
    params: judge.params.map((param) => param.type),
    returns: judge.returns,
    cases: judge.cases.map((testCase) => testCase.args),
  };
}

/**
 * Turns raw values into verdicts. This is the only place a value is called
 * right or wrong, and every language goes through it.
 */
export function gradeCases(
  judge: Judge,
  raw: RawCaseResult[],
  stdout: string[]
): Omit<RunOutcome, "durationMs"> {
  const cases: CaseResult[] = raw.map((result) => {
    if (result.error !== undefined) {
      return { index: result.index, status: "error", error: result.error };
    }
    const expected = judge.cases[result.index]?.expected;
    const passed = matches(result.value, expected, judge.compare, judge.returns);
    return { index: result.index, status: passed ? "pass" : "fail", received: result.value };
  });

  const status: RunStatus = cases.every((result) => result.status === "pass")
    ? "passed"
    : "failed";
  return { status, cases, stdout };
}
