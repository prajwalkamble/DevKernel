import type { TrackDefinition } from "@/content/types";
import { createComingSoonModule } from "@/content/comingSoon";
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

/**
 * React from nothing to mastery, on React 19.
 *
 * The order is chosen so that nothing is used before it is explained. Props
 * arrive in module 3, before any hook, because a component that only takes
 * props is the simplest thing React can be. Hooks then get two modules — one
 * for the four you use daily and one for the rest — because "learning hooks"
 * is where most people stall. Rendering (client, server, hydration and Server
 * Components) is module 12, once there is enough vocabulary for it to mean
 * something.
 */
export const reactTrack: TrackDefinition = {
  id: "react",
  slug: "react",
  title: "React",
  shortTitle: "React",
  tagline: "Components, props and hooks, all the way to concurrent rendering",
  description:
    "React from the first component to the parts most people never learn properly. You start by creating an app and rendering JSX, meet props and state, then work through every hook — what each one is for, the rules they obey, and the bugs you get when you break them. From there: forms, effects and data fetching, context and state architecture, the rendering behaviour behind every performance problem, then concurrent React, Suspense, and the difference between client rendering, server rendering, hydration and Server Components. Ends with testing, TypeScript, the patterns real codebases use, and the interview questions.",
  order: 4,
  status: "available",
  accent: "react",
  mode: "learn",
  lessonMinutes: [25, 40],
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
    createComingSoonModule({
      id: "react-rendering-models",
      slug: "client-and-server-rendering",
      title: "Client, Server & Hydration",
      order: 12,
      description:
        "The whole rendering picture in one place: what CSR, SSR, SSG and Server Components each mean, what hydration is, and which problem each one solves.",
      topics: [
        "Client-side rendering: the empty div, and what it costs",
        "Server-side rendering, and the HTML that arrives already filled in",
        "Hydration: attaching React to server-rendered HTML",
        "Hydration mismatches, and the four things that cause them",
        "Static generation and when the HTML can be built ahead of time",
        "React Server Components: what runs where, and what never ships",
        "The 'use client' boundary, and what may cross it",
        "Choosing a rendering strategy per screen rather than per app",
      ],
    }),
    createComingSoonModule({
      id: "react-testing",
      slug: "testing-typescript-tooling",
      title: "Testing, TypeScript & Tooling",
      order: 13,
      description:
        "Making a React codebase maintainable: types that catch real mistakes, tests that survive a refactor, and the build tooling underneath.",
      topics: [
        "Typing components, props, children, events and refs",
        "Generic components, and typing a custom hook's return",
        "Testing Library: querying the way a user would",
        "Testing interaction, async UI, and forms",
        "Mocking network requests with MSW instead of stubbing fetch",
        "Component testing against end-to-end testing with Playwright",
        "Vite, bundling, and what a modern React build actually does",
        "ESLint, the hooks plugin, and the rules worth enforcing",
      ],
    }),
    createComingSoonModule({
      id: "react-mastery",
      slug: "patterns-and-mastery",
      title: "Patterns, Ecosystem & Interview Mastery",
      order: 14,
      description:
        "The consolidation pass: the patterns that show up in every large codebase, the ecosystem decisions worth having an opinion about, and the questions interviews use to separate familiarity from understanding.",
      topics: [
        "Compound components, slots, and headless component design",
        "Container/presentational, and what replaced it",
        "Designing a component API other people enjoy using",
        "Accessibility in React: focus, roles, labels and keyboard support",
        "Animation, portals, and escaping the component tree",
        "Reading unfamiliar React and reviewing it well",
        "The classic interview questions, answered properly",
        "A component-design walkthrough, end to end",
      ],
    }),
  ],
};
