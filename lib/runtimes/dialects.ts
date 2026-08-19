/**
 * The three language front-ends: value formatting, standard-library builtins,
 * and the entry points the playground calls.
 *
 * Formatting is deliberately per-language, because the same double prints three
 * different ways: Rust's `{}` gives `1`, C++'s `<<` gives `1` but truncates to
 * six significant digits, and Java's println gives `1.0`. Getting this wrong
 * would quietly teach the wrong thing, so each is matched to its real toolchain.
 */
import { OutputSink, ProgramError, UnsupportedError, type RuntimeResult } from "./types";
import { parse } from "./parser";
import {
  Evaluator,
  UNIT,
  compareValues,
  describe,
  equalValues,
  heapComparator,
  heapDrained,
  heapPop,
  heapPush,
  int,
  keyOf,
  limits,
  makeHeap,
  makeSet,
  mapEntries,
  setItems,
  nativeClosure,
  structuredCopy,
  type ClosureValue,
  type Dialect,
  type Expr,
  type ListValue,
  type MapValue,
  type SeqKind,
  type Value,
} from "./lang";
import {
  asComparator,
  elementsOf,
  floorDiv,
  floorMod,
  heapCmp,
  mapGet,
  mapPut,
  navigate,
  seqGet,
  seqIndex,
  setAdd,
  setHas,
  setRemove,
  sortInPlace,
  sortedSetItems,
  type NavDirection,
} from "./stdlib";

// ------------------------------------------------------------- number formats

/** Rust's `{}` for f64: the shortest representation that round-trips. */
function rustFloat(v: number, debug: boolean): string {
  if (Number.isNaN(v)) return "NaN";
  if (!Number.isFinite(v)) return v > 0 ? "inf" : "-inf";
  const text = String(v);
  if (debug && Number.isInteger(v) && !text.includes("e")) return text + ".0";
  return text;
}

/** Java's Double.toString: always at least one digit after the point. */
function javaDouble(v: number): string {
  if (Number.isNaN(v)) return "NaN";
  if (!Number.isFinite(v)) return v > 0 ? "Infinity" : "-Infinity";
  const text = String(v);
  if (text.includes("e")) return text.replace("e", "E");
  return Number.isInteger(v) ? text + ".0" : text;
}

/** C++ `operator<<` default: %g with six significant digits. */
function cppDouble(v: number): string {
  if (Number.isNaN(v)) return "nan";
  if (!Number.isFinite(v)) return v > 0 ? "inf" : "-inf";
  if (v === 0) return "0";
  const exponent = Math.floor(Math.log10(Math.abs(v)));
  if (exponent < -5 || exponent >= 6) {
    const text = v.toExponential(5).replace(/\.?0+e/, "e");
    return text.replace(/e([+-])(\d)$/, "e$10$2");
  }
  const fixed = v.toPrecision(6);
  return fixed.includes(".") ? fixed.replace(/\.?0+$/, "") : fixed;
}

function escapeDebug(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\t/g, "\\t").replace(/\r/g, "\\r");
}

// ----------------------------------------------------------------- formatting

function rustDisplay(value: Value, debug: boolean): string {
  switch (value.t) {
    case "int": return value.v.toString();
    case "float": return rustFloat(value.v, debug);
    case "bool": return String(value.v);
    case "char": return debug ? `'${value.v}'` : value.v;
    case "str": return debug ? `"${escapeDebug(value.v)}"` : value.v;
    case "unit": return "()";
    case "list": return `[${value.v.map((v) => rustDisplay(v, true)).join(", ")}]`;
    case "tuple": return `(${value.v.map((v) => rustDisplay(v, true)).join(", ")})`;
    case "range": return `${value.from}..${value.inclusive ? "=" : ""}${value.to}`;
    case "map":
      return `{${mapEntries(value)
        .map(([k, v]) => `${rustDisplay(k, true)}: ${rustDisplay(v, true)}`)
        .join(", ")}}`;
    case "set":
      return `{${setItems(value).map((v) => rustDisplay(v, true)).join(", ")}}`;
    case "heap":
      return `[${heapDrained(value, heapComparator(value)).map((v) => rustDisplay(v, true)).join(", ")}]`;
    case "enum":
      return value.payload.length === 0
        ? value.variant
        : `${value.variant}(${value.payload.map((v) => rustDisplay(v, true)).join(", ")})`;
    case "struct":
      return `${value.name} { ${[...value.fields].map(([k, v]) => `${k}: ${rustDisplay(v, true)}`).join(", ")} }`;
    case "closure":
      return "<closure>";
  }
}

function javaDisplay(value: Value): string {
  switch (value.t) {
    case "int": return value.v.toString();
    case "float": return javaDouble(value.v);
    case "bool": return String(value.v);
    case "char": return value.v;
    case "str": return value.v;
    case "unit": return "null";
    case "list": return `[${value.v.map(javaDisplay).join(", ")}]`;
    case "tuple": return `[${value.v.map(javaDisplay).join(", ")}]`;
    case "map":
      return `{${mapEntries(value).map(([k, v]) => `${javaDisplay(k)}=${javaDisplay(v)}`).join(", ")}}`;
    case "set":
      return `[${setItems(value).map(javaDisplay).join(", ")}]`;
    case "heap":
      return `[${heapDrained(value, heapComparator(value)).map(javaDisplay).join(", ")}]`;
    case "range": return `[${value.from}..${value.to}]`;
    case "enum": return value.variant;
    case "struct": return `${value.name}@1`;
    case "closure": return "<lambda>";
  }
}

function cppDisplay(value: Value): string {
  switch (value.t) {
    case "int": return value.v.toString();
    case "float": return cppDouble(value.v);
    case "bool": return value.v ? "1" : "0";
    case "char": return value.v;
    case "str": return value.v;
    case "unit": return "";
    case "list": return `[${value.v.map(cppDisplay).join(", ")}]`;
    case "tuple": return `(${value.v.map(cppDisplay).join(", ")})`;
    case "map":
      return `{${mapEntries(value).map(([k, v]) => `${cppDisplay(k)}: ${cppDisplay(v)}`).join(", ")}}`;
    case "set":
      return `{${setItems(value).map(cppDisplay).join(", ")}}`;
    case "heap":
      return `[${heapDrained(value, heapComparator(value)).map(cppDisplay).join(", ")}]`;
    case "range": return `${value.from}..${value.to}`;
    case "enum": return value.variant;
    case "struct": return `${value.name}`;
    case "closure": return "<lambda>";
  }
}

/** Applies a Rust format spec such as `.2`, `5`, `<5` to an already-rendered value. */
function applySpec(text: string, spec: string, value: Value): string {
  let out = text;
  const precision = spec.match(/\.(\d+)/);
  if (precision && value.t === "float") out = value.v.toFixed(Number(precision[1]));
  if (precision && value.t === "int") out = Number(value.v).toFixed(Number(precision[1]));
  const width = spec.match(/^([<>^]?)(\d+)/);
  if (width) {
    const size = Number(width[2]);
    const align = width[1] || (value.t === "int" || value.t === "float" ? ">" : "<");
    while (out.length < size) {
      if (align === ">") out = " " + out;
      else if (align === "<") out = out + " ";
      else out = out.length % 2 ? " " + out : out + " ";
    }
  }
  return out;
}

// --------------------------------------------------------------------- shared

function expectArgs(name: string, args: Value[], count: number, line: number) {
  if (args.length !== count) {
    throw new ProgramError(`\`${name}\` takes ${count} argument(s), got ${args.length}`, line);
  }
}

function list(v: Value[]): Value {
  return { t: "list", v };
}

// ----------------------------------------------------------------------- Rust

const RUST_INT_LIMITS = /^(i8|i16|i32|i64|i128|isize|u8|u16|u32|u64|u128|usize)$/;

function rustIntType(name: string): { width: number; signed: boolean } {
  const signed = name.startsWith("i");
  const width = name === "usize" || name === "isize" ? 64 : Number(name.slice(1));
  return { width, signed };
}

