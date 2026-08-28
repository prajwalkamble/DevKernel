/**
 * State architecture, computed: how far a prop travels, where it has to live,
 * and what a subscription model costs.
 *
 * Each generator runs the thing it is about. `drillingDepth` walks a real
 * tree and counts the components that have to declare a prop they never read.
 * `stateLocation` computes a real lowest common ancestor. `contextVsStore`
 * runs both notification models against the same update and counts the
 * components each one wakes. The numbers are results.
 */
import { Recorder, type Role, type SequenceFrame, type TreeFrame, type TreeNode, type Visualisation } from "./types";

/* A component tree, as a plain structure the generators can walk. */
interface Node {
  id: string;
  children?: Node[];
}

const TREE: Node = {
  id: "App",
  children: [
    { id: "Header", children: [{ id: "Nav" }, { id: "UserMenu" }] },
    {
      id: "Main",
      children: [
        { id: "Sidebar", children: [{ id: "Filters" }] },
        { id: "Content", children: [{ id: "IssueList", children: [{ id: "IssueRow" }] }] },
      ],
    },
    { id: "Footer" },
  ],
};

function pathTo(node: Node, id: string, trail: string[] = []): string[] | null {
  const here = [...trail, node.id];
  if (node.id === id) return here;
  for (const child of node.children ?? []) {
    const found = pathTo(child, id, here);
    if (found) return found;
  }
  return null;
}

/** Depth, and an x that centres a parent over its children. */
function layoutTree(root: Node, role: (id: string) => Role | undefined, badge: (id: string) => string | undefined): TreeNode[] {
  const out: TreeNode[] = [];
  let slot = 0;
  const walk = (n: Node, depth: number, parent?: string): number => {
    const kids = n.children ?? [];
    if (kids.length === 0) {
      const x = slot++;
      out.push({ id: n.id, label: n.id, depth, x, parent, role: role(n.id), badge: badge(n.id) });
      return x;
    }
    const xs = kids.map((c) => walk(c, depth + 1, n.id));
    const x = (xs[0]! + xs[xs.length - 1]!) / 2;
    out.push({ id: n.id, label: n.id, depth, x, parent, role: role(n.id), badge: badge(n.id) });
    return x;
  };
  walk(root, 0);
  return out;
}

/* -------------------------------------------- 1. how far a prop travels -- */

/**
 * The components between an owner and a consumer, counted.
 *
 * The "passes it through untouched" set is the path minus its two ends, which
 * is computed from the tree rather than asserted — so a shallower tree would
 * visibly have less of a problem, which is the point the lesson makes about
 * when drilling is fine.
 */
function drillingDepth(): Visualisation {
  const rec = new Recorder<TreeFrame>();

  const owner = "App";
  const consumer = "IssueRow";
  const path = pathTo(TREE, consumer)!;
  const middle = path.slice(1, -1);

  const emit = (role: (id: string) => Role | undefined, badge: (id: string) => string | undefined, note: string) =>
    rec.push({ kind: "tree", nodes: layoutTree(TREE, role, badge), note });

  emit(() => undefined, () => undefined, `Nine components. \`${owner}\` holds the current user; \`${consumer}\` needs it to show an avatar. Nothing between them uses it.`);

  emit(
    (id) => (id === owner ? "active" : id === consumer ? "found" : undefined),
    () => undefined,
    `The two ends of the problem: one owner, one consumer, ${path.length - 2} components in between.`,
  );

  /* Walk the path, marking each forwarder as the prop passes through it. */
  const carrying: string[] = [];
  for (const id of middle) {
    carrying.push(id);
    rec.bump("components that must declare it");
    emit(
      (n) => (n === owner ? "active" : n === consumer ? "found" : carrying.includes(n) ? "updated" : undefined),
      (n) => (carrying.includes(n) ? "user" : undefined),
      `\`${id}\` has to declare \`user\` in its props, accept it, and pass it on — while never reading it. That is ${carrying.length} component${carrying.length === 1 ? "" : "s"} so far whose signature is now about somebody else's data.`,
    );
  }

  emit(
    (n) => (middle.includes(n) ? "updated" : n === owner ? "active" : n === consumer ? "found" : undefined),
    (n) => (middle.includes(n) || n === consumer ? "user" : undefined),
    `${middle.length} components changed to deliver one value to one component. The cost is not the typing — it is that ${middle.length} unrelated components now have a reason to re-render, and ${middle.length} signatures now describe data they do not use.`,
  );

  emit(
    (n) => (n === owner ? "active" : n === consumer ? "found" : "discarded"),
    (n) => (n === owner || n === consumer ? "user" : undefined),
    `Context removes the middle: the provider is at \`${owner}\`, the read is at \`${consumer}\`, and the ${middle.length} in between go back to not knowing. That is the trade — one indirection you cannot see in a signature, against ${middle.length} signatures that were lying about what they need.`,
  );

  emit(
    (n) => (n === "Content" || n === "IssueList" ? "updated" : undefined),
    () => undefined,
    "And the reason not to reach for it immediately: two levels is not a problem. Passing a prop through one or two components is easier to read than a provider, because the path is visible in the code. The threshold is roughly three, and the better signal is whether the middle components are being changed for reasons that have nothing to do with them.",
  );

  return {
    frames: rec.frames,
    summary:
      "Prop drilling costs one declaration per component between the owner and the consumer, and each of those components now has a signature describing data it never reads and a reason to re-render when that data changes. Context removes the middle entirely at the price of an indirection that no signature shows. Neither is free, and the depth decides: one or two hops are clearer as props, because the path is visible; by three or four the middle components are being edited for reasons that have nothing to do with them, which is the real signal rather than the count.",
  };
}

