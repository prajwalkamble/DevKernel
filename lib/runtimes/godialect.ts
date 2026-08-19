/**
 * The Go front-end.
 *
 * Go's expressions are close enough to C's to share the Pratt parser, but
 * everything else about the language is its own: the type follows the name, one
 * keyword spells four kinds of loop, and there are no semicolons in the source
 * at all. Those live in the parser. What lives here is the library and the
 * formatting — and the formatting is the part a learner sees, so it is matched
 * to what `go run` actually prints rather than to what is convenient.
 *
 * Three behaviours are worth stating because a program can observe them:
 *
 * **`fmt` sorts map keys.** Printing a map gives `map[a:1 b:2]` in key order,
 * which real Go has done since 1.12 precisely so that output is reproducible.
 * Iterating one with `range` is a different matter — see below.
 *
 * **`range` over a map is insertion-ordered here**, where Go deliberately
 * randomises it. This is the one divergence that could hide a bug: a program
 * that depends on map order is wrong in Go and will look right here. It is also
 * unavoidable without a seeded shuffle, which would trade a hidden bug for a
 * flaky one, so the lessons teach the rule instead.
 *
 * **`append` mutates its argument.** Go's own aliasing after `append` is
 * unspecified — it depends on whether the backing array had spare capacity —
 * so no correct program may rely on it either way. Growing in place keeps
 * `xs = append(xs, v)` linear rather than quadratic, which matters more.
 */
import {
  Evaluator,
  UNIT,
  compareValues,
  int,
  keyOf,
  mapEntries,
  nativeClosure,
  setItems,
  structuredCopy,
  type ClosureValue,
  type Dialect,
  type ListValue,
  type MapValue,
  type Value,
} from "./lang";
import { mapPut, sortInPlace } from "./stdlib";
import { ProgramError, UnsupportedError } from "./types";
import { execute } from "./dialects";

/* -------------------------------------------------------------- formatting */

/**
 * `strconv.FormatFloat(v, 'g', -1, 64)`, which is what `%v` and `Println` use.
 *
 * The shortest decimal that round-trips, switching to an exponent outside
 * 1e-4 .. 1e21. JavaScript's own `String` switches at 1e-7 instead, so the
 * band between them — 0.00001 prints as `1e-05` in Go and `0.00001` in JS —
 * has to be handled rather than inherited.
 */
function goFloat(v: number): string {
  if (Number.isNaN(v)) return "NaN";
  if (!Number.isFinite(v)) return v > 0 ? "+Inf" : "-Inf";
  if (v === 0) return Object.is(v, -0) ? "-0" : "0";
  const exponent = Math.floor(Math.log10(Math.abs(v)));
  if (exponent < -4 || exponent >= 21) {
    const [mantissa, exp] = v.toExponential().split("e");
    const sign = exp.startsWith("-") ? "-" : "+";
    const digits = exp.replace(/^[+-]/, "").padStart(2, "0");
    return `${mantissa}e${sign}${digits}`;
  }
  return String(v);
}

/** `%v`: how `fmt` renders a value with no verb of its own. */
export function goDisplay(value: Value): string {
  switch (value.t) {
    case "int": return value.v.toString();
    case "float": return goFloat(value.v);
    case "bool": return String(value.v);
    // A `rune` and a `byte` are integers in Go; a value only reaches here as a
    // char when the program built one deliberately.
    case "char": return String(value.v.codePointAt(0) ?? 0);
    case "str": return value.v;
    case "unit": return "<nil>";
    case "list": return `[${value.v.map(goDisplay).join(" ")}]`;
    case "tuple": return `[${value.v.map(goDisplay).join(" ")}]`;
    // `fmt` sorts map keys so that printing one is reproducible.
    case "map":
      return `map[${mapEntries(value)
        .slice()
        .sort((a, b) => compareValues(a[0], b[0]))
        .map(([k, v]) => `${goDisplay(k)}:${goDisplay(v)}`)
        .join(" ")}]`;
    case "set": return `[${setItems(value).map(goDisplay).join(" ")}]`;
    case "heap": return `[${value.v.map(goDisplay).join(" ")}]`;
    case "range": return `[${value.from} ${value.to}]`;
    case "enum": return value.variant;
    case "struct":
      if (value.name === "__builder") return goDisplay(value.fields.get("text") ?? UNIT);
      return `{${[...value.fields.values()].map(goDisplay).join(" ")}}`;
    case "closure": return "<func>";
  }
}

