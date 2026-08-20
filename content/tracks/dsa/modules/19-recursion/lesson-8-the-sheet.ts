import type { Lesson } from "@/content/types";

export const recursionSheetLesson: Lesson = {
  id: "dsa-rec-sheet",
  slug: "the-recursion-sheet",
  moduleSlug: "recursion-and-backtracking",
  title: "The Sheet: Recursion & Backtracking",
  summary:
    "Four shapes, twenty problems, and the four questions to answer before writing a recursive function. The questions matter more than the list.",
  estimatedMinutes: 25,
  objectives: [
    "Classify a recursive problem into one of four shapes",
    "Answer the four setup questions before coding",
    "Work the sheet in a building order",
    "State the complexity from the recursion tree",
  ],
  sections: [
    {
      id: "four-shapes",
      heading: "The four shapes",
      body: [
        "**1. Linear recursion.** One call per level. Signal: a list, a string, or a number reduced one step at a time. Usually convertible to a loop, and often should be.",
        "**2. Divide and conquer.** Two or more calls on disjoint parts, then a combine. Signal: \"split in half\", sorting, or an O(n log n) target.",
        "**3. Backtracking.** Many calls per level, exploring choices, with an un-choose. Signal: \"all\", \"every\", \"generate\", \"how many ways\" with a small n.",
        "**4. Recursion with memoisation.** Backtracking's shape but computing a value rather than listing answers, with overlapping subproblems. Signal: \"how many ways\", \"minimum cost\", with an n too large for plain enumeration.",
      ],
    },
    {
      id: "the-sheet",
      heading: "The sheet, in order",
      body: [
        "**Shape 1 — get the mechanics.** *Fibonacci* and *factorial* by hand. *Reverse String* (344). *Reverse Linked List* (206), both recursively and iteratively — compare them. *Power of Two* (231). *Pow(x, n)* (50), which is fast exponentiation from the bits module as a recursion.",
        "**Shape 2.** *Merge Sort* written from scratch. *Sort an Array* (912). *Maximum Subarray* (53) in its divide-and-conquer form before you learn Kadane's. *Count of Smaller Numbers After Self* (315) is the hard one, and is merge sort with a counter.",
        "**Shape 3 — the core.** *Subsets* (78), *Subsets II* (90). *Permutations* (46), *Permutations II* (47). *Combination Sum* (39), *Combination Sum II* (40). *Letter Combinations of a Phone Number* (17). *Generate Parentheses* (22), where the pruning is a counting invariant. *Palindrome Partitioning* (131). *Word Search* (79). *N-Queens* (51). *Sudoku Solver* (37).",
        "**Shape 4 — the bridge.** *Climbing Stairs* (70) recursively, then memoised. *House Robber* (198). *Coin Change* (322). These belong to the DP module and are worth meeting here first, in their recursive form, so that DP arrives as an optimisation rather than a new subject.",
      ],
    },
    {
      id: "four-questions",
      heading: "The four questions",
      body: [
        "**What is the base case?** Name the smallest input and what the function returns for it. Include the empty and single-element cases explicitly.",
        "**What is the one step?** Assuming the recursive call works, what do you do with its result? One sentence.",
        "**What shrinks?** Name the quantity that decreases on every call, and check every branch decreases it.",
        "**How deep, and how wide?** Depth gives the stack risk; the branching factor to the power of the depth gives the time. `2^n` for subsets, `n!` for permutations, `O(n)` deep for a list — say the number before writing.",
        "Four sentences, thirty seconds, and they catch the stack overflow, the missing base case, the infinite recursion and the wrong complexity between them.",
      ],
      pitfalls: [
        {
          title: "Writing the recursion before naming the state",
          body: "For anything that will later be memoised, the parameters *are* the state. Choosing them carelessly — passing a whole list slice rather than an index — produces a function that is correct and cannot be cached. Decide the parameters deliberately.",
        },
        {
          title: "Practising only the generation problems",
          body: "Shape 3 is the fun one and the most represented on lists. Shapes 1 and 2 are what make trees, graphs and DP readable later, and they get skipped. Write merge sort by hand at least once.",
        },
      ],
    },
  ],
  takeaways: [
    "Four shapes: linear, divide and conquer, backtracking, and memoised",
    "Ask: base case, one step, what shrinks, how deep and how wide",
    "Say the complexity from the tree before writing the code",
    "Work the paired problems back to back — the difference is usually two characters",
    "Meet Climbing Stairs and Coin Change recursively before the DP module",
    "Choose parameters deliberately; for memoised recursion they are the state",
    "Write merge sort by hand once, even though you will never need to again",
  ],
  status: "available",
};
