import type { ModuleDefinition } from "@/content/types";
import { whatJsxCompilesToLesson } from "./lesson-1-what-jsx-compiles-to";
import { elementsAndComponentsLesson } from "./lesson-2-elements-and-components";
import { expressionsInJsxLesson } from "./lesson-3-expressions-in-jsx";
import { attributesAndPropsLesson } from "./lesson-4-attributes-and-props";
import { fragmentsLesson } from "./lesson-5-fragments";
import { renderAndCommitLesson } from "./lesson-6-render-and-commit";
import { reconciliationLesson } from "./lesson-7-reconciliation";
import { listsAndKeysLesson } from "./lesson-8-lists-and-keys";

export const reactJsxAndRenderingModule: ModuleDefinition = {
  id: "react-jsx",
  slug: "jsx-and-rendering",
  title: "JSX & Rendering in Depth",
  description:
    "What JSX actually compiles to, how React turns a tree of elements into DOM, and why the render/commit split explains most of React's surprising behaviour.",
  order: 2,
  status: "available",
  lessons: [
    whatJsxCompilesToLesson,
    elementsAndComponentsLesson,
    expressionsInJsxLesson,
    attributesAndPropsLesson,
    fragmentsLesson,
    renderAndCommitLesson,
    reconciliationLesson,
    listsAndKeysLesson,
  ],
};
