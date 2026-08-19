/**
 * The shared machinery behind the Rust, C++ and Java browser runtimes: a
 * lexer, a common AST, a Pratt expression parser, and a tree-walking evaluator.
 *
 * The three languages differ far more in their declaration syntax and their
 * standard libraries than in their expressions, so the expression parser and
 * the evaluator are shared and the per-language files supply a dialect plus a
 * table of builtins.
 *
 * Integers carry their width and signedness so that overflow behaves the way
 * the language being taught says it does — Rust panics, C++ and Java wrap.
 */
import { OutputSink, ProgramError, UnsupportedError } from "./types";

// ---------------------------------------------------------------------- lexer

export type TokKind = "num" | "str" | "char" | "ident" | "punct" | "eof";

export interface Token {
  kind: TokKind;
  text: string;
  line: number;
  /** For string/char literals: the decoded value. */
  value?: string;
  /** For numeric literals: whether a decimal point or exponent was present. */
  float?: boolean;
  /** For numeric literals: an explicit suffix such as `u8` or `f64`. */
  suffix?: string;
}

const PUNCT = [
  "..=", "<<=", ">>=", "->", "=>", "::", "..", ":=", "<-", "++", "--", "&&", "||", "==", "!=",
  "<=", ">=", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<", ">>",
  "{", "}", "(", ")", "[", "]", ";", ",", ".", ":", "?", "+", "-", "*", "/", "%",
  "<", ">", "=", "!", "&", "|", "^", "~", "@", "#",
];

const ESCAPES: Record<string, string> = {
  n: "\n", t: "\t", r: "\r", "0": "\0", "\\": "\\", '"': '"', "'": "'",
};

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  /** Object-like `#define`s, substituted once the whole file has been read. */
  const macros = new Map<string, Token[]>();
  let i = 0;
  let line = 1;

  const readEscaped = (quote: string): string => {
    let out = "";
    i++; // opening quote
    while (i < source.length && source[i] !== quote) {
      if (source[i] === "\n") line++;
      if (source[i] === "\\") {
        const next = source[i + 1];
        if (next === "u" && source[i + 2] === "{") {
          const end = source.indexOf("}", i + 3);
          out += String.fromCodePoint(parseInt(source.slice(i + 3, end), 16));
          i = end + 1;
          continue;
        }
        if (next === "u") {
          out += String.fromCharCode(parseInt(source.slice(i + 2, i + 6), 16));
          i += 6;
          continue;
        }
        out += next in ESCAPES ? ESCAPES[next] : next;
        i += 2;
        continue;
      }
      out += source[i++];
    }
    i++; // closing quote
    return out;
  };

  while (i < source.length) {
    const ch = source[i];

    if (ch === "\n") { line++; i++; continue; }
    if (/\s/.test(ch)) { i++; continue; }

    // Comments
    if (ch === "/" && source[i + 1] === "/") {
      while (i < source.length && source[i] !== "\n") i++;
      continue;
    }
    if (ch === "/" && source[i + 1] === "*") {
      i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) {
        if (source[i] === "\n") line++;
        i++;
      }
      i += 2;
      continue;
    }
    // A Java annotation or a Rust attribute: skipped wholesale, as before.
    // Rust attributes are always `#[...]` or `#![...]`, which is what keeps
    // this apart from a C preprocessor directive without needing to know
    // which language we are lexing.
    if (
      (ch === "@" && /[A-Za-z]/.test(source[i + 1] ?? "")) ||
      (ch === "#" && (source[i + 1] === "[" || source[i + 1] === "!"))
    ) {
      while (i < source.length && source[i] !== "\n") i++;
      continue;
    }

    // A C/C++ preprocessor directive. Only the ones this runtime can honour
    // are accepted; the rest stop the program rather than being dropped,
    // because silently ignoring a directive changes what the code means.
    if (ch === "#") {
      const directiveLine = line;
      i++;
      while (i < source.length && (source[i] === " " || source[i] === "\t")) i++;
      const nameStart = i;
      while (i < source.length && /[A-Za-z_]/.test(source[i])) i++;
      const directive = source.slice(nameStart, i);

      let rest = "";
      while (i < source.length && source[i] !== "\n") rest += source[i++];

      if (rest.trimEnd().endsWith("\\")) {
        throw new UnsupportedError("a macro continued across lines with `\\`", directiveLine);
      }

      // Genuine no-ops for a single-file interpreter rather than guesses:
      // the standard library is always available, and there is only one
      // translation unit for an include guard to protect.
      if (directive === "include") continue;
      if (directive === "pragma" && rest.trim() === "once") continue;

      if (directive === "define") {
        const named = /^\s+([A-Za-z_]\w*)/.exec(rest);
        if (!named) {
          throw new UnsupportedError("a `#define` with no macro name", directiveLine);
        }
        const body = rest.slice(named[0].length);
        if (body.startsWith("(")) {
          throw new UnsupportedError("a function-like macro", directiveLine);
        }
        if (body.includes("#")) {
          throw new UnsupportedError(
            "`#` inside a macro body (the stringify and paste operators)",
            directiveLine
          );
        }
        macros.set(
          named[1],
          tokenize(body)
            .filter((t) => t.kind !== "eof")
            .map((t) => ({ ...t, line: directiveLine }))
        );
        continue;
      }

      throw new UnsupportedError(
        directive ? `the \`#${directive}\` directive` : "a bare `#` directive",
        directiveLine
      );
    }

    // Go's raw string literal. No escapes are processed inside one, which is
    // the whole reason the language has them.
    if (ch === "`") {
      const startLine = line;
      const end = source.indexOf("`", i + 1);
      if (end === -1) throw new ProgramError("unterminated raw string", line);
      const value = source.slice(i + 1, end);
      for (const c of value) if (c === "\n") line++;
      tokens.push({ kind: "str", text: JSON.stringify(value), value, line: startLine });
      i = end + 1;
      continue;
    }

    // Raw string: Rust's r"..." / r#"..."#
    if (ch === "r" && (source[i + 1] === '"' || source[i + 1] === "#")) {
      const hashes = source.slice(i + 1).match(/^#*/)![0];
      const open = i + 1 + hashes.length;
      if (source[open] === '"') {
        const terminator = '"' + hashes;
        const end = source.indexOf(terminator, open + 1);
        if (end === -1) throw new ProgramError("unterminated raw string", line);
        tokens.push({ kind: "str", text: source.slice(i, end + terminator.length), value: source.slice(open + 1, end), line });
        i = end + terminator.length;
        continue;
      }
    }

    if (ch === '"') {
      const startLine = line;
      const value = readEscaped('"');
      tokens.push({ kind: "str", text: JSON.stringify(value), value, line: startLine });
      continue;
    }

    if (ch === "'") {
      // A Rust lifetime (`'a`) is not a character literal.
      const rest = source.slice(i);
      if (/^'[A-Za-z_]\w*(?!')/.test(rest) && !/^'.'/.test(rest)) {
        throw new UnsupportedError("explicit lifetimes", line);
      }
      const startLine = line;
      const value = readEscaped("'");
      tokens.push({ kind: "char", text: `'${value}'`, value, line: startLine });
      continue;
    }

    if (/[0-9]/.test(ch)) {
      const start = i;
      let isFloat = false;
      if (ch === "0" && /[xXbBoO]/.test(source[i + 1] ?? "")) {
        i += 2;
        while (i < source.length && /[0-9a-fA-F_]/.test(source[i])) i++;
      } else {
        while (i < source.length && /[0-9_]/.test(source[i])) i++;
        // A dot is only a decimal point if a digit follows — `1..5` is a range,
        // and `1.abs()` is a method call.
        if (source[i] === "." && /[0-9]/.test(source[i + 1] ?? "")) {
          isFloat = true;
          i++;
          while (i < source.length && /[0-9_]/.test(source[i])) i++;
        }
        if (/[eE]/.test(source[i] ?? "") && /[0-9+-]/.test(source[i + 1] ?? "")) {
          isFloat = true;
          i += 2;
          while (i < source.length && /[0-9]/.test(source[i])) i++;
        }
      }
      const text = source.slice(start, i);
      let suffix = "";
      const suffixMatch = source.slice(i).match(/^(i8|i16|i32|i64|i128|isize|u8|u16|u32|u64|u128|usize|f32|f64|[lLfFdD])/);
      if (suffixMatch) {
        suffix = suffixMatch[1];
        i += suffix.length;
      }
      tokens.push({ kind: "num", text, line, float: isFloat || /^f/.test(suffix) || /^[fFdD]$/.test(suffix), suffix });
      continue;
    }

    if (/[A-Za-z_$]/.test(ch)) {
      const start = i;
      while (i < source.length && /[\w$]/.test(source[i])) i++;
      let text = source.slice(start, i);
      // A macro invocation keeps its `!` so the parser can see it.
      if (source[i] === "!" && source[i + 1] !== "=") {
        text += "!";
        i++;
      }
      tokens.push({ kind: "ident", text, line });
      continue;
    }

    const punct = PUNCT.find((p) => source.startsWith(p, i));
    if (!punct) throw new ProgramError(`unexpected character "${ch}"`, line);
    tokens.push({ kind: "punct", text: punct, line });
    i += punct.length;
  }

  const result = macros.size === 0 ? tokens : expandMacros(tokens, macros);
  result.push({ kind: "eof", text: "", line });
  return result;
}

