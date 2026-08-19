import type { ModuleDefinition } from "@/content/types";
import { whyPatternPrintingLesson } from "./lesson-1-why-pattern-printing";
import { rectanglesTrianglesLesson } from "./lesson-2-rectangles-and-triangles";
import { pyramidsLesson } from "./lesson-3-pyramids-and-diamonds";
import { numberPatternsLesson } from "./lesson-4-number-patterns";
import { characterPatternsLesson } from "./lesson-5-character-patterns";
import { hollowPatternsLesson } from "./lesson-6-hollow-patterns";
import { methodForAnyPatternLesson } from "./lesson-7-a-method-for-any-pattern";
import { patternsToGridsLesson } from "./lesson-8-from-patterns-to-grids";

export const patternPrintingModule: ModuleDefinition = {
  id: "dsa-pattern-printing",
  slug: "pattern-printing-problems",
  title: "Pattern Printing Problems",
  description:
    "Pyramids, diamonds and Floyd's triangle. Not algorithm patterns — those are Module 1 — but the classic nested-loop drill, and the fastest way to make loop bounds something you derive rather than guess, because the screen tells you instantly when you are wrong.",
  order: 6,
  status: "available",
  phase: "Module 0 · Programming Constructs",
  lessons: [
    whyPatternPrintingLesson,
    rectanglesTrianglesLesson,
    pyramidsLesson,
    numberPatternsLesson,
    characterPatternsLesson,
    hollowPatternsLesson,
    methodForAnyPatternLesson,
    patternsToGridsLesson,
  ],
};
