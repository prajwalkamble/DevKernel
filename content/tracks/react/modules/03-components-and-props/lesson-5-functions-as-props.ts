import type { Lesson } from "@/content/types";

export const functionsAsPropsLesson: Lesson = {
  id: "react-functions-as-props",
  slug: "functions-as-props",
  moduleSlug: "components-and-props",
  title: "Functions as Props & Lifting State Up",
  summary:
    "How a child asks for something to change, the four-step procedure for moving state to where two components can share it, and the cost that buys — because lifting state is also how a small change starts re-rendering half the page.",
  estimatedMinutes: 30,
  objectives: [
    "Pass a callback and supply arguments to it without calling it early",
    "Name callback props and their handlers by convention",
    "Lift state to the nearest common parent, in four steps",
    "State what lifting costs, and what to do when it costs too much",
    "Recognise that an inline arrow is a new function on every render",
  ],
  sections: [
    {
      id: "passing-callbacks",
      heading: "Passing a function, and passing it arguments",
      body: [
        "A callback prop is an ordinary prop that holds a function. The only syntax worth being careful about is the difference between passing a function and calling one.",
        "`onClick={handleClick}` passes the function. `onClick={handleClick()}` **calls it during render** and passes the result — which runs the handler on every render, usually sets state, and produces an infinite loop. The error is a render loop rather than anything that names the real cause.",
        "When the handler needs an argument the item knows, wrap it: `onClick={() => onSelect(person.id)}`. That creates a new function which, when called, calls yours with the right value.",
      ],
      examples: [
        {
          id: "passing-not-calling",
          title: "Passing, calling, and wrapping",
          lang: "tsx",
          code: `function Button({ label, onPress }) {
  return <button type="button" onClick={onPress}>{label}</button>;
}

function App() {
  const say = (what) => console.log("pressed", what);

  return (
    <>
      {/* Passed: React calls it when the click happens. */}
      <Button label="A" onPress={() => say("A")} />

      {/* Also passed — a reference, with no arguments needed. */}
      <Button label="B" onPress={console.log} />
    </>
  );
}`,
          output: `<button type="button">A</button><button type="button">B</button>`,
          explanation:
            "Neither handler ran during rendering, which is exactly right — the markup contains no trace of them, because event handlers are attached by React at commit time rather than written into HTML. Had either been written `onPress={say(\"A\")}`, the call would have happened while rendering and the console would show it in this output.",
        },
      ],
      pitfalls: [
        {
          title: "An inline arrow is a different function on every render",
          body: "`onPress={() => say(\"A\")}` allocates a new function each time the parent renders. For a DOM element this is free — React swaps the listener and nothing notices. It stops being free when the child is wrapped in `React.memo`, because a new prop identity defeats the memo comparison and the child re-renders anyway, which is the thing the memo was added to prevent. Module 9 covers the fix; the point here is to know the allocation is happening.",
        },
      ],
    },
    {
      id: "naming",
      heading: "Naming, and the convention worth following",
      body: [
        "The prop is named for **the event, from the child's point of view**: `onSelect`, `onDismiss`, `onSubmit`, `onRetry`. The handler in the parent is named for **what the parent does about it**: `handleSelect`, `closeDialog`, `saveDraft`.",
        "The reason is reusability. A `Row` with an `onSelect` prop can be dropped into a parent where selecting means navigating, or one where it means ticking a checkbox. A `Row` with a `setSelectedId` prop has decided what the parent's state is called and can only live in a parent that agrees.",
        "For components wrapping a DOM element, the `on*` names that already exist should keep their meaning: an `onClick` on your component should behave the way `onClick` behaves, and if it does something else, call it something else.",
      ],
    },
    {
      id: "lifting",
      heading: "Lifting state up, in four steps",
      body: [
        "Two components need the same value. Neither can own it, because a sibling cannot see a sibling's state. The value has to move to the nearest ancestor they share.",
        "**One: find the common parent.** The lowest component that renders both.",
        "**Two: move the state there.** Delete the `useState` from the children and put one in the parent.",
        "**Three: pass the value down** as a prop, to every component that displays it.",
        "**Four: pass a function down** to every component that needs to request a change, and let the parent decide what the change means.",
        "The children come out of this simpler than they went in: they now take a value and a callback and hold nothing. A component with no state of its own is easier to test, easier to reuse, and impossible to get out of step with anything else.",
      ],
      visual: {
        id: "lifting-state-visual",
        kind: "react-rendering",
        algorithm: "lifting-state",
        title: "The same value, owned twice and then once",
      },
      examples: [
        {
          id: "lifted",
          title: "After the lift: one owner, two readers",
          lang: "tsx",
          code: `// Neither pane holds state. Both take a value and a way to ask for a change.
function Pane({ title, amount, onChange }) {
  return (
    <section>
      <h3>{title}</h3>
      <output>{amount}</output>
      <button type="button" onClick={() => onChange(amount + 1)}>more</button>
    </section>
  );
}

function Converter({ amount }) {
  // The owner. In a real component: const [amount, setAmount] = useState(0).
  const handleChange = (next) => console.log("Converter sets amount to", next);

  return (
    <div>
      <Pane title="Celsius" amount={amount} onChange={handleChange} />
      <Pane title="Fahrenheit" amount={amount * 2} onChange={handleChange} />
    </div>
  );
}

function App() {
  return <Converter amount={20} />;
}`,
          output: `<div><section><h3>Celsius</h3><output>20</output><button type="button">more</button></section><section><h3>Fahrenheit</h3><output>40</output><button type="button">more</button></section></div>`,
          explanation:
            "The two panes show different numbers derived from the same single piece of state, which is the property that makes them impossible to desynchronise. Note that `amount * 2` is computed during render rather than stored — a value you can derive from state should never be state itself, which module 4 argues at length.",
        },
      ],
      pitfalls: [
        {
          title: "Lifting too eagerly is its own bug",
          body: "State that only one component uses belongs in that component. Moving it up \"in case something else needs it later\" makes every sibling re-render whenever it changes and adds props to components that did not want them. Lift when a second consumer actually appears — the refactor is small and mechanical, and doing it early costs more than doing it late.",
        },
      ],
    },
    {
      id: "cost",
      heading: "What lifting costs",
      body: [
        "State changing in a component re-renders that component and everything beneath it. Lifting state upward therefore widens the subtree that re-renders on every change — move a text input's value to the top of the app and every keystroke re-renders the whole page.",
        "Usually this does not matter, and module 9 makes the case properly: re-rendering is cheap, and *expensive rendering* is the real problem. But it is the reason \"just put it in a global store\" is not free.",
        "The three ways out, in the order worth trying them: keep the state as low as it can go; pass elements as props so the expensive subtree is created by a parent that does not re-render; and only then reach for memoisation.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you share state between two sibling components?",
      answer:
        "Lift it to their nearest common parent. Remove the `useState` from both children, put one in the parent, pass the value down to each child that displays it, and pass a function down to each child that needs to request a change. The children then hold nothing, which makes them impossible to get out of step and much easier to test.",
    },
    {
      question: "What is the difference between `onClick={handle}` and `onClick={handle()}`?",
      answer:
        "The first passes the function for React to call on the event. The second calls it immediately during rendering and passes its return value as the handler — so the side effect happens on every render, and if it sets state it causes an infinite render loop. When arguments are needed, wrap it: `onClick={() => handle(id)}`, which creates a function that calls yours with the value.",
    },
    {
      question: "What does lifting state up cost?",
      answer:
        "A state change re-renders its owner and everything beneath it, so moving state upward widens the subtree that re-renders. It is usually not worth worrying about, since re-rendering is cheap and expensive rendering is the actual problem — but it is why state should live in the lowest component that can see every consumer, and why passing an expensive subtree down as an element prop is often a better fix than memoising it.",
    },
  ],
  takeaways: [
    "A callback prop holds a function; `onClick={handle()}` calls it during render and is the usual cause of a render loop",
    "Wrap when arguments are needed: `onClick={() => onSelect(id)}`",
    "Name the prop for the event the child saw, and the handler for what the parent does about it",
    "Lift in four steps: find the common parent, move the state, pass the value down, pass a callback down",
    "Lift when a second consumer appears, not in anticipation of one",
    "Lifting widens the re-rendering subtree, which is the honest cost of a single owner",
  ],
  status: "available",
};
