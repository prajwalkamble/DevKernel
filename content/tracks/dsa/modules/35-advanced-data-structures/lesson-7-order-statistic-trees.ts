import type { Lesson } from "@/content/types";

export const orderStatisticTreesLesson: Lesson = {
  id: "dsa-advanced-structures-order-statistic-trees",
  slug: "order-statistic-trees",
  moduleSlug: "advanced-data-structures",
  title: "Balanced BSTs and Order-Statistic Trees",
  summary:
    "A size field in every node turns a search tree into one that answers \"k-th smallest\" and \"how many are below x\". Balancing decides whether those walks are logarithmic. Measured: 973 steps per query on sorted insertions without balancing, 13 with a treap — and no benefit at all on random insertions.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Augment a binary search tree with subtree sizes",
    "Implement k-th smallest and rank as size-guided walks",
    "Implement a treap with split and merge",
    "Measure what balancing buys on sorted and random insertion orders",
  ],
  sections: [
    {
      id: "the-size-field",
      heading: "The size field",
      body: [
        "Store in every node the number of nodes in its subtree: `size = 1 + size(left) + size(right)`. Every operation that changes a subtree \u2014 insert, delete, rotation, split, merge \u2014 must recompute it on the way back up.",
        "**k-th smallest** (counting from 0): at a node, let `below = size(left)`. If `k < below`, go left. If `k == below`, this node is the answer. Otherwise set `k = k - below - 1` and go right.",
        "**Rank of x** (how many keys are smaller): start at the root with a count of 0. At a node with key less than `x`, add `size(left) + 1` and go right; otherwise go left. Stop at a null.",
        "Both are single root-to-leaf walks, so they cost the tree's height.",
      ],
    },
    {
      id: "the-treap",
      heading: "A treap",
      body: [
        "A treap keeps keys in search-tree order and assigns each node a random priority kept in heap order, so a parent's priority is at least its children's. The shape is therefore the shape of a search tree built by inserting keys in decreasing priority order, which is a random order, and its expected height is `O(log n)` regardless of the order the keys actually arrived in.",
        "Two operations do all the work. **Split(t, k)** divides a tree into keys less than `k` and keys at least `k`, by walking down one path and reattaching subtrees. **Merge(a, b)**, where every key in `a` is smaller than every key in `b`, joins them by making the higher-priority root the root and merging into its inner side.",
        "Insert is split at the key, then merge the left part, a new node, and the right part. Delete one copy of `k` is split at `k`, split the right part at `k + 1`, drop the root of the middle piece by merging its children, and merge back. Split and merge recompute sizes as they return.",
      ],
      examples: [
        {
          id: "order-statistic-treap",
          title: "k-th smallest and rank against a sorted list, then height with and without balancing",
          lang: "python",
          code: `# An order-statistic tree: a binary search tree whose nodes also store the
# size of their subtree, which is enough to find the k-th smallest key and to
# count the keys below a value. Checked against a sorted list, then measured
# with and without balancing.

NULL = -1
key = []
priority = []
left = []
right = []
size = []
steps = [0]


def new_node(k, p):
    key.append(k)
    priority.append(p)
    left.append(NULL)
    right.append(NULL)
    size.append(1)
    return len(key) - 1


def sz(t):
    return 0 if t == NULL else size[t]


def pull(t):
    size[t] = 1 + sz(left[t]) + sz(right[t])


# --- a treap: keys in search order, random priorities in heap order ------

def split(t, k):
    # returns (keys < k, keys >= k)
    if t == NULL:
        return NULL, NULL
    if key[t] < k:
        a, b = split(right[t], k)
        right[t] = a
        pull(t)
        return t, b
    a, b = split(left[t], k)
    left[t] = b
    pull(t)
    return a, t


def merge(a, b):
    # every key in a is smaller than every key in b
    if a == NULL:
        return b
    if b == NULL:
        return a
    if priority[a] > priority[b]:
        right[a] = merge(right[a], b)
        pull(a)
        return a
    left[b] = merge(a, left[b])
    pull(b)
    return b


def treap_insert(root, k, p):
    a, b = split(root, k)
    return merge(merge(a, new_node(k, p)), b)


def treap_erase(root, k):
    a, b = split(root, k)
    middle, c = split(b, k + 1)
    if middle != NULL:
        middle = merge(left[middle], right[middle])   # drop one copy of k
    return merge(merge(a, middle), c)


# --- the same augmentation with no balancing at all ----------------------

def plain_insert(root, k):
    fresh = new_node(k, 0)
    if root == NULL:
        return fresh
    t = root
    while True:
        size[t] += 1
        if k < key[t]:
            if left[t] == NULL:
                left[t] = fresh
                return root
            t = left[t]
        else:
            if right[t] == NULL:
                right[t] = fresh
                return root
            t = right[t]


# --- the two queries the size field makes possible -----------------------

def kth(t, k):
    # the k-th smallest key, counting from zero
    while True:
        steps[0] += 1
        below = sz(left[t])
        if k < below:
            t = left[t]
        elif k == below:
            return key[t]
        else:
            k -= below + 1
            t = right[t]


def count_less(t, x):
    count = 0
    while t != NULL:
        steps[0] += 1
        if key[t] < x:
            count += sz(left[t]) + 1
            t = right[t]
        else:
            t = left[t]
    return count


def height(root):
    best = 0
    stack = [[root, 1]] if root != NULL else []
    while stack:
        node, depth = stack.pop()
        best = max(best, depth)
        if left[node] != NULL:
            stack.append([left[node], depth + 1])
        if right[node] != NULL:
            stack.append([right[node], depth + 1])
    return best


# --- a sorted list as the oracle -----------------------------------------

def lower_bound(items, x):
    lo = 0
    hi = len(items)
    while lo < hi:
        mid = (lo + hi) // 2
        if items[mid] < x:
            lo = mid + 1
        else:
            hi = mid
    return lo


# The same linear congruential generator in every language, so the
# operations below are the same whichever translation is run.
seed = 45100093


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


root = NULL
oracle = []
queries = 0
matched = 0
for _ in range(6000):
    roll = rand(10)
    if roll < 6:
        k = rand(1000)
        root = treap_insert(root, k, rand(32768))
        oracle.insert(lower_bound(oracle, k), k)
    elif roll < 8:
        k = rand(1000)
        root = treap_erase(root, k)
        at = lower_bound(oracle, k)
        if at < len(oracle) and oracle[at] == k:
            oracle.pop(at)
    elif roll < 9:
        if len(oracle) > 0:
            k = rand(len(oracle))
            queries += 1
            if kth(root, k) == oracle[k]:
                matched += 1
    else:
        x = rand(1000)
        queries += 1
        if count_less(root, x) == lower_bound(oracle, x):
            matched += 1

print("6000 random inserts, deletes, k-th smallest and count-below queries")
print("answers that matched a sorted list: %d of %d" % (matched, queries))
print("keys left in the tree: %d, and the root's size field says %d" % (len(oracle), sz(root)))
print()

N = 2000
print("%d keys inserted, then %d k-th smallest queries" % (N, N))
print()
print("insertion order   tree            height   steps per query")
for order in ["random", "sorted"]:
    keys = []
    for i in range(N):
        keys.append(rand(100000) if order == "random" else i)
    for kind in ["no balancing", "treap"]:
        tree = NULL
        for k in keys:
            if kind == "treap":
                tree = treap_insert(tree, k, rand(32768))
            else:
                tree = plain_insert(tree, k)
        steps[0] = 0
        for _ in range(N):
            kth(tree, rand(N))
        print("%-17s %-15s %6d %17d" % (order, kind, height(tree), steps[0] // N))
`,
          output: `6000 random inserts, deletes, k-th smallest and count-below queries
answers that matched a sorted list: 1203 of 1203
keys left in the tree: 2794, and the root's size field says 2794

2000 keys inserted, then 2000 k-th smallest queries

insertion order   tree            height   steps per query
random            no balancing        25                12
random            treap               29                13
sorted            no balancing      2000               973
sorted            treap               26                13`,
          explanation:
            "Over 6,000 random inserts, deletes and queries, all 1,203 k-th and rank answers matched a sorted list, and the root's size field matched the 2,794 keys remaining. The second table is about balance. Inserting 2,000 keys in sorted order without balancing builds a chain of height 2,000, and a k-th query walks 973 steps on average. The treap on the same keys has height 26 and walks 13 steps. On random insertion order, the unbalanced tree is already shallow at height 25 with 12 steps, and the treap is no better at 29 and 13.",
          alternates: [
            {
              lang: "javascript",
              code: `// An order-statistic tree: a binary search tree whose nodes also store the
// size of their subtree, which is enough to find the k-th smallest key and to
// count the keys below a value. Checked against a sorted list, then measured
// with and without balancing.

const NULL = -1;
const key = [];
const priority = [];
const left = [];
const right = [];
const size = [];
let steps = 0;

function newNode(k, p) {
  key.push(k);
  priority.push(p);
  left.push(NULL);
  right.push(NULL);
  size.push(1);
  return key.length - 1;
}

function sz(t) {
  return t === NULL ? 0 : size[t];
}

function pull(t) {
  size[t] = 1 + sz(left[t]) + sz(right[t]);
}

// --- a treap: keys in search order, random priorities in heap order ------

function split(t, k) {
  // returns [keys < k, keys >= k]
  if (t === NULL) return [NULL, NULL];
  if (key[t] < k) {
    const [a, b] = split(right[t], k);
    right[t] = a;
    pull(t);
    return [t, b];
  }
  const [a, b] = split(left[t], k);
  left[t] = b;
  pull(t);
  return [a, t];
}

function merge(a, b) {
  // every key in a is smaller than every key in b
  if (a === NULL) return b;
  if (b === NULL) return a;
  if (priority[a] > priority[b]) {
    right[a] = merge(right[a], b);
    pull(a);
    return a;
  }
  left[b] = merge(a, left[b]);
  pull(b);
  return b;
}

function treapInsert(root, k, p) {
  const [a, b] = split(root, k);
  return merge(merge(a, newNode(k, p)), b);
}

function treapErase(root, k) {
  const [a, b] = split(root, k);
  let [middle, c] = split(b, k + 1);
  if (middle !== NULL) middle = merge(left[middle], right[middle]); // drop one copy of k
  return merge(merge(a, middle), c);
}

// --- the same augmentation with no balancing at all ----------------------

function plainInsert(root, k) {
  const fresh = newNode(k, 0);
  if (root === NULL) return fresh;
  let t = root;
  for (;;) {
    size[t] += 1;
    if (k < key[t]) {
      if (left[t] === NULL) {
        left[t] = fresh;
        return root;
      }
      t = left[t];
    } else {
      if (right[t] === NULL) {
        right[t] = fresh;
        return root;
      }
      t = right[t];
    }
  }
}

// --- the two queries the size field makes possible -----------------------

function kth(t, k) {
  // the k-th smallest key, counting from zero
  for (;;) {
    steps += 1;
    const below = sz(left[t]);
    if (k < below) {
      t = left[t];
    } else if (k === below) {
      return key[t];
    } else {
      k -= below + 1;
      t = right[t];
    }
  }
}

function countLess(t, x) {
  let count = 0;
  while (t !== NULL) {
    steps += 1;
    if (key[t] < x) {
      count += sz(left[t]) + 1;
      t = right[t];
    } else {
      t = left[t];
    }
  }
  return count;
}

function height(root) {
  let best = 0;
  const stack = root !== NULL ? [[root, 1]] : [];
  while (stack.length > 0) {
    const [node, depth] = stack.pop();
    best = Math.max(best, depth);
    if (left[node] !== NULL) stack.push([left[node], depth + 1]);
    if (right[node] !== NULL) stack.push([right[node], depth + 1]);
  }
  return best;
}

// --- a sorted list as the oracle -----------------------------------------

function lowerBound(items, x) {
  let lo = 0;
  let hi = items.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (items[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// The same linear congruential generator in every language, so the
// operations below are the same whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 45100093n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function pad(s, width) {
  let out = String(s);
  while (out.length < width) out += " ";
  return out;
}

function padLeft(s, width) {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

let root = NULL;
const oracle = [];
let queries = 0;
let matched = 0;
for (let op = 0; op < 6000; op++) {
  const roll = rand(10);
  if (roll < 6) {
    const k = rand(1000);
    root = treapInsert(root, k, rand(32768));
    oracle.splice(lowerBound(oracle, k), 0, k);
  } else if (roll < 8) {
    const k = rand(1000);
    root = treapErase(root, k);
    const at = lowerBound(oracle, k);
    if (at < oracle.length && oracle[at] === k) oracle.splice(at, 1);
  } else if (roll < 9) {
    if (oracle.length > 0) {
      const k = rand(oracle.length);
      queries += 1;
      if (kth(root, k) === oracle[k]) matched += 1;
    }
  } else {
    const x = rand(1000);
    queries += 1;
    if (countLess(root, x) === lowerBound(oracle, x)) matched += 1;
  }
}

console.log("6000 random inserts, deletes, k-th smallest and count-below queries");
console.log("answers that matched a sorted list: " + matched + " of " + queries);
console.log(
  "keys left in the tree: " + oracle.length + ", and the root's size field says " + sz(root),
);
console.log();

const N = 2000;
console.log(N + " keys inserted, then " + N + " k-th smallest queries");
console.log();
console.log("insertion order   tree            height   steps per query");
for (const order of ["random", "sorted"]) {
  const keys = [];
  for (let i = 0; i < N; i++) keys.push(order === "random" ? rand(100000) : i);
  for (const kind of ["no balancing", "treap"]) {
    let tree = NULL;
    for (const k of keys) {
      if (kind === "treap") tree = treapInsert(tree, k, rand(32768));
      else tree = plainInsert(tree, k);
    }
    steps = 0;
    for (let q = 0; q < N; q++) kth(tree, rand(N));
    console.log(
      pad(order, 17) + " " + pad(kind, 15) + " " + padLeft(height(tree), 6) + " " +
        padLeft(Math.floor(steps / N), 17),
    );
  }
}
`,
            },
            {
              lang: "typescript",
              code: `// An order-statistic tree: a binary search tree whose nodes also store the
// size of their subtree, which is enough to find the k-th smallest key and to
// count the keys below a value. Checked against a sorted list, then measured
// with and without balancing.

const NULL = -1;
const key: number[] = [];
const priority: number[] = [];
const left: number[] = [];
const right: number[] = [];
const size: number[] = [];
let steps = 0;

function newNode(k: number, p: number): number {
  key.push(k);
  priority.push(p);
  left.push(NULL);
  right.push(NULL);
  size.push(1);
  return key.length - 1;
}

function sz(t: number): number {
  return t === NULL ? 0 : size[t];
}

function pull(t: number): void {
  size[t] = 1 + sz(left[t]) + sz(right[t]);
}

// --- a treap: keys in search order, random priorities in heap order ------

function split(t: number, k: number): [number, number] {
  // returns [keys < k, keys >= k]
  if (t === NULL) return [NULL, NULL];
  if (key[t] < k) {
    const [a, b] = split(right[t], k);
    right[t] = a;
    pull(t);
    return [t, b];
  }
  const [a, b] = split(left[t], k);
  left[t] = b;
  pull(t);
  return [a, t];
}

function merge(a: number, b: number): number {
  // every key in a is smaller than every key in b
  if (a === NULL) return b;
  if (b === NULL) return a;
  if (priority[a] > priority[b]) {
    right[a] = merge(right[a], b);
    pull(a);
    return a;
  }
  left[b] = merge(a, left[b]);
  pull(b);
  return b;
}

function treapInsert(root: number, k: number, p: number): number {
  const [a, b] = split(root, k);
  return merge(merge(a, newNode(k, p)), b);
}

function treapErase(root: number, k: number): number {
  const [a, b] = split(root, k);
  const parts = split(b, k + 1);
  let middle = parts[0];
  const c = parts[1];
  if (middle !== NULL) middle = merge(left[middle], right[middle]); // drop one copy of k
  return merge(merge(a, middle), c);
}

// --- the same augmentation with no balancing at all ----------------------

function plainInsert(root: number, k: number): number {
  const fresh = newNode(k, 0);
  if (root === NULL) return fresh;
  let t = root;
  for (;;) {
    size[t] += 1;
    if (k < key[t]) {
      if (left[t] === NULL) {
        left[t] = fresh;
        return root;
      }
      t = left[t];
    } else {
      if (right[t] === NULL) {
        right[t] = fresh;
        return root;
      }
      t = right[t];
    }
  }
}

// --- the two queries the size field makes possible -----------------------

function kth(t: number, k: number): number {
  // the k-th smallest key, counting from zero
  for (;;) {
    steps += 1;
    const below = sz(left[t]);
    if (k < below) {
      t = left[t];
    } else if (k === below) {
      return key[t];
    } else {
      k -= below + 1;
      t = right[t];
    }
  }
}

function countLess(t: number, x: number): number {
  let count = 0;
  while (t !== NULL) {
    steps += 1;
    if (key[t] < x) {
      count += sz(left[t]) + 1;
      t = right[t];
    } else {
      t = left[t];
    }
  }
  return count;
}

function height(root: number): number {
  let best = 0;
  const stack: Array<[number, number]> = root !== NULL ? [[root, 1]] : [];
  while (stack.length > 0) {
    const [node, depth] = stack.pop()!;
    best = Math.max(best, depth);
    if (left[node] !== NULL) stack.push([left[node], depth + 1]);
    if (right[node] !== NULL) stack.push([right[node], depth + 1]);
  }
  return best;
}

// --- a sorted list as the oracle -----------------------------------------

function lowerBound(items: number[], x: number): number {
  let lo = 0;
  let hi = items.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (items[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// The same linear congruential generator in every language, so the
// operations below are the same whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 45100093n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function pad(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out += " ";
  return out;
}

function padLeft(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

let root = NULL;
const oracle: number[] = [];
let queries = 0;
let matched = 0;
for (let op = 0; op < 6000; op++) {
  const roll = rand(10);
  if (roll < 6) {
    const k = rand(1000);
    root = treapInsert(root, k, rand(32768));
    oracle.splice(lowerBound(oracle, k), 0, k);
  } else if (roll < 8) {
    const k = rand(1000);
    root = treapErase(root, k);
    const at = lowerBound(oracle, k);
    if (at < oracle.length && oracle[at] === k) oracle.splice(at, 1);
  } else if (roll < 9) {
    if (oracle.length > 0) {
      const k = rand(oracle.length);
      queries += 1;
      if (kth(root, k) === oracle[k]) matched += 1;
    }
  } else {
    const x = rand(1000);
    queries += 1;
    if (countLess(root, x) === lowerBound(oracle, x)) matched += 1;
  }
}

console.log("6000 random inserts, deletes, k-th smallest and count-below queries");
console.log("answers that matched a sorted list: " + matched + " of " + queries);
console.log(
  "keys left in the tree: " + oracle.length + ", and the root's size field says " + sz(root),
);
console.log();

const N = 2000;
console.log(N + " keys inserted, then " + N + " k-th smallest queries");
console.log();
console.log("insertion order   tree            height   steps per query");
for (const order of ["random", "sorted"]) {
  const keys: number[] = [];
  for (let i = 0; i < N; i++) keys.push(order === "random" ? rand(100000) : i);
  for (const kind of ["no balancing", "treap"]) {
    let tree = NULL;
    for (const k of keys) {
      if (kind === "treap") tree = treapInsert(tree, k, rand(32768));
      else tree = plainInsert(tree, k);
    }
    steps = 0;
    for (let q = 0; q < N; q++) kth(tree, rand(N));
    console.log(
      pad(order, 17) + " " + pad(kind, 15) + " " + padLeft(height(tree), 6) + " " +
        padLeft(Math.floor(steps / N), 17),
    );
  }
}
`,
            },
            {
              lang: "java",
              code: `// An order-statistic tree: a binary search tree whose nodes also store the
// size of their subtree, which is enough to find the k-th smallest key and to
// count the keys below a value. Checked against a sorted list, then measured
// with and without balancing.

import java.util.ArrayList;
import java.util.List;

public class Main {
  static final int NULL = -1;
  static int[] key = new int[40000];
  static int[] priority = new int[40000];
  static int[] left = new int[40000];
  static int[] right = new int[40000];
  static int[] size = new int[40000];
  static int nodes = 0;
  static long steps = 0;

  static int newNode(int k, int p) {
    key[nodes] = k;
    priority[nodes] = p;
    left[nodes] = NULL;
    right[nodes] = NULL;
    size[nodes] = 1;
    nodes += 1;
    return nodes - 1;
  }

  static int sz(int t) {
    return t == NULL ? 0 : size[t];
  }

  static void pull(int t) {
    size[t] = 1 + sz(left[t]) + sz(right[t]);
  }

  // --- a treap: keys in search order, random priorities in heap order ------

  // split leaves its two halves here: keys < k, and keys >= k
  static int splitLow = NULL;
  static int splitHigh = NULL;

  static void split(int t, int k) {
    if (t == NULL) {
      splitLow = NULL;
      splitHigh = NULL;
      return;
    }
    if (key[t] < k) {
      split(right[t], k);
      right[t] = splitLow;
      pull(t);
      splitLow = t;
      return;
    }
    split(left[t], k);
    left[t] = splitHigh;
    pull(t);
    splitHigh = t;
  }

  static int merge(int a, int b) {
    // every key in a is smaller than every key in b
    if (a == NULL) {
      return b;
    }
    if (b == NULL) {
      return a;
    }
    if (priority[a] > priority[b]) {
      right[a] = merge(right[a], b);
      pull(a);
      return a;
    }
    left[b] = merge(a, left[b]);
    pull(b);
    return b;
  }

  static int treapInsert(int root, int k, int p) {
    split(root, k);
    int a = splitLow;
    int b = splitHigh;
    return merge(merge(a, newNode(k, p)), b);
  }

  static int treapErase(int root, int k) {
    split(root, k);
    int a = splitLow;
    int b = splitHigh;
    split(b, k + 1);
    int middle = splitLow;
    int c = splitHigh;
    if (middle != NULL) {
      middle = merge(left[middle], right[middle]); // drop one copy of k
    }
    return merge(merge(a, middle), c);
  }

  // --- the same augmentation with no balancing at all ----------------------

  static int plainInsert(int root, int k) {
    int fresh = newNode(k, 0);
    if (root == NULL) {
      return fresh;
    }
    int t = root;
    while (true) {
      size[t] += 1;
      if (k < key[t]) {
        if (left[t] == NULL) {
          left[t] = fresh;
          return root;
        }
        t = left[t];
      } else {
        if (right[t] == NULL) {
          right[t] = fresh;
          return root;
        }
        t = right[t];
      }
    }
  }

  // --- the two queries the size field makes possible -----------------------

  static int kth(int t, int k) {
    // the k-th smallest key, counting from zero
    while (true) {
      steps += 1;
      int below = sz(left[t]);
      if (k < below) {
        t = left[t];
      } else if (k == below) {
        return key[t];
      } else {
        k -= below + 1;
        t = right[t];
      }
    }
  }

  static int countLess(int t, int x) {
    int count = 0;
    while (t != NULL) {
      steps += 1;
      if (key[t] < x) {
        count += sz(left[t]) + 1;
        t = right[t];
      } else {
        t = left[t];
      }
    }
    return count;
  }

  static int height(int root) {
    int best = 0;
    List<int[]> stack = new ArrayList<>();
    if (root != NULL) {
      stack.add(new int[] {root, 1});
    }
    while (!stack.isEmpty()) {
      int[] top = stack.remove(stack.size() - 1);
      best = Math.max(best, top[1]);
      if (left[top[0]] != NULL) {
        stack.add(new int[] {left[top[0]], top[1] + 1});
      }
      if (right[top[0]] != NULL) {
        stack.add(new int[] {right[top[0]], top[1] + 1});
      }
    }
    return best;
  }

  // --- a sorted list as the oracle -----------------------------------------

  static int lowerBound(List<Integer> items, int x) {
    int lo = 0;
    int hi = items.size();
    while (lo < hi) {
      int mid = (lo + hi) / 2;
      if (items.get(mid) < x) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo;
  }

  // The same linear congruential generator in every language, so the
  // operations below are the same whichever translation is run.
  static long seed = 45100093L;

  static int rand(int n) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return (int) (seed / 65536L % n);
  }

  public static void main(String[] args) {
    int root = NULL;
    List<Integer> oracle = new ArrayList<>();
    int queries = 0;
    int matched = 0;
    for (int op = 0; op < 6000; op++) {
      int roll = rand(10);
      if (roll < 6) {
        int k = rand(1000);
        root = treapInsert(root, k, rand(32768));
        oracle.add(lowerBound(oracle, k), k);
      } else if (roll < 8) {
        int k = rand(1000);
        root = treapErase(root, k);
        int at = lowerBound(oracle, k);
        if (at < oracle.size() && oracle.get(at) == k) {
          oracle.remove(at);
        }
      } else if (roll < 9) {
        if (oracle.size() > 0) {
          int k = rand(oracle.size());
          queries += 1;
          if (kth(root, k) == oracle.get(k)) {
            matched += 1;
          }
        }
      } else {
        int x = rand(1000);
        queries += 1;
        if (countLess(root, x) == lowerBound(oracle, x)) {
          matched += 1;
        }
      }
    }

    System.out.println("6000 random inserts, deletes, k-th smallest and count-below queries");
    System.out.printf("answers that matched a sorted list: %d of %d%n", matched, queries);
    System.out.printf(
        "keys left in the tree: %d, and the root's size field says %d%n", oracle.size(), sz(root));
    System.out.println();

    final int n = 2000;
    System.out.printf("%d keys inserted, then %d k-th smallest queries%n", n, n);
    System.out.println();
    System.out.println("insertion order   tree            height   steps per query");
    String[] orders = {"random", "sorted"};
    String[] kinds = {"no balancing", "treap"};
    for (String order : orders) {
      int[] keys = new int[n];
      for (int i = 0; i < n; i++) {
        keys[i] = order.equals("random") ? rand(100000) : i;
      }
      for (String kind : kinds) {
        int tree = NULL;
        for (int k : keys) {
          if (kind.equals("treap")) {
            tree = treapInsert(tree, k, rand(32768));
          } else {
            tree = plainInsert(tree, k);
          }
        }
        steps = 0;
        for (int q = 0; q < n; q++) {
          kth(tree, rand(n));
        }
        System.out.printf("%-17s %-15s %6d %17d%n", order, kind, height(tree), steps / n);
      }
    }
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// An order-statistic tree: a binary search tree whose nodes also store the
// size of their subtree, which is enough to find the k-th smallest key and to
// count the keys below a value. Checked against a sorted list, then measured
// with and without balancing.

#include <algorithm>
#include <cstdio>
#include <string>
#include <utility>
#include <vector>

static const int NIL = -1;
std::vector<int> key;
std::vector<int> priority;
std::vector<int> leftOf;
std::vector<int> rightOf;
std::vector<int> sizeOf;
long long steps = 0;

int newNode(int k, int p) {
  key.push_back(k);
  priority.push_back(p);
  leftOf.push_back(NIL);
  rightOf.push_back(NIL);
  sizeOf.push_back(1);
  return (int)key.size() - 1;
}

int sz(int t) {
  return t == NIL ? 0 : sizeOf[t];
}

void pull(int t) {
  sizeOf[t] = 1 + sz(leftOf[t]) + sz(rightOf[t]);
}

// --- a treap: keys in search order, random priorities in heap order ------

std::pair<int, int> split(int t, int k) {
  // returns (keys < k, keys >= k)
  if (t == NIL) {
    return std::make_pair(NIL, NIL);
  }
  if (key[t] < k) {
    std::pair<int, int> parts = split(rightOf[t], k);
    rightOf[t] = parts.first;
    pull(t);
    return std::make_pair(t, parts.second);
  }
  std::pair<int, int> parts = split(leftOf[t], k);
  leftOf[t] = parts.second;
  pull(t);
  return std::make_pair(parts.first, t);
}

int merge(int a, int b) {
  // every key in a is smaller than every key in b
  if (a == NIL) {
    return b;
  }
  if (b == NIL) {
    return a;
  }
  if (priority[a] > priority[b]) {
    int joined = merge(rightOf[a], b);
    rightOf[a] = joined;
    pull(a);
    return a;
  }
  int joined = merge(a, leftOf[b]);
  leftOf[b] = joined;
  pull(b);
  return b;
}

int treapInsert(int root, int k, int p) {
  std::pair<int, int> parts = split(root, k);
  int fresh = newNode(k, p);
  return merge(merge(parts.first, fresh), parts.second);
}

int treapErase(int root, int k) {
  std::pair<int, int> outer = split(root, k);
  std::pair<int, int> inner = split(outer.second, k + 1);
  int middle = inner.first;
  if (middle != NIL) {
    middle = merge(leftOf[middle], rightOf[middle]);  // drop one copy of k
  }
  return merge(merge(outer.first, middle), inner.second);
}

// --- the same augmentation with no balancing at all ----------------------

int plainInsert(int root, int k) {
  int fresh = newNode(k, 0);
  if (root == NIL) {
    return fresh;
  }
  int t = root;
  while (true) {
    sizeOf[t] += 1;
    if (k < key[t]) {
      if (leftOf[t] == NIL) {
        leftOf[t] = fresh;
        return root;
      }
      t = leftOf[t];
    } else {
      if (rightOf[t] == NIL) {
        rightOf[t] = fresh;
        return root;
      }
      t = rightOf[t];
    }
  }
}

// --- the two queries the size field makes possible -----------------------

int kth(int t, int k) {
  // the k-th smallest key, counting from zero
  while (true) {
    steps += 1;
    int below = sz(leftOf[t]);
    if (k < below) {
      t = leftOf[t];
    } else if (k == below) {
      return key[t];
    } else {
      k -= below + 1;
      t = rightOf[t];
    }
  }
}

int countLess(int t, int x) {
  int count = 0;
  while (t != NIL) {
    steps += 1;
    if (key[t] < x) {
      count += sz(leftOf[t]) + 1;
      t = rightOf[t];
    } else {
      t = leftOf[t];
    }
  }
  return count;
}

int height(int root) {
  int best = 0;
  std::vector<std::pair<int, int> > stack;
  if (root != NIL) {
    stack.push_back(std::make_pair(root, 1));
  }
  while (!stack.empty()) {
    std::pair<int, int> top = stack.back();
    stack.pop_back();
    best = std::max(best, top.second);
    if (leftOf[top.first] != NIL) {
      stack.push_back(std::make_pair(leftOf[top.first], top.second + 1));
    }
    if (rightOf[top.first] != NIL) {
      stack.push_back(std::make_pair(rightOf[top.first], top.second + 1));
    }
  }
  return best;
}

// --- a sorted list as the oracle -----------------------------------------

int lowerBound(const std::vector<int>& items, int x) {
  int lo = 0;
  int hi = (int)items.size();
  while (lo < hi) {
    int mid = (lo + hi) / 2;
    if (items[mid] < x) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

// The same linear congruential generator in every language, so the
// operations below are the same whichever translation is run.
long long seed = 45100093LL;

int rand_below(int n) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return (int)(seed / 65536LL % n);
}

int main() {
  int root = NIL;
  std::vector<int> oracle;
  int queries = 0;
  int matched = 0;
  for (int op = 0; op < 6000; op++) {
    int roll = rand_below(10);
    if (roll < 6) {
      int k = rand_below(1000);
      int p = rand_below(32768);
      root = treapInsert(root, k, p);
      oracle.insert(oracle.begin() + lowerBound(oracle, k), k);
    } else if (roll < 8) {
      int k = rand_below(1000);
      root = treapErase(root, k);
      int at = lowerBound(oracle, k);
      if (at < (int)oracle.size() && oracle[at] == k) {
        oracle.erase(oracle.begin() + at);
      }
    } else if (roll < 9) {
      if (!oracle.empty()) {
        int k = rand_below((int)oracle.size());
        queries += 1;
        if (kth(root, k) == oracle[k]) {
          matched += 1;
        }
      }
    } else {
      int x = rand_below(1000);
      queries += 1;
      if (countLess(root, x) == lowerBound(oracle, x)) {
        matched += 1;
      }
    }
  }

  std::printf("6000 random inserts, deletes, k-th smallest and count-below queries\\n");
  std::printf("answers that matched a sorted list: %d of %d\\n", matched, queries);
  std::printf("keys left in the tree: %d, and the root's size field says %d\\n", (int)oracle.size(),
              sz(root));
  std::printf("\\n");

  const int n = 2000;
  std::printf("%d keys inserted, then %d k-th smallest queries\\n", n, n);
  std::printf("\\n");
  std::printf("insertion order   tree            height   steps per query\\n");
  const char* orders[2] = {"random", "sorted"};
  const char* kinds[2] = {"no balancing", "treap"};
  for (const char* order : orders) {
    std::vector<int> keys;
    for (int i = 0; i < n; i++) {
      keys.push_back(std::string(order) == "random" ? rand_below(100000) : i);
    }
    for (const char* kind : kinds) {
      int tree = NIL;
      for (int k : keys) {
        if (std::string(kind) == "treap") {
          int p = rand_below(32768);
          tree = treapInsert(tree, k, p);
        } else {
          tree = plainInsert(tree, k);
        }
      }
      steps = 0;
      for (int q = 0; q < n; q++) {
        kth(tree, rand_below(n));
      }
      std::printf("%-17s %-15s %6d %17lld\\n", order, kind, height(tree), steps / n);
    }
  }
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// An order-statistic tree: a binary search tree whose nodes also store the
// size of their subtree, which is enough to find the k-th smallest key and to
// count the keys below a value. Checked against a sorted list, then measured
// with and without balancing.

const NULL: i32 = -1;

struct Forest {
    key: Vec<i64>,
    priority: Vec<i64>,
    left: Vec<i32>,
    right: Vec<i32>,
    size: Vec<i64>,
    steps: i64,
}

impl Forest {
    fn new_node(&mut self, k: i64, p: i64) -> i32 {
        self.key.push(k);
        self.priority.push(p);
        self.left.push(NULL);
        self.right.push(NULL);
        self.size.push(1);
        self.key.len() as i32 - 1
    }

    fn sz(&self, t: i32) -> i64 {
        if t == NULL {
            0
        } else {
            self.size[t as usize]
        }
    }

    fn pull(&mut self, t: i32) {
        let u = t as usize;
        self.size[u] = 1 + self.sz(self.left[u]) + self.sz(self.right[u]);
    }

    // --- a treap: keys in search order, random priorities in heap order ------

    fn split(&mut self, t: i32, k: i64) -> (i32, i32) {
        // returns (keys < k, keys >= k)
        if t == NULL {
            return (NULL, NULL);
        }
        let u = t as usize;
        if self.key[u] < k {
            let (a, b) = self.split(self.right[u], k);
            self.right[u] = a;
            self.pull(t);
            return (t, b);
        }
        let (a, b) = self.split(self.left[u], k);
        self.left[u] = b;
        self.pull(t);
        (a, t)
    }

    fn merge(&mut self, a: i32, b: i32) -> i32 {
        // every key in a is smaller than every key in b
        if a == NULL {
            return b;
        }
        if b == NULL {
            return a;
        }
        if self.priority[a as usize] > self.priority[b as usize] {
            let joined = self.merge(self.right[a as usize], b);
            self.right[a as usize] = joined;
            self.pull(a);
            return a;
        }
        let joined = self.merge(a, self.left[b as usize]);
        self.left[b as usize] = joined;
        self.pull(b);
        b
    }

    fn treap_insert(&mut self, root: i32, k: i64, p: i64) -> i32 {
        let (a, b) = self.split(root, k);
        let fresh = self.new_node(k, p);
        let low = self.merge(a, fresh);
        self.merge(low, b)
    }

    fn treap_erase(&mut self, root: i32, k: i64) -> i32 {
        let (a, b) = self.split(root, k);
        let (mut middle, c) = self.split(b, k + 1);
        if middle != NULL {
            let m = middle as usize;
            middle = self.merge(self.left[m], self.right[m]); // drop one copy of k
        }
        let low = self.merge(a, middle);
        self.merge(low, c)
    }

    // --- the same augmentation with no balancing at all ----------------------

    fn plain_insert(&mut self, root: i32, k: i64) -> i32 {
        let fresh = self.new_node(k, 0);
        if root == NULL {
            return fresh;
        }
        let mut t = root as usize;
        loop {
            self.size[t] += 1;
            if k < self.key[t] {
                if self.left[t] == NULL {
                    self.left[t] = fresh;
                    return root;
                }
                t = self.left[t] as usize;
            } else {
                if self.right[t] == NULL {
                    self.right[t] = fresh;
                    return root;
                }
                t = self.right[t] as usize;
            }
        }
    }

    // --- the two queries the size field makes possible -----------------------

    fn kth(&mut self, root: i32, index: i64) -> i64 {
        // the k-th smallest key, counting from zero
        let mut t = root;
        let mut k = index;
        loop {
            self.steps += 1;
            let u = t as usize;
            let below = self.sz(self.left[u]);
            if k < below {
                t = self.left[u];
            } else if k == below {
                return self.key[u];
            } else {
                k -= below + 1;
                t = self.right[u];
            }
        }
    }

    fn count_less(&mut self, root: i32, x: i64) -> i64 {
        let mut count = 0;
        let mut t = root;
        while t != NULL {
            self.steps += 1;
            let u = t as usize;
            if self.key[u] < x {
                count += self.sz(self.left[u]) + 1;
                t = self.right[u];
            } else {
                t = self.left[u];
            }
        }
        count
    }

    fn height(&self, root: i32) -> i64 {
        let mut best = 0;
        let mut stack: Vec<(i32, i64)> = Vec::new();
        if root != NULL {
            stack.push((root, 1));
        }
        while let Some((node, depth)) = stack.pop() {
            best = best.max(depth);
            let u = node as usize;
            if self.left[u] != NULL {
                stack.push((self.left[u], depth + 1));
            }
            if self.right[u] != NULL {
                stack.push((self.right[u], depth + 1));
            }
        }
        best
    }
}

// --- a sorted list as the oracle -----------------------------------------

fn lower_bound(items: &[i64], x: i64) -> usize {
    let mut lo = 0;
    let mut hi = items.len();
    while lo < hi {
        let mid = (lo + hi) / 2;
        if items[mid] < x {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }
    lo
}

// The same linear congruential generator in every language, so the
// operations below are the same whichever translation is run.
static mut SEED: i64 = 45100093;

fn rand_below(n: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % n
    }
}

fn main() {
    let mut f = Forest {
        key: Vec::new(),
        priority: Vec::new(),
        left: Vec::new(),
        right: Vec::new(),
        size: Vec::new(),
        steps: 0,
    };
    let mut root = NULL;
    let mut oracle: Vec<i64> = Vec::new();
    let mut queries = 0;
    let mut matched = 0;
    for _ in 0..6000 {
        let roll = rand_below(10);
        if roll < 6 {
            let k = rand_below(1000);
            let p = rand_below(32768);
            root = f.treap_insert(root, k, p);
            let at = lower_bound(&oracle, k);
            oracle.insert(at, k);
        } else if roll < 8 {
            let k = rand_below(1000);
            root = f.treap_erase(root, k);
            let at = lower_bound(&oracle, k);
            if at < oracle.len() && oracle[at] == k {
                oracle.remove(at);
            }
        } else if roll < 9 {
            if !oracle.is_empty() {
                let k = rand_below(oracle.len() as i64);
                queries += 1;
                if f.kth(root, k) == oracle[k as usize] {
                    matched += 1;
                }
            }
        } else {
            let x = rand_below(1000);
            queries += 1;
            if f.count_less(root, x) == lower_bound(&oracle, x) as i64 {
                matched += 1;
            }
        }
    }

    println!("6000 random inserts, deletes, k-th smallest and count-below queries");
    println!("answers that matched a sorted list: {} of {}", matched, queries);
    println!(
        "keys left in the tree: {}, and the root's size field says {}",
        oracle.len(),
        f.sz(root)
    );
    println!();

    let n: i64 = 2000;
    println!("{} keys inserted, then {} k-th smallest queries", n, n);
    println!();
    println!("insertion order   tree            height   steps per query");
    for order in ["random", "sorted"].iter() {
        let mut keys: Vec<i64> = Vec::new();
        for i in 0..n {
            keys.push(if *order == "random" { rand_below(100000) } else { i });
        }
        for kind in ["no balancing", "treap"].iter() {
            let mut tree = NULL;
            for &k in keys.iter() {
                if *kind == "treap" {
                    let p = rand_below(32768);
                    tree = f.treap_insert(tree, k, p);
                } else {
                    tree = f.plain_insert(tree, k);
                }
            }
            f.steps = 0;
            for _ in 0..n {
                let k = rand_below(n);
                f.kth(tree, k);
            }
            println!("{:<17} {:<15} {:>6} {:>17}", order, kind, f.height(tree), f.steps / n);
        }
    }
}
`,
            },
            {
              lang: "go",
              code: `// An order-statistic tree: a binary search tree whose nodes also store the
// size of their subtree, which is enough to find the k-th smallest key and to
// count the keys below a value. Checked against a sorted list, then measured
// with and without balancing.

package main

import "fmt"

const null = -1

var key []int
var priority []int
var left []int
var right []int
var size []int
var steps int

func newNode(k, p int) int {
	key = append(key, k)
	priority = append(priority, p)
	left = append(left, null)
	right = append(right, null)
	size = append(size, 1)
	return len(key) - 1
}

func sz(t int) int {
	if t == null {
		return 0
	}
	return size[t]
}

func pull(t int) {
	size[t] = 1 + sz(left[t]) + sz(right[t])
}

// --- a treap: keys in search order, random priorities in heap order ------

func split(t, k int) (int, int) {
	// returns (keys < k, keys >= k)
	if t == null {
		return null, null
	}
	if key[t] < k {
		a, b := split(right[t], k)
		right[t] = a
		pull(t)
		return t, b
	}
	a, b := split(left[t], k)
	left[t] = b
	pull(t)
	return a, t
}

func merge(a, b int) int {
	// every key in a is smaller than every key in b
	if a == null {
		return b
	}
	if b == null {
		return a
	}
	if priority[a] > priority[b] {
		joined := merge(right[a], b)
		right[a] = joined
		pull(a)
		return a
	}
	joined := merge(a, left[b])
	left[b] = joined
	pull(b)
	return b
}

func treapInsert(root, k, p int) int {
	a, b := split(root, k)
	fresh := newNode(k, p)
	return merge(merge(a, fresh), b)
}

func treapErase(root, k int) int {
	a, b := split(root, k)
	middle, c := split(b, k+1)
	if middle != null {
		middle = merge(left[middle], right[middle]) // drop one copy of k
	}
	return merge(merge(a, middle), c)
}

// --- the same augmentation with no balancing at all ----------------------

func plainInsert(root, k int) int {
	fresh := newNode(k, 0)
	if root == null {
		return fresh
	}
	t := root
	for {
		size[t]++
		if k < key[t] {
			if left[t] == null {
				left[t] = fresh
				return root
			}
			t = left[t]
		} else {
			if right[t] == null {
				right[t] = fresh
				return root
			}
			t = right[t]
		}
	}
}

// --- the two queries the size field makes possible -----------------------

func kth(t, k int) int {
	// the k-th smallest key, counting from zero
	for {
		steps++
		below := sz(left[t])
		if k < below {
			t = left[t]
		} else if k == below {
			return key[t]
		} else {
			k -= below + 1
			t = right[t]
		}
	}
}

func countLess(t, x int) int {
	count := 0
	for t != null {
		steps++
		if key[t] < x {
			count += sz(left[t]) + 1
			t = right[t]
		} else {
			t = left[t]
		}
	}
	return count
}

func height(root int) int {
	best := 0
	stack := [][2]int{}
	if root != null {
		stack = append(stack, [2]int{root, 1})
	}
	for len(stack) > 0 {
		top := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		best = max(best, top[1])
		if left[top[0]] != null {
			stack = append(stack, [2]int{left[top[0]], top[1] + 1})
		}
		if right[top[0]] != null {
			stack = append(stack, [2]int{right[top[0]], top[1] + 1})
		}
	}
	return best
}

// --- a sorted list as the oracle -----------------------------------------

func lowerBound(items []int, x int) int {
	lo := 0
	hi := len(items)
	for lo < hi {
		mid := (lo + hi) / 2
		if items[mid] < x {
			lo = mid + 1
		} else {
			hi = mid
		}
	}
	return lo
}

// The same linear congruential generator in every language, so the
// operations below are the same whichever translation is run.
var seed int64 = 45100093

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	root := null
	oracle := []int{}
	queries := 0
	matched := 0
	for op := 0; op < 6000; op++ {
		roll := randBelow(10)
		if roll < 6 {
			k := randBelow(1000)
			p := randBelow(32768)
			root = treapInsert(root, k, p)
			at := lowerBound(oracle, k)
			oracle = append(oracle, 0)
			copy(oracle[at+1:], oracle[at:])
			oracle[at] = k
		} else if roll < 8 {
			k := randBelow(1000)
			root = treapErase(root, k)
			at := lowerBound(oracle, k)
			if at < len(oracle) && oracle[at] == k {
				oracle = append(oracle[:at], oracle[at+1:]...)
			}
		} else if roll < 9 {
			if len(oracle) > 0 {
				k := randBelow(len(oracle))
				queries++
				if kth(root, k) == oracle[k] {
					matched++
				}
			}
		} else {
			x := randBelow(1000)
			queries++
			if countLess(root, x) == lowerBound(oracle, x) {
				matched++
			}
		}
	}

	fmt.Println("6000 random inserts, deletes, k-th smallest and count-below queries")
	fmt.Printf("answers that matched a sorted list: %d of %d\\n", matched, queries)
	fmt.Printf("keys left in the tree: %d, and the root's size field says %d\\n", len(oracle), sz(root))
	fmt.Println()

	const n = 2000
	fmt.Printf("%d keys inserted, then %d k-th smallest queries\\n", n, n)
	fmt.Println()
	fmt.Println("insertion order   tree            height   steps per query")
	for _, order := range []string{"random", "sorted"} {
		keys := make([]int, n)
		for i := range keys {
			if order == "random" {
				keys[i] = randBelow(100000)
			} else {
				keys[i] = i
			}
		}
		for _, kind := range []string{"no balancing", "treap"} {
			tree := null
			for _, k := range keys {
				if kind == "treap" {
					p := randBelow(32768)
					tree = treapInsert(tree, k, p)
				} else {
					tree = plainInsert(tree, k)
				}
			}
			steps = 0
			for q := 0; q < n; q++ {
				kth(tree, randBelow(n))
			}
			fmt.Printf("%-17s %-15s %6d %17d\\n", order, kind, height(tree), steps/n)
		}
	}
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "what-balancing-buys",
      heading: "What balancing buys",
      body: [
        "The random-order rows are the part of the measurement worth reading carefully. A plain search tree built from randomly ordered keys has expected height `O(log n)` already, and here it came out slightly shallower than the treap.",
        "So balancing does not make operations faster on friendly input. It makes the cost **independent of the input order**. Sorted or nearly sorted insertions are common in practice \u2014 timestamps, auto-increment IDs, keys read from a sorted file \u2014 and those are exactly the orders that turn an unbalanced tree into a list.",
        "A treap gets that guarantee with the simplest code of the balanced trees, in expectation over its random priorities. AVL and red-black trees guarantee logarithmic height deterministically with rotations; the size field is maintained the same way in all of them.",
      ],
    },
    {
      id: "in-practice",
      heading: "What languages provide",
      body: [
        "Most standard library ordered maps are balanced trees without a size field, so they answer lookups and ordered iteration but not k-th or rank in logarithmic time.",
        "**C++**: GCC's policy-based `tree` with `tree_order_statistics_node_update` provides `find_by_order` (k-th) and `order_of_key` (rank). **Java**: `TreeMap` and `TreeSet` have no rank operation; `headSet(x).size()` is linear. **Python**: the standard library has no balanced tree; the third-party `sortedcontainers.SortedList` provides indexing and `bisect` in roughly logarithmic time.",
        "When the full set of possible keys is known in advance, a Fenwick tree over the compressed key positions answers the same two queries: rank is a prefix count, and k-th is a descending walk over the tree's powers of two. It is shorter to write than a treap and usually faster.",
      ],
      pitfalls: [
        {
          title: "Forgetting to update size in one operation",
          body: "Split, merge, rotation and delete each restructure subtrees. Missing the recomputation in one of them gives k-th answers that are wrong only after that operation has run.",
        },
        {
          title: "Recursion on an unbalanced tree",
          body: "A recursive walk on the sorted-insertion chain recurses 2,000 deep. Use iterative walks, or balance the tree.",
        },
        {
          title: "Assuming balancing speeds up random input",
          body: "Measured on random order: height 25 unbalanced, 29 for the treap. Balancing protects against bad orders; it does not improve good ones.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you find the k-th smallest element in a dynamic set?",
      answer:
        "Augment a balanced search tree with subtree sizes. At each node, compare k with the size of the left subtree: go left if smaller, return the node if equal, otherwise subtract the left size plus one and go right. Rank is the same walk, adding the left size plus one whenever you go right. Every insert, delete, split, merge or rotation recomputes sizes. I checked a treap implementation against a sorted list over 6,000 random operations and all 1,203 k-th and rank answers matched. If the keys are known in advance, a Fenwick tree over compressed keys does the same job.",
    },
    {
      question: "What does a balanced tree actually buy you?",
      answer:
        "Independence from insertion order, not speed on good input. I inserted 2,000 keys both ways. Sorted order without balancing produced a chain of height 2,000 with 973 steps per k-th query; a treap on the same keys had height 26 and 13 steps. On random order the unbalanced tree already had height 25 and 12 steps, and the treap was slightly worse at 29 and 13. Sorted and nearly sorted insertions are common in real data, which is why the guarantee matters.",
    },
  ],
  takeaways: [
    "size = 1 + size(left) + size(right), recomputed on every structural change",
    "k-th and rank are single walks guided by left-subtree size",
    "A treap is search order on keys and heap order on random priorities",
    "Split and merge implement insert and delete",
    "Measured sorted insertion: height 2,000 and 973 steps unbalanced, 26 and 13 treap",
    "Measured random insertion: balancing gave no improvement",
    "C++ policy-based tree has order statistics; Java TreeMap does not",
  ],
};
