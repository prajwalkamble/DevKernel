import type { ModuleDefinition } from "@/content/types";

import { greedyChoiceLesson } from "./lesson-1-the-greedy-choice";
import { exchangeArgumentLesson } from "./lesson-2-the-exchange-argument";
import { counterexampleLesson } from "./lesson-3-hunting-the-counterexample";
import { intervalSchedulingLesson } from "./lesson-4-interval-scheduling";
import { mergingIntervalsLesson } from "./lesson-5-merging-intervals";
import { huffmanLesson } from "./lesson-6-huffman-coding";
import { coinSystemsLesson } from "./lesson-7-coin-systems";
import { greedyVersusDpLesson } from "./lesson-8-greedy-versus-dp";

export const greedyModule: ModuleDefinition = {
  id: "dsa-greedy",
  slug: "greedy-algorithms",
  title: "Greedy Algorithms",
  description:
    "A strategy that is either optimal or badly wrong with nothing in between, so this module is mostly about proving which one you have. It starts where the difference is sharpest: the same three items and the same bag, greedy-optimal when they can be cut and wrong by 60 when they cannot. From there, the two tools that settle it — the exchange argument and the counterexample hunt — then four algorithms that survive them, and a closing lesson on what to do when nothing does.",
  order: 26,
  status: "available",
  phase: "Module 1 · Non-linear DSA",
  lessons: [
    greedyChoiceLesson,
    exchangeArgumentLesson,
    counterexampleLesson,
    intervalSchedulingLesson,
    mergingIntervalsLesson,
    huffmanLesson,
    coinSystemsLesson,
    greedyVersusDpLesson,
  ],
};
