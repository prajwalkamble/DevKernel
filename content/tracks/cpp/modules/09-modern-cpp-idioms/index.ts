import type { ModuleDefinition } from "@/content/types";
import { uniquePtrLesson } from "./lesson-1-unique-ptr";
import { sharedPtrLesson } from "./lesson-2-shared-ptr";
import { lambdasLesson } from "./lesson-3-lambdas";
import { perfectForwardingLesson } from "./lesson-4-perfect-forwarding";
import { stdFunctionLesson } from "./lesson-5-std-function";
import { optionalVariantLesson } from "./lesson-6-optional-variant";
import { structuredBindingsLesson } from "./lesson-7-structured-bindings";

export const cppModernModule: ModuleDefinition = {
  id: "cpp-modern",
  slug: "modern-cpp-idioms",
  title: "Modern C++ Idioms",
  description:
    "The features that changed how C++ is written. Smart pointers that make a double free unrepresentable rather than merely unlikely, and the reference cycle that leaks anyway until one pointer is made weak. Lambdas taken apart as the classes the compiler writes them into, and the `[=]` in a member function that captures `this` rather than the members. Then perfect forwarding, the type erasure behind `std::function` and the six-times cost it carries, and the vocabulary types — `optional` and `variant` — that let a signature state absence and choice instead of encoding them in a sentinel.",
  order: 9,
  status: "available",
  lessons: [
    uniquePtrLesson,
    sharedPtrLesson,
    lambdasLesson,
    perfectForwardingLesson,
    stdFunctionLesson,
    optionalVariantLesson,
    structuredBindingsLesson,
  ],
};
