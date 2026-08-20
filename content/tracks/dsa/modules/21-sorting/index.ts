import type { ModuleDefinition } from "@/content/types";

import { fourSortsLesson } from "./lesson-1-the-four-worth-knowing";
import { lowerBoundLesson } from "./lesson-2-the-lower-bound";
import { stabilityLesson } from "./lesson-3-stability";
import { librarySortLesson } from "./lesson-4-what-your-library-does";
import { comparatorsLesson } from "./lesson-5-comparators";
import { countingBucketRadixLesson } from "./lesson-6-counting-bucket-radix";
import { sortingAsPreprocessingLesson } from "./lesson-7-sorting-as-preprocessing";
import { sortingSheetLesson } from "./lesson-8-the-sheet";

export const sortingModule: ModuleDefinition = {
  id: "dsa-sorting",
  slug: "sorting",
  title: "Sorting",
  description:
    "A tool rather than a topic. You will rarely implement one and constantly rely on one — so this is mostly about what your language's sort really is and when order is the whole solution. Covers the four algorithms worth knowing and what each is actually good at, the n log n lower bound and the counting sorts that escape it by not comparing, stability and the multi-key sorting that depends on it, and the comparator contract that `a - b` quietly violates. Ends where sorting matters most: as preprocessing, where one log factor buys adjacency, monotonicity and a provable greedy order — and on the problems where reaching for a sort is the trap.",
  order: 21,
  status: "available",
  phase: "Module 1 · Linear DSA",
  lessons: [
    fourSortsLesson,
    lowerBoundLesson,
    stabilityLesson,
    librarySortLesson,
    comparatorsLesson,
    countingBucketRadixLesson,
    sortingAsPreprocessingLesson,
    sortingSheetLesson,
  ],
};
