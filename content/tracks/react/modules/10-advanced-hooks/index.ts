import type { ModuleDefinition } from "@/content/types";
import { writingACustomHookLesson } from "./lesson-1-writing-a-custom-hook";
import { useIdLesson } from "./lesson-2-useid";
import { refsAndImperativeHandlesLesson } from "./lesson-3-refs-and-imperative-handles";
import { useSyncExternalStoreLesson } from "./lesson-4-usesyncexternalstore";
import { useDebugValueLesson } from "./lesson-5-usedebugvalue";
import { composingHooksLesson } from "./lesson-6-composing-hooks";
import { libraryOfHooksLesson } from "./lesson-7-a-library-of-hooks";
import { testingAHookLesson } from "./lesson-8-testing-a-hook";

export const reactAdvancedHooksModule: ModuleDefinition = {
  id: "react-advanced-hooks",
  slug: "advanced-and-custom-hooks",
  title: "Advanced Hooks & Custom Hooks",
  description:
    "The remaining built-in hooks, and how to extract your own so that logic is reusable without a wrapper component.",
  order: 10,
  status: "available",
  lessons: [
    writingACustomHookLesson,
    useIdLesson,
    refsAndImperativeHandlesLesson,
    useSyncExternalStoreLesson,
    useDebugValueLesson,
    composingHooksLesson,
    libraryOfHooksLesson,
    testingAHookLesson,
  ],
};
