import type { ModuleDefinition } from "@/content/types";

import { dijkstraLesson } from "./lesson-1-dijkstra";
import { bellmanFordLesson } from "./lesson-2-bellman-ford";
import { floydWarshallLesson } from "./lesson-3-floyd-warshall";
import { zeroOneBfsLesson } from "./lesson-4-zero-one-bfs";
import { topologicalSortLesson } from "./lesson-5-topological-sort";

export const graphAlgorithmsModule: ModuleDefinition = {
  id: "dsa-graph-algorithms",
  slug: "graph-algorithms",
  title: "Graph Algorithms: Shortest Paths, MST & Ordering",
  description:
    "The named algorithms, each introduced by the problem that forced its invention — and the conditions under which each one is wrong. In progress: minimum spanning trees, union-find and strongly connected components are still to come.",
  order: 30,
  status: "available",
  phase: "Module 1 · Non-linear DSA",
  lessons: [dijkstraLesson, bellmanFordLesson, floydWarshallLesson, zeroOneBfsLesson, topologicalSortLesson],
};
