/**
 * The patterns the DSA track teaches, animated on an array.
 *
 * These are not algorithms with names so much as shapes — two pointers, a
 * window, a prefix scan. Seeing the pointers move is most of what makes them
 * click, and it is the part prose is worst at.
 */
import {
  Recorder, cellKey, type ArrayFrame, type MatrixFrame, type Role, type Visualisation,
} from "./types";

function arrayRecorder() {
  const rec = new Recorder<ArrayFrame>();
  const emit = (
    values: number[], roles: Record<number, Role>, note: string, markers?: Record<number, string>
  ) => rec.push({ kind: "array", values: [...values], roles, note, markers });
  return { rec, emit };
}

function matrixRecorder() {
  const rec = new Recorder<MatrixFrame>();
  const emit = (cells: string[][], roles: Record<string, Role>, note: string) =>
    rec.push({ kind: "matrix", cells: cells.map((row) => [...row]), roles, note });
  return { rec, emit };
}

function span(from: number, to: number, role: Role): Record<number, Role> {
  const out: Record<number, Role> = {};
  for (let i = from; i <= to; i++) out[i] = role;
  return out;
}

/**
 * Pointer labels, merged when two pointers sit on the same cell.
 *
 * `markers` is keyed by index, so writing `{ [write]: "w", [read]: "r" }` loses
 * one of them the moment they coincide — which for a compaction loop is the
 * whole first half of the animation.
 */
