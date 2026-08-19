/** Turning judge values into the short strings the results panel shows. */

import type { Judge } from "@/content/practice";

/** A value on one line, in the JSON the problem statements already use. */
export function formatValue(value: unknown): string {
  if (value === undefined) return "undefined";
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/**
 * A case's arguments the way the problem statement writes them —
 * `nums = [2,7,11,15], target = 9` — so a failing case reads like the examples
 * above it rather than like an argument list.
 */
export function formatCaseInputs(judge: Judge, args: unknown[]): string {
  return judge.params
    .map((param, i) => `${param.name} = ${formatValue(args[i])}`)
    .join(", ");
}

/** Clips a long value so one enormous input cannot push the verdict off screen. */
export function truncate(text: string, limit = 160): string {
  return text.length <= limit ? text : `${text.slice(0, limit - 1)}…`;
}
