import type { ModuleDefinition } from "@/content/types";
import { copyingLesson } from "./lesson-1-copying";
import { valueCategoriesLesson } from "./lesson-2-value-categories";
import { moveOperationsLesson } from "./lesson-3-move-operations";
import { stdMoveLesson } from "./lesson-4-std-move";
import { ruleOfFiveLesson } from "./lesson-5-rule-of-five";
import { copyElisionLesson } from "./lesson-6-copy-elision";
import { completeClassLesson } from "./lesson-7-complete-class";

export const cppCopyMoveModule: ModuleDefinition = {
  id: "cpp-copy-move",
  slug: "copy-move-rule-of-five",
  title: "Copy, Move & the Rule of Five",
  description:
    "What happens when an object is copied, and what changed when C++11 let you steal from a value nobody needs any more. The generated copy is exactly right for a class of standard members and catastrophically wrong for one holding a raw pointer; move semantics make transfers cheap, but only if you get one keyword right. Ends with the rule of zero — the observation that the best version of all this is code you never write — and a complete resource-owning class tested under a sanitizer.",
  order: 5,
  status: "available",
  lessons: [
    copyingLesson,
    valueCategoriesLesson,
    moveOperationsLesson,
    stdMoveLesson,
    ruleOfFiveLesson,
    copyElisionLesson,
    completeClassLesson,
  ],
};
