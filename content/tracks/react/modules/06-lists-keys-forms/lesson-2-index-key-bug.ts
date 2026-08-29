import type { Lesson } from "@/content/types";

export const indexKeyBugLesson: Lesson = {
  id: "react-index-key-bug",
  slug: "the-index-key-bug",
  moduleSlug: "lists-keys-forms",
  title: "The Index-as-Key Bug, Demonstrated",
  summary:
    "Module 2 explained why `key={i}` is a false claim about identity. This runs it: one list, one typed character, one row added at the front, and text that ends up beside the wrong person.",
  estimatedMinutes: 25,
  objectives: [
    "Watch state attach to the wrong row, rather than being told it can",
    "Say which state is lost, including the parts that are not `useState`",
    "Identify the three list operations that trigger it",
    "State the one case where the index is genuinely correct",
    "Diagnose the bug from its symptoms",
  ],
  sections: [
    {
      id: "the-demonstration",
      heading: "The demonstration",
      body: [
        "Two identical lists. Each row shows a name and has a text box beside it. Something is typed into the box next to Ada, and then a new person is added at the front.",
        "The only difference between the two runs is `key={i}` against `key={row.id}`.",
      ],
      examples: [
        {
          id: "state-follows-the-key",
          title: "Where the typed text ends up",
          lang: "jsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

const START = [{ id: "a", name: "Ada" }, { id: "g", name: "Grace" }];

function List({ byIndex }) {
  const [rows, setRows] = useState(START);
  return (
    <div>
      <button id="add" onClick={() => setRows((r) => [{ id: "l", name: "Alan" }, ...r])}>
        add
      </button>
      <ul>
        {rows.map((row, i) => (
          <li key={byIndex ? i : row.id}>
            <span>{row.name}</span>
            {/* Uncontrolled: the text is DOM state, owned by this node. */}
            <input defaultValue="" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function run(byIndex) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => { root.render(<List byIndex={byIndex} />); });

  // Type into the first row, which is Ada's.
  container.querySelectorAll("input")[0].value = "typed for Ada";

  const read = () =>
    [...container.querySelectorAll("li")]
      .map((li) => \`\${li.querySelector("span").textContent}="\${li.querySelector("input").value}"\`)
      .join("  ");

  console.log(byIndex ? "index keys, before:" : "id keys,    before:", read());
  act(() => { container.querySelector("#add").click(); });
  console.log(byIndex ? "index keys, after: " : "id keys,    after: ", read());
}

run(true);
run(false);`,
          output: `index keys, before: Ada="typed for Ada"  Grace=""
index keys, after:  Alan="typed for Ada"  Ada=""  Grace=""
id keys,    before: Ada="typed for Ada"  Grace=""
id keys,    after:  Alan=""  Ada="typed for Ada"  Grace=""`,
          explanation:
            "Read the second line. The text typed for Ada is now sitting next to **Alan**, and Ada's box is empty. Nothing errored, nothing warned, and the list looks perfectly correct until you notice whose text that is. The fourth line is the same operation keyed by id: the text stayed with Ada, and Alan arrived with an empty box.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

type Row = { id: string; name: string };

const START: Row[] = [{ id: "a", name: "Ada" }, { id: "g", name: "Grace" }];

function List({ byIndex }: { byIndex: boolean }) {
  const [rows, setRows] = useState<Row[]>(START);
  return (
    <div>
      <button id="add" onClick={() => setRows((r) => [{ id: "l", name: "Alan" }, ...r])}>
        add
      </button>
      <ul>
        {rows.map((row, i) => (
          <li key={byIndex ? i : row.id}>
            <span>{row.name}</span>
            {/* Uncontrolled: the text is DOM state, owned by this node. */}
            <input defaultValue="" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function run(byIndex: boolean) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => { root.render(<List byIndex={byIndex} />); });

  // \`querySelectorAll<T>\` is the typed form; without it these are Elements
  // and neither \`.value\` nor \`.textContent\` narrowing is available.
  container.querySelectorAll("input")[0].value = "typed for Ada";

  const read = () =>
    [...container.querySelectorAll("li")]
      .map((li) => \`\${li.querySelector("span")!.textContent}="\${li.querySelector("input")!.value}"\`)
      .join("  ");

  console.log(byIndex ? "index keys, before:" : "id keys,    before:", read());
  act(() => { container.querySelector<HTMLButtonElement>("#add")!.click(); });
  console.log(byIndex ? "index keys, after: " : "id keys,    after: ", read());
}

run(true);
run(false);`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "The name was right and the state was wrong",
          body: "The names re-rendered correctly in both runs, because they come from props and props are re-read every render. Only the state stayed behind. That mismatch is what makes this so hard to spot in review: the visible content is right, and the invisible content belongs to somebody else.",
        },
      ],
    },
    {
      id: "what-is-lost",
      heading: "What counts as state here",
      body: [
        "More than `useState`. Everything React preserves by keeping a DOM node alive belongs to the row it was matched to.",
        "**Uncontrolled input values**, as above — the text lives in the DOM node.",
        "**Focus and the text cursor.** If the user was typing, the caret stays at the position, not with the item.",
        "**Scroll position** of anything scrollable in the row.",
        "**CSS transition and animation state**, so a row mid-fade continues fading in the wrong place.",
        "**Component state and refs** in any child of the row, at any depth.",
        "**Media playback.** A `<video>` reused for a different item keeps playing from where it was.",
        "The unifying description: the index-as-key bug does not lose data, it *reattaches* it. Everything is still there, next to the wrong thing.",
      ],
    },
    {
      id: "when-it-triggers",
      heading: "The three operations that trigger it",
      body: [
        "**Inserting anywhere but the end.** Every item after the insertion point shifts index, so every one of them changes identity at once.",
        "**Removing anywhere but the end.** The same, in reverse — and the case people meet first, because deleting the first row visibly moves state up.",
        "**Reordering.** Sorting, drag and drop, or a filter change. Every moved item swaps identity with whatever now occupies its position.",
        "Appending to the end is the one operation that is safe, because no existing item's index changes. That is exactly why the bug survives so long in a codebase: a list that is only ever appended to works perfectly, until the day somebody adds a sort.",
      ],
    },
    {
      id: "when-index-is-fine",
      heading: "When the index is genuinely correct",
      body: [
        "All three conditions have to hold, and it is worth being able to state them rather than following a superstition.",
        "**The list is never reordered, filtered, or inserted into except at the end.**",
        "**The items have no state of their own** — no inputs, no local state, nothing focusable that matters.",
        "**The items have no natural id**, because if they have one you would use it and the question would not arise.",
        "A static list of strings rendered as `<li>`s meets all three, and `key={i}` there is correct and costs nothing. Since a list rarely stays that way, `key={tag}` for a list of unique strings is a better habit — it costs the same and survives the day somebody sorts it.",
      ],
    },
    {
      id: "diagnosing",
      heading: "Recognising it from the symptoms",
      body: [
        "There is no error message, so the bug is identified by its shape. Four symptoms, all of them the same cause:",
        "\"The checkbox is ticked against the wrong row after I sort.\"",
        "\"Deleting one item clears what I typed into the one below it.\"",
        "\"My inline editor closes as soon as I type.\" — a variant with a *content-derived* key, where editing changes the key and remounts the row.",
        "\"The wrong row is highlighted after the list refreshes.\"",
        "In every case, look at the key before looking anywhere else. If it is an index, that is the whole explanation; if it is derived from editable content, that is the same bug from the other direction.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Show what actually goes wrong with `key={i}`.",
      answer:
        "Take a list where each row has a text input, type into the first row, then add an item at the front. Keyed by index, `key=0` used to mean the first person and now means the new one, so React reuses that row's DOM node and the typed text appears next to the new person while the original's box is empty. The names are all correct, because they come from props; only the state stayed behind. Keyed by a stable id, the text follows the person it belonged to.",
    },
    {
      question: "Which list operations make an index key dangerous?",
      answer:
        "Inserting anywhere but the end, removing anywhere but the end, and reordering — each of which changes the index of existing items. Appending is safe, because no existing item's index moves, which is exactly why the bug hides: an append-only list works perfectly until somebody adds a sort or a filter.",
    },
    {
      question: "Is `key={i}` ever acceptable?",
      answer:
        "When all three hold: the list is never reordered, filtered or inserted into except at the end; the items hold no state, focus or DOM state of their own; and there is no natural id available. A static list of strings qualifies. Since lists rarely stay static, keying by the value itself for unique primitives costs the same and survives the change.",
    },
  ],
  takeaways: [
    "Keyed by index, text typed for one row appears beside another after an insertion",
    "The names stay correct because they come from props — only state is reattached",
    "State here includes uncontrolled inputs, focus, caret, scroll, animations, refs and media playback",
    "Insertion, removal and reordering all trigger it; appending is the one safe operation",
    "The index is correct only when the list is append-only, stateless, and has no natural id",
    "There is no error — diagnose it from \"the wrong row has my data\" and check the key first",
  ],
  status: "available",
};
