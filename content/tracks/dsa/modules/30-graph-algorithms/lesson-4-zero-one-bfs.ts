import type { Lesson } from "@/content/types";

export const zeroOneBfsLesson: Lesson = {
  id: "dsa-graph-algorithms-zero-one-bfs",
  slug: "zero-one-bfs",
  moduleSlug: "graph-algorithms",
  title: "0-1 BFS and the Deque",
  summary:
    "When every weight is 0 or 1 the priority queue has nothing left to decide, and a double-ended queue does its job for free. The invariant that makes it work, measured; the two different ways it breaks the moment a weight is 2; the bucket queue it generalises to; and the modelling move that turns problems with no visible weights into 0-1 graphs.",
  estimatedMinutes: 40,
  objectives: [
    "State the invariant that lets a deque replace the heap",
    "Say what the deque still guarantees, and what it stops guaranteeing",
    "Recognise the two different failures a weight of 2 causes",
    "Generalise the deque to a bucket queue for weights 0 to k",
    "Spot a 0-1 graph in a problem that does not mention weights",
  ],
  sections: [
    {
      id: "two-distances-is-all-there-is",
      heading: "Two distances is all there is",
      body: [
        "Dijkstra's heap is there to answer one question, over and over: of everything discovered so far, which is nearest? That is a real question when weights can be anything. When every weight is 0 or 1 it stops being one.",
        "Follow a 0 edge and the node you reach is *exactly* as far as the node you came from. Follow a 1 edge and it is one further. So the frontier only ever holds two distinct distances \u2014 `d` and `d + 1` \u2014 and a double-ended queue can keep them apart on its own. Push front for a 0 edge, push back for a 1 edge, pop from the front.",
        "That two-distances claim is the whole algorithm, so the example measures it rather than asserting it: over 3,000 random graphs, on every single pop, the largest number of distinct distances sitting in the deque was **2**. And the distances came out right \u2014 matching an exhaustive walk over every simple path, and matching Dijkstra, on all 3,000.",
        "Note what that buys. This is not BFS with weights bolted on; it still *settles*, exactly as Dijkstra does \u2014 the node at the front is declared final and never revisited. The deque earns that claim the same way the heap did, just for free.",
        "Free is measured too, and the answer is honest rather than flattering. On a plain chain the heap never holds more than one item, so it costs zero comparisons and the deque wins nothing. The saving shows up when the frontier is wide, which is exactly what the heap was there to order: on a 1,600-node grid, 3,200 deque operations against 15,587 heap comparisons.",
      ],
      examples: [
        {
          id: "the-deque-invariant",
          title: "The frontier, measured on every pop",
          lang: "python",
          code: `# 0-1 BFS: the graph where the priority queue is two buckets in a trench coat.
#
# Dijkstra's heap exists to answer one question: of everything discovered so
# far, which is nearest? When every edge weight is 0 or 1, that question has a
# much cheaper answer. A node reached by a 0 edge is exactly as far as the node
# it came from; a node reached by a 1 edge is one further. So the frontier only
# ever holds two distinct distances, d and d+1 -- and a double-ended queue can
# keep them apart by itself. Push front for 0, push back for 1.
#
# The claim that the deque holds at most two distinct distances is not folklore
# here. It is measured below, on every pop of every trial.
from collections import deque

INF = 10 ** 9


def zero_one_bfs(n, edges, start):
    """Dijkstra with the heap replaced by a deque. Push front for 0, back for 1.

    It settles, exactly as Dijkstra does: the node at the front of the deque is
    declared final and never revisited. That claim is the thing the deque has
    to earn, and it earns it only because the frontier holds two distances.
    """
    adj = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((v, w))
    best = [INF] * n
    best[start] = 0
    done = [False] * n
    dq = deque([start])
    ops = 1
    widest_frontier = 0
    while dq:
        at = dq.popleft()
        ops += 1
        if done[at]:
            continue
        done[at] = True
        # How many different distances are sitting in the deque right now?
        live = set(best[x] for x in dq)
        if len(live) > widest_frontier:
            widest_frontier = len(live)
        for nxt, w in adj[at]:
            if not done[nxt] and best[at] + w < best[nxt]:
                best[nxt] = best[at] + w
                ops += 1
                if w == 0:
                    dq.appendleft(nxt)
                else:
                    dq.append(nxt)
    return best, ops, widest_frontier


def dijkstra(n, edges, start):
    """The same answer with a binary heap, and the comparisons it costs."""
    adj = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((v, w))
    best = [INF] * n
    best[start] = 0
    done = [False] * n
    heap = [(0, start)]
    compares = 0

    def before(a, b):
        return a[0] < b[0] or (a[0] == b[0] and a[1] < b[1])

    def push(item):
        nonlocal compares
        heap.append(item)
        i = len(heap) - 1
        while i > 0:
            parent = (i - 1) // 2
            compares += 1
            if not before(heap[i], heap[parent]):
                break
            heap[i], heap[parent] = heap[parent], heap[i]
            i = parent

    def pop():
        nonlocal compares
        top = heap[0]
        last = heap.pop()
        if heap:
            heap[0] = last
            i = 0
            while True:
                small = i
                for c in (2 * i + 1, 2 * i + 2):
                    if c < len(heap):
                        compares += 1
                        if before(heap[c], heap[small]):
                            small = c
                if small == i:
                    break
                heap[i], heap[small] = heap[small], heap[i]
                i = small
        return top

    while heap:
        cost, at = pop()
        if done[at]:
            continue
        done[at] = True
        for nxt, w in adj[at]:
            if not done[nxt] and cost + w < best[nxt]:
                best[nxt] = cost + w
                push((cost + w, nxt))
    return best, compares


def by_walking(n, edges, start):
    """The cheapest simple path from start to everywhere. The definition."""
    adj = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((v, w))
    out = [INF] * n
    out[start] = 0
    seen = [False] * n

    def walk(at, cost):
        seen[at] = True
        for nxt, w in adj[at]:
            if not seen[nxt]:
                if cost + w < out[nxt]:
                    out[nxt] = cost + w
                walk(nxt, cost + w)
        seen[at] = False

    walk(start, 0)
    return out


def show(row):
    return "[" + ", ".join("-" if x >= INF else str(x) for x in row) + "]"


def label(edges):
    return "[" + ", ".join("%d-%d:%d" % e for e in edges) + "]"


CASES = [
    (4, [(0, 1, 1), (1, 2, 0), (2, 3, 1)]),
    (4, [(0, 1, 1), (0, 2, 0), (2, 1, 0), (1, 3, 1)]),
    (5, [(0, 1, 0), (1, 2, 0), (2, 3, 0), (3, 4, 0), (0, 4, 1)]),
]

print("%-42s %-16s %s" % ("edges", "0-1 BFS", "Dijkstra"))
for n, edges in CASES:
    a, _, _ = zero_one_bfs(n, edges, 0)
    b, _ = dijkstra(n, edges, 0)
    print("%-42s %-16s %s" % (label(edges), show(a), show(b)))

# The same linear congruential generator in every language, so the random
# graphs below are the same graphs whichever translation is run.
seed = 4242


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


trials = 3000
agree_truth = agree_dijkstra = 0
widest_seen = 0
for _ in range(trials):
    n = 2 + rand(5)
    edges = []
    for u in range(n):
        for v in range(n):
            if u != v and rand(3) == 0:
                edges.append((u, v, rand(2)))
    truth = by_walking(n, edges, 0)
    got, _, widest = zero_one_bfs(n, edges, 0)
    ref, _ = dijkstra(n, edges, 0)
    agree_truth += got == truth
    agree_dijkstra += got == ref
    if widest > widest_seen:
        widest_seen = widest

print()
print("over %d random graphs with every weight 0 or 1:" % trials)
print("  0-1 BFS matched every simple path      %6d" % agree_truth)
print("  0-1 BFS matched Dijkstra               %6d" % agree_dijkstra)
print("  most distinct distances ever in the")
print("    deque at once, over every pop        %6d" % widest_seen)

print()
print("and what the two frontiers cost on bigger graphs:")
print("%-7s %-11s %14s %14s" % ("nodes", "shape", "deque ops", "heap compares"))
for side in (20, 30, 40):
    n = side * side
    chain = [(v, v + 1, v % 2) for v in range(n - 1)]
    ladder = [(v, v + 1, 1) for v in range(n - 1)]
    ladder += [(v, v + 2, 0) for v in range(n - 2)]
    grid = []
    for r in range(side):
        for c in range(side):
            here = r * side + c
            if c + 1 < side:
                grid.append((here, here + 1, 1))
            if r + 1 < side:
                grid.append((here, here + side, 0))
    for name, edges in (("chain", chain), ("ladder", ladder), ("grid", grid)):
        _, ops, _ = zero_one_bfs(n, edges, 0)
        _, compares = dijkstra(n, edges, 0)
        print("%-7d %-11s %14d %14d" % (n, name, ops, compares))

print()
print("The deque never held more than %d distinct distances, which is the whole" % widest_seen)
print("argument: pop from the front and you are popping a nearest node, exactly")
print("the guarantee the heap was there to provide. A 0 edge reaches a node at")
print("the same distance, so it belongs at the front, ahead of everything one")
print("step further out. A 1 edge belongs at the back.")
print()
print("The cost table says where that is worth anything. On a chain the heap")
print("never holds more than one item, so it costs nothing and the deque wins")
print("nothing -- an honest tie. The saving appears when the frontier is wide,")
print("and it is the frontier the heap was ordering. Every deque operation is")
print("O(1) whatever the width.")
`,
          output: `edges                                      0-1 BFS          Dijkstra
[0-1:1, 1-2:0, 2-3:1]                      [0, 1, 1, 2]     [0, 1, 1, 2]
[0-1:1, 0-2:0, 2-1:0, 1-3:1]               [0, 0, 0, 1]     [0, 0, 0, 1]
[0-1:0, 1-2:0, 2-3:0, 3-4:0, 0-4:1]        [0, 0, 0, 0, 0]  [0, 0, 0, 0, 0]

over 3000 random graphs with every weight 0 or 1:
  0-1 BFS matched every simple path        3000
  0-1 BFS matched Dijkstra                 3000
  most distinct distances ever in the
    deque at once, over every pop             2

and what the two frontiers cost on bigger graphs:
nodes   shape            deque ops  heap compares
400     chain                  800              0
400     ladder                 800           5435
400     grid                   800           3067
900     chain                 1800              0
900     ladder                1800          14790
900     grid                  1800           7908
1600    chain                 3200              0
1600    ladder                3200          29655
1600    grid                  3200          15587

The deque never held more than 2 distinct distances, which is the whole
argument: pop from the front and you are popping a nearest node, exactly
the guarantee the heap was there to provide. A 0 edge reaches a node at
the same distance, so it belongs at the front, ahead of everything one
step further out. A 1 edge belongs at the back.

The cost table says where that is worth anything. On a chain the heap
never holds more than one item, so it costs nothing and the deque wins
nothing -- an honest tie. The saving appears when the frontier is wide,
and it is the frontier the heap was ordering. Every deque operation is
O(1) whatever the width.`,
          explanation:
            "0-1 BFS scored against an exhaustive walk and against Dijkstra, with the two-distances invariant counted rather than asserted, and the frontier width that decides whether dropping the heap saves anything.",
          alternates: [
            {
              lang: "javascript",
              code: `// 0-1 BFS: the graph where the priority queue is two buckets in a trench coat.
//
// Dijkstra's heap exists to answer one question: of everything discovered so
// far, which is nearest? When every edge weight is 0 or 1, that question has a
// much cheaper answer. A node reached by a 0 edge is exactly as far as the node
// it came from; a node reached by a 1 edge is one further. So the frontier only
// ever holds two distinct distances, d and d+1 -- and a double-ended queue can
// keep them apart by itself. Push front for 0, push back for 1.
//
// The claim that the deque holds at most two distinct distances is not folklore
// here. It is measured below, on every pop of every trial.
const INF = 10 ** 9;

// A deque over one array with a head and a tail index, so pushing at either
// end is O(1). Room is reserved for every push the search can make.
class Deque {
  constructor(room) {
    this.buf = new Array(2 * room + 2).fill(0);
    this.head = room + 1;
    this.tail = room + 1;
  }

  pushFront(x) {
    this.head -= 1;
    this.buf[this.head] = x;
  }

  pushBack(x) {
    this.buf[this.tail] = x;
    this.tail += 1;
  }

  popFront() {
    const x = this.buf[this.head];
    this.head += 1;
    return x;
  }

  get size() {
    return this.tail - this.head;
  }

  values() {
    return this.buf.slice(this.head, this.tail);
  }
}

// Dijkstra with the heap replaced by a deque. Push front for 0, back for 1.
//
// It settles, exactly as Dijkstra does: the node at the front of the deque is
// declared final and never revisited. That claim is the thing the deque has to
// earn, and it earns it only because the frontier holds two distances.
function zeroOneBfs(n, edges, start) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  const best = new Array(n).fill(INF);
  best[start] = 0;
  const done = new Array(n).fill(false);
  const dq = new Deque(edges.length + 1);
  dq.pushBack(start);
  let ops = 1;
  let widestFrontier = 0;
  while (dq.size > 0) {
    const at = dq.popFront();
    ops += 1;
    if (done[at]) continue;
    done[at] = true;
    // How many different distances are sitting in the deque right now?
    const live = new Set(dq.values().map((x) => best[x]));
    if (live.size > widestFrontier) widestFrontier = live.size;
    for (const [nxt, w] of adj[at]) {
      if (!done[nxt] && best[at] + w < best[nxt]) {
        best[nxt] = best[at] + w;
        ops += 1;
        if (w === 0) dq.pushFront(nxt);
        else dq.pushBack(nxt);
      }
    }
  }
  return [best, ops, widestFrontier];
}

// The same answer with a binary heap, and the comparisons it costs.
function dijkstra(n, edges, start) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  const best = new Array(n).fill(INF);
  best[start] = 0;
  const done = new Array(n).fill(false);
  const heap = [[0, start]];
  let compares = 0;

  const before = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);

  const push = (item) => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      compares += 1;
      if (!before(heap[i], heap[parent])) break;
      [heap[i], heap[parent]] = [heap[parent], heap[i]];
      i = parent;
    }
  };

  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        let small = i;
        for (const c of [2 * i + 1, 2 * i + 2]) {
          if (c < heap.length) {
            compares += 1;
            if (before(heap[c], heap[small])) small = c;
          }
        }
        if (small === i) break;
        [heap[i], heap[small]] = [heap[small], heap[i]];
        i = small;
      }
    }
    return top;
  };

  while (heap.length > 0) {
    const [cost, at] = pop();
    if (done[at]) continue;
    done[at] = true;
    for (const [nxt, w] of adj[at]) {
      if (!done[nxt] && cost + w < best[nxt]) {
        best[nxt] = cost + w;
        push([cost + w, nxt]);
      }
    }
  }
  return [best, compares];
}

// The cheapest simple path from start to everywhere. The definition.
function byWalking(n, edges, start) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  const out = new Array(n).fill(INF);
  out[start] = 0;
  const seen = new Array(n).fill(false);
  const walk = (at, cost) => {
    seen[at] = true;
    for (const [nxt, w] of adj[at]) {
      if (!seen[nxt]) {
        if (cost + w < out[nxt]) out[nxt] = cost + w;
        walk(nxt, cost + w);
      }
    }
    seen[at] = false;
  };
  walk(start, 0);
  return out;
}

function show(row) {
  return "[" + row.map((x) => (x >= INF ? "-" : String(x))).join(", ") + "]";
}

function label(edges) {
  return "[" + edges.map(([u, v, w]) => \`\${u}-\${v}:\${w}\`).join(", ") + "]";
}

const CASES = [
  [4, [[0, 1, 1], [1, 2, 0], [2, 3, 1]]],
  [4, [[0, 1, 1], [0, 2, 0], [2, 1, 0], [1, 3, 1]]],
  [5, [[0, 1, 0], [1, 2, 0], [2, 3, 0], [3, 4, 0], [0, 4, 1]]],
];

console.log("edges".padEnd(42) + " " + "0-1 BFS".padEnd(16) + " " + "Dijkstra");
for (const [n, edges] of CASES) {
  const [a] = zeroOneBfs(n, edges, 0);
  const [b] = dijkstra(n, edges, 0);
  console.log(label(edges).padEnd(42) + " " + show(a).padEnd(16) + " " + show(b));
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 4242n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let agreeTruth = 0;
let agreeDijkstra = 0;
let widestSeen = 0;
const same = (a, b) => a.every((x, i) => x === b[i]);
for (let t = 0; t < trials; t += 1) {
  const n = 2 + rand(5);
  const edges = [];
  for (let u = 0; u < n; u += 1)
    for (let v = 0; v < n; v += 1)
      if (u !== v && rand(3) === 0) edges.push([u, v, rand(2)]);
  const truth = byWalking(n, edges, 0);
  const [got, , widest] = zeroOneBfs(n, edges, 0);
  const [ref] = dijkstra(n, edges, 0);
  if (same(got, truth)) agreeTruth += 1;
  if (same(got, ref)) agreeDijkstra += 1;
  if (widest > widestSeen) widestSeen = widest;
}

console.log();
console.log(\`over \${trials} random graphs with every weight 0 or 1:\`);
console.log("  0-1 BFS matched every simple path      " + String(agreeTruth).padStart(6));
console.log("  0-1 BFS matched Dijkstra               " + String(agreeDijkstra).padStart(6));
console.log("  most distinct distances ever in the");
console.log("    deque at once, over every pop        " + String(widestSeen).padStart(6));

console.log();
console.log("and what the two frontiers cost on bigger graphs:");
console.log("nodes".padEnd(7) + " " + "shape".padEnd(11) + " " + "deque ops".padStart(14) + " " + "heap compares".padStart(14));
for (const side of [20, 30, 40]) {
  const n = side * side;
  const chain = [];
  for (let v = 0; v < n - 1; v += 1) chain.push([v, v + 1, v % 2]);
  const ladder = [];
  for (let v = 0; v < n - 1; v += 1) ladder.push([v, v + 1, 1]);
  for (let v = 0; v < n - 2; v += 1) ladder.push([v, v + 2, 0]);
  const grid = [];
  for (let r = 0; r < side; r += 1)
    for (let c = 0; c < side; c += 1) {
      const here = r * side + c;
      if (c + 1 < side) grid.push([here, here + 1, 1]);
      if (r + 1 < side) grid.push([here, here + side, 0]);
    }
  for (const [name, edges] of [["chain", chain], ["ladder", ladder], ["grid", grid]]) {
    const [, ops] = zeroOneBfs(n, edges, 0);
    const [, compares] = dijkstra(n, edges, 0);
    console.log(
      String(n).padEnd(7) + " " + name.padEnd(11) + " " +
      String(ops).padStart(14) + " " + String(compares).padStart(14),
    );
  }
}

console.log();
console.log(\`The deque never held more than \${widestSeen} distinct distances, which is the whole\`);
console.log("argument: pop from the front and you are popping a nearest node, exactly");
console.log("the guarantee the heap was there to provide. A 0 edge reaches a node at");
console.log("the same distance, so it belongs at the front, ahead of everything one");
console.log("step further out. A 1 edge belongs at the back.");
console.log();
console.log("The cost table says where that is worth anything. On a chain the heap");
console.log("never holds more than one item, so it costs nothing and the deque wins");
console.log("nothing -- an honest tie. The saving appears when the frontier is wide,");
console.log("and it is the frontier the heap was ordering. Every deque operation is");
console.log("O(1) whatever the width.");
`,
            },
            {
              lang: "typescript",
              code: `// 0-1 BFS: the graph where the priority queue is two buckets in a trench coat.
//
// Dijkstra's heap exists to answer one question: of everything discovered so
// far, which is nearest? When every edge weight is 0 or 1, that question has a
// much cheaper answer. A node reached by a 0 edge is exactly as far as the node
// it came from; a node reached by a 1 edge is one further. So the frontier only
// ever holds two distinct distances, d and d+1 -- and a double-ended queue can
// keep them apart by itself. Push front for 0, push back for 1.
//
// The claim that the deque holds at most two distinct distances is not folklore
// here. It is measured below, on every pop of every trial.
const INF = 10 ** 9;

// A deque over one array with a head and a tail index, so pushing at either
// end is O(1). Room is reserved for every push the search can make.
class Deque {
  buf: number[];
  head: number;
  tail: number;

  constructor(room: number) {
    this.buf = new Array(2 * room + 2).fill(0);
    this.head = room + 1;
    this.tail = room + 1;
  }

  pushFront(x: number): void {
    this.head -= 1;
    this.buf[this.head] = x;
  }

  pushBack(x: number): void {
    this.buf[this.tail] = x;
    this.tail += 1;
  }

  popFront(): number {
    const x = this.buf[this.head];
    this.head += 1;
    return x;
  }

  get size(): number {
    return this.tail - this.head;
  }

  values(): number[] {
    return this.buf.slice(this.head, this.tail);
  }
}

// Dijkstra with the heap replaced by a deque. Push front for 0, back for 1.
//
// It settles, exactly as Dijkstra does: the node at the front of the deque is
// declared final and never revisited. That claim is the thing the deque has to
// earn, and it earns it only because the frontier holds two distances.
function zeroOneBfs(n: number, edges: number[][], start: number): [number[], number, number] {
  const adj: number[][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  const best = new Array(n).fill(INF);
  best[start] = 0;
  const done = new Array(n).fill(false);
  const dq = new Deque(edges.length + 1);
  dq.pushBack(start);
  let ops = 1;
  let widestFrontier = 0;
  while (dq.size > 0) {
    const at = dq.popFront();
    ops += 1;
    if (done[at]) continue;
    done[at] = true;
    // How many different distances are sitting in the deque right now?
    const live = new Set(dq.values().map((x) => best[x]));
    if (live.size > widestFrontier) widestFrontier = live.size;
    for (const [nxt, w] of adj[at]) {
      if (!done[nxt] && best[at] + w < best[nxt]) {
        best[nxt] = best[at] + w;
        ops += 1;
        if (w === 0) dq.pushFront(nxt);
        else dq.pushBack(nxt);
      }
    }
  }
  return [best, ops, widestFrontier];
}

// The same answer with a binary heap, and the comparisons it costs.
function dijkstra(n: number, edges: number[][], start: number): [number[], number] {
  const adj: number[][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  const best = new Array(n).fill(INF);
  best[start] = 0;
  const done = new Array(n).fill(false);
  const heap: [number, number][] = [[0, start]];
  let compares = 0;

  const before = (a: [number, number], b: [number, number]): boolean => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);

  const push = (item: [number, number]): void => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      compares += 1;
      if (!before(heap[i], heap[parent])) break;
      [heap[i], heap[parent]] = [heap[parent], heap[i]];
      i = parent;
    }
  };

  const pop = (): [number, number] => {
    const top = heap[0];
    const last = heap.pop() as [number, number];
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        let small = i;
        for (const c of [2 * i + 1, 2 * i + 2]) {
          if (c < heap.length) {
            compares += 1;
            if (before(heap[c], heap[small])) small = c;
          }
        }
        if (small === i) break;
        [heap[i], heap[small]] = [heap[small], heap[i]];
        i = small;
      }
    }
    return top;
  };

  while (heap.length > 0) {
    const [cost, at] = pop();
    if (done[at]) continue;
    done[at] = true;
    for (const [nxt, w] of adj[at]) {
      if (!done[nxt] && cost + w < best[nxt]) {
        best[nxt] = cost + w;
        push([cost + w, nxt]);
      }
    }
  }
  return [best, compares];
}

// The cheapest simple path from start to everywhere. The definition.
function byWalking(n: number, edges: number[][], start: number): number[] {
  const adj: number[][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  const out = new Array(n).fill(INF);
  out[start] = 0;
  const seen = new Array(n).fill(false);
  const walk = (at: number, cost: number): void => {
    seen[at] = true;
    for (const [nxt, w] of adj[at]) {
      if (!seen[nxt]) {
        if (cost + w < out[nxt]) out[nxt] = cost + w;
        walk(nxt, cost + w);
      }
    }
    seen[at] = false;
  };
  walk(start, 0);
  return out;
}

function show(row: number[]): string {
  return "[" + row.map((x) => (x >= INF ? "-" : String(x))).join(", ") + "]";
}

function label(edges: number[][]): string {
  return "[" + edges.map(([u, v, w]) => \`\${u}-\${v}:\${w}\`).join(", ") + "]";
}

const CASES: [number, number[][]][] = [
  [4, [[0, 1, 1], [1, 2, 0], [2, 3, 1]]],
  [4, [[0, 1, 1], [0, 2, 0], [2, 1, 0], [1, 3, 1]]],
  [5, [[0, 1, 0], [1, 2, 0], [2, 3, 0], [3, 4, 0], [0, 4, 1]]],
];

console.log("edges".padEnd(42) + " " + "0-1 BFS".padEnd(16) + " " + "Dijkstra");
for (const [n, edges] of CASES) {
  const [a] = zeroOneBfs(n, edges, 0);
  const [b] = dijkstra(n, edges, 0);
  console.log(label(edges).padEnd(42) + " " + show(a).padEnd(16) + " " + show(b));
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 4242n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let agreeTruth = 0;
let agreeDijkstra = 0;
let widestSeen = 0;
const same = (a: number[], b: number[]): boolean => a.every((x, i) => x === b[i]);
for (let t = 0; t < trials; t += 1) {
  const n = 2 + rand(5);
  const edges: number[][] = [];
  for (let u = 0; u < n; u += 1)
    for (let v = 0; v < n; v += 1)
      if (u !== v && rand(3) === 0) edges.push([u, v, rand(2)]);
  const truth = byWalking(n, edges, 0);
  const [got, , widest] = zeroOneBfs(n, edges, 0);
  const [ref] = dijkstra(n, edges, 0);
  if (same(got, truth)) agreeTruth += 1;
  if (same(got, ref)) agreeDijkstra += 1;
  if (widest > widestSeen) widestSeen = widest;
}

console.log();
console.log(\`over \${trials} random graphs with every weight 0 or 1:\`);
console.log("  0-1 BFS matched every simple path      " + String(agreeTruth).padStart(6));
console.log("  0-1 BFS matched Dijkstra               " + String(agreeDijkstra).padStart(6));
console.log("  most distinct distances ever in the");
console.log("    deque at once, over every pop        " + String(widestSeen).padStart(6));

console.log();
console.log("and what the two frontiers cost on bigger graphs:");
console.log("nodes".padEnd(7) + " " + "shape".padEnd(11) + " " + "deque ops".padStart(14) + " " + "heap compares".padStart(14));
for (const side of [20, 30, 40]) {
  const n = side * side;
  const chain: number[][] = [];
  for (let v = 0; v < n - 1; v += 1) chain.push([v, v + 1, v % 2]);
  const ladder: number[][] = [];
  for (let v = 0; v < n - 1; v += 1) ladder.push([v, v + 1, 1]);
  for (let v = 0; v < n - 2; v += 1) ladder.push([v, v + 2, 0]);
  const grid: number[][] = [];
  for (let r = 0; r < side; r += 1)
    for (let c = 0; c < side; c += 1) {
      const here = r * side + c;
      if (c + 1 < side) grid.push([here, here + 1, 1]);
      if (r + 1 < side) grid.push([here, here + side, 0]);
    }
  for (const [name, edges] of [["chain", chain], ["ladder", ladder], ["grid", grid]] as [string, number[][]][]) {
    const [, ops] = zeroOneBfs(n, edges, 0);
    const [, compares] = dijkstra(n, edges, 0);
    console.log(
      String(n).padEnd(7) + " " + name.padEnd(11) + " " +
      String(ops).padStart(14) + " " + String(compares).padStart(14),
    );
  }
}

console.log();
console.log(\`The deque never held more than \${widestSeen} distinct distances, which is the whole\`);
console.log("argument: pop from the front and you are popping a nearest node, exactly");
console.log("the guarantee the heap was there to provide. A 0 edge reaches a node at");
console.log("the same distance, so it belongs at the front, ahead of everything one");
console.log("step further out. A 1 edge belongs at the back.");
console.log();
console.log("The cost table says where that is worth anything. On a chain the heap");
console.log("never holds more than one item, so it costs nothing and the deque wins");
console.log("nothing -- an honest tie. The saving appears when the frontier is wide,");
console.log("and it is the frontier the heap was ordering. Every deque operation is");
console.log("O(1) whatever the width.");
`,
            },
            {
              lang: "java",
              code: `// 0-1 BFS: the graph where the priority queue is two buckets in a trench coat.
//
// Dijkstra's heap exists to answer one question: of everything discovered so
// far, which is nearest? When every edge weight is 0 or 1, that question has a
// much cheaper answer. A node reached by a 0 edge is exactly as far as the node
// it came from; a node reached by a 1 edge is one further. So the frontier only
// ever holds two distinct distances, d and d+1 -- and a double-ended queue can
// keep them apart by itself. Push front for 0, push back for 1.
//
// The claim that the deque holds at most two distinct distances is not folklore
// here. It is measured below, on every pop of every trial.
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
import java.util.HashSet;
import java.util.List;
import java.util.PriorityQueue;
import java.util.Set;

public class Main {
    static final int INF = 1000000000;

    static List<int[]>[] adjacency(int n, int[][] edges) {
        @SuppressWarnings("unchecked")
        List<int[]>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : edges) adj[e[0]].add(new int[] {e[1], e[2]});
        return adj;
    }

    /**
     * Dijkstra with the heap replaced by a deque. Push front for 0, back for 1.
     *
     * <p>It settles, exactly as Dijkstra does: the node at the front of the deque is
     * declared final and never revisited. That claim is the thing the deque has to
     * earn, and it earns it only because the frontier holds two distances.
     *
     * <p>Returns the distances; the operation count and the widest frontier seen
     * are written into {@code stats}.
     */
    static int[] zeroOneBfs(int n, int[][] edges, int start, int[] stats) {
        List<int[]>[] adj = adjacency(n, edges);
        int[] best = new int[n];
        Arrays.fill(best, INF);
        best[start] = 0;
        boolean[] done = new boolean[n];
        Deque<Integer> dq = new ArrayDeque<>();
        dq.addLast(start);
        int ops = 1;
        int widestFrontier = 0;
        while (!dq.isEmpty()) {
            int at = dq.pollFirst();
            ops++;
            if (done[at]) continue;
            done[at] = true;
            // How many different distances are sitting in the deque right now?
            Set<Integer> live = new HashSet<>();
            for (int x : dq) live.add(best[x]);
            if (live.size() > widestFrontier) widestFrontier = live.size();
            for (int[] step : adj[at]) {
                if (!done[step[0]] && best[at] + step[1] < best[step[0]]) {
                    best[step[0]] = best[at] + step[1];
                    ops++;
                    if (step[1] == 0) dq.addFirst(step[0]);
                    else dq.addLast(step[0]);
                }
            }
        }
        stats[0] = ops;
        stats[1] = widestFrontier;
        return best;
    }

    /** The same answer with a binary heap, and the comparisons it costs. */
    static int[] dijkstra(int n, int[][] edges, int start, int[] stats) {
        List<int[]>[] adj = adjacency(n, edges);
        int[] best = new int[n];
        Arrays.fill(best, INF);
        best[start] = 0;
        boolean[] done = new boolean[n];
        int[] compares = new int[1];
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> {
            compares[0]++;
            if (a[0] != b[0]) return Integer.compare(a[0], b[0]);
            return Integer.compare(a[1], b[1]);
        });
        heap.add(new int[] {0, start});
        while (!heap.isEmpty()) {
            int[] top = heap.poll();
            int cost = top[0], at = top[1];
            if (done[at]) continue;
            done[at] = true;
            for (int[] step : adj[at]) {
                if (!done[step[0]] && cost + step[1] < best[step[0]]) {
                    best[step[0]] = cost + step[1];
                    heap.add(new int[] {cost + step[1], step[0]});
                }
            }
        }
        stats[0] = compares[0];
        return best;
    }

    static void walk(List<int[]>[] adj, boolean[] seen, int[] out, int at, int cost) {
        seen[at] = true;
        for (int[] step : adj[at]) {
            if (!seen[step[0]]) {
                if (cost + step[1] < out[step[0]]) out[step[0]] = cost + step[1];
                walk(adj, seen, out, step[0], cost + step[1]);
            }
        }
        seen[at] = false;
    }

    /** The cheapest simple path from start to everywhere. The definition. */
    static int[] byWalking(int n, int[][] edges, int start) {
        int[] out = new int[n];
        Arrays.fill(out, INF);
        out[start] = 0;
        walk(adjacency(n, edges), new boolean[n], out, start, 0);
        return out;
    }

    static String show(int[] row) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < row.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(row[i] >= INF ? "-" : String.valueOf(row[i]));
        }
        return sb.append("]").toString();
    }

    static String label(int[][] edges) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < edges.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(edges[i][0]).append("-").append(edges[i][1]).append(":").append(edges[i][2]);
        }
        return sb.append("]").toString();
    }

    // The same linear congruential generator in every language, so the random
    // graphs below are the same graphs whichever translation is run.
    static long seed = 4242L;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    public static void main(String[] args) {
        int[] caseN = {4, 4, 5};
        int[][][] caseEdges = {
            {{0, 1, 1}, {1, 2, 0}, {2, 3, 1}},
            {{0, 1, 1}, {0, 2, 0}, {2, 1, 0}, {1, 3, 1}},
            {{0, 1, 0}, {1, 2, 0}, {2, 3, 0}, {3, 4, 0}, {0, 4, 1}},
        };

        System.out.printf("%-42s %-16s %s%n", "edges", "0-1 BFS", "Dijkstra");
        for (int c = 0; c < caseN.length; c++) {
            int[] a = zeroOneBfs(caseN[c], caseEdges[c], 0, new int[2]);
            int[] b = dijkstra(caseN[c], caseEdges[c], 0, new int[1]);
            System.out.printf("%-42s %-16s %s%n", label(caseEdges[c]), show(a), show(b));
        }

        int trials = 3000;
        int agreeTruth = 0, agreeDijkstra = 0, widestSeen = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(5);
            List<int[]> built = new ArrayList<>();
            for (int u = 0; u < n; u++)
                for (int v = 0; v < n; v++)
                    if (u != v && rand(3) == 0) built.add(new int[] {u, v, rand(2)});
            int[][] edges = built.toArray(new int[0][]);
            int[] truth = byWalking(n, edges, 0);
            int[] stats = new int[2];
            int[] got = zeroOneBfs(n, edges, 0, stats);
            int[] ref = dijkstra(n, edges, 0, new int[1]);
            if (Arrays.equals(got, truth)) agreeTruth++;
            if (Arrays.equals(got, ref)) agreeDijkstra++;
            if (stats[1] > widestSeen) widestSeen = stats[1];
        }

        System.out.println();
        System.out.println("over " + trials + " random graphs with every weight 0 or 1:");
        System.out.printf("  0-1 BFS matched every simple path      %6d%n", agreeTruth);
        System.out.printf("  0-1 BFS matched Dijkstra               %6d%n", agreeDijkstra);
        System.out.println("  most distinct distances ever in the");
        System.out.printf("    deque at once, over every pop        %6d%n", widestSeen);

        System.out.println();
        System.out.println("and what the two frontiers cost on bigger graphs:");
        System.out.printf("%-7s %-11s %14s %14s%n", "nodes", "shape", "deque ops", "heap compares");
        for (int side : new int[] {20, 30, 40}) {
            int n = side * side;
            List<int[]> chain = new ArrayList<>();
            for (int v = 0; v < n - 1; v++) chain.add(new int[] {v, v + 1, v % 2});
            List<int[]> ladder = new ArrayList<>();
            for (int v = 0; v < n - 1; v++) ladder.add(new int[] {v, v + 1, 1});
            for (int v = 0; v < n - 2; v++) ladder.add(new int[] {v, v + 2, 0});
            List<int[]> grid = new ArrayList<>();
            for (int r = 0; r < side; r++)
                for (int c = 0; c < side; c++) {
                    int here = r * side + c;
                    if (c + 1 < side) grid.add(new int[] {here, here + 1, 1});
                    if (r + 1 < side) grid.add(new int[] {here, here + side, 0});
                }
            String[] names = {"chain", "ladder", "grid"};
            List<List<int[]>> shapes = List.of(chain, ladder, grid);
            for (int s = 0; s < 3; s++) {
                int[][] edges = shapes.get(s).toArray(new int[0][]);
                int[] stats = new int[2];
                zeroOneBfs(n, edges, 0, stats);
                int[] heapStats = new int[1];
                dijkstra(n, edges, 0, heapStats);
                System.out.printf("%-7d %-11s %14d %14d%n", n, names[s], stats[0], heapStats[0]);
            }
        }

        System.out.println();
        System.out.println("The deque never held more than " + widestSeen
            + " distinct distances, which is the whole");
        System.out.println("argument: pop from the front and you are popping a nearest node, exactly");
        System.out.println("the guarantee the heap was there to provide. A 0 edge reaches a node at");
        System.out.println("the same distance, so it belongs at the front, ahead of everything one");
        System.out.println("step further out. A 1 edge belongs at the back.");
        System.out.println();
        System.out.println("The cost table says where that is worth anything. On a chain the heap");
        System.out.println("never holds more than one item, so it costs nothing and the deque wins");
        System.out.println("nothing -- an honest tie. The saving appears when the frontier is wide,");
        System.out.println("and it is the frontier the heap was ordering. Every deque operation is");
        System.out.println("O(1) whatever the width.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// 0-1 BFS: the graph where the priority queue is two buckets in a trench coat.
//
// Dijkstra's heap exists to answer one question: of everything discovered so
// far, which is nearest? When every edge weight is 0 or 1, that question has a
// much cheaper answer. A node reached by a 0 edge is exactly as far as the node
// it came from; a node reached by a 1 edge is one further. So the frontier only
// ever holds two distinct distances, d and d+1 -- and a double-ended queue can
// keep them apart by itself. Push front for 0, push back for 1.
//
// The claim that the deque holds at most two distinct distances is not folklore
// here. It is measured below, on every pop of every trial.
#include <array>
#include <deque>
#include <iomanip>
#include <iostream>
#include <set>
#include <string>
#include <utility>
#include <vector>

const int INF = 1000000000;

using Edge = std::array<int, 3>;
using Adj = std::vector<std::vector<std::pair<int, int>>>;

Adj adjacency(int n, const std::vector<Edge>& edges) {
    Adj adj(n);
    for (const Edge& e : edges) adj[e[0]].push_back({e[1], e[2]});
    return adj;
}

// Dijkstra with the heap replaced by a deque. Push front for 0, back for 1.
//
// It settles, exactly as Dijkstra does: the node at the front of the deque is
// declared final and never revisited. That claim is the thing the deque has to
// earn, and it earns it only because the frontier holds two distances.
std::vector<int> zero_one_bfs(int n, const std::vector<Edge>& edges, int start,
                              long long& ops, int& widest_frontier) {
    Adj adj = adjacency(n, edges);
    std::vector<int> best(n, INF);
    best[start] = 0;
    std::vector<bool> done(n, false);
    std::deque<int> dq = {start};
    ops = 1;
    widest_frontier = 0;
    while (!dq.empty()) {
        int at = dq.front();
        dq.pop_front();
        ops++;
        if (done[at]) continue;
        done[at] = true;
        // How many different distances are sitting in the deque right now?
        std::set<int> live;
        for (int x : dq) live.insert(best[x]);
        if (static_cast<int>(live.size()) > widest_frontier)
            widest_frontier = static_cast<int>(live.size());
        for (const auto& step : adj[at]) {
            if (!done[step.first] && best[at] + step.second < best[step.first]) {
                best[step.first] = best[at] + step.second;
                ops++;
                if (step.second == 0) dq.push_front(step.first);
                else dq.push_back(step.first);
            }
        }
    }
    return best;
}

// The same answer with a binary heap, and the comparisons it costs.
std::vector<int> dijkstra(int n, const std::vector<Edge>& edges, int start,
                          long long& compares) {
    Adj adj = adjacency(n, edges);
    std::vector<int> best(n, INF);
    best[start] = 0;
    std::vector<bool> done(n, false);
    std::vector<std::pair<int, int>> heap = {{0, start}};
    compares = 0;

    auto before = [](const std::pair<int, int>& a, const std::pair<int, int>& b) {
        return a.first < b.first || (a.first == b.first && a.second < b.second);
    };

    auto push = [&](std::pair<int, int> item) {
        heap.push_back(item);
        size_t i = heap.size() - 1;
        while (i > 0) {
            size_t parent = (i - 1) / 2;
            compares++;
            if (!before(heap[i], heap[parent])) break;
            std::swap(heap[i], heap[parent]);
            i = parent;
        }
    };

    auto pop = [&]() {
        std::pair<int, int> top = heap[0];
        std::pair<int, int> last = heap.back();
        heap.pop_back();
        if (!heap.empty()) {
            heap[0] = last;
            size_t i = 0;
            for (;;) {
                size_t small = i;
                for (size_t c : {2 * i + 1, 2 * i + 2}) {
                    if (c < heap.size()) {
                        compares++;
                        if (before(heap[c], heap[small])) small = c;
                    }
                }
                if (small == i) break;
                std::swap(heap[i], heap[small]);
                i = small;
            }
        }
        return top;
    };

    while (!heap.empty()) {
        std::pair<int, int> top = pop();
        int cost = top.first, at = top.second;
        if (done[at]) continue;
        done[at] = true;
        for (const auto& step : adj[at]) {
            if (!done[step.first] && cost + step.second < best[step.first]) {
                best[step.first] = cost + step.second;
                push({cost + step.second, step.first});
            }
        }
    }
    return best;
}

void walk(const Adj& adj, std::vector<bool>& seen, std::vector<int>& out, int at, int cost) {
    seen[at] = true;
    for (const auto& step : adj[at]) {
        if (!seen[step.first]) {
            if (cost + step.second < out[step.first]) out[step.first] = cost + step.second;
            walk(adj, seen, out, step.first, cost + step.second);
        }
    }
    seen[at] = false;
}

// The cheapest simple path from start to everywhere. The definition.
std::vector<int> by_walking(int n, const std::vector<Edge>& edges, int start) {
    std::vector<int> out(n, INF);
    out[start] = 0;
    Adj adj = adjacency(n, edges);
    std::vector<bool> seen(n, false);
    walk(adj, seen, out, start, 0);
    return out;
}

std::string show(const std::vector<int>& row) {
    std::string s = "[";
    for (size_t i = 0; i < row.size(); i++) {
        if (i > 0) s += ", ";
        s += row[i] >= INF ? "-" : std::to_string(row[i]);
    }
    return s + "]";
}

std::string label(const std::vector<Edge>& edges) {
    std::string s = "[";
    for (size_t i = 0; i < edges.size(); i++) {
        if (i > 0) s += ", ";
        s += std::to_string(edges[i][0]) + "-" + std::to_string(edges[i][1]) + ":" +
             std::to_string(edges[i][2]);
    }
    return s + "]";
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
long long seed = 4242;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

int main() {
    std::vector<int> case_n = {4, 4, 5};
    std::vector<std::vector<Edge>> cases = {
        {{0, 1, 1}, {1, 2, 0}, {2, 3, 1}},
        {{0, 1, 1}, {0, 2, 0}, {2, 1, 0}, {1, 3, 1}},
        {{0, 1, 0}, {1, 2, 0}, {2, 3, 0}, {3, 4, 0}, {0, 4, 1}},
    };

    std::cout << std::left << std::setw(42) << "edges" << " " << std::setw(16) << "0-1 BFS"
              << " " << "Dijkstra" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        long long ops = 0, compares = 0;
        int widest = 0;
        std::vector<int> a = zero_one_bfs(case_n[c], cases[c], 0, ops, widest);
        std::vector<int> b = dijkstra(case_n[c], cases[c], 0, compares);
        std::cout << std::left << std::setw(42) << label(cases[c]) << " " << std::setw(16)
                  << show(a) << " " << show(b) << "\\n";
    }

    int trials = 3000;
    int agree_truth = 0, agree_dijkstra = 0, widest_seen = 0;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(5);
        std::vector<Edge> edges;
        for (int u = 0; u < n; u++)
            for (int v = 0; v < n; v++)
                if (u != v && rand_below(3) == 0) edges.push_back({u, v, rand_below(2)});
        std::vector<int> truth = by_walking(n, edges, 0);
        long long ops = 0, compares = 0;
        int widest = 0;
        std::vector<int> got = zero_one_bfs(n, edges, 0, ops, widest);
        std::vector<int> ref = dijkstra(n, edges, 0, compares);
        if (got == truth) agree_truth++;
        if (got == ref) agree_dijkstra++;
        if (widest > widest_seen) widest_seen = widest;
    }

    std::cout << "\\n";
    std::cout << "over " << trials << " random graphs with every weight 0 or 1:\\n";
    std::cout << std::right;
    std::cout << "  0-1 BFS matched every simple path      " << std::setw(6) << agree_truth << "\\n";
    std::cout << "  0-1 BFS matched Dijkstra               " << std::setw(6) << agree_dijkstra << "\\n";
    std::cout << "  most distinct distances ever in the\\n";
    std::cout << "    deque at once, over every pop        " << std::setw(6) << widest_seen << "\\n";

    std::cout << "\\n";
    std::cout << "and what the two frontiers cost on bigger graphs:\\n";
    std::cout << std::left << std::setw(7) << "nodes" << " " << std::setw(11) << "shape" << " "
              << std::right << std::setw(14) << "deque ops" << " " << std::setw(14)
              << "heap compares" << "\\n";
    for (int side : {20, 30, 40}) {
        int n = side * side;
        std::vector<Edge> chain;
        for (int v = 0; v < n - 1; v++) chain.push_back({v, v + 1, v % 2});
        std::vector<Edge> ladder;
        for (int v = 0; v < n - 1; v++) ladder.push_back({v, v + 1, 1});
        for (int v = 0; v < n - 2; v++) ladder.push_back({v, v + 2, 0});
        std::vector<Edge> grid;
        for (int r = 0; r < side; r++)
            for (int c = 0; c < side; c++) {
                int here = r * side + c;
                if (c + 1 < side) grid.push_back({here, here + 1, 1});
                if (r + 1 < side) grid.push_back({here, here + side, 0});
            }
        std::vector<std::pair<std::string, std::vector<Edge>>> shapes = {
            {"chain", chain}, {"ladder", ladder}, {"grid", grid}};
        for (const auto& shape : shapes) {
            long long ops = 0, compares = 0;
            int widest = 0;
            zero_one_bfs(n, shape.second, 0, ops, widest);
            dijkstra(n, shape.second, 0, compares);
            std::cout << std::left << std::setw(7) << n << " " << std::setw(11) << shape.first
                      << " " << std::right << std::setw(14) << ops << " " << std::setw(14)
                      << compares << "\\n";
        }
    }

    std::cout << "\\n";
    std::cout << "The deque never held more than " << widest_seen
              << " distinct distances, which is the whole\\n";
    std::cout << "argument: pop from the front and you are popping a nearest node, exactly\\n";
    std::cout << "the guarantee the heap was there to provide. A 0 edge reaches a node at\\n";
    std::cout << "the same distance, so it belongs at the front, ahead of everything one\\n";
    std::cout << "step further out. A 1 edge belongs at the back.\\n";
    std::cout << "\\n";
    std::cout << "The cost table says where that is worth anything. On a chain the heap\\n";
    std::cout << "never holds more than one item, so it costs nothing and the deque wins\\n";
    std::cout << "nothing -- an honest tie. The saving appears when the frontier is wide,\\n";
    std::cout << "and it is the frontier the heap was ordering. Every deque operation is\\n";
    std::cout << "O(1) whatever the width.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// 0-1 BFS: the graph where the priority queue is two buckets in a trench coat.
//
// Dijkstra's heap exists to answer one question: of everything discovered so
// far, which is nearest? When every edge weight is 0 or 1, that question has a
// much cheaper answer. A node reached by a 0 edge is exactly as far as the node
// it came from; a node reached by a 1 edge is one further. So the frontier only
// ever holds two distinct distances, d and d+1 -- and a double-ended queue can
// keep them apart by itself. Push front for 0, push back for 1.
//
// The claim that the deque holds at most two distinct distances is not folklore
// here. It is measured below, on every pop of every trial.
use std::collections::{HashSet, VecDeque};

const INF: i64 = 1_000_000_000;

type Edge = (usize, usize, i64);
type Adj = Vec<Vec<(usize, i64)>>;

fn adjacency(n: usize, edges: &[Edge]) -> Adj {
    let mut adj: Adj = vec![Vec::new(); n];
    for &(u, v, w) in edges {
        adj[u].push((v, w));
    }
    adj
}

/// Dijkstra with the heap replaced by a deque. Push front for 0, back for 1.
///
/// It settles, exactly as Dijkstra does: the node at the front of the deque is
/// declared final and never revisited. That claim is the thing the deque has to
/// earn, and it earns it only because the frontier holds two distances.
fn zero_one_bfs(n: usize, edges: &[Edge], start: usize) -> (Vec<i64>, u64, usize) {
    let adj = adjacency(n, edges);
    let mut best = vec![INF; n];
    best[start] = 0;
    let mut done = vec![false; n];
    let mut dq: VecDeque<usize> = VecDeque::new();
    dq.push_back(start);
    let mut ops: u64 = 1;
    let mut widest_frontier = 0;
    while let Some(at) = dq.pop_front() {
        ops += 1;
        if done[at] {
            continue;
        }
        done[at] = true;
        // How many different distances are sitting in the deque right now?
        let live: HashSet<i64> = dq.iter().map(|&x| best[x]).collect();
        if live.len() > widest_frontier {
            widest_frontier = live.len();
        }
        for idx in 0..adj[at].len() {
            let (nxt, w) = adj[at][idx];
            if !done[nxt] && best[at] + w < best[nxt] {
                best[nxt] = best[at] + w;
                ops += 1;
                if w == 0 {
                    dq.push_front(nxt);
                } else {
                    dq.push_back(nxt);
                }
            }
        }
    }
    (best, ops, widest_frontier)
}

/// The same answer with a binary heap, and the comparisons it costs.
fn dijkstra(n: usize, edges: &[Edge], start: usize) -> (Vec<i64>, u64) {
    let adj = adjacency(n, edges);
    let mut best = vec![INF; n];
    best[start] = 0;
    let mut done = vec![false; n];
    let mut heap: Vec<(i64, usize)> = vec![(0, start)];
    let mut compares: u64 = 0;

    fn before(a: (i64, usize), b: (i64, usize)) -> bool {
        a.0 < b.0 || (a.0 == b.0 && a.1 < b.1)
    }

    while !heap.is_empty() {
        // pop
        let top = heap[0];
        let last = heap.pop().unwrap();
        if !heap.is_empty() {
            heap[0] = last;
            let mut i = 0;
            loop {
                let mut small = i;
                for c in [2 * i + 1, 2 * i + 2] {
                    if c < heap.len() {
                        compares += 1;
                        if before(heap[c], heap[small]) {
                            small = c;
                        }
                    }
                }
                if small == i {
                    break;
                }
                heap.swap(i, small);
                i = small;
            }
        }
        let (cost, at) = top;
        if done[at] {
            continue;
        }
        done[at] = true;
        for idx in 0..adj[at].len() {
            let (nxt, w) = adj[at][idx];
            if !done[nxt] && cost + w < best[nxt] {
                best[nxt] = cost + w;
                // push
                heap.push((cost + w, nxt));
                let mut i = heap.len() - 1;
                while i > 0 {
                    let parent = (i - 1) / 2;
                    compares += 1;
                    if !before(heap[i], heap[parent]) {
                        break;
                    }
                    heap.swap(i, parent);
                    i = parent;
                }
            }
        }
    }
    (best, compares)
}

fn walk(adj: &Adj, seen: &mut [bool], out: &mut [i64], at: usize, cost: i64) {
    seen[at] = true;
    for idx in 0..adj[at].len() {
        let (nxt, w) = adj[at][idx];
        if !seen[nxt] {
            if cost + w < out[nxt] {
                out[nxt] = cost + w;
            }
            walk(adj, seen, out, nxt, cost + w);
        }
    }
    seen[at] = false;
}

/// The cheapest simple path from start to everywhere. The definition.
fn by_walking(n: usize, edges: &[Edge], start: usize) -> Vec<i64> {
    let mut out = vec![INF; n];
    out[start] = 0;
    let adj = adjacency(n, edges);
    let mut seen = vec![false; n];
    walk(&adj, &mut seen, &mut out, start, 0);
    out
}

fn show(row: &[i64]) -> String {
    let cells: Vec<String> = row
        .iter()
        .map(|&x| if x >= INF { "-".to_string() } else { x.to_string() })
        .collect();
    format!("[{}]", cells.join(", "))
}

fn label(edges: &[Edge]) -> String {
    let cells: Vec<String> = edges
        .iter()
        .map(|&(u, v, w)| format!("{}-{}:{}", u, v, w))
        .collect();
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

fn main() {
    let case_n = [4usize, 4, 5];
    let cases: Vec<Vec<Edge>> = vec![
        vec![(0, 1, 1), (1, 2, 0), (2, 3, 1)],
        vec![(0, 1, 1), (0, 2, 0), (2, 1, 0), (1, 3, 1)],
        vec![(0, 1, 0), (1, 2, 0), (2, 3, 0), (3, 4, 0), (0, 4, 1)],
    ];

    println!("{:<42} {:<16} {}", "edges", "0-1 BFS", "Dijkstra");
    for c in 0..cases.len() {
        let (a, _, _) = zero_one_bfs(case_n[c], &cases[c], 0);
        let (b, _) = dijkstra(case_n[c], &cases[c], 0);
        println!("{:<42} {:<16} {}", label(&cases[c]), show(&a), show(&b));
    }

    let mut rng = Rng { seed: 4242 };
    let trials = 3000;
    let (mut agree_truth, mut agree_dijkstra) = (0, 0);
    let mut widest_seen = 0;
    for _ in 0..trials {
        let n = 2 + rng.next(5) as usize;
        let mut edges: Vec<Edge> = Vec::new();
        for u in 0..n {
            for v in 0..n {
                if u != v && rng.next(3) == 0 {
                    edges.push((u, v, rng.next(2)));
                }
            }
        }
        let truth = by_walking(n, &edges, 0);
        let (got, _, widest) = zero_one_bfs(n, &edges, 0);
        let (reference, _) = dijkstra(n, &edges, 0);
        if got == truth {
            agree_truth += 1;
        }
        if got == reference {
            agree_dijkstra += 1;
        }
        if widest > widest_seen {
            widest_seen = widest;
        }
    }

    println!();
    println!("over {} random graphs with every weight 0 or 1:", trials);
    println!("  0-1 BFS matched every simple path      {:>6}", agree_truth);
    println!("  0-1 BFS matched Dijkstra               {:>6}", agree_dijkstra);
    println!("  most distinct distances ever in the");
    println!("    deque at once, over every pop        {:>6}", widest_seen);

    println!();
    println!("and what the two frontiers cost on bigger graphs:");
    println!("{:<7} {:<11} {:>14} {:>14}", "nodes", "shape", "deque ops", "heap compares");
    for &side in &[20usize, 30, 40] {
        let n = side * side;
        let chain: Vec<Edge> = (0..n - 1).map(|v| (v, v + 1, (v % 2) as i64)).collect();
        let mut ladder: Vec<Edge> = (0..n - 1).map(|v| (v, v + 1, 1i64)).collect();
        ladder.extend((0..n - 2).map(|v| (v, v + 2, 0i64)));
        let mut grid: Vec<Edge> = Vec::new();
        for r in 0..side {
            for c in 0..side {
                let here = r * side + c;
                if c + 1 < side {
                    grid.push((here, here + 1, 1));
                }
                if r + 1 < side {
                    grid.push((here, here + side, 0));
                }
            }
        }
        for (name, edges) in [("chain", &chain), ("ladder", &ladder), ("grid", &grid)] {
            let (_, ops, _) = zero_one_bfs(n, edges, 0);
            let (_, compares) = dijkstra(n, edges, 0);
            println!("{:<7} {:<11} {:>14} {:>14}", n, name, ops, compares);
        }
    }

    println!();
    println!(
        "The deque never held more than {} distinct distances, which is the whole",
        widest_seen
    );
    println!("argument: pop from the front and you are popping a nearest node, exactly");
    println!("the guarantee the heap was there to provide. A 0 edge reaches a node at");
    println!("the same distance, so it belongs at the front, ahead of everything one");
    println!("step further out. A 1 edge belongs at the back.");
    println!();
    println!("The cost table says where that is worth anything. On a chain the heap");
    println!("never holds more than one item, so it costs nothing and the deque wins");
    println!("nothing -- an honest tie. The saving appears when the frontier is wide,");
    println!("and it is the frontier the heap was ordering. Every deque operation is");
    println!("O(1) whatever the width.");
}
`,
            },
            {
              lang: "go",
              code: `// 0-1 BFS: the graph where the priority queue is two buckets in a trench coat.
//
// Dijkstra's heap exists to answer one question: of everything discovered so
// far, which is nearest? When every edge weight is 0 or 1, that question has a
// much cheaper answer. A node reached by a 0 edge is exactly as far as the node
// it came from; a node reached by a 1 edge is one further. So the frontier only
// ever holds two distinct distances, d and d+1 -- and a double-ended queue can
// keep them apart by itself. Push front for 0, push back for 1.
//
// The claim that the deque holds at most two distinct distances is not folklore
// here. It is measured below, on every pop of every trial.
package main

import (
	"fmt"
	"strings"
)

const INF = 1000000000

// Edge is a directed edge with a weight.
type Edge struct {
	U, V, W int
}

func adjacency(n int, edges []Edge) [][][2]int {
	adj := make([][][2]int, n)
	for _, e := range edges {
		adj[e.U] = append(adj[e.U], [2]int{e.V, e.W})
	}
	return adj
}

// deque holds one array with a head and a tail index, so pushing at either end
// is O(1). Room is reserved for every push the search can make.
type deque struct {
	buf        []int
	head, tail int
}

func newDeque(room int) *deque {
	return &deque{buf: make([]int, 2*room+2), head: room + 1, tail: room + 1}
}

func (d *deque) pushFront(x int) {
	d.head--
	d.buf[d.head] = x
}

func (d *deque) pushBack(x int) {
	d.buf[d.tail] = x
	d.tail++
}

func (d *deque) popFront() int {
	x := d.buf[d.head]
	d.head++
	return x
}

func (d *deque) size() int { return d.tail - d.head }

func (d *deque) values() []int { return d.buf[d.head:d.tail] }

// zeroOneBfs is Dijkstra with the heap replaced by a deque: front for 0, back for 1.
//
// It settles, exactly as Dijkstra does: the node at the front of the deque is
// declared final and never revisited. That claim is the thing the deque has to
// earn, and it earns it only because the frontier holds two distances.
func zeroOneBfs(n int, edges []Edge, start int) ([]int, int64, int) {
	adj := adjacency(n, edges)
	best := make([]int, n)
	for i := range best {
		best[i] = INF
	}
	best[start] = 0
	done := make([]bool, n)
	dq := newDeque(len(edges) + 1)
	dq.pushBack(start)
	var ops int64 = 1
	widestFrontier := 0
	for dq.size() > 0 {
		at := dq.popFront()
		ops++
		if done[at] {
			continue
		}
		done[at] = true
		// How many different distances are sitting in the deque right now?
		live := map[int]bool{}
		for _, x := range dq.values() {
			live[best[x]] = true
		}
		if len(live) > widestFrontier {
			widestFrontier = len(live)
		}
		for _, step := range adj[at] {
			if !done[step[0]] && best[at]+step[1] < best[step[0]] {
				best[step[0]] = best[at] + step[1]
				ops++
				if step[1] == 0 {
					dq.pushFront(step[0])
				} else {
					dq.pushBack(step[0])
				}
			}
		}
	}
	return best, ops, widestFrontier
}

// dijkstra gives the same answer with a binary heap, and the comparisons it costs.
func dijkstra(n int, edges []Edge, start int) ([]int, int64) {
	adj := adjacency(n, edges)
	best := make([]int, n)
	for i := range best {
		best[i] = INF
	}
	best[start] = 0
	done := make([]bool, n)
	heap := [][2]int{{0, start}}
	var compares int64

	before := func(a, b [2]int) bool {
		return a[0] < b[0] || (a[0] == b[0] && a[1] < b[1])
	}

	push := func(item [2]int) {
		heap = append(heap, item)
		i := len(heap) - 1
		for i > 0 {
			parent := (i - 1) / 2
			compares++
			if !before(heap[i], heap[parent]) {
				break
			}
			heap[i], heap[parent] = heap[parent], heap[i]
			i = parent
		}
	}

	pop := func() [2]int {
		top := heap[0]
		last := heap[len(heap)-1]
		heap = heap[:len(heap)-1]
		if len(heap) > 0 {
			heap[0] = last
			i := 0
			for {
				small := i
				for _, c := range []int{2*i + 1, 2*i + 2} {
					if c < len(heap) {
						compares++
						if before(heap[c], heap[small]) {
							small = c
						}
					}
				}
				if small == i {
					break
				}
				heap[i], heap[small] = heap[small], heap[i]
				i = small
			}
		}
		return top
	}

	for len(heap) > 0 {
		top := pop()
		cost, at := top[0], top[1]
		if done[at] {
			continue
		}
		done[at] = true
		for _, step := range adj[at] {
			if !done[step[0]] && cost+step[1] < best[step[0]] {
				best[step[0]] = cost + step[1]
				push([2]int{cost + step[1], step[0]})
			}
		}
	}
	return best, compares
}

func walk(adj [][][2]int, seen []bool, out []int, at, cost int) {
	seen[at] = true
	for _, step := range adj[at] {
		if !seen[step[0]] {
			if cost+step[1] < out[step[0]] {
				out[step[0]] = cost + step[1]
			}
			walk(adj, seen, out, step[0], cost+step[1])
		}
	}
	seen[at] = false
}

// byWalking gives the cheapest simple path from start to everywhere. The definition.
func byWalking(n int, edges []Edge, start int) []int {
	out := make([]int, n)
	for i := range out {
		out[i] = INF
	}
	out[start] = 0
	walk(adjacency(n, edges), make([]bool, n), out, start, 0)
	return out
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
		if x >= INF {
			cells[i] = "-"
		} else {
			cells[i] = fmt.Sprint(x)
		}
	}
	return "[" + strings.Join(cells, ", ") + "]"
}

func label(edges []Edge) string {
	cells := make([]string, len(edges))
	for i, e := range edges {
		cells[i] = fmt.Sprintf("%d-%d:%d", e.U, e.V, e.W)
	}
	return "[" + strings.Join(cells, ", ") + "]"
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
var seed int64 = 4242

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	caseN := []int{4, 4, 5}
	cases := [][]Edge{
		{{0, 1, 1}, {1, 2, 0}, {2, 3, 1}},
		{{0, 1, 1}, {0, 2, 0}, {2, 1, 0}, {1, 3, 1}},
		{{0, 1, 0}, {1, 2, 0}, {2, 3, 0}, {3, 4, 0}, {0, 4, 1}},
	}

	fmt.Printf("%-42s %-16s %s\\n", "edges", "0-1 BFS", "Dijkstra")
	for c := range cases {
		a, _, _ := zeroOneBfs(caseN[c], cases[c], 0)
		b, _ := dijkstra(caseN[c], cases[c], 0)
		fmt.Printf("%-42s %-16s %s\\n", label(cases[c]), show(a), show(b))
	}

	trials := 3000
	agreeTruth, agreeDijkstra, widestSeen := 0, 0, 0
	for t := 0; t < trials; t++ {
		n := 2 + randBelow(5)
		var edges []Edge
		for u := 0; u < n; u++ {
			for v := 0; v < n; v++ {
				if u != v && randBelow(3) == 0 {
					edges = append(edges, Edge{u, v, randBelow(2)})
				}
			}
		}
		truth := byWalking(n, edges, 0)
		got, _, widest := zeroOneBfs(n, edges, 0)
		ref, _ := dijkstra(n, edges, 0)
		if same(got, truth) {
			agreeTruth++
		}
		if same(got, ref) {
			agreeDijkstra++
		}
		if widest > widestSeen {
			widestSeen = widest
		}
	}

	fmt.Println()
	fmt.Printf("over %d random graphs with every weight 0 or 1:\\n", trials)
	fmt.Printf("  0-1 BFS matched every simple path      %6d\\n", agreeTruth)
	fmt.Printf("  0-1 BFS matched Dijkstra               %6d\\n", agreeDijkstra)
	fmt.Println("  most distinct distances ever in the")
	fmt.Printf("    deque at once, over every pop        %6d\\n", widestSeen)

	fmt.Println()
	fmt.Println("and what the two frontiers cost on bigger graphs:")
	fmt.Printf("%-7s %-11s %14s %14s\\n", "nodes", "shape", "deque ops", "heap compares")
	for _, side := range []int{20, 30, 40} {
		n := side * side
		var chain []Edge
		for v := 0; v < n-1; v++ {
			chain = append(chain, Edge{v, v + 1, v % 2})
		}
		var ladder []Edge
		for v := 0; v < n-1; v++ {
			ladder = append(ladder, Edge{v, v + 1, 1})
		}
		for v := 0; v < n-2; v++ {
			ladder = append(ladder, Edge{v, v + 2, 0})
		}
		var grid []Edge
		for r := 0; r < side; r++ {
			for c := 0; c < side; c++ {
				here := r*side + c
				if c+1 < side {
					grid = append(grid, Edge{here, here + 1, 1})
				}
				if r+1 < side {
					grid = append(grid, Edge{here, here + side, 0})
				}
			}
		}
		names := []string{"chain", "ladder", "grid"}
		shapes := [][]Edge{chain, ladder, grid}
		for s := 0; s < 3; s++ {
			_, ops, _ := zeroOneBfs(n, shapes[s], 0)
			_, compares := dijkstra(n, shapes[s], 0)
			fmt.Printf("%-7d %-11s %14d %14d\\n", n, names[s], ops, compares)
		}
	}

	fmt.Println()
	fmt.Printf("The deque never held more than %d distinct distances, which is the whole\\n", widestSeen)
	fmt.Println("argument: pop from the front and you are popping a nearest node, exactly")
	fmt.Println("the guarantee the heap was there to provide. A 0 edge reaches a node at")
	fmt.Println("the same distance, so it belongs at the front, ahead of everything one")
	fmt.Println("step further out. A 1 edge belongs at the back.")
	fmt.Println()
	fmt.Println("The cost table says where that is worth anything. On a chain the heap")
	fmt.Println("never holds more than one item, so it costs nothing and the deque wins")
	fmt.Println("nothing -- an honest tie. The saving appears when the frontier is wide,")
	fmt.Println("and it is the frontier the heap was ordering. Every deque operation is")
	fmt.Println("O(1) whatever the width.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Pushing to the back on a 0 edge",
          body: "It is the one line that matters. A 0 edge reaches a node at the same distance as its parent, so it belongs ahead of everything one step further out. Send it to the back and the deque stops being sorted, which is the same failure a weight of 2 causes.",
        },
        {
          title: "Reaching for the deque when the frontier is narrow",
          body: "On a plain chain the heap never holds more than one item and costs zero comparisons, so the deque saves nothing at all. The 3,200-against-15,587 result came from a grid, where the frontier is wide. The saving is proportional to how much ordering the heap was actually doing.",
        },
      ],
    },
    {
      id: "the-moment-a-weight-is-two",
      heading: "The moment a weight is two",
      body: [
        "Now put a 2 in the graph. The deque's whole argument was that the frontier holds two distances, so front and back are enough. A node reached at `d + 2` pushed to the back sits among the nodes at `d + 1`, and the queue is no longer sorted.",
        "What happens next depends on which version of 0-1 BFS was written, and the two versions fail differently.",
        "The **settling** version \u2014 pop, declare final, never revisit \u2014 is the fast one, and it is now wrong. Over 3,000 random graphs with weights 0, 1 and 2 it matched an exhaustive walk on 2,967. The 44 entries it got wrong were every one of them too high, none too low: the same silent failure mode as the wrong Floyd-Warshall loop order, and for the same reason \u2014 every number it reports is the cost of a real route.",
        "The smallest example is three nodes. `0\u21921` costs 2, `0\u21922` costs 1, `2\u21921` costs 0. The 2-edge goes to the back, node 1 gets popped and settled at 2, and the free route through node 2 is never looked at. The answer is 1.",
        "The **relaxing** version \u2014 no `done` array, re-examine a node every time its distance improves \u2014 stays correct on all 3,000. Dropping the settle turns it into Bellman-Ford with an opinionated queue. What goes with the settle is the bound: nothing now stops a node scanning its edges twice, and the counters show it, one node reaching 3 scans where the settling version is capped at 1 by construction. The pop totals barely differ \u2014 8,464 against 8,421 \u2014 which is precisely why the missing bound is easy not to notice.",
        "The repair is not a different algorithm. **A deque is two buckets.** Give it `k + 1` buckets indexed by distance modulo `k + 1` and the same argument works for every weight from 0 to `k`, because the frontier only ever spans the window from `d` to `d + k`. That is Dial's algorithm, and 0-1 BFS is its `k = 1` case with the front and the back written out longhand. It matched the exhaustive walk on all 3,000, and its step count barely moves as `k` grows from 1 to 15.",
      ],
      examples: [
        {
          id: "when-a-weight-is-two",
          title: "Two versions, two different failures, and the bucket queue that fixes both",
          lang: "python",
          code: `# The trick breaks the moment a weight is 2, and it breaks two different ways.
#
# The deque works because the frontier holds at most two distinct distances,
# so "front" and "back" are enough to keep it in order. A weight of 2 puts a
# node at d+2 while the back of the deque is d+1, and the queue stops being
# sorted. What happens next depends on which version was written.
#
#   settling  -- pop, declare final, never revisit. Fast, and now wrong.
#   relaxing  -- pop and re-examine every time it improves. Still right, and
#                the O(V + E) bound is gone with it.
#
# The repair is not a different algorithm. A deque is two buckets. Give it
# k+1 buckets indexed by distance modulo k+1 and the same argument works for
# every weight from 0 to k. That is Dial's algorithm, and 0-1 BFS is its k = 1.
from collections import deque

INF = 10 ** 9


def adjacency(n, edges):
    adj = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((v, w))
    return adj


def zero_one_settling(n, edges, start):
    """The 0-1 rule with Dijkstra's settle: the front of the deque is final."""
    adj = adjacency(n, edges)
    best = [INF] * n
    best[start] = 0
    done = [False] * n
    dq = deque([start])
    pops = 0
    scans = [0] * n
    while dq:
        at = dq.popleft()
        pops += 1
        if done[at]:
            continue
        done[at] = True
        scans[at] += 1
        for nxt, w in adj[at]:
            if not done[nxt] and best[at] + w < best[nxt]:
                best[nxt] = best[at] + w
                if w == 0:
                    dq.appendleft(nxt)
                else:
                    dq.append(nxt)
    return best, pops, max(scans)


def zero_one_relaxing(n, edges, start):
    """The same deque with nothing declared final. Correct, and no longer bounded."""
    adj = adjacency(n, edges)
    best = [INF] * n
    best[start] = 0
    dq = deque([start])
    pops = 0
    scans = [0] * n
    while dq:
        at = dq.popleft()
        pops += 1
        scans[at] += 1
        for nxt, w in adj[at]:
            if best[at] + w < best[nxt]:
                best[nxt] = best[at] + w
                if w == 0:
                    dq.appendleft(nxt)
                else:
                    dq.append(nxt)
    return best, pops, max(scans)


def dial(n, edges, start, maxw):
    """Dial's algorithm: k+1 buckets, indexed by distance modulo k+1.

    Every live distance sits in the window [d, d + maxw], which is exactly
    maxw + 1 values, so two live distances never share a bucket. Set maxw to 1
    and this is the deque again, with the front and the back written out.
    """
    adj = adjacency(n, edges)
    width = maxw + 1
    buckets = [[] for _ in range(width)]
    best = [INF] * n
    best[start] = 0
    buckets[0].append(start)
    waiting = 1
    d = 0
    steps = 0
    while waiting > 0:
        while not buckets[d % width]:
            d += 1
            steps += 1
        at = buckets[d % width].pop()
        waiting -= 1
        steps += 1
        if best[at] != d:
            continue
        for nxt, w in adj[at]:
            if d + w < best[nxt]:
                best[nxt] = d + w
                buckets[(d + w) % width].append(nxt)
                waiting += 1
                steps += 1
    return best, steps


def dijkstra(n, edges, start):
    """The reference, and the comparisons its heap costs."""
    adj = adjacency(n, edges)
    best = [INF] * n
    best[start] = 0
    done = [False] * n
    heap = [(0, start)]
    compares = 0

    def before(a, b):
        return a[0] < b[0] or (a[0] == b[0] and a[1] < b[1])

    def push(item):
        nonlocal compares
        heap.append(item)
        i = len(heap) - 1
        while i > 0:
            parent = (i - 1) // 2
            compares += 1
            if not before(heap[i], heap[parent]):
                break
            heap[i], heap[parent] = heap[parent], heap[i]
            i = parent

    def pop():
        nonlocal compares
        top = heap[0]
        last = heap.pop()
        if heap:
            heap[0] = last
            i = 0
            while True:
                small = i
                for c in (2 * i + 1, 2 * i + 2):
                    if c < len(heap):
                        compares += 1
                        if before(heap[c], heap[small]):
                            small = c
                if small == i:
                    break
                heap[i], heap[small] = heap[small], heap[i]
                i = small
        return top

    while heap:
        cost, at = pop()
        if done[at]:
            continue
        done[at] = True
        for nxt, w in adj[at]:
            if not done[nxt] and cost + w < best[nxt]:
                best[nxt] = cost + w
                push((cost + w, nxt))
    return best, compares


def by_walking(n, edges, start):
    """The cheapest simple path from start to everywhere. The definition."""
    adj = adjacency(n, edges)
    out = [INF] * n
    out[start] = 0
    seen = [False] * n

    def walk(at, cost):
        seen[at] = True
        for nxt, w in adj[at]:
            if not seen[nxt]:
                if cost + w < out[nxt]:
                    out[nxt] = cost + w
                walk(nxt, cost + w)
        seen[at] = False

    walk(start, 0)
    return out


def show(row):
    return "[" + ", ".join("-" if x >= INF else str(x) for x in row) + "]"


def label(edges):
    return "[" + ", ".join("%d-%d:%d" % e for e in edges) + "]"


CASES = [
    (3, [(0, 1, 2), (0, 2, 1), (2, 1, 0)]),
    (4, [(0, 1, 2), (0, 2, 1), (2, 3, 0), (3, 1, 0)]),
    (4, [(0, 1, 1), (1, 2, 2), (0, 3, 2), (3, 2, 1)]),
]

print("%-38s %-12s %-12s %-12s %s" % ("edges", "settling", "relaxing", "Dial k=2", "truth"))
for n, edges in CASES:
    a, _, _ = zero_one_settling(n, edges, 0)
    b, _, _ = zero_one_relaxing(n, edges, 0)
    c, _ = dial(n, edges, 0, 2)
    print("%-38s %-12s %-12s %-12s %s" % (
        label(edges), show(a), show(b), show(c), show(by_walking(n, edges, 0))))

# The same linear congruential generator in every language, so the random
# graphs below are the same graphs whichever translation is run.
seed = 31337


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


trials = 3000
settle_ok = relax_ok = dial_ok = 0
too_high = too_low = 0
settle_pops = relax_pops = 0
settle_worst = relax_worst = 0
for _ in range(trials):
    n = 2 + rand(5)
    edges = []
    for u in range(n):
        for v in range(n):
            if u != v and rand(3) == 0:
                edges.append((u, v, rand(3)))
    truth = by_walking(n, edges, 0)
    a, pa, wa = zero_one_settling(n, edges, 0)
    b, pb, wb = zero_one_relaxing(n, edges, 0)
    c, _ = dial(n, edges, 0, 2)
    settle_ok += a == truth
    relax_ok += b == truth
    dial_ok += c == truth
    settle_pops += pa
    relax_pops += pb
    if wa > settle_worst:
        settle_worst = wa
    if wb > relax_worst:
        relax_worst = wb
    for i in range(n):
        if a[i] > truth[i]:
            too_high += 1
        if a[i] < truth[i]:
            too_low += 1

print()
print("over %d random graphs with weights 0, 1 and 2:" % trials)
print("  settling deque matched every simple path %6d" % settle_ok)
print("  relaxing deque matched it                %6d" % relax_ok)
print("  Dial with 3 buckets matched it           %6d" % dial_ok)
print("  entries the settling deque put too high  %6d" % too_high)
print("  entries it put too low                   %6d" % too_low)
print("  pops, settling / relaxing                %6d %6d" % (settle_pops, relax_pops))
print("  most times one node scanned its edges,")
print("    settling / relaxing                    %6d %6d" % (settle_worst, relax_worst))

print()
print("and what the buckets cost against the heap, weights 0 to k:")
print("%-4s %-7s %14s %14s" % ("k", "nodes", "bucket steps", "heap compares"))
for maxw in (1, 3, 7, 15):
    side = 40
    n = side * side
    edges = []
    for r in range(side):
        for c in range(side):
            here = r * side + c
            if c + 1 < side:
                edges.append((here, here + 1, (r + c) % (maxw + 1)))
            if r + 1 < side:
                edges.append((here, here + side, (r * 2 + c) % (maxw + 1)))
    _, steps = dial(n, edges, 0, maxw)
    _, compares = dijkstra(n, edges, 0)
    print("%-4d %-7d %14d %14d" % (maxw, n, steps, compares))

print()
print("Row one of the table is the smallest failure, and it is three nodes: a 2")
print("edge to node 1 goes to the back of the deque, where it sits among the")
print("nodes at distance 1. Node 1 is popped and declared final at 2, before the")
print("free route through node 2 is ever looked at. The truth is 1.")
print()
print("The settling deque got %d of %d graphs right, and the %d entries it" % (settle_ok, trials, too_high))
print("got wrong were all too high, none too low -- the same quiet failure as")
print("the wrong Floyd-Warshall loop order.")
print()
print("The relaxing deque got every graph right. Dropping the settle turns it")
print("into Bellman-Ford with an opinionated queue, correct on any non-negative")
print("weights. What goes with the settle is the bound. The done array is what")
print("stops a node scanning its edges twice, and the counter above says the")
print("settling version never did: %d, by construction. Relaxing has no such" % settle_worst)
print("limit and reached %d even on graphs this small. The pop totals barely" % relax_worst)
print("differ, %d against %d, which is exactly why the missing bound is easy" % (relax_pops, settle_pops))
print("not to notice until a shape turns up that exploits it.")
print()
print("Dial keeps both. The deque was two buckets; make it k+1 and every live")
print("distance still lands in its own one, because the frontier only ever")
print("spans the window from d to d+k. The bucket column barely moves as k")
print("grows while the heap keeps paying -- and the first row, k = 1, is 0-1")
print("BFS with the front and the back spelled out longhand.")
`,
          output: `edges                                  settling     relaxing     Dial k=2     truth
[0-1:2, 0-2:1, 2-1:0]                  [0, 2, 1]    [0, 1, 1]    [0, 1, 1]    [0, 1, 1]
[0-1:2, 0-2:1, 2-3:0, 3-1:0]           [0, 2, 1, 1] [0, 1, 1, 1] [0, 1, 1, 1] [0, 1, 1, 1]
[0-1:1, 1-2:2, 0-3:2, 3-2:1]           [0, 1, 3, 2] [0, 1, 3, 2] [0, 1, 3, 2] [0, 1, 3, 2]

over 3000 random graphs with weights 0, 1 and 2:
  settling deque matched every simple path   2967
  relaxing deque matched it                  3000
  Dial with 3 buckets matched it             3000
  entries the settling deque put too high      44
  entries it put too low                        0
  pops, settling / relaxing                  8421   8464
  most times one node scanned its edges,
    settling / relaxing                         1      3

and what the buckets cost against the heap, weights 0 to k:
k    nodes     bucket steps  heap compares
1    1600              3219          18690
3    1600              3259          17713
7    1600              3375          16659
15   1600              3583          16519

Row one of the table is the smallest failure, and it is three nodes: a 2
edge to node 1 goes to the back of the deque, where it sits among the
nodes at distance 1. Node 1 is popped and declared final at 2, before the
free route through node 2 is ever looked at. The truth is 1.

The settling deque got 2967 of 3000 graphs right, and the 44 entries it
got wrong were all too high, none too low -- the same quiet failure as
the wrong Floyd-Warshall loop order.

The relaxing deque got every graph right. Dropping the settle turns it
into Bellman-Ford with an opinionated queue, correct on any non-negative
weights. What goes with the settle is the bound. The done array is what
stops a node scanning its edges twice, and the counter above says the
settling version never did: 1, by construction. Relaxing has no such
limit and reached 3 even on graphs this small. The pop totals barely
differ, 8464 against 8421, which is exactly why the missing bound is easy
not to notice until a shape turns up that exploits it.

Dial keeps both. The deque was two buckets; make it k+1 and every live
distance still lands in its own one, because the frontier only ever
spans the window from d to d+k. The bucket column barely moves as k
grows while the heap keeps paying -- and the first row, k = 1, is 0-1
BFS with the front and the back spelled out longhand.`,
          explanation:
            "The settling deque, the relaxing deque and Dial's algorithm on weights 0, 1 and 2. Note that one variant loses correctness and the other loses its bound.",
          alternates: [
            {
              lang: "javascript",
              code: `// The trick breaks the moment a weight is 2, and it breaks two different ways.
//
// The deque works because the frontier holds at most two distinct distances,
// so "front" and "back" are enough to keep it in order. A weight of 2 puts a
// node at d+2 while the back of the deque is d+1, and the queue stops being
// sorted. What happens next depends on which version was written.
//
//   settling  -- pop, declare final, never revisit. Fast, and now wrong.
//   relaxing  -- pop and re-examine every time it improves. Still right, and
//                the O(V + E) bound is gone with it.
//
// The repair is not a different algorithm. A deque is two buckets. Give it
// k+1 buckets indexed by distance modulo k+1 and the same argument works for
// every weight from 0 to k. That is Dial's algorithm, and 0-1 BFS is its k = 1.
const INF = 10 ** 9;

function adjacency(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  return adj;
}

// The 0-1 rule with Dijkstra's settle: the front of the deque is final.
function zeroOneSettling(n, edges, start) {
  const adj = adjacency(n, edges);
  const best = new Array(n).fill(INF);
  best[start] = 0;
  const done = new Array(n).fill(false);
  const scans = new Array(n).fill(0);
  const dq = [start];
  let pops = 0;
  while (dq.length > 0) {
    const at = dq.shift();
    pops += 1;
    if (done[at]) continue;
    done[at] = true;
    scans[at] += 1;
    for (const [nxt, w] of adj[at]) {
      if (!done[nxt] && best[at] + w < best[nxt]) {
        best[nxt] = best[at] + w;
        if (w === 0) dq.unshift(nxt);
        else dq.push(nxt);
      }
    }
  }
  return [best, pops, Math.max(...scans)];
}

// The same deque with nothing declared final. Correct, and no longer bounded.
function zeroOneRelaxing(n, edges, start) {
  const adj = adjacency(n, edges);
  const best = new Array(n).fill(INF);
  best[start] = 0;
  const scans = new Array(n).fill(0);
  const dq = [start];
  let pops = 0;
  while (dq.length > 0) {
    const at = dq.shift();
    pops += 1;
    scans[at] += 1;
    for (const [nxt, w] of adj[at]) {
      if (best[at] + w < best[nxt]) {
        best[nxt] = best[at] + w;
        if (w === 0) dq.unshift(nxt);
        else dq.push(nxt);
      }
    }
  }
  return [best, pops, Math.max(...scans)];
}

// Dial's algorithm: k+1 buckets, indexed by distance modulo k+1.
//
// Every live distance sits in the window [d, d + maxw], which is exactly
// maxw + 1 values, so two live distances never share a bucket. Set maxw to 1
// and this is the deque again, with the front and the back written out.
function dial(n, edges, start, maxw) {
  const adj = adjacency(n, edges);
  const width = maxw + 1;
  const buckets = Array.from({ length: width }, () => []);
  const best = new Array(n).fill(INF);
  best[start] = 0;
  buckets[0].push(start);
  let waiting = 1;
  let d = 0;
  let steps = 0;
  while (waiting > 0) {
    while (buckets[d % width].length === 0) {
      d += 1;
      steps += 1;
    }
    const at = buckets[d % width].pop();
    waiting -= 1;
    steps += 1;
    if (best[at] !== d) continue;
    for (const [nxt, w] of adj[at]) {
      if (d + w < best[nxt]) {
        best[nxt] = d + w;
        buckets[(d + w) % width].push(nxt);
        waiting += 1;
        steps += 1;
      }
    }
  }
  return [best, steps];
}

// The reference, and the comparisons its heap costs.
function dijkstra(n, edges, start) {
  const adj = adjacency(n, edges);
  const best = new Array(n).fill(INF);
  best[start] = 0;
  const done = new Array(n).fill(false);
  const heap = [[0, start]];
  let compares = 0;

  const before = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);

  const push = (item) => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      compares += 1;
      if (!before(heap[i], heap[parent])) break;
      [heap[i], heap[parent]] = [heap[parent], heap[i]];
      i = parent;
    }
  };

  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        let small = i;
        for (const c of [2 * i + 1, 2 * i + 2]) {
          if (c < heap.length) {
            compares += 1;
            if (before(heap[c], heap[small])) small = c;
          }
        }
        if (small === i) break;
        [heap[i], heap[small]] = [heap[small], heap[i]];
        i = small;
      }
    }
    return top;
  };

  while (heap.length > 0) {
    const [cost, at] = pop();
    if (done[at]) continue;
    done[at] = true;
    for (const [nxt, w] of adj[at]) {
      if (!done[nxt] && cost + w < best[nxt]) {
        best[nxt] = cost + w;
        push([cost + w, nxt]);
      }
    }
  }
  return [best, compares];
}

// The cheapest simple path from start to everywhere. The definition.
function byWalking(n, edges, start) {
  const adj = adjacency(n, edges);
  const out = new Array(n).fill(INF);
  out[start] = 0;
  const seen = new Array(n).fill(false);
  const walk = (at, cost) => {
    seen[at] = true;
    for (const [nxt, w] of adj[at]) {
      if (!seen[nxt]) {
        if (cost + w < out[nxt]) out[nxt] = cost + w;
        walk(nxt, cost + w);
      }
    }
    seen[at] = false;
  };
  walk(start, 0);
  return out;
}

function show(row) {
  return "[" + row.map((x) => (x >= INF ? "-" : String(x))).join(", ") + "]";
}

function label(edges) {
  return "[" + edges.map(([u, v, w]) => \`\${u}-\${v}:\${w}\`).join(", ") + "]";
}

const CASES = [
  [3, [[0, 1, 2], [0, 2, 1], [2, 1, 0]]],
  [4, [[0, 1, 2], [0, 2, 1], [2, 3, 0], [3, 1, 0]]],
  [4, [[0, 1, 1], [1, 2, 2], [0, 3, 2], [3, 2, 1]]],
];

console.log(
  "edges".padEnd(38) + " " + "settling".padEnd(12) + " " + "relaxing".padEnd(12) + " " +
  "Dial k=2".padEnd(12) + " " + "truth",
);
for (const [n, edges] of CASES) {
  const [a] = zeroOneSettling(n, edges, 0);
  const [b] = zeroOneRelaxing(n, edges, 0);
  const [c] = dial(n, edges, 0, 2);
  console.log(
    label(edges).padEnd(38) + " " + show(a).padEnd(12) + " " + show(b).padEnd(12) + " " +
    show(c).padEnd(12) + " " + show(byWalking(n, edges, 0)),
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 31337n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let settleOk = 0;
let relaxOk = 0;
let dialOk = 0;
let tooHigh = 0;
let tooLow = 0;
let settlePops = 0;
let relaxPops = 0;
let settleWorst = 0;
let relaxWorst = 0;
const same = (a, b) => a.every((x, i) => x === b[i]);
for (let t = 0; t < trials; t += 1) {
  const n = 2 + rand(5);
  const edges = [];
  for (let u = 0; u < n; u += 1)
    for (let v = 0; v < n; v += 1)
      if (u !== v && rand(3) === 0) edges.push([u, v, rand(3)]);
  const truth = byWalking(n, edges, 0);
  const [a, pa, wa] = zeroOneSettling(n, edges, 0);
  const [b, pb, wb] = zeroOneRelaxing(n, edges, 0);
  const [c] = dial(n, edges, 0, 2);
  if (same(a, truth)) settleOk += 1;
  if (same(b, truth)) relaxOk += 1;
  if (same(c, truth)) dialOk += 1;
  settlePops += pa;
  relaxPops += pb;
  if (wa > settleWorst) settleWorst = wa;
  if (wb > relaxWorst) relaxWorst = wb;
  for (let i = 0; i < n; i += 1) {
    if (a[i] > truth[i]) tooHigh += 1;
    if (a[i] < truth[i]) tooLow += 1;
  }
}

console.log();
console.log(\`over \${trials} random graphs with weights 0, 1 and 2:\`);
console.log("  settling deque matched every simple path " + String(settleOk).padStart(6));
console.log("  relaxing deque matched it                " + String(relaxOk).padStart(6));
console.log("  Dial with 3 buckets matched it           " + String(dialOk).padStart(6));
console.log("  entries the settling deque put too high  " + String(tooHigh).padStart(6));
console.log("  entries it put too low                   " + String(tooLow).padStart(6));
console.log("  pops, settling / relaxing                " + String(settlePops).padStart(6) + " " + String(relaxPops).padStart(6));
console.log("  most times one node scanned its edges,");
console.log("    settling / relaxing                    " + String(settleWorst).padStart(6) + " " + String(relaxWorst).padStart(6));

console.log();
console.log("and what the buckets cost against the heap, weights 0 to k:");
console.log("k".padEnd(4) + " " + "nodes".padEnd(7) + " " + "bucket steps".padStart(14) + " " + "heap compares".padStart(14));
for (const maxw of [1, 3, 7, 15]) {
  const side = 40;
  const n = side * side;
  const edges = [];
  for (let r = 0; r < side; r += 1)
    for (let c = 0; c < side; c += 1) {
      const here = r * side + c;
      if (c + 1 < side) edges.push([here, here + 1, (r + c) % (maxw + 1)]);
      if (r + 1 < side) edges.push([here, here + side, (r * 2 + c) % (maxw + 1)]);
    }
  const [, steps] = dial(n, edges, 0, maxw);
  const [, compares] = dijkstra(n, edges, 0);
  console.log(
    String(maxw).padEnd(4) + " " + String(n).padEnd(7) + " " +
    String(steps).padStart(14) + " " + String(compares).padStart(14),
  );
}

console.log();
console.log("Row one of the table is the smallest failure, and it is three nodes: a 2");
console.log("edge to node 1 goes to the back of the deque, where it sits among the");
console.log("nodes at distance 1. Node 1 is popped and declared final at 2, before the");
console.log("free route through node 2 is ever looked at. The truth is 1.");
console.log();
console.log(\`The settling deque got \${settleOk} of \${trials} graphs right, and the \${tooHigh} entries it\`);
console.log("got wrong were all too high, none too low -- the same quiet failure as");
console.log("the wrong Floyd-Warshall loop order.");
console.log();
console.log("The relaxing deque got every graph right. Dropping the settle turns it");
console.log("into Bellman-Ford with an opinionated queue, correct on any non-negative");
console.log("weights. What goes with the settle is the bound. The done array is what");
console.log("stops a node scanning its edges twice, and the counter above says the");
console.log(\`settling version never did: \${settleWorst}, by construction. Relaxing has no such\`);
console.log(\`limit and reached \${relaxWorst} even on graphs this small. The pop totals barely\`);
console.log(\`differ, \${relaxPops} against \${settlePops}, which is exactly why the missing bound is easy\`);
console.log("not to notice until a shape turns up that exploits it.");
console.log();
console.log("Dial keeps both. The deque was two buckets; make it k+1 and every live");
console.log("distance still lands in its own one, because the frontier only ever");
console.log("spans the window from d to d+k. The bucket column barely moves as k");
console.log("grows while the heap keeps paying -- and the first row, k = 1, is 0-1");
console.log("BFS with the front and the back spelled out longhand.");
`,
            },
            {
              lang: "typescript",
              code: `// The trick breaks the moment a weight is 2, and it breaks two different ways.
//
// The deque works because the frontier holds at most two distinct distances,
// so "front" and "back" are enough to keep it in order. A weight of 2 puts a
// node at d+2 while the back of the deque is d+1, and the queue stops being
// sorted. What happens next depends on which version was written.
//
//   settling  -- pop, declare final, never revisit. Fast, and now wrong.
//   relaxing  -- pop and re-examine every time it improves. Still right, and
//                the O(V + E) bound is gone with it.
//
// The repair is not a different algorithm. A deque is two buckets. Give it
// k+1 buckets indexed by distance modulo k+1 and the same argument works for
// every weight from 0 to k. That is Dial's algorithm, and 0-1 BFS is its k = 1.
const INF = 10 ** 9;

function adjacency(n: number, edges: number[][]): number[][][] {
  const adj: number[][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  return adj;
}

// The 0-1 rule with Dijkstra's settle: the front of the deque is final.
function zeroOneSettling(n: number, edges: number[][], start: number): [number[], number, number] {
  const adj = adjacency(n, edges);
  const best = new Array(n).fill(INF);
  best[start] = 0;
  const done = new Array(n).fill(false);
  const scans = new Array(n).fill(0);
  const dq = [start];
  let pops = 0;
  while (dq.length > 0) {
    const at = dq.shift() as number;
    pops += 1;
    if (done[at]) continue;
    done[at] = true;
    scans[at] += 1;
    for (const [nxt, w] of adj[at]) {
      if (!done[nxt] && best[at] + w < best[nxt]) {
        best[nxt] = best[at] + w;
        if (w === 0) dq.unshift(nxt);
        else dq.push(nxt);
      }
    }
  }
  return [best, pops, Math.max(...scans)];
}

// The same deque with nothing declared final. Correct, and no longer bounded.
function zeroOneRelaxing(n: number, edges: number[][], start: number): [number[], number, number] {
  const adj = adjacency(n, edges);
  const best = new Array(n).fill(INF);
  best[start] = 0;
  const scans = new Array(n).fill(0);
  const dq = [start];
  let pops = 0;
  while (dq.length > 0) {
    const at = dq.shift() as number;
    pops += 1;
    scans[at] += 1;
    for (const [nxt, w] of adj[at]) {
      if (best[at] + w < best[nxt]) {
        best[nxt] = best[at] + w;
        if (w === 0) dq.unshift(nxt);
        else dq.push(nxt);
      }
    }
  }
  return [best, pops, Math.max(...scans)];
}

// Dial's algorithm: k+1 buckets, indexed by distance modulo k+1.
//
// Every live distance sits in the window [d, d + maxw], which is exactly
// maxw + 1 values, so two live distances never share a bucket. Set maxw to 1
// and this is the deque again, with the front and the back written out.
function dial(n: number, edges: number[][], start: number, maxw: number): [number[], number] {
  const adj = adjacency(n, edges);
  const width = maxw + 1;
  const buckets: number[][] = Array.from({ length: width }, () => []);
  const best = new Array(n).fill(INF);
  best[start] = 0;
  buckets[0].push(start);
  let waiting = 1;
  let d = 0;
  let steps = 0;
  while (waiting > 0) {
    while (buckets[d % width].length === 0) {
      d += 1;
      steps += 1;
    }
    const at = buckets[d % width].pop() as number;
    waiting -= 1;
    steps += 1;
    if (best[at] !== d) continue;
    for (const [nxt, w] of adj[at]) {
      if (d + w < best[nxt]) {
        best[nxt] = d + w;
        buckets[(d + w) % width].push(nxt);
        waiting += 1;
        steps += 1;
      }
    }
  }
  return [best, steps];
}

// The reference, and the comparisons its heap costs.
function dijkstra(n: number, edges: number[][], start: number): [number[], number] {
  const adj = adjacency(n, edges);
  const best = new Array(n).fill(INF);
  best[start] = 0;
  const done = new Array(n).fill(false);
  const heap: [number, number][] = [[0, start]];
  let compares = 0;

  const before = (a: [number, number], b: [number, number]): boolean => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);

  const push = (item: [number, number]): void => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      compares += 1;
      if (!before(heap[i], heap[parent])) break;
      [heap[i], heap[parent]] = [heap[parent], heap[i]];
      i = parent;
    }
  };

  const pop = (): [number, number] => {
    const top = heap[0];
    const last = heap.pop() as [number, number];
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        let small = i;
        for (const c of [2 * i + 1, 2 * i + 2]) {
          if (c < heap.length) {
            compares += 1;
            if (before(heap[c], heap[small])) small = c;
          }
        }
        if (small === i) break;
        [heap[i], heap[small]] = [heap[small], heap[i]];
        i = small;
      }
    }
    return top;
  };

  while (heap.length > 0) {
    const [cost, at] = pop();
    if (done[at]) continue;
    done[at] = true;
    for (const [nxt, w] of adj[at]) {
      if (!done[nxt] && cost + w < best[nxt]) {
        best[nxt] = cost + w;
        push([cost + w, nxt]);
      }
    }
  }
  return [best, compares];
}

// The cheapest simple path from start to everywhere. The definition.
function byWalking(n: number, edges: number[][], start: number): number[] {
  const adj = adjacency(n, edges);
  const out = new Array(n).fill(INF);
  out[start] = 0;
  const seen = new Array(n).fill(false);
  const walk = (at: number, cost: number): void => {
    seen[at] = true;
    for (const [nxt, w] of adj[at]) {
      if (!seen[nxt]) {
        if (cost + w < out[nxt]) out[nxt] = cost + w;
        walk(nxt, cost + w);
      }
    }
    seen[at] = false;
  };
  walk(start, 0);
  return out;
}

function show(row: number[]): string {
  return "[" + row.map((x) => (x >= INF ? "-" : String(x))).join(", ") + "]";
}

function label(edges: number[][]): string {
  return "[" + edges.map(([u, v, w]) => \`\${u}-\${v}:\${w}\`).join(", ") + "]";
}

const CASES: [number, number[][]][] = [
  [3, [[0, 1, 2], [0, 2, 1], [2, 1, 0]]],
  [4, [[0, 1, 2], [0, 2, 1], [2, 3, 0], [3, 1, 0]]],
  [4, [[0, 1, 1], [1, 2, 2], [0, 3, 2], [3, 2, 1]]],
];

console.log(
  "edges".padEnd(38) + " " + "settling".padEnd(12) + " " + "relaxing".padEnd(12) + " " +
  "Dial k=2".padEnd(12) + " " + "truth",
);
for (const [n, edges] of CASES) {
  const [a] = zeroOneSettling(n, edges, 0);
  const [b] = zeroOneRelaxing(n, edges, 0);
  const [c] = dial(n, edges, 0, 2);
  console.log(
    label(edges).padEnd(38) + " " + show(a).padEnd(12) + " " + show(b).padEnd(12) + " " +
    show(c).padEnd(12) + " " + show(byWalking(n, edges, 0)),
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 31337n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let settleOk = 0;
let relaxOk = 0;
let dialOk = 0;
let tooHigh = 0;
let tooLow = 0;
let settlePops = 0;
let relaxPops = 0;
let settleWorst = 0;
let relaxWorst = 0;
const same = (a: number[], b: number[]): boolean => a.every((x, i) => x === b[i]);
for (let t = 0; t < trials; t += 1) {
  const n = 2 + rand(5);
  const edges: number[][] = [];
  for (let u = 0; u < n; u += 1)
    for (let v = 0; v < n; v += 1)
      if (u !== v && rand(3) === 0) edges.push([u, v, rand(3)]);
  const truth = byWalking(n, edges, 0);
  const [a, pa, wa] = zeroOneSettling(n, edges, 0);
  const [b, pb, wb] = zeroOneRelaxing(n, edges, 0);
  const [c] = dial(n, edges, 0, 2);
  if (same(a, truth)) settleOk += 1;
  if (same(b, truth)) relaxOk += 1;
  if (same(c, truth)) dialOk += 1;
  settlePops += pa;
  relaxPops += pb;
  if (wa > settleWorst) settleWorst = wa;
  if (wb > relaxWorst) relaxWorst = wb;
  for (let i = 0; i < n; i += 1) {
    if (a[i] > truth[i]) tooHigh += 1;
    if (a[i] < truth[i]) tooLow += 1;
  }
}

console.log();
console.log(\`over \${trials} random graphs with weights 0, 1 and 2:\`);
console.log("  settling deque matched every simple path " + String(settleOk).padStart(6));
console.log("  relaxing deque matched it                " + String(relaxOk).padStart(6));
console.log("  Dial with 3 buckets matched it           " + String(dialOk).padStart(6));
console.log("  entries the settling deque put too high  " + String(tooHigh).padStart(6));
console.log("  entries it put too low                   " + String(tooLow).padStart(6));
console.log("  pops, settling / relaxing                " + String(settlePops).padStart(6) + " " + String(relaxPops).padStart(6));
console.log("  most times one node scanned its edges,");
console.log("    settling / relaxing                    " + String(settleWorst).padStart(6) + " " + String(relaxWorst).padStart(6));

console.log();
console.log("and what the buckets cost against the heap, weights 0 to k:");
console.log("k".padEnd(4) + " " + "nodes".padEnd(7) + " " + "bucket steps".padStart(14) + " " + "heap compares".padStart(14));
for (const maxw of [1, 3, 7, 15]) {
  const side = 40;
  const n = side * side;
  const edges: number[][] = [];
  for (let r = 0; r < side; r += 1)
    for (let c = 0; c < side; c += 1) {
      const here = r * side + c;
      if (c + 1 < side) edges.push([here, here + 1, (r + c) % (maxw + 1)]);
      if (r + 1 < side) edges.push([here, here + side, (r * 2 + c) % (maxw + 1)]);
    }
  const [, steps] = dial(n, edges, 0, maxw);
  const [, compares] = dijkstra(n, edges, 0);
  console.log(
    String(maxw).padEnd(4) + " " + String(n).padEnd(7) + " " +
    String(steps).padStart(14) + " " + String(compares).padStart(14),
  );
}

console.log();
console.log("Row one of the table is the smallest failure, and it is three nodes: a 2");
console.log("edge to node 1 goes to the back of the deque, where it sits among the");
console.log("nodes at distance 1. Node 1 is popped and declared final at 2, before the");
console.log("free route through node 2 is ever looked at. The truth is 1.");
console.log();
console.log(\`The settling deque got \${settleOk} of \${trials} graphs right, and the \${tooHigh} entries it\`);
console.log("got wrong were all too high, none too low -- the same quiet failure as");
console.log("the wrong Floyd-Warshall loop order.");
console.log();
console.log("The relaxing deque got every graph right. Dropping the settle turns it");
console.log("into Bellman-Ford with an opinionated queue, correct on any non-negative");
console.log("weights. What goes with the settle is the bound. The done array is what");
console.log("stops a node scanning its edges twice, and the counter above says the");
console.log(\`settling version never did: \${settleWorst}, by construction. Relaxing has no such\`);
console.log(\`limit and reached \${relaxWorst} even on graphs this small. The pop totals barely\`);
console.log(\`differ, \${relaxPops} against \${settlePops}, which is exactly why the missing bound is easy\`);
console.log("not to notice until a shape turns up that exploits it.");
console.log();
console.log("Dial keeps both. The deque was two buckets; make it k+1 and every live");
console.log("distance still lands in its own one, because the frontier only ever");
console.log("spans the window from d to d+k. The bucket column barely moves as k");
console.log("grows while the heap keeps paying -- and the first row, k = 1, is 0-1");
console.log("BFS with the front and the back spelled out longhand.");
`,
            },
            {
              lang: "java",
              code: `// The trick breaks the moment a weight is 2, and it breaks two different ways.
//
// The deque works because the frontier holds at most two distinct distances,
// so "front" and "back" are enough to keep it in order. A weight of 2 puts a
// node at d+2 while the back of the deque is d+1, and the queue stops being
// sorted. What happens next depends on which version was written.
//
//   settling  -- pop, declare final, never revisit. Fast, and now wrong.
//   relaxing  -- pop and re-examine every time it improves. Still right, and
//                the O(V + E) bound is gone with it.
//
// The repair is not a different algorithm. A deque is two buckets. Give it
// k+1 buckets indexed by distance modulo k+1 and the same argument works for
// every weight from 0 to k. That is Dial's algorithm, and 0-1 BFS is its k = 1.
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
import java.util.List;

public class Main {
    static final int INF = 1000000000;

    static List<int[]>[] adjacency(int n, int[][] edges) {
        @SuppressWarnings("unchecked")
        List<int[]>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : edges) adj[e[0]].add(new int[] {e[1], e[2]});
        return adj;
    }

    /** The 0-1 rule with Dijkstra's settle: the front of the deque is final. */
    static int[] zeroOneSettling(int n, int[][] edges, int start, int[] stats) {
        List<int[]>[] adj = adjacency(n, edges);
        int[] best = new int[n];
        Arrays.fill(best, INF);
        best[start] = 0;
        boolean[] done = new boolean[n];
        int[] scans = new int[n];
        Deque<Integer> dq = new ArrayDeque<>();
        dq.addLast(start);
        int pops = 0;
        while (!dq.isEmpty()) {
            int at = dq.pollFirst();
            pops++;
            if (done[at]) continue;
            done[at] = true;
            scans[at]++;
            for (int[] step : adj[at]) {
                if (!done[step[0]] && best[at] + step[1] < best[step[0]]) {
                    best[step[0]] = best[at] + step[1];
                    if (step[1] == 0) dq.addFirst(step[0]);
                    else dq.addLast(step[0]);
                }
            }
        }
        stats[0] = pops;
        stats[1] = Arrays.stream(scans).max().getAsInt();
        return best;
    }

    /** The same deque with nothing declared final. Correct, and no longer bounded. */
    static int[] zeroOneRelaxing(int n, int[][] edges, int start, int[] stats) {
        List<int[]>[] adj = adjacency(n, edges);
        int[] best = new int[n];
        Arrays.fill(best, INF);
        best[start] = 0;
        int[] scans = new int[n];
        Deque<Integer> dq = new ArrayDeque<>();
        dq.addLast(start);
        int pops = 0;
        while (!dq.isEmpty()) {
            int at = dq.pollFirst();
            pops++;
            scans[at]++;
            for (int[] step : adj[at]) {
                if (best[at] + step[1] < best[step[0]]) {
                    best[step[0]] = best[at] + step[1];
                    if (step[1] == 0) dq.addFirst(step[0]);
                    else dq.addLast(step[0]);
                }
            }
        }
        stats[0] = pops;
        stats[1] = Arrays.stream(scans).max().getAsInt();
        return best;
    }

    /**
     * Dial's algorithm: k+1 buckets, indexed by distance modulo k+1.
     *
     * <p>Every live distance sits in the window [d, d + maxw], which is exactly
     * maxw + 1 values, so two live distances never share a bucket. Set maxw to 1
     * and this is the deque again, with the front and the back written out.
     */
    static int[] dial(int n, int[][] edges, int start, int maxw, long[] stats) {
        List<int[]>[] adj = adjacency(n, edges);
        int width = maxw + 1;
        List<List<Integer>> buckets = new ArrayList<>();
        for (int i = 0; i < width; i++) buckets.add(new ArrayList<>());
        int[] best = new int[n];
        Arrays.fill(best, INF);
        best[start] = 0;
        buckets.get(0).add(start);
        int waiting = 1;
        int d = 0;
        long steps = 0;
        while (waiting > 0) {
            while (buckets.get(d % width).isEmpty()) {
                d++;
                steps++;
            }
            List<Integer> bucket = buckets.get(d % width);
            int at = bucket.remove(bucket.size() - 1);
            waiting--;
            steps++;
            if (best[at] != d) continue;
            for (int[] step : adj[at]) {
                if (d + step[1] < best[step[0]]) {
                    best[step[0]] = d + step[1];
                    buckets.get((d + step[1]) % width).add(step[0]);
                    waiting++;
                    steps++;
                }
            }
        }
        stats[0] = steps;
        return best;
    }

    /** The reference, and the comparisons its heap costs. */
    static int[] dijkstra(int n, int[][] edges, int start, long[] stats) {
        List<int[]>[] adj = adjacency(n, edges);
        int[] best = new int[n];
        Arrays.fill(best, INF);
        best[start] = 0;
        boolean[] done = new boolean[n];
        List<int[]> heap = new ArrayList<>();
        heap.add(new int[] {0, start});
        long[] compares = new long[1];

        while (!heap.isEmpty()) {
            int[] top = heapPop(heap, compares);
            int cost = top[0], at = top[1];
            if (done[at]) continue;
            done[at] = true;
            for (int[] step : adj[at]) {
                if (!done[step[0]] && cost + step[1] < best[step[0]]) {
                    best[step[0]] = cost + step[1];
                    heapPush(heap, new int[] {cost + step[1], step[0]}, compares);
                }
            }
        }
        stats[0] = compares[0];
        return best;
    }

    static boolean before(int[] a, int[] b) {
        return a[0] < b[0] || (a[0] == b[0] && a[1] < b[1]);
    }

    static void heapPush(List<int[]> heap, int[] item, long[] compares) {
        heap.add(item);
        int i = heap.size() - 1;
        while (i > 0) {
            int parent = (i - 1) / 2;
            compares[0]++;
            if (!before(heap.get(i), heap.get(parent))) break;
            int[] tmp = heap.get(i);
            heap.set(i, heap.get(parent));
            heap.set(parent, tmp);
            i = parent;
        }
    }

    static int[] heapPop(List<int[]> heap, long[] compares) {
        int[] top = heap.get(0);
        int[] last = heap.remove(heap.size() - 1);
        if (!heap.isEmpty()) {
            heap.set(0, last);
            int i = 0;
            while (true) {
                int small = i;
                for (int c : new int[] {2 * i + 1, 2 * i + 2}) {
                    if (c < heap.size()) {
                        compares[0]++;
                        if (before(heap.get(c), heap.get(small))) small = c;
                    }
                }
                if (small == i) break;
                int[] tmp = heap.get(i);
                heap.set(i, heap.get(small));
                heap.set(small, tmp);
                i = small;
            }
        }
        return top;
    }

    static void walk(List<int[]>[] adj, boolean[] seen, int[] out, int at, int cost) {
        seen[at] = true;
        for (int[] step : adj[at]) {
            if (!seen[step[0]]) {
                if (cost + step[1] < out[step[0]]) out[step[0]] = cost + step[1];
                walk(adj, seen, out, step[0], cost + step[1]);
            }
        }
        seen[at] = false;
    }

    /** The cheapest simple path from start to everywhere. The definition. */
    static int[] byWalking(int n, int[][] edges, int start) {
        int[] out = new int[n];
        Arrays.fill(out, INF);
        out[start] = 0;
        walk(adjacency(n, edges), new boolean[n], out, start, 0);
        return out;
    }

    static String show(int[] row) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < row.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(row[i] >= INF ? "-" : String.valueOf(row[i]));
        }
        return sb.append("]").toString();
    }

    static String label(int[][] edges) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < edges.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(edges[i][0]).append("-").append(edges[i][1]).append(":").append(edges[i][2]);
        }
        return sb.append("]").toString();
    }

    // The same linear congruential generator in every language, so the random
    // graphs below are the same graphs whichever translation is run.
    static long seed = 31337L;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    public static void main(String[] args) {
        int[] caseN = {3, 4, 4};
        int[][][] caseEdges = {
            {{0, 1, 2}, {0, 2, 1}, {2, 1, 0}},
            {{0, 1, 2}, {0, 2, 1}, {2, 3, 0}, {3, 1, 0}},
            {{0, 1, 1}, {1, 2, 2}, {0, 3, 2}, {3, 2, 1}},
        };

        System.out.printf("%-38s %-12s %-12s %-12s %s%n",
            "edges", "settling", "relaxing", "Dial k=2", "truth");
        for (int c = 0; c < caseN.length; c++) {
            int[] a = zeroOneSettling(caseN[c], caseEdges[c], 0, new int[2]);
            int[] b = zeroOneRelaxing(caseN[c], caseEdges[c], 0, new int[2]);
            int[] d = dial(caseN[c], caseEdges[c], 0, 2, new long[1]);
            System.out.printf("%-38s %-12s %-12s %-12s %s%n", label(caseEdges[c]),
                show(a), show(b), show(d), show(byWalking(caseN[c], caseEdges[c], 0)));
        }

        int trials = 3000;
        int settleOk = 0, relaxOk = 0, dialOk = 0, tooHigh = 0, tooLow = 0;
        long settlePops = 0, relaxPops = 0;
        int settleWorst = 0, relaxWorst = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(5);
            List<int[]> built = new ArrayList<>();
            for (int u = 0; u < n; u++)
                for (int v = 0; v < n; v++)
                    if (u != v && rand(3) == 0) built.add(new int[] {u, v, rand(3)});
            int[][] edges = built.toArray(new int[0][]);
            int[] truth = byWalking(n, edges, 0);
            int[] sa = new int[2];
            int[] sb = new int[2];
            int[] a = zeroOneSettling(n, edges, 0, sa);
            int[] b = zeroOneRelaxing(n, edges, 0, sb);
            int[] c = dial(n, edges, 0, 2, new long[1]);
            if (Arrays.equals(a, truth)) settleOk++;
            if (Arrays.equals(b, truth)) relaxOk++;
            if (Arrays.equals(c, truth)) dialOk++;
            settlePops += sa[0];
            relaxPops += sb[0];
            if (sa[1] > settleWorst) settleWorst = sa[1];
            if (sb[1] > relaxWorst) relaxWorst = sb[1];
            for (int i = 0; i < n; i++) {
                if (a[i] > truth[i]) tooHigh++;
                if (a[i] < truth[i]) tooLow++;
            }
        }

        System.out.println();
        System.out.println("over " + trials + " random graphs with weights 0, 1 and 2:");
        System.out.printf("  settling deque matched every simple path %6d%n", settleOk);
        System.out.printf("  relaxing deque matched it                %6d%n", relaxOk);
        System.out.printf("  Dial with 3 buckets matched it           %6d%n", dialOk);
        System.out.printf("  entries the settling deque put too high  %6d%n", tooHigh);
        System.out.printf("  entries it put too low                   %6d%n", tooLow);
        System.out.printf("  pops, settling / relaxing                %6d %6d%n", settlePops, relaxPops);
        System.out.println("  most times one node scanned its edges,");
        System.out.printf("    settling / relaxing                    %6d %6d%n", settleWorst, relaxWorst);

        System.out.println();
        System.out.println("and what the buckets cost against the heap, weights 0 to k:");
        System.out.printf("%-4s %-7s %14s %14s%n", "k", "nodes", "bucket steps", "heap compares");
        for (int maxw : new int[] {1, 3, 7, 15}) {
            int side = 40;
            int n = side * side;
            List<int[]> built = new ArrayList<>();
            for (int r = 0; r < side; r++)
                for (int c = 0; c < side; c++) {
                    int here = r * side + c;
                    if (c + 1 < side) built.add(new int[] {here, here + 1, (r + c) % (maxw + 1)});
                    if (r + 1 < side)
                        built.add(new int[] {here, here + side, (r * 2 + c) % (maxw + 1)});
                }
            int[][] edges = built.toArray(new int[0][]);
            long[] steps = new long[1];
            long[] compares = new long[1];
            dial(n, edges, 0, maxw, steps);
            dijkstra(n, edges, 0, compares);
            System.out.printf("%-4d %-7d %14d %14d%n", maxw, n, steps[0], compares[0]);
        }

        System.out.println();
        System.out.println("Row one of the table is the smallest failure, and it is three nodes: a 2");
        System.out.println("edge to node 1 goes to the back of the deque, where it sits among the");
        System.out.println("nodes at distance 1. Node 1 is popped and declared final at 2, before the");
        System.out.println("free route through node 2 is ever looked at. The truth is 1.");
        System.out.println();
        System.out.println("The settling deque got " + settleOk + " of " + trials
            + " graphs right, and the " + tooHigh + " entries it");
        System.out.println("got wrong were all too high, none too low -- the same quiet failure as");
        System.out.println("the wrong Floyd-Warshall loop order.");
        System.out.println();
        System.out.println("The relaxing deque got every graph right. Dropping the settle turns it");
        System.out.println("into Bellman-Ford with an opinionated queue, correct on any non-negative");
        System.out.println("weights. What goes with the settle is the bound. The done array is what");
        System.out.println("stops a node scanning its edges twice, and the counter above says the");
        System.out.println("settling version never did: " + settleWorst
            + ", by construction. Relaxing has no such");
        System.out.println("limit and reached " + relaxWorst
            + " even on graphs this small. The pop totals barely");
        System.out.println("differ, " + relaxPops + " against " + settlePops
            + ", which is exactly why the missing bound is easy");
        System.out.println("not to notice until a shape turns up that exploits it.");
        System.out.println();
        System.out.println("Dial keeps both. The deque was two buckets; make it k+1 and every live");
        System.out.println("distance still lands in its own one, because the frontier only ever");
        System.out.println("spans the window from d to d+k. The bucket column barely moves as k");
        System.out.println("grows while the heap keeps paying -- and the first row, k = 1, is 0-1");
        System.out.println("BFS with the front and the back spelled out longhand.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The trick breaks the moment a weight is 2, and it breaks two different ways.
//
// The deque works because the frontier holds at most two distinct distances,
// so "front" and "back" are enough to keep it in order. A weight of 2 puts a
// node at d+2 while the back of the deque is d+1, and the queue stops being
// sorted. What happens next depends on which version was written.
//
//   settling  -- pop, declare final, never revisit. Fast, and now wrong.
//   relaxing  -- pop and re-examine every time it improves. Still right, and
//                the O(V + E) bound is gone with it.
//
// The repair is not a different algorithm. A deque is two buckets. Give it
// k+1 buckets indexed by distance modulo k+1 and the same argument works for
// every weight from 0 to k. That is Dial's algorithm, and 0-1 BFS is its k = 1.
#include <algorithm>
#include <array>
#include <deque>
#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

const int INF = 1000000000;

using Edge = std::array<int, 3>;
using Adj = std::vector<std::vector<std::pair<int, int>>>;

Adj adjacency(int n, const std::vector<Edge>& edges) {
    Adj adj(n);
    for (const Edge& e : edges) adj[e[0]].push_back({e[1], e[2]});
    return adj;
}

// The 0-1 rule with Dijkstra's settle: the front of the deque is final.
std::vector<int> zero_one_settling(int n, const std::vector<Edge>& edges, int start,
                                   long long& pops, int& worst) {
    Adj adj = adjacency(n, edges);
    std::vector<int> best(n, INF);
    best[start] = 0;
    std::vector<bool> done(n, false);
    std::vector<int> scans(n, 0);
    std::deque<int> dq = {start};
    pops = 0;
    while (!dq.empty()) {
        int at = dq.front();
        dq.pop_front();
        pops++;
        if (done[at]) continue;
        done[at] = true;
        scans[at]++;
        for (const auto& step : adj[at]) {
            if (!done[step.first] && best[at] + step.second < best[step.first]) {
                best[step.first] = best[at] + step.second;
                if (step.second == 0) dq.push_front(step.first);
                else dq.push_back(step.first);
            }
        }
    }
    worst = *std::max_element(scans.begin(), scans.end());
    return best;
}

// The same deque with nothing declared final. Correct, and no longer bounded.
std::vector<int> zero_one_relaxing(int n, const std::vector<Edge>& edges, int start,
                                   long long& pops, int& worst) {
    Adj adj = adjacency(n, edges);
    std::vector<int> best(n, INF);
    best[start] = 0;
    std::vector<int> scans(n, 0);
    std::deque<int> dq = {start};
    pops = 0;
    while (!dq.empty()) {
        int at = dq.front();
        dq.pop_front();
        pops++;
        scans[at]++;
        for (const auto& step : adj[at]) {
            if (best[at] + step.second < best[step.first]) {
                best[step.first] = best[at] + step.second;
                if (step.second == 0) dq.push_front(step.first);
                else dq.push_back(step.first);
            }
        }
    }
    worst = *std::max_element(scans.begin(), scans.end());
    return best;
}

// Dial's algorithm: k+1 buckets, indexed by distance modulo k+1.
//
// Every live distance sits in the window [d, d + maxw], which is exactly
// maxw + 1 values, so two live distances never share a bucket. Set maxw to 1
// and this is the deque again, with the front and the back written out.
std::vector<int> dial(int n, const std::vector<Edge>& edges, int start, int maxw,
                      long long& steps) {
    Adj adj = adjacency(n, edges);
    int width = maxw + 1;
    std::vector<std::vector<int>> buckets(width);
    std::vector<int> best(n, INF);
    best[start] = 0;
    buckets[0].push_back(start);
    int waiting = 1;
    int d = 0;
    steps = 0;
    while (waiting > 0) {
        while (buckets[d % width].empty()) {
            d++;
            steps++;
        }
        int at = buckets[d % width].back();
        buckets[d % width].pop_back();
        waiting--;
        steps++;
        if (best[at] != d) continue;
        for (const auto& step : adj[at]) {
            if (d + step.second < best[step.first]) {
                best[step.first] = d + step.second;
                buckets[(d + step.second) % width].push_back(step.first);
                waiting++;
                steps++;
            }
        }
    }
    return best;
}

bool before(const std::pair<int, int>& a, const std::pair<int, int>& b) {
    return a.first < b.first || (a.first == b.first && a.second < b.second);
}

// The reference, and the comparisons its heap costs.
std::vector<int> dijkstra(int n, const std::vector<Edge>& edges, int start,
                          long long& compares) {
    Adj adj = adjacency(n, edges);
    std::vector<int> best(n, INF);
    best[start] = 0;
    std::vector<bool> done(n, false);
    std::vector<std::pair<int, int>> heap = {{0, start}};
    compares = 0;

    auto push = [&](std::pair<int, int> item) {
        heap.push_back(item);
        size_t i = heap.size() - 1;
        while (i > 0) {
            size_t parent = (i - 1) / 2;
            compares++;
            if (!before(heap[i], heap[parent])) break;
            std::swap(heap[i], heap[parent]);
            i = parent;
        }
    };

    auto pop = [&]() {
        std::pair<int, int> top = heap[0];
        std::pair<int, int> last = heap.back();
        heap.pop_back();
        if (!heap.empty()) {
            heap[0] = last;
            size_t i = 0;
            for (;;) {
                size_t small = i;
                for (size_t c : {2 * i + 1, 2 * i + 2}) {
                    if (c < heap.size()) {
                        compares++;
                        if (before(heap[c], heap[small])) small = c;
                    }
                }
                if (small == i) break;
                std::swap(heap[i], heap[small]);
                i = small;
            }
        }
        return top;
    };

    while (!heap.empty()) {
        std::pair<int, int> top = pop();
        int cost = top.first, at = top.second;
        if (done[at]) continue;
        done[at] = true;
        for (const auto& step : adj[at]) {
            if (!done[step.first] && cost + step.second < best[step.first]) {
                best[step.first] = cost + step.second;
                push({cost + step.second, step.first});
            }
        }
    }
    return best;
}

void walk(const Adj& adj, std::vector<bool>& seen, std::vector<int>& out, int at, int cost) {
    seen[at] = true;
    for (const auto& step : adj[at]) {
        if (!seen[step.first]) {
            if (cost + step.second < out[step.first]) out[step.first] = cost + step.second;
            walk(adj, seen, out, step.first, cost + step.second);
        }
    }
    seen[at] = false;
}

// The cheapest simple path from start to everywhere. The definition.
std::vector<int> by_walking(int n, const std::vector<Edge>& edges, int start) {
    std::vector<int> out(n, INF);
    out[start] = 0;
    Adj adj = adjacency(n, edges);
    std::vector<bool> seen(n, false);
    walk(adj, seen, out, start, 0);
    return out;
}

std::string show(const std::vector<int>& row) {
    std::string s = "[";
    for (size_t i = 0; i < row.size(); i++) {
        if (i > 0) s += ", ";
        s += row[i] >= INF ? "-" : std::to_string(row[i]);
    }
    return s + "]";
}

std::string label(const std::vector<Edge>& edges) {
    std::string s = "[";
    for (size_t i = 0; i < edges.size(); i++) {
        if (i > 0) s += ", ";
        s += std::to_string(edges[i][0]) + "-" + std::to_string(edges[i][1]) + ":" +
             std::to_string(edges[i][2]);
    }
    return s + "]";
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
long long seed = 31337;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

int main() {
    std::vector<int> case_n = {3, 4, 4};
    std::vector<std::vector<Edge>> cases = {
        {{0, 1, 2}, {0, 2, 1}, {2, 1, 0}},
        {{0, 1, 2}, {0, 2, 1}, {2, 3, 0}, {3, 1, 0}},
        {{0, 1, 1}, {1, 2, 2}, {0, 3, 2}, {3, 2, 1}},
    };

    std::cout << std::left << std::setw(38) << "edges" << " " << std::setw(12) << "settling"
              << " " << std::setw(12) << "relaxing" << " " << std::setw(12) << "Dial k=2"
              << " " << "truth" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        long long pops = 0, steps = 0;
        int worst = 0;
        std::vector<int> a = zero_one_settling(case_n[c], cases[c], 0, pops, worst);
        std::vector<int> b = zero_one_relaxing(case_n[c], cases[c], 0, pops, worst);
        std::vector<int> d = dial(case_n[c], cases[c], 0, 2, steps);
        std::cout << std::left << std::setw(38) << label(cases[c]) << " " << std::setw(12)
                  << show(a) << " " << std::setw(12) << show(b) << " " << std::setw(12)
                  << show(d) << " " << show(by_walking(case_n[c], cases[c], 0)) << "\\n";
    }

    int trials = 3000;
    int settle_ok = 0, relax_ok = 0, dial_ok = 0, too_high = 0, too_low = 0;
    long long settle_pops = 0, relax_pops = 0;
    int settle_worst = 0, relax_worst = 0;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(5);
        std::vector<Edge> edges;
        for (int u = 0; u < n; u++)
            for (int v = 0; v < n; v++)
                if (u != v && rand_below(3) == 0) edges.push_back({u, v, rand_below(3)});
        std::vector<int> truth = by_walking(n, edges, 0);
        long long pa = 0, pb = 0, steps = 0;
        int wa = 0, wb = 0;
        std::vector<int> a = zero_one_settling(n, edges, 0, pa, wa);
        std::vector<int> b = zero_one_relaxing(n, edges, 0, pb, wb);
        std::vector<int> c = dial(n, edges, 0, 2, steps);
        if (a == truth) settle_ok++;
        if (b == truth) relax_ok++;
        if (c == truth) dial_ok++;
        settle_pops += pa;
        relax_pops += pb;
        if (wa > settle_worst) settle_worst = wa;
        if (wb > relax_worst) relax_worst = wb;
        for (int i = 0; i < n; i++) {
            if (a[i] > truth[i]) too_high++;
            if (a[i] < truth[i]) too_low++;
        }
    }

    std::cout << "\\n";
    std::cout << "over " << trials << " random graphs with weights 0, 1 and 2:\\n";
    std::cout << std::right;
    std::cout << "  settling deque matched every simple path " << std::setw(6) << settle_ok << "\\n";
    std::cout << "  relaxing deque matched it                " << std::setw(6) << relax_ok << "\\n";
    std::cout << "  Dial with 3 buckets matched it           " << std::setw(6) << dial_ok << "\\n";
    std::cout << "  entries the settling deque put too high  " << std::setw(6) << too_high << "\\n";
    std::cout << "  entries it put too low                   " << std::setw(6) << too_low << "\\n";
    std::cout << "  pops, settling / relaxing                " << std::setw(6) << settle_pops
              << " " << std::setw(6) << relax_pops << "\\n";
    std::cout << "  most times one node scanned its edges,\\n";
    std::cout << "    settling / relaxing                    " << std::setw(6) << settle_worst
              << " " << std::setw(6) << relax_worst << "\\n";

    std::cout << "\\n";
    std::cout << "and what the buckets cost against the heap, weights 0 to k:\\n";
    std::cout << std::left << std::setw(4) << "k" << " " << std::setw(7) << "nodes" << " "
              << std::right << std::setw(14) << "bucket steps" << " " << std::setw(14)
              << "heap compares" << "\\n";
    for (int maxw : {1, 3, 7, 15}) {
        int side = 40;
        int n = side * side;
        std::vector<Edge> edges;
        for (int r = 0; r < side; r++)
            for (int c = 0; c < side; c++) {
                int here = r * side + c;
                if (c + 1 < side) edges.push_back({here, here + 1, (r + c) % (maxw + 1)});
                if (r + 1 < side)
                    edges.push_back({here, here + side, (r * 2 + c) % (maxw + 1)});
            }
        long long steps = 0, compares = 0;
        dial(n, edges, 0, maxw, steps);
        dijkstra(n, edges, 0, compares);
        std::cout << std::left << std::setw(4) << maxw << " " << std::setw(7) << n << " "
                  << std::right << std::setw(14) << steps << " " << std::setw(14) << compares
                  << "\\n";
    }

    std::cout << "\\n";
    std::cout << "Row one of the table is the smallest failure, and it is three nodes: a 2\\n";
    std::cout << "edge to node 1 goes to the back of the deque, where it sits among the\\n";
    std::cout << "nodes at distance 1. Node 1 is popped and declared final at 2, before the\\n";
    std::cout << "free route through node 2 is ever looked at. The truth is 1.\\n";
    std::cout << "\\n";
    std::cout << "The settling deque got " << settle_ok << " of " << trials
              << " graphs right, and the " << too_high << " entries it\\n";
    std::cout << "got wrong were all too high, none too low -- the same quiet failure as\\n";
    std::cout << "the wrong Floyd-Warshall loop order.\\n";
    std::cout << "\\n";
    std::cout << "The relaxing deque got every graph right. Dropping the settle turns it\\n";
    std::cout << "into Bellman-Ford with an opinionated queue, correct on any non-negative\\n";
    std::cout << "weights. What goes with the settle is the bound. The done array is what\\n";
    std::cout << "stops a node scanning its edges twice, and the counter above says the\\n";
    std::cout << "settling version never did: " << settle_worst
              << ", by construction. Relaxing has no such\\n";
    std::cout << "limit and reached " << relax_worst
              << " even on graphs this small. The pop totals barely\\n";
    std::cout << "differ, " << relax_pops << " against " << settle_pops
              << ", which is exactly why the missing bound is easy\\n";
    std::cout << "not to notice until a shape turns up that exploits it.\\n";
    std::cout << "\\n";
    std::cout << "Dial keeps both. The deque was two buckets; make it k+1 and every live\\n";
    std::cout << "distance still lands in its own one, because the frontier only ever\\n";
    std::cout << "spans the window from d to d+k. The bucket column barely moves as k\\n";
    std::cout << "grows while the heap keeps paying -- and the first row, k = 1, is 0-1\\n";
    std::cout << "BFS with the front and the back spelled out longhand.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// The trick breaks the moment a weight is 2, and it breaks two different ways.
//
// The deque works because the frontier holds at most two distinct distances,
// so "front" and "back" are enough to keep it in order. A weight of 2 puts a
// node at d+2 while the back of the deque is d+1, and the queue stops being
// sorted. What happens next depends on which version was written.
//
//   settling  -- pop, declare final, never revisit. Fast, and now wrong.
//   relaxing  -- pop and re-examine every time it improves. Still right, and
//                the O(V + E) bound is gone with it.
//
// The repair is not a different algorithm. A deque is two buckets. Give it
// k+1 buckets indexed by distance modulo k+1 and the same argument works for
// every weight from 0 to k. That is Dial's algorithm, and 0-1 BFS is its k = 1.
use std::collections::VecDeque;

const INF: i64 = 1_000_000_000;

type Edge = (usize, usize, i64);
type Adj = Vec<Vec<(usize, i64)>>;

fn adjacency(n: usize, edges: &[Edge]) -> Adj {
    let mut adj: Adj = vec![Vec::new(); n];
    for &(u, v, w) in edges {
        adj[u].push((v, w));
    }
    adj
}

/// The 0-1 rule with Dijkstra's settle: the front of the deque is final.
fn zero_one_settling(n: usize, edges: &[Edge], start: usize) -> (Vec<i64>, u64, u32) {
    let adj = adjacency(n, edges);
    let mut best = vec![INF; n];
    best[start] = 0;
    let mut done = vec![false; n];
    let mut scans = vec![0u32; n];
    let mut dq: VecDeque<usize> = VecDeque::new();
    dq.push_back(start);
    let mut pops: u64 = 0;
    while let Some(at) = dq.pop_front() {
        pops += 1;
        if done[at] {
            continue;
        }
        done[at] = true;
        scans[at] += 1;
        for idx in 0..adj[at].len() {
            let (nxt, w) = adj[at][idx];
            if !done[nxt] && best[at] + w < best[nxt] {
                best[nxt] = best[at] + w;
                if w == 0 {
                    dq.push_front(nxt);
                } else {
                    dq.push_back(nxt);
                }
            }
        }
    }
    let worst = *scans.iter().max().unwrap();
    (best, pops, worst)
}

/// The same deque with nothing declared final. Correct, and no longer bounded.
fn zero_one_relaxing(n: usize, edges: &[Edge], start: usize) -> (Vec<i64>, u64, u32) {
    let adj = adjacency(n, edges);
    let mut best = vec![INF; n];
    best[start] = 0;
    let mut scans = vec![0u32; n];
    let mut dq: VecDeque<usize> = VecDeque::new();
    dq.push_back(start);
    let mut pops: u64 = 0;
    while let Some(at) = dq.pop_front() {
        pops += 1;
        scans[at] += 1;
        for idx in 0..adj[at].len() {
            let (nxt, w) = adj[at][idx];
            if best[at] + w < best[nxt] {
                best[nxt] = best[at] + w;
                if w == 0 {
                    dq.push_front(nxt);
                } else {
                    dq.push_back(nxt);
                }
            }
        }
    }
    let worst = *scans.iter().max().unwrap();
    (best, pops, worst)
}

/// Dial's algorithm: k+1 buckets, indexed by distance modulo k+1.
///
/// Every live distance sits in the window [d, d + maxw], which is exactly
/// maxw + 1 values, so two live distances never share a bucket. Set maxw to 1
/// and this is the deque again, with the front and the back written out.
fn dial(n: usize, edges: &[Edge], start: usize, maxw: i64) -> (Vec<i64>, u64) {
    let adj = adjacency(n, edges);
    let width = (maxw + 1) as usize;
    let mut buckets: Vec<Vec<usize>> = vec![Vec::new(); width];
    let mut best = vec![INF; n];
    best[start] = 0;
    buckets[0].push(start);
    let mut waiting: i64 = 1;
    let mut d: i64 = 0;
    let mut steps: u64 = 0;
    while waiting > 0 {
        while buckets[(d as usize) % width].is_empty() {
            d += 1;
            steps += 1;
        }
        let at = buckets[(d as usize) % width].pop().unwrap();
        waiting -= 1;
        steps += 1;
        if best[at] != d {
            continue;
        }
        for idx in 0..adj[at].len() {
            let (nxt, w) = adj[at][idx];
            if d + w < best[nxt] {
                best[nxt] = d + w;
                buckets[((d + w) as usize) % width].push(nxt);
                waiting += 1;
                steps += 1;
            }
        }
    }
    (best, steps)
}

fn before(a: (i64, usize), b: (i64, usize)) -> bool {
    a.0 < b.0 || (a.0 == b.0 && a.1 < b.1)
}

/// The reference, and the comparisons its heap costs.
fn dijkstra(n: usize, edges: &[Edge], start: usize) -> (Vec<i64>, u64) {
    let adj = adjacency(n, edges);
    let mut best = vec![INF; n];
    best[start] = 0;
    let mut done = vec![false; n];
    let mut heap: Vec<(i64, usize)> = vec![(0, start)];
    let mut compares: u64 = 0;

    while !heap.is_empty() {
        let top = heap[0];
        let last = heap.pop().unwrap();
        if !heap.is_empty() {
            heap[0] = last;
            let mut i = 0;
            loop {
                let mut small = i;
                for c in [2 * i + 1, 2 * i + 2] {
                    if c < heap.len() {
                        compares += 1;
                        if before(heap[c], heap[small]) {
                            small = c;
                        }
                    }
                }
                if small == i {
                    break;
                }
                heap.swap(i, small);
                i = small;
            }
        }
        let (cost, at) = top;
        if done[at] {
            continue;
        }
        done[at] = true;
        for idx in 0..adj[at].len() {
            let (nxt, w) = adj[at][idx];
            if !done[nxt] && cost + w < best[nxt] {
                best[nxt] = cost + w;
                heap.push((cost + w, nxt));
                let mut i = heap.len() - 1;
                while i > 0 {
                    let parent = (i - 1) / 2;
                    compares += 1;
                    if !before(heap[i], heap[parent]) {
                        break;
                    }
                    heap.swap(i, parent);
                    i = parent;
                }
            }
        }
    }
    (best, compares)
}

fn walk(adj: &Adj, seen: &mut [bool], out: &mut [i64], at: usize, cost: i64) {
    seen[at] = true;
    for idx in 0..adj[at].len() {
        let (nxt, w) = adj[at][idx];
        if !seen[nxt] {
            if cost + w < out[nxt] {
                out[nxt] = cost + w;
            }
            walk(adj, seen, out, nxt, cost + w);
        }
    }
    seen[at] = false;
}

/// The cheapest simple path from start to everywhere. The definition.
fn by_walking(n: usize, edges: &[Edge], start: usize) -> Vec<i64> {
    let mut out = vec![INF; n];
    out[start] = 0;
    let adj = adjacency(n, edges);
    let mut seen = vec![false; n];
    walk(&adj, &mut seen, &mut out, start, 0);
    out
}

fn show(row: &[i64]) -> String {
    let cells: Vec<String> = row
        .iter()
        .map(|&x| if x >= INF { "-".to_string() } else { x.to_string() })
        .collect();
    format!("[{}]", cells.join(", "))
}

fn label(edges: &[Edge]) -> String {
    let cells: Vec<String> = edges
        .iter()
        .map(|&(u, v, w)| format!("{}-{}:{}", u, v, w))
        .collect();
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

fn main() {
    let case_n = [3usize, 4, 4];
    let cases: Vec<Vec<Edge>> = vec![
        vec![(0, 1, 2), (0, 2, 1), (2, 1, 0)],
        vec![(0, 1, 2), (0, 2, 1), (2, 3, 0), (3, 1, 0)],
        vec![(0, 1, 1), (1, 2, 2), (0, 3, 2), (3, 2, 1)],
    ];

    println!(
        "{:<38} {:<12} {:<12} {:<12} {}",
        "edges", "settling", "relaxing", "Dial k=2", "truth"
    );
    for c in 0..cases.len() {
        let (a, _, _) = zero_one_settling(case_n[c], &cases[c], 0);
        let (b, _, _) = zero_one_relaxing(case_n[c], &cases[c], 0);
        let (d, _) = dial(case_n[c], &cases[c], 0, 2);
        println!(
            "{:<38} {:<12} {:<12} {:<12} {}",
            label(&cases[c]),
            show(&a),
            show(&b),
            show(&d),
            show(&by_walking(case_n[c], &cases[c], 0))
        );
    }

    let mut rng = Rng { seed: 31337 };
    let trials = 3000;
    let (mut settle_ok, mut relax_ok, mut dial_ok) = (0, 0, 0);
    let (mut too_high, mut too_low) = (0, 0);
    let (mut settle_pops, mut relax_pops): (u64, u64) = (0, 0);
    let (mut settle_worst, mut relax_worst): (u32, u32) = (0, 0);
    for _ in 0..trials {
        let n = 2 + rng.next(5) as usize;
        let mut edges: Vec<Edge> = Vec::new();
        for u in 0..n {
            for v in 0..n {
                if u != v && rng.next(3) == 0 {
                    edges.push((u, v, rng.next(3)));
                }
            }
        }
        let truth = by_walking(n, &edges, 0);
        let (a, pa, wa) = zero_one_settling(n, &edges, 0);
        let (b, pb, wb) = zero_one_relaxing(n, &edges, 0);
        let (c, _) = dial(n, &edges, 0, 2);
        if a == truth {
            settle_ok += 1;
        }
        if b == truth {
            relax_ok += 1;
        }
        if c == truth {
            dial_ok += 1;
        }
        settle_pops += pa;
        relax_pops += pb;
        if wa > settle_worst {
            settle_worst = wa;
        }
        if wb > relax_worst {
            relax_worst = wb;
        }
        for i in 0..n {
            if a[i] > truth[i] {
                too_high += 1;
            }
            if a[i] < truth[i] {
                too_low += 1;
            }
        }
    }

    println!();
    println!("over {} random graphs with weights 0, 1 and 2:", trials);
    println!("  settling deque matched every simple path {:>6}", settle_ok);
    println!("  relaxing deque matched it                {:>6}", relax_ok);
    println!("  Dial with 3 buckets matched it           {:>6}", dial_ok);
    println!("  entries the settling deque put too high  {:>6}", too_high);
    println!("  entries it put too low                   {:>6}", too_low);
    println!(
        "  pops, settling / relaxing                {:>6} {:>6}",
        settle_pops, relax_pops
    );
    println!("  most times one node scanned its edges,");
    println!(
        "    settling / relaxing                    {:>6} {:>6}",
        settle_worst, relax_worst
    );

    println!();
    println!("and what the buckets cost against the heap, weights 0 to k:");
    println!("{:<4} {:<7} {:>14} {:>14}", "k", "nodes", "bucket steps", "heap compares");
    for &maxw in &[1i64, 3, 7, 15] {
        let side = 40usize;
        let n = side * side;
        let mut edges: Vec<Edge> = Vec::new();
        for r in 0..side {
            for c in 0..side {
                let here = r * side + c;
                if c + 1 < side {
                    edges.push((here, here + 1, ((r + c) as i64) % (maxw + 1)));
                }
                if r + 1 < side {
                    edges.push((here, here + side, ((r * 2 + c) as i64) % (maxw + 1)));
                }
            }
        }
        let (_, steps) = dial(n, &edges, 0, maxw);
        let (_, compares) = dijkstra(n, &edges, 0);
        println!("{:<4} {:<7} {:>14} {:>14}", maxw, n, steps, compares);
    }

    println!();
    println!("Row one of the table is the smallest failure, and it is three nodes: a 2");
    println!("edge to node 1 goes to the back of the deque, where it sits among the");
    println!("nodes at distance 1. Node 1 is popped and declared final at 2, before the");
    println!("free route through node 2 is ever looked at. The truth is 1.");
    println!();
    println!(
        "The settling deque got {} of {} graphs right, and the {} entries it",
        settle_ok, trials, too_high
    );
    println!("got wrong were all too high, none too low -- the same quiet failure as");
    println!("the wrong Floyd-Warshall loop order.");
    println!();
    println!("The relaxing deque got every graph right. Dropping the settle turns it");
    println!("into Bellman-Ford with an opinionated queue, correct on any non-negative");
    println!("weights. What goes with the settle is the bound. The done array is what");
    println!("stops a node scanning its edges twice, and the counter above says the");
    println!(
        "settling version never did: {}, by construction. Relaxing has no such",
        settle_worst
    );
    println!(
        "limit and reached {} even on graphs this small. The pop totals barely",
        relax_worst
    );
    println!(
        "differ, {} against {}, which is exactly why the missing bound is easy",
        relax_pops, settle_pops
    );
    println!("not to notice until a shape turns up that exploits it.");
    println!();
    println!("Dial keeps both. The deque was two buckets; make it k+1 and every live");
    println!("distance still lands in its own one, because the frontier only ever");
    println!("spans the window from d to d+k. The bucket column barely moves as k");
    println!("grows while the heap keeps paying -- and the first row, k = 1, is 0-1");
    println!("BFS with the front and the back spelled out longhand.");
}
`,
            },
            {
              lang: "go",
              code: `// The trick breaks the moment a weight is 2, and it breaks two different ways.
//
// The deque works because the frontier holds at most two distinct distances,
// so "front" and "back" are enough to keep it in order. A weight of 2 puts a
// node at d+2 while the back of the deque is d+1, and the queue stops being
// sorted. What happens next depends on which version was written.
//
//	settling  -- pop, declare final, never revisit. Fast, and now wrong.
//	relaxing  -- pop and re-examine every time it improves. Still right, and
//	             the O(V + E) bound is gone with it.
//
// The repair is not a different algorithm. A deque is two buckets. Give it
// k+1 buckets indexed by distance modulo k+1 and the same argument works for
// every weight from 0 to k. That is Dial's algorithm, and 0-1 BFS is its k = 1.
package main

import (
	"fmt"
	"strings"
)

const INF = 1000000000

// Edge is a directed edge with a weight.
type Edge struct {
	U, V, W int
}

func adjacency(n int, edges []Edge) [][][2]int {
	adj := make([][][2]int, n)
	for _, e := range edges {
		adj[e.U] = append(adj[e.U], [2]int{e.V, e.W})
	}
	return adj
}

func maxOf(xs []int) int {
	best := xs[0]
	for _, x := range xs {
		if x > best {
			best = x
		}
	}
	return best
}

// zeroOneSettling is the 0-1 rule with Dijkstra's settle: the front is final.
func zeroOneSettling(n int, edges []Edge, start int) ([]int, int64, int) {
	adj := adjacency(n, edges)
	best := make([]int, n)
	for i := range best {
		best[i] = INF
	}
	best[start] = 0
	done := make([]bool, n)
	scans := make([]int, n)
	dq := []int{start}
	var pops int64
	for len(dq) > 0 {
		at := dq[0]
		dq = dq[1:]
		pops++
		if done[at] {
			continue
		}
		done[at] = true
		scans[at]++
		for _, step := range adj[at] {
			if !done[step[0]] && best[at]+step[1] < best[step[0]] {
				best[step[0]] = best[at] + step[1]
				if step[1] == 0 {
					dq = append([]int{step[0]}, dq...)
				} else {
					dq = append(dq, step[0])
				}
			}
		}
	}
	return best, pops, maxOf(scans)
}

// zeroOneRelaxing is the same deque with nothing declared final. Correct, and
// no longer bounded.
func zeroOneRelaxing(n int, edges []Edge, start int) ([]int, int64, int) {
	adj := adjacency(n, edges)
	best := make([]int, n)
	for i := range best {
		best[i] = INF
	}
	best[start] = 0
	scans := make([]int, n)
	dq := []int{start}
	var pops int64
	for len(dq) > 0 {
		at := dq[0]
		dq = dq[1:]
		pops++
		scans[at]++
		for _, step := range adj[at] {
			if best[at]+step[1] < best[step[0]] {
				best[step[0]] = best[at] + step[1]
				if step[1] == 0 {
					dq = append([]int{step[0]}, dq...)
				} else {
					dq = append(dq, step[0])
				}
			}
		}
	}
	return best, pops, maxOf(scans)
}

// dial is Dial's algorithm: k+1 buckets, indexed by distance modulo k+1.
//
// Every live distance sits in the window [d, d + maxw], which is exactly
// maxw + 1 values, so two live distances never share a bucket. Set maxw to 1
// and this is the deque again, with the front and the back written out.
func dial(n int, edges []Edge, start, maxw int) ([]int, int64) {
	adj := adjacency(n, edges)
	width := maxw + 1
	buckets := make([][]int, width)
	best := make([]int, n)
	for i := range best {
		best[i] = INF
	}
	best[start] = 0
	buckets[0] = append(buckets[0], start)
	waiting := 1
	d := 0
	var steps int64
	for waiting > 0 {
		for len(buckets[d%width]) == 0 {
			d++
			steps++
		}
		bucket := buckets[d%width]
		at := bucket[len(bucket)-1]
		buckets[d%width] = bucket[:len(bucket)-1]
		waiting--
		steps++
		if best[at] != d {
			continue
		}
		for _, step := range adj[at] {
			if d+step[1] < best[step[0]] {
				best[step[0]] = d + step[1]
				idx := (d + step[1]) % width
				buckets[idx] = append(buckets[idx], step[0])
				waiting++
				steps++
			}
		}
	}
	return best, steps
}

func before(a, b [2]int) bool {
	return a[0] < b[0] || (a[0] == b[0] && a[1] < b[1])
}

// dijkstra is the reference, and the comparisons its heap costs.
func dijkstra(n int, edges []Edge, start int) ([]int, int64) {
	adj := adjacency(n, edges)
	best := make([]int, n)
	for i := range best {
		best[i] = INF
	}
	best[start] = 0
	done := make([]bool, n)
	heap := [][2]int{{0, start}}
	var compares int64

	push := func(item [2]int) {
		heap = append(heap, item)
		i := len(heap) - 1
		for i > 0 {
			parent := (i - 1) / 2
			compares++
			if !before(heap[i], heap[parent]) {
				break
			}
			heap[i], heap[parent] = heap[parent], heap[i]
			i = parent
		}
	}

	pop := func() [2]int {
		top := heap[0]
		last := heap[len(heap)-1]
		heap = heap[:len(heap)-1]
		if len(heap) > 0 {
			heap[0] = last
			i := 0
			for {
				small := i
				for _, c := range []int{2*i + 1, 2*i + 2} {
					if c < len(heap) {
						compares++
						if before(heap[c], heap[small]) {
							small = c
						}
					}
				}
				if small == i {
					break
				}
				heap[i], heap[small] = heap[small], heap[i]
				i = small
			}
		}
		return top
	}

	for len(heap) > 0 {
		top := pop()
		cost, at := top[0], top[1]
		if done[at] {
			continue
		}
		done[at] = true
		for _, step := range adj[at] {
			if !done[step[0]] && cost+step[1] < best[step[0]] {
				best[step[0]] = cost + step[1]
				push([2]int{cost + step[1], step[0]})
			}
		}
	}
	return best, compares
}

func walk(adj [][][2]int, seen []bool, out []int, at, cost int) {
	seen[at] = true
	for _, step := range adj[at] {
		if !seen[step[0]] {
			if cost+step[1] < out[step[0]] {
				out[step[0]] = cost + step[1]
			}
			walk(adj, seen, out, step[0], cost+step[1])
		}
	}
	seen[at] = false
}

// byWalking gives the cheapest simple path from start to everywhere. The definition.
func byWalking(n int, edges []Edge, start int) []int {
	out := make([]int, n)
	for i := range out {
		out[i] = INF
	}
	out[start] = 0
	walk(adjacency(n, edges), make([]bool, n), out, start, 0)
	return out
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
		if x >= INF {
			cells[i] = "-"
		} else {
			cells[i] = fmt.Sprint(x)
		}
	}
	return "[" + strings.Join(cells, ", ") + "]"
}

func label(edges []Edge) string {
	cells := make([]string, len(edges))
	for i, e := range edges {
		cells[i] = fmt.Sprintf("%d-%d:%d", e.U, e.V, e.W)
	}
	return "[" + strings.Join(cells, ", ") + "]"
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
var seed int64 = 31337

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	caseN := []int{3, 4, 4}
	cases := [][]Edge{
		{{0, 1, 2}, {0, 2, 1}, {2, 1, 0}},
		{{0, 1, 2}, {0, 2, 1}, {2, 3, 0}, {3, 1, 0}},
		{{0, 1, 1}, {1, 2, 2}, {0, 3, 2}, {3, 2, 1}},
	}

	fmt.Printf("%-38s %-12s %-12s %-12s %s\\n",
		"edges", "settling", "relaxing", "Dial k=2", "truth")
	for c := range cases {
		a, _, _ := zeroOneSettling(caseN[c], cases[c], 0)
		b, _, _ := zeroOneRelaxing(caseN[c], cases[c], 0)
		d, _ := dial(caseN[c], cases[c], 0, 2)
		fmt.Printf("%-38s %-12s %-12s %-12s %s\\n", label(cases[c]),
			show(a), show(b), show(d), show(byWalking(caseN[c], cases[c], 0)))
	}

	trials := 3000
	settleOk, relaxOk, dialOk, tooHigh, tooLow := 0, 0, 0, 0, 0
	var settlePops, relaxPops int64
	settleWorst, relaxWorst := 0, 0
	for t := 0; t < trials; t++ {
		n := 2 + randBelow(5)
		var edges []Edge
		for u := 0; u < n; u++ {
			for v := 0; v < n; v++ {
				if u != v && randBelow(3) == 0 {
					edges = append(edges, Edge{u, v, randBelow(3)})
				}
			}
		}
		truth := byWalking(n, edges, 0)
		a, pa, wa := zeroOneSettling(n, edges, 0)
		b, pb, wb := zeroOneRelaxing(n, edges, 0)
		c, _ := dial(n, edges, 0, 2)
		if same(a, truth) {
			settleOk++
		}
		if same(b, truth) {
			relaxOk++
		}
		if same(c, truth) {
			dialOk++
		}
		settlePops += pa
		relaxPops += pb
		if wa > settleWorst {
			settleWorst = wa
		}
		if wb > relaxWorst {
			relaxWorst = wb
		}
		for i := 0; i < n; i++ {
			if a[i] > truth[i] {
				tooHigh++
			}
			if a[i] < truth[i] {
				tooLow++
			}
		}
	}

	fmt.Println()
	fmt.Printf("over %d random graphs with weights 0, 1 and 2:\\n", trials)
	fmt.Printf("  settling deque matched every simple path %6d\\n", settleOk)
	fmt.Printf("  relaxing deque matched it                %6d\\n", relaxOk)
	fmt.Printf("  Dial with 3 buckets matched it           %6d\\n", dialOk)
	fmt.Printf("  entries the settling deque put too high  %6d\\n", tooHigh)
	fmt.Printf("  entries it put too low                   %6d\\n", tooLow)
	fmt.Printf("  pops, settling / relaxing                %6d %6d\\n", settlePops, relaxPops)
	fmt.Println("  most times one node scanned its edges,")
	fmt.Printf("    settling / relaxing                    %6d %6d\\n", settleWorst, relaxWorst)

	fmt.Println()
	fmt.Println("and what the buckets cost against the heap, weights 0 to k:")
	fmt.Printf("%-4s %-7s %14s %14s\\n", "k", "nodes", "bucket steps", "heap compares")
	for _, maxw := range []int{1, 3, 7, 15} {
		side := 40
		n := side * side
		var edges []Edge
		for r := 0; r < side; r++ {
			for c := 0; c < side; c++ {
				here := r*side + c
				if c+1 < side {
					edges = append(edges, Edge{here, here + 1, (r + c) % (maxw + 1)})
				}
				if r+1 < side {
					edges = append(edges, Edge{here, here + side, (r*2 + c) % (maxw + 1)})
				}
			}
		}
		_, steps := dial(n, edges, 0, maxw)
		_, compares := dijkstra(n, edges, 0)
		fmt.Printf("%-4d %-7d %14d %14d\\n", maxw, n, steps, compares)
	}

	fmt.Println()
	fmt.Println("Row one of the table is the smallest failure, and it is three nodes: a 2")
	fmt.Println("edge to node 1 goes to the back of the deque, where it sits among the")
	fmt.Println("nodes at distance 1. Node 1 is popped and declared final at 2, before the")
	fmt.Println("free route through node 2 is ever looked at. The truth is 1.")
	fmt.Println()
	fmt.Printf("The settling deque got %d of %d graphs right, and the %d entries it\\n", settleOk, trials, tooHigh)
	fmt.Println("got wrong were all too high, none too low -- the same quiet failure as")
	fmt.Println("the wrong Floyd-Warshall loop order.")
	fmt.Println()
	fmt.Println("The relaxing deque got every graph right. Dropping the settle turns it")
	fmt.Println("into Bellman-Ford with an opinionated queue, correct on any non-negative")
	fmt.Println("weights. What goes with the settle is the bound. The done array is what")
	fmt.Println("stops a node scanning its edges twice, and the counter above says the")
	fmt.Printf("settling version never did: %d, by construction. Relaxing has no such\\n", settleWorst)
	fmt.Printf("limit and reached %d even on graphs this small. The pop totals barely\\n", relaxWorst)
	fmt.Printf("differ, %d against %d, which is exactly why the missing bound is easy\\n", relaxPops, settlePops)
	fmt.Println("not to notice until a shape turns up that exploits it.")
	fmt.Println()
	fmt.Println("Dial keeps both. The deque was two buckets; make it k+1 and every live")
	fmt.Println("distance still lands in its own one, because the frontier only ever")
	fmt.Println("spans the window from d to d+k. The bucket column barely moves as k")
	fmt.Println("grows while the heap keeps paying -- and the first row, k = 1, is 0-1")
	fmt.Println("BFS with the front and the back spelled out longhand.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Letting a weight of 2 into a settling 0-1 BFS",
          body: "It matched the truth on 2,967 of 3,000 graphs and the 44 wrong entries were all too high, never too low -- so nothing looks impossible and no assertion fires. The smallest failing case is three nodes. If the weights are not provably in {0, 1}, this is the wrong algorithm.",
        },
        {
          title: "Assuming the relaxing variant is the safe one",
          body: "It is correct, and it is no longer 0-1 BFS. Without the done array nothing caps how often a node scans its edges -- measured at 3 on graphs of at most 6 nodes, against 1 for the settling version. The totals barely differ on random input, which is what makes the loss easy to miss.",
        },
        {
          title: "Sizing Dial's buckets by the largest distance",
          body: "It needs k+1 buckets, not one per distance: every live distance sits in the window from d to d+k, so a circular array of k+1 is enough and never collides. Allocating one bucket per possible distance is the version people abandon as impractical.",
        },
      ],
    },
    {
      id: "problems-that-are-secretly-zero-one",
      heading: "Problems that are secretly 0-1",
      body: [
        "\"What is the fewest edges I have to reverse so that every node is reachable from node 0?\" There is no weight in that question and no obvious graph either \u2014 the graph in the problem is the one whose edges are being changed.",
        "The move is to build a different graph. For every directed edge `u \u2192 v`, add `u \u2192 v` costing 0 (use it as it is) and `v \u2192 u` costing 1 (turn it around). A route in the new graph is a route in the old one, and its cost is the number of edges it needed reversed. Every weight is 0 or 1, so it is 0-1 BFS: no heap, and \u2014 the part worth noticing \u2014 **no search over which edges to flip**. The cost of flipping is folded into the graph.",
        "It matched an oracle that walks every simple path counting steps taken against an arrow on all 3,000 random graphs, and so did Dijkstra on the same built graph. Dijkstra is not wrong here, just paying for a heap it does not need \u2014 4,446 deque operations against 27,839 heap comparisons on a 1,600-node grid.",
        "The tempting shortcut is to rub the arrows out and run plain BFS. That answers a different question, and it agreed with this one on 1,092 of 3,000 graphs. The demo's third row shows the difference in shape rather than degree: nodes 2 and 3 are both two hops from the start, but node 3 is free and node 2 is the only node in the graph that needs a reversal at all.",
        "The rule worth carrying out of this: **when a problem has two kinds of move, one free and one that costs a unit, it is a 0-1 graph.** Toggles, rotations, teleports, one free pass \u2014 the moment the cost set is `{0, 1}`, reach for the deque instead of the heap.",
      ],
      examples: [
        {
          id: "minimum-edge-reversals",
          title: "Fewest reversals, with nothing searching over which edges to flip",
          lang: "python",
          code: `# The payoff: problems that are 0-1 graphs and do not look like it.
#
# "What is the fewest edges I have to reverse so that every node is reachable
# from node 0?" There is no obvious weight in that question, and no obvious
# graph either -- the graph in the problem is the one whose edges are being
# changed. The move is to build a different graph.
#
# For every directed edge u -> v, add u -> v costing 0 (use it as it is) and
# v -> u costing 1 (reverse it). A route in the new graph is a route in the old
# one, and its cost is the number of edges it needed reversed. Every weight is
# 0 or 1, so this is 0-1 BFS -- no heap, and no search over which edges to flip.
from collections import deque

INF = 10 ** 9


def with_reversals(n, edges):
    """Free forwards, one to turn an edge around."""
    out = []
    for u, v in edges:
        out.append((u, v, 0))
        out.append((v, u, 1))
    return out


def zero_one_bfs(n, weighted, start):
    """The settling deque, and the operations it costs."""
    adj = [[] for _ in range(n)]
    for u, v, w in weighted:
        adj[u].append((v, w))
    best = [INF] * n
    best[start] = 0
    done = [False] * n
    dq = deque([start])
    ops = 1
    while dq:
        at = dq.popleft()
        ops += 1
        if done[at]:
            continue
        done[at] = True
        for nxt, w in adj[at]:
            if not done[nxt] and best[at] + w < best[nxt]:
                best[nxt] = best[at] + w
                ops += 1
                if w == 0:
                    dq.appendleft(nxt)
                else:
                    dq.append(nxt)
    return best, ops


def dijkstra(n, weighted, start):
    """The same answer with a heap, and the comparisons that costs."""
    adj = [[] for _ in range(n)]
    for u, v, w in weighted:
        adj[u].append((v, w))
    best = [INF] * n
    best[start] = 0
    done = [False] * n
    heap = [(0, start)]
    compares = 0

    def before(a, b):
        return a[0] < b[0] or (a[0] == b[0] and a[1] < b[1])

    def push(item):
        nonlocal compares
        heap.append(item)
        i = len(heap) - 1
        while i > 0:
            parent = (i - 1) // 2
            compares += 1
            if not before(heap[i], heap[parent]):
                break
            heap[i], heap[parent] = heap[parent], heap[i]
            i = parent

    def pop():
        nonlocal compares
        top = heap[0]
        last = heap.pop()
        if heap:
            heap[0] = last
            i = 0
            while True:
                small = i
                for c in (2 * i + 1, 2 * i + 2):
                    if c < len(heap):
                        compares += 1
                        if before(heap[c], heap[small]):
                            small = c
                if small == i:
                    break
                heap[i], heap[small] = heap[small], heap[i]
                i = small
        return top

    while heap:
        cost, at = pop()
        if done[at]:
            continue
        done[at] = True
        for nxt, w in adj[at]:
            if not done[nxt] and cost + w < best[nxt]:
                best[nxt] = cost + w
                push((cost + w, nxt))
    return best, compares


def ignoring_direction(n, edges, start):
    """The tempting wrong answer: plain BFS with the arrows rubbed out."""
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    out = [INF] * n
    out[start] = 0
    q = deque([start])
    while q:
        at = q.popleft()
        for nxt in adj[at]:
            if out[nxt] == INF:
                out[nxt] = out[at] + 1
                q.append(nxt)
    return out


def by_reversing(n, edges, start):
    """The oracle, straight from the question.

    Walk every simple path in the undirected graph, count the steps taken
    against an arrow, keep the smallest count per node. No weights, no
    transformed graph -- just the problem as asked.
    """
    forward = set(edges)
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    out = [INF] * n
    out[start] = 0
    seen = [False] * n

    def walk(at, flips):
        seen[at] = True
        for nxt in adj[at]:
            if not seen[nxt]:
                cost = flips + (0 if (at, nxt) in forward else 1)
                if cost < out[nxt]:
                    out[nxt] = cost
                walk(nxt, cost)
        seen[at] = False

    walk(start, 0)
    return out


def show(row):
    return "[" + ", ".join("-" if x >= INF else str(x) for x in row) + "]"


def label(edges):
    return "[" + ", ".join("%d->%d" % e for e in edges) + "]"


CASES = [
    (4, [(0, 1), (1, 2), (2, 3)]),
    (4, [(1, 0), (2, 1), (3, 2)]),
    (5, [(0, 1), (2, 1), (2, 3), (4, 3), (0, 4)]),
]

print("%-34s %-16s %s" % ("edges", "reversals needed", "hops, arrows ignored"))
for n, edges in CASES:
    got, _ = zero_one_bfs(n, with_reversals(n, edges), 0)
    print("%-34s %-16s %s" % (label(edges), show(got), show(ignoring_direction(n, edges, 0))))

# The same linear congruential generator in every language, so the random
# graphs below are the same graphs whichever translation is run.
seed = 90210


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


trials = 3000
deque_ok = heap_ok = hops_ok = 0
for _ in range(trials):
    n = 2 + rand(5)
    edges = []
    for u in range(n):
        for v in range(u + 1, n):
            if rand(2) == 0:
                edges.append((u, v) if rand(2) == 0 else (v, u))
    truth = by_reversing(n, edges, 0)
    weighted = with_reversals(n, edges)
    a, _ = zero_one_bfs(n, weighted, 0)
    b, _ = dijkstra(n, weighted, 0)
    deque_ok += a == truth
    heap_ok += b == truth
    hops_ok += ignoring_direction(n, edges, 0) == truth

print()
print("over %d random directed graphs on up to 6 nodes:" % trials)
print("  0-1 BFS on the built graph matched the")
print("    fewest reversals, found by walking     %6d" % deque_ok)
print("  Dijkstra on the built graph matched it   %6d" % heap_ok)
print("  plain BFS with the arrows ignored        %6d" % hops_ok)

print()
print("and what the two frontiers cost on a bigger version:")
print("%-7s %-9s %13s %15s" % ("nodes", "shape", "deque ops", "heap compares"))
for side in (20, 30, 40):
    n = side * side
    edges = []
    for r in range(side):
        for c in range(side):
            here = r * side + c
            if c + 1 < side:
                edges.append((here, here + 1) if (r + c) % 3 else (here + 1, here))
            if r + 1 < side:
                edges.append((here, here + side) if (r + c) % 2 else (here + side, here))
    weighted = with_reversals(n, edges)
    _, ops = zero_one_bfs(n, weighted, 0)
    _, compares = dijkstra(n, weighted, 0)
    print("%-7d %-9s %13d %15d" % (n, "grid", ops, compares))

print()
print("The first two rows are the same path twice. Pointing the right way it")
print("costs nothing to reach the end; pointing the wrong way it costs three")
print("reversals -- and the hops column reads 3 either way, because counting")
print("edges is a different question.")
print()
print("Row three is where the two columns disagree in shape and not just in")
print("value. Nodes 2 and 3 are both two hops out, but node 3 is free and node")
print("2 is the only node in the graph that needs a reversal at all. Rubbing")
print("the arrows out agreed with the real answer on %d of %d graphs." % (hops_ok, trials))
print()
print("The modelling is the entire trick. Nothing searches over which edges to")
print("flip; the cost of flipping is folded into the graph as a weight, and")
print("then it is a shortest-path problem with weights 0 and 1. Dijkstra gets")
print("the same answers -- it is not wrong, just paying for a heap it does not")
print("need. The rule to carry: when a problem has two kinds of move, one free")
print("and one that costs a unit, it is a 0-1 graph and the deque is enough.")
`,
          output: `edges                              reversals needed hops, arrows ignored
[0->1, 1->2, 2->3]                 [0, 0, 0, 0]     [0, 1, 2, 3]
[1->0, 2->1, 3->2]                 [0, 1, 2, 3]     [0, 1, 2, 3]
[0->1, 2->1, 2->3, 4->3, 0->4]     [0, 0, 1, 0, 0]  [0, 1, 2, 2, 1]

over 3000 random directed graphs on up to 6 nodes:
  0-1 BFS on the built graph matched the
    fewest reversals, found by walking       3000
  Dijkstra on the built graph matched it     3000
  plain BFS with the arrows ignored          1092

and what the two frontiers cost on a bigger version:
nodes   shape         deque ops   heap compares
400     grid               1088            5564
900     grid               2484           14332
1600    grid               4446           27839

The first two rows are the same path twice. Pointing the right way it
costs nothing to reach the end; pointing the wrong way it costs three
reversals -- and the hops column reads 3 either way, because counting
edges is a different question.

Row three is where the two columns disagree in shape and not just in
value. Nodes 2 and 3 are both two hops out, but node 3 is free and node
2 is the only node in the graph that needs a reversal at all. Rubbing
the arrows out agreed with the real answer on 1092 of 3000 graphs.

The modelling is the entire trick. Nothing searches over which edges to
flip; the cost of flipping is folded into the graph as a weight, and
then it is a shortest-path problem with weights 0 and 1. Dijkstra gets
the same answers -- it is not wrong, just paying for a heap it does not
need. The rule to carry: when a problem has two kinds of move, one free
and one that costs a unit, it is a 0-1 graph and the deque is enough.`,
          explanation:
            "The modelling move: 0 forwards, 1 backwards, then 0-1 BFS. Scored against an oracle written from the problem statement, and against the tempting wrong answer.",
          alternates: [
            {
              lang: "javascript",
              code: `// The payoff: problems that are 0-1 graphs and do not look like it.
//
// "What is the fewest edges I have to reverse so that every node is reachable
// from node 0?" There is no obvious weight in that question, and no obvious
// graph either -- the graph in the problem is the one whose edges are being
// changed. The move is to build a different graph.
//
// For every directed edge u -> v, add u -> v costing 0 (use it as it is) and
// v -> u costing 1 (reverse it). A route in the new graph is a route in the old
// one, and its cost is the number of edges it needed reversed. Every weight is
// 0 or 1, so this is 0-1 BFS -- no heap, and no search over which edges to flip.
const INF = 10 ** 9;

// Free forwards, one to turn an edge around.
function withReversals(n, edges) {
  const out = [];
  for (const [u, v] of edges) {
    out.push([u, v, 0]);
    out.push([v, u, 1]);
  }
  return out;
}

// A deque over one array with a head and a tail index, so pushing at either
// end is O(1). Room is reserved for every push the search can make.
class Deque {
  constructor(room) {
    this.buf = new Array(2 * room + 2).fill(0);
    this.head = room + 1;
    this.tail = room + 1;
  }

  pushFront(x) {
    this.head -= 1;
    this.buf[this.head] = x;
  }

  pushBack(x) {
    this.buf[this.tail] = x;
    this.tail += 1;
  }

  popFront() {
    const x = this.buf[this.head];
    this.head += 1;
    return x;
  }

  get size() {
    return this.tail - this.head;
  }
}

// The settling deque, and the operations it costs.
function zeroOneBfs(n, weighted, start) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of weighted) adj[u].push([v, w]);
  const best = new Array(n).fill(INF);
  best[start] = 0;
  const done = new Array(n).fill(false);
  const dq = new Deque(weighted.length + 1);
  dq.pushBack(start);
  let ops = 1;
  while (dq.size > 0) {
    const at = dq.popFront();
    ops += 1;
    if (done[at]) continue;
    done[at] = true;
    for (const [nxt, w] of adj[at]) {
      if (!done[nxt] && best[at] + w < best[nxt]) {
        best[nxt] = best[at] + w;
        ops += 1;
        if (w === 0) dq.pushFront(nxt);
        else dq.pushBack(nxt);
      }
    }
  }
  return [best, ops];
}

// The same answer with a heap, and the comparisons that costs.
function dijkstra(n, weighted, start) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of weighted) adj[u].push([v, w]);
  const best = new Array(n).fill(INF);
  best[start] = 0;
  const done = new Array(n).fill(false);
  const heap = [[0, start]];
  let compares = 0;

  const before = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);

  const push = (item) => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      compares += 1;
      if (!before(heap[i], heap[parent])) break;
      [heap[i], heap[parent]] = [heap[parent], heap[i]];
      i = parent;
    }
  };

  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        let small = i;
        for (const c of [2 * i + 1, 2 * i + 2]) {
          if (c < heap.length) {
            compares += 1;
            if (before(heap[c], heap[small])) small = c;
          }
        }
        if (small === i) break;
        [heap[i], heap[small]] = [heap[small], heap[i]];
        i = small;
      }
    }
    return top;
  };

  while (heap.length > 0) {
    const [cost, at] = pop();
    if (done[at]) continue;
    done[at] = true;
    for (const [nxt, w] of adj[at]) {
      if (!done[nxt] && cost + w < best[nxt]) {
        best[nxt] = cost + w;
        push([cost + w, nxt]);
      }
    }
  }
  return [best, compares];
}

