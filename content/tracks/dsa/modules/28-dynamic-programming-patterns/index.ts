import type { ModuleDefinition } from "@/content/types";

import { knapsackFamilyLesson } from "./lesson-1-the-knapsack-family";
import { subsetSumLesson } from "./lesson-2-subset-sum-and-its-reductions";
import { stringPairGridLesson } from "./lesson-3-the-string-pair-grid";
import { longestIncreasingSubsequenceLesson } from "./lesson-4-longest-increasing-subsequence";

export const dpPatternsModule: ModuleDefinition = {
  id: "dsa-dp-patterns",
  slug: "dynamic-programming-patterns",
  title: "Dynamic Programming: The Patterns",
  description:
    "The catalogue, and the module that converts \"I understood the solution\" into \"I found the solution\". Module 27 was the method; this is the small set of shapes the method keeps producing, starting with the one more problems reduce to than any other — a subset chosen against a single additive budget. In progress: grids, intervals, trees, and the bitmask and digit variants are still to come.",
  order: 28,
  status: "available",
  phase: "Module 1 · Non-linear DSA",
  lessons: [
    knapsackFamilyLesson,
    subsetSumLesson,
    stringPairGridLesson,
    longestIncreasingSubsequenceLesson,
  ],
};
