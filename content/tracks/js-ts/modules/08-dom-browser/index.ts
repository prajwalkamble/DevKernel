import type { ModuleDefinition } from "@/content/types";
import { selectingManipulatingLesson } from "./lesson-1-selecting-manipulating";
import { eventsLesson } from "./lesson-2-events";
import { fetchNetworkingLesson } from "./lesson-3-fetch-networking";
import { storageLesson } from "./lesson-4-storage";
import { typingTheDomLesson } from "./lesson-5-typing-the-dom";
import { modernApisLesson } from "./lesson-6-modern-apis";

export const domBrowserModule: ModuleDefinition = {
  id: "dom-browser",
  slug: "dom-browser",
  title: "DOM & Browser APIs",
  description:
    "Working with the DOM directly, event handling and delegation, fetch and networking, browser storage, and how to type all of it correctly in TypeScript — plus the platform APIs that replace code people still write by hand.",
  order: 8,
  status: "available",
  lessons: [
    selectingManipulatingLesson,
    eventsLesson,
    fetchNetworkingLesson,
    storageLesson,
    typingTheDomLesson,
    modernApisLesson,
  ],
};
