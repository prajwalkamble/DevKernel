/**
 * The patterns the DSA track teaches, animated on an array.
 *
 * These are not algorithms with names so much as shapes — two pointers, a
 * window, a prefix scan. Seeing the pointers move is most of what makes them
 * click, and it is the part prose is worst at.
 */
import { Recorder, type ArrayFrame, type Role, type Visualisation } from "./types";

function arrayRecorder() {
  const rec = new Recorder<ArrayFrame>();
  const emit = (
    values: number[], roles: Record<number, Role>, note: string, markers?: Record<number, string>
  ) => rec.push({ kind: "array", values: [...values], roles, note, markers });
  return { rec, emit };
}

function span(from: number, to: number, role: Role): Record<number, Role> {
  const out: Record<number, Role> = {};
  for (let i = from; i <= to; i++) out[i] = role;
  return out;
}

/* --------------------------------------------------------- two pointers -- */

export function twoPointers(values = [2, 5, 8, 12, 16, 23, 38, 56], target = 39): Visualisation {
  const { rec, emit } = arrayRecorder();
  let lo = 0;
  let hi = values.length - 1;
  emit(values, { [lo]: "active", [hi]: "active" },
    `Looking for two values summing to ${target}. Start at both ends.`, { [lo]: "lo", [hi]: "hi" });

  while (lo < hi) {
    const sum = values[lo] + values[hi];
    rec.bump("comparisons");
    emit(values, { ...span(lo, hi, "window"), [lo]: "compare", [hi]: "compare" },
      `${values[lo]} + ${values[hi]} = ${sum}.`, { [lo]: "lo", [hi]: "hi" });
    if (sum === target) {
      emit(values, { [lo]: "found", [hi]: "found" },
        `That is the target. Indices ${lo} and ${hi}.`, { [lo]: "lo", [hi]: "hi" });
      break;
    }
    if (sum < target) {
      emit(values, { ...span(0, lo, "discarded"), [hi]: "compare" },
        `Too small. ${values[hi]} is already the largest available, so no pair using ${values[lo]} can reach ${target} — move lo right.`,
        { [lo]: "lo", [hi]: "hi" });
      lo++;
    } else {
      emit(values, { ...span(hi, values.length - 1, "discarded"), [lo]: "compare" },
        `Too big. ${values[lo]} is already the smallest available, so no pair using ${values[hi]} can reach ${target} — move hi left.`,
        { [lo]: "lo", [hi]: "hi" });
      hi--;
    }
  }
  return {
    frames: rec.frames,
    summary:
      "Two pointers converge from the ends of a sorted array. Each move discards a whole row of the pair grid, and the move is justified because the discarded pairs were all provably too small or too big. n−1 steps rather than n²/2 — and the argument, not the code, is what interviewers ask about.",
  };
}

/* -------------------------------------------------------- sliding window -- */

export function slidingWindow(values = [2, 3, 1, 2, 4, 3], target = 7): Visualisation {
  const { rec, emit } = arrayRecorder();
  let left = 0;
  let sum = 0;
  let best = Infinity;
  emit(values, {}, `Smallest window with a sum of at least ${target}. All values are positive, which is what makes this valid.`);

  for (let right = 0; right < values.length; right++) {
    sum += values[right];
    rec.bump("grows");
    emit(values, { ...span(left, right, "window"), [right]: "active" },
      `Grow right to include ${values[right]}. Window sum is ${sum}.`, { [left]: "L", [right]: "R" });

    while (sum >= target) {
      const width = right - left + 1;
      if (width < best) {
        best = width;
        emit(values, span(left, right, "found"),
          `Sum ${sum} ≥ ${target} with width ${width} — the best so far.`, { [left]: "L", [right]: "R" });
      }
      sum -= values[left];
      rec.bump("shrinks");
      emit(values, { ...span(left + 1, right, "window"), [left]: "discarded" },
        `Still valid, so try shrinking: drop ${values[left]}, leaving ${sum}.`, { [left + 1]: "L", [right]: "R" });
      left++;
    }
  }
  emit(values, {}, best === Infinity ? "No window reaches the target." : `Smallest valid window: ${best} elements.`);
  return {
    frames: rec.frames,
    summary:
      "Grow the right edge always; shrink the left while the window is still valid, recording each valid width on the way. `left` only ever moves forward, so despite the nested loop every index enters and leaves once — O(n). One negative value would break the shrink rule entirely.",
  };
}

/* ----------------------------------------------------------- prefix sums -- */

