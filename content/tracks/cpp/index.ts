import type { TrackDefinition } from "@/content/types";
import { cppFoundationsModule } from "./modules/01-foundations";
import { cppFunctionsModule } from "./modules/02-control-flow-functions";
import { cppMemoryModule } from "./modules/03-memory-pointers-references";
import { cppClassesModule } from "./modules/04-classes-constructors-destructors";
import { cppCopyMoveModule } from "./modules/05-copy-move-rule-of-five";
import { cppInheritanceModule } from "./modules/06-inheritance-polymorphism";
import { cppTemplatesModule } from "./modules/07-templates-generics";
import { cppStdlibModule } from "./modules/08-standard-library";
import { cppModernModule } from "./modules/09-modern-cpp-idioms";
import { cppErrorsModule } from "./modules/10-error-handling";
import { cppConcurrencyModule } from "./modules/11-concurrency";
import { cppToolingModule } from "./modules/12-build-tooling-testing";
import { cppPerformanceModule } from "./modules/13-performance-systems";
import { cppProductionModule } from "./modules/14-production-cpp";

/**
 * C++ taught as a language you have never written, and carried all the way to
 * code you would put in production.
 *
 * The shape of the syllabus follows from that. Module 1 starts at "what is this
 * and why does it exist" and does not assume you have ever compiled anything;
 * you declare a variable and read your first error message before any concept
 * arrives. Pointers and memory land in module 3, before classes, because RAII in
 * module 4 is meaningless until you know what a resource is. The track ends on a
 * production module rather than a quiz: designing types other people depend on,
 * structuring a real codebase, and taking two complete applications from an
 * empty directory to something you could ship.
 *
 * Baseline is C++20, which is what a new project should target today. C++23
 * features are used where they change the recommended answer — `std::expected`
 * and `std::print` in particular — and are always labelled as such, because you
 * will meet plenty of codebases that cannot use them yet.
 */
export const cppTrack: TrackDefinition = {
  id: "cpp",
  slug: "cpp",
  title: "C++",
  shortTitle: "C++",
  tagline: "From your first variable to production systems, with nothing skipped",
  description:
    "C++ from absolute zero — what it is, how a source file becomes an executable, and how to declare your first variable — through to writing production software in it. You learn functions and control flow, then memory and pointers, then classes, constructors and destructors and the RAII idea that makes C++ safe without a garbage collector. From there: move semantics, polymorphism, templates, the standard library, exception safety, concurrency, build systems and performance. The track finishes on production work — designing types other people depend on, structuring a real codebase, and shipping two complete applications.",
  order: 10,
  status: "available",
  accent: "cpp",
  mode: "learn",
  lessonMinutes: [25, 40],
  interviewPrep: true,
  runnable: false,
  modules: [
    cppFoundationsModule,
    cppFunctionsModule,
    cppMemoryModule,
    cppClassesModule,
    cppCopyMoveModule,
    cppInheritanceModule,
    cppTemplatesModule,
    cppStdlibModule,
    cppModernModule,
    cppErrorsModule,
    cppConcurrencyModule,
    cppToolingModule,
    cppPerformanceModule,
    cppProductionModule,
  ],
};
