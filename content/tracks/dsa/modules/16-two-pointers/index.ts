import type { ModuleDefinition } from "@/content/types";

import { oppositeEndsLesson } from "./lesson-1-opposite-ends";
import { exchangeArgumentLesson } from "./lesson-2-exchange-argument";
import { sameDirectionLesson } from "./lesson-3-same-direction";
import { sortingAndIndicesLesson } from "./lesson-4-sorting-and-indices";
import { duplicatesAndKsumLesson } from "./lesson-5-duplicates-and-ksum";
import { partitioningLesson } from "./lesson-6-partitioning";
import { stringsLesson } from "./lesson-7-strings";
import { twoPointerSheetLesson } from "./lesson-8-the-sheet";

export const twoPointersModule: ModuleDefinition = {
  id: "dsa-two-pointers",
  slug: "two-pointers",
  title: "Two Pointers",
  description:
    "The first pattern that turns an O(n²) loop into an O(n) one, and the exchange argument that proves it is allowed to. Converging pointers on sorted input and the proof that a move discards nothing needed; the same-direction read/write pair behind every in-place filter; the lag and speed variants that find a midpoint or a cycle without a length. Then what sorting costs you, the three duplicate skips that make 3Sum correct without a set, three-way partitioning, and the inward and outward walks that solve the string problems.",
  order: 16,
  status: "available",
  phase: "Module 1 · Linear DSA",
  lessons: [
    oppositeEndsLesson,
    exchangeArgumentLesson,
    sameDirectionLesson,
    sortingAndIndicesLesson,
    duplicatesAndKsumLesson,
    partitioningLesson,
    stringsLesson,
    twoPointerSheetLesson,
  ],
};
