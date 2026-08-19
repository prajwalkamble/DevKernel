import type { ModuleDefinition } from "@/content/types";
import { introLesson } from "./lesson-1-intro";
import { variablesLesson } from "./lesson-2-variables";
import { primitiveTypesLesson } from "./lesson-3-primitive-types";
import { operatorsCoercionLesson } from "./lesson-4-operators-coercion";
import { controlFlowLesson } from "./lesson-5-control-flow";
import { functionsBasicsLesson } from "./lesson-6-functions-basics";
import { arraysObjectsBasicsLesson } from "./lesson-7-arrays-objects-basics";

export const fundamentalsModule: ModuleDefinition = {
  id: "fundamentals",
  slug: "fundamentals",
  title: "Fundamentals",
  description:
    "Start here. The absolute basics of JavaScript and TypeScript, taught side by side — variables, types, operators, control flow, functions, and data structures.",
  order: 1,
  status: "available",
  lessons: [
    introLesson,
    variablesLesson,
    primitiveTypesLesson,
    operatorsCoercionLesson,
    controlFlowLesson,
    functionsBasicsLesson,
    arraysObjectsBasicsLesson,
  ],
};
