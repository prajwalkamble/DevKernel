import type { ModuleDefinition } from "@/content/types";

import { leapOfFaithLesson } from "./lesson-1-the-leap-of-faith";
import { callStackLesson } from "./lesson-2-the-call-stack";
import { backtrackingLesson } from "./lesson-3-backtracking";
import { pruningLesson } from "./lesson-4-pruning";
import { divideAndConquerLesson } from "./lesson-5-divide-and-conquer";
import { combinationsLesson } from "./lesson-6-combinations";
import { recursionToDpLesson } from "./lesson-7-recursion-to-dp";
import { recursionSheetLesson } from "./lesson-8-the-sheet";

export const recursionModule: ModuleDefinition = {
  id: "dsa-recursion",
  slug: "recursion-and-backtracking",
  title: "Recursion & Backtracking",
  description:
    "The mental model everything after this depends on. How to trust a recursive call rather than trace it, how to read a recursion tree's cost off its shape, and where the call stack actually runs out. Then backtracking's one template — choose, explore, un-choose — applied to subsets, permutations and combinations, with duplicates handled by skipping rather than by a set. Pruning is given its own lesson because it is the difference between a search that finishes and one that does not: the same N-queens search, pruned, visits nine thousand times fewer nodes at n=8. Ends on the bridge to dynamic programming, which is a correct recursion plus a cache.",
  order: 19,
  status: "available",
  phase: "Module 1 · Linear DSA",
  lessons: [
    leapOfFaithLesson,
    callStackLesson,
    backtrackingLesson,
    pruningLesson,
    divideAndConquerLesson,
    combinationsLesson,
    recursionToDpLesson,
    recursionSheetLesson,
  ],
};
