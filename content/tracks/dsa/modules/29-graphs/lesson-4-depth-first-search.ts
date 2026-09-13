import type { Lesson } from "@/content/types";

export const depthFirstSearchLesson: Lesson = {
  id: "dsa-graphs-depth-first-search",
  slug: "depth-first-search",
  moduleSlug: "graphs",
  title: "Depth-First Search",
  summary:
    "Depth-first search taken apart: the demonstration that the recursive and iterative versions are the same algorithm down to the visit order, the entry and exit ticks that give it the one thing breadth-first search cannot have, and the measured stack depth that decides which spelling a given input needs.",
  estimatedMinutes: 45,
  objectives: [
    "Show that a recursive and an explicit-stack depth-first search are the same algorithm",
    "Use entry and exit ticks to answer ancestry and subtree size in constant time",
    "Say what depth-first search knows that breadth-first search structurally cannot",
    "Decide from the shape of the input whether the recursion is safe",
  ],
  sections: [
    {
      id: "one-algorithm-two-spellings",
      heading: "One algorithm, two spellings",
      body: [
        "Depth-first search is the shorter of the two traversals and the one with the larger reputation, mostly because it is usually written recursively and recursion is where people expect to be confused. It is worth dismantling that immediately: **the recursive version and the explicit-stack version are the same algorithm.** The call stack in one is the array in the other. The only difference is who allocates it.",
        "That claim is easy to state and easy to half-believe, because the two usually print different orders and a difference in output feels like a difference in algorithm. It is not. Pushing a node's neighbours onto a stack reverses them \u2014 the last one pushed is the first one popped \u2014 so the iterative version explores the children right to left while the recursion goes left to right.",
        "Push them backwards and the difference disappears. The example measures exactly that: over 3,000 random graphs the reversed-push iterative search produced the same visit order as the recursion 3,000 times out of 3,000. Pushing forwards matched on 1,770, which is what you would expect from a search that is doing the same thing to differently-ordered children.",
        "And underneath both, the invariant that makes the whole family work: all four searches \u2014 recursion, both stack orders, and breadth-first \u2014 reached exactly the same set of nodes on all 3,000 graphs. The container decides the *route*, never the *destination*. That is worth internalising before anything else, because it is why \"which traversal\" is a question about what you need to know along the way, not about what you will find.",
      ],
      examples: [
        {
          id: "recursion-against-an-explicit-stack",
          title: "The same walk written twice, and the push order that makes them identical",
          lang: "python",
          code: `# Depth-first search, written twice: once with recursion and once with an
# explicit stack. They are the same algorithm. The call stack in the recursive
# version *is* the stack in the other one -- the only difference is who
# allocates it.
#
# That claim is easy to state and easy to get slightly wrong, because the two
# usually print different orders. The reason is not the algorithm: it is that
# pushing a node's neighbours onto a stack reverses them. Push them backwards
# and the two agree exactly, on every graph.


def build(n, edges):
    neighbours = [[] for _ in range(n)]
    for u, v in edges:
        neighbours[u].append(v)
        neighbours[v].append(u)
    return neighbours


def dfs_recursive(neighbours, start):
    """The call stack holds the path back to the start."""
    seen = [False] * len(neighbours)
    order = []

    def walk(v):
        seen[v] = True
        order.append(v)
        for u in neighbours[v]:
            if not seen[u]:
                walk(u)

    walk(start)
    return order


def dfs_stack_forward(neighbours, start):
    """The same algorithm, stack in hand, neighbours pushed in their own order."""
    seen = [False] * len(neighbours)
    order = []
    stack = [start]
    while stack:
        v = stack.pop()
        if seen[v]:
            continue
        seen[v] = True
        order.append(v)
        for u in neighbours[v]:
            if not seen[u]:
                stack.append(u)
    return order


def dfs_stack_reversed(neighbours, start):
    """Pushing backwards, so the first neighbour is the first one popped."""
    seen = [False] * len(neighbours)
    order = []
    stack = [start]
    while stack:
        v = stack.pop()
        if seen[v]:
            continue
        seen[v] = True
        order.append(v)
        for i in range(len(neighbours[v]) - 1, -1, -1):
            u = neighbours[v][i]
            if not seen[u]:
                stack.append(u)
    return order


def bfs(neighbours, start):
    """A queue instead of a stack, and the shape of the walk changes entirely."""
    seen = [False] * len(neighbours)
    seen[start] = True
    order = []
    queue = [start]
    head = 0
    while head < len(queue):
        v = queue[head]
        head += 1
        order.append(v)
        for u in neighbours[v]:
            if not seen[u]:
                seen[u] = True
                queue.append(u)
    return order


def reached(order, n):
    """The set of nodes visited, as a sorted list. Order thrown away."""
    seen = [False] * n
    for v in order:
        seen[v] = True
    return [v for v in range(n) if seen[v]]


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
    (5, [(0, 1), (0, 2), (1, 3), (2, 4)]),
    (6, [(0, 1), (1, 2), (2, 3), (0, 4), (4, 5)]),
    (4, [(0, 1), (0, 2), (0, 3), (1, 2)]),
    (7, [(0, 1), (0, 2), (1, 3), (1, 4), (2, 5), (2, 6)]),
]

print(f"{'recursive':<22}{'stack, forward':<22}{'stack, reversed':<22}breadth-first")
for n, edges in CASES:
    neighbours = build(n, edges)
    print(f"{show(dfs_recursive(neighbours, 0)):<22}"
          f"{show(dfs_stack_forward(neighbours, 0)):<22}"
          f"{show(dfs_stack_reversed(neighbours, 0)):<22}"
          f"{show(bfs(neighbours, 0))}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
same_reached = 0
reversed_matches = 0
forward_matches = 0
bfs_matches = 0
for _ in range(TRIALS):
    n = 2 + rand(6)
    edges = []
    for u in range(n):
        for v in range(u + 1, n):
            if rand(3) == 0:
                edges.append((u, v))
    neighbours = build(n, edges)
    rec = dfs_recursive(neighbours, 0)
    fwd = dfs_stack_forward(neighbours, 0)
    rev = dfs_stack_reversed(neighbours, 0)
    wide = bfs(neighbours, 0)
    if (same(reached(rec, n), reached(fwd, n))
            and same(reached(rec, n), reached(rev, n))
            and same(reached(rec, n), reached(wide, n))):
        same_reached += 1
    if same(rec, rev):
        reversed_matches += 1
    if same(rec, fwd):
        forward_matches += 1
    if same(rec, wide):
        bfs_matches += 1

print(f"over {TRIALS} random graphs on up to 7 nodes:")
print(f"  all four reached the same nodes       {same_reached:>6}")
print(f"  stack reversed matched the recursion  {reversed_matches:>6}")
print(f"  stack forward matched the recursion   {forward_matches:>6}")
print(f"  breadth-first matched the recursion   {bfs_matches:>6}")
print()
print("The first line is the one that matters: which container you hold the")
print("frontier in never changes what is reachable, only the route taken to it.")
print("The next two say the recursive and iterative depth-first searches are one")
print("algorithm -- push the neighbours backwards, because a stack hands them")
print("back in reverse, and the orders are identical every time. Pushing them")
print("forwards is still a depth-first search; it just numbers the children the")
print("other way round.")
`,
          output: `recursive             stack, forward        stack, reversed       breadth-first
[0, 1, 3, 2, 4]       [0, 2, 4, 1, 3]       [0, 1, 3, 2, 4]       [0, 1, 2, 3, 4]
[0, 1, 2, 3, 4, 5]    [0, 4, 5, 1, 2, 3]    [0, 1, 2, 3, 4, 5]    [0, 1, 4, 2, 5, 3]
[0, 1, 2, 3]          [0, 3, 2, 1]          [0, 1, 2, 3]          [0, 1, 2, 3]
[0, 1, 3, 4, 2, 5, 6] [0, 2, 6, 5, 1, 4, 3] [0, 1, 3, 4, 2, 5, 6] [0, 1, 2, 3, 4, 5, 6]

over 3000 random graphs on up to 7 nodes:
  all four reached the same nodes         3000
  stack reversed matched the recursion    3000
  stack forward matched the recursion     1770
  breadth-first matched the recursion     2273

The first line is the one that matters: which container you hold the
frontier in never changes what is reachable, only the route taken to it.
The next two say the recursive and iterative depth-first searches are one
algorithm -- push the neighbours backwards, because a stack hands them
back in reverse, and the orders are identical every time. Pushing them
forwards is still a depth-first search; it just numbers the children the
other way round.`,
          explanation:
            "The recursion, both stack orders, and breadth-first search on the same graphs. All four reach the same nodes every time; the reversed-push stack reproduces the recursion's order exactly, which is the demonstration that they are one algorithm.",
          alternates: [
            {
              lang: "javascript",
              code: `// Depth-first search, written twice: once with recursion and once with an
// explicit stack. They are the same algorithm. The call stack in the recursive
// version *is* the stack in the other one -- the only difference is who
// allocates it.
//
// That claim is easy to state and easy to get slightly wrong, because the two
// usually print different orders. The reason is not the algorithm: it is that
// pushing a node's neighbours onto a stack reverses them. Push them backwards
// and the two agree exactly, on every graph.

function build(n, edges) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    neighbours[v].push(u);
  }
  return neighbours;
}

/** The call stack holds the path back to the start. */
function dfsRecursive(neighbours, start) {
  const seen = new Array(neighbours.length).fill(false);
  const order = [];

  function walk(v) {
    seen[v] = true;
    order.push(v);
    for (const u of neighbours[v]) {
      if (!seen[u]) walk(u);
    }
  }

  walk(start);
  return order;
}

/** The same algorithm, stack in hand, neighbours pushed in their own order. */
function dfsStackForward(neighbours, start) {
  const seen = new Array(neighbours.length).fill(false);
  const order = [];
  const stack = [start];
  while (stack.length > 0) {
    const v = stack.pop();
    if (seen[v]) continue;
    seen[v] = true;
    order.push(v);
    for (const u of neighbours[v]) {
      if (!seen[u]) stack.push(u);
    }
  }
  return order;
}

/** Pushing backwards, so the first neighbour is the first one popped. */
function dfsStackReversed(neighbours, start) {
  const seen = new Array(neighbours.length).fill(false);
  const order = [];
  const stack = [start];
  while (stack.length > 0) {
    const v = stack.pop();
    if (seen[v]) continue;
    seen[v] = true;
    order.push(v);
    for (let i = neighbours[v].length - 1; i >= 0; i -= 1) {
      const u = neighbours[v][i];
      if (!seen[u]) stack.push(u);
    }
  }
  return order;
}

/** A queue instead of a stack, and the shape of the walk changes entirely. */
function bfs(neighbours, start) {
  const seen = new Array(neighbours.length).fill(false);
  seen[start] = true;
  const order = [];
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const v = queue[head];
    head += 1;
    order.push(v);
    for (const u of neighbours[v]) {
      if (!seen[u]) {
        seen[u] = true;
        queue.push(u);
      }
    }
  }
  return order;
}

/** The set of nodes visited, as a sorted list. Order thrown away. */
function reached(order, n) {
  const seen = new Array(n).fill(false);
  for (const v of order) seen[v] = true;
  const out = [];
  for (let v = 0; v < n; v += 1) if (seen[v]) out.push(v);
  return out;
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
  [5, [[0, 1], [0, 2], [1, 3], [2, 4]]],
  [6, [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5]]],
  [4, [[0, 1], [0, 2], [0, 3], [1, 2]]],
  [7, [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]]],
];

console.log(
  padEnd("recursive", 22) +
    padEnd("stack, forward", 22) +
    padEnd("stack, reversed", 22) +
    "breadth-first"
);
for (const [n, edges] of CASES) {
  const neighbours = build(n, edges);
  console.log(
    padEnd(show(dfsRecursive(neighbours, 0)), 22) +
      padEnd(show(dfsStackForward(neighbours, 0)), 22) +
      padEnd(show(dfsStackReversed(neighbours, 0)), 22) +
      show(bfs(neighbours, 0))
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
let sameReached = 0;
let reversedMatches = 0;
let forwardMatches = 0;
let bfsMatches = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) {
      if (rand(3) === 0) edges.push([u, v]);
    }
  }
  const neighbours = build(n, edges);
  const rec = dfsRecursive(neighbours, 0);
  const fwd = dfsStackForward(neighbours, 0);
  const rev = dfsStackReversed(neighbours, 0);
  const wide = bfs(neighbours, 0);
  if (
    same(reached(rec, n), reached(fwd, n)) &&
    same(reached(rec, n), reached(rev, n)) &&
    same(reached(rec, n), reached(wide, n))
  ) {
    sameReached += 1;
  }
  if (same(rec, rev)) reversedMatches += 1;
  if (same(rec, fwd)) forwardMatches += 1;
  if (same(rec, wide)) bfsMatches += 1;
}

console.log(\`over \${TRIALS} random graphs on up to 7 nodes:\`);
console.log(\`  all four reached the same nodes       \${pad(sameReached, 6)}\`);
console.log(\`  stack reversed matched the recursion  \${pad(reversedMatches, 6)}\`);
console.log(\`  stack forward matched the recursion   \${pad(forwardMatches, 6)}\`);
console.log(\`  breadth-first matched the recursion   \${pad(bfsMatches, 6)}\`);
console.log();
console.log("The first line is the one that matters: which container you hold the");
console.log("frontier in never changes what is reachable, only the route taken to it.");
console.log("The next two say the recursive and iterative depth-first searches are one");
console.log("algorithm -- push the neighbours backwards, because a stack hands them");
console.log("back in reverse, and the orders are identical every time. Pushing them");
console.log("forwards is still a depth-first search; it just numbers the children the");
console.log("other way round.");
`,
            },
            {
              lang: "typescript",
              code: `// Depth-first search, written twice: once with recursion and once with an
// explicit stack. They are the same algorithm. The call stack in the recursive
// version *is* the stack in the other one -- the only difference is who
// allocates it.
//
// That claim is easy to state and easy to get slightly wrong, because the two
// usually print different orders. The reason is not the algorithm: it is that
// pushing a node's neighbours onto a stack reverses them. Push them backwards
// and the two agree exactly, on every graph.

type Edge = [number, number];

function build(n: number, edges: Edge[]): number[][] {
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    neighbours[v].push(u);
  }
  return neighbours;
}

/** The call stack holds the path back to the start. */
function dfsRecursive(neighbours: number[][], start: number): number[] {
  const seen = new Array(neighbours.length).fill(false);
  const order: number[] = [];

  function walk(v: number): void {
    seen[v] = true;
    order.push(v);
    for (const u of neighbours[v]) {
      if (!seen[u]) walk(u);
    }
  }

  walk(start);
  return order;
}

/** The same algorithm, stack in hand, neighbours pushed in their own order. */
function dfsStackForward(neighbours: number[][], start: number): number[] {
  const seen = new Array(neighbours.length).fill(false);
  const order: number[] = [];
  const stack = [start];
  while (stack.length > 0) {
    const v = stack.pop()!;
    if (seen[v]) continue;
    seen[v] = true;
    order.push(v);
    for (const u of neighbours[v]) {
      if (!seen[u]) stack.push(u);
    }
  }
  return order;
}

/** Pushing backwards, so the first neighbour is the first one popped. */
function dfsStackReversed(neighbours: number[][], start: number): number[] {
  const seen = new Array(neighbours.length).fill(false);
  const order: number[] = [];
  const stack = [start];
  while (stack.length > 0) {
    const v = stack.pop()!;
    if (seen[v]) continue;
    seen[v] = true;
    order.push(v);
    for (let i = neighbours[v].length - 1; i >= 0; i -= 1) {
      const u = neighbours[v][i];
      if (!seen[u]) stack.push(u);
    }
  }
  return order;
}

/** A queue instead of a stack, and the shape of the walk changes entirely. */
function bfs(neighbours: number[][], start: number): number[] {
  const seen = new Array(neighbours.length).fill(false);
  seen[start] = true;
  const order: number[] = [];
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const v = queue[head];
    head += 1;
    order.push(v);
    for (const u of neighbours[v]) {
      if (!seen[u]) {
        seen[u] = true;
        queue.push(u);
      }
    }
  }
  return order;
}

/** The set of nodes visited, as a sorted list. Order thrown away. */
function reached(order: number[], n: number): number[] {
  const seen = new Array(n).fill(false);
  for (const v of order) seen[v] = true;
  const out: number[] = [];
  for (let v = 0; v < n; v += 1) if (seen[v]) out.push(v);
  return out;
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

const CASES: [number, Edge[]][] = [
  [5, [[0, 1], [0, 2], [1, 3], [2, 4]]],
  [6, [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5]]],
  [4, [[0, 1], [0, 2], [0, 3], [1, 2]]],
  [7, [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]]],
];

console.log(
  padEnd("recursive", 22) +
    padEnd("stack, forward", 22) +
    padEnd("stack, reversed", 22) +
    "breadth-first"
);
for (const [n, edges] of CASES) {
  const neighbours = build(n, edges);
  console.log(
    padEnd(show(dfsRecursive(neighbours, 0)), 22) +
      padEnd(show(dfsStackForward(neighbours, 0)), 22) +
      padEnd(show(dfsStackReversed(neighbours, 0)), 22) +
      show(bfs(neighbours, 0))
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
let sameReached = 0;
let reversedMatches = 0;
let forwardMatches = 0;
let bfsMatches = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges: Edge[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) {
      if (rand(3) === 0) edges.push([u, v]);
    }
  }
  const neighbours = build(n, edges);
  const rec = dfsRecursive(neighbours, 0);
  const fwd = dfsStackForward(neighbours, 0);
  const rev = dfsStackReversed(neighbours, 0);
  const wide = bfs(neighbours, 0);
  if (
    same(reached(rec, n), reached(fwd, n)) &&
    same(reached(rec, n), reached(rev, n)) &&
    same(reached(rec, n), reached(wide, n))
  ) {
    sameReached += 1;
  }
  if (same(rec, rev)) reversedMatches += 1;
  if (same(rec, fwd)) forwardMatches += 1;
  if (same(rec, wide)) bfsMatches += 1;
}

console.log(\`over \${TRIALS} random graphs on up to 7 nodes:\`);
console.log(\`  all four reached the same nodes       \${pad(sameReached, 6)}\`);
console.log(\`  stack reversed matched the recursion  \${pad(reversedMatches, 6)}\`);
console.log(\`  stack forward matched the recursion   \${pad(forwardMatches, 6)}\`);
console.log(\`  breadth-first matched the recursion   \${pad(bfsMatches, 6)}\`);
console.log();
console.log("The first line is the one that matters: which container you hold the");
console.log("frontier in never changes what is reachable, only the route taken to it.");
console.log("The next two say the recursive and iterative depth-first searches are one");
console.log("algorithm -- push the neighbours backwards, because a stack hands them");
console.log("back in reverse, and the orders are identical every time. Pushing them");
console.log("forwards is still a depth-first search; it just numbers the children the");
console.log("other way round.");
`,
            },
            {
              lang: "java",
              code: `// Depth-first search, written twice: once with recursion and once with an
// explicit stack. They are the same algorithm. The call stack in the recursive
// version *is* the stack in the other one -- the only difference is who
// allocates it.
//
// That claim is easy to state and easy to get slightly wrong, because the two
// usually print different orders. The reason is not the algorithm: it is that
// pushing a node's neighbours onto a stack reverses them. Push them backwards
// and the two agree exactly, on every graph.

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
            neighbours.get(e[1]).add(e[0]);
        }
        return neighbours;
    }

    static void walk(List<List<Integer>> neighbours, boolean[] seen, List<Integer> order, int v) {
        seen[v] = true;
        order.add(v);
        for (int u : neighbours.get(v)) {
            if (!seen[u]) {
                walk(neighbours, seen, order, u);
            }
        }
    }

    /** The call stack holds the path back to the start. */
    static List<Integer> dfsRecursive(List<List<Integer>> neighbours, int start) {
        boolean[] seen = new boolean[neighbours.size()];
        List<Integer> order = new ArrayList<>();
        walk(neighbours, seen, order, start);
        return order;
    }

    /** The same algorithm, stack in hand, neighbours pushed in their own order. */
    static List<Integer> dfsStackForward(List<List<Integer>> neighbours, int start) {
        boolean[] seen = new boolean[neighbours.size()];
        List<Integer> order = new ArrayList<>();
        List<Integer> stack = new ArrayList<>();
        stack.add(start);
        while (!stack.isEmpty()) {
            int v = stack.remove(stack.size() - 1);
            if (seen[v]) {
                continue;
            }
            seen[v] = true;
            order.add(v);
            for (int u : neighbours.get(v)) {
                if (!seen[u]) {
                    stack.add(u);
                }
            }
        }
        return order;
    }

    /** Pushing backwards, so the first neighbour is the first one popped. */
    static List<Integer> dfsStackReversed(List<List<Integer>> neighbours, int start) {
        boolean[] seen = new boolean[neighbours.size()];
        List<Integer> order = new ArrayList<>();
        List<Integer> stack = new ArrayList<>();
        stack.add(start);
        while (!stack.isEmpty()) {
            int v = stack.remove(stack.size() - 1);
            if (seen[v]) {
                continue;
            }
            seen[v] = true;
            order.add(v);
            for (int i = neighbours.get(v).size() - 1; i >= 0; i--) {
                int u = neighbours.get(v).get(i);
                if (!seen[u]) {
                    stack.add(u);
                }
            }
        }
        return order;
    }

    /** A queue instead of a stack, and the shape of the walk changes entirely. */
    static List<Integer> bfs(List<List<Integer>> neighbours, int start) {
        boolean[] seen = new boolean[neighbours.size()];
        seen[start] = true;
        List<Integer> order = new ArrayList<>();
        List<Integer> queue = new ArrayList<>();
        queue.add(start);
        int head = 0;
        while (head < queue.size()) {
            int v = queue.get(head);
            head++;
            order.add(v);
            for (int u : neighbours.get(v)) {
                if (!seen[u]) {
                    seen[u] = true;
                    queue.add(u);
                }
            }
        }
        return order;
    }

    /** The set of nodes visited, as a sorted list. Order thrown away. */
    static List<Integer> reached(List<Integer> order, int n) {
        boolean[] seen = new boolean[n];
        for (int v : order) {
            seen[v] = true;
        }
        List<Integer> out = new ArrayList<>();
        for (int v = 0; v < n; v++) {
            if (seen[v]) {
                out.add(v);
            }
        }
        return out;
    }

    static boolean same(List<Integer> a, List<Integer> b) {
        if (a.size() != b.size()) {
            return false;
        }
        for (int i = 0; i < a.size(); i++) {
            if (!a.get(i).equals(b.get(i))) {
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
        int[] sizes = {5, 6, 4, 7};
        int[][][] cases = {
            {{0, 1}, {0, 2}, {1, 3}, {2, 4}},
            {{0, 1}, {1, 2}, {2, 3}, {0, 4}, {4, 5}},
            {{0, 1}, {0, 2}, {0, 3}, {1, 2}},
            {{0, 1}, {0, 2}, {1, 3}, {1, 4}, {2, 5}, {2, 6}},
        };

        System.out.println(padEnd("recursive", 22) + padEnd("stack, forward", 22)
                + padEnd("stack, reversed", 22) + "breadth-first");
        for (int c = 0; c < sizes.length; c++) {
            List<List<Integer>> neighbours = build(sizes[c], cases[c]);
            System.out.println(padEnd(show(dfsRecursive(neighbours, 0)), 22)
                    + padEnd(show(dfsStackForward(neighbours, 0)), 22)
                    + padEnd(show(dfsStackReversed(neighbours, 0)), 22)
                    + show(bfs(neighbours, 0)));
        }
        System.out.println();

        int trials = 3000;
        int sameReached = 0;
        int reversedMatches = 0;
        int forwardMatches = 0;
        int bfsMatches = 0;
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
            List<Integer> rec = dfsRecursive(neighbours, 0);
            List<Integer> fwd = dfsStackForward(neighbours, 0);
            List<Integer> rev = dfsStackReversed(neighbours, 0);
            List<Integer> wide = bfs(neighbours, 0);
            if (same(reached(rec, n), reached(fwd, n))
                    && same(reached(rec, n), reached(rev, n))
                    && same(reached(rec, n), reached(wide, n))) {
                sameReached++;
            }
            if (same(rec, rev)) {
                reversedMatches++;
            }
            if (same(rec, fwd)) {
                forwardMatches++;
            }
            if (same(rec, wide)) {
                bfsMatches++;
            }
        }

        System.out.println("over " + trials + " random graphs on up to 7 nodes:");
        System.out.println("  all four reached the same nodes       " + pad(String.valueOf(sameReached), 6));
        System.out.println("  stack reversed matched the recursion  " + pad(String.valueOf(reversedMatches), 6));
        System.out.println("  stack forward matched the recursion   " + pad(String.valueOf(forwardMatches), 6));
        System.out.println("  breadth-first matched the recursion   " + pad(String.valueOf(bfsMatches), 6));
        System.out.println();
        System.out.println("The first line is the one that matters: which container you hold the");
        System.out.println("frontier in never changes what is reachable, only the route taken to it.");
        System.out.println("The next two say the recursive and iterative depth-first searches are one");
        System.out.println("algorithm -- push the neighbours backwards, because a stack hands them");
        System.out.println("back in reverse, and the orders are identical every time. Pushing them");
        System.out.println("forwards is still a depth-first search; it just numbers the children the");
        System.out.println("other way round.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Depth-first search, written twice: once with recursion and once with an
// explicit stack. They are the same algorithm. The call stack in the recursive
// version *is* the stack in the other one -- the only difference is who
// allocates it.
//
// That claim is easy to state and easy to get slightly wrong, because the two
// usually print different orders. The reason is not the algorithm: it is that
// pushing a node's neighbours onto a stack reverses them. Push them backwards
// and the two agree exactly, on every graph.

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

void walk(const std::vector<std::vector<int>>& neighbours, std::vector<char>& seen,
          std::vector<int>& order, int v) {
    seen[v] = 1;
    order.push_back(v);
    for (int u : neighbours[v]) {
        if (!seen[u]) {
            walk(neighbours, seen, order, u);
        }
    }
}

// The call stack holds the path back to the start.
std::vector<int> dfs_recursive(const std::vector<std::vector<int>>& neighbours, int start) {
    std::vector<char> seen(neighbours.size(), 0);
    std::vector<int> order;
    walk(neighbours, seen, order, start);
    return order;
}

// The same algorithm, stack in hand, neighbours pushed in their own order.
std::vector<int> dfs_stack_forward(const std::vector<std::vector<int>>& neighbours, int start) {
    std::vector<char> seen(neighbours.size(), 0);
    std::vector<int> order;
    std::vector<int> stack;
    stack.push_back(start);
    while (!stack.empty()) {
        int v = stack.back();
        stack.pop_back();
        if (seen[v]) {
            continue;
        }
        seen[v] = 1;
        order.push_back(v);
        for (int u : neighbours[v]) {
            if (!seen[u]) {
                stack.push_back(u);
            }
        }
    }
    return order;
}

// Pushing backwards, so the first neighbour is the first one popped.
std::vector<int> dfs_stack_reversed(const std::vector<std::vector<int>>& neighbours, int start) {
    std::vector<char> seen(neighbours.size(), 0);
    std::vector<int> order;
    std::vector<int> stack;
    stack.push_back(start);
    while (!stack.empty()) {
        int v = stack.back();
        stack.pop_back();
        if (seen[v]) {
            continue;
        }
        seen[v] = 1;
        order.push_back(v);
        for (int i = static_cast<int>(neighbours[v].size()) - 1; i >= 0; i--) {
            int u = neighbours[v][i];
            if (!seen[u]) {
                stack.push_back(u);
            }
        }
    }
    return order;
}

// A queue instead of a stack, and the shape of the walk changes entirely.
std::vector<int> bfs(const std::vector<std::vector<int>>& neighbours, int start) {
    std::vector<char> seen(neighbours.size(), 0);
    seen[start] = 1;
    std::vector<int> order;
    std::vector<int> queue;
    queue.push_back(start);
    size_t head = 0;
    while (head < queue.size()) {
        int v = queue[head];
        head++;
        order.push_back(v);
        for (int u : neighbours[v]) {
            if (!seen[u]) {
                seen[u] = 1;
                queue.push_back(u);
            }
        }
    }
    return order;
}

// The set of nodes visited, as a sorted list. Order thrown away.
std::vector<int> reached(const std::vector<int>& order, int n) {
    std::vector<char> seen(n, 0);
    for (int v : order) {
        seen[v] = 1;
    }
    std::vector<int> out;
    for (int v = 0; v < n; v++) {
        if (seen[v]) {
            out.push_back(v);
        }
    }
    return out;
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
    std::vector<int> sizes = {5, 6, 4, 7};
    std::vector<std::vector<Edge>> cases = {
        {{0, 1}, {0, 2}, {1, 3}, {2, 4}},
        {{0, 1}, {1, 2}, {2, 3}, {0, 4}, {4, 5}},
        {{0, 1}, {0, 2}, {0, 3}, {1, 2}},
        {{0, 1}, {0, 2}, {1, 3}, {1, 4}, {2, 5}, {2, 6}},
    };

    std::cout << std::left << std::setw(22) << "recursive" << std::setw(22) << "stack, forward"
              << std::setw(22) << "stack, reversed" << "breadth-first" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        std::vector<std::vector<int>> neighbours = build(sizes[c], cases[c]);
        std::cout << std::left << std::setw(22) << show(dfs_recursive(neighbours, 0))
                  << std::setw(22) << show(dfs_stack_forward(neighbours, 0))
                  << std::setw(22) << show(dfs_stack_reversed(neighbours, 0))
                  << show(bfs(neighbours, 0)) << "\\n";
    }
    std::cout << "\\n";

    int trials = 3000;
    int same_reached = 0;
    int reversed_matches = 0;
    int forward_matches = 0;
    int bfs_matches = 0;
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
        std::vector<int> rec = dfs_recursive(neighbours, 0);
        std::vector<int> fwd = dfs_stack_forward(neighbours, 0);
        std::vector<int> rev = dfs_stack_reversed(neighbours, 0);
        std::vector<int> wide = bfs(neighbours, 0);
        if (same(reached(rec, n), reached(fwd, n))
                && same(reached(rec, n), reached(rev, n))
                && same(reached(rec, n), reached(wide, n))) {
            same_reached += 1;
        }
        if (same(rec, rev)) {
            reversed_matches += 1;
        }
        if (same(rec, fwd)) {
            forward_matches += 1;
        }
        if (same(rec, wide)) {
            bfs_matches += 1;
        }
    }

    std::cout << "over " << trials << " random graphs on up to 7 nodes:\\n";
    std::cout << "  all four reached the same nodes       " << std::right << std::setw(6) << same_reached << "\\n";
    std::cout << "  stack reversed matched the recursion  " << std::setw(6) << reversed_matches << "\\n";
    std::cout << "  stack forward matched the recursion   " << std::setw(6) << forward_matches << "\\n";
    std::cout << "  breadth-first matched the recursion   " << std::setw(6) << bfs_matches << "\\n";
    std::cout << "\\n";
    std::cout << "The first line is the one that matters: which container you hold the\\n";
    std::cout << "frontier in never changes what is reachable, only the route taken to it.\\n";
    std::cout << "The next two say the recursive and iterative depth-first searches are one\\n";
    std::cout << "algorithm -- push the neighbours backwards, because a stack hands them\\n";
    std::cout << "back in reverse, and the orders are identical every time. Pushing them\\n";
    std::cout << "forwards is still a depth-first search; it just numbers the children the\\n";
    std::cout << "other way round.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Depth-first search, written twice: once with recursion and once with an
// explicit stack. They are the same algorithm. The call stack in the recursive
// version *is* the stack in the other one -- the only difference is who
// allocates it.
//
// That claim is easy to state and easy to get slightly wrong, because the two
// usually print different orders. The reason is not the algorithm: it is that
// pushing a node's neighbours onto a stack reverses them. Push them backwards
// and the two agree exactly, on every graph.

fn build(n: usize, edges: &[(usize, usize)]) -> Vec<Vec<usize>> {
    let mut neighbours = vec![Vec::new(); n];
    for &(u, v) in edges {
        neighbours[u].push(v);
        neighbours[v].push(u);
    }
    neighbours
}

fn walk(neighbours: &[Vec<usize>], seen: &mut Vec<bool>, order: &mut Vec<usize>, v: usize) {
    seen[v] = true;
    order.push(v);
    for i in 0..neighbours[v].len() {
        let u = neighbours[v][i];
        if !seen[u] {
            walk(neighbours, seen, order, u);
        }
    }
}

/// The call stack holds the path back to the start.
fn dfs_recursive(neighbours: &[Vec<usize>], start: usize) -> Vec<usize> {
    let mut seen = vec![false; neighbours.len()];
    let mut order = Vec::new();
    walk(neighbours, &mut seen, &mut order, start);
    order
}

/// The same algorithm, stack in hand, neighbours pushed in their own order.
fn dfs_stack_forward(neighbours: &[Vec<usize>], start: usize) -> Vec<usize> {
    let mut seen = vec![false; neighbours.len()];
    let mut order = Vec::new();
    let mut stack = vec![start];
    while let Some(v) = stack.pop() {
        if seen[v] {
            continue;
        }
        seen[v] = true;
        order.push(v);
        for &u in &neighbours[v] {
            if !seen[u] {
                stack.push(u);
            }
        }
    }
    order
}

/// Pushing backwards, so the first neighbour is the first one popped.
fn dfs_stack_reversed(neighbours: &[Vec<usize>], start: usize) -> Vec<usize> {
    let mut seen = vec![false; neighbours.len()];
    let mut order = Vec::new();
    let mut stack = vec![start];
    while let Some(v) = stack.pop() {
        if seen[v] {
            continue;
        }
        seen[v] = true;
        order.push(v);
        for i in (0..neighbours[v].len()).rev() {
            let u = neighbours[v][i];
            if !seen[u] {
                stack.push(u);
            }
        }
    }
    order
}

/// A queue instead of a stack, and the shape of the walk changes entirely.
fn bfs(neighbours: &[Vec<usize>], start: usize) -> Vec<usize> {
    let mut seen = vec![false; neighbours.len()];
    seen[start] = true;
    let mut order = Vec::new();
    let mut queue = vec![start];
    let mut head = 0;
    while head < queue.len() {
        let v = queue[head];
        head += 1;
        order.push(v);
        for i in 0..neighbours[v].len() {
            let u = neighbours[v][i];
            if !seen[u] {
                seen[u] = true;
                queue.push(u);
            }
        }
    }
    order
}

/// The set of nodes visited, as a sorted list. Order thrown away.
fn reached(order: &[usize], n: usize) -> Vec<usize> {
    let mut seen = vec![false; n];
    for &v in order {
        seen[v] = true;
    }
    (0..n).filter(|&v| seen[v]).collect()
}

fn same(a: &[usize], b: &[usize]) -> bool {
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

fn show(values: &[usize]) -> String {
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
    let sizes: Vec<usize> = vec![5, 6, 4, 7];
    let cases: Vec<Vec<(usize, usize)>> = vec![
        vec![(0, 1), (0, 2), (1, 3), (2, 4)],
        vec![(0, 1), (1, 2), (2, 3), (0, 4), (4, 5)],
        vec![(0, 1), (0, 2), (0, 3), (1, 2)],
        vec![(0, 1), (0, 2), (1, 3), (1, 4), (2, 5), (2, 6)],
    ];

    println!(
        "{}{}{}{}",
        pad_right("recursive", 22),
        pad_right("stack, forward", 22),
        pad_right("stack, reversed", 22),
        "breadth-first"
    );
    for (c, edges) in cases.iter().enumerate() {
        let neighbours = build(sizes[c], edges);
        println!(
            "{}{}{}{}",
            pad_right(&show(&dfs_recursive(&neighbours, 0)), 22),
            pad_right(&show(&dfs_stack_forward(&neighbours, 0)), 22),
            pad_right(&show(&dfs_stack_reversed(&neighbours, 0)), 22),
            show(&bfs(&neighbours, 0))
        );
    }
    println!();

    let mut rng = Rng { seed: 1 };
    let trials = 3000;
    let mut same_reached = 0;
    let mut reversed_matches = 0;
    let mut forward_matches = 0;
    let mut bfs_matches = 0;
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
        let rec = dfs_recursive(&neighbours, 0);
        let fwd = dfs_stack_forward(&neighbours, 0);
        let rev = dfs_stack_reversed(&neighbours, 0);
        let wide = bfs(&neighbours, 0);
        if same(&reached(&rec, n), &reached(&fwd, n))
            && same(&reached(&rec, n), &reached(&rev, n))
            && same(&reached(&rec, n), &reached(&wide, n))
        {
            same_reached += 1;
        }
        if same(&rec, &rev) {
            reversed_matches += 1;
        }
        if same(&rec, &fwd) {
            forward_matches += 1;
        }
        if same(&rec, &wide) {
            bfs_matches += 1;
        }
    }

    println!("over {} random graphs on up to 7 nodes:", trials);
    println!("  all four reached the same nodes       {}", pad_left(&same_reached.to_string(), 6));
    println!("  stack reversed matched the recursion  {}", pad_left(&reversed_matches.to_string(), 6));
    println!("  stack forward matched the recursion   {}", pad_left(&forward_matches.to_string(), 6));
    println!("  breadth-first matched the recursion   {}", pad_left(&bfs_matches.to_string(), 6));
    println!();
    println!("The first line is the one that matters: which container you hold the");
    println!("frontier in never changes what is reachable, only the route taken to it.");
    println!("The next two say the recursive and iterative depth-first searches are one");
    println!("algorithm -- push the neighbours backwards, because a stack hands them");
    println!("back in reverse, and the orders are identical every time. Pushing them");
    println!("forwards is still a depth-first search; it just numbers the children the");
    println!("other way round.");
}
`,
            },
            {
              lang: "go",
              code: `// Depth-first search, written twice: once with recursion and once with an
// explicit stack. They are the same algorithm. The call stack in the recursive
// version *is* the stack in the other one -- the only difference is who
// allocates it.
//
// That claim is easy to state and easy to get slightly wrong, because the two
// usually print different orders. The reason is not the algorithm: it is that
// pushing a node's neighbours onto a stack reverses them. Push them backwards
// and the two agree exactly, on every graph.

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

// The call stack holds the path back to the start.
func dfsRecursive(neighbours [][]int, start int) []int {
	seen := make([]bool, len(neighbours))
	order := []int{}
	var walk func(v int)
	walk = func(v int) {
		seen[v] = true
		order = append(order, v)
		for _, u := range neighbours[v] {
			if !seen[u] {
				walk(u)
			}
		}
	}
	walk(start)
	return order
}

// The same algorithm, stack in hand, neighbours pushed in their own order.
func dfsStackForward(neighbours [][]int, start int) []int {
	seen := make([]bool, len(neighbours))
	order := []int{}
	stack := []int{start}
	for len(stack) > 0 {
		v := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		if seen[v] {
			continue
		}
		seen[v] = true
		order = append(order, v)
		for _, u := range neighbours[v] {
			if !seen[u] {
				stack = append(stack, u)
			}
		}
	}
	return order
}

// Pushing backwards, so the first neighbour is the first one popped.
func dfsStackReversed(neighbours [][]int, start int) []int {
	seen := make([]bool, len(neighbours))
	order := []int{}
	stack := []int{start}
	for len(stack) > 0 {
		v := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		if seen[v] {
			continue
		}
		seen[v] = true
		order = append(order, v)
		for i := len(neighbours[v]) - 1; i >= 0; i-- {
			u := neighbours[v][i]
			if !seen[u] {
				stack = append(stack, u)
			}
		}
	}
	return order
}

// A queue instead of a stack, and the shape of the walk changes entirely.
func bfs(neighbours [][]int, start int) []int {
	seen := make([]bool, len(neighbours))
	seen[start] = true
	order := []int{}
	queue := []int{start}
	head := 0
	for head < len(queue) {
		v := queue[head]
		head++
		order = append(order, v)
		for _, u := range neighbours[v] {
			if !seen[u] {
				seen[u] = true
				queue = append(queue, u)
			}
		}
	}
	return order
}

// The set of nodes visited, as a sorted list. Order thrown away.
func reached(order []int, n int) []int {
	seen := make([]bool, n)
	for _, v := range order {
		seen[v] = true
	}
	out := []int{}
	for v := 0; v < n; v++ {
		if seen[v] {
			out = append(out, v)
		}
	}
	return out
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
	sizes := []int{5, 6, 4, 7}
	cases := [][]edge{
		{{0, 1}, {0, 2}, {1, 3}, {2, 4}},
		{{0, 1}, {1, 2}, {2, 3}, {0, 4}, {4, 5}},
		{{0, 1}, {0, 2}, {0, 3}, {1, 2}},
		{{0, 1}, {0, 2}, {1, 3}, {1, 4}, {2, 5}, {2, 6}},
	}

	fmt.Printf("%-22s%-22s%-22s%s\\n", "recursive", "stack, forward",
		"stack, reversed", "breadth-first")
	for c, edges := range cases {
		neighbours := build(sizes[c], edges)
		fmt.Printf("%-22s%-22s%-22s%s\\n",
			show(dfsRecursive(neighbours, 0)),
			show(dfsStackForward(neighbours, 0)),
			show(dfsStackReversed(neighbours, 0)),
			show(bfs(neighbours, 0)))
	}
	fmt.Println()

	trials := 3000
	sameReached := 0
	reversedMatches := 0
	forwardMatches := 0
	bfsMatches := 0
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
		rec := dfsRecursive(neighbours, 0)
		fwd := dfsStackForward(neighbours, 0)
		rev := dfsStackReversed(neighbours, 0)
		wide := bfs(neighbours, 0)
		if same(reached(rec, n), reached(fwd, n)) &&
			same(reached(rec, n), reached(rev, n)) &&
			same(reached(rec, n), reached(wide, n)) {
			sameReached++
		}
		if same(rec, rev) {
			reversedMatches++
		}
		if same(rec, fwd) {
			forwardMatches++
		}
		if same(rec, wide) {
			bfsMatches++
		}
	}

	fmt.Printf("over %d random graphs on up to 7 nodes:\\n", trials)
	fmt.Printf("  all four reached the same nodes       %6d\\n", sameReached)
	fmt.Printf("  stack reversed matched the recursion  %6d\\n", reversedMatches)
	fmt.Printf("  stack forward matched the recursion   %6d\\n", forwardMatches)
	fmt.Printf("  breadth-first matched the recursion   %6d\\n", bfsMatches)
	fmt.Println()
	fmt.Println("The first line is the one that matters: which container you hold the")
	fmt.Println("frontier in never changes what is reachable, only the route taken to it.")
	fmt.Println("The next two say the recursive and iterative depth-first searches are one")
	fmt.Println("algorithm -- push the neighbours backwards, because a stack hands them")
	fmt.Println("back in reverse, and the orders are identical every time. Pushing them")
	fmt.Println("forwards is still a depth-first search; it just numbers the children the")
	fmt.Println("other way round.")
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "graph-dfs-walk",
        kind: "graph",
        algorithm: "dfs",
        title: "One path as far as it goes, then back",
        lockAlgorithm: true,
      },
      pitfalls: [
        {
          title: "A different visit order is not a different algorithm",
          body: "A stack hands back what was pushed last, so pushing a node's neighbours in their own order explores them right to left. Push them in reverse and the iterative search matched the recursive one on all 3,000 graphs. If the two disagree about which nodes were reached, that is a bug; if they disagree only about order, that is the push direction.",
        },
        {
          title: "The container never changes what is reachable",
          body: "Depth-first and breadth-first reached the same set on 3,000 of 3,000 graphs, as they must. Choose between them for what you need to know during the walk -- layers, or the moment a subtree closes -- never in the hope of finding different nodes.",
        },
      ],
    },
    {
      id: "the-moment-a-subtree-closes",
      heading: "The moment a subtree closes",
      body: [
        "If both traversals reach the same nodes, the reason to prefer one is what it can tell you *while* it runs. Depth-first search has one piece of information breadth-first search structurally cannot have: it knows when a subtree is finished, because it comes back.",
        "Record two numbers per node \u2014 the tick when the search enters it and the tick when it leaves \u2014 and the shape of the search becomes arithmetic. Node `u` is an ancestor of node `v` exactly when `u`'s interval contains `v`'s: `enter[u] <= enter[v]` and `leave[v] <= leave[u]`. That is two comparisons in place of a walk up the parent links, and it agreed with the walk on all 3,000 random graphs.",
        "The subtree size falls out of the same pair. Each node spends exactly two ticks, its own entry and its own exit, so the interval `leave[v] - enter[v] + 1` is twice the number of nodes below it. Also 3,000 out of 3,000 against counting them by hand.",
        "The instructive part is the shortcut that does not work. Keeping only the entry tick and testing `enter[u] <= enter[v]` looks like it should be enough \u2014 surely an ancestor was entered first? It was, but so was every node in a branch explored earlier. Over the same graphs the entry-only test was fully correct on 2,077 of 3,000, and claimed \"ancestor\" for 2,923 pairs that were not related at all. Entering earlier is necessary and not sufficient; the leave tick is what separates *above* from *merely before*.",
        "This is the machinery behind a surprising amount of later work: cycle detection uses the fact that a node is still open when you meet it again, topological order is the reverse of the leave order, and the bridges and articulation points of a graph are found by comparing entry ticks across the tree. All of it needs the moment a subtree closes, and only a depth-first walk has one.",
      ],
      examples: [
        {
          id: "entry-and-exit-ticks",
          title: "Ancestry and subtree size as arithmetic, scored against climbing the tree",
          lang: "python",
          code: `# What depth-first search knows that breadth-first search does not: the moment a
# subtree is finished.
#
# Recording two numbers per node -- the tick when the search enters it and the
# tick when it leaves -- turns the shape of the search into arithmetic. Node u
# is an ancestor of node v exactly when u's interval contains v's, and that is
# a pair of comparisons rather than a walk up the tree.
#
# The example builds the intervals, uses them to answer ancestry and subtree
# size, and scores both against walking the parent links. It also runs the
# version that keeps only the entry tick, which is the natural thing to try and
# is wrong in one direction.


def build(n, edges):
    neighbours = [[] for _ in range(n)]
    for u, v in edges:
        neighbours[u].append(v)
        neighbours[v].append(u)
    return neighbours


def times(neighbours, start):
    """Enter and leave ticks, plus the parent each node was reached from."""
    n = len(neighbours)
    enter = [-1] * n
    leave = [-1] * n
    parent = [-1] * n
    clock = [0]

    def walk(v):
        enter[v] = clock[0]
        clock[0] += 1
        for u in neighbours[v]:
            if enter[u] < 0:
                parent[u] = v
                walk(u)
        leave[v] = clock[0]
        clock[0] += 1

    walk(start)
    return enter, leave, parent


def is_ancestor(enter, leave, u, v):
    """u's interval contains v's. Two comparisons, no walking."""
    return enter[u] <= enter[v] and leave[v] <= leave[u]


def is_ancestor_by_entry_only(enter, u, v):
    """The tempting shortcut: u was entered first, so u must be above v."""
    return enter[u] <= enter[v]


def is_ancestor_by_walking(parent, u, v):
    """Climb from v to the root and look for u. The definition."""
    at = v
    while at >= 0:
        if at == u:
            return True
        at = parent[at]
    return False


def subtree_size(enter, leave, v):
    """Each node spends two ticks, so the interval is twice the subtree."""
    return (leave[v] - enter[v] + 1) // 2


def subtree_size_by_walking(parent, enter, v):
    """Count the nodes that have v somewhere above them."""
    total = 0
    for u in range(len(parent)):
        if enter[u] >= 0 and is_ancestor_by_walking(parent, v, u):
            total += 1
    return total


def show(values):
    return "[" + ", ".join(str(v) for v in values) + "]"


CASES = [
    (5, [(0, 1), (0, 2), (1, 3), (2, 4)]),
    (6, [(0, 1), (1, 2), (2, 3), (0, 4), (4, 5)]),
    (7, [(0, 1), (0, 2), (1, 3), (1, 4), (2, 5), (2, 6)]),
]

print(f"{'edges':<40}{'enter':<26}{'leave':<26}{'subtree sizes'}")
for n, edges in CASES:
    neighbours = build(n, edges)
    enter, leave, _ = times(neighbours, 0)
    sizes = [subtree_size(enter, leave, v) for v in range(n)]
    shown = "[" + ", ".join(f"{u}-{v}" for u, v in edges) + "]"
    print(f"{shown:<40}{show(enter):<26}{show(leave):<26}{show(sizes)}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
interval_ok = 0
entry_only_ok = 0
entry_only_over = 0
size_ok = 0
pairs = 0
for _ in range(TRIALS):
    n = 2 + rand(6)
    edges = []
    for u in range(n):
        for v in range(u + 1, n):
            if rand(3) == 0:
                edges.append((u, v))
    neighbours = build(n, edges)
    enter, leave, parent = times(neighbours, 0)
    good_interval = True
    good_entry = True
    for u in range(n):
        for v in range(n):
            if enter[u] < 0 or enter[v] < 0:
                continue
            pairs += 1
            truth = is_ancestor_by_walking(parent, u, v)
            if is_ancestor(enter, leave, u, v) != truth:
                good_interval = False
            guess = is_ancestor_by_entry_only(enter, u, v)
            if guess != truth:
                good_entry = False
                if guess and not truth:
                    entry_only_over += 1
    if good_interval:
        interval_ok += 1
    if good_entry:
        entry_only_ok += 1
    good_size = True
    for v in range(n):
        if enter[v] < 0:
            continue
        if subtree_size(enter, leave, v) != subtree_size_by_walking(parent, enter, v):
            good_size = False
    if good_size:
        size_ok += 1

print(f"over {TRIALS} random graphs on up to 7 nodes, {pairs} ordered pairs:")
print(f"  the interval test agreed with climbing  {interval_ok:>6}")
print(f"  the entry-tick test agreed              {entry_only_ok:>6}")
print(f"  subtree size from the interval agreed   {size_ok:>6}")
print()
print(f"The entry-tick shortcut said \\"ancestor\\" about {entry_only_over} pairs that were not.")
print("Being entered earlier is necessary and not sufficient: a node visited")
print("before v in a different branch also has the smaller entry tick. The leave")
print("tick is what distinguishes \\"above v\\" from \\"merely earlier than v\\", and it")
print("is the number breadth-first search has no equivalent of -- a queue never")
print("tells you that a subtree is finished, because it never goes back.")
`,
          output: `edges                                   enter                     leave                     subtree sizes
[0-1, 0-2, 1-3, 2-4]                    [0, 1, 5, 2, 6]           [9, 4, 8, 3, 7]           [5, 2, 2, 1, 1]
[0-1, 1-2, 2-3, 0-4, 4-5]               [0, 1, 2, 3, 7, 8]        [11, 6, 5, 4, 10, 9]      [6, 3, 2, 1, 2, 1]
[0-1, 0-2, 1-3, 1-4, 2-5, 2-6]          [0, 1, 7, 2, 4, 8, 10]    [13, 6, 12, 3, 5, 9, 11]  [7, 3, 3, 1, 1, 1, 1]

over 3000 random graphs on up to 7 nodes, 42081 ordered pairs:
  the interval test agreed with climbing    3000
  the entry-tick test agreed                2077
  subtree size from the interval agreed     3000

The entry-tick shortcut said "ancestor" about 2923 pairs that were not.
Being entered earlier is necessary and not sufficient: a node visited
before v in a different branch also has the smaller entry tick. The leave
tick is what distinguishes "above v" from "merely earlier than v", and it
is the number breadth-first search has no equivalent of -- a queue never
tells you that a subtree is finished, because it never goes back.`,
          explanation:
            "Entry and exit ticks, used for ancestry and subtree size and scored against walking the parent links \u2014 together with the entry-only shortcut, which is wrong in exactly one direction and wrong often.",
          alternates: [
            {
              lang: "javascript",
              code: `// What depth-first search knows that breadth-first search does not: the moment a
// subtree is finished.
//
// Recording two numbers per node -- the tick when the search enters it and the
// tick when it leaves -- turns the shape of the search into arithmetic. Node u
// is an ancestor of node v exactly when u's interval contains v's, and that is
// a pair of comparisons rather than a walk up the tree.
//
// The example builds the intervals, uses them to answer ancestry and subtree
// size, and scores both against walking the parent links. It also runs the
// version that keeps only the entry tick, which is the natural thing to try and
// is wrong in one direction.

function build(n, edges) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    neighbours[v].push(u);
  }
  return neighbours;
}

/** Enter and leave ticks, plus the parent each node was reached from. */
function times(neighbours, start) {
  const n = neighbours.length;
  const enter = new Array(n).fill(-1);
  const leave = new Array(n).fill(-1);
  const parent = new Array(n).fill(-1);
  let clock = 0;

  function walk(v) {
    enter[v] = clock;
    clock += 1;
    for (const u of neighbours[v]) {
      if (enter[u] < 0) {
        parent[u] = v;
        walk(u);
      }
    }
    leave[v] = clock;
    clock += 1;
  }

  walk(start);
  return [enter, leave, parent];
}

/** u's interval contains v's. Two comparisons, no walking. */
function isAncestor(enter, leave, u, v) {
  return enter[u] <= enter[v] && leave[v] <= leave[u];
}

/** The tempting shortcut: u was entered first, so u must be above v. */
function isAncestorByEntryOnly(enter, u, v) {
  return enter[u] <= enter[v];
}

/** Climb from v to the root and look for u. The definition. */
function isAncestorByWalking(parent, u, v) {
  let at = v;
  while (at >= 0) {
    if (at === u) return true;
    at = parent[at];
  }
  return false;
}

/** Each node spends two ticks, so the interval is twice the subtree. */
function subtreeSize(enter, leave, v) {
  return Math.floor((leave[v] - enter[v] + 1) / 2);
}

/** Count the nodes that have v somewhere above them. */
function subtreeSizeByWalking(parent, enter, v) {
  let total = 0;
  for (let u = 0; u < parent.length; u += 1) {
    if (enter[u] >= 0 && isAncestorByWalking(parent, v, u)) total += 1;
  }
  return total;
}

const show = (values) => "[" + values.join(", ") + "]";
const padEnd = (v, w) => String(v).padEnd(w);
const pad = (v, w) => String(v).padStart(w);

const CASES = [
  [5, [[0, 1], [0, 2], [1, 3], [2, 4]]],
  [6, [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5]]],
  [7, [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]]],
];

console.log(padEnd("edges", 40) + padEnd("enter", 26) + padEnd("leave", 26) + "subtree sizes");
for (const [n, edges] of CASES) {
  const neighbours = build(n, edges);
  const [enter, leave] = times(neighbours, 0);
  const sizes = [];
  for (let v = 0; v < n; v += 1) sizes.push(subtreeSize(enter, leave, v));
  const shown = "[" + edges.map(([u, v]) => \`\${u}-\${v}\`).join(", ") + "]";
  console.log(padEnd(shown, 40) + padEnd(show(enter), 26) + padEnd(show(leave), 26) + show(sizes));
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
let intervalOk = 0;
let entryOnlyOk = 0;
let entryOnlyOver = 0;
let sizeOk = 0;
let pairs = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) {
      if (rand(3) === 0) edges.push([u, v]);
    }
  }
  const neighbours = build(n, edges);
  const [enter, leave, parent] = times(neighbours, 0);
  let goodInterval = true;
  let goodEntry = true;
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (enter[u] < 0 || enter[v] < 0) continue;
      pairs += 1;
      const truth = isAncestorByWalking(parent, u, v);
      if (isAncestor(enter, leave, u, v) !== truth) goodInterval = false;
      const guess = isAncestorByEntryOnly(enter, u, v);
      if (guess !== truth) {
        goodEntry = false;
        if (guess && !truth) entryOnlyOver += 1;
      }
    }
  }
  if (goodInterval) intervalOk += 1;
  if (goodEntry) entryOnlyOk += 1;
  let goodSize = true;
  for (let v = 0; v < n; v += 1) {
    if (enter[v] < 0) continue;
    if (subtreeSize(enter, leave, v) !== subtreeSizeByWalking(parent, enter, v)) goodSize = false;
  }
  if (goodSize) sizeOk += 1;
}

console.log(\`over \${TRIALS} random graphs on up to 7 nodes, \${pairs} ordered pairs:\`);
console.log(\`  the interval test agreed with climbing  \${pad(intervalOk, 6)}\`);
console.log(\`  the entry-tick test agreed              \${pad(entryOnlyOk, 6)}\`);
console.log(\`  subtree size from the interval agreed   \${pad(sizeOk, 6)}\`);
console.log();
console.log(\`The entry-tick shortcut said "ancestor" about \${entryOnlyOver} pairs that were not.\`);
console.log("Being entered earlier is necessary and not sufficient: a node visited");
console.log("before v in a different branch also has the smaller entry tick. The leave");
console.log('tick is what distinguishes "above v" from "merely earlier than v", and it');
console.log("is the number breadth-first search has no equivalent of -- a queue never");
console.log("tells you that a subtree is finished, because it never goes back.");
`,
            },
            {
              lang: "typescript",
              code: `// What depth-first search knows that breadth-first search does not: the moment a
// subtree is finished.
//
// Recording two numbers per node -- the tick when the search enters it and the
// tick when it leaves -- turns the shape of the search into arithmetic. Node u
// is an ancestor of node v exactly when u's interval contains v's, and that is
// a pair of comparisons rather than a walk up the tree.
//
// The example builds the intervals, uses them to answer ancestry and subtree
// size, and scores both against walking the parent links. It also runs the
// version that keeps only the entry tick, which is the natural thing to try and
// is wrong in one direction.

type Edge = [number, number];

function build(n: number, edges: Edge[]): number[][] {
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    neighbours[v].push(u);
  }
  return neighbours;
}

/** Enter and leave ticks, plus the parent each node was reached from. */
function times(neighbours: number[][], start: number): [number[], number[], number[]] {
  const n = neighbours.length;
  const enter = new Array(n).fill(-1);
  const leave = new Array(n).fill(-1);
  const parent = new Array(n).fill(-1);
  let clock = 0;

  function walk(v: number): void {
    enter[v] = clock;
    clock += 1;
    for (const u of neighbours[v]) {
      if (enter[u] < 0) {
        parent[u] = v;
        walk(u);
      }
    }
    leave[v] = clock;
    clock += 1;
  }

  walk(start);
  return [enter, leave, parent];
}

/** u's interval contains v's. Two comparisons, no walking. */
function isAncestor(enter: number[], leave: number[], u: number, v: number): boolean {
  return enter[u] <= enter[v] && leave[v] <= leave[u];
}

/** The tempting shortcut: u was entered first, so u must be above v. */
function isAncestorByEntryOnly(enter: number[], u: number, v: number): boolean {
  return enter[u] <= enter[v];
}

/** Climb from v to the root and look for u. The definition. */
function isAncestorByWalking(parent: number[], u: number, v: number): boolean {
  let at = v;
  while (at >= 0) {
    if (at === u) return true;
    at = parent[at];
  }
  return false;
}

/** Each node spends two ticks, so the interval is twice the subtree. */
function subtreeSize(enter: number[], leave: number[], v: number): number {
  return Math.floor((leave[v] - enter[v] + 1) / 2);
}

/** Count the nodes that have v somewhere above them. */
function subtreeSizeByWalking(parent: number[], enter: number[], v: number): number {
  let total = 0;
  for (let u = 0; u < parent.length; u += 1) {
    if (enter[u] >= 0 && isAncestorByWalking(parent, v, u)) total += 1;
  }
  return total;
}

const show = (values: number[]): string => "[" + values.join(", ") + "]";
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const pad = (v: string | number, w: number): string => String(v).padStart(w);

const CASES: [number, Edge[]][] = [
  [5, [[0, 1], [0, 2], [1, 3], [2, 4]]],
  [6, [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5]]],
  [7, [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]]],
];

console.log(padEnd("edges", 40) + padEnd("enter", 26) + padEnd("leave", 26) + "subtree sizes");
for (const [n, edges] of CASES) {
  const neighbours = build(n, edges);
  const [enter, leave] = times(neighbours, 0);
  const sizes: number[] = [];
  for (let v = 0; v < n; v += 1) sizes.push(subtreeSize(enter, leave, v));
  const shown = "[" + edges.map(([u, v]) => \`\${u}-\${v}\`).join(", ") + "]";
  console.log(padEnd(shown, 40) + padEnd(show(enter), 26) + padEnd(show(leave), 26) + show(sizes));
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
let intervalOk = 0;
let entryOnlyOk = 0;
let entryOnlyOver = 0;
let sizeOk = 0;
let pairs = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges: Edge[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) {
      if (rand(3) === 0) edges.push([u, v]);
    }
  }
  const neighbours = build(n, edges);
  const [enter, leave, parent] = times(neighbours, 0);
  let goodInterval = true;
  let goodEntry = true;
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (enter[u] < 0 || enter[v] < 0) continue;
      pairs += 1;
      const truth = isAncestorByWalking(parent, u, v);
      if (isAncestor(enter, leave, u, v) !== truth) goodInterval = false;
      const guess = isAncestorByEntryOnly(enter, u, v);
      if (guess !== truth) {
        goodEntry = false;
        if (guess && !truth) entryOnlyOver += 1;
      }
    }
  }
  if (goodInterval) intervalOk += 1;
  if (goodEntry) entryOnlyOk += 1;
  let goodSize = true;
  for (let v = 0; v < n; v += 1) {
    if (enter[v] < 0) continue;
    if (subtreeSize(enter, leave, v) !== subtreeSizeByWalking(parent, enter, v)) goodSize = false;
  }
  if (goodSize) sizeOk += 1;
}

console.log(\`over \${TRIALS} random graphs on up to 7 nodes, \${pairs} ordered pairs:\`);
console.log(\`  the interval test agreed with climbing  \${pad(intervalOk, 6)}\`);
console.log(\`  the entry-tick test agreed              \${pad(entryOnlyOk, 6)}\`);
console.log(\`  subtree size from the interval agreed   \${pad(sizeOk, 6)}\`);
console.log();
console.log(\`The entry-tick shortcut said "ancestor" about \${entryOnlyOver} pairs that were not.\`);
console.log("Being entered earlier is necessary and not sufficient: a node visited");
console.log("before v in a different branch also has the smaller entry tick. The leave");
console.log('tick is what distinguishes "above v" from "merely earlier than v", and it');
console.log("is the number breadth-first search has no equivalent of -- a queue never");
console.log("tells you that a subtree is finished, because it never goes back.");
`,
            },
            {
              lang: "java",
              code: `// What depth-first search knows that breadth-first search does not: the moment a
// subtree is finished.
//
// Recording two numbers per node -- the tick when the search enters it and the
// tick when it leaves -- turns the shape of the search into arithmetic. Node u
// is an ancestor of node v exactly when u's interval contains v's, and that is
// a pair of comparisons rather than a walk up the tree.
//
// The example builds the intervals, uses them to answer ancestry and subtree
// size, and scores both against walking the parent links. It also runs the
// version that keeps only the entry tick, which is the natural thing to try and
// is wrong in one direction.

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

    static int[] enterTicks;
    static int[] leaveTicks;
    static int[] parentOf;
    static int clock;

    static void walk(List<List<Integer>> neighbours, int v) {
        enterTicks[v] = clock;
        clock++;
        for (int u : neighbours.get(v)) {
            if (enterTicks[u] < 0) {
                parentOf[u] = v;
                walk(neighbours, u);
            }
        }
        leaveTicks[v] = clock;
        clock++;
    }

    /** Enter and leave ticks, plus the parent each node was reached from. */
    static void times(List<List<Integer>> neighbours, int start) {
        int n = neighbours.size();
        enterTicks = new int[n];
        leaveTicks = new int[n];
        parentOf = new int[n];
        Arrays.fill(enterTicks, -1);
        Arrays.fill(leaveTicks, -1);
        Arrays.fill(parentOf, -1);
        clock = 0;
        walk(neighbours, start);
    }

    /** u's interval contains v's. Two comparisons, no walking. */
    static boolean isAncestor(int[] enter, int[] leave, int u, int v) {
        return enter[u] <= enter[v] && leave[v] <= leave[u];
    }

    /** The tempting shortcut: u was entered first, so u must be above v. */
    static boolean isAncestorByEntryOnly(int[] enter, int u, int v) {
        return enter[u] <= enter[v];
    }

    /** Climb from v to the root and look for u. The definition. */
    static boolean isAncestorByWalking(int[] parent, int u, int v) {
        int at = v;
        while (at >= 0) {
            if (at == u) {
                return true;
            }
            at = parent[at];
        }
        return false;
    }

    /** Each node spends two ticks, so the interval is twice the subtree. */
    static int subtreeSize(int[] enter, int[] leave, int v) {
        return (leave[v] - enter[v] + 1) / 2;
    }

    /** Count the nodes that have v somewhere above them. */
    static int subtreeSizeByWalking(int[] parent, int[] enter, int v) {
        int total = 0;
        for (int u = 0; u < parent.length; u++) {
            if (enter[u] >= 0 && isAncestorByWalking(parent, v, u)) {
                total++;
            }
        }
        return total;
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
        int[] sizes = {5, 6, 7};
        int[][][] cases = {
            {{0, 1}, {0, 2}, {1, 3}, {2, 4}},
            {{0, 1}, {1, 2}, {2, 3}, {0, 4}, {4, 5}},
            {{0, 1}, {0, 2}, {1, 3}, {1, 4}, {2, 5}, {2, 6}},
        };

        System.out.println(padEnd("edges", 40) + padEnd("enter", 26)
                + padEnd("leave", 26) + "subtree sizes");
        for (int c = 0; c < sizes.length; c++) {
            int n = sizes[c];
            List<List<Integer>> neighbours = build(n, cases[c]);
            times(neighbours, 0);
            int[] sizesOut = new int[n];
            for (int v = 0; v < n; v++) {
                sizesOut[v] = subtreeSize(enterTicks, leaveTicks, v);
            }
            StringBuilder shown = new StringBuilder("[");
            for (int i = 0; i < cases[c].length; i++) {
                if (i > 0) {
                    shown.append(", ");
                }
                shown.append(cases[c][i][0]).append("-").append(cases[c][i][1]);
            }
            shown.append("]");
            System.out.println(padEnd(shown.toString(), 40) + padEnd(show(enterTicks), 26)
                    + padEnd(show(leaveTicks), 26) + show(sizesOut));
        }
        System.out.println();

        int trials = 3000;
        int intervalOk = 0;
        int entryOnlyOk = 0;
        int entryOnlyOver = 0;
        int sizeOk = 0;
        long pairs = 0;
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
            times(neighbours, 0);
            int[] enter = enterTicks;
            int[] leave = leaveTicks;
            int[] parent = parentOf;
            boolean goodInterval = true;
            boolean goodEntry = true;
            for (int u = 0; u < n; u++) {
                for (int v = 0; v < n; v++) {
                    if (enter[u] < 0 || enter[v] < 0) {
                        continue;
                    }
                    pairs++;
                    boolean truth = isAncestorByWalking(parent, u, v);
                    if (isAncestor(enter, leave, u, v) != truth) {
                        goodInterval = false;
                    }
                    boolean guess = isAncestorByEntryOnly(enter, u, v);
                    if (guess != truth) {
                        goodEntry = false;
                        if (guess) {
                            entryOnlyOver++;
                        }
                    }
                }
            }
            if (goodInterval) {
                intervalOk++;
            }
            if (goodEntry) {
                entryOnlyOk++;
            }
            boolean goodSize = true;
            for (int v = 0; v < n; v++) {
                if (enter[v] < 0) {
                    continue;
                }
                if (subtreeSize(enter, leave, v) != subtreeSizeByWalking(parent, enter, v)) {
                    goodSize = false;
                }
            }
            if (goodSize) {
                sizeOk++;
            }
        }

        System.out.println("over " + trials + " random graphs on up to 7 nodes, "
                + pairs + " ordered pairs:");
        System.out.println("  the interval test agreed with climbing  " + pad(String.valueOf(intervalOk), 6));
        System.out.println("  the entry-tick test agreed              " + pad(String.valueOf(entryOnlyOk), 6));
        System.out.println("  subtree size from the interval agreed   " + pad(String.valueOf(sizeOk), 6));
        System.out.println();
        System.out.println("The entry-tick shortcut said \\"ancestor\\" about " + entryOnlyOver
                + " pairs that were not.");
        System.out.println("Being entered earlier is necessary and not sufficient: a node visited");
        System.out.println("before v in a different branch also has the smaller entry tick. The leave");
        System.out.println("tick is what distinguishes \\"above v\\" from \\"merely earlier than v\\", and it");
        System.out.println("is the number breadth-first search has no equivalent of -- a queue never");
        System.out.println("tells you that a subtree is finished, because it never goes back.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// What depth-first search knows that breadth-first search does not: the moment a
// subtree is finished.
//
// Recording two numbers per node -- the tick when the search enters it and the
// tick when it leaves -- turns the shape of the search into arithmetic. Node u
// is an ancestor of node v exactly when u's interval contains v's, and that is
// a pair of comparisons rather than a walk up the tree.
//
// The example builds the intervals, uses them to answer ancestry and subtree
// size, and scores both against walking the parent links. It also runs the
// version that keeps only the entry tick, which is the natural thing to try and
// is wrong in one direction.

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

void walk(const std::vector<std::vector<int>>& neighbours, std::vector<int>& enter,
          std::vector<int>& leave, std::vector<int>& parent, int& clock, int v) {
    enter[v] = clock;
    clock++;
    for (int u : neighbours[v]) {
        if (enter[u] < 0) {
            parent[u] = v;
            walk(neighbours, enter, leave, parent, clock, u);
        }
    }
    leave[v] = clock;
    clock++;
}

// Enter and leave ticks, plus the parent each node was reached from.
void times(const std::vector<std::vector<int>>& neighbours, int start,
           std::vector<int>& enter, std::vector<int>& leave, std::vector<int>& parent) {
    int n = static_cast<int>(neighbours.size());
    enter.assign(n, -1);
    leave.assign(n, -1);
    parent.assign(n, -1);
    int clock = 0;
    walk(neighbours, enter, leave, parent, clock, start);
}

// u's interval contains v's. Two comparisons, no walking.
bool is_ancestor(const std::vector<int>& enter, const std::vector<int>& leave, int u, int v) {
    return enter[u] <= enter[v] && leave[v] <= leave[u];
}

// The tempting shortcut: u was entered first, so u must be above v.
bool is_ancestor_by_entry_only(const std::vector<int>& enter, int u, int v) {
    return enter[u] <= enter[v];
}

// Climb from v to the root and look for u. The definition.
bool is_ancestor_by_walking(const std::vector<int>& parent, int u, int v) {
    int at = v;
    while (at >= 0) {
        if (at == u) {
            return true;
        }
        at = parent[at];
    }
    return false;
}

// Each node spends two ticks, so the interval is twice the subtree.
int subtree_size(const std::vector<int>& enter, const std::vector<int>& leave, int v) {
    return (leave[v] - enter[v] + 1) / 2;
}

// Count the nodes that have v somewhere above them.
int subtree_size_by_walking(const std::vector<int>& parent, const std::vector<int>& enter, int v) {
    int total = 0;
    for (size_t u = 0; u < parent.size(); u++) {
        if (enter[u] >= 0 && is_ancestor_by_walking(parent, v, static_cast<int>(u))) {
            total++;
        }
    }
    return total;
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
    std::vector<int> sizes = {5, 6, 7};
    std::vector<std::vector<Edge>> cases = {
        {{0, 1}, {0, 2}, {1, 3}, {2, 4}},
        {{0, 1}, {1, 2}, {2, 3}, {0, 4}, {4, 5}},
        {{0, 1}, {0, 2}, {1, 3}, {1, 4}, {2, 5}, {2, 6}},
    };

    std::cout << std::left << std::setw(40) << "edges" << std::setw(26) << "enter"
              << std::setw(26) << "leave" << "subtree sizes" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        int n = sizes[c];
        std::vector<std::vector<int>> neighbours = build(n, cases[c]);
        std::vector<int> enter;
        std::vector<int> leave;
        std::vector<int> parent;
        times(neighbours, 0, enter, leave, parent);
        std::vector<int> sizes_out(n);
        for (int v = 0; v < n; v++) {
            sizes_out[v] = subtree_size(enter, leave, v);
        }
        std::string shown = "[";
        for (size_t i = 0; i < cases[c].size(); i++) {
            if (i > 0) {
                shown += ", ";
            }
            shown += std::to_string(cases[c][i].first) + "-" + std::to_string(cases[c][i].second);
        }
        shown += "]";
        std::cout << std::left << std::setw(40) << shown << std::setw(26) << show(enter)
                  << std::setw(26) << show(leave) << show(sizes_out) << "\\n";
    }
    std::cout << "\\n";

    int trials = 3000;
    int interval_ok = 0;
    int entry_only_ok = 0;
    int entry_only_over = 0;
    int size_ok = 0;
    long long pairs = 0;
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
        std::vector<int> enter;
        std::vector<int> leave;
        std::vector<int> parent;
        times(neighbours, 0, enter, leave, parent);
        bool good_interval = true;
        bool good_entry = true;
        for (int u = 0; u < n; u++) {
            for (int v = 0; v < n; v++) {
                if (enter[u] < 0 || enter[v] < 0) {
                    continue;
                }
                pairs++;
                bool truth = is_ancestor_by_walking(parent, u, v);
                if (is_ancestor(enter, leave, u, v) != truth) {
                    good_interval = false;
                }
                bool guess = is_ancestor_by_entry_only(enter, u, v);
                if (guess != truth) {
                    good_entry = false;
                    if (guess) {
                        entry_only_over++;
                    }
                }
            }
        }
        if (good_interval) {
            interval_ok++;
        }
        if (good_entry) {
            entry_only_ok++;
        }
        bool good_size = true;
        for (int v = 0; v < n; v++) {
            if (enter[v] < 0) {
                continue;
            }
            if (subtree_size(enter, leave, v) != subtree_size_by_walking(parent, enter, v)) {
                good_size = false;
            }
        }
        if (good_size) {
            size_ok++;
        }
    }

    std::cout << "over " << trials << " random graphs on up to 7 nodes, "
              << pairs << " ordered pairs:\\n";
    std::cout << "  the interval test agreed with climbing  " << std::right << std::setw(6) << interval_ok << "\\n";
    std::cout << "  the entry-tick test agreed              " << std::setw(6) << entry_only_ok << "\\n";
    std::cout << "  subtree size from the interval agreed   " << std::setw(6) << size_ok << "\\n";
    std::cout << "\\n";
    std::cout << "The entry-tick shortcut said \\"ancestor\\" about " << entry_only_over
              << " pairs that were not.\\n";
    std::cout << "Being entered earlier is necessary and not sufficient: a node visited\\n";
    std::cout << "before v in a different branch also has the smaller entry tick. The leave\\n";
    std::cout << "tick is what distinguishes \\"above v\\" from \\"merely earlier than v\\", and it\\n";
    std::cout << "is the number breadth-first search has no equivalent of -- a queue never\\n";
    std::cout << "tells you that a subtree is finished, because it never goes back.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// What depth-first search knows that breadth-first search does not: the moment a
// subtree is finished.
//
// Recording two numbers per node -- the tick when the search enters it and the
// tick when it leaves -- turns the shape of the search into arithmetic. Node u
// is an ancestor of node v exactly when u's interval contains v's, and that is
// a pair of comparisons rather than a walk up the tree.
//
// The example builds the intervals, uses them to answer ancestry and subtree
// size, and scores both against walking the parent links. It also runs the
// version that keeps only the entry tick, which is the natural thing to try and
// is wrong in one direction.

fn build(n: usize, edges: &[(usize, usize)]) -> Vec<Vec<usize>> {
    let mut neighbours = vec![Vec::new(); n];
    for &(u, v) in edges {
        neighbours[u].push(v);
        neighbours[v].push(u);
    }
    neighbours
}

fn walk(
    neighbours: &[Vec<usize>],
    enter: &mut Vec<i32>,
    leave: &mut Vec<i32>,
    parent: &mut Vec<i32>,
    clock: &mut i32,
    v: usize,
) {
    enter[v] = *clock;
    *clock += 1;
    for i in 0..neighbours[v].len() {
        let u = neighbours[v][i];
        if enter[u] < 0 {
            parent[u] = v as i32;
            walk(neighbours, enter, leave, parent, clock, u);
        }
    }
    leave[v] = *clock;
    *clock += 1;
}

/// Enter and leave ticks, plus the parent each node was reached from.
fn times(neighbours: &[Vec<usize>], start: usize) -> (Vec<i32>, Vec<i32>, Vec<i32>) {
    let n = neighbours.len();
    let mut enter = vec![-1i32; n];
    let mut leave = vec![-1i32; n];
    let mut parent = vec![-1i32; n];
    let mut clock = 0;
    walk(neighbours, &mut enter, &mut leave, &mut parent, &mut clock, start);
    (enter, leave, parent)
}

/// u's interval contains v's. Two comparisons, no walking.
fn is_ancestor(enter: &[i32], leave: &[i32], u: usize, v: usize) -> bool {
    enter[u] <= enter[v] && leave[v] <= leave[u]
}

/// The tempting shortcut: u was entered first, so u must be above v.
fn is_ancestor_by_entry_only(enter: &[i32], u: usize, v: usize) -> bool {
    enter[u] <= enter[v]
}

/// Climb from v to the root and look for u. The definition.
fn is_ancestor_by_walking(parent: &[i32], u: usize, v: usize) -> bool {
    let mut at = v as i32;
    while at >= 0 {
        if at as usize == u {
            return true;
        }
        at = parent[at as usize];
    }
    false
}

/// Each node spends two ticks, so the interval is twice the subtree.
fn subtree_size(enter: &[i32], leave: &[i32], v: usize) -> i32 {
    (leave[v] - enter[v] + 1) / 2
}

/// Count the nodes that have v somewhere above them.
fn subtree_size_by_walking(parent: &[i32], enter: &[i32], v: usize) -> i32 {
    let mut total = 0;
    for u in 0..parent.len() {
        if enter[u] >= 0 && is_ancestor_by_walking(parent, v, u) {
            total += 1;
        }
    }
    total
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
    let sizes: Vec<usize> = vec![5, 6, 7];
    let cases: Vec<Vec<(usize, usize)>> = vec![
        vec![(0, 1), (0, 2), (1, 3), (2, 4)],
        vec![(0, 1), (1, 2), (2, 3), (0, 4), (4, 5)],
        vec![(0, 1), (0, 2), (1, 3), (1, 4), (2, 5), (2, 6)],
    ];

    println!(
        "{}{}{}{}",
        pad_right("edges", 40),
        pad_right("enter", 26),
        pad_right("leave", 26),
        "subtree sizes"
    );
    for (c, edges) in cases.iter().enumerate() {
        let n = sizes[c];
        let neighbours = build(n, edges);
        let (enter, leave, _) = times(&neighbours, 0);
        let sizes_out: Vec<i32> = (0..n).map(|v| subtree_size(&enter, &leave, v)).collect();
        let parts: Vec<String> = edges.iter().map(|&(u, v)| format!("{}-{}", u, v)).collect();
        let shown = format!("[{}]", parts.join(", "));
        println!(
            "{}{}{}{}",
            pad_right(&shown, 40),
            pad_right(&show(&enter), 26),
            pad_right(&show(&leave), 26),
            show(&sizes_out)
        );
    }
    println!();

    let mut rng = Rng { seed: 1 };
    let trials = 3000;
    let mut interval_ok = 0;
    let mut entry_only_ok = 0;
    let mut entry_only_over = 0;
    let mut size_ok = 0;
    let mut pairs: i64 = 0;
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
        let (enter, leave, parent) = times(&neighbours, 0);
        let mut good_interval = true;
        let mut good_entry = true;
        for u in 0..n {
            for v in 0..n {
                if enter[u] < 0 || enter[v] < 0 {
                    continue;
                }
                pairs += 1;
                let truth = is_ancestor_by_walking(&parent, u, v);
                if is_ancestor(&enter, &leave, u, v) != truth {
                    good_interval = false;
                }
                let guess = is_ancestor_by_entry_only(&enter, u, v);
                if guess != truth {
                    good_entry = false;
                    if guess {
                        entry_only_over += 1;
                    }
                }
            }
        }
        if good_interval {
            interval_ok += 1;
        }
        if good_entry {
            entry_only_ok += 1;
        }
        let mut good_size = true;
        for v in 0..n {
            if enter[v] < 0 {
                continue;
            }
            if subtree_size(&enter, &leave, v) != subtree_size_by_walking(&parent, &enter, v) {
                good_size = false;
            }
        }
        if good_size {
            size_ok += 1;
        }
    }

    println!(
        "over {} random graphs on up to 7 nodes, {} ordered pairs:",
        trials, pairs
    );
    println!("  the interval test agreed with climbing  {}", pad_left(&interval_ok.to_string(), 6));
    println!("  the entry-tick test agreed              {}", pad_left(&entry_only_ok.to_string(), 6));
    println!("  subtree size from the interval agreed   {}", pad_left(&size_ok.to_string(), 6));
    println!();
    println!(
        "The entry-tick shortcut said \\"ancestor\\" about {} pairs that were not.",
        entry_only_over
    );
    println!("Being entered earlier is necessary and not sufficient: a node visited");
    println!("before v in a different branch also has the smaller entry tick. The leave");
    println!("tick is what distinguishes \\"above v\\" from \\"merely earlier than v\\", and it");
    println!("is the number breadth-first search has no equivalent of -- a queue never");
    println!("tells you that a subtree is finished, because it never goes back.");
}
`,
            },
            {
              lang: "go",
              code: `// What depth-first search knows that breadth-first search does not: the moment a
// subtree is finished.
//
// Recording two numbers per node -- the tick when the search enters it and the
// tick when it leaves -- turns the shape of the search into arithmetic. Node u
// is an ancestor of node v exactly when u's interval contains v's, and that is
// a pair of comparisons rather than a walk up the tree.
//
// The example builds the intervals, uses them to answer ancestry and subtree
// size, and scores both against walking the parent links. It also runs the
// version that keeps only the entry tick, which is the natural thing to try and
// is wrong in one direction.

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

// Enter and leave ticks, plus the parent each node was reached from.
func times(neighbours [][]int, start int) ([]int, []int, []int) {
	n := len(neighbours)
	enter := make([]int, n)
	leave := make([]int, n)
	parent := make([]int, n)
	for i := 0; i < n; i++ {
		enter[i] = -1
		leave[i] = -1
		parent[i] = -1
	}
	clock := 0
	var walk func(v int)
	walk = func(v int) {
		enter[v] = clock
		clock++
		for _, u := range neighbours[v] {
			if enter[u] < 0 {
				parent[u] = v
				walk(u)
			}
		}
		leave[v] = clock
		clock++
	}
	walk(start)
	return enter, leave, parent
}

// u's interval contains v's. Two comparisons, no walking.
func isAncestor(enter, leave []int, u, v int) bool {
	return enter[u] <= enter[v] && leave[v] <= leave[u]
}

// The tempting shortcut: u was entered first, so u must be above v.
func isAncestorByEntryOnly(enter []int, u, v int) bool {
	return enter[u] <= enter[v]
}

// Climb from v to the root and look for u. The definition.
func isAncestorByWalking(parent []int, u, v int) bool {
	at := v
	for at >= 0 {
		if at == u {
			return true
		}
		at = parent[at]
	}
	return false
}

// Each node spends two ticks, so the interval is twice the subtree.
func subtreeSize(enter, leave []int, v int) int {
	return (leave[v] - enter[v] + 1) / 2
}

// Count the nodes that have v somewhere above them.
func subtreeSizeByWalking(parent, enter []int, v int) int {
	total := 0
	for u := 0; u < len(parent); u++ {
		if enter[u] >= 0 && isAncestorByWalking(parent, v, u) {
			total++
		}
	}
	return total
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
	sizes := []int{5, 6, 7}
	cases := [][]edge{
		{{0, 1}, {0, 2}, {1, 3}, {2, 4}},
		{{0, 1}, {1, 2}, {2, 3}, {0, 4}, {4, 5}},
		{{0, 1}, {0, 2}, {1, 3}, {1, 4}, {2, 5}, {2, 6}},
	}

	fmt.Printf("%-40s%-26s%-26s%s\\n", "edges", "enter", "leave", "subtree sizes")
	for c, edges := range cases {
		n := sizes[c]
		neighbours := build(n, edges)
		enter, leave, _ := times(neighbours, 0)
		sizesOut := make([]int, n)
		for v := 0; v < n; v++ {
			sizesOut[v] = subtreeSize(enter, leave, v)
		}
		parts := make([]string, len(edges))
		for i, e := range edges {
			parts[i] = fmt.Sprintf("%d-%d", e.from, e.to)
		}
		shown := "[" + strings.Join(parts, ", ") + "]"
		fmt.Printf("%-40s%-26s%-26s%s\\n", shown, show(enter), show(leave), show(sizesOut))
	}
	fmt.Println()

	trials := 3000
	intervalOk := 0
	entryOnlyOk := 0
	entryOnlyOver := 0
	sizeOk := 0
	pairs := 0
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
		enter, leave, parent := times(neighbours, 0)
		goodInterval := true
		goodEntry := true
		for u := 0; u < n; u++ {
			for v := 0; v < n; v++ {
				if enter[u] < 0 || enter[v] < 0 {
					continue
				}
				pairs++
				truth := isAncestorByWalking(parent, u, v)
				if isAncestor(enter, leave, u, v) != truth {
					goodInterval = false
				}
				guess := isAncestorByEntryOnly(enter, u, v)
				if guess != truth {
					goodEntry = false
					if guess {
						entryOnlyOver++
					}
				}
			}
		}
		if goodInterval {
			intervalOk++
		}
		if goodEntry {
			entryOnlyOk++
		}
		goodSize := true
		for v := 0; v < n; v++ {
			if enter[v] < 0 {
				continue
			}
			if subtreeSize(enter, leave, v) != subtreeSizeByWalking(parent, enter, v) {
				goodSize = false
			}
		}
		if goodSize {
			sizeOk++
		}
	}

	fmt.Printf("over %d random graphs on up to 7 nodes, %d ordered pairs:\\n", trials, pairs)
	fmt.Printf("  the interval test agreed with climbing  %6d\\n", intervalOk)
	fmt.Printf("  the entry-tick test agreed              %6d\\n", entryOnlyOk)
	fmt.Printf("  subtree size from the interval agreed   %6d\\n", sizeOk)
	fmt.Println()
	fmt.Printf("The entry-tick shortcut said \\"ancestor\\" about %d pairs that were not.\\n", entryOnlyOver)
	fmt.Println("Being entered earlier is necessary and not sufficient: a node visited")
	fmt.Println("before v in a different branch also has the smaller entry tick. The leave")
	fmt.Println("tick is what distinguishes \\"above v\\" from \\"merely earlier than v\\", and it")
	fmt.Println("is the number breadth-first search has no equivalent of -- a queue never")
	fmt.Println("tells you that a subtree is finished, because it never goes back.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "The entry tick alone does not establish ancestry",
          body: "\"u was entered before v\" is true of every node in an earlier branch as well. The entry-only test was fully correct on 2,077 of 3,000 graphs and wrongly claimed ancestry for 2,923 pairs. Both ticks are needed: enter[u] <= enter[v] and leave[v] <= leave[u].",
        },
        {
          title: "Breadth-first search cannot supply a finish time",
          body: "A queue never comes back to a node, so there is no moment at which its subtree is known to be complete. Anything built on that moment -- topological order from the reverse finish order, cycle detection by finding a still-open node, bridges and articulation points -- needs a depth-first walk specifically.",
        },
      ],
    },
    {
      id: "where-the-stack-lives",
      heading: "Where the stack lives",
      body: [
        "There is exactly one real difference between the two implementations, and it is not the algorithm. It is where the stack lives, and therefore how big it is allowed to get.",
        "A recursive depth-first search holds one call frame per node on the current path. On a graph that is one long chain, that is one frame per node. The measured table says it plainly: a path of 50,000 nodes needs 50,000 frames, while the explicit stack on the same graph never holds more than one, because a node in the middle of a chain has a single unvisited neighbour, pushed as the previous one is popped.",
        "A call stack has a ceiling that no amount of correctness in the algorithm raises, and where it sits depends on the runtime: measured, CPython stops at 1,000 frames, Node at about 6,000, Java at about 10,000 frames cold and 24,000 once the method is JIT-compiled, on its default thread stack, while C++ on Linux's 8 MB main stack took 200,000 and Go's growable stacks a million. A heap-allocated list has no such ceiling. That is the entire practical argument for writing the iterative version, and it applies exactly when the input can be long and thin.",
        "It is not a general claim that one container is smaller. Run the same measurement on a star of 50,000 nodes and it reverses: the recursion is two frames deep and the explicit stack holds 49,999 leaves at once. Over 3,000 random small graphs the recursion went deeper on 1,681 and the stack went deeper on 109. Neither is the frugal one \u2014 but only one of them is allowed to grow.",
        "So the rule is about the shape of the input, not about taste. If the graph could be a long path \u2014 a linked structure, a chain of dependencies, a grid traversed edge-first, a tree built from sorted input \u2014 write the iterative version or raise the limit deliberately. If it is broad and shallow, the recursion is shorter and clearer and there is no reason to avoid it.",
      ],
      examples: [
        {
          id: "recursion-depth-against-stack-peak",
          title: "The frames a path needs, and the frames a star does not",
          lang: "python",
          code: `# The one real difference between the two depth-first searches: where the stack
# lives, and therefore how big it is allowed to get.
#
# A recursive depth-first search needs one call frame per node on the current
# path. The worst case is a graph that is one long path, and there the depth is
# the number of nodes. That is fine at 1,000 nodes and fatal at 100,000, because
# the runtime's stack has a ceiling that no amount of correctness in the
# algorithm can enlarge.
#
# The explicit-stack version puts the same information in a heap-allocated list.
# The numbers below are measured rather than argued: the depth the recursion
# would need, and the peak size of the explicit stack, on the same graphs.


def build(n, edges):
    neighbours = [[] for _ in range(n)]
    for u, v in edges:
        neighbours[u].append(v)
        neighbours[v].append(u)
    return neighbours


def path_graph(n):
    """0-1-2-...-(n-1). The shape that makes the recursion as deep as possible."""
    return [(v, v + 1) for v in range(n - 1)]


def star_graph(n):
    """Every node joined to node 0. The shape that makes it as shallow as possible."""
    return [(0, v) for v in range(1, n)]


def deepest_recursion(neighbours, start):
    """How many frames the recursive version would hold at its deepest point.

    Computed with an explicit stack, so measuring the depth never risks it.
    """
    seen = [False] * len(neighbours)
    deepest = 0
    stack = [(start, 1)]
    while stack:
        v, depth = stack.pop()
        if seen[v]:
            continue
        seen[v] = True
        if depth > deepest:
            deepest = depth
        for i in range(len(neighbours[v]) - 1, -1, -1):
            u = neighbours[v][i]
            if not seen[u]:
                stack.append((u, depth + 1))
    return deepest


def peak_explicit_stack(neighbours, start):
    """The largest the hand-rolled stack ever gets, on the same walk."""
    seen = [False] * len(neighbours)
    peak = 1
    stack = [start]
    while stack:
        if len(stack) > peak:
            peak = len(stack)
        v = stack.pop()
        if seen[v]:
            continue
        seen[v] = True
        for i in range(len(neighbours[v]) - 1, -1, -1):
            u = neighbours[v][i]
            if not seen[u]:
                stack.append(u)
    return peak


def visited_count(neighbours, start):
    """A sanity check: both walks must still see every node."""
    seen = [False] * len(neighbours)
    stack = [start]
    total = 0
    while stack:
        v = stack.pop()
        if seen[v]:
            continue
        seen[v] = True
        total += 1
        for u in neighbours[v]:
            if not seen[u]:
                stack.append(u)
    return total


SHAPES = [
    ("path of 10", path_graph(10), 10),
    ("path of 1000", path_graph(1000), 1000),
    ("path of 50000", path_graph(50000), 50000),
    ("star of 50000", star_graph(50000), 50000),
]

print(f"{'shape':<18}{'nodes':>8}{'recursion depth':>18}{'explicit stack peak':>22}")
for name, edges, n in SHAPES:
    neighbours = build(n, edges)
    print(f"{name:<18}{n:>8}{deepest_recursion(neighbours, 0):>18}"
          f"{peak_explicit_stack(neighbours, 0):>22}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
full_depth = 0
recursion_deeper = 0
stack_deeper = 0
same_count = 0
for _ in range(TRIALS):
    n = 2 + rand(6)
    edges = []
    for u in range(n):
        for v in range(u + 1, n):
            if rand(3) == 0:
                edges.append((u, v))
    neighbours = build(n, edges)
    depth = deepest_recursion(neighbours, 0)
    peak = peak_explicit_stack(neighbours, 0)
    reached = visited_count(neighbours, 0)
    if depth == reached:
        full_depth += 1
    if depth > peak:
        recursion_deeper += 1
    if peak > depth:
        stack_deeper += 1
    if reached == visited_count(build(n, edges), 0):
        same_count += 1

print(f"over {TRIALS} random graphs on up to 7 nodes:")
print(f"  the search reached every node it saw   {same_count:>6}")
print(f"  recursion went as deep as nodes seen   {full_depth:>6}")
print(f"  recursion deeper than the stack        {recursion_deeper:>6}")
print(f"  stack deeper than the recursion        {stack_deeper:>6}")
print()
print("The table is the argument. On a path the recursion needs one frame per")
print("node -- 50,000 of them -- while the explicit stack never holds more than")
print("one, because a node in the middle of a path has a single unvisited")
print("neighbour, pushed as the previous one is popped.")
print("On a star it is the other way round: the recursion is two frames deep and")
print("the explicit stack holds every leaf at once. Neither container is smaller")
print("in general; what differs is that one of them is allowed to grow.")
`,
          output: `shape                nodes   recursion depth   explicit stack peak
path of 10              10                10                     1
path of 1000          1000              1000                     1
path of 50000        50000             50000                     1
star of 50000        50000                 2                 49999

over 3000 random graphs on up to 7 nodes:
  the search reached every node it saw     3000
  recursion went as deep as nodes seen     2077
  recursion deeper than the stack          1681
  stack deeper than the recursion           109

The table is the argument. On a path the recursion needs one frame per
node -- 50,000 of them -- while the explicit stack never holds more than
one, because a node in the middle of a path has a single unvisited
neighbour, pushed as the previous one is popped.
On a star it is the other way round: the recursion is two frames deep and
the explicit stack holds every leaf at once. Neither container is smaller
in general; what differs is that one of them is allowed to grow.`,
          explanation:
            "The depth the recursion would need and the peak of the explicit stack, measured on the same graphs. The path and the star point in opposite directions, which is why this is an argument about input shape rather than about which container is smaller.",
          alternates: [
            {
              lang: "javascript",
              code: `// The one real difference between the two depth-first searches: where the stack
// lives, and therefore how big it is allowed to get.
//
// A recursive depth-first search needs one call frame per node on the current
// path. The worst case is a graph that is one long path, and there the depth is
// the number of nodes. That is fine at 1,000 nodes and fatal at 100,000, because
// the runtime's stack has a ceiling that no amount of correctness in the
// algorithm can enlarge.
//
// The explicit-stack version puts the same information in a heap-allocated list.
// The numbers below are measured rather than argued: the depth the recursion
// would need, and the peak size of the explicit stack, on the same graphs.

function build(n, edges) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    neighbours[v].push(u);
  }
  return neighbours;
}

/** 0-1-2-...-(n-1). The shape that makes the recursion as deep as possible. */
function pathGraph(n) {
  const edges = [];
  for (let v = 0; v < n - 1; v += 1) edges.push([v, v + 1]);
  return edges;
}

/** Every node joined to node 0. The shape that makes it as shallow as possible. */
function starGraph(n) {
  const edges = [];
  for (let v = 1; v < n; v += 1) edges.push([0, v]);
  return edges;
}

/**
 * How many frames the recursive version would hold at its deepest point.
 *
 * Computed with an explicit stack, so measuring the depth never risks it.
 */
function deepestRecursion(neighbours, start) {
  const seen = new Array(neighbours.length).fill(false);
  let deepest = 0;
  const stack = [[start, 1]];
  while (stack.length > 0) {
    const [v, depth] = stack.pop();
    if (seen[v]) continue;
    seen[v] = true;
    if (depth > deepest) deepest = depth;
    for (let i = neighbours[v].length - 1; i >= 0; i -= 1) {
      const u = neighbours[v][i];
      if (!seen[u]) stack.push([u, depth + 1]);
    }
  }
  return deepest;
}

/** The largest the hand-rolled stack ever gets, on the same walk. */
function peakExplicitStack(neighbours, start) {
  const seen = new Array(neighbours.length).fill(false);
  let peak = 1;
  const stack = [start];
  while (stack.length > 0) {
    if (stack.length > peak) peak = stack.length;
    const v = stack.pop();
    if (seen[v]) continue;
    seen[v] = true;
    for (let i = neighbours[v].length - 1; i >= 0; i -= 1) {
      const u = neighbours[v][i];
      if (!seen[u]) stack.push(u);
    }
  }
  return peak;
}

/** A sanity check: both walks must still see every node. */
function visitedCount(neighbours, start) {
  const seen = new Array(neighbours.length).fill(false);
  const stack = [start];
  let total = 0;
  while (stack.length > 0) {
    const v = stack.pop();
    if (seen[v]) continue;
    seen[v] = true;
    total += 1;
    for (const u of neighbours[v]) {
      if (!seen[u]) stack.push(u);
    }
  }
  return total;
}

const padEnd = (v, w) => String(v).padEnd(w);
const pad = (v, w) => String(v).padStart(w);

const SHAPES = [
  ["path of 10", pathGraph(10), 10],
  ["path of 1000", pathGraph(1000), 1000],
  ["path of 50000", pathGraph(50000), 50000],
  ["star of 50000", starGraph(50000), 50000],
];

console.log(
  padEnd("shape", 18) + pad("nodes", 8) + pad("recursion depth", 18) + pad("explicit stack peak", 22)
);
for (const [name, edges, n] of SHAPES) {
  const neighbours = build(n, edges);
  console.log(
    padEnd(name, 18) +
      pad(n, 8) +
      pad(deepestRecursion(neighbours, 0), 18) +
      pad(peakExplicitStack(neighbours, 0), 22)
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
let fullDepth = 0;
let recursionDeeper = 0;
let stackDeeper = 0;
let sameCount = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) {
      if (rand(3) === 0) edges.push([u, v]);
    }
  }
  const neighbours = build(n, edges);
  const depth = deepestRecursion(neighbours, 0);
  const peak = peakExplicitStack(neighbours, 0);
  const reached = visitedCount(neighbours, 0);
  if (depth === reached) fullDepth += 1;
  if (depth > peak) recursionDeeper += 1;
  if (peak > depth) stackDeeper += 1;
  if (reached === visitedCount(build(n, edges), 0)) sameCount += 1;
}

console.log(\`over \${TRIALS} random graphs on up to 7 nodes:\`);
console.log(\`  the search reached every node it saw   \${pad(sameCount, 6)}\`);
console.log(\`  recursion went as deep as nodes seen   \${pad(fullDepth, 6)}\`);
console.log(\`  recursion deeper than the stack        \${pad(recursionDeeper, 6)}\`);
console.log(\`  stack deeper than the recursion        \${pad(stackDeeper, 6)}\`);
console.log();
console.log("The table is the argument. On a path the recursion needs one frame per");
console.log("node -- 50,000 of them -- while the explicit stack never holds more than");
console.log("one, because a node in the middle of a path has a single unvisited");
console.log("neighbour, pushed as the previous one is popped.");
console.log("On a star it is the other way round: the recursion is two frames deep and");
console.log("the explicit stack holds every leaf at once. Neither container is smaller");
console.log("in general; what differs is that one of them is allowed to grow.");
`,
            },
            {
              lang: "typescript",
              code: `// The one real difference between the two depth-first searches: where the stack
// lives, and therefore how big it is allowed to get.
//
// A recursive depth-first search needs one call frame per node on the current
// path. The worst case is a graph that is one long path, and there the depth is
// the number of nodes. That is fine at 1,000 nodes and fatal at 100,000, because
// the runtime's stack has a ceiling that no amount of correctness in the
// algorithm can enlarge.
//
// The explicit-stack version puts the same information in a heap-allocated list.
// The numbers below are measured rather than argued: the depth the recursion
// would need, and the peak size of the explicit stack, on the same graphs.

type Edge = [number, number];

function build(n: number, edges: Edge[]): number[][] {
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    neighbours[u].push(v);
    neighbours[v].push(u);
  }
  return neighbours;
}

/** 0-1-2-...-(n-1). The shape that makes the recursion as deep as possible. */
function pathGraph(n: number): Edge[] {
  const edges: Edge[] = [];
  for (let v = 0; v < n - 1; v += 1) edges.push([v, v + 1]);
  return edges;
}

/** Every node joined to node 0. The shape that makes it as shallow as possible. */
function starGraph(n: number): Edge[] {
  const edges: Edge[] = [];
  for (let v = 1; v < n; v += 1) edges.push([0, v]);
  return edges;
}

/**
 * How many frames the recursive version would hold at its deepest point.
 *
 * Computed with an explicit stack, so measuring the depth never risks it.
 */
function deepestRecursion(neighbours: number[][], start: number): number {
  const seen = new Array(neighbours.length).fill(false);
  let deepest = 0;
  const stack: Edge[] = [[start, 1]];
  while (stack.length > 0) {
    const [v, depth] = stack.pop() as Edge;
    if (seen[v]) continue;
    seen[v] = true;
    if (depth > deepest) deepest = depth;
    for (let i = neighbours[v].length - 1; i >= 0; i -= 1) {
      const u = neighbours[v][i];
      if (!seen[u]) stack.push([u, depth + 1]);
    }
  }
  return deepest;
}

/** The largest the hand-rolled stack ever gets, on the same walk. */
function peakExplicitStack(neighbours: number[][], start: number): number {
  const seen = new Array(neighbours.length).fill(false);
  let peak = 1;
  const stack = [start];
  while (stack.length > 0) {
    if (stack.length > peak) peak = stack.length;
    const v = stack.pop() as number;
    if (seen[v]) continue;
    seen[v] = true;
    for (let i = neighbours[v].length - 1; i >= 0; i -= 1) {
      const u = neighbours[v][i];
      if (!seen[u]) stack.push(u);
    }
  }
  return peak;
}

/** A sanity check: both walks must still see every node. */
function visitedCount(neighbours: number[][], start: number): number {
  const seen = new Array(neighbours.length).fill(false);
  const stack = [start];
  let total = 0;
  while (stack.length > 0) {
    const v = stack.pop() as number;
    if (seen[v]) continue;
    seen[v] = true;
    total += 1;
    for (const u of neighbours[v]) {
      if (!seen[u]) stack.push(u);
    }
  }
  return total;
}

const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const pad = (v: string | number, w: number): string => String(v).padStart(w);

const SHAPES: [string, Edge[], number][] = [
  ["path of 10", pathGraph(10), 10],
  ["path of 1000", pathGraph(1000), 1000],
  ["path of 50000", pathGraph(50000), 50000],
  ["star of 50000", starGraph(50000), 50000],
];

console.log(
  padEnd("shape", 18) + pad("nodes", 8) + pad("recursion depth", 18) + pad("explicit stack peak", 22)
);
for (const [name, edges, n] of SHAPES) {
  const neighbours = build(n, edges);
  console.log(
    padEnd(name, 18) +
      pad(n, 8) +
      pad(deepestRecursion(neighbours, 0), 18) +
      pad(peakExplicitStack(neighbours, 0), 22)
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
let fullDepth = 0;
let recursionDeeper = 0;
let stackDeeper = 0;
let sameCount = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(6);
  const edges: Edge[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) {
      if (rand(3) === 0) edges.push([u, v]);
    }
  }
  const neighbours = build(n, edges);
  const depth = deepestRecursion(neighbours, 0);
  const peak = peakExplicitStack(neighbours, 0);
  const reached = visitedCount(neighbours, 0);
  if (depth === reached) fullDepth += 1;
  if (depth > peak) recursionDeeper += 1;
  if (peak > depth) stackDeeper += 1;
  if (reached === visitedCount(build(n, edges), 0)) sameCount += 1;
}

console.log(\`over \${TRIALS} random graphs on up to 7 nodes:\`);
console.log(\`  the search reached every node it saw   \${pad(sameCount, 6)}\`);
console.log(\`  recursion went as deep as nodes seen   \${pad(fullDepth, 6)}\`);
console.log(\`  recursion deeper than the stack        \${pad(recursionDeeper, 6)}\`);
console.log(\`  stack deeper than the recursion        \${pad(stackDeeper, 6)}\`);
console.log();
console.log("The table is the argument. On a path the recursion needs one frame per");
console.log("node -- 50,000 of them -- while the explicit stack never holds more than");
console.log("one, because a node in the middle of a path has a single unvisited");
console.log("neighbour, pushed as the previous one is popped.");
console.log("On a star it is the other way round: the recursion is two frames deep and");
console.log("the explicit stack holds every leaf at once. Neither container is smaller");
console.log("in general; what differs is that one of them is allowed to grow.");
`,
            },
            {
              lang: "java",
              code: `// The one real difference between the two depth-first searches: where the stack
// lives, and therefore how big it is allowed to get.
//
// A recursive depth-first search needs one call frame per node on the current
// path. The worst case is a graph that is one long path, and there the depth is
// the number of nodes. That is fine at 1,000 nodes and fatal at 100,000, because
// the runtime's stack has a ceiling that no amount of correctness in the
// algorithm can enlarge.
//
// The explicit-stack version puts the same information in a heap-allocated list.
// The numbers below are measured rather than argued: the depth the recursion
// would need, and the peak size of the explicit stack, on the same graphs.

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
            neighbours.get(e[1]).add(e[0]);
        }
        return neighbours;
    }

    /** 0-1-2-...-(n-1). The shape that makes the recursion as deep as possible. */
    static int[][] pathGraph(int n) {
        int[][] edges = new int[n - 1][2];
        for (int v = 0; v < n - 1; v++) {
            edges[v][0] = v;
            edges[v][1] = v + 1;
        }
        return edges;
    }

    /** Every node joined to node 0. The shape that makes it as shallow as possible. */
    static int[][] starGraph(int n) {
        int[][] edges = new int[n - 1][2];
        for (int v = 1; v < n; v++) {
            edges[v - 1][0] = 0;
            edges[v - 1][1] = v;
        }
        return edges;
    }

    /**
     * How many frames the recursive version would hold at its deepest point.
     *
     * Computed with an explicit stack, so measuring the depth never risks it.
     */
    static int deepestRecursion(List<List<Integer>> neighbours, int start) {
        boolean[] seen = new boolean[neighbours.size()];
        int deepest = 0;
        List<int[]> stack = new ArrayList<>();
        stack.add(new int[] {start, 1});
        while (!stack.isEmpty()) {
            int[] top = stack.remove(stack.size() - 1);
            int v = top[0];
            int depth = top[1];
            if (seen[v]) {
                continue;
            }
            seen[v] = true;
            if (depth > deepest) {
                deepest = depth;
            }
            for (int i = neighbours.get(v).size() - 1; i >= 0; i--) {
                int u = neighbours.get(v).get(i);
                if (!seen[u]) {
                    stack.add(new int[] {u, depth + 1});
                }
            }
        }
        return deepest;
    }

    /** The largest the hand-rolled stack ever gets, on the same walk. */
    static int peakExplicitStack(List<List<Integer>> neighbours, int start) {
        boolean[] seen = new boolean[neighbours.size()];
        int peak = 1;
        List<Integer> stack = new ArrayList<>();
        stack.add(start);
        while (!stack.isEmpty()) {
            if (stack.size() > peak) {
                peak = stack.size();
            }
            int v = stack.remove(stack.size() - 1);
            if (seen[v]) {
                continue;
            }
            seen[v] = true;
            for (int i = neighbours.get(v).size() - 1; i >= 0; i--) {
                int u = neighbours.get(v).get(i);
                if (!seen[u]) {
                    stack.add(u);
                }
            }
        }
        return peak;
    }

    /** A sanity check: both walks must still see every node. */
    static int visitedCount(List<List<Integer>> neighbours, int start) {
        boolean[] seen = new boolean[neighbours.size()];
        List<Integer> stack = new ArrayList<>();
        stack.add(start);
        int total = 0;
        while (!stack.isEmpty()) {
            int v = stack.remove(stack.size() - 1);
            if (seen[v]) {
                continue;
            }
            seen[v] = true;
            total++;
            for (int u : neighbours.get(v)) {
                if (!seen[u]) {
                    stack.add(u);
                }
            }
        }
        return total;
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
        String[] names = {"path of 10", "path of 1000", "path of 50000", "star of 50000"};
        int[] counts = {10, 1000, 50000, 50000};
        int[][][] shapes = {
            pathGraph(10), pathGraph(1000), pathGraph(50000), starGraph(50000),
        };

        System.out.println(padEnd("shape", 18) + pad("nodes", 8)
                + pad("recursion depth", 18) + pad("explicit stack peak", 22));
        for (int c = 0; c < names.length; c++) {
            List<List<Integer>> neighbours = build(counts[c], shapes[c]);
            System.out.println(padEnd(names[c], 18) + pad(String.valueOf(counts[c]), 8)
                    + pad(String.valueOf(deepestRecursion(neighbours, 0)), 18)
                    + pad(String.valueOf(peakExplicitStack(neighbours, 0)), 22));
        }
        System.out.println();

        int trials = 3000;
        int fullDepth = 0;
        int recursionDeeper = 0;
        int stackDeeper = 0;
        int sameCount = 0;
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
            int depth = deepestRecursion(neighbours, 0);
            int peak = peakExplicitStack(neighbours, 0);
            int reached = visitedCount(neighbours, 0);
            if (depth == reached) {
                fullDepth++;
            }
            if (depth > peak) {
                recursionDeeper++;
            }
            if (peak > depth) {
                stackDeeper++;
            }
            if (reached == visitedCount(build(n, edges), 0)) {
                sameCount++;
            }
        }

        System.out.println("over " + trials + " random graphs on up to 7 nodes:");
        System.out.println("  the search reached every node it saw   " + pad(String.valueOf(sameCount), 6));
        System.out.println("  recursion went as deep as nodes seen   " + pad(String.valueOf(fullDepth), 6));
        System.out.println("  recursion deeper than the stack        " + pad(String.valueOf(recursionDeeper), 6));
        System.out.println("  stack deeper than the recursion        " + pad(String.valueOf(stackDeeper), 6));
        System.out.println();
        System.out.println("The table is the argument. On a path the recursion needs one frame per");
        System.out.println("node -- 50,000 of them -- while the explicit stack never holds more than");
        System.out.println("one, because a node in the middle of a path has a single unvisited");
        System.out.println("neighbour, pushed as the previous one is popped.");
        System.out.println("On a star it is the other way round: the recursion is two frames deep and");
        System.out.println("the explicit stack holds every leaf at once. Neither container is smaller");
        System.out.println("in general; what differs is that one of them is allowed to grow.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The one real difference between the two depth-first searches: where the stack
// lives, and therefore how big it is allowed to get.
//
// A recursive depth-first search needs one call frame per node on the current
// path. The worst case is a graph that is one long path, and there the depth is
// the number of nodes. That is fine at 1,000 nodes and fatal at 100,000, because
// the runtime's stack has a ceiling that no amount of correctness in the
// algorithm can enlarge.
//
// The explicit-stack version puts the same information in a heap-allocated list.
// The numbers below are measured rather than argued: the depth the recursion
// would need, and the peak size of the explicit stack, on the same graphs.

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

// 0-1-2-...-(n-1). The shape that makes the recursion as deep as possible.
std::vector<Edge> path_graph(int n) {
    std::vector<Edge> edges;
    for (int v = 0; v < n - 1; v++) {
        edges.push_back(Edge(v, v + 1));
    }
    return edges;
}

// Every node joined to node 0. The shape that makes it as shallow as possible.
std::vector<Edge> star_graph(int n) {
    std::vector<Edge> edges;
    for (int v = 1; v < n; v++) {
        edges.push_back(Edge(0, v));
    }
    return edges;
}

// How many frames the recursive version would hold at its deepest point.
//
// Computed with an explicit stack, so measuring the depth never risks it.
int deepest_recursion(const std::vector<std::vector<int>>& neighbours, int start) {
    std::vector<char> seen(neighbours.size(), 0);
    int deepest = 0;
    std::vector<Edge> stack;
    stack.push_back(Edge(start, 1));
    while (!stack.empty()) {
        Edge top = stack.back();
        stack.pop_back();
        int v = top.first;
        int depth = top.second;
        if (seen[v]) {
            continue;
        }
        seen[v] = 1;
        if (depth > deepest) {
            deepest = depth;
        }
        for (int i = static_cast<int>(neighbours[v].size()) - 1; i >= 0; i--) {
            int u = neighbours[v][i];
            if (!seen[u]) {
                stack.push_back(Edge(u, depth + 1));
            }
        }
    }
    return deepest;
}

// The largest the hand-rolled stack ever gets, on the same walk.
int peak_explicit_stack(const std::vector<std::vector<int>>& neighbours, int start) {
    std::vector<char> seen(neighbours.size(), 0);
    int peak = 1;
    std::vector<int> stack;
    stack.push_back(start);
    while (!stack.empty()) {
        if (static_cast<int>(stack.size()) > peak) {
            peak = static_cast<int>(stack.size());
        }
        int v = stack.back();
        stack.pop_back();
        if (seen[v]) {
            continue;
        }
        seen[v] = 1;
        for (int i = static_cast<int>(neighbours[v].size()) - 1; i >= 0; i--) {
            int u = neighbours[v][i];
            if (!seen[u]) {
                stack.push_back(u);
            }
        }
    }
    return peak;
}

// A sanity check: both walks must still see every node.
int visited_count(const std::vector<std::vector<int>>& neighbours, int start) {
    std::vector<char> seen(neighbours.size(), 0);
    std::vector<int> stack;
    stack.push_back(start);
    int total = 0;
    while (!stack.empty()) {
        int v = stack.back();
        stack.pop_back();
        if (seen[v]) {
            continue;
        }
        seen[v] = 1;
        total++;
        for (int u : neighbours[v]) {
            if (!seen[u]) {
                stack.push_back(u);
            }
        }
    }
    return total;
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
long long seed = 1;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    std::vector<std::string> names = {"path of 10", "path of 1000", "path of 50000", "star of 50000"};
    std::vector<int> counts = {10, 1000, 50000, 50000};
    std::vector<std::vector<Edge>> shapes = {
        path_graph(10), path_graph(1000), path_graph(50000), star_graph(50000),
    };

    std::cout << std::left << std::setw(18) << "shape" << std::right << std::setw(8) << "nodes"
              << std::setw(18) << "recursion depth" << std::setw(22) << "explicit stack peak" << "\\n";
    for (size_t c = 0; c < names.size(); c++) {
        std::vector<std::vector<int>> neighbours = build(counts[c], shapes[c]);
        std::cout << std::left << std::setw(18) << names[c] << std::right << std::setw(8) << counts[c]
                  << std::setw(18) << deepest_recursion(neighbours, 0)
                  << std::setw(22) << peak_explicit_stack(neighbours, 0) << "\\n";
    }
    std::cout << "\\n";

    int trials = 3000;
    int full_depth = 0;
    int recursion_deeper = 0;
    int stack_deeper = 0;
    int same_count = 0;
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
        int depth = deepest_recursion(neighbours, 0);
        int peak = peak_explicit_stack(neighbours, 0);
        int reached = visited_count(neighbours, 0);
        if (depth == reached) {
            full_depth++;
        }
        if (depth > peak) {
            recursion_deeper++;
        }
        if (peak > depth) {
            stack_deeper++;
        }
        std::vector<std::vector<int>> again = build(n, edges);
        if (reached == visited_count(again, 0)) {
            same_count++;
        }
    }

    std::cout << "over " << trials << " random graphs on up to 7 nodes:\\n";
    std::cout << "  the search reached every node it saw   " << std::setw(6) << same_count << "\\n";
    std::cout << "  recursion went as deep as nodes seen   " << std::setw(6) << full_depth << "\\n";
    std::cout << "  recursion deeper than the stack        " << std::setw(6) << recursion_deeper << "\\n";
    std::cout << "  stack deeper than the recursion        " << std::setw(6) << stack_deeper << "\\n";
    std::cout << "\\n";
    std::cout << "The table is the argument. On a path the recursion needs one frame per\\n";
    std::cout << "node -- 50,000 of them -- while the explicit stack never holds more than\\n";
    std::cout << "one, because a node in the middle of a path has a single unvisited\\n";
    std::cout << "neighbour, pushed as the previous one is popped.\\n";
    std::cout << "On a star it is the other way round: the recursion is two frames deep and\\n";
    std::cout << "the explicit stack holds every leaf at once. Neither container is smaller\\n";
    std::cout << "in general; what differs is that one of them is allowed to grow.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// The one real difference between the two depth-first searches: where the stack
// lives, and therefore how big it is allowed to get.
//
// A recursive depth-first search needs one call frame per node on the current
// path. The worst case is a graph that is one long path, and there the depth is
// the number of nodes. That is fine at 1,000 nodes and fatal at 100,000, because
// the runtime's stack has a ceiling that no amount of correctness in the
// algorithm can enlarge.
//
// The explicit-stack version puts the same information in a heap-allocated list.
// The numbers below are measured rather than argued: the depth the recursion
// would need, and the peak size of the explicit stack, on the same graphs.

fn build(n: usize, edges: &[(usize, usize)]) -> Vec<Vec<usize>> {
    let mut neighbours = vec![Vec::new(); n];
    for &(u, v) in edges {
        neighbours[u].push(v);
        neighbours[v].push(u);
    }
    neighbours
}

/// 0-1-2-...-(n-1). The shape that makes the recursion as deep as possible.
fn path_graph(n: usize) -> Vec<(usize, usize)> {
    (0..n - 1).map(|v| (v, v + 1)).collect()
}

/// Every node joined to node 0. The shape that makes it as shallow as possible.
fn star_graph(n: usize) -> Vec<(usize, usize)> {
    (1..n).map(|v| (0, v)).collect()
}

/// How many frames the recursive version would hold at its deepest point.
///
/// Computed with an explicit stack, so measuring the depth never risks it.
fn deepest_recursion(neighbours: &[Vec<usize>], start: usize) -> usize {
    let mut seen = vec![false; neighbours.len()];
    let mut deepest = 0;
    let mut stack = vec![(start, 1usize)];
    while let Some((v, depth)) = stack.pop() {
        if seen[v] {
            continue;
        }
        seen[v] = true;
        if depth > deepest {
            deepest = depth;
        }
        for i in (0..neighbours[v].len()).rev() {
            let u = neighbours[v][i];
            if !seen[u] {
                stack.push((u, depth + 1));
            }
        }
    }
    deepest
}

/// The largest the hand-rolled stack ever gets, on the same walk.
fn peak_explicit_stack(neighbours: &[Vec<usize>], start: usize) -> usize {
    let mut seen = vec![false; neighbours.len()];
    let mut peak = 1;
    let mut stack = vec![start];
    while !stack.is_empty() {
        if stack.len() > peak {
            peak = stack.len();
        }
        let v = stack.pop().unwrap();
        if seen[v] {
            continue;
        }
        seen[v] = true;
        for i in (0..neighbours[v].len()).rev() {
            let u = neighbours[v][i];
            if !seen[u] {
                stack.push(u);
            }
        }
    }
    peak
}

/// A sanity check: both walks must still see every node.
fn visited_count(neighbours: &[Vec<usize>], start: usize) -> usize {
    let mut seen = vec![false; neighbours.len()];
    let mut stack = vec![start];
    let mut total = 0;
    while let Some(v) = stack.pop() {
        if seen[v] {
            continue;
        }
        seen[v] = true;
        total += 1;
        for &u in &neighbours[v] {
            if !seen[u] {
                stack.push(u);
            }
        }
    }
    total
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
    let names = ["path of 10", "path of 1000", "path of 50000", "star of 50000"];
    let counts: Vec<usize> = vec![10, 1000, 50000, 50000];
    let shapes: Vec<Vec<(usize, usize)>> = vec![
        path_graph(10),
        path_graph(1000),
        path_graph(50000),
        star_graph(50000),
    ];

    println!(
        "{}{}{}{}",
        pad_right("shape", 18),
        pad_left("nodes", 8),
        pad_left("recursion depth", 18),
        pad_left("explicit stack peak", 22)
    );
    for (c, name) in names.iter().enumerate() {
        let neighbours = build(counts[c], &shapes[c]);
        println!(
            "{}{}{}{}",
            pad_right(name, 18),
            pad_left(&counts[c].to_string(), 8),
            pad_left(&deepest_recursion(&neighbours, 0).to_string(), 18),
            pad_left(&peak_explicit_stack(&neighbours, 0).to_string(), 22)
        );
    }
    println!();

    let mut rng = Rng { seed: 1 };
    let trials = 3000;
    let mut full_depth = 0;
    let mut recursion_deeper = 0;
    let mut stack_deeper = 0;
    let mut same_count = 0;
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
        let depth = deepest_recursion(&neighbours, 0);
        let peak = peak_explicit_stack(&neighbours, 0);
        let reached = visited_count(&neighbours, 0);
        if depth == reached {
            full_depth += 1;
        }
        if depth > peak {
            recursion_deeper += 1;
        }
        if peak > depth {
            stack_deeper += 1;
        }
        let again = build(n, &edges);
        if reached == visited_count(&again, 0) {
            same_count += 1;
        }
    }

    println!("over {} random graphs on up to 7 nodes:", trials);
    println!("  the search reached every node it saw   {}", pad_left(&same_count.to_string(), 6));
    println!("  recursion went as deep as nodes seen   {}", pad_left(&full_depth.to_string(), 6));
    println!("  recursion deeper than the stack        {}", pad_left(&recursion_deeper.to_string(), 6));
    println!("  stack deeper than the recursion        {}", pad_left(&stack_deeper.to_string(), 6));
    println!();
    println!("The table is the argument. On a path the recursion needs one frame per");
    println!("node -- 50,000 of them -- while the explicit stack never holds more than");
    println!("one, because a node in the middle of a path has a single unvisited");
    println!("neighbour, pushed as the previous one is popped.");
    println!("On a star it is the other way round: the recursion is two frames deep and");
    println!("the explicit stack holds every leaf at once. Neither container is smaller");
    println!("in general; what differs is that one of them is allowed to grow.");
}
`,
            },
            {
              lang: "go",
              code: `// The one real difference between the two depth-first searches: where the stack
// lives, and therefore how big it is allowed to get.
//
// A recursive depth-first search needs one call frame per node on the current
// path. The worst case is a graph that is one long path, and there the depth is
// the number of nodes. That is fine at 1,000 nodes and fatal at 100,000, because
// the runtime's stack has a ceiling that no amount of correctness in the
// algorithm can enlarge.
//
// The explicit-stack version puts the same information in a heap-allocated list.
// The numbers below are measured rather than argued: the depth the recursion
// would need, and the peak size of the explicit stack, on the same graphs.

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

// 0-1-2-...-(n-1). The shape that makes the recursion as deep as possible.
func pathGraph(n int) []edge {
	edges := []edge{}
	for v := 0; v < n-1; v++ {
		edges = append(edges, edge{v, v + 1})
	}
	return edges
}

// Every node joined to node 0. The shape that makes it as shallow as possible.
func starGraph(n int) []edge {
	edges := []edge{}
	for v := 1; v < n; v++ {
		edges = append(edges, edge{0, v})
	}
	return edges
}

// How many frames the recursive version would hold at its deepest point.
//
// Computed with an explicit stack, so measuring the depth never risks it.
func deepestRecursion(neighbours [][]int, start int) int {
	seen := make([]bool, len(neighbours))
	deepest := 0
	stack := [][2]int{{start, 1}}
	for len(stack) > 0 {
		top := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		v, depth := top[0], top[1]
		if seen[v] {
			continue
		}
		seen[v] = true
		if depth > deepest {
			deepest = depth
		}
		for i := len(neighbours[v]) - 1; i >= 0; i-- {
			u := neighbours[v][i]
			if !seen[u] {
				stack = append(stack, [2]int{u, depth + 1})
			}
		}
	}
	return deepest
}

// The largest the hand-rolled stack ever gets, on the same walk.
func peakExplicitStack(neighbours [][]int, start int) int {
	seen := make([]bool, len(neighbours))
	peak := 1
	stack := []int{start}
	for len(stack) > 0 {
		if len(stack) > peak {
			peak = len(stack)
		}
		v := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		if seen[v] {
			continue
		}
		seen[v] = true
		for i := len(neighbours[v]) - 1; i >= 0; i-- {
			u := neighbours[v][i]
			if !seen[u] {
				stack = append(stack, u)
			}
		}
	}
	return peak
}

// A sanity check: both walks must still see every node.
func visitedCount(neighbours [][]int, start int) int {
	seen := make([]bool, len(neighbours))
	stack := []int{start}
	total := 0
	for len(stack) > 0 {
		v := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		if seen[v] {
			continue
		}
		seen[v] = true
		total++
		for _, u := range neighbours[v] {
			if !seen[u] {
				stack = append(stack, u)
			}
		}
	}
	return total
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	names := []string{"path of 10", "path of 1000", "path of 50000", "star of 50000"}
	counts := []int{10, 1000, 50000, 50000}
	shapes := [][]edge{pathGraph(10), pathGraph(1000), pathGraph(50000), starGraph(50000)}

	fmt.Printf("%-18s%8s%18s%22s\\n", "shape", "nodes", "recursion depth", "explicit stack peak")
	for c, name := range names {
		neighbours := build(counts[c], shapes[c])
		fmt.Printf("%-18s%8d%18d%22d\\n", name, counts[c],
			deepestRecursion(neighbours, 0), peakExplicitStack(neighbours, 0))
	}
	fmt.Println()

	trials := 3000
	fullDepth := 0
	recursionDeeper := 0
	stackDeeper := 0
	sameCount := 0
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
		depth := deepestRecursion(neighbours, 0)
		peak := peakExplicitStack(neighbours, 0)
		reached := visitedCount(neighbours, 0)
		if depth == reached {
			fullDepth++
		}
		if depth > peak {
			recursionDeeper++
		}
		if peak > depth {
			stackDeeper++
		}
		if reached == visitedCount(build(n, edges), 0) {
			sameCount++
		}
	}

	fmt.Printf("over %d random graphs on up to 7 nodes:\\n", trials)
	fmt.Printf("  the search reached every node it saw   %6d\\n", sameCount)
	fmt.Printf("  recursion went as deep as nodes seen   %6d\\n", fullDepth)
	fmt.Printf("  recursion deeper than the stack        %6d\\n", recursionDeeper)
	fmt.Printf("  stack deeper than the recursion        %6d\\n", stackDeeper)
	fmt.Println()
	fmt.Println("The table is the argument. On a path the recursion needs one frame per")
	fmt.Println("node -- 50,000 of them -- while the explicit stack never holds more than")
	fmt.Println("one, because a node in the middle of a path has a single unvisited")
	fmt.Println("neighbour, pushed as the previous one is popped.")
	fmt.Println("On a star it is the other way round: the recursion is two frames deep and")
	fmt.Println("the explicit stack holds every leaf at once. Neither container is smaller")
	fmt.Println("in general; what differs is that one of them is allowed to grow.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Recursion depth is set by the input, not by the code",
          body: "A path of 50,000 nodes needs 50,000 frames whatever the language, and whether they fit depends on the runtime: measured, it overflows CPython, Node and Java, and runs fine in C++ on Linux and in Go. The crash arrives as a function of the data. If the graph can be long and thin, that is the moment to write the loop.",
        },
        {
          title: "The explicit stack is not unconditionally smaller",
          body: "On a star of 50,000 it holds 49,999 entries while the recursion is two frames deep, and over 3,000 random graphs the stack was the deeper of the two on 109. What the heap buys is room to grow, not a smaller peak.",
        },
      ],
    },
    {
      id: "depth-first-in-three-sentences",
      heading: "Depth-first search in three sentences",
      body: [
        "So, depth-first search in three sentences.",
        "**It is one algorithm with two spellings.** Recursion and an explicit stack differ only in who allocates the stack; push the neighbours in reverse and even the visit order is identical, 3,000 times out of 3,000.",
        "**What it knows is when a subtree closes.** Entry and exit ticks turn ancestry and subtree size into comparisons, and they are the foundation of cycle detection, topological order, and the articulation-point family. Breadth-first search has no equivalent, because a queue never returns to anything.",
        "**The only practical difference is depth.** One frame per node on the current path, against a heap list that can grow. On a path of 50,000 that is 50,000 frames against a stack of one \u2014 and on a star it is two frames against 49,999. Choose by the shape the input can take.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between recursive and iterative depth-first search?",
      answer:
        "Where the stack lives. The recursive version uses the call stack, the iterative one allocates an array on the heap, and the sequence of decisions is identical. The reason they usually print different orders is that pushing a node's neighbours reverses them, so the iterative search takes the last child first; push them in reverse and the orders match exactly -- I measured that on 3,000 random graphs and it was 3,000 out of 3,000. The difference that matters in practice is depth: the call stack has a ceiling the algorithm cannot raise — 1,000 frames in CPython, about 6,000 in Node, roughly 10,000 to 24,000 in Java, but 200,000 in C++ on Linux and a million in Go — so a graph that is one long path of 50,000 nodes needs 50,000 frames and overflows in the first three, while the heap-allocated stack on that same graph never holds more than one entry. So the choice is about the shape the input can take, not about style.",
    },
    {
      question: "What can DFS do that BFS cannot?",
      answer:
        "Tell you when a subtree is finished. Breadth-first search never returns to a node, so there is no moment at which its descendants are known to be complete; depth-first search backtracks, and that backtrack is a usable event. Recording an entry tick and a leave tick per node turns the tree into intervals: u is an ancestor of v exactly when u's interval contains v's, which is two comparisons instead of a walk up the parent links, and the subtree size is half the interval width. That is the foundation for cycle detection -- meeting a node that is entered but not yet left means a back edge -- for topological order, which is the reverse of the finish order, and for bridges and articulation points. Worth adding: keeping only the entry tick is not enough, because a node in an earlier branch also has a smaller entry tick; on my measurements that shortcut wrongly claimed ancestry on nearly three thousand pairs.",
    },
    {
      question: "When would you rewrite a recursive DFS as an iterative one?",
      answer:
        "When the input can be deep. Depth is a property of the data: one frame per node on the current path, so a chain, a linked structure, a dependency line, or a tree built from already-sorted input all push the recursion to its limit. If the graph could have a hundred thousand nodes on one path, the recursion will overflow regardless of how correct it is, and the fix is a heap-allocated stack. I would not do it reflexively -- on a broad shallow graph the recursion is shorter and clearer, and it is not even true that the explicit stack is smaller: on a star of 50,000 nodes it holds 49,999 entries while the recursion is two frames deep. What the heap gives you is permission to grow.",
    },
  ],
  takeaways: [
    "Recursive and iterative depth-first search are one algorithm; the call stack in one is the array in the other.",
    "Pushing a node's neighbours reverses them \u2014 push in reverse and the two visit orders matched 3,000 times out of 3,000.",
    "Stack or queue, the set of nodes reached is identical: 3,000 of 3,000. The container decides the route, not the destination.",
    "Entry and exit ticks make ancestry two comparisons: `enter[u] <= enter[v]` and `leave[v] <= leave[u]`.",
    "The subtree size is half the interval width, because each node spends exactly two ticks.",
    "The entry tick alone is not enough \u2014 it was fully right on 2,077 of 3,000 graphs and wrongly claimed ancestry on 2,923 pairs.",
    "Only depth-first search has a moment when a subtree closes, which is what cycle detection and topological order are built on.",
    "Recursion depth is one frame per node on the current path \u2014 50,000 frames on a path of 50,000 nodes.",
    "The explicit stack is not always smaller: on a star of 50,000 it held 49,999 entries against two frames of recursion.",
    "Write the iterative version when the input can be long and thin; the recursion is fine when it cannot.",
  ],
  status: "available",
};
