import type { ModuleDefinition } from "@/content/types";

import { shapeAndCostLesson } from "./lesson-1-the-shape-and-the-cost";
import { dummyHeadLesson } from "./lesson-2-the-dummy-head";
import { reversalLesson } from "./lesson-3-reversal";
import { fastAndSlowLesson } from "./lesson-4-fast-and-slow";
import { mergingAndSortingLesson } from "./lesson-5-merging-and-sorting";
import { lruCacheLesson } from "./lesson-6-lru-cache";
import { problemsThatRewireLesson } from "./lesson-7-problems-that-rewire";
import { linkedListSheetLesson } from "./lesson-8-the-sheet";

export const linkedListsModule: ModuleDefinition = {
  id: "dsa-linked-lists",
  slug: "linked-lists",
  title: "Linked Lists",
  description:
    "Rarely the right structure in production, permanently popular in interviews — because pointer manipulation is where sloppy reasoning shows up immediately. Starts by being honest about the trade: O(1) insertion is conditional on already holding the position, and cache locality means the array usually wins anyway. Then the five moves everything else is built from — the dummy head that deletes half your edge cases, reversal in both forms, fast and slow pointers with Floyd's cycle-start argument worked through, merging, and the two-chain build. Ends on the LRU cache, the problem that justifies the doubly linked list, and a sheet with the habit that stops pointer code from going wrong.",
  order: 22,
  status: "available",
  phase: "Module 1 · Linear DSA",
  lessons: [
    shapeAndCostLesson,
    dummyHeadLesson,
    reversalLesson,
    fastAndSlowLesson,
    mergingAndSortingLesson,
    lruCacheLesson,
    problemsThatRewireLesson,
    linkedListSheetLesson,
  ],
};
