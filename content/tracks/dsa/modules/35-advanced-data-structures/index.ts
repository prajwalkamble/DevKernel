import type { ModuleDefinition } from "@/content/types";

import { triesLesson } from "./lesson-1-tries";
import { unionFindInAngerLesson } from "./lesson-2-union-find-in-anger";
import { fenwickTreesLesson } from "./lesson-3-fenwick-trees";
import { segmentTreesLesson } from "./lesson-4-segment-trees";
import { lazyPropagationLesson } from "./lesson-5-lazy-propagation";
import { sparseTablesLesson } from "./lesson-6-sparse-tables";
import { orderStatisticTreesLesson } from "./lesson-7-order-statistic-trees";
import { choosingAStructureLesson } from "./lesson-8-choosing-a-structure";

export const advancedDataStructuresModule: ModuleDefinition = {
  id: "dsa-advanced-structures",
  slug: "advanced-data-structures",
  title: "Advanced Data Structures",
  description:
    "The structures that answer a question no simpler structure can answer fast — prefix queries, range queries with updates, and connectivity with relations. Eight lessons: tries, union-find with a value per node, Fenwick trees, segment trees, lazy propagation, sparse tables, order-statistic trees, and choosing between them by measured cost.",
  order: 35,
  status: "available",
  phase: "Electives · Advanced DSA",
  lessons: [
    triesLesson,
    unionFindInAngerLesson,
    fenwickTreesLesson,
    segmentTreesLesson,
    lazyPropagationLesson,
    sparseTablesLesson,
    orderStatisticTreesLesson,
    choosingAStructureLesson,
  ],
};
