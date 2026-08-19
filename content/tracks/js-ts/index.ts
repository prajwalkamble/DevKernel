import type { TrackDefinition } from "@/content/types";
import { fundamentalsModule } from "./modules/01-fundamentals";
import { functionsScopeModule } from "./modules/02-functions-scope";
import { oopPrototypesModule } from "./modules/03-oop-prototypes";
import { arraysCollectionsModule } from "./modules/04-arrays-collections";
import { asyncModule } from "./modules/05-async";
import { typeSystemModule } from "./modules/06-type-system";
import { modulesToolingModule } from "./modules/07-modules-tooling";
import { domBrowserModule } from "./modules/08-dom-browser";
import { reactModule } from "./modules/09-react";
import { designPatternsModule } from "./modules/10-design-patterns";
import { testingDebuggingModule } from "./modules/11-testing-debugging";
import { interviewMasteryModule } from "./modules/12-interview-mastery";

export const jsTsTrack: TrackDefinition = {
  id: "js-ts",
  slug: "js-ts",
  title: "JavaScript & TypeScript",
  shortTitle: "JS/TS",
  tagline: "The web's language, and the type system that made it scale",
  description:
    "Every concept taught in JavaScript and TypeScript side by side, so you learn what the language does and what types add on top of it — from your first variable through closures, prototypes, the event loop, the advanced type system, modules and tooling, all the way to interview-ready mastery.",
  order: 3,
  status: "available",
  accent: "ts",
  mode: "learn",
  lessonMinutes: [20, 40],
  interviewPrep: true,
  runnable: true,
  modules: [
    fundamentalsModule,
    functionsScopeModule,
    oopPrototypesModule,
    arraysCollectionsModule,
    asyncModule,
    typeSystemModule,
    modulesToolingModule,
    domBrowserModule,
    reactModule,
    designPatternsModule,
    testingDebuggingModule,
    interviewMasteryModule,
  ],
};
