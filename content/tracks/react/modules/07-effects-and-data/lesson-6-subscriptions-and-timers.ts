import type { Lesson } from "@/content/types";

export const subscriptionsAndTimersLesson: Lesson = {
  id: "react-subscriptions-and-timers",
  slug: "subscriptions-timers-and-listeners",
  moduleSlug: "effects-and-data",
  title: "Subscriptions, Timers and Event Listeners",
  summary:
    "The other things effects are for, and the closure bug that makes a counter stick at 1. Intervals, listeners, observers and media queries — each with the cleanup that stops it leaking.",
  estimatedMinutes: 30,
  objectives: [
    "Diagnose a stale closure inside a long-lived callback",
    "Fix it with a functional update, and know when that is not enough",
    "Add and remove an event listener with the same function reference",
    "Set up an observer and disconnect it",
    "Say what leaks when a cleanup is missing, and how to notice",
  ],
  sections: [
    {
      id: "stale-closure",
      heading: "The counter that sticks at 1",
      visual: {
        id: "stale-closure-visual",
        kind: "react-state",
        algorithm: "snapshot",
        title: "The value the callback captured",
      },
      body: [
        "An interval that increments a counter. Three lines, a cleanup, and a correct dependency array — the linter is happy, and it does not work.",
      ],
      examples: [
        {
          id: "stale-interval",
          title: "Five ticks, two components",
          lang: "jsx",
          code: `import { useState, useEffect, act } from "react";
import { createRoot } from "react-dom/client";

/* A hand-driven clock, so the number of ticks is exact rather than
   whatever the machine managed in 120ms. It behaves exactly as setInterval
   does in the way that matters: the callback is registered once and called
   many times. */
const clock = {
  callbacks: new Set(),
  every(fn) {
    this.callbacks.add(fn);
    return () => this.callbacks.delete(fn);
  },
  tick() { for (const fn of this.callbacks) fn(); },
};

/* Reads \`n\` from the render that created the callback. */
function Stale() {
  const [n, setN] = useState(0);
  useEffect(() => clock.every(() => setN(n + 1)), []);
  return <output>{n}</output>;
}

/* Tells React how to update, so it is handed the current value. */
function Fresh() {
  const [n, setN] = useState(0);
  useEffect(() => clock.every(() => { setN((current) => current + 1); }), []);
  return <output>{n}</output>;
}

function drive(Component, label) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => { root.render(<Component />); });
  for (let i = 0; i < 5; i++) act(() => { clock.tick(); });
  console.log(\`\${label} after 5 ticks: \${container.textContent}\`);
  act(() => { root.unmount(); });
  console.log(\`\${label} listeners left after unmount: \${clock.callbacks.size}\`);
}

drive(Stale, "setN(n + 1)      ");
drive(Fresh, "setN(c => c + 1) ");`,
          output: `setN(n + 1)       after 5 ticks: 1
setN(n + 1)       listeners left after unmount: 0
setN(c => c + 1)  after 5 ticks: 5
setN(c => c + 1)  listeners left after unmount: 0`,
          explanation:
            "Five ticks and the first version reaches 1. The callback was created during the render where `n` was `0`, and a closure captures the *variable's value at that render*, not a live view of the state. So every tick computes `0 + 1` and sets 1, which is already the value, so nothing changes. Both versions clean up correctly — the leak and the staleness are separate problems.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useState, useEffect, act } from "react";
import { createRoot } from "react-dom/client";

/* A hand-driven clock, so the number of ticks is exact rather than
   whatever the machine managed in 120ms. It behaves exactly as setInterval
   does in the way that matters: the callback is registered once and called
   many times. */
const clock = {
  callbacks: new Set<() => void>(),
  every(fn: () => void) {
    this.callbacks.add(fn);
    return () => this.callbacks.delete(fn);
  },
  tick() { for (const fn of this.callbacks) fn(); },
};

/* Reads \`n\` from the render that created the callback. */
function Stale() {
  const [n, setN] = useState(0);
  useEffect(() => clock.every(() => setN(n + 1)), []);
  return <output>{n}</output>;
}

/* Tells React how to update, so it is handed the current value. */
function Fresh() {
  const [n, setN] = useState(0);
  useEffect(() => clock.every((): void => { setN((current) => current + 1); }), []);
  return <output>{n}</output>;
}

function drive(Component: () => React.JSX.Element, label: string) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => { root.render(<Component />); });
  for (let i = 0; i < 5; i++) act(() => { clock.tick(); });
  console.log(\`\${label} after 5 ticks: \${container.textContent}\`);
  act(() => { root.unmount(); });
  console.log(\`\${label} listeners left after unmount: \${clock.callbacks.size}\`);
}

drive(Stale, "setN(n + 1)      ");
drive(Fresh, "setN(c => c + 1) ");`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Why `[]` is right here and adding `n` is not the fix",
          body: "Adding `n` to the array does make it correct, by tearing down and recreating the interval on every tick — so the interval never actually completes a full period and the timing drifts. The functional update is the right fix: it keeps one interval for the component's whole life and asks React for the current value at the moment it is needed.",
        },
        {
          title: "The functional update is not enough when you need *other* state",
          body: "`setN(c => c + 1)` works because the only value the callback needs is the state it is setting. A callback that also reads a prop, or a second piece of state, still captures those from its creating render. That case needs an effect event — a ref holding the latest function — which module 10 covers when it covers custom hooks.",
        },
      ],
    },
    {
      id: "listeners",
      heading: "Event listeners",
      body: [
        "The rule is one sentence: **`removeEventListener` must be given the same function reference `addEventListener` was given.** An inline arrow in each call is two different functions, and the remove silently does nothing.",
        "Inside an effect this is easy to get right, because the function is created once per effect run and the cleanup closes over the same one.",
      ],
      examples: [
        {
          id: "listener-effect",
          title: "A window listener, added and removed",
          lang: "jsx",
          code: `function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    // Named, and referenced twice. This is the whole discipline.
    const onResize = () => setWidth(window.innerWidth);

    window.addEventListener("resize", onResize);
    // The size may already have changed between the initial state and here.
    onResize();

    return () => window.removeEventListener("resize", onResize);
  }, []);

  return width;
}

/* The same for a media query, which has the identical shape and one extra
   trap: the initial value must be read, not assumed. */
function usePrefersDark() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setDark(query.matches);

    setDark(query.matches);                  // read it now
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return dark;
}`,
          explanation:
            "Both call the handler once immediately after subscribing. Between the first render computing the initial state and the effect running, the value can already have changed — a window resized during load, a system theme that switched. Subscribing without reading leaves you displaying a value that was true a moment ago and will not update until the next event.",
        },
      ],
      pitfalls: [
        {
          title: "`window` does not exist during server rendering",
          body: "`useState(() => window.innerWidth)` throws on the server, because there is no window. Effects never run on the server, so the *effect* is safe — it is the initial state that has to be a value that exists everywhere, with the effect correcting it on the client. This is also a hydration mismatch waiting to happen, which module 12 covers.",
        },
        {
          title: "Prefer the element's own `onX` prop when there is one",
          body: "An effect adding a listener to a DOM node you rendered is doing by hand what `onClick` does for free, and worse — you need a ref, the node might not exist yet, and React's synthetic events already handle delegation. Reach for `addEventListener` only for `window`, `document`, a media query, or a node you did not create.",
        },
      ],
    },
    {
      id: "observers",
      heading: "Observers",
      body: [
        "`IntersectionObserver`, `ResizeObserver` and `MutationObserver` all have the same shape: construct, observe, disconnect. They are the right tool for anything a scroll listener is usually misused for — infinite scroll, lazy loading, sticky headers, reveal animations — because the browser does the work off the main thread and hands you only the changes.",
      ],
      examples: [
        {
          id: "intersection-observer",
          title: "Infinite scroll, without a scroll listener",
          lang: "jsx",
          code: `function useOnScreen(ref, onEnter) {
  useEffect(() => {
    const node = ref.current;
    // The ref is null on the first render, so bail rather than throw. The
    // effect re-runs when \`onEnter\` changes, by which time it is set.
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) onEnter();
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, onEnter]);
}

function Feed({ items, loadMore }) {
  const sentinel = useRef(null);
  // Stable identity, or the effect tears the observer down every render.
  const onEnter = useCallback(() => loadMore(), [loadMore]);
  useOnScreen(sentinel, onEnter);

  return (
    <>
      {items.map((item) => <Row key={item.id} item={item} />)}
      <div ref={sentinel} aria-hidden />
    </>
  );
}`,
          explanation:
            "`onEnter` has to be stable. Passed as an inline arrow it would be a new function every render, so the effect would disconnect and reconnect the observer on every render — which mostly works and occasionally misses the exact frame the sentinel crosses the viewport, producing a feed that stops loading and cannot be reproduced.",
          alternates: [
            {
              lang: "tsx",
              code: `function useOnScreen(ref: RefObject<Element | null>, onEnter: () => void) {
  useEffect(() => {
    const node = ref.current;
    // The ref is null on the first render, so bail rather than throw. The
    // effect re-runs when \`onEnter\` changes, by which time it is set.
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) onEnter();
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, onEnter]);
}

function Feed({ items, loadMore }: { items: Item[]; loadMore: () => void }) {
  const sentinel = useRef<HTMLDivElement>(null);
  // Stable identity, or the effect tears the observer down every render.
  const onEnter = useCallback(() => loadMore(), [loadMore]);
  useOnScreen(sentinel, onEnter);

  return (
    <>
      {items.map((item) => <Row key={item.id} item={item} />)}
      <div ref={sentinel} aria-hidden />
    </>
  );
}`,
            },
          ],
        },
      ],
    },
    {
      id: "leaks",
      heading: "What a missing cleanup actually costs",
      body: [
        "\"It leaks\" is vague. Here is what each one does.",
        "**An interval or timeout** keeps firing after the component is gone, forever, calling a setter on a component that no longer exists. Mount and unmount the same component twenty times and you have twenty intervals.",
        "**An event listener** keeps the whole closure alive — and therefore the component's props, its state, and any DOM node they reference. This is the classic React memory leak: a detached DOM subtree that cannot be collected because a `window` listener still points into it.",
        "**A subscription or connection** holds a socket open, and the server holds one too. This is the one that shows up as a production incident rather than a slow tab.",
        "**An observer** keeps observing a node that is no longer in the document, which pins that node in memory.",
        "How to notice: mount and unmount the screen a few times and watch. Chrome DevTools' Memory panel, two heap snapshots with the component mounted and unmounted, and a search for detached nodes will show it. Strict Mode's double mount gives you a cheaper first check — anything that logs twice and never logs a teardown is missing its cleanup.",
      ],
      pitfalls: [
        {
          title: "The cleanup must undo *exactly* what the effect did",
          body: "Two intervals started, two cleared. A listener added on `window` removed from `window`, not from `document`. An observer that `observe`d three nodes needs `disconnect()`, not one `unobserve`. The symmetry is the whole discipline: read the effect body, and the cleanup should be its mirror image line for line.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does an interval that does setN(n + 1) get stuck?",
      answer:
        "The callback was created during a render where `n` had a particular value, and a closure captures that value rather than a live view of the state. With `[]` deps the callback is never recreated, so every tick computes the same sum and sets the same number — which React sees as unchanged. The fix is `setN(c => c + 1)`, which asks React for the current value at the moment of the update. Adding `n` to the dependency array also works but tears down and recreates the interval on every tick, so its period drifts.",
    },
    {
      question: "What is the rule for adding and removing an event listener?",
      answer:
        "`removeEventListener` has to be given the same function reference that was added — an inline arrow in each call is two different functions and the removal silently does nothing. Inside an effect that is easy: name the handler, add it, and return a cleanup that removes the same name. It is also worth calling the handler once immediately after subscribing, because the value may have changed between the first render and the effect running.",
    },
    {
      question: "What actually leaks when you forget a cleanup?",
      answer:
        "An interval keeps firing forever, once per mount. A listener keeps its closure alive, and with it the component's props, state and any DOM nodes they reference — which is the classic React leak, a detached subtree pinned by a `window` listener. A connection holds a socket open on both ends. An observer pins the node it was watching. Two heap snapshots around a mount and unmount, filtered for detached nodes, is how you find them.",
    },
  ],
  takeaways: [
    "A callback created in one render captures that render's values, however long it lives",
    "`setN(c => c + 1)` fixes it for the state being set; other captured values need an effect event",
    "Adding the state to the dependency array recreates the interval every tick and drifts its period",
    "`removeEventListener` needs the same function reference — name the handler and reference it twice",
    "Call the handler once after subscribing: the value can change between first render and effect",
    "Observers beat scroll listeners, and their callback must have a stable identity",
    "A missing cleanup pins closures, DOM nodes, sockets and timers — one set per mount",
    "The cleanup should read as the mirror image of the effect body",
  ],
  status: "available",
};
