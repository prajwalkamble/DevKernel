import type { ModuleDefinition } from "@/content/types";

import { arraysInMemoryLesson } from "./lesson-1-arrays-in-memory";
import { stringsAtProblemScaleLesson } from "./lesson-2-strings-at-problem-scale";
import { readAndWritePointersLesson } from "./lesson-3-read-and-write-pointers";
import { reversalAndRotationLesson } from "./lesson-4-reversal-and-rotation";
import { matricesLesson } from "./lesson-5-matrices";
import { spiralAndBoundariesLesson } from "./lesson-6-spiral-and-boundaries";
import { partitioningLesson } from "./lesson-7-partitioning";
import { cyclicSortLesson } from "./lesson-8-cyclic-sort";

export const arraysStringsInPlaceModule: ModuleDefinition = {
  id: "dsa-arrays-strings",
  slug: "arrays-and-strings",
  title: "Arrays, Strings & Working In Place",
  description:
    "The structures every other one is built out of, revisited as things algorithms are made of rather than things to loop over. Why indexing is genuinely constant-time and why two loops with identical complexity can differ seventeenfold; the counting and canonical-form moves that solve most string problems; and then the in-place family — compaction, reversal and rotation, matrix work, one-pass partitioning, and the cyclic sort that turns a whole class of missing-number problems into a two-line loop.",
  order: 13,
  status: "available",
  phase: "Module 1 · Linear DSA",
  lessons: [
    arraysInMemoryLesson,
    stringsAtProblemScaleLesson,
    readAndWritePointersLesson,
    reversalAndRotationLesson,
    matricesLesson,
    spiralAndBoundariesLesson,
    partitioningLesson,
    cyclicSortLesson,
  ],
};
