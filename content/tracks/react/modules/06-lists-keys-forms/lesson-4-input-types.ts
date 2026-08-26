import type { Lesson } from "@/content/types";

export const inputTypesLesson: Lesson = {
  id: "react-input-types",
  slug: "every-input-type",
  moduleSlug: "lists-keys-forms",
  title: "Text, Checkboxes, Radios, Selects and Textareas",
  summary:
    "Each control reads a different property off the event and needs a different shape of state. The set is small and worth knowing exactly, because guessing produces a checkbox bound to the string \"on\".",
  estimatedMinutes: 30,
  objectives: [
    "Bind every common control correctly, by property rather than by guess",
    "Model a radio group and a multi-select in state",
    "Say where React departs from HTML for `<textarea>` and `<select>`",
    "Handle a group of checkboxes without a state variable each",
    "Know which control cannot be controlled at all",
  ],
  sections: [
    {
      id: "the-table",
      heading: "Which property to read",
      body: [
        "The whole lesson in five lines. Everything else is applying them.",
        "**Text, email, password, number, date, range, textarea:** bind `value`, read `event.target.value`. Always a **string**, including from `type=\"number\"` — `Number(e.target.value)` if you need a number, and note that an empty field gives `\"\"`, which `Number` turns into `0`.",
        "**Checkbox:** bind `checked`, read `event.target.checked`. A boolean.",
        "**Radio:** bind `checked={state === thisValue}`, read `event.target.value`. One state variable for the whole group.",
        "**Select (single):** bind `value` on the `<select>`, read `event.target.value`.",
        "**Select (multiple):** bind `value` to an **array**, and read the selected options out of `event.target.selectedOptions`.",
        "**File:** cannot be controlled. Read `event.target.files` and keep a ref.",
      ],
      examples: [
        {
          id: "every-control",
          title: "One form, every control, bound correctly",
          lang: "tsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

function Everything() {
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [size, setSize] = useState("m");
  const [plan, setPlan] = useState("free");
  const [notes, setNotes] = useState("");

  return (
    <form>
      <input id="name" value={name} onChange={(e) => setName(e.target.value)} />

      {/* checked, not value */}
      <input id="agree" type="checkbox" checked={agreed}
             onChange={(e) => setAgreed(e.target.checked)} />

      {/* value on the select itself — not \`selected\` on an option */}
      <select id="size" value={size} onChange={(e) => setSize(e.target.value)}>
        <option value="s">Small</option>
        <option value="m">Medium</option>
        <option value="l">Large</option>
      </select>

      {/* one state variable for the group; checked is derived */}
      <input id="free" type="radio" name="plan" value="free"
             checked={plan === "free"} onChange={(e) => setPlan(e.target.value)} />
      <input id="pro" type="radio" name="plan" value="pro"
             checked={plan === "pro"} onChange={(e) => setPlan(e.target.value)} />

      {/* value, not children */}
      <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

      <output id="out">{name}|{String(agreed)}|{size}|{plan}|{notes}</output>
    </form>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
act(() => { root.render(<Everything />); });
const show = (label) => console.log(label, container.querySelector("#out").textContent);

function set(el, value) {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value").set;
  setter.call(el, value);
  el.dispatchEvent(new Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
}

show("initial:     ");
act(() => { set(container.querySelector("#name"), "Ada"); });
act(() => { container.querySelector("#agree").click(); });
act(() => { set(container.querySelector("#size"), "l"); });
act(() => { container.querySelector("#pro").click(); });
act(() => { set(container.querySelector("#notes"), "hello"); });
show("after edits: ");`,
          output: `initial:      |false|m|free|
after edits:  Ada|true|l|pro|hello`,
          explanation:
            "Five controls, five bindings, one shape each. The two that catch people are the checkbox — `checked` and `e.target.checked`, because binding `value` gives you the string `\"on\"` — and the radio group, which is one piece of state with `checked` derived from it rather than one boolean per button.",
        },
      ],
      pitfalls: [
        {
          title: "`type=\"number\"` still gives you a string",
          body: "`e.target.value` is `\"42\"`, not `42`, so `total + e.target.value` concatenates. Convert at the boundary — but carefully: an empty field gives `\"\"` and `Number(\"\")` is `0`, which silently turns a cleared price field into free. Keep the raw string in state and convert when you use it, or store `value === \"\" ? null : Number(value)`.",
        },
      ],
    },
    {
      id: "react-vs-html",
      heading: "Where React departs from HTML",
      body: [
        "Three places, all of them React choosing consistency over fidelity to the platform.",
        "**`<textarea>` takes `value`, not children.** In HTML the content sits between the tags; in React that would make it impossible to control, so `<textarea value={notes} />` is the form and `<textarea>{notes}</textarea>` is a mistake.",
        "**`<select>` takes `value`, not `selected` on an option.** HTML marks the chosen option; React puts the value on the select, which means one place to look and one place to change.",
        "**`<option>` needs no `key` when the list is static**, but does when it is mapped — it is an ordinary list like any other.",
        "All three exist so that every control follows the same rule: the value lives on the element you bind, and the element you bind is the one with the `onChange`.",
      ],
    },
    {
      id: "groups",
      heading: "Groups without a variable each",
      body: [
        "A form with eight checkboxes does not want eight `useState` calls. Two shapes cover almost everything.",
        "**An object keyed by name** — `{ email: true, sms: false }` — when the options are fixed and known. Updating is the computed-key spread from module 4: `setPrefs(p => ({ ...p, [name]: checked }))`.",
        "**An array or `Set` of selected ids** when the options are dynamic. `checked={selected.includes(id)}`, and the handler adds or removes.",
        "For a multi-select, `value` is an array and the selected options come off the event: `[...e.target.selectedOptions].map(o => o.value)`.",
      ],
      examples: [
        {
          id: "checkbox-group",
          title: "Eight checkboxes, one piece of state",
          lang: "tsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

const TOPICS = ["react", "rust", "go"];

function Topics() {
  // A Set of ids: no state variable per option, and adding an option to the
  // list above needs no change here at all.
  const [selected, setSelected] = useState(() => new Set(["react"]));

  function toggle(topic, checked) {
    setSelected((prev) => {
      const next = new Set(prev);         // copy — never mutate state
      if (checked) next.add(topic); else next.delete(topic);
      return next;
    });
  }

  return (
    <>
      {TOPICS.map((topic) => (
        <input
          key={topic}
          id={topic}
          type="checkbox"
          checked={selected.has(topic)}
          onChange={(e) => toggle(topic, e.target.checked)}
        />
      ))}
      <output id="out">{[...selected].join(",") || "none"}</output>
    </>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
act(() => { root.render(<Topics />); });
const show = (label) => console.log(label, container.querySelector("#out").textContent);

show("initial:      ");
act(() => { container.querySelector("#rust").click(); });
act(() => { container.querySelector("#go").click(); });
show("added two:    ");
act(() => { container.querySelector("#react").click(); });
show("removed react:");`,
          output: `initial:       react
added two:     react,rust,go
removed react: rust,go`,
          explanation:
            "One state value for the whole group, and the list of topics can grow without touching the component. Note the copy inside the updater: `new Set(prev)` rather than mutating and returning `prev`, because module 4 measured what returning the same reference does — React compares, sees no change, and skips the render.",
        },
      ],
    },
    {
      id: "files",
      heading: "The one that cannot be controlled",
      body: [
        "`<input type=\"file\">` has a `value` that cannot be set from script. If it could, a page could point a file input at `/etc/passwd` and submit it, so browsers allow only the user to set it.",
        "So a file input is always uncontrolled. Read `event.target.files` in the change handler — a `FileList`, which is array-like rather than an array, so `[...e.target.files]` when you want to map over it.",
        "Clearing one is the exception to the rule: assigning the empty string is permitted, so `inputRef.current.value = \"\"` resets it. Changing the `key` also works and is the more React-shaped answer.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you bind a checkbox, and why is it different from a text input?",
      answer:
        "Bind `checked` rather than `value`, and read `event.target.checked`, which is a boolean. A checkbox's `value` is the string submitted when it is ticked — `\"on\"` by default — not whether it is ticked, so binding `value` gives a control that never reflects its own state. Radios read `event.target.value` instead, with `checked` derived from a single piece of state for the whole group.",
    },
    {
      question: "How does React handle `<textarea>` and `<select>` differently from HTML?",
      answer:
        "Both take a `value` prop. In HTML a textarea's content is its children and a select's choice is marked with `selected` on an option; React moves both onto the element you bind, so every control follows one rule — the value lives on the element that has the `onChange`. A multi-select's `value` is an array, and the chosen options are read from `event.target.selectedOptions`.",
    },
    {
      question: "Why can't a file input be controlled?",
      answer:
        "Because its `value` cannot be set from script — if it could, a page could point it at an arbitrary file on the user's disk and submit it. Only the user can choose a file, so it is always uncontrolled: read `event.target.files` in the handler. The one permitted write is the empty string, which clears it; changing the input's `key` does the same thing more idiomatically.",
    },
  ],
  takeaways: [
    "Text and textarea bind `value`; checkbox binds `checked`; radio binds `checked={state === value}`",
    "`type=\"number\"` still yields a string, and `Number(\"\")` is `0` — convert carefully",
    "`<textarea>` takes `value` rather than children, and `<select>` takes `value` rather than `selected`",
    "A group of checkboxes is one `Set` or object, not one boolean per box",
    "Copy before mutating a `Set` or object in an updater, or React skips the render",
    "File inputs cannot be controlled; read `event.target.files` and clear with `\"\"` or a new key",
  ],
  status: "available",
};
