/**
 * Deciding whether an answer is right.
 *
 * This runs once, on the main thread, over the JSON values the runtimes hand
 * back — never inside a runtime. Four languages comparing answers four times
 * would be four chances for "correct in Python, wrong in Java", and on a
 * practice site a false failure on the learner's own working code is the most
 * expensive bug there is.
 */

import type { JudgeCompare, JudgeType } from "@/content/practice";

/**
 * Floating-point answers are compared with a tolerance, integers exactly.
 * The distinction is worth keeping: 0.30000000000000004 should pass a `double`
 * problem, and nothing should quietly pass an `int` one.
 */
const DOUBLE_EPSILON = 1e-9;

function typeRank(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "boolean") return 1;
  if (typeof value === "number") return 2;
  if (typeof value === "string") return 3;
  if (Array.isArray(value)) return 4;
  return 5;
}

/**
 * A total order over the JSON values a judged problem can produce. It exists
 * only to make `unordered` deterministic — the ordering itself is arbitrary, it
 * just has to be the same on both sides of the comparison.
 */
export function compareValues(a: unknown, b: unknown): number {
  const rankA = typeRank(a);
  const rankB = typeRank(b);
  if (rankA !== rankB) return rankA - rankB;

  if (rankA === 1) return Number(a as boolean) - Number(b as boolean);
  if (rankA === 2) return (a as number) - (b as number);
  if (rankA === 3) return (a as string) < (b as string) ? -1 : (a as string) > (b as string) ? 1 : 0;
  if (rankA === 4) {
    const listA = a as unknown[];
    const listB = b as unknown[];
    for (let i = 0; i < Math.min(listA.length, listB.length); i++) {
      const order = compareValues(listA[i], listB[i]);
      if (order !== 0) return order;
    }
    return listA.length - listB.length;
  }
  return 0;
}

function sorted(values: unknown[]): unknown[] {
  return [...values].sort(compareValues);
}

/**
 * Rearranges a value into the canonical form its compare mode calls for, so the
 * equality check below can stay a plain structural walk.
 */
export function canonical(value: unknown, mode: JudgeCompare): unknown {
  if (mode === "exact" || !Array.isArray(value)) return value;
  if (mode === "unordered") return sorted(value);
  // `unordered-nested`: the rows may come in any order and so may the values
  // inside each row — three-sum's triples are the reason this mode exists.
  return sorted(value.map((row) => (Array.isArray(row) ? sorted(row) : row)));
}

function deepEquals(a: unknown, b: unknown, numeric: boolean): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => deepEquals(item, b[i], numeric));
  }
  if (numeric && typeof a === "number" && typeof b === "number") {
    if (Number.isNaN(a) || Number.isNaN(b)) return false;
    return Math.abs(a - b) <= DOUBLE_EPSILON * Math.max(1, Math.abs(b));
  }
  // null and undefined both stand for "no value": Python's None arrives as one
  // and a JavaScript function that falls off its end returns the other.
  if (a === null || a === undefined) return b === null || b === undefined;
  return a === b;
}

export function matches(
  received: unknown,
  expected: unknown,
  compare: JudgeCompare = "exact",
  returns?: JudgeType
): boolean {
  return deepEquals(canonical(received, compare), canonical(expected, compare), returns === "double");
}