export const rustDialect: Dialect = {
  name: "rust",
  overflow: "panic",
  defaultInt: { width: 32, signed: true },
  display: rustDisplay,

  cast(value, type, line) {
    if (RUST_INT_LIMITS.test(type)) {
      const { width, signed } = rustIntType(type);
      let v: bigint;
      if (value.t === "float") {
        // Rust saturates float-to-int casts at the limits.
        const [min, max] = limits(width, signed);
        const truncated = Math.trunc(value.v);
        if (Number.isNaN(truncated)) v = 0n;
        else {
          v = BigInt(truncated);
          if (v < min) v = min;
          if (v > max) v = max;
        }
        return { t: "int", v, width, signed };
      }
      if (value.t === "char") v = BigInt(value.v.codePointAt(0)!);
      else if (value.t === "bool") v = value.v ? 1n : 0n;
      else if (value.t === "int") v = value.v;
      else throw new ProgramError(`cannot cast ${describe(value)} to ${type}`, line);
      // `as` truncates: keep the low bits and reinterpret.
      const bits = BigInt(width);
      let wrapped = ((v % (1n << bits)) + (1n << bits)) % (1n << bits);
      const [, max] = limits(width, signed);
      if (signed && wrapped > max) wrapped -= 1n << bits;
      return { t: "int", v: wrapped, width, signed };
    }
    if (type === "f64" || type === "f32") {
      if (value.t === "int") return { t: "float", v: Number(value.v) };
      if (value.t === "float") return value;
    }
    if (type === "char" && value.t === "int") {
      return { t: "char", v: String.fromCodePoint(Number(value.v)) };
    }
    throw new UnsupportedError(`casting to \`${type}\``, line);
  },

  resolvePath(segments, ev, line) {
    const joined = segments.join("::");
    if (joined === "None") return { t: "enum", name: "Option", variant: "None", payload: [] };
    const typed = segments[0];
    if (RUST_INT_LIMITS.test(typed) && segments.length === 2) {
      const { width, signed } = rustIntType(typed);
      const [min, max] = limits(width, signed);
      if (segments[1] === "MAX") return { t: "int", v: max, width, signed };
      if (segments[1] === "MIN") return { t: "int", v: min, width, signed };
      if (segments[1] === "BITS") return int(BigInt(width), 32, false);
    }
    if ((typed === "f64" || typed === "f32") && segments.length === 2) {
      const map: Record<string, number> = {
        MAX: Number.MAX_VALUE, MIN: -Number.MAX_VALUE, INFINITY: Infinity,
        NEG_INFINITY: -Infinity, NAN: NaN, EPSILON: Number.EPSILON,
        MIN_POSITIVE: Number.MIN_VALUE,
      };
      if (segments[1] in map) return { t: "float", v: map[segments[1]] };
      if (segments[1] === "consts") return UNIT;
    }
    if (joined === "std::f64::consts::PI" || joined === "f64::consts::PI") return { t: "float", v: Math.PI };
    void ev;
    void line;
    return undefined;
  },

  callBuiltin(name, args, ev, line) {
    const short = name.replace(/^std::/, "");
    switch (short) {
      case "Some":
        return { t: "enum", name: "Option", variant: "Some", payload: [args[0]] };
      case "Ok":
        return { t: "enum", name: "Result", variant: "Ok", payload: [args[0]] };
      case "Err":
        return { t: "enum", name: "Result", variant: "Err", payload: [args[0]] };
      case "String::new":
        return { t: "str", v: "" };
      case "String::from":
        expectArgs(name, args, 1, line);
        return { t: "str", v: rustDisplay(args[0], false) };
      case "Vec::new":
        return list([]);
      case "Vec::with_capacity":
        return list([]);
      case "HashMap::new":
        return { t: "map", v: new Map(), sorted: false };
      case "BTreeMap::new":
        return { t: "map", v: new Map(), sorted: true };
      case "collections::HashMap::new":
        return { t: "map", v: new Map(), sorted: false };
      case "collections::BTreeMap::new":
        return { t: "map", v: new Map(), sorted: true };
      case "drop":
        return UNIT;
    }
    // std::mem::size_of::<T>()
    const sizeOf = name.match(/(?:std::)?mem::size_of::<(\w+)>/);
    if (sizeOf) {
      const t = sizeOf[1];
      const sizes: Record<string, number> = {
        i8: 1, u8: 1, i16: 2, u16: 2, i32: 4, u32: 4, f32: 4,
        i64: 8, u64: 8, f64: 8, usize: 8, isize: 8, i128: 16, u128: 16,
        char: 4, bool: 1,
      };
      if (t in sizes) return int(BigInt(sizes[t]), 64, false);
      throw new UnsupportedError(`size_of::<${t}>()`, line);
    }
    void ev;
    return undefined;
  },

  callMethod(target, name, args, ev, line) {
    // Methods that exist on every type.
    if (name === "clone" || name === "to_owned") return structuredCopy(target);
    if (name === "into" || name === "iter" || name === "into_iter" || name === "copied" || name === "cloned" || name === "as_str" || name === "as_slice" || name === "borrow") {
      return target;
    }
    if (name === "to_string") return { t: "str", v: rustDisplay(target, false) };

    if (target.t === "list") {
      switch (name) {
        case "len": return int(BigInt(target.v.length), 64, false);
        case "is_empty": return { t: "bool", v: target.v.length === 0 };
        case "push": target.v.push(args[0]); return UNIT;
        case "pop": {
          const popped = target.v.pop();
          return popped === undefined
            ? { t: "enum", name: "Option", variant: "None", payload: [] }
            : { t: "enum", name: "Option", variant: "Some", payload: [popped] };
        }
        case "insert": target.v.splice(Number(ev.asInt(args[0], line)), 0, args[1]); return UNIT;
        case "remove": return target.v.splice(Number(ev.asInt(args[0], line)), 1)[0];
        case "clear": target.v.length = 0; return UNIT;
        case "contains": return { t: "bool", v: target.v.some((x) => equalValues(x, args[0])) };
        case "reverse": target.v.reverse(); return UNIT;
        case "first":
        case "last": {
          const item = name === "first" ? target.v[0] : target.v[target.v.length - 1];
          return item === undefined
            ? { t: "enum", name: "Option", variant: "None", payload: [] }
            : { t: "enum", name: "Option", variant: "Some", payload: [item] };
        }
        case "get": {
          const item = target.v[Number(ev.asInt(args[0], line))];
          return item === undefined
            ? { t: "enum", name: "Option", variant: "None", payload: [] }
            : { t: "enum", name: "Option", variant: "Some", payload: [item] };
        }
        case "sort": {
          target.v.sort((a, b) => (ev.asInt(a, line) < ev.asInt(b, line) ? -1 : 1));
          return UNIT;
        }
        case "sum": {
          let total = 0n;
          let float = 0;
          let isFloat = false;
          for (const item of target.v) {
            if (item.t === "float") { isFloat = true; float += item.v; }
            else total += ev.asInt(item, line);
          }
          return isFloat ? { t: "float", v: float + Number(total) } : int(total, 64, true);
        }
        case "count": return int(BigInt(target.v.length), 64, false);
        case "max":
        case "min": {
          if (target.v.length === 0) return { t: "enum", name: "Option", variant: "None", payload: [] };
          let best = target.v[0];
          for (const item of target.v) {
            const cmp = ev.asInt(item, line) > ev.asInt(best, line);
            if (name === "max" ? cmp : !cmp && !equalValues(item, best)) best = item;
          }
          return { t: "enum", name: "Option", variant: "Some", payload: [best] };
        }
        case "collect": return list([...target.v]);
        case "rev": return list([...target.v].reverse());
        case "filter":
        case "map":
        case "any":
        case "all":
        case "find":
        case "position":
        case "for_each":
        case "take_while":
        case "skip_while": {
          const fn = args[0];
          if (fn?.t !== "closure") {
            throw new UnsupportedError(`\`${name}\` without a closure argument`, line);
          }
          const call = (item: Value) => ev.callClosure(fn, [item], line);
          switch (name) {
            case "map": return list(target.v.map(call));
            case "filter": return list(target.v.filter((x) => ev.truthy(call(x), line)));
            case "any": return { t: "bool", v: target.v.some((x) => ev.truthy(call(x), line)) };
            case "all": return { t: "bool", v: target.v.every((x) => ev.truthy(call(x), line)) };
            case "for_each": target.v.forEach(call); return UNIT;
            case "take_while": {
              const out: Value[] = [];
              for (const x of target.v) { if (!ev.truthy(call(x), line)) break; out.push(x); }
              return list(out);
            }
            case "skip_while": {
              let i = 0;
              while (i < target.v.length && ev.truthy(call(target.v[i]), line)) i++;
              return list(target.v.slice(i));
            }
            case "position": {
              const index = target.v.findIndex((x) => ev.truthy(call(x), line));
              return index === -1
                ? { t: "enum", name: "Option", variant: "None", payload: [] }
                : { t: "enum", name: "Option", variant: "Some", payload: [int(BigInt(index), 64, false)] };
            }
            default: {
              const found = target.v.find((x) => ev.truthy(call(x), line));
              return found === undefined
                ? { t: "enum", name: "Option", variant: "None", payload: [] }
                : { t: "enum", name: "Option", variant: "Some", payload: [found] };
            }
          }
        }
        case "fold": {
          const fn = args[1];
          if (fn?.t !== "closure") throw new UnsupportedError("`fold` without a closure", line);
          let acc = args[0];
          for (const item of target.v) acc = ev.callClosure(fn, [acc, item], line);
          return acc;
        }
        case "take": return list(target.v.slice(0, Number(ev.asInt(args[0], line))));
        case "skip": return list(target.v.slice(Number(ev.asInt(args[0], line))));
        case "enumerate":
          return list(target.v.map((item, i) => ({ t: "tuple" as const, v: [int(BigInt(i), 64, false), item] })));
        case "join":
          return { t: "str", v: target.v.map((x) => rustDisplay(x, false)).join(rustDisplay(args[0], false)) };
      }
    }

    if (target.t === "range") {
      const items: Value[] = [];
      const end = target.inclusive ? target.to + 1n : target.to;
      for (let i = target.from; i < end; i++) items.push(int(i, 64, true));
      return ev.dialect.callMethod!(list(items), name, args, ev, line);
    }

    if (target.t === "str") {
      switch (name) {
        case "len": return int(BigInt(new TextEncoder().encode(target.v).length), 64, false);
        case "is_empty": return { t: "bool", v: target.v.length === 0 };
        case "push_str": return { t: "str", v: target.v + rustDisplay(args[0], false) };
        case "to_uppercase": return { t: "str", v: target.v.toUpperCase() };
        case "to_lowercase": return { t: "str", v: target.v.toLowerCase() };
        case "trim": return { t: "str", v: target.v.trim() };
        case "contains": return { t: "bool", v: target.v.includes(rustDisplay(args[0], false)) };
        case "starts_with": return { t: "bool", v: target.v.startsWith(rustDisplay(args[0], false)) };
        case "ends_with": return { t: "bool", v: target.v.endsWith(rustDisplay(args[0], false)) };
        case "replace": return { t: "str", v: target.v.split(rustDisplay(args[0], false)).join(rustDisplay(args[1], false)) };
        case "repeat": return { t: "str", v: target.v.repeat(Number(ev.asInt(args[0], line))) };
        case "chars": return list([...target.v].map((c) => ({ t: "char" as const, v: c })));
        case "bytes": return list([...new TextEncoder().encode(target.v)].map((b) => int(BigInt(b), 8, false)));
        case "split":
        case "split_whitespace": {
          const parts = name === "split_whitespace"
            ? target.v.split(/\s+/).filter(Boolean)
            : target.v.split(rustDisplay(args[0], false));
          return list(parts.map((p) => ({ t: "str" as const, v: p })));
        }
        case "parse": {
          const text = target.v.trim();
          if (/^-?\d+$/.test(text)) {
            return { t: "enum", name: "Result", variant: "Ok", payload: [int(BigInt(text), 64, true)] };
          }
          if (/^-?\d*\.\d+([eE][+-]?\d+)?$/.test(text)) {
            return { t: "enum", name: "Result", variant: "Ok", payload: [{ t: "float", v: Number(text) }] };
          }
          return { t: "enum", name: "Result", variant: "Err", payload: [{ t: "str", v: "invalid digit found in string" }] };
        }
      }
    }

    if (target.t === "char") {
      switch (name) {
        case "is_alphabetic": return { t: "bool", v: /\p{L}/u.test(target.v) };
        case "is_numeric":
        case "is_ascii_digit": return { t: "bool", v: /\d/.test(target.v) };
        case "is_whitespace": return { t: "bool", v: /\s/.test(target.v) };
        case "is_uppercase": return { t: "bool", v: target.v === target.v.toUpperCase() && /\p{L}/u.test(target.v) };
        case "to_ascii_uppercase": return { t: "char", v: target.v.toUpperCase() };
        case "to_ascii_lowercase": return { t: "char", v: target.v.toLowerCase() };
        case "to_digit": {
          const d = parseInt(target.v, Number(ev.asInt(args[0], line)));
          return Number.isNaN(d)
            ? { t: "enum", name: "Option", variant: "None", payload: [] }
            : { t: "enum", name: "Option", variant: "Some", payload: [int(BigInt(d), 32, false)] };
        }
      }
    }

    if (target.t === "int") {
      const { width, signed } = target;
      const other = () => ev.asInt(args[0], line);
      switch (name) {
        case "abs": return ev.checkedInt(target.v < 0n ? -target.v : target.v, width, signed, line);
        case "pow": return ev.checkedInt(target.v ** other(), width, signed, line);
        case "min": return int(target.v < other() ? target.v : other(), width, signed);
        case "max": return int(target.v > other() ? target.v : other(), width, signed);
        case "checked_add":
        case "checked_sub":
        case "checked_mul": {
          const raw = name === "checked_add" ? target.v + other() : name === "checked_sub" ? target.v - other() : target.v * other();
          const [min, max] = limits(width, signed);
          return raw < min || raw > max
            ? { t: "enum", name: "Option", variant: "None", payload: [] }
            : { t: "enum", name: "Option", variant: "Some", payload: [int(raw, width, signed)] };
        }
        case "saturating_add":
        case "saturating_sub":
        case "saturating_mul": {
          const raw = name === "saturating_add" ? target.v + other() : name === "saturating_sub" ? target.v - other() : target.v * other();
          const [min, max] = limits(width, signed);
          return int(raw < min ? min : raw > max ? max : raw, width, signed);
        }
        case "wrapping_add":
        case "wrapping_sub":
        case "wrapping_mul": {
          const raw = name === "wrapping_add" ? target.v + other() : name === "wrapping_sub" ? target.v - other() : target.v * other();
          const bits = BigInt(width);
          const [, max] = limits(width, signed);
          let wrapped = ((raw % (1n << bits)) + (1n << bits)) % (1n << bits);
          if (signed && wrapped > max) wrapped -= 1n << bits;
          return int(wrapped, width, signed);
        }
        case "overflowing_add":
        case "overflowing_sub":
        case "overflowing_mul": {
          const raw = name === "overflowing_add" ? target.v + other() : name === "overflowing_sub" ? target.v - other() : target.v * other();
          const [min, max] = limits(width, signed);
          const overflowed = raw < min || raw > max;
          const bits = BigInt(width);
          let wrapped = ((raw % (1n << bits)) + (1n << bits)) % (1n << bits);
          if (signed && wrapped > max) wrapped -= 1n << bits;
          return { t: "tuple", v: [int(wrapped, width, signed), { t: "bool", v: overflowed }] };
        }
        case "count_ones": {
          let count = 0n;
          let v = target.v < 0n ? target.v + (1n << BigInt(width)) : target.v;
          while (v > 0n) { count += v & 1n; v >>= 1n; }
          return int(count, 32, false);
        }
      }
    }

    if (target.t === "float") {
      const f = target.v;
      const arg = () => ev.asFloat(args[0], line);
      switch (name) {
        case "abs": return { t: "float", v: Math.abs(f) };
        case "sqrt": return { t: "float", v: Math.sqrt(f) };
        case "powi":
        case "powf": return { t: "float", v: Math.pow(f, arg()) };
        case "floor": return { t: "float", v: Math.floor(f) };
        case "ceil": return { t: "float", v: Math.ceil(f) };
        case "round": return { t: "float", v: Math.round(f) };
        case "trunc": return { t: "float", v: Math.trunc(f) };
        case "min": return { t: "float", v: Math.min(f, arg()) };
        case "max": return { t: "float", v: Math.max(f, arg()) };
        case "is_nan": return { t: "bool", v: Number.isNaN(f) };
      }
    }

    if (target.t === "enum") {
      switch (name) {
        case "unwrap":
          if (target.variant === "Some" || target.variant === "Ok") return target.payload[0];
          throw new ProgramError(
            target.variant === "None"
              ? "called `Option::unwrap()` on a `None` value"
              : `called \`Result::unwrap()\` on an \`Err\` value: ${rustDisplay(target.payload[0] ?? UNIT, true)}`,
            line
          );
        case "expect":
          if (target.variant === "Some" || target.variant === "Ok") return target.payload[0];
          throw new ProgramError(rustDisplay(args[0], false), line);
        case "unwrap_or":
          return target.variant === "Some" || target.variant === "Ok" ? target.payload[0] : args[0];
        case "is_some": return { t: "bool", v: target.variant === "Some" };
        case "is_none": return { t: "bool", v: target.variant === "None" };
        case "is_ok": return { t: "bool", v: target.variant === "Ok" };
        case "is_err": return { t: "bool", v: target.variant === "Err" };
      }
    }

    if (target.t === "map") {
      switch (name) {
        case "insert": {
          const previous = target.v.get(keyOf(args[0]));
          target.v.set(keyOf(args[0]), [args[0], args[1]]);
          return previous
            ? { t: "enum", name: "Option", variant: "Some", payload: [previous[1]] }
            : { t: "enum", name: "Option", variant: "None", payload: [] };
        }
        case "get": {
          const found = target.v.get(keyOf(args[0]));
          return found
            ? { t: "enum", name: "Option", variant: "Some", payload: [found[1]] }
            : { t: "enum", name: "Option", variant: "None", payload: [] };
        }
        case "contains_key": return { t: "bool", v: target.v.has(keyOf(args[0])) };
        case "remove": target.v.delete(keyOf(args[0])); return UNIT;
        case "len": return int(BigInt(target.v.size), 64, false);
        case "keys": return list([...target.v.values()].map(([k]) => k));
        case "values": return list([...target.v.values()].map(([, v]) => v));
      }
    }

    return undefined;
  },

  callMacro(name, args, ev, line) {
    switch (name) {
      case "println":
      case "print":
      case "eprintln":
      case "eprint":
      case "format": {
        const text = formatRust(args, ev, line);
        if (name === "format") return { t: "str", v: text };
        const full = name.endsWith("ln") ? text + "\n" : text;
        if (name.startsWith("e")) ev.out.note("error", full.replace(/\n$/, ""));
        else ev.out.write(full);
        return UNIT;
      }
      case "vec": {
        if (args.length === 1 && args[0].k === "list") return ev.eval(args[0], ev.env);
        return list(args.map((a) => ev.eval(a, ev.env)));
      }
      case "panic": {
        const text = args.length ? formatRust(args, ev, line) : "explicit panic";
        throw new ProgramError(`panicked at '${text}'`, line);
      }
      case "assert": {
        if (!ev.truthy(ev.eval(args[0], ev.env), line)) {
          throw new ProgramError("assertion failed", line);
        }
        return UNIT;
      }
      case "assert_eq": {
        const a = ev.eval(args[0], ev.env);
        const b = ev.eval(args[1], ev.env);
        if (!equalValues(a, b)) {
          throw new ProgramError(
            `assertion \`left == right\` failed\n  left: ${rustDisplay(a, true)}\n right: ${rustDisplay(b, true)}`,
            line
          );
        }
        return UNIT;
      }
      case "dbg": {
        const value = ev.eval(args[0], ev.env);
        ev.out.note("info", `[src/main.rs:${line}] = ${rustDisplay(value, true)}`);
        return value;
      }
    }
    return undefined;
  },
};

