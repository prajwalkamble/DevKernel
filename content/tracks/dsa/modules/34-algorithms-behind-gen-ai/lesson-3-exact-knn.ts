import type { Lesson } from "@/content/types";

export const exactKnnLesson: Lesson = {
  id: "dsa-gen-ai-exact-knn",
  slug: "exact-knn",
  moduleSlug: "algorithms-behind-gen-ai",
  title: "Exact k-Nearest Neighbours, and Where It Stops",
  summary:
    "A bounded heap turns selection into roughly one comparison per candidate — measured at 1.04 for n = 8,000. It does nothing at all about the column that matters, which stays at exactly n.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Implement top-k with a bounded max-heap rather than a sort",
    "Measure comparisons per candidate for three approaches to the same problem",
    "Identify which cost the heap removes and which it leaves untouched",
    "State the size at which exact search stops being an option",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "The problem, stated plainly",
      body: [
        "You have `n` stored vectors and a query vector. Return the `k` nearest, by whichever metric the previous lesson settled on. This is exact k-nearest-neighbour search and it is the foundation under every retrieval system, whether or not the system ends up doing it exactly.",
        "The obvious implementation measures every document, sorts, and takes the first `k`. It is correct and it is what most people write first. The standard improvement is a heap, and the standard framing of that improvement \u2014 `O(n log n)` becomes `O(n log k)` \u2014 is true and slightly misses what is actually happening.",
        "So the program below counts operations instead of asserting complexities, for three versions: sort everything, build a heap of everything and pop `k` times, and keep a bounded max-heap of only the best `k` seen so far.",
      ],
    },
    {
      id: "the-measurement",
      heading: "Three versions, counted",
      body: [
        "All three return the same neighbours, which the program checks at every size \u2014 nothing below would mean anything otherwise.",
      ],
      examples: [
        {
          id: "three-ways-to-take-the-top-k",
          title: "The same top-k, three implementations, with the work counted",
          lang: "python",
          code: `# Exact k-nearest-neighbour search, three ways, with the work counted.
# The three agree on the answer. What differs is what they spend, and the
# interesting part is the column that does not move at all.

DIM = 8
K = 10

work = [0, 0, 0, 0]  # distances, sort comparisons, full-heap, bounded-heap
rejected = [0]


def sq_dist(a, b, slot):
    total = 0
    for i in range(len(a)):
        d = a[i] - b[i]
        total += d * d
    work[slot] += 1
    return total


# --- version one: measure everything, sort, take the first k -------------

def merge_sort(items):
    if len(items) <= 1:
        return items
    mid = len(items) // 2
    left = merge_sort(items[:mid])
    right = merge_sort(items[mid:])
    out = []
    i = 0
    j = 0
    while i < len(left) and j < len(right):
        work[1] += 1
        if left[i][0] <= right[j][0]:
            out.append(left[i])
            i += 1
        else:
            out.append(right[j])
            j += 1
    while i < len(left):
        out.append(left[i])
        i += 1
    while j < len(right):
        out.append(right[j])
        j += 1
    return out


def by_sorting(query, docs):
    scored = []
    for i in range(len(docs)):
        scored.append([sq_dist(query, docs[i], 0), i])
    return [pair[1] for pair in merge_sort(scored)[:K]]


# --- a binary heap, written out, so the comparisons can be counted -------

def sift_up(heap, i, slot, sign):
    while i > 0:
        parent = (i - 1) // 2
        work[slot] += 1
        if heap[i][0] * sign < heap[parent][0] * sign:
            heap[i], heap[parent] = heap[parent], heap[i]
            i = parent
        else:
            break


def sift_down(heap, i, slot, sign):
    size = len(heap)
    while True:
        best = i
        for child in (2 * i + 1, 2 * i + 2):
            if child < size:
                work[slot] += 1
                if heap[child][0] * sign < heap[best][0] * sign:
                    best = child
        if best == i:
            return
        heap[i], heap[best] = heap[best], heap[i]
        i = best


# --- version two: a min-heap of everything, then pop k times -------------

def by_full_heap(query, docs):
    heap = []
    for i in range(len(docs)):
        heap.append([sq_dist(query, docs[i], 0), i])
        sift_up(heap, len(heap) - 1, 2, 1)
    out = []
    for _ in range(K):
        out.append(heap[0][1])
        heap[0] = heap[len(heap) - 1]
        heap.pop()
        sift_down(heap, 0, 2, 1)
    return out


# --- version three: a max-heap holding only the best k so far ------------

def by_bounded_heap(query, docs):
    heap = []
    for i in range(len(docs)):
        d = sq_dist(query, docs[i], 0)
        if len(heap) < K:
            heap.append([d, i])
            sift_up(heap, len(heap) - 1, 3, -1)
            continue
        work[3] += 1
        if d >= heap[0][0]:
            rejected[0] += 1
            continue
        heap[0] = [d, i]
        sift_down(heap, 0, 3, -1)
    out = []
    while len(heap) > 0:
        out.append(heap[0][1])
        heap[0] = heap[len(heap) - 1]
        heap.pop()
        sift_down(heap, 0, 3, -1)
    out.reverse()
    return out


def canonical(indices, query, docs):
    scored = []
    for i in indices:
        d = 0
        for j in range(DIM):
            diff = query[j] - docs[i][j]
            d += diff * diff
        scored.append([d, i])
    scored.sort()
    return scored


# The same linear congruential generator in every language, so the random
# vectors below are the same vectors whichever translation is run.
seed = 55501001


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


def make(n):
    query = [rand(1000) for _ in range(DIM)]
    docs = []
    for _ in range(n):
        docs.append([rand(1000) for _ in range(DIM)])
    return query, docs


print("k = %d neighbours, %d dimensions" % (K, DIM))
print()
print("           n   distances   sort cmps   full heap   top-k heap")
sizes = [1000, 2000, 4000, 8000]
rows = []
for n in sizes:
    query, docs = make(n)
    for s in range(4):
        work[s] = 0
    rejected[0] = 0
    a = by_sorting(query, docs)
    b = by_full_heap(query, docs)
    c = by_bounded_heap(query, docs)
    same = canonical(a, query, docs) == canonical(b, query, docs) == canonical(c, query, docs)
    if not same:
        print("  the three disagreed at n = %d" % n)
    # each of the three measured every document once, so the distance
    # count is the same n for all three.
    rows.append([n, work[0] // 3, work[1], work[2], work[3], rejected[0]])
    print("%12d %11d %11d %11d %12d" % (n, work[0] // 3, work[1], work[2], work[3]))
print()
print("the same numbers as comparisons per document:")
print()
print("           n   sort cmps   full heap   top-k heap")
for row in rows:
    print("%12d %8d.%02d %8d.%02d %8d.%02d"
          % (row[0],
             row[2] * 100 // row[0] // 100, row[2] * 100 // row[0] % 100,
             row[3] * 100 // row[0] // 100, row[3] * 100 // row[0] % 100,
             row[4] * 100 // row[0] // 100, row[4] * 100 // row[0] % 100))
print()
last = rows[len(rows) - 1]
print("at n = %d the bounded heap threw away %d of %d candidates after a"
      % (last[0], last[5], last[0]))
print("single comparison against the worst neighbour it was already keeping.")
print()
print("""All three return the same k neighbours -- that is checked at every
size, and nothing below would mean anything if it were not.

Read the comparisons-per-document table first. Sorting everything
climbs, 8.69 to 11.71, because it is log n per document and log n
grows. The full heap is flat at about 2.3, because building a heap is
linear and the k pops are lost in the noise. The bounded heap falls
towards 1.00, and that is the number worth remembering: at n = 8000 it
spends 1.04 comparisons per document, because 7924 of the 8000
documents are dismissed by a single comparison against the worst
neighbour it is currently holding. It never sifts, never allocates,
never touches the rest of the heap.

So keeping only k is not a small constant-factor tweak. It turns the
selection step into roughly one comparison per candidate, which is as
cheap as a scan can be.

Now read the column that does not move. Distances is exactly n for all
three, at every size, and that is the whole point of the example. The
heap made the bookkeeping nearly free and did nothing whatsoever about
the scanning. Every one of the n documents still had its distance
computed, and in a real system each of those is a dot product over 768
or 1536 dimensions -- not the eight here.

That is where exact search stops. At a million vectors of 1536
dimensions, one query is about 1.5 billion multiply-adds no matter how
good the heap is, because the algorithm's floor is looking at
everything once. There is no data structure in this track that fixes
that, because fixing it means not looking at everything -- which means
giving up the guarantee that the answer is right. That trade is the
subject of the next three lessons.""")
`,
          output: `k = 10 neighbours, 8 dimensions

           n   distances   sort cmps   full heap   top-k heap
        1000        1000        8696        2342         1237
        2000        2000       19384        4740         2269
        4000        4000       42898        9283         4314
        8000        8000       93696       18189         8338

the same numbers as comparisons per document:

           n   sort cmps   full heap   top-k heap
        1000        8.69        2.34        1.23
        2000        9.69        2.37        1.13
        4000       10.72        2.32        1.07
        8000       11.71        2.27        1.04

at n = 8000 the bounded heap threw away 7924 of 8000 candidates after a
single comparison against the worst neighbour it was already keeping.

All three return the same k neighbours -- that is checked at every
size, and nothing below would mean anything if it were not.

Read the comparisons-per-document table first. Sorting everything
climbs, 8.69 to 11.71, because it is log n per document and log n
grows. The full heap is flat at about 2.3, because building a heap is
linear and the k pops are lost in the noise. The bounded heap falls
towards 1.00, and that is the number worth remembering: at n = 8000 it
spends 1.04 comparisons per document, because 7924 of the 8000
documents are dismissed by a single comparison against the worst
neighbour it is currently holding. It never sifts, never allocates,
never touches the rest of the heap.

So keeping only k is not a small constant-factor tweak. It turns the
selection step into roughly one comparison per candidate, which is as
cheap as a scan can be.

Now read the column that does not move. Distances is exactly n for all
three, at every size, and that is the whole point of the example. The
heap made the bookkeeping nearly free and did nothing whatsoever about
the scanning. Every one of the n documents still had its distance
computed, and in a real system each of those is a dot product over 768
or 1536 dimensions -- not the eight here.

That is where exact search stops. At a million vectors of 1536
dimensions, one query is about 1.5 billion multiply-adds no matter how
good the heap is, because the algorithm's floor is looking at
everything once. There is no data structure in this track that fixes
that, because fixing it means not looking at everything -- which means
giving up the guarantee that the answer is right. That trade is the
subject of the next three lessons.`,
          explanation:
            "Read the comparisons-per-document table. Sorting climbs from 8.69 to 11.71 as n grows, because it is log n per document. The full heap sits flat around 2.3, since building it is linear and k pops vanish into the noise. The bounded heap falls towards 1.00, reaching 1.04 at n = 8,000 -- because 7,924 of the 8,000 documents are dismissed by a single comparison against the worst neighbour currently held, and never sift, never allocate, never touch the rest of the heap. Then read the column that does not move: distances is exactly n for all three, at every size. The heap made the bookkeeping nearly free and did nothing whatsoever about the scanning.",
          alternates: [
            {
              lang: "javascript",
              code: `// Exact k-nearest-neighbour search, three ways, with the work counted.
// The three agree on the answer. What differs is what they spend, and the
// interesting part is the column that does not move at all.

const DIM = 8;
const K = 10;

const work = [0, 0, 0, 0]; // distances, sort comparisons, full-heap, bounded-heap
const rejected = [0];

function sqDist(a, b, slot) {
  let total = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    total += d * d;
  }
  work[slot] += 1;
  return total;
}

// --- version one: measure everything, sort, take the first k -------------

function mergeSort(items) {
  if (items.length <= 1) return items;
  const mid = Math.floor(items.length / 2);
  const left = mergeSort(items.slice(0, mid));
  const right = mergeSort(items.slice(mid));
  const out = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    work[1] += 1;
    if (left[i][0] <= right[j][0]) {
      out.push(left[i]);
      i += 1;
    } else {
      out.push(right[j]);
      j += 1;
    }
  }
  while (i < left.length) {
    out.push(left[i]);
    i += 1;
  }
  while (j < right.length) {
    out.push(right[j]);
    j += 1;
  }
  return out;
}

function bySorting(query, docs) {
  const scored = [];
  for (let i = 0; i < docs.length; i++) scored.push([sqDist(query, docs[i], 0), i]);
  return mergeSort(scored).slice(0, K).map((pair) => pair[1]);
}

// --- a binary heap, written out, so the comparisons can be counted -------

function siftUp(heap, i, slot, sign) {
  while (i > 0) {
    const parent = Math.floor((i - 1) / 2);
    work[slot] += 1;
    if (heap[i][0] * sign < heap[parent][0] * sign) {
      const swap = heap[i];
      heap[i] = heap[parent];
      heap[parent] = swap;
      i = parent;
    } else {
      break;
    }
  }
}

function siftDown(heap, i, slot, sign) {
  const size = heap.length;
  for (;;) {
    let best = i;
    for (const child of [2 * i + 1, 2 * i + 2]) {
      if (child < size) {
        work[slot] += 1;
        if (heap[child][0] * sign < heap[best][0] * sign) best = child;
      }
    }
    if (best === i) return;
    const swap = heap[i];
    heap[i] = heap[best];
    heap[best] = swap;
    i = best;
  }
}

// --- version two: a min-heap of everything, then pop k times -------------

function byFullHeap(query, docs) {
  const heap = [];
  for (let i = 0; i < docs.length; i++) {
    heap.push([sqDist(query, docs[i], 0), i]);
    siftUp(heap, heap.length - 1, 2, 1);
  }
  const out = [];
  for (let r = 0; r < K; r++) {
    out.push(heap[0][1]);
    heap[0] = heap[heap.length - 1];
    heap.pop();
    siftDown(heap, 0, 2, 1);
  }
  return out;
}

// --- version three: a max-heap holding only the best k so far ------------

function byBoundedHeap(query, docs) {
  const heap = [];
  for (let i = 0; i < docs.length; i++) {
    const d = sqDist(query, docs[i], 0);
    if (heap.length < K) {
      heap.push([d, i]);
      siftUp(heap, heap.length - 1, 3, -1);
      continue;
    }
    work[3] += 1;
    if (d >= heap[0][0]) {
      rejected[0] += 1;
      continue;
    }
    heap[0] = [d, i];
    siftDown(heap, 0, 3, -1);
  }
  const out = [];
  while (heap.length > 0) {
    out.push(heap[0][1]);
    heap[0] = heap[heap.length - 1];
    heap.pop();
    siftDown(heap, 0, 3, -1);
  }
  out.reverse();
  return out;
}

function canonical(indices, query, docs) {
  const scored = [];
  for (const i of indices) {
    let d = 0;
    for (let j = 0; j < DIM; j++) {
      const diff = query[j] - docs[i][j];
      d += diff * diff;
    }
    scored.push([d, i]);
  }
  scored.sort((x, y) => (x[0] !== y[0] ? x[0] - y[0] : x[1] - y[1]));
  return scored.map((pair) => pair[0] + ":" + pair[1]).join(",");
}

// The same linear congruential generator in every language, so the random
// vectors below are the same vectors whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 55501001n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function make(n) {
  const query = [];
  for (let i = 0; i < DIM; i++) query.push(rand(1000));
  const docs = [];
  for (let d = 0; d < n; d++) {
    const v = [];
    for (let i = 0; i < DIM; i++) v.push(rand(1000));
    docs.push(v);
  }
  return [query, docs];
}

function padLeft(s, width) {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

function twoPlaces(top, bottom) {
  // integer arithmetic on purpose: floating point formats differently in
  // different languages, and this table has to read the same in all of them.
  const scaled = Math.floor((top * 100) / bottom);
  const fraction = scaled % 100;
  return padLeft(Math.floor(scaled / 100), 8) + "." + (fraction < 10 ? "0" : "") + fraction;
}

console.log("k = " + K + " neighbours, " + DIM + " dimensions");
console.log();
console.log("           n   distances   sort cmps   full heap   top-k heap");
const sizes = [1000, 2000, 4000, 8000];
const rows = [];
for (const n of sizes) {
  const [query, docs] = make(n);
  for (let s = 0; s < 4; s++) work[s] = 0;
  rejected[0] = 0;
  const a = bySorting(query, docs);
  const b = byFullHeap(query, docs);
  const c = byBoundedHeap(query, docs);
  const same =
    canonical(a, query, docs) === canonical(b, query, docs) &&
    canonical(b, query, docs) === canonical(c, query, docs);
  if (!same) console.log("  the three disagreed at n = " + n);
  // each of the three measured every document once, so the distance
  // count is the same n for all three.
  rows.push([n, Math.floor(work[0] / 3), work[1], work[2], work[3], rejected[0]]);
  console.log(
    padLeft(n, 12) + " " + padLeft(Math.floor(work[0] / 3), 11) + " " + padLeft(work[1], 11) +
      " " + padLeft(work[2], 11) + " " + padLeft(work[3], 12),
  );
}
console.log();
console.log("the same numbers as comparisons per document:");
console.log();
console.log("           n   sort cmps   full heap   top-k heap");
for (const row of rows) {
  console.log(
    padLeft(row[0], 12) + " " + twoPlaces(row[2], row[0]) + " " + twoPlaces(row[3], row[0]) +
      " " + twoPlaces(row[4], row[0]),
  );
}
console.log();
const last = rows[rows.length - 1];
console.log(
  "at n = " + last[0] + " the bounded heap threw away " + last[5] + " of " + last[0] +
    " candidates after a",
);
console.log("single comparison against the worst neighbour it was already keeping.");
console.log();
console.log(
  [
    "All three return the same k neighbours -- that is checked at every",
    "size, and nothing below would mean anything if it were not.",
    "",
    "Read the comparisons-per-document table first. Sorting everything",
    "climbs, 8.69 to 11.71, because it is log n per document and log n",
    "grows. The full heap is flat at about 2.3, because building a heap is",
    "linear and the k pops are lost in the noise. The bounded heap falls",
    "towards 1.00, and that is the number worth remembering: at n = 8000 it",
    "spends 1.04 comparisons per document, because 7924 of the 8000",
    "documents are dismissed by a single comparison against the worst",
    "neighbour it is currently holding. It never sifts, never allocates,",
    "never touches the rest of the heap.",
    "",
    "So keeping only k is not a small constant-factor tweak. It turns the",
    "selection step into roughly one comparison per candidate, which is as",
    "cheap as a scan can be.",
    "",
    "Now read the column that does not move. Distances is exactly n for all",
    "three, at every size, and that is the whole point of the example. The",
    "heap made the bookkeeping nearly free and did nothing whatsoever about",
    "the scanning. Every one of the n documents still had its distance",
    "computed, and in a real system each of those is a dot product over 768",
    "or 1536 dimensions -- not the eight here.",
    "",
    "That is where exact search stops. At a million vectors of 1536",
    "dimensions, one query is about 1.5 billion multiply-adds no matter how",
    "good the heap is, because the algorithm's floor is looking at",
    "everything once. There is no data structure in this track that fixes",
    "that, because fixing it means not looking at everything -- which means",
    "giving up the guarantee that the answer is right. That trade is the",
    "subject of the next three lessons.",
  ].join("\\n"),
);
`,
            },
            {
              lang: "typescript",
              code: `// Exact k-nearest-neighbour search, three ways, with the work counted.
// The three agree on the answer. What differs is what they spend, and the
// interesting part is the column that does not move at all.

type Scored = [number, number];

const DIM = 8;
const K = 10;

const work = [0, 0, 0, 0]; // distances, sort comparisons, full-heap, bounded-heap
const rejected = [0];

function sqDist(a: number[], b: number[], slot: number): number {
  let total = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    total += d * d;
  }
  work[slot] += 1;
  return total;
}

// --- version one: measure everything, sort, take the first k -------------

function mergeSort(items: Scored[]): Scored[] {
  if (items.length <= 1) return items;
  const mid = Math.floor(items.length / 2);
  const left = mergeSort(items.slice(0, mid));
  const right = mergeSort(items.slice(mid));
  const out: Scored[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    work[1] += 1;
    if (left[i][0] <= right[j][0]) {
      out.push(left[i]);
      i += 1;
    } else {
      out.push(right[j]);
      j += 1;
    }
  }
  while (i < left.length) {
    out.push(left[i]);
    i += 1;
  }
  while (j < right.length) {
    out.push(right[j]);
    j += 1;
  }
  return out;
}

function bySorting(query: number[], docs: number[][]): number[] {
  const scored: Scored[] = [];
  for (let i = 0; i < docs.length; i++) scored.push([sqDist(query, docs[i], 0), i]);
  return mergeSort(scored).slice(0, K).map((pair) => pair[1]);
}

// --- a binary heap, written out, so the comparisons can be counted -------

function siftUp(heap: Scored[], i: number, slot: number, sign: number): void {
  while (i > 0) {
    const parent = Math.floor((i - 1) / 2);
    work[slot] += 1;
    if (heap[i][0] * sign < heap[parent][0] * sign) {
      const swap = heap[i];
      heap[i] = heap[parent];
      heap[parent] = swap;
      i = parent;
    } else {
      break;
    }
  }
}

function siftDown(heap: Scored[], i: number, slot: number, sign: number): void {
  const size = heap.length;
  for (;;) {
    let best = i;
    for (const child of [2 * i + 1, 2 * i + 2]) {
      if (child < size) {
        work[slot] += 1;
        if (heap[child][0] * sign < heap[best][0] * sign) best = child;
      }
    }
    if (best === i) return;
    const swap = heap[i];
    heap[i] = heap[best];
    heap[best] = swap;
    i = best;
  }
}

// --- version two: a min-heap of everything, then pop k times -------------

function byFullHeap(query: number[], docs: number[][]): number[] {
  const heap: Scored[] = [];
  for (let i = 0; i < docs.length; i++) {
    heap.push([sqDist(query, docs[i], 0), i]);
    siftUp(heap, heap.length - 1, 2, 1);
  }
  const out: number[] = [];
  for (let r = 0; r < K; r++) {
    out.push(heap[0][1]);
    heap[0] = heap[heap.length - 1];
    heap.pop();
    siftDown(heap, 0, 2, 1);
  }
  return out;
}

// --- version three: a max-heap holding only the best k so far ------------

function byBoundedHeap(query: number[], docs: number[][]): number[] {
  const heap: Scored[] = [];
  for (let i = 0; i < docs.length; i++) {
    const d = sqDist(query, docs[i], 0);
    if (heap.length < K) {
      heap.push([d, i]);
      siftUp(heap, heap.length - 1, 3, -1);
      continue;
    }
    work[3] += 1;
    if (d >= heap[0][0]) {
      rejected[0] += 1;
      continue;
    }
    heap[0] = [d, i];
    siftDown(heap, 0, 3, -1);
  }
  const out: number[] = [];
  while (heap.length > 0) {
    out.push(heap[0][1]);
    heap[0] = heap[heap.length - 1];
    heap.pop();
    siftDown(heap, 0, 3, -1);
  }
  out.reverse();
  return out;
}

function canonical(indices: number[], query: number[], docs: number[][]): string {
  const scored: Scored[] = [];
  for (const i of indices) {
    let d = 0;
    for (let j = 0; j < DIM; j++) {
      const diff = query[j] - docs[i][j];
      d += diff * diff;
    }
    scored.push([d, i]);
  }
  scored.sort((x, y) => (x[0] !== y[0] ? x[0] - y[0] : x[1] - y[1]));
  return scored.map((pair) => pair[0] + ":" + pair[1]).join(",");
}

// The same linear congruential generator in every language, so the random
// vectors below are the same vectors whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 55501001n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function make(n: number): [number[], number[][]] {
  const query: number[] = [];
  for (let i = 0; i < DIM; i++) query.push(rand(1000));
  const docs: number[][] = [];
  for (let d = 0; d < n; d++) {
    const v: number[] = [];
    for (let i = 0; i < DIM; i++) v.push(rand(1000));
    docs.push(v);
  }
  return [query, docs];
}

function padLeft(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

function twoPlaces(top: number, bottom: number): string {
  // integer arithmetic on purpose: floating point formats differently in
  // different languages, and this table has to read the same in all of them.
  const scaled = Math.floor((top * 100) / bottom);
  const fraction = scaled % 100;
  return padLeft(Math.floor(scaled / 100), 8) + "." + (fraction < 10 ? "0" : "") + fraction;
}

console.log("k = " + K + " neighbours, " + DIM + " dimensions");
console.log();
console.log("           n   distances   sort cmps   full heap   top-k heap");
const sizes = [1000, 2000, 4000, 8000];
const rows: number[][] = [];
for (const n of sizes) {
  const [query, docs] = make(n);
  for (let s = 0; s < 4; s++) work[s] = 0;
  rejected[0] = 0;
  const a = bySorting(query, docs);
  const b = byFullHeap(query, docs);
  const c = byBoundedHeap(query, docs);
  const same =
    canonical(a, query, docs) === canonical(b, query, docs) &&
    canonical(b, query, docs) === canonical(c, query, docs);
  if (!same) console.log("  the three disagreed at n = " + n);
  // each of the three measured every document once, so the distance
  // count is the same n for all three.
  rows.push([n, Math.floor(work[0] / 3), work[1], work[2], work[3], rejected[0]]);
  console.log(
    padLeft(n, 12) + " " + padLeft(Math.floor(work[0] / 3), 11) + " " + padLeft(work[1], 11) +
      " " + padLeft(work[2], 11) + " " + padLeft(work[3], 12),
  );
}
console.log();
console.log("the same numbers as comparisons per document:");
console.log();
console.log("           n   sort cmps   full heap   top-k heap");
for (const row of rows) {
  console.log(
    padLeft(row[0], 12) + " " + twoPlaces(row[2], row[0]) + " " + twoPlaces(row[3], row[0]) +
      " " + twoPlaces(row[4], row[0]),
  );
}
console.log();
const last = rows[rows.length - 1];
console.log(
  "at n = " + last[0] + " the bounded heap threw away " + last[5] + " of " + last[0] +
    " candidates after a",
);
console.log("single comparison against the worst neighbour it was already keeping.");
console.log();
console.log(
  [
    "All three return the same k neighbours -- that is checked at every",
    "size, and nothing below would mean anything if it were not.",
    "",
    "Read the comparisons-per-document table first. Sorting everything",
    "climbs, 8.69 to 11.71, because it is log n per document and log n",
    "grows. The full heap is flat at about 2.3, because building a heap is",
    "linear and the k pops are lost in the noise. The bounded heap falls",
    "towards 1.00, and that is the number worth remembering: at n = 8000 it",
    "spends 1.04 comparisons per document, because 7924 of the 8000",
    "documents are dismissed by a single comparison against the worst",
    "neighbour it is currently holding. It never sifts, never allocates,",
    "never touches the rest of the heap.",
    "",
    "So keeping only k is not a small constant-factor tweak. It turns the",
    "selection step into roughly one comparison per candidate, which is as",
    "cheap as a scan can be.",
    "",
    "Now read the column that does not move. Distances is exactly n for all",
    "three, at every size, and that is the whole point of the example. The",
    "heap made the bookkeeping nearly free and did nothing whatsoever about",
    "the scanning. Every one of the n documents still had its distance",
    "computed, and in a real system each of those is a dot product over 768",
    "or 1536 dimensions -- not the eight here.",
    "",
    "That is where exact search stops. At a million vectors of 1536",
    "dimensions, one query is about 1.5 billion multiply-adds no matter how",
    "good the heap is, because the algorithm's floor is looking at",
    "everything once. There is no data structure in this track that fixes",
    "that, because fixing it means not looking at everything -- which means",
    "giving up the guarantee that the answer is right. That trade is the",
    "subject of the next three lessons.",
  ].join("\\n"),
);
`,
            },
            {
              lang: "java",
              code: `// Exact k-nearest-neighbour search, three ways, with the work counted.
// The three agree on the answer. What differs is what they spend, and the
// interesting part is the column that does not move at all.

import java.util.ArrayList;
import java.util.List;

public class Main {
  static final int DIM = 8;
  static final int K = 10;

  static long[] work = new long[4]; // distances, sort comparisons, full-heap, bounded-heap
  static long rejected = 0;

  static class Scored {
    long dist;
    int index;

    Scored(long dist, int index) {
      this.dist = dist;
      this.index = index;
    }
  }

  static long sqDist(long[] a, long[] b, int slot) {
    long total = 0;
    for (int i = 0; i < a.length; i++) {
      long d = a[i] - b[i];
      total += d * d;
    }
    work[slot] += 1;
    return total;
  }

  // --- version one: measure everything, sort, take the first k -------------

  static List<Scored> mergeSort(List<Scored> items) {
    if (items.size() <= 1) {
      return items;
    }
    int mid = items.size() / 2;
    List<Scored> left = mergeSort(new ArrayList<>(items.subList(0, mid)));
    List<Scored> right = mergeSort(new ArrayList<>(items.subList(mid, items.size())));
    List<Scored> out = new ArrayList<>();
    int i = 0;
    int j = 0;
    while (i < left.size() && j < right.size()) {
      work[1] += 1;
      if (left.get(i).dist <= right.get(j).dist) {
        out.add(left.get(i));
        i += 1;
      } else {
        out.add(right.get(j));
        j += 1;
      }
    }
    while (i < left.size()) {
      out.add(left.get(i));
      i += 1;
    }
    while (j < right.size()) {
      out.add(right.get(j));
      j += 1;
    }
    return out;
  }

  static List<Integer> bySorting(long[] query, long[][] docs) {
    List<Scored> scored = new ArrayList<>();
    for (int i = 0; i < docs.length; i++) {
      scored.add(new Scored(sqDist(query, docs[i], 0), i));
    }
    List<Scored> sorted = mergeSort(scored);
    List<Integer> out = new ArrayList<>();
    for (int i = 0; i < K; i++) {
      out.add(sorted.get(i).index);
    }
    return out;
  }

  // --- a binary heap, written out, so the comparisons can be counted -------

  static void siftUp(List<Scored> heap, int i, int slot, long sign) {
    while (i > 0) {
      int parent = (i - 1) / 2;
      work[slot] += 1;
      if (heap.get(i).dist * sign < heap.get(parent).dist * sign) {
        Scored swap = heap.get(i);
        heap.set(i, heap.get(parent));
        heap.set(parent, swap);
        i = parent;
      } else {
        break;
      }
    }
  }

  static void siftDown(List<Scored> heap, int i, int slot, long sign) {
    int size = heap.size();
    while (true) {
      int best = i;
      for (int step = 0; step < 2; step++) {
        int child = 2 * i + 1 + step;
        if (child < size) {
          work[slot] += 1;
          if (heap.get(child).dist * sign < heap.get(best).dist * sign) {
            best = child;
          }
        }
      }
      if (best == i) {
        return;
      }
      Scored swap = heap.get(i);
      heap.set(i, heap.get(best));
      heap.set(best, swap);
      i = best;
    }
  }

  // --- version two: a min-heap of everything, then pop k times -------------

  static List<Integer> byFullHeap(long[] query, long[][] docs) {
    List<Scored> heap = new ArrayList<>();
    for (int i = 0; i < docs.length; i++) {
      heap.add(new Scored(sqDist(query, docs[i], 0), i));
      siftUp(heap, heap.size() - 1, 2, 1);
    }
    List<Integer> out = new ArrayList<>();
    for (int r = 0; r < K; r++) {
      out.add(heap.get(0).index);
      heap.set(0, heap.get(heap.size() - 1));
      heap.remove(heap.size() - 1);
      siftDown(heap, 0, 2, 1);
    }
    return out;
  }

  // --- version three: a max-heap holding only the best k so far ------------

  static List<Integer> byBoundedHeap(long[] query, long[][] docs) {
    List<Scored> heap = new ArrayList<>();
    for (int i = 0; i < docs.length; i++) {
      long d = sqDist(query, docs[i], 0);
      if (heap.size() < K) {
        heap.add(new Scored(d, i));
        siftUp(heap, heap.size() - 1, 3, -1);
        continue;
      }
      work[3] += 1;
      if (d >= heap.get(0).dist) {
        rejected += 1;
        continue;
      }
      heap.set(0, new Scored(d, i));
      siftDown(heap, 0, 3, -1);
    }
    List<Integer> out = new ArrayList<>();
    while (heap.size() > 0) {
      out.add(heap.get(0).index);
      heap.set(0, heap.get(heap.size() - 1));
      heap.remove(heap.size() - 1);
      siftDown(heap, 0, 3, -1);
    }
    java.util.Collections.reverse(out);
    return out;
  }

  static String canonical(List<Integer> indices, long[] query, long[][] docs) {
    List<Scored> scored = new ArrayList<>();
    for (int i : indices) {
      long d = 0;
      for (int j = 0; j < DIM; j++) {
        long diff = query[j] - docs[i][j];
        d += diff * diff;
      }
      scored.add(new Scored(d, i));
    }
    scored.sort((x, y) -> x.dist != y.dist ? Long.compare(x.dist, y.dist) : x.index - y.index);
    StringBuilder sb = new StringBuilder();
    for (Scored s : scored) {
      sb.append(s.dist).append(":").append(s.index).append(",");
    }
    return sb.toString();
  }

  // The same linear congruential generator in every language, so the random
  // vectors below are the same vectors whichever translation is run.
  static long seed = 55501001L;

  static long rand(long n) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return seed / 65536L % n;
  }

  static long[][] makeDocs(int n) {
    long[][] docs = new long[n][DIM];
    for (int d = 0; d < n; d++) {
      for (int i = 0; i < DIM; i++) {
        docs[d][i] = rand(1000);
      }
    }
    return docs;
  }

  static String twoPlaces(long top, long bottom) {
    // integer arithmetic on purpose: floating point formats differently in
    // different languages, and this table has to read the same in all of them.
    long scaled = top * 100 / bottom;
    return String.format("%8d.%02d", scaled / 100, scaled % 100);
  }

  public static void main(String[] args) {
    System.out.println("k = " + K + " neighbours, " + DIM + " dimensions");
    System.out.println();
    System.out.println("           n   distances   sort cmps   full heap   top-k heap");
    int[] sizes = {1000, 2000, 4000, 8000};
    List<long[]> rows = new ArrayList<>();
    for (int n : sizes) {
      long[] query = new long[DIM];
      for (int i = 0; i < DIM; i++) {
        query[i] = rand(1000);
      }
      long[][] docs = makeDocs(n);
      for (int s = 0; s < 4; s++) {
        work[s] = 0;
      }
      rejected = 0;
      List<Integer> a = bySorting(query, docs);
      List<Integer> b = byFullHeap(query, docs);
      List<Integer> c = byBoundedHeap(query, docs);
      boolean same =
          canonical(a, query, docs).equals(canonical(b, query, docs))
              && canonical(b, query, docs).equals(canonical(c, query, docs));
      if (!same) {
        System.out.println("  the three disagreed at n = " + n);
      }
      // each of the three measured every document once, so the distance
      // count is the same n for all three.
      rows.add(new long[] {n, work[0] / 3, work[1], work[2], work[3], rejected});
      System.out.printf("%12d %11d %11d %11d %12d%n", n, work[0] / 3, work[1], work[2], work[3]);
    }
    System.out.println();
    System.out.println("the same numbers as comparisons per document:");
    System.out.println();
    System.out.println("           n   sort cmps   full heap   top-k heap");
    for (long[] row : rows) {
      System.out.printf(
          "%12d %s %s %s%n",
          row[0], twoPlaces(row[2], row[0]), twoPlaces(row[3], row[0]), twoPlaces(row[4], row[0]));
    }
    System.out.println();
    long[] last = rows.get(rows.size() - 1);
    System.out.printf(
        "at n = %d the bounded heap threw away %d of %d candidates after a%n",
        last[0], last[5], last[0]);
    System.out.println("single comparison against the worst neighbour it was already keeping.");
    System.out.println();
    System.out.println(String.join("\\n",
        "All three return the same k neighbours -- that is checked at every",
        "size, and nothing below would mean anything if it were not.",
        "",
        "Read the comparisons-per-document table first. Sorting everything",
        "climbs, 8.69 to 11.71, because it is log n per document and log n",
        "grows. The full heap is flat at about 2.3, because building a heap is",
        "linear and the k pops are lost in the noise. The bounded heap falls",
        "towards 1.00, and that is the number worth remembering: at n = 8000 it",
        "spends 1.04 comparisons per document, because 7924 of the 8000",
        "documents are dismissed by a single comparison against the worst",
        "neighbour it is currently holding. It never sifts, never allocates,",
        "never touches the rest of the heap.",
        "",
        "So keeping only k is not a small constant-factor tweak. It turns the",
        "selection step into roughly one comparison per candidate, which is as",
        "cheap as a scan can be.",
        "",
        "Now read the column that does not move. Distances is exactly n for all",
        "three, at every size, and that is the whole point of the example. The",
        "heap made the bookkeeping nearly free and did nothing whatsoever about",
        "the scanning. Every one of the n documents still had its distance",
        "computed, and in a real system each of those is a dot product over 768",
        "or 1536 dimensions -- not the eight here.",
        "",
        "That is where exact search stops. At a million vectors of 1536",
        "dimensions, one query is about 1.5 billion multiply-adds no matter how",
        "good the heap is, because the algorithm's floor is looking at",
        "everything once. There is no data structure in this track that fixes",
        "that, because fixing it means not looking at everything -- which means",
        "giving up the guarantee that the answer is right. That trade is the",
        "subject of the next three lessons."));
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// Exact k-nearest-neighbour search, three ways, with the work counted.
// The three agree on the answer. What differs is what they spend, and the
// interesting part is the column that does not move at all.

#include <algorithm>
#include <cstdio>
#include <iostream>
#include <string>
#include <vector>

static const int DIM = 8;
static const int K = 10;

long long work[4] = {0, 0, 0, 0};  // distances, sort comparisons, full-heap, bounded-heap
long long rejected = 0;

struct Scored {
  long long dist;
  int index;
};

typedef std::vector<long long> Vec;

long long sqDist(const Vec& a, const Vec& b, int slot) {
  long long total = 0;
  for (size_t i = 0; i < a.size(); i++) {
    long long d = a[i] - b[i];
    total += d * d;
  }
  work[slot] += 1;
  return total;
}

// --- version one: measure everything, sort, take the first k -------------

std::vector<Scored> mergeSort(const std::vector<Scored>& items) {
  std::vector<Scored> out;
  if (items.size() <= 1) {
    out.assign(items.begin(), items.end());
    return out;
  }
  size_t mid = items.size() / 2;
  std::vector<Scored> left;
  left.assign(items.begin(), items.begin() + mid);
  std::vector<Scored> right;
  right.assign(items.begin() + mid, items.end());
  left = mergeSort(left);
  right = mergeSort(right);
  size_t i = 0;
  size_t j = 0;
  while (i < left.size() && j < right.size()) {
    work[1] += 1;
    if (left[i].dist <= right[j].dist) {
      out.push_back(left[i]);
      i += 1;
    } else {
      out.push_back(right[j]);
      j += 1;
    }
  }
  while (i < left.size()) {
    out.push_back(left[i]);
    i += 1;
  }
  while (j < right.size()) {
    out.push_back(right[j]);
    j += 1;
  }
  return out;
}

std::vector<int> bySorting(const Vec& query, const std::vector<Vec>& docs) {
  std::vector<Scored> scored;
  for (size_t i = 0; i < docs.size(); i++) {
    scored.push_back(Scored{sqDist(query, docs[i], 0), (int)i});
  }
  std::vector<Scored> sorted = mergeSort(scored);
  std::vector<int> out;
  for (int i = 0; i < K; i++) {
    out.push_back(sorted[i].index);
  }
  return out;
}

// --- a binary heap, written out, so the comparisons can be counted -------

void siftUp(std::vector<Scored>& heap, int i, int slot, long long sign) {
  while (i > 0) {
    int parent = (i - 1) / 2;
    work[slot] += 1;
    if (heap[i].dist * sign < heap[parent].dist * sign) {
      std::swap(heap[i], heap[parent]);
      i = parent;
    } else {
      break;
    }
  }
}

void siftDown(std::vector<Scored>& heap, int i, int slot, long long sign) {
  int size = (int)heap.size();
  for (;;) {
    int best = i;
    for (int step = 0; step < 2; step++) {
      int child = 2 * i + 1 + step;
      if (child < size) {
        work[slot] += 1;
        if (heap[child].dist * sign < heap[best].dist * sign) {
          best = child;
        }
      }
    }
    if (best == i) {
      return;
    }
    std::swap(heap[i], heap[best]);
    i = best;
  }
}

// --- version two: a min-heap of everything, then pop k times -------------

std::vector<int> byFullHeap(const Vec& query, const std::vector<Vec>& docs) {
  std::vector<Scored> heap;
  for (size_t i = 0; i < docs.size(); i++) {
    heap.push_back(Scored{sqDist(query, docs[i], 0), (int)i});
    siftUp(heap, (int)heap.size() - 1, 2, 1);
  }
  std::vector<int> out;
  for (int r = 0; r < K; r++) {
    out.push_back(heap[0].index);
    heap[0] = heap[heap.size() - 1];
    heap.pop_back();
    siftDown(heap, 0, 2, 1);
  }
  return out;
}

// --- version three: a max-heap holding only the best k so far ------------

std::vector<int> byBoundedHeap(const Vec& query, const std::vector<Vec>& docs) {
  std::vector<Scored> heap;
  for (size_t i = 0; i < docs.size(); i++) {
    long long d = sqDist(query, docs[i], 0);
    if ((int)heap.size() < K) {
      heap.push_back(Scored{d, (int)i});
      siftUp(heap, (int)heap.size() - 1, 3, -1);
      continue;
    }
    work[3] += 1;
    if (d >= heap[0].dist) {
      rejected += 1;
      continue;
    }
    heap[0] = Scored{d, (int)i};
    siftDown(heap, 0, 3, -1);
  }
  std::vector<int> out;
  while (heap.size() > 0) {
    out.push_back(heap[0].index);
    heap[0] = heap[heap.size() - 1];
    heap.pop_back();
    siftDown(heap, 0, 3, -1);
  }
  std::reverse(out.begin(), out.end());
  return out;
}

std::string canonical(const std::vector<int>& indices, const Vec& query,
                      const std::vector<Vec>& docs) {
  std::vector<Scored> scored;
  for (int i : indices) {
    long long d = 0;
    for (int j = 0; j < DIM; j++) {
      long long diff = query[j] - docs[i][j];
      d += diff * diff;
    }
    scored.push_back(Scored{d, i});
  }
  std::sort(scored.begin(), scored.end(), [](const Scored& x, const Scored& y) {
    return x.dist != y.dist ? x.dist < y.dist : x.index < y.index;
  });
  std::string out;
  for (const Scored& s : scored) {
    out += std::to_string(s.dist) + ":" + std::to_string(s.index) + ",";
  }
  return out;
}

// The same linear congruential generator in every language, so the random
// vectors below are the same vectors whichever translation is run.
long long seed = 55501001LL;

long long rand_below(long long n) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return seed / 65536LL % n;
}

std::string twoPlaces(long long top, long long bottom) {
  // integer arithmetic on purpose: floating point formats differently in
  // different languages, and this table has to read the same in all of them.
  long long scaled = top * 100 / bottom;
  char buffer[64];
  std::snprintf(buffer, sizeof(buffer), "%8lld.%02lld", scaled / 100, scaled % 100);
  return std::string(buffer);
}

int main() {
  std::printf("k = %d neighbours, %d dimensions\\n", K, DIM);
  std::printf("\\n");
  std::printf("           n   distances   sort cmps   full heap   top-k heap\\n");
  int sizes[4] = {1000, 2000, 4000, 8000};
  std::vector<std::vector<long long> > rows;
  for (int s = 0; s < 4; s++) {
    int n = sizes[s];
    Vec query;
    for (int i = 0; i < DIM; i++) {
      query.push_back(rand_below(1000));
    }
    std::vector<Vec> docs;
    for (int d = 0; d < n; d++) {
      Vec v;
      for (int i = 0; i < DIM; i++) {
        v.push_back(rand_below(1000));
      }
      docs.push_back(v);
    }
    for (int j = 0; j < 4; j++) {
      work[j] = 0;
    }
    rejected = 0;
    std::vector<int> a = bySorting(query, docs);
    std::vector<int> b = byFullHeap(query, docs);
    std::vector<int> c = byBoundedHeap(query, docs);
    bool same = canonical(a, query, docs) == canonical(b, query, docs) &&
                canonical(b, query, docs) == canonical(c, query, docs);
    if (!same) {
      std::printf("  the three disagreed at n = %d\\n", n);
    }
    // each of the three measured every document once, so the distance
    // count is the same n for all three.
    std::vector<long long> row;
    row.push_back(n);
    row.push_back(work[0] / 3);
    row.push_back(work[1]);
    row.push_back(work[2]);
    row.push_back(work[3]);
    row.push_back(rejected);
    rows.push_back(row);
    std::printf("%12d %11lld %11lld %11lld %12lld\\n", n, work[0] / 3, work[1], work[2], work[3]);
  }
  std::printf("\\n");
  std::printf("the same numbers as comparisons per document:\\n");
  std::printf("\\n");
  std::printf("           n   sort cmps   full heap   top-k heap\\n");
  for (size_t r = 0; r < rows.size(); r++) {
    std::printf("%12lld %s %s %s\\n", rows[r][0], twoPlaces(rows[r][2], rows[r][0]).c_str(),
                twoPlaces(rows[r][3], rows[r][0]).c_str(),
                twoPlaces(rows[r][4], rows[r][0]).c_str());
  }
  std::printf("\\n");
  std::vector<long long> last = rows[rows.size() - 1];
  std::printf("at n = %lld the bounded heap threw away %lld of %lld candidates after a\\n", last[0],
              last[5], last[0]);
  std::printf("single comparison against the worst neighbour it was already keeping.\\n");
  std::printf("\\n");
    std::cout
        << "All three return the same k neighbours -- that is checked at every" << "\\n"
        << "size, and nothing below would mean anything if it were not." << "\\n"
        << "" << "\\n"
        << "Read the comparisons-per-document table first. Sorting everything" << "\\n"
        << "climbs, 8.69 to 11.71, because it is log n per document and log n" << "\\n"
        << "grows. The full heap is flat at about 2.3, because building a heap is" << "\\n"
        << "linear and the k pops are lost in the noise. The bounded heap falls" << "\\n"
        << "towards 1.00, and that is the number worth remembering: at n = 8000 it" << "\\n"
        << "spends 1.04 comparisons per document, because 7924 of the 8000" << "\\n"
        << "documents are dismissed by a single comparison against the worst" << "\\n"
        << "neighbour it is currently holding. It never sifts, never allocates," << "\\n"
        << "never touches the rest of the heap." << "\\n"
        << "" << "\\n"
        << "So keeping only k is not a small constant-factor tweak. It turns the" << "\\n"
        << "selection step into roughly one comparison per candidate, which is as" << "\\n"
        << "cheap as a scan can be." << "\\n"
        << "" << "\\n"
        << "Now read the column that does not move. Distances is exactly n for all" << "\\n"
        << "three, at every size, and that is the whole point of the example. The" << "\\n"
        << "heap made the bookkeeping nearly free and did nothing whatsoever about" << "\\n"
        << "the scanning. Every one of the n documents still had its distance" << "\\n"
        << "computed, and in a real system each of those is a dot product over 768" << "\\n"
        << "or 1536 dimensions -- not the eight here." << "\\n"
        << "" << "\\n"
        << "That is where exact search stops. At a million vectors of 1536" << "\\n"
        << "dimensions, one query is about 1.5 billion multiply-adds no matter how" << "\\n"
        << "good the heap is, because the algorithm's floor is looking at" << "\\n"
        << "everything once. There is no data structure in this track that fixes" << "\\n"
        << "that, because fixing it means not looking at everything -- which means" << "\\n"
        << "giving up the guarantee that the answer is right. That trade is the" << "\\n"
        << "subject of the next three lessons." << "\\n"
        ;
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Exact k-nearest-neighbour search, three ways, with the work counted.
// The three agree on the answer. What differs is what they spend, and the
// interesting part is the column that does not move at all.

const DIM: usize = 8;
const K: usize = 10;

// distances, sort comparisons, full-heap, bounded-heap
static mut WORK: [i64; 4] = [0, 0, 0, 0];
static mut REJECTED: i64 = 0;

fn tick(slot: usize) {
    unsafe {
        WORK[slot] += 1;
    }
}

fn counted(slot: usize) -> i64 {
    unsafe { WORK[slot] }
}

#[derive(Clone, Copy)]
struct Scored {
    dist: i64,
    index: usize,
}

fn sq_dist(a: &[i64], b: &[i64], slot: usize) -> i64 {
    let mut total = 0;
    for i in 0..a.len() {
        let d = a[i] - b[i];
        total += d * d;
    }
    tick(slot);
    total
}

// --- version one: measure everything, sort, take the first k -------------

fn merge_sort(items: &[Scored]) -> Vec<Scored> {
    if items.len() <= 1 {
        return items.to_vec();
    }
    let mid = items.len() / 2;
    let left = merge_sort(&items[..mid]);
    let right = merge_sort(&items[mid..]);
    let mut out: Vec<Scored> = Vec::new();
    let mut i = 0;
    let mut j = 0;
    while i < left.len() && j < right.len() {
        tick(1);
        if left[i].dist <= right[j].dist {
            out.push(left[i]);
            i += 1;
        } else {
            out.push(right[j]);
            j += 1;
        }
    }
    while i < left.len() {
        out.push(left[i]);
        i += 1;
    }
    while j < right.len() {
        out.push(right[j]);
        j += 1;
    }
    out
}

fn by_sorting(query: &[i64], docs: &[Vec<i64>]) -> Vec<usize> {
    let mut scored: Vec<Scored> = Vec::new();
    for i in 0..docs.len() {
        scored.push(Scored { dist: sq_dist(query, &docs[i], 0), index: i });
    }
    let sorted = merge_sort(&scored);
    sorted[..K].iter().map(|s| s.index).collect()
}

// --- a binary heap, written out, so the comparisons can be counted -------

fn sift_up(heap: &mut Vec<Scored>, start: usize, slot: usize, sign: i64) {
    let mut i = start;
    while i > 0 {
        let parent = (i - 1) / 2;
        tick(slot);
        if heap[i].dist * sign < heap[parent].dist * sign {
            heap.swap(i, parent);
            i = parent;
        } else {
            break;
        }
    }
}

fn sift_down(heap: &mut Vec<Scored>, start: usize, slot: usize, sign: i64) {
    let size = heap.len();
    let mut i = start;
    loop {
        let mut best = i;
        for step in 0..2 {
            let child = 2 * i + 1 + step;
            if child < size {
                tick(slot);
                if heap[child].dist * sign < heap[best].dist * sign {
                    best = child;
                }
            }
        }
        if best == i {
            return;
        }
        heap.swap(i, best);
        i = best;
    }
}

// --- version two: a min-heap of everything, then pop k times -------------

fn by_full_heap(query: &[i64], docs: &[Vec<i64>]) -> Vec<usize> {
    let mut heap: Vec<Scored> = Vec::new();
    for i in 0..docs.len() {
        heap.push(Scored { dist: sq_dist(query, &docs[i], 0), index: i });
        let last = heap.len() - 1;
        sift_up(&mut heap, last, 2, 1);
    }
    let mut out: Vec<usize> = Vec::new();
    for _ in 0..K {
        out.push(heap[0].index);
        let last = heap[heap.len() - 1];
        heap[0] = last;
        heap.pop();
        sift_down(&mut heap, 0, 2, 1);
    }
    out
}

// --- version three: a max-heap holding only the best k so far ------------

fn by_bounded_heap(query: &[i64], docs: &[Vec<i64>]) -> Vec<usize> {
    let mut heap: Vec<Scored> = Vec::new();
    for i in 0..docs.len() {
        let d = sq_dist(query, &docs[i], 0);
        if heap.len() < K {
            heap.push(Scored { dist: d, index: i });
            let last = heap.len() - 1;
            sift_up(&mut heap, last, 3, -1);
            continue;
        }
        tick(3);
        if d >= heap[0].dist {
            unsafe {
                REJECTED += 1;
            }
            continue;
        }
        heap[0] = Scored { dist: d, index: i };
        sift_down(&mut heap, 0, 3, -1);
    }
    let mut out: Vec<usize> = Vec::new();
    while !heap.is_empty() {
        out.push(heap[0].index);
        let last = heap[heap.len() - 1];
        heap[0] = last;
        heap.pop();
        sift_down(&mut heap, 0, 3, -1);
    }
    out.reverse();
    out
}

fn canonical(indices: &[usize], query: &[i64], docs: &[Vec<i64>]) -> String {
    let mut scored: Vec<Scored> = Vec::new();
    for &i in indices {
        let mut d = 0;
        for j in 0..DIM {
            let diff = query[j] - docs[i][j];
            d += diff * diff;
        }
        scored.push(Scored { dist: d, index: i });
    }
    scored.sort_by(|x, y| (x.dist, x.index).cmp(&(y.dist, y.index)));
    scored
        .iter()
        .map(|s| format!("{}:{},", s.dist, s.index))
        .collect::<Vec<String>>()
        .join("")
}

// The same linear congruential generator in every language, so the random
// vectors below are the same vectors whichever translation is run.
static mut SEED: i64 = 55501001;

fn rand_below(n: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % n
    }
}

fn two_places(top: i64, bottom: i64) -> String {
    // integer arithmetic on purpose: floating point formats differently in
    // different languages, and this table has to read the same in all of them.
    let scaled = top * 100 / bottom;
    format!("{:>8}.{:02}", scaled / 100, scaled % 100)
}

fn main() {
    println!("k = {} neighbours, {} dimensions", K, DIM);
    println!();
    println!("           n   distances   sort cmps   full heap   top-k heap");
    let sizes = [1000, 2000, 4000, 8000];
    let mut rows: Vec<[i64; 6]> = Vec::new();
    for &n in sizes.iter() {
        let mut query: Vec<i64> = Vec::new();
        for _ in 0..DIM {
            query.push(rand_below(1000));
        }
        let mut docs: Vec<Vec<i64>> = Vec::new();
        for _ in 0..n {
            let mut v: Vec<i64> = Vec::new();
            for _ in 0..DIM {
                v.push(rand_below(1000));
            }
            docs.push(v);
        }
        unsafe {
            WORK = [0, 0, 0, 0];
            REJECTED = 0;
        }
        let a = by_sorting(&query, &docs);
        let b = by_full_heap(&query, &docs);
        let c = by_bounded_heap(&query, &docs);
        let same = canonical(&a, &query, &docs) == canonical(&b, &query, &docs)
            && canonical(&b, &query, &docs) == canonical(&c, &query, &docs);
        if !same {
            println!("  the three disagreed at n = {}", n);
        }
        // each of the three measured every document once, so the distance
        // count is the same n for all three.
        let rejected = unsafe { REJECTED };
        rows.push([
            n as i64,
            counted(0) / 3,
            counted(1),
            counted(2),
            counted(3),
            rejected,
        ]);
        println!(
            "{:>12} {:>11} {:>11} {:>11} {:>12}",
            n,
            counted(0) / 3,
            counted(1),
            counted(2),
            counted(3)
        );
    }
    println!();
    println!("the same numbers as comparisons per document:");
    println!();
    println!("           n   sort cmps   full heap   top-k heap");
    for row in rows.iter() {
        println!(
            "{:>12} {} {} {}",
            row[0],
            two_places(row[2], row[0]),
            two_places(row[3], row[0]),
            two_places(row[4], row[0])
        );
    }
    println!();
    let last = rows[rows.len() - 1];
    println!(
        "at n = {} the bounded heap threw away {} of {} candidates after a",
        last[0], last[5], last[0]
    );
    println!("single comparison against the worst neighbour it was already keeping.");
    println!();
    println!("{}", [
        "All three return the same k neighbours -- that is checked at every",
        "size, and nothing below would mean anything if it were not.",
        "",
        "Read the comparisons-per-document table first. Sorting everything",
        "climbs, 8.69 to 11.71, because it is log n per document and log n",
        "grows. The full heap is flat at about 2.3, because building a heap is",
        "linear and the k pops are lost in the noise. The bounded heap falls",
        "towards 1.00, and that is the number worth remembering: at n = 8000 it",
        "spends 1.04 comparisons per document, because 7924 of the 8000",
        "documents are dismissed by a single comparison against the worst",
        "neighbour it is currently holding. It never sifts, never allocates,",
        "never touches the rest of the heap.",
        "",
        "So keeping only k is not a small constant-factor tweak. It turns the",
        "selection step into roughly one comparison per candidate, which is as",
        "cheap as a scan can be.",
        "",
        "Now read the column that does not move. Distances is exactly n for all",
        "three, at every size, and that is the whole point of the example. The",
        "heap made the bookkeeping nearly free and did nothing whatsoever about",
        "the scanning. Every one of the n documents still had its distance",
        "computed, and in a real system each of those is a dot product over 768",
        "or 1536 dimensions -- not the eight here.",
        "",
        "That is where exact search stops. At a million vectors of 1536",
        "dimensions, one query is about 1.5 billion multiply-adds no matter how",
        "good the heap is, because the algorithm's floor is looking at",
        "everything once. There is no data structure in this track that fixes",
        "that, because fixing it means not looking at everything -- which means",
        "giving up the guarantee that the answer is right. That trade is the",
        "subject of the next three lessons.",
    ].join("\\n"));
}
`,
            },
            {
              lang: "go",
              code: `// Exact k-nearest-neighbour search, three ways, with the work counted.
// The three agree on the answer. What differs is what they spend, and the
// interesting part is the column that does not move at all.

package main

import (
	"fmt"
	"sort"
	"strings"
)

const dim = 8
const k = 10

// distances, sort comparisons, full-heap, bounded-heap
var work [4]int64
var rejected int64

type scored struct {
	dist  int64
	index int
}

func sqDist(a, b []int64, slot int) int64 {
	var total int64
	for i := range a {
		d := a[i] - b[i]
		total += d * d
	}
	work[slot]++
	return total
}

// --- version one: measure everything, sort, take the first k -------------

func mergeSort(items []scored) []scored {
	if len(items) <= 1 {
		return items
	}
	mid := len(items) / 2
	left := mergeSort(append([]scored{}, items[:mid]...))
	right := mergeSort(append([]scored{}, items[mid:]...))
	out := []scored{}
	i := 0
	j := 0
	for i < len(left) && j < len(right) {
		work[1]++
		if left[i].dist <= right[j].dist {
			out = append(out, left[i])
			i++
		} else {
			out = append(out, right[j])
			j++
		}
	}
	for i < len(left) {
		out = append(out, left[i])
		i++
	}
	for j < len(right) {
		out = append(out, right[j])
		j++
	}
	return out
}

func bySorting(query []int64, docs [][]int64) []int {
	all := []scored{}
	for i := range docs {
		all = append(all, scored{dist: sqDist(query, docs[i], 0), index: i})
	}
	sorted := mergeSort(all)
	out := []int{}
	for i := 0; i < k; i++ {
		out = append(out, sorted[i].index)
	}
	return out
}

// --- a binary heap, written out, so the comparisons can be counted -------

func siftUp(heap []scored, start, slot int, sign int64) {
	i := start
	for i > 0 {
		parent := (i - 1) / 2
		work[slot]++
		if heap[i].dist*sign < heap[parent].dist*sign {
			heap[i], heap[parent] = heap[parent], heap[i]
			i = parent
		} else {
			break
		}
	}
}

func siftDown(heap []scored, start, slot int, sign int64) {
	size := len(heap)
	i := start
	for {
		best := i
		for step := 0; step < 2; step++ {
			child := 2*i + 1 + step
			if child < size {
				work[slot]++
				if heap[child].dist*sign < heap[best].dist*sign {
					best = child
				}
			}
		}
		if best == i {
			return
		}
		heap[i], heap[best] = heap[best], heap[i]
		i = best
	}
}

// --- version two: a min-heap of everything, then pop k times -------------

func byFullHeap(query []int64, docs [][]int64) []int {
	heap := []scored{}
	for i := range docs {
		heap = append(heap, scored{dist: sqDist(query, docs[i], 0), index: i})
		siftUp(heap, len(heap)-1, 2, 1)
	}
	out := []int{}
	for r := 0; r < k; r++ {
		out = append(out, heap[0].index)
		heap[0] = heap[len(heap)-1]
		heap = heap[:len(heap)-1]
		siftDown(heap, 0, 2, 1)
	}
	return out
}

// --- version three: a max-heap holding only the best k so far ------------

func byBoundedHeap(query []int64, docs [][]int64) []int {
	heap := []scored{}
	for i := range docs {
		d := sqDist(query, docs[i], 0)
		if len(heap) < k {
			heap = append(heap, scored{dist: d, index: i})
			siftUp(heap, len(heap)-1, 3, -1)
			continue
		}
		work[3]++
		if d >= heap[0].dist {
			rejected++
			continue
		}
		heap[0] = scored{dist: d, index: i}
		siftDown(heap, 0, 3, -1)
	}
	out := []int{}
	for len(heap) > 0 {
		out = append(out, heap[0].index)
		heap[0] = heap[len(heap)-1]
		heap = heap[:len(heap)-1]
		siftDown(heap, 0, 3, -1)
	}
	for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
		out[i], out[j] = out[j], out[i]
	}
	return out
}

func canonical(indices []int, query []int64, docs [][]int64) string {
	all := []scored{}
	for _, i := range indices {
		var d int64
		for j := 0; j < dim; j++ {
			diff := query[j] - docs[i][j]
			d += diff * diff
		}
		all = append(all, scored{dist: d, index: i})
	}
	sort.Slice(all, func(x, y int) bool {
		if all[x].dist != all[y].dist {
			return all[x].dist < all[y].dist
		}
		return all[x].index < all[y].index
	})
	parts := []string{}
	for _, s := range all {
		parts = append(parts, fmt.Sprintf("%d:%d,", s.dist, s.index))
	}
	return strings.Join(parts, "")
}

// The same linear congruential generator in every language, so the random
// vectors below are the same vectors whichever translation is run.
var seed int64 = 55501001

func randBelow(n int64) int64 {
	seed = (seed*1103515245 + 12345) % 2147483648
	return seed / 65536 % n
}

func twoPlaces(top, bottom int64) string {
	// integer arithmetic on purpose: floating point formats differently in
	// different languages, and this table has to read the same in all of them.
	scaled := top * 100 / bottom
	return fmt.Sprintf("%8d.%02d", scaled/100, scaled%100)
}

func main() {
	fmt.Printf("k = %d neighbours, %d dimensions\\n", k, dim)
	fmt.Println()
	fmt.Println("           n   distances   sort cmps   full heap   top-k heap")
	sizes := []int{1000, 2000, 4000, 8000}
	rows := [][]int64{}
	for _, n := range sizes {
		query := []int64{}
		for i := 0; i < dim; i++ {
			query = append(query, randBelow(1000))
		}
		docs := [][]int64{}
		for d := 0; d < n; d++ {
			v := []int64{}
			for i := 0; i < dim; i++ {
				v = append(v, randBelow(1000))
			}
			docs = append(docs, v)
		}
		for s := 0; s < 4; s++ {
			work[s] = 0
		}
		rejected = 0
		a := bySorting(query, docs)
		b := byFullHeap(query, docs)
		c := byBoundedHeap(query, docs)
		same := canonical(a, query, docs) == canonical(b, query, docs) &&
			canonical(b, query, docs) == canonical(c, query, docs)
		if !same {
			fmt.Printf("  the three disagreed at n = %d\\n", n)
		}
		// each of the three measured every document once, so the distance
		// count is the same n for all three.
		rows = append(rows, []int64{int64(n), work[0] / 3, work[1], work[2], work[3], rejected})
		fmt.Printf("%12d %11d %11d %11d %12d\\n", n, work[0]/3, work[1], work[2], work[3])
	}
	fmt.Println()
	fmt.Println("the same numbers as comparisons per document:")
	fmt.Println()
	fmt.Println("           n   sort cmps   full heap   top-k heap")
	for _, row := range rows {
		fmt.Printf("%12d %s %s %s\\n", row[0], twoPlaces(row[2], row[0]),
			twoPlaces(row[3], row[0]), twoPlaces(row[4], row[0]))
	}
	fmt.Println()
	last := rows[len(rows)-1]
	fmt.Printf("at n = %d the bounded heap threw away %d of %d candidates after a\\n",
		last[0], last[5], last[0])
	fmt.Println("single comparison against the worst neighbour it was already keeping.")
	fmt.Println()
	fmt.Println(strings.Join([]string{
		"All three return the same k neighbours -- that is checked at every",
		"size, and nothing below would mean anything if it were not.",
		"",
		"Read the comparisons-per-document table first. Sorting everything",
		"climbs, 8.69 to 11.71, because it is log n per document and log n",
		"grows. The full heap is flat at about 2.3, because building a heap is",
		"linear and the k pops are lost in the noise. The bounded heap falls",
		"towards 1.00, and that is the number worth remembering: at n = 8000 it",
		"spends 1.04 comparisons per document, because 7924 of the 8000",
		"documents are dismissed by a single comparison against the worst",
		"neighbour it is currently holding. It never sifts, never allocates,",
		"never touches the rest of the heap.",
		"",
		"So keeping only k is not a small constant-factor tweak. It turns the",
		"selection step into roughly one comparison per candidate, which is as",
		"cheap as a scan can be.",
		"",
		"Now read the column that does not move. Distances is exactly n for all",
		"three, at every size, and that is the whole point of the example. The",
		"heap made the bookkeeping nearly free and did nothing whatsoever about",
		"the scanning. Every one of the n documents still had its distance",
		"computed, and in a real system each of those is a dot product over 768",
		"or 1536 dimensions -- not the eight here.",
		"",
		"That is where exact search stops. At a million vectors of 1536",
		"dimensions, one query is about 1.5 billion multiply-adds no matter how",
		"good the heap is, because the algorithm's floor is looking at",
		"everything once. There is no data structure in this track that fixes",
		"that, because fixing it means not looking at everything -- which means",
		"giving up the guarantee that the answer is right. That trade is the",
		"subject of the next three lessons.",
	}, "\\n"))
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "the-bounded-heap",
      heading: "Why the bounded heap is the right structure",
      body: [
        "It is worth being precise about what makes it fast, because the reason is not \"heaps are fast\".",
        "The heap is a **max**-heap of size `k`, so its root is the *worst* of the neighbours currently kept. Every new candidate is compared against that root first. If it is not better, it is discarded \u2014 one comparison, no restructuring. Since almost all candidates are not among the best `k`, almost all candidates cost exactly one comparison, and the measured 1.04 per document is that fact.",
        "Note the direction, because getting it backwards is the classic bug: to keep the `k` *smallest*, you need a **max**-heap, so the thing you can cheaply inspect and evict is the largest of what you kept. A min-heap of size `k` gives you fast access to the best element you already have, which is the one you never want to remove.",
        "It also uses `O(k)` memory rather than `O(n)`, which matters when the candidate stream does not fit in memory \u2014 and streaming is exactly the situation in a real index, where candidates arrive from disk pages or shards.",
      ],
      pitfalls: [
        {
          title: "Using a min-heap to keep the k smallest",
          body: "You need to evict the worst you are holding, so the root must be the worst -- a max-heap. It is a classic bug: it still compiles and still returns k things.",
        },
        {
          title: "Sorting when you only need k",
          body: "The measurement above: 11.71 comparisons per document against 1.04. Same answer, an order of magnitude apart, and the code is barely longer.",
        },
        {
          title: "Taking the square root of the distance",
          body: "Comparing squared distances gives the same ordering and skips n square roots. Only take the root if you have to report the actual distance.",
        },
      ],
    },
    {
      id: "where-it-stops",
      heading: "Where exact search stops",
      body: [
        "The distances column is the whole point of the lesson. It is `n`, for every version, at every size, and no data structure in this track changes it.",
        "In the program above a distance is eight multiplies. In a real system it is 768 or 1536, and `n` is a million or a billion. One query against a million 1536-dimensional vectors is about 1.5 billion multiply-adds \u2014 per query. The heap is irrelevant at that point; the floor is the scanning, and the floor is set by the requirement to look at everything.",
        "An exact algorithm may skip a candidate it can *prove* is farther: a k-d tree does, and so does a pivot with the triangle inequality. Measured on the pivot version over 20,000 points, it cut the distance computations to 11 per query in two dimensions and 661 in eight, with the right answer every time. What kills it is dimension — at 64 and at 768 the same exact pruning still had to measure 19,984 of the 20,000, because almost nothing can be proved far enough away. That is the curse of dimensionality, and it is why exact vector search collapses back into the scan.",
        "So the only way past the floor is to stop guaranteeing the answer.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you find the k nearest vectors to a query?",
      answer:
        "Scan every document computing distance, and keep the best k in a bounded max-heap -- max, so the root is the worst neighbour I am holding and I can evict it. Each candidate is compared against that root first, and if it is not better it is discarded in one comparison. I counted this: at n = 8,000 the bounded heap spends 1.04 comparisons per document, because 7,924 of the 8,000 are dismissed by that single comparison. Sorting everything spends 11.71, and a full heap of all n spends 2.27. Same answer, and the bounded version is also O(k) memory rather than O(n), which matters when candidates stream in from shards.",
    },
    {
      question: "Why does exact nearest-neighbour search not scale?",
      answer:
        "Because the heap optimises the wrong half. In my measurement the distance-computation column is exactly n for all three implementations at every size -- the heap made the selection nearly free and did nothing about the scanning. At a million vectors of 1536 dimensions that is about 1.5 billion multiply-adds per query, and pruning does not save it either: an exact method may skip only what it can prove is farther, and at 768 dimensions a triangle-inequality bound still measured 99.9% of the points. So the only way below that floor is to give up the guarantee, which is what approximate indexes do.",
    },
  ],
  takeaways: [
    "Top-k needs a bounded max-heap: the root is the worst neighbour you kept",
    "Measured 1.04 comparisons per document at n = 8,000 against 11.71 for sorting",
    "7,924 of 8,000 candidates were dismissed by one comparison and nothing else",
    "A min-heap for the k smallest is the classic bug — it still returns k things",
    "Compare squared distances; skip n square roots",
    "The distances column is exactly n for every version at every size",
    "Exact pruning works in low dimensions and prunes almost nothing at 768, so the scan is the floor",
  ],
};
