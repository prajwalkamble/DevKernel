import type { Lesson } from "@/content/types";

export const objectsAndArraysLesson: Lesson = {
  id: "react-objects-and-arrays",
  slug: "objects-and-arrays-in-state",
  moduleSlug: "state-and-events",
  title: "Updating Objects and Arrays Without Mutating",
  summary:
    "Treat state as read-only and replace it instead of editing it. The patterns for doing that in one line, the nested case that catches everyone, and the new array methods that removed most of the awkwardness.",
  estimatedMinutes: 30,
  objectives: [
    "Say precisely why mutation fails, in React's terms",
    "Update a field of an object in state without touching the original",
    "Add, remove, replace and reorder items in an array in state",
    "Update something nested without a chain of spreads going wrong",
    "Use the non-mutating array methods, and know which methods mutate",
  ],
  sections: [
    {
      id: "why",
      heading: "Why mutation fails, precisely",
      visual: {
        id: "mutation-identity-visual",
        kind: "react-state",
        algorithm: "mutate-vs-copy",
        title: "What Object.is says about a mutated array",
      },
      body: [
        "React decides whether to re-render by comparing the new state with the old using `Object.is`. That is a reference comparison for objects and arrays.",
        "Mutate an object and hand back the same reference, and the comparison says nothing changed. React skips the render. The data has changed; the screen has not; nothing reports a problem. Lesson 3 measured exactly this — the render count did not move.",
        "So \"do not mutate state\" is not advice about purity in the abstract. It is the mechanism: **a new reference is how you tell React something changed.**",
        "The same reasoning extends outward. `React.memo`, `useMemo` and `useEffect` dependency arrays all compare by reference too, so a mutated object defeats every one of them in the same way.",
      ],
    },
    {
      id: "objects",
      heading: "Objects: copy, then override",
      body: [
        "The spread pattern is `{ ...previous, field: newValue }`. It builds a new object with the old fields and the one you are changing, and the ordering means the override wins.",
        "For a form with many fields, one handler can serve all of them by using a computed key: `{ ...prev, [name]: value }`. That is a plain computed property name, nothing React-specific.",
        "Deleting a field is the one case the spread does not cover neatly. Destructure it away and keep the rest: `const { removed, ...kept } = prev`.",
      ],
      examples: [
        {
          id: "object-updates",
          title: "One handler for every field",
          lang: "tsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

function Form() {
  const [form, setForm] = useState({ name: "", email: "", subscribed: false });

  // One handler, keyed by the input's name.
  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <>
      <span id="v">{JSON.stringify(form)}</span>
      <button id="n" onClick={() => update("name", "Ada")}>name</button>
      <button id="e" onClick={() => update("email", "ada@example.com")}>email</button>
      <button id="s" onClick={() => update("subscribed", true)}>sub</button>
    </>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

act(() => { root.render(<Form />); });
console.log("initial:", container.querySelector("#v").textContent);

act(() => { container.querySelector("#n").click(); });
act(() => { container.querySelector("#e").click(); });
act(() => { container.querySelector("#s").click(); });
console.log("filled: ", container.querySelector("#v").textContent);`,
          output: `initial: {"name":"","email":"","subscribed":false}
filled:  {"name":"Ada","email":"ada@example.com","subscribed":true}`,
          explanation:
            "Each click produced a whole new object with one field different. Note the updater form — `setForm(prev => …)` rather than `setForm({ ...form, … })`. Both work here, but the updater is correct even when several updates are queued together, and it costs nothing extra to write.",
        },
      ],
      pitfalls: [
        {
          title: "The spread is shallow, so nested objects are still shared",
          body: "`{ ...user }` copies the top level only. `user.address` in the copy is the *same object* as in the original, so `copy.address.city = \"x\"` mutates the original too — and React will compare the top-level objects, see they differ, and re-render, so the bug hides behind a render that did happen. Every level you intend to change must be copied.",
        },
      ],
    },
    {
      id: "arrays",
      heading: "Arrays: the four operations",
      body: [
        "**Add:** `[...items, item]` at the end, `[item, ...items]` at the front. Never `push` or `unshift`.",
        "**Remove:** `items.filter(i => i.id !== id)`. `filter` already returns a new array, so nothing else is needed.",
        "**Replace one:** `items.map(i => i.id === id ? next : i)`. `map` returns a new array and leaves the untouched items as the same references, which is exactly right — only the changed one is new.",
        "**Reorder or sort:** the modern methods return copies. `toSorted`, `toReversed`, `toSpliced` and `with` are non-mutating counterparts to `sort`, `reverse`, `splice` and index assignment.",
        "The four that mutate and must never be used on state directly: `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, and assignment to an index. Copy first if you need one of them.",
      ],
      examples: [
        {
          id: "array-updates",
          title: "Add, replace, remove, sort — all without mutating",
          lang: "tsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

function List() {
  const [items, setItems] = useState([
    { id: "b", label: "beta", done: false },
    { id: "a", label: "alpha", done: false },
  ]);

  return (
    <>
      <span id="v">{items.map((i) => \`\${i.label}\${i.done ? "*" : ""}\`).join(",")}</span>
      <button id="add" onClick={() => setItems((prev) => [...prev, { id: "c", label: "gamma", done: false }])}>add</button>
      <button id="tick" onClick={() => setItems((prev) => prev.map((i) => i.id === "a" ? { ...i, done: true } : i))}>tick</button>
      <button id="drop" onClick={() => setItems((prev) => prev.filter((i) => i.id !== "b"))}>drop</button>
      <button id="sort" onClick={() => setItems((prev) => prev.toSorted((x, y) => x.label.localeCompare(y.label)))}>sort</button>
    </>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
const show = (label) => console.log(label, container.querySelector("#v").textContent);

act(() => { root.render(<List />); });
show("initial:");
act(() => { container.querySelector("#add").click(); });
show("add:    ");
act(() => { container.querySelector("#tick").click(); });
show("tick a: ");
act(() => { container.querySelector("#drop").click(); });
show("drop b: ");
act(() => { container.querySelector("#sort").click(); });
show("sort:   ");`,
          output: `initial: beta,alpha
add:     beta,alpha,gamma
tick a:  beta,alpha*,gamma
drop b:  alpha*,gamma
sort:    alpha*,gamma`,
          explanation:
            "`toSorted` is the one worth noticing. `prev.sort(...)` would have sorted the array React is holding, in place, and returned the same reference — so React would have seen no change and skipped the render, leaving the screen in the old order while the data was sorted. `toSorted` returns a new array and the render happens.",
        },
      ],
    },
    {
      id: "nested",
      heading: "Nested updates, and when to stop",
      body: [
        "Changing something two levels down means copying both levels: `{ ...user, address: { ...user.address, city } }`. Three levels means three copies, and by then the line is hard to read and easy to get wrong — miss one level and you have a shared reference and a silent bug.",
        "Two ways out, in order of preference.",
        "**Flatten the state.** Deep nesting in state is usually a sign the shape was copied from an API response rather than designed for the screen. Storing a list of items keyed by id, with ids referenced elsewhere, removes most nesting entirely and makes updates one level deep.",
        "**Use a helper.** Immer's `produce` lets you write what looks like mutation and gives you an immutable copy; it is what Redux Toolkit uses internally. It is a real dependency and worth it when the shape genuinely is deep and cannot be flattened.",
        "What not to do is `structuredClone` or `JSON.parse(JSON.stringify(…))` on every update. Both copy everything, so every item in a list gets a new reference, and every memoised child re-renders — replacing a correctness problem with a performance one.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why can't you mutate state directly?",
      answer:
        "Because React compares old and new state with `Object.is`, which for objects and arrays is a reference comparison. Mutating and returning the same reference tells React nothing changed, so it skips the render — the data changes and the screen does not, with no error. A new reference is the mechanism by which you communicate a change, and the same applies to `memo`, `useMemo` and dependency arrays.",
    },
    {
      question: "How do you update a value nested two levels inside state?",
      answer:
        "Copy every level on the path: `{ ...user, address: { ...user.address, city } }`. Missing a level leaves a shared reference and a mutation that reaches the original. Once that chain gets long, the better answer is usually to flatten the state — deep nesting normally means the shape came from an API rather than being designed for the screen — or to use a helper such as Immer's `produce` for genuinely deep data.",
    },
    {
      question: "Which array methods are safe to use on state?",
      answer:
        "The ones that return a new array: `map`, `filter`, `slice`, `concat`, spread, and the newer `toSorted`, `toReversed`, `toSpliced` and `with`. The mutating ones — `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse` and index assignment — must never be applied to state directly. `sort` is the dangerous one in practice, because it both mutates and returns the same array, so the render is skipped and the screen silently keeps the old order.",
    },
  ],
  takeaways: [
    "A new reference is how you tell React something changed; mutation makes it skip the render entirely",
    "Objects: `{ ...prev, [field]: value }`, with a computed key serving a whole form from one handler",
    "Arrays: spread to add, `filter` to remove, `map` to replace one, `toSorted`/`toReversed`/`with` to reorder",
    "`sort` and `reverse` mutate *and* return the same reference, which is the worst combination",
    "The spread is shallow, so every level you intend to change must be copied",
    "Deeply nested state usually wants flattening rather than a longer chain of spreads",
  ],
  status: "available",
};
