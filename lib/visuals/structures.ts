/**
 * Data structures, animated by operating on real ones.
 *
 * Each generator builds the structure with an ordinary implementation and
 * emits a frame after every meaningful step, so what you see is what the
 * operations actually did.
 */
import {
  Recorder,
  type BucketFrame,
  type HeapFrame,
  type Role,
  type SequenceFrame,
  type TreeFrame,
  type TreeNode,
  type Visualisation,
} from "./types";

/* ------------------------------------------------------------------ stack -- */

export function stackDemo(operations: (number | "pop")[]): Visualisation {
  const rec = new Recorder<SequenceFrame>();
  const stack: number[] = [];
  const emit = (note: string, role?: Role, at?: number) =>
    rec.push({
      kind: "sequence",
      items: stack.map((v, i) => ({ id: `${i}-${v}`, label: String(v), role: i === at ? role : undefined })),
      pins: stack.length ? { [stack.length - 1]: "top" } : {},
      note,
    });

  emit("An empty stack. Everything happens at one end — the top.");
  for (const op of operations) {
    if (op === "pop") {
      if (stack.length === 0) {
        emit("Popping an empty stack is an error — there is nothing at the top.");
        continue;
      }
      const top = stack[stack.length - 1];
      emit(`pop() removes ${top} from the top.`, "active", stack.length - 1);
      stack.pop();
      rec.bump("pops");
      emit(`${top} is gone. The element pushed before it is now on top.`);
    } else {
      stack.push(op);
      rec.bump("pushes");
      emit(`push(${op}) adds ${op} on top.`, "active", stack.length - 1);
    }
  }
  emit("Last in, first out — the most recently pushed element is always the first out.");
  return {
    frames: rec.frames,
    summary:
      "A stack allows push and pop at one end only, so the last thing in is the first thing out. Both operations are O(1). It is the structure behind the call stack, expression evaluation, undo histories, and every iterative conversion of a recursive algorithm.",
  };
}

/* ------------------------------------------------------------------ queue -- */

export function queueDemo(operations: (number | "dequeue")[]): Visualisation {
  const rec = new Recorder<SequenceFrame>();
  const queue: number[] = [];
  const emit = (note: string, role?: Role, at?: number) =>
    rec.push({
      kind: "sequence",
      items: queue.map((v, i) => ({ id: `${i}-${v}`, label: String(v), role: i === at ? role : undefined })),
      pins: queue.length ? { 0: "front", [queue.length - 1]: "rear" } : {},
      note,
    });

  emit("An empty queue. Things join at the rear and leave from the front.");
  for (const op of operations) {
    if (op === "dequeue") {
      if (queue.length === 0) {
        emit("Dequeuing an empty queue is an error.");
        continue;
      }
      const front = queue[0];
      emit(`dequeue() removes ${front} from the front.`, "active", 0);
      queue.shift();
      rec.bump("dequeues");
      emit(`${front} has left. Whoever was behind it is now at the front.`);
    } else {
      queue.push(op);
      rec.bump("enqueues");
      emit(`enqueue(${op}) joins the rear.`, "active", queue.length - 1);
    }
  }
  emit("First in, first out — the opposite of a stack, and the reason BFS explores level by level.");
  return {
    frames: rec.frames,
    summary:
      "A queue adds at one end and removes from the other, so the first thing in is the first thing out. Both operations are O(1) when it is backed by a ring buffer or a linked list — note that removing from the front of a plain array is O(n), which is why languages provide a deque.",
  };
}

/* ------------------------------------------------------------ linked list -- */

