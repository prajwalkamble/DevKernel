import type { ModuleDefinition } from "@/content/types";
import { designingClassLesson } from "./lesson-1-designing-a-class";
import { codebaseStructureLesson } from "./lesson-2-codebase-structure";
import { observabilityLesson } from "./lesson-3-observability";
import { edgesLesson } from "./lesson-4-edges";
import { readingReviewingLesson } from "./lesson-5-reading-and-reviewing";
import { projectCliLesson } from "./lesson-6-project-cli";
import { projectServerLesson } from "./lesson-7-project-server";

export const cppProductionModule: ModuleDefinition = {
  id: "cpp-production",
  slug: "production-cpp",
  title: "Production C++: Designing & Shipping Real Applications",
  description:
    "The consolidation pass: turning working C++ into C++ other people can depend on. Designing a class around its invariant and making the invalid states unrepresentable, so the checks you were going to write become unnecessary. Physical design as the thing that actually controls build times, and the pimpl destructor that fails with an incomplete-type error if you forget it. Configuration validated once at startup, logs as structured events rather than sentences, and the filesystem and socket edges where TOCTOU races and partial reads live. Ends with two complete programs: a command-line tool verified against the system `wc`, and a concurrent TCP service driven by six clients through thirty round trips with zero ThreadSanitizer warnings.",
  order: 14,
  status: "available",
  lessons: [
    designingClassLesson,
    codebaseStructureLesson,
    observabilityLesson,
    edgesLesson,
    readingReviewingLesson,
    projectCliLesson,
    projectServerLesson,
  ],
};
