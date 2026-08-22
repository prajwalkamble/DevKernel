import type { ModuleDefinition } from "@/content/types";

import { thePrefixArrayLesson } from "./lesson-1-the-prefix-array";
import { hashMapPairingLesson } from "./lesson-2-hash-map-pairing";
import { differenceArraysLesson } from "./lesson-3-difference-arrays";
import { invertibleAggregatesLesson } from "./lesson-4-invertible-aggregates";
import { twoDimensionalLesson } from "./lesson-5-2d";
import { whenItStopsWorkingLesson } from "./lesson-6-when-it-stops-working";
import { windowOrPrefixLesson } from "./lesson-7-window-or-prefix";
import { prefixSheetLesson } from "./lesson-8-the-sheet";

export const prefixSumsModule: ModuleDefinition = {
  id: "dsa-prefix-sums",
  slug: "prefix-sums-and-range-queries",
  title: "Prefix Sums & Range Queries",
  description:
    "Precompute once, answer forever — and the hash-map pairing that finds subarrays a window cannot. The prefix array and the leading zero that removes an edge case from every query; then the identity `prefix[i] = prefix[j] - k`, which counts subarrays with an exact sum in one pass and does not care about negative numbers. Difference arrays for the mirror problem of many range updates; two-dimensional tables and the fix-two-rows collapse that reduces a 2D problem to a 1D one; which aggregates can be prefixed at all and what to use when they cannot; and finally the two questions that decide between this module and the last one.",
  order: 18,
  status: "available",
  phase: "Module 1 · Linear DSA",
  lessons: [
    thePrefixArrayLesson,
    hashMapPairingLesson,
    differenceArraysLesson,
    invertibleAggregatesLesson,
    twoDimensionalLesson,
    whenItStopsWorkingLesson,
    windowOrPrefixLesson,
    prefixSheetLesson,
  ],
};
