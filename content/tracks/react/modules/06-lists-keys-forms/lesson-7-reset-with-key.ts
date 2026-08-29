import type { Lesson } from "@/content/types";

export const resetWithKeyLesson: Lesson = {
  id: "react-reset-with-key",
  slug: "resetting-with-a-key",
  moduleSlug: "lists-keys-forms",
  title: "Resetting a Form With a Key, Instead of an Effect",
  summary:
    "Switching an editor from one record to another has to discard the first one's half-finished edits. Changing the component's key does it in one line, and does it before anything wrong is ever painted.",
  estimatedMinutes: 25,
  objectives: [
    "Reset a component's state by changing its key",
    "Say why the effect version paints the wrong content first",
    "Place the key on the right component",
    "Distinguish resetting everything from resetting one field",
    "Recognise when the state should have been lifted instead",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "The problem",
      body: [
        "An editor takes a record as a prop and seeds its fields from it. The user edits half of them. Then the selection changes to a different record.",
        "The fields must not keep the previous record's edits. But module 5 established that `useState(props.record.name)` uses its argument only on the first render of that instance — so nothing resets, and the new record is displayed with the old one's half-typed values.",
        "The instinct is an effect: watch the record id and set every field. It works, and it has three problems that get worse as the form grows.",
        "It runs **after** the render that already painted the wrong content. It has to be kept in step with every field ever added, and the field somebody forgets is the bug. And it is a second source of truth for \"what should this form contain\", competing with the initial state.",
      ],
    },
    {
      id: "the-key",
      heading: "The one-line answer",
      body: [
        "`<Editor key={record.id} record={record} />`.",
        "A different key at the same position is a different identity, so React unmounts the old instance and mounts a fresh one. Every `useState` runs its initialiser again, refs are recreated, effects re-run their setup. There is no reset code because there is no instance to reset.",
        "And it happens during reconciliation, before the commit — so no frame is ever painted showing the new record with the old record's values.",
        "This is the same mechanism as the index-key bug two lessons ago, used deliberately. There, changing identity destroyed state you wanted; here it destroys state you want gone.",
      ],
      examples: [
        {
          id: "key-resets-editor",
          title: "The same editor, with and without a key",
          lang: "jsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

function Editor({ record }) {
  // Seeded once per instance — module 5's rule.
  const [name, setName] = useState(record.name);
  return (
    <input
      className="editor"
      value={name}
      onChange={(e) => setName(e.target.value)}
    />
  );
}

function App({ record, keyed }) {
  return keyed
    ? <Editor key={record.id} record={record} />
    : <Editor record={record} />;
}

const ada = { id: "a", name: "Ada" };
const grace = { id: "g", name: "Grace" };

function run(keyed) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => { root.render(<App record={ada} keyed={keyed} />); });

  // The user edits Ada's name but does not save.
  const input = container.querySelector("input");
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value").set;
  act(() => {
    setter.call(input, "Ada (edited)");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

  const before = container.querySelector("input").value;
  act(() => { root.render(<App record={grace} keyed={keyed} />); });
  const after = container.querySelector("input").value;

  console.log(
    keyed ? "with key:   " : "without key:",
    \`edited to "\${before}", then switched to Grace -> "\${after}"\`
  );
}

run(false);
run(true);`,
          output: `without key: edited to "Ada (edited)", then switched to Grace -> "Ada (edited)"
with key:    edited to "Ada (edited)", then switched to Grace -> "Grace"`,
          explanation:
            "Without the key, the editor is showing `Ada (edited)` while its `record` prop is Grace — the component kept its instance, so `useState` returned the stored value and the initialiser was never consulted again. With the key, React saw a different identity at that position, mounted a new instance, and the initialiser ran against the new record. One prop, and no reset logic anywhere.",
        },
      ],
      pitfalls: [
        {
          title: "The key goes on the component that owns the state",
          body: "Putting it on a wrapper `<div key={id}>` around the editor throws away the div and everything under it, which happens to include the editor — so it appears to work. It also destroys anything else in that subtree, and it stops working the moment somebody moves the editor out of the wrapper. Put the key on the component whose state you mean to discard.",
        },
      ],
    },
    {
      id: "granularity",
      heading: "Resetting some of it",
      body: [
        "A key resets **everything** in that component and everything below it. Usually that is exactly right — a new record means a new form.",
        "When only part should reset, the component boundary is the tool: put the part that resets in its own component and key that. A wizard that keeps the user's name across steps but clears the step's own fields is `<Step key={stepId} />` inside a form that owns the name.",
        "That is a good default even before you need it, because \"which state resets together\" is a real property of a form and worth having in the component structure rather than in a list of setter calls.",
      ],
    },
    {
      id: "or-lift",
      heading: "Or the state should not be there at all",
      body: [
        "The third option, and often the best: if a value both starts from a prop and needs to survive the prop changing, it probably belongs to the parent.",
        "A parent holding `drafts` keyed by record id can render `<Editor value={drafts[id]} onChange={...} />` — the editor becomes stateless, switching records is instant, and the user's unsaved edits are still there when they switch back. That is behaviour a key-based reset cannot give you, because a reset genuinely discards.",
        "The decision is what should happen to unsaved work. Discard it: change the key. Keep it: lift it into the parent. Ask which one the product wants before reaching for either.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you reset a component's state when a prop changes?",
      answer:
        "Give it a `key` derived from that prop. A different key at the same position is a different identity, so React unmounts the old instance and mounts a fresh one — every `useState` initialiser runs again and there is no reset code to maintain. It also happens during reconciliation, before the commit, so no frame is ever painted showing the new subject with the old subject's values.",
    },
    {
      question: "Why is an effect that resets fields on a prop change worse?",
      answer:
        "It runs after the render that already painted the stale content, so there is a visible frame with the wrong data. It has to list every field, so any field added later and forgotten becomes a bug. And it is a second definition of what the form should contain, competing with the initial state. The key approach has none of these because it discards the instance rather than correcting it.",
    },
    {
      question: "When would you lift the state instead of resetting it with a key?",
      answer:
        "When the unsaved work should survive switching away and back. A key-based reset genuinely discards, so if the product wants drafts preserved per record, the parent should hold them keyed by id and the editor should become stateless. The question to ask first is what should happen to half-finished edits: discard means a key, keep means lifting.",
    },
  ],
  takeaways: [
    "A different key is a different identity, so React mounts a fresh instance with fresh state",
    "It happens before the commit, so the stale content is never painted",
    "The effect version paints the wrong frame and needs updating for every field added",
    "Put the key on the component that owns the state, not on a convenient wrapper",
    "A key resets the whole subtree — use a component boundary when only part should reset",
    "If unsaved edits should survive, lift the state to the parent instead of resetting",
  ],
  status: "available",
};