function pointers(...pairs: [number, string][]): Record<number, string> {
  const out: Record<number, string> = {};
  for (const [i, label] of pairs) out[i] = out[i] ? `${out[i]}/${label}` : label;
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

/* ------------------------------------------------- read and write pointers -- */

export function readWrite(values = [2, 3, 2, 3, 1, 3, 5, 4], drop = 3): Visualisation {
  const { rec, emit } = arrayRecorder();
  const a = [...values];
  let write = 0;
  emit(a, {}, `Remove every ${drop} in place. One pointer reads, one writes, and the writer never overtakes the reader.`,
    pointers([0, "w"], [0, "r"]));

  for (let read = 0; read < a.length; read++) {
    rec.bump("reads");
    if (a[read] === drop) {
      emit(a, { ...span(0, write - 1, "sorted"), [read]: "discarded" },
        `a[${read}] is ${drop} — skip it. The writer stays at ${write}.`, pointers([write, "w"], [read, "r"]));
    } else {
      const moved = a[read];
      a[write] = a[read];
      rec.bump("writes");
      emit(a, { ...span(0, write, "sorted"), [read]: "compare", [write]: "swap" },
        write === read
          ? `a[${read}] is ${moved} — a keeper. Writer and reader agree, so this write copies the cell onto itself.`
          : `a[${read}] is ${moved} — a keeper. Copy it down to index ${write}.`,
        pointers([write, "w"], [read, "r"]));
      write++;
    }
  }
  emit(a, { ...span(0, write - 1, "found"), ...span(write, a.length - 1, "discarded") },
    `Done. The first ${write} cells are the survivors; everything past them is whatever the copies left behind.`,
    pointers([write, "w"]));

  return {
    frames: rec.frames,
    summary:
      "Two indices over one array: `read` visits every cell exactly once, `write` advances only on a keeper. Because `write` can never pass `read`, a cell is only ever overwritten after it has been read, which is what makes this safe to do in place. The tail past `write` is not cleared — the length is the answer, and the cells beyond it are stale by design.",
  };
}

/* ------------------------------------------------- rotation by reversal -- */

export function reversalRotation(values = [1, 2, 3, 4, 5, 6, 7], k = 3): Visualisation {
  const { rec, emit } = arrayRecorder();
  const a = [...values];
  const n = a.length;
  const shift = ((k % n) + n) % n;

  const reverse = (lo: number, hi: number, what: string) => {
    emit(a, span(lo, hi, "window"), `${what}: reverse a[${lo}..${hi}].`, pointers([lo, "lo"], [hi, "hi"]));
    while (lo < hi) {
      [a[lo], a[hi]] = [a[hi], a[lo]];
      rec.bump("swaps");
      emit(a, { ...span(lo, hi, "window"), [lo]: "swap", [hi]: "swap" },
        `Swap a[${lo}] and a[${hi}].`, pointers([lo, "lo"], [hi, "hi"]));
      lo++;
      hi--;
    }
  };

  emit(a, {}, `Rotate right by ${shift}. Three reversals do it with no second array and no arithmetic on indices.`);
  reverse(0, n - 1, "First, the whole array");
  emit(a, span(0, shift - 1, "active"),
    `Everything is now in reverse order, so the last ${shift} values sit at the front — in the wrong order among themselves.`);
  reverse(0, shift - 1, "So reverse just that prefix");
  reverse(shift, n - 1, "And then the rest");
  emit(a, span(0, n - 1, "found"),
    `Rotated. ${values.join(", ")} became ${a.join(", ")}.`);

  return {
    frames: rec.frames,
    summary:
      "Reversing the whole array puts both blocks in the right place relative to each other and both internally backwards; reversing each block separately undoes exactly that. Three passes, O(n) time and O(1) space — where the obvious version copies into a second array, and the rotate-one-step-k-times version is O(n·k).",
  };
}

/* ------------------------------------------------- Dutch national flag -- */

export function dutchFlag(values = [2, 0, 2, 1, 1, 0, 2, 1]): Visualisation {
  const { rec, emit } = arrayRecorder();
  const a = [...values];
  let low = 0;
  let mid = 0;
  let high = a.length - 1;

  const marks = () => pointers([low, "lo"], [mid, "mid"], [high, "hi"]);
  const regions = (): Record<number, Role> => ({
    ...span(0, low - 1, "sorted"),
    ...span(low, mid - 1, "window"),
    ...span(high + 1, a.length - 1, "sorted"),
  });
  /* Three of the four regions are empty at the start and one is empty at the
     end, and a range printed as `0..-1` reads as a bug rather than as nothing. */
  const range = (name: string, from: number, to: number) =>
    `${name}: ${from > to ? "none" : `${from}..${to}`}`;
  const where = () => [
    range("0s", 0, low - 1),
    range("1s", low, mid - 1),
    range("unexamined", mid, high),
    range("2s", high + 1, a.length - 1),
  ].join(", ");

  emit(a, regions(), "Sort 0s, 1s and 2s in one pass. Three regions grow at once: 0s behind `low`, 1s between `low` and `mid`, 2s past `high`.", marks());

  while (mid <= high) {
    rec.bump("looks");
    if (a[mid] === 0) {
      emit(a, { ...regions(), [mid]: "compare", [low]: "swap" },
        `a[${mid}] is 0 — swap it back to ${low} and advance both.`, marks());
      [a[low], a[mid]] = [a[mid], a[low]];
      rec.bump("swaps");
      low++;
      mid++;
    } else if (a[mid] === 1) {
      emit(a, { ...regions(), [mid]: "compare" },
        `a[${mid}] is 1 — already where it belongs. Just advance \`mid\`.`, marks());
      mid++;
    } else {
      emit(a, { ...regions(), [mid]: "compare", [high]: "swap" },
        `a[${mid}] is 2 — swap it out to ${high}. \`mid\` stays: what came back has not been looked at yet.`, marks());
      [a[mid], a[high]] = [a[high], a[mid]];
      rec.bump("swaps");
      high--;
    }
    emit(a, regions(), `Regions now — ${where()}.`, marks());
  }
  emit(a, span(0, a.length - 1, "found"), "Done in one pass, with every element looked at once or twice.");

  return {
    frames: rec.frames,
    summary:
      "Three pointers carve the array into four regions — settled 0s, settled 1s, unexamined, settled 2s — and the loop ends when the unexamined region is empty. The asymmetry is the part worth remembering: swapping with `low` returns a value already known to be a 1, so `mid` may advance, while swapping with `high` returns something never examined, so `mid` must stay and look at it.",
  };
}

/* ------------------------------------------------------------ cyclic sort -- */

export function cyclicSort(values = [3, 1, 5, 4, 2]): Visualisation {
  const { rec, emit } = arrayRecorder();
  const a = [...values];
  let i = 0;
  emit(a, {}, "Values are 1..n, so value v belongs at index v−1. Send each one home rather than sorting.", pointers([0, "i"]));

  while (i < a.length) {
    const target = a[i] - 1;
    rec.bump("looks");
    if (a[i] !== a[target]) {
      emit(a, { ...span(0, i - 1, "sorted"), [i]: "compare", [target]: "active" },
        `a[${i}] is ${a[i]}, which belongs at index ${target}. Swap it there.`, pointers([i, "i"]));
      [a[i], a[target]] = [a[target], a[i]];
      rec.bump("swaps");
      emit(a, { ...span(0, i - 1, "sorted"), [target]: "found", [i]: "swap" },
        `${a[target]} is home. a[${i}] now holds ${a[i]} — \`i\` has not moved, because this value is new to us.`,
        pointers([i, "i"]));
    } else {
      emit(a, { ...span(0, i, "sorted"), [i]: "found" },
        `a[${i}] is ${a[i]}, already at index ${i}. Nothing to do — advance.`, pointers([i, "i"]));
      i++;
    }
  }
  emit(a, span(0, a.length - 1, "found"), "Sorted, in at most n swaps.", pointers([a.length - 1, "i"]));

  return {
    frames: rec.frames,
    summary:
      "The loop is a `while`, not a `for`, and `i` advances only when the cell is already correct — so it looks quadratic and is not. Every swap puts one value in its final position permanently, and there are only n positions, so there are at most n swaps: O(n) total. It works only because the values name their own indices.",
  };
}

/* -------------------------------------------------------- spiral order -- */

export function spiralOrder(n = 4): Visualisation {
  const { rec, emit } = matrixRecorder();
  const cells: string[][] = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => String(r * n + c + 1)));
  const visited: Record<string, Role> = {};
  const out: number[] = [];

  let top = 0;
  let bottom = n - 1;
  let left = 0;
  let right = n - 1;

  const take = (r: number, c: number, why: string) => {
    out.push(Number(cells[r][c]));
    emit(cells, { ...visited, [cellKey(r, c)]: "active" }, `${why} Collected: ${out.join(", ")}.`);
    visited[cellKey(r, c)] = "sorted";
  };

  emit(cells, {}, `Walk the ${n}×${n} grid in a spiral. Four boundaries — top, bottom, left, right — close in as each edge is used up.`);

  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) take(top, c, `Along the top row, left to right.`);
    top++;
    emit(cells, visited, `Top row is spent, so the top boundary drops to ${top}.`);

    for (let r = top; r <= bottom; r++) take(r, right, `Down the right column.`);
    right--;
    emit(cells, visited, `Right column is spent, so the right boundary moves in to ${right}.`);

    /* Both guards are load-bearing. Without the first, a grid whose rows run out
       walks the bottom row a second time; without the second, the same happens
       to the left column. An odd-sized grid ends on exactly that case. */
    if (top <= bottom) {
      for (let c = right; c >= left; c--) take(bottom, c, `Back along the bottom row, right to left.`);
      bottom--;
      emit(cells, visited, `Bottom row is spent, so the bottom boundary rises to ${bottom}.`);
    }

    if (left <= right) {
      for (let r = bottom; r >= top; r--) take(r, left, `Up the left column.`);
      left++;
      emit(cells, visited, `Left column is spent, so the left boundary moves in to ${left}.`);
    }
  }

  emit(cells, visited, `All ${out.length} cells, each exactly once: ${out.join(", ")}.`);
  return {
    frames: rec.frames,
    summary:
      "Four boundaries rather than a direction vector: each of the four passes consumes one edge and then retires it. The two `if`s before the bottom and left passes are not defensive padding — once the boundaries have crossed, a grid with an odd number of rows or columns would otherwise walk its middle row or column twice.",
  };
}