export function linkedListDemo(
  script: { op: "append" | "prepend" | "delete"; value: number }[]
): Visualisation {
  const rec = new Recorder<SequenceFrame>();
  let list: number[] = [];
  const emit = (note: string, role?: Role, at?: number) =>
    rec.push({
      kind: "sequence",
      linked: true,
      items: list.map((v, i) => ({ id: `${i}-${v}`, label: String(v), role: i === at ? role : undefined })),
      pins: list.length ? { 0: "head" } : {},
      note,
    });

  emit("An empty list. `head` is null — there is no first node.");
  for (const step of script) {
    if (step.op === "prepend") {
      list = [step.value, ...list];
      rec.bump("nodes");
      emit(`Prepend ${step.value}: point the new node at the old head, then move head. O(1).`, "active", 0);
    } else if (step.op === "append") {
      // Walking to the tail is what makes append O(n) without a tail pointer.
      for (let i = 0; i < list.length; i++) {
        emit(`Walking to the end to append ${step.value}: at node ${list[i]}.`, "compare", i);
      }
      list = [...list, step.value];
      rec.bump("nodes");
      emit(`Append ${step.value} at the tail. O(n) without a tail pointer.`, "active", list.length - 1);
    } else {
      const idx = list.indexOf(step.value);
      if (idx === -1) {
        emit(`${step.value} is not in the list.`);
        continue;
      }
      for (let i = 0; i <= idx; i++) {
        emit(`Searching for ${step.value}: at node ${list[i]}.`, i === idx ? "found" : "compare", i);
      }
      emit(`Unlink ${step.value} by pointing its predecessor at its successor.`, "swap", idx);
      list = list.filter((_, i) => i !== idx);
      rec.bump("deletions");
      emit(`${step.value} is unlinked. Nothing else moved — that is the point of a list.`);
    }
  }
  return {
    frames: rec.frames,
    summary:
      "A linked list stores each element in its own node with a pointer to the next. Inserting or deleting is O(1) once you are holding the right node, because nothing shifts — but *finding* that node is O(n), and there is no indexing. Every node is a separate allocation, which is why arrays win on traversal speed despite the worse insert.",
  };
}

/* --------------------------------------------------------------------- BST -- */

interface BstNode { value: number; left?: BstNode; right?: BstNode }

function layout(root: BstNode | undefined, highlight: Set<number>, found?: number): TreeNode[] {
  const nodes: TreeNode[] = [];
  let slot = 0;
  // In-order traversal assigns x positions, which is what keeps a BST drawn
  // left-to-right in sorted order — the visual statement of its invariant.
  function walk(node: BstNode | undefined, depth: number, parent?: string) {
    if (!node) return;
    walk(node.left, depth + 1, String(node.value));
    const x = slot++;
    nodes.push({
      id: String(node.value),
      label: String(node.value),
      depth,
      x,
      parent,
      role: node.value === found ? "found" : highlight.has(node.value) ? "compare" : undefined,
    });
    walk(node.right, depth + 1, String(node.value));
  }
  walk(root, 0);
  return nodes;
}

export function bstDemo(inserts: number[], searchFor?: number): Visualisation {
  const rec = new Recorder<TreeFrame>();
  let root: BstNode | undefined;
  const emit = (note: string, highlight: Set<number> = new Set(), found?: number) =>
    rec.push({ kind: "tree", nodes: layout(root, highlight, found), note });

  emit("An empty tree.");
  for (const value of inserts) {
    if (!root) {
      root = { value };
      rec.bump("nodes");
      emit(`${value} becomes the root.`, new Set([value]));
      continue;
    }
    const path: number[] = [];
    let cur = root;
    for (;;) {
      path.push(cur.value);
      rec.bump("comparisons");
      emit(`Inserting ${value}: compare against ${cur.value}.`, new Set(path));
      if (value < cur.value) {
        if (!cur.left) { cur.left = { value }; break; }
        cur = cur.left;
      } else if (value > cur.value) {
        if (!cur.right) { cur.right = { value }; break; }
        cur = cur.right;
      } else {
        break; // already present
      }
    }
    rec.bump("nodes");
    emit(`${value} is placed. Everything left of a node is smaller; everything right is larger.`,
      new Set([value]));
  }

  if (searchFor !== undefined) {
    const path: number[] = [];
    let cur = root;
    while (cur) {
      path.push(cur.value);
      rec.bump("comparisons");
      if (cur.value === searchFor) {
        emit(`Found ${searchFor}. Each comparison discarded a whole subtree.`, new Set(path), searchFor);
        break;
      }
      emit(`Searching for ${searchFor}: ${searchFor} ${searchFor < cur.value ? "<" : ">"} ${cur.value}, so go ${searchFor < cur.value ? "left" : "right"}.`,
        new Set(path));
      cur = searchFor < cur.value ? cur.left : cur.right;
    }
    if (!cur) emit(`${searchFor} is not in the tree.`, new Set(path));
  }

  return {
    frames: rec.frames,
    summary:
      "A binary search tree keeps every value in the left subtree smaller than its node and every value on the right larger. That invariant makes search, insert and delete O(height) — which is O(log n) on a balanced tree and O(n) on a degenerate one, so inserting already-sorted data produces a linked list wearing a tree costume.",
  };
}

