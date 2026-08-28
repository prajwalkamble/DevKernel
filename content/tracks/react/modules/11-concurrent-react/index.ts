import type { ModuleDefinition } from "@/content/types";
import { whatConcurrentRenderingChangedLesson } from "./lesson-1-what-changed";
import { suspenseLesson } from "./lesson-2-suspense";
import { transitionsLesson } from "./lesson-3-transitions";
import { useDeferredValueLesson } from "./lesson-4-usedeferredvalue";
import { errorBoundariesLesson } from "./lesson-5-error-boundaries";
import { streamingLesson } from "./lesson-6-streaming";
import { theUseHookLesson } from "./lesson-7-the-use-hook";
import { strictModeLesson } from "./lesson-8-strict-mode";

export const reactConcurrentModule: ModuleDefinition = {
  id: "react-concurrent",
  slug: "concurrent-react",
  title: "Concurrent React, Suspense & Transitions",
  description:
    "The rendering model React 18 introduced: interruptible rendering, and the APIs that let you tell React what is urgent.",
  order: 11,
  status: "available",
  lessons: [
    whatConcurrentRenderingChangedLesson,
    suspenseLesson,
    transitionsLesson,
    useDeferredValueLesson,
    errorBoundariesLesson,
    streamingLesson,
    theUseHookLesson,
    strictModeLesson,
  ],
};
