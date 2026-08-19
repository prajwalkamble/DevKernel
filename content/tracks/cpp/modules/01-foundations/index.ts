import type { ModuleDefinition } from "@/content/types";
import { whatIsCppLesson } from "./lesson-1-what-is-cpp";
import { firstProgramLesson } from "./lesson-2-first-program";
import { variablesLesson } from "./lesson-3-variables";
import { fundamentalTypesLesson } from "./lesson-4-fundamental-types";
import { operatorsLesson } from "./lesson-5-operators-expressions";
import { inputOutputLesson } from "./lesson-6-input-output";
import { readingErrorsLesson } from "./lesson-7-reading-errors";

export const cppFoundationsModule: ModuleDefinition = {
  id: "cpp-foundations",
  slug: "foundations",
  title: "What C++ Is & Your First Programs",
  description:
    "Start at absolute zero: what C++ is, what problem it exists to solve, and how a source file becomes an executable — then declare your first variable, meet the fundamental types and the traps in them, get data in and out of a program, and learn to read the compiler messages that will teach you the rest of the language.",
  order: 1,
  status: "available",
  lessons: [
    whatIsCppLesson,
    firstProgramLesson,
    variablesLesson,
    fundamentalTypesLesson,
    operatorsLesson,
    inputOutputLesson,
    readingErrorsLesson,
  ],
};
