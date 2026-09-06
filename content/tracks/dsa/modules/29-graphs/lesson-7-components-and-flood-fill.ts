import type { Lesson } from "@/content/types";

export const componentsLesson: Lesson = {
  id: "dsa-graphs-components-and-flood-fill",
  slug: "components-and-flood-fill",
  moduleSlug: "graphs",
  title: "Connected Components and Flood Fill",
  summary:
    "The traversal put to work: the loop around it that labels components in one pass, the same loop on a grid where adjacency is arithmetic and the four-or-eight question changes the answer on nearly half of random maps, and the two different meanings \u201cconnected\u201d takes on once the edges point somewhere.",
  estimatedMinutes: 45,
  objectives: [
    "Label connected components in one pass, and say what the shared visited array buys",
    "Write a flood fill as the same loop with a computed neighbour function",
    "Settle the four-or-eight neighbour question before writing the code",
    "Distinguish weak from strong connectivity on a directed graph",
  ],
  sections: [
    {
      id: "a-loop-around-the-search",
      heading: "A loop around the search",
      body: [
        "A component is a piece of the graph that is joined to itself and to nothing else, and counting them is the first thing worth doing with a traversal once you have one. The algorithm is not a new algorithm \u2014 it is a loop around the search you already wrote.",
        "Walk from node 0. Whatever it reached is one component. Find the lowest node it did not reach and walk again. Repeat until every node has a label. That is the whole thing, and it scored 3,000 out of 3,000 against the definition \u2014 grouping nodes by whether one can reach the other, computed with a separate search per pair.",
        "The line that matters is the one that is not there: **the visited array is never cleared between walks.** That single omission is what makes the total cost one traversal rather than one per component. Every edge is examined once for the whole run, whatever the number of pieces.",
        "The alternative people write \u2014 a fresh search from each node, taking whoever it reached as that node's component \u2014 is also correct. It costs `n` times the size of a component instead of the size of the graph. On the ring of 800 in the example that is 1,280,000 edge visits against 1,600: one component, and every node paying for a walk of the whole thing.",
        "So this is a cost lesson rather than a correctness one, and the cost is the entire reason components are considered a linear-time problem.",
      ],
      examples: [
        {
          id: "labelling-in-one-pass",
          title: "The component loop, scored against the definition and against itself",
          lang: "python",
          code: `# Connected components: the first thing worth doing with a traversal once you
# have one.
#
# The whole algorithm is a loop around the search. Walk from node 0; whatever
# it reached is one component; find the lowest node it did not reach and walk
# again. The visited array is *not* cleared between walks -- that single line is
# what makes the total cost one traversal rather than one per component.
#
# The example counts components that way and scores it against the definition:
# two nodes are in the same component when one can reach the other, computed by
# a separate search per node.


def build(n, edges):
    neighbours = [[] for _ in range(n)]
    for u, v in edges:
        neighbours[u].append(v)
        neighbours[v].append(u)
    return neighbours


def label_components(neighbours):
    """One label per node, and the number of labels. Visited is never cleared."""
    n = len(neighbours)
    label = [-1] * n
    seen_edges = 0
    count = 0
    for start in range(n):
        if label[start] >= 0:
            continue
        queue = [start]
        label[start] = count
        head = 0
        while head < len(queue):
            v = queue[head]
            head += 1
            for u in neighbours[v]:
                seen_edges += 1
                if label[u] < 0:
                    label[u] = count
                    queue.append(u)
        count += 1
    return label, count, seen_edges


def label_components_per_node(neighbours):
    """A fresh search from every node. Same labels, and the work multiplies."""
    n = len(neighbours)
    label = [-1] * n
    seen_edges = 0
    count = 0
    for start in range(n):
        reached = [False] * n
        queue = [start]
        reached[start] = True
        head = 0
        while head < len(queue):
            v = queue[head]
            head += 1
            for u in neighbours[v]:
                seen_edges += 1
                if not reached[u]:
                    reached[u] = True
                    queue.append(u)
        if label[start] >= 0:
            continue
        for v in range(n):
            if reached[v]:
                label[v] = count
        count += 1
    return label, count, seen_edges


def reaches(neighbours, start, target):
    """One search, one question. The definition of \\"same component\\"."""
    n = len(neighbours)
    seen = [False] * n
    seen[start] = True
    queue = [start]
    head = 0
    while head < len(queue):
        v = queue[head]
        head += 1
        if v == target:
            return True
        for u in neighbours[v]:
            if not seen[u]:
                seen[u] = True
                queue.append(u)
    return False


def count_by_definition(neighbours):
    """Group nodes by mutual reachability, the slow and obviously correct way."""
    n = len(neighbours)
    group = [-1] * n
    count = 0
    for v in range(n):
        if group[v] >= 0:
            continue
        for u in range(v, n):
            if group[u] < 0 and reaches(neighbours, v, u):
                group[u] = count
        count += 1
    return group, count


def same(a, b):
    if len(a) != len(b):
        return False
    for i in range(len(a)):
        if a[i] != b[i]:
            return False
    return True


def show(values):
    return "[" + ", ".join(str(v) for v in values) + "]"


def isolated_edges(k):
    """k separate two-node components. Many components, each of them tiny."""
    return 2 * k, [(2 * i, 2 * i + 1) for i in range(k)]


def one_big_ring(n):
    """One component holding everything."""
    return n, [(v, (v + 1) % n) for v in range(n)]


SHAPES = [
    ("400 isolated pairs", ) + isolated_edges(400),
    ("ring of 800", ) + one_big_ring(800),
    ("800 lone nodes", 800, []),
]

CASES = [
    (6, [(0, 1), (1, 2), (3, 4)]),
    (5, [(0, 1), (1, 2), (2, 3), (3, 4)]),
    (6, []),
    (7, [(0, 1), (2, 3), (4, 5), (5, 6), (6, 4)]),
]

print(f"{'edges':<36}{'labels':<24}{'components'}")
for n, edges in CASES:
    neighbours = build(n, edges)
    label, count, _ = label_components(neighbours)
    truth, truth_count = count_by_definition(neighbours)
    if not same(label, truth) or count != truth_count:
        print("MISMATCH")
    shown = "[" + ", ".join(f"{u}-{v}" for u, v in edges) + "]"
    print(f"{shown:<36}{show(label):<24}{count}")
print()

print(f"{'shape':<28}{'nodes':>7}{'components':>12}{'edges, one pass':>17}{'edges, per node':>17}")
for name, n, edges in SHAPES:
    neighbours = build(n, edges)
    _, count_one, edges_one = label_components(neighbours)
    _, count_many, edges_many = label_components_per_node(neighbours)
    if count_one != count_many:
        print("MISMATCH")
    print(f"{name:<28}{n:>7}{count_one:>12}{edges_one:>17}{edges_many:>17}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
labels_ok = 0
restart_ok = 0
one_pass_edges = 0
restart_edges = 0
singletons = 0
for _ in range(TRIALS):
    n = 2 + rand(6)
    edges = []
    for u in range(n):
        for v in range(u + 1, n):
            if rand(5) == 0:
                edges.append((u, v))
    neighbours = build(n, edges)
    label, count, edges_one = label_components(neighbours)
    restart_label, restart_count, edges_many = label_components_per_node(neighbours)
    truth, truth_count = count_by_definition(neighbours)
    if same(label, truth) and count == truth_count:
        labels_ok += 1
    if same(restart_label, truth) and restart_count == truth_count:
        restart_ok += 1
    one_pass_edges += edges_one
    restart_edges += edges_many
    if count == n:
        singletons += 1

print(f"over {TRIALS} random graphs on up to 7 nodes:")
print(f"  one pass matched the definition          {labels_ok:>7}")
print(f"  a search per node matched it too         {restart_ok:>7}")
print(f"  edge visits, one pass against per node   {one_pass_edges:>7}{restart_edges:>9}")
print(f"  graphs that were all singletons          {singletons:>7}")
print()
print("Both loops are correct, so this is a cost lesson rather than a")
print("correctness one -- but the cost is the reason the algorithm is considered")
print("linear at all. Carrying one visited array across every walk means each")
print("edge is looked at once for the whole run, whatever the number of")
print("components. Starting a fresh search from every node means each node pays")
print("for a walk of its own component, so the total is n times the component")
print("size rather than the graph size. On the ring of 800 above that is 1,600")
print("edge visits against 1,280,000 -- one component, and every node paying for")
print("a walk of the whole thing.")
`,
          output: `edges                               labels                  components
[0-1, 1-2, 3-4]                     [0, 0, 0, 1, 1, 2]      3
[0-1, 1-2, 2-3, 3-4]                [0, 0, 0, 0, 0]         1
[]                                  [0, 1, 2, 3, 4, 5]      6
[0-1, 2-3, 4-5, 5-6, 6-4]           [0, 0, 1, 1, 2, 2, 2]   3

shape                         nodes  components  edges, one pass  edges, per node
400 isolated pairs              800         400              800             1600
ring of 800                     800           1             1600          1280000
800 lone nodes                  800         800                0                0

over 3000 random graphs on up to 7 nodes:
  one pass matched the definition             3000
  a search per node matched it too            3000
  edge visits, one pass against per node     11214    44298
  graphs that were all singletons              854

Both loops are correct, so this is a cost lesson rather than a
correctness one -- but the cost is the reason the algorithm is considered
linear at all. Carrying one visited array across every walk means each
edge is looked at once for the whole run, whatever the number of
components. Starting a fresh search from every node means each node pays
for a walk of its own component, so the total is n times the component
size rather than the graph size. On the ring of 800 above that is 1,600
edge visits against 1,280,000 -- one component, and every node paying for
a walk of the whole thing.`,
          explanation:
            "The component loop scored against grouping nodes by mutual reachability, and the same loop written the expensive way. Both are correct; one of them is linear.",
          alternates: [
            {
              lang: "javascript",
              code: `// Connected components: the first thing worth doing with a traversal once you
// have one.
//
// The whole algorithm is a loop around the search. Walk from node 0; whatever
// it reached is one component; find the lowest node it did not reach and walk
// again. The visited array is *not* cleared between walks -- that single line is
// what makes the total cost one traversal rather than one per component.
//
// The example counts components that way and scores it against the definition:
// two nodes are in the same component when one can reach the other, computed by
// a separate search per node.

function build(n, edges) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    neighbours[v].push(u);
  }
  return neighbours;
}

/** One label per node, and the number of labels. Visited is never cleared. */
function labelComponents(neighbours) {
  const n = neighbours.length;
  const label = new Array(n).fill(-1);
  let seenEdges = 0;
  let count = 0;
  for (let start = 0; start < n; start += 1) {
    if (label[start] >= 0) continue;
    const queue = [start];
    label[start] = count;
    let head = 0;
    while (head < queue.length) {
      const v = queue[head];
      head += 1;
      for (const u of neighbours[v]) {
        seenEdges += 1;
        if (label[u] < 0) {
          label[u] = count;
          queue.push(u);
        }
      }
    }
    count += 1;
  }
  return [label, count, seenEdges];
}

/** A fresh search from every node. Same labels, and the work multiplies. */
function labelComponentsPerNode(neighbours) {
  const n = neighbours.length;
  const label = new Array(n).fill(-1);
  let seenEdges = 0;
  let count = 0;
  for (let start = 0; start < n; start += 1) {
    const reached = new Array(n).fill(false);
    const queue = [start];
    reached[start] = true;
    let head = 0;
    while (head < queue.length) {
      const v = queue[head];
      head += 1;
      for (const u of neighbours[v]) {
        seenEdges += 1;
        if (!reached[u]) {
          reached[u] = true;
          queue.push(u);
        }
      }
    }
    if (label[start] >= 0) continue;
    for (let v = 0; v < n; v += 1) {
      if (reached[v]) label[v] = count;
    }
    count += 1;
  }
  return [label, count, seenEdges];
}

/** One search, one question. The definition of "same component". */
function reaches(neighbours, start, target) {
  const n = neighbours.length;
  const seen = new Array(n).fill(false);
  seen[start] = true;
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const v = queue[head];
    head += 1;
    if (v === target) return true;
    for (const u of neighbours[v]) {
      if (!seen[u]) {
        seen[u] = true;
        queue.push(u);
      }
    }
  }
  return false;
}

/** Group nodes by mutual reachability, the slow and obviously correct way. */
function countByDefinition(neighbours) {
  const n = neighbours.length;
  const group = new Array(n).fill(-1);
  let count = 0;
  for (let v = 0; v < n; v += 1) {
    if (group[v] >= 0) continue;
    for (let u = v; u < n; u += 1) {
      if (group[u] < 0 && reaches(neighbours, v, u)) group[u] = count;
    }
    count += 1;
  }
  return [group, count];
}

function same(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

const show = (values) => "[" + values.join(", ") + "]";
const padEnd = (v, w) => String(v).padEnd(w);
const pad = (v, w) => String(v).padStart(w);

/** k separate two-node components. Many components, each of them tiny. */
function isolatedEdges(k) {
  const edges = [];
  for (let i = 0; i < k; i += 1) edges.push([2 * i, 2 * i + 1]);
  return [2 * k, edges];
}

/** One component holding everything. */
function oneBigRing(n) {
  const edges = [];
  for (let v = 0; v < n; v += 1) edges.push([v, (v + 1) % n]);
  return [n, edges];
}

const [pairsN, pairsEdges] = isolatedEdges(400);
const [ringN, ringEdges] = oneBigRing(800);
const SHAPES = [
  ["400 isolated pairs", pairsN, pairsEdges],
  ["ring of 800", ringN, ringEdges],
  ["800 lone nodes", 800, []],
];

const CASES = [
  [6, [[0, 1], [1, 2], [3, 4]]],
  [5, [[0, 1], [1, 2], [2, 3], [3, 4]]],
  [6, []],
  [7, [[0, 1], [2, 3], [4, 5], [5, 6], [6, 4]]],
];

console.log(padEnd("edges", 36) + padEnd("labels", 24) + "components");
for (const [n, edges] of CASES) {
  const neighbours = build(n, edges);
  const [label, count] = labelComponents(neighbours);
  const [truth, truthCount] = countByDefinition(neighbours);
  if (!same(label, truth) || count !== truthCount) console.log("MISMATCH");
  const shown = "[" + edges.map(([u, v]) => \`\${u}-\${v}\`).join(", ") + "]";
  console.log(padEnd(shown, 36) + padEnd(show(label), 24) + count);
}
console.log();

console.log(
  padEnd("shape", 28) +
    pad("nodes", 7) +
    pad("components", 12) +
    pad("edges, one pass", 17) +
    pad("edges, per node", 17)
);
for (const [name, n, edges] of SHAPES) {
  const neighbours = build(n, edges);
  const [, countOne, edgesOne] = labelComponents(neighbours);
  const [, countMany, edgesMany] = labelComponentsPerNode(neighbours);
  if (countOne !== countMany) console.log("MISMATCH");
  console.log(padEnd(name, 28) + pad(n, 7) + pad(countOne, 12) + pad(edgesOne, 17) + pad(edgesMany, 17));
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
let labelsOk = 0;
let restartOk = 0;
let onePassEdges = 0;
let restartEdges = 0;
let singletons = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) {
      if (rand(5) === 0) edges.push([u, v]);
    }
  }
  const neighbours = build(n, edges);
  const [label, count, edgesOne] = labelComponents(neighbours);
  const [restartLabel, restartCount, edgesMany] = labelComponentsPerNode(neighbours);
  const [truth, truthCount] = countByDefinition(neighbours);
  if (same(label, truth) && count === truthCount) labelsOk += 1;
  if (same(restartLabel, truth) && restartCount === truthCount) restartOk += 1;
  onePassEdges += edgesOne;
  restartEdges += edgesMany;
  if (count === n) singletons += 1;
}

console.log(\`over \${TRIALS} random graphs on up to 7 nodes:\`);
console.log(\`  one pass matched the definition          \${pad(labelsOk, 7)}\`);
console.log(\`  a search per node matched it too         \${pad(restartOk, 7)}\`);
console.log(\`  edge visits, one pass against per node   \${pad(onePassEdges, 7)}\${pad(restartEdges, 9)}\`);
console.log(\`  graphs that were all singletons          \${pad(singletons, 7)}\`);
console.log();
console.log("Both loops are correct, so this is a cost lesson rather than a");
console.log("correctness one -- but the cost is the reason the algorithm is considered");
console.log("linear at all. Carrying one visited array across every walk means each");
console.log("edge is looked at once for the whole run, whatever the number of");
console.log("components. Starting a fresh search from every node means each node pays");
console.log("for a walk of its own component, so the total is n times the component");
console.log("size rather than the graph size. On the ring of 800 above that is 1,600");
console.log("edge visits against 1,280,000 -- one component, and every node paying for");
console.log("a walk of the whole thing.");
`,
            },
            {
              lang: "typescript",
              code: `// Connected components: the first thing worth doing with a traversal once you
// have one.
//
// The whole algorithm is a loop around the search. Walk from node 0; whatever
// it reached is one component; find the lowest node it did not reach and walk
// again. The visited array is *not* cleared between walks -- that single line is
// what makes the total cost one traversal rather than one per component.
//
// The example counts components that way and scores it against the definition:
// two nodes are in the same component when one can reach the other, computed by
// a separate search per node.

type Edge = [number, number];

function build(n: number, edges: Edge[]): number[][] {
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    neighbours[v].push(u);
  }
  return neighbours;
}

/** One label per node, and the number of labels. Visited is never cleared. */
function labelComponents(neighbours: number[][]): [number[], number, number] {
  const n = neighbours.length;
  const label = new Array(n).fill(-1);
  let seenEdges = 0;
  let count = 0;
  for (let start = 0; start < n; start += 1) {
    if (label[start] >= 0) continue;
    const queue = [start];
    label[start] = count;
    let head = 0;
    while (head < queue.length) {
      const v = queue[head];
      head += 1;
      for (const u of neighbours[v]) {
        seenEdges += 1;
        if (label[u] < 0) {
          label[u] = count;
          queue.push(u);
        }
      }
    }
    count += 1;
  }
  return [label, count, seenEdges];
}

/** A fresh search from every node. Same labels, and the work multiplies. */
function labelComponentsPerNode(neighbours: number[][]): [number[], number, number] {
  const n = neighbours.length;
  const label = new Array(n).fill(-1);
  let seenEdges = 0;
  let count = 0;
  for (let start = 0; start < n; start += 1) {
    const reached = new Array(n).fill(false);
    const queue = [start];
    reached[start] = true;
    let head = 0;
    while (head < queue.length) {
      const v = queue[head];
      head += 1;
      for (const u of neighbours[v]) {
        seenEdges += 1;
        if (!reached[u]) {
          reached[u] = true;
          queue.push(u);
        }
      }
    }
    if (label[start] >= 0) continue;
    for (let v = 0; v < n; v += 1) {
      if (reached[v]) label[v] = count;
    }
    count += 1;
  }
  return [label, count, seenEdges];
}

/** One search, one question. The definition of "same component". */
function reaches(neighbours: number[][], start: number, target: number): boolean {
  const n = neighbours.length;
  const seen = new Array(n).fill(false);
  seen[start] = true;
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const v = queue[head];
    head += 1;
    if (v === target) return true;
    for (const u of neighbours[v]) {
      if (!seen[u]) {
        seen[u] = true;
        queue.push(u);
      }
    }
  }
  return false;
}

/** Group nodes by mutual reachability, the slow and obviously correct way. */
function countByDefinition(neighbours: number[][]): [number[], number] {
  const n = neighbours.length;
  const group = new Array(n).fill(-1);
  let count = 0;
  for (let v = 0; v < n; v += 1) {
    if (group[v] >= 0) continue;
    for (let u = v; u < n; u += 1) {
      if (group[u] < 0 && reaches(neighbours, v, u)) group[u] = count;
    }
    count += 1;
  }
  return [group, count];
}

function same(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

const show = (values: number[]): string => "[" + values.join(", ") + "]";
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const pad = (v: string | number, w: number): string => String(v).padStart(w);

/** k separate two-node components. Many components, each of them tiny. */
function isolatedEdges(k: number): [number, Edge[]] {
  const edges: Edge[] = [];
  for (let i = 0; i < k; i += 1) edges.push([2 * i, 2 * i + 1]);
  return [2 * k, edges];
}

/** One component holding everything. */
function oneBigRing(n: number): [number, Edge[]] {
  const edges: Edge[] = [];
  for (let v = 0; v < n; v += 1) edges.push([v, (v + 1) % n]);
  return [n, edges];
}

const [pairsN, pairsEdges] = isolatedEdges(400);
const [ringN, ringEdges] = oneBigRing(800);
const SHAPES: [string, number, Edge[]][] = [
  ["400 isolated pairs", pairsN, pairsEdges],
  ["ring of 800", ringN, ringEdges],
  ["800 lone nodes", 800, []],
];

const CASES: [number, Edge[]][] = [
  [6, [[0, 1], [1, 2], [3, 4]]],
  [5, [[0, 1], [1, 2], [2, 3], [3, 4]]],
  [6, []],
  [7, [[0, 1], [2, 3], [4, 5], [5, 6], [6, 4]]],
];

console.log(padEnd("edges", 36) + padEnd("labels", 24) + "components");
for (const [n, edges] of CASES) {
  const neighbours = build(n, edges);
  const [label, count] = labelComponents(neighbours);
  const [truth, truthCount] = countByDefinition(neighbours);
  if (!same(label, truth) || count !== truthCount) console.log("MISMATCH");
  const shown = "[" + edges.map(([u, v]) => \`\${u}-\${v}\`).join(", ") + "]";
  console.log(padEnd(shown, 36) + padEnd(show(label), 24) + count);
}
console.log();

console.log(
  padEnd("shape", 28) +
    pad("nodes", 7) +
    pad("components", 12) +
    pad("edges, one pass", 17) +
    pad("edges, per node", 17)
);
for (const [name, n, edges] of SHAPES) {
  const neighbours = build(n, edges);
  const [, countOne, edgesOne] = labelComponents(neighbours);
  const [, countMany, edgesMany] = labelComponentsPerNode(neighbours);
  if (countOne !== countMany) console.log("MISMATCH");
  console.log(padEnd(name, 28) + pad(n, 7) + pad(countOne, 12) + pad(edgesOne, 17) + pad(edgesMany, 17));
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
let labelsOk = 0;
let restartOk = 0;
let onePassEdges = 0;
let restartEdges = 0;
let singletons = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges: Edge[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) {
      if (rand(5) === 0) edges.push([u, v]);
    }
  }
  const neighbours = build(n, edges);
  const [label, count, edgesOne] = labelComponents(neighbours);
  const [restartLabel, restartCount, edgesMany] = labelComponentsPerNode(neighbours);
  const [truth, truthCount] = countByDefinition(neighbours);
  if (same(label, truth) && count === truthCount) labelsOk += 1;
  if (same(restartLabel, truth) && restartCount === truthCount) restartOk += 1;
  onePassEdges += edgesOne;
  restartEdges += edgesMany;
  if (count === n) singletons += 1;
}

console.log(\`over \${TRIALS} random graphs on up to 7 nodes:\`);
console.log(\`  one pass matched the definition          \${pad(labelsOk, 7)}\`);
console.log(\`  a search per node matched it too         \${pad(restartOk, 7)}\`);
console.log(\`  edge visits, one pass against per node   \${pad(onePassEdges, 7)}\${pad(restartEdges, 9)}\`);
console.log(\`  graphs that were all singletons          \${pad(singletons, 7)}\`);
console.log();
console.log("Both loops are correct, so this is a cost lesson rather than a");
console.log("correctness one -- but the cost is the reason the algorithm is considered");
console.log("linear at all. Carrying one visited array across every walk means each");
console.log("edge is looked at once for the whole run, whatever the number of");
console.log("components. Starting a fresh search from every node means each node pays");
console.log("for a walk of its own component, so the total is n times the component");
console.log("size rather than the graph size. On the ring of 800 above that is 1,600");
console.log("edge visits against 1,280,000 -- one component, and every node paying for");
console.log("a walk of the whole thing.");
`,
            },
            {
              lang: "java",
              code: `// Connected components: the first thing worth doing with a traversal once you
// have one.
//
// The whole algorithm is a loop around the search. Walk from node 0; whatever
// it reached is one component; find the lowest node it did not reach and walk
// again. The visited array is *not* cleared between walks -- that single line is
// what makes the total cost one traversal rather than one per component.
//
// The example counts components that way and scores it against the definition:
// two nodes are in the same component when one can reach the other, computed by
// a separate search per node.

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {

    static List<List<Integer>> build(int n, int[][] edges) {
        List<List<Integer>> neighbours = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            neighbours.add(new ArrayList<>());
        }
        for (int[] e : edges) {
            neighbours.get(e[0]).add(e[1]);
            neighbours.get(e[1]).add(e[0]);
        }
        return neighbours;
    }

    static int[] lastLabel;
    static int lastCount;
    static long lastEdges;

    /** One label per node, and the number of labels. Visited is never cleared. */
    static void labelComponents(List<List<Integer>> neighbours) {
        int n = neighbours.size();
        int[] label = new int[n];
        Arrays.fill(label, -1);
        long seenEdges = 0;
        int count = 0;
        for (int start = 0; start < n; start++) {
            if (label[start] >= 0) {
                continue;
            }
            List<Integer> queue = new ArrayList<>();
            queue.add(start);
            label[start] = count;
            int head = 0;
            while (head < queue.size()) {
                int v = queue.get(head);
                head++;
                for (int u : neighbours.get(v)) {
                    seenEdges++;
                    if (label[u] < 0) {
                        label[u] = count;
                        queue.add(u);
                    }
                }
            }
            count++;
        }
        lastLabel = label;
        lastCount = count;
        lastEdges = seenEdges;
    }

    /** A fresh search from every node. Same labels, and the work multiplies. */
    static void labelComponentsPerNode(List<List<Integer>> neighbours) {
        int n = neighbours.size();
        int[] label = new int[n];
        Arrays.fill(label, -1);
        long seenEdges = 0;
        int count = 0;
        for (int start = 0; start < n; start++) {
            boolean[] reached = new boolean[n];
            List<Integer> queue = new ArrayList<>();
            queue.add(start);
            reached[start] = true;
            int head = 0;
            while (head < queue.size()) {
                int v = queue.get(head);
                head++;
                for (int u : neighbours.get(v)) {
                    seenEdges++;
                    if (!reached[u]) {
                        reached[u] = true;
                        queue.add(u);
                    }
                }
            }
            if (label[start] >= 0) {
                continue;
            }
            for (int v = 0; v < n; v++) {
                if (reached[v]) {
                    label[v] = count;
                }
            }
            count++;
        }
        lastLabel = label;
        lastCount = count;
        lastEdges = seenEdges;
    }

    /** One search, one question. The definition of "same component". */
    static boolean reaches(List<List<Integer>> neighbours, int start, int target) {
        int n = neighbours.size();
        boolean[] seen = new boolean[n];
        seen[start] = true;
        List<Integer> queue = new ArrayList<>();
        queue.add(start);
        int head = 0;
        while (head < queue.size()) {
            int v = queue.get(head);
            head++;
            if (v == target) {
                return true;
            }
            for (int u : neighbours.get(v)) {
                if (!seen[u]) {
                    seen[u] = true;
                    queue.add(u);
                }
            }
        }
        return false;
    }

    static int[] truthGroup;

    /** Group nodes by mutual reachability, the slow and obviously correct way. */
    static int countByDefinition(List<List<Integer>> neighbours) {
        int n = neighbours.size();
        int[] group = new int[n];
        Arrays.fill(group, -1);
        int count = 0;
        for (int v = 0; v < n; v++) {
            if (group[v] >= 0) {
                continue;
            }
            for (int u = v; u < n; u++) {
                if (group[u] < 0 && reaches(neighbours, v, u)) {
                    group[u] = count;
                }
            }
            count++;
        }
        truthGroup = group;
        return count;
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

    static String show(int[] values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.length; i++) {
            if (i > 0) {
                sb.append(", ");
            }
            sb.append(values[i]);
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

    /** k separate two-node components. Many components, each of them tiny. */
    static int[][] isolatedEdges(int k) {
        int[][] edges = new int[k][2];
        for (int i = 0; i < k; i++) {
            edges[i][0] = 2 * i;
            edges[i][1] = 2 * i + 1;
        }
        return edges;
    }

    /** One component holding everything. */
    static int[][] oneBigRing(int n) {
        int[][] edges = new int[n][2];
        for (int v = 0; v < n; v++) {
            edges[v][0] = v;
            edges[v][1] = (v + 1) % n;
        }
        return edges;
    }

    // The same linear congruential generator in every language, so the random
    // graphs below are the same graphs whichever translation is run.
    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        int[] sizes = {6, 5, 6, 7};
        int[][][] cases = {
            {{0, 1}, {1, 2}, {3, 4}},
            {{0, 1}, {1, 2}, {2, 3}, {3, 4}},
            {},
            {{0, 1}, {2, 3}, {4, 5}, {5, 6}, {6, 4}},
        };

        System.out.println(padEnd("edges", 36) + padEnd("labels", 24) + "components");
        for (int c = 0; c < sizes.length; c++) {
            List<List<Integer>> neighbours = build(sizes[c], cases[c]);
            labelComponents(neighbours);
            int[] label = lastLabel;
            int count = lastCount;
            int truthCount = countByDefinition(neighbours);
            if (!same(label, truthGroup) || count != truthCount) {
                System.out.println("MISMATCH");
            }
            StringBuilder shown = new StringBuilder("[");
            for (int i = 0; i < cases[c].length; i++) {
                if (i > 0) {
                    shown.append(", ");
                }
                shown.append(cases[c][i][0]).append("-").append(cases[c][i][1]);
            }
            shown.append("]");
            System.out.println(padEnd(shown.toString(), 36) + padEnd(show(label), 24) + count);
        }
        System.out.println();

        String[] shapeNames = {"400 isolated pairs", "ring of 800", "800 lone nodes"};
        int[] shapeCounts = {800, 800, 800};
        int[][][] shapeEdges = {isolatedEdges(400), oneBigRing(800), {}};

        System.out.println(padEnd("shape", 28) + pad("nodes", 7) + pad("components", 12)
                + pad("edges, one pass", 17) + pad("edges, per node", 17));
        for (int c = 0; c < shapeNames.length; c++) {
            List<List<Integer>> neighbours = build(shapeCounts[c], shapeEdges[c]);
            labelComponents(neighbours);
            int countOne = lastCount;
            long edgesOne = lastEdges;
            labelComponentsPerNode(neighbours);
            int countMany = lastCount;
            long edgesMany = lastEdges;
            if (countOne != countMany) {
                System.out.println("MISMATCH");
            }
            System.out.println(padEnd(shapeNames[c], 28) + pad(String.valueOf(shapeCounts[c]), 7)
                    + pad(String.valueOf(countOne), 12) + pad(String.valueOf(edgesOne), 17)
                    + pad(String.valueOf(edgesMany), 17));
        }
        System.out.println();

        int trials = 3000;
        int labelsOk = 0;
        int restartOk = 0;
        long onePassEdges = 0;
        long restartEdges = 0;
        int singletons = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(6);
            List<int[]> collected = new ArrayList<>();
            for (int u = 0; u < n; u++) {
                for (int v = u + 1; v < n; v++) {
                    if (rand(5) == 0) {
                        collected.add(new int[] {u, v});
                    }
                }
            }
            int[][] edges = collected.toArray(new int[0][]);
            List<List<Integer>> neighbours = build(n, edges);
            labelComponents(neighbours);
            int[] label = lastLabel;
            int count = lastCount;
            long edgesOne = lastEdges;
            labelComponentsPerNode(neighbours);
            int[] restartLabel = lastLabel;
            int restartCount = lastCount;
            long edgesMany = lastEdges;
            int truthCount = countByDefinition(neighbours);
            int[] truth = truthGroup;
            if (same(label, truth) && count == truthCount) {
                labelsOk++;
            }
            if (same(restartLabel, truth) && restartCount == truthCount) {
                restartOk++;
            }
            onePassEdges += edgesOne;
            restartEdges += edgesMany;
            if (count == n) {
                singletons++;
            }
        }

        System.out.println("over " + trials + " random graphs on up to 7 nodes:");
        System.out.println("  one pass matched the definition          " + pad(String.valueOf(labelsOk), 7));
        System.out.println("  a search per node matched it too         " + pad(String.valueOf(restartOk), 7));
        System.out.println("  edge visits, one pass against per node   " + pad(String.valueOf(onePassEdges), 7)
                + pad(String.valueOf(restartEdges), 9));
        System.out.println("  graphs that were all singletons          " + pad(String.valueOf(singletons), 7));
        System.out.println();
        System.out.println("Both loops are correct, so this is a cost lesson rather than a");
        System.out.println("correctness one -- but the cost is the reason the algorithm is considered");
        System.out.println("linear at all. Carrying one visited array across every walk means each");
        System.out.println("edge is looked at once for the whole run, whatever the number of");
        System.out.println("components. Starting a fresh search from every node means each node pays");
        System.out.println("for a walk of its own component, so the total is n times the component");
        System.out.println("size rather than the graph size. On the ring of 800 above that is 1,600");
        System.out.println("edge visits against 1,280,000 -- one component, and every node paying for");
        System.out.println("a walk of the whole thing.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Connected components: the first thing worth doing with a traversal once you
// have one.
//
// The whole algorithm is a loop around the search. Walk from node 0; whatever
// it reached is one component; find the lowest node it did not reach and walk
// again. The visited array is *not* cleared between walks -- that single line is
// what makes the total cost one traversal rather than one per component.
//
// The example counts components that way and scores it against the definition:
// two nodes are in the same component when one can reach the other, computed by
// a separate search per node.

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
        neighbours[e.second].push_back(e.first);
    }
    return neighbours;
}

// One label per node, and the number of labels. Visited is never cleared.
int label_components(const std::vector<std::vector<int>>& neighbours,
                     std::vector<int>& label, long long& seen_edges) {
    int n = static_cast<int>(neighbours.size());
    label.assign(n, -1);
    seen_edges = 0;
    int count = 0;
    for (int start = 0; start < n; start++) {
        if (label[start] >= 0) {
            continue;
        }
        std::vector<int> queue;
        queue.push_back(start);
        label[start] = count;
        size_t head = 0;
        while (head < queue.size()) {
            int v = queue[head];
            head++;
            for (int u : neighbours[v]) {
                seen_edges++;
                if (label[u] < 0) {
                    label[u] = count;
                    queue.push_back(u);
                }
            }
        }
        count++;
    }
    return count;
}

// A fresh search from every node. Same labels, and the work multiplies.
int label_components_per_node(const std::vector<std::vector<int>>& neighbours,
                              std::vector<int>& label, long long& seen_edges) {
    int n = static_cast<int>(neighbours.size());
    label.assign(n, -1);
    seen_edges = 0;
    int count = 0;
    for (int start = 0; start < n; start++) {
        std::vector<char> reached(n, 0);
        std::vector<int> queue;
        queue.push_back(start);
        reached[start] = 1;
        size_t head = 0;
        while (head < queue.size()) {
            int v = queue[head];
            head++;
            for (int u : neighbours[v]) {
                seen_edges++;
                if (!reached[u]) {
                    reached[u] = 1;
                    queue.push_back(u);
                }
            }
        }
        if (label[start] >= 0) {
            continue;
        }
        for (int v = 0; v < n; v++) {
            if (reached[v]) {
                label[v] = count;
            }
        }
        count++;
    }
    return count;
}

// One search, one question. The definition of "same component".
bool reaches(const std::vector<std::vector<int>>& neighbours, int start, int target) {
    int n = static_cast<int>(neighbours.size());
    std::vector<char> seen(n, 0);
    seen[start] = 1;
    std::vector<int> queue;
    queue.push_back(start);
    size_t head = 0;
    while (head < queue.size()) {
        int v = queue[head];
        head++;
        if (v == target) {
            return true;
        }
        for (int u : neighbours[v]) {
            if (!seen[u]) {
                seen[u] = 1;
                queue.push_back(u);
            }
        }
    }
    return false;
}

// Group nodes by mutual reachability, the slow and obviously correct way.
int count_by_definition(const std::vector<std::vector<int>>& neighbours, std::vector<int>& group) {
    int n = static_cast<int>(neighbours.size());
    group.assign(n, -1);
    int count = 0;
    for (int v = 0; v < n; v++) {
        if (group[v] >= 0) {
            continue;
        }
        for (int u = v; u < n; u++) {
            if (group[u] < 0 && reaches(neighbours, v, u)) {
                group[u] = count;
            }
        }
        count++;
    }
    return count;
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

// k separate two-node components. Many components, each of them tiny.
std::vector<Edge> isolated_edges(int k) {
    std::vector<Edge> edges;
    for (int i = 0; i < k; i++) {
        edges.push_back(Edge(2 * i, 2 * i + 1));
    }
    return edges;
}

// One component holding everything.
std::vector<Edge> one_big_ring(int n) {
    std::vector<Edge> edges;
    for (int v = 0; v < n; v++) {
        edges.push_back(Edge(v, (v + 1) % n));
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
    std::vector<int> sizes = {6, 5, 6, 7};
    std::vector<std::vector<Edge>> cases = {
        {{0, 1}, {1, 2}, {3, 4}},
        {{0, 1}, {1, 2}, {2, 3}, {3, 4}},
        {},
        {{0, 1}, {2, 3}, {4, 5}, {5, 6}, {6, 4}},
    };

    std::cout << std::left << std::setw(36) << "edges" << std::setw(24) << "labels"
              << "components" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        std::vector<std::vector<int>> neighbours = build(sizes[c], cases[c]);
        std::vector<int> label;
        long long edges_seen = 0;
        int count = label_components(neighbours, label, edges_seen);
        std::vector<int> truth;
        int truth_count = count_by_definition(neighbours, truth);
        if (!same(label, truth) || count != truth_count) {
            std::cout << "MISMATCH\\n";
        }
        std::string shown = "[";
        for (size_t i = 0; i < cases[c].size(); i++) {
            if (i > 0) {
                shown += ", ";
            }
            shown += std::to_string(cases[c][i].first) + "-" + std::to_string(cases[c][i].second);
        }
        shown += "]";
        std::cout << std::left << std::setw(36) << shown << std::setw(24) << show(label)
                  << count << "\\n";
    }
    std::cout << "\\n";

    std::vector<std::string> shape_names = {"400 isolated pairs", "ring of 800", "800 lone nodes"};
    std::vector<int> shape_counts = {800, 800, 800};
    std::vector<std::vector<Edge>> shape_edges = {isolated_edges(400), one_big_ring(800), {}};

    std::cout << std::left << std::setw(28) << "shape" << std::right << std::setw(7) << "nodes"
              << std::setw(12) << "components" << std::setw(17) << "edges, one pass"
              << std::setw(17) << "edges, per node" << "\\n";
    for (size_t c = 0; c < shape_names.size(); c++) {
        std::vector<std::vector<int>> neighbours = build(shape_counts[c], shape_edges[c]);
        std::vector<int> label;
        long long edges_one = 0;
        long long edges_many = 0;
        int count_one = label_components(neighbours, label, edges_one);
        int count_many = label_components_per_node(neighbours, label, edges_many);
        if (count_one != count_many) {
            std::cout << "MISMATCH\\n";
        }
        std::cout << std::left << std::setw(28) << shape_names[c] << std::right << std::setw(7)
                  << shape_counts[c] << std::setw(12) << count_one << std::setw(17) << edges_one
                  << std::setw(17) << edges_many << "\\n";
    }
    std::cout << "\\n";

    int trials = 3000;
    int labels_ok = 0;
    int restart_ok = 0;
    long long one_pass_edges = 0;
    long long restart_edges = 0;
    int singletons = 0;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(6);
        std::vector<Edge> edges;
        for (int u = 0; u < n; u++) {
            for (int v = u + 1; v < n; v++) {
                if (rand_below(5) == 0) {
                    edges.push_back(Edge(u, v));
                }
            }
        }
        std::vector<std::vector<int>> neighbours = build(n, edges);
        std::vector<int> label;
        std::vector<int> restart_label;
        long long edges_one = 0;
        long long edges_many = 0;
        int count = label_components(neighbours, label, edges_one);
        int restart_count = label_components_per_node(neighbours, restart_label, edges_many);
        std::vector<int> truth;
        int truth_count = count_by_definition(neighbours, truth);
        if (same(label, truth) && count == truth_count) {
            labels_ok++;
        }
        if (same(restart_label, truth) && restart_count == truth_count) {
            restart_ok++;
        }
        one_pass_edges += edges_one;
        restart_edges += edges_many;
        if (count == n) {
            singletons++;
        }
    }

    std::cout << "over " << trials << " random graphs on up to 7 nodes:\\n";
    std::cout << "  one pass matched the definition          " << std::setw(7) << labels_ok << "\\n";
    std::cout << "  a search per node matched it too         " << std::setw(7) << restart_ok << "\\n";
    std::cout << "  edge visits, one pass against per node   " << std::setw(7) << one_pass_edges
              << std::setw(9) << restart_edges << "\\n";
    std::cout << "  graphs that were all singletons          " << std::setw(7) << singletons << "\\n";
    std::cout << "\\n";
    std::cout << "Both loops are correct, so this is a cost lesson rather than a\\n";
    std::cout << "correctness one -- but the cost is the reason the algorithm is considered\\n";
    std::cout << "linear at all. Carrying one visited array across every walk means each\\n";
    std::cout << "edge is looked at once for the whole run, whatever the number of\\n";
    std::cout << "components. Starting a fresh search from every node means each node pays\\n";
    std::cout << "for a walk of its own component, so the total is n times the component\\n";
    std::cout << "size rather than the graph size. On the ring of 800 above that is 1,600\\n";
    std::cout << "edge visits against 1,280,000 -- one component, and every node paying for\\n";
    std::cout << "a walk of the whole thing.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Connected components: the first thing worth doing with a traversal once you
// have one.
//
// The whole algorithm is a loop around the search. Walk from node 0; whatever
// it reached is one component; find the lowest node it did not reach and walk
// again. The visited array is *not* cleared between walks -- that single line is
// what makes the total cost one traversal rather than one per component.
//
// The example counts components that way and scores it against the definition:
// two nodes are in the same component when one can reach the other, computed by
// a separate search per node.

fn build(n: usize, edges: &[(usize, usize)]) -> Vec<Vec<usize>> {
    let mut neighbours = vec![Vec::new(); n];
    for &(u, v) in edges {
        neighbours[u].push(v);
        neighbours[v].push(u);
    }
    neighbours
}

/// One label per node, and the number of labels. Visited is never cleared.
fn label_components(neighbours: &[Vec<usize>]) -> (Vec<i32>, i32, i64) {
    let n = neighbours.len();
    let mut label = vec![-1i32; n];
    let mut seen_edges = 0i64;
    let mut count = 0;
    for start in 0..n {
        if label[start] >= 0 {
            continue;
        }
        let mut queue = vec![start];
        label[start] = count;
        let mut head = 0;
        while head < queue.len() {
            let v = queue[head];
            head += 1;
            for i in 0..neighbours[v].len() {
                let u = neighbours[v][i];
                seen_edges += 1;
                if label[u] < 0 {
                    label[u] = count;
                    queue.push(u);
                }
            }
        }
        count += 1;
    }
    (label, count, seen_edges)
}

/// A fresh search from every node. Same labels, and the work multiplies.
fn label_components_per_node(neighbours: &[Vec<usize>]) -> (Vec<i32>, i32, i64) {
    let n = neighbours.len();
    let mut label = vec![-1i32; n];
    let mut seen_edges = 0i64;
    let mut count = 0;
    for start in 0..n {
        let mut reached = vec![false; n];
        let mut queue = vec![start];
        reached[start] = true;
        let mut head = 0;
        while head < queue.len() {
            let v = queue[head];
            head += 1;
            for i in 0..neighbours[v].len() {
                let u = neighbours[v][i];
                seen_edges += 1;
                if !reached[u] {
                    reached[u] = true;
                    queue.push(u);
                }
            }
        }
        if label[start] >= 0 {
            continue;
        }
        for v in 0..n {
            if reached[v] {
                label[v] = count;
            }
        }
        count += 1;
    }
    (label, count, seen_edges)
}

/// One search, one question. The definition of "same component".
fn reaches(neighbours: &[Vec<usize>], start: usize, target: usize) -> bool {
    let n = neighbours.len();
    let mut seen = vec![false; n];
    seen[start] = true;
    let mut queue = vec![start];
    let mut head = 0;
    while head < queue.len() {
        let v = queue[head];
        head += 1;
        if v == target {
            return true;
        }
        for i in 0..neighbours[v].len() {
            let u = neighbours[v][i];
            if !seen[u] {
                seen[u] = true;
                queue.push(u);
            }
        }
    }
    false
}

/// Group nodes by mutual reachability, the slow and obviously correct way.
fn count_by_definition(neighbours: &[Vec<usize>]) -> (Vec<i32>, i32) {
    let n = neighbours.len();
    let mut group = vec![-1i32; n];
    let mut count = 0;
    for v in 0..n {
        if group[v] >= 0 {
            continue;
        }
        for u in v..n {
            if group[u] < 0 && reaches(neighbours, v, u) {
                group[u] = count;
            }
        }
        count += 1;
    }
    (group, count)
}

fn same(a: &[i32], b: &[i32]) -> bool {
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

fn show(values: &[i32]) -> String {
    let parts: Vec<String> = values.iter().map(|v| v.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

/// k separate two-node components. Many components, each of them tiny.
fn isolated_edges(k: usize) -> (usize, Vec<(usize, usize)>) {
    (2 * k, (0..k).map(|i| (2 * i, 2 * i + 1)).collect())
}

/// One component holding everything.
fn one_big_ring(n: usize) -> (usize, Vec<(usize, usize)>) {
    (n, (0..n).map(|v| (v, (v + 1) % n)).collect())
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
    let sizes: Vec<usize> = vec![6, 5, 6, 7];
    let cases: Vec<Vec<(usize, usize)>> = vec![
        vec![(0, 1), (1, 2), (3, 4)],
        vec![(0, 1), (1, 2), (2, 3), (3, 4)],
        vec![],
        vec![(0, 1), (2, 3), (4, 5), (5, 6), (6, 4)],
    ];

    println!("{}{}{}", pad_right("edges", 36), pad_right("labels", 24), "components");
    for (c, edges) in cases.iter().enumerate() {
        let neighbours = build(sizes[c], edges);
        let (label, count, _) = label_components(&neighbours);
        let (truth, truth_count) = count_by_definition(&neighbours);
        if !same(&label, &truth) || count != truth_count {
            println!("MISMATCH");
        }
        let parts: Vec<String> = edges.iter().map(|&(u, v)| format!("{}-{}", u, v)).collect();
        let shown = format!("[{}]", parts.join(", "));
        println!(
            "{}{}{}",
            pad_right(&shown, 36),
            pad_right(&show(&label), 24),
            count
        );
    }
    println!();

    let (pairs_n, pairs_edges) = isolated_edges(400);
    let (ring_n, ring_edges) = one_big_ring(800);
    let shape_names = ["400 isolated pairs", "ring of 800", "800 lone nodes"];
    let shape_counts: Vec<usize> = vec![pairs_n, ring_n, 800];
    let shape_edges: Vec<Vec<(usize, usize)>> = vec![pairs_edges, ring_edges, vec![]];

    println!(
        "{}{}{}{}{}",
        pad_right("shape", 28),
        pad_left("nodes", 7),
        pad_left("components", 12),
        pad_left("edges, one pass", 17),
        pad_left("edges, per node", 17)
    );
    for (c, name) in shape_names.iter().enumerate() {
        let neighbours = build(shape_counts[c], &shape_edges[c]);
        let (_, count_one, edges_one) = label_components(&neighbours);
        let (_, count_many, edges_many) = label_components_per_node(&neighbours);
        if count_one != count_many {
            println!("MISMATCH");
        }
        println!(
            "{}{}{}{}{}",
            pad_right(name, 28),
            pad_left(&shape_counts[c].to_string(), 7),
            pad_left(&count_one.to_string(), 12),
            pad_left(&edges_one.to_string(), 17),
            pad_left(&edges_many.to_string(), 17)
        );
    }
    println!();

    let mut rng = Rng { seed: 1 };
    let trials = 3000;
    let mut labels_ok = 0;
    let mut restart_ok = 0;
    let mut one_pass_edges = 0i64;
    let mut restart_edges = 0i64;
    let mut singletons = 0;
    for _ in 0..trials {
        let n = (2 + rng.next(6)) as usize;
        let mut edges: Vec<(usize, usize)> = Vec::new();
        for u in 0..n {
            for v in (u + 1)..n {
                if rng.next(5) == 0 {
                    edges.push((u, v));
                }
            }
        }
        let neighbours = build(n, &edges);
        let (label, count, edges_one) = label_components(&neighbours);
        let (restart_label, restart_count, edges_many) = label_components_per_node(&neighbours);
        let (truth, truth_count) = count_by_definition(&neighbours);
        if same(&label, &truth) && count == truth_count {
            labels_ok += 1;
        }
        if same(&restart_label, &truth) && restart_count == truth_count {
            restart_ok += 1;
        }
        one_pass_edges += edges_one;
        restart_edges += edges_many;
        if count == n as i32 {
            singletons += 1;
        }
    }

    println!("over {} random graphs on up to 7 nodes:", trials);
    println!("  one pass matched the definition          {}", pad_left(&labels_ok.to_string(), 7));
    println!("  a search per node matched it too         {}", pad_left(&restart_ok.to_string(), 7));
    println!(
        "  edge visits, one pass against per node   {}{}",
        pad_left(&one_pass_edges.to_string(), 7),
        pad_left(&restart_edges.to_string(), 9)
    );
    println!("  graphs that were all singletons          {}", pad_left(&singletons.to_string(), 7));
    println!();
    println!("Both loops are correct, so this is a cost lesson rather than a");
    println!("correctness one -- but the cost is the reason the algorithm is considered");
    println!("linear at all. Carrying one visited array across every walk means each");
    println!("edge is looked at once for the whole run, whatever the number of");
    println!("components. Starting a fresh search from every node means each node pays");
    println!("for a walk of its own component, so the total is n times the component");
    println!("size rather than the graph size. On the ring of 800 above that is 1,600");
    println!("edge visits against 1,280,000 -- one component, and every node paying for");
    println!("a walk of the whole thing.");
}
`,
            },
            {
              lang: "go",
              code: `// Connected components: the first thing worth doing with a traversal once you
// have one.
//
// The whole algorithm is a loop around the search. Walk from node 0; whatever
// it reached is one component; find the lowest node it did not reach and walk
// again. The visited array is *not* cleared between walks -- that single line is
// what makes the total cost one traversal rather than one per component.
//
// The example counts components that way and scores it against the definition:
// two nodes are in the same component when one can reach the other, computed by
// a separate search per node.

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
		neighbours[e.to] = append(neighbours[e.to], e.from)
	}
	return neighbours
}

// One label per node, and the number of labels. Visited is never cleared.
func labelComponents(neighbours [][]int) ([]int, int, int64) {
	n := len(neighbours)
	label := make([]int, n)
	for i := range label {
		label[i] = -1
	}
	var seenEdges int64
	count := 0
	for start := 0; start < n; start++ {
		if label[start] >= 0 {
			continue
		}
		queue := []int{start}
		label[start] = count
		head := 0
		for head < len(queue) {
			v := queue[head]
			head++
			for _, u := range neighbours[v] {
				seenEdges++
				if label[u] < 0 {
					label[u] = count
					queue = append(queue, u)
				}
			}
		}
		count++
	}
	return label, count, seenEdges
}

// A fresh search from every node. Same labels, and the work multiplies.
func labelComponentsPerNode(neighbours [][]int) ([]int, int, int64) {
	n := len(neighbours)
	label := make([]int, n)
	for i := range label {
		label[i] = -1
	}
	var seenEdges int64
	count := 0
	for start := 0; start < n; start++ {
		reached := make([]bool, n)
		queue := []int{start}
		reached[start] = true
		head := 0
		for head < len(queue) {
			v := queue[head]
			head++
			for _, u := range neighbours[v] {
				seenEdges++
				if !reached[u] {
					reached[u] = true
					queue = append(queue, u)
				}
			}
		}
		if label[start] >= 0 {
			continue
		}
		for v := 0; v < n; v++ {
			if reached[v] {
				label[v] = count
			}
		}
		count++
	}
	return label, count, seenEdges
}

// One search, one question. The definition of "same component".
func reaches(neighbours [][]int, start, target int) bool {
	n := len(neighbours)
	seen := make([]bool, n)
	seen[start] = true
	queue := []int{start}
	head := 0
	for head < len(queue) {
		v := queue[head]
		head++
		if v == target {
			return true
		}
		for _, u := range neighbours[v] {
			if !seen[u] {
				seen[u] = true
				queue = append(queue, u)
			}
		}
	}
	return false
}

// Group nodes by mutual reachability, the slow and obviously correct way.
func countByDefinition(neighbours [][]int) ([]int, int) {
	n := len(neighbours)
	group := make([]int, n)
	for i := range group {
		group[i] = -1
	}
	count := 0
	for v := 0; v < n; v++ {
		if group[v] >= 0 {
			continue
		}
		for u := v; u < n; u++ {
			if group[u] < 0 && reaches(neighbours, v, u) {
				group[u] = count
			}
		}
		count++
	}
	return group, count
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

func show(values []int) string {
	parts := make([]string, len(values))
	for i, v := range values {
		parts[i] = fmt.Sprintf("%d", v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

// k separate two-node components. Many components, each of them tiny.
func isolatedEdges(k int) (int, []edge) {
	edges := []edge{}
	for i := 0; i < k; i++ {
		edges = append(edges, edge{2 * i, 2*i + 1})
	}
	return 2 * k, edges
}

// One component holding everything.
func oneBigRing(n int) (int, []edge) {
	edges := []edge{}
	for v := 0; v < n; v++ {
		edges = append(edges, edge{v, (v + 1) % n})
	}
	return n, edges
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	sizes := []int{6, 5, 6, 7}
	cases := [][]edge{
		{{0, 1}, {1, 2}, {3, 4}},
		{{0, 1}, {1, 2}, {2, 3}, {3, 4}},
		{},
		{{0, 1}, {2, 3}, {4, 5}, {5, 6}, {6, 4}},
	}

	fmt.Printf("%-36s%-24s%s\\n", "edges", "labels", "components")
	for c, edges := range cases {
		neighbours := build(sizes[c], edges)
		label, count, _ := labelComponents(neighbours)
		truth, truthCount := countByDefinition(neighbours)
		if !same(label, truth) || count != truthCount {
			fmt.Println("MISMATCH")
		}
		parts := make([]string, len(edges))
		for i, e := range edges {
			parts[i] = fmt.Sprintf("%d-%d", e.from, e.to)
		}
		shown := "[" + strings.Join(parts, ", ") + "]"
		fmt.Printf("%-36s%-24s%d\\n", shown, show(label), count)
	}
	fmt.Println()

	pairsN, pairsEdges := isolatedEdges(400)
	ringN, ringEdges := oneBigRing(800)
	shapeNames := []string{"400 isolated pairs", "ring of 800", "800 lone nodes"}
	shapeCounts := []int{pairsN, ringN, 800}
	shapeEdges := [][]edge{pairsEdges, ringEdges, {}}

	fmt.Printf("%-28s%7s%12s%17s%17s\\n", "shape", "nodes", "components",
		"edges, one pass", "edges, per node")
	for c, name := range shapeNames {
		neighbours := build(shapeCounts[c], shapeEdges[c])
		_, countOne, edgesOne := labelComponents(neighbours)
		_, countMany, edgesMany := labelComponentsPerNode(neighbours)
		if countOne != countMany {
			fmt.Println("MISMATCH")
		}
		fmt.Printf("%-28s%7d%12d%17d%17d\\n", name, shapeCounts[c], countOne, edgesOne, edgesMany)
	}
	fmt.Println()

	trials := 3000
	labelsOk := 0
	restartOk := 0
	var onePassEdges int64
	var restartEdges int64
	singletons := 0
	for t := 0; t < trials; t++ {
		n := 2 + rand(6)
		edges := []edge{}
		for u := 0; u < n; u++ {
			for v := u + 1; v < n; v++ {
				if rand(5) == 0 {
					edges = append(edges, edge{u, v})
				}
			}
		}
		neighbours := build(n, edges)
		label, count, edgesOne := labelComponents(neighbours)
		restartLabel, restartCount, edgesMany := labelComponentsPerNode(neighbours)
		truth, truthCount := countByDefinition(neighbours)
		if same(label, truth) && count == truthCount {
			labelsOk++
		}
		if same(restartLabel, truth) && restartCount == truthCount {
			restartOk++
		}
		onePassEdges += edgesOne
		restartEdges += edgesMany
		if count == n {
			singletons++
		}
	}

	fmt.Printf("over %d random graphs on up to 7 nodes:\\n", trials)
	fmt.Printf("  one pass matched the definition          %7d\\n", labelsOk)
	fmt.Printf("  a search per node matched it too         %7d\\n", restartOk)
	fmt.Printf("  edge visits, one pass against per node   %7d%9d\\n", onePassEdges, restartEdges)
	fmt.Printf("  graphs that were all singletons          %7d\\n", singletons)
	fmt.Println()
	fmt.Println("Both loops are correct, so this is a cost lesson rather than a")
	fmt.Println("correctness one -- but the cost is the reason the algorithm is considered")
	fmt.Println("linear at all. Carrying one visited array across every walk means each")
	fmt.Println("edge is looked at once for the whole run, whatever the number of")
	fmt.Println("components. Starting a fresh search from every node means each node pays")
	fmt.Println("for a walk of its own component, so the total is n times the component")
	fmt.Println("size rather than the graph size. On the ring of 800 above that is 1,600")
	fmt.Println("edge visits against 1,280,000 -- one component, and every node paying for")
	fmt.Println("a walk of the whole thing.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Clearing the visited array between components",
          body: "It is still correct and it stops being linear. A fresh search from every node costs n times the component size instead of the graph size -- 1,280,000 edge visits against 1,600 on a ring of 800. The shared array is the algorithm; the loop around it is bookkeeping.",
        },
        {
          title: "Counting components by asking every pair",
          body: "Grouping nodes by \"can this one reach that one\" is the definition and a fine way to check a small implementation, which is what the example uses it for. It is a search per pair, so it is not the way to compute the answer on anything real.",
        },
      ],
    },
    {
      id: "the-same-loop-on-a-grid",
      heading: "The same loop on a grid",
      body: [
        "Flood fill is the same algorithm on a grid, and the only thing that changes is that the graph is never built. A cell is a node; two cells are joined when they are next to each other and both are land. Counting islands, filling a region with a colour, and measuring the largest connected blob are all the component loop with the neighbour function replaced.",
        "What changes with a grid is that one decision stops being written down anywhere. **What does \"next to\" mean?** Four neighbours or eight? The problem is supposed to say and frequently does not, and the two give different answers on the same map.",
        "How different: over 3,000 random maps of up to five by five, the four-way and eight-way counts disagreed on 1,342 of them. Neither is wrong \u2014 they are correct about two different graphs, and only one of those graphs is the one in the problem.",
        "There is a fact worth carrying to remember which way round it goes: eight-way never finds *more* islands than four-way, on any of the 3,000 maps. Adding the diagonals can only join components; it can never split one. So the diagonal reading always gives a count that is the same or smaller.",
        "And one practical warning that comes straight from the depth-first lesson. A recursive flood fill needs one frame per cell on the current path, so on a solid 200 by 200 map it needs 40,000 frames \u2014 the whole grid \u2014 which is past what a default stack will take. Grid fills are exactly the case where the input can be long and thin, and the iterative version is worth writing.",
      ],
      examples: [
        {
          id: "four-neighbours-or-eight",
          title: "Islands counted both ways, and the depth a solid grid demands",
          lang: "python",
          code: `# Flood fill is connected components on a grid, and the only thing that changes
# is that the graph is never built. A cell is a node; two cells are joined when
# they are next to each other and both are land.
#
# The decision that is not written down anywhere in the problem statement is
# what "next to" means. Four neighbours or eight? The two give different island
# counts on the same map, and neither is more correct -- the problem is supposed
# to say, and often does not.
#
# The example counts islands both ways, checks both against an independent
# pairwise-reachability count, and measures how often they disagree.

MOVES_4 = [(-1, 0), (1, 0), (0, -1), (0, 1)]
MOVES_8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1),
           (0, 1), (1, -1), (1, 0), (1, 1)]


def count_islands(grid, moves):
    """One label per land cell, and the number of labels."""
    rows = len(grid)
    cols = len(grid[0])
    seen = [[False] * cols for _ in range(rows)]
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != "#" or seen[r][c]:
                continue
            count += 1
            stack = [(r, c)]
            seen[r][c] = True
            while stack:
                y, x = stack.pop()
                for dy, dx in moves:
                    ny = y + dy
                    nx = x + dx
                    if 0 <= ny < rows and 0 <= nx < cols:
                        if grid[ny][nx] == "#" and not seen[ny][nx]:
                            seen[ny][nx] = True
                            stack.append((ny, nx))
    return count


def count_islands_by_pairs(grid, moves):
    """Group land cells by mutual reachability. Slow, obviously right."""
    rows = len(grid)
    cols = len(grid[0])
    cells = []
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "#":
                cells.append((r, c))
    group = [-1] * len(cells)
    count = 0
    for i in range(len(cells)):
        if group[i] >= 0:
            continue
        group[i] = count
        changed = True
        while changed:
            changed = False
            for a in range(len(cells)):
                if group[a] != count:
                    continue
                for b in range(len(cells)):
                    if group[b] >= 0:
                        continue
                    dy = cells[b][0] - cells[a][0]
                    dx = cells[b][1] - cells[a][1]
                    joined = False
                    for my, mx in moves:
                        if my == dy and mx == dx:
                            joined = True
                    if joined:
                        group[b] = count
                        changed = True
        count += 1
    return count


def deepest_fill(grid, moves):
    """How deep a recursive flood fill would go. Measured with a stack."""
    rows = len(grid)
    cols = len(grid[0])
    seen = [[False] * cols for _ in range(rows)]
    deepest = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != "#" or seen[r][c]:
                continue
            stack = [(r, c, 1)]
            while stack:
                y, x, depth = stack.pop()
                if seen[y][x]:
                    continue
                seen[y][x] = True
                if depth > deepest:
                    deepest = depth
                for dy, dx in moves:
                    ny = y + dy
                    nx = x + dx
                    if 0 <= ny < rows and 0 <= nx < cols:
                        if grid[ny][nx] == "#" and not seen[ny][nx]:
                            stack.append((ny, nx, depth + 1))
    return deepest


MAPS = [
    ["#..#", ".##.", "#..#", "#..#"],
    ["#.#", ".#.", "#.#"],
    ["####", "#..#", "#..#", "####"],
    ["#...", "....", "...#", "..#."],
]

print(f"{'map':<24}{'islands, 4 ways':>17}{'islands, 8 ways':>17}{'by pairs, 4':>13}")
for grid in MAPS:
    shown = "/".join(grid)
    four = count_islands(grid, MOVES_4)
    eight = count_islands(grid, MOVES_8)
    print(f"{shown:<24}{four:>17}{eight:>17}"
          f"{count_islands_by_pairs(grid, MOVES_4):>13}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
four_ok = 0
eight_ok = 0
disagreed = 0
eight_more = 0
for _ in range(TRIALS):
    rows = 2 + rand(4)
    cols = 2 + rand(4)
    grid = []
    for r in range(rows):
        row = ""
        for c in range(cols):
            row += "#" if rand(2) == 0 else "."
        grid.append(row)
    four = count_islands(grid, MOVES_4)
    eight = count_islands(grid, MOVES_8)
    if four == count_islands_by_pairs(grid, MOVES_4):
        four_ok += 1
    if eight == count_islands_by_pairs(grid, MOVES_8):
        eight_ok += 1
    if four != eight:
        disagreed += 1
    if eight > four:
        eight_more += 1

print(f"over {TRIALS} random maps of up to 5 by 5:")
print(f"  four-way count matched the definition  {four_ok:>6}")
print(f"  eight-way count matched the definition {eight_ok:>6}")
print(f"  the two counts disagreed               {disagreed:>6}")
print(f"  eight-way found more islands than four {eight_more:>6}")
print()
print("The two counts differ on well over a third of random maps, and eight-way")
print("never finds more islands than four-way -- adding the diagonals can only")
print("join components, never split them. That is the useful way to remember")
print("which is which, and it is also the reason the question has to be settled")
print("before the code is written rather than after: both answers are correct")
print("about the graph they describe, and only one of them is the graph in the")
print("problem.")
print()
print("The recursion depth is the other thing worth knowing about flood fill.")
print("On a solid 200 by 200 map a recursive fill would need this many frames:")
solid = ["#" * 200 for _ in range(200)]
print(f"  four-way  {deepest_fill(solid, MOVES_4)}")
print(f"  eight-way {deepest_fill(solid, MOVES_8)}")
print("which is the whole grid, and past what a default stack will take.")
`,
          output: `map                       islands, 4 ways  islands, 8 ways  by pairs, 4
#..#/.##./#..#/#..#                     5                1            5
#.#/.#./#.#                             5                1            5
####/#..#/#..#/####                     1                1            1
#.../..../...#/..#.                     3                2            3

over 3000 random maps of up to 5 by 5:
  four-way count matched the definition    3000
  eight-way count matched the definition   3000
  the two counts disagreed                 1342
  eight-way found more islands than four      0

The two counts differ on well over a third of random maps, and eight-way
never finds more islands than four-way -- adding the diagonals can only
join components, never split them. That is the useful way to remember
which is which, and it is also the reason the question has to be settled
before the code is written rather than after: both answers are correct
about the graph they describe, and only one of them is the graph in the
problem.

The recursion depth is the other thing worth knowing about flood fill.
On a solid 200 by 200 map a recursive fill would need this many frames:
  four-way  40000
  eight-way 40000
which is the whole grid, and past what a default stack will take.`,
          explanation:
            "Islands counted with four neighbours and with eight, each checked against an independent pairwise grouping, plus the recursion depth a solid grid would demand.",
          alternates: [
            {
              lang: "javascript",
              code: `// Flood fill is connected components on a grid, and the only thing that changes
// is that the graph is never built. A cell is a node; two cells are joined when
// they are next to each other and both are land.
//
// The decision that is not written down anywhere in the problem statement is
// what "next to" means. Four neighbours or eight? The two give different island
// counts on the same map, and neither is more correct -- the problem is supposed
// to say, and often does not.
//
// The example counts islands both ways, checks both against an independent
// pairwise-reachability count, and measures how often they disagree.

const MOVES_4 = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const MOVES_8 = [
  [-1, -1], [-1, 0], [-1, 1], [0, -1],
  [0, 1], [1, -1], [1, 0], [1, 1],
];

/** One label per land cell, and the number of labels. */
function countIslands(grid, moves) {
  const rows = grid.length;
  const cols = grid[0].length;
  const seen = Array.from({ length: rows }, () => new Array(cols).fill(false));
  let count = 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (grid[r][c] !== "#" || seen[r][c]) continue;
      count += 1;
      const stack = [[r, c]];
      seen[r][c] = true;
      while (stack.length > 0) {
        const [y, x] = stack.pop();
        for (const [dy, dx] of moves) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
            if (grid[ny][nx] === "#" && !seen[ny][nx]) {
              seen[ny][nx] = true;
              stack.push([ny, nx]);
            }
          }
        }
      }
    }
  }
  return count;
}

/** Group land cells by mutual reachability. Slow, obviously right. */
function countIslandsByPairs(grid, moves) {
  const rows = grid.length;
  const cols = grid[0].length;
  const cells = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (grid[r][c] === "#") cells.push([r, c]);
    }
  }
  const group = new Array(cells.length).fill(-1);
  let count = 0;
  for (let i = 0; i < cells.length; i += 1) {
    if (group[i] >= 0) continue;
    group[i] = count;
    let changed = true;
    while (changed) {
      changed = false;
      for (let a = 0; a < cells.length; a += 1) {
        if (group[a] !== count) continue;
        for (let b = 0; b < cells.length; b += 1) {
          if (group[b] >= 0) continue;
          const dy = cells[b][0] - cells[a][0];
          const dx = cells[b][1] - cells[a][1];
          let joined = false;
          for (const [my, mx] of moves) {
            if (my === dy && mx === dx) joined = true;
          }
          if (joined) {
            group[b] = count;
            changed = true;
          }
        }
      }
    }
    count += 1;
  }
  return count;
}

