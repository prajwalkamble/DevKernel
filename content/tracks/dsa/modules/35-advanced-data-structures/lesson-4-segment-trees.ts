import type { Lesson } from "@/content/types";

export const segmentTreesLesson: Lesson = {
  id: "dsa-advanced-structures-segment-trees",
  slug: "segment-trees",
  moduleSlug: "advanced-data-structures",
  title: "Segment Trees: Range Query, Point Update",
  summary:
    "A binary tree over index ranges answers any associative range query and absorbs point updates in logarithmic time. Measured: a prefix minimum standing in for a range minimum was right on 885 of 3,000 ranges; the segment tree was right on all 3,000 and never visited more than 55 nodes at n = 16,384.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Build a segment tree for any associative operation with an identity",
    "Implement the three-case range query and the point update",
    "Explain the bound on nodes visited, and check it against measurement",
    "Design a node that stores more than one value to answer harder queries",
  ],
  sections: [
    {
      id: "why",
      heading: "What prefix structures cannot do",
      body: [
        "Prefix arrays and Fenwick trees answer a range as the difference of two prefixes. That works only when the operation can be undone. Minimum, maximum, greatest common divisor and many others cannot: knowing the smallest value up to position `r` says nothing about the smallest value from `l` to `r` unless that smallest value happens to lie in the range.",
        "A segment tree avoids subtraction entirely. It stores the answer for a fixed set of ranges and assembles any query range from a few of them. The only requirements are that the operation is **associative** and has an **identity** \u2014 a value that leaves any answer unchanged, such as infinity for minimum and 0 for sum.",
      ],
    },
    {
      id: "the-tree",
      heading: "The tree and its operations",
      body: [
        "The root covers the whole array `[0, n-1]`. A node covering `[lo, hi]` with `lo < hi` has a left child covering `[lo, mid]` and a right child covering `[mid+1, hi]`, where `mid = (lo + hi) / 2`. Leaves cover one position. Each node stores the operation applied to its range.",
        "Stored in an array with the root at index 1 and children of `i` at `2i` and `2i + 1`, the tree needs up to `4n` cells when `n` is not a power of two.",
        "**Point update**: descend to the leaf, set it, and recompute every ancestor on the way back up from its two children. One path, `O(log n)` nodes.",
        "**Range query** `[l, r]` at a node covering `[lo, hi]` has three cases. No overlap: return the identity. Fully inside: return the stored value without descending. Partial overlap: query both children and combine.",
      ],
      examples: [
        {
          id: "segment-tree-range-minimum",
          title: "A segment tree against a prefix minimum, and nodes visited per query",
          lang: "python",
          code: `# Range minimum with point updates. A prefix array cannot do it, because a
# minimum cannot be subtracted back out. A segment tree can, and the nodes
# one query visits are counted against the bound usually quoted for it.

INF = 1 << 30
visited = [0]


def build(tree, values, node, lo, hi):
    if lo == hi:
        tree[node] = values[lo]
        return
    mid = (lo + hi) // 2
    build(tree, values, 2 * node, lo, mid)
    build(tree, values, 2 * node + 1, mid + 1, hi)
    tree[node] = min(tree[2 * node], tree[2 * node + 1])


def update(tree, node, lo, hi, index, value):
    if lo == hi:
        tree[node] = value
        return
    mid = (lo + hi) // 2
    if index <= mid:
        update(tree, 2 * node, lo, mid, index, value)
    else:
        update(tree, 2 * node + 1, mid + 1, hi, index, value)
    tree[node] = min(tree[2 * node], tree[2 * node + 1])


def query(tree, node, lo, hi, left, right):
    visited[0] += 1
    if right < lo or hi < left:
        return INF                      # no overlap: nothing here
    if left <= lo and hi <= right:
        return tree[node]               # fully inside: stop descending
    mid = (lo + hi) // 2
    a = query(tree, 2 * node, lo, mid, left, right)
    b = query(tree, 2 * node + 1, mid + 1, hi, left, right)
    return min(a, b)


def slow_min(values, left, right):
    best = INF
    for i in range(left, right + 1):
        best = min(best, values[i])
    return best


# The same linear congruential generator in every language, so the arrays
# and queries below are the same whichever translation is run.
seed = 17300041


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


N = 1000
TRIALS = 3000
values = [rand(1000) for _ in range(N)]
tree = [0] * (4 * N)
build(tree, values, 1, 0, N - 1)

tree_right = 0
for _ in range(TRIALS):
    i = rand(N)
    values[i] = rand(1000)
    update(tree, 1, 0, N - 1, i, values[i])
    left = rand(N)
    right = left + rand(N - left)
    if query(tree, 1, 0, N - 1, left, right) == slow_min(values, left, right):
        tree_right += 1

# a prefix minimum knows the smallest value up to each index, which answers
# a range only if that smallest value happens to lie inside the range
prefix_min = []
running = INF
for v in values:
    running = min(running, v)
    prefix_min.append(running)
prefix_right = 0
from_zero = 0
for _ in range(TRIALS):
    left = rand(N)
    right = left + rand(N - left)
    if left == 0:
        from_zero += 1
    if prefix_min[right] == slow_min(values, left, right):
        prefix_right += 1

print("an array of %d values, %d random ranges" % (N, TRIALS))
print()
print("segment tree, a point update before every query  right on %d of %d"
      % (tree_right, TRIALS))
print("prefix minimum used as a range minimum           right on %d of %d"
      % (prefix_right, TRIALS))
print("  (ranges that happened to start at index 0: %d)" % from_zero)
print()
print("         n   average nodes   worst nodes   4 x bits in n")
for n in [256, 1024, 4096, 16384]:
    sample = [rand(1000) for _ in range(n)]
    t = [0] * (4 * n)
    build(t, sample, 1, 0, n - 1)
    total = 0
    worst = 0
    for _ in range(2000):
        left = rand(n)
        right = left + rand(n - left)
        visited[0] = 0
        query(t, 1, 0, n - 1, left, right)
        total += visited[0]
        worst = max(worst, visited[0])
    print("%10d %15d %13d %15d" % (n, total // 2000, worst, 4 * n.bit_length()))
`,
          output: `an array of 1000 values, 3000 random ranges

segment tree, a point update before every query  right on 3000 of 3000
prefix minimum used as a range minimum           right on 885 of 3000
  (ranges that happened to start at index 0: 3)

         n   average nodes   worst nodes   4 x bits in n
       256              24            31              36
      1024              31            39              44
      4096              39            47              52
     16384              47            55              60`,
          explanation:
            "With a point update before every query, the segment tree matched a direct scan on 3,000 of 3,000 ranges. A prefix minimum used as a range minimum was right on only 885, almost all of them by luck, since just 3 of the ranges started at index 0. The second table counts nodes visited per query. The average grows by about 8 per quadrupling of n, and the worst case stayed below 4 times the number of bits in n at every size: 55 against 60 at n = 16,384.",
          alternates: [
            {
              lang: "javascript",
              code: `// Range minimum with point updates. A prefix array cannot do it, because a
// minimum cannot be subtracted back out. A segment tree can, and the nodes
// one query visits are counted against the bound usually quoted for it.

const INF = 1 << 30;
let visited = 0;

function build(tree, values, node, lo, hi) {
  if (lo === hi) {
    tree[node] = values[lo];
    return;
  }
  const mid = Math.floor((lo + hi) / 2);
  build(tree, values, 2 * node, lo, mid);
  build(tree, values, 2 * node + 1, mid + 1, hi);
  tree[node] = Math.min(tree[2 * node], tree[2 * node + 1]);
}

function update(tree, node, lo, hi, index, value) {
  if (lo === hi) {
    tree[node] = value;
    return;
  }
  const mid = Math.floor((lo + hi) / 2);
  if (index <= mid) update(tree, 2 * node, lo, mid, index, value);
  else update(tree, 2 * node + 1, mid + 1, hi, index, value);
  tree[node] = Math.min(tree[2 * node], tree[2 * node + 1]);
}

function query(tree, node, lo, hi, left, right) {
  visited += 1;
  if (right < lo || hi < left) return INF; // no overlap: nothing here
  if (left <= lo && hi <= right) return tree[node]; // fully inside: stop descending
  const mid = Math.floor((lo + hi) / 2);
  const a = query(tree, 2 * node, lo, mid, left, right);
  const b = query(tree, 2 * node + 1, mid + 1, hi, left, right);
  return Math.min(a, b);
}

function slowMin(values, left, right) {
  let best = INF;
  for (let i = left; i <= right; i++) best = Math.min(best, values[i]);
  return best;
}

// The same linear congruential generator in every language, so the arrays
// and queries below are the same whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 17300041n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function padLeft(s, width) {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

const N = 1000;
const TRIALS = 3000;
const values = [];
for (let i = 0; i < N; i++) values.push(rand(1000));
const tree = new Array(4 * N).fill(0);
build(tree, values, 1, 0, N - 1);

let treeRight = 0;
for (let t = 0; t < TRIALS; t++) {
  const i = rand(N);
  values[i] = rand(1000);
  update(tree, 1, 0, N - 1, i, values[i]);
  const left = rand(N);
  const right = left + rand(N - left);
  if (query(tree, 1, 0, N - 1, left, right) === slowMin(values, left, right)) treeRight += 1;
}

// a prefix minimum knows the smallest value up to each index, which answers
// a range only if that smallest value happens to lie inside the range
const prefixMin = [];
let running = INF;
for (const v of values) {
  running = Math.min(running, v);
  prefixMin.push(running);
}
let prefixRight = 0;
let fromZero = 0;
for (let t = 0; t < TRIALS; t++) {
  const left = rand(N);
  const right = left + rand(N - left);
  if (left === 0) fromZero += 1;
  if (prefixMin[right] === slowMin(values, left, right)) prefixRight += 1;
}

console.log("an array of " + N + " values, " + TRIALS + " random ranges");
console.log();
console.log(
  "segment tree, a point update before every query  right on " + treeRight + " of " + TRIALS,
);
console.log(
  "prefix minimum used as a range minimum           right on " + prefixRight + " of " + TRIALS,
);
console.log("  (ranges that happened to start at index 0: " + fromZero + ")");
console.log();
console.log("         n   average nodes   worst nodes   4 x bits in n");
for (const n of [256, 1024, 4096, 16384]) {
  const sample = [];
  for (let i = 0; i < n; i++) sample.push(rand(1000));
  const t = new Array(4 * n).fill(0);
  build(t, sample, 1, 0, n - 1);
  let total = 0;
  let worst = 0;
  for (let q = 0; q < 2000; q++) {
    const left = rand(n);
    const right = left + rand(n - left);
    visited = 0;
    query(t, 1, 0, n - 1, left, right);
    total += visited;
    worst = Math.max(worst, visited);
  }
  console.log(
    padLeft(n, 10) + " " + padLeft(Math.floor(total / 2000), 15) + " " + padLeft(worst, 13) +
      " " + padLeft(4 * n.toString(2).length, 15),
  );
}
`,
            },
            {
              lang: "typescript",
              code: `// Range minimum with point updates. A prefix array cannot do it, because a
// minimum cannot be subtracted back out. A segment tree can, and the nodes
// one query visits are counted against the bound usually quoted for it.

const INF = 1 << 30;
let visited = 0;

function build(tree: number[], values: number[], node: number, lo: number, hi: number): void {
  if (lo === hi) {
    tree[node] = values[lo];
    return;
  }
  const mid = Math.floor((lo + hi) / 2);
  build(tree, values, 2 * node, lo, mid);
  build(tree, values, 2 * node + 1, mid + 1, hi);
  tree[node] = Math.min(tree[2 * node], tree[2 * node + 1]);
}

function update(
  tree: number[],
  node: number,
  lo: number,
  hi: number,
  index: number,
  value: number,
): void {
  if (lo === hi) {
    tree[node] = value;
    return;
  }
  const mid = Math.floor((lo + hi) / 2);
  if (index <= mid) update(tree, 2 * node, lo, mid, index, value);
  else update(tree, 2 * node + 1, mid + 1, hi, index, value);
  tree[node] = Math.min(tree[2 * node], tree[2 * node + 1]);
}

function query(
  tree: number[],
  node: number,
  lo: number,
  hi: number,
  left: number,
  right: number,
): number {
  visited += 1;
  if (right < lo || hi < left) return INF; // no overlap: nothing here
  if (left <= lo && hi <= right) return tree[node]; // fully inside: stop descending
  const mid = Math.floor((lo + hi) / 2);
  const a = query(tree, 2 * node, lo, mid, left, right);
  const b = query(tree, 2 * node + 1, mid + 1, hi, left, right);
  return Math.min(a, b);
}

function slowMin(values: number[], left: number, right: number): number {
  let best = INF;
  for (let i = left; i <= right; i++) best = Math.min(best, values[i]);
  return best;
}

// The same linear congruential generator in every language, so the arrays
// and queries below are the same whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 17300041n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function padLeft(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

const N = 1000;
const TRIALS = 3000;
const values: number[] = [];
for (let i = 0; i < N; i++) values.push(rand(1000));
const tree = new Array(4 * N).fill(0);
build(tree, values, 1, 0, N - 1);

let treeRight = 0;
for (let t = 0; t < TRIALS; t++) {
  const i = rand(N);
  values[i] = rand(1000);
  update(tree, 1, 0, N - 1, i, values[i]);
  const left = rand(N);
  const right = left + rand(N - left);
  if (query(tree, 1, 0, N - 1, left, right) === slowMin(values, left, right)) treeRight += 1;
}

// a prefix minimum knows the smallest value up to each index, which answers
// a range only if that smallest value happens to lie inside the range
const prefixMin: number[] = [];
let running = INF;
for (const v of values) {
  running = Math.min(running, v);
  prefixMin.push(running);
}
let prefixRight = 0;
let fromZero = 0;
for (let t = 0; t < TRIALS; t++) {
  const left = rand(N);
  const right = left + rand(N - left);
  if (left === 0) fromZero += 1;
  if (prefixMin[right] === slowMin(values, left, right)) prefixRight += 1;
}

console.log("an array of " + N + " values, " + TRIALS + " random ranges");
console.log();
console.log(
  "segment tree, a point update before every query  right on " + treeRight + " of " + TRIALS,
);
console.log(
  "prefix minimum used as a range minimum           right on " + prefixRight + " of " + TRIALS,
);
console.log("  (ranges that happened to start at index 0: " + fromZero + ")");
console.log();
console.log("         n   average nodes   worst nodes   4 x bits in n");
for (const n of [256, 1024, 4096, 16384]) {
  const sample: number[] = [];
  for (let i = 0; i < n; i++) sample.push(rand(1000));
  const t = new Array(4 * n).fill(0);
  build(t, sample, 1, 0, n - 1);
  let total = 0;
  let worst = 0;
  for (let q = 0; q < 2000; q++) {
    const left = rand(n);
    const right = left + rand(n - left);
    visited = 0;
    query(t, 1, 0, n - 1, left, right);
    total += visited;
    worst = Math.max(worst, visited);
  }
  console.log(
    padLeft(n, 10) + " " + padLeft(Math.floor(total / 2000), 15) + " " + padLeft(worst, 13) +
      " " + padLeft(4 * n.toString(2).length, 15),
  );
}
`,
            },
            {
              lang: "java",
              code: `// Range minimum with point updates. A prefix array cannot do it, because a
// minimum cannot be subtracted back out. A segment tree can, and the nodes
// one query visits are counted against the bound usually quoted for it.

public class Main {
  static final int INF = 1 << 30;
  static long visited = 0;

  static void build(int[] tree, int[] values, int node, int lo, int hi) {
    if (lo == hi) {
      tree[node] = values[lo];
      return;
    }
    int mid = (lo + hi) / 2;
    build(tree, values, 2 * node, lo, mid);
    build(tree, values, 2 * node + 1, mid + 1, hi);
    tree[node] = Math.min(tree[2 * node], tree[2 * node + 1]);
  }

  static void update(int[] tree, int node, int lo, int hi, int index, int value) {
    if (lo == hi) {
      tree[node] = value;
      return;
    }
    int mid = (lo + hi) / 2;
    if (index <= mid) {
      update(tree, 2 * node, lo, mid, index, value);
    } else {
      update(tree, 2 * node + 1, mid + 1, hi, index, value);
    }
    tree[node] = Math.min(tree[2 * node], tree[2 * node + 1]);
  }

  static int query(int[] tree, int node, int lo, int hi, int left, int right) {
    visited += 1;
    if (right < lo || hi < left) {
      return INF; // no overlap: nothing here
    }
    if (left <= lo && hi <= right) {
      return tree[node]; // fully inside: stop descending
    }
    int mid = (lo + hi) / 2;
    int a = query(tree, 2 * node, lo, mid, left, right);
    int b = query(tree, 2 * node + 1, mid + 1, hi, left, right);
    return Math.min(a, b);
  }

  static int slowMin(int[] values, int left, int right) {
    int best = INF;
    for (int i = left; i <= right; i++) {
      best = Math.min(best, values[i]);
    }
    return best;
  }

  // The same linear congruential generator in every language, so the arrays
  // and queries below are the same whichever translation is run.
  static long seed = 17300041L;

  static int rand(int n) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return (int) (seed / 65536L % n);
  }

  public static void main(String[] args) {
    final int n0 = 1000;
    final int trials = 3000;
    int[] values = new int[n0];
    for (int i = 0; i < n0; i++) {
      values[i] = rand(1000);
    }
    int[] tree = new int[4 * n0];
    build(tree, values, 1, 0, n0 - 1);

    int treeRight = 0;
    for (int t = 0; t < trials; t++) {
      int i = rand(n0);
      values[i] = rand(1000);
      update(tree, 1, 0, n0 - 1, i, values[i]);
      int left = rand(n0);
      int right = left + rand(n0 - left);
      if (query(tree, 1, 0, n0 - 1, left, right) == slowMin(values, left, right)) {
        treeRight += 1;
      }
    }

    // a prefix minimum knows the smallest value up to each index, which answers
    // a range only if that smallest value happens to lie inside the range
    int[] prefixMin = new int[n0];
    int running = INF;
    for (int i = 0; i < n0; i++) {
      running = Math.min(running, values[i]);
      prefixMin[i] = running;
    }
    int prefixRight = 0;
    int fromZero = 0;
    for (int t = 0; t < trials; t++) {
      int left = rand(n0);
      int right = left + rand(n0 - left);
      if (left == 0) {
        fromZero += 1;
      }
      if (prefixMin[right] == slowMin(values, left, right)) {
        prefixRight += 1;
      }
    }

    System.out.printf("an array of %d values, %d random ranges%n", n0, trials);
    System.out.println();
    System.out.printf(
        "segment tree, a point update before every query  right on %d of %d%n", treeRight, trials);
    System.out.printf(
        "prefix minimum used as a range minimum           right on %d of %d%n",
        prefixRight, trials);
    System.out.printf("  (ranges that happened to start at index 0: %d)%n", fromZero);
    System.out.println();
    System.out.println("         n   average nodes   worst nodes   4 x bits in n");
    int[] sizes = {256, 1024, 4096, 16384};
    for (int n : sizes) {
      int[] sample = new int[n];
      for (int i = 0; i < n; i++) {
        sample[i] = rand(1000);
      }
      int[] t = new int[4 * n];
      build(t, sample, 1, 0, n - 1);
      long total = 0;
      long worst = 0;
      for (int q = 0; q < 2000; q++) {
        int left = rand(n);
        int right = left + rand(n - left);
        visited = 0;
        query(t, 1, 0, n - 1, left, right);
        total += visited;
        worst = Math.max(worst, visited);
      }
      int bits = 32 - Integer.numberOfLeadingZeros(n);
      System.out.printf("%10d %15d %13d %15d%n", n, total / 2000, worst, 4 * bits);
    }
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// Range minimum with point updates. A prefix array cannot do it, because a
// minimum cannot be subtracted back out. A segment tree can, and the nodes
// one query visits are counted against the bound usually quoted for it.

#include <algorithm>
#include <cstdio>
#include <vector>

static const int INF = 1 << 30;
long long visited = 0;

void build(std::vector<int>& tree, const std::vector<int>& values, int node, int lo, int hi) {
  if (lo == hi) {
    tree[node] = values[lo];
    return;
  }
  int mid = (lo + hi) / 2;
  build(tree, values, 2 * node, lo, mid);
  build(tree, values, 2 * node + 1, mid + 1, hi);
  tree[node] = std::min(tree[2 * node], tree[2 * node + 1]);
}

void update(std::vector<int>& tree, int node, int lo, int hi, int index, int value) {
  if (lo == hi) {
    tree[node] = value;
    return;
  }
  int mid = (lo + hi) / 2;
  if (index <= mid) {
    update(tree, 2 * node, lo, mid, index, value);
  } else {
    update(tree, 2 * node + 1, mid + 1, hi, index, value);
  }
  tree[node] = std::min(tree[2 * node], tree[2 * node + 1]);
}

int query(const std::vector<int>& tree, int node, int lo, int hi, int left, int right) {
  visited += 1;
  if (right < lo || hi < left) {
    return INF;  // no overlap: nothing here
  }
  if (left <= lo && hi <= right) {
    return tree[node];  // fully inside: stop descending
  }
  int mid = (lo + hi) / 2;
  int a = query(tree, 2 * node, lo, mid, left, right);
  int b = query(tree, 2 * node + 1, mid + 1, hi, left, right);
  return std::min(a, b);
}

int slowMin(const std::vector<int>& values, int left, int right) {
  int best = INF;
  for (int i = left; i <= right; i++) {
    best = std::min(best, values[i]);
  }
  return best;
}

// The same linear congruential generator in every language, so the arrays
// and queries below are the same whichever translation is run.
long long seed = 17300041LL;

int rand_below(int n) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return (int)(seed / 65536LL % n);
}

int main() {
  const int n0 = 1000;
  const int trials = 3000;
  std::vector<int> values;
  for (int i = 0; i < n0; i++) {
    values.push_back(rand_below(1000));
  }
  std::vector<int> tree(4 * n0, 0);
  build(tree, values, 1, 0, n0 - 1);

  int treeRight = 0;
  for (int t = 0; t < trials; t++) {
    int i = rand_below(n0);
    values[i] = rand_below(1000);
    update(tree, 1, 0, n0 - 1, i, values[i]);
    int left = rand_below(n0);
    int right = left + rand_below(n0 - left);
    if (query(tree, 1, 0, n0 - 1, left, right) == slowMin(values, left, right)) {
      treeRight += 1;
    }
  }

  // a prefix minimum knows the smallest value up to each index, which answers
  // a range only if that smallest value happens to lie inside the range
  std::vector<int> prefixMin;
  int running = INF;
  for (int v : values) {
    running = std::min(running, v);
    prefixMin.push_back(running);
  }
  int prefixRight = 0;
  int fromZero = 0;
  for (int t = 0; t < trials; t++) {
    int left = rand_below(n0);
    int right = left + rand_below(n0 - left);
    if (left == 0) {
      fromZero += 1;
    }
    if (prefixMin[right] == slowMin(values, left, right)) {
      prefixRight += 1;
    }
  }

  std::printf("an array of %d values, %d random ranges\\n", n0, trials);
  std::printf("\\n");
  std::printf("segment tree, a point update before every query  right on %d of %d\\n", treeRight,
              trials);
  std::printf("prefix minimum used as a range minimum           right on %d of %d\\n",
              prefixRight, trials);
  std::printf("  (ranges that happened to start at index 0: %d)\\n", fromZero);
  std::printf("\\n");
  std::printf("         n   average nodes   worst nodes   4 x bits in n\\n");
  int sizes[4] = {256, 1024, 4096, 16384};
  for (int n : sizes) {
    std::vector<int> sample;
    for (int i = 0; i < n; i++) {
      sample.push_back(rand_below(1000));
    }
    std::vector<int> t(4 * n, 0);
    build(t, sample, 1, 0, n - 1);
    long long total = 0;
    long long worst = 0;
    for (int q = 0; q < 2000; q++) {
      int left = rand_below(n);
      int right = left + rand_below(n - left);
      visited = 0;
      query(t, 1, 0, n - 1, left, right);
      total += visited;
      worst = std::max(worst, visited);
    }
    int bits = 0;
    for (int v = n; v > 0; v >>= 1) {
      bits += 1;
    }
    std::printf("%10d %15lld %13lld %15d\\n", n, total / 2000, worst, 4 * bits);
  }
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Range minimum with point updates. A prefix array cannot do it, because a
// minimum cannot be subtracted back out. A segment tree can, and the nodes
// one query visits are counted against the bound usually quoted for it.

const INF: i64 = 1 << 30;

fn build(tree: &mut [i64], values: &[i64], node: usize, lo: usize, hi: usize) {
    if lo == hi {
        tree[node] = values[lo];
        return;
    }
    let mid = (lo + hi) / 2;
    build(tree, values, 2 * node, lo, mid);
    build(tree, values, 2 * node + 1, mid + 1, hi);
    tree[node] = tree[2 * node].min(tree[2 * node + 1]);
}

fn update(tree: &mut [i64], node: usize, lo: usize, hi: usize, index: usize, value: i64) {
    if lo == hi {
        tree[node] = value;
        return;
    }
    let mid = (lo + hi) / 2;
    if index <= mid {
        update(tree, 2 * node, lo, mid, index, value);
    } else {
        update(tree, 2 * node + 1, mid + 1, hi, index, value);
    }
    tree[node] = tree[2 * node].min(tree[2 * node + 1]);
}

fn query(
    tree: &[i64],
    node: usize,
    lo: usize,
    hi: usize,
    left: usize,
    right: usize,
    visited: &mut i64,
) -> i64 {
    *visited += 1;
    if right < lo || hi < left {
        return INF; // no overlap: nothing here
    }
    if left <= lo && hi <= right {
        return tree[node]; // fully inside: stop descending
    }
    let mid = (lo + hi) / 2;
    let a = query(tree, 2 * node, lo, mid, left, right, visited);
    let b = query(tree, 2 * node + 1, mid + 1, hi, left, right, visited);
    a.min(b)
}

fn slow_min(values: &[i64], left: usize, right: usize) -> i64 {
    let mut best = INF;
    for i in left..=right {
        best = best.min(values[i]);
    }
    best
}

// The same linear congruential generator in every language, so the arrays
// and queries below are the same whichever translation is run.
static mut SEED: i64 = 17300041;

fn rand_below(n: usize) -> usize {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        (SEED / 65536 % n as i64) as usize
    }
}

fn main() {
    let n0: usize = 1000;
    let trials = 3000;
    let mut values: Vec<i64> = (0..n0).map(|_| rand_below(1000) as i64).collect();
    let mut tree = vec![0i64; 4 * n0];
    build(&mut tree, &values, 1, 0, n0 - 1);
    let mut ignored = 0;

    let mut tree_right = 0;
    for _ in 0..trials {
        let i = rand_below(n0);
        values[i] = rand_below(1000) as i64;
        update(&mut tree, 1, 0, n0 - 1, i, values[i]);
        let left = rand_below(n0);
        let right = left + rand_below(n0 - left);
        if query(&tree, 1, 0, n0 - 1, left, right, &mut ignored) == slow_min(&values, left, right) {
            tree_right += 1;
        }
    }

    // a prefix minimum knows the smallest value up to each index, which answers
    // a range only if that smallest value happens to lie inside the range
    let mut prefix_min: Vec<i64> = Vec::new();
    let mut running = INF;
    for &v in values.iter() {
        running = running.min(v);
        prefix_min.push(running);
    }
    let mut prefix_right = 0;
    let mut from_zero = 0;
    for _ in 0..trials {
        let left = rand_below(n0);
        let right = left + rand_below(n0 - left);
        if left == 0 {
            from_zero += 1;
        }
        if prefix_min[right] == slow_min(&values, left, right) {
            prefix_right += 1;
        }
    }

    println!("an array of {} values, {} random ranges", n0, trials);
    println!();
    println!(
        "segment tree, a point update before every query  right on {} of {}",
        tree_right, trials
    );
    println!(
        "prefix minimum used as a range minimum           right on {} of {}",
        prefix_right, trials
    );
    println!("  (ranges that happened to start at index 0: {})", from_zero);
    println!();
    println!("         n   average nodes   worst nodes   4 x bits in n");
    for &n in [256usize, 1024, 4096, 16384].iter() {
        let sample: Vec<i64> = (0..n).map(|_| rand_below(1000) as i64).collect();
        let mut t = vec![0i64; 4 * n];
        build(&mut t, &sample, 1, 0, n - 1);
        let mut total = 0;
        let mut worst = 0;
        for _ in 0..2000 {
            let left = rand_below(n);
            let right = left + rand_below(n - left);
            let mut visited = 0;
            query(&t, 1, 0, n - 1, left, right, &mut visited);
            total += visited;
            worst = worst.max(visited);
        }
        let bits = usize::BITS - n.leading_zeros();
        println!("{:>10} {:>15} {:>13} {:>15}", n, total / 2000, worst, 4 * bits);
    }
}
`,
            },
            {
              lang: "go",
              code: `// Range minimum with point updates. A prefix array cannot do it, because a
// minimum cannot be subtracted back out. A segment tree can, and the nodes
// one query visits are counted against the bound usually quoted for it.

package main

import (
	"fmt"
	"math/bits"
)

const inf = 1 << 30

var visited int64

func build(tree, values []int, node, lo, hi int) {
	if lo == hi {
		tree[node] = values[lo]
		return
	}
	mid := (lo + hi) / 2
	build(tree, values, 2*node, lo, mid)
	build(tree, values, 2*node+1, mid+1, hi)
	tree[node] = min(tree[2*node], tree[2*node+1])
}

func update(tree []int, node, lo, hi, index, value int) {
	if lo == hi {
		tree[node] = value
		return
	}
	mid := (lo + hi) / 2
	if index <= mid {
		update(tree, 2*node, lo, mid, index, value)
	} else {
		update(tree, 2*node+1, mid+1, hi, index, value)
	}
	tree[node] = min(tree[2*node], tree[2*node+1])
}

func query(tree []int, node, lo, hi, left, right int) int {
	visited++
	if right < lo || hi < left {
		return inf // no overlap: nothing here
	}
	if left <= lo && hi <= right {
		return tree[node] // fully inside: stop descending
	}
	mid := (lo + hi) / 2
	a := query(tree, 2*node, lo, mid, left, right)
	b := query(tree, 2*node+1, mid+1, hi, left, right)
	return min(a, b)
}

func slowMin(values []int, left, right int) int {
	best := inf
	for i := left; i <= right; i++ {
		best = min(best, values[i])
	}
	return best
}

// The same linear congruential generator in every language, so the arrays
// and queries below are the same whichever translation is run.
var seed int64 = 17300041

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	n0 := 1000
	trials := 3000
	values := make([]int, n0)
	for i := range values {
		values[i] = randBelow(1000)
	}
	tree := make([]int, 4*n0)
	build(tree, values, 1, 0, n0-1)

	treeRight := 0
	for t := 0; t < trials; t++ {
		i := randBelow(n0)
		values[i] = randBelow(1000)
		update(tree, 1, 0, n0-1, i, values[i])
		left := randBelow(n0)
		right := left + randBelow(n0-left)
		if query(tree, 1, 0, n0-1, left, right) == slowMin(values, left, right) {
			treeRight++
		}
	}

	// a prefix minimum knows the smallest value up to each index, which answers
	// a range only if that smallest value happens to lie inside the range
	prefixMin := make([]int, n0)
	running := inf
	for i, v := range values {
		running = min(running, v)
		prefixMin[i] = running
	}
	prefixRight := 0
	fromZero := 0
	for t := 0; t < trials; t++ {
		left := randBelow(n0)
		right := left + randBelow(n0-left)
		if left == 0 {
			fromZero++
		}
		if prefixMin[right] == slowMin(values, left, right) {
			prefixRight++
		}
	}

	fmt.Printf("an array of %d values, %d random ranges\\n", n0, trials)
	fmt.Println()
	fmt.Printf("segment tree, a point update before every query  right on %d of %d\\n", treeRight, trials)
	fmt.Printf("prefix minimum used as a range minimum           right on %d of %d\\n", prefixRight, trials)
	fmt.Printf("  (ranges that happened to start at index 0: %d)\\n", fromZero)
	fmt.Println()
	fmt.Println("         n   average nodes   worst nodes   4 x bits in n")
	for _, n := range []int{256, 1024, 4096, 16384} {
		sample := make([]int, n)
		for i := range sample {
			sample[i] = randBelow(1000)
		}
		t := make([]int, 4*n)
		build(t, sample, 1, 0, n-1)
		var total int64
		var worst int64
		for q := 0; q < 2000; q++ {
			left := randBelow(n)
			right := left + randBelow(n-left)
			visited = 0
			query(t, 1, 0, n-1, left, right)
			total += visited
			if visited > worst {
				worst = visited
			}
		}
		fmt.Printf("%10d %15d %13d %15d\\n", n, total/2000, worst, 4*bits.Len(uint(n)))
	}
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "the-bound",
      heading: "Why the query is logarithmic",
      body: [
        "At any depth, at most two nodes are partially overlapped by the query range \u2014 one containing `l` and one containing `r` \u2014 because every node strictly between them is fully inside and stops the descent. Only partially overlapped nodes recurse, and each has two children, so at most four nodes are visited per depth.",
        "The depth is about `log2 n`, so a query visits at most about `4 log2 n` nodes. The measured worst cases \u2014 31, 39, 47 and 55 as n goes from 256 to 16,384 \u2014 sit under that bound and grow by 8 each time n quadruples, which is 4 per extra level times 2 levels.",
      ],
    },
    {
      id: "richer-nodes",
      heading: "Nodes that store more than one value",
      body: [
        "The operation does not have to be a single number. A node can store a small record, as long as two children's records combine into the parent's.",
        "**Maximum subarray sum over a range**: store the total, the best prefix sum, the best suffix sum, and the best sum anywhere. The parent's best is the larger of the children's bests and the left suffix plus the right prefix. Its best prefix is the larger of the left prefix and the left total plus the right prefix; the suffix is symmetric.",
        "**Count and position of the minimum**: store the minimum and how many times it occurs; combine by keeping the smaller, adding counts on a tie.",
        "**k-th one in a 0/1 array**: store the count of ones; to find the k-th, descend left if the left count is at least `k`, otherwise subtract it and descend right. This is the same size-guided walk as an order-statistic tree.",
        "Designing the record is the actual work in most segment tree problems. The test is always the same: can the parent's record be computed from its two children's records alone?",
      ],
      pitfalls: [
        {
          title: "Allocating 2n cells for a recursive tree",
          body: "With the midpoint split and n not a power of two, indices reach beyond 2n. Allocate 4n, or use the bottom-up layout, which needs exactly 2n.",
        },
        {
          title: "The wrong identity for no overlap",
          body: "Returning 0 for a minimum query silently makes every answer at most 0. The identity must be infinity for min, negative infinity for max, 0 for sum.",
        },
        {
          title: "Forgetting to recompute ancestors after an update",
          body: "Setting the leaf alone leaves every stored range containing it stale.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does a segment tree answer a range query in logarithmic time?",
      answer:
        "Each node stores the answer for its index range, and the root covers the whole array, splitting at the midpoint. A query at a node returns the identity on no overlap, the stored value when the node is fully inside the query, and otherwise combines both children. At each depth at most two nodes are partially overlapped, so at most four are visited per level, about 4 log n total. I measured worst cases of 31, 39, 47 and 55 nodes for n from 256 to 16,384, each under 4 times the number of bits in n.",
    },
    {
      question: "When do you need a segment tree instead of a Fenwick tree?",
      answer:
        "When the operation has no inverse, or when a node needs to store a composite record. A Fenwick tree gets a range answer by subtracting two prefixes, which works for sums and XOR and fails for minimum, maximum or gcd. In my measurement a prefix minimum used as a range minimum was right on 885 of 3,000 random ranges; the segment tree was right on all of them. A segment tree needs only associativity and an identity, and its nodes can hold records like total, best prefix, best suffix and best overall, which is how maximum subarray over a range is answered.",
    },
  ],
  takeaways: [
    "A segment tree needs an associative operation and an identity, not an inverse",
    "Query cases: no overlap returns identity, full overlap returns the node, partial recurses",
    "Point update is one root-to-leaf path, recomputing ancestors",
    "Measured: prefix minimum right on 885 of 3,000 ranges, segment tree on 3,000",
    "At most four nodes per level; worst case 55 nodes at n = 16,384",
    "Allocate 4n for the recursive layout",
    "Harder queries are solved by designing a node record that children can combine",
  ],
};
