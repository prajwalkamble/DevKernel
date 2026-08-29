import type { Lesson } from "@/content/types";

export const stateIsASnapshotLesson: Lesson = {
  id: "react-state-is-a-snapshot",
  slug: "state-is-a-snapshot",
  moduleSlug: "state-and-events",
  title: "State Is a Snapshot",
  summary:
    "Every render gets its own set of constants, and every function created during that render closes over them forever. That is why a value inside a timeout is stale, why an interval counts to one and stops, and why the fix is never to reach for the \"current\" value.",
  estimatedMinutes: 30,
  objectives: [
    "Explain what a render's variables belong to",
    "Predict what a `setTimeout` scheduled in a handler will see",
    "Recognise the stale-closure shape in intervals, subscriptions and listeners",
    "Fix a stale closure with a functional update",
    "Say when a ref is the right answer instead",
  ],
  sections: [
    {
      id: "each-render-its-own",
      heading: "Each render has its own everything",
      visual: {
        id: "state-snapshot-visual",
        kind: "react-state",
        algorithm: "snapshot",
        title: "Two renders, two sets of variables",
      },
      body: [
        "A component function runs once per render. Each run creates its own `const` for every state variable, its own props object, and its own copies of every function defined in the body.",
        "Those functions capture the variables of the render that created them — ordinary JavaScript closures, with no React involvement. A handler defined during the render where `count` was 3 will see `3` forever, however many renders happen afterwards.",
        "The phrase people reach for is that state is \"asynchronous\". It is not, and thinking of it that way predicts the wrong things. Nothing is pending or delayed; you are simply looking at a different render's variable from the one now on screen. **A render is a snapshot**, and every closure belongs to exactly one.",
      ],
      examples: [
        {
          id: "timeout-snapshot",
          title: "The timeout sees the render it was born in",
          lang: "jsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

function Delayed() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
    // Scheduled during this render, so it closes over this render's \`count\`.
    setTimeout(() => {
      console.log("  the timeout sees count =", count);
    }, 0);
  }

  return <button id="b" onClick={handleClick}>{count}</button>;
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

act(() => { root.render(<Delayed />); });
act(() => { container.querySelector("#b").click(); });
console.log("after the click, the DOM shows:", container.textContent);

await new Promise((resolve) => setTimeout(resolve, 10));
console.log("...and the timeout has now run.");`,
          output: `after the click, the DOM shows: 1
  the timeout sees count = 0
...and the timeout has now run.`,
          explanation:
            "The screen says `1` and the timeout says `0`, and both are correct. The timeout was created during the render where `count` was `0`, and it kept that value — the later render produced a *different* `count` in a different call, which this closure has never seen. Nothing raced; the callback is simply reading its own snapshot.",
        },
      ],
    },
    {
      id: "the-shapes",
      heading: "The same bug wearing different clothes",
      body: [
        "Once you can see it, the shape appears everywhere.",
        "**An interval that counts to one.** `setInterval(() => setCount(count + 1), 1000)` set up once on mount closes over `count === 0`, so it sets 1 every second forever.",
        "**A debounced save that saves an old draft.** The debounced function was created in an earlier render and holds that render's text.",
        "**An event listener added by hand.** `window.addEventListener(\"resize\", handler)` where `handler` came from the mounting render.",
        "**A promise callback after an await.** `const data = await fetch(...); setTotal(count + data.n)` — `count` is from before the await, which may be seconds old.",
        "In every case the diagnosis is identical: this function belongs to an old render, and it is reading that render's variables.",
      ],
      examples: [
        {
          id: "interval-stuck",
          title: "An interval that never gets past one",
          lang: "jsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

// Stands in for an interval: a callback captured once and called repeatedly.
let captured = null;

function Ticker() {
  const [count, setCount] = useState(0);

  // Captured on the first render only — like a setInterval in an effect with [].
  if (captured === null) {
    captured = { stale: () => setCount(count + 1), fresh: () => setCount((c) => c + 1) };
  }

  return <span id="v">{count}</span>;
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

act(() => { root.render(<Ticker />); });

act(() => { captured.stale(); });
act(() => { captured.stale(); });
act(() => { captured.stale(); });
console.log("three ticks with the stale closure:", container.textContent);

act(() => { captured.fresh(); });
act(() => { captured.fresh(); });
act(() => { captured.fresh(); });
console.log("three ticks with an updater:       ", container.textContent);`,
          output: `three ticks with the stale closure: 1
three ticks with an updater:        4`,
          explanation:
            "Three ticks of the captured closure left the count at 1, because every one of them computed `0 + 1` from the render it was created in. Three ticks of the updater moved it 1, 2, 3, 4 — the updater never reads a captured variable, so there is nothing to go stale. This is exactly why an interval set up once must use the functional form.",
        },
      ],
    },
    {
      id: "fixes",
      heading: "The fixes, in the order to try them",
      body: [
        "**Use a functional update.** `setCount(c => c + 1)` asks React for the current value rather than reading a captured one. It fixes every case where the update depends only on the previous state, which is most of them, and it needs no extra machinery.",
        "**Let the closure be recreated.** An effect that lists its dependencies honestly gets torn down and set up again when they change, so the closure inside it is never older than its dependencies. Module 7 covers this properly; the short version is that removing a dependency to \"stop it re-running\" creates exactly this bug.",
        "**Use a ref for a value you need to read but not render.** A ref is a mutable box that survives renders, so `ref.current` is always the latest value whoever reads it. It is the right tool when a callback must read something it does not depend on for rendering — the current scroll position, the latest props inside a stable event handler.",
        "**Not a fix:** reaching for the value \"as it is now\" by storing state outside React, or by disabling the exhaustive-deps lint rule. Both replace a visible bug with an invisible one.",
      ],
      pitfalls: [
        {
          title: "A ref is not a substitute for state",
          body: "Changing `ref.current` does not re-render, so a value shown on screen must be state. Using a ref to dodge a stale closure for something you also display gives you a value that is correct in the callback and stale on the page — the same bug moved somewhere harder to see. Refs are for values you read, not values you render.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Is `useState` asynchronous?",
      answer:
        "No, and that framing predicts the wrong things. Nothing is pending — the setter queues an update and schedules a render, and the variable you are reading is a `const` belonging to the render that is currently executing. When a callback sees an old value it is not because an update has not landed yet; it is because that callback closed over a different render's variables. A render is a snapshot, and every function created during it belongs to that snapshot.",
    },
    {
      question: "Why does a `setInterval` created on mount only ever increment once?",
      answer:
        "The callback was created during the first render and closed over that render's state — `count` is `0` inside it forever, so `setCount(count + 1)` sets 1 every tick. The fix is a functional update, `setCount(c => c + 1)`, which asks React for the current value instead of reading a captured one, so there is nothing left to go stale.",
    },
    {
      question: "When is a ref the right answer to a stale closure?",
      answer:
        "When the callback needs to *read* a current value that it does not need to render. A ref is a mutable box that persists across renders, so `ref.current` is always the latest. It is wrong when the value is also displayed, because writing to a ref does not re-render — you would get a value that is current in the callback and stale on screen. For updates that depend only on previous state, a functional update is simpler and needs no ref at all.",
    },
  ],
  takeaways: [
    "Each render creates its own constants, and every function defined in it closes over that render's values",
    "\"State is asynchronous\" is the wrong model; a render is a snapshot and closures belong to one",
    "Timeouts, intervals, listeners, debounced callbacks and post-`await` code are all the same stale-closure shape",
    "A functional update fixes it wherever the new value depends only on the old",
    "Honest effect dependencies fix it by letting the closure be recreated",
    "A ref is for a value you read but do not render — writing to one does not re-render",
  ],
  status: "available",
};
