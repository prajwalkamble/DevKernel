import type { Lesson } from "@/content/types";

export const useRefLesson: Lesson = {
  id: "react-useref",
  slug: "useref",
  moduleSlug: "core-hooks",
  title: "`useRef`: DOM Access, and Values That Survive a Render",
  summary:
    "A ref is a box that persists across renders and does not cause one when you change it. That single sentence covers both of its jobs — reaching a DOM node, and remembering something the screen does not show.",
  estimatedMinutes: 30,
  objectives: [
    "Describe what `useRef` returns and what persists",
    "Attach a ref to a DOM node and use it imperatively",
    "Store a mutable value across renders without re-rendering",
    "Say why reading or writing a ref during render is a mistake",
    "Use a ref callback, and know when it runs",
  ],
  sections: [
    {
      id: "what-it-is",
      heading: "A box that survives",
      body: [
        "`useRef(initial)` returns an object with one property: `{ current: initial }`. React keeps **the same object** for the life of the component instance, so anything you put in `current` is still there on the next render.",
        "Two properties follow, and they are the whole hook.",
        "**Changing `current` does not re-render.** No queue, no scheduling, nothing. The write is immediate and invisible to React.",
        "**`current` is not tracked.** Nothing depends on it, nothing recomputes when it changes, and the screen will not update to reflect it.",
        "So a ref is for values that need to survive renders but do not belong on screen: a timer id, a previous value, a subscription handle, a DOM node.",
      ],
    },
    {
      id: "dom-access",
      heading: "Reaching a DOM node",
      body: [
        "Pass a ref as the `ref` attribute of a host element and React sets `current` to the DOM node during commit, before your effects run. It sets it back to `null` when the element is removed.",
        "This is the supported way to do the small number of things that are genuinely imperative: focusing, scrolling into view, measuring, selecting text, playing media, and handing a node to a non-React library.",
        "In React 19 `ref` is an ordinary prop, so a component can accept and forward one without `forwardRef`. Older code wraps components in `forwardRef` for exactly this and still works.",
      ],
      examples: [
        {
          id: "dom-ref",
          title: "Focusing and measuring a real node",
          lang: "tsx",
          code: `import { useRef, act } from "react";
import { createRoot } from "react-dom/client";

function Form() {
  const inputRef = useRef(null);

  return (
    <>
      <input id="field" ref={inputRef} defaultValue="" />
      <button id="focus" type="button" onClick={() => inputRef.current.focus()}>
        focus
      </button>
      <button id="read" type="button" onClick={() => console.log("  tag:", inputRef.current.tagName)}>
        read
      </button>
    </>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

act(() => { root.render(<Form />); });
console.log("before clicking, focused:", document.activeElement.tagName);

act(() => { container.querySelector("#focus").click(); });
console.log("after focus click, focused id:", document.activeElement.id);

act(() => { container.querySelector("#read").click(); });`,
          output: `before clicking, focused: BODY
after focus click, focused id: field
  tag: INPUT`,
          explanation:
            "`inputRef.current` is the real `<input>` element — the same object `document.querySelector` would return — so every DOM API is available on it. Note that both uses are inside event handlers. That is the normal case: something happened, and now the node needs to be told about it.",
        },
      ],
      pitfalls: [
        {
          title: "The ref is `null` during the first render",
          body: "Refs are attached during commit, and the first render happens before that — so reading `ref.current` in the component body on the first pass gives `null`, always. Code that measures an element belongs in a layout effect, which runs after attachment. This is also why `ref.current.focus()` written directly in the body crashes on mount while the same call in a handler is fine.",
        },
      ],
    },
    {
      id: "values",
      heading: "Remembering something between renders",
      body: [
        "The second job has nothing to do with the DOM. A ref is the place for a value that must persist and must not trigger a render.",
        "The canonical cases: the id returned by `setInterval` so a later cleanup can clear it; the previous value of a prop, for comparing; whether a component has interacted yet; a mutable handle to a chart or map instance.",
        "The test is simple: **would the screen need to change when this value changes?** If yes it is state. If no it is a ref.",
      ],
      examples: [
        {
          id: "ref-vs-state",
          title: "Three ways to hold a number",
          lang: "tsx",
          code: `import { useRef, useState, act } from "react";
import { createRoot } from "react-dom/client";

let renders = 0;

function Counters() {
  renders++;
  const [stateCount, setStateCount] = useState(0);
  const refCount = useRef(0);
  let plain = 0;                       // a fresh variable every render

  return (
    <>
      <span id="v">state={stateCount} ref={refCount.current} plain={plain}</span>
      <button id="bump-ref" onClick={() => { refCount.current++; plain++; }}>ref</button>
      <button id="bump-state" onClick={() => setStateCount((n) => n + 1)}>state</button>
    </>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
const show = (label) => console.log(label, container.querySelector("#v").textContent, "| renders:", renders);

act(() => { root.render(<Counters />); });
show("mounted:       ");

act(() => { container.querySelector("#bump-ref").click(); });
act(() => { container.querySelector("#bump-ref").click(); });
show("two ref bumps: ");

act(() => { container.querySelector("#bump-state").click(); });
show("one state bump:");`,
          output: `mounted:        state=0 ref=0 plain=0 | renders: 1
two ref bumps:  state=0 ref=0 plain=0 | renders: 1
one state bump: state=1 ref=2 plain=0 | renders: 2`,
          explanation:
            "The middle line is the point: two ref bumps changed nothing on screen and caused no render — the count stayed at 1. The ref had been counting the whole time, which the third line proves: a single state bump forced a render, and that render read `refCount.current` and found **2**. The plain variable never got past 0, because each render created a fresh one. Three ways to hold a number, and only one of them both persists and shows.",
        },
      ],
    },
    {
      id: "during-render",
      heading: "Do not read or write a ref during render",
      body: [
        "React's rule is that reading or writing `ref.current` during rendering is not allowed. It is not a style preference — it makes the render impure, and module 2 established what depends on renders being pure.",
        "Writing during render means two calls of the same component with the same props produce different results, which breaks Strict Mode's check and any render React discards and retries.",
        "Reading during render means the output depends on something React does not track, so the screen can show a value that no longer matches the ref with nothing to trigger a correction.",
        "The legitimate places are **event handlers** and **effects**. Both run after rendering, when the component is settled.",
        "The one blessed exception is lazy initialisation — `if (ref.current === null) ref.current = expensive()` — which is idempotent and is what React's own documentation suggests for creating a value once.",
      ],
    },
    {
      id: "ref-callback",
      heading: "The ref callback",
      body: [
        "`ref` also accepts a function instead of a ref object. React calls it with the node when it is attached and with `null` when it is detached — so it is the hook-free way to react to a node appearing.",
        "It is the right tool when you need to *do* something the moment a node exists: measure it, observe it, focus it conditionally. A layout effect can do the same, but the callback fires exactly when the node arrives and needs no dependency array.",
        "In React 19 a ref callback may return a cleanup function, which React calls on detach — the same shape as an effect, and it replaces the awkward `if (node === null)` branch older code uses.",
        "The trap: an inline arrow is a new function every render, so React detaches and reattaches on each one, calling it with `null` and then the node again. Harmless for a focus call, wasteful for setting up an observer — define the callback outside the render, or use `useCallback`.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between a ref and state?",
      answer:
        "Both survive across renders; only state causes one. Writing `ref.current` is immediate and invisible to React, so nothing re-renders and nothing recomputes, while a state update queues a change and schedules a render. The decision is whether the screen must change when the value changes: if yes it is state, if no it is a ref. A plain variable is neither — it is recreated on every render and remembers nothing.",
    },
    {
      question: "Why can't you read or write a ref during render?",
      answer:
        "It makes the render impure. Writing during render means two calls with the same props can produce different output, which breaks Strict Mode's double invocation and any render React discards and retries. Reading during render makes the output depend on a value React does not track, so the screen can disagree with the ref and nothing will correct it. Event handlers and effects are the legitimate places; the one exception is idempotent lazy initialisation.",
    },
    {
      question: "When would you use a ref callback rather than a ref object?",
      answer:
        "When you need to act the moment a node is attached or detached — measuring it, attaching an observer, focusing it conditionally. React calls the function with the node and later with `null`, and in React 19 the callback may return a cleanup function instead. Watch for the inline arrow: a new function every render makes React detach and reattach the node each time, which is wasteful for anything that sets something up.",
    },
  ],
  takeaways: [
    "`useRef` returns a stable `{ current }` object; changing `current` never re-renders",
    "It has two jobs: reaching a DOM node, and remembering a value the screen does not show",
    "`ref.current` is `null` during the first render — measuring belongs in a layout effect",
    "The test is whether the screen must change when the value does; if not, it is a ref",
    "Reading or writing a ref during render is impure; handlers and effects are where it belongs",
    "A ref callback fires on attach and detach, and an inline one re-fires every render",
  ],
  status: "available",
};
