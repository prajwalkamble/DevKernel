import type { Lesson } from "@/content/types";

export const functionalUpdatesLesson: Lesson = {
  id: "react-functional-updates",
  slug: "functional-updates",
  moduleSlug: "state-and-events",
  title: "Functional Updates",
  summary:
    "Passing a function to the setter instead of a value. React calls it with the state as the queue has it so far, which is the difference between three increments and one — and the only correct way to update state from anywhere that might be looking at a stale value.",
  estimatedMinutes: 25,
  objectives: [
    "Write an updater function and say what argument React passes it",
    "Explain why three updaters increment by three",
    "List the three situations where an updater is required rather than preferred",
    "Say why the updater must be pure",
    "Choose between an updater and a plain value deliberately",
  ],
  sections: [
    {
      id: "the-queue-again",
      heading: "Two things you can queue",
      body: [
        "The setter accepts either a value or a function.",
        "**A value** — `setCount(1)` — queues \"replace the state with 1\".",
        "**A function** — `setCount(c => c + 1)` — queues \"replace the state with whatever this returns when given the value so far\".",
        "The difference only shows when more than one update is queued at once, and then it is decisive. React processes the queue in order, threading the result of each entry into the next. Values ignore what came before; functions receive it.",
      ],
      examples: [
        {
          id: "three-updaters",
          title: "The same example as the last lesson, with one change",
          lang: "jsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

let renders = 0;

function Counter() {
  renders++;
  const [count, setCount] = useState(0);

  function withValues() {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  }

  function withUpdaters() {
    setCount((c) => c + 1);
    setCount((c) => c + 1);
    setCount((c) => c + 1);
  }

  return (
    <>
      <span id="v">{count}</span>
      <button id="values" onClick={withValues}>values</button>
      <button id="updaters" onClick={withUpdaters}>updaters</button>
    </>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

act(() => { root.render(<Counter />); });
console.log("mounted:            ", container.querySelector("#v").textContent, "| renders:", renders);

act(() => { container.querySelector("#values").click(); });
console.log("three values:       ", container.querySelector("#v").textContent, "| renders:", renders);

act(() => { container.querySelector("#updaters").click(); });
console.log("three updaters:     ", container.querySelector("#v").textContent, "| renders:", renders);`,
          output: `mounted:             0 | renders: 1
three values:        1 | renders: 2
three updaters:      4 | renders: 3`,
          explanation:
            "Three values moved it from 0 to 1; three updaters moved it from 1 to 4. Both were a single re-render, so this is not about batching — it is about what each queued entry knows. The updater form is handed `1`, then `2`, then `3`, and returns `2`, `3`, `4`. The value form computed `0 + 1` three times.",
        },
      ],
    },
    {
      id: "when-required",
      heading: "The three cases where it is required",
      body: [
        "**More than one update to the same state in one handler.** As above. Each needs the previous one's result.",
        "**Updating from inside a closure that might be stale.** A `setTimeout`, an interval, an event listener you attached, a promise callback — all of them captured the state from the render that created them, and by the time they run that value may be old. The next lesson is entirely about this.",
        "**Updating from a callback you do not control the timing of.** A subscription handler, a websocket message, an animation frame. You cannot know which render's variables you are holding, so do not rely on them.",
        "The unifying rule: **if the new value depends on the old value, use an updater.** If it does not — `setName(inputValue)`, `setOpen(false)` — a plain value is clearer and there is nothing to gain.",
      ],
      pitfalls: [
        {
          title: "The updater must be pure, and may be called twice",
          body: "React can call an updater more than once — in Strict Mode it deliberately does, to surface impurity, exactly as it double-invokes components. So an updater must not mutate anything or perform side effects: `setItems(items => { items.push(x); return items })` both mutates the old array and returns the same reference, so React sees no change and may skip the render entirely. Return a new value: `setItems(items => [...items, x])`.",
        },
      ],
    },
    {
      id: "bailout",
      heading: "Returning the same value cancels the render",
      body: [
        "If an updater — or a plain value — produces something `Object.is`-equal to the current state, React may skip re-rendering that component. It is a genuine optimisation and it is also a trap.",
        "The trap is mutation. `setUser(u => { u.name = \"Ada\"; return u; })` returns the *same object*, so React compares old and new, finds them identical, and does nothing — while the object it is holding has quietly changed. The screen and the data are now out of step, which is the exact failure React exists to prevent.",
        "This is why \"never mutate state\" is not a style rule. Mutation does not merely risk a stale render; it actively defeats the mechanism that decides whether to render at all. Lesson 6 covers the patterns for updating objects and arrays without it.",
      ],
      examples: [
        {
          id: "bailout-on-mutation",
          title: "The render that never happens",
          lang: "jsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

let renders = 0;

function Profile() {
  renders++;
  const [user, setUser] = useState({ name: "Ada" });

  return (
    <>
      <span id="v">{user.name}</span>
      {/* Mutates and returns the same object. */}
      <button id="bad" onClick={() => setUser((u) => { u.name = "Grace"; return u; })}>bad</button>
      {/* Returns a new object. */}
      <button id="good" onClick={() => setUser((u) => ({ ...u, name: "Grace" }))}>good</button>
    </>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

act(() => { root.render(<Profile />); });
console.log("mounted:      ", container.querySelector("#v").textContent, "| renders:", renders);

act(() => { container.querySelector("#bad").click(); });
console.log("after mutate: ", container.querySelector("#v").textContent, "| renders:", renders);

act(() => { container.querySelector("#good").click(); });
console.log("after replace:", container.querySelector("#v").textContent, "| renders:", renders);`,
          output: `mounted:       Ada | renders: 1
after mutate:  Ada | renders: 1
after replace: Grace | renders: 2`,
          explanation:
            "The mutating click produced no render at all — the render count did not move, and the screen still said `Ada` even though `user.name` was by then `\"Grace\"`. The data and the display had diverged with nothing to indicate it. The replacing click returned a new object, React saw a different reference, and the screen caught up.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What argument does React pass to an updater function?",
      answer:
        "The state as the queue has it at that point — not the value from the render where the setter was called. React processes queued updates in order and threads each result into the next, so three `setCount(c => c + 1)` calls see the values in sequence and increment three times, while three `setCount(count + 1)` calls all compute from the same constant and increment once.",
    },
    {
      question: "When must you use a functional update rather than a value?",
      answer:
        "Whenever the new value depends on the old one and you might not be holding the current old one: several updates to the same state in one handler, and any update from a closure whose age you do not control — a timeout, an interval, a subscription, a promise callback. When the new value is independent of the old, such as `setOpen(false)`, a plain value is clearer.",
    },
    {
      question: "Why is mutating state worse than merely being bad style?",
      answer:
        "Because React decides whether to re-render by comparing the new state with the old using `Object.is`. Mutating and returning the same object produces an identical reference, so React concludes nothing changed and skips the render entirely — while the data has in fact changed. The screen and the state diverge silently. Returning a new object is what makes the change visible to React at all.",
    },
  ],
  takeaways: [
    "The setter takes a value or a function; only the function sees what the queue has produced so far",
    "Three updaters increment by three; three values increment by one — in both cases with one re-render",
    "Use an updater whenever the new value depends on the old one",
    "Always use one from a timeout, interval, subscription or promise callback, where the captured value may be stale",
    "An updater must be pure — Strict Mode calls it twice on purpose",
    "Returning the same reference makes React skip the render, which is why mutation silently desynchronises the screen",
  ],
  status: "available",
};
