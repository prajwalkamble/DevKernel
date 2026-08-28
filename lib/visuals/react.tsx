/**
 * React's rendering model, animated by running it.
 *
 * The trees here are *real React element trees*, written as JSX and walked
 * through `props.children` — not a hand-drawn picture of what an element tree
 * looks like. The diff is an implementation of the reconciliation rules React
 * documents: an element of the same type is updated in place, an element of a
 * different type takes its whole subtree down with it, and children are matched
 * by `key` when they have one and by position when they do not.
 *
 * What this is not, and the lessons say so too: React's own fibre reconciler.
 * That is thousands of lines with a work loop, priority lanes and a double
 * buffer, and reproducing it would not make the animation more truthful — it
 * would make it harder to read while depicting the same three rules. The rules
 * are the thing being taught, and the rules are what runs.
 *
 * The payoff is the same as everywhere else in this directory: change the rules
 * and the animation changes with them, so it cannot quietly drift away from
 * what the prose claims.
 */
import type { ReactElement, ReactNode } from "react";
import {
  Recorder,
  type Role,
  type SequenceFrame,
  type TreeFrame,
  type TreeNode,
  type Visualisation,
} from "./types";

/* ------------------------------------------------ reading an element tree -- */

/*
 * The four helpers below are exported because the concurrent, server-rendering
 * and pattern visualisations in the sibling files walk the same real element
 * trees. A second copy of `read` would be a second definition of what an
 * element tree *is*, and the two would drift; one definition, imported, cannot.
 */

/** One node of the element tree, flattened out of React's own objects. */
export interface ElNode {
  id: string;
  /** The element's type, short enough to sit inside a node circle. */
  label: string;
  key: string | null;
  children: ElNode[];
}

/**
 * The name to draw inside a node circle.
 *
 * `displayName` first, and every component in this file sets one — because
 * `Function.prototype.name` is whatever the minifier decided, and these
 * animations key captions and lookups off the name. In a development build
 * `type.name` is the source name and everything works; in a production build
 * it is `a`, and a visualisation quietly loses its captions or, worse, a
 * lookup by name returns undefined. A string literal survives minification.
 */
export function typeName(element: ReactElement): string {
  const type = element.type;
  if (typeof type === "string") return type;
  if (typeof type === "function") {
    const named = type as { displayName?: string; name?: string };
    return named.displayName || named.name || "fn";
  }
  return "?";
}

/**
 * Children as a flat list, the way React sees them.
 *
 * Arrays are flattened at any depth and the values React renders as nothing are
 * dropped — the same set the lesson on expressions measures. Deliberately not
 * `Children.toArray`, which rewrites keys, and keys are the entire subject of
 * two of these visualisations.
 */
export function flatten(node: ReactNode, out: ReactNode[] = []): ReactNode[] {
  if (Array.isArray(node)) {
    for (const child of node) flatten(child, out);
    return out;
  }
  if (node === null || node === undefined || typeof node === "boolean") return out;
  out.push(node);
  return out;
}

/** Builds the node tree, ignoring text children — the shape is the subject. */
export function read(node: ReactNode, path: string): ElNode | null {
  if (typeof node !== "object" || node === null) return null;
  const element = node as ReactElement;
  const key = element.key === null ? null : String(element.key);
  const id = `${path}/${key ?? typeName(element)}`;
  const kids = flatten((element.props as { children?: ReactNode }).children);
  return {
    id,
    label: typeName(element),
    key,
    children: kids
      .map((child, i) => read(child, `${id}:${i}`))
      .filter((child): child is ElNode => child !== null),
  };
}

/* ------------------------------------------------------------- laying out -- */

/**
 * Depth for the row, and an x that centres a parent over its children.
 *
 * Leaves take consecutive slots; every other node sits at the midpoint of its
 * own, which is what stops the edges crossing.
 */
export function layout(
  root: ElNode,
  roles: Map<string, Role>,
  badges?: Map<string, string>
): TreeNode[] {
  const nodes: TreeNode[] = [];
  let slot = 0;

  const walk = (node: ElNode, depth: number, parent?: string): number => {
    if (node.children.length === 0) {
      const x = slot++;
      nodes.push({
        id: node.id, label: node.label, depth, x, parent,
        role: roles.get(node.id), badge: captionOf(node, badges),
      });
      return x;
    }
    const xs = node.children.map((child) => walk(child, depth + 1, node.id));
    const x = (xs[0] + xs[xs.length - 1]) / 2;
    nodes.push({
      id: node.id, label: node.label, depth, x, parent,
      role: roles.get(node.id), badge: captionOf(node, badges),
    });
    return x;
  };

  walk(root, 0);
  return nodes;
}

/** An explicit caption wins; otherwise a keyed node is captioned with its key. */
function captionOf(node: ElNode, badges?: Map<string, string>): string | undefined {
  const explicit = badges?.get(node.label);
  if (explicit !== undefined) return explicit;
  return node.key === null ? undefined : `key=${node.key}`;
}

/** Every node of a subtree, parent first — the order React renders in. */
export function descendants(node: ElNode, out: ElNode[] = []): ElNode[] {
  out.push(node);
  for (const child of node.children) descendants(child, out);
  return out;
}

/**
 * Every node of a subtree, children first.
 *
 * Two different things happen in this order, and neither is the reverse of the
 * render order. Elements are *created* innermost-first, because a parent's
 * children sit inside its own argument list and a call's arguments are
 * evaluated before the call — `jsx("div", { children: jsx("h1", {}) })` runs
 * `jsx("h1")` first. Effects then *run* innermost-first as well, so that a
 * parent's effect can assume its children are mounted.
 */
function postorder(node: ElNode, out: ElNode[] = []): ElNode[] {
  for (const child of node.children) postorder(child, out);
  out.push(node);
  return out;
}

/* ------------------------------------------------- the trees the demos use -- */

function Row({ children }: { children?: ReactNode }) {
  return <li>{children}</li>;
}
Row.displayName = "Row";

const PAGE = (
  <div>
    <h1 />
    <ul>
      <Row />
      <Row />
    </ul>
  </div>
);

/* ------------------------------------------------------- 1. element tree -- */

function elementTree(): Visualisation {
  const root = read(PAGE, "")!;
  const rec = new Recorder<TreeFrame>();
  const roles = new Map<string, Role>();
  const order = postorder(root);

  rec.push({
    kind: "tree",
    nodes: layout(root, roles),
    note: "The JSX above compiled to nested jsx() calls. Each one returns a plain object, and the innermost ones run first.",
  });

  for (const node of order) {
    roles.set(node.id, "active");
    rec.bump("elements");
    rec.push({
      kind: "tree",
      nodes: layout(root, roles),
      note: `jsx("${node.label}", …) returns an object with a type and a props. Its children already exist — they were arguments to this call.`,
    });
    roles.set(node.id, "unchanged");
  }

  rec.push({
    kind: "tree",
    nodes: layout(root, roles),
    note: `${order.length} elements exist and the page is still blank. Rendering them is a separate step.`,
  });

  return {
    frames: rec.frames,
    summary:
      "JSX is a description, not a drawing. Every node here is a frozen plain object with a type and a props — building the whole tree allocates objects and does nothing else.",
  };
}

/* ---------------------------------------------------- 2. render and commit -- */

