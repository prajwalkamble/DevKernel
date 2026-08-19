import type { ModuleDefinition } from "@/content/types";
import { unionsIntersectionsLesson } from "./lesson-1-unions-intersections";
import { narrowingLesson } from "./lesson-2-narrowing-discriminated-unions";
import { advancedGenericsLesson } from "./lesson-3-advanced-generics";
import { utilityTypesLesson } from "./lesson-4-utility-types";
import { mappedConditionalLesson } from "./lesson-5-mapped-conditional-types";
import { templateLiteralsDecoratorsLesson } from "./lesson-6-template-literals-decorators";

export const typeSystemModule: ModuleDefinition = {
  id: "type-system",
  slug: "type-system",
  title: "TypeScript Type System Deep Dive",
  description:
    "The advanced type system features that separate intermediate from expert TypeScript: unions, discriminated unions, advanced generics, utility types, mapped and conditional types, template literal types, and decorators.",
  order: 6,
  status: "available",
  lessons: [
    unionsIntersectionsLesson,
    narrowingLesson,
    advancedGenericsLesson,
    utilityTypesLesson,
    mappedConditionalLesson,
    templateLiteralsDecoratorsLesson,
  ],
};
