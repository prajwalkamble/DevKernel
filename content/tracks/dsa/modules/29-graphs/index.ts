import type { ModuleDefinition } from "@/content/types";

import { modellingLesson } from "./lesson-1-modelling-a-problem-as-a-graph";
import { representationsLesson } from "./lesson-2-representations";
import { vocabularyLesson } from "./lesson-3-directed-weighted-and-acyclic";
import { depthFirstSearchLesson } from "./lesson-4-depth-first-search";
import { breadthFirstSearchLesson } from "./lesson-5-breadth-first-search";
import { visitedSetLesson } from "./lesson-6-the-visited-set";
import { componentsLesson } from "./lesson-7-components-and-flood-fill";
import { cycleDetectionLesson } from "./lesson-8-cycle-detection";

export const graphsModule: ModuleDefinition = {
  id: "dsa-graphs",
  slug: "graphs",
  title: "Graphs: Modelling, BFS & DFS",
  description:
    "The most general structure here, and the one most real problems turn out to be. Two traversals cover a surprising share of everything — but the traversals are the easy part, so this module starts where the difficulty actually is: deciding what a node is, how to store it, and which of the three words in the problem statement changes the algorithm. Eight lessons: modelling, representations, the vocabulary, the two traversals, the visited set, components and flood fill, and cycle detection.",
  order: 29,
  status: "available",
  phase: "Module 1 · Non-linear DSA",
  lessons: [
    modellingLesson,
    representationsLesson,
    vocabularyLesson,
    depthFirstSearchLesson,
    breadthFirstSearchLesson,
    visitedSetLesson,
    componentsLesson,
    cycleDetectionLesson,
  ],
};
