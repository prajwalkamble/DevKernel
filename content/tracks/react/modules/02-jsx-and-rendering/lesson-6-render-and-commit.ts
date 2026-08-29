import type { Lesson } from "@/content/types";

export const renderAndCommitLesson: Lesson = {
  id: "react-render-and-commit",
  slug: "render-and-commit",
  moduleSlug: "jsx-and-rendering",
  title: "The Render Phase & the Commit Phase",
  summary:
    "React does its work in two distinct passes with different rules. Knowing which pass your code is in explains why render must be pure, why effects exist at all, and why Strict Mode runs your component twice.",
  estimatedMinutes: 30,
  objectives: [
    "Name what happens in the render phase and what happens in the commit phase",
    "State the three rules that make a render pure, and why each is required",
    "Predict the order in which components in a tree are rendered",
    "Explain what Strict Mode's double invocation is testing for",
    "Say where a side effect belongs, and why it cannot go in the render body",
  ],
  sections: [
    {
      id: "two-phases",
      heading: "Two passes, two sets of rules",
      body: [
        "A React update happens in two phases, and almost every confusing thing about React lives on the boundary between them.",
        "**Render.** React calls your component functions and collects the elements they return, building a tree it can compare with the previous one. Nothing is on screen yet. This phase may be paused, resumed, restarted from the beginning, or thrown away entirely — which is why it must not have side effects. There is no guarantee that a render you started is a render that finishes.",
        "**Commit.** React applies the differences to the DOM in one synchronous, uninterruptible pass, then assigns refs, then runs layout effects, and finally — after the browser has painted — runs passive effects. Once commit starts it runs to completion, which is what stops the user ever seeing a half-updated screen.",
        "Read those two paragraphs again with `useEffect` in mind and the hook stops being arbitrary. An effect is *how you get code to run in the commit phase*, because the render phase is the wrong place for anything that touches the world.",
      ],
      visual: {
        id: "render-commit-visual",
        kind: "react-rendering",
        algorithm: "render-commit",
        title: "One update, both phases",
        lockAlgorithm: true,
      },
    },
    {
      id: "purity",
      heading: "What \"render must be pure\" actually forbids",
      body: [
        "Three rules, and each one exists because a render may be discarded or repeated.",
        "**The same inputs must produce the same output.** Given the same props, state and context, a component must return the same elements. React relies on this when it re-runs a render it abandoned.",
        "**Do not mutate anything that existed before the render.** Not props, not state, not a module-level variable, not an object you received. Creating and mutating something *during* the render — a local array you then map — is fine, because nothing outside can observe it.",
        "**Do not do anything observable.** No network requests, no timers, no writing to `localStorage`, no `document.title`. Those belong in event handlers when they respond to something a user did, and in effects when they synchronise with something outside React.",
      ],
      examples: [
        {
          id: "impure-render",
          title: "An impure render, and the same render made pure",
          lang: "jsx",
          code: `import { renderToStaticMarkup as render } from "react-dom/server";

// Impure: reads and writes a variable that outlives the render.
let seen = 0;
function Impure() {
  seen++;
  return <p>{seen}</p>;
}

// Pure: the output is a function of the input, and nothing else changes.
function Pure({ n }) {
  return <p>{n}</p>;
}

console.log("impure, first render: ", render(<Impure />));
console.log("impure, second render:", render(<Impure />));
console.log("pure, first render:   ", render(<Pure n={1} />));
console.log("pure, second render:  ", render(<Pure n={1} />));`,
          output: `impure, first render:  <p>1</p>
impure, second render: <p>2</p>
pure, first render:    <p>1</p>
pure, second render:   <p>1</p>`,
          explanation:
            "Two identical renders of `Impure` produced different output. That is the entire definition of the bug: React is allowed to render a component an extra time, or to discard a render and redo it, and a component like this changes its answer when it does. `Pure` gives the same answer however many times it is called, so React can call it freely.",
          alternates: [
            {
              lang: "tsx",
              code: `import { renderToStaticMarkup as render } from "react-dom/server";

// Impure: reads and writes a variable that outlives the render. Nothing in the
// type system objects — purity is a rule about behaviour, not about types.
let seen = 0;
function Impure() {
  seen++;
  return <p>{seen}</p>;
}

// Pure: the output is a function of the input, and nothing else changes.
function Pure({ n }: { n: number }) {
  return <p>{n}</p>;
}

console.log("impure, first render: ", render(<Impure />));
console.log("impure, second render:", render(<Impure />));
console.log("pure, first render:   ", render(<Pure n={1} />));
console.log("pure, second render:  ", render(<Pure n={1} />));`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Mutating a prop is the version of this that looks harmless",
          body: "`props.items.sort()` inside a render sorts the caller's array in place, because `sort` mutates. The component appears to work, and then a sibling that shares the same array renders in a different order, or a `useMemo` upstream returns a value that has quietly changed underneath it. Copy first: `[...props.items].sort()`, or `props.items.toSorted()`.",
        },
      ],
    },
    {
      id: "order",
      heading: "The order components render in",
      body: [
        "React renders depth-first, parent before child. A parent must run before its children because its return value is what *says* which children exist and what props they get — the child elements do not exist until the parent has produced them.",
        "Effects run in the opposite direction: child before parent, because by the time a parent's effect runs it is entitled to assume its children are mounted and their refs are set.",
        "That inversion is worth holding on to. Render flows down, commit-time work settles upward.",
      ],
      examples: [
        {
          id: "render-order",
          title: "Depth-first, parent before child",
          lang: "jsx",
          code: `import { renderToStaticMarkup as render } from "react-dom/server";

function Leaf({ n }) {
  console.log("      Leaf", n);
  return <li>{n}</li>;
}

function Branch() {
  console.log("   Branch");
  return (
    <ul>
      <Leaf n={1} />
      <Leaf n={2} />
    </ul>
  );
}

function Root() {
  console.log("Root");
  return <main><Branch /></main>;
}

const html = render(<Root />);
console.log("markup:", html);`,
          output: `Root
   Branch
      Leaf 1
      Leaf 2
markup: <main><ul><li>1</li><li>2</li></ul></main>`,
          explanation:
            "`Root` ran first and `Leaf 2` last. Nothing appeared on screen while any of this was happening — the markup only exists once the whole tree has been walked. On a client render this is the point where React would then begin the commit phase and touch the DOM for the first time.",
          alternates: [
            {
              lang: "tsx",
              code: `import { renderToStaticMarkup as render } from "react-dom/server";

function Leaf({ n }: { n: number }) {
  console.log("      Leaf", n);
  return <li>{n}</li>;
}

function Branch() {
  console.log("   Branch");
  return (
    <ul>
      <Leaf n={1} />
      <Leaf n={2} />
    </ul>
  );
}

function Root() {
  console.log("Root");
  return <main><Branch /></main>;
}

const html = render(<Root />);
console.log("markup:", html);`,
            },
          ],
        },
      ],
    },
    {
      id: "strict-mode",
      heading: "Why Strict Mode runs your component twice",
      body: [
        "In development, `<StrictMode>` calls each component function **twice** for every render and throws the first result away. It is not a bug, it is not a performance warning, and it does not happen in production.",
        "It is a purity test. A pure component returns the same thing both times and you never notice. An impure one — the counter above, a `push` into a module array, an id generated with `Math.random()` — produces different results on the two calls, and the discrepancy shows up immediately rather than as an intermittent bug months later under concurrent rendering.",
        "Strict Mode also mounts, unmounts and remounts each component once on first mount, which double-runs effects. That tests the other half of the contract: that every effect cleans up after itself well enough to be set up again.",
        "The correct response to \"my counter increments by two in development\" is never to remove Strict Mode. It is to find the state update or mutation that is happening during render.",
      ],
      pitfalls: [
        {
          title: "Generating an id during render breaks under double invocation",
          body: "`const id = Math.random()` or `crypto.randomUUID()` in a render body produces a different value each time the component runs — including on the discarded Strict Mode call, and on any render React restarts. The result is ids that change under the reader's feet, `htmlFor` that stops matching its input, and hydration mismatches between server and client. `useId` exists precisely for this: it returns a stable identifier tied to the component's position in the tree, identical on server and client.",
        },
      ],
    },
    {
      id: "where-code-goes",
      heading: "Where a piece of code belongs",
      body: [
        "**In the render body:** calculating what to display from props and state. Filtering a list, formatting a date, deciding a class name. If it can be worked out from the inputs, work it out here rather than storing it in state.",
        "**In an event handler:** anything that happens because a user did something. Sending the form, writing to storage, navigating. Handlers run outside both phases, so they may do whatever they like.",
        "**In an effect:** synchronising with something that is not React. A subscription, a websocket, an imperative DOM API, the document title. Module 7 argues — at length, with examples — that most effects people write should have been one of the other two.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between the render phase and the commit phase?",
      answer:
        "Render is when React calls your components and builds the new element tree, comparing it with the previous one. Nothing is on screen, and the work may be paused, restarted or discarded — so it must be pure. Commit is when React applies the differences to the DOM, in one synchronous pass that cannot be interrupted, then sets refs, runs layout effects, and after paint runs passive effects. Effects exist because commit is the only phase where touching the outside world is safe.",
    },
    {
      question: "Why does Strict Mode invoke components twice in development?",
      answer:
        "To surface impurity. React reserves the right to call a component more than once per update and to throw a render away, so a component whose output or side effects differ between two calls is broken in a way that only shows up intermittently. Double invocation makes that deterministic and immediate. It only happens in development, and it is paired with a double mount that double-runs effects to check that cleanup is correct.",
    },
    {
      question: "In what order do components render, and in what order do their effects run?",
      answer:
        "Render is depth-first, parent before child, because a parent's output determines which children exist at all. Effects run child before parent, so that by the time a parent's effect runs its children are mounted and their refs are populated. Render flows down the tree; commit-time work settles back up it.",
    },
  ],
  takeaways: [
    "Render builds the element tree and may be paused, restarted or thrown away; commit applies it to the DOM in one uninterruptible pass",
    "A pure render returns the same output for the same inputs, mutates nothing that predates it, and does nothing observable",
    "Effects exist because commit is the only phase in which touching the outside world is safe",
    "Components render depth-first, parent before child; effects run child before parent",
    "Strict Mode's double invocation is a purity test, and the fix is never to remove Strict Mode",
    "Derive in the render body, act in event handlers, synchronise in effects",
  ],
  status: "available",
};
