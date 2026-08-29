import type { Lesson } from "@/content/types";

export const whatUseStateStoresLesson: Lesson = {
  id: "react-what-usestate-stores",
  slug: "what-usestate-stores",
  moduleSlug: "state-and-events",
  title: "What `useState` Actually Stores",
  summary:
    "State belongs to a component *instance*, not to a component, and React finds it by call order rather than by name. That one mechanism explains the initial value being ignored, two counters counting separately, and why hooks may not go inside an `if`.",
  estimatedMinutes: 30,
  objectives: [
    "Say where React keeps state and what it is keyed by",
    "Explain why the initial value is ignored after the first render",
    "Use a lazy initialiser, and say when it is worth it",
    "Show that two instances of one component hold separate state",
    "Connect the Rules of Hooks to the storage mechanism",
  ],
  sections: [
    {
      id: "per-instance",
      heading: "State belongs to an instance",
      body: [
        "`useState` does not store anything on your function. It stores a value against the **instance** React is currently rendering — the entry in its internal tree for that position, which module 2 called the thing a key change throws away.",
        "So two `<Counter />` elements in a page are two instances with two independent pieces of state, with no effort on your part and no way to make them share by accident. Sharing is the thing that takes work, which is what module 3's lesson on lifting was about.",
      ],
      examples: [
        {
          id: "two-instances",
          title: "One component, two instances, two counts",
          lang: "jsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

function Counter({ name }) {
  const [count, setCount] = useState(0);
  return (
    <button id={name} onClick={() => setCount(count + 1)}>
      {name}:{count}
    </button>
  );
}

function App() {
  return (
    <>
      <Counter name="a" />
      <Counter name="b" />
    </>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

act(() => { root.render(<App />); });
console.log("mounted: ", container.textContent);

act(() => { container.querySelector("#a").click(); });
act(() => { container.querySelector("#a").click(); });
console.log("clicked a twice:", container.textContent);`,
          output: `mounted:  a:0b:0
clicked a twice: a:2b:0`,
          explanation:
            "The same function produced both buttons, and clicking one moved only its own number. That is what \"state belongs to the instance\" means in practice — and it is why a component with state can be rendered anywhere, any number of times, without the instances knowing about each other.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

function Counter({ name }: { name: string }) {
  const [count, setCount] = useState(0);
  return (
    <button id={name} onClick={() => setCount(count + 1)}>
      {name}:{count}
    </button>
  );
}

function App() {
  return (
    <>
      <Counter name="a" />
      <Counter name="b" />
    </>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

act(() => { root.render(<App />); });
console.log("mounted: ", container.textContent);

// \`querySelector\` returns \`Element | null\`, and \`click\` is on HTMLElement —
// so the type argument and the \`!\` are both doing work here.
act(() => { container.querySelector<HTMLButtonElement>("#a")!.click(); });
act(() => { container.querySelector<HTMLButtonElement>("#a")!.click(); });
console.log("clicked a twice:", container.textContent);`,
            },
          ],
        },
      ],
    },
    {
      id: "call-order",
      heading: "React finds it by call order",
      body: [
        "React does not know your variable names. `const [count, setCount] = useState(0)` is array destructuring of a two-element array; the names are entirely yours.",
        "What React has is a **list per instance**, and it matches calls to entries by the order they happen in. The first `useState` in a render gets the first slot, the second gets the second, and so on. On the next render it walks the same list in the same order and hands back what it stored.",
        "Every Rule of Hooks falls out of that. Put a hook behind an `if` and the order changes between renders, so the second `useState` now reads the slot that belonged to a different piece of state — silently, with the wrong value, and with no error at the point of the mistake. Module 5 covers the rules properly; this is the mechanism underneath them.",
      ],
    },
    {
      id: "initial-value",
      heading: "The initial value is used once",
      body: [
        "The argument to `useState` is the value for the **first render of that instance**. On every later render React already has a value stored and ignores the argument entirely.",
        "This surprises people when the argument is a prop: `useState(props.name)` seeds the state on mount and then never updates it again, however much `props.name` changes. That is not a bug in `useState` — it is what \"initial\" means — but it is one of the most common sources of stale UI.",
        "When the state genuinely should reset as a prop changes, the answer is the one from module 2: give the component a `key` derived from that prop, so a change is a new instance with a fresh initial value.",
      ],
      examples: [
        {
          id: "initial-ignored",
          title: "The argument after the first render",
          lang: "jsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

function Seeded({ from }) {
  // Seeded once. Later values of \`from\` never reach it.
  const [value, setValue] = useState(from);
  return (
    <button id="b" onClick={() => setValue(value + 1)}>
      prop={from} state={value}
    </button>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

act(() => { root.render(<Seeded from={10} />); });
console.log("mounted:            ", container.textContent);

// The prop changes; the state does not.
act(() => { root.render(<Seeded from={99} />); });
console.log("re-rendered from=99:", container.textContent);

// Unless the identity changes, which makes it a different instance.
act(() => { root.render(<Seeded key="second" from={99} />); });
console.log("with a new key:     ", container.textContent);`,
          output: `mounted:             prop=10 state=10
re-rendered from=99: prop=99 state=10
with a new key:      prop=99 state=99`,
          explanation:
            "The middle line is the whole lesson: the prop is 99 and the state is still 10. React rendered the same component at the same position, so it kept the instance, and a kept instance already has a stored value — the `from` argument was never consulted again. The third line changes the `key`, which makes it a *different* instance, so React mounted a fresh one and the initial value applied. That is the supported way to reset state when a prop changes, and it is one line rather than an effect that watches `from`.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

function Seeded({ from }: { from: number }) {
  // Seeded once. Later values of \`from\` never reach it — and nothing in the
  // type says so, which is exactly why this surprises people.
  const [value, setValue] = useState(from);
  return (
    <button id="b" onClick={() => setValue(value + 1)}>
      prop={from} state={value}
    </button>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

act(() => { root.render(<Seeded from={10} />); });
console.log("mounted:            ", container.textContent);

// The prop changes; the state does not.
act(() => { root.render(<Seeded from={99} />); });
console.log("re-rendered from=99:", container.textContent);

// Unless the identity changes, which makes it a different instance.
act(() => { root.render(<Seeded key="second" from={99} />); });
console.log("with a new key:     ", container.textContent);`,
            },
          ],
        },
      ],
    },
    {
      id: "lazy-init",
      heading: "The lazy initialiser",
      body: [
        "`useState(expensive())` calls `expensive()` on **every** render and throws the result away on all but the first. The argument is evaluated before `useState` is called — ordinary JavaScript, nothing React can do about it.",
        "`useState(() => expensive())` passes a function instead. React calls it only on the first render of the instance. The cost of the initial value is then paid once, which is what you meant.",
        "It matters when the initial value is genuinely expensive: parsing something out of `localStorage`, building a large structure, reading from the DOM. For `useState(0)` it is noise.",
        "The mirror-image trap: `useState(someFunction)` **stores the function's result**, because React assumes any function you pass is an initialiser. To store a function as state you must wrap it: `useState(() => someFunction)`.",
      ],
      examples: [
        {
          id: "lazy",
          title: "How many times the initialiser runs",
          lang: "jsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

let eagerCalls = 0;
let lazyCalls = 0;

function expensive(which) {
  if (which === "eager") eagerCalls++; else lazyCalls++;
  return 0;
}

function Both() {
  // Called on every render; the result is used only on the first.
  const [a, setA] = useState(expensive("eager"));
  // Called only on the first render.
  const [b] = useState(() => expensive("lazy"));
  return <button id="b" onClick={() => setA(a + 1)}>{a}{b}</button>;
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

act(() => { root.render(<Both />); });
act(() => { container.querySelector("#b").click(); });
act(() => { container.querySelector("#b").click(); });

console.log("renders:        3");
console.log("eager calls:   ", eagerCalls);
console.log("lazy calls:    ", lazyCalls);`,
          output: `renders:        3
eager calls:    3
lazy calls:     1`,
          explanation:
            "Three renders, three calls to the eager initialiser and one to the lazy one. Two of the three eager calls did work whose result React discarded immediately. With `useState(0)` that is irrelevant; with `useState(JSON.parse(localStorage.getItem(\"draft\")))` it is a parse on every keystroke.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

let eagerCalls = 0;
let lazyCalls = 0;

function expensive(which: "eager" | "lazy") {
  if (which === "eager") eagerCalls++; else lazyCalls++;
  return 0;
}

function Both() {
  // Called on every render; the result is used only on the first. Both lines
  // type-check identically — \`useState<number>\` either way — so the cost is
  // invisible to the compiler.
  const [a, setA] = useState(expensive("eager"));
  // Called only on the first render.
  const [b] = useState(() => expensive("lazy"));
  return <button id="b" onClick={() => setA(a + 1)}>{a}{b}</button>;
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

act(() => { root.render(<Both />); });
act(() => { container.querySelector<HTMLButtonElement>("#b")!.click(); });
act(() => { container.querySelector<HTMLButtonElement>("#b")!.click(); });

console.log("renders:        3");
console.log("eager calls:   ", eagerCalls);
console.log("lazy calls:    ", lazyCalls);`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Storing a function in state needs two arrows",
          body: "`useState(handleClick)` calls `handleClick` and stores what it returned, because React cannot distinguish \"a function to call for the initial value\" from \"a function as the initial value\". Write `useState(() => handleClick)` to store the function itself. The same applies to the setter: `setCallback(fn)` calls `fn` as an updater, so use `setCallback(() => fn)`.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Where does React store state, and what is it keyed by?",
      answer:
        "In its own internal record for the component *instance* — the entry in the tree at that position — not on your function and not by variable name. Within an instance the values sit in a list, matched to `useState` calls by the order those calls happen. That is why two elements of the same component hold independent state, and why hooks must be called unconditionally in the same order every render.",
    },
    {
      question: "Why doesn't `useState(props.value)` update when the prop changes?",
      answer:
        "Because the argument is the *initial* value, used only on the first render of that instance; afterwards React has a stored value and ignores the argument. If the state should reset when the prop changes, give the component a `key` derived from that prop — a new key is a new instance, so it mounts fresh with the new initial value. Synchronising it with an effect instead is the pattern module 7 argues against.",
    },
    {
      question: "What is a lazy initialiser and when do you need one?",
      answer:
        "Passing a function — `useState(() => expensive())` — so React calls it only on the first render, instead of `useState(expensive())`, where the argument is evaluated on every render and discarded on all but the first. It matters when producing the initial value is genuinely costly: parsing stored JSON, building a large structure, measuring the DOM. It is also the only way to *store* a function in state, since a bare function argument is treated as an initialiser.",
    },
  ],
  takeaways: [
    "State belongs to a component instance, so two elements of one component never share it by accident",
    "React matches `useState` calls to stored values by call order, which is where every Rule of Hooks comes from",
    "The argument is the initial value for that instance and is ignored on every later render",
    "To reset state when a prop changes, change the component's `key` rather than synchronising it",
    "`useState(() => …)` runs the initialiser once; `useState(expensive())` runs it every render",
    "Storing a function in state needs `useState(() => fn)`, because a bare function is taken as an initialiser",
  ],
  status: "available",
};
