import type { ModuleDefinition } from "@/content/types";
import { propDrillingLesson } from "./lesson-1-prop-drilling";
import { compositionInsteadOfContextLesson } from "./lesson-2-composition";
import { whatContextCostsLesson } from "./lesson-3-what-context-costs";
import { useReducerLesson } from "./lesson-4-usereducer";
import { reducerContextStoreLesson } from "./lesson-5-reducer-context-store";
import { splittingContextsLesson } from "./lesson-6-splitting-contexts";
import { whereStateLivesLesson } from "./lesson-7-where-state-lives";
import { stateLibrariesLesson } from "./lesson-8-state-libraries";

export const reactContextAndStateModule: ModuleDefinition = {
  id: "react-context",
  slug: "context-and-state-architecture",
  title: "Composition, Context & State Architecture",
  description:
    "Where state should live in a real application, and the tools for sharing it without turning every component into a re-render trigger.",
  order: 8,
  status: "available",
  lessons: [
    propDrillingLesson,
    compositionInsteadOfContextLesson,
    whatContextCostsLesson,
    useReducerLesson,
    reducerContextStoreLesson,
    splittingContextsLesson,
    whereStateLivesLesson,
    stateLibrariesLesson,
  ],
};
