/**
 * Grading C, C++, Go, Java and Rust: the bridge between a problem's test cases
 * and the interpreters in `lib/runtimes`.
 *
 * No driver program is generated. The interpreters are synchronous and live in
 * this process, so the user's source is parsed once and the entry function is
 * then *called* directly, one call per case, with the arguments converted to
 * interpreter values and the result converted back. That buys three things a
 * generated `main` would not: per-case error isolation, no escaping bugs at the
 * boundary, and the ability to tell "your loop threw on case 4" apart from
 * "your file does not compile".
 *
 * The one rule that governs everything here: **an `UnsupportedError` is never a
 * wrong answer.** These are interpreters written for this site, not real
 * toolchains, so they will meet library corners they do not implement. When
 * that happens the run stops with `unsupported` and says what was missing.
 * Reporting it as a failed case would tell somebody their correct solution is
 * wrong, and the whole console stops being trustworthy the first time it does.
 */
import type { JudgeType } from "@/content/practice";
import {
  Evaluator,
  int,
  type FnDecl,
  type Program,
  type Value,
} from "@/lib/runtimes/lang";
import { parse } from "@/lib/runtimes/parser";
import { cDialect } from "@/lib/runtimes/cdialect";
import { goDialect } from "@/lib/runtimes/godialect";
import { cppDialect, javaDialect, rustDialect } from "@/lib/runtimes/dialects";
import { OutputSink, ProgramError, UnsupportedError } from "@/lib/runtimes/types";
import type { JudgeSpec, PracticeLanguage, RawCaseResult, RunStatus } from "./types";

/** The five that run on `lib/runtimes` rather than on a worker. */
export type InterpretedPracticeLanguage = "c" | "cpp" | "go" | "java" | "rust";

export function isInterpreted(
  language: PracticeLanguage
): language is InterpretedPracticeLanguage {
  return language === "c" || language === "cpp" || language === "go" ||
    language === "java" || language === "rust";
}

const DIALECTS = {
  c: cDialect,
  cpp: cppDialect,
  go: goDialect,
  java: javaDialect,
  rust: rustDialect,
} as const;

/**
 * A smaller step budget than the playground's.
 *
 * The playground runs one program and can afford to think for a while; the
 * console runs the same function once per case and a runaway loop should be
 * reported as a timeout quickly. This is still far more work than any correct
 * solution to these problems performs.
 */
const STEPS_PER_CASE = 4_000_000;

/* ------------------------------------------------------------- conversions -- */

/** Is this type carried as a sequence rather than a scalar? */
function isSequence(type: JudgeType): boolean {
  return type.endsWith("[]") || type.startsWith("List<");
}

/**
 * A test case's JSON argument, as an interpreter value.
 *
 * The declared type decides the representation rather than the JavaScript
 * value's own shape, because the two disagree in exactly the places that
 * matter: `"a"` is a `char` in one problem and a `string` in another, and
 * getting that wrong would hand a Java solution a `String` where it expects a
 * `char` and fail it for the runtime's mistake.
 */
function toValue(json: unknown, type: JudgeType, language: InterpretedPracticeLanguage): Value {
  const wide = language === "go" || language === "rust" ? 64 : 32;

  switch (type) {
    case "int":
      return int(BigInt(Math.trunc(json as number)), wide, true);
    case "double":
      return { t: "float", v: json as number };
    case "boolean":
      return { t: "bool", v: Boolean(json) };
    case "string":
      return { t: "str", v: String(json) };
    case "char":
      return { t: "char", v: String(json) };
    case "int[]":
    case "List<int>":
      return {
        t: "list",
        v: (json as number[]).map((n) => int(BigInt(Math.trunc(n)), wide, true)),
        kind: "array",
      };
    case "string[]":
      return { t: "list", v: (json as string[]).map((s) => ({ t: "str", v: s })), kind: "array" };
    case "char[]":
      return { t: "list", v: (json as string[]).map((c) => ({ t: "char", v: c })), kind: "array" };
    case "int[][]":
    case "List<List<int>>":
      return {
        t: "list",
        v: (json as number[][]).map((row) => toValue(row, "int[]", language)),
        kind: "array",
      };
    case "char[][]":
      return {
        t: "list",
        v: (json as string[][]).map((row) => toValue(row, "char[]", language)),
        kind: "array",
      };
    case "tree":
      throw new UnsupportedError(
        "problems built on a TreeNode, in this language — use Python, JavaScript or TypeScript for these"
      );
  }
}