/** How deep a recursive flood fill would go. Measured with a stack. */
function deepestFill(grid, moves) {
  const rows = grid.length;
  const cols = grid[0].length;
  const seen = Array.from({ length: rows }, () => new Array(cols).fill(false));
  let deepest = 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (grid[r][c] !== "#" || seen[r][c]) continue;
      const stack = [[r, c, 1]];
      while (stack.length > 0) {
        const [y, x, depth] = stack.pop();
        if (seen[y][x]) continue;
        seen[y][x] = true;
        if (depth > deepest) deepest = depth;
        for (const [dy, dx] of moves) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
            if (grid[ny][nx] === "#" && !seen[ny][nx]) stack.push([ny, nx, depth + 1]);
          }
        }
      }
    }
  }
  return deepest;
}

const padEnd = (v, w) => String(v).padEnd(w);
const pad = (v, w) => String(v).padStart(w);

const MAPS = [
  ["#..#", ".##.", "#..#", "#..#"],
  ["#.#", ".#.", "#.#"],
  ["####", "#..#", "#..#", "####"],
  ["#...", "....", "...#", "..#."],
];

console.log(
  padEnd("map", 24) + pad("islands, 4 ways", 17) + pad("islands, 8 ways", 17) + pad("by pairs, 4", 13)
);
for (const grid of MAPS) {
  const shown = grid.join("/");
  const four = countIslands(grid, MOVES_4);
  const eight = countIslands(grid, MOVES_8);
  console.log(
    padEnd(shown, 24) + pad(four, 17) + pad(eight, 17) + pad(countIslandsByPairs(grid, MOVES_4), 13)
  );
}
console.log();

