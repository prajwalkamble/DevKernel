import type { Lesson } from "@/content/types";

export const cycleDetectionLesson: Lesson = {
  id: "dsa-graphs-cycle-detection",
  slug: "cycle-detection",
  moduleSlug: "graphs",
  title: "Cycle Detection",
  summary:
    "The last thing a traversal is asked for, and the two algorithms it takes: the exemption that turns a visited check into an undirected cycle detector, the three colours that are needed once the edges point somewhere, and the measured gap between asking whether a cycle exists and asking how many there are.",
  estimatedMinutes: 45,
  objectives: [
    "Write an undirected cycle check with the right exemption, and say what happens without it",
    "Explain why a visited check is wrong on a directed graph, with a concrete graph",
    "Use the three-colour walk, and return the cycle rather than a boolean",
    "Tell apart the linear, polynomial and exponential questions about cycles",
  ],
  sections: [
    {
      id: "the-edge-you-came-in-on",
      heading: "The edge you came in on",
      body: [
        "A depth-first walk meets an already-visited node constantly, and almost none of those meetings are cycles. The node you just came from is always already visited. So cycle detection is not \"look for a visited node\" \u2014 it is \"look for a visited node **other than the one that let you in**\", and that exemption is the entire algorithm.",
        "Without it, every edge looks like a cycle. Measured over 3,000 random graphs, the no-exemption version claimed a cycle on 1,770 graphs that had none, and was right only on the 482 that genuinely did. It is not subtly wrong; it is wrong on every graph with an edge and no loop.",
        "There are two ways to write the exemption \u2014 remember the node you came from, or remember the edge you came along \u2014 and both were exactly correct on all 3,000 simple graphs. The oracle they were scored against needs no search at all: an undirected graph is acyclic exactly when its edge count equals its node count minus its number of components.",
        "The node version is widely said to be blind to a pair of nodes joined twice, since the second edge leads back to the node it was told to skip. That is worth measuring rather than repeating, and the measurement says otherwise: on 3,000 random multigraphs, 856 of which contained a repeated pair, it was correct 3,000 times. The reason is that the second of the two edges is still sitting in the *parent's* own neighbour list, so the walk finds it on the way back out. The edge version is still the one to write, because it is correct without needing that argument.",
        "And there is a third method that never walks the graph: join the two ends of each edge in turn, and the first edge whose ends are already joined closes a cycle. That is union-find, correct on all 6,000 graphs here, and it is the same machinery Kruskal's algorithm runs on in the next module.",
      ],
      examples: [
        {
          id: "the-exemption",
          title: "Four undirected cycle tests, scored against counting edges",
          lang: "python",
          code: `# Cycle detection on an undirected graph, and the one line that makes it work.
#
# A depth-first walk meets an already-visited node constantly, and that is not
# a cycle by itself: the node you have just come from is always already
# visited. So the walk needs an exemption for the edge it arrived on. Without
# one, every single edge looks like a cycle.
#
# There are two ways to write the exemption -- remember the node you came from,
# or remember the edge you came along -- and a third method that does not walk
# the graph at all. All three are scored against an oracle that needs no search
# either: an undirected graph is acyclic exactly when its edge count equals its
# node count minus its number of components.


def build(n, edges):
    """Each entry is (neighbour, which edge). The edge number matters below."""
    neighbours = [[] for _ in range(n)]
    for i in range(len(edges)):
        u, v = edges[i]
        neighbours[u].append((v, i))
        neighbours[v].append((u, i))
    return neighbours


def count_components(neighbours):
    n = len(neighbours)
    seen = [False] * n
    count = 0
    for start in range(n):
        if seen[start]:
            continue
        count += 1
        stack = [start]
        seen[start] = True
        while stack:
            v = stack.pop()
            for u, _ in neighbours[v]:
                if not seen[u]:
                    seen[u] = True
                    stack.append(u)
    return count


def has_cycle_by_counting(n, edges):
    """The oracle. A forest has exactly n - components edges; more means a cycle."""
    neighbours = build(n, edges)
    return len(edges) > n - count_components(neighbours)


def has_cycle_ignoring_nothing(n, edges):
    """No exemption at all. Reports a cycle for every edge there is."""
    neighbours = build(n, edges)
    seen = [False] * n
    found = [False]

    def walk(v):
        seen[v] = True
        for u, _ in neighbours[v]:
            if seen[u]:
                found[0] = True
            else:
                walk(u)

    for start in range(n):
        if not seen[start]:
            walk(start)
    return found[0]


def has_cycle_ignoring_node(n, edges):
    """Skip the node we came from."""
    neighbours = build(n, edges)
    seen = [False] * n
    found = [False]

    def walk(v, came_from):
        seen[v] = True
        for u, _ in neighbours[v]:
            if u == came_from:
                continue
            if seen[u]:
                found[0] = True
            else:
                walk(u, v)

    for start in range(n):
        if not seen[start]:
            walk(start, -1)
    return found[0]


def has_cycle_ignoring_edge(n, edges):
    """Skip the edge we arrived along. One integer, and no argument needed."""
    neighbours = build(n, edges)
    seen = [False] * n
    found = [False]

    def walk(v, came_by):
        seen[v] = True
        for u, which in neighbours[v]:
            if which == came_by:
                continue
            if seen[u]:
                found[0] = True
            else:
                walk(u, which)

    for start in range(n):
        if not seen[start]:
            walk(start, -1)
    return found[0]


def has_cycle_by_union(n, edges):
    """No walk at all: join the ends of each edge, and a repeat join is a cycle."""
    parent = [v for v in range(n)]

    def root(v):
        while parent[v] != v:
            parent[v] = parent[parent[v]]
            v = parent[v]
        return v

    for u, v in edges:
        a = root(u)
        b = root(v)
        if a == b:
            return True
        parent[a] = b
    return False


def yes_no(flag):
    return "yes" if flag else "no"


def show_edges(edges):
    return "[" + ", ".join(f"{u}-{v}" for u, v in edges) + "]"


CASES = [
    (4, [(0, 1), (1, 2), (2, 3)]),
    (4, [(0, 1), (1, 2), (2, 3), (3, 0)]),
    (3, [(0, 1), (0, 1)]),
    (5, [(0, 1), (2, 3), (3, 4), (4, 2)]),
]

print(f"{'edges':<32}{'truth':>7}{'no exemption':>14}{'by node':>9}"
      f"{'by edge':>9}{'by union':>10}")
for n, edges in CASES:
    print(f"{show_edges(edges):<32}{yes_no(has_cycle_by_counting(n, edges)):>7}"
          f"{yes_no(has_cycle_ignoring_nothing(n, edges)):>14}"
          f"{yes_no(has_cycle_ignoring_node(n, edges)):>9}"
          f"{yes_no(has_cycle_ignoring_edge(n, edges)):>9}"
          f"{yes_no(has_cycle_by_union(n, edges)):>10}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
nothing_ok = 0
node_ok = 0
edge_ok = 0
union_ok = 0
had_cycle = 0
nothing_over = 0
for _ in range(TRIALS):
    n = 2 + rand(6)
    edges = []
    for u in range(n):
        for v in range(u + 1, n):
            if rand(4) == 0:
                edges.append((u, v))
    truth = has_cycle_by_counting(n, edges)
    guess = has_cycle_ignoring_nothing(n, edges)
    if guess == truth:
        nothing_ok += 1
    if guess and not truth:
        nothing_over += 1
    if has_cycle_ignoring_node(n, edges) == truth:
        node_ok += 1
    if has_cycle_ignoring_edge(n, edges) == truth:
        edge_ok += 1
    if has_cycle_by_union(n, edges) == truth:
        union_ok += 1
    if truth:
        had_cycle += 1

node_ok_multi = 0
edge_ok_multi = 0
union_ok_multi = 0
parallel_seen = 0
for _ in range(TRIALS):
    n = 2 + rand(5)
    edges = []
    for _ in range(1 + rand(5)):
        u = rand(n)
        v = rand(n)
        if u != v:
            edges.append((u, v))
    doubled = False
    for i in range(len(edges)):
        for j in range(i + 1, len(edges)):
            a = edges[i]
            b = edges[j]
            if (a[0] == b[0] and a[1] == b[1]) or (a[0] == b[1] and a[1] == b[0]):
                doubled = True
    if doubled:
        parallel_seen += 1
    truth = has_cycle_by_counting(n, edges)
    if has_cycle_ignoring_node(n, edges) == truth:
        node_ok_multi += 1
    if has_cycle_ignoring_edge(n, edges) == truth:
        edge_ok_multi += 1
    if has_cycle_by_union(n, edges) == truth:
        union_ok_multi += 1

print(f"over {TRIALS} random simple graphs on up to 7 nodes:")
print(f"  no exemption      {nothing_ok:>6}")
print(f"  by previous node  {node_ok:>6}")
print(f"  by arriving edge  {edge_ok:>6}")
print(f"  by union          {union_ok:>6}")
print(f"  graphs with a cycle {had_cycle:>4}")
print()
print(f"over {TRIALS} random multigraphs, where a pair may be joined twice:")
print(f"  by previous node  {node_ok_multi:>6}")
print(f"  by arriving edge  {edge_ok_multi:>6}")
print(f"  by union          {union_ok_multi:>6}")
print(f"  lists with a repeat {parallel_seen:>4}")
print()
print("The exemption is the whole algorithm. Without it every edge looks like a")
print(f"cycle: it claimed one on {nothing_over} graphs that had none, and was right only")
print("on the ones that genuinely did.")
print()
print("The two exemptions are both correct, on multigraphs as well -- which is")
print("worth measuring rather than assuming, because the node version is often")
print("said to be blind to a pair joined twice. It is not: the second of the two")
print("edges is still sitting in the parent's own neighbour list, so the walk")
print("finds it on the way back out. The edge version is still the one to")
print("write, because it is correct without needing that argument.")
print()
print("And the union version does it with no traversal at all, which is the same")
print("machinery Kruskal uses in the next module: join the ends of each edge in")
print("turn, and the first edge whose ends are already joined is the cycle.")
`,
          output: `edges                             truth  no exemption  by node  by edge  by union
[0-1, 1-2, 2-3]                      no           yes       no       no        no
[0-1, 1-2, 2-3, 3-0]                yes           yes      yes      yes       yes
[0-1, 0-1]                          yes           yes      yes      yes       yes
[0-1, 2-3, 3-4, 4-2]                yes           yes      yes      yes       yes

over 3000 random simple graphs on up to 7 nodes:
  no exemption        1230
  by previous node    3000
  by arriving edge    3000
  by union            3000
  graphs with a cycle  482

over 3000 random multigraphs, where a pair may be joined twice:
  by previous node    3000
  by arriving edge    3000
  by union            3000
  lists with a repeat  856

The exemption is the whole algorithm. Without it every edge looks like a
cycle: it claimed one on 1770 graphs that had none, and was right only
on the ones that genuinely did.

The two exemptions are both correct, on multigraphs as well -- which is
worth measuring rather than assuming, because the node version is often
said to be blind to a pair joined twice. It is not: the second of the two
edges is still sitting in the parent's own neighbour list, so the walk
finds it on the way back out. The edge version is still the one to
write, because it is correct without needing that argument.

And the union version does it with no traversal at all, which is the same
machinery Kruskal uses in the next module: join the ends of each edge in
turn, and the first edge whose ends are already joined is the cycle.`,
          explanation:
            "Four undirected cycle tests scored against an oracle that counts edges instead of walking: no exemption, the two exemptions, and union-find. Run on simple graphs and again on multigraphs, because the folklore about the node exemption is worth checking.",
          alternates: [
            {
              lang: "javascript",
              code: `// Cycle detection on an undirected graph, and the one line that makes it work.
//
// A depth-first walk meets an already-visited node constantly, and that is not
// a cycle by itself: the node you have just come from is always already
// visited. So the walk needs an exemption for the edge it arrived on. Without
// one, every single edge looks like a cycle.
//
// There are two ways to write the exemption -- remember the node you came from,
// or remember the edge you came along -- and a third method that does not walk
// the graph at all. All three are scored against an oracle that needs no search
// either: an undirected graph is acyclic exactly when its edge count equals its
// node count minus its number of components.

/** Each entry is (neighbour, which edge). The edge number matters below. */
function build(n, edges) {
  const neighbours = Array.from({ length: n }, () => []);
  for (let i = 0; i < edges.length; i += 1) {
    const [u, v] = edges[i];
    neighbours[u].push([v, i]);
    neighbours[v].push([u, i]);
  }
  return neighbours;
}

function countComponents(neighbours) {
  const n = neighbours.length;
  const seen = new Array(n).fill(false);
  let count = 0;
  for (let start = 0; start < n; start += 1) {
    if (seen[start]) continue;
    count += 1;
    const stack = [start];
    seen[start] = true;
    while (stack.length > 0) {
      const v = stack.pop();
      for (const [u] of neighbours[v]) {
        if (!seen[u]) {
          seen[u] = true;
          stack.push(u);
        }
      }
    }
  }
  return count;
}

/** The oracle. A forest has exactly n - components edges; more means a cycle. */
function hasCycleByCounting(n, edges) {
  const neighbours = build(n, edges);
  return edges.length > n - countComponents(neighbours);
}

/** No exemption at all. Reports a cycle for every edge there is. */
function hasCycleIgnoringNothing(n, edges) {
  const neighbours = build(n, edges);
  const seen = new Array(n).fill(false);
  let found = false;

  function walk(v) {
    seen[v] = true;
    for (const [u] of neighbours[v]) {
      if (seen[u]) found = true;
      else walk(u);
    }
  }

  for (let start = 0; start < n; start += 1) {
    if (!seen[start]) walk(start);
  }
  return found;
}

/** Skip the node we came from. */
function hasCycleIgnoringNode(n, edges) {
  const neighbours = build(n, edges);
  const seen = new Array(n).fill(false);
  let found = false;

  function walk(v, cameFrom) {
    seen[v] = true;
    for (const [u] of neighbours[v]) {
      if (u === cameFrom) continue;
      if (seen[u]) found = true;
      else walk(u, v);
    }
  }

  for (let start = 0; start < n; start += 1) {
    if (!seen[start]) walk(start, -1);
  }
  return found;
}

/** Skip the edge we arrived along. One integer, and no argument needed. */
function hasCycleIgnoringEdge(n, edges) {
  const neighbours = build(n, edges);
  const seen = new Array(n).fill(false);
  let found = false;

  function walk(v, cameBy) {
    seen[v] = true;
    for (const [u, which] of neighbours[v]) {
      if (which === cameBy) continue;
      if (seen[u]) found = true;
      else walk(u, which);
    }
  }

  for (let start = 0; start < n; start += 1) {
    if (!seen[start]) walk(start, -1);
  }
  return found;
}

/** No walk at all: join the ends of each edge, and a repeat join is a cycle. */
function hasCycleByUnion(n, edges) {
  const parent = [];
  for (let v = 0; v < n; v += 1) parent.push(v);

  function root(v) {
    let at = v;
    while (parent[at] !== at) {
      parent[at] = parent[parent[at]];
      at = parent[at];
    }
    return at;
  }

  for (const [u, v] of edges) {
    const a = root(u);
    const b = root(v);
    if (a === b) return true;
    parent[a] = b;
  }
  return false;
}

const yesNo = (flag) => (flag ? "yes" : "no");
const showEdges = (edges) =>
  "[" + edges.map(([u, v]) => \`\${u}-\${v}\`).join(", ") + "]";
const padEnd = (v, w) => String(v).padEnd(w);
const pad = (v, w) => String(v).padStart(w);

const CASES = [
  [4, [[0, 1], [1, 2], [2, 3]]],
  [4, [[0, 1], [1, 2], [2, 3], [3, 0]]],
  [3, [[0, 1], [0, 1]]],
  [5, [[0, 1], [2, 3], [3, 4], [4, 2]]],
];

console.log(
  padEnd("edges", 32) +
    pad("truth", 7) +
    pad("no exemption", 14) +
    pad("by node", 9) +
    pad("by edge", 9) +
    pad("by union", 10)
);
for (const [n, edges] of CASES) {
  console.log(
    padEnd(showEdges(edges), 32) +
      pad(yesNo(hasCycleByCounting(n, edges)), 7) +
      pad(yesNo(hasCycleIgnoringNothing(n, edges)), 14) +
      pad(yesNo(hasCycleIgnoringNode(n, edges)), 9) +
      pad(yesNo(hasCycleIgnoringEdge(n, edges)), 9) +
      pad(yesNo(hasCycleByUnion(n, edges)), 10)
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
let nothingOk = 0;
let nodeOk = 0;
let edgeOk = 0;
let unionOk = 0;
let hadCycle = 0;
let nothingOver = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) {
      if (rand(4) === 0) edges.push([u, v]);
    }
  }
  const truth = hasCycleByCounting(n, edges);
  const guess = hasCycleIgnoringNothing(n, edges);
  if (guess === truth) nothingOk += 1;
  if (guess && !truth) nothingOver += 1;
  if (hasCycleIgnoringNode(n, edges) === truth) nodeOk += 1;
  if (hasCycleIgnoringEdge(n, edges) === truth) edgeOk += 1;
  if (hasCycleByUnion(n, edges) === truth) unionOk += 1;
  if (truth) hadCycle += 1;
}

let nodeOkMulti = 0;
let edgeOkMulti = 0;
let unionOkMulti = 0;
let parallelSeen = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(5);
  const edges = [];
  const howMany = 1 + rand(5);
  for (let k = 0; k < howMany; k += 1) {
    const u = rand(n);
    const v = rand(n);
    if (u !== v) edges.push([u, v]);
  }
  let doubled = false;
  for (let i = 0; i < edges.length; i += 1) {
    for (let j = i + 1; j < edges.length; j += 1) {
      const a = edges[i];
      const b = edges[j];
      if ((a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0])) doubled = true;
    }
  }
  if (doubled) parallelSeen += 1;
  const truth = hasCycleByCounting(n, edges);
  if (hasCycleIgnoringNode(n, edges) === truth) nodeOkMulti += 1;
  if (hasCycleIgnoringEdge(n, edges) === truth) edgeOkMulti += 1;
  if (hasCycleByUnion(n, edges) === truth) unionOkMulti += 1;
}

console.log(\`over \${TRIALS} random simple graphs on up to 7 nodes:\`);
console.log(\`  no exemption      \${pad(nothingOk, 6)}\`);
console.log(\`  by previous node  \${pad(nodeOk, 6)}\`);
console.log(\`  by arriving edge  \${pad(edgeOk, 6)}\`);
console.log(\`  by union          \${pad(unionOk, 6)}\`);
console.log(\`  graphs with a cycle \${pad(hadCycle, 4)}\`);
console.log();
console.log(\`over \${TRIALS} random multigraphs, where a pair may be joined twice:\`);
console.log(\`  by previous node  \${pad(nodeOkMulti, 6)}\`);
console.log(\`  by arriving edge  \${pad(edgeOkMulti, 6)}\`);
console.log(\`  by union          \${pad(unionOkMulti, 6)}\`);
console.log(\`  lists with a repeat \${pad(parallelSeen, 4)}\`);
console.log();
console.log("The exemption is the whole algorithm. Without it every edge looks like a");
console.log(\`cycle: it claimed one on \${nothingOver} graphs that had none, and was right only\`);
console.log("on the ones that genuinely did.");
console.log();
console.log("The two exemptions are both correct, on multigraphs as well -- which is");
console.log("worth measuring rather than assuming, because the node version is often");
console.log("said to be blind to a pair joined twice. It is not: the second of the two");
console.log("edges is still sitting in the parent's own neighbour list, so the walk");
console.log("finds it on the way back out. The edge version is still the one to");
console.log("write, because it is correct without needing that argument.");
console.log();
console.log("And the union version does it with no traversal at all, which is the same");
console.log("machinery Kruskal uses in the next module: join the ends of each edge in");
console.log("turn, and the first edge whose ends are already joined is the cycle.");
`,
            },
            {
              lang: "typescript",
              code: `// Cycle detection on an undirected graph, and the one line that makes it work.
//
// A depth-first walk meets an already-visited node constantly, and that is not
// a cycle by itself: the node you have just come from is always already
// visited. So the walk needs an exemption for the edge it arrived on. Without
// one, every single edge looks like a cycle.
//
// There are two ways to write the exemption -- remember the node you came from,
// or remember the edge you came along -- and a third method that does not walk
// the graph at all. All three are scored against an oracle that needs no search
// either: an undirected graph is acyclic exactly when its edge count equals its
// node count minus its number of components.

type Edge = [number, number];
type Link = [number, number];

/** Each entry is (neighbour, which edge). The edge number matters below. */
function build(n: number, edges: Edge[]): Link[][] {
  const neighbours: Link[][] = Array.from({ length: n }, () => []);
  for (let i = 0; i < edges.length; i += 1) {
    const [u, v] = edges[i];
    neighbours[u].push([v, i]);
    neighbours[v].push([u, i]);
  }
  return neighbours;
}

function countComponents(neighbours: Link[][]): number {
  const n = neighbours.length;
  const seen = new Array(n).fill(false);
  let count = 0;
  for (let start = 0; start < n; start += 1) {
    if (seen[start]) continue;
    count += 1;
    const stack = [start];
    seen[start] = true;
    while (stack.length > 0) {
      const v = stack.pop() as number;
      for (const [u] of neighbours[v]) {
        if (!seen[u]) {
          seen[u] = true;
          stack.push(u);
        }
      }
    }
  }
  return count;
}

/** The oracle. A forest has exactly n - components edges; more means a cycle. */
function hasCycleByCounting(n: number, edges: Edge[]): boolean {
  const neighbours = build(n, edges);
  return edges.length > n - countComponents(neighbours);
}

/** No exemption at all. Reports a cycle for every edge there is. */
function hasCycleIgnoringNothing(n: number, edges: Edge[]): boolean {
  const neighbours = build(n, edges);
  const seen = new Array(n).fill(false);
  let found = false;

  function walk(v: number): void {
    seen[v] = true;
    for (const [u] of neighbours[v]) {
      if (seen[u]) found = true;
      else walk(u);
    }
  }

  for (let start = 0; start < n; start += 1) {
    if (!seen[start]) walk(start);
  }
  return found;
}

/** Skip the node we came from. */
function hasCycleIgnoringNode(n: number, edges: Edge[]): boolean {
  const neighbours = build(n, edges);
  const seen = new Array(n).fill(false);
  let found = false;

  function walk(v: number, cameFrom: number): void {
    seen[v] = true;
    for (const [u] of neighbours[v]) {
      if (u === cameFrom) continue;
      if (seen[u]) found = true;
      else walk(u, v);
    }
  }

  for (let start = 0; start < n; start += 1) {
    if (!seen[start]) walk(start, -1);
  }
  return found;
}

/** Skip the edge we arrived along. One integer, and no argument needed. */
function hasCycleIgnoringEdge(n: number, edges: Edge[]): boolean {
  const neighbours = build(n, edges);
  const seen = new Array(n).fill(false);
  let found = false;

  function walk(v: number, cameBy: number): void {
    seen[v] = true;
    for (const [u, which] of neighbours[v]) {
      if (which === cameBy) continue;
      if (seen[u]) found = true;
      else walk(u, which);
    }
  }

  for (let start = 0; start < n; start += 1) {
    if (!seen[start]) walk(start, -1);
  }
  return found;
}

/** No walk at all: join the ends of each edge, and a repeat join is a cycle. */
function hasCycleByUnion(n: number, edges: Edge[]): boolean {
  const parent: number[] = [];
  for (let v = 0; v < n; v += 1) parent.push(v);

  function root(v: number): number {
    let at = v;
    while (parent[at] !== at) {
      parent[at] = parent[parent[at]];
      at = parent[at];
    }
    return at;
  }

  for (const [u, v] of edges) {
    const a = root(u);
    const b = root(v);
    if (a === b) return true;
    parent[a] = b;
  }
  return false;
}

const yesNo = (flag: boolean): string => (flag ? "yes" : "no");
const showEdges = (edges: Edge[]): string =>
  "[" + edges.map(([u, v]) => \`\${u}-\${v}\`).join(", ") + "]";
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const pad = (v: string | number, w: number): string => String(v).padStart(w);

const CASES: [number, Edge[]][] = [
  [4, [[0, 1], [1, 2], [2, 3]]],
  [4, [[0, 1], [1, 2], [2, 3], [3, 0]]],
  [3, [[0, 1], [0, 1]]],
  [5, [[0, 1], [2, 3], [3, 4], [4, 2]]],
];

console.log(
  padEnd("edges", 32) +
    pad("truth", 7) +
    pad("no exemption", 14) +
    pad("by node", 9) +
    pad("by edge", 9) +
    pad("by union", 10)
);
for (const [n, edges] of CASES) {
  console.log(
    padEnd(showEdges(edges), 32) +
      pad(yesNo(hasCycleByCounting(n, edges)), 7) +
      pad(yesNo(hasCycleIgnoringNothing(n, edges)), 14) +
      pad(yesNo(hasCycleIgnoringNode(n, edges)), 9) +
      pad(yesNo(hasCycleIgnoringEdge(n, edges)), 9) +
      pad(yesNo(hasCycleByUnion(n, edges)), 10)
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
let nothingOk = 0;
let nodeOk = 0;
let edgeOk = 0;
let unionOk = 0;
let hadCycle = 0;
let nothingOver = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges: Edge[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) {
      if (rand(4) === 0) edges.push([u, v]);
    }
  }
  const truth = hasCycleByCounting(n, edges);
  const guess = hasCycleIgnoringNothing(n, edges);
  if (guess === truth) nothingOk += 1;
  if (guess && !truth) nothingOver += 1;
  if (hasCycleIgnoringNode(n, edges) === truth) nodeOk += 1;
  if (hasCycleIgnoringEdge(n, edges) === truth) edgeOk += 1;
  if (hasCycleByUnion(n, edges) === truth) unionOk += 1;
  if (truth) hadCycle += 1;
}

let nodeOkMulti = 0;
let edgeOkMulti = 0;
let unionOkMulti = 0;
let parallelSeen = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(5);
  const edges: Edge[] = [];
  const howMany = 1 + rand(5);
  for (let k = 0; k < howMany; k += 1) {
    const u = rand(n);
    const v = rand(n);
    if (u !== v) edges.push([u, v]);
  }
  let doubled = false;
  for (let i = 0; i < edges.length; i += 1) {
    for (let j = i + 1; j < edges.length; j += 1) {
      const a = edges[i];
      const b = edges[j];
      if ((a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0])) doubled = true;
    }
  }
  if (doubled) parallelSeen += 1;
  const truth = hasCycleByCounting(n, edges);
  if (hasCycleIgnoringNode(n, edges) === truth) nodeOkMulti += 1;
  if (hasCycleIgnoringEdge(n, edges) === truth) edgeOkMulti += 1;
  if (hasCycleByUnion(n, edges) === truth) unionOkMulti += 1;
}

console.log(\`over \${TRIALS} random simple graphs on up to 7 nodes:\`);
console.log(\`  no exemption      \${pad(nothingOk, 6)}\`);
console.log(\`  by previous node  \${pad(nodeOk, 6)}\`);
console.log(\`  by arriving edge  \${pad(edgeOk, 6)}\`);
console.log(\`  by union          \${pad(unionOk, 6)}\`);
console.log(\`  graphs with a cycle \${pad(hadCycle, 4)}\`);
console.log();
console.log(\`over \${TRIALS} random multigraphs, where a pair may be joined twice:\`);
console.log(\`  by previous node  \${pad(nodeOkMulti, 6)}\`);
console.log(\`  by arriving edge  \${pad(edgeOkMulti, 6)}\`);
console.log(\`  by union          \${pad(unionOkMulti, 6)}\`);
console.log(\`  lists with a repeat \${pad(parallelSeen, 4)}\`);
console.log();
console.log("The exemption is the whole algorithm. Without it every edge looks like a");
console.log(\`cycle: it claimed one on \${nothingOver} graphs that had none, and was right only\`);
console.log("on the ones that genuinely did.");
console.log();
console.log("The two exemptions are both correct, on multigraphs as well -- which is");
console.log("worth measuring rather than assuming, because the node version is often");
console.log("said to be blind to a pair joined twice. It is not: the second of the two");
console.log("edges is still sitting in the parent's own neighbour list, so the walk");
console.log("finds it on the way back out. The edge version is still the one to");
console.log("write, because it is correct without needing that argument.");
console.log();
console.log("And the union version does it with no traversal at all, which is the same");
console.log("machinery Kruskal uses in the next module: join the ends of each edge in");
console.log("turn, and the first edge whose ends are already joined is the cycle.");
`,
            },
            {
              lang: "java",
              code: `// Cycle detection on an undirected graph, and the one line that makes it work.
//
// A depth-first walk meets an already-visited node constantly, and that is not
// a cycle by itself: the node you have just come from is always already
// visited. So the walk needs an exemption for the edge it arrived on. Without
// one, every single edge looks like a cycle.
//
// There are two ways to write the exemption -- remember the node you came from,
// or remember the edge you came along -- and a third method that does not walk
// the graph at all. All three are scored against an oracle that needs no search
// either: an undirected graph is acyclic exactly when its edge count equals its
// node count minus its number of components.

import java.util.ArrayList;
import java.util.List;

public class Main {

    /** Each entry is (neighbour, which edge). The edge number matters below. */
    static List<List<int[]>> build(int n, int[][] edges) {
        List<List<int[]>> neighbours = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            neighbours.add(new ArrayList<>());
        }
        for (int i = 0; i < edges.length; i++) {
            neighbours.get(edges[i][0]).add(new int[] {edges[i][1], i});
            neighbours.get(edges[i][1]).add(new int[] {edges[i][0], i});
        }
        return neighbours;
    }

    static int countComponents(List<List<int[]>> neighbours) {
        int n = neighbours.size();
        boolean[] seen = new boolean[n];
        int count = 0;
        for (int start = 0; start < n; start++) {
            if (seen[start]) {
                continue;
            }
            count++;
            List<Integer> stack = new ArrayList<>();
            stack.add(start);
            seen[start] = true;
            while (!stack.isEmpty()) {
                int v = stack.remove(stack.size() - 1);
                for (int[] link : neighbours.get(v)) {
                    if (!seen[link[0]]) {
                        seen[link[0]] = true;
                        stack.add(link[0]);
                    }
                }
            }
        }
        return count;
    }

    /** The oracle. A forest has exactly n - components edges; more means a cycle. */
    static boolean hasCycleByCounting(int n, int[][] edges) {
        List<List<int[]>> neighbours = build(n, edges);
        return edges.length > n - countComponents(neighbours);
    }

    static boolean found;
    static boolean[] seenFlags;

    static void walkNothing(List<List<int[]>> neighbours, int v) {
        seenFlags[v] = true;
        for (int[] link : neighbours.get(v)) {
            if (seenFlags[link[0]]) {
                found = true;
            } else {
                walkNothing(neighbours, link[0]);
            }
        }
    }

    /** No exemption at all. Reports a cycle for every edge there is. */
    static boolean hasCycleIgnoringNothing(int n, int[][] edges) {
        List<List<int[]>> neighbours = build(n, edges);
        seenFlags = new boolean[n];
        found = false;
        for (int start = 0; start < n; start++) {
            if (!seenFlags[start]) {
                walkNothing(neighbours, start);
            }
        }
        return found;
    }

    static void walkNode(List<List<int[]>> neighbours, int v, int cameFrom) {
        seenFlags[v] = true;
        for (int[] link : neighbours.get(v)) {
            if (link[0] == cameFrom) {
                continue;
            }
            if (seenFlags[link[0]]) {
                found = true;
            } else {
                walkNode(neighbours, link[0], v);
            }
        }
    }

    /** Skip the node we came from. */
    static boolean hasCycleIgnoringNode(int n, int[][] edges) {
        List<List<int[]>> neighbours = build(n, edges);
        seenFlags = new boolean[n];
        found = false;
        for (int start = 0; start < n; start++) {
            if (!seenFlags[start]) {
                walkNode(neighbours, start, -1);
            }
        }
        return found;
    }

    static void walkEdge(List<List<int[]>> neighbours, int v, int cameBy) {
        seenFlags[v] = true;
        for (int[] link : neighbours.get(v)) {
            if (link[1] == cameBy) {
                continue;
            }
            if (seenFlags[link[0]]) {
                found = true;
            } else {
                walkEdge(neighbours, link[0], link[1]);
            }
        }
    }

    /** Skip the edge we arrived along. One integer, and no argument needed. */
    static boolean hasCycleIgnoringEdge(int n, int[][] edges) {
        List<List<int[]>> neighbours = build(n, edges);
        seenFlags = new boolean[n];
        found = false;
        for (int start = 0; start < n; start++) {
            if (!seenFlags[start]) {
                walkEdge(neighbours, start, -1);
            }
        }
        return found;
    }

    static int[] unionParent;

    static int root(int v) {
        int at = v;
        while (unionParent[at] != at) {
            unionParent[at] = unionParent[unionParent[at]];
            at = unionParent[at];
        }
        return at;
    }

    /** No walk at all: join the ends of each edge, and a repeat join is a cycle. */
    static boolean hasCycleByUnion(int n, int[][] edges) {
        unionParent = new int[n];
        for (int v = 0; v < n; v++) {
            unionParent[v] = v;
        }
        for (int[] e : edges) {
            int a = root(e[0]);
            int b = root(e[1]);
            if (a == b) {
                return true;
            }
            unionParent[a] = b;
        }
        return false;
    }

    static String yesNo(boolean flag) {
        return flag ? "yes" : "no";
    }

    static String showEdges(int[][] edges) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < edges.length; i++) {
            if (i > 0) {
                sb.append(", ");
            }
            sb.append(edges[i][0]).append("-").append(edges[i][1]);
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
        int[] sizes = {4, 4, 3, 5};
        int[][][] cases = {
            {{0, 1}, {1, 2}, {2, 3}},
            {{0, 1}, {1, 2}, {2, 3}, {3, 0}},
            {{0, 1}, {0, 1}},
            {{0, 1}, {2, 3}, {3, 4}, {4, 2}},
        };

        System.out.println(padEnd("edges", 32) + pad("truth", 7) + pad("no exemption", 14)
                + pad("by node", 9) + pad("by edge", 9) + pad("by union", 10));
        for (int c = 0; c < sizes.length; c++) {
            int n = sizes[c];
            System.out.println(padEnd(showEdges(cases[c]), 32)
                    + pad(yesNo(hasCycleByCounting(n, cases[c])), 7)
                    + pad(yesNo(hasCycleIgnoringNothing(n, cases[c])), 14)
                    + pad(yesNo(hasCycleIgnoringNode(n, cases[c])), 9)
                    + pad(yesNo(hasCycleIgnoringEdge(n, cases[c])), 9)
                    + pad(yesNo(hasCycleByUnion(n, cases[c])), 10));
        }
        System.out.println();

        int trials = 3000;
        int nothingOk = 0;
        int nodeOk = 0;
        int edgeOk = 0;
        int unionOk = 0;
        int hadCycle = 0;
        int nothingOver = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(6);
            List<int[]> collected = new ArrayList<>();
            for (int u = 0; u < n; u++) {
                for (int v = u + 1; v < n; v++) {
                    if (rand(4) == 0) {
                        collected.add(new int[] {u, v});
                    }
                }
            }
            int[][] edges = collected.toArray(new int[0][]);
            boolean truth = hasCycleByCounting(n, edges);
            boolean guess = hasCycleIgnoringNothing(n, edges);
            if (guess == truth) {
                nothingOk++;
            }
            if (guess && !truth) {
                nothingOver++;
            }
            if (hasCycleIgnoringNode(n, edges) == truth) {
                nodeOk++;
            }
            if (hasCycleIgnoringEdge(n, edges) == truth) {
                edgeOk++;
            }
            if (hasCycleByUnion(n, edges) == truth) {
                unionOk++;
            }
            if (truth) {
                hadCycle++;
            }
        }

        int nodeOkMulti = 0;
        int edgeOkMulti = 0;
        int unionOkMulti = 0;
        int parallelSeen = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(5);
            List<int[]> collected = new ArrayList<>();
            int howMany = 1 + rand(5);
            for (int k = 0; k < howMany; k++) {
                int u = rand(n);
                int v = rand(n);
                if (u != v) {
                    collected.add(new int[] {u, v});
                }
            }
            int[][] edges = collected.toArray(new int[0][]);
            boolean doubled = false;
            for (int i = 0; i < edges.length; i++) {
                for (int j = i + 1; j < edges.length; j++) {
                    if ((edges[i][0] == edges[j][0] && edges[i][1] == edges[j][1])
                            || (edges[i][0] == edges[j][1] && edges[i][1] == edges[j][0])) {
                        doubled = true;
                    }
                }
            }
            if (doubled) {
                parallelSeen++;
            }
            boolean truth = hasCycleByCounting(n, edges);
            if (hasCycleIgnoringNode(n, edges) == truth) {
                nodeOkMulti++;
            }
            if (hasCycleIgnoringEdge(n, edges) == truth) {
                edgeOkMulti++;
            }
            if (hasCycleByUnion(n, edges) == truth) {
                unionOkMulti++;
            }
        }

        System.out.println("over " + trials + " random simple graphs on up to 7 nodes:");
        System.out.println("  no exemption      " + pad(String.valueOf(nothingOk), 6));
        System.out.println("  by previous node  " + pad(String.valueOf(nodeOk), 6));
        System.out.println("  by arriving edge  " + pad(String.valueOf(edgeOk), 6));
        System.out.println("  by union          " + pad(String.valueOf(unionOk), 6));
        System.out.println("  graphs with a cycle " + pad(String.valueOf(hadCycle), 4));
        System.out.println();
        System.out.println("over " + trials + " random multigraphs, where a pair may be joined twice:");
        System.out.println("  by previous node  " + pad(String.valueOf(nodeOkMulti), 6));
        System.out.println("  by arriving edge  " + pad(String.valueOf(edgeOkMulti), 6));
        System.out.println("  by union          " + pad(String.valueOf(unionOkMulti), 6));
        System.out.println("  lists with a repeat " + pad(String.valueOf(parallelSeen), 4));
        System.out.println();
        System.out.println("The exemption is the whole algorithm. Without it every edge looks like a");
        System.out.println("cycle: it claimed one on " + nothingOver + " graphs that had none, and was right only");
        System.out.println("on the ones that genuinely did.");
        System.out.println();
        System.out.println("The two exemptions are both correct, on multigraphs as well -- which is");
        System.out.println("worth measuring rather than assuming, because the node version is often");
        System.out.println("said to be blind to a pair joined twice. It is not: the second of the two");
        System.out.println("edges is still sitting in the parent's own neighbour list, so the walk");
        System.out.println("finds it on the way back out. The edge version is still the one to");
        System.out.println("write, because it is correct without needing that argument.");
        System.out.println();
        System.out.println("And the union version does it with no traversal at all, which is the same");
        System.out.println("machinery Kruskal uses in the next module: join the ends of each edge in");
        System.out.println("turn, and the first edge whose ends are already joined is the cycle.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Cycle detection on an undirected graph, and the one line that makes it work.
//
// A depth-first walk meets an already-visited node constantly, and that is not
// a cycle by itself: the node you have just come from is always already
// visited. So the walk needs an exemption for the edge it arrived on. Without
// one, every single edge looks like a cycle.
//
// There are two ways to write the exemption -- remember the node you came from,
// or remember the edge you came along -- and a third method that does not walk
// the graph at all. All three are scored against an oracle that needs no search
// either: an undirected graph is acyclic exactly when its edge count equals its
// node count minus its number of components.

#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

using Edge = std::pair<int, int>;
using Link = std::pair<int, int>;

// Each entry is (neighbour, which edge). The edge number matters below.
std::vector<std::vector<Link>> build(int n, const std::vector<Edge>& edges) {
    std::vector<std::vector<Link>> neighbours(n);
    for (size_t i = 0; i < edges.size(); i++) {
        neighbours[edges[i].first].push_back(Link(edges[i].second, static_cast<int>(i)));
        neighbours[edges[i].second].push_back(Link(edges[i].first, static_cast<int>(i)));
    }
    return neighbours;
}

int count_components(const std::vector<std::vector<Link>>& neighbours) {
    int n = static_cast<int>(neighbours.size());
    std::vector<char> seen(n, 0);
    int count = 0;
    for (int start = 0; start < n; start++) {
        if (seen[start]) {
            continue;
        }
        count++;
        std::vector<int> stack;
        stack.push_back(start);
        seen[start] = 1;
        while (!stack.empty()) {
            int v = stack.back();
            stack.pop_back();
            for (const Link& l : neighbours[v]) {
                if (!seen[l.first]) {
                    seen[l.first] = 1;
                    stack.push_back(l.first);
                }
            }
        }
    }
    return count;
}

// The oracle. A forest has exactly n - components edges; more means a cycle.
bool has_cycle_by_counting(int n, const std::vector<Edge>& edges) {
    std::vector<std::vector<Link>> neighbours = build(n, edges);
    return static_cast<int>(edges.size()) > n - count_components(neighbours);
}

void walk_nothing(const std::vector<std::vector<Link>>& neighbours, std::vector<char>& seen,
                  bool& found, int v) {
    seen[v] = 1;
    for (const Link& l : neighbours[v]) {
        if (seen[l.first]) {
            found = true;
        } else {
            walk_nothing(neighbours, seen, found, l.first);
        }
    }
}

// No exemption at all. Reports a cycle for every edge there is.
bool has_cycle_ignoring_nothing(int n, const std::vector<Edge>& edges) {
    std::vector<std::vector<Link>> neighbours = build(n, edges);
    std::vector<char> seen(n, 0);
    bool found = false;
    for (int start = 0; start < n; start++) {
        if (!seen[start]) {
            walk_nothing(neighbours, seen, found, start);
        }
    }
    return found;
}

void walk_node(const std::vector<std::vector<Link>>& neighbours, std::vector<char>& seen,
               bool& found, int v, int came_from) {
    seen[v] = 1;
    for (const Link& l : neighbours[v]) {
        if (l.first == came_from) {
            continue;
        }
        if (seen[l.first]) {
            found = true;
        } else {
            walk_node(neighbours, seen, found, l.first, v);
        }
    }
}

// Skip the node we came from.
bool has_cycle_ignoring_node(int n, const std::vector<Edge>& edges) {
    std::vector<std::vector<Link>> neighbours = build(n, edges);
    std::vector<char> seen(n, 0);
    bool found = false;
    for (int start = 0; start < n; start++) {
        if (!seen[start]) {
            walk_node(neighbours, seen, found, start, -1);
        }
    }
    return found;
}

void walk_edge(const std::vector<std::vector<Link>>& neighbours, std::vector<char>& seen,
               bool& found, int v, int came_by) {
    seen[v] = 1;
    for (const Link& l : neighbours[v]) {
        if (l.second == came_by) {
            continue;
        }
        if (seen[l.first]) {
            found = true;
        } else {
            walk_edge(neighbours, seen, found, l.first, l.second);
        }
    }
}

// Skip the edge we arrived along. One integer, and no argument needed.
bool has_cycle_ignoring_edge(int n, const std::vector<Edge>& edges) {
    std::vector<std::vector<Link>> neighbours = build(n, edges);
    std::vector<char> seen(n, 0);
    bool found = false;
    for (int start = 0; start < n; start++) {
        if (!seen[start]) {
            walk_edge(neighbours, seen, found, start, -1);
        }
    }
    return found;
}

int root(std::vector<int>& parent, int v) {
    int at = v;
    while (parent[at] != at) {
        parent[at] = parent[parent[at]];
        at = parent[at];
    }
    return at;
}

// No walk at all: join the ends of each edge, and a repeat join is a cycle.
bool has_cycle_by_union(int n, const std::vector<Edge>& edges) {
    std::vector<int> parent(n);
    for (int v = 0; v < n; v++) {
        parent[v] = v;
    }
    for (const Edge& e : edges) {
        int a = root(parent, e.first);
        int b = root(parent, e.second);
        if (a == b) {
            return true;
        }
        parent[a] = b;
    }
    return false;
}

std::string yes_no(bool flag) {
    return flag ? "yes" : "no";
}

std::string show_edges(const std::vector<Edge>& edges) {
    std::string out = "[";
    for (size_t i = 0; i < edges.size(); i++) {
        if (i > 0) {
            out += ", ";
        }
        out += std::to_string(edges[i].first) + "-" + std::to_string(edges[i].second);
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
    std::vector<int> sizes = {4, 4, 3, 5};
    std::vector<std::vector<Edge>> cases = {
        {{0, 1}, {1, 2}, {2, 3}},
        {{0, 1}, {1, 2}, {2, 3}, {3, 0}},
        {{0, 1}, {0, 1}},
        {{0, 1}, {2, 3}, {3, 4}, {4, 2}},
    };

    std::cout << std::left << std::setw(32) << "edges" << std::right << std::setw(7) << "truth"
              << std::setw(14) << "no exemption" << std::setw(9) << "by node"
              << std::setw(9) << "by edge" << std::setw(10) << "by union" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        int n = sizes[c];
        std::cout << std::left << std::setw(32) << show_edges(cases[c]) << std::right
                  << std::setw(7) << yes_no(has_cycle_by_counting(n, cases[c]))
                  << std::setw(14) << yes_no(has_cycle_ignoring_nothing(n, cases[c]))
                  << std::setw(9) << yes_no(has_cycle_ignoring_node(n, cases[c]))
                  << std::setw(9) << yes_no(has_cycle_ignoring_edge(n, cases[c]))
                  << std::setw(10) << yes_no(has_cycle_by_union(n, cases[c])) << "\\n";
    }
    std::cout << "\\n";

    int trials = 3000;
    int nothing_ok = 0;
    int node_ok = 0;
    int edge_ok = 0;
    int union_ok = 0;
    int had_cycle = 0;
    int nothing_over = 0;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(6);
        std::vector<Edge> edges;
        for (int u = 0; u < n; u++) {
            for (int v = u + 1; v < n; v++) {
                if (rand_below(4) == 0) {
                    edges.push_back(Edge(u, v));
                }
            }
        }
        bool truth = has_cycle_by_counting(n, edges);
        bool guess = has_cycle_ignoring_nothing(n, edges);
        if (guess == truth) {
            nothing_ok++;
        }
        if (guess && !truth) {
            nothing_over++;
        }
        if (has_cycle_ignoring_node(n, edges) == truth) {
            node_ok++;
        }
        if (has_cycle_ignoring_edge(n, edges) == truth) {
            edge_ok++;
        }
        if (has_cycle_by_union(n, edges) == truth) {
            union_ok++;
        }
        if (truth) {
            had_cycle++;
        }
    }

    int node_ok_multi = 0;
    int edge_ok_multi = 0;
    int union_ok_multi = 0;
    int parallel_seen = 0;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(5);
        std::vector<Edge> edges;
        int how_many = 1 + rand_below(5);
        for (int k = 0; k < how_many; k++) {
            int u = rand_below(n);
            int v = rand_below(n);
            if (u != v) {
                edges.push_back(Edge(u, v));
            }
        }
        bool doubled = false;
        for (size_t i = 0; i < edges.size(); i++) {
            for (size_t j = i + 1; j < edges.size(); j++) {
                if ((edges[i].first == edges[j].first && edges[i].second == edges[j].second)
                        || (edges[i].first == edges[j].second && edges[i].second == edges[j].first)) {
                    doubled = true;
                }
            }
        }
        if (doubled) {
            parallel_seen++;
        }
        bool truth = has_cycle_by_counting(n, edges);
        if (has_cycle_ignoring_node(n, edges) == truth) {
            node_ok_multi++;
        }
        if (has_cycle_ignoring_edge(n, edges) == truth) {
            edge_ok_multi++;
        }
        if (has_cycle_by_union(n, edges) == truth) {
            union_ok_multi++;
        }
    }

    std::cout << "over " << trials << " random simple graphs on up to 7 nodes:\\n";
    std::cout << "  no exemption      " << std::setw(6) << nothing_ok << "\\n";
    std::cout << "  by previous node  " << std::setw(6) << node_ok << "\\n";
    std::cout << "  by arriving edge  " << std::setw(6) << edge_ok << "\\n";
    std::cout << "  by union          " << std::setw(6) << union_ok << "\\n";
    std::cout << "  graphs with a cycle " << std::setw(4) << had_cycle << "\\n";
    std::cout << "\\n";
    std::cout << "over " << trials << " random multigraphs, where a pair may be joined twice:\\n";
    std::cout << "  by previous node  " << std::setw(6) << node_ok_multi << "\\n";
    std::cout << "  by arriving edge  " << std::setw(6) << edge_ok_multi << "\\n";
    std::cout << "  by union          " << std::setw(6) << union_ok_multi << "\\n";
    std::cout << "  lists with a repeat " << std::setw(4) << parallel_seen << "\\n";
    std::cout << "\\n";
    std::cout << "The exemption is the whole algorithm. Without it every edge looks like a\\n";
    std::cout << "cycle: it claimed one on " << nothing_over << " graphs that had none, and was right only\\n";
    std::cout << "on the ones that genuinely did.\\n";
    std::cout << "\\n";
    std::cout << "The two exemptions are both correct, on multigraphs as well -- which is\\n";
    std::cout << "worth measuring rather than assuming, because the node version is often\\n";
    std::cout << "said to be blind to a pair joined twice. It is not: the second of the two\\n";
    std::cout << "edges is still sitting in the parent's own neighbour list, so the walk\\n";
    std::cout << "finds it on the way back out. The edge version is still the one to\\n";
    std::cout << "write, because it is correct without needing that argument.\\n";
    std::cout << "\\n";
    std::cout << "And the union version does it with no traversal at all, which is the same\\n";
    std::cout << "machinery Kruskal uses in the next module: join the ends of each edge in\\n";
    std::cout << "turn, and the first edge whose ends are already joined is the cycle.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Cycle detection on an undirected graph, and the one line that makes it work.
//
// A depth-first walk meets an already-visited node constantly, and that is not
// a cycle by itself: the node you have just come from is always already
// visited. So the walk needs an exemption for the edge it arrived on. Without
// one, every single edge looks like a cycle.
//
// There are two ways to write the exemption -- remember the node you came from,
// or remember the edge you came along -- and a third method that does not walk
// the graph at all. All three are scored against an oracle that needs no search
// either: an undirected graph is acyclic exactly when its edge count equals its
// node count minus its number of components.

/// Each entry is (neighbour, which edge). The edge number matters below.
fn build(n: usize, edges: &[(usize, usize)]) -> Vec<Vec<(usize, i32)>> {
    let mut neighbours = vec![Vec::new(); n];
    for (i, &(u, v)) in edges.iter().enumerate() {
        neighbours[u].push((v, i as i32));
        neighbours[v].push((u, i as i32));
    }
    neighbours
}

fn count_components(neighbours: &[Vec<(usize, i32)>]) -> usize {
    let n = neighbours.len();
    let mut seen = vec![false; n];
    let mut count = 0;
    for start in 0..n {
        if seen[start] {
            continue;
        }
        count += 1;
        let mut stack = vec![start];
        seen[start] = true;
        while let Some(v) = stack.pop() {
            for i in 0..neighbours[v].len() {
                let u = neighbours[v][i].0;
                if !seen[u] {
                    seen[u] = true;
                    stack.push(u);
                }
            }
        }
    }
    count
}

/// The oracle. A forest has exactly n - components edges; more means a cycle.
fn has_cycle_by_counting(n: usize, edges: &[(usize, usize)]) -> bool {
    let neighbours = build(n, edges);
    edges.len() > n - count_components(&neighbours)
}

fn walk_nothing(neighbours: &[Vec<(usize, i32)>], seen: &mut Vec<bool>, found: &mut bool, v: usize) {
    seen[v] = true;
    for i in 0..neighbours[v].len() {
        let u = neighbours[v][i].0;
        if seen[u] {
            *found = true;
        } else {
            walk_nothing(neighbours, seen, found, u);
        }
    }
}

/// No exemption at all. Reports a cycle for every edge there is.
fn has_cycle_ignoring_nothing(n: usize, edges: &[(usize, usize)]) -> bool {
    let neighbours = build(n, edges);
    let mut seen = vec![false; n];
    let mut found = false;
    for start in 0..n {
        if !seen[start] {
            walk_nothing(&neighbours, &mut seen, &mut found, start);
        }
    }
    found
}

fn walk_node(
    neighbours: &[Vec<(usize, i32)>],
    seen: &mut Vec<bool>,
    found: &mut bool,
    v: usize,
    came_from: i32,
) {
    seen[v] = true;
    for i in 0..neighbours[v].len() {
        let u = neighbours[v][i].0;
        if u as i32 == came_from {
            continue;
        }
        if seen[u] {
            *found = true;
        } else {
            walk_node(neighbours, seen, found, u, v as i32);
        }
    }
}

/// Skip the node we came from.
fn has_cycle_ignoring_node(n: usize, edges: &[(usize, usize)]) -> bool {
    let neighbours = build(n, edges);
    let mut seen = vec![false; n];
    let mut found = false;
    for start in 0..n {
        if !seen[start] {
            walk_node(&neighbours, &mut seen, &mut found, start, -1);
        }
    }
    found
}

fn walk_edge(
    neighbours: &[Vec<(usize, i32)>],
    seen: &mut Vec<bool>,
    found: &mut bool,
    v: usize,
    came_by: i32,
) {
    seen[v] = true;
    for i in 0..neighbours[v].len() {
        let (u, which) = neighbours[v][i];
        if which == came_by {
            continue;
        }
        if seen[u] {
            *found = true;
        } else {
            walk_edge(neighbours, seen, found, u, which);
        }
    }
}

/// Skip the edge we arrived along. One integer, and no argument needed.
fn has_cycle_ignoring_edge(n: usize, edges: &[(usize, usize)]) -> bool {
    let neighbours = build(n, edges);
    let mut seen = vec![false; n];
    let mut found = false;
    for start in 0..n {
        if !seen[start] {
            walk_edge(&neighbours, &mut seen, &mut found, start, -1);
        }
    }
    found
}

fn root(parent: &mut Vec<usize>, v: usize) -> usize {
    let mut at = v;
    while parent[at] != at {
        parent[at] = parent[parent[at]];
        at = parent[at];
    }
    at
}

/// No walk at all: join the ends of each edge, and a repeat join is a cycle.
fn has_cycle_by_union(n: usize, edges: &[(usize, usize)]) -> bool {
    let mut parent: Vec<usize> = (0..n).collect();
    for &(u, v) in edges {
        let a = root(&mut parent, u);
        let b = root(&mut parent, v);
        if a == b {
            return true;
        }
        parent[a] = b;
    }
    false
}

fn yes_no(flag: bool) -> &'static str {
    if flag { "yes" } else { "no" }
}

fn show_edges(edges: &[(usize, usize)]) -> String {
    let parts: Vec<String> = edges.iter().map(|&(u, v)| format!("{}-{}", u, v)).collect();
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
    let sizes: Vec<usize> = vec![4, 4, 3, 5];
    let cases: Vec<Vec<(usize, usize)>> = vec![
        vec![(0, 1), (1, 2), (2, 3)],
        vec![(0, 1), (1, 2), (2, 3), (3, 0)],
        vec![(0, 1), (0, 1)],
        vec![(0, 1), (2, 3), (3, 4), (4, 2)],
    ];

    println!(
        "{}{}{}{}{}{}",
        pad_right("edges", 32),
        pad_left("truth", 7),
        pad_left("no exemption", 14),
        pad_left("by node", 9),
        pad_left("by edge", 9),
        pad_left("by union", 10)
    );
    for (c, edges) in cases.iter().enumerate() {
        let n = sizes[c];
        println!(
            "{}{}{}{}{}{}",
            pad_right(&show_edges(edges), 32),
            pad_left(yes_no(has_cycle_by_counting(n, edges)), 7),
            pad_left(yes_no(has_cycle_ignoring_nothing(n, edges)), 14),
            pad_left(yes_no(has_cycle_ignoring_node(n, edges)), 9),
            pad_left(yes_no(has_cycle_ignoring_edge(n, edges)), 9),
            pad_left(yes_no(has_cycle_by_union(n, edges)), 10)
        );
    }
    println!();

    let mut rng = Rng { seed: 1 };
    let trials = 3000;
    let mut nothing_ok = 0;
    let mut node_ok = 0;
    let mut edge_ok = 0;
    let mut union_ok = 0;
    let mut had_cycle = 0;
    let mut nothing_over = 0;
    for _ in 0..trials {
        let n = (2 + rng.next(6)) as usize;
        let mut edges: Vec<(usize, usize)> = Vec::new();
        for u in 0..n {
            for v in (u + 1)..n {
                if rng.next(4) == 0 {
                    edges.push((u, v));
                }
            }
        }
        let truth = has_cycle_by_counting(n, &edges);
        let guess = has_cycle_ignoring_nothing(n, &edges);
        if guess == truth {
            nothing_ok += 1;
        }
        if guess && !truth {
            nothing_over += 1;
        }
        if has_cycle_ignoring_node(n, &edges) == truth {
            node_ok += 1;
        }
        if has_cycle_ignoring_edge(n, &edges) == truth {
            edge_ok += 1;
        }
        if has_cycle_by_union(n, &edges) == truth {
            union_ok += 1;
        }
        if truth {
            had_cycle += 1;
        }
    }

    let mut node_ok_multi = 0;
    let mut edge_ok_multi = 0;
    let mut union_ok_multi = 0;
    let mut parallel_seen = 0;
    for _ in 0..trials {
        let n = (2 + rng.next(5)) as usize;
        let mut edges: Vec<(usize, usize)> = Vec::new();
        let how_many = 1 + rng.next(5);
        for _ in 0..how_many {
            let u = rng.next(n as i64) as usize;
            let v = rng.next(n as i64) as usize;
            if u != v {
                edges.push((u, v));
            }
        }
        let mut doubled = false;
        for i in 0..edges.len() {
            for j in (i + 1)..edges.len() {
                let a = edges[i];
                let b = edges[j];
                if (a.0 == b.0 && a.1 == b.1) || (a.0 == b.1 && a.1 == b.0) {
                    doubled = true;
                }
            }
        }
        if doubled {
            parallel_seen += 1;
        }
        let truth = has_cycle_by_counting(n, &edges);
        if has_cycle_ignoring_node(n, &edges) == truth {
            node_ok_multi += 1;
        }
        if has_cycle_ignoring_edge(n, &edges) == truth {
            edge_ok_multi += 1;
        }
        if has_cycle_by_union(n, &edges) == truth {
            union_ok_multi += 1;
        }
    }

    println!("over {} random simple graphs on up to 7 nodes:", trials);
    println!("  no exemption      {}", pad_left(&nothing_ok.to_string(), 6));
    println!("  by previous node  {}", pad_left(&node_ok.to_string(), 6));
    println!("  by arriving edge  {}", pad_left(&edge_ok.to_string(), 6));
    println!("  by union          {}", pad_left(&union_ok.to_string(), 6));
    println!("  graphs with a cycle {}", pad_left(&had_cycle.to_string(), 4));
    println!();
    println!("over {} random multigraphs, where a pair may be joined twice:", trials);
    println!("  by previous node  {}", pad_left(&node_ok_multi.to_string(), 6));
    println!("  by arriving edge  {}", pad_left(&edge_ok_multi.to_string(), 6));
    println!("  by union          {}", pad_left(&union_ok_multi.to_string(), 6));
    println!("  lists with a repeat {}", pad_left(&parallel_seen.to_string(), 4));
    println!();
    println!("The exemption is the whole algorithm. Without it every edge looks like a");
    println!(
        "cycle: it claimed one on {} graphs that had none, and was right only",
        nothing_over
    );
    println!("on the ones that genuinely did.");
    println!();
    println!("The two exemptions are both correct, on multigraphs as well -- which is");
    println!("worth measuring rather than assuming, because the node version is often");
    println!("said to be blind to a pair joined twice. It is not: the second of the two");
    println!("edges is still sitting in the parent's own neighbour list, so the walk");
    println!("finds it on the way back out. The edge version is still the one to");
    println!("write, because it is correct without needing that argument.");
    println!();
    println!("And the union version does it with no traversal at all, which is the same");
    println!("machinery Kruskal uses in the next module: join the ends of each edge in");
    println!("turn, and the first edge whose ends are already joined is the cycle.");
}
`,
            },
            {
              lang: "go",
              code: `// Cycle detection on an undirected graph, and the one line that makes it work.
//
// A depth-first walk meets an already-visited node constantly, and that is not
// a cycle by itself: the node you have just come from is always already
// visited. So the walk needs an exemption for the edge it arrived on. Without
// one, every single edge looks like a cycle.
//
// There are two ways to write the exemption -- remember the node you came from,
// or remember the edge you came along -- and a third method that does not walk
// the graph at all. All three are scored against an oracle that needs no search
// either: an undirected graph is acyclic exactly when its edge count equals its
// node count minus its number of components.

package main

import (
	"fmt"
	"strings"
)

type edge struct{ from, to int }
type link struct{ to, which int }

// Each entry is (neighbour, which edge). The edge number matters below.
func build(n int, edges []edge) [][]link {
	neighbours := make([][]link, n)
	for i := range neighbours {
		neighbours[i] = []link{}
	}
	for i, e := range edges {
		neighbours[e.from] = append(neighbours[e.from], link{e.to, i})
		neighbours[e.to] = append(neighbours[e.to], link{e.from, i})
	}
	return neighbours
}

func countComponents(neighbours [][]link) int {
	n := len(neighbours)
	seen := make([]bool, n)
	count := 0
	for start := 0; start < n; start++ {
		if seen[start] {
			continue
		}
		count++
		stack := []int{start}
		seen[start] = true
		for len(stack) > 0 {
			v := stack[len(stack)-1]
			stack = stack[:len(stack)-1]
			for _, l := range neighbours[v] {
				if !seen[l.to] {
					seen[l.to] = true
					stack = append(stack, l.to)
				}
			}
		}
	}
	return count
}

// The oracle. A forest has exactly n - components edges; more means a cycle.
func hasCycleByCounting(n int, edges []edge) bool {
	neighbours := build(n, edges)
	return len(edges) > n-countComponents(neighbours)
}

// No exemption at all. Reports a cycle for every edge there is.
func hasCycleIgnoringNothing(n int, edges []edge) bool {
	neighbours := build(n, edges)
	seen := make([]bool, n)
	found := false
	var walk func(v int)
	walk = func(v int) {
		seen[v] = true
		for _, l := range neighbours[v] {
			if seen[l.to] {
				found = true
			} else {
				walk(l.to)
			}
		}
	}
	for start := 0; start < n; start++ {
		if !seen[start] {
			walk(start)
		}
	}
	return found
}

// Skip the node we came from.
func hasCycleIgnoringNode(n int, edges []edge) bool {
	neighbours := build(n, edges)
	seen := make([]bool, n)
	found := false
	var walk func(v, cameFrom int)
	walk = func(v, cameFrom int) {
		seen[v] = true
		for _, l := range neighbours[v] {
			if l.to == cameFrom {
				continue
			}
			if seen[l.to] {
				found = true
			} else {
				walk(l.to, v)
			}
		}
	}
	for start := 0; start < n; start++ {
		if !seen[start] {
			walk(start, -1)
		}
	}
	return found
}

// Skip the edge we arrived along. One integer, and no argument needed.
func hasCycleIgnoringEdge(n int, edges []edge) bool {
	neighbours := build(n, edges)
	seen := make([]bool, n)
	found := false
	var walk func(v, cameBy int)
	walk = func(v, cameBy int) {
		seen[v] = true
		for _, l := range neighbours[v] {
			if l.which == cameBy {
				continue
			}
			if seen[l.to] {
				found = true
			} else {
				walk(l.to, l.which)
			}
		}
	}
	for start := 0; start < n; start++ {
		if !seen[start] {
			walk(start, -1)
		}
	}
	return found
}

// No walk at all: join the ends of each edge, and a repeat join is a cycle.
func hasCycleByUnion(n int, edges []edge) bool {
	parent := make([]int, n)
	for v := range parent {
		parent[v] = v
	}
	root := func(v int) int {
		at := v
		for parent[at] != at {
			parent[at] = parent[parent[at]]
			at = parent[at]
		}
		return at
	}
	for _, e := range edges {
		a := root(e.from)
		b := root(e.to)
		if a == b {
			return true
		}
		parent[a] = b
	}
	return false
}

func yesNo(flag bool) string {
	if flag {
		return "yes"
	}
	return "no"
}

func showEdges(edges []edge) string {
	parts := make([]string, len(edges))
	for i, e := range edges {
		parts[i] = fmt.Sprintf("%d-%d", e.from, e.to)
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
	sizes := []int{4, 4, 3, 5}
	cases := [][]edge{
		{{0, 1}, {1, 2}, {2, 3}},
		{{0, 1}, {1, 2}, {2, 3}, {3, 0}},
		{{0, 1}, {0, 1}},
		{{0, 1}, {2, 3}, {3, 4}, {4, 2}},
	}

	fmt.Printf("%-32s%7s%14s%9s%9s%10s\\n", "edges", "truth", "no exemption",
		"by node", "by edge", "by union")
	for c, edges := range cases {
		n := sizes[c]
		fmt.Printf("%-32s%7s%14s%9s%9s%10s\\n", showEdges(edges),
			yesNo(hasCycleByCounting(n, edges)),
			yesNo(hasCycleIgnoringNothing(n, edges)),
			yesNo(hasCycleIgnoringNode(n, edges)),
			yesNo(hasCycleIgnoringEdge(n, edges)),
			yesNo(hasCycleByUnion(n, edges)))
	}
	fmt.Println()

	trials := 3000
	nothingOk := 0
	nodeOk := 0
	edgeOk := 0
	unionOk := 0
	hadCycle := 0
	nothingOver := 0
	for t := 0; t < trials; t++ {
		n := 2 + rand(6)
		edges := []edge{}
		for u := 0; u < n; u++ {
			for v := u + 1; v < n; v++ {
				if rand(4) == 0 {
					edges = append(edges, edge{u, v})
				}
			}
		}
		truth := hasCycleByCounting(n, edges)
		guess := hasCycleIgnoringNothing(n, edges)
		if guess == truth {
			nothingOk++
		}
		if guess && !truth {
			nothingOver++
		}
		if hasCycleIgnoringNode(n, edges) == truth {
			nodeOk++
		}
		if hasCycleIgnoringEdge(n, edges) == truth {
			edgeOk++
		}
		if hasCycleByUnion(n, edges) == truth {
			unionOk++
		}
		if truth {
			hadCycle++
		}
	}

	nodeOkMulti := 0
	edgeOkMulti := 0
	unionOkMulti := 0
	parallelSeen := 0
	for t := 0; t < trials; t++ {
		n := 2 + rand(5)
		edges := []edge{}
		howMany := 1 + rand(5)
		for k := 0; k < howMany; k++ {
			u := rand(n)
			v := rand(n)
			if u != v {
				edges = append(edges, edge{u, v})
			}
		}
		doubled := false
		for i := 0; i < len(edges); i++ {
			for j := i + 1; j < len(edges); j++ {
				a := edges[i]
				b := edges[j]
				if (a.from == b.from && a.to == b.to) || (a.from == b.to && a.to == b.from) {
					doubled = true
				}
			}
		}
		if doubled {
			parallelSeen++
		}
		truth := hasCycleByCounting(n, edges)
		if hasCycleIgnoringNode(n, edges) == truth {
			nodeOkMulti++
		}
		if hasCycleIgnoringEdge(n, edges) == truth {
			edgeOkMulti++
		}
		if hasCycleByUnion(n, edges) == truth {
			unionOkMulti++
		}
	}

	fmt.Printf("over %d random simple graphs on up to 7 nodes:\\n", trials)
	fmt.Printf("  no exemption      %6d\\n", nothingOk)
	fmt.Printf("  by previous node  %6d\\n", nodeOk)
	fmt.Printf("  by arriving edge  %6d\\n", edgeOk)
	fmt.Printf("  by union          %6d\\n", unionOk)
	fmt.Printf("  graphs with a cycle %4d\\n", hadCycle)
	fmt.Println()
	fmt.Printf("over %d random multigraphs, where a pair may be joined twice:\\n", trials)
	fmt.Printf("  by previous node  %6d\\n", nodeOkMulti)
	fmt.Printf("  by arriving edge  %6d\\n", edgeOkMulti)
	fmt.Printf("  by union          %6d\\n", unionOkMulti)
	fmt.Printf("  lists with a repeat %4d\\n", parallelSeen)
	fmt.Println()
	fmt.Println("The exemption is the whole algorithm. Without it every edge looks like a")
	fmt.Printf("cycle: it claimed one on %d graphs that had none, and was right only\\n", nothingOver)
	fmt.Println("on the ones that genuinely did.")
	fmt.Println()
	fmt.Println("The two exemptions are both correct, on multigraphs as well -- which is")
	fmt.Println("worth measuring rather than assuming, because the node version is often")
	fmt.Println("said to be blind to a pair joined twice. It is not: the second of the two")
	fmt.Println("edges is still sitting in the parent's own neighbour list, so the walk")
	fmt.Println("finds it on the way back out. The edge version is still the one to")
	fmt.Println("write, because it is correct without needing that argument.")
	fmt.Println()
	fmt.Println("And the union version does it with no traversal at all, which is the same")
	fmt.Println("machinery Kruskal uses in the next module: join the ends of each edge in")
	fmt.Println("turn, and the first edge whose ends are already joined is the cycle.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Treating any visited node as a cycle",
          body: "The node you arrived from is always visited, so without an exemption every edge reports a cycle. Over 3,000 random graphs that version claimed one on 1,770 graphs that had none. The exemption is not a refinement; it is the algorithm.",
        },
        {
          title: "Repeating the folklore about the parent exemption and multigraphs",
          body: "It is often said that remembering the node rather than the edge makes the check blind to a pair joined twice. Measured over 3,000 multigraphs, 856 with a repeated pair, it was correct every time, because the second edge is still in the parent's own neighbour list. Write the edge version anyway -- it is correct without the argument -- but do not claim the other one is broken.",
        },
      ],
    },
    {
      id: "three-colours",
      heading: "Three colours, once the edges point",
      body: [
        "Make the edges directed and the algorithm has to change, because the fact the undirected version rests on stops being true.",
        "In an undirected graph, meeting a visited node by an edge other than the one you arrived on means there are two routes to it, and two routes close a loop. Following arrows, they do not. The diamond `0->1, 0->2, 1->3, 2->3` has two routes from `0` to `3` and no cycle anywhere, and a visited check calls it a cycle.",
        "How often that matters: over 3,000 random directed graphs the visited check agreed with the truth on 1,851 and claimed a cycle on 1,149 that had none. It never missed one \u2014 the failure is entirely in one direction, which is the signature of a test that is too eager rather than too weak.",
        "The fix is to separate \"visited at some point\" from \"still open on the current path\", which is the three-colour walk: **white** untouched, **grey** entered but not finished, **black** finished. An edge into a grey node is a cycle; an edge into a black node is a second route and is fine. That was correct on all 3,000.",
        "And the colours are exactly the two visited sets from the previous lesson, wearing different names. Grey is the path-local set. Black is the global one. A directed cycle is an edge into a node that is still on the path \u2014 which is why that distinction was worth a lesson of its own.",
        "Keeping the path alongside the colours costs one array and turns a yes-or-no into the cycle itself. Every cycle returned that way was a real sequence of edges closing back on its start, on all 3,000 graphs.",
      ],
      examples: [
        {
          id: "visited-against-colours",
          title: "The diamond that a visited check calls a cycle, and the walk that does not",
          lang: "python",
          code: `# Cycle detection on a directed graph is a different algorithm, and the reason
# is the one fact the undirected version leans on: there, a node already
# visited means a second route into it, and a second route into a node closes a
# loop. Following arrows, it does not.
#
# A directed graph can have two routes from a to d that never form a cycle --
# the diamond a->b->d, a->c->d. A visited check calls that a cycle. What is
# needed is the distinction between "visited at some point" and "still open on
# the current path", which is the three-colour walk: white untouched, grey
# entered but not finished, black finished.
#
# Both are scored against the topological-order test from lesson three: a
# directed graph is acyclic exactly when repeatedly removing a node with
# nothing pointing at it empties the graph.


def build(n, edges):
    neighbours = [[] for _ in range(n)]
    for u, v in edges:
        neighbours[u].append(v)
    return neighbours


def has_cycle_by_order(n, edges):
    """The oracle. No topological order exists exactly when there is a cycle."""
    incoming = [0] * n
    for _, v in edges:
        incoming[v] += 1
    neighbours = build(n, edges)
    ready = [v for v in range(n) if incoming[v] == 0]
    head = 0
    removed = 0
    while head < len(ready):
        v = ready[head]
        head += 1
        removed += 1
        for u in neighbours[v]:
            incoming[u] -= 1
            if incoming[u] == 0:
                ready.append(u)
    return removed < n


def has_cycle_by_visited(n, edges):
    """One flag per node. Cannot tell a second route from a loop."""
    neighbours = build(n, edges)
    seen = [False] * n
    found = [False]

    def walk(v):
        seen[v] = True
        for u in neighbours[v]:
            if seen[u]:
                found[0] = True
            else:
                walk(u)

    for start in range(n):
        if not seen[start]:
            walk(start)
    return found[0]


WHITE = 0
GREY = 1
BLACK = 2


def has_cycle_by_colour(n, edges):
    """White untouched, grey open on this path, black finished. Grey means a cycle."""
    neighbours = build(n, edges)
    colour = [WHITE] * n
    found = [False]

    def walk(v):
        colour[v] = GREY
        for u in neighbours[v]:
            if colour[u] == GREY:
                found[0] = True
            elif colour[u] == WHITE:
                walk(u)
        colour[v] = BLACK

    for start in range(n):
        if colour[start] == WHITE:
            walk(start)
    return found[0]


def cycle_through_colour(n, edges):
    """The same walk, keeping the path so the cycle itself can be printed."""
    neighbours = build(n, edges)
    colour = [WHITE] * n
    path = []
    answer = []

    def walk(v):
        colour[v] = GREY
        path.append(v)
        for u in neighbours[v]:
            if len(answer) > 0:
                break
            if colour[u] == GREY:
                at = len(path) - 1
                while path[at] != u:
                    at -= 1
                for i in range(at, len(path)):
                    answer.append(path[i])
                answer.append(u)
            elif colour[u] == WHITE:
                walk(u)
        path.pop()
        colour[v] = BLACK

    for start in range(n):
        if colour[start] == WHITE and len(answer) == 0:
            walk(start)
    return answer


def cycle_is_real(n, edges, cycle):
    """Every consecutive pair must be an edge, and the ends must meet."""
    if len(cycle) < 2:
        return False
    if cycle[0] != cycle[len(cycle) - 1]:
        return False
    neighbours = build(n, edges)
    for i in range(len(cycle) - 1):
        joined = False
        for u in neighbours[cycle[i]]:
            if u == cycle[i + 1]:
                joined = True
        if not joined:
            return False
    return True


def yes_no(flag):
    return "yes" if flag else "no"


def show(values):
    return "[" + ", ".join(str(v) for v in values) + "]"


def show_edges(edges):
    return "[" + ", ".join(f"{u}->{v}" for u, v in edges) + "]"


CASES = [
    (4, [(0, 1), (0, 2), (1, 3), (2, 3)]),
    (4, [(0, 1), (1, 2), (2, 3), (3, 1)]),
    (3, [(0, 1), (1, 2)]),
    (5, [(0, 1), (1, 2), (2, 0), (2, 3), (3, 4)]),
]

print(f"{'edges':<40}{'truth':>7}{'by visited':>12}{'by colour':>11}{'the cycle':>16}")
for n, edges in CASES:
    cycle = cycle_through_colour(n, edges)
    shown = show(cycle) if len(cycle) > 0 else "none"
    print(f"{show_edges(edges):<40}{yes_no(has_cycle_by_order(n, edges)):>7}"
          f"{yes_no(has_cycle_by_visited(n, edges)):>12}"
          f"{yes_no(has_cycle_by_colour(n, edges)):>11}{shown:>16}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
visited_ok = 0
visited_over = 0
visited_under = 0
colour_ok = 0
cycles_real = 0
had_cycle = 0
for _ in range(TRIALS):
    n = 2 + rand(6)
    edges = []
    for u in range(n):
        for v in range(n):
            if u != v and rand(5) == 0:
                edges.append((u, v))
    truth = has_cycle_by_order(n, edges)
    guess = has_cycle_by_visited(n, edges)
    if guess == truth:
        visited_ok += 1
    if guess and not truth:
        visited_over += 1
    if truth and not guess:
        visited_under += 1
    if has_cycle_by_colour(n, edges) == truth:
        colour_ok += 1
    cycle = cycle_through_colour(n, edges)
    if truth:
        had_cycle += 1
        if cycle_is_real(n, edges, cycle):
            cycles_real += 1
    elif len(cycle) == 0:
        cycles_real += 1

print(f"over {TRIALS} random directed graphs on up to 7 nodes:")
print(f"  the visited check agreed      {visited_ok:>6}")
print(f"  the three-colour walk agreed  {colour_ok:>6}")
print(f"  the cycle it returned was real{cycles_real:>6}")
print(f"  graphs that had a cycle       {had_cycle:>6}")
print()
print(f"The visited check claimed a cycle on {visited_over} graphs that had none and missed")
print(f"{visited_under}. It only ever over-reports, and the reason is the diamond in the first")
print("row: two routes from 0 to 3, no loop anywhere, and node 3 is reached")
print("twice. On an undirected graph a second route into a node really is a")
print("cycle. Following arrows it is not, and one boolean per node cannot tell")
print("the difference.")
print()
print("Grey is the fix and it is exactly the difference between the two visited")
print("sets from the previous lesson: grey is the path-local set, black is the")
print("global one, and a directed cycle is an edge into a node that is still on")
print("the path. Keeping the path alongside the colours costs nothing and turns")
print("a yes-or-no into the cycle itself.")
`,
          output: `edges                                     truth  by visited  by colour       the cycle
[0->1, 0->2, 1->3, 2->3]                     no         yes         no            none
[0->1, 1->2, 2->3, 3->1]                    yes         yes        yes    [1, 2, 3, 1]
[0->1, 1->2]                                 no          no         no            none
[0->1, 1->2, 2->0, 2->3, 3->4]              yes         yes        yes    [0, 1, 2, 0]

over 3000 random directed graphs on up to 7 nodes:
  the visited check agreed        1851
  the three-colour walk agreed    3000
  the cycle it returned was real  3000
  graphs that had a cycle         1012

The visited check claimed a cycle on 1149 graphs that had none and missed
0. It only ever over-reports, and the reason is the diamond in the first
row: two routes from 0 to 3, no loop anywhere, and node 3 is reached
twice. On an undirected graph a second route into a node really is a
cycle. Following arrows it is not, and one boolean per node cannot tell
the difference.

Grey is the fix and it is exactly the difference between the two visited
sets from the previous lesson: grey is the path-local set, black is the
global one, and a directed cycle is an edge into a node that is still on
the path. Keeping the path alongside the colours costs nothing and turns
a yes-or-no into the cycle itself.`,
          explanation:
            "The visited check and the three-colour walk on the same directed graphs, scored against the topological-order test. The diamond in the first row is the whole reason the second algorithm exists.",
          alternates: [
            {
              lang: "javascript",
              code: `// Cycle detection on a directed graph is a different algorithm, and the reason
// is the one fact the undirected version leans on: there, a node already
// visited means a second route into it, and a second route into a node closes a
// loop. Following arrows, it does not.
//
// A directed graph can have two routes from a to d that never form a cycle --
// the diamond a->b->d, a->c->d. A visited check calls that a cycle. What is
// needed is the distinction between "visited at some point" and "still open on
// the current path", which is the three-colour walk: white untouched, grey
// entered but not finished, black finished.
//
// Both are scored against the topological-order test from lesson three: a
// directed graph is acyclic exactly when repeatedly removing a node with
// nothing pointing at it empties the graph.

function build(n, edges) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) neighbours[u].push(v);
  return neighbours;
}

/** The oracle. No topological order exists exactly when there is a cycle. */
function hasCycleByOrder(n, edges) {
  const incoming = new Array(n).fill(0);
  for (const [, v] of edges) incoming[v] += 1;
  const neighbours = build(n, edges);
  const ready = [];
  for (let v = 0; v < n; v += 1) if (incoming[v] === 0) ready.push(v);
  let head = 0;
  let removed = 0;
  while (head < ready.length) {
    const v = ready[head];
    head += 1;
    removed += 1;
    for (const u of neighbours[v]) {
      incoming[u] -= 1;
      if (incoming[u] === 0) ready.push(u);
    }
  }
  return removed < n;
}

/** One flag per node. Cannot tell a second route from a loop. */
function hasCycleByVisited(n, edges) {
  const neighbours = build(n, edges);
  const seen = new Array(n).fill(false);
  let found = false;

  function walk(v) {
    seen[v] = true;
    for (const u of neighbours[v]) {
      if (seen[u]) found = true;
      else walk(u);
    }
  }

  for (let start = 0; start < n; start += 1) {
    if (!seen[start]) walk(start);
  }
  return found;
}

const WHITE = 0;
const GREY = 1;
const BLACK = 2;

/** White untouched, grey open on this path, black finished. Grey means a cycle. */
function hasCycleByColour(n, edges) {
  const neighbours = build(n, edges);
  const colour = new Array(n).fill(WHITE);
  let found = false;

  function walk(v) {
    colour[v] = GREY;
    for (const u of neighbours[v]) {
      if (colour[u] === GREY) found = true;
      else if (colour[u] === WHITE) walk(u);
    }
    colour[v] = BLACK;
  }

  for (let start = 0; start < n; start += 1) {
    if (colour[start] === WHITE) walk(start);
  }
  return found;
}

/** The same walk, keeping the path so the cycle itself can be printed. */
function cycleThroughColour(n, edges) {
  const neighbours = build(n, edges);
  const colour = new Array(n).fill(WHITE);
  const path = [];
  const answer = [];

  function walk(v) {
    colour[v] = GREY;
    path.push(v);
    for (const u of neighbours[v]) {
      if (answer.length > 0) break;
      if (colour[u] === GREY) {
        let at = path.length - 1;
        while (path[at] !== u) at -= 1;
        for (let i = at; i < path.length; i += 1) answer.push(path[i]);
        answer.push(u);
      } else if (colour[u] === WHITE) {
        walk(u);
      }
    }
    path.pop();
    colour[v] = BLACK;
  }

  for (let start = 0; start < n; start += 1) {
    if (colour[start] === WHITE && answer.length === 0) walk(start);
  }
  return answer;
}

/** Every consecutive pair must be an edge, and the ends must meet. */
function cycleIsReal(n, edges, cycle) {
  if (cycle.length < 2) return false;
  if (cycle[0] !== cycle[cycle.length - 1]) return false;
  const neighbours = build(n, edges);
  for (let i = 0; i < cycle.length - 1; i += 1) {
    let joined = false;
    for (const u of neighbours[cycle[i]]) {
      if (u === cycle[i + 1]) joined = true;
    }
    if (!joined) return false;
  }
  return true;
}

const yesNo = (flag) => (flag ? "yes" : "no");
const show = (values) => "[" + values.join(", ") + "]";
const showEdges = (edges) =>
  "[" + edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ") + "]";
const padEnd = (v, w) => String(v).padEnd(w);
const pad = (v, w) => String(v).padStart(w);

const CASES = [
  [4, [[0, 1], [0, 2], [1, 3], [2, 3]]],
  [4, [[0, 1], [1, 2], [2, 3], [3, 1]]],
  [3, [[0, 1], [1, 2]]],
  [5, [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4]]],
];

console.log(
  padEnd("edges", 40) + pad("truth", 7) + pad("by visited", 12) + pad("by colour", 11) + pad("the cycle", 16)
);
for (const [n, edges] of CASES) {
  const cycle = cycleThroughColour(n, edges);
  const shown = cycle.length > 0 ? show(cycle) : "none";
  console.log(
    padEnd(showEdges(edges), 40) +
      pad(yesNo(hasCycleByOrder(n, edges)), 7) +
      pad(yesNo(hasCycleByVisited(n, edges)), 12) +
      pad(yesNo(hasCycleByColour(n, edges)), 11) +
      pad(shown, 16)
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
let visitedOk = 0;
let visitedOver = 0;
let visitedUnder = 0;
let colourOk = 0;
let cyclesReal = 0;
let hadCycle = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v && rand(5) === 0) edges.push([u, v]);
    }
  }
  const truth = hasCycleByOrder(n, edges);
  const guess = hasCycleByVisited(n, edges);
  if (guess === truth) visitedOk += 1;
  if (guess && !truth) visitedOver += 1;
  if (truth && !guess) visitedUnder += 1;
  if (hasCycleByColour(n, edges) === truth) colourOk += 1;
  const cycle = cycleThroughColour(n, edges);
  if (truth) {
    hadCycle += 1;
    if (cycleIsReal(n, edges, cycle)) cyclesReal += 1;
  } else if (cycle.length === 0) {
    cyclesReal += 1;
  }
}

console.log(\`over \${TRIALS} random directed graphs on up to 7 nodes:\`);
console.log(\`  the visited check agreed      \${pad(visitedOk, 6)}\`);
console.log(\`  the three-colour walk agreed  \${pad(colourOk, 6)}\`);
console.log(\`  the cycle it returned was real\${pad(cyclesReal, 6)}\`);
console.log(\`  graphs that had a cycle       \${pad(hadCycle, 6)}\`);
console.log();
console.log(\`The visited check claimed a cycle on \${visitedOver} graphs that had none and missed\`);
console.log(\`\${visitedUnder}. It only ever over-reports, and the reason is the diamond in the first\`);
console.log("row: two routes from 0 to 3, no loop anywhere, and node 3 is reached");
console.log("twice. On an undirected graph a second route into a node really is a");
console.log("cycle. Following arrows it is not, and one boolean per node cannot tell");
console.log("the difference.");
console.log();
console.log("Grey is the fix and it is exactly the difference between the two visited");
console.log("sets from the previous lesson: grey is the path-local set, black is the");
console.log("global one, and a directed cycle is an edge into a node that is still on");
console.log("the path. Keeping the path alongside the colours costs nothing and turns");
console.log("a yes-or-no into the cycle itself.");
`,
            },
            {
              lang: "typescript",
              code: `// Cycle detection on a directed graph is a different algorithm, and the reason
// is the one fact the undirected version leans on: there, a node already
// visited means a second route into it, and a second route into a node closes a
// loop. Following arrows, it does not.
//
// A directed graph can have two routes from a to d that never form a cycle --
// the diamond a->b->d, a->c->d. A visited check calls that a cycle. What is
// needed is the distinction between "visited at some point" and "still open on
// the current path", which is the three-colour walk: white untouched, grey
// entered but not finished, black finished.
//
// Both are scored against the topological-order test from lesson three: a
// directed graph is acyclic exactly when repeatedly removing a node with
// nothing pointing at it empties the graph.

type Edge = [number, number];

function build(n: number, edges: Edge[]): number[][] {
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) neighbours[u].push(v);
  return neighbours;
}

/** The oracle. No topological order exists exactly when there is a cycle. */
function hasCycleByOrder(n: number, edges: Edge[]): boolean {
  const incoming = new Array(n).fill(0);
  for (const [, v] of edges) incoming[v] += 1;
  const neighbours = build(n, edges);
  const ready: number[] = [];
  for (let v = 0; v < n; v += 1) if (incoming[v] === 0) ready.push(v);
  let head = 0;
  let removed = 0;
  while (head < ready.length) {
    const v = ready[head];
    head += 1;
    removed += 1;
    for (const u of neighbours[v]) {
      incoming[u] -= 1;
      if (incoming[u] === 0) ready.push(u);
    }
  }
  return removed < n;
}

/** One flag per node. Cannot tell a second route from a loop. */
function hasCycleByVisited(n: number, edges: Edge[]): boolean {
  const neighbours = build(n, edges);
  const seen = new Array(n).fill(false);
  let found = false;

  function walk(v: number): void {
    seen[v] = true;
    for (const u of neighbours[v]) {
      if (seen[u]) found = true;
      else walk(u);
    }
  }

  for (let start = 0; start < n; start += 1) {
    if (!seen[start]) walk(start);
  }
  return found;
}

const WHITE = 0;
const GREY = 1;
const BLACK = 2;

/** White untouched, grey open on this path, black finished. Grey means a cycle. */
function hasCycleByColour(n: number, edges: Edge[]): boolean {
  const neighbours = build(n, edges);
  const colour = new Array(n).fill(WHITE);
  let found = false;

  function walk(v: number): void {
    colour[v] = GREY;
    for (const u of neighbours[v]) {
      if (colour[u] === GREY) found = true;
      else if (colour[u] === WHITE) walk(u);
    }
    colour[v] = BLACK;
  }

  for (let start = 0; start < n; start += 1) {
    if (colour[start] === WHITE) walk(start);
  }
  return found;
}

/** The same walk, keeping the path so the cycle itself can be printed. */
function cycleThroughColour(n: number, edges: Edge[]): number[] {
  const neighbours = build(n, edges);
  const colour = new Array(n).fill(WHITE);
  const path: number[] = [];
  const answer: number[] = [];

  function walk(v: number): void {
    colour[v] = GREY;
    path.push(v);
    for (const u of neighbours[v]) {
      if (answer.length > 0) break;
      if (colour[u] === GREY) {
        let at = path.length - 1;
        while (path[at] !== u) at -= 1;
        for (let i = at; i < path.length; i += 1) answer.push(path[i]);
        answer.push(u);
      } else if (colour[u] === WHITE) {
        walk(u);
      }
    }
    path.pop();
    colour[v] = BLACK;
  }

  for (let start = 0; start < n; start += 1) {
    if (colour[start] === WHITE && answer.length === 0) walk(start);
  }
  return answer;
}

/** Every consecutive pair must be an edge, and the ends must meet. */
function cycleIsReal(n: number, edges: Edge[], cycle: number[]): boolean {
  if (cycle.length < 2) return false;
  if (cycle[0] !== cycle[cycle.length - 1]) return false;
  const neighbours = build(n, edges);
  for (let i = 0; i < cycle.length - 1; i += 1) {
    let joined = false;
    for (const u of neighbours[cycle[i]]) {
      if (u === cycle[i + 1]) joined = true;
    }
    if (!joined) return false;
  }
  return true;
}

const yesNo = (flag: boolean): string => (flag ? "yes" : "no");
const show = (values: number[]): string => "[" + values.join(", ") + "]";
const showEdges = (edges: Edge[]): string =>
  "[" + edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ") + "]";
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const pad = (v: string | number, w: number): string => String(v).padStart(w);

const CASES: [number, Edge[]][] = [
  [4, [[0, 1], [0, 2], [1, 3], [2, 3]]],
  [4, [[0, 1], [1, 2], [2, 3], [3, 1]]],
  [3, [[0, 1], [1, 2]]],
  [5, [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4]]],
];

console.log(
  padEnd("edges", 40) + pad("truth", 7) + pad("by visited", 12) + pad("by colour", 11) + pad("the cycle", 16)
);
for (const [n, edges] of CASES) {
  const cycle = cycleThroughColour(n, edges);
  const shown = cycle.length > 0 ? show(cycle) : "none";
  console.log(
    padEnd(showEdges(edges), 40) +
      pad(yesNo(hasCycleByOrder(n, edges)), 7) +
      pad(yesNo(hasCycleByVisited(n, edges)), 12) +
      pad(yesNo(hasCycleByColour(n, edges)), 11) +
      pad(shown, 16)
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
let visitedOk = 0;
let visitedOver = 0;
let visitedUnder = 0;
let colourOk = 0;
let cyclesReal = 0;
let hadCycle = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges: Edge[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v && rand(5) === 0) edges.push([u, v]);
    }
  }
  const truth = hasCycleByOrder(n, edges);
  const guess = hasCycleByVisited(n, edges);
  if (guess === truth) visitedOk += 1;
  if (guess && !truth) visitedOver += 1;
  if (truth && !guess) visitedUnder += 1;
  if (hasCycleByColour(n, edges) === truth) colourOk += 1;
  const cycle = cycleThroughColour(n, edges);
  if (truth) {
    hadCycle += 1;
    if (cycleIsReal(n, edges, cycle)) cyclesReal += 1;
  } else if (cycle.length === 0) {
    cyclesReal += 1;
  }
}

console.log(\`over \${TRIALS} random directed graphs on up to 7 nodes:\`);
console.log(\`  the visited check agreed      \${pad(visitedOk, 6)}\`);
console.log(\`  the three-colour walk agreed  \${pad(colourOk, 6)}\`);
console.log(\`  the cycle it returned was real\${pad(cyclesReal, 6)}\`);
console.log(\`  graphs that had a cycle       \${pad(hadCycle, 6)}\`);
console.log();
console.log(\`The visited check claimed a cycle on \${visitedOver} graphs that had none and missed\`);
console.log(\`\${visitedUnder}. It only ever over-reports, and the reason is the diamond in the first\`);
console.log("row: two routes from 0 to 3, no loop anywhere, and node 3 is reached");
console.log("twice. On an undirected graph a second route into a node really is a");
console.log("cycle. Following arrows it is not, and one boolean per node cannot tell");
console.log("the difference.");
console.log();
console.log("Grey is the fix and it is exactly the difference between the two visited");
console.log("sets from the previous lesson: grey is the path-local set, black is the");
console.log("global one, and a directed cycle is an edge into a node that is still on");
console.log("the path. Keeping the path alongside the colours costs nothing and turns");
console.log("a yes-or-no into the cycle itself.");
`,
            },
            {
              lang: "java",
              code: `// Cycle detection on a directed graph is a different algorithm, and the reason
// is the one fact the undirected version leans on: there, a node already
// visited means a second route into it, and a second route into a node closes a
// loop. Following arrows, it does not.
//
// A directed graph can have two routes from a to d that never form a cycle --
// the diamond a->b->d, a->c->d. A visited check calls that a cycle. What is
// needed is the distinction between "visited at some point" and "still open on
// the current path", which is the three-colour walk: white untouched, grey
// entered but not finished, black finished.
//
// Both are scored against the topological-order test from lesson three: a
// directed graph is acyclic exactly when repeatedly removing a node with
// nothing pointing at it empties the graph.

import java.util.ArrayList;
import java.util.List;

public class Main {

    static final int WHITE = 0;
    static final int GREY = 1;
    static final int BLACK = 2;

    static List<List<Integer>> build(int n, int[][] edges) {
        List<List<Integer>> neighbours = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            neighbours.add(new ArrayList<>());
        }
        for (int[] e : edges) {
            neighbours.get(e[0]).add(e[1]);
        }
        return neighbours;
    }

    /** The oracle. No topological order exists exactly when there is a cycle. */
    static boolean hasCycleByOrder(int n, int[][] edges) {
        int[] incoming = new int[n];
        for (int[] e : edges) {
            incoming[e[1]]++;
        }
        List<List<Integer>> neighbours = build(n, edges);
        List<Integer> ready = new ArrayList<>();
        for (int v = 0; v < n; v++) {
            if (incoming[v] == 0) {
                ready.add(v);
            }
        }
        int head = 0;
        int removed = 0;
        while (head < ready.size()) {
            int v = ready.get(head);
            head++;
            removed++;
            for (int u : neighbours.get(v)) {
                incoming[u]--;
                if (incoming[u] == 0) {
                    ready.add(u);
                }
            }
        }
        return removed < n;
    }

    static boolean found;
    static boolean[] seenFlags;
    static int[] colour;

    static void walkVisited(List<List<Integer>> neighbours, int v) {
        seenFlags[v] = true;
        for (int u : neighbours.get(v)) {
            if (seenFlags[u]) {
                found = true;
            } else {
                walkVisited(neighbours, u);
            }
        }
    }

    /** One flag per node. Cannot tell a second route from a loop. */
    static boolean hasCycleByVisited(int n, int[][] edges) {
        List<List<Integer>> neighbours = build(n, edges);
        seenFlags = new boolean[n];
        found = false;
        for (int start = 0; start < n; start++) {
            if (!seenFlags[start]) {
                walkVisited(neighbours, start);
            }
        }
        return found;
    }

    static void walkColour(List<List<Integer>> neighbours, int v) {
        colour[v] = GREY;
        for (int u : neighbours.get(v)) {
            if (colour[u] == GREY) {
                found = true;
            } else if (colour[u] == WHITE) {
                walkColour(neighbours, u);
            }
        }
        colour[v] = BLACK;
    }

    /** White untouched, grey open on this path, black finished. Grey means a cycle. */
    static boolean hasCycleByColour(int n, int[][] edges) {
        List<List<Integer>> neighbours = build(n, edges);
        colour = new int[n];
        found = false;
        for (int start = 0; start < n; start++) {
            if (colour[start] == WHITE) {
                walkColour(neighbours, start);
            }
        }
        return found;
    }

    static List<Integer> path;
    static List<Integer> answer;

    static void walkKeepingPath(List<List<Integer>> neighbours, int v) {
        colour[v] = GREY;
        path.add(v);
        for (int u : neighbours.get(v)) {
            if (!answer.isEmpty()) {
                break;
            }
            if (colour[u] == GREY) {
                int at = path.size() - 1;
                while (path.get(at) != u) {
                    at--;
                }
                for (int i = at; i < path.size(); i++) {
                    answer.add(path.get(i));
                }
                answer.add(u);
            } else if (colour[u] == WHITE) {
                walkKeepingPath(neighbours, u);
            }
        }
        path.remove(path.size() - 1);
        colour[v] = BLACK;
    }

    /** The same walk, keeping the path so the cycle itself can be printed. */
    static List<Integer> cycleThroughColour(int n, int[][] edges) {
        List<List<Integer>> neighbours = build(n, edges);
        colour = new int[n];
        path = new ArrayList<>();
        answer = new ArrayList<>();
        for (int start = 0; start < n; start++) {
            if (colour[start] == WHITE && answer.isEmpty()) {
                walkKeepingPath(neighbours, start);
            }
        }
        return answer;
    }

    /** Every consecutive pair must be an edge, and the ends must meet. */
    static boolean cycleIsReal(int n, int[][] edges, List<Integer> cycle) {
        if (cycle.size() < 2) {
            return false;
        }
        if (!cycle.get(0).equals(cycle.get(cycle.size() - 1))) {
            return false;
        }
        List<List<Integer>> neighbours = build(n, edges);
        for (int i = 0; i < cycle.size() - 1; i++) {
            boolean joined = false;
            for (int u : neighbours.get(cycle.get(i))) {
                if (u == cycle.get(i + 1)) {
                    joined = true;
                }
            }
            if (!joined) {
                return false;
            }
        }
        return true;
    }

    static String yesNo(boolean flag) {
        return flag ? "yes" : "no";
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
            sb.append(edges[i][0]).append("->").append(edges[i][1]);
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
        int[] sizes = {4, 4, 3, 5};
        int[][][] cases = {
            {{0, 1}, {0, 2}, {1, 3}, {2, 3}},
            {{0, 1}, {1, 2}, {2, 3}, {3, 1}},
            {{0, 1}, {1, 2}},
            {{0, 1}, {1, 2}, {2, 0}, {2, 3}, {3, 4}},
        };

        System.out.println(padEnd("edges", 40) + pad("truth", 7) + pad("by visited", 12)
                + pad("by colour", 11) + pad("the cycle", 16));
        for (int c = 0; c < sizes.length; c++) {
            int n = sizes[c];
            List<Integer> cycle = cycleThroughColour(n, cases[c]);
            String shown = cycle.isEmpty() ? "none" : show(cycle);
            System.out.println(padEnd(showEdges(cases[c]), 40)
                    + pad(yesNo(hasCycleByOrder(n, cases[c])), 7)
                    + pad(yesNo(hasCycleByVisited(n, cases[c])), 12)
                    + pad(yesNo(hasCycleByColour(n, cases[c])), 11)
                    + pad(shown, 16));
        }
        System.out.println();

        int trials = 3000;
        int visitedOk = 0;
        int visitedOver = 0;
        int visitedUnder = 0;
        int colourOk = 0;
        int cyclesReal = 0;
        int hadCycle = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(6);
            List<int[]> collected = new ArrayList<>();
            for (int u = 0; u < n; u++) {
                for (int v = 0; v < n; v++) {
                    if (u != v && rand(5) == 0) {
                        collected.add(new int[] {u, v});
                    }
                }
            }
            int[][] edges = collected.toArray(new int[0][]);
            boolean truth = hasCycleByOrder(n, edges);
            boolean guess = hasCycleByVisited(n, edges);
            if (guess == truth) {
                visitedOk++;
            }
            if (guess && !truth) {
                visitedOver++;
            }
            if (truth && !guess) {
                visitedUnder++;
            }
            if (hasCycleByColour(n, edges) == truth) {
                colourOk++;
            }
            List<Integer> cycle = cycleThroughColour(n, edges);
            if (truth) {
                hadCycle++;
                if (cycleIsReal(n, edges, cycle)) {
                    cyclesReal++;
                }
            } else if (cycle.isEmpty()) {
                cyclesReal++;
            }
        }

        System.out.println("over " + trials + " random directed graphs on up to 7 nodes:");
        System.out.println("  the visited check agreed      " + pad(String.valueOf(visitedOk), 6));
        System.out.println("  the three-colour walk agreed  " + pad(String.valueOf(colourOk), 6));
        System.out.println("  the cycle it returned was real" + pad(String.valueOf(cyclesReal), 6));
        System.out.println("  graphs that had a cycle       " + pad(String.valueOf(hadCycle), 6));
        System.out.println();
        System.out.println("The visited check claimed a cycle on " + visitedOver
                + " graphs that had none and missed");
        System.out.println(visitedUnder + ". It only ever over-reports, and the reason is the diamond in the first");
        System.out.println("row: two routes from 0 to 3, no loop anywhere, and node 3 is reached");
        System.out.println("twice. On an undirected graph a second route into a node really is a");
        System.out.println("cycle. Following arrows it is not, and one boolean per node cannot tell");
        System.out.println("the difference.");
        System.out.println();
        System.out.println("Grey is the fix and it is exactly the difference between the two visited");
        System.out.println("sets from the previous lesson: grey is the path-local set, black is the");
        System.out.println("global one, and a directed cycle is an edge into a node that is still on");
        System.out.println("the path. Keeping the path alongside the colours costs nothing and turns");
        System.out.println("a yes-or-no into the cycle itself.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Cycle detection on a directed graph is a different algorithm, and the reason
// is the one fact the undirected version leans on: there, a node already
// visited means a second route into it, and a second route into a node closes a
// loop. Following arrows, it does not.
//
// A directed graph can have two routes from a to d that never form a cycle --
// the diamond a->b->d, a->c->d. A visited check calls that a cycle. What is
// needed is the distinction between "visited at some point" and "still open on
// the current path", which is the three-colour walk: white untouched, grey
// entered but not finished, black finished.
//
// Both are scored against the topological-order test from lesson three: a
// directed graph is acyclic exactly when repeatedly removing a node with
// nothing pointing at it empties the graph.

#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

const int WHITE = 0;
const int GREY = 1;
const int BLACK = 2;

using Edge = std::pair<int, int>;

std::vector<std::vector<int>> build(int n, const std::vector<Edge>& edges) {
    std::vector<std::vector<int>> neighbours(n);
    for (const Edge& e : edges) {
        neighbours[e.first].push_back(e.second);
    }
    return neighbours;
}

// The oracle. No topological order exists exactly when there is a cycle.
bool has_cycle_by_order(int n, const std::vector<Edge>& edges) {
    std::vector<int> incoming(n, 0);
    for (const Edge& e : edges) {
        incoming[e.second]++;
    }
    std::vector<std::vector<int>> neighbours = build(n, edges);
    std::vector<int> ready;
    for (int v = 0; v < n; v++) {
        if (incoming[v] == 0) {
            ready.push_back(v);
        }
    }
    size_t head = 0;
    int removed = 0;
    while (head < ready.size()) {
        int v = ready[head];
        head++;
        removed++;
        for (int u : neighbours[v]) {
            incoming[u]--;
            if (incoming[u] == 0) {
                ready.push_back(u);
            }
        }
    }
    return removed < n;
}

void walk_visited(const std::vector<std::vector<int>>& neighbours, std::vector<char>& seen,
                  bool& found, int v) {
    seen[v] = 1;
    for (int u : neighbours[v]) {
        if (seen[u]) {
            found = true;
        } else {
            walk_visited(neighbours, seen, found, u);
        }
    }
}

// One flag per node. Cannot tell a second route from a loop.
bool has_cycle_by_visited(int n, const std::vector<Edge>& edges) {
    std::vector<std::vector<int>> neighbours = build(n, edges);
    std::vector<char> seen(n, 0);
    bool found = false;
    for (int start = 0; start < n; start++) {
        if (!seen[start]) {
            walk_visited(neighbours, seen, found, start);
        }
    }
    return found;
}

void walk_colour(const std::vector<std::vector<int>>& neighbours, std::vector<int>& colour,
                 bool& found, int v) {
    colour[v] = GREY;
    for (int u : neighbours[v]) {
        if (colour[u] == GREY) {
            found = true;
        } else if (colour[u] == WHITE) {
            walk_colour(neighbours, colour, found, u);
        }
    }
    colour[v] = BLACK;
}

// White untouched, grey open on this path, black finished. Grey means a cycle.
bool has_cycle_by_colour(int n, const std::vector<Edge>& edges) {
    std::vector<std::vector<int>> neighbours = build(n, edges);
    std::vector<int> colour(n, WHITE);
    bool found = false;
    for (int start = 0; start < n; start++) {
        if (colour[start] == WHITE) {
            walk_colour(neighbours, colour, found, start);
        }
    }
    return found;
}

void walk_keeping_path(const std::vector<std::vector<int>>& neighbours, std::vector<int>& colour,
                       std::vector<int>& path, std::vector<int>& answer, int v) {
    colour[v] = GREY;
    path.push_back(v);
    for (int u : neighbours[v]) {
        if (!answer.empty()) {
            break;
        }
        if (colour[u] == GREY) {
            int at = static_cast<int>(path.size()) - 1;
            while (path[at] != u) {
                at--;
            }
            for (size_t i = at; i < path.size(); i++) {
                answer.push_back(path[i]);
            }
            answer.push_back(u);
        } else if (colour[u] == WHITE) {
            walk_keeping_path(neighbours, colour, path, answer, u);
        }
    }
    path.pop_back();
    colour[v] = BLACK;
}

// The same walk, keeping the path so the cycle itself can be printed.
std::vector<int> cycle_through_colour(int n, const std::vector<Edge>& edges) {
    std::vector<std::vector<int>> neighbours = build(n, edges);
    std::vector<int> colour(n, WHITE);
    std::vector<int> path;
    std::vector<int> answer;
    for (int start = 0; start < n; start++) {
        if (colour[start] == WHITE && answer.empty()) {
            walk_keeping_path(neighbours, colour, path, answer, start);
        }
    }
    return answer;
}

// Every consecutive pair must be an edge, and the ends must meet.
bool cycle_is_real(int n, const std::vector<Edge>& edges, const std::vector<int>& cycle) {
    if (cycle.size() < 2) {
        return false;
    }
    if (cycle[0] != cycle[cycle.size() - 1]) {
        return false;
    }
    std::vector<std::vector<int>> neighbours = build(n, edges);
    for (size_t i = 0; i + 1 < cycle.size(); i++) {
        bool joined = false;
        for (int u : neighbours[cycle[i]]) {
            if (u == cycle[i + 1]) {
                joined = true;
            }
        }
        if (!joined) {
            return false;
        }
    }
    return true;
}

std::string yes_no(bool flag) {
    return flag ? "yes" : "no";
}

std::string show(const std::vector<int>& values) {
    std::string out = "[";
    for (size_t i = 0; i < values.size(); i++) {
        if (i > 0) {
            out += ", ";
        }
        out += std::to_string(values[i]);
    }
    return out + "]";
}

std::string show_edges(const std::vector<Edge>& edges) {
    std::string out = "[";
    for (size_t i = 0; i < edges.size(); i++) {
        if (i > 0) {
            out += ", ";
        }
        out += std::to_string(edges[i].first) + "->" + std::to_string(edges[i].second);
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
    std::vector<int> sizes = {4, 4, 3, 5};
    std::vector<std::vector<Edge>> cases = {
        {{0, 1}, {0, 2}, {1, 3}, {2, 3}},
        {{0, 1}, {1, 2}, {2, 3}, {3, 1}},
        {{0, 1}, {1, 2}},
        {{0, 1}, {1, 2}, {2, 0}, {2, 3}, {3, 4}},
    };

    std::cout << std::left << std::setw(40) << "edges" << std::right << std::setw(7) << "truth"
              << std::setw(12) << "by visited" << std::setw(11) << "by colour"
              << std::setw(16) << "the cycle" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        int n = sizes[c];
        std::vector<int> cycle = cycle_through_colour(n, cases[c]);
        std::string shown = cycle.empty() ? std::string("none") : show(cycle);
        std::cout << std::left << std::setw(40) << show_edges(cases[c]) << std::right
                  << std::setw(7) << yes_no(has_cycle_by_order(n, cases[c]))
                  << std::setw(12) << yes_no(has_cycle_by_visited(n, cases[c]))
                  << std::setw(11) << yes_no(has_cycle_by_colour(n, cases[c]))
                  << std::setw(16) << shown << "\\n";
    }
    std::cout << "\\n";

    int trials = 3000;
    int visited_ok = 0;
    int visited_over = 0;
    int visited_under = 0;
    int colour_ok = 0;
    int cycles_real = 0;
    int had_cycle = 0;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(6);
        std::vector<Edge> edges;
        for (int u = 0; u < n; u++) {
            for (int v = 0; v < n; v++) {
                if (u != v && rand_below(5) == 0) {
                    edges.push_back(Edge(u, v));
                }
            }
        }
        bool truth = has_cycle_by_order(n, edges);
        bool guess = has_cycle_by_visited(n, edges);
        if (guess == truth) {
            visited_ok++;
        }
        if (guess && !truth) {
            visited_over++;
        }
        if (truth && !guess) {
            visited_under++;
        }
        if (has_cycle_by_colour(n, edges) == truth) {
            colour_ok++;
        }
        std::vector<int> cycle = cycle_through_colour(n, edges);
        if (truth) {
            had_cycle++;
            if (cycle_is_real(n, edges, cycle)) {
                cycles_real++;
            }
        } else if (cycle.empty()) {
            cycles_real++;
        }
    }

    std::cout << "over " << trials << " random directed graphs on up to 7 nodes:\\n";
    std::cout << "  the visited check agreed      " << std::setw(6) << visited_ok << "\\n";
    std::cout << "  the three-colour walk agreed  " << std::setw(6) << colour_ok << "\\n";
    std::cout << "  the cycle it returned was real" << std::setw(6) << cycles_real << "\\n";
    std::cout << "  graphs that had a cycle       " << std::setw(6) << had_cycle << "\\n";
    std::cout << "\\n";
    std::cout << "The visited check claimed a cycle on " << visited_over
              << " graphs that had none and missed\\n";
    std::cout << visited_under << ". It only ever over-reports, and the reason is the diamond in the first\\n";
    std::cout << "row: two routes from 0 to 3, no loop anywhere, and node 3 is reached\\n";
    std::cout << "twice. On an undirected graph a second route into a node really is a\\n";
    std::cout << "cycle. Following arrows it is not, and one boolean per node cannot tell\\n";
    std::cout << "the difference.\\n";
    std::cout << "\\n";
    std::cout << "Grey is the fix and it is exactly the difference between the two visited\\n";
    std::cout << "sets from the previous lesson: grey is the path-local set, black is the\\n";
    std::cout << "global one, and a directed cycle is an edge into a node that is still on\\n";
    std::cout << "the path. Keeping the path alongside the colours costs nothing and turns\\n";
    std::cout << "a yes-or-no into the cycle itself.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Cycle detection on a directed graph is a different algorithm, and the reason
// is the one fact the undirected version leans on: there, a node already
// visited means a second route into it, and a second route into a node closes a
// loop. Following arrows, it does not.
//
// A directed graph can have two routes from a to d that never form a cycle --
// the diamond a->b->d, a->c->d. A visited check calls that a cycle. What is
// needed is the distinction between "visited at some point" and "still open on
// the current path", which is the three-colour walk: white untouched, grey
// entered but not finished, black finished.
//
// Both are scored against the topological-order test from lesson three: a
// directed graph is acyclic exactly when repeatedly removing a node with
// nothing pointing at it empties the graph.

const WHITE: i32 = 0;
const GREY: i32 = 1;
const BLACK: i32 = 2;

fn build(n: usize, edges: &[(usize, usize)]) -> Vec<Vec<usize>> {
    let mut neighbours = vec![Vec::new(); n];
    for &(u, v) in edges {
        neighbours[u].push(v);
    }
    neighbours
}

/// The oracle. No topological order exists exactly when there is a cycle.
fn has_cycle_by_order(n: usize, edges: &[(usize, usize)]) -> bool {
    let mut incoming = vec![0usize; n];
    for &(_, v) in edges {
        incoming[v] += 1;
    }
    let neighbours = build(n, edges);
    let mut ready: Vec<usize> = Vec::new();
    for v in 0..n {
        if incoming[v] == 0 {
            ready.push(v);
        }
    }
    let mut head = 0;
    let mut removed = 0;
    while head < ready.len() {
        let v = ready[head];
        head += 1;
        removed += 1;
        for i in 0..neighbours[v].len() {
            let u = neighbours[v][i];
            incoming[u] -= 1;
            if incoming[u] == 0 {
                ready.push(u);
            }
        }
    }
    removed < n
}

fn walk_visited(neighbours: &[Vec<usize>], seen: &mut Vec<bool>, found: &mut bool, v: usize) {
    seen[v] = true;
    for i in 0..neighbours[v].len() {
        let u = neighbours[v][i];
        if seen[u] {
            *found = true;
        } else {
            walk_visited(neighbours, seen, found, u);
        }
    }
}

/// One flag per node. Cannot tell a second route from a loop.
fn has_cycle_by_visited(n: usize, edges: &[(usize, usize)]) -> bool {
    let neighbours = build(n, edges);
    let mut seen = vec![false; n];
    let mut found = false;
    for start in 0..n {
        if !seen[start] {
            walk_visited(&neighbours, &mut seen, &mut found, start);
        }
    }
    found
}

fn walk_colour(neighbours: &[Vec<usize>], colour: &mut Vec<i32>, found: &mut bool, v: usize) {
    colour[v] = GREY;
    for i in 0..neighbours[v].len() {
        let u = neighbours[v][i];
        if colour[u] == GREY {
            *found = true;
        } else if colour[u] == WHITE {
            walk_colour(neighbours, colour, found, u);
        }
    }
    colour[v] = BLACK;
}

/// White untouched, grey open on this path, black finished. Grey means a cycle.
fn has_cycle_by_colour(n: usize, edges: &[(usize, usize)]) -> bool {
    let neighbours = build(n, edges);
    let mut colour = vec![WHITE; n];
    let mut found = false;
    for start in 0..n {
        if colour[start] == WHITE {
            walk_colour(&neighbours, &mut colour, &mut found, start);
        }
    }
    found
}

fn walk_keeping_path(
    neighbours: &[Vec<usize>],
    colour: &mut Vec<i32>,
    path: &mut Vec<usize>,
    answer: &mut Vec<usize>,
    v: usize,
) {
    colour[v] = GREY;
    path.push(v);
    for i in 0..neighbours[v].len() {
        let u = neighbours[v][i];
        if !answer.is_empty() {
            break;
        }
        if colour[u] == GREY {
            let mut at = path.len() - 1;
            while path[at] != u {
                at -= 1;
            }
            for k in at..path.len() {
                answer.push(path[k]);
            }
            answer.push(u);
        } else if colour[u] == WHITE {
            walk_keeping_path(neighbours, colour, path, answer, u);
        }
    }
    path.pop();
    colour[v] = BLACK;
}

/// The same walk, keeping the path so the cycle itself can be printed.
fn cycle_through_colour(n: usize, edges: &[(usize, usize)]) -> Vec<usize> {
    let neighbours = build(n, edges);
    let mut colour = vec![WHITE; n];
    let mut path: Vec<usize> = Vec::new();
    let mut answer: Vec<usize> = Vec::new();
    for start in 0..n {
        if colour[start] == WHITE && answer.is_empty() {
            walk_keeping_path(&neighbours, &mut colour, &mut path, &mut answer, start);
        }
    }
    answer
}

/// Every consecutive pair must be an edge, and the ends must meet.
fn cycle_is_real(n: usize, edges: &[(usize, usize)], cycle: &[usize]) -> bool {
    if cycle.len() < 2 {
        return false;
    }
    if cycle[0] != cycle[cycle.len() - 1] {
        return false;
    }
    let neighbours = build(n, edges);
    for i in 0..cycle.len() - 1 {
        let mut joined = false;
        for &u in &neighbours[cycle[i]] {
            if u == cycle[i + 1] {
                joined = true;
            }
        }
        if !joined {
            return false;
        }
    }
    true
}

fn yes_no(flag: bool) -> &'static str {
    if flag { "yes" } else { "no" }
}

fn show(values: &[usize]) -> String {
    let parts: Vec<String> = values.iter().map(|v| v.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn show_edges(edges: &[(usize, usize)]) -> String {
    let parts: Vec<String> = edges.iter().map(|&(u, v)| format!("{}->{}", u, v)).collect();
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
    let sizes: Vec<usize> = vec![4, 4, 3, 5];
    let cases: Vec<Vec<(usize, usize)>> = vec![
        vec![(0, 1), (0, 2), (1, 3), (2, 3)],
        vec![(0, 1), (1, 2), (2, 3), (3, 1)],
        vec![(0, 1), (1, 2)],
        vec![(0, 1), (1, 2), (2, 0), (2, 3), (3, 4)],
    ];

    println!(
        "{}{}{}{}{}",
        pad_right("edges", 40),
        pad_left("truth", 7),
        pad_left("by visited", 12),
        pad_left("by colour", 11),
        pad_left("the cycle", 16)
    );
    for (c, edges) in cases.iter().enumerate() {
        let n = sizes[c];
        let cycle = cycle_through_colour(n, edges);
        let shown = if cycle.is_empty() {
            String::from("none")
        } else {
            show(&cycle)
        };
        println!(
            "{}{}{}{}{}",
            pad_right(&show_edges(edges), 40),
            pad_left(yes_no(has_cycle_by_order(n, edges)), 7),
            pad_left(yes_no(has_cycle_by_visited(n, edges)), 12),
            pad_left(yes_no(has_cycle_by_colour(n, edges)), 11),
            pad_left(&shown, 16)
        );
    }
    println!();

    let mut rng = Rng { seed: 1 };
    let trials = 3000;
    let mut visited_ok = 0;
    let mut visited_over = 0;
    let mut visited_under = 0;
    let mut colour_ok = 0;
    let mut cycles_real = 0;
    let mut had_cycle = 0;
    for _ in 0..trials {
        let n = (2 + rng.next(6)) as usize;
        let mut edges: Vec<(usize, usize)> = Vec::new();
        for u in 0..n {
            for v in 0..n {
                if u != v && rng.next(5) == 0 {
                    edges.push((u, v));
                }
            }
        }
        let truth = has_cycle_by_order(n, &edges);
        let guess = has_cycle_by_visited(n, &edges);
        if guess == truth {
            visited_ok += 1;
        }
        if guess && !truth {
            visited_over += 1;
        }
        if truth && !guess {
            visited_under += 1;
        }
        if has_cycle_by_colour(n, &edges) == truth {
            colour_ok += 1;
        }
        let cycle = cycle_through_colour(n, &edges);
        if truth {
            had_cycle += 1;
            if cycle_is_real(n, &edges, &cycle) {
                cycles_real += 1;
            }
        } else if cycle.is_empty() {
            cycles_real += 1;
        }
    }

    println!("over {} random directed graphs on up to 7 nodes:", trials);
    println!("  the visited check agreed      {}", pad_left(&visited_ok.to_string(), 6));
    println!("  the three-colour walk agreed  {}", pad_left(&colour_ok.to_string(), 6));
    println!("  the cycle it returned was real{}", pad_left(&cycles_real.to_string(), 6));
    println!("  graphs that had a cycle       {}", pad_left(&had_cycle.to_string(), 6));
    println!();
    println!(
        "The visited check claimed a cycle on {} graphs that had none and missed",
        visited_over
    );
    println!(
        "{}. It only ever over-reports, and the reason is the diamond in the first",
        visited_under
    );
    println!("row: two routes from 0 to 3, no loop anywhere, and node 3 is reached");
    println!("twice. On an undirected graph a second route into a node really is a");
    println!("cycle. Following arrows it is not, and one boolean per node cannot tell");
    println!("the difference.");
    println!();
    println!("Grey is the fix and it is exactly the difference between the two visited");
    println!("sets from the previous lesson: grey is the path-local set, black is the");
    println!("global one, and a directed cycle is an edge into a node that is still on");
    println!("the path. Keeping the path alongside the colours costs nothing and turns");
    println!("a yes-or-no into the cycle itself.");
}
`,
            },
            {
              lang: "go",
              code: `// Cycle detection on a directed graph is a different algorithm, and the reason
// is the one fact the undirected version leans on: there, a node already
// visited means a second route into it, and a second route into a node closes a
// loop. Following arrows, it does not.
//
// A directed graph can have two routes from a to d that never form a cycle --
// the diamond a->b->d, a->c->d. A visited check calls that a cycle. What is
// needed is the distinction between "visited at some point" and "still open on
// the current path", which is the three-colour walk: white untouched, grey
// entered but not finished, black finished.
//
// Both are scored against the topological-order test from lesson three: a
// directed graph is acyclic exactly when repeatedly removing a node with
// nothing pointing at it empties the graph.

package main

import (
	"fmt"
	"strings"
)

const white = 0
const grey = 1
const black = 2

type edge struct{ from, to int }

func build(n int, edges []edge) [][]int {
	neighbours := make([][]int, n)
	for i := range neighbours {
		neighbours[i] = []int{}
	}
	for _, e := range edges {
		neighbours[e.from] = append(neighbours[e.from], e.to)
	}
	return neighbours
}

// The oracle. No topological order exists exactly when there is a cycle.
func hasCycleByOrder(n int, edges []edge) bool {
	incoming := make([]int, n)
	for _, e := range edges {
		incoming[e.to]++
	}
	neighbours := build(n, edges)
	ready := []int{}
	for v := 0; v < n; v++ {
		if incoming[v] == 0 {
			ready = append(ready, v)
		}
	}
	head := 0
	removed := 0
	for head < len(ready) {
		v := ready[head]
		head++
		removed++
		for _, u := range neighbours[v] {
			incoming[u]--
			if incoming[u] == 0 {
				ready = append(ready, u)
			}
		}
	}
	return removed < n
}

// One flag per node. Cannot tell a second route from a loop.
func hasCycleByVisited(n int, edges []edge) bool {
	neighbours := build(n, edges)
	seen := make([]bool, n)
	found := false
	var walk func(v int)
	walk = func(v int) {
		seen[v] = true
		for _, u := range neighbours[v] {
			if seen[u] {
				found = true
			} else {
				walk(u)
			}
		}
	}
	for start := 0; start < n; start++ {
		if !seen[start] {
			walk(start)
		}
	}
	return found
}

// White untouched, grey open on this path, black finished. Grey means a cycle.
func hasCycleByColour(n int, edges []edge) bool {
	neighbours := build(n, edges)
	colour := make([]int, n)
	found := false
	var walk func(v int)
	walk = func(v int) {
		colour[v] = grey
		for _, u := range neighbours[v] {
			if colour[u] == grey {
				found = true
			} else if colour[u] == white {
				walk(u)
			}
		}
		colour[v] = black
	}
	for start := 0; start < n; start++ {
		if colour[start] == white {
			walk(start)
		}
	}
	return found
}

// The same walk, keeping the path so the cycle itself can be printed.
func cycleThroughColour(n int, edges []edge) []int {
	neighbours := build(n, edges)
	colour := make([]int, n)
	path := []int{}
	answer := []int{}
	var walk func(v int)
	walk = func(v int) {
		colour[v] = grey
		path = append(path, v)
		for _, u := range neighbours[v] {
			if len(answer) > 0 {
				break
			}
			if colour[u] == grey {
				at := len(path) - 1
				for path[at] != u {
					at--
				}
				answer = append(answer, path[at:]...)
				answer = append(answer, u)
			} else if colour[u] == white {
				walk(u)
			}
		}
		path = path[:len(path)-1]
		colour[v] = black
	}
	for start := 0; start < n; start++ {
		if colour[start] == white && len(answer) == 0 {
			walk(start)
		}
	}
	return answer
}

// Every consecutive pair must be an edge, and the ends must meet.
func cycleIsReal(n int, edges []edge, cycle []int) bool {
	if len(cycle) < 2 {
		return false
	}
	if cycle[0] != cycle[len(cycle)-1] {
		return false
	}
	neighbours := build(n, edges)
	for i := 0; i < len(cycle)-1; i++ {
		joined := false
		for _, u := range neighbours[cycle[i]] {
			if u == cycle[i+1] {
				joined = true
			}
		}
		if !joined {
			return false
		}
	}
	return true
}

func yesNo(flag bool) string {
	if flag {
		return "yes"
	}
	return "no"
}

func show(values []int) string {
	parts := make([]string, len(values))
	for i, v := range values {
		parts[i] = fmt.Sprintf("%d", v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func showEdges(edges []edge) string {
	parts := make([]string, len(edges))
	for i, e := range edges {
		parts[i] = fmt.Sprintf("%d->%d", e.from, e.to)
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
	sizes := []int{4, 4, 3, 5}
	cases := [][]edge{
		{{0, 1}, {0, 2}, {1, 3}, {2, 3}},
		{{0, 1}, {1, 2}, {2, 3}, {3, 1}},
		{{0, 1}, {1, 2}},
		{{0, 1}, {1, 2}, {2, 0}, {2, 3}, {3, 4}},
	}

	fmt.Printf("%-40s%7s%12s%11s%16s\\n", "edges", "truth", "by visited", "by colour", "the cycle")
	for c, edges := range cases {
		n := sizes[c]
		cycle := cycleThroughColour(n, edges)
		shown := "none"
		if len(cycle) > 0 {
			shown = show(cycle)
		}
		fmt.Printf("%-40s%7s%12s%11s%16s\\n", showEdges(edges),
			yesNo(hasCycleByOrder(n, edges)),
			yesNo(hasCycleByVisited(n, edges)),
			yesNo(hasCycleByColour(n, edges)), shown)
	}
	fmt.Println()

	trials := 3000
	visitedOk := 0
	visitedOver := 0
	visitedUnder := 0
	colourOk := 0
	cyclesReal := 0
	hadCycle := 0
	for t := 0; t < trials; t++ {
		n := 2 + rand(6)
		edges := []edge{}
		for u := 0; u < n; u++ {
			for v := 0; v < n; v++ {
				if u != v && rand(5) == 0 {
					edges = append(edges, edge{u, v})
				}
			}
		}
		truth := hasCycleByOrder(n, edges)
		guess := hasCycleByVisited(n, edges)
		if guess == truth {
			visitedOk++
		}
		if guess && !truth {
			visitedOver++
		}
		if truth && !guess {
			visitedUnder++
		}
		if hasCycleByColour(n, edges) == truth {
			colourOk++
		}
		cycle := cycleThroughColour(n, edges)
		if truth {
			hadCycle++
			if cycleIsReal(n, edges, cycle) {
				cyclesReal++
			}
		} else if len(cycle) == 0 {
			cyclesReal++
		}
	}

	fmt.Printf("over %d random directed graphs on up to 7 nodes:\\n", trials)
	fmt.Printf("  the visited check agreed      %6d\\n", visitedOk)
	fmt.Printf("  the three-colour walk agreed  %6d\\n", colourOk)
	fmt.Printf("  the cycle it returned was real%6d\\n", cyclesReal)
	fmt.Printf("  graphs that had a cycle       %6d\\n", hadCycle)
	fmt.Println()
	fmt.Printf("The visited check claimed a cycle on %d graphs that had none and missed\\n", visitedOver)
	fmt.Printf("%d. It only ever over-reports, and the reason is the diamond in the first\\n", visitedUnder)
	fmt.Println("row: two routes from 0 to 3, no loop anywhere, and node 3 is reached")
	fmt.Println("twice. On an undirected graph a second route into a node really is a")
	fmt.Println("cycle. Following arrows it is not, and one boolean per node cannot tell")
	fmt.Println("the difference.")
	fmt.Println()
	fmt.Println("Grey is the fix and it is exactly the difference between the two visited")
	fmt.Println("sets from the previous lesson: grey is the path-local set, black is the")
	fmt.Println("global one, and a directed cycle is an edge into a node that is still on")
	fmt.Println("the path. Keeping the path alongside the colours costs nothing and turns")
	fmt.Println("a yes-or-no into the cycle itself.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Using an undirected cycle check on a directed graph",
          body: "A second route into a node is a cycle when edges have no direction and is not when they do. The visited check claimed a cycle on 1,149 of 3,000 random directed graphs that had none, and missed none -- it is over-eager, not weak, and a diamond is enough to trigger it.",
        },
        {
          title: "Colouring only two ways",
          body: "Grey and black are different states: still open on this path, and finished. Collapsing them into one boolean is exactly the bug above. If the code has a single visited array and the graph is directed, cycle detection is wrong.",
        },
      ],
    },
    {
      id: "which-question-is-it",
      heading: "Which question is actually being asked",
      body: [
        "Cycle detection is rarely what is actually being asked. The real questions are \"can this be ordered\", \"is this configuration legal\", \"which change introduced the loop\" \u2014 and those cost very different amounts.",
        "**Is there a cycle?** One walk, `O(V + E)`. This is the topological-order question from lesson three, and the build system's answer to \"your dependencies are circular\".",
        "**Which edge closed it?** Add the edges in order and stop at the first one that makes the graph cyclic. That is a walk per edge, `O(E * (V + E))` in the worst case \u2014 still polynomial, and exactly what a tool does when it names the import you just added rather than shrugging at the whole graph.",
        "**How many cycles are there?** This one is different in kind, and the table in the example is the argument. On the complete directed graph the cycle count runs 1, 5, 20, 84, 409, 2365 as the nodes go from two to seven, while the edge count only reaches 42. Counting cycles is exponential in the nodes, and no cleverness in the traversal changes that.",
        "Which is the shape of this whole module, stated once: **asking whether a structure exists is usually linear; asking how many there are usually is not.** Reachability, components, shortest paths, cycle existence, topological order \u2014 all linear. Counting paths, counting cycles, the longest path \u2014 all exponential. The traversal is the same; what you ask of it is what sets the price.",
      ],
      examples: [
        {
          id: "existence-against-counting",
          title: "One walk, a walk per edge, and an exponential",
          lang: "python",
          code: `# Cycle detection is rarely the actual question. The actual questions are "can
# this be ordered", "is this configuration legal", "which change introduced the
# loop" -- and those have very different costs from each other.
#
# Three of them here, on the same directed graphs:
#
#   is there a cycle?        one walk.  O(V + E).
#   which edge closed it?    one walk per edge, worst case. O(E * (V + E)).
#   how many cycles are there? every subset of nodes. Exponential, and there is
#                            no known way around it.
#
# The first two are scored against the third, which is the definition.


def build(n, edges):
    neighbours = [[] for _ in range(n)]
    for u, v in edges:
        neighbours[u].append(v)
    return neighbours


def has_cycle(n, edges):
    """The three-colour walk, condensed. One pass."""
    neighbours = build(n, edges)
    colour = [0] * n
    found = [False]

    def walk(v):
        colour[v] = 1
        for u in neighbours[v]:
            if colour[u] == 1:
                found[0] = True
            elif colour[u] == 0:
                walk(u)
        colour[v] = 2

    for start in range(n):
        if colour[start] == 0:
            walk(start)
    return found[0]


def first_edge_that_closes(n, edges):
    """Add the edges in order and stop at the first one that makes a cycle."""
    so_far = []
    for i in range(len(edges)):
        so_far.append(edges[i])
        if has_cycle(n, so_far):
            return i
    return -1


def count_simple_cycles(n, edges):
    """Every cycle, counted once, by walking from each lowest node. The definition."""
    neighbours = build(n, edges)
    total = [0]
    on_path = [False] * n

    def walk(start, v):
        for u in neighbours[v]:
            if u == start:
                total[0] += 1
            elif u > start and not on_path[u]:
                on_path[u] = True
                walk(start, u)
                on_path[u] = False

    for start in range(n):
        on_path[start] = True
        walk(start, start)
        on_path[start] = False
    return total[0]


def yes_no(flag):
    return "yes" if flag else "no"


def show_edges(edges):
    return "[" + ", ".join(f"{u}->{v}" for u, v in edges) + "]"


def full_graph(n):
    """Every ordered pair. The number of cycles here grows faster than n factorial."""
    return [(u, v) for u in range(n) for v in range(n) if u != v]


CASES = [
    (4, [(0, 1), (1, 2), (2, 3), (3, 1)]),
    (4, [(0, 1), (0, 2), (1, 3), (2, 3)]),
    (3, [(0, 1), (1, 0), (1, 2), (2, 1)]),
    (4, [(0, 1), (1, 2), (2, 0), (0, 3), (3, 0)]),
]

print(f"{'edges':<44}{'any':>6}{'first closing edge':>20}{'cycles':>9}")
for n, edges in CASES:
    at = first_edge_that_closes(n, edges)
    named = show_edges([edges[at]]) if at >= 0 else "none"
    print(f"{show_edges(edges):<44}{yes_no(has_cycle(n, edges)):>6}"
          f"{named:>20}{count_simple_cycles(n, edges):>9}")
print()

print(f"{'nodes':<8}{'edges':>8}{'cycles':>12}")
for n in range(2, 8):
    edges = full_graph(n)
    print(f"{n:<8}{len(edges):>8}{count_simple_cycles(n, edges):>12}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
any_agreed = 0
closing_agreed = 0
total_cycles = 0
most_cycles = 0
for _ in range(TRIALS):
    n = 2 + rand(6)
    edges = []
    for u in range(n):
        for v in range(n):
            if u != v and rand(5) == 0:
                edges.append((u, v))
    count = count_simple_cycles(n, edges)
    if has_cycle(n, edges) == (count > 0):
        any_agreed += 1
    at = first_edge_that_closes(n, edges)
    if (at >= 0) == (count > 0):
        closing_agreed += 1
    total_cycles += count
    if count > most_cycles:
        most_cycles = count

print(f"over {TRIALS} random directed graphs on up to 7 nodes:")
print(f"  the one-pass check agreed with counting  {any_agreed:>6}")
print(f"  the first-closing-edge search agreed     {closing_agreed:>6}")
print(f"  cycles found in total                    {total_cycles:>6}")
print(f"  most in any single graph                 {most_cycles:>6}")
print()
print("The three questions look like variations of each other and are not. The")
print("first is one traversal. The second re-runs it once per edge, which is")
print("still polynomial and is exactly what a build system does when it tells")
print("you which new dependency created the loop. The third is the one to")
print("recognise and refuse: the table above is the complete graph, and the")
print("cycle count runs 1, 5, 20, 84, 409, 2365 while the edge count is only")
print("reaching 42. Counting cycles is exponential in the nodes, and no")
print("cleverness in the traversal changes that.")
print()
print("Which is the general shape of this module. Asking whether a structure")
print("exists is usually linear. Asking how many there are usually is not.")
`,
          output: `edges                                          any  first closing edge   cycles
[0->1, 1->2, 2->3, 3->1]                       yes              [3->1]        1
[0->1, 0->2, 1->3, 2->3]                        no                none        0
[0->1, 1->0, 1->2, 2->1]                       yes              [1->0]        2
[0->1, 1->2, 2->0, 0->3, 3->0]                 yes              [2->0]        2

nodes      edges      cycles
2              2           1
3              6           5
4             12          20
5             20          84
6             30         409
7             42        2365

over 3000 random directed graphs on up to 7 nodes:
  the one-pass check agreed with counting    3000
  the first-closing-edge search agreed       3000
  cycles found in total                      2058
  most in any single graph                     24

The three questions look like variations of each other and are not. The
first is one traversal. The second re-runs it once per edge, which is
still polynomial and is exactly what a build system does when it tells
you which new dependency created the loop. The third is the one to
recognise and refuse: the table above is the complete graph, and the
cycle count runs 1, 5, 20, 84, 409, 2365 while the edge count is only
reaching 42. Counting cycles is exponential in the nodes, and no
cleverness in the traversal changes that.

Which is the general shape of this module. Asking whether a structure
exists is usually linear. Asking how many there are usually is not.`,
          explanation:
            "Three questions about cycles on the same graphs: existence, which edge closed it, and how many there are. The complete-graph table is what an exponential answer looks like next to a linear one.",
          alternates: [
            {
              lang: "javascript",
              code: `// Cycle detection is rarely the actual question. The actual questions are "can
// this be ordered", "is this configuration legal", "which change introduced the
// loop" -- and those have very different costs from each other.
//
// Three of them here, on the same directed graphs:
//
//   is there a cycle?        one walk.  O(V + E).
//   which edge closed it?    one walk per edge, worst case. O(E * (V + E)).
//   how many cycles are there? every subset of nodes. Exponential, and there is
//                            no known way around it.
//
// The first two are scored against the third, which is the definition.

function build(n, edges) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) neighbours[u].push(v);
  return neighbours;
}

/** The three-colour walk, condensed. One pass. */
function hasCycle(n, edges) {
  const neighbours = build(n, edges);
  const colour = new Array(n).fill(0);
  let found = false;

  function walk(v) {
    colour[v] = 1;
    for (const u of neighbours[v]) {
      if (colour[u] === 1) found = true;
      else if (colour[u] === 0) walk(u);
    }
    colour[v] = 2;
  }

  for (let start = 0; start < n; start += 1) {
    if (colour[start] === 0) walk(start);
  }
  return found;
}

/** Add the edges in order and stop at the first one that makes a cycle. */
function firstEdgeThatCloses(n, edges) {
  const soFar = [];
  for (let i = 0; i < edges.length; i += 1) {
    soFar.push(edges[i]);
    if (hasCycle(n, soFar)) return i;
  }
  return -1;
}

/** Every cycle, counted once, by walking from each lowest node. The definition. */
function countSimpleCycles(n, edges) {
  const neighbours = build(n, edges);
  let total = 0;
  const onPath = new Array(n).fill(false);

  function walk(start, v) {
    for (const u of neighbours[v]) {
      if (u === start) {
        total += 1;
      } else if (u > start && !onPath[u]) {
        onPath[u] = true;
        walk(start, u);
        onPath[u] = false;
      }
    }
  }

  for (let start = 0; start < n; start += 1) {
    onPath[start] = true;
    walk(start, start);
    onPath[start] = false;
  }
  return total;
}

const yesNo = (flag) => (flag ? "yes" : "no");
const showEdges = (edges) =>
  "[" + edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ") + "]";
const padEnd = (v, w) => String(v).padEnd(w);
const pad = (v, w) => String(v).padStart(w);

/** Every ordered pair. The number of cycles here grows faster than n factorial. */
function fullGraph(n) {
  const edges = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v) edges.push([u, v]);
    }
  }
  return edges;
}

