import type { ModuleDefinition } from "@/content/types";
import { closuresLesson } from "./lesson-1-closures";
import { hoistingLesson } from "./lesson-2-hoisting";
import { thisLesson } from "./lesson-3-this";
import { callApplyBindLesson } from "./lesson-4-call-apply-bind";
import { higherOrderFunctionsLesson } from "./lesson-5-higher-order-functions";
import { tsFunctionTypesGenericsLesson } from "./lesson-6-ts-function-types-generics";

export const functionsScopeModule: ModuleDefinition = {
  id: "functions-scope",
  slug: "functions-scope",
  title: "Functions & Scope Deep Dive",
  description:
    "Go beyond the basics: closures, hoisting internals, the this keyword in depth, call/apply/bind, higher-order functions, and TypeScript function types, overloads, and an introduction to generics.",
  order: 2,
  status: "available",
  lessons: [
    closuresLesson,
    hoistingLesson,
    thisLesson,
    callApplyBindLesson,
    higherOrderFunctionsLesson,
    tsFunctionTypesGenericsLesson,
  ],
};
