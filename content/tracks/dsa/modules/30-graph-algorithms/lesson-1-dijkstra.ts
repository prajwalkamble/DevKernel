import type { Lesson } from "@/content/types";

export const dijkstraLesson: Lesson = {
  id: "dsa-graph-algorithms-dijkstra",
  slug: "dijkstra",
  moduleSlug: "graph-algorithms",
  title: "Dijkstra, and What a Negative Edge Does",
  summary:
    "The greedy step that turns breadth-first search into a weighted shortest-path algorithm, the one assumption that licenses it, and what happens when that assumption fails \u2014 measured, including the repair that looks obvious and changes the answer \u2014 followed by the frontier choice that decides the running time without touching the result.",
  estimatedMinutes: 45,
  objectives: [
    "State the greedy step and the invariant that makes it sound",
    "Explain what a negative edge does, and in which direction the answer moves",
    "Reject the constant-lift repair with a reason rather than a rule",
    "Choose between a heap and a scan by the density of the graph",
  ],
  sections: [
    {
      id: "one-greedy-step",
      heading: "One greedy step",
      body: [
        "Breadth-first search answers \"fewest edges\" and is exact about it. Put a number on the edges and it goes on answering that question, correctly, about something nobody asked. Dijkstra's algorithm is what replaces it, and the whole of it is one greedy step: **take the unsettled node with the smallest known distance, declare that distance final, and relax its edges.**",
        "The declaration is the algorithm. Everything else \u2014 the frontier, the heap, the relaxations \u2014 is bookkeeping around the claim that when a node is chosen, nothing still under construction can arrive cheaper. That claim needs a reason, and the reason is that every edge adds a non-negative amount.",
        "The example checks the invariant the claim rests on rather than asserting it: over 3,000 random weighted graphs, distances came off the frontier in ascending order 3,000 times, and the distances matched an exhaustive search over every simple path 3,000 times. The second follows from the first. If nodes are settled in ascending order of distance, then at the moment a node is settled every route still in progress already costs at least as much, so no later route can improve it.",
        "Beside Dijkstra the example also runs the thing that makes no such claim: relax every edge, repeatedly, until nothing improves. It is also right on all 3,000 graphs, and it needs no ordering argument at all. That contrast is the shape of the rest of the module \u2014 the greedy algorithm is faster because it makes an assumption, and the assumption is a condition on the input.",
      ],
      examples: [
        {
          id: "settle-and-relax",
          title: "Dijkstra against every simple path, with the settle order checked",
          lang: "python",
          code: `# Dijkstra's algorithm, and the single assumption it is built on.
#
# The algorithm is greedy: take the unsettled node with the smallest known
# distance, declare that distance final, and relax its edges. The declaration
# is the whole thing, and it is only justified because every edge adds a
# non-negative amount -- so nothing reached later can come back cheaper.
#
# The example runs Dijkstra, runs the relaxation-until-nothing-changes version
# that makes no such claim, and scores both against every simple path. It also
# checks the invariant the greedy step depends on: that distances come off the
# frontier in non-decreasing order.
INF = 10 ** 9


def build(n, edges):
    """Directed, weighted. Each entry is (neighbour, cost)."""
    neighbours = [[] for _ in range(n)]
    for u, v, w in edges:
        neighbours[u].append((v, w))
    return neighbours


def dijkstra(neighbours, start):
    """Settle the closest unsettled node, then relax its edges. No heap yet."""
    n = len(neighbours)
    best = [INF] * n
    settled = [False] * n
    best[start] = 0
    order = []
    non_decreasing = True
    previous = 0
    for _ in range(n):
        at = -1
        for v in range(n):
            if not settled[v] and best[v] < INF and (at < 0 or best[v] < best[at]):
                at = v
        if at < 0:
            break
        if best[at] < previous:
            non_decreasing = False
        previous = best[at]
        settled[at] = True
        order.append(at)
        for u, w in neighbours[at]:
            if best[at] + w < best[u]:
                best[u] = best[at] + w
    return best, order, non_decreasing


def relax_until_settled(neighbours, start):
    """Relax every edge until nothing improves. Claims nothing, needs no order."""
    n = len(neighbours)
    best = [INF] * n
    best[start] = 0
    for _ in range(n):
        changed = False
        for v in range(n):
            if best[v] >= INF:
                continue
            for u, w in neighbours[v]:
                if best[v] + w < best[u]:
                    best[u] = best[v] + w
                    changed = True
        if not changed:
            break
    return best


def cheapest_by_walking(n, edges, start, target):
    """Every simple path from start to target. The definition."""
    neighbours = build(n, edges)
    best = [INF]
    on_path = [False] * n

    def step(v, spent):
        if spent >= best[0]:
            return
        if v == target:
            best[0] = spent
            return
        on_path[v] = True
        for u, w in neighbours[v]:
            if not on_path[u]:
                step(u, spent + w)
        on_path[v] = False

    step(start, 0)
    return best[0]


def show(values):
    out = []
    for v in values:
        out.append("-" if v >= INF else str(v))
    return "[" + ", ".join(out) + "]"


def show_edges(edges):
    return "[" + ", ".join(f"{u}->{v}:{w}" for u, v, w in edges) + "]"


CASES = [
    (4, [(0, 1, 1), (1, 3, 1), (0, 2, 5), (2, 3, 1)]),
    (4, [(0, 1, 9), (1, 3, 9), (0, 2, 1), (2, 3, 1)]),
    (5, [(0, 1, 2), (1, 2, 2), (0, 2, 5), (2, 3, 1), (3, 4, 3), (1, 4, 9)]),
    (4, [(0, 1, 3), (1, 2, 4)]),
]

print(f"{'edges':<50}{'distances':<22}{'settle order'}")
for n, edges in CASES:
    neighbours = build(n, edges)
    best, order, _ = dijkstra(neighbours, 0)
    print(f"{show_edges(edges):<50}{show(best):<22}{show(order)}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
dijkstra_ok = 0
relax_ok = 0
order_ok = 0
settled_all = 0
for _ in range(TRIALS):
    n = 2 + rand(6)
    edges = []
    for u in range(n):
        for v in range(n):
            if u != v and rand(3) == 0:
                edges.append((u, v, 1 + rand(9)))
    neighbours = build(n, edges)
    best, order, non_decreasing = dijkstra(neighbours, 0)
    slow = relax_until_settled(neighbours, 0)
    good_dijkstra = True
    good_relax = True
    for target in range(n):
        truth = cheapest_by_walking(n, edges, 0, target)
        if best[target] != truth:
            good_dijkstra = False
        if slow[target] != truth:
            good_relax = False
    if good_dijkstra:
        dijkstra_ok += 1
    if good_relax:
        relax_ok += 1
    if non_decreasing:
        order_ok += 1
    if len(order) == n:
        settled_all += 1

print(f"over {TRIALS} random weighted graphs on up to 7 nodes:")
print(f"  Dijkstra matched every simple path   {dijkstra_ok:>6}")
print(f"  relaxing to a fixed point matched it {relax_ok:>6}")
print(f"  distances settled in ascending order {order_ok:>6}")
print(f"  every node was reachable             {settled_all:>6}")
print()
print("The third line is what licenses the first. Dijkstra settles a")
print("node and never looks at it again, which is only allowed because the")
print("distances come off in ascending order -- so when a node is chosen, no")
print("route still under construction can arrive cheaper. Every edge adding a")
print("non-negative amount is what makes that true, and it is the only thing")
print("that does. The relaxation version below makes no such claim: it just")
print("keeps improving until nothing improves, which is slower and, as the next")
print("example shows, survives conditions Dijkstra does not.")
`,
          output: `edges                                             distances             settle order
[0->1:1, 1->3:1, 0->2:5, 2->3:1]                  [0, 1, 5, 2]          [0, 1, 3, 2]
[0->1:9, 1->3:9, 0->2:1, 2->3:1]                  [0, 9, 1, 2]          [0, 2, 3, 1]
[0->1:2, 1->2:2, 0->2:5, 2->3:1, 3->4:3, 1->4:9]  [0, 2, 4, 5, 8]       [0, 1, 2, 3, 4]
[0->1:3, 1->2:4]                                  [0, 3, 7, -]          [0, 1, 2]

over 3000 random weighted graphs on up to 7 nodes:
  Dijkstra matched every simple path     3000
  relaxing to a fixed point matched it   3000
  distances settled in ascending order   3000
  every node was reachable               1010

The third line is what licenses the first. Dijkstra settles a
node and never looks at it again, which is only allowed because the
distances come off in ascending order -- so when a node is chosen, no
route still under construction can arrive cheaper. Every edge adding a
non-negative amount is what makes that true, and it is the only thing
that does. The relaxation version below makes no such claim: it just
keeps improving until nothing improves, which is slower and, as the next
example shows, survives conditions Dijkstra does not.`,
          explanation:
            "Dijkstra scored against every simple path, next to a relaxation that makes no ordering claim, with the ascending-order invariant checked on every settle. The third counter is the reason the first one is 3,000.",
          alternates: [
            {
              lang: "javascript",
              code: `// Dijkstra's algorithm, and the single assumption it is built on.
//
// The algorithm is greedy: take the unsettled node with the smallest known
// distance, declare that distance final, and relax its edges. The declaration
// is the whole thing, and it is only justified because every edge adds a
// non-negative amount -- so nothing reached later can come back cheaper.
//
// The example runs Dijkstra, runs the relaxation-until-nothing-changes version
// that makes no such claim, and scores both against every simple path. It also
// checks the invariant the greedy step depends on: that distances come off the
// frontier in non-decreasing order.

const INF = 1000000000;

/** Directed, weighted. Each entry is (neighbour, cost). */
function build(n, edges) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) neighbours[u].push([v, w]);
  return neighbours;
}

/** Settle the closest unsettled node, then relax its edges. No heap yet. */
function dijkstra(neighbours, start) {
  const n = neighbours.length;
  const best = new Array(n).fill(INF);
  const settled = new Array(n).fill(false);
  best[start] = 0;
  const order = [];
  let nonDecreasing = true;
  let previous = 0;
  for (let round = 0; round < n; round += 1) {
    let at = -1;
    for (let v = 0; v < n; v += 1) {
      if (!settled[v] && best[v] < INF && (at < 0 || best[v] < best[at])) at = v;
    }
    if (at < 0) break;
    if (best[at] < previous) nonDecreasing = false;
    previous = best[at];
    settled[at] = true;
    order.push(at);
    for (const [u, w] of neighbours[at]) {
      if (best[at] + w < best[u]) best[u] = best[at] + w;
    }
  }
  return [best, order, nonDecreasing];
}

/** Relax every edge until nothing improves. Claims nothing, needs no order. */
function relaxUntilSettled(neighbours, start) {
  const n = neighbours.length;
  const best = new Array(n).fill(INF);
  best[start] = 0;
  for (let round = 0; round < n; round += 1) {
    let changed = false;
    for (let v = 0; v < n; v += 1) {
      if (best[v] >= INF) continue;
      for (const [u, w] of neighbours[v]) {
        if (best[v] + w < best[u]) {
          best[u] = best[v] + w;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  return best;
}

/** Every simple path from start to target. The definition. */
function cheapestByWalking(n, edges, start, target) {
  const neighbours = build(n, edges);
  let best = INF;
  const onPath = new Array(n).fill(false);

  function step(v, spent) {
    if (spent >= best) return;
    if (v === target) {
      best = spent;
      return;
    }
    onPath[v] = true;
    for (const [u, w] of neighbours[v]) {
      if (!onPath[u]) step(u, spent + w);
    }
    onPath[v] = false;
  }

  step(start, 0);
  return best;
}

const show = (values) =>
  "[" + values.map((v) => (v >= INF ? "-" : String(v))).join(", ") + "]";
const showEdges = (edges) =>
  "[" + edges.map(([u, v, w]) => \`\${u}->\${v}:\${w}\`).join(", ") + "]";
const padEnd = (v, w) => String(v).padEnd(w);
const pad = (v, w) => String(v).padStart(w);

const CASES = [
  [4, [[0, 1, 1], [1, 3, 1], [0, 2, 5], [2, 3, 1]]],
  [4, [[0, 1, 9], [1, 3, 9], [0, 2, 1], [2, 3, 1]]],
  [5, [[0, 1, 2], [1, 2, 2], [0, 2, 5], [2, 3, 1], [3, 4, 3], [1, 4, 9]]],
  [4, [[0, 1, 3], [1, 2, 4]]],
];

console.log(padEnd("edges", 50) + padEnd("distances", 22) + "settle order");
for (const [n, edges] of CASES) {
  const neighbours = build(n, edges);
  const [best, order] = dijkstra(neighbours, 0);
  console.log(padEnd(showEdges(edges), 50) + padEnd(show(best), 22) + show(order));
}
console.log();

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 1n;
function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const TRIALS = 3000;
let dijkstraOk = 0;
let relaxOk = 0;
let orderOk = 0;
let settledAll = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v && rand(3) === 0) edges.push([u, v, 1 + rand(9)]);
    }
  }
  const neighbours = build(n, edges);
  const [best, order, nonDecreasing] = dijkstra(neighbours, 0);
  const slow = relaxUntilSettled(neighbours, 0);
  let goodDijkstra = true;
  let goodRelax = true;
  for (let target = 0; target < n; target += 1) {
    const truth = cheapestByWalking(n, edges, 0, target);
    if (best[target] !== truth) goodDijkstra = false;
    if (slow[target] !== truth) goodRelax = false;
  }
  if (goodDijkstra) dijkstraOk += 1;
  if (goodRelax) relaxOk += 1;
  if (nonDecreasing) orderOk += 1;
  if (order.length === n) settledAll += 1;
}

console.log(\`over \${TRIALS} random weighted graphs on up to 7 nodes:\`);
console.log(\`  Dijkstra matched every simple path   \${pad(dijkstraOk, 6)}\`);
console.log(\`  relaxing to a fixed point matched it \${pad(relaxOk, 6)}\`);
console.log(\`  distances settled in ascending order \${pad(orderOk, 6)}\`);
console.log(\`  every node was reachable             \${pad(settledAll, 6)}\`);
console.log();
console.log("The third line is what licenses the first. Dijkstra settles a");
console.log("node and never looks at it again, which is only allowed because the");
console.log("distances come off in ascending order -- so when a node is chosen, no");
console.log("route still under construction can arrive cheaper. Every edge adding a");
console.log("non-negative amount is what makes that true, and it is the only thing");
console.log("that does. The relaxation version below makes no such claim: it just");
console.log("keeps improving until nothing improves, which is slower and, as the next");
console.log("example shows, survives conditions Dijkstra does not.");
`,
            },
            {
              lang: "typescript",
              code: `// Dijkstra's algorithm, and the single assumption it is built on.
//
// The algorithm is greedy: take the unsettled node with the smallest known
// distance, declare that distance final, and relax its edges. The declaration
// is the whole thing, and it is only justified because every edge adds a
// non-negative amount -- so nothing reached later can come back cheaper.
//
// The example runs Dijkstra, runs the relaxation-until-nothing-changes version
// that makes no such claim, and scores both against every simple path. It also
// checks the invariant the greedy step depends on: that distances come off the
// frontier in non-decreasing order.

const INF = 1000000000;

type Weighted = [number, number, number];
type Link = [number, number];

/** Directed, weighted. Each entry is (neighbour, cost). */
function build(n: number, edges: Weighted[]): Link[][] {
  const neighbours: Link[][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) neighbours[u].push([v, w]);
  return neighbours;
}

/** Settle the closest unsettled node, then relax its edges. No heap yet. */
function dijkstra(neighbours: Link[][], start: number): [number[], number[], boolean] {
  const n = neighbours.length;
  const best = new Array(n).fill(INF);
  const settled = new Array(n).fill(false);
  best[start] = 0;
  const order: number[] = [];
  let nonDecreasing = true;
  let previous = 0;
  for (let round = 0; round < n; round += 1) {
    let at = -1;
    for (let v = 0; v < n; v += 1) {
      if (!settled[v] && best[v] < INF && (at < 0 || best[v] < best[at])) at = v;
    }
    if (at < 0) break;
    if (best[at] < previous) nonDecreasing = false;
    previous = best[at];
    settled[at] = true;
    order.push(at);
    for (const [u, w] of neighbours[at]) {
      if (best[at] + w < best[u]) best[u] = best[at] + w;
    }
  }
  return [best, order, nonDecreasing];
}

/** Relax every edge until nothing improves. Claims nothing, needs no order. */
function relaxUntilSettled(neighbours: Link[][], start: number): number[] {
  const n = neighbours.length;
  const best = new Array(n).fill(INF);
  best[start] = 0;
  for (let round = 0; round < n; round += 1) {
    let changed = false;
    for (let v = 0; v < n; v += 1) {
      if (best[v] >= INF) continue;
      for (const [u, w] of neighbours[v]) {
        if (best[v] + w < best[u]) {
          best[u] = best[v] + w;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  return best;
}

/** Every simple path from start to target. The definition. */
function cheapestByWalking(n: number, edges: Weighted[], start: number, target: number): number {
  const neighbours = build(n, edges);
  let best = INF;
  const onPath = new Array(n).fill(false);

  function step(v: number, spent: number): void {
    if (spent >= best) return;
    if (v === target) {
      best = spent;
      return;
    }
    onPath[v] = true;
    for (const [u, w] of neighbours[v]) {
      if (!onPath[u]) step(u, spent + w);
    }
    onPath[v] = false;
  }

  step(start, 0);
  return best;
}

const show = (values: number[]): string =>
  "[" + values.map((v) => (v >= INF ? "-" : String(v))).join(", ") + "]";
const showEdges = (edges: Weighted[]): string =>
  "[" + edges.map(([u, v, w]) => \`\${u}->\${v}:\${w}\`).join(", ") + "]";
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const pad = (v: string | number, w: number): string => String(v).padStart(w);

const CASES: [number, Weighted[]][] = [
  [4, [[0, 1, 1], [1, 3, 1], [0, 2, 5], [2, 3, 1]]],
  [4, [[0, 1, 9], [1, 3, 9], [0, 2, 1], [2, 3, 1]]],
  [5, [[0, 1, 2], [1, 2, 2], [0, 2, 5], [2, 3, 1], [3, 4, 3], [1, 4, 9]]],
  [4, [[0, 1, 3], [1, 2, 4]]],
];

console.log(padEnd("edges", 50) + padEnd("distances", 22) + "settle order");
for (const [n, edges] of CASES) {
  const neighbours = build(n, edges);
  const [best, order] = dijkstra(neighbours, 0);
  console.log(padEnd(showEdges(edges), 50) + padEnd(show(best), 22) + show(order));
}
console.log();

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 1n;
function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const TRIALS = 3000;
let dijkstraOk = 0;
let relaxOk = 0;
let orderOk = 0;
let settledAll = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges: Weighted[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v && rand(3) === 0) edges.push([u, v, 1 + rand(9)]);
    }
  }
  const neighbours = build(n, edges);
  const [best, order, nonDecreasing] = dijkstra(neighbours, 0);
  const slow = relaxUntilSettled(neighbours, 0);
  let goodDijkstra = true;
  let goodRelax = true;
  for (let target = 0; target < n; target += 1) {
    const truth = cheapestByWalking(n, edges, 0, target);
    if (best[target] !== truth) goodDijkstra = false;
    if (slow[target] !== truth) goodRelax = false;
  }
  if (goodDijkstra) dijkstraOk += 1;
  if (goodRelax) relaxOk += 1;
  if (nonDecreasing) orderOk += 1;
  if (order.length === n) settledAll += 1;
}

console.log(\`over \${TRIALS} random weighted graphs on up to 7 nodes:\`);
console.log(\`  Dijkstra matched every simple path   \${pad(dijkstraOk, 6)}\`);
console.log(\`  relaxing to a fixed point matched it \${pad(relaxOk, 6)}\`);
console.log(\`  distances settled in ascending order \${pad(orderOk, 6)}\`);
console.log(\`  every node was reachable             \${pad(settledAll, 6)}\`);
console.log();
console.log("The third line is what licenses the first. Dijkstra settles a");
console.log("node and never looks at it again, which is only allowed because the");
console.log("distances come off in ascending order -- so when a node is chosen, no");
console.log("route still under construction can arrive cheaper. Every edge adding a");
console.log("non-negative amount is what makes that true, and it is the only thing");
console.log("that does. The relaxation version below makes no such claim: it just");
console.log("keeps improving until nothing improves, which is slower and, as the next");
console.log("example shows, survives conditions Dijkstra does not.");
`,
            },
            {
              lang: "java",
              code: `// Dijkstra's algorithm, and the single assumption it is built on.
//
// The algorithm is greedy: take the unsettled node with the smallest known
// distance, declare that distance final, and relax its edges. The declaration
// is the whole thing, and it is only justified because every edge adds a
// non-negative amount -- so nothing reached later can come back cheaper.
//
// The example runs Dijkstra, runs the relaxation-until-nothing-changes version
// that makes no such claim, and scores both against every simple path. It also
// checks the invariant the greedy step depends on: that distances come off the
// frontier in non-decreasing order.

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {

    static final int INF = 1000000000;

    /** Directed, weighted. Each entry is (neighbour, cost). */
    static List<List<int[]>> build(int n, int[][] edges) {
        List<List<int[]>> neighbours = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            neighbours.add(new ArrayList<>());
        }
        for (int[] e : edges) {
            neighbours.get(e[0]).add(new int[] {e[1], e[2]});
        }
        return neighbours;
    }

    static int[] lastBest;
    static List<Integer> lastOrder;
    static boolean lastNonDecreasing;

    /** Settle the closest unsettled node, then relax its edges. No heap yet. */
    static void dijkstra(List<List<int[]>> neighbours, int start) {
        int n = neighbours.size();
        int[] best = new int[n];
        Arrays.fill(best, INF);
        boolean[] settled = new boolean[n];
        best[start] = 0;
        List<Integer> order = new ArrayList<>();
        boolean nonDecreasing = true;
        int previous = 0;
        for (int round = 0; round < n; round++) {
            int at = -1;
            for (int v = 0; v < n; v++) {
                if (!settled[v] && best[v] < INF && (at < 0 || best[v] < best[at])) {
                    at = v;
                }
            }
            if (at < 0) {
                break;
            }
            if (best[at] < previous) {
                nonDecreasing = false;
            }
            previous = best[at];
            settled[at] = true;
            order.add(at);
            for (int[] link : neighbours.get(at)) {
                if (best[at] + link[1] < best[link[0]]) {
                    best[link[0]] = best[at] + link[1];
                }
            }
        }
        lastBest = best;
        lastOrder = order;
        lastNonDecreasing = nonDecreasing;
    }

    /** Relax every edge until nothing improves. Claims nothing, needs no order. */
    static int[] relaxUntilSettled(List<List<int[]>> neighbours, int start) {
        int n = neighbours.size();
        int[] best = new int[n];
        Arrays.fill(best, INF);
        best[start] = 0;
        for (int round = 0; round < n; round++) {
            boolean changed = false;
            for (int v = 0; v < n; v++) {
                if (best[v] >= INF) {
                    continue;
                }
                for (int[] link : neighbours.get(v)) {
                    if (best[v] + link[1] < best[link[0]]) {
                        best[link[0]] = best[v] + link[1];
                        changed = true;
                    }
                }
            }
            if (!changed) {
                break;
            }
        }
        return best;
    }

    static int walkBest;
    static boolean[] walkOnPath;

    static void step(List<List<int[]>> neighbours, int target, int v, int spent) {
        if (spent >= walkBest) {
            return;
        }
        if (v == target) {
            walkBest = spent;
            return;
        }
        walkOnPath[v] = true;
        for (int[] link : neighbours.get(v)) {
            if (!walkOnPath[link[0]]) {
                step(neighbours, target, link[0], spent + link[1]);
            }
        }
        walkOnPath[v] = false;
    }

    /** Every simple path from start to target. The definition. */
    static int cheapestByWalking(int n, int[][] edges, int start, int target) {
        List<List<int[]>> neighbours = build(n, edges);
        walkBest = INF;
        walkOnPath = new boolean[n];
        step(neighbours, target, start, 0);
        return walkBest;
    }

    static String show(int[] values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.length; i++) {
            if (i > 0) {
                sb.append(", ");
            }
            sb.append(values[i] >= INF ? "-" : String.valueOf(values[i]));
        }
        return sb.append("]").toString();
    }

    static String show(List<Integer> values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) {
                sb.append(", ");
            }
            sb.append(values.get(i));
        }
        return sb.append("]").toString();
    }

    static String showEdges(int[][] edges) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < edges.length; i++) {
            if (i > 0) {
                sb.append(", ");
            }
            sb.append(edges[i][0]).append("->").append(edges[i][1]).append(":").append(edges[i][2]);
        }
        return sb.append("]").toString();
    }

    static String padEnd(String text, int width) {
        StringBuilder sb = new StringBuilder(text);
        while (sb.length() < width) {
            sb.append(' ');
        }
        return sb.toString();
    }

    static String pad(String text, int width) {
        StringBuilder sb = new StringBuilder();
        while (sb.length() + text.length() < width) {
            sb.append(' ');
        }
        return sb.append(text).toString();
    }

    // The same linear congruential generator in every language, so the random
    // graphs below are the same graphs whichever translation is run.
    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        int[] sizes = {4, 4, 5, 4};
        int[][][] cases = {
            {{0, 1, 1}, {1, 3, 1}, {0, 2, 5}, {2, 3, 1}},
            {{0, 1, 9}, {1, 3, 9}, {0, 2, 1}, {2, 3, 1}},
            {{0, 1, 2}, {1, 2, 2}, {0, 2, 5}, {2, 3, 1}, {3, 4, 3}, {1, 4, 9}},
            {{0, 1, 3}, {1, 2, 4}},
        };

        System.out.println(padEnd("edges", 50) + padEnd("distances", 22) + "settle order");
        for (int c = 0; c < sizes.length; c++) {
            List<List<int[]>> neighbours = build(sizes[c], cases[c]);
            dijkstra(neighbours, 0);
            System.out.println(padEnd(showEdges(cases[c]), 50) + padEnd(show(lastBest), 22)
                    + show(lastOrder));
        }
        System.out.println();

        int trials = 3000;
        int dijkstraOk = 0;
        int relaxOk = 0;
        int orderOk = 0;
        int settledAll = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(6);
            List<int[]> collected = new ArrayList<>();
            for (int u = 0; u < n; u++) {
                for (int v = 0; v < n; v++) {
                    if (u != v && rand(3) == 0) {
                        collected.add(new int[] {u, v, 1 + rand(9)});
                    }
                }
            }
            int[][] edges = collected.toArray(new int[0][]);
            List<List<int[]>> neighbours = build(n, edges);
            dijkstra(neighbours, 0);
            int[] best = lastBest;
            List<Integer> order = lastOrder;
            boolean nonDecreasing = lastNonDecreasing;
            int[] slow = relaxUntilSettled(neighbours, 0);
            boolean goodDijkstra = true;
            boolean goodRelax = true;
            for (int target = 0; target < n; target++) {
                int truth = cheapestByWalking(n, edges, 0, target);
                if (best[target] != truth) {
                    goodDijkstra = false;
                }
                if (slow[target] != truth) {
                    goodRelax = false;
                }
            }
            if (goodDijkstra) {
                dijkstraOk++;
            }
            if (goodRelax) {
                relaxOk++;
            }
            if (nonDecreasing) {
                orderOk++;
            }
            if (order.size() == n) {
                settledAll++;
            }
        }

        System.out.println("over " + trials + " random weighted graphs on up to 7 nodes:");
        System.out.println("  Dijkstra matched every simple path   " + pad(String.valueOf(dijkstraOk), 6));
        System.out.println("  relaxing to a fixed point matched it " + pad(String.valueOf(relaxOk), 6));
        System.out.println("  distances settled in ascending order " + pad(String.valueOf(orderOk), 6));
        System.out.println("  every node was reachable             " + pad(String.valueOf(settledAll), 6));
        System.out.println();
        System.out.println("The third line is what licenses the first. Dijkstra settles a");
        System.out.println("node and never looks at it again, which is only allowed because the");
        System.out.println("distances come off in ascending order -- so when a node is chosen, no");
        System.out.println("route still under construction can arrive cheaper. Every edge adding a");
        System.out.println("non-negative amount is what makes that true, and it is the only thing");
        System.out.println("that does. The relaxation version below makes no such claim: it just");
        System.out.println("keeps improving until nothing improves, which is slower and, as the next");
        System.out.println("example shows, survives conditions Dijkstra does not.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Dijkstra's algorithm, and the single assumption it is built on.
//
// The algorithm is greedy: take the unsettled node with the smallest known
// distance, declare that distance final, and relax its edges. The declaration
// is the whole thing, and it is only justified because every edge adds a
// non-negative amount -- so nothing reached later can come back cheaper.
//
// The example runs Dijkstra, runs the relaxation-until-nothing-changes version
// that makes no such claim, and scores both against every simple path. It also
// checks the invariant the greedy step depends on: that distances come off the
// frontier in non-decreasing order.

#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

const int INF = 1000000000;

struct Weighted {
    int from;
    int to;
    int cost;
};

using Link = std::pair<int, int>;

// Directed, weighted. Each entry is (neighbour, cost).
std::vector<std::vector<Link>> build(int n, const std::vector<Weighted>& edges) {
    std::vector<std::vector<Link>> neighbours(n);
    for (const Weighted& e : edges) {
        neighbours[e.from].push_back(Link(e.to, e.cost));
    }
    return neighbours;
}

// Settle the closest unsettled node, then relax its edges. No heap yet.
void dijkstra(const std::vector<std::vector<Link>>& neighbours, int start,
              std::vector<int>& best, std::vector<int>& order, bool& non_decreasing) {
    int n = static_cast<int>(neighbours.size());
    best.assign(n, INF);
    std::vector<char> settled(n, 0);
    best[start] = 0;
    order.clear();
    non_decreasing = true;
    int previous = 0;
    for (int round = 0; round < n; round++) {
        int at = -1;
        for (int v = 0; v < n; v++) {
            if (!settled[v] && best[v] < INF && (at < 0 || best[v] < best[at])) {
                at = v;
            }
        }
        if (at < 0) {
            break;
        }
        if (best[at] < previous) {
            non_decreasing = false;
        }
        previous = best[at];
        settled[at] = 1;
        order.push_back(at);
        for (const Link& l : neighbours[at]) {
            if (best[at] + l.second < best[l.first]) {
                best[l.first] = best[at] + l.second;
            }
        }
    }
}

// Relax every edge until nothing improves. Claims nothing, needs no order.
std::vector<int> relax_until_settled(const std::vector<std::vector<Link>>& neighbours, int start) {
    int n = static_cast<int>(neighbours.size());
    std::vector<int> best(n, INF);
    best[start] = 0;
    for (int round = 0; round < n; round++) {
        bool changed = false;
        for (int v = 0; v < n; v++) {
            if (best[v] >= INF) {
                continue;
            }
            for (const Link& l : neighbours[v]) {
                if (best[v] + l.second < best[l.first]) {
                    best[l.first] = best[v] + l.second;
                    changed = true;
                }
            }
        }
        if (!changed) {
            break;
        }
    }
    return best;
}

void step(const std::vector<std::vector<Link>>& neighbours, std::vector<char>& on_path,
          int& best, int target, int v, int spent) {
    if (spent >= best) {
        return;
    }
    if (v == target) {
        best = spent;
        return;
    }
    on_path[v] = 1;
    for (const Link& l : neighbours[v]) {
        if (!on_path[l.first]) {
            step(neighbours, on_path, best, target, l.first, spent + l.second);
        }
    }
    on_path[v] = 0;
}

// Every simple path from start to target. The definition.
int cheapest_by_walking(int n, const std::vector<Weighted>& edges, int start, int target) {
    std::vector<std::vector<Link>> neighbours = build(n, edges);
    int best = INF;
    std::vector<char> on_path(n, 0);
    step(neighbours, on_path, best, target, start, 0);
    return best;
}

std::string show(const std::vector<int>& values) {
    std::string out = "[";
    for (size_t i = 0; i < values.size(); i++) {
        if (i > 0) {
            out += ", ";
        }
        out += (values[i] >= INF) ? std::string("-") : std::to_string(values[i]);
    }
    return out + "]";
}

std::string show_edges(const std::vector<Weighted>& edges) {
    std::string out = "[";
    for (size_t i = 0; i < edges.size(); i++) {
        if (i > 0) {
            out += ", ";
        }
        out += std::to_string(edges[i].from) + "->" + std::to_string(edges[i].to)
                + ":" + std::to_string(edges[i].cost);
    }
    return out + "]";
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
long long seed = 1;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    std::vector<int> sizes = {4, 4, 5, 4};
    std::vector<std::vector<Weighted>> cases = {
        {{0, 1, 1}, {1, 3, 1}, {0, 2, 5}, {2, 3, 1}},
        {{0, 1, 9}, {1, 3, 9}, {0, 2, 1}, {2, 3, 1}},
        {{0, 1, 2}, {1, 2, 2}, {0, 2, 5}, {2, 3, 1}, {3, 4, 3}, {1, 4, 9}},
        {{0, 1, 3}, {1, 2, 4}},
    };

    std::cout << std::left << std::setw(50) << "edges" << std::setw(22) << "distances"
              << "settle order" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        std::vector<std::vector<Link>> neighbours = build(sizes[c], cases[c]);
        std::vector<int> best;
        std::vector<int> order;
        bool non_decreasing = true;
        dijkstra(neighbours, 0, best, order, non_decreasing);
        std::cout << std::left << std::setw(50) << show_edges(cases[c])
                  << std::setw(22) << show(best) << show(order) << "\\n";
    }
    std::cout << "\\n";

    int trials = 3000;
    int dijkstra_ok = 0;
    int relax_ok = 0;
    int order_ok = 0;
    int settled_all = 0;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(6);
        std::vector<Weighted> edges;
        for (int u = 0; u < n; u++) {
            for (int v = 0; v < n; v++) {
                if (u != v && rand_below(3) == 0) {
                    Weighted e;
                    e.from = u;
                    e.to = v;
                    e.cost = 1 + rand_below(9);
                    edges.push_back(e);
                }
            }
        }
        std::vector<std::vector<Link>> neighbours = build(n, edges);
        std::vector<int> best;
        std::vector<int> order;
        bool non_decreasing = true;
        dijkstra(neighbours, 0, best, order, non_decreasing);
        std::vector<int> slow = relax_until_settled(neighbours, 0);
        bool good_dijkstra = true;
        bool good_relax = true;
        for (int target = 0; target < n; target++) {
            int truth = cheapest_by_walking(n, edges, 0, target);
            if (best[target] != truth) {
                good_dijkstra = false;
            }
            if (slow[target] != truth) {
                good_relax = false;
            }
        }
        if (good_dijkstra) {
            dijkstra_ok++;
        }
        if (good_relax) {
            relax_ok++;
        }
        if (non_decreasing) {
            order_ok++;
        }
        if (static_cast<int>(order.size()) == n) {
            settled_all++;
        }
    }

    std::cout << "over " << trials << " random weighted graphs on up to 7 nodes:\\n";
    std::cout << "  Dijkstra matched every simple path   " << std::right << std::setw(6) << dijkstra_ok << "\\n";
    std::cout << "  relaxing to a fixed point matched it " << std::setw(6) << relax_ok << "\\n";
    std::cout << "  distances settled in ascending order " << std::setw(6) << order_ok << "\\n";
    std::cout << "  every node was reachable             " << std::setw(6) << settled_all << "\\n";
    std::cout << "\\n";
    std::cout << "The third line is what licenses the first. Dijkstra settles a\\n";
    std::cout << "node and never looks at it again, which is only allowed because the\\n";
    std::cout << "distances come off in ascending order -- so when a node is chosen, no\\n";
    std::cout << "route still under construction can arrive cheaper. Every edge adding a\\n";
    std::cout << "non-negative amount is what makes that true, and it is the only thing\\n";
    std::cout << "that does. The relaxation version below makes no such claim: it just\\n";
    std::cout << "keeps improving until nothing improves, which is slower and, as the next\\n";
    std::cout << "example shows, survives conditions Dijkstra does not.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Dijkstra's algorithm, and the single assumption it is built on.
//
// The algorithm is greedy: take the unsettled node with the smallest known
// distance, declare that distance final, and relax its edges. The declaration
// is the whole thing, and it is only justified because every edge adds a
// non-negative amount -- so nothing reached later can come back cheaper.
//
// The example runs Dijkstra, runs the relaxation-until-nothing-changes version
// that makes no such claim, and scores both against every simple path. It also
// checks the invariant the greedy step depends on: that distances come off the
// frontier in non-decreasing order.

const INF: i64 = 1_000_000_000;

/// Directed, weighted. Each entry is (neighbour, cost).
fn build(n: usize, edges: &[(usize, usize, i64)]) -> Vec<Vec<(usize, i64)>> {
    let mut neighbours = vec![Vec::new(); n];
    for &(u, v, w) in edges {
        neighbours[u].push((v, w));
    }
    neighbours
}

/// Settle the closest unsettled node, then relax its edges. No heap yet.
fn dijkstra(neighbours: &[Vec<(usize, i64)>], start: usize) -> (Vec<i64>, Vec<usize>, bool) {
    let n = neighbours.len();
    let mut best = vec![INF; n];
    let mut settled = vec![false; n];
    best[start] = 0;
    let mut order: Vec<usize> = Vec::new();
    let mut non_decreasing = true;
    let mut previous = 0;
    for _ in 0..n {
        let mut at: i32 = -1;
        for v in 0..n {
            if !settled[v] && best[v] < INF && (at < 0 || best[v] < best[at as usize]) {
                at = v as i32;
            }
        }
        if at < 0 {
            break;
        }
        let at = at as usize;
        if best[at] < previous {
            non_decreasing = false;
        }
        previous = best[at];
        settled[at] = true;
        order.push(at);
        for i in 0..neighbours[at].len() {
            let (u, w) = neighbours[at][i];
            if best[at] + w < best[u] {
                best[u] = best[at] + w;
            }
        }
    }
    (best, order, non_decreasing)
}

/// Relax every edge until nothing improves. Claims nothing, needs no order.
fn relax_until_settled(neighbours: &[Vec<(usize, i64)>], start: usize) -> Vec<i64> {
    let n = neighbours.len();
    let mut best = vec![INF; n];
    best[start] = 0;
    for _ in 0..n {
        let mut changed = false;
        for v in 0..n {
            if best[v] >= INF {
                continue;
            }
            for i in 0..neighbours[v].len() {
                let (u, w) = neighbours[v][i];
                if best[v] + w < best[u] {
                    best[u] = best[v] + w;
                    changed = true;
                }
            }
        }
        if !changed {
            break;
        }
    }
    best
}

fn step(
    neighbours: &[Vec<(usize, i64)>],
    on_path: &mut Vec<bool>,
    best: &mut i64,
    target: usize,
    v: usize,
    spent: i64,
) {
    if spent >= *best {
        return;
    }
    if v == target {
        *best = spent;
        return;
    }
    on_path[v] = true;
    for i in 0..neighbours[v].len() {
        let (u, w) = neighbours[v][i];
        if !on_path[u] {
            step(neighbours, on_path, best, target, u, spent + w);
        }
    }
    on_path[v] = false;
}

/// Every simple path from start to target. The definition.
fn cheapest_by_walking(n: usize, edges: &[(usize, usize, i64)], start: usize, target: usize) -> i64 {
    let neighbours = build(n, edges);
    let mut best = INF;
    let mut on_path = vec![false; n];
    step(&neighbours, &mut on_path, &mut best, target, start, 0);
    best
}

fn show(values: &[i64]) -> String {
    let parts: Vec<String> = values
        .iter()
        .map(|&v| if v >= INF { String::from("-") } else { v.to_string() })
        .collect();
    format!("[{}]", parts.join(", "))
}

fn show_usize(values: &[usize]) -> String {
    let parts: Vec<String> = values.iter().map(|v| v.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn show_edges(edges: &[(usize, usize, i64)]) -> String {
    let parts: Vec<String> = edges
        .iter()
        .map(|&(u, v, w)| format!("{}->{}:{}", u, v, w))
        .collect();
    format!("[{}]", parts.join(", "))
}

fn pad_right(text: &str, width: usize) -> String {
    let mut out = String::from(text);
    while out.chars().count() < width {
        out.push(' ');
    }
    out
}

fn pad_left(text: &str, width: usize) -> String {
    let mut out = String::new();
    while out.chars().count() + text.chars().count() < width {
        out.push(' ');
    }
    out.push_str(text);
    out
}

struct Rng {
    seed: i64,
}

impl Rng {
    // The same linear congruential generator in every language, so the random
    // graphs below are the same graphs whichever translation is run.
    fn next(&mut self, n: i64) -> i64 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        self.seed / 65536 % n
    }
}

fn main() {
    let sizes: Vec<usize> = vec![4, 4, 5, 4];
    let cases: Vec<Vec<(usize, usize, i64)>> = vec![
        vec![(0, 1, 1), (1, 3, 1), (0, 2, 5), (2, 3, 1)],
        vec![(0, 1, 9), (1, 3, 9), (0, 2, 1), (2, 3, 1)],
        vec![(0, 1, 2), (1, 2, 2), (0, 2, 5), (2, 3, 1), (3, 4, 3), (1, 4, 9)],
        vec![(0, 1, 3), (1, 2, 4)],
    ];

    println!(
        "{}{}{}",
        pad_right("edges", 50),
        pad_right("distances", 22),
        "settle order"
    );
    for (c, edges) in cases.iter().enumerate() {
        let neighbours = build(sizes[c], edges);
        let (best, order, _) = dijkstra(&neighbours, 0);
        println!(
            "{}{}{}",
            pad_right(&show_edges(edges), 50),
            pad_right(&show(&best), 22),
            show_usize(&order)
        );
    }
    println!();

    let mut rng = Rng { seed: 1 };
    let trials = 3000;
    let mut dijkstra_ok = 0;
    let mut relax_ok = 0;
    let mut order_ok = 0;
    let mut settled_all = 0;
    for _ in 0..trials {
        let n = (2 + rng.next(6)) as usize;
        let mut edges: Vec<(usize, usize, i64)> = Vec::new();
        for u in 0..n {
            for v in 0..n {
                if u != v && rng.next(3) == 0 {
                    let w = 1 + rng.next(9);
                    edges.push((u, v, w));
                }
            }
        }
        let neighbours = build(n, &edges);
        let (best, order, non_decreasing) = dijkstra(&neighbours, 0);
        let slow = relax_until_settled(&neighbours, 0);
        let mut good_dijkstra = true;
        let mut good_relax = true;
        for target in 0..n {
            let truth = cheapest_by_walking(n, &edges, 0, target);
            if best[target] != truth {
                good_dijkstra = false;
            }
            if slow[target] != truth {
                good_relax = false;
            }
        }
        if good_dijkstra {
            dijkstra_ok += 1;
        }
        if good_relax {
            relax_ok += 1;
        }
        if non_decreasing {
            order_ok += 1;
        }
        if order.len() == n {
            settled_all += 1;
        }
    }

    println!("over {} random weighted graphs on up to 7 nodes:", trials);
    println!("  Dijkstra matched every simple path   {}", pad_left(&dijkstra_ok.to_string(), 6));
    println!("  relaxing to a fixed point matched it {}", pad_left(&relax_ok.to_string(), 6));
    println!("  distances settled in ascending order {}", pad_left(&order_ok.to_string(), 6));
    println!("  every node was reachable             {}", pad_left(&settled_all.to_string(), 6));
    println!();
    println!("The third line is what licenses the first. Dijkstra settles a");
    println!("node and never looks at it again, which is only allowed because the");
    println!("distances come off in ascending order -- so when a node is chosen, no");
    println!("route still under construction can arrive cheaper. Every edge adding a");
    println!("non-negative amount is what makes that true, and it is the only thing");
    println!("that does. The relaxation version below makes no such claim: it just");
    println!("keeps improving until nothing improves, which is slower and, as the next");
    println!("example shows, survives conditions Dijkstra does not.");
}
`,
            },
            {
              lang: "go",
              code: `// Dijkstra's algorithm, and the single assumption it is built on.
//
// The algorithm is greedy: take the unsettled node with the smallest known
// distance, declare that distance final, and relax its edges. The declaration
// is the whole thing, and it is only justified because every edge adds a
// non-negative amount -- so nothing reached later can come back cheaper.
//
// The example runs Dijkstra, runs the relaxation-until-nothing-changes version
// that makes no such claim, and scores both against every simple path. It also
// checks the invariant the greedy step depends on: that distances come off the
// frontier in non-decreasing order.

package main

import (
	"fmt"
	"strings"
)

const inf = 1000000000

type weighted struct{ from, to, cost int }
type link struct{ to, cost int }

// Directed, weighted. Each entry is (neighbour, cost).
func build(n int, edges []weighted) [][]link {
	neighbours := make([][]link, n)
	for i := range neighbours {
		neighbours[i] = []link{}
	}
	for _, e := range edges {
		neighbours[e.from] = append(neighbours[e.from], link{e.to, e.cost})
	}
	return neighbours
}

// Settle the closest unsettled node, then relax its edges. No heap yet.
func dijkstra(neighbours [][]link, start int) ([]int, []int, bool) {
	n := len(neighbours)
	best := make([]int, n)
	for i := range best {
		best[i] = inf
	}
	settled := make([]bool, n)
	best[start] = 0
	order := []int{}
	nonDecreasing := true
	previous := 0
	for round := 0; round < n; round++ {
		at := -1
		for v := 0; v < n; v++ {
			if !settled[v] && best[v] < inf && (at < 0 || best[v] < best[at]) {
				at = v
			}
		}
		if at < 0 {
			break
		}
		if best[at] < previous {
			nonDecreasing = false
		}
		previous = best[at]
		settled[at] = true
		order = append(order, at)
		for _, l := range neighbours[at] {
			if best[at]+l.cost < best[l.to] {
				best[l.to] = best[at] + l.cost
			}
		}
	}
	return best, order, nonDecreasing
}

// Relax every edge until nothing improves. Claims nothing, needs no order.
func relaxUntilSettled(neighbours [][]link, start int) []int {
	n := len(neighbours)
	best := make([]int, n)
	for i := range best {
		best[i] = inf
	}
	best[start] = 0
	for round := 0; round < n; round++ {
		changed := false
		for v := 0; v < n; v++ {
			if best[v] >= inf {
				continue
			}
			for _, l := range neighbours[v] {
				if best[v]+l.cost < best[l.to] {
					best[l.to] = best[v] + l.cost
					changed = true
				}
			}
		}
		if !changed {
			break
		}
	}
	return best
}

// Every simple path from start to target. The definition.
func cheapestByWalking(n int, edges []weighted, start, target int) int {
	neighbours := build(n, edges)
	best := inf
	onPath := make([]bool, n)
	var step func(v, spent int)
	step = func(v, spent int) {
		if spent >= best {
			return
		}
		if v == target {
			best = spent
			return
		}
		onPath[v] = true
		for _, l := range neighbours[v] {
			if !onPath[l.to] {
				step(l.to, spent+l.cost)
			}
		}
		onPath[v] = false
	}
	step(start, 0)
	return best
}

func show(values []int) string {
	parts := make([]string, len(values))
	for i, v := range values {
		if v >= inf {
			parts[i] = "-"
		} else {
			parts[i] = fmt.Sprintf("%d", v)
		}
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func showEdges(edges []weighted) string {
	parts := make([]string, len(edges))
	for i, e := range edges {
		parts[i] = fmt.Sprintf("%d->%d:%d", e.from, e.to, e.cost)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	sizes := []int{4, 4, 5, 4}
	cases := [][]weighted{
		{{0, 1, 1}, {1, 3, 1}, {0, 2, 5}, {2, 3, 1}},
		{{0, 1, 9}, {1, 3, 9}, {0, 2, 1}, {2, 3, 1}},
		{{0, 1, 2}, {1, 2, 2}, {0, 2, 5}, {2, 3, 1}, {3, 4, 3}, {1, 4, 9}},
		{{0, 1, 3}, {1, 2, 4}},
	}

	fmt.Printf("%-50s%-22s%s\\n", "edges", "distances", "settle order")
	for c, edges := range cases {
		neighbours := build(sizes[c], edges)
		best, order, _ := dijkstra(neighbours, 0)
		fmt.Printf("%-50s%-22s%s\\n", showEdges(edges), show(best), show(order))
	}
	fmt.Println()

	trials := 3000
	dijkstraOk := 0
	relaxOk := 0
	orderOk := 0
	settledAll := 0
	for t := 0; t < trials; t++ {
		n := 2 + rand(6)
		edges := []weighted{}
		for u := 0; u < n; u++ {
			for v := 0; v < n; v++ {
				if u != v && rand(3) == 0 {
					edges = append(edges, weighted{u, v, 1 + rand(9)})
				}
			}
		}
		neighbours := build(n, edges)
		best, order, nonDecreasing := dijkstra(neighbours, 0)
		slow := relaxUntilSettled(neighbours, 0)
		goodDijkstra := true
		goodRelax := true
		for target := 0; target < n; target++ {
			truth := cheapestByWalking(n, edges, 0, target)
			if best[target] != truth {
				goodDijkstra = false
			}
			if slow[target] != truth {
				goodRelax = false
			}
		}
		if goodDijkstra {
			dijkstraOk++
		}
		if goodRelax {
			relaxOk++
		}
		if nonDecreasing {
			orderOk++
		}
		if len(order) == n {
			settledAll++
		}
	}

	fmt.Printf("over %d random weighted graphs on up to 7 nodes:\\n", trials)
	fmt.Printf("  Dijkstra matched every simple path   %6d\\n", dijkstraOk)
	fmt.Printf("  relaxing to a fixed point matched it %6d\\n", relaxOk)
	fmt.Printf("  distances settled in ascending order %6d\\n", orderOk)
	fmt.Printf("  every node was reachable             %6d\\n", settledAll)
	fmt.Println()
	fmt.Println("The third line is what licenses the first. Dijkstra settles a")
	fmt.Println("node and never looks at it again, which is only allowed because the")
	fmt.Println("distances come off in ascending order -- so when a node is chosen, no")
	fmt.Println("route still under construction can arrive cheaper. Every edge adding a")
	fmt.Println("non-negative amount is what makes that true, and it is the only thing")
	fmt.Println("that does. The relaxation version below makes no such claim: it just")
	fmt.Println("keeps improving until nothing improves, which is slower and, as the next")
	fmt.Println("example shows, survives conditions Dijkstra does not.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Believing the settle step is justified by the queue rather than the weights",
          body: "Dijkstra settles in ascending order of distance, which is what makes a settled distance final -- and that ordering only holds because every edge adds a non-negative amount. It is an assumption about the input, not a property of the data structure. Swapping the heap for a scan changes nothing about correctness; making one weight negative changes everything.",
        },
        {
          title: "Reaching for Dijkstra when the edges are all equal",
          body: "If every edge costs the same, breadth-first search already gives the answer in O(V + E) with no heap at all. Dijkstra on unit weights is the same answer through more machinery. The 0-1 case has its own trick, which is a later lesson in this module.",
        },
      ],
    },
    {
      id: "when-the-assumption-fails",
      heading: "When the assumption fails",
      body: [
        "So what happens when the assumption fails. Not much, visibly, which is the problem.",
        "A negative edge means a route that currently looks longer can still get cheaper later, so settling is premature. Dijkstra does not crash, does not loop, and returns a number. The number is too large \u2014 never too small, because every value it reports is the cost of a route that really exists.",
        "The smallest example is three nodes: `0->1` costs 1, `0->2` costs 2, and `2->1` costs -2. Node 1 is settled at 1 because that is the cheapest thing on the frontier, and the edge out of node 2 is not relaxed until afterwards. The true distance to node 1 is 0.",
        "Measured over 3,000 random graphs with weights from -3 to 5 (skipping the 706 that had a negative cycle, where \"shortest\" has no answer at all): 1,321 of the survivors had at least one negative edge, and Dijkstra was right on 1,285 of them. Wrong on 36, always high, never low. That is a failure rate a test suite will not notice.",
        "Two repairs get tried, and the example runs both. **Re-open a settled node whenever it improves.** That is correct \u2014 2,294 out of 2,294 \u2014 and it costs more edge relaxations, and it is no longer Dijkstra: with no settled set there is no greedy step left, which is the next lesson's algorithm. **Add a constant to every edge so nothing is negative.** That one is wrong: the lift is charged once per edge, so it penalises routes with more hops and the algorithm picks a different route. Even subtracting the lift back off afterwards, it was right on only 2,155 of 2,294.",
      ],
      examples: [
        {
          id: "negative-edges",
          title: "Three nodes, one negative edge, and two repairs that are not repairs",
          lang: "python",
          code: `# What a negative edge does to Dijkstra, and why the obvious repairs do not
# work.
#
# The greedy step says: the closest unsettled node is finished. A negative edge
# breaks that in one sentence -- a route that currently looks longer can still
# get cheaper later, so settling is premature. The algorithm does not crash or
# loop; it returns a number that is too large.
#
# Two repairs are measured here. Re-opening a settled node whenever it improves
# is correct and is no longer Dijkstra -- it is Bellman-Ford with a queue, and
# the example counts the extra work. Adding a constant to every edge to make
# them all non-negative is the repair people reach for first, and it changes
# the answer, because it charges per edge rather than per route.
INF = 10 ** 9


def build(n, edges):
    neighbours = [[] for _ in range(n)]
    for u, v, w in edges:
        neighbours[u].append((v, w))
    return neighbours


def dijkstra(neighbours, start):
    """Settle and freeze. The frozen value is what the algorithm reports."""
    n = len(neighbours)
    best = [INF] * n
    final = [INF] * n
    hops = [0] * n
    settled = [False] * n
    best[start] = 0
    relaxations = 0
    for _ in range(n):
        at = -1
        for v in range(n):
            if not settled[v] and best[v] < INF and (at < 0 or best[v] < best[at]):
                at = v
        if at < 0:
            break
        settled[at] = True
        final[at] = best[at]
        for u, w in neighbours[at]:
            relaxations += 1
            if best[at] + w < best[u]:
                best[u] = best[at] + w
                hops[u] = hops[at] + 1
    return final, hops, relaxations


def reopening(neighbours, start):
    """Put a node back on the queue whenever it improves. Correct, and not Dijkstra."""
    n = len(neighbours)
    best = [INF] * n
    best[start] = 0
    queue = [start]
    head = 0
    relaxations = 0
    while head < len(queue):
        v = queue[head]
        head += 1
        for u, w in neighbours[v]:
            relaxations += 1
            if best[v] + w < best[u]:
                best[u] = best[v] + w
                queue.append(u)
    return best, relaxations


def lifted(neighbours, start, lift):
    """Add lift to every edge, run Dijkstra, then take lift * hops back off."""
    n = len(neighbours)
    raised = [[] for _ in range(n)]
    for v in range(n):
        for u, w in neighbours[v]:
            raised[v].append((u, w + lift))
    final, hops, _ = dijkstra(raised, start)
    out = []
    for v in range(n):
        out.append(INF if final[v] >= INF else final[v] - lift * hops[v])
    return out


def has_negative_cycle(n, edges):
    """One extra Bellman-Ford round: if anything still improves, a loop pays."""
    best = [0] * n
    for _ in range(n - 1):
        for u, v, w in edges:
            if best[u] + w < best[v]:
                best[v] = best[u] + w
    for u, v, w in edges:
        if best[u] + w < best[v]:
            return True
    return False


def cheapest_by_walking(n, edges, start, target):
    """Every simple path. The definition, and it does not care about signs."""
    neighbours = build(n, edges)
    best = [INF]
    on_path = [False] * n

    def step(v, spent):
        if v == target and spent < best[0]:
            best[0] = spent
        on_path[v] = True
        for u, w in neighbours[v]:
            if not on_path[u]:
                step(u, spent + w)
        on_path[v] = False

    step(start, 0)
    return best[0]


def show(values):
    out = []
    for v in values:
        out.append("-" if v >= INF else str(v))
    return "[" + ", ".join(out) + "]"


def show_edges(edges):
    return "[" + ", ".join(f"{u}->{v}:{w}" for u, v, w in edges) + "]"


CASES = [
    (3, [(0, 1, 1), (0, 2, 2), (2, 1, -2)]),
    (4, [(0, 1, 1), (0, 2, 2), (2, 1, -2), (1, 3, 1)]),
    (3, [(0, 1, 2), (0, 2, 3), (1, 2, -2)]),
    (3, [(0, 1, 1), (1, 2, 1)]),
]

print(f"{'edges':<40}{'truth':<16}{'Dijkstra':<16}{'reopening':<16}{'lifted by 2'}")
for n, edges in CASES:
    neighbours = build(n, edges)
    truth = [cheapest_by_walking(n, edges, 0, t) for t in range(n)]
    greedy, _, _ = dijkstra(neighbours, 0)
    again, _ = reopening(neighbours, 0)
    raised = lifted(neighbours, 0, 2)
    print(f"{show_edges(edges):<40}{show(truth):<16}{show(greedy):<16}"
          f"{show(again):<16}{show(raised)}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
skipped = 0
positive_ok = 0
negative_ok = 0
negative_high = 0
negative_low = 0
reopen_ok = 0
lifted_ok = 0
had_negative = 0
greedy_work = 0
reopen_work = 0
for _ in range(TRIALS):
    n = 2 + rand(5)
    edges = []
    negative = False
    for u in range(n):
        for v in range(n):
            if u != v and rand(3) == 0:
                w = rand(9) - 3
                if w < 0:
                    negative = True
                edges.append((u, v, w))
    if has_negative_cycle(n, edges):
        skipped += 1
        continue
    neighbours = build(n, edges)
    truth = [cheapest_by_walking(n, edges, 0, t) for t in range(n)]
    greedy, _, greedy_steps = dijkstra(neighbours, 0)
    again, reopen_steps = reopening(neighbours, 0)
    raised = lifted(neighbours, 0, 3)
    greedy_work += greedy_steps
    reopen_work += reopen_steps
    good_greedy = True
    high = False
    low = False
    for t in range(n):
        if greedy[t] != truth[t]:
            good_greedy = False
            if greedy[t] > truth[t]:
                high = True
            if greedy[t] < truth[t]:
                low = True
    good_reopen = True
    good_lifted = True
    for t in range(n):
        if again[t] != truth[t]:
            good_reopen = False
        if raised[t] != truth[t]:
            good_lifted = False
    if negative:
        had_negative += 1
        if good_greedy:
            negative_ok += 1
        if high:
            negative_high += 1
        if low:
            negative_low += 1
    elif good_greedy:
        positive_ok += 1
    if good_reopen:
        reopen_ok += 1
    if good_lifted:
        lifted_ok += 1

kept = TRIALS - skipped
print(f"over {TRIALS} random graphs with weights from -3 to 5:")
print(f"  had a negative cycle, skipped        {skipped:>6}")
print(f"  of the {kept} kept, had a negative edge {had_negative:>4}")
print(f"  Dijkstra right on the rest           {positive_ok:>6}")
print(f"  Dijkstra right with a negative edge  {negative_ok:>6}")
print(f"  it reported a distance that was high {negative_high:>6}")
print(f"  it reported a distance that was low  {negative_low:>6}")
print(f"  re-opening was right                 {reopen_ok:>6}")
print(f"  lifting every edge by 3 was right    {lifted_ok:>6}")
print(f"  edges relaxed, greedy against reopen {greedy_work:>6}{reopen_work:>8}")
print()
print("Dijkstra does not fail loudly on a negative edge. It freezes a distance")
print("that is not final and reports a number that is too large -- never too")
print("small, because every value it reports is the cost of some real route.")
print("Row one is the smallest example there is: node 1 is settled at 1 because")
print("that is the cheapest thing on the frontier, and the -2 edge out of node 2")
print("is not relaxed until afterwards.")
print()
print("Re-opening a settled node when it improves is correct on every graph")
print("here, and costs more edge relaxations. It is also no longer Dijkstra:")
print("with no settled set there is no greedy step left, and what remains is")
print("Bellman-Ford with a work queue, which is the next lesson.")
print()
print("Lifting every edge to make it non-negative is the repair that looks")
print("obvious and is not. The lift is charged once per edge, so it penalises")
print("routes with more hops, and Dijkstra on the lifted graph picks a")
print("different route. Subtracting the lift back off afterwards cannot undo")
print("that -- the wrong route has already been chosen.")
`,
          output: `edges                                   truth           Dijkstra        reopening       lifted by 2
[0->1:1, 0->2:2, 2->1:-2]               [0, 0, 2]       [0, 1, 2]       [0, 0, 2]       [0, 1, 2]
[0->1:1, 0->2:2, 2->1:-2, 1->3:1]       [0, 0, 2, 1]    [0, 1, 2, 2]    [0, 0, 2, 1]    [0, 1, 2, 2]
[0->1:2, 0->2:3, 1->2:-2]               [0, 2, 0]       [0, 2, 0]       [0, 2, 0]       [0, 2, 0]
[0->1:1, 1->2:1]                        [0, 1, 2]       [0, 1, 2]       [0, 1, 2]       [0, 1, 2]

over 3000 random graphs with weights from -3 to 5:
  had a negative cycle, skipped           706
  of the 2294 kept, had a negative edge 1321
  Dijkstra right on the rest              973
  Dijkstra right with a negative edge    1285
  it reported a distance that was high     36
  it reported a distance that was low       0
  re-opening was right                   2294
  lifting every edge by 3 was right      2155
  edges relaxed, greedy against reopen   5015    5339

Dijkstra does not fail loudly on a negative edge. It freezes a distance
that is not final and reports a number that is too large -- never too
small, because every value it reports is the cost of some real route.
Row one is the smallest example there is: node 1 is settled at 1 because
that is the cheapest thing on the frontier, and the -2 edge out of node 2
is not relaxed until afterwards.

Re-opening a settled node when it improves is correct on every graph
here, and costs more edge relaxations. It is also no longer Dijkstra:
with no settled set there is no greedy step left, and what remains is
Bellman-Ford with a work queue, which is the next lesson.

Lifting every edge to make it non-negative is the repair that looks
obvious and is not. The lift is charged once per edge, so it penalises
routes with more hops, and Dijkstra on the lifted graph picks a
different route. Subtracting the lift back off afterwards cannot undo
that -- the wrong route has already been chosen.`,
          explanation:
            "The same algorithm with negative edges in the graph, and the two repairs people reach for. Re-opening settled nodes is correct and is no longer Dijkstra; lifting the weights is neither.",
          alternates: [
            {
              lang: "javascript",
              code: `// What a negative edge does to Dijkstra, and why the obvious repairs do not
// work.
//
// The greedy step says: the closest unsettled node is finished. A negative edge
// breaks that in one sentence -- a route that currently looks longer can still
// get cheaper later, so settling is premature. The algorithm does not crash or
// loop; it returns a number that is too large.
//
// Two repairs are measured here. Re-opening a settled node whenever it improves
// is correct and is no longer Dijkstra -- it is Bellman-Ford with a queue, and
// the example counts the extra work. Adding a constant to every edge to make
// them all non-negative is the repair people reach for first, and it changes
// the answer, because it charges per edge rather than per route.

const INF = 1000000000;

function build(n, edges) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) neighbours[u].push([v, w]);
  return neighbours;
}

/** Settle and freeze. The frozen value is what the algorithm reports. */
function dijkstra(neighbours, start) {
  const n = neighbours.length;
  const best = new Array(n).fill(INF);
  const frozen = new Array(n).fill(INF);
  const hops = new Array(n).fill(0);
  const settled = new Array(n).fill(false);
  best[start] = 0;
  let relaxations = 0;
  for (let round = 0; round < n; round += 1) {
    let at = -1;
    for (let v = 0; v < n; v += 1) {
      if (!settled[v] && best[v] < INF && (at < 0 || best[v] < best[at])) at = v;
    }
    if (at < 0) break;
    settled[at] = true;
    frozen[at] = best[at];
    for (const [u, w] of neighbours[at]) {
      relaxations += 1;
      if (best[at] + w < best[u]) {
        best[u] = best[at] + w;
        hops[u] = hops[at] + 1;
      }
    }
  }
  return [frozen, hops, relaxations];
}

/** Put a node back on the queue whenever it improves. Correct, and not Dijkstra. */
function reopening(neighbours, start) {
  const n = neighbours.length;
  const best = new Array(n).fill(INF);
  best[start] = 0;
  const queue = [start];
  let head = 0;
  let relaxations = 0;
  while (head < queue.length) {
    const v = queue[head];
    head += 1;
    for (const [u, w] of neighbours[v]) {
      relaxations += 1;
      if (best[v] + w < best[u]) {
        best[u] = best[v] + w;
        queue.push(u);
      }
    }
  }
  return [best, relaxations];
}

/** Add lift to every edge, run Dijkstra, then take lift * hops back off. */
function lifted(neighbours, start, lift) {
  const n = neighbours.length;
  const raised = Array.from({ length: n }, () => []);
  for (let v = 0; v < n; v += 1) {
    for (const [u, w] of neighbours[v]) raised[v].push([u, w + lift]);
  }
  const [frozen, hops] = dijkstra(raised, start);
  const out = [];
  for (let v = 0; v < n; v += 1) {
    out.push(frozen[v] >= INF ? INF : frozen[v] - lift * hops[v]);
  }
  return out;
}

/** One extra Bellman-Ford round: if anything still improves, a loop pays. */
function hasNegativeCycle(n, edges) {
  const best = new Array(n).fill(0);
  for (let round = 0; round < n - 1; round += 1) {
    for (const [u, v, w] of edges) {
      if (best[u] + w < best[v]) best[v] = best[u] + w;
    }
  }
  for (const [u, v, w] of edges) {
    if (best[u] + w < best[v]) return true;
  }
  return false;
}

/** Every simple path. The definition, and it does not care about signs. */
function cheapestByWalking(n, edges, start, target) {
  const neighbours = build(n, edges);
  let best = INF;
  const onPath = new Array(n).fill(false);

  function step(v, spent) {
    if (v === target && spent < best) best = spent;
    onPath[v] = true;
    for (const [u, w] of neighbours[v]) {
      if (!onPath[u]) step(u, spent + w);
    }
    onPath[v] = false;
  }

  step(start, 0);
  return best;
}

const show = (values) =>
  "[" + values.map((v) => (v >= INF ? "-" : String(v))).join(", ") + "]";
const showEdges = (edges) =>
  "[" + edges.map(([u, v, w]) => \`\${u}->\${v}:\${w}\`).join(", ") + "]";
const padEnd = (v, w) => String(v).padEnd(w);
const pad = (v, w) => String(v).padStart(w);

const CASES = [
  [3, [[0, 1, 1], [0, 2, 2], [2, 1, -2]]],
  [4, [[0, 1, 1], [0, 2, 2], [2, 1, -2], [1, 3, 1]]],
  [3, [[0, 1, 2], [0, 2, 3], [1, 2, -2]]],
  [3, [[0, 1, 1], [1, 2, 1]]],
];

console.log(
  padEnd("edges", 40) + padEnd("truth", 16) + padEnd("Dijkstra", 16) + padEnd("reopening", 16) + "lifted by 2"
);
for (const [n, edges] of CASES) {
  const neighbours = build(n, edges);
  const truth = [];
  for (let t = 0; t < n; t += 1) truth.push(cheapestByWalking(n, edges, 0, t));
  const [greedy] = dijkstra(neighbours, 0);
  const [again] = reopening(neighbours, 0);
  const raised = lifted(neighbours, 0, 2);
  console.log(
    padEnd(showEdges(edges), 40) +
      padEnd(show(truth), 16) +
      padEnd(show(greedy), 16) +
      padEnd(show(again), 16) +
      show(raised)
  );
}
console.log();

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 1n;
function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const TRIALS = 3000;
let skipped = 0;
let positiveOk = 0;
let negativeOk = 0;
let negativeHigh = 0;
let negativeLow = 0;
let reopenOk = 0;
let liftedOk = 0;
let hadNegative = 0;
let greedyWork = 0;
let reopenWork = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(5);
  const edges = [];
  let negative = false;
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v && rand(3) === 0) {
        const w = rand(9) - 3;
        if (w < 0) negative = true;
        edges.push([u, v, w]);
      }
    }
  }
  if (hasNegativeCycle(n, edges)) {
    skipped += 1;
    continue;
  }
  const neighbours = build(n, edges);
  const truth = [];
  for (let target = 0; target < n; target += 1) truth.push(cheapestByWalking(n, edges, 0, target));
  const [greedy, , greedySteps] = dijkstra(neighbours, 0);
  const [again, reopenSteps] = reopening(neighbours, 0);
  const raised = lifted(neighbours, 0, 3);
  greedyWork += greedySteps;
  reopenWork += reopenSteps;
  let goodGreedy = true;
  let high = false;
  let low = false;
  for (let target = 0; target < n; target += 1) {
    if (greedy[target] !== truth[target]) {
      goodGreedy = false;
      if (greedy[target] > truth[target]) high = true;
      if (greedy[target] < truth[target]) low = true;
    }
  }
  let goodReopen = true;
  let goodLifted = true;
  for (let target = 0; target < n; target += 1) {
    if (again[target] !== truth[target]) goodReopen = false;
    if (raised[target] !== truth[target]) goodLifted = false;
  }
  if (negative) {
    hadNegative += 1;
    if (goodGreedy) negativeOk += 1;
    if (high) negativeHigh += 1;
    if (low) negativeLow += 1;
  } else if (goodGreedy) {
    positiveOk += 1;
  }
  if (goodReopen) reopenOk += 1;
  if (goodLifted) liftedOk += 1;
}

const kept = TRIALS - skipped;
console.log(\`over \${TRIALS} random graphs with weights from -3 to 5:\`);
console.log(\`  had a negative cycle, skipped        \${pad(skipped, 6)}\`);
console.log(\`  of the \${kept} kept, had a negative edge \${pad(hadNegative, 4)}\`);
console.log(\`  Dijkstra right on the rest           \${pad(positiveOk, 6)}\`);
console.log(\`  Dijkstra right with a negative edge  \${pad(negativeOk, 6)}\`);
console.log(\`  it reported a distance that was high \${pad(negativeHigh, 6)}\`);
console.log(\`  it reported a distance that was low  \${pad(negativeLow, 6)}\`);
console.log(\`  re-opening was right                 \${pad(reopenOk, 6)}\`);
console.log(\`  lifting every edge by 3 was right    \${pad(liftedOk, 6)}\`);
console.log(\`  edges relaxed, greedy against reopen \${pad(greedyWork, 6)}\${pad(reopenWork, 8)}\`);
console.log();
console.log("Dijkstra does not fail loudly on a negative edge. It freezes a distance");
console.log("that is not final and reports a number that is too large -- never too");
console.log("small, because every value it reports is the cost of some real route.");
console.log("Row one is the smallest example there is: node 1 is settled at 1 because");
console.log("that is the cheapest thing on the frontier, and the -2 edge out of node 2");
console.log("is not relaxed until afterwards.");
console.log();
console.log("Re-opening a settled node when it improves is correct on every graph");
console.log("here, and costs more edge relaxations. It is also no longer Dijkstra:");
console.log("with no settled set there is no greedy step left, and what remains is");
console.log("Bellman-Ford with a work queue, which is the next lesson.");
console.log();
console.log("Lifting every edge to make it non-negative is the repair that looks");
console.log("obvious and is not. The lift is charged once per edge, so it penalises");
console.log("routes with more hops, and Dijkstra on the lifted graph picks a");
console.log("different route. Subtracting the lift back off afterwards cannot undo");
console.log("that -- the wrong route has already been chosen.");
`,
            },
            {
              lang: "typescript",
              code: `// What a negative edge does to Dijkstra, and why the obvious repairs do not
// work.
//
// The greedy step says: the closest unsettled node is finished. A negative edge
// breaks that in one sentence -- a route that currently looks longer can still
// get cheaper later, so settling is premature. The algorithm does not crash or
// loop; it returns a number that is too large.
//
// Two repairs are measured here. Re-opening a settled node whenever it improves
// is correct and is no longer Dijkstra -- it is Bellman-Ford with a queue, and
// the example counts the extra work. Adding a constant to every edge to make
// them all non-negative is the repair people reach for first, and it changes
// the answer, because it charges per edge rather than per route.

const INF = 1000000000;

type Weighted = [number, number, number];
type Link = [number, number];

function build(n: number, edges: Weighted[]): Link[][] {
  const neighbours: Link[][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) neighbours[u].push([v, w]);
  return neighbours;
}

/** Settle and freeze. The frozen value is what the algorithm reports. */
function dijkstra(neighbours: Link[][], start: number): [number[], number[], number] {
  const n = neighbours.length;
  const best = new Array(n).fill(INF);
  const frozen = new Array(n).fill(INF);
  const hops = new Array(n).fill(0);
  const settled = new Array(n).fill(false);
  best[start] = 0;
  let relaxations = 0;
  for (let round = 0; round < n; round += 1) {
    let at = -1;
    for (let v = 0; v < n; v += 1) {
      if (!settled[v] && best[v] < INF && (at < 0 || best[v] < best[at])) at = v;
    }
    if (at < 0) break;
    settled[at] = true;
    frozen[at] = best[at];
    for (const [u, w] of neighbours[at]) {
      relaxations += 1;
      if (best[at] + w < best[u]) {
        best[u] = best[at] + w;
        hops[u] = hops[at] + 1;
      }
    }
  }
  return [frozen, hops, relaxations];
}

/** Put a node back on the queue whenever it improves. Correct, and not Dijkstra. */
function reopening(neighbours: Link[][], start: number): [number[], number] {
  const n = neighbours.length;
  const best = new Array(n).fill(INF);
  best[start] = 0;
  const queue = [start];
  let head = 0;
  let relaxations = 0;
  while (head < queue.length) {
    const v = queue[head];
    head += 1;
    for (const [u, w] of neighbours[v]) {
      relaxations += 1;
      if (best[v] + w < best[u]) {
        best[u] = best[v] + w;
        queue.push(u);
      }
    }
  }
  return [best, relaxations];
}

/** Add lift to every edge, run Dijkstra, then take lift * hops back off. */
function lifted(neighbours: Link[][], start: number, lift: number): number[] {
  const n = neighbours.length;
  const raised: Link[][] = Array.from({ length: n }, () => []);
  for (let v = 0; v < n; v += 1) {
    for (const [u, w] of neighbours[v]) raised[v].push([u, w + lift]);
  }
  const [frozen, hops] = dijkstra(raised, start);
  const out: number[] = [];
  for (let v = 0; v < n; v += 1) {
    out.push(frozen[v] >= INF ? INF : frozen[v] - lift * hops[v]);
  }
  return out;
}

/** One extra Bellman-Ford round: if anything still improves, a loop pays. */
function hasNegativeCycle(n: number, edges: Weighted[]): boolean {
  const best = new Array(n).fill(0);
  for (let round = 0; round < n - 1; round += 1) {
    for (const [u, v, w] of edges) {
      if (best[u] + w < best[v]) best[v] = best[u] + w;
    }
  }
  for (const [u, v, w] of edges) {
    if (best[u] + w < best[v]) return true;
  }
  return false;
}

/** Every simple path. The definition, and it does not care about signs. */
function cheapestByWalking(n: number, edges: Weighted[], start: number, target: number): number {
  const neighbours = build(n, edges);
  let best = INF;
  const onPath = new Array(n).fill(false);

  function step(v: number, spent: number): void {
    if (v === target && spent < best) best = spent;
    onPath[v] = true;
    for (const [u, w] of neighbours[v]) {
      if (!onPath[u]) step(u, spent + w);
    }
    onPath[v] = false;
  }

  step(start, 0);
  return best;
}

const show = (values: number[]): string =>
  "[" + values.map((v) => (v >= INF ? "-" : String(v))).join(", ") + "]";
const showEdges = (edges: Weighted[]): string =>
  "[" + edges.map(([u, v, w]) => \`\${u}->\${v}:\${w}\`).join(", ") + "]";
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const pad = (v: string | number, w: number): string => String(v).padStart(w);

const CASES: [number, Weighted[]][] = [
  [3, [[0, 1, 1], [0, 2, 2], [2, 1, -2]]],
  [4, [[0, 1, 1], [0, 2, 2], [2, 1, -2], [1, 3, 1]]],
  [3, [[0, 1, 2], [0, 2, 3], [1, 2, -2]]],
  [3, [[0, 1, 1], [1, 2, 1]]],
];

console.log(
  padEnd("edges", 40) + padEnd("truth", 16) + padEnd("Dijkstra", 16) + padEnd("reopening", 16) + "lifted by 2"
);
for (const [n, edges] of CASES) {
  const neighbours = build(n, edges);
  const truth: number[] = [];
  for (let t = 0; t < n; t += 1) truth.push(cheapestByWalking(n, edges, 0, t));
  const [greedy] = dijkstra(neighbours, 0);
  const [again] = reopening(neighbours, 0);
  const raised = lifted(neighbours, 0, 2);
  console.log(
    padEnd(showEdges(edges), 40) +
      padEnd(show(truth), 16) +
      padEnd(show(greedy), 16) +
      padEnd(show(again), 16) +
      show(raised)
  );
}
console.log();

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 1n;
function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const TRIALS = 3000;
let skipped = 0;
let positiveOk = 0;
let negativeOk = 0;
let negativeHigh = 0;
let negativeLow = 0;
let reopenOk = 0;
let liftedOk = 0;
let hadNegative = 0;
let greedyWork = 0;
let reopenWork = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(5);
  const edges: Weighted[] = [];
  let negative = false;
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v && rand(3) === 0) {
        const w = rand(9) - 3;
        if (w < 0) negative = true;
        edges.push([u, v, w]);
      }
    }
  }
  if (hasNegativeCycle(n, edges)) {
    skipped += 1;
    continue;
  }
  const neighbours = build(n, edges);
  const truth: number[] = [];
  for (let target = 0; target < n; target += 1) truth.push(cheapestByWalking(n, edges, 0, target));
  const [greedy, , greedySteps] = dijkstra(neighbours, 0);
  const [again, reopenSteps] = reopening(neighbours, 0);
  const raised = lifted(neighbours, 0, 3);
  greedyWork += greedySteps;
  reopenWork += reopenSteps;
  let goodGreedy = true;
  let high = false;
  let low = false;
  for (let target = 0; target < n; target += 1) {
    if (greedy[target] !== truth[target]) {
      goodGreedy = false;
      if (greedy[target] > truth[target]) high = true;
      if (greedy[target] < truth[target]) low = true;
    }
  }
  let goodReopen = true;
  let goodLifted = true;
  for (let target = 0; target < n; target += 1) {
    if (again[target] !== truth[target]) goodReopen = false;
    if (raised[target] !== truth[target]) goodLifted = false;
  }
  if (negative) {
    hadNegative += 1;
    if (goodGreedy) negativeOk += 1;
    if (high) negativeHigh += 1;
    if (low) negativeLow += 1;
  } else if (goodGreedy) {
    positiveOk += 1;
  }
  if (goodReopen) reopenOk += 1;
  if (goodLifted) liftedOk += 1;
}

const kept = TRIALS - skipped;
console.log(\`over \${TRIALS} random graphs with weights from -3 to 5:\`);
console.log(\`  had a negative cycle, skipped        \${pad(skipped, 6)}\`);
console.log(\`  of the \${kept} kept, had a negative edge \${pad(hadNegative, 4)}\`);
console.log(\`  Dijkstra right on the rest           \${pad(positiveOk, 6)}\`);
console.log(\`  Dijkstra right with a negative edge  \${pad(negativeOk, 6)}\`);
console.log(\`  it reported a distance that was high \${pad(negativeHigh, 6)}\`);
console.log(\`  it reported a distance that was low  \${pad(negativeLow, 6)}\`);
console.log(\`  re-opening was right                 \${pad(reopenOk, 6)}\`);
console.log(\`  lifting every edge by 3 was right    \${pad(liftedOk, 6)}\`);
console.log(\`  edges relaxed, greedy against reopen \${pad(greedyWork, 6)}\${pad(reopenWork, 8)}\`);
console.log();
console.log("Dijkstra does not fail loudly on a negative edge. It freezes a distance");
console.log("that is not final and reports a number that is too large -- never too");
console.log("small, because every value it reports is the cost of some real route.");
console.log("Row one is the smallest example there is: node 1 is settled at 1 because");
console.log("that is the cheapest thing on the frontier, and the -2 edge out of node 2");
console.log("is not relaxed until afterwards.");
console.log();
console.log("Re-opening a settled node when it improves is correct on every graph");
console.log("here, and costs more edge relaxations. It is also no longer Dijkstra:");
console.log("with no settled set there is no greedy step left, and what remains is");
console.log("Bellman-Ford with a work queue, which is the next lesson.");
console.log();
console.log("Lifting every edge to make it non-negative is the repair that looks");
console.log("obvious and is not. The lift is charged once per edge, so it penalises");
console.log("routes with more hops, and Dijkstra on the lifted graph picks a");
console.log("different route. Subtracting the lift back off afterwards cannot undo");
console.log("that -- the wrong route has already been chosen.");
`,
            },
            {
              lang: "java",
              code: `// What a negative edge does to Dijkstra, and why the obvious repairs do not
// work.
//
// The greedy step says: the closest unsettled node is finished. A negative edge
// breaks that in one sentence -- a route that currently looks longer can still
// get cheaper later, so settling is premature. The algorithm does not crash or
// loop; it returns a number that is too large.
//
// Two repairs are measured here. Re-opening a settled node whenever it improves
// is correct and is no longer Dijkstra -- it is Bellman-Ford with a queue, and
// the example counts the extra work. Adding a constant to every edge to make
// them all non-negative is the repair people reach for first, and it changes
// the answer, because it charges per edge rather than per route.

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {

    static final int INF = 1000000000;

    static List<List<int[]>> build(int n, int[][] edges) {
        List<List<int[]>> neighbours = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            neighbours.add(new ArrayList<>());
        }
        for (int[] e : edges) {
            neighbours.get(e[0]).add(new int[] {e[1], e[2]});
        }
        return neighbours;
    }

    static int[] lastFrozen;
    static int[] lastHops;
    static int lastRelaxations;

    /** Settle and freeze. The frozen value is what the algorithm reports. */
    static void dijkstra(List<List<int[]>> neighbours, int start) {
        int n = neighbours.size();
        int[] best = new int[n];
        int[] frozen = new int[n];
        Arrays.fill(best, INF);
        Arrays.fill(frozen, INF);
        int[] hops = new int[n];
        boolean[] settled = new boolean[n];
        best[start] = 0;
        int relaxations = 0;
        for (int round = 0; round < n; round++) {
            int at = -1;
            for (int v = 0; v < n; v++) {
                if (!settled[v] && best[v] < INF && (at < 0 || best[v] < best[at])) {
                    at = v;
                }
            }
            if (at < 0) {
                break;
            }
            settled[at] = true;
            frozen[at] = best[at];
            for (int[] link : neighbours.get(at)) {
                relaxations++;
                if (best[at] + link[1] < best[link[0]]) {
                    best[link[0]] = best[at] + link[1];
                    hops[link[0]] = hops[at] + 1;
                }
            }
        }
        lastFrozen = frozen;
        lastHops = hops;
        lastRelaxations = relaxations;
    }

    static int[] lastReopened;
    static int lastReopenSteps;

    /** Put a node back on the queue whenever it improves. Correct, and not Dijkstra. */
    static void reopening(List<List<int[]>> neighbours, int start) {
        int n = neighbours.size();
        int[] best = new int[n];
        Arrays.fill(best, INF);
        best[start] = 0;
        List<Integer> queue = new ArrayList<>();
        queue.add(start);
        int head = 0;
        int relaxations = 0;
        while (head < queue.size()) {
            int v = queue.get(head);
            head++;
            for (int[] link : neighbours.get(v)) {
                relaxations++;
                if (best[v] + link[1] < best[link[0]]) {
                    best[link[0]] = best[v] + link[1];
                    queue.add(link[0]);
                }
            }
        }
        lastReopened = best;
        lastReopenSteps = relaxations;
    }

    /** Add lift to every edge, run Dijkstra, then take lift * hops back off. */
    static int[] lifted(List<List<int[]>> neighbours, int start, int lift) {
        int n = neighbours.size();
        List<List<int[]>> raised = new ArrayList<>();
        for (int v = 0; v < n; v++) {
            raised.add(new ArrayList<>());
            for (int[] link : neighbours.get(v)) {
                raised.get(v).add(new int[] {link[0], link[1] + lift});
            }
        }
        dijkstra(raised, start);
        int[] frozen = lastFrozen;
        int[] hops = lastHops;
        int[] out = new int[n];
        for (int v = 0; v < n; v++) {
            out[v] = frozen[v] >= INF ? INF : frozen[v] - lift * hops[v];
        }
        return out;
    }

    /** One extra Bellman-Ford round: if anything still improves, a loop pays. */
    static boolean hasNegativeCycle(int n, int[][] edges) {
        int[] best = new int[n];
        for (int round = 0; round < n - 1; round++) {
            for (int[] e : edges) {
                if (best[e[0]] + e[2] < best[e[1]]) {
                    best[e[1]] = best[e[0]] + e[2];
                }
            }
        }
        for (int[] e : edges) {
            if (best[e[0]] + e[2] < best[e[1]]) {
                return true;
            }
        }
        return false;
    }

    static int walkBest;
    static boolean[] walkOnPath;

    static void step(List<List<int[]>> neighbours, int target, int v, int spent) {
        if (v == target && spent < walkBest) {
            walkBest = spent;
        }
        walkOnPath[v] = true;
        for (int[] link : neighbours.get(v)) {
            if (!walkOnPath[link[0]]) {
                step(neighbours, target, link[0], spent + link[1]);
            }
        }
        walkOnPath[v] = false;
    }

    /** Every simple path. The definition, and it does not care about signs. */
    static int cheapestByWalking(int n, int[][] edges, int start, int target) {
        List<List<int[]>> neighbours = build(n, edges);
        walkBest = INF;
        walkOnPath = new boolean[n];
        step(neighbours, target, start, 0);
        return walkBest;
    }

    static String show(int[] values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.length; i++) {
            if (i > 0) {
                sb.append(", ");
            }
            sb.append(values[i] >= INF ? "-" : String.valueOf(values[i]));
        }
        return sb.append("]").toString();
    }

    static String showEdges(int[][] edges) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < edges.length; i++) {
            if (i > 0) {
                sb.append(", ");
            }
            sb.append(edges[i][0]).append("->").append(edges[i][1]).append(":").append(edges[i][2]);
        }
        return sb.append("]").toString();
    }

    static String padEnd(String text, int width) {
        StringBuilder sb = new StringBuilder(text);
        while (sb.length() < width) {
            sb.append(' ');
        }
        return sb.toString();
    }

    static String pad(String text, int width) {
        StringBuilder sb = new StringBuilder();
        while (sb.length() + text.length() < width) {
            sb.append(' ');
        }
        return sb.append(text).toString();
    }

    // The same linear congruential generator in every language, so the random
    // graphs below are the same graphs whichever translation is run.
    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        int[] sizes = {3, 4, 3, 3};
        int[][][] cases = {
            {{0, 1, 1}, {0, 2, 2}, {2, 1, -2}},
            {{0, 1, 1}, {0, 2, 2}, {2, 1, -2}, {1, 3, 1}},
            {{0, 1, 2}, {0, 2, 3}, {1, 2, -2}},
            {{0, 1, 1}, {1, 2, 1}},
        };

        System.out.println(padEnd("edges", 40) + padEnd("truth", 16) + padEnd("Dijkstra", 16)
                + padEnd("reopening", 16) + "lifted by 2");
        for (int c = 0; c < sizes.length; c++) {
            int n = sizes[c];
            List<List<int[]>> neighbours = build(n, cases[c]);
            int[] truth = new int[n];
            for (int t = 0; t < n; t++) {
                truth[t] = cheapestByWalking(n, cases[c], 0, t);
            }
            dijkstra(neighbours, 0);
            int[] greedy = lastFrozen;
            reopening(neighbours, 0);
            int[] again = lastReopened;
            int[] raised = lifted(neighbours, 0, 2);
            System.out.println(padEnd(showEdges(cases[c]), 40) + padEnd(show(truth), 16)
                    + padEnd(show(greedy), 16) + padEnd(show(again), 16) + show(raised));
        }
        System.out.println();

        int trials = 3000;
        int skipped = 0;
        int positiveOk = 0;
        int negativeOk = 0;
        int negativeHigh = 0;
        int negativeLow = 0;
        int reopenOk = 0;
        int liftedOk = 0;
        int hadNegative = 0;
        int greedyWork = 0;
        int reopenWork = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(5);
            List<int[]> collected = new ArrayList<>();
            boolean negative = false;
            for (int u = 0; u < n; u++) {
                for (int v = 0; v < n; v++) {
                    if (u != v && rand(3) == 0) {
                        int w = rand(9) - 3;
                        if (w < 0) {
                            negative = true;
                        }
                        collected.add(new int[] {u, v, w});
                    }
                }
            }
            int[][] edges = collected.toArray(new int[0][]);
            if (hasNegativeCycle(n, edges)) {
                skipped++;
                continue;
            }
            List<List<int[]>> neighbours = build(n, edges);
            int[] truth = new int[n];
            for (int target = 0; target < n; target++) {
                truth[target] = cheapestByWalking(n, edges, 0, target);
            }
            dijkstra(neighbours, 0);
            int[] greedy = lastFrozen;
            int greedySteps = lastRelaxations;
            reopening(neighbours, 0);
            int[] again = lastReopened;
            int reopenSteps = lastReopenSteps;
            int[] raised = lifted(neighbours, 0, 3);
            greedyWork += greedySteps;
            reopenWork += reopenSteps;
            boolean goodGreedy = true;
            boolean high = false;
            boolean low = false;
            for (int target = 0; target < n; target++) {
                if (greedy[target] != truth[target]) {
                    goodGreedy = false;
                    if (greedy[target] > truth[target]) {
                        high = true;
                    }
                    if (greedy[target] < truth[target]) {
                        low = true;
                    }
                }
            }
            boolean goodReopen = true;
            boolean goodLifted = true;
            for (int target = 0; target < n; target++) {
                if (again[target] != truth[target]) {
                    goodReopen = false;
                }
                if (raised[target] != truth[target]) {
                    goodLifted = false;
                }
            }
            if (negative) {
                hadNegative++;
                if (goodGreedy) {
                    negativeOk++;
                }
                if (high) {
                    negativeHigh++;
                }
                if (low) {
                    negativeLow++;
                }
            } else if (goodGreedy) {
                positiveOk++;
            }
            if (goodReopen) {
                reopenOk++;
            }
            if (goodLifted) {
                liftedOk++;
            }
        }

        int kept = trials - skipped;
        System.out.println("over " + trials + " random graphs with weights from -3 to 5:");
        System.out.println("  had a negative cycle, skipped        " + pad(String.valueOf(skipped), 6));
        System.out.println("  of the " + kept + " kept, had a negative edge " + pad(String.valueOf(hadNegative), 4));
        System.out.println("  Dijkstra right on the rest           " + pad(String.valueOf(positiveOk), 6));
        System.out.println("  Dijkstra right with a negative edge  " + pad(String.valueOf(negativeOk), 6));
        System.out.println("  it reported a distance that was high " + pad(String.valueOf(negativeHigh), 6));
        System.out.println("  it reported a distance that was low  " + pad(String.valueOf(negativeLow), 6));
        System.out.println("  re-opening was right                 " + pad(String.valueOf(reopenOk), 6));
        System.out.println("  lifting every edge by 3 was right    " + pad(String.valueOf(liftedOk), 6));
        System.out.println("  edges relaxed, greedy against reopen " + pad(String.valueOf(greedyWork), 6)
                + pad(String.valueOf(reopenWork), 8));
        System.out.println();
        System.out.println("Dijkstra does not fail loudly on a negative edge. It freezes a distance");
        System.out.println("that is not final and reports a number that is too large -- never too");
        System.out.println("small, because every value it reports is the cost of some real route.");
        System.out.println("Row one is the smallest example there is: node 1 is settled at 1 because");
        System.out.println("that is the cheapest thing on the frontier, and the -2 edge out of node 2");
        System.out.println("is not relaxed until afterwards.");
        System.out.println();
        System.out.println("Re-opening a settled node when it improves is correct on every graph");
        System.out.println("here, and costs more edge relaxations. It is also no longer Dijkstra:");
        System.out.println("with no settled set there is no greedy step left, and what remains is");
        System.out.println("Bellman-Ford with a work queue, which is the next lesson.");
        System.out.println();
        System.out.println("Lifting every edge to make it non-negative is the repair that looks");
        System.out.println("obvious and is not. The lift is charged once per edge, so it penalises");
        System.out.println("routes with more hops, and Dijkstra on the lifted graph picks a");
        System.out.println("different route. Subtracting the lift back off afterwards cannot undo");
        System.out.println("that -- the wrong route has already been chosen.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// What a negative edge does to Dijkstra, and why the obvious repairs do not
// work.
//
// The greedy step says: the closest unsettled node is finished. A negative edge
// breaks that in one sentence -- a route that currently looks longer can still
// get cheaper later, so settling is premature. The algorithm does not crash or
// loop; it returns a number that is too large.
//
// Two repairs are measured here. Re-opening a settled node whenever it improves
// is correct and is no longer Dijkstra -- it is Bellman-Ford with a queue, and
// the example counts the extra work. Adding a constant to every edge to make
// them all non-negative is the repair people reach for first, and it changes
// the answer, because it charges per edge rather than per route.

#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

const int INF = 1000000000;

struct Weighted {
    int from;
    int to;
    int cost;
};

using Link = std::pair<int, int>;

std::vector<std::vector<Link>> build(int n, const std::vector<Weighted>& edges) {
    std::vector<std::vector<Link>> neighbours(n);
    for (const Weighted& e : edges) {
        neighbours[e.from].push_back(Link(e.to, e.cost));
    }
    return neighbours;
}

// Settle and freeze. The frozen value is what the algorithm reports.
int dijkstra(const std::vector<std::vector<Link>>& neighbours, int start,
             std::vector<int>& frozen, std::vector<int>& hops) {
    int n = static_cast<int>(neighbours.size());
    std::vector<int> best(n, INF);
    frozen.assign(n, INF);
    hops.assign(n, 0);
    std::vector<char> settled(n, 0);
    best[start] = 0;
    int relaxations = 0;
    for (int round = 0; round < n; round++) {
        int at = -1;
        for (int v = 0; v < n; v++) {
            if (!settled[v] && best[v] < INF && (at < 0 || best[v] < best[at])) {
                at = v;
            }
        }
        if (at < 0) {
            break;
        }
        settled[at] = 1;
        frozen[at] = best[at];
        for (const Link& l : neighbours[at]) {
            relaxations++;
            if (best[at] + l.second < best[l.first]) {
                best[l.first] = best[at] + l.second;
                hops[l.first] = hops[at] + 1;
            }
        }
    }
    return relaxations;
}

// Put a node back on the queue whenever it improves. Correct, and not Dijkstra.
int reopening(const std::vector<std::vector<Link>>& neighbours, int start, std::vector<int>& best) {
    int n = static_cast<int>(neighbours.size());
    best.assign(n, INF);
    best[start] = 0;
    std::vector<int> queue;
    queue.push_back(start);
    size_t head = 0;
    int relaxations = 0;
    while (head < queue.size()) {
        int v = queue[head];
        head++;
        for (const Link& l : neighbours[v]) {
            relaxations++;
            if (best[v] + l.second < best[l.first]) {
                best[l.first] = best[v] + l.second;
                queue.push_back(l.first);
            }
        }
    }
    return relaxations;
}

// Add lift to every edge, run Dijkstra, then take lift * hops back off.
std::vector<int> lifted(const std::vector<std::vector<Link>>& neighbours, int start, int lift) {
    int n = static_cast<int>(neighbours.size());
    std::vector<std::vector<Link>> raised(n);
    for (int v = 0; v < n; v++) {
        for (const Link& l : neighbours[v]) {
            raised[v].push_back(Link(l.first, l.second + lift));
        }
    }
    std::vector<int> frozen;
    std::vector<int> hops;
    dijkstra(raised, start, frozen, hops);
    std::vector<int> out(n);
    for (int v = 0; v < n; v++) {
        out[v] = (frozen[v] >= INF) ? INF : frozen[v] - lift * hops[v];
    }
    return out;
}

// One extra Bellman-Ford round: if anything still improves, a loop pays.
bool has_negative_cycle(int n, const std::vector<Weighted>& edges) {
    std::vector<int> best(n, 0);
    for (int round = 0; round < n - 1; round++) {
        for (const Weighted& e : edges) {
            if (best[e.from] + e.cost < best[e.to]) {
                best[e.to] = best[e.from] + e.cost;
            }
        }
    }
    for (const Weighted& e : edges) {
        if (best[e.from] + e.cost < best[e.to]) {
            return true;
        }
    }
    return false;
}

void step(const std::vector<std::vector<Link>>& neighbours, std::vector<char>& on_path,
          int& best, int target, int v, int spent) {
    if (v == target && spent < best) {
        best = spent;
    }
    on_path[v] = 1;
    for (const Link& l : neighbours[v]) {
        if (!on_path[l.first]) {
            step(neighbours, on_path, best, target, l.first, spent + l.second);
        }
    }
    on_path[v] = 0;
}

// Every simple path. The definition, and it does not care about signs.
int cheapest_by_walking(int n, const std::vector<Weighted>& edges, int start, int target) {
    std::vector<std::vector<Link>> neighbours = build(n, edges);
    int best = INF;
    std::vector<char> on_path(n, 0);
    step(neighbours, on_path, best, target, start, 0);
    return best;
}

std::string show(const std::vector<int>& values) {
    std::string out = "[";
    for (size_t i = 0; i < values.size(); i++) {
        if (i > 0) {
            out += ", ";
        }
        out += (values[i] >= INF) ? std::string("-") : std::to_string(values[i]);
    }
    return out + "]";
}

std::string show_edges(const std::vector<Weighted>& edges) {
    std::string out = "[";
    for (size_t i = 0; i < edges.size(); i++) {
        if (i > 0) {
            out += ", ";
        }
        out += std::to_string(edges[i].from) + "->" + std::to_string(edges[i].to)
                + ":" + std::to_string(edges[i].cost);
    }
    return out + "]";
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
long long seed = 1;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    std::vector<int> sizes = {3, 4, 3, 3};
    std::vector<std::vector<Weighted>> cases = {
        {{0, 1, 1}, {0, 2, 2}, {2, 1, -2}},
        {{0, 1, 1}, {0, 2, 2}, {2, 1, -2}, {1, 3, 1}},
        {{0, 1, 2}, {0, 2, 3}, {1, 2, -2}},
        {{0, 1, 1}, {1, 2, 1}},
    };

    std::cout << std::left << std::setw(40) << "edges" << std::setw(16) << "truth"
              << std::setw(16) << "Dijkstra" << std::setw(16) << "reopening"
              << "lifted by 2" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        int n = sizes[c];
        std::vector<std::vector<Link>> neighbours = build(n, cases[c]);
        std::vector<int> truth(n);
        for (int t = 0; t < n; t++) {
            truth[t] = cheapest_by_walking(n, cases[c], 0, t);
        }
        std::vector<int> greedy;
        std::vector<int> hops;
        dijkstra(neighbours, 0, greedy, hops);
        std::vector<int> again;
        reopening(neighbours, 0, again);
        std::vector<int> raised = lifted(neighbours, 0, 2);
        std::cout << std::left << std::setw(40) << show_edges(cases[c]) << std::setw(16) << show(truth)
                  << std::setw(16) << show(greedy) << std::setw(16) << show(again)
                  << show(raised) << "\\n";
    }
    std::cout << "\\n";

    int trials = 3000;
    int skipped = 0;
    int positive_ok = 0;
    int negative_ok = 0;
    int negative_high = 0;
    int negative_low = 0;
    int reopen_ok = 0;
    int lifted_ok = 0;
    int had_negative = 0;
    int greedy_work = 0;
    int reopen_work = 0;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(5);
        std::vector<Weighted> edges;
        bool negative = false;
        for (int u = 0; u < n; u++) {
            for (int v = 0; v < n; v++) {
                if (u != v && rand_below(3) == 0) {
                    int w = rand_below(9) - 3;
                    if (w < 0) {
                        negative = true;
                    }
                    Weighted e;
                    e.from = u;
                    e.to = v;
                    e.cost = w;
                    edges.push_back(e);
                }
            }
        }
        if (has_negative_cycle(n, edges)) {
            skipped++;
            continue;
        }
        std::vector<std::vector<Link>> neighbours = build(n, edges);
        std::vector<int> truth(n);
        for (int target = 0; target < n; target++) {
            truth[target] = cheapest_by_walking(n, edges, 0, target);
        }
        std::vector<int> greedy;
        std::vector<int> hops;
        int greedy_steps = dijkstra(neighbours, 0, greedy, hops);
        std::vector<int> again;
        int reopen_steps = reopening(neighbours, 0, again);
        std::vector<int> raised = lifted(neighbours, 0, 3);
        greedy_work += greedy_steps;
        reopen_work += reopen_steps;
        bool good_greedy = true;
        bool high = false;
        bool low = false;
        for (int target = 0; target < n; target++) {
            if (greedy[target] != truth[target]) {
                good_greedy = false;
                if (greedy[target] > truth[target]) {
                    high = true;
                }
                if (greedy[target] < truth[target]) {
                    low = true;
                }
            }
        }
        bool good_reopen = true;
        bool good_lifted = true;
        for (int target = 0; target < n; target++) {
            if (again[target] != truth[target]) {
                good_reopen = false;
            }
            if (raised[target] != truth[target]) {
                good_lifted = false;
            }
        }
        if (negative) {
            had_negative++;
            if (good_greedy) {
                negative_ok++;
            }
            if (high) {
                negative_high++;
            }
            if (low) {
                negative_low++;
            }
        } else if (good_greedy) {
            positive_ok++;
        }
        if (good_reopen) {
            reopen_ok++;
        }
        if (good_lifted) {
            lifted_ok++;
        }
    }

    int kept = trials - skipped;
    std::cout << "over " << trials << " random graphs with weights from -3 to 5:\\n";
    std::cout << "  had a negative cycle, skipped        " << std::right << std::setw(6) << skipped << "\\n";
    std::cout << "  of the " << kept << " kept, had a negative edge " << std::setw(4) << had_negative << "\\n";
    std::cout << "  Dijkstra right on the rest           " << std::setw(6) << positive_ok << "\\n";
    std::cout << "  Dijkstra right with a negative edge  " << std::setw(6) << negative_ok << "\\n";
    std::cout << "  it reported a distance that was high " << std::setw(6) << negative_high << "\\n";
    std::cout << "  it reported a distance that was low  " << std::setw(6) << negative_low << "\\n";
    std::cout << "  re-opening was right                 " << std::setw(6) << reopen_ok << "\\n";
    std::cout << "  lifting every edge by 3 was right    " << std::setw(6) << lifted_ok << "\\n";
    std::cout << "  edges relaxed, greedy against reopen " << std::setw(6) << greedy_work
              << std::setw(8) << reopen_work << "\\n";
    std::cout << "\\n";
    std::cout << "Dijkstra does not fail loudly on a negative edge. It freezes a distance\\n";
    std::cout << "that is not final and reports a number that is too large -- never too\\n";
    std::cout << "small, because every value it reports is the cost of some real route.\\n";
    std::cout << "Row one is the smallest example there is: node 1 is settled at 1 because\\n";
    std::cout << "that is the cheapest thing on the frontier, and the -2 edge out of node 2\\n";
    std::cout << "is not relaxed until afterwards.\\n";
    std::cout << "\\n";
    std::cout << "Re-opening a settled node when it improves is correct on every graph\\n";
    std::cout << "here, and costs more edge relaxations. It is also no longer Dijkstra:\\n";
    std::cout << "with no settled set there is no greedy step left, and what remains is\\n";
    std::cout << "Bellman-Ford with a work queue, which is the next lesson.\\n";
    std::cout << "\\n";
    std::cout << "Lifting every edge to make it non-negative is the repair that looks\\n";
    std::cout << "obvious and is not. The lift is charged once per edge, so it penalises\\n";
    std::cout << "routes with more hops, and Dijkstra on the lifted graph picks a\\n";
    std::cout << "different route. Subtracting the lift back off afterwards cannot undo\\n";
    std::cout << "that -- the wrong route has already been chosen.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// What a negative edge does to Dijkstra, and why the obvious repairs do not
// work.
//
// The greedy step says: the closest unsettled node is finished. A negative edge
// breaks that in one sentence -- a route that currently looks longer can still
// get cheaper later, so settling is premature. The algorithm does not crash or
// loop; it returns a number that is too large.
//
// Two repairs are measured here. Re-opening a settled node whenever it improves
// is correct and is no longer Dijkstra -- it is Bellman-Ford with a queue, and
// the example counts the extra work. Adding a constant to every edge to make
// them all non-negative is the repair people reach for first, and it changes
// the answer, because it charges per edge rather than per route.

const INF: i64 = 1_000_000_000;

fn build(n: usize, edges: &[(usize, usize, i64)]) -> Vec<Vec<(usize, i64)>> {
    let mut neighbours = vec![Vec::new(); n];
    for &(u, v, w) in edges {
        neighbours[u].push((v, w));
    }
    neighbours
}

/// Settle and freeze. The frozen value is what the algorithm reports.
fn dijkstra(neighbours: &[Vec<(usize, i64)>], start: usize) -> (Vec<i64>, Vec<i64>, i64) {
    let n = neighbours.len();
    let mut best = vec![INF; n];
    let mut frozen = vec![INF; n];
    let mut hops = vec![0i64; n];
    let mut settled = vec![false; n];
    best[start] = 0;
    let mut relaxations = 0i64;
    for _ in 0..n {
        let mut at: i32 = -1;
        for v in 0..n {
            if !settled[v] && best[v] < INF && (at < 0 || best[v] < best[at as usize]) {
                at = v as i32;
            }
        }
        if at < 0 {
            break;
        }
        let at = at as usize;
        settled[at] = true;
        frozen[at] = best[at];
        for i in 0..neighbours[at].len() {
            let (u, w) = neighbours[at][i];
            relaxations += 1;
            if best[at] + w < best[u] {
                best[u] = best[at] + w;
                hops[u] = hops[at] + 1;
            }
        }
    }
    (frozen, hops, relaxations)
}

/// Put a node back on the queue whenever it improves. Correct, and not Dijkstra.
fn reopening(neighbours: &[Vec<(usize, i64)>], start: usize) -> (Vec<i64>, i64) {
    let n = neighbours.len();
    let mut best = vec![INF; n];
    best[start] = 0;
    let mut queue = vec![start];
    let mut head = 0;
    let mut relaxations = 0i64;
    while head < queue.len() {
        let v = queue[head];
        head += 1;
        for i in 0..neighbours[v].len() {
            let (u, w) = neighbours[v][i];
            relaxations += 1;
            if best[v] + w < best[u] {
                best[u] = best[v] + w;
                queue.push(u);
            }
        }
    }
    (best, relaxations)
}

/// Add lift to every edge, run Dijkstra, then take lift * hops back off.
fn lifted(neighbours: &[Vec<(usize, i64)>], start: usize, lift: i64) -> Vec<i64> {
    let n = neighbours.len();
    let mut raised = vec![Vec::new(); n];
    for v in 0..n {
        for i in 0..neighbours[v].len() {
            let (u, w) = neighbours[v][i];
            raised[v].push((u, w + lift));
        }
    }
    let (frozen, hops, _) = dijkstra(&raised, start);
    (0..n)
        .map(|v| if frozen[v] >= INF { INF } else { frozen[v] - lift * hops[v] })
        .collect()
}

/// One extra Bellman-Ford round: if anything still improves, a loop pays.
fn has_negative_cycle(n: usize, edges: &[(usize, usize, i64)]) -> bool {
    let mut best = vec![0i64; n];
    for _ in 0..n.saturating_sub(1) {
        for &(u, v, w) in edges {
            if best[u] + w < best[v] {
                best[v] = best[u] + w;
            }
        }
    }
    for &(u, v, w) in edges {
        if best[u] + w < best[v] {
            return true;
        }
    }
    false
}

fn step(
    neighbours: &[Vec<(usize, i64)>],
    on_path: &mut Vec<bool>,
    best: &mut i64,
    target: usize,
    v: usize,
    spent: i64,
) {
    if v == target && spent < *best {
        *best = spent;
    }
    on_path[v] = true;
    for i in 0..neighbours[v].len() {
        let (u, w) = neighbours[v][i];
        if !on_path[u] {
            step(neighbours, on_path, best, target, u, spent + w);
        }
    }
    on_path[v] = false;
}

/// Every simple path. The definition, and it does not care about signs.
fn cheapest_by_walking(n: usize, edges: &[(usize, usize, i64)], start: usize, target: usize) -> i64 {
    let neighbours = build(n, edges);
    let mut best = INF;
    let mut on_path = vec![false; n];
    step(&neighbours, &mut on_path, &mut best, target, start, 0);
    best
}

fn show(values: &[i64]) -> String {
    let parts: Vec<String> = values
        .iter()
        .map(|&v| if v >= INF { String::from("-") } else { v.to_string() })
        .collect();
    format!("[{}]", parts.join(", "))
}

fn show_edges(edges: &[(usize, usize, i64)]) -> String {
    let parts: Vec<String> = edges
        .iter()
        .map(|&(u, v, w)| format!("{}->{}:{}", u, v, w))
        .collect();
    format!("[{}]", parts.join(", "))
}

fn pad_right(text: &str, width: usize) -> String {
    let mut out = String::from(text);
    while out.chars().count() < width {
        out.push(' ');
    }
    out
}

fn pad_left(text: &str, width: usize) -> String {
    let mut out = String::new();
    while out.chars().count() + text.chars().count() < width {
        out.push(' ');
    }
    out.push_str(text);
    out
}

struct Rng {
    seed: i64,
}

impl Rng {
    // The same linear congruential generator in every language, so the random
    // graphs below are the same graphs whichever translation is run.
    fn next(&mut self, n: i64) -> i64 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        self.seed / 65536 % n
    }
}

fn main() {
    let sizes: Vec<usize> = vec![3, 4, 3, 3];
    let cases: Vec<Vec<(usize, usize, i64)>> = vec![
        vec![(0, 1, 1), (0, 2, 2), (2, 1, -2)],
        vec![(0, 1, 1), (0, 2, 2), (2, 1, -2), (1, 3, 1)],
        vec![(0, 1, 2), (0, 2, 3), (1, 2, -2)],
        vec![(0, 1, 1), (1, 2, 1)],
    ];

    println!(
        "{}{}{}{}{}",
        pad_right("edges", 40),
        pad_right("truth", 16),
        pad_right("Dijkstra", 16),
        pad_right("reopening", 16),
        "lifted by 2"
    );
    for (c, edges) in cases.iter().enumerate() {
        let n = sizes[c];
        let neighbours = build(n, edges);
        let truth: Vec<i64> = (0..n).map(|t| cheapest_by_walking(n, edges, 0, t)).collect();
        let (greedy, _, _) = dijkstra(&neighbours, 0);
        let (again, _) = reopening(&neighbours, 0);
        let raised = lifted(&neighbours, 0, 2);
        println!(
            "{}{}{}{}{}",
            pad_right(&show_edges(edges), 40),
            pad_right(&show(&truth), 16),
            pad_right(&show(&greedy), 16),
            pad_right(&show(&again), 16),
            show(&raised)
        );
    }
    println!();

    let mut rng = Rng { seed: 1 };
    let trials = 3000;
    let mut skipped = 0;
    let mut positive_ok = 0;
    let mut negative_ok = 0;
    let mut negative_high = 0;
    let mut negative_low = 0;
    let mut reopen_ok = 0;
    let mut lifted_ok = 0;
    let mut had_negative = 0;
    let mut greedy_work = 0i64;
    let mut reopen_work = 0i64;
    for _ in 0..trials {
        let n = (2 + rng.next(5)) as usize;
        let mut edges: Vec<(usize, usize, i64)> = Vec::new();
        let mut negative = false;
        for u in 0..n {
            for v in 0..n {
                if u != v && rng.next(3) == 0 {
                    let w = rng.next(9) - 3;
                    if w < 0 {
                        negative = true;
                    }
                    edges.push((u, v, w));
                }
            }
        }
        if has_negative_cycle(n, &edges) {
            skipped += 1;
            continue;
        }
        let neighbours = build(n, &edges);
        let truth: Vec<i64> = (0..n).map(|t| cheapest_by_walking(n, &edges, 0, t)).collect();
        let (greedy, _, greedy_steps) = dijkstra(&neighbours, 0);
        let (again, reopen_steps) = reopening(&neighbours, 0);
        let raised = lifted(&neighbours, 0, 3);
        greedy_work += greedy_steps;
        reopen_work += reopen_steps;
        let mut good_greedy = true;
        let mut high = false;
        let mut low = false;
        for target in 0..n {
            if greedy[target] != truth[target] {
                good_greedy = false;
                if greedy[target] > truth[target] {
                    high = true;
                }
                if greedy[target] < truth[target] {
                    low = true;
                }
            }
        }
        let mut good_reopen = true;
        let mut good_lifted = true;
        for target in 0..n {
            if again[target] != truth[target] {
                good_reopen = false;
            }
            if raised[target] != truth[target] {
                good_lifted = false;
            }
        }
        if negative {
            had_negative += 1;
            if good_greedy {
                negative_ok += 1;
            }
            if high {
                negative_high += 1;
            }
            if low {
                negative_low += 1;
            }
        } else if good_greedy {
            positive_ok += 1;
        }
        if good_reopen {
            reopen_ok += 1;
        }
        if good_lifted {
            lifted_ok += 1;
        }
    }

    let kept = trials - skipped;
    println!("over {} random graphs with weights from -3 to 5:", trials);
    println!("  had a negative cycle, skipped        {}", pad_left(&skipped.to_string(), 6));
    println!("  of the {} kept, had a negative edge {}", kept, pad_left(&had_negative.to_string(), 4));
    println!("  Dijkstra right on the rest           {}", pad_left(&positive_ok.to_string(), 6));
    println!("  Dijkstra right with a negative edge  {}", pad_left(&negative_ok.to_string(), 6));
    println!("  it reported a distance that was high {}", pad_left(&negative_high.to_string(), 6));
    println!("  it reported a distance that was low  {}", pad_left(&negative_low.to_string(), 6));
    println!("  re-opening was right                 {}", pad_left(&reopen_ok.to_string(), 6));
    println!("  lifting every edge by 3 was right    {}", pad_left(&lifted_ok.to_string(), 6));
    println!(
        "  edges relaxed, greedy against reopen {}{}",
        pad_left(&greedy_work.to_string(), 6),
        pad_left(&reopen_work.to_string(), 8)
    );
    println!();
    println!("Dijkstra does not fail loudly on a negative edge. It freezes a distance");
    println!("that is not final and reports a number that is too large -- never too");
    println!("small, because every value it reports is the cost of some real route.");
    println!("Row one is the smallest example there is: node 1 is settled at 1 because");
    println!("that is the cheapest thing on the frontier, and the -2 edge out of node 2");
    println!("is not relaxed until afterwards.");
    println!();
    println!("Re-opening a settled node when it improves is correct on every graph");
    println!("here, and costs more edge relaxations. It is also no longer Dijkstra:");
    println!("with no settled set there is no greedy step left, and what remains is");
    println!("Bellman-Ford with a work queue, which is the next lesson.");
    println!();
    println!("Lifting every edge to make it non-negative is the repair that looks");
    println!("obvious and is not. The lift is charged once per edge, so it penalises");
    println!("routes with more hops, and Dijkstra on the lifted graph picks a");
    println!("different route. Subtracting the lift back off afterwards cannot undo");
    println!("that -- the wrong route has already been chosen.");
}
`,
            },
            {
              lang: "go",
              code: `// What a negative edge does to Dijkstra, and why the obvious repairs do not
// work.
//
// The greedy step says: the closest unsettled node is finished. A negative edge
// breaks that in one sentence -- a route that currently looks longer can still
// get cheaper later, so settling is premature. The algorithm does not crash or
// loop; it returns a number that is too large.
//
// Two repairs are measured here. Re-opening a settled node whenever it improves
// is correct and is no longer Dijkstra -- it is Bellman-Ford with a queue, and
// the example counts the extra work. Adding a constant to every edge to make
// them all non-negative is the repair people reach for first, and it changes
// the answer, because it charges per edge rather than per route.

package main

import (
	"fmt"
	"strings"
)

const inf = 1000000000

type weighted struct{ from, to, cost int }
type link struct{ to, cost int }

func build(n int, edges []weighted) [][]link {
	neighbours := make([][]link, n)
	for i := range neighbours {
		neighbours[i] = []link{}
	}
	for _, e := range edges {
		neighbours[e.from] = append(neighbours[e.from], link{e.to, e.cost})
	}
	return neighbours
}

// Settle and freeze. The frozen value is what the algorithm reports.
func dijkstra(neighbours [][]link, start int) ([]int, []int, int) {
	n := len(neighbours)
	best := make([]int, n)
	frozen := make([]int, n)
	for i := 0; i < n; i++ {
		best[i] = inf
		frozen[i] = inf
	}
	hops := make([]int, n)
	settled := make([]bool, n)
	best[start] = 0
	relaxations := 0
	for round := 0; round < n; round++ {
		at := -1
		for v := 0; v < n; v++ {
			if !settled[v] && best[v] < inf && (at < 0 || best[v] < best[at]) {
				at = v
			}
		}
		if at < 0 {
			break
		}
		settled[at] = true
		frozen[at] = best[at]
		for _, l := range neighbours[at] {
			relaxations++
			if best[at]+l.cost < best[l.to] {
				best[l.to] = best[at] + l.cost
				hops[l.to] = hops[at] + 1
			}
		}
	}
	return frozen, hops, relaxations
}

// Put a node back on the queue whenever it improves. Correct, and not Dijkstra.
func reopening(neighbours [][]link, start int) ([]int, int) {
	n := len(neighbours)
	best := make([]int, n)
	for i := range best {
		best[i] = inf
	}
	best[start] = 0
	queue := []int{start}
	head := 0
	relaxations := 0
	for head < len(queue) {
		v := queue[head]
		head++
		for _, l := range neighbours[v] {
			relaxations++
			if best[v]+l.cost < best[l.to] {
				best[l.to] = best[v] + l.cost
				queue = append(queue, l.to)
			}
		}
	}
	return best, relaxations
}

// Add lift to every edge, run Dijkstra, then take lift * hops back off.
func lifted(neighbours [][]link, start, lift int) []int {
	n := len(neighbours)
	raised := make([][]link, n)
	for v := 0; v < n; v++ {
		raised[v] = []link{}
		for _, l := range neighbours[v] {
			raised[v] = append(raised[v], link{l.to, l.cost + lift})
		}
	}
	frozen, hops, _ := dijkstra(raised, start)
	out := make([]int, n)
	for v := 0; v < n; v++ {
		if frozen[v] >= inf {
			out[v] = inf
		} else {
			out[v] = frozen[v] - lift*hops[v]
		}
	}
	return out
}

// One extra Bellman-Ford round: if anything still improves, a loop pays.
func hasNegativeCycle(n int, edges []weighted) bool {
	best := make([]int, n)
	for round := 0; round < n-1; round++ {
		for _, e := range edges {
			if best[e.from]+e.cost < best[e.to] {
				best[e.to] = best[e.from] + e.cost
			}
		}
	}
	for _, e := range edges {
		if best[e.from]+e.cost < best[e.to] {
			return true
		}
	}
	return false
}

// Every simple path. The definition, and it does not care about signs.
func cheapestByWalking(n int, edges []weighted, start, target int) int {
	neighbours := build(n, edges)
	best := inf
	onPath := make([]bool, n)
	var step func(v, spent int)
	step = func(v, spent int) {
		if v == target && spent < best {
			best = spent
		}
		onPath[v] = true
		for _, l := range neighbours[v] {
			if !onPath[l.to] {
				step(l.to, spent+l.cost)
			}
		}
		onPath[v] = false
	}
	step(start, 0)
	return best
}

func show(values []int) string {
	parts := make([]string, len(values))
	for i, v := range values {
		if v >= inf {
			parts[i] = "-"
		} else {
			parts[i] = fmt.Sprintf("%d", v)
		}
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func showEdges(edges []weighted) string {
	parts := make([]string, len(edges))
	for i, e := range edges {
		parts[i] = fmt.Sprintf("%d->%d:%d", e.from, e.to, e.cost)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	sizes := []int{3, 4, 3, 3}
	cases := [][]weighted{
		{{0, 1, 1}, {0, 2, 2}, {2, 1, -2}},
		{{0, 1, 1}, {0, 2, 2}, {2, 1, -2}, {1, 3, 1}},
		{{0, 1, 2}, {0, 2, 3}, {1, 2, -2}},
		{{0, 1, 1}, {1, 2, 1}},
	}

	fmt.Printf("%-40s%-16s%-16s%-16s%s\\n", "edges", "truth", "Dijkstra", "reopening", "lifted by 2")
	for c, edges := range cases {
		n := sizes[c]
		neighbours := build(n, edges)
		truth := make([]int, n)
		for t := 0; t < n; t++ {
			truth[t] = cheapestByWalking(n, edges, 0, t)
		}
		greedy, _, _ := dijkstra(neighbours, 0)
		again, _ := reopening(neighbours, 0)
		raised := lifted(neighbours, 0, 2)
		fmt.Printf("%-40s%-16s%-16s%-16s%s\\n", showEdges(edges), show(truth),
			show(greedy), show(again), show(raised))
	}
	fmt.Println()

	trials := 3000
	skipped := 0
	positiveOk := 0
	negativeOk := 0
	negativeHigh := 0
	negativeLow := 0
	reopenOk := 0
	liftedOk := 0
	hadNegative := 0
	greedyWork := 0
	reopenWork := 0
	for t := 0; t < trials; t++ {
		n := 2 + rand(5)
		edges := []weighted{}
		negative := false
		for u := 0; u < n; u++ {
			for v := 0; v < n; v++ {
				if u != v && rand(3) == 0 {
					w := rand(9) - 3
					if w < 0 {
						negative = true
					}
					edges = append(edges, weighted{u, v, w})
				}
			}
		}
		if hasNegativeCycle(n, edges) {
			skipped++
			continue
		}
		neighbours := build(n, edges)
		truth := make([]int, n)
		for target := 0; target < n; target++ {
			truth[target] = cheapestByWalking(n, edges, 0, target)
		}
		greedy, _, greedySteps := dijkstra(neighbours, 0)
		again, reopenSteps := reopening(neighbours, 0)
		raised := lifted(neighbours, 0, 3)
		greedyWork += greedySteps
		reopenWork += reopenSteps
		goodGreedy := true
		high := false
		low := false
		for target := 0; target < n; target++ {
			if greedy[target] != truth[target] {
				goodGreedy = false
				if greedy[target] > truth[target] {
					high = true
				}
				if greedy[target] < truth[target] {
					low = true
				}
			}
		}
		goodReopen := true
		goodLifted := true
		for target := 0; target < n; target++ {
			if again[target] != truth[target] {
				goodReopen = false
			}
			if raised[target] != truth[target] {
				goodLifted = false
			}
		}
		if negative {
			hadNegative++
			if goodGreedy {
				negativeOk++
			}
			if high {
				negativeHigh++
			}
			if low {
				negativeLow++
			}
		} else if goodGreedy {
			positiveOk++
		}
		if goodReopen {
			reopenOk++
		}
		if goodLifted {
			liftedOk++
		}
	}

	kept := trials - skipped
	fmt.Printf("over %d random graphs with weights from -3 to 5:\\n", trials)
	fmt.Printf("  had a negative cycle, skipped        %6d\\n", skipped)
	fmt.Printf("  of the %d kept, had a negative edge %4d\\n", kept, hadNegative)
	fmt.Printf("  Dijkstra right on the rest           %6d\\n", positiveOk)
	fmt.Printf("  Dijkstra right with a negative edge  %6d\\n", negativeOk)
	fmt.Printf("  it reported a distance that was high %6d\\n", negativeHigh)
	fmt.Printf("  it reported a distance that was low  %6d\\n", negativeLow)
	fmt.Printf("  re-opening was right                 %6d\\n", reopenOk)
	fmt.Printf("  lifting every edge by 3 was right    %6d\\n", liftedOk)
	fmt.Printf("  edges relaxed, greedy against reopen %6d%8d\\n", greedyWork, reopenWork)
	fmt.Println()
	fmt.Println("Dijkstra does not fail loudly on a negative edge. It freezes a distance")
	fmt.Println("that is not final and reports a number that is too large -- never too")
	fmt.Println("small, because every value it reports is the cost of some real route.")
	fmt.Println("Row one is the smallest example there is: node 1 is settled at 1 because")
	fmt.Println("that is the cheapest thing on the frontier, and the -2 edge out of node 2")
	fmt.Println("is not relaxed until afterwards.")
	fmt.Println()
	fmt.Println("Re-opening a settled node when it improves is correct on every graph")
	fmt.Println("here, and costs more edge relaxations. It is also no longer Dijkstra:")
	fmt.Println("with no settled set there is no greedy step left, and what remains is")
	fmt.Println("Bellman-Ford with a work queue, which is the next lesson.")
	fmt.Println()
	fmt.Println("Lifting every edge to make it non-negative is the repair that looks")
	fmt.Println("obvious and is not. The lift is charged once per edge, so it penalises")
	fmt.Println("routes with more hops, and Dijkstra on the lifted graph picks a")
	fmt.Println("different route. Subtracting the lift back off afterwards cannot undo")
	fmt.Println("that -- the wrong route has already been chosen.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Assuming a negative edge will announce itself",
          body: "It does not. The algorithm returns a plausible number that is the cost of a real route, just not the cheapest one -- too large on 36 of the 1,321 negative-weight graphs measured here, and never too small. If weights can be negative, the choice of algorithm has to be made from the input's specification, not from the output looking sensible.",
        },
        {
          title: "Lifting every weight to make them non-negative",
          body: "The lift is charged once per edge, so it makes long routes look worse and Dijkstra picks a different one. Subtracting it back off afterwards cannot undo a choice that has already been made: correct on only 2,155 of 2,294 graphs here. Rescaling by a constant factor is fine; adding one is not.",
        },
      ],
    },
    {
      id: "the-frontier",
      heading: "The frontier, which is all of the running time",
      body: [
        "The greedy step needs the closest unsettled node, and how that is found decides the complexity of the whole algorithm. It is not part of the algorithm's correctness \u2014 the answers are identical either way, on all 3,000 random graphs \u2014 but it is most of its running time.",
        "**Scan every node.** `O(V)` per settle, `O(V^2)` overall. **A binary heap.** `O(log V)` per push and pop, `O((V + E) log V)` overall.",
        "The measured table says when each is right. On a ring of 2,000 nodes the scan probes 4,000,000 times to do what the heap does in 2,000 pops. On a complete graph of 200 the scan probes 40,000 \u2014 which is the same order as the 39,800 edges, so the heap buys nothing and its log factor is a small loss. The rule of thumb is sparse-heap, dense-scan, and the arithmetic behind it is that `V^2` stops being expensive exactly when the graph already has `V^2` edges.",
        "The heap version has one wrinkle worth doing properly. A node's distance can improve after it is already in the heap, and a binary heap has no cheap way to move an entry. The standard answer is not to move it: push a second entry, and when a stale one surfaces, skip it. On the complete graph of 200 that is 198 stale pops out of 398 \u2014 one repush for almost every node \u2014 and over the random trials 313 graphs of 3,000 had at least one.",
        "Skipping a stale pop costs one comparison against the settled set. The alternative is a heap that supports decrease-key, which is more code for the same answer, and is why almost nobody writes one.",
      ],
      examples: [
        {
          id: "heap-against-scan",
          title: "The same answers through two frontiers, counted on both densities",
          lang: "python",
          code: `# Finding the closest unsettled node is the inner loop, and how it is found
# decides the complexity of the whole algorithm.
#
#   scan every node        O(V) per settle, so O(V^2) overall. Right when the
#                          graph is dense, because V^2 is already the edge count.
#   a binary heap          O(log V) per push and pop, so O((V + E) log V).
#                          Right when the graph is sparse, which is most graphs.
#
# The heap version has one wrinkle worth doing properly: a node's distance can
# improve after it is already in the heap, and a binary heap has no cheap way to
# move an entry. The standard answer is to push a second entry and ignore the
# stale one when it surfaces -- "lazy deletion" -- which is why the heap can hold
# more entries than there are nodes.
INF = 10 ** 9


def build(n, edges):
    neighbours = [[] for _ in range(n)]
    for u, v, w in edges:
        neighbours[u].append((v, w))
    return neighbours


def dijkstra_scanning(neighbours, start):
    """Find the closest unsettled node by looking at all of them."""
    n = len(neighbours)
    best = [INF] * n
    settled = [False] * n
    best[start] = 0
    probes = 0
    for _ in range(n):
        at = -1
        for v in range(n):
            probes += 1
            if not settled[v] and best[v] < INF and (at < 0 or best[v] < best[at]):
                at = v
        if at < 0:
            break
        settled[at] = True
        for u, w in neighbours[at]:
            if best[at] + w < best[u]:
                best[u] = best[at] + w
    return best, probes


def sift_up(heap, at):
    while at > 0:
        up = (at - 1) // 2
        if heap[up][0] <= heap[at][0]:
            break
        heap[up], heap[at] = heap[at], heap[up]
        at = up


def sift_down(heap, at):
    size = len(heap)
    while True:
        small = at
        left = 2 * at + 1
        right = 2 * at + 2
        if left < size and heap[left][0] < heap[small][0]:
            small = left
        if right < size and heap[right][0] < heap[small][0]:
            small = right
        if small == at:
            break
        heap[small], heap[at] = heap[at], heap[small]
        at = small


def heap_push(heap, item):
    heap.append(item)
    sift_up(heap, len(heap) - 1)


def heap_pop(heap):
    top = heap[0]
    last = heap.pop()
    if heap:
        heap[0] = last
        sift_down(heap, 0)
    return top


def dijkstra_heap(neighbours, start):
    """The same algorithm, with the frontier in a binary heap."""
    n = len(neighbours)
    best = [INF] * n
    settled = [False] * n
    best[start] = 0
    heap = []
    heap_push(heap, (0, start))
    pushes = 1
    stale = 0
    probes = 0
    biggest = 1
    while heap:
        probes += 1
        cost, at = heap_pop(heap)
        if settled[at]:
            stale += 1
            continue
        settled[at] = True
        for u, w in neighbours[at]:
            if cost + w < best[u]:
                best[u] = cost + w
                heap_push(heap, (best[u], u))
                pushes += 1
                if len(heap) > biggest:
                    biggest = len(heap)
    return best, probes, pushes, stale, biggest


def same(a, b):
    if len(a) != len(b):
        return False
    for i in range(len(a)):
        if a[i] != b[i]:
            return False
    return True


def ring(n):
    """Sparse: two edges per node, so the heap should win comfortably."""
    edges = []
    for v in range(n):
        edges.append((v, (v + 1) % n, 1 + v % 7))
        edges.append(((v + 1) % n, v, 1 + v % 5))
    return edges


def dense(n):
    """Every ordered pair. Here the scan is already asymptotically free."""
    edges = []
    for u in range(n):
        for v in range(n):
            if u != v:
                edges.append((u, v, 1 + (u * 7 + v) % 9))
    return edges


SHAPES = [
    ("ring of 400", 400, ring(400)),
    ("ring of 2000", 2000, ring(2000)),
    ("complete, 200", 200, dense(200)),
]

print(f"{'shape':<16}{'nodes':>7}{'edges':>8}{'scan probes':>13}"
      f"{'heap pops':>11}{'heap pushes':>13}{'stale pops':>12}")
for name, n, edges in SHAPES:
    neighbours = build(n, edges)
    by_scan, probes = dijkstra_scanning(neighbours, 0)
    by_heap, pops, pushes, stale, _ = dijkstra_heap(neighbours, 0)
    if not same(by_scan, by_heap):
        print("MISMATCH")
    print(f"{name:<16}{n:>7}{len(edges):>8}{probes:>13}{pops:>11}{pushes:>13}{stale:>12}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
agreed = 0
any_stale = 0
total_stale = 0
total_probes = 0
total_pops = 0
for _ in range(TRIALS):
    n = 2 + rand(6)
    edges = []
    for u in range(n):
        for v in range(n):
            if u != v and rand(3) == 0:
                edges.append((u, v, 1 + rand(9)))
    neighbours = build(n, edges)
    by_scan, probes = dijkstra_scanning(neighbours, 0)
    by_heap, pops, _, stale, _ = dijkstra_heap(neighbours, 0)
    if same(by_scan, by_heap):
        agreed += 1
    if stale > 0:
        any_stale += 1
    total_stale += stale
    total_probes += probes
    total_pops += pops

print(f"over {TRIALS} random weighted graphs on up to 7 nodes:")
print(f"  the two frontiers gave the same answers {agreed:>6}")
print(f"  at least one pop was stale              {any_stale:>6}")
print(f"  stale pops in total                     {total_stale:>6}")
print(f"  scan probes against heap pops           {total_probes:>6}{total_pops:>8}")
print()
print("The heap is not a different algorithm; it is the same settle-and-relax")
print("loop with a faster way to find the minimum, and the answers agree every")
print("time. What it changes is the shape of the cost. On the ring of 2,000 the")
print("scan probes four million times to do what the heap does in a few")
print("thousand pops. On the complete graph of 200 the scan probes 40,000 --")
print("which is the same order as the 39,800 edges, so the heap buys nothing")
print("and its log factor is a small loss.")
print()
print("The stale pops are the wrinkle. A node whose distance improves is pushed")
print("again rather than moved, so a node can appear in the heap several times")
print("and some pops are for distances that have already been beaten. On the")
print("complete graph of 200 that is 198 stale pops out of 398 -- one repush for")
print("almost every node. Skipping them on the way out costs one comparison and")
print("is what makes the simple version correct; the alternative is a heap that")
print("supports decrease-key, which is more code for the same answer.")
`,
          output: `shape             nodes   edges  scan probes  heap pops  heap pushes  stale pops
ring of 400         400     800       160000        400          400           0
ring of 2000       2000    4000      4000000       2000         2000           0
complete, 200       200   39800        40000        398          398         198

over 3000 random weighted graphs on up to 7 nodes:
  the two frontiers gave the same answers   3000
  at least one pop was stale                 313
  stale pops in total                        362
  scan probes against heap pops            58529    9782

The heap is not a different algorithm; it is the same settle-and-relax
loop with a faster way to find the minimum, and the answers agree every
time. What it changes is the shape of the cost. On the ring of 2,000 the
scan probes four million times to do what the heap does in a few
thousand pops. On the complete graph of 200 the scan probes 40,000 --
which is the same order as the 39,800 edges, so the heap buys nothing
and its log factor is a small loss.

The stale pops are the wrinkle. A node whose distance improves is pushed
again rather than moved, so a node can appear in the heap several times
and some pops are for distances that have already been beaten. On the
complete graph of 200 that is 198 stale pops out of 398 -- one repush for
almost every node. Skipping them on the way out costs one comparison and
is what makes the simple version correct; the alternative is a heap that
supports decrease-key, which is more code for the same answer.`,
          explanation:
            "The same algorithm with two different frontiers, counted on shapes where each one is right, plus the stale pops that lazy deletion produces.",
          alternates: [
            {
              lang: "javascript",
              code: `// Finding the closest unsettled node is the inner loop, and how it is found
// decides the complexity of the whole algorithm.
//
//   scan every node        O(V) per settle, so O(V^2) overall. Right when the
//                          graph is dense, because V^2 is already the edge count.
//   a binary heap          O(log V) per push and pop, so O((V + E) log V).
//                          Right when the graph is sparse, which is most graphs.
//
// The heap version has one wrinkle worth doing properly: a node's distance can
// improve after it is already in the heap, and a binary heap has no cheap way to
// move an entry. The standard answer is to push a second entry and ignore the
// stale one when it surfaces -- "lazy deletion" -- which is why the heap can hold
// more entries than there are nodes.

const INF = 1000000000;

function build(n, edges) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) neighbours[u].push([v, w]);
  return neighbours;
}

/** Find the closest unsettled node by looking at all of them. */
function dijkstraScanning(neighbours, start) {
  const n = neighbours.length;
  const best = new Array(n).fill(INF);
  const settled = new Array(n).fill(false);
  best[start] = 0;
  let probes = 0;
  for (let round = 0; round < n; round += 1) {
    let at = -1;
    for (let v = 0; v < n; v += 1) {
      probes += 1;
      if (!settled[v] && best[v] < INF && (at < 0 || best[v] < best[at])) at = v;
    }
    if (at < 0) break;
    settled[at] = true;
    for (const [u, w] of neighbours[at]) {
      if (best[at] + w < best[u]) best[u] = best[at] + w;
    }
  }
  return [best, probes];
}

function siftUp(heap, from) {
  let at = from;
  while (at > 0) {
    const up = Math.floor((at - 1) / 2);
    if (heap[up][0] <= heap[at][0]) break;
    const swap = heap[up];
    heap[up] = heap[at];
    heap[at] = swap;
    at = up;
  }
}

function siftDown(heap, from) {
  const size = heap.length;
  let at = from;
  for (;;) {
    let small = at;
    const left = 2 * at + 1;
    const right = 2 * at + 2;
    if (left < size && heap[left][0] < heap[small][0]) small = left;
    if (right < size && heap[right][0] < heap[small][0]) small = right;
    if (small === at) break;
    const swap = heap[small];
    heap[small] = heap[at];
    heap[at] = swap;
    at = small;
  }
}

function heapPush(heap, item) {
  heap.push(item);
  siftUp(heap, heap.length - 1);
}

function heapPop(heap) {
  const top = heap[0];
  const last = heap.pop();
  if (heap.length > 0) {
    heap[0] = last;
    siftDown(heap, 0);
  }
  return top;
}

/** The same algorithm, with the frontier in a binary heap. */
function dijkstraHeap(neighbours, start) {
  const n = neighbours.length;
  const best = new Array(n).fill(INF);
  const settled = new Array(n).fill(false);
  best[start] = 0;
  const heap = [];
  heapPush(heap, [0, start]);
  let pushes = 1;
  let stale = 0;
  let probes = 0;
  let biggest = 1;
  while (heap.length > 0) {
    probes += 1;
    const [cost, at] = heapPop(heap);
    if (settled[at]) {
      stale += 1;
      continue;
    }
    settled[at] = true;
    for (const [u, w] of neighbours[at]) {
      if (cost + w < best[u]) {
        best[u] = cost + w;
        heapPush(heap, [best[u], u]);
        pushes += 1;
        if (heap.length > biggest) biggest = heap.length;
      }
    }
  }
  return [best, probes, pushes, stale, biggest];
}

function same(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** Sparse: two edges per node, so the heap should win comfortably. */
function ring(n) {
  const edges = [];
  for (let v = 0; v < n; v += 1) {
    edges.push([v, (v + 1) % n, 1 + (v % 7)]);
    edges.push([(v + 1) % n, v, 1 + (v % 5)]);
  }
  return edges;
}

/** Every ordered pair. Here the scan is already asymptotically free. */
function dense(n) {
  const edges = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v) edges.push([u, v, 1 + ((u * 7 + v) % 9)]);
    }
  }
  return edges;
}

const padEnd = (v, w) => String(v).padEnd(w);
const pad = (v, w) => String(v).padStart(w);

const SHAPES = [
  ["ring of 400", 400, ring(400)],
  ["ring of 2000", 2000, ring(2000)],
  ["complete, 200", 200, dense(200)],
];

console.log(
  padEnd("shape", 16) +
    pad("nodes", 7) +
    pad("edges", 8) +
    pad("scan probes", 13) +
    pad("heap pops", 11) +
    pad("heap pushes", 13) +
    pad("stale pops", 12)
);
for (const [name, n, edges] of SHAPES) {
  const neighbours = build(n, edges);
  const [byScan, probes] = dijkstraScanning(neighbours, 0);
  const [byHeap, pops, pushes, stale] = dijkstraHeap(neighbours, 0);
  if (!same(byScan, byHeap)) console.log("MISMATCH");
  console.log(
    padEnd(name, 16) +
      pad(n, 7) +
      pad(edges.length, 8) +
      pad(probes, 13) +
      pad(pops, 11) +
      pad(pushes, 13) +
      pad(stale, 12)
  );
}
console.log();

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 1n;
function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const TRIALS = 3000;
let agreed = 0;
let anyStale = 0;
let totalStale = 0;
let totalProbes = 0;
let totalPops = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v && rand(3) === 0) edges.push([u, v, 1 + rand(9)]);
    }
  }
  const neighbours = build(n, edges);
  const [byScan, probes] = dijkstraScanning(neighbours, 0);
  const [byHeap, pops, , stale] = dijkstraHeap(neighbours, 0);
  if (same(byScan, byHeap)) agreed += 1;
  if (stale > 0) anyStale += 1;
  totalStale += stale;
  totalProbes += probes;
  totalPops += pops;
}

