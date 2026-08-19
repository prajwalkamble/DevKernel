import type { ModuleDefinition } from "@/content/types";
import { declaringArraysLesson } from "./lesson-1-declaring-and-traversing";
import { indexingBoundsLesson } from "./lesson-2-indexing-and-bounds";
import { fixedVsDynamicLesson } from "./lesson-3-fixed-vs-dynamic";
import { onePassScansLesson } from "./lesson-4-one-pass-scans";
import { inPlaceLesson } from "./lesson-5-in-place-operations";
import { stringsAsSequencesLesson } from "./lesson-6-strings-as-sequences";
import { buildingStringsLesson } from "./lesson-7-building-strings";
import { stringOperationsLesson } from "./lesson-8-string-operations";

export const arraysAndStringsModule: ModuleDefinition = {
  id: "dsa-first-arrays-and-strings",
  slug: "arrays-and-strings-hands-on",
  title: "1D Arrays & String Implementation",
  description:
    "The first real data structure, and the one every later structure is built out of. Hands-on and mechanical: the loops you will write a thousand times, until writing them takes no thought at all.",
  order: 8,
  status: "available",
  phase: "Module 0 · Programming Constructs",
  lessons: [
    declaringArraysLesson,
    indexingBoundsLesson,
    fixedVsDynamicLesson,
    onePassScansLesson,
    inPlaceLesson,
    stringsAsSequencesLesson,
    buildingStringsLesson,
    stringOperationsLesson,
  ],
};
