import type { ModuleDefinition } from "@/content/types";
import { exceptionsLesson } from "./lesson-1-exceptions";
import { safetyGuaranteesLesson } from "./lesson-2-safety-guarantees";
import { copyAndSwapLesson } from "./lesson-3-copy-and-swap";
import { noexceptLesson } from "./lesson-4-noexcept";
import { errorCodesLesson } from "./lesson-5-error-codes";
import { expectedLesson } from "./lesson-6-expected";
import { assertionsLesson } from "./lesson-7-assertions";

export const cppErrorsModule: ModuleDefinition = {
  id: "cpp-errors",
  slug: "error-handling",
  title: "Error Handling & Exception Safety",
  description:
    "Stack unwinding running every destructor on the way out — the mechanism RAII depends on — and the four guarantees a function can promise about what it leaves behind, measured on two classes that differ only in whether they build aside before committing. Then copy-and-swap, which gets self-assignment safety and the strong guarantee for free from one by-value parameter, and the single `noexcept` keyword that decides whether `vector` moves or copies on every reallocation. Ends by choosing deliberately between the four mechanisms: assertions for your bugs, `error_code` and `std::expected` for expected failures, exceptions for rare ones — and making the invalid state unrepresentable so you handle nothing at all.",
  order: 10,
  status: "available",
  lessons: [
    exceptionsLesson,
    safetyGuaranteesLesson,
    copyAndSwapLesson,
    noexceptLesson,
    errorCodesLesson,
    expectedLesson,
    assertionsLesson,
  ],
};
