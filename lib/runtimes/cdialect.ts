/**
 * The C front-end.
 *
 * C's grammar is close enough to C++'s that the two share a parser; what
 * differs is everything above it — `printf` instead of `cout`, `char *` instead
 * of `std::string`, `malloc` instead of `new`, and a standard library that is a
 * flat list of functions rather than a set of containers.
 *
 * Two decisions worth stating, because both are visible from a program:
 *
 * **Pointers are arrays.** There is no address space here, so `int *p` holds a
 * sequence and `p[i]` indexes it. That covers what C is used for in this
 * track — arrays, strings, and buffers from `malloc` — and stops short of
 * pointer arithmetic across objects, which fails loudly rather than guessing.
 *
 * **`sizeof` tells the truth.** It returns real byte sizes, so `sizeof(int)` is
 * 4, and `malloc(n * sizeof(int))` therefore allocates four times the slots the
 * program will use. Wasting slots costs nothing and keeps `printf("%zu",
 * sizeof(int))` honest, which the alternative — pretending every type is one
 * byte wide — would not.
 */
import {
  UNIT,
  compareValues,
  equalValues,
  int,
  structuredCopy,
  type ClosureValue,
  type Dialect,
  type ListValue,
  type Value,
} from "./lang";
import { asComparator, floorDiv, floorMod, sortInPlace } from "./stdlib";
import { ProgramError, UnsupportedError } from "./types";
import { execute } from "./dialects";

/* --------------------------------------------------------------- formatting */

/** `%g`-style default for `printf("%f")`'s cousins and for plain value display. */
function cDouble(v: number): string {
  if (Number.isNaN(v)) return "nan";
  if (!Number.isFinite(v)) return v > 0 ? "inf" : "-inf";
  if (Number.isInteger(v) && Math.abs(v) < 1e16) return v.toFixed(6);
  return String(v);
}

function cDisplay(value: Value): string {
  switch (value.t) {
    case "int": return value.v.toString();
    case "float": return cDouble(value.v);
    case "bool": return value.v ? "1" : "0";
    case "char": return value.v;
    case "str": return value.v;
    case "unit": return "";
    // C has no way to print an aggregate, so these only appear when a lesson
    // prints one deliberately through this runtime's own helpers.
    case "list": return `{${value.v.map(cDisplay).join(", ")}}`;
    case "tuple": return `(${value.v.map(cDisplay).join(", ")})`;
    case "map": return `{${[...value.v.values()].map(([k, v]) => `${cDisplay(k)}: ${cDisplay(v)}`).join(", ")}}`;
    case "set": return `{${[...value.v.values()].map(cDisplay).join(", ")}}`;
    case "heap": return `{${value.v.map(cDisplay).join(", ")}}`;
    case "range": return `${value.from}..${value.to}`;
    case "struct": return `${value.name}`;
    case "enum": return value.variant;
    case "closure": return "<function>";
  }
}

function asInt(value: Value, line: number): bigint {
  if (value.t === "int") return value.v;
  if (value.t === "bool") return value.v ? 1n : 0n;
  if (value.t === "char") return BigInt(value.v.codePointAt(0) ?? 0);
  if (value.t === "float") return BigInt(Math.trunc(value.v));
  throw new ProgramError("expected a number", line);
}

function asNum(value: Value, line: number): number {
  if (value.t === "float") return value.v;
  return Number(asInt(value, line));
}

/**
 * `printf`, covering the conversions this track uses.
 *
 * Anything outside the table stops the program. A format string is a promise
 * about the output, and quietly dropping an unrecognised conversion would
 * produce output that differs from a real C program's — which is exactly the
 * silent wrongness this runtime is built to avoid.
 */