/**
 * Substitutes object-like macros across an already-lexed file.
 *
 * Replacement tokens are rescanned, so one macro may expand into another, and
 * a macro is suppressed inside its own expansion — the rule the real
 * preprocessor uses to stop `#define A A` recursing forever. Substituted
 * tokens take the line of the *use* site, so an error inside an expansion
 * points at the line the reader actually wrote.
 */
function expandMacros(tokens: Token[], macros: ReadonlyMap<string, Token[]>): Token[] {
  const out: Token[] = [];

  const emit = (body: readonly Token[], active: Set<string>, useLine: number): void => {
    for (const tok of body) {
      const nested = tok.kind === "ident" && !active.has(tok.text)
        ? macros.get(tok.text)
        : undefined;
      if (!nested) {
        out.push(tok.line === useLine ? tok : { ...tok, line: useLine });
        continue;
      }
      active.add(tok.text);
      emit(nested, active, useLine);
      active.delete(tok.text);
    }
  };

  for (const tok of tokens) {
    const body = tok.kind === "ident" ? macros.get(tok.text) : undefined;
    if (!body) {
      out.push(tok);
      continue;
    }
    emit(body, new Set([tok.text]), tok.line);
  }
  return out;
}

// ------------------------------------------------------------------------ AST

export type Expr =
  | { k: "int"; v: bigint; width: number; signed: boolean; line: number }
  | { k: "float"; v: number; line: number }
  | { k: "str"; v: string; line: number }
  | { k: "char"; v: string; line: number }
  | { k: "bool"; v: boolean; line: number }
  | { k: "unit"; line: number }
  | { k: "name"; name: string; line: number }
  | { k: "unary"; op: string; operand: Expr; line: number }
  | { k: "binary"; op: string; left: Expr; right: Expr; line: number }
  | { k: "assign"; op: string; target: Expr; value: Expr; line: number }
  | { k: "incdec"; op: string; target: Expr; prefix: boolean; line: number }
  | { k: "ternary"; cond: Expr; then: Expr; other: Expr; line: number }
  | { k: "call"; callee: Expr; args: Expr[]; line: number }
  | { k: "method"; target: Expr; name: string; args: Expr[]; line: number }
  | { k: "field"; target: Expr; name: string; line: number }
  | { k: "index"; target: Expr; index: Expr; line: number }
  | { k: "list"; items: Expr[]; repeat?: Expr; line: number }
  | { k: "tuple"; items: Expr[]; line: number }
  | { k: "range"; from: Expr; to: Expr; inclusive: boolean; line: number }
  | { k: "cast"; value: Expr; type: string; line: number }
  | { k: "path"; segments: string[]; line: number }
  | { k: "macro"; name: string; args: Expr[]; line: number }
  | { k: "block"; body: Stmt[]; line: number }
  | { k: "if"; cond: Expr; then: Stmt; other?: Stmt; line: number }
  | { k: "match"; subject: Expr; arms: MatchArm[]; line: number }
  | { k: "struct"; name: string; fields: { name: string; value: Expr }[]; line: number }
  | { k: "ref"; mutable: boolean; value: Expr; line: number }
  | { k: "closure"; params: string[]; body: Expr; line: number };

export interface MatchArm {
  /** null means `_`. */
  pattern: Pattern | null;
  guard?: Expr;
  body: Expr;
}

export type Pattern =
  | { k: "lit"; value: Expr }
  | { k: "bind"; name: string }
  | { k: "variant"; name: string; bindings: string[] }
  | { k: "range"; from: Expr; to: Expr; inclusive: boolean }
  | { k: "or"; options: Pattern[] };

export type Stmt =
  | { k: "expr"; expr: Expr; line: number }
  | { k: "let"; name: string; mutable: boolean; type?: string; init?: Expr; line: number }
  | { k: "block"; body: Stmt[]; line: number }
  | { k: "if"; cond: Expr; then: Stmt; other?: Stmt; line: number }
  | { k: "while"; cond: Expr; body: Stmt; line: number }
  | { k: "doWhile"; cond: Expr; body: Stmt; line: number }
  | { k: "loop"; body: Stmt; line: number }
  | { k: "forC"; init?: Stmt; cond?: Expr; step?: Expr; body: Stmt; line: number }
  /**
   * A for-each. Every language here binds the *element* to `name` — except Go,
   * whose `range` binds the position instead, and optionally the element
   * alongside it. `indexed` selects that reading for the one-variable form
   * (`for i := range xs`); `name2` implies it for the two-variable form
   * (`for i, v := range xs`). A map ranges over keys and values rather than
   * positions and elements, which is the same distinction one level down.
   */
  | {
      k: "forIn";
      name: string;
      name2?: string;
      indexed?: boolean;
      iterable: Expr;
      body: Stmt;
      line: number;
    }
  | { k: "return"; value?: Expr; line: number }
  | { k: "break"; line: number }
  | { k: "continue"; line: number }
  | { k: "tail"; expr: Expr; line: number }
  /** Several statements that share the enclosing scope rather than making one. */
  | { k: "multi"; body: Stmt[]; line: number };

export interface Param {
  name: string;
  type?: string;
}

export interface FnDecl {
  name: string;
  params: Param[];
  body: Stmt[];
  returnType?: string;
  line: number;
}

export interface StructDecl {
  name: string;
  fields: string[];
  methods: Map<string, FnDecl>;
}

export interface Program {
  functions: Map<string, FnDecl>;
  structs: Map<string, StructDecl>;
  /** Top-level constants, evaluated before main runs. */
  globals: Stmt[];
  entry: string;
}

// --------------------------------------------------------------------- values

export interface IntValue { t: "int"; v: bigint; width: number; signed: boolean }
export interface FloatValue { t: "float"; v: number }
export interface BoolValue { t: "bool"; v: boolean }
export interface CharValue { t: "char"; v: string }
export interface StrValue { t: "str"; v: string }
/**
 * The sequence type behind arrays, vectors, lists, stacks and deques alike.
 *
 * `kind` exists because the same underlying sequence answers to conflicting
 * method names: `ArrayDeque.push` adds to the *front* while `Stack.push` adds
 * to the *back*, and a dialect cannot tell them apart from the element type.
 * Nothing else looks at it — display, equality and iteration all ignore it, so
 * a deque still prints and compares as the list it is.
 */
export type SeqKind = "array" | "list" | "stack" | "deque";

