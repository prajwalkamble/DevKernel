import type { Lesson } from "@/content/types";

export const useEffectLesson: Lesson = {
  id: "react-useeffect",
  slug: "useeffect",
  moduleSlug: "core-hooks",
  title: "`useEffect`: What an Effect Is, and When It Runs",
  summary:
    "An effect is not \"code that runs after render\". It is a way to keep something outside React in step with something inside it — and reading it that way is what makes the dependency array, the cleanup and the double invocation stop being arbitrary.",
  estimatedMinutes: 30,
  objectives: [
    "Say what an effect is for, in one sentence that excludes most misuse",
    "Place effects precisely in the render and commit sequence",
    "Distinguish `useEffect` from `useLayoutEffect` by when each runs",
    "Recognise the three things that belong in an effect",
    "Recognise the three that do not",
  ],
  sections: [
    {
      id: "what-it-is",
      heading: "What an effect is for",
      body: [
        "**An effect synchronises React with a system outside React.** A subscription, a websocket, a browser API, a third-party widget, the document title, an analytics call.",
        "The word to hold on to is *synchronise*, not *run*. An effect describes a state of the world that should be true while its dependencies hold — connected to this room, subscribed to this store, this title in the tab — and React's job is to make it true and keep it true as those dependencies change.",
        "That framing is the whole lesson. \"Code that runs after render\" invites you to put anything there and to fight the dependency array when it re-runs. \"Something that should be true while these values hold\" makes re-running obviously correct.",
      ],
    },
    {
      id: "when",
      heading: "Exactly when it runs",
      body: [
        "Module 2 established the two phases. Effects live at the end of the second one.",
        "React renders, commits the changes to the DOM, and **lets the browser paint**. Only then does it run passive effects — the ones from `useEffect`. That delay is deliberate: an effect must not block the user from seeing the update.",
        "`useLayoutEffect` runs earlier: after the DOM has been mutated but **before** the browser paints. That is the right tool for measuring an element and adjusting it in the same frame, and the wrong tool for anything else, because the browser is waiting on it.",
        "Both run child before parent, the reverse of render, so a parent's effect can assume its children are mounted and their refs are set.",
      ],
      examples: [
        {
          id: "effect-order",
          title: "Render, layout effect, effect, cleanup",
          lang: "tsx",
          code: `import { useEffect, useLayoutEffect, act } from "react";
import { createRoot } from "react-dom/client";

function Probe({ label }) {
  console.log("  render", label);

  useLayoutEffect(() => {
    console.log("  layout effect", label);
    return () => console.log("  layout cleanup", label);
  }, []);

  useEffect(() => {
    console.log("  effect", label);
    return () => console.log("  cleanup", label);
  }, []);

  return <p>{label}</p>;
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

console.log("mount:");
act(() => { root.render(<Probe label="A" />); });

console.log("unmount:");
act(() => { root.unmount(); });`,
          output: `mount:
  render A
  layout effect A
  effect A
unmount:
  layout cleanup A
  cleanup A`,
          explanation:
            "Render first, then the layout effect, then the passive effect — and on the way out, cleanup in the same order the effects were declared. The gap this output cannot show is the paint: in a browser it happens between `layout effect` and `effect`, which is exactly why a measurement belongs in the first and a subscription in the second.",
        },
      ],
      pitfalls: [
        {
          title: "Setting state in a `useEffect` with no dependency array is an infinite loop",
          body: "The effect runs after every render; setting state causes a render; that render runs the effect again. React eventually throws `Maximum update depth exceeded`, but only after a lot of wasted work, and in development the page may lock up first. If an effect must set state, its dependencies have to exclude whatever it sets — and more often the value should have been derived during render instead, which module 4's last lesson argued.",
        },
      ],
    },
    {
      id: "belongs",
      heading: "The three things that belong in an effect",
      body: [
        "**Subscribing to something.** A store, a websocket, an event source, `matchMedia`, `IntersectionObserver`. Anything with an add and a remove.",
        "**Controlling something imperative.** A map widget, a video player, a chart library, a modal that manages its own focus. React describes; the widget is told.",
        "**Reaching for a browser API that is not part of rendering.** `document.title`, `localStorage`, a keyboard shortcut on `window`.",
        "The common shape: each has an *outside* that can drift out of step with React's state, and each has a way to undo what was set up.",
      ],
    },
    {
      id: "does-not-belong",
      heading: "The three that do not",
      body: [
        "**Transforming data for rendering.** Filtering a list, computing a total, formatting a date. Do it during render. An effect that sets derived state renders twice for every change and guarantees one frame showing the stale value.",
        "**Handling a user event.** Sending a form, showing a toast, navigating. That belongs in the handler, where you know *why* it happened. An effect only sees that a value changed, not what changed it — so a save-on-change effect cannot tell a user's edit from a value arriving over a websocket.",
        "**Resetting state when a prop changes.** Use a `key`, as module 2's lesson on keys showed. An effect doing this runs after the wrong content has already been painted.",
        "Module 7 is dedicated to this and works through each case properly. It is flagged here because the single most common React mistake is an effect that should not exist, and knowing that early changes what you write.",
      ],
      examples: [
        {
          id: "unnecessary-effect",
          title: "The same value, derived and synchronised",
          lang: "tsx",
          code: `import { useEffect, useState, act } from "react";
import { createRoot } from "react-dom/client";

let derivedRenders = 0;
let effectRenders = 0;

// Derived during render: one render per change, never stale.
function Derived({ items }) {
  derivedRenders++;
  const total = items.reduce((sum, n) => sum + n, 0);
  return <span id="d">{total}</span>;
}

// Synchronised with an effect: two renders per change, and the first is wrong.
function Synced({ items }) {
  effectRenders++;
  const [total, setTotal] = useState(0);
  useEffect(() => {
    setTotal(items.reduce((sum, n) => sum + n, 0));
  }, [items]);
  return <span id="s">{total}</span>;
}

function App({ items }) {
  return <><Derived items={items} /><Synced items={items} /></>;
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

act(() => { root.render(<App items={[1, 2]} />); });
console.log("mounted:  derived =", container.querySelector("#d").textContent,
            "| synced =", container.querySelector("#s").textContent);
console.log("renders:  derived =", derivedRenders, "| synced =", effectRenders);

act(() => { root.render(<App items={[1, 2, 3]} />); });
console.log("updated:  derived =", container.querySelector("#d").textContent,
            "| synced =", container.querySelector("#s").textContent);
console.log("renders:  derived =", derivedRenders, "| synced =", effectRenders);`,
          output: `mounted:  derived = 3 | synced = 3
renders:  derived = 1 | synced = 2
updated:  derived = 6 | synced = 6
renders:  derived = 2 | synced = 4`,
          explanation:
            "Both end up showing the right number, so the bug is invisible in the final state — and the render counts give it away: two renders for every one. The first of each pair painted the *old* total, because the effect had not run yet. On a fast machine that is a flicker; on a slow one it is a visible wrong number. And the effect version needs `items` to be referentially stable, which the next lesson shows is its own problem.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is `useEffect` for?",
      answer:
        "Synchronising React with something outside it — a subscription, an imperative widget, a browser API. The useful reading is that an effect declares a state of the world that should hold while its dependencies do, and React's job is to establish it and re-establish it when they change. Reading it as \"code that runs after render\" is what leads to effects that transform data for rendering or respond to user events, both of which belong elsewhere.",
    },
    {
      question: "When does an effect run relative to the browser painting?",
      answer:
        "After. React renders, commits the DOM changes, lets the browser paint, and then runs passive effects from `useEffect` — deliberately, so an effect cannot delay the user seeing the update. `useLayoutEffect` runs between the commit and the paint, which is what makes it right for measuring and adjusting in the same frame and wrong for everything else, since the browser is blocked while it runs.",
    },
    {
      question: "Why is deriving a value during render better than syncing it with an effect?",
      answer:
        "The effect version renders twice for every change and the first render shows the stale value, because the effect has not run yet — a flicker at best and a visibly wrong number at worst. It also needs its dependencies to be referentially stable or it re-runs constantly. A value computed during render cannot be stale, costs one render, and has no dependencies to get wrong.",
    },
  ],
  takeaways: [
    "An effect synchronises React with something outside it; \"runs after render\" is the reading that causes misuse",
    "Passive effects run after the browser paints; `useLayoutEffect` runs before it, and blocks it",
    "Effects run child before parent, the reverse of render",
    "Subscriptions, imperative widgets and browser APIs belong in effects",
    "Derived data, event responses and resetting state on a prop change do not",
    "An effect that sets derived state renders twice per change and paints the stale value first",
  ],
  status: "available",
};
