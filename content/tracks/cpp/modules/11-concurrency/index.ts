import type { ModuleDefinition } from "@/content/types";
import { threadsLesson } from "./lesson-1-threads";
import { dataRacesLesson } from "./lesson-2-data-races";
import { mutexesLesson } from "./lesson-3-mutexes-and-deadlock";
import { conditionVariablesLesson } from "./lesson-4-condition-variables";
import { futuresLesson } from "./lesson-5-futures";
import { atomicsLesson } from "./lesson-6-atomics";
import { memoryModelLesson } from "./lesson-7-memory-model";

export const cppConcurrencyModule: ModuleDefinition = {
  id: "cpp-concurrency",
  slug: "concurrency",
  title: "Concurrency & Parallelism",
  description:
    "Threads, the memory model, and the primitives that make concurrent code correct rather than merely fast on the machine you tested it on. A data race losing 178,000 updates at `-O0` and producing a flawless answer at `-O2` — because the optimiser collapsed the loop to one instruction — with ThreadSanitizer catching it either way. A real deadlock hanging until it is killed, and the lock hierarchy that turns an ordering bug into a single-threaded exception. Then a producer/consumer queue with a shutdown path that actually terminates, the `std::async` destructor that silently serialised three parallel tasks, false sharing costing 6× on counters nobody shared, and the memory orderings measured down to the x86 instructions they compile to.",
  order: 11,
  status: "available",
  lessons: [
    threadsLesson,
    dataRacesLesson,
    mutexesLesson,
    conditionVariablesLesson,
    futuresLesson,
    atomicsLesson,
    memoryModelLesson,
  ],
};