export interface ListValue { t: "list"; v: Value[]; kind?: SeqKind }
export interface TupleValue { t: "tuple"; v: Value[] }
export interface UnitValue { t: "unit" }
export interface RangeValue { t: "range"; from: bigint; to: bigint; inclusive: boolean }
export interface StructValue { t: "struct"; name: string; fields: Map<string, Value> }
export interface EnumValue { t: "enum"; name: string; variant: string; payload: Value[] }
/**
 * HashMap/TreeMap/unordered_map/BTreeMap, keyed by `keyOf` so that structural
 * equality decides identity. The stored pair keeps the original key alongside
 * its value, because the key has to come back out intact when the map is
 * iterated — the string form is a lookup detail, not a value.
 *
 * `zero` is what a missing key reads as, and it is the whole difference between
 * `m[k]` in C++ or Go and `map.get(k)` in Java. In the first two, reading an
 * absent key inserts it and yields the value type's zero, which is what makes
 * `m[c]++` a complete frequency count; in the other two it is an error or a
 * null. Only the dialects with that behaviour set it, so a map without a `zero`
 * keeps throwing on a missing key and no language borrows another's semantics.
 */
export interface MapValue {
  t: "map";
  v: Map<string, [Value, Value]>;
  sorted: boolean;
  zero?: Value;
}
/** HashSet/TreeSet/unordered_set/BTreeSet. Keyed like a map, valued like a list. */
export interface SetValue { t: "set"; v: Map<string, Value>; sorted: boolean }
/**
 * A priority queue, kept as a real binary heap so that ties break the way the
 * language being taught breaks them rather than the way `Array.sort` would.
 * `order` is the natural direction; `cmp` overrides it when the program
 * supplied a comparator.
 */
export interface HeapValue { t: "heap"; v: Value[]; order: "min" | "max"; cmp?: ClosureValue }
/**
 * A lambda. `native` is set instead of `body` for the ones the standard
 * library builds rather than the program — `Comparator.comparingInt(...)`,
 * `Comparator.naturalOrder()`, `cmp.reversed()` — which have to be callable
 * exactly like a written lambda so that one comparator path serves both.
 */
export interface ClosureValue {
  t: "closure";
  params: string[];
  body: Expr;
  env: Env;
  native?: (args: Value[], ev: Evaluator, line: number) => Value;
}

export type Value =
  | IntValue | FloatValue | BoolValue | CharValue | StrValue
  | ListValue | TupleValue | UnitValue | RangeValue
  | StructValue | EnumValue | MapValue | SetValue | HeapValue | ClosureValue;

export const UNIT: UnitValue = { t: "unit" };

export function int(v: bigint, width = 32, signed = true): IntValue {
  return { t: "int", v, width, signed };
}

export function limits(width: number, signed: boolean): [bigint, bigint] {
  const bits = BigInt(width);
  return signed
    ? [-(1n << (bits - 1n)), (1n << (bits - 1n)) - 1n]
    : [0n, (1n << bits) - 1n];
}

// ----------------------------------------------------------------- evaluation

class BreakSignal { }
class ContinueSignal { }
class ReturnSignal { constructor(readonly value: Value) { } }

export class Env {
  private vars = new Map<string, { value: Value; mutable: boolean }>();
  constructor(readonly parent?: Env) { }

  declare(name: string, value: Value, mutable: boolean) {
    this.vars.set(name, { value, mutable });
  }

  lookup(name: string): { value: Value; mutable: boolean } | undefined {
    return this.vars.get(name) ?? this.parent?.lookup(name);
  }

  assign(name: string, value: Value, line: number) {
    const slot = this.vars.get(name);
    if (slot) {
      if (!slot.mutable) {
        throw new ProgramError(`cannot assign twice to immutable variable \`${name}\``, line);
      }
      slot.value = value;
      return;
    }
    if (this.parent) {
      this.parent.assign(name, value, line);
      return;
    }
    throw new ProgramError(`cannot find value \`${name}\` in this scope`, line);
  }
}

/** Everything a language front-end must supply to the shared evaluator. */
export interface Dialect {
  /** Which language this is, for error wording and overflow behaviour. */
  name: "rust" | "cpp" | "java" | "c" | "go";
  /**
   * Which grammar the parser should use. C is close enough to C++ that it
   * shares one, so the two differ only in their libraries and their output
   * formatting — which is where they actually differ. Go does not share one
   * with anybody: its declarations, loops and statements are its own.
   */
  parseAs?: "rust" | "cpp" | "java" | "go";
  /** Integer overflow: "panic" like Rust's debug profile, or "wrap". */
  overflow: "panic" | "wrap";
  /** Default width and signedness for an unsuffixed integer literal. */
  defaultInt: { width: number; signed: boolean };
  /** Renders a value the way this language's print statement would. */
  display(value: Value, debug: boolean): string;
  /**
   * Names the language defines before any user code runs — C's `INT_MAX` and
   * `NULL`, Go's `nil`. Declared into the global scope so they resolve as
   * ordinary identifiers rather than needing a lookup hook.
   */
  globals?: Record<string, Value>;
  /** Handles a free function call the evaluator does not know. */
  callBuiltin?(name: string, args: Value[], ev: Evaluator, line: number): Value | undefined;
  /** Handles a method call on a value. */
  callMethod?(target: Value, name: string, args: Value[], ev: Evaluator, line: number): Value | undefined;
  /** Resolves a path such as `i32::MAX` or `Integer.MAX_VALUE`. */
  resolvePath?(segments: string[], ev: Evaluator, line: number): Value | undefined;
  /** Handles a macro such as `println!`. */
  callMacro?(name: string, args: Expr[], ev: Evaluator, line: number): Value | undefined;
  /** Converts a value under an explicit cast (`as`, or a C-style cast). */
  cast?(value: Value, type: string, line: number): Value;
  /**
   * First refusal on a binary operator. C++ needs this so that `<<` on a
   * stream writes output instead of shifting an integer.
   */
  binaryOverride?(op: string, a: Value, b: Value, ev: Evaluator, line: number): Value | undefined;
}

export class Evaluator {
  readonly out: OutputSink;
  readonly program: Program;
  readonly dialect: Dialect;
  globals = new Env();
  /**
   * The scope currently being evaluated. Macros and builtins receive raw
   * expressions and have to evaluate them somewhere; this is that somewhere,
   * and it must be the caller's scope rather than the globals.
   */
  env: Env = this.globals;

  constructor(program: Program, dialect: Dialect, out: OutputSink) {
    this.program = program;
    this.dialect = dialect;
    this.out = out;
  }

  run(): void {
    for (const [name, value] of Object.entries(this.dialect.globals ?? {})) {
      this.globals.declare(name, value, false);
    }
    for (const stmt of this.program.globals) this.exec(stmt, this.globals);
    const main = this.program.functions.get(this.program.entry);
    if (!main) {
      throw new ProgramError(
        `no entry point: this runtime looks for \`${this.program.entry}\``
      );
    }
    // Java's `main` declares `String[] args`, and C++'s may declare argc/argv.
    // Nothing supplies command-line arguments here, so they arrive empty.
    const args: Value[] = main.params.map(() => ({ t: "list", v: [] }));
    this.callFunction(main, args, main.line);
  }

  /**
   * Runs `body` with `this.env` restored afterwards.
   *
   * Builtins and macros read `this.env` to evaluate the raw expressions they
   * were handed, so a call that left the callee's scope behind would make the
   * *next* argument resolve in the wrong place — `println!("{}", c.bump())`
   * would lose `c`.
   */
  private inScope<T>(body: () => T): T {
    const saved = this.env;
    try {
      return body();
    } finally {
      this.env = saved;
    }
  }

  /** Invokes a closure captured by `|x| ...`. */
  callClosure(fn: ClosureValue, args: Value[], line: number): Value {
    if (fn.native) return fn.native(args, this, line);
    return this.inScope(() => {
      const env = new Env(fn.env);
      fn.params.forEach((name, i) => env.declare(name, args[i] ?? UNIT, true));
      try {
        return this.eval(fn.body, env);
      } catch (signal) {
        // A block-bodied lambda returns with `return`, which unwinds as a
        // signal rather than a value. Rust's tail-expression closures never
        // raise one, so this only fires for the Java and C++ brace forms.
        if (signal instanceof ReturnSignal) return signal.value;
        throw signal;
      }
    });
  }

