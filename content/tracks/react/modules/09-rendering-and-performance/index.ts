import type { ModuleDefinition } from "@/content/types";
import { whatCausesARerenderLesson } from "./lesson-1-what-causes-a-rerender";
import { rerenderingIsNotTheProblemLesson } from "./lesson-2-rerendering-is-not-the-problem";
import { reactMemoLesson } from "./lesson-3-react-memo";
import { useMemoUseCallbackLesson } from "./lesson-4-usememo-usecallback";
import { referentialEqualityLesson } from "./lesson-5-referential-equality";
import { reactCompilerLesson } from "./lesson-6-react-compiler";
import { profilingLesson } from "./lesson-7-profiling";
import { virtualisationAndSplittingLesson } from "./lesson-8-virtualisation-and-splitting";

export const reactRenderingAndPerformanceModule: ModuleDefinition = {
  id: "react-performance",
  slug: "rendering-and-performance",
  title: "Rendering Behaviour & Performance",
  description:
    "Why a component re-rendered, how to find out, and the small set of fixes that actually work — plus the React Compiler, which changes the calculus.",
  order: 9,
  status: "available",
  lessons: [
    whatCausesARerenderLesson,
    rerenderingIsNotTheProblemLesson,
    reactMemoLesson,
    useMemoUseCallbackLesson,
    referentialEqualityLesson,
    reactCompilerLesson,
    profilingLesson,
    virtualisationAndSplittingLesson,
  ],
};