/**
 * An interpreter value, as JSON for the comparer.
 *
 * `compare.ts` is the only place a value is called right or wrong, and it works
 * in plain JavaScript so that "correct" means the same thing in every language.
 * This is the whole of the conversion back.
 */
function toJson(value: Value): unknown {
  switch (value.t) {
    case "int": return Number(value.v);
    case "float": return value.v;
    case "bool": return value.v;
    case "char": return value.v;
    case "str": return value.v;
    case "unit": return null;
    case "list":
    case "tuple": return value.v.map(toJson);
    case "set": return [...value.v.values()].map(toJson);
    case "heap": return value.v.map(toJson);
    case "range": {
      const out: number[] = [];
      const end = value.inclusive ? value.to + 1n : value.to;
      for (let i = value.from; i < end; i++) out.push(Number(i));
      return out;
    }
    case "map":
      return Object.fromEntries([...value.v.values()].map(([k, v]) => [String(toJson(k)), toJson(v)]));
    case "struct":
      return Object.fromEntries([...value.fields].map(([k, v]) => [k, toJson(v)]));
    case "enum": return value.variant;
    case "closure": return null;
  }
}

/* ------------------------------------------------------------------ entry -- */

/** `twoSum` -> `two_sum`, which is what a Rust or Go solution is likely to call it. */
function snakeCase(name: string): string {
  return name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Finds the function to call.
 *
 * Both spellings are accepted everywhere rather than per language, because the
 * stub offers one and nothing stops somebody renaming it to the convention
 * they prefer — and failing them for that would be a judgement about style
 * dressed up as a wrong answer.
 */
/**
 * Finds the function to grade.
 *
 * Three spellings have to work. The stub's own — a free function — is the one
 * most people edit. `snake_case` covers Rust and the Python-style naming some
 * problems use. And a method inside a class covers what someone pastes from
 * LeetCode, whose editor wraps every C++ and Java solution in `class Solution`;
 * refusing that would be a verdict about where the code was copied from rather
 * than whether it is correct.
 */
function findEntry(program: Program, entry: string): FnDecl | undefined {
  const direct = program.functions.get(entry) ?? program.functions.get(snakeCase(entry));
  if (direct) return direct;
  for (const struct of program.structs.values()) {
    const method = struct.methods.get(entry) ?? struct.methods.get(snakeCase(entry));
    if (method) return method;
  }
  return undefined;
}

/* -------------------------------------------------------------------- run -- */

export interface InterpretedRun {
  status?: Exclude<RunStatus, "passed" | "failed">;
  message?: string;
  cases: RawCaseResult[];
  stdout: string[];
}

/**
 * Runs `source` against every case in `spec`.
 *
 * Synchronous by design: the caller decides whether that happens on a worker.
 */
export function runInterpreted(
  spec: JudgeSpec,
  language: InterpretedPracticeLanguage,
  source: string,
  /**
   * Called as each case finishes. A run that later hangs is killed from
   * outside, and without this the cases that did complete would be lost —
   * which one it stopped on is usually the answer to why.
   */
  onCase?: (result: RawCaseResult) => void
): InterpretedRun {
  const dialect = DIALECTS[language];
  const stdout: string[] = [];

  let program: Program;
  try {
    program = parse(source, dialect.parseAs ?? (dialect.name as "rust" | "cpp" | "java"));
  } catch (error) {
    if (error instanceof UnsupportedError) {
      return { status: "unsupported", message: error.message, cases: [], stdout };
    }
    return {
      status: "compile-error",
      message: error instanceof Error ? error.message : String(error),
      cases: [],
      stdout,
    };
  }

  const fn = findEntry(program, spec.entry);
  if (!fn) {
    const named = [...program.functions.keys()].filter((name) => name !== "main");
    return {
      status: "no-entry",
      message:
        `No function called \`${spec.entry}\` was found.` +
        (named.length ? ` This file defines ${named.map((n) => `\`${n}\``).join(", ")}.` : ""),
      cases: [],
      stdout,
    };
  }

  const cases: RawCaseResult[] = [];

  for (let index = 0; index < spec.cases.length; index++) {
    // A fresh sink per case, so one case's output budget and step budget cannot
    // starve the next, and globals are re-initialised so a solution that
    // mutates one cannot leak state between cases.
    const out = new OutputSink(20_000, STEPS_PER_CASE);
    const evaluator = new Evaluator(program, dialect, out);

    try {
      for (const [name, value] of Object.entries(dialect.globals ?? {})) {
        evaluator.globals.declare(name, value, false);
      }
      for (const stmt of program.globals) evaluator.exec(stmt, evaluator.globals);

      const args = spec.cases[index].map((arg, i) =>
        toValue(arg, spec.params[i], language)
      );

      // C reaches its arrays through a pointer and a length, and returns one
      // the same way. Mirroring that convention is what makes the stub look
      // like C rather than like a scripting language wearing braces.
      const call = language === "c"
        ? cArguments(args, spec, evaluator)
        : { args, readBack: (result: Value) => result };

      const result = evaluator.callFunction(fn, call.args, fn.line);
      const done: RawCaseResult = { index, value: toJson(call.readBack(result)) };
      cases.push(done);
      onCase?.(done);
    } catch (error) {
      if (error instanceof UnsupportedError) {
        // Fatal for the whole run, not for this case: the next case would meet
        // exactly the same gap, and reporting four more failures would bury
        // the one sentence that explains it.
        out.flush();
        stdout.push(...out.lines.map((line) => line.text));
        return { status: "unsupported", message: error.message, cases, stdout };
      }
      const failed: RawCaseResult = {
        index,
        error: error instanceof ProgramError || error instanceof Error
          ? error.message
          : String(error),
      };
      cases.push(failed);
      onCase?.(failed);
    }

    out.flush();
    // Anything the solution printed is kept — debugging prints surviving the
    // run is most of what makes a console usable.
    for (const line of out.lines) stdout.push(line.text);
  }

  return { cases, stdout };
}

/**
 * C's calling convention for arrays: every array is a pointer plus its length,
 * and a returned array is written through a trailing `int* returnSize`.
 *
 * This is the signature LeetCode gives C solutions, and matching it means a C
 * answer written here is a C answer anywhere.
 */
function cArguments(
  args: Value[],
  spec: JudgeSpec,
  ev: Evaluator
): { args: Value[]; readBack: (result: Value) => Value } {
  const expanded: Value[] = [];
  for (let i = 0; i < args.length; i++) {
    expanded.push(args[i]);
    const type = spec.params[i];
    if (isSequence(type)) {
      const value = args[i];
      expanded.push(int(BigInt(value.t === "list" ? value.v.length : 0), 32, true));
      // A matrix passes its row count and then a per-row length array.
      if (type === "int[][]" || type === "char[][]" || type === "List<List<int>>") {
        expanded.push({
          t: "list",
          v: (value.t === "list" ? value.v : []).map((row) =>
            int(BigInt(row.t === "list" ? row.v.length : 0), 32, true)
          ),
          kind: "array",
        });
      }
    }
  }

  if (!isSequence(spec.returns)) {
    return { args: expanded, readBack: (result) => result };
  }

  const returnSize: Value = { t: "list", v: [int(0n, 32, true)], kind: "array" };
  expanded.push(returnSize);
  void ev;
  return {
    args: expanded,
    readBack: (result) => {
      if (result.t !== "list") return result;
      const slot = returnSize.t === "list" ? returnSize.v[0] : undefined;
      const size = slot?.t === "int" ? Number(slot.v) : result.v.length;
      // A solution that never writes `*returnSize` leaves it at zero. Trusting
      // that would silently mark a correct answer empty, so a zero is read as
      // "not set" and the array is taken whole.
      return size > 0 ? { t: "list", v: result.v.slice(0, size), kind: "array" } : result;
    },
  };
}