function cPrintf(args: Value[], line: number): string {
  const template = args[0];
  if (template?.t !== "str") throw new ProgramError("printf needs a format string", line);
  const rest = args.slice(1);
  let index = 0;
  let out = "";
  const spec = /%([-+ 0#]*)(\d+|\*)?(?:\.(\d+|\*))?(hh|h|ll|l|z|j|t|L)?([diouxXeEfgGcspn%])/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = spec.exec(template.v)) !== null) {
    out += template.v.slice(last, match.index);
    last = spec.lastIndex;
    const [, flags, widthRaw, precisionRaw, , conv] = match;

    if (conv === "%") { out += "%"; continue; }
    if (conv === "n") throw new UnsupportedError("the `%n` conversion", line);

    const width = widthRaw === "*" ? Number(asInt(rest[index++], line)) : widthRaw ? Number(widthRaw) : 0;
    const precision = precisionRaw === "*"
      ? Number(asInt(rest[index++], line))
      : precisionRaw !== undefined ? Number(precisionRaw) : undefined;

    const value = rest[index++];
    if (value === undefined) throw new ProgramError("not enough arguments for printf", line);

    let text: string;
    switch (conv) {
      case "d": case "i": text = asInt(value, line).toString(); break;
      case "u": text = BigInt.asUintN(64, asInt(value, line)).toString(); break;
      case "o": text = asInt(value, line).toString(8); break;
      case "x": text = BigInt.asUintN(64, asInt(value, line)).toString(16); break;
      case "X": text = BigInt.asUintN(64, asInt(value, line)).toString(16).toUpperCase(); break;
      case "f": text = asNum(value, line).toFixed(precision ?? 6); break;
      // C pads the exponent to at least two digits — `1.23e+04`, not `1.23e+4`,
      // which is what JavaScript's toExponential produces.
      case "e": text = cExponent(asNum(value, line), precision ?? 6); break;
      case "E": text = cExponent(asNum(value, line), precision ?? 6).toUpperCase(); break;
      case "g": case "G": {
        const n = asNum(value, line);
        text = String(Number(n.toPrecision(precision ?? 6)));
        if (conv === "G") text = text.toUpperCase();
        break;
      }
      case "c": text = value.t === "char" ? value.v : String.fromCodePoint(Number(asInt(value, line))); break;
      case "s": {
        // Through `stringOf`, so a `char[]` stops at its NUL terminator the way
        // it does in a real program rather than printing the padding after it.
        text = stringOf(value, line);
        if (precision !== undefined) text = text.slice(0, precision);
        break;
      }
      case "p": text = "0x" + BigInt.asUintN(64, asInt(value, line)).toString(16); break;
      default: throw new UnsupportedError(`the \`%${conv}\` conversion`, line);
    }

    if (flags.includes("+") && /^[di]$/.test(conv) && !text.startsWith("-")) text = "+" + text;
    if (width > text.length) {
      if (flags.includes("-")) text = text.padEnd(width);
      else if (flags.includes("0") && "dioxXufeEgG".includes(conv)) {
        const negative = text.startsWith("-");
        const body = negative ? text.slice(1) : text;
        text = (negative ? "-" : "") + body.padStart(width - (negative ? 1 : 0), "0");
      } else text = text.padStart(width);
    }
    out += text;
  }
  return out + template.v.slice(last);
}

/** `%e`, with the two-digit minimum exponent C requires. */
function cExponent(value: number, precision: number): string {
  return value
    .toExponential(precision)
    .replace(/e([+-])(\d)$/, "e$10$2");
}

/** The bytes of a C string, as a NUL-terminated view would see them. */
function stringOf(value: Value, line: number): string {
  if (value.t === "str") return value.v;
  if (value.t === "char") return value.v;
  if (value.t === "list") {
    // A `char[]` stops at the first NUL, as every str* function does.
    const chars: string[] = [];
    for (const item of value.v) {
      const ch = item.t === "char" ? item.v : String.fromCodePoint(Number(asInt(item, line)));
      if (ch === "\0") break;
      chars.push(ch);
    }
    return chars.join("");
  }
  throw new ProgramError("expected a string", line);
}

function charList(text: string): ListValue {
  return {
    t: "list",
    v: [...text].map((ch) => ({ t: "char" as const, v: ch })).concat([{ t: "char", v: "\0" }]),
    kind: "array",
  };
}

/** How many slots `malloc`/`calloc` should hand back for a byte count. */
function allocate(bytes: number): ListValue {
  const slots = Math.max(0, Math.floor(bytes));
  return { t: "list", v: Array.from({ length: slots }, () => int(0n, 32, true)), kind: "array" };
}

const SIZEOF: Record<string, number> = {
  char: 1, "signed char": 1, "unsigned char": 1, bool: 1, _Bool: 1,
  short: 2, "unsigned short": 2,
  int: 4, "unsigned": 4, "unsigned int": 4, float: 4,
  long: 8, "unsigned long": 8, "long long": 8, "unsigned long long": 8,
  double: 8, size_t: 8, "long double": 16,
};

/**
 * The names C defines before any program runs.
 *
 * Declared above `cDialect` because the dialect object captures it at module
 * evaluation time — below it, this would be in the temporal dead zone.
 */
export const C_LIMITS: Record<string, Value> = {
  INT_MAX: int(2147483647n, 32, true),
  INT_MIN: int(-2147483648n, 32, true),
  LONG_MAX: int(9223372036854775807n, 64, true),
  LONG_MIN: int(-9223372036854775808n, 64, true),
  LLONG_MAX: int(9223372036854775807n, 64, true),
  LLONG_MIN: int(-9223372036854775808n, 64, true),
  UINT_MAX: int(4294967295n, 32, false),
  CHAR_MAX: int(127n, 8, true),
  CHAR_MIN: int(-128n, 8, true),
  SHRT_MAX: int(32767n, 16, true),
  SHRT_MIN: int(-32768n, 16, true),
  RAND_MAX: int(2147483647n, 32, true),
  EXIT_SUCCESS: int(0n, 32, true),
  EXIT_FAILURE: int(1n, 32, true),
  NULL: UNIT,
  stdout: { t: "str", v: "stdout" },
  stderr: { t: "str", v: "stderr" },
  M_PI: { t: "float", v: Math.PI },
  M_E: { t: "float", v: Math.E },
};

/* ------------------------------------------------------------------ dialect */

export const cDialect: Dialect = {
  name: "c",
  parseAs: "cpp",
  overflow: "wrap",
  defaultInt: { width: 32, signed: true },
  display: (value) => cDisplay(value),
  globals: C_LIMITS,

  cast(value, type, line) {
    const bare = type.replace(/\bconst\b/g, "").replace(/[*&]/g, "").trim();
    if (/^(int|short|signed|unsigned|long|size_t|char|_Bool|bool)/.test(bare)) {
      if (bare.startsWith("char")) {
        return { t: "char", v: String.fromCodePoint(Number(asInt(value, line))) };
      }
      const width = /long/.test(bare) || bare === "size_t" ? 64 : bare.startsWith("short") ? 16 : 32;
      const signed = !/unsigned|size_t/.test(bare);
      return { t: "int", v: asInt(value, line), width, signed };
    }
    if (/^(float|double)/.test(bare)) return { t: "float", v: asNum(value, line) };
    throw new UnsupportedError(`casting to \`${type}\``, line);
  },

  resolvePath(segments) {
    // C has no namespaces, so a dotted path can only be a struct field access,
    // which the evaluator handles. Limits are plain identifiers instead.
    void segments;
    return undefined;
  },

  callBuiltin(name, args, ev, line) {
    switch (name) {
      /* ----------------------------------------------------------- sizeof */
      case "__sizeof":
        return int(BigInt(sizeofC(args[0].t === "str" ? args[0].v : "int")), 64, false);
      case "__sizeof_value":
        return int(BigInt(sizeofValue(args[0])), 64, false);

      /* ---------------------------------------------------------- stdio.h */
      case "printf":
        ev.out.write(cPrintf(args, line));
        return int(BigInt(cPrintf(args, line).length), 32, true);
      case "puts":
        ev.out.write(stringOf(args[0], line) + "\n");
        return int(0n, 32, true);
      case "putchar":
        ev.out.write(args[0].t === "char" ? args[0].v : String.fromCodePoint(Number(asInt(args[0], line))));
        return args[0];
      case "fprintf": {
        // The first argument is the stream. `stderr` resolves to a name this
        // runtime does not bind, so anything that is not `stdout` is stderr.
        const body = cPrintf(args.slice(1), line);
        if (args[0].t === "str" && args[0].v === "stdout") ev.out.write(body);
        else ev.out.note("error", body.replace(/\n$/, ""));
        return int(BigInt(body.length), 32, true);
      }
      case "sprintf": {
        const body = cPrintf(args.slice(1), line);
        if (args[0].t === "list") {
          args[0].v.length = 0;
          args[0].v.push(...charList(body).v);
        }
        return int(BigInt(body.length), 32, true);
      }
      case "snprintf": {
        const body = cPrintf(args.slice(2), line);
        if (args[0].t === "list") {
          args[0].v.length = 0;
          args[0].v.push(...charList(body.slice(0, Math.max(0, Number(asInt(args[1], line)) - 1))).v);
        }
        return int(BigInt(body.length), 32, true);
      }
      case "scanf":
      case "fscanf":
      case "gets":
      case "fgets":
        throw new UnsupportedError("reading from standard input (there is no stdin here)", line);

      /* --------------------------------------------------------- stdlib.h */
      case "malloc":
        return allocate(Number(asInt(args[0], line)));
      case "calloc":
        return allocate(Number(asInt(args[0], line)) * Number(asInt(args[1], line)));
      case "realloc": {
        const grown = allocate(Number(asInt(args[1], line)));
        if (args[0].t === "list") {
          for (let i = 0; i < Math.min(args[0].v.length, grown.v.length); i++) grown.v[i] = args[0].v[i];
        }
        return grown;
      }
      case "free":
        // Nothing to release: the host collects these. Accepting the call is
        // right — a correct C program must call it, and refusing would reject
        // correct code.
        return UNIT;
      case "abs":
      case "labs":
      case "llabs": {
        const v = asInt(args[0], line);
        return int(v < 0n ? -v : v, name === "abs" ? 32 : 64, true);
      }
      case "atoi":
      case "atol": {
        const parsed = parseInt(stringOf(args[0], line), 10);
        return int(BigInt(Number.isNaN(parsed) ? 0 : parsed), name === "atoi" ? 32 : 64, true);
      }
      case "atof":
        return { t: "float", v: Number(stringOf(args[0], line)) || 0 };
      case "exit":
        throw new ProgramError(`exited with status ${asInt(args[0], line)}`, line);
      case "qsort": {
        // `qsort(base, count, size, cmp)` — the element size is irrelevant
        // here because the array holds values rather than bytes.
        if (args[0].t !== "list") throw new ProgramError("qsort expects an array", line);
        const count = Number(asInt(args[1], line));
        const cmp = asComparator(ev, args[3], line);
        const head = args[0].v.slice(0, count);
        sortInPlace(head, cmp);
        for (let i = 0; i < head.length; i++) args[0].v[i] = head[i];
        return UNIT;
      }

      /* --------------------------------------------------------- string.h */
      case "strlen":
        return int(BigInt(stringOf(args[0], line).length), 64, false);
      case "strcmp":
      case "strncmp": {
        let a = stringOf(args[0], line);
        let b = stringOf(args[1], line);
        if (name === "strncmp") {
          const n = Number(asInt(args[2], line));
          a = a.slice(0, n);
          b = b.slice(0, n);
        }
        return int(BigInt(a < b ? -1 : a > b ? 1 : 0), 32, true);
      }
      case "strcpy":
      case "strncpy": {
        const source = stringOf(args[1], line);
        const text = name === "strncpy" ? source.slice(0, Number(asInt(args[2], line))) : source;
        if (args[0].t !== "list") throw new ProgramError("strcpy expects a writable buffer", line);
        args[0].v.length = 0;
        args[0].v.push(...charList(text).v);
        return args[0];
      }
      case "strcat": {
        if (args[0].t !== "list") throw new ProgramError("strcat expects a writable buffer", line);
        const joined = stringOf(args[0], line) + stringOf(args[1], line);
        args[0].v.length = 0;
        args[0].v.push(...charList(joined).v);
        return args[0];
      }
      case "strchr": {
        const haystack = stringOf(args[0], line);
        const needle = args[1].t === "char" ? args[1].v : String.fromCodePoint(Number(asInt(args[1], line)));
        const at = haystack.indexOf(needle);
        return at === -1 ? UNIT : charList(haystack.slice(at));
      }
      case "strstr": {
        const haystack = stringOf(args[0], line);
        const at = haystack.indexOf(stringOf(args[1], line));
        return at === -1 ? UNIT : charList(haystack.slice(at));
      }
      case "memset": {
        if (args[0].t !== "list") throw new ProgramError("memset expects a buffer", line);
        const fill = asInt(args[1], line);
        const count = Number(asInt(args[2], line));
        for (let i = 0; i < Math.min(count, args[0].v.length); i++) {
          args[0].v[i] = args[0].v[i]?.t === "char"
            ? { t: "char", v: String.fromCodePoint(Number(fill)) }
            : int(fill, 32, true);
        }
        return args[0];
      }
      case "memcpy": {
        if (args[0].t !== "list" || args[1].t !== "list") {
          throw new ProgramError("memcpy expects two buffers", line);
        }
        const count = Number(asInt(args[2], line));
        for (let i = 0; i < Math.min(count, args[1].v.length); i++) {
          args[0].v[i] = structuredCopy(args[1].v[i]);
        }
        return args[0];
      }

      /* ----------------------------------------------------------- ctype.h */
      case "isdigit": return int(/^[0-9]$/.test(charOf(args[0], line)) ? 1n : 0n, 32, true);
      case "isalpha": return int(/^[A-Za-z]$/.test(charOf(args[0], line)) ? 1n : 0n, 32, true);
      case "isalnum": return int(/^[A-Za-z0-9]$/.test(charOf(args[0], line)) ? 1n : 0n, 32, true);
      case "isspace": return int(/^\s$/.test(charOf(args[0], line)) ? 1n : 0n, 32, true);
      case "isupper": return int(/^[A-Z]$/.test(charOf(args[0], line)) ? 1n : 0n, 32, true);
      case "islower": return int(/^[a-z]$/.test(charOf(args[0], line)) ? 1n : 0n, 32, true);
      case "toupper": {
        const ch = charOf(args[0], line).toUpperCase();
        return args[0].t === "char" ? { t: "char", v: ch } : int(BigInt(ch.charCodeAt(0)), 32, true);
      }
      case "tolower": {
        const ch = charOf(args[0], line).toLowerCase();
        return args[0].t === "char" ? { t: "char", v: ch } : int(BigInt(ch.charCodeAt(0)), 32, true);
      }

      /* ------------------------------------------------------------ math.h */
      case "sqrt": return { t: "float", v: Math.sqrt(asNum(args[0], line)) };
      case "cbrt": return { t: "float", v: Math.cbrt(asNum(args[0], line)) };
      case "pow": return { t: "float", v: Math.pow(asNum(args[0], line), asNum(args[1], line)) };
      case "fabs": return { t: "float", v: Math.abs(asNum(args[0], line)) };
      case "floor": return { t: "float", v: Math.floor(asNum(args[0], line)) };
      case "ceil": return { t: "float", v: Math.ceil(asNum(args[0], line)) };
      case "round": return { t: "float", v: Math.round(asNum(args[0], line)) };
      case "log": return { t: "float", v: Math.log(asNum(args[0], line)) };
      case "log2": return { t: "float", v: Math.log2(asNum(args[0], line)) };
      case "log10": return { t: "float", v: Math.log10(asNum(args[0], line)) };
      case "exp": return { t: "float", v: Math.exp(asNum(args[0], line)) };
      case "fmax": return { t: "float", v: Math.max(asNum(args[0], line), asNum(args[1], line)) };
      case "fmin": return { t: "float", v: Math.min(asNum(args[0], line), asNum(args[1], line)) };
      case "fmod": return { t: "float", v: asNum(args[0], line) % asNum(args[1], line) };
      case "div": return int(floorDiv(asInt(args[0], line), asInt(args[1], line), line), 64, true);
      case "imod": return int(floorMod(asInt(args[0], line), asInt(args[1], line), line), 64, true);
    }
    return undefined;
  },

  callMethod(target, name, args, ev, line) {
    // C has no methods. The one thing that reaches here is a call through a
    // function pointer stored in a struct field, which the evaluator has
    // already resolved to a closure.
    if (target.t === "closure") return ev.callClosure(target as ClosureValue, args, line);
    void name;
    return undefined;
  },
};

function charOf(value: Value, line: number): string {
  if (value.t === "char") return value.v;
  return String.fromCodePoint(Number(asInt(value, line)));
}

/** Exported for the evaluator's `sizeof`, and for tests. */
export function sizeofC(type: string): number {
  const bare = type.replace(/\bconst\b/g, "").trim();
  if (bare.endsWith("*")) return 8;
  return SIZEOF[bare] ?? 4;
}


/** `sizeof x` — the width of the value rather than of a named type. */
function sizeofValue(value: Value): number {
  switch (value.t) {
    case "char": return 1;
    case "bool": return 1;
    case "float": return 8;
    case "int": return value.width / 8;
    case "str": return value.v.length + 1;
    case "list": return value.v.length * 4;
    default: return 8;
  }
}

void compareValues;
void equalValues;

export const runC = (source: string) => execute(source, cDialect);
