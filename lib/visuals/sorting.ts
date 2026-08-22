/**
 * Sorting, animated by instrumenting real implementations.
 *
 * Each function below is the algorithm as you would write it, with `emit`
 * calls at the points a learner needs to see: every comparison, every swap,
 * every element placed. Removing the emits would leave a correct sort — which
 * is the property that keeps the animation honest.
 */
import { Recorder, type ArrayFrame, type Role, type Visualisation } from "./types";

type Emit = (values: number[], roles: Record<number, Role>, note: string,
             markers?: Record<number, string>) => void;

function recorder() {
  const rec = new Recorder<ArrayFrame>();
  const emit: Emit = (values, roles, note, markers) => {
    rec.push({ kind: "array", values: [...values], roles, note, markers });
  };
  return { rec, emit };
}

/** Marks a run of indices with one role. */
function span(from: number, to: number, role: Role): Record<number, Role> {
  const out: Record<number, Role> = {};
  for (let i = from; i <= to; i++) out[i] = role;
  return out;
}

export function bubbleSort(input: number[]): Visualisation {
  const a = [...input];
  const { rec, emit } = recorder();
  emit(a, {}, "Starting. Bubble sort walks the array repeatedly, swapping any pair that is out of order.");

  for (let pass = 0; pass < a.length - 1; pass++) {
    let swapped = false;
    for (let i = 0; i < a.length - 1 - pass; i++) {
      rec.bump("comparisons");
      emit(a, { ...span(a.length - pass, a.length - 1, "sorted"), [i]: "compare", [i + 1]: "compare" },
        `Compare ${a[i]} and ${a[i + 1]}.`);
      if (a[i] > a[i + 1]) {
        // Describe the comparison with the values as they were *before* the
        // swap — after it they have moved, and a message quoting the new
        // positions reads as though the wrong test was made.
        const [left, right] = [a[i], a[i + 1]];
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        swapped = true;
        rec.bump("swaps");
        emit(a, { ...span(a.length - pass, a.length - 1, "sorted"), [i]: "swap", [i + 1]: "swap" },
          `${left} is greater than ${right}, so swap them.`);
      }
    }
    emit(a, span(a.length - 1 - pass, a.length - 1, "sorted"),
      `End of pass ${pass + 1}. The largest unsorted value has bubbled to position ${a.length - 1 - pass}.`);
    // The early exit is what makes bubble sort O(n) on already-sorted input.
    if (!swapped) {
      emit(a, span(0, a.length - 1, "sorted"),
        "No swaps in that pass, so the array is already sorted — stop early.");
      break;
    }
  }
  emit(a, span(0, a.length - 1, "sorted"), "Sorted.");
  return {
    frames: rec.frames,
    summary:
      "Bubble sort compares neighbours and swaps them, so after each pass the largest remaining value has travelled to the end. O(n²) comparisons, and O(n) on already-sorted input thanks to the early exit. It is here to be understood, not used.",
  };
}

export function selectionSort(input: number[]): Visualisation {
  const a = [...input];
  const { rec, emit } = recorder();
  emit(a, {}, "Starting. Selection sort finds the smallest remaining value and puts it in place.");

  for (let i = 0; i < a.length - 1; i++) {
    let min = i;
    emit(a, { ...span(0, i - 1, "sorted"), [i]: "active" },
      `Looking for the smallest value from position ${i} onwards.`);
    for (let j = i + 1; j < a.length; j++) {
      rec.bump("comparisons");
      emit(a, { ...span(0, i - 1, "sorted"), [min]: "pivot", [j]: "compare" },
        `Is ${a[j]} smaller than the best so far, ${a[min]}?`);
      if (a[j] < a[min]) {
        min = j;
        emit(a, { ...span(0, i - 1, "sorted"), [min]: "pivot" },
          `Yes — ${a[min]} is the new smallest.`);
      }
    }
    if (min !== i) {
      [a[i], a[min]] = [a[min], a[i]];
      rec.bump("swaps");
    }
    emit(a, span(0, i, "sorted"), `Place ${a[i]} at position ${i}.`);
  }
  emit(a, span(0, a.length - 1, "sorted"), "Sorted.");
  return {
    frames: rec.frames,
    summary:
      "Selection sort scans for the minimum and swaps it into place, so it performs exactly n−1 swaps — the fewest of any comparison sort. The comparisons stay O(n²) regardless of the input, so unlike bubble sort it gains nothing from data that is already ordered.",
  };
}

