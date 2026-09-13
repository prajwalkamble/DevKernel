import type { ModuleDefinition } from "@/content/types";

import { sixtySecondsLesson } from "./lesson-1-sixty-seconds";
import { constraintsBackwardsLesson } from "./lesson-2-constraints-backwards";
import { tellsAndTrapsLesson } from "./lesson-3-tells-and-traps";
import { windowOrPrefixMapLesson } from "./lesson-4-window-or-prefix-map";
import { greedyOrDpLesson } from "./lesson-5-greedy-or-dp";
import { twoPatternsLesson } from "./lesson-6-two-patterns-both-apply";
import { decisionTreeLesson } from "./lesson-7-your-own-decision-tree";
import { spacingPatternsLesson } from "./lesson-8-spacing-patterns";

export const patternAtlasModule: ModuleDefinition = {
  id: "dsa-pattern-atlas",
  slug: "pattern-atlas-drills",
  title: "The Pattern Atlas: Recognition Drills",
  description:
    "Drills in which you are forbidden to write code. You read a statement and name the pattern, the structure and the target complexity — because that is the step you are actually missing, and practising it separately is the fastest way to fix it. Eight lessons: the sixty-second drill, reading the constraints backwards, the phrases that give a pattern away and the ones that mislead, two pairs of near-identical statements taken apart with measurements, what to do when two patterns both apply, growing a decision tree from your own misses, and spacing repetitions over patterns rather than over problems.",
  order: 31,
  status: "available",
  phase: "Module 1 · The Grind",
  lessons: [
    sixtySecondsLesson,
    constraintsBackwardsLesson,
    tellsAndTrapsLesson,
    windowOrPrefixMapLesson,
    greedyOrDpLesson,
    twoPatternsLesson,
    decisionTreeLesson,
    spacingPatternsLesson,
  ],
};
