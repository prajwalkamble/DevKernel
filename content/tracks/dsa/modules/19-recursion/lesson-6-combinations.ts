import type { Lesson } from "@/content/types";

export const combinationsLesson: Lesson = {
  id: "dsa-rec-combinations",
  slug: "subsets-permutations-and-combinations",
  moduleSlug: "recursion-and-backtracking",
  title: "Subsets, Permutations & Combinations",
  summary:
    "Three families that share one template and differ in two small decisions — where the loop starts, and whether elements may repeat. Getting those two right is most of the work.",
  estimatedMinutes: 30,
  objectives: [
    "Say what distinguishes the three families",
    "Choose the loop start and the recursion argument for each",
    "Allow or forbid reuse of the same element",
    "Count the output size and check it against the expected total",
  ],
  sections: [
    {
      id: "the-three",
      heading: "Two decisions, three families",
      body: [
        "**Does order matter?** If yes, it is a permutation: `[1,2]` and `[2,1]` are different answers. If no, it is a subset or a combination.",
        "**May an element be reused?** If yes, the recursion passes `i` rather than `i + 1`, so the same index can be chosen again at the next level.",
        "From those two, the loop shape follows mechanically:",
        "**Subsets / combinations, no reuse** — loop `for i in range(start, n)`, recurse with `i + 1`. Output size `2^n` for all subsets, `C(n, k)` for combinations of a fixed size.",
        "**Combinations with reuse** — loop from `start`, recurse with **`i`**. Output size depends on the target, not on n.",
        "**Permutations** — loop `for i in range(n)` with a `used` array, recurse with no start at all. Output size `n!`.",
      ],
    },
    {
      id: "sizes",
      heading: "Check the size before you run it",
      body: [
        "These outputs are exponential and it is worth knowing which exponential before writing the loop.",
        "**Subsets: 2^n.** n = 20 gives a million — fine. n = 30 gives a billion — not fine.",
        "**Permutations: n!.** n = 10 gives 3.6 million — fine. n = 13 gives 6.2 billion — not fine. **Any problem asking for all permutations has n ≤ 10 or so in its constraints**, and if it does not, permutations are not the intended solution.",
        "**Combinations: C(n, k).** C(20, 10) is 184,756 — comfortable. The middle binomial is the worst case for a given n.",
        "Reading the constraint backwards is a reliable trick: `n ≤ 8` strongly suggests permutations, `n ≤ 20` suggests subsets or bitmask DP, and `n ≤ 40` suggests meet-in-the-middle.",
      ],
    },
    {
      id: "variants",
      heading: "The variants worth practising",
      body: [
        "**Subsets** (78) and **Subsets II** (90, with duplicates). **Permutations** (46) and **Permutations II** (47). **Combinations** (77). **Combination Sum** (39, with reuse), **Combination Sum II** (40, no reuse and duplicates present), **Combination Sum III** (216, fixed size).",
        "Working the pairs back to back is the point: 39 and 40 differ by `i` versus `i + 1` plus a duplicate skip, and seeing that as a two-character difference rather than two separate solutions is what makes the family memorable.",
        "**Letter Combinations of a Phone Number** (17) is the same template where the choices at each level come from a lookup rather than from the input array — a useful reminder that \"the available choices\" need not be a slice of the input.",
      ],
      pitfalls: [
        {
          title: "Using `i + 1` when reuse is allowed",
          body: "Combination Sum permits reusing a number, so the recursion passes `i`. Passing `i + 1` silently produces the no-reuse answer, which is a valid-looking but smaller output.",
        },
        {
          title: "Sorting when order matters",
          body: "The duplicate-skip trick requires sorted input, and sorting is harmless for subsets and combinations. For *permutations of a sequence where the original order is meaningful*, sorting changes the problem — check before reaching for the standard fix.",
        },
        {
          title: "Building strings by concatenation in the path",
          body: "In string-generating problems, `path + ch` allocates a new string at every node. For a search producing millions of nodes that dominates the runtime. Use a mutable buffer — a list in Python, a `StringBuilder` in Java — and undo the append in the un-choose step.",
        },
      ],
    },
  ],
  takeaways: [
    "Two decisions: does order matter, and may elements repeat",
    "No reuse: recurse with `i + 1`. Reuse: recurse with `i`",
    "Permutations loop from 0 with a `used` array and no start index",
    "Sizes: subsets 2^n, permutations n!, combinations C(n, k)",
    "Read the constraint backwards — `n ≤ 8` means permutations are intended",
    "Work Combination Sum I and II back to back; the difference is two characters",
    "Use a mutable buffer for string paths, not concatenation",
  ],
  status: "available",
};
