import type { ModuleDefinition } from "@/content/types";
import { choosingYourLanguageLesson } from "./lesson-1-choosing-your-language";
import { arithmeticTrapsLesson } from "./lesson-2-arithmetic-traps";
import { stringsQuadraticTrapLesson } from "./lesson-3-strings-and-the-quadratic-trap";
import { collectionsMappedLesson } from "./lesson-4-collections-mapped-across";
import { iterationIdiomsLesson } from "./lesson-5-iteration-idioms";
import { sortingComparatorLesson } from "./lesson-6-sorting-with-a-comparator";
import { fastInputOutputLesson } from "./lesson-7-fast-input-and-output";
import { starterTemplateLesson } from "./lesson-8-the-starter-template";

export const yourSolvingLanguageModule: ModuleDefinition = {
  id: "dsa-solving-language",
  slug: "your-solving-language",
  title: "Your Solving Language",
  description:
    "Pick one language and stop fighting it. The same twelve operations in whichever you chose, the places it will quietly betray you — silent overflow, truncating division, a string built in a loop — and the template you start every problem from. The traps are language-specific; the list of things you must be able to do is not.",
  order: 2,
  status: "available",
  phase: "Module 0 · Programming Constructs",
  lessons: [
    choosingYourLanguageLesson,
    arithmeticTrapsLesson,
    stringsQuadraticTrapLesson,
    collectionsMappedLesson,
    iterationIdiomsLesson,
    sortingComparatorLesson,
    fastInputOutputLesson,
    starterTemplateLesson,
  ],
};
