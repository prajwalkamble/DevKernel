/**
 * Tree traversals and balancing, animated.
 *
 * The four traversals differ by *one line's position*, which is exactly the
 * kind of thing prose states and nobody remembers. Watching the same tree
 * produce four different orders makes the difference stick.
 */
import { Recorder, type Role, type TreeFrame, type TreeNode, type Visualisation } from "./types";

interface Node { value: number; left?: Node; right?: Node }

function build(values: number[]): Node | undefined {
  let root: Node | undefined;
  const insert = (node: Node | undefined, value: number): Node => {
    if (!node) return { value };
    if (value < node.value) node.left = insert(node.left, value);
    else if (value > node.value) node.right = insert(node.right, value);
    return node;
  };
  for (const v of values) root = insert(root, v);
  return root;
}

/** In-order x positions, so the drawing puts smaller values to the left. */
function layout(root: Node | undefined, roles: Map<number, Role>): TreeNode[] {
  const nodes: TreeNode[] = [];
  let slot = 0;
  const walk = (node: Node | undefined, depth: number, parent?: string) => {
    if (!node) return;
    walk(node.left, depth + 1, String(node.value));
    nodes.push({
      id: String(node.value), label: String(node.value),
      depth, x: slot++, parent, role: roles.get(node.value),
    });
    walk(node.right, depth + 1, String(node.value));
  };
  walk(root, 0);
  return nodes;
}

const SAMPLE = [50, 30, 70, 20, 40, 60, 80];

type Order = "inorder" | "preorder" | "postorder" | "levelorder";

const DESCRIPTION: Record<Order, string> = {
  preorder: "visit the node, then its left subtree, then its right",
  inorder: "left subtree, then the node, then the right subtree",
  postorder: "both subtrees first, then the node",
  levelorder: "every node at one depth before any node deeper",
};

export function traversal(order: Order, values = SAMPLE): Visualisation {
  const root = build(values);
  const rec = new Recorder<TreeFrame>();
  const visited: number[] = [];
  const roles = new Map<number, Role>();

  const emit = (note: string) =>
    rec.push({ kind: "tree", nodes: layout(root, roles), note });

  emit(`${order}: ${DESCRIPTION[order]}.`);

  const visit = (node: Node) => {
    visited.push(node.value);
    roles.set(node.value, "sorted");
    rec.bump("visited");
    emit(`Visit ${node.value}. Order so far: ${visited.join(", ")}.`);
  };

  if (order === "levelorder") {
    const queue: Node[] = root ? [root] : [];
    while (queue.length) {
      const node = queue.shift()!;
      roles.set(node.value, "active");
      emit(`Dequeue ${node.value}.`);
      visit(node);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
      if (queue.length) emit(`Queue: ${queue.map((n) => n.value).join(", ")}.`);
    }
  } else {
    const walk = (node: Node | undefined) => {
      if (!node) return;
      roles.set(node.value, "active");
      emit(`Arrive at ${node.value}.`);
      if (order === "preorder") visit(node);
      walk(node.left);
      if (order === "inorder") visit(node);
      walk(node.right);
      if (order === "postorder") visit(node);
    };
    walk(root);
  }

  const summaries: Record<Order, string> = {
    preorder:
      "Pre-order visits a node before its children, so it produces the tree's structure top-down — which is why it is what you use to *copy* or serialise a tree. The root comes first.",
    inorder:
      "In-order visits the left subtree, then the node, then the right. On a binary search tree that yields the values in sorted order, which is the single most useful fact about a BST and the reason the invariant is worth maintaining.",
    postorder:
      "Post-order visits both children before the node, so it is what you use to *free* or delete a tree, and to compute anything that depends on results from below — a subtree's height, or its sum. The root comes last.",
    levelorder:
      "Level-order is BFS on a tree: a queue, and every node at one depth before any node deeper. It is what you want for \"print the tree by rows\", for finding the shallowest anything, and for a level-by-level serialisation.",
  };

  emit(`Finished. ${order} order: ${visited.join(", ")}.`);
  return { frames: rec.frames, summary: summaries[order] };
}

/* ------------------------------------------------------------ BST deletion -- */

export function bstDelete(values = SAMPLE, remove = 30): Visualisation {
  const rec = new Recorder<TreeFrame>();
  let root = build(values);
  const roles = new Map<number, Role>();
  const emit = (note: string) => rec.push({ kind: "tree", nodes: layout(root, roles), note });

  emit(`Deleting ${remove}. There are three cases, and only the third is interesting.`);

  // Find it, narrating the descent.
  let cur = root;
  while (cur && cur.value !== remove) {
    roles.set(cur.value, "compare");
    emit(`${remove} ${remove < cur.value ? "<" : ">"} ${cur.value}, so go ${remove < cur.value ? "left" : "right"}.`);
    cur = remove < cur.value ? cur.left : cur.right;
  }
  if (!cur) {
    emit(`${remove} is not in the tree.`);
    return { frames: rec.frames, summary: deleteSummary };
  }
  roles.set(cur.value, "found");
  const children = (cur.left ? 1 : 0) + (cur.right ? 1 : 0);
  emit(`Found ${remove}. It has ${children} child(ren).`);

  if (children === 2) {
    let succ = cur.right!;
    while (succ.left) succ = succ.left;
    roles.set(succ.value, "swap");
    emit(`Two children, so it cannot simply be unlinked. Its in-order successor is ${succ.value} — the smallest value in the right subtree.`);
    emit(`Copy ${succ.value} into the node being deleted, then delete ${succ.value} from the right subtree instead — where it has at most one child.`);
  }

  const del = (node: Node | undefined, value: number): Node | undefined => {
    if (!node) return undefined;
    if (value < node.value) { node.left = del(node.left, value); return node; }
    if (value > node.value) { node.right = del(node.right, value); return node; }
    if (!node.left) return node.right;
    if (!node.right) return node.left;
    let succ = node.right;
    while (succ.left) succ = succ.left;
    node.value = succ.value;
    node.right = del(node.right, succ.value);
    return node;
  };
  root = del(root, remove);
  roles.clear();
  rec.bump("deletions");
  emit(`Done. The in-order traversal is still sorted, which is the invariant that had to survive.`);
  return { frames: rec.frames, summary: deleteSummary };
}