/** `%#v`-ish: what `%q` does to a string, and what `Printf` needs for quoting. */
function goQuote(value: Value): string {
  if (value.t !== "str" && value.t !== "char") return goDisplay(value);
  const text = value.t === "str" ? value.v : value.v;
  const escaped = text
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")
    .replace(/\r/g, "\\r");
  return `"${escaped}"`;
}

function goTypeName(value: Value): string {
  switch (value.t) {
    case "int": return value.width === 64 ? "int" : "int";
    case "float": return "float64";
    case "bool": return "bool";
    case "str": return "string";
    case "char": return "int32";
    case "list": return `[]${value.v.length ? goTypeName(value.v[0]) : "interface {}"}`;
    case "map": {
      const first = mapEntries(value)[0];
      return first ? `map[${goTypeName(first[0])}]${goTypeName(first[1])}` : "map[string]interface {}";
    }
    case "struct": return `main.${value.name}`;
    case "unit": return "<nil>";
    default: return "interface {}";
  }
}

/** Pads a rendered field to a `%5d`-style width. */
function pad(text: string, flags: string, width: number): string {
  if (!width || text.length >= width) return text;
  if (flags.includes("-")) return text + " ".repeat(width - text.length);
  if (flags.includes("0") && /^[+-]?\d/.test(text)) {
    const sign = /^[+-]/.test(text) ? text[0] : "";
    const body = sign ? text.slice(1) : text;
    return sign + "0".repeat(width - text.length) + body;
  }
  return " ".repeat(width - text.length) + text;
}

