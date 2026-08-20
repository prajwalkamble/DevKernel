import type { Lesson } from "@/content/types";

export const insideOtherAlgorithmsLesson: Lesson = {
  id: "dsa-bs-inside",
  slug: "binary-search-inside-other-algorithms",
  moduleSlug: "binary-search",
  title: "Binary Search Inside Other Algorithms",
  summary:
    "The technique rarely appears alone in a hard problem. It appears as the inner step that drops an O(n²) algorithm to O(n log n) — and the canonical example is longest increasing subsequence.",
  estimatedMinutes: 35,
  objectives: [
    "Recognise binary search as an accelerator rather than a whole solution",
    "Derive the O(n log n) LIS algorithm and explain what its array holds",
    "Say why the maintained array is sorted, and why that is what makes it work",
    "Switch between strictly increasing and non-decreasing correctly",
  ],
  sections: [
    {
      id: "as-a-step",
      heading: "The inner loop that did not have to be linear",
      body: [
        "A great many O(n²) algorithms have the same shape: for each element, scan everything before it looking for something. If the thing being scanned is **kept sorted**, that inner scan is a binary search, and the whole algorithm drops to O(n log n).",
        "That is the entire idea. What makes each instance interesting is finding the thing to keep sorted — it is rarely the input.",
      ],
    },
    {
      id: "lis",
      heading: "Longest increasing subsequence",
      body: [
        "The O(n²) version is the obvious dynamic program: `best[i]` is the longest increasing subsequence ending at `i`, computed by scanning every earlier `j`. Simple and quadratic.",
        "The fast version keeps a different array. **`tails[k]` is the smallest value that can end an increasing subsequence of length `k + 1`.** That array is *automatically sorted* — a longer subsequence must end on something at least as large — which is what admits a binary search.",
      ],
      examples: [
        {
          id: "lis",
          title: "LIS in O(n log n), traced",
          lang: "python",
          code: `from bisect import bisect_left, bisect_right

def lis_length(a, trace=False):
    """Longest strictly increasing subsequence, O(n log n).

    \`tails[k]\` is the smallest possible tail of an increasing subsequence of
    length k+1. It is sorted, which is what lets binary search find the slot.
    """
    tails = []
    for v in a:
        i = bisect_left(tails, v)
        if i == len(tails):
            tails.append(v)
        else:
            tails[i] = v
        if trace:
            print(f"  saw {v:3} -> tails {tails}")
    return len(tails)

a = [10, 9, 2, 5, 3, 7, 101, 18]
print("input:", a)
print("trace:")
n = lis_length(a, trace=True)
print("LIS length:", n)

print("\\nnote: tails is NOT the subsequence itself —")
print("it is only ever the same *length* as one.")

# non-decreasing needs bisect_right instead
def lis_non_decreasing(a):
    tails = []
    for v in a:
        i = bisect_right(tails, v)
        if i == len(tails):
            tails.append(v)
        else:
            tails[i] = v
    return len(tails)

b = [2, 2, 2, 3, 3]
print(f"\\n{b}: strict={lis_length(b)}  non-decreasing={lis_non_decreasing(b)}")

# the O(n^2) version, for comparison on a small input
def lis_quadratic(a):
    if not a:
        return 0
    best = [1] * len(a)
    for i in range(len(a)):
        for j in range(i):
            if a[j] < a[i]:
                best[i] = max(best[i], best[j] + 1)
    return max(best)

import random
random.seed(7)
c = [random.randint(0, 1000) for _ in range(400)]
print("\\nboth agree on 400 random values:", lis_length(c) == lis_quadratic(c),
      "->", lis_length(c))`,
          output: `input: [10, 9, 2, 5, 3, 7, 101, 18]
trace:
  saw  10 -> tails [10]
  saw   9 -> tails [9]
  saw   2 -> tails [2]
  saw   5 -> tails [2, 5]
  saw   3 -> tails [2, 3]
  saw   7 -> tails [2, 3, 7]
  saw 101 -> tails [2, 3, 7, 101]
  saw  18 -> tails [2, 3, 7, 18]
LIS length: 4

note: tails is NOT the subsequence itself —
it is only ever the same *length* as one.

[2, 2, 2, 3, 3]: strict=2  non-decreasing=5

both agree on 400 random values: True -> 39`,
          explanation:
            "Follow the trace. Seeing `3` when `tails` is `[2, 5]` replaces the 5: there is still a length-2 subsequence, but now it ends on 3 rather than 5, which leaves more room for whatever comes next. **Replacing never changes the length; appending is the only thing that grows it.**\n\nThe warning in the middle matters. The final `tails` is `[2, 3, 7, 18]`, which is *not* an increasing subsequence of the input — 18 comes after 101, and the actual LIS is `[2, 3, 7, 101]` or `[2, 3, 7, 18]`. `tails` is only guaranteed to have the right *length*. Reconstructing the subsequence itself needs a parallel array of predecessor indices.\n\nStrict versus non-decreasing is one function call. `bisect_left` finds the first slot `>= v` and so overwrites an equal value, forbidding repeats. `bisect_right` skips past equals and appends, allowing them. `[2, 2, 2, 3, 3]` gives 2 and 5 respectively — a difference no amount of testing on distinct values would reveal.",
        },
      ],
    },
    {
      id: "others",
      heading: "The same move elsewhere",
      body: [
        "**Two-sum on a sorted array.** For each element, binary search for its complement — O(n log n), and the two-pointer version in the next module does it in O(n).",
        "**Counting pairs below a threshold.** Sort, then for each element `lower_bound` the largest partner that still fits, and add the count. The whole family of \"how many pairs satisfy…\" problems is this.",
        "**Merging intervals against a query set.** Sort the intervals by start, then binary search for the first interval that could overlap each query.",
        "**Any DP whose transition scans a sorted state.** Job scheduling with weights — sort jobs by end time, and binary search for the last job that does not conflict.",
        "The recognition cue is a nested loop where the inner one is looking for a boundary in something ordered, or something you could order without breaking the problem.",
      ],
      pitfalls: [
        {
          title: "Sorting may destroy the problem",
          body: "The LIS array is *not* sorted, and must not be — the order is the problem. Before sorting to enable a binary search, check that order does not carry meaning. This is the difference between \"count pairs with a small difference\", where sorting is free, and \"count inversions\", where sorting is the thing being measured.",
        },
        {
          title: "`bisect_left` against `bisect_right` is not a stylistic choice",
          body: "It decides whether equal elements are allowed, and the two answers can differ by the whole length of the array. Decide from the problem statement's wording — \"increasing\" is strict, \"non-decreasing\" and \"increasing or equal\" are not.",
        },
      ],
    },
  ],
  takeaways: [
    "Binary search usually appears as the inner step of a larger algorithm",
    "Any O(n²) scan over something you can keep sorted becomes O(n log n)",
    "LIS keeps `tails[k]` = smallest tail of a length-(k+1) subsequence",
    "That array is sorted automatically, which is what admits the search",
    "Replacing keeps the length; appending is what grows it",
    "`tails` has the right length but is not itself the subsequence",
    "`bisect_left` for strictly increasing, `bisect_right` for non-decreasing",
  ],
  status: "available",
};
