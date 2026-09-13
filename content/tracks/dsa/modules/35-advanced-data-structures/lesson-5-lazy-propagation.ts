import type { Lesson } from "@/content/types";

export const lazyPropagationLesson: Lesson = {
  id: "dsa-advanced-structures-lazy-propagation",
  slug: "lazy-propagation",
  moduleSlug: "advanced-data-structures",
  title: "Lazy Propagation: Range Updates on a Segment Tree",
  summary:
    "Updating a range one element at a time costs the length of the range times the depth. Recording a pending change at each fully covered node and passing it down only when needed costs about the same as a query. Measured at n = 4,096: 13,916 nodes per range add without it, 39 with it.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Say why point updates cannot implement range updates efficiently",
    "Implement a pending tag, the push-down step, and range add with range sum",
    "Measure the cost of range updates with and without lazy tags",
    "Combine two kinds of pending update, such as assign and add",
  ],
  sections: [
    {
      id: "the-cost",
      heading: "Range updates as point updates",
      body: [
        "A segment tree absorbs a point update in one root-to-leaf path. Adding a value to every position in `[l, r]` with point updates repeats that path for each of the `r - l + 1` positions, so a range update costs `O(k log n)` for a range of length `k`, which is `O(n log n)` for a large range.",
        "The fix rests on one observation. A node whose whole range lies inside the update does not need its descendants changed **now** \u2014 only its own stored value, plus a note that its children owe the same change. The note is applied later, and only if something descends below that node.",
      ],
    },
    {
      id: "the-mechanism",
      heading: "The tag and push-down",
      body: [
        "Each node gets a `lazy` field holding the pending change for its children. For range add with range sum:",
        "**Fully covered node during an update**: add `delta \u00d7 (hi - lo + 1)` to its sum, add `delta` to its lazy field, and return without visiting children. Multiplying by the range length is specific to sum; for a range minimum with range add, the minimum simply increases by `delta`.",
        "**Push-down**, before descending from a node: if its lazy field is non-zero, apply it to both children \u2014 each child's sum grows by the lazy value times its own length, and each child's lazy field accumulates it \u2014 then clear the parent's field.",
        "**Partially covered node** during an update or a query: push down, recurse into both children, and for updates recompute the node from its children.",
        "The invariant: a node's stored value is always correct for its range, including every pending change above it that has been pushed to it. Values below a node with a non-zero tag may be stale, and nothing reads them before a push-down refreshes them.",
      ],
      examples: [
        {
          id: "range-add-with-and-without-lazy",
          title: "Range add and range sum, point by point against lazy tags, checked against a plain array",
          lang: "python",
          code: `# Adding a value to a whole range, then asking for a range sum. Without lazy
# propagation a range update is one point update per element; with it, a
# node that is entirely covered records the pending add and stops.

visited = [0]


def build(tree, node, lo, hi, values):
    if lo == hi:
        tree[node] = values[lo]
        return
    mid = (lo + hi) // 2
    build(tree, 2 * node, lo, mid, values)
    build(tree, 2 * node + 1, mid + 1, hi, values)
    tree[node] = tree[2 * node] + tree[2 * node + 1]


# --- range add as one point update per element ---------------------------

def point_add(tree, node, lo, hi, index, delta):
    visited[0] += 1
    tree[node] += delta
    if lo == hi:
        return
    mid = (lo + hi) // 2
    if index <= mid:
        point_add(tree, 2 * node, lo, mid, index, delta)
    else:
        point_add(tree, 2 * node + 1, mid + 1, hi, index, delta)


def plain_sum(tree, node, lo, hi, left, right):
    visited[0] += 1
    if right < lo or hi < left:
        return 0
    if left <= lo and hi <= right:
        return tree[node]
    mid = (lo + hi) // 2
    return (plain_sum(tree, 2 * node, lo, mid, left, right)
            + plain_sum(tree, 2 * node + 1, mid + 1, hi, left, right))


# --- range add with a pending value per node ------------------------------

def push_down(tree, lazy, node, lo, hi):
    if lazy[node] != 0:
        mid = (lo + hi) // 2
        for child, size in ((2 * node, mid - lo + 1), (2 * node + 1, hi - mid)):
            tree[child] += lazy[node] * size
            lazy[child] += lazy[node]
        lazy[node] = 0


def lazy_add(tree, lazy, node, lo, hi, left, right, delta):
    visited[0] += 1
    if right < lo or hi < left:
        return
    if left <= lo and hi <= right:
        tree[node] += delta * (hi - lo + 1)   # the whole node gets delta
        lazy[node] += delta                   # its children are told later
        return
    push_down(tree, lazy, node, lo, hi)
    mid = (lo + hi) // 2
    lazy_add(tree, lazy, 2 * node, lo, mid, left, right, delta)
    lazy_add(tree, lazy, 2 * node + 1, mid + 1, hi, left, right, delta)
    tree[node] = tree[2 * node] + tree[2 * node + 1]


def lazy_sum(tree, lazy, node, lo, hi, left, right):
    visited[0] += 1
    if right < lo or hi < left:
        return 0
    if left <= lo and hi <= right:
        return tree[node]
    push_down(tree, lazy, node, lo, hi)
    mid = (lo + hi) // 2
    return (lazy_sum(tree, lazy, 2 * node, lo, mid, left, right)
            + lazy_sum(tree, lazy, 2 * node + 1, mid + 1, hi, left, right))


# The same linear congruential generator in every language, so the
# operations below are the same whichever translation is run.
seed = 90210071


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


OPS = 200
print("%d random range adds, each followed by a random range sum" % OPS)
print()
print("         n   answers right   nodes per range add       nodes per range sum")
print("                              point by point   lazy   point by point   lazy")
for n in [256, 1024, 4096]:
    values = [rand(100) for _ in range(n)]
    truth = list(values)
    plain = [0] * (4 * n)
    tree = [0] * (4 * n)
    lazy = [0] * (4 * n)
    build(plain, 1, 0, n - 1, values)
    build(tree, 1, 0, n - 1, values)
    cost = [0, 0, 0, 0]
    right_answers = 0
    for _ in range(OPS):
        left = rand(n)
        right = left + rand(n - left)
        delta = rand(21) - 10
        for i in range(left, right + 1):
            truth[i] += delta
        visited[0] = 0
        for i in range(left, right + 1):
            point_add(plain, 1, 0, n - 1, i, delta)
        cost[0] += visited[0]
        visited[0] = 0
        lazy_add(tree, lazy, 1, 0, n - 1, left, right, delta)
        cost[1] += visited[0]

        left = rand(n)
        right = left + rand(n - left)
        expected = 0
        for i in range(left, right + 1):
            expected += truth[i]
        visited[0] = 0
        a = plain_sum(plain, 1, 0, n - 1, left, right)
        cost[2] += visited[0]
        visited[0] = 0
        b = lazy_sum(tree, lazy, 1, 0, n - 1, left, right)
        cost[3] += visited[0]
        if a == expected and b == expected:
            right_answers += 1
    print("%10d %11d/%d %16d %6d %16d %6d"
          % (n, right_answers, OPS, cost[0] // OPS, cost[1] // OPS, cost[2] // OPS, cost[3] // OPS))
`,
          output: `200 random range adds, each followed by a random range sum

         n   answers right   nodes per range add       nodes per range sum
                              point by point   lazy   point by point   lazy
       256         200/200              533     23               23     23
      1024         200/200             2786     31               31     31
      4096         200/200            13916     39               40     40`,
          explanation:
            "Both trees gave the right sum after all 200 operations at every size. The difference is entirely in the update. Point by point, a range add visited 533 nodes at n = 256, 2,786 at 1,024 and 13,916 at 4,096 \u2014 roughly the average range length times the depth. With lazy tags it visited 23, 31 and 39, the same order as a query. Range sums cost 23, 31 and 40 in both trees, so lazy propagation made updates as cheap as queries without making queries more expensive.",
          alternates: [
            {
              lang: "javascript",
              code: `// Adding a value to a whole range, then asking for a range sum. Without lazy
// propagation a range update is one point update per element; with it, a
// node that is entirely covered records the pending add and stops.

let visited = 0;

function build(tree, node, lo, hi, values) {
  if (lo === hi) {
    tree[node] = values[lo];
    return;
  }
  const mid = Math.floor((lo + hi) / 2);
  build(tree, 2 * node, lo, mid, values);
  build(tree, 2 * node + 1, mid + 1, hi, values);
  tree[node] = tree[2 * node] + tree[2 * node + 1];
}

// --- range add as one point update per element ---------------------------

function pointAdd(tree, node, lo, hi, index, delta) {
  visited += 1;
  tree[node] += delta;
  if (lo === hi) return;
  const mid = Math.floor((lo + hi) / 2);
  if (index <= mid) pointAdd(tree, 2 * node, lo, mid, index, delta);
  else pointAdd(tree, 2 * node + 1, mid + 1, hi, index, delta);
}

function plainSum(tree, node, lo, hi, left, right) {
  visited += 1;
  if (right < lo || hi < left) return 0;
  if (left <= lo && hi <= right) return tree[node];
  const mid = Math.floor((lo + hi) / 2);
  return (
    plainSum(tree, 2 * node, lo, mid, left, right) +
    plainSum(tree, 2 * node + 1, mid + 1, hi, left, right)
  );
}

// --- range add with a pending value per node ------------------------------

function pushDown(tree, lazy, node, lo, hi) {
  if (lazy[node] !== 0) {
    const mid = Math.floor((lo + hi) / 2);
    const children = [
      [2 * node, mid - lo + 1],
      [2 * node + 1, hi - mid],
    ];
    for (const [child, size] of children) {
      tree[child] += lazy[node] * size;
      lazy[child] += lazy[node];
    }
    lazy[node] = 0;
  }
}

function lazyAdd(tree, lazy, node, lo, hi, left, right, delta) {
  visited += 1;
  if (right < lo || hi < left) return;
  if (left <= lo && hi <= right) {
    tree[node] += delta * (hi - lo + 1); // the whole node gets delta
    lazy[node] += delta; // its children are told later
    return;
  }
  pushDown(tree, lazy, node, lo, hi);
  const mid = Math.floor((lo + hi) / 2);
  lazyAdd(tree, lazy, 2 * node, lo, mid, left, right, delta);
  lazyAdd(tree, lazy, 2 * node + 1, mid + 1, hi, left, right, delta);
  tree[node] = tree[2 * node] + tree[2 * node + 1];
}

function lazySum(tree, lazy, node, lo, hi, left, right) {
  visited += 1;
  if (right < lo || hi < left) return 0;
  if (left <= lo && hi <= right) return tree[node];
  pushDown(tree, lazy, node, lo, hi);
  const mid = Math.floor((lo + hi) / 2);
  return (
    lazySum(tree, lazy, 2 * node, lo, mid, left, right) +
    lazySum(tree, lazy, 2 * node + 1, mid + 1, hi, left, right)
  );
}

// The same linear congruential generator in every language, so the
// operations below are the same whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 90210071n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function padLeft(s, width) {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

const OPS = 200;
console.log(OPS + " random range adds, each followed by a random range sum");
console.log();
console.log("         n   answers right   nodes per range add       nodes per range sum");
console.log("                              point by point   lazy   point by point   lazy");
for (const n of [256, 1024, 4096]) {
  const values = [];
  for (let i = 0; i < n; i++) values.push(rand(100));
  const truth = values.slice();
  const plain = new Array(4 * n).fill(0);
  const tree = new Array(4 * n).fill(0);
  const lazy = new Array(4 * n).fill(0);
  build(plain, 1, 0, n - 1, values);
  build(tree, 1, 0, n - 1, values);
  const cost = [0, 0, 0, 0];
  let rightAnswers = 0;
  for (let o = 0; o < OPS; o++) {
    let left = rand(n);
    let right = left + rand(n - left);
    const delta = rand(21) - 10;
    for (let i = left; i <= right; i++) truth[i] += delta;
    visited = 0;
    for (let i = left; i <= right; i++) pointAdd(plain, 1, 0, n - 1, i, delta);
    cost[0] += visited;
    visited = 0;
    lazyAdd(tree, lazy, 1, 0, n - 1, left, right, delta);
    cost[1] += visited;

    left = rand(n);
    right = left + rand(n - left);
    let expected = 0;
    for (let i = left; i <= right; i++) expected += truth[i];
    visited = 0;
    const a = plainSum(plain, 1, 0, n - 1, left, right);
    cost[2] += visited;
    visited = 0;
    const b = lazySum(tree, lazy, 1, 0, n - 1, left, right);
    cost[3] += visited;
    if (a === expected && b === expected) rightAnswers += 1;
  }
  console.log(
    padLeft(n, 10) + " " + padLeft(rightAnswers, 11) + "/" + OPS + " " +
      padLeft(Math.floor(cost[0] / OPS), 16) + " " + padLeft(Math.floor(cost[1] / OPS), 6) + " " +
      padLeft(Math.floor(cost[2] / OPS), 16) + " " + padLeft(Math.floor(cost[3] / OPS), 6),
  );
}
`,
            },
            {
              lang: "typescript",
              code: `// Adding a value to a whole range, then asking for a range sum. Without lazy
// propagation a range update is one point update per element; with it, a
// node that is entirely covered records the pending add and stops.

let visited = 0;

function build(tree: number[], node: number, lo: number, hi: number, values: number[]): void {
  if (lo === hi) {
    tree[node] = values[lo];
    return;
  }
  const mid = Math.floor((lo + hi) / 2);
  build(tree, 2 * node, lo, mid, values);
  build(tree, 2 * node + 1, mid + 1, hi, values);
  tree[node] = tree[2 * node] + tree[2 * node + 1];
}

// --- range add as one point update per element ---------------------------

function pointAdd(
  tree: number[],
  node: number,
  lo: number,
  hi: number,
  index: number,
  delta: number,
): void {
  visited += 1;
  tree[node] += delta;
  if (lo === hi) return;
  const mid = Math.floor((lo + hi) / 2);
  if (index <= mid) pointAdd(tree, 2 * node, lo, mid, index, delta);
  else pointAdd(tree, 2 * node + 1, mid + 1, hi, index, delta);
}

function plainSum(
  tree: number[],
  node: number,
  lo: number,
  hi: number,
  left: number,
  right: number,
): number {
  visited += 1;
  if (right < lo || hi < left) return 0;
  if (left <= lo && hi <= right) return tree[node];
  const mid = Math.floor((lo + hi) / 2);
  return (
    plainSum(tree, 2 * node, lo, mid, left, right) +
    plainSum(tree, 2 * node + 1, mid + 1, hi, left, right)
  );
}

// --- range add with a pending value per node ------------------------------

function pushDown(tree: number[], lazy: number[], node: number, lo: number, hi: number): void {
  if (lazy[node] !== 0) {
    const mid = Math.floor((lo + hi) / 2);
    const children: Array<[number, number]> = [
      [2 * node, mid - lo + 1],
      [2 * node + 1, hi - mid],
    ];
    for (const [child, size] of children) {
      tree[child] += lazy[node] * size;
      lazy[child] += lazy[node];
    }
    lazy[node] = 0;
  }
}

function lazyAdd(
  tree: number[],
  lazy: number[],
  node: number,
  lo: number,
  hi: number,
  left: number,
  right: number,
  delta: number,
): void {
  visited += 1;
  if (right < lo || hi < left) return;
  if (left <= lo && hi <= right) {
    tree[node] += delta * (hi - lo + 1); // the whole node gets delta
    lazy[node] += delta; // its children are told later
    return;
  }
  pushDown(tree, lazy, node, lo, hi);
  const mid = Math.floor((lo + hi) / 2);
  lazyAdd(tree, lazy, 2 * node, lo, mid, left, right, delta);
  lazyAdd(tree, lazy, 2 * node + 1, mid + 1, hi, left, right, delta);
  tree[node] = tree[2 * node] + tree[2 * node + 1];
}

function lazySum(
  tree: number[],
  lazy: number[],
  node: number,
  lo: number,
  hi: number,
  left: number,
  right: number,
): number {
  visited += 1;
  if (right < lo || hi < left) return 0;
  if (left <= lo && hi <= right) return tree[node];
  pushDown(tree, lazy, node, lo, hi);
  const mid = Math.floor((lo + hi) / 2);
  return (
    lazySum(tree, lazy, 2 * node, lo, mid, left, right) +
    lazySum(tree, lazy, 2 * node + 1, mid + 1, hi, left, right)
  );
}

// The same linear congruential generator in every language, so the
// operations below are the same whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 90210071n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function padLeft(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

const OPS = 200;
console.log(OPS + " random range adds, each followed by a random range sum");
console.log();
console.log("         n   answers right   nodes per range add       nodes per range sum");
console.log("                              point by point   lazy   point by point   lazy");
for (const n of [256, 1024, 4096]) {
  const values: number[] = [];
  for (let i = 0; i < n; i++) values.push(rand(100));
  const truth = values.slice();
  const plain = new Array(4 * n).fill(0);
  const tree = new Array(4 * n).fill(0);
  const lazy = new Array(4 * n).fill(0);
  build(plain, 1, 0, n - 1, values);
  build(tree, 1, 0, n - 1, values);
  const cost = [0, 0, 0, 0];
  let rightAnswers = 0;
  for (let o = 0; o < OPS; o++) {
    let left = rand(n);
    let right = left + rand(n - left);
    const delta = rand(21) - 10;
    for (let i = left; i <= right; i++) truth[i] += delta;
    visited = 0;
    for (let i = left; i <= right; i++) pointAdd(plain, 1, 0, n - 1, i, delta);
    cost[0] += visited;
    visited = 0;
    lazyAdd(tree, lazy, 1, 0, n - 1, left, right, delta);
    cost[1] += visited;

    left = rand(n);
    right = left + rand(n - left);
    let expected = 0;
    for (let i = left; i <= right; i++) expected += truth[i];
    visited = 0;
    const a = plainSum(plain, 1, 0, n - 1, left, right);
    cost[2] += visited;
    visited = 0;
    const b = lazySum(tree, lazy, 1, 0, n - 1, left, right);
    cost[3] += visited;
    if (a === expected && b === expected) rightAnswers += 1;
  }
  console.log(
    padLeft(n, 10) + " " + padLeft(rightAnswers, 11) + "/" + OPS + " " +
      padLeft(Math.floor(cost[0] / OPS), 16) + " " + padLeft(Math.floor(cost[1] / OPS), 6) + " " +
      padLeft(Math.floor(cost[2] / OPS), 16) + " " + padLeft(Math.floor(cost[3] / OPS), 6),
  );
}
`,
            },
            {
              lang: "java",
              code: `// Adding a value to a whole range, then asking for a range sum. Without lazy
// propagation a range update is one point update per element; with it, a
// node that is entirely covered records the pending add and stops.

public class Main {
  static long visited = 0;

  static void build(long[] tree, int node, int lo, int hi, long[] values) {
    if (lo == hi) {
      tree[node] = values[lo];
      return;
    }
    int mid = (lo + hi) / 2;
    build(tree, 2 * node, lo, mid, values);
    build(tree, 2 * node + 1, mid + 1, hi, values);
    tree[node] = tree[2 * node] + tree[2 * node + 1];
  }

  // --- range add as one point update per element ---------------------------

  static void pointAdd(long[] tree, int node, int lo, int hi, int index, long delta) {
    visited += 1;
    tree[node] += delta;
    if (lo == hi) {
      return;
    }
    int mid = (lo + hi) / 2;
    if (index <= mid) {
      pointAdd(tree, 2 * node, lo, mid, index, delta);
    } else {
      pointAdd(tree, 2 * node + 1, mid + 1, hi, index, delta);
    }
  }

  static long plainSum(long[] tree, int node, int lo, int hi, int left, int right) {
    visited += 1;
    if (right < lo || hi < left) {
      return 0;
    }
    if (left <= lo && hi <= right) {
      return tree[node];
    }
    int mid = (lo + hi) / 2;
    return plainSum(tree, 2 * node, lo, mid, left, right)
        + plainSum(tree, 2 * node + 1, mid + 1, hi, left, right);
  }

  // --- range add with a pending value per node ------------------------------

  static void pushDown(long[] tree, long[] lazy, int node, int lo, int hi) {
    if (lazy[node] != 0) {
      int mid = (lo + hi) / 2;
      tree[2 * node] += lazy[node] * (mid - lo + 1);
      lazy[2 * node] += lazy[node];
      tree[2 * node + 1] += lazy[node] * (hi - mid);
      lazy[2 * node + 1] += lazy[node];
      lazy[node] = 0;
    }
  }

  static void lazyAdd(
      long[] tree, long[] lazy, int node, int lo, int hi, int left, int right, long delta) {
    visited += 1;
    if (right < lo || hi < left) {
      return;
    }
    if (left <= lo && hi <= right) {
      tree[node] += delta * (hi - lo + 1); // the whole node gets delta
      lazy[node] += delta; // its children are told later
      return;
    }
    pushDown(tree, lazy, node, lo, hi);
    int mid = (lo + hi) / 2;
    lazyAdd(tree, lazy, 2 * node, lo, mid, left, right, delta);
    lazyAdd(tree, lazy, 2 * node + 1, mid + 1, hi, left, right, delta);
    tree[node] = tree[2 * node] + tree[2 * node + 1];
  }

  static long lazySum(long[] tree, long[] lazy, int node, int lo, int hi, int left, int right) {
    visited += 1;
    if (right < lo || hi < left) {
      return 0;
    }
    if (left <= lo && hi <= right) {
      return tree[node];
    }
    pushDown(tree, lazy, node, lo, hi);
    int mid = (lo + hi) / 2;
    return lazySum(tree, lazy, 2 * node, lo, mid, left, right)
        + lazySum(tree, lazy, 2 * node + 1, mid + 1, hi, left, right);
  }

  // The same linear congruential generator in every language, so the
  // operations below are the same whichever translation is run.
  static long seed = 90210071L;

  static int rand(int n) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return (int) (seed / 65536L % n);
  }

  public static void main(String[] args) {
    final int ops = 200;
    System.out.printf("%d random range adds, each followed by a random range sum%n", ops);
    System.out.println();
    System.out.println("         n   answers right   nodes per range add       nodes per range sum");
    System.out.println("                              point by point   lazy   point by point   lazy");
    int[] sizes = {256, 1024, 4096};
    for (int n : sizes) {
      long[] values = new long[n];
      for (int i = 0; i < n; i++) {
        values[i] = rand(100);
      }
      long[] truth = values.clone();
      long[] plain = new long[4 * n];
      long[] tree = new long[4 * n];
      long[] lazy = new long[4 * n];
      build(plain, 1, 0, n - 1, values);
      build(tree, 1, 0, n - 1, values);
      long[] cost = new long[4];
      int rightAnswers = 0;
      for (int o = 0; o < ops; o++) {
        int left = rand(n);
        int right = left + rand(n - left);
        long delta = rand(21) - 10;
        for (int i = left; i <= right; i++) {
          truth[i] += delta;
        }
        visited = 0;
        for (int i = left; i <= right; i++) {
          pointAdd(plain, 1, 0, n - 1, i, delta);
        }
        cost[0] += visited;
        visited = 0;
        lazyAdd(tree, lazy, 1, 0, n - 1, left, right, delta);
        cost[1] += visited;

        left = rand(n);
        right = left + rand(n - left);
        long expected = 0;
        for (int i = left; i <= right; i++) {
          expected += truth[i];
        }
        visited = 0;
        long a = plainSum(plain, 1, 0, n - 1, left, right);
        cost[2] += visited;
        visited = 0;
        long b = lazySum(tree, lazy, 1, 0, n - 1, left, right);
        cost[3] += visited;
        if (a == expected && b == expected) {
          rightAnswers += 1;
        }
      }
      System.out.printf(
          "%10d %11d/%d %16d %6d %16d %6d%n",
          n, rightAnswers, ops, cost[0] / ops, cost[1] / ops, cost[2] / ops, cost[3] / ops);
    }
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// Adding a value to a whole range, then asking for a range sum. Without lazy
// propagation a range update is one point update per element; with it, a
// node that is entirely covered records the pending add and stops.

#include <cstdio>
#include <vector>

typedef std::vector<long long> Vec;

long long visited = 0;

void build(Vec& tree, int node, int lo, int hi, const Vec& values) {
  if (lo == hi) {
    tree[node] = values[lo];
    return;
  }
  int mid = (lo + hi) / 2;
  build(tree, 2 * node, lo, mid, values);
  build(tree, 2 * node + 1, mid + 1, hi, values);
  tree[node] = tree[2 * node] + tree[2 * node + 1];
}

// --- range add as one point update per element ---------------------------

void pointAdd(Vec& tree, int node, int lo, int hi, int index, long long delta) {
  visited += 1;
  tree[node] += delta;
  if (lo == hi) {
    return;
  }
  int mid = (lo + hi) / 2;
  if (index <= mid) {
    pointAdd(tree, 2 * node, lo, mid, index, delta);
  } else {
    pointAdd(tree, 2 * node + 1, mid + 1, hi, index, delta);
  }
}

long long plainSum(const Vec& tree, int node, int lo, int hi, int left, int right) {
  visited += 1;
  if (right < lo || hi < left) {
    return 0;
  }
  if (left <= lo && hi <= right) {
    return tree[node];
  }
  int mid = (lo + hi) / 2;
  return plainSum(tree, 2 * node, lo, mid, left, right) +
         plainSum(tree, 2 * node + 1, mid + 1, hi, left, right);
}

// --- range add with a pending value per node ------------------------------

void pushDown(Vec& tree, Vec& lazy, int node, int lo, int hi) {
  if (lazy[node] != 0) {
    int mid = (lo + hi) / 2;
    tree[2 * node] += lazy[node] * (mid - lo + 1);
    lazy[2 * node] += lazy[node];
    tree[2 * node + 1] += lazy[node] * (hi - mid);
    lazy[2 * node + 1] += lazy[node];
    lazy[node] = 0;
  }
}

void lazyAdd(Vec& tree, Vec& lazy, int node, int lo, int hi, int left, int right,
             long long delta) {
  visited += 1;
  if (right < lo || hi < left) {
    return;
  }
  if (left <= lo && hi <= right) {
    tree[node] += delta * (hi - lo + 1);  // the whole node gets delta
    lazy[node] += delta;                  // its children are told later
    return;
  }
  pushDown(tree, lazy, node, lo, hi);
  int mid = (lo + hi) / 2;
  lazyAdd(tree, lazy, 2 * node, lo, mid, left, right, delta);
  lazyAdd(tree, lazy, 2 * node + 1, mid + 1, hi, left, right, delta);
  tree[node] = tree[2 * node] + tree[2 * node + 1];
}

long long lazySum(Vec& tree, Vec& lazy, int node, int lo, int hi, int left, int right) {
  visited += 1;
  if (right < lo || hi < left) {
    return 0;
  }
  if (left <= lo && hi <= right) {
    return tree[node];
  }
  pushDown(tree, lazy, node, lo, hi);
  int mid = (lo + hi) / 2;
  return lazySum(tree, lazy, 2 * node, lo, mid, left, right) +
         lazySum(tree, lazy, 2 * node + 1, mid + 1, hi, left, right);
}

// The same linear congruential generator in every language, so the
// operations below are the same whichever translation is run.
long long seed = 90210071LL;

int rand_below(int n) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return (int)(seed / 65536LL % n);
}

int main() {
  const int ops = 200;
  std::printf("%d random range adds, each followed by a random range sum\\n", ops);
  std::printf("\\n");
  std::printf("         n   answers right   nodes per range add       nodes per range sum\\n");
  std::printf("                              point by point   lazy   point by point   lazy\\n");
  int sizes[3] = {256, 1024, 4096};
  for (int n : sizes) {
    Vec values;
    for (int i = 0; i < n; i++) {
      values.push_back(rand_below(100));
    }
    Vec truth = values;
    Vec plain(4 * n, 0);
    Vec tree(4 * n, 0);
    Vec lazy(4 * n, 0);
    build(plain, 1, 0, n - 1, values);
    build(tree, 1, 0, n - 1, values);
    long long cost[4] = {0, 0, 0, 0};
    int rightAnswers = 0;
    for (int o = 0; o < ops; o++) {
      int left = rand_below(n);
      int right = left + rand_below(n - left);
      long long delta = rand_below(21) - 10;
      for (int i = left; i <= right; i++) {
        truth[i] += delta;
      }
      visited = 0;
      for (int i = left; i <= right; i++) {
        pointAdd(plain, 1, 0, n - 1, i, delta);
      }
      cost[0] += visited;
      visited = 0;
      lazyAdd(tree, lazy, 1, 0, n - 1, left, right, delta);
      cost[1] += visited;

      left = rand_below(n);
      right = left + rand_below(n - left);
      long long expected = 0;
      for (int i = left; i <= right; i++) {
        expected += truth[i];
      }
      visited = 0;
      long long a = plainSum(plain, 1, 0, n - 1, left, right);
      cost[2] += visited;
      visited = 0;
      long long b = lazySum(tree, lazy, 1, 0, n - 1, left, right);
      cost[3] += visited;
      if (a == expected && b == expected) {
        rightAnswers += 1;
      }
    }
    std::printf("%10d %11d/%d %16lld %6lld %16lld %6lld\\n", n, rightAnswers, ops, cost[0] / ops,
                cost[1] / ops, cost[2] / ops, cost[3] / ops);
  }
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Adding a value to a whole range, then asking for a range sum. Without lazy
// propagation a range update is one point update per element; with it, a
// node that is entirely covered records the pending add and stops.

fn build(tree: &mut [i64], node: usize, lo: usize, hi: usize, values: &[i64]) {
    if lo == hi {
        tree[node] = values[lo];
        return;
    }
    let mid = (lo + hi) / 2;
    build(tree, 2 * node, lo, mid, values);
    build(tree, 2 * node + 1, mid + 1, hi, values);
    tree[node] = tree[2 * node] + tree[2 * node + 1];
}

// --- range add as one point update per element ---------------------------

fn point_add(tree: &mut [i64], node: usize, lo: usize, hi: usize, index: usize, delta: i64, visited: &mut i64) {
    *visited += 1;
    tree[node] += delta;
    if lo == hi {
        return;
    }
    let mid = (lo + hi) / 2;
    if index <= mid {
        point_add(tree, 2 * node, lo, mid, index, delta, visited);
    } else {
        point_add(tree, 2 * node + 1, mid + 1, hi, index, delta, visited);
    }
}

fn plain_sum(tree: &[i64], node: usize, lo: usize, hi: usize, left: usize, right: usize, visited: &mut i64) -> i64 {
    *visited += 1;
    if right < lo || hi < left {
        return 0;
    }
    if left <= lo && hi <= right {
        return tree[node];
    }
    let mid = (lo + hi) / 2;
    plain_sum(tree, 2 * node, lo, mid, left, right, visited)
        + plain_sum(tree, 2 * node + 1, mid + 1, hi, left, right, visited)
}

// --- range add with a pending value per node ------------------------------

struct Lazy {
    tree: Vec<i64>,
    pending: Vec<i64>,
    visited: i64,
}

impl Lazy {
    fn push_down(&mut self, node: usize, lo: usize, hi: usize) {
        if self.pending[node] != 0 {
            let mid = (lo + hi) / 2;
            let add = self.pending[node];
            self.tree[2 * node] += add * (mid - lo + 1) as i64;
            self.pending[2 * node] += add;
            self.tree[2 * node + 1] += add * (hi - mid) as i64;
            self.pending[2 * node + 1] += add;
            self.pending[node] = 0;
        }
    }

    fn add(&mut self, node: usize, lo: usize, hi: usize, left: usize, right: usize, delta: i64) {
        self.visited += 1;
        if right < lo || hi < left {
            return;
        }
        if left <= lo && hi <= right {
            self.tree[node] += delta * (hi - lo + 1) as i64; // the whole node gets delta
            self.pending[node] += delta; // its children are told later
            return;
        }
        self.push_down(node, lo, hi);
        let mid = (lo + hi) / 2;
        self.add(2 * node, lo, mid, left, right, delta);
        self.add(2 * node + 1, mid + 1, hi, left, right, delta);
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1];
    }

    fn sum(&mut self, node: usize, lo: usize, hi: usize, left: usize, right: usize) -> i64 {
        self.visited += 1;
        if right < lo || hi < left {
            return 0;
        }
        if left <= lo && hi <= right {
            return self.tree[node];
        }
        self.push_down(node, lo, hi);
        let mid = (lo + hi) / 2;
        self.sum(2 * node, lo, mid, left, right) + self.sum(2 * node + 1, mid + 1, hi, left, right)
    }
}

// The same linear congruential generator in every language, so the
// operations below are the same whichever translation is run.
static mut SEED: i64 = 90210071;

fn rand_below(n: usize) -> usize {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        (SEED / 65536 % n as i64) as usize
    }
}

fn main() {
    let ops: i64 = 200;
    println!("{} random range adds, each followed by a random range sum", ops);
    println!();
    println!("         n   answers right   nodes per range add       nodes per range sum");
    println!("                              point by point   lazy   point by point   lazy");
    for &n in [256usize, 1024, 4096].iter() {
        let values: Vec<i64> = (0..n).map(|_| rand_below(100) as i64).collect();
        let mut truth = values.clone();
        let mut plain = vec![0i64; 4 * n];
        build(&mut plain, 1, 0, n - 1, &values);
        let mut lazy = Lazy { tree: vec![0; 4 * n], pending: vec![0; 4 * n], visited: 0 };
        build(&mut lazy.tree, 1, 0, n - 1, &values);
        let mut cost = [0i64; 4];
        let mut right_answers = 0;
        for _ in 0..ops {
            let mut left = rand_below(n);
            let mut right = left + rand_below(n - left);
            let delta = rand_below(21) as i64 - 10;
            for i in left..=right {
                truth[i] += delta;
            }
            let mut visited = 0;
            for i in left..=right {
                point_add(&mut plain, 1, 0, n - 1, i, delta, &mut visited);
            }
            cost[0] += visited;
            lazy.visited = 0;
            lazy.add(1, 0, n - 1, left, right, delta);
            cost[1] += lazy.visited;

            left = rand_below(n);
            right = left + rand_below(n - left);
            let mut expected = 0;
            for i in left..=right {
                expected += truth[i];
            }
            visited = 0;
            let a = plain_sum(&plain, 1, 0, n - 1, left, right, &mut visited);
            cost[2] += visited;
            lazy.visited = 0;
            let b = lazy.sum(1, 0, n - 1, left, right);
            cost[3] += lazy.visited;
            if a == expected && b == expected {
                right_answers += 1;
            }
        }
        println!(
            "{:>10} {:>11}/{} {:>16} {:>6} {:>16} {:>6}",
            n,
            right_answers,
            ops,
            cost[0] / ops,
            cost[1] / ops,
            cost[2] / ops,
            cost[3] / ops
        );
    }
}
`,
            },
            {
              lang: "go",
              code: `// Adding a value to a whole range, then asking for a range sum. Without lazy
// propagation a range update is one point update per element; with it, a
// node that is entirely covered records the pending add and stops.

package main

import "fmt"

var visited int64

func build(tree []int64, node, lo, hi int, values []int64) {
	if lo == hi {
		tree[node] = values[lo]
		return
	}
	mid := (lo + hi) / 2
	build(tree, 2*node, lo, mid, values)
	build(tree, 2*node+1, mid+1, hi, values)
	tree[node] = tree[2*node] + tree[2*node+1]
}

// --- range add as one point update per element ---------------------------

func pointAdd(tree []int64, node, lo, hi, index int, delta int64) {
	visited++
	tree[node] += delta
	if lo == hi {
		return
	}
	mid := (lo + hi) / 2
	if index <= mid {
		pointAdd(tree, 2*node, lo, mid, index, delta)
	} else {
		pointAdd(tree, 2*node+1, mid+1, hi, index, delta)
	}
}

func plainSum(tree []int64, node, lo, hi, left, right int) int64 {
	visited++
	if right < lo || hi < left {
		return 0
	}
	if left <= lo && hi <= right {
		return tree[node]
	}
	mid := (lo + hi) / 2
	return plainSum(tree, 2*node, lo, mid, left, right) + plainSum(tree, 2*node+1, mid+1, hi, left, right)
}

// --- range add with a pending value per node ------------------------------

func pushDown(tree, lazy []int64, node, lo, hi int) {
	if lazy[node] != 0 {
		mid := (lo + hi) / 2
		tree[2*node] += lazy[node] * int64(mid-lo+1)
		lazy[2*node] += lazy[node]
		tree[2*node+1] += lazy[node] * int64(hi-mid)
		lazy[2*node+1] += lazy[node]
		lazy[node] = 0
	}
}

func lazyAdd(tree, lazy []int64, node, lo, hi, left, right int, delta int64) {
	visited++
	if right < lo || hi < left {
		return
	}
	if left <= lo && hi <= right {
		tree[node] += delta * int64(hi-lo+1) // the whole node gets delta
		lazy[node] += delta                  // its children are told later
		return
	}
	pushDown(tree, lazy, node, lo, hi)
	mid := (lo + hi) / 2
	lazyAdd(tree, lazy, 2*node, lo, mid, left, right, delta)
	lazyAdd(tree, lazy, 2*node+1, mid+1, hi, left, right, delta)
	tree[node] = tree[2*node] + tree[2*node+1]
}

func lazySum(tree, lazy []int64, node, lo, hi, left, right int) int64 {
	visited++
	if right < lo || hi < left {
		return 0
	}
	if left <= lo && hi <= right {
		return tree[node]
	}
	pushDown(tree, lazy, node, lo, hi)
	mid := (lo + hi) / 2
	return lazySum(tree, lazy, 2*node, lo, mid, left, right) + lazySum(tree, lazy, 2*node+1, mid+1, hi, left, right)
}

// The same linear congruential generator in every language, so the
// operations below are the same whichever translation is run.
var seed int64 = 90210071

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	const ops = 200
	fmt.Printf("%d random range adds, each followed by a random range sum\\n", ops)
	fmt.Println()
	fmt.Println("         n   answers right   nodes per range add       nodes per range sum")
	fmt.Println("                              point by point   lazy   point by point   lazy")
	for _, n := range []int{256, 1024, 4096} {
		values := make([]int64, n)
		for i := range values {
			values[i] = int64(randBelow(100))
		}
		truth := append([]int64{}, values...)
		plain := make([]int64, 4*n)
		tree := make([]int64, 4*n)
		lazy := make([]int64, 4*n)
		build(plain, 1, 0, n-1, values)
		build(tree, 1, 0, n-1, values)
		var cost [4]int64
		rightAnswers := 0
		for o := 0; o < ops; o++ {
			left := randBelow(n)
			right := left + randBelow(n-left)
			delta := int64(randBelow(21) - 10)
			for i := left; i <= right; i++ {
				truth[i] += delta
			}
			visited = 0
			for i := left; i <= right; i++ {
				pointAdd(plain, 1, 0, n-1, i, delta)
			}
			cost[0] += visited
			visited = 0
			lazyAdd(tree, lazy, 1, 0, n-1, left, right, delta)
			cost[1] += visited

			left = randBelow(n)
			right = left + randBelow(n-left)
			var expected int64
			for i := left; i <= right; i++ {
				expected += truth[i]
			}
			visited = 0
			a := plainSum(plain, 1, 0, n-1, left, right)
			cost[2] += visited
			visited = 0
			b := lazySum(tree, lazy, 1, 0, n-1, left, right)
			cost[3] += visited
			if a == expected && b == expected {
				rightAnswers++
			}
		}
		fmt.Printf("%10d %11d/%d %16d %6d %16d %6d\\n", n, rightAnswers, ops, cost[0]/ops, cost[1]/ops, cost[2]/ops, cost[3]/ops)
	}
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "two-kinds",
      heading: "Two kinds of pending update",
      body: [
        "Problems that mix **assign a range to a value** with **add to a range** need two tags per node, and the order in which they apply matters.",
        "An assignment overrides everything before it, including earlier adds. So when an assignment arrives at a node, set the assign tag and **clear** the add tag. When an add arrives at a node that already has an assign tag, fold it into the assignment value instead of recording a separate add.",
        "Push-down then applies the assign tag first, if present, and the add tag second. With that rule a node never holds an add that should have been erased by a later assignment.",
        "The general version: a pending tag is a function applied to the node's value, and tags must **compose**. Assign-then-add composes into assign; add-then-add into a larger add; add-then-assign into assign. If two kinds of update do not compose into a single tag of bounded size, lazy propagation does not apply.",
      ],
      pitfalls: [
        {
          title: "Skipping push-down in the query",
          body: "A query that descends below a tagged node reads children that have not received the pending change. Push down on every partial overlap, in updates and in queries.",
        },
        {
          title: "Using the length factor for the wrong aggregate",
          body: "For sum, a covered node grows by delta times its length. For minimum or maximum it grows by delta. Using the length for min, or omitting it for sum, gives wrong answers that pass small tests.",
        },
        {
          title: "Recording an add on top of an assign as a separate tag",
          body: "The push-down order then decides whether the add survives, and one of the two orders is wrong. Fold adds into an existing assignment.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you support range updates on a segment tree?",
      answer:
        "Lazy propagation. A node whose range is entirely inside the update gets its own value corrected and a pending tag recording what its children still owe, and the update stops there. Before any update or query descends from a node, a push-down applies its tag to both children and clears it. For range add with range sum a covered node's sum grows by delta times its length. I measured it against doing the range as point updates: at n = 4,096 a range add visited 13,916 nodes point by point and 39 with lazy tags, while range sums cost about 40 in both.",
    },
    {
      question: "How do you handle both range assignment and range addition?",
      answer:
        "Two tags per node with a fixed composition rule. An assignment overrides earlier adds, so arriving at a node it sets the assign tag and clears the add tag; an add arriving at a node that has an assign tag is folded into the assigned value. Push-down applies assign first, then add. In general, lazy tags have to compose into one tag of bounded size -- add then add is an add, anything then assign is an assign -- and if the update types do not compose that way, lazy propagation is not the right tool.",
    },
  ],
  takeaways: [
    "Range update by point updates costs the range length times the depth",
    "A fully covered node updates itself, records a tag, and stops",
    "Push down before descending, in updates and in queries",
    "Measured at n = 4,096: 13,916 nodes per range add point by point, 39 lazy",
    "Sum grows by delta times length; min and max grow by delta",
    "Assign clears pending adds; adds fold into a pending assign",
    "Tags must compose into one bounded tag",
  ],
};