function renderAndCommit(): Visualisation {
  const root = read(PAGE, "")!;
  const rec = new Recorder<TreeFrame>();
  const roles = new Map<string, Role>();
  const downwards = descendants(root);

  const emit = (note: string) =>
    rec.push({ kind: "tree", nodes: layout(root, roles), note });

  emit("Render phase. React walks down the tree calling components. Nothing is on screen yet.");

  for (const node of downwards) {
    roles.set(node.id, "active");
    rec.bump("rendered");
    emit(`Render <${node.label}>. A parent runs before its children, because its output is what says the children exist.`);
    roles.set(node.id, "updated");
  }

  emit("Render finished, and the screen has still not changed. Everything so far could be thrown away and redone.");

  for (const node of downwards) roles.set(node.id, "unchanged");
  emit("Commit phase. React applies the whole tree to the DOM in one pass that cannot be interrupted.");

  for (const node of postorder(root)) {
    roles.set(node.id, "mounted");
    rec.bump("committed");
    emit(`Commit <${node.label}>. Effects settle upward — a child is mounted before the parent that contains it.`);
  }

  emit("Render flows down the tree; commit-time work settles back up it.");

  return {
    frames: rec.frames,
    summary:
      "Two passes with different rules. Render calls components top-down and may be paused, restarted or discarded, so it must be pure. Commit applies the result in one uninterruptible pass, and effects run child before parent.",
  };
}

/* ------------------------------------------------------- 3. reconciliation -- */

const BEFORE = (
  <div>
    <h1 />
    <ul>
      <Row key="a" />
    </ul>
  </div>
);

const AFTER_SAME = (
  <div>
    <h1 />
    <ul>
      <Row key="a" />
      <Row key="b" />
    </ul>
  </div>
);

const AFTER_TYPE_CHANGED = (
  <div>
    <h1 />
    <section>
      <Row key="a" />
    </section>
  </div>
);

/**
 * The diff, as three rules.
 *
 * Roles are written onto the *new* tree, which is the one that survives. A node
 * the diff destroys is recorded in `torn` so the note can name it, since it has
 * no place in the tree being drawn.
 */
function diff(
  before: ElNode | undefined,
  after: ElNode | undefined,
  roles: Map<string, Role>,
  torn: string[],
  emit: (note: string) => void
) {
  if (!before && after) {
    for (const node of descendants(after)) roles.set(node.id, "mounted");
    emit(`<${after.label}> is new. React creates it and everything inside it.`);
    return;
  }
  if (before && !after) {
    torn.push(before.label);
    emit(`<${before.label}> is gone from the new tree. React unmounts it and its whole subtree.`);
    return;
  }
  if (!before || !after) return;

  if (before.label !== after.label) {
    torn.push(before.label);
    for (const node of descendants(after)) roles.set(node.id, "mounted");
    emit(
      `<${before.label}> became <${after.label}>. Different type, so the old subtree is destroyed — its DOM and all of its state — and the new one is built from nothing.`
    );
    return;
  }

  roles.set(after.id, "unchanged");
  emit(`<${after.label}> has the same type in both trees, so React keeps it and looks at its children.`);

  const matchedByKey = after.children.some((c) => c.key !== null)
    || before.children.some((c) => c.key !== null);
  if (after.children.length > 0 && matchedByKey) {
    emit(`Its children carry keys, so React matches them by key rather than by position.`);
  }

  if (matchedByKey) {
    const previous = new Map(before.children.filter((c) => c.key).map((c) => [c.key!, c]));
    for (const child of after.children) {
      diff(child.key ? previous.get(child.key) : undefined, child, roles, torn, emit);
    }
    for (const child of before.children) {
      if (child.key && !after.children.some((c) => c.key === child.key)) {
        diff(child, undefined, roles, torn, emit);
      }
    }
    return;
  }

  const width = Math.max(before.children.length, after.children.length);
  for (let i = 0; i < width; i++) {
    diff(before.children[i], after.children[i], roles, torn, emit);
  }
}

function reconcileRun(after: ReactNode, opening: string, summary: string): Visualisation {
  const oldTree = read(BEFORE, "")!;
  const newTree = read(after, "")!;
  const rec = new Recorder<TreeFrame>();
  const roles = new Map<string, Role>();
  const torn: string[] = [];

  const emit = (note: string) =>
    rec.push({ kind: "tree", nodes: layout(newTree, roles), note });

  emit(opening);
  diff(oldTree, newTree, roles, torn, emit);
  emit(
    torn.length
      ? `Done. ${torn.length === 1 ? "One subtree was" : `${torn.length} subtrees were`} destroyed: ${torn.map((t) => `<${t}>`).join(", ")}. Everything else kept its DOM node and its state.`
      : "Done. Every node found a match of the same type, so nothing was destroyed — the existing DOM nodes and their state were kept and only the new position was mounted."
  );

  return { frames: rec.frames, summary };
}

/* ------------------------------------------------------------- 4/5. keys -- */

interface RowData { id: string; name: string }

const START: RowData[] = [
  { id: "a", name: "Ada" },
  { id: "g", name: "Grace" },
];
const PREPENDED: RowData[] = [{ id: "l", name: "Alan" }, ...START];

/**
 * Prepending one row, matched by whichever key the list used.
 *
 * The two runs differ by one expression — `key={i}` against `key={row.id}` —
 * and the whole of the index-key bug falls out of that difference rather than
 * being asserted alongside it.
 */
function keysRun(byIndex: boolean): Visualisation {
  const keyOf = (row: RowData, i: number) => (byIndex ? String(i) : row.id);
  const rec = new Recorder<SequenceFrame>();

  const before = START.map((row, i) => ({ key: keyOf(row, i), row }));
  const after = PREPENDED.map((row, i) => ({ key: keyOf(row, i), row }));

  const emit = (
    items: { id: string; label: string; role?: Role }[],
    pins: Record<number, string>,
    note: string
  ) => rec.push({ kind: "sequence", items, pins, note });

  emit(
    before.map((e) => ({ id: e.key, label: e.row.name })),
    Object.fromEntries(before.map((e, i) => [i, `key=${e.key}`])),
    byIndex
      ? "Two rows, keyed by array index. Ada is at index 0, so her key is 0."
      : "The same two rows, keyed by a stable id from the data."
  );

  emit(
    after.map((e) => ({ id: `${e.key}-new`, label: e.row.name })),
    Object.fromEntries(after.map((e, i) => [i, `key=${e.key}`])),
    "Alan is added at the front. React now compares the new list with the old one, key by key."
  );

  const previous = new Map(before.map((e) => [e.key, e.row]));
  const roles: Role[] = [];
  let mounts = 0;
  let updates = 0;
  let reuses = 0;

  after.forEach((entry, i) => {
    const match = previous.get(entry.key);
    if (!match) {
      roles[i] = "mounted";
      mounts += 1;
      emit(
        after.map((e, j) => ({ id: `${e.key}-${j}`, label: e.row.name, role: roles[j] })),
        Object.fromEntries(after.map((e, j) => [j, `key=${e.key}`])),
        `key=${entry.key} is new, so React mounts a fresh row for ${entry.row.name}.`
      );
      return;
    }
    if (match.id !== entry.row.id) {
      roles[i] = "updated";
      updates += 1;
      emit(
        after.map((e, j) => ({ id: `${e.key}-${j}`, label: e.row.name, role: roles[j] })),
        Object.fromEntries(after.map((e, j) => [j, `key=${e.key}`])),
        `key=${entry.key} existed, so React reuses that row — but it held ${match.name} and now shows ${entry.row.name}. The DOM node stays; its contents are rewritten.`
      );
      return;
    }
    roles[i] = i === before.findIndex((e) => e.key === entry.key) ? "unchanged" : "moved";
    reuses += 1;
    emit(
      after.map((e, j) => ({ id: `${e.key}-${j}`, label: e.row.name, role: roles[j] })),
      Object.fromEntries(after.map((e, j) => [j, `key=${e.key}`])),
      `key=${entry.key} still means ${entry.row.name}. React moves the existing row instead of rebuilding it.`
    );
  });

  emit(
    after.map((e, j) => ({ id: `${e.key}-${j}`, label: e.row.name, role: roles[j] })),
    Object.fromEntries(after.map((e, j) => [j, `key=${e.key}`])),
    byIndex
      ? `${mounts} mounted, ${updates} rewritten. Every row that already existed now shows somebody else's data — so anything living in a row, a text cursor or a checkbox, stayed behind at the old position.`
      : `${mounts} mounted, ${reuses} moved, nothing rewritten. Each row kept the data it had, and everything inside it came along.`
  );

  return {
    frames: rec.frames,
    summary: byIndex
      ? "Keyed by index, adding to the front renames every row: key 0 used to mean Ada and now means Alan. React reuses each DOM node and rewrites its contents, so per-row state stays with the position rather than with the data."
      : "Keyed by a stable id, adding to the front is one mount and two moves. The key identifies the row across renders, so React moves each existing row and everything inside it comes along.",
  };
}

