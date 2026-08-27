import type { Lesson } from "@/content/types";

export const youMightNotNeedAnEffectLesson: Lesson = {
  id: "react-no-effect-needed",
  slug: "you-might-not-need-an-effect",
  moduleSlug: "effects-and-data",
  title: "You Might Not Need an Effect",
  summary:
    "The lesson that removes more code than it adds. Three things people reach for an effect to do, what each one costs when you measure it, and what to write instead — starting with deriving a value, which needs no state at all.",
  estimatedMinutes: 30,
  objectives: [
    "Recognise derived state, and compute it during render instead",
    "Reset state on a prop change with a key rather than with an effect",
    "Put event-specific logic in the handler, and say what goes wrong when it lives in an effect",
    "Name the two things effects are actually for",
    "Use a decision rule you can apply before writing the effect",
  ],
  sections: [
    {
      id: "why-first",
      heading: "Why this comes first",
      body: [
        "Module 5 taught you `useEffect`: what it does, when it runs, how the dependency array works. This module is about using it well, and using it well starts with using it less.",
        "That is not a stylistic preference. Every unnecessary effect costs you a **second render pass**, because the effect runs after the commit and sets state that forces another one — and in the gap between those two passes the user is looking at a value you know is wrong. It also adds a dependency array to keep correct, and dependency arrays are where the subtle bugs live.",
        "There are exactly two jobs an effect is for. **Synchronising with something outside React** — a subscription, a browser API, a network connection, a third-party widget. And **fetching data**, which is really the first one wearing a different hat. Anything else has a better answer, and the three below cover nearly all of it.",
      ],
    },
    {
      id: "derived",
      heading: "Deriving a value from other values",
      body: [
        "The most common unnecessary effect in every codebase: some state, and an effect that keeps it in step with props or other state.",
        "Run it and watch what the component actually does.",
      ],
      examples: [
        {
          id: "derived-state",
          title: "One value derived two ways",
          lang: "tsx",
          code: `import { useState, useEffect, act } from "react";
import { createRoot } from "react-dom/client";

const container = document.createElement("div");
document.body.appendChild(container);

/* Reaching for an effect to derive one value from two others. */
function ViaEffect({ first, last }: { first: string; last: string }) {
  const [full, setFull] = useState("");
  useEffect(() => {
    setFull(first + " " + last);
  }, [first, last]);
  console.log("  ViaEffect renders with full =", JSON.stringify(full));
  return <p>{full}</p>;
}

/* The same value, computed where it is used. */
function Plain({ first, last }: { first: string; last: string }) {
  const full = first + " " + last;
  console.log("  Plain renders with full =", JSON.stringify(full));
  return <p>{full}</p>;
}

const root = createRoot(container);

console.log("mount ViaEffect:");
act(() => { root.render(<ViaEffect first="Ada" last="Lovelace" />); });
console.log("  DOM:", container.innerHTML);

console.log("change the last name prop:");
act(() => { root.render(<ViaEffect first="Ada" last="Byron" />); });
console.log("  DOM:", container.innerHTML);

const second = document.createElement("div");
document.body.appendChild(second);
console.log("mount Plain:");
act(() => { createRoot(second).render(<Plain first="Ada" last="Lovelace" />); });
console.log("  DOM:", second.innerHTML);`,
          output: `mount ViaEffect:
  ViaEffect renders with full = ""
  ViaEffect renders with full = "Ada Lovelace"
  DOM: <p>Ada Lovelace</p>
change the last name prop:
  ViaEffect renders with full = "Ada Lovelace"
  ViaEffect renders with full = "Ada Byron"
  DOM: <p>Ada Byron</p>
mount Plain:
  Plain renders with full = "Ada Lovelace"
  DOM: <p>Ada Lovelace</p>`,
          explanation:
            "Read the middle block. The prop became `Byron`, and the component's **first** render after that still says `Ada Lovelace` — the old value, because the effect that would fix it has not run yet. Then a second render corrects it. The version with no effect and no state gets it right on the first pass, in one render, with three fewer lines.",
        },
      ],
      pitfalls: [
        {
          title: "\"But it is expensive to compute\"",
          body: "Then wrap the computation in `useMemo`, which caches it *during* render and adds no render pass. That is a different tool from an effect and it does not introduce a wrong intermediate state. Reach for it after you have measured, not before — module 9 covers what it costs.",
        },
        {
          title: "The rule, stated so you can apply it",
          body: "If a piece of state can always be computed from props and other state, it is not state. Delete the `useState`, delete the effect, and compute it in the component body. The test is a question: could this value ever legitimately disagree with what it is derived from? If not, storing it is storing a second copy that can go stale.",
        },
      ],
    },
    {
      id: "resetting",
      heading: "Resetting state when a prop changes",
      body: [
        "The second most common. An editor holds a draft; the user switches to a different record; the draft must be cleared. The obvious move is an effect on the id.",
        "It works. It also renders the new record's screen once with the old record's data in it.",
      ],
      examples: [
        {
          id: "reset-with-key",
          title: "Clearing a draft: effect against key",
          lang: "tsx",
          code: `import { useState, useEffect, act } from "react";
import { createRoot } from "react-dom/client";

/* Version 1: an effect that watches the prop and clears the draft. */
function ViaEffect({ userId }: { userId: string }) {
  const [draft, setDraft] = useState("");
  useEffect(() => { setDraft(""); }, [userId]);
  console.log(\`  render userId=\${userId} draft=\${JSON.stringify(draft)}\`);
  return <input value={draft} onChange={(e) => setDraft(e.target.value)} />;
}

/* Version 2: no effect at all. A different key is a different component
   instance, so React discards the old state instead of clearing it. */
function Editor({ userId }: { userId: string }) {
  const [draft, setDraft] = useState("");
  console.log(\`  render userId=\${userId} draft=\${JSON.stringify(draft)}\`);
  return <input value={draft} onChange={(e) => setDraft(e.target.value)} />;
}
const ViaKey = ({ userId }: { userId: string }) => <Editor key={userId} userId={userId} />;

function drive(Component: (p: { userId: string }) => React.JSX.Element, label: string) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const input = () => container.querySelector("input")!;
  console.log(label);
  act(() => { root.render(<Component userId="ada" />); });
  act(() => {
    // What the browser does when the user types.
    const node = input();
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!
      .set!.call(node, "half-written note");
    node.dispatchEvent(new Event("input", { bubbles: true }));
  });
  console.log("  after typing:", JSON.stringify(input().value));
  act(() => { root.render(<Component userId="grace" />); });
  console.log("  after switching user:", JSON.stringify(input().value));
}

drive(ViaEffect, "reset with an effect:");
drive(ViaKey, "reset with a key:");`,
          output: `reset with an effect:
  render userId=ada draft=""
  render userId=ada draft="half-written note"
  render userId=ada draft="half-written note"
  after typing: "half-written note"
  render userId=grace draft="half-written note"
  render userId=grace draft=""
  after switching user: ""
reset with a key:
  render userId=ada draft=""
  render userId=ada draft="half-written note"
  after typing: "half-written note"
  render userId=grace draft=""
  after switching user: ""`,
          explanation:
            "Look at the line `render userId=grace draft=\"half-written note\"`. That is one render, committed to the DOM, showing **Grace's editor containing Ada's unsaved text**. On a real screen that is a visible flash, and if the user is quick it is a keystroke landing in the wrong record. The keyed version never produces that frame: a new key means a new instance, so the old state is thrown away before anything renders.",
        },
      ],
      pitfalls: [
        {
          title: "The third render in the effect version",
          body: "The effect version renders once more after typing than the keyed one does. That is React finishing off the mount effect's `setDraft(\"\")`: setting state to the value it already holds lets React bail out of re-rendering the children, but it does not always let it skip the component. One wasted pass, from an effect that had nothing to do.",
        },
        {
          title: "Keying resets *everything*, which is usually what you want",
          body: "A new key discards all of that component's state, not just the field you were thinking about — scroll position, an open dropdown, a pending validation message. When you are switching to a different record, discarding all of it is correct: none of it was about the new record. When you only want one field cleared, the key is too blunt and you should lift that field instead.",
        },
      ],
    },
    {
      id: "event-logic",
      heading: "Logic that belongs to an event",
      body: [
        "The third, and the one that reaches production most often, because it is invisible until you look at the network tab.",
        "Something happens — the user adds an item to the cart — and you need to tell the server. Writing that as an effect that watches a flag turns *\"this happened\"* into *\"this is true\"*, and those are not the same statement. A fact stays true, so anything that re-runs the effect states it again.",
      ],
      examples: [
        {
          id: "effect-vs-handler",
          title: "One click, counted at the server",
          lang: "tsx",
          code: `import { useState, useEffect, StrictMode, act } from "react";
import { createRoot } from "react-dom/client";

let sent = 0;
const post = (what: string) => { sent++; console.log(\`  POST /analytics \${what}\`); };

/* "The user added something, so tell the server" — written as an effect that
   watches the fact. \`added\` lives in the parent, as it would if the cart were
   shared, and the panel unmounts when the user switches tab. */
function Panel({ added, onAdd }: { added: boolean; onAdd: () => void }) {
  useEffect(() => {
    if (added) post("add-to-cart");
  }, [added]);
  return <button type="button" onClick={onAdd}>Add</button>;
}

/* The same thing, sent from the place where the event happened. */
function HandlerPanel({ onAdd }: { onAdd: () => void }) {
  return (
    <button type="button" onClick={() => { onAdd(); post("add-to-cart"); }}>Add</button>
  );
}

function Shop({ effectVersion }: { effectVersion: boolean }) {
  const [added, setAdded] = useState(false);
  const [tab, setTab] = useState("shop");
  return (
    <>
      {tab === "shop" && (effectVersion
        ? <Panel added={added} onAdd={() => setAdded(true)} />
        : <HandlerPanel onAdd={() => setAdded(true)} />)}
      <button type="button" id="tab" onClick={() => setTab((t) => (t === "shop" ? "help" : "shop"))}>
        switch tab
      </button>
    </>
  );
}

function drive(effectVersion: boolean, label: string) {
  sent = 0;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  console.log(label);
  act(() => { root.render(<StrictMode><Shop effectVersion={effectVersion} /></StrictMode>); });
  const click = (id?: string) =>
    act(() => { (id ? container.querySelector(\`#\${id}\`) : container.querySelector("button"))!.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
  click();               // Add
  click("tab");          // leave the shop tab
  click("tab");          // come back
  console.log(\`  the user clicked Add once; the server was told \${sent} time(s)\`);
}

drive(true, "the fact, watched by an effect:");
drive(false, "the event, handled where it happened:");`,
          output: `the fact, watched by an effect:
  POST /analytics add-to-cart
  POST /analytics add-to-cart
  POST /analytics add-to-cart
  the user clicked Add once; the server was told 3 time(s)
the event, handled where it happened:
  POST /analytics add-to-cart
  the user clicked Add once; the server was told 1 time(s)`,
          explanation:
            "One click, three requests. The first fired when `added` became true. Then the user visited another tab and came back: the panel re-mounted, `added` was still true, and the effect stated the fact again — twice, because Strict Mode mounts a component, unmounts it and mounts it again. The handler version fires once per click because a click happens once.",
        },
      ],
      pitfalls: [
        {
          title: "The question that separates the two",
          body: "Ask *why* this code runs. If the answer names an interaction — \"because the user clicked Add\" — it belongs in the handler for that interaction. If the answer is \"because this component is on screen showing this data\", it belongs in an effect. `added` becoming true is not a reason; it is a consequence of the reason, and by the time the effect sees it the reason is gone.",
        },
      ],
    },
    {
      id: "the-rule",
      heading: "The decision rule",
      body: [
        "Before writing `useEffect`, answer one question: **what outside React am I synchronising with?**",
        "If you can name it — a WebSocket, `localStorage`, an analytics SDK, a map widget, the document title, an HTTP endpoint — write the effect. That is what it is for, and the next lesson is about doing it properly.",
        "If you cannot, you are almost certainly in one of these, and each has an answer that is shorter and has no wrong intermediate frame:",
        "**Deriving a value** from props or state → compute it during render. `useMemo` if it is genuinely expensive.",
        "**Resetting state** when a prop changes → give the component a `key`.",
        "**Reacting to a user action** → do it in the handler.",
        "**Sharing logic between components** → a custom hook, which is module 10. Note that this does not remove the effect; it moves it, and the effect inside still has to earn its place by this same rule.",
        "**Chaining state updates** — an effect that sets state, which triggers an effect that sets more state → compute the whole thing in one place. A chain of effects is a render pass per link and a debugging session per bug.",
      ],
      pitfalls: [
        {
          title: "The linter will not catch any of this",
          body: "`react-hooks/exhaustive-deps` checks that your dependency array matches what the effect reads. It has no opinion about whether the effect should exist. Every example in this lesson passes the linter cleanly — which is worth knowing, because a green lint is easily mistaken for a correct design.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When do you not need an effect?",
      answer:
        "Whenever you cannot name the thing outside React you are synchronising with. The three common cases: deriving a value from props or state, which should be computed during render; resetting state when a prop changes, which should be a `key`; and reacting to a user action, which belongs in the event handler. Each of those, written as an effect, costs an extra render pass and gives you one committed frame showing the stale value.",
    },
    {
      question: "Why is resetting state with a key better than resetting it in an effect?",
      answer:
        "Because the effect runs after the commit, so there is one rendered frame showing the new record with the old record's state still in it — visible as a flash, and capable of taking a keystroke into the wrong record. A changed key means React treats it as a different component instance and discards the old state before rendering, so that frame never exists. It also resets everything, including scroll, focus and open menus, which is what \"different record\" actually means.",
    },
    {
      question: "What goes wrong when a side effect for an event lives in an effect?",
      answer:
        "An event happens once; a fact stays true. Watching `added` with an effect means anything that re-runs the effect — a remount after a route change, Strict Mode's double mount in development — restates the fact and fires the side effect again. One click can send three requests. Handlers run once per interaction, which is exactly the semantics the interaction has.",
    },
    {
      question: "Does `useMemo` solve the same problem as an effect that derives state?",
      answer:
        "It solves the cost, not the correctness — and the correctness is what matters. Computing during render is already correct and always right on the first pass; `useMemo` only avoids recomputing when the inputs have not changed. An effect that derives state is wrong in a different way regardless of cost: it commits one render with the old value before fixing it.",
    },
  ],
  takeaways: [
    "An effect is for synchronising with something outside React — if you cannot name that thing, do not write one",
    "An unnecessary effect costs a second render pass and commits one frame showing the stale value",
    "State that can always be computed from props and other state is not state — compute it during render",
    "Reset on a prop change with a `key`, which discards the old instance before anything renders",
    "Event logic goes in the handler: an event happens once, a state flag stays true and gets restated on every remount",
    "A chain of effects that set each other's state is a render pass per link — compute it in one place",
    "`exhaustive-deps` checks your dependency array, never whether the effect should exist",
  ],
  status: "available",
};
