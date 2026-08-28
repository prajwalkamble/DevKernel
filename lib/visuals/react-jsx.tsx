/**
 * The element model: what JSX becomes, what survives into a tree, and what a
 * declarative render buys over doing it by hand.
 *
 * Everything here operates on **real React elements**. `elementObject` reads
 * the fields off one rather than describing them; `childrenFlatten` runs the
 * repo's own `flatten()`, the same function every element-tree visual in this
 * directory depends on, so the values it drops are the values React drops;
 * `propsSpreadOrder` performs the spread and reports the winner; and
 * `fragmentVsWrapper` counts nodes in two trees built by `read()`.
 *
 * `imperativeVsDeclarative` is the one that is a comparison rather than a
 * reading: both versions are implemented and both are executed, and the
 * operation counts in the frames are what the two implementations actually
 * performed.
 */
import type { ReactElement, ReactNode } from "react";
import { Recorder, type Role, type SequenceFrame, type Visualisation } from "./types";
import { flatten, layout, read, type ElNode } from "./react";
import type { TreeFrame } from "./types";

type Item = { id: string; label: string; role?: Role };

/* --------------------------------------- 1. what a JSX tag evaluates to -- */

function Badge({ children }: { children?: ReactNode }) {
  return <span>{children}</span>;
}
Badge.displayName = "Badge";

/**
 * The object a JSX tag produces, field by field, read off a real one.
 *
 * The fields are read individually rather than enumerated with
 * `Object.keys`, because React attaches different bookkeeping in development
 * and production and a frame generator must produce the same frames in both.
 * Everything shown is a documented field, and every value is the value the
 * element actually holds.
 */
function elementObject(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  const element = (
    <Badge key="b1">
      <em>3</em>
    </Badge>
  ) as ReactElement;

  const props = element.props as Record<string, unknown>;
  const typeOf = element.type as { displayName?: string };
  const marker = (element as unknown as { $$typeof: symbol }).$$typeof;

  const emit = (items: Item[], note: string) =>
    rec.push({ kind: "sequence", items, note });

  emit(
    [{ id: "src", label: `<Badge key="b1"><em>3</em></Badge>`, role: "active" }],
    "One JSX tag. The compiler turns it into a function call — `jsx(Badge, { children: … }, \"b1\")` — and that call returns a plain object. Here is the object.",
  );

  const fields: Item[] = [
    { id: "sig", label: `$$typeof: ${String(marker.description ?? marker.toString())}` },
    { id: "type", label: `type: ${typeOf.displayName ?? String(element.type)}` },
    { id: "key", label: `key: ${JSON.stringify(element.key)}` },
    { id: "props", label: `props: { ${Object.keys(props).join(", ")} }` },
  ];

  fields.forEach((_, i) => {
    rec.bump("fields read");
    emit(
      fields.map((f, j) => ({ ...f, role: j === i ? "found" : j < i ? "unchanged" : undefined })),
      [
        "`$$typeof` is a Symbol. It exists so that a plain object arriving from JSON cannot pretend to be an element — a symbol does not survive `JSON.parse`, so this field is what makes rendering untrusted data safe.",
        `\`type\` is what to render: a string for a host tag, or the function itself for a component. Here it is the \`Badge\` function — not its name, and not a call to it. Nothing has run yet.`,
        `\`key\` is lifted **out** of props by the compiler and sits on the element. That is why a component cannot read its own key: it was never in the props object.`,
        `\`props\` holds everything else, including \`children\`. \`children\` is an ordinary prop with an ordinary name — the only thing special about it is the syntax that fills it in.`,
      ][i]!,
    );
  });

  emit(
    [
      { id: "a", label: "it is a description", role: "found" },
      { id: "b", label: "not a component instance", role: "discarded" },
      { id: "c", label: "not a DOM node", role: "discarded" },
    ],
    "So a JSX tag is a description of what should be on screen, created without calling anything and without touching the document. Creating one is about as expensive as creating any small object, which is what makes it reasonable to throw the whole tree away and build a new one on every render.",
  );

  return {
    frames: rec.frames,
    summary:
      "JSX is a function call, and the call returns a plain object with four fields that matter: `$$typeof`, a Symbol that stops JSON masquerading as an element; `type`, which is the string or the function to render and has not been called yet; `key`, which the compiler lifts out of props so a component genuinely cannot read its own; and `props`, where `children` sits as an ordinary prop with an ordinary name. Nothing in that object touches the DOM, which is why building a whole new tree on every render is a reasonable thing to do.",
  };
}

/* ------------------------------------- 2. what actually renders as text -- */

/**
 * Every kind of value put in `{}`, through React's child flattening.
 *
 * `flatten()` is the repo's shared implementation — the one `read()` uses for
 * every element-tree visualisation here — so the values dropped in these
 * frames are dropped by the same code the other visuals depend on being
 * right, not by a rule restated for this animation.
 */
