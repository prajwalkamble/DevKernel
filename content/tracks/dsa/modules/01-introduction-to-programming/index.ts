import type { ModuleDefinition } from "@/content/types";
import { whatAProgramIsLesson } from "./lesson-1-what-a-program-is";
import { yourFirstProgramLesson } from "./lesson-2-your-first-program";
import { variablesAndValuesLesson } from "./lesson-3-variables-and-values";
import { statementsAndExpressionsLesson } from "./lesson-4-statements-and-expressions";
import { commentsAndNamingLesson } from "./lesson-5-comments-and-naming";
import { errorsLesson } from "./lesson-6-errors";
import { readingAProblemStatementLesson } from "./lesson-7-reading-a-problem-statement";
import { testingAndDebuggingLesson } from "./lesson-8-testing-and-debugging-by-hand";

export const introductionToProgrammingModule: ModuleDefinition = {
  id: "dsa-introduction-to-programming",
  slug: "introduction-to-programming",
  title: "Introduction to Programming",
  description:
    "The ground floor, assumed by every course that starts at arrays and the reason people bounce off them. What a program actually is, what it does to memory, and how to turn a paragraph of English into code that runs.",
  order: 1,
  status: "available",
  phase: "Module 0 · Programming Constructs",
  lessons: [
    whatAProgramIsLesson,
    yourFirstProgramLesson,
    variablesAndValuesLesson,
    statementsAndExpressionsLesson,
    commentsAndNamingLesson,
    errorsLesson,
    readingAProblemStatementLesson,
    testingAndDebuggingLesson,
  ],
};
