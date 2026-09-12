import type { Lesson } from "@/content/types";

export const reroutingLesson: Lesson = {
  id: "dsa-advanced-dp-and-graphs-rerooting",
  slug: "rerooting",
  moduleSlug: "advanced-dp-and-graph-problems",
  title: "DP on Trees: Rerooting When the Combine Has No Inverse",
  summary:
    "Rerooting answers a question for every node in two passes, and a sum can be rerooted by subtracting a child's share back out. A maximum cannot. Measured on the farthest distance from every node: prefix and suffix maxima matched a search from every node on 500 of 500 trees; reusing the parent's whole maximum matched on 15.",
  estimatedMinutes: 40,
  status: "available",
  objectives: [
    "Set up a two-pass rerooting DP: one pass up the tree, one pass down",
    "Explain why rerooting a maximum needs every child except one",
    "Compute 'all children except this one' with prefix and suffix maxima",
    "Order the passes iteratively so deep trees do not overflow the stack",
  ],
  sections: [
    {
      id: "two-passes",
      heading: "Two passes",
      body: [
        "A question asked for every node of a tree \u2014 its farthest distance, the size of its largest component when removed, the sum of distances to all others \u2014 can be answered by running a single-root DP from each node, `O(n^2)`. Rerooting answers it in `O(n)` with two passes.",
        "**Pass one, leaves upward.** Root the tree anywhere. For each node compute `down[v]`, the answer restricted to `v`'s subtree, from its children's `down` values. For the farthest distance, `down[v]` is the maximum over children `c` of `down[c] + weight(v, c)`.",
        "**Pass two, root downward.** For each child `c` of `v`, compute `up[c]`, the answer for `c` looking only through its parent: everything outside `c`'s subtree. The farthest node through the parent is the parent's own `up[v]`, or a path down into one of `v`'s **other** children, plus the edge from `c` to `v`.",
        "The answer for every node combines both directions: `max(down[v], up[v])`.",
      ],
    },
    {
      id: "no-inverse",
      heading: "The part that needs an inverse",
      body: [
        "For a sum, \"everything at `v` except `c`'s contribution\" is `total[v] - contribution(c)`. Subtraction undoes the child's share, and rerooting is one line per edge.",
        "A maximum has no such inverse. Knowing that the best branch below `v` has length 12 says nothing about the best branch **other than** `c`'s, if `c`'s branch was the 12. Using `down[v]` anyway lets `up[c]` count a path that goes up to `v` and straight back down into `c`'s own subtree, which is not a path at all, and overestimates.",
        "The general fix works for any associative combine: for the children of `v` in some fixed order, compute **prefix** combines of the first `i` and **suffix** combines of those after `i`. The combine of every child except child `i` is `combine(prefix[i], suffix[i + 1])`, and it costs linear time per node's children. For a maximum specifically, keeping the best and second-best child branch is the same idea in less code: use the second-best when the best one is `c`'s.",
      ],
      examples: [
        {
          id: "rerooting-a-maximum",
          title: "Farthest distance from every node, by prefix and suffix maxima and by reusing the whole maximum",
          lang: "python",
          code: `# Rerooting when the combine step has no inverse. The farthest distance from
# every node of a weighted tree: a sum can be rerooted by subtracting a child's
# share back out, but a maximum cannot, so the pass down the tree needs the
# best value among a node's other children, from prefix and suffix maxima.

work = [0]


def farthest_by_search(neighbours, n):
    # a full traversal from every node: the definition, at O(n^2)
    out = [0] * n
    for start in range(n):
        best = 0
        stack = [[start, -1, 0]]
        while stack:
            node, came_from, dist = stack.pop()
            best = max(best, dist)
            for other, w in neighbours[node]:
                work[0] += 1
                if other != came_from:
                    stack.append([other, node, dist + w])
        out[start] = best
    return out


def farthest_by_rerooting(weight, kids, n, careful):
    # every child is numbered after its parent, so descending node order
    # visits children first and ascending order visits parents first
    # pass one, leaves upward: down[v] = farthest distance below v
    down = [0] * n
    for v in range(n - 1, -1, -1):
        for c in kids[v]:
            work[0] += 1
            down[v] = max(down[v], down[c] + weight[c])
    # pass two, root downward: up[c] = farthest distance through c's parent
    up = [0] * n
    for v in range(n):
        k = len(kids[v])
        prefix = [0] * (k + 1)       # best among the first i children
        suffix = [0] * (k + 1)       # best among children i and later
        for i in range(k):
            work[0] += 1
            c = kids[v][i]
            prefix[i + 1] = max(prefix[i], down[c] + weight[c])
        for i in range(k - 1, -1, -1):
            work[0] += 1
            c = kids[v][i]
            suffix[i] = max(suffix[i + 1], down[c] + weight[c])
        for i in range(k):
            work[0] += 1
            c = kids[v][i]
            if careful:
                others = max(prefix[i], suffix[i + 1])    # every child except c
            else:
                others = down[v]                          # may be c's own branch
            up[c] = weight[c] + max(up[v], others)
    return [max(down[v], up[v]) for v in range(n)]


# The same linear congruential generator in every language, so the trees
# below are the same trees whichever translation is run.
seed = 21600031


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


def make_tree(n):
    weight = [0] * n
    kids = [[] for _ in range(n)]
    neighbours = [[] for _ in range(n)]
    for v in range(1, n):
        p = rand(v)
        weight[v] = 1 + rand(9)
        kids[p].append(v)
        neighbours[p].append([v, weight[v]])
        neighbours[v].append([p, weight[v]])
    return weight, kids, neighbours


TREES = 500
careful_right = 0
careless_right = 0
for _ in range(TREES):
    n = 2 + rand(29)
    weight, kids, neighbours = make_tree(n)
    truth = farthest_by_search(neighbours, n)
    if farthest_by_rerooting(weight, kids, n, True) == truth:
        careful_right += 1
    if farthest_by_rerooting(weight, kids, n, False) == truth:
        careless_right += 1
print("%d random weighted trees of 2 to 30 nodes: farthest distance from every node" % TREES)
print("  rerooting with prefix and suffix maxima matched a search from every node  %d" % careful_right)
print("  rerooting that reuses the parent's whole maximum matched                  %d" % careless_right)
print()
print("         n   search from every node   rerooting")
for n in [500, 1000, 2000]:
    weight, kids, neighbours = make_tree(n)
    work[0] = 0
    slow = farthest_by_search(neighbours, n)
    slow_cost = work[0]
    work[0] = 0
    fast = farthest_by_rerooting(weight, kids, n, True)
    note = "" if slow == fast else "   (disagree)"
    print("%10d %24d %11d%s" % (n, slow_cost, work[0], note))
`,
          output: `500 random weighted trees of 2 to 30 nodes: farthest distance from every node
  rerooting with prefix and suffix maxima matched a search from every node  500
  rerooting that reuses the parent's whole maximum matched                  15

         n   search from every node   rerooting
       500                   499000        1996
      1000                  1998000        3996
      2000                  7996000        7996`,
          explanation:
            "On 500 random weighted trees, rerooting with prefix and suffix maxima matched a full traversal from every node 500 times. The version that reuses the parent's whole maximum matched only 15 times, on trees where the best branch below each parent happened never to be the child being processed. The second table is the cost: a traversal from every node spends 499,000 edge visits at n = 500 and 7,996,000 at n = 2,000, quadrupling as n doubles; rerooting spends 1,996 and 7,996, about 4 per edge.",
          alternates: [
            {
              lang: "javascript",
              code: `// Rerooting when the combine step has no inverse. The farthest distance from
// every node of a weighted tree: a sum can be rerooted by subtracting a child's
// share back out, but a maximum cannot, so the pass down the tree needs the
// best value among a node's other children, from prefix and suffix maxima.

let work = 0;

function farthestBySearch(neighbours, n) {
  // a full traversal from every node: the definition, at O(n^2)
  const out = new Array(n).fill(0);
  for (let start = 0; start < n; start++) {
    let best = 0;
    const stack = [[start, -1, 0]];
    while (stack.length > 0) {
      const [node, cameFrom, dist] = stack.pop();
      best = Math.max(best, dist);
      for (const [other, w] of neighbours[node]) {
        work += 1;
        if (other !== cameFrom) stack.push([other, node, dist + w]);
      }
    }
    out[start] = best;
  }
  return out;
}

function farthestByRerooting(weight, kids, n, careful) {
  // every child is numbered after its parent, so descending node order
  // visits children first and ascending order visits parents first
  // pass one, leaves upward: down[v] = farthest distance below v
  const down = new Array(n).fill(0);
  for (let v = n - 1; v >= 0; v--) {
    for (const c of kids[v]) {
      work += 1;
      down[v] = Math.max(down[v], down[c] + weight[c]);
    }
  }
  // pass two, root downward: up[c] = farthest distance through c's parent
  const up = new Array(n).fill(0);
  for (let v = 0; v < n; v++) {
    const k = kids[v].length;
    const prefix = new Array(k + 1).fill(0); // best among the first i children
    const suffix = new Array(k + 1).fill(0); // best among children i and later
    for (let i = 0; i < k; i++) {
      work += 1;
      const c = kids[v][i];
      prefix[i + 1] = Math.max(prefix[i], down[c] + weight[c]);
    }
    for (let i = k - 1; i >= 0; i--) {
      work += 1;
      const c = kids[v][i];
      suffix[i] = Math.max(suffix[i + 1], down[c] + weight[c]);
    }
    for (let i = 0; i < k; i++) {
      work += 1;
      const c = kids[v][i];
      const others = careful
        ? Math.max(prefix[i], suffix[i + 1]) // every child except c
        : down[v]; // may be c's own branch
      up[c] = weight[c] + Math.max(up[v], others);
    }
  }
  const out = [];
  for (let v = 0; v < n; v++) out.push(Math.max(down[v], up[v]));
  return out;
}

// The same linear congruential generator in every language, so the trees
// below are the same trees whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 21600031n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function makeTree(n) {
  const weight = new Array(n).fill(0);
  const kids = [];
  const neighbours = [];
  for (let v = 0; v < n; v++) {
    kids.push([]);
    neighbours.push([]);
  }
  for (let v = 1; v < n; v++) {
    const p = rand(v);
    weight[v] = 1 + rand(9);
    kids[p].push(v);
    neighbours[p].push([v, weight[v]]);
    neighbours[v].push([p, weight[v]]);
  }
  return [weight, kids, neighbours];
}

function padLeft(s, width) {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

const TREES = 500;
let carefulRight = 0;
let carelessRight = 0;
for (let t = 0; t < TREES; t++) {
  const n = 2 + rand(29);
  const [weight, kids, neighbours] = makeTree(n);
  const truth = farthestBySearch(neighbours, n).join(",");
  if (farthestByRerooting(weight, kids, n, true).join(",") === truth) carefulRight += 1;
  if (farthestByRerooting(weight, kids, n, false).join(",") === truth) carelessRight += 1;
}
console.log(TREES + " random weighted trees of 2 to 30 nodes: farthest distance from every node");
console.log("  rerooting with prefix and suffix maxima matched a search from every node  " + carefulRight);
console.log("  rerooting that reuses the parent's whole maximum matched                  " + carelessRight);
console.log();
console.log("         n   search from every node   rerooting");
for (const n of [500, 1000, 2000]) {
  const [weight, kids, neighbours] = makeTree(n);
  work = 0;
  const slow = farthestBySearch(neighbours, n);
  const slowCost = work;
  work = 0;
  const fast = farthestByRerooting(weight, kids, n, true);
  const note = slow.join(",") === fast.join(",") ? "" : "   (disagree)";
  console.log(padLeft(n, 10) + " " + padLeft(slowCost, 24) + " " + padLeft(work, 11) + note);
}
`,
            },
            {
              lang: "typescript",
              code: `// Rerooting when the combine step has no inverse. The farthest distance from
// every node of a weighted tree: a sum can be rerooted by subtracting a child's
// share back out, but a maximum cannot, so the pass down the tree needs the
// best value among a node's other children, from prefix and suffix maxima.

let work = 0;

function farthestBySearch(neighbours: number[][][], n: number): number[] {
  // a full traversal from every node: the definition, at O(n^2)
  const out = new Array(n).fill(0);
  for (let start = 0; start < n; start++) {
    let best = 0;
    const stack: number[][] = [[start, -1, 0]];
    while (stack.length > 0) {
      const [node, cameFrom, dist] = stack.pop()!;
      best = Math.max(best, dist);
      for (const [other, w] of neighbours[node]) {
        work += 1;
        if (other !== cameFrom) stack.push([other, node, dist + w]);
      }
    }
    out[start] = best;
  }
  return out;
}

function farthestByRerooting(weight: number[], kids: number[][], n: number, careful: boolean): number[] {
  // every child is numbered after its parent, so descending node order
  // visits children first and ascending order visits parents first
  // pass one, leaves upward: down[v] = farthest distance below v
  const down = new Array(n).fill(0);
  for (let v = n - 1; v >= 0; v--) {
    for (const c of kids[v]) {
      work += 1;
      down[v] = Math.max(down[v], down[c] + weight[c]);
    }
  }
  // pass two, root downward: up[c] = farthest distance through c's parent
  const up = new Array(n).fill(0);
  for (let v = 0; v < n; v++) {
    const k = kids[v].length;
    const prefix = new Array(k + 1).fill(0); // best among the first i children
    const suffix = new Array(k + 1).fill(0); // best among children i and later
    for (let i = 0; i < k; i++) {
      work += 1;
      const c = kids[v][i];
      prefix[i + 1] = Math.max(prefix[i], down[c] + weight[c]);
    }
    for (let i = k - 1; i >= 0; i--) {
      work += 1;
      const c = kids[v][i];
      suffix[i] = Math.max(suffix[i + 1], down[c] + weight[c]);
    }
    for (let i = 0; i < k; i++) {
      work += 1;
      const c = kids[v][i];
      const others = careful
        ? Math.max(prefix[i], suffix[i + 1]) // every child except c
        : down[v]; // may be c's own branch
      up[c] = weight[c] + Math.max(up[v], others);
    }
  }
  const out: number[] = [];
  for (let v = 0; v < n; v++) out.push(Math.max(down[v], up[v]));
  return out;
}

// The same linear congruential generator in every language, so the trees
// below are the same trees whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 21600031n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function makeTree(n: number): [number[], number[][], number[][][]] {
  const weight: number[] = new Array(n).fill(0);
  const kids: number[][] = [];
  const neighbours: number[][][] = [];
  for (let v = 0; v < n; v++) {
    kids.push([]);
    neighbours.push([]);
  }
  for (let v = 1; v < n; v++) {
    const p = rand(v);
    weight[v] = 1 + rand(9);
    kids[p].push(v);
    neighbours[p].push([v, weight[v]]);
    neighbours[v].push([p, weight[v]]);
  }
  return [weight, kids, neighbours];
}

function padLeft(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

const TREES = 500;
let carefulRight = 0;
let carelessRight = 0;
for (let t = 0; t < TREES; t++) {
  const n = 2 + rand(29);
  const [weight, kids, neighbours] = makeTree(n);
  const truth = farthestBySearch(neighbours, n).join(",");
  if (farthestByRerooting(weight, kids, n, true).join(",") === truth) carefulRight += 1;
  if (farthestByRerooting(weight, kids, n, false).join(",") === truth) carelessRight += 1;
}
console.log(TREES + " random weighted trees of 2 to 30 nodes: farthest distance from every node");
console.log("  rerooting with prefix and suffix maxima matched a search from every node  " + carefulRight);
console.log("  rerooting that reuses the parent's whole maximum matched                  " + carelessRight);
console.log();
console.log("         n   search from every node   rerooting");
for (const n of [500, 1000, 2000]) {
  const [weight, kids, neighbours] = makeTree(n);
  work = 0;
  const slow = farthestBySearch(neighbours, n);
  const slowCost = work;
  work = 0;
  const fast = farthestByRerooting(weight, kids, n, true);
  const note = slow.join(",") === fast.join(",") ? "" : "   (disagree)";
  console.log(padLeft(n, 10) + " " + padLeft(slowCost, 24) + " " + padLeft(work, 11) + note);
}
`,
            },
            {
              lang: "java",
              code: `// Rerooting when the combine step has no inverse. The farthest distance from
// every node of a weighted tree: a sum can be rerooted by subtracting a child's
// share back out, but a maximum cannot, so the pass down the tree needs the
// best value among a node's other children, from prefix and suffix maxima.

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
  static long work = 0;

  static long[] farthestBySearch(List<List<long[]>> neighbours, int n) {
    // a full traversal from every node: the definition, at O(n^2)
    long[] out = new long[n];
    for (int start = 0; start < n; start++) {
      long best = 0;
      List<long[]> stack = new ArrayList<>();
      stack.add(new long[] {start, -1, 0});
      while (!stack.isEmpty()) {
        long[] top = stack.remove(stack.size() - 1);
        int node = (int) top[0];
        best = Math.max(best, top[2]);
        for (long[] edge : neighbours.get(node)) {
          work += 1;
          if (edge[0] != top[1]) {
            stack.add(new long[] {edge[0], node, top[2] + edge[1]});
          }
        }
      }
      out[start] = best;
    }
    return out;
  }

  static long[] farthestByRerooting(long[] weight, List<List<Integer>> kids, int n, boolean careful) {
    // every child is numbered after its parent, so descending node order
    // visits children first and ascending order visits parents first
    // pass one, leaves upward: down[v] = farthest distance below v
    long[] down = new long[n];
    for (int v = n - 1; v >= 0; v--) {
      for (int c : kids.get(v)) {
        work += 1;
        down[v] = Math.max(down[v], down[c] + weight[c]);
      }
    }
    // pass two, root downward: up[c] = farthest distance through c's parent
    long[] up = new long[n];
    for (int v = 0; v < n; v++) {
      List<Integer> children = kids.get(v);
      int k = children.size();
      long[] prefix = new long[k + 1]; // best among the first i children
      long[] suffix = new long[k + 1]; // best among children i and later
      for (int i = 0; i < k; i++) {
        work += 1;
        int c = children.get(i);
        prefix[i + 1] = Math.max(prefix[i], down[c] + weight[c]);
      }
      for (int i = k - 1; i >= 0; i--) {
        work += 1;
        int c = children.get(i);
        suffix[i] = Math.max(suffix[i + 1], down[c] + weight[c]);
      }
      for (int i = 0; i < k; i++) {
        work += 1;
        int c = children.get(i);
        long others = careful
            ? Math.max(prefix[i], suffix[i + 1]) // every child except c
            : down[v]; // may be c's own branch
        up[c] = weight[c] + Math.max(up[v], others);
      }
    }
    long[] out = new long[n];
    for (int v = 0; v < n; v++) {
      out[v] = Math.max(down[v], up[v]);
    }
    return out;
  }

  // The same linear congruential generator in every language, so the trees
  // below are the same trees whichever translation is run.
  static long seed = 21600031L;

  static int rand(int n) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return (int) (seed / 65536L % n);
  }

  static long[] weight;
  static List<List<Integer>> kids;
  static List<List<long[]>> neighbours;

  static void makeTree(int n) {
    weight = new long[n];
    kids = new ArrayList<>();
    neighbours = new ArrayList<>();
    for (int v = 0; v < n; v++) {
      kids.add(new ArrayList<>());
      neighbours.add(new ArrayList<>());
    }
    for (int v = 1; v < n; v++) {
      int p = rand(v);
      weight[v] = 1 + rand(9);
      kids.get(p).add(v);
      neighbours.get(p).add(new long[] {v, weight[v]});
      neighbours.get(v).add(new long[] {p, weight[v]});
    }
  }

  public static void main(String[] args) {
    final int trees = 500;
    int carefulRight = 0;
    int carelessRight = 0;
    for (int t = 0; t < trees; t++) {
      int n = 2 + rand(29);
      makeTree(n);
      long[] truth = farthestBySearch(neighbours, n);
      if (Arrays.equals(farthestByRerooting(weight, kids, n, true), truth)) {
        carefulRight += 1;
      }
      if (Arrays.equals(farthestByRerooting(weight, kids, n, false), truth)) {
        carelessRight += 1;
      }
    }
    System.out.printf("%d random weighted trees of 2 to 30 nodes: farthest distance from every node%n", trees);
    System.out.println("  rerooting with prefix and suffix maxima matched a search from every node  " + carefulRight);
    System.out.println("  rerooting that reuses the parent's whole maximum matched                  " + carelessRight);
    System.out.println();
    System.out.println("         n   search from every node   rerooting");
    int[] sizes = {500, 1000, 2000};
    for (int n : sizes) {
      makeTree(n);
      work = 0;
      long[] slow = farthestBySearch(neighbours, n);
      long slowCost = work;
      work = 0;
      long[] fast = farthestByRerooting(weight, kids, n, true);
      String note = Arrays.equals(slow, fast) ? "" : "   (disagree)";
      System.out.printf("%10d %24d %11d%s%n", n, slowCost, work, note);
    }
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// Rerooting when the combine step has no inverse. The farthest distance from
// every node of a weighted tree: a sum can be rerooted by subtracting a child's
// share back out, but a maximum cannot, so the pass down the tree needs the
// best value among a node's other children, from prefix and suffix maxima.

#include <algorithm>
#include <cstdio>
#include <vector>

long long work = 0;

struct Step {
  int node;
  int cameFrom;
  long long dist;
};

std::vector<long long> farthestBySearch(const std::vector<std::vector<std::pair<int, long long> > >& neighbours,
                                        int n) {
  // a full traversal from every node: the definition, at O(n^2)
  std::vector<long long> out(n, 0);
  for (int start = 0; start < n; start++) {
    long long best = 0;
    std::vector<Step> stack(1, Step{start, -1, 0});
    while (!stack.empty()) {
      Step top = stack.back();
      stack.pop_back();
      best = std::max(best, top.dist);
      for (const std::pair<int, long long>& edge : neighbours[top.node]) {
        work += 1;
        if (edge.first != top.cameFrom) {
          stack.push_back(Step{edge.first, top.node, top.dist + edge.second});
        }
      }
    }
    out[start] = best;
  }
  return out;
}

std::vector<long long> farthestByRerooting(const std::vector<long long>& weight,
                                           const std::vector<std::vector<int> >& kids, int n,
                                           bool careful) {
  // every child is numbered after its parent, so descending node order
  // visits children first and ascending order visits parents first
  // pass one, leaves upward: down[v] = farthest distance below v
  std::vector<long long> down(n, 0);
  for (int v = n - 1; v >= 0; v--) {
    for (int c : kids[v]) {
      work += 1;
      down[v] = std::max(down[v], down[c] + weight[c]);
    }
  }
  // pass two, root downward: up[c] = farthest distance through c's parent
  std::vector<long long> up(n, 0);
  for (int v = 0; v < n; v++) {
    int k = (int)kids[v].size();
    std::vector<long long> prefix(k + 1, 0);  // best among the first i children
    std::vector<long long> suffix(k + 1, 0);  // best among children i and later
    for (int i = 0; i < k; i++) {
      work += 1;
      int c = kids[v][i];
      prefix[i + 1] = std::max(prefix[i], down[c] + weight[c]);
    }
    for (int i = k - 1; i >= 0; i--) {
      work += 1;
      int c = kids[v][i];
      suffix[i] = std::max(suffix[i + 1], down[c] + weight[c]);
    }
    for (int i = 0; i < k; i++) {
      work += 1;
      int c = kids[v][i];
      long long others = careful ? std::max(prefix[i], suffix[i + 1])  // every child except c
                                 : down[v];                            // may be c's own branch
      up[c] = weight[c] + std::max(up[v], others);
    }
  }
  std::vector<long long> out(n);
  for (int v = 0; v < n; v++) {
    out[v] = std::max(down[v], up[v]);
  }
  return out;
}

// The same linear congruential generator in every language, so the trees
// below are the same trees whichever translation is run.
long long seed = 21600031LL;

int rand_below(int n) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return (int)(seed / 65536LL % n);
}

std::vector<long long> weight;
std::vector<std::vector<int> > kids;
std::vector<std::vector<std::pair<int, long long> > > neighbours;

void makeTree(int n) {
  weight.assign(n, 0);
  kids.assign(n, std::vector<int>());
  neighbours.assign(n, std::vector<std::pair<int, long long> >());
  for (int v = 1; v < n; v++) {
    int p = rand_below(v);
    weight[v] = 1 + rand_below(9);
    kids[p].push_back(v);
    neighbours[p].push_back(std::make_pair(v, weight[v]));
    neighbours[v].push_back(std::make_pair(p, weight[v]));
  }
}

int main() {
  const int trees = 500;
  int carefulRight = 0;
  int carelessRight = 0;
  for (int t = 0; t < trees; t++) {
    int n = 2 + rand_below(29);
    makeTree(n);
    std::vector<long long> truth = farthestBySearch(neighbours, n);
    if (farthestByRerooting(weight, kids, n, true) == truth) {
      carefulRight += 1;
    }
    if (farthestByRerooting(weight, kids, n, false) == truth) {
      carelessRight += 1;
    }
  }
  std::printf("%d random weighted trees of 2 to 30 nodes: farthest distance from every node\\n", trees);
  std::printf("  rerooting with prefix and suffix maxima matched a search from every node  %d\\n", carefulRight);
  std::printf("  rerooting that reuses the parent's whole maximum matched                  %d\\n", carelessRight);
  std::printf("\\n");
  std::printf("         n   search from every node   rerooting\\n");
  int sizes[3] = {500, 1000, 2000};
  for (int n : sizes) {
    makeTree(n);
    work = 0;
    std::vector<long long> slow = farthestBySearch(neighbours, n);
    long long slowCost = work;
    work = 0;
    std::vector<long long> fast = farthestByRerooting(weight, kids, n, true);
    std::printf("%10d %24lld %11lld%s\\n", n, slowCost, work, slow == fast ? "" : "   (disagree)");
  }
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Rerooting when the combine step has no inverse. The farthest distance from
// every node of a weighted tree: a sum can be rerooted by subtracting a child's
// share back out, but a maximum cannot, so the pass down the tree needs the
// best value among a node's other children, from prefix and suffix maxima.

fn farthest_by_search(neighbours: &[Vec<(usize, i64)>], n: usize, work: &mut i64) -> Vec<i64> {
    // a full traversal from every node: the definition, at O(n^2)
    let mut out = vec![0i64; n];
    for start in 0..n {
        let mut best = 0;
        let mut stack: Vec<(usize, usize, i64)> = vec![(start, usize::MAX, 0)];
        while let Some((node, came_from, dist)) = stack.pop() {
            best = best.max(dist);
            for &(other, w) in neighbours[node].iter() {
                *work += 1;
                if other != came_from {
                    stack.push((other, node, dist + w));
                }
            }
        }
        out[start] = best;
    }
    out
}

fn farthest_by_rerooting(weight: &[i64], kids: &[Vec<usize>], n: usize, careful: bool, work: &mut i64) -> Vec<i64> {
    // every child is numbered after its parent, so descending node order
    // visits children first and ascending order visits parents first
    // pass one, leaves upward: down[v] = farthest distance below v
    let mut down = vec![0i64; n];
    for v in (0..n).rev() {
        for &c in kids[v].iter() {
            *work += 1;
            down[v] = down[v].max(down[c] + weight[c]);
        }
    }
    // pass two, root downward: up[c] = farthest distance through c's parent
    let mut up = vec![0i64; n];
    for v in 0..n {
        let k = kids[v].len();
        let mut prefix = vec![0i64; k + 1]; // best among the first i children
        let mut suffix = vec![0i64; k + 1]; // best among children i and later
        for i in 0..k {
            *work += 1;
            let c = kids[v][i];
            prefix[i + 1] = prefix[i].max(down[c] + weight[c]);
        }
        for i in (0..k).rev() {
            *work += 1;
            let c = kids[v][i];
            suffix[i] = suffix[i + 1].max(down[c] + weight[c]);
        }
        for i in 0..k {
            *work += 1;
            let c = kids[v][i];
            let others = if careful {
                prefix[i].max(suffix[i + 1]) // every child except c
            } else {
                down[v] // may be c's own branch
            };
            up[c] = weight[c] + up[v].max(others);
        }
    }
    (0..n).map(|v| down[v].max(up[v])).collect()
}

// The same linear congruential generator in every language, so the trees
// below are the same trees whichever translation is run.
static mut SEED: i64 = 21600031;

fn rand_below(n: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % n
    }
}

fn make_tree(n: usize) -> (Vec<i64>, Vec<Vec<usize>>, Vec<Vec<(usize, i64)>>) {
    let mut weight = vec![0i64; n];
    let mut kids: Vec<Vec<usize>> = vec![Vec::new(); n];
    let mut neighbours: Vec<Vec<(usize, i64)>> = vec![Vec::new(); n];
    for v in 1..n {
        let p = rand_below(v as i64) as usize;
        weight[v] = 1 + rand_below(9);
        kids[p].push(v);
        neighbours[p].push((v, weight[v]));
        neighbours[v].push((p, weight[v]));
    }
    (weight, kids, neighbours)
}

fn main() {
    let trees = 500;
    let mut ignored = 0;
    let mut careful_right = 0;
    let mut careless_right = 0;
    for _ in 0..trees {
        let n = 2 + rand_below(29) as usize;
        let (weight, kids, neighbours) = make_tree(n);
        let truth = farthest_by_search(&neighbours, n, &mut ignored);
        if farthest_by_rerooting(&weight, &kids, n, true, &mut ignored) == truth {
            careful_right += 1;
        }
        if farthest_by_rerooting(&weight, &kids, n, false, &mut ignored) == truth {
            careless_right += 1;
        }
    }
    println!("{} random weighted trees of 2 to 30 nodes: farthest distance from every node", trees);
    println!("  rerooting with prefix and suffix maxima matched a search from every node  {}", careful_right);
    println!("  rerooting that reuses the parent's whole maximum matched                  {}", careless_right);
    println!();
    println!("         n   search from every node   rerooting");
    for &n in [500usize, 1000, 2000].iter() {
        let (weight, kids, neighbours) = make_tree(n);
        let mut slow_cost = 0;
        let slow = farthest_by_search(&neighbours, n, &mut slow_cost);
        let mut fast_cost = 0;
        let fast = farthest_by_rerooting(&weight, &kids, n, true, &mut fast_cost);
        let note = if slow == fast { "" } else { "   (disagree)" };
        println!("{:>10} {:>24} {:>11}{}", n, slow_cost, fast_cost, note);
    }
}
`,
            },
            {
              lang: "go",
              code: `// Rerooting when the combine step has no inverse. The farthest distance from
// every node of a weighted tree: a sum can be rerooted by subtracting a child's
// share back out, but a maximum cannot, so the pass down the tree needs the
// best value among a node's other children, from prefix and suffix maxima.

package main

import "fmt"

var work int64

type neighbour struct {
	node   int
	weight int64
}

func farthestBySearch(neighbours [][]neighbour, n int) []int64 {
	// a full traversal from every node: the definition, at O(n^2)
	type step struct {
		node, cameFrom int
		dist           int64
	}
	out := make([]int64, n)
	for start := 0; start < n; start++ {
		var best int64
		stack := []step{{start, -1, 0}}
		for len(stack) > 0 {
			top := stack[len(stack)-1]
			stack = stack[:len(stack)-1]
			best = max(best, top.dist)
			for _, edge := range neighbours[top.node] {
				work++
				if edge.node != top.cameFrom {
					stack = append(stack, step{edge.node, top.node, top.dist + edge.weight})
				}
			}
		}
		out[start] = best
	}
	return out
}

func farthestByRerooting(weight []int64, kids [][]int, n int, careful bool) []int64 {
	// every child is numbered after its parent, so descending node order
	// visits children first and ascending order visits parents first
	// pass one, leaves upward: down[v] = farthest distance below v
	down := make([]int64, n)
	for v := n - 1; v >= 0; v-- {
		for _, c := range kids[v] {
			work++
			down[v] = max(down[v], down[c]+weight[c])
		}
	}
	// pass two, root downward: up[c] = farthest distance through c's parent
	up := make([]int64, n)
	for v := 0; v < n; v++ {
		k := len(kids[v])
		prefix := make([]int64, k+1) // best among the first i children
		suffix := make([]int64, k+1) // best among children i and later
		for i := 0; i < k; i++ {
			work++
			c := kids[v][i]
			prefix[i+1] = max(prefix[i], down[c]+weight[c])
		}
		for i := k - 1; i >= 0; i-- {
			work++
			c := kids[v][i]
			suffix[i] = max(suffix[i+1], down[c]+weight[c])
		}
		for i := 0; i < k; i++ {
			work++
			c := kids[v][i]
			others := down[v] // may be c's own branch
			if careful {
				others = max(prefix[i], suffix[i+1]) // every child except c
			}
			up[c] = weight[c] + max(up[v], others)
		}
	}
	out := make([]int64, n)
	for v := 0; v < n; v++ {
		out[v] = max(down[v], up[v])
	}
	return out
}

// The same linear congruential generator in every language, so the trees
// below are the same trees whichever translation is run.
var seed int64 = 21600031

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func makeTree(n int) ([]int64, [][]int, [][]neighbour) {
	weight := make([]int64, n)
	kids := make([][]int, n)
	neighbours := make([][]neighbour, n)
	for v := 1; v < n; v++ {
		p := randBelow(v)
		weight[v] = int64(1 + randBelow(9))
		kids[p] = append(kids[p], v)
		neighbours[p] = append(neighbours[p], neighbour{v, weight[v]})
		neighbours[v] = append(neighbours[v], neighbour{p, weight[v]})
	}
	return weight, kids, neighbours
}

func same(a, b []int64) bool {
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return len(a) == len(b)
}

func main() {
	const trees = 500
	carefulRight := 0
	carelessRight := 0
	for t := 0; t < trees; t++ {
		n := 2 + randBelow(29)
		weight, kids, neighbours := makeTree(n)
		truth := farthestBySearch(neighbours, n)
		if same(farthestByRerooting(weight, kids, n, true), truth) {
			carefulRight++
		}
		if same(farthestByRerooting(weight, kids, n, false), truth) {
			carelessRight++
		}
	}
	fmt.Printf("%d random weighted trees of 2 to 30 nodes: farthest distance from every node\\n", trees)
	fmt.Printf("  rerooting with prefix and suffix maxima matched a search from every node  %d\\n", carefulRight)
	fmt.Printf("  rerooting that reuses the parent's whole maximum matched                  %d\\n", carelessRight)
	fmt.Println()
	fmt.Println("         n   search from every node   rerooting")
	for _, n := range []int{500, 1000, 2000} {
		weight, kids, neighbours := makeTree(n)
		work = 0
		slow := farthestBySearch(neighbours, n)
		slowCost := work
		work = 0
		fast := farthestByRerooting(weight, kids, n, true)
		note := ""
		if !same(slow, fast) {
			note = "   (disagree)"
		}
		fmt.Printf("%10d %24d %11d%s\\n", n, slowCost, work, note)
	}
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "ordering",
      heading: "Ordering the passes",
      body: [
        "Pass one needs children before parents; pass two needs parents before children. A recursive depth-first search provides both, and on a path-shaped tree of 100,000 nodes it overflows CPython's recursion limit, Node's stack and Java's — though not C++'s on Linux or Go's.",
        "Two iterative orders avoid that. When parents are always numbered before their children \u2014 true of the program's random trees, and arranged by relabelling otherwise \u2014 descending numeric order visits children first and ascending order visits parents first. In general, record the order in which a breadth-first or iterative depth-first search discovers nodes; that list has every parent before its children, and its reverse has every child before its parent.",
        "The same two orders serve every rerooting problem. Only the combine and what \"everything except this child\" means change between them.",
      ],
      pitfalls: [
        {
          title: "Rerooting a maximum by reusing the parent's total",
          body: "Measured: right on 15 of 500 trees. Exclude the child with prefix and suffix maxima, or with the best and second-best branches.",
        },
        {
          title: "Recursion on deep trees",
          body: "Both passes need only a parent-before-child order. Record one iteratively and walk it forwards and backwards.",
        },
        {
          title: "Forgetting the edge back to the parent in up[c]",
          body: "The path from c through its parent starts with that edge's weight. Omitting it makes every up value short by one edge.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you compute the farthest distance from every node of a tree in linear time?",
      answer:
        "Rerooting. Pass one, leaves upward, computes down[v], the farthest distance into v's subtree, as the maximum of down[c] plus the edge weight over children. Pass two, root downward, computes up[c], the farthest distance from c going through its parent: the edge weight plus the larger of up[v] and the best branch below v among v's other children. The answer is max(down, up). I measured it against a traversal from every node: 7,996 steps at n = 2,000 against 7,996,000, and all 500 random trees matched.",
    },
    {
      question: "Why can't you reroot a maximum the same way as a sum?",
      answer:
        "For a sum you remove a child's share by subtracting it. A maximum has no inverse: if the best branch below v is the child's own, the maximum does not tell you the best of the rest. Reusing it anyway counts paths that go up to the parent and straight back down into the same subtree. I measured that version and it matched a brute-force search on only 15 of 500 trees. The fix is prefix and suffix maxima over the children, so every child gets the combine of all the others -- or, for max specifically, keeping the best and second-best branch.",
    },
  ],
  takeaways: [
    "Pass one builds down[v] from children; pass two builds up[c] from the parent",
    "The answer for each node combines down and up",
    "A sum is rerooted by subtraction; a maximum has no inverse",
    "Every child except one: combine(prefix[i], suffix[i + 1])",
    "Measured: prefix and suffix maxima 500 of 500, reusing the whole maximum 15",
    "Measured at n = 2,000: 7,996 steps against 7,996,000 searching from every node",
    "Record a parent-before-child order iteratively and walk it both ways",
  ],
};