/**
 * Renders a Rust format string. Supports `{}`, `{:?}`, `{:#?}`, inline captures
 * (`{name}`), positional indices, and the width/precision specs the lessons use.
 */
function formatRust(args: Expr[], ev: Evaluator, line: number): string {
  if (args.length === 0) return "";
  const first = args[0];
  if (first.k !== "str") {
    throw new ProgramError("the first argument to a format macro must be a string literal", line);
  }
  const template = first.v;
  const positional = args.slice(1);
  // Pin the caller's scope before any argument runs, so an argument that
  // itself calls a function cannot move the ground under the later ones.
  const scope = ev.env;
  let auto = 0;
  let out = "";

  for (let i = 0; i < template.length; i++) {
    const ch = template[i];
    if (ch === "{" && template[i + 1] === "{") { out += "{"; i++; continue; }
    if (ch === "}" && template[i + 1] === "}") { out += "}"; i++; continue; }
    if (ch !== "{") { out += ch; continue; }

    const close = template.indexOf("}", i);
    if (close === -1) throw new ProgramError("unmatched `{` in format string", line);
    const body = template.slice(i + 1, close);
    i = close;

    const [namePart, specPart = ""] = body.split(":");
    let value: Value;
    if (namePart === "") {
      if (auto >= positional.length) {
        throw new ProgramError(
          `${positional.length} positional argument(s) in format string, but there is no argument #${auto + 1}`,
          line
        );
      }
      value = ev.eval(positional[auto++], scope);
    } else if (/^\d+$/.test(namePart)) {
      const index = Number(namePart);
      if (index >= positional.length) throw new ProgramError(`there is no argument #${index + 1}`, line);
      value = ev.eval(positional[index], scope);
    } else {
      // An inline capture must be a plain identifier — the compiler's rule too.
      if (!/^[A-Za-z_]\w*$/.test(namePart)) {
        throw new ProgramError(
          `invalid format string: \`${namePart}\` is not an identifier (inline captures take a variable name, not an expression)`,
          line
        );
      }
      value = ev.eval({ k: "name", name: namePart, line }, scope);
    }

    const debug = specPart.includes("?");
    const rendered = rustDisplay(value, debug);
    if (!debug && (value.t === "list" || value.t === "tuple" || value.t === "map")) {
      throw new ProgramError(
        `\`${describe(value)}\` cannot be formatted with the default formatter — use \`{:?}\` instead`,
        line
      );
    }
    out += applySpec(rendered, specPart.replace("#", "").replace("?", ""), value);
  }
  return out;
}

// ------------------------------------------------------------------------ C++

/** A sentinel for std::cout / std::cerr, so `<<` can be intercepted. */
function stream(name: string): Value {
  return { t: "struct", name, fields: new Map() };
}

/**
 * Strips `std::`, `const` and any trailing reference or pointer decoration, so
 * that the many ways of writing one container type collapse to one name.
 */
function bareType(type: string): string {
  return type
    .replace(/\bconst\b/g, "")
    .replace(/\bstd::/g, "")
    .replace(/[&*\s]+$/g, "")
    .trim();
}

/**
 * The template arguments of a written type, split at the top level only, so
 * that `map<int, vector<int>>` yields `int` and `vector<int>` rather than three
 * fragments torn apart at the inner comma.
 */
