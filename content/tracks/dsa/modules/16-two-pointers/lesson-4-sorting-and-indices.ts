import type { Lesson } from "@/content/types";

export const sortingAndIndicesLesson: Lesson = {
  id: "dsa-tp-sorting",
  slug: "sorting-first-and-what-it-costs",
  moduleSlug: "two-pointers",
  title: "Sorting First, and What It Costs",
  summary:
    "Two pointers usually needs sorted input, and sorting is rarely free. It costs you the original indices, it costs you O(n log n), and sometimes it costs you the problem itself.",
  estimatedMinutes: 25,
  objectives: [
    "Decide whether sorting is permitted by the problem",
    "Preserve original indices when the answer needs them",
    "Compare the sort-then-two-pointer route against a hash map",
    "Recognise the problems where order is the thing being measured",
  ],
  sections: [
    {
      id: "three-costs",
      heading: "The three costs",
      body: [
        "**It destroys the indices.** After sorting, position 0 holds the smallest value, not the first one. If the answer is \"return the indices of the two numbers\", you have thrown away the answer.",
        "**It costs O(n log n).** If the rest of your algorithm is O(n), sorting is now the dominant term. A hash map that solves the same problem in O(n) is strictly better — and the interviewer will say so.",
        "**It sometimes destroys the problem.** \"Count inversions\" is a question *about* the order. \"Longest increasing subsequence\" is about the order. Sorting those inputs does not simplify the problem; it deletes it.",
      ],
    },
    {
      id: "keeping-indices",
      heading: "Keeping the indices",
      body: [
        "When you need both sorted order and the original positions, sort **pairs** rather than values: `[(value, original_index), ...]`. In Python that is `sorted(enumerate(a), key=lambda p: p[1])`; in Java an array of `int[]{value, index}` with a comparator; in C++ a `vector<pair<int,int>>`.",
        "This is cheap and it is the standard answer to \"but I need the indices\". The reason to know it is that it also tells you when *not* to bother: if you are carrying indices through purely to report them at the end, a hash map from value to index is usually simpler and faster.",
      ],
    },
    {
      id: "the-decision",
      heading: "Sort-and-two-point, or hash map?",
      body: [
        "Both solve \"find a pair summing to k\". They differ in three ways and the problem usually decides for you.",
        "**Hash map** — O(n) time, O(n) space, preserves indices, works on unsorted input, and finds *one* pair easily. It is the right answer to LeetCode's Two Sum.",
        "**Sort and two-point** — O(n log n) time, O(1) extra space, loses indices, and is much better at enumerating **all** pairs, at handling duplicates cleanly, and at generalising to three or four elements. It is the right answer to 3Sum.",
        "The tiebreaker is usually the follow-up. If the input is already sorted, two pointers wins outright. If the problem asks for all distinct triples, the hash-map route needs a set of tuples to deduplicate and becomes messier than the sorted version, which handles duplicates by skipping.",
      ],
      pitfalls: [
        {
          title: "Sorting a list of objects and forgetting it is in place",
          body: "`list.sort()` in Python, `Arrays.sort` in Java and `std::sort` in C++ all mutate. If the caller needed the original order — or another part of your own function does — you have introduced a bug that only shows up in the second use. Use `sorted(a)` or copy first when in doubt.",
        },
        {
          title: "Assuming the input is sorted because the examples are",
          body: "Sample inputs are often sorted by coincidence. Read the constraints, not the examples. This is the most common cause of a solution that passes the samples and fails on submission.",
        },
      ],
    },
  ],
  takeaways: [
    "Sorting costs the indices, O(n log n), and sometimes the problem",
    "Sort `(value, index)` pairs when you need both",
    "Hash map for one pair on unsorted input, preserving indices",
    "Sort and two-point for all pairs, O(1) space, and k-Sum generalisation",
    "Never sort when the order is what is being measured",
    "Library sorts mutate in place — copy if the caller still needs the original",
  ],
  status: "available",
};
