import type { TrackDefinition } from "@/content/types";
import { reactFoundationsModule } from "./modules/01-foundations";
import { reactJsxAndRenderingModule } from "./modules/02-jsx-and-rendering";
import { reactComponentsAndPropsModule } from "./modules/03-components-and-props";
import { reactStateAndEventsModule } from "./modules/04-state-and-events";
import { reactCoreHooksModule } from "./modules/05-core-hooks";
import { reactListsKeysFormsModule } from "./modules/06-lists-keys-forms";
import { reactEffectsAndDataModule } from "./modules/07-effects-and-data";
import { reactContextAndStateModule } from "./modules/08-context-and-state";
import { reactRenderingAndPerformanceModule } from "./modules/09-rendering-and-performance";
import { reactAdvancedHooksModule } from "./modules/10-advanced-hooks";
import { reactConcurrentModule } from "./modules/11-concurrent-react";
import { reactRenderingModelsModule } from "./modules/12-rendering-models";
import { reactTestingAndToolingModule } from "./modules/13-testing-and-tooling";
import { reactPatternsAndMasteryModule } from "./modules/14-patterns-and-mastery";
import { reactCapstoneModule } from "./modules/15-capstone-project";

/**
 * React from nothing to mastery, on React 19.
 *
 * The order is chosen so that nothing is used before it is explained. Props
 * arrive in module 3, before any hook, because a component that only takes
 * props is the simplest thing React can be. Hooks then get two modules — one
 * for the four you use daily and one for the rest — because "learning hooks"
 * is where most people stall. Rendering (client, server, hydration and Server
 * Components) is module 12, once there is enough vocabulary for it to mean
 * something. Module 15 is one project rather than more material:
 * everything above, applied at once, with the requirements written down
 * before any of it is built.
 */
export const reactTrack: TrackDefinition = {
  id: "react",
  slug: "react",
  title: "React",
  shortTitle: "React",
  tagline: "Components, props and hooks, all the way to concurrent rendering",
  description:
    "React from the first component to the parts most people never learn properly. You start by creating an app and rendering JSX, meet props and state, then work through every hook — what each one is for, the rules they obey, and the bugs you get when you break them. From there: forms, effects and data fetching, context and state architecture, the rendering behaviour behind every performance problem, then concurrent React, Suspense, and the difference between client rendering, server rendering, hydration and Server Components. Ends with testing, TypeScript, the patterns real codebases use, then a capstone module: Tracer, a bug tracker in the shape of a small Bugzilla or Jira, specified with numbered requirements and built end to end — a React front end over an HTTP API and a database you also write, ending with the triage queue where every earlier decision has to hold at once.",
  order: 4,
  status: "available",
  accent: "react",
  mode: "learn",
  lessonMinutes: [20, 45],
  interviewPrep: true,
  runnable: true,
  modules: [
    reactFoundationsModule,
    reactJsxAndRenderingModule,
    reactComponentsAndPropsModule,
    reactStateAndEventsModule,
    reactCoreHooksModule,
    reactListsKeysFormsModule,
    reactEffectsAndDataModule,
    reactContextAndStateModule,
    reactRenderingAndPerformanceModule,
    reactAdvancedHooksModule,
    reactConcurrentModule,
    reactRenderingModelsModule,
    reactTestingAndToolingModule,
    reactPatternsAndMasteryModule,
    reactCapstoneModule,
  ],
};