// The tempting wrong answer: plain BFS with the arrows rubbed out.
function ignoringDirection(n, edges, start) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }
  const out = new Array(n).fill(INF);
  out[start] = 0;
  const q = [start];
  let head = 0;
  while (head < q.length) {
    const at = q[head];
    head += 1;
    for (const nxt of adj[at]) {
      if (out[nxt] === INF) {
        out[nxt] = out[at] + 1;
        q.push(nxt);
      }
    }
  }
  return out;
}

// The oracle, straight from the question.
//
// Walk every simple path in the undirected graph, count the steps taken
// against an arrow, keep the smallest count per node. No weights, no
// transformed graph -- just the problem as asked.
function byReversing(n, edges, start) {
  const forward = new Set(edges.map(([u, v]) => \`\${u},\${v}\`));
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }
  const out = new Array(n).fill(INF);
  out[start] = 0;
  const seen = new Array(n).fill(false);
  const walk = (at, flips) => {
    seen[at] = true;
    for (const nxt of adj[at]) {
      if (!seen[nxt]) {
        const cost = flips + (forward.has(\`\${at},\${nxt}\`) ? 0 : 1);
        if (cost < out[nxt]) out[nxt] = cost;
        walk(nxt, cost);
      }
    }
    seen[at] = false;
  };
  walk(start, 0);
  return out;
}

function show(row) {
  return "[" + row.map((x) => (x >= INF ? "-" : String(x))).join(", ") + "]";
}

function label(edges) {
  return "[" + edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ") + "]";
}

const CASES = [
  [4, [[0, 1], [1, 2], [2, 3]]],
  [4, [[1, 0], [2, 1], [3, 2]]],
  [5, [[0, 1], [2, 1], [2, 3], [4, 3], [0, 4]]],
];

console.log("edges".padEnd(34) + " " + "reversals needed".padEnd(16) + " " + "hops, arrows ignored");
for (const [n, edges] of CASES) {
  const [got] = zeroOneBfs(n, withReversals(n, edges), 0);
  console.log(
    label(edges).padEnd(34) + " " + show(got).padEnd(16) + " " +
    show(ignoringDirection(n, edges, 0)),
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 90210n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let dequeOk = 0;
let heapOk = 0;
let hopsOk = 0;
const same = (a, b) => a.every((x, i) => x === b[i]);
for (let t = 0; t < trials; t += 1) {
  const n = 2 + rand(5);
  const edges = [];
  for (let u = 0; u < n; u += 1)
    for (let v = u + 1; v < n; v += 1)
      if (rand(2) === 0) edges.push(rand(2) === 0 ? [u, v] : [v, u]);
  const truth = byReversing(n, edges, 0);
  const weighted = withReversals(n, edges);
  const [a] = zeroOneBfs(n, weighted, 0);
  const [b] = dijkstra(n, weighted, 0);
  if (same(a, truth)) dequeOk += 1;
  if (same(b, truth)) heapOk += 1;
  if (same(ignoringDirection(n, edges, 0), truth)) hopsOk += 1;
}

console.log();
console.log(\`over \${trials} random directed graphs on up to 6 nodes:\`);
console.log("  0-1 BFS on the built graph matched the");
console.log("    fewest reversals, found by walking     " + String(dequeOk).padStart(6));
console.log("  Dijkstra on the built graph matched it   " + String(heapOk).padStart(6));
console.log("  plain BFS with the arrows ignored        " + String(hopsOk).padStart(6));

console.log();
console.log("and what the two frontiers cost on a bigger version:");
console.log("nodes".padEnd(7) + " " + "shape".padEnd(9) + " " + "deque ops".padStart(13) + " " + "heap compares".padStart(15));
for (const side of [20, 30, 40]) {
  const n = side * side;
  const edges = [];
  for (let r = 0; r < side; r += 1)
    for (let c = 0; c < side; c += 1) {
      const here = r * side + c;
      if (c + 1 < side) edges.push((r + c) % 3 ? [here, here + 1] : [here + 1, here]);
      if (r + 1 < side) edges.push((r + c) % 2 ? [here, here + side] : [here + side, here]);
    }
  const weighted = withReversals(n, edges);
  const [, ops] = zeroOneBfs(n, weighted, 0);
  const [, compares] = dijkstra(n, weighted, 0);
  console.log(
    String(n).padEnd(7) + " " + "grid".padEnd(9) + " " +
    String(ops).padStart(13) + " " + String(compares).padStart(15),
  );
}

console.log();
console.log("The first two rows are the same path twice. Pointing the right way it");
console.log("costs nothing to reach the end; pointing the wrong way it costs three");
console.log("reversals -- and the hops column reads 3 either way, because counting");
console.log("edges is a different question.");
console.log();
console.log("Row three is where the two columns disagree in shape and not just in");
console.log("value. Nodes 2 and 3 are both two hops out, but node 3 is free and node");
console.log(\`2 is the only node in the graph that needs a reversal at all. Rubbing\`);
console.log(\`the arrows out agreed with the real answer on \${hopsOk} of \${trials} graphs.\`);
console.log();
console.log("The modelling is the entire trick. Nothing searches over which edges to");
console.log("flip; the cost of flipping is folded into the graph as a weight, and");
console.log("then it is a shortest-path problem with weights 0 and 1. Dijkstra gets");
console.log("the same answers -- it is not wrong, just paying for a heap it does not");
console.log("need. The rule to carry: when a problem has two kinds of move, one free");
console.log("and one that costs a unit, it is a 0-1 graph and the deque is enough.");
`,
            },
            {
              lang: "typescript",
              code: `// The payoff: problems that are 0-1 graphs and do not look like it.
//
// "What is the fewest edges I have to reverse so that every node is reachable
// from node 0?" There is no obvious weight in that question, and no obvious
// graph either -- the graph in the problem is the one whose edges are being
// changed. The move is to build a different graph.
//
// For every directed edge u -> v, add u -> v costing 0 (use it as it is) and
// v -> u costing 1 (reverse it). A route in the new graph is a route in the old
// one, and its cost is the number of edges it needed reversed. Every weight is
// 0 or 1, so this is 0-1 BFS -- no heap, and no search over which edges to flip.
const INF = 10 ** 9;

// Free forwards, one to turn an edge around.
function withReversals(n: number, edges: number[][]): number[][] {
  const out: number[][] = [];
  for (const [u, v] of edges) {
    out.push([u, v, 0]);
    out.push([v, u, 1]);
  }
  return out;
}

// A deque over one array with a head and a tail index, so pushing at either
// end is O(1). Room is reserved for every push the search can make.
class Deque {
  buf: number[];
  head: number;
  tail: number;

  constructor(room: number) {
    this.buf = new Array(2 * room + 2).fill(0);
    this.head = room + 1;
    this.tail = room + 1;
  }

  pushFront(x: number): void {
    this.head -= 1;
    this.buf[this.head] = x;
  }

  pushBack(x: number): void {
    this.buf[this.tail] = x;
    this.tail += 1;
  }

  popFront(): number {
    const x = this.buf[this.head];
    this.head += 1;
    return x;
  }

  get size(): number {
    return this.tail - this.head;
  }
}

// The settling deque, and the operations it costs.
function zeroOneBfs(n: number, weighted: number[][], start: number): [number[], number] {
  const adj: number[][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of weighted) adj[u].push([v, w]);
  const best = new Array(n).fill(INF);
  best[start] = 0;
  const done = new Array(n).fill(false);
  const dq = new Deque(weighted.length + 1);
  dq.pushBack(start);
  let ops = 1;
  while (dq.size > 0) {
    const at = dq.popFront();
    ops += 1;
    if (done[at]) continue;
    done[at] = true;
    for (const [nxt, w] of adj[at]) {
      if (!done[nxt] && best[at] + w < best[nxt]) {
        best[nxt] = best[at] + w;
        ops += 1;
        if (w === 0) dq.pushFront(nxt);
        else dq.pushBack(nxt);
      }
    }
  }
  return [best, ops];
}

// The same answer with a heap, and the comparisons that costs.
function dijkstra(n: number, weighted: number[][], start: number): [number[], number] {
  const adj: number[][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of weighted) adj[u].push([v, w]);
  const best = new Array(n).fill(INF);
  best[start] = 0;
  const done = new Array(n).fill(false);
  const heap: [number, number][] = [[0, start]];
  let compares = 0;

  const before = (a: [number, number], b: [number, number]): boolean => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);

  const push = (item: [number, number]): void => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      compares += 1;
      if (!before(heap[i], heap[parent])) break;
      [heap[i], heap[parent]] = [heap[parent], heap[i]];
      i = parent;
    }
  };

  const pop = (): [number, number] => {
    const top = heap[0];
    const last = heap.pop() as [number, number];
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        let small = i;
        for (const c of [2 * i + 1, 2 * i + 2]) {
          if (c < heap.length) {
            compares += 1;
            if (before(heap[c], heap[small])) small = c;
          }
        }
        if (small === i) break;
        [heap[i], heap[small]] = [heap[small], heap[i]];
        i = small;
      }
    }
    return top;
  };

  while (heap.length > 0) {
    const [cost, at] = pop();
    if (done[at]) continue;
    done[at] = true;
    for (const [nxt, w] of adj[at]) {
      if (!done[nxt] && cost + w < best[nxt]) {
        best[nxt] = cost + w;
        push([cost + w, nxt]);
      }
    }
  }
  return [best, compares];
}

// The tempting wrong answer: plain BFS with the arrows rubbed out.
function ignoringDirection(n: number, edges: number[][], start: number): number[] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }
  const out = new Array(n).fill(INF);
  out[start] = 0;
  const q: number[] = [start];
  let head = 0;
  while (head < q.length) {
    const at = q[head];
    head += 1;
    for (const nxt of adj[at]) {
      if (out[nxt] === INF) {
        out[nxt] = out[at] + 1;
        q.push(nxt);
      }
    }
  }
  return out;
}

// The oracle, straight from the question.
//
// Walk every simple path in the undirected graph, count the steps taken
// against an arrow, keep the smallest count per node. No weights, no
// transformed graph -- just the problem as asked.
function byReversing(n: number, edges: number[][], start: number): number[] {
  const forward = new Set(edges.map(([u, v]) => \`\${u},\${v}\`));
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }
  const out = new Array(n).fill(INF);
  out[start] = 0;
  const seen = new Array(n).fill(false);
  const walk = (at: number, flips: number): void => {
    seen[at] = true;
    for (const nxt of adj[at]) {
      if (!seen[nxt]) {
        const cost = flips + (forward.has(\`\${at},\${nxt}\`) ? 0 : 1);
        if (cost < out[nxt]) out[nxt] = cost;
        walk(nxt, cost);
      }
    }
    seen[at] = false;
  };
  walk(start, 0);
  return out;
}

function show(row: number[]): string {
  return "[" + row.map((x) => (x >= INF ? "-" : String(x))).join(", ") + "]";
}

function label(edges: number[][]): string {
  return "[" + edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ") + "]";
}

const CASES: [number, number[][]][] = [
  [4, [[0, 1], [1, 2], [2, 3]]],
  [4, [[1, 0], [2, 1], [3, 2]]],
  [5, [[0, 1], [2, 1], [2, 3], [4, 3], [0, 4]]],
];

console.log("edges".padEnd(34) + " " + "reversals needed".padEnd(16) + " " + "hops, arrows ignored");
for (const [n, edges] of CASES) {
  const [got] = zeroOneBfs(n, withReversals(n, edges), 0);
  console.log(
    label(edges).padEnd(34) + " " + show(got).padEnd(16) + " " +
    show(ignoringDirection(n, edges, 0)),
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 90210n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let dequeOk = 0;
let heapOk = 0;
let hopsOk = 0;
const same = (a: number[], b: number[]): boolean => a.every((x, i) => x === b[i]);
for (let t = 0; t < trials; t += 1) {
  const n = 2 + rand(5);
  const edges: number[][] = [];
  for (let u = 0; u < n; u += 1)
    for (let v = u + 1; v < n; v += 1)
      if (rand(2) === 0) edges.push(rand(2) === 0 ? [u, v] : [v, u]);
  const truth = byReversing(n, edges, 0);
  const weighted = withReversals(n, edges);
  const [a] = zeroOneBfs(n, weighted, 0);
  const [b] = dijkstra(n, weighted, 0);
  if (same(a, truth)) dequeOk += 1;
  if (same(b, truth)) heapOk += 1;
  if (same(ignoringDirection(n, edges, 0), truth)) hopsOk += 1;
}

console.log();
console.log(\`over \${trials} random directed graphs on up to 6 nodes:\`);
console.log("  0-1 BFS on the built graph matched the");
console.log("    fewest reversals, found by walking     " + String(dequeOk).padStart(6));
console.log("  Dijkstra on the built graph matched it   " + String(heapOk).padStart(6));
console.log("  plain BFS with the arrows ignored        " + String(hopsOk).padStart(6));

console.log();
console.log("and what the two frontiers cost on a bigger version:");
console.log("nodes".padEnd(7) + " " + "shape".padEnd(9) + " " + "deque ops".padStart(13) + " " + "heap compares".padStart(15));
for (const side of [20, 30, 40]) {
  const n = side * side;
  const edges: number[][] = [];
  for (let r = 0; r < side; r += 1)
    for (let c = 0; c < side; c += 1) {
      const here = r * side + c;
      if (c + 1 < side) edges.push((r + c) % 3 ? [here, here + 1] : [here + 1, here]);
      if (r + 1 < side) edges.push((r + c) % 2 ? [here, here + side] : [here + side, here]);
    }
  const weighted = withReversals(n, edges);
  const [, ops] = zeroOneBfs(n, weighted, 0);
  const [, compares] = dijkstra(n, weighted, 0);
  console.log(
    String(n).padEnd(7) + " " + "grid".padEnd(9) + " " +
    String(ops).padStart(13) + " " + String(compares).padStart(15),
  );
}

console.log();
console.log("The first two rows are the same path twice. Pointing the right way it");
console.log("costs nothing to reach the end; pointing the wrong way it costs three");
console.log("reversals -- and the hops column reads 3 either way, because counting");
console.log("edges is a different question.");
console.log();
console.log("Row three is where the two columns disagree in shape and not just in");
console.log("value. Nodes 2 and 3 are both two hops out, but node 3 is free and node");
console.log(\`2 is the only node in the graph that needs a reversal at all. Rubbing\`);
console.log(\`the arrows out agreed with the real answer on \${hopsOk} of \${trials} graphs.\`);
console.log();
console.log("The modelling is the entire trick. Nothing searches over which edges to");
console.log("flip; the cost of flipping is folded into the graph as a weight, and");
console.log("then it is a shortest-path problem with weights 0 and 1. Dijkstra gets");
console.log("the same answers -- it is not wrong, just paying for a heap it does not");
console.log("need. The rule to carry: when a problem has two kinds of move, one free");
console.log("and one that costs a unit, it is a 0-1 graph and the deque is enough.");
`,
            },
            {
              lang: "java",
              code: `// The payoff: problems that are 0-1 graphs and do not look like it.
//
// "What is the fewest edges I have to reverse so that every node is reachable
// from node 0?" There is no obvious weight in that question, and no obvious
// graph either -- the graph in the problem is the one whose edges are being
// changed. The move is to build a different graph.
//
// For every directed edge u -> v, add u -> v costing 0 (use it as it is) and
// v -> u costing 1 (reverse it). A route in the new graph is a route in the old
// one, and its cost is the number of edges it needed reversed. Every weight is
// 0 or 1, so this is 0-1 BFS -- no heap, and no search over which edges to flip.
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class Main {
    static final int INF = 1000000000;

    /** Free forwards, one to turn an edge around. */
    static int[][] withReversals(int n, int[][] edges) {
        int[][] out = new int[edges.length * 2][3];
        for (int i = 0; i < edges.length; i++) {
            out[2 * i] = new int[] {edges[i][0], edges[i][1], 0};
            out[2 * i + 1] = new int[] {edges[i][1], edges[i][0], 1};
        }
        return out;
    }

    static List<int[]>[] adjacency(int n, int[][] weighted) {
        @SuppressWarnings("unchecked")
        List<int[]>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : weighted) adj[e[0]].add(new int[] {e[1], e[2]});
        return adj;
    }

    /** The settling deque, and the operations it costs. */
    static int[] zeroOneBfs(int n, int[][] weighted, int start, long[] stats) {
        List<int[]>[] adj = adjacency(n, weighted);
        int[] best = new int[n];
        Arrays.fill(best, INF);
        best[start] = 0;
        boolean[] done = new boolean[n];
        Deque<Integer> dq = new ArrayDeque<>();
        dq.addLast(start);
        long ops = 1;
        while (!dq.isEmpty()) {
            int at = dq.pollFirst();
            ops++;
            if (done[at]) continue;
            done[at] = true;
            for (int[] step : adj[at]) {
                if (!done[step[0]] && best[at] + step[1] < best[step[0]]) {
                    best[step[0]] = best[at] + step[1];
                    ops++;
                    if (step[1] == 0) dq.addFirst(step[0]);
                    else dq.addLast(step[0]);
                }
            }
        }
        stats[0] = ops;
        return best;
    }

    static boolean before(int[] a, int[] b) {
        return a[0] < b[0] || (a[0] == b[0] && a[1] < b[1]);
    }

    static void heapPush(List<int[]> heap, int[] item, long[] compares) {
        heap.add(item);
        int i = heap.size() - 1;
        while (i > 0) {
            int parent = (i - 1) / 2;
            compares[0]++;
            if (!before(heap.get(i), heap.get(parent))) break;
            int[] tmp = heap.get(i);
            heap.set(i, heap.get(parent));
            heap.set(parent, tmp);
            i = parent;
        }
    }

    static int[] heapPop(List<int[]> heap, long[] compares) {
        int[] top = heap.get(0);
        int[] last = heap.remove(heap.size() - 1);
        if (!heap.isEmpty()) {
            heap.set(0, last);
            int i = 0;
            while (true) {
                int small = i;
                for (int c : new int[] {2 * i + 1, 2 * i + 2}) {
                    if (c < heap.size()) {
                        compares[0]++;
                        if (before(heap.get(c), heap.get(small))) small = c;
                    }
                }
                if (small == i) break;
                int[] tmp = heap.get(i);
                heap.set(i, heap.get(small));
                heap.set(small, tmp);
                i = small;
            }
        }
        return top;
    }

    /** The same answer with a heap, and the comparisons that costs. */
    static int[] dijkstra(int n, int[][] weighted, int start, long[] stats) {
        List<int[]>[] adj = adjacency(n, weighted);
        int[] best = new int[n];
        Arrays.fill(best, INF);
        best[start] = 0;
        boolean[] done = new boolean[n];
        List<int[]> heap = new ArrayList<>();
        heap.add(new int[] {0, start});
        long[] compares = new long[1];
        while (!heap.isEmpty()) {
            int[] top = heapPop(heap, compares);
            int cost = top[0], at = top[1];
            if (done[at]) continue;
            done[at] = true;
            for (int[] step : adj[at]) {
                if (!done[step[0]] && cost + step[1] < best[step[0]]) {
                    best[step[0]] = cost + step[1];
                    heapPush(heap, new int[] {cost + step[1], step[0]}, compares);
                }
            }
        }
        stats[0] = compares[0];
        return best;
    }

    /** The tempting wrong answer: plain BFS with the arrows rubbed out. */
    static int[] ignoringDirection(int n, int[][] edges, int start) {
        @SuppressWarnings("unchecked")
        List<Integer>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : edges) {
            adj[e[0]].add(e[1]);
            adj[e[1]].add(e[0]);
        }
        int[] out = new int[n];
        Arrays.fill(out, INF);
        out[start] = 0;
        Deque<Integer> q = new ArrayDeque<>();
        q.addLast(start);
        while (!q.isEmpty()) {
            int at = q.pollFirst();
            for (int nxt : adj[at]) {
                if (out[nxt] == INF) {
                    out[nxt] = out[at] + 1;
                    q.addLast(nxt);
                }
            }
        }
        return out;
    }

    static void reverseWalk(List<Integer>[] adj, Set<Long> forward, boolean[] seen, int[] out,
                            int at, int flips) {
        seen[at] = true;
        for (int nxt : adj[at]) {
            if (!seen[nxt]) {
                int cost = flips + (forward.contains((long) at * 1000 + nxt) ? 0 : 1);
                if (cost < out[nxt]) out[nxt] = cost;
                reverseWalk(adj, forward, seen, out, nxt, cost);
            }
        }
        seen[at] = false;
    }

    /**
     * The oracle, straight from the question.
     *
     * <p>Walk every simple path in the undirected graph, count the steps taken
     * against an arrow, keep the smallest count per node. No weights, no
     * transformed graph -- just the problem as asked.
     */
    static int[] byReversing(int n, int[][] edges, int start) {
        Set<Long> forward = new HashSet<>();
        @SuppressWarnings("unchecked")
        List<Integer>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : edges) {
            forward.add((long) e[0] * 1000 + e[1]);
            adj[e[0]].add(e[1]);
            adj[e[1]].add(e[0]);
        }
        int[] out = new int[n];
        Arrays.fill(out, INF);
        out[start] = 0;
        reverseWalk(adj, forward, new boolean[n], out, start, 0);
        return out;
    }

    static String show(int[] row) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < row.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(row[i] >= INF ? "-" : String.valueOf(row[i]));
        }
        return sb.append("]").toString();
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
    static long seed = 90210L;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    public static void main(String[] args) {
        int[] caseN = {4, 4, 5};
        int[][][] caseEdges = {
            {{0, 1}, {1, 2}, {2, 3}},
            {{1, 0}, {2, 1}, {3, 2}},
            {{0, 1}, {2, 1}, {2, 3}, {4, 3}, {0, 4}},
        };

        System.out.printf("%-34s %-16s %s%n", "edges", "reversals needed", "hops, arrows ignored");
        for (int c = 0; c < caseN.length; c++) {
            int[] got = zeroOneBfs(caseN[c], withReversals(caseN[c], caseEdges[c]), 0, new long[1]);
            System.out.printf("%-34s %-16s %s%n", label(caseEdges[c]), show(got),
                show(ignoringDirection(caseN[c], caseEdges[c], 0)));
        }

        int trials = 3000;
        int dequeOk = 0, heapOk = 0, hopsOk = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(5);
            List<int[]> built = new ArrayList<>();
            for (int u = 0; u < n; u++)
                for (int v = u + 1; v < n; v++)
                    if (rand(2) == 0)
                        built.add(rand(2) == 0 ? new int[] {u, v} : new int[] {v, u});
            int[][] edges = built.toArray(new int[0][]);
            int[] truth = byReversing(n, edges, 0);
            int[][] weighted = withReversals(n, edges);
            int[] a = zeroOneBfs(n, weighted, 0, new long[1]);
            int[] b = dijkstra(n, weighted, 0, new long[1]);
            if (Arrays.equals(a, truth)) dequeOk++;
            if (Arrays.equals(b, truth)) heapOk++;
            if (Arrays.equals(ignoringDirection(n, edges, 0), truth)) hopsOk++;
        }

        System.out.println();
        System.out.println("over " + trials + " random directed graphs on up to 6 nodes:");
        System.out.println("  0-1 BFS on the built graph matched the");
        System.out.printf("    fewest reversals, found by walking     %6d%n", dequeOk);
        System.out.printf("  Dijkstra on the built graph matched it   %6d%n", heapOk);
        System.out.printf("  plain BFS with the arrows ignored        %6d%n", hopsOk);

        System.out.println();
        System.out.println("and what the two frontiers cost on a bigger version:");
        System.out.printf("%-7s %-9s %13s %15s%n", "nodes", "shape", "deque ops", "heap compares");
        for (int side : new int[] {20, 30, 40}) {
            int n = side * side;
            List<int[]> built = new ArrayList<>();
            for (int r = 0; r < side; r++)
                for (int c = 0; c < side; c++) {
                    int here = r * side + c;
                    if (c + 1 < side)
                        built.add((r + c) % 3 != 0 ? new int[] {here, here + 1}
                                                   : new int[] {here + 1, here});
                    if (r + 1 < side)
                        built.add((r + c) % 2 != 0 ? new int[] {here, here + side}
                                                   : new int[] {here + side, here});
                }
            int[][] weighted = withReversals(n, built.toArray(new int[0][]));
            long[] ops = new long[1];
            long[] compares = new long[1];
            zeroOneBfs(n, weighted, 0, ops);
            dijkstra(n, weighted, 0, compares);
            System.out.printf("%-7d %-9s %13d %15d%n", n, "grid", ops[0], compares[0]);
        }

        System.out.println();
        System.out.println("The first two rows are the same path twice. Pointing the right way it");
        System.out.println("costs nothing to reach the end; pointing the wrong way it costs three");
        System.out.println("reversals -- and the hops column reads 3 either way, because counting");
        System.out.println("edges is a different question.");
        System.out.println();
        System.out.println("Row three is where the two columns disagree in shape and not just in");
        System.out.println("value. Nodes 2 and 3 are both two hops out, but node 3 is free and node");
        System.out.println("2 is the only node in the graph that needs a reversal at all. Rubbing");
        System.out.println("the arrows out agreed with the real answer on " + hopsOk + " of " + trials
            + " graphs.");
        System.out.println();
        System.out.println("The modelling is the entire trick. Nothing searches over which edges to");
        System.out.println("flip; the cost of flipping is folded into the graph as a weight, and");
        System.out.println("then it is a shortest-path problem with weights 0 and 1. Dijkstra gets");
        System.out.println("the same answers -- it is not wrong, just paying for a heap it does not");
        System.out.println("need. The rule to carry: when a problem has two kinds of move, one free");
        System.out.println("and one that costs a unit, it is a 0-1 graph and the deque is enough.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The payoff: problems that are 0-1 graphs and do not look like it.
//
// "What is the fewest edges I have to reverse so that every node is reachable
// from node 0?" There is no obvious weight in that question, and no obvious
// graph either -- the graph in the problem is the one whose edges are being
// changed. The move is to build a different graph.
//
// For every directed edge u -> v, add u -> v costing 0 (use it as it is) and
// v -> u costing 1 (reverse it). A route in the new graph is a route in the old
// one, and its cost is the number of edges it needed reversed. Every weight is
// 0 or 1, so this is 0-1 BFS -- no heap, and no search over which edges to flip.
#include <array>
#include <deque>
#include <iomanip>
#include <iostream>
#include <set>
#include <string>
#include <utility>
#include <vector>

const int INF = 1000000000;

using Arrow = std::pair<int, int>;
using Edge = std::array<int, 3>;
using Adj = std::vector<std::vector<std::pair<int, int>>>;

// Free forwards, one to turn an edge around.
std::vector<Edge> with_reversals(int n, const std::vector<Arrow>& edges) {
    std::vector<Edge> out;
    for (const Arrow& e : edges) {
        out.push_back({e.first, e.second, 0});
        out.push_back({e.second, e.first, 1});
    }
    return out;
}

Adj adjacency(int n, const std::vector<Edge>& weighted) {
    Adj adj(n);
    for (const Edge& e : weighted) adj[e[0]].push_back({e[1], e[2]});
    return adj;
}

// The settling deque, and the operations it costs.
std::vector<int> zero_one_bfs(int n, const std::vector<Edge>& weighted, int start,
                              long long& ops) {
    Adj adj = adjacency(n, weighted);
    std::vector<int> best(n, INF);
    best[start] = 0;
    std::vector<bool> done(n, false);
    std::deque<int> dq = {start};
    ops = 1;
    while (!dq.empty()) {
        int at = dq.front();
        dq.pop_front();
        ops++;
        if (done[at]) continue;
        done[at] = true;
        for (const auto& step : adj[at]) {
            if (!done[step.first] && best[at] + step.second < best[step.first]) {
                best[step.first] = best[at] + step.second;
                ops++;
                if (step.second == 0) dq.push_front(step.first);
                else dq.push_back(step.first);
            }
        }
    }
    return best;
}

bool before(const std::pair<int, int>& a, const std::pair<int, int>& b) {
    return a.first < b.first || (a.first == b.first && a.second < b.second);
}

// The same answer with a heap, and the comparisons that costs.
std::vector<int> dijkstra(int n, const std::vector<Edge>& weighted, int start,
                          long long& compares) {
    Adj adj = adjacency(n, weighted);
    std::vector<int> best(n, INF);
    best[start] = 0;
    std::vector<bool> done(n, false);
    std::vector<std::pair<int, int>> heap = {{0, start}};
    compares = 0;

    auto push = [&](std::pair<int, int> item) {
        heap.push_back(item);
        size_t i = heap.size() - 1;
        while (i > 0) {
            size_t parent = (i - 1) / 2;
            compares++;
            if (!before(heap[i], heap[parent])) break;
            std::swap(heap[i], heap[parent]);
            i = parent;
        }
    };

    auto pop = [&]() {
        std::pair<int, int> top = heap[0];
        std::pair<int, int> last = heap.back();
        heap.pop_back();
        if (!heap.empty()) {
            heap[0] = last;
            size_t i = 0;
            for (;;) {
                size_t small = i;
                for (size_t c : {2 * i + 1, 2 * i + 2}) {
                    if (c < heap.size()) {
                        compares++;
                        if (before(heap[c], heap[small])) small = c;
                    }
                }
                if (small == i) break;
                std::swap(heap[i], heap[small]);
                i = small;
            }
        }
        return top;
    };

    while (!heap.empty()) {
        std::pair<int, int> top = pop();
        int cost = top.first, at = top.second;
        if (done[at]) continue;
        done[at] = true;
        for (const auto& step : adj[at]) {
            if (!done[step.first] && cost + step.second < best[step.first]) {
                best[step.first] = cost + step.second;
                push({cost + step.second, step.first});
            }
        }
    }
    return best;
}

// The tempting wrong answer: plain BFS with the arrows rubbed out.
std::vector<int> ignoring_direction(int n, const std::vector<Arrow>& edges, int start) {
    std::vector<std::vector<int>> adj(n);
    for (const Arrow& e : edges) {
        adj[e.first].push_back(e.second);
        adj[e.second].push_back(e.first);
    }
    std::vector<int> out(n, INF);
    out[start] = 0;
    std::deque<int> q = {start};
    while (!q.empty()) {
        int at = q.front();
        q.pop_front();
        for (int nxt : adj[at]) {
            if (out[nxt] == INF) {
                out[nxt] = out[at] + 1;
                q.push_back(nxt);
            }
        }
    }
    return out;
}

void reverse_walk(const std::vector<std::vector<int>>& adj, const std::set<Arrow>& forward,
                  std::vector<bool>& seen, std::vector<int>& out, int at, int flips) {
    seen[at] = true;
    for (int nxt : adj[at]) {
        if (!seen[nxt]) {
            int cost = flips + (forward.count({at, nxt}) ? 0 : 1);
            if (cost < out[nxt]) out[nxt] = cost;
            reverse_walk(adj, forward, seen, out, nxt, cost);
        }
    }
    seen[at] = false;
}

// The oracle, straight from the question.
//
// Walk every simple path in the undirected graph, count the steps taken
// against an arrow, keep the smallest count per node. No weights, no
// transformed graph -- just the problem as asked.
std::vector<int> by_reversing(int n, const std::vector<Arrow>& edges, int start) {
    std::set<Arrow> forward(edges.begin(), edges.end());
    std::vector<std::vector<int>> adj(n);
    for (const Arrow& e : edges) {
        adj[e.first].push_back(e.second);
        adj[e.second].push_back(e.first);
    }
    std::vector<int> out(n, INF);
    out[start] = 0;
    std::vector<bool> seen(n, false);
    reverse_walk(adj, forward, seen, out, start, 0);
    return out;
}

std::string show(const std::vector<int>& row) {
    std::string s = "[";
    for (size_t i = 0; i < row.size(); i++) {
        if (i > 0) s += ", ";
        s += row[i] >= INF ? "-" : std::to_string(row[i]);
    }
    return s + "]";
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
long long seed = 90210;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

int main() {
    std::vector<int> case_n = {4, 4, 5};
    std::vector<std::vector<Arrow>> cases = {
        {{0, 1}, {1, 2}, {2, 3}},
        {{1, 0}, {2, 1}, {3, 2}},
        {{0, 1}, {2, 1}, {2, 3}, {4, 3}, {0, 4}},
    };

    std::cout << std::left << std::setw(34) << "edges" << " " << std::setw(16)
              << "reversals needed" << " " << "hops, arrows ignored" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        long long ops = 0;
        std::vector<int> got =
            zero_one_bfs(case_n[c], with_reversals(case_n[c], cases[c]), 0, ops);
        std::cout << std::left << std::setw(34) << label(cases[c]) << " " << std::setw(16)
                  << show(got) << " " << show(ignoring_direction(case_n[c], cases[c], 0)) << "\\n";
    }

    int trials = 3000;
    int deque_ok = 0, heap_ok = 0, hops_ok = 0;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(5);
        std::vector<Arrow> edges;
        for (int u = 0; u < n; u++)
            for (int v = u + 1; v < n; v++)
                if (rand_below(2) == 0) {
                    if (rand_below(2) == 0) edges.push_back({u, v});
                    else edges.push_back({v, u});
                }
        std::vector<int> truth = by_reversing(n, edges, 0);
        std::vector<Edge> weighted = with_reversals(n, edges);
        long long ops = 0, compares = 0;
        std::vector<int> a = zero_one_bfs(n, weighted, 0, ops);
        std::vector<int> b = dijkstra(n, weighted, 0, compares);
        if (a == truth) deque_ok++;
        if (b == truth) heap_ok++;
        if (ignoring_direction(n, edges, 0) == truth) hops_ok++;
    }

    std::cout << "\\n";
    std::cout << "over " << trials << " random directed graphs on up to 6 nodes:\\n";
    std::cout << std::right;
    std::cout << "  0-1 BFS on the built graph matched the\\n";
    std::cout << "    fewest reversals, found by walking     " << std::setw(6) << deque_ok << "\\n";
    std::cout << "  Dijkstra on the built graph matched it   " << std::setw(6) << heap_ok << "\\n";
    std::cout << "  plain BFS with the arrows ignored        " << std::setw(6) << hops_ok << "\\n";

    std::cout << "\\n";
    std::cout << "and what the two frontiers cost on a bigger version:\\n";
    std::cout << std::left << std::setw(7) << "nodes" << " " << std::setw(9) << "shape" << " "
              << std::right << std::setw(13) << "deque ops" << " " << std::setw(15)
              << "heap compares" << "\\n";
    for (int side : {20, 30, 40}) {
        int n = side * side;
        std::vector<Arrow> edges;
        for (int r = 0; r < side; r++)
            for (int c = 0; c < side; c++) {
                int here = r * side + c;
                if (c + 1 < side) {
                    if ((r + c) % 3 != 0) edges.push_back({here, here + 1});
                    else edges.push_back({here + 1, here});
                }
                if (r + 1 < side) {
                    if ((r + c) % 2 != 0) edges.push_back({here, here + side});
                    else edges.push_back({here + side, here});
                }
            }
        std::vector<Edge> weighted = with_reversals(n, edges);
        long long ops = 0, compares = 0;
        zero_one_bfs(n, weighted, 0, ops);
        dijkstra(n, weighted, 0, compares);
        std::cout << std::left << std::setw(7) << n << " " << std::setw(9) << "grid" << " "
                  << std::right << std::setw(13) << ops << " " << std::setw(15) << compares
                  << "\\n";
    }

    std::cout << "\\n";
    std::cout << "The first two rows are the same path twice. Pointing the right way it\\n";
    std::cout << "costs nothing to reach the end; pointing the wrong way it costs three\\n";
    std::cout << "reversals -- and the hops column reads 3 either way, because counting\\n";
    std::cout << "edges is a different question.\\n";
    std::cout << "\\n";
    std::cout << "Row three is where the two columns disagree in shape and not just in\\n";
    std::cout << "value. Nodes 2 and 3 are both two hops out, but node 3 is free and node\\n";
    std::cout << "2 is the only node in the graph that needs a reversal at all. Rubbing\\n";
    std::cout << "the arrows out agreed with the real answer on " << hops_ok << " of " << trials
              << " graphs.\\n";
    std::cout << "\\n";
    std::cout << "The modelling is the entire trick. Nothing searches over which edges to\\n";
    std::cout << "flip; the cost of flipping is folded into the graph as a weight, and\\n";
    std::cout << "then it is a shortest-path problem with weights 0 and 1. Dijkstra gets\\n";
    std::cout << "the same answers -- it is not wrong, just paying for a heap it does not\\n";
    std::cout << "need. The rule to carry: when a problem has two kinds of move, one free\\n";
    std::cout << "and one that costs a unit, it is a 0-1 graph and the deque is enough.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// The payoff: problems that are 0-1 graphs and do not look like it.
//
// "What is the fewest edges I have to reverse so that every node is reachable
// from node 0?" There is no obvious weight in that question, and no obvious
// graph either -- the graph in the problem is the one whose edges are being
// changed. The move is to build a different graph.
//
// For every directed edge u -> v, add u -> v costing 0 (use it as it is) and
// v -> u costing 1 (reverse it). A route in the new graph is a route in the old
// one, and its cost is the number of edges it needed reversed. Every weight is
// 0 or 1, so this is 0-1 BFS -- no heap, and no search over which edges to flip.
use std::collections::{HashSet, VecDeque};

const INF: i64 = 1_000_000_000;

type Arrow = (usize, usize);
type Edge = (usize, usize, i64);
type Adj = Vec<Vec<(usize, i64)>>;

/// Free forwards, one to turn an edge around.
fn with_reversals(edges: &[Arrow]) -> Vec<Edge> {
    let mut out = Vec::new();
    for &(u, v) in edges {
        out.push((u, v, 0));
        out.push((v, u, 1));
    }
    out
}

fn adjacency(n: usize, weighted: &[Edge]) -> Adj {
    let mut adj: Adj = vec![Vec::new(); n];
    for &(u, v, w) in weighted {
        adj[u].push((v, w));
    }
    adj
}

/// The settling deque, and the operations it costs.
fn zero_one_bfs(n: usize, weighted: &[Edge], start: usize) -> (Vec<i64>, u64) {
    let adj = adjacency(n, weighted);
    let mut best = vec![INF; n];
    best[start] = 0;
    let mut done = vec![false; n];
    let mut dq: VecDeque<usize> = VecDeque::new();
    dq.push_back(start);
    let mut ops: u64 = 1;
    while let Some(at) = dq.pop_front() {
        ops += 1;
        if done[at] {
            continue;
        }
        done[at] = true;
        for idx in 0..adj[at].len() {
            let (nxt, w) = adj[at][idx];
            if !done[nxt] && best[at] + w < best[nxt] {
                best[nxt] = best[at] + w;
                ops += 1;
                if w == 0 {
                    dq.push_front(nxt);
                } else {
                    dq.push_back(nxt);
                }
            }
        }
    }
    (best, ops)
}

fn before(a: (i64, usize), b: (i64, usize)) -> bool {
    a.0 < b.0 || (a.0 == b.0 && a.1 < b.1)
}

/// The same answer with a heap, and the comparisons that costs.
fn dijkstra(n: usize, weighted: &[Edge], start: usize) -> (Vec<i64>, u64) {
    let adj = adjacency(n, weighted);
    let mut best = vec![INF; n];
    best[start] = 0;
    let mut done = vec![false; n];
    let mut heap: Vec<(i64, usize)> = vec![(0, start)];
    let mut compares: u64 = 0;

    while !heap.is_empty() {
        let top = heap[0];
        let last = heap.pop().unwrap();
        if !heap.is_empty() {
            heap[0] = last;
            let mut i = 0;
            loop {
                let mut small = i;
                for c in [2 * i + 1, 2 * i + 2] {
                    if c < heap.len() {
                        compares += 1;
                        if before(heap[c], heap[small]) {
                            small = c;
                        }
                    }
                }
                if small == i {
                    break;
                }
                heap.swap(i, small);
                i = small;
            }
        }
        let (cost, at) = top;
        if done[at] {
            continue;
        }
        done[at] = true;
        for idx in 0..adj[at].len() {
            let (nxt, w) = adj[at][idx];
            if !done[nxt] && cost + w < best[nxt] {
                best[nxt] = cost + w;
                heap.push((cost + w, nxt));
                let mut i = heap.len() - 1;
                while i > 0 {
                    let parent = (i - 1) / 2;
                    compares += 1;
                    if !before(heap[i], heap[parent]) {
                        break;
                    }
                    heap.swap(i, parent);
                    i = parent;
                }
            }
        }
    }
    (best, compares)
}

/// The tempting wrong answer: plain BFS with the arrows rubbed out.
fn ignoring_direction(n: usize, edges: &[Arrow], start: usize) -> Vec<i64> {
    let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
    for &(u, v) in edges {
        adj[u].push(v);
        adj[v].push(u);
    }
    let mut out = vec![INF; n];
    out[start] = 0;
    let mut q: VecDeque<usize> = VecDeque::new();
    q.push_back(start);
    while let Some(at) = q.pop_front() {
        for idx in 0..adj[at].len() {
            let nxt = adj[at][idx];
            if out[nxt] == INF {
                out[nxt] = out[at] + 1;
                q.push_back(nxt);
            }
        }
    }
    out
}

fn reverse_walk(
    adj: &[Vec<usize>],
    forward: &HashSet<Arrow>,
    seen: &mut [bool],
    out: &mut [i64],
    at: usize,
    flips: i64,
) {
    seen[at] = true;
    for idx in 0..adj[at].len() {
        let nxt = adj[at][idx];
        if !seen[nxt] {
            let cost = flips + if forward.contains(&(at, nxt)) { 0 } else { 1 };
            if cost < out[nxt] {
                out[nxt] = cost;
            }
            reverse_walk(adj, forward, seen, out, nxt, cost);
        }
    }
    seen[at] = false;
}

/// The oracle, straight from the question.
///
/// Walk every simple path in the undirected graph, count the steps taken
/// against an arrow, keep the smallest count per node. No weights, no
/// transformed graph -- just the problem as asked.
fn by_reversing(n: usize, edges: &[Arrow], start: usize) -> Vec<i64> {
    let forward: HashSet<Arrow> = edges.iter().copied().collect();
    let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
    for &(u, v) in edges {
        adj[u].push(v);
        adj[v].push(u);
    }
    let mut out = vec![INF; n];
    out[start] = 0;
    let mut seen = vec![false; n];
    reverse_walk(&adj, &forward, &mut seen, &mut out, start, 0);
    out
}

fn show(row: &[i64]) -> String {
    let cells: Vec<String> = row
        .iter()
        .map(|&x| if x >= INF { "-".to_string() } else { x.to_string() })
        .collect();
    format!("[{}]", cells.join(", "))
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

fn main() {
    let case_n = [4usize, 4, 5];
    let cases: Vec<Vec<Arrow>> = vec![
        vec![(0, 1), (1, 2), (2, 3)],
        vec![(1, 0), (2, 1), (3, 2)],
        vec![(0, 1), (2, 1), (2, 3), (4, 3), (0, 4)],
    ];

    println!("{:<34} {:<16} {}", "edges", "reversals needed", "hops, arrows ignored");
    for c in 0..cases.len() {
        let (got, _) = zero_one_bfs(case_n[c], &with_reversals(&cases[c]), 0);
        println!(
            "{:<34} {:<16} {}",
            label(&cases[c]),
            show(&got),
            show(&ignoring_direction(case_n[c], &cases[c], 0))
        );
    }

    let mut rng = Rng { seed: 90210 };
    let trials = 3000;
    let (mut deque_ok, mut heap_ok, mut hops_ok) = (0, 0, 0);
    for _ in 0..trials {
        let n = 2 + rng.next(5) as usize;
        let mut edges: Vec<Arrow> = Vec::new();
        for u in 0..n {
            for v in (u + 1)..n {
                if rng.next(2) == 0 {
                    if rng.next(2) == 0 {
                        edges.push((u, v));
                    } else {
                        edges.push((v, u));
                    }
                }
            }
        }
        let truth = by_reversing(n, &edges, 0);
        let weighted = with_reversals(&edges);
        let (a, _) = zero_one_bfs(n, &weighted, 0);
        let (b, _) = dijkstra(n, &weighted, 0);
        if a == truth {
            deque_ok += 1;
        }
        if b == truth {
            heap_ok += 1;
        }
        if ignoring_direction(n, &edges, 0) == truth {
            hops_ok += 1;
        }
    }

    println!();
    println!("over {} random directed graphs on up to 6 nodes:", trials);
    println!("  0-1 BFS on the built graph matched the");
    println!("    fewest reversals, found by walking     {:>6}", deque_ok);
    println!("  Dijkstra on the built graph matched it   {:>6}", heap_ok);
    println!("  plain BFS with the arrows ignored        {:>6}", hops_ok);

    println!();
    println!("and what the two frontiers cost on a bigger version:");
    println!("{:<7} {:<9} {:>13} {:>15}", "nodes", "shape", "deque ops", "heap compares");
    for &side in &[20usize, 30, 40] {
        let n = side * side;
        let mut edges: Vec<Arrow> = Vec::new();
        for r in 0..side {
            for c in 0..side {
                let here = r * side + c;
                if c + 1 < side {
                    if (r + c) % 3 != 0 {
                        edges.push((here, here + 1));
                    } else {
                        edges.push((here + 1, here));
                    }
                }
                if r + 1 < side {
                    if (r + c) % 2 != 0 {
                        edges.push((here, here + side));
                    } else {
                        edges.push((here + side, here));
                    }
                }
            }
        }
        let weighted = with_reversals(&edges);
        let (_, ops) = zero_one_bfs(n, &weighted, 0);
        let (_, compares) = dijkstra(n, &weighted, 0);
        println!("{:<7} {:<9} {:>13} {:>15}", n, "grid", ops, compares);
    }

    println!();
    println!("The first two rows are the same path twice. Pointing the right way it");
    println!("costs nothing to reach the end; pointing the wrong way it costs three");
    println!("reversals -- and the hops column reads 3 either way, because counting");
    println!("edges is a different question.");
    println!();
    println!("Row three is where the two columns disagree in shape and not just in");
    println!("value. Nodes 2 and 3 are both two hops out, but node 3 is free and node");
    println!("2 is the only node in the graph that needs a reversal at all. Rubbing");
    println!(
        "the arrows out agreed with the real answer on {} of {} graphs.",
        hops_ok, trials
    );
    println!();
    println!("The modelling is the entire trick. Nothing searches over which edges to");
    println!("flip; the cost of flipping is folded into the graph as a weight, and");
    println!("then it is a shortest-path problem with weights 0 and 1. Dijkstra gets");
    println!("the same answers -- it is not wrong, just paying for a heap it does not");
    println!("need. The rule to carry: when a problem has two kinds of move, one free");
    println!("and one that costs a unit, it is a 0-1 graph and the deque is enough.");
}
`,
            },
            {
              lang: "go",
              code: `// The payoff: problems that are 0-1 graphs and do not look like it.
//
// "What is the fewest edges I have to reverse so that every node is reachable
// from node 0?" There is no obvious weight in that question, and no obvious
// graph either -- the graph in the problem is the one whose edges are being
// changed. The move is to build a different graph.
//
// For every directed edge u -> v, add u -> v costing 0 (use it as it is) and
// v -> u costing 1 (reverse it). A route in the new graph is a route in the old
// one, and its cost is the number of edges it needed reversed. Every weight is
// 0 or 1, so this is 0-1 BFS -- no heap, and no search over which edges to flip.
package main

import (
	"fmt"
	"strings"
)

const INF = 1000000000

// Arrow is a directed edge of the original graph.
type Arrow struct {
	U, V int
}

// Edge is a directed edge with a weight, in the graph that gets built.
type Edge struct {
	U, V, W int
}

// withReversals makes going forwards free and turning an edge around cost one.
func withReversals(edges []Arrow) []Edge {
	out := make([]Edge, 0, 2*len(edges))
	for _, e := range edges {
		out = append(out, Edge{e.U, e.V, 0})
		out = append(out, Edge{e.V, e.U, 1})
	}
	return out
}

func adjacency(n int, weighted []Edge) [][][2]int {
	adj := make([][][2]int, n)
	for _, e := range weighted {
		adj[e.U] = append(adj[e.U], [2]int{e.V, e.W})
	}
	return adj
}

// deque holds one array with a head and a tail index, so pushing at either end
// is O(1). Room is reserved for every push the search can make.
type deque struct {
	buf        []int
	head, tail int
}

func newDeque(room int) *deque {
	return &deque{buf: make([]int, 2*room+2), head: room + 1, tail: room + 1}
}

func (d *deque) pushFront(x int) {
	d.head--
	d.buf[d.head] = x
}

func (d *deque) pushBack(x int) {
	d.buf[d.tail] = x
	d.tail++
}

func (d *deque) popFront() int {
	x := d.buf[d.head]
	d.head++
	return x
}

func (d *deque) size() int { return d.tail - d.head }

// zeroOneBfs is the settling deque, and the operations it costs.
func zeroOneBfs(n int, weighted []Edge, start int) ([]int, int64) {
	adj := adjacency(n, weighted)
	best := make([]int, n)
	for i := range best {
		best[i] = INF
	}
	best[start] = 0
	done := make([]bool, n)
	dq := newDeque(len(weighted) + 1)
	dq.pushBack(start)
	var ops int64 = 1
	for dq.size() > 0 {
		at := dq.popFront()
		ops++
		if done[at] {
			continue
		}
		done[at] = true
		for _, step := range adj[at] {
			if !done[step[0]] && best[at]+step[1] < best[step[0]] {
				best[step[0]] = best[at] + step[1]
				ops++
				if step[1] == 0 {
					dq.pushFront(step[0])
				} else {
					dq.pushBack(step[0])
				}
			}
		}
	}
	return best, ops
}

func before(a, b [2]int) bool {
	return a[0] < b[0] || (a[0] == b[0] && a[1] < b[1])
}

// dijkstra gives the same answer with a heap, and the comparisons that costs.
func dijkstra(n int, weighted []Edge, start int) ([]int, int64) {
	adj := adjacency(n, weighted)
	best := make([]int, n)
	for i := range best {
		best[i] = INF
	}
	best[start] = 0
	done := make([]bool, n)
	heap := [][2]int{{0, start}}
	var compares int64

	push := func(item [2]int) {
		heap = append(heap, item)
		i := len(heap) - 1
		for i > 0 {
			parent := (i - 1) / 2
			compares++
			if !before(heap[i], heap[parent]) {
				break
			}
			heap[i], heap[parent] = heap[parent], heap[i]
			i = parent
		}
	}

	pop := func() [2]int {
		top := heap[0]
		last := heap[len(heap)-1]
		heap = heap[:len(heap)-1]
		if len(heap) > 0 {
			heap[0] = last
			i := 0
			for {
				small := i
				for _, c := range []int{2*i + 1, 2*i + 2} {
					if c < len(heap) {
						compares++
						if before(heap[c], heap[small]) {
							small = c
						}
					}
				}
				if small == i {
					break
				}
				heap[i], heap[small] = heap[small], heap[i]
				i = small
			}
		}
		return top
	}

	for len(heap) > 0 {
		top := pop()
		cost, at := top[0], top[1]
		if done[at] {
			continue
		}
		done[at] = true
		for _, step := range adj[at] {
			if !done[step[0]] && cost+step[1] < best[step[0]] {
				best[step[0]] = cost + step[1]
				push([2]int{cost + step[1], step[0]})
			}
		}
	}
	return best, compares
}

// ignoringDirection is the tempting wrong answer: plain BFS with the arrows
// rubbed out.
func ignoringDirection(n int, edges []Arrow, start int) []int {
	adj := make([][]int, n)
	for _, e := range edges {
		adj[e.U] = append(adj[e.U], e.V)
		adj[e.V] = append(adj[e.V], e.U)
	}
	out := make([]int, n)
	for i := range out {
		out[i] = INF
	}
	out[start] = 0
	q := []int{start}
	for len(q) > 0 {
		at := q[0]
		q = q[1:]
		for _, nxt := range adj[at] {
			if out[nxt] == INF {
				out[nxt] = out[at] + 1
				q = append(q, nxt)
			}
		}
	}
	return out
}

func reverseWalk(adj [][]int, forward map[Arrow]bool, seen []bool, out []int, at, flips int) {
	seen[at] = true
	for _, nxt := range adj[at] {
		if !seen[nxt] {
			cost := flips
			if !forward[Arrow{at, nxt}] {
				cost++
			}
			if cost < out[nxt] {
				out[nxt] = cost
			}
			reverseWalk(adj, forward, seen, out, nxt, cost)
		}
	}
	seen[at] = false
}

// byReversing is the oracle, straight from the question.
//
// Walk every simple path in the undirected graph, count the steps taken
// against an arrow, keep the smallest count per node. No weights, no
// transformed graph -- just the problem as asked.
func byReversing(n int, edges []Arrow, start int) []int {
	forward := map[Arrow]bool{}
	adj := make([][]int, n)
	for _, e := range edges {
		forward[e] = true
		adj[e.U] = append(adj[e.U], e.V)
		adj[e.V] = append(adj[e.V], e.U)
	}
	out := make([]int, n)
	for i := range out {
		out[i] = INF
	}
	out[start] = 0
	reverseWalk(adj, forward, make([]bool, n), out, start, 0)
	return out
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
		if x >= INF {
			cells[i] = "-"
		} else {
			cells[i] = fmt.Sprint(x)
		}
	}
	return "[" + strings.Join(cells, ", ") + "]"
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
var seed int64 = 90210

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	caseN := []int{4, 4, 5}
	cases := [][]Arrow{
		{{0, 1}, {1, 2}, {2, 3}},
		{{1, 0}, {2, 1}, {3, 2}},
		{{0, 1}, {2, 1}, {2, 3}, {4, 3}, {0, 4}},
	}

	fmt.Printf("%-34s %-16s %s\\n", "edges", "reversals needed", "hops, arrows ignored")
	for c := range cases {
		got, _ := zeroOneBfs(caseN[c], withReversals(cases[c]), 0)
		fmt.Printf("%-34s %-16s %s\\n", label(cases[c]), show(got),
			show(ignoringDirection(caseN[c], cases[c], 0)))
	}

	trials := 3000
	dequeOk, heapOk, hopsOk := 0, 0, 0
	for t := 0; t < trials; t++ {
		n := 2 + randBelow(5)
		var edges []Arrow
		for u := 0; u < n; u++ {
			for v := u + 1; v < n; v++ {
				if randBelow(2) == 0 {
					if randBelow(2) == 0 {
						edges = append(edges, Arrow{u, v})
					} else {
						edges = append(edges, Arrow{v, u})
					}
				}
			}
		}
		truth := byReversing(n, edges, 0)
		weighted := withReversals(edges)
		a, _ := zeroOneBfs(n, weighted, 0)
		b, _ := dijkstra(n, weighted, 0)
		if same(a, truth) {
			dequeOk++
		}
		if same(b, truth) {
			heapOk++
		}
		if same(ignoringDirection(n, edges, 0), truth) {
			hopsOk++
		}
	}

	fmt.Println()
	fmt.Printf("over %d random directed graphs on up to 6 nodes:\\n", trials)
	fmt.Println("  0-1 BFS on the built graph matched the")
	fmt.Printf("    fewest reversals, found by walking     %6d\\n", dequeOk)
	fmt.Printf("  Dijkstra on the built graph matched it   %6d\\n", heapOk)
	fmt.Printf("  plain BFS with the arrows ignored        %6d\\n", hopsOk)

	fmt.Println()
	fmt.Println("and what the two frontiers cost on a bigger version:")
	fmt.Printf("%-7s %-9s %13s %15s\\n", "nodes", "shape", "deque ops", "heap compares")
	for _, side := range []int{20, 30, 40} {
		n := side * side
		var edges []Arrow
		for r := 0; r < side; r++ {
			for c := 0; c < side; c++ {
				here := r*side + c
				if c+1 < side {
					if (r+c)%3 != 0 {
						edges = append(edges, Arrow{here, here + 1})
					} else {
						edges = append(edges, Arrow{here + 1, here})
					}
				}
				if r+1 < side {
					if (r+c)%2 != 0 {
						edges = append(edges, Arrow{here, here + side})
					} else {
						edges = append(edges, Arrow{here + side, here})
					}
				}
			}
		}
		weighted := withReversals(edges)
		_, ops := zeroOneBfs(n, weighted, 0)
		_, compares := dijkstra(n, weighted, 0)
		fmt.Printf("%-7d %-9s %13d %15d\\n", n, "grid", ops, compares)
	}

	fmt.Println()
	fmt.Println("The first two rows are the same path twice. Pointing the right way it")
	fmt.Println("costs nothing to reach the end; pointing the wrong way it costs three")
	fmt.Println("reversals -- and the hops column reads 3 either way, because counting")
	fmt.Println("edges is a different question.")
	fmt.Println()
	fmt.Println("Row three is where the two columns disagree in shape and not just in")
	fmt.Println("value. Nodes 2 and 3 are both two hops out, but node 3 is free and node")
	fmt.Println("2 is the only node in the graph that needs a reversal at all. Rubbing")
	fmt.Printf("the arrows out agreed with the real answer on %d of %d graphs.\\n", hopsOk, trials)
	fmt.Println()
	fmt.Println("The modelling is the entire trick. Nothing searches over which edges to")
	fmt.Println("flip; the cost of flipping is folded into the graph as a weight, and")
	fmt.Println("then it is a shortest-path problem with weights 0 and 1. Dijkstra gets")
	fmt.Println("the same answers -- it is not wrong, just paying for a heap it does not")
	fmt.Println("need. The rule to carry: when a problem has two kinds of move, one free")
	fmt.Println("and one that costs a unit, it is a 0-1 graph and the deque is enough.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Searching over which edges to reverse",
          body: "Nothing has to. Fold the cost of reversing into the graph -- 0 forwards, 1 backwards -- and the shortest path is the minimum number of reversals. The search over subsets disappears into the weights.",
        },
        {
          title: "Rubbing the arrows out and running plain BFS",
          body: "It answers a different question: fewest edges on the route, not fewest reversals. It agreed with the real answer on 1,092 of 3,000 random graphs, and the demo's third row shows two nodes at the same hop count with different reversal costs.",
        },
      ],
    },
    {
      id: "zero-one-bfs-in-four-lines",
      heading: "0-1 BFS in four lines",
      body: [
        "0-1 BFS, in four lines.",
        "**The frontier holds two distances, so the front of a deque is the nearest node.** Measured on every pop of 3,000 graphs: never more than 2 distinct distances in the queue.",
        "**It still settles**, which is why it is Dijkstra and not BFS-with-weights — and why it is wrong the moment a weight is 2, on 33 of 3,000 graphs, always reporting too high.",
        "**A deque is two buckets.** `k + 1` buckets indexed by distance modulo `k + 1` handles weights 0 to `k`, and the step count barely moves from `k = 1` to `k = 15`.",
        "**Two kinds of move, one free and one costing a unit, is a 0-1 graph.** Minimum edge reversals falls out with no search over which edges to flip.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why can a deque replace the priority queue when weights are 0 and 1?",
      answer:
        "Because the heap's only job is to say which discovered node is nearest, and with weights 0 and 1 the frontier holds at most two distinct distances -- a 0 edge reaches a node at the same distance as its parent, a 1 edge one further. Push front for 0 and back for 1 and the deque is sorted by construction, so the front is a nearest node. I measured that invariant rather than assuming it: over 3,000 random graphs, on every pop, the deque never held more than two distinct distances, and the answers matched both an exhaustive walk over every simple path and Dijkstra on all 3,000. The important part is that it still settles -- the node popped from the front is final -- so it is Dijkstra with a cheaper queue, not breadth-first search with weights bolted on.",
    },
    {
      question: "What happens if a weight of 2 sneaks into a 0-1 BFS?",
      answer:
        "It depends which version you wrote, and both answers are worth knowing. If it settles -- pops, declares final, never revisits -- it goes wrong: a node at d+2 pushed to the back sits among the nodes at d+1, so the queue is no longer sorted and a node can be settled too early. Over 3,000 random graphs with weights 0, 1 and 2 it matched the truth on 2,967, and the 44 wrong entries were all too high, never too low, so nothing looks impossible. The smallest case is three nodes: 0 to 1 costs 2, 0 to 2 costs 1, 2 to 1 costs 0, and it reports 2 where the answer is 1. If instead you dropped the settle and re-examine on every improvement, it stays correct -- it has become Bellman-Ford with an opinionated queue -- but you have lost the linear bound, and I measured a node scanning its edges three times where the settling version is capped at one.",
    },
    {
      question: "How would you handle weights from 0 to k?",
      answer:
        "With the same idea, widened. A deque is two buckets. Use k+1 buckets indexed by distance modulo k+1 and every live distance still lands in its own bucket, because the frontier only ever spans the window from d to d+k -- exactly k+1 values. That is Dial's algorithm, and 0-1 BFS is its k=1 case with the front and back written out. It matched an exhaustive walk on all 3,000 random graphs I tested, and its step count barely moves as k goes from 1 to 15, while the heap keeps paying for comparisons. The catch is that it wants small integer weights; once k is large the buckets stop being cheap and I would go back to a heap.",
    },
    {
      question: "Give an example of a problem that is a 0-1 graph without looking like one.",
      answer:
        "The fewest edges you have to reverse so everything is reachable from a start node. There is no weight in the question, and the graph being changed is the graph in the problem, so a search over which edges to flip looks unavoidable. It is not. Build a second graph: for every directed edge u to v, add u to v costing 0 and v to u costing 1. A route in that graph is a route in the original, and its cost is the number of reversals it needed. Now it is 0-1 BFS. It matched an oracle that walks every simple path counting steps taken against an arrow on all 3,000 random graphs. The tempting alternative -- rub the arrows out and run plain BFS -- answers a different question and agreed on only 1,092 of them. The general rule is that two kinds of move, one free and one costing a unit, is a 0-1 graph.",
    },
  ],
  takeaways: [
    "With weights 0 and 1 the frontier holds two distances, so a deque is a sorted priority queue.",
    "Measured on every pop of 3,000 graphs: never more than 2 distinct distances in the deque.",
    "It still settles, which is what makes it Dijkstra rather than BFS with weights.",
    "The saving appears when the frontier is wide: 3,200 deque operations against 15,587 heap comparisons on a grid.",
    "On a chain the heap costs nothing and the deque wins nothing — an honest tie.",
    "A weight of 2 breaks the settling version on 33 of 3,000 graphs, always reporting too high.",
    "Dropping the settle keeps it correct and loses the bound — one node scanned its edges 3 times.",
    "A deque is two buckets; `k + 1` buckets handles weights 0 to `k`. That is Dial's algorithm.",
    "Minimum edge reversals is 0-1 BFS on a built graph: 0 forwards, 1 backwards.",
    "Plain BFS with the arrows ignored answers a different question — right on 1,092 of 3,000.",
  ],
  status: "available",
};
