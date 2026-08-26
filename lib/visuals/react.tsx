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

/** One node of the element tree, flattened out of React's own objects. */
interface ElNode {
  id: string;
  /** The element's type, short enough to sit inside a node circle. */
  label: string;
  key: string | null;
  children: ElNode[];
}

function typeName(element: ReactElement): string {
  const type = element.type;
  if (typeof type === "string") return type;
  if (typeof type === "function") return type.name || "fn";
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
function flatten(node: ReactNode, out: ReactNode[] = []): ReactNode[] {
  if (Array.isArray(node)) {
    for (const child of node) flatten(child, out);
    return out;
  }
  if (node === null || node === undefined || typeof node === "boolean") return out;
  out.push(node);
  return out;
}

/** Builds the node tree, ignoring text children — the shape is the subject. */
function read(node: ReactNode, path: string): ElNode | null {
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
function layout(root: ElNode, roles: Map<string, Role>): TreeNode[] {
  const nodes: TreeNode[] = [];
  let slot = 0;

  const walk = (node: ElNode, depth: number, parent?: string): number => {
    if (node.children.length === 0) {
      const x = slot++;
      nodes.push({
        id: node.id, label: node.label, depth, x, parent,
        role: roles.get(node.id), badge: node.key === null ? undefined : `key=${node.key}`,
      });
      return x;
    }
    const xs = node.children.map((child) => walk(child, depth + 1, node.id));
    const x = (xs[0] + xs[xs.length - 1]) / 2;
    nodes.push({
      id: node.id, label: node.label, depth, x, parent,
      role: roles.get(node.id), badge: node.key === null ? undefined : `key=${node.key}`,
    });
    return x;
  };

  walk(root, 0);
  return nodes;
}

/** Every node of a subtree, parent first — the order React renders in. */
function descendants(node: ElNode, out: ElNode[] = []): ElNode[] {
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
} as const;

export type ReactAlgoName = keyof typeof REACT_ALGOS;