export function insertionSort(input: number[]): Visualisation {
  const a = [...input];
  const { rec, emit } = recorder();
  emit(a, { 0: "sorted" }, "Starting. The first element counts as a sorted run of one.");

  // Written with swaps rather than the textbook shift-and-place. The two do
  // the same work, but a shift holds the key aside in a variable and leaves
  // the array holding a duplicate until the final write — a state that never
  // really exists and would be shown as one. Swapping means every frame is a
  // genuine arrangement of the input, and the element visibly walks left.
  for (let i = 1; i < a.length; i++) {
    emit(a, { ...span(0, i - 1, "sorted"), [i]: "active" },
      `Take ${a[i]} and walk it left until it sits in order.`);
    let j = i;
    while (j > 0) {
      rec.bump("comparisons");
      emit(a, { ...span(0, i, "sorted"), [j - 1]: "compare", [j]: "compare" },
        `Is ${a[j - 1]} greater than ${a[j]}?`);
      if (a[j - 1] <= a[j]) break;
      const [left, right] = [a[j - 1], a[j]];
      [a[j - 1], a[j]] = [a[j], a[j - 1]];
      rec.bump("swaps");
      emit(a, { ...span(0, i, "sorted"), [j - 1]: "swap", [j]: "swap" },
        `Yes — ${left} is greater than ${right}, so swap them and keep walking.`);
      j--;
    }
    emit(a, span(0, i, "sorted"), `${a[j]} is in place; the first ${i + 1} are sorted.`);
  }
  emit(a, span(0, a.length - 1, "sorted"), "Sorted.");
  return {
    frames: rec.frames,
    summary:
      "Insertion sort grows a sorted prefix, sliding each new element back to its place. It is O(n²) in general but O(n) on nearly-sorted input, which is why real library sorts fall back to it for small or almost-ordered runs.",
  };
}

export function mergeSort(input: number[]): Visualisation {
  const a = [...input];
  const { rec, emit } = recorder();
  emit(a, {}, "Starting. Merge sort splits until the pieces are trivial, then merges them in order.");

  const buffer = [...a];

  function sort(lo: number, hi: number) {
    if (hi - lo <= 1) return;
    const mid = lo + Math.floor((hi - lo) / 2);
    emit(a, { ...span(lo, mid - 1, "window"), ...span(mid, hi - 1, "active") },
      `Split [${lo}, ${hi}) into [${lo}, ${mid}) and [${mid}, ${hi}).`);
    sort(lo, mid);
    sort(mid, hi);

    let i = lo, j = mid, k = lo;
    while (i < mid && j < hi) {
      rec.bump("comparisons");
      emit(a, { ...span(lo, hi - 1, "window"), [i]: "compare", [j]: "compare" },
        `Merging: compare ${a[i]} and ${a[j]}.`);
      // `<=` rather than `<` is what makes merge sort stable.
      buffer[k++] = a[i] <= a[j] ? a[i++] : a[j++];
    }
    while (i < mid) buffer[k++] = a[i++];
    while (j < hi) buffer[k++] = a[j++];
    for (let t = lo; t < hi; t++) {
      a[t] = buffer[t];
      rec.bump("writes");
    }
    emit(a, span(lo, hi - 1, "sorted"), `[${lo}, ${hi}) is now merged and in order.`);
  }

  sort(0, a.length);
  emit(a, span(0, a.length - 1, "sorted"), "Sorted.");
  return {
    frames: rec.frames,
    summary:
      "Merge sort splits trivially and does all its work in the combine. Guaranteed O(n log n) whatever the input, and stable — the `<=` in the merge is what preserves the order of equal elements. The cost is O(n) extra space for the buffer.",
  };
}

