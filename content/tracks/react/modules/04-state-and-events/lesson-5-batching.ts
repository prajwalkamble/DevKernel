import type { Lesson } from "@/content/types";

export const batchingLesson: Lesson = {
  id: "react-batching",
  slug: "batching",
  moduleSlug: "state-and-events",
  title: "Batching, and What React 18 Changed",
  summary:
    "React collects every update queued in one go and re-renders once. Before React 18 it only did that inside its own event handlers, which made a promise callback behave differently from a click — and is why older advice about batching is now wrong.",
  estimatedMinutes: 25,
  objectives: [
    "Say what batching is and what it is for",
    "Show that several setters produce one re-render",
    "Explain what automatic batching changed in React 18",
    "Say when `flushSync` is appropriate, and what it costs",
    "Stop optimising for a render count that was never going to be high",
  ],
  sections: [
    {
      id: "what-it-is",
      heading: "One pass, however many setters",
      body: [
        "React does not re-render per setter call. It collects everything queued during a synchronous stretch of work, applies it all, and renders once.",
        "The reason is that an intermediate state is not a state anybody should see. A handler that sets a name, an email and a validity flag passes through combinations that were never true together — a new name with the old validity. Rendering those would be visible as flicker and, worse, would run effects against states that never really existed.",
        "So batching is not primarily a performance feature. It is a consistency feature that happens to be faster.",
      ],
      examples: [
        {
          id: "batched",
          title: "Three pieces of state, one render",
          lang: "jsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

let renders = 0;

function Form() {
  renders++;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [valid, setValid] = useState(false);

  function fill() {
    setName("Ada");
    setEmail("ada@example.com");
    setValid(true);
  }

  return (
    <>
      <span id="v">{name}|{email}|{String(valid)}</span>
      <button id="b" onClick={fill}>fill</button>
    </>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

act(() => { root.render(<Form />); });
console.log("mounted, renders:", renders);

act(() => { container.querySelector("#b").click(); });
console.log("after three setters, renders:", renders);
console.log("state:", container.querySelector("#v").textContent);`,
          output: `mounted, renders: 1
after three setters, renders: 2
state: Ada|ada@example.com|true`,
          explanation:
            "One extra render for three setters. No render ever showed `Ada` with an empty email, which is the point — that combination was never a real state of this form, and React never displayed it as one.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

let renders = 0;

function Form() {
  renders++;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [valid, setValid] = useState(false);

  function fill() {
    setName("Ada");
    setEmail("ada@example.com");
    setValid(true);
  }

  return (
    <>
      <span id="v">{name}|{email}|{String(valid)}</span>
      <button id="b" onClick={fill}>fill</button>
    </>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

act(() => { root.render(<Form />); });
console.log("mounted, renders:", renders);

act(() => { container.querySelector<HTMLButtonElement>("#b")!.click(); });
console.log("after three setters, renders:", renders);
console.log("state:", container.querySelector("#v")!.textContent);`,
            },
          ],
        },
      ],
    },
    {
      id: "react-18",
      heading: "What automatic batching changed",
      body: [
        "Before React 18, batching applied only inside React's own event handlers. Updates from anywhere else — a `setTimeout`, a promise callback, a native event listener, a websocket message — each triggered their own render.",
        "That produced a genuinely confusing inconsistency: the same three setters batched in an `onClick` and did not batch in the `.then()` of a fetch, and nothing in the code said so.",
        "React 18 made batching **automatic everywhere**. The same three setters now produce one render regardless of where they run. Almost nothing needed changing when this landed, which is the usual sign of a good default — but it does mean older articles about \"unbatched updates outside React events\" describe a version you are not using.",
      ],
      examples: [
        {
          id: "auto-batching",
          title: "In a handler, and in a promise",
          lang: "jsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

let renders = 0;

function Two() {
  renders++;
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);

  return (
    <>
      <span id="v">{a}/{b}</span>
      {/* Inside a React event handler. */}
      <button id="sync" onClick={() => { setA((x) => x + 1); setB((x) => x + 1); }}>sync</button>
      {/* Outside one: before React 18 this was two renders. */}
      <button id="async" onClick={() => {
        Promise.resolve().then(() => { setA((x) => x + 1); setB((x) => x + 1); });
      }}>async</button>
    </>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

act(() => { root.render(<Two />); });
console.log("mounted, renders:", renders);

act(() => { container.querySelector("#sync").click(); });
console.log("two setters in a handler -> renders:", renders, "| state:", container.querySelector("#v").textContent);

await act(async () => { container.querySelector("#async").click(); });
console.log("two setters in a promise -> renders:", renders, "| state:", container.querySelector("#v").textContent);`,
          output: `mounted, renders: 1
two setters in a handler -> renders: 2 | state: 1/1
two setters in a promise -> renders: 3 | state: 2/2`,
          explanation:
            "One extra render each time. On React 17 the second case would have printed `4` — two setters outside a React event, two renders. That difference is the whole of automatic batching, and it is why a codebase that carefully avoided setting two pieces of state in a promise callback is carrying a workaround it no longer needs.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

let renders = 0;

function Two() {
  renders++;
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);

  return (
    <>
      <span id="v">{a}/{b}</span>
      {/* Inside a React event handler. */}
      <button id="sync" onClick={() => { setA((x) => x + 1); setB((x) => x + 1); }}>sync</button>
      {/* Outside one: before React 18 this was two renders. Identical types
          in both branches — batching is a scheduling fact, not a typed one. */}
      <button id="async" onClick={() => {
        Promise.resolve().then(() => { setA((x) => x + 1); setB((x) => x + 1); });
      }}>async</button>
    </>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

act(() => { root.render(<Two />); });
console.log("mounted, renders:", renders);

act(() => { container.querySelector<HTMLButtonElement>("#sync")!.click(); });
console.log("two setters in a handler -> renders:", renders, "| state:", container.querySelector("#v")!.textContent);

await act(async () => { container.querySelector<HTMLButtonElement>("#async")!.click(); });
console.log("two setters in a promise -> renders:", renders, "| state:", container.querySelector("#v")!.textContent);`,
            },
          ],
        },
      ],
    },
    {
      id: "flushsync",
      heading: "`flushSync`, and when it is legitimate",
      body: [
        "`flushSync(() => setOpen(true))` forces React to render and commit that update before returning, opting out of batching for that call.",
        "It exists for the case where you must read the DOM *after* an update and *before* the browser paints: measuring an element you have just revealed, scrolling to a row you have just added, or moving focus into something that did not exist a moment ago.",
        "It is a genuine escape hatch and a bad habit. Each call is a synchronous render and commit, so using it to \"make state update immediately\" gives up batching, concurrent rendering and the consistency guarantee, in exchange for a mental model that was wrong anyway.",
        "Before reaching for it, check whether a `ref` callback or a layout effect gets you the same measurement without forcing an extra commit. Module 11 covers the interaction with concurrent rendering, which is where the cost really shows.",
      ],
      pitfalls: [
        {
          title: "Batching is not a reason to merge unrelated state",
          body: "Because setters batch, splitting `useState` into four separate calls costs no extra renders compared with one object holding four fields. Combining unrelated values into a single state object to \"reduce renders\" achieves nothing and makes every update a spread that can drop a field. Split state by what changes together, which is the subject of the last lesson in this module.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is batching, and why does React do it?",
      answer:
        "React collects all the updates queued during one synchronous stretch of work and re-renders once with all of them applied. The main reason is consistency rather than speed: a handler that sets three pieces of state passes through intermediate combinations that were never valid together, and rendering those would show flicker and run effects against states that never existed. Being faster is a side effect.",
    },
    {
      question: "What did automatic batching change in React 18?",
      answer:
        "Before 18, batching applied only inside React's own event handlers; updates from a timeout, a promise callback or a native listener each caused their own render. React 18 batches everywhere, so the same two setters produce one render whether they run in an `onClick` or in a `.then()`. It also means older advice about avoiding multiple setters outside React events no longer applies.",
    },
    {
      question: "When would you use `flushSync`?",
      answer:
        "When you must read or act on the DOM after an update but before the browser paints — measuring an element you just revealed, scrolling to a newly added row, focusing something that did not exist a moment ago. It forces a synchronous render and commit, giving up batching and concurrent rendering for that update, so it is an escape hatch rather than a way to make state feel synchronous. A ref callback or a layout effect often achieves the same thing without it.",
    },
  ],
  takeaways: [
    "React collects updates queued in one stretch of work and renders once",
    "Batching is a consistency guarantee first — it prevents rendering combinations that were never true",
    "React 18 made batching automatic everywhere, including timeouts, promises and native listeners",
    "Advice about unbatched updates outside React events describes React 17 and earlier",
    "`flushSync` opts out for one update, for measuring or focusing before paint",
    "Since setters batch, splitting state into several `useState` calls costs no extra renders",
  ],
  status: "available",
};
