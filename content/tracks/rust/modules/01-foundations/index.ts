import type { ModuleDefinition } from "@/content/types";
import { whatIsRustLesson } from "./lesson-1-what-is-rust";
import { firstProgramLesson } from "./lesson-2-first-program";
import { variablesLesson } from "./lesson-3-variables";
import { scalarTypesLesson } from "./lesson-4-scalar-types";
import { compoundTypesLesson } from "./lesson-5-compound-types";
import { readingErrorsLesson } from "./lesson-6-reading-compiler-errors";

export const rustFoundationsModule: ModuleDefinition = {
  id: "rust-foundations",
  slug: "foundations",
  title: "What Rust Is & Your First Programs",
  description:
    "Start at absolute zero: what Rust is, what problem it was built to solve, and where it is used — then install it, compile your first program, declare your first variable, and learn to read the compiler messages that will teach you the rest of the language.",
  order: 1,
  status: "available",
  lessons: [
    whatIsRustLesson,
    firstProgramLesson,
    variablesLesson,
    scalarTypesLesson,
    compoundTypesLesson,
    readingErrorsLesson,
  ],
};