export function quickSort(input: number[]): Visualisation {
  const a = [...input];
  const { rec, emit } = recorder();
  emit(a, {}, "Starting. Quicksort does its work in the split: partition around a pivot, then recurse.");

  function partition(lo: number, hi: number): number {
    const pivot = a[hi];
    emit(a, { ...span(lo, hi, "window"), [hi]: "pivot" },
      `Partitioning [${lo}, ${hi}] around the pivot ${pivot}.`);
    let i = lo;
    for (let j = lo; j < hi; j++) {
      rec.bump("comparisons");
      emit(a, { ...span(lo, hi, "window"), [hi]: "pivot", [j]: "compare", [i]: "active" },
        `Is ${a[j]} less than the pivot ${pivot}?`);
      if (a[j] < pivot) {
        if (i !== j) {
          [a[i], a[j]] = [a[j], a[i]];
          rec.bump("swaps");
          emit(a, { ...span(lo, hi, "window"), [hi]: "pivot", [i]: "swap", [j]: "swap" },
            `Yes — move it into the less-than region.`);
        }
        i++;
      }
    }
    [a[i], a[hi]] = [a[hi], a[i]];
    rec.bump("swaps");
    emit(a, { ...span(lo, hi, "window"), [i]: "sorted" },
      `The pivot ${a[i]} lands at position ${i}, and is now in its final place.`);
    return i;
  }

  function sort(lo: number, hi: number) {
    if (lo >= hi) {
      if (lo === hi) emit(a, { [lo]: "sorted" }, `A single element at ${lo} is trivially sorted.`);
      return;
    }
    const p = partition(lo, hi);
    sort(lo, p - 1);
    sort(p + 1, hi);
  }

  sort(0, a.length - 1);
  emit(a, span(0, a.length - 1, "sorted"), "Sorted.");
  return {
    frames: rec.frames,
    summary:
      "Quicksort partitions around a pivot so that the pivot lands in its final position, then recurses on both sides. No combine step and no extra array. O(n log n) on average, but O(n²) when the pivot choice is consistently bad — which is why real implementations choose the pivot with more care than the last element.",
  };
}

export function heapSort(input: number[]): Visualisation {
  const a = [...input];
  const { rec, emit } = recorder();
  emit(a, {}, "Starting. Heap sort builds a max-heap in place, then repeatedly moves the root to the end.");

  const n = a.length;

  function sift(root: number, end: number) {
    let largest = root;
    const l = 2 * root + 1;
    const r = 2 * root + 2;
    if (l < end) {
      rec.bump("comparisons");
      if (a[l] > a[largest]) largest = l;
    }
    if (r < end) {
      rec.bump("comparisons");
      if (a[r] > a[largest]) largest = r;
    }
    if (largest !== root) {
      emit(a, { [root]: "compare", [largest]: "swap", ...span(end, n - 1, "sorted") },
        `${a[largest]} is bigger than its parent ${a[root]} — swap and continue down.`);
      [a[root], a[largest]] = [a[largest], a[root]];
      rec.bump("swaps");
      sift(largest, end);
    }
  }

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    emit(a, { [i]: "active" }, `Sift down from index ${i} to build the heap.`);
    sift(i, n);
  }
  emit(a, { 0: "pivot" }, "The array is now a max-heap: every parent is at least as large as its children.");

  for (let end = n - 1; end > 0; end--) {
    [a[0], a[end]] = [a[end], a[0]];
    rec.bump("swaps");
    emit(a, { [end]: "sorted", ...span(end, n - 1, "sorted") },
      `Move the largest value ${a[end]} to position ${end}, then restore the heap.`);
    sift(0, end);
  }
  emit(a, span(0, n - 1, "sorted"), "Sorted.");
  return {
    frames: rec.frames,
    summary:
      "Heap sort turns the array into a max-heap in place, then swaps the root to the end and shrinks the heap. Guaranteed O(n log n) with O(1) extra space — the only common sort with both — but it is not stable and its scattered memory access makes it slower in practice than quicksort.",
  };
}




