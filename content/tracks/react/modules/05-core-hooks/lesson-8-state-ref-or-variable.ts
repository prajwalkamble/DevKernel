import type { Lesson } from "@/content/types";

export const stateRefOrVariableLesson: Lesson = {
  id: "react-state-ref-or-variable",
  slug: "state-ref-or-variable",
  moduleSlug: "core-hooks",
  title: "State, a Ref, or Just a Variable",
  summary:
    "Four places a value can live, separated by two questions. Getting this wrong is behind both halves of the usual complaint — a component that re-renders when it should not, and one that shows a stale value when it should have updated.",
  estimatedMinutes: 25,
  objectives: [
    "Apply two questions that place any value correctly",
    "Say what a plain variable in a component body actually does",
    "Recognise state that should have been derived",
    "Recognise a ref that should have been state",
    "Place a value that belongs outside the component entirely",
  ],
  sections: [
    {
      id: "two-questions",
      heading: "Two questions",
      body: [
        "**Does it need to survive a re-render?** If not, a plain variable in the body is correct and costs nothing.",
        "**Must the screen change when it changes?** If yes, state. If no, a ref.",
        "That is the whole decision procedure, and it produces four homes:",
        "**A plain variable** — recreated every render, remembers nothing. Right for anything derived: a total, a filtered list, a class name, a formatted date.",
        "**A ref** — survives, does not re-render. Right for a timer id, a previous value, a DOM node, a mutable handle.",
        "**State** — survives, re-renders. Right for anything the user sees change.",
        "**Module scope** — survives everything, shared by every instance. Right for constants and caches, and wrong for anything per-instance.",
      ],
      examples: [
        {
          id: "four-homes",
          title: "The same increment, in four places",
          lang: "jsx",
          code: `import { useRef, useState, act } from "react";
import { createRoot } from "react-dom/client";

// Module scope: one value shared by every instance of the component.
let shared = 0;

function Box({ name }) {
  const [stateCount, setStateCount] = useState(0);
  const refCount = useRef(0);
  let plain = 0;

  function bumpAll() {
    plain++;            // gone the moment this render's variables are discarded
    refCount.current++; // survives, changes nothing on screen
    shared++;           // survives, and every Box shares it
    setStateCount((n) => n + 1);
  }

  return (
    <button id={name} onClick={bumpAll}>
      {name}: state={stateCount} ref={refCount.current} plain={plain} shared={shared}
    </button>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
const show = () => console.log("  ", container.textContent);

act(() => { root.render(<><Box name="a" /><Box name="b" /></>); });
console.log("mounted:");
show();

act(() => { container.querySelector("#a").click(); });
act(() => { container.querySelector("#a").click(); });
console.log("after clicking a twice:");
show();`,
          output: `mounted:
   a: state=0 ref=0 plain=0 shared=0b: state=0 ref=0 plain=0 shared=0
after clicking a twice:
   a: state=2 ref=2 plain=0 shared=2b: state=0 ref=0 plain=0 shared=0`,
          explanation:
            "Four values incremented identically, four different outcomes. `state` and `ref` both reached 2 for `a` and stayed 0 for `b` — per instance, as expected. `plain` never left 0, because each render made a new one. And `shared` reads 2 in `a` and **0 in `b`** — not because `b` has its own copy, but because `b` never re-rendered, so it is still displaying the value from mount. That last one is the whole danger of module scope: the data is shared and the display is not.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useRef, useState, act } from "react";
import { createRoot } from "react-dom/client";

// Module scope: one value shared by every instance of the component.
let shared = 0;

function Box({ name }: { name: string }) {
  const [stateCount, setStateCount] = useState(0);
  const refCount = useRef(0);
  let plain = 0;

  // All four are \`number\`. The type says nothing about lifetime, which is the
  // only thing that differs between them — that is what this example is for.
  function bumpAll() {
    plain++;            // gone the moment this render's variables are discarded
    refCount.current++; // survives, changes nothing on screen
    shared++;           // survives, and every Box shares it
    setStateCount((n) => n + 1);
  }

  return (
    <button id={name} onClick={bumpAll}>
      {name}: state={stateCount} ref={refCount.current} plain={plain} shared={shared}
    </button>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
const show = () => console.log("  ", container.textContent);

act(() => { root.render(<><Box name="a" /><Box name="b" /></>); });
console.log("mounted:");
show();

act(() => { container.querySelector<HTMLButtonElement>("#a")!.click(); });
act(() => { container.querySelector<HTMLButtonElement>("#a")!.click(); });
console.log("after clicking a twice:");
show();`,
            },
          ],
        },
      ],
    },
    {
      id: "should-be-derived",
      heading: "State that should have been a variable",
      body: [
        "The commonest excess. A value computed from other state or props does not need its own `useState` — computing it during render is one line, cannot go stale, and has no update path to get wrong.",
        "The tell is a `useEffect` whose only job is to set state from other state. Module 4's last lesson measured the cost: two renders per change, the first showing the old value.",
        "The exception is a value that must be allowed to *diverge* — a draft in a form that starts from a prop and is then edited. That genuinely is state, and the way to reset it is a `key`, not an effect.",
      ],
    },
    {
      id: "should-be-state",
      heading: "A ref that should have been state",
      body: [
        "The mirror mistake, usually made to avoid a re-render. Writing a value to a ref and expecting the screen to update is the most common way to be confused by React for an afternoon: the write succeeds, the value is correct, and nothing on the page moves.",
        "It is seductive because it half works. The ref really does hold the new value, so a later render — triggered by something else entirely — displays it, and the bug becomes intermittent.",
        "If the value appears in the returned JSX, it is state. There is no cleverness available here.",
      ],
      pitfalls: [
        {
          title: "A ref used to dodge a re-render loop is a bug wearing a fix",
          body: "The pattern is `if (!hasRun.current) { hasRun.current = true; doThing(); }` inside an effect, added because the effect was running twice. It suppresses Strict Mode's test rather than answering it, and it does nothing about the real remount cases in production — a `key` change or a Suspense resume runs the effect again with a fresh ref. The doubled run is a missing cleanup; write the cleanup.",
        },
      ],
    },
    {
      id: "outside",
      heading: "When it belongs outside the component",
      body: [
        "Some values are not per-instance at all: a constant configuration object, a `Map` caching parsed results, a client for a service, an id counter.",
        "Module scope is the right home, and it has two consequences worth accepting deliberately. The value is shared by every instance and by every render, which is usually the point. And **changing it re-renders nothing**, so it must never be something the UI displays — the example above shows a component still displaying `shared=0` after another instance had raised it to 2.",
        "Hoisting a constant out of a component also removes it from every dependency array it appeared in, which the dependency-array lesson showed is often the cleanest fix available.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you decide between state, a ref and a plain variable?",
      answer:
        "Two questions. Does it need to survive a re-render? If not, a plain variable is right — and anything derivable from props and state falls here. If it does need to survive: must the screen change when it changes? If yes, state; if no, a ref. Values that are not per-instance at all — constants, caches, clients — belong at module scope, remembering that changing them re-renders nothing.",
    },
    {
      question: "What happens to a plain `let` declared in a component body?",
      answer:
        "It is created fresh on every render and discarded with that render's scope, so it never carries a value forward — an increment in a handler is invisible by the next render. That is exactly right for derived values, which should be recomputed rather than remembered, and useless for anything that has to persist, which is what refs and state are for.",
    },
    {
      question: "What goes wrong when you use a ref for something displayed on screen?",
      answer:
        "The write succeeds and nothing re-renders, so the page keeps showing the old value while the ref holds the new one. It is a nasty bug because it half works: some later render caused by something else displays the correct value, so the symptom is intermittent rather than consistent. If a value appears in the returned JSX, it has to be state.",
    },
  ],
  takeaways: [
    "Two questions place any value: does it survive a re-render, and must the screen change with it",
    "A plain variable is recreated each render — correct for anything derived",
    "A ref survives and never re-renders; state survives and does re-render",
    "Displaying a ref's value gives a page that is intermittently right, which is worse than consistently wrong",
    "A ref guard added to stop an effect running twice suppresses the test instead of fixing the cleanup",
    "Module scope is shared across instances and re-renders nothing, so it must not be displayed",
  ],
  status: "available",
};
