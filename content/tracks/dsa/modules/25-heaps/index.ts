import type { ModuleDefinition } from "@/content/types";

import { heapPropertyLesson } from "./lesson-1-the-heap-property";
import { siftingLesson } from "./lesson-2-sifting-and-building";

export const heapsModule: ModuleDefinition = {
  id: "dsa-heaps",
  slug: "heaps-and-priority-queues",
  title: "Heaps & Priority Queues",
  description:
    "The structure for \"the smallest thing so far\". A heap makes a much weaker promise than a search tree — a parent beats its children and nothing else is ordered — and that weakness is what buys an O(log n) repair with no rebalancing and an array with no pointers in it. The module starts from the invariant and the index arithmetic, then the two sifts, then the linear-time build that catches people out. In progress: lessons on the priority-queue API, top-K, the two-heap running median, k-way merge, when bucket sort wins outright, and heap-backed scheduling are still to come.",
  order: 25,
  status: "available",
  phase: "Module 1 · Non-linear DSA",
  lessons: [
    heapPropertyLesson,
    siftingLesson,
  ],
};
