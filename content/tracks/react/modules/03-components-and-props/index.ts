import type { ModuleDefinition } from "@/content/types";
import { whatMakesAComponentLesson } from "./lesson-1-what-makes-a-component";
import { propsInDepthLesson } from "./lesson-2-props-in-depth";
import { childrenLesson } from "./lesson-3-children";
import { readOnlyPropsLesson } from "./lesson-4-read-only-props";
import { functionsAsPropsLesson } from "./lesson-5-functions-as-props";
import { compositionLesson } from "./lesson-6-composition";
import { typingPropsLesson } from "./lesson-7-typing-props";
import { splittingAPageLesson } from "./lesson-8-splitting-a-page";
import { projectStructureLesson } from "./lesson-9-project-structure";

export const reactComponentsAndPropsModule: ModuleDefinition = {
  id: "react-props",
  slug: "components-and-props",
  title: "Components & Props",
  description:
    "The unit React is built from: a function that takes props and returns UI. Everything about passing data in, including the parts that go wrong — and where the resulting files belong on disk.",
  order: 3,
  status: "available",
  lessons: [
    whatMakesAComponentLesson,
    propsInDepthLesson,
    childrenLesson,
    readOnlyPropsLesson,
    functionsAsPropsLesson,
    compositionLesson,
    typingPropsLesson,
    splittingAPageLesson,
    projectStructureLesson,
  ],
};
