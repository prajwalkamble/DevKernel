import type { Lesson } from "@/content/types";

export const partitioningLesson: Lesson = {
  id: "dsa-tp-partition",
  slug: "three-pointers-and-partitioning",
  moduleSlug: "two-pointers",
  title: "Three Pointers & Partitioning",
  summary:
    "When two regions are not enough. The Dutch national flag partition sorts three categories in one pass with O(1) space, and it is the same machinery that makes quicksort work on duplicate-heavy input.",
  estimatedMinutes: 30,
  objectives: [
    "Partition an array into three regions in one pass",
    "State the four-region invariant that makes it correct",
    "Explain why the middle pointer does not advance after a swap with the tail",
    "Connect it to quicksort's behaviour on duplicates",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "Sort Colors, and why the obvious answer is wasteful",
      body: [
        "An array of 0s, 1s and 2s. Sort it in place. Counting each value and then overwriting works, is O(n), and takes two passes — and the interviewer's follow-up is always \"can you do it in one?\"",
        "The answer is **three** pointers maintaining **four** regions, and it is due to Dijkstra, who posed it as the Dutch national flag problem.",
      ],
    },
    {
      id: "the-invariant",
      heading: "Four regions",
      body: [
        "Let `low`, `mid` and `high` divide the array like this, and hold it as the loop runs:",
        "**`a[0 : low]`** — all zeros, finished. **`a[low : mid]`** — all ones, finished. **`a[mid : high + 1]`** — unexamined. **`a[high + 1 : n]`** — all twos, finished.",
        "`mid` is the cursor. Look at `a[mid]`:",
        "**It is 0** — swap it with `a[low]`, then advance *both* `low` and `mid`. Safe because whatever was at `low` was a 1 (or `low == mid`), and a 1 belongs exactly where `mid` was.",
        "**It is 1** — it is already in the right region. Advance `mid` only.",
        "**It is 2** — swap it with `a[high]` and decrement `high`. **Do not advance `mid`.** The value that just arrived from the tail has never been looked at, and it could be anything.",
        "That last rule is the whole problem. Advancing `mid` after a tail swap is the bug, and it is the one people write.",
      ],
    },
    {
      id: "quicksort",
      heading: "The same idea inside quicksort",
      body: [
        "Textbook quicksort partitions into two regions — less than the pivot, and not less. On an array with many equal keys that degrades badly: every duplicate of the pivot lands on one side, the split becomes lopsided, and an array of all-identical values gives the O(n²) worst case.",
        "**Three-way partitioning** fixes it. Split into less-than, equal-to and greater-than, then recurse only on the outer two. Every duplicate of the pivot is finished in that pass and never recursed on, so an all-identical array becomes O(n) rather than O(n²).",
        "This is not a footnote — it is what production sorts do. The sorting module returns to it.",
      ],
      pitfalls: [
        {
          title: "Advancing `mid` after swapping with `high`",
          body: "The single most common bug in this algorithm. The element swapped in came from the unexamined tail, so it must be inspected on the next iteration. Advancing past it leaves a 0 or a 2 stranded in the middle region, and the failure is data-dependent — small inputs often still come out right.",
        },
        {
          title: "The loop runs while `mid <= high`, not `mid < high`",
          body: "With `<`, the final unexamined element at `mid == high` is never classified. On a two-element input it is the difference between correct and not.",
        },
        {
          title: "It is not stable",
          body: "Swapping with the tail moves elements arbitrarily far. For 0/1/2 that is invisible, but if you are partitioning records by a key and the relative order of equal keys matters, this algorithm destroys it.",
        },
      ],
    },
  ],
  takeaways: [
    "Three pointers maintain four regions: done-low, done-mid, unexamined, done-high",
    "0: swap with `low`, advance both. 1: advance `mid`. 2: swap with `high`, advance neither",
    "Never advance `mid` after a swap with the tail — that element is unexamined",
    "Loop while `mid <= high`",
    "Three-way partitioning is what stops quicksort degrading on duplicates",
    "The partition is not stable",
  ],
  status: "available",
};
