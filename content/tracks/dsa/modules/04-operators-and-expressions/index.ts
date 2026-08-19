import type { ModuleDefinition } from "@/content/types";
import { arithmeticOperatorsLesson } from "./lesson-1-arithmetic-operators";
import { moduloLesson } from "./lesson-2-modulo";
import { comparisonEqualityLesson } from "./lesson-3-comparison-and-equality";
import { logicalOperatorsLesson } from "./lesson-4-logical-operators";
import { assignmentIncrementLesson } from "./lesson-5-assignment-and-increment";
import { bitwiseOperatorsLesson } from "./lesson-6-bitwise-operators";
import { precedenceLesson } from "./lesson-7-precedence-and-associativity";
import { ternaryLesson } from "./lesson-8-the-ternary-operator";

export const operatorsModule: ModuleDefinition = {
  id: "dsa-operators",
  slug: "operators-and-expressions",
  title: "Operators & Expressions",
  description:
    "Eight lines of syntax that look obvious and produce a surprising share of all wrong answers — integer division, negative modulo, and comparing objects when you meant values.",
  order: 4,
  status: "available",
  phase: "Module 0 · Programming Constructs",
  lessons: [
    arithmeticOperatorsLesson,
    moduloLesson,
    comparisonEqualityLesson,
    logicalOperatorsLesson,
    assignmentIncrementLesson,
    bitwiseOperatorsLesson,
    precedenceLesson,
    ternaryLesson,
  ],
};
