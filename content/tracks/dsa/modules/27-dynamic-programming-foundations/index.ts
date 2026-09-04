import type { ModuleDefinition } from "@/content/types";

import { twoPreconditionsLesson } from "./lesson-1-the-two-preconditions";
import { bruteForceToMemoisationLesson } from "./lesson-2-brute-force-to-memoisation";
import { definingTheStateLesson } from "./lesson-3-defining-the-state";
import { theRecurrenceLesson } from "./lesson-4-the-recurrence-and-its-base-cases";

export const dpFoundationsModule: ModuleDefinition = {
  id: "dsa-dp-foundations",
  slug: "dynamic-programming-foundations",
  title: "Dynamic Programming: Foundations",
  description:
    "The technique people find hardest, taught the only way that works: start from a recursion you already believe, then make it fast. It opens on the diagnosis rather than the tables — the two preconditions, one of them measurable in six lines and the other the reason people write fast programs that print wrong answers. In progress: top-down against bottom-up, dropping a dimension, and reconstructing the answer rather than its value are still to come.",
  order: 27,
  status: "available",
  phase: "Module 1 · Non-linear DSA",
  lessons: [
    twoPreconditionsLesson,
    bruteForceToMemoisationLesson,
    definingTheStateLesson,
    theRecurrenceLesson,
  ],
};