/* ------------------------------------------- 2. where the state must live -- */

/**
 * The lowest common ancestor of everything that touches a piece of state.
 *
 * Computed from the real tree by comparing root paths, so "put it here" is
 * the answer the algorithm returns — and adding a third consumer visibly
 * moves it, which is the thing worth seeing.
 */
function stateLocation(): Visualisation {
  const rec = new Recorder<TreeFrame>();

  const lca = (ids: string[]): string => {
    const paths = ids.map((id) => pathTo(TREE, id)!);
    let i = 0;
    while (paths.every((p) => p[i] !== undefined && p[i] === paths[0]![i])) i++;
    return paths[0]![i - 1]!;
  };

  const emit = (consumers: string[], note: string) => {
    const home = consumers.length ? lca(consumers) : null;
    rec.push({
      kind: "tree",
      nodes: layoutTree(
        TREE,
        (id) => (consumers.includes(id) ? "found" : id === home ? "active" : undefined),
        (id) => (id === home ? "state lives here" : consumers.includes(id) ? "uses it" : undefined),
      ),
      note,
    });
    return home;
  };

  emit([], "The rule is one line: state belongs at the lowest common ancestor of everything that reads or writes it. That is a computation, not a judgement — here it is, run three times.");

  const one = emit(["Filters"], "One consumer. The lowest common ancestor of a single component is that component, so the state is local — and local state is the default you should have to be argued out of.");

  const two = emit(["Filters", "IssueList"], `Now the list needs it too. The ancestor of both is \`${lca(["Filters", "IssueList"])}\`, so it moves up exactly that far — not to the root, and not into a store.`);

  const three = emit(["Filters", "IssueList", "UserMenu"], `And a third consumer in the header. The ancestor is now \`${lca(["Filters", "IssueList", "UserMenu"])}\`, which is the root — and *this* is the case where a provider or a store starts to pay, because the alternative is drilling from the top.`);

  rec.push({
    kind: "tree",
    nodes: layoutTree(
      TREE,
      (id) => (id === one ? "unchanged" : id === two ? "updated" : id === three ? "active" : undefined),
      (id) => (id === one ? "1 consumer" : id === two ? "2 consumers" : id === three ? "3 consumers" : undefined),
    ),
    note: `Three answers — \`${one}\`, \`${two}\`, \`${three}\` — from the same rule applied to three sets of consumers. The mistake the rule prevents is the common one: putting state at the root because it might be needed there one day, which makes every unrelated component re-render for it and hides who actually depends on it.`,
  });

  return {
    frames: rec.frames,
    summary:
      "State belongs at the lowest common ancestor of every component that reads or writes it — a computation over the tree rather than a matter of taste. One consumer means local state. Two means lifting exactly as far as their shared parent, and no further. Only when the consumers are spread far enough apart that the ancestor is the root does a provider or a store start to earn its place. Putting state higher than the rule requires costs re-renders in components that do not care and hides who actually depends on it, which is the thing that makes state hard to move later.",
  };
}

/* ---------------------------------- 3. context against a store, counted -- */

/**
 * Two notification models, run against the same update.
 *
 * Both are implemented: context wakes every consumer of the value, a store
 * wakes a subscriber only when its selector's result changes. The counts are
 * what each model actually did, so the store's advantage is a measurement of
 * the selectors rather than a claim about the library.
 */
