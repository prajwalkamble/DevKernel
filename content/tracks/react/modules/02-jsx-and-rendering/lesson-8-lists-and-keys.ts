import type { Lesson } from "@/content/types";

export const listsAndKeysLesson: Lesson = {
  id: "react-lists-and-keys",
  slug: "lists-and-keys",
  moduleSlug: "jsx-and-rendering",
  title: "Rendering Lists, and What a Key Actually Does",
  summary:
    "Keys are not a warning to silence. They are how React tells which item is which between two renders, and the index-as-key bug is what happens when you tell it wrongly — demonstrated rather than asserted.",
  estimatedMinutes: 30,
  objectives: [
    "Render a collection with `.map()` and put the key in the right place",
    "Explain what React does with a key, and what it does not",
    "Predict the exact damage the index-as-key bug causes, and when it is harmless",
    "Choose a key that is stable, unique among siblings, and derived from the data",
    "Use a key deliberately to reset a component",
  ],
  sections: [
    {
      id: "mapping",
      heading: "A list is an expression, so it is `.map()`",
      body: [
        "There is no loop syntax in JSX, because braces take an expression and a `for` loop is a statement. `.map()` is the expression form: it turns an array of data into an array of elements, and React renders arrays by rendering each item in order.",
        "The key goes on **the outermost element the map returns**, not on something inside it. That is the element occupying a position among siblings, and position among siblings is the only thing keys are about.",
      ],
      examples: [
        {
          id: "map-basics",
          title: "Where the key goes, and where it does not",
          lang: "jsx",
          code: `const people = [
  { id: "a", name: "Ada", role: "Analyst" },
  { id: "g", name: "Grace", role: "Rear admiral" },
];

function Directory() {
  return (
    <ul>
      {people.map((person) => (
        // The key belongs here — on the element returned by the callback.
        <li key={person.id}>
          {/* Not here. These are not siblings in a dynamic list. */}
          <strong>{person.name}</strong>
          <span>{person.role}</span>
        </li>
      ))}
    </ul>
  );
}`,
          output: `<ul><li><strong>Ada</strong><span>Analyst</span></li><li><strong>Grace</strong><span>Rear admiral</span></li></ul>`,
          explanation:
            "Note what is absent from the output: the keys. A key is never rendered and never reaches the DOM. It is a message from you to React's reconciler, consumed entirely during the diff — which is also why a component cannot read its own key as a prop.",
          alternates: [
            {
              lang: "tsx",
              code: `type Person = { id: string; name: string; role: string };

const people: Person[] = [
  { id: "a", name: "Ada", role: "Analyst" },
  { id: "g", name: "Grace", role: "Rear admiral" },
];

function Directory() {
  return (
    <ul>
      {people.map((person) => (
        // The key belongs here — on the element returned by the callback.
        <li key={person.id}>
          {/* Not here. These are not siblings in a dynamic list. */}
          <strong>{person.name}</strong>
          <span>{person.role}</span>
        </li>
      ))}
    </ul>
  );
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Extracting the row into a component moves the key with it",
          body: "When you refactor to `{people.map((p) => <Row key={p.id} person={p} />)}`, the key stays on the element the map returns — now the `<Row>` — and not on the `<li>` inside `Row`. The rule is the same rule, applied to whatever the callback returns. Putting the key on the `<li>` inside the component silences nothing, because that `<li>` is an only child there and was never in a dynamic list.",
        },
      ],
    },
    {
      id: "what-a-key-does",
      heading: "What a key actually does",
      body: [
        "Between two renders, React has an old list of children and a new one, and it has to decide which new child *is* which old child. Without keys, it answers by position: the first is the first, the second is the second. With keys, it answers by key, wherever the item moved to.",
        "That decision determines whether a DOM node is reused or rebuilt, and — far more importantly — whether the **state inside it** survives. An input's text, a checkbox's checkedness, a component's `useState`, the scroll position of a container, which element has focus: all of that belongs to the instance React decides to keep.",
        "So a key is an identity claim. `key={person.id}` says \"this row is that person, wherever it has moved to\". `key={i}` says \"this row is the row that was in this position\", which is a claim about the position and not about the data — and when the data moves, that claim is false.",
      ],
      visual: {
        id: "keys-visual",
        kind: "react-rendering",
        algorithm: "keys-by-index",
        title: "Adding a row to the front, keyed two different ways",
      },
    },
    {
      id: "the-bug",
      heading: "The index-as-key bug",
      body: [
        "Switch the picker above between the two runs and the whole bug is visible in the notes. Prepending one row to a list keyed by index makes `key=0` — which used to mean Ada — now mean Alan. React duly reuses that row and rewrites its contents. Every existing row shows somebody else's data, and anything living *in* a row stays behind at its old position.",
        "Keyed by id, the same operation is one mount and two moves. No row's contents are rewritten, because no row changed identity.",
        "The symptom is never an error. It is a checkbox ticked against the wrong name after a sort, text typed into a field appearing beside the wrong item after a delete, or a half-finished edit jumping rows when something is inserted above it. All of them look like state bugs somewhere else entirely.",
      ],
      examples: [
        {
          id: "index-key-identity",
          title: "The identity each key claims",
          lang: "jsx",
          code: `const before = [
  { id: "a", name: "Ada" },
  { id: "g", name: "Grace" },
];
const after = [{ id: "l", name: "Alan" }, ...before];

const show = (label, rows, keyOf) =>
  console.log(label, rows.map((r, i) => \`\${keyOf(r, i)}=\${r.name}\`).join("  "));

console.log("keyed by index — what each key means:");
show("  before:", before, (_, i) => i);
show("  after: ", after, (_, i) => i);

console.log("keyed by id — what each key means:");
show("  before:", before, (r) => r.id);
show("  after: ", after, (r) => r.id);`,
          output: `keyed by index — what each key means:
  before: 0=Ada  1=Grace
  after:  0=Alan  1=Ada  2=Grace
keyed by id — what each key means:
  before: a=Ada  g=Grace
  after:  l=Alan  a=Ada  g=Grace`,
          explanation:
            "Read the index rows against each other: `0` meant Ada and now means Alan; `1` meant Grace and now means Ada. React is not doing anything clever or stupid here — it is believing exactly what the key told it. The id rows say the same thing about each person before and after, which is why the rows can simply be moved.",
          alternates: [
            {
              lang: "tsx",
              code: `type Row = { id: string; name: string };

const before: Row[] = [
  { id: "a", name: "Ada" },
  { id: "g", name: "Grace" },
];
const after: Row[] = [{ id: "l", name: "Alan" }, ...before];

// \`keyOf\` is the interesting signature: a key may be derived from the row, or
// from its position, so it takes both and the two strategies share one type.
const show = (label: string, rows: Row[], keyOf: (row: Row, index: number) => string | number) =>
  console.log(label, rows.map((r, i) => \`\${keyOf(r, i)}=\${r.name}\`).join("  "));

console.log("keyed by index — what each key means:");
show("  before:", before, (_, i) => i);
show("  after: ", after, (_, i) => i);

console.log("keyed by id — what each key means:");
show("  before:", before, (r) => r.id);
show("  after: ", after, (r) => r.id);`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "The index is a perfectly good key when nothing can move",
          body: "For a list that is never reordered, filtered, sorted, or added to except at the end, and whose items hold no state, `key={i}` is correct and costs nothing — the position genuinely is the identity. The trouble is that lists acquire a sort or a filter later, and nothing fails loudly when they do. Use the index when you can state that the list is static, and reach for a real id the moment you cannot.",
        },
        {
          title: "`key={Math.random()}` is worse than no key at all",
          body: "It silences the warning by giving every item a new identity on every render, so React unmounts and rebuilds the entire list every time the parent renders — losing all state and doing the maximum possible DOM work. If your data has no id, derive a stable one when the data arrives, or fall back to the index and accept its limits knowingly.",
        },
      ],
    },
    {
      id: "choosing",
      heading: "Choosing a key",
      body: [
        "**Stable.** The same item gets the same key on every render. Not random, not the array index when the array can move, not something recomputed each time.",
        "**Unique among siblings.** Only among siblings — two different lists may both use `key=\"a\"` without any conflict, and nesting does not have to produce globally unique values.",
        "**Derived from the data.** A database id is ideal. A natural key such as an email or an ISBN works when it is genuinely unique. A composite — `` `${row}-${col}` `` — is fine for grids.",
        "When items genuinely have no identity of their own, generate one **when the item is created**, not during render: `crypto.randomUUID()` at the point the row is added to state, stored alongside the data. Generated in render, it changes every time and reproduces the `Math.random()` pitfall above.",
      ],
    },
    {
      id: "key-to-reset",
      heading: "Using a key on purpose, to reset a component",
      body: [
        "Everything above is about keys preserving identity. The same mechanism run deliberately in reverse is one of React's most useful small techniques: **change a component's key to throw its state away**.",
        "A profile editor showing user A, switched to user B, should not keep A's half-typed changes. Rather than an effect that watches `userId` and clears each field — which is a whole class of bug — give the component `key={userId}`. A different key at that position is a different identity, so React unmounts the old instance and mounts a fresh one with clean state.",
        "This is the honest version of \"resetting state when a prop changes\", and it replaces the effect that most people reach for first. Module 7 returns to it in the argument about effects you do not need.",
      ],
      examples: [
        {
          id: "key-resets",
          title: "One prop, two identities",
          lang: "jsx",
          code: `function Editor({ user }) {
  // Local state seeded from the prop — the classic thing that goes stale.
  return <input defaultValue={user.name} />;
}

function App() {
  const ada = { id: "a", name: "Ada" };
  const grace = { id: "g", name: "Grace" };

  return (
    <>
      {/* Same position, different key: React mounts a fresh Editor. */}
      <Editor key={ada.id} user={ada} />
      <Editor key={grace.id} user={grace} />
    </>
  );
}`,
          output: `<input value="Ada"/><input value="Grace"/>`,
          explanation:
            "Rendered side by side the keys look decorative. The point is what happens when the *same* position switches from one user to the other: with `key={user.id}` React sees a new identity and builds a new `Editor` with fresh state, so nothing of the previous user survives. Without the key it would see the same `Editor` at the same position, keep the instance, and `defaultValue` — used only on the first render — would never be reapplied.",
          alternates: [
            {
              lang: "tsx",
              code: `type User = { id: string; name: string };

function Editor({ user }: { user: User }) {
  // Local state seeded from the prop — the classic thing that goes stale.
  return <input defaultValue={user.name} />;
}

function App() {
  const ada: User = { id: "a", name: "Ada" };
  const grace: User = { id: "g", name: "Grace" };

  return (
    <>
      {/* Same position, different key: React mounts a fresh Editor. */}
      <Editor key={ada.id} user={ada} />
      <Editor key={grace.id} user={grace} />
    </>
  );
}`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does React use keys for?",
      answer:
        "To decide which child in the new list corresponds to which child in the old one. Without keys it matches by position; with keys it matches by key wherever the item has moved. That decision determines whether a DOM node and the component state inside it are preserved or thrown away. Keys are consumed entirely by the reconciler — they are never rendered, never reach the DOM, and cannot be read by the component as a prop.",
    },
    {
      question: "What exactly goes wrong when you use the array index as a key?",
      answer:
        "The key claims the item's identity is its position. Insert or remove anywhere but the end, or sort, and that claim becomes false: the key that meant the first item now means a different item. React reuses each existing DOM node and rewrites its contents, so anything living in a row — an input's text, a checkbox, a component's own state, focus — stays behind at the old position while the data moves. Nothing errors; the symptom is state attached to the wrong row. It is safe only when the list is never reordered and its rows hold no state.",
    },
    {
      question: "How would you reset a component's state when a prop changes?",
      answer:
        "Give it a `key` derived from that prop. A different key at the same position is a different identity, so React unmounts the old instance and mounts a fresh one with clean state. This replaces the common alternative — an effect watching the prop and clearing each piece of state by hand — which has to be kept in step with every field that is ever added.",
    },
  ],
  takeaways: [
    "`.map()` is the expression form of a loop, and the key goes on the element the callback returns",
    "A key is an identity claim between renders; it is never rendered and never reaches the DOM",
    "The identity decides whether the DOM node and the state inside it survive — inputs, focus, scroll, `useState`",
    "`key={i}` claims the identity is the position, which becomes false the moment the list reorders",
    "Keys need only be unique among siblings, and must be stable and derived from the data",
    "Changing a key on purpose is the clean way to reset a component's state when its subject changes",
  ],
  status: "available",
};
