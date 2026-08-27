import type { Lesson } from "@/content/types";

export const useReducerLesson: Lesson = {
  id: "react-usereducer",
  slug: "usereducer",
  moduleSlug: "context-and-state-architecture",
  title: "useReducer: State That Changes in More Than One Way",
  summary:
    "Moving the how out of the components and into one pure function. What a reducer buys that six setters do not, how to name actions so the reducer stays readable, and the exact point it becomes worth the ceremony.",
  estimatedMinutes: 30,
  objectives: [
    "Convert several related useState calls into one reducer",
    "Name actions after what happened rather than what to set",
    "Test a reducer without rendering anything",
    "Say why dispatch is stable and what that is worth",
    "Recognise when useState is still the better answer",
  ],
  sections: [
    {
      id: "the-signal",
      heading: "The signal that you want one",
      body: [
        "Not \"the state is complex\". Complexity is not the trigger, and reaching for a reducer because an object has six fields produces ceremony with no payoff.",
        "The trigger is **several pieces of state that must change together, in more than one way**. A cart where adding an item might increment a quantity or append a row, and either way recomputes a total, and clears a coupon if the total drops below a threshold. Four setters called in the right order in three different components, and the ordering rules living in none of them.",
        "The second trigger is **the next update depends on the current state in a non-trivial way**. `setCount(c => c + 1)` is fine; \"if this sku is already present increment it, otherwise append\" is a rule, and rules want a home.",
        "A reducer gives them one. All the transitions in one function, all the components saying only what happened.",
      ],
      visual: {
        id: "reducer-dispatch-visual",
        kind: "react-rendering",
        algorithm: "reducer-dispatch",
        title: "Five actions through one function",
      },
    },
    {
      id: "the-shape",
      heading: "The shape, and the fact that it is just a function",
      body: [
        "`useReducer(reducer, initialState)` returns `[state, dispatch]`. The reducer is `(state, action) => newState`, and it is an ordinary function that never touches React — which is exactly what makes it testable.",
      ],
      examples: [
        {
          id: "reducer-in-and-out",
          title: "The same reducer, called directly and through React",
          lang: "tsx",
          code: `import { useReducer, act } from "react";
import { createRoot } from "react-dom/client";

type Item = { sku: string; qty: number };
type State = { items: Item[] };
type Action =
  | { type: "added"; sku: string }
  | { type: "removed"; sku: string }
  | { type: "cleared" };

/* An ordinary function. It never touches React, so it can be called and
   tested directly — which is the line below. */
function cartReducer(state: State, action: Action): State {
  switch (action.type) {
    case "added": {
      const existing = state.items.find((i) => i.sku === action.sku);
      return existing
        ? { items: state.items.map((i) => (i.sku === action.sku ? { ...i, qty: i.qty + 1 } : i)) }
        : { items: [...state.items, { sku: action.sku, qty: 1 }] };
    }
    case "removed":
      return { items: state.items.filter((i) => i.sku !== action.sku) };
    case "cleared":
      return { items: [] };
  }
}

const show = (s: State) => s.items.map((i) => \`\${i.sku}x\${i.qty}\`).join(",") || "empty";

console.log("the reducer, called directly — no React involved:");
let s: State = { items: [] };
for (const a of [
  { type: "added", sku: "pen" }, { type: "added", sku: "pen" },
  { type: "added", sku: "ink" }, { type: "removed", sku: "ink" },
] as Action[]) {
  const before = show(s);
  s = cartReducer(s, a);
  console.log(\`  \${JSON.stringify(a).padEnd(34)} \${before}  ->  \${show(s)}\`);
}

function Cart() {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  return (
    <div>
      <output>{show(state)}</output>
      <button type="button" id="add" onClick={() => dispatch({ type: "added", sku: "pen" })}>add</button>
      <button type="button" id="clear" onClick={() => dispatch({ type: "cleared" })}>clear</button>
    </div>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
act(() => { createRoot(container).render(<Cart />); });
const click = (id: string) => act(() => { container.querySelector<HTMLButtonElement>(\`#\${id}\`)!.click(); });

console.log("\\nthe same reducer, inside a component:");
click("add"); click("add");
console.log("  after two adds: ", container.querySelector("output")!.textContent);
click("clear");
console.log("  after clear:    ", container.querySelector("output")!.textContent);`,
          output: `the reducer, called directly — no React involved:
  {"type":"added","sku":"pen"}       empty  ->  penx1
  {"type":"added","sku":"pen"}       penx1  ->  penx2
  {"type":"added","sku":"ink"}       penx2  ->  penx2,inkx1
  {"type":"removed","sku":"ink"}     penx2,inkx1  ->  penx2

the same reducer, inside a component:
  after two adds:  penx2
  after clear:     empty`,
          explanation:
            "The top half is the whole testing story: a loop, four calls, no renderer, no DOM, no mocking. \"Adding a sku that is already present increments the quantity\" is one assertion on one function call. The bottom half is the same function inside a component, and the component contains none of that logic — it says `added` and `cleared` and nothing else.",
        },
      ],
      pitfalls: [
        {
          title: "The reducer must be pure",
          body: "No fetching, no logging to a server, no mutating the state argument, no `Date.now()` or `Math.random()`. React calls reducers more than once for the same action in Strict Mode, precisely to catch this. Anything impure goes in the handler that dispatches, or in an effect that reacts to the resulting state — and the value it produces is put *into* the action.",
        },
        {
          title: "Return a new object, do not edit the old one",
          body: "`state.items.push(item); return state;` returns the same object, so `Object.is` says nothing changed and React skips the render. The state does change — you just cannot see it. Every branch has to build a new object, which is what all the spreading above is doing.",
        },
      ],
    },
    {
      id: "naming",
      heading: "Naming actions",
      body: [
        "This is the part that decides whether the reducer stays readable, and it is a single rule: **an action describes what happened, not what to set.**",
        "`{ type: \"added\", sku }` — good. `{ type: \"setItems\", items }` — that is `setState` with extra syntax, and the rules have gone straight back into the caller.",
        "Past-tense names help, because they force the framing: `added`, `removed`, `checkoutStarted`, `couponRejected`. Something that already happened cannot also be an instruction.",
        "The payoff is that one action can mean several changes. `checkoutStarted` might clear the coupon, freeze the quantities and record a timestamp — three fields, one action, and no caller that has to remember all three.",
      ],
      examples: [
        {
          id: "action-naming",
          title: "Two reducers, same feature",
          lang: "typescript",
          code: `// Setter-shaped actions. Every caller has to know all three rules, and a
// new caller that forgets one produces a cart in an impossible state.
type BadAction =
  | { type: "setItems"; items: Item[] }
  | { type: "setCoupon"; coupon: string | null }
  | { type: "setFrozen"; frozen: boolean };

// Event-shaped actions. The rules live in the reducer, once.
type Action =
  | { type: "added"; sku: string }
  | { type: "removed"; sku: string }
  | { type: "checkoutStarted" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "checkoutStarted":
      // Three fields, one rule, one place.
      return { ...state, coupon: null, frozen: true, startedAt: action.at };
    // …
  }
}`,
          explanation:
            "Note `action.at` rather than `Date.now()` inside the reducer. The impure part — reading the clock — happens where the action is created, and the reducer receives the result. That keeps the reducer pure and, incidentally, makes the test deterministic.",
        },
      ],
    },
    {
      id: "dispatch-stable",
      heading: "dispatch is stable, and that is worth more than it sounds",
      body: [
        "React guarantees the `dispatch` function's identity never changes for the life of the component — the same guarantee as a `useState` setter.",
        "That means dispatch can be passed to a memoised child without `useCallback` and it will not break the memo. It can go in a dependency array and never fire. It can be put in a context that a hundred components read, and none of them re-render when the state changes, because the dispatch context's value never changes.",
        "That last one is the whole basis of the next lesson. It is why splitting state and dispatch into two contexts works, and it is a property `useState` gives you too but which matters much more here — a reducer's dispatch replaces *several* callbacks, each of which would otherwise need its own `useCallback`.",
      ],
      pitfalls: [
        {
          title: "Passing dispatch down is not always right",
          body: "A child that receives `dispatch` can dispatch anything, which couples it to the whole action type. A child that receives `onRemove` can only do one thing. For a leaf component, the narrow callback is usually the better interface — and it is trivially built at the boundary: `onRemove={() => dispatch({ type: \"removed\", sku })}`. Pass dispatch across a wide boundary, pass a callback into a leaf.",
        },
      ],
    },
    {
      id: "when-not",
      heading: "When useState is still right",
      body: [
        "**One or two independent values.** A boolean for an open menu, a string for a search box. A reducer here is three extra concepts to read one flag.",
        "**Nothing coordinates.** Six pieces of state that never change together are six `useState` calls, and putting them in one object makes every update spread five fields it did not touch.",
        "**The state is derived.** Lesson 1 of module 7 — if it can be computed, do not store it in either.",
        "**The state is server data.** A reducer for cached responses is a data library with fewer features. Module 7, lesson 8.",
        "A useful conversion signal: you are reading a component and cannot answer \"what are all the ways this value can change?\" without reading three other files. That is the reducer's job description.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When would you use useReducer instead of useState?",
      answer:
        "When several pieces of state change together in more than one way, so the coordination rules would otherwise be spread across every component that calls the setters. Or when an update depends on the current state in a way that is a rule rather than an increment. The reducer becomes the one place that answers \"what are all the ways this state can change\", and every component is reduced to saying what happened.",
    },
    {
      question: "How should actions be named?",
      answer:
        "After what happened, not what to set — `added`, `removed`, `checkoutStarted`, in the past tense. A `setItems` action is `setState` wearing a costume: the caller still has to know the rules, so nothing moved. Event-shaped actions let one action mean several coordinated changes, which is the point of having a reducer at all.",
    },
    {
      question: "Why must a reducer be pure?",
      answer:
        "Because React may call it more than once for the same action — Strict Mode does exactly that in development to catch impurity. Fetching, logging, mutating the incoming state or reading the clock inside a reducer therefore produces duplicated or non-deterministic behaviour. Impure work belongs in the handler that dispatches, with its result passed into the action, which also makes the reducer deterministic to test.",
    },
    {
      question: "Why does it matter that dispatch is stable?",
      answer:
        "Its identity never changes, so it can be passed to a memoised child without `useCallback`, sit in a dependency array without firing it, and be published through its own context that never changes value — which means components that only dispatch never re-render when the state changes. That last property is what makes the reducer-plus-two-contexts pattern work.",
    },
  ],
  takeaways: [
    "The trigger is coordination, not complexity: several values that change together in more than one way",
    "A reducer is a plain `(state, action) => state` function — testable by calling it, with no renderer",
    "Name actions after what happened, in the past tense, never after what to set",
    "One action can mean several coordinated changes; that is the payoff",
    "Reducers must be pure — React calls them twice in development to check",
    "Return a new object; mutating and returning the same one renders nothing",
    "`dispatch` is stable forever, so it needs no `useCallback` and never invalidates a memo",
    "Pass `dispatch` across wide boundaries and a narrow callback into a leaf",
  ],
  status: "available",
};