const deleteSummary =
  "Deleting from a BST has three cases. A leaf is simply removed. A node with one child is replaced by that child. A node with two children cannot be unlinked at all — so its value is overwritten with its in-order successor (the smallest value on its right), and the *successor* is deleted instead, which by construction has at most one child. That reduction is the whole trick.";

/* -------------------------------------------------------- AVL rotations -- */

export function avlRotation(): Visualisation {
  const rec = new Recorder<TreeFrame>();
  // Inserting in ascending order is the worst case for a plain BST: it degrades
  // to a linked list. AVL rotates to stop that happening.
  const emit = (ns: TreeNode[], note: string) =>
    rec.push({ kind: "tree", nodes: ns.map((n) => ({ ...n })), note });

  emit([{ id: "10", label: "10", depth: 0, x: 0 }], "Insert 10.");
  emit([
    { id: "10", label: "10", depth: 0, x: 0 },
    { id: "20", label: "20", depth: 1, x: 1, parent: "10" },
  ], "Insert 20. Still balanced — the height difference is 1.");
  emit([
    { id: "10", label: "10", depth: 0, x: 0, role: "swap" },
    { id: "20", label: "20", depth: 1, x: 1, parent: "10" },
    { id: "30", label: "30", depth: 2, x: 2, parent: "20", role: "compare" },
  ], "Insert 30. Now 10's right subtree has height 2 and its left has height 0 — a difference of 2, so 10 is unbalanced.");
  rec.bump("rotations");
  emit([
    { id: "10", label: "10", depth: 1, x: 0, parent: "20", role: "sorted" },
    { id: "20", label: "20", depth: 0, x: 1, role: "swap" },
    { id: "30", label: "30", depth: 1, x: 2, parent: "20", role: "sorted" },
  ], "Rotate left around 10: 20 becomes the root, 10 becomes its left child. Height 1 again, and the in-order order is unchanged.");
  emit([
    { id: "10", label: "10", depth: 1, x: 0, parent: "20" },
    { id: "20", label: "20", depth: 0, x: 1 },
    { id: "30", label: "30", depth: 1, x: 2, parent: "20" },
    { id: "40", label: "40", depth: 2, x: 3, parent: "30" },
  ], "Insert 40. Balanced.");
  emit([
    { id: "10", label: "10", depth: 1, x: 0, parent: "20" },
    { id: "20", label: "20", depth: 0, x: 1, role: "swap" },
    { id: "30", label: "30", depth: 1, x: 2, parent: "20", role: "compare" },
    { id: "40", label: "40", depth: 2, x: 3, parent: "30" },
    { id: "50", label: "50", depth: 3, x: 4, parent: "40", role: "compare" },
  ], "Insert 50. Now 20 is unbalanced: right height 3, left height 1.");
  rec.bump("rotations");
  emit([
    { id: "10", label: "10", depth: 2, x: 0, parent: "20" },
    { id: "20", label: "20", depth: 1, x: 1, parent: "30", role: "sorted" },
    { id: "30", label: "30", depth: 0, x: 2, role: "swap" },
    { id: "40", label: "40", depth: 1, x: 3, parent: "30", role: "sorted" },
    { id: "50", label: "50", depth: 2, x: 4, parent: "40" },
  ], "Rotate left around 20. Five nodes at height 2 — a plain BST would have had all five in a line at height 4.");
  return {
    frames: rec.frames,
    summary:
      "An AVL tree keeps every node's two subtree heights within 1 of each other, restoring that with rotations after each insert. A rotation changes the shape while preserving the in-order sequence — which is precisely why it is safe. The payoff: guaranteed O(log n) height, so inserting already-sorted data no longer degrades a tree into a linked list, which is the failure a plain BST cannot avoid.",
  };
}

export const TREE_ALGOS = {
  inorder: { label: "In-order traversal", run: () => traversal("inorder") },
  preorder: { label: "Pre-order traversal", run: () => traversal("preorder") },
  postorder: { label: "Post-order traversal", run: () => traversal("postorder") },
  levelorder: { label: "Level-order traversal", run: () => traversal("levelorder") },
  bstdelete: { label: "BST deletion", run: () => bstDelete() },
  avl: { label: "AVL rotations", run: () => avlRotation() },
} as const;

export type TreeAlgoName = keyof typeof TREE_ALGOS;
