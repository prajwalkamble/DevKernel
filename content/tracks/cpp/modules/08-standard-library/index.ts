import type { ModuleDefinition } from "@/content/types";
import { vectorLesson } from "./lesson-1-vector";
import { sequenceContainersLesson } from "./lesson-2-sequence-containers";
import { associativeContainersLesson } from "./lesson-3-associative-containers";
import { iteratorsLesson } from "./lesson-4-iterators";
import { algorithmsLesson } from "./lesson-5-algorithms";
import { stringViewLesson } from "./lesson-6-string-and-string-view";
import { rangesLesson } from "./lesson-7-ranges";

export const cppStdlibModule: ModuleDefinition = {
  id: "cpp-stdlib",
  slug: "standard-library",
  title: "The Standard Library",
  description:
    "Containers, iterators and algorithms as one design, chosen on the guarantees rather than on habit. `vector`'s doubling and the reallocation that invalidates every pointer into it; a linked list losing a traversal by ten times and winning a front-insert by four hundred; the `operator[]` that silently inserts and the comparator that makes `std::sort` write out of bounds. Ends on `string_view` turning a hundred allocations into zero, and the C++20 ranges rewrite — projections, lazy pipelines, and what they cost.",
  order: 8,
  status: "available",
  lessons: [
    vectorLesson,
    sequenceContainersLesson,
    associativeContainersLesson,
    iteratorsLesson,
    algorithmsLesson,
    stringViewLesson,
    rangesLesson,
  ],
};
