import type { ModuleDefinition } from "@/content/types";
import { branchingLesson } from "./lesson-1-branching";
import { loopsLesson } from "./lesson-2-loops";
import { functionsLesson } from "./lesson-3-functions";
import { passingParametersLesson } from "./lesson-4-passing-parameters";
import { overloadingLesson } from "./lesson-5-overloading";
import { scopeLifetimeLesson } from "./lesson-6-scope-lifetime";
import { headersOdrLesson } from "./lesson-7-headers-odr";

export const cppFunctionsModule: ModuleDefinition = {
  id: "cpp-control-flow-functions",
  slug: "control-flow-functions",
  title: "Control Flow, Functions & Program Structure",
  description:
    "Turning a page of statements into a program: branching and loops, functions with real signatures, and the decision you make on every one of them — whether a parameter is copied, exposed or lent read-only. Then the two things that make a codebase rather than a file: when objects are created and destroyed, and how to split one source file into headers and translation units the linker can join.",
  order: 2,
  status: "available",
  lessons: [
    branchingLesson,
    loopsLesson,
    functionsLesson,
    passingParametersLesson,
    overloadingLesson,
    scopeLifetimeLesson,
    headersOdrLesson,
  ],
};
