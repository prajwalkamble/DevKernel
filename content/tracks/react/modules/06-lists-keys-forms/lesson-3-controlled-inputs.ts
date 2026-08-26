import type { Lesson } from "@/content/types";

export const controlledInputsLesson: Lesson = {
  id: "react-controlled-inputs",
  slug: "controlled-and-uncontrolled",
  moduleSlug: "lists-keys-forms",
  title: "Controlled Against Uncontrolled Inputs",
  summary:
    "An HTML input owns its own value. A controlled input gives that ownership to React, which is what makes a React form behave differently from a plain one — and what produces the read-only input everybody hits once.",
  estimatedMinutes: 30,
  objectives: [
    "Say who owns the value in each model",
    "Write a controlled input, and explain why it needs both halves",
    "Explain the frozen-input bug from the model rather than the symptom",
    "Choose between the two deliberately",
    "Avoid switching a component between the two by accident",
  ],
  sections: [
    {
      id: "who-owns-it",
      heading: "Who owns the value",
      body: [
        "**Uncontrolled** is how HTML works. The `<input>` element holds its own value; typing updates it; the DOM node is the source of truth. React sets an initial value with `defaultValue` and then stops being involved.",
        "**Controlled** hands ownership to React. The input's `value` comes from state, and every keystroke fires `onChange`, which sets state, which re-renders with the new value. The DOM node holds whatever React last told it to.",
        "The controlled loop is worth tracing once, because everything else in this lesson falls out of it: **type → `onChange` → `setState` → re-render → `value` → shown**. The character you typed is not what appears on screen. What appears is the state React produced in response to it.",
        "That indirection is the whole feature. Because the value passes through your code on its way to the screen, you can transform it, reject it, or use it somewhere else in the same render.",
      ],
      examples: [
        {
          id: "controlled-loop",
          title: "The value passing through state",
          lang: "tsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

function Upper() {
  const [text, setText] = useState("");
  return (
    <>
      {/* The keystroke goes to state, and state decides what is shown. */}
      <input id="in" value={text} onChange={(e) => setText(e.target.value.toUpperCase())} />
      <span id="len">{text.length} characters</span>
    </>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
act(() => { root.render(<Upper />); });

// React replaces the value setter, so a native write must be dispatched.
function type(el, value) {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value").set;
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

act(() => { type(container.querySelector("#in"), "ada"); });
console.log("typed 'ada' ->", container.querySelector("#in").value, "|", container.querySelector("#len").textContent);

act(() => { type(container.querySelector("#in"), "ada lovelace"); });
console.log("typed more  ->", container.querySelector("#in").value, "|", container.querySelector("#len").textContent);`,
          output: `typed 'ada' -> ADA | 3 characters
typed more  -> ADA LOVELACE | 12 characters`,
          explanation:
            "Lowercase went in and uppercase came out, because the state decided what the input shows. The character count is in step for free — it reads the same state, in the same render, so there is no possibility of the two disagreeing. That is the argument for controlled inputs in one line.",
        },
      ],
    },
    {
      id: "frozen",
      heading: "The input that will not accept typing",
      body: [
        "`<input value={text} />` with no `onChange` produces an input nobody can type into. React warns: *You provided a `value` prop to a form field without an `onChange` handler.*",
        "It follows from the model rather than being a special case. The value is pinned to state; typing fires an event nobody handles; state does not change; the re-render puts the old value back. The keystroke was accepted by the DOM and then overwritten.",
        "Three ways out, depending on what you meant. Add the `onChange` — the usual answer. Use `defaultValue` instead, if you did not want React to own it. Or add `readOnly` if the input is genuinely for display, which also tells assistive technology the truth.",
      ],
      pitfalls: [
        {
          title: "`value={user.name}` with no handler is the same bug with better camouflage",
          body: "Rendering a prop straight into `value` looks like display code and behaves like a broken input. If it is display, use `readOnly` so it is announced as such and looks disabled; if it is editable, the value has to be state that the component can change. This is the most common way the frozen input appears in real code, because nothing about it looks like a form.",
        },
      ],
    },
    {
      id: "undefined",
      heading: "The other warning: controlled becoming uncontrolled",
      body: [
        "*A component is changing an uncontrolled input to be controlled.* This one appears when `value` starts as `undefined` and later becomes a string — usually because the initial state came from data that had not arrived yet.",
        "React decides which mode an input is in by whether `value` is `undefined` on its first render, and it cannot switch afterwards. `useState()` with no argument, or `useState(user?.name)` before `user` loads, gives `undefined` and therefore an uncontrolled input that later tries to become controlled.",
        "The fix is to make the initial value a string: `useState(\"\")`, or `value={name ?? \"\"}`. Never `value={name}` where `name` may be `undefined` or `null`.",
      ],
    },
    {
      id: "choosing",
      heading: "Choosing between them",
      body: [
        "**Controlled** when the value affects anything else during the same render: live validation, a character counter, a disabled submit button, filtering a list as you type, formatting as you type, or two inputs that constrain each other.",
        "**Uncontrolled** when the value is only needed at submit time. A login form that reads two fields once does not need a re-render per keystroke, and `FormData` can read the whole form in a line — the next lesson but one covers that.",
        "**Uncontrolled** is also the only option for `<input type=\"file\">`, whose value cannot be set programmatically for security reasons.",
        "In practice most forms are controlled, because most forms grow a validation message eventually. But \"controlled by default\" is a habit rather than a rule, and a large form that re-renders on every keystroke is a real cost that module 9 will make measurable.",
      ],
      examples: [
        {
          id: "both-models",
          title: "The same field, both ways",
          lang: "tsx",
          code: `import { useRef, useState, act } from "react";
import { createRoot } from "react-dom/client";

let controlledRenders = 0;
let uncontrolledRenders = 0;

function Controlled() {
  controlledRenders++;
  const [name, setName] = useState("");
  return (
    <>
      <input id="c" value={name} onChange={(e) => setName(e.target.value)} />
      <span id="cv">{name.length}</span>
    </>
  );
}

function Uncontrolled() {
  uncontrolledRenders++;
  const ref = useRef(null);
  return (
    <>
      <input id="u" defaultValue="" ref={ref} />
      <button id="read" onClick={() => console.log("  read at submit:", ref.current.value)}>read</button>
    </>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
act(() => { root.render(<><Controlled /><Uncontrolled /></>); });

function type(el, value) {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value").set;
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

act(() => { type(container.querySelector("#c"), "A"); });
act(() => { type(container.querySelector("#c"), "Ad"); });
act(() => { type(container.querySelector("#c"), "Ada"); });

// The uncontrolled one is typed into without React hearing about it at all.
container.querySelector("#u").value = "Grace";

console.log("after three keystrokes each:");
console.log("  controlled renders:  ", controlledRenders);
console.log("  uncontrolled renders:", uncontrolledRenders);
act(() => { container.querySelector("#read").click(); });`,
          output: `after three keystrokes each:
  controlled renders:   4
  uncontrolled renders: 1
  read at submit: Grace`,
          explanation:
            "Four renders against one. The controlled version re-rendered per keystroke, which is what let it show a live character count; the uncontrolled one never re-rendered at all and still produced the right value when asked. Neither number is a verdict — it is the trade, stated in renders.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What makes an input controlled?",
      answer:
        "Its `value` comes from React state and it has an `onChange` that updates that state. Ownership of the value moves from the DOM node to React: a keystroke fires the handler, state changes, the component re-renders, and the new state is what the input displays. What you see is not the character you typed but the state produced in response to it, which is why the value can be transformed or rejected on the way.",
    },
    {
      question: "Why does an input with `value` and no `onChange` refuse to accept typing?",
      answer:
        "Because the value is pinned to state that nothing updates. The keystroke fires an event nobody handles, state stays the same, and the re-render writes the old value back over what the DOM briefly accepted. React warns about it explicitly. The fix depends on intent: add the handler, switch to `defaultValue` if React should not own it, or add `readOnly` if it is genuinely display-only.",
    },
    {
      question: "When would you deliberately use an uncontrolled input?",
      answer:
        "When the value is only needed at submit time and nothing else in the render depends on it — a login form is the classic case, where controlled inputs buy a re-render per keystroke and nothing else. `FormData` can read the whole form at submit in one line. File inputs must be uncontrolled, since their value cannot be set programmatically. Anything with live validation, a counter, or a field that constrains another should be controlled.",
    },
  ],
  takeaways: [
    "Uncontrolled means the DOM owns the value; controlled means React owns it",
    "The loop is type → onChange → setState → re-render → value, so what you see is state, not the keystroke",
    "`value` without `onChange` gives an input that cannot be typed into — add the handler, `defaultValue`, or `readOnly`",
    "An initial `undefined` value makes the input uncontrolled forever; use `\"\"` or `value ?? \"\"`",
    "Controlled costs a render per keystroke and buys anything that must react during that render",
    "File inputs can only be uncontrolled",
  ],
  status: "available",
};
