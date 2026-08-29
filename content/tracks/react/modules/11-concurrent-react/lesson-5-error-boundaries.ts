import type { Lesson } from "@/content/types";

export const errorBoundariesLesson: Lesson = {
  id: "react-error-boundaries",
  slug: "error-boundaries",
  moduleSlug: "concurrent-react",
  title: "Error Boundaries",
  summary:
    "The only remaining reason to write a class component, what it does and does not catch — demonstrated — how to reset one, React 19's root-level error options, and why boundaries and Suspense boundaries are placed together.",
  estimatedMinutes: 30,
  objectives: [
    "Write an error boundary and say why it must be a class",
    "Show what a boundary catches and what escapes it",
    "Reset a boundary so the user can retry",
    "Use onCaughtError, onUncaughtError and onRecoverableError",
    "Place boundaries alongside Suspense boundaries",
  ],
  sections: [
    {
      id: "the-default",
      heading: "What happens with no boundary",
      body: [
        "An uncaught error during render unmounts the **entire tree**. Not the component that threw, not its parent — the whole root, replaced by nothing.",
        "That is a deliberate choice, and the reasoning is sound: a half-rendered interface is worse than an absent one. A banking app that fails to render the balance but still renders the *Transfer* button is a genuinely dangerous artefact. React would rather show you nothing.",
        "The consequence is that a blank white page is the default failure mode of a React app, and one boundary near the root is not optional.",
      ],
      examples: [
        {
          id: "no-boundary",
          title: "One component throws, and the page is empty",
          lang: "jsx",
          code: `import { act } from "react";
import { createRoot } from "react-dom/client";

function Boom() { throw new Error("no boundary anywhere"); }
function App() { return <div><h1>Header</h1><Boom /></div>; }

const container = document.createElement("div");
document.body.appendChild(container);

try {
  /* act re-throws whatever React could not handle, which is how a test
     harness surfaces it. In a browser this goes to window.onerror instead. */
  await act(async () => { createRoot(container).render(<App />); });
} catch (error) {
  console.log("act re-threw it:", (error).message);
}
console.log("what is left on the page:", JSON.stringify(container.innerHTML));`,
          output: `act re-threw it: no boundary anywhere
what is left on the page: ""`,
          explanation:
            "The header never threw and never had a chance to survive. React unmounted the root, and `innerHTML` is the empty string — the blank page every user has met at least once.",
          alternates: [
            {
              lang: "tsx",
              code: `import { act } from "react";
import { createRoot } from "react-dom/client";

function Boom() { throw new Error("no boundary anywhere"); }
function App() { return <div><h1>Header</h1><Boom /></div>; }

const container = document.createElement("div");
document.body.appendChild(container);

try {
  /* act re-throws whatever React could not handle, which is how a test
     harness surfaces it. In a browser this goes to window.onerror instead. */
  await act(async () => { createRoot(container).render(<App />); });
} catch (error) {
  console.log("act re-threw it:", (error as Error).message);
}
console.log("what is left on the page:", JSON.stringify(container.innerHTML));`,
            },
          ],
        },
      ],
    },
    {
      id: "writing-one",
      heading: "Writing one",
      body: [
        "An error boundary is a class component with `static getDerivedStateFromError` — which turns the error into state so the next render can show a fallback — and optionally `componentDidCatch`, which is where logging goes.",
        "**It has to be a class.** There is no hook for this and there has never been one; the lifecycle React needs to call during the unwind has no hook equivalent. This is the one place where a modern codebase still writes a class, which is why almost everybody installs `react-error-boundary` instead of writing it out. Write it once anyway, so you know what the package is doing.",
        "The two methods have different jobs. `getDerivedStateFromError` is called during the render phase, so it must be pure — no logging in there, because in a concurrent render it can be called for work that is then discarded. `componentDidCatch` runs in the commit phase and is the right place for the call to your error reporter.",
      ],
      examples: [
        {
          id: "the-class",
          title: "The whole of it",
          lang: "tsx",
          code: `import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback: (error: Error, retry: () => void) => ReactNode;
}

export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null };

  /* Render phase: pure, and may be called for a render that is discarded.
     Turn the error into state and do nothing else. */
  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  /* Commit phase: this ran for real. Log here. */
  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error, () => this.setState({ error: null }));
    }
    return this.props.children;
  }
}`,
          explanation:
            "A render-prop fallback rather than a fixed element, so the caller can show the message, offer a retry, or ignore both. Note that `retry` only clears the boundary's own state — whether that is enough is the subject of a later section.",
        },
      ],
    },
    {
      id: "what-it-catches",
      heading: "What it catches, and what walks straight past it",
      body: [
        "A boundary catches a throw from **rendering**, from a **lifecycle method**, and from a **constructor**, anywhere below it in the tree.",
        "It does not catch a throw from an **event handler**, from **`setTimeout`** or any async callback, from **server rendering**, or from the boundary **itself**.",
        "The reason is one rule rather than four: React catches what it is on the stack for. A render happens inside React's call stack, so a throw unwinds into React and React can act. A click handler is called by the browser's event dispatch — React is not above it on the stack, and there is nothing to unwind into.",
      ],
      visual: {
        id: "error-boundary-visual",
        kind: "react-concurrent",
        algorithm: "error-boundary",
        title: "An error looking for a boundary",
        lockAlgorithm: true,
      },
      examples: [
        {
          id: "caught-and-not",
          title: "Two throws, one boundary",
          lang: "tsx",
          code: `import { Component, act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) return <p>caught: {this.state.error.message}</p>;
    return this.props.children;
  }
}

/* In a browser an unhandled handler error ends up here. Listening for it is
   how this example can show that it got out, rather than crashing. */
window.addEventListener("error", (event) => {
  event.preventDefault();
  console.log("reached window.onerror:", event.message);
});

function Boom({ where }: { where: "render" | "click" }) {
  if (where === "render") throw new Error("thrown while rendering");
  return <button onClick={() => { throw new Error("thrown in a handler"); }}>go</button>;
}

function mount() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  /* React 19 root options, so this example prints its own output rather than
     React's console.error. They are the subject of a later section. */
  return { container, root: createRoot(container, { onCaughtError() {}, onUncaughtError() {} }) };
}

const a = mount();
await act(async () => { a.root.render(<Boundary><Boom where="render" /></Boundary>); });
console.log("render error  ->", a.container.innerHTML);

const b = mount();
await act(async () => { b.root.render(<Boundary><Boom where="click" /></Boundary>); });
await act(async () => { b.container.querySelector("button")!.click(); });
console.log("handler error ->", b.container.innerHTML);`,
          output: `render error  -> <p>caught: thrown while rendering</p>
reached window.onerror: thrown in a handler
handler error -> <button>go</button>`,
          explanation:
            "Identical error, identical boundary, identical component. The render throw is caught and the fallback appears. The click throw travels straight past the boundary to `window.onerror`, and the button is still sitting there as though nothing happened — which, from React's point of view, is true: it never knew.",
        },
      ],
      pitfalls: [
        {
          title: "Handler errors need an ordinary try/catch",
          body: "There is no React mechanism for these. Wrap the body of the handler, put the error into state yourself, and render whatever you would have rendered — or, if you want the boundary to handle it uniformly, `setState` to a value that makes the next render throw. That last trick is what `react-error-boundary`'s `showBoundary` does.",
        },
        {
          title: "A boundary cannot catch its own render",
          body: "If the fallback UI throws, the error goes to the next boundary up. Keep fallbacks trivial: no data access, no formatting of the error object, nothing that can fail.",
        },
      ],
    },
    {
      id: "resetting",
      heading: "Letting the user try again",
      body: [
        "Clearing the boundary's error state re-renders the children — and if the thing that made them throw is still true, they throw again immediately, and you have an infinite loop dressed as a *Try again* button.",
        "Two things need to happen: the error state is cleared, and **something about the attempt changes**. Bumping a key on the boundary is the blunt, reliable version — it unmounts the failed subtree entirely, so no stale state survives into the retry.",
      ],
      examples: [
        {
          id: "retry",
          title: "A retry that actually retries",
          lang: "tsx",
          code: `import { Component, useState, act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

class Boundary extends Component<
  { children: ReactNode; onReset: () => void },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div>
          <p>{this.state.error.message}</p>
          <button onClick={() => { this.setState({ error: null }); this.props.onReset(); }}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

let failing = true;
function Chart() {
  if (failing) throw new Error("chart failed");
  return <b>the chart</b>;
}

function App() {
  /* The key is what actually resets the subtree: changing it unmounts the old
     Chart and mounts a fresh one, so nothing of the failed render survives. */
  const [attempt, setAttempt] = useState(0);
  return (
    <Boundary key={attempt} onReset={() => setAttempt(attempt + 1)}>
      <Chart />
    </Boundary>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
await act(async () => {
  createRoot(container, { onCaughtError() {}, onUncaughtError() {} }).render(<App />);
});
console.log("first render: ", container.textContent);

failing = false;
await act(async () => { container.querySelector("button")!.click(); });
console.log("after retry:  ", container.textContent);`,
          output: `first render:  chart failedTry again
after retry:   the chart`,
          explanation:
            "The retry works because `failing` changed between the two attempts. In a real app that is a refetch, a cache invalidation, or a route change — and the key bump is what guarantees the second attempt starts from nothing rather than from the wreckage of the first.",
        },
      ],
      pitfalls: [
        {
          title: "Reset on navigation, or the fallback follows the user around",
          body: "A boundary high in the tree that caught an error on one route will still be showing its fallback on the next one, because nothing told it the situation changed. Key it on the route — `<ErrorBoundary key={pathname}>` — which is the same one-line fix as the retry.",
        },
      ],
    },
    {
      id: "root-options",
      heading: "React 19's root options",
      body: [
        "React 19 added three callbacks to `createRoot` and `hydrateRoot`, and together they are the first sane story for error reporting in React.",
        "**`onCaughtError`** — an error a boundary caught. Previously you had to put a `componentDidCatch` in every boundary to log; now there is one place.",
        "**`onUncaughtError`** — an error nothing caught, the one that blanks the page.",
        "**`onRecoverableError`** — React recovered on its own, but something was wrong: most commonly a hydration mismatch, which is module 12.",
        "Defining them also replaces React's own `console.error` for those cases, which is the reason the examples in this lesson can print clean output.",
      ],
      examples: [
        {
          id: "on-caught",
          title: "One place for every caught error",
          lang: "tsx",
          code: `import { Component, act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p>sorry</p> : this.props.children; }
}

function Boom() { throw new Error("bad response shape"); }

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container, {
  /* React 19: one place to send every caught error, instead of a
     componentDidCatch in each boundary. */
  onCaughtError(error, info) {
    console.log("onCaughtError →", (error as Error).message);
    console.log("  the boundary that caught it:", info.errorBoundary?.constructor?.name ?? "(not given)");
  },
});
await act(async () => { root.render(<Boundary><Boom /></Boundary>); });
console.log("page:", container.innerHTML);`,
          output: `onCaughtError → bad response shape
  the boundary that caught it: Boundary
page: <p>sorry</p>`,
          explanation:
            "The boundary still decides what to render; the root decides what to report. `info.errorBoundary` gives you the instance that caught it, which is how a report can say *which* boundary failed rather than just that one did.",
        },
      ],
    },
    {
      id: "placement",
      heading: "Where they go",
      body: [
        "**One at the root**, always, so a thrown error is an apology rather than a white page.",
        "**One per route**, so an error on one screen does not survive navigation to another.",
        "**One around each independent region** — a widget, a chart, a third-party embed. The test is whether the rest of the page is still worth showing if this part is gone. If it is, it deserves its own boundary.",
        "And **paired with Suspense**. The two are the same mechanism catching two kinds of throw, and a component that loads data can fail in both ways: it can be slow, and it can reject. A boundary for one without the other means half your failure modes are unhandled.",
      ],
      examples: [
        {
          id: "the-pair",
          title: "The pair, in the order that matters",
          lang: "jsx",
          code: `/* Error boundary outside, Suspense inside. If the fetch rejects, the
   promise's throw passes the Suspense boundary — which only handles
   promises — and lands on the error boundary above it. */
<ErrorBoundary fallback={(e, retry) => <Failed error={e} onRetry={retry} />}>
  <Suspense fallback={<CommentsSkeleton />}>
    <Comments postId={id} />
  </Suspense>
</ErrorBoundary>`,
          explanation:
            "Inside-out would not work: an error boundary below the Suspense boundary would never see a rejection from a component that suspended, because that component's render was unwound before it could throw the error. The error boundary has to be the outer one.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is an error boundary and why must it be a class?",
      answer:
        "A component that catches errors thrown while rendering anything below it and renders a fallback instead. It must be a class because the two lifecycles it needs — `getDerivedStateFromError`, called during the render phase, and `componentDidCatch`, called during commit — have no hook equivalents. It is the only reason left to write a class in modern React, which is why most teams install `react-error-boundary` rather than writing it out.",
    },
    {
      question: "What does an error boundary not catch?",
      answer:
        "Event handlers, async callbacks such as timeouts and promise handlers, server rendering, and errors thrown by the boundary's own render. The single rule underneath is that React catches what it is on the stack for: a render happens inside React's call stack, so a throw unwinds into React, but a click handler is called by the browser's event dispatch with React nowhere above it. Handler errors need an ordinary try/catch.",
    },
    {
      question: "What happens if there is no error boundary at all?",
      answer:
        "React unmounts the whole tree — the page goes blank. That is deliberate: a partially rendered interface is more dangerous than an absent one, because the parts that did render look authoritative. It also means a blank page is a React app's default failure mode, so one boundary near the root is not optional.",
    },
    {
      question: "How do you reset an error boundary?",
      answer:
        "Clear the error state, and change something about the attempt — otherwise the children throw again immediately and the retry button is an infinite loop. Bumping a `key` on the boundary is the reliable version, because it unmounts the failed subtree so no state survives into the retry, and the same trick keyed on the route stops a caught error from following the user to the next page.",
    },
    {
      question: "Where do error boundaries go relative to Suspense?",
      answer:
        "Outside. They are the same mechanism catching different throws — a promise goes to Suspense, an error goes to the error boundary — and a component that loads data can do both. An error boundary nested inside the Suspense boundary would never see a rejection, because the suspended render was already unwound past it.",
    },
  ],
  takeaways: [
    "With no boundary, one thrown error unmounts the entire tree and leaves a blank page",
    "`getDerivedStateFromError` is render-phase and must be pure; `componentDidCatch` is where logging goes",
    "Boundaries catch render, lifecycle and constructor throws — not handlers, async callbacks or their own render",
    "The rule is whether React is on the stack when the throw happens",
    "A reset must change something, or the retry loops; keying the boundary is the reliable version",
    "Key the boundary on the route so a caught error does not survive navigation",
    "React 19's `onCaughtError` / `onUncaughtError` / `onRecoverableError` give one place to report",
    "One at the root, one per route, one per independently-failing region",
    "Error boundary outside, Suspense inside — a rejection has to reach the outer one",
  ],
  status: "available",
};
