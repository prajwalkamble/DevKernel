import type { Lesson } from "@/content/types";

export const breadthFirstSearchLesson: Lesson = {
  id: "dsa-graphs-breadth-first-search",
  slug: "breadth-first-search",
  moduleSlug: "graphs",
  title: "Breadth-First Search and Shortest Paths",
  summary:
    "Why breadth-first search is a shortest-path algorithm rather than just a traversal, proved by checking the queue invariant on every pop; the two extensions it is constantly asked for and neither of which changes the loop; and the two-ended search, with the shapes where it wins and the stopping rule that is quietly wrong.",
  estimatedMinutes: 45,
  objectives: [
    "State the queue invariant that makes breadth-first search exact, and check it in code",
    "Reconstruct a shortest route from a parent array recorded during the search",
    "Answer \u201cdistance from the nearest of these\u201d in a single pass",
    "Search from both ends, and stop at the right moment",
  ],
  sections: [
    {
      id: "why-the-layers-are-shortest",
      heading: "Why the layers are shortest",
      body: [
        "Breadth-first search is usually introduced as \"the other traversal\", visiting neighbours before grandchildren. That is true and it undersells it. The interesting fact is that breadth-first search is a **shortest-path algorithm**, and it is worth knowing exactly why, because the reason is what tells you when it stops being one.",
        "The reason is a property of the queue rather than of the graph. At every moment the queue holds nodes from at most two consecutive distances, and never hands back a smaller distance after a larger one. That is what \"layer by layer\" actually means, and the example checks it on every single pop: over 3,000 random graphs the queue spanned at most two layers 3,000 times, and the distances came off in ascending order 3,000 times.",
        "Those two facts force the conclusion. A node is only ever given a distance one greater than the node being expanded, and nodes are expanded in ascending order of distance \u2014 so the first time a node is reached, it is reached from the nearest layer that touches it. That is the definition of a shortest path in edges, and the distances agreed with an exhaustive search over every simple path on all 3,000 graphs.",
        "Notice which assumption is load-bearing. Every edge adds exactly one, which is why one layer at a time is enough. Change that \u2014 put weights on the edges \u2014 and the queue is no longer sorted by cost, and the argument collapses. That is the same fact this module's third lesson measured from the other side, and it is why Dijkstra replaces the queue with a heap in the next module.",
      ],
      examples: [
        {
          id: "the-queue-invariant",
          title: "The distances, and the property of the queue that makes them shortest",
          lang: "python",
          code: `# Breadth-first search, and the one property that makes it a shortest-path
# algorithm rather than just another way to visit everything.
#
# The property is about the queue, not about the graph: at every moment the
# queue holds nodes from at most two consecutive distances, and never a smaller
# distance after a larger one. That is what "layer by layer" actually means, and
# it is why the first time a node is reached is by a shortest route.
#
# The example checks the distances against an exhaustive search over every
# simple path, and checks the queue invariant on every single pop.


def build(n, edges):
    neighbours = [[] for _ in range(n)]
    for u, v in edges:
        neighbours[u].append(v)
        neighbours[v].append(u)
    return neighbours


def bfs_distances(neighbours, start):
    """The distances, and the widest spread of distances the queue ever held."""
    n = len(neighbours)
    distance = [-1] * n
    distance[start] = 0
    queue = [start]
    head = 0
    spread = 1
    non_decreasing = True
    previous = 0
    while head < len(queue):
        v = queue[head]
        head += 1
        if distance[v] < previous:
            non_decreasing = False
        previous = distance[v]
        low = distance[v]
        high = distance[v]
        for i in range(head, len(queue)):
            if distance[queue[i]] < low:
                low = distance[queue[i]]
            if distance[queue[i]] > high:
                high = distance[queue[i]]
        if head < len(queue) and high - low + 1 > spread:
            spread = high - low + 1
        for u in neighbours[v]:
            if distance[u] < 0:
                distance[u] = distance[v] + 1
                queue.append(u)
    return distance, spread, non_decreasing


def shortest_by_walking(neighbours, start, target):
    """Every simple path from start to target, keeping the shortest. The definition."""
    n = len(neighbours)
    best = [n + 1]
    seen = [False] * n

    def step(v, length):
        if length >= best[0]:
            return
        if v == target:
            best[0] = length
            return
        seen[v] = True
        for u in neighbours[v]:
            if not seen[u]:
                step(u, length + 1)
        seen[v] = False

    step(start, 0)
    return -1 if best[0] > n else best[0]


def show(values):
    return "[" + ", ".join(str(v) for v in values) + "]"


CASES = [
    (6, [(0, 1), (0, 2), (1, 3), (2, 3), (3, 4), (4, 5)]),
    (7, [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 6)]),
    (5, [(0, 1), (0, 2), (0, 3), (0, 4)]),
    (6, [(0, 1), (1, 2), (3, 4), (4, 5)]),
]

print(f"{'edges':<44}{'distances':<26}{'widest queue spread':>21}")
for n, edges in CASES:
    neighbours = build(n, edges)
    distance, spread, _ = bfs_distances(neighbours, 0)
    shown = "[" + ", ".join(f"{u}-{v}" for u, v in edges) + "]"
    print(f"{shown:<44}{show(distance):<26}{spread:>21}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
distances_ok = 0
spread_at_most_two = 0
always_non_decreasing = 0
for _ in range(TRIALS):
    n = 2 + rand(6)
    edges = []
    for u in range(n):
        for v in range(u + 1, n):
            if rand(3) == 0:
                edges.append((u, v))
    neighbours = build(n, edges)
    distance, spread, non_decreasing = bfs_distances(neighbours, 0)
    good = True
    for target in range(n):
        if distance[target] != shortest_by_walking(neighbours, 0, target):
            good = False
    if good:
        distances_ok += 1
    if spread <= 2:
        spread_at_most_two += 1
    if non_decreasing:
        always_non_decreasing += 1

print(f"over {TRIALS} random graphs on up to 7 nodes:")
print(f"  distances matched exhaustive search   {distances_ok:>6}")
print(f"  the queue spanned at most two layers  {spread_at_most_two:>6}")
print(f"  distances came off in ascending order  {always_non_decreasing:>6}")
print()
print("The second and third lines are the proof of the first. A node is only ever")
print("given a distance one greater than the node being expanded, and nodes are")
print("expanded in non-decreasing order of distance, so the queue can never hold")
print("more than two consecutive values at once. That means the first time a node")
print("is reached, it is reached from the closest layer that touches it -- which")
print("is the definition of a shortest path in edges.")
`,
          output: `edges                                       distances                   widest queue spread
[0-1, 0-2, 1-3, 2-3, 3-4, 4-5]              [0, 1, 1, 2, 3, 4]                            2
[0-1, 1-2, 2-3, 3-4, 4-5, 5-6]              [0, 1, 2, 3, 4, 5, 6]                         1
[0-1, 0-2, 0-3, 0-4]                        [0, 1, 1, 1, 1]                               1
[0-1, 1-2, 3-4, 4-5]                        [0, 1, 2, -1, -1, -1]                         1

over 3000 random graphs on up to 7 nodes:
  distances matched exhaustive search     3000
  the queue spanned at most two layers    3000
  distances came off in ascending order    3000

The second and third lines are the proof of the first. A node is only ever
given a distance one greater than the node being expanded, and nodes are
expanded in non-decreasing order of distance, so the queue can never hold
more than two consecutive values at once. That means the first time a node
is reached, it is reached from the closest layer that touches it -- which
is the definition of a shortest path in edges.`,
          explanation:
            "The distances checked against an exhaustive search over every simple path, and the queue invariant checked on every pop. The second and third counters are the reason the first one is 3,000.",
          alternates: [
            {
              lang: "javascript",
              code: `// Breadth-first search, and the one property that makes it a shortest-path
// algorithm rather than just another way to visit everything.
//
// The property is about the queue, not about the graph: at every moment the
// queue holds nodes from at most two consecutive distances, and never a smaller
// distance after a larger one. That is what "layer by layer" actually means, and
// it is why the first time a node is reached is by a shortest route.
//
// The example checks the distances against an exhaustive search over every
// simple path, and checks the queue invariant on every single pop.

function build(n, edges) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    neighbours[v].push(u);
  }
  return neighbours;
}

/** The distances, and the widest spread of distances the queue ever held. */
function bfsDistances(neighbours, start) {
  const n = neighbours.length;
  const distance = new Array(n).fill(-1);
  distance[start] = 0;
  const queue = [start];
  let head = 0;
  let spread = 1;
  let nonDecreasing = true;
  let previous = 0;
  while (head < queue.length) {
    const v = queue[head];
    head += 1;
    if (distance[v] < previous) nonDecreasing = false;
    previous = distance[v];
    let low = distance[v];
    let high = distance[v];
    for (let i = head; i < queue.length; i += 1) {
      if (distance[queue[i]] < low) low = distance[queue[i]];
      if (distance[queue[i]] > high) high = distance[queue[i]];
    }
    if (head < queue.length && high - low + 1 > spread) spread = high - low + 1;
    for (const u of neighbours[v]) {
      if (distance[u] < 0) {
        distance[u] = distance[v] + 1;
        queue.push(u);
      }
    }
  }
  return [distance, spread, nonDecreasing];
}

/** Every simple path from start to target, keeping the shortest. The definition. */
function shortestByWalking(neighbours, start, target) {
  const n = neighbours.length;
  let best = n + 1;
  const seen = new Array(n).fill(false);

  function step(v, length) {
    if (length >= best) return;
    if (v === target) {
      best = length;
      return;
    }
    seen[v] = true;
    for (const u of neighbours[v]) {
      if (!seen[u]) step(u, length + 1);
    }
    seen[v] = false;
  }

  step(start, 0);
  return best > n ? -1 : best;
}

const show = (values) => "[" + values.join(", ") + "]";
const padEnd = (v, w) => String(v).padEnd(w);
const pad = (v, w) => String(v).padStart(w);

const CASES = [
  [6, [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5]]],
  [7, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]]],
  [5, [[0, 1], [0, 2], [0, 3], [0, 4]]],
  [6, [[0, 1], [1, 2], [3, 4], [4, 5]]],
];

console.log(padEnd("edges", 44) + padEnd("distances", 26) + pad("widest queue spread", 21));
for (const [n, edges] of CASES) {
  const neighbours = build(n, edges);
  const [distance, spread] = bfsDistances(neighbours, 0);
  const shown = "[" + edges.map(([u, v]) => \`\${u}-\${v}\`).join(", ") + "]";
  console.log(padEnd(shown, 44) + padEnd(show(distance), 26) + pad(spread, 21));
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
let distancesOk = 0;
let spreadAtMostTwo = 0;
let alwaysNonDecreasing = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) {
      if (rand(3) === 0) edges.push([u, v]);
    }
  }
  const neighbours = build(n, edges);
  const [distance, spread, nonDecreasing] = bfsDistances(neighbours, 0);
  let good = true;
  for (let target = 0; target < n; target += 1) {
    if (distance[target] !== shortestByWalking(neighbours, 0, target)) good = false;
  }
  if (good) distancesOk += 1;
  if (spread <= 2) spreadAtMostTwo += 1;
  if (nonDecreasing) alwaysNonDecreasing += 1;
}

console.log(\`over \${TRIALS} random graphs on up to 7 nodes:\`);
console.log(\`  distances matched exhaustive search   \${pad(distancesOk, 6)}\`);
console.log(\`  the queue spanned at most two layers  \${pad(spreadAtMostTwo, 6)}\`);
console.log(\`  distances came off in ascending order  \${pad(alwaysNonDecreasing, 6)}\`);
console.log();
console.log("The second and third lines are the proof of the first. A node is only ever");
console.log("given a distance one greater than the node being expanded, and nodes are");
console.log("expanded in non-decreasing order of distance, so the queue can never hold");
console.log("more than two consecutive values at once. That means the first time a node");
console.log("is reached, it is reached from the closest layer that touches it -- which");
console.log("is the definition of a shortest path in edges.");
`,
            },
            {
              lang: "typescript",
              code: `// Breadth-first search, and the one property that makes it a shortest-path
// algorithm rather than just another way to visit everything.
//
// The property is about the queue, not about the graph: at every moment the
// queue holds nodes from at most two consecutive distances, and never a smaller
// distance after a larger one. That is what "layer by layer" actually means, and
// it is why the first time a node is reached is by a shortest route.
//
// The example checks the distances against an exhaustive search over every
// simple path, and checks the queue invariant on every single pop.

type Edge = [number, number];

function build(n: number, edges: Edge[]): number[][] {
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    neighbours[v].push(u);
  }
  return neighbours;
}

/** The distances, and the widest spread of distances the queue ever held. */
function bfsDistances(neighbours: number[][], start: number): [number[], number, boolean] {
  const n = neighbours.length;
  const distance = new Array(n).fill(-1);
  distance[start] = 0;
  const queue = [start];
  let head = 0;
  let spread = 1;
  let nonDecreasing = true;
  let previous = 0;
  while (head < queue.length) {
    const v = queue[head];
    head += 1;
    if (distance[v] < previous) nonDecreasing = false;
    previous = distance[v];
    let low = distance[v];
    let high = distance[v];
    for (let i = head; i < queue.length; i += 1) {
      if (distance[queue[i]] < low) low = distance[queue[i]];
      if (distance[queue[i]] > high) high = distance[queue[i]];
    }
    if (head < queue.length && high - low + 1 > spread) spread = high - low + 1;
    for (const u of neighbours[v]) {
      if (distance[u] < 0) {
        distance[u] = distance[v] + 1;
        queue.push(u);
      }
    }
  }
  return [distance, spread, nonDecreasing];
}

/** Every simple path from start to target, keeping the shortest. The definition. */
function shortestByWalking(neighbours: number[][], start: number, target: number): number {
  const n = neighbours.length;
  let best = n + 1;
  const seen = new Array(n).fill(false);

  function step(v: number, length: number): void {
    if (length >= best) return;
    if (v === target) {
      best = length;
      return;
    }
    seen[v] = true;
    for (const u of neighbours[v]) {
      if (!seen[u]) step(u, length + 1);
    }
    seen[v] = false;
  }

  step(start, 0);
  return best > n ? -1 : best;
}

const show = (values: number[]): string => "[" + values.join(", ") + "]";
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const pad = (v: string | number, w: number): string => String(v).padStart(w);

const CASES: [number, Edge[]][] = [
  [6, [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5]]],
  [7, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]]],
  [5, [[0, 1], [0, 2], [0, 3], [0, 4]]],
  [6, [[0, 1], [1, 2], [3, 4], [4, 5]]],
];

console.log(padEnd("edges", 44) + padEnd("distances", 26) + pad("widest queue spread", 21));
for (const [n, edges] of CASES) {
  const neighbours = build(n, edges);
  const [distance, spread] = bfsDistances(neighbours, 0);
  const shown = "[" + edges.map(([u, v]) => \`\${u}-\${v}\`).join(", ") + "]";
  console.log(padEnd(shown, 44) + padEnd(show(distance), 26) + pad(spread, 21));
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
let distancesOk = 0;
let spreadAtMostTwo = 0;
let alwaysNonDecreasing = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges: Edge[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) {
      if (rand(3) === 0) edges.push([u, v]);
    }
  }
  const neighbours = build(n, edges);
  const [distance, spread, nonDecreasing] = bfsDistances(neighbours, 0);
  let good = true;
  for (let target = 0; target < n; target += 1) {
    if (distance[target] !== shortestByWalking(neighbours, 0, target)) good = false;
  }
  if (good) distancesOk += 1;
  if (spread <= 2) spreadAtMostTwo += 1;
  if (nonDecreasing) alwaysNonDecreasing += 1;
}

console.log(\`over \${TRIALS} random graphs on up to 7 nodes:\`);
console.log(\`  distances matched exhaustive search   \${pad(distancesOk, 6)}\`);
console.log(\`  the queue spanned at most two layers  \${pad(spreadAtMostTwo, 6)}\`);
console.log(\`  distances came off in ascending order  \${pad(alwaysNonDecreasing, 6)}\`);
console.log();
console.log("The second and third lines are the proof of the first. A node is only ever");
console.log("given a distance one greater than the node being expanded, and nodes are");
console.log("expanded in non-decreasing order of distance, so the queue can never hold");
console.log("more than two consecutive values at once. That means the first time a node");
console.log("is reached, it is reached from the closest layer that touches it -- which");
console.log("is the definition of a shortest path in edges.");
`,
            },
            {
              lang: "java",
              code: `// Breadth-first search, and the one property that makes it a shortest-path
// algorithm rather than just another way to visit everything.
//
// The property is about the queue, not about the graph: at every moment the
// queue holds nodes from at most two consecutive distances, and never a smaller
// distance after a larger one. That is what "layer by layer" actually means, and
// it is why the first time a node is reached is by a shortest route.
//
// The example checks the distances against an exhaustive search over every
// simple path, and checks the queue invariant on every single pop.

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

    static int[] lastDistance;
    static int lastSpread;
    static boolean lastNonDecreasing;

    /** The distances, and the widest spread of distances the queue ever held. */
    static void bfsDistances(List<List<Integer>> neighbours, int start) {
        int n = neighbours.size();
        int[] distance = new int[n];
        Arrays.fill(distance, -1);
        distance[start] = 0;
        List<Integer> queue = new ArrayList<>();
        queue.add(start);
        int head = 0;
        int spread = 1;
        boolean nonDecreasing = true;
        int previous = 0;
        while (head < queue.size()) {
            int v = queue.get(head);
            head++;
            if (distance[v] < previous) {
                nonDecreasing = false;
            }
            previous = distance[v];
            int low = distance[v];
            int high = distance[v];
            for (int i = head; i < queue.size(); i++) {
                if (distance[queue.get(i)] < low) {
                    low = distance[queue.get(i)];
                }
                if (distance[queue.get(i)] > high) {
                    high = distance[queue.get(i)];
                }
            }
            if (head < queue.size() && high - low + 1 > spread) {
                spread = high - low + 1;
            }
            for (int u : neighbours.get(v)) {
                if (distance[u] < 0) {
                    distance[u] = distance[v] + 1;
                    queue.add(u);
                }
            }
        }
        lastDistance = distance;
        lastSpread = spread;
        lastNonDecreasing = nonDecreasing;
    }

    static int walkBest;
    static boolean[] walkSeen;

    static void step(List<List<Integer>> neighbours, int target, int v, int length) {
        if (length >= walkBest) {
            return;
        }
        if (v == target) {
            walkBest = length;
            return;
        }
        walkSeen[v] = true;
        for (int u : neighbours.get(v)) {
            if (!walkSeen[u]) {
                step(neighbours, target, u, length + 1);
            }
        }
        walkSeen[v] = false;
    }

    /** Every simple path from start to target, keeping the shortest. The definition. */
    static int shortestByWalking(List<List<Integer>> neighbours, int start, int target) {
        int n = neighbours.size();
        walkBest = n + 1;
        walkSeen = new boolean[n];
        step(neighbours, target, start, 0);
        return walkBest > n ? -1 : walkBest;
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

    // The same linear congruential generator in every language, so the random
    // graphs below are the same graphs whichever translation is run.
    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        int[] sizes = {6, 7, 5, 6};
        int[][][] cases = {
            {{0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}, {4, 5}},
            {{0, 1}, {1, 2}, {2, 3}, {3, 4}, {4, 5}, {5, 6}},
            {{0, 1}, {0, 2}, {0, 3}, {0, 4}},
            {{0, 1}, {1, 2}, {3, 4}, {4, 5}},
        };

        System.out.println(padEnd("edges", 44) + padEnd("distances", 26)
                + pad("widest queue spread", 21));
        for (int c = 0; c < sizes.length; c++) {
            List<List<Integer>> neighbours = build(sizes[c], cases[c]);
            bfsDistances(neighbours, 0);
            StringBuilder shown = new StringBuilder("[");
            for (int i = 0; i < cases[c].length; i++) {
                if (i > 0) {
                    shown.append(", ");
                }
                shown.append(cases[c][i][0]).append("-").append(cases[c][i][1]);
            }
            shown.append("]");
            System.out.println(padEnd(shown.toString(), 44) + padEnd(show(lastDistance), 26)
                    + pad(String.valueOf(lastSpread), 21));
        }
        System.out.println();

        int trials = 3000;
        int distancesOk = 0;
        int spreadAtMostTwo = 0;
        int alwaysNonDecreasing = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(6);
            List<int[]> collected = new ArrayList<>();
            for (int u = 0; u < n; u++) {
                for (int v = u + 1; v < n; v++) {
                    if (rand(3) == 0) {
                        collected.add(new int[] {u, v});
                    }
                }
            }
            int[][] edges = collected.toArray(new int[0][]);
            List<List<Integer>> neighbours = build(n, edges);
            bfsDistances(neighbours, 0);
            int[] distance = lastDistance;
            int spread = lastSpread;
            boolean nonDecreasing = lastNonDecreasing;
            boolean good = true;
            for (int target = 0; target < n; target++) {
                if (distance[target] != shortestByWalking(neighbours, 0, target)) {
                    good = false;
                }
            }
            if (good) {
                distancesOk++;
            }
            if (spread <= 2) {
                spreadAtMostTwo++;
            }
            if (nonDecreasing) {
                alwaysNonDecreasing++;
            }
        }

        System.out.println("over " + trials + " random graphs on up to 7 nodes:");
        System.out.println("  distances matched exhaustive search   " + pad(String.valueOf(distancesOk), 6));
        System.out.println("  the queue spanned at most two layers  " + pad(String.valueOf(spreadAtMostTwo), 6));
        System.out.println("  distances came off in ascending order  " + pad(String.valueOf(alwaysNonDecreasing), 6));
        System.out.println();
        System.out.println("The second and third lines are the proof of the first. A node is only ever");
        System.out.println("given a distance one greater than the node being expanded, and nodes are");
        System.out.println("expanded in non-decreasing order of distance, so the queue can never hold");
        System.out.println("more than two consecutive values at once. That means the first time a node");
        System.out.println("is reached, it is reached from the closest layer that touches it -- which");
        System.out.println("is the definition of a shortest path in edges.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Breadth-first search, and the one property that makes it a shortest-path
// algorithm rather than just another way to visit everything.
//
// The property is about the queue, not about the graph: at every moment the
// queue holds nodes from at most two consecutive distances, and never a smaller
// distance after a larger one. That is what "layer by layer" actually means, and
// it is why the first time a node is reached is by a shortest route.
//
// The example checks the distances against an exhaustive search over every
// simple path, and checks the queue invariant on every single pop.

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

// The distances, and the widest spread of distances the queue ever held.
void bfs_distances(const std::vector<std::vector<int>>& neighbours, int start,
                   std::vector<int>& distance, int& spread, bool& non_decreasing) {
    int n = static_cast<int>(neighbours.size());
    distance.assign(n, -1);
    distance[start] = 0;
    std::vector<int> queue;
    queue.push_back(start);
    size_t head = 0;
    spread = 1;
    non_decreasing = true;
    int previous = 0;
    while (head < queue.size()) {
        int v = queue[head];
        head++;
        if (distance[v] < previous) {
            non_decreasing = false;
        }
        previous = distance[v];
        int low = distance[v];
        int high = distance[v];
        for (size_t i = head; i < queue.size(); i++) {
            if (distance[queue[i]] < low) {
                low = distance[queue[i]];
            }
            if (distance[queue[i]] > high) {
                high = distance[queue[i]];
            }
        }
        if (head < queue.size() && high - low + 1 > spread) {
            spread = high - low + 1;
        }
        for (int u : neighbours[v]) {
            if (distance[u] < 0) {
                distance[u] = distance[v] + 1;
                queue.push_back(u);
            }
        }
    }
}

void step(const std::vector<std::vector<int>>& neighbours, std::vector<char>& seen,
          int& best, int target, int v, int length) {
    if (length >= best) {
        return;
    }
    if (v == target) {
        best = length;
        return;
    }
    seen[v] = 1;
    for (int u : neighbours[v]) {
        if (!seen[u]) {
            step(neighbours, seen, best, target, u, length + 1);
        }
    }
    seen[v] = 0;
}

// Every simple path from start to target, keeping the shortest. The definition.
int shortest_by_walking(const std::vector<std::vector<int>>& neighbours, int start, int target) {
    int n = static_cast<int>(neighbours.size());
    int best = n + 1;
    std::vector<char> seen(n, 0);
    step(neighbours, seen, best, target, start, 0);
    return best > n ? -1 : best;
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

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
long long seed = 1;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    std::vector<int> sizes = {6, 7, 5, 6};
    std::vector<std::vector<Edge>> cases = {
        {{0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}, {4, 5}},
        {{0, 1}, {1, 2}, {2, 3}, {3, 4}, {4, 5}, {5, 6}},
        {{0, 1}, {0, 2}, {0, 3}, {0, 4}},
        {{0, 1}, {1, 2}, {3, 4}, {4, 5}},
    };

    std::cout << std::left << std::setw(44) << "edges" << std::setw(26) << "distances"
              << std::right << std::setw(21) << "widest queue spread" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        std::vector<std::vector<int>> neighbours = build(sizes[c], cases[c]);
        std::vector<int> distance;
        int spread = 0;
        bool non_decreasing = true;
        bfs_distances(neighbours, 0, distance, spread, non_decreasing);
        std::string shown = "[";
        for (size_t i = 0; i < cases[c].size(); i++) {
            if (i > 0) {
                shown += ", ";
            }
            shown += std::to_string(cases[c][i].first) + "-" + std::to_string(cases[c][i].second);
        }
        shown += "]";
        std::cout << std::left << std::setw(44) << shown << std::setw(26) << show(distance)
                  << std::right << std::setw(21) << spread << "\\n";
    }
    std::cout << "\\n";

    int trials = 3000;
    int distances_ok = 0;
    int spread_at_most_two = 0;
    int always_non_decreasing = 0;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(6);
        std::vector<Edge> edges;
        for (int u = 0; u < n; u++) {
            for (int v = u + 1; v < n; v++) {
                if (rand_below(3) == 0) {
                    edges.push_back(Edge(u, v));
                }
            }
        }
        std::vector<std::vector<int>> neighbours = build(n, edges);
        std::vector<int> distance;
        int spread = 0;
        bool non_decreasing = true;
        bfs_distances(neighbours, 0, distance, spread, non_decreasing);
        bool good = true;
        for (int target = 0; target < n; target++) {
            if (distance[target] != shortest_by_walking(neighbours, 0, target)) {
                good = false;
            }
        }
        if (good) {
            distances_ok++;
        }
        if (spread <= 2) {
            spread_at_most_two++;
        }
        if (non_decreasing) {
            always_non_decreasing++;
        }
    }

    std::cout << "over " << trials << " random graphs on up to 7 nodes:\\n";
    std::cout << "  distances matched exhaustive search   " << std::setw(6) << distances_ok << "\\n";
    std::cout << "  the queue spanned at most two layers  " << std::setw(6) << spread_at_most_two << "\\n";
    std::cout << "  distances came off in ascending order  " << std::setw(6) << always_non_decreasing << "\\n";
    std::cout << "\\n";
    std::cout << "The second and third lines are the proof of the first. A node is only ever\\n";
    std::cout << "given a distance one greater than the node being expanded, and nodes are\\n";
    std::cout << "expanded in non-decreasing order of distance, so the queue can never hold\\n";
    std::cout << "more than two consecutive values at once. That means the first time a node\\n";
    std::cout << "is reached, it is reached from the closest layer that touches it -- which\\n";
    std::cout << "is the definition of a shortest path in edges.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Breadth-first search, and the one property that makes it a shortest-path
// algorithm rather than just another way to visit everything.
//
// The property is about the queue, not about the graph: at every moment the
// queue holds nodes from at most two consecutive distances, and never a smaller
// distance after a larger one. That is what "layer by layer" actually means, and
// it is why the first time a node is reached is by a shortest route.
//
// The example checks the distances against an exhaustive search over every
// simple path, and checks the queue invariant on every single pop.

fn build(n: usize, edges: &[(usize, usize)]) -> Vec<Vec<usize>> {
    let mut neighbours = vec![Vec::new(); n];
    for &(u, v) in edges {
        neighbours[u].push(v);
        neighbours[v].push(u);
    }
    neighbours
}

/// The distances, and the widest spread of distances the queue ever held.
fn bfs_distances(neighbours: &[Vec<usize>], start: usize) -> (Vec<i32>, i32, bool) {
    let n = neighbours.len();
    let mut distance = vec![-1i32; n];
    distance[start] = 0;
    let mut queue = vec![start];
    let mut head = 0;
    let mut spread = 1;
    let mut non_decreasing = true;
    let mut previous = 0;
    while head < queue.len() {
        let v = queue[head];
        head += 1;
        if distance[v] < previous {
            non_decreasing = false;
        }
        previous = distance[v];
        let mut low = distance[v];
        let mut high = distance[v];
        for i in head..queue.len() {
            if distance[queue[i]] < low {
                low = distance[queue[i]];
            }
            if distance[queue[i]] > high {
                high = distance[queue[i]];
            }
        }
        if head < queue.len() && high - low + 1 > spread {
            spread = high - low + 1;
        }
        for i in 0..neighbours[v].len() {
            let u = neighbours[v][i];
            if distance[u] < 0 {
                distance[u] = distance[v] + 1;
                queue.push(u);
            }
        }
    }
    (distance, spread, non_decreasing)
}

fn step(
    neighbours: &[Vec<usize>],
    seen: &mut Vec<bool>,
    best: &mut i32,
    target: usize,
    v: usize,
    length: i32,
) {
    if length >= *best {
        return;
    }
    if v == target {
        *best = length;
        return;
    }
    seen[v] = true;
    for i in 0..neighbours[v].len() {
        let u = neighbours[v][i];
        if !seen[u] {
            step(neighbours, seen, best, target, u, length + 1);
        }
    }
    seen[v] = false;
}

/// Every simple path from start to target, keeping the shortest. The definition.
fn shortest_by_walking(neighbours: &[Vec<usize>], start: usize, target: usize) -> i32 {
    let n = neighbours.len() as i32;
    let mut best = n + 1;
    let mut seen = vec![false; neighbours.len()];
    step(neighbours, &mut seen, &mut best, target, start, 0);
    if best > n { -1 } else { best }
}

fn show(values: &[i32]) -> String {
    let parts: Vec<String> = values.iter().map(|v| v.to_string()).collect();
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
    let sizes: Vec<usize> = vec![6, 7, 5, 6];
    let cases: Vec<Vec<(usize, usize)>> = vec![
        vec![(0, 1), (0, 2), (1, 3), (2, 3), (3, 4), (4, 5)],
        vec![(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 6)],
        vec![(0, 1), (0, 2), (0, 3), (0, 4)],
        vec![(0, 1), (1, 2), (3, 4), (4, 5)],
    ];

    println!(
        "{}{}{}",
        pad_right("edges", 44),
        pad_right("distances", 26),
        pad_left("widest queue spread", 21)
    );
    for (c, edges) in cases.iter().enumerate() {
        let neighbours = build(sizes[c], edges);
        let (distance, spread, _) = bfs_distances(&neighbours, 0);
        let parts: Vec<String> = edges.iter().map(|&(u, v)| format!("{}-{}", u, v)).collect();
        let shown = format!("[{}]", parts.join(", "));
        println!(
            "{}{}{}",
            pad_right(&shown, 44),
            pad_right(&show(&distance), 26),
            pad_left(&spread.to_string(), 21)
        );
    }
    println!();

    let mut rng = Rng { seed: 1 };
    let trials = 3000;
    let mut distances_ok = 0;
    let mut spread_at_most_two = 0;
    let mut always_non_decreasing = 0;
    for _ in 0..trials {
        let n = (2 + rng.next(6)) as usize;
        let mut edges: Vec<(usize, usize)> = Vec::new();
        for u in 0..n {
            for v in (u + 1)..n {
                if rng.next(3) == 0 {
                    edges.push((u, v));
                }
            }
        }
        let neighbours = build(n, &edges);
        let (distance, spread, non_decreasing) = bfs_distances(&neighbours, 0);
        let mut good = true;
        for target in 0..n {
            if distance[target] != shortest_by_walking(&neighbours, 0, target) {
                good = false;
            }
        }
        if good {
            distances_ok += 1;
        }
        if spread <= 2 {
            spread_at_most_two += 1;
        }
        if non_decreasing {
            always_non_decreasing += 1;
        }
    }

    println!("over {} random graphs on up to 7 nodes:", trials);
    println!("  distances matched exhaustive search   {}", pad_left(&distances_ok.to_string(), 6));
    println!("  the queue spanned at most two layers  {}", pad_left(&spread_at_most_two.to_string(), 6));
    println!("  distances came off in ascending order  {}", pad_left(&always_non_decreasing.to_string(), 6));
    println!();
    println!("The second and third lines are the proof of the first. A node is only ever");
    println!("given a distance one greater than the node being expanded, and nodes are");
    println!("expanded in non-decreasing order of distance, so the queue can never hold");
    println!("more than two consecutive values at once. That means the first time a node");
    println!("is reached, it is reached from the closest layer that touches it -- which");
    println!("is the definition of a shortest path in edges.");
}
`,
            },
            {
              lang: "go",
              code: `// Breadth-first search, and the one property that makes it a shortest-path
// algorithm rather than just another way to visit everything.
//
// The property is about the queue, not about the graph: at every moment the
// queue holds nodes from at most two consecutive distances, and never a smaller
// distance after a larger one. That is what "layer by layer" actually means, and
// it is why the first time a node is reached is by a shortest route.
//
// The example checks the distances against an exhaustive search over every
// simple path, and checks the queue invariant on every single pop.

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

// The distances, and the widest spread of distances the queue ever held.
func bfsDistances(neighbours [][]int, start int) ([]int, int, bool) {
	n := len(neighbours)
	distance := make([]int, n)
	for i := range distance {
		distance[i] = -1
	}
	distance[start] = 0
	queue := []int{start}
	head := 0
	spread := 1
	nonDecreasing := true
	previous := 0
	for head < len(queue) {
		v := queue[head]
		head++
		if distance[v] < previous {
			nonDecreasing = false
		}
		previous = distance[v]
		low := distance[v]
		high := distance[v]
		for i := head; i < len(queue); i++ {
			if distance[queue[i]] < low {
				low = distance[queue[i]]
			}
			if distance[queue[i]] > high {
				high = distance[queue[i]]
			}
		}
		if head < len(queue) && high-low+1 > spread {
			spread = high - low + 1
		}
		for _, u := range neighbours[v] {
			if distance[u] < 0 {
				distance[u] = distance[v] + 1
				queue = append(queue, u)
			}
		}
	}
	return distance, spread, nonDecreasing
}

// Every simple path from start to target, keeping the shortest. The definition.
func shortestByWalking(neighbours [][]int, start, target int) int {
	n := len(neighbours)
	best := n + 1
	seen := make([]bool, n)
	var step func(v, length int)
	step = func(v, length int) {
		if length >= best {
			return
		}
		if v == target {
			best = length
			return
		}
		seen[v] = true
		for _, u := range neighbours[v] {
			if !seen[u] {
				step(u, length+1)
			}
		}
		seen[v] = false
	}
	step(start, 0)
	if best > n {
		return -1
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

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	sizes := []int{6, 7, 5, 6}
	cases := [][]edge{
		{{0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}, {4, 5}},
		{{0, 1}, {1, 2}, {2, 3}, {3, 4}, {4, 5}, {5, 6}},
		{{0, 1}, {0, 2}, {0, 3}, {0, 4}},
		{{0, 1}, {1, 2}, {3, 4}, {4, 5}},
	}

	fmt.Printf("%-44s%-26s%21s\\n", "edges", "distances", "widest queue spread")
	for c, edges := range cases {
		neighbours := build(sizes[c], edges)
		distance, spread, _ := bfsDistances(neighbours, 0)
		parts := make([]string, len(edges))
		for i, e := range edges {
			parts[i] = fmt.Sprintf("%d-%d", e.from, e.to)
		}
		shown := "[" + strings.Join(parts, ", ") + "]"
		fmt.Printf("%-44s%-26s%21d\\n", shown, show(distance), spread)
	}
	fmt.Println()

	trials := 3000
	distancesOk := 0
	spreadAtMostTwo := 0
	alwaysNonDecreasing := 0
	for t := 0; t < trials; t++ {
		n := 2 + rand(6)
		edges := []edge{}
		for u := 0; u < n; u++ {
			for v := u + 1; v < n; v++ {
				if rand(3) == 0 {
					edges = append(edges, edge{u, v})
				}
			}
		}
		neighbours := build(n, edges)
		distance, spread, nonDecreasing := bfsDistances(neighbours, 0)
		good := true
		for target := 0; target < n; target++ {
			if distance[target] != shortestByWalking(neighbours, 0, target) {
				good = false
			}
		}
		if good {
			distancesOk++
		}
		if spread <= 2 {
			spreadAtMostTwo++
		}
		if nonDecreasing {
			alwaysNonDecreasing++
		}
	}

	fmt.Printf("over %d random graphs on up to 7 nodes:\\n", trials)
	fmt.Printf("  distances matched exhaustive search   %6d\\n", distancesOk)
	fmt.Printf("  the queue spanned at most two layers  %6d\\n", spreadAtMostTwo)
	fmt.Printf("  distances came off in ascending order  %6d\\n", alwaysNonDecreasing)
	fmt.Println()
	fmt.Println("The second and third lines are the proof of the first. A node is only ever")
	fmt.Println("given a distance one greater than the node being expanded, and nodes are")
	fmt.Println("expanded in non-decreasing order of distance, so the queue can never hold")
	fmt.Println("more than two consecutive values at once. That means the first time a node")
	fmt.Println("is reached, it is reached from the closest layer that touches it -- which")
	fmt.Println("is the definition of a shortest path in edges.")
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "graph-bfs-shortest",
        kind: "graph",
        algorithm: "bfs",
        title: "One layer finished before the next begins",
        lockAlgorithm: true,
      },
      pitfalls: [
        {
          title: "The layer argument assumes every edge costs one",
          body: "The queue is sorted by distance only because each step adds exactly one. Give edges different weights and the queue is no longer sorted by cost, and the first arrival is no longer the cheapest. This is the same fact from the vocabulary lesson, seen from the algorithm's side: BFS is exact on unweighted graphs and exactly wrong on weighted ones.",
        },
        {
          title: "\"Visits neighbours first\" is a description, not the reason",
          body: "The property that makes the algorithm correct is that the queue never hands back a smaller distance after a larger one. It is worth checking in code rather than trusting: an implementation that pushes a node twice, or assigns a distance on pop instead of on push, can break it while still looking breadth-first.",
        },
      ],
    },
    {
      id: "the-route-and-the-set",
      heading: "The route, and the whole set of starts",
      body: [
        "The bare search prints distances. Two things are asked of it constantly that it does not print, and both are cheap.",
        "**The route.** Record, for each node, the node it was first reached from, and walk that array backwards from the target. A node has exactly one first-discoverer, so the links form a tree, and the walk back is a shortest path in reverse. Over 3,000 graphs every reconstructed route was a real sequence of edges from the start to the target, and its length matched the distance the search reported \u2014 3,000 and 3,000.",
        "**The distance from a whole set.** \"How far is each cell from the nearest exit\", \"which office is nearest to each house\", \"how long until every orange has rotted\" are all one question: distance from a set of sources rather than one. The obvious answer is to run a search from each source and take the smallest. The right answer costs nothing: put every source in the queue at distance zero and run the search unchanged.",
        "That works for exactly the reason the layer argument gave. The invariant is that the queue is in ascending order of distance \u2014 and a queue full of zeroes is in ascending order. Nothing else in the algorithm knows or cares how many sources there were. Measured over 3,000 graphs, the one-pass version agreed with the one-search-per-source version every time, running 3,000 searches instead of 5,076.",
        "These two extensions cover a large share of what breadth-first search is actually asked to do in practice, and neither changes the loop.",
      ],
      examples: [
        {
          id: "parents-and-many-sources",
          title: "One array for the route, and one queue for every source at once",
          lang: "python",
          code: `# Two things a breadth-first search is asked for that it does not print by
# itself: the route, and the distance from a whole set of starting points.
#
# The route costs one array. Record, for each node, the node it was first
# reached from, then walk backwards from the target. The distance from a set
# costs nothing at all -- put every source in the queue at distance zero and
# run the search unchanged.
#
# The example builds both, and scores the multi-source version against the
# obvious alternative: run a separate search from each source and take the
# smallest. Same answers, one pass instead of many.


def build(n, edges):
    neighbours = [[] for _ in range(n)]
    for u, v in edges:
        neighbours[u].append(v)
        neighbours[v].append(u)
    return neighbours


def bfs_with_parents(neighbours, start):
    """Distances, plus the node each one was first reached from."""
    n = len(neighbours)
    distance = [-1] * n
    parent = [-1] * n
    distance[start] = 0
    queue = [start]
    head = 0
    while head < len(queue):
        v = queue[head]
        head += 1
        for u in neighbours[v]:
            if distance[u] < 0:
                distance[u] = distance[v] + 1
                parent[u] = v
                queue.append(u)
    return distance, parent


def route(parent, distance, target):
    """Walk the parent links back, then reverse. Empty when unreachable."""
    if distance[target] < 0:
        return []
    backwards = []
    at = target
    while at >= 0:
        backwards.append(at)
        at = parent[at]
    forwards = []
    for i in range(len(backwards) - 1, -1, -1):
        forwards.append(backwards[i])
    return forwards


def route_is_valid(neighbours, path, start, target):
    """Every consecutive pair must be a real edge, and the ends must match."""
    if len(path) == 0:
        return False
    if path[0] != start or path[len(path) - 1] != target:
        return False
    for i in range(len(path) - 1):
        joined = False
        for u in neighbours[path[i]]:
            if u == path[i + 1]:
                joined = True
        if not joined:
            return False
    return True


def multi_source(neighbours, sources):
    """Every source starts at distance zero, in the same queue."""
    n = len(neighbours)
    distance = [-1] * n
    queue = []
    for s in sources:
        if distance[s] < 0:
            distance[s] = 0
            queue.append(s)
    head = 0
    while head < len(queue):
        v = queue[head]
        head += 1
        for u in neighbours[v]:
            if distance[u] < 0:
                distance[u] = distance[v] + 1
                queue.append(u)
    return distance


def nearest_source_one_at_a_time(neighbours, sources):
    """One search per source, then the smallest. Same answer, more work."""
    n = len(neighbours)
    best = [-1] * n
    for s in sources:
        distance, _ = bfs_with_parents(neighbours, s)
        for v in range(n):
            if distance[v] >= 0 and (best[v] < 0 or distance[v] < best[v]):
                best[v] = distance[v]
    return best


def same(a, b):
    if len(a) != len(b):
        return False
    for i in range(len(a)):
        if a[i] != b[i]:
            return False
    return True


def show(values):
    return "[" + ", ".join(str(v) for v in values) + "]"


CASES = [
    (6, [(0, 1), (0, 2), (1, 3), (2, 3), (3, 4), (4, 5)], [0, 5]),
    (7, [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 6)], [0, 6]),
    (6, [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (0, 5)], [0, 3]),
]

print(f"{'edges':<44}{'route 0 to last':<24}{'sources':<10}{'from the set'}")
for n, edges, sources in CASES:
    neighbours = build(n, edges)
    distance, parent = bfs_with_parents(neighbours, 0)
    shown = "[" + ", ".join(f"{u}-{v}" for u, v in edges) + "]"
    print(f"{shown:<44}{show(route(parent, distance, n - 1)):<24}"
          f"{show(sources):<10}{show(multi_source(neighbours, sources))}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
routes_valid = 0
routes_shortest = 0
multi_matches = 0
scans_multi = 0
scans_separate = 0
for _ in range(TRIALS):
    n = 2 + rand(6)
    edges = []
    for u in range(n):
        for v in range(u + 1, n):
            if rand(3) == 0:
                edges.append((u, v))
    neighbours = build(n, edges)
    distance, parent = bfs_with_parents(neighbours, 0)
    good_valid = True
    good_length = True
    for target in range(n):
        path = route(parent, distance, target)
        if distance[target] < 0:
            if len(path) != 0:
                good_valid = False
            continue
        if not route_is_valid(neighbours, path, 0, target):
            good_valid = False
        if len(path) - 1 != distance[target]:
            good_length = False
    if good_valid:
        routes_valid += 1
    if good_length:
        routes_shortest += 1
    sources = []
    for v in range(n):
        if rand(3) == 0:
            sources.append(v)
    if len(sources) == 0:
        sources.append(0)
    if same(multi_source(neighbours, sources),
            nearest_source_one_at_a_time(neighbours, sources)):
        multi_matches += 1
    scans_multi += 1
    scans_separate += len(sources)

print(f"over {TRIALS} random graphs on up to 7 nodes:")
print(f"  every reconstructed route was real     {routes_valid:>6}")
print(f"  and was as short as the distance said  {routes_shortest:>6}")
print(f"  multi-source agreed with one at a time {multi_matches:>6}")
print(f"  searches run, one pass against many    {scans_multi:>6}{scans_separate:>7}")
print()
print("The parent array is the whole trick for the route: a node has exactly one")
print("first-discoverer, so the links form a tree and walking back from any node")
print("gives a shortest path in reverse. The multi-source trick is smaller still")
print("-- seeding the queue with every source at distance zero is already the")
print("right algorithm, because the invariant the search relies on is about the")
print("queue being sorted by distance, and a queue of zeroes is sorted.")
`,
          output: `edges                                       route 0 to last         sources   from the set
[0-1, 0-2, 1-3, 2-3, 3-4, 4-5]              [0, 1, 3, 4, 5]         [0, 5]    [0, 1, 1, 2, 1, 0]
[0-1, 1-2, 2-3, 3-4, 4-5, 5-6]              [0, 1, 2, 3, 4, 5, 6]   [0, 6]    [0, 1, 2, 3, 2, 1, 0]
[0-1, 1-2, 2-3, 3-4, 4-5, 0-5]              [0, 5]                  [0, 3]    [0, 1, 1, 0, 1, 1]

over 3000 random graphs on up to 7 nodes:
  every reconstructed route was real       3000
  and was as short as the distance said    3000
  multi-source agreed with one at a time   3000
  searches run, one pass against many      3000   5076

The parent array is the whole trick for the route: a node has exactly one
first-discoverer, so the links form a tree and walking back from any node
gives a shortest path in reverse. The multi-source trick is smaller still
-- seeding the queue with every source at distance zero is already the
right algorithm, because the invariant the search relies on is about the
queue being sorted by distance, and a queue of zeroes is sorted.`,
          explanation:
            "The parent array turned into a route and validated edge by edge, and the multi-source search scored against running one search per source. Both are the same loop with one line added.",
          alternates: [
            {
              lang: "javascript",
              code: `// Two things a breadth-first search is asked for that it does not print by
// itself: the route, and the distance from a whole set of starting points.
//
// The route costs one array. Record, for each node, the node it was first
// reached from, then walk backwards from the target. The distance from a set
// costs nothing at all -- put every source in the queue at distance zero and
// run the search unchanged.
//
// The example builds both, and scores the multi-source version against the
// obvious alternative: run a separate search from each source and take the
// smallest. Same answers, one pass instead of many.

function build(n, edges) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    neighbours[v].push(u);
  }
  return neighbours;
}

/** Distances, plus the node each one was first reached from. */
function bfsWithParents(neighbours, start) {
  const n = neighbours.length;
  const distance = new Array(n).fill(-1);
  const parent = new Array(n).fill(-1);
  distance[start] = 0;
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const v = queue[head];
    head += 1;
    for (const u of neighbours[v]) {
      if (distance[u] < 0) {
        distance[u] = distance[v] + 1;
        parent[u] = v;
        queue.push(u);
      }
    }
  }
  return [distance, parent];
}

/** Walk the parent links back, then reverse. Empty when unreachable. */
function route(parent, distance, target) {
  if (distance[target] < 0) return [];
  const backwards = [];
  let at = target;
  while (at >= 0) {
    backwards.push(at);
    at = parent[at];
  }
  const forwards = [];
  for (let i = backwards.length - 1; i >= 0; i -= 1) forwards.push(backwards[i]);
  return forwards;
}

/** Every consecutive pair must be a real edge, and the ends must match. */
function routeIsValid(neighbours, path, start, target) {
  if (path.length === 0) return false;
  if (path[0] !== start || path[path.length - 1] !== target) return false;
  for (let i = 0; i < path.length - 1; i += 1) {
    let joined = false;
    for (const u of neighbours[path[i]]) {
      if (u === path[i + 1]) joined = true;
    }
    if (!joined) return false;
  }
  return true;
}

/** Every source starts at distance zero, in the same queue. */
function multiSource(neighbours, sources) {
  const n = neighbours.length;
  const distance = new Array(n).fill(-1);
  const queue = [];
  for (const s of sources) {
    if (distance[s] < 0) {
      distance[s] = 0;
      queue.push(s);
    }
  }
  let head = 0;
  while (head < queue.length) {
    const v = queue[head];
    head += 1;
    for (const u of neighbours[v]) {
      if (distance[u] < 0) {
        distance[u] = distance[v] + 1;
        queue.push(u);
      }
    }
  }
  return distance;
}

/** One search per source, then the smallest. Same answer, more work. */
function nearestSourceOneAtATime(neighbours, sources) {
  const n = neighbours.length;
  const best = new Array(n).fill(-1);
  for (const s of sources) {
    const [distance] = bfsWithParents(neighbours, s);
    for (let v = 0; v < n; v += 1) {
      if (distance[v] >= 0 && (best[v] < 0 || distance[v] < best[v])) best[v] = distance[v];
    }
  }
  return best;
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

const CASES = [
  [6, [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5]], [0, 5]],
  [7, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]], [0, 6]],
  [6, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [0, 5]], [0, 3]],
];

console.log(padEnd("edges", 44) + padEnd("route 0 to last", 24) + padEnd("sources", 10) + "from the set");
for (const [n, edges, sources] of CASES) {
  const neighbours = build(n, edges);
  const [distance, parent] = bfsWithParents(neighbours, 0);
  const shown = "[" + edges.map(([u, v]) => \`\${u}-\${v}\`).join(", ") + "]";
  console.log(
    padEnd(shown, 44) +
      padEnd(show(route(parent, distance, n - 1)), 24) +
      padEnd(show(sources), 10) +
      show(multiSource(neighbours, sources))
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
let routesValid = 0;
let routesShortest = 0;
let multiMatches = 0;
let scansMulti = 0;
let scansSeparate = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) {
      if (rand(3) === 0) edges.push([u, v]);
    }
  }
  const neighbours = build(n, edges);
  const [distance, parent] = bfsWithParents(neighbours, 0);
  let goodValid = true;
  let goodLength = true;
  for (let target = 0; target < n; target += 1) {
    const path = route(parent, distance, target);
    if (distance[target] < 0) {
      if (path.length !== 0) goodValid = false;
      continue;
    }
    if (!routeIsValid(neighbours, path, 0, target)) goodValid = false;
    if (path.length - 1 !== distance[target]) goodLength = false;
  }
  if (goodValid) routesValid += 1;
  if (goodLength) routesShortest += 1;
  const sources = [];
  for (let v = 0; v < n; v += 1) {
    if (rand(3) === 0) sources.push(v);
  }
  if (sources.length === 0) sources.push(0);
  if (same(multiSource(neighbours, sources), nearestSourceOneAtATime(neighbours, sources))) {
    multiMatches += 1;
  }
  scansMulti += 1;
  scansSeparate += sources.length;
}

console.log(\`over \${TRIALS} random graphs on up to 7 nodes:\`);
console.log(\`  every reconstructed route was real     \${pad(routesValid, 6)}\`);
console.log(\`  and was as short as the distance said  \${pad(routesShortest, 6)}\`);
console.log(\`  multi-source agreed with one at a time \${pad(multiMatches, 6)}\`);
console.log(\`  searches run, one pass against many    \${pad(scansMulti, 6)}\${pad(scansSeparate, 7)}\`);
console.log();
console.log("The parent array is the whole trick for the route: a node has exactly one");
console.log("first-discoverer, so the links form a tree and walking back from any node");
console.log("gives a shortest path in reverse. The multi-source trick is smaller still");
console.log("-- seeding the queue with every source at distance zero is already the");
console.log("right algorithm, because the invariant the search relies on is about the");
console.log("queue being sorted by distance, and a queue of zeroes is sorted.");
`,
            },
            {
              lang: "typescript",
              code: `// Two things a breadth-first search is asked for that it does not print by
// itself: the route, and the distance from a whole set of starting points.
//
// The route costs one array. Record, for each node, the node it was first
// reached from, then walk backwards from the target. The distance from a set
// costs nothing at all -- put every source in the queue at distance zero and
// run the search unchanged.
//
// The example builds both, and scores the multi-source version against the
// obvious alternative: run a separate search from each source and take the
// smallest. Same answers, one pass instead of many.

type Edge = [number, number];

function build(n: number, edges: Edge[]): number[][] {
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    neighbours[v].push(u);
  }
  return neighbours;
}

/** Distances, plus the node each one was first reached from. */
function bfsWithParents(neighbours: number[][], start: number): [number[], number[]] {
  const n = neighbours.length;
  const distance = new Array(n).fill(-1);
  const parent = new Array(n).fill(-1);
  distance[start] = 0;
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const v = queue[head];
    head += 1;
    for (const u of neighbours[v]) {
      if (distance[u] < 0) {
        distance[u] = distance[v] + 1;
        parent[u] = v;
        queue.push(u);
      }
    }
  }
  return [distance, parent];
}

/** Walk the parent links back, then reverse. Empty when unreachable. */
function route(parent: number[], distance: number[], target: number): number[] {
  if (distance[target] < 0) return [];
  const backwards: number[] = [];
  let at = target;
  while (at >= 0) {
    backwards.push(at);
    at = parent[at];
  }
  const forwards: number[] = [];
  for (let i = backwards.length - 1; i >= 0; i -= 1) forwards.push(backwards[i]);
  return forwards;
}

/** Every consecutive pair must be a real edge, and the ends must match. */
function routeIsValid(neighbours: number[][], path: number[], start: number, target: number): boolean {
  if (path.length === 0) return false;
  if (path[0] !== start || path[path.length - 1] !== target) return false;
  for (let i = 0; i < path.length - 1; i += 1) {
    let joined = false;
    for (const u of neighbours[path[i]]) {
      if (u === path[i + 1]) joined = true;
    }
    if (!joined) return false;
  }
  return true;
}

/** Every source starts at distance zero, in the same queue. */
function multiSource(neighbours: number[][], sources: number[]): number[] {
  const n = neighbours.length;
  const distance = new Array(n).fill(-1);
  const queue: number[] = [];
  for (const s of sources) {
    if (distance[s] < 0) {
      distance[s] = 0;
      queue.push(s);
    }
  }
  let head = 0;
  while (head < queue.length) {
    const v = queue[head];
    head += 1;
    for (const u of neighbours[v]) {
      if (distance[u] < 0) {
        distance[u] = distance[v] + 1;
        queue.push(u);
      }
    }
  }
  return distance;
}

/** One search per source, then the smallest. Same answer, more work. */
function nearestSourceOneAtATime(neighbours: number[][], sources: number[]): number[] {
  const n = neighbours.length;
  const best = new Array(n).fill(-1);
  for (const s of sources) {
    const [distance] = bfsWithParents(neighbours, s);
    for (let v = 0; v < n; v += 1) {
      if (distance[v] >= 0 && (best[v] < 0 || distance[v] < best[v])) best[v] = distance[v];
    }
  }
  return best;
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

const CASES: [number, Edge[], number[]][] = [
  [6, [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5]], [0, 5]],
  [7, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]], [0, 6]],
  [6, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [0, 5]], [0, 3]],
];

console.log(padEnd("edges", 44) + padEnd("route 0 to last", 24) + padEnd("sources", 10) + "from the set");
for (const [n, edges, sources] of CASES) {
  const neighbours = build(n, edges);
  const [distance, parent] = bfsWithParents(neighbours, 0);
  const shown = "[" + edges.map(([u, v]) => \`\${u}-\${v}\`).join(", ") + "]";
  console.log(
    padEnd(shown, 44) +
      padEnd(show(route(parent, distance, n - 1)), 24) +
      padEnd(show(sources), 10) +
      show(multiSource(neighbours, sources))
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
let routesValid = 0;
let routesShortest = 0;
let multiMatches = 0;
let scansMulti = 0;
let scansSeparate = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges: Edge[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) {
      if (rand(3) === 0) edges.push([u, v]);
    }
  }
  const neighbours = build(n, edges);
  const [distance, parent] = bfsWithParents(neighbours, 0);
  let goodValid = true;
  let goodLength = true;
  for (let target = 0; target < n; target += 1) {
    const path = route(parent, distance, target);
    if (distance[target] < 0) {
      if (path.length !== 0) goodValid = false;
      continue;
    }
    if (!routeIsValid(neighbours, path, 0, target)) goodValid = false;
    if (path.length - 1 !== distance[target]) goodLength = false;
  }
  if (goodValid) routesValid += 1;
  if (goodLength) routesShortest += 1;
  const sources: number[] = [];
  for (let v = 0; v < n; v += 1) {
    if (rand(3) === 0) sources.push(v);
  }
  if (sources.length === 0) sources.push(0);
  if (same(multiSource(neighbours, sources), nearestSourceOneAtATime(neighbours, sources))) {
    multiMatches += 1;
  }
  scansMulti += 1;
  scansSeparate += sources.length;
}

console.log(\`over \${TRIALS} random graphs on up to 7 nodes:\`);
console.log(\`  every reconstructed route was real     \${pad(routesValid, 6)}\`);
console.log(\`  and was as short as the distance said  \${pad(routesShortest, 6)}\`);
console.log(\`  multi-source agreed with one at a time \${pad(multiMatches, 6)}\`);
console.log(\`  searches run, one pass against many    \${pad(scansMulti, 6)}\${pad(scansSeparate, 7)}\`);
console.log();
console.log("The parent array is the whole trick for the route: a node has exactly one");
console.log("first-discoverer, so the links form a tree and walking back from any node");
console.log("gives a shortest path in reverse. The multi-source trick is smaller still");
console.log("-- seeding the queue with every source at distance zero is already the");
console.log("right algorithm, because the invariant the search relies on is about the");
console.log("queue being sorted by distance, and a queue of zeroes is sorted.");
`,
            },
            {
              lang: "java",
              code: `// Two things a breadth-first search is asked for that it does not print by
// itself: the route, and the distance from a whole set of starting points.
//
// The route costs one array. Record, for each node, the node it was first
// reached from, then walk backwards from the target. The distance from a set
// costs nothing at all -- put every source in the queue at distance zero and
// run the search unchanged.
//
// The example builds both, and scores the multi-source version against the
// obvious alternative: run a separate search from each source and take the
// smallest. Same answers, one pass instead of many.

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

    static int[] lastDistance;
    static int[] lastParent;

    /** Distances, plus the node each one was first reached from. */
    static void bfsWithParents(List<List<Integer>> neighbours, int start) {
        int n = neighbours.size();
        int[] distance = new int[n];
        int[] parent = new int[n];
        Arrays.fill(distance, -1);
        Arrays.fill(parent, -1);
        distance[start] = 0;
        List<Integer> queue = new ArrayList<>();
        queue.add(start);
        int head = 0;
        while (head < queue.size()) {
            int v = queue.get(head);
            head++;
            for (int u : neighbours.get(v)) {
                if (distance[u] < 0) {
                    distance[u] = distance[v] + 1;
                    parent[u] = v;
                    queue.add(u);
                }
            }
        }
        lastDistance = distance;
        lastParent = parent;
    }

    /** Walk the parent links back, then reverse. Empty when unreachable. */
    static List<Integer> route(int[] parent, int[] distance, int target) {
        List<Integer> forwards = new ArrayList<>();
        if (distance[target] < 0) {
            return forwards;
        }
        List<Integer> backwards = new ArrayList<>();
        int at = target;
        while (at >= 0) {
            backwards.add(at);
            at = parent[at];
        }
        for (int i = backwards.size() - 1; i >= 0; i--) {
            forwards.add(backwards.get(i));
        }
        return forwards;
    }

    /** Every consecutive pair must be a real edge, and the ends must match. */
    static boolean routeIsValid(List<List<Integer>> neighbours, List<Integer> path,
                                int start, int target) {
        if (path.isEmpty()) {
            return false;
        }
        if (path.get(0) != start || path.get(path.size() - 1) != target) {
            return false;
        }
        for (int i = 0; i < path.size() - 1; i++) {
            boolean joined = false;
            for (int u : neighbours.get(path.get(i))) {
                if (u == path.get(i + 1)) {
                    joined = true;
                }
            }
            if (!joined) {
                return false;
            }
        }
        return true;
    }

    /** Every source starts at distance zero, in the same queue. */
    static int[] multiSource(List<List<Integer>> neighbours, List<Integer> sources) {
        int n = neighbours.size();
        int[] distance = new int[n];
        Arrays.fill(distance, -1);
        List<Integer> queue = new ArrayList<>();
        for (int s : sources) {
            if (distance[s] < 0) {
                distance[s] = 0;
                queue.add(s);
            }
        }
        int head = 0;
        while (head < queue.size()) {
            int v = queue.get(head);
            head++;
            for (int u : neighbours.get(v)) {
                if (distance[u] < 0) {
                    distance[u] = distance[v] + 1;
                    queue.add(u);
                }
            }
        }
        return distance;
    }

    /** One search per source, then the smallest. Same answer, more work. */
    static int[] nearestSourceOneAtATime(List<List<Integer>> neighbours, List<Integer> sources) {
        int n = neighbours.size();
        int[] best = new int[n];
        Arrays.fill(best, -1);
        for (int s : sources) {
            bfsWithParents(neighbours, s);
            int[] distance = lastDistance;
            for (int v = 0; v < n; v++) {
                if (distance[v] >= 0 && (best[v] < 0 || distance[v] < best[v])) {
                    best[v] = distance[v];
                }
            }
        }
        return best;
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

    // The same linear congruential generator in every language, so the random
    // graphs below are the same graphs whichever translation is run.
    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        int[] sizes = {6, 7, 6};
        int[][][] cases = {
            {{0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}, {4, 5}},
            {{0, 1}, {1, 2}, {2, 3}, {3, 4}, {4, 5}, {5, 6}},
            {{0, 1}, {1, 2}, {2, 3}, {3, 4}, {4, 5}, {0, 5}},
        };
        int[][] sourceSets = {{0, 5}, {0, 6}, {0, 3}};

        System.out.println(padEnd("edges", 44) + padEnd("route 0 to last", 24)
                + padEnd("sources", 10) + "from the set");
        for (int c = 0; c < sizes.length; c++) {
            int n = sizes[c];
            List<List<Integer>> neighbours = build(n, cases[c]);
            bfsWithParents(neighbours, 0);
            List<Integer> sources = new ArrayList<>();
            for (int s : sourceSets[c]) {
                sources.add(s);
            }
            StringBuilder shown = new StringBuilder("[");
            for (int i = 0; i < cases[c].length; i++) {
                if (i > 0) {
                    shown.append(", ");
                }
                shown.append(cases[c][i][0]).append("-").append(cases[c][i][1]);
            }
            shown.append("]");
            System.out.println(padEnd(shown.toString(), 44)
                    + padEnd(show(route(lastParent, lastDistance, n - 1)), 24)
                    + padEnd(show(sources), 10)
                    + show(multiSource(neighbours, sources)));
        }
        System.out.println();

        int trials = 3000;
        int routesValid = 0;
        int routesShortest = 0;
        int multiMatches = 0;
        int scansMulti = 0;
        int scansSeparate = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(6);
            List<int[]> collected = new ArrayList<>();
            for (int u = 0; u < n; u++) {
                for (int v = u + 1; v < n; v++) {
                    if (rand(3) == 0) {
                        collected.add(new int[] {u, v});
                    }
                }
            }
            int[][] edges = collected.toArray(new int[0][]);
            List<List<Integer>> neighbours = build(n, edges);
            bfsWithParents(neighbours, 0);
            int[] distance = lastDistance;
            int[] parent = lastParent;
            boolean goodValid = true;
            boolean goodLength = true;
            for (int target = 0; target < n; target++) {
                List<Integer> path = route(parent, distance, target);
                if (distance[target] < 0) {
                    if (!path.isEmpty()) {
                        goodValid = false;
                    }
                    continue;
                }
                if (!routeIsValid(neighbours, path, 0, target)) {
                    goodValid = false;
                }
                if (path.size() - 1 != distance[target]) {
                    goodLength = false;
                }
            }
            if (goodValid) {
                routesValid++;
            }
            if (goodLength) {
                routesShortest++;
            }
            List<Integer> sources = new ArrayList<>();
            for (int v = 0; v < n; v++) {
                if (rand(3) == 0) {
                    sources.add(v);
                }
            }
            if (sources.isEmpty()) {
                sources.add(0);
            }
            if (same(multiSource(neighbours, sources),
                    nearestSourceOneAtATime(neighbours, sources))) {
                multiMatches++;
            }
            scansMulti++;
            scansSeparate += sources.size();
        }

        System.out.println("over " + trials + " random graphs on up to 7 nodes:");
        System.out.println("  every reconstructed route was real     " + pad(String.valueOf(routesValid), 6));
        System.out.println("  and was as short as the distance said  " + pad(String.valueOf(routesShortest), 6));
        System.out.println("  multi-source agreed with one at a time " + pad(String.valueOf(multiMatches), 6));
        System.out.println("  searches run, one pass against many    " + pad(String.valueOf(scansMulti), 6)
                + pad(String.valueOf(scansSeparate), 7));
        System.out.println();
        System.out.println("The parent array is the whole trick for the route: a node has exactly one");
        System.out.println("first-discoverer, so the links form a tree and walking back from any node");
        System.out.println("gives a shortest path in reverse. The multi-source trick is smaller still");
        System.out.println("-- seeding the queue with every source at distance zero is already the");
        System.out.println("right algorithm, because the invariant the search relies on is about the");
        System.out.println("queue being sorted by distance, and a queue of zeroes is sorted.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Two things a breadth-first search is asked for that it does not print by
// itself: the route, and the distance from a whole set of starting points.
//
// The route costs one array. Record, for each node, the node it was first
// reached from, then walk backwards from the target. The distance from a set
// costs nothing at all -- put every source in the queue at distance zero and
// run the search unchanged.
//
// The example builds both, and scores the multi-source version against the
// obvious alternative: run a separate search from each source and take the
// smallest. Same answers, one pass instead of many.

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

// Distances, plus the node each one was first reached from.
void bfs_with_parents(const std::vector<std::vector<int>>& neighbours, int start,
                      std::vector<int>& distance, std::vector<int>& parent) {
    int n = static_cast<int>(neighbours.size());
    distance.assign(n, -1);
    parent.assign(n, -1);
    distance[start] = 0;
    std::vector<int> queue;
    queue.push_back(start);
    size_t head = 0;
    while (head < queue.size()) {
        int v = queue[head];
        head++;
        for (int u : neighbours[v]) {
            if (distance[u] < 0) {
                distance[u] = distance[v] + 1;
                parent[u] = v;
                queue.push_back(u);
            }
        }
    }
}

// Walk the parent links back, then reverse. Empty when unreachable.
std::vector<int> route(const std::vector<int>& parent, const std::vector<int>& distance, int target) {
    std::vector<int> forwards;
    if (distance[target] < 0) {
        return forwards;
    }
    std::vector<int> backwards;
    int at = target;
    while (at >= 0) {
        backwards.push_back(at);
        at = parent[at];
    }
    for (int i = static_cast<int>(backwards.size()) - 1; i >= 0; i--) {
        forwards.push_back(backwards[i]);
    }
    return forwards;
}

// Every consecutive pair must be a real edge, and the ends must match.
bool route_is_valid(const std::vector<std::vector<int>>& neighbours, const std::vector<int>& path,
                    int start, int target) {
    if (path.empty()) {
        return false;
    }
    if (path[0] != start || path[path.size() - 1] != target) {
        return false;
    }
    for (size_t i = 0; i + 1 < path.size(); i++) {
        bool joined = false;
        for (int u : neighbours[path[i]]) {
            if (u == path[i + 1]) {
                joined = true;
            }
        }
        if (!joined) {
            return false;
        }
    }
    return true;
}

// Every source starts at distance zero, in the same queue.
std::vector<int> multi_source(const std::vector<std::vector<int>>& neighbours,
                              const std::vector<int>& sources) {
    int n = static_cast<int>(neighbours.size());
    std::vector<int> distance(n, -1);
    std::vector<int> queue;
    for (int s : sources) {
        if (distance[s] < 0) {
            distance[s] = 0;
            queue.push_back(s);
        }
    }
    size_t head = 0;
    while (head < queue.size()) {
        int v = queue[head];
        head++;
        for (int u : neighbours[v]) {
            if (distance[u] < 0) {
                distance[u] = distance[v] + 1;
                queue.push_back(u);
            }
        }
    }
    return distance;
}

// One search per source, then the smallest. Same answer, more work.
std::vector<int> nearest_source_one_at_a_time(const std::vector<std::vector<int>>& neighbours,
                                              const std::vector<int>& sources) {
    int n = static_cast<int>(neighbours.size());
    std::vector<int> best(n, -1);
    for (int s : sources) {
        std::vector<int> distance;
        std::vector<int> parent;
        bfs_with_parents(neighbours, s, distance, parent);
        for (int v = 0; v < n; v++) {
            if (distance[v] >= 0 && (best[v] < 0 || distance[v] < best[v])) {
                best[v] = distance[v];
            }
        }
    }
    return best;
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

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
long long seed = 1;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    std::vector<int> sizes = {6, 7, 6};
    std::vector<std::vector<Edge>> cases = {
        {{0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}, {4, 5}},
        {{0, 1}, {1, 2}, {2, 3}, {3, 4}, {4, 5}, {5, 6}},
        {{0, 1}, {1, 2}, {2, 3}, {3, 4}, {4, 5}, {0, 5}},
    };
    std::vector<std::vector<int>> source_sets = {{0, 5}, {0, 6}, {0, 3}};

    std::cout << std::left << std::setw(44) << "edges" << std::setw(24) << "route 0 to last"
              << std::setw(10) << "sources" << "from the set" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        int n = sizes[c];
        std::vector<std::vector<int>> neighbours = build(n, cases[c]);
        std::vector<int> distance;
        std::vector<int> parent;
        bfs_with_parents(neighbours, 0, distance, parent);
        std::string shown = "[";
        for (size_t i = 0; i < cases[c].size(); i++) {
            if (i > 0) {
                shown += ", ";
            }
            shown += std::to_string(cases[c][i].first) + "-" + std::to_string(cases[c][i].second);
        }
        shown += "]";
        std::cout << std::left << std::setw(44) << shown
                  << std::setw(24) << show(route(parent, distance, n - 1))
                  << std::setw(10) << show(source_sets[c])
                  << show(multi_source(neighbours, source_sets[c])) << "\\n";
    }
    std::cout << "\\n";

    int trials = 3000;
    int routes_valid = 0;
    int routes_shortest = 0;
    int multi_matches = 0;
    int scans_multi = 0;
    int scans_separate = 0;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(6);
        std::vector<Edge> edges;
        for (int u = 0; u < n; u++) {
            for (int v = u + 1; v < n; v++) {
                if (rand_below(3) == 0) {
                    edges.push_back(Edge(u, v));
                }
            }
        }
        std::vector<std::vector<int>> neighbours = build(n, edges);
        std::vector<int> distance;
        std::vector<int> parent;
        bfs_with_parents(neighbours, 0, distance, parent);
        bool good_valid = true;
        bool good_length = true;
        for (int target = 0; target < n; target++) {
            std::vector<int> path = route(parent, distance, target);
            if (distance[target] < 0) {
                if (!path.empty()) {
                    good_valid = false;
                }
                continue;
            }
            if (!route_is_valid(neighbours, path, 0, target)) {
                good_valid = false;
            }
            if (static_cast<int>(path.size()) - 1 != distance[target]) {
                good_length = false;
            }
        }
        if (good_valid) {
            routes_valid++;
        }
        if (good_length) {
            routes_shortest++;
        }
        std::vector<int> sources;
        for (int v = 0; v < n; v++) {
            if (rand_below(3) == 0) {
                sources.push_back(v);
            }
        }
        if (sources.empty()) {
            sources.push_back(0);
        }
        if (same(multi_source(neighbours, sources),
                 nearest_source_one_at_a_time(neighbours, sources))) {
            multi_matches++;
        }
        scans_multi++;
        scans_separate += static_cast<int>(sources.size());
    }

    std::cout << "over " << trials << " random graphs on up to 7 nodes:\\n";
    std::cout << "  every reconstructed route was real     " << std::right << std::setw(6) << routes_valid << "\\n";
    std::cout << "  and was as short as the distance said  " << std::setw(6) << routes_shortest << "\\n";
    std::cout << "  multi-source agreed with one at a time " << std::setw(6) << multi_matches << "\\n";
    std::cout << "  searches run, one pass against many    " << std::setw(6) << scans_multi
              << std::setw(7) << scans_separate << "\\n";
    std::cout << "\\n";
    std::cout << "The parent array is the whole trick for the route: a node has exactly one\\n";
    std::cout << "first-discoverer, so the links form a tree and walking back from any node\\n";
    std::cout << "gives a shortest path in reverse. The multi-source trick is smaller still\\n";
    std::cout << "-- seeding the queue with every source at distance zero is already the\\n";
    std::cout << "right algorithm, because the invariant the search relies on is about the\\n";
    std::cout << "queue being sorted by distance, and a queue of zeroes is sorted.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Two things a breadth-first search is asked for that it does not print by
// itself: the route, and the distance from a whole set of starting points.
//
// The route costs one array. Record, for each node, the node it was first
// reached from, then walk backwards from the target. The distance from a set
// costs nothing at all -- put every source in the queue at distance zero and
// run the search unchanged.
//
// The example builds both, and scores the multi-source version against the
// obvious alternative: run a separate search from each source and take the
// smallest. Same answers, one pass instead of many.

fn build(n: usize, edges: &[(usize, usize)]) -> Vec<Vec<usize>> {
    let mut neighbours = vec![Vec::new(); n];
    for &(u, v) in edges {
        neighbours[u].push(v);
        neighbours[v].push(u);
    }
    neighbours
}

/// Distances, plus the node each one was first reached from.
fn bfs_with_parents(neighbours: &[Vec<usize>], start: usize) -> (Vec<i32>, Vec<i32>) {
    let n = neighbours.len();
    let mut distance = vec![-1i32; n];
    let mut parent = vec![-1i32; n];
    distance[start] = 0;
    let mut queue = vec![start];
    let mut head = 0;
    while head < queue.len() {
        let v = queue[head];
        head += 1;
        for i in 0..neighbours[v].len() {
            let u = neighbours[v][i];
            if distance[u] < 0 {
                distance[u] = distance[v] + 1;
                parent[u] = v as i32;
                queue.push(u);
            }
        }
    }
    (distance, parent)
}

/// Walk the parent links back, then reverse. Empty when unreachable.
fn route(parent: &[i32], distance: &[i32], target: usize) -> Vec<i32> {
    let mut forwards: Vec<i32> = Vec::new();
    if distance[target] < 0 {
        return forwards;
    }
    let mut backwards: Vec<i32> = Vec::new();
    let mut at = target as i32;
    while at >= 0 {
        backwards.push(at);
        at = parent[at as usize];
    }
    for i in (0..backwards.len()).rev() {
        forwards.push(backwards[i]);
    }
    forwards
}

/// Every consecutive pair must be a real edge, and the ends must match.
fn route_is_valid(neighbours: &[Vec<usize>], path: &[i32], start: usize, target: usize) -> bool {
    if path.is_empty() {
        return false;
    }
    if path[0] != start as i32 || path[path.len() - 1] != target as i32 {
        return false;
    }
    for i in 0..path.len() - 1 {
        let mut joined = false;
        for &u in &neighbours[path[i] as usize] {
            if u as i32 == path[i + 1] {
                joined = true;
            }
        }
        if !joined {
            return false;
        }
    }
    true
}

/// Every source starts at distance zero, in the same queue.
fn multi_source(neighbours: &[Vec<usize>], sources: &[usize]) -> Vec<i32> {
    let n = neighbours.len();
    let mut distance = vec![-1i32; n];
    let mut queue: Vec<usize> = Vec::new();
    for &s in sources {
        if distance[s] < 0 {
            distance[s] = 0;
            queue.push(s);
        }
    }
    let mut head = 0;
    while head < queue.len() {
        let v = queue[head];
        head += 1;
        for i in 0..neighbours[v].len() {
            let u = neighbours[v][i];
            if distance[u] < 0 {
                distance[u] = distance[v] + 1;
                queue.push(u);
            }
        }
    }
    distance
}

/// One search per source, then the smallest. Same answer, more work.
fn nearest_source_one_at_a_time(neighbours: &[Vec<usize>], sources: &[usize]) -> Vec<i32> {
    let n = neighbours.len();
    let mut best = vec![-1i32; n];
    for &s in sources {
        let (distance, _) = bfs_with_parents(neighbours, s);
        for v in 0..n {
            if distance[v] >= 0 && (best[v] < 0 || distance[v] < best[v]) {
                best[v] = distance[v];
            }
        }
    }
    best
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

fn show_usize(values: &[usize]) -> String {
    let parts: Vec<String> = values.iter().map(|v| v.to_string()).collect();
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
    let sizes: Vec<usize> = vec![6, 7, 6];
    let cases: Vec<Vec<(usize, usize)>> = vec![
        vec![(0, 1), (0, 2), (1, 3), (2, 3), (3, 4), (4, 5)],
        vec![(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 6)],
        vec![(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (0, 5)],
    ];
    let source_sets: Vec<Vec<usize>> = vec![vec![0, 5], vec![0, 6], vec![0, 3]];

    println!(
        "{}{}{}{}",
        pad_right("edges", 44),
        pad_right("route 0 to last", 24),
        pad_right("sources", 10),
        "from the set"
    );
    for (c, edges) in cases.iter().enumerate() {
        let n = sizes[c];
        let neighbours = build(n, edges);
        let (distance, parent) = bfs_with_parents(&neighbours, 0);
        let parts: Vec<String> = edges.iter().map(|&(u, v)| format!("{}-{}", u, v)).collect();
        let shown = format!("[{}]", parts.join(", "));
        println!(
            "{}{}{}{}",
            pad_right(&shown, 44),
            pad_right(&show(&route(&parent, &distance, n - 1)), 24),
            pad_right(&show_usize(&source_sets[c]), 10),
            show(&multi_source(&neighbours, &source_sets[c]))
        );
    }
    println!();

    let mut rng = Rng { seed: 1 };
    let trials = 3000;
    let mut routes_valid = 0;
    let mut routes_shortest = 0;
    let mut multi_matches = 0;
    let mut scans_multi = 0;
    let mut scans_separate = 0;
    for _ in 0..trials {
        let n = (2 + rng.next(6)) as usize;
        let mut edges: Vec<(usize, usize)> = Vec::new();
        for u in 0..n {
            for v in (u + 1)..n {
                if rng.next(3) == 0 {
                    edges.push((u, v));
                }
            }
        }
        let neighbours = build(n, &edges);
        let (distance, parent) = bfs_with_parents(&neighbours, 0);
        let mut good_valid = true;
        let mut good_length = true;
        for target in 0..n {
            let path = route(&parent, &distance, target);
            if distance[target] < 0 {
                if !path.is_empty() {
                    good_valid = false;
                }
                continue;
            }
            if !route_is_valid(&neighbours, &path, 0, target) {
                good_valid = false;
            }
            if path.len() as i32 - 1 != distance[target] {
                good_length = false;
            }
        }
        if good_valid {
            routes_valid += 1;
        }
        if good_length {
            routes_shortest += 1;
        }
        let mut sources: Vec<usize> = Vec::new();
        for v in 0..n {
            if rng.next(3) == 0 {
                sources.push(v);
            }
        }
        if sources.is_empty() {
            sources.push(0);
        }
        if same(
            &multi_source(&neighbours, &sources),
            &nearest_source_one_at_a_time(&neighbours, &sources),
        ) {
            multi_matches += 1;
        }
        scans_multi += 1;
        scans_separate += sources.len();
    }

    println!("over {} random graphs on up to 7 nodes:", trials);
    println!("  every reconstructed route was real     {}", pad_left(&routes_valid.to_string(), 6));
    println!("  and was as short as the distance said  {}", pad_left(&routes_shortest.to_string(), 6));
    println!("  multi-source agreed with one at a time {}", pad_left(&multi_matches.to_string(), 6));
    println!(
        "  searches run, one pass against many    {}{}",
        pad_left(&scans_multi.to_string(), 6),
        pad_left(&scans_separate.to_string(), 7)
    );
    println!();
    println!("The parent array is the whole trick for the route: a node has exactly one");
    println!("first-discoverer, so the links form a tree and walking back from any node");
    println!("gives a shortest path in reverse. The multi-source trick is smaller still");
    println!("-- seeding the queue with every source at distance zero is already the");
    println!("right algorithm, because the invariant the search relies on is about the");
    println!("queue being sorted by distance, and a queue of zeroes is sorted.");
}
`,
            },
            {
              lang: "go",
              code: `// Two things a breadth-first search is asked for that it does not print by
// itself: the route, and the distance from a whole set of starting points.
//
// The route costs one array. Record, for each node, the node it was first
// reached from, then walk backwards from the target. The distance from a set
// costs nothing at all -- put every source in the queue at distance zero and
// run the search unchanged.
//
// The example builds both, and scores the multi-source version against the
// obvious alternative: run a separate search from each source and take the
// smallest. Same answers, one pass instead of many.

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

// Distances, plus the node each one was first reached from.
func bfsWithParents(neighbours [][]int, start int) ([]int, []int) {
	n := len(neighbours)
	distance := make([]int, n)
	parent := make([]int, n)
	for i := 0; i < n; i++ {
		distance[i] = -1
		parent[i] = -1
	}
	distance[start] = 0
	queue := []int{start}
	head := 0
	for head < len(queue) {
		v := queue[head]
		head++
		for _, u := range neighbours[v] {
			if distance[u] < 0 {
				distance[u] = distance[v] + 1
				parent[u] = v
				queue = append(queue, u)
			}
		}
	}
	return distance, parent
}

// Walk the parent links back, then reverse. Empty when unreachable.
func route(parent, distance []int, target int) []int {
	forwards := []int{}
	if distance[target] < 0 {
		return forwards
	}
	backwards := []int{}
	at := target
	for at >= 0 {
		backwards = append(backwards, at)
		at = parent[at]
	}
	for i := len(backwards) - 1; i >= 0; i-- {
		forwards = append(forwards, backwards[i])
	}
	return forwards
}

// Every consecutive pair must be a real edge, and the ends must match.
func routeIsValid(neighbours [][]int, path []int, start, target int) bool {
	if len(path) == 0 {
		return false
	}
	if path[0] != start || path[len(path)-1] != target {
		return false
	}
	for i := 0; i < len(path)-1; i++ {
		joined := false
		for _, u := range neighbours[path[i]] {
			if u == path[i+1] {
				joined = true
			}
		}
		if !joined {
			return false
		}
	}
	return true
}

// Every source starts at distance zero, in the same queue.
func multiSource(neighbours [][]int, sources []int) []int {
	n := len(neighbours)
	distance := make([]int, n)
	for i := range distance {
		distance[i] = -1
	}
	queue := []int{}
	for _, s := range sources {
		if distance[s] < 0 {
			distance[s] = 0
			queue = append(queue, s)
		}
	}
	head := 0
	for head < len(queue) {
		v := queue[head]
		head++
		for _, u := range neighbours[v] {
			if distance[u] < 0 {
				distance[u] = distance[v] + 1
				queue = append(queue, u)
			}
		}
	}
	return distance
}

// One search per source, then the smallest. Same answer, more work.
func nearestSourceOneAtATime(neighbours [][]int, sources []int) []int {
	n := len(neighbours)
	best := make([]int, n)
	for i := range best {
		best[i] = -1
	}
	for _, s := range sources {
		distance, _ := bfsWithParents(neighbours, s)
		for v := 0; v < n; v++ {
			if distance[v] >= 0 && (best[v] < 0 || distance[v] < best[v]) {
				best[v] = distance[v]
			}
		}
	}
	return best
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

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	sizes := []int{6, 7, 6}
	cases := [][]edge{
		{{0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}, {4, 5}},
		{{0, 1}, {1, 2}, {2, 3}, {3, 4}, {4, 5}, {5, 6}},
		{{0, 1}, {1, 2}, {2, 3}, {3, 4}, {4, 5}, {0, 5}},
	}
	sourceSets := [][]int{{0, 5}, {0, 6}, {0, 3}}

	fmt.Printf("%-44s%-24s%-10s%s\\n", "edges", "route 0 to last", "sources", "from the set")
	for c, edges := range cases {
		n := sizes[c]
		neighbours := build(n, edges)
		distance, parent := bfsWithParents(neighbours, 0)
		parts := make([]string, len(edges))
		for i, e := range edges {
			parts[i] = fmt.Sprintf("%d-%d", e.from, e.to)
		}
		shown := "[" + strings.Join(parts, ", ") + "]"
		fmt.Printf("%-44s%-24s%-10s%s\\n", shown, show(route(parent, distance, n-1)),
			show(sourceSets[c]), show(multiSource(neighbours, sourceSets[c])))
	}
	fmt.Println()

	trials := 3000
	routesValid := 0
	routesShortest := 0
	multiMatches := 0
	scansMulti := 0
	scansSeparate := 0
	for t := 0; t < trials; t++ {
		n := 2 + rand(6)
		edges := []edge{}
		for u := 0; u < n; u++ {
			for v := u + 1; v < n; v++ {
				if rand(3) == 0 {
					edges = append(edges, edge{u, v})
				}
			}
		}
		neighbours := build(n, edges)
		distance, parent := bfsWithParents(neighbours, 0)
		goodValid := true
		goodLength := true
		for target := 0; target < n; target++ {
			path := route(parent, distance, target)
			if distance[target] < 0 {
				if len(path) != 0 {
					goodValid = false
				}
				continue
			}
			if !routeIsValid(neighbours, path, 0, target) {
				goodValid = false
			}
			if len(path)-1 != distance[target] {
				goodLength = false
			}
		}
		if goodValid {
			routesValid++
		}
		if goodLength {
			routesShortest++
		}
		sources := []int{}
		for v := 0; v < n; v++ {
			if rand(3) == 0 {
				sources = append(sources, v)
			}
		}
		if len(sources) == 0 {
			sources = append(sources, 0)
		}
		if same(multiSource(neighbours, sources), nearestSourceOneAtATime(neighbours, sources)) {
			multiMatches++
		}
		scansMulti++
		scansSeparate += len(sources)
	}

	fmt.Printf("over %d random graphs on up to 7 nodes:\\n", trials)
	fmt.Printf("  every reconstructed route was real     %6d\\n", routesValid)
	fmt.Printf("  and was as short as the distance said  %6d\\n", routesShortest)
	fmt.Printf("  multi-source agreed with one at a time %6d\\n", multiMatches)
	fmt.Printf("  searches run, one pass against many    %6d%7d\\n", scansMulti, scansSeparate)
	fmt.Println()
	fmt.Println("The parent array is the whole trick for the route: a node has exactly one")
	fmt.Println("first-discoverer, so the links form a tree and walking back from any node")
	fmt.Println("gives a shortest path in reverse. The multi-source trick is smaller still")
	fmt.Println("-- seeding the queue with every source at distance zero is already the")
	fmt.Println("right algorithm, because the invariant the search relies on is about the")
	fmt.Println("queue being sorted by distance, and a queue of zeroes is sorted.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Reconstructing the route by a second search",
          body: "The information is already there. One parent array recorded during the search is enough, and walking it back gives a shortest path in reverse. Re-running the search from the target, or storing the whole path at every node, costs far more and answers the same question.",
        },
        {
          title: "Running one search per source",
          body: "Seeding the queue with every source at distance zero gives the same answers in one pass -- 3,000 out of 3,000 here, with 3,000 searches instead of 5,076. This is the standard shape for \"distance to the nearest X\" problems, and the naive version gets slower in proportion to the number of sources.",
        },
      ],
    },
    {
      id: "searching-from-both-ends",
      heading: "Searching from both ends",
      body: [
        "The layer structure is not only an explanation. It is something to exploit.",
        "Search from both ends at once and stop when the two frontiers meet. Each search then covers half the distance, and where each layer is `b` times the size of the last, that turns `b^d` nodes into `2 * b^(d/2)` \u2014 a square root. It is why a word ladder solver or a puzzle solver is written this way.",
        "The measurement makes the shape of the saving concrete, including where there is none. On a complete binary tree of depth 14, finding the distance from the root to the last leaf took 16,383 pops one way and touched 109 nodes both ways. On a ring of 200 nodes it was 200 against 202 \u2014 no saving at all, because a ring's layers hold two nodes however far you go. The saving lives in the branching factor, and a graph without one has nothing to halve.",
        "There is also a stopping rule to get right. Two frontiers can touch in several places at once, and the first place found is whichever the neighbour order happened to reach, not the cheapest. So the rule is: expand one whole layer, then take the smallest `from_start[v] + from_target[v]` over every node both sides have reached. That was correct on all 3,000 random graphs.",
        "The version that pops one node from each queue and returns the moment they touch is the natural thing to write and it is wrong. It was right on 2,992 of 3,000 and too long on the other 8, never too short. Eight in three thousand is exactly the failure rate that survives a test suite and shows up as an off-by-one bug report months later \u2014 which is why the example prints the two graphs it got wrong, small enough to check by eye.",
      ],
      examples: [
        {
          id: "meeting-in-the-middle",
          title: "Half the depth twice over, and the stopping rule that looks right",
          lang: "python",
          code: `# The layer structure is not only the explanation of why breadth-first search is
# correct. It is something to exploit.
#
# Searching from both ends at once and meeting in the middle covers the same
# distance with two searches of half the depth. Where each layer is b times the
# last, that is 2 * b^(d/2) nodes instead of b^d, which is the reason a word
# ladder or a puzzle solver is written this way.
#
# It also has a stopping rule that is easy to get wrong, and the wrong version
# is wrong rarely enough to survive a test suite. Both are here, scored against
# a plain breadth-first search.


def build(n, edges):
    neighbours = [[] for _ in range(n)]
    for u, v in edges:
        neighbours[u].append(v)
        neighbours[v].append(u)
    return neighbours


def bfs_distance(neighbours, start, target):
    """The plain search, and the number of nodes it took off the queue."""
    n = len(neighbours)
    distance = [-1] * n
    distance[start] = 0
    queue = [start]
    head = 0
    popped = 0
    while head < len(queue):
        v = queue[head]
        head += 1
        popped += 1
        if v == target:
            return distance[v], popped
        for u in neighbours[v]:
            if distance[u] < 0:
                distance[u] = distance[v] + 1
                queue.append(u)
    return -1, popped


def expand_layer(neighbours, distance, frontier):
    """One whole layer of a breadth-first search. Returns the next frontier."""
    nxt = []
    for v in frontier:
        for u in neighbours[v]:
            if distance[u] < 0:
                distance[u] = distance[v] + 1
                nxt.append(u)
    return nxt


def best_meeting(from_start, from_target, n):
    """The smallest total over every node both searches have reached."""
    best = -1
    for v in range(n):
        if from_start[v] >= 0 and from_target[v] >= 0:
            total = from_start[v] + from_target[v]
            if best < 0 or total < best:
                best = total
    return best


def bidirectional(neighbours, start, target):
    """Expand one whole layer on the smaller side, then minimise over meetings."""
    n = len(neighbours)
    if start == target:
        return 0, 1
    from_start = [-1] * n
    from_target = [-1] * n
    from_start[start] = 0
    from_target[target] = 0
    front_a = [start]
    front_b = [target]
    touched = 2
    while len(front_a) > 0 and len(front_b) > 0:
        if len(front_a) <= len(front_b):
            front_a = expand_layer(neighbours, from_start, front_a)
            touched += len(front_a)
        else:
            front_b = expand_layer(neighbours, from_target, front_b)
            touched += len(front_b)
        best = best_meeting(from_start, from_target, n)
        if best >= 0:
            return best, touched
    return -1, touched


def bidirectional_node_at_a_time(neighbours, start, target):
    """The tempting version: two queues, one node each, stop the moment they touch."""
    n = len(neighbours)
    if start == target:
        return 0
    from_start = [-1] * n
    from_target = [-1] * n
    from_start[start] = 0
    from_target[target] = 0
    queue_a = [start]
    queue_b = [target]
    head_a = 0
    head_b = 0
    while head_a < len(queue_a) or head_b < len(queue_b):
        if head_a < len(queue_a):
            v = queue_a[head_a]
            head_a += 1
            for u in neighbours[v]:
                if from_start[u] < 0:
                    from_start[u] = from_start[v] + 1
                    if from_target[u] >= 0:
                        return from_start[u] + from_target[u]
                    queue_a.append(u)
        if head_b < len(queue_b):
            v = queue_b[head_b]
            head_b += 1
            for u in neighbours[v]:
                if from_target[u] < 0:
                    from_target[u] = from_target[v] + 1
                    if from_start[u] >= 0:
                        return from_start[u] + from_target[u]
                    queue_b.append(u)
    return -1


def ring(n):
    """A cycle. Each layer holds two nodes however far the search goes."""
    return [(v, (v + 1) % n) for v in range(n)]


def binary_tree(depth):
    """A complete binary tree. Each layer downwards is twice the one above."""
    n = (1 << depth) - 1
    return n, [((v - 1) // 2, v) for v in range(1, n)]


def show_edges(edges):
    return "[" + ", ".join(f"{u}-{v}" for u, v in edges) + "]"


tree_n, tree_edges = binary_tree(14)
SHAPES = [
    ("ring of 200", 200, ring(200), 0, 100),
    ("binary tree, depth 14", tree_n, tree_edges, 0, tree_n - 1),
]

print(f"{'shape':<24}{'distance':>10}{'one-way pops':>14}{'both ways touched':>19}")
for name, n, edges, start, target in SHAPES:
    neighbours = build(n, edges)
    one, popped = bfs_distance(neighbours, start, target)
    both, touched = bidirectional(neighbours, start, target)
    if one != both:
        print("MISMATCH")
    print(f"{name:<24}{one:>10}{popped:>14}{touched:>19}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
both_ok = 0
early_ok = 0
early_over = 0
early_under = 0
examples = []
for _ in range(TRIALS):
    n = 2 + rand(8)
    edges = []
    for u in range(n):
        for v in range(u + 1, n):
            if rand(3) == 0:
                edges.append((u, v))
    neighbours = build(n, edges)
    target = n - 1
    truth, _ = bfs_distance(neighbours, 0, target)
    both, _ = bidirectional(neighbours, 0, target)
    guess = bidirectional_node_at_a_time(neighbours, 0, target)
    if both == truth:
        both_ok += 1
    if guess == truth:
        early_ok += 1
    else:
        if len(examples) < 2:
            examples.append((n, edges, truth, guess))
        if truth >= 0 and guess > truth:
            early_over += 1
        if truth >= 0 and guess < truth:
            early_under += 1

print(f"over {TRIALS} random graphs on up to 9 nodes:")
print(f"  layer at a time, best meeting  {both_ok:>6}")
print(f"  node at a time, first meeting  {early_ok:>6}")
print()
print(f"the second one was too long on {early_over} graphs and too short on {early_under}.")
print("Here are the first two it got wrong:")
print()
print(f"{'edges':<58}{'true':>6}{'guess':>7}")
for n, edges, truth, guess in examples:
    print(f"{show_edges(edges):<58}{truth:>6}{guess:>7}")
print()
print("Two frontiers can touch in several places at once, and the first place")
print("found is whichever the neighbour order reached first, not the cheapest.")
print("Expanding one node at a time makes that worse, because the two sides are")
print("no longer at comparable depths when they meet. Finish the layer, then")
print("minimise over every node both sides have reached. And note where the")
print("saving actually is: on a ring, where every layer holds two nodes, there")
print("is none. It is the branching factor in the exponent that halves.")
`,
          output: `shape                     distance  one-way pops  both ways touched
ring of 200                    100           200                202
binary tree, depth 14           13         16383                109

over 3000 random graphs on up to 9 nodes:
  layer at a time, best meeting    3000
  node at a time, first meeting    2992

the second one was too long on 8 graphs and too short on 0.
Here are the first two it got wrong:

edges                                                       true  guess
[0-2, 0-3, 1-2, 1-4, 2-3, 3-4, 4-5]                            3      4
[0-1, 0-5, 1-4, 2-4, 2-5, 3-4, 3-5, 3-6, 4-5]                  3      4

Two frontiers can touch in several places at once, and the first place
found is whichever the neighbour order reached first, not the cheapest.
Expanding one node at a time makes that worse, because the two sides are
no longer at comparable depths when they meet. Finish the layer, then
minimise over every node both sides have reached. And note where the
saving actually is: on a ring, where every layer holds two nodes, there
is none. It is the branching factor in the exponent that halves.`,
          explanation:
            "A search from both ends, with the cost counted on shapes that do and do not have a branching factor, and the stopping rule that looks right. The two graphs the early-stopping version gets wrong are printed in full.",
          alternates: [
            {
              lang: "javascript",
              code: `// The layer structure is not only the explanation of why breadth-first search is
// correct. It is something to exploit.
//
// Searching from both ends at once and meeting in the middle covers the same
// distance with two searches of half the depth. Where each layer is b times the
// last, that is 2 * b^(d/2) nodes instead of b^d, which is the reason a word
// ladder or a puzzle solver is written this way.
//
// It also has a stopping rule that is easy to get wrong, and the wrong version
// is wrong rarely enough to survive a test suite. Both are here, scored against
// a plain breadth-first search.

function build(n, edges) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    neighbours[v].push(u);
  }
  return neighbours;
}

/** The plain search, and the number of nodes it took off the queue. */
function bfsDistance(neighbours, start, target) {
  const n = neighbours.length;
  const distance = new Array(n).fill(-1);
  distance[start] = 0;
  const queue = [start];
  let head = 0;
  let popped = 0;
  while (head < queue.length) {
    const v = queue[head];
    head += 1;
    popped += 1;
    if (v === target) return [distance[v], popped];
    for (const u of neighbours[v]) {
      if (distance[u] < 0) {
        distance[u] = distance[v] + 1;
        queue.push(u);
      }
    }
  }
  return [-1, popped];
}

/** One whole layer of a breadth-first search. Returns the next frontier. */
function expandLayer(neighbours, distance, frontier) {
  const next = [];
  for (const v of frontier) {
    for (const u of neighbours[v]) {
      if (distance[u] < 0) {
        distance[u] = distance[v] + 1;
        next.push(u);
      }
    }
  }
  return next;
}

/** The smallest total over every node both searches have reached. */
function bestMeeting(fromStart, fromTarget, n) {
  let best = -1;
  for (let v = 0; v < n; v += 1) {
    if (fromStart[v] >= 0 && fromTarget[v] >= 0) {
      const total = fromStart[v] + fromTarget[v];
      if (best < 0 || total < best) best = total;
    }
  }
  return best;
}

/** Expand one whole layer on the smaller side, then minimise over meetings. */
function bidirectional(neighbours, start, target) {
  const n = neighbours.length;
  if (start === target) return [0, 1];
  const fromStart = new Array(n).fill(-1);
  const fromTarget = new Array(n).fill(-1);
  fromStart[start] = 0;
  fromTarget[target] = 0;
  let frontA = [start];
  let frontB = [target];
  let touched = 2;
  while (frontA.length > 0 && frontB.length > 0) {
    if (frontA.length <= frontB.length) {
      frontA = expandLayer(neighbours, fromStart, frontA);
      touched += frontA.length;
    } else {
      frontB = expandLayer(neighbours, fromTarget, frontB);
      touched += frontB.length;
    }
    const best = bestMeeting(fromStart, fromTarget, n);
    if (best >= 0) return [best, touched];
  }
  return [-1, touched];
}

/** The tempting version: two queues, one node each, stop the moment they touch. */
function bidirectionalNodeAtATime(neighbours, start, target) {
  const n = neighbours.length;
  if (start === target) return 0;
  const fromStart = new Array(n).fill(-1);
  const fromTarget = new Array(n).fill(-1);
  fromStart[start] = 0;
  fromTarget[target] = 0;
  const queueA = [start];
  const queueB = [target];
  let headA = 0;
  let headB = 0;
  while (headA < queueA.length || headB < queueB.length) {
    if (headA < queueA.length) {
      const v = queueA[headA];
      headA += 1;
      for (const u of neighbours[v]) {
        if (fromStart[u] < 0) {
          fromStart[u] = fromStart[v] + 1;
          if (fromTarget[u] >= 0) return fromStart[u] + fromTarget[u];
          queueA.push(u);
        }
      }
    }
    if (headB < queueB.length) {
      const v = queueB[headB];
      headB += 1;
      for (const u of neighbours[v]) {
        if (fromTarget[u] < 0) {
          fromTarget[u] = fromTarget[v] + 1;
          if (fromStart[u] >= 0) return fromStart[u] + fromTarget[u];
          queueB.push(u);
        }
      }
    }
  }
  return -1;
}

/** A cycle. Each layer holds two nodes however far the search goes. */
function ring(n) {
  const edges = [];
  for (let v = 0; v < n; v += 1) edges.push([v, (v + 1) % n]);
  return edges;
}

/** A complete binary tree. Each layer downwards is twice the one above. */
function binaryTree(depth) {
  const n = (1 << depth) - 1;
  const edges = [];
  for (let v = 1; v < n; v += 1) edges.push([Math.floor((v - 1) / 2), v]);
  return [n, edges];
}

const showEdges = (edges) =>
  "[" + edges.map(([u, v]) => \`\${u}-\${v}\`).join(", ") + "]";
const padEnd = (v, w) => String(v).padEnd(w);
const pad = (v, w) => String(v).padStart(w);

const [treeN, treeEdges] = binaryTree(14);
const SHAPES = [
  ["ring of 200", 200, ring(200), 0, 100],
  ["binary tree, depth 14", treeN, treeEdges, 0, treeN - 1],
];

console.log(
  padEnd("shape", 24) + pad("distance", 10) + pad("one-way pops", 14) + pad("both ways touched", 19)
);
for (const [name, n, edges, start, target] of SHAPES) {
  const neighbours = build(n, edges);
  const [one, popped] = bfsDistance(neighbours, start, target);
  const [both, touched] = bidirectional(neighbours, start, target);
  if (one !== both) console.log("MISMATCH");
  console.log(padEnd(name, 24) + pad(one, 10) + pad(popped, 14) + pad(touched, 19));
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
let bothOk = 0;
let earlyOk = 0;
let earlyOver = 0;
let earlyUnder = 0;
const examples = [];
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(8);
  const edges = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) {
      if (rand(3) === 0) edges.push([u, v]);
    }
  }
  const neighbours = build(n, edges);
  const target = n - 1;
  const [truth] = bfsDistance(neighbours, 0, target);
  const [both] = bidirectional(neighbours, 0, target);
  const guess = bidirectionalNodeAtATime(neighbours, 0, target);
  if (both === truth) bothOk += 1;
  if (guess === truth) {
    earlyOk += 1;
  } else {
    if (examples.length < 2) examples.push([n, edges, truth, guess]);
    if (truth >= 0 && guess > truth) earlyOver += 1;
    if (truth >= 0 && guess < truth) earlyUnder += 1;
  }
}

console.log(\`over \${TRIALS} random graphs on up to 9 nodes:\`);
console.log(\`  layer at a time, best meeting  \${pad(bothOk, 6)}\`);
console.log(\`  node at a time, first meeting  \${pad(earlyOk, 6)}\`);
console.log();
console.log(\`the second one was too long on \${earlyOver} graphs and too short on \${earlyUnder}.\`);
console.log("Here are the first two it got wrong:");
console.log();
console.log(padEnd("edges", 58) + pad("true", 6) + pad("guess", 7));
for (const [, edges, truth, guess] of examples) {
  console.log(padEnd(showEdges(edges), 58) + pad(truth, 6) + pad(guess, 7));
}
console.log();
console.log("Two frontiers can touch in several places at once, and the first place");
console.log("found is whichever the neighbour order reached first, not the cheapest.");
console.log("Expanding one node at a time makes that worse, because the two sides are");
console.log("no longer at comparable depths when they meet. Finish the layer, then");
console.log("minimise over every node both sides have reached. And note where the");
console.log("saving actually is: on a ring, where every layer holds two nodes, there");
console.log("is none. It is the branching factor in the exponent that halves.");
`,
            },
            {
              lang: "typescript",
              code: `// The layer structure is not only the explanation of why breadth-first search is
// correct. It is something to exploit.
//
// Searching from both ends at once and meeting in the middle covers the same
// distance with two searches of half the depth. Where each layer is b times the
// last, that is 2 * b^(d/2) nodes instead of b^d, which is the reason a word
// ladder or a puzzle solver is written this way.
//
// It also has a stopping rule that is easy to get wrong, and the wrong version
// is wrong rarely enough to survive a test suite. Both are here, scored against
// a plain breadth-first search.

type Edge = [number, number];

function build(n: number, edges: Edge[]): number[][] {
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    neighbours[v].push(u);
  }
  return neighbours;
}

/** The plain search, and the number of nodes it took off the queue. */
function bfsDistance(neighbours: number[][], start: number, target: number): [number, number] {
  const n = neighbours.length;
  const distance = new Array(n).fill(-1);
  distance[start] = 0;
  const queue = [start];
  let head = 0;
  let popped = 0;
  while (head < queue.length) {
    const v = queue[head];
    head += 1;
    popped += 1;
    if (v === target) return [distance[v], popped];
    for (const u of neighbours[v]) {
      if (distance[u] < 0) {
        distance[u] = distance[v] + 1;
        queue.push(u);
      }
    }
  }
  return [-1, popped];
}

/** One whole layer of a breadth-first search. Returns the next frontier. */
function expandLayer(neighbours: number[][], distance: number[], frontier: number[]): number[] {
  const next: number[] = [];
  for (const v of frontier) {
    for (const u of neighbours[v]) {
      if (distance[u] < 0) {
        distance[u] = distance[v] + 1;
        next.push(u);
      }
    }
  }
  return next;
}

/** The smallest total over every node both searches have reached. */
function bestMeeting(fromStart: number[], fromTarget: number[], n: number): number {
  let best = -1;
  for (let v = 0; v < n; v += 1) {
    if (fromStart[v] >= 0 && fromTarget[v] >= 0) {
      const total = fromStart[v] + fromTarget[v];
      if (best < 0 || total < best) best = total;
    }
  }
  return best;
}

/** Expand one whole layer on the smaller side, then minimise over meetings. */
function bidirectional(neighbours: number[][], start: number, target: number): [number, number] {
  const n = neighbours.length;
  if (start === target) return [0, 1];
  const fromStart = new Array(n).fill(-1);
  const fromTarget = new Array(n).fill(-1);
  fromStart[start] = 0;
  fromTarget[target] = 0;
  let frontA = [start];
  let frontB = [target];
  let touched = 2;
  while (frontA.length > 0 && frontB.length > 0) {
    if (frontA.length <= frontB.length) {
      frontA = expandLayer(neighbours, fromStart, frontA);
      touched += frontA.length;
    } else {
      frontB = expandLayer(neighbours, fromTarget, frontB);
      touched += frontB.length;
    }
    const best = bestMeeting(fromStart, fromTarget, n);
    if (best >= 0) return [best, touched];
  }
  return [-1, touched];
}

/** The tempting version: two queues, one node each, stop the moment they touch. */
function bidirectionalNodeAtATime(neighbours: number[][], start: number, target: number): number {
  const n = neighbours.length;
  if (start === target) return 0;
  const fromStart = new Array(n).fill(-1);
  const fromTarget = new Array(n).fill(-1);
  fromStart[start] = 0;
  fromTarget[target] = 0;
  const queueA = [start];
  const queueB = [target];
  let headA = 0;
  let headB = 0;
  while (headA < queueA.length || headB < queueB.length) {
    if (headA < queueA.length) {
      const v = queueA[headA];
      headA += 1;
      for (const u of neighbours[v]) {
        if (fromStart[u] < 0) {
          fromStart[u] = fromStart[v] + 1;
          if (fromTarget[u] >= 0) return fromStart[u] + fromTarget[u];
          queueA.push(u);
        }
      }
    }
    if (headB < queueB.length) {
      const v = queueB[headB];
      headB += 1;
      for (const u of neighbours[v]) {
        if (fromTarget[u] < 0) {
          fromTarget[u] = fromTarget[v] + 1;
          if (fromStart[u] >= 0) return fromStart[u] + fromTarget[u];
          queueB.push(u);
        }
      }
    }
  }
  return -1;
}

/** A cycle. Each layer holds two nodes however far the search goes. */
function ring(n: number): Edge[] {
  const edges: Edge[] = [];
  for (let v = 0; v < n; v += 1) edges.push([v, (v + 1) % n]);
  return edges;
}

/** A complete binary tree. Each layer downwards is twice the one above. */
function binaryTree(depth: number): [number, Edge[]] {
  const n = (1 << depth) - 1;
  const edges: Edge[] = [];
  for (let v = 1; v < n; v += 1) edges.push([Math.floor((v - 1) / 2), v]);
  return [n, edges];
}

const showEdges = (edges: Edge[]): string =>
  "[" + edges.map(([u, v]) => \`\${u}-\${v}\`).join(", ") + "]";
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const pad = (v: string | number, w: number): string => String(v).padStart(w);

const [treeN, treeEdges] = binaryTree(14);
const SHAPES: [string, number, Edge[], number, number][] = [
  ["ring of 200", 200, ring(200), 0, 100],
  ["binary tree, depth 14", treeN, treeEdges, 0, treeN - 1],
];

console.log(
  padEnd("shape", 24) + pad("distance", 10) + pad("one-way pops", 14) + pad("both ways touched", 19)
);
for (const [name, n, edges, start, target] of SHAPES) {
  const neighbours = build(n, edges);
  const [one, popped] = bfsDistance(neighbours, start, target);
  const [both, touched] = bidirectional(neighbours, start, target);
  if (one !== both) console.log("MISMATCH");
  console.log(padEnd(name, 24) + pad(one, 10) + pad(popped, 14) + pad(touched, 19));
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
let bothOk = 0;
let earlyOk = 0;
let earlyOver = 0;
let earlyUnder = 0;
const examples: [number, Edge[], number, number][] = [];
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(8);
  const edges: Edge[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) {
      if (rand(3) === 0) edges.push([u, v]);
    }
  }
  const neighbours = build(n, edges);
  const target = n - 1;
  const [truth] = bfsDistance(neighbours, 0, target);
  const [both] = bidirectional(neighbours, 0, target);
  const guess = bidirectionalNodeAtATime(neighbours, 0, target);
  if (both === truth) bothOk += 1;
  if (guess === truth) {
    earlyOk += 1;
  } else {
    if (examples.length < 2) examples.push([n, edges, truth, guess]);
    if (truth >= 0 && guess > truth) earlyOver += 1;
    if (truth >= 0 && guess < truth) earlyUnder += 1;
  }
}

console.log(\`over \${TRIALS} random graphs on up to 9 nodes:\`);
console.log(\`  layer at a time, best meeting  \${pad(bothOk, 6)}\`);
console.log(\`  node at a time, first meeting  \${pad(earlyOk, 6)}\`);
console.log();
console.log(\`the second one was too long on \${earlyOver} graphs and too short on \${earlyUnder}.\`);
console.log("Here are the first two it got wrong:");
console.log();
console.log(padEnd("edges", 58) + pad("true", 6) + pad("guess", 7));
for (const [, edges, truth, guess] of examples) {
  console.log(padEnd(showEdges(edges), 58) + pad(truth, 6) + pad(guess, 7));
}
console.log();
console.log("Two frontiers can touch in several places at once, and the first place");
console.log("found is whichever the neighbour order reached first, not the cheapest.");
console.log("Expanding one node at a time makes that worse, because the two sides are");
console.log("no longer at comparable depths when they meet. Finish the layer, then");
console.log("minimise over every node both sides have reached. And note where the");
console.log("saving actually is: on a ring, where every layer holds two nodes, there");
console.log("is none. It is the branching factor in the exponent that halves.");
`,
            },
            {
              lang: "java",
              code: `// The layer structure is not only the explanation of why breadth-first search is
// correct. It is something to exploit.
//
// Searching from both ends at once and meeting in the middle covers the same
// distance with two searches of half the depth. Where each layer is b times the
// last, that is 2 * b^(d/2) nodes instead of b^d, which is the reason a word
// ladder or a puzzle solver is written this way.
//
// It also has a stopping rule that is easy to get wrong, and the wrong version
// is wrong rarely enough to survive a test suite. Both are here, scored against
// a plain breadth-first search.

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

    static int lastPopped;

    /** The plain search, and the number of nodes it took off the queue. */
    static int bfsDistance(List<List<Integer>> neighbours, int start, int target) {
        int n = neighbours.size();
        int[] distance = new int[n];
        Arrays.fill(distance, -1);
        distance[start] = 0;
        List<Integer> queue = new ArrayList<>();
        queue.add(start);
        int head = 0;
        int popped = 0;
        while (head < queue.size()) {
            int v = queue.get(head);
            head++;
            popped++;
            if (v == target) {
                lastPopped = popped;
                return distance[v];
            }
            for (int u : neighbours.get(v)) {
                if (distance[u] < 0) {
                    distance[u] = distance[v] + 1;
                    queue.add(u);
                }
            }
        }
        lastPopped = popped;
        return -1;
    }

    /** One whole layer of a breadth-first search. Returns the next frontier. */
    static List<Integer> expandLayer(List<List<Integer>> neighbours, int[] distance,
                                     List<Integer> frontier) {
        List<Integer> next = new ArrayList<>();
        for (int v : frontier) {
            for (int u : neighbours.get(v)) {
                if (distance[u] < 0) {
                    distance[u] = distance[v] + 1;
                    next.add(u);
                }
            }
        }
        return next;
    }

    /** The smallest total over every node both searches have reached. */
    static int bestMeeting(int[] fromStart, int[] fromTarget, int n) {
        int best = -1;
        for (int v = 0; v < n; v++) {
            if (fromStart[v] >= 0 && fromTarget[v] >= 0) {
                int total = fromStart[v] + fromTarget[v];
                if (best < 0 || total < best) {
                    best = total;
                }
            }
        }
        return best;
    }

    static int lastTouched;

    /** Expand one whole layer on the smaller side, then minimise over meetings. */
    static int bidirectional(List<List<Integer>> neighbours, int start, int target) {
        int n = neighbours.size();
        if (start == target) {
            lastTouched = 1;
            return 0;
        }
        int[] fromStart = new int[n];
        int[] fromTarget = new int[n];
        Arrays.fill(fromStart, -1);
        Arrays.fill(fromTarget, -1);
        fromStart[start] = 0;
        fromTarget[target] = 0;
        List<Integer> frontA = new ArrayList<>();
        frontA.add(start);
        List<Integer> frontB = new ArrayList<>();
        frontB.add(target);
        int touched = 2;
        while (!frontA.isEmpty() && !frontB.isEmpty()) {
            if (frontA.size() <= frontB.size()) {
                frontA = expandLayer(neighbours, fromStart, frontA);
                touched += frontA.size();
            } else {
                frontB = expandLayer(neighbours, fromTarget, frontB);
                touched += frontB.size();
            }
            int best = bestMeeting(fromStart, fromTarget, n);
            if (best >= 0) {
                lastTouched = touched;
                return best;
            }
        }
        lastTouched = touched;
        return -1;
    }

    /** The tempting version: two queues, one node each, stop the moment they touch. */
    static int bidirectionalNodeAtATime(List<List<Integer>> neighbours, int start, int target) {
        int n = neighbours.size();
        if (start == target) {
            return 0;
        }
        int[] fromStart = new int[n];
        int[] fromTarget = new int[n];
        Arrays.fill(fromStart, -1);
        Arrays.fill(fromTarget, -1);
        fromStart[start] = 0;
        fromTarget[target] = 0;
        List<Integer> queueA = new ArrayList<>();
        queueA.add(start);
        List<Integer> queueB = new ArrayList<>();
        queueB.add(target);
        int headA = 0;
        int headB = 0;
        while (headA < queueA.size() || headB < queueB.size()) {
            if (headA < queueA.size()) {
                int v = queueA.get(headA);
                headA++;
                for (int u : neighbours.get(v)) {
                    if (fromStart[u] < 0) {
                        fromStart[u] = fromStart[v] + 1;
                        if (fromTarget[u] >= 0) {
                            return fromStart[u] + fromTarget[u];
                        }
                        queueA.add(u);
                    }
                }
            }
            if (headB < queueB.size()) {
                int v = queueB.get(headB);
                headB++;
                for (int u : neighbours.get(v)) {
                    if (fromTarget[u] < 0) {
                        fromTarget[u] = fromTarget[v] + 1;
                        if (fromStart[u] >= 0) {
                            return fromStart[u] + fromTarget[u];
                        }
                        queueB.add(u);
                    }
                }
            }
        }
        return -1;
    }

    /** A cycle. Each layer holds two nodes however far the search goes. */
    static int[][] ring(int n) {
        int[][] edges = new int[n][2];
        for (int v = 0; v < n; v++) {
            edges[v][0] = v;
            edges[v][1] = (v + 1) % n;
        }
        return edges;
    }

    /** A complete binary tree. Each layer downwards is twice the one above. */
    static int[][] binaryTree(int depth) {
        int n = (1 << depth) - 1;
        int[][] edges = new int[n - 1][2];
        for (int v = 1; v < n; v++) {
            edges[v - 1][0] = (v - 1) / 2;
            edges[v - 1][1] = v;
        }
        return edges;
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
        int treeN = (1 << 14) - 1;
        String[] names = {"ring of 200", "binary tree, depth 14"};
        int[] counts = {200, treeN};
        int[][][] shapes = {ring(200), binaryTree(14)};
        int[] starts = {0, 0};
        int[] targets = {100, treeN - 1};

        System.out.println(padEnd("shape", 24) + pad("distance", 10)
                + pad("one-way pops", 14) + pad("both ways touched", 19));
        for (int c = 0; c < names.length; c++) {
            List<List<Integer>> neighbours = build(counts[c], shapes[c]);
            int one = bfsDistance(neighbours, starts[c], targets[c]);
            int popped = lastPopped;
            int both = bidirectional(neighbours, starts[c], targets[c]);
            int touched = lastTouched;
            if (one != both) {
                System.out.println("MISMATCH");
            }
            System.out.println(padEnd(names[c], 24) + pad(String.valueOf(one), 10)
                    + pad(String.valueOf(popped), 14) + pad(String.valueOf(touched), 19));
        }
        System.out.println();

        int trials = 3000;
        int bothOk = 0;
        int earlyOk = 0;
        int earlyOver = 0;
        int earlyUnder = 0;
        List<int[][]> exampleEdges = new ArrayList<>();
        List<int[]> exampleAnswers = new ArrayList<>();
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(8);
            List<int[]> collected = new ArrayList<>();
            for (int u = 0; u < n; u++) {
                for (int v = u + 1; v < n; v++) {
                    if (rand(3) == 0) {
                        collected.add(new int[] {u, v});
                    }
                }
            }
            int[][] edges = collected.toArray(new int[0][]);
            List<List<Integer>> neighbours = build(n, edges);
            int target = n - 1;
            int truth = bfsDistance(neighbours, 0, target);
            int both = bidirectional(neighbours, 0, target);
            int guess = bidirectionalNodeAtATime(neighbours, 0, target);
            if (both == truth) {
                bothOk++;
            }
            if (guess == truth) {
                earlyOk++;
            } else {
                if (exampleEdges.size() < 2) {
                    exampleEdges.add(edges);
                    exampleAnswers.add(new int[] {truth, guess});
                }
                if (truth >= 0 && guess > truth) {
                    earlyOver++;
                }
                if (truth >= 0 && guess < truth) {
                    earlyUnder++;
                }
            }
        }

        System.out.println("over " + trials + " random graphs on up to 9 nodes:");
        System.out.println("  layer at a time, best meeting  " + pad(String.valueOf(bothOk), 6));
        System.out.println("  node at a time, first meeting  " + pad(String.valueOf(earlyOk), 6));
        System.out.println();
        System.out.println("the second one was too long on " + earlyOver
                + " graphs and too short on " + earlyUnder + ".");
        System.out.println("Here are the first two it got wrong:");
        System.out.println();
        System.out.println(padEnd("edges", 58) + pad("true", 6) + pad("guess", 7));
        for (int i = 0; i < exampleEdges.size(); i++) {
            System.out.println(padEnd(showEdges(exampleEdges.get(i)), 58)
                    + pad(String.valueOf(exampleAnswers.get(i)[0]), 6)
                    + pad(String.valueOf(exampleAnswers.get(i)[1]), 7));
        }
        System.out.println();
        System.out.println("Two frontiers can touch in several places at once, and the first place");
        System.out.println("found is whichever the neighbour order reached first, not the cheapest.");
        System.out.println("Expanding one node at a time makes that worse, because the two sides are");
        System.out.println("no longer at comparable depths when they meet. Finish the layer, then");
        System.out.println("minimise over every node both sides have reached. And note where the");
        System.out.println("saving actually is: on a ring, where every layer holds two nodes, there");
        System.out.println("is none. It is the branching factor in the exponent that halves.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The layer structure is not only the explanation of why breadth-first search is
// correct. It is something to exploit.
//
// Searching from both ends at once and meeting in the middle covers the same
// distance with two searches of half the depth. Where each layer is b times the
// last, that is 2 * b^(d/2) nodes instead of b^d, which is the reason a word
// ladder or a puzzle solver is written this way.
//
// It also has a stopping rule that is easy to get wrong, and the wrong version
// is wrong rarely enough to survive a test suite. Both are here, scored against
// a plain breadth-first search.

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

// The plain search, and the number of nodes it took off the queue.
Edge bfs_distance(const std::vector<std::vector<int>>& neighbours, int start, int target) {
    int n = static_cast<int>(neighbours.size());
    std::vector<int> distance(n, -1);
    distance[start] = 0;
    std::vector<int> queue;
    queue.push_back(start);
    size_t head = 0;
    int popped = 0;
    while (head < queue.size()) {
        int v = queue[head];
        head++;
        popped++;
        if (v == target) {
            return Edge(distance[v], popped);
        }
        for (int u : neighbours[v]) {
            if (distance[u] < 0) {
                distance[u] = distance[v] + 1;
                queue.push_back(u);
            }
        }
    }
    return Edge(-1, popped);
}

// One whole layer of a breadth-first search. Returns the next frontier.
std::vector<int> expand_layer(const std::vector<std::vector<int>>& neighbours,
                              std::vector<int>& distance, const std::vector<int>& frontier) {
    std::vector<int> next;
    for (int v : frontier) {
        for (int u : neighbours[v]) {
            if (distance[u] < 0) {
                distance[u] = distance[v] + 1;
                next.push_back(u);
            }
        }
    }
    return next;
}

// The smallest total over every node both searches have reached.
int best_meeting(const std::vector<int>& from_start, const std::vector<int>& from_target, int n) {
    int best = -1;
    for (int v = 0; v < n; v++) {
        if (from_start[v] >= 0 && from_target[v] >= 0) {
            int total = from_start[v] + from_target[v];
            if (best < 0 || total < best) {
                best = total;
            }
        }
    }
    return best;
}

// Expand one whole layer on the smaller side, then minimise over meetings.
Edge bidirectional(const std::vector<std::vector<int>>& neighbours, int start, int target) {
    int n = static_cast<int>(neighbours.size());
    if (start == target) {
        return Edge(0, 1);
    }
    std::vector<int> from_start(n, -1);
    std::vector<int> from_target(n, -1);
    from_start[start] = 0;
    from_target[target] = 0;
    std::vector<int> front_a;
    front_a.push_back(start);
    std::vector<int> front_b;
    front_b.push_back(target);
    int touched = 2;
    while (!front_a.empty() && !front_b.empty()) {
        if (front_a.size() <= front_b.size()) {
            front_a = expand_layer(neighbours, from_start, front_a);
            touched += static_cast<int>(front_a.size());
        } else {
            front_b = expand_layer(neighbours, from_target, front_b);
            touched += static_cast<int>(front_b.size());
        }
        int best = best_meeting(from_start, from_target, n);
        if (best >= 0) {
            return Edge(best, touched);
        }
    }
    return Edge(-1, touched);
}

// The tempting version: two queues, one node each, stop the moment they touch.
int bidirectional_node_at_a_time(const std::vector<std::vector<int>>& neighbours,
                                 int start, int target) {
    int n = static_cast<int>(neighbours.size());
    if (start == target) {
        return 0;
    }
    std::vector<int> from_start(n, -1);
    std::vector<int> from_target(n, -1);
    from_start[start] = 0;
    from_target[target] = 0;
    std::vector<int> queue_a;
    queue_a.push_back(start);
    std::vector<int> queue_b;
    queue_b.push_back(target);
    size_t head_a = 0;
    size_t head_b = 0;
    while (head_a < queue_a.size() || head_b < queue_b.size()) {
        if (head_a < queue_a.size()) {
            int v = queue_a[head_a];
            head_a++;
            for (int u : neighbours[v]) {
                if (from_start[u] < 0) {
                    from_start[u] = from_start[v] + 1;
                    if (from_target[u] >= 0) {
                        return from_start[u] + from_target[u];
                    }
                    queue_a.push_back(u);
                }
            }
        }
        if (head_b < queue_b.size()) {
            int v = queue_b[head_b];
            head_b++;
            for (int u : neighbours[v]) {
                if (from_target[u] < 0) {
                    from_target[u] = from_target[v] + 1;
                    if (from_start[u] >= 0) {
                        return from_start[u] + from_target[u];
                    }
                    queue_b.push_back(u);
                }
            }
        }
    }
    return -1;
}

// A cycle. Each layer holds two nodes however far the search goes.
std::vector<Edge> ring(int n) {
    std::vector<Edge> edges;
    for (int v = 0; v < n; v++) {
        edges.push_back(Edge(v, (v + 1) % n));
    }
    return edges;
}

// A complete binary tree. Each layer downwards is twice the one above.
std::vector<Edge> binary_tree(int depth) {
    int n = (1 << depth) - 1;
    std::vector<Edge> edges;
    for (int v = 1; v < n; v++) {
        edges.push_back(Edge((v - 1) / 2, v));
    }
    return edges;
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
    int tree_n = (1 << 14) - 1;
    std::vector<std::string> names = {"ring of 200", "binary tree, depth 14"};
    std::vector<int> counts = {200, tree_n};
    std::vector<std::vector<Edge>> shapes = {ring(200), binary_tree(14)};
    std::vector<int> starts = {0, 0};
    std::vector<int> targets = {100, tree_n - 1};

    std::cout << std::left << std::setw(24) << "shape" << std::right << std::setw(10) << "distance"
              << std::setw(14) << "one-way pops" << std::setw(19) << "both ways touched" << "\\n";
    for (size_t c = 0; c < names.size(); c++) {
        std::vector<std::vector<int>> neighbours = build(counts[c], shapes[c]);
        Edge one = bfs_distance(neighbours, starts[c], targets[c]);
        Edge both = bidirectional(neighbours, starts[c], targets[c]);
        if (one.first != both.first) {
            std::cout << "MISMATCH\\n";
        }
        std::cout << std::left << std::setw(24) << names[c] << std::right << std::setw(10) << one.first
                  << std::setw(14) << one.second << std::setw(19) << both.second << "\\n";
    }
    std::cout << "\\n";

    int trials = 3000;
    int both_ok = 0;
    int early_ok = 0;
    int early_over = 0;
    int early_under = 0;
    std::vector<std::vector<Edge>> example_edges;
    std::vector<Edge> example_answers;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(8);
        std::vector<Edge> edges;
        for (int u = 0; u < n; u++) {
            for (int v = u + 1; v < n; v++) {
                if (rand_below(3) == 0) {
                    edges.push_back(Edge(u, v));
                }
            }
        }
        std::vector<std::vector<int>> neighbours = build(n, edges);
        int target = n - 1;
        int truth = bfs_distance(neighbours, 0, target).first;
        int both = bidirectional(neighbours, 0, target).first;
        int guess = bidirectional_node_at_a_time(neighbours, 0, target);
        if (both == truth) {
            both_ok++;
        }
        if (guess == truth) {
            early_ok++;
        } else {
            if (example_edges.size() < 2) {
                example_edges.push_back(edges);
                example_answers.push_back(Edge(truth, guess));
            }
            if (truth >= 0 && guess > truth) {
                early_over++;
            }
            if (truth >= 0 && guess < truth) {
                early_under++;
            }
        }
    }

    std::cout << "over " << trials << " random graphs on up to 9 nodes:\\n";
    std::cout << "  layer at a time, best meeting  " << std::setw(6) << both_ok << "\\n";
    std::cout << "  node at a time, first meeting  " << std::setw(6) << early_ok << "\\n";
    std::cout << "\\n";
    std::cout << "the second one was too long on " << early_over << " graphs and too short on "
              << early_under << ".\\n";
    std::cout << "Here are the first two it got wrong:\\n";
    std::cout << "\\n";
    std::cout << std::left << std::setw(58) << "edges" << std::right << std::setw(6) << "true"
              << std::setw(7) << "guess" << "\\n";
    for (size_t i = 0; i < example_edges.size(); i++) {
        std::cout << std::left << std::setw(58) << show_edges(example_edges[i])
                  << std::right << std::setw(6) << example_answers[i].first
                  << std::setw(7) << example_answers[i].second << "\\n";
    }
    std::cout << "\\n";
    std::cout << "Two frontiers can touch in several places at once, and the first place\\n";
    std::cout << "found is whichever the neighbour order reached first, not the cheapest.\\n";
    std::cout << "Expanding one node at a time makes that worse, because the two sides are\\n";
    std::cout << "no longer at comparable depths when they meet. Finish the layer, then\\n";
    std::cout << "minimise over every node both sides have reached. And note where the\\n";
    std::cout << "saving actually is: on a ring, where every layer holds two nodes, there\\n";
    std::cout << "is none. It is the branching factor in the exponent that halves.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// The layer structure is not only the explanation of why breadth-first search is
// correct. It is something to exploit.
//
// Searching from both ends at once and meeting in the middle covers the same
// distance with two searches of half the depth. Where each layer is b times the
// last, that is 2 * b^(d/2) nodes instead of b^d, which is the reason a word
// ladder or a puzzle solver is written this way.
//
// It also has a stopping rule that is easy to get wrong, and the wrong version
// is wrong rarely enough to survive a test suite. Both are here, scored against
// a plain breadth-first search.

fn build(n: usize, edges: &[(usize, usize)]) -> Vec<Vec<usize>> {
    let mut neighbours = vec![Vec::new(); n];
    for &(u, v) in edges {
        neighbours[u].push(v);
        neighbours[v].push(u);
    }
    neighbours
}

/// The plain search, and the number of nodes it took off the queue.
fn bfs_distance(neighbours: &[Vec<usize>], start: usize, target: usize) -> (i32, i32) {
    let n = neighbours.len();
    let mut distance = vec![-1i32; n];
    distance[start] = 0;
    let mut queue = vec![start];
    let mut head = 0;
    let mut popped = 0;
    while head < queue.len() {
        let v = queue[head];
        head += 1;
        popped += 1;
        if v == target {
            return (distance[v], popped);
        }
        for i in 0..neighbours[v].len() {
            let u = neighbours[v][i];
            if distance[u] < 0 {
                distance[u] = distance[v] + 1;
                queue.push(u);
            }
        }
    }
    (-1, popped)
}

/// One whole layer of a breadth-first search. Returns the next frontier.
fn expand_layer(neighbours: &[Vec<usize>], distance: &mut Vec<i32>, frontier: &[usize]) -> Vec<usize> {
    let mut next = Vec::new();
    for &v in frontier {
        for i in 0..neighbours[v].len() {
            let u = neighbours[v][i];
            if distance[u] < 0 {
                distance[u] = distance[v] + 1;
                next.push(u);
            }
        }
    }
    next
}

/// The smallest total over every node both searches have reached.
fn best_meeting(from_start: &[i32], from_target: &[i32], n: usize) -> i32 {
    let mut best = -1;
    for v in 0..n {
        if from_start[v] >= 0 && from_target[v] >= 0 {
            let total = from_start[v] + from_target[v];
            if best < 0 || total < best {
                best = total;
            }
        }
    }
    best
}

/// Expand one whole layer on the smaller side, then minimise over meetings.
fn bidirectional(neighbours: &[Vec<usize>], start: usize, target: usize) -> (i32, i32) {
    let n = neighbours.len();
    if start == target {
        return (0, 1);
    }
    let mut from_start = vec![-1i32; n];
    let mut from_target = vec![-1i32; n];
    from_start[start] = 0;
    from_target[target] = 0;
    let mut front_a = vec![start];
    let mut front_b = vec![target];
    let mut touched = 2;
    while !front_a.is_empty() && !front_b.is_empty() {
        if front_a.len() <= front_b.len() {
            front_a = expand_layer(neighbours, &mut from_start, &front_a);
            touched += front_a.len() as i32;
        } else {
            front_b = expand_layer(neighbours, &mut from_target, &front_b);
            touched += front_b.len() as i32;
        }
        let best = best_meeting(&from_start, &from_target, n);
        if best >= 0 {
            return (best, touched);
        }
    }
    (-1, touched)
}

/// The tempting version: two queues, one node each, stop the moment they touch.
fn bidirectional_node_at_a_time(neighbours: &[Vec<usize>], start: usize, target: usize) -> i32 {
    let n = neighbours.len();
    if start == target {
        return 0;
    }
    let mut from_start = vec![-1i32; n];
    let mut from_target = vec![-1i32; n];
    from_start[start] = 0;
    from_target[target] = 0;
    let mut queue_a = vec![start];
    let mut queue_b = vec![target];
    let mut head_a = 0;
    let mut head_b = 0;
    while head_a < queue_a.len() || head_b < queue_b.len() {
        if head_a < queue_a.len() {
            let v = queue_a[head_a];
            head_a += 1;
            for i in 0..neighbours[v].len() {
                let u = neighbours[v][i];
                if from_start[u] < 0 {
                    from_start[u] = from_start[v] + 1;
                    if from_target[u] >= 0 {
                        return from_start[u] + from_target[u];
                    }
                    queue_a.push(u);
                }
            }
        }
        if head_b < queue_b.len() {
            let v = queue_b[head_b];
            head_b += 1;
            for i in 0..neighbours[v].len() {
                let u = neighbours[v][i];
                if from_target[u] < 0 {
                    from_target[u] = from_target[v] + 1;
                    if from_start[u] >= 0 {
                        return from_start[u] + from_target[u];
                    }
                    queue_b.push(u);
                }
            }
        }
    }
    -1
}

/// A cycle. Each layer holds two nodes however far the search goes.
fn ring(n: usize) -> Vec<(usize, usize)> {
    (0..n).map(|v| (v, (v + 1) % n)).collect()
}

/// A complete binary tree. Each layer downwards is twice the one above.
fn binary_tree(depth: u32) -> (usize, Vec<(usize, usize)>) {
    let n = (1usize << depth) - 1;
    let edges = (1..n).map(|v| ((v - 1) / 2, v)).collect();
    (n, edges)
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
    let (tree_n, tree_edges) = binary_tree(14);
    let names = ["ring of 200", "binary tree, depth 14"];
    let counts: Vec<usize> = vec![200, tree_n];
    let shapes: Vec<Vec<(usize, usize)>> = vec![ring(200), tree_edges];
    let starts: Vec<usize> = vec![0, 0];
    let targets: Vec<usize> = vec![100, tree_n - 1];

    println!(
        "{}{}{}{}",
        pad_right("shape", 24),
        pad_left("distance", 10),
        pad_left("one-way pops", 14),
        pad_left("both ways touched", 19)
    );
    for (c, name) in names.iter().enumerate() {
        let neighbours = build(counts[c], &shapes[c]);
        let (one, popped) = bfs_distance(&neighbours, starts[c], targets[c]);
        let (both, touched) = bidirectional(&neighbours, starts[c], targets[c]);
        if one != both {
            println!("MISMATCH");
        }
        println!(
            "{}{}{}{}",
            pad_right(name, 24),
            pad_left(&one.to_string(), 10),
            pad_left(&popped.to_string(), 14),
            pad_left(&touched.to_string(), 19)
        );
    }
    println!();

    let mut rng = Rng { seed: 1 };
    let trials = 3000;
    let mut both_ok = 0;
    let mut early_ok = 0;
    let mut early_over = 0;
    let mut early_under = 0;
    let mut example_edges: Vec<Vec<(usize, usize)>> = Vec::new();
    let mut example_answers: Vec<(i32, i32)> = Vec::new();
    for _ in 0..trials {
        let n = (2 + rng.next(8)) as usize;
        let mut edges: Vec<(usize, usize)> = Vec::new();
        for u in 0..n {
            for v in (u + 1)..n {
                if rng.next(3) == 0 {
                    edges.push((u, v));
                }
            }
        }
        let neighbours = build(n, &edges);
        let target = n - 1;
        let (truth, _) = bfs_distance(&neighbours, 0, target);
        let (both, _) = bidirectional(&neighbours, 0, target);
        let guess = bidirectional_node_at_a_time(&neighbours, 0, target);
        if both == truth {
            both_ok += 1;
        }
        if guess == truth {
            early_ok += 1;
        } else {
            if example_edges.len() < 2 {
                example_edges.push(edges.clone());
                example_answers.push((truth, guess));
            }
            if truth >= 0 && guess > truth {
                early_over += 1;
            }
            if truth >= 0 && guess < truth {
                early_under += 1;
            }
        }
    }

    println!("over {} random graphs on up to 9 nodes:", trials);
    println!("  layer at a time, best meeting  {}", pad_left(&both_ok.to_string(), 6));
    println!("  node at a time, first meeting  {}", pad_left(&early_ok.to_string(), 6));
    println!();
    println!(
        "the second one was too long on {} graphs and too short on {}.",
        early_over, early_under
    );
    println!("Here are the first two it got wrong:");
    println!();
    println!(
        "{}{}{}",
        pad_right("edges", 58),
        pad_left("true", 6),
        pad_left("guess", 7)
    );
    for (i, edges) in example_edges.iter().enumerate() {
        println!(
            "{}{}{}",
            pad_right(&show_edges(edges), 58),
            pad_left(&example_answers[i].0.to_string(), 6),
            pad_left(&example_answers[i].1.to_string(), 7)
        );
    }
    println!();
    println!("Two frontiers can touch in several places at once, and the first place");
    println!("found is whichever the neighbour order reached first, not the cheapest.");
    println!("Expanding one node at a time makes that worse, because the two sides are");
    println!("no longer at comparable depths when they meet. Finish the layer, then");
    println!("minimise over every node both sides have reached. And note where the");
    println!("saving actually is: on a ring, where every layer holds two nodes, there");
    println!("is none. It is the branching factor in the exponent that halves.");
}
`,
            },
            {
              lang: "go",
              code: `// The layer structure is not only the explanation of why breadth-first search is
// correct. It is something to exploit.
//
// Searching from both ends at once and meeting in the middle covers the same
// distance with two searches of half the depth. Where each layer is b times the
// last, that is 2 * b^(d/2) nodes instead of b^d, which is the reason a word
// ladder or a puzzle solver is written this way.
//
// It also has a stopping rule that is easy to get wrong, and the wrong version
// is wrong rarely enough to survive a test suite. Both are here, scored against
// a plain breadth-first search.

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

// The plain search, and the number of nodes it took off the queue.
func bfsDistance(neighbours [][]int, start, target int) (int, int) {
	n := len(neighbours)
	distance := make([]int, n)
	for i := range distance {
		distance[i] = -1
	}
	distance[start] = 0
	queue := []int{start}
	head := 0
	popped := 0
	for head < len(queue) {
		v := queue[head]
		head++
		popped++
		if v == target {
			return distance[v], popped
		}
		for _, u := range neighbours[v] {
			if distance[u] < 0 {
				distance[u] = distance[v] + 1
				queue = append(queue, u)
			}
		}
	}
	return -1, popped
}

// One whole layer of a breadth-first search. Returns the next frontier.
func expandLayer(neighbours [][]int, distance []int, frontier []int) []int {
	next := []int{}
	for _, v := range frontier {
		for _, u := range neighbours[v] {
			if distance[u] < 0 {
				distance[u] = distance[v] + 1
				next = append(next, u)
			}
		}
	}
	return next
}

// The smallest total over every node both searches have reached.
func bestMeeting(fromStart, fromTarget []int, n int) int {
	best := -1
	for v := 0; v < n; v++ {
		if fromStart[v] >= 0 && fromTarget[v] >= 0 {
			total := fromStart[v] + fromTarget[v]
			if best < 0 || total < best {
				best = total
			}
		}
	}
	return best
}

// Expand one whole layer on the smaller side, then minimise over meetings.
func bidirectional(neighbours [][]int, start, target int) (int, int) {
	n := len(neighbours)
	if start == target {
		return 0, 1
	}
	fromStart := make([]int, n)
	fromTarget := make([]int, n)
	for i := 0; i < n; i++ {
		fromStart[i] = -1
		fromTarget[i] = -1
	}
	fromStart[start] = 0
	fromTarget[target] = 0
	frontA := []int{start}
	frontB := []int{target}
	touched := 2
	for len(frontA) > 0 && len(frontB) > 0 {
		if len(frontA) <= len(frontB) {
			frontA = expandLayer(neighbours, fromStart, frontA)
			touched += len(frontA)
		} else {
			frontB = expandLayer(neighbours, fromTarget, frontB)
			touched += len(frontB)
		}
		best := bestMeeting(fromStart, fromTarget, n)
		if best >= 0 {
			return best, touched
		}
	}
	return -1, touched
}

// The tempting version: two queues, one node each, stop the moment they touch.
func bidirectionalNodeAtATime(neighbours [][]int, start, target int) int {
	n := len(neighbours)
	if start == target {
		return 0
	}
	fromStart := make([]int, n)
	fromTarget := make([]int, n)
	for i := 0; i < n; i++ {
		fromStart[i] = -1
		fromTarget[i] = -1
	}
	fromStart[start] = 0
	fromTarget[target] = 0
	queueA := []int{start}
	queueB := []int{target}
	headA := 0
	headB := 0
	for headA < len(queueA) || headB < len(queueB) {
		if headA < len(queueA) {
			v := queueA[headA]
			headA++
			for _, u := range neighbours[v] {
				if fromStart[u] < 0 {
					fromStart[u] = fromStart[v] + 1
					if fromTarget[u] >= 0 {
						return fromStart[u] + fromTarget[u]
					}
					queueA = append(queueA, u)
				}
			}
		}
		if headB < len(queueB) {
			v := queueB[headB]
			headB++
			for _, u := range neighbours[v] {
				if fromTarget[u] < 0 {
					fromTarget[u] = fromTarget[v] + 1
					if fromStart[u] >= 0 {
						return fromStart[u] + fromTarget[u]
					}
					queueB = append(queueB, u)
				}
			}
		}
	}
	return -1
}

// A cycle. Each layer holds two nodes however far the search goes.
func ring(n int) []edge {
	edges := []edge{}
	for v := 0; v < n; v++ {
		edges = append(edges, edge{v, (v + 1) % n})
	}
	return edges
}

// A complete binary tree. Each layer downwards is twice the one above.
func binaryTree(depth int) (int, []edge) {
	n := (1 << depth) - 1
	edges := []edge{}
	for v := 1; v < n; v++ {
		edges = append(edges, edge{(v - 1) / 2, v})
	}
	return n, edges
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
	treeN, treeEdges := binaryTree(14)
	names := []string{"ring of 200", "binary tree, depth 14"}
	counts := []int{200, treeN}
	shapes := [][]edge{ring(200), treeEdges}
	starts := []int{0, 0}
	targets := []int{100, treeN - 1}

	fmt.Printf("%-24s%10s%14s%19s\\n", "shape", "distance", "one-way pops", "both ways touched")
	for c, name := range names {
		neighbours := build(counts[c], shapes[c])
		one, popped := bfsDistance(neighbours, starts[c], targets[c])
		both, touched := bidirectional(neighbours, starts[c], targets[c])
		if one != both {
			fmt.Println("MISMATCH")
		}
		fmt.Printf("%-24s%10d%14d%19d\\n", name, one, popped, touched)
	}
	fmt.Println()

	trials := 3000
	bothOk := 0
	earlyOk := 0
	earlyOver := 0
	earlyUnder := 0
	exampleEdges := [][]edge{}
	exampleAnswers := [][2]int{}
	for t := 0; t < trials; t++ {
		n := 2 + rand(8)
		edges := []edge{}
		for u := 0; u < n; u++ {
			for v := u + 1; v < n; v++ {
				if rand(3) == 0 {
					edges = append(edges, edge{u, v})
				}
			}
		}
		neighbours := build(n, edges)
		target := n - 1
		truth, _ := bfsDistance(neighbours, 0, target)
		both, _ := bidirectional(neighbours, 0, target)
		guess := bidirectionalNodeAtATime(neighbours, 0, target)
		if both == truth {
			bothOk++
		}
		if guess == truth {
			earlyOk++
		} else {
			if len(exampleEdges) < 2 {
				exampleEdges = append(exampleEdges, edges)
				exampleAnswers = append(exampleAnswers, [2]int{truth, guess})
			}
			if truth >= 0 && guess > truth {
				earlyOver++
			}
			if truth >= 0 && guess < truth {
				earlyUnder++
			}
		}
	}

	fmt.Printf("over %d random graphs on up to 9 nodes:\\n", trials)
	fmt.Printf("  layer at a time, best meeting  %6d\\n", bothOk)
	fmt.Printf("  node at a time, first meeting  %6d\\n", earlyOk)
	fmt.Println()
	fmt.Printf("the second one was too long on %d graphs and too short on %d.\\n", earlyOver, earlyUnder)
	fmt.Println("Here are the first two it got wrong:")
	fmt.Println()
	fmt.Printf("%-58s%6s%7s\\n", "edges", "true", "guess")
	for i, edges := range exampleEdges {
		fmt.Printf("%-58s%6d%7d\\n", showEdges(edges), exampleAnswers[i][0], exampleAnswers[i][1])
	}
	fmt.Println()
	fmt.Println("Two frontiers can touch in several places at once, and the first place")
	fmt.Println("found is whichever the neighbour order reached first, not the cheapest.")
	fmt.Println("Expanding one node at a time makes that worse, because the two sides are")
	fmt.Println("no longer at comparable depths when they meet. Finish the layer, then")
	fmt.Println("minimise over every node both sides have reached. And note where the")
	fmt.Println("saving actually is: on a ring, where every layer holds two nodes, there")
	fmt.Println("is none. It is the branching factor in the exponent that halves.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Stopping at the first meeting node",
          body: "Two frontiers can overlap in several places at once, and the first one the loop notices is an artefact of neighbour order. The node-at-a-time version was right on 2,992 of 3,000 graphs and too long on 8 -- rare enough to pass tests, common enough to be a real bug. Finish the layer, then minimise over every shared node.",
        },
        {
          title: "Expecting a saving where there is no branching factor",
          body: "On a ring of 200 the two-way search touched 202 nodes against 200 popped one way. The square-root saving comes from halving an exponent, so a graph whose layers do not grow has nothing to give. Check the shape before adding the complexity.",
        },
      ],
    },
    {
      id: "breadth-first-in-order",
      heading: "Breadth-first search, in the order it matters",
      body: [
        "So the whole of breadth-first search, in the order it matters.",
        "**It answers \"fewest edges\" and it is exact.** The queue holds at most two consecutive distances and hands them back in order, so the first time a node is reached is by a shortest route. Both facts are checkable in a running program, and were true 3,000 times out of 3,000 here.",
        "**The parent array gives the route and costs one array.** No second pass, no re-search.",
        "**Many sources cost nothing extra.** Seed the queue with all of them at distance zero. The invariant is about ascending order, and a queue of zeroes is ascending.",
        "**Searching from both ends squares the root of the work, when there is a branching factor to halve** \u2014 and needs a stopping rule that finishes the layer before choosing a meeting point.",
        "**And the one assumption underneath all of it is that every edge costs the same.** That is what the next module removes.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does BFS find the shortest path?",
      answer:
        "Because of an invariant on the queue rather than anything about the graph. Every node is given a distance exactly one more than the node being expanded, and nodes come off the queue in ascending order of distance -- so at any moment the queue holds at most two consecutive distance values. That means the first time a node is discovered, it is discovered from the nearest layer that touches it, which is a shortest path in edges. Both halves of that are checkable while the program runs: on 3,000 random graphs the queue spanned at most two layers every time and the distances came off in ascending order every time, and the resulting distances matched an exhaustive search over every simple path. The assumption doing the work is that every edge adds one. Put weights on and the queue stops being sorted by cost, which is exactly why Dijkstra swaps the queue for a heap.",
    },
    {
      question: "How would you return the path rather than just the length?",
      answer:
        "One extra array. When a node is first discovered, record which node discovered it; at the end, walk that array back from the target and reverse. Each node has exactly one first-discoverer, so those links form a tree and the walk gives a shortest path. It costs O(V) memory and no extra time, and I would check two things on it: that every consecutive pair really is an edge, and that the path length equals the distance the search reported. The alternatives -- re-searching from the target, or storing a whole path list at each node -- do strictly more work for the same answer.",
    },
    {
      question: "You need the distance from each cell to the nearest of several exits. How?",
      answer:
        "One breadth-first search with every exit in the queue at distance zero. It is not a special algorithm; it is the same loop, and it works because the invariant is that the queue is in ascending order of distance, which a queue of zeroes satisfies. So the whole grid gets its distance-to-nearest-exit in one pass, O(V + E), independent of how many exits there are. The alternative -- a separate search per source, taking the minimum -- gives identical answers and costs a factor of the number of sources; I measured both on 3,000 random graphs and they agreed every time, at 3,000 searches against 5,076. This is the standard shape for rotting oranges, nearest-facility, and multi-entry maze problems.",
    },
  ],
  takeaways: [
    "Breadth-first search is a shortest-path algorithm, and the reason is an invariant on the queue.",
    "The queue holds at most two consecutive distances and hands them back in ascending order \u2014 3,000 of 3,000 on both counts.",
    "So the first time a node is reached is by a shortest route, which matched exhaustive search 3,000 times out of 3,000.",
    "The whole argument rests on every edge adding exactly one; weights break it.",
    "One parent array turns the search into a route: walk it back from the target and reverse.",
    "Many sources cost nothing \u2014 seed the queue with all of them at distance zero, because a queue of zeroes is still ascending.",
    "Multi-source agreed with one-search-per-source 3,000 times, running 3,000 searches instead of 5,076.",
    "Searching from both ends turns `b^d` into `2 * b^(d/2)`: 16,383 pops against 109 touched on a binary tree of depth 14.",
    "There is no saving without a branching factor: on a ring of 200 it was 202 against 200.",
    "Stop the two-way search only after a full layer, then minimise over every shared node \u2014 the node-at-a-time version was too long on 8 of 3,000.",
  ],
  status: "available",
};
