import type { Lesson } from "@/content/types";

export const eulerToursLesson: Lesson = {
  id: "dsa-advanced-dp-and-graphs-euler-tours",
  slug: "euler-tours",
  moduleSlug: "advanced-dp-and-graph-problems",
  title: "Euler Tours: Flattening a Tree Into an Array",
  summary:
    "Number a tree's nodes in depth-first order and every subtree becomes one contiguous range, so the range structures from earlier modules answer tree queries. Measured on a 2,000-node path: a subtree sum walked 1,015 nodes on average and the tour answered it in 11 Fenwick steps.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Compute entry and exit positions with an iterative depth-first search",
    "Turn subtree queries into range queries and ancestor tests into comparisons",
    "Answer root-to-node path sums with a range update and a point query",
    "Combine the tour with lowest common ancestor for arbitrary paths",
  ],
  sections: [
    {
      id: "entry-and-exit",
      heading: "Entry and exit positions",
      body: [
        "Run a depth-first search and give each node the next number when it is first entered: `tin[v]`. When the search finishes a node's subtree, record `tout[v]`, the largest number given out inside it.",
        "Depth-first search enters a node and then everything below it before leaving, so the nodes of `v`'s subtree receive exactly the numbers `tin[v]` through `tout[v]`, with no gaps and nothing else mixed in.",
        "Two consequences follow immediately. **A subtree is a range**: store each node's value at position `tin[v]`, and the subtree of `v` is the array slice `[tin[v], tout[v]]`. **Ancestry is a comparison**: `u` is an ancestor of `v` exactly when `tin[u] \u2264 tin[v] \u2264 tout[u]`.",
        "Write the search iteratively, keeping a stack of (node, next child index). A tree shaped like a path is as deep as it has nodes, and a recursive search on 100,000 nodes overflows CPython at 1,000 frames, Node at about 6,000 and Java at roughly 10,000 to 24,000, while C++ on Linux and Go take it.",
      ],
    },
    {
      id: "queries",
      heading: "Subtree sums and path sums",
      body: [
        "**Subtree sum with point updates** is now a range sum over `[tin[v], tout[v]]` with point updates, which a Fenwick tree answers in `O(log n)`.",
        "**Root-to-node path sum** uses the ancestry comparison the other way round. When `u`'s value changes by `delta`, add `delta` at `tin[u]` and subtract it at `tout[u] + 1` in a Fenwick tree over differences. A prefix sum up to `tin[v]` then includes `u`'s value exactly when `tin[u] \u2264 tin[v] \u2264 tout[u]` \u2014 exactly when `u` is on the path from the root to `v`.",
      ],
      examples: [
        {
          id: "euler-tour-subtree-and-path-sums",
          title: "Subtree and root-path sums through an Euler tour, against walking the tree",
          lang: "python",
          code: `# An Euler tour numbers the nodes of a tree in depth-first order, so every
# subtree becomes one contiguous range of positions. A Fenwick tree over those
# positions then answers subtree sums and root-to-node path sums under point
# updates, and both are checked against walking the tree directly.

work = [0]


def euler_tour(children, root):
    # tin[v]: position of v; tout[v]: the last position inside v's subtree
    n = len(children)
    tin = [0] * n
    tout = [0] * n
    timer = 0
    stack = [[root, 0]]
    tin[root] = timer
    timer += 1
    while stack:
        top = stack[-1]
        node = top[0]
        if top[1] < len(children[node]):
            child = children[node][top[1]]
            top[1] += 1
            tin[child] = timer
            timer += 1
            stack.append([child, 0])
        else:
            tout[node] = timer - 1
            stack.pop()
    return tin, tout


class Fenwick:
    def __init__(self, n):
        self.tree = [0] * (n + 2)

    def add(self, i, delta):
        k = i + 1
        while k < len(self.tree):
            work[0] += 1
            self.tree[k] += delta
            k += k & -k

    def prefix(self, i):
        total = 0
        k = i + 1
        while k > 0:
            work[0] += 1
            total += self.tree[k]
            k -= k & -k
        return total


def subtree_by_walking(children, value, v):
    total = 0
    stack = [v]
    while stack:
        node = stack.pop()
        work[0] += 1
        total += value[node]
        for child in children[node]:
            stack.append(child)
    return total


def path_by_walking(parent, value, v):
    total = 0
    while v != -1:
        work[0] += 1
        total += value[v]
        v = parent[v]
    return total


# The same linear congruential generator in every language, so the trees and
# operations below are the same whichever translation is run.
seed = 37700029


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


N = 2000
OPS = 3000
print("%d nodes, %d random operations: set a value, sum a subtree, sum a root path" % (N, OPS))
print()
print("tree shape        answers right   subtree sum: walk   tour   path sum: walk   tour")
for shape in ["random parents", "a single path"]:
    parent = [-1] * N
    children = [[] for _ in range(N)]
    for v in range(1, N):
        parent[v] = rand(v) if shape == "random parents" else v - 1
        children[parent[v]].append(v)
    tin, tout = euler_tour(children, 0)
    value = [0] * N
    subtree_tree = Fenwick(N)       # value at tin[v]
    path_tree = Fenwick(N)          # +value at tin[v], -value just past tout[v]
    right = 0
    asked = 0
    cost = [0, 0, 0, 0]
    counts = [0, 0]
    for _ in range(OPS):
        kind = rand(3)
        v = rand(N)
        if kind == 0:
            new_value = rand(100)
            delta = new_value - value[v]
            value[v] = new_value
            subtree_tree.add(tin[v], delta)
            path_tree.add(tin[v], delta)
            path_tree.add(tout[v] + 1, -delta)
        elif kind == 1:
            work[0] = 0
            slow = subtree_by_walking(children, value, v)
            cost[0] += work[0]
            work[0] = 0
            fast = subtree_tree.prefix(tout[v]) - subtree_tree.prefix(tin[v] - 1)
            cost[1] += work[0]
            counts[0] += 1
            asked += 1
            if slow == fast:
                right += 1
        else:
            work[0] = 0
            slow = path_by_walking(parent, value, v)
            cost[2] += work[0]
            work[0] = 0
            fast = path_tree.prefix(tin[v])
            cost[3] += work[0]
            counts[1] += 1
            asked += 1
            if slow == fast:
                right += 1
    print("%-17s %9d/%-5d %17d %6d %16d %6d"
          % (shape, right, asked, cost[0] // counts[0], cost[1] // counts[0],
             cost[2] // counts[1], cost[3] // counts[1]))
`,
          output: `2000 nodes, 3000 random operations: set a value, sum a subtree, sum a root path

tree shape        answers right   subtree sum: walk   tour   path sum: walk   tour
random parents         2019/2019                 13     10                8      5
a single path          2004/2004               1015     11              972      5`,
          explanation:
            "Every answer matched walking the tree: 2,019 of 2,019 queries on a tree with random parents and 2,004 of 2,004 on a path. On the path, a subtree sum walked 1,015 nodes on average and a path sum 972, while the tour used 11 and 5 Fenwick steps. On the random tree the walks were already short, 13 and 8 nodes, because a node's parent chosen uniformly from earlier nodes gives a shallow tree with small subtrees, and the tour saved little. The tour's cost stays logarithmic whatever the shape; the walk's cost is the shape.",
          alternates: [
            {
              lang: "javascript",
              code: `// An Euler tour numbers the nodes of a tree in depth-first order, so every
// subtree becomes one contiguous range of positions. A Fenwick tree over those
// positions then answers subtree sums and root-to-node path sums under point
// updates, and both are checked against walking the tree directly.

let work = 0;

function eulerTour(children, root) {
  // tin[v]: position of v; tout[v]: the last position inside v's subtree
  const n = children.length;
  const tin = new Array(n).fill(0);
  const tout = new Array(n).fill(0);
  let timer = 0;
  const stack = [[root, 0]];
  tin[root] = timer;
  timer += 1;
  while (stack.length > 0) {
    const top = stack[stack.length - 1];
    const node = top[0];
    if (top[1] < children[node].length) {
      const child = children[node][top[1]];
      top[1] += 1;
      tin[child] = timer;
      timer += 1;
      stack.push([child, 0]);
    } else {
      tout[node] = timer - 1;
      stack.pop();
    }
  }
  return [tin, tout];
}

class Fenwick {
  constructor(n) {
    this.tree = new Array(n + 2).fill(0);
  }

  add(i, delta) {
    let k = i + 1;
    while (k < this.tree.length) {
      work += 1;
      this.tree[k] += delta;
      k += k & -k;
    }
  }

  prefix(i) {
    let total = 0;
    let k = i + 1;
    while (k > 0) {
      work += 1;
      total += this.tree[k];
      k -= k & -k;
    }
    return total;
  }
}

function subtreeByWalking(children, value, v) {
  let total = 0;
  const stack = [v];
  while (stack.length > 0) {
    const node = stack.pop();
    work += 1;
    total += value[node];
    for (const child of children[node]) stack.push(child);
  }
  return total;
}

function pathByWalking(parent, value, v) {
  let total = 0;
  while (v !== -1) {
    work += 1;
    total += value[v];
    v = parent[v];
  }
  return total;
}

// The same linear congruential generator in every language, so the trees and
// operations below are the same whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 37700029n;

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

const N = 2000;
const OPS = 3000;
console.log(N + " nodes, " + OPS + " random operations: set a value, sum a subtree, sum a root path");
console.log();
console.log("tree shape        answers right   subtree sum: walk   tour   path sum: walk   tour");
for (const shape of ["random parents", "a single path"]) {
  const parent = new Array(N).fill(-1);
  const children = [];
  for (let v = 0; v < N; v++) children.push([]);
  for (let v = 1; v < N; v++) {
    parent[v] = shape === "random parents" ? rand(v) : v - 1;
    children[parent[v]].push(v);
  }
  const [tin, tout] = eulerTour(children, 0);
  const value = new Array(N).fill(0);
  const subtreeTree = new Fenwick(N); // value at tin[v]
  const pathTree = new Fenwick(N); // +value at tin[v], -value just past tout[v]
  let right = 0;
  let asked = 0;
  const cost = [0, 0, 0, 0];
  const counts = [0, 0];
  for (let o = 0; o < OPS; o++) {
    const kind = rand(3);
    const v = rand(N);
    if (kind === 0) {
      const newValue = rand(100);
      const delta = newValue - value[v];
      value[v] = newValue;
      subtreeTree.add(tin[v], delta);
      pathTree.add(tin[v], delta);
      pathTree.add(tout[v] + 1, -delta);
    } else if (kind === 1) {
      work = 0;
      const slow = subtreeByWalking(children, value, v);
      cost[0] += work;
      work = 0;
      const fast = subtreeTree.prefix(tout[v]) - subtreeTree.prefix(tin[v] - 1);
      cost[1] += work;
      counts[0] += 1;
      asked += 1;
      if (slow === fast) right += 1;
    } else {
      work = 0;
      const slow = pathByWalking(parent, value, v);
      cost[2] += work;
      work = 0;
      const fast = pathTree.prefix(tin[v]);
      cost[3] += work;
      counts[1] += 1;
      asked += 1;
      if (slow === fast) right += 1;
    }
  }
  console.log(
    pad(shape, 17) + " " + padLeft(right, 9) + "/" + pad(asked, 5) + " " +
      padLeft(Math.floor(cost[0] / counts[0]), 17) + " " + padLeft(Math.floor(cost[1] / counts[0]), 6) +
      " " + padLeft(Math.floor(cost[2] / counts[1]), 16) + " " + padLeft(Math.floor(cost[3] / counts[1]), 6),
  );
}
`,
            },
            {
              lang: "typescript",
              code: `// An Euler tour numbers the nodes of a tree in depth-first order, so every
// subtree becomes one contiguous range of positions. A Fenwick tree over those
// positions then answers subtree sums and root-to-node path sums under point
// updates, and both are checked against walking the tree directly.

let work = 0;

function eulerTour(children: number[][], root: number): [number[], number[]] {
  // tin[v]: position of v; tout[v]: the last position inside v's subtree
  const n = children.length;
  const tin = new Array(n).fill(0);
  const tout = new Array(n).fill(0);
  let timer = 0;
  const stack: number[][] = [[root, 0]];
  tin[root] = timer;
  timer += 1;
  while (stack.length > 0) {
    const top = stack[stack.length - 1];
    const node = top[0];
    if (top[1] < children[node].length) {
      const child = children[node][top[1]];
      top[1] += 1;
      tin[child] = timer;
      timer += 1;
      stack.push([child, 0]);
    } else {
      tout[node] = timer - 1;
      stack.pop();
    }
  }
  return [tin, tout];
}

class Fenwick {
  tree: number[];

  constructor(n: number) {
    this.tree = new Array(n + 2).fill(0);
  }

  add(i: number, delta: number): void {
    let k = i + 1;
    while (k < this.tree.length) {
      work += 1;
      this.tree[k] += delta;
      k += k & -k;
    }
  }

  prefix(i: number): number {
    let total = 0;
    let k = i + 1;
    while (k > 0) {
      work += 1;
      total += this.tree[k];
      k -= k & -k;
    }
    return total;
  }
}

function subtreeByWalking(children: number[][], value: number[], v: number): number {
  let total = 0;
  const stack = [v];
  while (stack.length > 0) {
    const node = stack.pop()!;
    work += 1;
    total += value[node];
    for (const child of children[node]) stack.push(child);
  }
  return total;
}

function pathByWalking(parent: number[], value: number[], v: number): number {
  let total = 0;
  while (v !== -1) {
    work += 1;
    total += value[v];
    v = parent[v];
  }
  return total;
}

// The same linear congruential generator in every language, so the trees and
// operations below are the same whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 37700029n;

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

const N = 2000;
const OPS = 3000;
console.log(N + " nodes, " + OPS + " random operations: set a value, sum a subtree, sum a root path");
console.log();
console.log("tree shape        answers right   subtree sum: walk   tour   path sum: walk   tour");
for (const shape of ["random parents", "a single path"]) {
  const parent = new Array(N).fill(-1);
  const children: number[][] = [];
  for (let v = 0; v < N; v++) children.push([]);
  for (let v = 1; v < N; v++) {
    parent[v] = shape === "random parents" ? rand(v) : v - 1;
    children[parent[v]].push(v);
  }
  const [tin, tout] = eulerTour(children, 0);
  const value = new Array(N).fill(0);
  const subtreeTree = new Fenwick(N); // value at tin[v]
  const pathTree = new Fenwick(N); // +value at tin[v], -value just past tout[v]
  let right = 0;
  let asked = 0;
  const cost = [0, 0, 0, 0];
  const counts = [0, 0];
  for (let o = 0; o < OPS; o++) {
    const kind = rand(3);
    const v = rand(N);
    if (kind === 0) {
      const newValue = rand(100);
      const delta = newValue - value[v];
      value[v] = newValue;
      subtreeTree.add(tin[v], delta);
      pathTree.add(tin[v], delta);
      pathTree.add(tout[v] + 1, -delta);
    } else if (kind === 1) {
      work = 0;
      const slow = subtreeByWalking(children, value, v);
      cost[0] += work;
      work = 0;
      const fast = subtreeTree.prefix(tout[v]) - subtreeTree.prefix(tin[v] - 1);
      cost[1] += work;
      counts[0] += 1;
      asked += 1;
      if (slow === fast) right += 1;
    } else {
      work = 0;
      const slow = pathByWalking(parent, value, v);
      cost[2] += work;
      work = 0;
      const fast = pathTree.prefix(tin[v]);
      cost[3] += work;
      counts[1] += 1;
      asked += 1;
      if (slow === fast) right += 1;
    }
  }
  console.log(
    pad(shape, 17) + " " + padLeft(right, 9) + "/" + pad(asked, 5) + " " +
      padLeft(Math.floor(cost[0] / counts[0]), 17) + " " + padLeft(Math.floor(cost[1] / counts[0]), 6) +
      " " + padLeft(Math.floor(cost[2] / counts[1]), 16) + " " + padLeft(Math.floor(cost[3] / counts[1]), 6),
  );
}
`,
            },
            {
              lang: "java",
              code: `// An Euler tour numbers the nodes of a tree in depth-first order, so every
// subtree becomes one contiguous range of positions. A Fenwick tree over those
// positions then answers subtree sums and root-to-node path sums under point
// updates, and both are checked against walking the tree directly.

import java.util.ArrayList;
import java.util.List;

public class Main {
  static long work = 0;

  static int[] tin;
  static int[] tout;

  static void eulerTour(List<List<Integer>> children, int root) {
    // tin[v]: position of v; tout[v]: the last position inside v's subtree
    int n = children.size();
    tin = new int[n];
    tout = new int[n];
    int timer = 0;
    List<int[]> stack = new ArrayList<>();
    stack.add(new int[] {root, 0});
    tin[root] = timer;
    timer += 1;
    while (!stack.isEmpty()) {
      int[] top = stack.get(stack.size() - 1);
      int node = top[0];
      if (top[1] < children.get(node).size()) {
        int child = children.get(node).get(top[1]);
        top[1] += 1;
        tin[child] = timer;
        timer += 1;
        stack.add(new int[] {child, 0});
      } else {
        tout[node] = timer - 1;
        stack.remove(stack.size() - 1);
      }
    }
  }

  static class Fenwick {
    long[] tree;

    Fenwick(int n) {
      tree = new long[n + 2];
    }

    void add(int i, long delta) {
      int k = i + 1;
      while (k < tree.length) {
        work += 1;
        tree[k] += delta;
        k += k & -k;
      }
    }

    long prefix(int i) {
      long total = 0;
      int k = i + 1;
      while (k > 0) {
        work += 1;
        total += tree[k];
        k -= k & -k;
      }
      return total;
    }
  }

  static long subtreeByWalking(List<List<Integer>> children, long[] value, int v) {
    long total = 0;
    List<Integer> stack = new ArrayList<>();
    stack.add(v);
    while (!stack.isEmpty()) {
      int node = stack.remove(stack.size() - 1);
      work += 1;
      total += value[node];
      stack.addAll(children.get(node));
    }
    return total;
  }

  static long pathByWalking(int[] parent, long[] value, int v) {
    long total = 0;
    while (v != -1) {
      work += 1;
      total += value[v];
      v = parent[v];
    }
    return total;
  }

  // The same linear congruential generator in every language, so the trees and
  // operations below are the same whichever translation is run.
  static long seed = 37700029L;

  static int rand(int n) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return (int) (seed / 65536L % n);
  }

  public static void main(String[] args) {
    final int n = 2000;
    final int ops = 3000;
    System.out.printf("%d nodes, %d random operations: set a value, sum a subtree, sum a root path%n", n, ops);
    System.out.println();
    System.out.println("tree shape        answers right   subtree sum: walk   tour   path sum: walk   tour");
    String[] shapes = {"random parents", "a single path"};
    for (String shape : shapes) {
      int[] parent = new int[n];
      parent[0] = -1;
      List<List<Integer>> children = new ArrayList<>();
      for (int v = 0; v < n; v++) {
        children.add(new ArrayList<>());
      }
      for (int v = 1; v < n; v++) {
        parent[v] = shape.equals("random parents") ? rand(v) : v - 1;
        children.get(parent[v]).add(v);
      }
      eulerTour(children, 0);
      long[] value = new long[n];
      Fenwick subtreeTree = new Fenwick(n); // value at tin[v]
      Fenwick pathTree = new Fenwick(n); // +value at tin[v], -value just past tout[v]
      int right = 0;
      int asked = 0;
      long[] cost = new long[4];
      long[] counts = new long[2];
      for (int o = 0; o < ops; o++) {
        int kind = rand(3);
        int v = rand(n);
        if (kind == 0) {
          long newValue = rand(100);
          long delta = newValue - value[v];
          value[v] = newValue;
          subtreeTree.add(tin[v], delta);
          pathTree.add(tin[v], delta);
          pathTree.add(tout[v] + 1, -delta);
        } else if (kind == 1) {
          work = 0;
          long slow = subtreeByWalking(children, value, v);
          cost[0] += work;
          work = 0;
          long fast = subtreeTree.prefix(tout[v]) - subtreeTree.prefix(tin[v] - 1);
          cost[1] += work;
          counts[0] += 1;
          asked += 1;
          if (slow == fast) {
            right += 1;
          }
        } else {
          work = 0;
          long slow = pathByWalking(parent, value, v);
          cost[2] += work;
          work = 0;
          long fast = pathTree.prefix(tin[v]);
          cost[3] += work;
          counts[1] += 1;
          asked += 1;
          if (slow == fast) {
            right += 1;
          }
        }
      }
      System.out.printf(
          "%-17s %9d/%-5d %17d %6d %16d %6d%n",
          shape, right, asked, cost[0] / counts[0], cost[1] / counts[0], cost[2] / counts[1],
          cost[3] / counts[1]);
    }
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// An Euler tour numbers the nodes of a tree in depth-first order, so every
// subtree becomes one contiguous range of positions. A Fenwick tree over those
// positions then answers subtree sums and root-to-node path sums under point
// updates, and both are checked against walking the tree directly.

#include <cstdio>
#include <string>
#include <utility>
#include <vector>

long long work = 0;

void eulerTour(const std::vector<std::vector<int> >& children, int root, std::vector<int>& tin,
               std::vector<int>& tout) {
  // tin[v]: position of v; tout[v]: the last position inside v's subtree
  int n = (int)children.size();
  tin.assign(n, 0);
  tout.assign(n, 0);
  int timer = 0;
  std::vector<std::pair<int, size_t> > stack;
  stack.push_back(std::make_pair(root, 0));
  tin[root] = timer;
  timer += 1;
  while (!stack.empty()) {
    std::pair<int, size_t>& top = stack.back();
    int node = top.first;
    if (top.second < children[node].size()) {
      int child = children[node][top.second];
      top.second += 1;
      tin[child] = timer;
      timer += 1;
      stack.push_back(std::make_pair(child, 0));
    } else {
      tout[node] = timer - 1;
      stack.pop_back();
    }
  }
}

struct Fenwick {
  std::vector<long long> tree;

  explicit Fenwick(int n) : tree(n + 2, 0) {}

  void add(int i, long long delta) {
    int k = i + 1;
    while (k < (int)tree.size()) {
      work += 1;
      tree[k] += delta;
      k += k & -k;
    }
  }

  long long prefix(int i) {
    long long total = 0;
    int k = i + 1;
    while (k > 0) {
      work += 1;
      total += tree[k];
      k -= k & -k;
    }
    return total;
  }
};

long long subtreeByWalking(const std::vector<std::vector<int> >& children,
                           const std::vector<long long>& value, int v) {
  long long total = 0;
  std::vector<int> stack(1, v);
  while (!stack.empty()) {
    int node = stack.back();
    stack.pop_back();
    work += 1;
    total += value[node];
    for (int child : children[node]) {
      stack.push_back(child);
    }
  }
  return total;
}

long long pathByWalking(const std::vector<int>& parent, const std::vector<long long>& value, int v) {
  long long total = 0;
  while (v != -1) {
    work += 1;
    total += value[v];
    v = parent[v];
  }
  return total;
}

// The same linear congruential generator in every language, so the trees and
// operations below are the same whichever translation is run.
long long seed = 37700029LL;

int rand_below(int n) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return (int)(seed / 65536LL % n);
}

int main() {
  const int n = 2000;
  const int ops = 3000;
  std::printf("%d nodes, %d random operations: set a value, sum a subtree, sum a root path\\n", n, ops);
  std::printf("\\n");
  std::printf("tree shape        answers right   subtree sum: walk   tour   path sum: walk   tour\\n");
  const char* shapes[2] = {"random parents", "a single path"};
  for (const char* shape : shapes) {
    std::vector<int> parent(n, -1);
    std::vector<std::vector<int> > children(n);
    for (int v = 1; v < n; v++) {
      parent[v] = std::string(shape) == "random parents" ? rand_below(v) : v - 1;
      children[parent[v]].push_back(v);
    }
    std::vector<int> tin;
    std::vector<int> tout;
    eulerTour(children, 0, tin, tout);
    std::vector<long long> value(n, 0);
    Fenwick subtreeTree(n);  // value at tin[v]
    Fenwick pathTree(n);     // +value at tin[v], -value just past tout[v]
    int right = 0;
    int asked = 0;
    long long cost[4] = {0, 0, 0, 0};
    long long counts[2] = {0, 0};
    for (int o = 0; o < ops; o++) {
      int kind = rand_below(3);
      int v = rand_below(n);
      if (kind == 0) {
        long long newValue = rand_below(100);
        long long delta = newValue - value[v];
        value[v] = newValue;
        subtreeTree.add(tin[v], delta);
        pathTree.add(tin[v], delta);
        pathTree.add(tout[v] + 1, -delta);
      } else if (kind == 1) {
        work = 0;
        long long slow = subtreeByWalking(children, value, v);
        cost[0] += work;
        work = 0;
        long long fast = subtreeTree.prefix(tout[v]) - subtreeTree.prefix(tin[v] - 1);
        cost[1] += work;
        counts[0] += 1;
        asked += 1;
        if (slow == fast) {
          right += 1;
        }
      } else {
        work = 0;
        long long slow = pathByWalking(parent, value, v);
        cost[2] += work;
        work = 0;
        long long fast = pathTree.prefix(tin[v]);
        cost[3] += work;
        counts[1] += 1;
        asked += 1;
        if (slow == fast) {
          right += 1;
        }
      }
    }
    std::printf("%-17s %9d/%-5d %17lld %6lld %16lld %6lld\\n", shape, right, asked, cost[0] / counts[0],
                cost[1] / counts[0], cost[2] / counts[1], cost[3] / counts[1]);
  }
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// An Euler tour numbers the nodes of a tree in depth-first order, so every
// subtree becomes one contiguous range of positions. A Fenwick tree over those
// positions then answers subtree sums and root-to-node path sums under point
// updates, and both are checked against walking the tree directly.

fn euler_tour(children: &[Vec<usize>], root: usize) -> (Vec<usize>, Vec<usize>) {
    // tin[v]: position of v; tout[v]: the last position inside v's subtree
    let n = children.len();
    let mut tin = vec![0; n];
    let mut tout = vec![0; n];
    let mut timer = 0;
    let mut stack: Vec<(usize, usize)> = vec![(root, 0)];
    tin[root] = timer;
    timer += 1;
    while let Some(&(node, next)) = stack.last() {
        if next < children[node].len() {
            let child = children[node][next];
            stack.last_mut().unwrap().1 += 1;
            tin[child] = timer;
            timer += 1;
            stack.push((child, 0));
        } else {
            tout[node] = timer - 1;
            stack.pop();
        }
    }
    (tin, tout)
}

struct Fenwick {
    tree: Vec<i64>,
}

impl Fenwick {
    fn new(n: usize) -> Fenwick {
        Fenwick { tree: vec![0; n + 2] }
    }

    fn add(&mut self, i: usize, delta: i64, work: &mut i64) {
        let mut k = i + 1;
        while k < self.tree.len() {
            *work += 1;
            self.tree[k] += delta;
            k += k & k.wrapping_neg();
        }
    }

    // sum of the first \`count\` positions
    fn prefix(&self, count: usize, work: &mut i64) -> i64 {
        let mut total = 0;
        let mut k = count;
        while k > 0 {
            *work += 1;
            total += self.tree[k];
            k -= k & k.wrapping_neg();
        }
        total
    }
}

fn subtree_by_walking(children: &[Vec<usize>], value: &[i64], v: usize, work: &mut i64) -> i64 {
    let mut total = 0;
    let mut stack = vec![v];
    while let Some(node) = stack.pop() {
        *work += 1;
        total += value[node];
        for &child in children[node].iter() {
            stack.push(child);
        }
    }
    total
}

fn path_by_walking(parent: &[i64], value: &[i64], start: usize, work: &mut i64) -> i64 {
    let mut total = 0;
    let mut v = start as i64;
    while v != -1 {
        *work += 1;
        total += value[v as usize];
        v = parent[v as usize];
    }
    total
}

// The same linear congruential generator in every language, so the trees and
// operations below are the same whichever translation is run.
static mut SEED: i64 = 37700029;

fn rand_below(n: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % n
    }
}

fn main() {
    let n: usize = 2000;
    let ops = 3000;
    println!("{} nodes, {} random operations: set a value, sum a subtree, sum a root path", n, ops);
    println!();
    println!("tree shape        answers right   subtree sum: walk   tour   path sum: walk   tour");
    for shape in ["random parents", "a single path"].iter() {
        let mut parent = vec![-1i64; n];
        let mut children: Vec<Vec<usize>> = vec![Vec::new(); n];
        for v in 1..n {
            parent[v] = if *shape == "random parents" { rand_below(v as i64) } else { v as i64 - 1 };
            children[parent[v] as usize].push(v);
        }
        let (tin, tout) = euler_tour(&children, 0);
        let mut value = vec![0i64; n];
        let mut subtree_tree = Fenwick::new(n); // value at tin[v]
        let mut path_tree = Fenwick::new(n); // +value at tin[v], -value just past tout[v]
        let mut ignored = 0;
        let mut right = 0;
        let mut asked = 0;
        let mut cost = [0i64; 4];
        let mut counts = [0i64; 2];
        for _ in 0..ops {
            let kind = rand_below(3);
            let v = rand_below(n as i64) as usize;
            if kind == 0 {
                let new_value = rand_below(100);
                let delta = new_value - value[v];
                value[v] = new_value;
                subtree_tree.add(tin[v], delta, &mut ignored);
                path_tree.add(tin[v], delta, &mut ignored);
                path_tree.add(tout[v] + 1, -delta, &mut ignored);
            } else if kind == 1 {
                let mut walk = 0;
                let slow = subtree_by_walking(&children, &value, v, &mut walk);
                let mut tour = 0;
                let fast = subtree_tree.prefix(tout[v] + 1, &mut tour) - subtree_tree.prefix(tin[v], &mut tour);
                cost[0] += walk;
                cost[1] += tour;
                counts[0] += 1;
                asked += 1;
                if slow == fast {
                    right += 1;
                }
            } else {
                let mut walk = 0;
                let slow = path_by_walking(&parent, &value, v, &mut walk);
                let mut tour = 0;
                let fast = path_tree.prefix(tin[v] + 1, &mut tour);
                cost[2] += walk;
                cost[3] += tour;
                counts[1] += 1;
                asked += 1;
                if slow == fast {
                    right += 1;
                }
            }
        }
        println!(
            "{:<17} {:>9}/{:<5} {:>17} {:>6} {:>16} {:>6}",
            shape,
            right,
            asked,
            cost[0] / counts[0],
            cost[1] / counts[0],
            cost[2] / counts[1],
            cost[3] / counts[1]
        );
    }
}
`,
            },
            {
              lang: "go",
              code: `// An Euler tour numbers the nodes of a tree in depth-first order, so every
// subtree becomes one contiguous range of positions. A Fenwick tree over those
// positions then answers subtree sums and root-to-node path sums under point
// updates, and both are checked against walking the tree directly.

package main

import "fmt"

var work int64

func eulerTour(children [][]int, root int) ([]int, []int) {
	// tin[v]: position of v; tout[v]: the last position inside v's subtree
	n := len(children)
	tin := make([]int, n)
	tout := make([]int, n)
	timer := 0
	stack := [][2]int{{root, 0}}
	tin[root] = timer
	timer++
	for len(stack) > 0 {
		top := &stack[len(stack)-1]
		node := top[0]
		if top[1] < len(children[node]) {
			child := children[node][top[1]]
			top[1]++
			tin[child] = timer
			timer++
			stack = append(stack, [2]int{child, 0})
		} else {
			tout[node] = timer - 1
			stack = stack[:len(stack)-1]
		}
	}
	return tin, tout
}

type fenwick struct{ tree []int64 }

func newFenwick(n int) *fenwick {
	return &fenwick{tree: make([]int64, n+2)}
}

func (f *fenwick) add(i int, delta int64) {
	for k := i + 1; k < len(f.tree); k += k & -k {
		work++
		f.tree[k] += delta
	}
}

func (f *fenwick) prefix(i int) int64 {
	var total int64
	for k := i + 1; k > 0; k -= k & -k {
		work++
		total += f.tree[k]
	}
	return total
}

func subtreeByWalking(children [][]int, value []int64, v int) int64 {
	var total int64
	stack := []int{v}
	for len(stack) > 0 {
		node := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		work++
		total += value[node]
		stack = append(stack, children[node]...)
	}
	return total
}

func pathByWalking(parent []int, value []int64, v int) int64 {
	var total int64
	for v != -1 {
		work++
		total += value[v]
		v = parent[v]
	}
	return total
}

// The same linear congruential generator in every language, so the trees and
// operations below are the same whichever translation is run.
var seed int64 = 37700029

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	const n = 2000
	const ops = 3000
	fmt.Printf("%d nodes, %d random operations: set a value, sum a subtree, sum a root path\\n", n, ops)
	fmt.Println()
	fmt.Println("tree shape        answers right   subtree sum: walk   tour   path sum: walk   tour")
	for _, shape := range []string{"random parents", "a single path"} {
		parent := make([]int, n)
		parent[0] = -1
		children := make([][]int, n)
		for v := 1; v < n; v++ {
			if shape == "random parents" {
				parent[v] = randBelow(v)
			} else {
				parent[v] = v - 1
			}
			children[parent[v]] = append(children[parent[v]], v)
		}
		tin, tout := eulerTour(children, 0)
		value := make([]int64, n)
		subtreeTree := newFenwick(n) // value at tin[v]
		pathTree := newFenwick(n)    // +value at tin[v], -value just past tout[v]
		right := 0
		asked := 0
		var cost [4]int64
		var counts [2]int64
		for o := 0; o < ops; o++ {
			kind := randBelow(3)
			v := randBelow(n)
			if kind == 0 {
				newValue := int64(randBelow(100))
				delta := newValue - value[v]
				value[v] = newValue
				subtreeTree.add(tin[v], delta)
				pathTree.add(tin[v], delta)
				pathTree.add(tout[v]+1, -delta)
			} else if kind == 1 {
				work = 0
				slow := subtreeByWalking(children, value, v)
				cost[0] += work
				work = 0
				fast := subtreeTree.prefix(tout[v]) - subtreeTree.prefix(tin[v]-1)
				cost[1] += work
				counts[0]++
				asked++
				if slow == fast {
					right++
				}
			} else {
				work = 0
				slow := pathByWalking(parent, value, v)
				cost[2] += work
				work = 0
				fast := pathTree.prefix(tin[v])
				cost[3] += work
				counts[1]++
				asked++
				if slow == fast {
					right++
				}
			}
		}
		fmt.Printf("%-17s %9d/%-5d %17d %6d %16d %6d\\n", shape, right, asked,
			cost[0]/counts[0], cost[1]/counts[0], cost[2]/counts[1], cost[3]/counts[1])
	}
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "more",
      heading: "Arbitrary paths, and the second kind of tour",
      body: [
        "**Sum on the path between any `u` and `v`.** With root-path sums `P` and the lowest common ancestor `w`, the path sum is `P(u) + P(v) - 2\u00b7P(w) + value(w)`: both root paths include the part above `w` twice and `w` itself twice. The lowest common ancestor comes from binary lifting, so each query is a few logarithmic steps.",
        "**Range updates on a subtree** \u2014 add `delta` to every node below `v` \u2014 are a range update over `[tin[v], tout[v]]`, handled by a Fenwick tree over differences or a lazy segment tree.",
        "**The second kind of Euler tour** writes a node down every time the search arrives at it, including on the way back up from each child, giving `2n - 1` entries. The lowest common ancestor of `u` and `v` is the shallowest node recorded between their first occurrences. That is a static range-minimum query, which a sparse table answers in constant time after an `O(n log n)` build \u2014 the fastest known query for a tree that does not change.",
      ],
      pitfalls: [
        {
          title: "A recursive tour on a deep tree",
          body: "A path-shaped tree is as deep as its node count. Use an explicit stack.",
        },
        {
          title: "Indexing the array by node number instead of tin",
          body: "The contiguity only holds in tour order. Values must be stored at `tin[v]`, and every query must translate node numbers through `tin` and `tout`.",
        },
        {
          title: "Subtracting the path update at tout[u] instead of tout[u] + 1",
          body: "The subtraction must start just past the subtree, or the last node of every subtree loses the update.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you answer subtree-sum queries on a tree whose values change?",
      answer:
        "Flatten it with an Euler tour. A depth-first search gives each node an entry number tin[v] and records tout[v], the last number assigned inside its subtree; because the search finishes a subtree before leaving it, the subtree is exactly positions tin[v] to tout[v]. Store values at tin[v] in a Fenwick tree and a subtree sum is a range sum. I measured it on a 2,000-node path: 11 Fenwick steps per query against 1,015 nodes walked, and every answer matched walking the tree.",
    },
    {
      question: "How would you get the sum of values on the path between two nodes?",
      answer:
        "Root-path sums first: when a node u changes by delta, add delta at tin[u] and subtract it at tout[u] + 1, so a prefix sum up to tin[v] counts exactly the ancestors of v, including v. Then the path from u to v is P(u) + P(v) - 2 P(w) + value(w), where w is their lowest common ancestor from binary lifting. Each query is a handful of logarithmic operations. On a 2,000-node path I measured 5 Fenwick steps per root-path sum against 972 nodes walked.",
    },
  ],
  takeaways: [
    "tin[v] and tout[v] from one depth-first search bracket v's subtree exactly",
    "A subtree is the range [tin[v], tout[v]]",
    "u is an ancestor of v exactly when tin[u] <= tin[v] <= tout[u]",
    "Root-path sums: add at tin[u], subtract at tout[u] + 1, prefix to tin[v]",
    "Measured on a path: 11 steps per subtree sum against 1,015 nodes walked",
    "On shallow random trees the walk is already short",
    "The 2n - 1 tour turns lowest common ancestor into range minimum",
  ],
};
