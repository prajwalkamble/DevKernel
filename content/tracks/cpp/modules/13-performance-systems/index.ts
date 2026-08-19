import type { ModuleDefinition } from "@/content/types";
import { undefinedBehaviourLesson } from "./lesson-1-undefined-behaviour";
import { cachesLesson } from "./lesson-2-caches";
import { alignmentLesson } from "./lesson-3-alignment";
import { benchmarkingLesson } from "./lesson-4-benchmarking";
import { allocatorsLesson } from "./lesson-5-allocators";
import { inliningLesson } from "./lesson-6-inlining-and-lto";
import { lowLevelLesson } from "./lesson-7-low-level";

export const cppPerformanceModule: ModuleDefinition = {
  id: "cpp-performance",
  slug: "performance-systems",
  title: "Performance & Systems Programming",
  description:
    "Why fast C++ is mostly about data layout and undefined behaviour rather than clever code, and how to measure instead of guessing. Undefined behaviour shown as a premise the optimiser reasons from — a null check deleted, an infinite loop compiled to a bare `ret`. The memory hierarchy swept on real hardware from 3.4ns in L1 to 93ns in RAM, and a strided loop where halving the arithmetic saves nothing at all. Then padding measured halving a struct, four microbenchmark traps caught reporting work that never happened, an arena taking 200,019 allocations down to 7, and LTO turning a 665ms loop into 0.0ms by inlining across a translation unit and deleting it.",
  order: 13,
  status: "available",
  lessons: [
    undefinedBehaviourLesson,
    cachesLesson,
    alignmentLesson,
    benchmarkingLesson,
    allocatorsLesson,
    inliningLesson,
    lowLevelLesson,
  ],
};