function genericArgs(type: string): string[] {
  const open = type.indexOf("<");
  if (open === -1) return [];
  const inner = type.slice(open + 1, type.lastIndexOf(">"));
  const out: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of inner) {
    if (ch === "<") depth++;
    if (ch === ">") depth--;
    if (ch === "," && depth === 0) {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

/**
 * The value a C++ declaration starts life with.
 *
 * This is what makes `unordered_map<char,int> freq; freq[c]++;` count from
 * zero: the map is built knowing that its values are `int`, so a missing key
 * reads as `0` rather than failing. Getting the element type from the written
 * declaration is the only way to know that in an untyped runtime.
 */
function cppZero(type: string, line: number): Value {
  const bare = bareType(type);
  const head = bare.replace(/<.*$/, "").trim();
  switch (head) {
    case "int": case "int32_t": case "short": case "signed":
      return int(0n, 32, true);
    case "unsigned": case "uint32_t":
      return int(0n, 32, false);
    case "long": case "int64_t": case "ll":
      return int(0n, 64, true);
    case "size_t": case "uint64_t":
      return int(0n, 64, false);
    case "double": case "float": case "long double":
      return { t: "float", v: 0 };
    case "bool":
      return { t: "bool", v: false };
    case "char":
      return { t: "char", v: "\0" };
    case "string":
      return { t: "str", v: "" };
    case "vector":
      return { t: "list", v: [] };
    default:
      return cppDefault(bare, line);
  }
}

/**
 * Default-constructs a container from its written type.
 *
 * Two places where C++ differs from the language a learner is most likely to be
 * comparing against, and both are honoured here rather than smoothed over:
 * `priority_queue` is a **max**-heap by default where Java's `PriorityQueue` is
 * a min-heap, and `map`/`set` are ordered where `unordered_map`/`unordered_set`
 * are not. The unordered ones iterate in insertion order here, which is a real
 * divergence from libstdc++ — but no correct program may depend on the order of
 * an unordered container, so nothing that matters can observe it.
 */
function cppDefault(type: string, line: number): Value {
  const bare = bareType(type);
  const head = bare.replace(/<.*$/, "").trim();
  const args = genericArgs(bare);
  switch (head) {
    case "map": case "multimap":
      return { t: "map", v: new Map(), sorted: true, zero: cppZero(args[1] ?? "int", line) };
    case "unordered_map": case "unordered_multimap":
      return { t: "map", v: new Map(), sorted: false, zero: cppZero(args[1] ?? "int", line) };
    case "set": case "multiset":
      return makeSet(true);
    case "unordered_set": case "unordered_multiset":
      return makeSet(false);
    case "stack":
      return { t: "list", v: [], kind: "stack" };
    // A queue pops from the front, which is what `kind: "deque"` selects. A
    // `std::deque` names both ends explicitly on every call, so it can share it.
    case "queue": case "deque":
      return { t: "list", v: [], kind: "deque" };
    case "priority_queue":
      return makeHeap(/\bgreater\b/.test(bare) ? "min" : "max");
    case "pair":
      return { t: "tuple", v: [cppZero(args[0] ?? "int", line), cppZero(args[1] ?? "int", line)] };
    case "vector":
      return { t: "list", v: [] };
    case "string":
      return { t: "str", v: "" };
  }
  throw new UnsupportedError(`default-constructing \`${type}\``, line);
}

/** `greater<T>()` and `less<T>()`, as comparators the shared sort understands. */
function cppOrdering(reverse: boolean): ClosureValue {
  return nativeClosure(["a", "b"], (args) =>
    int(BigInt(reverse ? -compareValues(args[0], args[1]) : compareValues(args[0], args[1])))
  );
}

/**
 * The list an algorithm was handed.
 *
 * `begin()` and `end()` both evaluate to the whole container here, so
 * `sort(v.begin(), v.end())` arrives as two copies of one list. There is no
 * iterator model, which means a *partial* range cannot be expressed — and
 * rather than silently sorting the whole container when a program asked for
 * part of it, anything that is not a plain container is refused.
 */
function algorithmRange(args: Value[], name: string, line: number): ListValue {
  const source = args[0];
  if (source.t !== "list") {
    throw new ProgramError(`\`${name}\` expects a container`, line);
  }
  return source;
}

export const cppDialect: Dialect = {
  name: "cpp",
  overflow: "wrap",
  defaultInt: { width: 32, signed: true },
  display: (value) => cppDisplay(value),
  globals: { nullptr: UNIT, NULL: UNIT },

  binaryOverride(op, a, b, ev, line) {
    if (op !== "<<" || a.t !== "struct" || (a.name !== "__cout" && a.name !== "__cerr")) {
      return undefined;
    }
    if (b.t === "struct" && b.name === "__endl") {
      if (a.name === "__cerr") ev.out.note("error", "");
      else ev.out.write("\n");
      return a;
    }
    const text = cppDisplay(b);
    if (a.name === "__cerr") ev.out.note("error", text);
    else ev.out.write(text);
    void line;
    return a;
  },

  cast(value, type, line) {
    if (/^(int|long|short|size_t|unsigned|char)/.test(type)) {
      const width = /long|size_t/.test(type) ? 64 : type === "char" ? 8 : 32;
      const signed = !/unsigned|size_t/.test(type);
      const raw = value.t === "float" ? BigInt(Math.trunc(value.v)) : ev_asInt(value, line);
      return { t: "int", v: raw, width, signed };
    }
    if (/^(double|float)$/.test(type)) {
      return { t: "float", v: value.t === "float" ? value.v : Number(ev_asInt(value, line)) };
    }
    if (/^(bool)$/.test(type)) return { t: "bool", v: ev_asInt(value, line) !== 0n };
    throw new UnsupportedError(`casting to \`${type}\``, line);
  },

  resolvePath(segments) {
    const joined = segments.join("::");
    if (joined === "std::cout" || joined === "cout") return stream("__cout");
    if (joined === "std::cerr" || joined === "cerr") return stream("__cerr");
    if (joined === "std::endl" || joined === "endl") return stream("__endl");
    if (/^(std::)?INT_MAX$/.test(joined)) return int(2147483647n, 32, true);
    if (/^(std::)?INT_MIN$/.test(joined)) return int(-2147483648n, 32, true);
    if (/^(std::)?LLONG_MAX$/.test(joined)) return int(9223372036854775807n, 64, true);
    if (/^(std::)?LLONG_MIN$/.test(joined)) return int(-9223372036854775808n, 64, true);
    return undefined;
  },

  callBuiltin(name, args, ev, line) {
    const short = name.replace(/^std::/, "");
    const generic = short.replace(/<.*>$/, "");
    switch (generic) {
      // The pseudo-call the parser emits for an uninitialised container
      // declaration; its one argument is the type as it was written.
      case "__default": {
        const type = args[0];
        if (type?.t !== "str") throw new ProgramError("malformed default construction", line);
        return cppDefault(type.v, line);
      }
      // The companion to `__default`: a braced initialiser whose declared type
      // is a container. Its two arguments are the written type and the list the
      // braces produced.
      case "__init": {
        const type = args[0];
        const items = args[1];
        if (type?.t !== "str" || items?.t !== "list") {
          throw new ProgramError("malformed container initialisation", line);
        }
        const container = cppDefault(type.v, line);
        for (const item of items.v) {
          if (container.t === "set") setAdd(container, item);
          else if (container.t === "heap") heapPush(container, item, heapCmp(container, ev, line));
          else if (container.t === "list") container.v.push(item);
          else if (container.t === "map") {
            // `map<int,int> m = {{1,2},{3,4}}` — each element is a key/value pair.
            if (item.t !== "list" && item.t !== "tuple") {
              throw new ProgramError("a map initialiser needs key/value pairs", line);
            }
            mapPut(container, item.v[0], item.v[1]);
          } else if (container.t === "tuple") {
            // A `pair` written as `{a, b}`.
            return { t: "tuple", v: items.v.slice(0, 2) };
          }
        }
        return container;
      }
      case "string":
        return { t: "str", v: args.length ? cppDisplay(args[0]) : "" };
      case "vector": {
        // `vector<int> v(n)` and `vector<int> v(n, x)` size the vector up front,
        // which is how a DSA solution allocates its dp table.
        if (args.length === 0) return { t: "list", v: [] };
        const count = Number(ev.asInt(args[0], line));
        const fill = args[1] ?? int(0n);
        return { t: "list", v: Array.from({ length: count }, () => structuredCopy(fill)) };
      }
      case "greater": return cppOrdering(true);
      case "less": return cppOrdering(false);
      case "make_pair": return { t: "tuple", v: [args[0], args[1]] };
      case "to_string":
        return { t: "str", v: cppDisplay(args[0]) };
      case "stoi":
      case "stol":
      case "stoll":
        return int(BigInt(parseInt(cppDisplay(args[0]), 10) || 0), 64, true);
      case "stod":
        return { t: "float", v: Number(cppDisplay(args[0])) };
      case "max":
        return compareValues(args[0], args[1]) >= 0 ? args[0] : args[1];
      case "min":
        return compareValues(args[0], args[1]) <= 0 ? args[0] : args[1];
      case "abs":
      case "llabs":
      case "fabs":
        return args[0].t === "float"
          ? { t: "float", v: Math.abs(args[0].v) }
          : int(args[0].t === "int" && args[0].v < 0n ? -args[0].v : ev.asInt(args[0], line), 64, true);
      case "__gcd": {
        let x = ev.asInt(args[0], line);
        let y = ev.asInt(args[1], line);
        if (x < 0n) x = -x;
        if (y < 0n) y = -y;
        while (y) [x, y] = [y, x % y];
        return int(x, 64, true);
      }
      case "swap":
        throw new UnsupportedError("`std::swap` (the runtime has no references)", line);
      case "accumulate": {
        const source = algorithmRange(args, "accumulate", line);
        let acc = args[2] ?? int(0n);
        for (const item of source.v) acc = ev.arith("+", acc, item, line);
        return acc;
      }
      case "sort":
      case "stable_sort": {
        const source = algorithmRange(args, generic, line);
        sortInPlace(source.v, asComparator(ev, args[2], line));
        return UNIT;
      }
      case "reverse": {
        algorithmRange(args, "reverse", line).v.reverse();
        return UNIT;
      }
      // Both return a one-element sequence rather than the value itself, so
      // that the `*max_element(...)` dereference every caller writes reads
      // through it and lands on the element.
      case "max_element":
      case "min_element": {
        const source = algorithmRange(args, generic, line);
        if (source.v.length === 0) throw new ProgramError(`\`${generic}\` on an empty container`, line);
        const cmp = asComparator(ev, args[2], line);
        const want = generic === "max_element" ? 1 : -1;
        let best = source.v[0];
        for (const item of source.v) if (Math.sign(cmp(item, best)) === want) best = item;
        return { t: "list", v: [best] };
      }
      case "count": {
        const source = algorithmRange(args, "count", line);
        return int(BigInt(source.v.filter((item) => equalValues(item, args[2])).length), 64, true);
      }
      case "lower_bound":
      case "upper_bound":
        throw new UnsupportedError(
          `\`${generic}\` over a vector (this runtime has no iterator arithmetic)`,
          line
        );
    }
    return undefined;
  },

  callMethod(target, name, args, ev, line) {
    if (target.t === "list") {
      const front = target.kind === "deque";
      switch (name) {
        case "size": return int(BigInt(target.v.length), 64, false);
        case "empty": return { t: "bool", v: target.v.length === 0 };
        case "clear": target.v.length = 0; return UNIT;
        case "push_back": target.v.push(args[0]); return UNIT;
        case "pop_back": target.v.pop(); return UNIT;
        case "push_front": target.v.unshift(args[0]); return UNIT;
        case "pop_front": target.v.shift(); return UNIT;
        case "at": return seqGet(target, args[0], ev, line);
        case "front": return target.v[0];
        case "back": return target.v[target.v.length - 1];
        // `push`/`pop`/`top` are the adapter spellings. A stack works its back;
        // a queue pushes to the back and pops from the front.
        case "push": target.v.push(args[0]); return UNIT;
        case "pop": {
          if (target.v.length === 0) throw new ProgramError("popped an empty container", line);
          if (front) target.v.shift();
          else target.v.pop();
          return UNIT;
        }
        case "top": {
          if (target.v.length === 0) throw new ProgramError("`top` on an empty container", line);
          return target.v[target.v.length - 1];
        }
        case "begin":
        case "end": return target;
        case "resize": {
          const size = Number(ev.asInt(args[0], line));
          const fill = args[1] ?? int(0n);
          while (target.v.length < size) target.v.push(structuredCopy(fill));
          target.v.length = size;
          return UNIT;
        }
      }
    }
    if (target.t === "map") {
      switch (name) {
        case "size": return int(BigInt(target.v.size), 64, false);
        case "empty": return { t: "bool", v: target.v.size === 0 };
        case "clear": target.v.clear(); return UNIT;
        case "count": return int(target.v.has(keyOf(args[0])) ? 1n : 0n, 64, false);
        case "contains": return { t: "bool", v: target.v.has(keyOf(args[0])) };
        case "erase": return int(target.v.delete(keyOf(args[0])) ? 1n : 0n, 64, false);
        case "at": {
          const found = mapGet(target, args[0]);
          if (found === undefined) throw new ProgramError("`at`: key not found", line);
          return found;
        }
        case "insert": {
          // `m.insert({k, v})` and `m.insert(make_pair(k, v))` both arrive as a
          // pair. C++ keeps the existing value when the key is already there.
          const pair = args[0];
          if (pair?.t !== "tuple") throw new ProgramError("`insert` expects a pair", line);
          if (!target.v.has(keyOf(pair.v[0]))) mapPut(target, pair.v[0], pair.v[1]);
          return UNIT;
        }
        // `m.find(k) != m.end()` is the classic membership test. `end()` is the
        // absent marker, and `find` returns the entry pair when the key is
        // there — which also makes `it->second` read the value.
        case "find": {
          const found = target.v.get(keyOf(args[0]));
          return found ? { t: "tuple", v: [found[0], found[1]] } : UNIT;
        }
        case "end": return UNIT;
        case "begin": {
          const first = mapEntries(target)[0];
          return first ? { t: "tuple", v: [first[0], first[1]] } : UNIT;
        }
      }
    }
    if (target.t === "set") {
      const sorted = () => (target.sorted ? sortedSetItems(target) : setItems(target));
      switch (name) {
        case "size": return int(BigInt(target.v.size), 64, false);
        case "empty": return { t: "bool", v: target.v.size === 0 };
        case "clear": target.v.clear(); return UNIT;
        case "insert": setAdd(target, args[0]); return UNIT;
        case "count": return int(setHas(target, args[0]) ? 1n : 0n, 64, false);
        case "contains": return { t: "bool", v: setHas(target, args[0]) };
        case "erase": return int(setRemove(target, args[0]) ? 1n : 0n, 64, false);
        case "find": return setHas(target, args[0]) ? args[0] : UNIT;
        case "end": return UNIT;
        case "begin": return sorted()[0] ?? UNIT;
        case "lower_bound": return navigate(sorted(), args[0], "ceiling") ?? UNIT;
        case "upper_bound": return navigate(sorted(), args[0], "higher") ?? UNIT;
      }
    }
    if (target.t === "heap") {
      switch (name) {
        case "push": heapPush(target, args[0], heapCmp(target, ev, line)); return UNIT;
        case "size": return int(BigInt(target.v.length), 64, false);
        case "empty": return { t: "bool", v: target.v.length === 0 };
        case "top": {
          if (target.v.length === 0) throw new ProgramError("`top` on an empty priority_queue", line);
          return target.v[0];
        }
        case "pop": {
          if (target.v.length === 0) throw new ProgramError("popped an empty priority_queue", line);
          heapPop(target, heapCmp(target, ev, line));
          return UNIT;
        }
      }
    }
    // `pair.first` / `pair.second`, reached through the field case as well as a
    // call, which is why these take no arguments.
    //
    // A two-element *list* answers to them too, because a braced initialiser
    // inside `vector<pair<int,int>> v = {{3,1},{1,2}}` builds one: the elements
    // are written the same way an array's are, and an untyped runtime has
    // nothing at that point to tell it the pair was meant. The two behave alike
    // everywhere else — both compare lexicographically — so accepting either
    // here costs nothing a correct program could notice.
    if ((target.t === "tuple" || target.t === "list") && target.v.length === 2) {
      if (name === "first") return target.v[0];
      if (name === "second") return target.v[1];
    }
    if (target.t === "str") {
      switch (name) {
        case "size":
        case "length": return int(BigInt(target.v.length), 64, false);
        case "empty": return { t: "bool", v: target.v.length === 0 };
        case "substr": {
          const from = Number(ev.asInt(args[0], line));
          const count = args[1] ? Number(ev.asInt(args[1], line)) : undefined;
          return { t: "str", v: target.v.substr(from, count) };
        }
        case "at": return { t: "char", v: target.v[Number(ev.asInt(args[0], line))] };
        case "c_str": return target;
        case "begin":
        case "end": return { t: "list", v: [...target.v].map((ch) => ({ t: "char" as const, v: ch })) };
        case "find": {
          const index = target.v.indexOf(cppDisplay(args[0]));
          return int(index === -1 ? 18446744073709551615n : BigInt(index), 64, false);
        }
      }
    }
    return undefined;
  },
};

function ev_asInt(value: Value, line: number): bigint {
  if (value.t === "int") return value.v;
  if (value.t === "bool") return value.v ? 1n : 0n;
  if (value.t === "char") return BigInt(value.v.codePointAt(0)!);
  if (value.t === "float") return BigInt(Math.trunc(value.v));
  throw new ProgramError(`expected a number, found ${describe(value)}`, line);
}

// ----------------------------------------------------------------------- Java

export const javaDialect: Dialect = {
  name: "java",
  overflow: "wrap",
  defaultInt: { width: 32, signed: true },
  display: (value) => javaDisplay(value),
  // `null` is a literal in Java's grammar, not a name — but binding it as one
  // is enough here, since nothing may shadow it and every use is a read.
  globals: { null: UNIT },

  cast(value, type, line) {
    if (/^(int|short|byte)$/.test(type)) {
      const width = type === "byte" ? 8 : type === "short" ? 16 : 32;
      return { t: "int", v: ev_asInt(value, line), width, signed: true };
    }
    if (type === "long") return { t: "int", v: ev_asInt(value, line), width: 64, signed: true };
    if (/^(double|float)$/.test(type)) {
      return { t: "float", v: value.t === "float" ? value.v : Number(ev_asInt(value, line)) };
    }
    if (type === "char") return { t: "char", v: String.fromCodePoint(Number(ev_asInt(value, line))) };
    throw new UnsupportedError(`casting to \`${type}\``, line);
  },

  resolvePath(segments, ev, line) {
    const joined = segments.join(".");
    const [head, ...rest] = segments;
    if (head === "Integer" || head === "Long") {
      const width = head === "Long" ? 64 : 32;
      const [min, max] = limits(width, true);
      if (rest[0] === "MAX_VALUE") return { t: "int", v: max, width, signed: true };
      if (rest[0] === "MIN_VALUE") return { t: "int", v: min, width, signed: true };
    }
    if (head === "Math") {
      if (rest[0] === "PI") return { t: "float", v: Math.PI };
      if (rest[0] === "E") return { t: "float", v: Math.E };
    }
    if (joined === "System.out" || joined === "System.err") return stream(joined);
    void ev;
    void line;
    return undefined;
  },

  callBuiltin(name, args, ev, line) {
    // A fully-qualified name means the same thing as the imported short one.
    const dotted = name.replace(/::/g, ".").replace(/^java\.(util|lang|io)\./, "");
    const text = (v: Value) => javaDisplay(v);
    const num = (v: Value) => ev.asInt(v, line);

    switch (dotted) {
      /* ------------------------------------------------------------ output */
      case "System.out.println":
        ev.out.write((args.length ? text(args[0]) : "") + "\n");
        return UNIT;
      case "System.out.print":
        ev.out.write(args.length ? text(args[0]) : "");
        return UNIT;
      case "System.err.println":
        ev.out.note("error", args.length ? text(args[0]) : "");
        return UNIT;
      case "System.out.printf":
      case "System.out.format":
        ev.out.write(javaPrintf(args, line));
        return UNIT;

      /* ------------------------------------------------------------ String */
      case "String.valueOf":
        // `String.valueOf(char[])` joins the characters; every other overload
        // is ordinary stringification.
        if (args[0]?.t === "list") return { t: "str", v: args[0].v.map(text).join("") };
        return { t: "str", v: text(args[0]) };
      case "String.format":
        return { t: "str", v: javaPrintf(args, line) };
      case "String.join":
        return {
          t: "str",
          v: (args[1]?.t === "list" ? args[1].v : args[1]?.t === "set" ? setItems(args[1]) : args.slice(1))
            .map(text)
            .join(text(args[0])),
        };

      /* ----------------------------------------------------------- numbers */
      case "Integer.parseInt":
      case "Long.parseLong": {
        const raw = text(args[0]).trim();
        const radix = args[1] ? Number(num(args[1])) : 10;
        const valid = radix === 10 ? /^[+-]?\d+$/ : new RegExp(`^[+-]?[0-9a-zA-Z]+$`);
        const parsed = radix === 10 ? Number(raw) : parseInt(raw, radix);
        if (!valid.test(raw) || Number.isNaN(parsed)) {
          throw new ProgramError(`NumberFormatException: For input string: "${raw}"`, line);
        }
        const width = dotted === "Long.parseLong" ? 64 : 32;
        return int(radix === 10 ? BigInt(raw) : BigInt(parsed), width, true);
      }
      case "Double.parseDouble":
      case "Float.parseFloat":
        return { t: "float", v: Number(text(args[0])) };
      case "Integer.valueOf":
      case "Long.valueOf":
      case "Double.valueOf":
      case "Character.valueOf":
      case "Boolean.valueOf":
        return args[0];
      case "Integer.toString":
      case "Long.toString":
      case "Double.toString":
      case "Character.toString":
        return { t: "str", v: text(args[0]) };
      case "Integer.toBinaryString":
        return { t: "str", v: BigInt.asUintN(32, num(args[0])).toString(2) };
      case "Integer.toHexString":
        return { t: "str", v: BigInt.asUintN(32, num(args[0])).toString(16) };
      case "Long.toBinaryString":
        return { t: "str", v: BigInt.asUintN(64, num(args[0])).toString(2) };
      case "Integer.bitCount":
      case "Long.bitCount": {
        const bits = dotted.startsWith("Long") ? 64 : 32;
        let n = BigInt.asUintN(bits, num(args[0]));
        let count = 0;
        while (n > 0n) { count += Number(n & 1n); n >>= 1n; }
        return int(BigInt(count), 32, true);
      }
      case "Integer.compare":
      case "Long.compare":
      case "Double.compare":
      case "Character.compare":
        return int(BigInt(compareValues(args[0], args[1])), 32, true);
      case "Integer.max":
      case "Long.max":
        return num(args[0]) >= num(args[1]) ? args[0] : args[1];
      case "Integer.min":
      case "Long.min":
        return num(args[0]) <= num(args[1]) ? args[0] : args[1];
      case "Integer.signum":
      case "Long.signum": {
        const v = num(args[0]);
        return int(v > 0n ? 1n : v < 0n ? -1n : 0n, 32, true);
      }

      /* --------------------------------------------------------- Character */
      case "Character.isDigit": return { t: "bool", v: /^[0-9]$/.test(text(args[0])) };
      case "Character.isLetter": return { t: "bool", v: /^[A-Za-z]$/.test(text(args[0])) };
      case "Character.isLetterOrDigit": return { t: "bool", v: /^[A-Za-z0-9]$/.test(text(args[0])) };
      case "Character.isAlphabetic": return { t: "bool", v: /^[A-Za-z]$/.test(text(args[0])) };
      case "Character.isUpperCase": return { t: "bool", v: /^[A-Z]$/.test(text(args[0])) };
      case "Character.isLowerCase": return { t: "bool", v: /^[a-z]$/.test(text(args[0])) };
      case "Character.isWhitespace": return { t: "bool", v: /^\s$/.test(text(args[0])) };
      case "Character.toUpperCase": return { t: "char", v: text(args[0]).toUpperCase() };
      case "Character.toLowerCase": return { t: "char", v: text(args[0]).toLowerCase() };
      case "Character.getNumericValue": {
        const ch = text(args[0]);
        if (/^[0-9]$/.test(ch)) return int(BigInt(ch), 32, true);
        if (/^[a-zA-Z]$/.test(ch)) return int(BigInt(ch.toLowerCase().charCodeAt(0) - 87), 32, true);
        return int(-1n, 32, true);
      }

      /* -------------------------------------------------------------- Math */
      case "Math.max":
        return args.some((a) => a.t === "float")
          ? { t: "float", v: Math.max(ev.asFloat(args[0], line), ev.asFloat(args[1], line)) }
          : (num(args[0]) >= num(args[1]) ? args[0] : args[1]);
      case "Math.min":
        return args.some((a) => a.t === "float")
          ? { t: "float", v: Math.min(ev.asFloat(args[0], line), ev.asFloat(args[1], line)) }
          : (num(args[0]) <= num(args[1]) ? args[0] : args[1]);
      case "Math.abs":
        if (args[0].t === "float") return { t: "float", v: Math.abs(args[0].v) };
        else {
          const v = num(args[0]);
          const width = args[0].t === "int" ? args[0].width : 32;
          return int(v < 0n ? -v : v, width, true);
        }
      case "Math.sqrt": return { t: "float", v: Math.sqrt(ev.asFloat(args[0], line)) };
      case "Math.cbrt": return { t: "float", v: Math.cbrt(ev.asFloat(args[0], line)) };
      case "Math.pow": return { t: "float", v: Math.pow(ev.asFloat(args[0], line), ev.asFloat(args[1], line)) };
      case "Math.floor": return { t: "float", v: Math.floor(ev.asFloat(args[0], line)) };
      case "Math.ceil": return { t: "float", v: Math.ceil(ev.asFloat(args[0], line)) };
      case "Math.round": return int(BigInt(Math.round(ev.asFloat(args[0], line))), 64, true);
      case "Math.log": return { t: "float", v: Math.log(ev.asFloat(args[0], line)) };
      case "Math.log10": return { t: "float", v: Math.log10(ev.asFloat(args[0], line)) };
      case "Math.exp": return { t: "float", v: Math.exp(ev.asFloat(args[0], line)) };
      case "Math.hypot": return { t: "float", v: Math.hypot(ev.asFloat(args[0], line), ev.asFloat(args[1], line)) };
      case "Math.signum": return { t: "float", v: Math.sign(ev.asFloat(args[0], line)) };
      case "Math.floorDiv": return int(floorDiv(num(args[0]), num(args[1]), line), 64, true);
      case "Math.floorMod": return int(floorMod(num(args[0]), num(args[1]), line), 64, true);
      case "Math.toIntExact": return int(num(args[0]), 32, true);

      /* ------------------------------------------------------ factory lists */
      case "List.of":
      case "Arrays.asList":
        return jList(args[0]?.t === "list" && args.length === 1 ? [...args[0].v] : [...args]);
      case "Set.of":
        return makeSet(false, args);
      case "Map.of": {
        const map: MapValue = { t: "map", v: new Map(), sorted: false };
        for (let i = 0; i + 1 < args.length; i += 2) mapPut(map, args[i], args[i + 1]);
        return map;
      }
      case "Map.entry":
        return { t: "tuple", v: [args[0], args[1]] };

      /* ------------------------------------------------------------ Arrays */
      case "Arrays.toString":
      case "Arrays.deepToString":
        return { t: "str", v: text(args[0]) };
      case "Arrays.sort": {
        if (args[0].t !== "list") throw new ProgramError("Arrays.sort expects an array", line);
        // `sort(a, cmp)` and `sort(a, from, to)` differ by the argument types,
        // which is the only way to tell them apart without a type checker.
        if (args.length >= 3 && args[1].t === "int" && args[2].t === "int") {
          const from = Number(num(args[1]));
          const to = Number(num(args[2]));
          const slice = args[0].v.slice(from, to).sort(compareValues);
          for (let i = 0; i < slice.length; i++) args[0].v[from + i] = slice[i];
          return UNIT;
        }
        sortInPlace(args[0].v, asComparator(ev, args[1], line));
        return UNIT;
      }
      case "Arrays.fill": {
        if (args[0].t !== "list") throw new ProgramError("Arrays.fill expects an array", line);
        args[0].v.fill(args[args.length - 1]);
        return UNIT;
      }
      case "Arrays.copyOf": {
        if (args[0].t !== "list") throw new ProgramError("Arrays.copyOf expects an array", line);
        const size = Number(num(args[1]));
        const pad = zeroLike(args[0].v[0]);
        const out = args[0].v.slice(0, size);
        while (out.length < size) out.push(pad);
        return jList(out, args[0].kind);
      }
      case "Arrays.copyOfRange": {
        if (args[0].t !== "list") throw new ProgramError("Arrays.copyOfRange expects an array", line);
        return jList(args[0].v.slice(Number(num(args[1])), Number(num(args[2]))), args[0].kind);
      }
      case "Arrays.equals":
      case "Arrays.deepEquals":
        return { t: "bool", v: equalValues(args[0], args[1]) };
      case "Arrays.binarySearch": {
        if (args[0].t !== "list") throw new ProgramError("Arrays.binarySearch expects an array", line);
        let lo = 0;
        let hi = args[0].v.length - 1;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          const c = compareValues(args[0].v[mid], args[1]);
          if (c === 0) return int(BigInt(mid), 32, true);
          if (c < 0) lo = mid + 1;
          else hi = mid - 1;
        }
        return int(BigInt(-(lo + 1)), 32, true);
      }

      /* ------------------------------------------------------- Collections */
      case "Collections.sort": {
        if (args[0].t !== "list") throw new ProgramError("Collections.sort expects a list", line);
        sortInPlace(args[0].v, asComparator(ev, args[1], line));
        return UNIT;
      }
      case "Collections.reverse": {
        if (args[0].t !== "list") throw new ProgramError("Collections.reverse expects a list", line);
        args[0].v.reverse();
        return UNIT;
      }
      case "Collections.swap": {
        if (args[0].t !== "list") throw new ProgramError("Collections.swap expects a list", line);
        const i = Number(num(args[1]));
        const j = Number(num(args[2]));
        [args[0].v[i], args[0].v[j]] = [args[0].v[j], args[0].v[i]];
        return UNIT;
      }
      case "Collections.max":
      case "Collections.min": {
        const items = elementsOf(args[0], ev, line);
        if (items.length === 0) throw new ProgramError("NoSuchElementException", line);
        const cmp = asComparator(ev, args[1], line);
        const pick = dotted.endsWith("max")
          ? (a: Value, b: Value) => (cmp(a, b) >= 0 ? a : b)
          : (a: Value, b: Value) => (cmp(a, b) <= 0 ? a : b);
        return items.reduce(pick);
      }
      case "Collections.frequency": {
        const items = elementsOf(args[0], ev, line);
        return int(BigInt(items.filter((x) => equalValues(x, args[1])).length), 32, true);
      }
      case "Collections.nCopies":
        return jList(Array.from({ length: Number(num(args[0])) }, () => structuredCopy(args[1])));
      case "Collections.emptyList":
        return jList([]);
      case "Collections.unmodifiableList":
      case "Collections.unmodifiableSet":
      case "Collections.unmodifiableMap":
        // Immutability is a compile-time promise this interpreter cannot make,
        // and pretending otherwise would be worse than passing the value
        // through: a program that mutates one of these is already broken.
        return args[0];
      case "Collections.reverseOrder":
        return args.length === 0
          ? reverseOrderComparator()
          : nativeClosure(["a", "b"], (inner, ev2, line2) => {
              const base = asComparator(ev2, args[0], line2);
              return int(BigInt(-base(inner[0], inner[1])), 32, true);
            });

      /* -------------------------------------------------------- Comparator */
      case "Comparator.naturalOrder":
        return nativeClosure(["a", "b"], (inner) => int(BigInt(compareValues(inner[0], inner[1])), 32, true));
      case "Comparator.reverseOrder":
        return reverseOrderComparator();
      case "Comparator.comparingInt":
      case "Comparator.comparingLong":
      case "Comparator.comparingDouble":
      case "Comparator.comparing":
        return keyComparator(args[0]);

      /* ----------------------------------------------------------- Objects */
      case "Objects.equals":
        return { t: "bool", v: equalValues(args[0], args[1]) };
      case "Objects.requireNonNull":
        if (args[0].t === "unit") throw new ProgramError("NullPointerException", line);
        return args[0];

      /* ------------------------------------------------------ constructors */
      case "new ArrayList":
      case "new LinkedList":
        return jList(args[0] ? [...elementsOf(args[0], ev, line)] : [], "deque");
      case "new Stack":
        return jList([], "stack");
      case "new ArrayDeque":
        return jList(args[0] && args[0].t !== "int" ? [...elementsOf(args[0], ev, line)] : [], "deque");
      case "new HashMap":
      case "new LinkedHashMap": {
        const map: MapValue = { t: "map", v: new Map(), sorted: false };
        if (args[0]?.t === "map") for (const [k, v] of mapEntries(args[0])) mapPut(map, k, v);
        return map;
      }
      case "new TreeMap": {
        const map: MapValue = { t: "map", v: new Map(), sorted: true };
        if (args[0]?.t === "map") for (const [k, v] of mapEntries(args[0])) mapPut(map, k, v);
        return map;
      }
      case "new HashSet":
      case "new LinkedHashSet":
        return makeSet(false, args[0] && args[0].t !== "int" ? elementsOf(args[0], ev, line) : []);
      case "new TreeSet":
        return makeSet(true, args[0] && args[0].t !== "int" && args[0].t !== "closure"
          ? elementsOf(args[0], ev, line)
          : []);
      case "new PriorityQueue": {
        // The comparator may be the only argument, or may follow an initial
        // capacity — `new PriorityQueue<>(k, cmp)`.
        const cmp = args.find((a) => a.t === "closure") as ClosureValue | undefined;
        const heap = makeHeap("min", cmp);
        const seed = args.find((a) => a.t === "list" || a.t === "set");
        if (seed) for (const item of elementsOf(seed, ev, line)) heapPush(heap, item, heapCmp(heap, ev, line));
        return heap;
      }
      case "new String":
        return { t: "str", v: args.length ? (args[0].t === "list" ? args[0].v.map(text).join("") : text(args[0])) : "" };
      case "new StringBuilder":
      case "new StringBuffer":
        return { t: "str", v: args.length && args[0].t === "str" ? args[0].v : "" };
    }

    if (dotted.startsWith("new ")) {
      throw new UnsupportedError(`\`${dotted}\``, line);
    }
    return undefined;
  },

  callMethod(target, name, args, ev, line) {
    const text = (v: Value) => javaDisplay(v);
    const num = (v: Value) => ev.asInt(v, line);

    /* ------------------------------------------------------------ sequences */
    if (target.t === "list") {
      const seq = target.v;
      // `push`/`pop`/`peek` are the one place where the container's identity
      // matters: on a Stack they work at the end, on an ArrayDeque at the
      // front. Everything else below is the same for both.
      const stackLike = target.kind === "stack";
      switch (name) {
        case "size": return int(BigInt(seq.length), 32, true);
        case "isEmpty": return { t: "bool", v: seq.length === 0 };
        case "empty": return { t: "bool", v: seq.length === 0 };
        case "clear": seq.length = 0; return UNIT;
        case "get": return seqGet(target, args[0], ev, line);
        case "set": {
          const i = seqIndex(target, args[0], ev, line);
          const previous = seq[i];
          seq[i] = args[1];
          return previous;
        }
        case "add":
          // `add(index, element)` inserts; `add(element)` appends.
          if (args.length === 2) { seq.splice(Number(num(args[0])), 0, args[1]); return UNIT; }
          seq.push(args[0]);
          return { t: "bool", v: true };
        case "addAll": {
          const incoming = elementsOf(args[args.length - 1], ev, line);
          if (args.length === 2) seq.splice(Number(num(args[0])), 0, ...incoming);
          else seq.push(...incoming);
          return { t: "bool", v: incoming.length > 0 };
        }
        case "remove": {
          if (args.length === 0) {
            if (seq.length === 0) throw new ProgramError("NoSuchElementException", line);
            return seq.shift()!;
          }
          // `remove(int)` on a List is by index and `remove(Object)` is by
          // value — a distinction Java makes with static types, which this
          // interpreter does not have. An integer argument to a plain list is
          // read as an index, matching `List.remove(int)`.
          if (args[0].t === "int" && (target.kind === "list" || target.kind === "array")) {
            const i = seqIndex(target, args[0], ev, line);
            return seq.splice(i, 1)[0];
          }
          const at = seq.findIndex((x) => equalValues(x, args[0]));
          if (at === -1) return { t: "bool", v: false };
          seq.splice(at, 1);
          return { t: "bool", v: true };
        }
        case "contains": return { t: "bool", v: seq.some((x) => equalValues(x, args[0])) };
        case "indexOf": return int(BigInt(seq.findIndex((x) => equalValues(x, args[0]))), 32, true);
        case "lastIndexOf": {
          for (let i = seq.length - 1; i >= 0; i--) if (equalValues(seq[i], args[0])) return int(BigInt(i), 32, true);
          return int(-1n, 32, true);
        }
        case "subList": return jList(seq.slice(Number(num(args[0])), Number(num(args[1]))));
        case "toArray": return jList([...seq], "array");
        case "sort": sortInPlace(seq, asComparator(ev, args[0], line)); return UNIT;
        case "forEach": {
          for (const item of [...seq]) ev.callClosure(args[0] as ClosureValue, [item], line);
          return UNIT;
        }
        case "equals": return { t: "bool", v: equalValues(target, args[0]) };
        case "toString": return { t: "str", v: text(target) };

        /* deque and queue */
        case "push":
          if (stackLike) seq.push(args[0]);
          else seq.unshift(args[0]);
          return UNIT;
        case "pop": {
          if (seq.length === 0) throw new ProgramError("NoSuchElementException", line);
          return stackLike ? seq.pop()! : seq.shift()!;
        }
        case "peek":
          if (seq.length === 0) return UNIT;
          return stackLike ? seq[seq.length - 1] : seq[0];
        case "addFirst":
        case "offerFirst": seq.unshift(args[0]); return { t: "bool", v: true };
        case "addLast":
        case "offer":
        case "offerLast": seq.push(args[0]); return { t: "bool", v: true };
        case "poll":
        case "pollFirst": return seq.length ? seq.shift()! : UNIT;
        case "pollLast": return seq.length ? seq.pop()! : UNIT;
        case "removeFirst":
          if (seq.length === 0) throw new ProgramError("NoSuchElementException", line);
          return seq.shift()!;
        case "removeLast":
          if (seq.length === 0) throw new ProgramError("NoSuchElementException", line);
          return seq.pop()!;
        case "peekFirst": return seq.length ? seq[0] : UNIT;
        case "peekLast": return seq.length ? seq[seq.length - 1] : UNIT;
        case "getFirst":
        case "element":
          if (seq.length === 0) throw new ProgramError("NoSuchElementException", line);
          return seq[0];
        case "getLast":
          if (seq.length === 0) throw new ProgramError("NoSuchElementException", line);
          return seq[seq.length - 1];
      }
    }

    /* ---------------------------------------------------------------- sets */
    if (target.t === "set") {
      switch (name) {
        case "add": return { t: "bool", v: setAdd(target, args[0]) };
        case "remove": return { t: "bool", v: setRemove(target, args[0]) };
        case "contains": return { t: "bool", v: setHas(target, args[0]) };
        case "size": return int(BigInt(target.v.size), 32, true);
        case "isEmpty": return { t: "bool", v: target.v.size === 0 };
        case "clear": target.v.clear(); return UNIT;
        case "addAll": {
          let changed = false;
          for (const item of elementsOf(args[0], ev, line)) changed = setAdd(target, item) || changed;
          return { t: "bool", v: changed };
        }
        case "removeAll": {
          let changed = false;
          for (const item of elementsOf(args[0], ev, line)) changed = setRemove(target, item) || changed;
          return { t: "bool", v: changed };
        }
        case "retainAll": {
          const keep = new Set(elementsOf(args[0], ev, line).map(keyOf));
          let changed = false;
          for (const key of [...target.v.keys()]) {
            if (!keep.has(key)) { target.v.delete(key); changed = true; }
          }
          return { t: "bool", v: changed };
        }
        case "containsAll":
          return { t: "bool", v: elementsOf(args[0], ev, line).every((x) => setHas(target, x)) };
        case "toArray": return jList(setItems(target), "array");
        case "forEach": {
          for (const item of setItems(target)) ev.callClosure(args[0] as ClosureValue, [item], line);
          return UNIT;
        }
        case "toString": return { t: "str", v: text(target) };
        /* TreeSet navigation */
        case "first":
        case "last": {
          const items = sortedSetItems(target);
          if (items.length === 0) throw new ProgramError("NoSuchElementException", line);
          return name === "first" ? items[0] : items[items.length - 1];
        }
        case "pollFirst":
        case "pollLast": {
          const items = sortedSetItems(target);
          if (items.length === 0) return UNIT;
          const picked = name === "pollFirst" ? items[0] : items[items.length - 1];
          setRemove(target, picked);
          return picked;
        }
        case "floor":
        case "ceiling":
        case "lower":
        case "higher":
          return navigate(sortedSetItems(target), args[0], name) ?? UNIT;
      }
    }

    /* ---------------------------------------------------------------- maps */
    if (target.t === "map") {
      switch (name) {
        case "put": return mapPut(target, args[0], args[1]) ?? UNIT;
        case "get": return mapGet(target, args[0]) ?? UNIT;
        case "getOrDefault": return mapGet(target, args[0]) ?? args[1];
        case "containsKey": return { t: "bool", v: target.v.has(keyOf(args[0])) };
        case "containsValue":
          return { t: "bool", v: [...target.v.values()].some(([, v]) => equalValues(v, args[0])) };
        case "size": return int(BigInt(target.v.size), 32, true);
        case "isEmpty": return { t: "bool", v: target.v.size === 0 };
        case "clear": target.v.clear(); return UNIT;
        case "remove": {
          const previous = mapGet(target, args[0]);
          target.v.delete(keyOf(args[0]));
          return previous ?? UNIT;
        }
        case "putIfAbsent": {
          const existing = mapGet(target, args[0]);
          if (existing === undefined) { mapPut(target, args[0], args[1]); return UNIT; }
          return existing;
        }
        case "computeIfAbsent": {
          const existing = mapGet(target, args[0]);
          if (existing !== undefined) return existing;
          const made = ev.callClosure(args[1] as ClosureValue, [args[0]], line);
          mapPut(target, args[0], made);
          return made;
        }
        case "computeIfPresent": {
          const existing = mapGet(target, args[0]);
          if (existing === undefined) return UNIT;
          const made = ev.callClosure(args[1] as ClosureValue, [args[0], existing], line);
          mapPut(target, args[0], made);
          return made;
        }
        case "compute": {
          const existing = mapGet(target, args[0]) ?? UNIT;
          const made = ev.callClosure(args[1] as ClosureValue, [args[0], existing], line);
          mapPut(target, args[0], made);
          return made;
        }
        case "merge": {
          const existing = mapGet(target, args[0]);
          const made = existing === undefined
            ? args[1]
            : ev.callClosure(args[2] as ClosureValue, [existing, args[1]], line);
          mapPut(target, args[0], made);
          return made;
        }
        case "keySet": return makeSet(target.sorted, mapEntries(target).map(([k]) => k));
        case "values": return jList(mapEntries(target).map(([, v]) => v));
        case "entrySet":
          return jList(mapEntries(target).map(([k, v]) => ({ t: "tuple" as const, v: [k, v] })));
        case "forEach": {
          for (const [k, v] of mapEntries(target)) ev.callClosure(args[0] as ClosureValue, [k, v], line);
          return UNIT;
        }
        case "toString": return { t: "str", v: text(target) };
        /* TreeMap navigation */
        case "firstKey":
        case "lastKey": {
          const keys = mapEntries(target).map(([k]) => k);
          if (keys.length === 0) throw new ProgramError("NoSuchElementException", line);
          return name === "firstKey" ? keys[0] : keys[keys.length - 1];
        }
        case "firstEntry":
        case "lastEntry": {
          const entries = mapEntries(target);
          if (entries.length === 0) return UNIT;
          const [k, v] = name === "firstEntry" ? entries[0] : entries[entries.length - 1];
          return { t: "tuple", v: [k, v] };
        }
        case "pollFirstEntry":
        case "pollLastEntry": {
          const entries = mapEntries(target);
          if (entries.length === 0) return UNIT;
          const [k, v] = name === "pollFirstEntry" ? entries[0] : entries[entries.length - 1];
          target.v.delete(keyOf(k));
          return { t: "tuple", v: [k, v] };
        }
        case "floorKey":
        case "ceilingKey":
        case "lowerKey":
        case "higherKey": {
          const dir = name.replace("Key", "") as NavDirection;
          return navigate(mapEntries(target).map(([k]) => k), args[0], dir) ?? UNIT;
        }
        case "floorEntry":
        case "ceilingEntry":
        case "lowerEntry":
        case "higherEntry": {
          const dir = name.replace("Entry", "") as NavDirection;
          const key = navigate(mapEntries(target).map(([k]) => k), args[0], dir);
          if (key === undefined) return UNIT;
          return { t: "tuple", v: [key, mapGet(target, key)!] };
        }
      }
    }

    /* ------------------------------------------------------ priority queues */
    if (target.t === "heap") {
      const cmp = heapCmp(target, ev, line);
      switch (name) {
        case "add":
        case "offer": heapPush(target, args[0], cmp); return { t: "bool", v: true };
        case "poll": return heapPop(target, cmp) ?? UNIT;
        case "remove":
          if (args.length === 0) {
            const top = heapPop(target, cmp);
            if (top === undefined) throw new ProgramError("NoSuchElementException", line);
            return top;
          } else {
            // Removing an arbitrary element is O(n) on a real PriorityQueue
            // too: find it, drop it, and rebuild.
            const at = target.v.findIndex((x) => equalValues(x, args[0]));
            if (at === -1) return { t: "bool", v: false };
            const rest = target.v.filter((_, i) => i !== at);
            target.v.length = 0;
            for (const item of rest) heapPush(target, item, cmp);
            return { t: "bool", v: true };
          }
        case "peek": return target.v.length ? heapDrained(target, cmp)[0] : UNIT;
        case "element": {
          if (target.v.length === 0) throw new ProgramError("NoSuchElementException", line);
          return heapDrained(target, cmp)[0];
        }
        case "size": return int(BigInt(target.v.length), 32, true);
        case "isEmpty": return { t: "bool", v: target.v.length === 0 };
        case "clear": target.v.length = 0; return UNIT;
        case "contains": return { t: "bool", v: target.v.some((x) => equalValues(x, args[0])) };
        case "toArray": return jList(heapDrained(target, cmp), "array");
        case "toString": return { t: "str", v: text(target) };
      }
    }

    /* ------------------------------------------------- Map.Entry, as a tuple */
    if (target.t === "tuple" && target.v.length === 2) {
      if (name === "getKey") return target.v[0];
      if (name === "getValue") return target.v[1];
      if (name === "setValue") { const previous = target.v[1]; target.v[1] = args[0]; return previous; }
    }

    /* ------------------------------------- comparators built from other ones */
    if (target.t === "closure") {
      if (name === "reversed") {
        const base = asComparator(ev, target, line);
        return nativeClosure(["a", "b"], (inner) => int(BigInt(-base(inner[0], inner[1])), 32, true));
      }
      if (name === "thenComparing" || name === "thenComparingInt" || name === "thenComparingDouble") {
        const first = asComparator(ev, target, line);
        // The argument is either another comparator or a key extractor. A
        // comparator takes two parameters and an extractor takes one, which is
        // exactly how Java's overload resolution tells them apart.
        const arg = args[0] as ClosureValue;
        const second = arg.params.length >= 2
          ? asComparator(ev, arg, line)
          : asComparator(ev, keyComparator(arg), line);
        return nativeClosure(["a", "b"], (inner) => {
          const c = first(inner[0], inner[1]);
          return int(BigInt(c !== 0 ? c : second(inner[0], inner[1])), 32, true);
        });
      }
    }

    /* ------------------------------------------------- strings and builders */
    if (target.t === "str") {
      switch (name) {
        case "length": return int(BigInt(target.v.length), 32, true);
        case "isEmpty": return { t: "bool", v: target.v.length === 0 };
        case "isBlank": return { t: "bool", v: target.v.trim().length === 0 };
        case "charAt": {
          const i = Number(num(args[0]));
          if (i < 0 || i >= target.v.length) {
            throw new ProgramError(
              `StringIndexOutOfBoundsException: index ${i}, length ${target.v.length}`,
              line
            );
          }
          return { t: "char", v: target.v[i] };
        }
        case "substring": {
          const from = Number(num(args[0]));
          const to = args[1] ? Number(num(args[1])) : target.v.length;
          if (from < 0 || to > target.v.length || from > to) {
            throw new ProgramError(
              `StringIndexOutOfBoundsException: begin ${from}, end ${to}, length ${target.v.length}`,
              line
            );
          }
          return { t: "str", v: target.v.substring(from, to) };
        }
        case "toUpperCase": return { t: "str", v: target.v.toUpperCase() };
        case "toLowerCase": return { t: "str", v: target.v.toLowerCase() };
        case "trim":
        case "strip": return { t: "str", v: target.v.trim() };
        case "equals": return { t: "bool", v: args[0].t === "str" && args[0].v === target.v };
        case "equalsIgnoreCase":
          return { t: "bool", v: args[0].t === "str" && args[0].v.toLowerCase() === target.v.toLowerCase() };
        case "compareTo": {
          const other = text(args[0]);
          return int(BigInt(target.v < other ? -1 : target.v > other ? 1 : 0), 32, true);
        }
        case "contains": return { t: "bool", v: target.v.includes(text(args[0])) };
        case "startsWith": return { t: "bool", v: target.v.startsWith(text(args[0])) };
        case "endsWith": return { t: "bool", v: target.v.endsWith(text(args[0])) };
        case "indexOf":
          return int(BigInt(target.v.indexOf(text(args[0]), args[1] ? Number(num(args[1])) : 0)), 32, true);
        case "lastIndexOf": return int(BigInt(target.v.lastIndexOf(text(args[0]))), 32, true);
        case "replace":
          return { t: "str", v: target.v.split(text(args[0])).join(text(args[1])) };
        case "split": {
          const parts = splitJava(target.v, text(args[0]), line);
          return jList(parts.map((piece) => ({ t: "str" as const, v: piece })), "array");
        }
        case "repeat": return { t: "str", v: target.v.repeat(Number(num(args[0]))) };
        case "concat": return { t: "str", v: target.v + text(args[0]) };
        case "toCharArray":
          return jList([...target.v].map((ch) => ({ t: "char" as const, v: ch })), "array");
        // A copy, not `target`: a StringBuilder is modelled as a `str` too, and
        // handing back the same object would alias the String you just built
        // to the builder that keeps growing.
        case "toString": return { t: "str", v: target.v };

        /* StringBuilder — these mutate in place, which is what makes the
           builder a builder rather than another immutable String. */
        case "append": target.v += text(args[0]); return target;
        case "reverse": target.v = [...target.v].reverse().join(""); return target;
        case "setCharAt": {
          const i = Number(num(args[0]));
          if (i < 0 || i >= target.v.length) {
            throw new ProgramError(`StringIndexOutOfBoundsException: index ${i}`, line);
          }
          target.v = target.v.slice(0, i) + text(args[1]) + target.v.slice(i + 1);
          return UNIT;
        }
        case "deleteCharAt": {
          const i = Number(num(args[0]));
          if (i < 0 || i >= target.v.length) {
            throw new ProgramError(`StringIndexOutOfBoundsException: index ${i}`, line);
          }
          target.v = target.v.slice(0, i) + target.v.slice(i + 1);
          return target;
        }
        case "insert": {
          const i = Number(num(args[0]));
          target.v = target.v.slice(0, i) + text(args[1]) + target.v.slice(i);
          return target;
        }
        case "delete": {
          target.v = target.v.slice(0, Number(num(args[0]))) + target.v.slice(Number(num(args[1])));
          return target;
        }
        case "setLength": {
          const size = Number(num(args[0]));
          target.v = target.v.length > size ? target.v.slice(0, size) : target.v.padEnd(size, "\0");
          return UNIT;
        }
      }
    }

    if (target.t === "int" || target.t === "float" || target.t === "bool" || target.t === "char") {
      if (name === "toString") return { t: "str", v: text(target) };
      if (name === "equals") return { t: "bool", v: equalValues(target, args[0]) };
      if (name === "compareTo") return int(BigInt(compareValues(target, args[0])), 32, true);
      if (name === "intValue" || name === "longValue") return target;
      if (name === "doubleValue") return { t: "float", v: ev.asFloat(target, line) };
      if (name === "charValue") return target;
    }

    if (target.t === "struct" && (target.name === "System.out" || target.name === "System.err")) {
      const forward = `${target.name}.${name}`;
      return javaDialect.callBuiltin!(forward, args, ev, line);
    }
    return undefined;
  },
};

/* ------------------------------------------------------------ Java helpers -- */

function jList(v: Value[], kind: SeqKind = "list"): ListValue {
  return { t: "list", v, kind };
}

/** The value a widened array is padded with, matching the element already there. */
function zeroLike(sample: Value | undefined): Value {
  if (!sample) return int(0n, 32, true);
  switch (sample.t) {
    case "float": return { t: "float", v: 0 };
    case "bool": return { t: "bool", v: false };
    case "str": return { t: "str", v: "" };
    case "char": return { t: "char", v: "\0" };
    case "int": return int(0n, sample.width, sample.signed);
    default: return UNIT;
  }
}

function reverseOrderComparator(): ClosureValue {
  return nativeClosure(["a", "b"], (inner) => int(BigInt(-compareValues(inner[0], inner[1])), 32, true));
}

/** `Comparator.comparingInt(f)` and friends: compare by an extracted key. */
function keyComparator(extractor: Value): ClosureValue {
  return nativeClosure(["a", "b"], (inner, ev, line) => {
    const ka = ev.callClosure(extractor as ClosureValue, [inner[0]], line);
    const kb = ev.callClosure(extractor as ClosureValue, [inner[1]], line);
    return int(BigInt(compareValues(ka, kb)), 32, true);
  });
}

/**
 * `String.split`, for the separators that are not regular expressions.
 *
 * Java's argument is a regex, and treating one as a literal would silently
 * split `"a.b"` on `.` into two pieces where the real thing produces empty
 * strings. Rather than ship half a regex engine, the handful of patterns that
 * are plainly literal are handled and everything else stops — which is the
 * behaviour this runtime promises for anything it does not implement.
 */
function splitJava(text: string, pattern: string, line: number): string[] {
  if (pattern === "") return [...text];
  if (/^[A-Za-z0-9_ ,;:@#%&=~<>/'"-]+$/.test(pattern)) {
    // Java drops trailing empty strings; JavaScript keeps them.
    const parts = text.split(pattern);
    while (parts.length > 0 && parts[parts.length - 1] === "") parts.pop();
    return parts;
  }
  if (pattern === "\\s+" || pattern === " +") return text.split(/\s+/).filter((p, i) => p !== "" || i > 0);
  if (pattern === "\\.") {
    const parts = text.split(".");
    while (parts.length > 0 && parts[parts.length - 1] === "") parts.pop();
    return parts;
  }
  throw new UnsupportedError(`\`split\` with the regular expression \`${pattern}\``, line);
}

/** Java's printf/String.format, limited to the conversions the track uses. */
function javaPrintf(args: Value[], line: number): string {
  if (args[0]?.t !== "str") throw new ProgramError("format string must be a string", line);
  const template = args[0].v;
  const rest = args.slice(1);
  let index = 0;
  return template.replace(/%(-?\d+)?(?:\.(\d+))?([sdfnb%])/g, (_all, width, precision, conv) => {
    if (conv === "%") return "%";
    if (conv === "n") return "\n";
    const value = rest[index++];
    if (value === undefined) throw new ProgramError("not enough arguments for format string", line);
    let text: string;
    if (conv === "d") text = ev_asInt(value, line).toString();
    else if (conv === "f") text = Number(value.t === "float" ? value.v : Number(ev_asInt(value, line))).toFixed(precision ? Number(precision) : 6);
    else if (conv === "b") text = String(value.t === "bool" ? value.v : true);
    else text = javaDisplay(value);
    if (width) {
      const size = Math.abs(Number(width));
      const padLeft = Number(width) > 0;
      while (text.length < size) text = padLeft ? " " + text : text + " ";
    }
    return text;
  });
}

// -------------------------------------------------------------- entry points

export function execute(source: string, dialect: Dialect): RuntimeResult {
  const out = new OutputSink();
  let exitCode: number | null = 0;
  try {
    const program = parse(source, dialect.parseAs ?? (dialect.name as "rust" | "cpp" | "java"));
    new Evaluator(program, dialect, out).run();
    out.flush();
  } catch (error) {
    out.flush();
    const message = error instanceof Error ? error.message : String(error);
    if (dialect.name === "rust" && error instanceof ProgramError) {
      out.note("error", `thread 'main' panicked at ${message}`);
    } else {
      out.note("error", message);
    }
    if (error instanceof UnsupportedError) {
      out.note(
        "info",
        "This playground runs a browser interpreter that covers the subset these lessons teach. It stops rather than guess when it meets something outside that."
      );
    }
    exitCode = 1;
  }
  return { lines: out.lines, exitCode };
}

export const runRust = (source: string) => execute(source, rustDialect);
export const runCpp = (source: string) => execute(source, cppDialect);
export const runJava = (source: string) => execute(source, javaDialect);

export { cDialect, runC } from "./cdialect";
export { goDialect, runGo } from "./godialect";
