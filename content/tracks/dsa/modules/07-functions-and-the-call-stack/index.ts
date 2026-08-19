import type { ModuleDefinition } from "@/content/types";
import { definingFunctionsLesson } from "./lesson-1-defining-functions";
import { scopeLesson } from "./lesson-2-scope-and-shadowing";
import { passByValueLesson } from "./lesson-3-pass-by-value";
import { callStackLesson } from "./lesson-4-the-call-stack";
import { overloadingLesson } from "./lesson-5-overloading-and-defaults";
import { pureFunctionsLesson } from "./lesson-6-pure-functions";
import { firstRecursionLesson } from "./lesson-7-your-first-recursion";
import { stackOverflowLesson } from "./lesson-8-stack-overflow";

export const functionsModule: ModuleDefinition = {
  id: "dsa-functions",
  slug: "functions-and-the-call-stack",
  title: "Functions & the Call Stack",
  description:
    "How a program is broken into pieces, and what the machine does when one piece calls another — the mental model that recursion, in Module 1, is built directly on top of.",
  order: 7,
  status: "available",
  phase: "Module 0 · Programming Constructs",
  lessons: [
    definingFunctionsLesson,
    scopeLesson,
    passByValueLesson,
    callStackLesson,
    overloadingLesson,
    pureFunctionsLesson,
    firstRecursionLesson,
    stackOverflowLesson,
  ],
};
