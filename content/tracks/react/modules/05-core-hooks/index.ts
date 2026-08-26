import type { ModuleDefinition } from "@/content/types";
import { whyHooksExistLesson } from "./lesson-1-why-hooks-exist";
import { rulesOfHooksLesson } from "./lesson-2-rules-of-hooks";
import { useEffectLesson } from "./lesson-3-useeffect";
import { dependencyArrayLesson } from "./lesson-4-dependency-array";
import { cleanupAndStrictModeLesson } from "./lesson-5-cleanup-and-strict-mode";
import { useRefLesson } from "./lesson-6-useref";
import { useContextLesson } from "./lesson-7-usecontext";
import { stateRefOrVariableLesson } from "./lesson-8-state-ref-or-variable";

export const reactCoreHooksModule: ModuleDefinition = {
  id: "react-hooks-core",
  slug: "core-hooks",
  title: "The Hooks You Use Every Day",
  description:
    "useState, useEffect, useRef and useContext — what each is for, what it is not for, and the rules that make them work at all.",
  order: 5,
  status: "available",
  lessons: [
    whyHooksExistLesson,
    rulesOfHooksLesson,
    useEffectLesson,
    dependencyArrayLesson,
    cleanupAndStrictModeLesson,
    useRefLesson,
    useContextLesson,
    stateRefOrVariableLesson,
  ],
};
