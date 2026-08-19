import type { ModuleDefinition } from "@/content/types";
import { testingFundamentalsLesson } from "./lesson-1-testing-fundamentals";
import { typingTestsLesson } from "./lesson-2-typing-tests";
import { testableCodeLesson } from "./lesson-3-testable-code";
import { devtoolsDebuggingLesson } from "./lesson-4-devtools-debugging";
import { sourceMapsLesson } from "./lesson-5-source-maps";
import { asyncClosureBugsLesson } from "./lesson-6-async-closure-bugs";

export const testingDebuggingModule: ModuleDefinition = {
  id: "testing-debugging",
  slug: "testing-debugging",
  title: "Testing & Debugging",
  description:
    "Unit testing fundamentals with Vitest, typing mocks and fixtures so tests cannot drift from the code they check, writing code that is testable in the first place, debugging with DevTools and the Node inspector, source maps for compiled TypeScript, and the async and closure bugs that never produce a useful stack trace.",
  order: 11,
  status: "available",
  lessons: [
    testingFundamentalsLesson,
    typingTestsLesson,
    testableCodeLesson,
    devtoolsDebuggingLesson,
    sourceMapsLesson,
    asyncClosureBugsLesson,
  ],
};
