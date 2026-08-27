import type { ModuleDefinition } from "@/content/types";
import { typingComponentsLesson } from "./lesson-1-typing-components";
import { genericComponentsLesson } from "./lesson-2-generics-and-hooks";
import { testingLibraryLesson } from "./lesson-3-testing-library";
import { testingInteractionLesson } from "./lesson-4-testing-interaction";
import { mswLesson } from "./lesson-5-msw";
import { componentVsE2ELesson } from "./lesson-6-component-vs-e2e";
import { viteAndTheBuildLesson } from "./lesson-7-vite-and-the-build";
import { eslintLesson } from "./lesson-8-eslint";

export const reactTestingAndToolingModule: ModuleDefinition = {
  id: "react-testing",
  slug: "testing-typescript-tooling",
  title: "Testing, TypeScript & Tooling",
  description:
    "Making a React codebase maintainable: types that catch real mistakes, tests that survive a refactor, and the build tooling underneath.",
  order: 13,
  status: "available",
  lessons: [
    typingComponentsLesson,
    genericComponentsLesson,
    testingLibraryLesson,
    testingInteractionLesson,
    mswLesson,
    componentVsE2ELesson,
    viteAndTheBuildLesson,
    eslintLesson,
  ],
};
