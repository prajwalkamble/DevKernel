import type { Lesson } from "@/content/types";

export const binaryLiftingLesson: Lesson = {
  id: "dsa-advanced-dp-and-graphs-binary-lifting",
  slug: "binary-lifting",
  moduleSlug: "advanced-dp-and-graph-problems",
  title: "Binary Lifting and Logarithmic Lowest Common Ancestor",
  summary:
    "Store every node's 2^j-th ancestor and any climb becomes one jump per bit. Measured on a 4,096-node path: 1,328 steps per lowest common ancestor by walking, 5 by lifting — and on a shallow random tree, lifting was slower than walking.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Build the ancestor table from the recurrence up[j][v] = up[j-1][up[j-1][v]]",
    "Answer k-th ancestor queries with one jump per set bit",
    "Find lowest common ancestors by equalising depth and descending the levels",
    "Say when binary lifting pays and when walking is cheaper",
  ],
  sections: [
    {
      id: "the-table",
      heading: "The table",
      body: [
        "`up[0][v]` is `v`'s parent. The `2^j`-th ancestor is the `2^(j-1)`-th ancestor of the `2^(j-1)`-th ancestor, so `up[j][v] = up[j-1][up[j-1][v]]`, with -1 propagating past the root.",
        "The table needs enough levels that `2^levels` exceeds the deepest depth; with `n` nodes, `ceil(log2 n)` levels always suffice. Building it is `n` entries per level, `O(n log n)` time and memory \u2014 12 levels and 49,152 entries for 4,096 nodes.",
        "**k-th ancestor.** Write `k` in binary and jump `2^j` for each set bit `j`. Any order works, since jumps commute; lowest bit first is simplest. That is at most `log k` jumps.",
      ],
    },
    {
      id: "lca",
      heading: "Lowest common ancestor",
      body: [
        "**Equalise depths.** Lift the deeper node by the depth difference, using the k-th ancestor jump. If the two are now the same node, it is the answer.",
        "**Descend the levels.** For `j` from the highest level down to 0: if `up[j][a] \u2260 up[j][b]`, jump both. Jumps that would land on the same node are skipped, because they would reach or pass the common ancestor; jumps that keep them apart are taken, because the common ancestor is still above. After all levels, `a` and `b` are the two children of the lowest common ancestor just below it, and `up[0][a]` is the answer.",
        "Taking the largest jump that keeps them apart, from the top down, is binary search on the depth of the answer, which is why it takes one step per level.",
      ],
      examples: [
        {
          id: "binary-lifting-against-walking",
          title: "Lowest common ancestor and k-th ancestor by lifting, against walking one parent at a time",
          lang: "python",
          code: `# Binary lifting stores, for every node, its 1st, 2nd, 4th, 8th ... ancestor.
# Any k-th ancestor is then one jump per set bit of k, and the lowest common
# ancestor is two climbs of at most log n jumps. Both are checked against
# walking up one parent at a time.

work = [0]


def build(parent, n):
    levels = 1
    while (1 << levels) < n:
        levels += 1
    up = [list(parent)]                      # up[j][v]: the 2^j-th ancestor, or -1
    for j in range(1, levels):
        row = []
        for v in range(n):
            half = up[j - 1][v]
            row.append(-1 if half == -1 else up[j - 1][half])
        up.append(row)
    return up


def kth_by_walking(parent, v, k):
    while k > 0 and v != -1:
        work[0] += 1
        v = parent[v]
        k -= 1
    return v


def kth_by_lifting(up, v, k):
    j = 0
    while k > 0 and v != -1:
        if k & 1:
            work[0] += 1
            v = -1 if j >= len(up) else up[j][v]
        k >>= 1
        j += 1
    return v


def lca_by_walking(parent, depth, a, b):
    while depth[a] > depth[b]:
        work[0] += 1
        a = parent[a]
    while depth[b] > depth[a]:
        work[0] += 1
        b = parent[b]
    while a != b:
        work[0] += 1
        a = parent[a]
        b = parent[b]
    return a


def lca_by_lifting(up, depth, a, b):
    if depth[a] < depth[b]:
        a, b = b, a
    diff = depth[a] - depth[b]
    j = 0
    while diff > 0:                          # bring a up to b's depth
        if diff & 1:
            work[0] += 1
            a = up[j][a]
        diff >>= 1
        j += 1
    if a == b:
        return a
    for j in range(len(up) - 1, -1, -1):     # the largest jumps that keep them apart
        work[0] += 1
        if up[j][a] != up[j][b]:
            a = up[j][a]
            b = up[j][b]
    return up[0][a]


# The same linear congruential generator in every language, so the trees and
# queries below are the same whichever translation is run.
seed = 85200047


def rand(k):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % k


N = 4096
QUERIES = 2000
print("%d nodes, %d lowest-common-ancestor and %d k-th ancestor queries" % (N, QUERIES, QUERIES))
print()
print("tree shape        right   depth   table cells   lca steps: walk   lift   kth steps: walk   lift")
for shape in ["random parents", "a single path"]:
    parent = [-1] * N
    depth = [0] * N
    for v in range(1, N):
        parent[v] = rand(v) if shape == "random parents" else v - 1
        depth[v] = depth[parent[v]] + 1
    up = build(parent, N)
    right = 0
    cost = [0, 0, 0, 0]
    for _ in range(QUERIES):
        a = rand(N)
        b = rand(N)
        work[0] = 0
        slow = lca_by_walking(parent, depth, a, b)
        cost[0] += work[0]
        work[0] = 0
        fast = lca_by_lifting(up, depth, a, b)
        cost[1] += work[0]
        if slow == fast:
            right += 1
        v = rand(N)
        k = rand(depth[v] + 2)               # sometimes one past the root
        work[0] = 0
        slow = kth_by_walking(parent, v, k)
        cost[2] += work[0]
        work[0] = 0
        fast = kth_by_lifting(up, v, k)
        cost[3] += work[0]
        if slow == fast:
            right += 1
    deepest = max(depth)
    print("%-17s %5d %7d %13d %17d %6d %17d %6d"
          % (shape, right, deepest, len(up) * N, cost[0] // QUERIES, cost[1] // QUERIES,
             cost[2] // QUERIES, cost[3] // QUERIES))
`,
          output: `4096 nodes, 2000 lowest-common-ancestor and 2000 k-th ancestor queries

tree shape        right   depth   table cells   lca steps: walk   lift   kth steps: walk   lift
random parents     4000      16         49152                 8     13                 4      1
a single path      4000    4095         49152              1328      5              1009      5`,
          explanation:
            "All 4,000 answers matched walking on both trees. On a path of 4,096 nodes, walking cost 1,328 steps per lowest common ancestor and 1,009 per k-th ancestor; lifting cost 5 and 5. On a tree with random parents the depth was only 16, and walking cost 8 steps per lowest common ancestor against 13 for lifting, because the descent always examines every one of the 12 levels. Lifting still won the k-th ancestor queries there, 1 step to 4. The table was 49,152 entries for both trees.",
          alternates: [
            {
              lang: "javascript",
              code: `// Binary lifting stores, for every node, its 1st, 2nd, 4th, 8th ... ancestor.
// Any k-th ancestor is then one jump per set bit of k, and the lowest common
// ancestor is two climbs of at most log n jumps. Both are checked against
// walking up one parent at a time.

let work = 0;

function build(parent, n) {
  let levels = 1;
  while (1 << levels < n) levels += 1;
  const up = [parent.slice()]; // up[j][v]: the 2^j-th ancestor, or -1
  for (let j = 1; j < levels; j++) {
    const row = [];
    for (let v = 0; v < n; v++) {
      const half = up[j - 1][v];
      row.push(half === -1 ? -1 : up[j - 1][half]);
    }
    up.push(row);
  }
  return up;
}

function kthByWalking(parent, v, k) {
  while (k > 0 && v !== -1) {
    work += 1;
    v = parent[v];
    k -= 1;
  }
  return v;
}

function kthByLifting(up, v, k) {
  let j = 0;
  while (k > 0 && v !== -1) {
    if (k & 1) {
      work += 1;
      v = j >= up.length ? -1 : up[j][v];
    }
    k >>= 1;
    j += 1;
  }
  return v;
}

function lcaByWalking(parent, depth, a, b) {
  while (depth[a] > depth[b]) {
    work += 1;
    a = parent[a];
  }
  while (depth[b] > depth[a]) {
    work += 1;
    b = parent[b];
  }
  while (a !== b) {
    work += 1;
    a = parent[a];
    b = parent[b];
  }
  return a;
}

function lcaByLifting(up, depth, a, b) {
  if (depth[a] < depth[b]) [a, b] = [b, a];
  let diff = depth[a] - depth[b];
  let j = 0;
  while (diff > 0) {
    // bring a up to b's depth
    if (diff & 1) {
      work += 1;
      a = up[j][a];
    }
    diff >>= 1;
    j += 1;
  }
  if (a === b) return a;
  for (let level = up.length - 1; level >= 0; level--) {
    // the largest jumps that keep them apart
    work += 1;
    if (up[level][a] !== up[level][b]) {
      a = up[level][a];
      b = up[level][b];
    }
  }
  return up[0][a];
}

// The same linear congruential generator in every language, so the trees and
// queries below are the same whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 85200047n;

function rand(k) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(k));
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

const N = 4096;
const QUERIES = 2000;
console.log(N + " nodes, " + QUERIES + " lowest-common-ancestor and " + QUERIES + " k-th ancestor queries");
console.log();
console.log("tree shape        right   depth   table cells   lca steps: walk   lift   kth steps: walk   lift");
for (const shape of ["random parents", "a single path"]) {
  const parent = new Array(N).fill(-1);
  const depth = new Array(N).fill(0);
  for (let v = 1; v < N; v++) {
    parent[v] = shape === "random parents" ? rand(v) : v - 1;
    depth[v] = depth[parent[v]] + 1;
  }
  const up = build(parent, N);
  let right = 0;
  const cost = [0, 0, 0, 0];
  for (let q = 0; q < QUERIES; q++) {
    const a = rand(N);
    const b = rand(N);
    work = 0;
    let slow = lcaByWalking(parent, depth, a, b);
    cost[0] += work;
    work = 0;
    let fast = lcaByLifting(up, depth, a, b);
    cost[1] += work;
    if (slow === fast) right += 1;
    const v = rand(N);
    const k = rand(depth[v] + 2); // sometimes one past the root
    work = 0;
    slow = kthByWalking(parent, v, k);
    cost[2] += work;
    work = 0;
    fast = kthByLifting(up, v, k);
    cost[3] += work;
    if (slow === fast) right += 1;
  }
  const deepest = Math.max(...depth);
  console.log(
    pad(shape, 17) + " " + padLeft(right, 5) + " " + padLeft(deepest, 7) + " " + padLeft(up.length * N, 13) + " " +
      padLeft(Math.floor(cost[0] / QUERIES), 17) + " " + padLeft(Math.floor(cost[1] / QUERIES), 6) + " " +
      padLeft(Math.floor(cost[2] / QUERIES), 17) + " " + padLeft(Math.floor(cost[3] / QUERIES), 6),
  );
}
`,
            },
            {
              lang: "typescript",
              code: `// Binary lifting stores, for every node, its 1st, 2nd, 4th, 8th ... ancestor.
// Any k-th ancestor is then one jump per set bit of k, and the lowest common
// ancestor is two climbs of at most log n jumps. Both are checked against
// walking up one parent at a time.

let work = 0;

function build(parent: number[], n: number): number[][] {
  let levels = 1;
  while (1 << levels < n) levels += 1;
  const up = [parent.slice()]; // up[j][v]: the 2^j-th ancestor, or -1
  for (let j = 1; j < levels; j++) {
    const row: number[] = [];
    for (let v = 0; v < n; v++) {
      const half = up[j - 1][v];
      row.push(half === -1 ? -1 : up[j - 1][half]);
    }
    up.push(row);
  }
  return up;
}

function kthByWalking(parent: number[], v: number, k: number): number {
  while (k > 0 && v !== -1) {
    work += 1;
    v = parent[v];
    k -= 1;
  }
  return v;
}

function kthByLifting(up: number[][], v: number, k: number): number {
  let j = 0;
  while (k > 0 && v !== -1) {
    if (k & 1) {
      work += 1;
      v = j >= up.length ? -1 : up[j][v];
    }
    k >>= 1;
    j += 1;
  }
  return v;
}

function lcaByWalking(parent: number[], depth: number[], a: number, b: number): number {
  while (depth[a] > depth[b]) {
    work += 1;
    a = parent[a];
  }
  while (depth[b] > depth[a]) {
    work += 1;
    b = parent[b];
  }
  while (a !== b) {
    work += 1;
    a = parent[a];
    b = parent[b];
  }
  return a;
}

function lcaByLifting(up: number[][], depth: number[], a: number, b: number): number {
  if (depth[a] < depth[b]) [a, b] = [b, a];
  let diff = depth[a] - depth[b];
  let j = 0;
  while (diff > 0) {
    // bring a up to b's depth
    if (diff & 1) {
      work += 1;
      a = up[j][a];
    }
    diff >>= 1;
    j += 1;
  }
  if (a === b) return a;
  for (let level = up.length - 1; level >= 0; level--) {
    // the largest jumps that keep them apart
    work += 1;
    if (up[level][a] !== up[level][b]) {
      a = up[level][a];
      b = up[level][b];
    }
  }
  return up[0][a];
}

// The same linear congruential generator in every language, so the trees and
// queries below are the same whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 85200047n;

function rand(k: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(k));
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

const N = 4096;
const QUERIES = 2000;
console.log(N + " nodes, " + QUERIES + " lowest-common-ancestor and " + QUERIES + " k-th ancestor queries");
console.log();
console.log("tree shape        right   depth   table cells   lca steps: walk   lift   kth steps: walk   lift");
for (const shape of ["random parents", "a single path"]) {
  const parent: number[] = new Array(N).fill(-1);
  const depth: number[] = new Array(N).fill(0);
  for (let v = 1; v < N; v++) {
    parent[v] = shape === "random parents" ? rand(v) : v - 1;
    depth[v] = depth[parent[v]] + 1;
  }
  const up = build(parent, N);
  let right = 0;
  const cost = [0, 0, 0, 0];
  for (let q = 0; q < QUERIES; q++) {
    const a = rand(N);
    const b = rand(N);
    work = 0;
    let slow = lcaByWalking(parent, depth, a, b);
    cost[0] += work;
    work = 0;
    let fast = lcaByLifting(up, depth, a, b);
    cost[1] += work;
    if (slow === fast) right += 1;
    const v = rand(N);
    const k = rand(depth[v] + 2); // sometimes one past the root
    work = 0;
    slow = kthByWalking(parent, v, k);
    cost[2] += work;
    work = 0;
    fast = kthByLifting(up, v, k);
    cost[3] += work;
    if (slow === fast) right += 1;
  }
  const deepest = Math.max(...depth);
  console.log(
    pad(shape, 17) + " " + padLeft(right, 5) + " " + padLeft(deepest, 7) + " " + padLeft(up.length * N, 13) + " " +
      padLeft(Math.floor(cost[0] / QUERIES), 17) + " " + padLeft(Math.floor(cost[1] / QUERIES), 6) + " " +
      padLeft(Math.floor(cost[2] / QUERIES), 17) + " " + padLeft(Math.floor(cost[3] / QUERIES), 6),
  );
}
`,
            },
            {
              lang: "java",
              code: `// Binary lifting stores, for every node, its 1st, 2nd, 4th, 8th ... ancestor.
// Any k-th ancestor is then one jump per set bit of k, and the lowest common
// ancestor is two climbs of at most log n jumps. Both are checked against
// walking up one parent at a time.

public class Main {
  static long work = 0;

  static int[][] build(int[] parent, int n) {
    int levels = 1;
    while ((1 << levels) < n) {
      levels += 1;
    }
    int[][] up = new int[levels][]; // up[j][v]: the 2^j-th ancestor, or -1
    up[0] = parent.clone();
    for (int j = 1; j < levels; j++) {
      up[j] = new int[n];
      for (int v = 0; v < n; v++) {
        int half = up[j - 1][v];
        up[j][v] = half == -1 ? -1 : up[j - 1][half];
      }
    }
    return up;
  }

  static int kthByWalking(int[] parent, int v, int k) {
    while (k > 0 && v != -1) {
      work += 1;
      v = parent[v];
      k -= 1;
    }
    return v;
  }

  static int kthByLifting(int[][] up, int v, int k) {
    int j = 0;
    while (k > 0 && v != -1) {
      if ((k & 1) == 1) {
        work += 1;
        v = j >= up.length ? -1 : up[j][v];
      }
      k >>= 1;
      j += 1;
    }
    return v;
  }

  static int lcaByWalking(int[] parent, int[] depth, int a, int b) {
    while (depth[a] > depth[b]) {
      work += 1;
      a = parent[a];
    }
    while (depth[b] > depth[a]) {
      work += 1;
      b = parent[b];
    }
    while (a != b) {
      work += 1;
      a = parent[a];
      b = parent[b];
    }
    return a;
  }

  static int lcaByLifting(int[][] up, int[] depth, int a, int b) {
    if (depth[a] < depth[b]) {
      int swap = a;
      a = b;
      b = swap;
    }
    int diff = depth[a] - depth[b];
    int j = 0;
    while (diff > 0) { // bring a up to b's depth
      if ((diff & 1) == 1) {
        work += 1;
        a = up[j][a];
      }
      diff >>= 1;
      j += 1;
    }
    if (a == b) {
      return a;
    }
    for (int level = up.length - 1; level >= 0; level--) { // the largest jumps that keep them apart
      work += 1;
      if (up[level][a] != up[level][b]) {
        a = up[level][a];
        b = up[level][b];
      }
    }
    return up[0][a];
  }

  // The same linear congruential generator in every language, so the trees and
  // queries below are the same whichever translation is run.
  static long seed = 85200047L;

  static int rand(int k) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return (int) (seed / 65536L % k);
  }

  public static void main(String[] args) {
    final int n = 4096;
    final int queries = 2000;
    System.out.printf("%d nodes, %d lowest-common-ancestor and %d k-th ancestor queries%n", n, queries, queries);
    System.out.println();
    System.out.println("tree shape        right   depth   table cells   lca steps: walk   lift   kth steps: walk   lift");
    String[] shapes = {"random parents", "a single path"};
    for (String shape : shapes) {
      int[] parent = new int[n];
      int[] depth = new int[n];
      parent[0] = -1;
      for (int v = 1; v < n; v++) {
        parent[v] = shape.equals("random parents") ? rand(v) : v - 1;
        depth[v] = depth[parent[v]] + 1;
      }
      int[][] up = build(parent, n);
      int right = 0;
      long[] cost = new long[4];
      for (int q = 0; q < queries; q++) {
        int a = rand(n);
        int b = rand(n);
        work = 0;
        int slow = lcaByWalking(parent, depth, a, b);
        cost[0] += work;
        work = 0;
        int fast = lcaByLifting(up, depth, a, b);
        cost[1] += work;
        if (slow == fast) {
          right += 1;
        }
        int v = rand(n);
        int k = rand(depth[v] + 2); // sometimes one past the root
        work = 0;
        slow = kthByWalking(parent, v, k);
        cost[2] += work;
        work = 0;
        fast = kthByLifting(up, v, k);
        cost[3] += work;
        if (slow == fast) {
          right += 1;
        }
      }
      int deepest = 0;
      for (int d : depth) {
        deepest = Math.max(deepest, d);
      }
      System.out.printf(
          "%-17s %5d %7d %13d %17d %6d %17d %6d%n",
          shape, right, deepest, up.length * n, cost[0] / queries, cost[1] / queries, cost[2] / queries,
          cost[3] / queries);
    }
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// Binary lifting stores, for every node, its 1st, 2nd, 4th, 8th ... ancestor.
// Any k-th ancestor is then one jump per set bit of k, and the lowest common
// ancestor is two climbs of at most log n jumps. Both are checked against
// walking up one parent at a time.

#include <algorithm>
#include <cstdio>
#include <string>
#include <vector>

long long work = 0;

std::vector<std::vector<int> > build(const std::vector<int>& parent, int n) {
  int levels = 1;
  while ((1 << levels) < n) {
    levels += 1;
  }
  std::vector<std::vector<int> > up(1, parent);  // up[j][v]: the 2^j-th ancestor, or -1
  for (int j = 1; j < levels; j++) {
    std::vector<int> row(n);
    for (int v = 0; v < n; v++) {
      int half = up[j - 1][v];
      row[v] = half == -1 ? -1 : up[j - 1][half];
    }
    up.push_back(row);
  }
  return up;
}

int kthByWalking(const std::vector<int>& parent, int v, int k) {
  while (k > 0 && v != -1) {
    work += 1;
    v = parent[v];
    k -= 1;
  }
  return v;
}

int kthByLifting(const std::vector<std::vector<int> >& up, int v, int k) {
  int j = 0;
  while (k > 0 && v != -1) {
    if (k & 1) {
      work += 1;
      v = j >= (int)up.size() ? -1 : up[j][v];
    }
    k >>= 1;
    j += 1;
  }
  return v;
}

int lcaByWalking(const std::vector<int>& parent, const std::vector<int>& depth, int a, int b) {
  while (depth[a] > depth[b]) {
    work += 1;
    a = parent[a];
  }
  while (depth[b] > depth[a]) {
    work += 1;
    b = parent[b];
  }
  while (a != b) {
    work += 1;
    a = parent[a];
    b = parent[b];
  }
  return a;
}

int lcaByLifting(const std::vector<std::vector<int> >& up, const std::vector<int>& depth, int a, int b) {
  if (depth[a] < depth[b]) {
    std::swap(a, b);
  }
  int diff = depth[a] - depth[b];
  int j = 0;
  while (diff > 0) {  // bring a up to b's depth
    if (diff & 1) {
      work += 1;
      a = up[j][a];
    }
    diff >>= 1;
    j += 1;
  }
  if (a == b) {
    return a;
  }
  for (int level = (int)up.size() - 1; level >= 0; level--) {  // the largest jumps that keep them apart
    work += 1;
    if (up[level][a] != up[level][b]) {
      a = up[level][a];
      b = up[level][b];
    }
  }
  return up[0][a];
}

// The same linear congruential generator in every language, so the trees and
// queries below are the same whichever translation is run.
long long seed = 85200047LL;

int rand_below(int k) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return (int)(seed / 65536LL % k);
}

int main() {
  const int n = 4096;
  const int queries = 2000;
  std::printf("%d nodes, %d lowest-common-ancestor and %d k-th ancestor queries\\n", n, queries, queries);
  std::printf("\\n");
  std::printf("tree shape        right   depth   table cells   lca steps: walk   lift   kth steps: walk   lift\\n");
  const char* shapes[2] = {"random parents", "a single path"};
  for (const char* shape : shapes) {
    std::vector<int> parent(n, -1);
    std::vector<int> depth(n, 0);
    for (int v = 1; v < n; v++) {
      parent[v] = std::string(shape) == "random parents" ? rand_below(v) : v - 1;
      depth[v] = depth[parent[v]] + 1;
    }
    std::vector<std::vector<int> > up = build(parent, n);
    int right = 0;
    long long cost[4] = {0, 0, 0, 0};
    for (int q = 0; q < queries; q++) {
      int a = rand_below(n);
      int b = rand_below(n);
      work = 0;
      int slow = lcaByWalking(parent, depth, a, b);
      cost[0] += work;
      work = 0;
      int fast = lcaByLifting(up, depth, a, b);
      cost[1] += work;
      if (slow == fast) {
        right += 1;
      }
      int v = rand_below(n);
      int k = rand_below(depth[v] + 2);  // sometimes one past the root
      work = 0;
      slow = kthByWalking(parent, v, k);
      cost[2] += work;
      work = 0;
      fast = kthByLifting(up, v, k);
      cost[3] += work;
      if (slow == fast) {
        right += 1;
      }
    }
    int deepest = *std::max_element(depth.begin(), depth.end());
    std::printf("%-17s %5d %7d %13d %17lld %6lld %17lld %6lld\\n", shape, right, deepest, (int)up.size() * n,
                cost[0] / queries, cost[1] / queries, cost[2] / queries, cost[3] / queries);
  }
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Binary lifting stores, for every node, its 1st, 2nd, 4th, 8th ... ancestor.
// Any k-th ancestor is then one jump per set bit of k, and the lowest common
// ancestor is two climbs of at most log n jumps. Both are checked against
// walking up one parent at a time.

fn build(parent: &[i64], n: usize) -> Vec<Vec<i64>> {
    let mut levels = 1;
    while (1usize << levels) < n {
        levels += 1;
    }
    let mut up: Vec<Vec<i64>> = vec![parent.to_vec()]; // up[j][v]: the 2^j-th ancestor, or -1
    for j in 1..levels {
        let row: Vec<i64> = (0..n)
            .map(|v| {
                let half = up[j - 1][v];
                if half == -1 { -1 } else { up[j - 1][half as usize] }
            })
            .collect();
        up.push(row);
    }
    up
}

fn kth_by_walking(parent: &[i64], start: i64, steps: i64, work: &mut i64) -> i64 {
    let mut v = start;
    let mut k = steps;
    while k > 0 && v != -1 {
        *work += 1;
        v = parent[v as usize];
        k -= 1;
    }
    v
}

fn kth_by_lifting(up: &[Vec<i64>], start: i64, steps: i64, work: &mut i64) -> i64 {
    let mut v = start;
    let mut k = steps;
    let mut j = 0;
    while k > 0 && v != -1 {
        if k & 1 == 1 {
            *work += 1;
            v = if j >= up.len() { -1 } else { up[j][v as usize] };
        }
        k >>= 1;
        j += 1;
    }
    v
}

fn lca_by_walking(parent: &[i64], depth: &[i64], first: usize, second: usize, work: &mut i64) -> usize {
    let (mut a, mut b) = (first, second);
    while depth[a] > depth[b] {
        *work += 1;
        a = parent[a] as usize;
    }
    while depth[b] > depth[a] {
        *work += 1;
        b = parent[b] as usize;
    }
    while a != b {
        *work += 1;
        a = parent[a] as usize;
        b = parent[b] as usize;
    }
    a
}

fn lca_by_lifting(up: &[Vec<i64>], depth: &[i64], first: usize, second: usize, work: &mut i64) -> usize {
    let (mut a, mut b) = (first, second);
    if depth[a] < depth[b] {
        std::mem::swap(&mut a, &mut b);
    }
    let mut diff = depth[a] - depth[b];
    let mut j = 0;
    while diff > 0 {
        // bring a up to b's depth
        if diff & 1 == 1 {
            *work += 1;
            a = up[j][a] as usize;
        }
        diff >>= 1;
        j += 1;
    }
    if a == b {
        return a;
    }
    for level in (0..up.len()).rev() {
        // the largest jumps that keep them apart
        *work += 1;
        if up[level][a] != up[level][b] {
            a = up[level][a] as usize;
            b = up[level][b] as usize;
        }
    }
    up[0][a] as usize
}

// The same linear congruential generator in every language, so the trees and
// queries below are the same whichever translation is run.
static mut SEED: i64 = 85200047;

fn rand_below(k: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % k
    }
}

fn main() {
    let n: usize = 4096;
    let queries: i64 = 2000;
    println!("{} nodes, {} lowest-common-ancestor and {} k-th ancestor queries", n, queries, queries);
    println!();
    println!("tree shape        right   depth   table cells   lca steps: walk   lift   kth steps: walk   lift");
    for shape in ["random parents", "a single path"].iter() {
        let mut parent = vec![-1i64; n];
        let mut depth = vec![0i64; n];
        for v in 1..n {
            parent[v] = if *shape == "random parents" { rand_below(v as i64) } else { v as i64 - 1 };
            depth[v] = depth[parent[v] as usize] + 1;
        }
        let up = build(&parent, n);
        let mut right = 0;
        let mut cost = [0i64; 4];
        for _ in 0..queries {
            let a = rand_below(n as i64) as usize;
            let b = rand_below(n as i64) as usize;
            let slow = lca_by_walking(&parent, &depth, a, b, &mut cost[0]);
            let fast = lca_by_lifting(&up, &depth, a, b, &mut cost[1]);
            if slow == fast {
                right += 1;
            }
            let v = rand_below(n as i64);
            let k = rand_below(depth[v as usize] + 2); // sometimes one past the root
            let slow = kth_by_walking(&parent, v, k, &mut cost[2]);
            let fast = kth_by_lifting(&up, v, k, &mut cost[3]);
            if slow == fast {
                right += 1;
            }
        }
        let deepest = *depth.iter().max().unwrap();
        println!(
            "{:<17} {:>5} {:>7} {:>13} {:>17} {:>6} {:>17} {:>6}",
            shape,
            right,
            deepest,
            up.len() * n,
            cost[0] / queries,
            cost[1] / queries,
            cost[2] / queries,
            cost[3] / queries
        );
    }
}
`,
            },
            {
              lang: "go",
              code: `// Binary lifting stores, for every node, its 1st, 2nd, 4th, 8th ... ancestor.
// Any k-th ancestor is then one jump per set bit of k, and the lowest common
// ancestor is two climbs of at most log n jumps. Both are checked against
// walking up one parent at a time.

package main

import "fmt"

var work int64

func build(parent []int, n int) [][]int {
	levels := 1
	for 1<<levels < n {
		levels++
	}
	up := [][]int{append([]int{}, parent...)} // up[j][v]: the 2^j-th ancestor, or -1
	for j := 1; j < levels; j++ {
		row := make([]int, n)
		for v := 0; v < n; v++ {
			half := up[j-1][v]
			if half == -1 {
				row[v] = -1
			} else {
				row[v] = up[j-1][half]
			}
		}
		up = append(up, row)
	}
	return up
}

func kthByWalking(parent []int, v, k int) int {
	for k > 0 && v != -1 {
		work++
		v = parent[v]
		k--
	}
	return v
}

func kthByLifting(up [][]int, v, k int) int {
	j := 0
	for k > 0 && v != -1 {
		if k&1 == 1 {
			work++
			if j >= len(up) {
				v = -1
			} else {
				v = up[j][v]
			}
		}
		k >>= 1
		j++
	}
	return v
}

func lcaByWalking(parent, depth []int, a, b int) int {
	for depth[a] > depth[b] {
		work++
		a = parent[a]
	}
	for depth[b] > depth[a] {
		work++
		b = parent[b]
	}
	for a != b {
		work++
		a = parent[a]
		b = parent[b]
	}
	return a
}

func lcaByLifting(up [][]int, depth []int, a, b int) int {
	if depth[a] < depth[b] {
		a, b = b, a
	}
	diff := depth[a] - depth[b]
	for j := 0; diff > 0; j++ { // bring a up to b's depth
		if diff&1 == 1 {
			work++
			a = up[j][a]
		}
		diff >>= 1
	}
	if a == b {
		return a
	}
	for level := len(up) - 1; level >= 0; level-- { // the largest jumps that keep them apart
		work++
		if up[level][a] != up[level][b] {
			a = up[level][a]
			b = up[level][b]
		}
	}
	return up[0][a]
}

// The same linear congruential generator in every language, so the trees and
// queries below are the same whichever translation is run.
var seed int64 = 85200047

func randBelow(k int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(k))
}

func main() {
	const n = 4096
	const queries = 2000
	fmt.Printf("%d nodes, %d lowest-common-ancestor and %d k-th ancestor queries\\n", n, queries, queries)
	fmt.Println()
	fmt.Println("tree shape        right   depth   table cells   lca steps: walk   lift   kth steps: walk   lift")
	for _, shape := range []string{"random parents", "a single path"} {
		parent := make([]int, n)
		depth := make([]int, n)
		parent[0] = -1
		for v := 1; v < n; v++ {
			if shape == "random parents" {
				parent[v] = randBelow(v)
			} else {
				parent[v] = v - 1
			}
			depth[v] = depth[parent[v]] + 1
		}
		up := build(parent, n)
		right := 0
		var cost [4]int64
		for q := 0; q < queries; q++ {
			a := randBelow(n)
			b := randBelow(n)
			work = 0
			slow := lcaByWalking(parent, depth, a, b)
			cost[0] += work
			work = 0
			fast := lcaByLifting(up, depth, a, b)
			cost[1] += work
			if slow == fast {
				right++
			}
			v := randBelow(n)
			k := randBelow(depth[v] + 2) // sometimes one past the root
			work = 0
			slow = kthByWalking(parent, v, k)
			cost[2] += work
			work = 0
			fast = kthByLifting(up, v, k)
			cost[3] += work
			if slow == fast {
				right++
			}
		}
		deepest := 0
		for _, d := range depth {
			deepest = max(deepest, d)
		}
		fmt.Printf("%-17s %5d %7d %13d %17d %6d %17d %6d\\n", shape, right, deepest, len(up)*n,
			cost[0]/queries, cost[1]/queries, cost[2]/queries, cost[3]/queries)
	}
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "when",
      heading: "When it pays, and the alternatives",
      body: [
        "The random-tree row is the part worth keeping. Binary lifting guarantees `O(log n)` per query whatever the shape, at a cost of `O(n log n)` memory and a fixed overhead per query. On shallow trees, walking is already short and the overhead dominates. On deep or adversarial trees \u2014 paths, caterpillars, trees built from sorted input \u2014 walking is linear and lifting is essential.",
        "**Path aggregates.** Alongside each jump store the maximum edge weight (or sum, or minimum) over the jumped segment, combined with the same recurrence. The maximum edge on the path between two nodes is then the maximum over the jumps both climbs take.",
        "**Any successor function.** The tree was never essential: `up[j][v]` works for any function `next(v)` on a finite set, giving the position after `10^18` applications in about 60 jumps. This answers \"where is the token after k steps\" on functional graphs.",
        "**Alternatives for lowest common ancestor.** An Euler tour with a sparse table answers each query in `O(1)` after `O(n log n)` preprocessing, and Tarjan's offline algorithm answers a batch of known queries in near-linear time with union-find. Binary lifting is the most flexible of the three, because the same table also gives k-th ancestors and path aggregates.",
      ],
      pitfalls: [
        {
          title: "Too few levels",
          body: "With 2^levels no larger than the depth, deep k-th ancestor queries read past the table. Size the table from the node count or the maximum depth.",
        },
        {
          title: "Descending levels from the bottom up",
          body: "The top-down order is what makes the descent a binary search. Bottom-up jumps overshoot.",
        },
        {
          title: "Assuming it beats walking on every tree",
          body: "Measured on a random tree of depth 16: 13 steps per LCA lifting, 8 walking.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does binary lifting find the lowest common ancestor?",
      answer:
        "Precompute up[j][v], the 2^j-th ancestor, from up[j][v] = up[j-1][up[j-1][v]], O(n log n). For a query, lift the deeper node by the depth difference, one jump per set bit. If they are equal, done. Otherwise, for each level from the top down, jump both nodes whenever their ancestors at that level differ; that leaves them just below the answer, which is up[0][a]. On a 4,096-node path I measured 5 steps per query against 1,328 walking one parent at a time, with all answers matching.",
    },
    {
      question: "Is binary lifting always faster than walking up the tree?",
      answer:
        "No. It guarantees O(log n) regardless of shape, but it pays a fixed cost per query and O(n log n) memory. On a random tree of 4,096 nodes with depth 16, I measured 13 steps per lowest common ancestor lifting against 8 walking, because the top-down descent looks at all 12 levels. On a path of the same size walking cost 1,328 steps against 5. So it matters on deep or adversarial trees. It also generalises beyond LCA: the same table gives k-th ancestors, path maxima, and the k-th successor in any functional graph.",
    },
  ],
  takeaways: [
    "up[j][v] = up[j-1][up[j-1][v]]; O(n log n) to build",
    "k-th ancestor: one jump per set bit of k",
    "LCA: equalise depths, then jump both from the top level down while ancestors differ",
    "Measured on a 4,096-node path: 5 steps per LCA against 1,328 walking",
    "Measured on a shallow random tree: 13 steps lifting against 8 walking",
    "Store an aggregate per jump for path maxima and sums",
    "The table works for any successor function, not only trees",
  ],
};
