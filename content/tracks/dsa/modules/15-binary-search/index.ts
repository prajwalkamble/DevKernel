import type { ModuleDefinition } from "@/content/types";

import { writingItCorrectlyLesson } from "./lesson-1-writing-it-correctly";
import { boundsLesson } from "./lesson-2-bounds";
import { rotatedAnd2dLesson } from "./lesson-3-rotated-and-2d";
import { onTheAnswerLesson } from "./lesson-4-on-the-answer";
import { realValuedLesson } from "./lesson-5-real-valued";
import { insideOtherAlgorithmsLesson } from "./lesson-6-inside-other-algorithms";
import { peakFindingLesson } from "./lesson-7-peak-finding";
import { theSheetLesson } from "./lesson-8-the-sheet";

export const binarySearchModule: ModuleDefinition = {
  id: "dsa-binary-search",
  slug: "binary-search",
  title: "Binary Search & Binary Search on the Answer",
  description:
    "The most-failed easy question there is, and then the technique that quietly solves a whole family of hard ones. The two loop conventions and why mixing them is where every off-by-one comes from; the boundary searches that answer \"first\", \"last\" and \"how many\"; the rotated and matrix variants; and then the reframe that matters most — searching the range of possible answers rather than the input, which turns \"minimise the maximum\" into the same twelve lines. Ends on real-valued precision, binary search as the inner step of a larger algorithm, and a peak-finding problem with no sorted input at all.",
  order: 15,
  status: "available",
  phase: "Module 1 · Linear DSA",
  lessons: [
    writingItCorrectlyLesson,
    boundsLesson,
    rotatedAnd2dLesson,
    onTheAnswerLesson,
    realValuedLesson,
    insideOtherAlgorithmsLesson,
    peakFindingLesson,
    theSheetLesson,
  ],
};
