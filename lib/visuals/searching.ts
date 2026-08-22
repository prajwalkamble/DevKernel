/** Searching, instrumented the same way as the sorts. */
import { Recorder, type ArrayFrame, type Role, type Visualisation } from "./types";

function span(from: number, to: number, role: Role): Record<number, Role> {
  const out: Record<number, Role> = {};
  for (let i = from; i <= to; i++) out[i] = role;
  return out;
}

export function linearSearch(values: number[], target: number): Visualisation {
  const rec = new Recorder<ArrayFrame>();
  const emit = (roles: Record<number, Role>, note: string, markers?: Record<number, string>) =>
    rec.push({ kind: "array", values: [...values], roles, note, markers });

  emit({}, `Looking for ${target} by checking every position in turn.`);
  for (let i = 0; i < values.length; i++) {
    rec.bump("comparisons");
    emit({ ...span(0, i - 1, "discarded"), [i]: "compare" }, `Is values[${i}] = ${values[i]} the target?`);
    if (values[i] === target) {
      emit({ ...span(0, i - 1, "discarded"), [i]: "found" }, `Found ${target} at index ${i}.`);
      return { frames: rec.frames, summary: linearSummary };
    }
  }
  emit(span(0, values.length - 1, "discarded"), `${target} is not in the array.`);
  return { frames: rec.frames, summary: linearSummary };
}

const linearSummary =
  "Linear search checks every position until it finds the target. O(n) comparisons, no precondition — it works on unsorted data, which is the only reason to prefer it.";

export function binarySearch(values: number[], target: number): Visualisation {
  const rec = new Recorder<ArrayFrame>();
  const emit = (roles: Record<number, Role>, note: string, markers?: Record<number, string>) =>
    rec.push({ kind: "array", values: [...values], roles, note, markers });

  let lo = 0;
  let hi = values.length;
  emit(span(0, values.length - 1, "window"),
    `Looking for ${target}. The window is the whole array, and the target must be inside it if it exists.`,
    { 0: "lo", [values.length - 1]: "hi" });

  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    rec.bump("comparisons");
    emit({ ...span(0, lo - 1, "discarded"), ...span(lo, hi - 1, "window"), ...span(hi, values.length - 1, "discarded"), [mid]: "compare" },
      `Look at the middle: values[${mid}] = ${values[mid]}.`,
      { [lo]: "lo", [mid]: "mid", [hi - 1]: "hi" });
    if (values[mid] === target) {
      emit({ ...span(0, values.length - 1, "discarded"), [mid]: "found" },
        `${values[mid]} is the target. Found at index ${mid}.`);
      return { frames: rec.frames, summary: binarySummary };
    }
    if (values[mid] < target) {
      emit({ ...span(0, mid, "discarded"), ...span(mid + 1, hi - 1, "window"), ...span(hi, values.length - 1, "discarded") },
        `${values[mid]} < ${target}, so the target cannot be at ${mid} or to its left. Discard that half.`);
      lo = mid + 1;
    } else {
      emit({ ...span(0, lo - 1, "discarded"), ...span(lo, mid - 1, "window"), ...span(mid, values.length - 1, "discarded") },
        `${values[mid]} > ${target}, so the target cannot be at ${mid} or to its right. Discard that half.`);
      hi = mid;
    }
  }
  emit(span(0, values.length - 1, "discarded"),
    `The window is empty, so ${target} is not in the array.`);
  return { frames: rec.frames, summary: binarySummary };
}

const binarySummary =
  "Binary search halves the window at every step, so it needs about log₂(n) comparisons — twenty for a million elements. It requires sorted input, because discarding a half is only justified when the middle value tells you which side the target must be on.";


export function jumpSearch(values: number[], target: number): Visualisation {
  const rec = new Recorder<ArrayFrame>();
  const emit = (roles: Record<number, Role>, note: string, markers?: Record<number, string>) =>
    rec.push({ kind: "array", values: [...values], roles, note, markers });

  const step = Math.max(1, Math.floor(Math.sqrt(values.length)));
  emit({}, `Jump search steps ${step} at a time — √${values.length} — then walks back linearly.`);
  let prev = 0;
  let at = 0;
  while (at < values.length && values[Math.min(at, values.length - 1)] < target) {
    rec.bump("jumps");
    emit({ ...span(0, at, "discarded"), [Math.min(at, values.length - 1)]: "compare" },
      `values[${Math.min(at, values.length - 1)}] = ${values[Math.min(at, values.length - 1)]} < ${target}, so jump past this block.`);
    prev = at + 1;
    at += step;
  }
  const end = Math.min(at, values.length - 1);
  emit({ ...span(prev, end, "window") },
    `The target must be between index ${prev} and ${end}, so scan that block.`);
  for (let i = prev; i <= end; i++) {
    rec.bump("comparisons");
    emit({ ...span(prev, end, "window"), [i]: "compare" }, `Is values[${i}] = ${values[i]} the target?`);
    if (values[i] === target) {
      emit({ [i]: "found" }, `Found ${target} at index ${i}.`);
      return { frames: rec.frames, summary: jumpSummary };
    }
  }
  emit(span(0, values.length - 1, "discarded"), `${target} is not in the array.`);
  return { frames: rec.frames, summary: jumpSummary };
}