// The same linear congruential generator in every language, so the random
// maps below are the same maps whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 1n;
function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const TRIALS = 3000;
let fourOk = 0;
let eightOk = 0;
let disagreed = 0;
let eightMore = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const rows = 2 + rand(4);
  const cols = 2 + rand(4);
  const grid = [];
  for (let r = 0; r < rows; r += 1) {
    let row = "";
    for (let c = 0; c < cols; c += 1) row += rand(2) === 0 ? "#" : ".";
    grid.push(row);
  }
  const four = countIslands(grid, MOVES_4);
  const eight = countIslands(grid, MOVES_8);
  if (four === countIslandsByPairs(grid, MOVES_4)) fourOk += 1;
  if (eight === countIslandsByPairs(grid, MOVES_8)) eightOk += 1;
  if (four !== eight) disagreed += 1;
  if (eight > four) eightMore += 1;
}

console.log(\`over \${TRIALS} random maps of up to 5 by 5:\`);
console.log(\`  four-way count matched the definition  \${pad(fourOk, 6)}\`);
console.log(\`  eight-way count matched the definition \${pad(eightOk, 6)}\`);
console.log(\`  the two counts disagreed               \${pad(disagreed, 6)}\`);
console.log(\`  eight-way found more islands than four \${pad(eightMore, 6)}\`);
console.log();
console.log("The two counts differ on well over a third of random maps, and eight-way");
console.log("never finds more islands than four-way -- adding the diagonals can only");
console.log("join components, never split them. That is the useful way to remember");
console.log("which is which, and it is also the reason the question has to be settled");
console.log("before the code is written rather than after: both answers are correct");
console.log("about the graph they describe, and only one of them is the graph in the");
console.log("problem.");
console.log();
console.log("The recursion depth is the other thing worth knowing about flood fill.");
console.log("On a solid 200 by 200 map a recursive fill would need this many frames:");
const solid = [];
for (let r = 0; r < 200; r += 1) solid.push("#".repeat(200));
console.log(\`  four-way  \${deepestFill(solid, MOVES_4)}\`);
console.log(\`  eight-way \${deepestFill(solid, MOVES_8)}\`);
console.log("which is the whole grid, and past what a default stack will take.");
`,
            },
            {
              lang: "typescript",
              code: `// Flood fill is connected components on a grid, and the only thing that changes
// is that the graph is never built. A cell is a node; two cells are joined when
// they are next to each other and both are land.
//
// The decision that is not written down anywhere in the problem statement is
// what "next to" means. Four neighbours or eight? The two give different island
// counts on the same map, and neither is more correct -- the problem is supposed
// to say, and often does not.
//
// The example counts islands both ways, checks both against an independent
// pairwise-reachability count, and measures how often they disagree.

type Move = [number, number];

const MOVES_4: Move[] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const MOVES_8: Move[] = [
  [-1, -1], [-1, 0], [-1, 1], [0, -1],
  [0, 1], [1, -1], [1, 0], [1, 1],
];

/** One label per land cell, and the number of labels. */
function countIslands(grid: string[], moves: Move[]): number {
  const rows = grid.length;
  const cols = grid[0].length;
  const seen: boolean[][] = Array.from({ length: rows }, () => new Array(cols).fill(false));
  let count = 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (grid[r][c] !== "#" || seen[r][c]) continue;
      count += 1;
      const stack: Move[] = [[r, c]];
      seen[r][c] = true;
      while (stack.length > 0) {
        const [y, x] = stack.pop() as Move;
        for (const [dy, dx] of moves) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
            if (grid[ny][nx] === "#" && !seen[ny][nx]) {
              seen[ny][nx] = true;
              stack.push([ny, nx]);
            }
          }
        }
      }
    }
  }
  return count;
}

/** Group land cells by mutual reachability. Slow, obviously right. */
function countIslandsByPairs(grid: string[], moves: Move[]): number {
  const rows = grid.length;
  const cols = grid[0].length;
  const cells: Move[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (grid[r][c] === "#") cells.push([r, c]);
    }
  }
  const group = new Array(cells.length).fill(-1);
  let count = 0;
  for (let i = 0; i < cells.length; i += 1) {
    if (group[i] >= 0) continue;
    group[i] = count;
    let changed = true;
    while (changed) {
      changed = false;
      for (let a = 0; a < cells.length; a += 1) {
        if (group[a] !== count) continue;
        for (let b = 0; b < cells.length; b += 1) {
          if (group[b] >= 0) continue;
          const dy = cells[b][0] - cells[a][0];
          const dx = cells[b][1] - cells[a][1];
          let joined = false;
          for (const [my, mx] of moves) {
            if (my === dy && mx === dx) joined = true;
          }
          if (joined) {
            group[b] = count;
            changed = true;
          }
        }
      }
    }
    count += 1;
  }
  return count;
}

/** How deep a recursive flood fill would go. Measured with a stack. */
function deepestFill(grid: string[], moves: Move[]): number {
  const rows = grid.length;
  const cols = grid[0].length;
  const seen: boolean[][] = Array.from({ length: rows }, () => new Array(cols).fill(false));
  let deepest = 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (grid[r][c] !== "#" || seen[r][c]) continue;
      const stack: number[][] = [[r, c, 1]];
      while (stack.length > 0) {
        const [y, x, depth] = stack.pop() as number[];
        if (seen[y][x]) continue;
        seen[y][x] = true;
        if (depth > deepest) deepest = depth;
        for (const [dy, dx] of moves) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
            if (grid[ny][nx] === "#" && !seen[ny][nx]) stack.push([ny, nx, depth + 1]);
          }
        }
      }
    }
  }
  return deepest;
}

const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const pad = (v: string | number, w: number): string => String(v).padStart(w);

const MAPS: string[][] = [
  ["#..#", ".##.", "#..#", "#..#"],
  ["#.#", ".#.", "#.#"],
  ["####", "#..#", "#..#", "####"],
  ["#...", "....", "...#", "..#."],
];

console.log(
  padEnd("map", 24) + pad("islands, 4 ways", 17) + pad("islands, 8 ways", 17) + pad("by pairs, 4", 13)
);
for (const grid of MAPS) {
  const shown = grid.join("/");
  const four = countIslands(grid, MOVES_4);
  const eight = countIslands(grid, MOVES_8);
  console.log(
    padEnd(shown, 24) + pad(four, 17) + pad(eight, 17) + pad(countIslandsByPairs(grid, MOVES_4), 13)
  );
}
console.log();

// The same linear congruential generator in every language, so the random
// maps below are the same maps whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 1n;
function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const TRIALS = 3000;
let fourOk = 0;
let eightOk = 0;
let disagreed = 0;
let eightMore = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const rows = 2 + rand(4);
  const cols = 2 + rand(4);
  const grid: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    let row = "";
    for (let c = 0; c < cols; c += 1) row += rand(2) === 0 ? "#" : ".";
    grid.push(row);
  }
  const four = countIslands(grid, MOVES_4);
  const eight = countIslands(grid, MOVES_8);
  if (four === countIslandsByPairs(grid, MOVES_4)) fourOk += 1;
  if (eight === countIslandsByPairs(grid, MOVES_8)) eightOk += 1;
  if (four !== eight) disagreed += 1;
  if (eight > four) eightMore += 1;
}

console.log(\`over \${TRIALS} random maps of up to 5 by 5:\`);
console.log(\`  four-way count matched the definition  \${pad(fourOk, 6)}\`);
console.log(\`  eight-way count matched the definition \${pad(eightOk, 6)}\`);
console.log(\`  the two counts disagreed               \${pad(disagreed, 6)}\`);
console.log(\`  eight-way found more islands than four \${pad(eightMore, 6)}\`);
console.log();
console.log("The two counts differ on well over a third of random maps, and eight-way");
console.log("never finds more islands than four-way -- adding the diagonals can only");
console.log("join components, never split them. That is the useful way to remember");
console.log("which is which, and it is also the reason the question has to be settled");
console.log("before the code is written rather than after: both answers are correct");
console.log("about the graph they describe, and only one of them is the graph in the");
console.log("problem.");
console.log();
console.log("The recursion depth is the other thing worth knowing about flood fill.");
console.log("On a solid 200 by 200 map a recursive fill would need this many frames:");
const solid: string[] = [];
for (let r = 0; r < 200; r += 1) solid.push("#".repeat(200));
console.log(\`  four-way  \${deepestFill(solid, MOVES_4)}\`);
console.log(\`  eight-way \${deepestFill(solid, MOVES_8)}\`);
console.log("which is the whole grid, and past what a default stack will take.");
`,
            },
            {
              lang: "java",
              code: `// Flood fill is connected components on a grid, and the only thing that changes
// is that the graph is never built. A cell is a node; two cells are joined when
// they are next to each other and both are land.
//
// The decision that is not written down anywhere in the problem statement is
// what "next to" means. Four neighbours or eight? The two give different island
// counts on the same map, and neither is more correct -- the problem is supposed
// to say, and often does not.
//
// The example counts islands both ways, checks both against an independent
// pairwise-reachability count, and measures how often they disagree.

import java.util.ArrayList;
import java.util.List;

public class Main {

    static final int[][] MOVES_4 = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
    static final int[][] MOVES_8 = {
        {-1, -1}, {-1, 0}, {-1, 1}, {0, -1},
        {0, 1}, {1, -1}, {1, 0}, {1, 1},
    };

    /** One label per land cell, and the number of labels. */
    static int countIslands(String[] grid, int[][] moves) {
        int rows = grid.length;
        int cols = grid[0].length();
        boolean[][] seen = new boolean[rows][cols];
        int count = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r].charAt(c) != '#' || seen[r][c]) {
                    continue;
                }
                count++;
                List<int[]> stack = new ArrayList<>();
                stack.add(new int[] {r, c});
                seen[r][c] = true;
                while (!stack.isEmpty()) {
                    int[] at = stack.remove(stack.size() - 1);
                    for (int[] move : moves) {
                        int ny = at[0] + move[0];
                        int nx = at[1] + move[1];
                        if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
                            if (grid[ny].charAt(nx) == '#' && !seen[ny][nx]) {
                                seen[ny][nx] = true;
                                stack.add(new int[] {ny, nx});
                            }
                        }
                    }
                }
            }
        }
        return count;
    }

    /** Group land cells by mutual reachability. Slow, obviously right. */
    static int countIslandsByPairs(String[] grid, int[][] moves) {
        int rows = grid.length;
        int cols = grid[0].length();
        List<int[]> cells = new ArrayList<>();
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r].charAt(c) == '#') {
                    cells.add(new int[] {r, c});
                }
            }
        }
        int[] group = new int[cells.size()];
        for (int i = 0; i < group.length; i++) {
            group[i] = -1;
        }
        int count = 0;
        for (int i = 0; i < cells.size(); i++) {
            if (group[i] >= 0) {
                continue;
            }
            group[i] = count;
            boolean changed = true;
            while (changed) {
                changed = false;
                for (int a = 0; a < cells.size(); a++) {
                    if (group[a] != count) {
                        continue;
                    }
                    for (int b = 0; b < cells.size(); b++) {
                        if (group[b] >= 0) {
                            continue;
                        }
                        int dy = cells.get(b)[0] - cells.get(a)[0];
                        int dx = cells.get(b)[1] - cells.get(a)[1];
                        boolean joined = false;
                        for (int[] move : moves) {
                            if (move[0] == dy && move[1] == dx) {
                                joined = true;
                            }
                        }
                        if (joined) {
                            group[b] = count;
                            changed = true;
                        }
                    }
                }
            }
            count++;
        }
        return count;
    }

    /** How deep a recursive flood fill would go. Measured with a stack. */
    static int deepestFill(String[] grid, int[][] moves) {
        int rows = grid.length;
        int cols = grid[0].length();
        boolean[][] seen = new boolean[rows][cols];
        int deepest = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r].charAt(c) != '#' || seen[r][c]) {
                    continue;
                }
                List<int[]> stack = new ArrayList<>();
                stack.add(new int[] {r, c, 1});
                while (!stack.isEmpty()) {
                    int[] at = stack.remove(stack.size() - 1);
                    if (seen[at[0]][at[1]]) {
                        continue;
                    }
                    seen[at[0]][at[1]] = true;
                    if (at[2] > deepest) {
                        deepest = at[2];
                    }
                    for (int[] move : moves) {
                        int ny = at[0] + move[0];
                        int nx = at[1] + move[1];
                        if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
                            if (grid[ny].charAt(nx) == '#' && !seen[ny][nx]) {
                                stack.add(new int[] {ny, nx, at[2] + 1});
                            }
                        }
                    }
                }
            }
        }
        return deepest;
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
    // maps below are the same maps whichever translation is run.
    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        String[][] maps = {
            {"#..#", ".##.", "#..#", "#..#"},
            {"#.#", ".#.", "#.#"},
            {"####", "#..#", "#..#", "####"},
            {"#...", "....", "...#", "..#."},
        };

        System.out.println(padEnd("map", 24) + pad("islands, 4 ways", 17)
                + pad("islands, 8 ways", 17) + pad("by pairs, 4", 13));
        for (String[] grid : maps) {
            StringBuilder shown = new StringBuilder();
            for (int i = 0; i < grid.length; i++) {
                if (i > 0) {
                    shown.append("/");
                }
                shown.append(grid[i]);
            }
            int four = countIslands(grid, MOVES_4);
            int eight = countIslands(grid, MOVES_8);
            System.out.println(padEnd(shown.toString(), 24) + pad(String.valueOf(four), 17)
                    + pad(String.valueOf(eight), 17)
                    + pad(String.valueOf(countIslandsByPairs(grid, MOVES_4)), 13));
        }
        System.out.println();

        int trials = 3000;
        int fourOk = 0;
        int eightOk = 0;
        int disagreed = 0;
        int eightMore = 0;
        for (int t = 0; t < trials; t++) {
            int rows = 2 + rand(4);
            int cols = 2 + rand(4);
            String[] grid = new String[rows];
            for (int r = 0; r < rows; r++) {
                StringBuilder row = new StringBuilder();
                for (int c = 0; c < cols; c++) {
                    row.append(rand(2) == 0 ? '#' : '.');
                }
                grid[r] = row.toString();
            }
            int four = countIslands(grid, MOVES_4);
            int eight = countIslands(grid, MOVES_8);
            if (four == countIslandsByPairs(grid, MOVES_4)) {
                fourOk++;
            }
            if (eight == countIslandsByPairs(grid, MOVES_8)) {
                eightOk++;
            }
            if (four != eight) {
                disagreed++;
            }
            if (eight > four) {
                eightMore++;
            }
        }

        System.out.println("over " + trials + " random maps of up to 5 by 5:");
        System.out.println("  four-way count matched the definition  " + pad(String.valueOf(fourOk), 6));
        System.out.println("  eight-way count matched the definition " + pad(String.valueOf(eightOk), 6));
        System.out.println("  the two counts disagreed               " + pad(String.valueOf(disagreed), 6));
        System.out.println("  eight-way found more islands than four " + pad(String.valueOf(eightMore), 6));
        System.out.println();
        System.out.println("The two counts differ on well over a third of random maps, and eight-way");
        System.out.println("never finds more islands than four-way -- adding the diagonals can only");
        System.out.println("join components, never split them. That is the useful way to remember");
        System.out.println("which is which, and it is also the reason the question has to be settled");
        System.out.println("before the code is written rather than after: both answers are correct");
        System.out.println("about the graph they describe, and only one of them is the graph in the");
        System.out.println("problem.");
        System.out.println();
        System.out.println("The recursion depth is the other thing worth knowing about flood fill.");
        System.out.println("On a solid 200 by 200 map a recursive fill would need this many frames:");
        String[] solid = new String[200];
        StringBuilder line = new StringBuilder();
        for (int c = 0; c < 200; c++) {
            line.append('#');
        }
        for (int r = 0; r < 200; r++) {
            solid[r] = line.toString();
        }
        System.out.println("  four-way  " + deepestFill(solid, MOVES_4));
        System.out.println("  eight-way " + deepestFill(solid, MOVES_8));
        System.out.println("which is the whole grid, and past what a default stack will take.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Flood fill is connected components on a grid, and the only thing that changes
// is that the graph is never built. A cell is a node; two cells are joined when
// they are next to each other and both are land.
//
// The decision that is not written down anywhere in the problem statement is
// what "next to" means. Four neighbours or eight? The two give different island
// counts on the same map, and neither is more correct -- the problem is supposed
// to say, and often does not.
//
// The example counts islands both ways, checks both against an independent
// pairwise-reachability count, and measures how often they disagree.

#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

using Move = std::pair<int, int>;

const std::vector<Move> MOVES_4 = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
const std::vector<Move> MOVES_8 = {
    {-1, -1}, {-1, 0}, {-1, 1}, {0, -1},
    {0, 1}, {1, -1}, {1, 0}, {1, 1},
};

// One label per land cell, and the number of labels.
int count_islands(const std::vector<std::string>& grid, const std::vector<Move>& moves) {
    int rows = static_cast<int>(grid.size());
    int cols = static_cast<int>(grid[0].size());
    std::vector<std::vector<char>> seen(rows, std::vector<char>(cols, 0));
    int count = 0;
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] != '#' || seen[r][c]) {
                continue;
            }
            count++;
            std::vector<Move> stack;
            stack.push_back(Move(r, c));
            seen[r][c] = 1;
            while (!stack.empty()) {
                Move at = stack.back();
                stack.pop_back();
                for (const Move& move : moves) {
                    int ny = at.first + move.first;
                    int nx = at.second + move.second;
                    if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
                        if (grid[ny][nx] == '#' && !seen[ny][nx]) {
                            seen[ny][nx] = 1;
                            stack.push_back(Move(ny, nx));
                        }
                    }
                }
            }
        }
    }
    return count;
}

// Group land cells by mutual reachability. Slow, obviously right.
int count_islands_by_pairs(const std::vector<std::string>& grid, const std::vector<Move>& moves) {
    int rows = static_cast<int>(grid.size());
    int cols = static_cast<int>(grid[0].size());
    std::vector<Move> cells;
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] == '#') {
                cells.push_back(Move(r, c));
            }
        }
    }
    std::vector<int> group(cells.size(), -1);
    int count = 0;
    for (size_t i = 0; i < cells.size(); i++) {
        if (group[i] >= 0) {
            continue;
        }
        group[i] = count;
        bool changed = true;
        while (changed) {
            changed = false;
            for (size_t a = 0; a < cells.size(); a++) {
                if (group[a] != count) {
                    continue;
                }
                for (size_t b = 0; b < cells.size(); b++) {
                    if (group[b] >= 0) {
                        continue;
                    }
                    int dy = cells[b].first - cells[a].first;
                    int dx = cells[b].second - cells[a].second;
                    bool joined = false;
                    for (const Move& move : moves) {
                        if (move.first == dy && move.second == dx) {
                            joined = true;
                        }
                    }
                    if (joined) {
                        group[b] = count;
                        changed = true;
                    }
                }
            }
        }
        count++;
    }
    return count;
}

// How deep a recursive flood fill would go. Measured with a stack.
int deepest_fill(const std::vector<std::string>& grid, const std::vector<Move>& moves) {
    int rows = static_cast<int>(grid.size());
    int cols = static_cast<int>(grid[0].size());
    std::vector<std::vector<char>> seen(rows, std::vector<char>(cols, 0));
    int deepest = 0;
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] != '#' || seen[r][c]) {
                continue;
            }
            std::vector<std::vector<int>> stack;
            stack.push_back({r, c, 1});
            while (!stack.empty()) {
                std::vector<int> at = stack.back();
                stack.pop_back();
                if (seen[at[0]][at[1]]) {
                    continue;
                }
                seen[at[0]][at[1]] = 1;
                if (at[2] > deepest) {
                    deepest = at[2];
                }
                for (const Move& move : moves) {
                    int ny = at[0] + move.first;
                    int nx = at[1] + move.second;
                    if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
                        if (grid[ny][nx] == '#' && !seen[ny][nx]) {
                            stack.push_back({ny, nx, at[2] + 1});
                        }
                    }
                }
            }
        }
    }
    return deepest;
}

// The same linear congruential generator in every language, so the random
// maps below are the same maps whichever translation is run.
long long seed = 1;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    std::vector<std::vector<std::string>> maps = {
        {"#..#", ".##.", "#..#", "#..#"},
        {"#.#", ".#.", "#.#"},
        {"####", "#..#", "#..#", "####"},
        {"#...", "....", "...#", "..#."},
    };

    std::cout << std::left << std::setw(24) << "map" << std::right << std::setw(17)
              << "islands, 4 ways" << std::setw(17) << "islands, 8 ways"
              << std::setw(13) << "by pairs, 4" << "\\n";
    for (const std::vector<std::string>& grid : maps) {
        std::string shown;
        for (size_t i = 0; i < grid.size(); i++) {
            if (i > 0) {
                shown += "/";
            }
            shown += grid[i];
        }
        int four = count_islands(grid, MOVES_4);
        int eight = count_islands(grid, MOVES_8);
        std::cout << std::left << std::setw(24) << shown << std::right << std::setw(17) << four
                  << std::setw(17) << eight << std::setw(13)
                  << count_islands_by_pairs(grid, MOVES_4) << "\\n";
    }
    std::cout << "\\n";

    int trials = 3000;
    int four_ok = 0;
    int eight_ok = 0;
    int disagreed = 0;
    int eight_more = 0;
    for (int t = 0; t < trials; t++) {
        int rows = 2 + rand_below(4);
        int cols = 2 + rand_below(4);
        std::vector<std::string> grid;
        for (int r = 0; r < rows; r++) {
            std::string row;
            for (int c = 0; c < cols; c++) {
                row += (rand_below(2) == 0) ? '#' : '.';
            }
            grid.push_back(row);
        }
        int four = count_islands(grid, MOVES_4);
        int eight = count_islands(grid, MOVES_8);
        if (four == count_islands_by_pairs(grid, MOVES_4)) {
            four_ok++;
        }
        if (eight == count_islands_by_pairs(grid, MOVES_8)) {
            eight_ok++;
        }
        if (four != eight) {
            disagreed++;
        }
        if (eight > four) {
            eight_more++;
        }
    }

    std::cout << "over " << trials << " random maps of up to 5 by 5:\\n";
    std::cout << "  four-way count matched the definition  " << std::setw(6) << four_ok << "\\n";
    std::cout << "  eight-way count matched the definition " << std::setw(6) << eight_ok << "\\n";
    std::cout << "  the two counts disagreed               " << std::setw(6) << disagreed << "\\n";
    std::cout << "  eight-way found more islands than four " << std::setw(6) << eight_more << "\\n";
    std::cout << "\\n";
    std::cout << "The two counts differ on well over a third of random maps, and eight-way\\n";
    std::cout << "never finds more islands than four-way -- adding the diagonals can only\\n";
    std::cout << "join components, never split them. That is the useful way to remember\\n";
    std::cout << "which is which, and it is also the reason the question has to be settled\\n";
    std::cout << "before the code is written rather than after: both answers are correct\\n";
    std::cout << "about the graph they describe, and only one of them is the graph in the\\n";
    std::cout << "problem.\\n";
    std::cout << "\\n";
    std::cout << "The recursion depth is the other thing worth knowing about flood fill.\\n";
    std::cout << "On a solid 200 by 200 map a recursive fill would need this many frames:\\n";
    std::vector<std::string> solid(200, std::string(200, '#'));
    std::cout << "  four-way  " << deepest_fill(solid, MOVES_4) << "\\n";
    std::cout << "  eight-way " << deepest_fill(solid, MOVES_8) << "\\n";
    std::cout << "which is the whole grid, and past what a default stack will take.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Flood fill is connected components on a grid, and the only thing that changes
// is that the graph is never built. A cell is a node; two cells are joined when
// they are next to each other and both are land.
//
// The decision that is not written down anywhere in the problem statement is
// what "next to" means. Four neighbours or eight? The two give different island
// counts on the same map, and neither is more correct -- the problem is supposed
// to say, and often does not.
//
// The example counts islands both ways, checks both against an independent
// pairwise-reachability count, and measures how often they disagree.

const MOVES_4: [(i32, i32); 4] = [(-1, 0), (1, 0), (0, -1), (0, 1)];
const MOVES_8: [(i32, i32); 8] = [
    (-1, -1), (-1, 0), (-1, 1), (0, -1),
    (0, 1), (1, -1), (1, 0), (1, 1),
];

/// One label per land cell, and the number of labels.
fn count_islands(grid: &[String], moves: &[(i32, i32)]) -> i32 {
    let rows = grid.len() as i32;
    let cols = grid[0].len() as i32;
    let mut seen = vec![vec![false; cols as usize]; rows as usize];
    let mut count = 0;
    let bytes: Vec<&[u8]> = grid.iter().map(|row| row.as_bytes()).collect();
    for r in 0..rows {
        for c in 0..cols {
            if bytes[r as usize][c as usize] != b'#' || seen[r as usize][c as usize] {
                continue;
            }
            count += 1;
            let mut stack = vec![(r, c)];
            seen[r as usize][c as usize] = true;
            while let Some((y, x)) = stack.pop() {
                for &(dy, dx) in moves {
                    let ny = y + dy;
                    let nx = x + dx;
                    if ny >= 0 && ny < rows && nx >= 0 && nx < cols {
                        if bytes[ny as usize][nx as usize] == b'#' && !seen[ny as usize][nx as usize] {
                            seen[ny as usize][nx as usize] = true;
                            stack.push((ny, nx));
                        }
                    }
                }
            }
        }
    }
    count
}

/// Group land cells by mutual reachability. Slow, obviously right.
fn count_islands_by_pairs(grid: &[String], moves: &[(i32, i32)]) -> i32 {
    let rows = grid.len() as i32;
    let cols = grid[0].len() as i32;
    let bytes: Vec<&[u8]> = grid.iter().map(|row| row.as_bytes()).collect();
    let mut cells: Vec<(i32, i32)> = Vec::new();
    for r in 0..rows {
        for c in 0..cols {
            if bytes[r as usize][c as usize] == b'#' {
                cells.push((r, c));
            }
        }
    }
    let mut group = vec![-1i32; cells.len()];
    let mut count = 0;
    for i in 0..cells.len() {
        if group[i] >= 0 {
            continue;
        }
        group[i] = count;
        let mut changed = true;
        while changed {
            changed = false;
            for a in 0..cells.len() {
                if group[a] != count {
                    continue;
                }
                for b in 0..cells.len() {
                    if group[b] >= 0 {
                        continue;
                    }
                    let dy = cells[b].0 - cells[a].0;
                    let dx = cells[b].1 - cells[a].1;
                    let mut joined = false;
                    for &(my, mx) in moves {
                        if my == dy && mx == dx {
                            joined = true;
                        }
                    }
                    if joined {
                        group[b] = count;
                        changed = true;
                    }
                }
            }
        }
        count += 1;
    }
    count
}

/// How deep a recursive flood fill would go. Measured with a stack.
fn deepest_fill(grid: &[String], moves: &[(i32, i32)]) -> i32 {
    let rows = grid.len() as i32;
    let cols = grid[0].len() as i32;
    let bytes: Vec<&[u8]> = grid.iter().map(|row| row.as_bytes()).collect();
    let mut seen = vec![vec![false; cols as usize]; rows as usize];
    let mut deepest = 0;
    for r in 0..rows {
        for c in 0..cols {
            if bytes[r as usize][c as usize] != b'#' || seen[r as usize][c as usize] {
                continue;
            }
            let mut stack = vec![(r, c, 1i32)];
            while let Some((y, x, depth)) = stack.pop() {
                if seen[y as usize][x as usize] {
                    continue;
                }
                seen[y as usize][x as usize] = true;
                if depth > deepest {
                    deepest = depth;
                }
                for &(dy, dx) in moves {
                    let ny = y + dy;
                    let nx = x + dx;
                    if ny >= 0 && ny < rows && nx >= 0 && nx < cols {
                        if bytes[ny as usize][nx as usize] == b'#' && !seen[ny as usize][nx as usize] {
                            stack.push((ny, nx, depth + 1));
                        }
                    }
                }
            }
        }
    }
    deepest
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
    // maps below are the same maps whichever translation is run.
    fn next(&mut self, n: i64) -> i64 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        self.seed / 65536 % n
    }
}

fn main() {
    let maps: Vec<Vec<String>> = vec![
        vec!["#..#", ".##.", "#..#", "#..#"],
        vec!["#.#", ".#.", "#.#"],
        vec!["####", "#..#", "#..#", "####"],
        vec!["#...", "....", "...#", "..#."],
    ]
    .into_iter()
    .map(|rows| rows.into_iter().map(String::from).collect())
    .collect();

    println!(
        "{}{}{}{}",
        pad_right("map", 24),
        pad_left("islands, 4 ways", 17),
        pad_left("islands, 8 ways", 17),
        pad_left("by pairs, 4", 13)
    );
    for grid in &maps {
        let shown = grid.join("/");
        let four = count_islands(grid, &MOVES_4);
        let eight = count_islands(grid, &MOVES_8);
        println!(
            "{}{}{}{}",
            pad_right(&shown, 24),
            pad_left(&four.to_string(), 17),
            pad_left(&eight.to_string(), 17),
            pad_left(&count_islands_by_pairs(grid, &MOVES_4).to_string(), 13)
        );
    }
    println!();

    let mut rng = Rng { seed: 1 };
    let trials = 3000;
    let mut four_ok = 0;
    let mut eight_ok = 0;
    let mut disagreed = 0;
    let mut eight_more = 0;
    for _ in 0..trials {
        let rows = 2 + rng.next(4);
        let cols = 2 + rng.next(4);
        let mut grid: Vec<String> = Vec::new();
        for _ in 0..rows {
            let mut row = String::new();
            for _ in 0..cols {
                row.push(if rng.next(2) == 0 { '#' } else { '.' });
            }
            grid.push(row);
        }
        let four = count_islands(&grid, &MOVES_4);
        let eight = count_islands(&grid, &MOVES_8);
        if four == count_islands_by_pairs(&grid, &MOVES_4) {
            four_ok += 1;
        }
        if eight == count_islands_by_pairs(&grid, &MOVES_8) {
            eight_ok += 1;
        }
        if four != eight {
            disagreed += 1;
        }
        if eight > four {
            eight_more += 1;
        }
    }

    println!("over {} random maps of up to 5 by 5:", trials);
    println!("  four-way count matched the definition  {}", pad_left(&four_ok.to_string(), 6));
    println!("  eight-way count matched the definition {}", pad_left(&eight_ok.to_string(), 6));
    println!("  the two counts disagreed               {}", pad_left(&disagreed.to_string(), 6));
    println!("  eight-way found more islands than four {}", pad_left(&eight_more.to_string(), 6));
    println!();
    println!("The two counts differ on well over a third of random maps, and eight-way");
    println!("never finds more islands than four-way -- adding the diagonals can only");
    println!("join components, never split them. That is the useful way to remember");
    println!("which is which, and it is also the reason the question has to be settled");
    println!("before the code is written rather than after: both answers are correct");
    println!("about the graph they describe, and only one of them is the graph in the");
    println!("problem.");
    println!();
    println!("The recursion depth is the other thing worth knowing about flood fill.");
    println!("On a solid 200 by 200 map a recursive fill would need this many frames:");
    let solid: Vec<String> = (0..200).map(|_| "#".repeat(200)).collect();
    println!("  four-way  {}", deepest_fill(&solid, &MOVES_4));
    println!("  eight-way {}", deepest_fill(&solid, &MOVES_8));
    println!("which is the whole grid, and past what a default stack will take.");
}
`,
            },
            {
              lang: "go",
              code: `// Flood fill is connected components on a grid, and the only thing that changes
// is that the graph is never built. A cell is a node; two cells are joined when
// they are next to each other and both are land.
//
// The decision that is not written down anywhere in the problem statement is
// what "next to" means. Four neighbours or eight? The two give different island
// counts on the same map, and neither is more correct -- the problem is supposed
// to say, and often does not.
//
// The example counts islands both ways, checks both against an independent
// pairwise-reachability count, and measures how often they disagree.

package main

import (
	"fmt"
	"strings"
)

var moves4 = [][2]int{{-1, 0}, {1, 0}, {0, -1}, {0, 1}}
var moves8 = [][2]int{
	{-1, -1}, {-1, 0}, {-1, 1}, {0, -1},
	{0, 1}, {1, -1}, {1, 0}, {1, 1},
}

// One label per land cell, and the number of labels.
func countIslands(grid []string, moves [][2]int) int {
	rows := len(grid)
	cols := len(grid[0])
	seen := make([][]bool, rows)
	for i := range seen {
		seen[i] = make([]bool, cols)
	}
	count := 0
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			if grid[r][c] != '#' || seen[r][c] {
				continue
			}
			count++
			stack := [][2]int{{r, c}}
			seen[r][c] = true
			for len(stack) > 0 {
				at := stack[len(stack)-1]
				stack = stack[:len(stack)-1]
				for _, move := range moves {
					ny := at[0] + move[0]
					nx := at[1] + move[1]
					if ny >= 0 && ny < rows && nx >= 0 && nx < cols {
						if grid[ny][nx] == '#' && !seen[ny][nx] {
							seen[ny][nx] = true
							stack = append(stack, [2]int{ny, nx})
						}
					}
				}
			}
		}
	}
	return count
}

// Group land cells by mutual reachability. Slow, obviously right.
func countIslandsByPairs(grid []string, moves [][2]int) int {
	rows := len(grid)
	cols := len(grid[0])
	cells := [][2]int{}
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			if grid[r][c] == '#' {
				cells = append(cells, [2]int{r, c})
			}
		}
	}
	group := make([]int, len(cells))
	for i := range group {
		group[i] = -1
	}
	count := 0
	for i := range cells {
		if group[i] >= 0 {
			continue
		}
		group[i] = count
		changed := true
		for changed {
			changed = false
			for a := range cells {
				if group[a] != count {
					continue
				}
				for b := range cells {
					if group[b] >= 0 {
						continue
					}
					dy := cells[b][0] - cells[a][0]
					dx := cells[b][1] - cells[a][1]
					joined := false
					for _, move := range moves {
						if move[0] == dy && move[1] == dx {
							joined = true
						}
					}
					if joined {
						group[b] = count
						changed = true
					}
				}
			}
		}
		count++
	}
	return count
}

// How deep a recursive flood fill would go. Measured with a stack.
func deepestFill(grid []string, moves [][2]int) int {
	rows := len(grid)
	cols := len(grid[0])
	seen := make([][]bool, rows)
	for i := range seen {
		seen[i] = make([]bool, cols)
	}
	deepest := 0
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			if grid[r][c] != '#' || seen[r][c] {
				continue
			}
			stack := [][3]int{{r, c, 1}}
			for len(stack) > 0 {
				at := stack[len(stack)-1]
				stack = stack[:len(stack)-1]
				if seen[at[0]][at[1]] {
					continue
				}
				seen[at[0]][at[1]] = true
				if at[2] > deepest {
					deepest = at[2]
				}
				for _, move := range moves {
					ny := at[0] + move[0]
					nx := at[1] + move[1]
					if ny >= 0 && ny < rows && nx >= 0 && nx < cols {
						if grid[ny][nx] == '#' && !seen[ny][nx] {
							stack = append(stack, [3]int{ny, nx, at[2] + 1})
						}
					}
				}
			}
		}
	}
	return deepest
}

// The same linear congruential generator in every language, so the random
// maps below are the same maps whichever translation is run.
var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	maps := [][]string{
		{"#..#", ".##.", "#..#", "#..#"},
		{"#.#", ".#.", "#.#"},
		{"####", "#..#", "#..#", "####"},
		{"#...", "....", "...#", "..#."},
	}

	fmt.Printf("%-24s%17s%17s%13s\\n", "map", "islands, 4 ways", "islands, 8 ways", "by pairs, 4")
	for _, grid := range maps {
		shown := strings.Join(grid, "/")
		four := countIslands(grid, moves4)
		eight := countIslands(grid, moves8)
		fmt.Printf("%-24s%17d%17d%13d\\n", shown, four, eight, countIslandsByPairs(grid, moves4))
	}
	fmt.Println()

	trials := 3000
	fourOk := 0
	eightOk := 0
	disagreed := 0
	eightMore := 0
	for t := 0; t < trials; t++ {
		rows := 2 + rand(4)
		cols := 2 + rand(4)
		grid := make([]string, rows)
		for r := 0; r < rows; r++ {
			var row strings.Builder
			for c := 0; c < cols; c++ {
				if rand(2) == 0 {
					row.WriteByte('#')
				} else {
					row.WriteByte('.')
				}
			}
			grid[r] = row.String()
		}
		four := countIslands(grid, moves4)
		eight := countIslands(grid, moves8)
		if four == countIslandsByPairs(grid, moves4) {
			fourOk++
		}
		if eight == countIslandsByPairs(grid, moves8) {
			eightOk++
		}
		if four != eight {
			disagreed++
		}
		if eight > four {
			eightMore++
		}
	}

	fmt.Printf("over %d random maps of up to 5 by 5:\\n", trials)
	fmt.Printf("  four-way count matched the definition  %6d\\n", fourOk)
	fmt.Printf("  eight-way count matched the definition %6d\\n", eightOk)
	fmt.Printf("  the two counts disagreed               %6d\\n", disagreed)
	fmt.Printf("  eight-way found more islands than four %6d\\n", eightMore)
	fmt.Println()
	fmt.Println("The two counts differ on well over a third of random maps, and eight-way")
	fmt.Println("never finds more islands than four-way -- adding the diagonals can only")
	fmt.Println("join components, never split them. That is the useful way to remember")
	fmt.Println("which is which, and it is also the reason the question has to be settled")
	fmt.Println("before the code is written rather than after: both answers are correct")
	fmt.Println("about the graph they describe, and only one of them is the graph in the")
	fmt.Println("problem.")
	fmt.Println()
	fmt.Println("The recursion depth is the other thing worth knowing about flood fill.")
	fmt.Println("On a solid 200 by 200 map a recursive fill would need this many frames:")
	solid := make([]string, 200)
	line := strings.Repeat("#", 200)
	for r := 0; r < 200; r++ {
		solid[r] = line
	}
	fmt.Printf("  four-way  %d\\n", deepestFill(solid, moves4))
	fmt.Printf("  eight-way %d\\n", deepestFill(solid, moves8))
	fmt.Println("which is the whole grid, and past what a default stack will take.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Not deciding what \"adjacent\" means before writing the fill",
          body: "Four-way and eight-way counts disagreed on 1,342 of 3,000 random maps. Both are correct about the graph they describe. If the problem statement does not say, that is a question to ask, not a detail to guess.",
        },
        {
          title: "A recursive flood fill on a large grid",
          body: "The depth is one frame per cell on the current path, so a solid 200 by 200 map needs 40,000 frames -- past a default stack. Grids are the canonical long-and-thin input, so this is where the iterative version earns its keep.",
        },
      ],
    },
    {
      id: "connected-means-two-things",
      heading: "Connected means two things",
      body: [
        "Everything above assumed the edges have no direction. Add direction and the word \"connected\" stops being one question.",
        "**Weakly connected** means joined once you ignore the arrows \u2014 which is the component loop, run on the undirected version of the graph. **Strongly connected** means every node in the group can reach every other one *following* the arrows. Those are different tests with different answers.",
        "How different: over 3,000 random directed graphs the two counts agreed on 655 and the strong count was larger on the other 2,345. It was never smaller, and that is structural rather than lucky \u2014 every strong component sits inside one weak component, so the strong grouping can only ever split the weak one further.",
        "The gap in practice is the interesting number. 1,635 of the 3,000 graphs were weakly connected in one piece; only 173 were strongly connected in one piece. So \"everything is joined up\" is a much weaker statement than it sounds when the edges are one-way.",
        "The consequence for code is that running the component loop on the undirected version of a directed graph is not a bug. It answers the weak question, correctly. It is a bug when the problem meant the strong one \u2014 \"can every account settle with every other\", \"is every page reachable from every page\" \u2014 and the strong version needs an algorithm of its own, which is where the next module ends.",
      ],
      examples: [
        {
          id: "weak-against-strong",
          title: "The undirected loop and mutual reachability, on the same directed graphs",
          lang: "python",
          code: `# "Connected" is one word covering two different questions once the graph is
# directed, and the component-counting loop from the first example answers
# whichever one the graph you handed it describes.
#
#   weakly connected   -- joined if you ignore the arrows. This is the plain
#                         component count on the undirected version.
#   strongly connected -- every node in the group can reach every other one
#                         following the arrows.
#
# Running the undirected loop on a directed graph is not a bug; it answers the
# weak question, correctly. It is a bug when the problem meant the strong one,
# and the numbers below say how often the two differ.


def build(n, edges, directed):
    neighbours = [[] for _ in range(n)]
    for u, v in edges:
        neighbours[u].append(v)
        if not directed:
            neighbours[v].append(u)
    return neighbours


def count_components(neighbours):
    """The loop from the first example, unchanged."""
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
            for u in neighbours[v]:
                if not seen[u]:
                    seen[u] = True
                    stack.append(u)
    return count


def reach_flags(neighbours, start):
    """Which nodes are reachable from start, following the edges as given."""
    n = len(neighbours)
    seen = [False] * n
    seen[start] = True
    stack = [start]
    while stack:
        v = stack.pop()
        for u in neighbours[v]:
            if not seen[u]:
                seen[u] = True
                stack.append(u)
    return seen


def count_strong(n, edges):
    """Group nodes that reach each other both ways. The definition, run n times."""
    forward = build(n, edges, True)
    reach = [reach_flags(forward, v) for v in range(n)]
    group = [-1] * n
    count = 0
    for v in range(n):
        if group[v] >= 0:
            continue
        for u in range(n):
            if group[u] < 0 and reach[v][u] and reach[u][v]:
                group[u] = count
        count += 1
    return count


def largest_strong(n, edges):
    """The size of the biggest mutually-reaching group."""
    forward = build(n, edges, True)
    reach = [reach_flags(forward, v) for v in range(n)]
    group = [-1] * n
    sizes = []
    count = 0
    for v in range(n):
        if group[v] >= 0:
            continue
        size = 0
        for u in range(n):
            if group[u] < 0 and reach[v][u] and reach[u][v]:
                group[u] = count
                size += 1
        sizes.append(size)
        count += 1
    biggest = 0
    for size in sizes:
        if size > biggest:
            biggest = size
    return biggest


def show_edges(edges):
    return "[" + ", ".join(f"{u}->{v}" for u, v in edges) + "]"


CASES = [
    (4, [(0, 1), (1, 2), (2, 0), (2, 3)]),
    (4, [(0, 1), (1, 2), (2, 3), (3, 0)]),
    (4, [(0, 1), (1, 2), (2, 3)]),
    (6, [(0, 1), (1, 0), (2, 3), (3, 2), (4, 5)]),
]

print(f"{'edges':<40}{'weak':>7}{'strong':>9}{'biggest strong':>17}")
for n, edges in CASES:
    weak = count_components(build(n, edges, False))
    strong = count_strong(n, edges)
    print(f"{show_edges(edges):<40}{weak:>7}{strong:>9}{largest_strong(n, edges):>17}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
same_count = 0
strong_more = 0
weak_more = 0
one_strong = 0
one_weak = 0
both_one = 0
for _ in range(TRIALS):
    n = 2 + rand(6)
    edges = []
    for u in range(n):
        for v in range(n):
            if u != v and rand(4) == 0:
                edges.append((u, v))
    weak = count_components(build(n, edges, False))
    strong = count_strong(n, edges)
    if weak == strong:
        same_count += 1
    if strong > weak:
        strong_more += 1
    if weak > strong:
        weak_more += 1
    if strong == 1:
        one_strong += 1
    if weak == 1:
        one_weak += 1
    if strong == 1 and weak == 1:
        both_one += 1

print(f"over {TRIALS} random directed graphs on up to 7 nodes:")
print(f"  the two counts agreed                 {same_count:>6}")
print(f"  more strong components than weak      {strong_more:>6}")
print(f"  more weak components than strong      {weak_more:>6}")
print(f"  strongly connected as a whole         {one_strong:>6}")
print(f"  weakly connected as a whole           {one_weak:>6}")
print(f"  both at once                          {both_one:>6}")
print()
print("Weak never exceeds strong, and the reason is worth holding on to: every")
print("strong component sits inside one weak component, so splitting can only go")
print("one way. A graph that is strongly connected is therefore weakly connected")
print("too, and the last three lines show the gap -- weakly connected in one")
print("piece on many graphs, strongly connected in one piece on far fewer.")
print()
print("The practical consequence is that the loop from the first example, run on")
print("the undirected version of a directed graph, answers the weak question and")
print("nothing else. It is the right tool when the problem says \\"are these all")
print("part of the same network\\" and the wrong one when it says \\"can every")
print("account settle with every other\\". The strong version needs its own")
print("algorithm, which is where module 30 ends.")
`,
          output: `edges                                      weak   strong   biggest strong
[0->1, 1->2, 2->0, 2->3]                      1        2                3
[0->1, 1->2, 2->3, 3->0]                      1        1                4
[0->1, 1->2, 2->3]                            1        4                1
[0->1, 1->0, 2->3, 3->2, 4->5]                3        4                2

over 3000 random directed graphs on up to 7 nodes:
  the two counts agreed                    655
  more strong components than weak        2345
  more weak components than strong           0
  strongly connected as a whole            173
  weakly connected as a whole             1635
  both at once                             173

Weak never exceeds strong, and the reason is worth holding on to: every
strong component sits inside one weak component, so splitting can only go
one way. A graph that is strongly connected is therefore weakly connected
too, and the last three lines show the gap -- weakly connected in one
piece on many graphs, strongly connected in one piece on far fewer.

The practical consequence is that the loop from the first example, run on
the undirected version of a directed graph, answers the weak question and
nothing else. It is the right tool when the problem says "are these all
part of the same network" and the wrong one when it says "can every
account settle with every other". The strong version needs its own
algorithm, which is where module 30 ends.`,
          explanation:
            "The undirected component loop against mutual reachability along the arrows, on the same directed graphs. Two different questions, two different answers, and one of them is what the problem meant.",
          alternates: [
            {
              lang: "javascript",
              code: `// "Connected" is one word covering two different questions once the graph is
// directed, and the component-counting loop from the first example answers
// whichever one the graph you handed it describes.
//
//   weakly connected   -- joined if you ignore the arrows. This is the plain
//                         component count on the undirected version.
//   strongly connected -- every node in the group can reach every other one
//                         following the arrows.
//
// Running the undirected loop on a directed graph is not a bug; it answers the
// weak question, correctly. It is a bug when the problem meant the strong one,
// and the numbers below say how often the two differ.

function build(n, edges, directed) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    if (!directed) neighbours[v].push(u);
  }
  return neighbours;
}

/** The loop from the first example, unchanged. */
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
      for (const u of neighbours[v]) {
        if (!seen[u]) {
          seen[u] = true;
          stack.push(u);
        }
      }
    }
  }
  return count;
}