/* ------------------------------------------------- 6/7. one-way data flow -- */

/* Short type names throughout: a node circle has room for about five
   characters, and the caption underneath is carrying the values. */
function Bar({ children }: { children?: ReactNode }) {
  return <div>{children}</div>;
}
Bar.displayName = "Bar";
function Btn() {
  return <button type="button" />;
}
Btn.displayName = "Btn";
function Out() {
  return <output />;
}
Out.displayName = "Out";
function App({ children }: { children?: ReactNode }) {
  return <div>{children}</div>;
}
App.displayName = "App";

const PANEL = (
  <App>
    <Bar>
      <Btn />
    </Bar>
    <Out />
  </App>
);

/**
 * Props down, and what happens when a child wants to change something.
 *
 * The point the animation is built around is the one prose usually fudges:
 * nothing travels *up* the tree. The handler is the parent's own function,
 * handed down as a prop, and calling it runs the parent's code — which is why
 * "data down, events up" is a description of the shape rather than of a
 * mechanism.
 */
function propsDown(): Visualisation {
  const root = read(PANEL, "")!;
  const rec = new Recorder<TreeFrame>();
  const roles = new Map<string, Role>();
  const badges = new Map<string, string>();

  const emit = (note: string) =>
    rec.push({ kind: "tree", nodes: layout(root, roles, badges), note });

  badges.set("App", "count = 0");
  roles.set(root.id, "active");
  emit("The state lives in App. It is the only place this value exists.");

  const [bar, out] = root.children;
  const btn = bar.children[0];

  roles.set(root.id, "unchanged");
  roles.set(bar.id, "active");
  badges.set("Bar", "passes it on");
  emit("App renders, and hands values down as props. Bar is given the callback to forward.");

  roles.set(bar.id, "unchanged");
  roles.set(btn.id, "active");
  badges.set("Btn", "onClick");
  emit("Btn receives a function as a prop. It cannot see count and cannot change it.");

  roles.set(btn.id, "unchanged");
  roles.set(out.id, "active");
  badges.set("Out", "count = 0");
  emit("Out receives the value itself, to display. Data has reached every node that needs it.");

  roles.set(out.id, "unchanged");
  roles.set(btn.id, "active");
  emit("The user clicks Btn, so Btn calls the function it was given.");

  roles.set(btn.id, "unchanged");
  roles.set(root.id, "active");
  emit("Nothing travelled up the tree. That function was App's all along, so calling it runs App's code.");

  badges.set("App", "count = 1");
  roles.set(root.id, "updated");
  rec.bump("renders");
  emit("App sets its state, so React re-renders App and everything beneath it.");

  roles.set(bar.id, "updated");
  roles.set(btn.id, "updated");
  emit("The new props flow down exactly as before — there is no second mechanism for updates.");

  badges.set("Out", "count = 1");
  roles.set(out.id, "updated");
  emit("Out is given the new value and displays it. One direction, one round trip.");

  return {
    frames: rec.frames,
    summary:
      "Data flows one way: down, as props. A child that wants something to change is given a function to call, and calling it runs the owner's code — nothing propagates back up the tree. That is what makes the state's owner the single place to look when a value is wrong.",
  };
}

/* ------------------------------------------------------ 8. lifting state -- */

function Pane() {
  return <section />;
}
Pane.displayName = "Pane";

const SIBLINGS = (
  <App>
    <Pane key="left" />
    <Pane key="right" />
  </App>
);

/** Two siblings that each own a copy of the same state, and then do not. */
function liftingState(): Visualisation {
  const root = read(SIBLINGS, "")!;
  const [left, right] = root.children;
  const rec = new Recorder<TreeFrame>();
  const roles = new Map<string, Role>();

  /* Captioned by node id rather than by label here, since both siblings are
     the same component and must show different values. */
  const captions = new Map<string, string>();
  const nodes = () =>
    layout(root, roles).map((n) => ({ ...n, badge: captions.get(n.id) ?? n.badge }));
  const emit = (note: string) => rec.push({ kind: "tree", nodes: nodes(), note });

  captions.set(root.id, "no state");
  captions.set(left.id, "own count = 0");
  captions.set(right.id, "own count = 0");
  emit("Each pane keeps its own count. Two useState calls, two separate pieces of state.");

  captions.set(left.id, "own count = 1");
  roles.set(left.id, "updated");
  emit("The left pane increments. Nothing tells the right pane, because nothing connects them.");

  emit("They are out of step, and the captions say so: 1 against 0. No code inside either pane can fix that.");

  roles.clear();
  captions.set(root.id, "count = 0");
  captions.set(left.id, "reads a prop");
  captions.set(right.id, "reads a prop");
  roles.set(root.id, "active");
  emit("Lift it: delete both useState calls and put one in the nearest common parent.");

  roles.set(root.id, "unchanged");
  roles.set(left.id, "active");
  roles.set(right.id, "active");
  emit("Both panes now receive the same value as a prop, and a function to request a change.");

  captions.set(root.id, "count = 1");
  roles.set(root.id, "updated");
  roles.set(left.id, "updated");
  roles.set(right.id, "updated");
  rec.bump("renders");
  emit("The left pane calls the function. One state changed, so both panes re-render together.");

  return {
    frames: rec.frames,
    summary:
      "When two components need the same value, neither can own it. Move it to their nearest common parent and pass it down — the value then exists once, so the two cannot disagree. The cost is that the parent re-renders, and with it everything beneath.",
  };
}

/* --------------------------------------------------------- 9/10. the queue -- */

