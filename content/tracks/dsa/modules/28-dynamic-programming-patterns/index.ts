import type { ModuleDefinition } from "@/content/types";

import { knapsackFamilyLesson } from "./lesson-1-the-knapsack-family";
import { subsetSumLesson } from "./lesson-2-subset-sum-and-its-reductions";
import { stringPairGridLesson } from "./lesson-3-the-string-pair-grid";
import { longestIncreasingSubsequenceLesson } from "./lesson-4-longest-increasing-subsequence";
import { gridsAndPathsLesson } from "./lesson-5-grids-and-paths";
import { intervalDpLesson } from "./lesson-6-interval-dp";
import { dpOnTreesLesson } from "./lesson-7-dp-on-trees";
import { bitmaskDigitStateLesson } from "./lesson-8-bitmask-digit-and-state-machines";

export const dpPatternsModule: ModuleDefinition = {
  id: "dsa-dp-patterns",
  slug: "dynamic-programming-patterns",
  title: "Dynamic Programming: The Patterns",
  description:
    "The catalogue, and the module that converts \"I understood the solution\" into \"I found the solution\". Module 27 was the method; this is the small set of shapes the method keeps producing, starting with the one more problems reduce to than any other — a subset chosen against a single additive budget. Eight lessons: the knapsack family and subset sum, the string-pair grid, longest increasing subsequence, grids, intervals, trees and rerooting, and the bitmask, digit and state-machine variants.",
  order: 28,
  status: "available",
  phase: "Module 1 · Non-linear DSA",
  lessons: [
    knapsackFamilyLesson,
    subsetSumLesson,
    stringPairGridLesson,
    longestIncreasingSubsequenceLesson,
    gridsAndPathsLesson,
    intervalDpLesson,
    dpOnTreesLesson,
    bitmaskDigitStateLesson,
  ],
};