/** Which nodes are reachable from start, following the edges as given. */
function reachFlags(neighbours, start) {
  const n = neighbours.length;
  const seen = new Array(n).fill(false);
  seen[start] = true;
  const stack = [start];
  while (stack.length > 0) {
    const v = stack.pop();
    for (const u of neighbours[v]) {
      if (!seen[u]) {
        seen[u] = true;
        stack.push(u);
      }
    }
  }
  return seen;
}

/** Group nodes that reach each other both ways. The definition, run n times. */
function countStrong(n, edges) {
  const forward = build(n, edges, true);
  const reach = [];
  for (let v = 0; v < n; v += 1) reach.push(reachFlags(forward, v));
  const group = new Array(n).fill(-1);
  let count = 0;
  for (let v = 0; v < n; v += 1) {
    if (group[v] >= 0) continue;
    for (let u = 0; u < n; u += 1) {
      if (group[u] < 0 && reach[v][u] && reach[u][v]) group[u] = count;
    }
    count += 1;
  }
  return count;
}

/** The size of the biggest mutually-reaching group. */
function largestStrong(n, edges) {
  const forward = build(n, edges, true);
  const reach = [];
  for (let v = 0; v < n; v += 1) reach.push(reachFlags(forward, v));
  const group = new Array(n).fill(-1);
  const sizes = [];
  let count = 0;
  for (let v = 0; v < n; v += 1) {
    if (group[v] >= 0) continue;
    let size = 0;
    for (let u = 0; u < n; u += 1) {
      if (group[u] < 0 && reach[v][u] && reach[u][v]) {
        group[u] = count;
        size += 1;
      }
    }
    sizes.push(size);
    count += 1;
  }
  let biggest = 0;
  for (const size of sizes) {
    if (size > biggest) biggest = size;
  }
  return biggest;
}

