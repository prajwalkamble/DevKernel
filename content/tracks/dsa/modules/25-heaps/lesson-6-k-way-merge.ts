import type { Lesson } from "@/content/types";

export const kWayMergeLesson: Lesson = {
  id: "dsa-heap-k-way-merge",
  slug: "k-way-merge",
  moduleSlug: "heaps-and-priority-queues",
  title: "K-Way Merge, and Merging More Than Fits",
  summary:
    "Merging two sorted lists needs two cursors. Merging k of them needs a heap of k cursors — and the memory never grows past k, which is what makes it the answer when the inputs do not fit at all.",
  estimatedMinutes: 30,
  objectives: [
    "Merge k sorted sequences with a heap holding one cursor per sequence",
    "Explain why one entry per list is always sufficient",
    "Compare against concatenate-and-sort, including what Timsort does to that comparison",
    "Recognise the pattern as the merge phase of an external sort",
  ],
  sections: [
    {
      id: "one-cursor-each",
      heading: "A heap of cursors, not of values",
      body: [
        "Merging two sorted lists is a classic: walk a cursor along each, take the smaller, advance that one. The comparison is a single `if`.",
        "With k lists the same algorithm needs to find the smallest of k cursor values on every step, which is O(k) by scanning \u2014 so merging k lists of n/k elements each costs O(nk). For k = 1000 that is worse than throwing the order away and re-sorting.",
        "Replace the scan with a heap and each step becomes O(log k). What goes into the heap is not the lists but a cursor into each: the value under the cursor, plus enough information to advance it.",
        "One cursor per list is always enough, and the reason is worth saying out loud: a list is sorted, so its second element cannot be the global minimum while its first is still unclaimed. Holding more would be holding values that cannot be needed yet.",
      ],
      examples: [
        {
          id: "k-way-trace",
          title: "One entry per list, and why that is enough",
          lang: "python",
          code: `import heapq

lists = [
    [1, 4, 9, 15],
    [2, 3, 8],
    [0, 7, 11, 20, 31],
]

# One entry per list: (value, which list, position in it).
heap = [(row[0], i, 0) for i, row in enumerate(lists) if row]
heapq.heapify(heap)

merged = []
print(f"{'take':>5}  {'from list':>9}  {'heap holds':<24} {'merged so far'}")
print("-" * 72)
while heap:
    value, li, pos = heapq.heappop(heap)
    merged.append(value)
    if pos + 1 < len(lists[li]):
        heapq.heappush(heap, (lists[li][pos + 1], li, pos + 1))
    holding = sorted(v for v, _, _ in heap)
    print(f"{value:>5}  {li:>9}  {str(holding):<24} {merged}")

print()
print("merged:", merged)
print(f"the heap never held more than {len(lists)} values — one per list,")
print("because a list's next value cannot be needed until its current one is taken.")`,
          output: ` take  from list  heap holds               merged so far
------------------------------------------------------------------------
    0          2  [1, 2, 7]                [0]
    1          0  [2, 4, 7]                [0, 1]
    2          1  [3, 4, 7]                [0, 1, 2]
    3          1  [4, 7, 8]                [0, 1, 2, 3]
    4          0  [7, 8, 9]                [0, 1, 2, 3, 4]
    7          2  [8, 9, 11]               [0, 1, 2, 3, 4, 7]
    8          1  [9, 11]                  [0, 1, 2, 3, 4, 7, 8]
    9          0  [11, 15]                 [0, 1, 2, 3, 4, 7, 8, 9]
   11          2  [15, 20]                 [0, 1, 2, 3, 4, 7, 8, 9, 11]
   15          0  [20]                     [0, 1, 2, 3, 4, 7, 8, 9, 11, 15]
   20          2  [31]                     [0, 1, 2, 3, 4, 7, 8, 9, 11, 15, 20]
   31          2  []                       [0, 1, 2, 3, 4, 7, 8, 9, 11, 15, 20, 31]

merged: [0, 1, 2, 3, 4, 7, 8, 9, 11, 15, 20, 31]
the heap never held more than 3 values — one per list,
because a list's next value cannot be needed until its current one is taken.`,
          explanation:
            "The heap holds a *cursor* into each list rather than the lists themselves, which is the idea the whole pattern rests on: a list's second value cannot possibly be the next smallest while its first is still unclaimed, so there is never a reason to hold more than one entry per list. Each pop is followed by at most one push from the same list, so the heap stays at exactly k until the lists start running out. The index travels in the tuple because the heap has to know which list to refill from \u2014 in a linked-list version the node itself carries that, and no index is needed.",
        },
      ],
      visual: {
        id: "kway-visual",
        kind: "heap",
        title: "k cursors, one per list",
      },
    },
    {
      id: "against-resorting",
      heading: "Why not concatenate and sort?",
      body: [
        "It is one line, it is correct, and for most inputs it is fine. It also throws away the fact you were given \u2014 that each input is already sorted \u2014 and then pays to rediscover it.",
        "The complexity argument is n log n against n log k, which is a genuine but modest win: about 2.3\u00d7 at a thousand lists, and less below that.",
        "The complexity argument is also weaker than it looks, because the mainstream sorts are adaptive. Timsort in Python and `List.sort` in Java both scan for existing runs and merge them, which means sorting a concatenation of sorted lists is already doing something close to a k-way merge internally, with tighter constants than a hand-written heap.",
        "So if both approaches fit in memory, reach for the library. The heap wins the argument on a different axis entirely.",
      ],
      examples: [
        {
          id: "merge-cost",
          title: "Against throwing the order away",
          lang: "python",
          code: `import heapq
import math

seed = 7


def next_rand():
    global seed
    seed = (seed * 16807) % 2147483647
    return seed


def make_lists(k, per):
    out = []
    for _ in range(k):
        row = sorted(next_rand() % 100_000 for _ in range(per))
        out.append(row)
    return out


def merge_by_heap(lists):
    heap = [(row[0], i, 0) for i, row in enumerate(lists) if row]
    heapq.heapify(heap)
    out = []
    while heap:
        value, li, pos = heapq.heappop(heap)
        out.append(value)
        if pos + 1 < len(lists[li]):
            heapq.heappush(heap, (lists[li][pos + 1], li, pos + 1))
    return out


def merge_by_sorting(lists):
    everything = []
    for row in lists:
        everything.extend(row)
    return sorted(everything)


k, per = 50, 400
lists = make_lists(k, per)
n = k * per
a = merge_by_heap(lists)
b = merge_by_sorting(lists)
print(f"{k} lists of {per} = {n:,} values")
print("both produce the same merged order:", "yes" if a == b else "no")
print()

print(f"{'k':>6} {'n':>10} {'heap: n log2 k':>16} {'sort: n log2 n':>16} {'ratio':>7}")
print("-" * 60)
for k in (4, 50, 1_000):
    n = k * 10_000
    heap_work = n * math.log2(k)
    sort_work = n * math.log2(n)
    print(f"{k:>6} {n:>10,} {heap_work:>16,.0f} {sort_work:>16,.0f} {sort_work / heap_work:>6.1f}x")

print()
print("throwing away the existing order and re-sorting is n log n; the heap")
print("keeps it and pays only n log k. But the honest note is that a library")
print("sort on nearly-sorted runs is very fast — Timsort detects the runs and")
print("merges them, which is the same algorithm with better constants.")`,
          output: `50 lists of 400 = 20,000 values
both produce the same merged order: yes

     k          n   heap: n log2 k   sort: n log2 n   ratio
------------------------------------------------------------
     4     40,000           80,000          611,508    7.6x
    50    500,000        2,821,928        9,465,784    3.4x
  1000 10,000,000       99,657,843      232,534,967    2.3x

throwing away the existing order and re-sorting is n log n; the heap
keeps it and pays only n log k. But the honest note is that a library
sort on nearly-sorted runs is very fast — Timsort detects the runs and
merges them, which is the same algorithm with better constants.`,
          explanation:
            "Concatenating and re-sorting is correct and one line, and it discards the sortedness you were handed. n log n against n log k is the argument for keeping it, and the ratio is real but modest \u2014 2.3\u00d7 at a thousand lists. The caveat is the last paragraph and it matters: Python's Timsort and Java's `List.sort` both detect existing runs and merge them, so `sorted(concatenated)` on already-sorted inputs is closer to O(n log k) in practice than the formula suggests. The heap's decisive advantage is not the exponent; it is the next example.",
        },
      ],
    },
    {
      id: "when-it-does-not-fit",
      heading: "The property that actually decides it",
      body: [
        "Concatenating requires every element to exist at once. The heap requires k.",
        "That single difference is why k-way merge is a named pattern rather than a curiosity. Merging sorted files larger than RAM, merging the per-shard results of a distributed query, merging sorted event streams that never end \u2014 none of them can materialise the concatenation, and all of them can hold k cursors.",
        "It is also the second half of **external merge sort**, the algorithm databases use to sort more data than memory: read as much as fits, sort it, write it out as a run, repeat \u2014 then k-way merge the runs with a heap. The first half is an ordinary sort; the second half is this lesson.",
        "The generalisation is the useful takeaway. *Merge k sorted things* and *the top k of a stream* and *the smallest pair sum across two arrays* are all the same shape: a small heap of frontier candidates, advanced one at a time, where taking one candidate reveals at most one more.",
      ],
      examples: [
        {
          id: "streaming-merge",
          title: "The reason the pattern exists",
          lang: "python",
          code: `import heapq


def stream(values):
    """Stands in for a file, a socket, or a shard — read once, forward only."""
    for v in values:
        yield v


streams = {
    "shard-a": stream([3, 11, 12, 40]),
    "shard-b": stream([1, 2, 30]),
    "shard-c": stream([5, 6, 7, 8]),
}

heap = []
for name, it in streams.items():
    first = next(it, None)
    if first is not None:
        heapq.heappush(heap, (first, name))

print("merging three streams, holding one value from each:")
peak = len(heap)
out = []
while heap:
    value, name = heapq.heappop(heap)
    out.append(value)
    nxt = next(streams[name], None)
    if nxt is not None:
        heapq.heappush(heap, (nxt, name))
    peak = max(peak, len(heap))
    print(f"  took {value:>3} from {name}, heap now holds {len(heap)}")

print()
print("merged:", out)
print(f"peak memory: {peak} values, for {len(out)} values of output.")
print()
print("this is why the heap version matters. Sorting needs every value at once;")
print("this needs one per stream, so the inputs can be larger than memory —")
print("which is exactly what an external merge sort does over disk-backed runs.")`,
          output: `merging three streams, holding one value from each:
  took   1 from shard-b, heap now holds 3
  took   2 from shard-b, heap now holds 3
  took   3 from shard-a, heap now holds 3
  took   5 from shard-c, heap now holds 3
  took   6 from shard-c, heap now holds 3
  took   7 from shard-c, heap now holds 3
  took   8 from shard-c, heap now holds 2
  took  11 from shard-a, heap now holds 2
  took  12 from shard-a, heap now holds 2
  took  30 from shard-b, heap now holds 1
  took  40 from shard-a, heap now holds 0

merged: [1, 2, 3, 5, 6, 7, 8, 11, 12, 30, 40]
peak memory: 3 values, for 11 values of output.

this is why the heap version matters. Sorting needs every value at once;
this needs one per stream, so the inputs can be larger than memory —
which is exactly what an external merge sort does over disk-backed runs.`,
          explanation:
            "Peak memory is k values regardless of how much data flows through, because nothing is ever held except one element per stream. That is what makes this the right answer when the inputs are files, shards, or network responses too large to load \u2014 and it is exactly the merge phase of an external merge sort, which splits input into memory-sized runs, sorts each, writes them out, and then k-way merges the runs back with a heap. The complexity argument in the previous example is a nicety; this is the property that decides the design.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Merge k sorted linked lists.",
      answer:
        "Put the head of each list into a min-heap keyed by value \u2014 k entries. Pop the smallest, append it to the output, and if that node has a next, push the next. Repeat until the heap is empty. Each of the n nodes is pushed and popped exactly once, so it is O(n log k) time and O(k) extra space. The reason one node per list suffices is that a list is sorted, so its second node cannot be the global minimum while its first is unclaimed.",
    },
    {
      question: "Why not just concatenate all k lists and sort?",
      answer:
        "It works and it is O(n log n), and if everything fits in memory it is often faster in practice because Timsort and its relatives detect the existing runs and merge them with better constants than a hand-rolled heap. The heap wins when the data does not fit: it holds k cursors regardless of how much flows through, so it can merge files or shards larger than memory. That is the merge phase of an external merge sort, and it is the case worth naming in an interview because it is the one the concatenation cannot answer.",
    },
    {
      question: "You are given k sorted arrays and asked for the smallest range that includes at least one number from each. How does this help?",
      answer:
        "It is a k-way merge with a window over it. Hold one cursor per array in a min-heap and also track the maximum value currently under any cursor. At each step the range from the heap's root to that maximum contains one element from every array, so record it if it is the smallest so far, then advance the cursor that produced the minimum \u2014 that is the only move that can shrink the range. It is O(n log k), and it works because advancing the minimum is the only advance that can help.",
    },
  ],
  takeaways: [
    "The heap holds one cursor per sequence, not the sequences \u2014 k entries, whatever n is.",
    "One cursor each is sufficient because a sorted list's later elements cannot be needed before its first.",
    "Each pop is followed by at most one push, so the heap stays at k and the total is O(n log k).",
    "Concatenate-and-sort is often faster in memory, because adaptive sorts already detect and merge existing runs.",
    "The heap's real advantage is O(k) memory: it merges inputs that do not fit, which is exactly external merge sort.",
    "Top-k, k-way merge and smallest-range are one pattern: a small heap of frontier candidates, where taking one reveals at most one more.",
  ],
  status: "available",
};
