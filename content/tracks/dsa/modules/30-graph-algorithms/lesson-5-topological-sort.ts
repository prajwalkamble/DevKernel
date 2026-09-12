import type { Lesson } from "@/content/types";

export const topologicalSortLesson: Lesson = {
  id: "dsa-graph-algorithms-topological-sort",
  slug: "topological-sort",
  moduleSlug: "graph-algorithms",
  title: "Topological Sort and DAG Dynamic Programming",
  summary:
    "Two opposite algorithms that both answer the same question, and a cycle check neither has to pay for. Then the part that causes real bugs: the order is not unique, so asking for a specific one is a different question with a different answer. And the reason any of it matters \u2014 an NP-hard problem that becomes one pass once the nodes are in order.",
  estimatedMinutes: 45,
  objectives: [
    "Produce a topological order both front-to-back and back-to-front",
    "Detect a cycle without adding a pass",
    "Say why the order is not unique, and what that breaks",
    "Ask for the lexicographically smallest order when that is the question",
    "Run a dynamic programme on a DAG, and say what the order is doing",
  ],
  sections: [
    {
      id: "two-opposite-algorithms",
      heading: "Two opposite algorithms",
      body: [
        "A topological order lists the nodes so that every edge points forwards. Two standard algorithms produce one, and they are not variations on each other \u2014 they are opposite ideas.",
        "**Kahn** works front to back: repeatedly take a node nothing points at, remove it, repeat. **DFS** works back to front: finish a node only after everything it points at is finished, then reverse the finishing order. Both are linear.",
        "Both also detect a cycle, and neither needs an extra pass to do it. Kahn notices that it emitted fewer than `n` nodes \u2014 a node that never reaches indegree zero is being pointed at by something in a loop. DFS notices that it walked into a node it is still in the middle of, which is what the third colour is for: white untouched, grey started-not-finished, black finished. Over 3,000 random graphs, 1,021 held a cycle and both algorithms refused all 1,021.",
        "The number worth carrying out of the example is a different one. On the 1,979 acyclic graphs, both algorithms produced a valid order every time \u2014 and the two produced *the same* order on only 156 of them.",
        "They are both right. There is usually more than one valid order, and the demo's third column counts them: a diamond has two, a path has exactly one, a cycle has none. Any code that depends on receiving a particular order is depending on which algorithm somebody picked.",
      ],
      examples: [
        {
          id: "kahn-and-dfs",
          title: "Both algorithms, both cycle checks, and how often they agree",
          lang: "python",
          code: `# Two algorithms for the same job, and the cycle check that comes free.
#
# A topological order lists the nodes so that every edge points forwards. There
# are two standard ways to produce one and they are not variations on each
# other -- they are opposite ideas.
#
#   Kahn    -- repeatedly take a node nothing points at. Front to back.
#   DFS     -- finish a node only after everything it points at is finished,
#              then reverse the finishing order. Back to front.
#
# Both are linear. Both detect a cycle, and neither needs an extra pass to do
# it: Kahn notices it emitted fewer than n nodes, DFS notices it walked into a
# node it is still in the middle of.
from collections import deque


def kahn(n, edges):
    """Take a node nothing points at, remove it, repeat."""
    adj = [[] for _ in range(n)]
    indeg = [0] * n
    for u, v in edges:
        adj[u].append(v)
        indeg[v] += 1
    q = deque(v for v in range(n) if indeg[v] == 0)
    order = []
    while q:
        at = q.popleft()
        order.append(at)
        for nxt in adj[at]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                q.append(nxt)
    # Fewer than n emitted means some nodes never reached indegree zero, which
    # can only happen if they are pointing at each other.
    return order if len(order) == n else None


def dfs_order(n, edges):
    """Finish a node after everything below it, then reverse.

    The three colours are the cycle check. White is untouched, grey is
    "started, not finished", black is finished. Walking into a grey node means
    walking into the path currently being explored -- a cycle.
    """
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
    colour = [0] * n
    finished = []
    found_cycle = [False]

    def visit(at):
        colour[at] = 1
        for nxt in adj[at]:
            if colour[nxt] == 1:
                found_cycle[0] = True
            elif colour[nxt] == 0:
                visit(nxt)
        colour[at] = 2
        finished.append(at)

    for v in range(n):
        if colour[v] == 0:
            visit(v)
    if found_cycle[0]:
        return None
    finished.reverse()
    return finished


def edges_point_forwards(n, edges, order):
    """The definition: in a valid order, every edge goes left to right."""
    if order is None or len(order) != n:
        return False
    place = [0] * n
    for i, v in enumerate(order):
        place[v] = i
    return all(place[u] < place[v] for u, v in edges)


def count_valid_orders(n, edges):
    """Every permutation, checked. Factorial and exact, so the count is a fact."""
    order = list(range(n))
    total = [0]

    def permute(fixed):
        if fixed == n:
            if edges_point_forwards(n, edges, order):
                total[0] += 1
            return
        for i in range(fixed, n):
            order[fixed], order[i] = order[i], order[fixed]
            permute(fixed + 1)
            order[fixed], order[i] = order[i], order[fixed]

    permute(0)
    return total[0]


def has_cycle(n, edges):
    """Independent check: is any node reachable from itself in one or more steps."""
    reach = [[False] * n for _ in range(n)]
    for u, v in edges:
        reach[u][v] = True
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if reach[i][k] and reach[k][j]:
                    reach[i][j] = True
    return any(reach[i][i] for i in range(n))


def show(order):
    return "none" if order is None else " ".join(str(v) for v in order)


def label(edges):
    return "[" + ", ".join("%d->%d" % e for e in edges) + "]"


CASES = [
    (4, [(0, 1), (0, 2), (1, 3), (2, 3)]),
    (4, [(3, 2), (2, 1), (1, 0)]),
    (3, [(0, 1), (1, 2), (2, 0)]),
]

print("%-30s %-12s %-12s %s" % ("edges", "Kahn", "DFS", "valid orders"))
for n, edges in CASES:
    print("%-30s %-12s %-12s %d" % (
        label(edges), show(kahn(n, edges)), show(dfs_order(n, edges)),
        count_valid_orders(n, edges)))

# The same linear congruential generator in every language, so the random
# graphs below are the same graphs whichever translation is run.
seed = 5150


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


trials = 3000
dags = kahn_valid = dfs_valid = agreed = 0
cyclic = kahn_caught = dfs_caught = 0
for _ in range(trials):
    n = 3 + rand(4)
    # Random edges in both directions, so roughly half the graphs hold a cycle.
    edges = []
    for u in range(n):
        for v in range(n):
            if u != v and rand(5) == 0:
                edges.append((u, v))
    if has_cycle(n, edges):
        cyclic += 1
        kahn_caught += kahn(n, edges) is None
        dfs_caught += dfs_order(n, edges) is None
        continue
    dags += 1
    a, b = kahn(n, edges), dfs_order(n, edges)
    kahn_valid += edges_point_forwards(n, edges, a)
    dfs_valid += edges_point_forwards(n, edges, b)
    agreed += a == b

print()
print("over %d random graphs on 3 to 6 nodes:" % trials)
print("  %-40s %6d" % ("graphs that were acyclic", dags))
print("  %-40s %6d" % ("Kahn's order had every edge forwards", kahn_valid))
print("  %-40s %6d" % ("the DFS order had every edge forwards", dfs_valid))
print("  %-40s %6d" % ("the two produced the same order", agreed))
print()
print("  %-40s %6d" % ("graphs holding a cycle", cyclic))
print("  %-40s %6d" % ("Kahn emitted fewer than n nodes", kahn_caught))
print("  %-40s %6d" % ("DFS walked into a half-finished node", dfs_caught))

print()
print("Both algorithms are correct on every acyclic graph, and both refuse")
print("every cyclic one -- the cycle check is not an extra pass, it is a")
print("count in one case and a colour in the other.")
print()
print("The number that matters for everything after this is the last one in")
print("the first block. The two algorithms agreed on only %d of %d graphs." % (agreed, dags))
print("They are both right. There is usually more than one valid order, and")
print("the demo table's third column says how many: a diamond has two, a path")
print("has exactly one, and a cycle has none. Any code that depends on getting")
print("a particular order is depending on which algorithm you picked.")
`,
          output: `edges                          Kahn         DFS          valid orders
[0->1, 0->2, 1->3, 2->3]       0 1 2 3      0 2 1 3      2
[3->2, 2->1, 1->0]             3 2 1 0      3 2 1 0      1
[0->1, 1->2, 2->0]             none         none         0

over 3000 random graphs on 3 to 6 nodes:
  graphs that were acyclic                   1979
  Kahn's order had every edge forwards       1979
  the DFS order had every edge forwards      1979
  the two produced the same order             156

  graphs holding a cycle                     1021
  Kahn emitted fewer than n nodes            1021
  DFS walked into a half-finished node       1021

Both algorithms are correct on every acyclic graph, and both refuse
every cyclic one -- the cycle check is not an extra pass, it is a
count in one case and a colour in the other.

The number that matters for everything after this is the last one in
the first block. The two algorithms agreed on only 156 of 1979 graphs.
They are both right. There is usually more than one valid order, and
the demo table's third column says how many: a diamond has two, a path
has exactly one, and a cycle has none. Any code that depends on getting
a particular order is depending on which algorithm you picked.`,
          explanation:
            "Kahn and DFS scored against the definition of a valid order, and against an independent reachability test for cycles. The last counter in the first block is the one the next section is about.",
          alternates: [
            {
              lang: "javascript",
              code: `// Two algorithms for the same job, and the cycle check that comes free.
//
// A topological order lists the nodes so that every edge points forwards. There
// are two standard ways to produce one and they are not variations on each
// other -- they are opposite ideas.
//
//   Kahn    -- repeatedly take a node nothing points at. Front to back.
//   DFS     -- finish a node only after everything it points at is finished,
//              then reverse the finishing order. Back to front.
//
// Both are linear. Both detect a cycle, and neither needs an extra pass to do
// it: Kahn notices it emitted fewer than n nodes, DFS notices it walked into a
// node it is still in the middle of.

// Take a node nothing points at, remove it, repeat.
function kahn(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [u, v] of edges) {
    adj[u].push(v);
    indeg[v] += 1;
  }
  const ready = [];
  for (let v = 0; v < n; v += 1) if (indeg[v] === 0) ready.push(v);
  const order = [];
  let head = 0;
  while (head < ready.length) {
    const at = ready[head];
    head += 1;
    order.push(at);
    for (const nxt of adj[at]) {
      indeg[nxt] -= 1;
      if (indeg[nxt] === 0) ready.push(nxt);
    }
  }
  // Fewer than n emitted means some nodes never reached indegree zero, which
  // can only happen if they are pointing at each other.
  return order.length === n ? order : null;
}

// Finish a node after everything below it, then reverse.
//
// The three colours are the cycle check. White is untouched, grey is
// "started, not finished", black is finished. Walking into a grey node means
// walking into the path currently being explored -- a cycle.
function dfsOrder(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v);
  const colour = new Array(n).fill(0);
  const finished = [];
  let foundCycle = false;

  const visit = (at) => {
    colour[at] = 1;
    for (const nxt of adj[at]) {
      if (colour[nxt] === 1) foundCycle = true;
      else if (colour[nxt] === 0) visit(nxt);
    }
    colour[at] = 2;
    finished.push(at);
  };

  for (let v = 0; v < n; v += 1) if (colour[v] === 0) visit(v);
  if (foundCycle) return null;
  finished.reverse();
  return finished;
}

// The definition: in a valid order, every edge goes left to right.
function edgesPointForwards(n, edges, order) {
  if (order === null || order.length !== n) return false;
  const place = new Array(n).fill(0);
  order.forEach((v, i) => {
    place[v] = i;
  });
  return edges.every(([u, v]) => place[u] < place[v]);
}

// Every permutation, checked. Factorial and exact, so the count is a fact.
function countValidOrders(n, edges) {
  const order = Array.from({ length: n }, (_, i) => i);
  let total = 0;

  const permute = (fixed) => {
    if (fixed === n) {
      if (edgesPointForwards(n, edges, order)) total += 1;
      return;
    }
    for (let i = fixed; i < n; i += 1) {
      [order[fixed], order[i]] = [order[i], order[fixed]];
      permute(fixed + 1);
      [order[fixed], order[i]] = [order[i], order[fixed]];
    }
  };

  permute(0);
  return total;
}

// Independent check: is any node reachable from itself in one or more steps.
function hasCycle(n, edges) {
  const reach = Array.from({ length: n }, () => new Array(n).fill(false));
  for (const [u, v] of edges) reach[u][v] = true;
  for (let k = 0; k < n; k += 1)
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1)
        if (reach[i][k] && reach[k][j]) reach[i][j] = true;
  for (let i = 0; i < n; i += 1) if (reach[i][i]) return true;
  return false;
}

function show(order) {
  return order === null ? "none" : order.join(" ");
}

function label(edges) {
  return "[" + edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ") + "]";
}

const CASES = [
  [4, [[0, 1], [0, 2], [1, 3], [2, 3]]],
  [4, [[3, 2], [2, 1], [1, 0]]],
  [3, [[0, 1], [1, 2], [2, 0]]],
];

console.log("edges".padEnd(30) + " " + "Kahn".padEnd(12) + " " + "DFS".padEnd(12) + " " + "valid orders");
for (const [n, edges] of CASES) {
  console.log(
    label(edges).padEnd(30) + " " + show(kahn(n, edges)).padEnd(12) + " " +
    show(dfsOrder(n, edges)).padEnd(12) + " " + countValidOrders(n, edges),
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 5150n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let dags = 0;
let kahnValid = 0;
let dfsValid = 0;
let agreed = 0;
let cyclic = 0;
let kahnCaught = 0;
let dfsCaught = 0;
const same = (a, b) => a !== null && b !== null && a.length === b.length && a.every((x, i) => x === b[i]);
for (let t = 0; t < trials; t += 1) {
  const n = 3 + rand(4);
  // Random edges in both directions, so roughly half the graphs hold a cycle.
  const edges = [];
  for (let u = 0; u < n; u += 1)
    for (let v = 0; v < n; v += 1)
      if (u !== v && rand(5) === 0) edges.push([u, v]);
  if (hasCycle(n, edges)) {
    cyclic += 1;
    if (kahn(n, edges) === null) kahnCaught += 1;
    if (dfsOrder(n, edges) === null) dfsCaught += 1;
    continue;
  }
  dags += 1;
  const a = kahn(n, edges);
  const b = dfsOrder(n, edges);
  if (edgesPointForwards(n, edges, a)) kahnValid += 1;
  if (edgesPointForwards(n, edges, b)) dfsValid += 1;
  if (same(a, b)) agreed += 1;
}

const row = (text, value) => "  " + text.padEnd(40) + " " + String(value).padStart(6);

console.log();
console.log(\`over \${trials} random graphs on 3 to 6 nodes:\`);
console.log(row("graphs that were acyclic", dags));
console.log(row("Kahn's order had every edge forwards", kahnValid));
console.log(row("the DFS order had every edge forwards", dfsValid));
console.log(row("the two produced the same order", agreed));
console.log();
console.log(row("graphs holding a cycle", cyclic));
console.log(row("Kahn emitted fewer than n nodes", kahnCaught));
console.log(row("DFS walked into a half-finished node", dfsCaught));

console.log();
console.log("Both algorithms are correct on every acyclic graph, and both refuse");
console.log("every cyclic one -- the cycle check is not an extra pass, it is a");
console.log("count in one case and a colour in the other.");
console.log();
console.log("The number that matters for everything after this is the last one in");
console.log(\`the first block. The two algorithms agreed on only \${agreed} of \${dags} graphs.\`);
console.log("They are both right. There is usually more than one valid order, and");
console.log("the demo table's third column says how many: a diamond has two, a path");
console.log("has exactly one, and a cycle has none. Any code that depends on getting");
console.log("a particular order is depending on which algorithm you picked.");
`,
            },
            {
              lang: "typescript",
              code: `// Two algorithms for the same job, and the cycle check that comes free.
//
// A topological order lists the nodes so that every edge points forwards. There
// are two standard ways to produce one and they are not variations on each
// other -- they are opposite ideas.
//
//   Kahn    -- repeatedly take a node nothing points at. Front to back.
//   DFS     -- finish a node only after everything it points at is finished,
//              then reverse the finishing order. Back to front.
//
// Both are linear. Both detect a cycle, and neither needs an extra pass to do
// it: Kahn notices it emitted fewer than n nodes, DFS notices it walked into a
// node it is still in the middle of.

// Take a node nothing points at, remove it, repeat.
function kahn(n: number, edges: number[][]): number[] | null {
  const adj: number[][] = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [u, v] of edges) {
    adj[u].push(v);
    indeg[v] += 1;
  }
  const ready: number[] = [];
  for (let v = 0; v < n; v += 1) if (indeg[v] === 0) ready.push(v);
  const order: number[] = [];
  let head = 0;
  while (head < ready.length) {
    const at = ready[head];
    head += 1;
    order.push(at);
    for (const nxt of adj[at]) {
      indeg[nxt] -= 1;
      if (indeg[nxt] === 0) ready.push(nxt);
    }
  }
  // Fewer than n emitted means some nodes never reached indegree zero, which
  // can only happen if they are pointing at each other.
  return order.length === n ? order : null;
}

// Finish a node after everything below it, then reverse.
//
// The three colours are the cycle check. White is untouched, grey is
// "started, not finished", black is finished. Walking into a grey node means
// walking into the path currently being explored -- a cycle.
function dfsOrder(n: number, edges: number[][]): number[] | null {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v);
  const colour = new Array(n).fill(0);
  const finished: number[] = [];
  let foundCycle = false;

  const visit = (at: number): void => {
    colour[at] = 1;
    for (const nxt of adj[at]) {
      if (colour[nxt] === 1) foundCycle = true;
      else if (colour[nxt] === 0) visit(nxt);
    }
    colour[at] = 2;
    finished.push(at);
  };

  for (let v = 0; v < n; v += 1) if (colour[v] === 0) visit(v);
  if (foundCycle) return null;
  finished.reverse();
  return finished;
}

// The definition: in a valid order, every edge goes left to right.
function edgesPointForwards(n: number, edges: number[][], order: number[] | null): boolean {
  if (order === null || order.length !== n) return false;
  const place = new Array(n).fill(0);
  order.forEach((v, i) => {
    place[v] = i;
  });
  return edges.every(([u, v]) => place[u] < place[v]);
}

// Every permutation, checked. Factorial and exact, so the count is a fact.
function countValidOrders(n: number, edges: number[][]): number {
  const order = Array.from({ length: n }, (_, i) => i);
  let total = 0;

  const permute = (fixed: number): void => {
    if (fixed === n) {
      if (edgesPointForwards(n, edges, order)) total += 1;
      return;
    }
    for (let i = fixed; i < n; i += 1) {
      [order[fixed], order[i]] = [order[i], order[fixed]];
      permute(fixed + 1);
      [order[fixed], order[i]] = [order[i], order[fixed]];
    }
  };

  permute(0);
  return total;
}

// Independent check: is any node reachable from itself in one or more steps.
function hasCycle(n: number, edges: number[][]): boolean {
  const reach = Array.from({ length: n }, () => new Array(n).fill(false));
  for (const [u, v] of edges) reach[u][v] = true;
  for (let k = 0; k < n; k += 1)
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1)
        if (reach[i][k] && reach[k][j]) reach[i][j] = true;
  for (let i = 0; i < n; i += 1) if (reach[i][i]) return true;
  return false;
}

function show(order: number[] | null): string {
  return order === null ? "none" : order.join(" ");
}

function label(edges: number[][]): string {
  return "[" + edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ") + "]";
}

const CASES: [number, number[][]][] = [
  [4, [[0, 1], [0, 2], [1, 3], [2, 3]]],
  [4, [[3, 2], [2, 1], [1, 0]]],
  [3, [[0, 1], [1, 2], [2, 0]]],
];

console.log("edges".padEnd(30) + " " + "Kahn".padEnd(12) + " " + "DFS".padEnd(12) + " " + "valid orders");
for (const [n, edges] of CASES) {
  console.log(
    label(edges).padEnd(30) + " " + show(kahn(n, edges)).padEnd(12) + " " +
    show(dfsOrder(n, edges)).padEnd(12) + " " + countValidOrders(n, edges),
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 5150n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let dags = 0;
let kahnValid = 0;
let dfsValid = 0;
let agreed = 0;
let cyclic = 0;
let kahnCaught = 0;
let dfsCaught = 0;
const same = (a: number[] | null, b: number[] | null): boolean => a !== null && b !== null && a.length === b.length && a.every((x, i) => x === b[i]);
for (let t = 0; t < trials; t += 1) {
  const n = 3 + rand(4);
  // Random edges in both directions, so roughly half the graphs hold a cycle.
  const edges: number[][] = [];
  for (let u = 0; u < n; u += 1)
    for (let v = 0; v < n; v += 1)
      if (u !== v && rand(5) === 0) edges.push([u, v]);
  if (hasCycle(n, edges)) {
    cyclic += 1;
    if (kahn(n, edges) === null) kahnCaught += 1;
    if (dfsOrder(n, edges) === null) dfsCaught += 1;
    continue;
  }
  dags += 1;
  const a = kahn(n, edges);
  const b = dfsOrder(n, edges);
  if (edgesPointForwards(n, edges, a)) kahnValid += 1;
  if (edgesPointForwards(n, edges, b)) dfsValid += 1;
  if (same(a, b)) agreed += 1;
}

const row = (text: string, value: number): string => "  " + text.padEnd(40) + " " + String(value).padStart(6);

console.log();
console.log(\`over \${trials} random graphs on 3 to 6 nodes:\`);
console.log(row("graphs that were acyclic", dags));
console.log(row("Kahn's order had every edge forwards", kahnValid));
console.log(row("the DFS order had every edge forwards", dfsValid));
console.log(row("the two produced the same order", agreed));
console.log();
console.log(row("graphs holding a cycle", cyclic));
console.log(row("Kahn emitted fewer than n nodes", kahnCaught));
console.log(row("DFS walked into a half-finished node", dfsCaught));

console.log();
console.log("Both algorithms are correct on every acyclic graph, and both refuse");
console.log("every cyclic one -- the cycle check is not an extra pass, it is a");
console.log("count in one case and a colour in the other.");
console.log();
console.log("The number that matters for everything after this is the last one in");
console.log(\`the first block. The two algorithms agreed on only \${agreed} of \${dags} graphs.\`);
console.log("They are both right. There is usually more than one valid order, and");
console.log("the demo table's third column says how many: a diamond has two, a path");
console.log("has exactly one, and a cycle has none. Any code that depends on getting");
console.log("a particular order is depending on which algorithm you picked.");
`,
            },
            {
              lang: "java",
              code: `// Two algorithms for the same job, and the cycle check that comes free.
//
// A topological order lists the nodes so that every edge points forwards. There
// are two standard ways to produce one and they are not variations on each
// other -- they are opposite ideas.
//
//   Kahn    -- repeatedly take a node nothing points at. Front to back.
//   DFS     -- finish a node only after everything it points at is finished,
//              then reverse the finishing order. Back to front.
//
// Both are linear. Both detect a cycle, and neither needs an extra pass to do
// it: Kahn notices it emitted fewer than n nodes, DFS notices it walked into a
// node it is still in the middle of.
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Main {
    static List<Integer>[] outgoing(int n, int[][] edges) {
        @SuppressWarnings("unchecked")
        List<Integer>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : edges) adj[e[0]].add(e[1]);
        return adj;
    }

    /** Take a node nothing points at, remove it, repeat. */
    static List<Integer> kahn(int n, int[][] edges) {
        List<Integer>[] adj = outgoing(n, edges);
        int[] indeg = new int[n];
        for (int[] e : edges) indeg[e[1]]++;
        List<Integer> ready = new ArrayList<>();
        for (int v = 0; v < n; v++) if (indeg[v] == 0) ready.add(v);
        List<Integer> order = new ArrayList<>();
        int head = 0;
        while (head < ready.size()) {
            int at = ready.get(head++);
            order.add(at);
            for (int nxt : adj[at]) {
                if (--indeg[nxt] == 0) ready.add(nxt);
            }
        }
        // Fewer than n emitted means some nodes never reached indegree zero,
        // which can only happen if they are pointing at each other.
        return order.size() == n ? order : null;
    }

    static boolean visit(List<Integer>[] adj, int[] colour, List<Integer> finished, int at) {
        boolean cycle = false;
        colour[at] = 1;
        for (int nxt : adj[at]) {
            if (colour[nxt] == 1) cycle = true;
            else if (colour[nxt] == 0) cycle |= visit(adj, colour, finished, nxt);
        }
        colour[at] = 2;
        finished.add(at);
        return cycle;
    }

    /**
     * Finish a node after everything below it, then reverse.
     *
     * <p>The three colours are the cycle check. White is untouched, grey is
     * "started, not finished", black is finished. Walking into a grey node means
     * walking into the path currently being explored -- a cycle.
     */
    static List<Integer> dfsOrder(int n, int[][] edges) {
        List<Integer>[] adj = outgoing(n, edges);
        int[] colour = new int[n];
        List<Integer> finished = new ArrayList<>();
        boolean foundCycle = false;
        for (int v = 0; v < n; v++)
            if (colour[v] == 0) foundCycle |= visit(adj, colour, finished, v);
        if (foundCycle) return null;
        Collections.reverse(finished);
        return finished;
    }

    /** The definition: in a valid order, every edge goes left to right. */
    static boolean edgesPointForwards(int n, int[][] edges, List<Integer> order) {
        if (order == null || order.size() != n) return false;
        int[] place = new int[n];
        for (int i = 0; i < n; i++) place[order.get(i)] = i;
        for (int[] e : edges) if (place[e[0]] >= place[e[1]]) return false;
        return true;
    }

    static void permute(int n, int[][] edges, int[] order, int fixed, int[] total) {
        if (fixed == n) {
            List<Integer> as = new ArrayList<>();
            for (int x : order) as.add(x);
            if (edgesPointForwards(n, edges, as)) total[0]++;
            return;
        }
        for (int i = fixed; i < n; i++) {
            int tmp = order[fixed];
            order[fixed] = order[i];
            order[i] = tmp;
            permute(n, edges, order, fixed + 1, total);
            tmp = order[fixed];
            order[fixed] = order[i];
            order[i] = tmp;
        }
    }

    /** Every permutation, checked. Factorial and exact, so the count is a fact. */
    static int countValidOrders(int n, int[][] edges) {
        int[] order = new int[n];
        for (int i = 0; i < n; i++) order[i] = i;
        int[] total = new int[1];
        permute(n, edges, order, 0, total);
        return total[0];
    }

    /** Independent check: is any node reachable from itself in one or more steps. */
    static boolean hasCycle(int n, int[][] edges) {
        boolean[][] reach = new boolean[n][n];
        for (int[] e : edges) reach[e[0]][e[1]] = true;
        for (int k = 0; k < n; k++)
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++)
                    if (reach[i][k] && reach[k][j]) reach[i][j] = true;
        for (int i = 0; i < n; i++) if (reach[i][i]) return true;
        return false;
    }

    static String show(List<Integer> order) {
        if (order == null) return "none";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < order.size(); i++) {
            if (i > 0) sb.append(" ");
            sb.append(order.get(i));
        }
        return sb.toString();
    }

    static String label(int[][] edges) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < edges.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(edges[i][0]).append("->").append(edges[i][1]);
        }
        return sb.append("]").toString();
    }

    // The same linear congruential generator in every language, so the random
    // graphs below are the same graphs whichever translation is run.
    static long seed = 5150L;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    static String row(String text, int value) {
        return String.format("  %-40s %6d", text, value);
    }

    public static void main(String[] args) {
        int[] caseN = {4, 4, 3};
        int[][][] caseEdges = {
            {{0, 1}, {0, 2}, {1, 3}, {2, 3}},
            {{3, 2}, {2, 1}, {1, 0}},
            {{0, 1}, {1, 2}, {2, 0}},
        };

        System.out.printf("%-30s %-12s %-12s %s%n", "edges", "Kahn", "DFS", "valid orders");
        for (int c = 0; c < caseN.length; c++) {
            System.out.printf("%-30s %-12s %-12s %d%n", label(caseEdges[c]),
                show(kahn(caseN[c], caseEdges[c])), show(dfsOrder(caseN[c], caseEdges[c])),
                countValidOrders(caseN[c], caseEdges[c]));
        }

        int trials = 3000;
        int dags = 0, kahnValid = 0, dfsValid = 0, agreed = 0;
        int cyclic = 0, kahnCaught = 0, dfsCaught = 0;
        for (int t = 0; t < trials; t++) {
            int n = 3 + rand(4);
            // Random edges in both directions, so roughly half hold a cycle.
            List<int[]> built = new ArrayList<>();
            for (int u = 0; u < n; u++)
                for (int v = 0; v < n; v++)
                    if (u != v && rand(5) == 0) built.add(new int[] {u, v});
            int[][] edges = built.toArray(new int[0][]);
            if (hasCycle(n, edges)) {
                cyclic++;
                if (kahn(n, edges) == null) kahnCaught++;
                if (dfsOrder(n, edges) == null) dfsCaught++;
                continue;
            }
            dags++;
            List<Integer> a = kahn(n, edges);
            List<Integer> b = dfsOrder(n, edges);
            if (edgesPointForwards(n, edges, a)) kahnValid++;
            if (edgesPointForwards(n, edges, b)) dfsValid++;
            if (a != null && a.equals(b)) agreed++;
        }

        System.out.println();
        System.out.println("over " + trials + " random graphs on 3 to 6 nodes:");
        System.out.println(row("graphs that were acyclic", dags));
        System.out.println(row("Kahn's order had every edge forwards", kahnValid));
        System.out.println(row("the DFS order had every edge forwards", dfsValid));
        System.out.println(row("the two produced the same order", agreed));
        System.out.println();
        System.out.println(row("graphs holding a cycle", cyclic));
        System.out.println(row("Kahn emitted fewer than n nodes", kahnCaught));
        System.out.println(row("DFS walked into a half-finished node", dfsCaught));

        System.out.println();
        System.out.println("Both algorithms are correct on every acyclic graph, and both refuse");
        System.out.println("every cyclic one -- the cycle check is not an extra pass, it is a");
        System.out.println("count in one case and a colour in the other.");
        System.out.println();
        System.out.println("The number that matters for everything after this is the last one in");
        System.out.println("the first block. The two algorithms agreed on only " + agreed + " of "
            + dags + " graphs.");
        System.out.println("They are both right. There is usually more than one valid order, and");
        System.out.println("the demo table's third column says how many: a diamond has two, a path");
        System.out.println("has exactly one, and a cycle has none. Any code that depends on getting");
        System.out.println("a particular order is depending on which algorithm you picked.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Two algorithms for the same job, and the cycle check that comes free.
//
// A topological order lists the nodes so that every edge points forwards. There
// are two standard ways to produce one and they are not variations on each
// other -- they are opposite ideas.
//
//   Kahn    -- repeatedly take a node nothing points at. Front to back.
//   DFS     -- finish a node only after everything it points at is finished,
//              then reverse the finishing order. Back to front.
//
// Both are linear. Both detect a cycle, and neither needs an extra pass to do
// it: Kahn notices it emitted fewer than n nodes, DFS notices it walked into a
// node it is still in the middle of.
#include <algorithm>
#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

using Arrow = std::pair<int, int>;
using Order = std::vector<int>;

std::vector<std::vector<int>> outgoing(int n, const std::vector<Arrow>& edges) {
    std::vector<std::vector<int>> adj(n);
    for (const Arrow& e : edges) adj[e.first].push_back(e.second);
    return adj;
}

// Take a node nothing points at, remove it, repeat. An empty result means
// the graph holds a cycle.
Order kahn(int n, const std::vector<Arrow>& edges) {
    std::vector<std::vector<int>> adj = outgoing(n, edges);
    std::vector<int> indeg(n, 0);
    for (const Arrow& e : edges) indeg[e.second]++;
    Order ready;
    for (int v = 0; v < n; v++)
        if (indeg[v] == 0) ready.push_back(v);
    Order order;
    size_t head = 0;
    while (head < ready.size()) {
        int at = ready[head++];
        order.push_back(at);
        for (int nxt : adj[at])
            if (--indeg[nxt] == 0) ready.push_back(nxt);
    }
    // Fewer than n emitted means some nodes never reached indegree zero, which
    // can only happen if they are pointing at each other.
    if (static_cast<int>(order.size()) != n) return Order();
    return order;
}

bool visit(const std::vector<std::vector<int>>& adj, std::vector<int>& colour,
           Order& finished, int at) {
    bool cycle = false;
    colour[at] = 1;
    for (int nxt : adj[at]) {
        if (colour[nxt] == 1) cycle = true;
        else if (colour[nxt] == 0) cycle = visit(adj, colour, finished, nxt) || cycle;
    }
    colour[at] = 2;
    finished.push_back(at);
    return cycle;
}

// Finish a node after everything below it, then reverse.
//
// The three colours are the cycle check. White is untouched, grey is
// "started, not finished", black is finished. Walking into a grey node means
// walking into the path currently being explored -- a cycle.
Order dfs_order(int n, const std::vector<Arrow>& edges) {
    std::vector<std::vector<int>> adj = outgoing(n, edges);
    std::vector<int> colour(n, 0);
    Order finished;
    bool found_cycle = false;
    for (int v = 0; v < n; v++)
        if (colour[v] == 0) found_cycle = visit(adj, colour, finished, v) || found_cycle;
    if (found_cycle) return Order();
    std::reverse(finished.begin(), finished.end());
    return finished;
}

// The definition: in a valid order, every edge goes left to right.
bool edges_point_forwards(int n, const std::vector<Arrow>& edges, const Order& order) {
    if (static_cast<int>(order.size()) != n) return false;
    std::vector<int> place(n, 0);
    for (int i = 0; i < n; i++) place[order[i]] = i;
    for (const Arrow& e : edges)
        if (place[e.first] >= place[e.second]) return false;
    return true;
}

void permute(int n, const std::vector<Arrow>& edges, Order& order, int fixed, int& total) {
    if (fixed == n) {
        if (edges_point_forwards(n, edges, order)) total++;
        return;
    }
    for (int i = fixed; i < n; i++) {
        std::swap(order[fixed], order[i]);
        permute(n, edges, order, fixed + 1, total);
        std::swap(order[fixed], order[i]);
    }
}

// Every permutation, checked. Factorial and exact, so the count is a fact.
int count_valid_orders(int n, const std::vector<Arrow>& edges) {
    Order order(n);
    for (int i = 0; i < n; i++) order[i] = i;
    int total = 0;
    permute(n, edges, order, 0, total);
    return total;
}

// Independent check: is any node reachable from itself in one or more steps.
bool has_cycle(int n, const std::vector<Arrow>& edges) {
    std::vector<std::vector<bool>> reach(n, std::vector<bool>(n, false));
    for (const Arrow& e : edges) reach[e.first][e.second] = true;
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (reach[i][k] && reach[k][j]) reach[i][j] = true;
    for (int i = 0; i < n; i++)
        if (reach[i][i]) return true;
    return false;
}

std::string show(const Order& order) {
    if (order.empty()) return "none";
    std::string s;
    for (size_t i = 0; i < order.size(); i++) {
        if (i > 0) s += " ";
        s += std::to_string(order[i]);
    }
    return s;
}

std::string label(const std::vector<Arrow>& edges) {
    std::string s = "[";
    for (size_t i = 0; i < edges.size(); i++) {
        if (i > 0) s += ", ";
        s += std::to_string(edges[i].first) + "->" + std::to_string(edges[i].second);
    }
    return s + "]";
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
long long seed = 5150;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

void row(const std::string& text, int value) {
    std::cout << "  " << std::left << std::setw(40) << text << " " << std::right
              << std::setw(6) << value << "\\n";
}

int main() {
    std::vector<int> case_n = {4, 4, 3};
    std::vector<std::vector<Arrow>> cases = {
        {{0, 1}, {0, 2}, {1, 3}, {2, 3}},
        {{3, 2}, {2, 1}, {1, 0}},
        {{0, 1}, {1, 2}, {2, 0}},
    };

    std::cout << std::left << std::setw(30) << "edges" << " " << std::setw(12) << "Kahn"
              << " " << std::setw(12) << "DFS" << " " << "valid orders" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        std::cout << std::left << std::setw(30) << label(cases[c]) << " " << std::setw(12)
                  << show(kahn(case_n[c], cases[c])) << " " << std::setw(12)
                  << show(dfs_order(case_n[c], cases[c])) << " "
                  << count_valid_orders(case_n[c], cases[c]) << "\\n";
    }

    int trials = 3000;
    int dags = 0, kahn_valid = 0, dfs_valid = 0, agreed = 0;
    int cyclic = 0, kahn_caught = 0, dfs_caught = 0;
    for (int t = 0; t < trials; t++) {
        int n = 3 + rand_below(4);
        // Random edges in both directions, so roughly half hold a cycle.
        std::vector<Arrow> edges;
        for (int u = 0; u < n; u++)
            for (int v = 0; v < n; v++)
                if (u != v && rand_below(5) == 0) edges.push_back({u, v});
        if (has_cycle(n, edges)) {
            cyclic++;
            if (kahn(n, edges).empty()) kahn_caught++;
            if (dfs_order(n, edges).empty()) dfs_caught++;
            continue;
        }
        dags++;
        Order a = kahn(n, edges);
        Order b = dfs_order(n, edges);
        if (edges_point_forwards(n, edges, a)) kahn_valid++;
        if (edges_point_forwards(n, edges, b)) dfs_valid++;
        if (a == b) agreed++;
    }

    std::cout << "\\n";
    std::cout << "over " << trials << " random graphs on 3 to 6 nodes:\\n";
    row("graphs that were acyclic", dags);
    row("Kahn's order had every edge forwards", kahn_valid);
    row("the DFS order had every edge forwards", dfs_valid);
    row("the two produced the same order", agreed);
    std::cout << "\\n";
    row("graphs holding a cycle", cyclic);
    row("Kahn emitted fewer than n nodes", kahn_caught);
    row("DFS walked into a half-finished node", dfs_caught);

    std::cout << "\\n";
    std::cout << "Both algorithms are correct on every acyclic graph, and both refuse\\n";
    std::cout << "every cyclic one -- the cycle check is not an extra pass, it is a\\n";
    std::cout << "count in one case and a colour in the other.\\n";
    std::cout << "\\n";
    std::cout << "The number that matters for everything after this is the last one in\\n";
    std::cout << "the first block. The two algorithms agreed on only " << agreed << " of " << dags
              << " graphs.\\n";
    std::cout << "They are both right. There is usually more than one valid order, and\\n";
    std::cout << "the demo table's third column says how many: a diamond has two, a path\\n";
    std::cout << "has exactly one, and a cycle has none. Any code that depends on getting\\n";
    std::cout << "a particular order is depending on which algorithm you picked.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Two algorithms for the same job, and the cycle check that comes free.
//
// A topological order lists the nodes so that every edge points forwards. There
// are two standard ways to produce one and they are not variations on each
// other -- they are opposite ideas.
//
//   Kahn    -- repeatedly take a node nothing points at. Front to back.
//   DFS     -- finish a node only after everything it points at is finished,
//              then reverse the finishing order. Back to front.
//
// Both are linear. Both detect a cycle, and neither needs an extra pass to do
// it: Kahn notices it emitted fewer than n nodes, DFS notices it walked into a
// node it is still in the middle of.
type Arrow = (usize, usize);

fn outgoing(n: usize, edges: &[Arrow]) -> Vec<Vec<usize>> {
    let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
    for &(u, v) in edges {
        adj[u].push(v);
    }
    adj
}

/// Take a node nothing points at, remove it, repeat.
fn kahn(n: usize, edges: &[Arrow]) -> Option<Vec<usize>> {
    let adj = outgoing(n, edges);
    let mut indeg = vec![0usize; n];
    for &(_, v) in edges {
        indeg[v] += 1;
    }
    let mut ready: Vec<usize> = (0..n).filter(|&v| indeg[v] == 0).collect();
    let mut order: Vec<usize> = Vec::new();
    let mut head = 0;
    while head < ready.len() {
        let at = ready[head];
        head += 1;
        order.push(at);
        for idx in 0..adj[at].len() {
            let nxt = adj[at][idx];
            indeg[nxt] -= 1;
            if indeg[nxt] == 0 {
                ready.push(nxt);
            }
        }
    }
    // Fewer than n emitted means some nodes never reached indegree zero, which
    // can only happen if they are pointing at each other.
    if order.len() == n {
        Some(order)
    } else {
        None
    }
}

fn visit(adj: &[Vec<usize>], colour: &mut [u8], finished: &mut Vec<usize>, at: usize) -> bool {
    let mut cycle = false;
    colour[at] = 1;
    for idx in 0..adj[at].len() {
        let nxt = adj[at][idx];
        if colour[nxt] == 1 {
            cycle = true;
        } else if colour[nxt] == 0 {
            cycle |= visit(adj, colour, finished, nxt);
        }
    }
    colour[at] = 2;
    finished.push(at);
    cycle
}

/// Finish a node after everything below it, then reverse.
///
/// The three colours are the cycle check. White is untouched, grey is
/// "started, not finished", black is finished. Walking into a grey node means
/// walking into the path currently being explored -- a cycle.
fn dfs_order(n: usize, edges: &[Arrow]) -> Option<Vec<usize>> {
    let adj = outgoing(n, edges);
    let mut colour = vec![0u8; n];
    let mut finished: Vec<usize> = Vec::new();
    let mut found_cycle = false;
    for v in 0..n {
        if colour[v] == 0 {
            found_cycle |= visit(&adj, &mut colour, &mut finished, v);
        }
    }
    if found_cycle {
        return None;
    }
    finished.reverse();
    Some(finished)
}

/// The definition: in a valid order, every edge goes left to right.
fn edges_point_forwards(n: usize, edges: &[Arrow], order: &Option<Vec<usize>>) -> bool {
    let order = match order {
        Some(o) if o.len() == n => o,
        _ => return false,
    };
    let mut place = vec![0usize; n];
    for (i, &v) in order.iter().enumerate() {
        place[v] = i;
    }
    edges.iter().all(|&(u, v)| place[u] < place[v])
}

fn permute(n: usize, edges: &[Arrow], order: &mut Vec<usize>, fixed: usize, total: &mut u64) {
    if fixed == n {
        if edges_point_forwards(n, edges, &Some(order.clone())) {
            *total += 1;
        }
        return;
    }
    for i in fixed..n {
        order.swap(fixed, i);
        permute(n, edges, order, fixed + 1, total);
        order.swap(fixed, i);
    }
}

/// Every permutation, checked. Factorial and exact, so the count is a fact.
fn count_valid_orders(n: usize, edges: &[Arrow]) -> u64 {
    let mut order: Vec<usize> = (0..n).collect();
    let mut total = 0;
    permute(n, edges, &mut order, 0, &mut total);
    total
}

/// Independent check: is any node reachable from itself in one or more steps.
fn has_cycle(n: usize, edges: &[Arrow]) -> bool {
    let mut reach = vec![vec![false; n]; n];
    for &(u, v) in edges {
        reach[u][v] = true;
    }
    for k in 0..n {
        for i in 0..n {
            for j in 0..n {
                if reach[i][k] && reach[k][j] {
                    reach[i][j] = true;
                }
            }
        }
    }
    (0..n).any(|i| reach[i][i])
}

fn show(order: &Option<Vec<usize>>) -> String {
    match order {
        None => "none".to_string(),
        Some(o) => o
            .iter()
            .map(|x| x.to_string())
            .collect::<Vec<String>>()
            .join(" "),
    }
}

fn label(edges: &[Arrow]) -> String {
    let cells: Vec<String> = edges.iter().map(|&(u, v)| format!("{}->{}", u, v)).collect();
    format!("[{}]", cells.join(", "))
}

/// The same linear congruential generator in every language, so the random
/// graphs below are the same graphs whichever translation is run.
struct Rng {
    seed: i64,
}

impl Rng {
    fn next(&mut self, n: i64) -> i64 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        self.seed / 65536 % n
    }
}

fn row(text: &str, value: u64) {
    println!("  {:<40} {:>6}", text, value);
}

fn main() {
    let case_n = [4usize, 4, 3];
    let cases: Vec<Vec<Arrow>> = vec![
        vec![(0, 1), (0, 2), (1, 3), (2, 3)],
        vec![(3, 2), (2, 1), (1, 0)],
        vec![(0, 1), (1, 2), (2, 0)],
    ];

    println!("{:<30} {:<12} {:<12} {}", "edges", "Kahn", "DFS", "valid orders");
    for c in 0..cases.len() {
        println!(
            "{:<30} {:<12} {:<12} {}",
            label(&cases[c]),
            show(&kahn(case_n[c], &cases[c])),
            show(&dfs_order(case_n[c], &cases[c])),
            count_valid_orders(case_n[c], &cases[c])
        );
    }

    let mut rng = Rng { seed: 5150 };
    let trials = 3000;
    let (mut dags, mut kahn_valid, mut dfs_valid, mut agreed) = (0u64, 0u64, 0u64, 0u64);
    let (mut cyclic, mut kahn_caught, mut dfs_caught) = (0u64, 0u64, 0u64);
    for _ in 0..trials {
        let n = 3 + rng.next(4) as usize;
        // Random edges in both directions, so roughly half hold a cycle.
        let mut edges: Vec<Arrow> = Vec::new();
        for u in 0..n {
            for v in 0..n {
                if u != v && rng.next(5) == 0 {
                    edges.push((u, v));
                }
            }
        }
        if has_cycle(n, &edges) {
            cyclic += 1;
            if kahn(n, &edges).is_none() {
                kahn_caught += 1;
            }
            if dfs_order(n, &edges).is_none() {
                dfs_caught += 1;
            }
            continue;
        }
        dags += 1;
        let a = kahn(n, &edges);
        let b = dfs_order(n, &edges);
        if edges_point_forwards(n, &edges, &a) {
            kahn_valid += 1;
        }
        if edges_point_forwards(n, &edges, &b) {
            dfs_valid += 1;
        }
        if a == b {
            agreed += 1;
        }
    }

    println!();
    println!("over {} random graphs on 3 to 6 nodes:", trials);
    row("graphs that were acyclic", dags);
    row("Kahn's order had every edge forwards", kahn_valid);
    row("the DFS order had every edge forwards", dfs_valid);
    row("the two produced the same order", agreed);
    println!();
    row("graphs holding a cycle", cyclic);
    row("Kahn emitted fewer than n nodes", kahn_caught);
    row("DFS walked into a half-finished node", dfs_caught);

    println!();
    println!("Both algorithms are correct on every acyclic graph, and both refuse");
    println!("every cyclic one -- the cycle check is not an extra pass, it is a");
    println!("count in one case and a colour in the other.");
    println!();
    println!("The number that matters for everything after this is the last one in");
    println!(
        "the first block. The two algorithms agreed on only {} of {} graphs.",
        agreed, dags
    );
    println!("They are both right. There is usually more than one valid order, and");
    println!("the demo table's third column says how many: a diamond has two, a path");
    println!("has exactly one, and a cycle has none. Any code that depends on getting");
    println!("a particular order is depending on which algorithm you picked.");
}
`,
            },
            {
              lang: "go",
              code: `// Two algorithms for the same job, and the cycle check that comes free.
//
// A topological order lists the nodes so that every edge points forwards. There
// are two standard ways to produce one and they are not variations on each
// other -- they are opposite ideas.
//
//	Kahn    -- repeatedly take a node nothing points at. Front to back.
//	DFS     -- finish a node only after everything it points at is finished,
//	           then reverse the finishing order. Back to front.
//
// Both are linear. Both detect a cycle, and neither needs an extra pass to do
// it: Kahn notices it emitted fewer than n nodes, DFS notices it walked into a
// node it is still in the middle of.
package main

import (
	"fmt"
	"strings"
)

// Arrow is a directed edge.
type Arrow struct {
	U, V int
}

func outgoing(n int, edges []Arrow) [][]int {
	adj := make([][]int, n)
	for _, e := range edges {
		adj[e.U] = append(adj[e.U], e.V)
	}
	return adj
}

// kahn repeatedly takes a node nothing points at. A nil result means the graph
// holds a cycle.
func kahn(n int, edges []Arrow) []int {
	adj := outgoing(n, edges)
	indeg := make([]int, n)
	for _, e := range edges {
		indeg[e.V]++
	}
	var ready []int
	for v := 0; v < n; v++ {
		if indeg[v] == 0 {
			ready = append(ready, v)
		}
	}
	var order []int
	head := 0
	for head < len(ready) {
		at := ready[head]
		head++
		order = append(order, at)
		for _, nxt := range adj[at] {
			indeg[nxt]--
			if indeg[nxt] == 0 {
				ready = append(ready, nxt)
			}
		}
	}
	// Fewer than n emitted means some nodes never reached indegree zero, which
	// can only happen if they are pointing at each other.
	if len(order) != n {
		return nil
	}
	return order
}

func visit(adj [][]int, colour []int, finished *[]int, at int) bool {
	cycle := false
	colour[at] = 1
	for _, nxt := range adj[at] {
		if colour[nxt] == 1 {
			cycle = true
		} else if colour[nxt] == 0 {
			if visit(adj, colour, finished, nxt) {
				cycle = true
			}
		}
	}
	colour[at] = 2
	*finished = append(*finished, at)
	return cycle
}

// dfsOrder finishes a node after everything below it, then reverses.
//
// The three colours are the cycle check. White is untouched, grey is
// "started, not finished", black is finished. Walking into a grey node means
// walking into the path currently being explored -- a cycle.
func dfsOrder(n int, edges []Arrow) []int {
	adj := outgoing(n, edges)
	colour := make([]int, n)
	var finished []int
	foundCycle := false
	for v := 0; v < n; v++ {
		if colour[v] == 0 {
			if visit(adj, colour, &finished, v) {
				foundCycle = true
			}
		}
	}
	if foundCycle {
		return nil
	}
	for i, j := 0, len(finished)-1; i < j; i, j = i+1, j-1 {
		finished[i], finished[j] = finished[j], finished[i]
	}
	return finished
}

// edgesPointForwards is the definition: in a valid order every edge goes left
// to right.
func edgesPointForwards(n int, edges []Arrow, order []int) bool {
	if order == nil || len(order) != n {
		return false
	}
	place := make([]int, n)
	for i, v := range order {
		place[v] = i
	}
	for _, e := range edges {
		if place[e.U] >= place[e.V] {
			return false
		}
	}
	return true
}

func permute(n int, edges []Arrow, order []int, fixed int, total *int) {
	if fixed == n {
		if edgesPointForwards(n, edges, order) {
			*total++
		}
		return
	}
	for i := fixed; i < n; i++ {
		order[fixed], order[i] = order[i], order[fixed]
		permute(n, edges, order, fixed+1, total)
		order[fixed], order[i] = order[i], order[fixed]
	}
}

// countValidOrders checks every permutation. Factorial and exact, so the count
// is a fact.
func countValidOrders(n int, edges []Arrow) int {
	order := make([]int, n)
	for i := range order {
		order[i] = i
	}
	total := 0
	permute(n, edges, order, 0, &total)
	return total
}

// hasCycle is the independent check: is any node reachable from itself.
func hasCycle(n int, edges []Arrow) bool {
	reach := make([][]bool, n)
	for i := range reach {
		reach[i] = make([]bool, n)
	}
	for _, e := range edges {
		reach[e.U][e.V] = true
	}
	for k := 0; k < n; k++ {
		for i := 0; i < n; i++ {
			for j := 0; j < n; j++ {
				if reach[i][k] && reach[k][j] {
					reach[i][j] = true
				}
			}
		}
	}
	for i := 0; i < n; i++ {
		if reach[i][i] {
			return true
		}
	}
	return false
}

func sameOrder(a, b []int) bool {
	if a == nil || b == nil || len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func show(order []int) string {
	if order == nil {
		return "none"
	}
	cells := make([]string, len(order))
	for i, v := range order {
		cells[i] = fmt.Sprint(v)
	}
	return strings.Join(cells, " ")
}

func label(edges []Arrow) string {
	cells := make([]string, len(edges))
	for i, e := range edges {
		cells[i] = fmt.Sprintf("%d->%d", e.U, e.V)
	}
	return "[" + strings.Join(cells, ", ") + "]"
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
var seed int64 = 5150

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func row(text string, value int) {
	fmt.Printf("  %-40s %6d\\n", text, value)
}

func main() {
	caseN := []int{4, 4, 3}
	cases := [][]Arrow{
		{{0, 1}, {0, 2}, {1, 3}, {2, 3}},
		{{3, 2}, {2, 1}, {1, 0}},
		{{0, 1}, {1, 2}, {2, 0}},
	}

	fmt.Printf("%-30s %-12s %-12s %s\\n", "edges", "Kahn", "DFS", "valid orders")
	for c := range cases {
		fmt.Printf("%-30s %-12s %-12s %d\\n", label(cases[c]),
			show(kahn(caseN[c], cases[c])), show(dfsOrder(caseN[c], cases[c])),
			countValidOrders(caseN[c], cases[c]))
	}

	trials := 3000
	dags, kahnValid, dfsValid, agreed := 0, 0, 0, 0
	cyclic, kahnCaught, dfsCaught := 0, 0, 0
	for t := 0; t < trials; t++ {
		n := 3 + randBelow(4)
		// Random edges in both directions, so roughly half hold a cycle.
		var edges []Arrow
		for u := 0; u < n; u++ {
			for v := 0; v < n; v++ {
				if u != v && randBelow(5) == 0 {
					edges = append(edges, Arrow{u, v})
				}
			}
		}
		if hasCycle(n, edges) {
			cyclic++
			if kahn(n, edges) == nil {
				kahnCaught++
			}
			if dfsOrder(n, edges) == nil {
				dfsCaught++
			}
			continue
		}
		dags++
		a := kahn(n, edges)
		b := dfsOrder(n, edges)
		if edgesPointForwards(n, edges, a) {
			kahnValid++
		}
		if edgesPointForwards(n, edges, b) {
			dfsValid++
		}
		if sameOrder(a, b) {
			agreed++
		}
	}

	fmt.Println()
	fmt.Printf("over %d random graphs on 3 to 6 nodes:\\n", trials)
	row("graphs that were acyclic", dags)
	row("Kahn's order had every edge forwards", kahnValid)
	row("the DFS order had every edge forwards", dfsValid)
	row("the two produced the same order", agreed)
	fmt.Println()
	row("graphs holding a cycle", cyclic)
	row("Kahn emitted fewer than n nodes", kahnCaught)
	row("DFS walked into a half-finished node", dfsCaught)

	fmt.Println()
	fmt.Println("Both algorithms are correct on every acyclic graph, and both refuse")
	fmt.Println("every cyclic one -- the cycle check is not an extra pass, it is a")
	fmt.Println("count in one case and a colour in the other.")
	fmt.Println()
	fmt.Println("The number that matters for everything after this is the last one in")
	fmt.Printf("the first block. The two algorithms agreed on only %d of %d graphs.\\n", agreed, dags)
	fmt.Println("They are both right. There is usually more than one valid order, and")
	fmt.Println("the demo table's third column says how many: a diamond has two, a path")
	fmt.Println("has exactly one, and a cycle has none. Any code that depends on getting")
	fmt.Println("a particular order is depending on which algorithm you picked.")
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "graph-topological-order",
        kind: "graph",
        algorithm: "topological",
        title: "Taking a node nothing points at, over and over",
        lockAlgorithm: true,
      },
      pitfalls: [
        {
          title: "Using a visited set instead of three colours in the DFS version",
          body: "Two colours cannot tell \"I am still inside this node\" from \"I finished this node earlier\". A black node reached a second time is a diamond, which is fine; a grey node reached a second time is a cycle. Collapse them and the algorithm reports a cycle on every diamond, or on none.",
        },
        {
          title: "Adding a separate pass to check for cycles",
          body: "Neither algorithm needs one. Kahn compares the number of nodes it emitted against n; DFS already has the grey colour it needs. Both caught all 1,021 cyclic graphs in the measurement above with no extra work.",
        },
      ],
    },
    {
      id: "a-order-not-the-order",
      heading: "\"A\" order, not \"the\" order",
      body: [
        "Kahn's algorithm says: repeatedly take a node nothing points at. When more than one node qualifies \u2014 which is most of the time \u2014 it does not say which. That choice falls to whatever container is holding the ready nodes, and the container is usually picked without thinking about it.",
        "A queue gives them back in the order they became ready. A stack gives the most recently freed node first. A min-heap gives the smallest-numbered one. All three are correct: over 3,000 random acyclic graphs, every one of them produced an order with every edge pointing forwards, all 3,000 times. That is what topological sort promises, and it is all it promises.",
        "Only 66 of those 3,000 graphs had a single valid order. One had 720. So \"the topological order\" is not a thing that exists.",
        "Which means that if a problem asks for the lexicographically smallest order \u2014 and problems often do \u2014 that is a **different question with a different answer**. The min-heap gets it right on all 3,000. The queue got it on 1,521 and the stack on 107. Neither of those is a bug in the algorithm; they were never asked the question.",
        "The practical consequence is about tests. Asserting a specific output order pins the container you happened to use, and will fail the day somebody swaps a deque for a heap without changing what the code means. Assert the property \u2014 every edge points forwards \u2014 and the test survives.",
      ],
      examples: [
        {
          id: "which-order-you-get",
          title: "Queue, stack or heap: all correct, one of them smallest",
          lang: "python",
          code: `# "A" topological order, not "the". And how to ask for a specific one.
#
# Kahn's algorithm says: repeatedly take a node nothing points at. When more
# than one node qualifies -- which is most of the time -- it does not say which.
# That choice is left to whatever container is holding the ready nodes, and the
# container is usually picked without thinking about it.
#
#   a queue  -- ready nodes come out in the order they became ready
#   a stack  -- the most recently freed node goes first
#   a heap   -- the smallest-numbered ready node goes first
#
# All three are correct. Only one of them gives the lexicographically smallest
# order, which is what a problem statement means when it asks for "the" answer.
import heapq
from collections import deque


def kahn(n, edges, mode):
    """Kahn's algorithm with the ready set held three different ways."""
    adj = [[] for _ in range(n)]
    indeg = [0] * n
    for u, v in edges:
        adj[u].append(v)
        indeg[v] += 1
    ready = [v for v in range(n) if indeg[v] == 0]
    order = []
    if mode == "heap":
        heapq.heapify(ready)
    else:
        ready = deque(ready)
    while ready:
        if mode == "heap":
            at = heapq.heappop(ready)
        elif mode == "stack":
            at = ready.pop()
        else:
            at = ready.popleft()
        order.append(at)
        for nxt in adj[at]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                if mode == "heap":
                    heapq.heappush(ready, nxt)
                else:
                    ready.append(nxt)
    return order if len(order) == n else None


def edges_point_forwards(n, edges, order):
    if order is None or len(order) != n:
        return False
    place = [0] * n
    for i, v in enumerate(order):
        place[v] = i
    return all(place[u] < place[v] for u, v in edges)


def survey(n, edges):
    """Every permutation, checked: how many are valid, and which is smallest.

    Factorial, and the point of it is that nothing here is an opinion. The
    count of valid orders and the lexicographically smallest one are facts
    about the graph, not about an algorithm.
    """
    order = list(range(n))
    found = [0]
    best = [None]

    def permute(fixed):
        if fixed == n:
            if edges_point_forwards(n, edges, order):
                found[0] += 1
                if best[0] is None or order < best[0]:
                    best[0] = list(order)
            return
        for i in range(fixed, n):
            order[fixed], order[i] = order[i], order[fixed]
            permute(fixed + 1)
            order[fixed], order[i] = order[i], order[fixed]

    permute(0)
    return found[0], best[0]


def show(order):
    return "none" if order is None else " ".join(str(v) for v in order)


def label(edges):
    return "[" + ", ".join("%d->%d" % e for e in edges) + "]"


CASES = [
    (4, [(2, 3)]),
    (5, [(0, 1), (2, 3), (3, 4)]),
    (4, [(1, 0), (1, 2), (3, 2)]),
]

print("%-26s %-10s %-10s %-10s %s" % ("edges", "queue", "stack", "heap", "smallest"))
for n, edges in CASES:
    _, smallest = survey(n, edges)
    print("%-26s %-10s %-10s %-10s %s" % (
        label(edges), show(kahn(n, edges, "queue")), show(kahn(n, edges, "stack")),
        show(kahn(n, edges, "heap")), show(smallest)))

# The same linear congruential generator in every language, so the random
# graphs below are the same graphs whichever translation is run.
seed = 8080


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


trials = 3000
dags = 0
queue_valid = stack_valid = heap_valid = 0
queue_smallest = stack_smallest = heap_smallest = 0
only_one = 0
most_orders = 0
for _ in range(trials):
    n = 3 + rand(4)
    # Only forward edges, then relabel, so every graph is acyclic without
    # being trivially already sorted.
    labels = list(range(n))
    for i in range(n - 1, 0, -1):
        j = rand(i + 1)
        labels[i], labels[j] = labels[j], labels[i]
    edges = []
    for u in range(n):
        for v in range(u + 1, n):
            if rand(4) == 0:
                edges.append((labels[u], labels[v]))
    dags += 1
    count, smallest = survey(n, edges)
    if count == 1:
        only_one += 1
    if count > most_orders:
        most_orders = count
    a = kahn(n, edges, "queue")
    b = kahn(n, edges, "stack")
    c = kahn(n, edges, "heap")
    queue_valid += edges_point_forwards(n, edges, a)
    stack_valid += edges_point_forwards(n, edges, b)
    heap_valid += edges_point_forwards(n, edges, c)
    queue_smallest += a == smallest
    stack_smallest += b == smallest
    heap_smallest += c == smallest

print()
print("over %d random acyclic graphs on 3 to 6 nodes:" % dags)
print("  %-40s %6d" % ("queue order had every edge forwards", queue_valid))
print("  %-40s %6d" % ("stack order had every edge forwards", stack_valid))
print("  %-40s %6d" % ("heap order had every edge forwards", heap_valid))
print()
print("  %-40s %6d" % ("queue gave the smallest order", queue_smallest))
print("  %-40s %6d" % ("stack gave the smallest order", stack_smallest))
print("  %-40s %6d" % ("heap gave the smallest order", heap_smallest))
print()
print("  %-40s %6d" % ("graphs with exactly one valid order", only_one))
print("  %-40s %6d" % ("most valid orders any graph had", most_orders))

print()
print("All three containers are correct: every one of them produced an order")
print("with every edge pointing forwards, on all %d graphs. That is what" % dags)
print("topological sort promises, and it is all it promises.")
print()
print("Only %d of the %d graphs had a single valid order, and one graph had" % (only_one, dags))
print("%d of them. So \\"the topological order\\" is not a thing that exists. If a" % most_orders)
print("problem asks for the lexicographically smallest one, that is a different")
print("question, and it has a different answer: put the ready nodes in a min")
print("heap. The heap got it right on all %d graphs; the queue on %d and the" % (heap_smallest, queue_smallest))
print("stack on %d." % stack_smallest)
print()
print("The practical consequence is about tests. Asserting a specific order")
print("pins the container you happened to use. Assert the property -- every")
print("edge points forwards -- and the test survives a change of container.")
`,
          output: `edges                      queue      stack      heap       smallest
[2->3]                     0 1 2 3    2 3 1 0    0 1 2 3    0 1 2 3
[0->1, 2->3, 3->4]         0 2 1 3 4  2 3 4 0 1  0 1 2 3 4  0 1 2 3 4
[1->0, 1->2, 3->2]         1 3 0 2    3 1 2 0    1 0 3 2    1 0 3 2

over 3000 random acyclic graphs on 3 to 6 nodes:
  queue order had every edge forwards        3000
  stack order had every edge forwards        3000
  heap order had every edge forwards         3000

  queue gave the smallest order              1521
  stack gave the smallest order               107
  heap gave the smallest order               3000

  graphs with exactly one valid order          66
  most valid orders any graph had             720

All three containers are correct: every one of them produced an order
with every edge pointing forwards, on all 3000 graphs. That is what
topological sort promises, and it is all it promises.

Only 66 of the 3000 graphs had a single valid order, and one graph had
720 of them. So "the topological order" is not a thing that exists. If a
problem asks for the lexicographically smallest one, that is a different
question, and it has a different answer: put the ready nodes in a min
heap. The heap got it right on all 3000 graphs; the queue on 1521 and the
stack on 107.

The practical consequence is about tests. Asserting a specific order
pins the container you happened to use. Assert the property -- every
edge points forwards -- and the test survives a change of container.`,
          explanation:
            "The same algorithm with three containers for the ready set, scored against an exhaustive enumeration of every valid order. Note that correctness and lexicographic smallest are separate columns.",
          alternates: [
            {
              lang: "javascript",
              code: `// "A" topological order, not "the". And how to ask for a specific one.
//
// Kahn's algorithm says: repeatedly take a node nothing points at. When more
// than one node qualifies -- which is most of the time -- it does not say which.
// That choice is left to whatever container is holding the ready nodes, and the
// container is usually picked without thinking about it.
//
//   a queue  -- ready nodes come out in the order they became ready
//   a stack  -- the most recently freed node goes first
//   a heap   -- the smallest-numbered ready node goes first
//
// All three are correct. Only one of them gives the lexicographically smallest
// order, which is what a problem statement means when it asks for "the" answer.

// A binary min-heap of node numbers, so "heap" means the same thing here as
// it does in every other translation.
class Heap {
  constructor(items) {
    this.items = items.slice();
    for (let i = (this.items.length >> 1) - 1; i >= 0; i -= 1) this.sink(i);
  }

  sink(start) {
    let i = start;
    for (;;) {
      let small = i;
      for (const c of [2 * i + 1, 2 * i + 2])
        if (c < this.items.length && this.items[c] < this.items[small]) small = c;
      if (small === i) return;
      [this.items[i], this.items[small]] = [this.items[small], this.items[i]];
      i = small;
    }
  }

  push(x) {
    this.items.push(x);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.items[parent] <= this.items[i]) break;
      [this.items[i], this.items[parent]] = [this.items[parent], this.items[i]];
      i = parent;
    }
  }

  pop() {
    const top = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0) {
      this.items[0] = last;
      this.sink(0);
    }
    return top;
  }

  get size() {
    return this.items.length;
  }
}

// Kahn's algorithm with the ready set held three different ways.
function kahn(n, edges, mode) {
  const adj = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [u, v] of edges) {
    adj[u].push(v);
    indeg[v] += 1;
  }
  const start = [];
  for (let v = 0; v < n; v += 1) if (indeg[v] === 0) start.push(v);
  const order = [];
  const heap = mode === "heap" ? new Heap(start) : null;
  const line = start.slice();
  let head = 0;
  for (;;) {
    let at;
    if (mode === "heap") {
      if (heap.size === 0) break;
      at = heap.pop();
    } else if (mode === "stack") {
      if (line.length <= head) break;
      at = line.pop();
    } else {
      if (line.length <= head) break;
      at = line[head];
      head += 1;
    }
    order.push(at);
    for (const nxt of adj[at]) {
      indeg[nxt] -= 1;
      if (indeg[nxt] === 0) {
        if (mode === "heap") heap.push(nxt);
        else line.push(nxt);
      }
    }
  }
  return order.length === n ? order : null;
}

function edgesPointForwards(n, edges, order) {
  if (order === null || order.length !== n) return false;
  const place = new Array(n).fill(0);
  order.forEach((v, i) => {
    place[v] = i;
  });
  return edges.every(([u, v]) => place[u] < place[v]);
}

// Every permutation, checked: how many are valid, and which is smallest.
//
// Factorial, and the point of it is that nothing here is an opinion. The
// count of valid orders and the lexicographically smallest one are facts
// about the graph, not about an algorithm.
function survey(n, edges) {
  const order = Array.from({ length: n }, (_, i) => i);
  let found = 0;
  let best = null;

  const smaller = (a, b) => {
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return a[i] < b[i];
    }
    return false;
  };

  const permute = (fixed) => {
    if (fixed === n) {
      if (edgesPointForwards(n, edges, order)) {
        found += 1;
        if (best === null || smaller(order, best)) best = order.slice();
      }
      return;
    }
    for (let i = fixed; i < n; i += 1) {
      [order[fixed], order[i]] = [order[i], order[fixed]];
      permute(fixed + 1);
      [order[fixed], order[i]] = [order[i], order[fixed]];
    }
  };

  permute(0);
  return [found, best];
}

function show(order) {
  return order === null ? "none" : order.join(" ");
}

function label(edges) {
  return "[" + edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ") + "]";
}

const CASES = [
  [4, [[2, 3]]],
  [5, [[0, 1], [2, 3], [3, 4]]],
  [4, [[1, 0], [1, 2], [3, 2]]],
];

console.log(
  "edges".padEnd(26) + " " + "queue".padEnd(10) + " " + "stack".padEnd(10) + " " +
  "heap".padEnd(10) + " " + "smallest",
);
for (const [n, edges] of CASES) {
  const [, smallest] = survey(n, edges);
  console.log(
    label(edges).padEnd(26) + " " + show(kahn(n, edges, "queue")).padEnd(10) + " " +
    show(kahn(n, edges, "stack")).padEnd(10) + " " +
    show(kahn(n, edges, "heap")).padEnd(10) + " " + show(smallest),
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 8080n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let dags = 0;
let queueValid = 0;
let stackValid = 0;
let heapValid = 0;
let queueSmallest = 0;
let stackSmallest = 0;
let heapSmallest = 0;
let onlyOne = 0;
let mostOrders = 0;
const same = (a, b) => a !== null && b !== null && a.length === b.length && a.every((x, i) => x === b[i]);
for (let t = 0; t < trials; t += 1) {
  const n = 3 + rand(4);
  // Only forward edges, then relabel, so every graph is acyclic without
  // being trivially already sorted.
  const labels = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i -= 1) {
    const j = rand(i + 1);
    [labels[i], labels[j]] = [labels[j], labels[i]];
  }
  const edges = [];
  for (let u = 0; u < n; u += 1)
    for (let v = u + 1; v < n; v += 1)
      if (rand(4) === 0) edges.push([labels[u], labels[v]]);
  dags += 1;
  const [count, smallest] = survey(n, edges);
  if (count === 1) onlyOne += 1;
  if (count > mostOrders) mostOrders = count;
  const a = kahn(n, edges, "queue");
  const b = kahn(n, edges, "stack");
  const c = kahn(n, edges, "heap");
  if (edgesPointForwards(n, edges, a)) queueValid += 1;
  if (edgesPointForwards(n, edges, b)) stackValid += 1;
  if (edgesPointForwards(n, edges, c)) heapValid += 1;
  if (same(a, smallest)) queueSmallest += 1;
  if (same(b, smallest)) stackSmallest += 1;
  if (same(c, smallest)) heapSmallest += 1;
}

const row = (text, value) => "  " + text.padEnd(40) + " " + String(value).padStart(6);

console.log();
console.log(\`over \${dags} random acyclic graphs on 3 to 6 nodes:\`);
console.log(row("queue order had every edge forwards", queueValid));
console.log(row("stack order had every edge forwards", stackValid));
console.log(row("heap order had every edge forwards", heapValid));
console.log();
console.log(row("queue gave the smallest order", queueSmallest));
console.log(row("stack gave the smallest order", stackSmallest));
console.log(row("heap gave the smallest order", heapSmallest));
console.log();
console.log(row("graphs with exactly one valid order", onlyOne));
console.log(row("most valid orders any graph had", mostOrders));

console.log();
console.log("All three containers are correct: every one of them produced an order");
console.log(\`with every edge pointing forwards, on all \${dags} graphs. That is what\`);
console.log("topological sort promises, and it is all it promises.");
console.log();
console.log(\`Only \${onlyOne} of the \${dags} graphs had a single valid order, and one graph had\`);
console.log(\`\${mostOrders} of them. So "the topological order" is not a thing that exists. If a\`);
console.log("problem asks for the lexicographically smallest one, that is a different");
console.log("question, and it has a different answer: put the ready nodes in a min");
console.log(\`heap. The heap got it right on all \${heapSmallest} graphs; the queue on \${queueSmallest} and the\`);
console.log(\`stack on \${stackSmallest}.\`);
console.log();
console.log("The practical consequence is about tests. Asserting a specific order");
console.log("pins the container you happened to use. Assert the property -- every");
console.log("edge points forwards -- and the test survives a change of container.");
`,
            },
            {
              lang: "typescript",
              code: `// "A" topological order, not "the". And how to ask for a specific one.
//
// Kahn's algorithm says: repeatedly take a node nothing points at. When more
// than one node qualifies -- which is most of the time -- it does not say which.
// That choice is left to whatever container is holding the ready nodes, and the
// container is usually picked without thinking about it.
//
//   a queue  -- ready nodes come out in the order they became ready
//   a stack  -- the most recently freed node goes first
//   a heap   -- the smallest-numbered ready node goes first
//
// All three are correct. Only one of them gives the lexicographically smallest
// order, which is what a problem statement means when it asks for "the" answer.

// A binary min-heap of node numbers, so "heap" means the same thing here as
// it does in every other translation.
class Heap {
  items: number[];

  constructor(items: number[]) {
    this.items = items.slice();
    for (let i = (this.items.length >> 1) - 1; i >= 0; i -= 1) this.sink(i);
  }

  sink(start: number): void {
    let i = start;
    for (;;) {
      let small = i;
      for (const c of [2 * i + 1, 2 * i + 2])
        if (c < this.items.length && this.items[c] < this.items[small]) small = c;
      if (small === i) return;
      [this.items[i], this.items[small]] = [this.items[small], this.items[i]];
      i = small;
    }
  }

  push(x: number): void {
    this.items.push(x);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.items[parent] <= this.items[i]) break;
      [this.items[i], this.items[parent]] = [this.items[parent], this.items[i]];
      i = parent;
    }
  }

  pop(): number {
    const top = this.items[0];
    const last = this.items.pop() as number;
    if (this.items.length > 0) {
      this.items[0] = last;
      this.sink(0);
    }
    return top;
  }

  get size(): number {
    return this.items.length;
  }
}

// Kahn's algorithm with the ready set held three different ways.
function kahn(n: number, edges: number[][], mode: string): number[] | null {
  const adj: number[][] = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [u, v] of edges) {
    adj[u].push(v);
    indeg[v] += 1;
  }
  const start: number[] = [];
  for (let v = 0; v < n; v += 1) if (indeg[v] === 0) start.push(v);
  const order: number[] = [];
  const heap = mode === "heap" ? new Heap(start) : null;
  const line = start.slice();
  let head = 0;
  for (;;) {
    let at: number;
    if (mode === "heap") {
      if ((heap as Heap).size === 0) break;
      at = (heap as Heap).pop();
    } else if (mode === "stack") {
      if (line.length <= head) break;
      at = line.pop() as number;
    } else {
      if (line.length <= head) break;
      at = line[head];
      head += 1;
    }
    order.push(at);
    for (const nxt of adj[at]) {
      indeg[nxt] -= 1;
      if (indeg[nxt] === 0) {
        if (mode === "heap") (heap as Heap).push(nxt);
        else line.push(nxt);
      }
    }
  }
  return order.length === n ? order : null;
}

function edgesPointForwards(n: number, edges: number[][], order: number[] | null): boolean {
  if (order === null || order.length !== n) return false;
  const place = new Array(n).fill(0);
  order.forEach((v, i) => {
    place[v] = i;
  });
  return edges.every(([u, v]) => place[u] < place[v]);
}

// Every permutation, checked: how many are valid, and which is smallest.
//
// Factorial, and the point of it is that nothing here is an opinion. The
// count of valid orders and the lexicographically smallest one are facts
// about the graph, not about an algorithm.
function survey(n: number, edges: number[][]): [number, number[] | null] {
  const order = Array.from({ length: n }, (_, i) => i);
  let found = 0;
  let best: number[] | null = null;

  const smaller = (a: number[], b: number[]): boolean => {
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return a[i] < b[i];
    }
    return false;
  };

  const permute = (fixed: number): void => {
    if (fixed === n) {
      if (edgesPointForwards(n, edges, order)) {
        found += 1;
        if (best === null || smaller(order, best)) best = order.slice();
      }
      return;
    }
    for (let i = fixed; i < n; i += 1) {
      [order[fixed], order[i]] = [order[i], order[fixed]];
      permute(fixed + 1);
      [order[fixed], order[i]] = [order[i], order[fixed]];
    }
  };

  permute(0);
  return [found, best];
}

function show(order: number[] | null): string {
  return order === null ? "none" : order.join(" ");
}

function label(edges: number[][]): string {
  return "[" + edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ") + "]";
}

const CASES: [number, number[][]][] = [
  [4, [[2, 3]]],
  [5, [[0, 1], [2, 3], [3, 4]]],
  [4, [[1, 0], [1, 2], [3, 2]]],
];

console.log(
  "edges".padEnd(26) + " " + "queue".padEnd(10) + " " + "stack".padEnd(10) + " " +
  "heap".padEnd(10) + " " + "smallest",
);
for (const [n, edges] of CASES) {
  const [, smallest] = survey(n, edges);
  console.log(
    label(edges).padEnd(26) + " " + show(kahn(n, edges, "queue")).padEnd(10) + " " +
    show(kahn(n, edges, "stack")).padEnd(10) + " " +
    show(kahn(n, edges, "heap")).padEnd(10) + " " + show(smallest),
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 8080n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let dags = 0;
let queueValid = 0;
let stackValid = 0;
let heapValid = 0;
let queueSmallest = 0;
let stackSmallest = 0;
let heapSmallest = 0;
let onlyOne = 0;
let mostOrders = 0;
const same = (a: number[] | null, b: number[] | null): boolean => a !== null && b !== null && a.length === b.length && a.every((x, i) => x === b[i]);
for (let t = 0; t < trials; t += 1) {
  const n = 3 + rand(4);
  // Only forward edges, then relabel, so every graph is acyclic without
  // being trivially already sorted.
  const labels = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i -= 1) {
    const j = rand(i + 1);
    [labels[i], labels[j]] = [labels[j], labels[i]];
  }
  const edges: number[][] = [];
  for (let u = 0; u < n; u += 1)
    for (let v = u + 1; v < n; v += 1)
      if (rand(4) === 0) edges.push([labels[u], labels[v]]);
  dags += 1;
  const [count, smallest] = survey(n, edges);
  if (count === 1) onlyOne += 1;
  if (count > mostOrders) mostOrders = count;
  const a = kahn(n, edges, "queue");
  const b = kahn(n, edges, "stack");
  const c = kahn(n, edges, "heap");
  if (edgesPointForwards(n, edges, a)) queueValid += 1;
  if (edgesPointForwards(n, edges, b)) stackValid += 1;
  if (edgesPointForwards(n, edges, c)) heapValid += 1;
  if (same(a, smallest)) queueSmallest += 1;
  if (same(b, smallest)) stackSmallest += 1;
  if (same(c, smallest)) heapSmallest += 1;
}

const row = (text: string, value: number): string => "  " + text.padEnd(40) + " " + String(value).padStart(6);

console.log();
console.log(\`over \${dags} random acyclic graphs on 3 to 6 nodes:\`);
console.log(row("queue order had every edge forwards", queueValid));
console.log(row("stack order had every edge forwards", stackValid));
console.log(row("heap order had every edge forwards", heapValid));
console.log();
console.log(row("queue gave the smallest order", queueSmallest));
console.log(row("stack gave the smallest order", stackSmallest));
console.log(row("heap gave the smallest order", heapSmallest));
console.log();
console.log(row("graphs with exactly one valid order", onlyOne));
console.log(row("most valid orders any graph had", mostOrders));

console.log();
console.log("All three containers are correct: every one of them produced an order");
console.log(\`with every edge pointing forwards, on all \${dags} graphs. That is what\`);
console.log("topological sort promises, and it is all it promises.");
console.log();
console.log(\`Only \${onlyOne} of the \${dags} graphs had a single valid order, and one graph had\`);
console.log(\`\${mostOrders} of them. So "the topological order" is not a thing that exists. If a\`);
console.log("problem asks for the lexicographically smallest one, that is a different");
console.log("question, and it has a different answer: put the ready nodes in a min");
console.log(\`heap. The heap got it right on all \${heapSmallest} graphs; the queue on \${queueSmallest} and the\`);
console.log(\`stack on \${stackSmallest}.\`);
console.log();
console.log("The practical consequence is about tests. Asserting a specific order");
console.log("pins the container you happened to use. Assert the property -- every");
console.log("edge points forwards -- and the test survives a change of container.");
`,
            },
            {
              lang: "java",
              code: `// "A" topological order, not "the". And how to ask for a specific one.
//
// Kahn's algorithm says: repeatedly take a node nothing points at. When more
// than one node qualifies -- which is most of the time -- it does not say which.
// That choice is left to whatever container is holding the ready nodes, and the
// container is usually picked without thinking about it.
//
//   a queue  -- ready nodes come out in the order they became ready
//   a stack  -- the most recently freed node goes first
//   a heap   -- the smallest-numbered ready node goes first
//
// All three are correct. Only one of them gives the lexicographically smallest
// order, which is what a problem statement means when it asks for "the" answer.
import java.util.ArrayList;
import java.util.List;
import java.util.PriorityQueue;

public class Main {
    /** Kahn's algorithm with the ready set held three different ways. */
    static List<Integer> kahn(int n, int[][] edges, String mode) {
        @SuppressWarnings("unchecked")
        List<Integer>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        int[] indeg = new int[n];
        for (int[] e : edges) {
            adj[e[0]].add(e[1]);
            indeg[e[1]]++;
        }
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        List<Integer> line = new ArrayList<>();
        for (int v = 0; v < n; v++)
            if (indeg[v] == 0) {
                if (mode.equals("heap")) heap.add(v);
                else line.add(v);
            }
        List<Integer> order = new ArrayList<>();
        int head = 0;
        while (true) {
            int at;
            if (mode.equals("heap")) {
                if (heap.isEmpty()) break;
                at = heap.poll();
            } else if (mode.equals("stack")) {
                if (line.isEmpty()) break;
                at = line.remove(line.size() - 1);
            } else {
                if (line.size() <= head) break;
                at = line.get(head++);
            }
            order.add(at);
            for (int nxt : adj[at]) {
                if (--indeg[nxt] == 0) {
                    if (mode.equals("heap")) heap.add(nxt);
                    else line.add(nxt);
                }
            }
        }
        return order.size() == n ? order : null;
    }

    static boolean edgesPointForwards(int n, int[][] edges, List<Integer> order) {
        if (order == null || order.size() != n) return false;
        int[] place = new int[n];
        for (int i = 0; i < n; i++) place[order.get(i)] = i;
        for (int[] e : edges) if (place[e[0]] >= place[e[1]]) return false;
        return true;
    }

    static boolean smaller(int[] a, List<Integer> b) {
        for (int i = 0; i < a.length; i++) {
            if (a[i] != b.get(i)) return a[i] < b.get(i);
        }
        return false;
    }

    static void permute(int n, int[][] edges, int[] order, int fixed, int[] found,
                        List<List<Integer>> best) {
        if (fixed == n) {
            List<Integer> as = new ArrayList<>();
            for (int x : order) as.add(x);
            if (edgesPointForwards(n, edges, as)) {
                found[0]++;
                if (best.get(0) == null || smaller(order, best.get(0))) best.set(0, as);
            }
            return;
        }
        for (int i = fixed; i < n; i++) {
            int tmp = order[fixed];
            order[fixed] = order[i];
            order[i] = tmp;
            permute(n, edges, order, fixed + 1, found, best);
            tmp = order[fixed];
            order[fixed] = order[i];
            order[i] = tmp;
        }
    }

    /**
     * Every permutation, checked: how many are valid, and which is smallest.
     *
     * <p>Factorial, and the point of it is that nothing here is an opinion. The
     * count of valid orders and the lexicographically smallest one are facts
     * about the graph, not about an algorithm.
     */
    static Object[] survey(int n, int[][] edges) {
        int[] order = new int[n];
        for (int i = 0; i < n; i++) order[i] = i;
        int[] found = new int[1];
        List<List<Integer>> best = new ArrayList<>();
        best.add(null);
        permute(n, edges, order, 0, found, best);
        return new Object[] {found[0], best.get(0)};
    }

    static String show(List<Integer> order) {
        if (order == null) return "none";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < order.size(); i++) {
            if (i > 0) sb.append(" ");
            sb.append(order.get(i));
        }
        return sb.toString();
    }

    static String label(int[][] edges) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < edges.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(edges[i][0]).append("->").append(edges[i][1]);
        }
        return sb.append("]").toString();
    }

    // The same linear congruential generator in every language, so the random
    // graphs below are the same graphs whichever translation is run.
    static long seed = 8080L;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    static String row(String text, int value) {
        return String.format("  %-40s %6d", text, value);
    }

    @SuppressWarnings("unchecked")
    public static void main(String[] args) {
        int[] caseN = {4, 5, 4};
        int[][][] caseEdges = {
            {{2, 3}},
            {{0, 1}, {2, 3}, {3, 4}},
            {{1, 0}, {1, 2}, {3, 2}},
        };

        System.out.printf("%-26s %-10s %-10s %-10s %s%n",
            "edges", "queue", "stack", "heap", "smallest");
        for (int c = 0; c < caseN.length; c++) {
            Object[] surveyed = survey(caseN[c], caseEdges[c]);
            System.out.printf("%-26s %-10s %-10s %-10s %s%n", label(caseEdges[c]),
                show(kahn(caseN[c], caseEdges[c], "queue")),
                show(kahn(caseN[c], caseEdges[c], "stack")),
                show(kahn(caseN[c], caseEdges[c], "heap")),
                show((List<Integer>) surveyed[1]));
        }

        int trials = 3000;
        int dags = 0;
        int queueValid = 0, stackValid = 0, heapValid = 0;
        int queueSmallest = 0, stackSmallest = 0, heapSmallest = 0;
        int onlyOne = 0, mostOrders = 0;
        for (int t = 0; t < trials; t++) {
            int n = 3 + rand(4);
            // Only forward edges, then relabel, so every graph is acyclic
            // without being trivially already sorted.
            int[] labels = new int[n];
            for (int i = 0; i < n; i++) labels[i] = i;
            for (int i = n - 1; i > 0; i--) {
                int j = rand(i + 1);
                int tmp = labels[i];
                labels[i] = labels[j];
                labels[j] = tmp;
            }
            List<int[]> built = new ArrayList<>();
            for (int u = 0; u < n; u++)
                for (int v = u + 1; v < n; v++)
                    if (rand(4) == 0) built.add(new int[] {labels[u], labels[v]});
            int[][] edges = built.toArray(new int[0][]);
            dags++;
            Object[] surveyed = survey(n, edges);
            int count = (Integer) surveyed[0];
            List<Integer> smallest = (List<Integer>) surveyed[1];
            if (count == 1) onlyOne++;
            if (count > mostOrders) mostOrders = count;
            List<Integer> a = kahn(n, edges, "queue");
            List<Integer> b = kahn(n, edges, "stack");
            List<Integer> c = kahn(n, edges, "heap");
            if (edgesPointForwards(n, edges, a)) queueValid++;
            if (edgesPointForwards(n, edges, b)) stackValid++;
            if (edgesPointForwards(n, edges, c)) heapValid++;
            if (a != null && a.equals(smallest)) queueSmallest++;
            if (b != null && b.equals(smallest)) stackSmallest++;
            if (c != null && c.equals(smallest)) heapSmallest++;
        }

        System.out.println();
        System.out.println("over " + dags + " random acyclic graphs on 3 to 6 nodes:");
        System.out.println(row("queue order had every edge forwards", queueValid));
        System.out.println(row("stack order had every edge forwards", stackValid));
        System.out.println(row("heap order had every edge forwards", heapValid));
        System.out.println();
        System.out.println(row("queue gave the smallest order", queueSmallest));
        System.out.println(row("stack gave the smallest order", stackSmallest));
        System.out.println(row("heap gave the smallest order", heapSmallest));
        System.out.println();
        System.out.println(row("graphs with exactly one valid order", onlyOne));
        System.out.println(row("most valid orders any graph had", mostOrders));

        System.out.println();
        System.out.println("All three containers are correct: every one of them produced an order");
        System.out.println("with every edge pointing forwards, on all " + dags
            + " graphs. That is what");
        System.out.println("topological sort promises, and it is all it promises.");
        System.out.println();
        System.out.println("Only " + onlyOne + " of the " + dags
            + " graphs had a single valid order, and one graph had");
        System.out.println(mostOrders
            + " of them. So \\"the topological order\\" is not a thing that exists. If a");
        System.out.println("problem asks for the lexicographically smallest one, that is a different");
        System.out.println("question, and it has a different answer: put the ready nodes in a min");
        System.out.println("heap. The heap got it right on all " + heapSmallest
            + " graphs; the queue on " + queueSmallest + " and the");
        System.out.println("stack on " + stackSmallest + ".");
        System.out.println();
        System.out.println("The practical consequence is about tests. Asserting a specific order");
        System.out.println("pins the container you happened to use. Assert the property -- every");
        System.out.println("edge points forwards -- and the test survives a change of container.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// "A" topological order, not "the". And how to ask for a specific one.
//
// Kahn's algorithm says: repeatedly take a node nothing points at. When more
// than one node qualifies -- which is most of the time -- it does not say which.
// That choice is left to whatever container is holding the ready nodes, and the
// container is usually picked without thinking about it.
//
//   a queue  -- ready nodes come out in the order they became ready
//   a stack  -- the most recently freed node goes first
//   a heap   -- the smallest-numbered ready node goes first
//
// All three are correct. Only one of them gives the lexicographically smallest
// order, which is what a problem statement means when it asks for "the" answer.
#include <functional>
#include <iomanip>
#include <iostream>
#include <queue>
#include <string>
#include <utility>
#include <vector>

using Arrow = std::pair<int, int>;
using Order = std::vector<int>;

// Kahn's algorithm with the ready set held three different ways.
Order kahn(int n, const std::vector<Arrow>& edges, const std::string& mode) {
    std::vector<std::vector<int>> adj(n);
    std::vector<int> indeg(n, 0);
    for (const Arrow& e : edges) {
        adj[e.first].push_back(e.second);
        indeg[e.second]++;
    }
    std::priority_queue<int, std::vector<int>, std::greater<int>> heap;
    Order line;
    for (int v = 0; v < n; v++)
        if (indeg[v] == 0) {
            if (mode == "heap") heap.push(v);
            else line.push_back(v);
        }
    Order order;
    size_t head = 0;
    for (;;) {
        int at;
        if (mode == "heap") {
            if (heap.empty()) break;
            at = heap.top();
            heap.pop();
        } else if (mode == "stack") {
            if (line.empty()) break;
            at = line.back();
            line.pop_back();
        } else {
            if (line.size() <= head) break;
            at = line[head++];
        }
        order.push_back(at);
        for (int nxt : adj[at]) {
            if (--indeg[nxt] == 0) {
                if (mode == "heap") heap.push(nxt);
                else line.push_back(nxt);
            }
        }
    }
    if (static_cast<int>(order.size()) != n) return Order();
    return order;
}

bool edges_point_forwards(int n, const std::vector<Arrow>& edges, const Order& order) {
    if (static_cast<int>(order.size()) != n) return false;
    std::vector<int> place(n, 0);
    for (int i = 0; i < n; i++) place[order[i]] = i;
    for (const Arrow& e : edges)
        if (place[e.first] >= place[e.second]) return false;
    return true;
}

void permute(int n, const std::vector<Arrow>& edges, Order& order, int fixed, int& found,
             Order& best) {
    if (fixed == n) {
        if (edges_point_forwards(n, edges, order)) {
            found++;
            if (best.empty() || order < best) best = order;
        }
        return;
    }
    for (int i = fixed; i < n; i++) {
        std::swap(order[fixed], order[i]);
        permute(n, edges, order, fixed + 1, found, best);
        std::swap(order[fixed], order[i]);
    }
}

// Every permutation, checked: how many are valid, and which is smallest.
//
// Factorial, and the point of it is that nothing here is an opinion. The
// count of valid orders and the lexicographically smallest one are facts
// about the graph, not about an algorithm.
std::pair<int, Order> survey(int n, const std::vector<Arrow>& edges) {
    Order order(n);
    for (int i = 0; i < n; i++) order[i] = i;
    int found = 0;
    Order best;
    permute(n, edges, order, 0, found, best);
    return {found, best};
}

std::string show(const Order& order) {
    if (order.empty()) return "none";
    std::string s;
    for (size_t i = 0; i < order.size(); i++) {
        if (i > 0) s += " ";
        s += std::to_string(order[i]);
    }
    return s;
}

std::string label(const std::vector<Arrow>& edges) {
    std::string s = "[";
    for (size_t i = 0; i < edges.size(); i++) {
        if (i > 0) s += ", ";
        s += std::to_string(edges[i].first) + "->" + std::to_string(edges[i].second);
    }
    return s + "]";
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
long long seed = 8080;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

void row(const std::string& text, int value) {
    std::cout << "  " << std::left << std::setw(40) << text << " " << std::right
              << std::setw(6) << value << "\\n";
}

int main() {
    std::vector<int> case_n = {4, 5, 4};
    std::vector<std::vector<Arrow>> cases = {
        {{2, 3}},
        {{0, 1}, {2, 3}, {3, 4}},
        {{1, 0}, {1, 2}, {3, 2}},
    };

    std::cout << std::left << std::setw(26) << "edges" << " " << std::setw(10) << "queue" << " "
              << std::setw(10) << "stack" << " " << std::setw(10) << "heap" << " "
              << "smallest" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        std::pair<int, Order> surveyed = survey(case_n[c], cases[c]);
        std::cout << std::left << std::setw(26) << label(cases[c]) << " " << std::setw(10)
                  << show(kahn(case_n[c], cases[c], "queue")) << " " << std::setw(10)
                  << show(kahn(case_n[c], cases[c], "stack")) << " " << std::setw(10)
                  << show(kahn(case_n[c], cases[c], "heap")) << " " << show(surveyed.second)
                  << "\\n";
    }

    int trials = 3000;
    int dags = 0;
    int queue_valid = 0, stack_valid = 0, heap_valid = 0;
    int queue_smallest = 0, stack_smallest = 0, heap_smallest = 0;
    int only_one = 0, most_orders = 0;
    for (int t = 0; t < trials; t++) {
        int n = 3 + rand_below(4);
        // Only forward edges, then relabel, so every graph is acyclic without
        // being trivially already sorted.
        std::vector<int> labels(n);
        for (int i = 0; i < n; i++) labels[i] = i;
        for (int i = n - 1; i > 0; i--) {
            int j = rand_below(i + 1);
            std::swap(labels[i], labels[j]);
        }
        std::vector<Arrow> edges;
        for (int u = 0; u < n; u++)
            for (int v = u + 1; v < n; v++)
                if (rand_below(4) == 0) edges.push_back({labels[u], labels[v]});
        dags++;
        std::pair<int, Order> surveyed = survey(n, edges);
        if (surveyed.first == 1) only_one++;
        if (surveyed.first > most_orders) most_orders = surveyed.first;
        Order a = kahn(n, edges, "queue");
        Order b = kahn(n, edges, "stack");
        Order c = kahn(n, edges, "heap");
        if (edges_point_forwards(n, edges, a)) queue_valid++;
        if (edges_point_forwards(n, edges, b)) stack_valid++;
        if (edges_point_forwards(n, edges, c)) heap_valid++;
        if (a == surveyed.second) queue_smallest++;
        if (b == surveyed.second) stack_smallest++;
        if (c == surveyed.second) heap_smallest++;
    }

    std::cout << "\\n";
    std::cout << "over " << dags << " random acyclic graphs on 3 to 6 nodes:\\n";
    row("queue order had every edge forwards", queue_valid);
    row("stack order had every edge forwards", stack_valid);
    row("heap order had every edge forwards", heap_valid);
    std::cout << "\\n";
    row("queue gave the smallest order", queue_smallest);
    row("stack gave the smallest order", stack_smallest);
    row("heap gave the smallest order", heap_smallest);
    std::cout << "\\n";
    row("graphs with exactly one valid order", only_one);
    row("most valid orders any graph had", most_orders);

    std::cout << "\\n";
    std::cout << "All three containers are correct: every one of them produced an order\\n";
    std::cout << "with every edge pointing forwards, on all " << dags << " graphs. That is what\\n";
    std::cout << "topological sort promises, and it is all it promises.\\n";
    std::cout << "\\n";
    std::cout << "Only " << only_one << " of the " << dags
              << " graphs had a single valid order, and one graph had\\n";
    std::cout << most_orders
              << " of them. So \\"the topological order\\" is not a thing that exists. If a\\n";
    std::cout << "problem asks for the lexicographically smallest one, that is a different\\n";
    std::cout << "question, and it has a different answer: put the ready nodes in a min\\n";
    std::cout << "heap. The heap got it right on all " << heap_smallest << " graphs; the queue on "
              << queue_smallest << " and the\\n";
    std::cout << "stack on " << stack_smallest << ".\\n";
    std::cout << "\\n";
    std::cout << "The practical consequence is about tests. Asserting a specific order\\n";
    std::cout << "pins the container you happened to use. Assert the property -- every\\n";
    std::cout << "edge points forwards -- and the test survives a change of container.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// "A" topological order, not "the". And how to ask for a specific one.
//
// Kahn's algorithm says: repeatedly take a node nothing points at. When more
// than one node qualifies -- which is most of the time -- it does not say which.
// That choice is left to whatever container is holding the ready nodes, and the
// container is usually picked without thinking about it.
//
//   a queue  -- ready nodes come out in the order they became ready
//   a stack  -- the most recently freed node goes first
//   a heap   -- the smallest-numbered ready node goes first
//
// All three are correct. Only one of them gives the lexicographically smallest
// order, which is what a problem statement means when it asks for "the" answer.
use std::cmp::Reverse;
use std::collections::BinaryHeap;

type Arrow = (usize, usize);

/// Kahn's algorithm with the ready set held three different ways.
fn kahn(n: usize, edges: &[Arrow], mode: &str) -> Option<Vec<usize>> {
    let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
    let mut indeg = vec![0usize; n];
    for &(u, v) in edges {
        adj[u].push(v);
        indeg[v] += 1;
    }
    let mut heap: BinaryHeap<Reverse<usize>> = BinaryHeap::new();
    let mut line: Vec<usize> = Vec::new();
    for v in 0..n {
        if indeg[v] == 0 {
            if mode == "heap" {
                heap.push(Reverse(v));
            } else {
                line.push(v);
            }
        }
    }
    let mut order: Vec<usize> = Vec::new();
    let mut head = 0;
    loop {
        let at = if mode == "heap" {
            match heap.pop() {
                Some(Reverse(x)) => x,
                None => break,
            }
        } else if mode == "stack" {
            match line.pop() {
                Some(x) => x,
                None => break,
            }
        } else {
            if line.len() <= head {
                break;
            }
            head += 1;
            line[head - 1]
        };
        order.push(at);
        for idx in 0..adj[at].len() {
            let nxt = adj[at][idx];
            indeg[nxt] -= 1;
            if indeg[nxt] == 0 {
                if mode == "heap" {
                    heap.push(Reverse(nxt));
                } else {
                    line.push(nxt);
                }
            }
        }
    }
    if order.len() == n {
        Some(order)
    } else {
        None
    }
}

fn edges_point_forwards(n: usize, edges: &[Arrow], order: &Option<Vec<usize>>) -> bool {
    let order = match order {
        Some(o) if o.len() == n => o,
        _ => return false,
    };
    let mut place = vec![0usize; n];
    for (i, &v) in order.iter().enumerate() {
        place[v] = i;
    }
    edges.iter().all(|&(u, v)| place[u] < place[v])
}

fn permute(
    n: usize,
    edges: &[Arrow],
    order: &mut Vec<usize>,
    fixed: usize,
    found: &mut u64,
    best: &mut Option<Vec<usize>>,
) {
    if fixed == n {
        if edges_point_forwards(n, edges, &Some(order.clone())) {
            *found += 1;
            let better = match best {
                None => true,
                Some(b) => order < b,
            };
            if better {
                *best = Some(order.clone());
            }
        }
        return;
    }
    for i in fixed..n {
        order.swap(fixed, i);
        permute(n, edges, order, fixed + 1, found, best);
        order.swap(fixed, i);
    }
}

/// Every permutation, checked: how many are valid, and which is smallest.
///
/// Factorial, and the point of it is that nothing here is an opinion. The
/// count of valid orders and the lexicographically smallest one are facts
/// about the graph, not about an algorithm.
fn survey(n: usize, edges: &[Arrow]) -> (u64, Option<Vec<usize>>) {
    let mut order: Vec<usize> = (0..n).collect();
    let mut found = 0;
    let mut best: Option<Vec<usize>> = None;
    permute(n, edges, &mut order, 0, &mut found, &mut best);
    (found, best)
}

fn show(order: &Option<Vec<usize>>) -> String {
    match order {
        None => "none".to_string(),
        Some(o) => o
            .iter()
            .map(|x| x.to_string())
            .collect::<Vec<String>>()
            .join(" "),
    }
}

fn label(edges: &[Arrow]) -> String {
    let cells: Vec<String> = edges.iter().map(|&(u, v)| format!("{}->{}", u, v)).collect();
    format!("[{}]", cells.join(", "))
}

/// The same linear congruential generator in every language, so the random
/// graphs below are the same graphs whichever translation is run.
struct Rng {
    seed: i64,
}

impl Rng {
    fn next(&mut self, n: i64) -> i64 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        self.seed / 65536 % n
    }
}

fn row(text: &str, value: u64) {
    println!("  {:<40} {:>6}", text, value);
}

fn main() {
    let case_n = [4usize, 5, 4];
    let cases: Vec<Vec<Arrow>> = vec![
        vec![(2, 3)],
        vec![(0, 1), (2, 3), (3, 4)],
        vec![(1, 0), (1, 2), (3, 2)],
    ];

    println!(
        "{:<26} {:<10} {:<10} {:<10} {}",
        "edges", "queue", "stack", "heap", "smallest"
    );
    for c in 0..cases.len() {
        let (_, smallest) = survey(case_n[c], &cases[c]);
        println!(
            "{:<26} {:<10} {:<10} {:<10} {}",
            label(&cases[c]),
            show(&kahn(case_n[c], &cases[c], "queue")),
            show(&kahn(case_n[c], &cases[c], "stack")),
            show(&kahn(case_n[c], &cases[c], "heap")),
            show(&smallest)
        );
    }

    let mut rng = Rng { seed: 8080 };
    let trials = 3000;
    let mut dags = 0u64;
    let (mut queue_valid, mut stack_valid, mut heap_valid) = (0u64, 0u64, 0u64);
    let (mut queue_smallest, mut stack_smallest, mut heap_smallest) = (0u64, 0u64, 0u64);
    let (mut only_one, mut most_orders) = (0u64, 0u64);
    for _ in 0..trials {
        let n = 3 + rng.next(4) as usize;
        // Only forward edges, then relabel, so every graph is acyclic without
        // being trivially already sorted.
        let mut labels: Vec<usize> = (0..n).collect();
        for i in (1..n).rev() {
            let j = rng.next(i as i64 + 1) as usize;
            labels.swap(i, j);
        }
        let mut edges: Vec<Arrow> = Vec::new();
        for u in 0..n {
            for v in (u + 1)..n {
                if rng.next(4) == 0 {
                    edges.push((labels[u], labels[v]));
                }
            }
        }
        dags += 1;
        let (count, smallest) = survey(n, &edges);
        if count == 1 {
            only_one += 1;
        }
        if count > most_orders {
            most_orders = count;
        }
        let a = kahn(n, &edges, "queue");
        let b = kahn(n, &edges, "stack");
        let c = kahn(n, &edges, "heap");
        if edges_point_forwards(n, &edges, &a) {
            queue_valid += 1;
        }
        if edges_point_forwards(n, &edges, &b) {
            stack_valid += 1;
        }
        if edges_point_forwards(n, &edges, &c) {
            heap_valid += 1;
        }
        if a == smallest {
            queue_smallest += 1;
        }
        if b == smallest {
            stack_smallest += 1;
        }
        if c == smallest {
            heap_smallest += 1;
        }
    }

    println!();
    println!("over {} random acyclic graphs on 3 to 6 nodes:", dags);
    row("queue order had every edge forwards", queue_valid);
    row("stack order had every edge forwards", stack_valid);
    row("heap order had every edge forwards", heap_valid);
    println!();
    row("queue gave the smallest order", queue_smallest);
    row("stack gave the smallest order", stack_smallest);
    row("heap gave the smallest order", heap_smallest);
    println!();
    row("graphs with exactly one valid order", only_one);
    row("most valid orders any graph had", most_orders);

    println!();
    println!("All three containers are correct: every one of them produced an order");
    println!(
        "with every edge pointing forwards, on all {} graphs. That is what",
        dags
    );
    println!("topological sort promises, and it is all it promises.");
    println!();
    println!(
        "Only {} of the {} graphs had a single valid order, and one graph had",
        only_one, dags
    );
    println!(
        "{} of them. So \\"the topological order\\" is not a thing that exists. If a",
        most_orders
    );
    println!("problem asks for the lexicographically smallest one, that is a different");
    println!("question, and it has a different answer: put the ready nodes in a min");
    println!(
        "heap. The heap got it right on all {} graphs; the queue on {} and the",
        heap_smallest, queue_smallest
    );
    println!("stack on {}.", stack_smallest);
    println!();
    println!("The practical consequence is about tests. Asserting a specific order");
    println!("pins the container you happened to use. Assert the property -- every");
    println!("edge points forwards -- and the test survives a change of container.");
}
`,
            },
            {
              lang: "go",
              code: `// "A" topological order, not "the". And how to ask for a specific one.
//
// Kahn's algorithm says: repeatedly take a node nothing points at. When more
// than one node qualifies -- which is most of the time -- it does not say which.
// That choice is left to whatever container is holding the ready nodes, and the
// container is usually picked without thinking about it.
//
//	a queue  -- ready nodes come out in the order they became ready
//	a stack  -- the most recently freed node goes first
//	a heap   -- the smallest-numbered ready node goes first
//
// All three are correct. Only one of them gives the lexicographically smallest
// order, which is what a problem statement means when it asks for "the" answer.
package main

import (
	"fmt"
	"strings"
)

// Arrow is a directed edge.
type Arrow struct {
	U, V int
}

// minHeap is a binary min-heap of node numbers, so "heap" means the same thing
// here as it does in every other translation.
type minHeap struct {
	items []int
}

func (h *minHeap) sink(start int) {
	i := start
	for {
		small := i
		for _, c := range []int{2*i + 1, 2*i + 2} {
			if c < len(h.items) && h.items[c] < h.items[small] {
				small = c
			}
		}
		if small == i {
			return
		}
		h.items[i], h.items[small] = h.items[small], h.items[i]
		i = small
	}
}

func (h *minHeap) push(x int) {
	h.items = append(h.items, x)
	i := len(h.items) - 1
	for i > 0 {
		parent := (i - 1) / 2
		if h.items[parent] <= h.items[i] {
			break
		}
		h.items[i], h.items[parent] = h.items[parent], h.items[i]
		i = parent
	}
}

func (h *minHeap) pop() int {
	top := h.items[0]
	last := h.items[len(h.items)-1]
	h.items = h.items[:len(h.items)-1]
	if len(h.items) > 0 {
		h.items[0] = last
		h.sink(0)
	}
	return top
}

// kahn runs Kahn's algorithm with the ready set held three different ways.
func kahn(n int, edges []Arrow, mode string) []int {
	adj := make([][]int, n)
	indeg := make([]int, n)
	for _, e := range edges {
		adj[e.U] = append(adj[e.U], e.V)
		indeg[e.V]++
	}
	heap := &minHeap{}
	var line []int
	for v := 0; v < n; v++ {
		if indeg[v] == 0 {
			if mode == "heap" {
				heap.push(v)
			} else {
				line = append(line, v)
			}
		}
	}
	var order []int
	head := 0
	for {
		var at int
		if mode == "heap" {
			if len(heap.items) == 0 {
				break
			}
			at = heap.pop()
		} else if mode == "stack" {
			if len(line) == 0 {
				break
			}
			at = line[len(line)-1]
			line = line[:len(line)-1]
		} else {
			if len(line) <= head {
				break
			}
			at = line[head]
			head++
		}
		order = append(order, at)
		for _, nxt := range adj[at] {
			indeg[nxt]--
			if indeg[nxt] == 0 {
				if mode == "heap" {
					heap.push(nxt)
				} else {
					line = append(line, nxt)
				}
			}
		}
	}
	if len(order) != n {
		return nil
	}
	return order
}

func edgesPointForwards(n int, edges []Arrow, order []int) bool {
	if order == nil || len(order) != n {
		return false
	}
	place := make([]int, n)
	for i, v := range order {
		place[v] = i
	}
	for _, e := range edges {
		if place[e.U] >= place[e.V] {
			return false
		}
	}
	return true
}

func smaller(a, b []int) bool {
	for i := range a {
		if a[i] != b[i] {
			return a[i] < b[i]
		}
	}
	return false
}

func permute(n int, edges []Arrow, order []int, fixed int, found *int, best *[]int) {
	if fixed == n {
		if edgesPointForwards(n, edges, order) {
			*found++
			if *best == nil || smaller(order, *best) {
				clone := make([]int, n)
				copy(clone, order)
				*best = clone
			}
		}
		return
	}
	for i := fixed; i < n; i++ {
		order[fixed], order[i] = order[i], order[fixed]
		permute(n, edges, order, fixed+1, found, best)
		order[fixed], order[i] = order[i], order[fixed]
	}
}

// survey checks every permutation: how many are valid, and which is smallest.
//
// Factorial, and the point of it is that nothing here is an opinion. The
// count of valid orders and the lexicographically smallest one are facts
// about the graph, not about an algorithm.
func survey(n int, edges []Arrow) (int, []int) {
	order := make([]int, n)
	for i := range order {
		order[i] = i
	}
	found := 0
	var best []int
	permute(n, edges, order, 0, &found, &best)
	return found, best
}

func sameOrder(a, b []int) bool {
	if a == nil || b == nil || len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func show(order []int) string {
	if order == nil {
		return "none"
	}
	cells := make([]string, len(order))
	for i, v := range order {
		cells[i] = fmt.Sprint(v)
	}
	return strings.Join(cells, " ")
}

func label(edges []Arrow) string {
	cells := make([]string, len(edges))
	for i, e := range edges {
		cells[i] = fmt.Sprintf("%d->%d", e.U, e.V)
	}
	return "[" + strings.Join(cells, ", ") + "]"
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
var seed int64 = 8080

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func row(text string, value int) {
	fmt.Printf("  %-40s %6d\\n", text, value)
}

func main() {
	caseN := []int{4, 5, 4}
	cases := [][]Arrow{
		{{2, 3}},
		{{0, 1}, {2, 3}, {3, 4}},
		{{1, 0}, {1, 2}, {3, 2}},
	}

	fmt.Printf("%-26s %-10s %-10s %-10s %s\\n", "edges", "queue", "stack", "heap", "smallest")
	for c := range cases {
		_, smallest := survey(caseN[c], cases[c])
		fmt.Printf("%-26s %-10s %-10s %-10s %s\\n", label(cases[c]),
			show(kahn(caseN[c], cases[c], "queue")),
			show(kahn(caseN[c], cases[c], "stack")),
			show(kahn(caseN[c], cases[c], "heap")), show(smallest))
	}

	trials := 3000
	dags := 0
	queueValid, stackValid, heapValid := 0, 0, 0
	queueSmallest, stackSmallest, heapSmallest := 0, 0, 0
	onlyOne, mostOrders := 0, 0
	for t := 0; t < trials; t++ {
		n := 3 + randBelow(4)
		// Only forward edges, then relabel, so every graph is acyclic without
		// being trivially already sorted.
		labels := make([]int, n)
		for i := range labels {
			labels[i] = i
		}
		for i := n - 1; i > 0; i-- {
			j := randBelow(i + 1)
			labels[i], labels[j] = labels[j], labels[i]
		}
		var edges []Arrow
		for u := 0; u < n; u++ {
			for v := u + 1; v < n; v++ {
				if randBelow(4) == 0 {
					edges = append(edges, Arrow{labels[u], labels[v]})
				}
			}
		}
		dags++
		count, smallest := survey(n, edges)
		if count == 1 {
			onlyOne++
		}
		if count > mostOrders {
			mostOrders = count
		}
		a := kahn(n, edges, "queue")
		b := kahn(n, edges, "stack")
		c := kahn(n, edges, "heap")
		if edgesPointForwards(n, edges, a) {
			queueValid++
		}
		if edgesPointForwards(n, edges, b) {
			stackValid++
		}
		if edgesPointForwards(n, edges, c) {
			heapValid++
		}
		if sameOrder(a, smallest) {
			queueSmallest++
		}
		if sameOrder(b, smallest) {
			stackSmallest++
		}
		if sameOrder(c, smallest) {
			heapSmallest++
		}
	}

	fmt.Println()
	fmt.Printf("over %d random acyclic graphs on 3 to 6 nodes:\\n", dags)
	row("queue order had every edge forwards", queueValid)
	row("stack order had every edge forwards", stackValid)
	row("heap order had every edge forwards", heapValid)
	fmt.Println()
	row("queue gave the smallest order", queueSmallest)
	row("stack gave the smallest order", stackSmallest)
	row("heap gave the smallest order", heapSmallest)
	fmt.Println()
	row("graphs with exactly one valid order", onlyOne)
	row("most valid orders any graph had", mostOrders)

	fmt.Println()
	fmt.Println("All three containers are correct: every one of them produced an order")
	fmt.Printf("with every edge pointing forwards, on all %d graphs. That is what\\n", dags)
	fmt.Println("topological sort promises, and it is all it promises.")
	fmt.Println()
	fmt.Printf("Only %d of the %d graphs had a single valid order, and one graph had\\n", onlyOne, dags)
	fmt.Printf("%d of them. So \\"the topological order\\" is not a thing that exists. If a\\n", mostOrders)
	fmt.Println("problem asks for the lexicographically smallest one, that is a different")
	fmt.Println("question, and it has a different answer: put the ready nodes in a min")
	fmt.Printf("heap. The heap got it right on all %d graphs; the queue on %d and the\\n", heapSmallest, queueSmallest)
	fmt.Printf("stack on %d.\\n", stackSmallest)
	fmt.Println()
	fmt.Println("The practical consequence is about tests. Asserting a specific order")
	fmt.Println("pins the container you happened to use. Assert the property -- every")
	fmt.Println("edge points forwards -- and the test survives a change of container.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Asserting a specific order in a test",
          body: "It pins the container, not the algorithm. Kahn and DFS agreed on only 156 of 1,979 graphs and both were right every time. Assert that every edge points forwards and the test keeps working when somebody swaps the queue for a stack.",
        },
        {
          title: "Answering \"the smallest topological order\" with a plain queue",
          body: "It is right by accident about half the time -- 1,521 of 3,000 here -- which is exactly often enough to pass a handful of hand-written cases. The smallest order needs a min-heap for the ready set, which got it on all 3,000.",
        },
        {
          title: "Assuming a unique order because the example had one",
          body: "Only 66 of 3,000 random graphs had exactly one valid order. A chain has one; almost nothing else does. One graph in the sample had 720.",
        },
      ],
    },
    {
      id: "what-the-order-is-for",
      heading: "What the order is for",
      body: [
        "Longest path is NP-hard in a general graph. On a DAG it is one pass. The reason is entirely the topological order: process the nodes in it and every predecessor of a node is already final by the time the node is reached.",
        "That sentence is the whole content of \"dynamic programming on a DAG\", and it covers more than it sounds like \u2014 task scheduling, critical paths, counting distinct routes, longest increasing subsequence once it is written as a graph.",
        "The order is not a tidying step before the real work. Run the same recurrence in an arbitrary order and it silently under-reports: one pass in topological order matched an exhaustive walk on all 3,000 random DAGs; one pass in node order `0..n-1` matched on 2,230.",
        "And the failures point the other way from every wrong answer so far in this module. 1,145 entries came back **too low**, zero too high \u2014 because the recurrence takes a maximum, so a predecessor that has not been computed yet contributes nothing rather than something wrong. The clearest case is a path whose nodes are numbered backwards: exactly one hop of information gets through, and the far end reads 1 where the answer is 3.",
        "There is an order-free repair \u2014 keep relaxing every edge until a pass changes nothing \u2014 and on a DAG it is correct, at the cost of repeated passes. It is not a way round a cycle: no topological order means there is one, and on a positive cycle the relaxation never stops. It cost 5,710 passes over 3,000 graphs where one pass in the right order would have done.",
        "The last table is the real argument for the whole lesson. On a complete DAG of 22 nodes the ordered pass scans 231 edges; walking every path takes 4,194,303 steps. Acyclicity plus an order is what turns an intractable problem into a linear one.",
      ],
      examples: [
        {
          id: "dag-dynamic-programming",
          title: "Longest path in one pass, and what happens without the order",
          lang: "python",
          code: `# What the order is for: the hard problem that becomes linear on a DAG.
#
# Longest path is NP-hard in a general graph. On a directed acyclic graph it is
# one pass, and the reason is the topological order: process the nodes in it
# and every predecessor of a node is already final by the time the node is
# reached. That is the whole content of "dynamic programming on a DAG" --
# scheduling, critical paths, counting routes, longest increasing subsequence
# once it is written as a graph.
#
# The order is not a tidying step. Run the same recurrence in an arbitrary
# order and it silently under-reports, because a predecessor that has not been
# computed yet contributes nothing.
from collections import deque

NEG = -(10 ** 9)


def kahn(n, edges):
    """A topological order, or none if the graph is cyclic."""
    adj = [[] for _ in range(n)]
    indeg = [0] * n
    for u, v, _ in edges:
        adj[u].append(v)
        indeg[v] += 1
    q = deque(v for v in range(n) if indeg[v] == 0)
    order = []
    while q:
        at = q.popleft()
        order.append(at)
        for nxt in adj[at]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                q.append(nxt)
    return order if len(order) == n else None


def longest_in_order(n, edges, order):
    """One pass in the given order. Returns the distances and the edges scanned."""
    adj = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((v, w))
    best = [0] * n
    scans = 0
    for at in order:
        for nxt, w in adj[at]:
            scans += 1
            if best[at] + w > best[nxt]:
                best[nxt] = best[at] + w
    return best, scans


def longest_until_stable(n, edges):
    """The order-free repair: keep relaxing until a pass changes nothing."""
    best = [0] * n
    passes = 0
    while True:
        changed = False
        passes += 1
        for u, v, w in edges:
            if best[u] + w > best[v]:
                best[v] = best[u] + w
                changed = True
        if not changed:
            return best, passes


def longest_by_walking(n, edges):
    """The definition: the heaviest simple path ending at each node.

    Exponential, which is the point -- this is what the topological order
    buys a way out of.
    """
    adj = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((v, w))
    out = [0] * n
    walked = [0]

    for start in range(n):
        seen = [False] * n

        def walk(at, total):
            seen[at] = True
            walked[0] += 1
            for nxt, w in adj[at]:
                if not seen[nxt]:
                    if total + w > out[nxt]:
                        out[nxt] = total + w
                    walk(nxt, total + w)
            seen[at] = False

        walk(start, 0)
    return out, walked[0]


def show(row):
    return "[" + ", ".join(str(x) for x in row) + "]"


def label(edges):
    return "[" + ", ".join("%d->%d:%d" % e for e in edges) + "]"


CASES = [
    (4, [(0, 1, 3), (1, 2, 4), (0, 2, 2), (2, 3, 1)]),
    (4, [(3, 2, 1), (2, 1, 1), (1, 0, 1)]),
    (5, [(0, 2, 5), (1, 2, 2), (2, 4, 1), (0, 3, 1), (3, 4, 9)]),
]

print("%-40s %-16s %-16s %s" % ("edges", "topological", "node order", "truth"))
for n, edges in CASES:
    order = kahn(n, edges)
    a, _ = longest_in_order(n, edges, order)
    b, _ = longest_in_order(n, edges, list(range(n)))
    truth, _ = longest_by_walking(n, edges)
    print("%-40s %-16s %-16s %s" % (label(edges), show(a), show(b), show(truth)))

# The same linear congruential generator in every language, so the random
# graphs below are the same graphs whichever translation is run.
seed = 1234567


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


trials = 3000
topo_ok = node_ok = stable_ok = 0
node_low = node_high = 0
total_passes = 0
for _ in range(trials):
    n = 3 + rand(4)
    labels = list(range(n))
    for i in range(n - 1, 0, -1):
        j = rand(i + 1)
        labels[i], labels[j] = labels[j], labels[i]
    edges = []
    for u in range(n):
        for v in range(u + 1, n):
            if rand(3) == 0:
                edges.append((labels[u], labels[v], 1 + rand(9)))
    truth, _ = longest_by_walking(n, edges)
    a, _ = longest_in_order(n, edges, kahn(n, edges))
    b, _ = longest_in_order(n, edges, list(range(n)))
    c, passes = longest_until_stable(n, edges)
    topo_ok += a == truth
    node_ok += b == truth
    stable_ok += c == truth
    total_passes += passes
    for i in range(n):
        if b[i] < truth[i]:
            node_low += 1
        if b[i] > truth[i]:
            node_high += 1

print()
print("over %d random acyclic graphs on 3 to 6 nodes:" % trials)
print("  %-40s %6d" % ("one pass in topological order", topo_ok))
print("  %-40s %6d" % ("one pass in node order 0..n-1", node_ok))
print("  %-40s %6d" % ("relaxing until nothing changes", stable_ok))
print("  %-40s %6d" % ("entries node order left too low", node_low))
print("  %-40s %6d" % ("entries node order pushed too high", node_high))
print("  %-40s %6d" % ("passes the stable version needed", total_passes))

print()
print("and what the order is worth as the graph grows:")
print("%-7s %14s %16s" % ("nodes", "edges scanned", "paths walked"))
for n in (10, 14, 18, 22):
    edges = []
    for u in range(n):
        for v in range(u + 1, n):
            edges.append((u, v, 1 + (u * 7 + v) % 9))
    _, scans = longest_in_order(n, edges, kahn(n, edges))
    _, walked = longest_by_walking(n, edges)
    print("%-7d %14d %16d" % (n, scans, walked))

print()
print("The middle column of the demo is the failure, and row two is the")
print("clearest case: a path whose nodes are numbered backwards. Processed in")
print("node order, every node is reached before the node feeding it has been")
print("computed, so exactly one hop of information gets through and the far")
print("end reads 1 where the answer is 3.")
print()
print("Node order was wrong in one direction only: %d entries too low and %d" % (node_low, node_high))
print("too high. That is the opposite of the shortest-path failures -- here the")
print("recurrence takes a maximum, so a predecessor that has not been computed")
print("contributes nothing rather than something wrong.")
print()
print("Relaxing until a pass changes nothing also works, and it is what you")
print("fall back to when there is no order to be had. It cost %d passes over" % total_passes)
print("%d graphs where one pass in the right order would have done. And the" % trials)
print("last table is the real argument: on a complete DAG of 22 nodes the")
print("ordered pass scans 231 edges where walking every path takes over four")
print("million steps. Longest path is NP-hard in general; the acyclicity plus")
print("the order is what buys the linear algorithm.")
`,
          output: `edges                                    topological      node order       truth
[0->1:3, 1->2:4, 0->2:2, 2->3:1]         [0, 3, 7, 8]     [0, 3, 7, 8]     [0, 3, 7, 8]
[3->2:1, 2->1:1, 1->0:1]                 [3, 2, 1, 0]     [1, 1, 1, 0]     [3, 2, 1, 0]
[0->2:5, 1->2:2, 2->4:1, 0->3:1, 3->4:9] [0, 0, 5, 1, 10] [0, 0, 5, 1, 10] [0, 0, 5, 1, 10]

over 3000 random acyclic graphs on 3 to 6 nodes:
  one pass in topological order              3000
  one pass in node order 0..n-1              2230
  relaxing until nothing changes             3000
  entries node order left too low            1145
  entries node order pushed too high            0
  passes the stable version needed           5710

and what the order is worth as the graph grows:
nodes    edges scanned     paths walked
10                  45             1023
14                  91            16383
18                 153           262143
22                 231          4194303

The middle column of the demo is the failure, and row two is the
clearest case: a path whose nodes are numbered backwards. Processed in
node order, every node is reached before the node feeding it has been
computed, so exactly one hop of information gets through and the far
end reads 1 where the answer is 3.

Node order was wrong in one direction only: 1145 entries too low and 0
too high. That is the opposite of the shortest-path failures -- here the
recurrence takes a maximum, so a predecessor that has not been computed
contributes nothing rather than something wrong.

Relaxing until a pass changes nothing also works, and it is what you
fall back to when there is no order to be had. It cost 5710 passes over
3000 graphs where one pass in the right order would have done. And the
last table is the real argument: on a complete DAG of 22 nodes the
ordered pass scans 231 edges where walking every path takes over four
million steps. Longest path is NP-hard in general; the acyclicity plus
the order is what buys the linear algorithm.`,
          explanation:
            "The same recurrence run in topological order, in node order, and relaxed until stable, all scored against an exhaustive walk. The last table is the linear-against-exponential gap the order buys.",
          alternates: [
            {
              lang: "javascript",
              code: `// What the order is for: the hard problem that becomes linear on a DAG.
//
// Longest path is NP-hard in a general graph. On a directed acyclic graph it is
// one pass, and the reason is the topological order: process the nodes in it
// and every predecessor of a node is already final by the time the node is
// reached. That is the whole content of "dynamic programming on a DAG" --
// scheduling, critical paths, counting routes, longest increasing subsequence
// once it is written as a graph.
//
// The order is not a tidying step. Run the same recurrence in an arbitrary
// order and it silently under-reports, because a predecessor that has not been
// computed yet contributes nothing.

// A topological order, or an empty list if the graph is cyclic.
function kahn(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [u, v] of edges) {
    adj[u].push(v);
    indeg[v] += 1;
  }
  const ready = [];
  for (let v = 0; v < n; v += 1) if (indeg[v] === 0) ready.push(v);
  const order = [];
  let head = 0;
  while (head < ready.length) {
    const at = ready[head];
    head += 1;
    order.push(at);
    for (const nxt of adj[at]) {
      indeg[nxt] -= 1;
      if (indeg[nxt] === 0) ready.push(nxt);
    }
  }
  return order.length === n ? order : [];
}

// One pass in the given order. Returns the distances and the edges scanned.
function longestInOrder(n, edges, order) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  const best = new Array(n).fill(0);
  let scans = 0;
  for (const at of order) {
    for (const [nxt, w] of adj[at]) {
      scans += 1;
      if (best[at] + w > best[nxt]) best[nxt] = best[at] + w;
    }
  }
  return [best, scans];
}

// The order-free repair: keep relaxing until a pass changes nothing.
function longestUntilStable(n, edges) {
  const best = new Array(n).fill(0);
  let passes = 0;
  for (;;) {
    let changed = false;
    passes += 1;
    for (const [u, v, w] of edges) {
      if (best[u] + w > best[v]) {
        best[v] = best[u] + w;
        changed = true;
      }
    }
    if (!changed) return [best, passes];
  }
}

// The definition: the heaviest simple path ending at each node.
//
// Exponential, which is the point -- this is what the topological order
// buys a way out of.
function longestByWalking(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  const out = new Array(n).fill(0);
  let walked = 0;

  for (let start = 0; start < n; start += 1) {
    const seen = new Array(n).fill(false);
    const walk = (at, total) => {
      seen[at] = true;
      walked += 1;
      for (const [nxt, w] of adj[at]) {
        if (!seen[nxt]) {
          if (total + w > out[nxt]) out[nxt] = total + w;
          walk(nxt, total + w);
        }
      }
      seen[at] = false;
    };
    walk(start, 0);
  }
  return [out, walked];
}

function show(row) {
  return "[" + row.join(", ") + "]";
}

function label(edges) {
  return "[" + edges.map(([u, v, w]) => \`\${u}->\${v}:\${w}\`).join(", ") + "]";
}

const CASES = [
  [4, [[0, 1, 3], [1, 2, 4], [0, 2, 2], [2, 3, 1]]],
  [4, [[3, 2, 1], [2, 1, 1], [1, 0, 1]]],
  [5, [[0, 2, 5], [1, 2, 2], [2, 4, 1], [0, 3, 1], [3, 4, 9]]],
];

console.log("edges".padEnd(40) + " " + "topological".padEnd(16) + " " + "node order".padEnd(16) + " " + "truth");
for (const [n, edges] of CASES) {
  const order = kahn(n, edges.map(([u, v]) => [u, v]));
  const [a] = longestInOrder(n, edges, order);
  const [b] = longestInOrder(n, edges, Array.from({ length: n }, (_, i) => i));
  const [truth] = longestByWalking(n, edges);
  console.log(
    label(edges).padEnd(40) + " " + show(a).padEnd(16) + " " + show(b).padEnd(16) + " " + show(truth),
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 1234567n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let topoOk = 0;
let nodeOk = 0;
let stableOk = 0;
let nodeLow = 0;
let nodeHigh = 0;
let totalPasses = 0;
const same = (a, b) => a.every((x, i) => x === b[i]);
for (let t = 0; t < trials; t += 1) {
  const n = 3 + rand(4);
  const labels = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i -= 1) {
    const j = rand(i + 1);
    [labels[i], labels[j]] = [labels[j], labels[i]];
  }
  const edges = [];
  for (let u = 0; u < n; u += 1)
    for (let v = u + 1; v < n; v += 1)
      if (rand(3) === 0) edges.push([labels[u], labels[v], 1 + rand(9)]);
  const [truth] = longestByWalking(n, edges);
  const [a] = longestInOrder(n, edges, kahn(n, edges.map(([u, v]) => [u, v])));
  const [b] = longestInOrder(n, edges, Array.from({ length: n }, (_, i) => i));
  const [c, passes] = longestUntilStable(n, edges);
  if (same(a, truth)) topoOk += 1;
  if (same(b, truth)) nodeOk += 1;
  if (same(c, truth)) stableOk += 1;
  totalPasses += passes;
  for (let i = 0; i < n; i += 1) {
    if (b[i] < truth[i]) nodeLow += 1;
    if (b[i] > truth[i]) nodeHigh += 1;
  }
}

const row = (text, value) => "  " + text.padEnd(40) + " " + String(value).padStart(6);

console.log();
console.log(\`over \${trials} random acyclic graphs on 3 to 6 nodes:\`);
console.log(row("one pass in topological order", topoOk));
console.log(row("one pass in node order 0..n-1", nodeOk));
console.log(row("relaxing until nothing changes", stableOk));
console.log(row("entries node order left too low", nodeLow));
console.log(row("entries node order pushed too high", nodeHigh));
console.log(row("passes the stable version needed", totalPasses));

console.log();
console.log("and what the order is worth as the graph grows:");
console.log("nodes".padEnd(7) + " " + "edges scanned".padStart(14) + " " + "paths walked".padStart(16));
for (const n of [10, 14, 18, 22]) {
  const edges = [];
  for (let u = 0; u < n; u += 1)
    for (let v = u + 1; v < n; v += 1) edges.push([u, v, 1 + ((u * 7 + v) % 9)]);
  const [, scans] = longestInOrder(n, edges, kahn(n, edges.map(([u, v]) => [u, v])));
  const [, walked] = longestByWalking(n, edges);
  console.log(String(n).padEnd(7) + " " + String(scans).padStart(14) + " " + String(walked).padStart(16));
}

console.log();
console.log("The middle column of the demo is the failure, and row two is the");
console.log("clearest case: a path whose nodes are numbered backwards. Processed in");
console.log("node order, every node is reached before the node feeding it has been");
console.log("computed, so exactly one hop of information gets through and the far");
console.log("end reads 1 where the answer is 3.");
console.log();
console.log(\`Node order was wrong in one direction only: \${nodeLow} entries too low and \${nodeHigh}\`);
console.log("too high. That is the opposite of the shortest-path failures -- here the");
console.log("recurrence takes a maximum, so a predecessor that has not been computed");
console.log("contributes nothing rather than something wrong.");
console.log();
console.log("Relaxing until a pass changes nothing also works, and it is what you");
console.log(\`fall back to when there is no order to be had. It cost \${totalPasses} passes over\`);
console.log(\`\${trials} graphs where one pass in the right order would have done. And the\`);
console.log("last table is the real argument: on a complete DAG of 22 nodes the");
console.log("ordered pass scans 231 edges where walking every path takes over four");
console.log("million steps. Longest path is NP-hard in general; the acyclicity plus");
console.log("the order is what buys the linear algorithm.");
`,
            },
            {
              lang: "typescript",
              code: `// What the order is for: the hard problem that becomes linear on a DAG.
//
// Longest path is NP-hard in a general graph. On a directed acyclic graph it is
// one pass, and the reason is the topological order: process the nodes in it
// and every predecessor of a node is already final by the time the node is
// reached. That is the whole content of "dynamic programming on a DAG" --
// scheduling, critical paths, counting routes, longest increasing subsequence
// once it is written as a graph.
//
// The order is not a tidying step. Run the same recurrence in an arbitrary
// order and it silently under-reports, because a predecessor that has not been
// computed yet contributes nothing.

// A topological order, or an empty list if the graph is cyclic.
function kahn(n: number, edges: number[][]): number[] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [u, v] of edges) {
    adj[u].push(v);
    indeg[v] += 1;
  }
  const ready: number[] = [];
  for (let v = 0; v < n; v += 1) if (indeg[v] === 0) ready.push(v);
  const order: number[] = [];
  let head = 0;
  while (head < ready.length) {
    const at = ready[head];
    head += 1;
    order.push(at);
    for (const nxt of adj[at]) {
      indeg[nxt] -= 1;
      if (indeg[nxt] === 0) ready.push(nxt);
    }
  }
  return order.length === n ? order : [];
}

// One pass in the given order. Returns the distances and the edges scanned.
function longestInOrder(n: number, edges: number[][], order: number[]): [number[], number] {
  const adj: number[][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  const best = new Array(n).fill(0);
  let scans = 0;
  for (const at of order) {
    for (const [nxt, w] of adj[at]) {
      scans += 1;
      if (best[at] + w > best[nxt]) best[nxt] = best[at] + w;
    }
  }
  return [best, scans];
}

// The order-free repair: keep relaxing until a pass changes nothing.
function longestUntilStable(n: number, edges: number[][]): [number[], number] {
  const best = new Array(n).fill(0);
  let passes = 0;
  for (;;) {
    let changed = false;
    passes += 1;
    for (const [u, v, w] of edges) {
      if (best[u] + w > best[v]) {
        best[v] = best[u] + w;
        changed = true;
      }
    }
    if (!changed) return [best, passes];
  }
}

// The definition: the heaviest simple path ending at each node.
//
// Exponential, which is the point -- this is what the topological order
// buys a way out of.
function longestByWalking(n: number, edges: number[][]): [number[], number] {
  const adj: number[][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  const out = new Array(n).fill(0);
  let walked = 0;

  for (let start = 0; start < n; start += 1) {
    const seen = new Array(n).fill(false);
    const walk = (at: number, total: number): void => {
      seen[at] = true;
      walked += 1;
      for (const [nxt, w] of adj[at]) {
        if (!seen[nxt]) {
          if (total + w > out[nxt]) out[nxt] = total + w;
          walk(nxt, total + w);
        }
      }
      seen[at] = false;
    };
    walk(start, 0);
  }
  return [out, walked];
}

function show(row: number[]): string {
  return "[" + row.join(", ") + "]";
}

function label(edges: number[][]): string {
  return "[" + edges.map(([u, v, w]) => \`\${u}->\${v}:\${w}\`).join(", ") + "]";
}

const CASES: [number, number[][]][] = [
  [4, [[0, 1, 3], [1, 2, 4], [0, 2, 2], [2, 3, 1]]],
  [4, [[3, 2, 1], [2, 1, 1], [1, 0, 1]]],
  [5, [[0, 2, 5], [1, 2, 2], [2, 4, 1], [0, 3, 1], [3, 4, 9]]],
];

console.log("edges".padEnd(40) + " " + "topological".padEnd(16) + " " + "node order".padEnd(16) + " " + "truth");
for (const [n, edges] of CASES) {
  const order = kahn(n, edges.map(([u, v]) => [u, v]));
  const [a] = longestInOrder(n, edges, order);
  const [b] = longestInOrder(n, edges, Array.from({ length: n }, (_, i) => i));
  const [truth] = longestByWalking(n, edges);
  console.log(
    label(edges).padEnd(40) + " " + show(a).padEnd(16) + " " + show(b).padEnd(16) + " " + show(truth),
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 1234567n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let topoOk = 0;
let nodeOk = 0;
let stableOk = 0;
let nodeLow = 0;
let nodeHigh = 0;
let totalPasses = 0;
const same = (a: number[], b: number[]): boolean => a.every((x, i) => x === b[i]);
for (let t = 0; t < trials; t += 1) {
  const n = 3 + rand(4);
  const labels = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i -= 1) {
    const j = rand(i + 1);
    [labels[i], labels[j]] = [labels[j], labels[i]];
  }
  const edges: number[][] = [];
  for (let u = 0; u < n; u += 1)
    for (let v = u + 1; v < n; v += 1)
      if (rand(3) === 0) edges.push([labels[u], labels[v], 1 + rand(9)]);
  const [truth] = longestByWalking(n, edges);
  const [a] = longestInOrder(n, edges, kahn(n, edges.map(([u, v]) => [u, v])));
  const [b] = longestInOrder(n, edges, Array.from({ length: n }, (_, i) => i));
  const [c, passes] = longestUntilStable(n, edges);
  if (same(a, truth)) topoOk += 1;
  if (same(b, truth)) nodeOk += 1;
  if (same(c, truth)) stableOk += 1;
  totalPasses += passes;
  for (let i = 0; i < n; i += 1) {
    if (b[i] < truth[i]) nodeLow += 1;
    if (b[i] > truth[i]) nodeHigh += 1;
  }
}

const row = (text: string, value: number): string => "  " + text.padEnd(40) + " " + String(value).padStart(6);

console.log();
console.log(\`over \${trials} random acyclic graphs on 3 to 6 nodes:\`);
console.log(row("one pass in topological order", topoOk));
console.log(row("one pass in node order 0..n-1", nodeOk));
console.log(row("relaxing until nothing changes", stableOk));
console.log(row("entries node order left too low", nodeLow));
console.log(row("entries node order pushed too high", nodeHigh));
console.log(row("passes the stable version needed", totalPasses));

console.log();
console.log("and what the order is worth as the graph grows:");
console.log("nodes".padEnd(7) + " " + "edges scanned".padStart(14) + " " + "paths walked".padStart(16));
for (const n of [10, 14, 18, 22]) {
  const edges: number[][] = [];
  for (let u = 0; u < n; u += 1)
    for (let v = u + 1; v < n; v += 1) edges.push([u, v, 1 + ((u * 7 + v) % 9)]);
  const [, scans] = longestInOrder(n, edges, kahn(n, edges.map(([u, v]) => [u, v])));
  const [, walked] = longestByWalking(n, edges);
  console.log(String(n).padEnd(7) + " " + String(scans).padStart(14) + " " + String(walked).padStart(16));
}

console.log();
console.log("The middle column of the demo is the failure, and row two is the");
console.log("clearest case: a path whose nodes are numbered backwards. Processed in");
console.log("node order, every node is reached before the node feeding it has been");
console.log("computed, so exactly one hop of information gets through and the far");
console.log("end reads 1 where the answer is 3.");
console.log();
console.log(\`Node order was wrong in one direction only: \${nodeLow} entries too low and \${nodeHigh}\`);
console.log("too high. That is the opposite of the shortest-path failures -- here the");
console.log("recurrence takes a maximum, so a predecessor that has not been computed");
console.log("contributes nothing rather than something wrong.");
console.log();
console.log("Relaxing until a pass changes nothing also works, and it is what you");
console.log(\`fall back to when there is no order to be had. It cost \${totalPasses} passes over\`);
console.log(\`\${trials} graphs where one pass in the right order would have done. And the\`);
console.log("last table is the real argument: on a complete DAG of 22 nodes the");
console.log("ordered pass scans 231 edges where walking every path takes over four");
console.log("million steps. Longest path is NP-hard in general; the acyclicity plus");
console.log("the order is what buys the linear algorithm.");
`,
            },
            {
              lang: "java",
              code: `// What the order is for: the hard problem that becomes linear on a DAG.
//
// Longest path is NP-hard in a general graph. On a directed acyclic graph it is
// one pass, and the reason is the topological order: process the nodes in it
// and every predecessor of a node is already final by the time the node is
// reached. That is the whole content of "dynamic programming on a DAG" --
// scheduling, critical paths, counting routes, longest increasing subsequence
// once it is written as a graph.
//
// The order is not a tidying step. Run the same recurrence in an arbitrary
// order and it silently under-reports, because a predecessor that has not been
// computed yet contributes nothing.
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
    /** A topological order, or an empty list if the graph is cyclic. */
    static int[] kahn(int n, int[][] edges) {
        @SuppressWarnings("unchecked")
        List<Integer>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        int[] indeg = new int[n];
        for (int[] e : edges) {
            adj[e[0]].add(e[1]);
            indeg[e[1]]++;
        }
        int[] ready = new int[n];
        int tail = 0;
        for (int v = 0; v < n; v++) if (indeg[v] == 0) ready[tail++] = v;
        int[] order = new int[n];
        int head = 0, out = 0;
        while (head < tail) {
            int at = ready[head++];
            order[out++] = at;
            for (int nxt : adj[at]) {
                if (--indeg[nxt] == 0) ready[tail++] = nxt;
            }
        }
        return out == n ? order : new int[0];
    }

    static List<int[]>[] weighted(int n, int[][] edges) {
        @SuppressWarnings("unchecked")
        List<int[]>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : edges) adj[e[0]].add(new int[] {e[1], e[2]});
        return adj;
    }

    /** One pass in the given order. Returns the distances; scans go in stats. */
    static int[] longestInOrder(int n, int[][] edges, int[] order, long[] stats) {
        List<int[]>[] adj = weighted(n, edges);
        int[] best = new int[n];
        long scans = 0;
        for (int at : order) {
            for (int[] step : adj[at]) {
                scans++;
                if (best[at] + step[1] > best[step[0]]) best[step[0]] = best[at] + step[1];
            }
        }
        stats[0] = scans;
        return best;
    }

    /** The order-free repair: keep relaxing until a pass changes nothing. */
    static int[] longestUntilStable(int n, int[][] edges, int[] stats) {
        int[] best = new int[n];
        int passes = 0;
        while (true) {
            boolean changed = false;
            passes++;
            for (int[] e : edges) {
                if (best[e[0]] + e[2] > best[e[1]]) {
                    best[e[1]] = best[e[0]] + e[2];
                    changed = true;
                }
            }
            if (!changed) {
                stats[0] = passes;
                return best;
            }
        }
    }

    static void walk(List<int[]>[] adj, boolean[] seen, int[] out, long[] walked, int at,
                     int total) {
        seen[at] = true;
        walked[0]++;
        for (int[] step : adj[at]) {
            if (!seen[step[0]]) {
                if (total + step[1] > out[step[0]]) out[step[0]] = total + step[1];
                walk(adj, seen, out, walked, step[0], total + step[1]);
            }
        }
        seen[at] = false;
    }

    /**
     * The definition: the heaviest simple path ending at each node.
     *
     * <p>Exponential, which is the point -- this is what the topological order
     * buys a way out of.
     */
    static int[] longestByWalking(int n, int[][] edges, long[] stats) {
        List<int[]>[] adj = weighted(n, edges);
        int[] out = new int[n];
        long[] walked = new long[1];
        for (int start = 0; start < n; start++)
            walk(adj, new boolean[n], out, walked, start, 0);
        stats[0] = walked[0];
        return out;
    }

    static String show(int[] row) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < row.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(row[i]);
        }
        return sb.append("]").toString();
    }

    static String label(int[][] edges) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < edges.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(edges[i][0]).append("->").append(edges[i][1]).append(":").append(edges[i][2]);
        }
        return sb.append("]").toString();
    }

    static int[] nodeOrder(int n) {
        int[] order = new int[n];
        for (int i = 0; i < n; i++) order[i] = i;
        return order;
    }

    // The same linear congruential generator in every language, so the random
    // graphs below are the same graphs whichever translation is run.
    static long seed = 1234567L;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    static String row(String text, long value) {
        return String.format("  %-40s %6d", text, value);
    }

    public static void main(String[] args) {
        int[] caseN = {4, 4, 5};
        int[][][] caseEdges = {
            {{0, 1, 3}, {1, 2, 4}, {0, 2, 2}, {2, 3, 1}},
            {{3, 2, 1}, {2, 1, 1}, {1, 0, 1}},
            {{0, 2, 5}, {1, 2, 2}, {2, 4, 1}, {0, 3, 1}, {3, 4, 9}},
        };

        System.out.printf("%-40s %-16s %-16s %s%n",
            "edges", "topological", "node order", "truth");
        for (int c = 0; c < caseN.length; c++) {
            int n = caseN[c];
            int[][] edges = caseEdges[c];
            int[] a = longestInOrder(n, edges, kahn(n, edges), new long[1]);
            int[] b = longestInOrder(n, edges, nodeOrder(n), new long[1]);
            int[] truth = longestByWalking(n, edges, new long[1]);
            System.out.printf("%-40s %-16s %-16s %s%n", label(edges), show(a), show(b), show(truth));
        }

        int trials = 3000;
        int topoOk = 0, nodeOk = 0, stableOk = 0, nodeLow = 0, nodeHigh = 0;
        long totalPasses = 0;
        for (int t = 0; t < trials; t++) {
            int n = 3 + rand(4);
            int[] labels = new int[n];
            for (int i = 0; i < n; i++) labels[i] = i;
            for (int i = n - 1; i > 0; i--) {
                int j = rand(i + 1);
                int tmp = labels[i];
                labels[i] = labels[j];
                labels[j] = tmp;
            }
            List<int[]> built = new ArrayList<>();
            for (int u = 0; u < n; u++)
                for (int v = u + 1; v < n; v++)
                    if (rand(3) == 0)
                        built.add(new int[] {labels[u], labels[v], 1 + rand(9)});
            int[][] edges = built.toArray(new int[0][]);
            int[] truth = longestByWalking(n, edges, new long[1]);
            int[] a = longestInOrder(n, edges, kahn(n, edges), new long[1]);
            int[] b = longestInOrder(n, edges, nodeOrder(n), new long[1]);
            int[] passes = new int[1];
            int[] c = longestUntilStable(n, edges, passes);
            if (Arrays.equals(a, truth)) topoOk++;
            if (Arrays.equals(b, truth)) nodeOk++;
            if (Arrays.equals(c, truth)) stableOk++;
            totalPasses += passes[0];
            for (int i = 0; i < n; i++) {
                if (b[i] < truth[i]) nodeLow++;
                if (b[i] > truth[i]) nodeHigh++;
            }
        }

        System.out.println();
        System.out.println("over " + trials + " random acyclic graphs on 3 to 6 nodes:");
        System.out.println(row("one pass in topological order", topoOk));
        System.out.println(row("one pass in node order 0..n-1", nodeOk));
        System.out.println(row("relaxing until nothing changes", stableOk));
        System.out.println(row("entries node order left too low", nodeLow));
        System.out.println(row("entries node order pushed too high", nodeHigh));
        System.out.println(row("passes the stable version needed", totalPasses));

        System.out.println();
        System.out.println("and what the order is worth as the graph grows:");
        System.out.printf("%-7s %14s %16s%n", "nodes", "edges scanned", "paths walked");
        for (int n : new int[] {10, 14, 18, 22}) {
            List<int[]> built = new ArrayList<>();
            for (int u = 0; u < n; u++)
                for (int v = u + 1; v < n; v++)
                    built.add(new int[] {u, v, 1 + (u * 7 + v) % 9});
            int[][] edges = built.toArray(new int[0][]);
            long[] scans = new long[1];
            long[] walked = new long[1];
            longestInOrder(n, edges, kahn(n, edges), scans);
            longestByWalking(n, edges, walked);
            System.out.printf("%-7d %14d %16d%n", n, scans[0], walked[0]);
        }

        System.out.println();
        System.out.println("The middle column of the demo is the failure, and row two is the");
        System.out.println("clearest case: a path whose nodes are numbered backwards. Processed in");
        System.out.println("node order, every node is reached before the node feeding it has been");
        System.out.println("computed, so exactly one hop of information gets through and the far");
        System.out.println("end reads 1 where the answer is 3.");
        System.out.println();
        System.out.println("Node order was wrong in one direction only: " + nodeLow
            + " entries too low and " + nodeHigh);
        System.out.println("too high. That is the opposite of the shortest-path failures -- here the");
        System.out.println("recurrence takes a maximum, so a predecessor that has not been computed");
        System.out.println("contributes nothing rather than something wrong.");
        System.out.println();
        System.out.println("Relaxing until a pass changes nothing also works, and it is what you");
        System.out.println("fall back to when there is no order to be had. It cost " + totalPasses
            + " passes over");
        System.out.println(trials + " graphs where one pass in the right order would have done. And the");
        System.out.println("last table is the real argument: on a complete DAG of 22 nodes the");
        System.out.println("ordered pass scans 231 edges where walking every path takes over four");
        System.out.println("million steps. Longest path is NP-hard in general; the acyclicity plus");
        System.out.println("the order is what buys the linear algorithm.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// What the order is for: the hard problem that becomes linear on a DAG.
//
// Longest path is NP-hard in a general graph. On a directed acyclic graph it is
// one pass, and the reason is the topological order: process the nodes in it
// and every predecessor of a node is already final by the time the node is
// reached. That is the whole content of "dynamic programming on a DAG" --
// scheduling, critical paths, counting routes, longest increasing subsequence
// once it is written as a graph.
//
// The order is not a tidying step. Run the same recurrence in an arbitrary
// order and it silently under-reports, because a predecessor that has not been
// computed yet contributes nothing.
#include <array>
#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

using Edge = std::array<int, 3>;
using Adj = std::vector<std::vector<std::pair<int, int>>>;

// A topological order, or an empty list if the graph is cyclic.
std::vector<int> kahn(int n, const std::vector<Edge>& edges) {
    std::vector<std::vector<int>> adj(n);
    std::vector<int> indeg(n, 0);
    for (const Edge& e : edges) {
        adj[e[0]].push_back(e[1]);
        indeg[e[1]]++;
    }
    std::vector<int> ready;
    for (int v = 0; v < n; v++)
        if (indeg[v] == 0) ready.push_back(v);
    std::vector<int> order;
    size_t head = 0;
    while (head < ready.size()) {
        int at = ready[head++];
        order.push_back(at);
        for (int nxt : adj[at])
            if (--indeg[nxt] == 0) ready.push_back(nxt);
    }
    if (static_cast<int>(order.size()) != n) return std::vector<int>();
    return order;
}

Adj weighted(int n, const std::vector<Edge>& edges) {
    Adj adj(n);
    for (const Edge& e : edges) adj[e[0]].push_back({e[1], e[2]});
    return adj;
}

// One pass in the given order. Returns the distances and the edges scanned.
std::vector<int> longest_in_order(int n, const std::vector<Edge>& edges,
                                  const std::vector<int>& order, long long& scans) {
    Adj adj = weighted(n, edges);
    std::vector<int> best(n, 0);
    scans = 0;
    for (int at : order) {
        for (const auto& step : adj[at]) {
            scans++;
            if (best[at] + step.second > best[step.first])
                best[step.first] = best[at] + step.second;
        }
    }
    return best;
}

// The order-free repair: keep relaxing until a pass changes nothing.
std::vector<int> longest_until_stable(int n, const std::vector<Edge>& edges, int& passes) {
    std::vector<int> best(n, 0);
    passes = 0;
    for (;;) {
        bool changed = false;
        passes++;
        for (const Edge& e : edges) {
            if (best[e[0]] + e[2] > best[e[1]]) {
                best[e[1]] = best[e[0]] + e[2];
                changed = true;
            }
        }
        if (!changed) return best;
    }
}

void walk(const Adj& adj, std::vector<bool>& seen, std::vector<int>& out, long long& walked,
          int at, int total) {
    seen[at] = true;
    walked++;
    for (const auto& step : adj[at]) {
        if (!seen[step.first]) {
            if (total + step.second > out[step.first])
                out[step.first] = total + step.second;
            walk(adj, seen, out, walked, step.first, total + step.second);
        }
    }
    seen[at] = false;
}

// The definition: the heaviest simple path ending at each node.
//
// Exponential, which is the point -- this is what the topological order
// buys a way out of.
std::vector<int> longest_by_walking(int n, const std::vector<Edge>& edges, long long& walked) {
    Adj adj = weighted(n, edges);
    std::vector<int> out(n, 0);
    walked = 0;
    for (int start = 0; start < n; start++) {
        std::vector<bool> seen(n, false);
        walk(adj, seen, out, walked, start, 0);
    }
    return out;
}

std::string show(const std::vector<int>& row) {
    std::string s = "[";
    for (size_t i = 0; i < row.size(); i++) {
        if (i > 0) s += ", ";
        s += std::to_string(row[i]);
    }
    return s + "]";
}

std::string label(const std::vector<Edge>& edges) {
    std::string s = "[";
    for (size_t i = 0; i < edges.size(); i++) {
        if (i > 0) s += ", ";
        s += std::to_string(edges[i][0]) + "->" + std::to_string(edges[i][1]) + ":" +
             std::to_string(edges[i][2]);
    }
    return s + "]";
}

std::vector<int> node_order(int n) {
    std::vector<int> order(n);
    for (int i = 0; i < n; i++) order[i] = i;
    return order;
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
long long seed = 1234567;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

void row(const std::string& text, long long value) {
    std::cout << "  " << std::left << std::setw(40) << text << " " << std::right
              << std::setw(6) << value << "\\n";
}

int main() {
    std::vector<int> case_n = {4, 4, 5};
    std::vector<std::vector<Edge>> cases = {
        {{0, 1, 3}, {1, 2, 4}, {0, 2, 2}, {2, 3, 1}},
        {{3, 2, 1}, {2, 1, 1}, {1, 0, 1}},
        {{0, 2, 5}, {1, 2, 2}, {2, 4, 1}, {0, 3, 1}, {3, 4, 9}},
    };

    std::cout << std::left << std::setw(40) << "edges" << " " << std::setw(16) << "topological"
              << " " << std::setw(16) << "node order" << " " << "truth" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        int n = case_n[c];
        long long scans = 0, walked = 0;
        std::vector<int> a = longest_in_order(n, cases[c], kahn(n, cases[c]), scans);
        std::vector<int> b = longest_in_order(n, cases[c], node_order(n), scans);
        std::vector<int> truth = longest_by_walking(n, cases[c], walked);
        std::cout << std::left << std::setw(40) << label(cases[c]) << " " << std::setw(16)
                  << show(a) << " " << std::setw(16) << show(b) << " " << show(truth) << "\\n";
    }

    int trials = 3000;
    int topo_ok = 0, node_ok = 0, stable_ok = 0, node_low = 0, node_high = 0;
    long long total_passes = 0;
    for (int t = 0; t < trials; t++) {
        int n = 3 + rand_below(4);
        std::vector<int> labels(n);
        for (int i = 0; i < n; i++) labels[i] = i;
        for (int i = n - 1; i > 0; i--) {
            int j = rand_below(i + 1);
            std::swap(labels[i], labels[j]);
        }
        std::vector<Edge> edges;
        for (int u = 0; u < n; u++)
            for (int v = u + 1; v < n; v++)
                if (rand_below(3) == 0)
                    edges.push_back({labels[u], labels[v], 1 + rand_below(9)});
        long long scans = 0, walked = 0;
        int passes = 0;
        std::vector<int> truth = longest_by_walking(n, edges, walked);
        std::vector<int> a = longest_in_order(n, edges, kahn(n, edges), scans);
        std::vector<int> b = longest_in_order(n, edges, node_order(n), scans);
        std::vector<int> c = longest_until_stable(n, edges, passes);
        if (a == truth) topo_ok++;
        if (b == truth) node_ok++;
        if (c == truth) stable_ok++;
        total_passes += passes;
        for (int i = 0; i < n; i++) {
            if (b[i] < truth[i]) node_low++;
            if (b[i] > truth[i]) node_high++;
        }
    }

    std::cout << "\\n";
    std::cout << "over " << trials << " random acyclic graphs on 3 to 6 nodes:\\n";
    row("one pass in topological order", topo_ok);
    row("one pass in node order 0..n-1", node_ok);
    row("relaxing until nothing changes", stable_ok);
    row("entries node order left too low", node_low);
    row("entries node order pushed too high", node_high);
    row("passes the stable version needed", total_passes);

    std::cout << "\\n";
    std::cout << "and what the order is worth as the graph grows:\\n";
    std::cout << std::left << std::setw(7) << "nodes" << " " << std::right << std::setw(14)
              << "edges scanned" << " " << std::setw(16) << "paths walked" << "\\n";
    for (int n : {10, 14, 18, 22}) {
        std::vector<Edge> edges;
        for (int u = 0; u < n; u++)
            for (int v = u + 1; v < n; v++)
                edges.push_back({u, v, 1 + (u * 7 + v) % 9});
        long long scans = 0, walked = 0;
        longest_in_order(n, edges, kahn(n, edges), scans);
        longest_by_walking(n, edges, walked);
        std::cout << std::left << std::setw(7) << n << " " << std::right << std::setw(14)
                  << scans << " " << std::setw(16) << walked << "\\n";
    }

    std::cout << "\\n";
    std::cout << "The middle column of the demo is the failure, and row two is the\\n";
    std::cout << "clearest case: a path whose nodes are numbered backwards. Processed in\\n";
    std::cout << "node order, every node is reached before the node feeding it has been\\n";
    std::cout << "computed, so exactly one hop of information gets through and the far\\n";
    std::cout << "end reads 1 where the answer is 3.\\n";
    std::cout << "\\n";
    std::cout << "Node order was wrong in one direction only: " << node_low
              << " entries too low and " << node_high << "\\n";
    std::cout << "too high. That is the opposite of the shortest-path failures -- here the\\n";
    std::cout << "recurrence takes a maximum, so a predecessor that has not been computed\\n";
    std::cout << "contributes nothing rather than something wrong.\\n";
    std::cout << "\\n";
    std::cout << "Relaxing until a pass changes nothing also works, and it is what you\\n";
    std::cout << "fall back to when there is no order to be had. It cost " << total_passes
              << " passes over\\n";
    std::cout << trials << " graphs where one pass in the right order would have done. And the\\n";
    std::cout << "last table is the real argument: on a complete DAG of 22 nodes the\\n";
    std::cout << "ordered pass scans 231 edges where walking every path takes over four\\n";
    std::cout << "million steps. Longest path is NP-hard in general; the acyclicity plus\\n";
    std::cout << "the order is what buys the linear algorithm.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// What the order is for: the hard problem that becomes linear on a DAG.
//
// Longest path is NP-hard in a general graph. On a directed acyclic graph it is
// one pass, and the reason is the topological order: process the nodes in it
// and every predecessor of a node is already final by the time the node is
// reached. That is the whole content of "dynamic programming on a DAG" --
// scheduling, critical paths, counting routes, longest increasing subsequence
// once it is written as a graph.
//
// The order is not a tidying step. Run the same recurrence in an arbitrary
// order and it silently under-reports, because a predecessor that has not been
// computed yet contributes nothing.
type Edge = (usize, usize, i64);
type Adj = Vec<Vec<(usize, i64)>>;

/// A topological order, or an empty list if the graph is cyclic.
fn kahn(n: usize, edges: &[Edge]) -> Vec<usize> {
    let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
    let mut indeg = vec![0usize; n];
    for &(u, v, _) in edges {
        adj[u].push(v);
        indeg[v] += 1;
    }
    let mut ready: Vec<usize> = (0..n).filter(|&v| indeg[v] == 0).collect();
    let mut order: Vec<usize> = Vec::new();
    let mut head = 0;
    while head < ready.len() {
        let at = ready[head];
        head += 1;
        order.push(at);
        for idx in 0..adj[at].len() {
            let nxt = adj[at][idx];
            indeg[nxt] -= 1;
            if indeg[nxt] == 0 {
                ready.push(nxt);
            }
        }
    }
    if order.len() == n {
        order
    } else {
        Vec::new()
    }
}

fn weighted(n: usize, edges: &[Edge]) -> Adj {
    let mut adj: Adj = vec![Vec::new(); n];
    for &(u, v, w) in edges {
        adj[u].push((v, w));
    }
    adj
}

/// One pass in the given order. Returns the distances and the edges scanned.
fn longest_in_order(n: usize, edges: &[Edge], order: &[usize]) -> (Vec<i64>, u64) {
    let adj = weighted(n, edges);
    let mut best = vec![0i64; n];
    let mut scans: u64 = 0;
    for &at in order {
        for idx in 0..adj[at].len() {
            let (nxt, w) = adj[at][idx];
            scans += 1;
            if best[at] + w > best[nxt] {
                best[nxt] = best[at] + w;
            }
        }
    }
    (best, scans)
}

/// The order-free repair: keep relaxing until a pass changes nothing.
fn longest_until_stable(n: usize, edges: &[Edge]) -> (Vec<i64>, u64) {
    let mut best = vec![0i64; n];
    let mut passes: u64 = 0;
    loop {
        let mut changed = false;
        passes += 1;
        for &(u, v, w) in edges {
            if best[u] + w > best[v] {
                best[v] = best[u] + w;
                changed = true;
            }
        }
        if !changed {
            return (best, passes);
        }
    }
}

fn walk(adj: &Adj, seen: &mut [bool], out: &mut [i64], walked: &mut u64, at: usize, total: i64) {
    seen[at] = true;
    *walked += 1;
    for idx in 0..adj[at].len() {
        let (nxt, w) = adj[at][idx];
        if !seen[nxt] {
            if total + w > out[nxt] {
                out[nxt] = total + w;
            }
            walk(adj, seen, out, walked, nxt, total + w);
        }
    }
    seen[at] = false;
}

/// The definition: the heaviest simple path ending at each node.
///
/// Exponential, which is the point -- this is what the topological order
/// buys a way out of.
fn longest_by_walking(n: usize, edges: &[Edge]) -> (Vec<i64>, u64) {
    let adj = weighted(n, edges);
    let mut out = vec![0i64; n];
    let mut walked: u64 = 0;
    for start in 0..n {
        let mut seen = vec![false; n];
        walk(&adj, &mut seen, &mut out, &mut walked, start, 0);
    }
    (out, walked)
}

fn show(row: &[i64]) -> String {
    let cells: Vec<String> = row.iter().map(|x| x.to_string()).collect();
    format!("[{}]", cells.join(", "))
}

fn label(edges: &[Edge]) -> String {
    let cells: Vec<String> = edges
        .iter()
        .map(|&(u, v, w)| format!("{}->{}:{}", u, v, w))
        .collect();
    format!("[{}]", cells.join(", "))
}

fn node_order(n: usize) -> Vec<usize> {
    (0..n).collect()
}

/// The same linear congruential generator in every language, so the random
/// graphs below are the same graphs whichever translation is run.
struct Rng {
    seed: i64,
}

impl Rng {
    fn next(&mut self, n: i64) -> i64 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        self.seed / 65536 % n
    }
}

fn row(text: &str, value: u64) {
    println!("  {:<40} {:>6}", text, value);
}

fn main() {
    let case_n = [4usize, 4, 5];
    let cases: Vec<Vec<Edge>> = vec![
        vec![(0, 1, 3), (1, 2, 4), (0, 2, 2), (2, 3, 1)],
        vec![(3, 2, 1), (2, 1, 1), (1, 0, 1)],
        vec![(0, 2, 5), (1, 2, 2), (2, 4, 1), (0, 3, 1), (3, 4, 9)],
    ];

    println!(
        "{:<40} {:<16} {:<16} {}",
        "edges", "topological", "node order", "truth"
    );
    for c in 0..cases.len() {
        let n = case_n[c];
        let (a, _) = longest_in_order(n, &cases[c], &kahn(n, &cases[c]));
        let (b, _) = longest_in_order(n, &cases[c], &node_order(n));
        let (truth, _) = longest_by_walking(n, &cases[c]);
        println!(
            "{:<40} {:<16} {:<16} {}",
            label(&cases[c]),
            show(&a),
            show(&b),
            show(&truth)
        );
    }

    let mut rng = Rng { seed: 1234567 };
    let trials = 3000;
    let (mut topo_ok, mut node_ok, mut stable_ok) = (0u64, 0u64, 0u64);
    let (mut node_low, mut node_high) = (0u64, 0u64);
    let mut total_passes: u64 = 0;
    for _ in 0..trials {
        let n = 3 + rng.next(4) as usize;
        let mut labels: Vec<usize> = (0..n).collect();
        for i in (1..n).rev() {
            let j = rng.next(i as i64 + 1) as usize;
            labels.swap(i, j);
        }
        let mut edges: Vec<Edge> = Vec::new();
        for u in 0..n {
            for v in (u + 1)..n {
                if rng.next(3) == 0 {
                    edges.push((labels[u], labels[v], 1 + rng.next(9)));
                }
            }
        }
        let (truth, _) = longest_by_walking(n, &edges);
        let (a, _) = longest_in_order(n, &edges, &kahn(n, &edges));
        let (b, _) = longest_in_order(n, &edges, &node_order(n));
        let (c, passes) = longest_until_stable(n, &edges);
        if a == truth {
            topo_ok += 1;
        }
        if b == truth {
            node_ok += 1;
        }
        if c == truth {
            stable_ok += 1;
        }
        total_passes += passes;
        for i in 0..n {
            if b[i] < truth[i] {
                node_low += 1;
            }
            if b[i] > truth[i] {
                node_high += 1;
            }
        }
    }

    println!();
    println!("over {} random acyclic graphs on 3 to 6 nodes:", trials);
    row("one pass in topological order", topo_ok);
    row("one pass in node order 0..n-1", node_ok);
    row("relaxing until nothing changes", stable_ok);
    row("entries node order left too low", node_low);
    row("entries node order pushed too high", node_high);
    row("passes the stable version needed", total_passes);

    println!();
    println!("and what the order is worth as the graph grows:");
    println!("{:<7} {:>14} {:>16}", "nodes", "edges scanned", "paths walked");
    for &n in &[10usize, 14, 18, 22] {
        let mut edges: Vec<Edge> = Vec::new();
        for u in 0..n {
            for v in (u + 1)..n {
                edges.push((u, v, 1 + ((u * 7 + v) % 9) as i64));
            }
        }
        let (_, scans) = longest_in_order(n, &edges, &kahn(n, &edges));
        let (_, walked) = longest_by_walking(n, &edges);
        println!("{:<7} {:>14} {:>16}", n, scans, walked);
    }

    println!();
    println!("The middle column of the demo is the failure, and row two is the");
    println!("clearest case: a path whose nodes are numbered backwards. Processed in");
    println!("node order, every node is reached before the node feeding it has been");
    println!("computed, so exactly one hop of information gets through and the far");
    println!("end reads 1 where the answer is 3.");
    println!();
    println!(
        "Node order was wrong in one direction only: {} entries too low and {}",
        node_low, node_high
    );
    println!("too high. That is the opposite of the shortest-path failures -- here the");
    println!("recurrence takes a maximum, so a predecessor that has not been computed");
    println!("contributes nothing rather than something wrong.");
    println!();
    println!("Relaxing until a pass changes nothing also works, and it is what you");
    println!(
        "fall back to when there is no order to be had. It cost {} passes over",
        total_passes
    );
    println!(
        "{} graphs where one pass in the right order would have done. And the",
        trials
    );
    println!("last table is the real argument: on a complete DAG of 22 nodes the");
    println!("ordered pass scans 231 edges where walking every path takes over four");
    println!("million steps. Longest path is NP-hard in general; the acyclicity plus");
    println!("the order is what buys the linear algorithm.");
}
`,
            },
            {
              lang: "go",
              code: `// What the order is for: the hard problem that becomes linear on a DAG.
//
// Longest path is NP-hard in a general graph. On a directed acyclic graph it is
// one pass, and the reason is the topological order: process the nodes in it
// and every predecessor of a node is already final by the time the node is
// reached. That is the whole content of "dynamic programming on a DAG" --
// scheduling, critical paths, counting routes, longest increasing subsequence
// once it is written as a graph.
//
// The order is not a tidying step. Run the same recurrence in an arbitrary
// order and it silently under-reports, because a predecessor that has not been
// computed yet contributes nothing.
package main

import (
	"fmt"
	"strings"
)

// Edge is a directed edge with a weight.
type Edge struct {
	U, V, W int
}

// kahn gives a topological order, or an empty list if the graph is cyclic.
func kahn(n int, edges []Edge) []int {
	adj := make([][]int, n)
	indeg := make([]int, n)
	for _, e := range edges {
		adj[e.U] = append(adj[e.U], e.V)
		indeg[e.V]++
	}
	var ready []int
	for v := 0; v < n; v++ {
		if indeg[v] == 0 {
			ready = append(ready, v)
		}
	}
	var order []int
	head := 0
	for head < len(ready) {
		at := ready[head]
		head++
		order = append(order, at)
		for _, nxt := range adj[at] {
			indeg[nxt]--
			if indeg[nxt] == 0 {
				ready = append(ready, nxt)
			}
		}
	}
	if len(order) != n {
		return nil
	}
	return order
}

func weighted(n int, edges []Edge) [][][2]int {
	adj := make([][][2]int, n)
	for _, e := range edges {
		adj[e.U] = append(adj[e.U], [2]int{e.V, e.W})
	}
	return adj
}

// longestInOrder makes one pass in the given order. It returns the distances
// and the edges scanned.
func longestInOrder(n int, edges []Edge, order []int) ([]int, int64) {
	adj := weighted(n, edges)
	best := make([]int, n)
	var scans int64
	for _, at := range order {
		for _, step := range adj[at] {
			scans++
			if best[at]+step[1] > best[step[0]] {
				best[step[0]] = best[at] + step[1]
			}
		}
	}
	return best, scans
}

// longestUntilStable is the order-free repair: keep relaxing until a pass
// changes nothing.
func longestUntilStable(n int, edges []Edge) ([]int, int64) {
	best := make([]int, n)
	var passes int64
	for {
		changed := false
		passes++
		for _, e := range edges {
			if best[e.U]+e.W > best[e.V] {
				best[e.V] = best[e.U] + e.W
				changed = true
			}
		}
		if !changed {
			return best, passes
		}
	}
}

func walk(adj [][][2]int, seen []bool, out []int, walked *int64, at, total int) {
	seen[at] = true
	*walked++
	for _, step := range adj[at] {
		if !seen[step[0]] {
			if total+step[1] > out[step[0]] {
				out[step[0]] = total + step[1]
			}
			walk(adj, seen, out, walked, step[0], total+step[1])
		}
	}
	seen[at] = false
}

// longestByWalking is the definition: the heaviest simple path ending at each
// node.
//
// Exponential, which is the point -- this is what the topological order
// buys a way out of.
func longestByWalking(n int, edges []Edge) ([]int, int64) {
	adj := weighted(n, edges)
	out := make([]int, n)
	var walked int64
	for start := 0; start < n; start++ {
		walk(adj, make([]bool, n), out, &walked, start, 0)
	}
	return out, walked
}

func same(a, b []int) bool {
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func show(row []int) string {
	cells := make([]string, len(row))
	for i, x := range row {
		cells[i] = fmt.Sprint(x)
	}
	return "[" + strings.Join(cells, ", ") + "]"
}

func label(edges []Edge) string {
	cells := make([]string, len(edges))
	for i, e := range edges {
		cells[i] = fmt.Sprintf("%d->%d:%d", e.U, e.V, e.W)
	}
	return "[" + strings.Join(cells, ", ") + "]"
}

func nodeOrder(n int) []int {
	order := make([]int, n)
	for i := range order {
		order[i] = i
	}
	return order
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
var seed int64 = 1234567

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func row(text string, value int64) {
	fmt.Printf("  %-40s %6d\\n", text, value)
}

func main() {
	caseN := []int{4, 4, 5}
	cases := [][]Edge{
		{{0, 1, 3}, {1, 2, 4}, {0, 2, 2}, {2, 3, 1}},
		{{3, 2, 1}, {2, 1, 1}, {1, 0, 1}},
		{{0, 2, 5}, {1, 2, 2}, {2, 4, 1}, {0, 3, 1}, {3, 4, 9}},
	}

	fmt.Printf("%-40s %-16s %-16s %s\\n", "edges", "topological", "node order", "truth")
	for c := range cases {
		n := caseN[c]
		a, _ := longestInOrder(n, cases[c], kahn(n, cases[c]))
		b, _ := longestInOrder(n, cases[c], nodeOrder(n))
		truth, _ := longestByWalking(n, cases[c])
		fmt.Printf("%-40s %-16s %-16s %s\\n", label(cases[c]), show(a), show(b), show(truth))
	}

	trials := 3000
	topoOk, nodeOk, stableOk, nodeLow, nodeHigh := 0, 0, 0, 0, 0
	var totalPasses int64
	for t := 0; t < trials; t++ {
		n := 3 + randBelow(4)
		labels := make([]int, n)
		for i := range labels {
			labels[i] = i
		}
		for i := n - 1; i > 0; i-- {
			j := randBelow(i + 1)
			labels[i], labels[j] = labels[j], labels[i]
		}
		var edges []Edge
		for u := 0; u < n; u++ {
			for v := u + 1; v < n; v++ {
				if randBelow(3) == 0 {
					edges = append(edges, Edge{labels[u], labels[v], 1 + randBelow(9)})
				}
			}
		}
		truth, _ := longestByWalking(n, edges)
		a, _ := longestInOrder(n, edges, kahn(n, edges))
		b, _ := longestInOrder(n, edges, nodeOrder(n))
		c, passes := longestUntilStable(n, edges)
		if same(a, truth) {
			topoOk++
		}
		if same(b, truth) {
			nodeOk++
		}
		if same(c, truth) {
			stableOk++
		}
		totalPasses += passes
		for i := 0; i < n; i++ {
			if b[i] < truth[i] {
				nodeLow++
			}
			if b[i] > truth[i] {
				nodeHigh++
			}
		}
	}

	fmt.Println()
	fmt.Printf("over %d random acyclic graphs on 3 to 6 nodes:\\n", trials)
	row("one pass in topological order", int64(topoOk))
	row("one pass in node order 0..n-1", int64(nodeOk))
	row("relaxing until nothing changes", int64(stableOk))
	row("entries node order left too low", int64(nodeLow))
	row("entries node order pushed too high", int64(nodeHigh))
	row("passes the stable version needed", totalPasses)

	fmt.Println()
	fmt.Println("and what the order is worth as the graph grows:")
	fmt.Printf("%-7s %14s %16s\\n", "nodes", "edges scanned", "paths walked")
	for _, n := range []int{10, 14, 18, 22} {
		var edges []Edge
		for u := 0; u < n; u++ {
			for v := u + 1; v < n; v++ {
				edges = append(edges, Edge{u, v, 1 + (u*7+v)%9})
			}
		}
		_, scans := longestInOrder(n, edges, kahn(n, edges))
		_, walked := longestByWalking(n, edges)
		fmt.Printf("%-7d %14d %16d\\n", n, scans, walked)
	}

	fmt.Println()
	fmt.Println("The middle column of the demo is the failure, and row two is the")
	fmt.Println("clearest case: a path whose nodes are numbered backwards. Processed in")
	fmt.Println("node order, every node is reached before the node feeding it has been")
	fmt.Println("computed, so exactly one hop of information gets through and the far")
	fmt.Println("end reads 1 where the answer is 3.")
	fmt.Println()
	fmt.Printf("Node order was wrong in one direction only: %d entries too low and %d\\n", nodeLow, nodeHigh)
	fmt.Println("too high. That is the opposite of the shortest-path failures -- here the")
	fmt.Println("recurrence takes a maximum, so a predecessor that has not been computed")
	fmt.Println("contributes nothing rather than something wrong.")
	fmt.Println()
	fmt.Println("Relaxing until a pass changes nothing also works, and it is what you")
	fmt.Printf("fall back to when there is no order to be had. It cost %d passes over\\n", totalPasses)
	fmt.Printf("%d graphs where one pass in the right order would have done. And the\\n", trials)
	fmt.Println("last table is the real argument: on a complete DAG of 22 nodes the")
	fmt.Println("ordered pass scans 231 edges where walking every path takes over four")
	fmt.Println("million steps. Longest path is NP-hard in general; the acyclicity plus")
	fmt.Println("the order is what buys the linear algorithm.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Running the recurrence in node order because the graph \"looks sorted\"",
          body: "It matched the truth on 2,230 of 3,000 graphs, so it passes most tests. Every failure was one-sided -- 1,145 entries too low, none too high -- because an uncomputed predecessor contributes nothing rather than something visibly wrong.",
        },
        {
          title: "Reaching for a search when the graph is acyclic",
          body: "Longest path is NP-hard in general and one pass on a DAG. On a complete DAG of 22 nodes that is 231 edges scanned against 4,194,303 paths walked. Check for acyclicity before deciding the problem is hard.",
        },
        {
          title: "Forgetting that longest path needs the acyclicity, not just the order",
          body: "The order only exists because the graph is acyclic, and the recurrence is only well founded for the same reason. On a graph with a cycle there is no order to compute and no finite longest path either -- the relaxing fallback would run forever on a positive cycle.",
        },
      ],
    },
    {
      id: "topological-sort-in-four-lines",
      heading: "Topological sort in four lines",
      body: [
        "Topological sort, in four lines.",
        "**Two opposite algorithms, both linear.** Kahn takes nodes nothing points at; DFS reverses the finishing order. Both were valid on all 1,979 acyclic graphs and both refused all 1,021 cyclic ones.",
        "**The cycle check is free** \u2014 a count in Kahn, a third colour in DFS. Neither adds a pass.",
        "**The order is not unique.** The two algorithms agreed on 156 of 1,979 graphs; only 66 of 3,000 graphs had a single valid order, and one had 720. Test the property, not the sequence.",
        "**The order is what makes DAG dynamic programming work.** One pass in it matched an exhaustive walk 3,000 out of 3,000; one pass in node order managed 2,230, always under-reporting.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Give me two ways to topologically sort a graph, and how each one detects a cycle.",
      answer:
        "Kahn's algorithm works front to back: compute indegrees, put every node with indegree zero in a ready set, and repeatedly take one out, emit it, and decrement its neighbours. It detects a cycle by counting -- if it emits fewer than n nodes, some node never reached indegree zero, which can only happen inside a loop. The DFS version works back to front: finish a node only after everything it points at is finished, then reverse the finishing order. It detects a cycle with three colours -- white untouched, grey started-but-not-finished, black finished -- and walking into a grey node means walking into the path you are currently on. Neither check is an extra pass. I measured both on 3,000 random graphs: 1,021 held a cycle and both refused all of them, and both produced a valid order on all 1,979 that did not.",
    },
    {
      question: "Is the topological order unique?",
      answer:
        "Almost never. Over 3,000 random acyclic graphs only 66 had exactly one valid order, and one graph had 720. Kahn and DFS produced the same order on only 156 of 1,979 graphs -- both correct, just different. The practical consequence is that a test asserting a specific sequence is testing which container you used for the ready set, not whether the sort works. I would assert the property instead: every edge points forwards. And if the problem genuinely wants a specific order, usually the lexicographically smallest, that is a different question -- put the ready nodes in a min-heap. I measured that: the heap gave the smallest order on all 3,000 graphs, a plain queue on 1,521 and a stack on 107.",
    },
    {
      question: "Why does dynamic programming on a DAG need a topological order?",
      answer:
        "Because the recurrence for a node reads its predecessors, and the order is the guarantee that they are already final. Longest path is NP-hard in a general graph and one pass on a DAG, and that is the entire difference. I measured what happens without it: one pass in topological order matched an exhaustive walk over every simple path on all 3,000 random DAGs, and one pass in node order 0 to n-1 matched on 2,230. The failures are one-sided in the opposite direction to a shortest-path bug -- 1,145 entries too low and none too high -- because the recurrence takes a maximum, so an uncomputed predecessor contributes nothing rather than something wrong. If you would rather not build the order you can relax every edge until a pass changes nothing, which is correct on a DAG and cost 5,710 passes where 3,000 would have done — but it is no way round a cycle, since a positive one makes it run forever.",
    },
    {
      question: "What kinds of problems are DAG dynamic programming in disguise?",
      answer:
        "Anything with a dependency structure and no cycles. Task scheduling and critical paths are the obvious ones -- the longest path through the DAG is the minimum time the project can take. Counting distinct routes between two nodes is the same pass with addition instead of maximum. Longest increasing subsequence is a DAG once you draw an edge from each element to every larger element after it. Course prerequisites, build systems, spreadsheet recalculation. The tell is that a value depends on other values and the dependency graph has no cycles -- at which point the topological order tells you the evaluation order, and the whole thing is one linear pass.",
    },
  ],
  takeaways: [
    "Kahn works front to back, DFS back to front; both are linear and both are correct.",
    "Kahn detects a cycle by emitting fewer than `n` nodes; DFS by walking into a grey node.",
    "Both refused all 1,021 cyclic graphs and ordered all 1,979 acyclic ones.",
    "The two produced the same order on only 156 of 1,979 graphs \u2014 both right, just different.",
    "Only 66 of 3,000 graphs had a single valid order; one had 720.",
    "A queue, a stack and a heap are all correct; only the heap gives the lexicographically smallest.",
    "Assert that every edge points forwards, not that the output equals a specific sequence.",
    "DAG dynamic programming is one pass, and the topological order is why.",
    "In node order instead: 2,230 of 3,000 correct, with 1,145 entries too low and none too high.",
    "On a complete DAG of 22 nodes: 231 edges scanned against 4,194,303 paths walked.",
  ],
  status: "available",
};
