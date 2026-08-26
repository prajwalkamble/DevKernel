import type { Lesson } from "@/content/types";

export const updatesAreQueuedLesson: Lesson = {
  id: "react-updates-are-queued",
  slug: "updates-are-queued",
  moduleSlug: "state-and-events",
  title: "Updates Are Queued, Not Immediate",
  summary:
    "Calling the setter does not change the variable. It adds an entry to a queue and asks for a re-render — which is why reading the value on the next line gives you the old one, and why calling it three times can move the number by one.",
  estimatedMinutes: 30,
  objectives: [
    "Say what the setter actually does",
    "Explain why the variable does not change on the next line",
    "Predict the result of calling a setter several times in one handler",
    "Say how many re-renders a handler full of setters causes",
    "Recognise the bug pattern that comes from expecting an immediate write",
  ],
  sections: [
    {
      id: "what-the-setter-does",
      heading: "What the setter does, and what it does not",
      body: [
        "`setCount(1)` does two things: it puts an update on a queue for that piece of state, and it tells React this component needs to render again. It does not assign to `count`.",
        "It could not assign to `count`. `count` is a `const` belonging to the function call that is currently running — one render's local variable. There is no mechanism by which a later event could reach back into a finished function call and change one of its locals, and React does not have one either.",
        "So after `setCount(count + 1)`, `count` is exactly what it was. The new value appears in the **next** render, when React calls your component again and `useState` returns the updated value.",
      ],
      examples: [
        {
          id: "not-immediate",
          title: "Reading the value straight after setting it",
          lang: "tsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    console.log("  before setCount, count =", count);
    setCount(count + 1);
    console.log("  after  setCount, count =", count);
  }

  return <button id="b" onClick={handleClick}>{count}</button>;
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

act(() => { root.render(<Counter />); });
console.log("mounted, DOM shows:", container.textContent);

console.log("click:");
act(() => { container.querySelector("#b").click(); });
console.log("after the click, DOM shows:", container.textContent);`,
          output: `mounted, DOM shows: 0
click:
  before setCount, count = 0
  after  setCount, count = 0
after the click, DOM shows: 1`,
          explanation:
            "Both logs inside the handler say `0`, and the DOM says `1` immediately afterwards. Nothing is delayed or racy here: the handler ran to completion with `count` frozen at the value its render was given, React then processed the queue, called the component again, and that second call saw `1`. The setter is a request, not an assignment.",
        },
      ],
    },
    {
      id: "three-times",
      heading: "Calling it three times",
      body: [
        "If the setter queued a *value*, then calling it three times with `count + 1` queues the same value three times — because `count` never changed between the calls.",
        "That is exactly what happens. Three updates go on the queue, each saying \"the new value is 1\", and React applies them in order: 1, then 1, then 1.",
        "The number moves by one. Not three. This is the single most common surprise in React, and it is entirely explained by the previous section: `count` was a constant throughout the handler.",
      ],
      visual: {
        id: "state-queue-values-visual",
        kind: "react-rendering",
        algorithm: "queue-values",
        title: "Three calls, and what actually reaches the queue",
      },
      examples: [
        {
          id: "three-setters",
          title: "Three setters, one increment",
          lang: "tsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

let renders = 0;

function Counter() {
  renders++;
  const [count, setCount] = useState(0);

  function bumpThreeTimes() {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  }

  return <button id="b" onClick={bumpThreeTimes}>{count}</button>;
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

act(() => { root.render(<Counter />); });
console.log("mounted:", container.textContent, "| renders:", renders);

act(() => { container.querySelector("#b").click(); });
console.log("after three setCount(count + 1):", container.textContent, "| renders:", renders);`,
          output: `mounted: 0 | renders: 1
after three setCount(count + 1): 1 | renders: 2`,
          explanation:
            "Two numbers to read. The count went to **1**, not 3, because all three calls computed `0 + 1` — `count` was the same constant for all of them. And the render count went from 1 to **2**, not to 4: React batched the three queued updates into a single re-render. The next lesson changes one character in this example and gets 3.",
        },
      ],
      pitfalls: [
        {
          title: "The same shape appears whenever two setters read each other",
          body: "`setTotal(price * quantity)` immediately after `setQuantity(q + 1)` uses the *old* quantity, because `q` has not changed. The result is a total that is always one step behind, which looks like a rounding or a race and is neither. Derive the total during render instead of storing it — the last lesson of this module makes that argument in full.",
        },
      ],
    },
    {
      id: "one-render",
      heading: "How many re-renders you get",
      body: [
        "One. React collects everything queued during the handler and re-renders once, with all of it applied.",
        "This is worth knowing precisely, because the alternative belief — that each setter triggers its own render — leads people to combine unrelated state into one object \"to avoid extra renders\". It avoids nothing; they were never going to be separate renders.",
        "The next lesson but one covers what this batching does and does not extend to.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why doesn't the state variable change immediately after calling the setter?",
      answer:
        "Because the setter does not assign to it. It queues an update and schedules a re-render. The variable is a `const` local to the render that is currently executing, so nothing can change it — the new value appears the next time React calls the component and `useState` returns it. Reading it after the setter always gives you the value that render started with.",
    },
    {
      question: "What does `setCount(count + 1)` three times in one handler do?",
      answer:
        "It increments by one. `count` does not change between the calls, so all three queue the same value, and React applies them in order to the same result. Getting three requires functional updates — `setCount(c => c + 1)` — where each update receives the value the previous one produced.",
    },
    {
      question: "How many re-renders does a handler with five setters cause?",
      answer:
        "One. React batches everything queued during the handler and re-renders once with all of it applied. This is why merging unrelated state into a single object to 'reduce renders' achieves nothing — they were already one render.",
    },
  ],
  takeaways: [
    "The setter queues an update and schedules a render; it never assigns to the variable",
    "The variable is a `const` belonging to the render that is running, so nothing can change it mid-handler",
    "Three `setCount(count + 1)` calls queue the same value three times and move the number by one",
    "A handler full of setters causes exactly one re-render",
    "Combining state into one object to reduce render count achieves nothing",
  ],
  status: "available",
};