console.log(\`over \${TRIALS} random weighted graphs on up to 7 nodes:\`);
console.log(\`  the two frontiers gave the same answers \${pad(agreed, 6)}\`);
console.log(\`  at least one pop was stale              \${pad(anyStale, 6)}\`);
console.log(\`  stale pops in total                     \${pad(totalStale, 6)}\`);
console.log(\`  scan probes against heap pops           \${pad(totalProbes, 6)}\${pad(totalPops, 8)}\`);
console.log();
console.log("The heap is not a different algorithm; it is the same settle-and-relax");
console.log("loop with a faster way to find the minimum, and the answers agree every");
console.log("time. What it changes is the shape of the cost. On the ring of 2,000 the");
console.log("scan probes four million times to do what the heap does in a few");
console.log("thousand pops. On the complete graph of 200 the scan probes 40,000 --");
console.log("which is the same order as the 39,800 edges, so the heap buys nothing");
console.log("and its log factor is a small loss.");
console.log();
console.log("The stale pops are the wrinkle. A node whose distance improves is pushed");
console.log("again rather than moved, so a node can appear in the heap several times");
console.log("and some pops are for distances that have already been beaten. On the");
console.log("complete graph of 200 that is 198 stale pops out of 398 -- one repush for");
console.log("almost every node. Skipping them on the way out costs one comparison and");
console.log("is what makes the simple version correct; the alternative is a heap that");
console.log("supports decrease-key, which is more code for the same answer.");
`,
            },
            {
              lang: "typescript",
              code: `// Finding the closest unsettled node is the inner loop, and how it is found
// decides the complexity of the whole algorithm.
//
//   scan every node        O(V) per settle, so O(V^2) overall. Right when the
//                          graph is dense, because V^2 is already the edge count.
//   a binary heap          O(log V) per push and pop, so O((V + E) log V).
//                          Right when the graph is sparse, which is most graphs.
//
// The heap version has one wrinkle worth doing properly: a node's distance can
// improve after it is already in the heap, and a binary heap has no cheap way to
// move an entry. The standard answer is to push a second entry and ignore the
// stale one when it surfaces -- "lazy deletion" -- which is why the heap can hold
// more entries than there are nodes.

const INF = 1000000000;

type Weighted = [number, number, number];
type Link = [number, number];

function build(n: number, edges: Weighted[]): Link[][] {
  const neighbours: Link[][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) neighbours[u].push([v, w]);
  return neighbours;
}

/** Find the closest unsettled node by looking at all of them. */
function dijkstraScanning(neighbours: Link[][], start: number): [number[], number] {
  const n = neighbours.length;
  const best = new Array(n).fill(INF);
  const settled = new Array(n).fill(false);
  best[start] = 0;
  let probes = 0;
  for (let round = 0; round < n; round += 1) {
    let at = -1;
    for (let v = 0; v < n; v += 1) {
      probes += 1;
      if (!settled[v] && best[v] < INF && (at < 0 || best[v] < best[at])) at = v;
    }
    if (at < 0) break;
    settled[at] = true;
    for (const [u, w] of neighbours[at]) {
      if (best[at] + w < best[u]) best[u] = best[at] + w;
    }
  }
  return [best, probes];
}

function siftUp(heap: Link[], from: number): void {
  let at = from;
  while (at > 0) {
    const up = Math.floor((at - 1) / 2);
    if (heap[up][0] <= heap[at][0]) break;
    const swap = heap[up];
    heap[up] = heap[at];
    heap[at] = swap;
    at = up;
  }
}

function siftDown(heap: Link[], from: number): void {
  const size = heap.length;
  let at = from;
  for (;;) {
    let small = at;
    const left = 2 * at + 1;
    const right = 2 * at + 2;
    if (left < size && heap[left][0] < heap[small][0]) small = left;
    if (right < size && heap[right][0] < heap[small][0]) small = right;
    if (small === at) break;
    const swap = heap[small];
    heap[small] = heap[at];
    heap[at] = swap;
    at = small;
  }
}

function heapPush(heap: Link[], item: Link): void {
  heap.push(item);
  siftUp(heap, heap.length - 1);
}

function heapPop(heap: Link[]): Link {
  const top = heap[0];
  const last = heap.pop() as Link;
  if (heap.length > 0) {
    heap[0] = last;
    siftDown(heap, 0);
  }
  return top;
}

/** The same algorithm, with the frontier in a binary heap. */
function dijkstraHeap(
  neighbours: Link[][],
  start: number
): [number[], number, number, number, number] {
  const n = neighbours.length;
  const best = new Array(n).fill(INF);
  const settled = new Array(n).fill(false);
  best[start] = 0;
  const heap: Link[] = [];
  heapPush(heap, [0, start]);
  let pushes = 1;
  let stale = 0;
  let probes = 0;
  let biggest = 1;
  while (heap.length > 0) {
    probes += 1;
    const [cost, at] = heapPop(heap);
    if (settled[at]) {
      stale += 1;
      continue;
    }
    settled[at] = true;
    for (const [u, w] of neighbours[at]) {
      if (cost + w < best[u]) {
        best[u] = cost + w;
        heapPush(heap, [best[u], u]);
        pushes += 1;
        if (heap.length > biggest) biggest = heap.length;
      }
    }
  }
  return [best, probes, pushes, stale, biggest];
}

function same(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** Sparse: two edges per node, so the heap should win comfortably. */
function ring(n: number): Weighted[] {
  const edges: Weighted[] = [];
  for (let v = 0; v < n; v += 1) {
    edges.push([v, (v + 1) % n, 1 + (v % 7)]);
    edges.push([(v + 1) % n, v, 1 + (v % 5)]);
  }
  return edges;
}

/** Every ordered pair. Here the scan is already asymptotically free. */
function dense(n: number): Weighted[] {
  const edges: Weighted[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v) edges.push([u, v, 1 + ((u * 7 + v) % 9)]);
    }
  }
  return edges;
}

const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const pad = (v: string | number, w: number): string => String(v).padStart(w);

const SHAPES: [string, number, Weighted[]][] = [
  ["ring of 400", 400, ring(400)],
  ["ring of 2000", 2000, ring(2000)],
  ["complete, 200", 200, dense(200)],
];

console.log(
  padEnd("shape", 16) +
    pad("nodes", 7) +
    pad("edges", 8) +
    pad("scan probes", 13) +
    pad("heap pops", 11) +
    pad("heap pushes", 13) +
    pad("stale pops", 12)
);
for (const [name, n, edges] of SHAPES) {
  const neighbours = build(n, edges);
  const [byScan, probes] = dijkstraScanning(neighbours, 0);
  const [byHeap, pops, pushes, stale] = dijkstraHeap(neighbours, 0);
  if (!same(byScan, byHeap)) console.log("MISMATCH");
  console.log(
    padEnd(name, 16) +
      pad(n, 7) +
      pad(edges.length, 8) +
      pad(probes, 13) +
      pad(pops, 11) +
      pad(pushes, 13) +
      pad(stale, 12)
  );
}
console.log();

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 1n;
function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const TRIALS = 3000;
let agreed = 0;
let anyStale = 0;
let totalStale = 0;
let totalProbes = 0;
let totalPops = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges: Weighted[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v && rand(3) === 0) edges.push([u, v, 1 + rand(9)]);
    }
  }
  const neighbours = build(n, edges);
  const [byScan, probes] = dijkstraScanning(neighbours, 0);
  const [byHeap, pops, , stale] = dijkstraHeap(neighbours, 0);
  if (same(byScan, byHeap)) agreed += 1;
  if (stale > 0) anyStale += 1;
  totalStale += stale;
  totalProbes += probes;
  totalPops += pops;
}

console.log(\`over \${TRIALS} random weighted graphs on up to 7 nodes:\`);
console.log(\`  the two frontiers gave the same answers \${pad(agreed, 6)}\`);
console.log(\`  at least one pop was stale              \${pad(anyStale, 6)}\`);
console.log(\`  stale pops in total                     \${pad(totalStale, 6)}\`);
console.log(\`  scan probes against heap pops           \${pad(totalProbes, 6)}\${pad(totalPops, 8)}\`);
console.log();
console.log("The heap is not a different algorithm; it is the same settle-and-relax");
console.log("loop with a faster way to find the minimum, and the answers agree every");
console.log("time. What it changes is the shape of the cost. On the ring of 2,000 the");
console.log("scan probes four million times to do what the heap does in a few");
console.log("thousand pops. On the complete graph of 200 the scan probes 40,000 --");
console.log("which is the same order as the 39,800 edges, so the heap buys nothing");
console.log("and its log factor is a small loss.");
console.log();
console.log("The stale pops are the wrinkle. A node whose distance improves is pushed");
console.log("again rather than moved, so a node can appear in the heap several times");
console.log("and some pops are for distances that have already been beaten. On the");
console.log("complete graph of 200 that is 198 stale pops out of 398 -- one repush for");
console.log("almost every node. Skipping them on the way out costs one comparison and");
console.log("is what makes the simple version correct; the alternative is a heap that");
console.log("supports decrease-key, which is more code for the same answer.");
`,
            },
            {
              lang: "java",
              code: `// Finding the closest unsettled node is the inner loop, and how it is found
// decides the complexity of the whole algorithm.
//
//   scan every node        O(V) per settle, so O(V^2) overall. Right when the
//                          graph is dense, because V^2 is already the edge count.
//   a binary heap          O(log V) per push and pop, so O((V + E) log V).
//                          Right when the graph is sparse, which is most graphs.
//
// The heap version has one wrinkle worth doing properly: a node's distance can
// improve after it is already in the heap, and a binary heap has no cheap way to
// move an entry. The standard answer is to push a second entry and ignore the
// stale one when it surfaces -- "lazy deletion" -- which is why the heap can hold
// more entries than there are nodes.

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {

    static final int INF = 1000000000;

    static List<List<int[]>> build(int n, int[][] edges) {
        List<List<int[]>> neighbours = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            neighbours.add(new ArrayList<>());
        }
        for (int[] e : edges) {
            neighbours.get(e[0]).add(new int[] {e[1], e[2]});
        }
        return neighbours;
    }

    static int[] lastBest;
    static long lastProbes;

    /** Find the closest unsettled node by looking at all of them. */
    static void dijkstraScanning(List<List<int[]>> neighbours, int start) {
        int n = neighbours.size();
        int[] best = new int[n];
        Arrays.fill(best, INF);
        boolean[] settled = new boolean[n];
        best[start] = 0;
        long probes = 0;
        for (int round = 0; round < n; round++) {
            int at = -1;
            for (int v = 0; v < n; v++) {
                probes++;
                if (!settled[v] && best[v] < INF && (at < 0 || best[v] < best[at])) {
                    at = v;
                }
            }
            if (at < 0) {
                break;
            }
            settled[at] = true;
            for (int[] link : neighbours.get(at)) {
                if (best[at] + link[1] < best[link[0]]) {
                    best[link[0]] = best[at] + link[1];
                }
            }
        }
        lastBest = best;
        lastProbes = probes;
    }

    static void siftUp(List<int[]> heap, int from) {
        int at = from;
        while (at > 0) {
            int up = (at - 1) / 2;
            if (heap.get(up)[0] <= heap.get(at)[0]) {
                break;
            }
            int[] swap = heap.get(up);
            heap.set(up, heap.get(at));
            heap.set(at, swap);
            at = up;
        }
    }

    static void siftDown(List<int[]> heap, int from) {
        int size = heap.size();
        int at = from;
        while (true) {
            int small = at;
            int left = 2 * at + 1;
            int right = 2 * at + 2;
            if (left < size && heap.get(left)[0] < heap.get(small)[0]) {
                small = left;
            }
            if (right < size && heap.get(right)[0] < heap.get(small)[0]) {
                small = right;
            }
            if (small == at) {
                break;
            }
            int[] swap = heap.get(small);
            heap.set(small, heap.get(at));
            heap.set(at, swap);
            at = small;
        }
    }

    static void heapPush(List<int[]> heap, int[] item) {
        heap.add(item);
        siftUp(heap, heap.size() - 1);
    }

    static int[] heapPop(List<int[]> heap) {
        int[] top = heap.get(0);
        int[] last = heap.remove(heap.size() - 1);
        if (!heap.isEmpty()) {
            heap.set(0, last);
            siftDown(heap, 0);
        }
        return top;
    }

    static long lastPops;
    static long lastPushes;
    static long lastStale;

    /** The same algorithm, with the frontier in a binary heap. */
    static void dijkstraHeap(List<List<int[]>> neighbours, int start) {
        int n = neighbours.size();
        int[] best = new int[n];
        Arrays.fill(best, INF);
        boolean[] settled = new boolean[n];
        best[start] = 0;
        List<int[]> heap = new ArrayList<>();
        heapPush(heap, new int[] {0, start});
        long pushes = 1;
        long stale = 0;
        long probes = 0;
        while (!heap.isEmpty()) {
            probes++;
            int[] top = heapPop(heap);
            int cost = top[0];
            int at = top[1];
            if (settled[at]) {
                stale++;
                continue;
            }
            settled[at] = true;
            for (int[] link : neighbours.get(at)) {
                if (cost + link[1] < best[link[0]]) {
                    best[link[0]] = cost + link[1];
                    heapPush(heap, new int[] {best[link[0]], link[0]});
                    pushes++;
                }
            }
        }
        lastBest = best;
        lastPops = probes;
        lastPushes = pushes;
        lastStale = stale;
    }

    static boolean same(int[] a, int[] b) {
        if (a.length != b.length) {
            return false;
        }
        for (int i = 0; i < a.length; i++) {
            if (a[i] != b[i]) {
                return false;
            }
        }
        return true;
    }

    /** Sparse: two edges per node, so the heap should win comfortably. */
    static int[][] ring(int n) {
        int[][] edges = new int[2 * n][3];
        for (int v = 0; v < n; v++) {
            edges[2 * v] = new int[] {v, (v + 1) % n, 1 + v % 7};
            edges[2 * v + 1] = new int[] {(v + 1) % n, v, 1 + v % 5};
        }
        return edges;
    }

    /** Every ordered pair. Here the scan is already asymptotically free. */
    static int[][] dense(int n) {
        List<int[]> edges = new ArrayList<>();
        for (int u = 0; u < n; u++) {
            for (int v = 0; v < n; v++) {
                if (u != v) {
                    edges.add(new int[] {u, v, 1 + (u * 7 + v) % 9});
                }
            }
        }
        return edges.toArray(new int[0][]);
    }

    static String padEnd(String text, int width) {
        StringBuilder sb = new StringBuilder(text);
        while (sb.length() < width) {
            sb.append(' ');
        }
        return sb.toString();
    }

    static String pad(String text, int width) {
        StringBuilder sb = new StringBuilder();
        while (sb.length() + text.length() < width) {
            sb.append(' ');
        }
        return sb.append(text).toString();
    }

    // The same linear congruential generator in every language, so the random
    // graphs below are the same graphs whichever translation is run.
    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        String[] names = {"ring of 400", "ring of 2000", "complete, 200"};
        int[] counts = {400, 2000, 200};
        int[][][] shapes = {ring(400), ring(2000), dense(200)};

        System.out.println(padEnd("shape", 16) + pad("nodes", 7) + pad("edges", 8)
                + pad("scan probes", 13) + pad("heap pops", 11) + pad("heap pushes", 13)
                + pad("stale pops", 12));
        for (int c = 0; c < names.length; c++) {
            List<List<int[]>> neighbours = build(counts[c], shapes[c]);
            dijkstraScanning(neighbours, 0);
            int[] byScan = lastBest;
            long probes = lastProbes;
            dijkstraHeap(neighbours, 0);
            int[] byHeap = lastBest;
            if (!same(byScan, byHeap)) {
                System.out.println("MISMATCH");
            }
            System.out.println(padEnd(names[c], 16) + pad(String.valueOf(counts[c]), 7)
                    + pad(String.valueOf(shapes[c].length), 8) + pad(String.valueOf(probes), 13)
                    + pad(String.valueOf(lastPops), 11) + pad(String.valueOf(lastPushes), 13)
                    + pad(String.valueOf(lastStale), 12));
        }
        System.out.println();

        int trials = 3000;
        int agreed = 0;
        int anyStale = 0;
        long totalStale = 0;
        long totalProbes = 0;
        long totalPops = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(6);
            List<int[]> collected = new ArrayList<>();
            for (int u = 0; u < n; u++) {
                for (int v = 0; v < n; v++) {
                    if (u != v && rand(3) == 0) {
                        collected.add(new int[] {u, v, 1 + rand(9)});
                    }
                }
            }
            int[][] edges = collected.toArray(new int[0][]);
            List<List<int[]>> neighbours = build(n, edges);
            dijkstraScanning(neighbours, 0);
            int[] byScan = lastBest;
            long probes = lastProbes;
            dijkstraHeap(neighbours, 0);
            int[] byHeap = lastBest;
            if (same(byScan, byHeap)) {
                agreed++;
            }
            if (lastStale > 0) {
                anyStale++;
            }
            totalStale += lastStale;
            totalProbes += probes;
            totalPops += lastPops;
        }

        System.out.println("over " + trials + " random weighted graphs on up to 7 nodes:");
        System.out.println("  the two frontiers gave the same answers " + pad(String.valueOf(agreed), 6));
        System.out.println("  at least one pop was stale              " + pad(String.valueOf(anyStale), 6));
        System.out.println("  stale pops in total                     " + pad(String.valueOf(totalStale), 6));
        System.out.println("  scan probes against heap pops           " + pad(String.valueOf(totalProbes), 6)
                + pad(String.valueOf(totalPops), 8));
        System.out.println();
        System.out.println("The heap is not a different algorithm; it is the same settle-and-relax");
        System.out.println("loop with a faster way to find the minimum, and the answers agree every");
        System.out.println("time. What it changes is the shape of the cost. On the ring of 2,000 the");
        System.out.println("scan probes four million times to do what the heap does in a few");
        System.out.println("thousand pops. On the complete graph of 200 the scan probes 40,000 --");
        System.out.println("which is the same order as the 39,800 edges, so the heap buys nothing");
        System.out.println("and its log factor is a small loss.");
        System.out.println();
        System.out.println("The stale pops are the wrinkle. A node whose distance improves is pushed");
        System.out.println("again rather than moved, so a node can appear in the heap several times");
        System.out.println("and some pops are for distances that have already been beaten. On the");
        System.out.println("complete graph of 200 that is 198 stale pops out of 398 -- one repush for");
        System.out.println("almost every node. Skipping them on the way out costs one comparison and");
        System.out.println("is what makes the simple version correct; the alternative is a heap that");
        System.out.println("supports decrease-key, which is more code for the same answer.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Finding the closest unsettled node is the inner loop, and how it is found
// decides the complexity of the whole algorithm.
//
//   scan every node        O(V) per settle, so O(V^2) overall. Right when the
//                          graph is dense, because V^2 is already the edge count.
//   a binary heap          O(log V) per push and pop, so O((V + E) log V).
//                          Right when the graph is sparse, which is most graphs.
//
// The heap version has one wrinkle worth doing properly: a node's distance can
// improve after it is already in the heap, and a binary heap has no cheap way to
// move an entry. The standard answer is to push a second entry and ignore the
// stale one when it surfaces -- "lazy deletion" -- which is why the heap can hold
// more entries than there are nodes.

#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

const int INF = 1000000000;

struct Weighted {
    int from;
    int to;
    int cost;
};

using Link = std::pair<int, int>;

std::vector<std::vector<Link>> build(int n, const std::vector<Weighted>& edges) {
    std::vector<std::vector<Link>> neighbours(n);
    for (const Weighted& e : edges) {
        neighbours[e.from].push_back(Link(e.to, e.cost));
    }
    return neighbours;
}

// Find the closest unsettled node by looking at all of them.
long long dijkstra_scanning(const std::vector<std::vector<Link>>& neighbours, int start,
                            std::vector<int>& best) {
    int n = static_cast<int>(neighbours.size());
    best.assign(n, INF);
    std::vector<char> settled(n, 0);
    best[start] = 0;
    long long probes = 0;
    for (int round = 0; round < n; round++) {
        int at = -1;
        for (int v = 0; v < n; v++) {
            probes++;
            if (!settled[v] && best[v] < INF && (at < 0 || best[v] < best[at])) {
                at = v;
            }
        }
        if (at < 0) {
            break;
        }
        settled[at] = 1;
        for (const Link& l : neighbours[at]) {
            if (best[at] + l.second < best[l.first]) {
                best[l.first] = best[at] + l.second;
            }
        }
    }
    return probes;
}

void sift_up(std::vector<Link>& heap, int from) {
    int at = from;
    while (at > 0) {
        int up = (at - 1) / 2;
        if (heap[up].first <= heap[at].first) {
            break;
        }
        std::swap(heap[up], heap[at]);
        at = up;
    }
}

void sift_down(std::vector<Link>& heap, int from) {
    int size = static_cast<int>(heap.size());
    int at = from;
    while (true) {
        int small = at;
        int left = 2 * at + 1;
        int right = 2 * at + 2;
        if (left < size && heap[left].first < heap[small].first) {
            small = left;
        }
        if (right < size && heap[right].first < heap[small].first) {
            small = right;
        }
        if (small == at) {
            break;
        }
        std::swap(heap[small], heap[at]);
        at = small;
    }
}

void heap_push(std::vector<Link>& heap, Link item) {
    heap.push_back(item);
    sift_up(heap, static_cast<int>(heap.size()) - 1);
}

Link heap_pop(std::vector<Link>& heap) {
    Link top = heap[0];
    Link last = heap.back();
    heap.pop_back();
    if (!heap.empty()) {
        heap[0] = last;
        sift_down(heap, 0);
    }
    return top;
}

// The same algorithm, with the frontier in a binary heap.
void dijkstra_heap(const std::vector<std::vector<Link>>& neighbours, int start,
                   std::vector<int>& best, long long& pops, long long& pushes, long long& stale) {
    int n = static_cast<int>(neighbours.size());
    best.assign(n, INF);
    std::vector<char> settled(n, 0);
    best[start] = 0;
    std::vector<Link> heap;
    heap_push(heap, Link(0, start));
    pushes = 1;
    stale = 0;
    pops = 0;
    while (!heap.empty()) {
        pops++;
        Link top = heap_pop(heap);
        int cost = top.first;
        int at = top.second;
        if (settled[at]) {
            stale++;
            continue;
        }
        settled[at] = 1;
        for (const Link& l : neighbours[at]) {
            if (cost + l.second < best[l.first]) {
                best[l.first] = cost + l.second;
                heap_push(heap, Link(best[l.first], l.first));
                pushes++;
            }
        }
    }
}

bool same(const std::vector<int>& a, const std::vector<int>& b) {
    if (a.size() != b.size()) {
        return false;
    }
    for (size_t i = 0; i < a.size(); i++) {
        if (a[i] != b[i]) {
            return false;
        }
    }
    return true;
}

// Sparse: two edges per node, so the heap should win comfortably.
std::vector<Weighted> ring(int n) {
    std::vector<Weighted> edges;
    for (int v = 0; v < n; v++) {
        Weighted a;
        a.from = v;
        a.to = (v + 1) % n;
        a.cost = 1 + v % 7;
        edges.push_back(a);
        Weighted b;
        b.from = (v + 1) % n;
        b.to = v;
        b.cost = 1 + v % 5;
        edges.push_back(b);
    }
    return edges;
}

// Every ordered pair. Here the scan is already asymptotically free.
std::vector<Weighted> dense(int n) {
    std::vector<Weighted> edges;
    for (int u = 0; u < n; u++) {
        for (int v = 0; v < n; v++) {
            if (u != v) {
                Weighted e;
                e.from = u;
                e.to = v;
                e.cost = 1 + (u * 7 + v) % 9;
                edges.push_back(e);
            }
        }
    }
    return edges;
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
long long seed = 1;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    std::vector<std::string> names = {"ring of 400", "ring of 2000", "complete, 200"};
    std::vector<int> counts = {400, 2000, 200};
    std::vector<std::vector<Weighted>> shapes = {ring(400), ring(2000), dense(200)};

    std::cout << std::left << std::setw(16) << "shape" << std::right << std::setw(7) << "nodes"
              << std::setw(8) << "edges" << std::setw(13) << "scan probes"
              << std::setw(11) << "heap pops" << std::setw(13) << "heap pushes"
              << std::setw(12) << "stale pops" << "\\n";
    for (size_t c = 0; c < names.size(); c++) {
        std::vector<std::vector<Link>> neighbours = build(counts[c], shapes[c]);
        std::vector<int> by_scan;
        long long probes = dijkstra_scanning(neighbours, 0, by_scan);
        std::vector<int> by_heap;
        long long pops = 0;
        long long pushes = 0;
        long long stale = 0;
        dijkstra_heap(neighbours, 0, by_heap, pops, pushes, stale);
        if (!same(by_scan, by_heap)) {
            std::cout << "MISMATCH\\n";
        }
        std::cout << std::left << std::setw(16) << names[c] << std::right << std::setw(7) << counts[c]
                  << std::setw(8) << shapes[c].size() << std::setw(13) << probes
                  << std::setw(11) << pops << std::setw(13) << pushes
                  << std::setw(12) << stale << "\\n";
    }
    std::cout << "\\n";

    int trials = 3000;
    int agreed = 0;
    int any_stale = 0;
    long long total_stale = 0;
    long long total_probes = 0;
    long long total_pops = 0;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(6);
        std::vector<Weighted> edges;
        for (int u = 0; u < n; u++) {
            for (int v = 0; v < n; v++) {
                if (u != v && rand_below(3) == 0) {
                    Weighted e;
                    e.from = u;
                    e.to = v;
                    e.cost = 1 + rand_below(9);
                    edges.push_back(e);
                }
            }
        }
        std::vector<std::vector<Link>> neighbours = build(n, edges);
        std::vector<int> by_scan;
        long long probes = dijkstra_scanning(neighbours, 0, by_scan);
        std::vector<int> by_heap;
        long long pops = 0;
        long long pushes = 0;
        long long stale = 0;
        dijkstra_heap(neighbours, 0, by_heap, pops, pushes, stale);
        if (same(by_scan, by_heap)) {
            agreed++;
        }
        if (stale > 0) {
            any_stale++;
        }
        total_stale += stale;
        total_probes += probes;
        total_pops += pops;
    }

    std::cout << "over " << trials << " random weighted graphs on up to 7 nodes:\\n";
    std::cout << "  the two frontiers gave the same answers " << std::setw(6) << agreed << "\\n";
    std::cout << "  at least one pop was stale              " << std::setw(6) << any_stale << "\\n";
    std::cout << "  stale pops in total                     " << std::setw(6) << total_stale << "\\n";
    std::cout << "  scan probes against heap pops           " << std::setw(6) << total_probes
              << std::setw(8) << total_pops << "\\n";
    std::cout << "\\n";
    std::cout << "The heap is not a different algorithm; it is the same settle-and-relax\\n";
    std::cout << "loop with a faster way to find the minimum, and the answers agree every\\n";
    std::cout << "time. What it changes is the shape of the cost. On the ring of 2,000 the\\n";
    std::cout << "scan probes four million times to do what the heap does in a few\\n";
    std::cout << "thousand pops. On the complete graph of 200 the scan probes 40,000 --\\n";
    std::cout << "which is the same order as the 39,800 edges, so the heap buys nothing\\n";
    std::cout << "and its log factor is a small loss.\\n";
    std::cout << "\\n";
    std::cout << "The stale pops are the wrinkle. A node whose distance improves is pushed\\n";
    std::cout << "again rather than moved, so a node can appear in the heap several times\\n";
    std::cout << "and some pops are for distances that have already been beaten. On the\\n";
    std::cout << "complete graph of 200 that is 198 stale pops out of 398 -- one repush for\\n";
    std::cout << "almost every node. Skipping them on the way out costs one comparison and\\n";
    std::cout << "is what makes the simple version correct; the alternative is a heap that\\n";
    std::cout << "supports decrease-key, which is more code for the same answer.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Finding the closest unsettled node is the inner loop, and how it is found
// decides the complexity of the whole algorithm.
//
//   scan every node        O(V) per settle, so O(V^2) overall. Right when the
//                          graph is dense, because V^2 is already the edge count.
//   a binary heap          O(log V) per push and pop, so O((V + E) log V).
//                          Right when the graph is sparse, which is most graphs.
//
// The heap version has one wrinkle worth doing properly: a node's distance can
// improve after it is already in the heap, and a binary heap has no cheap way to
// move an entry. The standard answer is to push a second entry and ignore the
// stale one when it surfaces -- "lazy deletion" -- which is why the heap can hold
// more entries than there are nodes.

const INF: i64 = 1_000_000_000;

fn build(n: usize, edges: &[(usize, usize, i64)]) -> Vec<Vec<(usize, i64)>> {
    let mut neighbours = vec![Vec::new(); n];
    for &(u, v, w) in edges {
        neighbours[u].push((v, w));
    }
    neighbours
}

/// Find the closest unsettled node by looking at all of them.
fn dijkstra_scanning(neighbours: &[Vec<(usize, i64)>], start: usize) -> (Vec<i64>, i64) {
    let n = neighbours.len();
    let mut best = vec![INF; n];
    let mut settled = vec![false; n];
    best[start] = 0;
    let mut probes = 0i64;
    for _ in 0..n {
        let mut at: i32 = -1;
        for v in 0..n {
            probes += 1;
            if !settled[v] && best[v] < INF && (at < 0 || best[v] < best[at as usize]) {
                at = v as i32;
            }
        }
        if at < 0 {
            break;
        }
        let at = at as usize;
        settled[at] = true;
        for i in 0..neighbours[at].len() {
            let (u, w) = neighbours[at][i];
            if best[at] + w < best[u] {
                best[u] = best[at] + w;
            }
        }
    }
    (best, probes)
}

fn sift_up(heap: &mut Vec<(i64, usize)>, from: usize) {
    let mut at = from;
    while at > 0 {
        let up = (at - 1) / 2;
        if heap[up].0 <= heap[at].0 {
            break;
        }
        heap.swap(up, at);
        at = up;
    }
}

fn sift_down(heap: &mut Vec<(i64, usize)>, from: usize) {
    let size = heap.len();
    let mut at = from;
    loop {
        let mut small = at;
        let left = 2 * at + 1;
        let right = 2 * at + 2;
        if left < size && heap[left].0 < heap[small].0 {
            small = left;
        }
        if right < size && heap[right].0 < heap[small].0 {
            small = right;
        }
        if small == at {
            break;
        }
        heap.swap(small, at);
        at = small;
    }
}

fn heap_push(heap: &mut Vec<(i64, usize)>, item: (i64, usize)) {
    heap.push(item);
    let last = heap.len() - 1;
    sift_up(heap, last);
}

fn heap_pop(heap: &mut Vec<(i64, usize)>) -> (i64, usize) {
    let top = heap[0];
    let last = heap.pop().unwrap();
    if !heap.is_empty() {
        heap[0] = last;
        sift_down(heap, 0);
    }
    top
}

/// The same algorithm, with the frontier in a binary heap.
fn dijkstra_heap(neighbours: &[Vec<(usize, i64)>], start: usize) -> (Vec<i64>, i64, i64, i64) {
    let n = neighbours.len();
    let mut best = vec![INF; n];
    let mut settled = vec![false; n];
    best[start] = 0;
    let mut heap: Vec<(i64, usize)> = Vec::new();
    heap_push(&mut heap, (0, start));
    let mut pushes = 1i64;
    let mut stale = 0i64;
    let mut pops = 0i64;
    while !heap.is_empty() {
        pops += 1;
        let (cost, at) = heap_pop(&mut heap);
        if settled[at] {
            stale += 1;
            continue;
        }
        settled[at] = true;
        for i in 0..neighbours[at].len() {
            let (u, w) = neighbours[at][i];
            if cost + w < best[u] {
                best[u] = cost + w;
                heap_push(&mut heap, (best[u], u));
                pushes += 1;
            }
        }
    }
    (best, pops, pushes, stale)
}

fn same(a: &[i64], b: &[i64]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    for i in 0..a.len() {
        if a[i] != b[i] {
            return false;
        }
    }
    true
}

/// Sparse: two edges per node, so the heap should win comfortably.
fn ring(n: usize) -> Vec<(usize, usize, i64)> {
    let mut edges = Vec::new();
    for v in 0..n {
        edges.push((v, (v + 1) % n, 1 + (v % 7) as i64));
        edges.push(((v + 1) % n, v, 1 + (v % 5) as i64));
    }
    edges
}

/// Every ordered pair. Here the scan is already asymptotically free.
fn dense(n: usize) -> Vec<(usize, usize, i64)> {
    let mut edges = Vec::new();
    for u in 0..n {
        for v in 0..n {
            if u != v {
                edges.push((u, v, 1 + ((u * 7 + v) % 9) as i64));
            }
        }
    }
    edges
}

fn pad_right(text: &str, width: usize) -> String {
    let mut out = String::from(text);
    while out.chars().count() < width {
        out.push(' ');
    }
    out
}

fn pad_left(text: &str, width: usize) -> String {
    let mut out = String::new();
    while out.chars().count() + text.chars().count() < width {
        out.push(' ');
    }
    out.push_str(text);
    out
}

struct Rng {
    seed: i64,
}

impl Rng {
    // The same linear congruential generator in every language, so the random
    // graphs below are the same graphs whichever translation is run.
    fn next(&mut self, n: i64) -> i64 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        self.seed / 65536 % n
    }
}

fn main() {
    let names = ["ring of 400", "ring of 2000", "complete, 200"];
    let counts: Vec<usize> = vec![400, 2000, 200];
    let shapes: Vec<Vec<(usize, usize, i64)>> = vec![ring(400), ring(2000), dense(200)];

    println!(
        "{}{}{}{}{}{}{}",
        pad_right("shape", 16),
        pad_left("nodes", 7),
        pad_left("edges", 8),
        pad_left("scan probes", 13),
        pad_left("heap pops", 11),
        pad_left("heap pushes", 13),
        pad_left("stale pops", 12)
    );
    for (c, name) in names.iter().enumerate() {
        let neighbours = build(counts[c], &shapes[c]);
        let (by_scan, probes) = dijkstra_scanning(&neighbours, 0);
        let (by_heap, pops, pushes, stale) = dijkstra_heap(&neighbours, 0);
        if !same(&by_scan, &by_heap) {
            println!("MISMATCH");
        }
        println!(
            "{}{}{}{}{}{}{}",
            pad_right(name, 16),
            pad_left(&counts[c].to_string(), 7),
            pad_left(&shapes[c].len().to_string(), 8),
            pad_left(&probes.to_string(), 13),
            pad_left(&pops.to_string(), 11),
            pad_left(&pushes.to_string(), 13),
            pad_left(&stale.to_string(), 12)
        );
    }
    println!();

    let mut rng = Rng { seed: 1 };
    let trials = 3000;
    let mut agreed = 0;
    let mut any_stale = 0;
    let mut total_stale = 0i64;
    let mut total_probes = 0i64;
    let mut total_pops = 0i64;
    for _ in 0..trials {
        let n = (2 + rng.next(6)) as usize;
        let mut edges: Vec<(usize, usize, i64)> = Vec::new();
        for u in 0..n {
            for v in 0..n {
                if u != v && rng.next(3) == 0 {
                    let w = 1 + rng.next(9);
                    edges.push((u, v, w));
                }
            }
        }
        let neighbours = build(n, &edges);
        let (by_scan, probes) = dijkstra_scanning(&neighbours, 0);
        let (by_heap, pops, _, stale) = dijkstra_heap(&neighbours, 0);
        if same(&by_scan, &by_heap) {
            agreed += 1;
        }
        if stale > 0 {
            any_stale += 1;
        }
        total_stale += stale;
        total_probes += probes;
        total_pops += pops;
    }

    println!("over {} random weighted graphs on up to 7 nodes:", trials);
    println!("  the two frontiers gave the same answers {}", pad_left(&agreed.to_string(), 6));
    println!("  at least one pop was stale              {}", pad_left(&any_stale.to_string(), 6));
    println!("  stale pops in total                     {}", pad_left(&total_stale.to_string(), 6));
    println!(
        "  scan probes against heap pops           {}{}",
        pad_left(&total_probes.to_string(), 6),
        pad_left(&total_pops.to_string(), 8)
    );
    println!();
    println!("The heap is not a different algorithm; it is the same settle-and-relax");
    println!("loop with a faster way to find the minimum, and the answers agree every");
    println!("time. What it changes is the shape of the cost. On the ring of 2,000 the");
    println!("scan probes four million times to do what the heap does in a few");
    println!("thousand pops. On the complete graph of 200 the scan probes 40,000 --");
    println!("which is the same order as the 39,800 edges, so the heap buys nothing");
    println!("and its log factor is a small loss.");
    println!();
    println!("The stale pops are the wrinkle. A node whose distance improves is pushed");
    println!("again rather than moved, so a node can appear in the heap several times");
    println!("and some pops are for distances that have already been beaten. On the");
    println!("complete graph of 200 that is 198 stale pops out of 398 -- one repush for");
    println!("almost every node. Skipping them on the way out costs one comparison and");
    println!("is what makes the simple version correct; the alternative is a heap that");
    println!("supports decrease-key, which is more code for the same answer.");
}
`,
            },
            {
              lang: "go",
              code: `// Finding the closest unsettled node is the inner loop, and how it is found
// decides the complexity of the whole algorithm.
//
//   scan every node        O(V) per settle, so O(V^2) overall. Right when the
//                          graph is dense, because V^2 is already the edge count.
//   a binary heap          O(log V) per push and pop, so O((V + E) log V).
//                          Right when the graph is sparse, which is most graphs.
//
// The heap version has one wrinkle worth doing properly: a node's distance can
// improve after it is already in the heap, and a binary heap has no cheap way to
// move an entry. The standard answer is to push a second entry and ignore the
// stale one when it surfaces -- "lazy deletion" -- which is why the heap can hold
// more entries than there are nodes.

package main

import "fmt"

const inf = 1000000000

type weighted struct{ from, to, cost int }
type link struct{ to, cost int }
type entry struct{ cost, node int }

func build(n int, edges []weighted) [][]link {
	neighbours := make([][]link, n)
	for i := range neighbours {
		neighbours[i] = []link{}
	}
	for _, e := range edges {
		neighbours[e.from] = append(neighbours[e.from], link{e.to, e.cost})
	}
	return neighbours
}

// Find the closest unsettled node by looking at all of them.
func dijkstraScanning(neighbours [][]link, start int) ([]int, int64) {
	n := len(neighbours)
	best := make([]int, n)
	for i := range best {
		best[i] = inf
	}
	settled := make([]bool, n)
	best[start] = 0
	var probes int64
	for round := 0; round < n; round++ {
		at := -1
		for v := 0; v < n; v++ {
			probes++
			if !settled[v] && best[v] < inf && (at < 0 || best[v] < best[at]) {
				at = v
			}
		}
		if at < 0 {
			break
		}
		settled[at] = true
		for _, l := range neighbours[at] {
			if best[at]+l.cost < best[l.to] {
				best[l.to] = best[at] + l.cost
			}
		}
	}
	return best, probes
}

func siftUp(heap []entry, from int) {
	at := from
	for at > 0 {
		up := (at - 1) / 2
		if heap[up].cost <= heap[at].cost {
			break
		}
		heap[up], heap[at] = heap[at], heap[up]
		at = up
	}
}

func siftDown(heap []entry, from int) {
	size := len(heap)
	at := from
	for {
		small := at
		left := 2*at + 1
		right := 2*at + 2
		if left < size && heap[left].cost < heap[small].cost {
			small = left
		}
		if right < size && heap[right].cost < heap[small].cost {
			small = right
		}
		if small == at {
			break
		}
		heap[small], heap[at] = heap[at], heap[small]
		at = small
	}
}

func heapPush(heap []entry, item entry) []entry {
	heap = append(heap, item)
	siftUp(heap, len(heap)-1)
	return heap
}

func heapPop(heap []entry) (entry, []entry) {
	top := heap[0]
	last := heap[len(heap)-1]
	heap = heap[:len(heap)-1]
	if len(heap) > 0 {
		heap[0] = last
		siftDown(heap, 0)
	}
	return top, heap
}

// The same algorithm, with the frontier in a binary heap.
func dijkstraHeap(neighbours [][]link, start int) ([]int, int64, int64, int64) {
	n := len(neighbours)
	best := make([]int, n)
	for i := range best {
		best[i] = inf
	}
	settled := make([]bool, n)
	best[start] = 0
	heap := []entry{}
	heap = heapPush(heap, entry{0, start})
	var pushes int64 = 1
	var stale int64
	var probes int64
	for len(heap) > 0 {
		probes++
		var top entry
		top, heap = heapPop(heap)
		if settled[top.node] {
			stale++
			continue
		}
		settled[top.node] = true
		for _, l := range neighbours[top.node] {
			if top.cost+l.cost < best[l.to] {
				best[l.to] = top.cost + l.cost
				heap = heapPush(heap, entry{best[l.to], l.to})
				pushes++
			}
		}
	}
	return best, probes, pushes, stale
}

func same(a, b []int) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

// Sparse: two edges per node, so the heap should win comfortably.
func ring(n int) []weighted {
	edges := []weighted{}
	for v := 0; v < n; v++ {
		edges = append(edges, weighted{v, (v + 1) % n, 1 + v%7})
		edges = append(edges, weighted{(v + 1) % n, v, 1 + v%5})
	}
	return edges
}

// Every ordered pair. Here the scan is already asymptotically free.
func dense(n int) []weighted {
	edges := []weighted{}
	for u := 0; u < n; u++ {
		for v := 0; v < n; v++ {
			if u != v {
				edges = append(edges, weighted{u, v, 1 + (u*7+v)%9})
			}
		}
	}
	return edges
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	names := []string{"ring of 400", "ring of 2000", "complete, 200"}
	counts := []int{400, 2000, 200}
	shapes := [][]weighted{ring(400), ring(2000), dense(200)}

	fmt.Printf("%-16s%7s%8s%13s%11s%13s%12s\\n", "shape", "nodes", "edges",
		"scan probes", "heap pops", "heap pushes", "stale pops")
	for c, name := range names {
		neighbours := build(counts[c], shapes[c])
		byScan, probes := dijkstraScanning(neighbours, 0)
		byHeap, pops, pushes, stale := dijkstraHeap(neighbours, 0)
		if !same(byScan, byHeap) {
			fmt.Println("MISMATCH")
		}
		fmt.Printf("%-16s%7d%8d%13d%11d%13d%12d\\n", name, counts[c], len(shapes[c]),
			probes, pops, pushes, stale)
	}
	fmt.Println()

	trials := 3000
	agreed := 0
	anyStale := 0
	var totalStale int64
	var totalProbes int64
	var totalPops int64
	for t := 0; t < trials; t++ {
		n := 2 + rand(6)
		edges := []weighted{}
		for u := 0; u < n; u++ {
			for v := 0; v < n; v++ {
				if u != v && rand(3) == 0 {
					edges = append(edges, weighted{u, v, 1 + rand(9)})
				}
			}
		}
		neighbours := build(n, edges)
		byScan, probes := dijkstraScanning(neighbours, 0)
		byHeap, pops, _, stale := dijkstraHeap(neighbours, 0)
		if same(byScan, byHeap) {
			agreed++
		}
		if stale > 0 {
			anyStale++
		}
		totalStale += stale
		totalProbes += probes
		totalPops += pops
	}

	fmt.Printf("over %d random weighted graphs on up to 7 nodes:\\n", trials)
	fmt.Printf("  the two frontiers gave the same answers %6d\\n", agreed)
	fmt.Printf("  at least one pop was stale              %6d\\n", anyStale)
	fmt.Printf("  stale pops in total                     %6d\\n", totalStale)
	fmt.Printf("  scan probes against heap pops           %6d%8d\\n", totalProbes, totalPops)
	fmt.Println()
	fmt.Println("The heap is not a different algorithm; it is the same settle-and-relax")
	fmt.Println("loop with a faster way to find the minimum, and the answers agree every")
	fmt.Println("time. What it changes is the shape of the cost. On the ring of 2,000 the")
	fmt.Println("scan probes four million times to do what the heap does in a few")
	fmt.Println("thousand pops. On the complete graph of 200 the scan probes 40,000 --")
	fmt.Println("which is the same order as the 39,800 edges, so the heap buys nothing")
	fmt.Println("and its log factor is a small loss.")
	fmt.Println()
	fmt.Println("The stale pops are the wrinkle. A node whose distance improves is pushed")
	fmt.Println("again rather than moved, so a node can appear in the heap several times")
	fmt.Println("and some pops are for distances that have already been beaten. On the")
	fmt.Println("complete graph of 200 that is 198 stale pops out of 398 -- one repush for")
	fmt.Println("almost every node. Skipping them on the way out costs one comparison and")
	fmt.Println("is what makes the simple version correct; the alternative is a heap that")
	fmt.Println("supports decrease-key, which is more code for the same answer.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Using a heap on a dense graph",
          body: "On a complete graph of 200 nodes the plain scan probes 40,000 times against 39,800 edges -- the scan is already free at that density, and the heap's log factor is a small loss. The heap is for sparse graphs, which is most of them, but the check is arithmetic rather than habit.",
        },
        {
          title: "Trying to move an entry inside a binary heap",
          body: "There is no cheap way to find it. Push a second entry with the better distance and skip the stale one when it pops -- one comparison against the settled set. That is why the heap can hold more entries than there are nodes: 398 pushes for 200 nodes on the complete graph here.",
        },
      ],
    },
    {
      id: "dijkstra-in-four-lines",
      heading: "Dijkstra in four lines",
      body: [
        "Dijkstra in four lines.",
        "**It is one greedy step.** Settle the closest unsettled node, relax its edges, repeat. The settle is a claim of finality.",
        "**The claim is licensed by non-negative weights, and by nothing else.** Distances come off in ascending order, so nothing in progress can beat what is being settled.",
        "**A negative edge breaks it quietly.** The answer comes back too large, on 36 of 1,321 negative-weight graphs here \u2014 and lifting the weights to fix it changes which route is cheapest, so it does not fix it.",
        "**The frontier is a performance choice, not a correctness one.** Heap for sparse, scan for dense, and push duplicates rather than trying to move heap entries.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does Dijkstra need non-negative weights?",
      answer:
        "Because the algorithm settles a node -- declares its distance final and never revisits it -- and that is only sound if nothing still on the frontier can arrive cheaper later. With non-negative weights the settle order is ascending in distance, so anything still in progress already costs at least as much as the node being settled, and every extra edge only adds. A negative edge breaks exactly that: a route that currently looks longer can still get cheaper. The important practical point is that it fails quietly. It returns the cost of a real route, just not the cheapest -- I measured it wrong on 36 of 1,321 random graphs with a negative edge, always too high, never too low. So it is not the sort of bug a smoke test finds.",
    },
    {
      question: "Can you fix it by adding a constant to every weight?",
      answer:
        "No, and it is worth being able to say why rather than just no. The lift is charged once per edge, so a route with more hops is penalised more than a route with fewer, and the algorithm chooses a different route. Subtracting the lift back off at the end cannot undo a choice already made -- on my measurements that repair was right on only 2,155 of 2,294 graphs. Multiplying every weight by a positive constant is fine, because that scales all routes equally; adding does not. The correct approaches are Bellman-Ford, which makes no ordering claim at all, or Johnson's reweighting, which uses a per-node potential rather than a flat constant so that the adjustment telescopes along a route.",
    },
    {
      question: "How do you implement the priority queue, and what is the complexity?",
      answer:
        "A binary heap, and O((V + E) log V) overall. The detail worth getting right is that a node's distance can improve after it is already in the heap, and a binary heap cannot cheaply move an entry -- so you push a second entry and skip the stale one when it surfaces, checking it against the settled set. That means the heap can hold more entries than there are nodes; on a complete graph of 200 I measured 398 pushes and 198 stale pops. The alternative, a heap with decrease-key, is more code for the same answer. And on a dense graph I would not use a heap at all: scanning for the minimum is O(V^2), which is already the edge count, and on a complete graph of 200 that was 40,000 probes against 39,800 edges.",
    },
  ],
  takeaways: [
    "Dijkstra is one greedy step: settle the closest unsettled node, relax its edges, repeat.",
    "Settling is a claim of finality, licensed by non-negative weights and by nothing else.",
    "Distances came off in ascending order on 3,000 of 3,000 graphs, which is what makes the claim true.",
    "A negative edge does not crash it \u2014 it returns a route that is real but not cheapest, too high on 36 of 1,321 graphs.",
    "Re-opening settled nodes is correct and is no longer Dijkstra; it is the next lesson's algorithm.",
    "Adding a constant to every weight charges per edge, not per route: right on only 2,155 of 2,294 graphs.",
    "The frontier is a performance choice \u2014 the answers were identical on all 3,000 graphs.",
    "Heap for sparse: 2,000 pops against 4,000,000 scan probes on a ring of 2,000.",
    "Scan for dense: 40,000 probes against 39,800 edges on a complete graph of 200.",
    "Push duplicates instead of moving heap entries, and skip stale pops \u2014 198 of 398 pops on that dense graph.",
  ],
  status: "available",
};