/* ---------------------------------------------------- rotate in place -- */

export function rotateMatrix(n = 4): Visualisation {
  const { rec, emit } = matrixRecorder();
  const cells: string[][] = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => String(r * n + c + 1)));

  emit(cells, {}, `Rotate the grid 90° clockwise without a second grid. Two passes do it: transpose, then reverse each row.`);

  for (let r = 0; r < n; r++) {
    for (let c = r + 1; c < n; c++) {
      emit(cells, { [cellKey(r, c)]: "compare", [cellKey(c, r)]: "compare" },
        `Transpose: exchange (${r},${c}) with (${c},${r}).`);
      [cells[r][c], cells[c][r]] = [cells[c][r], cells[r][c]];
      rec.bump("swaps");
      emit(cells, { [cellKey(r, c)]: "swap", [cellKey(c, r)]: "swap" },
        `Now ${cells[r][c]} and ${cells[c][r]} have traded places.`);
    }
  }
  emit(cells, {}, `Transposed — the grid is mirrored along its main diagonal. Every row is now the column it needs to be, but backwards.`);

  for (let r = 0; r < n; r++) {
    let lo = 0;
    let hi = n - 1;
    while (lo < hi) {
      emit(cells, { [cellKey(r, lo)]: "compare", [cellKey(r, hi)]: "compare" },
        `Reverse row ${r}: exchange columns ${lo} and ${hi}.`);
      [cells[r][lo], cells[r][hi]] = [cells[r][hi], cells[r][lo]];
      rec.bump("swaps");
      emit(cells, { [cellKey(r, lo)]: "swap", [cellKey(r, hi)]: "swap" }, `Row ${r} is now ${cells[r].join(", ")}.`);
      lo++;
      hi--;
    }
  }
  emit(cells, {}, `Rotated 90° clockwise. The old bottom row is now the left column, top to bottom.`);

  return {
    frames: rec.frames,
    summary:
      "Transposing reflects the grid along its main diagonal; reversing each row reflects it left-to-right. Two reflections about lines that meet at 45° compose into a rotation of 90°, which is why this works at all. The transpose loop starts at `c = r + 1` on purpose: running the full square would swap every pair twice and leave the grid exactly as it found it.",
  };
}

export const PATTERN_ALGOS = {
  twopointers: { label: "Two pointers", run: () => twoPointers() },
  window: { label: "Sliding window", run: () => slidingWindow() },
  prefix: { label: "Prefix sums", run: () => prefixSums() },
  kadane: { label: "Kadane's algorithm", run: () => kadane() },
  cycle: { label: "Floyd's cycle detection", run: () => floydCycle() },
  readwrite: { label: "Read and write pointers", run: () => readWrite() },
  rotation: { label: "Rotation by reversal", run: () => reversalRotation() },
  dutchflag: { label: "Dutch national flag", run: () => dutchFlag() },
  cyclicsort: { label: "Cyclic sort", run: () => cyclicSort() },
  spiral: { label: "Spiral order", run: () => spiralOrder() },
  rotatematrix: { label: "Rotate a grid in place", run: () => rotateMatrix() },
} as const;

export type PatternAlgoName = keyof typeof PATTERN_ALGOS;