  callFunction(decl: FnDecl, args: Value[], line: number): Value {
    if (args.length !== decl.params.length) {
      throw new ProgramError(
        `\`${decl.name}\` takes ${decl.params.length} argument(s) but ${args.length} were supplied`,
        line
      );
    }
    return this.inScope(() => {
      const env = new Env(this.globals);
      decl.params.forEach((p, i) => env.declare(p.name, args[i], true));
      try {
        let last: Value = UNIT;
        for (const stmt of decl.body) last = this.exec(stmt, env);
        return last;
      } catch (signal) {
        if (signal instanceof ReturnSignal) return signal.value;
        throw signal;
      }
    });
  }

  // ------------------------------------------------------------- statements

  exec(stmt: Stmt, env: Env): Value {
    this.out.step();
    this.env = env;
    switch (stmt.k) {
      case "expr":
        this.eval(stmt.expr, env);
        return UNIT;
      case "tail":
        return this.eval(stmt.expr, env);
      case "let": {
        const value = stmt.init ? this.eval(stmt.init, env) : UNIT;
        // A `let` with no initialiser is assigned later, so the binding has to
        // accept exactly that one write.
        const mutable = stmt.mutable || !stmt.init;
        env.declare(stmt.name, this.coerceDeclared(value, stmt.type, stmt.line), mutable);
        return UNIT;
      }
      case "multi": {
        let last: Value = UNIT;
        for (const s of stmt.body) last = this.exec(s, env);
        return last;
      }
      case "block": {
        const inner = new Env(env);
        let last: Value = UNIT;
        for (const s of stmt.body) last = this.exec(s, inner);
        return last;
      }
      case "if": {
        if (this.truthy(this.eval(stmt.cond, env), stmt.line)) return this.exec(stmt.then, env);
        if (stmt.other) return this.exec(stmt.other, env);
        return UNIT;
      }
      case "while":
        while (this.truthy(this.eval(stmt.cond, env), stmt.line)) {
          this.out.step();
          try { this.exec(stmt.body, env); }
          catch (s) { if (s instanceof BreakSignal) break; if (!(s instanceof ContinueSignal)) throw s; }
        }
        return UNIT;
      case "doWhile":
        do {
          this.out.step();
          try { this.exec(stmt.body, env); }
          catch (s) { if (s instanceof BreakSignal) break; if (!(s instanceof ContinueSignal)) throw s; }
        } while (this.truthy(this.eval(stmt.cond, env), stmt.line));
        return UNIT;
      case "loop":
        for (;;) {
          this.out.step();
          try { this.exec(stmt.body, env); }
          catch (s) { if (s instanceof BreakSignal) break; if (!(s instanceof ContinueSignal)) throw s; }
        }
        return UNIT;
      case "forC": {
        const inner = new Env(env);
        if (stmt.init) this.exec(stmt.init, inner);
        while (!stmt.cond || this.truthy(this.eval(stmt.cond, inner), stmt.line)) {
          this.out.step();
          try { this.exec(stmt.body, inner); }
          catch (s) {
            if (s instanceof BreakSignal) break;
            if (!(s instanceof ContinueSignal)) throw s;
          }
          if (stmt.step) this.eval(stmt.step, inner);
        }
        return UNIT;
      }
      case "forIn": {
        const iterable = this.eval(stmt.iterable, env);
        // Go's `range` hands back the position first; everyone else's for-each
        // hands back the element. `iterate` already yields a map as key/value
        // pairs, so a map only has to be unpacked rather than counted.
        const positional = stmt.indexed === true || stmt.name2 !== undefined;
        const overMap = iterable.t === "map";
        let index = 0n;
        for (const item of this.iterate(iterable, stmt.line)) {
          this.out.step();
          const inner = new Env(env);
          if (!positional) {
            inner.declare(stmt.name, item, true);
          } else if (overMap) {
            const pair = item as TupleValue;
            inner.declare(stmt.name, pair.v[0], true);
            if (stmt.name2) inner.declare(stmt.name2, pair.v[1], true);
          } else {
            inner.declare(stmt.name, int(index, 64, true), true);
            if (stmt.name2) inner.declare(stmt.name2, item, true);
          }
          index++;
          try { this.exec(stmt.body, inner); }
          catch (s) {
            if (s instanceof BreakSignal) break;
            if (!(s instanceof ContinueSignal)) throw s;
          }
        }
        return UNIT;
      }
      case "return":
        throw new ReturnSignal(stmt.value ? this.eval(stmt.value, env) : UNIT);
      case "break":
        throw new BreakSignal();
      case "continue":
        throw new ContinueSignal();
    }
  }

  /** Applies an explicit type annotation to a freshly-declared value. */
  private coerceDeclared(value: Value, type: string | undefined, line: number): Value {
    if (!type || value.t !== "int") return value;
    const m = type.match(/^(i|u)(8|16|32|64|128)$/) ?? type.match(/^(usize|isize)$/);
    if (m) {
      const signed = type.startsWith("i");
      const width = type === "usize" || type === "isize" ? 64 : Number(type.slice(1));
      return this.checkedInt(value.v, width, signed, line);
    }
    if (type === "long") return this.checkedInt(value.v, 64, true, line);
    if (type === "int") return this.checkedInt(value.v, 32, true, line);
    if (type === "f64" || type === "f32" || type === "double" || type === "float") {
      return { t: "float", v: Number(value.v) };
    }
    return value;
  }

  // ------------------------------------------------------------ expressions