/* -------------------------------------------------------------------- trie -- */

interface TrieNode { children: Map<string, TrieNode>; terminal: boolean; id: string }

function trieLayout(root: TrieNode, active: Set<string>): TreeNode[] {
  const nodes: TreeNode[] = [];
  let slot = 0;
  function walk(node: TrieNode, depth: number, label: string, parent?: string) {
    const keys = [...node.children.keys()].sort();
    const childIds: string[] = [];
    const firstSlot = slot;
    for (const key of keys) {
      walk(node.children.get(key)!, depth + 1, key, node.id);
      childIds.push(key);
    }
    const x = keys.length ? (firstSlot + slot - 1) / 2 : slot++;
    nodes.push({
      id: node.id,
      label,
      depth,
      x,
      parent,
      terminal: node.terminal,
      role: active.has(node.id) ? "compare" : undefined,
    });
  }
  walk(root, 0, "•");
  return nodes;
}

export function trieDemo(words: string[], lookup?: string): Visualisation {
  const rec = new Recorder<TreeFrame>();
  const root: TrieNode = { children: new Map(), terminal: false, id: "root" };
  const emit = (note: string, active: Set<string> = new Set()) =>
    rec.push({ kind: "tree", nodes: trieLayout(root, active), note });

  emit("An empty trie. The root spells nothing; every edge is one character.");
  for (const word of words) {
    let node = root;
    const active = new Set<string>(["root"]);
    for (const ch of word) {
      const id = node.id === "root" ? ch : `${node.id}${ch}`;
      if (!node.children.has(ch)) {
        node.children.set(ch, { children: new Map(), terminal: false, id });
        rec.bump("nodes");
        emit(`Inserting "${word}": no edge for '${ch}', so create one.`, new Set([...active, id]));
      } else {
        emit(`Inserting "${word}": '${ch}' already exists — reuse the shared prefix.`, new Set([...active, id]));
      }
      node = node.children.get(ch)!;
      active.add(id);
    }
    node.terminal = true;
    rec.bump("words");
    emit(`"${word}" is stored. The ring marks a node that ends a word.`, active);
  }

  if (lookup) {
    let node: TrieNode | undefined = root;
    const active = new Set<string>(["root"]);
    for (const ch of lookup) {
      node = node?.children.get(ch);
      if (!node) {
        emit(`Looking up "${lookup}": no edge for '${ch}', so it is not here.`, active);
        break;
      }
      active.add(node.id);
      emit(`Looking up "${lookup}": followed '${ch}'.`, active);
    }
    if (node) {
      emit(node.terminal
        ? `"${lookup}" is present — the final node ends a word.`
        : `"${lookup}" is a prefix of stored words but is not itself one.`, active);
    }
  }

  return {
    frames: rec.frames,
    summary:
      "A trie stores strings by their characters, so words sharing a prefix share a path. Lookup costs O(length of the word) regardless of how many words are stored — the size of the dictionary does not enter into it. That, and the ability to answer \"which words start with this\", is what it buys over a hash set.",
  };
}

/* -------------------------------------------------------------------- heap -- */

