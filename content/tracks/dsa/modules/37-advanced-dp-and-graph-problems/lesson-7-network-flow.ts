import type { Lesson } from "@/content/types";

export const networkFlowLesson: Lesson = {
  id: "dsa-advanced-dp-and-graphs-network-flow",
  slug: "network-flow",
  moduleSlug: "advanced-dp-and-graph-problems",
  title: "Network Flow: Max-Flow, Min-Cut, and Bipartite Matching",
  summary:
    "Push flow along augmenting paths in a residual graph until none remain; the flow is then as large as the smallest cut. Measured on 500 small networks: the maximum flow equalled the smallest of all partition cuts every time, and breadth-first augmenting paths needed 20 where depth-first needed 71.",
  estimatedMinutes: 40,
  status: "available",
  objectives: [
    "Build a residual graph and explain why it needs reverse edges",
    "Compute maximum flow by augmenting paths and read the minimum cut from the result",
    "Compare breadth-first and depth-first augmenting path choices",
    "Reduce bipartite matching to flow",
  ],
  sections: [
    {
      id: "the-model",
      heading: "Flow, capacity and the residual graph",
      body: [
        "A flow network is a directed graph with a capacity on each edge, a source `s` and a sink `t`. A flow assigns each edge an amount no larger than its capacity, with everything entering a node other than `s` or `t` also leaving it. The question is the largest total that can leave `s`.",
        "The **residual graph** records what can still change. For an edge `u \u2192 v` with capacity `c` carrying flow `f`, it has a forward edge with remaining capacity `c - f` and a **reverse edge** `v \u2192 u` with capacity `f`.",
        "The reverse edge is what makes the method correct. Sending flow along a reverse edge cancels flow sent earlier, which lets a later path undo an early choice that turned out to block a better routing. Without reverse edges, the order paths are found in can leave the flow permanently below the maximum.",
        "The program stores each edge and its reverse as a pair at indices `e` and `e ^ 1`, so pushing flow is `cap[e] -= push` and `cap[e ^ 1] += push`.",
      ],
    },
    {
      id: "augmenting",
      heading: "Augmenting paths and the minimum cut",
      body: [
        "**Ford\u2013Fulkerson**: while the residual graph has a path from `s` to `t` along edges with positive capacity, push the smallest capacity on that path along it. When no path remains, the flow is maximum.",
        "A **cut** splits the nodes into a side containing `s` and a side containing `t`; its capacity is the total capacity of edges crossing from the `s` side to the `t` side. Every unit of flow must cross every cut, so no flow exceeds any cut. The **max-flow min-cut theorem** says the maximum flow equals the minimum cut exactly.",
        "The proof is also the way to find the cut. When augmentation stops, let `S` be the nodes reachable from `s` in the residual graph. Every edge from `S` to the rest is saturated, or its end would be reachable, so the flow equals the capacity of that cut.",
      ],
      examples: [
        {
          id: "max-flow-min-cut-and-matching",
          title: "Maximum flow against every cut, against the residual cut, as matching, and by path choice",
          lang: "python",
          code: `# Maximum flow by augmenting paths, checked three ways: against the smallest
# cut found by trying every partition, against the cut read off the final
# residual graph, and, for bipartite graphs, against a brute-force matching.
# Then the number of augmenting paths found by depth-first and by
# breadth-first search.

from collections import deque

work = [0]


class Network:
    def __init__(self, n):
        self.n = n
        self.head = [[] for _ in range(n)]   # edge indices leaving each node
        self.to = []
        self.cap = []

    def add_edge(self, u, v, c):
        # edge e and its reverse e ^ 1 are stored as a pair
        self.head[u].append(len(self.to))
        self.to.append(v)
        self.cap.append(c)
        self.head[v].append(len(self.to))
        self.to.append(u)
        self.cap.append(0)


def augment_bfs(g, s, t):
    # shortest augmenting path in edges (Edmonds-Karp)
    via = [-1] * g.n
    seen = [False] * g.n
    seen[s] = True
    queue = deque([s])
    while queue and not seen[t]:
        u = queue.popleft()
        for e in g.head[u]:
            work[0] += 1
            if g.cap[e] > 0 and not seen[g.to[e]]:
                seen[g.to[e]] = True
                via[g.to[e]] = e
                queue.append(g.to[e])
    if not seen[t]:
        return 0
    push = None
    v = t
    while v != s:
        e = via[v]
        push = g.cap[e] if push is None else min(push, g.cap[e])
        v = g.to[e ^ 1]
    v = t
    while v != s:
        e = via[v]
        g.cap[e] -= push
        g.cap[e ^ 1] += push
        v = g.to[e ^ 1]
    return push


def augment_dfs(g, s, t):
    # the first augmenting path a depth-first search happens to find
    via = [-1] * g.n
    seen = [False] * g.n
    seen[s] = True
    stack = [s]
    while stack and not seen[t]:
        u = stack.pop()
        for e in g.head[u]:
            work[0] += 1
            if g.cap[e] > 0 and not seen[g.to[e]]:
                seen[g.to[e]] = True
                via[g.to[e]] = e
                stack.append(g.to[e])
    if not seen[t]:
        return 0
    push = None
    v = t
    while v != s:
        e = via[v]
        push = g.cap[e] if push is None else min(push, g.cap[e])
        v = g.to[e ^ 1]
    v = t
    while v != s:
        e = via[v]
        g.cap[e] -= push
        g.cap[e ^ 1] += push
        v = g.to[e ^ 1]
    return push


def max_flow(g, s, t, augment):
    flow = 0
    paths = 0
    while True:
        pushed = augment(g, s, t)
        if pushed == 0:
            return flow, paths
        flow += pushed
        paths += 1


def residual_cut(g, s, original):
    # nodes still reachable from s; the edges leaving that set form a cut
    reach = [False] * g.n
    reach[s] = True
    stack = [s]
    while stack:
        u = stack.pop()
        for e in g.head[u]:
            if g.cap[e] > 0 and not reach[g.to[e]]:
                reach[g.to[e]] = True
                stack.append(g.to[e])
    total = 0
    for u, v, c in original:
        if reach[u] and not reach[v]:
            total += c
    return total


def brute_force_min_cut(n, edges, s, t):
    best = -1
    for mask in range(1 << n):
        if not (mask >> s) & 1 or (mask >> t) & 1:
            continue
        total = 0
        for u, v, c in edges:
            if (mask >> u) & 1 and not (mask >> v) & 1:
                total += c
        if best < 0 or total < best:
            best = total
    return best


def brute_force_matching(adjacency, left, used):
    # the largest matching using left vertices from \`left\` onward
    if left == len(adjacency):
        return 0
    best = brute_force_matching(adjacency, left + 1, used)
    for right in adjacency[left]:
        if not (used >> right) & 1:
            best = max(best, 1 + brute_force_matching(adjacency, left + 1, used | (1 << right)))
    return best


# The same linear congruential generator in every language, so the graphs
# below are the same graphs whichever translation is run.
seed = 58300037


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 500
flow_is_cut = 0
residual_is_cut = 0
for _ in range(TRIALS):
    n = 8
    edges = []
    for _ in range(14):
        u = rand(n)
        v = rand(n)
        if u != v:
            edges.append((u, v, 1 + rand(9)))
    g = Network(n)
    for u, v, c in edges:
        g.add_edge(u, v, c)
    flow, _ = max_flow(g, 0, n - 1, augment_bfs)
    if flow == brute_force_min_cut(n, edges, 0, n - 1):
        flow_is_cut += 1
    if flow == residual_cut(g, 0, edges):
        residual_is_cut += 1
print("%d random networks of 8 nodes and up to 14 edges" % TRIALS)
print("  maximum flow equal to the smallest cut over all 64 partitions  %d" % flow_is_cut)
print("  maximum flow equal to the cut read from the residual graph     %d" % residual_is_cut)
print()

matching_right = 0
for _ in range(TRIALS):
    side = 6
    adjacency = [[] for _ in range(side)]
    g = Network(2 * side + 2)
    source = 2 * side
    sink = 2 * side + 1
    for a in range(side):
        g.add_edge(source, a, 1)
        g.add_edge(side + a, sink, 1)
        for b in range(side):
            if rand(10) < 3:
                adjacency[a].append(b)
                g.add_edge(a, side + b, 1)
    flow, _ = max_flow(g, source, sink, augment_bfs)
    if flow == brute_force_matching(adjacency, 0, 0):
        matching_right += 1
print("%d random bipartite graphs, 6 + 6 vertices, unit capacities" % TRIALS)
print("  flow equal to the largest matching found by brute force  %d" % matching_right)
print()

print("augmenting paths needed on random networks of 60 nodes and 400 edges")
print()
print("  capacities up to   flow     paths: dfs   bfs     edge checks: dfs      bfs")
for top in [10, 1000, 100000]:
    edges = []
    for _ in range(400):
        u = rand(60)
        v = rand(60)
        if u != v:
            edges.append((u, v, 1 + rand(top)))
    results = []
    for augment in [augment_dfs, augment_bfs]:
        g = Network(60)
        for u, v, c in edges:
            g.add_edge(u, v, c)
        work[0] = 0
        flow, paths = max_flow(g, 0, 59, augment)
        results.append([flow, paths, work[0]])
    print("%18d %6d %13d %5d %20d %8d"
          % (top, results[1][0], results[0][1], results[1][1], results[0][2], results[1][2]))
`,
          output: `500 random networks of 8 nodes and up to 14 edges
  maximum flow equal to the smallest cut over all 64 partitions  500
  maximum flow equal to the cut read from the residual graph     500

500 random bipartite graphs, 6 + 6 vertices, unit capacities
  flow equal to the largest matching found by brute force  500

augmenting paths needed on random networks of 60 nodes and 400 edges

  capacities up to   flow     paths: dfs   bfs     edge checks: dfs      bfs
                10     12             6     5                 2522     2585
              1000   3524            64    21                16523     9775
            100000 100407            71    20                20544     9347`,
          explanation:
            "On 500 random 8-node networks the maximum flow equalled the smallest cut found by trying all 64 partitions that separate source from sink, and equalled the cut read from the final residual graph, 500 times each. On 500 random bipartite graphs the flow equalled a brute-force maximum matching every time. The last table compares path choice on 60-node networks. With capacities up to 10 the two searches needed 6 and 5 paths. With capacities up to 100,000, depth-first needed 71 paths and 20,544 edge checks; breadth-first needed 20 paths and 9,347.",
          alternates: [
            {
              lang: "javascript",
              code: `// Maximum flow by augmenting paths, checked three ways: against the smallest
// cut found by trying every partition, against the cut read off the final
// residual graph, and, for bipartite graphs, against a brute-force matching.
// Then the number of augmenting paths found by depth-first and by
// breadth-first search.

let work = 0;

class Network {
  constructor(n) {
    this.n = n;
    this.head = []; // edge indices leaving each node
    for (let i = 0; i < n; i++) this.head.push([]);
    this.to = [];
    this.cap = [];
  }

  addEdge(u, v, c) {
    // edge e and its reverse e ^ 1 are stored as a pair
    this.head[u].push(this.to.length);
    this.to.push(v);
    this.cap.push(c);
    this.head[v].push(this.to.length);
    this.to.push(u);
    this.cap.push(0);
  }
}

function pushAlong(g, s, t, via) {
  let push = -1;
  let v = t;
  while (v !== s) {
    const e = via[v];
    push = push < 0 ? g.cap[e] : Math.min(push, g.cap[e]);
    v = g.to[e ^ 1];
  }
  v = t;
  while (v !== s) {
    const e = via[v];
    g.cap[e] -= push;
    g.cap[e ^ 1] += push;
    v = g.to[e ^ 1];
  }
  return push;
}

function augmentBfs(g, s, t) {
  // shortest augmenting path in edges (Edmonds-Karp)
  const via = new Array(g.n).fill(-1);
  const seen = new Array(g.n).fill(false);
  seen[s] = true;
  const queue = [s];
  let head = 0;
  while (head < queue.length && !seen[t]) {
    const u = queue[head];
    head += 1;
    for (const e of g.head[u]) {
      work += 1;
      if (g.cap[e] > 0 && !seen[g.to[e]]) {
        seen[g.to[e]] = true;
        via[g.to[e]] = e;
        queue.push(g.to[e]);
      }
    }
  }
  if (!seen[t]) return 0;
  return pushAlong(g, s, t, via);
}

function augmentDfs(g, s, t) {
  // the first augmenting path a depth-first search happens to find
  const via = new Array(g.n).fill(-1);
  const seen = new Array(g.n).fill(false);
  seen[s] = true;
  const stack = [s];
  while (stack.length > 0 && !seen[t]) {
    const u = stack.pop();
    for (const e of g.head[u]) {
      work += 1;
      if (g.cap[e] > 0 && !seen[g.to[e]]) {
        seen[g.to[e]] = true;
        via[g.to[e]] = e;
        stack.push(g.to[e]);
      }
    }
  }
  if (!seen[t]) return 0;
  return pushAlong(g, s, t, via);
}

function maxFlow(g, s, t, augment) {
  let flow = 0;
  let paths = 0;
  for (;;) {
    const pushed = augment(g, s, t);
    if (pushed === 0) return [flow, paths];
    flow += pushed;
    paths += 1;
  }
}

function residualCut(g, s, original) {
  // nodes still reachable from s; the edges leaving that set form a cut
  const reach = new Array(g.n).fill(false);
  reach[s] = true;
  const stack = [s];
  while (stack.length > 0) {
    const u = stack.pop();
    for (const e of g.head[u]) {
      if (g.cap[e] > 0 && !reach[g.to[e]]) {
        reach[g.to[e]] = true;
        stack.push(g.to[e]);
      }
    }
  }
  let total = 0;
  for (const [u, v, c] of original) {
    if (reach[u] && !reach[v]) total += c;
  }
  return total;
}

function bruteForceMinCut(n, edges, s, t) {
  let best = -1;
  for (let mask = 0; mask < 1 << n; mask++) {
    if (((mask >> s) & 1) === 0 || ((mask >> t) & 1) === 1) continue;
    let total = 0;
    for (const [u, v, c] of edges) {
      if (((mask >> u) & 1) === 1 && ((mask >> v) & 1) === 0) total += c;
    }
    if (best < 0 || total < best) best = total;
  }
  return best;
}

function bruteForceMatching(adjacency, left, used) {
  // the largest matching using left vertices from \`left\` onward
  if (left === adjacency.length) return 0;
  let best = bruteForceMatching(adjacency, left + 1, used);
  for (const right of adjacency[left]) {
    if (((used >> right) & 1) === 0) {
      best = Math.max(best, 1 + bruteForceMatching(adjacency, left + 1, used | (1 << right)));
    }
  }
  return best;
}

// The same linear congruential generator in every language, so the graphs
// below are the same graphs whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 58300037n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function padLeft(s, width) {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

const TRIALS = 500;
let flowIsCut = 0;
let residualIsCut = 0;
for (let trial = 0; trial < TRIALS; trial++) {
  const n = 8;
  const edges = [];
  for (let i = 0; i < 14; i++) {
    const u = rand(n);
    const v = rand(n);
    if (u !== v) edges.push([u, v, 1 + rand(9)]);
  }
  const g = new Network(n);
  for (const [u, v, c] of edges) g.addEdge(u, v, c);
  const [flow] = maxFlow(g, 0, n - 1, augmentBfs);
  if (flow === bruteForceMinCut(n, edges, 0, n - 1)) flowIsCut += 1;
  if (flow === residualCut(g, 0, edges)) residualIsCut += 1;
}
console.log(TRIALS + " random networks of 8 nodes and up to 14 edges");
console.log("  maximum flow equal to the smallest cut over all 64 partitions  " + flowIsCut);
console.log("  maximum flow equal to the cut read from the residual graph     " + residualIsCut);
console.log();

let matchingRight = 0;
for (let trial = 0; trial < TRIALS; trial++) {
  const side = 6;
  const adjacency = [];
  for (let a = 0; a < side; a++) adjacency.push([]);
  const g = new Network(2 * side + 2);
  const source = 2 * side;
  const sink = 2 * side + 1;
  for (let a = 0; a < side; a++) {
    g.addEdge(source, a, 1);
    g.addEdge(side + a, sink, 1);
    for (let b = 0; b < side; b++) {
      if (rand(10) < 3) {
        adjacency[a].push(b);
        g.addEdge(a, side + b, 1);
      }
    }
  }
  const [flow] = maxFlow(g, source, sink, augmentBfs);
  if (flow === bruteForceMatching(adjacency, 0, 0)) matchingRight += 1;
}
console.log(TRIALS + " random bipartite graphs, 6 + 6 vertices, unit capacities");
console.log("  flow equal to the largest matching found by brute force  " + matchingRight);
console.log();

console.log("augmenting paths needed on random networks of 60 nodes and 400 edges");
console.log();
console.log("  capacities up to   flow     paths: dfs   bfs     edge checks: dfs      bfs");
for (const top of [10, 1000, 100000]) {
  const edges = [];
  for (let i = 0; i < 400; i++) {
    const u = rand(60);
    const v = rand(60);
    if (u !== v) edges.push([u, v, 1 + rand(top)]);
  }
  const results = [];
  for (const augment of [augmentDfs, augmentBfs]) {
    const g = new Network(60);
    for (const [u, v, c] of edges) g.addEdge(u, v, c);
    work = 0;
    const [flow, paths] = maxFlow(g, 0, 59, augment);
    results.push([flow, paths, work]);
  }
  console.log(
    padLeft(top, 18) + " " + padLeft(results[1][0], 6) + " " + padLeft(results[0][1], 13) + " " +
      padLeft(results[1][1], 5) + " " + padLeft(results[0][2], 20) + " " + padLeft(results[1][2], 8),
  );
}
`,
            },
            {
              lang: "typescript",
              code: `// Maximum flow by augmenting paths, checked three ways: against the smallest
// cut found by trying every partition, against the cut read off the final
// residual graph, and, for bipartite graphs, against a brute-force matching.
// Then the number of augmenting paths found by depth-first and by
// breadth-first search.

type Edge = [number, number, number];
type Augment = (g: Network, s: number, t: number) => number;

let work = 0;

class Network {
  n: number;
  head: number[][];
  to: number[];
  cap: number[];

  constructor(n: number) {
    this.n = n;
    this.head = []; // edge indices leaving each node
    for (let i = 0; i < n; i++) this.head.push([]);
    this.to = [];
    this.cap = [];
  }

  addEdge(u: number, v: number, c: number): void {
    // edge e and its reverse e ^ 1 are stored as a pair
    this.head[u].push(this.to.length);
    this.to.push(v);
    this.cap.push(c);
    this.head[v].push(this.to.length);
    this.to.push(u);
    this.cap.push(0);
  }
}

function pushAlong(g: Network, s: number, t: number, via: number[]): number {
  let push = -1;
  let v = t;
  while (v !== s) {
    const e = via[v];
    push = push < 0 ? g.cap[e] : Math.min(push, g.cap[e]);
    v = g.to[e ^ 1];
  }
  v = t;
  while (v !== s) {
    const e = via[v];
    g.cap[e] -= push;
    g.cap[e ^ 1] += push;
    v = g.to[e ^ 1];
  }
  return push;
}

function augmentBfs(g: Network, s: number, t: number): number {
  // shortest augmenting path in edges (Edmonds-Karp)
  const via = new Array(g.n).fill(-1);
  const seen = new Array(g.n).fill(false);
  seen[s] = true;
  const queue = [s];
  let head = 0;
  while (head < queue.length && !seen[t]) {
    const u = queue[head];
    head += 1;
    for (const e of g.head[u]) {
      work += 1;
      if (g.cap[e] > 0 && !seen[g.to[e]]) {
        seen[g.to[e]] = true;
        via[g.to[e]] = e;
        queue.push(g.to[e]);
      }
    }
  }
  if (!seen[t]) return 0;
  return pushAlong(g, s, t, via);
}

function augmentDfs(g: Network, s: number, t: number): number {
  // the first augmenting path a depth-first search happens to find
  const via = new Array(g.n).fill(-1);
  const seen = new Array(g.n).fill(false);
  seen[s] = true;
  const stack = [s];
  while (stack.length > 0 && !seen[t]) {
    const u = stack.pop()!;
    for (const e of g.head[u]) {
      work += 1;
      if (g.cap[e] > 0 && !seen[g.to[e]]) {
        seen[g.to[e]] = true;
        via[g.to[e]] = e;
        stack.push(g.to[e]);
      }
    }
  }
  if (!seen[t]) return 0;
  return pushAlong(g, s, t, via);
}

function maxFlow(g: Network, s: number, t: number, augment: Augment): [number, number] {
  let flow = 0;
  let paths = 0;
  for (;;) {
    const pushed = augment(g, s, t);
    if (pushed === 0) return [flow, paths];
    flow += pushed;
    paths += 1;
  }
}

function residualCut(g: Network, s: number, original: Edge[]): number {
  // nodes still reachable from s; the edges leaving that set form a cut
  const reach = new Array(g.n).fill(false);
  reach[s] = true;
  const stack = [s];
  while (stack.length > 0) {
    const u = stack.pop()!;
    for (const e of g.head[u]) {
      if (g.cap[e] > 0 && !reach[g.to[e]]) {
        reach[g.to[e]] = true;
        stack.push(g.to[e]);
      }
    }
  }
  let total = 0;
  for (const [u, v, c] of original) {
    if (reach[u] && !reach[v]) total += c;
  }
  return total;
}

function bruteForceMinCut(n: number, edges: Edge[], s: number, t: number): number {
  let best = -1;
  for (let mask = 0; mask < 1 << n; mask++) {
    if (((mask >> s) & 1) === 0 || ((mask >> t) & 1) === 1) continue;
    let total = 0;
    for (const [u, v, c] of edges) {
      if (((mask >> u) & 1) === 1 && ((mask >> v) & 1) === 0) total += c;
    }
    if (best < 0 || total < best) best = total;
  }
  return best;
}

function bruteForceMatching(adjacency: number[][], left: number, used: number): number {
  // the largest matching using left vertices from \`left\` onward
  if (left === adjacency.length) return 0;
  let best = bruteForceMatching(adjacency, left + 1, used);
  for (const right of adjacency[left]) {
    if (((used >> right) & 1) === 0) {
      best = Math.max(best, 1 + bruteForceMatching(adjacency, left + 1, used | (1 << right)));
    }
  }
  return best;
}

// The same linear congruential generator in every language, so the graphs
// below are the same graphs whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 58300037n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function padLeft(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

const TRIALS = 500;
let flowIsCut = 0;
let residualIsCut = 0;
for (let trial = 0; trial < TRIALS; trial++) {
  const n = 8;
  const edges: Edge[] = [];
  for (let i = 0; i < 14; i++) {
    const u = rand(n);
    const v = rand(n);
    if (u !== v) edges.push([u, v, 1 + rand(9)]);
  }
  const g = new Network(n);
  for (const [u, v, c] of edges) g.addEdge(u, v, c);
  const [flow] = maxFlow(g, 0, n - 1, augmentBfs);
  if (flow === bruteForceMinCut(n, edges, 0, n - 1)) flowIsCut += 1;
  if (flow === residualCut(g, 0, edges)) residualIsCut += 1;
}
console.log(TRIALS + " random networks of 8 nodes and up to 14 edges");
console.log("  maximum flow equal to the smallest cut over all 64 partitions  " + flowIsCut);
console.log("  maximum flow equal to the cut read from the residual graph     " + residualIsCut);
console.log();

let matchingRight = 0;
for (let trial = 0; trial < TRIALS; trial++) {
  const side = 6;
  const adjacency: number[][] = [];
  for (let a = 0; a < side; a++) adjacency.push([]);
  const g = new Network(2 * side + 2);
  const source = 2 * side;
  const sink = 2 * side + 1;
  for (let a = 0; a < side; a++) {
    g.addEdge(source, a, 1);
    g.addEdge(side + a, sink, 1);
    for (let b = 0; b < side; b++) {
      if (rand(10) < 3) {
        adjacency[a].push(b);
        g.addEdge(a, side + b, 1);
      }
    }
  }
  const [flow] = maxFlow(g, source, sink, augmentBfs);
  if (flow === bruteForceMatching(adjacency, 0, 0)) matchingRight += 1;
}
console.log(TRIALS + " random bipartite graphs, 6 + 6 vertices, unit capacities");
console.log("  flow equal to the largest matching found by brute force  " + matchingRight);
console.log();

console.log("augmenting paths needed on random networks of 60 nodes and 400 edges");
console.log();
console.log("  capacities up to   flow     paths: dfs   bfs     edge checks: dfs      bfs");
for (const top of [10, 1000, 100000]) {
  const edges: Edge[] = [];
  for (let i = 0; i < 400; i++) {
    const u = rand(60);
    const v = rand(60);
    if (u !== v) edges.push([u, v, 1 + rand(top)]);
  }
  const results: number[][] = [];
  for (const augment of [augmentDfs, augmentBfs]) {
    const g = new Network(60);
    for (const [u, v, c] of edges) g.addEdge(u, v, c);
    work = 0;
    const [flow, paths] = maxFlow(g, 0, 59, augment);
    results.push([flow, paths, work]);
  }
  console.log(
    padLeft(top, 18) + " " + padLeft(results[1][0], 6) + " " + padLeft(results[0][1], 13) + " " +
      padLeft(results[1][1], 5) + " " + padLeft(results[0][2], 20) + " " + padLeft(results[1][2], 8),
  );
}
`,
            },
            {
              lang: "java",
              code: `// Maximum flow by augmenting paths, checked three ways: against the smallest
// cut found by trying every partition, against the cut read off the final
// residual graph, and, for bipartite graphs, against a brute-force matching.
// Then the number of augmenting paths found by depth-first and by
// breadth-first search.

import java.util.ArrayList;
import java.util.List;

public class Main {
  static long work = 0;

  static class Network {
    int n;
    List<List<Integer>> head = new ArrayList<>(); // edge indices leaving each node
    List<Integer> to = new ArrayList<>();
    List<Long> cap = new ArrayList<>();

    Network(int n) {
      this.n = n;
      for (int i = 0; i < n; i++) {
        head.add(new ArrayList<>());
      }
    }

    void addEdge(int u, int v, long c) {
      // edge e and its reverse e ^ 1 are stored as a pair
      head.get(u).add(to.size());
      to.add(v);
      cap.add(c);
      head.get(v).add(to.size());
      to.add(u);
      cap.add(0L);
    }
  }

  static long pushAlong(Network g, int s, int t, int[] via) {
    long push = -1;
    int v = t;
    while (v != s) {
      int e = via[v];
      push = push < 0 ? g.cap.get(e) : Math.min(push, g.cap.get(e));
      v = g.to.get(e ^ 1);
    }
    v = t;
    while (v != s) {
      int e = via[v];
      g.cap.set(e, g.cap.get(e) - push);
      g.cap.set(e ^ 1, g.cap.get(e ^ 1) + push);
      v = g.to.get(e ^ 1);
    }
    return push;
  }

  static long augment(Network g, int s, int t, boolean breadthFirst) {
    // breadth-first gives the shortest augmenting path (Edmonds-Karp);
    // depth-first gives whichever path it happens to find first
    int[] via = new int[g.n];
    boolean[] seen = new boolean[g.n];
    seen[s] = true;
    java.util.ArrayDeque<Integer> frontier = new java.util.ArrayDeque<>();
    frontier.add(s);
    while (!frontier.isEmpty() && !seen[t]) {
      int u = breadthFirst ? frontier.pollFirst() : frontier.pollLast();
      for (int e : g.head.get(u)) {
        work += 1;
        int v = g.to.get(e);
        if (g.cap.get(e) > 0 && !seen[v]) {
          seen[v] = true;
          via[v] = e;
          frontier.addLast(v);
        }
      }
    }
    if (!seen[t]) {
      return 0;
    }
    return pushAlong(g, s, t, via);
  }

  static long[] maxFlow(Network g, int s, int t, boolean breadthFirst) {
    long flow = 0;
    long paths = 0;
    while (true) {
      long pushed = augment(g, s, t, breadthFirst);
      if (pushed == 0) {
        return new long[] {flow, paths};
      }
      flow += pushed;
      paths += 1;
    }
  }

  static long residualCut(Network g, int s, List<long[]> original) {
    // nodes still reachable from s; the edges leaving that set form a cut
    boolean[] reach = new boolean[g.n];
    reach[s] = true;
    List<Integer> stack = new ArrayList<>();
    stack.add(s);
    while (!stack.isEmpty()) {
      int u = stack.remove(stack.size() - 1);
      for (int e : g.head.get(u)) {
        int v = g.to.get(e);
        if (g.cap.get(e) > 0 && !reach[v]) {
          reach[v] = true;
          stack.add(v);
        }
      }
    }
    long total = 0;
    for (long[] edge : original) {
      if (reach[(int) edge[0]] && !reach[(int) edge[1]]) {
        total += edge[2];
      }
    }
    return total;
  }

  static long bruteForceMinCut(int n, List<long[]> edges, int s, int t) {
    long best = -1;
    for (int mask = 0; mask < (1 << n); mask++) {
      if (((mask >> s) & 1) == 0 || ((mask >> t) & 1) == 1) {
        continue;
      }
      long total = 0;
      for (long[] edge : edges) {
        if (((mask >> edge[0]) & 1) == 1 && ((mask >> edge[1]) & 1) == 0) {
          total += edge[2];
        }
      }
      if (best < 0 || total < best) {
        best = total;
      }
    }
    return best;
  }

  static int bruteForceMatching(List<List<Integer>> adjacency, int left, int used) {
    // the largest matching using left vertices from \`left\` onward
    if (left == adjacency.size()) {
      return 0;
    }
    int best = bruteForceMatching(adjacency, left + 1, used);
    for (int right : adjacency.get(left)) {
      if (((used >> right) & 1) == 0) {
        best = Math.max(best, 1 + bruteForceMatching(adjacency, left + 1, used | (1 << right)));
      }
    }
    return best;
  }

  // The same linear congruential generator in every language, so the graphs
  // below are the same graphs whichever translation is run.
  static long seed = 58300037L;

  static int rand(int n) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return (int) (seed / 65536L % n);
  }

  public static void main(String[] args) {
    final int trials = 500;
    int flowIsCut = 0;
    int residualIsCut = 0;
    for (int trial = 0; trial < trials; trial++) {
      final int n = 8;
      List<long[]> edges = new ArrayList<>();
      for (int i = 0; i < 14; i++) {
        int u = rand(n);
        int v = rand(n);
        if (u != v) {
          edges.add(new long[] {u, v, 1 + rand(9)});
        }
      }
      Network g = new Network(n);
      for (long[] edge : edges) {
        g.addEdge((int) edge[0], (int) edge[1], edge[2]);
      }
      long flow = maxFlow(g, 0, n - 1, true)[0];
      if (flow == bruteForceMinCut(n, edges, 0, n - 1)) {
        flowIsCut += 1;
      }
      if (flow == residualCut(g, 0, edges)) {
        residualIsCut += 1;
      }
    }
    System.out.printf("%d random networks of 8 nodes and up to 14 edges%n", trials);
    System.out.println("  maximum flow equal to the smallest cut over all 64 partitions  " + flowIsCut);
    System.out.println("  maximum flow equal to the cut read from the residual graph     " + residualIsCut);
    System.out.println();

    int matchingRight = 0;
    for (int trial = 0; trial < trials; trial++) {
      final int side = 6;
      List<List<Integer>> adjacency = new ArrayList<>();
      for (int a = 0; a < side; a++) {
        adjacency.add(new ArrayList<>());
      }
      Network g = new Network(2 * side + 2);
      int source = 2 * side;
      int sink = 2 * side + 1;
      for (int a = 0; a < side; a++) {
        g.addEdge(source, a, 1);
        g.addEdge(side + a, sink, 1);
        for (int b = 0; b < side; b++) {
          if (rand(10) < 3) {
            adjacency.get(a).add(b);
            g.addEdge(a, side + b, 1);
          }
        }
      }
      long flow = maxFlow(g, source, sink, true)[0];
      if (flow == bruteForceMatching(adjacency, 0, 0)) {
        matchingRight += 1;
      }
    }
    System.out.printf("%d random bipartite graphs, 6 + 6 vertices, unit capacities%n", trials);
    System.out.println("  flow equal to the largest matching found by brute force  " + matchingRight);
    System.out.println();

    System.out.println("augmenting paths needed on random networks of 60 nodes and 400 edges");
    System.out.println();
    System.out.println("  capacities up to   flow     paths: dfs   bfs     edge checks: dfs      bfs");
    int[] tops = {10, 1000, 100000};
    for (int top : tops) {
      List<long[]> edges = new ArrayList<>();
      for (int i = 0; i < 400; i++) {
        int u = rand(60);
        int v = rand(60);
        if (u != v) {
          edges.add(new long[] {u, v, 1 + rand(top)});
        }
      }
      long[][] results = new long[2][];
      boolean[] modes = {false, true};
      for (int m = 0; m < 2; m++) {
        Network g = new Network(60);
        for (long[] edge : edges) {
          g.addEdge((int) edge[0], (int) edge[1], edge[2]);
        }
        work = 0;
        long[] flowAndPaths = maxFlow(g, 0, 59, modes[m]);
        results[m] = new long[] {flowAndPaths[0], flowAndPaths[1], work};
      }
      System.out.printf(
          "%18d %6d %13d %5d %20d %8d%n",
          top, results[1][0], results[0][1], results[1][1], results[0][2], results[1][2]);
    }
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// Maximum flow by augmenting paths, checked three ways: against the smallest
// cut found by trying every partition, against the cut read off the final
// residual graph, and, for bipartite graphs, against a brute-force matching.
// Then the number of augmenting paths found by depth-first and by
// breadth-first search.

#include <algorithm>
#include <cstdio>
#include <deque>
#include <vector>

long long work = 0;

struct Edge {
  int u;
  int v;
  long long c;
};

struct Network {
  int n;
  std::vector<std::vector<int> > head;  // edge indices leaving each node
  std::vector<int> to;
  std::vector<long long> cap;

  explicit Network(int size) : n(size), head(size) {}

  void addEdge(int u, int v, long long c) {
    // edge e and its reverse e ^ 1 are stored as a pair
    head[u].push_back((int)to.size());
    to.push_back(v);
    cap.push_back(c);
    head[v].push_back((int)to.size());
    to.push_back(u);
    cap.push_back(0);
  }
};

long long augment(Network& g, int s, int t, bool breadthFirst) {
  // breadth-first gives the shortest augmenting path (Edmonds-Karp);
  // depth-first gives whichever path it happens to find first
  std::vector<int> via(g.n, -1);
  std::vector<bool> seen(g.n, false);
  seen[s] = true;
  std::deque<int> frontier(1, s);
  while (!frontier.empty() && !seen[t]) {
    int u;
    if (breadthFirst) {
      u = frontier.front();
      frontier.pop_front();
    } else {
      u = frontier.back();
      frontier.pop_back();
    }
    for (int e : g.head[u]) {
      work += 1;
      if (g.cap[e] > 0 && !seen[g.to[e]]) {
        seen[g.to[e]] = true;
        via[g.to[e]] = e;
        frontier.push_back(g.to[e]);
      }
    }
  }
  if (!seen[t]) {
    return 0;
  }
  long long push = -1;
  for (int v = t; v != s; v = g.to[via[v] ^ 1]) {
    push = push < 0 ? g.cap[via[v]] : std::min(push, g.cap[via[v]]);
  }
  for (int v = t; v != s; v = g.to[via[v] ^ 1]) {
    g.cap[via[v]] -= push;
    g.cap[via[v] ^ 1] += push;
  }
  return push;
}

std::pair<long long, long long> maxFlow(Network& g, int s, int t, bool breadthFirst) {
  long long flow = 0;
  long long paths = 0;
  while (true) {
    long long pushed = augment(g, s, t, breadthFirst);
    if (pushed == 0) {
      return std::make_pair(flow, paths);
    }
    flow += pushed;
    paths += 1;
  }
}

long long residualCut(const Network& g, int s, const std::vector<Edge>& original) {
  // nodes still reachable from s; the edges leaving that set form a cut
  std::vector<bool> reach(g.n, false);
  reach[s] = true;
  std::vector<int> stack(1, s);
  while (!stack.empty()) {
    int u = stack.back();
    stack.pop_back();
    for (int e : g.head[u]) {
      if (g.cap[e] > 0 && !reach[g.to[e]]) {
        reach[g.to[e]] = true;
        stack.push_back(g.to[e]);
      }
    }
  }
  long long total = 0;
  for (const Edge& edge : original) {
    if (reach[edge.u] && !reach[edge.v]) {
      total += edge.c;
    }
  }
  return total;
}

long long bruteForceMinCut(int n, const std::vector<Edge>& edges, int s, int t) {
  long long best = -1;
  for (int mask = 0; mask < (1 << n); mask++) {
    if (((mask >> s) & 1) == 0 || ((mask >> t) & 1) == 1) {
      continue;
    }
    long long total = 0;
    for (const Edge& edge : edges) {
      if (((mask >> edge.u) & 1) == 1 && ((mask >> edge.v) & 1) == 0) {
        total += edge.c;
      }
    }
    if (best < 0 || total < best) {
      best = total;
    }
  }
  return best;
}

int bruteForceMatching(const std::vector<std::vector<int> >& adjacency, int left, int used) {
  // the largest matching using left vertices from \`left\` onward
  if (left == (int)adjacency.size()) {
    return 0;
  }
  int best = bruteForceMatching(adjacency, left + 1, used);
  for (int right : adjacency[left]) {
    if (((used >> right) & 1) == 0) {
      best = std::max(best, 1 + bruteForceMatching(adjacency, left + 1, used | (1 << right)));
    }
  }
  return best;
}

// The same linear congruential generator in every language, so the graphs
// below are the same graphs whichever translation is run.
long long seed = 58300037LL;

int rand_below(int n) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return (int)(seed / 65536LL % n);
}

int main() {
  const int trials = 500;
  int flowIsCut = 0;
  int residualIsCut = 0;
  for (int trial = 0; trial < trials; trial++) {
    const int n = 8;
    std::vector<Edge> edges;
    for (int i = 0; i < 14; i++) {
      int u = rand_below(n);
      int v = rand_below(n);
      if (u != v) {
        edges.push_back(Edge{u, v, 1 + rand_below(9)});
      }
    }
    Network g(n);
    for (const Edge& edge : edges) {
      g.addEdge(edge.u, edge.v, edge.c);
    }
    long long flow = maxFlow(g, 0, n - 1, true).first;
    if (flow == bruteForceMinCut(n, edges, 0, n - 1)) {
      flowIsCut += 1;
    }
    if (flow == residualCut(g, 0, edges)) {
      residualIsCut += 1;
    }
  }
  std::printf("%d random networks of 8 nodes and up to 14 edges\\n", trials);
  std::printf("  maximum flow equal to the smallest cut over all 64 partitions  %d\\n", flowIsCut);
  std::printf("  maximum flow equal to the cut read from the residual graph     %d\\n", residualIsCut);
  std::printf("\\n");

  int matchingRight = 0;
  for (int trial = 0; trial < trials; trial++) {
    const int side = 6;
    std::vector<std::vector<int> > adjacency(side);
    Network g(2 * side + 2);
    int source = 2 * side;
    int sink = 2 * side + 1;
    for (int a = 0; a < side; a++) {
      g.addEdge(source, a, 1);
      g.addEdge(side + a, sink, 1);
      for (int b = 0; b < side; b++) {
        if (rand_below(10) < 3) {
          adjacency[a].push_back(b);
          g.addEdge(a, side + b, 1);
        }
      }
    }
    long long flow = maxFlow(g, source, sink, true).first;
    if (flow == bruteForceMatching(adjacency, 0, 0)) {
      matchingRight += 1;
    }
  }
  std::printf("%d random bipartite graphs, 6 + 6 vertices, unit capacities\\n", trials);
  std::printf("  flow equal to the largest matching found by brute force  %d\\n", matchingRight);
  std::printf("\\n");

  std::printf("augmenting paths needed on random networks of 60 nodes and 400 edges\\n");
  std::printf("\\n");
  std::printf("  capacities up to   flow     paths: dfs   bfs     edge checks: dfs      bfs\\n");
  int tops[3] = {10, 1000, 100000};
  for (int top : tops) {
    std::vector<Edge> edges;
    for (int i = 0; i < 400; i++) {
      int u = rand_below(60);
      int v = rand_below(60);
      if (u != v) {
        edges.push_back(Edge{u, v, 1 + rand_below(top)});
      }
    }
    long long results[2][3];
    bool modes[2] = {false, true};
    for (int m = 0; m < 2; m++) {
      Network g(60);
      for (const Edge& edge : edges) {
        g.addEdge(edge.u, edge.v, edge.c);
      }
      work = 0;
      std::pair<long long, long long> flowAndPaths = maxFlow(g, 0, 59, modes[m]);
      results[m][0] = flowAndPaths.first;
      results[m][1] = flowAndPaths.second;
      results[m][2] = work;
    }
    std::printf("%18d %6lld %13lld %5lld %20lld %8lld\\n", top, results[1][0], results[0][1],
                results[1][1], results[0][2], results[1][2]);
  }
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Maximum flow by augmenting paths, checked three ways: against the smallest
// cut found by trying every partition, against the cut read off the final
// residual graph, and, for bipartite graphs, against a brute-force matching.
// Then the number of augmenting paths found by depth-first and by
// breadth-first search.

use std::collections::VecDeque;

struct Network {
    n: usize,
    head: Vec<Vec<usize>>, // edge indices leaving each node
    to: Vec<usize>,
    cap: Vec<i64>,
}

impl Network {
    fn new(n: usize) -> Network {
        Network { n, head: vec![Vec::new(); n], to: Vec::new(), cap: Vec::new() }
    }

    fn add_edge(&mut self, u: usize, v: usize, c: i64) {
        // edge e and its reverse e ^ 1 are stored as a pair
        self.head[u].push(self.to.len());
        self.to.push(v);
        self.cap.push(c);
        self.head[v].push(self.to.len());
        self.to.push(u);
        self.cap.push(0);
    }
}

fn augment(g: &mut Network, s: usize, t: usize, breadth_first: bool, work: &mut i64) -> i64 {
    // breadth-first gives the shortest augmenting path (Edmonds-Karp);
    // depth-first gives whichever path it happens to find first
    let mut via = vec![usize::MAX; g.n];
    let mut seen = vec![false; g.n];
    seen[s] = true;
    let mut frontier: VecDeque<usize> = VecDeque::new();
    frontier.push_back(s);
    while !frontier.is_empty() && !seen[t] {
        let u = if breadth_first { frontier.pop_front().unwrap() } else { frontier.pop_back().unwrap() };
        for &e in g.head[u].iter() {
            *work += 1;
            let v = g.to[e];
            if g.cap[e] > 0 && !seen[v] {
                seen[v] = true;
                via[v] = e;
                frontier.push_back(v);
            }
        }
    }
    if !seen[t] {
        return 0;
    }
    let mut push = -1;
    let mut v = t;
    while v != s {
        let e = via[v];
        push = if push < 0 { g.cap[e] } else { push.min(g.cap[e]) };
        v = g.to[e ^ 1];
    }
    v = t;
    while v != s {
        let e = via[v];
        g.cap[e] -= push;
        g.cap[e ^ 1] += push;
        v = g.to[e ^ 1];
    }
    push
}

fn max_flow(g: &mut Network, s: usize, t: usize, breadth_first: bool, work: &mut i64) -> (i64, i64) {
    let mut flow = 0;
    let mut paths = 0;
    loop {
        let pushed = augment(g, s, t, breadth_first, work);
        if pushed == 0 {
            return (flow, paths);
        }
        flow += pushed;
        paths += 1;
    }
}

fn residual_cut(g: &Network, s: usize, original: &[(usize, usize, i64)]) -> i64 {
    // nodes still reachable from s; the edges leaving that set form a cut
    let mut reach = vec![false; g.n];
    reach[s] = true;
    let mut stack = vec![s];
    while let Some(u) = stack.pop() {
        for &e in g.head[u].iter() {
            let v = g.to[e];
            if g.cap[e] > 0 && !reach[v] {
                reach[v] = true;
                stack.push(v);
            }
        }
    }
    original.iter().filter(|&&(u, v, _)| reach[u] && !reach[v]).map(|&(_, _, c)| c).sum()
}

fn brute_force_min_cut(n: usize, edges: &[(usize, usize, i64)], s: usize, t: usize) -> i64 {
    let mut best = -1;
    for mask in 0..(1usize << n) {
        if (mask >> s) & 1 == 0 || (mask >> t) & 1 == 1 {
            continue;
        }
        let mut total = 0;
        for &(u, v, c) in edges.iter() {
            if (mask >> u) & 1 == 1 && (mask >> v) & 1 == 0 {
                total += c;
            }
        }
        if best < 0 || total < best {
            best = total;
        }
    }
    best
}

fn brute_force_matching(adjacency: &[Vec<usize>], left: usize, used: usize) -> i64 {
    // the largest matching using left vertices from \`left\` onward
    if left == adjacency.len() {
        return 0;
    }
    let mut best = brute_force_matching(adjacency, left + 1, used);
    for &right in adjacency[left].iter() {
        if (used >> right) & 1 == 0 {
            best = best.max(1 + brute_force_matching(adjacency, left + 1, used | (1 << right)));
        }
    }
    best
}

// The same linear congruential generator in every language, so the graphs
// below are the same graphs whichever translation is run.
static mut SEED: i64 = 58300037;

fn rand_below(n: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % n
    }
}

fn main() {
    let trials = 500;
    let mut ignored = 0;
    let mut flow_is_cut = 0;
    let mut residual_is_cut = 0;
    for _ in 0..trials {
        let n = 8usize;
        let mut edges: Vec<(usize, usize, i64)> = Vec::new();
        for _ in 0..14 {
            let u = rand_below(n as i64) as usize;
            let v = rand_below(n as i64) as usize;
            if u != v {
                edges.push((u, v, 1 + rand_below(9)));
            }
        }
        let mut g = Network::new(n);
        for &(u, v, c) in edges.iter() {
            g.add_edge(u, v, c);
        }
        let (flow, _) = max_flow(&mut g, 0, n - 1, true, &mut ignored);
        if flow == brute_force_min_cut(n, &edges, 0, n - 1) {
            flow_is_cut += 1;
        }
        if flow == residual_cut(&g, 0, &edges) {
            residual_is_cut += 1;
        }
    }
    println!("{} random networks of 8 nodes and up to 14 edges", trials);
    println!("  maximum flow equal to the smallest cut over all 64 partitions  {}", flow_is_cut);
    println!("  maximum flow equal to the cut read from the residual graph     {}", residual_is_cut);
    println!();

    let mut matching_right = 0;
    for _ in 0..trials {
        let side = 6usize;
        let mut adjacency: Vec<Vec<usize>> = vec![Vec::new(); side];
        let mut g = Network::new(2 * side + 2);
        let source = 2 * side;
        let sink = 2 * side + 1;
        for a in 0..side {
            g.add_edge(source, a, 1);
            g.add_edge(side + a, sink, 1);
            for b in 0..side {
                if rand_below(10) < 3 {
                    adjacency[a].push(b);
                    g.add_edge(a, side + b, 1);
                }
            }
        }
        let (flow, _) = max_flow(&mut g, source, sink, true, &mut ignored);
        if flow == brute_force_matching(&adjacency, 0, 0) {
            matching_right += 1;
        }
    }
    println!("{} random bipartite graphs, 6 + 6 vertices, unit capacities", trials);
    println!("  flow equal to the largest matching found by brute force  {}", matching_right);
    println!();

    println!("augmenting paths needed on random networks of 60 nodes and 400 edges");
    println!();
    println!("  capacities up to   flow     paths: dfs   bfs     edge checks: dfs      bfs");
    for &top in [10i64, 1000, 100000].iter() {
        let mut edges: Vec<(usize, usize, i64)> = Vec::new();
        for _ in 0..400 {
            let u = rand_below(60) as usize;
            let v = rand_below(60) as usize;
            if u != v {
                edges.push((u, v, 1 + rand_below(top)));
            }
        }
        let mut results: Vec<(i64, i64, i64)> = Vec::new();
        for &breadth_first in [false, true].iter() {
            let mut g = Network::new(60);
            for &(u, v, c) in edges.iter() {
                g.add_edge(u, v, c);
            }
            let mut work = 0;
            let (flow, paths) = max_flow(&mut g, 0, 59, breadth_first, &mut work);
            results.push((flow, paths, work));
        }
        println!(
            "{:>18} {:>6} {:>13} {:>5} {:>20} {:>8}",
            top, results[1].0, results[0].1, results[1].1, results[0].2, results[1].2
        );
    }
}
`,
            },
            {
              lang: "go",
              code: `// Maximum flow by augmenting paths, checked three ways: against the smallest
// cut found by trying every partition, against the cut read off the final
// residual graph, and, for bipartite graphs, against a brute-force matching.
// Then the number of augmenting paths found by depth-first and by
// breadth-first search.

package main

import "fmt"

var work int64

type edge struct {
	u, v int
	c    int64
}

type network struct {
	n    int
	head [][]int // edge indices leaving each node
	to   []int
	cap  []int64
}

func newNetwork(n int) *network {
	return &network{n: n, head: make([][]int, n)}
}

func (g *network) addEdge(u, v int, c int64) {
	// edge e and its reverse e ^ 1 are stored as a pair
	g.head[u] = append(g.head[u], len(g.to))
	g.to = append(g.to, v)
	g.cap = append(g.cap, c)
	g.head[v] = append(g.head[v], len(g.to))
	g.to = append(g.to, u)
	g.cap = append(g.cap, 0)
}

func augment(g *network, s, t int, breadthFirst bool) int64 {
	// breadth-first gives the shortest augmenting path (Edmonds-Karp);
	// depth-first gives whichever path it happens to find first
	via := make([]int, g.n)
	seen := make([]bool, g.n)
	seen[s] = true
	frontier := []int{s}
	for len(frontier) > 0 && !seen[t] {
		var u int
		if breadthFirst {
			u = frontier[0]
			frontier = frontier[1:]
		} else {
			u = frontier[len(frontier)-1]
			frontier = frontier[:len(frontier)-1]
		}
		for _, e := range g.head[u] {
			work++
			if g.cap[e] > 0 && !seen[g.to[e]] {
				seen[g.to[e]] = true
				via[g.to[e]] = e
				frontier = append(frontier, g.to[e])
			}
		}
	}
	if !seen[t] {
		return 0
	}
	var push int64 = -1
	for v := t; v != s; v = g.to[via[v]^1] {
		if push < 0 || g.cap[via[v]] < push {
			push = g.cap[via[v]]
		}
	}
	for v := t; v != s; v = g.to[via[v]^1] {
		g.cap[via[v]] -= push
		g.cap[via[v]^1] += push
	}
	return push
}

func maxFlow(g *network, s, t int, breadthFirst bool) (int64, int64) {
	var flow, paths int64
	for {
		pushed := augment(g, s, t, breadthFirst)
		if pushed == 0 {
			return flow, paths
		}
		flow += pushed
		paths++
	}
}

func residualCut(g *network, s int, original []edge) int64 {
	// nodes still reachable from s; the edges leaving that set form a cut
	reach := make([]bool, g.n)
	reach[s] = true
	stack := []int{s}
	for len(stack) > 0 {
		u := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		for _, e := range g.head[u] {
			if g.cap[e] > 0 && !reach[g.to[e]] {
				reach[g.to[e]] = true
				stack = append(stack, g.to[e])
			}
		}
	}
	var total int64
	for _, ed := range original {
		if reach[ed.u] && !reach[ed.v] {
			total += ed.c
		}
	}
	return total
}

func bruteForceMinCut(n int, edges []edge, s, t int) int64 {
	var best int64 = -1
	for mask := 0; mask < 1<<n; mask++ {
		if (mask>>s)&1 == 0 || (mask>>t)&1 == 1 {
			continue
		}
		var total int64
		for _, ed := range edges {
			if (mask>>ed.u)&1 == 1 && (mask>>ed.v)&1 == 0 {
				total += ed.c
			}
		}
		if best < 0 || total < best {
			best = total
		}
	}
	return best
}

func bruteForceMatching(adjacency [][]int, left, used int) int {
	// the largest matching using left vertices from \`left\` onward
	if left == len(adjacency) {
		return 0
	}
	best := bruteForceMatching(adjacency, left+1, used)
	for _, right := range adjacency[left] {
		if (used>>right)&1 == 0 {
			best = max(best, 1+bruteForceMatching(adjacency, left+1, used|(1<<right)))
		}
	}
	return best
}

// The same linear congruential generator in every language, so the graphs
// below are the same graphs whichever translation is run.
var seed int64 = 58300037

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	const trials = 500
	flowIsCut := 0
	residualIsCut := 0
	for trial := 0; trial < trials; trial++ {
		const n = 8
		edges := []edge{}
		for i := 0; i < 14; i++ {
			u := randBelow(n)
			v := randBelow(n)
			if u != v {
				edges = append(edges, edge{u, v, int64(1 + randBelow(9))})
			}
		}
		g := newNetwork(n)
		for _, ed := range edges {
			g.addEdge(ed.u, ed.v, ed.c)
		}
		flow, _ := maxFlow(g, 0, n-1, true)
		if flow == bruteForceMinCut(n, edges, 0, n-1) {
			flowIsCut++
		}
		if flow == residualCut(g, 0, edges) {
			residualIsCut++
		}
	}
	fmt.Printf("%d random networks of 8 nodes and up to 14 edges\\n", trials)
	fmt.Printf("  maximum flow equal to the smallest cut over all 64 partitions  %d\\n", flowIsCut)
	fmt.Printf("  maximum flow equal to the cut read from the residual graph     %d\\n", residualIsCut)
	fmt.Println()

	matchingRight := 0
	for trial := 0; trial < trials; trial++ {
		const side = 6
		adjacency := make([][]int, side)
		g := newNetwork(2*side + 2)
		source := 2 * side
		sink := 2*side + 1
		for a := 0; a < side; a++ {
			g.addEdge(source, a, 1)
			g.addEdge(side+a, sink, 1)
			for b := 0; b < side; b++ {
				if randBelow(10) < 3 {
					adjacency[a] = append(adjacency[a], b)
					g.addEdge(a, side+b, 1)
				}
			}
		}
		flow, _ := maxFlow(g, source, sink, true)
		if flow == int64(bruteForceMatching(adjacency, 0, 0)) {
			matchingRight++
		}
	}
	fmt.Printf("%d random bipartite graphs, 6 + 6 vertices, unit capacities\\n", trials)
	fmt.Printf("  flow equal to the largest matching found by brute force  %d\\n", matchingRight)
	fmt.Println()

	fmt.Println("augmenting paths needed on random networks of 60 nodes and 400 edges")
	fmt.Println()
	fmt.Println("  capacities up to   flow     paths: dfs   bfs     edge checks: dfs      bfs")
	for _, top := range []int{10, 1000, 100000} {
		edges := []edge{}
		for i := 0; i < 400; i++ {
			u := randBelow(60)
			v := randBelow(60)
			if u != v {
				edges = append(edges, edge{u, v, int64(1 + randBelow(top))})
			}
		}
		results := [2][3]int64{}
		for m, breadthFirst := range []bool{false, true} {
			g := newNetwork(60)
			for _, ed := range edges {
				g.addEdge(ed.u, ed.v, ed.c)
			}
			work = 0
			flow, paths := maxFlow(g, 0, 59, breadthFirst)
			results[m] = [3]int64{flow, paths, work}
		}
		fmt.Printf("%18d %6d %13d %5d %20d %8d\\n", top, results[1][0], results[0][1], results[1][1], results[0][2], results[1][2])
	}
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "which-path",
      heading: "Which augmenting path",
      body: [
        "Ford\u2013Fulkerson does not say which path to take, and the choice decides the running time.",
        "**Depth-first**, taking whatever path it finds first, can wander through long paths with small bottlenecks. With integer capacities the number of augmentations is bounded only by the value of the flow, so large capacities can mean many paths; the measured count grew from 6 to 71 as capacities grew.",
        "**Breadth-first**, taking a shortest path in edges, is the **Edmonds\u2013Karp** algorithm. Shortest-path distances from `s` never decrease as flow is pushed, which bounds the number of augmentations by `O(VE)` independent of the capacities, and the total time by `O(VE^2)`. The measured count stayed between 5 and 21.",
        "**Dinic's algorithm** goes further: build the breadth-first level graph once, then push a blocking flow along all shortest paths in it before rebuilding. It runs in `O(V^2 E)` in general and `O(E \u221aV)` on unit-capacity bipartite graphs, and is the usual choice when flow must be fast.",
      ],
    },
    {
      id: "matching",
      heading: "Bipartite matching as flow",
      body: [
        "Given left vertices, right vertices and allowed pairs, a **matching** picks pairs with no vertex used twice. Add a source with a capacity-1 edge to every left vertex, a capacity-1 edge along every allowed pair, and a capacity-1 edge from every right vertex to a sink. An integral flow uses each left and right vertex at most once, so the maximum flow is the maximum matching \u2014 which the measurement confirmed 500 of 500 times.",
        "The same construction solves many problems stated without flows: assigning workers to jobs they can do, **edge-disjoint paths** between two nodes (unit capacity on each edge; the flow is the number of paths), and **minimum vertex cover in a bipartite graph**, which by K\u00f6nig's theorem has the same size as the maximum matching and is read from the minimum cut.",
        "**Minimum cut problems** in disguise are the other large family: separating two sets at least cost, choosing projects with prerequisites to maximise profit, and segmenting images into foreground and background all reduce to building a network whose cuts are exactly the choices, then finding the smallest.",
      ],
      pitfalls: [
        {
          title: "Leaving out reverse edges",
          body: "Without them an early path cannot be undone, and the result can be less than the maximum flow.",
        },
        {
          title: "Assuming depth-first augmentation is fast enough",
          body: "Its path count grows with the capacities: 71 paths against 20 for breadth-first at capacities up to 100,000.",
        },
        {
          title: "Reading the cut from the original graph",
          body: "The minimum cut is the edges leaving the set reachable from the source in the final residual graph, not any set of saturated edges.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does the Ford-Fulkerson method find a maximum flow, and why are reverse edges needed?",
      answer:
        "Keep a residual graph: each edge has a forward residual capacity c - f and a reverse edge with capacity f. While there is a source-to-sink path through positive residual capacity, push its bottleneck along it, updating both directions. Reverse edges let a later path cancel flow an earlier path sent, so a bad early choice can be undone; without them the result can fall short of the maximum. When no path is left, the nodes reachable from the source define a cut whose capacity equals the flow. I checked that on 500 random networks against every source-sink partition, and it held every time.",
    },
    {
      question: "What is the difference between Ford-Fulkerson with DFS and Edmonds-Karp?",
      answer:
        "Only which augmenting path is chosen, and it decides the running time. DFS takes whatever path it reaches first, and with integer capacities the number of augmentations is bounded by the flow value, so it grows with capacities. Edmonds-Karp uses BFS for a shortest path in edges; distances from the source never decrease, which bounds augmentations by O(VE) regardless of capacities, O(VE^2) time overall. I measured 60-node networks with capacities up to 100,000: DFS needed 71 paths and 20,544 edge checks, BFS needed 20 and 9,347.",
    },
    {
      question: "How do you solve bipartite matching with flow?",
      answer:
        "Source to every left vertex with capacity 1, every allowed pair with capacity 1, every right vertex to the sink with capacity 1. An integral maximum flow uses each vertex at most once, so its value is the maximum matching, and the saturated middle edges are the pairs. I checked it against a brute-force matching on 500 random 6-by-6 bipartite graphs and they agreed every time. Hopcroft-Karp, or Dinic on this graph, gives O(E sqrt V).",
    },
  ],
  takeaways: [
    "The residual graph has c - f forward and f backward on every edge",
    "Reverse edges let later paths cancel earlier flow",
    "Maximum flow equals minimum cut; measured 500 of 500 against every partition",
    "The minimum cut is the edges leaving the residual-reachable set",
    "Breadth-first augmenting paths bound the path count independent of capacities",
    "Measured at capacities up to 100,000: 71 depth-first paths, 20 breadth-first",
    "Bipartite matching is unit-capacity flow from source to left to right to sink",
  ],
};
