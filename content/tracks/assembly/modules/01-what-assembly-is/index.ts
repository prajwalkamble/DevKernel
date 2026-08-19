import type { ModuleDefinition } from "@/content/types";
import { whatIsAssemblyLesson } from "./lesson-1-what-is-assembly";
import { howCpuWorksLesson } from "./lesson-2-how-a-cpu-works";
import { sourceToProcessLesson } from "./lesson-3-source-to-process";
import { readingFirstProgramLesson } from "./lesson-4-reading-first-program";
import { toolchainLesson } from "./lesson-5-toolchain";

export const asmFoundationsModule: ModuleDefinition = {
  id: "asm-what-assembly-is",
  slug: "what-assembly-is",
  title: "What Assembly Is & How a Machine Runs Code",
  description:
    "Start at absolute zero: what assembly language actually is, why it is still written, and what a CPU is really doing when it runs a program — then follow a C file through every stage of the build, read a complete working NASM program line by line, and watch it execute one instruction at a time in a debugger.",
  order: 1,
  status: "available",
  lessons: [
    whatIsAssemblyLesson,
    howCpuWorksLesson,
    sourceToProcessLesson,
    readingFirstProgramLesson,
    toolchainLesson,
  ],
};