export function prefixSums(values = [3, 1, 4, 1, 5, 9]): Visualisation {
  const { rec, emit } = arrayRecorder();
  const prefix = [0];
  const emitPrefix = (roles: Record<number, Role>, note: string) =>
    rec.push({ kind: "array", values: [...prefix], roles, note,
      markers: Object.fromEntries(prefix.map((_, i) => [i, `p${i}`])) });

  emit(values, {}, `The input. Build a prefix array one longer, starting at 0.`);
  emitPrefix({ 0: "sorted" }, "prefix[0] = 0 — the sum of no elements. This is what removes the edge case.");
  for (let i = 0; i < values.length; i++) {
    prefix.push(prefix[i] + values[i]);
    rec.bump("additions");
    emitPrefix({ [i]: "compare", [i + 1]: "active" },
      `prefix[${i + 1}] = prefix[${i}] + ${values[i]} = ${prefix[i + 1]}.`);
  }
  emitPrefix(span(0, prefix.length - 1, "sorted"), "Built. Every range sum is now one subtraction.");
  for (const [lo, hi] of [[1, 4], [0, 6], [2, 3]] as [number, number][]) {
    emitPrefix({ [lo]: "compare", [hi]: "compare" },
      `sum of a[${lo}:${hi}] = prefix[${hi}] − prefix[${lo}] = ${prefix[hi]} − ${prefix[lo]} = ${prefix[hi] - prefix[lo]}.`);
  }
  return {
    frames: rec.frames,
    summary:
      "One linear pass buys every range-sum query for a single subtraction. The leading zero is not padding: with it, `sum(a[lo:hi]) = prefix[hi] − prefix[lo]` holds for every range including those starting at index 0, and no query needs a special case.",
  };
}

/* --------------------------------------------------------------- Kadane -- */

export function kadane(values = [-2, 1, -3, 4, -1, 2, 1, -5, 4]): Visualisation {
  const { rec, emit } = arrayRecorder();
  let current = values[0];
  let best = values[0];
  let bestStart = 0, bestEnd = 0, start = 0;

  emit(values, { 0: "active" }, `Start with the first element. Running total ${current}, best ${best}.`);
  for (let i = 1; i < values.length; i++) {
    rec.bump("comparisons");
    if (current < 0) {
      emit(values, { ...span(start, i - 1, "discarded"), [i]: "active" },
        `The run so far sums to ${current}, which is negative — carrying it forward can only hurt. Start again at ${values[i]}.`);
      current = values[i];
      start = i;
    } else {
      current += values[i];
      emit(values, { ...span(start, i, "window"), [i]: "active" },
        `Extend: the run now sums to ${current}.`);
    }
    if (current > best) {
      best = current;
      bestStart = start;
      bestEnd = i;
      emit(values, span(bestStart, bestEnd, "found"), `New best: ${best}.`);
    }
  }
  emit(values, span(bestStart, bestEnd, "found"),
    `Maximum subarray sum is ${best}, from index ${bestStart} to ${bestEnd}.`);
  return {
    frames: rec.frames,
    summary:
      "Kadane's algorithm keeps one number: the best sum ending at the current position. At each step the choice is to extend the previous run or start fresh — and starting fresh is right exactly when the previous run is negative, because a negative prefix can only reduce whatever follows. O(n), one pass, no extra memory.",
  };
}

/* ------------------------------------------------- Floyd's cycle detection -- */

export function floydCycle(): Visualisation {
  const rec = new Recorder<ArrayFrame>();
  // A list of 8 nodes whose tail loops back to index 3.
  const n = 8;
  const loopAt = 3;
  const next = (i: number) => (i === n - 1 ? loopAt : i + 1);
  const values = Array.from({ length: n }, (_, i) => i);
  const emit = (slow: number, fast: number, note: string, role: Role = "compare") =>
    rec.push({
      kind: "array", values, note,
      roles: { [slow]: role, [fast]: role === "found" ? "found" : "active" },
      markers: { [slow]: "slow", [fast]: "fast" },
    });

  let slow = 0;
  let fast = 0;
  emit(slow, fast, `A list whose last node points back to index ${loopAt}. Both pointers start at the head.`);
  for (;;) {
    slow = next(slow);
    fast = next(next(fast));
    rec.bump("steps");
    if (slow === fast) {
      emit(slow, fast, `They meet at index ${slow}. A meeting is only possible inside a cycle.`, "found");
      break;
    }
    emit(slow, fast, `slow moves one to ${slow}; fast moves two to ${fast}.`);
  }
  let head = 0;
  emit(head, slow, "Now restart one pointer at the head and move both one step at a time.");
  while (head !== slow) {
    head = next(head);
    slow = next(slow);
    rec.bump("steps");
    emit(head, slow, `Both step once: ${head} and ${slow}.`);
  }
  emit(head, slow, `They meet at index ${head} — the entrance to the cycle.`, "found");
  return {
    frames: rec.frames,
    summary:
      "Floyd's tortoise and hare: one pointer moves one step, the other two. In a cycle the fast one gains a place per step and must eventually lap the slow one, so a meeting proves a cycle and no meeting proves none. The second phase finds the cycle's *entrance*, which falls out of the arithmetic: the distance from the head to the entrance equals the distance from the meeting point to the entrance. O(n) time, O(1) space.",
  };
}

export const PATTERN_ALGOS = {
  twopointers: { label: "Two pointers", run: () => twoPointers() },
  window: { label: "Sliding window", run: () => slidingWindow() },
  prefix: { label: "Prefix sums", run: () => prefixSums() },
  kadane: { label: "Kadane's algorithm", run: () => kadane() },
  cycle: { label: "Floyd's cycle detection", run: () => floydCycle() },
} as const;

export type PatternAlgoName = keyof typeof PATTERN_ALGOS;
