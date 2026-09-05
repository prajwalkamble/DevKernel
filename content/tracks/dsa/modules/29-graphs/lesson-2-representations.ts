import type { Lesson } from "@/content/types";

export const representationsLesson: Lesson = {
  id: "dsa-graphs-representations",
  slug: "representations",
  moduleSlug: "graphs",
  title: "Adjacency Lists, Matrices and Edge Lists",
  summary:
    "The three ways to store a graph and what each one costs, measured rather than asserted: the traversal penalty a matrix pays on sparse graphs, the workload arithmetic that decides between them rather than a rule about density, and the edge list \u2014 the representation that a whole family of algorithms wants and the only one that stores a multigraph without losing edges.",
  estimatedMinutes: 45,
  objectives: [
    "State the two operations that the whole representation trade turns on",
    "Decide between a list and a matrix by counting a workload rather than guessing at density",
    "Recognise the algorithms that want an edge list and no index",
    "Say what a boolean matrix throws away, and when that matters",
  ],
  sections: [
    {
      id: "two-containers-one-graph",
      heading: "Two containers, one graph",
      body: [
        "Once the node and the edge are decided, the graph has to be stored, and there are three ways worth knowing. Two of them are the ones every course mentions, and the third gets skipped even though a whole family of algorithms wants it.",
        "An **adjacency list** keeps, for each node, the nodes it is joined to. An **adjacency matrix** keeps an `n` by `n` grid of yes-or-no. Neither is more correct than the other, and the whole trade fits in two lines:",
        "Asking \"is there an edge from `u` to `v`\" costs one lookup on a matrix and a scan of `u`'s list on a list. Asking \"what are `u`'s neighbours\" costs a read of the list on a list and a scan of `n` cells on a matrix. Everything else about the choice follows from those two sentences.",
        "The example runs the same breadth-first search over both, and the answers are identical on all 3,000 random graphs \u2014 as they must be, since it is the same graph. What differs is the bill. On sparse graphs of up to ten nodes the lists held 36,482 entries against 128,333 matrix cells, and the search probed 33,656 times against 107,963.",
        "That last number is the one people underestimate. A matrix does not merely use more memory; it makes traversal slower, because finding one node's neighbours means reading a whole row of `n` cells whether or not there is anything in them. On a sparse graph most of that row is zero.",
      ],
      examples: [
        {
          id: "list-against-matrix",
          title: "The same search over both representations, with the bill counted",
          lang: "python",
          code: `# The same graph, stored two ways, searched by the same algorithm.
#
# An adjacency list keeps, for each node, the nodes it is joined to. An
# adjacency matrix keeps an n by n grid of yes-or-no. Neither is more correct
# than the other; they trade the same two operations against each other, and
# which trade is right depends on the graph and on what is being asked.
#
#   is there an edge from u to v?   matrix: one lookup.  list: scan u's list.
#   what are u's neighbours?        matrix: scan n cells. list: read the list.
#
# Everything else about the choice follows from those two lines.


def build_list(n, edges):
    """For each node, the nodes joined to it. Storage is one entry per endpoint."""
    neighbours = [[] for _ in range(n)]
    for u, v in edges:
        neighbours[u].append(v)
        neighbours[v].append(u)
    entries = 0
    for row in neighbours:
        entries += len(row)
    return neighbours, entries


def build_matrix(n, edges):
    """An n by n grid of yes-or-no. Storage is n squared, whatever the edges."""
    grid = [[0] * n for _ in range(n)]
    for u, v in edges:
        grid[u][v] = 1
        grid[v][u] = 1
    return grid, n * n


def bfs_list(neighbours, start):
    """Breadth-first over the lists. Probes only the edges that exist."""
    n = len(neighbours)
    distance = [-1] * n
    distance[start] = 0
    queue = [start]
    head = 0
    probes = 0
    while head < len(queue):
        v = queue[head]
        head += 1
        for u in neighbours[v]:
            probes += 1
            if distance[u] < 0:
                distance[u] = distance[v] + 1
                queue.append(u)
    return distance, probes


def bfs_matrix(grid, start):
    """Breadth-first over the grid. Probes a whole row per node, edge or not."""
    n = len(grid)
    distance = [-1] * n
    distance[start] = 0
    queue = [start]
    head = 0
    probes = 0
    while head < len(queue):
        v = queue[head]
        head += 1
        for u in range(n):
            probes += 1
            if grid[v][u] and distance[u] < 0:
                distance[u] = distance[v] + 1
                queue.append(u)
    return distance, probes


def reachable_by_walking(n, edges, start):
    """No representation at all: rescan the edge list until nothing changes."""
    distance = [-1] * n
    distance[start] = 0
    changed = True
    while changed:
        changed = False
        for u, v in edges:
            if distance[u] >= 0 and (distance[v] < 0 or distance[v] > distance[u] + 1):
                distance[v] = distance[u] + 1
                changed = True
            if distance[v] >= 0 and (distance[u] < 0 or distance[u] > distance[v] + 1):
                distance[u] = distance[v] + 1
                changed = True
    return distance


def show(values):
    return "[" + ", ".join(str(v) for v in values) + "]"


CASES = [
    (4, [(0, 1), (1, 2), (2, 3)]),
    (4, [(0, 1), (0, 2), (0, 3), (1, 2), (1, 3), (2, 3)]),
    (5, [(0, 1), (2, 3)]),
    (6, [(0, 1), (1, 2), (2, 0), (3, 4)]),
]

print(f"{'nodes':>6}{'edges':>7}  {'distances':<28}{'list entries':>14}{'matrix cells':>14}"
      f"{'list probes':>13}{'matrix probes':>15}")
for n, edges in CASES:
    neighbours, entries = build_list(n, edges)
    grid, cells = build_matrix(n, edges)
    by_list, list_probes = bfs_list(neighbours, 0)
    by_grid, grid_probes = bfs_matrix(grid, 0)
    same = "same" if by_list == by_grid else "DIFFER"
    print(f"{n:>6}{len(edges):>7}  {show(by_list) + ' ' + same:<28}{entries:>14}{cells:>14}"
          f"{list_probes:>13}{grid_probes:>15}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
agree = 0
agree_with_walk = 0
entry_total = 0
cell_total = 0
list_probe_total = 0
grid_probe_total = 0
for _ in range(TRIALS):
    n = 2 + rand(9)
    edges = []
    for u in range(n):
        for v in range(u + 1, n):
            if rand(3) == 0:
                edges.append((u, v))
    neighbours, entries = build_list(n, edges)
    grid, cells = build_matrix(n, edges)
    by_list, list_probes = bfs_list(neighbours, 0)
    by_grid, grid_probes = bfs_matrix(grid, 0)
    if by_list == by_grid:
        agree += 1
    if by_list == reachable_by_walking(n, edges, 0):
        agree_with_walk += 1
    entry_total += entries
    cell_total += cells
    list_probe_total += list_probes
    grid_probe_total += grid_probes

print(f"over {TRIALS} random graphs of up to 10 nodes, about a third of pairs joined:")
print(f"  the two representations agree     {agree:>7}")
print(f"  and agree with rescanning edges   {agree_with_walk:>7}")
print()
print(f"  storage: {entry_total} list entries against {cell_total} matrix cells")
print(f"  search:  {list_probe_total} list probes against {grid_probe_total} matrix probes")
print()
print("the answers are identical because it is the same graph. The list is smaller")
print("and faster to traverse here because the graph is sparse; the matrix pays for")
print("every pair of nodes whether or not they are joined, and reads a whole row to")
print("find one node's neighbours.")
`,
          output: ` nodes  edges  distances                     list entries  matrix cells  list probes  matrix probes
     4      3  [0, 1, 2, 3] same                        6            16            6             16
     4      6  [0, 1, 1, 1] same                       12            16           12             16
     5      2  [0, 1, -1, -1, -1] same                  4            25            2             10
     6      4  [0, 1, 1, -1, -1, -1] same               8            36            6             18

over 3000 random graphs of up to 10 nodes, about a third of pairs joined:
  the two representations agree        3000
  and agree with rescanning edges      3000

  storage: 36482 list entries against 128333 matrix cells
  search:  33656 list probes against 107963 matrix probes

the answers are identical because it is the same graph. The list is smaller
and faster to traverse here because the graph is sparse; the matrix pays for
every pair of nodes whether or not they are joined, and reads a whole row to
find one node's neighbours.`,
          explanation:
            "The same graph in both representations, searched by the same algorithm, with storage and probes counted. The answers are identical and the costs are not \u2014 and the traversal difference, not the memory, is the one people underestimate.",
          alternates: [
            {
              lang: "javascript",
              code: `// The same graph, stored two ways, searched by the same algorithm.
//
// An adjacency list keeps, for each node, the nodes it is joined to. An
// adjacency matrix keeps an n by n grid of yes-or-no. Neither is more correct
// than the other; they trade the same two operations against each other, and
// which trade is right depends on the graph and on what is being asked.
//
//   is there an edge from u to v?   matrix: one lookup.  list: scan u's list.
//   what are u's neighbours?        matrix: scan n cells. list: read the list.
//
// Everything else about the choice follows from those two lines.

/** For each node, the nodes joined to it. Storage is one entry per endpoint. */
function buildList(n, edges) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    neighbours[v].push(u);
  }
  let entries = 0;
  for (const row of neighbours) entries += row.length;
  return [neighbours, entries];
}

/** An n by n grid of yes-or-no. Storage is n squared, whatever the edges. */
function buildMatrix(n, edges) {
  const grid = Array.from({ length: n }, () => new Array(n).fill(0));
  for (const [u, v] of edges) {
    grid[u][v] = 1;
    grid[v][u] = 1;
  }
  return [grid, n * n];
}

/** Breadth-first over the lists. Probes only the edges that exist. */
function bfsList(neighbours, start) {
  const n = neighbours.length;
  const distance = new Array(n).fill(-1);
  distance[start] = 0;
  const queue = [start];
  let head = 0;
  let probes = 0;
  while (head < queue.length) {
    const v = queue[head];
    head++;
    for (const u of neighbours[v]) {
      probes++;
      if (distance[u] < 0) {
        distance[u] = distance[v] + 1;
        queue.push(u);
      }
    }
  }
  return [distance, probes];
}

/** Breadth-first over the grid. Probes a whole row per node, edge or not. */
function bfsMatrix(grid, start) {
  const n = grid.length;
  const distance = new Array(n).fill(-1);
  distance[start] = 0;
  const queue = [start];
  let head = 0;
  let probes = 0;
  while (head < queue.length) {
    const v = queue[head];
    head++;
    for (let u = 0; u < n; u++) {
      probes++;
      if (grid[v][u] && distance[u] < 0) {
        distance[u] = distance[v] + 1;
        queue.push(u);
      }
    }
  }
  return [distance, probes];
}

/** No representation at all: rescan the edge list until nothing changes. */
function reachableByWalking(n, edges, start) {
  const distance = new Array(n).fill(-1);
  distance[start] = 0;
  let changed = true;
  while (changed) {
    changed = false;
    for (const [u, v] of edges) {
      if (distance[u] >= 0 && (distance[v] < 0 || distance[v] > distance[u] + 1)) {
        distance[v] = distance[u] + 1;
        changed = true;
      }
      if (distance[v] >= 0 && (distance[u] < 0 || distance[u] > distance[v] + 1)) {
        distance[u] = distance[v] + 1;
        changed = true;
      }
    }
  }
  return distance;
}

const show = (values) => \`[\${values.join(", ")}]\`;
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);

const CASES = [
  [4, [[0, 1], [1, 2], [2, 3]]],
  [4, [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]],
  [5, [[0, 1], [2, 3]]],
  [6, [[0, 1], [1, 2], [2, 0], [3, 4]]],
];

console.log(
  pad("nodes", 6) + pad("edges", 7) + "  " + padEnd("distances", 28) + pad("list entries", 14) +
    pad("matrix cells", 14) + pad("list probes", 13) + pad("matrix probes", 15)
);
for (const [n, edges] of CASES) {
  const [neighbours, entries] = buildList(n, edges);
  const [grid, cells] = buildMatrix(n, edges);
  const [byList, listProbes] = bfsList(neighbours, 0);
  const [byGrid, gridProbes] = bfsMatrix(grid, 0);
  const verdict = same(byList, byGrid) ? "same" : "DIFFER";
  console.log(
    pad(n, 6) + pad(edges.length, 7) + "  " + padEnd(show(byList) + " " + verdict, 28) +
      pad(entries, 14) + pad(cells, 14) + pad(listProbes, 13) + pad(gridProbes, 15)
  );
}
console.log();

const TRIALS = 3000;
let agree = 0;
let agreeWithWalk = 0;
let entryTotal = 0;
let cellTotal = 0;
let listProbeTotal = 0;
let gridProbeTotal = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(9);
  const edges = [];
  for (let u = 0; u < n; u++) {
    for (let v = u + 1; v < n; v++) {
      if (rand(3) === 0) edges.push([u, v]);
    }
  }
  const [neighbours, entries] = buildList(n, edges);
  const [grid, cells] = buildMatrix(n, edges);
  const [byList, listProbes] = bfsList(neighbours, 0);
  const [byGrid, gridProbes] = bfsMatrix(grid, 0);
  if (same(byList, byGrid)) agree++;
  if (same(byList, reachableByWalking(n, edges, 0))) agreeWithWalk++;
  entryTotal += entries;
  cellTotal += cells;
  listProbeTotal += listProbes;
  gridProbeTotal += gridProbes;
}

console.log(\`over \${TRIALS} random graphs of up to 10 nodes, about a third of pairs joined:\`);
console.log("  the two representations agree     " + pad(agree, 7));
console.log("  and agree with rescanning edges   " + pad(agreeWithWalk, 7));
console.log();
console.log(\`  storage: \${entryTotal} list entries against \${cellTotal} matrix cells\`);
console.log(\`  search:  \${listProbeTotal} list probes against \${gridProbeTotal} matrix probes\`);
console.log();
console.log("the answers are identical because it is the same graph. The list is smaller");
console.log("and faster to traverse here because the graph is sparse; the matrix pays for");
console.log("every pair of nodes whether or not they are joined, and reads a whole row to");
console.log("find one node's neighbours.");
`,
            },
            {
              lang: "typescript",
              code: `// The same graph, stored two ways, searched by the same algorithm.
//
// An adjacency list keeps, for each node, the nodes it is joined to. An
// adjacency matrix keeps an n by n grid of yes-or-no. Neither is more correct
// than the other; they trade the same two operations against each other, and
// which trade is right depends on the graph and on what is being asked.
//
//   is there an edge from u to v?   matrix: one lookup.  list: scan u's list.
//   what are u's neighbours?        matrix: scan n cells. list: read the list.
//
// Everything else about the choice follows from those two lines.

type Edge = [number, number];

/** For each node, the nodes joined to it. Storage is one entry per endpoint. */
function buildList(n: number, edges: Edge[]): [number[][], number] {
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    neighbours[v].push(u);
  }
  let entries = 0;
  for (const row of neighbours) entries += row.length;
  return [neighbours, entries];
}

/** An n by n grid of yes-or-no. Storage is n squared, whatever the edges. */
function buildMatrix(n: number, edges: Edge[]): [number[][], number] {
  const grid: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (const [u, v] of edges) {
    grid[u][v] = 1;
    grid[v][u] = 1;
  }
  return [grid, n * n];
}

/** Breadth-first over the lists. Probes only the edges that exist. */
function bfsList(neighbours: number[][], start: number): [number[], number] {
  const n = neighbours.length;
  const distance = new Array(n).fill(-1);
  distance[start] = 0;
  const queue = [start];
  let head = 0;
  let probes = 0;
  while (head < queue.length) {
    const v = queue[head];
    head++;
    for (const u of neighbours[v]) {
      probes++;
      if (distance[u] < 0) {
        distance[u] = distance[v] + 1;
        queue.push(u);
      }
    }
  }
  return [distance, probes];
}

/** Breadth-first over the grid. Probes a whole row per node, edge or not. */
function bfsMatrix(grid: number[][], start: number): [number[], number] {
  const n = grid.length;
  const distance = new Array(n).fill(-1);
  distance[start] = 0;
  const queue = [start];
  let head = 0;
  let probes = 0;
  while (head < queue.length) {
    const v = queue[head];
    head++;
    for (let u = 0; u < n; u++) {
      probes++;
      if (grid[v][u] && distance[u] < 0) {
        distance[u] = distance[v] + 1;
        queue.push(u);
      }
    }
  }
  return [distance, probes];
}

/** No representation at all: rescan the edge list until nothing changes. */
function reachableByWalking(n: number, edges: Edge[], start: number): number[] {
  const distance = new Array(n).fill(-1);
  distance[start] = 0;
  let changed = true;
  while (changed) {
    changed = false;
    for (const [u, v] of edges) {
      if (distance[u] >= 0 && (distance[v] < 0 || distance[v] > distance[u] + 1)) {
        distance[v] = distance[u] + 1;
        changed = true;
      }
      if (distance[v] >= 0 && (distance[u] < 0 || distance[u] > distance[v] + 1)) {
        distance[u] = distance[v] + 1;
        changed = true;
      }
    }
  }
  return distance;
}

const show = (values: number[]): string => \`[\${values.join(", ")}]\`;
const same = (a: number[], b: number[]): boolean => a.length === b.length && a.every((v, i) => v === b[i]);

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

const CASES: [number, Edge[]][] = [
  [4, [[0, 1], [1, 2], [2, 3]]],
  [4, [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]],
  [5, [[0, 1], [2, 3]]],
  [6, [[0, 1], [1, 2], [2, 0], [3, 4]]],
];

console.log(
  pad("nodes", 6) + pad("edges", 7) + "  " + padEnd("distances", 28) + pad("list entries", 14) +
    pad("matrix cells", 14) + pad("list probes", 13) + pad("matrix probes", 15)
);
for (const [n, edges] of CASES) {
  const [neighbours, entries] = buildList(n, edges);
  const [grid, cells] = buildMatrix(n, edges);
  const [byList, listProbes] = bfsList(neighbours, 0);
  const [byGrid, gridProbes] = bfsMatrix(grid, 0);
  const verdict = same(byList, byGrid) ? "same" : "DIFFER";
  console.log(
    pad(n, 6) + pad(edges.length, 7) + "  " + padEnd(show(byList) + " " + verdict, 28) +
      pad(entries, 14) + pad(cells, 14) + pad(listProbes, 13) + pad(gridProbes, 15)
  );
}
console.log();

const TRIALS = 3000;
let agree = 0;
let agreeWithWalk = 0;
let entryTotal = 0;
let cellTotal = 0;
let listProbeTotal = 0;
let gridProbeTotal = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(9);
  const edges: Edge[] = [];
  for (let u = 0; u < n; u++) {
    for (let v = u + 1; v < n; v++) {
      if (rand(3) === 0) edges.push([u, v]);
    }
  }
  const [neighbours, entries] = buildList(n, edges);
  const [grid, cells] = buildMatrix(n, edges);
  const [byList, listProbes] = bfsList(neighbours, 0);
  const [byGrid, gridProbes] = bfsMatrix(grid, 0);
  if (same(byList, byGrid)) agree++;
  if (same(byList, reachableByWalking(n, edges, 0))) agreeWithWalk++;
  entryTotal += entries;
  cellTotal += cells;
  listProbeTotal += listProbes;
  gridProbeTotal += gridProbes;
}

console.log(\`over \${TRIALS} random graphs of up to 10 nodes, about a third of pairs joined:\`);
console.log("  the two representations agree     " + pad(agree, 7));
console.log("  and agree with rescanning edges   " + pad(agreeWithWalk, 7));
console.log();
console.log(\`  storage: \${entryTotal} list entries against \${cellTotal} matrix cells\`);
console.log(\`  search:  \${listProbeTotal} list probes against \${gridProbeTotal} matrix probes\`);
console.log();
console.log("the answers are identical because it is the same graph. The list is smaller");
console.log("and faster to traverse here because the graph is sparse; the matrix pays for");
console.log("every pair of nodes whether or not they are joined, and reads a whole row to");
console.log("find one node's neighbours.");
`,
            },
            {
              lang: "java",
              code: `// The same graph, stored two ways, searched by the same algorithm.
//
// An adjacency list keeps, for each node, the nodes it is joined to. An
// adjacency matrix keeps an n by n grid of yes-or-no. Neither is more correct
// than the other; they trade the same two operations against each other, and
// which trade is right depends on the graph and on what is being asked.
//
//   is there an edge from u to v?   matrix: one lookup.  list: scan u's list.
//   what are u's neighbours?        matrix: scan n cells. list: read the list.
//
// Everything else about the choice follows from those two lines.
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
    static long probes;
    static long storage;

    // For each node, the nodes joined to it. Storage is one entry per endpoint.
    static List<List<Integer>> buildList(int n, int[][] edges) {
        List<List<Integer>> neighbours = new ArrayList<>();
        for (int i = 0; i < n; i++) neighbours.add(new ArrayList<>());
        for (int[] e : edges) {
            neighbours.get(e[0]).add(e[1]);
            neighbours.get(e[1]).add(e[0]);
        }
        storage = 0;
        for (List<Integer> row : neighbours) storage += row.size();
        return neighbours;
    }

    // An n by n grid of yes-or-no. Storage is n squared, whatever the edges.
    static int[][] buildMatrix(int n, int[][] edges) {
        int[][] grid = new int[n][n];
        for (int[] e : edges) {
            grid[e[0]][e[1]] = 1;
            grid[e[1]][e[0]] = 1;
        }
        storage = (long) n * n;
        return grid;
    }

    // Breadth-first over the lists. Probes only the edges that exist.
    static int[] bfsList(List<List<Integer>> neighbours, int start) {
        int n = neighbours.size();
        int[] distance = new int[n];
        Arrays.fill(distance, -1);
        distance[start] = 0;
        List<Integer> queue = new ArrayList<>();
        queue.add(start);
        int head = 0;
        probes = 0;
        while (head < queue.size()) {
            int v = queue.get(head);
            head++;
            for (int u : neighbours.get(v)) {
                probes++;
                if (distance[u] < 0) {
                    distance[u] = distance[v] + 1;
                    queue.add(u);
                }
            }
        }
        return distance;
    }

    // Breadth-first over the grid. Probes a whole row per node, edge or not.
    static int[] bfsMatrix(int[][] grid, int start) {
        int n = grid.length;
        int[] distance = new int[n];
        Arrays.fill(distance, -1);
        distance[start] = 0;
        List<Integer> queue = new ArrayList<>();
        queue.add(start);
        int head = 0;
        probes = 0;
        while (head < queue.size()) {
            int v = queue.get(head);
            head++;
            for (int u = 0; u < n; u++) {
                probes++;
                if (grid[v][u] == 1 && distance[u] < 0) {
                    distance[u] = distance[v] + 1;
                    queue.add(u);
                }
            }
        }
        return distance;
    }

    // No representation at all: rescan the edge list until nothing changes.
    static int[] reachableByWalking(int n, int[][] edges, int start) {
        int[] distance = new int[n];
        Arrays.fill(distance, -1);
        distance[start] = 0;
        boolean changed = true;
        while (changed) {
            changed = false;
            for (int[] e : edges) {
                int u = e[0], v = e[1];
                if (distance[u] >= 0 && (distance[v] < 0 || distance[v] > distance[u] + 1)) {
                    distance[v] = distance[u] + 1;
                    changed = true;
                }
                if (distance[v] >= 0 && (distance[u] < 0 || distance[u] > distance[v] + 1)) {
                    distance[u] = distance[v] + 1;
                    changed = true;
                }
            }
        }
        return distance;
    }

    static String show(int[] values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(values[i]);
        }
        return sb.append("]").toString();
    }

    static String padEnd(Object v, int w) {
        StringBuilder sb = new StringBuilder(String.valueOf(v));
        while (sb.length() < w) sb.append(' ');
        return sb.toString();
    }

    static String pad(Object v, int w) {
        StringBuilder sb = new StringBuilder(String.valueOf(v));
        while (sb.length() < w) sb.insert(0, ' ');
        return sb.toString();
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        int[] sizes = {4, 4, 5, 6};
        int[][][] caseEdges = {
            {{0, 1}, {1, 2}, {2, 3}},
            {{0, 1}, {0, 2}, {0, 3}, {1, 2}, {1, 3}, {2, 3}},
            {{0, 1}, {2, 3}},
            {{0, 1}, {1, 2}, {2, 0}, {3, 4}},
        };

        System.out.println(pad("nodes", 6) + pad("edges", 7) + "  " + padEnd("distances", 28)
            + pad("list entries", 14) + pad("matrix cells", 14) + pad("list probes", 13)
            + pad("matrix probes", 15));
        for (int c = 0; c < sizes.length; c++) {
            int n = sizes[c];
            int[][] edges = caseEdges[c];
            List<List<Integer>> neighbours = buildList(n, edges);
            long entries = storage;
            int[][] grid = buildMatrix(n, edges);
            long cells = storage;
            int[] byList = bfsList(neighbours, 0);
            long listProbes = probes;
            int[] byGrid = bfsMatrix(grid, 0);
            long gridProbes = probes;
            String verdict = Arrays.equals(byList, byGrid) ? "same" : "DIFFER";
            System.out.println(pad(n, 6) + pad(edges.length, 7) + "  "
                + padEnd(show(byList) + " " + verdict, 28) + pad(entries, 14) + pad(cells, 14)
                + pad(listProbes, 13) + pad(gridProbes, 15));
        }
        System.out.println();

        int trials = 3000;
        int agree = 0, agreeWithWalk = 0;
        long entryTotal = 0, cellTotal = 0, listProbeTotal = 0, gridProbeTotal = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(9);
            List<int[]> made = new ArrayList<>();
            for (int u = 0; u < n; u++) {
                for (int v = u + 1; v < n; v++) {
                    if (rand(3) == 0) made.add(new int[] {u, v});
                }
            }
            int[][] edges = made.toArray(new int[0][]);
            List<List<Integer>> neighbours = buildList(n, edges);
            long entries = storage;
            int[][] grid = buildMatrix(n, edges);
            long cells = storage;
            int[] byList = bfsList(neighbours, 0);
            long listProbes = probes;
            int[] byGrid = bfsMatrix(grid, 0);
            long gridProbes = probes;
            if (Arrays.equals(byList, byGrid)) agree++;
            if (Arrays.equals(byList, reachableByWalking(n, edges, 0))) agreeWithWalk++;
            entryTotal += entries;
            cellTotal += cells;
            listProbeTotal += listProbes;
            gridProbeTotal += gridProbes;
        }

        System.out.println("over " + trials + " random graphs of up to 10 nodes, about a third of pairs joined:");
        System.out.println("  the two representations agree     " + pad(agree, 7));
        System.out.println("  and agree with rescanning edges   " + pad(agreeWithWalk, 7));
        System.out.println();
        System.out.println("  storage: " + entryTotal + " list entries against " + cellTotal + " matrix cells");
        System.out.println("  search:  " + listProbeTotal + " list probes against " + gridProbeTotal + " matrix probes");
        System.out.println();
        System.out.println("the answers are identical because it is the same graph. The list is smaller");
        System.out.println("and faster to traverse here because the graph is sparse; the matrix pays for");
        System.out.println("every pair of nodes whether or not they are joined, and reads a whole row to");
        System.out.println("find one node's neighbours.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The same graph, stored two ways, searched by the same algorithm.
//
// An adjacency list keeps, for each node, the nodes it is joined to. An
// adjacency matrix keeps an n by n grid of yes-or-no. Neither is more correct
// than the other; they trade the same two operations against each other, and
// which trade is right depends on the graph and on what is being asked.
//
//   is there an edge from u to v?   matrix: one lookup.  list: scan u's list.
//   what are u's neighbours?        matrix: scan n cells. list: read the list.
//
// Everything else about the choice follows from those two lines.
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

using Edge = std::array<int, 2>;

// For each node, the nodes joined to it. Storage is one entry per endpoint.
std::pair<std::vector<std::vector<int>>, std::int64_t> buildList(int n, const std::vector<Edge> &edges) {
    std::vector<std::vector<int>> neighbours(n);
    for (const Edge &e : edges) {
        neighbours[e[0]].push_back(e[1]);
        neighbours[e[1]].push_back(e[0]);
    }
    std::int64_t entries = 0;
    for (const auto &row : neighbours) entries += static_cast<std::int64_t>(row.size());
    return {neighbours, entries};
}

// An n by n grid of yes-or-no. Storage is n squared, whatever the edges.
std::pair<std::vector<std::vector<int>>, std::int64_t> buildMatrix(int n, const std::vector<Edge> &edges) {
    std::vector<std::vector<int>> grid(n, std::vector<int>(n, 0));
    for (const Edge &e : edges) {
        grid[e[0]][e[1]] = 1;
        grid[e[1]][e[0]] = 1;
    }
    return {grid, static_cast<std::int64_t>(n) * n};
}

// Breadth-first over the lists. Probes only the edges that exist.
std::pair<std::vector<int>, std::int64_t> bfsList(const std::vector<std::vector<int>> &neighbours, int start) {
    int n = static_cast<int>(neighbours.size());
    std::vector<int> distance(n, -1);
    distance[start] = 0;
    std::vector<int> queue = {start};
    std::int64_t probes = 0;
    for (size_t head = 0; head < queue.size(); head++) {
        int v = queue[head];
        for (int u : neighbours[v]) {
            probes++;
            if (distance[u] < 0) {
                distance[u] = distance[v] + 1;
                queue.push_back(u);
            }
        }
    }
    return {distance, probes};
}

// Breadth-first over the grid. Probes a whole row per node, edge or not.
std::pair<std::vector<int>, std::int64_t> bfsMatrix(const std::vector<std::vector<int>> &grid, int start) {
    int n = static_cast<int>(grid.size());
    std::vector<int> distance(n, -1);
    distance[start] = 0;
    std::vector<int> queue = {start};
    std::int64_t probes = 0;
    for (size_t head = 0; head < queue.size(); head++) {
        int v = queue[head];
        for (int u = 0; u < n; u++) {
            probes++;
            if (grid[v][u] && distance[u] < 0) {
                distance[u] = distance[v] + 1;
                queue.push_back(u);
            }
        }
    }
    return {distance, probes};
}

// No representation at all: rescan the edge list until nothing changes.
std::vector<int> reachableByWalking(int n, const std::vector<Edge> &edges, int start) {
    std::vector<int> distance(n, -1);
    distance[start] = 0;
    bool changed = true;
    while (changed) {
        changed = false;
        for (const Edge &e : edges) {
            int u = e[0], v = e[1];
            if (distance[u] >= 0 && (distance[v] < 0 || distance[v] > distance[u] + 1)) {
                distance[v] = distance[u] + 1;
                changed = true;
            }
            if (distance[v] >= 0 && (distance[u] < 0 || distance[u] > distance[v] + 1)) {
                distance[u] = distance[v] + 1;
                changed = true;
            }
        }
    }
    return distance;
}

std::string show(const std::vector<int> &values) {
    std::string out = "[";
    for (size_t i = 0; i < values.size(); i++) {
        if (i > 0) out += ", ";
        out += std::to_string(values[i]);
    }
    return out + "]";
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    const std::vector<int> sizes = {4, 4, 5, 6};
    const std::vector<std::vector<Edge>> caseEdges = {
        {{0, 1}, {1, 2}, {2, 3}},
        {{0, 1}, {0, 2}, {0, 3}, {1, 2}, {1, 3}, {2, 3}},
        {{0, 1}, {2, 3}},
        {{0, 1}, {1, 2}, {2, 0}, {3, 4}},
    };

    std::cout << std::right << std::setw(6) << "nodes" << std::setw(7) << "edges" << "  "
              << std::left << std::setw(28) << "distances" << std::right
              << std::setw(14) << "list entries" << std::setw(14) << "matrix cells"
              << std::setw(13) << "list probes" << std::setw(15) << "matrix probes" << "\\n";
    for (size_t c = 0; c < sizes.size(); c++) {
        int n = sizes[c];
        const auto &edges = caseEdges[c];
        auto listBuilt = buildList(n, edges);
        auto gridBuilt = buildMatrix(n, edges);
        auto byList = bfsList(listBuilt.first, 0);
        auto byGrid = bfsMatrix(gridBuilt.first, 0);
        std::string verdict = byList.first == byGrid.first ? "same" : "DIFFER";
        std::cout << std::right << std::setw(6) << n << std::setw(7) << edges.size() << "  "
                  << std::left << std::setw(28) << (show(byList.first) + " " + verdict) << std::right
                  << std::setw(14) << listBuilt.second << std::setw(14) << gridBuilt.second
                  << std::setw(13) << byList.second << std::setw(15) << byGrid.second << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 3000;
    int agree = 0, agreeWithWalk = 0;
    std::int64_t entryTotal = 0, cellTotal = 0, listProbeTotal = 0, gridProbeTotal = 0;
    for (int t = 0; t < TRIALS; t++) {
        int n = 2 + rnd(9);
        std::vector<Edge> edges;
        for (int u = 0; u < n; u++) {
            for (int v = u + 1; v < n; v++) {
                if (rnd(3) == 0) edges.push_back({u, v});
            }
        }
        auto listBuilt = buildList(n, edges);
        auto gridBuilt = buildMatrix(n, edges);
        auto byList = bfsList(listBuilt.first, 0);
        auto byGrid = bfsMatrix(gridBuilt.first, 0);
        if (byList.first == byGrid.first) agree++;
        if (byList.first == reachableByWalking(n, edges, 0)) agreeWithWalk++;
        entryTotal += listBuilt.second;
        cellTotal += gridBuilt.second;
        listProbeTotal += byList.second;
        gridProbeTotal += byGrid.second;
    }

    std::cout << "over " << TRIALS << " random graphs of up to 10 nodes, about a third of pairs joined:\\n";
    std::cout << "  the two representations agree     " << std::setw(7) << agree << "\\n";
    std::cout << "  and agree with rescanning edges   " << std::setw(7) << agreeWithWalk << "\\n\\n";
    std::cout << "  storage: " << entryTotal << " list entries against " << cellTotal << " matrix cells\\n";
    std::cout << "  search:  " << listProbeTotal << " list probes against " << gridProbeTotal << " matrix probes\\n\\n";
    std::cout << "the answers are identical because it is the same graph. The list is smaller\\n";
    std::cout << "and faster to traverse here because the graph is sparse; the matrix pays for\\n";
    std::cout << "every pair of nodes whether or not they are joined, and reads a whole row to\\n";
    std::cout << "find one node's neighbours.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// The same graph, stored two ways, searched by the same algorithm.
//
// An adjacency list keeps, for each node, the nodes it is joined to. An
// adjacency matrix keeps an n by n grid of yes-or-no. Neither is more correct
// than the other; they trade the same two operations against each other, and
// which trade is right depends on the graph and on what is being asked.
//
//   is there an edge from u to v?   matrix: one lookup.  list: scan u's list.
//   what are u's neighbours?        matrix: scan n cells. list: read the list.
//
// Everything else about the choice follows from those two lines.

type Edge = (usize, usize);

/// For each node, the nodes joined to it. Storage is one entry per endpoint.
fn build_list(n: usize, edges: &[Edge]) -> (Vec<Vec<usize>>, i64) {
    let mut neighbours: Vec<Vec<usize>> = vec![Vec::new(); n];
    for &(u, v) in edges {
        neighbours[u].push(v);
        neighbours[v].push(u);
    }
    let entries: i64 = neighbours.iter().map(|row| row.len() as i64).sum();
    (neighbours, entries)
}

/// An n by n grid of yes-or-no. Storage is n squared, whatever the edges.
fn build_matrix(n: usize, edges: &[Edge]) -> (Vec<Vec<i32>>, i64) {
    let mut grid = vec![vec![0i32; n]; n];
    for &(u, v) in edges {
        grid[u][v] = 1;
        grid[v][u] = 1;
    }
    (grid, (n as i64) * (n as i64))
}

/// Breadth-first over the lists. Probes only the edges that exist.
fn bfs_list(neighbours: &[Vec<usize>], start: usize) -> (Vec<i32>, i64) {
    let n = neighbours.len();
    let mut distance = vec![-1i32; n];
    distance[start] = 0;
    let mut queue = vec![start];
    let mut probes = 0i64;
    let mut head = 0;
    while head < queue.len() {
        let v = queue[head];
        head += 1;
        for k in 0..neighbours[v].len() {
            let u = neighbours[v][k];
            probes += 1;
            if distance[u] < 0 {
                distance[u] = distance[v] + 1;
                queue.push(u);
            }
        }
    }
    (distance, probes)
}

/// Breadth-first over the grid. Probes a whole row per node, edge or not.
fn bfs_matrix(grid: &[Vec<i32>], start: usize) -> (Vec<i32>, i64) {
    let n = grid.len();
    let mut distance = vec![-1i32; n];
    distance[start] = 0;
    let mut queue = vec![start];
    let mut probes = 0i64;
    let mut head = 0;
    while head < queue.len() {
        let v = queue[head];
        head += 1;
        for u in 0..n {
            probes += 1;
            if grid[v][u] == 1 && distance[u] < 0 {
                distance[u] = distance[v] + 1;
                queue.push(u);
            }
        }
    }
    (distance, probes)
}

/// No representation at all: rescan the edge list until nothing changes.
fn reachable_by_walking(n: usize, edges: &[Edge], start: usize) -> Vec<i32> {
    let mut distance = vec![-1i32; n];
    distance[start] = 0;
    let mut changed = true;
    while changed {
        changed = false;
        for &(u, v) in edges {
            if distance[u] >= 0 && (distance[v] < 0 || distance[v] > distance[u] + 1) {
                distance[v] = distance[u] + 1;
                changed = true;
            }
            if distance[v] >= 0 && (distance[u] < 0 || distance[u] > distance[v] + 1) {
                distance[u] = distance[v] + 1;
                changed = true;
            }
        }
    }
    distance
}

fn show(values: &[i32]) -> String {
    let parts: Vec<String> = values.iter().map(|v| v.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

struct Rng {
    seed: i64,
}

impl Rng {
    fn next(&mut self, n: i64) -> i64 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        self.seed / 65536 % n
    }
}

fn main() {
    let sizes = [4usize, 4, 5, 6];
    let case_edges: Vec<Vec<Edge>> = vec![
        vec![(0, 1), (1, 2), (2, 3)],
        vec![(0, 1), (0, 2), (0, 3), (1, 2), (1, 3), (2, 3)],
        vec![(0, 1), (2, 3)],
        vec![(0, 1), (1, 2), (2, 0), (3, 4)],
    ];

    println!(
        "{:>6}{:>7}  {:<28}{:>14}{:>14}{:>13}{:>15}",
        "nodes", "edges", "distances", "list entries", "matrix cells", "list probes", "matrix probes"
    );
    for (c, &n) in sizes.iter().enumerate() {
        let edges = &case_edges[c];
        let (neighbours, entries) = build_list(n, edges);
        let (grid, cells) = build_matrix(n, edges);
        let (by_list, list_probes) = bfs_list(&neighbours, 0);
        let (by_grid, grid_probes) = bfs_matrix(&grid, 0);
        let verdict = if by_list == by_grid { "same" } else { "DIFFER" };
        println!(
            "{:>6}{:>7}  {:<28}{:>14}{:>14}{:>13}{:>15}",
            n,
            edges.len(),
            format!("{} {}", show(&by_list), verdict),
            entries,
            cells,
            list_probes,
            grid_probes
        );
    }
    println!();

    let trials = 3000;
    let mut rng = Rng { seed: 1 };
    let (mut agree, mut agree_with_walk) = (0, 0);
    let (mut entry_total, mut cell_total) = (0i64, 0i64);
    let (mut list_probe_total, mut grid_probe_total) = (0i64, 0i64);
    for _ in 0..trials {
        let n = (2 + rng.next(9)) as usize;
        let mut edges: Vec<Edge> = Vec::new();
        for u in 0..n {
            for v in (u + 1)..n {
                if rng.next(3) == 0 {
                    edges.push((u, v));
                }
            }
        }
        let (neighbours, entries) = build_list(n, &edges);
        let (grid, cells) = build_matrix(n, &edges);
        let (by_list, list_probes) = bfs_list(&neighbours, 0);
        let (by_grid, grid_probes) = bfs_matrix(&grid, 0);
        if by_list == by_grid {
            agree += 1;
        }
        if by_list == reachable_by_walking(n, &edges, 0) {
            agree_with_walk += 1;
        }
        entry_total += entries;
        cell_total += cells;
        list_probe_total += list_probes;
        grid_probe_total += grid_probes;
    }

    println!("over {} random graphs of up to 10 nodes, about a third of pairs joined:", trials);
    println!("  the two representations agree     {:>7}", agree);
    println!("  and agree with rescanning edges   {:>7}", agree_with_walk);
    println!();
    println!("  storage: {} list entries against {} matrix cells", entry_total, cell_total);
    println!("  search:  {} list probes against {} matrix probes", list_probe_total, grid_probe_total);
    println!();
    println!("the answers are identical because it is the same graph. The list is smaller");
    println!("and faster to traverse here because the graph is sparse; the matrix pays for");
    println!("every pair of nodes whether or not they are joined, and reads a whole row to");
    println!("find one node's neighbours.");
}
`,
            },
            {
              lang: "go",
              code: `// The same graph, stored two ways, searched by the same algorithm.
//
// An adjacency list keeps, for each node, the nodes it is joined to. An
// adjacency matrix keeps an n by n grid of yes-or-no. Neither is more correct
// than the other; they trade the same two operations against each other, and
// which trade is right depends on the graph and on what is being asked.
//
//   is there an edge from u to v?   matrix: one lookup.  list: scan u's list.
//   what are u's neighbours?        matrix: scan n cells. list: read the list.
//
// Everything else about the choice follows from those two lines.
package main

import (
	"fmt"
	"strconv"
	"strings"
)

// buildList keeps, for each node, the nodes joined to it.
func buildList(n int, edges [][2]int) ([][]int, int64) {
	neighbours := make([][]int, n)
	for _, e := range edges {
		neighbours[e[0]] = append(neighbours[e[0]], e[1])
		neighbours[e[1]] = append(neighbours[e[1]], e[0])
	}
	var entries int64
	for _, row := range neighbours {
		entries += int64(len(row))
	}
	return neighbours, entries
}

// buildMatrix keeps an n by n grid of yes-or-no.
func buildMatrix(n int, edges [][2]int) ([][]int, int64) {
	grid := make([][]int, n)
	for i := range grid {
		grid[i] = make([]int, n)
	}
	for _, e := range edges {
		grid[e[0]][e[1]] = 1
		grid[e[1]][e[0]] = 1
	}
	return grid, int64(n) * int64(n)
}

// bfsList probes only the edges that exist.
func bfsList(neighbours [][]int, start int) ([]int, int64) {
	n := len(neighbours)
	distance := make([]int, n)
	for i := range distance {
		distance[i] = -1
	}
	distance[start] = 0
	queue := []int{start}
	var probes int64
	for head := 0; head < len(queue); head++ {
		v := queue[head]
		for _, u := range neighbours[v] {
			probes++
			if distance[u] < 0 {
				distance[u] = distance[v] + 1
				queue = append(queue, u)
			}
		}
	}
	return distance, probes
}

// bfsMatrix probes a whole row per node, edge or not.
func bfsMatrix(grid [][]int, start int) ([]int, int64) {
	n := len(grid)
	distance := make([]int, n)
	for i := range distance {
		distance[i] = -1
	}
	distance[start] = 0
	queue := []int{start}
	var probes int64
	for head := 0; head < len(queue); head++ {
		v := queue[head]
		for u := 0; u < n; u++ {
			probes++
			if grid[v][u] == 1 && distance[u] < 0 {
				distance[u] = distance[v] + 1
				queue = append(queue, u)
			}
		}
	}
	return distance, probes
}

// reachableByWalking uses no representation: rescan the edge list until nothing changes.
func reachableByWalking(n int, edges [][2]int, start int) []int {
	distance := make([]int, n)
	for i := range distance {
		distance[i] = -1
	}
	distance[start] = 0
	changed := true
	for changed {
		changed = false
		for _, e := range edges {
			u, v := e[0], e[1]
			if distance[u] >= 0 && (distance[v] < 0 || distance[v] > distance[u]+1) {
				distance[v] = distance[u] + 1
				changed = true
			}
			if distance[v] >= 0 && (distance[u] < 0 || distance[u] > distance[v]+1) {
				distance[u] = distance[v] + 1
				changed = true
			}
		}
	}
	return distance
}

func show(values []int) string {
	parts := make([]string, len(values))
	for i, v := range values {
		parts[i] = strconv.Itoa(v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
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

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	sizes := []int{4, 4, 5, 6}
	caseEdges := [][][2]int{
		{{0, 1}, {1, 2}, {2, 3}},
		{{0, 1}, {0, 2}, {0, 3}, {1, 2}, {1, 3}, {2, 3}},
		{{0, 1}, {2, 3}},
		{{0, 1}, {1, 2}, {2, 0}, {3, 4}},
	}

	fmt.Printf("%6s%7s  %-28s%14s%14s%13s%15s\\n", "nodes", "edges", "distances",
		"list entries", "matrix cells", "list probes", "matrix probes")
	for c, n := range sizes {
		edges := caseEdges[c]
		neighbours, entries := buildList(n, edges)
		grid, cells := buildMatrix(n, edges)
		byList, listProbes := bfsList(neighbours, 0)
		byGrid, gridProbes := bfsMatrix(grid, 0)
		verdict := "DIFFER"
		if same(byList, byGrid) {
			verdict = "same"
		}
		fmt.Printf("%6d%7d  %-28s%14d%14d%13d%15d\\n", n, len(edges), show(byList)+" "+verdict,
			entries, cells, listProbes, gridProbes)
	}
	fmt.Println()

	trials := 3000
	agree, agreeWithWalk := 0, 0
	var entryTotal, cellTotal, listProbeTotal, gridProbeTotal int64
	for t := 0; t < trials; t++ {
		n := 2 + rand(9)
		var edges [][2]int
		for u := 0; u < n; u++ {
			for v := u + 1; v < n; v++ {
				if rand(3) == 0 {
					edges = append(edges, [2]int{u, v})
				}
			}
		}
		neighbours, entries := buildList(n, edges)
		grid, cells := buildMatrix(n, edges)
		byList, listProbes := bfsList(neighbours, 0)
		byGrid, gridProbes := bfsMatrix(grid, 0)
		if same(byList, byGrid) {
			agree++
		}
		if same(byList, reachableByWalking(n, edges, 0)) {
			agreeWithWalk++
		}
		entryTotal += entries
		cellTotal += cells
		listProbeTotal += listProbes
		gridProbeTotal += gridProbes
	}

	fmt.Printf("over %d random graphs of up to 10 nodes, about a third of pairs joined:\\n", trials)
	fmt.Printf("  the two representations agree     %7d\\n", agree)
	fmt.Printf("  and agree with rescanning edges   %7d\\n", agreeWithWalk)
	fmt.Println()
	fmt.Printf("  storage: %d list entries against %d matrix cells\\n", entryTotal, cellTotal)
	fmt.Printf("  search:  %d list probes against %d matrix probes\\n", listProbeTotal, gridProbeTotal)
	fmt.Println()
	fmt.Println("the answers are identical because it is the same graph. The list is smaller")
	fmt.Println("and faster to traverse here because the graph is sparse; the matrix pays for")
	fmt.Println("every pair of nodes whether or not they are joined, and reads a whole row to")
	fmt.Println("find one node's neighbours.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "A matrix is slower to traverse, not just larger",
          body: "Finding one node's neighbours means reading a whole row of n cells, so a full traversal is n squared whatever the edges. On the sparse graphs measured here that was 107,963 probes against 33,656. The memory cost is the obvious one; the traversal cost is the one that shows up in a profile.",
        },
        {
          title: "The two representations cannot disagree about the graph",
          body: "If a program gives different answers depending on which one it uses, the bug is in the construction or in one of the searches, not in the representation. They agreed on all 3,000 graphs here, and on a fourth answer computed by rescanning the edge list with no representation at all.",
        },
      ],
    },
    {
      id: "where-the-line-is",
      heading: "Where the line actually is",
      body: [
        "\"Lists for sparse graphs, matrices for dense ones\" is the received wisdom and it is true, but it is not usable advice, because it does not say where the line is or what \"dense\" means for a particular program. The line moves with the *workload*, and both sides are one counter away from being measured.",
        "So the second example runs two workloads against both representations. Asking, meaning some number of \"is this pair joined\" questions. Walking, meaning one full traversal of everything.",
        "On a forty-node graph, walking costs 1,600 probes on the matrix at every density \u2014 it is `n` squared and nothing about the edges changes it \u2014 while the list costs twice the number of edges, from 54 at the sparsest to 1,560 at the densest. The list never loses, and it cannot: twice the edges of a simple graph is at most `n` times `n - 1`, which is below `n` squared.",
        "Asking points the other way and, usefully, not unanimously. The matrix costs exactly one probe. The list costs however far the scan runs, which is the degree \u2014 so the list *wins* when a node has almost no neighbours, and a node of degree zero costs the list nothing and the matrix one. Over 3,000 small sparse graphs the matrix asked no more than the list on 2,741 of them, which means the list won 259 times.",
        "Which is the actual lesson: the choice is arithmetic about the workload, not a rule of thumb about density. Count the two operations your program performs, multiply by their costs, and the answer falls out. If the program is mostly traversal, the list wins at every density. If it is mostly edge queries on a dense graph, the matrix does. If it is both, you can hold both.",
      ],
      examples: [
        {
          id: "two-workloads",
          title: "Asking and walking, counted across six densities",
          lang: "python",
          code: `# Where the crossover is, measured rather than asserted.
#
# The received wisdom is "use a list for sparse graphs and a matrix for dense
# ones", which is true and not very useful, because it does not say where the
# line is or what "dense" means for a particular workload. The line moves with
# the workload, and both are easy to count.
#
# Two workloads, each run against both representations:
#
#   asking          -- q times, is there an edge between these two nodes?
#   traversing      -- once, visit every node's neighbours.


def build_list(n, edges):
    neighbours = [[] for _ in range(n)]
    for u, v in edges:
        neighbours[u].append(v)
        neighbours[v].append(u)
    return neighbours


def build_matrix(n, edges):
    grid = [[0] * n for _ in range(n)]
    for u, v in edges:
        grid[u][v] = 1
        grid[v][u] = 1
    return grid


def ask_list(neighbours, pairs):
    """Scan u's list looking for v. Costs the degree of u, not one lookup."""
    probes = 0
    found = 0
    for u, v in pairs:
        for w in neighbours[u]:
            probes += 1
            if w == v:
                found += 1
                break
    return found, probes


def ask_matrix(grid, pairs):
    """One cell. The whole point of the representation."""
    probes = 0
    found = 0
    for u, v in pairs:
        probes += 1
        if grid[u][v]:
            found += 1
    return found, probes


def traverse_list(neighbours):
    """Read each node's list once. Costs twice the number of edges in total."""
    probes = 0
    seen = 0
    for row in neighbours:
        for u in row:
            probes += 1
            seen += u
    return seen, probes


def traverse_matrix(grid):
    """Read every cell of every row, edge or not. Costs n squared."""
    probes = 0
    seen = 0
    for v in range(len(grid)):
        for u in range(len(grid)):
            probes += 1
            if grid[v][u]:
                seen += u
    return seen, probes


seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


def make_edges(n, one_in):
    """Join a pair with probability one in \`one_in\`."""
    edges = []
    for u in range(n):
        for v in range(u + 1, n):
            if rand(one_in) == 0:
                edges.append((u, v))
    return edges


NODES = 40
QUERIES = 200

print(f"a graph of {NODES} nodes, and {QUERIES} edge questions:")
print(f"{'one pair in':>12}{'edges':>7}{'ask: list':>11}{'ask: matrix':>13}"
      f"{'walk: list':>12}{'walk: matrix':>14}{'answers':>9}")
for one_in in [20, 10, 5, 3, 2, 1]:
    edges = make_edges(NODES, one_in)
    neighbours = build_list(NODES, edges)
    grid = build_matrix(NODES, edges)
    pairs = [(rand(NODES), rand(NODES)) for _ in range(QUERIES)]
    found_list, ask_l = ask_list(neighbours, pairs)
    found_grid, ask_m = ask_matrix(grid, pairs)
    seen_list, walk_l = traverse_list(neighbours)
    seen_grid, walk_m = traverse_matrix(grid)
    same = "same" if (found_list == found_grid and seen_list == seen_grid) else "DIFFER"
    print(f"{one_in:>12}{len(edges):>7}{ask_l:>11}{ask_m:>13}{walk_l:>12}{walk_m:>14}{same:>9}")
print()

print("so the two workloads point in opposite directions. Asking is one probe on a")
print("matrix at every density and grows with the degree on a list; walking is twice")
print("the edges on a list and n squared on a matrix whatever the density.")
print()

TRIALS = 3000
ask_agree = 0
walk_agree = 0
ask_list_total = 0
ask_grid_total = 0
walk_list_total = 0
walk_grid_total = 0
matrix_wins_asking = 0
list_wins_walking = 0
for _ in range(TRIALS):
    n = 4 + rand(9)
    edges = make_edges(n, 1 + rand(4))
    neighbours = build_list(n, edges)
    grid = build_matrix(n, edges)
    pairs = [(rand(n), rand(n)) for _ in range(1 + rand(10))]
    found_list, ask_l = ask_list(neighbours, pairs)
    found_grid, ask_m = ask_matrix(grid, pairs)
    seen_list, walk_l = traverse_list(neighbours)
    seen_grid, walk_m = traverse_matrix(grid)
    if found_list == found_grid:
        ask_agree += 1
    if seen_list == seen_grid:
        walk_agree += 1
    if ask_m <= ask_l:
        matrix_wins_asking += 1
    if walk_l <= walk_m:
        list_wins_walking += 1
    ask_list_total += ask_l
    ask_grid_total += ask_m
    walk_list_total += walk_l
    walk_grid_total += walk_m

print(f"over {TRIALS} random graphs and query batches:")
print(f"  the two agree on which edges exist    {ask_agree:>6}")
print(f"  and on what a full walk sees          {walk_agree:>6}")
print(f"  the matrix asked no more than the list {matrix_wins_asking:>5}")
print(f"  the list walked no more than the matrix{list_wins_walking:>5}")
print()
print(f"  asking:  {ask_list_total} list probes against {ask_grid_total} matrix probes")
print(f"  walking: {walk_list_total} list probes against {walk_grid_total} matrix probes")
print()
print("the list never loses at walking, and it cannot: twice the number of edges")
print("in a simple graph is at most n times n minus one, which is below n squared.")
print()
print("asking is the other way round but not unanimously. The matrix costs exactly")
print("one probe and the list costs however far the scan runs, so the list wins")
print("whenever the node has almost no neighbours -- a node of degree zero costs the")
print("list nothing and the matrix one. On these small sparse graphs that happened")
print("often enough to show up: 259 of 3000. The rule is not a rule about density,")
print("it is arithmetic about the workload, and both sides are one counter away.")
`,
          output: `a graph of 40 nodes, and 200 edge questions:
 one pair in  edges  ask: list  ask: matrix  walk: list  walk: matrix  answers
          20     27        246          200          54          1600     same
          10     89        897          200         178          1600     same
           5    154       1350          200         308          1600     same
           3    256       2204          200         512          1600     same
           2    402       3166          200         804          1600     same
           1    780       3890          200        1560          1600     same

so the two workloads point in opposite directions. Asking is one probe on a
matrix at every density and grows with the degree on a list; walking is twice
the edges on a list and n squared on a matrix whatever the density.

over 3000 random graphs and query batches:
  the two agree on which edges exist      3000
  and on what a full walk sees            3000
  the matrix asked no more than the list  2741
  the list walked no more than the matrix 3000

  asking:  44813 list probes against 16444 matrix probes
  walking: 99672 list probes against 208895 matrix probes

the list never loses at walking, and it cannot: twice the number of edges
in a simple graph is at most n times n minus one, which is below n squared.

asking is the other way round but not unanimously. The matrix costs exactly
one probe and the list costs however far the scan runs, so the list wins
whenever the node has almost no neighbours -- a node of degree zero costs the
list nothing and the matrix one. On these small sparse graphs that happened
often enough to show up: 259 of 3000. The rule is not a rule about density,
it is arithmetic about the workload, and both sides are one counter away.`,
          explanation:
            "Two workloads run against both representations across six densities, then over three thousand random graphs. The two columns move in opposite directions, and the asking column is not unanimous: a node with no neighbours costs the list nothing and the matrix one probe.",
          alternates: [
            {
              lang: "javascript",
              code: `// Where the crossover is, measured rather than asserted.
//
// The received wisdom is "use a list for sparse graphs and a matrix for dense
// ones", which is true and not very useful, because it does not say where the
// line is or what "dense" means for a particular workload. The line moves with
// the workload, and both are easy to count.
//
// Two workloads, each run against both representations:
//
//   asking          -- q times, is there an edge between these two nodes?
//   traversing      -- once, visit every node's neighbours.

function buildList(n, edges) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    neighbours[v].push(u);
  }
  return neighbours;
}

function buildMatrix(n, edges) {
  const grid = Array.from({ length: n }, () => new Array(n).fill(0));
  for (const [u, v] of edges) {
    grid[u][v] = 1;
    grid[v][u] = 1;
  }
  return grid;
}

/** Scan u's list looking for v. Costs the degree of u, not one lookup. */
function askList(neighbours, pairs) {
  let probes = 0;
  let found = 0;
  for (const [u, v] of pairs) {
    for (const w of neighbours[u]) {
      probes++;
      if (w === v) {
        found++;
        break;
      }
    }
  }
  return [found, probes];
}

/** One cell. The whole point of the representation. */
function askMatrix(grid, pairs) {
  let probes = 0;
  let found = 0;
  for (const [u, v] of pairs) {
    probes++;
    if (grid[u][v]) found++;
  }
  return [found, probes];
}

/** Read each node's list once. Costs twice the number of edges in total. */
function traverseList(neighbours) {
  let probes = 0;
  let seen = 0;
  for (const row of neighbours) {
    for (const u of row) {
      probes++;
      seen += u;
    }
  }
  return [seen, probes];
}

/** Read every cell of every row, edge or not. Costs n squared. */
function traverseMatrix(grid) {
  let probes = 0;
  let seen = 0;
  for (let v = 0; v < grid.length; v++) {
    for (let u = 0; u < grid.length; u++) {
      probes++;
      if (grid[v][u]) seen += u;
    }
  }
  return [seen, probes];
}

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

/** Join a pair with probability one in \`oneIn\`. */
function makeEdges(n, oneIn) {
  const edges = [];
  for (let u = 0; u < n; u++) {
    for (let v = u + 1; v < n; v++) {
      if (rand(oneIn) === 0) edges.push([u, v]);
    }
  }
  return edges;
}

const pad = (v, w) => String(v).padStart(w);

const NODES = 40;
const QUERIES = 200;

console.log(\`a graph of \${NODES} nodes, and \${QUERIES} edge questions:\`);
console.log(
  pad("one pair in", 12) + pad("edges", 7) + pad("ask: list", 11) + pad("ask: matrix", 13) +
    pad("walk: list", 12) + pad("walk: matrix", 14) + pad("answers", 9)
);
for (const oneIn of [20, 10, 5, 3, 2, 1]) {
  const edges = makeEdges(NODES, oneIn);
  const neighbours = buildList(NODES, edges);
  const grid = buildMatrix(NODES, edges);
  const pairs = Array.from({ length: QUERIES }, () => [rand(NODES), rand(NODES)]);
  const [foundList, askL] = askList(neighbours, pairs);
  const [foundGrid, askM] = askMatrix(grid, pairs);
  const [seenList, walkL] = traverseList(neighbours);
  const [seenGrid, walkM] = traverseMatrix(grid);
  const verdict = foundList === foundGrid && seenList === seenGrid ? "same" : "DIFFER";
  console.log(
    pad(oneIn, 12) + pad(edges.length, 7) + pad(askL, 11) + pad(askM, 13) +
      pad(walkL, 12) + pad(walkM, 14) + pad(verdict, 9)
  );
}
console.log();

console.log("so the two workloads point in opposite directions. Asking is one probe on a");
console.log("matrix at every density and grows with the degree on a list; walking is twice");
console.log("the edges on a list and n squared on a matrix whatever the density.");
console.log();

const TRIALS = 3000;
let askAgree = 0;
let walkAgree = 0;
let askListTotal = 0;
let askGridTotal = 0;
let walkListTotal = 0;
let walkGridTotal = 0;
let matrixWinsAsking = 0;
let listWinsWalking = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 4 + rand(9);
  const edges = makeEdges(n, 1 + rand(4));
  const neighbours = buildList(n, edges);
  const grid = buildMatrix(n, edges);
  const pairs = Array.from({ length: 1 + rand(10) }, () => [rand(n), rand(n)]);
  const [foundList, askL] = askList(neighbours, pairs);
  const [foundGrid, askM] = askMatrix(grid, pairs);
  const [seenList, walkL] = traverseList(neighbours);
  const [seenGrid, walkM] = traverseMatrix(grid);
  if (foundList === foundGrid) askAgree++;
  if (seenList === seenGrid) walkAgree++;
  if (askM <= askL) matrixWinsAsking++;
  if (walkL <= walkM) listWinsWalking++;
  askListTotal += askL;
  askGridTotal += askM;
  walkListTotal += walkL;
  walkGridTotal += walkM;
}

console.log(\`over \${TRIALS} random graphs and query batches:\`);
console.log("  the two agree on which edges exist    " + pad(askAgree, 6));
console.log("  and on what a full walk sees          " + pad(walkAgree, 6));
console.log("  the matrix asked no more than the list " + pad(matrixWinsAsking, 5));
console.log("  the list walked no more than the matrix" + pad(listWinsWalking, 5));
console.log();
console.log(\`  asking:  \${askListTotal} list probes against \${askGridTotal} matrix probes\`);
console.log(\`  walking: \${walkListTotal} list probes against \${walkGridTotal} matrix probes\`);
console.log();
console.log("the list never loses at walking, and it cannot: twice the number of edges");
console.log("in a simple graph is at most n times n minus one, which is below n squared.");
console.log();
console.log("asking is the other way round but not unanimously. The matrix costs exactly");
console.log("one probe and the list costs however far the scan runs, so the list wins");
console.log("whenever the node has almost no neighbours -- a node of degree zero costs the");
console.log("list nothing and the matrix one. On these small sparse graphs that happened");
console.log("often enough to show up: 259 of 3000. The rule is not a rule about density,");
console.log("it is arithmetic about the workload, and both sides are one counter away.");
`,
            },
            {
              lang: "typescript",
              code: `// Where the crossover is, measured rather than asserted.
//
// The received wisdom is "use a list for sparse graphs and a matrix for dense
// ones", which is true and not very useful, because it does not say where the
// line is or what "dense" means for a particular workload. The line moves with
// the workload, and both are easy to count.
//
// Two workloads, each run against both representations:
//
//   asking          -- q times, is there an edge between these two nodes?
//   traversing      -- once, visit every node's neighbours.

type Edge = [number, number];

function buildList(n: number, edges: Edge[]): number[][] {
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    neighbours[v].push(u);
  }
  return neighbours;
}

function buildMatrix(n: number, edges: Edge[]): number[][] {
  const grid: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (const [u, v] of edges) {
    grid[u][v] = 1;
    grid[v][u] = 1;
  }
  return grid;
}

/** Scan u's list looking for v. Costs the degree of u, not one lookup. */
function askList(neighbours: number[][], pairs: Edge[]): [number, number] {
  let probes = 0;
  let found = 0;
  for (const [u, v] of pairs) {
    for (const w of neighbours[u]) {
      probes++;
      if (w === v) {
        found++;
        break;
      }
    }
  }
  return [found, probes];
}

/** One cell. The whole point of the representation. */
function askMatrix(grid: number[][], pairs: Edge[]): [number, number] {
  let probes = 0;
  let found = 0;
  for (const [u, v] of pairs) {
    probes++;
    if (grid[u][v]) found++;
  }
  return [found, probes];
}

/** Read each node's list once. Costs twice the number of edges in total. */
function traverseList(neighbours: number[][]): [number, number] {
  let probes = 0;
  let seen = 0;
  for (const row of neighbours) {
    for (const u of row) {
      probes++;
      seen += u;
    }
  }
  return [seen, probes];
}

/** Read every cell of every row, edge or not. Costs n squared. */
function traverseMatrix(grid: number[][]): [number, number] {
  let probes = 0;
  let seen = 0;
  for (let v = 0; v < grid.length; v++) {
    for (let u = 0; u < grid.length; u++) {
      probes++;
      if (grid[v][u]) seen += u;
    }
  }
  return [seen, probes];
}

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

/** Join a pair with probability one in \`oneIn\`. */
function makeEdges(n: number, oneIn: number): Edge[] {
  const edges: Edge[] = [];
  for (let u = 0; u < n; u++) {
    for (let v = u + 1; v < n; v++) {
      if (rand(oneIn) === 0) edges.push([u, v]);
    }
  }
  return edges;
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);

const NODES = 40;
const QUERIES = 200;

console.log(\`a graph of \${NODES} nodes, and \${QUERIES} edge questions:\`);
console.log(
  pad("one pair in", 12) + pad("edges", 7) + pad("ask: list", 11) + pad("ask: matrix", 13) +
    pad("walk: list", 12) + pad("walk: matrix", 14) + pad("answers", 9)
);
for (const oneIn of [20, 10, 5, 3, 2, 1]) {
  const edges = makeEdges(NODES, oneIn);
  const neighbours = buildList(NODES, edges);
  const grid = buildMatrix(NODES, edges);
  const pairs: Edge[] = Array.from({ length: QUERIES }, () => [rand(NODES), rand(NODES)] as Edge);
  const [foundList, askL] = askList(neighbours, pairs);
  const [foundGrid, askM] = askMatrix(grid, pairs);
  const [seenList, walkL] = traverseList(neighbours);
  const [seenGrid, walkM] = traverseMatrix(grid);
  const verdict = foundList === foundGrid && seenList === seenGrid ? "same" : "DIFFER";
  console.log(
    pad(oneIn, 12) + pad(edges.length, 7) + pad(askL, 11) + pad(askM, 13) +
      pad(walkL, 12) + pad(walkM, 14) + pad(verdict, 9)
  );
}
console.log();

console.log("so the two workloads point in opposite directions. Asking is one probe on a");
console.log("matrix at every density and grows with the degree on a list; walking is twice");
console.log("the edges on a list and n squared on a matrix whatever the density.");
console.log();

const TRIALS = 3000;
let askAgree = 0;
let walkAgree = 0;
let askListTotal = 0;
let askGridTotal = 0;
let walkListTotal = 0;
let walkGridTotal = 0;
let matrixWinsAsking = 0;
let listWinsWalking = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 4 + rand(9);
  const edges = makeEdges(n, 1 + rand(4));
  const neighbours = buildList(n, edges);
  const grid = buildMatrix(n, edges);
  const pairs: Edge[] = Array.from({ length: 1 + rand(10) }, () => [rand(n), rand(n)] as Edge);
  const [foundList, askL] = askList(neighbours, pairs);
  const [foundGrid, askM] = askMatrix(grid, pairs);
  const [seenList, walkL] = traverseList(neighbours);
  const [seenGrid, walkM] = traverseMatrix(grid);
  if (foundList === foundGrid) askAgree++;
  if (seenList === seenGrid) walkAgree++;
  if (askM <= askL) matrixWinsAsking++;
  if (walkL <= walkM) listWinsWalking++;
  askListTotal += askL;
  askGridTotal += askM;
  walkListTotal += walkL;
  walkGridTotal += walkM;
}

console.log(\`over \${TRIALS} random graphs and query batches:\`);
console.log("  the two agree on which edges exist    " + pad(askAgree, 6));
console.log("  and on what a full walk sees          " + pad(walkAgree, 6));
console.log("  the matrix asked no more than the list " + pad(matrixWinsAsking, 5));
console.log("  the list walked no more than the matrix" + pad(listWinsWalking, 5));
console.log();
console.log(\`  asking:  \${askListTotal} list probes against \${askGridTotal} matrix probes\`);
console.log(\`  walking: \${walkListTotal} list probes against \${walkGridTotal} matrix probes\`);
console.log();
console.log("the list never loses at walking, and it cannot: twice the number of edges");
console.log("in a simple graph is at most n times n minus one, which is below n squared.");
console.log();
console.log("asking is the other way round but not unanimously. The matrix costs exactly");
console.log("one probe and the list costs however far the scan runs, so the list wins");
console.log("whenever the node has almost no neighbours -- a node of degree zero costs the");
console.log("list nothing and the matrix one. On these small sparse graphs that happened");
console.log("often enough to show up: 259 of 3000. The rule is not a rule about density,");
console.log("it is arithmetic about the workload, and both sides are one counter away.");
`,
            },
            {
              lang: "java",
              code: `// Where the crossover is, measured rather than asserted.
//
// The received wisdom is "use a list for sparse graphs and a matrix for dense
// ones", which is true and not very useful, because it does not say where the
// line is or what "dense" means for a particular workload. The line moves with
// the workload, and both are easy to count.
//
// Two workloads, each run against both representations:
//
//   asking          -- q times, is there an edge between these two nodes?
//   traversing      -- once, visit every node's neighbours.
import java.util.ArrayList;
import java.util.List;

public class Main {
    static long probes;

    static List<List<Integer>> buildList(int n, List<int[]> edges) {
        List<List<Integer>> neighbours = new ArrayList<>();
        for (int i = 0; i < n; i++) neighbours.add(new ArrayList<>());
        for (int[] e : edges) {
            neighbours.get(e[0]).add(e[1]);
            neighbours.get(e[1]).add(e[0]);
        }
        return neighbours;
    }

    static int[][] buildMatrix(int n, List<int[]> edges) {
        int[][] grid = new int[n][n];
        for (int[] e : edges) {
            grid[e[0]][e[1]] = 1;
            grid[e[1]][e[0]] = 1;
        }
        return grid;
    }

    // Scan u's list looking for v. Costs the degree of u, not one lookup.
    static int askList(List<List<Integer>> neighbours, List<int[]> pairs) {
        probes = 0;
        int found = 0;
        for (int[] pair : pairs) {
            for (int w : neighbours.get(pair[0])) {
                probes++;
                if (w == pair[1]) {
                    found++;
                    break;
                }
            }
        }
        return found;
    }

    // One cell. The whole point of the representation.
    static int askMatrix(int[][] grid, List<int[]> pairs) {
        probes = 0;
        int found = 0;
        for (int[] pair : pairs) {
            probes++;
            if (grid[pair[0]][pair[1]] == 1) found++;
        }
        return found;
    }

    // Read each node's list once. Costs twice the number of edges in total.
    static long traverseList(List<List<Integer>> neighbours) {
        probes = 0;
        long seen = 0;
        for (List<Integer> row : neighbours) {
            for (int u : row) {
                probes++;
                seen += u;
            }
        }
        return seen;
    }

    // Read every cell of every row, edge or not. Costs n squared.
    static long traverseMatrix(int[][] grid) {
        probes = 0;
        long seen = 0;
        for (int v = 0; v < grid.length; v++) {
            for (int u = 0; u < grid.length; u++) {
                probes++;
                if (grid[v][u] == 1) seen += u;
            }
        }
        return seen;
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    // Join a pair with probability one in \`oneIn\`.
    static List<int[]> makeEdges(int n, int oneIn) {
        List<int[]> edges = new ArrayList<>();
        for (int u = 0; u < n; u++) {
            for (int v = u + 1; v < n; v++) {
                if (rand(oneIn) == 0) edges.add(new int[] {u, v});
            }
        }
        return edges;
    }

    static String pad(Object v, int w) {
        StringBuilder sb = new StringBuilder(String.valueOf(v));
        while (sb.length() < w) sb.insert(0, ' ');
        return sb.toString();
    }

    public static void main(String[] args) {
        final int NODES = 40;
        final int QUERIES = 200;

        System.out.println("a graph of " + NODES + " nodes, and " + QUERIES + " edge questions:");
        System.out.println(pad("one pair in", 12) + pad("edges", 7) + pad("ask: list", 11)
            + pad("ask: matrix", 13) + pad("walk: list", 12) + pad("walk: matrix", 14)
            + pad("answers", 9));
        for (int oneIn : new int[] {20, 10, 5, 3, 2, 1}) {
            List<int[]> edges = makeEdges(NODES, oneIn);
            List<List<Integer>> neighbours = buildList(NODES, edges);
            int[][] grid = buildMatrix(NODES, edges);
            List<int[]> pairs = new ArrayList<>();
            for (int q = 0; q < QUERIES; q++) pairs.add(new int[] {rand(NODES), rand(NODES)});
            int foundList = askList(neighbours, pairs);
            long askL = probes;
            int foundGrid = askMatrix(grid, pairs);
            long askM = probes;
            long seenList = traverseList(neighbours);
            long walkL = probes;
            long seenGrid = traverseMatrix(grid);
            long walkM = probes;
            String verdict = (foundList == foundGrid && seenList == seenGrid) ? "same" : "DIFFER";
            System.out.println(pad(oneIn, 12) + pad(edges.size(), 7) + pad(askL, 11) + pad(askM, 13)
                + pad(walkL, 12) + pad(walkM, 14) + pad(verdict, 9));
        }
        System.out.println();

        System.out.println("so the two workloads point in opposite directions. Asking is one probe on a");
        System.out.println("matrix at every density and grows with the degree on a list; walking is twice");
        System.out.println("the edges on a list and n squared on a matrix whatever the density.");
        System.out.println();

        int trials = 3000;
        int askAgree = 0, walkAgree = 0, matrixWinsAsking = 0, listWinsWalking = 0;
        long askListTotal = 0, askGridTotal = 0, walkListTotal = 0, walkGridTotal = 0;
        for (int t = 0; t < trials; t++) {
            int n = 4 + rand(9);
            List<int[]> edges = makeEdges(n, 1 + rand(4));
            List<List<Integer>> neighbours = buildList(n, edges);
            int[][] grid = buildMatrix(n, edges);
            int q = 1 + rand(10);
            List<int[]> pairs = new ArrayList<>();
            for (int k = 0; k < q; k++) pairs.add(new int[] {rand(n), rand(n)});
            int foundList = askList(neighbours, pairs);
            long askL = probes;
            int foundGrid = askMatrix(grid, pairs);
            long askM = probes;
            long seenList = traverseList(neighbours);
            long walkL = probes;
            long seenGrid = traverseMatrix(grid);
            long walkM = probes;
            if (foundList == foundGrid) askAgree++;
            if (seenList == seenGrid) walkAgree++;
            if (askM <= askL) matrixWinsAsking++;
            if (walkL <= walkM) listWinsWalking++;
            askListTotal += askL;
            askGridTotal += askM;
            walkListTotal += walkL;
            walkGridTotal += walkM;
        }

        System.out.println("over " + trials + " random graphs and query batches:");
        System.out.println("  the two agree on which edges exist    " + pad(askAgree, 6));
        System.out.println("  and on what a full walk sees          " + pad(walkAgree, 6));
        System.out.println("  the matrix asked no more than the list " + pad(matrixWinsAsking, 5));
        System.out.println("  the list walked no more than the matrix" + pad(listWinsWalking, 5));
        System.out.println();
        System.out.println("  asking:  " + askListTotal + " list probes against " + askGridTotal + " matrix probes");
        System.out.println("  walking: " + walkListTotal + " list probes against " + walkGridTotal + " matrix probes");
        System.out.println();
        System.out.println("the list never loses at walking, and it cannot: twice the number of edges");
        System.out.println("in a simple graph is at most n times n minus one, which is below n squared.");
        System.out.println();
        System.out.println("asking is the other way round but not unanimously. The matrix costs exactly");
        System.out.println("one probe and the list costs however far the scan runs, so the list wins");
        System.out.println("whenever the node has almost no neighbours -- a node of degree zero costs the");
        System.out.println("list nothing and the matrix one. On these small sparse graphs that happened");
        System.out.println("often enough to show up: 259 of 3000. The rule is not a rule about density,");
        System.out.println("it is arithmetic about the workload, and both sides are one counter away.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Where the crossover is, measured rather than asserted.
//
// The received wisdom is "use a list for sparse graphs and a matrix for dense
// ones", which is true and not very useful, because it does not say where the
// line is or what "dense" means for a particular workload. The line moves with
// the workload, and both are easy to count.
//
// Two workloads, each run against both representations:
//
//   asking          -- q times, is there an edge between these two nodes?
//   traversing      -- once, visit every node's neighbours.
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

using Pair = std::array<int, 2>;

std::vector<std::vector<int>> buildList(int n, const std::vector<Pair> &edges) {
    std::vector<std::vector<int>> neighbours(n);
    for (const Pair &e : edges) {
        neighbours[e[0]].push_back(e[1]);
        neighbours[e[1]].push_back(e[0]);
    }
    return neighbours;
}

std::vector<std::vector<int>> buildMatrix(int n, const std::vector<Pair> &edges) {
    std::vector<std::vector<int>> grid(n, std::vector<int>(n, 0));
    for (const Pair &e : edges) {
        grid[e[0]][e[1]] = 1;
        grid[e[1]][e[0]] = 1;
    }
    return grid;
}

// Scan u's list looking for v. Costs the degree of u, not one lookup.
std::pair<int, std::int64_t> askList(const std::vector<std::vector<int>> &neighbours,
                                     const std::vector<Pair> &pairs) {
    std::int64_t probes = 0;
    int found = 0;
    for (const Pair &p : pairs) {
        for (int w : neighbours[p[0]]) {
            probes++;
            if (w == p[1]) {
                found++;
                break;
            }
        }
    }
    return {found, probes};
}

// One cell. The whole point of the representation.
std::pair<int, std::int64_t> askMatrix(const std::vector<std::vector<int>> &grid,
                                       const std::vector<Pair> &pairs) {
    std::int64_t probes = 0;
    int found = 0;
    for (const Pair &p : pairs) {
        probes++;
        if (grid[p[0]][p[1]]) found++;
    }
    return {found, probes};
}

// Read each node's list once. Costs twice the number of edges in total.
std::pair<std::int64_t, std::int64_t> traverseList(const std::vector<std::vector<int>> &neighbours) {
    std::int64_t probes = 0, seen = 0;
    for (const auto &row : neighbours) {
        for (int u : row) {
            probes++;
            seen += u;
        }
    }
    return {seen, probes};
}

// Read every cell of every row, edge or not. Costs n squared.
std::pair<std::int64_t, std::int64_t> traverseMatrix(const std::vector<std::vector<int>> &grid) {
    std::int64_t probes = 0, seen = 0;
    for (size_t v = 0; v < grid.size(); v++) {
        for (size_t u = 0; u < grid.size(); u++) {
            probes++;
            if (grid[v][u]) seen += static_cast<std::int64_t>(u);
        }
    }
    return {seen, probes};
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

// Join a pair with probability one in \`oneIn\`.
std::vector<Pair> makeEdges(int n, int oneIn) {
    std::vector<Pair> edges;
    for (int u = 0; u < n; u++) {
        for (int v = u + 1; v < n; v++) {
            if (rnd(oneIn) == 0) edges.push_back({u, v});
        }
    }
    return edges;
}

int main() {
    const int NODES = 40;
    const int QUERIES = 200;

    std::cout << "a graph of " << NODES << " nodes, and " << QUERIES << " edge questions:\\n";
    std::cout << std::right << std::setw(12) << "one pair in" << std::setw(7) << "edges"
              << std::setw(11) << "ask: list" << std::setw(13) << "ask: matrix"
              << std::setw(12) << "walk: list" << std::setw(14) << "walk: matrix"
              << std::setw(9) << "answers" << "\\n";
    for (int oneIn : {20, 10, 5, 3, 2, 1}) {
        auto edges = makeEdges(NODES, oneIn);
        auto neighbours = buildList(NODES, edges);
        auto grid = buildMatrix(NODES, edges);
        std::vector<Pair> pairs;
        for (int q = 0; q < QUERIES; q++) pairs.push_back({rnd(NODES), rnd(NODES)});
        auto asked = askList(neighbours, pairs);
        auto askedGrid = askMatrix(grid, pairs);
        auto walked = traverseList(neighbours);
        auto walkedGrid = traverseMatrix(grid);
        std::string verdict =
            (asked.first == askedGrid.first && walked.first == walkedGrid.first) ? "same" : "DIFFER";
        std::cout << std::setw(12) << oneIn << std::setw(7) << edges.size()
                  << std::setw(11) << asked.second << std::setw(13) << askedGrid.second
                  << std::setw(12) << walked.second << std::setw(14) << walkedGrid.second
                  << std::setw(9) << verdict << "\\n";
    }
    std::cout << "\\n";

    std::cout << "so the two workloads point in opposite directions. Asking is one probe on a\\n";
    std::cout << "matrix at every density and grows with the degree on a list; walking is twice\\n";
    std::cout << "the edges on a list and n squared on a matrix whatever the density.\\n\\n";

    const int TRIALS = 3000;
    int askAgree = 0, walkAgree = 0, matrixWinsAsking = 0, listWinsWalking = 0;
    std::int64_t askListTotal = 0, askGridTotal = 0, walkListTotal = 0, walkGridTotal = 0;
    for (int t = 0; t < TRIALS; t++) {
        int n = 4 + rnd(9);
        auto edges = makeEdges(n, 1 + rnd(4));
        auto neighbours = buildList(n, edges);
        auto grid = buildMatrix(n, edges);
        int q = 1 + rnd(10);
        std::vector<Pair> pairs;
        for (int k = 0; k < q; k++) pairs.push_back({rnd(n), rnd(n)});
        auto asked = askList(neighbours, pairs);
        auto askedGrid = askMatrix(grid, pairs);
        auto walked = traverseList(neighbours);
        auto walkedGrid = traverseMatrix(grid);
        if (asked.first == askedGrid.first) askAgree++;
        if (walked.first == walkedGrid.first) walkAgree++;
        if (askedGrid.second <= asked.second) matrixWinsAsking++;
        if (walked.second <= walkedGrid.second) listWinsWalking++;
        askListTotal += asked.second;
        askGridTotal += askedGrid.second;
        walkListTotal += walked.second;
        walkGridTotal += walkedGrid.second;
    }

    std::cout << "over " << TRIALS << " random graphs and query batches:\\n";
    std::cout << "  the two agree on which edges exist    " << std::setw(6) << askAgree << "\\n";
    std::cout << "  and on what a full walk sees          " << std::setw(6) << walkAgree << "\\n";
    std::cout << "  the matrix asked no more than the list " << std::setw(5) << matrixWinsAsking << "\\n";
    std::cout << "  the list walked no more than the matrix" << std::setw(5) << listWinsWalking << "\\n\\n";
    std::cout << "  asking:  " << askListTotal << " list probes against " << askGridTotal << " matrix probes\\n";
    std::cout << "  walking: " << walkListTotal << " list probes against " << walkGridTotal << " matrix probes\\n\\n";
    std::cout << "the list never loses at walking, and it cannot: twice the number of edges\\n";
    std::cout << "in a simple graph is at most n times n minus one, which is below n squared.\\n\\n";
    std::cout << "asking is the other way round but not unanimously. The matrix costs exactly\\n";
    std::cout << "one probe and the list costs however far the scan runs, so the list wins\\n";
    std::cout << "whenever the node has almost no neighbours -- a node of degree zero costs the\\n";
    std::cout << "list nothing and the matrix one. On these small sparse graphs that happened\\n";
    std::cout << "often enough to show up: 259 of 3000. The rule is not a rule about density,\\n";
    std::cout << "it is arithmetic about the workload, and both sides are one counter away.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// Where the crossover is, measured rather than asserted.
//
// The received wisdom is "use a list for sparse graphs and a matrix for dense
// ones", which is true and not very useful, because it does not say where the
// line is or what "dense" means for a particular workload. The line moves with
// the workload, and both are easy to count.
//
// Two workloads, each run against both representations:
//
//   asking          -- q times, is there an edge between these two nodes?
//   traversing      -- once, visit every node's neighbours.

type Pair = (usize, usize);

fn build_list(n: usize, edges: &[Pair]) -> Vec<Vec<usize>> {
    let mut neighbours: Vec<Vec<usize>> = vec![Vec::new(); n];
    for &(u, v) in edges {
        neighbours[u].push(v);
        neighbours[v].push(u);
    }
    neighbours
}

fn build_matrix(n: usize, edges: &[Pair]) -> Vec<Vec<i32>> {
    let mut grid = vec![vec![0i32; n]; n];
    for &(u, v) in edges {
        grid[u][v] = 1;
        grid[v][u] = 1;
    }
    grid
}

/// Scan u's list looking for v. Costs the degree of u, not one lookup.
fn ask_list(neighbours: &[Vec<usize>], pairs: &[Pair]) -> (i64, i64) {
    let mut probes = 0i64;
    let mut found = 0i64;
    for &(u, v) in pairs {
        for &w in &neighbours[u] {
            probes += 1;
            if w == v {
                found += 1;
                break;
            }
        }
    }
    (found, probes)
}

/// One cell. The whole point of the representation.
fn ask_matrix(grid: &[Vec<i32>], pairs: &[Pair]) -> (i64, i64) {
    let mut probes = 0i64;
    let mut found = 0i64;
    for &(u, v) in pairs {
        probes += 1;
        if grid[u][v] == 1 {
            found += 1;
        }
    }
    (found, probes)
}

/// Read each node's list once. Costs twice the number of edges in total.
fn traverse_list(neighbours: &[Vec<usize>]) -> (i64, i64) {
    let mut probes = 0i64;
    let mut seen = 0i64;
    for row in neighbours {
        for &u in row {
            probes += 1;
            seen += u as i64;
        }
    }
    (seen, probes)
}

/// Read every cell of every row, edge or not. Costs n squared.
fn traverse_matrix(grid: &[Vec<i32>]) -> (i64, i64) {
    let mut probes = 0i64;
    let mut seen = 0i64;
    for v in 0..grid.len() {
        for u in 0..grid.len() {
            probes += 1;
            if grid[v][u] == 1 {
                seen += u as i64;
            }
        }
    }
    (seen, probes)
}

struct Rng {
    seed: i64,
}

impl Rng {
    fn next(&mut self, n: i64) -> i64 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        self.seed / 65536 % n
    }
}

/// Join a pair with probability one in \`one_in\`.
fn make_edges(rng: &mut Rng, n: usize, one_in: i64) -> Vec<Pair> {
    let mut edges = Vec::new();
    for u in 0..n {
        for v in (u + 1)..n {
            if rng.next(one_in) == 0 {
                edges.push((u, v));
            }
        }
    }
    edges
}

fn main() {
    const NODES: usize = 40;
    const QUERIES: usize = 200;
    let mut rng = Rng { seed: 1 };

    println!("a graph of {} nodes, and {} edge questions:", NODES, QUERIES);
    println!(
        "{:>12}{:>7}{:>11}{:>13}{:>12}{:>14}{:>9}",
        "one pair in", "edges", "ask: list", "ask: matrix", "walk: list", "walk: matrix", "answers"
    );
    for one_in in [20i64, 10, 5, 3, 2, 1] {
        let edges = make_edges(&mut rng, NODES, one_in);
        let neighbours = build_list(NODES, &edges);
        let grid = build_matrix(NODES, &edges);
        let pairs: Vec<Pair> = (0..QUERIES)
            .map(|_| (rng.next(NODES as i64) as usize, rng.next(NODES as i64) as usize))
            .collect();
        let (found_list, ask_l) = ask_list(&neighbours, &pairs);
        let (found_grid, ask_m) = ask_matrix(&grid, &pairs);
        let (seen_list, walk_l) = traverse_list(&neighbours);
        let (seen_grid, walk_m) = traverse_matrix(&grid);
        let verdict = if found_list == found_grid && seen_list == seen_grid { "same" } else { "DIFFER" };
        println!(
            "{:>12}{:>7}{:>11}{:>13}{:>12}{:>14}{:>9}",
            one_in, edges.len(), ask_l, ask_m, walk_l, walk_m, verdict
        );
    }
    println!();

    println!("so the two workloads point in opposite directions. Asking is one probe on a");
    println!("matrix at every density and grows with the degree on a list; walking is twice");
    println!("the edges on a list and n squared on a matrix whatever the density.");
    println!();

    let trials = 3000;
    let (mut ask_agree, mut walk_agree) = (0, 0);
    let (mut matrix_wins_asking, mut list_wins_walking) = (0, 0);
    let (mut ask_list_total, mut ask_grid_total) = (0i64, 0i64);
    let (mut walk_list_total, mut walk_grid_total) = (0i64, 0i64);
    for _ in 0..trials {
        let n = (4 + rng.next(9)) as usize;
        // The density is drawn before the edges, so the stream matches the other
        // languages, where the argument is evaluated before the call.
        let one_in = 1 + rng.next(4);
        let edges = make_edges(&mut rng, n, one_in);
        let neighbours = build_list(n, &edges);
        let grid = build_matrix(n, &edges);
        let q = 1 + rng.next(10);
        let pairs: Vec<Pair> = (0..q)
            .map(|_| (rng.next(n as i64) as usize, rng.next(n as i64) as usize))
            .collect();
        let (found_list, ask_l) = ask_list(&neighbours, &pairs);
        let (found_grid, ask_m) = ask_matrix(&grid, &pairs);
        let (seen_list, walk_l) = traverse_list(&neighbours);
        let (seen_grid, walk_m) = traverse_matrix(&grid);
        if found_list == found_grid {
            ask_agree += 1;
        }
        if seen_list == seen_grid {
            walk_agree += 1;
        }
        if ask_m <= ask_l {
            matrix_wins_asking += 1;
        }
        if walk_l <= walk_m {
            list_wins_walking += 1;
        }
        ask_list_total += ask_l;
        ask_grid_total += ask_m;
        walk_list_total += walk_l;
        walk_grid_total += walk_m;
    }

    println!("over {} random graphs and query batches:", trials);
    println!("  the two agree on which edges exist    {:>6}", ask_agree);
    println!("  and on what a full walk sees          {:>6}", walk_agree);
    println!("  the matrix asked no more than the list {:>5}", matrix_wins_asking);
    println!("  the list walked no more than the matrix{:>5}", list_wins_walking);
    println!();
    println!("  asking:  {} list probes against {} matrix probes", ask_list_total, ask_grid_total);
    println!("  walking: {} list probes against {} matrix probes", walk_list_total, walk_grid_total);
    println!();
    println!("the list never loses at walking, and it cannot: twice the number of edges");
    println!("in a simple graph is at most n times n minus one, which is below n squared.");
    println!();
    println!("asking is the other way round but not unanimously. The matrix costs exactly");
    println!("one probe and the list costs however far the scan runs, so the list wins");
    println!("whenever the node has almost no neighbours -- a node of degree zero costs the");
    println!("list nothing and the matrix one. On these small sparse graphs that happened");
    println!("often enough to show up: 259 of 3000. The rule is not a rule about density,");
    println!("it is arithmetic about the workload, and both sides are one counter away.");
}
`,
            },
            {
              lang: "go",
              code: `// Where the crossover is, measured rather than asserted.
//
// The received wisdom is "use a list for sparse graphs and a matrix for dense
// ones", which is true and not very useful, because it does not say where the
// line is or what "dense" means for a particular workload. The line moves with
// the workload, and both are easy to count.
//
// Two workloads, each run against both representations:
//
//   asking          -- q times, is there an edge between these two nodes?
//   traversing      -- once, visit every node's neighbours.
package main

import "fmt"

func buildList(n int, edges [][2]int) [][]int {
	neighbours := make([][]int, n)
	for _, e := range edges {
		neighbours[e[0]] = append(neighbours[e[0]], e[1])
		neighbours[e[1]] = append(neighbours[e[1]], e[0])
	}
	return neighbours
}

func buildMatrix(n int, edges [][2]int) [][]int {
	grid := make([][]int, n)
	for i := range grid {
		grid[i] = make([]int, n)
	}
	for _, e := range edges {
		grid[e[0]][e[1]] = 1
		grid[e[1]][e[0]] = 1
	}
	return grid
}

// askList scans u's list looking for v: the degree of u, not one lookup.
func askList(neighbours [][]int, pairs [][2]int) (int, int64) {
	var probes int64
	found := 0
	for _, pair := range pairs {
		for _, w := range neighbours[pair[0]] {
			probes++
			if w == pair[1] {
				found++
				break
			}
		}
	}
	return found, probes
}

// askMatrix reads one cell. The whole point of the representation.
func askMatrix(grid [][]int, pairs [][2]int) (int, int64) {
	var probes int64
	found := 0
	for _, pair := range pairs {
		probes++
		if grid[pair[0]][pair[1]] == 1 {
			found++
		}
	}
	return found, probes
}

// traverseList reads each node's list once: twice the number of edges in total.
func traverseList(neighbours [][]int) (int64, int64) {
	var probes, seen int64
	for _, row := range neighbours {
		for _, u := range row {
			probes++
			seen += int64(u)
		}
	}
	return seen, probes
}

// traverseMatrix reads every cell of every row, edge or not: n squared.
func traverseMatrix(grid [][]int) (int64, int64) {
	var probes, seen int64
	for v := range grid {
		for u := range grid {
			probes++
			if grid[v][u] == 1 {
				seen += int64(u)
			}
		}
	}
	return seen, probes
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

// makeEdges joins a pair with probability one in oneIn.
func makeEdges(n, oneIn int) [][2]int {
	var edges [][2]int
	for u := 0; u < n; u++ {
		for v := u + 1; v < n; v++ {
			if rand(oneIn) == 0 {
				edges = append(edges, [2]int{u, v})
			}
		}
	}
	return edges
}

func main() {
	const nodes = 40
	const queries = 200

	fmt.Printf("a graph of %d nodes, and %d edge questions:\\n", nodes, queries)
	fmt.Printf("%12s%7s%11s%13s%12s%14s%9s\\n", "one pair in", "edges", "ask: list",
		"ask: matrix", "walk: list", "walk: matrix", "answers")
	for _, oneIn := range []int{20, 10, 5, 3, 2, 1} {
		edges := makeEdges(nodes, oneIn)
		neighbours := buildList(nodes, edges)
		grid := buildMatrix(nodes, edges)
		pairs := make([][2]int, queries)
		for q := range pairs {
			pairs[q] = [2]int{rand(nodes), rand(nodes)}
		}
		foundList, askL := askList(neighbours, pairs)
		foundGrid, askM := askMatrix(grid, pairs)
		seenList, walkL := traverseList(neighbours)
		seenGrid, walkM := traverseMatrix(grid)
		verdict := "DIFFER"
		if foundList == foundGrid && seenList == seenGrid {
			verdict = "same"
		}
		fmt.Printf("%12d%7d%11d%13d%12d%14d%9s\\n", oneIn, len(edges), askL, askM, walkL, walkM, verdict)
	}
	fmt.Println()

	fmt.Println("so the two workloads point in opposite directions. Asking is one probe on a")
	fmt.Println("matrix at every density and grows with the degree on a list; walking is twice")
	fmt.Println("the edges on a list and n squared on a matrix whatever the density.")
	fmt.Println()

	trials := 3000
	askAgree, walkAgree, matrixWinsAsking, listWinsWalking := 0, 0, 0, 0
	var askListTotal, askGridTotal, walkListTotal, walkGridTotal int64
	for t := 0; t < trials; t++ {
		n := 4 + rand(9)
		edges := makeEdges(n, 1+rand(4))
		neighbours := buildList(n, edges)
		grid := buildMatrix(n, edges)
		q := 1 + rand(10)
		pairs := make([][2]int, q)
		for k := range pairs {
			pairs[k] = [2]int{rand(n), rand(n)}
		}
		foundList, askL := askList(neighbours, pairs)
		foundGrid, askM := askMatrix(grid, pairs)
		seenList, walkL := traverseList(neighbours)
		seenGrid, walkM := traverseMatrix(grid)
		if foundList == foundGrid {
			askAgree++
		}
		if seenList == seenGrid {
			walkAgree++
		}
		if askM <= askL {
			matrixWinsAsking++
		}
		if walkL <= walkM {
			listWinsWalking++
		}
		askListTotal += askL
		askGridTotal += askM
		walkListTotal += walkL
		walkGridTotal += walkM
	}

	fmt.Printf("over %d random graphs and query batches:\\n", trials)
	fmt.Printf("  the two agree on which edges exist    %6d\\n", askAgree)
	fmt.Printf("  and on what a full walk sees          %6d\\n", walkAgree)
	fmt.Printf("  the matrix asked no more than the list %5d\\n", matrixWinsAsking)
	fmt.Printf("  the list walked no more than the matrix%5d\\n", listWinsWalking)
	fmt.Println()
	fmt.Printf("  asking:  %d list probes against %d matrix probes\\n", askListTotal, askGridTotal)
	fmt.Printf("  walking: %d list probes against %d matrix probes\\n", walkListTotal, walkGridTotal)
	fmt.Println()
	fmt.Println("the list never loses at walking, and it cannot: twice the number of edges")
	fmt.Println("in a simple graph is at most n times n minus one, which is below n squared.")
	fmt.Println()
	fmt.Println("asking is the other way round but not unanimously. The matrix costs exactly")
	fmt.Println("one probe and the list costs however far the scan runs, so the list wins")
	fmt.Println("whenever the node has almost no neighbours -- a node of degree zero costs the")
	fmt.Println("list nothing and the matrix one. On these small sparse graphs that happened")
	fmt.Println("often enough to show up: 259 of 3000. The rule is not a rule about density,")
	fmt.Println("it is arithmetic about the workload, and both sides are one counter away.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "\"Sparse means list, dense means matrix\" does not say where the line is",
          body: "Count instead. Walking costs twice the edges on a list and n squared on a matrix; asking costs the degree on a list and one on a matrix. Multiply by how often the program does each. The answer depends on the workload, and it can be that the list is right for a dense graph or the matrix for a sparse one.",
        },
        {
          title: "The matrix does not always win at edge queries",
          body: "It costs exactly one probe, and a list scan of a low-degree node can cost less than that \u2014 zero for a node with no neighbours. On the small sparse graphs measured, the list won 259 times out of 3,000. It is a strong tendency, not a law.",
        },
      ],
    },
    {
      id: "the-third-representation",
      heading: "The third representation, and what a matrix loses",
      body: [
        "The third representation is the edge list \u2014 just the edges, in a list, with no index at all \u2014 and it is worth knowing for two separate reasons.",
        "The first is that a family of algorithms never asks \"who is next to `u`\" and so never needs an index. Kruskal sorts the edges and walks them in order. Bellman-Ford relaxes all of them repeatedly. Building an adjacency structure for either is wasted work, and the example runs Kruskal straight off the edge list, scored against enumerating every subset of edges \u2014 3,000 out of 3,000.",
        "The second reason is a correctness one, and it is the part worth remembering. **A boolean matrix cannot store a multigraph.** It has one cell per pair, so two roads between the same pair of towns collapse into one, and a road that loops back to its own town lands on the diagonal where it counts once instead of twice.",
        "The measurement is blunt. Over 3,000 random edge lists that may repeat a pair or loop on a node, degrees computed from the list agreed with degrees computed through a matrix on 812 of them, and the edge count agreed on 1,805. That is not a subtle numerical drift; the matrix has thrown information away before any algorithm runs.",
        "On a simple graph \u2014 no repeats, no loops \u2014 none of that matters and a matrix is a faithful container. The point is to notice which one you have. \"Multiple flights between two cities\", \"several cables between two routers\", \"a road that starts and ends in the same town\" are all statements that a matrix will quietly discard.",
      ],
      examples: [
        {
          id: "edge-list-and-multigraphs",
          title: "Kruskal off the raw edge list, and what a matrix cannot hold",
          lang: "python",
          code: `# The third representation, and the thing a matrix cannot store.
#
# An edge list is just the edges, in a list, with no index at all. It looks too
# primitive to be useful and it is exactly right for a family of algorithms --
# anything that sorts the edges (Kruskal) or relaxes all of them repeatedly
# (Bellman-Ford) never asks "who is next to u" and so never needs an index.
#
# It also stores something the other two do not. A boolean matrix has one cell
# per pair, so it cannot hold two edges between the same pair, and it silently
# collapses them. On a plain simple graph that is harmless. On a multigraph it
# changes the answers.


def degrees_from_list(n, edges):
    """Count every endpoint, so parallel edges and self-loops both count."""
    degree = [0] * n
    for u, v in edges:
        degree[u] += 1
        degree[v] += 1
    return degree


def degrees_from_matrix(n, edges):
    """Build a yes-or-no grid first, then count. Repeats have nowhere to go."""
    grid = [[0] * n for _ in range(n)]
    for u, v in edges:
        grid[u][v] = 1
        grid[v][u] = 1
    degree = [0] * n
    for u in range(n):
        for v in range(n):
            if grid[u][v]:
                degree[u] += 1
    return degree


def count_from_list(edges):
    return len(edges)


def count_from_matrix(n, edges):
    grid = [[0] * n for _ in range(n)]
    for u, v in edges:
        grid[u][v] = 1
        grid[v][u] = 1
    total = 0
    for u in range(n):
        for v in range(u, n):
            if grid[u][v]:
                total += 1
    return total


def cheapest_tree_from_edges(n, weighted):
    """Kruskal, which reads the edge list in weight order and no index at all."""
    order = sorted(range(len(weighted)), key=lambda i: weighted[i][2])
    parent = list(range(n))

    def root(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    total = 0
    used = 0
    for i in order:
        u, v, w = weighted[i]
        a, b = root(u), root(v)
        if a != b:
            parent[a] = b
            total += w
            used += 1
    return (total if used == n - 1 else -1), used


def cheapest_tree_by_subsets(n, weighted):
    """Every subset of edges, kept if it joins everything without a cycle."""
    best = -1
    m = len(weighted)
    for mask in range(1 << m):
        chosen = [weighted[i] for i in range(m) if mask >> i & 1]
        if len(chosen) != n - 1:
            continue
        parent = list(range(n))

        def root(x):
            while parent[x] != x:
                x = parent[x]
            return x

        total = 0
        ok = True
        for u, v, w in chosen:
            a, b = root(u), root(v)
            if a == b:
                ok = False
            else:
                parent[a] = b
                total += w
        if ok and (best < 0 or total < best):
            best = total
    return best


def show(values):
    return "[" + ", ".join(str(v) for v in values) + "]"


CASES = [
    (3, [(0, 1), (1, 2)]),
    (3, [(0, 1), (0, 1), (1, 2)]),
    (3, [(0, 0), (0, 1), (1, 2)]),
    (4, [(0, 1), (0, 1), (0, 1), (2, 3)]),
]

print(f"{'nodes':>6}  {'edges':<28}{'degrees, list':>16}{'degrees, matrix':>18}"
      f"{'count, list':>13}{'count, matrix':>15}")
for n, edges in CASES:
    shown = "[" + ", ".join(f"{u}-{v}" for u, v in edges) + "]"
    print(f"{n:>6}  {shown:<28}{show(degrees_from_list(n, edges)):>16}"
          f"{show(degrees_from_matrix(n, edges)):>18}{count_from_list(edges):>13}"
          f"{count_from_matrix(n, edges):>15}")
print()

WEIGHTED = [
    (4, [(0, 1, 1), (1, 2, 2), (2, 3, 3), (0, 3, 9)]),
    (4, [(0, 1, 5), (0, 2, 1), (0, 3, 4), (1, 2, 2), (2, 3, 3)]),
    (3, [(0, 1, 7), (1, 2, 7)]),
    (4, [(0, 1, 1), (2, 3, 1)]),
]

print("and the algorithm that wants the edge list and nothing else:")
print(f"{'nodes':>6}{'edges':>7}{'kruskal':>10}{'every subset':>14}{'edges used':>12}")
for n, weighted in WEIGHTED:
    total, used = cheapest_tree_from_edges(n, weighted)
    print(f"{n:>6}{len(weighted):>7}{total:>10}{cheapest_tree_by_subsets(n, weighted):>14}{used:>12}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
degrees_agree = 0
counts_agree = 0
had_repeats = 0
kruskal_ok = 0
for _ in range(TRIALS):
    n = 2 + rand(4)
    m = 1 + rand(5)
    edges = []
    for _ in range(m):
        u = rand(n)
        v = rand(n)
        edges.append((u, v))
    if degrees_from_list(n, edges) == degrees_from_matrix(n, edges):
        degrees_agree += 1
    if count_from_list(edges) == count_from_matrix(n, edges):
        counts_agree += 1
    seen_pairs = []
    repeated = False
    for u, v in edges:
        key = (min(u, v), max(u, v))
        if key in seen_pairs:
            repeated = True
        seen_pairs.append(key)
    if repeated or any(u == v for u, v in edges):
        had_repeats += 1
    weighted = [(u, v, 1 + rand(9)) for u, v in edges if u != v]
    total, _ = cheapest_tree_from_edges(n, weighted)
    if total == cheapest_tree_by_subsets(n, weighted):
        kruskal_ok += 1

print(f"over {TRIALS} random edge lists that may repeat a pair or loop on a node:")
print(f"  degrees, list against matrix    {degrees_agree:>6}")
print(f"  edge count, list against matrix {counts_agree:>6}")
print(f"  lists that had a repeat or loop {had_repeats:>6}")
print(f"  kruskal against every subset    {kruskal_ok:>6}")
print()
print("so the matrix is not a lossless container. It stores a relation -- is this")
print("pair joined -- and a multigraph is not a relation. If the problem says")
print("multiple roads between two towns, or a road that loops back to its own town,")
print("the matrix has already thrown that away by the time any algorithm runs.")
`,
          output: ` nodes  edges                          degrees, list   degrees, matrix  count, list  count, matrix
     3  [0-1, 1-2]                         [1, 2, 1]         [1, 2, 1]            2              2
     3  [0-1, 0-1, 1-2]                    [2, 3, 1]         [1, 2, 1]            3              2
     3  [0-0, 0-1, 1-2]                    [3, 2, 1]         [2, 2, 1]            3              3
     4  [0-1, 0-1, 0-1, 2-3]            [3, 3, 1, 1]      [1, 1, 1, 1]            4              2

and the algorithm that wants the edge list and nothing else:
 nodes  edges   kruskal  every subset  edges used
     4      4         6             6           3
     4      5         6             6           3
     3      2        14            14           2
     4      2        -1            -1           2

over 3000 random edge lists that may repeat a pair or loop on a node:
  degrees, list against matrix       812
  edge count, list against matrix   1805
  lists that had a repeat or loop   2188
  kruskal against every subset      3000

so the matrix is not a lossless container. It stores a relation -- is this
pair joined -- and a multigraph is not a relation. If the problem says
multiple roads between two towns, or a road that loops back to its own town,
the matrix has already thrown that away by the time any algorithm runs.`,
          explanation:
            "Kruskal reading the edge list directly, scored against every subset of edges, and then the thing a matrix cannot hold. Degrees and edge counts computed through a matrix disagree with the edge list on most random multigraphs, because the information was gone before the counting started.",
          alternates: [
            {
              lang: "javascript",
              code: `// The third representation, and the thing a matrix cannot store.
//
// An edge list is just the edges, in a list, with no index at all. It looks too
// primitive to be useful and it is exactly right for a family of algorithms --
// anything that sorts the edges (Kruskal) or relaxes all of them repeatedly
// (Bellman-Ford) never asks "who is next to u" and so never needs an index.
//
// It also stores something the other two do not. A boolean matrix has one cell
// per pair, so it cannot hold two edges between the same pair, and it silently
// collapses them. On a plain simple graph that is harmless. On a multigraph it
// changes the answers.

/** Count every endpoint, so parallel edges and self-loops both count. */
function degreesFromList(n, edges) {
  const degree = new Array(n).fill(0);
  for (const [u, v] of edges) {
    degree[u]++;
    degree[v]++;
  }
  return degree;
}

/** Build a yes-or-no grid first, then count. Repeats have nowhere to go. */
function degreesFromMatrix(n, edges) {
  const grid = Array.from({ length: n }, () => new Array(n).fill(0));
  for (const [u, v] of edges) {
    grid[u][v] = 1;
    grid[v][u] = 1;
  }
  const degree = new Array(n).fill(0);
  for (let u = 0; u < n; u++) {
    for (let v = 0; v < n; v++) {
      if (grid[u][v]) degree[u]++;
    }
  }
  return degree;
}

const countFromList = (edges) => edges.length;

function countFromMatrix(n, edges) {
  const grid = Array.from({ length: n }, () => new Array(n).fill(0));
  for (const [u, v] of edges) {
    grid[u][v] = 1;
    grid[v][u] = 1;
  }
  let total = 0;
  for (let u = 0; u < n; u++) {
    for (let v = u; v < n; v++) {
      if (grid[u][v]) total++;
    }
  }
  return total;
}

/** Kruskal, which reads the edge list in weight order and no index at all. */
function cheapestTreeFromEdges(n, weighted) {
  const order = weighted.map((_, i) => i).sort((a, b) => weighted[a][2] - weighted[b][2] || a - b);
  const parent = Array.from({ length: n }, (_, i) => i);

  const root = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };

  let total = 0;
  let used = 0;
  for (const i of order) {
    const [u, v, w] = weighted[i];
    const a = root(u);
    const b = root(v);
    if (a !== b) {
      parent[a] = b;
      total += w;
      used++;
    }
  }
  return [used === n - 1 ? total : -1, used];
}

/** Every subset of edges, kept if it joins everything without a cycle. */
function cheapestTreeBySubsets(n, weighted) {
  let best = -1;
  const m = weighted.length;
  for (let mask = 0; mask < 1 << m; mask++) {
      const chosen = [];
    for (let i = 0; i < m; i++) {
      if ((mask >> i) & 1) chosen.push(weighted[i]);
    }
    if (chosen.length !== n - 1) continue;
    const parent = Array.from({ length: n }, (_, i) => i);
    const root = (x) => {
      while (parent[x] !== x) x = parent[x];
      return x;
    };
    let total = 0;
    let ok = true;
    for (const [u, v, w] of chosen) {
      const a = root(u);
      const b = root(v);
      if (a === b) {
        ok = false;
      } else {
        parent[a] = b;
        total += w;
      }
    }
    if (ok && (best < 0 || total < best)) best = total;
  }
  return best;
}

const show = (values) => \`[\${values.join(", ")}]\`;

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);

const CASES = [
  [3, [[0, 1], [1, 2]]],
  [3, [[0, 1], [0, 1], [1, 2]]],
  [3, [[0, 0], [0, 1], [1, 2]]],
  [4, [[0, 1], [0, 1], [0, 1], [2, 3]]],
];

console.log(
  pad("nodes", 6) + "  " + padEnd("edges", 28) + pad("degrees, list", 16) +
    pad("degrees, matrix", 18) + pad("count, list", 13) + pad("count, matrix", 15)
);
for (const [n, edges] of CASES) {
  const shown = \`[\${edges.map(([u, v]) => \`\${u}-\${v}\`).join(", ")}]\`;
  console.log(
    pad(n, 6) + "  " + padEnd(shown, 28) + pad(show(degreesFromList(n, edges)), 16) +
      pad(show(degreesFromMatrix(n, edges)), 18) + pad(countFromList(edges), 13) +
      pad(countFromMatrix(n, edges), 15)
  );
}
console.log();

const WEIGHTED = [
  [4, [[0, 1, 1], [1, 2, 2], [2, 3, 3], [0, 3, 9]]],
  [4, [[0, 1, 5], [0, 2, 1], [0, 3, 4], [1, 2, 2], [2, 3, 3]]],
  [3, [[0, 1, 7], [1, 2, 7]]],
  [4, [[0, 1, 1], [2, 3, 1]]],
];

console.log("and the algorithm that wants the edge list and nothing else:");
console.log(pad("nodes", 6) + pad("edges", 7) + pad("kruskal", 10) + pad("every subset", 14) + pad("edges used", 12));
for (const [n, weighted] of WEIGHTED) {
  const [total, used] = cheapestTreeFromEdges(n, weighted);
  console.log(
    pad(n, 6) + pad(weighted.length, 7) + pad(total, 10) +
      pad(cheapestTreeBySubsets(n, weighted), 14) + pad(used, 12)
  );
}
console.log();

const TRIALS = 3000;
let degreesAgree = 0;
let countsAgree = 0;
let hadRepeats = 0;
let kruskalOk = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(4);
  const m = 1 + rand(5);
  const edges = [];
  for (let k = 0; k < m; k++) {
    const u = rand(n);
    const v = rand(n);
    edges.push([u, v]);
  }
  if (show(degreesFromList(n, edges)) === show(degreesFromMatrix(n, edges))) degreesAgree++;
  if (countFromList(edges) === countFromMatrix(n, edges)) countsAgree++;
  const seenPairs = [];
  let repeated = false;
  for (const [u, v] of edges) {
    const key = \`\${Math.min(u, v)}-\${Math.max(u, v)}\`;
    if (seenPairs.includes(key)) repeated = true;
    seenPairs.push(key);
  }
  let looped = false;
  for (const [u, v] of edges) {
    if (u === v) looped = true;
  }
  if (repeated || looped) hadRepeats++;
  const weighted = [];
  for (const [u, v] of edges) {
    if (u !== v) weighted.push([u, v, 1 + rand(9)]);
  }
  const [total] = cheapestTreeFromEdges(n, weighted);
  if (total === cheapestTreeBySubsets(n, weighted)) kruskalOk++;
}

console.log(\`over \${TRIALS} random edge lists that may repeat a pair or loop on a node:\`);
console.log("  degrees, list against matrix    " + pad(degreesAgree, 6));
console.log("  edge count, list against matrix " + pad(countsAgree, 6));
console.log("  lists that had a repeat or loop " + pad(hadRepeats, 6));
console.log("  kruskal against every subset    " + pad(kruskalOk, 6));
console.log();
console.log("so the matrix is not a lossless container. It stores a relation -- is this");
console.log("pair joined -- and a multigraph is not a relation. If the problem says");
console.log("multiple roads between two towns, or a road that loops back to its own town,");
console.log("the matrix has already thrown that away by the time any algorithm runs.");
`,
            },
            {
              lang: "typescript",
              code: `// The third representation, and the thing a matrix cannot store.
//
// An edge list is just the edges, in a list, with no index at all. It looks too
// primitive to be useful and it is exactly right for a family of algorithms --
// anything that sorts the edges (Kruskal) or relaxes all of them repeatedly
// (Bellman-Ford) never asks "who is next to u" and so never needs an index.
//
// It also stores something the other two do not. A boolean matrix has one cell
// per pair, so it cannot hold two edges between the same pair, and it silently
// collapses them. On a plain simple graph that is harmless. On a multigraph it
// changes the answers.

type Edge = [number, number];
type Weighted = [number, number, number];

/** Count every endpoint, so parallel edges and self-loops both count. */
function degreesFromList(n: number, edges: Edge[]): number[] {
  const degree = new Array(n).fill(0);
  for (const [u, v] of edges) {
    degree[u]++;
    degree[v]++;
  }
  return degree;
}

/** Build a yes-or-no grid first, then count. Repeats have nowhere to go. */
function degreesFromMatrix(n: number, edges: Edge[]): number[] {
  const grid: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (const [u, v] of edges) {
    grid[u][v] = 1;
    grid[v][u] = 1;
  }
  const degree = new Array(n).fill(0);
  for (let u = 0; u < n; u++) {
    for (let v = 0; v < n; v++) {
      if (grid[u][v]) degree[u]++;
    }
  }
  return degree;
}

const countFromList = (edges: Edge[]): number => edges.length;

function countFromMatrix(n: number, edges: Edge[]): number {
  const grid: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (const [u, v] of edges) {
    grid[u][v] = 1;
    grid[v][u] = 1;
  }
  let total = 0;
  for (let u = 0; u < n; u++) {
    for (let v = u; v < n; v++) {
      if (grid[u][v]) total++;
    }
  }
  return total;
}

/** Kruskal, which reads the edge list in weight order and no index at all. */
function cheapestTreeFromEdges(n: number, weighted: Weighted[]): [number, number] {
  const order = weighted.map((_, i) => i).sort((a, b) => weighted[a][2] - weighted[b][2] || a - b);
  const parent = Array.from({ length: n }, (_, i) => i);

  const root = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };

  let total = 0;
  let used = 0;
  for (const i of order) {
    const [u, v, w] = weighted[i];
    const a = root(u);
    const b = root(v);
    if (a !== b) {
      parent[a] = b;
      total += w;
      used++;
    }
  }
  return [used === n - 1 ? total : -1, used];
}

/** Every subset of edges, kept if it joins everything without a cycle. */
function cheapestTreeBySubsets(n: number, weighted: Weighted[]): number {
  let best = -1;
  const m = weighted.length;
  for (let mask = 0; mask < 1 << m; mask++) {
    const chosen: Weighted[] = [];
    for (let i = 0; i < m; i++) {
      if ((mask >> i) & 1) chosen.push(weighted[i]);
    }
    if (chosen.length !== n - 1) continue;
    const parent = Array.from({ length: n }, (_, i) => i);
    const root = (x: number): number => {
      while (parent[x] !== x) x = parent[x];
      return x;
    };
    let total = 0;
    let ok = true;
    for (const [u, v, w] of chosen) {
      const a = root(u);
      const b = root(v);
      if (a === b) {
        ok = false;
      } else {
        parent[a] = b;
        total += w;
      }
    }
    if (ok && (best < 0 || total < best)) best = total;
  }
  return best;
}

const show = (values: number[]): string => \`[\${values.join(", ")}]\`;

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

const CASES: [number, Edge[]][] = [
  [3, [[0, 1], [1, 2]]],
  [3, [[0, 1], [0, 1], [1, 2]]],
  [3, [[0, 0], [0, 1], [1, 2]]],
  [4, [[0, 1], [0, 1], [0, 1], [2, 3]]],
];

console.log(
  pad("nodes", 6) + "  " + padEnd("edges", 28) + pad("degrees, list", 16) +
    pad("degrees, matrix", 18) + pad("count, list", 13) + pad("count, matrix", 15)
);
for (const [n, edges] of CASES) {
  const shown = \`[\${edges.map(([u, v]) => \`\${u}-\${v}\`).join(", ")}]\`;
  console.log(
    pad(n, 6) + "  " + padEnd(shown, 28) + pad(show(degreesFromList(n, edges)), 16) +
      pad(show(degreesFromMatrix(n, edges)), 18) + pad(countFromList(edges), 13) +
      pad(countFromMatrix(n, edges), 15)
  );
}
console.log();

const WEIGHTED: [number, Weighted[]][] = [
  [4, [[0, 1, 1], [1, 2, 2], [2, 3, 3], [0, 3, 9]]],
  [4, [[0, 1, 5], [0, 2, 1], [0, 3, 4], [1, 2, 2], [2, 3, 3]]],
  [3, [[0, 1, 7], [1, 2, 7]]],
  [4, [[0, 1, 1], [2, 3, 1]]],
];

console.log("and the algorithm that wants the edge list and nothing else:");
console.log(pad("nodes", 6) + pad("edges", 7) + pad("kruskal", 10) + pad("every subset", 14) + pad("edges used", 12));
for (const [n, weighted] of WEIGHTED) {
  const [total, used] = cheapestTreeFromEdges(n, weighted);
  console.log(
    pad(n, 6) + pad(weighted.length, 7) + pad(total, 10) +
      pad(cheapestTreeBySubsets(n, weighted), 14) + pad(used, 12)
  );
}
console.log();

const TRIALS = 3000;
let degreesAgree = 0;
let countsAgree = 0;
let hadRepeats = 0;
let kruskalOk = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(4);
  const m = 1 + rand(5);
  const edges: Edge[] = [];
  for (let k = 0; k < m; k++) {
    const u = rand(n);
    const v = rand(n);
    edges.push([u, v]);
  }
  if (show(degreesFromList(n, edges)) === show(degreesFromMatrix(n, edges))) degreesAgree++;
  if (countFromList(edges) === countFromMatrix(n, edges)) countsAgree++;
  const seenPairs: string[] = [];
  let repeated = false;
  for (const [u, v] of edges) {
    const key = \`\${Math.min(u, v)}-\${Math.max(u, v)}\`;
    if (seenPairs.includes(key)) repeated = true;
    seenPairs.push(key);
  }
  let looped = false;
  for (const [u, v] of edges) {
    if (u === v) looped = true;
  }
  if (repeated || looped) hadRepeats++;
  const weighted: Weighted[] = [];
  for (const [u, v] of edges) {
    if (u !== v) weighted.push([u, v, 1 + rand(9)]);
  }
  const [total] = cheapestTreeFromEdges(n, weighted);
  if (total === cheapestTreeBySubsets(n, weighted)) kruskalOk++;
}

console.log(\`over \${TRIALS} random edge lists that may repeat a pair or loop on a node:\`);
console.log("  degrees, list against matrix    " + pad(degreesAgree, 6));
console.log("  edge count, list against matrix " + pad(countsAgree, 6));
console.log("  lists that had a repeat or loop " + pad(hadRepeats, 6));
console.log("  kruskal against every subset    " + pad(kruskalOk, 6));
console.log();
console.log("so the matrix is not a lossless container. It stores a relation -- is this");
console.log("pair joined -- and a multigraph is not a relation. If the problem says");
console.log("multiple roads between two towns, or a road that loops back to its own town,");
console.log("the matrix has already thrown that away by the time any algorithm runs.");
`,
            },
            {
              lang: "java",
              code: `// The third representation, and the thing a matrix cannot store.
//
// An edge list is just the edges, in a list, with no index at all. It looks too
// primitive to be useful and it is exactly right for a family of algorithms --
// anything that sorts the edges (Kruskal) or relaxes all of them repeatedly
// (Bellman-Ford) never asks "who is next to u" and so never needs an index.
//
// It also stores something the other two do not. A boolean matrix has one cell
// per pair, so it cannot hold two edges between the same pair, and it silently
// collapses them. On a plain simple graph that is harmless. On a multigraph it
// changes the answers.
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
    static int treeEdgesUsed;

    // Count every endpoint, so parallel edges and self-loops both count.
    static int[] degreesFromList(int n, List<int[]> edges) {
        int[] degree = new int[n];
        for (int[] e : edges) {
            degree[e[0]]++;
            degree[e[1]]++;
        }
        return degree;
    }

    // Build a yes-or-no grid first, then count. Repeats have nowhere to go.
    static int[] degreesFromMatrix(int n, List<int[]> edges) {
        int[][] grid = new int[n][n];
        for (int[] e : edges) {
            grid[e[0]][e[1]] = 1;
            grid[e[1]][e[0]] = 1;
        }
        int[] degree = new int[n];
        for (int u = 0; u < n; u++) {
            for (int v = 0; v < n; v++) {
                if (grid[u][v] == 1) degree[u]++;
            }
        }
        return degree;
    }

    static int countFromList(List<int[]> edges) {
        return edges.size();
    }

    static int countFromMatrix(int n, List<int[]> edges) {
        int[][] grid = new int[n][n];
        for (int[] e : edges) {
            grid[e[0]][e[1]] = 1;
            grid[e[1]][e[0]] = 1;
        }
        int total = 0;
        for (int u = 0; u < n; u++) {
            for (int v = u; v < n; v++) {
                if (grid[u][v] == 1) total++;
            }
        }
        return total;
    }

    static int[] unionParent;

    static int root(int x) {
        while (unionParent[x] != x) {
            unionParent[x] = unionParent[unionParent[x]];
            x = unionParent[x];
        }
        return x;
    }

    // Kruskal, which reads the edge list in weight order and no index at all.
    static int cheapestTreeFromEdges(int n, List<int[]> weighted) {
        Integer[] order = new Integer[weighted.size()];
        for (int i = 0; i < order.length; i++) order[i] = i;
        Arrays.sort(order, (a, b) -> {
            int byWeight = Integer.compare(weighted.get(a)[2], weighted.get(b)[2]);
            return byWeight != 0 ? byWeight : Integer.compare(a, b);
        });
        unionParent = new int[n];
        for (int i = 0; i < n; i++) unionParent[i] = i;
        int total = 0;
        treeEdgesUsed = 0;
        for (int i : order) {
            int[] e = weighted.get(i);
            int a = root(e[0]), b = root(e[1]);
            if (a != b) {
                unionParent[a] = b;
                total += e[2];
                treeEdgesUsed++;
            }
        }
        return treeEdgesUsed == n - 1 ? total : -1;
    }

    // Every subset of edges, kept if it joins everything without a cycle.
    static int cheapestTreeBySubsets(int n, List<int[]> weighted) {
        int best = -1;
        int m = weighted.size();
        for (int mask = 0; mask < 1 << m; mask++) {
            List<int[]> chosen = new ArrayList<>();
            for (int i = 0; i < m; i++) {
                if ((mask >> i & 1) == 1) chosen.add(weighted.get(i));
            }
            if (chosen.size() != n - 1) continue;
            int[] parent = new int[n];
            for (int i = 0; i < n; i++) parent[i] = i;
            int total = 0;
            boolean ok = true;
            for (int[] e : chosen) {
                int a = e[0], b = e[1];
                while (parent[a] != a) a = parent[a];
                while (parent[b] != b) b = parent[b];
                if (a == b) {
                    ok = false;
                } else {
                    parent[a] = b;
                    total += e[2];
                }
            }
            if (ok && (best < 0 || total < best)) best = total;
        }
        return best;
    }

    static String show(int[] values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(values[i]);
        }
        return sb.append("]").toString();
    }

    static String padEnd(Object v, int w) {
        StringBuilder sb = new StringBuilder(String.valueOf(v));
        while (sb.length() < w) sb.append(' ');
        return sb.toString();
    }

    static String pad(Object v, int w) {
        StringBuilder sb = new StringBuilder(String.valueOf(v));
        while (sb.length() < w) sb.insert(0, ' ');
        return sb.toString();
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    static List<int[]> pairs(int[][] raw) {
        List<int[]> out = new ArrayList<>();
        for (int[] e : raw) out.add(e);
        return out;
    }

    public static void main(String[] args) {
        int[] sizes = {3, 3, 3, 4};
        int[][][] caseEdges = {
            {{0, 1}, {1, 2}},
            {{0, 1}, {0, 1}, {1, 2}},
            {{0, 0}, {0, 1}, {1, 2}},
            {{0, 1}, {0, 1}, {0, 1}, {2, 3}},
        };

        System.out.println(pad("nodes", 6) + "  " + padEnd("edges", 28) + pad("degrees, list", 16)
            + pad("degrees, matrix", 18) + pad("count, list", 13) + pad("count, matrix", 15));
        for (int c = 0; c < sizes.length; c++) {
            int n = sizes[c];
            List<int[]> edges = pairs(caseEdges[c]);
            StringBuilder shown = new StringBuilder("[");
            for (int i = 0; i < edges.size(); i++) {
                if (i > 0) shown.append(", ");
                shown.append(edges.get(i)[0]).append("-").append(edges.get(i)[1]);
            }
            shown.append("]");
            System.out.println(pad(n, 6) + "  " + padEnd(shown, 28)
                + pad(show(degreesFromList(n, edges)), 16) + pad(show(degreesFromMatrix(n, edges)), 18)
                + pad(countFromList(edges), 13) + pad(countFromMatrix(n, edges), 15));
        }
        System.out.println();

        int[] weightedSizes = {4, 4, 3, 4};
        int[][][] weightedEdges = {
            {{0, 1, 1}, {1, 2, 2}, {2, 3, 3}, {0, 3, 9}},
            {{0, 1, 5}, {0, 2, 1}, {0, 3, 4}, {1, 2, 2}, {2, 3, 3}},
            {{0, 1, 7}, {1, 2, 7}},
            {{0, 1, 1}, {2, 3, 1}},
        };

        System.out.println("and the algorithm that wants the edge list and nothing else:");
        System.out.println(pad("nodes", 6) + pad("edges", 7) + pad("kruskal", 10)
            + pad("every subset", 14) + pad("edges used", 12));
        for (int c = 0; c < weightedSizes.length; c++) {
            int n = weightedSizes[c];
            List<int[]> weighted = pairs(weightedEdges[c]);
            int total = cheapestTreeFromEdges(n, weighted);
            System.out.println(pad(n, 6) + pad(weighted.size(), 7) + pad(total, 10)
                + pad(cheapestTreeBySubsets(n, weighted), 14) + pad(treeEdgesUsed, 12));
        }
        System.out.println();

        int trials = 3000;
        int degreesAgree = 0, countsAgree = 0, hadRepeats = 0, kruskalOk = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(4);
            int m = 1 + rand(5);
            List<int[]> edges = new ArrayList<>();
            for (int k = 0; k < m; k++) edges.add(new int[] {rand(n), rand(n)});
            if (Arrays.equals(degreesFromList(n, edges), degreesFromMatrix(n, edges))) degreesAgree++;
            if (countFromList(edges) == countFromMatrix(n, edges)) countsAgree++;
            List<String> seenPairs = new ArrayList<>();
            boolean repeated = false;
            for (int[] e : edges) {
                String key = Math.min(e[0], e[1]) + "-" + Math.max(e[0], e[1]);
                if (seenPairs.contains(key)) repeated = true;
                seenPairs.add(key);
            }
            boolean looped = false;
            for (int[] e : edges) {
                if (e[0] == e[1]) looped = true;
            }
            if (repeated || looped) hadRepeats++;
            List<int[]> weighted = new ArrayList<>();
            for (int[] e : edges) {
                if (e[0] != e[1]) weighted.add(new int[] {e[0], e[1], 1 + rand(9)});
            }
            int total = cheapestTreeFromEdges(n, weighted);
            if (total == cheapestTreeBySubsets(n, weighted)) kruskalOk++;
        }

        System.out.println("over " + trials + " random edge lists that may repeat a pair or loop on a node:");
        System.out.println("  degrees, list against matrix    " + pad(degreesAgree, 6));
        System.out.println("  edge count, list against matrix " + pad(countsAgree, 6));
        System.out.println("  lists that had a repeat or loop " + pad(hadRepeats, 6));
        System.out.println("  kruskal against every subset    " + pad(kruskalOk, 6));
        System.out.println();
        System.out.println("so the matrix is not a lossless container. It stores a relation -- is this");
        System.out.println("pair joined -- and a multigraph is not a relation. If the problem says");
        System.out.println("multiple roads between two towns, or a road that loops back to its own town,");
        System.out.println("the matrix has already thrown that away by the time any algorithm runs.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The third representation, and the thing a matrix cannot store.
//
// An edge list is just the edges, in a list, with no index at all. It looks too
// primitive to be useful and it is exactly right for a family of algorithms --
// anything that sorts the edges (Kruskal) or relaxes all of them repeatedly
// (Bellman-Ford) never asks "who is next to u" and so never needs an index.
//
// It also stores something the other two do not. A boolean matrix has one cell
// per pair, so it cannot hold two edges between the same pair, and it silently
// collapses them. On a plain simple graph that is harmless. On a multigraph it
// changes the answers.
#include <algorithm>
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

using Edge = std::array<int, 2>;
using Weighted = std::array<int, 3>;

// Count every endpoint, so parallel edges and self-loops both count.
std::vector<int> degreesFromList(int n, const std::vector<Edge> &edges) {
    std::vector<int> degree(n, 0);
    for (const Edge &e : edges) {
        degree[e[0]]++;
        degree[e[1]]++;
    }
    return degree;
}

// Build a yes-or-no grid first, then count. Repeats have nowhere to go.
std::vector<int> degreesFromMatrix(int n, const std::vector<Edge> &edges) {
    std::vector<std::vector<int>> grid(n, std::vector<int>(n, 0));
    for (const Edge &e : edges) {
        grid[e[0]][e[1]] = 1;
        grid[e[1]][e[0]] = 1;
    }
    std::vector<int> degree(n, 0);
    for (int u = 0; u < n; u++) {
        for (int v = 0; v < n; v++) {
            if (grid[u][v]) degree[u]++;
        }
    }
    return degree;
}

int countFromList(const std::vector<Edge> &edges) { return static_cast<int>(edges.size()); }

int countFromMatrix(int n, const std::vector<Edge> &edges) {
    std::vector<std::vector<int>> grid(n, std::vector<int>(n, 0));
    for (const Edge &e : edges) {
        grid[e[0]][e[1]] = 1;
        grid[e[1]][e[0]] = 1;
    }
    int total = 0;
    for (int u = 0; u < n; u++) {
        for (int v = u; v < n; v++) {
            if (grid[u][v]) total++;
        }
    }
    return total;
}

int rootOf(std::vector<int> &parent, int x) {
    while (parent[x] != x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
    }
    return x;
}

// Kruskal, which reads the edge list in weight order and no index at all.
std::pair<int, int> cheapestTreeFromEdges(int n, const std::vector<Weighted> &weighted) {
    std::vector<int> order(weighted.size());
    for (size_t i = 0; i < order.size(); i++) order[i] = static_cast<int>(i);
    std::stable_sort(order.begin(), order.end(),
                     [&](int a, int b) { return weighted[a][2] < weighted[b][2]; });
    std::vector<int> parent(n);
    for (int i = 0; i < n; i++) parent[i] = i;
    int total = 0, used = 0;
    for (int i : order) {
        const Weighted &e = weighted[i];
        int a = rootOf(parent, e[0]), b = rootOf(parent, e[1]);
        if (a != b) {
            parent[a] = b;
            total += e[2];
            used++;
        }
    }
    return {used == n - 1 ? total : -1, used};
}

// Every subset of edges, kept if it joins everything without a cycle.
int cheapestTreeBySubsets(int n, const std::vector<Weighted> &weighted) {
    int best = -1;
    int m = static_cast<int>(weighted.size());
    for (int mask = 0; mask < 1 << m; mask++) {
        std::vector<Weighted> chosen;
        for (int i = 0; i < m; i++) {
            if (mask >> i & 1) chosen.push_back(weighted[i]);
        }
        if (static_cast<int>(chosen.size()) != n - 1) continue;
        std::vector<int> parent(n);
        for (int i = 0; i < n; i++) parent[i] = i;
        int total = 0;
        bool ok = true;
        for (const Weighted &e : chosen) {
            int a = e[0], b = e[1];
            while (parent[a] != a) a = parent[a];
            while (parent[b] != b) b = parent[b];
            if (a == b) {
                ok = false;
            } else {
                parent[a] = b;
                total += e[2];
            }
        }
        if (ok && (best < 0 || total < best)) best = total;
    }
    return best;
}

std::string show(const std::vector<int> &values) {
    std::string out = "[";
    for (size_t i = 0; i < values.size(); i++) {
        if (i > 0) out += ", ";
        out += std::to_string(values[i]);
    }
    return out + "]";
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    const std::vector<int> sizes = {3, 3, 3, 4};
    const std::vector<std::vector<Edge>> caseEdges = {
        {{0, 1}, {1, 2}},
        {{0, 1}, {0, 1}, {1, 2}},
        {{0, 0}, {0, 1}, {1, 2}},
        {{0, 1}, {0, 1}, {0, 1}, {2, 3}},
    };

    std::cout << std::right << std::setw(6) << "nodes" << "  " << std::left << std::setw(28) << "edges"
              << std::right << std::setw(16) << "degrees, list" << std::setw(18) << "degrees, matrix"
              << std::setw(13) << "count, list" << std::setw(15) << "count, matrix" << "\\n";
    for (size_t c = 0; c < sizes.size(); c++) {
        int n = sizes[c];
        const auto &edges = caseEdges[c];
        std::string shown = "[";
        for (size_t i = 0; i < edges.size(); i++) {
            if (i > 0) shown += ", ";
            shown += std::to_string(edges[i][0]) + "-" + std::to_string(edges[i][1]);
        }
        shown += "]";
        std::cout << std::right << std::setw(6) << n << "  " << std::left << std::setw(28) << shown
                  << std::right << std::setw(16) << show(degreesFromList(n, edges))
                  << std::setw(18) << show(degreesFromMatrix(n, edges))
                  << std::setw(13) << countFromList(edges)
                  << std::setw(15) << countFromMatrix(n, edges) << "\\n";
    }
    std::cout << "\\n";

    const std::vector<int> weightedSizes = {4, 4, 3, 4};
    const std::vector<std::vector<Weighted>> weightedEdges = {
        {{0, 1, 1}, {1, 2, 2}, {2, 3, 3}, {0, 3, 9}},
        {{0, 1, 5}, {0, 2, 1}, {0, 3, 4}, {1, 2, 2}, {2, 3, 3}},
        {{0, 1, 7}, {1, 2, 7}},
        {{0, 1, 1}, {2, 3, 1}},
    };

    std::cout << "and the algorithm that wants the edge list and nothing else:\\n";
    std::cout << std::right << std::setw(6) << "nodes" << std::setw(7) << "edges"
              << std::setw(10) << "kruskal" << std::setw(14) << "every subset"
              << std::setw(12) << "edges used" << "\\n";
    for (size_t c = 0; c < weightedSizes.size(); c++) {
        int n = weightedSizes[c];
        const auto &weighted = weightedEdges[c];
        auto found = cheapestTreeFromEdges(n, weighted);
        std::cout << std::setw(6) << n << std::setw(7) << weighted.size() << std::setw(10) << found.first
                  << std::setw(14) << cheapestTreeBySubsets(n, weighted)
                  << std::setw(12) << found.second << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 3000;
    int degreesAgree = 0, countsAgree = 0, hadRepeats = 0, kruskalOk = 0;
    for (int t = 0; t < TRIALS; t++) {
        int n = 2 + rnd(4);
        int m = 1 + rnd(5);
        std::vector<Edge> edges;
        for (int k = 0; k < m; k++) edges.push_back({rnd(n), rnd(n)});
        if (degreesFromList(n, edges) == degreesFromMatrix(n, edges)) degreesAgree++;
        if (countFromList(edges) == countFromMatrix(n, edges)) countsAgree++;
        std::vector<std::string> seenPairs;
        bool repeated = false;
        for (const Edge &e : edges) {
            std::string key = std::to_string(std::min(e[0], e[1])) + "-" +
                              std::to_string(std::max(e[0], e[1]));
            for (const std::string &k : seenPairs) {
                if (k == key) repeated = true;
            }
            seenPairs.push_back(key);
        }
        bool looped = false;
        for (const Edge &e : edges) {
            if (e[0] == e[1]) looped = true;
        }
        if (repeated || looped) hadRepeats++;
        std::vector<Weighted> weighted;
        for (const Edge &e : edges) {
            if (e[0] != e[1]) weighted.push_back({e[0], e[1], 1 + rnd(9)});
        }
        if (cheapestTreeFromEdges(n, weighted).first == cheapestTreeBySubsets(n, weighted)) kruskalOk++;
    }

    std::cout << "over " << TRIALS << " random edge lists that may repeat a pair or loop on a node:\\n";
    std::cout << "  degrees, list against matrix    " << std::setw(6) << degreesAgree << "\\n";
    std::cout << "  edge count, list against matrix " << std::setw(6) << countsAgree << "\\n";
    std::cout << "  lists that had a repeat or loop " << std::setw(6) << hadRepeats << "\\n";
    std::cout << "  kruskal against every subset    " << std::setw(6) << kruskalOk << "\\n\\n";
    std::cout << "so the matrix is not a lossless container. It stores a relation -- is this\\n";
    std::cout << "pair joined -- and a multigraph is not a relation. If the problem says\\n";
    std::cout << "multiple roads between two towns, or a road that loops back to its own town,\\n";
    std::cout << "the matrix has already thrown that away by the time any algorithm runs.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// The third representation, and the thing a matrix cannot store.
//
// An edge list is just the edges, in a list, with no index at all. It looks too
// primitive to be useful and it is exactly right for a family of algorithms --
// anything that sorts the edges (Kruskal) or relaxes all of them repeatedly
// (Bellman-Ford) never asks "who is next to u" and so never needs an index.
//
// It also stores something the other two do not. A boolean matrix has one cell
// per pair, so it cannot hold two edges between the same pair, and it silently
// collapses them. On a plain simple graph that is harmless. On a multigraph it
// changes the answers.

type Edge = (usize, usize);
type Weighted = (usize, usize, i32);

/// Count every endpoint, so parallel edges and self-loops both count.
fn degrees_from_list(n: usize, edges: &[Edge]) -> Vec<i32> {
    let mut degree = vec![0; n];
    for &(u, v) in edges {
        degree[u] += 1;
        degree[v] += 1;
    }
    degree
}

/// Build a yes-or-no grid first, then count. Repeats have nowhere to go.
fn degrees_from_matrix(n: usize, edges: &[Edge]) -> Vec<i32> {
    let mut grid = vec![vec![0i32; n]; n];
    for &(u, v) in edges {
        grid[u][v] = 1;
        grid[v][u] = 1;
    }
    let mut degree = vec![0; n];
    for u in 0..n {
        for v in 0..n {
            if grid[u][v] == 1 {
                degree[u] += 1;
            }
        }
    }
    degree
}

fn count_from_list(edges: &[Edge]) -> usize {
    edges.len()
}

fn count_from_matrix(n: usize, edges: &[Edge]) -> usize {
    let mut grid = vec![vec![0i32; n]; n];
    for &(u, v) in edges {
        grid[u][v] = 1;
        grid[v][u] = 1;
    }
    let mut total = 0;
    for u in 0..n {
        for v in u..n {
            if grid[u][v] == 1 {
                total += 1;
            }
        }
    }
    total
}

fn root_of(parent: &mut Vec<usize>, mut x: usize) -> usize {
    while parent[x] != x {
        parent[x] = parent[parent[x]];
        x = parent[x];
    }
    x
}

/// Kruskal, which reads the edge list in weight order and no index at all.
fn cheapest_tree_from_edges(n: usize, weighted: &[Weighted]) -> (i32, usize) {
    let mut order: Vec<usize> = (0..weighted.len()).collect();
    order.sort_by_key(|&i| weighted[i].2);
    let mut parent: Vec<usize> = (0..n).collect();
    let mut total = 0;
    let mut used = 0;
    for &i in &order {
        let (u, v, w) = weighted[i];
        let a = root_of(&mut parent, u);
        let b = root_of(&mut parent, v);
        if a != b {
            parent[a] = b;
            total += w;
            used += 1;
        }
    }
    (if used == n - 1 { total } else { -1 }, used)
}

/// Every subset of edges, kept if it joins everything without a cycle.
fn cheapest_tree_by_subsets(n: usize, weighted: &[Weighted]) -> i32 {
    let mut best = -1;
    let m = weighted.len();
    for mask in 0..(1u32 << m) {
        let chosen: Vec<Weighted> = (0..m).filter(|&i| mask >> i & 1 == 1).map(|i| weighted[i]).collect();
        if chosen.len() != n - 1 {
            continue;
        }
        let mut parent: Vec<usize> = (0..n).collect();
        let mut total = 0;
        let mut ok = true;
        for &(u, v, w) in &chosen {
            let (mut a, mut b) = (u, v);
            while parent[a] != a {
                a = parent[a];
            }
            while parent[b] != b {
                b = parent[b];
            }
            if a == b {
                ok = false;
            } else {
                parent[a] = b;
                total += w;
            }
        }
        if ok && (best < 0 || total < best) {
            best = total;
        }
    }
    best
}

fn show(values: &[i32]) -> String {
    let parts: Vec<String> = values.iter().map(|v| v.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

struct Rng {
    seed: i64,
}

impl Rng {
    fn next(&mut self, n: i64) -> i64 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        self.seed / 65536 % n
    }
}

fn main() {
    let sizes = [3usize, 3, 3, 4];
    let case_edges: Vec<Vec<Edge>> = vec![
        vec![(0, 1), (1, 2)],
        vec![(0, 1), (0, 1), (1, 2)],
        vec![(0, 0), (0, 1), (1, 2)],
        vec![(0, 1), (0, 1), (0, 1), (2, 3)],
    ];

    println!(
        "{:>6}  {:<28}{:>16}{:>18}{:>13}{:>15}",
        "nodes", "edges", "degrees, list", "degrees, matrix", "count, list", "count, matrix"
    );
    for (c, &n) in sizes.iter().enumerate() {
        let edges = &case_edges[c];
        let parts: Vec<String> = edges.iter().map(|&(u, v)| format!("{}-{}", u, v)).collect();
        let shown = format!("[{}]", parts.join(", "));
        println!(
            "{:>6}  {:<28}{:>16}{:>18}{:>13}{:>15}",
            n,
            shown,
            show(&degrees_from_list(n, edges)),
            show(&degrees_from_matrix(n, edges)),
            count_from_list(edges),
            count_from_matrix(n, edges)
        );
    }
    println!();

    let weighted_sizes = [4usize, 4, 3, 4];
    let weighted_edges: Vec<Vec<Weighted>> = vec![
        vec![(0, 1, 1), (1, 2, 2), (2, 3, 3), (0, 3, 9)],
        vec![(0, 1, 5), (0, 2, 1), (0, 3, 4), (1, 2, 2), (2, 3, 3)],
        vec![(0, 1, 7), (1, 2, 7)],
        vec![(0, 1, 1), (2, 3, 1)],
    ];

    println!("and the algorithm that wants the edge list and nothing else:");
    println!("{:>6}{:>7}{:>10}{:>14}{:>12}", "nodes", "edges", "kruskal", "every subset", "edges used");
    for (c, &n) in weighted_sizes.iter().enumerate() {
        let weighted = &weighted_edges[c];
        let (total, used) = cheapest_tree_from_edges(n, weighted);
        println!(
            "{:>6}{:>7}{:>10}{:>14}{:>12}",
            n, weighted.len(), total, cheapest_tree_by_subsets(n, weighted), used
        );
    }
    println!();

    let trials = 3000;
    let mut rng = Rng { seed: 1 };
    let (mut degrees_agree, mut counts_agree, mut had_repeats, mut kruskal_ok) = (0, 0, 0, 0);
    for _ in 0..trials {
        let n = (2 + rng.next(4)) as usize;
        let m = 1 + rng.next(5);
        let mut edges: Vec<Edge> = Vec::new();
        for _ in 0..m {
            let u = rng.next(n as i64) as usize;
            let v = rng.next(n as i64) as usize;
            edges.push((u, v));
        }
        if degrees_from_list(n, &edges) == degrees_from_matrix(n, &edges) {
            degrees_agree += 1;
        }
        if count_from_list(&edges) == count_from_matrix(n, &edges) {
            counts_agree += 1;
        }
        let mut seen_pairs: Vec<(usize, usize)> = Vec::new();
        let mut repeated = false;
        for &(u, v) in &edges {
            let key = (u.min(v), u.max(v));
            if seen_pairs.contains(&key) {
                repeated = true;
            }
            seen_pairs.push(key);
        }
        let looped = edges.iter().any(|&(u, v)| u == v);
        if repeated || looped {
            had_repeats += 1;
        }
        let mut weighted: Vec<Weighted> = Vec::new();
        for &(u, v) in &edges {
            if u != v {
                weighted.push((u, v, (1 + rng.next(9)) as i32));
            }
        }
        let (total, _) = cheapest_tree_from_edges(n, &weighted);
        if total == cheapest_tree_by_subsets(n, &weighted) {
            kruskal_ok += 1;
        }
    }

    println!("over {} random edge lists that may repeat a pair or loop on a node:", trials);
    println!("  degrees, list against matrix    {:>6}", degrees_agree);
    println!("  edge count, list against matrix {:>6}", counts_agree);
    println!("  lists that had a repeat or loop {:>6}", had_repeats);
    println!("  kruskal against every subset    {:>6}", kruskal_ok);
    println!();
    println!("so the matrix is not a lossless container. It stores a relation -- is this");
    println!("pair joined -- and a multigraph is not a relation. If the problem says");
    println!("multiple roads between two towns, or a road that loops back to its own town,");
    println!("the matrix has already thrown that away by the time any algorithm runs.");
}
`,
            },
            {
              lang: "go",
              code: `// The third representation, and the thing a matrix cannot store.
//
// An edge list is just the edges, in a list, with no index at all. It looks too
// primitive to be useful and it is exactly right for a family of algorithms --
// anything that sorts the edges (Kruskal) or relaxes all of them repeatedly
// (Bellman-Ford) never asks "who is next to u" and so never needs an index.
//
// It also stores something the other two do not. A boolean matrix has one cell
// per pair, so it cannot hold two edges between the same pair, and it silently
// collapses them. On a plain simple graph that is harmless. On a multigraph it
// changes the answers.
package main

import (
	"fmt"
	"sort"
	"strconv"
	"strings"
)

// degreesFromList counts every endpoint, so parallel edges and self-loops both count.
func degreesFromList(n int, edges [][2]int) []int {
	degree := make([]int, n)
	for _, e := range edges {
		degree[e[0]]++
		degree[e[1]]++
	}
	return degree
}

// degreesFromMatrix builds a yes-or-no grid first. Repeats have nowhere to go.
func degreesFromMatrix(n int, edges [][2]int) []int {
	grid := make([][]int, n)
	for i := range grid {
		grid[i] = make([]int, n)
	}
	for _, e := range edges {
		grid[e[0]][e[1]] = 1
		grid[e[1]][e[0]] = 1
	}
	degree := make([]int, n)
	for u := 0; u < n; u++ {
		for v := 0; v < n; v++ {
			if grid[u][v] == 1 {
				degree[u]++
			}
		}
	}
	return degree
}

func countFromList(edges [][2]int) int { return len(edges) }

func countFromMatrix(n int, edges [][2]int) int {
	grid := make([][]int, n)
	for i := range grid {
		grid[i] = make([]int, n)
	}
	for _, e := range edges {
		grid[e[0]][e[1]] = 1
		grid[e[1]][e[0]] = 1
	}
	total := 0
	for u := 0; u < n; u++ {
		for v := u; v < n; v++ {
			if grid[u][v] == 1 {
				total++
			}
		}
	}
	return total
}

// cheapestTreeFromEdges is Kruskal: the edge list in weight order, and no index at all.
func cheapestTreeFromEdges(n int, weighted [][3]int) (int, int) {
	order := make([]int, len(weighted))
	for i := range order {
		order[i] = i
	}
	sort.SliceStable(order, func(a, b int) bool {
		return weighted[order[a]][2] < weighted[order[b]][2]
	})
	parent := make([]int, n)
	for i := range parent {
		parent[i] = i
	}
	var root func(x int) int
	root = func(x int) int {
		for parent[x] != x {
			parent[x] = parent[parent[x]]
			x = parent[x]
		}
		return x
	}
	total, used := 0, 0
	for _, i := range order {
		e := weighted[i]
		a, b := root(e[0]), root(e[1])
		if a != b {
			parent[a] = b
			total += e[2]
			used++
		}
	}
	if used == n-1 {
		return total, used
	}
	return -1, used
}

// cheapestTreeBySubsets tries every subset of edges, keeping those that join without a cycle.
func cheapestTreeBySubsets(n int, weighted [][3]int) int {
	best := -1
	m := len(weighted)
	for mask := 0; mask < 1<<m; mask++ {
		var chosen [][3]int
		for i := 0; i < m; i++ {
			if mask>>i&1 == 1 {
				chosen = append(chosen, weighted[i])
			}
		}
		if len(chosen) != n-1 {
			continue
		}
		parent := make([]int, n)
		for i := range parent {
			parent[i] = i
		}
		total := 0
		ok := true
		for _, e := range chosen {
			a, b := e[0], e[1]
			for parent[a] != a {
				a = parent[a]
			}
			for parent[b] != b {
				b = parent[b]
			}
			if a == b {
				ok = false
			} else {
				parent[a] = b
				total += e[2]
			}
		}
		if ok && (best < 0 || total < best) {
			best = total
		}
	}
	return best
}

func show(values []int) string {
	parts := make([]string, len(values))
	for i, v := range values {
		parts[i] = strconv.Itoa(v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func sameInts(a, b []int) bool {
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

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	sizes := []int{3, 3, 3, 4}
	caseEdges := [][][2]int{
		{{0, 1}, {1, 2}},
		{{0, 1}, {0, 1}, {1, 2}},
		{{0, 0}, {0, 1}, {1, 2}},
		{{0, 1}, {0, 1}, {0, 1}, {2, 3}},
	}

	fmt.Printf("%6s  %-28s%16s%18s%13s%15s\\n", "nodes", "edges", "degrees, list",
		"degrees, matrix", "count, list", "count, matrix")
	for c, n := range sizes {
		edges := caseEdges[c]
		parts := make([]string, len(edges))
		for i, e := range edges {
			parts[i] = fmt.Sprintf("%d-%d", e[0], e[1])
		}
		shown := "[" + strings.Join(parts, ", ") + "]"
		fmt.Printf("%6d  %-28s%16s%18s%13d%15d\\n", n, shown, show(degreesFromList(n, edges)),
			show(degreesFromMatrix(n, edges)), countFromList(edges), countFromMatrix(n, edges))
	}
	fmt.Println()

	weightedSizes := []int{4, 4, 3, 4}
	weightedEdges := [][][3]int{
		{{0, 1, 1}, {1, 2, 2}, {2, 3, 3}, {0, 3, 9}},
		{{0, 1, 5}, {0, 2, 1}, {0, 3, 4}, {1, 2, 2}, {2, 3, 3}},
		{{0, 1, 7}, {1, 2, 7}},
		{{0, 1, 1}, {2, 3, 1}},
	}

	fmt.Println("and the algorithm that wants the edge list and nothing else:")
	fmt.Printf("%6s%7s%10s%14s%12s\\n", "nodes", "edges", "kruskal", "every subset", "edges used")
	for c, n := range weightedSizes {
		weighted := weightedEdges[c]
		total, used := cheapestTreeFromEdges(n, weighted)
		fmt.Printf("%6d%7d%10d%14d%12d\\n", n, len(weighted), total,
			cheapestTreeBySubsets(n, weighted), used)
	}
	fmt.Println()

	trials := 3000
	degreesAgree, countsAgree, hadRepeats, kruskalOk := 0, 0, 0, 0
	for t := 0; t < trials; t++ {
		n := 2 + rand(4)
		m := 1 + rand(5)
		edges := make([][2]int, m)
		for k := range edges {
			edges[k] = [2]int{rand(n), rand(n)}
		}
		if sameInts(degreesFromList(n, edges), degreesFromMatrix(n, edges)) {
			degreesAgree++
		}
		if countFromList(edges) == countFromMatrix(n, edges) {
			countsAgree++
		}
		var seenPairs []string
		repeated := false
		for _, e := range edges {
			lo, hi := e[0], e[1]
			if lo > hi {
				lo, hi = hi, lo
			}
			key := fmt.Sprintf("%d-%d", lo, hi)
			for _, k := range seenPairs {
				if k == key {
					repeated = true
				}
			}
			seenPairs = append(seenPairs, key)
		}
		looped := false
		for _, e := range edges {
			if e[0] == e[1] {
				looped = true
			}
		}
		if repeated || looped {
			hadRepeats++
		}
		var weighted [][3]int
		for _, e := range edges {
			if e[0] != e[1] {
				weighted = append(weighted, [3]int{e[0], e[1], 1 + rand(9)})
			}
		}
		total, _ := cheapestTreeFromEdges(n, weighted)
		if total == cheapestTreeBySubsets(n, weighted) {
			kruskalOk++
		}
	}

	fmt.Printf("over %d random edge lists that may repeat a pair or loop on a node:\\n", trials)
	fmt.Printf("  degrees, list against matrix    %6d\\n", degreesAgree)
	fmt.Printf("  edge count, list against matrix %6d\\n", countsAgree)
	fmt.Printf("  lists that had a repeat or loop %6d\\n", hadRepeats)
	fmt.Printf("  kruskal against every subset    %6d\\n", kruskalOk)
	fmt.Println()
	fmt.Println("so the matrix is not a lossless container. It stores a relation -- is this")
	fmt.Println("pair joined -- and a multigraph is not a relation. If the problem says")
	fmt.Println("multiple roads between two towns, or a road that loops back to its own town,")
	fmt.Println("the matrix has already thrown that away by the time any algorithm runs.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "A boolean matrix silently collapses a multigraph",
          body: "One cell per pair means two edges between the same pair become one, and a self-loop counts once rather than twice. Degrees computed through a matrix matched the edge list on 812 of 3,000 random multigraphs. If the problem admits parallel edges or self-loops, the matrix has to hold counts rather than flags, or not be used.",
        },
        {
          title: "Do not build an index an algorithm never reads",
          body: "Kruskal sorts edges; Bellman-Ford relaxes all of them. Neither ever asks for a node's neighbours, so building an adjacency list for either is work that is thrown away. The edge list looks too primitive to be a representation and is exactly the right one for that family.",
        },
      ],
    },
    {
      id: "the-three-representations",
      heading: "The three, and what each is for",
      body: [
        "So the three, and what each is for.",
        "**Adjacency list.** The default. `O(V + E)` space, traversal proportional to the edges, edge queries proportional to the degree. Use it unless something specific argues otherwise.",
        "**Adjacency matrix.** `O(V^2)` space regardless of edges, constant-time edge queries, traversal proportional to `V^2`. Right when the graph is dense, when the program asks about specific pairs far more than it traverses, or when the algorithm itself is matrix-shaped \u2014 Floyd-Warshall in the next module is exactly that.",
        "**Edge list.** No index at all. Right when the algorithm consumes edges rather than following them: Kruskal, Bellman-Ford, and anything that sorts or filters edges. It is also the only one of the three that stores a multigraph faithfully.",
        "And one practical note: these are not exclusive. Holding an edge list *and* an adjacency list costs `O(E)` extra and buys both access patterns, which is often the right answer for a program that does several different things with the same graph.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Adjacency list or adjacency matrix?",
      answer:
        "It depends on two things you can count. Asking \"is this pair joined\" costs one probe on a matrix and a scan of the degree on a list; asking \"what are this node's neighbours\" costs a list read on a list and n cells on a matrix. So the matrix wins when the program mostly asks about specific pairs and the graph is dense, and the list wins when the program mostly traverses. The number people underestimate is the traversal one: a matrix makes a full walk n squared regardless of the edges, so on a sparse graph it is not just using more memory, it is slower. Measured on small sparse graphs, the same breadth-first search probed about 34,000 times through lists and about 108,000 through matrices, with identical answers. And the matrix does not win edge queries unconditionally \u2014 a node with no neighbours costs the list nothing and the matrix one probe.",
    },
    {
      question: "When would you use an edge list?",
      answer:
        "When the algorithm consumes edges instead of following them. Kruskal sorts the edges and walks them in order; Bellman-Ford relaxes every edge repeatedly. Neither ever asks for a node's neighbours, so an adjacency structure is work thrown away. The other reason is correctness: an edge list is the only one of the three that stores a multigraph faithfully. A boolean matrix has one cell per pair, so parallel edges collapse and a self-loop counts once instead of twice \u2014 over 3,000 random multigraphs, degrees computed through a matrix matched the edge list only 812 times. If the problem mentions several roads between two towns, that is the deciding fact.",
    },
    {
      question: "How much memory does each representation use, and does it matter?",
      answer:
        "A list is O(V + E), a matrix is O(V^2) regardless of the edges, and an edge list is O(E). For a sparse graph with a million nodes and two million edges the matrix is 10^12 cells, which settles it before any performance argument. But memory is usually not the interesting axis \u2014 the interesting one is which operations the program does. It is also worth saying that these are not exclusive: keeping an edge list alongside an adjacency list costs O(E) extra and gives both access patterns, which is often right for a program that runs several different algorithms over the same graph.",
    },
  ],
  takeaways: [
    "A list costs `O(V + E)`; a matrix costs `O(V^2)` whatever the edges; an edge list costs `O(E)` and has no index.",
    "The whole trade is two operations: edge queries favour the matrix, traversal favours the list.",
    "A matrix makes traversal `O(V^2)`, so on a sparse graph it is slower as well as larger \u2014 107,963 probes against 33,656 here.",
    "The list never loses at traversal, because twice the edges is always below `V` squared.",
    "The matrix does not always win at edge queries: the list won 259 times out of 3,000 on small sparse graphs.",
    "Pick by counting the operations the program actually performs, not by a rule of thumb about density.",
    "A boolean matrix cannot store parallel edges or count a self-loop properly \u2014 degrees agreed with the edge list on only 812 of 3,000 multigraphs.",
    "Kruskal and Bellman-Ford want the edge list and nothing else; building an index for them is wasted work.",
    "Holding two representations at once is allowed, and often right.",
  ],
  status: "available",
};