/* ------------------------------------------------------ non-comparison sorts */

export function countingSort(input: number[]): Visualisation {
  const a = [...input];
  const { rec, emit } = recorder();
  const max = Math.max(0, ...a);
  const counts = new Array(max + 1).fill(0);

  // Unlike every comparison sort here, counting sort does not permute the
  // input — it *rebuilds* an array from the tallies. Showing the write-back
  // happening on top of the input would display arrangements that never exist,
  // so the output is shown as its own array filling from empty.
  emit(a, {}, "Counting sort does not compare elements at all — it counts how many of each value there are.");
  for (let i = 0; i < a.length; i++) {
    counts[a[i]]++;
    rec.bump("counts");
    emit(a, { [i]: "compare" }, `Tally ${a[i]}. It has now been seen ${counts[a[i]]} time(s).`);
  }

  const out = new Array(a.length).fill(0);
  emit(out, {}, "Now rebuild the array from the tallies, smallest value first. This is a new array, not the old one rearranged.");
  let write = 0;
  for (let value = 0; value <= max; value++) {
    while (counts[value] > 0) {
      out[write] = value;
      counts[value]--;
      rec.bump("writes");
      emit(out, { ...span(0, write, "sorted"), [write]: "swap" },
        `${value} appeared, so write it at position ${write}.`);
      write++;
    }
  }
  emit(out, span(0, out.length - 1, "sorted"), "Sorted, with no comparison ever made.");
  return {
    frames: rec.frames,
    summary:
      "Counting sort tallies occurrences and then writes values back in order, so it never compares two elements — which is how it beats the O(n log n) lower bound that binds every comparison sort. The cost is O(n + k) where k is the value range, so it is excellent for small ranges and useless for large ones: sorting eight numbers up to a billion would allocate a billion counters.",
  };
}

export function radixSort(input: number[]): Visualisation {
  const a = [...input];
  const { rec, emit } = recorder();
  const max = Math.max(0, ...a);
  let exp = 1;
  emit(a, {}, "Radix sort sorts by one digit at a time, least significant first, using a stable sort at each pass.");

  while (Math.floor(max / exp) > 0) {
    const buckets: number[][] = Array.from({ length: 10 }, () => []);
    for (let i = 0; i < a.length; i++) {
      const digit = Math.floor(a[i] / exp) % 10;
      buckets[digit].push(a[i]);
      rec.bump("placements");
      emit(a, { [i]: "compare" },
        `Digit at the ${exp}s place of ${a[i]} is ${digit} — into bucket ${digit}.`);
    }
    let write = 0;
    for (let d = 0; d < 10; d++) {
      for (const value of buckets[d]) {
        a[write] = value;
        rec.bump("writes");
        write++;
      }
    }
    emit(a, span(0, a.length - 1, "window"),
      `Collected the buckets in order. The array is now sorted by the last ${String(exp).length} digit(s).`);
    exp *= 10;
  }
  emit(a, span(0, a.length - 1, "sorted"), "Sorted.");
  return {
    frames: rec.frames,
    summary:
      "Radix sort makes one pass per digit, distributing into ten buckets and collecting them in order. It works only because each pass is *stable* — an earlier pass's ordering survives the next one, so sorting by the last digit first ends with the whole number sorted. O(d · (n + 10)) for d digits.",
  };
}