/** `fmt.Printf` / `fmt.Sprintf`. */
function goPrintf(format: string, args: Value[], line: number): string {
  let out = "";
  let argIndex = 0;
  for (let i = 0; i < format.length; i++) {
    if (format[i] !== "%") {
      out += format[i];
      continue;
    }
    const spec = /^%([-+ #0]*)(\d*)(?:\.(\d+))?([a-zA-Z%])/.exec(format.slice(i));
    if (!spec) {
      out += "%";
      continue;
    }
    const [whole, flags, widthText, precisionText, verb] = spec;
    i += whole.length - 1;
    if (verb === "%") {
      out += "%";
      continue;
    }
    const width = widthText ? Number(widthText) : 0;
    const precision = precisionText === undefined ? undefined : Number(precisionText);
    const value = args[argIndex++];
    if (value === undefined) {
      out += "%!" + verb + "(MISSING)";
      continue;
    }
    let text: string;
    switch (verb) {
      case "d":
        text = asGoInt(value, line).toString();
        if (flags.includes("+") && !text.startsWith("-")) text = "+" + text;
        break;
      case "s":
        text = goDisplay(value);
        if (precision !== undefined) text = text.slice(0, precision);
        break;
      case "v":
        text = goDisplay(value);
        break;
      case "q":
        text = goQuote(value);
        break;
      case "t":
        text = String(value.t === "bool" ? value.v : goDisplay(value));
        break;
      case "c":
        text = String.fromCodePoint(Number(asGoInt(value, line)));
        break;
      case "f":
      case "F":
        text = numberOf(value, line).toFixed(precision ?? 6);
        if (flags.includes("+") && !text.startsWith("-")) text = "+" + text;
        break;
      case "e":
      case "E": {
        const exp = numberOf(value, line).toExponential(precision ?? 6);
        const [m, e] = exp.split("e");
        const sign = e.startsWith("-") ? "-" : "+";
        text = `${m}e${sign}${e.replace(/^[+-]/, "").padStart(2, "0")}`;
        if (verb === "E") text = text.toUpperCase();
        break;
      }
      case "g":
        text = goFloat(numberOf(value, line));
        break;
      case "b":
        text = asGoInt(value, line).toString(2);
        break;
      case "o":
        text = asGoInt(value, line).toString(8);
        break;
      case "x":
      case "X": {
        text = value.t === "str"
          ? [...value.v].map((ch) => ch.charCodeAt(0).toString(16).padStart(2, "0")).join("")
          : asGoInt(value, line).toString(16);
        if (verb === "X") text = text.toUpperCase();
        if (flags.includes("#")) text = "0x" + text;
        break;
      }
      case "T":
        text = goTypeName(value);
        break;
      default:
        throw new UnsupportedError(`the \`%${verb}\` verb`, line);
    }
    out += pad(text, flags, width);
  }
  return out;
}

/**
 * `fmt.Println`: every operand separated by a space, then a newline. `Print`
 * differs — it only inserts a space between two operands when neither is a
 * string — which is why the two are not the same function.
 */
function goPrint(args: Value[], spaced: boolean): string {
  if (spaced) return args.map(goDisplay).join(" ");
  let out = "";
  args.forEach((arg, i) => {
    if (i > 0 && args[i - 1].t !== "str" && arg.t !== "str") out += " ";
    out += goDisplay(arg);
  });
  return out;
}

/* ------------------------------------------------------------------ values */

function asGoInt(value: Value, line: number): bigint {
  if (value.t === "int") return value.v;
  if (value.t === "char") return BigInt(value.v.codePointAt(0)!);
  if (value.t === "bool") return value.v ? 1n : 0n;
  if (value.t === "float") return BigInt(Math.trunc(value.v));
  throw new ProgramError(`expected a number, found ${value.t}`, line);
}

function numberOf(value: Value, line: number): number {
  if (value.t === "float") return value.v;
  return Number(asGoInt(value, line));
}

function textOf(value: Value, line: number): string {
  if (value.t === "str") return value.v;
  if (value.t === "char") return value.v;
  throw new ProgramError(`expected a string, found ${value.t}`, line);
}

function listOf(value: Value, name: string, line: number): ListValue {
  if (value.t !== "list") throw new ProgramError(`\`${name}\` expects a slice`, line);
  return value;
}

/** The element type inside `[]T` / `map[K]V`, for a nested zero value. */
function elementType(type: string): string {
  if (type.startsWith("[]")) return type.slice(2);
  const sized = /^\[[^\]]*\](.*)$/.exec(type);
  if (sized) return sized[1];
  if (type.startsWith("map[")) {
    let depth = 0;
    for (let i = 3; i < type.length; i++) {
      if (type[i] === "[") depth++;
      else if (type[i] === "]" && --depth === 0) return type.slice(i + 1);
    }
  }
  return type;
}

function keyType(type: string): string {
  if (!type.startsWith("map[")) return "string";
  let depth = 0;
  for (let i = 3; i < type.length; i++) {
    if (type[i] === "[") depth++;
    else if (type[i] === "]" && --depth === 0) return type.slice(4, i);
  }
  return "string";
}

/**
 * A Go zero value.
 *
 * Every declared variable has one, and unlike C's it is always defined — which
 * is a thing the lessons teach, so it has to be true here too.
 */
function goZero(type: string, ev: Evaluator, line: number): Value {
  const bare = type.replace(/^\*/, "");
  if (type.startsWith("*")) return UNIT;
  if (bare.startsWith("[]")) return { t: "list", v: [] };
  const sized = /^\[(\d+)\](.*)$/.exec(bare);
  if (sized) {
    const count = Number(sized[1]);
    return { t: "list", v: Array.from({ length: count }, () => goZero(sized[2], ev, line)) };
  }
  if (bare.startsWith("map[")) {
    return { t: "map", v: new Map(), sorted: false, zero: goZero(elementType(bare), ev, line) };
  }
  switch (bare) {
    case "int": case "int64": case "int32": case "rune": case "int16": case "int8":
      return int(0n, bare === "int32" || bare === "rune" || bare === "int16" || bare === "int8" ? 32 : 64, true);
    case "uint": case "uint64": case "uint32": case "uint16": case "uint8": case "byte": case "uintptr":
      return int(0n, 64, false);
    case "float64": case "float32":
      return { t: "float", v: 0 };
    case "bool":
      return { t: "bool", v: false };
    case "string":
      return { t: "str", v: "" };
    case "any": case "error": case "interface {}":
      return UNIT;
    case "strings.Builder":
      return { t: "struct", name: "__builder", fields: new Map([["text", { t: "str", v: "" } as Value]]) };
  }
  // A named struct: every field gets its own zero, which is what makes
  // `var p Point` usable without initialising it.
  const decl = ev.program.structs.get(bare);
  if (decl) {
    const fields = new Map<string, Value>();
    for (const field of decl.fields) fields.set(field, int(0n, 64, true));
    return { t: "struct", name: bare, fields };
  }
  throw new UnsupportedError(`the type \`${type}\``, line);
}

/** Builds a composite literal once its elements have been evaluated. */
function goComposite(type: string, items: Value[], ev: Evaluator, line: number): Value {
  if (type.startsWith("map[")) {
    const map: MapValue = {
      t: "map",
      v: new Map(),
      sorted: false,
      zero: goZero(elementType(type), ev, line),
    };
    for (const item of items) {
      if (item.t !== "tuple") throw new ProgramError("a map literal needs `key: value` entries", line);
      mapPut(map, item.v[0], item.v[1]);
    }
    void keyType(type);
    return map;
  }
  if (type.startsWith("[]")) return { t: "list", v: items };
  const sized = /^\[(\d+)\]/.exec(type);
  if (sized) {
    const count = Number(sized[1]);
    const out = items.slice(0, count);
    while (out.length < count) out.push(goZero(elementType(type), ev, line));
    return { t: "list", v: out };
  }
  // A named struct, positionally or by field name.
  const decl = ev.program.structs.get(type);
  if (!decl) throw new UnsupportedError(`a literal of type \`${type}\``, line);
  const fields = new Map<string, Value>();
  for (const field of decl.fields) fields.set(field, int(0n, 64, true));
  items.forEach((item, i) => {
    if (item.t === "tuple" && item.v.length === 2 && item.v[0].t === "str") {
      fields.set(item.v[0].v, item.v[1]);
    } else {
      fields.set(decl.fields[i], item);
    }
  });
  return { t: "struct", name: type, fields };
}

/* ----------------------------------------------------------------- dialect */

export const goDialect: Dialect = {
  name: "go",
  parseAs: "go",
  // Go's integers wrap silently, and `int` is 64-bit on every platform the
  // language still supports.
  overflow: "wrap",
  defaultInt: { width: 64, signed: true },
  display: (value) => goDisplay(value),
  globals: { nil: UNIT },

  cast(value, type, line) {
    const bare = type.replace(/^\*/, "");
    if (bare === "string") {
      // `string(bs)` over a slice rebuilds the text; over an integer it is the
      // one rune with that code point.
      if (value.t === "list") {
        return { t: "str", v: value.v.map((v) => String.fromCodePoint(Number(asGoInt(v, line)))).join("") };
      }
      if (value.t === "int" || value.t === "char") {
        return { t: "str", v: String.fromCodePoint(Number(asGoInt(value, line))) };
      }
      return { t: "str", v: goDisplay(value) };
    }
    if (bare === "[]byte" || bare === "[]rune") {
      const text = textOf(value, line);
      const units = bare === "[]byte" ? [...new TextEncoder().encode(text)] : [...text].map((c) => c.codePointAt(0)!);
      return { t: "list", v: units.map((n) => int(BigInt(n), bare === "[]byte" ? 64 : 32, bare !== "[]byte")) };
    }
    if (/^(int|int8|int16|int32|int64|rune)$/.test(bare)) {
      const width = bare === "int32" || bare === "rune" ? 32 : bare === "int16" ? 16 : bare === "int8" ? 8 : 64;
      return { t: "int", v: asGoInt(value, line), width, signed: true };
    }
    if (/^(uint|uint8|uint16|uint32|uint64|byte|uintptr)$/.test(bare)) {
      return { t: "int", v: asGoInt(value, line), width: 64, signed: false };
    }
    if (/^float(32|64)$/.test(bare)) return { t: "float", v: numberOf(value, line) };
    if (bare === "bool") return { t: "bool", v: asGoInt(value, line) !== 0n };
    throw new UnsupportedError(`converting to \`${type}\``, line);
  },

  resolvePath(segments, ev, line) {
    const joined = segments.join("::");
    switch (joined) {
      case "math::MaxInt64": return int(9223372036854775807n, 64, true);
      case "math::MinInt64": return int(-9223372036854775808n, 64, true);
      case "math::MaxInt32": return int(2147483647n, 32, true);
      case "math::MinInt32": return int(-2147483648n, 32, true);
      case "math::MaxInt": return int(9223372036854775807n, 64, true);
      case "math::MinInt": return int(-9223372036854775808n, 64, true);
      case "math::Pi": return { t: "float", v: Math.PI };
      case "math::E": return { t: "float", v: Math.E };
      case "math::MaxFloat64": return { t: "float", v: Number.MAX_VALUE };
      case "math::Inf": return nativeClosure(["sign"], (args) => ({
        t: "float",
        v: Number(asGoInt(args[0], line)) >= 0 ? Infinity : -Infinity,
      }));
    }
    void ev;
    return undefined;
  },

  callBuiltin(name, args, ev, line) {
    switch (name) {
      /* ---- markers the parser emits ---- */
      case "__type":
      case "__default": {
        const type = args[0];
        if (type?.t !== "str") throw new ProgramError("malformed type", line);
        // A bare type is only ever handed to `make`, which reads the text back
        // out of the marker struct.
        if (name === "__type") {
          return { t: "struct", name: "__type", fields: new Map([["name", type as Value]]) };
        }
        return goZero(type.v, ev, line);
      }
      case "__composite": {
        const type = args[0];
        const items = args[1];
        if (type?.t !== "str" || items?.t !== "list") {
          throw new ProgramError("malformed composite literal", line);
        }
        return goComposite(type.v, items.v, ev, line);
      }
      // `v, ok := m[k]`, which an ordinary index cannot express: it yields the
      // zero value for a missing key and says nothing about whether it was
      // there.
      case "__comma_ok": {
        const container = args[0];
        if (container.t !== "map") {
          throw new ProgramError("the two-value form needs a map", line);
        }
        const found = container.v.get(keyOf(args[1]));
        return {
          t: "tuple",
          v: [found ? found[1] : (container.zero ?? UNIT), { t: "bool", v: found !== undefined }],
        };
      }

      /* ---- the built-in functions ---- */
      case "len": {
        const value = args[0];
        if (value.t === "str") return int(BigInt(new TextEncoder().encode(value.v).length), 64, true);
        if (value.t === "list") return int(BigInt(value.v.length), 64, true);
        if (value.t === "map") return int(BigInt(value.v.size), 64, true);
        if (value.t === "unit") return int(0n, 64, true);
        throw new ProgramError(`\`len\` does not apply to that value`, line);
      }
      case "cap": {
        const value = args[0];
        if (value.t === "list") return int(BigInt(value.v.length), 64, true);
        throw new ProgramError("`cap` expects a slice", line);
      }
      case "append": {
        const target = args[0];
        if (target.t === "unit") return { t: "list", v: args.slice(1) };
        const slice = listOf(target, "append", line);
        slice.v.push(...args.slice(1));
        return slice;
      }
      case "make": {
        const marker = args[0];
        const type = marker.t === "struct" && marker.name === "__type"
          ? (marker.fields.get("name") as { t: "str"; v: string } | undefined)?.v
          : undefined;
        if (!type) throw new ProgramError("`make` needs a type", line);
        if (type.startsWith("map[")) return goZero(type, ev, line);
        if (type.startsWith("[]")) {
          const count = args[1] ? Number(asGoInt(args[1], line)) : 0;
          const zero = goZero(elementType(type), ev, line);
          return { t: "list", v: Array.from({ length: count }, () => structuredCopy(zero)) };
        }
        throw new UnsupportedError(`\`make\` of \`${type}\``, line);
      }
      case "new": {
        const marker = args[0];
        const type = marker.t === "struct" && marker.name === "__type"
          ? (marker.fields.get("name") as { t: "str"; v: string } | undefined)?.v
          : undefined;
        if (!type) throw new ProgramError("`new` needs a type", line);
        return goZero(type, ev, line);
      }
      case "copy": {
        const dst = listOf(args[0], "copy", line);
        const src = args[1].t === "str"
          ? [...args[1].v].map((c) => int(BigInt(c.codePointAt(0)!), 64, false))
          : listOf(args[1], "copy", line).v;
        const n = Math.min(dst.v.length, src.length);
        for (let i = 0; i < n; i++) dst.v[i] = src[i];
        return int(BigInt(n), 64, true);
      }
      case "delete": {
        const map = args[0];
        if (map.t !== "map") throw new ProgramError("`delete` expects a map", line);
        map.v.delete(keyOf(args[1]));
        return UNIT;
      }
      case "panic":
        throw new ProgramError(`panic: ${goDisplay(args[0] ?? UNIT)}`, line);
      case "print":
        ev.out.write(goPrint(args, false));
        return UNIT;
      case "println":
        ev.out.write(goPrint(args, true) + "\n");
        return UNIT;
      case "min":
        return args.reduce((a, b) => (compareValues(a, b) <= 0 ? a : b));
      case "max":
        return args.reduce((a, b) => (compareValues(a, b) >= 0 ? a : b));

      /* ---- conversions spelled as calls ---- */
      case "int": case "int64":
        return { t: "int", v: asGoInt(args[0], line), width: 64, signed: true };
      case "int32": case "rune":
        return { t: "int", v: asGoInt(args[0], line), width: 32, signed: true };
      case "int8":
        return { t: "int", v: asGoInt(args[0], line), width: 8, signed: true };
      case "int16":
        return { t: "int", v: asGoInt(args[0], line), width: 16, signed: true };
      case "uint": case "uint64": case "uint32": case "uint8": case "byte":
        return { t: "int", v: asGoInt(args[0], line), width: 64, signed: false };
      case "float64": case "float32":
        return { t: "float", v: numberOf(args[0], line) };
      case "string":
        return goDialect.cast!(args[0], "string", line);
      case "bool":
        return { t: "bool", v: asGoInt(args[0], line) !== 0n };

      /* ---- fmt ---- */
      case "fmt::Println":
        ev.out.write(goPrint(args, true) + "\n");
        return UNIT;
      case "fmt::Print":
        ev.out.write(goPrint(args, false));
        return UNIT;
      case "fmt::Printf":
        ev.out.write(goPrintf(textOf(args[0], line), args.slice(1), line));
        return UNIT;
      case "fmt::Sprintf":
        return { t: "str", v: goPrintf(textOf(args[0], line), args.slice(1), line) };
      case "fmt::Sprint":
        return { t: "str", v: goPrint(args, false) };
      case "fmt::Sprintln":
        return { t: "str", v: goPrint(args, true) + "\n" };
      case "fmt::Errorf":
        return { t: "str", v: goPrintf(textOf(args[0], line), args.slice(1), line) };

      /* ---- sort ---- */
      case "sort::Ints":
      case "sort::Strings":
      case "sort::Float64s":
        sortInPlace(listOf(args[0], name, line).v, compareValues);
        return UNIT;
      case "sort::Slice":
      case "sort::SliceStable": {
        const slice = listOf(args[0], name, line);
        const less = args[1];
        if (less.t !== "closure") throw new ProgramError("`sort.Slice` needs a function", line);
        // The comparator is written against *positions* in the slice, so the
        // slice must not move while it runs. Sorting an index array and
        // permuting once at the end keeps every `less(i, j)` reading the
        // arrangement it was given.
        const order = slice.v.map((_, i) => int(BigInt(i), 64, true));
        sortInPlace(order, (a, b) => {
          const ab = ev.callClosure(less as ClosureValue, [a, b], line);
          if (ab.t === "bool" && ab.v) return -1;
          const ba = ev.callClosure(less as ClosureValue, [b, a], line);
          if (ba.t === "bool" && ba.v) return 1;
          return 0;
        });
        const permuted = order.map((i) => slice.v[Number((i as { v: bigint }).v)]);
        slice.v.length = 0;
        slice.v.push(...permuted);
        return UNIT;
      }
      case "sort::SearchInts": {
        const slice = listOf(args[0], name, line);
        const target = args[1];
        let lo = 0;
        let hi = slice.v.length;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (compareValues(slice.v[mid], target) < 0) lo = mid + 1;
          else hi = mid;
        }
        return int(BigInt(lo), 64, true);
      }

      /* ---- strings ---- */
      case "strings::Split": {
        const text = textOf(args[0], line);
        const sep = textOf(args[1], line);
        const parts = sep === "" ? [...text] : text.split(sep);
        return { t: "list", v: parts.map((p) => ({ t: "str" as const, v: p })) };
      }
      case "strings::Fields": {
        const parts = textOf(args[0], line).split(/\s+/).filter((p) => p.length > 0);
        return { t: "list", v: parts.map((p) => ({ t: "str" as const, v: p })) };
      }
      case "strings::Join": {
        const parts = listOf(args[0], name, line);
        return { t: "str", v: parts.v.map((p) => goDisplay(p)).join(textOf(args[1], line)) };
      }
      case "strings::Contains":
        return { t: "bool", v: textOf(args[0], line).includes(textOf(args[1], line)) };
      case "strings::HasPrefix":
        return { t: "bool", v: textOf(args[0], line).startsWith(textOf(args[1], line)) };
      case "strings::HasSuffix":
        return { t: "bool", v: textOf(args[0], line).endsWith(textOf(args[1], line)) };
      case "strings::Index":
        return int(BigInt(textOf(args[0], line).indexOf(textOf(args[1], line))), 64, true);
      case "strings::LastIndex":
        return int(BigInt(textOf(args[0], line).lastIndexOf(textOf(args[1], line))), 64, true);
      case "strings::ToUpper":
        return { t: "str", v: textOf(args[0], line).toUpperCase() };
      case "strings::ToLower":
        return { t: "str", v: textOf(args[0], line).toLowerCase() };
      case "strings::TrimSpace":
        return { t: "str", v: textOf(args[0], line).trim() };
      case "strings::Repeat":
        return { t: "str", v: textOf(args[0], line).repeat(Number(asGoInt(args[1], line))) };
      case "strings::Replace": {
        const count = Number(asGoInt(args[3], line));
        const text = textOf(args[0], line);
        const from = textOf(args[1], line);
        const to = textOf(args[2], line);
        if (count < 0) return { t: "str", v: text.split(from).join(to) };
        let out = text;
        for (let i = 0; i < count; i++) out = out.replace(from, to);
        return { t: "str", v: out };
      }
      case "strings::ReplaceAll":
        return {
          t: "str",
          v: textOf(args[0], line).split(textOf(args[1], line)).join(textOf(args[2], line)),
        };
      case "strings::Count": {
        const text = textOf(args[0], line);
        const sub = textOf(args[1], line);
        if (sub === "") return int(BigInt([...text].length + 1), 64, true);
        return int(BigInt(text.split(sub).length - 1), 64, true);
      }
      case "strings::EqualFold":
        return { t: "bool", v: textOf(args[0], line).toLowerCase() === textOf(args[1], line).toLowerCase() };

      /* ---- strconv ---- */
      case "strconv::Itoa":
        return { t: "str", v: asGoInt(args[0], line).toString() };
      case "strconv::Atoi": {
        const text = textOf(args[0], line).trim();
        const ok = /^[+-]?\d+$/.test(text);
        return {
          t: "tuple",
          v: [int(ok ? BigInt(text) : 0n, 64, true), ok ? UNIT : { t: "str", v: `strconv.Atoi: parsing ${goQuote(args[0])}: invalid syntax` }],
        };
      }
      case "strconv::FormatInt":
        return { t: "str", v: asGoInt(args[0], line).toString(Number(asGoInt(args[1], line))) };
      case "strconv::Quote":
        return { t: "str", v: goQuote(args[0]) };

      /* ---- math ---- */
      case "math::Abs": return { t: "float", v: Math.abs(numberOf(args[0], line)) };
      case "math::Max": return { t: "float", v: Math.max(numberOf(args[0], line), numberOf(args[1], line)) };
      case "math::Min": return { t: "float", v: Math.min(numberOf(args[0], line), numberOf(args[1], line)) };
      case "math::Sqrt": return { t: "float", v: Math.sqrt(numberOf(args[0], line)) };
      case "math::Pow": return { t: "float", v: Math.pow(numberOf(args[0], line), numberOf(args[1], line)) };
      case "math::Floor": return { t: "float", v: Math.floor(numberOf(args[0], line)) };
      case "math::Ceil": return { t: "float", v: Math.ceil(numberOf(args[0], line)) };
      case "math::Round": return { t: "float", v: Math.round(numberOf(args[0], line)) };
      case "math::Log": return { t: "float", v: Math.log(numberOf(args[0], line)) };
      case "math::Log2": return { t: "float", v: Math.log2(numberOf(args[0], line)) };

      /* ---- unicode ---- */
      case "unicode::IsDigit":
        return { t: "bool", v: /^\d$/.test(String.fromCodePoint(Number(asGoInt(args[0], line)))) };
      case "unicode::IsLetter":
        return { t: "bool", v: /^\p{L}$/u.test(String.fromCodePoint(Number(asGoInt(args[0], line)))) };
      case "unicode::IsSpace":
        return { t: "bool", v: /^\s$/.test(String.fromCodePoint(Number(asGoInt(args[0], line)))) };
      case "unicode::IsUpper":
        return { t: "bool", v: /^\p{Lu}$/u.test(String.fromCodePoint(Number(asGoInt(args[0], line)))) };
      case "unicode::IsLower":
        return { t: "bool", v: /^\p{Ll}$/u.test(String.fromCodePoint(Number(asGoInt(args[0], line)))) };
      case "unicode::ToUpper":
        return int(BigInt(String.fromCodePoint(Number(asGoInt(args[0], line))).toUpperCase().codePointAt(0)!), 32, true);
      case "unicode::ToLower":
        return int(BigInt(String.fromCodePoint(Number(asGoInt(args[0], line))).toLowerCase().codePointAt(0)!), 32, true);
    }
    return undefined;
  },

  callMethod(target, name, args, ev, line) {
    // `strings.Builder`, the one standard-library value with methods that a
    // DSA solution reaches for — it is how a string is built without the
    // quadratic concatenation Go's immutable strings would otherwise force.
    if (target.t === "struct" && target.name === "__builder") {
      const current = () => (target.fields.get("text") as { t: "str"; v: string }).v;
      switch (name) {
        case "WriteString":
          target.fields.set("text", { t: "str", v: current() + textOf(args[0], line) });
          return UNIT;
        case "WriteByte":
        case "WriteRune":
          target.fields.set("text", {
            t: "str",
            v: current() + String.fromCodePoint(Number(asGoInt(args[0], line))),
          });
          return UNIT;
        case "String":
          return { t: "str", v: current() };
        case "Len":
          return int(BigInt(current().length), 64, true);
        case "Reset":
          target.fields.set("text", { t: "str", v: "" });
          return UNIT;
      }
    }
    void ev;
    return undefined;
  },
};

export const runGo = (source: string) => execute(source, goDialect);
