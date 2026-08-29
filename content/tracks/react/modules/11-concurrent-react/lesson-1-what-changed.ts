import type { Lesson } from "@/content/types";

export const whatConcurrentRenderingChangedLesson: Lesson = {
  id: "react-what-concurrent-rendering-changed",
  slug: "what-concurrent-rendering-changed",
  moduleSlug: "concurrent-react",
  title: "What Concurrent Rendering Actually Changed",
  summary:
    "React 18 replaced one indivisible render with work that can be paused, abandoned and prioritised. What that means in practice, the two things it changed under you with no code edit, and the honest limits of what it can fix.",
  estimatedMinutes: 30,
  objectives: [
    "Say what 'concurrent' means for a single-threaded renderer",
    "Explain why a render can now be thrown away",
    "Demonstrate automatic batching, and name what it replaced",
    "Use flushSync, and know why reaching for it is usually wrong",
    "Say what concurrent rendering does not fix",
  ],
  sections: [
    {
      id: "one-thread",
      heading: "Still one thread",
      body: [
        "Start by discarding the wrong picture. Concurrent React does not render on a second thread, does not use a worker, and does not make anything run in parallel. There is one thread, and React is on it, exactly as before.",
        "What changed is that a render is no longer **one indivisible task**. Before React 18, once React started rendering it ran to completion: every component in the tree, then the commit, then control back to the browser. If that took 80ms, the browser could not paint, could not scroll, and could not tell you that a key had been pressed, for 80ms.",
        "React 18 made the render loop able to **stop between components**, hand the thread back, and pick up where it left off — or throw away what it had and start again. That is the whole of it. Everything else in this module is a consequence.",
        "The word for that is *interruptible*, and it buys one thing: React can now find out that something more urgent happened while it was busy, and act on it.",
      ],
    },
    {
      id: "interruptible",
      heading: "The same render, interruptible",
      body: [
        "Now the same work with a loop that yields. Watch what happens to the keystroke, and watch how much work gets repeated.",
        "The trade is explicit: the interruptible run does **more** total work, because the abandoned units are rendered twice. It is slower by any measure of throughput. It also answers the keyboard in a few milliseconds instead of tens, and a user cannot perceive throughput.",
        "This is why concurrent rendering is not a performance feature and why enabling it will not make a slow app fast. It is a **responsiveness** feature, and the currency it pays in is wasted renders.",
      ],
      pitfalls: [
        {
          title: "A render can now run and never be committed",
          body: "This is the fact that breaks old code. If your component writes to something outside React while rendering — a counter, a cache, an analytics call — that write can happen for a render nobody ever sees, and it can happen more than once for one visible update. The rule 'render must be pure' stopped being advice about testability and became a correctness requirement, because React is now willing to throw a render away.",
        },
      ],
    },
    {
      id: "opt-in",
      heading: "What turned it on",
      body: [
        "`createRoot`. That is the whole opt-in — the API from module 1 that every React 19 app already uses. The old `ReactDOM.render` is gone in React 19, so there is no non-concurrent mode left to be in.",
        "But — and this matters — creating a concurrent root does not make your renders interruptible. **Everything is still urgent by default.** A `setState` in a click handler is rendered in one blocking pass, exactly as it always was.",
        "Interruptibility is opt-in *per update*, and the opt-in is `startTransition`, `useDeferredValue`, or a Suspense boundary resolving. Those are the next three lessons. Without one of them, a concurrent root behaves like the old one and that is deliberate: React cannot know which of your updates the user is waiting on.",
      ],
    },
    {
      id: "batching",
      heading: "The one thing that changed without you asking",
      body: [
        "React has always batched multiple state updates inside an event handler into a single render. Before 18, it *only* did that inside its own event handlers — updates in a `setTimeout`, a promise callback, or a native event listener each triggered their own render.",
        "React 18 made batching universal. Two updates in a timeout are now one render, wherever they are.",
        "This is the one behavioural change that arrived with no code edit, and it is the one that broke a small number of apps: code that read the DOM between two `setState` calls and expected the first to have landed.",
      ],
      examples: [
        {
          id: "automatic-batching",
          title: "Two updates outside an event handler",
          lang: "jsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";

let renders = 0;
let setA;
let setB;

function Panel() {
  const [a, sa] = useState(0);
  const [b, sb] = useState(0);
  setA = sa; setB = sb;
  renders++;
  return <p>{a}-{b}</p>;
}

const container = document.createElement("div");
document.body.appendChild(container);
const dom = () => container.textContent;
await act(async () => { createRoot(container).render(<Panel />); });

renders = 0;
await act(async () => {
  /* Deliberately not inside a React event handler: before React 18 this was
     the case that did not batch. */
  await new Promise((resolve) => setTimeout(resolve, 0));
  setA(1);
  console.log(\`  after setA, the DOM says \${dom()}\`);
  setB(1);
  console.log(\`  after setB, the DOM says \${dom()}\`);
});
console.log(\`batched:   \${renders} render, DOM says \${dom()}\`);

renders = 0;
await act(async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync(() => setA(2));
  console.log(\`  after flushSync(setA), the DOM says \${dom()}\`);
  flushSync(() => setB(2));
  console.log(\`  after flushSync(setB), the DOM says \${dom()}\`);
});
console.log(\`flushSync: \${renders} renders, DOM says \${dom()}\`);`,
          output: `  after setA, the DOM says 0-0
  after setB, the DOM says 0-0
batched:   1 render, DOM says 1-1
  after flushSync(setA), the DOM says 2-1
  after flushSync(setB), the DOM says 2-2
flushSync: 2 renders, DOM says 2-2`,
          explanation:
            "In the batched run the DOM is untouched between the two calls, and one render produces `1-1`. In the `flushSync` run you can see the intermediate state on screen — `2-1` — which is exactly the frame batching exists to avoid. Two renders and two paints for one logical change.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";

let renders = 0;
let setA: (n: number) => void;
let setB: (n: number) => void;

function Panel() {
  const [a, sa] = useState(0);
  const [b, sb] = useState(0);
  setA = sa; setB = sb;
  renders++;
  return <p>{a}-{b}</p>;
}

const container = document.createElement("div");
document.body.appendChild(container);
const dom = () => container.textContent;
await act(async () => { createRoot(container).render(<Panel />); });

renders = 0;
await act(async () => {
  /* Deliberately not inside a React event handler: before React 18 this was
     the case that did not batch. */
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  setA(1);
  console.log(\`  after setA, the DOM says \${dom()}\`);
  setB(1);
  console.log(\`  after setB, the DOM says \${dom()}\`);
});
console.log(\`batched:   \${renders} render, DOM says \${dom()}\`);

renders = 0;
await act(async () => {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  flushSync(() => setA(2));
  console.log(\`  after flushSync(setA), the DOM says \${dom()}\`);
  flushSync(() => setB(2));
  console.log(\`  after flushSync(setB), the DOM says \${dom()}\`);
});
console.log(\`flushSync: \${renders} renders, DOM says \${dom()}\`);`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`flushSync` is an escape hatch with a real cost",
          body: "It forces React to render and commit synchronously, which means an extra layout and paint, and it opts that update out of everything this module describes. There are two legitimate uses: measuring the DOM immediately after an update (and `useLayoutEffect` usually covers that better), and integrating with a non-React library that demands the DOM be current before its next line. Using it to \"fix\" a stale read is a sign the read is in the wrong place.",
        },
      ],
    },
    {
      id: "limits",
      heading: "What it does not fix",
      body: [
        "Being honest about this saves a lot of disappointed afternoons.",
        "**It does not make a slow render fast.** If one component takes 200ms, it still takes 200ms. React can yield *between* components, not inside one — a single component's function body runs to completion, always. A slow render is fixed by rendering less, which is module 9.",
        "**It does not make data arrive sooner.** Suspense changes what the screen shows while you wait; it does not shorten the wait.",
        "**It does not parallelise anything.** Still one thread, still one component at a time.",
        "**It does not help a page that is fast already.** If your renders take 3ms, there is nothing to interrupt, and adding transitions to that app adds complexity and nothing else.",
        "What it does fix is a specific, common shape of problem: an update that is expensive *and* not the thing the user is waiting for. A filtered list under a search box, a tab whose contents are heavy, a chart that redraws on a slider. In every one of those there is a cheap urgent part and an expensive patient part, and before React 18 there was no way to tell React which was which.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does 'concurrent rendering' mean in React?",
      answer:
        "That a render is interruptible. React can render part of a tree, yield the thread back to the browser, and then either resume or throw the partial work away and start again with newer state. It is not multithreading and nothing runs in parallel — there is still one thread. The point is that React can now discover that something more urgent has happened mid-render and respond to it, which is impossible if a render is one indivisible task.",
    },
    {
      question: "How do you turn concurrent rendering on?",
      answer:
        "`createRoot`, which every React 19 app already uses since `ReactDOM.render` was removed. But creating a concurrent root does not make updates interruptible — every update is still urgent by default. Interruptibility is opt-in per update, through `startTransition`, `useDeferredValue`, or a Suspense boundary. React cannot guess which updates the user is waiting on, so you tell it.",
    },
    {
      question: "What changed in React 18 that you did not have to opt into?",
      answer:
        "Automatic batching. Before 18, React only batched state updates inside its own event handlers; updates in a timeout, a promise callback or a native listener each caused their own render. Now everything batches. The visible consequence is that the DOM is not updated between two `setState` calls in a promise callback, which broke the small amount of code that read the DOM in between. `flushSync` is the deliberate opt-out.",
    },
    {
      question: "Does concurrent rendering make an app faster?",
      answer:
        "No — it usually does slightly more total work, because an abandoned render is work thrown away and repeated. It makes an app more *responsive*: the expensive update stops blocking the cheap one, so input is answered while the heavy render is in progress. If a single component is slow, concurrency cannot help, because React yields between components and never inside one.",
    },
  ],
  takeaways: [
    "Concurrent rendering is one thread and one component at a time — what changed is that the loop can stop between components",
    "A render can be paused, resumed, or thrown away before being committed",
    "That makes purity a correctness requirement: a render that never commits can still have run",
    "`createRoot` enables it, but every update is still urgent until you say otherwise",
    "Automatic batching is the one change that arrived without an opt-in",
    "`flushSync` forces a synchronous render and commit — an escape hatch with a real paint cost",
    "It buys responsiveness by spending wasted renders; it does not make anything faster",
    "It cannot help a single slow component, and it cannot make data arrive sooner",
  ],
  status: "available",
};