const CASES = [
  [4, [[0, 1], [1, 2], [2, 3], [3, 1]]],
  [4, [[0, 1], [0, 2], [1, 3], [2, 3]]],
  [3, [[0, 1], [1, 0], [1, 2], [2, 1]]],
  [4, [[0, 1], [1, 2], [2, 0], [0, 3], [3, 0]]],
];

console.log(padEnd("edges", 44) + pad("any", 6) + pad("first closing edge", 20) + pad("cycles", 9));
for (const [n, edges] of CASES) {
  const at = firstEdgeThatCloses(n, edges);
  const named = at >= 0 ? showEdges([edges[at]]) : "none";
  console.log(
    padEnd(showEdges(edges), 44) +
      pad(yesNo(hasCycle(n, edges)), 6) +
      pad(named, 20) +
      pad(countSimpleCycles(n, edges), 9)
  );
}
console.log();

console.log(padEnd("nodes", 8) + pad("edges", 8) + pad("cycles", 12));
for (let n = 2; n < 8; n += 1) {
  const edges = fullGraph(n);
  console.log(padEnd(n, 8) + pad(edges.length, 8) + pad(countSimpleCycles(n, edges), 12));
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
let anyAgreed = 0;
let closingAgreed = 0;
let totalCycles = 0;
let mostCycles = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v && rand(5) === 0) edges.push([u, v]);
    }
  }
  const count = countSimpleCycles(n, edges);
  if (hasCycle(n, edges) === count > 0) anyAgreed += 1;
  const at = firstEdgeThatCloses(n, edges);
  if (at >= 0 === count > 0) closingAgreed += 1;
  totalCycles += count;
  if (count > mostCycles) mostCycles = count;
}

