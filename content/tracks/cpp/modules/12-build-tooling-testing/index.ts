import type { ModuleDefinition } from "@/content/types";
import { cmakeLesson } from "./lesson-1-cmake";
import { dependenciesLesson } from "./lesson-2-dependencies";
import { modulesLesson } from "./lesson-3-modules";
import { packageManagersLesson } from "./lesson-4-package-managers";
import { sanitizersLesson } from "./lesson-5-sanitizers";
import { staticAnalysisLesson } from "./lesson-6-static-analysis";
import { testingLesson } from "./lesson-7-testing-and-ci";

export const cppToolingModule: ModuleDefinition = {
  id: "cpp-tooling",
  slug: "build-tooling-testing",
  title: "Build Systems, Tooling & Testing",
  description:
    "The parts of C++ that are not the language, and that decide whether a project is pleasant or miserable to work on. Modern CMake as targets carrying usage requirements, and the `PUBLIC`/`PRIVATE` distinction that decides what your consumers inherit. Dependencies found, fetched or vendored, and why C++ needed thirty years to get a package manager — the ABI problem, stated concretely. Then the tools that find what testing cannot: sanitizers turning undefined behaviour into a diagnostic, a warning set producing nine real findings from one small file, GCC's path-sensitive analyzer catching a leak on an early-return path, and a CI pipeline assembling all of it.",
  order: 12,
  status: "available",
  lessons: [
    cmakeLesson,
    dependenciesLesson,
    modulesLesson,
    packageManagersLesson,
    sanitizersLesson,
    staticAnalysisLesson,
    testingLesson,
  ],
};
