import type { ModuleDefinition } from "@/content/types";

import { countingOperationsLesson } from "./lesson-1-counting-operations";
import { bigOThetaOmegaLesson } from "./lesson-2-big-o-theta-omega";
import { readingComplexityLesson } from "./lesson-3-reading-complexity";
import { amortisedAnalysisLesson } from "./lesson-4-amortised-analysis";
import { recurrencesLesson } from "./lesson-5-recurrences";
import { spaceComplexityLesson } from "./lesson-6-space-complexity";
import { theCatalogueLesson } from "./lesson-7-the-catalogue";
import { readingConstraintsLesson } from "./lesson-8-reading-constraints";

export const complexityModule: ModuleDefinition = {
  id: "dsa-complexity",
  slug: "time-and-space-complexity",
  title: "Time & Space Complexity",
  description:
    "The vocabulary every later module borrows: how to count work, how to name the growth rate, and how to read a problem's constraints backwards into the solution it expects.",
  order: 11,
  status: "available",
  phase: "Module 0 · Programming Constructs",
  lessons: [
    countingOperationsLesson,
    bigOThetaOmegaLesson,
    readingComplexityLesson,
    amortisedAnalysisLesson,
    recurrencesLesson,
    spaceComplexityLesson,
    theCatalogueLesson,
    readingConstraintsLesson,
  ],
};
