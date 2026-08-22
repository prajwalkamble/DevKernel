import type { Lesson } from "@/content/types";

export const twoHeapsLesson: Lesson = {
  id: "dsa-heap-two-heaps",
  slug: "the-two-heap-pattern",
  moduleSlug: "heaps-and-priority-queues",
  title: "Two Heaps, and the Running Median",
  summary:
    "Split the data in half and point a heap at each side. The two facing roots are the middle of the collection, which turns a statistic that seems to need sorting into two O(log n) operations.",
  estimatedMinutes: 35,
  objectives: [
    "Arrange a max-heap and a min-heap so their roots straddle the median",
    "State the two invariants separately, and maintain each one",
    "Read the median for both odd and even counts",
    "Say why a sorted list is O(n²) here despite an O(1) median",
  ],
  sections: [
    {
      id: "facing-roots",
      heading: "Two heaps, pointed at each other",
      body: [
        "The median is the middle of a collection, and the obvious way to find the middle is to sort \u2014 which is O(n log n) every time a value arrives, and hopeless for a running answer.",
        "The trick is to notice how little of the ordering the median actually needs. It needs the largest element of the bottom half and the smallest element of the top half, and nothing else. Every other relationship in the data is irrelevant.",
        "So keep the bottom half in a **max-heap** and the top half in a **min-heap**. Each root is exactly one of the two values the median is made of. The halves themselves stay unordered, which is precisely why maintaining them is cheap.",
        "With an odd count, let one heap hold the extra element and the median is that heap's root. With an even count the heaps are equal and the median is the average of the two roots.",
      ],
      examples: [
        {
          id: "two-heaps-trace",
          title: "Two halves, facing each other",
          lang: "python",
          code: `import heapq

low = []      # max-heap of the smaller half, negated
high = []     # min-heap of the larger half


def add(v):
    # Always enter through \`low\`, then push its top across. That single
    # ordering is what guarantees every value in \`low\` <= every value in \`high\`.
    heapq.heappush(low, -v)
    heapq.heappush(high, -heapq.heappop(low))
    # \`low\` is allowed to be one larger, and never smaller.
    if len(high) > len(low):
        heapq.heappush(low, -heapq.heappop(high))


def median():
    if len(low) > len(high):
        return float(-low[0])
    return (-low[0] + high[0]) / 2


print(f"{'add':>5}  {'low (max-heap)':<22} {'high (min-heap)':<18} {'median':>8}")
print("-" * 58)
for v in (6, 10, 2, 6, 5, 0, 6, 3):
    add(v)
    lo = sorted((-x for x in low), reverse=True)
    hi = sorted(high)
    print(f"{v:>5}  {str(lo):<22} {str(hi):<18} {median():>8}")

print()
print("neither half is sorted internally — only the two facing ends are known,")
print("and those two are the only values the median ever needs.")`,
          output: `  add  low (max-heap)         high (min-heap)      median
----------------------------------------------------------
    6  [6]                    []                      6.0
   10  [6]                    [10]                    8.0
    2  [6, 2]                 [10]                    6.0
    6  [6, 2]                 [6, 10]                 6.0
    5  [6, 5, 2]              [6, 10]                 6.0
    0  [5, 2, 0]              [6, 6, 10]              5.5
    6  [6, 5, 2, 0]           [6, 6, 10]              6.0
    3  [5, 3, 2, 0]           [6, 6, 6, 10]           5.5

neither half is sorted internally — only the two facing ends are known,
and those two are the only values the median ever needs.`,
          explanation:
            "The two heaps are turned back to back: the smaller half is a max-heap so its root is the *largest* of the small values, and the larger half is a min-heap so its root is the *smallest* of the large ones. Those two roots are the two elements adjacent to the middle, which is all a median ever needs. Watch the trace and notice what is not there \u2014 at no point is either half sorted, and at no point does anything look at an element that is not a root.",
        },
      ],
      visual: {
        id: "median-visual",
        kind: "heap",
        title: "The root of each half, facing the middle",
      },
    },
    {
      id: "the-invariants",
      heading: "Two invariants, and only one of them is obvious",
      body: [
        "Everything in `low` must be less than or equal to everything in `high`. And the two sizes must never differ by more than one.",
        "The first is maintained by *how a value enters*. The version that cannot go wrong pushes every arrival into `low` and immediately moves `low`'s root into `high` \u2014 no comparison, no branch, and the ordering falls out. The version that compares against `low`'s root first does two fewer heap operations and has to handle the empty-heap case, which is where the bug lives.",
        "The second is maintained by an explicit fix afterwards, and it is the one people leave out because nothing appears to break immediately. It does break: the halves drift, and the facing roots stop being the middle of anything. Choose a convention \u2014 `low` may hold the extra, never `high` \u2014 and write the fix in both directions.",
        "Deletion, if the problem needs it, is where this pattern gets expensive. Removing an arbitrary value from a heap is O(n), so a *sliding window* median needs lazy deletion on top of all this, plus the size bookkeeping to account for entries that are still in a heap but no longer in the window.",
      ],
      examples: [
        {
          id: "rebalance",
          title: "The rebalancing, and what happens without it",
          lang: "python",
          code: `import heapq

# The rebalance rule is easy to get subtly wrong. This is the version that
# tests the value against a boundary instead of routing everything through
# one heap -- both work, but only if the empty case is handled.
low, high = [], []


def add_by_comparison(v):
    if not low or v <= -low[0]:
        heapq.heappush(low, -v)
    else:
        heapq.heappush(high, v)
    # sizes can now be off by two, so fix in whichever direction is wrong
    if len(low) > len(high) + 1:
        heapq.heappush(high, -heapq.heappop(low))
    elif len(high) > len(low):
        heapq.heappush(low, -heapq.heappop(high))


def invariant_holds():
    return not low or not high or -low[0] <= high[0]


def sizes_ok():
    return len(low) - len(high) in (0, 1)


values = [6, 10, 2, 6, 5, 0, 6, 3, 9, 1]
for v in values:
    add_by_comparison(v)
    if not invariant_holds() or not sizes_ok():
        print(f"broken after adding {v}")
        break
else:
    print(f"invariant held for all {len(values)} insertions")

print(f"  low has {len(low)}, high has {len(high)}")
print(f"  largest of the small half: {-low[0]}")
print(f"  smallest of the large half: {high[0]}")
print()

print("what breaks if the size fix is skipped entirely:")
low2, high2 = [], []
for v in values:
    if not low2 or v <= -low2[0]:
        heapq.heappush(low2, -v)
    else:
        heapq.heappush(high2, v)
print(f"  low has {len(low2)}, high has {len(high2)} — the halves are not halves,")
print("  so the two facing roots are no longer the middle of anything.")`,
          output: `invariant held for all 10 insertions
  low has 5, high has 5
  largest of the small half: 5
  smallest of the large half: 6

what breaks if the size fix is skipped entirely:
  low has 8, high has 2 — the halves are not halves,
  so the two facing roots are no longer the middle of anything.`,
          explanation:
            "Two routings work. Pushing everything into `low` and immediately shifting its top into `high` needs no comparison and cannot get the ordering wrong; comparing against `low`'s root first saves a pair of operations but has to handle the empty heap, which is the case people forget. Either way the size fix is not optional: without it the two heaps drift apart, and once they are 8 and 2 their facing roots are the 8th and 9th smallest rather than the middle. The invariant is worth stating as two separate claims \u2014 every value in `low` is \u2264 every value in `high`, and the sizes differ by at most one \u2014 because the code that maintains each is different and only the second one is easy to skip.",
        },
      ],
    },
    {
      id: "the-alternative",
      heading: "Why not just keep it sorted?",
      body: [
        "A sorted list answers the median in O(1) \u2014 better than the heaps, which need two root reads and a branch. The cost is on the way in.",
        "Finding where a new value belongs is a binary search, O(log n). Putting it there is not: every element after the insertion point shifts up one place, which is O(n) of memory movement. Over n insertions that is O(n\u00b2), and the O(log n) search that people quote is the cheap half of an expensive operation.",
        "This is the general shape of the two-heap pattern's argument, and it recurs: **when a problem asks for a running statistic, ask which comparisons the statistic actually depends on.** If it is only a boundary between two groups, two heaps will maintain that boundary for O(log n) per update, and everything else can stay unordered.",
      ],
      examples: [
        {
          id: "against-sorting",
          title: "Against keeping one sorted list",
          lang: "python",
          code: `import bisect
import heapq
import math

seed = 7


def next_rand():
    global seed
    seed = (seed * 16807) % 2147483647
    return seed


def by_two_heaps(values):
    low, high = [], []
    out = []
    for v in values:
        heapq.heappush(low, -v)
        heapq.heappush(high, -heapq.heappop(low))
        if len(high) > len(low):
            heapq.heappush(low, -heapq.heappop(high))
        out.append(float(-low[0]) if len(low) > len(high) else (-low[0] + high[0]) / 2)
    return out


def by_sorted_list(values):
    """Keep one sorted list. The search is O(log n); the insert is O(n)."""
    seen = []
    out = []
    for v in values:
        bisect.insort(seen, v)
        n = len(seen)
        out.append(float(seen[n // 2]) if n % 2 else (seen[n // 2 - 1] + seen[n // 2]) / 2)
    return out


data = [next_rand() % 1000 for _ in range(5_000)]
a = by_two_heaps(data)
b = by_sorted_list(data)
print("both agree on all 5,000 running medians:", "yes" if a == b else "no")
print("first ten:", " ".join(f"{m:.1f}" for m in a[:10]))
print()

print(f"{'n':>9} {'two heaps: n log n':>20} {'sorted list: n^2/2':>20}")
print("-" * 52)
for n in (1_000, 100_000, 1_000_000):
    print(f"{n:>9} {n * math.log2(n):>20,.0f} {n * n / 2:>20,.0f}")

print()
print("the sorted list finds the position in O(log n) and then moves memory")
print("to make room, which is the O(n) nobody counts. It wins at small n on")
print("constants alone, and loses to the heaps well before n is interesting.")`,
          output: `both agree on all 5,000 running medians: yes
first ten: 649.0 696.0 649.0 657.0 649.0 609.0 649.0 609.0 649.0 609.0

        n   two heaps: n log n   sorted list: n^2/2
----------------------------------------------------
     1000                9,966              500,000
   100000            1,660,964        5,000,000,000
  1000000           19,931,569      500,000,000,000

the sorted list finds the position in O(log n) and then moves memory
to make room, which is the O(n) nobody counts. It wins at small n on
constants alone, and loses to the heaps well before n is interesting.`,
          explanation:
            "A sorted list gives the median in O(1) and is the obvious alternative, so it is worth being precise about why it loses. `bisect` finds the insertion point in O(log n), and then the insert itself shifts every element after it \u2014 O(n) of memcpy that the complexity of the search hides. That makes the whole run O(n\u00b2), against O(n log n) for the heaps. For a few thousand elements the sorted list often wins anyway, because moving contiguous memory is fast and heap operations jump around; the crossover arrives earlier than most people guess, and the asymptotic answer is the one to give in an interview.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Design a data structure that returns the median of a growing stream.",
      answer:
        "Two heaps: a max-heap for the smaller half and a min-heap for the larger, with the invariant that everything in the first is \u2264 everything in the second, and the sizes differ by at most one. To add, push into the max-heap, pop its root into the min-heap, and if the min-heap is now the larger, pop its root back. To read, take the root of the larger heap for an odd count, or average the two roots for an even one. Insertion is O(log n), the median is O(1), and neither half is ever sorted.",
    },
    {
      question: "Why a max-heap for the small half rather than a min-heap?",
      answer:
        "Because the median depends on the *largest* element of the small half, and a heap only ever surfaces one element cheaply \u2014 its root. A min-heap of the small half would surface the smallest value in the collection, which the median never needs, and finding the largest would cost O(n). The two heaps are deliberately pointed at each other so that the two elements adjacent to the middle are the two roots.",
    },
    {
      question: "Now the median is over a sliding window of the last k values. What changes?",
      answer:
        "Values now leave as well as arrive, and a heap cannot remove an arbitrary element in better than O(n). The standard fix is lazy deletion: keep a map of values that have expired, discard them when they surface at a root, and track the *effective* sizes separately from the actual heap sizes so the rebalancing still works. The alternative in languages that have one is an ordered multiset with an iterator held at the middle, which makes the removal O(log k) directly.",
    },
  ],
  takeaways: [
    "The median needs two elements: the largest below it and the smallest above. A heap surfaces exactly one element cheaply, so use two.",
    "Max-heap for the small half, min-heap for the large half \u2014 the roots face each other across the middle.",
    "Two invariants, maintained separately: the ordering between halves, and the sizes differing by at most one.",
    "Route every arrival through one heap and shift across; it costs two extra operations and removes the empty-heap branch.",
    "A sorted list gives an O(1) median and an O(n) insert, which is O(n\u00b2) overall \u2014 the binary search is the cheap half.",
    "Sliding-window medians need lazy deletion on top, because removing an arbitrary value from a heap is O(n).",
  ],
  status: "available",
};
