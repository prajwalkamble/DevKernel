import type { ModuleDefinition } from "@/content/types";
import { ifElseLesson } from "./lesson-1-if-else";
import { switchMatchLesson } from "./lesson-2-switch-and-match";
import { threeLoopsLesson } from "./lesson-3-three-kinds-of-loop";
import { loopInvariantsLesson } from "./lesson-4-loop-invariants";
import { breakContinueLesson } from "./lesson-5-break-and-continue";
import { nestedLoopsLesson } from "./lesson-6-nested-loops";
import { offByOneLesson } from "./lesson-7-off-by-one";
import { infiniteLoopsLesson } from "./lesson-8-infinite-loops";

export const conditionalsAndLoopsModule: ModuleDefinition = {
  id: "dsa-conditionals-and-loops",
  slug: "conditional-statements-and-loops",
  title: "Conditional Statements & Loops",
  description:
    "Branching and repetition, which between them are most of programming — plus the loop invariant, the one idea that turns a loop you hope is right into one you can prove is.",
  order: 5,
  status: "available",
  phase: "Module 0 · Programming Constructs",
  lessons: [
    ifElseLesson,
    switchMatchLesson,
    threeLoopsLesson,
    loopInvariantsLesson,
    breakContinueLesson,
    nestedLoopsLesson,
    offByOneLesson,
    infiniteLoopsLesson,
  ],
};
