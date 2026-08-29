import type { Lesson } from "@/content/types";

export const useDeferredValueLesson: Lesson = {
  id: "react-usedeferredvalue",
  slug: "usedeferredvalue",
  moduleSlug: "concurrent-react",
  title: "useDeferredValue",
  summary:
    "One piece of state, two values: the current one for the input and a lagging one for the expensive part. How it differs from a transition, why it is not a debounce, and the memo it needs to do anything at all.",
  estimatedMinutes: 27,
  objectives: [
    "Split a value into an urgent and a deferred copy",
    "Say why the expensive child must be memoised",
    "Choose between useDeferredValue and useTransition",
    "Explain why this is better than a debounce, and when it is not",
    "Use the initialValue argument for a first render",
  ],
  sections: [
    {
      id: "the-shape",
      heading: "The problem it is shaped for",
      body: [
        "A search box over ten thousand rows. The input must respond to every keystroke — an input that lags is unusable, and a user notices 50ms. The results list is expensive to render and nobody cares whether it is one keystroke behind.",
        "`startTransition` cannot help here, because the update you would need to mark is the input's own `setValue`, and deferring that is exactly what you must not do.",
        "`useDeferredValue` inverts the arrangement. The state update stays urgent; the hook gives you a **second, lagging copy** of the value, and the expensive subtree reads that one instead.",
      ],
      examples: [
        {
          id: "the-shape-code",
          title: "Two values from one piece of state",
          lang: "jsx",
          code: `function Search() {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);

  return (
    <>
      {/* Urgent. Every keystroke commits immediately. */}
      <input value={query} onChange={(e) => setQuery(e.target.value)} />

      {/* Not urgent, and reading a value that may be a keystroke behind. */}
      <Results query={deferred} />
    </>
  );
}`,
          explanation:
            "One `useState`, two values. `query` is always current; `deferred` catches up when React has time. The input is driven by the first and the expensive list by the second, which is the entire pattern.",
        },
      ],
    },
    {
      id: "what-it-does",
      heading: "What actually happens",
      body: [
        "On the render where the value changes, `useDeferredValue` returns the **old** value. React then schedules a second, low-priority render with the new one — and if the value changes again before that render commits, it is abandoned and restarted.",
        "So a burst of typing produces a burst of cheap renders and, typically, one expensive one at the end.",
      ],
      visual: {
        id: "deferred-visual",
        kind: "react-concurrent",
        algorithm: "deferred-value",
        title: "Five keystrokes, one expensive render",
        lockAlgorithm: true,
      },
      examples: [
        {
          id: "two-renders",
          title: "The two renders one change produces",
          lang: "tsx",
          code: `import { useState, useDeferredValue, act } from "react";
import { createRoot } from "react-dom/client";

const log: string[] = [];
let setText: (value: string) => void;

function Search() {
  const [text, set] = useState("a");
  setText = set;
  const deferred = useDeferredValue(text);
  log.push(\`render: text=\${text} deferred=\${deferred} stale=\${text !== deferred}\`);
  return <p>{deferred}</p>;
}

const container = document.createElement("div");
document.body.appendChild(container);
await act(async () => { createRoot(container).render(<Search />); });
log.push("--- setText('ab') ---");
await act(async () => { setText("ab"); });
console.log(log.join("\\n"));`,
          output: `render: text=a deferred=a stale=false
--- setText('ab') ---
render: text=ab deferred=a stale=true
render: text=ab deferred=ab stale=false`,
          explanation:
            "Two renders. In the first, `text` has already changed and `deferred` has not — that is the frame in which the input is up to date and the list is not. The `stale` flag is worth computing: comparing the two values is how you know to dim the results.",
        },
      ],
    },
    {
      id: "the-memo",
      heading: "The part everyone forgets",
      body: [
        "`useDeferredValue` does nothing on its own. Passing the deferred value to a child that re-renders anyway achieves precisely nothing, because the parent re-rendered and its children re-render with it — the deferred value merely arrives one render late at a component that was going to run twice regardless.",
        "**The expensive child must be wrapped in `memo`.** Then, on the urgent render, its props are unchanged (it still has the old deferred value), so React skips it entirely. On the low-priority render its props change and it runs once.",
        "This is module 9's rule doing the work: `memo` is what turns 'this prop did not change' into 'do not render this subtree'. `useDeferredValue` is only useful because it arranges for the prop not to change.",
      ],
      examples: [
        {
          id: "with-memo",
          title: "The two halves of the pattern",
          lang: "tsx",
          code: `/* Without this memo the hook is decoration: Results re-renders on every
   keystroke anyway, because its parent did. */
const Results = memo(function Results({ query }: { query: string }) {
  const matches = useMemo(() => search(rows, query), [query]);
  return <ul>{matches.map((row) => <li key={row.id}>{row.title}</li>)}</ul>;
});

function Search() {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  /* Comparing the two values is the pending indicator — no extra state. */
  const stale = query !== deferred;

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <div style={{ opacity: stale ? 0.6 : 1 }}>
        <Results query={deferred} />
      </div>
    </>
  );
}`,
          explanation:
            "`memo` and `useMemo` are doing different jobs here. `memo` skips the component when `query` has not changed; `useMemo` skips the search when it has not. Remove either and the pattern degrades — remove `memo` and you lose the skipped render, remove `useMemo` and the low-priority render is as expensive as it ever was.",
        },
      ],
      pitfalls: [
        {
          title: "It defers the value, not the work",
          body: "If the expensive part is inside the same component as the input, there is nothing to skip: the component re-renders on every keystroke and the deferred value is just an old string sitting in a variable. The expensive work has to be in a separate, memoised component for the hook to have anything to skip.",
        },
      ],
    },
    {
      id: "not-a-debounce",
      heading: "Why this is not a debounce",
      body: [
        "A debounce is a timer: wait 300ms after the last keystroke, then do the work. `useDeferredValue` has no timer, and the difference matters in both directions.",
        "**On a fast machine it is faster.** A debounce always waits 300ms, even when the render would have taken 4ms. The deferred render starts immediately and finishes when it finishes, so on a fast device the user sees no lag at all.",
        "**On a slow machine it adapts.** A debounce's 300ms was chosen on somebody's laptop. `useDeferredValue` yields as often as it needs to, so it degrades gracefully rather than at a fixed threshold.",
        "**It never leaves a stale render on screen.** A debounced render that is superseded still runs to completion and commits. A deferred one is abandoned mid-render, so the intermediate results never reach the screen.",
        "The one thing a debounce does that this does not: **reduce network requests.** `useDeferredValue` only defers rendering. If each keystroke fires a request, you still need a debounce, or a cancellation, or both — module 7's problem, unchanged.",
      ],
    },
    {
      id: "against-usetransition",
      heading: "Against useTransition",
      body: [
        "They do the same scheduling and are chosen by **who owns the state**.",
        "**`useTransition`** when you own the update. You are calling `setState`, so you can wrap it. It gives you `isPending`, and it defers the update itself.",
        "**`useDeferredValue`** when you do not. The value arrives as a prop, or comes from a context, or from a library's hook, and there is no `setState` of yours to wrap. It also fits the case where the same state must be urgent for one consumer and not for another — which a transition cannot express, because a transition is a property of the update rather than of the reader.",
        "The search box is the second case in disguise: the state is yours, but the input needs it urgently, so wrapping the update is not an option.",
      ],
      examples: [
        {
          id: "initial-value",
          title: "The second argument",
          lang: "tsx",
          code: `import { useState, useDeferredValue, act } from "react";
import { createRoot } from "react-dom/client";

const log: string[] = [];

function Results() {
  const [query] = useState("react");
  /* On the very first render there is no previous value to fall back to, so
     without this argument the deferred value is simply the current one and
     the first render is the expensive one. */
  const deferred = useDeferredValue(query, "");
  log.push(\`render query="\${query}" deferred="\${deferred}"\`);
  return <p>{deferred || "…"}</p>;
}

const container = document.createElement("div");
document.body.appendChild(container);
await act(async () => { createRoot(container).render(<Results />); });
console.log(log.join("\\n"));
console.log("final DOM:", container.innerHTML);`,
          output: `render query="react" deferred=""
render query="react" deferred="react"
final DOM: <p>react</p>`,
          explanation:
            "With an `initialValue`, the first render gets that instead of the real value, so the expensive subtree can render something cheap immediately and catch up in the background. Without it, mount is the one render where `useDeferredValue` gives you nothing.",
        },
      ],
      pitfalls: [
        {
          title: "Do not defer a value that feeds an input",
          body: "`<input value={deferred} />` makes the input lag by construction — the characters appear late, and typing quickly can reorder them. The current value belongs to the input; the deferred one belongs to whatever is expensive.",
        },
        {
          title: "A new object every render defeats it",
          body: "`useDeferredValue({ query })` compares by `Object.is`, so a fresh object is always different, the deferred copy is always new, and the memoised child never skips. Defer the primitive, or the same object identity — module 9's identity rule again.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does useDeferredValue do?",
      answer:
        "It returns a second copy of a value that lags behind the real one. On the render where the value changes it returns the previous value and schedules a low-priority render with the new one; if the value changes again before that render commits, the render is abandoned and restarted. So the component gets an urgent render with the old value and, eventually, one background render with the new one.",
    },
    {
      question: "Why does useDeferredValue need memo to be useful?",
      answer:
        "Because the parent re-renders on every keystroke, and its children re-render with it whether or not their props changed. The deferred value only helps if the expensive child is wrapped in `memo` — then, on the urgent render, its prop is unchanged (it still holds the old value) and React skips the subtree entirely. Without the memo the hook just hands an old string to a component that was going to re-render anyway.",
    },
    {
      question: "When would you use useDeferredValue rather than useTransition?",
      answer:
        "When you do not own the update. The value arrives as a prop, from a context, or from a library hook, so there is no `setState` of yours to wrap. It also covers the case where one piece of state must be urgent for one consumer and deferred for another — a search box, where the input needs the value immediately and the results do not — which a transition cannot express, because a transition marks the update rather than the reader.",
    },
    {
      question: "How is it different from debouncing?",
      answer:
        "There is no timer. A debounce always waits its fixed delay, even on a machine where the render takes 4ms, and its number was tuned on somebody's laptop. A deferred render starts immediately, adapts to how fast the device actually is, and — because it can be abandoned before committing — never puts a superseded result on screen. What it does not do is reduce network requests: it defers rendering only, so a per-keystroke fetch still needs debouncing or cancellation.",
    },
  ],
  takeaways: [
    "One state, two values: the current one and a lagging copy",
    "The changing render returns the old value; a low-priority render follows with the new one",
    "A newer value abandons the in-flight background render, so intermediates never commit",
    "The expensive consumer must be wrapped in `memo` or the hook does nothing",
    "`query !== deferred` is a free pending indicator",
    "Not a debounce: no timer, adapts to the device, and never commits a superseded render",
    "It does not reduce network requests — only renders",
    "`useTransition` when you own the update; `useDeferredValue` when you only have the value",
    "`initialValue` covers the first render, where there is no previous value to lag behind",
  ],
  status: "available",
};