export function shellSort(input: number[]): Visualisation {
  const a = [...input];
  const { rec, emit } = recorder();
  emit(a, {}, "Shell sort is insertion sort that first fixes elements far apart, so nothing has to travel far later.");

  let gap = Math.floor(a.length / 2);
  while (gap > 0) {
    emit(a, {}, `Gap ${gap}: compare and sort elements ${gap} apart.`);
    for (let i = gap; i < a.length; i++) {
      let j = i;
      while (j >= gap) {
        rec.bump("comparisons");
        emit(a, { [j - gap]: "compare", [j]: "compare" },
          `Compare positions ${j - gap} and ${j}: ${a[j - gap]} and ${a[j]}.`);
        if (a[j - gap] <= a[j]) break;
        const [left, right] = [a[j - gap], a[j]];
        [a[j - gap], a[j]] = [a[j], a[j - gap]];
        rec.bump("swaps");
        emit(a, { [j - gap]: "swap", [j]: "swap" }, `${left} > ${right} — swap across the gap.`);
        j -= gap;
      }
    }
    gap = Math.floor(gap / 2);
  }
  emit(a, span(0, a.length - 1, "sorted"), "Gap 1 is ordinary insertion sort, on an array that is already nearly ordered.");
  return {
    frames: rec.frames,
    summary:
      "Shell sort runs insertion sort at decreasing gaps. Large gaps move elements a long way in one swap, so by the time the gap reaches 1 the array is nearly sorted and insertion sort's best case applies. It is the classic demonstration that insertion sort's weakness — elements travelling one place at a time — can be engineered away.",
  };
}

export function cocktailSort(input: number[]): Visualisation {
  const a = [...input];
  const { rec, emit } = recorder();
  let lo = 0;
  let hi = a.length - 1;
  emit(a, {}, "Cocktail sort is bubble sort that alternates direction, so small values at the end travel quickly too.");

  let swapped = true;
  while (swapped && lo < hi) {
    swapped = false;
    for (let i = lo; i < hi; i++) {
      rec.bump("comparisons");
      emit(a, { ...span(0, lo - 1, "sorted"), ...span(hi + 1, a.length - 1, "sorted"), [i]: "compare", [i + 1]: "compare" },
        `Forward: compare ${a[i]} and ${a[i + 1]}.`);
      if (a[i] > a[i + 1]) {
        const [l, r] = [a[i], a[i + 1]];
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        rec.bump("swaps");
        swapped = true;
        emit(a, { [i]: "swap", [i + 1]: "swap" }, `${l} > ${r}, so swap.`);
      }
    }
    hi--;
    if (!swapped) break;
    swapped = false;
    for (let i = hi; i > lo; i--) {
      rec.bump("comparisons");
      emit(a, { ...span(0, lo - 1, "sorted"), ...span(hi + 1, a.length - 1, "sorted"), [i - 1]: "compare", [i]: "compare" },
        `Backward: compare ${a[i - 1]} and ${a[i]}.`);
      if (a[i - 1] > a[i]) {
        const [l, r] = [a[i - 1], a[i]];
        [a[i - 1], a[i]] = [a[i], a[i - 1]];
        rec.bump("swaps");
        swapped = true;
        emit(a, { [i - 1]: "swap", [i]: "swap" }, `${l} > ${r}, so swap.`);
      }
    }
    lo++;
  }
  emit(a, span(0, a.length - 1, "sorted"), "Sorted.");
  return {
    frames: rec.frames,
    summary:
      "Cocktail shaker sort bubbles forwards and then backwards. It fixes bubble sort's one embarrassment — a small value at the far end, a \"turtle\", which plain bubble sort moves only one place per full pass — but it is still O(n²) and still not something to use.",
  };
}
export const SORTERS = {
  bubble: { label: "Bubble sort", run: bubbleSort },
  cocktail: { label: "Cocktail shaker sort", run: cocktailSort },
  selection: { label: "Selection sort", run: selectionSort },
  insertion: { label: "Insertion sort", run: insertionSort },
  shell: { label: "Shell sort", run: shellSort },
  merge: { label: "Merge sort", run: mergeSort },
  quick: { label: "Quicksort", run: quickSort },
  heap: { label: "Heap sort", run: heapSort },
  counting: { label: "Counting sort", run: countingSort },
  radix: { label: "Radix sort", run: radixSort },
} as const;

export type SorterName = keyof typeof SORTERS;
