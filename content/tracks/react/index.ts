import type { TrackDefinition } from "@/content/types";
import { createComingSoonModule } from "@/content/comingSoon";
import { reactFoundationsModule } from "./modules/01-foundations";
import { reactJsxAndRenderingModule } from "./modules/02-jsx-and-rendering";
import { reactComponentsAndPropsModule } from "./modules/03-components-and-props";
import { reactStateAndEventsModule } from "./modules/04-state-and-events";
import { reactCoreHooksModule } from "./modules/05-core-hooks";

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
  status: "coming-soon",
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
    createComingSoonModule({
      id: "react-lists-forms",
      slug: "lists-keys-forms",
      title: "Lists, Keys & Forms",
      order: 6,
      description:
        "Rendering collections correctly, and the controlled-input model that makes React forms behave differently from HTML ones.",
      topics: [
        "Rendering arrays, and choosing a key that is actually stable",
        "The index-as-key bug, demonstrated rather than asserted",
        "Controlled against uncontrolled inputs",
        "Text inputs, checkboxes, radios, selects and textareas",
        "Form submission, preventDefault, and the platform form APIs",
        "Validation, error state, and showing errors at the right moment",
        "Resetting a component with a key, instead of an effect",
        "When to reach for a form library, and what it buys you",
      ],
    }),
    createComingSoonModule({
      id: "react-effects",
      slug: "effects-and-data",
      title: "Effects, Lifecycle & Data Fetching",
      order: 7,
      description:
        "The module that fixes most React bugs: when you actually need an effect, when you do not, and how to fetch data without race conditions.",
      topics: [
        "You might not need an effect: the cases that should be plain logic",
        "Synchronising with an external system, which is what effects are for",
        "Fetching in an effect, and the race condition nobody sees in development",
        "Cleanup, AbortController, and cancelling in flight",
        "Loading, error and empty states as first-class UI",
        "Subscriptions, timers, and event listeners done properly",
        "useLayoutEffect, and the one case where it is the right answer",
        "Why a data-fetching library exists, and what it removes",
      ],
    }),
    createComingSoonModule({
      id: "react-context",
      slug: "context-and-state-architecture",
      title: "Composition, Context & State Architecture",
      order: 8,
      description:
        "Where state should live in a real application, and the tools for sharing it without turning every component into a re-render trigger.",
      topics: [
        "Prop drilling, and when it is genuinely fine",
        "Context: creating, providing and consuming",
        "Why context is not a state manager, and what it costs on update",
        "useReducer, and state that changes in more than one way",
        "Combining reducer and context into a small store",
        "Splitting contexts to limit re-renders",
        "Choosing between local state, lifted state, context and a store",
        "Zustand, Redux Toolkit and Jotai, and when each earns its place",
      ],
    }),
    createComingSoonModule({
      id: "react-performance",
      slug: "rendering-and-performance",
      title: "Rendering Behaviour & Performance",
      order: 9,
      description:
        "Why a component re-rendered, how to find out, and the small set of fixes that actually work — plus the React Compiler, which changes the calculus.",
      topics: [
        "What causes a re-render, and what does not",
        "Re-rendering is not the problem; expensive rendering is",
        "React.memo, and the prop identity problem it runs into",
        "useMemo and useCallback: what they cost and when they pay",
        "Referential equality, and why your dependency array keeps firing",
        "The React Compiler, and what it memoises for you",
        "Profiling with React DevTools, and reading a flame graph",
        "Virtualising long lists, and code splitting with lazy and Suspense",
      ],
    }),
    createComingSoonModule({
      id: "react-advanced-hooks",
      slug: "advanced-and-custom-hooks",
      title: "Advanced Hooks & Custom Hooks",
      order: 10,
      description:
        "The remaining built-in hooks, and how to extract your own so that logic is reusable without a wrapper component.",
      topics: [
        "Writing a custom hook, and the rules it inherits",
        "useId, and stable ids across server and client",
        "useImperativeHandle and forwardRef — and ref as a prop in React 19",
        "useSyncExternalStore, and subscribing to something outside React",
        "useDebugValue and the DevTools story for custom hooks",
        "Composing hooks, and keeping their return shape usable",
        "A library of small hooks you will actually reuse",
        "Testing a custom hook in isolation",
      ],
    }),
    createComingSoonModule({
      id: "react-concurrent",
      slug: "concurrent-react",
      title: "Concurrent React, Suspense & Transitions",
      order: 11,
      description:
        "The rendering model React 18 introduced: interruptible rendering, and the APIs that let you tell React what is urgent.",
      topics: [
        "What concurrent rendering actually changed",
        "Suspense: declaring a loading boundary rather than a loading flag",
        "startTransition and useTransition, and marking work as non-urgent",
        "useDeferredValue, and keeping an input responsive",
        "Error boundaries, and pairing them with Suspense",
        "Streaming, and rendering a page in pieces",
        "The `use` hook, and reading a promise during render",
        "Strict Mode, double invocation, and what it is protecting you from",
      ],
    }),
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
