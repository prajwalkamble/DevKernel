import type { ModuleDefinition } from "@/content/types";

import { whatAHashMapIsLesson } from "./lesson-1-what-a-hash-map-is";
import { asteriskOnO1Lesson } from "./lesson-2-the-asterisk-on-o1";
import { complementPatternLesson } from "./lesson-3-the-complement-pattern";
import { frequencyCountingLesson } from "./lesson-4-frequency-counting";
import { groupingByDerivedKeyLesson } from "./lesson-5-grouping-by-a-derived-key";
import { hashingYourOwnTypesLesson } from "./lesson-6-hashing-your-own-types";
import { prefixSumsAndHashMapsLesson } from "./lesson-7-prefix-sums-and-hash-maps";
import { hashingSheetLesson } from "./lesson-8-the-sheet";

export const hashingModule: ModuleDefinition = {
  id: "dsa-hashing",
  slug: "hashing",
  title: "Hashing: Maps, Sets & Frequency",
  description:
    "The structure that collapses a nested loop into a single pass more often than any other, and the reason its O(1) carries an asterisk. Starts with what a hash map actually is — an array plus a function from key to index — then spends a full lesson on the worst case, because average-case O(1) is a statement about how keys spread rather than a promise, and it can be broken deliberately. The rest is the four moves that recur: check the complement before you insert, count and then decide, group by a canonical key, and pair prefix sums with a map when values can go negative and a sliding window cannot. Ends by drawing the line where hashing stops — every question about order needs a different structure.",
  order: 20,
  status: "available",
  phase: "Module 1 · Linear DSA",
  lessons: [
    whatAHashMapIsLesson,
    asteriskOnO1Lesson,
    complementPatternLesson,
    frequencyCountingLesson,
    groupingByDerivedKeyLesson,
    hashingYourOwnTypesLesson,
    prefixSumsAndHashMapsLesson,
    hashingSheetLesson,
  ],
};
