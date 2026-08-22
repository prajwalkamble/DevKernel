import type { Lesson } from "@/content/types";

export const theSheetLesson: Lesson = {
  id: "dsa-bs-sheet",
  slug: "the-binary-search-sheet",
  moduleSlug: "binary-search",
  title: "The Sheet: Recognising Which Variant",
  summary:
    "Twelve problems, sorted by which of the module's five shapes they are. The skill being drilled is not writing the loop — it is reading a statement and knowing within thirty seconds which loop to write.",
  estimatedMinutes: 30,
  objectives: [
    "Classify a problem into one of the five binary-search shapes",
    "Name the signals that distinguish them",
    "Work the sheet in an order that builds rather than accumulates",
    "Know the complexity to state before writing anything",
  ],
  sections: [
    {
      id: "five-shapes",
      heading: "The five shapes",
      body: [
        "**1. Plain search.** A sorted array, find a value. Signal: \"sorted\" plus \"find\". Rare on its own past the first week.",
        "**2. Boundary search.** First or last occurrence, count, insertion point, floor or ceiling. Signal: duplicates are allowed, or the question says \"first\", \"last\", \"how many\", or \"where would it go\". Answer with `lower_bound` and `upper_bound`.",
        "**3. Modified array.** Rotated, or a matrix, or an array with one structural quirk. Signal: the word \"rotated\", or a 2D input described as sorted. Find the rule for discarding a side.",
        "**4. On the answer.** Signal: **minimise a maximum, or maximise a minimum**, over a number that is not an element of the input — plus a condition you could check in one pass if somebody handed you a candidate.",
        "**5. As an inner step.** The problem is a DP or a counting problem, and binary search is how the transition stops being linear. Signal: an O(n²) solution is obvious and too slow, and something in it is sorted or sortable.",
      ],
    },
    {
      id: "the-sheet",
      heading: "The sheet, in order",
      body: [
        "Work these in this order. It is not difficulty order — it is the order in which each problem teaches something the next one assumes.",
        "**Shape 1 and 2 — the boundaries.** *Binary Search* (704) to get the loop right. *Search Insert Position* (35), which is `lower_bound` wearing a hat. *First Bad Version* (278), the first problem where the input is a predicate rather than an array — this is the bridge to shape 4 and worth noticing. *Find First and Last Position* (34), which is both bounds at once.",
        "**Shape 3 — modified arrays.** *Find Minimum in Rotated Sorted Array* (153), then *Search in Rotated Sorted Array* (33), in that order — the pivot is easier and the second is cleaner once you have it. *Search a 2D Matrix* (74). *Find Peak Element* (162).",
        "**Shape 4 — on the answer.** *Koko Eating Bananas* (875) first; it has the clearest feasibility function you will meet. *Capacity to Ship Packages Within D Days* (1011), which is the same shape with a greedy check. *Split Array Largest Sum* (410), which is the hard version of the same idea and worth the struggle. *Minimum Number of Days to Make m Bouquets* (1482).",
        "**Shape 5 — as a step.** *Longest Increasing Subsequence* (300), in the O(n log n) form. *Median of Two Sorted Arrays* (4), which is the hardest binary search on this list and searches a *partition point* rather than a value.",
      ],
    },
    {
      id: "before-coding",
      heading: "The thirty seconds before you type",
      body: [
        "Say these four things out loud, in this order. Every one of them is cheap, and each catches a different class of failure.",
        "**What am I searching?** An index into the input, or a value in an answer range. Getting this wrong is the single biggest time sink in the whole topic.",
        "**What is the predicate?** For shape 1–3 it is a comparison; for shape 4 it is `feasible`. Write it as a named function before the loop, even mentally.",
        "**Is it monotone?** For shape 4, state the reason. For shape 3, state which half you can rule out and why.",
        "**What are the bounds, and is the answer inside them?** Name both ends and justify each. Then state the complexity — `O(log n)`, or `O(n log(range))` — before writing a line.",
      ],
      pitfalls: [
        {
          title: "Reaching for binary search because the input is sorted",
          body: "Sorted input often means two pointers, prefix sums, or a sliding window instead — all O(n), all faster than O(n log n). Sortedness is a hint, not an instruction. The instruction is a *search* for a specific position or boundary.",
        },
        {
          title: "Grinding shape 4 before shape 2 is solid",
          body: "Binary search on the answer is `lower_bound` with a predicate. If the boundary version is still shaky, every answer-space problem will feel like a new trick rather than the same one. Do the four boundary problems until they are boring.",
        },
      ],
    },
    {
      id: "revisit",
      heading: "Revisiting, not accumulating",
      body: [
        "The failure mode with a sheet is treating it as a queue: solve, tick, never return. Two weeks later the loop conventions are gone again.",
        "Instead: after finishing a shape, come back a day later and **rewrite one problem from that shape from a blank editor** — not from memory of the code, but from the four questions above. If you cannot, that is the signal to stay on the shape rather than move on. The whole module is about twelve lines of code; what you are actually building is the recognition that picks which twelve.",
      ],
    },
  ],
  takeaways: [
    "Five shapes: plain, boundary, modified array, on the answer, and inner step",
    "\"Minimise the maximum\" or \"maximise the minimum\" is shape 4, nearly always",
    "First Bad Version is the bridge: the input is already a predicate",
    "Do the boundary problems until they are boring before starting shape 4",
    "Before typing: what am I searching, what is the predicate, is it monotone, what are the bounds",
    "Sorted input is a hint, not an instruction — it often means two pointers instead",
    "Rewrite one problem per shape a day later, from the questions rather than the code",
  ],
  status: "available",
};
