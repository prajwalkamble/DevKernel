import type { Lesson } from "@/content/types";

export const prefixSheetLesson: Lesson = {
  id: "dsa-ps-sheet",
  slug: "the-prefix-sum-sheet",
  moduleSlug: "prefix-sums-and-range-queries",
  title: "The Sheet: Prefix Problems",
  summary:
    "Four shapes and twelve problems, ordered so each one earns the next. Plus the two lines to write before anything else, which between them prevent most of the bugs in this module.",
  estimatedMinutes: 25,
  objectives: [
    "Classify a problem into one of the four prefix shapes",
    "Work the sheet in a building order",
    "Write the two setup lines that prevent most bugs",
    "State the complexity before coding",
  ],
  sections: [
    {
      id: "four-shapes",
      heading: "The four shapes",
      body: [
        "**1. Static range queries.** Build once, subtract per query. Signal: many queries on an array that does not change.",
        "**2. Prefix plus a hash map.** Signal: *count* or *find* subarrays with an exact property — a sum, a XOR, a remainder, a balance.",
        "**3. Difference array.** Signal: many range *updates*, one read at the end. Or maximum overlapping intervals.",
        "**4. Two-dimensional.** Signal: submatrix sums, or a 2D problem that collapses to a 1D one by fixing two boundaries.",
      ],
    },
    {
      id: "the-sheet",
      heading: "The sheet, in order",
      body: [
        "**Shape 1.** *Range Sum Query — Immutable* (303) for the convention. *Running Sum of 1d Array* (1480). *Find Pivot Index* (724), which is prefix and suffix at once. *Product of Array Except Self* (238) — the prefix-and-suffix version that never divides; do this one properly, it is asked constantly.",
        "**Shape 2 — the important one.** *Subarray Sum Equals K* (560). *Contiguous Array* (525), which is 560 after mapping 0 to −1. *Subarray Sums Divisible by K* (974), which keys on the remainder — watch the negative modulus. *Continuous Subarray Sum* (523). *Maximum Size Subarray Sum Equals k* (325) for the earliest-index variant.",
        "**Shape 3.** *Range Addition* (370), the bare form. *Corporate Flight Bookings* (1109). *Car Pooling* (1094). *Meeting Rooms II* (253), which is the same sweep wearing different words.",
        "**Shape 4.** *Range Sum Query 2D — Immutable* (304). *Matrix Block Sum* (1314). *Max Sum of Rectangle No Larger Than K* (363), which is the fix-two-rows collapse and is hard — leave it until Kadane's is comfortable.",
      ],
    },
    {
      id: "two-lines",
      heading: "The two lines to write first",
      body: [
        "Before the loop, every time:",
        "**`prefix = [0] * (n + 1)`** — or `seen = {0: 1}` for the hash-map shape. The zero entry is the single most commonly forgotten line in this module and its absence gives a nearly-right answer.",
        "**A comment stating the convention.** \"`prefix[i]` = sum of first i elements, so `sum(a[lo:hi]) = prefix[hi] - prefix[lo]`.\" Writing it down once stops you re-deriving it wrongly at the third query.",
        "Then state the complexity: O(n) build, O(1) query, or O(n) total for the single-pass hash-map shape.",
      ],
      pitfalls: [
        {
          title: "The negative modulus",
          body: "`-7 % 5` is `-2` in Java, C++ and Go, and `3` in Python. Every divisible-by-k problem needs `((r % k) + k) % k` outside Python. It is the most common wrong-answer in shape 2 and it only shows up on inputs with negative numbers.",
        },
        {
          title: "64-bit sums",
          body: "The whole-array sum is the largest prefix. For 10⁵ elements up to 10⁹ that is 10¹⁴ — a `long`. Decide this before writing, not after the overflow.",
        },
        {
          title: "Grinding shape 2 without shape 1",
          body: "The hash-map technique is the prefix identity rearranged. If `prefix[hi] - prefix[lo]` is not automatic, `prefix[i] = prefix[j] - k` will feel like a separate trick to memorise rather than the same line solved for a different variable.",
        },
      ],
    },
  ],
  takeaways: [
    "Four shapes: static queries, prefix plus map, difference array, and 2D",
    "Shape 2 is the highest-value one — count or find with an exact property",
    "Do Product of Array Except Self properly; it is asked constantly",
    "Always write the zero entry: `prefix[0] = 0` or `seen = {0: 1}`",
    "Write the convention down as a comment before the loop",
    "Normalise negative remainders outside Python",
    "Check whether the total sum needs 64 bits",
  ],
  status: "available",
};
