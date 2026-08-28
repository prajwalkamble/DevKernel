import type { ModuleDefinition } from "@/content/types";
import { whatUseStateStoresLesson } from "./lesson-1-what-usestate-stores";
import { updatesAreQueuedLesson } from "./lesson-2-updates-are-queued";
import { functionalUpdatesLesson } from "./lesson-3-functional-updates";
import { stateIsASnapshotLesson } from "./lesson-4-state-is-a-snapshot";
import { batchingLesson } from "./lesson-5-batching";
import { objectsAndArraysLesson } from "./lesson-6-objects-and-arrays";
import { eventsLesson } from "./lesson-7-events";
import { stateShapeLesson } from "./lesson-8-state-shape";

export const reactStateAndEventsModule: ModuleDefinition = {
  id: "react-state",
  slug: "state-and-events",
  title: "State & Events",
  description:
    "useState properly: what a state variable really is, why updates are asynchronous, and the batching behaviour that catches everyone once.",
  order: 4,
  status: "available",
  lessons: [
    whatUseStateStoresLesson,
    updatesAreQueuedLesson,
    functionalUpdatesLesson,
    stateIsASnapshotLesson,
    batchingLesson,
    objectsAndArraysLesson,
    eventsLesson,
    stateShapeLesson,
  ],
};