  eval(expr: Expr, env: Env): Value {
    this.out.step();
    this.env = env;
    switch (expr.k) {
      case "int":
        return this.checkedInt(expr.v, expr.width, expr.signed, expr.line);
      case "float":
        return { t: "float", v: expr.v };
      case "str":
        return { t: "str", v: expr.v };
      case "char":
        return { t: "char", v: expr.v };
      case "bool":
        return { t: "bool", v: expr.v };
      case "unit":
        return UNIT;
      case "ref":
        return this.eval(expr.value, env);
      case "name": {
        const slot = env.lookup(expr.name);
        if (slot) return slot.value;
        const viaPath = this.dialect.resolvePath?.([expr.name], this, expr.line);
        if (viaPath) return viaPath;
        /**
         * A function used as a value: C's function pointers (`qsort(a, n, s,
         * cmp)`), Rust's `sort_by_key(len)`, Java's method references. Wrapped
         * as a closure so that everything downstream — comparators especially —
         * sees the same kind of callable a lambda produces.
         */
        const fn = this.program.functions.get(expr.name);
        if (fn) {
          return nativeClosure(
            fn.params.map((p) => p.name),
            (args, ev, line) => ev.callFunction(fn, args, line)
          );
        }
        throw new ProgramError(`cannot find value \`${expr.name}\` in this scope`, expr.line);
      }
      case "path": {
        const resolved = this.dialect.resolvePath?.(expr.segments, this, expr.line);
        if (resolved) return resolved;
        throw new ProgramError(`cannot resolve \`${expr.segments.join("::")}\``, expr.line);
      }
      case "list": {
        if (expr.repeat) {
          const value = this.eval(expr.items[0], env);
          const count = Number(this.asInt(this.eval(expr.repeat, env), expr.line));
          return { t: "list", v: Array.from({ length: count }, () => structuredCopy(value)) };
        }
        return { t: "list", v: expr.items.map((e) => this.eval(e, env)) };
      }
      case "tuple":
        return { t: "tuple", v: expr.items.map((e) => this.eval(e, env)) };
      case "range": {
        const from = this.asInt(this.eval(expr.from, env), expr.line);
        const to = this.asInt(this.eval(expr.to, env), expr.line);
        return { t: "range", from, to, inclusive: expr.inclusive };
      }
      case "block": {
        const inner = new Env(env);
        let last: Value = UNIT;
        for (const s of expr.body) last = this.exec(s, inner);
        return last;
      }
      case "if":
        if (this.truthy(this.eval(expr.cond, env), expr.line)) return this.exec(expr.then, env);
        return expr.other ? this.exec(expr.other, env) : UNIT;
      case "unary": {
        const operand = this.eval(expr.operand, env);
        if (expr.op === "!") {
          if (operand.t === "bool") return { t: "bool", v: !operand.v };
          if (operand.t === "int") return this.checkedInt(~operand.v, operand.width, operand.signed, expr.line);
          throw new ProgramError("`!` needs a bool or an integer", expr.line);
        }
        if (expr.op === "-") {
          if (operand.t === "float") return { t: "float", v: -operand.v };
          if (operand.t === "int") return this.checkedInt(-operand.v, operand.width, operand.signed, expr.line);
          throw new ProgramError("`-` needs a number", expr.line);
        }
        if (expr.op === "~" && operand.t === "int") {
          return this.checkedInt(~operand.v, operand.width, operand.signed, expr.line);
        }
        /**
         * A C or C++ dereference. Pointers are modelled as sequences here, so
         * `*p` is the first element of one — and a pointer to a single value is
         * that value, which is what `*(int *)a` inside a `qsort` comparator
         * means.
         */
        if (expr.op === "*") {
          if (operand.t === "list") {
            if (operand.v.length === 0) {
              throw new ProgramError("dereferenced a pointer with nothing behind it", expr.line);
            }
            return operand.v[0];
          }
          return operand;
        }
        throw new UnsupportedError(`unary \`${expr.op}\``, expr.line);
      }
      case "binary":
        return this.binary(expr, env);
      case "ternary":
        return this.truthy(this.eval(expr.cond, env), expr.line)
          ? this.eval(expr.then, env)
          : this.eval(expr.other, env);
      case "assign": {
        const current = expr.op === "=" ? null : this.eval(expr.target, env);
        let value = this.eval(expr.value, env);
        if (current) {
          value = this.arith(expr.op.slice(0, -1), current, value, expr.line);
          // `x += 1` keeps x's own type, so a u8 at 255 overflows rather than
          // silently widening to the literal's type.
          if (current.t === "int" && value.t === "int") {
            value = this.checkedInt(value.v, current.width, current.signed, expr.line, expr.op.slice(0, -1));
          }
        }
        this.store(expr.target, value, env, expr.line);
        return value;
      }
      case "closure":
        return { t: "closure", params: expr.params, body: expr.body, env };
      case "incdec": {
        const current = this.eval(expr.target, env);
        const one = int(1n, current.t === "int" ? current.width : 32, current.t === "int" ? current.signed : true);
        const updated = this.arith(expr.op === "++" ? "+" : "-", current, one, expr.line);
        this.store(expr.target, updated, env, expr.line);
        return expr.prefix ? updated : current;
      }
      case "index": {
        const target = this.eval(expr.target, env);
        const index = this.eval(expr.index, env);
        return this.indexInto(target, index, expr.line);
      }
      case "field": {
        const target = this.eval(expr.target, env);
        if (target.t === "struct") {
          const value = target.fields.get(expr.name);
          if (!value) throw new ProgramError(`no field \`${expr.name}\` on \`${target.name}\``, expr.line);
          return value;
        }
        if (target.t === "tuple" && /^\d+$/.test(expr.name)) {
          const i = Number(expr.name);
          if (i >= target.v.length) throw new ProgramError(`tuple has no field ${i}`, expr.line);
          return target.v[i];
        }
        if (target.t === "list" && expr.name === "length") return int(BigInt(target.v.length));
        const viaMethod = this.dialect.callMethod?.(target, expr.name, [], this, expr.line);
        if (viaMethod) return viaMethod;
        throw new ProgramError(`no field \`${expr.name}\` on this value`, expr.line);
      }
      case "cast": {
        const value = this.eval(expr.value, env);
        if (!this.dialect.cast) throw new UnsupportedError("casts", expr.line);
        return this.dialect.cast(value, expr.type, expr.line);
      }
      case "struct": {
        const decl = this.program.structs.get(expr.name);
        if (!decl) throw new ProgramError(`cannot find struct \`${expr.name}\``, expr.line);
        const fields = new Map<string, Value>();
        for (const f of expr.fields) fields.set(f.name, this.eval(f.value, env));
        return { t: "struct", name: expr.name, fields };
      }
      case "macro": {
        const result = this.dialect.callMacro?.(expr.name, expr.args, this, expr.line);
        if (result) return result;
        throw new UnsupportedError(`the \`${expr.name}\` macro`, expr.line);
      }
      case "method": {
        const target = this.eval(expr.target, env);
        const args = expr.args.map((a) => this.eval(a, env));
        // A struct's own method wins over a builtin of the same name.
        if (target.t === "struct") {
          const decl = this.program.structs.get(target.name)?.methods.get(expr.name);
          if (decl) {
            return this.inScope(() => {
              const env2 = new Env(this.globals);
              env2.declare("self", target, true);
              env2.declare("this", target, true);
              decl.params.forEach((p, i) => env2.declare(p.name, args[i], true));
              try {
                let last: Value = UNIT;
                for (const s of decl.body) last = this.exec(s, env2);
                return last;
              } catch (signal) {
                if (signal instanceof ReturnSignal) return signal.value;
                throw signal;
              }
            });
          }
        }
        const builtin = this.dialect.callMethod?.(target, expr.name, args, this, expr.line);
        if (builtin !== undefined) return builtin;
        /**
         * A lambda invoked through its interface method. Java spells this
         * `apply`, `test`, `accept`, `get`, `compare` or `run` depending on
         * which functional interface the variable was typed as, and C++ spells
         * it `operator()` — none of which this interpreter tracks, because it
         * has no types to track them with. Any method call on a closure is
         * therefore a call to the closure.
         */
        if (target.t === "closure") return this.callClosure(target, args, expr.line);
        throw new UnsupportedError(`method \`${expr.name}\` on ${describe(target)}`, expr.line);
      }
      case "call": {
        if (expr.callee.k === "name") {
          // A closure bound to a name shadows a function of the same name.
          const slot = env.lookup(expr.callee.name);
          if (slot?.value.t === "closure") {
            return this.callClosure(slot.value, expr.args.map((a) => this.eval(a, env)), expr.line);
          }
          const decl = this.program.functions.get(expr.callee.name);
          if (decl) {
            return this.callFunction(decl, expr.args.map((a) => this.eval(a, env)), expr.line);
          }
        }
        const name = expr.callee.k === "name" ? expr.callee.name
          : expr.callee.k === "path" ? expr.callee.segments.join("::")
            : null;
        if (name) {
          const args = expr.args.map((a) => this.eval(a, env));
          const builtin = this.dialect.callBuiltin?.(name, args, this, expr.line);
          if (builtin !== undefined) return builtin;
          // A user function reachable by its last path segment.
          const short = name.split("::").pop()!;
          const decl = this.program.functions.get(short);
          if (decl) return this.callFunction(decl, args, expr.line);
          throw new UnsupportedError(`\`${name}\``, expr.line);
        }
        throw new UnsupportedError("this kind of call", expr.line);
      }
      case "match": {
        const subject = this.eval(expr.subject, env);
        for (const arm of expr.arms) {
          const inner = new Env(env);
          if (arm.pattern === null || this.matches(arm.pattern, subject, inner, expr.line)) {
            if (arm.guard && !this.truthy(this.eval(arm.guard, inner), expr.line)) continue;
            return this.eval(arm.body, inner);
          }
        }
        throw new ProgramError("no match arm matched, and there is no `_` arm", expr.line);
      }
    }
  }