export function heapDemo(inserts: number[], pops = 0): Visualisation {
  const rec = new Recorder<HeapFrame>();
  const a: number[] = [];
  const emit = (note: string, roles: Record<number, Role> = {}) =>
    rec.push({ kind: "heap", values: [...a], roles, note });

  emit("An empty min-heap. It is an array, and it is also a tree — the array indices are the tree.");
  for (const v of inserts) {
    a.push(v);
    rec.bump("inserts");
    let i = a.length - 1;
    emit(`Insert ${v} at the end, position ${i}.`, { [i]: "active" });
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      rec.bump("comparisons");
      emit(`Compare ${a[i]} with its parent ${a[parent]} at index ${parent}.`,
        { [i]: "compare", [parent]: "compare" });
      if (a[parent] <= a[i]) {
        emit(`The parent is smaller, so the heap property holds. Stop.`, { [i]: "sorted" });
        break;
      }
      [a[parent], a[i]] = [a[i], a[parent]];
      rec.bump("swaps");
      emit(`${a[parent]} is smaller than its parent was — swap it up.`,
        { [i]: "swap", [parent]: "swap" });
      i = parent;
    }
  }

  for (let p = 0; p < pops; p++) {
    if (a.length === 0) break;
    const top = a[0];
    emit(`The minimum is always at index 0: ${top}.`, { 0: "found" });
    a[0] = a[a.length - 1];
    a.pop();
    rec.bump("pops");
    if (a.length === 0) { emit(`Removed ${top}. The heap is now empty.`); break; }
    emit(`Move the last element to the root, then sift it down.`, { 0: "active" });
    let i = 0;
    for (;;) {
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      let smallest = i;
      if (l < a.length) { rec.bump("comparisons"); if (a[l] < a[smallest]) smallest = l; }
      if (r < a.length) { rec.bump("comparisons"); if (a[r] < a[smallest]) smallest = r; }
      if (smallest === i) { emit(`Both children are larger. The heap property is restored.`, { [i]: "sorted" }); break; }
      emit(`${a[smallest]} is smaller than ${a[i]} — swap them.`, { [i]: "compare", [smallest]: "swap" });
      [a[i], a[smallest]] = [a[smallest], a[i]];
      rec.bump("swaps");
      i = smallest;
    }
  }

  return {
    frames: rec.frames,
    summary:
      "A binary heap is an array that pretends to be a complete tree: the children of index i live at 2i+1 and 2i+2, so no pointers are stored at all. Insert and remove-minimum are O(log n) because an element travels at most the height of the tree, and reading the minimum is O(1). It is not sorted — only the root is guaranteed to be in the right place.",
  };
}

/* -------------------------------------------------------------- hash table -- */

export function hashTableDemo(keys: string[], buckets = 7): Visualisation {
  const rec = new Recorder<BucketFrame>();
  const table: string[][] = Array.from({ length: buckets }, () => []);
  const hash = (key: string) =>
    [...key].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % buckets, 7) % buckets;

  const emit = (note: string, active?: number) =>
    rec.push({
      kind: "buckets",
      buckets: table.map((items, i) => ({
        key: String(i),
        items: [...items],
        role: i === active ? "active" : items.length > 1 ? "compare" : undefined,
      })),
      note,
    });

  emit(`An empty table with ${buckets} buckets.`);
  for (const key of keys) {
    const h = hash(key);
    rec.bump("hashes");
    emit(`hash("${key}") = ${h}.`, h);
    if (table[h].length > 0) {
      rec.bump("collisions");
      emit(`Bucket ${h} already holds ${table[h].map((k) => `"${k}"`).join(", ")} — a collision. Chain it.`, h);
    }
    table[h].push(key);
    emit(`"${key}" is stored in bucket ${h}.`, h);
  }
  emit("Lookup hashes the key, goes straight to one bucket, and scans only that chain.");
  return {
    frames: rec.frames,
    summary:
      "A hash table turns a key into a bucket index, so a lookup goes to one bucket rather than scanning everything. Collisions — two keys hashing to the same bucket — are unavoidable and are handled here by chaining. Average O(1), worst case O(n) when everything collides, which is why the O(1) always carries an asterisk.",
  };
}