function contextVsStore(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  interface State {
    theme: string;
    user: string;
    unread: number;
  }
  let state: State = { theme: "dark", user: "ada", unread: 3 };

  /* Five components, each interested in one slice. */
  const subscribers: { id: string; select: (s: State) => unknown; last: unknown }[] = [
    { id: "ThemeToggle", select: (s) => s.theme, last: null },
    { id: "Avatar", select: (s) => s.user, last: null },
    { id: "Badge", select: (s) => s.unread, last: null },
    { id: "Title", select: (s) => s.user, last: null },
    { id: "Panel", select: (s) => s.theme, last: null },
  ];
  for (const sub of subscribers) sub.last = sub.select(state);

  const emit = (rendered: string[], label: string, note: string) =>
    rec.push({
      kind: "sequence",
      items: [
        { id: "u", label, role: "active" },
        ...subscribers.map((s) => ({
          id: s.id,
          label: s.id,
          role: rendered.includes(s.id) ? ("updated" as Role) : ("unchanged" as Role),
        })),
        { id: "n", label: `${rendered.length} re-rendered`, role: rendered.length > 1 ? "discarded" : "found" },
      ],
      note,
    });

  emit([], "no update yet", "Five components read from one shared object. Two want the theme, two want the user, one wants the unread count.");

  /* --- context: a new value object wakes every consumer --- */
  const update: Partial<State> = { unread: 4 };
  state = { ...state, ...update };
  const contextWoken = subscribers.map((s) => s.id);
  rec.bump("context re-renders", contextWoken.length);
  emit(contextWoken, "unread: 3 → 4", `With context, the provider's value is one object. Changing any field builds a new object, \`Object.is\` says it differs, and **every** \`useContext\` consumer re-renders — all ${contextWoken.length}, including the four that do not read \`unread\` at all.`);

  /* --- a store: each subscriber's selector decides --- */
  const storeWoken: string[] = [];
  for (const sub of subscribers) {
    const next = sub.select(state);
    if (!Object.is(next, sub.last)) {
      storeWoken.push(sub.id);
      sub.last = next;
    }
  }
  rec.bump("store re-renders", storeWoken.length);
  emit(storeWoken, "unread: 3 → 4", `With a store, each component subscribed with a selector. The store runs every selector and compares the result: ${storeWoken.length} of ${subscribers.length} changed, so ${storeWoken.length} re-render${storeWoken.length === 1 ? "s" : ""}. That is the entire difference between the two — not speed, but who gets told.`);

  /* --- splitting the context is the middle path --- */
  const split = subscribers.filter((s) => s.id === "Badge").map((s) => s.id);
  emit(split, "unread: 4 → 5, with three providers", `And the middle path, which needs no library: split the one context into three — theme, user, unread — so a change to one wakes only its own consumers. ${split.length} re-render, the same as the store, at the cost of three providers instead of one.`);

  rec.push({
    kind: "sequence",
    items: [
      { id: "a", label: "one context: 5 of 5", role: "discarded" },
      { id: "b", label: "split contexts: 1 of 5", role: "found" },
      { id: "c", label: "store with selectors: 1 of 5", role: "found" },
    ],
    note: "So the reason to reach for a store is not that context is slow — it is what happens when the slices multiply. Three contexts is fine; eleven nested providers is a wrapper nobody wants to read, and a selector is the same idea without the nesting. Reach for the store when splitting stops being readable, not before.",
  });

  return {
    frames: rec.frames,
    summary:
      "A context provider hands down one value, so changing any part of it re-renders every consumer — even the ones reading a field that did not change. A store hands each subscriber a selector and re-renders it only when that selector's result changes, which is why one field changing wakes one component instead of five. Splitting the context by update rate gets the same result with no library at all, and is the right first move. The store earns its place when the number of slices makes the provider nesting unreadable, which is a question about your tree rather than about performance.",
  };
}

/* ------------------------------------------------------------- table -- */

export const REACT_ARCH_ALGOS = {
  "drilling-depth": {
    label: "How far a prop has to travel",
    run: drillingDepth,
  },
  "state-location": {
    label: "The lowest common ancestor",
    run: stateLocation,
  },
  "context-vs-store": {
    label: "Context, split contexts, and a store",
    run: contextVsStore,
  },
} as const;

export type ReactArchName = keyof typeof REACT_ARCH_ALGOS;