/**
 * What the setter queues, and what processing the queue produces.
 *
 * The two runs differ by exactly what the two lessons differ by: whether each
 * entry is a value computed from the render's `count`, or a function handed
 * the value the queue has reached. Running both through the same loop is what
 * makes "three calls, one increment" stop being a rule to memorise.
 */
function stateQueue(withUpdaters: boolean): Visualisation {
  const rec = new Recorder<SequenceFrame>();
  const start = 0;

  /* The handler's `count` is a constant for the whole handler — which is the
     entire reason the value form queues the same number three times. */
  const entries = [0, 1, 2].map(() =>
    withUpdaters
      ? { label: "c => c + 1", apply: (current: number) => current + 1 }
      : { label: `set ${start + 1}`, apply: () => start + 1 }
  );

  const emit = (
    items: { id: string; label: string; role?: Role }[],
    pins: Record<number, string>,
    note: string
  ) => rec.push({ kind: "sequence", items, pins, note });

  emit([], {}, `count is ${start}. The handler runs, and the queue is empty.`);

  const queued: { id: string; label: string; role?: Role }[] = [];
  entries.forEach((entry, i) => {
    queued.push({ id: `q${i}`, label: entry.label });
    rec.bump("queued");
    emit(
      queued.map((q) => ({ ...q })),
      {},
      withUpdaters
        ? `setCount(c => c + 1) queues a function. It has not run yet.`
        : `setCount(count + 1) queues a value. count is still ${start}, so the value is ${start + 1}.`
    );
  });

  emit(
    queued.map((q) => ({ ...q })),
    {},
    "The handler finishes. React now processes the queue in order."
  );

  let current = start;
  entries.forEach((entry, i) => {
    const before = current;
    current = entry.apply(current);
    rec.bump("applied");
    emit(
      queued.map((q, j) => ({
        ...q,
        role: j < i ? "unchanged" : j === i ? "active" : undefined,
      })),
      { [i]: `${before} → ${current}` },
      withUpdaters
        ? `Entry ${i + 1} is given ${before} and returns ${current}.`
        : `Entry ${i + 1} replaces the state with ${current}, whatever it was.`
    );
  });

  emit(
    queued.map((q) => ({ ...q, role: "unchanged" as Role })),
    {},
    withUpdaters
      ? `Three entries, three increments: count is ${current}. One re-render.`
      : `Three entries, all saying ${current}: count is ${current}. One re-render.`
  );

  return {
    frames: rec.frames,
    summary: withUpdaters
      ? "An updater is handed the value the queue has reached, so each one builds on the last. Three of them increment by three — and it is still a single re-render, because batching and what each entry knows are different questions."
      : "A value is computed from the render's own `count`, which does not change during the handler. Three calls therefore queue the same number three times, and applying them in order lands on that number once.",
  };
}

/* ------------------------------------------------------- 11. hook slots -- */

/**
 * How a hook call finds its stored value, and what a condition does to that.
 *
 * The list is the real mechanism — React matches calls to entries by order of
 * execution and by nothing else — so the animation runs that matching rather
 * than illustrating it. The third render skips a call, and every later call
 * reads the slot next door.
 */
function hookSlots(): Visualisation {
  const rec = new Recorder<SequenceFrame>();
  const stored = ["Ada", "Grace", "36"];
  const names = ["name", "middle", "age"];

  const emit = (
    items: { id: string; label: string; role?: Role }[],
    pins: Record<number, string>,
    note: string
  ) => rec.push({ kind: "sequence", items, pins, note });

  const slots = (roles: Record<number, Role> = {}) =>
    stored.map((value, i) => ({ id: `s${i}`, label: value, role: roles[i] }));

  emit(slots(), {}, "One list per component instance. Three hook calls claimed three slots on the first render.");

  /* A render that calls all three: each call takes the next slot, and every
     name lines up with the value it stored. */
  for (let call = 0; call < 3; call++) {
    rec.bump("reads");
    emit(
      slots({ [call]: "active" }),
      { [call]: names[call] },
      `Call ${call + 1} reads slot ${call} and gets "${stored[call]}". Correct.`
    );
  }

  emit(slots(), {}, "Next render, the middle call sits behind an `if` that is now false.");

  /* The same walk with the middle call skipped: the cursor still advances one
     slot per call, so the third call lands on the second slot. */
  const skipped = [0, 1];
  const askedFor = ["name", "age"];
  skipped.forEach((slot, i) => {
    const wrong = askedFor[i] !== names[slot];
    rec.bump("reads");
    emit(
      slots({ [slot]: wrong ? "unmounted" : "active" }),
      { [slot]: askedFor[i] },
      wrong
        ? `Call ${i + 1} is \`age\` and reads slot ${slot} — which holds "${stored[slot]}". It gets somebody else's state, and nothing throws.`
        : `Call ${i + 1} is \`${askedFor[i]}\` and reads slot ${slot}. Still correct.`
    );
  });

  emit(
    slots({ 1: "unmounted", 2: "discarded" }),
    {},
    "Slot 2 was never read, and `age` is now \"Grace\". React only notices when the total count changes."
  );

  return {
    frames: rec.frames,
    summary:
      "Hook state is an ordered list, and calls are matched to entries by order of execution — no name, no key. Skipping one call shifts every later call up a slot, so a hook silently returns a different hook's value. React can only detect a change in the number of calls, which is why the rule is absolute.",
  };
}

/* ------------------------------------------------------- 12. effect timing -- */

/**
 * Where an effect runs relative to the paint, and what a cleanup interleaves
 * with.
 *
 * The pipeline below is a table walked by a loop, and every frame is one entry
 * of it — so the order shown is the order written down once, in one place,
 * rather than restated per frame. The two things worth taking away are both
 * positional: `useLayoutEffect` sits before the paint and `useEffect` after
 * it, and on an update the *previous* effect's cleanup runs before the next
 * effect, not at the end.
 */
interface Stage {
  label: string;
  /** What the user can see once this stage is done. */
  screen: string;
  note: string;
}

function effectPipeline(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  const mount: Stage[] = [
    { label: "render", screen: "blank", note: "Render. React calls the component, which returns elements. Nothing is on screen, and this may be discarded and redone." },
    { label: "commit", screen: "blank", note: "Commit. React applies the tree to the DOM. The nodes exist now — but the browser has not drawn them yet." },
    { label: "layout effect", screen: "blank", note: "useLayoutEffect runs, synchronously, before the browser paints. It can measure the DOM and set state, and the user will never see the intermediate frame." },
    { label: "paint", screen: "first paint", note: "The browser paints. This is the first moment anything is visible — and every millisecond spent above delayed it." },
    { label: "effect", screen: "first paint", note: "useEffect runs, after the paint. That is the whole difference: it cannot block what the user sees, so it is the right place for anything that is not measuring layout." },
  ];

  const update: Stage[] = [
    { label: "render", screen: "old value", note: "Something changed, so React renders again. The screen still shows the previous value." },
    { label: "commit", screen: "new value", note: "Commit. The DOM is updated." },
    { label: "cleanup", screen: "new value", note: "Cleanup for the *previous* effect runs first — with the previous render's variables, not the new ones. This is why a cleanup closes the connection it opened, never the one about to be opened." },
    { label: "paint", screen: "new value", note: "The browser paints the update." },
    { label: "effect", screen: "new value", note: "Only now does the new effect run. Cleanup-then-effect, in that order, every time a dependency changes." },
  ];

  const emit = (
    stages: Stage[], upTo: number, phase: string
  ) => rec.push({
    kind: "sequence",
    items: stages.map((stage, i) => ({
      id: `${phase}-${i}`,
      label: stage.label,
      role: i === upTo ? "active" : i < upTo ? "unchanged" : undefined,
    })),
    pins: upTo >= 0 ? { [upTo]: `screen: ${stages[upTo].screen}` } : {},
    note: upTo < 0
      ? phase === "mount"
        ? "Mounting a component. Five stages, and the two you write code in are the last two."
        : "The same component, after a dependency changed. One stage is inserted, and it is inserted early."
      : stages[upTo].note,
  });

  emit(mount, -1, "mount");
  mount.forEach((_, i) => { rec.bump("stages"); emit(mount, i, "mount"); });
  emit(update, -1, "update");
  update.forEach((_, i) => { rec.bump("stages"); emit(update, i, "update"); });

  return {
    frames: rec.frames,
    summary:
      "An effect runs after the browser paints, which is what makes it safe for work that is not urgent and wrong for work the user must not see an intermediate state of — that is useLayoutEffect, which runs before the paint and blocks it. On an update, cleanup runs before the next effect and closes over the previous render's values, so it always releases the thing that render acquired.",
  };
}

