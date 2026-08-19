import type { ModuleDefinition } from "@/content/types";
import { whatIsReactLesson } from "./lesson-1-what-is-react";
import { creatingAnAppLesson } from "./lesson-2-creating-an-app";
import { jsxAndComponentsLesson } from "./lesson-3-jsx-and-components";
import { propsLesson } from "./lesson-4-props";
import { stateAndHooksLesson } from "./lesson-5-state-and-hooks";
import { firstAppLesson } from "./lesson-6-first-app";

export const reactFoundationsModule: ModuleDefinition = {
  id: "react-foundations",
  slug: "foundations",
  title: "What React Is & Your First App",
  description:
    "Start at absolute zero: what React is and the problem it removes, then create an app, write components, pass props, add state with your first hook, and finish by building a complete working interface. Modules 2 to 6 return to each of these properly — this one gets you to something that runs.",
  order: 1,
  status: "available",
  lessons: [
    whatIsReactLesson,
    creatingAnAppLesson,
    jsxAndComponentsLesson,
    propsLesson,
    stateAndHooksLesson,
    firstAppLesson,
  ],
};