const showEdges = (edges) =>
  "[" + edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ") + "]";
const padEnd = (v, w) => String(v).padEnd(w);
const pad = (v, w) => String(v).padStart(w);

const CASES = [
  [4, [[0, 1], [1, 2], [2, 0], [2, 3]]],
  [4, [[0, 1], [1, 2], [2, 3], [3, 0]]],
  [4, [[0, 1], [1, 2], [2, 3]]],
  [6, [[0, 1], [1, 0], [2, 3], [3, 2], [4, 5]]],
];

console.log(padEnd("edges", 40) + pad("weak", 7) + pad("strong", 9) + pad("biggest strong", 17));
for (const [n, edges] of CASES) {
  const weak = countComponents(build(n, edges, false));
  const strong = countStrong(n, edges);
  console.log(
    padEnd(showEdges(edges), 40) + pad(weak, 7) + pad(strong, 9) + pad(largestStrong(n, edges), 17)
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
let sameCount = 0;
let strongMore = 0;
let weakMore = 0;
let oneStrong = 0;
let oneWeak = 0;
let bothOne = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v && rand(4) === 0) edges.push([u, v]);
    }
  }
  const weak = countComponents(build(n, edges, false));
  const strong = countStrong(n, edges);
  if (weak === strong) sameCount += 1;
  if (strong > weak) strongMore += 1;
  if (weak > strong) weakMore += 1;
  if (strong === 1) oneStrong += 1;
  if (weak === 1) oneWeak += 1;
  if (strong === 1 && weak === 1) bothOne += 1;
}

