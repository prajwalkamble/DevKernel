import type { ModuleDefinition } from "@/content/types";
import { classicPatternsLesson } from "./lesson-1-classic-patterns";
import { functionalPatternsLesson } from "./lesson-2-functional-patterns";
import { errorHandlingLesson } from "./lesson-3-error-handling";
import { structuringApplicationsLesson } from "./lesson-4-structuring-applications";
import { migrationLesson } from "./lesson-5-js-to-ts-migration";
import { incrementalTypingLesson } from "./lesson-6-incremental-typing";

export const designPatternsModule: ModuleDefinition = {
  id: "design-patterns",
  slug: "design-patterns",
  title: "Design Patterns & Architecture",
  description:
    "Common JavaScript/TypeScript design patterns and the language features that replaced several of them, functional patterns worth adopting, error-handling architecture with custom error classes and Result types, how to structure an application several people work on, and a step-by-step guide to migrating an existing JavaScript project to TypeScript.",
  order: 10,
  status: "available",
  lessons: [
    classicPatternsLesson,
    functionalPatternsLesson,
    errorHandlingLesson,
    structuringApplicationsLesson,
    migrationLesson,
    incrementalTypingLesson,
  ],
};