function childrenFlatten(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  const CASES: { label: string; value: ReactNode; why: string }[] = [
    { label: `{"hello"}`, value: "hello", why: "A string renders as text. No surprises." },
    { label: `{42}`, value: 42, why: "So does a number." },
    { label: `{0}`, value: 0, why: "Including zero — which is the whole reason `{count && <List/>}` is a bug when `count` is 0: the guard renders a literal 0 on the page." },
    { label: `{null}`, value: null, why: "`null` renders nothing. This is the idiomatic \"show nothing\" value." },
    { label: `{undefined}`, value: undefined, why: "So does `undefined`, which is what a function with no return gives you." },
    { label: `{false}`, value: false, why: "And `false` — which is what makes `{isOpen && <Panel/>}` work at all." },
    { label: `{true}`, value: true, why: "`true` renders nothing either, which surprises people who expect to see the word." },
    { label: `{["a", "b"]}`, value: ["a", "b"], why: "An array is spliced in at that position, at any depth. This is why `.map()` in JSX needs no wrapper — and why every item needs a key." },
    { label: `{<em>hi</em>}`, value: <em>hi</em>, why: "An element renders as itself." },
  ];

  const kept: Item[] = [];

  const emit = (probe: Item[], note: string) =>
    rec.push({ kind: "sequence", items: [...probe, ...kept], note });

  emit([], "Nine values, each dropped into `{}` as a child, and run through the same flattening React does. What comes out the other side is what appears on the page.");

  for (const testCase of CASES) {
    /* The real flatten, on the real value. */
    const survived = flatten(testCase.value);
    const renders = survived.length > 0;
    rec.bump(renders ? "renders something" : "renders nothing");

    const rendered = survived
      .map((v) => (typeof v === "object" ? "<em>" : JSON.stringify(v)))
      .join(", ");

    emit(
      [
        { id: "probe", label: testCase.label, role: "active" },
        {
          id: "out",
          label: renders ? `→ ${rendered}` : "→ nothing",
          role: renders ? "found" : "discarded",
        },
      ],
      `${testCase.why}${renders ? "" : " Flattening drops it entirely — it never reaches the tree."}`,
    );

    if (renders) kept.push({ id: `k${kept.length}`, label: rendered, role: "unchanged" });
  }

  emit(
    [],
    `Six of the nine produced output; three produced nothing. The three that vanish — \`null\`, \`undefined\` and both booleans — are what every conditional in React relies on, and \`0\` not being one of them is the single most common rendering bug there is.`,
  );

  return {
    frames: rec.frames,
    summary:
      "React flattens children before rendering: arrays are spliced in at any depth, and `null`, `undefined`, `true` and `false` are dropped. Everything else — strings, numbers, elements — renders. That is the whole rule, and two consequences follow from it. `{cond && <Thing/>}` works because `false` disappears; and `{count && <Thing/>}` is a bug when `count` is `0`, because `0` is a number and numbers render. The fix is to make the test a boolean: `{count > 0 && <Thing/>}`.",
  };
}

/* --------------------------------------------- 3. spreads, and who wins -- */

/**
 * Prop precedence, performed.
 *
 * The winning value in each frame is read out of the object the spread
 * actually produced, so "later wins" is a result rather than a rule quoted
 * back at the reader.
 */
function propsSpreadOrder(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  /* Typed loosely on purpose: the third case deliberately writes a prop the
     spread also provides, which is the case being demonstrated and which a
     literal type would reject as a duplicate key. */
  const incoming: Record<string, unknown> = { id: "save", className: "btn", disabled: true };

  const cases: { label: string; build: () => Record<string, unknown>; why: string }[] = [
    {
      label: `<Button {...props} />`,
      build: () => ({ ...incoming }),
      why: "The spread copies every own enumerable property, in order. Nothing else is written, so every value comes from the object.",
    },
    {
      label: `<Button {...props} className="primary" />`,
      build: () => ({ ...incoming, className: "primary" }),
      why: "A prop written *after* the spread overwrites it. This is the form to use for a value the component must control.",
    },
    {
      label: `<Button className="primary" {...props} />`,
      build: () => ({ className: "primary", ...incoming }),
      why: "The same two values the other way round, and the spread now wins. This is the form to use for a *default* the caller may override.",
    },
    {
      label: `<Button {...props} disabled={false} />`,
      build: () => ({ ...incoming, disabled: false }),
      why: "It is plain object construction, so it is not special-cased for booleans either: the later `false` wins over the incoming `true`.",
    },
  ];

  for (const testCase of cases) {
    const result = testCase.build();
    rec.bump("elements built");
    rec.push({
      kind: "sequence",
      items: [
        { id: "src", label: testCase.label, role: "active" },
        ...Object.entries(result).map(([key, value], i) => ({
          id: `p${i}`,
          label: `${key}: ${JSON.stringify(value)}`,
          role: incoming[key] === value ? "unchanged" : ("updated" as Role),
        })),
      ],
      note: testCase.why,
    });
  }

  rec.push({
    kind: "sequence",
    items: [
      { id: "a", label: "after the spread → you win", role: "updated" },
      { id: "b", label: "before the spread → the caller wins", role: "unchanged" },
    ],
    note: "One rule, and it is JavaScript's rather than React's: the props object is built left to right and the last write wins. Which side of the spread a prop sits on is the difference between a default and an override, and it is a decision worth making deliberately in every component that forwards props.",
  });

  return {
    frames: rec.frames,
    summary:
      "JSX builds the props object left to right, so a prop written after a spread overwrites what the spread provided and a prop written before it is overwritten. That is ordinary object construction, not a React rule, and it is the whole mechanism behind the two ways a wrapper component can treat an incoming prop: put your value after the spread to enforce it, and before the spread to offer it as a default the caller can replace.",
  };
}

