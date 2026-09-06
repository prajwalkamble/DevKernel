import type { Lesson } from "@/content/types";

export const visitedSetLesson: Lesson = {
  id: "dsa-graphs-the-visited-set",
  slug: "the-visited-set",
  moduleSlug: "graphs",
  title: "The Visited Set",
  summary:
    "The three separate decisions hidden in one variable name: where to mark a node, which of the two meanings of \u201cvisited\u201d the question needs, and what the set is actually stored in once nodes stop being small integers \u2014 each one measured, including the two that change nothing but the cost and the one that changes the answer.",
  estimatedMinutes: 45,
  objectives: [
    "Mark on enqueue, and say what marking on dequeue costs",
    "Distinguish a global visited set from a path-local one, and pick by the question",
    "Recognise the two failures \u2014 silent undercounting and exponential blow-up",
    "Choose a container for the visited set once nodes are states rather than indices",
  ],
  sections: [
    {
      id: "where-to-mark",
      heading: "Where to mark",
      body: [
        "The visited set is the smallest part of a graph search and the part that decides whether it terminates, what it costs, and \u2014 in one case \u2014 what question it answers. It is worth three separate looks. The first is the simplest: where to mark.",
        "There are two plausible places. **On enqueue**: mark the node the moment it is pushed, so the queue holds each node at most once. **On dequeue**: push whatever looks unvisited and check again when it comes off, skipping if it has been dealt with since. Both give the same distances \u2014 3,000 out of 3,000 on random graphs \u2014 which is exactly why the difference survives review.",
        "What differs is the size of the queue. Marking on enqueue bounds it by the number of nodes. Marking on dequeue bounds it by the number of *edges*, because a node gets pushed once for every edge that reaches it before it is finally popped. On the complete graph of 200 nodes in the example that is 19,901 queue entries against 200.",
        "On a sparse graph the difference is small and it does not matter. On a dense one it is the difference between `O(V)` and `O(E)` memory, and `E` can be `V` squared. Marking on enqueue costs nothing and removes the question, so it is the default.",
        "And with no marking at all the search does not terminate. The measurement makes that sharper than the usual statement about cycles: over 3,000 random graphs, the unmarked search ended on exactly the 931 graphs where the start node had no edges at all. In an undirected graph a single edge is already a cycle of length two \u2014 the search walks back and forth along it forever \u2014 so it is not \"graphs with cycles\" that break, it is every graph with an edge.",
      ],
      examples: [
        {
          id: "enqueue-against-dequeue",
          title: "The same search with the mark in two places, and with no mark at all",
          lang: "python",
          code: `# Where to mark a node visited. There are two plausible places and they are not
# equivalent.
#
#   on enqueue -- mark it the moment it is pushed. The queue then holds each
#                 node at most once.
#   on dequeue -- push whatever looks unvisited, and check again when it comes
#                 off. The answers are the same. The queue is not.
#
# Both are correct about distances. The second one puts a node on the queue once
# per edge that reaches it, so the queue grows with the edges rather than the
# nodes, and on a dense graph that is the difference between n and n squared.
#
# And with no marking at all, a graph with a cycle never terminates. The third
# function here is capped so it can be measured rather than merely asserted.


def build(n, edges):
    neighbours = [[] for _ in range(n)]
    for u, v in edges:
        neighbours[u].append(v)
        neighbours[v].append(u)
    return neighbours


def mark_on_enqueue(neighbours, start):
    """Mark when pushing. Every node enters the queue at most once."""
    n = len(neighbours)
    distance = [-1] * n
    distance[start] = 0
    queue = [start]
    head = 0
    pushes = 1
    while head < len(queue):
        v = queue[head]
        head += 1
        for u in neighbours[v]:
            if distance[u] < 0:
                distance[u] = distance[v] + 1
                queue.append(u)
                pushes += 1
    return distance, pushes, len(queue)


def mark_on_dequeue(neighbours, start):
    """Mark when popping. Same answers, one queue entry per edge that reaches it."""
    n = len(neighbours)
    distance = [-1] * n
    seen = [False] * n
    queue = [(start, 0)]
    head = 0
    pushes = 1
    while head < len(queue):
        v, d = queue[head]
        head += 1
        if seen[v]:
            continue
        seen[v] = True
        distance[v] = d
        for u in neighbours[v]:
            if not seen[u]:
                queue.append((u, d + 1))
                pushes += 1
    return distance, pushes, len(queue)


def no_marking(neighbours, start, cap):
    """No visited set at all. Capped, because otherwise this does not return."""
    queue = [(start, 0)]
    head = 0
    pushes = 1
    while head < len(queue):
        if pushes >= cap:
            return -1, pushes
        v, d = queue[head]
        head += 1
        for u in neighbours[v]:
            queue.append((u, d + 1))
            pushes += 1
    return 0, pushes


def same(a, b):
    if len(a) != len(b):
        return False
    for i in range(len(a)):
        if a[i] != b[i]:
            return False
    return True


def complete_graph(n):
    return [(u, v) for u in range(n) for v in range(u + 1, n)]


def path_edges(n):
    return [(v, v + 1) for v in range(n - 1)]


SHAPES = [
    ("path of 200", 200, path_edges(200)),
    ("complete graph, 60", 60, complete_graph(60)),
    ("complete graph, 200", 200, complete_graph(200)),
]

print(f"{'shape':<22}{'nodes':>7}{'edges':>8}{'pushes, on enqueue':>20}{'pushes, on dequeue':>20}")
for name, n, edges in SHAPES:
    neighbours = build(n, edges)
    early, pushes_early, _ = mark_on_enqueue(neighbours, 0)
    late, pushes_late, _ = mark_on_dequeue(neighbours, 0)
    if not same(early, late):
        print("MISMATCH")
    print(f"{name:<22}{n:>7}{len(edges):>8}{pushes_early:>20}{pushes_late:>20}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
agreed = 0
early_pushes = 0
late_pushes = 0
uncapped = 0
start_isolated = 0
CAP = 100000
for _ in range(TRIALS):
    n = 2 + rand(6)
    edges = []
    for u in range(n):
        for v in range(u + 1, n):
            if rand(3) == 0:
                edges.append((u, v))
    neighbours = build(n, edges)
    early, pushes_early, _ = mark_on_enqueue(neighbours, 0)
    late, pushes_late, _ = mark_on_dequeue(neighbours, 0)
    if same(early, late):
        agreed += 1
    early_pushes += pushes_early
    late_pushes += pushes_late
    done, _ = no_marking(neighbours, 0, CAP)
    if done == 0:
        uncapped += 1
    if len(neighbours[0]) == 0:
        start_isolated += 1

print(f"over {TRIALS} random graphs on up to 7 nodes:")
print(f"  the two markings gave the same distances {agreed:>6}")
print(f"  queue pushes, marking on enqueue         {early_pushes:>6}")
print(f"  queue pushes, marking on dequeue         {late_pushes:>6}")
print(f"  no marking at all, searches that ended   {uncapped:>6}")
print(f"  graphs where the start had no edges      {start_isolated:>6}")
print()
print("The answers never differ, which is why this survives review. The cost")
print("does. Marking on enqueue bounds the queue by the number of nodes;")
print("marking on dequeue bounds it by the number of edges, and on the complete")
print("graph of 200 above that is 19,901 entries against 200.")
print()
print("The last two lines are the same number, and that is the point. With no")
print("marking the search ended only on the graphs where the start had no edges")
print("at all -- because in an undirected graph a single edge is already a cycle")
print("of length two, and the search walks back and forth along it forever. The")
print(f"cap of {CAP} pushes is the only reason those runs returned.")
`,
          output: `shape                   nodes   edges  pushes, on enqueue  pushes, on dequeue
path of 200               200     199                 200                 200
complete graph, 60         60    1770                  60                1771
complete graph, 200       200   19900                 200               19901

over 3000 random graphs on up to 7 nodes:
  the two markings gave the same distances   3000
  queue pushes, marking on enqueue           9457
  queue pushes, marking on dequeue          10947
  no marking at all, searches that ended      931
  graphs where the start had no edges         931

The answers never differ, which is why this survives review. The cost
does. Marking on enqueue bounds the queue by the number of nodes;
marking on dequeue bounds it by the number of edges, and on the complete
graph of 200 above that is 19,901 entries against 200.

The last two lines are the same number, and that is the point. With no
marking the search ended only on the graphs where the start had no edges
at all -- because in an undirected graph a single edge is already a cycle
of length two, and the search walks back and forth along it forever. The
cap of 100000 pushes is the only reason those runs returned.`,
          explanation:
            "The same breadth-first search with the mark placed at two different points, and once with no mark at all. The distances never differ; the queue does, by a factor of the density.",
          alternates: [
            {
              lang: "javascript",
              code: `// Where to mark a node visited. There are two plausible places and they are not
// equivalent.
//
//   on enqueue -- mark it the moment it is pushed. The queue then holds each
//                 node at most once.
//   on dequeue -- push whatever looks unvisited, and check again when it comes
//                 off. The answers are the same. The queue is not.
//
// Both are correct about distances. The second one puts a node on the queue once
// per edge that reaches it, so the queue grows with the edges rather than the
// nodes, and on a dense graph that is the difference between n and n squared.
//
// And with no marking at all, a graph with a cycle never terminates. The third
// function here is capped so it can be measured rather than merely asserted.

function build(n, edges) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    neighbours[v].push(u);
  }
  return neighbours;
}

/** Mark when pushing. Every node enters the queue at most once. */
function markOnEnqueue(neighbours, start) {
  const n = neighbours.length;
  const distance = new Array(n).fill(-1);
  distance[start] = 0;
  const queue = [start];
  let head = 0;
  let pushes = 1;
  while (head < queue.length) {
    const v = queue[head];
    head += 1;
    for (const u of neighbours[v]) {
      if (distance[u] < 0) {
        distance[u] = distance[v] + 1;
        queue.push(u);
        pushes += 1;
      }
    }
  }
  return [distance, pushes];
}

/** Mark when popping. Same answers, one queue entry per edge that reaches it. */
function markOnDequeue(neighbours, start) {
  const n = neighbours.length;
  const distance = new Array(n).fill(-1);
  const seen = new Array(n).fill(false);
  const queue = [[start, 0]];
  let head = 0;
  let pushes = 1;
  while (head < queue.length) {
    const [v, d] = queue[head];
    head += 1;
    if (seen[v]) continue;
    seen[v] = true;
    distance[v] = d;
    for (const u of neighbours[v]) {
      if (!seen[u]) {
        queue.push([u, d + 1]);
        pushes += 1;
      }
    }
  }
  return [distance, pushes];
}

/** No visited set at all. Capped, because otherwise this does not return. */
function noMarking(neighbours, start, cap) {
  const queue = [[start, 0]];
  let head = 0;
  let pushes = 1;
  while (head < queue.length) {
    if (pushes >= cap) return -1;
    const [v, d] = queue[head];
    head += 1;
    for (const u of neighbours[v]) {
      queue.push([u, d + 1]);
      pushes += 1;
    }
  }
  return 0;
}

function same(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function completeGraph(n) {
  const edges = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) edges.push([u, v]);
  }
  return edges;
}

function pathEdges(n) {
  const edges = [];
  for (let v = 0; v < n - 1; v += 1) edges.push([v, v + 1]);
  return edges;
}

const padEnd = (v, w) => String(v).padEnd(w);
const pad = (v, w) => String(v).padStart(w);

const SHAPES = [
  ["path of 200", 200, pathEdges(200)],
  ["complete graph, 60", 60, completeGraph(60)],
  ["complete graph, 200", 200, completeGraph(200)],
];

console.log(
  padEnd("shape", 22) +
    pad("nodes", 7) +
    pad("edges", 8) +
    pad("pushes, on enqueue", 20) +
    pad("pushes, on dequeue", 20)
);
for (const [name, n, edges] of SHAPES) {
  const neighbours = build(n, edges);
  const [early, pushesEarly] = markOnEnqueue(neighbours, 0);
  const [late, pushesLate] = markOnDequeue(neighbours, 0);
  if (!same(early, late)) console.log("MISMATCH");
  console.log(padEnd(name, 22) + pad(n, 7) + pad(edges.length, 8) + pad(pushesEarly, 20) + pad(pushesLate, 20));
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
let earlyPushes = 0;
let latePushes = 0;
let uncapped = 0;
let startIsolated = 0;
const CAP = 100000;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) {
      if (rand(3) === 0) edges.push([u, v]);
    }
  }
  const neighbours = build(n, edges);
  const [early, pushesEarly] = markOnEnqueue(neighbours, 0);
  const [late, pushesLate] = markOnDequeue(neighbours, 0);
  if (same(early, late)) agreed += 1;
  earlyPushes += pushesEarly;
  latePushes += pushesLate;
  if (noMarking(neighbours, 0, CAP) === 0) uncapped += 1;
  if (neighbours[0].length === 0) startIsolated += 1;
}

console.log(\`over \${TRIALS} random graphs on up to 7 nodes:\`);
console.log(\`  the two markings gave the same distances \${pad(agreed, 6)}\`);
console.log(\`  queue pushes, marking on enqueue         \${pad(earlyPushes, 6)}\`);
console.log(\`  queue pushes, marking on dequeue         \${pad(latePushes, 6)}\`);
console.log(\`  no marking at all, searches that ended   \${pad(uncapped, 6)}\`);
console.log(\`  graphs where the start had no edges      \${pad(startIsolated, 6)}\`);
console.log();
console.log("The answers never differ, which is why this survives review. The cost");
console.log("does. Marking on enqueue bounds the queue by the number of nodes;");
console.log("marking on dequeue bounds it by the number of edges, and on the complete");
console.log("graph of 200 above that is 19,901 entries against 200.");
console.log();
console.log("The last two lines are the same number, and that is the point. With no");
console.log("marking the search ended only on the graphs where the start had no edges");
console.log("at all -- because in an undirected graph a single edge is already a cycle");
console.log("of length two, and the search walks back and forth along it forever. The");
console.log(\`cap of \${CAP} pushes is the only reason those runs returned.\`);
`,
            },
            {
              lang: "typescript",
              code: `// Where to mark a node visited. There are two plausible places and they are not
// equivalent.
//
//   on enqueue -- mark it the moment it is pushed. The queue then holds each
//                 node at most once.
//   on dequeue -- push whatever looks unvisited, and check again when it comes
//                 off. The answers are the same. The queue is not.
//
// Both are correct about distances. The second one puts a node on the queue once
// per edge that reaches it, so the queue grows with the edges rather than the
// nodes, and on a dense graph that is the difference between n and n squared.
//
// And with no marking at all, a graph with a cycle never terminates. The third
// function here is capped so it can be measured rather than merely asserted.

type Edge = [number, number];

function build(n: number, edges: Edge[]): number[][] {
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    neighbours[v].push(u);
  }
  return neighbours;
}

/** Mark when pushing. Every node enters the queue at most once. */
function markOnEnqueue(neighbours: number[][], start: number): [number[], number] {
  const n = neighbours.length;
  const distance = new Array(n).fill(-1);
  distance[start] = 0;
  const queue = [start];
  let head = 0;
  let pushes = 1;
  while (head < queue.length) {
    const v = queue[head];
    head += 1;
    for (const u of neighbours[v]) {
      if (distance[u] < 0) {
        distance[u] = distance[v] + 1;
        queue.push(u);
        pushes += 1;
      }
    }
  }
  return [distance, pushes];
}

/** Mark when popping. Same answers, one queue entry per edge that reaches it. */
function markOnDequeue(neighbours: number[][], start: number): [number[], number] {
  const n = neighbours.length;
  const distance = new Array(n).fill(-1);
  const seen = new Array(n).fill(false);
  const queue: Edge[] = [[start, 0]];
  let head = 0;
  let pushes = 1;
  while (head < queue.length) {
    const [v, d] = queue[head];
    head += 1;
    if (seen[v]) continue;
    seen[v] = true;
    distance[v] = d;
    for (const u of neighbours[v]) {
      if (!seen[u]) {
        queue.push([u, d + 1]);
        pushes += 1;
      }
    }
  }
  return [distance, pushes];
}

/** No visited set at all. Capped, because otherwise this does not return. */
function noMarking(neighbours: number[][], start: number, cap: number): number {
  const queue: Edge[] = [[start, 0]];
  let head = 0;
  let pushes = 1;
  while (head < queue.length) {
    if (pushes >= cap) return -1;
    const [v, d] = queue[head];
    head += 1;
    for (const u of neighbours[v]) {
      queue.push([u, d + 1]);
      pushes += 1;
    }
  }
  return 0;
}

function same(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function completeGraph(n: number): Edge[] {
  const edges: Edge[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) edges.push([u, v]);
  }
  return edges;
}

function pathEdges(n: number): Edge[] {
  const edges: Edge[] = [];
  for (let v = 0; v < n - 1; v += 1) edges.push([v, v + 1]);
  return edges;
}

const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const pad = (v: string | number, w: number): string => String(v).padStart(w);

const SHAPES: [string, number, Edge[]][] = [
  ["path of 200", 200, pathEdges(200)],
  ["complete graph, 60", 60, completeGraph(60)],
  ["complete graph, 200", 200, completeGraph(200)],
];

console.log(
  padEnd("shape", 22) +
    pad("nodes", 7) +
    pad("edges", 8) +
    pad("pushes, on enqueue", 20) +
    pad("pushes, on dequeue", 20)
);
for (const [name, n, edges] of SHAPES) {
  const neighbours = build(n, edges);
  const [early, pushesEarly] = markOnEnqueue(neighbours, 0);
  const [late, pushesLate] = markOnDequeue(neighbours, 0);
  if (!same(early, late)) console.log("MISMATCH");
  console.log(padEnd(name, 22) + pad(n, 7) + pad(edges.length, 8) + pad(pushesEarly, 20) + pad(pushesLate, 20));
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
let earlyPushes = 0;
let latePushes = 0;
let uncapped = 0;
let startIsolated = 0;
const CAP = 100000;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges: Edge[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) {
      if (rand(3) === 0) edges.push([u, v]);
    }
  }
  const neighbours = build(n, edges);
  const [early, pushesEarly] = markOnEnqueue(neighbours, 0);
  const [late, pushesLate] = markOnDequeue(neighbours, 0);
  if (same(early, late)) agreed += 1;
  earlyPushes += pushesEarly;
  latePushes += pushesLate;
  if (noMarking(neighbours, 0, CAP) === 0) uncapped += 1;
  if (neighbours[0].length === 0) startIsolated += 1;
}

console.log(\`over \${TRIALS} random graphs on up to 7 nodes:\`);
console.log(\`  the two markings gave the same distances \${pad(agreed, 6)}\`);
console.log(\`  queue pushes, marking on enqueue         \${pad(earlyPushes, 6)}\`);
console.log(\`  queue pushes, marking on dequeue         \${pad(latePushes, 6)}\`);
console.log(\`  no marking at all, searches that ended   \${pad(uncapped, 6)}\`);
console.log(\`  graphs where the start had no edges      \${pad(startIsolated, 6)}\`);
console.log();
console.log("The answers never differ, which is why this survives review. The cost");
console.log("does. Marking on enqueue bounds the queue by the number of nodes;");
console.log("marking on dequeue bounds it by the number of edges, and on the complete");
console.log("graph of 200 above that is 19,901 entries against 200.");
console.log();
console.log("The last two lines are the same number, and that is the point. With no");
console.log("marking the search ended only on the graphs where the start had no edges");
console.log("at all -- because in an undirected graph a single edge is already a cycle");
console.log("of length two, and the search walks back and forth along it forever. The");
console.log(\`cap of \${CAP} pushes is the only reason those runs returned.\`);
`,
            },
            {
              lang: "java",
              code: `// Where to mark a node visited. There are two plausible places and they are not
// equivalent.
//
//   on enqueue -- mark it the moment it is pushed. The queue then holds each
//                 node at most once.
//   on dequeue -- push whatever looks unvisited, and check again when it comes
//                 off. The answers are the same. The queue is not.
//
// Both are correct about distances. The second one puts a node on the queue once
// per edge that reaches it, so the queue grows with the edges rather than the
// nodes, and on a dense graph that is the difference between n and n squared.
//
// And with no marking at all, a graph with a cycle never terminates. The third
// function here is capped so it can be measured rather than merely asserted.

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
    static int lastPushes;

    /** Mark when pushing. Every node enters the queue at most once. */
    static void markOnEnqueue(List<List<Integer>> neighbours, int start) {
        int n = neighbours.size();
        int[] distance = new int[n];
        Arrays.fill(distance, -1);
        distance[start] = 0;
        List<Integer> queue = new ArrayList<>();
        queue.add(start);
        int head = 0;
        int pushes = 1;
        while (head < queue.size()) {
            int v = queue.get(head);
            head++;
            for (int u : neighbours.get(v)) {
                if (distance[u] < 0) {
                    distance[u] = distance[v] + 1;
                    queue.add(u);
                    pushes++;
                }
            }
        }
        lastDistance = distance;
        lastPushes = pushes;
    }

    /** Mark when popping. Same answers, one queue entry per edge that reaches it. */
    static void markOnDequeue(List<List<Integer>> neighbours, int start) {
        int n = neighbours.size();
        int[] distance = new int[n];
        Arrays.fill(distance, -1);
        boolean[] seen = new boolean[n];
        List<int[]> queue = new ArrayList<>();
        queue.add(new int[] {start, 0});
        int head = 0;
        int pushes = 1;
        while (head < queue.size()) {
            int[] entry = queue.get(head);
            head++;
            int v = entry[0];
            int d = entry[1];
            if (seen[v]) {
                continue;
            }
            seen[v] = true;
            distance[v] = d;
            for (int u : neighbours.get(v)) {
                if (!seen[u]) {
                    queue.add(new int[] {u, d + 1});
                    pushes++;
                }
            }
        }
        lastDistance = distance;
        lastPushes = pushes;
    }

    /** No visited set at all. Capped, because otherwise this does not return. */
    static int noMarking(List<List<Integer>> neighbours, int start, int cap) {
        List<int[]> queue = new ArrayList<>();
        queue.add(new int[] {start, 0});
        int head = 0;
        int pushes = 1;
        while (head < queue.size()) {
            if (pushes >= cap) {
                return -1;
            }
            int[] entry = queue.get(head);
            head++;
            int d = entry[1];
            for (int u : neighbours.get(entry[0])) {
                queue.add(new int[] {u, d + 1});
                pushes++;
            }
        }
        return 0;
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

    static int[][] completeGraph(int n) {
        List<int[]> edges = new ArrayList<>();
        for (int u = 0; u < n; u++) {
            for (int v = u + 1; v < n; v++) {
                edges.add(new int[] {u, v});
            }
        }
        return edges.toArray(new int[0][]);
    }

    static int[][] pathEdges(int n) {
        int[][] edges = new int[n - 1][2];
        for (int v = 0; v < n - 1; v++) {
            edges[v][0] = v;
            edges[v][1] = v + 1;
        }
        return edges;
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
        String[] names = {"path of 200", "complete graph, 60", "complete graph, 200"};
        int[] counts = {200, 60, 200};
        int[][][] shapes = {pathEdges(200), completeGraph(60), completeGraph(200)};

        System.out.println(padEnd("shape", 22) + pad("nodes", 7) + pad("edges", 8)
                + pad("pushes, on enqueue", 20) + pad("pushes, on dequeue", 20));
        for (int c = 0; c < names.length; c++) {
            List<List<Integer>> neighbours = build(counts[c], shapes[c]);
            markOnEnqueue(neighbours, 0);
            int[] early = lastDistance;
            int pushesEarly = lastPushes;
            markOnDequeue(neighbours, 0);
            int[] late = lastDistance;
            int pushesLate = lastPushes;
            if (!same(early, late)) {
                System.out.println("MISMATCH");
            }
            System.out.println(padEnd(names[c], 22) + pad(String.valueOf(counts[c]), 7)
                    + pad(String.valueOf(shapes[c].length), 8)
                    + pad(String.valueOf(pushesEarly), 20) + pad(String.valueOf(pushesLate), 20));
        }
        System.out.println();

        int trials = 3000;
        int agreed = 0;
        int earlyPushes = 0;
        int latePushes = 0;
        int uncapped = 0;
        int startIsolated = 0;
        int cap = 100000;
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
            markOnEnqueue(neighbours, 0);
            int[] early = lastDistance;
            int pushesEarly = lastPushes;
            markOnDequeue(neighbours, 0);
            int[] late = lastDistance;
            int pushesLate = lastPushes;
            if (same(early, late)) {
                agreed++;
            }
            earlyPushes += pushesEarly;
            latePushes += pushesLate;
            if (noMarking(neighbours, 0, cap) == 0) {
                uncapped++;
            }
            if (neighbours.get(0).isEmpty()) {
                startIsolated++;
            }
        }

        System.out.println("over " + trials + " random graphs on up to 7 nodes:");
        System.out.println("  the two markings gave the same distances " + pad(String.valueOf(agreed), 6));
        System.out.println("  queue pushes, marking on enqueue         " + pad(String.valueOf(earlyPushes), 6));
        System.out.println("  queue pushes, marking on dequeue         " + pad(String.valueOf(latePushes), 6));
        System.out.println("  no marking at all, searches that ended   " + pad(String.valueOf(uncapped), 6));
        System.out.println("  graphs where the start had no edges      " + pad(String.valueOf(startIsolated), 6));
        System.out.println();
        System.out.println("The answers never differ, which is why this survives review. The cost");
        System.out.println("does. Marking on enqueue bounds the queue by the number of nodes;");
        System.out.println("marking on dequeue bounds it by the number of edges, and on the complete");
        System.out.println("graph of 200 above that is 19,901 entries against 200.");
        System.out.println();
        System.out.println("The last two lines are the same number, and that is the point. With no");
        System.out.println("marking the search ended only on the graphs where the start had no edges");
        System.out.println("at all -- because in an undirected graph a single edge is already a cycle");
        System.out.println("of length two, and the search walks back and forth along it forever. The");
        System.out.println("cap of " + cap + " pushes is the only reason those runs returned.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Where to mark a node visited. There are two plausible places and they are not
// equivalent.
//
//   on enqueue -- mark it the moment it is pushed. The queue then holds each
//                 node at most once.
//   on dequeue -- push whatever looks unvisited, and check again when it comes
//                 off. The answers are the same. The queue is not.
//
// Both are correct about distances. The second one puts a node on the queue once
// per edge that reaches it, so the queue grows with the edges rather than the
// nodes, and on a dense graph that is the difference between n and n squared.
//
// And with no marking at all, a graph with a cycle never terminates. The third
// function here is capped so it can be measured rather than merely asserted.

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

// Mark when pushing. Every node enters the queue at most once.
int mark_on_enqueue(const std::vector<std::vector<int>>& neighbours, int start,
                    std::vector<int>& distance) {
    int n = static_cast<int>(neighbours.size());
    distance.assign(n, -1);
    distance[start] = 0;
    std::vector<int> queue;
    queue.push_back(start);
    size_t head = 0;
    int pushes = 1;
    while (head < queue.size()) {
        int v = queue[head];
        head++;
        for (int u : neighbours[v]) {
            if (distance[u] < 0) {
                distance[u] = distance[v] + 1;
                queue.push_back(u);
                pushes++;
            }
        }
    }
    return pushes;
}

// Mark when popping. Same answers, one queue entry per edge that reaches it.
int mark_on_dequeue(const std::vector<std::vector<int>>& neighbours, int start,
                    std::vector<int>& distance) {
    int n = static_cast<int>(neighbours.size());
    distance.assign(n, -1);
    std::vector<char> seen(n, 0);
    std::vector<Edge> queue;
    queue.push_back(Edge(start, 0));
    size_t head = 0;
    int pushes = 1;
    while (head < queue.size()) {
        int v = queue[head].first;
        int d = queue[head].second;
        head++;
        if (seen[v]) {
            continue;
        }
        seen[v] = 1;
        distance[v] = d;
        for (int u : neighbours[v]) {
            if (!seen[u]) {
                queue.push_back(Edge(u, d + 1));
                pushes++;
            }
        }
    }
    return pushes;
}

// No visited set at all. Capped, because otherwise this does not return.
int no_marking(const std::vector<std::vector<int>>& neighbours, int start, int cap) {
    std::vector<Edge> queue;
    queue.push_back(Edge(start, 0));
    size_t head = 0;
    int pushes = 1;
    while (head < queue.size()) {
        if (pushes >= cap) {
            return -1;
        }
        int v = queue[head].first;
        int d = queue[head].second;
        head++;
        for (int u : neighbours[v]) {
            queue.push_back(Edge(u, d + 1));
            pushes++;
        }
    }
    return 0;
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

std::vector<Edge> complete_graph(int n) {
    std::vector<Edge> edges;
    for (int u = 0; u < n; u++) {
        for (int v = u + 1; v < n; v++) {
            edges.push_back(Edge(u, v));
        }
    }
    return edges;
}

std::vector<Edge> path_edges(int n) {
    std::vector<Edge> edges;
    for (int v = 0; v < n - 1; v++) {
        edges.push_back(Edge(v, v + 1));
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
    std::vector<std::string> names = {"path of 200", "complete graph, 60", "complete graph, 200"};
    std::vector<int> counts = {200, 60, 200};
    std::vector<std::vector<Edge>> shapes = {path_edges(200), complete_graph(60), complete_graph(200)};

    std::cout << std::left << std::setw(22) << "shape" << std::right << std::setw(7) << "nodes"
              << std::setw(8) << "edges" << std::setw(20) << "pushes, on enqueue"
              << std::setw(20) << "pushes, on dequeue" << "\\n";
    for (size_t c = 0; c < names.size(); c++) {
        std::vector<std::vector<int>> neighbours = build(counts[c], shapes[c]);
        std::vector<int> early;
        std::vector<int> late;
        int pushes_early = mark_on_enqueue(neighbours, 0, early);
        int pushes_late = mark_on_dequeue(neighbours, 0, late);
        if (!same(early, late)) {
            std::cout << "MISMATCH\\n";
        }
        std::cout << std::left << std::setw(22) << names[c] << std::right << std::setw(7) << counts[c]
                  << std::setw(8) << shapes[c].size() << std::setw(20) << pushes_early
                  << std::setw(20) << pushes_late << "\\n";
    }
    std::cout << "\\n";

    int trials = 3000;
    int agreed = 0;
    int early_pushes = 0;
    int late_pushes = 0;
    int uncapped = 0;
    int start_isolated = 0;
    int cap = 100000;
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
        std::vector<int> early;
        std::vector<int> late;
        int pushes_early = mark_on_enqueue(neighbours, 0, early);
        int pushes_late = mark_on_dequeue(neighbours, 0, late);
        if (same(early, late)) {
            agreed++;
        }
        early_pushes += pushes_early;
        late_pushes += pushes_late;
        if (no_marking(neighbours, 0, cap) == 0) {
            uncapped++;
        }
        if (neighbours[0].empty()) {
            start_isolated++;
        }
    }

    std::cout << "over " << trials << " random graphs on up to 7 nodes:\\n";
    std::cout << "  the two markings gave the same distances " << std::setw(6) << agreed << "\\n";
    std::cout << "  queue pushes, marking on enqueue         " << std::setw(6) << early_pushes << "\\n";
    std::cout << "  queue pushes, marking on dequeue         " << std::setw(6) << late_pushes << "\\n";
    std::cout << "  no marking at all, searches that ended   " << std::setw(6) << uncapped << "\\n";
    std::cout << "  graphs where the start had no edges      " << std::setw(6) << start_isolated << "\\n";
    std::cout << "\\n";
    std::cout << "The answers never differ, which is why this survives review. The cost\\n";
    std::cout << "does. Marking on enqueue bounds the queue by the number of nodes;\\n";
    std::cout << "marking on dequeue bounds it by the number of edges, and on the complete\\n";
    std::cout << "graph of 200 above that is 19,901 entries against 200.\\n";
    std::cout << "\\n";
    std::cout << "The last two lines are the same number, and that is the point. With no\\n";
    std::cout << "marking the search ended only on the graphs where the start had no edges\\n";
    std::cout << "at all -- because in an undirected graph a single edge is already a cycle\\n";
    std::cout << "of length two, and the search walks back and forth along it forever. The\\n";
    std::cout << "cap of " << cap << " pushes is the only reason those runs returned.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Where to mark a node visited. There are two plausible places and they are not
// equivalent.
//
//   on enqueue -- mark it the moment it is pushed. The queue then holds each
//                 node at most once.
//   on dequeue -- push whatever looks unvisited, and check again when it comes
//                 off. The answers are the same. The queue is not.
//
// Both are correct about distances. The second one puts a node on the queue once
// per edge that reaches it, so the queue grows with the edges rather than the
// nodes, and on a dense graph that is the difference between n and n squared.
//
// And with no marking at all, a graph with a cycle never terminates. The third
// function here is capped so it can be measured rather than merely asserted.

fn build(n: usize, edges: &[(usize, usize)]) -> Vec<Vec<usize>> {
    let mut neighbours = vec![Vec::new(); n];
    for &(u, v) in edges {
        neighbours[u].push(v);
        neighbours[v].push(u);
    }
    neighbours
}

/// Mark when pushing. Every node enters the queue at most once.
fn mark_on_enqueue(neighbours: &[Vec<usize>], start: usize) -> (Vec<i32>, i64) {
    let n = neighbours.len();
    let mut distance = vec![-1i32; n];
    distance[start] = 0;
    let mut queue = vec![start];
    let mut head = 0;
    let mut pushes = 1i64;
    while head < queue.len() {
        let v = queue[head];
        head += 1;
        for i in 0..neighbours[v].len() {
            let u = neighbours[v][i];
            if distance[u] < 0 {
                distance[u] = distance[v] + 1;
                queue.push(u);
                pushes += 1;
            }
        }
    }
    (distance, pushes)
}

/// Mark when popping. Same answers, one queue entry per edge that reaches it.
fn mark_on_dequeue(neighbours: &[Vec<usize>], start: usize) -> (Vec<i32>, i64) {
    let n = neighbours.len();
    let mut distance = vec![-1i32; n];
    let mut seen = vec![false; n];
    let mut queue = vec![(start, 0i32)];
    let mut head = 0;
    let mut pushes = 1i64;
    while head < queue.len() {
        let (v, d) = queue[head];
        head += 1;
        if seen[v] {
            continue;
        }
        seen[v] = true;
        distance[v] = d;
        for i in 0..neighbours[v].len() {
            let u = neighbours[v][i];
            if !seen[u] {
                queue.push((u, d + 1));
                pushes += 1;
            }
        }
    }
    (distance, pushes)
}

/// No visited set at all. Capped, because otherwise this does not return.
fn no_marking(neighbours: &[Vec<usize>], start: usize, cap: i64) -> i32 {
    let mut queue = vec![(start, 0i32)];
    let mut head = 0;
    let mut pushes = 1i64;
    while head < queue.len() {
        if pushes >= cap {
            return -1;
        }
        let (v, d) = queue[head];
        head += 1;
        for i in 0..neighbours[v].len() {
            let u = neighbours[v][i];
            queue.push((u, d + 1));
            pushes += 1;
        }
    }
    0
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

fn complete_graph(n: usize) -> Vec<(usize, usize)> {
    let mut edges = Vec::new();
    for u in 0..n {
        for v in (u + 1)..n {
            edges.push((u, v));
        }
    }
    edges
}

fn path_edges(n: usize) -> Vec<(usize, usize)> {
    (0..n - 1).map(|v| (v, v + 1)).collect()
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
    let names = ["path of 200", "complete graph, 60", "complete graph, 200"];
    let counts: Vec<usize> = vec![200, 60, 200];
    let shapes: Vec<Vec<(usize, usize)>> =
        vec![path_edges(200), complete_graph(60), complete_graph(200)];

    println!(
        "{}{}{}{}{}",
        pad_right("shape", 22),
        pad_left("nodes", 7),
        pad_left("edges", 8),
        pad_left("pushes, on enqueue", 20),
        pad_left("pushes, on dequeue", 20)
    );
    for (c, name) in names.iter().enumerate() {
        let neighbours = build(counts[c], &shapes[c]);
        let (early, pushes_early) = mark_on_enqueue(&neighbours, 0);
        let (late, pushes_late) = mark_on_dequeue(&neighbours, 0);
        if !same(&early, &late) {
            println!("MISMATCH");
        }
        println!(
            "{}{}{}{}{}",
            pad_right(name, 22),
            pad_left(&counts[c].to_string(), 7),
            pad_left(&shapes[c].len().to_string(), 8),
            pad_left(&pushes_early.to_string(), 20),
            pad_left(&pushes_late.to_string(), 20)
        );
    }
    println!();

    let mut rng = Rng { seed: 1 };
    let trials = 3000;
    let mut agreed = 0;
    let mut early_pushes = 0i64;
    let mut late_pushes = 0i64;
    let mut uncapped = 0;
    let mut start_isolated = 0;
    let cap: i64 = 100000;
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
        let (early, pushes_early) = mark_on_enqueue(&neighbours, 0);
        let (late, pushes_late) = mark_on_dequeue(&neighbours, 0);
        if same(&early, &late) {
            agreed += 1;
        }
        early_pushes += pushes_early;
        late_pushes += pushes_late;
        if no_marking(&neighbours, 0, cap) == 0 {
            uncapped += 1;
        }
        if neighbours[0].is_empty() {
            start_isolated += 1;
        }
    }

    println!("over {} random graphs on up to 7 nodes:", trials);
    println!("  the two markings gave the same distances {}", pad_left(&agreed.to_string(), 6));
    println!("  queue pushes, marking on enqueue         {}", pad_left(&early_pushes.to_string(), 6));
    println!("  queue pushes, marking on dequeue         {}", pad_left(&late_pushes.to_string(), 6));
    println!("  no marking at all, searches that ended   {}", pad_left(&uncapped.to_string(), 6));
    println!("  graphs where the start had no edges      {}", pad_left(&start_isolated.to_string(), 6));
    println!();
    println!("The answers never differ, which is why this survives review. The cost");
    println!("does. Marking on enqueue bounds the queue by the number of nodes;");
    println!("marking on dequeue bounds it by the number of edges, and on the complete");
    println!("graph of 200 above that is 19,901 entries against 200.");
    println!();
    println!("The last two lines are the same number, and that is the point. With no");
    println!("marking the search ended only on the graphs where the start had no edges");
    println!("at all -- because in an undirected graph a single edge is already a cycle");
    println!("of length two, and the search walks back and forth along it forever. The");
    println!("cap of {} pushes is the only reason those runs returned.", cap);
}
`,
            },
            {
              lang: "go",
              code: `// Where to mark a node visited. There are two plausible places and they are not
// equivalent.
//
//   on enqueue -- mark it the moment it is pushed. The queue then holds each
//                 node at most once.
//   on dequeue -- push whatever looks unvisited, and check again when it comes
//                 off. The answers are the same. The queue is not.
//
// Both are correct about distances. The second one puts a node on the queue once
// per edge that reaches it, so the queue grows with the edges rather than the
// nodes, and on a dense graph that is the difference between n and n squared.
//
// And with no marking at all, a graph with a cycle never terminates. The third
// function here is capped so it can be measured rather than merely asserted.

package main

import "fmt"

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

// Mark when pushing. Every node enters the queue at most once.
func markOnEnqueue(neighbours [][]int, start int) ([]int, int) {
	n := len(neighbours)
	distance := make([]int, n)
	for i := range distance {
		distance[i] = -1
	}
	distance[start] = 0
	queue := []int{start}
	head := 0
	pushes := 1
	for head < len(queue) {
		v := queue[head]
		head++
		for _, u := range neighbours[v] {
			if distance[u] < 0 {
				distance[u] = distance[v] + 1
				queue = append(queue, u)
				pushes++
			}
		}
	}
	return distance, pushes
}

// Mark when popping. Same answers, one queue entry per edge that reaches it.
func markOnDequeue(neighbours [][]int, start int) ([]int, int) {
	n := len(neighbours)
	distance := make([]int, n)
	for i := range distance {
		distance[i] = -1
	}
	seen := make([]bool, n)
	queue := [][2]int{{start, 0}}
	head := 0
	pushes := 1
	for head < len(queue) {
		v, d := queue[head][0], queue[head][1]
		head++
		if seen[v] {
			continue
		}
		seen[v] = true
		distance[v] = d
		for _, u := range neighbours[v] {
			if !seen[u] {
				queue = append(queue, [2]int{u, d + 1})
				pushes++
			}
		}
	}
	return distance, pushes
}

// No visited set at all. Capped, because otherwise this does not return.
func noMarking(neighbours [][]int, start, cap int) int {
	queue := [][2]int{{start, 0}}
	head := 0
	pushes := 1
	for head < len(queue) {
		if pushes >= cap {
			return -1
		}
		v, d := queue[head][0], queue[head][1]
		head++
		for _, u := range neighbours[v] {
			queue = append(queue, [2]int{u, d + 1})
			pushes++
		}
	}
	return 0
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

func completeGraph(n int) []edge {
	edges := []edge{}
	for u := 0; u < n; u++ {
		for v := u + 1; v < n; v++ {
			edges = append(edges, edge{u, v})
		}
	}
	return edges
}

func pathEdges(n int) []edge {
	edges := []edge{}
	for v := 0; v < n-1; v++ {
		edges = append(edges, edge{v, v + 1})
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
	names := []string{"path of 200", "complete graph, 60", "complete graph, 200"}
	counts := []int{200, 60, 200}
	shapes := [][]edge{pathEdges(200), completeGraph(60), completeGraph(200)}

	fmt.Printf("%-22s%7s%8s%20s%20s\\n", "shape", "nodes", "edges",
		"pushes, on enqueue", "pushes, on dequeue")
	for c, name := range names {
		neighbours := build(counts[c], shapes[c])
		early, pushesEarly := markOnEnqueue(neighbours, 0)
		late, pushesLate := markOnDequeue(neighbours, 0)
		if !same(early, late) {
			fmt.Println("MISMATCH")
		}
		fmt.Printf("%-22s%7d%8d%20d%20d\\n", name, counts[c], len(shapes[c]), pushesEarly, pushesLate)
	}
	fmt.Println()

	trials := 3000
	agreed := 0
	earlyPushes := 0
	latePushes := 0
	uncapped := 0
	startIsolated := 0
	capValue := 100000
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
		early, pushesEarly := markOnEnqueue(neighbours, 0)
		late, pushesLate := markOnDequeue(neighbours, 0)
		if same(early, late) {
			agreed++
		}
		earlyPushes += pushesEarly
		latePushes += pushesLate
		if noMarking(neighbours, 0, capValue) == 0 {
			uncapped++
		}
		if len(neighbours[0]) == 0 {
			startIsolated++
		}
	}

	fmt.Printf("over %d random graphs on up to 7 nodes:\\n", trials)
	fmt.Printf("  the two markings gave the same distances %6d\\n", agreed)
	fmt.Printf("  queue pushes, marking on enqueue         %6d\\n", earlyPushes)
	fmt.Printf("  queue pushes, marking on dequeue         %6d\\n", latePushes)
	fmt.Printf("  no marking at all, searches that ended   %6d\\n", uncapped)
	fmt.Printf("  graphs where the start had no edges      %6d\\n", startIsolated)
	fmt.Println()
	fmt.Println("The answers never differ, which is why this survives review. The cost")
	fmt.Println("does. Marking on enqueue bounds the queue by the number of nodes;")
	fmt.Println("marking on dequeue bounds it by the number of edges, and on the complete")
	fmt.Println("graph of 200 above that is 19,901 entries against 200.")
	fmt.Println()
	fmt.Println("The last two lines are the same number, and that is the point. With no")
	fmt.Println("marking the search ended only on the graphs where the start had no edges")
	fmt.Println("at all -- because in an undirected graph a single edge is already a cycle")
	fmt.Println("of length two, and the search walks back and forth along it forever. The")
	fmt.Printf("cap of %d pushes is the only reason those runs returned.\\n", capValue)
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Marking on dequeue makes the queue grow with the edges",
          body: "A node is pushed once per edge that reaches it, so the queue is bounded by E rather than V. On a complete graph of 200 nodes that is 19,901 entries against 200. The distances are the same either way, which is why this is easy to miss in review and easy to see in a memory profile.",
        },
        {
          title: "It is not \"graphs with cycles\" that need a visited set",
          body: "In an undirected graph a single edge is already a two-cycle. With no marking, the search ended only on the 931 of 3,000 graphs whose start node had no edges at all. Any edge at all is enough to make it run forever.",
        },
      ],
    },
    {
      id: "two-meanings-of-visited",
      heading: "Two meanings of the same word",
      body: [
        "The second look is the one that changes answers rather than costs. The word \"visited\" carries two different meanings and they live in the same variable name.",
        "**A global visited set** means \"this node has been dealt with, ever\". It is never unmarked. That is correct for reachability, for connected components, for a single shortest distance \u2014 anything whose answer is about nodes.",
        "**A path-local set** means \"this node is on the route I am currently walking\". It is unmarked on the way out of the recursion. That is what you need when the answer is about routes, because a node can lie on many different ones.",
        "Use the global set to count routes and it quietly answers a different question. It finds one route into each node and stops, because the second route runs into a node the first route has already claimed. Over 3,000 random directed graphs it agreed with the true count on 2,850 and was low on 150 \u2014 never high. Look at `[0->1, 0->2, 0->3, 1->4, 2->4, 3->4, 4->5]` in the example: three routes, and the global set reports one.",
        "The mistake runs the other way too, and it is more expensive. Unmarking on the way out when the question is about nodes turns a linear walk into an exponential one. On a chain of 16 diamonds \u2014 49 nodes \u2014 the path-local walk enters a node 262,141 times against the global set's 49. Both answer reachability correctly, which is why a test that only checks *which* nodes were reached passes either way.",
        "So the rule is one sentence: unmark on the way out when the question is about routes, and never when it is about nodes.",
      ],
      examples: [
        {
          id: "global-against-path-local",
          title: "Counting routes and reaching nodes, with each set used for both",
          lang: "python",
          code: `# The other half of the discipline: what "visited" is allowed to mean depends on
# the question, and the two meanings live in the same variable name.
#
#   a global visited set  -- "this node has been dealt with, ever". Correct for
#                            reachability, connectivity, one shortest distance.
#   a path-local seen set -- "this node is on the route I am currently walking".
#                            Correct for enumerating routes.
#
# Use the global one to count paths and it answers a different question: it will
# find one route to each node and stop, because the second route runs into a
# node the first route already claimed. The answers look plausible and are low.


def build(n, edges):
    neighbours = [[] for _ in range(n)]
    for u, v in edges:
        neighbours[u].append(v)
    return neighbours


def count_paths_path_local(n, edges, start, target):
    """Unmark on the way out, so a node can appear on many different routes."""
    neighbours = build(n, edges)
    on_path = [False] * n
    total = [0]

    def step(v):
        if v == target:
            total[0] += 1
            return
        on_path[v] = True
        for u in neighbours[v]:
            if not on_path[u]:
                step(u)
        on_path[v] = False

    step(start)
    return total[0]


def count_paths_global(n, edges, start, target):
    """Never unmark. Each node is entered once in the whole search."""
    neighbours = build(n, edges)
    seen = [False] * n
    total = [0]

    def step(v):
        if v == target:
            total[0] += 1
            return
        seen[v] = True
        for u in neighbours[v]:
            if not seen[u]:
                step(u)

    step(start)
    return total[0]


def reachable_path_local(n, edges, start):
    """Reachability with the path-local set. Correct, and does far more work."""
    neighbours = build(n, edges)
    on_path = [False] * n
    found = [False] * n
    steps = [0]

    def step(v):
        steps[0] += 1
        found[v] = True
        on_path[v] = True
        for u in neighbours[v]:
            if not on_path[u]:
                step(u)
        on_path[v] = False

    step(start)
    return found, steps[0]


def reachable_global(n, edges, start):
    """Reachability with the global set. Correct, and each node entered once."""
    neighbours = build(n, edges)
    seen = [False] * n
    steps = [0]

    def step(v):
        steps[0] += 1
        seen[v] = True
        for u in neighbours[v]:
            if not seen[u]:
                step(u)

    step(start)
    return seen, steps[0]


def same_flags(a, b):
    for i in range(len(a)):
        if a[i] != b[i]:
            return False
    return True


def show_edges(edges):
    return "[" + ", ".join(f"{u}->{v}" for u, v in edges) + "]"


def diamonds(k):
    """k diamonds in a row. Each one doubles the number of routes through it."""
    edges = []
    for i in range(k):
        a = 3 * i
        edges.append((a, a + 1))
        edges.append((a, a + 2))
        edges.append((a + 1, a + 3))
        edges.append((a + 2, a + 3))
    return 3 * k + 1, edges


CASES = [
    (4, [(0, 1), (0, 2), (1, 3), (2, 3)]),
    (5, [(0, 1), (0, 2), (1, 3), (2, 3), (3, 4), (0, 4)]),
    (4, [(0, 1), (1, 2), (2, 3)]),
    (6, [(0, 1), (0, 2), (0, 3), (1, 4), (2, 4), (3, 4), (4, 5)]),
]

print(f"{'edges':<52}{'paths, unmarking':>18}{'paths, global':>15}")
for n, edges in CASES:
    print(f"{show_edges(edges):<52}"
          f"{count_paths_path_local(n, edges, 0, n - 1):>18}"
          f"{count_paths_global(n, edges, 0, n - 1):>15}")
print()

print(f"{'diamonds':<12}{'nodes':>7}{'routes':>9}{'entries, unmarking':>20}{'entries, global':>17}")
for k in [1, 4, 8, 12, 16]:
    n, edges = diamonds(k)
    _, took_local = reachable_path_local(n, edges, 0)
    _, took_global = reachable_global(n, edges, 0)
    print(f"{k:<12}{n:>7}{count_paths_path_local(n, edges, 0, n - 1):>9}"
          f"{took_local:>20}{took_global:>17}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
paths_agree = 0
global_low = 0
global_high = 0
reach_agree = 0
steps_local = 0
steps_global = 0
for _ in range(TRIALS):
    n = 2 + rand(6)
    edges = []
    for u in range(n):
        for v in range(u + 1, n):
            if rand(3) == 0:
                edges.append((u, v))
    truth = count_paths_path_local(n, edges, 0, n - 1)
    guess = count_paths_global(n, edges, 0, n - 1)
    if guess == truth:
        paths_agree += 1
    if guess < truth:
        global_low += 1
    if guess > truth:
        global_high += 1
    found_local, took_local = reachable_path_local(n, edges, 0)
    found_global, took_global = reachable_global(n, edges, 0)
    if same_flags(found_local, found_global):
        reach_agree += 1
    steps_local += took_local
    steps_global += took_global

print(f"over {TRIALS} random directed graphs on up to 7 nodes:")
print(f"  counting paths, the two sets agreed      {paths_agree:>6}")
print(f"  the global set counted too few           {global_low:>6}")
print(f"  the global set counted too many          {global_high:>6}")
print(f"  reachability, the two sets agreed        {reach_agree:>6}")
print(f"  node entries, path-local against global  {steps_local:>6}{steps_global:>7}")
print()
print("The diamond table is the cost of the other mistake. Unmarking on the way")
print("out is required for counting routes and ruinous for anything else: with")
print("16 diamonds there are 65,536 routes and the path-local walk enters a node")
print("262,141 times, while the global set enters each of the 49 nodes once.")
print()
print("Both sets answer reachability correctly, so a test that only checks")
print("\\"which nodes can be reached\\" passes either way -- and the global one does")
print("it in far fewer entries, which is the whole reason it exists. Counting")
print("routes is a different question, and there the global set is wrong in one")
print("direction: it never over-counts, it simply stops at the first route into")
print("each node. Unmark on the way out when the question is about routes; do")
print("not when it is about nodes.")
`,
          output: `edges                                                 paths, unmarking  paths, global
[0->1, 0->2, 1->3, 2->3]                                             2              2
[0->1, 0->2, 1->3, 2->3, 3->4, 0->4]                                 3              2
[0->1, 1->2, 2->3]                                                   1              1
[0->1, 0->2, 0->3, 1->4, 2->4, 3->4, 4->5]                           3              1

diamonds      nodes   routes  entries, unmarking  entries, global
1                 4        2                   5                4
4                13       16                  61               13
8                25      256                1021               25
12               37     4096               16381               37
16               49    65536              262141               49

over 3000 random directed graphs on up to 7 nodes:
  counting paths, the two sets agreed        2850
  the global set counted too few              150
  the global set counted too many               0
  reachability, the two sets agreed          3000
  node entries, path-local against global    9040   7696

The diamond table is the cost of the other mistake. Unmarking on the way
out is required for counting routes and ruinous for anything else: with
16 diamonds there are 65,536 routes and the path-local walk enters a node
262,141 times, while the global set enters each of the 49 nodes once.

Both sets answer reachability correctly, so a test that only checks
"which nodes can be reached" passes either way -- and the global one does
it in far fewer entries, which is the whole reason it exists. Counting
routes is a different question, and there the global set is wrong in one
direction: it never over-counts, it simply stops at the first route into
each node. Unmark on the way out when the question is about routes; do
not when it is about nodes.`,
          explanation:
            "A global visited set and a path-local one, used for both questions in turn. Each is correct for one of them and quietly wrong for the other -- undercounting in one direction, exploding in the other.",
          alternates: [
            {
              lang: "javascript",
              code: `// The other half of the discipline: what "visited" is allowed to mean depends on
// the question, and the two meanings live in the same variable name.
//
//   a global visited set  -- "this node has been dealt with, ever". Correct for
//                            reachability, connectivity, one shortest distance.
//   a path-local seen set -- "this node is on the route I am currently walking".
//                            Correct for enumerating routes.
//
// Use the global one to count paths and it answers a different question: it will
// find one route to each node and stop, because the second route runs into a
// node the first route already claimed. The answers look plausible and are low.

function build(n, edges) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) neighbours[u].push(v);
  return neighbours;
}

/** Unmark on the way out, so a node can appear on many different routes. */
function countPathsPathLocal(n, edges, start, target) {
  const neighbours = build(n, edges);
  const onPath = new Array(n).fill(false);
  let total = 0;

  function step(v) {
    if (v === target) {
      total += 1;
      return;
    }
    onPath[v] = true;
    for (const u of neighbours[v]) {
      if (!onPath[u]) step(u);
    }
    onPath[v] = false;
  }

  step(start);
  return total;
}

/** Never unmark. Each node is entered once in the whole search. */
function countPathsGlobal(n, edges, start, target) {
  const neighbours = build(n, edges);
  const seen = new Array(n).fill(false);
  let total = 0;

  function step(v) {
    if (v === target) {
      total += 1;
      return;
    }
    seen[v] = true;
    for (const u of neighbours[v]) {
      if (!seen[u]) step(u);
    }
  }

  step(start);
  return total;
}

/** Reachability with the path-local set. Correct, and does far more work. */
function reachablePathLocal(n, edges, start) {
  const neighbours = build(n, edges);
  const onPath = new Array(n).fill(false);
  const found = new Array(n).fill(false);
  let steps = 0;

  function step(v) {
    steps += 1;
    found[v] = true;
    onPath[v] = true;
    for (const u of neighbours[v]) {
      if (!onPath[u]) step(u);
    }
    onPath[v] = false;
  }

  step(start);
  return [found, steps];
}

/** Reachability with the global set. Correct, and each node entered once. */
function reachableGlobal(n, edges, start) {
  const neighbours = build(n, edges);
  const seen = new Array(n).fill(false);
  let steps = 0;

  function step(v) {
    steps += 1;
    seen[v] = true;
    for (const u of neighbours[v]) {
      if (!seen[u]) step(u);
    }
  }

  step(start);
  return [seen, steps];
}

function sameFlags(a, b) {
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

const showEdges = (edges) =>
  "[" + edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ") + "]";
const padEnd = (v, w) => String(v).padEnd(w);
const pad = (v, w) => String(v).padStart(w);

/** k diamonds in a row. Each one doubles the number of routes through it. */
function diamonds(k) {
  const edges = [];
  for (let i = 0; i < k; i += 1) {
    const a = 3 * i;
    edges.push([a, a + 1]);
    edges.push([a, a + 2]);
    edges.push([a + 1, a + 3]);
    edges.push([a + 2, a + 3]);
  }
  return [3 * k + 1, edges];
}

const CASES = [
  [4, [[0, 1], [0, 2], [1, 3], [2, 3]]],
  [5, [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [0, 4]]],
  [4, [[0, 1], [1, 2], [2, 3]]],
  [6, [[0, 1], [0, 2], [0, 3], [1, 4], [2, 4], [3, 4], [4, 5]]],
];

console.log(padEnd("edges", 52) + pad("paths, unmarking", 18) + pad("paths, global", 15));
for (const [n, edges] of CASES) {
  console.log(
    padEnd(showEdges(edges), 52) +
      pad(countPathsPathLocal(n, edges, 0, n - 1), 18) +
      pad(countPathsGlobal(n, edges, 0, n - 1), 15)
  );
}
console.log();

console.log(
  padEnd("diamonds", 12) +
    pad("nodes", 7) +
    pad("routes", 9) +
    pad("entries, unmarking", 20) +
    pad("entries, global", 17)
);
for (const k of [1, 4, 8, 12, 16]) {
  const [n, edges] = diamonds(k);
  const [, tookLocal] = reachablePathLocal(n, edges, 0);
  const [, tookGlobal] = reachableGlobal(n, edges, 0);
  console.log(
    padEnd(k, 12) +
      pad(n, 7) +
      pad(countPathsPathLocal(n, edges, 0, n - 1), 9) +
      pad(tookLocal, 20) +
      pad(tookGlobal, 17)
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
let pathsAgree = 0;
let globalLow = 0;
let globalHigh = 0;
let reachAgree = 0;
let stepsLocal = 0;
let stepsGlobal = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) {
      if (rand(3) === 0) edges.push([u, v]);
    }
  }
  const truth = countPathsPathLocal(n, edges, 0, n - 1);
  const guess = countPathsGlobal(n, edges, 0, n - 1);
  if (guess === truth) pathsAgree += 1;
  if (guess < truth) globalLow += 1;
  if (guess > truth) globalHigh += 1;
  const [foundLocal, tookLocal] = reachablePathLocal(n, edges, 0);
  const [foundGlobal, tookGlobal] = reachableGlobal(n, edges, 0);
  if (sameFlags(foundLocal, foundGlobal)) reachAgree += 1;
  stepsLocal += tookLocal;
  stepsGlobal += tookGlobal;
}

console.log(\`over \${TRIALS} random directed graphs on up to 7 nodes:\`);
console.log(\`  counting paths, the two sets agreed      \${pad(pathsAgree, 6)}\`);
console.log(\`  the global set counted too few           \${pad(globalLow, 6)}\`);
console.log(\`  the global set counted too many          \${pad(globalHigh, 6)}\`);
console.log(\`  reachability, the two sets agreed        \${pad(reachAgree, 6)}\`);
console.log(\`  node entries, path-local against global  \${pad(stepsLocal, 6)}\${pad(stepsGlobal, 7)}\`);
console.log();
console.log("The diamond table is the cost of the other mistake. Unmarking on the way");
console.log("out is required for counting routes and ruinous for anything else: with");
console.log("16 diamonds there are 65,536 routes and the path-local walk enters a node");
console.log("262,141 times, while the global set enters each of the 49 nodes once.");
console.log();
console.log("Both sets answer reachability correctly, so a test that only checks");
console.log('"which nodes can be reached" passes either way -- and the global one does');
console.log("it in far fewer entries, which is the whole reason it exists. Counting");
console.log("routes is a different question, and there the global set is wrong in one");
console.log("direction: it never over-counts, it simply stops at the first route into");
console.log("each node. Unmark on the way out when the question is about routes; do");
console.log("not when it is about nodes.");
`,
            },
            {
              lang: "typescript",
              code: `// The other half of the discipline: what "visited" is allowed to mean depends on
// the question, and the two meanings live in the same variable name.
//
//   a global visited set  -- "this node has been dealt with, ever". Correct for
//                            reachability, connectivity, one shortest distance.
//   a path-local seen set -- "this node is on the route I am currently walking".
//                            Correct for enumerating routes.
//
// Use the global one to count paths and it answers a different question: it will
// find one route to each node and stop, because the second route runs into a
// node the first route already claimed. The answers look plausible and are low.

type Edge = [number, number];

function build(n: number, edges: Edge[]): number[][] {
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) neighbours[u].push(v);
  return neighbours;
}

/** Unmark on the way out, so a node can appear on many different routes. */
function countPathsPathLocal(n: number, edges: Edge[], start: number, target: number): number {
  const neighbours = build(n, edges);
  const onPath = new Array(n).fill(false);
  let total = 0;

  function step(v: number): void {
    if (v === target) {
      total += 1;
      return;
    }
    onPath[v] = true;
    for (const u of neighbours[v]) {
      if (!onPath[u]) step(u);
    }
    onPath[v] = false;
  }

  step(start);
  return total;
}

/** Never unmark. Each node is entered once in the whole search. */
function countPathsGlobal(n: number, edges: Edge[], start: number, target: number): number {
  const neighbours = build(n, edges);
  const seen = new Array(n).fill(false);
  let total = 0;

  function step(v: number): void {
    if (v === target) {
      total += 1;
      return;
    }
    seen[v] = true;
    for (const u of neighbours[v]) {
      if (!seen[u]) step(u);
    }
  }

  step(start);
  return total;
}

/** Reachability with the path-local set. Correct, and does far more work. */
function reachablePathLocal(n: number, edges: Edge[], start: number): [boolean[], number] {
  const neighbours = build(n, edges);
  const onPath = new Array(n).fill(false);
  const found: boolean[] = new Array(n).fill(false);
  let steps = 0;

  function step(v: number): void {
    steps += 1;
    found[v] = true;
    onPath[v] = true;
    for (const u of neighbours[v]) {
      if (!onPath[u]) step(u);
    }
    onPath[v] = false;
  }

  step(start);
  return [found, steps];
}

/** Reachability with the global set. Correct, and each node entered once. */
function reachableGlobal(n: number, edges: Edge[], start: number): [boolean[], number] {
  const neighbours = build(n, edges);
  const seen: boolean[] = new Array(n).fill(false);
  let steps = 0;

  function step(v: number): void {
    steps += 1;
    seen[v] = true;
    for (const u of neighbours[v]) {
      if (!seen[u]) step(u);
    }
  }

  step(start);
  return [seen, steps];
}

function sameFlags(a: boolean[], b: boolean[]): boolean {
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

const showEdges = (edges: Edge[]): string =>
  "[" + edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ") + "]";
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const pad = (v: string | number, w: number): string => String(v).padStart(w);

/** k diamonds in a row. Each one doubles the number of routes through it. */
function diamonds(k: number): [number, Edge[]] {
  const edges: Edge[] = [];
  for (let i = 0; i < k; i += 1) {
    const a = 3 * i;
    edges.push([a, a + 1]);
    edges.push([a, a + 2]);
    edges.push([a + 1, a + 3]);
    edges.push([a + 2, a + 3]);
  }
  return [3 * k + 1, edges];
}

const CASES: [number, Edge[]][] = [
  [4, [[0, 1], [0, 2], [1, 3], [2, 3]]],
  [5, [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [0, 4]]],
  [4, [[0, 1], [1, 2], [2, 3]]],
  [6, [[0, 1], [0, 2], [0, 3], [1, 4], [2, 4], [3, 4], [4, 5]]],
];

console.log(padEnd("edges", 52) + pad("paths, unmarking", 18) + pad("paths, global", 15));
for (const [n, edges] of CASES) {
  console.log(
    padEnd(showEdges(edges), 52) +
      pad(countPathsPathLocal(n, edges, 0, n - 1), 18) +
      pad(countPathsGlobal(n, edges, 0, n - 1), 15)
  );
}
console.log();

console.log(
  padEnd("diamonds", 12) +
    pad("nodes", 7) +
    pad("routes", 9) +
    pad("entries, unmarking", 20) +
    pad("entries, global", 17)
);
for (const k of [1, 4, 8, 12, 16]) {
  const [n, edges] = diamonds(k);
  const [, tookLocal] = reachablePathLocal(n, edges, 0);
  const [, tookGlobal] = reachableGlobal(n, edges, 0);
  console.log(
    padEnd(k, 12) +
      pad(n, 7) +
      pad(countPathsPathLocal(n, edges, 0, n - 1), 9) +
      pad(tookLocal, 20) +
      pad(tookGlobal, 17)
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
let pathsAgree = 0;
let globalLow = 0;
let globalHigh = 0;
let reachAgree = 0;
let stepsLocal = 0;
let stepsGlobal = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges: Edge[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) {
      if (rand(3) === 0) edges.push([u, v]);
    }
  }
  const truth = countPathsPathLocal(n, edges, 0, n - 1);
  const guess = countPathsGlobal(n, edges, 0, n - 1);
  if (guess === truth) pathsAgree += 1;
  if (guess < truth) globalLow += 1;
  if (guess > truth) globalHigh += 1;
  const [foundLocal, tookLocal] = reachablePathLocal(n, edges, 0);
  const [foundGlobal, tookGlobal] = reachableGlobal(n, edges, 0);
  if (sameFlags(foundLocal, foundGlobal)) reachAgree += 1;
  stepsLocal += tookLocal;
  stepsGlobal += tookGlobal;
}

console.log(\`over \${TRIALS} random directed graphs on up to 7 nodes:\`);
console.log(\`  counting paths, the two sets agreed      \${pad(pathsAgree, 6)}\`);
console.log(\`  the global set counted too few           \${pad(globalLow, 6)}\`);
console.log(\`  the global set counted too many          \${pad(globalHigh, 6)}\`);
console.log(\`  reachability, the two sets agreed        \${pad(reachAgree, 6)}\`);
console.log(\`  node entries, path-local against global  \${pad(stepsLocal, 6)}\${pad(stepsGlobal, 7)}\`);
console.log();
console.log("The diamond table is the cost of the other mistake. Unmarking on the way");
console.log("out is required for counting routes and ruinous for anything else: with");
console.log("16 diamonds there are 65,536 routes and the path-local walk enters a node");
console.log("262,141 times, while the global set enters each of the 49 nodes once.");
console.log();
console.log("Both sets answer reachability correctly, so a test that only checks");
console.log('"which nodes can be reached" passes either way -- and the global one does');
console.log("it in far fewer entries, which is the whole reason it exists. Counting");
console.log("routes is a different question, and there the global set is wrong in one");
console.log("direction: it never over-counts, it simply stops at the first route into");
console.log("each node. Unmark on the way out when the question is about routes; do");
console.log("not when it is about nodes.");
`,
            },
            {
              lang: "java",
              code: `// The other half of the discipline: what "visited" is allowed to mean depends on
// the question, and the two meanings live in the same variable name.
//
//   a global visited set  -- "this node has been dealt with, ever". Correct for
//                            reachability, connectivity, one shortest distance.
//   a path-local seen set -- "this node is on the route I am currently walking".
//                            Correct for enumerating routes.
//
// Use the global one to count paths and it answers a different question: it will
// find one route to each node and stop, because the second route runs into a
// node the first route already claimed. The answers look plausible and are low.

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

    static int total;
    static boolean[] flags;
    static int steps;

    static void stepPathLocal(List<List<Integer>> neighbours, boolean[] onPath, int target, int v) {
        if (v == target) {
            total++;
            return;
        }
        onPath[v] = true;
        for (int u : neighbours.get(v)) {
            if (!onPath[u]) {
                stepPathLocal(neighbours, onPath, target, u);
            }
        }
        onPath[v] = false;
    }

    /** Unmark on the way out, so a node can appear on many different routes. */
    static int countPathsPathLocal(int n, int[][] edges, int start, int target) {
        List<List<Integer>> neighbours = build(n, edges);
        total = 0;
        stepPathLocal(neighbours, new boolean[n], target, start);
        return total;
    }

    static void stepGlobal(List<List<Integer>> neighbours, boolean[] seen, int target, int v) {
        if (v == target) {
            total++;
            return;
        }
        seen[v] = true;
        for (int u : neighbours.get(v)) {
            if (!seen[u]) {
                stepGlobal(neighbours, seen, target, u);
            }
        }
    }

    /** Never unmark. Each node is entered once in the whole search. */
    static int countPathsGlobal(int n, int[][] edges, int start, int target) {
        List<List<Integer>> neighbours = build(n, edges);
        total = 0;
        stepGlobal(neighbours, new boolean[n], target, start);
        return total;
    }

    static void walkPathLocal(List<List<Integer>> neighbours, boolean[] onPath, int v) {
        steps++;
        flags[v] = true;
        onPath[v] = true;
        for (int u : neighbours.get(v)) {
            if (!onPath[u]) {
                walkPathLocal(neighbours, onPath, u);
            }
        }
        onPath[v] = false;
    }

    /** Reachability with the path-local set. Correct, and does far more work. */
    static int reachablePathLocal(int n, int[][] edges, int start) {
        List<List<Integer>> neighbours = build(n, edges);
        flags = new boolean[n];
        steps = 0;
        walkPathLocal(neighbours, new boolean[n], start);
        return steps;
    }

    static void walkGlobal(List<List<Integer>> neighbours, int v) {
        steps++;
        flags[v] = true;
        for (int u : neighbours.get(v)) {
            if (!flags[u]) {
                walkGlobal(neighbours, u);
            }
        }
    }

    /** Reachability with the global set. Correct, and each node entered once. */
    static int reachableGlobal(int n, int[][] edges, int start) {
        List<List<Integer>> neighbours = build(n, edges);
        flags = new boolean[n];
        steps = 0;
        walkGlobal(neighbours, start);
        return steps;
    }

    static boolean sameFlags(boolean[] a, boolean[] b) {
        for (int i = 0; i < a.length; i++) {
            if (a[i] != b[i]) {
                return false;
            }
        }
        return true;
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

    /** k diamonds in a row. Each one doubles the number of routes through it. */
    static int[][] diamonds(int k) {
        int[][] edges = new int[4 * k][2];
        for (int i = 0; i < k; i++) {
            int a = 3 * i;
            edges[4 * i] = new int[] {a, a + 1};
            edges[4 * i + 1] = new int[] {a, a + 2};
            edges[4 * i + 2] = new int[] {a + 1, a + 3};
            edges[4 * i + 3] = new int[] {a + 2, a + 3};
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
        int[] sizes = {4, 5, 4, 6};
        int[][][] cases = {
            {{0, 1}, {0, 2}, {1, 3}, {2, 3}},
            {{0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}, {0, 4}},
            {{0, 1}, {1, 2}, {2, 3}},
            {{0, 1}, {0, 2}, {0, 3}, {1, 4}, {2, 4}, {3, 4}, {4, 5}},
        };

        System.out.println(padEnd("edges", 52) + pad("paths, unmarking", 18)
                + pad("paths, global", 15));
        for (int c = 0; c < sizes.length; c++) {
            int n = sizes[c];
            System.out.println(padEnd(showEdges(cases[c]), 52)
                    + pad(String.valueOf(countPathsPathLocal(n, cases[c], 0, n - 1)), 18)
                    + pad(String.valueOf(countPathsGlobal(n, cases[c], 0, n - 1)), 15));
        }
        System.out.println();

        System.out.println(padEnd("diamonds", 12) + pad("nodes", 7) + pad("routes", 9)
                + pad("entries, unmarking", 20) + pad("entries, global", 17));
        int[] ks = {1, 4, 8, 12, 16};
        for (int k : ks) {
            int n = 3 * k + 1;
            int[][] edges = diamonds(k);
            int tookLocal = reachablePathLocal(n, edges, 0);
            int tookGlobal = reachableGlobal(n, edges, 0);
            System.out.println(padEnd(String.valueOf(k), 12) + pad(String.valueOf(n), 7)
                    + pad(String.valueOf(countPathsPathLocal(n, edges, 0, n - 1)), 9)
                    + pad(String.valueOf(tookLocal), 20) + pad(String.valueOf(tookGlobal), 17));
        }
        System.out.println();

        int trials = 3000;
        int pathsAgree = 0;
        int globalLow = 0;
        int globalHigh = 0;
        int reachAgree = 0;
        int stepsLocal = 0;
        int stepsGlobal = 0;
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
            int truth = countPathsPathLocal(n, edges, 0, n - 1);
            int guess = countPathsGlobal(n, edges, 0, n - 1);
            if (guess == truth) {
                pathsAgree++;
            }
            if (guess < truth) {
                globalLow++;
            }
            if (guess > truth) {
                globalHigh++;
            }
            int tookLocal = reachablePathLocal(n, edges, 0);
            boolean[] foundLocal = flags;
            int tookGlobal = reachableGlobal(n, edges, 0);
            boolean[] foundGlobal = flags;
            if (sameFlags(foundLocal, foundGlobal)) {
                reachAgree++;
            }
            stepsLocal += tookLocal;
            stepsGlobal += tookGlobal;
        }

        System.out.println("over " + trials + " random directed graphs on up to 7 nodes:");
        System.out.println("  counting paths, the two sets agreed      " + pad(String.valueOf(pathsAgree), 6));
        System.out.println("  the global set counted too few           " + pad(String.valueOf(globalLow), 6));
        System.out.println("  the global set counted too many          " + pad(String.valueOf(globalHigh), 6));
        System.out.println("  reachability, the two sets agreed        " + pad(String.valueOf(reachAgree), 6));
        System.out.println("  node entries, path-local against global  " + pad(String.valueOf(stepsLocal), 6)
                + pad(String.valueOf(stepsGlobal), 7));
        System.out.println();
        System.out.println("The diamond table is the cost of the other mistake. Unmarking on the way");
        System.out.println("out is required for counting routes and ruinous for anything else: with");
        System.out.println("16 diamonds there are 65,536 routes and the path-local walk enters a node");
        System.out.println("262,141 times, while the global set enters each of the 49 nodes once.");
        System.out.println();
        System.out.println("Both sets answer reachability correctly, so a test that only checks");
        System.out.println("\\"which nodes can be reached\\" passes either way -- and the global one does");
        System.out.println("it in far fewer entries, which is the whole reason it exists. Counting");
        System.out.println("routes is a different question, and there the global set is wrong in one");
        System.out.println("direction: it never over-counts, it simply stops at the first route into");
        System.out.println("each node. Unmark on the way out when the question is about routes; do");
        System.out.println("not when it is about nodes.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The other half of the discipline: what "visited" is allowed to mean depends on
// the question, and the two meanings live in the same variable name.
//
//   a global visited set  -- "this node has been dealt with, ever". Correct for
//                            reachability, connectivity, one shortest distance.
//   a path-local seen set -- "this node is on the route I am currently walking".
//                            Correct for enumerating routes.
//
// Use the global one to count paths and it answers a different question: it will
// find one route to each node and stop, because the second route runs into a
// node the first route already claimed. The answers look plausible and are low.

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

void step_path_local(const std::vector<std::vector<int>>& neighbours, std::vector<char>& on_path,
                     long long& total, int target, int v) {
    if (v == target) {
        total++;
        return;
    }
    on_path[v] = 1;
    for (int u : neighbours[v]) {
        if (!on_path[u]) {
            step_path_local(neighbours, on_path, total, target, u);
        }
    }
    on_path[v] = 0;
}

// Unmark on the way out, so a node can appear on many different routes.
long long count_paths_path_local(int n, const std::vector<Edge>& edges, int start, int target) {
    std::vector<std::vector<int>> neighbours = build(n, edges);
    std::vector<char> on_path(n, 0);
    long long total = 0;
    step_path_local(neighbours, on_path, total, target, start);
    return total;
}

void step_global(const std::vector<std::vector<int>>& neighbours, std::vector<char>& seen,
                 long long& total, int target, int v) {
    if (v == target) {
        total++;
        return;
    }
    seen[v] = 1;
    for (int u : neighbours[v]) {
        if (!seen[u]) {
            step_global(neighbours, seen, total, target, u);
        }
    }
}

// Never unmark. Each node is entered once in the whole search.
long long count_paths_global(int n, const std::vector<Edge>& edges, int start, int target) {
    std::vector<std::vector<int>> neighbours = build(n, edges);
    std::vector<char> seen(n, 0);
    long long total = 0;
    step_global(neighbours, seen, total, target, start);
    return total;
}

void walk_path_local(const std::vector<std::vector<int>>& neighbours, std::vector<char>& on_path,
                     std::vector<char>& found, long long& steps, int v) {
    steps++;
    found[v] = 1;
    on_path[v] = 1;
    for (int u : neighbours[v]) {
        if (!on_path[u]) {
            walk_path_local(neighbours, on_path, found, steps, u);
        }
    }
    on_path[v] = 0;
}

// Reachability with the path-local set. Correct, and does far more work.
long long reachable_path_local(int n, const std::vector<Edge>& edges, int start,
                               std::vector<char>& found) {
    std::vector<std::vector<int>> neighbours = build(n, edges);
    std::vector<char> on_path(n, 0);
    found.assign(n, 0);
    long long steps = 0;
    walk_path_local(neighbours, on_path, found, steps, start);
    return steps;
}

void walk_global(const std::vector<std::vector<int>>& neighbours, std::vector<char>& seen,
                 long long& steps, int v) {
    steps++;
    seen[v] = 1;
    for (int u : neighbours[v]) {
        if (!seen[u]) {
            walk_global(neighbours, seen, steps, u);
        }
    }
}

// Reachability with the global set. Correct, and each node entered once.
long long reachable_global(int n, const std::vector<Edge>& edges, int start,
                           std::vector<char>& found) {
    std::vector<std::vector<int>> neighbours = build(n, edges);
    found.assign(n, 0);
    long long steps = 0;
    walk_global(neighbours, found, steps, start);
    return steps;
}

bool same_flags(const std::vector<char>& a, const std::vector<char>& b) {
    for (size_t i = 0; i < a.size(); i++) {
        if (a[i] != b[i]) {
            return false;
        }
    }
    return true;
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

// k diamonds in a row. Each one doubles the number of routes through it.
std::vector<Edge> diamonds(int k) {
    std::vector<Edge> edges;
    for (int i = 0; i < k; i++) {
        int a = 3 * i;
        edges.push_back(Edge(a, a + 1));
        edges.push_back(Edge(a, a + 2));
        edges.push_back(Edge(a + 1, a + 3));
        edges.push_back(Edge(a + 2, a + 3));
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
    std::vector<int> sizes = {4, 5, 4, 6};
    std::vector<std::vector<Edge>> cases = {
        {{0, 1}, {0, 2}, {1, 3}, {2, 3}},
        {{0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}, {0, 4}},
        {{0, 1}, {1, 2}, {2, 3}},
        {{0, 1}, {0, 2}, {0, 3}, {1, 4}, {2, 4}, {3, 4}, {4, 5}},
    };

    std::cout << std::left << std::setw(52) << "edges" << std::right << std::setw(18)
              << "paths, unmarking" << std::setw(15) << "paths, global" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        int n = sizes[c];
        std::cout << std::left << std::setw(52) << show_edges(cases[c]) << std::right
                  << std::setw(18) << count_paths_path_local(n, cases[c], 0, n - 1)
                  << std::setw(15) << count_paths_global(n, cases[c], 0, n - 1) << "\\n";
    }
    std::cout << "\\n";

    std::cout << std::left << std::setw(12) << "diamonds" << std::right << std::setw(7) << "nodes"
              << std::setw(9) << "routes" << std::setw(20) << "entries, unmarking"
              << std::setw(17) << "entries, global" << "\\n";
    std::vector<int> ks = {1, 4, 8, 12, 16};
    for (int k : ks) {
        int n = 3 * k + 1;
        std::vector<Edge> edges = diamonds(k);
        std::vector<char> found;
        long long took_local = reachable_path_local(n, edges, 0, found);
        long long took_global = reachable_global(n, edges, 0, found);
        std::cout << std::left << std::setw(12) << k << std::right << std::setw(7) << n
                  << std::setw(9) << count_paths_path_local(n, edges, 0, n - 1)
                  << std::setw(20) << took_local << std::setw(17) << took_global << "\\n";
    }
    std::cout << "\\n";

    int trials = 3000;
    int paths_agree = 0;
    int global_low = 0;
    int global_high = 0;
    int reach_agree = 0;
    long long steps_local = 0;
    long long steps_global = 0;
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
        long long truth = count_paths_path_local(n, edges, 0, n - 1);
        long long guess = count_paths_global(n, edges, 0, n - 1);
        if (guess == truth) {
            paths_agree++;
        }
        if (guess < truth) {
            global_low++;
        }
        if (guess > truth) {
            global_high++;
        }
        std::vector<char> found_local;
        std::vector<char> found_global;
        steps_local += reachable_path_local(n, edges, 0, found_local);
        steps_global += reachable_global(n, edges, 0, found_global);
        if (same_flags(found_local, found_global)) {
            reach_agree++;
        }
    }

    std::cout << "over " << trials << " random directed graphs on up to 7 nodes:\\n";
    std::cout << "  counting paths, the two sets agreed      " << std::setw(6) << paths_agree << "\\n";
    std::cout << "  the global set counted too few           " << std::setw(6) << global_low << "\\n";
    std::cout << "  the global set counted too many          " << std::setw(6) << global_high << "\\n";
    std::cout << "  reachability, the two sets agreed        " << std::setw(6) << reach_agree << "\\n";
    std::cout << "  node entries, path-local against global  " << std::setw(6) << steps_local
              << std::setw(7) << steps_global << "\\n";
    std::cout << "\\n";
    std::cout << "The diamond table is the cost of the other mistake. Unmarking on the way\\n";
    std::cout << "out is required for counting routes and ruinous for anything else: with\\n";
    std::cout << "16 diamonds there are 65,536 routes and the path-local walk enters a node\\n";
    std::cout << "262,141 times, while the global set enters each of the 49 nodes once.\\n";
    std::cout << "\\n";
    std::cout << "Both sets answer reachability correctly, so a test that only checks\\n";
    std::cout << "\\"which nodes can be reached\\" passes either way -- and the global one does\\n";
    std::cout << "it in far fewer entries, which is the whole reason it exists. Counting\\n";
    std::cout << "routes is a different question, and there the global set is wrong in one\\n";
    std::cout << "direction: it never over-counts, it simply stops at the first route into\\n";
    std::cout << "each node. Unmark on the way out when the question is about routes; do\\n";
    std::cout << "not when it is about nodes.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// The other half of the discipline: what "visited" is allowed to mean depends on
// the question, and the two meanings live in the same variable name.
//
//   a global visited set  -- "this node has been dealt with, ever". Correct for
//                            reachability, connectivity, one shortest distance.
//   a path-local seen set -- "this node is on the route I am currently walking".
//                            Correct for enumerating routes.
//
// Use the global one to count paths and it answers a different question: it will
// find one route to each node and stop, because the second route runs into a
// node the first route already claimed. The answers look plausible and are low.

fn build(n: usize, edges: &[(usize, usize)]) -> Vec<Vec<usize>> {
    let mut neighbours = vec![Vec::new(); n];
    for &(u, v) in edges {
        neighbours[u].push(v);
    }
    neighbours
}

fn step_path_local(
    neighbours: &[Vec<usize>],
    on_path: &mut Vec<bool>,
    total: &mut i64,
    target: usize,
    v: usize,
) {
    if v == target {
        *total += 1;
        return;
    }
    on_path[v] = true;
    for i in 0..neighbours[v].len() {
        let u = neighbours[v][i];
        if !on_path[u] {
            step_path_local(neighbours, on_path, total, target, u);
        }
    }
    on_path[v] = false;
}

/// Unmark on the way out, so a node can appear on many different routes.
fn count_paths_path_local(n: usize, edges: &[(usize, usize)], start: usize, target: usize) -> i64 {
    let neighbours = build(n, edges);
    let mut on_path = vec![false; n];
    let mut total = 0;
    step_path_local(&neighbours, &mut on_path, &mut total, target, start);
    total
}

fn step_global(
    neighbours: &[Vec<usize>],
    seen: &mut Vec<bool>,
    total: &mut i64,
    target: usize,
    v: usize,
) {
    if v == target {
        *total += 1;
        return;
    }
    seen[v] = true;
    for i in 0..neighbours[v].len() {
        let u = neighbours[v][i];
        if !seen[u] {
            step_global(neighbours, seen, total, target, u);
        }
    }
}

/// Never unmark. Each node is entered once in the whole search.
fn count_paths_global(n: usize, edges: &[(usize, usize)], start: usize, target: usize) -> i64 {
    let neighbours = build(n, edges);
    let mut seen = vec![false; n];
    let mut total = 0;
    step_global(&neighbours, &mut seen, &mut total, target, start);
    total
}

fn walk_path_local(
    neighbours: &[Vec<usize>],
    on_path: &mut Vec<bool>,
    found: &mut Vec<bool>,
    steps: &mut i64,
    v: usize,
) {
    *steps += 1;
    found[v] = true;
    on_path[v] = true;
    for i in 0..neighbours[v].len() {
        let u = neighbours[v][i];
        if !on_path[u] {
            walk_path_local(neighbours, on_path, found, steps, u);
        }
    }
    on_path[v] = false;
}

/// Reachability with the path-local set. Correct, and does far more work.
fn reachable_path_local(n: usize, edges: &[(usize, usize)], start: usize) -> (Vec<bool>, i64) {
    let neighbours = build(n, edges);
    let mut on_path = vec![false; n];
    let mut found = vec![false; n];
    let mut steps = 0;
    walk_path_local(&neighbours, &mut on_path, &mut found, &mut steps, start);
    (found, steps)
}

fn walk_global(neighbours: &[Vec<usize>], seen: &mut Vec<bool>, steps: &mut i64, v: usize) {
    *steps += 1;
    seen[v] = true;
    for i in 0..neighbours[v].len() {
        let u = neighbours[v][i];
        if !seen[u] {
            walk_global(neighbours, seen, steps, u);
        }
    }
}

/// Reachability with the global set. Correct, and each node entered once.
fn reachable_global(n: usize, edges: &[(usize, usize)], start: usize) -> (Vec<bool>, i64) {
    let neighbours = build(n, edges);
    let mut seen = vec![false; n];
    let mut steps = 0;
    walk_global(&neighbours, &mut seen, &mut steps, start);
    (seen, steps)
}

fn same_flags(a: &[bool], b: &[bool]) -> bool {
    for i in 0..a.len() {
        if a[i] != b[i] {
            return false;
        }
    }
    true
}

fn show_edges(edges: &[(usize, usize)]) -> String {
    let parts: Vec<String> = edges.iter().map(|&(u, v)| format!("{}->{}", u, v)).collect();
    format!("[{}]", parts.join(", "))
}

/// k diamonds in a row. Each one doubles the number of routes through it.
fn diamonds(k: usize) -> (usize, Vec<(usize, usize)>) {
    let mut edges = Vec::new();
    for i in 0..k {
        let a = 3 * i;
        edges.push((a, a + 1));
        edges.push((a, a + 2));
        edges.push((a + 1, a + 3));
        edges.push((a + 2, a + 3));
    }
    (3 * k + 1, edges)
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
    let sizes: Vec<usize> = vec![4, 5, 4, 6];
    let cases: Vec<Vec<(usize, usize)>> = vec![
        vec![(0, 1), (0, 2), (1, 3), (2, 3)],
        vec![(0, 1), (0, 2), (1, 3), (2, 3), (3, 4), (0, 4)],
        vec![(0, 1), (1, 2), (2, 3)],
        vec![(0, 1), (0, 2), (0, 3), (1, 4), (2, 4), (3, 4), (4, 5)],
    ];

    println!(
        "{}{}{}",
        pad_right("edges", 52),
        pad_left("paths, unmarking", 18),
        pad_left("paths, global", 15)
    );
    for (c, edges) in cases.iter().enumerate() {
        let n = sizes[c];
        println!(
            "{}{}{}",
            pad_right(&show_edges(edges), 52),
            pad_left(&count_paths_path_local(n, edges, 0, n - 1).to_string(), 18),
            pad_left(&count_paths_global(n, edges, 0, n - 1).to_string(), 15)
        );
    }
    println!();

    println!(
        "{}{}{}{}{}",
        pad_right("diamonds", 12),
        pad_left("nodes", 7),
        pad_left("routes", 9),
        pad_left("entries, unmarking", 20),
        pad_left("entries, global", 17)
    );
    for k in [1usize, 4, 8, 12, 16] {
        let (n, edges) = diamonds(k);
        let (_, took_local) = reachable_path_local(n, &edges, 0);
        let (_, took_global) = reachable_global(n, &edges, 0);
        println!(
            "{}{}{}{}{}",
            pad_right(&k.to_string(), 12),
            pad_left(&n.to_string(), 7),
            pad_left(&count_paths_path_local(n, &edges, 0, n - 1).to_string(), 9),
            pad_left(&took_local.to_string(), 20),
            pad_left(&took_global.to_string(), 17)
        );
    }
    println!();

    let mut rng = Rng { seed: 1 };
    let trials = 3000;
    let mut paths_agree = 0;
    let mut global_low = 0;
    let mut global_high = 0;
    let mut reach_agree = 0;
    let mut steps_local = 0i64;
    let mut steps_global = 0i64;
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
        let truth = count_paths_path_local(n, &edges, 0, n - 1);
        let guess = count_paths_global(n, &edges, 0, n - 1);
        if guess == truth {
            paths_agree += 1;
        }
        if guess < truth {
            global_low += 1;
        }
        if guess > truth {
            global_high += 1;
        }
        let (found_local, took_local) = reachable_path_local(n, &edges, 0);
        let (found_global, took_global) = reachable_global(n, &edges, 0);
        if same_flags(&found_local, &found_global) {
            reach_agree += 1;
        }
        steps_local += took_local;
        steps_global += took_global;
    }

    println!("over {} random directed graphs on up to 7 nodes:", trials);
    println!("  counting paths, the two sets agreed      {}", pad_left(&paths_agree.to_string(), 6));
    println!("  the global set counted too few           {}", pad_left(&global_low.to_string(), 6));
    println!("  the global set counted too many          {}", pad_left(&global_high.to_string(), 6));
    println!("  reachability, the two sets agreed        {}", pad_left(&reach_agree.to_string(), 6));
    println!(
        "  node entries, path-local against global  {}{}",
        pad_left(&steps_local.to_string(), 6),
        pad_left(&steps_global.to_string(), 7)
    );
    println!();
    println!("The diamond table is the cost of the other mistake. Unmarking on the way");
    println!("out is required for counting routes and ruinous for anything else: with");
    println!("16 diamonds there are 65,536 routes and the path-local walk enters a node");
    println!("262,141 times, while the global set enters each of the 49 nodes once.");
    println!();
    println!("Both sets answer reachability correctly, so a test that only checks");
    println!("\\"which nodes can be reached\\" passes either way -- and the global one does");
    println!("it in far fewer entries, which is the whole reason it exists. Counting");
    println!("routes is a different question, and there the global set is wrong in one");
    println!("direction: it never over-counts, it simply stops at the first route into");
    println!("each node. Unmark on the way out when the question is about routes; do");
    println!("not when it is about nodes.");
}
`,
            },
            {
              lang: "go",
              code: `// The other half of the discipline: what "visited" is allowed to mean depends on
// the question, and the two meanings live in the same variable name.
//
//   a global visited set  -- "this node has been dealt with, ever". Correct for
//                            reachability, connectivity, one shortest distance.
//   a path-local seen set -- "this node is on the route I am currently walking".
//                            Correct for enumerating routes.
//
// Use the global one to count paths and it answers a different question: it will
// find one route to each node and stop, because the second route runs into a
// node the first route already claimed. The answers look plausible and are low.

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

// Unmark on the way out, so a node can appear on many different routes.
func countPathsPathLocal(n int, edges []edge, start, target int) int {
	neighbours := build(n, edges)
	onPath := make([]bool, n)
	total := 0
	var step func(v int)
	step = func(v int) {
		if v == target {
			total++
			return
		}
		onPath[v] = true
		for _, u := range neighbours[v] {
			if !onPath[u] {
				step(u)
			}
		}
		onPath[v] = false
	}
	step(start)
	return total
}

// Never unmark. Each node is entered once in the whole search.
func countPathsGlobal(n int, edges []edge, start, target int) int {
	neighbours := build(n, edges)
	seen := make([]bool, n)
	total := 0
	var step func(v int)
	step = func(v int) {
		if v == target {
			total++
			return
		}
		seen[v] = true
		for _, u := range neighbours[v] {
			if !seen[u] {
				step(u)
			}
		}
	}
	step(start)
	return total
}

// Reachability with the path-local set. Correct, and does far more work.
func reachablePathLocal(n int, edges []edge, start int) ([]bool, int) {
	neighbours := build(n, edges)
	onPath := make([]bool, n)
	found := make([]bool, n)
	steps := 0
	var step func(v int)
	step = func(v int) {
		steps++
		found[v] = true
		onPath[v] = true
		for _, u := range neighbours[v] {
			if !onPath[u] {
				step(u)
			}
		}
		onPath[v] = false
	}
	step(start)
	return found, steps
}

// Reachability with the global set. Correct, and each node entered once.
func reachableGlobal(n int, edges []edge, start int) ([]bool, int) {
	neighbours := build(n, edges)
	seen := make([]bool, n)
	steps := 0
	var step func(v int)
	step = func(v int) {
		steps++
		seen[v] = true
		for _, u := range neighbours[v] {
			if !seen[u] {
				step(u)
			}
		}
	}
	step(start)
	return seen, steps
}

func sameFlags(a, b []bool) bool {
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func showEdges(edges []edge) string {
	parts := make([]string, len(edges))
	for i, e := range edges {
		parts[i] = fmt.Sprintf("%d->%d", e.from, e.to)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

// k diamonds in a row. Each one doubles the number of routes through it.
func diamonds(k int) (int, []edge) {
	edges := []edge{}
	for i := 0; i < k; i++ {
		a := 3 * i
		edges = append(edges, edge{a, a + 1}, edge{a, a + 2},
			edge{a + 1, a + 3}, edge{a + 2, a + 3})
	}
	return 3*k + 1, edges
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	sizes := []int{4, 5, 4, 6}
	cases := [][]edge{
		{{0, 1}, {0, 2}, {1, 3}, {2, 3}},
		{{0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}, {0, 4}},
		{{0, 1}, {1, 2}, {2, 3}},
		{{0, 1}, {0, 2}, {0, 3}, {1, 4}, {2, 4}, {3, 4}, {4, 5}},
	}

	fmt.Printf("%-52s%18s%15s\\n", "edges", "paths, unmarking", "paths, global")
	for c, edges := range cases {
		n := sizes[c]
		fmt.Printf("%-52s%18d%15d\\n", showEdges(edges),
			countPathsPathLocal(n, edges, 0, n-1), countPathsGlobal(n, edges, 0, n-1))
	}
	fmt.Println()

	fmt.Printf("%-12s%7s%9s%20s%17s\\n", "diamonds", "nodes", "routes",
		"entries, unmarking", "entries, global")
	for _, k := range []int{1, 4, 8, 12, 16} {
		n, edges := diamonds(k)
		_, tookLocal := reachablePathLocal(n, edges, 0)
		_, tookGlobal := reachableGlobal(n, edges, 0)
		fmt.Printf("%-12d%7d%9d%20d%17d\\n", k, n,
			countPathsPathLocal(n, edges, 0, n-1), tookLocal, tookGlobal)
	}
	fmt.Println()

	trials := 3000
	pathsAgree := 0
	globalLow := 0
	globalHigh := 0
	reachAgree := 0
	stepsLocal := 0
	stepsGlobal := 0
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
		truth := countPathsPathLocal(n, edges, 0, n-1)
		guess := countPathsGlobal(n, edges, 0, n-1)
		if guess == truth {
			pathsAgree++
		}
		if guess < truth {
			globalLow++
		}
		if guess > truth {
			globalHigh++
		}
		foundLocal, tookLocal := reachablePathLocal(n, edges, 0)
		foundGlobal, tookGlobal := reachableGlobal(n, edges, 0)
		if sameFlags(foundLocal, foundGlobal) {
			reachAgree++
		}
		stepsLocal += tookLocal
		stepsGlobal += tookGlobal
	}

	fmt.Printf("over %d random directed graphs on up to 7 nodes:\\n", trials)
	fmt.Printf("  counting paths, the two sets agreed      %6d\\n", pathsAgree)
	fmt.Printf("  the global set counted too few           %6d\\n", globalLow)
	fmt.Printf("  the global set counted too many          %6d\\n", globalHigh)
	fmt.Printf("  reachability, the two sets agreed        %6d\\n", reachAgree)
	fmt.Printf("  node entries, path-local against global  %6d%7d\\n", stepsLocal, stepsGlobal)
	fmt.Println()
	fmt.Println("The diamond table is the cost of the other mistake. Unmarking on the way")
	fmt.Println("out is required for counting routes and ruinous for anything else: with")
	fmt.Println("16 diamonds there are 65,536 routes and the path-local walk enters a node")
	fmt.Println("262,141 times, while the global set enters each of the 49 nodes once.")
	fmt.Println()
	fmt.Println("Both sets answer reachability correctly, so a test that only checks")
	fmt.Println("\\"which nodes can be reached\\" passes either way -- and the global one does")
	fmt.Println("it in far fewer entries, which is the whole reason it exists. Counting")
	fmt.Println("routes is a different question, and there the global set is wrong in one")
	fmt.Println("direction: it never over-counts, it simply stops at the first route into")
	fmt.Println("each node. Unmark on the way out when the question is about routes; do")
	fmt.Println("not when it is about nodes.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "A global visited set cannot enumerate routes",
          body: "It finds one route into each node and stops, because later routes hit nodes the first one claimed. Over 3,000 random directed graphs it undercounted on 150 and never overcounted. If the question is \"how many ways\" or \"list the ways\", the set has to be unmarked on the way out.",
        },
        {
          title: "Unmarking on the way out when the question is about nodes",
          body: "The walk stops being linear and becomes exponential in the number of routes. On a chain of 16 diamonds -- 49 nodes -- that was 262,141 node entries against 49. Reachability is still correct, so only the running time reveals it.",
        },
      ],
    },
    {
      id: "what-the-set-is-stored-in",
      heading: "What the set is stored in",
      body: [
        "The third look is what the set is stored in, which only looks trivial because textbook graphs number their nodes `0` to `n-1`.",
        "Real nodes are usually states \u2014 a board position, a `(place, keys)` pair, a string, a tuple of counters. There is no array to index into, so membership has to be arranged, and the arrangement is a real decision with measurable consequences.",
        "The example runs the same search three times over a state that is a pair of coordinates, counting every membership test. A flat array with one slot per state pays one probe per edge: 4,640 on the largest run. A list of what has been seen, scanned linearly, pays the length of the list every time: 3,712,725. Bucketing the state into one of 97 lists and scanning only that one: 39,096. Same search, same states queued, three orders of magnitude between the ends.",
        "The flat array wins whenever the state can be numbered and the numbering is not too sparse. A pair on a 40 by 40 board is 1,600 slots, and 1,600 slots is nothing. That is why grid problems, and problems where the state is a small tuple, should almost always compute an integer key and index an array \u2014 it is faster than a hash set and it is not harder.",
        "It stops being possible when the state space is enormous and mostly unvisited. A chess position cannot be an array index. There the bucketed set \u2014 a hash set, in whatever the language calls it \u2014 is the only one of the three that is both correct and affordable, and the scanned list is never the answer once there are more than a handful of states.",
      ],
      examples: [
        {
          id: "three-containers",
          title: "The same search with membership answered three ways",
          lang: "python",
          code: `# The last question about the visited set is what to store it in, and it only
# looks trivial because textbook graphs have nodes numbered 0 to n-1.
#
# Real nodes are usually states: a board position, a (place, keys) pair, a
# string. There is no array to index, so membership has to be arranged, and
# the three obvious arrangements cost very different amounts.
#
#   a flat array   -- one slot per possible state. Instant, and only possible
#                     when the states can be numbered and there are not too many.
#   a scanned list -- keep what has been seen and look through it. No setup,
#                     and every test costs the length of the list.
#   buckets        -- send the state to one of k lists by a cheap function, and
#                     scan only that list.
#
# The search below is the same search three times over a state that is a pair,
# with every membership test counted.

WIDTH = 40


def neighbours_of(a, b):
    """The moves. A state is a pair, and the graph is never built."""
    out = []
    if a + 1 < WIDTH:
        out.append((a + 1, b))
    if b + 1 < WIDTH:
        out.append((a, b + 1))
    if a > 0 and b > 0:
        out.append((a - 1, b - 1))
    return out


def search_flat(start, target):
    """One slot per state. Numbering the state is the whole trick."""
    seen = [False] * (WIDTH * WIDTH)
    probes = 0
    queue = [start]
    seen[start[0] * WIDTH + start[1]] = True
    head = 0
    while head < len(queue):
        a, b = queue[head]
        head += 1
        if (a, b) == target:
            return len(queue), probes
        for c, d in neighbours_of(a, b):
            probes += 1
            if not seen[c * WIDTH + d]:
                seen[c * WIDTH + d] = True
                queue.append((c, d))
    return len(queue), probes


def search_scanned(start, target):
    """Keep a list and look through it. Correct, and quadratic in the states."""
    seen = [start]
    probes = 0
    queue = [start]
    head = 0
    while head < len(queue):
        a, b = queue[head]
        head += 1
        if (a, b) == target:
            return len(queue), probes
        for c, d in neighbours_of(a, b):
            found = False
            for e, f in seen:
                probes += 1
                if e == c and f == d:
                    found = True
                    break
            if not found:
                seen.append((c, d))
                queue.append((c, d))
    return len(queue), probes


BUCKETS = 97


def search_bucketed(start, target):
    """Send each state to one of a few lists, then scan only that list."""
    seen = [[] for _ in range(BUCKETS)]
    probes = 0
    seen[(start[0] * 31 + start[1]) % BUCKETS].append(start)
    queue = [start]
    head = 0
    while head < len(queue):
        a, b = queue[head]
        head += 1
        if (a, b) == target:
            return len(queue), probes
        for c, d in neighbours_of(a, b):
            key = (c * 31 + d) % BUCKETS
            found = False
            for e, f in seen[key]:
                probes += 1
                if e == c and f == d:
                    found = True
                    break
            if not found:
                seen[key].append((c, d))
                queue.append((c, d))
    return len(queue), probes


TARGETS = [(5, 5), (12, 12), (25, 25), (39, 39)]

agreed = 0

print(f"{'target':<12}{'states queued':>15}{'probes, flat':>14}"
      f"{'probes, scanned':>17}{'probes, bucketed':>18}")
for target in TARGETS:
    queued_flat, probes_flat = search_flat((0, 0), target)
    queued_scan, probes_scan = search_scanned((0, 0), target)
    queued_buck, probes_buck = search_bucketed((0, 0), target)
    if queued_flat == queued_scan and queued_flat == queued_buck:
        agreed += 1
    print(f"{str(target):<12}{queued_flat:>15}{probes_flat:>14}"
          f"{probes_scan:>17}{probes_buck:>18}")
print()

print(f"the three containers queued the same states on {agreed} of {len(TARGETS)} targets.")
print()
print("All three searches queue exactly the same states, because they are the")
print("same search -- only the membership test differs. The flat array pays one")
print("probe per edge and nothing else. The scanned list pays the length of the")
print("list every time, so its cost is quadratic in the number of states. The")
print("buckets pay the length of one bucket, which is the whole reason a hash")
print("set exists.")
print()
print("The flat array is the right answer whenever the state can be numbered")
print("and the numbering is not too sparse -- a pair on a 40 by 40 board is")
print("1,600 slots and trivially worth it. It stops being right when the state")
print("space is enormous and mostly unvisited: a chess position cannot be an")
print("array index, and there the bucketed set is the only one of the three")
print("that is both correct and affordable.")
`,
          output: `target        states queued  probes, flat  probes, scanned  probes, bucketed
(5, 5)                   72           160             5349               113
(12, 12)                338           888           143011              1617
(25, 25)               1208          3435          2044327             21744
(39, 39)               1600          4640          3712725             39096

the three containers queued the same states on 4 of 4 targets.

All three searches queue exactly the same states, because they are the
same search -- only the membership test differs. The flat array pays one
probe per edge and nothing else. The scanned list pays the length of the
list every time, so its cost is quadratic in the number of states. The
buckets pay the length of one bucket, which is the whole reason a hash
set exists.

The flat array is the right answer whenever the state can be numbered
and the numbering is not too sparse -- a pair on a 40 by 40 board is
1,600 slots and trivially worth it. It stops being right when the state
space is enormous and mostly unvisited: a chess position cannot be an
array index, and there the bucketed set is the only one of the three
that is both correct and affordable.`,
          explanation:
            "The same search over a state that is a pair, with membership answered three ways and every probe counted. The states queued are identical; the probes are three orders of magnitude apart.",
          alternates: [
            {
              lang: "javascript",
              code: `// The last question about the visited set is what to store it in, and it only
// looks trivial because textbook graphs have nodes numbered 0 to n-1.
//
// Real nodes are usually states: a board position, a (place, keys) pair, a
// string. There is no array to index, so membership has to be arranged, and
// the three obvious arrangements cost very different amounts.
//
//   a flat array   -- one slot per possible state. Instant, and only possible
//                     when the states can be numbered and there are not too many.
//   a scanned list -- keep what has been seen and look through it. No setup,
//                     and every test costs the length of the list.
//   buckets        -- send the state to one of k lists by a cheap function, and
//                     scan only that list.
//
// The search below is the same search three times over a state that is a pair,
// with every membership test counted.

const WIDTH = 40;

/** The moves. A state is a pair, and the graph is never built. */
function neighboursOf(a, b) {
  const out = [];
  if (a + 1 < WIDTH) out.push([a + 1, b]);
  if (b + 1 < WIDTH) out.push([a, b + 1]);
  if (a > 0 && b > 0) out.push([a - 1, b - 1]);
  return out;
}

/** One slot per state. Numbering the state is the whole trick. */
function searchFlat(start, target) {
  const seen = new Array(WIDTH * WIDTH).fill(false);
  let probes = 0;
  const queue = [start];
  seen[start[0] * WIDTH + start[1]] = true;
  let head = 0;
  while (head < queue.length) {
    const [a, b] = queue[head];
    head += 1;
    if (a === target[0] && b === target[1]) return [queue.length, probes];
    for (const [c, d] of neighboursOf(a, b)) {
      probes += 1;
      if (!seen[c * WIDTH + d]) {
        seen[c * WIDTH + d] = true;
        queue.push([c, d]);
      }
    }
  }
  return [queue.length, probes];
}

/** Keep a list and look through it. Correct, and quadratic in the states. */
function searchScanned(start, target) {
  const seen = [start];
  let probes = 0;
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const [a, b] = queue[head];
    head += 1;
    if (a === target[0] && b === target[1]) return [queue.length, probes];
    for (const [c, d] of neighboursOf(a, b)) {
      let found = false;
      for (const [e, f] of seen) {
        probes += 1;
        if (e === c && f === d) {
          found = true;
          break;
        }
      }
      if (!found) {
        seen.push([c, d]);
        queue.push([c, d]);
      }
    }
  }
  return [queue.length, probes];
}

const BUCKETS = 97;

/** Send each state to one of a few lists, then scan only that list. */
function searchBucketed(start, target) {
  const seen = Array.from({ length: BUCKETS }, () => []);
  let probes = 0;
  seen[(start[0] * 31 + start[1]) % BUCKETS].push(start);
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const [a, b] = queue[head];
    head += 1;
    if (a === target[0] && b === target[1]) return [queue.length, probes];
    for (const [c, d] of neighboursOf(a, b)) {
      const key = (c * 31 + d) % BUCKETS;
      let found = false;
      for (const [e, f] of seen[key]) {
        probes += 1;
        if (e === c && f === d) {
          found = true;
          break;
        }
      }
      if (!found) {
        seen[key].push([c, d]);
        queue.push([c, d]);
      }
    }
  }
  return [queue.length, probes];
}

const padEnd = (v, w) => String(v).padEnd(w);
const pad = (v, w) => String(v).padStart(w);

const TARGETS = [[5, 5], [12, 12], [25, 25], [39, 39]];

let agreed = 0;

console.log(
  padEnd("target", 12) +
    pad("states queued", 15) +
    pad("probes, flat", 14) +
    pad("probes, scanned", 17) +
    pad("probes, bucketed", 18)
);
for (const target of TARGETS) {
  const [queuedFlat, probesFlat] = searchFlat([0, 0], target);
  const [queuedScan, probesScan] = searchScanned([0, 0], target);
  const [queuedBuck, probesBuck] = searchBucketed([0, 0], target);
  if (queuedFlat === queuedScan && queuedFlat === queuedBuck) agreed += 1;
  console.log(
    padEnd(\`(\${target[0]}, \${target[1]})\`, 12) +
      pad(queuedFlat, 15) +
      pad(probesFlat, 14) +
      pad(probesScan, 17) +
      pad(probesBuck, 18)
  );
}
console.log();

console.log(\`the three containers queued the same states on \${agreed} of \${TARGETS.length} targets.\`);
console.log();
console.log("All three searches queue exactly the same states, because they are the");
console.log("same search -- only the membership test differs. The flat array pays one");
console.log("probe per edge and nothing else. The scanned list pays the length of the");
console.log("list every time, so its cost is quadratic in the number of states. The");
console.log("buckets pay the length of one bucket, which is the whole reason a hash");
console.log("set exists.");
console.log();
console.log("The flat array is the right answer whenever the state can be numbered");
console.log("and the numbering is not too sparse -- a pair on a 40 by 40 board is");
console.log("1,600 slots and trivially worth it. It stops being right when the state");
console.log("space is enormous and mostly unvisited: a chess position cannot be an");
console.log("array index, and there the bucketed set is the only one of the three");
console.log("that is both correct and affordable.");
`,
            },
            {
              lang: "typescript",
              code: `// The last question about the visited set is what to store it in, and it only
// looks trivial because textbook graphs have nodes numbered 0 to n-1.
//
// Real nodes are usually states: a board position, a (place, keys) pair, a
// string. There is no array to index, so membership has to be arranged, and
// the three obvious arrangements cost very different amounts.
//
//   a flat array   -- one slot per possible state. Instant, and only possible
//                     when the states can be numbered and there are not too many.
//   a scanned list -- keep what has been seen and look through it. No setup,
//                     and every test costs the length of the list.
//   buckets        -- send the state to one of k lists by a cheap function, and
//                     scan only that list.
//
// The search below is the same search three times over a state that is a pair,
// with every membership test counted.

const WIDTH = 40;

type State = [number, number];

/** The moves. A state is a pair, and the graph is never built. */
function neighboursOf(a: number, b: number): State[] {
  const out: State[] = [];
  if (a + 1 < WIDTH) out.push([a + 1, b]);
  if (b + 1 < WIDTH) out.push([a, b + 1]);
  if (a > 0 && b > 0) out.push([a - 1, b - 1]);
  return out;
}

/** One slot per state. Numbering the state is the whole trick. */
function searchFlat(start: State, target: State): [number, number] {
  const seen = new Array(WIDTH * WIDTH).fill(false);
  let probes = 0;
  const queue: State[] = [start];
  seen[start[0] * WIDTH + start[1]] = true;
  let head = 0;
  while (head < queue.length) {
    const [a, b] = queue[head];
    head += 1;
    if (a === target[0] && b === target[1]) return [queue.length, probes];
    for (const [c, d] of neighboursOf(a, b)) {
      probes += 1;
      if (!seen[c * WIDTH + d]) {
        seen[c * WIDTH + d] = true;
        queue.push([c, d]);
      }
    }
  }
  return [queue.length, probes];
}

/** Keep a list and look through it. Correct, and quadratic in the states. */
function searchScanned(start: State, target: State): [number, number] {
  const seen: State[] = [start];
  let probes = 0;
  const queue: State[] = [start];
  let head = 0;
  while (head < queue.length) {
    const [a, b] = queue[head];
    head += 1;
    if (a === target[0] && b === target[1]) return [queue.length, probes];
    for (const [c, d] of neighboursOf(a, b)) {
      let found = false;
      for (const [e, f] of seen) {
        probes += 1;
        if (e === c && f === d) {
          found = true;
          break;
        }
      }
      if (!found) {
        seen.push([c, d]);
        queue.push([c, d]);
      }
    }
  }
  return [queue.length, probes];
}

const BUCKETS = 97;

/** Send each state to one of a few lists, then scan only that list. */
function searchBucketed(start: State, target: State): [number, number] {
  const seen: State[][] = Array.from({ length: BUCKETS }, () => []);
  let probes = 0;
  seen[(start[0] * 31 + start[1]) % BUCKETS].push(start);
  const queue: State[] = [start];
  let head = 0;
  while (head < queue.length) {
    const [a, b] = queue[head];
    head += 1;
    if (a === target[0] && b === target[1]) return [queue.length, probes];
    for (const [c, d] of neighboursOf(a, b)) {
      const key = (c * 31 + d) % BUCKETS;
      let found = false;
      for (const [e, f] of seen[key]) {
        probes += 1;
        if (e === c && f === d) {
          found = true;
          break;
        }
      }
      if (!found) {
        seen[key].push([c, d]);
        queue.push([c, d]);
      }
    }
  }
  return [queue.length, probes];
}

const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const pad = (v: string | number, w: number): string => String(v).padStart(w);

const TARGETS: State[] = [[5, 5], [12, 12], [25, 25], [39, 39]];

let agreed = 0;

console.log(
  padEnd("target", 12) +
    pad("states queued", 15) +
    pad("probes, flat", 14) +
    pad("probes, scanned", 17) +
    pad("probes, bucketed", 18)
);
for (const target of TARGETS) {
  const [queuedFlat, probesFlat] = searchFlat([0, 0], target);
  const [queuedScan, probesScan] = searchScanned([0, 0], target);
  const [queuedBuck, probesBuck] = searchBucketed([0, 0], target);
  if (queuedFlat === queuedScan && queuedFlat === queuedBuck) agreed += 1;
  console.log(
    padEnd(\`(\${target[0]}, \${target[1]})\`, 12) +
      pad(queuedFlat, 15) +
      pad(probesFlat, 14) +
      pad(probesScan, 17) +
      pad(probesBuck, 18)
  );
}
console.log();

console.log(\`the three containers queued the same states on \${agreed} of \${TARGETS.length} targets.\`);
console.log();
console.log("All three searches queue exactly the same states, because they are the");
console.log("same search -- only the membership test differs. The flat array pays one");
console.log("probe per edge and nothing else. The scanned list pays the length of the");
console.log("list every time, so its cost is quadratic in the number of states. The");
console.log("buckets pay the length of one bucket, which is the whole reason a hash");
console.log("set exists.");
console.log();
console.log("The flat array is the right answer whenever the state can be numbered");
console.log("and the numbering is not too sparse -- a pair on a 40 by 40 board is");
console.log("1,600 slots and trivially worth it. It stops being right when the state");
console.log("space is enormous and mostly unvisited: a chess position cannot be an");
console.log("array index, and there the bucketed set is the only one of the three");
console.log("that is both correct and affordable.");
`,
            },
            {
              lang: "java",
              code: `// The last question about the visited set is what to store it in, and it only
// looks trivial because textbook graphs have nodes numbered 0 to n-1.
//
// Real nodes are usually states: a board position, a (place, keys) pair, a
// string. There is no array to index, so membership has to be arranged, and
// the three obvious arrangements cost very different amounts.
//
//   a flat array   -- one slot per possible state. Instant, and only possible
//                     when the states can be numbered and there are not too many.
//   a scanned list -- keep what has been seen and look through it. No setup,
//                     and every test costs the length of the list.
//   buckets        -- send the state to one of k lists by a cheap function, and
//                     scan only that list.
//
// The search below is the same search three times over a state that is a pair,
// with every membership test counted.

import java.util.ArrayList;
import java.util.List;

public class Main {

    static final int WIDTH = 40;
    static final int BUCKETS = 97;

    /** The moves. A state is a pair, and the graph is never built. */
    static List<int[]> neighboursOf(int a, int b) {
        List<int[]> out = new ArrayList<>();
        if (a + 1 < WIDTH) {
            out.add(new int[] {a + 1, b});
        }
        if (b + 1 < WIDTH) {
            out.add(new int[] {a, b + 1});
        }
        if (a > 0 && b > 0) {
            out.add(new int[] {a - 1, b - 1});
        }
        return out;
    }

    static long lastProbes;

    /** One slot per state. Numbering the state is the whole trick. */
    static int searchFlat(int[] start, int[] target) {
        boolean[] seen = new boolean[WIDTH * WIDTH];
        long probes = 0;
        List<int[]> queue = new ArrayList<>();
        queue.add(start);
        seen[start[0] * WIDTH + start[1]] = true;
        int head = 0;
        while (head < queue.size()) {
            int[] at = queue.get(head);
            head++;
            if (at[0] == target[0] && at[1] == target[1]) {
                lastProbes = probes;
                return queue.size();
            }
            for (int[] next : neighboursOf(at[0], at[1])) {
                probes++;
                if (!seen[next[0] * WIDTH + next[1]]) {
                    seen[next[0] * WIDTH + next[1]] = true;
                    queue.add(next);
                }
            }
        }
        lastProbes = probes;
        return queue.size();
    }

    /** Keep a list and look through it. Correct, and quadratic in the states. */
    static int searchScanned(int[] start, int[] target) {
        List<int[]> seen = new ArrayList<>();
        seen.add(start);
        long probes = 0;
        List<int[]> queue = new ArrayList<>();
        queue.add(start);
        int head = 0;
        while (head < queue.size()) {
            int[] at = queue.get(head);
            head++;
            if (at[0] == target[0] && at[1] == target[1]) {
                lastProbes = probes;
                return queue.size();
            }
            for (int[] next : neighboursOf(at[0], at[1])) {
                boolean found = false;
                for (int[] had : seen) {
                    probes++;
                    if (had[0] == next[0] && had[1] == next[1]) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    seen.add(next);
                    queue.add(next);
                }
            }
        }
        lastProbes = probes;
        return queue.size();
    }

    /** Send each state to one of a few lists, then scan only that list. */
    static int searchBucketed(int[] start, int[] target) {
        List<List<int[]>> seen = new ArrayList<>();
        for (int i = 0; i < BUCKETS; i++) {
            seen.add(new ArrayList<>());
        }
        long probes = 0;
        seen.get((start[0] * 31 + start[1]) % BUCKETS).add(start);
        List<int[]> queue = new ArrayList<>();
        queue.add(start);
        int head = 0;
        while (head < queue.size()) {
            int[] at = queue.get(head);
            head++;
            if (at[0] == target[0] && at[1] == target[1]) {
                lastProbes = probes;
                return queue.size();
            }
            for (int[] next : neighboursOf(at[0], at[1])) {
                int key = (next[0] * 31 + next[1]) % BUCKETS;
                boolean found = false;
                for (int[] had : seen.get(key)) {
                    probes++;
                    if (had[0] == next[0] && had[1] == next[1]) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    seen.get(key).add(next);
                    queue.add(next);
                }
            }
        }
        lastProbes = probes;
        return queue.size();
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

    public static void main(String[] args) {
        int[][] targets = {{5, 5}, {12, 12}, {25, 25}, {39, 39}};
        int agreed = 0;

        System.out.println(padEnd("target", 12) + pad("states queued", 15)
                + pad("probes, flat", 14) + pad("probes, scanned", 17)
                + pad("probes, bucketed", 18));
        for (int[] target : targets) {
            int queuedFlat = searchFlat(new int[] {0, 0}, target);
            long probesFlat = lastProbes;
            int queuedScan = searchScanned(new int[] {0, 0}, target);
            long probesScan = lastProbes;
            int queuedBuck = searchBucketed(new int[] {0, 0}, target);
            long probesBuck = lastProbes;
            if (queuedFlat == queuedScan && queuedFlat == queuedBuck) {
                agreed++;
            }
            System.out.println(padEnd("(" + target[0] + ", " + target[1] + ")", 12)
                    + pad(String.valueOf(queuedFlat), 15)
                    + pad(String.valueOf(probesFlat), 14)
                    + pad(String.valueOf(probesScan), 17)
                    + pad(String.valueOf(probesBuck), 18));
        }
        System.out.println();

        System.out.println("the three containers queued the same states on " + agreed
                + " of " + targets.length + " targets.");
        System.out.println();
        System.out.println("All three searches queue exactly the same states, because they are the");
        System.out.println("same search -- only the membership test differs. The flat array pays one");
        System.out.println("probe per edge and nothing else. The scanned list pays the length of the");
        System.out.println("list every time, so its cost is quadratic in the number of states. The");
        System.out.println("buckets pay the length of one bucket, which is the whole reason a hash");
        System.out.println("set exists.");
        System.out.println();
        System.out.println("The flat array is the right answer whenever the state can be numbered");
        System.out.println("and the numbering is not too sparse -- a pair on a 40 by 40 board is");
        System.out.println("1,600 slots and trivially worth it. It stops being right when the state");
        System.out.println("space is enormous and mostly unvisited: a chess position cannot be an");
        System.out.println("array index, and there the bucketed set is the only one of the three");
        System.out.println("that is both correct and affordable.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The last question about the visited set is what to store it in, and it only
// looks trivial because textbook graphs have nodes numbered 0 to n-1.
//
// Real nodes are usually states: a board position, a (place, keys) pair, a
// string. There is no array to index, so membership has to be arranged, and
// the three obvious arrangements cost very different amounts.
//
//   a flat array   -- one slot per possible state. Instant, and only possible
//                     when the states can be numbered and there are not too many.
//   a scanned list -- keep what has been seen and look through it. No setup,
//                     and every test costs the length of the list.
//   buckets        -- send the state to one of k lists by a cheap function, and
//                     scan only that list.
//
// The search below is the same search three times over a state that is a pair,
// with every membership test counted.

#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

const int WIDTH = 40;
const int BUCKETS = 97;

using State = std::pair<int, int>;

// The moves. A state is a pair, and the graph is never built.
std::vector<State> neighbours_of(State s) {
    std::vector<State> out;
    if (s.first + 1 < WIDTH) {
        out.push_back(State(s.first + 1, s.second));
    }
    if (s.second + 1 < WIDTH) {
        out.push_back(State(s.first, s.second + 1));
    }
    if (s.first > 0 && s.second > 0) {
        out.push_back(State(s.first - 1, s.second - 1));
    }
    return out;
}

// One slot per state. Numbering the state is the whole trick.
int search_flat(State start, State target, long long& probes) {
    std::vector<char> seen(WIDTH * WIDTH, 0);
    probes = 0;
    std::vector<State> queue;
    queue.push_back(start);
    seen[start.first * WIDTH + start.second] = 1;
    size_t head = 0;
    while (head < queue.size()) {
        State at = queue[head];
        head++;
        if (at == target) {
            return static_cast<int>(queue.size());
        }
        for (State next : neighbours_of(at)) {
            probes++;
            if (!seen[next.first * WIDTH + next.second]) {
                seen[next.first * WIDTH + next.second] = 1;
                queue.push_back(next);
            }
        }
    }
    return static_cast<int>(queue.size());
}

// Keep a list and look through it. Correct, and quadratic in the states.
int search_scanned(State start, State target, long long& probes) {
    std::vector<State> seen;
    seen.push_back(start);
    probes = 0;
    std::vector<State> queue;
    queue.push_back(start);
    size_t head = 0;
    while (head < queue.size()) {
        State at = queue[head];
        head++;
        if (at == target) {
            return static_cast<int>(queue.size());
        }
        for (State next : neighbours_of(at)) {
            bool found = false;
            for (State had : seen) {
                probes++;
                if (had == next) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                seen.push_back(next);
                queue.push_back(next);
            }
        }
    }
    return static_cast<int>(queue.size());
}

// Send each state to one of a few lists, then scan only that list.
int search_bucketed(State start, State target, long long& probes) {
    std::vector<std::vector<State>> seen(BUCKETS);
    probes = 0;
    seen[(start.first * 31 + start.second) % BUCKETS].push_back(start);
    std::vector<State> queue;
    queue.push_back(start);
    size_t head = 0;
    while (head < queue.size()) {
        State at = queue[head];
        head++;
        if (at == target) {
            return static_cast<int>(queue.size());
        }
        for (State next : neighbours_of(at)) {
            int key = (next.first * 31 + next.second) % BUCKETS;
            bool found = false;
            for (State had : seen[key]) {
                probes++;
                if (had == next) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                seen[key].push_back(next);
                queue.push_back(next);
            }
        }
    }
    return static_cast<int>(queue.size());
}

int main() {
    std::vector<State> targets = {{5, 5}, {12, 12}, {25, 25}, {39, 39}};
    int agreed = 0;

    std::cout << std::left << std::setw(12) << "target" << std::right << std::setw(15)
              << "states queued" << std::setw(14) << "probes, flat"
              << std::setw(17) << "probes, scanned" << std::setw(18) << "probes, bucketed" << "\\n";
    for (State target : targets) {
        long long probes_flat = 0;
        long long probes_scan = 0;
        long long probes_buck = 0;
        int queued_flat = search_flat(State(0, 0), target, probes_flat);
        int queued_scan = search_scanned(State(0, 0), target, probes_scan);
        int queued_buck = search_bucketed(State(0, 0), target, probes_buck);
        if (queued_flat == queued_scan && queued_flat == queued_buck) {
            agreed++;
        }
        std::string label = "(" + std::to_string(target.first) + ", "
                + std::to_string(target.second) + ")";
        std::cout << std::left << std::setw(12) << label << std::right << std::setw(15) << queued_flat
                  << std::setw(14) << probes_flat << std::setw(17) << probes_scan
                  << std::setw(18) << probes_buck << "\\n";
    }
    std::cout << "\\n";

    std::cout << "the three containers queued the same states on " << agreed << " of "
              << targets.size() << " targets.\\n";
    std::cout << "\\n";
    std::cout << "All three searches queue exactly the same states, because they are the\\n";
    std::cout << "same search -- only the membership test differs. The flat array pays one\\n";
    std::cout << "probe per edge and nothing else. The scanned list pays the length of the\\n";
    std::cout << "list every time, so its cost is quadratic in the number of states. The\\n";
    std::cout << "buckets pay the length of one bucket, which is the whole reason a hash\\n";
    std::cout << "set exists.\\n";
    std::cout << "\\n";
    std::cout << "The flat array is the right answer whenever the state can be numbered\\n";
    std::cout << "and the numbering is not too sparse -- a pair on a 40 by 40 board is\\n";
    std::cout << "1,600 slots and trivially worth it. It stops being right when the state\\n";
    std::cout << "space is enormous and mostly unvisited: a chess position cannot be an\\n";
    std::cout << "array index, and there the bucketed set is the only one of the three\\n";
    std::cout << "that is both correct and affordable.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// The last question about the visited set is what to store it in, and it only
// looks trivial because textbook graphs have nodes numbered 0 to n-1.
//
// Real nodes are usually states: a board position, a (place, keys) pair, a
// string. There is no array to index, so membership has to be arranged, and
// the three obvious arrangements cost very different amounts.
//
//   a flat array   -- one slot per possible state. Instant, and only possible
//                     when the states can be numbered and there are not too many.
//   a scanned list -- keep what has been seen and look through it. No setup,
//                     and every test costs the length of the list.
//   buckets        -- send the state to one of k lists by a cheap function, and
//                     scan only that list.
//
// The search below is the same search three times over a state that is a pair,
// with every membership test counted.

const WIDTH: usize = 40;
const BUCKETS: usize = 97;

type State = (usize, usize);

/// The moves. A state is a pair, and the graph is never built.
fn neighbours_of(s: State) -> Vec<State> {
    let mut out = Vec::new();
    if s.0 + 1 < WIDTH {
        out.push((s.0 + 1, s.1));
    }
    if s.1 + 1 < WIDTH {
        out.push((s.0, s.1 + 1));
    }
    if s.0 > 0 && s.1 > 0 {
        out.push((s.0 - 1, s.1 - 1));
    }
    out
}

/// One slot per state. Numbering the state is the whole trick.
fn search_flat(start: State, target: State) -> (usize, i64) {
    let mut seen = vec![false; WIDTH * WIDTH];
    let mut probes = 0i64;
    let mut queue = vec![start];
    seen[start.0 * WIDTH + start.1] = true;
    let mut head = 0;
    while head < queue.len() {
        let at = queue[head];
        head += 1;
        if at == target {
            return (queue.len(), probes);
        }
        for next in neighbours_of(at) {
            probes += 1;
            if !seen[next.0 * WIDTH + next.1] {
                seen[next.0 * WIDTH + next.1] = true;
                queue.push(next);
            }
        }
    }
    (queue.len(), probes)
}

/// Keep a list and look through it. Correct, and quadratic in the states.
fn search_scanned(start: State, target: State) -> (usize, i64) {
    let mut seen = vec![start];
    let mut probes = 0i64;
    let mut queue = vec![start];
    let mut head = 0;
    while head < queue.len() {
        let at = queue[head];
        head += 1;
        if at == target {
            return (queue.len(), probes);
        }
        for next in neighbours_of(at) {
            let mut found = false;
            for &had in &seen {
                probes += 1;
                if had == next {
                    found = true;
                    break;
                }
            }
            if !found {
                seen.push(next);
                queue.push(next);
            }
        }
    }
    (queue.len(), probes)
}

/// Send each state to one of a few lists, then scan only that list.
fn search_bucketed(start: State, target: State) -> (usize, i64) {
    let mut seen: Vec<Vec<State>> = vec![Vec::new(); BUCKETS];
    let mut probes = 0i64;
    seen[(start.0 * 31 + start.1) % BUCKETS].push(start);
    let mut queue = vec![start];
    let mut head = 0;
    while head < queue.len() {
        let at = queue[head];
        head += 1;
        if at == target {
            return (queue.len(), probes);
        }
        for next in neighbours_of(at) {
            let key = (next.0 * 31 + next.1) % BUCKETS;
            let mut found = false;
            for &had in &seen[key] {
                probes += 1;
                if had == next {
                    found = true;
                    break;
                }
            }
            if !found {
                seen[key].push(next);
                queue.push(next);
            }
        }
    }
    (queue.len(), probes)
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

fn main() {
    let targets: Vec<State> = vec![(5, 5), (12, 12), (25, 25), (39, 39)];
    let mut agreed = 0;

    println!(
        "{}{}{}{}{}",
        pad_right("target", 12),
        pad_left("states queued", 15),
        pad_left("probes, flat", 14),
        pad_left("probes, scanned", 17),
        pad_left("probes, bucketed", 18)
    );
    for &target in &targets {
        let (queued_flat, probes_flat) = search_flat((0, 0), target);
        let (queued_scan, probes_scan) = search_scanned((0, 0), target);
        let (queued_buck, probes_buck) = search_bucketed((0, 0), target);
        if queued_flat == queued_scan && queued_flat == queued_buck {
            agreed += 1;
        }
        let label = format!("({}, {})", target.0, target.1);
        println!(
            "{}{}{}{}{}",
            pad_right(&label, 12),
            pad_left(&queued_flat.to_string(), 15),
            pad_left(&probes_flat.to_string(), 14),
            pad_left(&probes_scan.to_string(), 17),
            pad_left(&probes_buck.to_string(), 18)
        );
    }
    println!();

    println!(
        "the three containers queued the same states on {} of {} targets.",
        agreed,
        targets.len()
    );
    println!();
    println!("All three searches queue exactly the same states, because they are the");
    println!("same search -- only the membership test differs. The flat array pays one");
    println!("probe per edge and nothing else. The scanned list pays the length of the");
    println!("list every time, so its cost is quadratic in the number of states. The");
    println!("buckets pay the length of one bucket, which is the whole reason a hash");
    println!("set exists.");
    println!();
    println!("The flat array is the right answer whenever the state can be numbered");
    println!("and the numbering is not too sparse -- a pair on a 40 by 40 board is");
    println!("1,600 slots and trivially worth it. It stops being right when the state");
    println!("space is enormous and mostly unvisited: a chess position cannot be an");
    println!("array index, and there the bucketed set is the only one of the three");
    println!("that is both correct and affordable.");
}
`,
            },
            {
              lang: "go",
              code: `// The last question about the visited set is what to store it in, and it only
// looks trivial because textbook graphs have nodes numbered 0 to n-1.
//
// Real nodes are usually states: a board position, a (place, keys) pair, a
// string. There is no array to index, so membership has to be arranged, and
// the three obvious arrangements cost very different amounts.
//
//   a flat array   -- one slot per possible state. Instant, and only possible
//                     when the states can be numbered and there are not too many.
//   a scanned list -- keep what has been seen and look through it. No setup,
//                     and every test costs the length of the list.
//   buckets        -- send the state to one of k lists by a cheap function, and
//                     scan only that list.
//
// The search below is the same search three times over a state that is a pair,
// with every membership test counted.

package main

import "fmt"

const width = 40
const buckets = 97

type state struct{ a, b int }

// The moves. A state is a pair, and the graph is never built.
func neighboursOf(s state) []state {
	out := []state{}
	if s.a+1 < width {
		out = append(out, state{s.a + 1, s.b})
	}
	if s.b+1 < width {
		out = append(out, state{s.a, s.b + 1})
	}
	if s.a > 0 && s.b > 0 {
		out = append(out, state{s.a - 1, s.b - 1})
	}
	return out
}

// One slot per state. Numbering the state is the whole trick.
func searchFlat(start, target state) (int, int64) {
	seen := make([]bool, width*width)
	var probes int64
	queue := []state{start}
	seen[start.a*width+start.b] = true
	head := 0
	for head < len(queue) {
		at := queue[head]
		head++
		if at == target {
			return len(queue), probes
		}
		for _, next := range neighboursOf(at) {
			probes++
			if !seen[next.a*width+next.b] {
				seen[next.a*width+next.b] = true
				queue = append(queue, next)
			}
		}
	}
	return len(queue), probes
}

// Keep a list and look through it. Correct, and quadratic in the states.
func searchScanned(start, target state) (int, int64) {
	seen := []state{start}
	var probes int64
	queue := []state{start}
	head := 0
	for head < len(queue) {
		at := queue[head]
		head++
		if at == target {
			return len(queue), probes
		}
		for _, next := range neighboursOf(at) {
			found := false
			for _, had := range seen {
				probes++
				if had == next {
					found = true
					break
				}
			}
			if !found {
				seen = append(seen, next)
				queue = append(queue, next)
			}
		}
	}
	return len(queue), probes
}

// Send each state to one of a few lists, then scan only that list.
func searchBucketed(start, target state) (int, int64) {
	seen := make([][]state, buckets)
	for i := range seen {
		seen[i] = []state{}
	}
	var probes int64
	seen[(start.a*31+start.b)%buckets] = append(seen[(start.a*31+start.b)%buckets], start)
	queue := []state{start}
	head := 0
	for head < len(queue) {
		at := queue[head]
		head++
		if at == target {
			return len(queue), probes
		}
		for _, next := range neighboursOf(at) {
			key := (next.a*31 + next.b) % buckets
			found := false
			for _, had := range seen[key] {
				probes++
				if had == next {
					found = true
					break
				}
			}
			if !found {
				seen[key] = append(seen[key], next)
				queue = append(queue, next)
			}
		}
	}
	return len(queue), probes
}

func main() {
	targets := []state{{5, 5}, {12, 12}, {25, 25}, {39, 39}}
	agreed := 0

	fmt.Printf("%-12s%15s%14s%17s%18s\\n", "target", "states queued", "probes, flat",
		"probes, scanned", "probes, bucketed")
	for _, target := range targets {
		queuedFlat, probesFlat := searchFlat(state{0, 0}, target)
		queuedScan, probesScan := searchScanned(state{0, 0}, target)
		queuedBuck, probesBuck := searchBucketed(state{0, 0}, target)
		if queuedFlat == queuedScan && queuedFlat == queuedBuck {
			agreed++
		}
		fmt.Printf("%-12s%15d%14d%17d%18d\\n",
			fmt.Sprintf("(%d, %d)", target.a, target.b),
			queuedFlat, probesFlat, probesScan, probesBuck)
	}
	fmt.Println()

	fmt.Printf("the three containers queued the same states on %d of %d targets.\\n",
		agreed, len(targets))
	fmt.Println()
	fmt.Println("All three searches queue exactly the same states, because they are the")
	fmt.Println("same search -- only the membership test differs. The flat array pays one")
	fmt.Println("probe per edge and nothing else. The scanned list pays the length of the")
	fmt.Println("list every time, so its cost is quadratic in the number of states. The")
	fmt.Println("buckets pay the length of one bucket, which is the whole reason a hash")
	fmt.Println("set exists.")
	fmt.Println()
	fmt.Println("The flat array is the right answer whenever the state can be numbered")
	fmt.Println("and the numbering is not too sparse -- a pair on a 40 by 40 board is")
	fmt.Println("1,600 slots and trivially worth it. It stops being right when the state")
	fmt.Println("space is enormous and mostly unvisited: a chess position cannot be an")
	fmt.Println("array index, and there the bucketed set is the only one of the three")
	fmt.Println("that is both correct and affordable.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Scanning a list to test membership",
          body: "It is the first thing that works and it is quadratic in the number of states: 3,712,725 probes where a flat array did 4,640 on the same search. If the language has a hash set, use it; if the state can be numbered, an array beats both.",
        },
        {
          title: "Forgetting that a state can usually be numbered",
          body: "A pair of coordinates on a 40 by 40 board is a * 40 + b, which is 1,600 slots. Grids, small tuples and bitmask states almost always have a cheap integer key, and an indexed array is both faster and simpler than hashing. Reach for a hash set when the state space is genuinely too large to enumerate, not by default.",
        },
      ],
    },
    {
      id: "three-questions-every-search",
      heading: "Three questions, every time",
      body: [
        "Three questions, then, every time a search is written.",
        "**Where do I mark?** On enqueue. It costs nothing and it bounds the queue by nodes rather than edges \u2014 200 entries instead of 19,901 on a dense graph.",
        "**What does marked mean?** \"Dealt with\" for questions about nodes; \"on the current route\" for questions about routes. Getting it backwards is silent in one direction (150 undercounts in 3,000) and exponential in the other (262,141 entries against 49).",
        "**What is it stored in?** An array indexed by a computed key when the state can be numbered; a hash set when it cannot. Not a list you scan \u2014 that was 3.7 million probes where the array did 4,640.",
        "And underneath all three: the visited set is what makes the search finite. Remove it and the program does not return, on every graph that has an edge.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Should you mark a node visited when you push it or when you pop it?",
      answer:
        "When you push it. Both are correct -- I measured the distances on 3,000 random graphs and they agreed every time -- but marking on pop means a node is pushed once for every edge that reaches it, so the queue is bounded by the number of edges rather than the number of nodes. On a complete graph of 200 nodes that is 19,901 queue entries against 200, which is O(E) memory instead of O(V). There is no compensating advantage, so marking on enqueue is simply the default. The related point is that the visited set is what makes the search finite at all: with no marking my search terminated only on the graphs whose start node had no edges, because in an undirected graph one edge is already a cycle of length two.",
    },
    {
      question: "When is a global visited set the wrong thing?",
      answer:
        "When the question is about routes rather than nodes. A global set means \"dealt with, ever\", so it finds one route into each node and stops -- over 3,000 random directed graphs it undercounted the number of paths on 150 of them and never overcounted. To enumerate or count routes you need a path-local set that is unmarked on the way out of the recursion, so a node can appear on many different routes. The trade is real in the other direction too: using the path-local set for a question about nodes turns a linear walk into an exponential one. On a chain of 16 diamonds it entered nodes 262,141 times against 49 for the global set, and both gave the correct reachable set -- so only the running time tells you.",
    },
    {
      question: "Your nodes are game states, not integers. What do you use for the visited set?",
      answer:
        "First I would try to number the state. If it is a small tuple -- coordinates, a position plus a bitmask of collected keys, a few bounded counters -- there is usually a cheap integer key, and then a flat array is both the fastest option and the simplest. A pair on a 40 by 40 board is 1,600 slots. On my measurements the array cost one probe per edge, 4,640 on the largest search, against 39,096 for a bucketed hash and 3,712,725 for a linearly scanned list -- all three queueing exactly the same states. If the state space is genuinely too large to enumerate, a chess position for instance, then a hash set is the right answer and the key becomes the interesting design question. A scanned list is never the answer beyond a handful of states.",
    },
  ],
  takeaways: [
    "Mark on enqueue. The distances are the same either way; the queue is bounded by nodes rather than edges.",
    "On a complete graph of 200 that is 200 queue entries against 19,901.",
    "With no visited set the search terminates only when the start has no edges \u2014 931 of 3,000 graphs \u2014 because one undirected edge is already a cycle.",
    "\u201cVisited\u201d has two meanings: dealt with ever, and on the current route. They are not interchangeable.",
    "A global set undercounts routes: right on 2,850 of 3,000 graphs, low on 150, never high.",
    "A path-local set used for a question about nodes is exponential \u2014 262,141 entries against 49 on a chain of 16 diamonds.",
    "Both sets answer reachability correctly, so a reachability test cannot tell them apart.",
    "What the set is stored in is a real decision once nodes are states rather than indices.",
    "Flat array 4,640 probes, bucketed 39,096, scanned list 3,712,725 \u2014 same search, same states queued.",
    "If the state can be numbered cheaply, index an array; reach for a hash set only when it cannot.",
  ],
  status: "available",
};
