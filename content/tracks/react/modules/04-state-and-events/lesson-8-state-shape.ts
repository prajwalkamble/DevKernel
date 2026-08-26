import type { Lesson } from "@/content/types";

export const stateShapeLesson: Lesson = {
  id: "react-state-shape",
  slug: "choosing-state-shape",
  moduleSlug: "state-and-events",
  title: "Choosing State Shape",
  summary:
    "Most state bugs are shape bugs. Five rules that remove whole categories of them — the most valuable being the one that deletes state entirely, because a value you can calculate is never out of date.",
  estimatedMinutes: 30,
  objectives: [
    "Recognise a derived value and calculate it instead of storing it",
    "Replace a set of boolean flags with a single status",
    "Remove duplicated state and keep an id instead of an object",
    "Group state that always changes together, and split state that does not",
    "Say why deeply nested state is a problem worth restructuring",
  ],
  sections: [
    {
      id: "derived",
      heading: "Do not store what you can calculate",
      body: [
        "This is the highest-value rule in the module, and the one most often broken. If a value can be worked out from props and other state, work it out during render. Do not put it in state.",
        "A total from a list of items, a filtered view of an array, whether a form is valid, the full name from a first and last name, whether anything is selected — all of these are derived. Storing them creates a second source of truth that has to be kept in step with the first, and the code that keeps them in step is where the bug will be.",
        "The symptom is always the same: a number that is one step behind. That is not a race or a timing problem — it is the update that recalculated the derived value running against the previous snapshot, exactly as lesson 2 described.",
        "Calculating during render costs a function call per render, which is nothing. If profiling ever shows it is genuinely expensive, `useMemo` caches it — and module 9 argues that is far rarer than people assume.",
      ],
      examples: [
        {
          id: "derived-vs-stored",
          title: "The total that lags, and the total that cannot",
          lang: "tsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

function Cart() {
  const [items, setItems] = useState([{ price: 10 }, { price: 5 }]);

  // Stored: a second source of truth, updated by hand.
  const [storedTotal, setStoredTotal] = useState(15);

  // Derived: recalculated from the items every render. Cannot be stale.
  const derivedTotal = items.reduce((sum, i) => sum + i.price, 0);

  function addItem() {
    setItems([...items, { price: 7 }]);
    // Computed from \`items\`, which is this render's snapshot — already old.
    setStoredTotal(items.reduce((sum, i) => sum + i.price, 0) + 7);
  }

  return (
    <>
      <span id="v">stored={storedTotal} derived={derivedTotal}</span>
      <button id="b" onClick={addItem}>add</button>
    </>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
const show = (label) => console.log(label, container.querySelector("#v").textContent);

act(() => { root.render(<Cart />); });
show("initial:      ");
act(() => { container.querySelector("#b").click(); });
show("after one add:");
act(() => { container.querySelector("#b").click(); });
show("after two adds:");`,
          output: `initial:       stored=15 derived=15
after one add: stored=22 derived=22
after two adds: stored=29 derived=29`,
          explanation:
            "Here the two agree — because the handler was written carefully, recomputing from `items` and adding the new price by hand. That is the point: the stored version is only correct for as long as every future edit remembers to do this. Add a remove button, a discount, or a quantity field and one of them will forget. The derived version cannot be forgotten, because there is nothing to remember.",
        },
      ],
      pitfalls: [
        {
          title: "The exception is state seeded from a prop, which is not derived at all",
          body: "A draft being edited genuinely is state, even though it started as a copy of a prop — the whole point is that it diverges. What makes it work is deciding when it resets, and the answer is a `key`, not an effect. The test is whether the value should track the source: if yes, derive it; if it should be allowed to diverge, it is state.",
        },
      ],
    },
    {
      id: "contradictions",
      heading: "Make impossible states impossible",
      body: [
        "Three booleans — `isLoading`, `isError`, `isSuccess` — describe eight combinations, of which perhaps three are real. The other five are reachable by any handler that forgets to reset one of them, and produce a spinner on top of an error message.",
        "One value with a union of states — `\"idle\" | \"loading\" | \"error\" | \"success\"` — has exactly four, all of them real. Moving to the next state is one assignment, so nothing can be forgotten.",
        "This is the same argument module 3 made for discriminated unions in props, applied to state: the best bug is the one the shape does not permit.",
      ],
      examples: [
        {
          id: "status-union",
          title: "Four flags, or one status",
          lang: "tsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

function Panel() {
  // One value, four possible states, no combinations.
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  function fail() {
    setStatus("error");
    setError("Network unreachable");
  }
  function succeed() {
    setStatus("success");
    setError(null);
  }

  return (
    <>
      <span id="v">
        {status === "loading" && "Loading…"}
        {status === "error" && \`Failed: \${error}\`}
        {status === "success" && "Done"}
        {status === "idle" && "Ready"}
      </span>
      <button id="load" onClick={() => setStatus("loading")}>load</button>
      <button id="fail" onClick={fail}>fail</button>
      <button id="ok" onClick={succeed}>ok</button>
    </>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
const show = (label) => console.log(label, container.querySelector("#v").textContent);

act(() => { root.render(<Panel />); });
show("initial:");
act(() => { container.querySelector("#load").click(); });
show("loading:");
act(() => { container.querySelector("#fail").click(); });
show("failed: ");
act(() => { container.querySelector("#ok").click(); });
show("ok:     ");`,
          output: `initial: Ready
loading: Loading…
failed:  Failed: Network unreachable
ok:      Done`,
          explanation:
            "Each transition is a single assignment to `status`, so there is no combination of flags to keep consistent and no way to be loading and failed at once. `error` is still separate because it carries a message rather than a state — and it is set to `null` on success, which is the one bit of bookkeeping this shape still asks for. A discriminated union of the whole thing would remove even that.",
        },
      ],
    },
    {
      id: "duplication",
      heading: "Do not keep two copies of the same thing",
      body: [
        "Storing `selectedItem` as a whole object alongside the `items` array means the same data exists twice. Edit an item in the list and the selected copy still holds the old version.",
        "Store the **id** and look the item up during render: `const selected = items.find(i => i.id === selectedId)`. One source of truth, no synchronisation, and a lookup that costs nothing at realistic list sizes.",
        "The same applies to anything mirroring a prop into state, and to derived collections — a `filteredItems` state alongside `items` and `query` will drift the moment either changes without the filter re-running.",
      ],
    },
    {
      id: "grouping",
      heading: "Group what changes together, split what does not",
      body: [
        "Two coordinates that always move together — a cursor position, a viewport size — belong in one object: `{ x, y }`. Setting them separately makes a render where one has moved and the other has not possible.",
        "Values that change independently belong in separate `useState` calls. Lesson 5 established that this costs nothing in renders, so the only consideration is which shape describes the data honestly.",
        "The test is whether you can imagine setting one without the other. If you cannot, they are one thing.",
      ],
    },
    {
      id: "nesting",
      heading: "Keep it flat",
      body: [
        "Deeply nested state is painful to update — every level on the path has to be copied — and the pain scales with depth in a way that produces mistakes.",
        "The usual cause is storing an API response verbatim. The shape a server returns is designed for transport, not for the operations a screen performs on it.",
        "The fix is to flatten: store items keyed by id, and reference them by id from wherever they are used. An update then touches one level. This is the same normalisation a relational database does, for the same reason, and it is what state libraries like Redux Toolkit build in.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you decide whether something belongs in state?",
      answer:
        "Ask whether it can be calculated from props and existing state. If it can, calculate it during render rather than storing it — a total, a filtered list, a validity flag, a full name. Storing a derived value creates a second source of truth that must be kept in step by hand, and the classic symptom is a number one step behind, caused by the update recomputing from the previous snapshot.",
    },
    {
      question: "What is wrong with `isLoading`, `isError` and `isSuccess` as three booleans?",
      answer:
        "They describe eight combinations when only three or four are real, so states like loading-and-failed are reachable whenever a handler forgets to reset a flag. A single `status` with a union of the valid values has exactly the states that exist, and each transition is one assignment, so nothing can be left inconsistent. It is the same argument as using a discriminated union for props.",
    },
    {
      question: "Why store a selected item's id rather than the item?",
      answer:
        "Because the object would be a second copy of data that already lives in the list, so editing the item leaves the selected copy stale. Storing the id and looking the item up during render keeps one source of truth and removes the synchronisation entirely. The lookup is negligible at any realistic list size.",
    },
  ],
  takeaways: [
    "If it can be calculated from props and state, calculate it — a derived value cannot go stale",
    "The one-step-behind number is always a stored derived value, not a race",
    "Replace combinations of booleans with a single status, so impossible states cannot be represented",
    "Store an id, not a copy of an object that already lives somewhere else",
    "Group values that always change together; splitting the rest costs no extra renders",
    "Flatten nested state rather than writing longer chains of spreads",
  ],
  status: "available",
};