/* --------------------------------------------------------- 13. fetch races -- */

/**
 * The race condition every search box has, run rather than described.
 *
 * There is a real event queue here: requests are given a start time and a
 * latency, events are sorted by when they happen, and the loop applies them in
 * that order. The out-of-order result is therefore a *consequence* of a slow
 * first request, not an assertion — set the first latency below the second and
 * the bug disappears from the animation on its own.
 */
interface Flight {
  id: string;
  query: string;
  start: number;
  latency: number;
  ignored: boolean;
}

function fetchRace(withCleanup: boolean): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  /* Typed quickly, so the second request starts before the first finishes —
     and the first is the slow one, which is what makes it land last. */
  const flights: Flight[] = [
    { id: "f0", query: "ad", start: 0, latency: 300, ignored: false },
    { id: "f1", query: "ada", start: 60, latency: 40, ignored: false },
  ];

  type Event = { at: number; kind: "start" | "resolve"; flight: Flight };
  const events: Event[] = [];
  for (const flight of flights) {
    events.push({ at: flight.start, kind: "start", flight });
    events.push({ at: flight.start + flight.latency, kind: "resolve", flight });
  }
  events.sort((a, b) => a.at - b.at || (a.kind === "start" ? -1 : 1));

  let screen = "—";
  const status = new Map<Flight, Role | undefined>();

  const emit = (note: string) =>
    rec.push({
      kind: "sequence",
      items: flights.map((flight) => ({
        id: flight.id,
        label: `"${flight.query}" (${flight.latency}ms)`,
        role: status.get(flight),
      })),
      pins: { 0: `showing: ${screen}` },
      note,
    });

  emit(
    withCleanup
      ? "The same two keystrokes, with one line added to the effect: a flag the cleanup sets."
      : "Two keystrokes, 60ms apart. Each one runs the effect, which starts a fetch. The first request is the slow one."
  );

  for (const event of events) {
    if (event.kind === "start") {
      if (withCleanup) {
        // The cleanup for the previous effect runs before the next effect. It
        // closes over *that* render's flag, which is what makes this work.
        for (const other of flights) {
          if (other !== event.flight && status.get(other) === "active") {
            other.ignored = true;
            status.set(other, "discarded");
          }
        }
      }
      status.set(event.flight, "active");
      rec.bump("requests");
      emit(
        withCleanup && flights.some((f) => f.ignored && f !== event.flight)
          ? `t=${event.at}ms: the effect re-runs for "${event.flight.query}". Cleanup fires first and sets the previous render's flag, so that request is now marked to be ignored — it is still in flight, nobody has cancelled anything.`
          : event.flight === flights[0]
            ? `t=${event.at}ms: the effect runs for "${event.flight.query}" and starts a request. Nothing has come back yet.`
            : `t=${event.at}ms: the effect runs for "${event.flight.query}" and starts a second request. The first one is still in flight, and nothing has cancelled it.`
      );
      continue;
    }

    rec.bump("responses");
    if (event.flight.ignored) {
      status.set(event.flight, "discarded");
      emit(
        `t=${event.at}ms: "${event.flight.query}" comes back — and its flag is set, so the response is dropped without touching state. Showing: ${screen}.`
      );
      continue;
    }
    screen = `"${event.flight.query}"`;
    status.set(event.flight, "found");
    emit(
      `t=${event.at}ms: "${event.flight.query}" comes back and calls setResults. Showing: ${screen}.`
    );
  }

  emit(
    withCleanup
      ? `Final: ${screen}. The last query typed is the one displayed, which is the only thing the user can reason about.`
      : `Final: ${screen} — the *older* query, because it was slower. The user typed "ada" and is looking at results for "ad", with no error and nothing in the console.`
  );

  return {
    frames: rec.frames,
    summary: withCleanup
      ? "The fix is four lines and no library: a local flag, set true by the cleanup, checked before the state update. Cleanup runs before the next effect and closes over its own render's flag, so every superseded request is marked stale at the moment it is superseded. Nothing is cancelled — the response is simply ignored."
      : "Two requests in flight, and the response order is not the request order. Whichever resolves last wins, so a slow early query overwrites a fast later one and the screen shows results for something the user has stopped typing. It almost never reproduces in development, where localhost answers in a millisecond.",
  };
}

/* ----------------------------------------------------- 14. context updates -- */

function Provider({ children }: { children?: ReactNode }) {
  return <div>{children}</div>;
}
Provider.displayName = "Provider";
function Toolbar({ children }: { children?: ReactNode }) {
  return <div>{children}</div>;
}
Toolbar.displayName = "Toolbar";
function Themed() {
  return <button type="button" />;
}
Themed.displayName = "Themed";
function Plain() {
  return <span />;
}
Plain.displayName = "Plain";
function Side() {
  return <aside />;
}
Side.displayName = "Side";

const CONTEXT_TREE = (
  <App>
    <Provider>
      <Toolbar>
        <Themed />
        <Plain />
      </Toolbar>
      <Side />
    </Provider>
  </App>
);

/**
 * What a context update actually re-renders.
 *
 * Two rules run here, and they are genuinely different rules — which is the
 * whole reason context surprises people. A parent that re-renders re-renders
 * its children, unless a child is memoised and its props are unchanged. A
 * component that *reads* a changed context re-renders regardless, because the
 * value did not reach it through props and no memo boundary can see it.
 */
