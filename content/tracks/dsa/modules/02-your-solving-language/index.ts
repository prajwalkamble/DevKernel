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
  title: "Your Solving Language: Java & Python Side by Side",
  description:
    "Pick one language and stop fighting it. The same twelve operations in both, the places each one will quietly betray you, and the template you start every problem from.",
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