  private matches(pattern: Pattern, value: Value, env: Env, line: number): boolean {
    switch (pattern.k) {
      case "lit": {
        const expected = this.eval(pattern.value, env);
        return equalValues(expected, value);
      }
      case "bind":
        if (pattern.name === "_") return true;
        env.declare(pattern.name, value, false);
        return true;
      case "or":
        return pattern.options.some((p) => this.matches(p, value, env, line));
      case "range": {
        const from = this.asInt(this.eval(pattern.from, env), line);
        const to = this.asInt(this.eval(pattern.to, env), line);
        const v = this.asInt(value, line);
        return v >= from && (pattern.inclusive ? v <= to : v < to);
      }
      case "variant": {
        if (value.t !== "enum") return false;
        const want = pattern.name.split("::").pop();
        if (value.variant !== want) return false;
        pattern.bindings.forEach((name, i) => {
          if (name !== "_") env.declare(name, value.payload[i] ?? UNIT, false);
        });
        return true;
      }
    }
  }

  private store(target: Expr, value: Value, env: Env, line: number) {
    if (target.k === "name") {
      env.assign(target.name, value, line);
      return;
    }
    if (target.k === "index") {
      const container = this.eval(target.target, env);
      const index = this.eval(target.index, env);
      if (container.t === "list") {
        const i = Number(this.asInt(index, line));
        if (i < 0 || i >= container.v.length) {
          throw new ProgramError(
            `index out of bounds: the len is ${container.v.length} but the index is ${i}`,
            line
          );
        }
        container.v[i] = value;
        return;
      }
      if (container.t === "map") {
        container.v.set(keyOf(index), [index, value]);
        return;
      }
      throw new ProgramError("cannot index-assign into this value", line);
    }
    if (target.k === "field") {
      const container = this.eval(target.target, env);
      if (container.t === "struct") {
        container.fields.set(target.name, value);
        return;
      }
    }
    /**
     * `*p = v`. Writing through a pointer only reaches the caller when the
     * pointer is a sequence, which is how C's out-parameters are passed — the
     * `int* returnSize` convention depends entirely on this. A pointer to a
     * bare scalar does not alias here, so that case assigns to the operand and
     * behaves like a local write.
     */
    if (target.k === "unary" && target.op === "*") {
      const pointee = this.eval(target.operand, env);
      if (pointee.t === "list") {
        if (pointee.v.length === 0) {
          throw new ProgramError("wrote through a pointer with nothing behind it", line);
        }
        pointee.v[0] = value;
        return;
      }
      this.store(target.operand, value, env, line);
      return;
    }
    throw new ProgramError("invalid assignment target", line);
  }

  indexInto(target: Value, index: Value, line: number): Value {
    if (target.t === "list") {
      const i = Number(this.asInt(index, line));
      if (i < 0 || i >= target.v.length) {
        throw new ProgramError(
          `index out of bounds: the len is ${target.v.length} but the index is ${i}`,
          line
        );
      }
      return target.v[i];
    }
    if (target.t === "map") {
      const found = target.v.get(keyOf(index));
      if (found) return found[1];
      // C++ and Go insert on a missing key rather than failing, so `m[k]++`
      // counts from zero. `structuredCopy` matters when the zero is itself a
      // container: `map<int, vector<int>> g; g[u].push_back(v);` must give each
      // key its own vector rather than sharing one.
      if (target.zero !== undefined) {
        const fresh = structuredCopy(target.zero);
        target.v.set(keyOf(index), [index, fresh]);
        return fresh;
      }
      throw new ProgramError("key not found", line);
    }
    if (target.t === "str") {
      const bytes = new TextEncoder().encode(target.v);
      if (index.t === "range") {
        const to = index.inclusive ? Number(index.to) + 1 : Number(index.to);
        const slice = bytes.slice(Number(index.from), to);
        return { t: "str", v: new TextDecoder().decode(slice) };
      }
      // Indexing a string means indexing its *bytes* in all three languages
      // that allow it — but they disagree about what comes back. Go yields a
      // `byte`, which prints as a number; C and C++ yield a `char`, which
      // prints as the character. Rust and Java have no such operator at all,
      // which is why they fall through to the refusal below.
      const name = this.dialect.name;
      if (name === "go" || name === "c" || name === "cpp") {
        const i = Number(this.asInt(index, line));
        if (i < 0 || i >= bytes.length) {
          throw new ProgramError(
            `index out of range [${i}] with length ${bytes.length}`,
            line
          );
        }
        return name === "go"
          ? int(BigInt(bytes[i]), 64, false)
          : { t: "char", v: String.fromCharCode(bytes[i]) };
      }
      throw new UnsupportedError("indexing a string by position", line);
    }
    throw new ProgramError(`cannot index ${describe(target)}`, line);
  }

  *iterate(value: Value, line: number): Generator<Value> {
    if (value.t === "range") {
      const end = value.inclusive ? value.to + 1n : value.to;
      for (let i = value.from; i < end; i++) yield int(i, 64, true);
      return;
    }
    if (value.t === "list") {
      yield* value.v;
      return;
    }
    if (value.t === "str") {
      for (const ch of value.v) yield { t: "char", v: ch };
      return;
    }
    if (value.t === "map") {
      for (const [k, v] of mapEntries(value)) yield { t: "tuple", v: [k, v] };
      return;
    }
    if (value.t === "set") {
      yield* setItems(value);
      return;
    }
    // Iterating a priority queue yields priority order. A real one yields the
    // backing array, but nothing correct may depend on that, and this at least
    // matches what draining it would give.
    if (value.t === "heap") {
      yield* heapDrained(value, heapComparator(value));
      return;
    }
    throw new ProgramError(`${describe(value)} is not iterable`, line);
  }

  private binary(expr: Expr & { k: "binary" }, env: Env): Value {
    if (expr.op === "&&") {
      const left = this.eval(expr.left, env);
      if (!this.truthy(left, expr.line)) return { t: "bool", v: false };
      return { t: "bool", v: this.truthy(this.eval(expr.right, env), expr.line) };
    }
    if (expr.op === "||") {
      const left = this.eval(expr.left, env);
      if (this.truthy(left, expr.line)) return { t: "bool", v: true };
      return { t: "bool", v: this.truthy(this.eval(expr.right, env), expr.line) };
    }
    return this.arith(expr.op, this.eval(expr.left, env), this.eval(expr.right, env), expr.line);
  }

