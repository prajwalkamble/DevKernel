import type { ModuleDefinition } from "@/content/types";
import { arrayMethodsLesson } from "./lesson-1-array-methods";
import { mapAndSetLesson } from "./lesson-2-map-and-set";
import { iterablesIteratorsLesson } from "./lesson-3-iterables-iterators";
import { generatorsLesson } from "./lesson-4-generators";
import { weakMapWeakSetLesson } from "./lesson-5-weakmap-weakset";
import { tsGenericsCollectionsLesson } from "./lesson-6-ts-generics-collections";

export const arraysCollectionsModule: ModuleDefinition = {
  id: "arrays-collections",
  slug: "arrays-collections",
  title: "Arrays, Iterables & Collections",
  description:
    "A deep dive into every essential array method, Map and Set, iterators and generators, and how TypeScript generics make collection code reusable and type-safe.",
  order: 4,
  status: "available",
  lessons: [
    arrayMethodsLesson,
    mapAndSetLesson,
    iterablesIteratorsLesson,
    generatorsLesson,
    weakMapWeakSetLesson,
    tsGenericsCollectionsLesson,
  ],
};
