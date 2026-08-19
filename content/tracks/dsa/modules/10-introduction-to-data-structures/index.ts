import type { ModuleDefinition } from "@/content/types";

import { whatADataStructureIsLesson } from "./lesson-1-what-a-data-structure-is";
import { theMapLesson } from "./lesson-2-the-map";
import { dynamicArraysLesson } from "./lesson-3-dynamic-arrays";
import { hashMapsAndSetsLesson } from "./lesson-4-hash-maps-and-sets";
import { keysAndHashingLesson } from "./lesson-5-keys-and-hashing";
import { stacksQueuesDequesLesson } from "./lesson-6-stacks-queues-deques";
import { heapsLesson } from "./lesson-7-heaps";
import { orderedAndChoosingLesson } from "./lesson-8-ordered-and-choosing";

export const introductionToDataStructuresModule: ModuleDefinition = {
  id: "dsa-intro-data-structures",
  slug: "introduction-to-data-structures",
  title: "Introduction to Data Structures",
  description:
    "The survey before the deep dive: what every structure costs, what each one is for, and how to pick one from the operations a problem needs rather than from memory.",
  order: 10,
  status: "available",
  phase: "Module 0 · Programming Constructs",
  lessons: [
    whatADataStructureIsLesson,
    theMapLesson,
    dynamicArraysLesson,
    hashMapsAndSetsLesson,
    keysAndHashingLesson,
    stacksQueuesDequesLesson,
    heapsLesson,
    orderedAndChoosingLesson,
  ],
};
