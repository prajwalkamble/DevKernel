import type { ModuleDefinition } from "@/content/types";
import { esmVsCommonJsLesson } from "./lesson-1-esm-vs-commonjs";
import { tsconfigLesson } from "./lesson-2-tsconfig-in-depth";
import { moduleResolutionLesson } from "./lesson-3-module-resolution";
import { buildToolsLesson } from "./lesson-4-build-tools";
import { jsxFundamentalsLesson } from "./lesson-5-jsx-fundamentals";
import { tsxTypingLesson } from "./lesson-6-tsx-typing-components";

export const modulesToolingModule: ModuleDefinition = {
  id: "modules-tooling",
  slug: "modules-tooling",
  title: "Modules & Tooling",
  description:
    "How code gets split across files and put back together: ES Modules against CommonJS, the tsconfig.json options that actually matter, how an import specifier becomes a file on disk, what modern build tools do and why they are fast, and JSX from its syntax to its typed props.",
  order: 7,
  status: "available",
  lessons: [
    esmVsCommonJsLesson,
    tsconfigLesson,
    moduleResolutionLesson,
    buildToolsLesson,
    jsxFundamentalsLesson,
    tsxTypingLesson,
  ],
};