  arith(op: string, a: Value, b: Value, line: number): Value {
    const overridden = this.dialect.binaryOverride?.(op, a, b, this, line);
    if (overridden !== undefined) return overridden;
    if (op === "==") return { t: "bool", v: equalValues(a, b) };
    if (op === "!=") return { t: "bool", v: !equalValues(a, b) };

    // String concatenation, where the language allows it.
    if (op === "+" && (a.t === "str" || b.t === "str")) {
      if (this.dialect.name === "rust" && b.t !== "str") {
        throw new ProgramError("cannot add a non-string to a String", line);
      }
      return { t: "str", v: this.dialect.display(a, false) + this.dialect.display(b, false) };
    }

    if (a.t === "float" || b.t === "float") {
      if (a.t === "int" && this.dialect.name === "rust") {
        throw new ProgramError("cannot add an integer to a float — Rust has no implicit conversion", line);
      }
      if (b.t === "int" && this.dialect.name === "rust") {
        throw new ProgramError("cannot mix integer and float operands — Rust has no implicit conversion", line);
      }
      const x = this.asFloat(a, line);
      const y = this.asFloat(b, line);
      switch (op) {
        case "+": return { t: "float", v: x + y };
        case "-": return { t: "float", v: x - y };
        case "*": return { t: "float", v: x * y };
        case "/": return { t: "float", v: x / y };
        case "%": return { t: "float", v: x % y };
        case "<": return { t: "bool", v: x < y };
        case "<=": return { t: "bool", v: x <= y };
        case ">": return { t: "bool", v: x > y };
        case ">=": return { t: "bool", v: x >= y };
      }
      throw new UnsupportedError(`\`${op}\` on floats`, line);
    }

    if (a.t === "bool" && b.t === "bool") {
      if (op === "&") return { t: "bool", v: a.v && b.v };
      if (op === "|") return { t: "bool", v: a.v || b.v };
      if (op === "^") return { t: "bool", v: a.v !== b.v };
    }

    if (a.t === "char" && b.t === "char") {
      const x = a.v.codePointAt(0)!;
      const y = b.v.codePointAt(0)!;
      switch (op) {
        case "<": return { t: "bool", v: x < y };
        case "<=": return { t: "bool", v: x <= y };
        case ">": return { t: "bool", v: x > y };
        case ">=": return { t: "bool", v: x >= y };
      }
    }

    const x = this.asInt(a, line);
    const y = this.asInt(b, line);
    switch (op) {
      case "<": return { t: "bool", v: x < y };
      case "<=": return { t: "bool", v: x <= y };
      case ">": return { t: "bool", v: x > y };
      case ">=": return { t: "bool", v: x >= y };
    }

    // Rust infers an unsuffixed literal to the type of the other operand, so a
    // narrower non-default operand wins over the 32-bit-signed default. That is
    // what makes `small + 1` overflow when `small` is a `u8` at 255.
    const aDefault = a.t !== "int" || (a.width === 32 && a.signed);
    const bDefault = b.t !== "int" || (b.width === 32 && b.signed);
    let width: number;
    let signed: boolean;
    if (aDefault && !bDefault && b.t === "int") {
      width = b.width;
      signed = b.signed;
    } else if (bDefault && !aDefault && a.t === "int") {
      width = a.width;
      signed = a.signed;
    } else {
      width = Math.max(a.t === "int" ? a.width : 32, b.t === "int" ? b.width : 32);
      signed = a.t === "int" ? a.signed : b.t === "int" ? b.signed : true;
    }

    let result: bigint;
    switch (op) {
      case "+": result = x + y; break;
      case "-": result = x - y; break;
      case "*": result = x * y; break;
      case "/":
        if (y === 0n) throw new ProgramError("attempt to divide by zero", line);
        result = x / y; // truncates towards zero, as all three languages do
        break;
      case "%":
        if (y === 0n) throw new ProgramError("attempt to calculate the remainder with a divisor of zero", line);
        result = x % y;
        break;
      case "&": result = x & y; break;
      case "|": result = x | y; break;
      case "^": result = x ^ y; break;
      case "<<": result = x << y; break;
      case ">>": result = x >> y; break;
      default:
        throw new UnsupportedError(`operator \`${op}\``, line);
    }
    return this.checkedInt(result, width, signed, line, op);
  }

  /**
   * Applies the language's overflow policy. Rust panics — matching the debug
   * profile the track describes — while C++ and Java wrap.
   */
  checkedInt(v: bigint, width: number, signed: boolean, line: number, op?: string): IntValue {
    const [min, max] = limits(width, signed);
    if (v >= min && v <= max) return { t: "int", v, width, signed };
    if (this.dialect.overflow === "panic") {
      const verb = op === "+" ? "add" : op === "-" ? "subtract" : op === "*" ? "multiply" : "compute";
      throw new ProgramError(`attempt to ${verb} with overflow`, line);
    }
    const bits = BigInt(width);
    let wrapped = ((v % (1n << bits)) + (1n << bits)) % (1n << bits);
    if (signed && wrapped > max) wrapped -= 1n << bits;
    return { t: "int", v: wrapped, width, signed };
  }

  truthy(value: Value, line: number): boolean {
    if (value.t === "bool") return value.v;
    if (this.dialect.name === "rust") {
      throw new ProgramError(`expected \`bool\`, found ${describe(value)} — Rust has no truthiness`, line);
    }
    if (value.t === "int") return value.v !== 0n;
    throw new ProgramError(`expected a condition, found ${describe(value)}`, line);
  }

  asInt(value: Value, line: number): bigint {
    if (value.t === "int") return value.v;
    if (value.t === "bool") return value.v ? 1n : 0n;
    if (value.t === "char") return BigInt(value.v.codePointAt(0)!);
    if (value.t === "float") return BigInt(Math.trunc(value.v));
    throw new ProgramError(`expected an integer, found ${describe(value)}`, line);
  }

  asFloat(value: Value, line: number): number {
    if (value.t === "float") return value.v;
    if (value.t === "int") return Number(value.v);
    throw new ProgramError(`expected a number, found ${describe(value)}`, line);
  }
}

export function describe(value: Value): string {
  switch (value.t) {
    case "int": return `${value.signed ? "i" : "u"}${value.width}`;
    case "float": return "a float";
    case "bool": return "`bool`";
    case "char": return "`char`";
    case "str": return "a string";
    case "list": return "a list";
    case "tuple": return "a tuple";
    case "map": return "a map";
    case "set": return "a set";
    case "heap": return "a priority queue";
    case "range": return "a range";
    case "struct": return `\`${value.name}\``;
    case "enum": return `\`${value.name}\``;
    case "closure": return "a closure";
    case "unit": return "`()`";
  }
}

export function equalValues(a: Value, b: Value): boolean {
  if (a.t === "int" && b.t === "int") return a.v === b.v;
  if (a.t === "float" || b.t === "float") {
    if ((a.t === "float" || a.t === "int") && (b.t === "float" || b.t === "int")) {
      return Number(a.v) === Number(b.v);
    }
  }
  if (a.t !== b.t) return false;
  switch (a.t) {
    case "bool": return a.v === (b as BoolValue).v;
    case "char": return a.v === (b as CharValue).v;
    case "str": return a.v === (b as StrValue).v;
    case "unit": return true;
    case "list": {
      const other = b as ListValue;
      return a.v.length === other.v.length && a.v.every((x, i) => equalValues(x, other.v[i]));
    }
    case "tuple": {
      const other = b as TupleValue;
      return a.v.length === other.v.length && a.v.every((x, i) => equalValues(x, other.v[i]));
    }
    case "enum": {
      const other = b as EnumValue;
      return a.variant === other.variant &&
        a.payload.length === other.payload.length &&
        a.payload.every((x, i) => equalValues(x, other.payload[i]));
    }
    case "struct": {
      const other = b as StructValue;
      if (a.fields.size !== other.fields.size) return false;
      for (const [k, v] of a.fields) {
        const o = other.fields.get(k);
        if (!o || !equalValues(v, o)) return false;
      }
      return true;
    }
    // Set and map equality is by contents, never by order — which is the whole
    // point of them, and what every one of these languages promises.
    case "set": {
      const other = b as SetValue;
      if (a.v.size !== other.v.size) return false;
      for (const k of a.v.keys()) if (!other.v.has(k)) return false;
      return true;
    }
    case "map": {
      const other = b as MapValue;
      if (a.v.size !== other.v.size) return false;
      for (const [k, [, value]] of a.v) {
        const o = other.v.get(k);
        if (!o || !equalValues(value, o[1])) return false;
      }
      return true;
    }
    case "heap": {
      const other = b as HeapValue;
      if (a.v.length !== other.v.length) return false;
      const mine = heapDrained(a, heapComparator(a));
      const theirs = heapDrained(other, heapComparator(other));
      return mine.every((x, i) => equalValues(x, theirs[i]));
    }
    default:
      return false;
  }
}

/**
 * The identity a container keys on — two values collide exactly when the
 * language would treat them as the same key.
 *
 * Built structurally rather than with `JSON.stringify`, because a `struct`
 * holds its fields in a `Map` and a `Map` stringifies to `{}`: every struct of
 * a given name would have collapsed onto one key, which is the "wrong verdict
 * on correct code" failure this runtime exists to avoid.
 */
