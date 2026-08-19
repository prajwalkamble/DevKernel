import type { ModuleDefinition } from "@/content/types";
import { readingInputLesson } from "./lesson-1-reading-input";
import { printingAndFormattingLesson } from "./lesson-2-printing-and-formatting";
import { integerTypesLesson } from "./lesson-3-integer-types-and-ranges";
import { floatingPointLesson } from "./lesson-4-floating-point";
import { charactersLesson } from "./lesson-5-characters-ascii-unicode";
import { booleansNullLesson } from "./lesson-6-booleans-null-and-truthiness";
import { typeConversionLesson } from "./lesson-7-type-conversion";
import { arbitraryPrecisionLesson } from "./lesson-8-arbitrary-precision";

export const inputOutputDataTypesModule: ModuleDefinition = {
  id: "dsa-io-and-data-types",
  slug: "input-output-and-data-types",
  title: "Input, Output & Data Types",
  description:
    "Getting data in and answers out — and the fixed-width types that will lie to you the first time a number gets large.",
  order: 3,
  status: "available",
  phase: "Module 0 · Programming Constructs",
  lessons: [
    readingInputLesson,
    printingAndFormattingLesson,
    integerTypesLesson,
    floatingPointLesson,
    charactersLesson,
    booleansNullLesson,
    typeConversionLesson,
    arbitraryPrecisionLesson,
  ],
};
