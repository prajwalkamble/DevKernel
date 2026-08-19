import type { ModuleDefinition } from "@/content/types";
import { questionBankLesson } from "./lesson-1-question-bank";
import { outputPredictionLesson } from "./lesson-2-output-prediction";
import { codingProblemsLesson } from "./lesson-3-coding-problems";
import { tradeoffsLesson } from "./lesson-4-tradeoffs";
import { mockInterviewsLesson } from "./lesson-5-mock-interviews";
import { behaviouralLesson } from "./lesson-6-behavioural";

export const interviewMasteryModule: ModuleDefinition = {
  id: "interview-mastery",
  slug: "interview-mastery",
  title: "Interview Mastery",
  description:
    "The consolidation pass over everything in this track: a cross-topic question bank answered at the depth interviewers listen for, output-prediction puzzles with verified results, the utility implementations that come up far more often than algorithms, how to argue a trade-off, three interview rounds written as transcripts, and the behavioural questions engineers reliably under-prepare for.",
  order: 12,
  status: "available",
  lessons: [
    questionBankLesson,
    outputPredictionLesson,
    codingProblemsLesson,
    tradeoffsLesson,
    mockInterviewsLesson,
    behaviouralLesson,
  ],
};
