import type { ModuleDefinition } from "@/content/types";
import { jsxVsTsxLesson } from "./lesson-1-jsx-vs-tsx";
import { typingPropsLesson } from "./lesson-2-typing-props";
import { typingStateLesson } from "./lesson-3-typing-state";
import { contextRefsHooksLesson } from "./lesson-4-context-refs-hooks";
import { genericComponentsLesson } from "./lesson-5-generic-components";
import { typedPatternsLesson } from "./lesson-6-typed-patterns";

/**
 * This module is about types applied to React, not about React — the React
 * track teaches components, props and hooks themselves. Keeping the scope
 * narrow is deliberate: the two would otherwise cover the same ground twice,
 * and the interesting material here is the friction between the two systems.
 */
export const reactModule: ModuleDefinition = {
  id: "react",
  slug: "react",
  title: "React with JS vs TS",
  description:
    "Applying TypeScript to React: what the .tsx extension changes, typing props, children and event handlers, state and reducers, context, refs and custom hooks, generic and polymorphic components, and the patterns real component libraries are built from. Assumes you know React — the React track teaches that.",
  order: 9,
  status: "available",
  lessons: [
    jsxVsTsxLesson,
    typingPropsLesson,
    typingStateLesson,
    contextRefsHooksLesson,
    genericComponentsLesson,
    typedPatternsLesson,
  ],
};
