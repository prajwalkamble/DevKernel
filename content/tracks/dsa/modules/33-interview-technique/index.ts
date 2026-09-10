import type { ModuleDefinition } from "@/content/types";

import { firstTwoMinutesLesson } from "./lesson-1-first-two-minutes";
import { restateAndConfirmLesson } from "./lesson-2-restate-and-confirm";
import { bruteForceOutLoudLesson } from "./lesson-3-brute-force-out-loud";
import { narratingTheOptimisationLesson } from "./lesson-4-narrating-the-optimisation";
import { statingYourComplexityLesson } from "./lesson-5-stating-your-complexity";
import { testingBeforeTheyAskLesson } from "./lesson-6-testing-before-they-ask";
import { gettingUnstuckInPublicLesson } from "./lesson-7-getting-unstuck-in-public";
import { theLastFiveMinutesLesson } from "./lesson-8-the-last-five-minutes";

export const interviewTechniqueModule: ModuleDefinition = {
  id: "dsa-interview-technique",
  slug: "interview-technique",
  title: "Interview Technique: Communicating a Solution",
  description:
    "The part of the assessment that is not the algorithm. Two of these lessons are measured rather than asserted: four hand-picked tests caught one of four seeded bugs where a brute-force oracle caught all four, and four versions of one problem each have a single visible loop while two of them are quadratic. Eight lessons: the clarifying questions worth asking, restating before solving, the brute force as an oracle, narrating the optimisation, stating complexity including space, testing before they ask, getting unstuck in public, and the last five minutes.",
  order: 33,
  status: "available",
  phase: "Module 1 · The Grind",
  lessons: [
    firstTwoMinutesLesson,
    restateAndConfirmLesson,
    bruteForceOutLoudLesson,
    narratingTheOptimisationLesson,
    statingYourComplexityLesson,
    testingBeforeTheyAskLesson,
    gettingUnstuckInPublicLesson,
    theLastFiveMinutesLesson,
  ],
};
