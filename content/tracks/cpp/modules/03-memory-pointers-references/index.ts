import type { ModuleDefinition } from "@/content/types";
import { memoryModelLesson } from "./lesson-1-memory-model";
import { pointersLesson } from "./lesson-2-pointers";
import { pointerArithmeticLesson } from "./lesson-3-pointer-arithmetic";
import { newDeleteLesson } from "./lesson-4-new-delete";
import { memoryBugsLesson } from "./lesson-5-memory-bugs";
import { constCorrectnessLesson } from "./lesson-6-const-correctness";
import { raiiIntroLesson } from "./lesson-7-raii-intro";

export const cppMemoryModule: ModuleDefinition = {
  id: "cpp-memory",
  slug: "memory-pointers-references",
  title: "Memory, Pointers & References",
  description:
    "Where objects actually live, what a pointer really is, and who is responsible for freeing what. This is the module that separates C++ from managed languages: you meet the five memory bug classes by writing them deliberately and catching each one with a sanitizer, learn const correctness as a discipline, and finish on RAII — the idea that makes all of it safe without a garbage collector, and the foundation the next module is built on.",
  order: 3,
  status: "available",
  lessons: [
    memoryModelLesson,
    pointersLesson,
    pointerArithmeticLesson,
    newDeleteLesson,
    memoryBugsLesson,
    constCorrectnessLesson,
    raiiIntroLesson,
  ],
};
