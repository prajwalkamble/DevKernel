import type { Lesson } from "@/content/types";

export const rerenderingIsNotTheProblemLesson: Lesson = {
  id: "react-rerendering-not-the-problem",
  slug: "re-rendering-is-not-the-problem",
  moduleSlug: "rendering-and-performance",
  title: "Re-rendering Is Not the Problem",
  summary:
    "201 components re-render and React writes one thing to the DOM. Counted, so that the difference between a render and a DOM write stops being a claim — and so the optimisation you were about to do can be aimed at the right thing.",
  estimatedMinutes: 25,
  objectives: [
    "Separate a render from a DOM write, and measure both",
    "Say what a render actually costs",
    "Identify the four things that make a render genuinely expensive",
    "Resist optimising a render count that is not costing anything",
    "Choose the fix that matches the actual cost",
  ],
  sections: [
    {
      id: "counted",
      heading: "A render is not a DOM write",
      visual: {
        id: "render-vs-dom-visual",
        kind: "react-perf",
        algorithm: "render-vs-dom",
        title: "Seven components run; one text node changes",
      },
      body: [
        "The word \"re-render\" sounds like re-drawing. It is not. A render is React calling your function and getting back objects, which it then compares with the previous objects. The DOM is only touched where they differ.",
        "Count both and the gap is obvious.",
      ],
      examples: [
        {
          id: "renders-vs-mutations",
          title: "201 renders, one mutation",
          lang: "tsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

let componentRenders = 0;

function Row({ label }: { label: string }) {
  componentRenders++;
  return <li>{label}</li>;
}

function App() {
  const [n, setN] = useState(0);
  const [tick, setTick] = useState(0);
  componentRenders++;
  return (
    <div>
      {/* Changes state without changing anything on screen. */}
      <button type="button" id="quiet" onClick={() => setN((x) => x + 1)}>quiet</button>
      {/* Changes one text node. */}
      <button type="button" id="loud" onClick={() => setTick((x) => x + 1)}>loud</button>
      <output>{tick}</output>
      <ul>{Array.from({ length: 200 }, (_, i) => <Row key={i} label={\`row \${i}\`} />)}</ul>
      <span hidden>{n > 1000 ? "never" : ""}</span>
    </div>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
act(() => { createRoot(container).render(<App />); });
console.log(\`mount: \${componentRenders} component renders\`);

/* Count what React actually writes to the DOM, which is the expensive part. */
let mutations = 0;
const observer = new MutationObserver((records) => { mutations += records.length; });
observer.observe(container, { childList: true, subtree: true, characterData: true, attributes: true });

function click(id: string, label: string) {
  componentRenders = 0;
  mutations = 0;
  act(() => { container.querySelector<HTMLButtonElement>(\`#\${id}\`)!.click(); });
  observer.takeRecords().forEach(() => { mutations++; });
  console.log(\`\${label.padEnd(34)} \${componentRenders} components re-rendered, \${mutations} DOM mutations\`);
}

click("quiet", "state changed, screen identical:");
click("loud", "state changed, one number moved:");`,
          output: `mount: 201 component renders
state changed, screen identical:   201 components re-rendered, 0 DOM mutations
state changed, one number moved:   201 components re-rendered, 1 DOM mutations`,
          explanation:
            "Two hundred and one components re-rendered and the browser was asked to change **one text node**. That ratio is what reconciliation is for: React does cheap work in JavaScript so it can avoid expensive work in the DOM, and the render count is a measure of the cheap half.",
        },
      ],
      pitfalls: [
        {
          title: "The DOM is the expensive part, and it is the part you did not count",
          body: "Reading `offsetHeight`, changing a class that alters layout, inserting a node — those force the browser to recompute layout and paint, and they are orders of magnitude more expensive than calling a function that returns an object. An optimisation that reduces renders while leaving the DOM writes alone has usually optimised the cheap half.",
        },
      ],
    },
    {
      id: "what-a-render-costs",
      heading: "What a render actually costs",
      body: [
        "Rendering a simple component is: call the function, allocate a few objects, walk the previous tree comparing types and props. On modern hardware that is measured in microseconds.",
        "So a component that re-renders unnecessarily fifty times a second and does nothing but return a `<span>` is not a performance problem. It shows up as a red flash in the DevTools Profiler and costs nothing a user can perceive, and \"fixing\" it with `memo` adds a comparison, a cached prop object, and a `useCallback` to the parent — which is often *more* work than it removed.",
        "The number that matters is not renders per second. It is **how long the longest frame took**, and whether anything was waiting on it.",
      ],
    },
    {
      id: "expensive",
      heading: "The four things that make a render genuinely expensive",
      body: [
        "**Volume.** A thousand components rendering is a thousand function calls and a thousand comparisons. This is real, and the fix is usually to render fewer — virtualisation, pagination — rather than to memoise each one.",
        "**Expensive work in the body.** Sorting ten thousand rows, parsing a large blob, running a formatter over every cell. This is where `useMemo` genuinely pays, because you are caching something that actually cost something.",
        "**Layout thrash.** Reading a DOM measurement and then writing to the DOM, in a loop, forces the browser to recompute layout each time. Usually a `useLayoutEffect` that measures children one at a time.",
        "**A deep tree that re-renders on every keystroke.** Not because any single render is slow, but because their sum lands inside the sixteen milliseconds a frame gets, and the input starts to lag.",
        "Notice what is not on the list: a component re-rendering when its props did not change. That is only a problem when it also does one of the four.",
      ],
      pitfalls: [
        {
          title: "The order to work in",
          body: "Measure first — lesson 7. Then, in order: render fewer components, make individual renders cheaper, and only then stop components from rendering at all. Most people start at the third, which is the one with the highest cost in code and the smallest payoff.",
        },
      ],
    },
    {
      id: "when-to-care",
      heading: "When to actually care",
      body: [
        "Concrete signals, so that \"it feels slow\" turns into something you can act on.",
        "**Typing lags.** The user types and characters appear late. Every keystroke is re-rendering a tree that takes longer than a frame.",
        "**A visible pause on an interaction.** Opening a menu, switching a tab, expanding a row — anything over about 100ms reads as sluggish.",
        "**Scroll jank.** Frames dropped while scrolling, which usually means work in a scroll handler or too many nodes.",
        "**A slow initial load** — a bundle problem rather than a render problem, and the answer is code splitting, in lesson 8.",
        "If none of those is happening, your render counts are fine no matter what the Profiler colours them. Performance work has a cost — more code, more indirection, more ways to get a dependency array wrong — and spending it on an invisible problem makes the codebase worse for nothing.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Is a re-render expensive?",
      answer:
        "Usually not. A render is calling a function and comparing the objects it returned; only the differences reach the DOM. Two hundred components can re-render and produce a single DOM mutation. What is expensive is DOM work, and expensive computation in a component body — so the render count is a proxy for the cheap half of the process, and optimising it in isolation often adds more work than it removes.",
    },
    {
      question: "When is a render actually a problem?",
      answer:
        "Four cases: sheer volume, where thousands of components render; expensive work in a component body such as sorting a large list; layout thrash, where measuring and writing to the DOM interleave; and a deep tree that re-renders on every keystroke, where no single render is slow but the sum exceeds a frame. Outside those, unnecessary re-renders are a diagnostic curiosity rather than a cost.",
    },
    {
      question: "How do you decide whether to optimise?",
      answer:
        "By a user-visible symptom, not a render count: typing that lags, an interaction that pauses for more than about a tenth of a second, dropped frames while scrolling, or a slow first load. Then measure to find where the time goes, and fix in order — render fewer components, make each render cheaper, and only then prevent renders. Starting with `memo` is starting with the most code and the least effect.",
    },
  ],
  takeaways: [
    "A render is a function call and a comparison; only differences reach the DOM",
    "201 components can re-render and produce one DOM mutation",
    "The DOM is the expensive half, and it is the half render counts do not measure",
    "Genuine costs: volume, expensive work in the body, layout thrash, and a deep tree on every keystroke",
    "The number that matters is the longest frame, not renders per second",
    "Act on symptoms — lagging input, a visible pause, scroll jank, slow load",
    "Fix in order: render fewer, render cheaper, then prevent renders",
  ],
  status: "available",
};