function contextUpdate(): Visualisation {
  const root = read(CONTEXT_TREE, "")!;
  const rec = new Recorder<TreeFrame>();
  const roles = new Map<string, Role>();
  const captions = new Map<string, string>();

  const nodes = () =>
    layout(root, roles).map((n) => ({ ...n, badge: captions.get(n.id) ?? n.badge }));
  const emit = (note: string) => rec.push({ kind: "tree", nodes: nodes(), note });

  /* Throws rather than returning undefined, so a component that lost its
     displayName fails here — with a name in the message — instead of two
     lines later on `undefined.id`. */
  const byLabel = (label: string) => {
    const node = descendants(root).find((n) => n.label === label);
    if (!node) throw new Error(`no <${label}> in the context tree — is its displayName set?`);
    return node;
  };
  const provider = byLabel("Provider");
  const themed = byLabel("Themed");
  const plain = byLabel("Plain");
  const side = byLabel("Side");

  /* Which components read the context, and which sit behind a memo boundary
     with unchanged props. The walk below consults these rather than naming
     nodes, so the two rules stay separable. */
  const reads = new Set([themed.id, side.id]);
  const memoised = new Set([plain.id]);

  captions.set(provider.id, "theme = light");
  captions.set(themed.id, "reads it");
  captions.set(side.id, "reads it");
  captions.set(plain.id, "memo, no context");
  emit("One provider, three components beneath it. Two read the theme; the third is memoised and reads nothing.");

  roles.set(provider.id, "active");
  captions.set(provider.id, "theme = dark");
  emit("The provider's state changes, so the value it provides changes with it.");

  roles.set(provider.id, "updated");
  rec.bump("renders");
  emit("The provider re-renders. Everything below it is now re-rendered by the ordinary rule, unless something stops it.");

  for (const node of descendants(root)) {
    if (node.id === root.id || node.id === provider.id) continue;
    const isMemo = memoised.has(node.id);
    const readsContext = reads.has(node.id);
    if (isMemo && !readsContext) {
      roles.set(node.id, "unchanged");
      emit(`<${node.label}> is memoised and its props did not change, so React skips it — and everything beneath it.`);
      continue;
    }
    roles.set(node.id, "updated");
    rec.bump("renders");
    emit(
      readsContext
        ? `<${node.label}> reads the context, so it re-renders. A memo boundary would not have saved it: the value arrived without passing through props, so there was nothing for memo to compare.`
        : `<${node.label}> re-renders because its parent did. It never mentions the theme.`
    );
  }

  emit(
    `${rec.stats.renders} components re-rendered for one value change — and the memoised one that ignores the context did not.`
  );

  return {
    frames: rec.frames,
    summary:
      "A context update travels by two different routes. Everything under the provider re-renders because the provider re-rendered, which memo can stop. Every component that reads the changed context re-renders because it read it, which memo cannot stop — the value never passed through props, so there is nothing to compare. That second rule is why splitting one context into two is the fix when a large tree re-renders for a value most of it ignores.",
  };
}

/* -------------------------------------------------------- 15. the reducer -- */

/**
 * A reducer, actually run.
 *
 * `cartReducer` below is an ordinary function and the animation is its return
 * values: each frame is one `reducer(state, action)` call, and the totals in
 * the notes are computed, not typed. An action the reducer does not handle
 * would visibly leave the state alone.
 */
interface CartState {
  items: { sku: string; qty: number }[];
}
type CartAction =
  | { type: "add"; sku: string }
  | { type: "remove"; sku: string }
  | { type: "clear" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "add": {
      const existing = state.items.find((item) => item.sku === action.sku);
      return existing
        ? { items: state.items.map((item) => item.sku === action.sku ? { ...item, qty: item.qty + 1 } : item) }
        : { items: [...state.items, { sku: action.sku, qty: 1 }] };
    }
    case "remove":
      return { items: state.items.filter((item) => item.sku !== action.sku) };
    case "clear":
      return { items: [] };
  }
}

function reducerRun(): Visualisation {
  const rec = new Recorder<SequenceFrame>();
  const actions: CartAction[] = [
    { type: "add", sku: "pen" },
    { type: "add", sku: "ink" },
    { type: "add", sku: "pen" },
    { type: "remove", sku: "ink" },
    { type: "clear" },
  ];

  let state: CartState = { items: [] };

  const describe = (value: CartState) =>
    value.items.length === 0 ? "empty" : value.items.map((i) => `${i.sku}×${i.qty}`).join(", ");

  const emit = (upTo: number, note: string) =>
    rec.push({
      kind: "sequence",
      items: actions.map((action, i) => ({
        id: `a${i}`,
        label: "sku" in action ? `${action.type} ${action.sku}` : action.type,
        role: i === upTo ? "active" : i < upTo ? "unchanged" : undefined,
      })),
      pins: { 0: `state: ${describe(state)}` },
      note,
    });

  emit(-1, "Five actions, one function. Every one of them is a description of what happened, not an instruction about what to set.");

  actions.forEach((action, i) => {
    const before = describe(state);
    state = cartReducer(state, action);
    rec.bump("dispatches");
    emit(
      i,
      `dispatch(${JSON.stringify(action)}) — reducer(${before}) returns ${describe(state)}. ${
        action.type === "add" && before.includes(action.sku)
          ? "The item was already there, so the quantity went up rather than a duplicate appearing. That decision lives in the reducer, not in the component."
          : "The component that dispatched this knows nothing about how it was applied."
      }`
    );
  });

  emit(
    actions.length - 1,
    `Five dispatches, one place where the rules live. Every transition above is a pure function call — which is exactly why a reducer can be tested without rendering anything.`
  );

  return {
    frames: rec.frames,
    summary:
      "A reducer moves the how out of the components and into one function. A component dispatches a description of what happened — \"add pen\" — and the reducer decides whether that means appending an item or incrementing a quantity. Every transition is `(state, action) => state`, a pure function you can test by calling it, and the component never holds a rule.",
  };
}

/* ---------------------------------------------------- 16/17. re-rendering -- */

function Panel({ children }: { children?: ReactNode }) {
  return <div>{children}</div>;
}
Panel.displayName = "Panel";
function Chart() {
  return <svg />;
}
Chart.displayName = "Chart";
function Legend() {
  return <ul />;
}
Legend.displayName = "Legend";

const DASHBOARD = (
  <App>
    <Bar>
      <Btn />
    </Bar>
    <Panel>
      <Chart />
      <Legend />
    </Panel>
  </App>
);

/**
 * Why a component re-rendered, and what a memo boundary does about it.
 *
 * One walk, driven by two flags per node: whether it is memoised, and whether
 * its props are `Object.is`-equal to last render's. The three runs differ only
 * in those flags — which is the point being taught, since "I wrapped it in
 * memo and it still re-renders" is almost always the second flag rather than
 * the first.
 */