const jumpSummary =
  "Jump search skips forward in blocks of √n until it overshoots, then scans one block linearly. That gives O(√n) — worse than binary search's O(log n), but it only ever steps *forward*, which matters on storage where seeking backwards is expensive, such as a tape or a singly linked list.";

export function exponentialSearch(values: number[], target: number): Visualisation {
  const rec = new Recorder<ArrayFrame>();
  const emit = (roles: Record<number, Role>, note: string) =>
    rec.push({ kind: "array", values: [...values], roles, note });

  emit({ 0: "compare" }, `Exponential search doubles a bound until it passes the target, then binary searches inside it.`);
  let bound = 1;
  while (bound < values.length && values[bound] < target) {
    rec.bump("doublings");
    emit({ ...span(0, bound, "discarded"), [bound]: "compare" },
      `values[${bound}] = ${values[bound]} < ${target}, so double the bound to ${bound * 2}.`);
    bound *= 2;
  }
  const lo0 = Math.floor(bound / 2);
  const hi0 = Math.min(bound, values.length - 1);
  emit(span(lo0, hi0, "window"),
    `The target must lie between ${lo0} and ${hi0} — a range of at most ${hi0 - lo0 + 1}. Binary search it.`);

  let lo = lo0;
  let hi = hi0 + 1;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    rec.bump("comparisons");
    emit({ ...span(lo, hi - 1, "window"), [mid]: "compare" }, `Middle of the range: values[${mid}] = ${values[mid]}.`);
    if (values[mid] === target) {
      emit({ [mid]: "found" }, `Found ${target} at index ${mid}.`);
      return { frames: rec.frames, summary: exponentialSummary };
    }
    if (values[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  emit(span(0, values.length - 1, "discarded"), `${target} is not in the array.`);
  return { frames: rec.frames, summary: exponentialSummary };
}

const exponentialSummary =
  "Exponential search finds a bracket by doubling — index 1, 2, 4, 8 — and then binary searches inside it. Both halves cost O(log p) where p is the target's position, so it beats plain binary search when the target is near the front, and it is the only one of these that works on an *unbounded* sequence where you cannot ask for the length.";

export function interpolationSearch(values: number[], target: number): Visualisation {
  const rec = new Recorder<ArrayFrame>();
  const emit = (roles: Record<number, Role>, note: string, markers?: Record<number, string>) =>
    rec.push({ kind: "array", values: [...values], roles, note, markers });

  let lo = 0;
  let hi = values.length - 1;
  emit(span(0, hi, "window"), `Interpolation search guesses *where* the target should be, rather than always halving.`);
  while (lo <= hi && target >= values[lo] && target <= values[hi]) {
    const span_ = values[hi] - values[lo];
    const pos = span_ === 0 ? lo : lo + Math.floor(((target - values[lo]) * (hi - lo)) / span_);
    rec.bump("probes");
    emit({ ...span(lo, hi, "window"), [pos]: "compare" },
      `${target} sits about ${Math.round(((target - values[lo]) / (span_ || 1)) * 100)}% through the range, so probe index ${pos}.`,
      { [lo]: "lo", [hi]: "hi" });
    if (values[pos] === target) {
      emit({ [pos]: "found" }, `Found ${target} at index ${pos}.`);
      return { frames: rec.frames, summary: interpolationSummary };
    }
    if (values[pos] < target) {
      emit({ ...span(0, pos, "discarded"), ...span(pos + 1, hi, "window") },
        `${values[pos]} < ${target}, so look to the right.`);
      lo = pos + 1;
    } else {
      emit({ ...span(lo, pos - 1, "window"), ...span(pos, values.length - 1, "discarded") },
        `${values[pos]} > ${target}, so look to the left.`);
      hi = pos - 1;
    }
  }
  emit(span(0, values.length - 1, "discarded"), `${target} is not in the array.`);
  return { frames: rec.frames, summary: interpolationSummary };
}

const interpolationSummary =
  "Interpolation search estimates the target's position by assuming the values are evenly spread — the way you open a phone book near the back for \"W\". On uniformly distributed data that is O(log log n), astonishingly fast. On skewed data it degrades to O(n), which is worse than binary search ever gets, so it is a gamble on the distribution rather than a strict improvement.";

export const SEARCHERS = {
  linear: { label: "Linear search", run: linearSearch, needsSorted: false },
  binary: { label: "Binary search", run: binarySearch, needsSorted: true },
  jump: { label: "Jump search", run: jumpSearch, needsSorted: true },
  exponential: { label: "Exponential search", run: exponentialSearch, needsSorted: true },
  interpolation: { label: "Interpolation search", run: interpolationSearch, needsSorted: true },
} as const;

export type SearcherName = keyof typeof SEARCHERS;
