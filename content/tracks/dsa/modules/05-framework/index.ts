import type { ModuleDefinition } from "@/content/types";
import { whyYouFreezeLesson } from "./lesson-1-why-you-freeze";
import { restateAndRepresentLesson } from "./lesson-2-restate-and-represent";
import { bruteForceLesson } from "./lesson-3-always-write-the-brute-force";
import { constraintsLesson } from "./lesson-4-constraints-to-complexity";
import { choosingTheStructureLesson } from "./lesson-5-choosing-the-structure";
import { choosingThePatternLesson } from "./lesson-6-choosing-the-pattern";
import { writingTheCodeLesson } from "./lesson-7-writing-the-code";
import { endToEndLesson } from "./lesson-8-end-to-end";

export const dsaFrameworkModule: ModuleDefinition = {
  id: "dsa-framework",
  slug: "the-framework",
  title: "The Framework: From Statement to First Line of Code",
  description:
    "The module most courses do not have, and the reason their graduates still freeze. A repeatable seven-step method for taking apart a problem you have never seen: restate it, work it by hand, write the brute force, read the constraints backwards to a target complexity, let the dominant operation choose the structure, match the shape to a pattern, and only then write code. Six of the seven steps happen before you type anything. It ends by running all seven, from cold, on a problem that appears nowhere else in this track.",
  order: 12,
  status: "available",
  phase: "Bridge · The Problem-Solving Framework",
  lessons: [
    whyYouFreezeLesson,
    restateAndRepresentLesson,
    bruteForceLesson,
    constraintsLesson,
    choosingTheStructureLesson,
    choosingThePatternLesson,
    writingTheCodeLesson,
    endToEndLesson,
  ],
};
