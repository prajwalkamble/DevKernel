/**
 * The parts of a standard library that are the same in every language.
 *
 * Sorting, comparators, bounds checks and the seven collection operations that
 * every dialect exposes under a different name all live here, so that adding a
 * language means writing a table of names rather than another heap.
 *
 * The contract from `types.ts` applies throughout: anything not implemented
 * must throw `UnsupportedError`, never return a plausible wrong answer.
 */
import {
  compareValues,
  heapComparator,
  int,
  keyOf,
  setItems,
  type ClosureValue,
  type Comparator,
  type Evaluator,
  type HeapValue,
  type ListValue,
  type MapValue,
  type SetValue,
  type Value,
} from "./lang";
import { ProgramError, UnsupportedError } from "./types";

/* ------------------------------------------------------------- comparators -- */

/**
 * Turns whatever the program passed as a comparator into a comparison
 * function.
 *
 * A comparator may be a lambda, or one of the objects `Comparator.comparingInt`
 * and friends build — which are modelled as closures too, so there is only one
 * case to handle. Absent, it means natural ordering.
 */
export function asComparator(
  ev: Evaluator,
  value: Value | undefined,
  line: number
): Comparator {
  if (value === undefined || value.t === "unit") return compareValues;
  if (value.t === "closure") {
    return (a, b) => {
      const result = ev.callClosure(value as ClosureValue, [a, b], line);
      if (result.t === "int") return Number(result.v);
      if (result.t === "float") return result.v;
      if (result.t === "bool") return result.v ? -1 : 1;
      throw new ProgramError("a comparator must return a number", line);
    };
  }
  throw new UnsupportedError("that kind of comparator", line);
}

/**
 * Sorts in place, stably.
 *
 * `Array.prototype.sort` is required to be stable by the language spec, which
 * matters here: `Arrays.sort` on objects, `Collections.sort`, `std::stable_sort`
 * and Python's `sorted` all promise stability, and a problem that sorts by one
 * key and relies on the previous order of ties is a common enough pattern that
 * an unstable sort would produce wrong answers on correct code.
 */
export function sortInPlace(items: Value[], cmp: Comparator): void {
  items.sort(cmp);
}

/* -------------------------------------------------------------- collections -- */

export function seqIndex(list: ListValue, index: Value, ev: Evaluator, line: number): number {
  const i = Number(ev.asInt(index, line));
  if (i < 0 || i >= list.v.length) {
    throw new ProgramError(
      `index ${i} out of bounds for length ${list.v.length}`,
      line
    );
  }
  return i;
}

/** Bounds-checked read, used wherever a language's `get`/`at` would throw. */
export function seqGet(list: ListValue, index: Value, ev: Evaluator, line: number): Value {
  return list.v[seqIndex(list, index, ev, line)];
}

export function setAdd(set: SetValue, value: Value): boolean {
  const key = keyOf(value);
  if (set.v.has(key)) return false;
  set.v.set(key, value);
  return true;
}

export function setRemove(set: SetValue, value: Value): boolean {
  return set.v.delete(keyOf(value));
}

export function setHas(set: SetValue, value: Value): boolean {
  return set.v.has(keyOf(value));
}

export function mapGet(map: MapValue, key: Value): Value | undefined {
  return map.v.get(keyOf(key))?.[1];
}

export function mapPut(map: MapValue, key: Value, value: Value): Value | undefined {
  const slot = map.v.get(keyOf(key));
  map.v.set(keyOf(key), [key, value]);
  return slot?.[1];
}

/**
 * The navigation queries a sorted container answers: the greatest element ≤ x,
 * the least element ≥ x, and the strict versions.
 *
 * One implementation serves `TreeSet.floor`/`ceiling`/`lower`/`higher`,
 * `TreeMap.floorKey` and the rest, C++'s `lower_bound`/`upper_bound` and
 * Rust's `BTreeMap` range queries. Linear rather than binary because these
 * containers are backed by insertion-ordered maps here; the *answer* is what
 * has to be right, and a learner comparing outputs cannot see the difference.
 */
export type NavDirection = "floor" | "ceiling" | "lower" | "higher";

export function navigate(sorted: Value[], target: Value, dir: NavDirection): Value | undefined {
  let best: Value | undefined;
  for (const item of sorted) {
    const c = compareValues(item, target);
    if (dir === "floor" && c <= 0) best = item;
    else if (dir === "lower" && c < 0) best = item;
    else if (dir === "ceiling" && c >= 0) return item;
    else if (dir === "higher" && c > 0) return item;
  }
  return dir === "floor" || dir === "lower" ? best : undefined;
}

export function sortedSetItems(set: SetValue): Value[] {
  return [...set.v.values()].sort(compareValues);
}

/** Every element of a container, in the order that container iterates. */
export function elementsOf(value: Value, ev: Evaluator, line: number): Value[] {
  switch (value.t) {
    case "list": return value.v;
    case "set": return setItems(value);
    case "str": return [...value.v].map((ch) => ({ t: "char" as const, v: ch }));
    case "range": {
      const out: Value[] = [];
      const end = value.inclusive ? value.to + 1n : value.to;
      for (let i = value.from; i < end; i++) out.push(int(i, 64, true));
      return out;
    }
    case "heap": {
      const items: Value[] = [];
      for (const item of ev.iterate(value, line)) items.push(item);
      return items;
    }
    case "map": {
      const items: Value[] = [];
      for (const item of ev.iterate(value, line)) items.push(item);
      return items;
    }
    default:
      throw new ProgramError(`cannot read elements of that value`, line);
  }
}

/** A heap's comparator, resolved through the evaluator when the program set one. */
export function heapCmp(heap: HeapValue, ev: Evaluator, line: number): Comparator {
  if (!heap.cmp) return heapComparator(heap);
  return heapComparator(heap, asComparator(ev, heap.cmp, line));
}

/* ------------------------------------------------------------------ numbers -- */

/** Floor division, which is what `Math.floorDiv` and Python's `//` compute. */
export function floorDiv(a: bigint, b: bigint, line: number): bigint {
  if (b === 0n) throw new ProgramError("/ by zero", line);
  const q = a / b;
  return (a % b !== 0n && (a < 0n) !== (b < 0n)) ? q - 1n : q;
}

/** The non-negative remainder that pairs with `floorDiv`. */
export function floorMod(a: bigint, b: bigint, line: number): bigint {
  if (b === 0n) throw new ProgramError("/ by zero", line);
  return a - floorDiv(a, b, line) * b;
}
