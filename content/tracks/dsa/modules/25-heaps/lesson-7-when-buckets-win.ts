import type { Lesson } from "@/content/types";

export const bucketsLesson: Lesson = {
  id: "dsa-heap-buckets",
  slug: "when-counting-beats-the-heap",
  moduleSlug: "heaps-and-priority-queues",
  title: "When Counting Beats the Heap Outright",
  summary:
    "A heap is a comparison structure, and comparison has a log in it. When the key is a small integer you can index instead of compare, and the log disappears — which is why the canonical top-k-frequent problem is not really a heap problem.",
  estimatedMinutes: 30,
  objectives: [
    "Recognise when a key can be used as an array index rather than compared",
    "Solve top-k-frequent in O(n) with counting and buckets",
    "State the O(n + range) cost and the two ways it goes wrong",
    "Choose between sorting, a heap and buckets on the properties of the key",
  ],
  sections: [
    {
      id: "the-log-is-optional",
      heading: "The log comes from comparing",
      body: [
        "Every bound in this module so far has a log in it, and the log has one source: a comparison-based structure can only learn about an element by comparing it with another, and information-theoretically that costs log.",
        "Counting sidesteps the whole argument. If a key is a non-negative integer smaller than some manageable bound, you can use it as an *index* \u2014 and an index is O(1) and learns everything at once. No comparison happens, so no log appears.",
        "The classic case is **top k frequent**. It is taught as a heap problem, and it should not be: the thing being ranked is a count, a count cannot exceed the number of items, so counts index an array of size n + 1. Bucket every key under its count, walk down from the top bucket, stop after k. Linear, and no heap.",
        "Recognising this is a habit worth building. When a problem ranks things by a bounded integer \u2014 a count, an age, a score out of 100, a priority from a fixed small set \u2014 reach for an array before reaching for a heap.",
      ],
      examples: [
        {
          id: "top-k-frequent",
          title: "The same answer with no comparisons",
          lang: "python",
          code: `import heapq
from collections import Counter

words = ["the", "cat", "sat", "on", "the", "mat", "the", "cat", "ran",
         "the", "dog", "sat", "the", "cat"]
k = 3

counts = Counter(words)
print("counts:", " ".join(f"{w}={c}" for w, c in sorted(counts.items())))
print()

heap = []
for word, c in sorted(counts.items()):
    heapq.heappush(heap, (c, word))
    if len(heap) > k:
        heapq.heappop(heap)
by_heap = sorted(heap, reverse=True)
print("by heap, O(m log k) over m distinct words:")
for c, w in by_heap:
    print(f"  {w:<5} {c}")

print()
buckets = [[] for _ in range(len(words) + 1)]
for word, c in sorted(counts.items()):
    buckets[c].append(word)
by_bucket = []
for c in range(len(buckets) - 1, 0, -1):
    for w in buckets[c]:
        by_bucket.append((c, w))
        if len(by_bucket) == k:
            break
    if len(by_bucket) == k:
        break
print("by buckets, O(n) with no comparisons at all:")
for c, w in by_bucket:
    print(f"  {w:<5} {c}")

print()
print("same answer:", "yes" if by_heap == by_bucket else "no")
print("(the top three counts here are distinct. Were two of them tied, both")
print(" answers would still be correct and they would not have to match —")
print(" a tiebreak has to go into the key if the caller needs a fixed order.)")
print()
print("a count is bounded by n, so it can index an array. Bucketing by count")
print("and walking down from the top is linear — and there is no log anywhere.")`,
          output: `counts: cat=3 dog=1 mat=1 on=1 ran=1 sat=2 the=5

by heap, O(m log k) over m distinct words:
  the   5
  cat   3
  sat   2

by buckets, O(n) with no comparisons at all:
  the   5
  cat   3
  sat   2

same answer: yes
(the top three counts here are distinct. Were two of them tied, both
 answers would still be correct and they would not have to match —
 a tiebreak has to go into the key if the caller needs a fixed order.)

a count is bounded by n, so it can index an array. Bucketing by count
and walking down from the top is linear — and there is no log anywhere.`,
          explanation:
            "The heap version is the one everybody writes, and it is O(m log k) over the m distinct keys. The bucket version notices something the heap cannot use: a count is bounded by the number of items, so it is a valid array index. Bucketing keys by their count and walking down from the highest bucket is O(n), with no comparisons and no log. The parenthetical about ties is not a footnote \u2014 with a tie at the k-th place both methods are correct and they need not agree, so a caller who requires a fixed order has to put the tiebreak in the key.",
        },
      ],
    },
    {
      id: "what-it-costs",
      heading: "O(n + range), and both terms matter",
      body: [
        "The cost of bucketing is the number of items plus the number of buckets, and the second term is the one that decides whether this is brilliant or absurd.",
        "**When the range is comparable to n** \u2014 counts, ages, small scores \u2014 the total is linear and nothing beats it.",
        "**When the range is enormous** the buckets dominate: sorting a million 32-bit integers by bucketing needs four billion buckets to save a factor of 20 in comparisons. Radix sort is the repair \u2014 bucket by one digit at a time so the range per pass is 10 or 256, at the cost of several passes.",
        "**When the key is not an integer at all** \u2014 a float, a string ordering, a user-supplied comparator \u2014 there is no index to compute and the technique simply does not apply.",
        "This is also the honest boundary of the trick. Counting sort, bucket sort and radix sort are not general-purpose sorts that the textbooks unfairly ignore; they are specialised tools with a precondition, and the precondition is the first thing to check.",
      ],
      examples: [
        {
          id: "range-decides",
          title: "The range of the key, not the size of the input",
          lang: "python",
          code: `import math

print("the choice is about the range of the key, not the size of the input")
print()
print(f"{'key range':>26} {'buckets cost':>14} {'heap cost':>18} {'pick'}")
print("-" * 74)
n = 1_000_000
k = 10
for label, spread in [
    ("counts in a 1e6 stream", 1_000_000),
    ("ages, 0-120", 120),
    ("scores, 0-100", 100),
    ("32-bit ids", 2 ** 32),
    ("float distances", 0),
]:
    heap_cost = n * math.log2(k)
    if spread == 0:
        print(f"{label:>26} {'not possible':>14} {heap_cost:>18,.0f} heap")
        continue
    bucket_cost = n + spread
    pick = "buckets" if bucket_cost < heap_cost else "heap"
    print(f"{label:>26} {bucket_cost:>14,} {heap_cost:>18,.0f} {pick}")

print()
print("buckets cost O(n + range). That is linear when the range is comparable")
print("to n, and catastrophic when it is not — 4 billion buckets to sort a")
print("million ids, and no buckets at all for a key that is not an integer.")`,
          output: `the choice is about the range of the key, not the size of the input

                 key range   buckets cost          heap cost pick
--------------------------------------------------------------------------
    counts in a 1e6 stream      2,000,000          3,321,928 buckets
               ages, 0-120      1,000,120          3,321,928 buckets
             scores, 0-100      1,000,100          3,321,928 buckets
                32-bit ids  4,295,967,296          3,321,928 heap
           float distances   not possible          3,321,928 heap

buckets cost O(n + range). That is linear when the range is comparable
to n, and catastrophic when it is not — 4 billion buckets to sort a
million ids, and no buckets at all for a key that is not an integer.`,
          explanation:
            "Bucketing costs O(n + range) and that second term is the whole story. When the range is comparable to n \u2014 counts, ages, percentage scores, small enumerations \u2014 it is linear and beats anything comparison-based. When the range is 2\u00b3\u00b2 it is four billion buckets to sort a million values, and when the key is a float or an arbitrary object there is no bucket index at all. The mistake worth avoiding is reading *O(n) beats O(n log k)* off the page without checking which n the first one means.",
        },
      ],
    },
    {
      id: "choosing",
      heading: "Sort, heap, or buckets",
      body: [
        "Three tools answer the same question and the choice is nearly mechanical.",
        "**Sort** when clarity matters more than the constant factor, when k is close to n, or when you need the full ordering anyway. It is one line and it is rarely the bottleneck.",
        "**Heap** when k is small relative to n, when the data arrives as a stream, or when it does not fit in memory. It is also the only one of the three that gives a *running* answer.",
        "**Buckets** when the ranking key is a bounded non-negative integer. Then it is linear, and the only reason not to use it is that the bound turns out not to be small.",
        "The generality runs the opposite way to the speed, which is the thing to hold on to: the fastest option is the one that assumes the most, so the assumption is what you check first.",
      ],
      examples: [
        {
          id: "three-answers",
          title: "Three answers, one condition",
          lang: "python",
          code: `import heapq

# Same question, three answers, on a deliberately small case so the
# whole thing can be checked by eye.
scores = [88, 91, 88, 70, 91, 91, 55, 70, 88, 91]
k = 2

def show(pairs):
    return " ".join(f"{v}x{c}" for v, c in pairs)


print("scores:", " ".join(str(s) for s in scores))
print(f"the {k} most common:")
print()

counts = {}
for s in scores:
    counts[s] = counts.get(s, 0) + 1
pairs = sorted(counts.items())

full_sort = sorted(pairs, key=lambda p: -p[1])[:k]
print("  sort by count       ", show(full_sort), "  O(m log m)")

heap = []
for value, c in pairs:
    heapq.heappush(heap, (c, value))
    if len(heap) > k:
        heapq.heappop(heap)
by_heap = [(v, c) for c, v in sorted(heap, reverse=True)]
print("  heap capped at k    ", show(by_heap), "  O(m log k)")

buckets = [[] for _ in range(len(scores) + 1)]
for value, c in pairs:
    buckets[c].append(value)
by_bucket = []
for c in range(len(buckets) - 1, 0, -1):
    for v in buckets[c]:
        by_bucket.append((v, c))
print("  buckets by count    ", show(by_bucket[:k]), "  O(n)")

print()
print("all three agree. The bucket version is the fastest and the least")
print("general: it needs the key to be a small non-negative integer, and")
print("here it is, because a count cannot exceed the number of items.")
print()
print("that condition is the whole decision. When it holds, buckets win")
print("outright. When it does not — real numbers, huge ranges, keys that")
print("are only comparable — the heap is what is left.")`,
          output: `scores: 88 91 88 70 91 91 55 70 88 91
the 2 most common:

  sort by count        91x4 88x3   O(m log m)
  heap capped at k     91x4 88x3   O(m log k)
  buckets by count     91x4 88x3   O(n)

all three agree. The bucket version is the fastest and the least
general: it needs the key to be a small non-negative integer, and
here it is, because a count cannot exceed the number of items.

that condition is the whole decision. When it holds, buckets win
outright. When it does not — real numbers, huge ranges, keys that
are only comparable — the heap is what is left.`,
          explanation:
            "All three are correct, and the ordering by speed is the reverse of the ordering by generality. Sorting works on anything comparable. The heap works on anything comparable and saves work when k is small. Buckets need the key to be a small non-negative integer, and when that holds they win outright \u2014 which is exactly why *top k frequent* is a bucket problem rather than a heap problem, even though it is nearly always taught as the latter.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Find the k most frequent elements in an array.",
      answer:
        "Count with a hash map, then bucket by count: an array of n + 1 lists, where bucket i holds every key seen exactly i times. Walk down from the highest bucket collecting keys until you have k. That is O(n) \u2014 counting is linear, bucketing is linear, and the walk visits each bucket once. The heap answer, keeping a min-heap of size k over the distinct keys, is O(m log k) and is what most people give; the bucket answer is better and the reason is that a count is bounded by n, so it can be an index rather than something to compare.",
    },
    {
      question: "When would you not use counting or bucket sort?",
      answer:
        "When the range of the key is large relative to n, or when the key is not a bounded non-negative integer at all. Bucketing is O(n + range), so sorting a million 32-bit integers this way needs four billion buckets \u2014 radix sort exists precisely to fix that by bucketing one digit at a time. Floats, strings under a locale-aware collation, and anything with only a user-supplied comparator have no index to compute, so the technique does not apply and a comparison sort or a heap is what is left.",
    },
    {
      question: "Why does a heap have a log in it at all?",
      answer:
        "Because it only ever learns about elements by comparing them, and a comparison yields one bit. Sorting n items by comparison needs log(n!) \u2248 n log n bits of information, and the same argument bounds anything comparison-based from below. Counting escapes it by not comparing: using the key as an index extracts its full value in one step. That is why the O(n) results in this area all require a key you can index by, and why they are not counterexamples to the sorting lower bound.",
    },
  ],
  takeaways: [
    "The log in every heap bound comes from comparing; indexing does not compare, so it has no log.",
    "A count is bounded by n, which makes it a valid array index \u2014 this is why top-k-frequent is O(n), not O(n log k).",
    "Bucketing costs O(n + range). Check the second term before celebrating the first.",
    "Radix sort is the repair for a large range: bucket one digit at a time, several passes, small range each pass.",
    "Speed and generality run in opposite directions here \u2014 the fastest option assumes the most, so check the assumption first.",
    "With a tie at the k-th place, two correct answers need not match; put the tiebreak in the key if the caller cares.",
  ],
  status: "available",
};
