import type { ModuleDefinition } from "@/content/types";

import { fixedWindowsLesson } from "./lesson-1-fixed-windows";
import { variableWindowsLesson } from "./lesson-2-variable-windows";
import { monotonicityLesson } from "./lesson-3-monotonicity";
import { atMostKLesson } from "./lesson-4-at-most-k";
import { windowStateLesson } from "./lesson-5-window-state";
import { minimumWindowLesson } from "./lesson-6-minimum-window";
import { windowMaximumLesson } from "./lesson-7-window-maximum";
import { windowSheetLesson } from "./lesson-8-the-sheet";

export const slidingWindowsModule: ModuleDefinition = {
  id: "dsa-sliding-window",
  slug: "sliding-windows",
  title: "Sliding Windows",
  description:
    "\"Longest or shortest contiguous stretch such that…\" — one shape, a dozen problems, and one condition that decides whether it applies at all. Fixed windows and the one-in-one-out update; the grow-right shrink-left skeleton and the amortised argument that keeps a nested loop linear; and then the monotonicity requirement, demonstrated failing on a single negative number so that you can rule the pattern out rather than trust it. Then the at-most-k subtraction that rescues \"exactly k\", minimum window substring worked slowly, and the deque you need when the state is a maximum rather than a sum.",
  order: 17,
  status: "available",
  phase: "Module 1 · Linear DSA",
  lessons: [
    fixedWindowsLesson,
    variableWindowsLesson,
    monotonicityLesson,
    atMostKLesson,
    windowStateLesson,
    minimumWindowLesson,
    windowMaximumLesson,
    windowSheetLesson,
  ],
};