function rerender(mode: "none" | "memo" | "defeated"): Visualisation {
  const root = read(DASHBOARD, "")!;
  const rec = new Recorder<TreeFrame>();
  const roles = new Map<string, Role>();
  const captions = new Map<string, string>();

  const all = descendants(root);
  const panel = all.find((n) => n.label === "Panel")!;

  const nodes = () =>
    layout(root, roles).map((n) => ({ ...n, badge: captions.get(n.id) ?? n.badge }));
  const emit = (note: string) => rec.push({ kind: "tree", nodes: nodes(), note });

  captions.set(root.id, "count = 0");
  if (mode !== "none") {
    captions.set(panel.id, mode === "memo" ? "memo, data=DATA" : "memo, data={…}");
  }
  emit(
    mode === "none"
      ? "A dashboard. The state lives at the top; the chart below it is the expensive part."
      : mode === "memo"
        ? "The same tree with Panel wrapped in memo, and its data prop hoisted to a constant outside the component."
        : "The same memo, but data is an object literal written inside App's body: data={{ series }}."
  );

  captions.set(root.id, "count = 1");
  roles.set(root.id, "updated");
  rec.bump("rendered");
  emit("App's state changes, so App re-renders. That part is never in question.");

  for (const node of all) {
    if (node.id === root.id) continue;
    const memoised = mode !== "none" && node.id === panel.id;
    const propsEqual = mode === "memo";

    if (memoised && propsEqual) {
      roles.set(node.id, "unchanged");
      for (const child of descendants(node).slice(1)) roles.set(child.id, "unchanged");
      rec.bump("skipped", 1 + descendants(node).slice(1).length);
      emit(
        `<${node.label}> is memoised and Object.is(prevProps.data, nextProps.data) is true, so React skips it — and skipping a component skips everything inside it.`
      );
      // Its subtree was decided by that one comparison; do not walk into it.
      for (const child of descendants(node).slice(1)) roles.set(child.id, "unchanged");
      continue;
    }
    if (roles.get(node.id) === "unchanged") continue;

    if (memoised) {
      roles.set(node.id, "updated");
      rec.bump("rendered");
      emit(
        `<${node.label}> is memoised, and React still renders it. App's body ran again, so the object literal is a new object: Object.is(prev, next) is false. memo compared honestly and the answer was "different".`
      );
      continue;
    }
    roles.set(node.id, "updated");
    rec.bump("rendered");
    emit(`<${node.label}> re-renders because its parent did. React did not compare its props and did not ask whether its state changed — by default there is no comparison at all.`);
  }

  const rendered = rec.stats.rendered ?? 0;
  emit(
    mode === "memo"
      ? `${rendered} rendered, ${rec.stats.skipped ?? 0} skipped. One comparison at the boundary decided the whole subtree.`
      : `${rendered} components rendered for one state change${mode === "defeated" ? " — including the memoised one, which is the version of this bug people actually hit." : "."}`
  );

  return {
    frames: rec.frames,
    summary:
      mode === "none"
        ? "The default rule has no exceptions worth remembering: when a component re-renders, everything below it re-renders, whether or not its props changed and whether or not it has state. That is usually fine — rendering a handful of small components costs less than the code you would write to avoid it. It stops being fine when something down there is expensive."
        : mode === "memo"
          ? "memo puts a gate on the branch: React compares each prop with Object.is and, if all are equal, skips the component and everything inside it. One comparison, an entire subtree spared — which is why the boundary matters more than the number of memo calls."
          : "This is the memo that does nothing. App's body runs on every render, so `data={{ series }}` builds a new object every time and Object.is is false every time. memo is working exactly as documented; the prop is genuinely a different value. Fix the identity — hoist it, or useMemo it — or the memo is pure overhead.",
  };
}

/* ------------------------------------------------- 18. Object.is, per prop -- */

/**
 * memo's comparison, run one prop at a time.
 *
 * The values below are the actual values compared, and the verdicts come from
 * calling `Object.is` on them — including the pair of `{}` literals, which are
 * two distinct objects here for the same reason they are two distinct objects
 * in a component body.
 */
function propComparison(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  const previous = { label: "Total", count: 3, rows: [1, 2], style: { bold: true }, onPick: () => {} };
  /* Built separately, exactly as a second render would build them. The
     primitives come out equal; the object and array do not, and no amount of
     matching content changes that. */
  const next = { label: "Total", count: 3, rows: [1, 2], style: { bold: true }, onPick: () => {} };

  const names = ["label", "count", "rows", "style", "onPick"] as const;
  const shown: Record<(typeof names)[number], string> = {
    label: '"Total"',
    count: "3",
    rows: "[1, 2]",
    style: "{ bold: true }",
    onPick: "() => {}",
  };

  const verdicts = new Map<string, Role>();
  const emit = (note: string) =>
    rec.push({
      kind: "sequence",
      items: names.map((name) => ({
        id: name,
        label: `${name}=${shown[name]}`,
        role: verdicts.get(name),
      })),
      pins: {},
      note,
    });

  emit("Five props, written identically in both renders. memo compares them one at a time with Object.is.");

  let equal = 0;
  for (const name of names) {
    const same = Object.is(previous[name], next[name]);
    verdicts.set(name, same ? "unchanged" : "updated");
    if (same) equal += 1;
    rec.bump("compared");
    emit(
      same
        ? `Object.is(prev.${name}, next.${name}) → true. A primitive with the same value *is* the same value; there is no second copy of the number 3.`
        : `Object.is(prev.${name}, next.${name}) → false. Both sides look identical and both sides are freshly built, so they are two different ${name === "onPick" ? "functions" : "objects"} that happen to have the same contents.`
    );
  }

  emit(
    `${equal} of ${names.length} equal, so memo re-renders. One unequal prop is enough — and the three that fail are the three you write without thinking: an array literal, an object literal and an arrow function.`
  );

  return {
    frames: rec.frames,
    summary:
      "memo's comparison is shallow and uses Object.is, which asks whether two values are the same value — not whether they look alike. Primitives with equal contents are the same value. Objects, arrays and functions built during render never are, however identical they look, which is why a memoised component with an inline prop re-renders every single time.",
  };
}

/* ------------------------------------------------- 19. custom hook slots -- */

/**
 * What a custom hook is, demonstrated by a hook dispatcher small enough to
 * read.
 *
 * `useSlot` below is a real, if tiny, implementation of the mechanism module 5
 * described: a per-instance list and a cursor that advances on every call. The
 * point the animation makes falls straight out of it — `useCounter` has no
 * storage of its own, so calling it simply performs its inner `useSlot` calls
 * against whichever instance is currently rendering. Two components calling
 * the same hook therefore get two separate lists without anything special
 * happening, which is the thing "hooks are not shared state" is trying to say.
 */
interface HookInstance {
  name: string;
  slots: { label: string; value: string }[];
  cursor: number;
}

