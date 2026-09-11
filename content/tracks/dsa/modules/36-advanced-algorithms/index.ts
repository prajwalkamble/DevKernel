import type { ModuleDefinition } from "@/content/types";

import { kmpLesson } from "./lesson-1-kmp";
import { zAlgorithmLesson } from "./lesson-2-z-algorithm";
import { rabinKarpLesson } from "./lesson-3-rabin-karp";
import { manachersAlgorithmLesson } from "./lesson-4-manachers-algorithm";
import { suffixArraysLesson } from "./lesson-5-suffix-arrays";
import { matrixExponentiationLesson } from "./lesson-6-matrix-exponentiation";
import { computationalGeometryLesson } from "./lesson-7-computational-geometry";
import { randomisedAlgorithmsLesson } from "./lesson-8-randomised-algorithms";

export const advancedAlgorithmsModule: ModuleDefinition = {
  id: "dsa-advanced-algorithms",
  slug: "advanced-algorithms",
  title: "Advanced Algorithms & String Matching",
  description:
    "The specialised toolkit: string matching, hashing, suffix structures, fast recurrences, geometry, and randomisation. Eight lessons: KMP, the Z-algorithm, Rabin-Karp and its collisions, Manacher's algorithm, suffix arrays with LCP, matrix exponentiation, orientation-based geometry, and randomised algorithms whose error is measured.",
  order: 36,
  status: "available",
  phase: "Electives · Advanced DSA",
  lessons: [
    kmpLesson,
    zAlgorithmLesson,
    rabinKarpLesson,
    manachersAlgorithmLesson,
    suffixArraysLesson,
    matrixExponentiationLesson,
    computationalGeometryLesson,
    randomisedAlgorithmsLesson,
  ],
};