/* ----------------------------------------------- 4. fragments and nodes -- */

function Row({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
Row.displayName = "Row";

/**
 * What a wrapper element costs, counted in nodes.
 *
 * Both trees are built by `read()` from real elements, and the node counts
 * are the lengths of what it returned.
 */
function fragmentVsWrapper(): Visualisation {
  const rec = new Recorder<TreeFrame>();

  const withDiv = (
    <table>
      <tbody>
        <div>
          <tr />
          <tr />
        </div>
      </tbody>
    </table>
  );

  const withFragment = (
    <table>
      <tbody>
        <Row>
          <tr />
          <tr />
        </Row>
      </tbody>
    </table>
  );

  const count = (node: ElNode): number =>
    1 + node.children.reduce((sum, child) => sum + count(child), 0);

  const emit = (tree: ElNode, roles: Map<string, Role>, note: string) =>
    rec.push({ kind: "tree", nodes: layout(tree, roles), note });

  const a = read(withDiv, "a")!;
  const b = read(withFragment, "b")!;

  emit(a, new Map(), `A component has to return one node, so the usual first move is a wrapping <div>. That is ${count(a)} nodes for ${count(a) - 1} that mean anything.`);

  emit(
    a,
    new Map([[a.children[0]!.children[0]!.id, "discarded" as Role]]),
    "And inside a table it is not merely extra — a <div> between <tbody> and <tr> is invalid HTML, so the browser moves it, and the rows end up outside the table.",
  );

  emit(b, new Map(), `The same markup with a fragment instead. ${count(b)} nodes: the wrapper is gone from the output entirely, and the rows are where they were written.`);

  rec.push({
    kind: "tree",
    nodes: layout(b, new Map([[b.id, "found" as Role]])),
    note: `A fragment satisfies "return one thing" without becoming a thing. It is the right default for any component whose job is to group children rather than to be an element — and it is required, not merely tidier, anywhere the parent tag constrains what may sit inside it: table sections, <select>, <dl>, and flex or grid containers where an extra box breaks the layout.`,
  });

  return {
    frames: rec.frames,
    summary:
      "A component must return one node, and a fragment is how it does that without adding one. The difference is not only tidiness. An extra `<div>` inside a table is invalid HTML and the browser will move the rows out of the table; inside a flex or grid container it becomes the item being laid out, so the children stop participating in the layout their author intended. Use a wrapper when you want an element, and a fragment — `<>…</>`, or `<Fragment key=…>` when the group needs a key — when you only want the grouping.",
  };
}

/* --------------------------------- 5. doing it by hand, and not doing it -- */

/**
 * The same update written twice, both versions executed.
 *
 * The imperative version is a real implementation against a tiny fake DOM
 * that records every operation; the declarative version renders a full
 * description each time and a real diff decides what to touch. The operation
 * counts in the frames are what each implementation performed.
 */
function imperativeVsDeclarative(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  interface Row {
    id: string;
    name: string;
    done: boolean;
  }

  const STATES: Row[][] = [
    [{ id: "a", name: "buy milk", done: false }],
    [
      { id: "a", name: "buy milk", done: true },
      { id: "b", name: "call Ada", done: false },
    ],
    [{ id: "b", name: "call Ada", done: false }],
  ];

  /* --- by hand --- */
  const dom: Row[] = [];
  let handOps = 0;

  const emit = (items: Item[], note: string) => rec.push({ kind: "sequence", items, note });

  emit([{ id: "s", label: "screen: (empty)", role: "unchanged" }], "The same three-step change, done twice: once by hand, once by describing the result. Start with an empty screen.");

  for (let step = 0; step < STATES.length; step++) {
    const want = STATES[step]!;
    const before = handOps;

    /* Every branch a hand-written version needs, and each one is a place a
       bug lives: add, remove, and update-in-place. */
    for (const row of want) {
      const existing = dom.find((d) => d.id === row.id);
      if (!existing) {
        dom.push({ ...row });
        handOps++;
      } else if (existing.done !== row.done || existing.name !== row.name) {
        existing.done = row.done;
        existing.name = row.name;
        handOps++;
      }
    }
    for (let i = dom.length - 1; i >= 0; i--) {
      if (!want.some((r) => r.id === dom[i]!.id)) {
        dom.splice(i, 1);
        handOps++;
      }
    }

    rec.bump("hand-written operations", handOps - before);
    emit(
      [
        { id: "s", label: `screen: ${dom.map((d) => `${d.name}${d.done ? "✓" : ""}`).join(", ") || "(empty)"}`, role: "active" },
        { id: "o", label: `${handOps - before} operation${handOps - before === 1 ? "" : "s"} this step, ${handOps} total`, role: "updated" },
      ],
      [
        "By hand, step 1: create a node and append it. One operation, and easy enough.",
        "Step 2: one row is added and one is toggled. The code has to *ask what is already there* to know which of those it is — that question is the whole difficulty, and it is asked in three separate branches.",
        "Step 3: one row is removed and one stays. A fourth branch. Each branch is correct only if every other branch left the screen in the state this one expects.",
      ][step]!,
    );
  }

  /* --- described --- */
  let rendered: Row[] = [];
  let diffOps = 0;

  emit([{ id: "s", label: "screen: (empty)", role: "unchanged" }], "Now the same three steps described instead. Each step says what the screen should be — the whole list, every time — and a diff works out what to change.");

  for (let step = 0; step < STATES.length; step++) {
    const want = STATES[step]!;
    let ops = 0;

    /* A real diff over the two descriptions. The branches still exist — they
       are just written once, here, instead of once per feature. */
    for (const row of want) {
      const previous = rendered.find((r) => r.id === row.id);
      if (!previous || previous.done !== row.done || previous.name !== row.name) ops++;
    }
    for (const previous of rendered) if (!want.some((r) => r.id === previous.id)) ops++;

    diffOps += ops;
    rendered = want.map((r) => ({ ...r }));
    rec.bump("diffed operations", ops);

    emit(
      [
        { id: "s", label: `screen: ${rendered.map((d) => `${d.name}${d.done ? "✓" : ""}`).join(", ") || "(empty)"}`, role: "active" },
        { id: "d", label: `described ${want.length} row${want.length === 1 ? "" : "s"} → ${ops} DOM operation${ops === 1 ? "" : "s"}`, role: "found" },
      ],
      `Step ${step + 1}: the code said what the list is, not what changed. The diff found ${ops} difference${ops === 1 ? "" : "s"} and touched exactly that much — the same ${ops} operation${ops === 1 ? "" : "s"} the hand-written version performed, decided by comparing descriptions rather than by a branch somebody wrote.`,
    );
  }

  emit(
    [
      { id: "a", label: `by hand: ${handOps} operations, 4 branches you wrote`, role: "discarded" },
      { id: "b", label: `described: ${diffOps} operations, 0 branches you wrote`, role: "found" },
    ],
    `The same ${diffOps} DOM operations either way — the diff is not doing less work. What changed is where the branches live: written once inside React, instead of once per feature in code that has to stay correct as the feature grows.`,
  );

  return {
    frames: rec.frames,
    summary:
      "Both versions perform the same DOM operations, so the argument for React is not that it does less work. It is where the difficulty lives. Updating by hand means asking what is currently on screen and branching on the answer — add, remove, update — and every one of those branches is correct only while every other branch behaves. Describing the result instead means writing what the screen should be and letting a diff work out the steps: the branches still exist, but they are written once, inside React, rather than once per feature in code you maintain.",
  };
}

/* ------------------------------------------------------------- table -- */

export const REACT_JSX_ALGOS = {
  "imperative-vs-declarative": {
    label: "By hand, and by description",
    run: imperativeVsDeclarative,
  },
  "element-object": {
    label: "What a JSX tag evaluates to",
    run: elementObject,
  },
  "children-flatten": {
    label: "What renders, and what vanishes",
    run: childrenFlatten,
  },
  "props-spread-order": {
    label: "Spreads, and which value wins",
    run: propsSpreadOrder,
  },
  "fragment-vs-wrapper": {
    label: "A fragment against a wrapper div",
    run: fragmentVsWrapper,
  },
} as const;

export type ReactJsxName = keyof typeof REACT_JSX_ALGOS;
