import type { ModuleDefinition } from "@/content/types";

import { theStackLesson } from "./lesson-1-the-stack";
import { queuesAndDequesLesson } from "./lesson-2-queues-and-deques";
import { monotonicStackLesson } from "./lesson-3-the-monotonic-stack";
import { histogramLesson } from "./lesson-4-the-histogram";
import { monotonicDequeLesson } from "./lesson-5-the-monotonic-deque";
import { augmentingLesson } from "./lesson-6-augmenting";
import { recursionToIterationLesson } from "./lesson-7-recursion-to-iteration";
import { stacksQueuesSheetLesson } from "./lesson-8-the-sheet";

export const stacksAndQueuesModule: ModuleDefinition = {
  id: "dsa-stacks-queues",
  slug: "stacks-and-queues",
  title: "Stacks, Queues & Monotonic Structures",
  description:
    "Two structures with one rule each — and the monotonic variants that answer \"the next element greater than this one\" for every index in linear time. Starts with recognising nesting, which is the real skill, since the stack itself is three method calls. Then the queue and the implementation detail that decides whether it is O(1) or quietly quadratic, and the amortised argument that the two-stack queue demonstrates most cleanly. The monotonic stack and deque are given three lessons between them, including Largest Rectangle worked through in full, because that one problem is the key to the whole family. Ends on augmentation — storing the answer beside the data — which is the idea behind every advanced structure later in this track.",
  order: 23,
  status: "available",
  phase: "Module 1 · Linear DSA",
  lessons: [
    theStackLesson,
    queuesAndDequesLesson,
    monotonicStackLesson,
    histogramLesson,
    monotonicDequeLesson,
    augmentingLesson,
    recursionToIterationLesson,
    stacksQueuesSheetLesson,
  ],
};
