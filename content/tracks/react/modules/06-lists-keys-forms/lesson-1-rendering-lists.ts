import type { Lesson } from "@/content/types";

export const renderingListsLesson: Lesson = {
  id: "react-rendering-lists",
  slug: "rendering-lists",
  moduleSlug: "lists-keys-forms",
  title: "Rendering Arrays, and Where a Key Comes From",
  summary:
    "Module 2 established what a key does to reconciliation. This is the practical half: where to find a stable one, what to do when the data has none, and the cases — nested lists, fragments, filtered views — where the obvious answer is wrong.",
  estimatedMinutes: 30,
  objectives: [
    "Render a collection and put the key on the right element",
    "Find a stable key in data that appears not to have one",
    "Build a composite key for a grid or a grouped list",
    "Key a nested list correctly, and say why the inner keys need no prefix",
    "Generate an id at the right moment when the data truly has none",
  ],
  sections: [
    {
      id: "where-it-goes",
      heading: "Where the key goes, restated",
      body: [
        "On the element the `.map()` callback returns. Not on something inside it, and not on the container.",
        "The rule survives refactoring because it is about position among siblings: extract the row into a `<Row>` component and the key moves to the `<Row>`, because that is now what the callback returns.",
        "When a row needs to be several sibling elements — table cells, description-list pairs — the callback returns a `<Fragment>` and the key goes there, which is the one case the `<>` shorthand cannot serve.",
      ],
      examples: [
        {
          id: "key-placement",
          title: "Three shapes, one rule",
          lang: "jsx",
          code: `import { Fragment } from "react";

const people = [
  { id: "a", name: "Ada", role: "Analyst" },
  { id: "g", name: "Grace", role: "Admiral" },
];

// 1. Inline: the key is on the <li> the callback returns.
function Inline() {
  return <ul>{people.map((p) => <li key={p.id}>{p.name}</li>)}</ul>;
}

// 2. Extracted: the key moved with the element the callback returns.
function Row({ person }) {
  return <li>{person.name}</li>;   // no key here — this is an only child
}
function Extracted() {
  return <ul>{people.map((p) => <Row key={p.id} person={p} />)}</ul>;
}

// 3. Several siblings per item: a keyed Fragment, which <> cannot be.
function Paired() {
  return (
    <dl>
      {people.map((p) => (
        <Fragment key={p.id}>
          <dt>{p.name}</dt>
          <dd>{p.role}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

function App() {
  return <div><Inline /><Extracted /><Paired /></div>;
}`,
          output: `<div><ul><li>Ada</li><li>Grace</li></ul><ul><li>Ada</li><li>Grace</li></ul><dl><dt>Ada</dt><dd>Analyst</dd><dt>Grace</dt><dd>Admiral</dd></dl></div>`,
          explanation:
            "No key appears in the output — they are consumed by the reconciler and never reach the DOM. Note the `<li>` inside `Row` has no key and needs none: it is an only child of that component, not a member of a dynamic list.",
          alternates: [
            {
              lang: "tsx",
              code: `import { Fragment } from "react";

type Person = { id: string; name: string; role: string };

const people: Person[] = [
  { id: "a", name: "Ada", role: "Analyst" },
  { id: "g", name: "Grace", role: "Admiral" },
];

// 1. Inline: the key is on the <li> the callback returns.
function Inline() {
  return <ul>{people.map((p) => <li key={p.id}>{p.name}</li>)}</ul>;
}

// 2. Extracted: the key moved with the element the callback returns. Note the
// prop type has no \`key\` in it — \`key\` is never a prop, so it is not part of
// the component's signature.
function Row({ person }: { person: Person }) {
  return <li>{person.name}</li>;   // no key here — this is an only child
}
function Extracted() {
  return <ul>{people.map((p) => <Row key={p.id} person={p} />)}</ul>;
}

// 3. Several siblings per item: a keyed Fragment, which <> cannot be.
function Paired() {
  return (
    <dl>
      {people.map((p) => (
        <Fragment key={p.id}>
          <dt>{p.name}</dt>
          <dd>{p.role}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

function App() {
  return <div><Inline /><Extracted /><Paired /></div>;
}`,
            },
          ],
        },
      ],
    },
    {
      id: "finding-one",
      heading: "Finding a stable key",
      body: [
        "**A database id.** Always the answer when it exists. Stable across reorders, filters and reloads.",
        "**A natural key.** An email, an ISO country code, an ISBN, a slug. Good when it is genuinely unique in the list and does not change — a username that can be edited is not one.",
        "**A composite.** For a grid, `` `${row}-${col}` ``. For a grouped list, the group id plus the item id. Cheap and stable, and better than the index whenever the structure can change.",
        "**The value itself,** for a list of unique primitives: `items.map(tag => <li key={tag}>)`. Fine while duplicates are impossible, and a duplicate-key warning the moment they are not.",
        "Keys only need to be unique **among siblings**, so two different lists may both use `key=\"a\"`, and a nested list's keys never need the outer item's id mixed in.",
      ],
      examples: [
        {
          id: "composite-and-nested",
          title: "A grid, and a list inside a list",
          lang: "jsx",
          code: `const grid = [["a", "b"], ["c", "d"]];

const teams = [
  { id: "t1", name: "Alpha", members: [{ id: "m1", name: "Ada" }, { id: "m2", name: "Grace" }] },
  { id: "t2", name: "Beta", members: [{ id: "m1", name: "Alan" }] },
];

function Grid() {
  return (
    <table>
      <tbody>
        {grid.map((row, r) => (
          // The row index is a fine key here: this grid is never reordered.
          <tr key={r}>
            {row.map((cell, c) => <td key={\`\${r}-\${c}\`}>{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Teams() {
  return (
    <ul>
      {teams.map((team) => (
        <li key={team.id}>
          {team.name}
          <ul>
            {/* Only unique among siblings — so m1 appearing in both teams is fine. */}
            {team.members.map((m) => <li key={m.id}>{m.name}</li>)}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function App() {
  return <div><Grid /><Teams /></div>;
}`,
          output: `<div><table><tbody><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></tbody></table><ul><li>Alpha<ul><li>Ada</li><li>Grace</li></ul></li><li>Beta<ul><li>Alan</li></ul></li></ul></div>`,
          explanation:
            "`m1` is used as a key in both teams and nothing complains, because sibling scope is all React checks. Prefixing inner keys with the team id — `` `${team.id}-${m.id}` `` — is a common habit that adds noise and buys nothing, since the two lists are never compared with each other.",
          alternates: [
            {
              lang: "tsx",
              code: `type Member = { id: string; name: string };
type Team = { id: string; name: string; members: Member[] };

const grid: string[][] = [["a", "b"], ["c", "d"]];

const teams: Team[] = [
  { id: "t1", name: "Alpha", members: [{ id: "m1", name: "Ada" }, { id: "m2", name: "Grace" }] },
  { id: "t2", name: "Beta", members: [{ id: "m1", name: "Alan" }] },
];

function Grid() {
  return (
    <table>
      <tbody>
        {grid.map((row, r) => (
          // The row index is a fine key here: this grid is never reordered.
          // A key may be a string or a number, and neither is checked for
          // uniqueness — that part is on you in both languages.
          <tr key={r}>
            {row.map((cell, c) => <td key={\`\${r}-\${c}\`}>{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Teams() {
  return (
    <ul>
      {teams.map((team) => (
        <li key={team.id}>
          {team.name}
          <ul>
            {/* Only unique among siblings — so m1 appearing in both teams is fine. */}
            {team.members.map((m) => <li key={m.id}>{m.name}</li>)}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function App() {
  return <div><Grid /><Teams /></div>;
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "A key that changes when the row is edited is not stable",
          body: "Using a mutable field — a name, a title, an email that can be corrected — means editing it changes the key, so React unmounts the row and mounts a new one. Any state inside it is destroyed and focus is lost, which for an inline-editable list means the input closes as soon as you type into it. Keys must come from identity, not content.",
        },
      ],
    },
    {
      id: "no-id",
      heading: "When the data really has no id",
      body: [
        "Generate one **when the item is created**, not while rendering. `crypto.randomUUID()` at the point a row is added to state, stored alongside the data, gives a key that is as stable as the item itself.",
        "Generating during render — `key={crypto.randomUUID()}` or `key={Math.random()}` — is worse than using the index. Every item gets a new identity on every render, so React unmounts and rebuilds the entire list every time the parent renders, losing all state and doing the maximum possible DOM work.",
        "For data arriving from an API without ids, the same rule applies one level up: assign ids as the response is normalised into state, once, rather than deriving them at render time.",
        "`useId` is **not** for this. It produces one id per component instance for accessibility attributes, not one per list item.",
      ],
    },
    {
      id: "filtering",
      heading: "Filtered and sorted views",
      body: [
        "Derive the view during render and key by the item's own id: `items.filter(...).map(item => <Row key={item.id} />)`. Because the key travels with the item, React moves the surviving rows rather than rebuilding them, and a row that keeps its state through a filter change is what makes an inline editor usable.",
        "This is also the argument against storing a filtered copy in state. Two arrays holding the same objects can drift, and module 4 covered why derived data belongs in render.",
        "The index is at its most dangerous here: filtering renumbers everything after the removed item, so every row below a deletion shifts identity at once.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Where does the key go when a list row is extracted into its own component?",
      answer:
        "On the component element the `.map()` callback returns — `<Row key={item.id} …/>` — not on the markup inside `Row`. The rule is about position among siblings in a dynamic list, so it always attaches to whatever the callback produces. An element inside the component is an only child there and needs no key.",
    },
    {
      question: "Do keys have to be globally unique?",
      answer:
        "No, only unique among siblings. Two separate lists may use the same key values without conflict, and a nested list's keys do not need the outer item's id mixed in — React only ever compares children against the previous children of the same parent. Prefixing inner keys with an outer id is a common habit that adds noise without buying anything.",
    },
    {
      question: "The data has no id. What do you use as a key?",
      answer:
        "Generate one when the item is created and store it with the data — `crypto.randomUUID()` at the point it enters state, or ids assigned once as an API response is normalised. What you must not do is generate one during render: a new identity every render makes React unmount and rebuild the whole list on every parent render, losing all state, which is worse than the index. The index itself is acceptable only for a list that is never reordered, filtered or inserted into except at the end.",
    },
  ],
  takeaways: [
    "The key belongs on whatever the `.map()` callback returns, including a `Fragment` for multi-element rows",
    "Prefer a database id; a natural key works when it is unique and cannot be edited",
    "Keys need only be unique among siblings, so nested lists need no prefixing",
    "A key taken from editable content unmounts the row when the content is edited",
    "Generate ids when items are created, never during render",
    "Filtered and sorted views key by the item's id, which is what lets rows keep their state",
  ],
  status: "available",
};
