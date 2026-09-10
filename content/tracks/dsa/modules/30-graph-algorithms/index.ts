import type { ModuleDefinition } from "@/content/types";

import { dijkstraLesson } from "./lesson-1-dijkstra";
import { bellmanFordLesson } from "./lesson-2-bellman-ford";
import { floydWarshallLesson } from "./lesson-3-floyd-warshall";
import { zeroOneBfsLesson } from "./lesson-4-zero-one-bfs";
import { topologicalSortLesson } from "./lesson-5-topological-sort";
import { unionFindLesson } from "./lesson-6-union-find";
import { minimumSpanningTreesLesson } from "./lesson-7-minimum-spanning-trees";
import { stronglyConnectedComponentsLesson } from "./lesson-8-strongly-connected-components";

export const graphAlgorithmsModule: ModuleDefinition = {
  id: "dsa-graph-algorithms",
  slug: "graph-algorithms",
  title: "Graph Algorithms: Shortest Paths, MST & Ordering",
  description:
    "The named algorithms, each introduced by the problem that forced its invention — and the conditions under which each one is wrong. Eight lessons: Dijkstra and the settle-once claim, Bellman-Ford and negative cycles, Floyd-Warshall and the loop order, 0-1 BFS and the deque, topological sort and DAG dynamic programming, union-find, minimum spanning trees, and strongly connected components.",
  order: 30,
  status: "available",
  phase: "Module 1 · Non-linear DSA",
  lessons: [
    dijkstraLesson,
    bellmanFordLesson,
    floydWarshallLesson,
    zeroOneBfsLesson,
    topologicalSortLesson,
    unionFindLesson,
    minimumSpanningTreesLesson,
    stronglyConnectedComponentsLesson,
  ],
};
