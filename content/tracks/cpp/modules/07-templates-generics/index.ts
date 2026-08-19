import type { ModuleDefinition } from "@/content/types";
import { functionTemplatesLesson } from "./lesson-1-function-templates";
import { classTemplatesLesson } from "./lesson-2-class-templates";
import { specialisationLesson } from "./lesson-3-specialisation";
import { variadicTemplatesLesson } from "./lesson-4-variadic-templates";
import { constexprLesson } from "./lesson-5-constexpr";
import { conceptsLesson } from "./lesson-6-concepts";
import { sfinaeLesson } from "./lesson-7-sfinae";

export const cppTemplatesModule: ModuleDefinition = {
  id: "cpp-templates",
  slug: "templates-generics",
  title: "Templates & Generic Programming",
  description:
    "Writing code once and letting the compiler generate a version per type. Deduction and the decay that quietly drops a `const`, specialisation and the type traits built entirely out of it, parameter packs and the fold expressions that ended the recursion, and a prime sieve using `std::vector` that compiles down to a single `mov` instruction. Ends on concepts — what they fixed about error messages, measured against the same mistake made without them — and the SFINAE they replaced, which every codebase older than C++20 is still full of.",
  order: 7,
  status: "available",
  lessons: [
    functionTemplatesLesson,
    classTemplatesLesson,
    specialisationLesson,
    variadicTemplatesLesson,
    constexprLesson,
    conceptsLesson,
    sfinaeLesson,
  ],
};
