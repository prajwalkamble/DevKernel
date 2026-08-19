import type { Lesson } from "@/content/types";

export const stateAndHooksLesson: Lesson = {
  id: "react-state-and-hooks",
  slug: "state-and-your-first-hook",
  moduleSlug: "foundations",
  title: "State & Your First Hook",
  summary:
    "What a hook is, why useState exists at all, and the three things about state that surprise everyone: updates are queued, a render sees a frozen snapshot, and objects must be replaced rather than edited.",
  estimatedMinutes: 35,
  objectives: [
    "Explain what a hook is and what the word means",
    "Add state to a component with useState",
    "Say why a plain variable does not work for changing values",
    "Explain why a state value looks stale immediately after setting it",
    "Use a functional update, and know when you must",
    "Update objects and arrays in state without mutating them",
    "State the Rules of Hooks and why they exist",
  ],
  sections: [
    {
      id: "why-not-a-variable",
      heading: "Why a plain variable does not work",
      body: [
        "The obvious first attempt is a normal variable. It fails, and understanding *why* is the fastest route into React's model.",
        "Two separate things go wrong, and each on its own is fatal.",
        "**React does not know anything changed.** React is not watching your variables; nothing observes an assignment. A component re-renders because React was told to re-render it, and assigning to a local variable tells it nothing.",
        "**The variable does not survive.** A component is a *function*. Calling it again creates a new execution with new locals, so even if a re-render happened, the variable would be back at its initial value.",
        "State exists to solve exactly this pair: **a value React keeps for you between renders, and which tells React to re-render when it changes.**",
      ],
      examples: [
        {
          id: "broken-counter",
          title: "The version that does nothing",
          lang: "tsx",
          code: `function BrokenCounter() {
  let count = 0;               // recreated on every call of this function

  return (
    <button onClick={() => {
      count += 1;              // this really does happen…
      console.log(count);      // …and logs 1, 2, 3 as you click
    }}>
      Clicked {count} times    {/* …but this never changes */}
    </button>
  );
}`,
          explanation:
            "The console proves the increment works. The screen never updates, because React was never asked to re-render — and if it had been, `count` would have been reset to 0 by the new function call. Both problems, in four lines.",
        },
      ],
    },
    {
      id: "what-is-a-hook",
      heading: "What a hook is",
      body: [
        "**A hook is a function that lets a component tap into React's own machinery** — its memory, its render scheduling, its lifecycle. They are called hooks because they hook your component into React.",
        "They are recognisable by name: every one starts with `use`. That is a convention the linter enforces, and it exists so that both you and the tooling can tell at a glance that a function is subject to the rules below.",
        "Before hooks arrived in 2019, only class components could hold state, and reusing stateful logic meant patterns like higher-order components and render props that were genuinely unpleasant. Hooks let a plain function do everything a class could, and made stateful logic extractable into functions you can share. That is why function components won.",
      ],
      examples: [
        {
          id: "usestate-basic",
          title: "useState, and the pair it returns",
          lang: "tsx",
          code: `import { useState } from "react";

function Counter() {
  // useState returns exactly two things, and array destructuring names them.
  //   [0] the current value for this render
  //   [1] a function that asks React to change it and re-render
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}`,
          explanation:
            "The names are yours; the convention is `[thing, setThing]`. The argument to `useState` is the **initial** value, used only on the first render of this component instance — React ignores it on every subsequent render, because by then it has a value stored.",
        },
      ],
      pitfalls: [
        {
          title: "Each instance has its own state",
          body: "Render `<Counter />` three times and you get three independent counters. State belongs to a *position in the tree*, not to the component definition. This is why you rarely have to think about instances at all — and also why React needs stable keys in lists, since a changed key means a different position and therefore different state.",
        },
      ],
    },
    {
      id: "snapshot",
      heading: "State updates are queued, and a render sees a snapshot",
      body: [
        "This is the single most confusing thing about React state, and it explains a whole family of bugs.",
        "**`setCount(1)` does not change `count`.** It schedules an update and asks React to render again. The `count` variable in the currently-running function is a `const` belonging to *this* render, and it will hold its value until the function ends. Reading it immediately after setting it gives you the old value — not because of a delay, but because it is a different variable from the one the next render will see.",
        "The mental model that makes this click: **each render is a photograph.** The values in it are frozen at the moment the photograph was taken. Event handlers created during that render close over those frozen values, forever.",
      ],
      examples: [
        {
          id: "stale-snapshot",
          title: "Reading state after setting it",
          lang: "tsx",
          code: `function Confusing() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
    console.log(count);      // logs the OLD value, every time
  }

  function handleTriple() {
    // All three read the same frozen \`count\`. If count is 0, all three
    // compute 1, and the result is 1 — not 3.
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  }

  function handleTripleFixed() {
    // A functional update receives the latest queued value instead of
    // the frozen one. 0 -> 1 -> 2 -> 3.
    setCount((c) => c + 1);
    setCount((c) => c + 1);
    setCount((c) => c + 1);
  }

  return (
    <>
      <p>{count}</p>
      <button onClick={handleClick}>+1</button>
      <button onClick={handleTriple}>+3 (broken: adds 1)</button>
      <button onClick={handleTripleFixed}>+3 (works)</button>
    </>
  );
}`,
          explanation:
            "**The rule: when the new value depends on the old one, pass a function.** `setCount(c => c + 1)` is queued as an instruction rather than a value, and React applies each queued instruction in order to the result of the last. This also matters inside timers, promises and event handlers that run later, where the frozen value may be several renders stale.",
        },
      ],
      pitfalls: [
        {
          title: "Batching means several setState calls produce one render",
          body: "React groups state updates that happen in the same tick and re-renders once at the end. Since React 18 this applies everywhere — inside promises, timeouts and native event handlers, not just React events. It is why the three `setCount` calls above cause one re-render rather than three, and it is a performance feature you almost never have to think about, except when it explains why a log fired fewer times than you expected.",
        },
      ],
    },
    {
      id: "objects-and-arrays",
      heading: "Updating objects and arrays: replace, never edit",
      body: [
        "State must be treated as **immutable**. To change an object or array in state you create a new one and pass that in.",
        "The reason is mechanical rather than philosophical. React decides whether state changed by comparing the new value with the old using `Object.is` — a reference comparison for objects. Mutate an object in place and you hand back *the same reference*, React concludes nothing changed, and no re-render happens. The data is different; the screen is not.",
      ],
      examples: [
        {
          id: "immutable-updates",
          title: "The patterns you will use constantly",
          lang: "tsx",
          code: `const [user, setUser] = useState({ name: "Ada", address: { city: "London" } });
const [todos, setTodos] = useState([{ id: 1, text: "Learn React", done: false }]);

// --- objects ---
user.name = "Grace";                    // WRONG: same reference, no re-render
setUser({ ...user, name: "Grace" });    // right: new object, one field changed

// Nested: every level you change must be copied.
setUser({ ...user, address: { ...user.address, city: "Paris" } });

// --- arrays ---
todos.push(newTodo);                    // WRONG: mutates
setTodos([...todos, newTodo]);          // add to the end
setTodos([newTodo, ...todos]);          // add to the start
setTodos(todos.filter((t) => t.id !== 1));                 // remove
setTodos(todos.map((t) =>                                   // update one
  t.id === 1 ? { ...t, done: !t.done } : t
));
setTodos(todos.toSorted((a, b) => a.text.localeCompare(b.text)));  // reorder`,
          explanation:
            "The array methods split cleanly: `map`, `filter`, `slice`, `concat`, `toSorted` and `toReversed` return something new and are safe; `push`, `pop`, `splice`, `sort` and `reverse` mutate and are not. Deeply nested state is a signal to flatten the shape or reach for a library such as Immer — the spread chains get unreadable at three levels.",
        },
      ],
      pitfalls: [
        {
          title: "Do not put derived values in state",
          body: "If a value can be calculated from other state or props, calculate it during render instead of storing it. A `fullName` held in state alongside `firstName` and `lastName` is a second source of truth that will drift, and keeping it in sync means an effect you did not need. Just write `const fullName = firstName + \" \" + lastName;`.",
        },
      ],
    },
    {
      id: "rules",
      heading: "The Rules of Hooks",
      body: [
        "There are two, they are absolute, and the linter enforces both.",
        "**Only call hooks at the top level of a component or another hook.** Never inside an `if`, a loop, a nested function, or after an early `return`.",
        "**Only call hooks from React functions** — a component, or a custom hook. Not from a plain utility function or a class.",
        "The reason is how React stores state. It does not know your variable names; it keeps a list per component instance and matches calls to slots **by call order**. The first `useState` in a render gets slot one, the second gets slot two. Put a hook behind a condition and the order changes between renders, so slot two now returns what belonged to a different piece of state — silently, with no error at the point of the mistake.",
      ],
      examples: [
        {
          id: "hook-rules",
          title: "Why the order matters",
          lang: "tsx",
          code: `function Broken({ isLoggedIn }) {
  // WRONG: on the render where isLoggedIn flips, every hook after this
  // one shifts by a slot and picks up the wrong stored value.
  if (isLoggedIn) {
    const [name, setName] = useState("");
  }
  const [count, setCount] = useState(0);
  // ...
}

function Fixed({ isLoggedIn }) {
  // Hooks unconditionally at the top; the condition moves into the JSX,
  // where it belongs.
  const [name, setName] = useState("");
  const [count, setCount] = useState(0);

  return isLoggedIn ? <p>{name}</p> : <p>Please sign in</p>;
}`,
          explanation:
            "Almost every apparent need to call a hook conditionally is really a need to *render* conditionally, or to split the component in two so that the hook lives in the child that is conditionally rendered. Install `eslint-plugin-react-hooks` and never disable its rules — it catches this at the moment you type it.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why can't you use a normal variable instead of useState?",
      answer:
        "Two reasons. Assigning to a variable does not tell React that anything changed, so no re-render is scheduled. And a component is a function, so a new call creates fresh locals — the value would not survive to the next render even if one happened. `useState` gives you a value React preserves across renders and a setter that schedules a re-render.",
    },
    {
      question: "Why does logging state immediately after calling the setter show the old value?",
      answer:
        "The setter does not mutate the current variable; it queues an update and schedules a re-render. The variable in the running function is a `const` belonging to that render and cannot change. The new value is only visible in the next render, where the component function runs again and `useState` returns the updated value.",
    },
    {
      question: "When must you use the functional form of a state setter?",
      answer:
        "Whenever the new value depends on the previous one and you cannot be sure the value you have is current — several updates in one handler, or an update inside a timer, promise or subscription created in an earlier render. `setCount(c => c + 1)` queues an instruction that React applies to the latest value, rather than a value computed from a possibly stale snapshot.",
    },
    {
      question: "Why must hooks be called unconditionally and in the same order?",
      answer:
        "React associates hook calls with stored state by call order rather than by name, keeping a per-instance list. A conditional hook changes the order between renders, so later hooks read state belonging to a different slot. The failure is silent and produces wrong values rather than an error at the point of the mistake, which is why the lint rule matters.",
    },
  ],
  takeaways: [
    "A hook is a function that hooks a component into React's machinery; every one is named `use…`",
    "`useState` returns the current value and a setter, and the initial argument is used only on the first render of that instance",
    "Setting state queues an update and schedules a re-render — it does not change the current render's variable",
    "Each render is a frozen snapshot, and handlers close over that snapshot's values",
    "Use the functional form `setX(prev => …)` whenever the new value depends on the old one",
    "Replace objects and arrays rather than mutating them: React compares by reference to decide what changed",
    "Do not store values you can derive — calculate them during render instead",
    "Hooks must be called at the top level of a React function, unconditionally, because React matches them to state by call order",
  ],
  status: "available",
};
