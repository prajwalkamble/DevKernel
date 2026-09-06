import type { ModuleDefinition } from "@/content/types";

import { modellingLesson } from "./lesson-1-modelling-a-problem-as-a-graph";
import { representationsLesson } from "./lesson-2-representations";
import { vocabularyLesson } from "./lesson-3-directed-weighted-and-acyclic";

export const graphsModule: ModuleDefinition = {
  id: "dsa-graphs",
  slug: "graphs",
  title: "Graphs: Modelling, BFS & DFS",
  description:
    "The most general structure here, and the one most real problems turn out to be. Two traversals cover a surprising share of everything — but the traversals are the easy part, so this module starts where the difficulty actually is: deciding what a node is. In progress: the two traversals, the visited-set discipline, components and flood fill, and cycle detection are still to come.",
  order: 29,
  status: "available",
  phase: "Module 1 · Non-linear DSA",
  lessons: [modellingLesson, representationsLesson, vocabularyLesson],
};
