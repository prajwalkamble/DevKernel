import type { ModuleDefinition } from "@/content/types";

import { twoPreconditionsLesson } from "./lesson-1-the-two-preconditions";
import { bruteForceToMemoisationLesson } from "./lesson-2-brute-force-to-memoisation";
import { definingTheStateLesson } from "./lesson-3-defining-the-state";
import { theRecurrenceLesson } from "./lesson-4-the-recurrence-and-its-base-cases";
import { topDownBottomUpLesson } from "./lesson-5-top-down-against-bottom-up";
import { droppingADimensionLesson } from "./lesson-6-dropping-a-dimension";
import { reconstructingTheAnswerLesson } from "./lesson-7-reconstructing-the-answer";
import { threeCostumesLesson } from "./lesson-8-one-problem-three-costumes";

export const dpFoundationsModule: ModuleDefinition = {
  id: "dsa-dp-foundations",
  slug: "dynamic-programming-foundations",
  title: "Dynamic Programming: Foundations",
  description:
    "The technique people find hardest, taught the only way that works: start from a recursion you already believe, then make it fast. It opens on the diagnosis rather than the tables — the two preconditions, one of them measurable in six lines and the other the reason people write fast programs that print wrong answers. From there it is the state as a sentence you can write down, the two halves of a recurrence and the base case people leave out, the same table filled in two orders, the rows that can be thrown away and what that costs, getting the actual answer back rather than its value, and a closing lesson on recognising a problem you have already solved wearing different clothes.",
  order: 27,
  status: "available",
  phase: "Module 1 · Non-linear DSA",
  lessons: [
    twoPreconditionsLesson,
    bruteForceToMemoisationLesson,
    definingTheStateLesson,
    theRecurrenceLesson,
    topDownBottomUpLesson,
    droppingADimensionLesson,
    reconstructingTheAnswerLesson,
    threeCostumesLesson,
  ],
};
