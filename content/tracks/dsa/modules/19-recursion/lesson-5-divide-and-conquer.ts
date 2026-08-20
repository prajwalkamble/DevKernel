import type { Lesson } from "@/content/types";

export const divideAndConquerLesson: Lesson = {
  id: "dsa-rec-divide",
  slug: "divide-and-conquer-as-a-shape",
  moduleSlug: "recursion-and-backtracking",
  title: "Divide and Conquer as a Shape",
  summary:
    "Split, solve both halves, combine. Where the work sits — in the split or in the combine — is what separates merge sort from quicksort, and the master theorem reads the cost straight off the shape.",
  estimatedMinutes: 30,
  objectives: [
    "Identify the split, solve and combine steps of an algorithm",
    "Say whether the work is in the split or the combine",
    "Apply the master theorem to the three common cases",
    "Recognise problems that want this shape",
  ],
  sections: [
    {
      id: "the-shape",
      heading: "Three steps",
      body: [
        "**Divide** the problem into subproblems. **Conquer** them by recursing. **Combine** their answers into the answer for the whole.",
        "The interesting variation is *where the work goes*, and comparing the two classic sorts makes it concrete.",
        "**Merge sort** splits trivially — cut the array in half at the midpoint — and does all its work in the combine, merging two sorted halves. **Quicksort** does all its work in the split — partitioning around a pivot — and the combine is nothing at all, because the halves are already in the right places relative to each other.",
        "Same shape, opposite distribution of effort. Every divide-and-conquer algorithm sits somewhere on that spectrum, and asking which end you are at is usually the fastest way to design one.",
      ],
      visual: {
        id: "merge-visual",
        kind: "sorting",
        algorithm: "merge",
        title: "Merge sort: trivial split, all the work in the combine",
      },
    },
    {
      id: "master-theorem",
      heading: "Reading the cost off the shape",
      body: [
        "For a recurrence `T(n) = a·T(n/b) + f(n)` — `a` subproblems, each of size `n/b`, plus `f(n)` work to split and combine — the cost falls into three cases depending on whether the leaves or the root dominate.",
        "**Work dominated by the leaves.** Two halves, constant combine: `T(n) = 2T(n/2) + O(1)` gives **O(n)**. Binary tree traversals are here.",
        "**Work evenly spread.** Two halves, linear combine: `T(n) = 2T(n/2) + O(n)` gives **O(n log n)**. Merge sort, and quicksort's average case. There are `log n` levels and each does O(n) total work — which is the picture worth carrying rather than the formula.",
        "**Work dominated by the root.** One half, constant work: `T(n) = T(n/2) + O(1)` gives **O(log n)**. Binary search.",
        "You can nearly always get the answer by drawing the tree and asking how much work each *level* does, then multiplying by the number of levels. That is the master theorem's content without its notation.",
      ],
    },
    {
      id: "the-family",
      heading: "Where it shows up",
      body: [
        "**Merge sort and quicksort**, as above. The sorting module covers both properly.",
        "**Binary search** — a degenerate case, since one of the two subproblems is discarded rather than solved.",
        "**Count inversions.** Merge sort with a counter: while merging, every time an element from the right half is taken before elements remain on the left, those remaining elements are all inversions. O(n log n) instead of O(n²), and it is the standard example of getting extra information out of a sort for free.",
        "**Maximum subarray, divide-and-conquer version.** The best subarray is entirely in the left half, entirely in the right, or crosses the middle — and the crossing case is a linear scan outward from the centre. O(n log n), which Kadane's then beats at O(n). Worth writing once, because the three-case split is a reusable move.",
        "**Karatsuba multiplication, Strassen's matrix multiplication, the FFT.** All the same shape with a clever combine that reduces `a` — and all in the advanced elective.",
      ],
      pitfalls: [
        {
          title: "Splitting unevenly by accident",
          body: "`mid = (lo + hi) / 2` on a range that never shrinks on one side gives `T(n) = T(n-1) + O(n)`, which is O(n²), not O(n log n). Quicksort's worst case is exactly this, and it is why pivot choice matters.",
        },
        {
          title: "An O(n) combine that is really O(n log n)",
          body: "Sorting inside the combine step, or concatenating with `+` in a loop, quietly adds a factor. The recurrence you *wrote* and the recurrence you *implemented* have to match — check what the combine actually costs rather than what you intended it to cost.",
        },
        {
          title: "Allocating a new array at every level",
          body: "Merge sort allocating a fresh buffer per call is O(n log n) memory. Allocating one scratch buffer up front and reusing it is O(n). Both are correct; the second is what a library does.",
        },
      ],
    },
  ],
  takeaways: [
    "Divide, conquer, combine — and the question is where the work sits",
    "Merge sort works in the combine; quicksort works in the split",
    "Draw the tree and ask what each *level* costs, then multiply by the depth",
    "`2T(n/2) + O(n)` is O(n log n); `T(n/2) + O(1)` is O(log n)",
    "Counting inversions is merge sort with a counter",
    "Uneven splits collapse O(n log n) to O(n²)",
    "Allocate one scratch buffer, not one per level",
  ],
  status: "available",
};