console.log(\`over \${TRIALS} random directed graphs on up to 7 nodes:\`);
console.log(\`  the two counts agreed                 \${pad(sameCount, 6)}\`);
console.log(\`  more strong components than weak      \${pad(strongMore, 6)}\`);
console.log(\`  more weak components than strong      \${pad(weakMore, 6)}\`);
console.log(\`  strongly connected as a whole         \${pad(oneStrong, 6)}\`);
console.log(\`  weakly connected as a whole           \${pad(oneWeak, 6)}\`);
console.log(\`  both at once                          \${pad(bothOne, 6)}\`);
console.log();
console.log("Weak never exceeds strong, and the reason is worth holding on to: every");
console.log("strong component sits inside one weak component, so splitting can only go");
console.log("one way. A graph that is strongly connected is therefore weakly connected");
console.log("too, and the last three lines show the gap -- weakly connected in one");
console.log("piece on many graphs, strongly connected in one piece on far fewer.");
console.log();
console.log("The practical consequence is that the loop from the first example, run on");
console.log("the undirected version of a directed graph, answers the weak question and");
console.log('nothing else. It is the right tool when the problem says "are these all');
console.log('part of the same network" and the wrong one when it says "can every');
console.log('account settle with every other". The strong version needs its own');
console.log("algorithm, which is where module 30 ends.");
`,
            },
            {
              lang: "typescript",
              code: `// "Connected" is one word covering two different questions once the graph is
// directed, and the component-counting loop from the first example answers
// whichever one the graph you handed it describes.
//
//   weakly connected   -- joined if you ignore the arrows. This is the plain
//                         component count on the undirected version.
//   strongly connected -- every node in the group can reach every other one
//                         following the arrows.
//
// Running the undirected loop on a directed graph is not a bug; it answers the
// weak question, correctly. It is a bug when the problem meant the strong one,
// and the numbers below say how often the two differ.

type Edge = [number, number];

function build(n: number, edges: Edge[], directed: boolean): number[][] {
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    if (!directed) neighbours[v].push(u);
  }
  return neighbours;
}

/** The loop from the first example, unchanged. */
function countComponents(neighbours: number[][]): number {
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
      for (const u of neighbours[v]) {
        if (!seen[u]) {
          seen[u] = true;
          stack.push(u);
        }
      }
    }
  }
  return count;
}

/** Which nodes are reachable from start, following the edges as given. */
function reachFlags(neighbours: number[][], start: number): boolean[] {
  const n = neighbours.length;
  const seen = new Array(n).fill(false);
  seen[start] = true;
  const stack = [start];
  while (stack.length > 0) {
    const v = stack.pop() as number;
    for (const u of neighbours[v]) {
      if (!seen[u]) {
        seen[u] = true;
        stack.push(u);
      }
    }
  }
  return seen;
}

/** Group nodes that reach each other both ways. The definition, run n times. */
function countStrong(n: number, edges: Edge[]): number {
  const forward = build(n, edges, true);
  const reach: boolean[][] = [];
  for (let v = 0; v < n; v += 1) reach.push(reachFlags(forward, v));
  const group = new Array(n).fill(-1);
  let count = 0;
  for (let v = 0; v < n; v += 1) {
    if (group[v] >= 0) continue;
    for (let u = 0; u < n; u += 1) {
      if (group[u] < 0 && reach[v][u] && reach[u][v]) group[u] = count;
    }
    count += 1;
  }
  return count;
}

/** The size of the biggest mutually-reaching group. */
function largestStrong(n: number, edges: Edge[]): number {
  const forward = build(n, edges, true);
  const reach: boolean[][] = [];
  for (let v = 0; v < n; v += 1) reach.push(reachFlags(forward, v));
  const group = new Array(n).fill(-1);
  const sizes: number[] = [];
  let count = 0;
  for (let v = 0; v < n; v += 1) {
    if (group[v] >= 0) continue;
    let size = 0;
    for (let u = 0; u < n; u += 1) {
      if (group[u] < 0 && reach[v][u] && reach[u][v]) {
        group[u] = count;
        size += 1;
      }
    }
    sizes.push(size);
    count += 1;
  }
  let biggest = 0;
  for (const size of sizes) {
    if (size > biggest) biggest = size;
  }
  return biggest;
}

const showEdges = (edges: Edge[]): string =>
  "[" + edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ") + "]";
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const pad = (v: string | number, w: number): string => String(v).padStart(w);

const CASES: [number, Edge[]][] = [
  [4, [[0, 1], [1, 2], [2, 0], [2, 3]]],
  [4, [[0, 1], [1, 2], [2, 3], [3, 0]]],
  [4, [[0, 1], [1, 2], [2, 3]]],
  [6, [[0, 1], [1, 0], [2, 3], [3, 2], [4, 5]]],
];

console.log(padEnd("edges", 40) + pad("weak", 7) + pad("strong", 9) + pad("biggest strong", 17));
for (const [n, edges] of CASES) {
  const weak = countComponents(build(n, edges, false));
  const strong = countStrong(n, edges);
  console.log(
    padEnd(showEdges(edges), 40) + pad(weak, 7) + pad(strong, 9) + pad(largestStrong(n, edges), 17)
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
let sameCount = 0;
let strongMore = 0;
let weakMore = 0;
let oneStrong = 0;
let oneWeak = 0;
let bothOne = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges: Edge[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v && rand(4) === 0) edges.push([u, v]);
    }
  }
  const weak = countComponents(build(n, edges, false));
  const strong = countStrong(n, edges);
  if (weak === strong) sameCount += 1;
  if (strong > weak) strongMore += 1;
  if (weak > strong) weakMore += 1;
  if (strong === 1) oneStrong += 1;
  if (weak === 1) oneWeak += 1;
  if (strong === 1 && weak === 1) bothOne += 1;
}

console.log(\`over \${TRIALS} random directed graphs on up to 7 nodes:\`);
console.log(\`  the two counts agreed                 \${pad(sameCount, 6)}\`);
console.log(\`  more strong components than weak      \${pad(strongMore, 6)}\`);
console.log(\`  more weak components than strong      \${pad(weakMore, 6)}\`);
console.log(\`  strongly connected as a whole         \${pad(oneStrong, 6)}\`);
console.log(\`  weakly connected as a whole           \${pad(oneWeak, 6)}\`);
console.log(\`  both at once                          \${pad(bothOne, 6)}\`);
console.log();
console.log("Weak never exceeds strong, and the reason is worth holding on to: every");
console.log("strong component sits inside one weak component, so splitting can only go");
console.log("one way. A graph that is strongly connected is therefore weakly connected");
console.log("too, and the last three lines show the gap -- weakly connected in one");
console.log("piece on many graphs, strongly connected in one piece on far fewer.");
console.log();
console.log("The practical consequence is that the loop from the first example, run on");
console.log("the undirected version of a directed graph, answers the weak question and");
console.log('nothing else. It is the right tool when the problem says "are these all');
console.log('part of the same network" and the wrong one when it says "can every');
console.log('account settle with every other". The strong version needs its own');
console.log("algorithm, which is where module 30 ends.");
`,
            },
            {
              lang: "java",
              code: `// "Connected" is one word covering two different questions once the graph is
// directed, and the component-counting loop from the first example answers
// whichever one the graph you handed it describes.
//
//   weakly connected   -- joined if you ignore the arrows. This is the plain
//                         component count on the undirected version.
//   strongly connected -- every node in the group can reach every other one
//                         following the arrows.
//
// Running the undirected loop on a directed graph is not a bug; it answers the
// weak question, correctly. It is a bug when the problem meant the strong one,
// and the numbers below say how often the two differ.

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {

    static List<List<Integer>> build(int n, int[][] edges, boolean directed) {
        List<List<Integer>> neighbours = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            neighbours.add(new ArrayList<>());
        }
        for (int[] e : edges) {
            neighbours.get(e[0]).add(e[1]);
            if (!directed) {
                neighbours.get(e[1]).add(e[0]);
            }
        }
        return neighbours;
    }

    /** The loop from the first example, unchanged. */
    static int countComponents(List<List<Integer>> neighbours) {
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
                for (int u : neighbours.get(v)) {
                    if (!seen[u]) {
                        seen[u] = true;
                        stack.add(u);
                    }
                }
            }
        }
        return count;
    }

    /** Which nodes are reachable from start, following the edges as given. */
    static boolean[] reachFlags(List<List<Integer>> neighbours, int start) {
        int n = neighbours.size();
        boolean[] seen = new boolean[n];
        seen[start] = true;
        List<Integer> stack = new ArrayList<>();
        stack.add(start);
        while (!stack.isEmpty()) {
            int v = stack.remove(stack.size() - 1);
            for (int u : neighbours.get(v)) {
                if (!seen[u]) {
                    seen[u] = true;
                    stack.add(u);
                }
            }
        }
        return seen;
    }

    /** Group nodes that reach each other both ways. The definition, run n times. */
    static int countStrong(int n, int[][] edges) {
        List<List<Integer>> forward = build(n, edges, true);
        boolean[][] reach = new boolean[n][];
        for (int v = 0; v < n; v++) {
            reach[v] = reachFlags(forward, v);
        }
        int[] group = new int[n];
        Arrays.fill(group, -1);
        int count = 0;
        for (int v = 0; v < n; v++) {
            if (group[v] >= 0) {
                continue;
            }
            for (int u = 0; u < n; u++) {
                if (group[u] < 0 && reach[v][u] && reach[u][v]) {
                    group[u] = count;
                }
            }
            count++;
        }
        return count;
    }

    /** The size of the biggest mutually-reaching group. */
    static int largestStrong(int n, int[][] edges) {
        List<List<Integer>> forward = build(n, edges, true);
        boolean[][] reach = new boolean[n][];
        for (int v = 0; v < n; v++) {
            reach[v] = reachFlags(forward, v);
        }
        int[] group = new int[n];
        Arrays.fill(group, -1);
        int count = 0;
        int biggest = 0;
        for (int v = 0; v < n; v++) {
            if (group[v] >= 0) {
                continue;
            }
            int size = 0;
            for (int u = 0; u < n; u++) {
                if (group[u] < 0 && reach[v][u] && reach[u][v]) {
                    group[u] = count;
                    size++;
                }
            }
            if (size > biggest) {
                biggest = size;
            }
            count++;
        }
        return biggest;
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
        int[] sizes = {4, 4, 4, 6};
        int[][][] cases = {
            {{0, 1}, {1, 2}, {2, 0}, {2, 3}},
            {{0, 1}, {1, 2}, {2, 3}, {3, 0}},
            {{0, 1}, {1, 2}, {2, 3}},
            {{0, 1}, {1, 0}, {2, 3}, {3, 2}, {4, 5}},
        };

        System.out.println(padEnd("edges", 40) + pad("weak", 7) + pad("strong", 9)
                + pad("biggest strong", 17));
        for (int c = 0; c < sizes.length; c++) {
            int n = sizes[c];
            int weak = countComponents(build(n, cases[c], false));
            int strong = countStrong(n, cases[c]);
            System.out.println(padEnd(showEdges(cases[c]), 40) + pad(String.valueOf(weak), 7)
                    + pad(String.valueOf(strong), 9)
                    + pad(String.valueOf(largestStrong(n, cases[c])), 17));
        }
        System.out.println();

        int trials = 3000;
        int sameCount = 0;
        int strongMore = 0;
        int weakMore = 0;
        int oneStrong = 0;
        int oneWeak = 0;
        int bothOne = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(6);
            List<int[]> collected = new ArrayList<>();
            for (int u = 0; u < n; u++) {
                for (int v = 0; v < n; v++) {
                    if (u != v && rand(4) == 0) {
                        collected.add(new int[] {u, v});
                    }
                }
            }
            int[][] edges = collected.toArray(new int[0][]);
            int weak = countComponents(build(n, edges, false));
            int strong = countStrong(n, edges);
            if (weak == strong) {
                sameCount++;
            }
            if (strong > weak) {
                strongMore++;
            }
            if (weak > strong) {
                weakMore++;
            }
            if (strong == 1) {
                oneStrong++;
            }
            if (weak == 1) {
                oneWeak++;
            }
            if (strong == 1 && weak == 1) {
                bothOne++;
            }
        }

        System.out.println("over " + trials + " random directed graphs on up to 7 nodes:");
        System.out.println("  the two counts agreed                 " + pad(String.valueOf(sameCount), 6));
        System.out.println("  more strong components than weak      " + pad(String.valueOf(strongMore), 6));
        System.out.println("  more weak components than strong      " + pad(String.valueOf(weakMore), 6));
        System.out.println("  strongly connected as a whole         " + pad(String.valueOf(oneStrong), 6));
        System.out.println("  weakly connected as a whole           " + pad(String.valueOf(oneWeak), 6));
        System.out.println("  both at once                          " + pad(String.valueOf(bothOne), 6));
        System.out.println();
        System.out.println("Weak never exceeds strong, and the reason is worth holding on to: every");
        System.out.println("strong component sits inside one weak component, so splitting can only go");
        System.out.println("one way. A graph that is strongly connected is therefore weakly connected");
        System.out.println("too, and the last three lines show the gap -- weakly connected in one");
        System.out.println("piece on many graphs, strongly connected in one piece on far fewer.");
        System.out.println();
        System.out.println("The practical consequence is that the loop from the first example, run on");
        System.out.println("the undirected version of a directed graph, answers the weak question and");
        System.out.println("nothing else. It is the right tool when the problem says \\"are these all");
        System.out.println("part of the same network\\" and the wrong one when it says \\"can every");
        System.out.println("account settle with every other\\". The strong version needs its own");
        System.out.println("algorithm, which is where module 30 ends.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// "Connected" is one word covering two different questions once the graph is
// directed, and the component-counting loop from the first example answers
// whichever one the graph you handed it describes.
//
//   weakly connected   -- joined if you ignore the arrows. This is the plain
//                         component count on the undirected version.
//   strongly connected -- every node in the group can reach every other one
//                         following the arrows.
//
// Running the undirected loop on a directed graph is not a bug; it answers the
// weak question, correctly. It is a bug when the problem meant the strong one,
// and the numbers below say how often the two differ.

#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

using Edge = std::pair<int, int>;

std::vector<std::vector<int>> build(int n, const std::vector<Edge>& edges, bool directed) {
    std::vector<std::vector<int>> neighbours(n);
    for (const Edge& e : edges) {
        neighbours[e.first].push_back(e.second);
        if (!directed) {
            neighbours[e.second].push_back(e.first);
        }
    }
    return neighbours;
}

// The loop from the first example, unchanged.
int count_components(const std::vector<std::vector<int>>& neighbours) {
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
            for (int u : neighbours[v]) {
                if (!seen[u]) {
                    seen[u] = 1;
                    stack.push_back(u);
                }
            }
        }
    }
    return count;
}

// Which nodes are reachable from start, following the edges as given.
std::vector<char> reach_flags(const std::vector<std::vector<int>>& neighbours, int start) {
    int n = static_cast<int>(neighbours.size());
    std::vector<char> seen(n, 0);
    seen[start] = 1;
    std::vector<int> stack;
    stack.push_back(start);
    while (!stack.empty()) {
        int v = stack.back();
        stack.pop_back();
        for (int u : neighbours[v]) {
            if (!seen[u]) {
                seen[u] = 1;
                stack.push_back(u);
            }
        }
    }
    return seen;
}

// Group nodes that reach each other both ways. The definition, run n times.
int count_strong(int n, const std::vector<Edge>& edges) {
    std::vector<std::vector<int>> forward = build(n, edges, true);
    std::vector<std::vector<char>> reach;
    for (int v = 0; v < n; v++) {
        reach.push_back(reach_flags(forward, v));
    }
    std::vector<int> group(n, -1);
    int count = 0;
    for (int v = 0; v < n; v++) {
        if (group[v] >= 0) {
            continue;
        }
        for (int u = 0; u < n; u++) {
            if (group[u] < 0 && reach[v][u] && reach[u][v]) {
                group[u] = count;
            }
        }
        count++;
    }
    return count;
}

// The size of the biggest mutually-reaching group.
int largest_strong(int n, const std::vector<Edge>& edges) {
    std::vector<std::vector<int>> forward = build(n, edges, true);
    std::vector<std::vector<char>> reach;
    for (int v = 0; v < n; v++) {
        reach.push_back(reach_flags(forward, v));
    }
    std::vector<int> group(n, -1);
    int count = 0;
    int biggest = 0;
    for (int v = 0; v < n; v++) {
        if (group[v] >= 0) {
            continue;
        }
        int size = 0;
        for (int u = 0; u < n; u++) {
            if (group[u] < 0 && reach[v][u] && reach[u][v]) {
                group[u] = count;
                size++;
            }
        }
        if (size > biggest) {
            biggest = size;
        }
        count++;
    }
    return biggest;
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
    std::vector<int> sizes = {4, 4, 4, 6};
    std::vector<std::vector<Edge>> cases = {
        {{0, 1}, {1, 2}, {2, 0}, {2, 3}},
        {{0, 1}, {1, 2}, {2, 3}, {3, 0}},
        {{0, 1}, {1, 2}, {2, 3}},
        {{0, 1}, {1, 0}, {2, 3}, {3, 2}, {4, 5}},
    };

    std::cout << std::left << std::setw(40) << "edges" << std::right << std::setw(7) << "weak"
              << std::setw(9) << "strong" << std::setw(17) << "biggest strong" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        int n = sizes[c];
        int weak = count_components(build(n, cases[c], false));
        int strong = count_strong(n, cases[c]);
        std::cout << std::left << std::setw(40) << show_edges(cases[c]) << std::right
                  << std::setw(7) << weak << std::setw(9) << strong
                  << std::setw(17) << largest_strong(n, cases[c]) << "\\n";
    }
    std::cout << "\\n";

    int trials = 3000;
    int same_count = 0;
    int strong_more = 0;
    int weak_more = 0;
    int one_strong = 0;
    int one_weak = 0;
    int both_one = 0;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(6);
        std::vector<Edge> edges;
        for (int u = 0; u < n; u++) {
            for (int v = 0; v < n; v++) {
                if (u != v && rand_below(4) == 0) {
                    edges.push_back(Edge(u, v));
                }
            }
        }
        int weak = count_components(build(n, edges, false));
        int strong = count_strong(n, edges);
        if (weak == strong) {
            same_count++;
        }
        if (strong > weak) {
            strong_more++;
        }
        if (weak > strong) {
            weak_more++;
        }
        if (strong == 1) {
            one_strong++;
        }
        if (weak == 1) {
            one_weak++;
        }
        if (strong == 1 && weak == 1) {
            both_one++;
        }
    }

    std::cout << "over " << trials << " random directed graphs on up to 7 nodes:\\n";
    std::cout << "  the two counts agreed                 " << std::setw(6) << same_count << "\\n";
    std::cout << "  more strong components than weak      " << std::setw(6) << strong_more << "\\n";
    std::cout << "  more weak components than strong      " << std::setw(6) << weak_more << "\\n";
    std::cout << "  strongly connected as a whole         " << std::setw(6) << one_strong << "\\n";
    std::cout << "  weakly connected as a whole           " << std::setw(6) << one_weak << "\\n";
    std::cout << "  both at once                          " << std::setw(6) << both_one << "\\n";
    std::cout << "\\n";
    std::cout << "Weak never exceeds strong, and the reason is worth holding on to: every\\n";
    std::cout << "strong component sits inside one weak component, so splitting can only go\\n";
    std::cout << "one way. A graph that is strongly connected is therefore weakly connected\\n";
    std::cout << "too, and the last three lines show the gap -- weakly connected in one\\n";
    std::cout << "piece on many graphs, strongly connected in one piece on far fewer.\\n";
    std::cout << "\\n";
    std::cout << "The practical consequence is that the loop from the first example, run on\\n";
    std::cout << "the undirected version of a directed graph, answers the weak question and\\n";
    std::cout << "nothing else. It is the right tool when the problem says \\"are these all\\n";
    std::cout << "part of the same network\\" and the wrong one when it says \\"can every\\n";
    std::cout << "account settle with every other\\". The strong version needs its own\\n";
    std::cout << "algorithm, which is where module 30 ends.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// "Connected" is one word covering two different questions once the graph is
// directed, and the component-counting loop from the first example answers
// whichever one the graph you handed it describes.
//
//   weakly connected   -- joined if you ignore the arrows. This is the plain
//                         component count on the undirected version.
//   strongly connected -- every node in the group can reach every other one
//                         following the arrows.
//
// Running the undirected loop on a directed graph is not a bug; it answers the
// weak question, correctly. It is a bug when the problem meant the strong one,
// and the numbers below say how often the two differ.

fn build(n: usize, edges: &[(usize, usize)], directed: bool) -> Vec<Vec<usize>> {
    let mut neighbours = vec![Vec::new(); n];
    for &(u, v) in edges {
        neighbours[u].push(v);
        if !directed {
            neighbours[v].push(u);
        }
    }
    neighbours
}

/// The loop from the first example, unchanged.
fn count_components(neighbours: &[Vec<usize>]) -> i32 {
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
                let u = neighbours[v][i];
                if !seen[u] {
                    seen[u] = true;
                    stack.push(u);
                }
            }
        }
    }
    count
}

/// Which nodes are reachable from start, following the edges as given.
fn reach_flags(neighbours: &[Vec<usize>], start: usize) -> Vec<bool> {
    let n = neighbours.len();
    let mut seen = vec![false; n];
    seen[start] = true;
    let mut stack = vec![start];
    while let Some(v) = stack.pop() {
        for i in 0..neighbours[v].len() {
            let u = neighbours[v][i];
            if !seen[u] {
                seen[u] = true;
                stack.push(u);
            }
        }
    }
    seen
}

/// Group nodes that reach each other both ways. The definition, run n times.
fn count_strong(n: usize, edges: &[(usize, usize)]) -> i32 {
    let forward = build(n, edges, true);
    let reach: Vec<Vec<bool>> = (0..n).map(|v| reach_flags(&forward, v)).collect();
    let mut group = vec![-1i32; n];
    let mut count = 0;
    for v in 0..n {
        if group[v] >= 0 {
            continue;
        }
        for u in 0..n {
            if group[u] < 0 && reach[v][u] && reach[u][v] {
                group[u] = count;
            }
        }
        count += 1;
    }
    count
}

/// The size of the biggest mutually-reaching group.
fn largest_strong(n: usize, edges: &[(usize, usize)]) -> i32 {
    let forward = build(n, edges, true);
    let reach: Vec<Vec<bool>> = (0..n).map(|v| reach_flags(&forward, v)).collect();
    let mut group = vec![-1i32; n];
    let mut count = 0;
    let mut biggest = 0;
    for v in 0..n {
        if group[v] >= 0 {
            continue;
        }
        let mut size = 0;
        for u in 0..n {
            if group[u] < 0 && reach[v][u] && reach[u][v] {
                group[u] = count;
                size += 1;
            }
        }
        if size > biggest {
            biggest = size;
        }
        count += 1;
    }
    biggest
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
    let sizes: Vec<usize> = vec![4, 4, 4, 6];
    let cases: Vec<Vec<(usize, usize)>> = vec![
        vec![(0, 1), (1, 2), (2, 0), (2, 3)],
        vec![(0, 1), (1, 2), (2, 3), (3, 0)],
        vec![(0, 1), (1, 2), (2, 3)],
        vec![(0, 1), (1, 0), (2, 3), (3, 2), (4, 5)],
    ];

    println!(
        "{}{}{}{}",
        pad_right("edges", 40),
        pad_left("weak", 7),
        pad_left("strong", 9),
        pad_left("biggest strong", 17)
    );
    for (c, edges) in cases.iter().enumerate() {
        let n = sizes[c];
        let weak = count_components(&build(n, edges, false));
        let strong = count_strong(n, edges);
        println!(
            "{}{}{}{}",
            pad_right(&show_edges(edges), 40),
            pad_left(&weak.to_string(), 7),
            pad_left(&strong.to_string(), 9),
            pad_left(&largest_strong(n, edges).to_string(), 17)
        );
    }
    println!();

    let mut rng = Rng { seed: 1 };
    let trials = 3000;
    let mut same_count = 0;
    let mut strong_more = 0;
    let mut weak_more = 0;
    let mut one_strong = 0;
    let mut one_weak = 0;
    let mut both_one = 0;
    for _ in 0..trials {
        let n = (2 + rng.next(6)) as usize;
        let mut edges: Vec<(usize, usize)> = Vec::new();
        for u in 0..n {
            for v in 0..n {
                if u != v && rng.next(4) == 0 {
                    edges.push((u, v));
                }
            }
        }
        let weak = count_components(&build(n, &edges, false));
        let strong = count_strong(n, &edges);
        if weak == strong {
            same_count += 1;
        }
        if strong > weak {
            strong_more += 1;
        }
        if weak > strong {
            weak_more += 1;
        }
        if strong == 1 {
            one_strong += 1;
        }
        if weak == 1 {
            one_weak += 1;
        }
        if strong == 1 && weak == 1 {
            both_one += 1;
        }
    }

    println!("over {} random directed graphs on up to 7 nodes:", trials);
    println!("  the two counts agreed                 {}", pad_left(&same_count.to_string(), 6));
    println!("  more strong components than weak      {}", pad_left(&strong_more.to_string(), 6));
    println!("  more weak components than strong      {}", pad_left(&weak_more.to_string(), 6));
    println!("  strongly connected as a whole         {}", pad_left(&one_strong.to_string(), 6));
    println!("  weakly connected as a whole           {}", pad_left(&one_weak.to_string(), 6));
    println!("  both at once                          {}", pad_left(&both_one.to_string(), 6));
    println!();
    println!("Weak never exceeds strong, and the reason is worth holding on to: every");
    println!("strong component sits inside one weak component, so splitting can only go");
    println!("one way. A graph that is strongly connected is therefore weakly connected");
    println!("too, and the last three lines show the gap -- weakly connected in one");
    println!("piece on many graphs, strongly connected in one piece on far fewer.");
    println!();
    println!("The practical consequence is that the loop from the first example, run on");
    println!("the undirected version of a directed graph, answers the weak question and");
    println!("nothing else. It is the right tool when the problem says \\"are these all");
    println!("part of the same network\\" and the wrong one when it says \\"can every");
    println!("account settle with every other\\". The strong version needs its own");
    println!("algorithm, which is where module 30 ends.");
}
`,
            },
            {
              lang: "go",
              code: `// "Connected" is one word covering two different questions once the graph is
// directed, and the component-counting loop from the first example answers
// whichever one the graph you handed it describes.
//
//   weakly connected   -- joined if you ignore the arrows. This is the plain
//                         component count on the undirected version.
//   strongly connected -- every node in the group can reach every other one
//                         following the arrows.
//
// Running the undirected loop on a directed graph is not a bug; it answers the
// weak question, correctly. It is a bug when the problem meant the strong one,
// and the numbers below say how often the two differ.

package main

import (
	"fmt"
	"strings"
)

type edge struct{ from, to int }

func build(n int, edges []edge, directed bool) [][]int {
	neighbours := make([][]int, n)
	for i := range neighbours {
		neighbours[i] = []int{}
	}
	for _, e := range edges {
		neighbours[e.from] = append(neighbours[e.from], e.to)
		if !directed {
			neighbours[e.to] = append(neighbours[e.to], e.from)
		}
	}
	return neighbours
}

// The loop from the first example, unchanged.
func countComponents(neighbours [][]int) int {
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
			for _, u := range neighbours[v] {
				if !seen[u] {
					seen[u] = true
					stack = append(stack, u)
				}
			}
		}
	}
	return count
}

// Which nodes are reachable from start, following the edges as given.
func reachFlags(neighbours [][]int, start int) []bool {
	n := len(neighbours)
	seen := make([]bool, n)
	seen[start] = true
	stack := []int{start}
	for len(stack) > 0 {
		v := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		for _, u := range neighbours[v] {
			if !seen[u] {
				seen[u] = true
				stack = append(stack, u)
			}
		}
	}
	return seen
}

// Group nodes that reach each other both ways. The definition, run n times.
func countStrong(n int, edges []edge) int {
	forward := build(n, edges, true)
	reach := make([][]bool, n)
	for v := 0; v < n; v++ {
		reach[v] = reachFlags(forward, v)
	}
	group := make([]int, n)
	for i := range group {
		group[i] = -1
	}
	count := 0
	for v := 0; v < n; v++ {
		if group[v] >= 0 {
			continue
		}
		for u := 0; u < n; u++ {
			if group[u] < 0 && reach[v][u] && reach[u][v] {
				group[u] = count
			}
		}
		count++
	}
	return count
}

// The size of the biggest mutually-reaching group.
func largestStrong(n int, edges []edge) int {
	forward := build(n, edges, true)
	reach := make([][]bool, n)
	for v := 0; v < n; v++ {
		reach[v] = reachFlags(forward, v)
	}
	group := make([]int, n)
	for i := range group {
		group[i] = -1
	}
	count := 0
	biggest := 0
	for v := 0; v < n; v++ {
		if group[v] >= 0 {
			continue
		}
		size := 0
		for u := 0; u < n; u++ {
			if group[u] < 0 && reach[v][u] && reach[u][v] {
				group[u] = count
				size++
			}
		}
		if size > biggest {
			biggest = size
		}
		count++
	}
	return biggest
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
	sizes := []int{4, 4, 4, 6}
	cases := [][]edge{
		{{0, 1}, {1, 2}, {2, 0}, {2, 3}},
		{{0, 1}, {1, 2}, {2, 3}, {3, 0}},
		{{0, 1}, {1, 2}, {2, 3}},
		{{0, 1}, {1, 0}, {2, 3}, {3, 2}, {4, 5}},
	}

	fmt.Printf("%-40s%7s%9s%17s\\n", "edges", "weak", "strong", "biggest strong")
	for c, edges := range cases {
		n := sizes[c]
		weak := countComponents(build(n, edges, false))
		strong := countStrong(n, edges)
		fmt.Printf("%-40s%7d%9d%17d\\n", showEdges(edges), weak, strong, largestStrong(n, edges))
	}
	fmt.Println()

	trials := 3000
	sameCount := 0
	strongMore := 0
	weakMore := 0
	oneStrong := 0
	oneWeak := 0
	bothOne := 0
	for t := 0; t < trials; t++ {
		n := 2 + rand(6)
		edges := []edge{}
		for u := 0; u < n; u++ {
			for v := 0; v < n; v++ {
				if u != v && rand(4) == 0 {
					edges = append(edges, edge{u, v})
				}
			}
		}
		weak := countComponents(build(n, edges, false))
		strong := countStrong(n, edges)
		if weak == strong {
			sameCount++
		}
		if strong > weak {
			strongMore++
		}
		if weak > strong {
			weakMore++
		}
		if strong == 1 {
			oneStrong++
		}
		if weak == 1 {
			oneWeak++
		}
		if strong == 1 && weak == 1 {
			bothOne++
		}
	}

	fmt.Printf("over %d random directed graphs on up to 7 nodes:\\n", trials)
	fmt.Printf("  the two counts agreed                 %6d\\n", sameCount)
	fmt.Printf("  more strong components than weak      %6d\\n", strongMore)
	fmt.Printf("  more weak components than strong      %6d\\n", weakMore)
	fmt.Printf("  strongly connected as a whole         %6d\\n", oneStrong)
	fmt.Printf("  weakly connected as a whole           %6d\\n", oneWeak)
	fmt.Printf("  both at once                          %6d\\n", bothOne)
	fmt.Println()
	fmt.Println("Weak never exceeds strong, and the reason is worth holding on to: every")
	fmt.Println("strong component sits inside one weak component, so splitting can only go")
	fmt.Println("one way. A graph that is strongly connected is therefore weakly connected")
	fmt.Println("too, and the last three lines show the gap -- weakly connected in one")
	fmt.Println("piece on many graphs, strongly connected in one piece on far fewer.")
	fmt.Println()
	fmt.Println("The practical consequence is that the loop from the first example, run on")
	fmt.Println("the undirected version of a directed graph, answers the weak question and")
	fmt.Println("nothing else. It is the right tool when the problem says \\"are these all")
	fmt.Println("part of the same network\\" and the wrong one when it says \\"can every")
	fmt.Println("account settle with every other\\". The strong version needs its own")
	fmt.Println("algorithm, which is where module 30 ends.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Using the undirected component loop and calling the result \"connected\"",
          body: "On a directed graph it answers the weak question. That is a real answer, and it is not the strong one: 1,635 of 3,000 random graphs were weakly connected in one piece and only 173 strongly connected in one piece. Say which one the problem meant before choosing the algorithm.",
        },
        {
          title: "Expecting the two counts to be comparable",
          body: "They are, but only in one direction: the strong count is never smaller, because every strong component lies inside a weak one. Over 3,000 graphs the strong count was larger 2,345 times and smaller never. A result where strong is smaller than weak is a bug, not a graph.",
        },
      ],
    },
    {
      id: "components-in-order",
      heading: "Components, in the order they are needed",
      body: [
        "Components, in the order they are usually needed.",
        "**The loop is around the search, not inside it.** Walk from an unlabelled node, label everything reached, repeat. One shared visited array, never cleared, is what keeps it linear \u2014 1,600 edge visits against 1,280,000 on the example ring.",
        "**Flood fill is this on a grid with no graph built.** The neighbour function is the whole difference, and the choice between four and eight neighbours changes the answer on nearly half of small random maps.",
        "**Grids are where the recursion runs out.** 40,000 frames on a solid 200 by 200. Write the loop.",
        "**On a directed graph, decide which connectivity you mean.** Weak is the same loop on the undirected version; strong is a different question with a different answer on more than three quarters of random graphs, and its own algorithm.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you count the connected components of a graph?",
      answer:
        "Loop over the nodes; when you find one with no label yet, run a traversal from it and label everything it reaches; repeat. The important detail is that the visited array is shared across all the walks and never cleared, which is what makes the whole thing O(V + E) rather than one traversal per component -- every edge is examined once for the entire run. The version people write instead, a fresh search from each node, is equally correct and costs n times the component size: on a ring of 800 nodes I measured 1,280,000 edge visits against 1,600. Either depth-first or breadth-first works, since the container never changes which nodes are reached.",
    },
    {
      question: "How is flood fill different from a graph traversal?",
      answer:
        "It is not -- it is the same loop with the neighbour function computed instead of stored. A cell is a node and adjacency is arithmetic on the coordinates, so no graph is ever built. The two things that actually differ in practice are both worth raising. First, \"adjacent\" is ambiguous: four neighbours or eight gives different answers, and on 3,000 random small maps they disagreed on 1,342 -- so I would ask which one the problem means. Eight-way never finds more islands than four-way, because diagonals can only join components. Second, grids are deep: a recursive fill on a solid 200 by 200 grid needs 40,000 frames, past a default stack, so I would write the explicit-stack version for anything large.",
    },
    {
      question: "What does \"connected\" mean for a directed graph?",
      answer:
        "Two different things, and the problem has to say which. Weakly connected means joined if you ignore the arrows, which is just the ordinary component loop run on the undirected version. Strongly connected means every node in the group reaches every other one following the arrows, which is a genuinely different computation. The strong count is never smaller than the weak one, because every strong component sits inside a weak component -- over 3,000 random directed graphs it was larger on 2,345 and smaller on none. The gap is large in practice: 1,635 of those graphs were weakly connected in one piece and only 173 strongly connected in one piece. So if the question is \"can every account settle with every other\", the undirected loop gives a confidently wrong answer, and what is needed is a strongly-connected-components algorithm.",
    },
  ],
  takeaways: [
    "Counting components is a loop around the traversal, not a new algorithm.",
    "The visited array is shared across every walk and never cleared \u2014 that is what keeps it linear.",
    "A fresh search per node is equally correct and costs 1,280,000 edge visits against 1,600 on a ring of 800.",
    "Flood fill is the same loop on a grid, with adjacency computed rather than stored.",
    "Four-way and eight-way island counts disagreed on 1,342 of 3,000 random maps.",
    "Eight-way never finds more islands than four-way: diagonals can only join components.",
    "A recursive fill on a solid 200 by 200 grid needs 40,000 frames \u2014 write the loop.",
    "On a directed graph, weakly connected and strongly connected are different questions.",
    "The strong count is never smaller than the weak one; it was larger on 2,345 of 3,000 graphs.",
    "1,635 graphs were weakly connected in one piece and only 173 strongly connected in one piece.",
  ],
  status: "available",
};
