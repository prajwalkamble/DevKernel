import type { ModuleDefinition } from "@/content/types";
import { callbacksLesson } from "./lesson-1-callbacks";
import { promisesLesson } from "./lesson-2-promises";
import { asyncAwaitLesson } from "./lesson-3-async-await";
import { eventLoopLesson } from "./lesson-4-event-loop";
import { tsAsyncTypesLesson } from "./lesson-5-ts-async-types";
import { cancellationLesson } from "./lesson-6-cancellation";

export const asyncModule: ModuleDefinition = {
  id: "async",
  slug: "async",
  title: "Asynchronous JS/TS",
  description:
    "Callbacks, Promises, async/await, the event loop and the micro/macrotask queues explained precisely, plus typed Promises and robust error-handling patterns in TypeScript.",
  order: 5,
  status: "available",
  lessons: [
    callbacksLesson,
    promisesLesson,
    asyncAwaitLesson,
    eventLoopLesson,
    tsAsyncTypesLesson,
    cancellationLesson,
  ],
};