export function keyOf(value: Value): string {
  switch (value.t) {
    case "int": return "i:" + value.v.toString();
    case "str": return "s:" + value.v;
    case "char": return "c:" + value.v;
    case "bool": return "b:" + value.v;
    case "float": return "f:" + value.v;
    case "unit": return "u:";
    case "range": return `r:${value.from}:${value.to}:${value.inclusive}`;
    case "list": return "l:[" + value.v.map(keyOf).join(",") + "]";
    case "tuple": return "t:(" + value.v.map(keyOf).join(",") + ")";
    case "enum": return `e:${value.name}::${value.variant}(${value.payload.map(keyOf).join(",")})`;
    case "struct": {
      const fields = [...value.fields.entries()]
        .map(([name, field]) => `${name}=${keyOf(field)}`)
        .sort();
      return `S:${value.name}{${fields.join(",")}}`;
    }
    // Order must not matter, so the member keys are sorted before joining.
    case "set": return "H:{" + [...value.v.keys()].sort().join(",") + "}";
    case "map":
      return "M:{" + [...value.v.entries()]
        .map(([k, [, val]]) => `${k}=>${keyOf(val)}`)
        .sort()
        .join(",") + "}";
    case "heap": return "Q:[" + value.v.map(keyOf).sort().join(",") + "]";
    case "closure": return "fn:" + value.params.join(",");
  }
}

/**
 * Builds a callable the standard library implements itself.
 *
 * The `body` and `env` are never read — `callClosure` short-circuits on
 * `native` — but they keep the value a plain `ClosureValue`, so a native
 * comparator is indistinguishable from a written one everywhere else.
 */
export function nativeClosure(
  params: string[],
  fn: (args: Value[], ev: Evaluator, line: number) => Value
): ClosureValue {
  return {
    t: "closure",
    params,
    body: { k: "unit", line: 0 },
    env: new Env(),
    native: fn,
  };
}

/** Value semantics for containers: assignment copies, as C++ and Rust do. */
export function structuredCopy(value: Value): Value {
  switch (value.t) {
    case "list": return { t: "list", v: value.v.map(structuredCopy), kind: value.kind };
    case "tuple": return { t: "tuple", v: value.v.map(structuredCopy) };
    case "struct": {
      const fields = new Map<string, Value>();
      for (const [k, v] of value.fields) fields.set(k, structuredCopy(v));
      return { t: "struct", name: value.name, fields };
    }
    case "set": {
      const copy = new Map<string, Value>();
      for (const [k, v] of value.v) copy.set(k, structuredCopy(v));
      return { t: "set", v: copy, sorted: value.sorted };
    }
    case "map": {
      const copy = new Map<string, [Value, Value]>();
      for (const [k, [key, val]] of value.v) copy.set(k, [structuredCopy(key), structuredCopy(val)]);
      // `zero` travels with the copy: passing a map to a function must not
      // change whether reading a missing key out of it works.
      return { t: "map", v: copy, sorted: value.sorted, zero: value.zero };
    }
    case "heap":
      return { t: "heap", v: value.v.map(structuredCopy), order: value.order, cmp: value.cmp };
    default:
      return value;
  }
}

// ----------------------------------------------------------------- collections

/**
 * Natural ordering, for the sorted containers and for a heap with no
 * comparator. Returns a negative number, zero, or a positive one.
 *
 * Mixed types never arise from a well-typed program in any of these languages,
 * so the fallback only has to be *stable* rather than meaningful — comparing by
 * the key string keeps a sorted container deterministic instead of letting the
 * order depend on insertion.
 */
export function compareValues(a: Value, b: Value): number {
  if (a.t === "int" && b.t === "int") return a.v < b.v ? -1 : a.v > b.v ? 1 : 0;
  if ((a.t === "int" || a.t === "float") && (b.t === "int" || b.t === "float")) {
    const x = Number(a.v);
    const y = Number(b.v);
    return x < y ? -1 : x > y ? 1 : 0;
  }
  if (a.t === "str" && b.t === "str") return a.v < b.v ? -1 : a.v > b.v ? 1 : 0;
  if (a.t === "char" && b.t === "char") return a.v < b.v ? -1 : a.v > b.v ? 1 : 0;
  if (a.t === "bool" && b.t === "bool") return Number(a.v) - Number(b.v);
  // Tuples and lists compare lexicographically, which is what every one of
  // these languages does for a pair or an array of comparables.
  if ((a.t === "tuple" && b.t === "tuple") || (a.t === "list" && b.t === "list")) {
    const n = Math.min(a.v.length, b.v.length);
    for (let i = 0; i < n; i++) {
      const c = compareValues(a.v[i], b.v[i]);
      if (c !== 0) return c;
    }
    return a.v.length - b.v.length;
  }
  const ka = keyOf(a);
  const kb = keyOf(b);
  return ka < kb ? -1 : ka > kb ? 1 : 0;
}

export function makeSet(sorted: boolean, items: Value[] = []): SetValue {
  const set: SetValue = { t: "set", v: new Map(), sorted };
  for (const item of items) set.v.set(keyOf(item), item);
  return set;
}

/**
 * The elements in the order the container would produce them: insertion order
 * for a hash container, ascending for a sorted one.
 *
 * A real `HashSet` iterates in an order determined by hash codes, which is
 * neither insertion order nor sorted. Reproducing that would be teaching a
 * detail no correct program may depend on, so insertion order stands in — the
 * one thing it must not do is *look* sorted, or a learner would come away
 * believing a `HashSet` is ordered.
 */
export function setItems(set: SetValue): Value[] {
  const items = [...set.v.values()];
  return set.sorted ? items.sort(compareValues) : items;
}

export function mapEntries(map: MapValue): [Value, Value][] {
  const entries = [...map.v.values()];
  return map.sorted ? entries.sort((a, b) => compareValues(a[0], b[0])) : entries;
}

export function makeHeap(order: "min" | "max", cmp?: ClosureValue): HeapValue {
  return { t: "heap", v: [], order, cmp };
}

/**
 * A heap needs to call a user comparator, which means it needs the evaluator.
 * Rather than thread one through every call site, the dialect binds this once
 * and hands the heap operations a plain comparison function.
 */
export type Comparator = (a: Value, b: Value) => number;

export function heapComparator(heap: HeapValue, callCmp?: Comparator): Comparator {
  if (heap.cmp && callCmp) return callCmp;
  return heap.order === "min"
    ? compareValues
    : (a, b) => -compareValues(a, b);
}

export function heapPush(heap: HeapValue, value: Value, cmp: Comparator): void {
  heap.v.push(value);
  let i = heap.v.length - 1;
  while (i > 0) {
    const parent = (i - 1) >> 1;
    if (cmp(heap.v[i], heap.v[parent]) >= 0) break;
    [heap.v[i], heap.v[parent]] = [heap.v[parent], heap.v[i]];
    i = parent;
  }
}

export function heapPop(heap: HeapValue, cmp: Comparator): Value | undefined {
  if (heap.v.length === 0) return undefined;
  const top = heap.v[0];
  const last = heap.v.pop()!;
  if (heap.v.length > 0) {
    heap.v[0] = last;
    let i = 0;
    for (;;) {
      const left = 2 * i + 1;
      const right = left + 1;
      let best = i;
      if (left < heap.v.length && cmp(heap.v[left], heap.v[best]) < 0) best = left;
      if (right < heap.v.length && cmp(heap.v[right], heap.v[best]) < 0) best = right;
      if (best === i) break;
      [heap.v[i], heap.v[best]] = [heap.v[best], heap.v[i]];
      i = best;
    }
  }
  return top;
}

/**
 * Every element in priority order, without disturbing the heap.
 *
 * Only for printing and iteration. A real `PriorityQueue.toString` shows the
 * backing array rather than sorted order, but showing the array teaches the
 * reader that a heap is sorted-ish when it is not, and showing sorted order at
 * least matches what popping repeatedly would give.
 */
export function heapDrained(heap: HeapValue, cmp: Comparator): Value[] {
  const copy: HeapValue = { t: "heap", v: [...heap.v], order: heap.order, cmp: heap.cmp };
  const out: Value[] = [];
  for (;;) {
    const next = heapPop(copy, cmp);
    if (next === undefined) break;
    out.push(next);
  }
  return out;
}