console.log(\`over \${TRIALS} random directed graphs on up to 7 nodes:\`);
console.log(\`  the one-pass check agreed with counting  \${pad(anyAgreed, 6)}\`);
console.log(\`  the first-closing-edge search agreed     \${pad(closingAgreed, 6)}\`);
console.log(\`  cycles found in total                    \${pad(totalCycles, 6)}\`);
console.log(\`  most in any single graph                 \${pad(mostCycles, 6)}\`);
console.log();
console.log("The three questions look like variations of each other and are not. The");
console.log("first is one traversal. The second re-runs it once per edge, which is");
console.log("still polynomial and is exactly what a build system does when it tells");
console.log("you which new dependency created the loop. The third is the one to");
console.log("recognise and refuse: the table above is the complete graph, and the");
console.log("cycle count runs 1, 5, 20, 84, 409, 2365 while the edge count is only");
console.log("reaching 42. Counting cycles is exponential in the nodes, and no");
console.log("cleverness in the traversal changes that.");
console.log();
console.log("Which is the general shape of this module. Asking whether a structure");
console.log("exists is usually linear. Asking how many there are usually is not.");
`,
            },
            {
              lang: "typescript",
              code: `// Cycle detection is rarely the actual question. The actual questions are "can
// this be ordered", "is this configuration legal", "which change introduced the
// loop" -- and those have very different costs from each other.
//
// Three of them here, on the same directed graphs:
//
//   is there a cycle?        one walk.  O(V + E).
//   which edge closed it?    one walk per edge, worst case. O(E * (V + E)).
//   how many cycles are there? every subset of nodes. Exponential, and there is
//                            no known way around it.
//
// The first two are scored against the third, which is the definition.

type Edge = [number, number];

function build(n: number, edges: Edge[]): number[][] {
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) neighbours[u].push(v);
  return neighbours;
}

/** The three-colour walk, condensed. One pass. */
function hasCycle(n: number, edges: Edge[]): boolean {
  const neighbours = build(n, edges);
  const colour = new Array(n).fill(0);
  let found = false;

  function walk(v: number): void {
    colour[v] = 1;
    for (const u of neighbours[v]) {
      if (colour[u] === 1) found = true;
      else if (colour[u] === 0) walk(u);
    }
    colour[v] = 2;
  }

  for (let start = 0; start < n; start += 1) {
    if (colour[start] === 0) walk(start);
  }
  return found;
}

/** Add the edges in order and stop at the first one that makes a cycle. */
function firstEdgeThatCloses(n: number, edges: Edge[]): number {
  const soFar: Edge[] = [];
  for (let i = 0; i < edges.length; i += 1) {
    soFar.push(edges[i]);
    if (hasCycle(n, soFar)) return i;
  }
  return -1;
}

/** Every cycle, counted once, by walking from each lowest node. The definition. */
function countSimpleCycles(n: number, edges: Edge[]): number {
  const neighbours = build(n, edges);
  let total = 0;
  const onPath = new Array(n).fill(false);

  function walk(start: number, v: number): void {
    for (const u of neighbours[v]) {
      if (u === start) {
        total += 1;
      } else if (u > start && !onPath[u]) {
        onPath[u] = true;
        walk(start, u);
        onPath[u] = false;
      }
    }
  }

  for (let start = 0; start < n; start += 1) {
    onPath[start] = true;
    walk(start, start);
    onPath[start] = false;
  }
  return total;
}

const yesNo = (flag: boolean): string => (flag ? "yes" : "no");
const showEdges = (edges: Edge[]): string =>
  "[" + edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ") + "]";
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const pad = (v: string | number, w: number): string => String(v).padStart(w);

/** Every ordered pair. The number of cycles here grows faster than n factorial. */
function fullGraph(n: number): Edge[] {
  const edges: Edge[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v) edges.push([u, v]);
    }
  }
  return edges;
}

const CASES: [number, Edge[]][] = [
  [4, [[0, 1], [1, 2], [2, 3], [3, 1]]],
  [4, [[0, 1], [0, 2], [1, 3], [2, 3]]],
  [3, [[0, 1], [1, 0], [1, 2], [2, 1]]],
  [4, [[0, 1], [1, 2], [2, 0], [0, 3], [3, 0]]],
];

console.log(padEnd("edges", 44) + pad("any", 6) + pad("first closing edge", 20) + pad("cycles", 9));
for (const [n, edges] of CASES) {
  const at = firstEdgeThatCloses(n, edges);
  const named = at >= 0 ? showEdges([edges[at]]) : "none";
  console.log(
    padEnd(showEdges(edges), 44) +
      pad(yesNo(hasCycle(n, edges)), 6) +
      pad(named, 20) +
      pad(countSimpleCycles(n, edges), 9)
  );
}
console.log();

console.log(padEnd("nodes", 8) + pad("edges", 8) + pad("cycles", 12));
for (let n = 2; n < 8; n += 1) {
  const edges = fullGraph(n);
  console.log(padEnd(n, 8) + pad(edges.length, 8) + pad(countSimpleCycles(n, edges), 12));
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
let anyAgreed = 0;
let closingAgreed = 0;
let totalCycles = 0;
let mostCycles = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges: Edge[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v && rand(5) === 0) edges.push([u, v]);
    }
  }
  const count = countSimpleCycles(n, edges);
  if (hasCycle(n, edges) === count > 0) anyAgreed += 1;
  const at = firstEdgeThatCloses(n, edges);
  if (at >= 0 === count > 0) closingAgreed += 1;
  totalCycles += count;
  if (count > mostCycles) mostCycles = count;
}

console.log(\`over \${TRIALS} random directed graphs on up to 7 nodes:\`);
console.log(\`  the one-pass check agreed with counting  \${pad(anyAgreed, 6)}\`);
console.log(\`  the first-closing-edge search agreed     \${pad(closingAgreed, 6)}\`);
console.log(\`  cycles found in total                    \${pad(totalCycles, 6)}\`);
console.log(\`  most in any single graph                 \${pad(mostCycles, 6)}\`);
console.log();
console.log("The three questions look like variations of each other and are not. The");
console.log("first is one traversal. The second re-runs it once per edge, which is");
console.log("still polynomial and is exactly what a build system does when it tells");
console.log("you which new dependency created the loop. The third is the one to");
console.log("recognise and refuse: the table above is the complete graph, and the");
console.log("cycle count runs 1, 5, 20, 84, 409, 2365 while the edge count is only");
console.log("reaching 42. Counting cycles is exponential in the nodes, and no");
console.log("cleverness in the traversal changes that.");
console.log();
console.log("Which is the general shape of this module. Asking whether a structure");
console.log("exists is usually linear. Asking how many there are usually is not.");
`,
            },
            {
              lang: "java",
              code: `// Cycle detection is rarely the actual question. The actual questions are "can
// this be ordered", "is this configuration legal", "which change introduced the
// loop" -- and those have very different costs from each other.
//
// Three of them here, on the same directed graphs:
//
//   is there a cycle?        one walk.  O(V + E).
//   which edge closed it?    one walk per edge, worst case. O(E * (V + E)).
//   how many cycles are there? every subset of nodes. Exponential, and there is
//                            no known way around it.
//
// The first two are scored against the third, which is the definition.

import java.util.ArrayList;
import java.util.List;

public class Main {

    static List<List<Integer>> build(int n, int[][] edges) {
        List<List<Integer>> neighbours = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            neighbours.add(new ArrayList<>());
        }
        for (int[] e : edges) {
            neighbours.get(e[0]).add(e[1]);
        }
        return neighbours;
    }

    static boolean found;
    static int[] colour;

    static void walkColour(List<List<Integer>> neighbours, int v) {
        colour[v] = 1;
        for (int u : neighbours.get(v)) {
            if (colour[u] == 1) {
                found = true;
            } else if (colour[u] == 0) {
                walkColour(neighbours, u);
            }
        }
        colour[v] = 2;
    }

    /** The three-colour walk, condensed. One pass. */
    static boolean hasCycle(int n, int[][] edges) {
        List<List<Integer>> neighbours = build(n, edges);
        colour = new int[n];
        found = false;
        for (int start = 0; start < n; start++) {
            if (colour[start] == 0) {
                walkColour(neighbours, start);
            }
        }
        return found;
    }

    /** Add the edges in order and stop at the first one that makes a cycle. */
    static int firstEdgeThatCloses(int n, int[][] edges) {
        for (int i = 0; i < edges.length; i++) {
            int[][] soFar = new int[i + 1][];
            for (int k = 0; k <= i; k++) {
                soFar[k] = edges[k];
            }
            if (hasCycle(n, soFar)) {
                return i;
            }
        }
        return -1;
    }

    static long cycleTotal;
    static boolean[] onPath;

    static void walkCycles(List<List<Integer>> neighbours, int start, int v) {
        for (int u : neighbours.get(v)) {
            if (u == start) {
                cycleTotal++;
            } else if (u > start && !onPath[u]) {
                onPath[u] = true;
                walkCycles(neighbours, start, u);
                onPath[u] = false;
            }
        }
    }

    /** Every cycle, counted once, by walking from each lowest node. The definition. */
    static long countSimpleCycles(int n, int[][] edges) {
        List<List<Integer>> neighbours = build(n, edges);
        cycleTotal = 0;
        onPath = new boolean[n];
        for (int start = 0; start < n; start++) {
            onPath[start] = true;
            walkCycles(neighbours, start, start);
            onPath[start] = false;
        }
        return cycleTotal;
    }

    static String yesNo(boolean flag) {
        return flag ? "yes" : "no";
    }

    static String showEdges(int[][] edges) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < edges.length; i++) {
            if (i > 0) {
                sb.append(", ");
            }
            sb.append(edges[i][0]).append("->").append(edges[i][1]);
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

    /** Every ordered pair. The number of cycles here grows faster than n factorial. */
    static int[][] fullGraph(int n) {
        List<int[]> edges = new ArrayList<>();
        for (int u = 0; u < n; u++) {
            for (int v = 0; v < n; v++) {
                if (u != v) {
                    edges.add(new int[] {u, v});
                }
            }
        }
        return edges.toArray(new int[0][]);
    }

    // The same linear congruential generator in every language, so the random
    // graphs below are the same graphs whichever translation is run.
    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        int[] sizes = {4, 4, 3, 4};
        int[][][] cases = {
            {{0, 1}, {1, 2}, {2, 3}, {3, 1}},
            {{0, 1}, {0, 2}, {1, 3}, {2, 3}},
            {{0, 1}, {1, 0}, {1, 2}, {2, 1}},
            {{0, 1}, {1, 2}, {2, 0}, {0, 3}, {3, 0}},
        };

        System.out.println(padEnd("edges", 44) + pad("any", 6)
                + pad("first closing edge", 20) + pad("cycles", 9));
        for (int c = 0; c < sizes.length; c++) {
            int n = sizes[c];
            int at = firstEdgeThatCloses(n, cases[c]);
            String named = "none";
            if (at >= 0) {
                named = showEdges(new int[][] {cases[c][at]});
            }
            System.out.println(padEnd(showEdges(cases[c]), 44)
                    + pad(yesNo(hasCycle(n, cases[c])), 6) + pad(named, 20)
                    + pad(String.valueOf(countSimpleCycles(n, cases[c])), 9));
        }
        System.out.println();

        System.out.println(padEnd("nodes", 8) + pad("edges", 8) + pad("cycles", 12));
        for (int n = 2; n < 8; n++) {
            int[][] edges = fullGraph(n);
            System.out.println(padEnd(String.valueOf(n), 8) + pad(String.valueOf(edges.length), 8)
                    + pad(String.valueOf(countSimpleCycles(n, edges)), 12));
        }
        System.out.println();

        int trials = 3000;
        int anyAgreed = 0;
        int closingAgreed = 0;
        long totalCycles = 0;
        long mostCycles = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(6);
            List<int[]> collected = new ArrayList<>();
            for (int u = 0; u < n; u++) {
                for (int v = 0; v < n; v++) {
                    if (u != v && rand(5) == 0) {
                        collected.add(new int[] {u, v});
                    }
                }
            }
            int[][] edges = collected.toArray(new int[0][]);
            long count = countSimpleCycles(n, edges);
            if (hasCycle(n, edges) == (count > 0)) {
                anyAgreed++;
            }
            int at = firstEdgeThatCloses(n, edges);
            if ((at >= 0) == (count > 0)) {
                closingAgreed++;
            }
            totalCycles += count;
            if (count > mostCycles) {
                mostCycles = count;
            }
        }

        System.out.println("over " + trials + " random directed graphs on up to 7 nodes:");
        System.out.println("  the one-pass check agreed with counting  " + pad(String.valueOf(anyAgreed), 6));
        System.out.println("  the first-closing-edge search agreed     " + pad(String.valueOf(closingAgreed), 6));
        System.out.println("  cycles found in total                    " + pad(String.valueOf(totalCycles), 6));
        System.out.println("  most in any single graph                 " + pad(String.valueOf(mostCycles), 6));
        System.out.println();
        System.out.println("The three questions look like variations of each other and are not. The");
        System.out.println("first is one traversal. The second re-runs it once per edge, which is");
        System.out.println("still polynomial and is exactly what a build system does when it tells");
        System.out.println("you which new dependency created the loop. The third is the one to");
        System.out.println("recognise and refuse: the table above is the complete graph, and the");
        System.out.println("cycle count runs 1, 5, 20, 84, 409, 2365 while the edge count is only");
        System.out.println("reaching 42. Counting cycles is exponential in the nodes, and no");
        System.out.println("cleverness in the traversal changes that.");
        System.out.println();
        System.out.println("Which is the general shape of this module. Asking whether a structure");
        System.out.println("exists is usually linear. Asking how many there are usually is not.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Cycle detection is rarely the actual question. The actual questions are "can
// this be ordered", "is this configuration legal", "which change introduced the
// loop" -- and those have very different costs from each other.
//
// Three of them here, on the same directed graphs:
//
//   is there a cycle?        one walk.  O(V + E).
//   which edge closed it?    one walk per edge, worst case. O(E * (V + E)).
//   how many cycles are there? every subset of nodes. Exponential, and there is
//                            no known way around it.
//
// The first two are scored against the third, which is the definition.

#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

using Edge = std::pair<int, int>;

std::vector<std::vector<int>> build(int n, const std::vector<Edge>& edges) {
    std::vector<std::vector<int>> neighbours(n);
    for (const Edge& e : edges) {
        neighbours[e.first].push_back(e.second);
    }
    return neighbours;
}

void walk_colour(const std::vector<std::vector<int>>& neighbours, std::vector<int>& colour,
                 bool& found, int v) {
    colour[v] = 1;
    for (int u : neighbours[v]) {
        if (colour[u] == 1) {
            found = true;
        } else if (colour[u] == 0) {
            walk_colour(neighbours, colour, found, u);
        }
    }
    colour[v] = 2;
}

// The three-colour walk, condensed. One pass.
bool has_cycle(int n, const std::vector<Edge>& edges) {
    std::vector<std::vector<int>> neighbours = build(n, edges);
    std::vector<int> colour(n, 0);
    bool found = false;
    for (int start = 0; start < n; start++) {
        if (colour[start] == 0) {
            walk_colour(neighbours, colour, found, start);
        }
    }
    return found;
}

// Add the edges in order and stop at the first one that makes a cycle.
int first_edge_that_closes(int n, const std::vector<Edge>& edges) {
    std::vector<Edge> so_far;
    for (size_t i = 0; i < edges.size(); i++) {
        so_far.push_back(edges[i]);
        if (has_cycle(n, so_far)) {
            return static_cast<int>(i);
        }
    }
    return -1;
}

void walk_cycles(const std::vector<std::vector<int>>& neighbours, std::vector<char>& on_path,
                 long long& total, int start, int v) {
    for (int u : neighbours[v]) {
        if (u == start) {
            total++;
        } else if (u > start && !on_path[u]) {
            on_path[u] = 1;
            walk_cycles(neighbours, on_path, total, start, u);
            on_path[u] = 0;
        }
    }
}

// Every cycle, counted once, by walking from each lowest node. The definition.
long long count_simple_cycles(int n, const std::vector<Edge>& edges) {
    std::vector<std::vector<int>> neighbours = build(n, edges);
    long long total = 0;
    std::vector<char> on_path(n, 0);
    for (int start = 0; start < n; start++) {
        on_path[start] = 1;
        walk_cycles(neighbours, on_path, total, start, start);
        on_path[start] = 0;
    }
    return total;
}

std::string yes_no(bool flag) {
    return flag ? "yes" : "no";
}

std::string show_edges(const std::vector<Edge>& edges) {
    std::string out = "[";
    for (size_t i = 0; i < edges.size(); i++) {
        if (i > 0) {
            out += ", ";
        }
        out += std::to_string(edges[i].first) + "->" + std::to_string(edges[i].second);
    }
    return out + "]";
}

// Every ordered pair. The number of cycles here grows faster than n factorial.
std::vector<Edge> full_graph(int n) {
    std::vector<Edge> edges;
    for (int u = 0; u < n; u++) {
        for (int v = 0; v < n; v++) {
            if (u != v) {
                edges.push_back(Edge(u, v));
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
    std::vector<int> sizes = {4, 4, 3, 4};
    std::vector<std::vector<Edge>> cases = {
        {{0, 1}, {1, 2}, {2, 3}, {3, 1}},
        {{0, 1}, {0, 2}, {1, 3}, {2, 3}},
        {{0, 1}, {1, 0}, {1, 2}, {2, 1}},
        {{0, 1}, {1, 2}, {2, 0}, {0, 3}, {3, 0}},
    };

    std::cout << std::left << std::setw(44) << "edges" << std::right << std::setw(6) << "any"
              << std::setw(20) << "first closing edge" << std::setw(9) << "cycles" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        int n = sizes[c];
        int at = first_edge_that_closes(n, cases[c]);
        std::string named = "none";
        if (at >= 0) {
            std::vector<Edge> one;
            one.push_back(cases[c][at]);
            named = show_edges(one);
        }
        std::cout << std::left << std::setw(44) << show_edges(cases[c]) << std::right
                  << std::setw(6) << yes_no(has_cycle(n, cases[c])) << std::setw(20) << named
                  << std::setw(9) << count_simple_cycles(n, cases[c]) << "\\n";
    }
    std::cout << "\\n";

    std::cout << std::left << std::setw(8) << "nodes" << std::right << std::setw(8) << "edges"
              << std::setw(12) << "cycles" << "\\n";
    for (int n = 2; n < 8; n++) {
        std::vector<Edge> edges = full_graph(n);
        std::cout << std::left << std::setw(8) << n << std::right << std::setw(8) << edges.size()
                  << std::setw(12) << count_simple_cycles(n, edges) << "\\n";
    }
    std::cout << "\\n";

    int trials = 3000;
    int any_agreed = 0;
    int closing_agreed = 0;
    long long total_cycles = 0;
    long long most_cycles = 0;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(6);
        std::vector<Edge> edges;
        for (int u = 0; u < n; u++) {
            for (int v = 0; v < n; v++) {
                if (u != v && rand_below(5) == 0) {
                    edges.push_back(Edge(u, v));
                }
            }
        }
        long long count = count_simple_cycles(n, edges);
        if (has_cycle(n, edges) == (count > 0)) {
            any_agreed++;
        }
        int at = first_edge_that_closes(n, edges);
        if ((at >= 0) == (count > 0)) {
            closing_agreed++;
        }
        total_cycles += count;
        if (count > most_cycles) {
            most_cycles = count;
        }
    }

    std::cout << "over " << trials << " random directed graphs on up to 7 nodes:\\n";
    std::cout << "  the one-pass check agreed with counting  " << std::setw(6) << any_agreed << "\\n";
    std::cout << "  the first-closing-edge search agreed     " << std::setw(6) << closing_agreed << "\\n";
    std::cout << "  cycles found in total                    " << std::setw(6) << total_cycles << "\\n";
    std::cout << "  most in any single graph                 " << std::setw(6) << most_cycles << "\\n";
    std::cout << "\\n";
    std::cout << "The three questions look like variations of each other and are not. The\\n";
    std::cout << "first is one traversal. The second re-runs it once per edge, which is\\n";
    std::cout << "still polynomial and is exactly what a build system does when it tells\\n";
    std::cout << "you which new dependency created the loop. The third is the one to\\n";
    std::cout << "recognise and refuse: the table above is the complete graph, and the\\n";
    std::cout << "cycle count runs 1, 5, 20, 84, 409, 2365 while the edge count is only\\n";
    std::cout << "reaching 42. Counting cycles is exponential in the nodes, and no\\n";
    std::cout << "cleverness in the traversal changes that.\\n";
    std::cout << "\\n";
    std::cout << "Which is the general shape of this module. Asking whether a structure\\n";
    std::cout << "exists is usually linear. Asking how many there are usually is not.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Cycle detection is rarely the actual question. The actual questions are "can
// this be ordered", "is this configuration legal", "which change introduced the
// loop" -- and those have very different costs from each other.
//
// Three of them here, on the same directed graphs:
//
//   is there a cycle?        one walk.  O(V + E).
//   which edge closed it?    one walk per edge, worst case. O(E * (V + E)).
//   how many cycles are there? every subset of nodes. Exponential, and there is
//                            no known way around it.
//
// The first two are scored against the third, which is the definition.

fn build(n: usize, edges: &[(usize, usize)]) -> Vec<Vec<usize>> {
    let mut neighbours = vec![Vec::new(); n];
    for &(u, v) in edges {
        neighbours[u].push(v);
    }
    neighbours
}

fn walk_colour(neighbours: &[Vec<usize>], colour: &mut Vec<i32>, found: &mut bool, v: usize) {
    colour[v] = 1;
    for i in 0..neighbours[v].len() {
        let u = neighbours[v][i];
        if colour[u] == 1 {
            *found = true;
        } else if colour[u] == 0 {
            walk_colour(neighbours, colour, found, u);
        }
    }
    colour[v] = 2;
}

/// The three-colour walk, condensed. One pass.
fn has_cycle(n: usize, edges: &[(usize, usize)]) -> bool {
    let neighbours = build(n, edges);
    let mut colour = vec![0i32; n];
    let mut found = false;
    for start in 0..n {
        if colour[start] == 0 {
            walk_colour(&neighbours, &mut colour, &mut found, start);
        }
    }
    found
}

/// Add the edges in order and stop at the first one that makes a cycle.
fn first_edge_that_closes(n: usize, edges: &[(usize, usize)]) -> i32 {
    let mut so_far: Vec<(usize, usize)> = Vec::new();
    for i in 0..edges.len() {
        so_far.push(edges[i]);
        if has_cycle(n, &so_far) {
            return i as i32;
        }
    }
    -1
}

fn walk_cycles(
    neighbours: &[Vec<usize>],
    on_path: &mut Vec<bool>,
    total: &mut i64,
    start: usize,
    v: usize,
) {
    for i in 0..neighbours[v].len() {
        let u = neighbours[v][i];
        if u == start {
            *total += 1;
        } else if u > start && !on_path[u] {
            on_path[u] = true;
            walk_cycles(neighbours, on_path, total, start, u);
            on_path[u] = false;
        }
    }
}

/// Every cycle, counted once, by walking from each lowest node. The definition.
fn count_simple_cycles(n: usize, edges: &[(usize, usize)]) -> i64 {
    let neighbours = build(n, edges);
    let mut total = 0i64;
    let mut on_path = vec![false; n];
    for start in 0..n {
        on_path[start] = true;
        walk_cycles(&neighbours, &mut on_path, &mut total, start, start);
        on_path[start] = false;
    }
    total
}

fn yes_no(flag: bool) -> &'static str {
    if flag { "yes" } else { "no" }
}

fn show_edges(edges: &[(usize, usize)]) -> String {
    let parts: Vec<String> = edges.iter().map(|&(u, v)| format!("{}->{}", u, v)).collect();
    format!("[{}]", parts.join(", "))
}

/// Every ordered pair. The number of cycles here grows faster than n factorial.
fn full_graph(n: usize) -> Vec<(usize, usize)> {
    let mut edges = Vec::new();
    for u in 0..n {
        for v in 0..n {
            if u != v {
                edges.push((u, v));
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
    let sizes: Vec<usize> = vec![4, 4, 3, 4];
    let cases: Vec<Vec<(usize, usize)>> = vec![
        vec![(0, 1), (1, 2), (2, 3), (3, 1)],
        vec![(0, 1), (0, 2), (1, 3), (2, 3)],
        vec![(0, 1), (1, 0), (1, 2), (2, 1)],
        vec![(0, 1), (1, 2), (2, 0), (0, 3), (3, 0)],
    ];

    println!(
        "{}{}{}{}",
        pad_right("edges", 44),
        pad_left("any", 6),
        pad_left("first closing edge", 20),
        pad_left("cycles", 9)
    );
    for (c, edges) in cases.iter().enumerate() {
        let n = sizes[c];
        let at = first_edge_that_closes(n, edges);
        let named = if at >= 0 {
            show_edges(&[edges[at as usize]])
        } else {
            String::from("none")
        };
        println!(
            "{}{}{}{}",
            pad_right(&show_edges(edges), 44),
            pad_left(yes_no(has_cycle(n, edges)), 6),
            pad_left(&named, 20),
            pad_left(&count_simple_cycles(n, edges).to_string(), 9)
        );
    }
    println!();

    println!(
        "{}{}{}",
        pad_right("nodes", 8),
        pad_left("edges", 8),
        pad_left("cycles", 12)
    );
    for n in 2..8usize {
        let edges = full_graph(n);
        println!(
            "{}{}{}",
            pad_right(&n.to_string(), 8),
            pad_left(&edges.len().to_string(), 8),
            pad_left(&count_simple_cycles(n, &edges).to_string(), 12)
        );
    }
    println!();

    let mut rng = Rng { seed: 1 };
    let trials = 3000;
    let mut any_agreed = 0;
    let mut closing_agreed = 0;
    let mut total_cycles = 0i64;
    let mut most_cycles = 0i64;
    for _ in 0..trials {
        let n = (2 + rng.next(6)) as usize;
        let mut edges: Vec<(usize, usize)> = Vec::new();
        for u in 0..n {
            for v in 0..n {
                if u != v && rng.next(5) == 0 {
                    edges.push((u, v));
                }
            }
        }
        let count = count_simple_cycles(n, &edges);
        if has_cycle(n, &edges) == (count > 0) {
            any_agreed += 1;
        }
        let at = first_edge_that_closes(n, &edges);
        if (at >= 0) == (count > 0) {
            closing_agreed += 1;
        }
        total_cycles += count;
        if count > most_cycles {
            most_cycles = count;
        }
    }

    println!("over {} random directed graphs on up to 7 nodes:", trials);
    println!("  the one-pass check agreed with counting  {}", pad_left(&any_agreed.to_string(), 6));
    println!("  the first-closing-edge search agreed     {}", pad_left(&closing_agreed.to_string(), 6));
    println!("  cycles found in total                    {}", pad_left(&total_cycles.to_string(), 6));
    println!("  most in any single graph                 {}", pad_left(&most_cycles.to_string(), 6));
    println!();
    println!("The three questions look like variations of each other and are not. The");
    println!("first is one traversal. The second re-runs it once per edge, which is");
    println!("still polynomial and is exactly what a build system does when it tells");
    println!("you which new dependency created the loop. The third is the one to");
    println!("recognise and refuse: the table above is the complete graph, and the");
    println!("cycle count runs 1, 5, 20, 84, 409, 2365 while the edge count is only");
    println!("reaching 42. Counting cycles is exponential in the nodes, and no");
    println!("cleverness in the traversal changes that.");
    println!();
    println!("Which is the general shape of this module. Asking whether a structure");
    println!("exists is usually linear. Asking how many there are usually is not.");
}
`,
            },
            {
              lang: "go",
              code: `// Cycle detection is rarely the actual question. The actual questions are "can
// this be ordered", "is this configuration legal", "which change introduced the
// loop" -- and those have very different costs from each other.
//
// Three of them here, on the same directed graphs:
//
//   is there a cycle?        one walk.  O(V + E).
//   which edge closed it?    one walk per edge, worst case. O(E * (V + E)).
//   how many cycles are there? every subset of nodes. Exponential, and there is
//                            no known way around it.
//
// The first two are scored against the third, which is the definition.

package main

import (
	"fmt"
	"strings"
)

type edge struct{ from, to int }

func build(n int, edges []edge) [][]int {
	neighbours := make([][]int, n)
	for i := range neighbours {
		neighbours[i] = []int{}
	}
	for _, e := range edges {
		neighbours[e.from] = append(neighbours[e.from], e.to)
	}
	return neighbours
}

// The three-colour walk, condensed. One pass.
func hasCycle(n int, edges []edge) bool {
	neighbours := build(n, edges)
	colour := make([]int, n)
	found := false
	var walk func(v int)
	walk = func(v int) {
		colour[v] = 1
		for _, u := range neighbours[v] {
			if colour[u] == 1 {
				found = true
			} else if colour[u] == 0 {
				walk(u)
			}
		}
		colour[v] = 2
	}
	for start := 0; start < n; start++ {
		if colour[start] == 0 {
			walk(start)
		}
	}
	return found
}

// Add the edges in order and stop at the first one that makes a cycle.
func firstEdgeThatCloses(n int, edges []edge) int {
	soFar := []edge{}
	for i := range edges {
		soFar = append(soFar, edges[i])
		if hasCycle(n, soFar) {
			return i
		}
	}
	return -1
}

// Every cycle, counted once, by walking from each lowest node. The definition.
func countSimpleCycles(n int, edges []edge) int64 {
	neighbours := build(n, edges)
	var total int64
	onPath := make([]bool, n)
	var walk func(start, v int)
	walk = func(start, v int) {
		for _, u := range neighbours[v] {
			if u == start {
				total++
			} else if u > start && !onPath[u] {
				onPath[u] = true
				walk(start, u)
				onPath[u] = false
			}
		}
	}
	for start := 0; start < n; start++ {
		onPath[start] = true
		walk(start, start)
		onPath[start] = false
	}
	return total
}

func yesNo(flag bool) string {
	if flag {
		return "yes"
	}
	return "no"
}

func showEdges(edges []edge) string {
	parts := make([]string, len(edges))
	for i, e := range edges {
		parts[i] = fmt.Sprintf("%d->%d", e.from, e.to)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

// Every ordered pair. The number of cycles here grows faster than n factorial.
func fullGraph(n int) []edge {
	edges := []edge{}
	for u := 0; u < n; u++ {
		for v := 0; v < n; v++ {
			if u != v {
				edges = append(edges, edge{u, v})
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
	sizes := []int{4, 4, 3, 4}
	cases := [][]edge{
		{{0, 1}, {1, 2}, {2, 3}, {3, 1}},
		{{0, 1}, {0, 2}, {1, 3}, {2, 3}},
		{{0, 1}, {1, 0}, {1, 2}, {2, 1}},
		{{0, 1}, {1, 2}, {2, 0}, {0, 3}, {3, 0}},
	}

	fmt.Printf("%-44s%6s%20s%9s\\n", "edges", "any", "first closing edge", "cycles")
	for c, edges := range cases {
		n := sizes[c]
		at := firstEdgeThatCloses(n, edges)
		named := "none"
		if at >= 0 {
			named = showEdges([]edge{edges[at]})
		}
		fmt.Printf("%-44s%6s%20s%9d\\n", showEdges(edges), yesNo(hasCycle(n, edges)),
			named, countSimpleCycles(n, edges))
	}
	fmt.Println()

	fmt.Printf("%-8s%8s%12s\\n", "nodes", "edges", "cycles")
	for n := 2; n < 8; n++ {
		edges := fullGraph(n)
		fmt.Printf("%-8d%8d%12d\\n", n, len(edges), countSimpleCycles(n, edges))
	}
	fmt.Println()

	trials := 3000
	anyAgreed := 0
	closingAgreed := 0
	var totalCycles int64
	var mostCycles int64
	for t := 0; t < trials; t++ {
		n := 2 + rand(6)
		edges := []edge{}
		for u := 0; u < n; u++ {
			for v := 0; v < n; v++ {
				if u != v && rand(5) == 0 {
					edges = append(edges, edge{u, v})
				}
			}
		}
		count := countSimpleCycles(n, edges)
		if hasCycle(n, edges) == (count > 0) {
			anyAgreed++
		}
		at := firstEdgeThatCloses(n, edges)
		if (at >= 0) == (count > 0) {
			closingAgreed++
		}
		totalCycles += count
		if count > mostCycles {
			mostCycles = count
		}
	}

	fmt.Printf("over %d random directed graphs on up to 7 nodes:\\n", trials)
	fmt.Printf("  the one-pass check agreed with counting  %6d\\n", anyAgreed)
	fmt.Printf("  the first-closing-edge search agreed     %6d\\n", closingAgreed)
	fmt.Printf("  cycles found in total                    %6d\\n", totalCycles)
	fmt.Printf("  most in any single graph                 %6d\\n", mostCycles)
	fmt.Println()
	fmt.Println("The three questions look like variations of each other and are not. The")
	fmt.Println("first is one traversal. The second re-runs it once per edge, which is")
	fmt.Println("still polynomial and is exactly what a build system does when it tells")
	fmt.Println("you which new dependency created the loop. The third is the one to")
	fmt.Println("recognise and refuse: the table above is the complete graph, and the")
	fmt.Println("cycle count runs 1, 5, 20, 84, 409, 2365 while the edge count is only")
	fmt.Println("reaching 42. Counting cycles is exponential in the nodes, and no")
	fmt.Println("cleverness in the traversal changes that.")
	fmt.Println()
	fmt.Println("Which is the general shape of this module. Asking whether a structure")
	fmt.Println("exists is usually linear. Asking how many there are usually is not.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Answering \"how many cycles\" with a traversal",
          body: "It is exponential in the nodes. On the complete directed graph the count goes 1, 5, 20, 84, 409, 2365 for two to seven nodes while the edges only reach 42. If a problem asks for the number of cycles or paths on a large graph, the right first move is to say so rather than to optimise the walk.",
        },
        {
          title: "Answering \"is there a cycle\" when the question was \"which change caused it\"",
          body: "The second is more expensive -- a walk per edge -- and far more useful. Reporting the offending edge is what turns \"circular dependency detected\" into something actionable, and it is still polynomial.",
        },
      ],
    },
    {
      id: "cycles-and-the-module",
      heading: "Cycle detection, and the module",
      body: [
        "Cycle detection, and the module, in summary.",
        "**Undirected: exempt the edge you arrived on.** Without it every edge is a cycle \u2014 1,770 false alarms in 3,000. With it, either exemption works, on multigraphs too, and union-find gets the same answer without a traversal.",
        "**Directed: colours, not a boolean.** A second route into a node is not a loop when the edges point somewhere. The visited check over-reported on 1,149 of 3,000 graphs and never under-reported; grey-against-black was right on all of them.",
        "**Grey is the path, black is the past.** That is the same distinction as the two visited sets, and it is why the two lessons belong next to each other.",
        "**Ask what the question really is.** Existence is one walk. Which edge closed it is a walk per edge. How many there are is exponential, and recognising that is worth more than any implementation detail.",
        "And that is the module. The traversals were fifteen lines; everything hard was upstream of them \u2014 deciding what a node is, what an edge means, what visited means, and which question is being asked. The next module is the named algorithms, each introduced by the problem that forced its invention.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you detect a cycle in an undirected graph?",
      answer:
        "Depth-first, and the important part is the exemption: a visited neighbour is a cycle only if it is not the one you arrived from. Without that every edge reports a cycle -- I measured it at 1,770 false alarms over 3,000 random graphs. You can write the exemption against the previous node or against the edge you came along; both were exactly correct on 3,000 simple graphs and 3,000 multigraphs, though I would write the edge version because it is obviously correct rather than correct for a reason you have to argue. Union-find is the other answer and needs no traversal at all: join the ends of each edge in turn, and the first edge whose ends are already joined is the cycle -- which is also the machinery Kruskal runs on.",
    },
    {
      question: "Why doesn't that work on a directed graph?",
      answer:
        "Because the fact it rests on stops being true. In an undirected graph, reaching a visited node by a second edge means two routes to it, and two routes make a loop. Following arrows they do not: the diamond a->b->d, a->c->d has two routes to d and no cycle. A visited check calls that a cycle -- over 3,000 random directed graphs it claimed one on 1,149 that had none, and it never missed a real one, so it is over-eager rather than weak. The fix is the three-colour walk: white untouched, grey entered but not yet finished, black finished. An edge into a grey node is a back edge and therefore a cycle; an edge into a black node is just a second route. It is the same distinction as a path-local visited set against a global one, and keeping the path alongside the colours also gives you the cycle itself rather than a boolean.",
    },
    {
      question: "A user reports a circular dependency. What do you actually compute?",
      answer:
        "Three different things depending on what they need. Whether a cycle exists is one traversal, O(V + E). Which edge introduced it is a traversal per edge -- add the edges in order and stop at the first one that closes a loop -- which is O(E * (V + E)) worst case, still polynomial, and much more useful because it names the import they just added instead of the whole graph. What I would push back on is \"list all the cycles\": that is exponential in the number of nodes, and the complete directed graph makes it concrete -- 1, 5, 20, 84, 409, 2365 cycles for two through seven nodes, while the edge count only reaches 42. Usually what people want from that request is one cycle to show them, which the colour walk gives for free.",
    },
  ],
  takeaways: [
    "Undirected cycle detection is a visited check plus an exemption for the edge you arrived on.",
    "Without the exemption every edge is a cycle: 1,770 false alarms over 3,000 random graphs.",
    "Both exemptions \u2014 by previous node and by arriving edge \u2014 were correct on 3,000 simple graphs and 3,000 multigraphs.",
    "Union-find answers the same question with no traversal, and is what Kruskal is built on.",
    "A directed graph can have two routes into a node with no cycle, so a visited check is wrong there.",
    "It over-reported on 1,149 of 3,000 directed graphs and under-reported on none.",
    "The three-colour walk fixes it: white untouched, grey open on this path, black finished.",
    "Grey is the path-local visited set and black is the global one \u2014 the same distinction, renamed.",
    "Keeping the path alongside the colours returns the cycle itself, valid on all 3,000 graphs.",
    "Existence is one walk; which edge closed it is a walk per edge; how many there are is exponential \u2014 2,365 cycles in a complete graph of seven nodes.",
  ],
  status: "available",
};
