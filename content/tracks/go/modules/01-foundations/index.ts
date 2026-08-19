import type { ModuleDefinition } from "@/content/types";

import { whatIsGoLesson } from "./lesson-1-what-is-go";
import { toolchainLesson } from "./lesson-2-toolchain";
import { variablesLesson } from "./lesson-3-variables";
import { basicTypesLesson } from "./lesson-4-basic-types";
import { compositeTypesLesson } from "./lesson-5-composite-types";
import { functionsAndErrorsLesson } from "./lesson-6-functions-and-errors";

export const goFoundationsModule: ModuleDefinition = {
  id: "go-foundations",
  slug: "foundations",
  title: "Foundations",
  description:
    "From nothing installed to reading and writing real Go. What the language is for and what it deliberately leaves out; the one command that is the whole toolchain; declarations and the zero-value guarantee; the numeric and string types, including the fact that a Go string holds bytes rather than characters; the four composite types and the array-versus-slice distinction that has to be understood rather than memorised; and finally functions, the single loop keyword, and errors as ordinary values.",
  order: 1,
  status: "available",
  lessons: [
    whatIsGoLesson,
    toolchainLesson,
    variablesLesson,
    basicTypesLesson,
    compositeTypesLesson,
    functionsAndErrorsLesson,
  ],
};