function customHookSlots(): Visualisation {
  const rec = new Recorder<SequenceFrame>();
  const instances: HookInstance[] = [];
  let current: HookInstance;
  let live: (note: string) => void = () => {};

  /* The whole dispatcher. A call takes the slot at the cursor, creating it on
     first render, and moves the cursor on. Nothing here knows or cares which
     function made the call. */
  function useSlot(label: string, initial: string): string {
    const index = current.cursor++;
    if (current.slots.length <= index) {
      current.slots.push({ label, value: initial });
      live(`${current.name}: useState("${initial}") claims slot ${index}. The call site was ${label}.`);
    }
    return current.slots[index].value;
  }

  /* An ordinary function that happens to call hooks. There is no registration
     step and no React API involved — this is the entire definition of a
     custom hook. */
  function useCounter(tag: string) {
    const count = useSlot(`useCounter (${tag})`, "0");
    const status = useSlot(`useCounter (${tag})`, "idle");
    return { count, status };
  }

  /* The lint rule that guards the rules of hooks cannot tell this dispatcher
     apart from the real one, and it is right not to try: `render` calls two
     `use*` functions and is not a component. The names are the whole point of
     the demonstration, so the rule is turned off for the three lines rather
     than the names being disguised. */
  /* eslint-disable react-hooks/rules-of-hooks */
  function render(name: string) {
    const instance: HookInstance = { name, slots: [], cursor: 0 };
    instances.push(instance);
    current = instance;
    useSlot(`${name} directly`, name === "Cart" ? "open" : "closed");
    useCounter(name);
  }
  /* eslint-enable react-hooks/rules-of-hooks */

  const emit = (note: string, activeInstance?: HookInstance, activeSlot?: number) =>
    rec.push({
      kind: "sequence",
      items: instances.flatMap((instance) =>
        instance.slots.map((slot, i) => ({
          id: `${instance.name}-${i}`,
          label: slot.value,
          role: instance === activeInstance && i === activeSlot ? ("active" as Role) : undefined,
        }))
      ),
      pins: Object.fromEntries(
        instances.flatMap((instance, order) =>
          instance.slots.map((slot, i) => [
            instances.slice(0, order).reduce((sum, prev) => sum + prev.slots.length, 0) + i,
            `${instance.name}[${i}]`,
          ])
        )
      ),
      note,
    });

  live = (note) => {
    const instance = current;
    emit(note, instance, instance.slots.length - 1);
  };

  emit("Two components. Each calls useState once directly and then calls useCounter, a custom hook that calls useState twice more.");
  render("Cart");
  emit("Cart is done: three slots, in call order. Two of them were claimed by code inside useCounter, and the list has no idea.");
  render("Header");
  emit("Header renders and gets its own list. Nothing was shared — useCounter has no storage; it only makes calls against whichever component is rendering.");

  emit(
    `${instances.length} components, ${instances.reduce((n, i) => n + i.slots.length, 0)} slots, and no mechanism beyond "the next call takes the next slot". A custom hook is a function that calls hooks — there is nothing else to it.`
  );

  return {
    frames: rec.frames,
    summary:
      "A custom hook has no state of its own. Calling one is exactly as if you had pasted its body into the caller, so its hook calls claim slots in the *caller's* list — which is why two components using the same hook get two independent copies, why the rules of hooks apply unchanged inside it, and why the only thing that makes it a hook is the name beginning with `use`.",
  };
}

/* ------------------------------------------------- 20. an external store -- */

/**
 * Subscribing to something that is not React state.
 *
 * The store below is a real one — a value, a set of listeners, and a `set` that
 * calls them — and the components really do subscribe to it. The frames are
 * emitted from inside `subscribe`, `set` and `getSnapshot`, so the order shown
 * is the order those functions actually run in.
 */
function externalStore(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  const listeners = new Set<() => void>();
  let value = "online";
  const subscribers: { name: string; sees: string }[] = [];

  const emit = (note: string, active?: string, role: Role = "active") =>
    rec.push({
      kind: "sequence",
      items: [
        { id: "store", label: `store: ${value}`, role: active === "store" ? role : undefined },
        ...subscribers.map((sub) => ({
          id: sub.name,
          label: `${sub.name}: ${sub.sees}`,
          role: active === sub.name ? role : undefined,
        })),
      ],
      pins: { 0: `${listeners.size} listener${listeners.size === 1 ? "" : "s"}` },
      note,
    });

  const getSnapshot = () => value;
  const subscribe = (onChange: () => void) => {
    listeners.add(onChange);
    return () => listeners.delete(onChange);
  };
  const set = (next: string) => {
    value = next;
    for (const listener of listeners) listener();
  };

  emit("A store outside React: one value and a set of listeners. React has never heard of it.");

  for (const name of ["Banner", "SaveButton"]) {
    const sub = { name, sees: "—" };
    subscribers.push(sub);
    subscribe(() => {
      sub.sees = getSnapshot();
      rec.bump("re-renders");
      emit(`The store called ${name}'s listener, so React re-renders it. It reads getSnapshot() again and sees "${sub.sees}".`, name, "updated");
    });
    sub.sees = getSnapshot();
    emit(`${name} mounts. useSyncExternalStore calls subscribe to register a listener, then getSnapshot to read the current value: "${sub.sees}".`, name);
  }

  emit("Two components, two listeners, one value. Neither component holds a copy of it in state.");

  set("offline");
  emit("Both are showing the same value, because both read it from the same place at the same moment. That is the guarantee useSyncExternalStore exists to provide.", "store", "updated");

  return {
    frames: rec.frames,
    summary:
      "useSyncExternalStore takes two functions: subscribe, which registers a listener and returns the unsubscriber, and getSnapshot, which reads the current value. React re-renders when the listener fires and reads the value fresh each time. The reason this exists rather than a useEffect-plus-useState copy is tearing: a copy in state can be one render behind, so two components can display different values for the same store during a concurrent render, and reading through a snapshot cannot.",
  };
}

/* ------------------------------------------------------------------ table -- */


export const REACT_ALGOS = {
  "element-tree": {
    label: "JSX to element tree",
    run: elementTree,
  },
  "render-commit": {
    label: "Render phase, then commit",
    run: renderAndCommit,
  },
  "reconcile-same-type": {
    label: "Reconciliation: same type",
    run: () =>
      reconcileRun(
        AFTER_SAME,
        "A second row is added. React compares the new tree with the previous one, top down.",
        "When the type at a position is unchanged, React keeps the DOM node and its state and only updates what differs. New positions are mounted; nothing else is disturbed."
      ),
  },
  "reconcile-type-change": {
    label: "Reconciliation: type changed",
    run: () =>
      reconcileRun(
        AFTER_TYPE_CHANGED,
        "This time the <ul> has become a <section>. React compares the two trees, top down.",
        "A changed type at one position destroys everything below it. React does not attempt to match a <ul> against a <section>: the old subtree is unmounted with all of its state, and the new one is built from nothing."
      ),
  },
  "keys-by-index": {
    label: "Keys: keyed by index",
    run: () => keysRun(true),
  },
  "keys-stable": {
    label: "Keys: keyed by id",
    run: () => keysRun(false),
  },
  "props-down": {
    label: "One-way data flow",
    run: propsDown,
  },
  "lifting-state": {
    label: "Lifting state up",
    run: liftingState,
  },
  "queue-values": {
    label: "The update queue: values",
    run: () => stateQueue(false),
  },
  "queue-updaters": {
    label: "The update queue: updaters",
    run: () => stateQueue(true),
  },
  "hook-slots": {
    label: "Hook slots and call order",
    run: hookSlots,
  },
  "effect-timing": {
    label: "Effect timing: render, paint, effect",
    run: effectPipeline,
  },
  "fetch-race": {
    label: "Fetching: the race condition",
    run: () => fetchRace(false),
  },
  "fetch-race-fixed": {
    label: "Fetching: cleanup fixes it",
    run: () => fetchRace(true),
  },
  "context-update": {
    label: "What a context update re-renders",
    run: contextUpdate,
  },
  "reducer-dispatch": {
    label: "A reducer, action by action",
    run: reducerRun,
  },
  "rerender-cascade": {
    label: "Re-rendering: the default cascade",
    run: () => rerender("none"),
  },
  "memo-boundary": {
    label: "Re-rendering: memo cuts the branch",
    run: () => rerender("memo"),
  },
  "memo-defeated": {
    label: "Re-rendering: the memo that does nothing",
    run: () => rerender("defeated"),
  },
  "prop-comparison": {
    label: "Object.is, one prop at a time",
    run: propComparison,
  },
  "custom-hook-slots": {
    label: "A custom hook has no state of its own",
    run: customHookSlots,
  },
  "external-store": {
    label: "Subscribing to an external store",
    run: externalStore,
  },
} as const;

export type ReactAlgoName = keyof typeof REACT_ALGOS;
