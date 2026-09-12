import type { Lesson } from "@/content/types";

export const vocabularyLesson: Lesson = {
  id: "dsa-graphs-directed-weighted-acyclic",
  slug: "directed-weighted-and-acyclic",
  moduleSlug: "graphs",
  title: "Directed, Weighted and Acyclic",
  summary:
    "The three words that decide which algorithm is correct, each one measured against the mistake it causes: directed against undirected on the same edge list, breadth-first search priced along its own route on a weighted graph, and the topological sweep that keeps returning numbers after the graph stops being acyclic.",
  estimatedMinutes: 45,
  objectives: [
    "Read direction off the problem statement and say what it changes downstream",
    "Explain why breadth-first search is exactly right on an unweighted graph and wrong on a weighted one",
    "Recognise the weighted-shortest-path bug that returns the cost of a real but not cheapest route",
    "Test for a topological order rather than assuming one, and say what its absence costs",
  ],
  sections: [
    {
      id: "one-way-or-two",
      heading: "One way or two",
      body: [
        "Graph vocabulary looks like terminology to be memorised and is not. Each of the three words below changes which algorithm is correct, and getting one wrong produces a program that runs, returns a number, and is wrong about a different question than the one asked.",
        "The first word is **directed**. An edge is a one-way street: storing the edge from `u` to `v` does not store the edge from `v` to `u`. That single decision changes what is reachable, what \"connected\" means, and whether two nodes can form a cycle between them.",
        "The example reads the same edge list both ways. On `[1->0, 2->1]` the nodes reachable from `0` are just `[0]` read as directed and `[0, 1, 2]` read as undirected \u2014 same three edges, same start, and the answers are different by two nodes.",
        "Over 3,000 random edge lists the two readings agreed about reachability 1,500 times out of 3,000, and the undirected reading reached strictly more on the other 1,500. It never reached fewer, and it cannot: every directed edge is still present, and its reverse has been added on top.",
        "So the failure is one-sided and predictable. Reading a one-way problem as two-way over-reports what can be reached. Reading a two-way problem as one-way under-reports it. Reachability happened to be symmetric anyway on 655 of the 3,000, which is exactly the trap \u2014 on those inputs no query at all reveals the bug, and even a single query from node 0 missed it on half of all the cases.",
        "One more consequence worth holding on to: 1,153 of those edge lists contained a pair of nodes pointing at each other, which is a cycle of length two in a directed graph and is not a cycle at all in an undirected one. Cycle detection is written differently for the two for this reason, and that difference has its own lesson later in this module.",
      ],
      examples: [
        {
          id: "the-same-edges-read-both-ways",
          title: "One edge list, read as directed and as undirected",
          lang: "python",
          code: `# One word in the problem statement, and the same edge list becomes a different
# graph.
#
# "Directed" means an edge is a one-way street: storing (u, v) does not store
# (v, u). Everything downstream changes -- which nodes are reachable, what
# "connected" means, whether a cycle is even possible with two nodes, and
# whether the shortest route from a to b is the same as from b to a.
#
# The example reads exactly the same edges both ways and prints both answers.


def build(n, edges, directed):
    neighbours = [[] for _ in range(n)]
    for u, v in edges:
        neighbours[u].append(v)
        if not directed:
            neighbours[v].append(u)
    return neighbours


def reach(neighbours, start):
    """Every node reachable from start, in order of discovery."""
    n = len(neighbours)
    seen = [False] * n
    seen[start] = True
    queue = [start]
    head = 0
    while head < len(queue):
        v = queue[head]
        head += 1
        for u in neighbours[v]:
            if not seen[u]:
                seen[u] = True
                queue.append(u)
    return [v for v in range(n) if seen[v]]


def reaches_everything(n, edges, directed):
    """Is every node reachable from every node? Two different questions."""
    for start in range(n):
        if len(reach(build(n, edges, directed), start)) < n:
            return False
    return True


def has_two_node_cycle(edges):
    """A directed graph can cycle between two nodes; an undirected one cannot."""
    for i in range(len(edges)):
        for j in range(len(edges)):
            if i != j and edges[i][0] == edges[j][1] and edges[i][1] == edges[j][0]:
                return True
    return False


def yes_no(flag):
    return "yes" if flag else "no"


def show(values):
    return "[" + ", ".join(str(v) for v in values) + "]"


def show_edges(edges):
    return "[" + ", ".join(f"{u}->{v}" for u, v in edges) + "]"


CASES = [
    (3, [(0, 1), (1, 2)]),
    (3, [(1, 0), (2, 1)]),
    (3, [(0, 1), (1, 0), (1, 2)]),
    (4, [(0, 1), (2, 3)]),
    (4, [(0, 1), (1, 2), (2, 3), (3, 0)]),
]

print(f"{'edges':<28}{'from 0, directed':>18}{'from 0, undirected':>20}"
      f"{'all pairs, dir':>16}{'all pairs, undir':>18}")
for n, edges in CASES:
    directed_reach = reach(build(n, edges, True), 0)
    undirected_reach = reach(build(n, edges, False), 0)
    print(f"{show_edges(edges):<28}{show(directed_reach):>18}{show(undirected_reach):>20}"
          f"{yes_no(reaches_everything(n, edges, True)):>16}"
          f"{yes_no(reaches_everything(n, edges, False)):>18}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
same_reach = 0
same_all_pairs = 0
undirected_reaches_more = 0
two_node_cycles = 0
symmetric_routes = 0
for _ in range(TRIALS):
    n = 2 + rand(6)
    edges = []
    for u in range(n):
        for v in range(n):
            if u != v and rand(4) == 0:
                edges.append((u, v))
    directed_reach = reach(build(n, edges, True), 0)
    undirected_reach = reach(build(n, edges, False), 0)
    if directed_reach == undirected_reach:
        same_reach += 1
    if len(undirected_reach) > len(directed_reach):
        undirected_reaches_more += 1
    if reaches_everything(n, edges, True) == reaches_everything(n, edges, False):
        same_all_pairs += 1
    if has_two_node_cycle(edges):
        two_node_cycles += 1
    # In a directed graph, "a can reach b" does not imply "b can reach a".
    forward = build(n, edges, True)
    both_ways = True
    for a in range(n):
        for b in range(n):
            if (b in reach(forward, a)) != (a in reach(forward, b)):
                both_ways = False
    if both_ways:
        symmetric_routes += 1

print(f"over {TRIALS} random edge lists on up to 7 nodes:")
print(f"  the same edges reach the same nodes    {same_reach:>6}")
print(f"  and answer \\"all pairs\\" the same way    {same_all_pairs:>6}")
print(f"  undirected reached strictly more       {undirected_reaches_more:>6}")
print(f"  reachability was symmetric anyway      {symmetric_routes:>6}")
print(f"  edge lists with a two-node cycle       {two_node_cycles:>6}")
print()
print("undirected never reaches fewer nodes, because every directed edge is still")
print("there and its reverse has been added. Reading a one-way problem as two-way")
print("therefore over-reports reachability, and reading a two-way problem as one-way")
print("under-reports it. The word in the statement is doing real work.")
`,
          output: `edges                         from 0, directed  from 0, undirected  all pairs, dir  all pairs, undir
[0->1, 1->2]                         [0, 1, 2]           [0, 1, 2]              no               yes
[1->0, 2->1]                               [0]           [0, 1, 2]              no               yes
[0->1, 1->0, 1->2]                   [0, 1, 2]           [0, 1, 2]              no               yes
[0->1, 2->3]                            [0, 1]              [0, 1]              no                no
[0->1, 1->2, 2->3, 3->0]          [0, 1, 2, 3]        [0, 1, 2, 3]             yes               yes

over 3000 random edge lists on up to 7 nodes:
  the same edges reach the same nodes      1500
  and answer "all pairs" the same way      1538
  undirected reached strictly more         1500
  reachability was symmetric anyway         655
  edge lists with a two-node cycle         1153

undirected never reaches fewer nodes, because every directed edge is still
there and its reverse has been added. Reading a one-way problem as two-way
therefore over-reports reachability, and reading a two-way problem as one-way
under-reports it. The word in the statement is doing real work.`,
          explanation:
            "The same edge list read as directed and as undirected, side by side. The undirected reading never reaches fewer nodes and reached strictly more on half the random cases \u2014 and the two readings happened to agree on the rest, which is what makes the mistake survive testing.",
          alternates: [
            {
              lang: "javascript",
              code: `// One word in the problem statement, and the same edge list becomes a different
// graph.
//
// "Directed" means an edge is a one-way street: storing (u, v) does not store
// (v, u). Everything downstream changes -- which nodes are reachable, what
// "connected" means, whether a cycle is even possible with two nodes, and
// whether the shortest route from a to b is the same as from b to a.
//
// The example reads exactly the same edges both ways and prints both answers.

function build(n, edges, directed) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    if (!directed) neighbours[v].push(u);
  }
  return neighbours;
}

/** Every node reachable from start, in order of discovery. */
function reach(neighbours, start) {
  const n = neighbours.length;
  const seen = new Array(n).fill(false);
  seen[start] = true;
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const v = queue[head];
    head++;
    for (const u of neighbours[v]) {
      if (!seen[u]) {
        seen[u] = true;
        queue.push(u);
      }
    }
  }
  const out = [];
  for (let v = 0; v < n; v++) {
    if (seen[v]) out.push(v);
  }
  return out;
}

/** Is every node reachable from every node? Two different questions. */
function reachesEverything(n, edges, directed) {
  for (let start = 0; start < n; start++) {
    if (reach(build(n, edges, directed), start).length < n) return false;
  }
  return true;
}

/** A directed graph can cycle between two nodes; an undirected one cannot. */
function hasTwoNodeCycle(edges) {
  for (let i = 0; i < edges.length; i++) {
    for (let j = 0; j < edges.length; j++) {
      if (i !== j && edges[i][0] === edges[j][1] && edges[i][1] === edges[j][0]) return true;
    }
  }
  return false;
}

const yesNo = (flag) => (flag ? "yes" : "no");
const show = (values) => \`[\${values.join(", ")}]\`;
const showEdges = (edges) => \`[\${edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ")}]\`;

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
  [3, [[1, 0], [2, 1]]],
  [3, [[0, 1], [1, 0], [1, 2]]],
  [4, [[0, 1], [2, 3]]],
  [4, [[0, 1], [1, 2], [2, 3], [3, 0]]],
];

console.log(
  padEnd("edges", 28) + pad("from 0, directed", 18) + pad("from 0, undirected", 20) +
    pad("all pairs, dir", 16) + pad("all pairs, undir", 18)
);
for (const [n, edges] of CASES) {
  console.log(
    padEnd(showEdges(edges), 28) + pad(show(reach(build(n, edges, true), 0)), 18) +
      pad(show(reach(build(n, edges, false), 0)), 20) +
      pad(yesNo(reachesEverything(n, edges, true)), 16) +
      pad(yesNo(reachesEverything(n, edges, false)), 18)
  );
}
console.log();

const TRIALS = 3000;
let sameReach = 0;
let sameAllPairs = 0;
let undirectedReachesMore = 0;
let twoNodeCycles = 0;
let symmetricRoutes = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(6);
  const edges = [];
  for (let u = 0; u < n; u++) {
    for (let v = 0; v < n; v++) {
      if (u !== v && rand(4) === 0) edges.push([u, v]);
    }
  }
  const directedReach = reach(build(n, edges, true), 0);
  const undirectedReach = reach(build(n, edges, false), 0);
  if (show(directedReach) === show(undirectedReach)) sameReach++;
  if (undirectedReach.length > directedReach.length) undirectedReachesMore++;
  if (reachesEverything(n, edges, true) === reachesEverything(n, edges, false)) sameAllPairs++;
  if (hasTwoNodeCycle(edges)) twoNodeCycles++;
  // In a directed graph, "a can reach b" does not imply "b can reach a".
  const forward = build(n, edges, true);
  let bothWays = true;
  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      if (reach(forward, a).includes(b) !== reach(forward, b).includes(a)) bothWays = false;
    }
  }
  if (bothWays) symmetricRoutes++;
}

console.log(\`over \${TRIALS} random edge lists on up to 7 nodes:\`);
console.log("  the same edges reach the same nodes    " + pad(sameReach, 6));
console.log('  and answer "all pairs" the same way    ' + pad(sameAllPairs, 6));
console.log("  undirected reached strictly more       " + pad(undirectedReachesMore, 6));
console.log("  reachability was symmetric anyway      " + pad(symmetricRoutes, 6));
console.log("  edge lists with a two-node cycle       " + pad(twoNodeCycles, 6));
console.log();
console.log("undirected never reaches fewer nodes, because every directed edge is still");
console.log("there and its reverse has been added. Reading a one-way problem as two-way");
console.log("therefore over-reports reachability, and reading a two-way problem as one-way");
console.log("under-reports it. The word in the statement is doing real work.");
`,
            },
            {
              lang: "typescript",
              code: `// One word in the problem statement, and the same edge list becomes a different
// graph.
//
// "Directed" means an edge is a one-way street: storing (u, v) does not store
// (v, u). Everything downstream changes -- which nodes are reachable, what
// "connected" means, whether a cycle is even possible with two nodes, and
// whether the shortest route from a to b is the same as from b to a.
//
// The example reads exactly the same edges both ways and prints both answers.

type Edge = [number, number];

function build(n: number, edges: Edge[], directed: boolean): number[][] {
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    if (!directed) neighbours[v].push(u);
  }
  return neighbours;
}

/** Every node reachable from start, in order of discovery. */
function reach(neighbours: number[][], start: number): number[] {
  const n = neighbours.length;
  const seen = new Array(n).fill(false);
  seen[start] = true;
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const v = queue[head];
    head++;
    for (const u of neighbours[v]) {
      if (!seen[u]) {
        seen[u] = true;
        queue.push(u);
      }
    }
  }
  const out: number[] = [];
  for (let v = 0; v < n; v++) {
    if (seen[v]) out.push(v);
  }
  return out;
}

/** Is every node reachable from every node? Two different questions. */
function reachesEverything(n: number, edges: Edge[], directed: boolean): boolean {
  for (let start = 0; start < n; start++) {
    if (reach(build(n, edges, directed), start).length < n) return false;
  }
  return true;
}

/** A directed graph can cycle between two nodes; an undirected one cannot. */
function hasTwoNodeCycle(edges: Edge[]): boolean {
  for (let i = 0; i < edges.length; i++) {
    for (let j = 0; j < edges.length; j++) {
      if (i !== j && edges[i][0] === edges[j][1] && edges[i][1] === edges[j][0]) return true;
    }
  }
  return false;
}

const yesNo = (flag: boolean): string => (flag ? "yes" : "no");
const show = (values: number[]): string => \`[\${values.join(", ")}]\`;
const showEdges = (edges: Edge[]): string => \`[\${edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ")}]\`;

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
  [3, [[1, 0], [2, 1]]],
  [3, [[0, 1], [1, 0], [1, 2]]],
  [4, [[0, 1], [2, 3]]],
  [4, [[0, 1], [1, 2], [2, 3], [3, 0]]],
];

console.log(
  padEnd("edges", 28) + pad("from 0, directed", 18) + pad("from 0, undirected", 20) +
    pad("all pairs, dir", 16) + pad("all pairs, undir", 18)
);
for (const [n, edges] of CASES) {
  console.log(
    padEnd(showEdges(edges), 28) + pad(show(reach(build(n, edges, true), 0)), 18) +
      pad(show(reach(build(n, edges, false), 0)), 20) +
      pad(yesNo(reachesEverything(n, edges, true)), 16) +
      pad(yesNo(reachesEverything(n, edges, false)), 18)
  );
}
console.log();

const TRIALS = 3000;
let sameReach = 0;
let sameAllPairs = 0;
let undirectedReachesMore = 0;
let twoNodeCycles = 0;
let symmetricRoutes = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(6);
  const edges: Edge[] = [];
  for (let u = 0; u < n; u++) {
    for (let v = 0; v < n; v++) {
      if (u !== v && rand(4) === 0) edges.push([u, v]);
    }
  }
  const directedReach = reach(build(n, edges, true), 0);
  const undirectedReach = reach(build(n, edges, false), 0);
  if (show(directedReach) === show(undirectedReach)) sameReach++;
  if (undirectedReach.length > directedReach.length) undirectedReachesMore++;
  if (reachesEverything(n, edges, true) === reachesEverything(n, edges, false)) sameAllPairs++;
  if (hasTwoNodeCycle(edges)) twoNodeCycles++;
  // In a directed graph, "a can reach b" does not imply "b can reach a".
  const forward = build(n, edges, true);
  let bothWays = true;
  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      if (reach(forward, a).includes(b) !== reach(forward, b).includes(a)) bothWays = false;
    }
  }
  if (bothWays) symmetricRoutes++;
}

console.log(\`over \${TRIALS} random edge lists on up to 7 nodes:\`);
console.log("  the same edges reach the same nodes    " + pad(sameReach, 6));
console.log('  and answer "all pairs" the same way    ' + pad(sameAllPairs, 6));
console.log("  undirected reached strictly more       " + pad(undirectedReachesMore, 6));
console.log("  reachability was symmetric anyway      " + pad(symmetricRoutes, 6));
console.log("  edge lists with a two-node cycle       " + pad(twoNodeCycles, 6));
console.log();
console.log("undirected never reaches fewer nodes, because every directed edge is still");
console.log("there and its reverse has been added. Reading a one-way problem as two-way");
console.log("therefore over-reports reachability, and reading a two-way problem as one-way");
console.log("under-reports it. The word in the statement is doing real work.");
`,
            },
            {
              lang: "java",
              code: `// One word in the problem statement, and the same edge list becomes a different
// graph.
//
// "Directed" means an edge is a one-way street: storing (u, v) does not store
// (v, u). Everything downstream changes -- which nodes are reachable, what
// "connected" means, whether a cycle is even possible with two nodes, and
// whether the shortest route from a to b is the same as from b to a.
//
// The example reads exactly the same edges both ways and prints both answers.
import java.util.ArrayList;
import java.util.List;

public class Main {
    static List<List<Integer>> build(int n, int[][] edges, boolean directed) {
        List<List<Integer>> neighbours = new ArrayList<>();
        for (int i = 0; i < n; i++) neighbours.add(new ArrayList<>());
        for (int[] e : edges) {
            neighbours.get(e[0]).add(e[1]);
            if (!directed) neighbours.get(e[1]).add(e[0]);
        }
        return neighbours;
    }

    // Every node reachable from start, in order of discovery.
    static List<Integer> reach(List<List<Integer>> neighbours, int start) {
        int n = neighbours.size();
        boolean[] seen = new boolean[n];
        seen[start] = true;
        List<Integer> queue = new ArrayList<>();
        queue.add(start);
        int head = 0;
        while (head < queue.size()) {
            int v = queue.get(head);
            head++;
            for (int u : neighbours.get(v)) {
                if (!seen[u]) {
                    seen[u] = true;
                    queue.add(u);
                }
            }
        }
        List<Integer> out = new ArrayList<>();
        for (int v = 0; v < n; v++) {
            if (seen[v]) out.add(v);
        }
        return out;
    }

    // Is every node reachable from every node? Two different questions.
    static boolean reachesEverything(int n, int[][] edges, boolean directed) {
        for (int start = 0; start < n; start++) {
            if (reach(build(n, edges, directed), start).size() < n) return false;
        }
        return true;
    }

    // A directed graph can cycle between two nodes; an undirected one cannot.
    static boolean hasTwoNodeCycle(int[][] edges) {
        for (int i = 0; i < edges.length; i++) {
            for (int j = 0; j < edges.length; j++) {
                if (i != j && edges[i][0] == edges[j][1] && edges[i][1] == edges[j][0]) return true;
            }
        }
        return false;
    }

    static String yesNo(boolean flag) {
        return flag ? "yes" : "no";
    }

    static String show(List<Integer> values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(values.get(i));
        }
        return sb.append("]").toString();
    }

    static String showEdges(int[][] edges) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < edges.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(edges[i][0]).append("->").append(edges[i][1]);
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
        int[] sizes = {3, 3, 3, 4, 4};
        int[][][] caseEdges = {
            {{0, 1}, {1, 2}},
            {{1, 0}, {2, 1}},
            {{0, 1}, {1, 0}, {1, 2}},
            {{0, 1}, {2, 3}},
            {{0, 1}, {1, 2}, {2, 3}, {3, 0}},
        };

        System.out.println(padEnd("edges", 28) + pad("from 0, directed", 18)
            + pad("from 0, undirected", 20) + pad("all pairs, dir", 16) + pad("all pairs, undir", 18));
        for (int c = 0; c < sizes.length; c++) {
            int n = sizes[c];
            int[][] edges = caseEdges[c];
            System.out.println(padEnd(showEdges(edges), 28)
                + pad(show(reach(build(n, edges, true), 0)), 18)
                + pad(show(reach(build(n, edges, false), 0)), 20)
                + pad(yesNo(reachesEverything(n, edges, true)), 16)
                + pad(yesNo(reachesEverything(n, edges, false)), 18));
        }
        System.out.println();

        int trials = 3000;
        int sameReach = 0, sameAllPairs = 0, undirectedReachesMore = 0;
        int twoNodeCycles = 0, symmetricRoutes = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(6);
            List<int[]> made = new ArrayList<>();
            for (int u = 0; u < n; u++) {
                for (int v = 0; v < n; v++) {
                    if (u != v && rand(4) == 0) made.add(new int[] {u, v});
                }
            }
            int[][] edges = made.toArray(new int[0][]);
            List<Integer> directedReach = reach(build(n, edges, true), 0);
            List<Integer> undirectedReach = reach(build(n, edges, false), 0);
            if (directedReach.equals(undirectedReach)) sameReach++;
            if (undirectedReach.size() > directedReach.size()) undirectedReachesMore++;
            if (reachesEverything(n, edges, true) == reachesEverything(n, edges, false)) sameAllPairs++;
            if (hasTwoNodeCycle(edges)) twoNodeCycles++;
            // In a directed graph, "a can reach b" does not imply "b can reach a".
            List<List<Integer>> forward = build(n, edges, true);
            boolean bothWays = true;
            for (int a = 0; a < n; a++) {
                for (int b = 0; b < n; b++) {
                    if (reach(forward, a).contains(b) != reach(forward, b).contains(a)) bothWays = false;
                }
            }
            if (bothWays) symmetricRoutes++;
        }

        System.out.println("over " + trials + " random edge lists on up to 7 nodes:");
        System.out.println("  the same edges reach the same nodes    " + pad(sameReach, 6));
        System.out.println("  and answer \\"all pairs\\" the same way    " + pad(sameAllPairs, 6));
        System.out.println("  undirected reached strictly more       " + pad(undirectedReachesMore, 6));
        System.out.println("  reachability was symmetric anyway      " + pad(symmetricRoutes, 6));
        System.out.println("  edge lists with a two-node cycle       " + pad(twoNodeCycles, 6));
        System.out.println();
        System.out.println("undirected never reaches fewer nodes, because every directed edge is still");
        System.out.println("there and its reverse has been added. Reading a one-way problem as two-way");
        System.out.println("therefore over-reports reachability, and reading a two-way problem as one-way");
        System.out.println("under-reports it. The word in the statement is doing real work.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// One word in the problem statement, and the same edge list becomes a different
// graph.
//
// "Directed" means an edge is a one-way street: storing (u, v) does not store
// (v, u). Everything downstream changes -- which nodes are reachable, what
// "connected" means, whether a cycle is even possible with two nodes, and
// whether the shortest route from a to b is the same as from b to a.
//
// The example reads exactly the same edges both ways and prints both answers.
#include <algorithm>
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

using Edge = std::array<int, 2>;

std::vector<std::vector<int>> build(int n, const std::vector<Edge> &edges, bool directed) {
    std::vector<std::vector<int>> neighbours(n);
    for (const Edge &e : edges) {
        neighbours[e[0]].push_back(e[1]);
        if (!directed) neighbours[e[1]].push_back(e[0]);
    }
    return neighbours;
}

// Every node reachable from start, in order of discovery.
std::vector<int> reach(const std::vector<std::vector<int>> &neighbours, int start) {
    int n = static_cast<int>(neighbours.size());
    std::vector<bool> seen(n, false);
    seen[start] = true;
    std::vector<int> queue = {start};
    for (size_t head = 0; head < queue.size(); head++) {
        int v = queue[head];
        for (int u : neighbours[v]) {
            if (!seen[u]) {
                seen[u] = true;
                queue.push_back(u);
            }
        }
    }
    std::vector<int> out;
    for (int v = 0; v < n; v++) {
        if (seen[v]) out.push_back(v);
    }
    return out;
}

// Is every node reachable from every node? Two different questions.
bool reachesEverything(int n, const std::vector<Edge> &edges, bool directed) {
    for (int start = 0; start < n; start++) {
        if (static_cast<int>(reach(build(n, edges, directed), start).size()) < n) return false;
    }
    return true;
}

// A directed graph can cycle between two nodes; an undirected one cannot.
bool hasTwoNodeCycle(const std::vector<Edge> &edges) {
    for (size_t i = 0; i < edges.size(); i++) {
        for (size_t j = 0; j < edges.size(); j++) {
            if (i != j && edges[i][0] == edges[j][1] && edges[i][1] == edges[j][0]) return true;
        }
    }
    return false;
}

std::string yesNo(bool flag) { return flag ? "yes" : "no"; }

std::string show(const std::vector<int> &values) {
    std::string out = "[";
    for (size_t i = 0; i < values.size(); i++) {
        if (i > 0) out += ", ";
        out += std::to_string(values[i]);
    }
    return out + "]";
}

std::string showEdges(const std::vector<Edge> &edges) {
    std::string out = "[";
    for (size_t i = 0; i < edges.size(); i++) {
        if (i > 0) out += ", ";
        out += std::to_string(edges[i][0]) + "->" + std::to_string(edges[i][1]);
    }
    return out + "]";
}

bool contains(const std::vector<int> &values, int want) {
    return std::find(values.begin(), values.end(), want) != values.end();
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    const std::vector<int> sizes = {3, 3, 3, 4, 4};
    const std::vector<std::vector<Edge>> caseEdges = {
        {{0, 1}, {1, 2}},
        {{1, 0}, {2, 1}},
        {{0, 1}, {1, 0}, {1, 2}},
        {{0, 1}, {2, 3}},
        {{0, 1}, {1, 2}, {2, 3}, {3, 0}},
    };

    std::cout << std::left << std::setw(28) << "edges" << std::right << std::setw(18) << "from 0, directed"
              << std::setw(20) << "from 0, undirected" << std::setw(16) << "all pairs, dir"
              << std::setw(18) << "all pairs, undir" << "\\n";
    for (size_t c = 0; c < sizes.size(); c++) {
        int n = sizes[c];
        const auto &edges = caseEdges[c];
        std::cout << std::left << std::setw(28) << showEdges(edges) << std::right
                  << std::setw(18) << show(reach(build(n, edges, true), 0))
                  << std::setw(20) << show(reach(build(n, edges, false), 0))
                  << std::setw(16) << yesNo(reachesEverything(n, edges, true))
                  << std::setw(18) << yesNo(reachesEverything(n, edges, false)) << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 3000;
    int sameReach = 0, sameAllPairs = 0, undirectedReachesMore = 0;
    int twoNodeCycles = 0, symmetricRoutes = 0;
    for (int t = 0; t < TRIALS; t++) {
        int n = 2 + rnd(6);
        std::vector<Edge> edges;
        for (int u = 0; u < n; u++) {
            for (int v = 0; v < n; v++) {
                if (u != v && rnd(4) == 0) edges.push_back({u, v});
            }
        }
        auto directedReach = reach(build(n, edges, true), 0);
        auto undirectedReach = reach(build(n, edges, false), 0);
        if (directedReach == undirectedReach) sameReach++;
        if (undirectedReach.size() > directedReach.size()) undirectedReachesMore++;
        if (reachesEverything(n, edges, true) == reachesEverything(n, edges, false)) sameAllPairs++;
        if (hasTwoNodeCycle(edges)) twoNodeCycles++;
        // In a directed graph, "a can reach b" does not imply "b can reach a".
        auto forward = build(n, edges, true);
        bool bothWays = true;
        for (int a = 0; a < n; a++) {
            for (int b = 0; b < n; b++) {
                if (contains(reach(forward, a), b) != contains(reach(forward, b), a)) bothWays = false;
            }
        }
        if (bothWays) symmetricRoutes++;
    }

    std::cout << "over " << TRIALS << " random edge lists on up to 7 nodes:\\n";
    std::cout << "  the same edges reach the same nodes    " << std::setw(6) << sameReach << "\\n";
    std::cout << "  and answer \\"all pairs\\" the same way    " << std::setw(6) << sameAllPairs << "\\n";
    std::cout << "  undirected reached strictly more       " << std::setw(6) << undirectedReachesMore << "\\n";
    std::cout << "  reachability was symmetric anyway      " << std::setw(6) << symmetricRoutes << "\\n";
    std::cout << "  edge lists with a two-node cycle       " << std::setw(6) << twoNodeCycles << "\\n\\n";
    std::cout << "undirected never reaches fewer nodes, because every directed edge is still\\n";
    std::cout << "there and its reverse has been added. Reading a one-way problem as two-way\\n";
    std::cout << "therefore over-reports reachability, and reading a two-way problem as one-way\\n";
    std::cout << "under-reports it. The word in the statement is doing real work.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// One word in the problem statement, and the same edge list becomes a different
// graph.
//
// "Directed" means an edge is a one-way street: storing (u, v) does not store
// (v, u). Everything downstream changes -- which nodes are reachable, what
// "connected" means, whether a cycle is even possible with two nodes, and
// whether the shortest route from a to b is the same as from b to a.
//
// The example reads exactly the same edges both ways and prints both answers.

type Edge = (usize, usize);

fn build(n: usize, edges: &[Edge], directed: bool) -> Vec<Vec<usize>> {
    let mut neighbours: Vec<Vec<usize>> = vec![Vec::new(); n];
    for &(u, v) in edges {
        neighbours[u].push(v);
        if !directed {
            neighbours[v].push(u);
        }
    }
    neighbours
}

/// Every node reachable from start, in order of discovery.
fn reach(neighbours: &[Vec<usize>], start: usize) -> Vec<usize> {
    let n = neighbours.len();
    let mut seen = vec![false; n];
    seen[start] = true;
    let mut queue = vec![start];
    let mut head = 0;
    while head < queue.len() {
        let v = queue[head];
        head += 1;
        for k in 0..neighbours[v].len() {
            let u = neighbours[v][k];
            if !seen[u] {
                seen[u] = true;
                queue.push(u);
            }
        }
    }
    (0..n).filter(|&v| seen[v]).collect()
}

/// Is every node reachable from every node? Two different questions.
fn reaches_everything(n: usize, edges: &[Edge], directed: bool) -> bool {
    for start in 0..n {
        if reach(&build(n, edges, directed), start).len() < n {
            return false;
        }
    }
    true
}

/// A directed graph can cycle between two nodes; an undirected one cannot.
fn has_two_node_cycle(edges: &[Edge]) -> bool {
    for i in 0..edges.len() {
        for j in 0..edges.len() {
            if i != j && edges[i].0 == edges[j].1 && edges[i].1 == edges[j].0 {
                return true;
            }
        }
    }
    false
}

fn yes_no(flag: bool) -> String {
    if flag { "yes".to_string() } else { "no".to_string() }
}

fn show(values: &[usize]) -> String {
    let parts: Vec<String> = values.iter().map(|v| v.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn show_edges(edges: &[Edge]) -> String {
    let parts: Vec<String> = edges.iter().map(|&(u, v)| format!("{}->{}", u, v)).collect();
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
    let sizes = [3usize, 3, 3, 4, 4];
    let case_edges: Vec<Vec<Edge>> = vec![
        vec![(0, 1), (1, 2)],
        vec![(1, 0), (2, 1)],
        vec![(0, 1), (1, 0), (1, 2)],
        vec![(0, 1), (2, 3)],
        vec![(0, 1), (1, 2), (2, 3), (3, 0)],
    ];

    println!(
        "{:<28}{:>18}{:>20}{:>16}{:>18}",
        "edges", "from 0, directed", "from 0, undirected", "all pairs, dir", "all pairs, undir"
    );
    for (c, &n) in sizes.iter().enumerate() {
        let edges = &case_edges[c];
        println!(
            "{:<28}{:>18}{:>20}{:>16}{:>18}",
            show_edges(edges),
            show(&reach(&build(n, edges, true), 0)),
            show(&reach(&build(n, edges, false), 0)),
            yes_no(reaches_everything(n, edges, true)),
            yes_no(reaches_everything(n, edges, false))
        );
    }
    println!();

    let trials = 3000;
    let mut rng = Rng { seed: 1 };
    let (mut same_reach, mut same_all_pairs, mut undirected_reaches_more) = (0, 0, 0);
    let (mut two_node_cycles, mut symmetric_routes) = (0, 0);
    for _ in 0..trials {
        let n = (2 + rng.next(6)) as usize;
        let mut edges: Vec<Edge> = Vec::new();
        for u in 0..n {
            for v in 0..n {
                if u != v && rng.next(4) == 0 {
                    edges.push((u, v));
                }
            }
        }
        let directed_reach = reach(&build(n, &edges, true), 0);
        let undirected_reach = reach(&build(n, &edges, false), 0);
        if directed_reach == undirected_reach {
            same_reach += 1;
        }
        if undirected_reach.len() > directed_reach.len() {
            undirected_reaches_more += 1;
        }
        if reaches_everything(n, &edges, true) == reaches_everything(n, &edges, false) {
            same_all_pairs += 1;
        }
        if has_two_node_cycle(&edges) {
            two_node_cycles += 1;
        }
        // In a directed graph, "a can reach b" does not imply "b can reach a".
        let forward = build(n, &edges, true);
        let mut both_ways = true;
        for a in 0..n {
            for b in 0..n {
                if reach(&forward, a).contains(&b) != reach(&forward, b).contains(&a) {
                    both_ways = false;
                }
            }
        }
        if both_ways {
            symmetric_routes += 1;
        }
    }

    println!("over {} random edge lists on up to 7 nodes:", trials);
    println!("  the same edges reach the same nodes    {:>6}", same_reach);
    println!("  and answer \\"all pairs\\" the same way    {:>6}", same_all_pairs);
    println!("  undirected reached strictly more       {:>6}", undirected_reaches_more);
    println!("  reachability was symmetric anyway      {:>6}", symmetric_routes);
    println!("  edge lists with a two-node cycle       {:>6}", two_node_cycles);
    println!();
    println!("undirected never reaches fewer nodes, because every directed edge is still");
    println!("there and its reverse has been added. Reading a one-way problem as two-way");
    println!("therefore over-reports reachability, and reading a two-way problem as one-way");
    println!("under-reports it. The word in the statement is doing real work.");
}
`,
            },
            {
              lang: "go",
              code: `// One word in the problem statement, and the same edge list becomes a different
// graph.
//
// "Directed" means an edge is a one-way street: storing (u, v) does not store
// (v, u). Everything downstream changes -- which nodes are reachable, what
// "connected" means, whether a cycle is even possible with two nodes, and
// whether the shortest route from a to b is the same as from b to a.
//
// The example reads exactly the same edges both ways and prints both answers.
package main

import (
	"fmt"
	"strconv"
	"strings"
)

func build(n int, edges [][2]int, directed bool) [][]int {
	neighbours := make([][]int, n)
	for _, e := range edges {
		neighbours[e[0]] = append(neighbours[e[0]], e[1])
		if !directed {
			neighbours[e[1]] = append(neighbours[e[1]], e[0])
		}
	}
	return neighbours
}

// reach lists every node reachable from start, in order of discovery.
func reach(neighbours [][]int, start int) []int {
	n := len(neighbours)
	seen := make([]bool, n)
	seen[start] = true
	queue := []int{start}
	for head := 0; head < len(queue); head++ {
		v := queue[head]
		for _, u := range neighbours[v] {
			if !seen[u] {
				seen[u] = true
				queue = append(queue, u)
			}
		}
	}
	var out []int
	for v := 0; v < n; v++ {
		if seen[v] {
			out = append(out, v)
		}
	}
	return out
}

// reachesEverything asks whether every node is reachable from every node.
func reachesEverything(n int, edges [][2]int, directed bool) bool {
	for start := 0; start < n; start++ {
		if len(reach(build(n, edges, directed), start)) < n {
			return false
		}
	}
	return true
}

// hasTwoNodeCycle: a directed graph can cycle between two nodes; an undirected one cannot.
func hasTwoNodeCycle(edges [][2]int) bool {
	for i := range edges {
		for j := range edges {
			if i != j && edges[i][0] == edges[j][1] && edges[i][1] == edges[j][0] {
				return true
			}
		}
	}
	return false
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
		parts[i] = strconv.Itoa(v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func showEdges(edges [][2]int) string {
	parts := make([]string, len(edges))
	for i, e := range edges {
		parts[i] = fmt.Sprintf("%d->%d", e[0], e[1])
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func contains(values []int, want int) bool {
	for _, v := range values {
		if v == want {
			return true
		}
	}
	return false
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
	sizes := []int{3, 3, 3, 4, 4}
	caseEdges := [][][2]int{
		{{0, 1}, {1, 2}},
		{{1, 0}, {2, 1}},
		{{0, 1}, {1, 0}, {1, 2}},
		{{0, 1}, {2, 3}},
		{{0, 1}, {1, 2}, {2, 3}, {3, 0}},
	}

	fmt.Printf("%-28s%18s%20s%16s%18s\\n", "edges", "from 0, directed", "from 0, undirected",
		"all pairs, dir", "all pairs, undir")
	for c, n := range sizes {
		edges := caseEdges[c]
		fmt.Printf("%-28s%18s%20s%16s%18s\\n", showEdges(edges),
			show(reach(build(n, edges, true), 0)), show(reach(build(n, edges, false), 0)),
			yesNo(reachesEverything(n, edges, true)), yesNo(reachesEverything(n, edges, false)))
	}
	fmt.Println()

	trials := 3000
	sameReach, sameAllPairs, undirectedReachesMore := 0, 0, 0
	twoNodeCycles, symmetricRoutes := 0, 0
	for t := 0; t < trials; t++ {
		n := 2 + rand(6)
		var edges [][2]int
		for u := 0; u < n; u++ {
			for v := 0; v < n; v++ {
				if u != v && rand(4) == 0 {
					edges = append(edges, [2]int{u, v})
				}
			}
		}
		directedReach := reach(build(n, edges, true), 0)
		undirectedReach := reach(build(n, edges, false), 0)
		if sameInts(directedReach, undirectedReach) {
			sameReach++
		}
		if len(undirectedReach) > len(directedReach) {
			undirectedReachesMore++
		}
		if reachesEverything(n, edges, true) == reachesEverything(n, edges, false) {
			sameAllPairs++
		}
		if hasTwoNodeCycle(edges) {
			twoNodeCycles++
		}
		// In a directed graph, "a can reach b" does not imply "b can reach a".
		forward := build(n, edges, true)
		bothWays := true
		for a := 0; a < n; a++ {
			for b := 0; b < n; b++ {
				if contains(reach(forward, a), b) != contains(reach(forward, b), a) {
					bothWays = false
				}
			}
		}
		if bothWays {
			symmetricRoutes++
		}
	}

	fmt.Printf("over %d random edge lists on up to 7 nodes:\\n", trials)
	fmt.Printf("  the same edges reach the same nodes    %6d\\n", sameReach)
	fmt.Printf("  and answer \\"all pairs\\" the same way    %6d\\n", sameAllPairs)
	fmt.Printf("  undirected reached strictly more       %6d\\n", undirectedReachesMore)
	fmt.Printf("  reachability was symmetric anyway      %6d\\n", symmetricRoutes)
	fmt.Printf("  edge lists with a two-node cycle       %6d\\n", twoNodeCycles)
	fmt.Println()
	fmt.Println("undirected never reaches fewer nodes, because every directed edge is still")
	fmt.Println("there and its reverse has been added. Reading a one-way problem as two-way")
	fmt.Println("therefore over-reports reachability, and reading a two-way problem as one-way")
	fmt.Println("under-reports it. The word in the statement is doing real work.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Reading direction off the picture instead of the statement",
          body: "Arrows in a diagram are a rendering choice; the statement is the specification. \"A depends on B\", \"A links to B\", \"A follows B\" are directed. \"A is adjacent to B\", \"A shares a wall with B\" are not. The two readings agreed on 1,500 of 3,000 random edge lists here, so a test suite can easily miss the difference.",
        },
        {
          title: "A two-node cycle exists only in a directed graph",
          body: "Two nodes pointing at each other is a cycle of length two when the graph is directed, and is a single edge traversed twice when it is not. 1,153 of the 3,000 random edge lists had such a pair. This is why undirected cycle detection has to ignore the edge it arrived on, and directed cycle detection does not.",
        },
      ],
    },
    {
      id: "fewest-edges-is-not-cheapest",
      heading: "Fewest edges is not cheapest",
      body: [
        "The second word is **weighted**. Breadth-first search answers \"fewest edges\". On an unweighted graph that is also \"shortest route\", because every edge costs the same and the two questions collapse into one. Put a number on the edges and they come apart, and BFS goes on answering the one it was written for.",
        "The mistake worth seeing is not \"I used BFS on a weighted graph\". It is the fix that looks like a fix: keep the breadth-first traversal, but add the weights up along the way instead of counting hops. It now returns a cost. The cost is real \u2014 it is the price of an actual route \u2014 it is just not the price of the cheapest one.",
        "Look at the third row of the table. On the triangle `0-1:4, 1-2:4, 0-2:9` the fewest-edges route from `0` to `2` is the single edge of weight `9`, so adding weights along it gives `9`. The cheapest route is the two-edge path through `1`, costing `8`. One edge, more money.",
        "Measured over 3,000 random weighted graphs: relaxing every edge until nothing improves got the cheapest cost right 3,000 times; adding weights along the breadth-first layers got it right 2,881 times. It was too expensive on 119 and never too cheap, which is the signature of the bug \u2014 it is costing a genuine route, chosen for the wrong reason.",
        "And set every weight to `1` and the same broken function is right 3,000 times out of 3,000. That is the whole point. Breadth-first search is exactly correct on an unweighted graph, and exactly correct about the wrong question on a weighted one, and unit weights hide the difference completely.",
      ],
      examples: [
        {
          id: "bfs-against-relaxation",
          title: "Counting edges, pricing that route, and minimising cost",
          lang: "python",
          code: `# The second word: weighted.
#
# Breadth-first search answers "fewest edges". On an unweighted graph that is
# also "shortest route", because every edge costs the same. Put a number on the
# edges and those become different questions, and BFS keeps answering the one it
# was written for -- correctly, and about something else.
#
# The example runs three things on the same weighted graph: BFS counting edges,
# BFS adding up weights along the layer it found, and a relaxation that actually
# minimises cost. The middle one is the mistake worth seeing, because it looks
# like it has been fixed.
INF = 10 ** 9


def build(n, edges):
    """Undirected, weighted. Each entry is (neighbour, cost)."""
    neighbours = [[] for _ in range(n)]
    for u, v, w in edges:
        neighbours[u].append((v, w))
        neighbours[v].append((u, w))
    return neighbours


def fewest_edges(neighbours, start, target):
    """Breadth-first: the number of edges, ignoring what they cost."""
    n = len(neighbours)
    distance = [-1] * n
    distance[start] = 0
    queue = [start]
    head = 0
    while head < len(queue):
        v = queue[head]
        head += 1
        for u, _ in neighbours[v]:
            if distance[u] < 0:
                distance[u] = distance[v] + 1
                queue.append(u)
    return distance[target]


def cost_along_bfs(neighbours, start, target):
    """Breadth-first, but adding up weights. Still the fewest-edges route."""
    n = len(neighbours)
    spent = [-1] * n
    spent[start] = 0
    queue = [start]
    head = 0
    while head < len(queue):
        v = queue[head]
        head += 1
        for u, w in neighbours[v]:
            if spent[u] < 0:
                spent[u] = spent[v] + w
                queue.append(u)
    return spent[target]


def cheapest(neighbours, start, target):
    """Relax every edge until nothing improves. Minimises cost, not edges."""
    n = len(neighbours)
    spent = [INF] * n
    spent[start] = 0
    for _ in range(n):
        changed = False
        for v in range(n):
            if spent[v] >= INF:
                continue
            for u, w in neighbours[v]:
                if spent[v] + w < spent[u]:
                    spent[u] = spent[v] + w
                    changed = True
        if not changed:
            break
    return -1 if spent[target] >= INF else spent[target]


def cheapest_by_walking(n, edges, start, target):
    """Every route that does not revisit a node. The definition."""
    neighbours = build(n, edges)
    best = [INF]
    seen = [False] * n

    def step(v, spent):
        if spent >= best[0]:
            return
        if v == target:
            best[0] = spent
            return
        seen[v] = True
        for u, w in neighbours[v]:
            if not seen[u]:
                step(u, spent + w)
        seen[v] = False

    step(start, 0)
    return -1 if best[0] >= INF else best[0]


def show_edges(edges):
    return "[" + ", ".join(f"{u}-{v}:{w}" for u, v, w in edges) + "]"


CASES = [
    (4, [(0, 1, 1), (1, 3, 1), (0, 2, 5), (2, 3, 1)]),
    (4, [(0, 1, 9), (1, 3, 9), (0, 2, 1), (2, 3, 1)]),
    (3, [(0, 1, 4), (1, 2, 4), (0, 2, 9)]),
    (5, [(0, 1, 1), (1, 2, 1), (2, 4, 1), (0, 3, 1), (3, 4, 10)]),
]

print(f"{'edges':<44}{'fewest edges':>14}{'cost on that route':>20}"
      f"{'cheapest':>10}{'every route':>13}")
for n, edges in CASES:
    neighbours = build(n, edges)
    print(f"{show_edges(edges):<44}{fewest_edges(neighbours, 0, n - 1):>14}"
          f"{cost_along_bfs(neighbours, 0, n - 1):>20}{cheapest(neighbours, 0, n - 1):>10}"
          f"{cheapest_by_walking(n, edges, 0, n - 1):>13}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
relax_ok = 0
bfs_cost_ok = 0
bfs_cost_over = 0
same_when_flat = 0
for _ in range(TRIALS):
    n = 2 + rand(6)
    edges = []
    for u in range(n):
        for v in range(u + 1, n):
            if rand(3) == 0:
                edges.append((u, v, 1 + rand(9)))
    neighbours = build(n, edges)
    truth = cheapest_by_walking(n, edges, 0, n - 1)
    if cheapest(neighbours, 0, n - 1) == truth:
        relax_ok += 1
    guess = cost_along_bfs(neighbours, 0, n - 1)
    if guess == truth:
        bfs_cost_ok += 1
    if truth >= 0 and guess > truth:
        bfs_cost_over += 1
    flat = [(u, v, 1) for u, v, _ in edges]
    flat_neighbours = build(n, flat)
    if cost_along_bfs(flat_neighbours, 0, n - 1) == cheapest_by_walking(n, flat, 0, n - 1):
        same_when_flat += 1

print(f"over {TRIALS} random weighted graphs on up to 7 nodes:")
print(f"  relaxing every edge              {relax_ok:>6}")
print(f"  adding weights along the layers  {bfs_cost_ok:>6}")
print()
print(f"the second one was too expensive on {bfs_cost_over} of them, never too cheap: it is")
print("costing a real route, just not the cheapest one. And with every weight set")
print(f"to 1 it is right {same_when_flat} times out of {TRIALS}, which is the whole point --")
print("breadth-first search is exactly correct on an unweighted graph and exactly")
print("correct about the wrong question on a weighted one.")
`,
          output: `edges                                         fewest edges  cost on that route  cheapest  every route
[0-1:1, 1-3:1, 0-2:5, 2-3:1]                             2                   2         2            2
[0-1:9, 1-3:9, 0-2:1, 2-3:1]                             2                  18         2            2
[0-1:4, 1-2:4, 0-2:9]                                    1                   9         8            8
[0-1:1, 1-2:1, 2-4:1, 0-3:1, 3-4:10]                     2                  11         3            3

over 3000 random weighted graphs on up to 7 nodes:
  relaxing every edge                3000
  adding weights along the layers    2881

the second one was too expensive on 119 of them, never too cheap: it is
costing a real route, just not the cheapest one. And with every weight set
to 1 it is right 3000 times out of 3000, which is the whole point --
breadth-first search is exactly correct on an unweighted graph and exactly
correct about the wrong question on a weighted one.`,
          explanation:
            "Three functions on the same weighted graph: BFS counting edges, BFS adding weights along the layer it found, and a relaxation that actually minimises cost. The middle one is the one to study, because it looks like the fix and is wrong in a single direction.",
          alternates: [
            {
              lang: "javascript",
              code: `// The second word: weighted.
//
// Breadth-first search answers "fewest edges". On an unweighted graph that is
// also "shortest route", because every edge costs the same. Put a number on the
// edges and those become different questions, and BFS keeps answering the one it
// was written for -- correctly, and about something else.
//
// The example runs three things on the same weighted graph: BFS counting edges,
// BFS adding up weights along the layer it found, and a relaxation that actually
// minimises cost. The middle one is the mistake worth seeing, because it looks
// like it has been fixed.

const INF = 1000000000;

/** Undirected, weighted. Each entry is (neighbour, cost). */
function build(n, edges) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    neighbours[u].push([v, w]);
    neighbours[v].push([u, w]);
  }
  return neighbours;
}

/** Breadth-first: the number of edges, ignoring what they cost. */
function fewestEdges(neighbours, start, target) {
  const n = neighbours.length;
  const distance = new Array(n).fill(-1);
  distance[start] = 0;
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const v = queue[head];
    head++;
    for (const [u] of neighbours[v]) {
      if (distance[u] < 0) {
        distance[u] = distance[v] + 1;
        queue.push(u);
      }
    }
  }
  return distance[target];
}

/** Breadth-first, but adding up weights. Still the fewest-edges route. */
function costAlongBfs(neighbours, start, target) {
  const n = neighbours.length;
  const spent = new Array(n).fill(-1);
  spent[start] = 0;
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const v = queue[head];
    head++;
    for (const [u, w] of neighbours[v]) {
      if (spent[u] < 0) {
        spent[u] = spent[v] + w;
        queue.push(u);
      }
    }
  }
  return spent[target];
}

/** Relax every edge until nothing improves. Minimises cost, not edges. */
function cheapest(neighbours, start, target) {
  const n = neighbours.length;
  const spent = new Array(n).fill(INF);
  spent[start] = 0;
  for (let round = 0; round < n; round++) {
    let changed = false;
    for (let v = 0; v < n; v++) {
      if (spent[v] >= INF) continue;
      for (const [u, w] of neighbours[v]) {
        if (spent[v] + w < spent[u]) {
          spent[u] = spent[v] + w;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  return spent[target] >= INF ? -1 : spent[target];
}

/** Every route that does not revisit a node. The definition. */
function cheapestByWalking(n, edges, start, target) {
  const neighbours = build(n, edges);
  let best = INF;
  const seen = new Array(n).fill(false);

  const step = (v, spent) => {
    if (spent >= best) return;
    if (v === target) {
      best = spent;
      return;
    }
    seen[v] = true;
    for (const [u, w] of neighbours[v]) {
      if (!seen[u]) step(u, spent + w);
    }
    seen[v] = false;
  };

  step(start, 0);
  return best >= INF ? -1 : best;
}

const showEdges = (edges) =>
  \`[\${edges.map(([u, v, w]) => \`\${u}-\${v}:\${w}\`).join(", ")}]\`;

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
  [4, [[0, 1, 1], [1, 3, 1], [0, 2, 5], [2, 3, 1]]],
  [4, [[0, 1, 9], [1, 3, 9], [0, 2, 1], [2, 3, 1]]],
  [3, [[0, 1, 4], [1, 2, 4], [0, 2, 9]]],
  [5, [[0, 1, 1], [1, 2, 1], [2, 4, 1], [0, 3, 1], [3, 4, 10]]],
];

console.log(
  padEnd("edges", 44) + pad("fewest edges", 14) + pad("cost on that route", 20) +
    pad("cheapest", 10) + pad("every route", 13)
);
for (const [n, edges] of CASES) {
  const neighbours = build(n, edges);
  console.log(
    padEnd(showEdges(edges), 44) + pad(fewestEdges(neighbours, 0, n - 1), 14) +
      pad(costAlongBfs(neighbours, 0, n - 1), 20) + pad(cheapest(neighbours, 0, n - 1), 10) +
      pad(cheapestByWalking(n, edges, 0, n - 1), 13)
  );
}
console.log();

const TRIALS = 3000;
let relaxOk = 0;
let bfsCostOk = 0;
let bfsCostOver = 0;
let sameWhenFlat = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(6);
  const edges = [];
  for (let u = 0; u < n; u++) {
    for (let v = u + 1; v < n; v++) {
      if (rand(3) === 0) edges.push([u, v, 1 + rand(9)]);
    }
  }
  const neighbours = build(n, edges);
  const truth = cheapestByWalking(n, edges, 0, n - 1);
  if (cheapest(neighbours, 0, n - 1) === truth) relaxOk++;
  const guess = costAlongBfs(neighbours, 0, n - 1);
  if (guess === truth) bfsCostOk++;
  if (truth >= 0 && guess > truth) bfsCostOver++;
  const flat = edges.map(([u, v]) => [u, v, 1]);
  const flatNeighbours = build(n, flat);
  if (costAlongBfs(flatNeighbours, 0, n - 1) === cheapestByWalking(n, flat, 0, n - 1)) sameWhenFlat++;
}

console.log(\`over \${TRIALS} random weighted graphs on up to 7 nodes:\`);
console.log("  relaxing every edge              " + pad(relaxOk, 6));
console.log("  adding weights along the layers  " + pad(bfsCostOk, 6));
console.log();
console.log(\`the second one was too expensive on \${bfsCostOver} of them, never too cheap: it is\`);
console.log("costing a real route, just not the cheapest one. And with every weight set");
console.log(\`to 1 it is right \${sameWhenFlat} times out of \${TRIALS}, which is the whole point --\`);
console.log("breadth-first search is exactly correct on an unweighted graph and exactly");
console.log("correct about the wrong question on a weighted one.");
`,
            },
            {
              lang: "typescript",
              code: `// The second word: weighted.
//
// Breadth-first search answers "fewest edges". On an unweighted graph that is
// also "shortest route", because every edge costs the same. Put a number on the
// edges and those become different questions, and BFS keeps answering the one it
// was written for -- correctly, and about something else.
//
// The example runs three things on the same weighted graph: BFS counting edges,
// BFS adding up weights along the layer it found, and a relaxation that actually
// minimises cost. The middle one is the mistake worth seeing, because it looks
// like it has been fixed.

const INF = 1000000000;

type Weighted = [number, number, number];
type Link = [number, number];

/** Undirected, weighted. Each entry is (neighbour, cost). */
function build(n: number, edges: Weighted[]): Link[][] {
  const neighbours: Link[][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    neighbours[u].push([v, w]);
    neighbours[v].push([u, w]);
  }
  return neighbours;
}

/** Breadth-first: the number of edges, ignoring what they cost. */
function fewestEdges(neighbours: Link[][], start: number, target: number): number {
  const n = neighbours.length;
  const distance = new Array(n).fill(-1);
  distance[start] = 0;
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const v = queue[head];
    head++;
    for (const [u] of neighbours[v]) {
      if (distance[u] < 0) {
        distance[u] = distance[v] + 1;
        queue.push(u);
      }
    }
  }
  return distance[target];
}

/** Breadth-first, but adding up weights. Still the fewest-edges route. */
function costAlongBfs(neighbours: Link[][], start: number, target: number): number {
  const n = neighbours.length;
  const spent = new Array(n).fill(-1);
  spent[start] = 0;
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const v = queue[head];
    head++;
    for (const [u, w] of neighbours[v]) {
      if (spent[u] < 0) {
        spent[u] = spent[v] + w;
        queue.push(u);
      }
    }
  }
  return spent[target];
}

/** Relax every edge until nothing improves. Minimises cost, not edges. */
function cheapest(neighbours: Link[][], start: number, target: number): number {
  const n = neighbours.length;
  const spent = new Array(n).fill(INF);
  spent[start] = 0;
  for (let round = 0; round < n; round++) {
    let changed = false;
    for (let v = 0; v < n; v++) {
      if (spent[v] >= INF) continue;
      for (const [u, w] of neighbours[v]) {
        if (spent[v] + w < spent[u]) {
          spent[u] = spent[v] + w;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  return spent[target] >= INF ? -1 : spent[target];
}

/** Every route that does not revisit a node. The definition. */
function cheapestByWalking(n: number, edges: Weighted[], start: number, target: number): number {
  const neighbours = build(n, edges);
  let best = INF;
  const seen = new Array(n).fill(false);

  const step = (v: number, spent: number): void => {
    if (spent >= best) return;
    if (v === target) {
      best = spent;
      return;
    }
    seen[v] = true;
    for (const [u, w] of neighbours[v]) {
      if (!seen[u]) step(u, spent + w);
    }
    seen[v] = false;
  };

  step(start, 0);
  return best >= INF ? -1 : best;
}

const showEdges = (edges: Weighted[]): string =>
  \`[\${edges.map(([u, v, w]) => \`\${u}-\${v}:\${w}\`).join(", ")}]\`;

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

const CASES: [number, Weighted[]][] = [
  [4, [[0, 1, 1], [1, 3, 1], [0, 2, 5], [2, 3, 1]]],
  [4, [[0, 1, 9], [1, 3, 9], [0, 2, 1], [2, 3, 1]]],
  [3, [[0, 1, 4], [1, 2, 4], [0, 2, 9]]],
  [5, [[0, 1, 1], [1, 2, 1], [2, 4, 1], [0, 3, 1], [3, 4, 10]]],
];

console.log(
  padEnd("edges", 44) + pad("fewest edges", 14) + pad("cost on that route", 20) +
    pad("cheapest", 10) + pad("every route", 13)
);
for (const [n, edges] of CASES) {
  const neighbours = build(n, edges);
  console.log(
    padEnd(showEdges(edges), 44) + pad(fewestEdges(neighbours, 0, n - 1), 14) +
      pad(costAlongBfs(neighbours, 0, n - 1), 20) + pad(cheapest(neighbours, 0, n - 1), 10) +
      pad(cheapestByWalking(n, edges, 0, n - 1), 13)
  );
}
console.log();

const TRIALS = 3000;
let relaxOk = 0;
let bfsCostOk = 0;
let bfsCostOver = 0;
let sameWhenFlat = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(6);
  const edges: Weighted[] = [];
  for (let u = 0; u < n; u++) {
    for (let v = u + 1; v < n; v++) {
      if (rand(3) === 0) edges.push([u, v, 1 + rand(9)]);
    }
  }
  const neighbours = build(n, edges);
  const truth = cheapestByWalking(n, edges, 0, n - 1);
  if (cheapest(neighbours, 0, n - 1) === truth) relaxOk++;
  const guess = costAlongBfs(neighbours, 0, n - 1);
  if (guess === truth) bfsCostOk++;
  if (truth >= 0 && guess > truth) bfsCostOver++;
  const flat: Weighted[] = edges.map(([u, v]) => [u, v, 1] as Weighted);
  const flatNeighbours = build(n, flat);
  if (costAlongBfs(flatNeighbours, 0, n - 1) === cheapestByWalking(n, flat, 0, n - 1)) sameWhenFlat++;
}

console.log(\`over \${TRIALS} random weighted graphs on up to 7 nodes:\`);
console.log("  relaxing every edge              " + pad(relaxOk, 6));
console.log("  adding weights along the layers  " + pad(bfsCostOk, 6));
console.log();
console.log(\`the second one was too expensive on \${bfsCostOver} of them, never too cheap: it is\`);
console.log("costing a real route, just not the cheapest one. And with every weight set");
console.log(\`to 1 it is right \${sameWhenFlat} times out of \${TRIALS}, which is the whole point --\`);
console.log("breadth-first search is exactly correct on an unweighted graph and exactly");
console.log("correct about the wrong question on a weighted one.");
`,
            },
            {
              lang: "java",
              code: `// The second word: weighted.
//
// Breadth-first search answers "fewest edges". On an unweighted graph that is
// also "shortest route", because every edge costs the same. Put a number on the
// edges and those become different questions, and BFS keeps answering the one it
// was written for -- correctly, and about something else.
//
// The example runs three things on the same weighted graph: BFS counting edges,
// BFS adding up weights along the layer it found, and a relaxation that actually
// minimises cost. The middle one is the mistake worth seeing, because it looks
// like it has been fixed.
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
    static final int INF = 1000000000;

    // Undirected, weighted. Each entry is {neighbour, cost}.
    static List<List<int[]>> build(int n, List<int[]> edges) {
        List<List<int[]>> neighbours = new ArrayList<>();
        for (int i = 0; i < n; i++) neighbours.add(new ArrayList<>());
        for (int[] e : edges) {
            neighbours.get(e[0]).add(new int[] {e[1], e[2]});
            neighbours.get(e[1]).add(new int[] {e[0], e[2]});
        }
        return neighbours;
    }

    // Breadth-first: the number of edges, ignoring what they cost.
    static int fewestEdges(List<List<int[]>> neighbours, int start, int target) {
        int n = neighbours.size();
        int[] distance = new int[n];
        Arrays.fill(distance, -1);
        distance[start] = 0;
        List<Integer> queue = new ArrayList<>();
        queue.add(start);
        int head = 0;
        while (head < queue.size()) {
            int v = queue.get(head);
            head++;
            for (int[] link : neighbours.get(v)) {
                if (distance[link[0]] < 0) {
                    distance[link[0]] = distance[v] + 1;
                    queue.add(link[0]);
                }
            }
        }
        return distance[target];
    }

    // Breadth-first, but adding up weights. Still the fewest-edges route.
    static int costAlongBfs(List<List<int[]>> neighbours, int start, int target) {
        int n = neighbours.size();
        int[] spent = new int[n];
        Arrays.fill(spent, -1);
        spent[start] = 0;
        List<Integer> queue = new ArrayList<>();
        queue.add(start);
        int head = 0;
        while (head < queue.size()) {
            int v = queue.get(head);
            head++;
            for (int[] link : neighbours.get(v)) {
                if (spent[link[0]] < 0) {
                    spent[link[0]] = spent[v] + link[1];
                    queue.add(link[0]);
                }
            }
        }
        return spent[target];
    }

    // Relax every edge until nothing improves. Minimises cost, not edges.
    static int cheapest(List<List<int[]>> neighbours, int start, int target) {
        int n = neighbours.size();
        int[] spent = new int[n];
        Arrays.fill(spent, INF);
        spent[start] = 0;
        for (int round = 0; round < n; round++) {
            boolean changed = false;
            for (int v = 0; v < n; v++) {
                if (spent[v] >= INF) continue;
                for (int[] link : neighbours.get(v)) {
                    if (spent[v] + link[1] < spent[link[0]]) {
                        spent[link[0]] = spent[v] + link[1];
                        changed = true;
                    }
                }
            }
            if (!changed) break;
        }
        return spent[target] >= INF ? -1 : spent[target];
    }

    static int walkBest;
    static boolean[] walkSeen;
    static List<List<int[]>> walkNeighbours;
    static int walkTarget;

    // Every route that does not revisit a node. The definition.
    static int cheapestByWalking(int n, List<int[]> edges, int start, int target) {
        walkNeighbours = build(n, edges);
        walkBest = INF;
        walkSeen = new boolean[n];
        walkTarget = target;
        walkStep(start, 0);
        return walkBest >= INF ? -1 : walkBest;
    }

    static void walkStep(int v, int spent) {
        if (spent >= walkBest) return;
        if (v == walkTarget) {
            walkBest = spent;
            return;
        }
        walkSeen[v] = true;
        for (int[] link : walkNeighbours.get(v)) {
            if (!walkSeen[link[0]]) walkStep(link[0], spent + link[1]);
        }
        walkSeen[v] = false;
    }

    static String showEdges(List<int[]> edges) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < edges.size(); i++) {
            if (i > 0) sb.append(", ");
            int[] e = edges.get(i);
            sb.append(e[0]).append("-").append(e[1]).append(":").append(e[2]);
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

    static List<int[]> triples(int[][] raw) {
        List<int[]> out = new ArrayList<>();
        for (int[] e : raw) out.add(e);
        return out;
    }

    public static void main(String[] args) {
        int[] sizes = {4, 4, 3, 5};
        int[][][] caseEdges = {
            {{0, 1, 1}, {1, 3, 1}, {0, 2, 5}, {2, 3, 1}},
            {{0, 1, 9}, {1, 3, 9}, {0, 2, 1}, {2, 3, 1}},
            {{0, 1, 4}, {1, 2, 4}, {0, 2, 9}},
            {{0, 1, 1}, {1, 2, 1}, {2, 4, 1}, {0, 3, 1}, {3, 4, 10}},
        };

        System.out.println(padEnd("edges", 44) + pad("fewest edges", 14)
            + pad("cost on that route", 20) + pad("cheapest", 10) + pad("every route", 13));
        for (int c = 0; c < sizes.length; c++) {
            int n = sizes[c];
            List<int[]> edges = triples(caseEdges[c]);
            List<List<int[]>> neighbours = build(n, edges);
            System.out.println(padEnd(showEdges(edges), 44)
                + pad(fewestEdges(neighbours, 0, n - 1), 14)
                + pad(costAlongBfs(neighbours, 0, n - 1), 20)
                + pad(cheapest(neighbours, 0, n - 1), 10)
                + pad(cheapestByWalking(n, edges, 0, n - 1), 13));
        }
        System.out.println();

        int trials = 3000;
        int relaxOk = 0, bfsCostOk = 0, bfsCostOver = 0, sameWhenFlat = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(6);
            List<int[]> edges = new ArrayList<>();
            for (int u = 0; u < n; u++) {
                for (int v = u + 1; v < n; v++) {
                    if (rand(3) == 0) edges.add(new int[] {u, v, 1 + rand(9)});
                }
            }
            List<List<int[]>> neighbours = build(n, edges);
            int truth = cheapestByWalking(n, edges, 0, n - 1);
            if (cheapest(neighbours, 0, n - 1) == truth) relaxOk++;
            int guess = costAlongBfs(neighbours, 0, n - 1);
            if (guess == truth) bfsCostOk++;
            if (truth >= 0 && guess > truth) bfsCostOver++;
            List<int[]> flat = new ArrayList<>();
            for (int[] e : edges) flat.add(new int[] {e[0], e[1], 1});
            List<List<int[]>> flatNeighbours = build(n, flat);
            if (costAlongBfs(flatNeighbours, 0, n - 1) == cheapestByWalking(n, flat, 0, n - 1)) {
                sameWhenFlat++;
            }
        }

        System.out.println("over " + trials + " random weighted graphs on up to 7 nodes:");
        System.out.println("  relaxing every edge              " + pad(relaxOk, 6));
        System.out.println("  adding weights along the layers  " + pad(bfsCostOk, 6));
        System.out.println();
        System.out.println("the second one was too expensive on " + bfsCostOver
            + " of them, never too cheap: it is");
        System.out.println("costing a real route, just not the cheapest one. And with every weight set");
        System.out.println("to 1 it is right " + sameWhenFlat + " times out of " + trials
            + ", which is the whole point --");
        System.out.println("breadth-first search is exactly correct on an unweighted graph and exactly");
        System.out.println("correct about the wrong question on a weighted one.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The second word: weighted.
//
// Breadth-first search answers "fewest edges". On an unweighted graph that is
// also "shortest route", because every edge costs the same. Put a number on the
// edges and those become different questions, and BFS keeps answering the one it
// was written for -- correctly, and about something else.
//
// The example runs three things on the same weighted graph: BFS counting edges,
// BFS adding up weights along the layer it found, and a relaxation that actually
// minimises cost. The middle one is the mistake worth seeing, because it looks
// like it has been fixed.
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

using Weighted = std::array<int, 3>;
using Link = std::array<int, 2>;

static const int INF = 1000000000;

// Undirected, weighted. Each entry is {neighbour, cost}.
std::vector<std::vector<Link>> build(int n, const std::vector<Weighted> &edges) {
    std::vector<std::vector<Link>> neighbours(n);
    for (const Weighted &e : edges) {
        neighbours[e[0]].push_back({e[1], e[2]});
        neighbours[e[1]].push_back({e[0], e[2]});
    }
    return neighbours;
}

// Breadth-first: the number of edges, ignoring what they cost.
int fewestEdges(const std::vector<std::vector<Link>> &neighbours, int start, int target) {
    int n = static_cast<int>(neighbours.size());
    std::vector<int> distance(n, -1);
    distance[start] = 0;
    std::vector<int> queue = {start};
    for (size_t head = 0; head < queue.size(); head++) {
        int v = queue[head];
        for (const Link &link : neighbours[v]) {
            if (distance[link[0]] < 0) {
                distance[link[0]] = distance[v] + 1;
                queue.push_back(link[0]);
            }
        }
    }
    return distance[target];
}

// Breadth-first, but adding up weights. Still the fewest-edges route.
int costAlongBfs(const std::vector<std::vector<Link>> &neighbours, int start, int target) {
    int n = static_cast<int>(neighbours.size());
    std::vector<int> spent(n, -1);
    spent[start] = 0;
    std::vector<int> queue = {start};
    for (size_t head = 0; head < queue.size(); head++) {
        int v = queue[head];
        for (const Link &link : neighbours[v]) {
            if (spent[link[0]] < 0) {
                spent[link[0]] = spent[v] + link[1];
                queue.push_back(link[0]);
            }
        }
    }
    return spent[target];
}

// Relax every edge until nothing improves. Minimises cost, not edges.
int cheapest(const std::vector<std::vector<Link>> &neighbours, int start, int target) {
    int n = static_cast<int>(neighbours.size());
    std::vector<int> spent(n, INF);
    spent[start] = 0;
    for (int round = 0; round < n; round++) {
        bool changed = false;
        for (int v = 0; v < n; v++) {
            if (spent[v] >= INF) continue;
            for (const Link &link : neighbours[v]) {
                if (spent[v] + link[1] < spent[link[0]]) {
                    spent[link[0]] = spent[v] + link[1];
                    changed = true;
                }
            }
        }
        if (!changed) break;
    }
    return spent[target] >= INF ? -1 : spent[target];
}

void walkStep(const std::vector<std::vector<Link>> &neighbours, int target, int v, int spent,
              int &best, std::vector<bool> &seen) {
    if (spent >= best) return;
    if (v == target) {
        best = spent;
        return;
    }
    seen[v] = true;
    for (const Link &link : neighbours[v]) {
        if (!seen[link[0]]) walkStep(neighbours, target, link[0], spent + link[1], best, seen);
    }
    seen[v] = false;
}

// Every route that does not revisit a node. The definition.
int cheapestByWalking(int n, const std::vector<Weighted> &edges, int start, int target) {
    auto neighbours = build(n, edges);
    int best = INF;
    std::vector<bool> seen(n, false);
    walkStep(neighbours, target, start, 0, best, seen);
    return best >= INF ? -1 : best;
}

std::string showEdges(const std::vector<Weighted> &edges) {
    std::string out = "[";
    for (size_t i = 0; i < edges.size(); i++) {
        if (i > 0) out += ", ";
        out += std::to_string(edges[i][0]) + "-" + std::to_string(edges[i][1]) + ":" +
               std::to_string(edges[i][2]);
    }
    return out + "]";
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    const std::vector<int> sizes = {4, 4, 3, 5};
    const std::vector<std::vector<Weighted>> caseEdges = {
        {{0, 1, 1}, {1, 3, 1}, {0, 2, 5}, {2, 3, 1}},
        {{0, 1, 9}, {1, 3, 9}, {0, 2, 1}, {2, 3, 1}},
        {{0, 1, 4}, {1, 2, 4}, {0, 2, 9}},
        {{0, 1, 1}, {1, 2, 1}, {2, 4, 1}, {0, 3, 1}, {3, 4, 10}},
    };

    std::cout << std::left << std::setw(44) << "edges" << std::right << std::setw(14) << "fewest edges"
              << std::setw(20) << "cost on that route" << std::setw(10) << "cheapest"
              << std::setw(13) << "every route" << "\\n";
    for (size_t c = 0; c < sizes.size(); c++) {
        int n = sizes[c];
        const auto &edges = caseEdges[c];
        auto neighbours = build(n, edges);
        std::cout << std::left << std::setw(44) << showEdges(edges) << std::right
                  << std::setw(14) << fewestEdges(neighbours, 0, n - 1)
                  << std::setw(20) << costAlongBfs(neighbours, 0, n - 1)
                  << std::setw(10) << cheapest(neighbours, 0, n - 1)
                  << std::setw(13) << cheapestByWalking(n, edges, 0, n - 1) << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 3000;
    int relaxOk = 0, bfsCostOk = 0, bfsCostOver = 0, sameWhenFlat = 0;
    for (int t = 0; t < TRIALS; t++) {
        int n = 2 + rnd(6);
        std::vector<Weighted> edges;
        for (int u = 0; u < n; u++) {
            for (int v = u + 1; v < n; v++) {
                if (rnd(3) == 0) edges.push_back({u, v, 1 + rnd(9)});
            }
        }
        auto neighbours = build(n, edges);
        int truth = cheapestByWalking(n, edges, 0, n - 1);
        if (cheapest(neighbours, 0, n - 1) == truth) relaxOk++;
        int guess = costAlongBfs(neighbours, 0, n - 1);
        if (guess == truth) bfsCostOk++;
        if (truth >= 0 && guess > truth) bfsCostOver++;
        std::vector<Weighted> flat;
        for (const Weighted &e : edges) flat.push_back({e[0], e[1], 1});
        auto flatNeighbours = build(n, flat);
        if (costAlongBfs(flatNeighbours, 0, n - 1) == cheapestByWalking(n, flat, 0, n - 1)) {
            sameWhenFlat++;
        }
    }

    std::cout << "over " << TRIALS << " random weighted graphs on up to 7 nodes:\\n";
    std::cout << "  relaxing every edge              " << std::setw(6) << relaxOk << "\\n";
    std::cout << "  adding weights along the layers  " << std::setw(6) << bfsCostOk << "\\n\\n";
    std::cout << "the second one was too expensive on " << bfsCostOver
              << " of them, never too cheap: it is\\n";
    std::cout << "costing a real route, just not the cheapest one. And with every weight set\\n";
    std::cout << "to 1 it is right " << sameWhenFlat << " times out of " << TRIALS
              << ", which is the whole point --\\n";
    std::cout << "breadth-first search is exactly correct on an unweighted graph and exactly\\n";
    std::cout << "correct about the wrong question on a weighted one.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// The second word: weighted.
//
// Breadth-first search answers "fewest edges". On an unweighted graph that is
// also "shortest route", because every edge costs the same. Put a number on the
// edges and those become different questions, and BFS keeps answering the one it
// was written for -- correctly, and about something else.
//
// The example runs three things on the same weighted graph: BFS counting edges,
// BFS adding up weights along the layer it found, and a relaxation that actually
// minimises cost. The middle one is the mistake worth seeing, because it looks
// like it has been fixed.

const INF: i64 = 1_000_000_000;

/// Undirected, weighted. Each entry is (neighbour, cost).
fn build(n: usize, edges: &[(usize, usize, i64)]) -> Vec<Vec<(usize, i64)>> {
    let mut neighbours = vec![Vec::new(); n];
    for &(u, v, w) in edges {
        neighbours[u].push((v, w));
        neighbours[v].push((u, w));
    }
    neighbours
}

/// Breadth-first: the number of edges, ignoring what they cost.
fn fewest_edges(neighbours: &[Vec<(usize, i64)>], start: usize, target: usize) -> i64 {
    let n = neighbours.len();
    let mut distance = vec![-1i64; n];
    distance[start] = 0;
    let mut queue = vec![start];
    let mut head = 0;
    while head < queue.len() {
        let v = queue[head];
        head += 1;
        for &(u, _) in &neighbours[v] {
            if distance[u] < 0 {
                distance[u] = distance[v] + 1;
                queue.push(u);
            }
        }
    }
    distance[target]
}

/// Breadth-first, but adding up weights. Still the fewest-edges route.
fn cost_along_bfs(neighbours: &[Vec<(usize, i64)>], start: usize, target: usize) -> i64 {
    let n = neighbours.len();
    let mut spent = vec![-1i64; n];
    spent[start] = 0;
    let mut queue = vec![start];
    let mut head = 0;
    while head < queue.len() {
        let v = queue[head];
        head += 1;
        for &(u, w) in &neighbours[v] {
            if spent[u] < 0 {
                spent[u] = spent[v] + w;
                queue.push(u);
            }
        }
    }
    spent[target]
}

/// Relax every edge until nothing improves. Minimises cost, not edges.
fn cheapest(neighbours: &[Vec<(usize, i64)>], start: usize, target: usize) -> i64 {
    let n = neighbours.len();
    let mut spent = vec![INF; n];
    spent[start] = 0;
    for _ in 0..n {
        let mut changed = false;
        for v in 0..n {
            if spent[v] >= INF {
                continue;
            }
            for &(u, w) in &neighbours[v] {
                if spent[v] + w < spent[u] {
                    spent[u] = spent[v] + w;
                    changed = true;
                }
            }
        }
        if !changed {
            break;
        }
    }
    if spent[target] >= INF { -1 } else { spent[target] }
}

fn step(
    neighbours: &[Vec<(usize, i64)>],
    seen: &mut Vec<bool>,
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
    seen[v] = true;
    for i in 0..neighbours[v].len() {
        let (u, w) = neighbours[v][i];
        if !seen[u] {
            step(neighbours, seen, best, target, u, spent + w);
        }
    }
    seen[v] = false;
}

/// Every route that does not revisit a node. The definition.
fn cheapest_by_walking(n: usize, edges: &[(usize, usize, i64)], start: usize, target: usize) -> i64 {
    let neighbours = build(n, edges);
    let mut best = INF;
    let mut seen = vec![false; n];
    step(&neighbours, &mut seen, &mut best, target, start, 0);
    if best >= INF { -1 } else { best }
}

fn show_edges(edges: &[(usize, usize, i64)]) -> String {
    let parts: Vec<String> = edges
        .iter()
        .map(|&(u, v, w)| format!("{}-{}:{}", u, v, w))
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
    let cases: Vec<(usize, Vec<(usize, usize, i64)>)> = vec![
        (4, vec![(0, 1, 1), (1, 3, 1), (0, 2, 5), (2, 3, 1)]),
        (4, vec![(0, 1, 9), (1, 3, 9), (0, 2, 1), (2, 3, 1)]),
        (3, vec![(0, 1, 4), (1, 2, 4), (0, 2, 9)]),
        (5, vec![(0, 1, 1), (1, 2, 1), (2, 4, 1), (0, 3, 1), (3, 4, 10)]),
    ];

    println!(
        "{}{}{}{}{}",
        pad_right("edges", 44),
        pad_left("fewest edges", 14),
        pad_left("cost on that route", 20),
        pad_left("cheapest", 10),
        pad_left("every route", 13)
    );
    for (n, edges) in &cases {
        let neighbours = build(*n, edges);
        println!(
            "{}{}{}{}{}",
            pad_right(&show_edges(edges), 44),
            pad_left(&fewest_edges(&neighbours, 0, n - 1).to_string(), 14),
            pad_left(&cost_along_bfs(&neighbours, 0, n - 1).to_string(), 20),
            pad_left(&cheapest(&neighbours, 0, n - 1).to_string(), 10),
            pad_left(&cheapest_by_walking(*n, edges, 0, n - 1).to_string(), 13)
        );
    }
    println!();

    let mut rng = Rng { seed: 1 };
    let trials = 3000;
    let mut relax_ok = 0;
    let mut bfs_cost_ok = 0;
    let mut bfs_cost_over = 0;
    let mut same_when_flat = 0;
    for _ in 0..trials {
        let n = (2 + rng.next(6)) as usize;
        let mut edges: Vec<(usize, usize, i64)> = Vec::new();
        for u in 0..n {
            for v in (u + 1)..n {
                if rng.next(3) == 0 {
                    let w = 1 + rng.next(9);
                    edges.push((u, v, w));
                }
            }
        }
        let neighbours = build(n, &edges);
        let truth = cheapest_by_walking(n, &edges, 0, n - 1);
        if cheapest(&neighbours, 0, n - 1) == truth {
            relax_ok += 1;
        }
        let guess = cost_along_bfs(&neighbours, 0, n - 1);
        if guess == truth {
            bfs_cost_ok += 1;
        }
        if truth >= 0 && guess > truth {
            bfs_cost_over += 1;
        }
        let flat: Vec<(usize, usize, i64)> = edges.iter().map(|&(u, v, _)| (u, v, 1)).collect();
        let flat_neighbours = build(n, &flat);
        if cost_along_bfs(&flat_neighbours, 0, n - 1) == cheapest_by_walking(n, &flat, 0, n - 1) {
            same_when_flat += 1;
        }
    }

    println!("over {} random weighted graphs on up to 7 nodes:", trials);
    println!("  relaxing every edge              {}", pad_left(&relax_ok.to_string(), 6));
    println!("  adding weights along the layers  {}", pad_left(&bfs_cost_ok.to_string(), 6));
    println!();
    println!(
        "the second one was too expensive on {} of them, never too cheap: it is",
        bfs_cost_over
    );
    println!("costing a real route, just not the cheapest one. And with every weight set");
    println!(
        "to 1 it is right {} times out of {}, which is the whole point --",
        same_when_flat, trials
    );
    println!("breadth-first search is exactly correct on an unweighted graph and exactly");
    println!("correct about the wrong question on a weighted one.");
}
`,
            },
            {
              lang: "go",
              code: `// The second word: weighted.
//
// Breadth-first search answers "fewest edges". On an unweighted graph that is
// also "shortest route", because every edge costs the same. Put a number on the
// edges and those become different questions, and BFS keeps answering the one it
// was written for -- correctly, and about something else.
//
// The example runs three things on the same weighted graph: BFS counting edges,
// BFS adding up weights along the layer it found, and a relaxation that actually
// minimises cost. The middle one is the mistake worth seeing, because it looks
// like it has been fixed.
package main

import (
	"fmt"
	"strings"
)

const inf = 1000000000

// build makes an undirected weighted list. Each entry is {neighbour, cost}.
func build(n int, edges [][3]int) [][][2]int {
	neighbours := make([][][2]int, n)
	for _, e := range edges {
		neighbours[e[0]] = append(neighbours[e[0]], [2]int{e[1], e[2]})
		neighbours[e[1]] = append(neighbours[e[1]], [2]int{e[0], e[2]})
	}
	return neighbours
}

// fewestEdges counts edges, ignoring what they cost.
func fewestEdges(neighbours [][][2]int, start, target int) int {
	n := len(neighbours)
	distance := make([]int, n)
	for i := range distance {
		distance[i] = -1
	}
	distance[start] = 0
	queue := []int{start}
	for head := 0; head < len(queue); head++ {
		v := queue[head]
		for _, link := range neighbours[v] {
			if distance[link[0]] < 0 {
				distance[link[0]] = distance[v] + 1
				queue = append(queue, link[0])
			}
		}
	}
	return distance[target]
}

// costAlongBfs adds up weights along the fewest-edges route.
func costAlongBfs(neighbours [][][2]int, start, target int) int {
	n := len(neighbours)
	spent := make([]int, n)
	for i := range spent {
		spent[i] = -1
	}
	spent[start] = 0
	queue := []int{start}
	for head := 0; head < len(queue); head++ {
		v := queue[head]
		for _, link := range neighbours[v] {
			if spent[link[0]] < 0 {
				spent[link[0]] = spent[v] + link[1]
				queue = append(queue, link[0])
			}
		}
	}
	return spent[target]
}

// cheapest relaxes every edge until nothing improves.
func cheapest(neighbours [][][2]int, start, target int) int {
	n := len(neighbours)
	spent := make([]int, n)
	for i := range spent {
		spent[i] = inf
	}
	spent[start] = 0
	for round := 0; round < n; round++ {
		changed := false
		for v := 0; v < n; v++ {
			if spent[v] >= inf {
				continue
			}
			for _, link := range neighbours[v] {
				if spent[v]+link[1] < spent[link[0]] {
					spent[link[0]] = spent[v] + link[1]
					changed = true
				}
			}
		}
		if !changed {
			break
		}
	}
	if spent[target] >= inf {
		return -1
	}
	return spent[target]
}

// cheapestByWalking walks every route that does not revisit a node.
func cheapestByWalking(n int, edges [][3]int, start, target int) int {
	neighbours := build(n, edges)
	best := inf
	seen := make([]bool, n)
	var step func(v, spent int)
	step = func(v, spent int) {
		if spent >= best {
			return
		}
		if v == target {
			best = spent
			return
		}
		seen[v] = true
		for _, link := range neighbours[v] {
			if !seen[link[0]] {
				step(link[0], spent+link[1])
			}
		}
		seen[v] = false
	}
	step(start, 0)
	if best >= inf {
		return -1
	}
	return best
}

func showEdges(edges [][3]int) string {
	parts := make([]string, len(edges))
	for i, e := range edges {
		parts[i] = fmt.Sprintf("%d-%d:%d", e[0], e[1], e[2])
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	sizes := []int{4, 4, 3, 5}
	caseEdges := [][][3]int{
		{{0, 1, 1}, {1, 3, 1}, {0, 2, 5}, {2, 3, 1}},
		{{0, 1, 9}, {1, 3, 9}, {0, 2, 1}, {2, 3, 1}},
		{{0, 1, 4}, {1, 2, 4}, {0, 2, 9}},
		{{0, 1, 1}, {1, 2, 1}, {2, 4, 1}, {0, 3, 1}, {3, 4, 10}},
	}

	fmt.Printf("%-44s%14s%20s%10s%13s\\n", "edges", "fewest edges", "cost on that route",
		"cheapest", "every route")
	for c, n := range sizes {
		edges := caseEdges[c]
		neighbours := build(n, edges)
		fmt.Printf("%-44s%14d%20d%10d%13d\\n", showEdges(edges),
			fewestEdges(neighbours, 0, n-1), costAlongBfs(neighbours, 0, n-1),
			cheapest(neighbours, 0, n-1), cheapestByWalking(n, edges, 0, n-1))
	}
	fmt.Println()

	trials := 3000
	relaxOk, bfsCostOk, bfsCostOver, sameWhenFlat := 0, 0, 0, 0
	for t := 0; t < trials; t++ {
		n := 2 + rand(6)
		var edges [][3]int
		for u := 0; u < n; u++ {
			for v := u + 1; v < n; v++ {
				if rand(3) == 0 {
					edges = append(edges, [3]int{u, v, 1 + rand(9)})
				}
			}
		}
		neighbours := build(n, edges)
		truth := cheapestByWalking(n, edges, 0, n-1)
		if cheapest(neighbours, 0, n-1) == truth {
			relaxOk++
		}
		guess := costAlongBfs(neighbours, 0, n-1)
		if guess == truth {
			bfsCostOk++
		}
		if truth >= 0 && guess > truth {
			bfsCostOver++
		}
		flat := make([][3]int, len(edges))
		for i, e := range edges {
			flat[i] = [3]int{e[0], e[1], 1}
		}
		flatNeighbours := build(n, flat)
		if costAlongBfs(flatNeighbours, 0, n-1) == cheapestByWalking(n, flat, 0, n-1) {
			sameWhenFlat++
		}
	}

	fmt.Printf("over %d random weighted graphs on up to 7 nodes:\\n", trials)
	fmt.Printf("  relaxing every edge              %6d\\n", relaxOk)
	fmt.Printf("  adding weights along the layers  %6d\\n", bfsCostOk)
	fmt.Println()
	fmt.Printf("the second one was too expensive on %d of them, never too cheap: it is\\n", bfsCostOver)
	fmt.Println("costing a real route, just not the cheapest one. And with every weight set")
	fmt.Printf("to 1 it is right %d times out of %d, which is the whole point --\\n", sameWhenFlat, trials)
	fmt.Println("breadth-first search is exactly correct on an unweighted graph and exactly")
	fmt.Println("correct about the wrong question on a weighted one.")
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "graph-weighted-shortest",
        kind: "graph",
        algorithm: "dijkstra",
        title: "What minimising cost actually looks like",
        lockAlgorithm: true,
      },
      pitfalls: [
        {
          title: "Adding weights along a breadth-first traversal is not Dijkstra",
          body: "The traversal still visits in fewest-edges order, so the route it prices is the fewest-edges route. It returns the cost of a real path, which is why it survives casual checking; it was too expensive on 119 of 3,000 graphs here and never too cheap. Wrong in one direction only is the signature.",
        },
        {
          title: "Unit weights hide the bug completely",
          body: "With every weight set to 1, the broken function was right on all 3,000 graphs. A test suite built on unweighted examples will pass. The first weighted input in production is the first failure.",
        },
      ],
    },
    {
      id: "the-order-that-may-not-exist",
      heading: "The order that may not exist",
      body: [
        "The third word is **acyclic**, and it is the one that changes the most. A cycle is not a nuisance to be worked around; it is a different problem.",
        "On a directed acyclic graph \u2014 a DAG \u2014 the nodes can be laid out in an order where every edge points forwards. That order is what makes a whole family of problems easy: once it exists, the longest path is one sweep in that order, filling each node from the nodes that point at it. It is module 27's dynamic programming, run on a graph instead of an array.",
        "Put one cycle in and no such order exists. The longest simple path in a general directed graph is NP-hard; there is no linear-time sweep, in any order, that answers it.",
        "The dangerous part is that the sweep still runs. Order the nodes by index instead of topologically and the loop executes fine and returns a number. Over 3,000 random directed graphs, 1,988 had a topological order and the proper DAG pass was right on all 1,988 of them. The index-order sweep was right on 1,523 of those, and on 1,846 overall.",
        "It was too small on 1,030 graphs and too large on 124. Too small is the ordinary failure: the sweep reached a node before the node it depends on, so part of a chain propagated and the rest did not. Too large is the interesting one \u2014 it happens only on cyclic graphs, where the sweep carries a value around the loop and counts a node twice. Look at `[0->1, 1->2, 2->3, 3->1]` in the table: the index sweep says `4`, and no path visiting distinct nodes is that long.",
        "So the discipline is: compute the topological order, and check that it covered every node. If it did not, the graph has a cycle, and the linear-time answer you were about to compute does not exist. A number coming back from that code is not a result \u2014 it is the bug.",
      ],
      examples: [
        {
          id: "topological-order-and-the-sweep",
          title: "The order, the sweep that needs it, and the sweep run without it",
          lang: "python",
          code: `# The third word: acyclic.
#
# A cycle is not a nuisance, it is a change of problem. On a directed acyclic
# graph the nodes can be put in an order where every edge points forwards, and
# once that order exists the longest path is a linear-time dynamic program --
# module 27's method, on a graph.
#
# Put one cycle in and that order does not exist. The same dynamic program still
# runs, on whatever order the loop happened to use, and returns a number. The
# question it was answering has become NP-hard, and nothing in the code says so.
INF = 10 ** 9


def build(n, edges):
    neighbours = [[] for _ in range(n)]
    for u, v in edges:
        neighbours[u].append(v)
    return neighbours


def topological_order(n, edges):
    """Repeatedly take a node with nothing pointing at it. Empty if cyclic."""
    incoming = [0] * n
    for _, v in edges:
        incoming[v] += 1
    order = []
    ready = [v for v in range(n) if incoming[v] == 0]
    head = 0
    neighbours = build(n, edges)
    while head < len(ready):
        v = ready[head]
        head += 1
        order.append(v)
        for u in neighbours[v]:
            incoming[u] -= 1
            if incoming[u] == 0:
                ready.append(u)
    return order if len(order) == n else []


def longest_on_dag(n, edges):
    """One pass in topological order. Only meaningful when that order exists."""
    order = topological_order(n, edges)
    if not order:
        return -1
    neighbours = build(n, edges)
    best = [0] * n
    for v in order:
        for u in neighbours[v]:
            if best[v] + 1 > best[u]:
                best[u] = best[v] + 1
    return max(best)


def longest_by_index_order(n, edges):
    """The same pass, in plain index order. Runs on any graph, means nothing."""
    neighbours = build(n, edges)
    best = [0] * n
    for v in range(n):
        for u in neighbours[v]:
            if best[v] + 1 > best[u]:
                best[u] = best[v] + 1
    return max(best)


def longest_by_walking(n, edges):
    """Every path that does not revisit a node. The definition, on any graph."""
    neighbours = build(n, edges)
    best = [0]
    seen = [False] * n

    def step(v, length):
        if length > best[0]:
            best[0] = length
        seen[v] = True
        for u in neighbours[v]:
            if not seen[u]:
                step(u, length + 1)
        seen[v] = False

    for start in range(n):
        step(start, 0)
    return best[0]


def show(values):
    return "[" + ", ".join(str(v) for v in values) + "]"


def show_edges(edges):
    return "[" + ", ".join(f"{u}->{v}" for u, v in edges) + "]"


CASES = [
    (4, [(0, 1), (1, 2), (2, 3)]),
    (4, [(3, 2), (2, 1), (1, 0)]),
    (4, [(0, 1), (1, 2), (2, 3), (3, 1)]),
    (5, [(0, 1), (0, 2), (1, 3), (2, 3), (3, 4)]),
    (3, [(0, 1), (1, 2), (2, 0)]),
]

print(f"{'edges':<34}{'order':<16}{'longest, dag':>14}{'longest, index order':>22}{'every path':>12}")
for n, edges in CASES:
    order = topological_order(n, edges)
    shown = show(order) if order else "none (cyclic)"
    print(f"{show_edges(edges):<34}{shown:<16}{longest_on_dag(n, edges):>14}"
          f"{longest_by_index_order(n, edges):>22}{longest_by_walking(n, edges):>12}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
acyclic = 0
dag_ok = 0
index_ok_on_dags = 0
index_ok_overall = 0
index_under = 0
index_over = 0
for _ in range(TRIALS):
    n = 2 + rand(6)
    edges = []
    for u in range(n):
        for v in range(n):
            if u != v and rand(5) == 0:
                edges.append((u, v))
    truth = longest_by_walking(n, edges)
    order = topological_order(n, edges)
    guess = longest_by_index_order(n, edges)
    if order:
        acyclic += 1
        if longest_on_dag(n, edges) == truth:
            dag_ok += 1
        if guess == truth:
            index_ok_on_dags += 1
    if guess == truth:
        index_ok_overall += 1
    if guess < truth:
        index_under += 1
    if guess > truth:
        index_over += 1

print(f"over {TRIALS} random directed graphs on up to 7 nodes:")
print(f"  graphs with a topological order    {acyclic:>6}")
print(f"  the dag pass, on those             {dag_ok:>6}")
print(f"  the index-order pass, on those     {index_ok_on_dags:>6}")
print(f"  the index-order pass, on all       {index_ok_overall:>6}")
print()
print(f"the index-order pass was too small on {index_under} graphs and too large on {index_over}.")
print("Too small is the sweep propagating part of a chain and not the rest, because")
print("it reached a node before the node it depends on. Too large only happens on a")
print("cyclic graph, where the sweep can carry a value around the loop and count a")
print("node twice -- and there the question has no linear-time answer at all, so a")
print("number coming back is itself the bug. Check for the order; do not assume it.")
`,
          output: `edges                             order             longest, dag  longest, index order  every path
[0->1, 1->2, 2->3]                [0, 1, 2, 3]                 3                     3           3
[3->2, 2->1, 1->0]                [3, 2, 1, 0]                 3                     1           3
[0->1, 1->2, 2->3, 3->1]          none (cyclic)               -1                     4           3
[0->1, 0->2, 1->3, 2->3, 3->4]    [0, 1, 2, 3, 4]              3                     3           3
[0->1, 1->2, 2->0]                none (cyclic)               -1                     3           2

over 3000 random directed graphs on up to 7 nodes:
  graphs with a topological order      1988
  the dag pass, on those               1988
  the index-order pass, on those       1523
  the index-order pass, on all         1846

the index-order pass was too small on 1030 graphs and too large on 124.
Too small is the sweep propagating part of a chain and not the rest, because
it reached a node before the node it depends on. Too large only happens on a
cyclic graph, where the sweep can carry a value around the loop and count a
node twice -- and there the question has no linear-time answer at all, so a
number coming back is itself the bug. Check for the order; do not assume it.`,
          explanation:
            "The topological order, the linear-time longest path that depends on it, and the same sweep run in index order instead \u2014 scored against enumerating every simple path. The index sweep returns a number on cyclic graphs where no linear-time answer exists.",
          alternates: [
            {
              lang: "javascript",
              code: `// The third word: acyclic.
//
// A cycle is not a nuisance, it is a change of problem. On a directed acyclic
// graph the nodes can be put in an order where every edge points forwards, and
// once that order exists the longest path is a linear-time dynamic program --
// module 27's method, on a graph.
//
// Put one cycle in and that order does not exist. The same dynamic program still
// runs, on whatever order the loop happened to use, and returns a number. The
// question it was answering has become NP-hard, and nothing in the code says so.

function build(n, edges) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) neighbours[u].push(v);
  return neighbours;
}

/** Repeatedly take a node with nothing pointing at it. Empty if cyclic. */
function topologicalOrder(n, edges) {
  const incoming = new Array(n).fill(0);
  for (const [, v] of edges) incoming[v] += 1;
  const order = [];
  const ready = [];
  for (let v = 0; v < n; v += 1) if (incoming[v] === 0) ready.push(v);
  let head = 0;
  const neighbours = build(n, edges);
  while (head < ready.length) {
    const v = ready[head];
    head += 1;
    order.push(v);
    for (const u of neighbours[v]) {
      incoming[u] -= 1;
      if (incoming[u] === 0) ready.push(u);
    }
  }
  return order.length === n ? order : [];
}

/** One pass in topological order. Only meaningful when that order exists. */
function longestOnDag(n, edges) {
  const order = topologicalOrder(n, edges);
  if (order.length === 0) return -1;
  const neighbours = build(n, edges);
  const best = new Array(n).fill(0);
  for (const v of order) {
    for (const u of neighbours[v]) {
      if (best[v] + 1 > best[u]) best[u] = best[v] + 1;
    }
  }
  return Math.max(...best);
}

/** The same pass, in plain index order. Runs on any graph, means nothing. */
function longestByIndexOrder(n, edges) {
  const neighbours = build(n, edges);
  const best = new Array(n).fill(0);
  for (let v = 0; v < n; v += 1) {
    for (const u of neighbours[v]) {
      if (best[v] + 1 > best[u]) best[u] = best[v] + 1;
    }
  }
  return Math.max(...best);
}

/** Every path that does not revisit a node. The definition, on any graph. */
function longestByWalking(n, edges) {
  const neighbours = build(n, edges);
  let best = 0;
  const seen = new Array(n).fill(false);

  function step(v, length) {
    if (length > best) best = length;
    seen[v] = true;
    for (const u of neighbours[v]) {
      if (!seen[u]) step(u, length + 1);
    }
    seen[v] = false;
  }

  for (let start = 0; start < n; start += 1) step(start, 0);
  return best;
}

const show = (values) => "[" + values.join(", ") + "]";
const showEdges = (edges) =>
  "[" + edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ") + "]";

const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);

const CASES = [
  [4, [[0, 1], [1, 2], [2, 3]]],
  [4, [[3, 2], [2, 1], [1, 0]]],
  [4, [[0, 1], [1, 2], [2, 3], [3, 1]]],
  [5, [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4]]],
  [3, [[0, 1], [1, 2], [2, 0]]],
];

console.log(
  padEnd("edges", 34) +
    padEnd("order", 16) +
    pad("longest, dag", 14) +
    pad("longest, index order", 22) +
    pad("every path", 12)
);
for (const [n, edges] of CASES) {
  const order = topologicalOrder(n, edges);
  const shown = order.length > 0 ? show(order) : "none (cyclic)";
  console.log(
    padEnd(showEdges(edges), 34) +
      padEnd(shown, 16) +
      pad(longestOnDag(n, edges), 14) +
      pad(longestByIndexOrder(n, edges), 22) +
      pad(longestByWalking(n, edges), 12)
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
let acyclic = 0;
let dagOk = 0;
let indexOkOnDags = 0;
let indexOkOverall = 0;
let indexUnder = 0;
let indexOver = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v && rand(5) === 0) edges.push([u, v]);
    }
  }
  const truth = longestByWalking(n, edges);
  const order = topologicalOrder(n, edges);
  const guess = longestByIndexOrder(n, edges);
  if (order.length > 0) {
    acyclic += 1;
    if (longestOnDag(n, edges) === truth) dagOk += 1;
    if (guess === truth) indexOkOnDags += 1;
  }
  if (guess === truth) indexOkOverall += 1;
  if (guess < truth) indexUnder += 1;
  if (guess > truth) indexOver += 1;
}

console.log(\`over \${TRIALS} random directed graphs on up to 7 nodes:\`);
console.log(\`  graphs with a topological order    \${pad(acyclic, 6)}\`);
console.log(\`  the dag pass, on those             \${pad(dagOk, 6)}\`);
console.log(\`  the index-order pass, on those     \${pad(indexOkOnDags, 6)}\`);
console.log(\`  the index-order pass, on all       \${pad(indexOkOverall, 6)}\`);
console.log();
console.log(\`the index-order pass was too small on \${indexUnder} graphs and too large on \${indexOver}.\`);
console.log("Too small is the sweep propagating part of a chain and not the rest, because");
console.log("it reached a node before the node it depends on. Too large only happens on a");
console.log("cyclic graph, where the sweep can carry a value around the loop and count a");
console.log("node twice -- and there the question has no linear-time answer at all, so a");
console.log("number coming back is itself the bug. Check for the order; do not assume it.");
`,
            },
            {
              lang: "typescript",
              code: `// The third word: acyclic.
//
// A cycle is not a nuisance, it is a change of problem. On a directed acyclic
// graph the nodes can be put in an order where every edge points forwards, and
// once that order exists the longest path is a linear-time dynamic program --
// module 27's method, on a graph.
//
// Put one cycle in and that order does not exist. The same dynamic program still
// runs, on whatever order the loop happened to use, and returns a number. The
// question it was answering has become NP-hard, and nothing in the code says so.

type Edge = [number, number];

function build(n: number, edges: Edge[]): number[][] {
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) neighbours[u].push(v);
  return neighbours;
}

/** Repeatedly take a node with nothing pointing at it. Empty if cyclic. */
function topologicalOrder(n: number, edges: Edge[]): number[] {
  const incoming = new Array(n).fill(0);
  for (const [, v] of edges) incoming[v] += 1;
  const order: number[] = [];
  const ready: number[] = [];
  for (let v = 0; v < n; v += 1) if (incoming[v] === 0) ready.push(v);
  let head = 0;
  const neighbours = build(n, edges);
  while (head < ready.length) {
    const v = ready[head];
    head += 1;
    order.push(v);
    for (const u of neighbours[v]) {
      incoming[u] -= 1;
      if (incoming[u] === 0) ready.push(u);
    }
  }
  return order.length === n ? order : [];
}

/** One pass in topological order. Only meaningful when that order exists. */
function longestOnDag(n: number, edges: Edge[]): number {
  const order = topologicalOrder(n, edges);
  if (order.length === 0) return -1;
  const neighbours = build(n, edges);
  const best = new Array(n).fill(0);
  for (const v of order) {
    for (const u of neighbours[v]) {
      if (best[v] + 1 > best[u]) best[u] = best[v] + 1;
    }
  }
  return Math.max(...best);
}

/** The same pass, in plain index order. Runs on any graph, means nothing. */
function longestByIndexOrder(n: number, edges: Edge[]): number {
  const neighbours = build(n, edges);
  const best = new Array(n).fill(0);
  for (let v = 0; v < n; v += 1) {
    for (const u of neighbours[v]) {
      if (best[v] + 1 > best[u]) best[u] = best[v] + 1;
    }
  }
  return Math.max(...best);
}

/** Every path that does not revisit a node. The definition, on any graph. */
function longestByWalking(n: number, edges: Edge[]): number {
  const neighbours = build(n, edges);
  let best = 0;
  const seen = new Array(n).fill(false);

  function step(v: number, length: number): void {
    if (length > best) best = length;
    seen[v] = true;
    for (const u of neighbours[v]) {
      if (!seen[u]) step(u, length + 1);
    }
    seen[v] = false;
  }

  for (let start = 0; start < n; start += 1) step(start, 0);
  return best;
}

const show = (values: number[]): string => "[" + values.join(", ") + "]";
const showEdges = (edges: Edge[]): string =>
  "[" + edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ") + "]";

const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

const CASES: [number, Edge[]][] = [
  [4, [[0, 1], [1, 2], [2, 3]]],
  [4, [[3, 2], [2, 1], [1, 0]]],
  [4, [[0, 1], [1, 2], [2, 3], [3, 1]]],
  [5, [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4]]],
  [3, [[0, 1], [1, 2], [2, 0]]],
];

console.log(
  padEnd("edges", 34) +
    padEnd("order", 16) +
    pad("longest, dag", 14) +
    pad("longest, index order", 22) +
    pad("every path", 12)
);
for (const [n, edges] of CASES) {
  const order = topologicalOrder(n, edges);
  const shown = order.length > 0 ? show(order) : "none (cyclic)";
  console.log(
    padEnd(showEdges(edges), 34) +
      padEnd(shown, 16) +
      pad(longestOnDag(n, edges), 14) +
      pad(longestByIndexOrder(n, edges), 22) +
      pad(longestByWalking(n, edges), 12)
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
let acyclic = 0;
let dagOk = 0;
let indexOkOnDags = 0;
let indexOkOverall = 0;
let indexUnder = 0;
let indexOver = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges: Edge[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v && rand(5) === 0) edges.push([u, v]);
    }
  }
  const truth = longestByWalking(n, edges);
  const order = topologicalOrder(n, edges);
  const guess = longestByIndexOrder(n, edges);
  if (order.length > 0) {
    acyclic += 1;
    if (longestOnDag(n, edges) === truth) dagOk += 1;
    if (guess === truth) indexOkOnDags += 1;
  }
  if (guess === truth) indexOkOverall += 1;
  if (guess < truth) indexUnder += 1;
  if (guess > truth) indexOver += 1;
}

console.log(\`over \${TRIALS} random directed graphs on up to 7 nodes:\`);
console.log(\`  graphs with a topological order    \${pad(acyclic, 6)}\`);
console.log(\`  the dag pass, on those             \${pad(dagOk, 6)}\`);
console.log(\`  the index-order pass, on those     \${pad(indexOkOnDags, 6)}\`);
console.log(\`  the index-order pass, on all       \${pad(indexOkOverall, 6)}\`);
console.log();
console.log(\`the index-order pass was too small on \${indexUnder} graphs and too large on \${indexOver}.\`);
console.log("Too small is the sweep propagating part of a chain and not the rest, because");
console.log("it reached a node before the node it depends on. Too large only happens on a");
console.log("cyclic graph, where the sweep can carry a value around the loop and count a");
console.log("node twice -- and there the question has no linear-time answer at all, so a");
console.log("number coming back is itself the bug. Check for the order; do not assume it.");
`,
            },
            {
              lang: "java",
              code: `// The third word: acyclic.
//
// A cycle is not a nuisance, it is a change of problem. On a directed acyclic
// graph the nodes can be put in an order where every edge points forwards, and
// once that order exists the longest path is a linear-time dynamic program --
// module 27's method, on a graph.
//
// Put one cycle in and that order does not exist. The same dynamic program still
// runs, on whatever order the loop happened to use, and returns a number. The
// question it was answering has become NP-hard, and nothing in the code says so.

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

    /** Repeatedly take a node with nothing pointing at it. Empty if cyclic. */
    static List<Integer> topologicalOrder(int n, int[][] edges) {
        int[] incoming = new int[n];
        for (int[] e : edges) {
            incoming[e[1]]++;
        }
        List<Integer> order = new ArrayList<>();
        List<Integer> ready = new ArrayList<>();
        for (int v = 0; v < n; v++) {
            if (incoming[v] == 0) {
                ready.add(v);
            }
        }
        int head = 0;
        List<List<Integer>> neighbours = build(n, edges);
        while (head < ready.size()) {
            int v = ready.get(head);
            head++;
            order.add(v);
            for (int u : neighbours.get(v)) {
                incoming[u]--;
                if (incoming[u] == 0) {
                    ready.add(u);
                }
            }
        }
        return order.size() == n ? order : new ArrayList<>();
    }

    /** One pass in topological order. Only meaningful when that order exists. */
    static int longestOnDag(int n, int[][] edges) {
        List<Integer> order = topologicalOrder(n, edges);
        if (order.isEmpty()) {
            return -1;
        }
        List<List<Integer>> neighbours = build(n, edges);
        int[] best = new int[n];
        for (int v : order) {
            for (int u : neighbours.get(v)) {
                if (best[v] + 1 > best[u]) {
                    best[u] = best[v] + 1;
                }
            }
        }
        int most = 0;
        for (int value : best) {
            most = Math.max(most, value);
        }
        return most;
    }

    /** The same pass, in plain index order. Runs on any graph, means nothing. */
    static int longestByIndexOrder(int n, int[][] edges) {
        List<List<Integer>> neighbours = build(n, edges);
        int[] best = new int[n];
        for (int v = 0; v < n; v++) {
            for (int u : neighbours.get(v)) {
                if (best[v] + 1 > best[u]) {
                    best[u] = best[v] + 1;
                }
            }
        }
        int most = 0;
        for (int value : best) {
            most = Math.max(most, value);
        }
        return most;
    }

    static int walkBest;

    static void step(List<List<Integer>> neighbours, boolean[] seen, int v, int length) {
        if (length > walkBest) {
            walkBest = length;
        }
        seen[v] = true;
        for (int u : neighbours.get(v)) {
            if (!seen[u]) {
                step(neighbours, seen, u, length + 1);
            }
        }
        seen[v] = false;
    }

    /** Every path that does not revisit a node. The definition, on any graph. */
    static int longestByWalking(int n, int[][] edges) {
        List<List<Integer>> neighbours = build(n, edges);
        walkBest = 0;
        boolean[] seen = new boolean[n];
        for (int start = 0; start < n; start++) {
            step(neighbours, seen, start, 0);
        }
        return walkBest;
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

    static String pad(String text, int width) {
        StringBuilder sb = new StringBuilder();
        while (sb.length() + text.length() < width) {
            sb.append(' ');
        }
        return sb.append(text).toString();
    }

    static String padEnd(String text, int width) {
        StringBuilder sb = new StringBuilder(text);
        while (sb.length() < width) {
            sb.append(' ');
        }
        return sb.toString();
    }

    // The same linear congruential generator in every language, so the random
    // graphs below are the same graphs whichever translation is run.
    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        int[] sizes = {4, 4, 4, 5, 3};
        int[][][] cases = {
            {{0, 1}, {1, 2}, {2, 3}},
            {{3, 2}, {2, 1}, {1, 0}},
            {{0, 1}, {1, 2}, {2, 3}, {3, 1}},
            {{0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}},
            {{0, 1}, {1, 2}, {2, 0}},
        };

        System.out.println(padEnd("edges", 34) + padEnd("order", 16)
                + pad("longest, dag", 14) + pad("longest, index order", 22)
                + pad("every path", 12));
        for (int c = 0; c < sizes.length; c++) {
            int n = sizes[c];
            int[][] edges = cases[c];
            List<Integer> order = topologicalOrder(n, edges);
            String shown = order.isEmpty() ? "none (cyclic)" : show(order);
            System.out.println(padEnd(showEdges(edges), 34) + padEnd(shown, 16)
                    + pad(String.valueOf(longestOnDag(n, edges)), 14)
                    + pad(String.valueOf(longestByIndexOrder(n, edges)), 22)
                    + pad(String.valueOf(longestByWalking(n, edges)), 12));
        }
        System.out.println();

        int trials = 3000;
        int acyclic = 0;
        int dagOk = 0;
        int indexOkOnDags = 0;
        int indexOkOverall = 0;
        int indexUnder = 0;
        int indexOver = 0;
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
            int truth = longestByWalking(n, edges);
            List<Integer> order = topologicalOrder(n, edges);
            int guess = longestByIndexOrder(n, edges);
            if (!order.isEmpty()) {
                acyclic++;
                if (longestOnDag(n, edges) == truth) {
                    dagOk++;
                }
                if (guess == truth) {
                    indexOkOnDags++;
                }
            }
            if (guess == truth) {
                indexOkOverall++;
            }
            if (guess < truth) {
                indexUnder++;
            }
            if (guess > truth) {
                indexOver++;
            }
        }

        System.out.println("over " + trials + " random directed graphs on up to 7 nodes:");
        System.out.println("  graphs with a topological order    " + pad(String.valueOf(acyclic), 6));
        System.out.println("  the dag pass, on those             " + pad(String.valueOf(dagOk), 6));
        System.out.println("  the index-order pass, on those     " + pad(String.valueOf(indexOkOnDags), 6));
        System.out.println("  the index-order pass, on all       " + pad(String.valueOf(indexOkOverall), 6));
        System.out.println();
        System.out.println("the index-order pass was too small on " + indexUnder
                + " graphs and too large on " + indexOver + ".");
        System.out.println("Too small is the sweep propagating part of a chain and not the rest, because");
        System.out.println("it reached a node before the node it depends on. Too large only happens on a");
        System.out.println("cyclic graph, where the sweep can carry a value around the loop and count a");
        System.out.println("node twice -- and there the question has no linear-time answer at all, so a");
        System.out.println("number coming back is itself the bug. Check for the order; do not assume it.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The third word: acyclic.
//
// A cycle is not a nuisance, it is a change of problem. On a directed acyclic
// graph the nodes can be put in an order where every edge points forwards, and
// once that order exists the longest path is a linear-time dynamic program --
// module 27's method, on a graph.
//
// Put one cycle in and that order does not exist. The same dynamic program still
// runs, on whatever order the loop happened to use, and returns a number. The
// question it was answering has become NP-hard, and nothing in the code says so.

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

// Repeatedly take a node with nothing pointing at it. Empty if cyclic.
std::vector<int> topological_order(int n, const std::vector<Edge>& edges) {
    std::vector<int> incoming(n, 0);
    for (const Edge& e : edges) {
        incoming[e.second] += 1;
    }
    std::vector<int> order;
    std::vector<int> ready;
    for (int v = 0; v < n; v++) {
        if (incoming[v] == 0) {
            ready.push_back(v);
        }
    }
    size_t head = 0;
    std::vector<std::vector<int>> neighbours = build(n, edges);
    while (head < ready.size()) {
        int v = ready[head];
        head += 1;
        order.push_back(v);
        for (int u : neighbours[v]) {
            incoming[u] -= 1;
            if (incoming[u] == 0) {
                ready.push_back(u);
            }
        }
    }
    if (static_cast<int>(order.size()) == n) {
        return order;
    }
    return std::vector<int>();
}

// One pass in topological order. Only meaningful when that order exists.
int longest_on_dag(int n, const std::vector<Edge>& edges) {
    std::vector<int> order = topological_order(n, edges);
    if (order.empty()) {
        return -1;
    }
    std::vector<std::vector<int>> neighbours = build(n, edges);
    std::vector<int> best(n, 0);
    for (int v : order) {
        for (int u : neighbours[v]) {
            if (best[v] + 1 > best[u]) {
                best[u] = best[v] + 1;
            }
        }
    }
    int most = 0;
    for (int value : best) {
        if (value > most) {
            most = value;
        }
    }
    return most;
}

// The same pass, in plain index order. Runs on any graph, means nothing.
int longest_by_index_order(int n, const std::vector<Edge>& edges) {
    std::vector<std::vector<int>> neighbours = build(n, edges);
    std::vector<int> best(n, 0);
    for (int v = 0; v < n; v++) {
        for (int u : neighbours[v]) {
            if (best[v] + 1 > best[u]) {
                best[u] = best[v] + 1;
            }
        }
    }
    int most = 0;
    for (int value : best) {
        if (value > most) {
            most = value;
        }
    }
    return most;
}

void step(const std::vector<std::vector<int>>& neighbours, std::vector<char>& seen,
          int& best, int v, int length) {
    if (length > best) {
        best = length;
    }
    seen[v] = 1;
    for (int u : neighbours[v]) {
        if (!seen[u]) {
            step(neighbours, seen, best, u, length + 1);
        }
    }
    seen[v] = 0;
}

// Every path that does not revisit a node. The definition, on any graph.
int longest_by_walking(int n, const std::vector<Edge>& edges) {
    std::vector<std::vector<int>> neighbours = build(n, edges);
    int best = 0;
    std::vector<char> seen(n, 0);
    for (int start = 0; start < n; start++) {
        step(neighbours, seen, best, start, 0);
    }
    return best;
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
    std::vector<int> sizes = {4, 4, 4, 5, 3};
    std::vector<std::vector<Edge>> cases = {
        {{0, 1}, {1, 2}, {2, 3}},
        {{3, 2}, {2, 1}, {1, 0}},
        {{0, 1}, {1, 2}, {2, 3}, {3, 1}},
        {{0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}},
        {{0, 1}, {1, 2}, {2, 0}},
    };

    std::cout << std::left << std::setw(34) << "edges" << std::setw(16) << "order"
              << std::right << std::setw(14) << "longest, dag"
              << std::setw(22) << "longest, index order"
              << std::setw(12) << "every path" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        int n = sizes[c];
        const std::vector<Edge>& edges = cases[c];
        std::vector<int> order = topological_order(n, edges);
        std::string shown = order.empty() ? std::string("none (cyclic)") : show(order);
        std::cout << std::left << std::setw(34) << show_edges(edges) << std::setw(16) << shown
                  << std::right << std::setw(14) << longest_on_dag(n, edges)
                  << std::setw(22) << longest_by_index_order(n, edges)
                  << std::setw(12) << longest_by_walking(n, edges) << "\\n";
    }
    std::cout << "\\n";

    int trials = 3000;
    int acyclic = 0;
    int dag_ok = 0;
    int index_ok_on_dags = 0;
    int index_ok_overall = 0;
    int index_under = 0;
    int index_over = 0;
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
        int truth = longest_by_walking(n, edges);
        std::vector<int> order = topological_order(n, edges);
        int guess = longest_by_index_order(n, edges);
        if (!order.empty()) {
            acyclic += 1;
            if (longest_on_dag(n, edges) == truth) {
                dag_ok += 1;
            }
            if (guess == truth) {
                index_ok_on_dags += 1;
            }
        }
        if (guess == truth) {
            index_ok_overall += 1;
        }
        if (guess < truth) {
            index_under += 1;
        }
        if (guess > truth) {
            index_over += 1;
        }
    }

    std::cout << "over " << trials << " random directed graphs on up to 7 nodes:\\n";
    std::cout << "  graphs with a topological order    " << std::setw(6) << acyclic << "\\n";
    std::cout << "  the dag pass, on those             " << std::setw(6) << dag_ok << "\\n";
    std::cout << "  the index-order pass, on those     " << std::setw(6) << index_ok_on_dags << "\\n";
    std::cout << "  the index-order pass, on all       " << std::setw(6) << index_ok_overall << "\\n";
    std::cout << "\\n";
    std::cout << "the index-order pass was too small on " << index_under
              << " graphs and too large on " << index_over << ".\\n";
    std::cout << "Too small is the sweep propagating part of a chain and not the rest, because\\n";
    std::cout << "it reached a node before the node it depends on. Too large only happens on a\\n";
    std::cout << "cyclic graph, where the sweep can carry a value around the loop and count a\\n";
    std::cout << "node twice -- and there the question has no linear-time answer at all, so a\\n";
    std::cout << "number coming back is itself the bug. Check for the order; do not assume it.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// The third word: acyclic.
//
// A cycle is not a nuisance, it is a change of problem. On a directed acyclic
// graph the nodes can be put in an order where every edge points forwards, and
// once that order exists the longest path is a linear-time dynamic program --
// module 27's method, on a graph.
//
// Put one cycle in and that order does not exist. The same dynamic program still
// runs, on whatever order the loop happened to use, and returns a number. The
// question it was answering has become NP-hard, and nothing in the code says so.

fn build(n: usize, edges: &[(usize, usize)]) -> Vec<Vec<usize>> {
    let mut neighbours = vec![Vec::new(); n];
    for &(u, v) in edges {
        neighbours[u].push(v);
    }
    neighbours
}

/// Repeatedly take a node with nothing pointing at it. Empty if cyclic.
fn topological_order(n: usize, edges: &[(usize, usize)]) -> Vec<usize> {
    let mut incoming = vec![0usize; n];
    for &(_, v) in edges {
        incoming[v] += 1;
    }
    let mut order: Vec<usize> = Vec::new();
    let mut ready: Vec<usize> = Vec::new();
    for v in 0..n {
        if incoming[v] == 0 {
            ready.push(v);
        }
    }
    let mut head = 0;
    let neighbours = build(n, edges);
    while head < ready.len() {
        let v = ready[head];
        head += 1;
        order.push(v);
        for i in 0..neighbours[v].len() {
            let u = neighbours[v][i];
            incoming[u] -= 1;
            if incoming[u] == 0 {
                ready.push(u);
            }
        }
    }
    if order.len() == n { order } else { Vec::new() }
}

/// One pass in topological order. Only meaningful when that order exists.
fn longest_on_dag(n: usize, edges: &[(usize, usize)]) -> i64 {
    let order = topological_order(n, edges);
    if order.is_empty() {
        return -1;
    }
    let neighbours = build(n, edges);
    let mut best = vec![0i64; n];
    for &v in &order {
        for &u in &neighbours[v] {
            if best[v] + 1 > best[u] {
                best[u] = best[v] + 1;
            }
        }
    }
    *best.iter().max().unwrap()
}

/// The same pass, in plain index order. Runs on any graph, means nothing.
fn longest_by_index_order(n: usize, edges: &[(usize, usize)]) -> i64 {
    let neighbours = build(n, edges);
    let mut best = vec![0i64; n];
    for v in 0..n {
        for &u in &neighbours[v] {
            if best[v] + 1 > best[u] {
                best[u] = best[v] + 1;
            }
        }
    }
    *best.iter().max().unwrap()
}

fn step(neighbours: &[Vec<usize>], seen: &mut Vec<bool>, best: &mut i64, v: usize, length: i64) {
    if length > *best {
        *best = length;
    }
    seen[v] = true;
    for i in 0..neighbours[v].len() {
        let u = neighbours[v][i];
        if !seen[u] {
            step(neighbours, seen, best, u, length + 1);
        }
    }
    seen[v] = false;
}

/// Every path that does not revisit a node. The definition, on any graph.
fn longest_by_walking(n: usize, edges: &[(usize, usize)]) -> i64 {
    let neighbours = build(n, edges);
    let mut best = 0i64;
    let mut seen = vec![false; n];
    for start in 0..n {
        step(&neighbours, &mut seen, &mut best, start, 0);
    }
    best
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
    let sizes: Vec<usize> = vec![4, 4, 4, 5, 3];
    let cases: Vec<Vec<(usize, usize)>> = vec![
        vec![(0, 1), (1, 2), (2, 3)],
        vec![(3, 2), (2, 1), (1, 0)],
        vec![(0, 1), (1, 2), (2, 3), (3, 1)],
        vec![(0, 1), (0, 2), (1, 3), (2, 3), (3, 4)],
        vec![(0, 1), (1, 2), (2, 0)],
    ];

    println!(
        "{}{}{}{}{}",
        pad_right("edges", 34),
        pad_right("order", 16),
        pad_left("longest, dag", 14),
        pad_left("longest, index order", 22),
        pad_left("every path", 12)
    );
    for (c, edges) in cases.iter().enumerate() {
        let n = sizes[c];
        let order = topological_order(n, edges);
        let shown = if order.is_empty() {
            String::from("none (cyclic)")
        } else {
            show(&order)
        };
        println!(
            "{}{}{}{}{}",
            pad_right(&show_edges(edges), 34),
            pad_right(&shown, 16),
            pad_left(&longest_on_dag(n, edges).to_string(), 14),
            pad_left(&longest_by_index_order(n, edges).to_string(), 22),
            pad_left(&longest_by_walking(n, edges).to_string(), 12)
        );
    }
    println!();

    let mut rng = Rng { seed: 1 };
    let trials = 3000;
    let mut acyclic = 0;
    let mut dag_ok = 0;
    let mut index_ok_on_dags = 0;
    let mut index_ok_overall = 0;
    let mut index_under = 0;
    let mut index_over = 0;
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
        let truth = longest_by_walking(n, &edges);
        let order = topological_order(n, &edges);
        let guess = longest_by_index_order(n, &edges);
        if !order.is_empty() {
            acyclic += 1;
            if longest_on_dag(n, &edges) == truth {
                dag_ok += 1;
            }
            if guess == truth {
                index_ok_on_dags += 1;
            }
        }
        if guess == truth {
            index_ok_overall += 1;
        }
        if guess < truth {
            index_under += 1;
        }
        if guess > truth {
            index_over += 1;
        }
    }

    println!("over {} random directed graphs on up to 7 nodes:", trials);
    println!("  graphs with a topological order    {}", pad_left(&acyclic.to_string(), 6));
    println!("  the dag pass, on those             {}", pad_left(&dag_ok.to_string(), 6));
    println!("  the index-order pass, on those     {}", pad_left(&index_ok_on_dags.to_string(), 6));
    println!("  the index-order pass, on all       {}", pad_left(&index_ok_overall.to_string(), 6));
    println!();
    println!(
        "the index-order pass was too small on {} graphs and too large on {}.",
        index_under, index_over
    );
    println!("Too small is the sweep propagating part of a chain and not the rest, because");
    println!("it reached a node before the node it depends on. Too large only happens on a");
    println!("cyclic graph, where the sweep can carry a value around the loop and count a");
    println!("node twice -- and there the question has no linear-time answer at all, so a");
    println!("number coming back is itself the bug. Check for the order; do not assume it.");
}
`,
            },
            {
              lang: "go",
              code: `// The third word: acyclic.
//
// A cycle is not a nuisance, it is a change of problem. On a directed acyclic
// graph the nodes can be put in an order where every edge points forwards, and
// once that order exists the longest path is a linear-time dynamic program --
// module 27's method, on a graph.
//
// Put one cycle in and that order does not exist. The same dynamic program still
// runs, on whatever order the loop happened to use, and returns a number. The
// question it was answering has become NP-hard, and nothing in the code says so.

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

// Repeatedly take a node with nothing pointing at it. Empty if cyclic.
func topologicalOrder(n int, edges []edge) []int {
	incoming := make([]int, n)
	for _, e := range edges {
		incoming[e.to]++
	}
	order := []int{}
	ready := []int{}
	for v := 0; v < n; v++ {
		if incoming[v] == 0 {
			ready = append(ready, v)
		}
	}
	head := 0
	neighbours := build(n, edges)
	for head < len(ready) {
		v := ready[head]
		head++
		order = append(order, v)
		for _, u := range neighbours[v] {
			incoming[u]--
			if incoming[u] == 0 {
				ready = append(ready, u)
			}
		}
	}
	if len(order) == n {
		return order
	}
	return []int{}
}

// One pass in topological order. Only meaningful when that order exists.
func longestOnDag(n int, edges []edge) int {
	order := topologicalOrder(n, edges)
	if len(order) == 0 {
		return -1
	}
	neighbours := build(n, edges)
	best := make([]int, n)
	for _, v := range order {
		for _, u := range neighbours[v] {
			if best[v]+1 > best[u] {
				best[u] = best[v] + 1
			}
		}
	}
	most := 0
	for _, value := range best {
		if value > most {
			most = value
		}
	}
	return most
}

// The same pass, in plain index order. Runs on any graph, means nothing.
func longestByIndexOrder(n int, edges []edge) int {
	neighbours := build(n, edges)
	best := make([]int, n)
	for v := 0; v < n; v++ {
		for _, u := range neighbours[v] {
			if best[v]+1 > best[u] {
				best[u] = best[v] + 1
			}
		}
	}
	most := 0
	for _, value := range best {
		if value > most {
			most = value
		}
	}
	return most
}

// Every path that does not revisit a node. The definition, on any graph.
func longestByWalking(n int, edges []edge) int {
	neighbours := build(n, edges)
	best := 0
	seen := make([]bool, n)
	var step func(v, length int)
	step = func(v, length int) {
		if length > best {
			best = length
		}
		seen[v] = true
		for _, u := range neighbours[v] {
			if !seen[u] {
				step(u, length+1)
			}
		}
		seen[v] = false
	}
	for start := 0; start < n; start++ {
		step(start, 0)
	}
	return best
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
	sizes := []int{4, 4, 4, 5, 3}
	cases := [][]edge{
		{{0, 1}, {1, 2}, {2, 3}},
		{{3, 2}, {2, 1}, {1, 0}},
		{{0, 1}, {1, 2}, {2, 3}, {3, 1}},
		{{0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}},
		{{0, 1}, {1, 2}, {2, 0}},
	}

	fmt.Printf("%-34s%-16s%14s%22s%12s\\n", "edges", "order",
		"longest, dag", "longest, index order", "every path")
	for c, edges := range cases {
		n := sizes[c]
		order := topologicalOrder(n, edges)
		shown := "none (cyclic)"
		if len(order) > 0 {
			shown = show(order)
		}
		fmt.Printf("%-34s%-16s%14d%22d%12d\\n", showEdges(edges), shown,
			longestOnDag(n, edges), longestByIndexOrder(n, edges), longestByWalking(n, edges))
	}
	fmt.Println()

	trials := 3000
	acyclic := 0
	dagOk := 0
	indexOkOnDags := 0
	indexOkOverall := 0
	indexUnder := 0
	indexOver := 0
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
		truth := longestByWalking(n, edges)
		order := topologicalOrder(n, edges)
		guess := longestByIndexOrder(n, edges)
		if len(order) > 0 {
			acyclic++
			if longestOnDag(n, edges) == truth {
				dagOk++
			}
			if guess == truth {
				indexOkOnDags++
			}
		}
		if guess == truth {
			indexOkOverall++
		}
		if guess < truth {
			indexUnder++
		}
		if guess > truth {
			indexOver++
		}
	}

	fmt.Printf("over %d random directed graphs on up to 7 nodes:\\n", trials)
	fmt.Printf("  graphs with a topological order    %6d\\n", acyclic)
	fmt.Printf("  the dag pass, on those             %6d\\n", dagOk)
	fmt.Printf("  the index-order pass, on those     %6d\\n", indexOkOnDags)
	fmt.Printf("  the index-order pass, on all       %6d\\n", indexOkOverall)
	fmt.Println()
	fmt.Printf("the index-order pass was too small on %d graphs and too large on %d.\\n",
		indexUnder, indexOver)
	fmt.Println("Too small is the sweep propagating part of a chain and not the rest, because")
	fmt.Println("it reached a node before the node it depends on. Too large only happens on a")
	fmt.Println("cyclic graph, where the sweep can carry a value around the loop and count a")
	fmt.Println("node twice -- and there the question has no linear-time answer at all, so a")
	fmt.Println("number coming back is itself the bug. Check for the order; do not assume it.")
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
        title: "The order every edge points forwards along",
        lockAlgorithm: true,
      },
      pitfalls: [
        {
          title: "The topological sweep still runs on a cyclic graph",
          body: "It does not raise, it does not loop forever, it returns a number. On 124 of 3,000 random graphs the index-order sweep returned a value larger than any real simple path, because it carried a value around a cycle. Build the order and check it covered every node; if it did not, stop.",
        },
        {
          title: "\"Longest path\" is easy on a DAG and NP-hard without one",
          body: "Same three words in the problem statement, entirely different problem. On the 1,988 acyclic graphs the linear pass was right 1,988 times. Off a DAG there is no linear-time method at all, so if the code is still linear the question has quietly changed.",
        },
      ],
    },
    {
      id: "three-questions",
      heading: "Three questions before choosing an algorithm",
      body: [
        "Three words, three questions to ask of any graph problem before choosing an algorithm.",
        "**Is it directed?** Read the statement, not the picture. \"Follows\" is directed; \"is friends with\" is not. \"One-way street\", \"prerequisite\", \"depends on\", \"links to\" \u2014 all directed. Getting it wrong is silent on the inputs where reachability happens to be symmetric, which was a fifth of the random cases here — and a single-source query missed the difference on half of them.",
        "**Is it weighted?** If every edge costs the same, BFS is the shortest-path algorithm and nothing more is needed. If they differ, BFS is answering a different question, and the version that adds up weights along the way is answering it while looking like it is not.",
        "**Is it acyclic?** If it is, an ordering exists and a linear sweep over it solves problems that are intractable in general. If it is not, the sweep still runs and still returns a number. Check by building the order and counting what it covered.",
        "There is a fourth property worth naming here because the next module leans on it: **connected**. An undirected graph is connected when every node can reach every other; a directed one is *strongly* connected when that holds following the arrows. Those are different tests, which is why the table above has separate columns for them, and why strongly connected components get a lesson of their own in module 30.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does making a graph directed change the algorithms you would use?",
      answer:
        "Reachability stops being symmetric, so \"can a reach b\" and \"can b reach a\" become separate questions, and connectivity splits into two notions \u2014 connected for undirected, strongly connected for directed, which needs a different algorithm entirely. Cycle detection changes too: two nodes pointing at each other is a cycle in a directed graph and not one in an undirected graph, so undirected detection has to ignore the edge it arrived on and directed detection uses a recursion stack instead. The practical risk is that the mistake is quiet. Reading a one-way problem as two-way over-reports reachability, reading it the other way under-reports it, and on the random edge lists I measured, reachability happened to come out symmetric on 655 of 3,000 anyway \u2014 so about a fifth of test inputs will not reveal the error.",
    },
    {
      question: "Why can't you use BFS for shortest paths on a weighted graph?",
      answer:
        "Because BFS answers \"fewest edges\", and on a weighted graph that is a different question from \"cheapest route\". They coincide when every edge costs the same, which is why BFS is exactly right on an unweighted graph. The subtle version of the mistake is keeping the BFS traversal and summing the weights along the way \u2014 that returns the cost of a real path, just the fewest-edges one rather than the cheapest. On a triangle with edges of 4, 4 and 9, it prices the single 9 edge instead of the two 4s. Measured over 3,000 random weighted graphs it was right 2,881 times and too expensive on the other 119, never too cheap. And with all weights set to 1 it is right every time, so unit-weight tests will not catch it.",
    },
    {
      question: "What changes when a directed graph has a cycle?",
      answer:
        "A topological order stops existing, and everything that depends on one stops being available. Longest path is the clearest example: on a DAG it is a single sweep in topological order, linear time; in a general directed graph it is NP-hard. The danger is that the sweep does not fail loudly. Run it in index order on a cyclic graph and it returns a number \u2014 over 3,000 random graphs it was too small on 1,030 and too large on 124, and too large can only happen with a cycle, because the sweep carried a value around the loop. So the discipline is to build the topological order and check it covered every node. If it did not, there is a cycle, and either the problem needs a different formulation or it needs to be solved on the condensation of the strongly connected components.",
    },
  ],
  takeaways: [
    "Directed, weighted and acyclic are not terminology \u2014 each one changes which algorithm is correct.",
    "An undirected reading of a directed edge list never reaches fewer nodes and reached strictly more on 1,500 of 3,000 random cases.",
    "Reachability was symmetric anyway on 655 of 3,000, so the direction bug survives about a fifth of test inputs.",
    "Two nodes pointing at each other is a cycle when directed and not when undirected \u2014 1,153 of the 3,000 edge lists had such a pair.",
    "BFS answers \"fewest edges\"; on a weighted graph that is a different question from \"cheapest route\".",
    "Summing weights along a BFS prices a real route, just the wrong one: right 2,881 times out of 3,000, too expensive on 119, never too cheap.",
    "Set every weight to `1` and the broken version is right 3,000 out of 3,000 \u2014 unit-weight tests cannot catch it.",
    "On a DAG the longest path is one linear sweep in topological order; in a general directed graph it is NP-hard.",
    "The sweep still runs on a cyclic graph and still returns a number \u2014 too small on 1,030 graphs and too large on 124.",
    "Build the topological order and check it covered every node; a cycle means the linear-time answer does not exist.",
  ],
  status: "available",
};
