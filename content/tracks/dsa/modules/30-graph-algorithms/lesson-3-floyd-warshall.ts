import type { Lesson } from "@/content/types";

export const floydWarshallLesson: Lesson = {
  id: "dsa-graph-algorithms-floyd-warshall",
  slug: "floyd-warshall",
  moduleSlug: "graph-algorithms",
  title: "Floyd-Warshall and the Loop Order",
  summary:
    "Three nested loops whose order is the entire algorithm: why k has to be outermost and what the other two orders silently compute instead, what the grid buys that n runs of Dijkstra do not, why the negative diagonal answers one question exactly and another one only roughly, and the two other algorithms hiding in the same loop nest.",
  estimatedMinutes: 45,
  objectives: [
    "State the invariant that forces `k` to be the outer loop",
    "Say what the wrong loop orders compute, and why nothing catches it",
    "Choose between the grid and `n` single-source runs on evidence",
    "Read `d[i][i] < 0` for exactly as much as it says",
    "Recognise reachability and widest path as the same loop nest",
  ],
  sections: [
    {
      id: "three-loops-one-order",
      heading: "Three loops, one order",
      body: [
        "Floyd-Warshall is the shortest algorithm in this module and the easiest one to get wrong. Three nested loops over the same `n` values, one line inside. Swap two of the loops and it still compiles, still runs, still fills the grid with plausible numbers \u2014 and is no longer computing shortest paths.",
        "The order matters because of what each pass means. After the `k`-th outer pass, `d[i][j]` holds the cheapest route from `i` to `j` whose *intermediate* nodes all come from the set `{0..k}`. Every pass widens that set by exactly one node, and \u2014 this is the part the loop order enforces \u2014 every pair is brought up to date against the same set before the set grows again.",
        "Move `k` inwards and that stops being true. Pair `(i, j)` finishes with all `n` intermediates while pair `(i, j + 1)` has not started, so a route needing two intermediates can be asked about before either of them is ready. The measurement: over 3,000 random weighted graphs, `k` outermost matched an exhaustive search over every simple path on all 3,000. `k` innermost matched on 2,513. `k` in the middle on 2,396.",
        "The failures are one-sided, and that is the dangerous part. 896 entries came back too high with `k` innermost and 1,174 with `k` in the middle; **zero** came back too low, in either order. Every number a wrong order reports is the genuine cost of some real route \u2014 it just is not the cheapest one. There is no impossible value to notice, no assertion that fires. It looks like a working shortest-path table.",
        "Two of the three demo rows show the failure and one does not, which is the whole problem in miniature. A path listed 0\u21921\u21922\u21923 comes out right in all three orders. The same path with its nodes numbered backwards \u2014 0\u21923\u21922\u21921 \u2014 has both wrong orders calling the far end unreachable. And the third row is the quiet one: a direct edge of 9 kept where the route through two intermediates costs 3.",
      ],
      examples: [
        {
          id: "loop-order",
          title: "Three loop orders scored against every simple path",
          lang: "python",
          code: `# Floyd-Warshall, and why the k loop has to be the outer one.
#
# The algorithm is three nested loops over the same n values, and the order of
# those loops is the whole algorithm. Written with k outermost it computes
# every shortest path; written with k anywhere else it computes something that
# often looks right and is not.
#
# The reason is the invariant. After the k-th outer pass, d[i][j] is the
# shortest route from i to j whose intermediate nodes all come from
# {0..k}. Each pass widens the permitted set by exactly one node, and every
# pair is updated against that same set before the set grows. Move k inwards
# and different pairs are working against different sets, so a route that
# needs two intermediates can be asked about before either is available.
INF = 10 ** 9


def matrix(n, edges):
    """The starting grid: 0 down the diagonal, the cheapest direct edge elsewhere."""
    d = [[INF] * n for _ in range(n)]
    for i in range(n):
        d[i][i] = 0
    for u, v, w in edges:
        if w < d[u][v]:
            d[u][v] = w
    return d


def floyd(n, edges):
    """k outermost. Every pair is widened by node k before k+1 is allowed."""
    d = matrix(n, edges)
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if d[i][k] + d[k][j] < d[i][j]:
                    d[i][j] = d[i][k] + d[k][j]
    return d


def floyd_k_inner(n, edges):
    """k innermost: pair (i, j) is finished before pair (i, j + 1) has started."""
    d = matrix(n, edges)
    for i in range(n):
        for j in range(n):
            for k in range(n):
                if d[i][k] + d[k][j] < d[i][j]:
                    d[i][j] = d[i][k] + d[k][j]
    return d


def floyd_k_middle(n, edges):
    """k in the middle: still one row at a time, still not a shared set."""
    d = matrix(n, edges)
    for i in range(n):
        for k in range(n):
            for j in range(n):
                if d[i][k] + d[k][j] < d[i][j]:
                    d[i][j] = d[i][k] + d[k][j]
    return d


def by_walking(n, edges):
    """The oracle: the cheapest simple path between every pair, found by walking.

    Exponential and correct. Nothing here is allowed to be a claim about what
    Floyd-Warshall computes -- it has to be scored against a definition, and
    the definition of a shortest path is the cheapest walk that repeats no node.
    """
    out = [[INF] * n for _ in range(n)]
    for i in range(n):
        out[i][i] = 0
    adj = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((v, w))

    for start in range(n):
        seen = [False] * n

        def walk(at, cost):
            seen[at] = True
            for nxt, w in adj[at]:
                if not seen[nxt]:
                    if cost + w < out[start][nxt]:
                        out[start][nxt] = cost + w
                    walk(nxt, cost + w)
            seen[at] = False

        walk(start, 0)
    return out


def show(row):
    return "[" + ", ".join("-" if x >= INF else str(x) for x in row) + "]"


def label(edges):
    return "[" + ", ".join("%d->%d:%d" % e for e in edges) + "]"


CASES = [
    (4, [(0, 1, 1), (1, 2, 1), (2, 3, 1)]),
    (4, [(0, 3, 1), (3, 2, 1), (2, 1, 1)]),
    (4, [(0, 1, 1), (0, 2, 9), (1, 3, 1), (3, 2, 1)]),
]

print("%-44s %-20s %-22s %s" % ("edges", "row 0, correct", "row 0, k innermost", "row 0, k middle"))
for n, edges in CASES:
    print("%-44s %-20s %-22s %s" % (
        label(edges),
        show(floyd(n, edges)[0]),
        show(floyd_k_inner(n, edges)[0]),
        show(floyd_k_middle(n, edges)[0]),
    ))

# The same linear congruential generator in every language, so the random
# graphs below are the same graphs whichever translation is run.
seed = 12345


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


trials = 3000
ok_outer = ok_inner = ok_middle = 0
high_inner = high_middle = 0
low_inner = low_middle = 0
for _ in range(trials):
    n = 2 + rand(5)
    edges = []
    for u in range(n):
        for v in range(n):
            if u != v and rand(3) == 0:
                edges.append((u, v, 1 + rand(9)))
    truth = by_walking(n, edges)
    a, b, c = floyd(n, edges), floyd_k_inner(n, edges), floyd_k_middle(n, edges)
    ok_outer += a == truth
    ok_inner += b == truth
    ok_middle += c == truth
    for i in range(n):
        for j in range(n):
            if b[i][j] > truth[i][j]:
                high_inner += 1
            if b[i][j] < truth[i][j]:
                low_inner += 1
            if c[i][j] > truth[i][j]:
                high_middle += 1
            if c[i][j] < truth[i][j]:
                low_middle += 1

print()
print("over %d random weighted graphs on up to 6 nodes:" % trials)
print("  k outermost matched every simple path  %6d" % ok_outer)
print("  k innermost matched it                 %6d" % ok_inner)
print("  k in the middle matched it             %6d" % ok_middle)
print("  entries too high, innermost / middle   %6d %6d" % (high_inner, high_middle))
print("  entries too low,  innermost / middle   %6d %6d" % (low_inner, low_middle))
print()
print("The failures are one-sided: too high, never too low. Every number the")
print("wrong orders report is the cost of some real route -- they just miss the")
print("cheaper ones. Row two of the table is a path whose nodes are numbered")
print("backwards, and both wrong orders call the far end unreachable. Row three")
print("is the softer failure, and only k innermost falls into it: a direct edge")
print("of 9 kept, when the route through two intermediates costs 3.")
`,
          output: `edges                                        row 0, correct       row 0, k innermost     row 0, k middle
[0->1:1, 1->2:1, 2->3:1]                     [0, 1, 2, 3]         [0, 1, 2, 3]           [0, 1, 2, 3]
[0->3:1, 3->2:1, 2->1:1]                     [0, 3, 2, 1]         [0, -, 2, 1]           [0, -, 2, 1]
[0->1:1, 0->2:9, 1->3:1, 3->2:1]             [0, 1, 3, 2]         [0, 1, 9, 2]           [0, 1, 3, 2]

over 3000 random weighted graphs on up to 6 nodes:
  k outermost matched every simple path    3000
  k innermost matched it                   2513
  k in the middle matched it               2396
  entries too high, innermost / middle      896   1174
  entries too low,  innermost / middle        0      0

The failures are one-sided: too high, never too low. Every number the
wrong orders report is the cost of some real route -- they just miss the
cheaper ones. Row two of the table is a path whose nodes are numbered
backwards, and both wrong orders call the far end unreachable. Row three
is the softer failure, and only k innermost falls into it: a direct edge
of 9 kept, when the route through two intermediates costs 3.`,
          explanation:
            "The k loop moved to three positions and each result scored against an exhaustive walk. Note the last two rows of counters: the wrong orders are wrong only upwards, which is why nothing catches them.",
          alternates: [
            {
              lang: "javascript",
              code: `// Floyd-Warshall, and why the k loop has to be the outer one.
//
// The algorithm is three nested loops over the same n values, and the order of
// those loops is the whole algorithm. Written with k outermost it computes
// every shortest path; written with k anywhere else it computes something that
// often looks right and is not.
//
// The reason is the invariant. After the k-th outer pass, d[i][j] is the
// shortest route from i to j whose intermediate nodes all come from
// {0..k}. Each pass widens the permitted set by exactly one node, and every
// pair is updated against that same set before the set grows. Move k inwards
// and different pairs are working against different sets, so a route that
// needs two intermediates can be asked about before either is available.
const INF = 10 ** 9;

// The starting grid: 0 down the diagonal, the cheapest direct edge elsewhere.
function matrix(n, edges) {
  const d = Array.from({ length: n }, () => new Array(n).fill(INF));
  for (let i = 0; i < n; i += 1) d[i][i] = 0;
  for (const [u, v, w] of edges) if (w < d[u][v]) d[u][v] = w;
  return d;
}

// k outermost. Every pair is widened by node k before k+1 is allowed.
function floyd(n, edges) {
  const d = matrix(n, edges);
  for (let k = 0; k < n; k += 1)
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1)
        if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
  return d;
}

// k innermost: pair (i, j) is finished before pair (i, j + 1) has started.
function floydKInner(n, edges) {
  const d = matrix(n, edges);
  for (let i = 0; i < n; i += 1)
    for (let j = 0; j < n; j += 1)
      for (let k = 0; k < n; k += 1)
        if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
  return d;
}

// k in the middle: still one row at a time, still not a shared set.
function floydKMiddle(n, edges) {
  const d = matrix(n, edges);
  for (let i = 0; i < n; i += 1)
    for (let k = 0; k < n; k += 1)
      for (let j = 0; j < n; j += 1)
        if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
  return d;
}

// The oracle: the cheapest simple path between every pair, found by walking.
//
// Exponential and correct. Nothing here is allowed to be a claim about what
// Floyd-Warshall computes -- it has to be scored against a definition, and
// the definition of a shortest path is the cheapest walk that repeats no node.
function byWalking(n, edges) {
  const out = Array.from({ length: n }, () => new Array(n).fill(INF));
  for (let i = 0; i < n; i += 1) out[i][i] = 0;
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);

  for (let start = 0; start < n; start += 1) {
    const seen = new Array(n).fill(false);
    const walk = (at, cost) => {
      seen[at] = true;
      for (const [nxt, w] of adj[at]) {
        if (!seen[nxt]) {
          if (cost + w < out[start][nxt]) out[start][nxt] = cost + w;
          walk(nxt, cost + w);
        }
      }
      seen[at] = false;
    };
    walk(start, 0);
  }
  return out;
}

function show(row) {
  return "[" + row.map((x) => (x >= INF ? "-" : String(x))).join(", ") + "]";
}

function label(edges) {
  return "[" + edges.map(([u, v, w]) => \`\${u}->\${v}:\${w}\`).join(", ") + "]";
}

const CASES = [
  [4, [[0, 1, 1], [1, 2, 1], [2, 3, 1]]],
  [4, [[0, 3, 1], [3, 2, 1], [2, 1, 1]]],
  [4, [[0, 1, 1], [0, 2, 9], [1, 3, 1], [3, 2, 1]]],
];

console.log(
  "edges".padEnd(44) + " " + "row 0, correct".padEnd(20) + " " +
  "row 0, k innermost".padEnd(22) + " " + "row 0, k middle",
);
for (const [n, edges] of CASES) {
  console.log(
    label(edges).padEnd(44) + " " + show(floyd(n, edges)[0]).padEnd(20) + " " +
    show(floydKInner(n, edges)[0]).padEnd(22) + " " + show(floydKMiddle(n, edges)[0]),
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 12345n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let okOuter = 0;
let okInner = 0;
let okMiddle = 0;
let highInner = 0;
let highMiddle = 0;
let lowInner = 0;
let lowMiddle = 0;
const same = (a, b) => a.every((row, i) => row.every((x, j) => x === b[i][j]));
for (let t = 0; t < trials; t += 1) {
  const n = 2 + rand(5);
  const edges = [];
  for (let u = 0; u < n; u += 1)
    for (let v = 0; v < n; v += 1)
      if (u !== v && rand(3) === 0) edges.push([u, v, 1 + rand(9)]);
  const truth = byWalking(n, edges);
  const a = floyd(n, edges);
  const b = floydKInner(n, edges);
  const c = floydKMiddle(n, edges);
  if (same(a, truth)) okOuter += 1;
  if (same(b, truth)) okInner += 1;
  if (same(c, truth)) okMiddle += 1;
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      if (b[i][j] > truth[i][j]) highInner += 1;
      if (b[i][j] < truth[i][j]) lowInner += 1;
      if (c[i][j] > truth[i][j]) highMiddle += 1;
      if (c[i][j] < truth[i][j]) lowMiddle += 1;
    }
  }
}

console.log();
console.log(\`over \${trials} random weighted graphs on up to 6 nodes:\`);
console.log("  k outermost matched every simple path  " + String(okOuter).padStart(6));
console.log("  k innermost matched it                 " + String(okInner).padStart(6));
console.log("  k in the middle matched it             " + String(okMiddle).padStart(6));
console.log("  entries too high, innermost / middle   " + String(highInner).padStart(6) + " " + String(highMiddle).padStart(6));
console.log("  entries too low,  innermost / middle   " + String(lowInner).padStart(6) + " " + String(lowMiddle).padStart(6));
console.log();
console.log("The failures are one-sided: too high, never too low. Every number the");
console.log("wrong orders report is the cost of some real route -- they just miss the");
console.log("cheaper ones. Row two of the table is a path whose nodes are numbered");
console.log("backwards, and both wrong orders call the far end unreachable. Row three");
console.log("is the softer failure, and only k innermost falls into it: a direct edge");
console.log("of 9 kept, when the route through two intermediates costs 3.");
`,
            },
            {
              lang: "typescript",
              code: `// Floyd-Warshall, and why the k loop has to be the outer one.
//
// The algorithm is three nested loops over the same n values, and the order of
// those loops is the whole algorithm. Written with k outermost it computes
// every shortest path; written with k anywhere else it computes something that
// often looks right and is not.
//
// The reason is the invariant. After the k-th outer pass, d[i][j] is the
// shortest route from i to j whose intermediate nodes all come from
// {0..k}. Each pass widens the permitted set by exactly one node, and every
// pair is updated against that same set before the set grows. Move k inwards
// and different pairs are working against different sets, so a route that
// needs two intermediates can be asked about before either is available.
const INF = 10 ** 9;

// The starting grid: 0 down the diagonal, the cheapest direct edge elsewhere.
function matrix(n: number, edges: number[][]): number[][] {
  const d = Array.from({ length: n }, () => new Array(n).fill(INF));
  for (let i = 0; i < n; i += 1) d[i][i] = 0;
  for (const [u, v, w] of edges) if (w < d[u][v]) d[u][v] = w;
  return d;
}

// k outermost. Every pair is widened by node k before k+1 is allowed.
function floyd(n: number, edges: number[][]): number[][] {
  const d = matrix(n, edges);
  for (let k = 0; k < n; k += 1)
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1)
        if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
  return d;
}

// k innermost: pair (i, j) is finished before pair (i, j + 1) has started.
function floydKInner(n: number, edges: number[][]): number[][] {
  const d = matrix(n, edges);
  for (let i = 0; i < n; i += 1)
    for (let j = 0; j < n; j += 1)
      for (let k = 0; k < n; k += 1)
        if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
  return d;
}

// k in the middle: still one row at a time, still not a shared set.
function floydKMiddle(n: number, edges: number[][]): number[][] {
  const d = matrix(n, edges);
  for (let i = 0; i < n; i += 1)
    for (let k = 0; k < n; k += 1)
      for (let j = 0; j < n; j += 1)
        if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
  return d;
}

// The oracle: the cheapest simple path between every pair, found by walking.
//
// Exponential and correct. Nothing here is allowed to be a claim about what
// Floyd-Warshall computes -- it has to be scored against a definition, and
// the definition of a shortest path is the cheapest walk that repeats no node.
function byWalking(n: number, edges: number[][]): number[][] {
  const out = Array.from({ length: n }, () => new Array(n).fill(INF));
  for (let i = 0; i < n; i += 1) out[i][i] = 0;
  const adj = Array.from({ length: n }, () => [] as number[][]);
  for (const [u, v, w] of edges) adj[u].push([v, w]);

  for (let start = 0; start < n; start += 1) {
    const seen = new Array(n).fill(false);
    const walk = (at: number, cost: number): void => {
      seen[at] = true;
      for (const [nxt, w] of adj[at]) {
        if (!seen[nxt]) {
          if (cost + w < out[start][nxt]) out[start][nxt] = cost + w;
          walk(nxt, cost + w);
        }
      }
      seen[at] = false;
    };
    walk(start, 0);
  }
  return out;
}

function show(row: number[]): string {
  return "[" + row.map((x) => (x >= INF ? "-" : String(x))).join(", ") + "]";
}

function label(edges: number[][]): string {
  return "[" + edges.map(([u, v, w]) => \`\${u}->\${v}:\${w}\`).join(", ") + "]";
}

const CASES: [number, number[][]][] = [
  [4, [[0, 1, 1], [1, 2, 1], [2, 3, 1]]],
  [4, [[0, 3, 1], [3, 2, 1], [2, 1, 1]]],
  [4, [[0, 1, 1], [0, 2, 9], [1, 3, 1], [3, 2, 1]]],
];

console.log(
  "edges".padEnd(44) + " " + "row 0, correct".padEnd(20) + " " +
  "row 0, k innermost".padEnd(22) + " " + "row 0, k middle",
);
for (const [n, edges] of CASES) {
  console.log(
    label(edges).padEnd(44) + " " + show(floyd(n, edges)[0]).padEnd(20) + " " +
    show(floydKInner(n, edges)[0]).padEnd(22) + " " + show(floydKMiddle(n, edges)[0]),
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 12345n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let okOuter = 0;
let okInner = 0;
let okMiddle = 0;
let highInner = 0;
let highMiddle = 0;
let lowInner = 0;
let lowMiddle = 0;
const same = (a: number[][], b: number[][]): boolean => a.every((row, i) => row.every((x, j) => x === b[i][j]));
for (let t = 0; t < trials; t += 1) {
  const n = 2 + rand(5);
  const edges: number[][] = [];
  for (let u = 0; u < n; u += 1)
    for (let v = 0; v < n; v += 1)
      if (u !== v && rand(3) === 0) edges.push([u, v, 1 + rand(9)]);
  const truth = byWalking(n, edges);
  const a = floyd(n, edges);
  const b = floydKInner(n, edges);
  const c = floydKMiddle(n, edges);
  if (same(a, truth)) okOuter += 1;
  if (same(b, truth)) okInner += 1;
  if (same(c, truth)) okMiddle += 1;
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      if (b[i][j] > truth[i][j]) highInner += 1;
      if (b[i][j] < truth[i][j]) lowInner += 1;
      if (c[i][j] > truth[i][j]) highMiddle += 1;
      if (c[i][j] < truth[i][j]) lowMiddle += 1;
    }
  }
}

console.log();
console.log(\`over \${trials} random weighted graphs on up to 6 nodes:\`);
console.log("  k outermost matched every simple path  " + String(okOuter).padStart(6));
console.log("  k innermost matched it                 " + String(okInner).padStart(6));
console.log("  k in the middle matched it             " + String(okMiddle).padStart(6));
console.log("  entries too high, innermost / middle   " + String(highInner).padStart(6) + " " + String(highMiddle).padStart(6));
console.log("  entries too low,  innermost / middle   " + String(lowInner).padStart(6) + " " + String(lowMiddle).padStart(6));
console.log();
console.log("The failures are one-sided: too high, never too low. Every number the");
console.log("wrong orders report is the cost of some real route -- they just miss the");
console.log("cheaper ones. Row two of the table is a path whose nodes are numbered");
console.log("backwards, and both wrong orders call the far end unreachable. Row three");
console.log("is the softer failure, and only k innermost falls into it: a direct edge");
console.log("of 9 kept, when the route through two intermediates costs 3.");
`,
            },
            {
              lang: "java",
              code: `// Floyd-Warshall, and why the k loop has to be the outer one.
//
// The algorithm is three nested loops over the same n values, and the order of
// those loops is the whole algorithm. Written with k outermost it computes
// every shortest path; written with k anywhere else it computes something that
// often looks right and is not.
//
// The reason is the invariant. After the k-th outer pass, d[i][j] is the
// shortest route from i to j whose intermediate nodes all come from
// {0..k}. Each pass widens the permitted set by exactly one node, and every
// pair is updated against that same set before the set grows. Move k inwards
// and different pairs are working against different sets, so a route that
// needs two intermediates can be asked about before either is available.
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
    static final int INF = 1000000000;

    /** The starting grid: 0 down the diagonal, the cheapest direct edge elsewhere. */
    static int[][] matrix(int n, int[][] edges) {
        int[][] d = new int[n][n];
        for (int[] row : d) Arrays.fill(row, INF);
        for (int i = 0; i < n; i++) d[i][i] = 0;
        for (int[] e : edges) if (e[2] < d[e[0]][e[1]]) d[e[0]][e[1]] = e[2];
        return d;
    }

    /** k outermost. Every pair is widened by node k before k+1 is allowed. */
    static int[][] floyd(int n, int[][] edges) {
        int[][] d = matrix(n, edges);
        for (int k = 0; k < n; k++)
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++)
                    if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
        return d;
    }

    /** k innermost: pair (i, j) is finished before pair (i, j + 1) has started. */
    static int[][] floydKInner(int n, int[][] edges) {
        int[][] d = matrix(n, edges);
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                for (int k = 0; k < n; k++)
                    if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
        return d;
    }

    /** k in the middle: still one row at a time, still not a shared set. */
    static int[][] floydKMiddle(int n, int[][] edges) {
        int[][] d = matrix(n, edges);
        for (int i = 0; i < n; i++)
            for (int k = 0; k < n; k++)
                for (int j = 0; j < n; j++)
                    if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
        return d;
    }

    static List<int[]>[] adjacency(int n, int[][] edges) {
        @SuppressWarnings("unchecked")
        List<int[]>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : edges) adj[e[0]].add(new int[] {e[1], e[2]});
        return adj;
    }

    static void walk(List<int[]>[] adj, boolean[] seen, int[][] out, int start, int at, int cost) {
        seen[at] = true;
        for (int[] step : adj[at]) {
            if (!seen[step[0]]) {
                if (cost + step[1] < out[start][step[0]]) out[start][step[0]] = cost + step[1];
                walk(adj, seen, out, start, step[0], cost + step[1]);
            }
        }
        seen[at] = false;
    }

    /**
     * The oracle: the cheapest simple path between every pair, found by walking.
     *
     * <p>Exponential and correct. Nothing here is allowed to be a claim about what
     * Floyd-Warshall computes -- it has to be scored against a definition, and
     * the definition of a shortest path is the cheapest walk that repeats no node.
     */
    static int[][] byWalking(int n, int[][] edges) {
        int[][] out = new int[n][n];
        for (int[] row : out) Arrays.fill(row, INF);
        for (int i = 0; i < n; i++) out[i][i] = 0;
        List<int[]>[] adj = adjacency(n, edges);
        for (int start = 0; start < n; start++) walk(adj, new boolean[n], out, start, start, 0);
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
            sb.append(edges[i][0]).append("->").append(edges[i][1]).append(":").append(edges[i][2]);
        }
        return sb.append("]").toString();
    }

    static long seed = 12345L;

    // The same linear congruential generator in every language, so the random
    // graphs below are the same graphs whichever translation is run.
    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    public static void main(String[] args) {
        int[][][] caseEdges = {
            {{0, 1, 1}, {1, 2, 1}, {2, 3, 1}},
            {{0, 3, 1}, {3, 2, 1}, {2, 1, 1}},
            {{0, 1, 1}, {0, 2, 9}, {1, 3, 1}, {3, 2, 1}},
        };

        System.out.printf("%-44s %-20s %-22s %s%n",
            "edges", "row 0, correct", "row 0, k innermost", "row 0, k middle");
        for (int[][] edges : caseEdges) {
            System.out.printf("%-44s %-20s %-22s %s%n", label(edges),
                show(floyd(4, edges)[0]), show(floydKInner(4, edges)[0]),
                show(floydKMiddle(4, edges)[0]));
        }

        int trials = 3000;
        int okOuter = 0, okInner = 0, okMiddle = 0;
        int highInner = 0, highMiddle = 0, lowInner = 0, lowMiddle = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(5);
            List<int[]> built = new ArrayList<>();
            for (int u = 0; u < n; u++)
                for (int v = 0; v < n; v++)
                    if (u != v && rand(3) == 0) built.add(new int[] {u, v, 1 + rand(9)});
            int[][] edges = built.toArray(new int[0][]);
            int[][] truth = byWalking(n, edges);
            int[][] a = floyd(n, edges);
            int[][] b = floydKInner(n, edges);
            int[][] c = floydKMiddle(n, edges);
            if (Arrays.deepEquals(a, truth)) okOuter++;
            if (Arrays.deepEquals(b, truth)) okInner++;
            if (Arrays.deepEquals(c, truth)) okMiddle++;
            for (int i = 0; i < n; i++) {
                for (int j = 0; j < n; j++) {
                    if (b[i][j] > truth[i][j]) highInner++;
                    if (b[i][j] < truth[i][j]) lowInner++;
                    if (c[i][j] > truth[i][j]) highMiddle++;
                    if (c[i][j] < truth[i][j]) lowMiddle++;
                }
            }
        }

        System.out.println();
        System.out.println("over " + trials + " random weighted graphs on up to 6 nodes:");
        System.out.printf("  k outermost matched every simple path  %6d%n", okOuter);
        System.out.printf("  k innermost matched it                 %6d%n", okInner);
        System.out.printf("  k in the middle matched it             %6d%n", okMiddle);
        System.out.printf("  entries too high, innermost / middle   %6d %6d%n", highInner, highMiddle);
        System.out.printf("  entries too low,  innermost / middle   %6d %6d%n", lowInner, lowMiddle);
        System.out.println();
        System.out.println("The failures are one-sided: too high, never too low. Every number the");
        System.out.println("wrong orders report is the cost of some real route -- they just miss the");
        System.out.println("cheaper ones. Row two of the table is a path whose nodes are numbered");
        System.out.println("backwards, and both wrong orders call the far end unreachable. Row three");
        System.out.println("is the softer failure, and only k innermost falls into it: a direct edge");
        System.out.println("of 9 kept, when the route through two intermediates costs 3.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Floyd-Warshall, and why the k loop has to be the outer one.
//
// The algorithm is three nested loops over the same n values, and the order of
// those loops is the whole algorithm. Written with k outermost it computes
// every shortest path; written with k anywhere else it computes something that
// often looks right and is not.
//
// The reason is the invariant. After the k-th outer pass, d[i][j] is the
// shortest route from i to j whose intermediate nodes all come from
// {0..k}. Each pass widens the permitted set by exactly one node, and every
// pair is updated against that same set before the set grows. Move k inwards
// and different pairs are working against different sets, so a route that
// needs two intermediates can be asked about before either is available.
#include <array>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

const int INF = 1000000000;

using Edge = std::array<int, 3>;
using Grid = std::vector<std::vector<int>>;

// The starting grid: 0 down the diagonal, the cheapest direct edge elsewhere.
Grid matrix(int n, const std::vector<Edge>& edges) {
    Grid d(n, std::vector<int>(n, INF));
    for (int i = 0; i < n; i++) d[i][i] = 0;
    for (const Edge& e : edges)
        if (e[2] < d[e[0]][e[1]]) d[e[0]][e[1]] = e[2];
    return d;
}

// k outermost. Every pair is widened by node k before k+1 is allowed.
Grid floyd(int n, const std::vector<Edge>& edges) {
    Grid d = matrix(n, edges);
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
    return d;
}

// k innermost: pair (i, j) is finished before pair (i, j + 1) has started.
Grid floyd_k_inner(int n, const std::vector<Edge>& edges) {
    Grid d = matrix(n, edges);
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            for (int k = 0; k < n; k++)
                if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
    return d;
}

// k in the middle: still one row at a time, still not a shared set.
Grid floyd_k_middle(int n, const std::vector<Edge>& edges) {
    Grid d = matrix(n, edges);
    for (int i = 0; i < n; i++)
        for (int k = 0; k < n; k++)
            for (int j = 0; j < n; j++)
                if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
    return d;
}

void walk(const std::vector<std::vector<std::pair<int, int>>>& adj,
          std::vector<bool>& seen, Grid& out, int start, int at, int cost) {
    seen[at] = true;
    for (const auto& step : adj[at]) {
        if (!seen[step.first]) {
            if (cost + step.second < out[start][step.first])
                out[start][step.first] = cost + step.second;
            walk(adj, seen, out, start, step.first, cost + step.second);
        }
    }
    seen[at] = false;
}

// The oracle: the cheapest simple path between every pair, found by walking.
//
// Exponential and correct. Nothing here is allowed to be a claim about what
// Floyd-Warshall computes -- it has to be scored against a definition, and
// the definition of a shortest path is the cheapest walk that repeats no node.
Grid by_walking(int n, const std::vector<Edge>& edges) {
    Grid out(n, std::vector<int>(n, INF));
    for (int i = 0; i < n; i++) out[i][i] = 0;
    std::vector<std::vector<std::pair<int, int>>> adj(n);
    for (const Edge& e : edges) adj[e[0]].push_back({e[1], e[2]});
    for (int start = 0; start < n; start++) {
        std::vector<bool> seen(n, false);
        walk(adj, seen, out, start, start, 0);
    }
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
        s += std::to_string(edges[i][0]) + "->" + std::to_string(edges[i][1]) +
             ":" + std::to_string(edges[i][2]);
    }
    return s + "]";
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
long long seed = 12345;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

int main() {
    std::vector<std::vector<Edge>> cases = {
        {{0, 1, 1}, {1, 2, 1}, {2, 3, 1}},
        {{0, 3, 1}, {3, 2, 1}, {2, 1, 1}},
        {{0, 1, 1}, {0, 2, 9}, {1, 3, 1}, {3, 2, 1}},
    };

    std::cout << std::left << std::setw(44) << "edges" << " " << std::setw(20)
              << "row 0, correct" << " " << std::setw(22) << "row 0, k innermost"
              << " " << "row 0, k middle" << "\\n";
    for (const auto& edges : cases) {
        std::cout << std::left << std::setw(44) << label(edges) << " "
                  << std::setw(20) << show(floyd(4, edges)[0]) << " "
                  << std::setw(22) << show(floyd_k_inner(4, edges)[0]) << " "
                  << show(floyd_k_middle(4, edges)[0]) << "\\n";
    }

    int trials = 3000;
    int ok_outer = 0, ok_inner = 0, ok_middle = 0;
    int high_inner = 0, high_middle = 0, low_inner = 0, low_middle = 0;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(5);
        std::vector<Edge> edges;
        for (int u = 0; u < n; u++)
            for (int v = 0; v < n; v++)
                if (u != v && rand_below(3) == 0)
                    edges.push_back({u, v, 1 + rand_below(9)});
        Grid truth = by_walking(n, edges);
        Grid a = floyd(n, edges);
        Grid b = floyd_k_inner(n, edges);
        Grid c = floyd_k_middle(n, edges);
        if (a == truth) ok_outer++;
        if (b == truth) ok_inner++;
        if (c == truth) ok_middle++;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (b[i][j] > truth[i][j]) high_inner++;
                if (b[i][j] < truth[i][j]) low_inner++;
                if (c[i][j] > truth[i][j]) high_middle++;
                if (c[i][j] < truth[i][j]) low_middle++;
            }
        }
    }

    std::cout << "\\n";
    std::cout << "over " << trials << " random weighted graphs on up to 6 nodes:\\n";
    std::cout << std::right;
    std::cout << "  k outermost matched every simple path  " << std::setw(6) << ok_outer << "\\n";
    std::cout << "  k innermost matched it                 " << std::setw(6) << ok_inner << "\\n";
    std::cout << "  k in the middle matched it             " << std::setw(6) << ok_middle << "\\n";
    std::cout << "  entries too high, innermost / middle   " << std::setw(6) << high_inner
              << " " << std::setw(6) << high_middle << "\\n";
    std::cout << "  entries too low,  innermost / middle   " << std::setw(6) << low_inner
              << " " << std::setw(6) << low_middle << "\\n";
    std::cout << "\\n";
    std::cout << "The failures are one-sided: too high, never too low. Every number the\\n";
    std::cout << "wrong orders report is the cost of some real route -- they just miss the\\n";
    std::cout << "cheaper ones. Row two of the table is a path whose nodes are numbered\\n";
    std::cout << "backwards, and both wrong orders call the far end unreachable. Row three\\n";
    std::cout << "is the softer failure, and only k innermost falls into it: a direct edge\\n";
    std::cout << "of 9 kept, when the route through two intermediates costs 3.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Floyd-Warshall, and why the k loop has to be the outer one.
//
// The algorithm is three nested loops over the same n values, and the order of
// those loops is the whole algorithm. Written with k outermost it computes
// every shortest path; written with k anywhere else it computes something that
// often looks right and is not.
//
// The reason is the invariant. After the k-th outer pass, d[i][j] is the
// shortest route from i to j whose intermediate nodes all come from
// {0..k}. Each pass widens the permitted set by exactly one node, and every
// pair is updated against that same set before the set grows. Move k inwards
// and different pairs are working against different sets, so a route that
// needs two intermediates can be asked about before either is available.
const INF: i64 = 1_000_000_000;

type Grid = Vec<Vec<i64>>;

/// The starting grid: 0 down the diagonal, the cheapest direct edge elsewhere.
fn matrix(n: usize, edges: &[(usize, usize, i64)]) -> Grid {
    let mut d = vec![vec![INF; n]; n];
    for i in 0..n {
        d[i][i] = 0;
    }
    for &(u, v, w) in edges {
        if w < d[u][v] {
            d[u][v] = w;
        }
    }
    d
}

/// k outermost. Every pair is widened by node k before k+1 is allowed.
fn floyd(n: usize, edges: &[(usize, usize, i64)]) -> Grid {
    let mut d = matrix(n, edges);
    for k in 0..n {
        for i in 0..n {
            for j in 0..n {
                if d[i][k] + d[k][j] < d[i][j] {
                    d[i][j] = d[i][k] + d[k][j];
                }
            }
        }
    }
    d
}

/// k innermost: pair (i, j) is finished before pair (i, j + 1) has started.
fn floyd_k_inner(n: usize, edges: &[(usize, usize, i64)]) -> Grid {
    let mut d = matrix(n, edges);
    for i in 0..n {
        for j in 0..n {
            for k in 0..n {
                if d[i][k] + d[k][j] < d[i][j] {
                    d[i][j] = d[i][k] + d[k][j];
                }
            }
        }
    }
    d
}

/// k in the middle: still one row at a time, still not a shared set.
fn floyd_k_middle(n: usize, edges: &[(usize, usize, i64)]) -> Grid {
    let mut d = matrix(n, edges);
    for i in 0..n {
        for k in 0..n {
            for j in 0..n {
                if d[i][k] + d[k][j] < d[i][j] {
                    d[i][j] = d[i][k] + d[k][j];
                }
            }
        }
    }
    d
}

fn walk(
    adj: &[Vec<(usize, i64)>],
    seen: &mut [bool],
    out: &mut Grid,
    start: usize,
    at: usize,
    cost: i64,
) {
    seen[at] = true;
    for &(nxt, w) in &adj[at] {
        if !seen[nxt] {
            if cost + w < out[start][nxt] {
                out[start][nxt] = cost + w;
            }
            walk(adj, seen, out, start, nxt, cost + w);
        }
    }
    seen[at] = false;
}

/// The oracle: the cheapest simple path between every pair, found by walking.
///
/// Exponential and correct. Nothing here is allowed to be a claim about what
/// Floyd-Warshall computes -- it has to be scored against a definition, and
/// the definition of a shortest path is the cheapest walk that repeats no node.
fn by_walking(n: usize, edges: &[(usize, usize, i64)]) -> Grid {
    let mut out = vec![vec![INF; n]; n];
    for i in 0..n {
        out[i][i] = 0;
    }
    let mut adj: Vec<Vec<(usize, i64)>> = vec![Vec::new(); n];
    for &(u, v, w) in edges {
        adj[u].push((v, w));
    }
    for start in 0..n {
        let mut seen = vec![false; n];
        walk(&adj, &mut seen, &mut out, start, start, 0);
    }
    out
}

fn show(row: &[i64]) -> String {
    let cells: Vec<String> = row
        .iter()
        .map(|&x| if x >= INF { "-".to_string() } else { x.to_string() })
        .collect();
    format!("[{}]", cells.join(", "))
}

fn label(edges: &[(usize, usize, i64)]) -> String {
    let cells: Vec<String> = edges
        .iter()
        .map(|&(u, v, w)| format!("{}->{}:{}", u, v, w))
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
    let cases: Vec<Vec<(usize, usize, i64)>> = vec![
        vec![(0, 1, 1), (1, 2, 1), (2, 3, 1)],
        vec![(0, 3, 1), (3, 2, 1), (2, 1, 1)],
        vec![(0, 1, 1), (0, 2, 9), (1, 3, 1), (3, 2, 1)],
    ];

    println!(
        "{:<44} {:<20} {:<22} {}",
        "edges", "row 0, correct", "row 0, k innermost", "row 0, k middle"
    );
    for edges in &cases {
        println!(
            "{:<44} {:<20} {:<22} {}",
            label(edges),
            show(&floyd(4, edges)[0]),
            show(&floyd_k_inner(4, edges)[0]),
            show(&floyd_k_middle(4, edges)[0])
        );
    }

    let mut rng = Rng { seed: 12345 };
    let trials = 3000;
    let (mut ok_outer, mut ok_inner, mut ok_middle) = (0, 0, 0);
    let (mut high_inner, mut high_middle) = (0, 0);
    let (mut low_inner, mut low_middle) = (0, 0);
    for _ in 0..trials {
        let n = 2 + rng.next(5) as usize;
        let mut edges: Vec<(usize, usize, i64)> = Vec::new();
        for u in 0..n {
            for v in 0..n {
                if u != v && rng.next(3) == 0 {
                    edges.push((u, v, 1 + rng.next(9)));
                }
            }
        }
        let truth = by_walking(n, &edges);
        let a = floyd(n, &edges);
        let b = floyd_k_inner(n, &edges);
        let c = floyd_k_middle(n, &edges);
        if a == truth {
            ok_outer += 1;
        }
        if b == truth {
            ok_inner += 1;
        }
        if c == truth {
            ok_middle += 1;
        }
        for i in 0..n {
            for j in 0..n {
                if b[i][j] > truth[i][j] {
                    high_inner += 1;
                }
                if b[i][j] < truth[i][j] {
                    low_inner += 1;
                }
                if c[i][j] > truth[i][j] {
                    high_middle += 1;
                }
                if c[i][j] < truth[i][j] {
                    low_middle += 1;
                }
            }
        }
    }

    println!();
    println!("over {} random weighted graphs on up to 6 nodes:", trials);
    println!("  k outermost matched every simple path  {:>6}", ok_outer);
    println!("  k innermost matched it                 {:>6}", ok_inner);
    println!("  k in the middle matched it             {:>6}", ok_middle);
    println!(
        "  entries too high, innermost / middle   {:>6} {:>6}",
        high_inner, high_middle
    );
    println!(
        "  entries too low,  innermost / middle   {:>6} {:>6}",
        low_inner, low_middle
    );
    println!();
    println!("The failures are one-sided: too high, never too low. Every number the");
    println!("wrong orders report is the cost of some real route -- they just miss the");
    println!("cheaper ones. Row two of the table is a path whose nodes are numbered");
    println!("backwards, and both wrong orders call the far end unreachable. Row three");
    println!("is the softer failure, and only k innermost falls into it: a direct edge");
    println!("of 9 kept, when the route through two intermediates costs 3.");
}
`,
            },
            {
              lang: "go",
              code: `// Floyd-Warshall, and why the k loop has to be the outer one.
//
// The algorithm is three nested loops over the same n values, and the order of
// those loops is the whole algorithm. Written with k outermost it computes
// every shortest path; written with k anywhere else it computes something that
// often looks right and is not.
//
// The reason is the invariant. After the k-th outer pass, d[i][j] is the
// shortest route from i to j whose intermediate nodes all come from
// {0..k}. Each pass widens the permitted set by exactly one node, and every
// pair is updated against that same set before the set grows. Move k inwards
// and different pairs are working against different sets, so a route that
// needs two intermediates can be asked about before either is available.
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

// matrix builds the starting grid: 0 down the diagonal, cheapest direct edge elsewhere.
func matrix(n int, edges []Edge) [][]int {
	d := make([][]int, n)
	for i := range d {
		d[i] = make([]int, n)
		for j := range d[i] {
			d[i][j] = INF
		}
		d[i][i] = 0
	}
	for _, e := range edges {
		if e.W < d[e.U][e.V] {
			d[e.U][e.V] = e.W
		}
	}
	return d
}

// floyd runs k outermost: every pair is widened by node k before k+1 is allowed.
func floyd(n int, edges []Edge) [][]int {
	d := matrix(n, edges)
	for k := 0; k < n; k++ {
		for i := 0; i < n; i++ {
			for j := 0; j < n; j++ {
				if d[i][k]+d[k][j] < d[i][j] {
					d[i][j] = d[i][k] + d[k][j]
				}
			}
		}
	}
	return d
}

// floydKInner runs k innermost: pair (i, j) is finished before (i, j+1) starts.
func floydKInner(n int, edges []Edge) [][]int {
	d := matrix(n, edges)
	for i := 0; i < n; i++ {
		for j := 0; j < n; j++ {
			for k := 0; k < n; k++ {
				if d[i][k]+d[k][j] < d[i][j] {
					d[i][j] = d[i][k] + d[k][j]
				}
			}
		}
	}
	return d
}

// floydKMiddle runs k in the middle: still one row at a time, still not a shared set.
func floydKMiddle(n int, edges []Edge) [][]int {
	d := matrix(n, edges)
	for i := 0; i < n; i++ {
		for k := 0; k < n; k++ {
			for j := 0; j < n; j++ {
				if d[i][k]+d[k][j] < d[i][j] {
					d[i][j] = d[i][k] + d[k][j]
				}
			}
		}
	}
	return d
}

func walk(adj [][][2]int, seen []bool, out [][]int, start, at, cost int) {
	seen[at] = true
	for _, step := range adj[at] {
		if !seen[step[0]] {
			if cost+step[1] < out[start][step[0]] {
				out[start][step[0]] = cost + step[1]
			}
			walk(adj, seen, out, start, step[0], cost+step[1])
		}
	}
	seen[at] = false
}

// byWalking is the oracle: the cheapest simple path between every pair.
//
// Exponential and correct. Nothing here is allowed to be a claim about what
// Floyd-Warshall computes -- it has to be scored against a definition, and
// the definition of a shortest path is the cheapest walk that repeats no node.
func byWalking(n int, edges []Edge) [][]int {
	out := make([][]int, n)
	for i := range out {
		out[i] = make([]int, n)
		for j := range out[i] {
			out[i][j] = INF
		}
		out[i][i] = 0
	}
	adj := make([][][2]int, n)
	for _, e := range edges {
		adj[e.U] = append(adj[e.U], [2]int{e.V, e.W})
	}
	for start := 0; start < n; start++ {
		walk(adj, make([]bool, n), out, start, start, 0)
	}
	return out
}

func same(a, b [][]int) bool {
	for i := range a {
		for j := range a[i] {
			if a[i][j] != b[i][j] {
				return false
			}
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
		cells[i] = fmt.Sprintf("%d->%d:%d", e.U, e.V, e.W)
	}
	return "[" + strings.Join(cells, ", ") + "]"
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
var seed int64 = 12345

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	cases := [][]Edge{
		{{0, 1, 1}, {1, 2, 1}, {2, 3, 1}},
		{{0, 3, 1}, {3, 2, 1}, {2, 1, 1}},
		{{0, 1, 1}, {0, 2, 9}, {1, 3, 1}, {3, 2, 1}},
	}

	fmt.Printf("%-44s %-20s %-22s %s\\n",
		"edges", "row 0, correct", "row 0, k innermost", "row 0, k middle")
	for _, edges := range cases {
		fmt.Printf("%-44s %-20s %-22s %s\\n", label(edges),
			show(floyd(4, edges)[0]), show(floydKInner(4, edges)[0]),
			show(floydKMiddle(4, edges)[0]))
	}

	trials := 3000
	okOuter, okInner, okMiddle := 0, 0, 0
	highInner, highMiddle, lowInner, lowMiddle := 0, 0, 0, 0
	for t := 0; t < trials; t++ {
		n := 2 + randBelow(5)
		var edges []Edge
		for u := 0; u < n; u++ {
			for v := 0; v < n; v++ {
				if u != v && randBelow(3) == 0 {
					edges = append(edges, Edge{u, v, 1 + randBelow(9)})
				}
			}
		}
		truth := byWalking(n, edges)
		a := floyd(n, edges)
		b := floydKInner(n, edges)
		c := floydKMiddle(n, edges)
		if same(a, truth) {
			okOuter++
		}
		if same(b, truth) {
			okInner++
		}
		if same(c, truth) {
			okMiddle++
		}
		for i := 0; i < n; i++ {
			for j := 0; j < n; j++ {
				if b[i][j] > truth[i][j] {
					highInner++
				}
				if b[i][j] < truth[i][j] {
					lowInner++
				}
				if c[i][j] > truth[i][j] {
					highMiddle++
				}
				if c[i][j] < truth[i][j] {
					lowMiddle++
				}
			}
		}
	}

	fmt.Println()
	fmt.Printf("over %d random weighted graphs on up to 6 nodes:\\n", trials)
	fmt.Printf("  k outermost matched every simple path  %6d\\n", okOuter)
	fmt.Printf("  k innermost matched it                 %6d\\n", okInner)
	fmt.Printf("  k in the middle matched it             %6d\\n", okMiddle)
	fmt.Printf("  entries too high, innermost / middle   %6d %6d\\n", highInner, highMiddle)
	fmt.Printf("  entries too low,  innermost / middle   %6d %6d\\n", lowInner, lowMiddle)
	fmt.Println()
	fmt.Println("The failures are one-sided: too high, never too low. Every number the")
	fmt.Println("wrong orders report is the cost of some real route -- they just miss the")
	fmt.Println("cheaper ones. Row two of the table is a path whose nodes are numbered")
	fmt.Println("backwards, and both wrong orders call the far end unreachable. Row three")
	fmt.Println("is the softer failure, and only k innermost falls into it: a direct edge")
	fmt.Println("of 9 kept, when the route through two intermediates costs 3.")
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "graph-floyd-loop-order",
        kind: "graph",
        algorithm: "floyd",
        title: "One node admitted as an intermediate at a time",
        lockAlgorithm: true,
      },
      pitfalls: [
        {
          title: "Writing the loops in the order they read best",
          body: "for i, for j, for k reads like \"for each pair, try every intermediate\" and is wrong. It scored 2,513 of 3,000 against an exhaustive search, and the 487 failures were all plausible numbers -- 896 entries too high, none too low. Nothing about the output looks broken. The mnemonic worth keeping is that k is the pass, not the inner search.",
        },
        {
          title: "Assuming a passing test means the loop order is right",
          body: "The first demo row -- a path listed 0->1->2->3 -- comes out identical in all three orders. So does any graph whose node numbering happens to agree with its route order. A test built from hand-drawn examples will usually pass. The one that catches it is the same path with its nodes numbered backwards.",
        },
      ],
    },
    {
      id: "what-the-grid-buys",
      heading: "What the grid buys",
      body: [
        "\"All pairs\" is not a reason to reach for Floyd-Warshall. Running Dijkstra from every node also gives all pairs, and on a sparse graph it is faster. The reason to reach for the grid is what it is allowed to be given.",
        "Dijkstra needs non-negative weights because it settles nodes: it declares a distance final and never revisits it. Floyd-Warshall settles nothing. Every entry stays open to improvement until the last pass ends, so a negative edge discovered late is simply applied. On 2,506 random graphs with weights from -3 to 5 and no negative cycle, the grid matched an exhaustive search on every one; `n` Dijkstras matched on 2,442, reporting 117 entries too high and, again, none too low.",
        "The smallest example of that gap needs three nodes. With `0\u21921` costing 1, `0\u21922` costing 2 and `2\u21921` costing -2, Dijkstra pops node 1 at distance 1, marks it done, and never looks at the route through node 2 that costs 0.",
        "The negative-cycle test then comes for free, and reads strangely: after the run, `d[i][i] < 0`. A route from `i` back to `i` costing less than nothing is a loop that pays, so *somewhere* in the graph there is a negative cycle. As an existence test it is exact \u2014 right on all 3,000 graphs measured.",
        "The folklore goes one step further and says `d[i][i] < 0` names the nodes *on* a negative cycle. It does not. Measured against an exhaustive enumeration of every simple cycle, the negative diagonals always contained those nodes and on 85 graphs contained strictly more. Measured the other way, against every node sitting on a negative closed *walk* \u2014 which includes nodes that can reach a paying cycle and get back \u2014 the diagonals were always contained and on 110 graphs were strictly fewer. The set sits between two natural definitions and equals neither.",
        "So: use the diagonal for yes or no. To name the nodes with no shortest distance at all, use the method from the previous lesson \u2014 run Bellman-Ford and search forward from the edges that were still improving on the extra round.",
      ],
      examples: [
        {
          id: "negative-edges-and-the-diagonal",
          title: "Negative weights, n Dijkstras, and what the diagonal actually names",
          lang: "python",
          code: `# What the grid buys: negative edges, and a negative cycle named on the diagonal.
#
# Floyd-Warshall is not just "all pairs at once". Running Dijkstra from every
# node also gives all pairs, in less time on a sparse graph. The difference is
# what each one is allowed to be given. Dijkstra needs non-negative weights;
# Floyd-Warshall never settles anything, so it does not.
#
# And the negative-cycle test comes free and reads strangely: after the run,
# d[i][i] < 0 means there is a route from i back to i that costs less than
# nothing. Whether that is the same as "i is on a negative cycle" is the
# folklore, and the numbers at the bottom say it is not.
import heapq

INF = 10 ** 9


def matrix(n, edges):
    d = [[INF] * n for _ in range(n)]
    for i in range(n):
        d[i][i] = 0
    for u, v, w in edges:
        if w < d[u][v]:
            d[u][v] = w
    return d


def floyd(n, edges):
    d = matrix(n, edges)
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if d[i][k] < INF and d[k][j] < INF and d[i][k] + d[k][j] < d[i][j]:
                    d[i][j] = d[i][k] + d[k][j]
    return d


def dijkstra_all(n, edges):
    """All pairs the other way: one Dijkstra per node. Fine until a weight is negative."""
    adj = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((v, w))
    out = []
    for start in range(n):
        best = [INF] * n
        best[start] = 0
        done = [False] * n
        heap = [(0, start)]
        while heap:
            cost, at = heapq.heappop(heap)
            if done[at]:
                continue
            done[at] = True
            for nxt, w in adj[at]:
                if not done[nxt] and cost + w < best[nxt]:
                    best[nxt] = cost + w
                    heapq.heappush(heap, (cost + w, nxt))
        out.append(best)
    return out


def by_walking(n, edges):
    """The cheapest simple path between every pair. Exponential, and the definition."""
    out = [[INF] * n for _ in range(n)]
    for i in range(n):
        out[i][i] = 0
    adj = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((v, w))

    for start in range(n):
        seen = [False] * n

        def walk(at, cost):
            seen[at] = True
            for nxt, w in adj[at]:
                if not seen[nxt]:
                    if cost + w < out[start][nxt]:
                        out[start][nxt] = cost + w
                    walk(nxt, cost + w)
            seen[at] = False

        walk(start, 0)
    return out


def cycle_nodes(n, edges):
    """Every node that lies on a simple cycle whose weights sum below zero.

    Enumerated directly from the definition, so the diagonal test has something
    independent to be scored against.
    """
    adj = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((v, w))
    bad = set()

    for start in range(n):
        path = [start]
        seen = [False] * n
        seen[start] = True

        def walk(at, cost):
            for nxt, w in adj[at]:
                if nxt == start:
                    if cost + w < 0:
                        bad.update(path)
                elif not seen[nxt] and nxt > start:
                    seen[nxt] = True
                    path.append(nxt)
                    walk(nxt, cost + w)
                    path.pop()
                    seen[nxt] = False

        walk(start, 0)
    return bad


def reaches(n, edges, sources):
    """Everything the given nodes can get to, following edges forwards."""
    adj = [[] for _ in range(n)]
    for u, v, _ in edges:
        adj[u].append(v)
    seen = set(sources)
    stack = list(sources)
    while stack:
        at = stack.pop()
        for nxt in adj[at]:
            if nxt not in seen:
                seen.add(nxt)
                stack.append(nxt)
    return seen


def looping_nodes(n, edges):
    """Nodes sitting on a closed walk that costs less than nothing.

    Not the same set as "on a negative cycle": a node that can reach a paying
    cycle and get back is on such a walk too, without being on the cycle
    itself. The diagonal turns out to sit between the two.
    """
    bad = cycle_nodes(n, edges)
    if not bad:
        return set()
    out = set()
    forward_to = {i: reaches(n, edges, [i]) for i in range(n)}
    for i in range(n):
        for c in bad:
            if c in forward_to[i] and i in forward_to[c]:
                out.add(i)
                break
    return out


def diagonal_negative(n, edges):
    """The free test: which nodes come back with a negative distance to themselves."""
    d = floyd(n, edges)
    return set(i for i in range(n) if d[i][i] < 0)


def show(row):
    return "[" + ", ".join("-" if x >= INF else str(x) for x in row) + "]"


def label(edges):
    return "[" + ", ".join("%d->%d:%d" % e for e in edges) + "]"


CASES = [
    (3, [(0, 1, 4), (0, 2, 1), (2, 1, 1)]),
    (3, [(0, 1, 1), (0, 2, 2), (2, 1, -2)]),
    (4, [(0, 1, 3), (1, 2, -2), (2, 3, 1), (0, 3, 4)]),
]

print("%-40s %-18s %s" % ("edges", "Floyd, row 0", "n Dijkstras, row 0"))
for n, edges in CASES:
    print("%-40s %-18s %s" % (label(edges), show(floyd(n, edges)[0]), show(dijkstra_all(n, edges)[0])))

# The same linear congruential generator in every language, so the random
# graphs below are the same graphs whichever translation is run.
seed = 20250907


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


trials = 3000
kept = 0
floyd_ok = dij_ok = 0
dij_high = 0
exists_ok = 0
any_cycle = 0
above_cycle = below_walk = 0
bigger_than_cycle = smaller_than_walk = 0
for _ in range(trials):
    n = 2 + rand(4)
    edges = []
    for u in range(n):
        for v in range(n):
            if u != v and rand(3) == 0:
                edges.append((u, v, rand(9) - 3))
    on_cycle = cycle_nodes(n, edges)
    looping = looping_nodes(n, edges)
    diagonal = diagonal_negative(n, edges)
    exists_ok += bool(diagonal) == bool(on_cycle)
    if on_cycle:
        any_cycle += 1
        above_cycle += on_cycle <= diagonal
        below_walk += diagonal <= looping
        bigger_than_cycle += on_cycle < diagonal
        smaller_than_walk += diagonal < looping
        continue
    kept += 1
    truth = by_walking(n, edges)
    a, b = floyd(n, edges), dijkstra_all(n, edges)
    floyd_ok += a == truth
    dij_ok += b == truth
    for i in range(n):
        for j in range(n):
            if b[i][j] > truth[i][j]:
                dij_high += 1

print()
print("over %d random graphs with weights from -3 to 5:" % trials)
print("  graphs with no negative cycle, scored      %6d" % kept)
print("  Floyd-Warshall matched every simple path   %6d" % floyd_ok)
print("  n Dijkstras matched it                     %6d" % dij_ok)
print("  entries Dijkstra reported too high         %6d" % dij_high)
print()
print("  graphs holding a negative cycle            %6d" % any_cycle)
print("  \\"some d[i][i] < 0\\" answered yes or no     %6d of %d" % (exists_ok, trials))
print("  the negative diagonals held every node")
print("    that is on a negative cycle              %6d of %d" % (above_cycle, any_cycle))
print("    and held more than those                 %6d" % bigger_than_cycle)
print("  every negative diagonal was on a negative")
print("    closed walk                              %6d of %d" % (below_walk, any_cycle))
print("    and some such nodes were missed          %6d" % smaller_than_walk)
print()
print("Row two of the table is the smallest disagreement: Dijkstra settles node")
print("1 at 1 and never looks again, so it misses the route through the -2 edge.")
print("Floyd-Warshall settles nothing and finds 0. Over the random graphs that")
print("cost Dijkstra %d entries, always too high, never too low." % dij_high)
print()
print("The diagonal answers one question exactly and another one only roughly.")
print("Does the graph hold a negative cycle -- yes or no -- was right on all")
print("%d graphs. Which nodes is the folklore, and it matches neither natural" % trials)
print("definition: the negative diagonals strictly contained the nodes on a")
print("negative cycle on %d graphs, and were strictly contained in the nodes on" % bigger_than_cycle)
print("a negative closed walk on %d. So use the diagonal for the yes-or-no. To" % smaller_than_walk)
print("name the nodes with no shortest distance, run Bellman-Ford and search")
print("forward from the edges that were still improving.")
`,
          output: `edges                                    Floyd, row 0       n Dijkstras, row 0
[0->1:4, 0->2:1, 2->1:1]                 [0, 2, 1]          [0, 2, 1]
[0->1:1, 0->2:2, 2->1:-2]                [0, 0, 2]          [0, 1, 2]
[0->1:3, 1->2:-2, 2->3:1, 0->3:4]        [0, 3, 1, 2]       [0, 3, 1, 2]

over 3000 random graphs with weights from -3 to 5:
  graphs with no negative cycle, scored        2506
  Floyd-Warshall matched every simple path     2506
  n Dijkstras matched it                       2442
  entries Dijkstra reported too high            117

  graphs holding a negative cycle               494
  "some d[i][i] < 0" answered yes or no       3000 of 3000
  the negative diagonals held every node
    that is on a negative cycle                 494 of 494
    and held more than those                     85
  every negative diagonal was on a negative
    closed walk                                 494 of 494
    and some such nodes were missed             110

Row two of the table is the smallest disagreement: Dijkstra settles node
1 at 1 and never looks again, so it misses the route through the -2 edge.
Floyd-Warshall settles nothing and finds 0. Over the random graphs that
cost Dijkstra 117 entries, always too high, never too low.

The diagonal answers one question exactly and another one only roughly.
Does the graph hold a negative cycle -- yes or no -- was right on all
3000 graphs. Which nodes is the folklore, and it matches neither natural
definition: the negative diagonals strictly contained the nodes on a
negative cycle on 85 graphs, and were strictly contained in the nodes on
a negative closed walk on 110. So use the diagonal for the yes-or-no. To
name the nodes with no shortest distance, run Bellman-Ford and search
forward from the edges that were still improving.`,
          explanation:
            "The grid against n runs of Dijkstra on graphs holding negative edges, and the d[i][i] < 0 test scored against two different definitions of what a negative cycle ruins.",
          alternates: [
            {
              lang: "javascript",
              code: `// What the grid buys: negative edges, and a negative cycle named on the diagonal.
//
// Floyd-Warshall is not just "all pairs at once". Running Dijkstra from every
// node also gives all pairs, in less time on a sparse graph. The difference is
// what each one is allowed to be given. Dijkstra needs non-negative weights;
// Floyd-Warshall never settles anything, so it does not.
//
// And the negative-cycle test comes free and reads strangely: after the run,
// d[i][i] < 0 means there is a route from i back to i that costs less than
// nothing. Whether that is the same as "i is on a negative cycle" is the
// folklore, and the numbers at the bottom say it is not.
const INF = 10 ** 9;

function matrix(n, edges) {
  const d = Array.from({ length: n }, () => new Array(n).fill(INF));
  for (let i = 0; i < n; i += 1) d[i][i] = 0;
  for (const [u, v, w] of edges) if (w < d[u][v]) d[u][v] = w;
  return d;
}

function floyd(n, edges) {
  const d = matrix(n, edges);
  for (let k = 0; k < n; k += 1)
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1)
        if (d[i][k] < INF && d[k][j] < INF && d[i][k] + d[k][j] < d[i][j])
          d[i][j] = d[i][k] + d[k][j];
  return d;
}

// A binary heap keyed on (cost, node), so every translation pops in the same
// order and the measurements below are the same measurements.
class Heap {
  constructor() {
    this.items = [];
  }

  static before(a, b) {
    return a[0] !== b[0] ? a[0] < b[0] : a[1] < b[1];
  }

  push(item) {
    this.items.push(item);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!Heap.before(this.items[i], this.items[parent])) break;
      [this.items[i], this.items[parent]] = [this.items[parent], this.items[i]];
      i = parent;
    }
  }

  pop() {
    const top = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      for (;;) {
        let best = i;
        for (const c of [2 * i + 1, 2 * i + 2])
          if (c < this.items.length && Heap.before(this.items[c], this.items[best])) best = c;
        if (best === i) break;
        [this.items[i], this.items[best]] = [this.items[best], this.items[i]];
        i = best;
      }
    }
    return top;
  }

  get size() {
    return this.items.length;
  }
}

// All pairs the other way: one Dijkstra per node. Fine until a weight is negative.
function dijkstraAll(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  const out = [];
  for (let start = 0; start < n; start += 1) {
    const best = new Array(n).fill(INF);
    best[start] = 0;
    const done = new Array(n).fill(false);
    const heap = new Heap();
    heap.push([0, start]);
    while (heap.size > 0) {
      const [cost, at] = heap.pop();
      if (done[at]) continue;
      done[at] = true;
      for (const [nxt, w] of adj[at]) {
        if (!done[nxt] && cost + w < best[nxt]) {
          best[nxt] = cost + w;
          heap.push([cost + w, nxt]);
        }
      }
    }
    out.push(best);
  }
  return out;
}

// The cheapest simple path between every pair. Exponential, and the definition.
function byWalking(n, edges) {
  const out = Array.from({ length: n }, () => new Array(n).fill(INF));
  for (let i = 0; i < n; i += 1) out[i][i] = 0;
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);

  for (let start = 0; start < n; start += 1) {
    const seen = new Array(n).fill(false);
    const walk = (at, cost) => {
      seen[at] = true;
      for (const [nxt, w] of adj[at]) {
        if (!seen[nxt]) {
          if (cost + w < out[start][nxt]) out[start][nxt] = cost + w;
          walk(nxt, cost + w);
        }
      }
      seen[at] = false;
    };
    walk(start, 0);
  }
  return out;
}

// Every node that lies on a simple cycle whose weights sum below zero.
//
// Enumerated directly from the definition, so the diagonal test has something
// independent to be scored against.
function cycleNodes(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  const bad = new Array(n).fill(false);

  for (let start = 0; start < n; start += 1) {
    const path = [start];
    const seen = new Array(n).fill(false);
    seen[start] = true;
    const walk = (at, cost) => {
      for (const [nxt, w] of adj[at]) {
        if (nxt === start) {
          if (cost + w < 0) for (const p of path) bad[p] = true;
        } else if (!seen[nxt] && nxt > start) {
          seen[nxt] = true;
          path.push(nxt);
          walk(nxt, cost + w);
          path.pop();
          seen[nxt] = false;
        }
      }
    };
    walk(start, 0);
  }
  return bad;
}

// Everything the given nodes can get to, following edges forwards.
function reaches(n, edges, sources) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v);
  const seen = new Array(n).fill(false);
  const stack = [];
  for (let i = 0; i < n; i += 1)
    if (sources[i]) {
      seen[i] = true;
      stack.push(i);
    }
  while (stack.length > 0) {
    const at = stack.pop();
    for (const nxt of adj[at])
      if (!seen[nxt]) {
        seen[nxt] = true;
        stack.push(nxt);
      }
  }
  return seen;
}

// Nodes sitting on a closed walk that costs less than nothing.
//
// Not the same set as "on a negative cycle": a node that can reach a paying
// cycle and get back is on such a walk too, without being on the cycle
// itself. The diagonal turns out to sit between the two.
function loopingNodes(n, edges) {
  const bad = cycleNodes(n, edges);
  const out = new Array(n).fill(false);
  if (!bad.some((x) => x)) return out;
  const forwardTo = [];
  for (let i = 0; i < n; i += 1) {
    const one = new Array(n).fill(false);
    one[i] = true;
    forwardTo.push(reaches(n, edges, one));
  }
  for (let i = 0; i < n; i += 1)
    for (let c = 0; c < n; c += 1)
      if (bad[c] && forwardTo[i][c] && forwardTo[c][i]) {
        out[i] = true;
        break;
      }
  return out;
}

// The free test: which nodes come back with a negative distance to themselves.
function diagonalNegative(n, edges) {
  const d = floyd(n, edges);
  return d.map((row, i) => row[i] < 0);
}

const any = (s) => s.some((x) => x);
const subset = (a, b) => a.every((x, i) => !x || b[i]);
const strictSubset = (a, b) => subset(a, b) && !subset(b, a);

function show(row) {
  return "[" + row.map((x) => (x >= INF ? "-" : String(x))).join(", ") + "]";
}

function label(edges) {
  return "[" + edges.map(([u, v, w]) => \`\${u}->\${v}:\${w}\`).join(", ") + "]";
}

const CASES = [
  [3, [[0, 1, 4], [0, 2, 1], [2, 1, 1]]],
  [3, [[0, 1, 1], [0, 2, 2], [2, 1, -2]]],
  [4, [[0, 1, 3], [1, 2, -2], [2, 3, 1], [0, 3, 4]]],
];

console.log("edges".padEnd(40) + " " + "Floyd, row 0".padEnd(18) + " " + "n Dijkstras, row 0");
for (const [n, edges] of CASES) {
  console.log(
    label(edges).padEnd(40) + " " + show(floyd(n, edges)[0]).padEnd(18) + " " +
    show(dijkstraAll(n, edges)[0]),
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 20250907n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let kept = 0;
let floydOk = 0;
let dijOk = 0;
let dijHigh = 0;
let existsOk = 0;
let anyCycle = 0;
let aboveCycle = 0;
let belowWalk = 0;
let biggerThanCycle = 0;
let smallerThanWalk = 0;
const same = (a, b) => a.every((row, i) => row.every((x, j) => x === b[i][j]));
for (let t = 0; t < trials; t += 1) {
  const n = 2 + rand(4);
  const edges = [];
  for (let u = 0; u < n; u += 1)
    for (let v = 0; v < n; v += 1)
      if (u !== v && rand(3) === 0) edges.push([u, v, rand(9) - 3]);
  const onCycle = cycleNodes(n, edges);
  const looping = loopingNodes(n, edges);
  const diagonal = diagonalNegative(n, edges);
  if (any(diagonal) === any(onCycle)) existsOk += 1;
  if (any(onCycle)) {
    anyCycle += 1;
    if (subset(onCycle, diagonal)) aboveCycle += 1;
    if (subset(diagonal, looping)) belowWalk += 1;
    if (strictSubset(onCycle, diagonal)) biggerThanCycle += 1;
    if (strictSubset(diagonal, looping)) smallerThanWalk += 1;
    continue;
  }
  kept += 1;
  const truth = byWalking(n, edges);
  const a = floyd(n, edges);
  const b = dijkstraAll(n, edges);
  if (same(a, truth)) floydOk += 1;
  if (same(b, truth)) dijOk += 1;
  for (let i = 0; i < n; i += 1)
    for (let j = 0; j < n; j += 1) if (b[i][j] > truth[i][j]) dijHigh += 1;
}

console.log();
console.log(\`over \${trials} random graphs with weights from -3 to 5:\`);
console.log("  graphs with no negative cycle, scored      " + String(kept).padStart(6));
console.log("  Floyd-Warshall matched every simple path   " + String(floydOk).padStart(6));
console.log("  n Dijkstras matched it                     " + String(dijOk).padStart(6));
console.log("  entries Dijkstra reported too high         " + String(dijHigh).padStart(6));
console.log();
console.log("  graphs holding a negative cycle            " + String(anyCycle).padStart(6));
console.log('  "some d[i][i] < 0" answered yes or no     ' + String(existsOk).padStart(6) + " of " + trials);
console.log("  the negative diagonals held every node");
console.log("    that is on a negative cycle              " + String(aboveCycle).padStart(6) + " of " + anyCycle);
console.log("    and held more than those                 " + String(biggerThanCycle).padStart(6));
console.log("  every negative diagonal was on a negative");
console.log("    closed walk                              " + String(belowWalk).padStart(6) + " of " + anyCycle);
console.log("    and some such nodes were missed          " + String(smallerThanWalk).padStart(6));
console.log();
console.log("Row two of the table is the smallest disagreement: Dijkstra settles node");
console.log("1 at 1 and never looks again, so it misses the route through the -2 edge.");
console.log("Floyd-Warshall settles nothing and finds 0. Over the random graphs that");
console.log(\`cost Dijkstra \${dijHigh} entries, always too high, never too low.\`);
console.log();
console.log("The diagonal answers one question exactly and another one only roughly.");
console.log("Does the graph hold a negative cycle -- yes or no -- was right on all");
console.log(\`\${trials} graphs. Which nodes is the folklore, and it matches neither natural\`);
console.log("definition: the negative diagonals strictly contained the nodes on a");
console.log(\`negative cycle on \${biggerThanCycle} graphs, and were strictly contained in the nodes on\`);
console.log(\`a negative closed walk on \${smallerThanWalk}. So use the diagonal for the yes-or-no. To\`);
console.log("name the nodes with no shortest distance, run Bellman-Ford and search");
console.log("forward from the edges that were still improving.");
`,
            },
            {
              lang: "typescript",
              code: `// What the grid buys: negative edges, and a negative cycle named on the diagonal.
//
// Floyd-Warshall is not just "all pairs at once". Running Dijkstra from every
// node also gives all pairs, in less time on a sparse graph. The difference is
// what each one is allowed to be given. Dijkstra needs non-negative weights;
// Floyd-Warshall never settles anything, so it does not.
//
// And the negative-cycle test comes free and reads strangely: after the run,
// d[i][i] < 0 means there is a route from i back to i that costs less than
// nothing. Whether that is the same as "i is on a negative cycle" is the
// folklore, and the numbers at the bottom say it is not.
const INF = 10 ** 9;

function matrix(n: number, edges: number[][]): number[][] {
  const d = Array.from({ length: n }, () => new Array(n).fill(INF));
  for (let i = 0; i < n; i += 1) d[i][i] = 0;
  for (const [u, v, w] of edges) if (w < d[u][v]) d[u][v] = w;
  return d;
}

function floyd(n: number, edges: number[][]): number[][] {
  const d = matrix(n, edges);
  for (let k = 0; k < n; k += 1)
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1)
        if (d[i][k] < INF && d[k][j] < INF && d[i][k] + d[k][j] < d[i][j])
          d[i][j] = d[i][k] + d[k][j];
  return d;
}

// A binary heap keyed on (cost, node), so every translation pops in the same
// order and the measurements below are the same measurements.
class Heap {
  items: [number, number][] = [];

  static before(a: [number, number], b: [number, number]): boolean {
    return a[0] !== b[0] ? a[0] < b[0] : a[1] < b[1];
  }

  push(item: [number, number]): void {
    this.items.push(item);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!Heap.before(this.items[i], this.items[parent])) break;
      [this.items[i], this.items[parent]] = [this.items[parent], this.items[i]];
      i = parent;
    }
  }

  pop(): [number, number] {
    const top = this.items[0];
    const last = this.items.pop() as [number, number];
    if (this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      for (;;) {
        let best = i;
        for (const c of [2 * i + 1, 2 * i + 2])
          if (c < this.items.length && Heap.before(this.items[c], this.items[best])) best = c;
        if (best === i) break;
        [this.items[i], this.items[best]] = [this.items[best], this.items[i]];
        i = best;
      }
    }
    return top;
  }

  get size(): number {
    return this.items.length;
  }
}

// All pairs the other way: one Dijkstra per node. Fine until a weight is negative.
function dijkstraAll(n: number, edges: number[][]): number[][] {
  const adj = Array.from({ length: n }, () => [] as number[][]);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  const out: number[][] = [];
  for (let start = 0; start < n; start += 1) {
    const best = new Array(n).fill(INF);
    best[start] = 0;
    const done = new Array(n).fill(false);
    const heap = new Heap();
    heap.push([0, start]);
    while (heap.size > 0) {
      const [cost, at] = heap.pop();
      if (done[at]) continue;
      done[at] = true;
      for (const [nxt, w] of adj[at]) {
        if (!done[nxt] && cost + w < best[nxt]) {
          best[nxt] = cost + w;
          heap.push([cost + w, nxt]);
        }
      }
    }
    out.push(best);
  }
  return out;
}

// The cheapest simple path between every pair. Exponential, and the definition.
function byWalking(n: number, edges: number[][]): number[][] {
  const out = Array.from({ length: n }, () => new Array(n).fill(INF));
  for (let i = 0; i < n; i += 1) out[i][i] = 0;
  const adj = Array.from({ length: n }, () => [] as number[][]);
  for (const [u, v, w] of edges) adj[u].push([v, w]);

  for (let start = 0; start < n; start += 1) {
    const seen = new Array(n).fill(false);
    const walk = (at: number, cost: number): void => {
      seen[at] = true;
      for (const [nxt, w] of adj[at]) {
        if (!seen[nxt]) {
          if (cost + w < out[start][nxt]) out[start][nxt] = cost + w;
          walk(nxt, cost + w);
        }
      }
      seen[at] = false;
    };
    walk(start, 0);
  }
  return out;
}

// Every node that lies on a simple cycle whose weights sum below zero.
//
// Enumerated directly from the definition, so the diagonal test has something
// independent to be scored against.
function cycleNodes(n: number, edges: number[][]): boolean[] {
  const adj = Array.from({ length: n }, () => [] as number[][]);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  const bad = new Array(n).fill(false);

  for (let start = 0; start < n; start += 1) {
    const path = [start];
    const seen = new Array(n).fill(false);
    seen[start] = true;
    const walk = (at: number, cost: number): void => {
      for (const [nxt, w] of adj[at]) {
        if (nxt === start) {
          if (cost + w < 0) for (const p of path) bad[p] = true;
        } else if (!seen[nxt] && nxt > start) {
          seen[nxt] = true;
          path.push(nxt);
          walk(nxt, cost + w);
          path.pop();
          seen[nxt] = false;
        }
      }
    };
    walk(start, 0);
  }
  return bad;
}

// Everything the given nodes can get to, following edges forwards.
function reaches(n: number, edges: number[][], sources: boolean[]): boolean[] {
  const adj = Array.from({ length: n }, () => [] as number[]);
  for (const [u, v] of edges) adj[u].push(v);
  const seen: boolean[] = new Array(n).fill(false);
  const stack: number[] = [];
  for (let i = 0; i < n; i += 1)
    if (sources[i]) {
      seen[i] = true;
      stack.push(i);
    }
  while (stack.length > 0) {
    const at = stack.pop() as number;
    for (const nxt of adj[at])
      if (!seen[nxt]) {
        seen[nxt] = true;
        stack.push(nxt);
      }
  }
  return seen;
}

// Nodes sitting on a closed walk that costs less than nothing.
//
// Not the same set as "on a negative cycle": a node that can reach a paying
// cycle and get back is on such a walk too, without being on the cycle
// itself. The diagonal turns out to sit between the two.
function loopingNodes(n: number, edges: number[][]): boolean[] {
  const bad = cycleNodes(n, edges);
  const out = new Array(n).fill(false);
  if (!bad.some((x) => x)) return out;
  const forwardTo: boolean[][] = [];
  for (let i = 0; i < n; i += 1) {
    const one = new Array(n).fill(false);
    one[i] = true;
    forwardTo.push(reaches(n, edges, one));
  }
  for (let i = 0; i < n; i += 1)
    for (let c = 0; c < n; c += 1)
      if (bad[c] && forwardTo[i][c] && forwardTo[c][i]) {
        out[i] = true;
        break;
      }
  return out;
}

// The free test: which nodes come back with a negative distance to themselves.
function diagonalNegative(n: number, edges: number[][]): boolean[] {
  const d = floyd(n, edges);
  return d.map((row, i) => row[i] < 0);
}

const any = (s: boolean[]): boolean => s.some((x) => x);
const subset = (a: boolean[], b: boolean[]): boolean => a.every((x, i) => !x || b[i]);
const strictSubset = (a: boolean[], b: boolean[]): boolean => subset(a, b) && !subset(b, a);

function show(row: number[]): string {
  return "[" + row.map((x) => (x >= INF ? "-" : String(x))).join(", ") + "]";
}

function label(edges: number[][]): string {
  return "[" + edges.map(([u, v, w]) => \`\${u}->\${v}:\${w}\`).join(", ") + "]";
}

const CASES: [number, number[][]][] = [
  [3, [[0, 1, 4], [0, 2, 1], [2, 1, 1]]],
  [3, [[0, 1, 1], [0, 2, 2], [2, 1, -2]]],
  [4, [[0, 1, 3], [1, 2, -2], [2, 3, 1], [0, 3, 4]]],
];

console.log("edges".padEnd(40) + " " + "Floyd, row 0".padEnd(18) + " " + "n Dijkstras, row 0");
for (const [n, edges] of CASES) {
  console.log(
    label(edges).padEnd(40) + " " + show(floyd(n, edges)[0]).padEnd(18) + " " +
    show(dijkstraAll(n, edges)[0]),
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 20250907n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let kept = 0;
let floydOk = 0;
let dijOk = 0;
let dijHigh = 0;
let existsOk = 0;
let anyCycle = 0;
let aboveCycle = 0;
let belowWalk = 0;
let biggerThanCycle = 0;
let smallerThanWalk = 0;
const same = (a: number[][], b: number[][]): boolean => a.every((row, i) => row.every((x, j) => x === b[i][j]));
for (let t = 0; t < trials; t += 1) {
  const n = 2 + rand(4);
  const edges: number[][] = [];
  for (let u = 0; u < n; u += 1)
    for (let v = 0; v < n; v += 1)
      if (u !== v && rand(3) === 0) edges.push([u, v, rand(9) - 3]);
  const onCycle = cycleNodes(n, edges);
  const looping = loopingNodes(n, edges);
  const diagonal = diagonalNegative(n, edges);
  if (any(diagonal) === any(onCycle)) existsOk += 1;
  if (any(onCycle)) {
    anyCycle += 1;
    if (subset(onCycle, diagonal)) aboveCycle += 1;
    if (subset(diagonal, looping)) belowWalk += 1;
    if (strictSubset(onCycle, diagonal)) biggerThanCycle += 1;
    if (strictSubset(diagonal, looping)) smallerThanWalk += 1;
    continue;
  }
  kept += 1;
  const truth = byWalking(n, edges);
  const a = floyd(n, edges);
  const b = dijkstraAll(n, edges);
  if (same(a, truth)) floydOk += 1;
  if (same(b, truth)) dijOk += 1;
  for (let i = 0; i < n; i += 1)
    for (let j = 0; j < n; j += 1) if (b[i][j] > truth[i][j]) dijHigh += 1;
}

console.log();
console.log(\`over \${trials} random graphs with weights from -3 to 5:\`);
console.log("  graphs with no negative cycle, scored      " + String(kept).padStart(6));
console.log("  Floyd-Warshall matched every simple path   " + String(floydOk).padStart(6));
console.log("  n Dijkstras matched it                     " + String(dijOk).padStart(6));
console.log("  entries Dijkstra reported too high         " + String(dijHigh).padStart(6));
console.log();
console.log("  graphs holding a negative cycle            " + String(anyCycle).padStart(6));
console.log('  "some d[i][i] < 0" answered yes or no     ' + String(existsOk).padStart(6) + " of " + trials);
console.log("  the negative diagonals held every node");
console.log("    that is on a negative cycle              " + String(aboveCycle).padStart(6) + " of " + anyCycle);
console.log("    and held more than those                 " + String(biggerThanCycle).padStart(6));
console.log("  every negative diagonal was on a negative");
console.log("    closed walk                              " + String(belowWalk).padStart(6) + " of " + anyCycle);
console.log("    and some such nodes were missed          " + String(smallerThanWalk).padStart(6));
console.log();
console.log("Row two of the table is the smallest disagreement: Dijkstra settles node");
console.log("1 at 1 and never looks again, so it misses the route through the -2 edge.");
console.log("Floyd-Warshall settles nothing and finds 0. Over the random graphs that");
console.log(\`cost Dijkstra \${dijHigh} entries, always too high, never too low.\`);
console.log();
console.log("The diagonal answers one question exactly and another one only roughly.");
console.log("Does the graph hold a negative cycle -- yes or no -- was right on all");
console.log(\`\${trials} graphs. Which nodes is the folklore, and it matches neither natural\`);
console.log("definition: the negative diagonals strictly contained the nodes on a");
console.log(\`negative cycle on \${biggerThanCycle} graphs, and were strictly contained in the nodes on\`);
console.log(\`a negative closed walk on \${smallerThanWalk}. So use the diagonal for the yes-or-no. To\`);
console.log("name the nodes with no shortest distance, run Bellman-Ford and search");
console.log("forward from the edges that were still improving.");
`,
            },
            {
              lang: "java",
              code: `// What the grid buys: negative edges, and a negative cycle named on the diagonal.
//
// Floyd-Warshall is not just "all pairs at once". Running Dijkstra from every
// node also gives all pairs, in less time on a sparse graph. The difference is
// what each one is allowed to be given. Dijkstra needs non-negative weights;
// Floyd-Warshall never settles anything, so it does not.
//
// And the negative-cycle test comes free and reads strangely: after the run,
// d[i][i] < 0 means there is a route from i back to i that costs less than
// nothing. Whether that is the same as "i is on a negative cycle" is the
// folklore, and the numbers at the bottom say it is not.
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Deque;
import java.util.List;
import java.util.PriorityQueue;

public class Main {
    static final int INF = 1000000000;

    static int[][] matrix(int n, int[][] edges) {
        int[][] d = new int[n][n];
        for (int[] row : d) Arrays.fill(row, INF);
        for (int i = 0; i < n; i++) d[i][i] = 0;
        for (int[] e : edges) if (e[2] < d[e[0]][e[1]]) d[e[0]][e[1]] = e[2];
        return d;
    }

    static int[][] floyd(int n, int[][] edges) {
        int[][] d = matrix(n, edges);
        for (int k = 0; k < n; k++)
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++)
                    if (d[i][k] < INF && d[k][j] < INF && d[i][k] + d[k][j] < d[i][j])
                        d[i][j] = d[i][k] + d[k][j];
        return d;
    }

    static List<int[]>[] adjacency(int n, int[][] edges) {
        @SuppressWarnings("unchecked")
        List<int[]>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : edges) adj[e[0]].add(new int[] {e[1], e[2]});
        return adj;
    }

    /** All pairs the other way: one Dijkstra per node. Fine until a weight is negative. */
    static int[][] dijkstraAll(int n, int[][] edges) {
        List<int[]>[] adj = adjacency(n, edges);
        int[][] out = new int[n][];
        for (int start = 0; start < n; start++) {
            int[] best = new int[n];
            Arrays.fill(best, INF);
            best[start] = 0;
            boolean[] done = new boolean[n];
            // Keyed on (cost, node), so every translation pops in the same order.
            PriorityQueue<int[]> heap = new PriorityQueue<>(
                Comparator.<int[]>comparingInt(a -> a[0]).thenComparingInt(a -> a[1]));
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
            out[start] = best;
        }
        return out;
    }

    static void walk(List<int[]>[] adj, boolean[] seen, int[][] out, int start, int at, int cost) {
        seen[at] = true;
        for (int[] step : adj[at]) {
            if (!seen[step[0]]) {
                if (cost + step[1] < out[start][step[0]]) out[start][step[0]] = cost + step[1];
                walk(adj, seen, out, start, step[0], cost + step[1]);
            }
        }
        seen[at] = false;
    }

    /** The cheapest simple path between every pair. Exponential, and the definition. */
    static int[][] byWalking(int n, int[][] edges) {
        int[][] out = new int[n][n];
        for (int[] row : out) Arrays.fill(row, INF);
        for (int i = 0; i < n; i++) out[i][i] = 0;
        List<int[]>[] adj = adjacency(n, edges);
        for (int start = 0; start < n; start++) walk(adj, new boolean[n], out, start, start, 0);
        return out;
    }

    static void cycleWalk(List<int[]>[] adj, boolean[] seen, boolean[] bad, List<Integer> path,
                          int start, int at, int cost) {
        for (int[] step : adj[at]) {
            int nxt = step[0], w = step[1];
            if (nxt == start) {
                if (cost + w < 0) for (int p : path) bad[p] = true;
            } else if (!seen[nxt] && nxt > start) {
                seen[nxt] = true;
                path.add(nxt);
                cycleWalk(adj, seen, bad, path, start, nxt, cost + w);
                path.remove(path.size() - 1);
                seen[nxt] = false;
            }
        }
    }

    /**
     * Every node that lies on a simple cycle whose weights sum below zero.
     *
     * <p>Enumerated directly from the definition, so the diagonal test has something
     * independent to be scored against.
     */
    static boolean[] cycleNodes(int n, int[][] edges) {
        List<int[]>[] adj = adjacency(n, edges);
        boolean[] bad = new boolean[n];
        for (int start = 0; start < n; start++) {
            boolean[] seen = new boolean[n];
            seen[start] = true;
            List<Integer> path = new ArrayList<>();
            path.add(start);
            cycleWalk(adj, seen, bad, path, start, start, 0);
        }
        return bad;
    }

    /** Everything the given nodes can get to, following edges forwards. */
    static boolean[] reaches(int n, int[][] edges, boolean[] sources) {
        List<int[]>[] adj = adjacency(n, edges);
        boolean[] seen = new boolean[n];
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < n; i++)
            if (sources[i]) {
                seen[i] = true;
                stack.push(i);
            }
        while (!stack.isEmpty()) {
            int at = stack.pop();
            for (int[] step : adj[at])
                if (!seen[step[0]]) {
                    seen[step[0]] = true;
                    stack.push(step[0]);
                }
        }
        return seen;
    }

    /**
     * Nodes sitting on a closed walk that costs less than nothing.
     *
     * <p>Not the same set as "on a negative cycle": a node that can reach a paying
     * cycle and get back is on such a walk too, without being on the cycle
     * itself. The diagonal turns out to sit between the two.
     */
    static boolean[] loopingNodes(int n, int[][] edges) {
        boolean[] bad = cycleNodes(n, edges);
        boolean[] out = new boolean[n];
        if (!any(bad)) return out;
        boolean[][] forwardTo = new boolean[n][];
        for (int i = 0; i < n; i++) {
            boolean[] one = new boolean[n];
            one[i] = true;
            forwardTo[i] = reaches(n, edges, one);
        }
        for (int i = 0; i < n; i++)
            for (int c = 0; c < n; c++)
                if (bad[c] && forwardTo[i][c] && forwardTo[c][i]) {
                    out[i] = true;
                    break;
                }
        return out;
    }

    /** The free test: which nodes come back with a negative distance to themselves. */
    static boolean[] diagonalNegative(int n, int[][] edges) {
        int[][] d = floyd(n, edges);
        boolean[] out = new boolean[n];
        for (int i = 0; i < n; i++) out[i] = d[i][i] < 0;
        return out;
    }

    static boolean any(boolean[] s) {
        for (boolean x : s) if (x) return true;
        return false;
    }

    static boolean subset(boolean[] a, boolean[] b) {
        for (int i = 0; i < a.length; i++) if (a[i] && !b[i]) return false;
        return true;
    }

    static boolean strictSubset(boolean[] a, boolean[] b) {
        return subset(a, b) && !subset(b, a);
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
            sb.append(edges[i][0]).append("->").append(edges[i][1]).append(":").append(edges[i][2]);
        }
        return sb.append("]").toString();
    }

    // The same linear congruential generator in every language, so the random
    // graphs below are the same graphs whichever translation is run.
    static long seed = 20250907L;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    public static void main(String[] args) {
        int[] caseN = {3, 3, 4};
        int[][][] caseEdges = {
            {{0, 1, 4}, {0, 2, 1}, {2, 1, 1}},
            {{0, 1, 1}, {0, 2, 2}, {2, 1, -2}},
            {{0, 1, 3}, {1, 2, -2}, {2, 3, 1}, {0, 3, 4}},
        };

        System.out.printf("%-40s %-18s %s%n", "edges", "Floyd, row 0", "n Dijkstras, row 0");
        for (int c = 0; c < caseN.length; c++) {
            System.out.printf("%-40s %-18s %s%n", label(caseEdges[c]),
                show(floyd(caseN[c], caseEdges[c])[0]),
                show(dijkstraAll(caseN[c], caseEdges[c])[0]));
        }

        int trials = 3000;
        int kept = 0, floydOk = 0, dijOk = 0, dijHigh = 0, existsOk = 0, anyCycle = 0;
        int aboveCycle = 0, belowWalk = 0, biggerThanCycle = 0, smallerThanWalk = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(4);
            List<int[]> built = new ArrayList<>();
            for (int u = 0; u < n; u++)
                for (int v = 0; v < n; v++)
                    if (u != v && rand(3) == 0) built.add(new int[] {u, v, rand(9) - 3});
            int[][] edges = built.toArray(new int[0][]);
            boolean[] onCycle = cycleNodes(n, edges);
            boolean[] looping = loopingNodes(n, edges);
            boolean[] diagonal = diagonalNegative(n, edges);
            if (any(diagonal) == any(onCycle)) existsOk++;
            if (any(onCycle)) {
                anyCycle++;
                if (subset(onCycle, diagonal)) aboveCycle++;
                if (subset(diagonal, looping)) belowWalk++;
                if (strictSubset(onCycle, diagonal)) biggerThanCycle++;
                if (strictSubset(diagonal, looping)) smallerThanWalk++;
                continue;
            }
            kept++;
            int[][] truth = byWalking(n, edges);
            int[][] a = floyd(n, edges);
            int[][] b = dijkstraAll(n, edges);
            if (Arrays.deepEquals(a, truth)) floydOk++;
            if (Arrays.deepEquals(b, truth)) dijOk++;
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++) if (b[i][j] > truth[i][j]) dijHigh++;
        }

        System.out.println();
        System.out.println("over " + trials + " random graphs with weights from -3 to 5:");
        System.out.printf("  graphs with no negative cycle, scored      %6d%n", kept);
        System.out.printf("  Floyd-Warshall matched every simple path   %6d%n", floydOk);
        System.out.printf("  n Dijkstras matched it                     %6d%n", dijOk);
        System.out.printf("  entries Dijkstra reported too high         %6d%n", dijHigh);
        System.out.println();
        System.out.printf("  graphs holding a negative cycle            %6d%n", anyCycle);
        System.out.printf("  \\"some d[i][i] < 0\\" answered yes or no     %6d of %d%n", existsOk, trials);
        System.out.println("  the negative diagonals held every node");
        System.out.printf("    that is on a negative cycle              %6d of %d%n", aboveCycle, anyCycle);
        System.out.printf("    and held more than those                 %6d%n", biggerThanCycle);
        System.out.println("  every negative diagonal was on a negative");
        System.out.printf("    closed walk                              %6d of %d%n", belowWalk, anyCycle);
        System.out.printf("    and some such nodes were missed          %6d%n", smallerThanWalk);
        System.out.println();
        System.out.println("Row two of the table is the smallest disagreement: Dijkstra settles node");
        System.out.println("1 at 1 and never looks again, so it misses the route through the -2 edge.");
        System.out.println("Floyd-Warshall settles nothing and finds 0. Over the random graphs that");
        System.out.println("cost Dijkstra " + dijHigh + " entries, always too high, never too low.");
        System.out.println();
        System.out.println("The diagonal answers one question exactly and another one only roughly.");
        System.out.println("Does the graph hold a negative cycle -- yes or no -- was right on all");
        System.out.println(trials + " graphs. Which nodes is the folklore, and it matches neither natural");
        System.out.println("definition: the negative diagonals strictly contained the nodes on a");
        System.out.println("negative cycle on " + biggerThanCycle + " graphs, and were strictly contained in the nodes on");
        System.out.println("a negative closed walk on " + smallerThanWalk + ". So use the diagonal for the yes-or-no. To");
        System.out.println("name the nodes with no shortest distance, run Bellman-Ford and search");
        System.out.println("forward from the edges that were still improving.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// What the grid buys: negative edges, and a negative cycle named on the diagonal.
//
// Floyd-Warshall is not just "all pairs at once". Running Dijkstra from every
// node also gives all pairs, in less time on a sparse graph. The difference is
// what each one is allowed to be given. Dijkstra needs non-negative weights;
// Floyd-Warshall never settles anything, so it does not.
//
// And the negative-cycle test comes free and reads strangely: after the run,
// d[i][i] < 0 means there is a route from i back to i that costs less than
// nothing. Whether that is the same as "i is on a negative cycle" is the
// folklore, and the numbers at the bottom say it is not.
#include <array>
#include <functional>
#include <iomanip>
#include <iostream>
#include <queue>
#include <string>
#include <utility>
#include <vector>

const int INF = 1000000000;

using Edge = std::array<int, 3>;
using Grid = std::vector<std::vector<int>>;
using Adj = std::vector<std::vector<std::pair<int, int>>>;

Grid matrix(int n, const std::vector<Edge>& edges) {
    Grid d(n, std::vector<int>(n, INF));
    for (int i = 0; i < n; i++) d[i][i] = 0;
    for (const Edge& e : edges)
        if (e[2] < d[e[0]][e[1]]) d[e[0]][e[1]] = e[2];
    return d;
}

Grid floyd(int n, const std::vector<Edge>& edges) {
    Grid d = matrix(n, edges);
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (d[i][k] < INF && d[k][j] < INF && d[i][k] + d[k][j] < d[i][j])
                    d[i][j] = d[i][k] + d[k][j];
    return d;
}

Adj adjacency(int n, const std::vector<Edge>& edges) {
    Adj adj(n);
    for (const Edge& e : edges) adj[e[0]].push_back({e[1], e[2]});
    return adj;
}

// All pairs the other way: one Dijkstra per node. Fine until a weight is negative.
Grid dijkstra_all(int n, const std::vector<Edge>& edges) {
    Adj adj = adjacency(n, edges);
    Grid out;
    for (int start = 0; start < n; start++) {
        std::vector<int> best(n, INF);
        best[start] = 0;
        std::vector<bool> done(n, false);
        // Keyed on (cost, node), so every translation pops in the same order.
        using Item = std::pair<int, int>;
        std::priority_queue<Item, std::vector<Item>, std::greater<Item>> heap;
        heap.push({0, start});
        while (!heap.empty()) {
            Item top = heap.top();
            heap.pop();
            int cost = top.first, at = top.second;
            if (done[at]) continue;
            done[at] = true;
            for (const auto& step : adj[at]) {
                if (!done[step.first] && cost + step.second < best[step.first]) {
                    best[step.first] = cost + step.second;
                    heap.push({cost + step.second, step.first});
                }
            }
        }
        out.push_back(best);
    }
    return out;
}

void walk(const Adj& adj, std::vector<bool>& seen, Grid& out, int start, int at, int cost) {
    seen[at] = true;
    for (const auto& step : adj[at]) {
        if (!seen[step.first]) {
            if (cost + step.second < out[start][step.first])
                out[start][step.first] = cost + step.second;
            walk(adj, seen, out, start, step.first, cost + step.second);
        }
    }
    seen[at] = false;
}

// The cheapest simple path between every pair. Exponential, and the definition.
Grid by_walking(int n, const std::vector<Edge>& edges) {
    Grid out(n, std::vector<int>(n, INF));
    for (int i = 0; i < n; i++) out[i][i] = 0;
    Adj adj = adjacency(n, edges);
    for (int start = 0; start < n; start++) {
        std::vector<bool> seen(n, false);
        walk(adj, seen, out, start, start, 0);
    }
    return out;
}

void cycle_walk(const Adj& adj, std::vector<bool>& seen, std::vector<bool>& bad,
                std::vector<int>& path, int start, int at, int cost) {
    for (const auto& step : adj[at]) {
        int nxt = step.first, w = step.second;
        if (nxt == start) {
            if (cost + w < 0)
                for (int p : path) bad[p] = true;
        } else if (!seen[nxt] && nxt > start) {
            seen[nxt] = true;
            path.push_back(nxt);
            cycle_walk(adj, seen, bad, path, start, nxt, cost + w);
            path.pop_back();
            seen[nxt] = false;
        }
    }
}

// Every node that lies on a simple cycle whose weights sum below zero.
//
// Enumerated directly from the definition, so the diagonal test has something
// independent to be scored against.
std::vector<bool> cycle_nodes(int n, const std::vector<Edge>& edges) {
    Adj adj = adjacency(n, edges);
    std::vector<bool> bad(n, false);
    for (int start = 0; start < n; start++) {
        std::vector<bool> seen(n, false);
        seen[start] = true;
        std::vector<int> path = {start};
        cycle_walk(adj, seen, bad, path, start, start, 0);
    }
    return bad;
}

// Everything the given nodes can get to, following edges forwards.
std::vector<bool> reaches(int n, const std::vector<Edge>& edges,
                          const std::vector<bool>& sources) {
    Adj adj = adjacency(n, edges);
    std::vector<bool> seen(n, false);
    std::vector<int> stack;
    for (int i = 0; i < n; i++)
        if (sources[i]) {
            seen[i] = true;
            stack.push_back(i);
        }
    while (!stack.empty()) {
        int at = stack.back();
        stack.pop_back();
        for (const auto& step : adj[at])
            if (!seen[step.first]) {
                seen[step.first] = true;
                stack.push_back(step.first);
            }
    }
    return seen;
}

bool any_of_set(const std::vector<bool>& s) {
    for (bool x : s)
        if (x) return true;
    return false;
}

bool subset(const std::vector<bool>& a, const std::vector<bool>& b) {
    for (size_t i = 0; i < a.size(); i++)
        if (a[i] && !b[i]) return false;
    return true;
}

bool strict_subset(const std::vector<bool>& a, const std::vector<bool>& b) {
    return subset(a, b) && !subset(b, a);
}

// Nodes sitting on a closed walk that costs less than nothing.
//
// Not the same set as "on a negative cycle": a node that can reach a paying
// cycle and get back is on such a walk too, without being on the cycle
// itself. The diagonal turns out to sit between the two.
std::vector<bool> looping_nodes(int n, const std::vector<Edge>& edges) {
    std::vector<bool> bad = cycle_nodes(n, edges);
    std::vector<bool> out(n, false);
    if (!any_of_set(bad)) return out;
    std::vector<std::vector<bool>> forward_to;
    for (int i = 0; i < n; i++) {
        std::vector<bool> one(n, false);
        one[i] = true;
        forward_to.push_back(reaches(n, edges, one));
    }
    for (int i = 0; i < n; i++)
        for (int c = 0; c < n; c++)
            if (bad[c] && forward_to[i][c] && forward_to[c][i]) {
                out[i] = true;
                break;
            }
    return out;
}

// The free test: which nodes come back with a negative distance to themselves.
std::vector<bool> diagonal_negative(int n, const std::vector<Edge>& edges) {
    Grid d = floyd(n, edges);
    std::vector<bool> out(n, false);
    for (int i = 0; i < n; i++) out[i] = d[i][i] < 0;
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
        s += std::to_string(edges[i][0]) + "->" + std::to_string(edges[i][1]) +
             ":" + std::to_string(edges[i][2]);
    }
    return s + "]";
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
long long seed = 20250907;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

int main() {
    std::vector<int> case_n = {3, 3, 4};
    std::vector<std::vector<Edge>> cases = {
        {{0, 1, 4}, {0, 2, 1}, {2, 1, 1}},
        {{0, 1, 1}, {0, 2, 2}, {2, 1, -2}},
        {{0, 1, 3}, {1, 2, -2}, {2, 3, 1}, {0, 3, 4}},
    };

    std::cout << std::left << std::setw(40) << "edges" << " " << std::setw(18)
              << "Floyd, row 0" << " " << "n Dijkstras, row 0" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        std::cout << std::left << std::setw(40) << label(cases[c]) << " " << std::setw(18)
                  << show(floyd(case_n[c], cases[c])[0]) << " "
                  << show(dijkstra_all(case_n[c], cases[c])[0]) << "\\n";
    }

    int trials = 3000;
    int kept = 0, floyd_ok = 0, dij_ok = 0, dij_high = 0, exists_ok = 0, any_cycle = 0;
    int above_cycle = 0, below_walk = 0, bigger_than_cycle = 0, smaller_than_walk = 0;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(4);
        std::vector<Edge> edges;
        for (int u = 0; u < n; u++)
            for (int v = 0; v < n; v++)
                if (u != v && rand_below(3) == 0)
                    edges.push_back({u, v, rand_below(9) - 3});
        std::vector<bool> on_cycle = cycle_nodes(n, edges);
        std::vector<bool> looping = looping_nodes(n, edges);
        std::vector<bool> diagonal = diagonal_negative(n, edges);
        if (any_of_set(diagonal) == any_of_set(on_cycle)) exists_ok++;
        if (any_of_set(on_cycle)) {
            any_cycle++;
            if (subset(on_cycle, diagonal)) above_cycle++;
            if (subset(diagonal, looping)) below_walk++;
            if (strict_subset(on_cycle, diagonal)) bigger_than_cycle++;
            if (strict_subset(diagonal, looping)) smaller_than_walk++;
            continue;
        }
        kept++;
        Grid truth = by_walking(n, edges);
        Grid a = floyd(n, edges);
        Grid b = dijkstra_all(n, edges);
        if (a == truth) floyd_ok++;
        if (b == truth) dij_ok++;
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (b[i][j] > truth[i][j]) dij_high++;
    }

    std::cout << "\\n";
    std::cout << "over " << trials << " random graphs with weights from -3 to 5:\\n";
    std::cout << std::right;
    std::cout << "  graphs with no negative cycle, scored      " << std::setw(6) << kept << "\\n";
    std::cout << "  Floyd-Warshall matched every simple path   " << std::setw(6) << floyd_ok << "\\n";
    std::cout << "  n Dijkstras matched it                     " << std::setw(6) << dij_ok << "\\n";
    std::cout << "  entries Dijkstra reported too high         " << std::setw(6) << dij_high << "\\n";
    std::cout << "\\n";
    std::cout << "  graphs holding a negative cycle            " << std::setw(6) << any_cycle << "\\n";
    std::cout << "  \\"some d[i][i] < 0\\" answered yes or no     " << std::setw(6) << exists_ok
              << " of " << trials << "\\n";
    std::cout << "  the negative diagonals held every node\\n";
    std::cout << "    that is on a negative cycle              " << std::setw(6) << above_cycle
              << " of " << any_cycle << "\\n";
    std::cout << "    and held more than those                 " << std::setw(6) << bigger_than_cycle << "\\n";
    std::cout << "  every negative diagonal was on a negative\\n";
    std::cout << "    closed walk                              " << std::setw(6) << below_walk
              << " of " << any_cycle << "\\n";
    std::cout << "    and some such nodes were missed          " << std::setw(6) << smaller_than_walk << "\\n";
    std::cout << "\\n";
    std::cout << "Row two of the table is the smallest disagreement: Dijkstra settles node\\n";
    std::cout << "1 at 1 and never looks again, so it misses the route through the -2 edge.\\n";
    std::cout << "Floyd-Warshall settles nothing and finds 0. Over the random graphs that\\n";
    std::cout << "cost Dijkstra " << dij_high << " entries, always too high, never too low.\\n";
    std::cout << "\\n";
    std::cout << "The diagonal answers one question exactly and another one only roughly.\\n";
    std::cout << "Does the graph hold a negative cycle -- yes or no -- was right on all\\n";
    std::cout << trials << " graphs. Which nodes is the folklore, and it matches neither natural\\n";
    std::cout << "definition: the negative diagonals strictly contained the nodes on a\\n";
    std::cout << "negative cycle on " << bigger_than_cycle
              << " graphs, and were strictly contained in the nodes on\\n";
    std::cout << "a negative closed walk on " << smaller_than_walk
              << ". So use the diagonal for the yes-or-no. To\\n";
    std::cout << "name the nodes with no shortest distance, run Bellman-Ford and search\\n";
    std::cout << "forward from the edges that were still improving.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// What the grid buys: negative edges, and a negative cycle named on the diagonal.
//
// Floyd-Warshall is not just "all pairs at once". Running Dijkstra from every
// node also gives all pairs, in less time on a sparse graph. The difference is
// what each one is allowed to be given. Dijkstra needs non-negative weights;
// Floyd-Warshall never settles anything, so it does not.
//
// And the negative-cycle test comes free and reads strangely: after the run,
// d[i][i] < 0 means there is a route from i back to i that costs less than
// nothing. Whether that is the same as "i is on a negative cycle" is the
// folklore, and the numbers at the bottom say it is not.
use std::cmp::Reverse;
use std::collections::BinaryHeap;

const INF: i64 = 1_000_000_000;

type Edge = (usize, usize, i64);
type Grid = Vec<Vec<i64>>;
type Adj = Vec<Vec<(usize, i64)>>;

fn matrix(n: usize, edges: &[Edge]) -> Grid {
    let mut d = vec![vec![INF; n]; n];
    for i in 0..n {
        d[i][i] = 0;
    }
    for &(u, v, w) in edges {
        if w < d[u][v] {
            d[u][v] = w;
        }
    }
    d
}

fn floyd(n: usize, edges: &[Edge]) -> Grid {
    let mut d = matrix(n, edges);
    for k in 0..n {
        for i in 0..n {
            for j in 0..n {
                if d[i][k] < INF && d[k][j] < INF && d[i][k] + d[k][j] < d[i][j] {
                    d[i][j] = d[i][k] + d[k][j];
                }
            }
        }
    }
    d
}

fn adjacency(n: usize, edges: &[Edge]) -> Adj {
    let mut adj: Adj = vec![Vec::new(); n];
    for &(u, v, w) in edges {
        adj[u].push((v, w));
    }
    adj
}

/// All pairs the other way: one Dijkstra per node. Fine until a weight is negative.
fn dijkstra_all(n: usize, edges: &[Edge]) -> Grid {
    let adj = adjacency(n, edges);
    let mut out = Vec::new();
    for start in 0..n {
        let mut best = vec![INF; n];
        best[start] = 0;
        let mut done = vec![false; n];
        // Keyed on (cost, node), so every translation pops in the same order.
        let mut heap = BinaryHeap::new();
        heap.push(Reverse((0i64, start)));
        while let Some(Reverse((cost, at))) = heap.pop() {
            if done[at] {
                continue;
            }
            done[at] = true;
            for &(nxt, w) in &adj[at] {
                if !done[nxt] && cost + w < best[nxt] {
                    best[nxt] = cost + w;
                    heap.push(Reverse((cost + w, nxt)));
                }
            }
        }
        out.push(best);
    }
    out
}

fn walk(adj: &Adj, seen: &mut [bool], out: &mut Grid, start: usize, at: usize, cost: i64) {
    seen[at] = true;
    for &(nxt, w) in &adj[at] {
        if !seen[nxt] {
            if cost + w < out[start][nxt] {
                out[start][nxt] = cost + w;
            }
            walk(adj, seen, out, start, nxt, cost + w);
        }
    }
    seen[at] = false;
}

/// The cheapest simple path between every pair. Exponential, and the definition.
fn by_walking(n: usize, edges: &[Edge]) -> Grid {
    let mut out = vec![vec![INF; n]; n];
    for i in 0..n {
        out[i][i] = 0;
    }
    let adj = adjacency(n, edges);
    for start in 0..n {
        let mut seen = vec![false; n];
        walk(&adj, &mut seen, &mut out, start, start, 0);
    }
    out
}

fn cycle_walk(
    adj: &Adj,
    seen: &mut [bool],
    bad: &mut [bool],
    path: &mut Vec<usize>,
    start: usize,
    at: usize,
    cost: i64,
) {
    for idx in 0..adj[at].len() {
        let (nxt, w) = adj[at][idx];
        if nxt == start {
            if cost + w < 0 {
                for &p in path.iter() {
                    bad[p] = true;
                }
            }
        } else if !seen[nxt] && nxt > start {
            seen[nxt] = true;
            path.push(nxt);
            cycle_walk(adj, seen, bad, path, start, nxt, cost + w);
            path.pop();
            seen[nxt] = false;
        }
    }
}

/// Every node that lies on a simple cycle whose weights sum below zero.
///
/// Enumerated directly from the definition, so the diagonal test has something
/// independent to be scored against.
fn cycle_nodes(n: usize, edges: &[Edge]) -> Vec<bool> {
    let adj = adjacency(n, edges);
    let mut bad = vec![false; n];
    for start in 0..n {
        let mut seen = vec![false; n];
        seen[start] = true;
        let mut path = vec![start];
        cycle_walk(&adj, &mut seen, &mut bad, &mut path, start, start, 0);
    }
    bad
}

/// Everything the given nodes can get to, following edges forwards.
fn reaches(n: usize, edges: &[Edge], sources: &[bool]) -> Vec<bool> {
    let adj = adjacency(n, edges);
    let mut seen = vec![false; n];
    let mut stack = Vec::new();
    for i in 0..n {
        if sources[i] {
            seen[i] = true;
            stack.push(i);
        }
    }
    while let Some(at) = stack.pop() {
        for &(nxt, _) in &adj[at] {
            if !seen[nxt] {
                seen[nxt] = true;
                stack.push(nxt);
            }
        }
    }
    seen
}

fn any_set(s: &[bool]) -> bool {
    s.iter().any(|&x| x)
}

fn subset(a: &[bool], b: &[bool]) -> bool {
    a.iter().zip(b.iter()).all(|(&x, &y)| !x || y)
}

fn strict_subset(a: &[bool], b: &[bool]) -> bool {
    subset(a, b) && !subset(b, a)
}

/// Nodes sitting on a closed walk that costs less than nothing.
///
/// Not the same set as "on a negative cycle": a node that can reach a paying
/// cycle and get back is on such a walk too, without being on the cycle
/// itself. The diagonal turns out to sit between the two.
fn looping_nodes(n: usize, edges: &[Edge]) -> Vec<bool> {
    let bad = cycle_nodes(n, edges);
    let mut out = vec![false; n];
    if !any_set(&bad) {
        return out;
    }
    let mut forward_to = Vec::new();
    for i in 0..n {
        let mut one = vec![false; n];
        one[i] = true;
        forward_to.push(reaches(n, edges, &one));
    }
    for i in 0..n {
        for c in 0..n {
            if bad[c] && forward_to[i][c] && forward_to[c][i] {
                out[i] = true;
                break;
            }
        }
    }
    out
}

/// The free test: which nodes come back with a negative distance to themselves.
fn diagonal_negative(n: usize, edges: &[Edge]) -> Vec<bool> {
    let d = floyd(n, edges);
    (0..n).map(|i| d[i][i] < 0).collect()
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
        .map(|&(u, v, w)| format!("{}->{}:{}", u, v, w))
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
    let case_n = [3usize, 3, 4];
    let cases: Vec<Vec<Edge>> = vec![
        vec![(0, 1, 4), (0, 2, 1), (2, 1, 1)],
        vec![(0, 1, 1), (0, 2, 2), (2, 1, -2)],
        vec![(0, 1, 3), (1, 2, -2), (2, 3, 1), (0, 3, 4)],
    ];

    println!("{:<40} {:<18} {}", "edges", "Floyd, row 0", "n Dijkstras, row 0");
    for c in 0..cases.len() {
        println!(
            "{:<40} {:<18} {}",
            label(&cases[c]),
            show(&floyd(case_n[c], &cases[c])[0]),
            show(&dijkstra_all(case_n[c], &cases[c])[0])
        );
    }

    let mut rng = Rng { seed: 20250907 };
    let trials = 3000;
    let (mut kept, mut floyd_ok, mut dij_ok, mut dij_high) = (0, 0, 0, 0);
    let (mut exists_ok, mut any_cycle) = (0, 0);
    let (mut above_cycle, mut below_walk) = (0, 0);
    let (mut bigger_than_cycle, mut smaller_than_walk) = (0, 0);
    for _ in 0..trials {
        let n = 2 + rng.next(4) as usize;
        let mut edges: Vec<Edge> = Vec::new();
        for u in 0..n {
            for v in 0..n {
                if u != v && rng.next(3) == 0 {
                    edges.push((u, v, rng.next(9) - 3));
                }
            }
        }
        let on_cycle = cycle_nodes(n, &edges);
        let looping = looping_nodes(n, &edges);
        let diagonal = diagonal_negative(n, &edges);
        if any_set(&diagonal) == any_set(&on_cycle) {
            exists_ok += 1;
        }
        if any_set(&on_cycle) {
            any_cycle += 1;
            if subset(&on_cycle, &diagonal) {
                above_cycle += 1;
            }
            if subset(&diagonal, &looping) {
                below_walk += 1;
            }
            if strict_subset(&on_cycle, &diagonal) {
                bigger_than_cycle += 1;
            }
            if strict_subset(&diagonal, &looping) {
                smaller_than_walk += 1;
            }
            continue;
        }
        kept += 1;
        let truth = by_walking(n, &edges);
        let a = floyd(n, &edges);
        let b = dijkstra_all(n, &edges);
        if a == truth {
            floyd_ok += 1;
        }
        if b == truth {
            dij_ok += 1;
        }
        for i in 0..n {
            for j in 0..n {
                if b[i][j] > truth[i][j] {
                    dij_high += 1;
                }
            }
        }
    }

    println!();
    println!("over {} random graphs with weights from -3 to 5:", trials);
    println!("  graphs with no negative cycle, scored      {:>6}", kept);
    println!("  Floyd-Warshall matched every simple path   {:>6}", floyd_ok);
    println!("  n Dijkstras matched it                     {:>6}", dij_ok);
    println!("  entries Dijkstra reported too high         {:>6}", dij_high);
    println!();
    println!("  graphs holding a negative cycle            {:>6}", any_cycle);
    println!(
        "  \\"some d[i][i] < 0\\" answered yes or no     {:>6} of {}",
        exists_ok, trials
    );
    println!("  the negative diagonals held every node");
    println!(
        "    that is on a negative cycle              {:>6} of {}",
        above_cycle, any_cycle
    );
    println!("    and held more than those                 {:>6}", bigger_than_cycle);
    println!("  every negative diagonal was on a negative");
    println!(
        "    closed walk                              {:>6} of {}",
        below_walk, any_cycle
    );
    println!("    and some such nodes were missed          {:>6}", smaller_than_walk);
    println!();
    println!("Row two of the table is the smallest disagreement: Dijkstra settles node");
    println!("1 at 1 and never looks again, so it misses the route through the -2 edge.");
    println!("Floyd-Warshall settles nothing and finds 0. Over the random graphs that");
    println!("cost Dijkstra {} entries, always too high, never too low.", dij_high);
    println!();
    println!("The diagonal answers one question exactly and another one only roughly.");
    println!("Does the graph hold a negative cycle -- yes or no -- was right on all");
    println!("{} graphs. Which nodes is the folklore, and it matches neither natural", trials);
    println!("definition: the negative diagonals strictly contained the nodes on a");
    println!(
        "negative cycle on {} graphs, and were strictly contained in the nodes on",
        bigger_than_cycle
    );
    println!(
        "a negative closed walk on {}. So use the diagonal for the yes-or-no. To",
        smaller_than_walk
    );
    println!("name the nodes with no shortest distance, run Bellman-Ford and search");
    println!("forward from the edges that were still improving.");
}
`,
            },
            {
              lang: "go",
              code: `// What the grid buys: negative edges, and a negative cycle named on the diagonal.
//
// Floyd-Warshall is not just "all pairs at once". Running Dijkstra from every
// node also gives all pairs, in less time on a sparse graph. The difference is
// what each one is allowed to be given. Dijkstra needs non-negative weights;
// Floyd-Warshall never settles anything, so it does not.
//
// And the negative-cycle test comes free and reads strangely: after the run,
// d[i][i] < 0 means there is a route from i back to i that costs less than
// nothing. Whether that is the same as "i is on a negative cycle" is the
// folklore, and the numbers at the bottom say it is not.
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

func matrix(n int, edges []Edge) [][]int {
	d := make([][]int, n)
	for i := range d {
		d[i] = make([]int, n)
		for j := range d[i] {
			d[i][j] = INF
		}
		d[i][i] = 0
	}
	for _, e := range edges {
		if e.W < d[e.U][e.V] {
			d[e.U][e.V] = e.W
		}
	}
	return d
}

func floyd(n int, edges []Edge) [][]int {
	d := matrix(n, edges)
	for k := 0; k < n; k++ {
		for i := 0; i < n; i++ {
			for j := 0; j < n; j++ {
				if d[i][k] < INF && d[k][j] < INF && d[i][k]+d[k][j] < d[i][j] {
					d[i][j] = d[i][k] + d[k][j]
				}
			}
		}
	}
	return d
}

func adjacency(n int, edges []Edge) [][][2]int {
	adj := make([][][2]int, n)
	for _, e := range edges {
		adj[e.U] = append(adj[e.U], [2]int{e.V, e.W})
	}
	return adj
}

// heap is a binary heap keyed on (cost, node), so every translation pops in
// the same order and the measurements below are the same measurements.
type heap struct {
	items [][2]int
}

func (h *heap) before(a, b [2]int) bool {
	if a[0] != b[0] {
		return a[0] < b[0]
	}
	return a[1] < b[1]
}

func (h *heap) push(item [2]int) {
	h.items = append(h.items, item)
	i := len(h.items) - 1
	for i > 0 {
		parent := (i - 1) / 2
		if !h.before(h.items[i], h.items[parent]) {
			break
		}
		h.items[i], h.items[parent] = h.items[parent], h.items[i]
		i = parent
	}
}

func (h *heap) pop() [2]int {
	top := h.items[0]
	last := h.items[len(h.items)-1]
	h.items = h.items[:len(h.items)-1]
	if len(h.items) > 0 {
		h.items[0] = last
		i := 0
		for {
			best := i
			for _, c := range []int{2*i + 1, 2*i + 2} {
				if c < len(h.items) && h.before(h.items[c], h.items[best]) {
					best = c
				}
			}
			if best == i {
				break
			}
			h.items[i], h.items[best] = h.items[best], h.items[i]
			i = best
		}
	}
	return top
}

// dijkstraAll gives all pairs the other way: one Dijkstra per node. Fine until
// a weight is negative.
func dijkstraAll(n int, edges []Edge) [][]int {
	adj := adjacency(n, edges)
	out := make([][]int, 0, n)
	for start := 0; start < n; start++ {
		best := make([]int, n)
		for i := range best {
			best[i] = INF
		}
		best[start] = 0
		done := make([]bool, n)
		h := &heap{}
		h.push([2]int{0, start})
		for len(h.items) > 0 {
			top := h.pop()
			cost, at := top[0], top[1]
			if done[at] {
				continue
			}
			done[at] = true
			for _, step := range adj[at] {
				if !done[step[0]] && cost+step[1] < best[step[0]] {
					best[step[0]] = cost + step[1]
					h.push([2]int{cost + step[1], step[0]})
				}
			}
		}
		out = append(out, best)
	}
	return out
}

func walk(adj [][][2]int, seen []bool, out [][]int, start, at, cost int) {
	seen[at] = true
	for _, step := range adj[at] {
		if !seen[step[0]] {
			if cost+step[1] < out[start][step[0]] {
				out[start][step[0]] = cost + step[1]
			}
			walk(adj, seen, out, start, step[0], cost+step[1])
		}
	}
	seen[at] = false
}

// byWalking gives the cheapest simple path between every pair. Exponential,
// and the definition.
func byWalking(n int, edges []Edge) [][]int {
	out := make([][]int, n)
	for i := range out {
		out[i] = make([]int, n)
		for j := range out[i] {
			out[i][j] = INF
		}
		out[i][i] = 0
	}
	adj := adjacency(n, edges)
	for start := 0; start < n; start++ {
		walk(adj, make([]bool, n), out, start, start, 0)
	}
	return out
}

func cycleWalk(adj [][][2]int, seen, bad []bool, path *[]int, start, at, cost int) {
	for _, step := range adj[at] {
		nxt, w := step[0], step[1]
		if nxt == start {
			if cost+w < 0 {
				for _, p := range *path {
					bad[p] = true
				}
			}
		} else if !seen[nxt] && nxt > start {
			seen[nxt] = true
			*path = append(*path, nxt)
			cycleWalk(adj, seen, bad, path, start, nxt, cost+w)
			*path = (*path)[:len(*path)-1]
			seen[nxt] = false
		}
	}
}

// cycleNodes finds every node on a simple cycle whose weights sum below zero.
//
// Enumerated directly from the definition, so the diagonal test has something
// independent to be scored against.
func cycleNodes(n int, edges []Edge) []bool {
	adj := adjacency(n, edges)
	bad := make([]bool, n)
	for start := 0; start < n; start++ {
		seen := make([]bool, n)
		seen[start] = true
		path := []int{start}
		cycleWalk(adj, seen, bad, &path, start, start, 0)
	}
	return bad
}

// reaches gives everything the source nodes can get to, following edges forwards.
func reaches(n int, edges []Edge, sources []bool) []bool {
	adj := adjacency(n, edges)
	seen := make([]bool, n)
	var stack []int
	for i := 0; i < n; i++ {
		if sources[i] {
			seen[i] = true
			stack = append(stack, i)
		}
	}
	for len(stack) > 0 {
		at := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		for _, step := range adj[at] {
			if !seen[step[0]] {
				seen[step[0]] = true
				stack = append(stack, step[0])
			}
		}
	}
	return seen
}

func anySet(s []bool) bool {
	for _, x := range s {
		if x {
			return true
		}
	}
	return false
}

func subset(a, b []bool) bool {
	for i := range a {
		if a[i] && !b[i] {
			return false
		}
	}
	return true
}

func strictSubset(a, b []bool) bool {
	return subset(a, b) && !subset(b, a)
}

// loopingNodes finds the nodes sitting on a closed walk that costs less than nothing.
//
// Not the same set as "on a negative cycle": a node that can reach a paying
// cycle and get back is on such a walk too, without being on the cycle
// itself. The diagonal turns out to sit between the two.
func loopingNodes(n int, edges []Edge) []bool {
	bad := cycleNodes(n, edges)
	out := make([]bool, n)
	if !anySet(bad) {
		return out
	}
	forwardTo := make([][]bool, n)
	for i := 0; i < n; i++ {
		one := make([]bool, n)
		one[i] = true
		forwardTo[i] = reaches(n, edges, one)
	}
	for i := 0; i < n; i++ {
		for c := 0; c < n; c++ {
			if bad[c] && forwardTo[i][c] && forwardTo[c][i] {
				out[i] = true
				break
			}
		}
	}
	return out
}

// diagonalNegative is the free test: which nodes come back with a negative
// distance to themselves.
func diagonalNegative(n int, edges []Edge) []bool {
	d := floyd(n, edges)
	out := make([]bool, n)
	for i := 0; i < n; i++ {
		out[i] = d[i][i] < 0
	}
	return out
}

func same(a, b [][]int) bool {
	for i := range a {
		for j := range a[i] {
			if a[i][j] != b[i][j] {
				return false
			}
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
		cells[i] = fmt.Sprintf("%d->%d:%d", e.U, e.V, e.W)
	}
	return "[" + strings.Join(cells, ", ") + "]"
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
var seed int64 = 20250907

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	caseN := []int{3, 3, 4}
	cases := [][]Edge{
		{{0, 1, 4}, {0, 2, 1}, {2, 1, 1}},
		{{0, 1, 1}, {0, 2, 2}, {2, 1, -2}},
		{{0, 1, 3}, {1, 2, -2}, {2, 3, 1}, {0, 3, 4}},
	}

	fmt.Printf("%-40s %-18s %s\\n", "edges", "Floyd, row 0", "n Dijkstras, row 0")
	for c := range cases {
		fmt.Printf("%-40s %-18s %s\\n", label(cases[c]),
			show(floyd(caseN[c], cases[c])[0]), show(dijkstraAll(caseN[c], cases[c])[0]))
	}

	trials := 3000
	kept, floydOk, dijOk, dijHigh := 0, 0, 0, 0
	existsOk, anyCycle := 0, 0
	aboveCycle, belowWalk, biggerThanCycle, smallerThanWalk := 0, 0, 0, 0
	for t := 0; t < trials; t++ {
		n := 2 + randBelow(4)
		var edges []Edge
		for u := 0; u < n; u++ {
			for v := 0; v < n; v++ {
				if u != v && randBelow(3) == 0 {
					edges = append(edges, Edge{u, v, randBelow(9) - 3})
				}
			}
		}
		onCycle := cycleNodes(n, edges)
		looping := loopingNodes(n, edges)
		diagonal := diagonalNegative(n, edges)
		if anySet(diagonal) == anySet(onCycle) {
			existsOk++
		}
		if anySet(onCycle) {
			anyCycle++
			if subset(onCycle, diagonal) {
				aboveCycle++
			}
			if subset(diagonal, looping) {
				belowWalk++
			}
			if strictSubset(onCycle, diagonal) {
				biggerThanCycle++
			}
			if strictSubset(diagonal, looping) {
				smallerThanWalk++
			}
			continue
		}
		kept++
		truth := byWalking(n, edges)
		a := floyd(n, edges)
		b := dijkstraAll(n, edges)
		if same(a, truth) {
			floydOk++
		}
		if same(b, truth) {
			dijOk++
		}
		for i := 0; i < n; i++ {
			for j := 0; j < n; j++ {
				if b[i][j] > truth[i][j] {
					dijHigh++
				}
			}
		}
	}

	fmt.Println()
	fmt.Printf("over %d random graphs with weights from -3 to 5:\\n", trials)
	fmt.Printf("  graphs with no negative cycle, scored      %6d\\n", kept)
	fmt.Printf("  Floyd-Warshall matched every simple path   %6d\\n", floydOk)
	fmt.Printf("  n Dijkstras matched it                     %6d\\n", dijOk)
	fmt.Printf("  entries Dijkstra reported too high         %6d\\n", dijHigh)
	fmt.Println()
	fmt.Printf("  graphs holding a negative cycle            %6d\\n", anyCycle)
	fmt.Printf("  \\"some d[i][i] < 0\\" answered yes or no     %6d of %d\\n", existsOk, trials)
	fmt.Println("  the negative diagonals held every node")
	fmt.Printf("    that is on a negative cycle              %6d of %d\\n", aboveCycle, anyCycle)
	fmt.Printf("    and held more than those                 %6d\\n", biggerThanCycle)
	fmt.Println("  every negative diagonal was on a negative")
	fmt.Printf("    closed walk                              %6d of %d\\n", belowWalk, anyCycle)
	fmt.Printf("    and some such nodes were missed          %6d\\n", smallerThanWalk)
	fmt.Println()
	fmt.Println("Row two of the table is the smallest disagreement: Dijkstra settles node")
	fmt.Println("1 at 1 and never looks again, so it misses the route through the -2 edge.")
	fmt.Println("Floyd-Warshall settles nothing and finds 0. Over the random graphs that")
	fmt.Printf("cost Dijkstra %d entries, always too high, never too low.\\n", dijHigh)
	fmt.Println()
	fmt.Println("The diagonal answers one question exactly and another one only roughly.")
	fmt.Println("Does the graph hold a negative cycle -- yes or no -- was right on all")
	fmt.Printf("%d graphs. Which nodes is the folklore, and it matches neither natural\\n", trials)
	fmt.Println("definition: the negative diagonals strictly contained the nodes on a")
	fmt.Printf("negative cycle on %d graphs, and were strictly contained in the nodes on\\n", biggerThanCycle)
	fmt.Printf("a negative closed walk on %d. So use the diagonal for the yes-or-no. To\\n", smallerThanWalk)
	fmt.Println("name the nodes with no shortest distance, run Bellman-Ford and search")
	fmt.Println("forward from the edges that were still improving.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Using Floyd-Warshall because the problem says \"all pairs\"",
          body: "All pairs is not the reason; n runs of the single-source algorithm give that too, and faster when the graph is sparse -- 131,072 steps against 16,777,216 on a ring of 256. The reasons are negative weights, density, and small n.",
        },
        {
          title: "Reading d[i][i] < 0 as \"node i is on a negative cycle\"",
          body: "It is an exact existence test and an inexact membership test. Against an enumeration of every simple negative cycle the diagonals contained those nodes but on 85 of 494 graphs contained strictly more; against every node on a negative closed walk they were contained but on 110 were strictly fewer. Use it for yes-or-no and get the affected set from Bellman-Ford.",
        },
        {
          title: "Forgetting the INF guard before adding",
          body: "d[i][k] + d[k][j] with both at a sentinel is two sentinels added together, which either overflows or produces a number small enough to look like a route. Guard both terms, or pick a sentinel that survives being doubled.",
        },
      ],
    },
    {
      id: "combine-and-better",
      heading: "Combine and better",
      body: [
        "Take the shortest-path meaning out of the three loops and what is left is a shape. For every `k`, for every `i`, for every `j`: *combine* the route `i\u2192k` with the route `k\u2192j`, and keep whichever is *better* \u2014 that or what `i\u2192j` already held. Combine and better are the only two operations the algorithm actually uses.",
        "Change the pair and the algorithm changes with it. Combine with `+` and take the `min`, and it is shortest paths. Combine with `and` and take the `or`, and it is reachability \u2014 the transitive closure, every pair connected by any route at all. Combine with `min` and take the `max`, and it is the widest path: the route whose narrowest edge is as wide as possible, which is the most a single route can carry.",
        "All three are the same loop nest with one line changed, and both of the new ones matched exhaustive walks on all 3,000 random graphs. The widest-path reading is worth keeping because it is not obvious that it works: shortest and widest disagree about which route to take, and the demo shows it \u2014 node 0 reaches node 2 through a 9 then a 3, or through a 4 then a 5. Shortest takes the first. Widest takes the second, because a route is only as wide as its narrowest edge.",
        "Which leaves the cost question, and it has a sharper answer than \"use Floyd-Warshall for all pairs\". The grid does `n\u00b3` steps regardless of shape. Running one search per node does not: on a ring of 256 nodes that is 131,072 steps against the grid's 16,777,216.",
        "On a dense graph the two columns are not merely close, they are **equal** \u2014 32,768 against 32,768 at `n = 32`, and so on up. The arithmetic says why: each of the `n` searches pops `n` nodes and scans the `n - 1` edges leaving each, which is `n\u00b3` on the nose. So the rule is: reach for the grid when the graph is dense, or small, or the weights are negative. Otherwise run the single-source algorithm `n` times.",
      ],
      examples: [
        {
          id: "combine-and-better",
          title: "Reachability and widest path from the same loop nest",
          lang: "python",
          code: `# The same three loops with a different pair of operators.
#
# Strip the shortest-path meaning out of Floyd-Warshall and what is left is a
# shape: for every k, for every i, for every j, combine the route i->k with the
# route k->j and keep the better of that and what i->j already had. "Combine"
# and "better" are the only two things the algorithm actually needs.
#
#   shortest path   combine = +      better = min
#   reachability    combine = and    better = or
#   bottleneck      combine = min    better = max
#
# Three algorithms, one loop nest. The third one is the useful surprise: the
# widest path is the route whose narrowest edge is as wide as possible -- the
# maximum flow a single route can carry -- and it falls straight out.
INF = 10 ** 9


def closure_floyd(n, edges):
    """Reachability. combine = and, better = or."""
    r = [[False] * n for _ in range(n)]
    for i in range(n):
        r[i][i] = True
    for u, v, _ in edges:
        r[u][v] = True
    steps = 0
    for k in range(n):
        for i in range(n):
            for j in range(n):
                steps += 1
                if r[i][k] and r[k][j]:
                    r[i][j] = True
    return r, steps


def closure_searches(n, edges):
    """The same answer by running one search per node, and the steps it costs."""
    adj = [[] for _ in range(n)]
    for u, v, _ in edges:
        adj[u].append(v)
    out = [[False] * n for _ in range(n)]
    steps = 0
    for start in range(n):
        out[start][start] = True
        stack = [start]
        while stack:
            at = stack.pop()
            steps += 1
            for nxt in adj[at]:
                steps += 1
                if not out[start][nxt]:
                    out[start][nxt] = True
                    stack.append(nxt)
    return out, steps


def widest_floyd(n, edges):
    """Bottleneck. combine = min, better = max: how wide can a single route be."""
    w = [[0] * n for _ in range(n)]
    for i in range(n):
        w[i][i] = INF
    for u, v, cap in edges:
        if cap > w[u][v]:
            w[u][v] = cap
    for k in range(n):
        for i in range(n):
            for j in range(n):
                through = w[i][k] if w[i][k] < w[k][j] else w[k][j]
                if through > w[i][j]:
                    w[i][j] = through
    return w


def reach_by_walking(n, edges):
    """Every pair connected by some simple path. The definition, walked out."""
    adj = [[] for _ in range(n)]
    for u, v, _ in edges:
        adj[u].append(v)
    out = [[False] * n for _ in range(n)]
    for start in range(n):
        out[start][start] = True
        seen = [False] * n

        def walk(at):
            seen[at] = True
            for nxt in adj[at]:
                if not seen[nxt]:
                    out[start][nxt] = True
                    walk(nxt)
            seen[at] = False

        walk(start)
    return out


def widest_by_walking(n, edges):
    """The widest simple path between every pair, found by walking every one."""
    out = [[0] * n for _ in range(n)]
    for i in range(n):
        out[i][i] = INF
    adj = [[] for _ in range(n)]
    for u, v, cap in edges:
        adj[u].append((v, cap))
    for start in range(n):
        seen = [False] * n

        def walk(at, narrowest):
            seen[at] = True
            for nxt, cap in adj[at]:
                if not seen[nxt]:
                    here = narrowest if narrowest < cap else cap
                    if here > out[start][nxt]:
                        out[start][nxt] = here
                    walk(nxt, here)
            seen[at] = False

        walk(start, INF)
    return out


def show_bool(row):
    return "".join("y" if x else "." for x in row)


def show_width(row):
    return "[" + ", ".join("*" if x >= INF else str(x) for x in row) + "]"


DEMO_N = 5
DEMO = [(0, 1, 9), (1, 2, 3), (0, 3, 4), (3, 2, 5), (2, 4, 8)]

print("capacities: " + ", ".join("%d->%d:%d" % e for e in DEMO))
print()
r, _ = closure_floyd(DEMO_N, DEMO)
w = widest_floyd(DEMO_N, DEMO)
print("%-6s %-10s %s" % ("from", "reaches", "widest route to each node"))
for i in range(DEMO_N):
    print("%-6d %-10s %s" % (i, show_bool(r[i]), show_width(w[i])))
print()
print("Node 0 reaches node 2 two ways: 9 then 3, or 4 then 5. Shortest path")
print("would take the first. Widest takes the second, because a route is only")
print("as wide as its narrowest edge -- 3 against 4.")

# The same linear congruential generator in every language, so the random
# graphs below are the same graphs whichever translation is run.
seed = 777


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


trials = 3000
closure_ok = widest_ok = 0
for _ in range(trials):
    n = 2 + rand(5)
    edges = []
    for u in range(n):
        for v in range(n):
            if u != v and rand(3) == 0:
                edges.append((u, v, 1 + rand(9)))
    got, _ = closure_floyd(n, edges)
    closure_ok += got == reach_by_walking(n, edges)
    widest_ok += widest_floyd(n, edges) == widest_by_walking(n, edges)

print()
print("over %d random graphs on up to 6 nodes:" % trials)
print("  the grid's reachability matched every walk  %6d" % closure_ok)
print("  the grid's widest route matched every walk  %6d" % widest_ok)

print()
print("and what the grid costs, against running one search per node:")
print("%-6s %-9s %12s %12s" % ("nodes", "shape", "grid steps", "n searches"))
for n in (32, 64, 128, 256):
    ring = [(v, (v + 1) % n, 1) for v in range(n)]
    dense = [(u, v, 1) for u in range(n) for v in range(n) if u != v]
    for name, edges in (("ring", ring), ("dense", dense)):
        _, grid = closure_floyd(n, edges)
        _, search = closure_searches(n, edges)
        print("%-6d %-9s %12d %12d" % (n, name, grid, search))

print()
print("The grid does not care what the graph looks like: n cubed either way. The")
print("searches do. On a ring they win by a factor that grows with n: at n = 256")
print("it is 131,072 steps against 16,777,216. On a dense graph the columns are")
print("not close, they are equal, and the reason is arithmetic: each of the n")
print("searches pops n nodes and scans the n-1 edges leaving each, which is n")
print("cubed on the nose.")
print("So the rule is not \\"Floyd-Warshall for all pairs\\". It is: reach for the")
print("grid when the graph is dense, or small, or the weights are negative --")
print("and otherwise run the single-source algorithm n times.")
`,
          output: `capacities: 0->1:9, 1->2:3, 0->3:4, 3->2:5, 2->4:8

from   reaches    widest route to each node
0      yyyyy      [*, 9, 4, 4, 4]
1      .yy.y      [0, *, 3, 0, 3]
2      ..y.y      [0, 0, *, 0, 8]
3      ..yyy      [0, 0, 5, *, 5]
4      ....y      [0, 0, 0, 0, *]

Node 0 reaches node 2 two ways: 9 then 3, or 4 then 5. Shortest path
would take the first. Widest takes the second, because a route is only
as wide as its narrowest edge -- 3 against 4.

over 3000 random graphs on up to 6 nodes:
  the grid's reachability matched every walk    3000
  the grid's widest route matched every walk    3000

and what the grid costs, against running one search per node:
nodes  shape       grid steps   n searches
32     ring             32768         2048
32     dense            32768        32768
64     ring            262144         8192
64     dense           262144       262144
128    ring           2097152        32768
128    dense          2097152      2097152
256    ring          16777216       131072
256    dense         16777216     16777216

The grid does not care what the graph looks like: n cubed either way. The
searches do. On a ring they win by a factor that grows with n: at n = 256
it is 131,072 steps against 16,777,216. On a dense graph the columns are
not close, they are equal, and the reason is arithmetic: each of the n
searches pops n nodes and scans the n-1 edges leaving each, which is n
cubed on the nose.
So the rule is not "Floyd-Warshall for all pairs". It is: reach for the
grid when the graph is dense, or small, or the weights are negative --
and otherwise run the single-source algorithm n times.`,
          explanation:
            "The same three loops with the operators swapped, both scored against exhaustive walks, and the step counts that say when the grid is worth reaching for.",
          alternates: [
            {
              lang: "javascript",
              code: `// The same three loops with a different pair of operators.
//
// Strip the shortest-path meaning out of Floyd-Warshall and what is left is a
// shape: for every k, for every i, for every j, combine the route i->k with the
// route k->j and keep the better of that and what i->j already had. "Combine"
// and "better" are the only two things the algorithm actually needs.
//
//   shortest path   combine = +      better = min
//   reachability    combine = and    better = or
//   bottleneck      combine = min    better = max
//
// Three algorithms, one loop nest. The third one is the useful surprise: the
// widest path is the route whose narrowest edge is as wide as possible -- the
// maximum flow a single route can carry -- and it falls straight out.
const INF = 10 ** 9;

// Reachability. combine = and, better = or.
function closureFloyd(n, edges) {
  const r = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let i = 0; i < n; i += 1) r[i][i] = true;
  for (const [u, v] of edges) r[u][v] = true;
  let steps = 0;
  for (let k = 0; k < n; k += 1)
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1) {
        steps += 1;
        if (r[i][k] && r[k][j]) r[i][j] = true;
      }
  return [r, steps];
}

// The same answer by running one search per node, and the steps it costs.
function closureSearches(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v);
  const out = Array.from({ length: n }, () => new Array(n).fill(false));
  let steps = 0;
  for (let start = 0; start < n; start += 1) {
    out[start][start] = true;
    const stack = [start];
    while (stack.length > 0) {
      const at = stack.pop();
      steps += 1;
      for (const nxt of adj[at]) {
        steps += 1;
        if (!out[start][nxt]) {
          out[start][nxt] = true;
          stack.push(nxt);
        }
      }
    }
  }
  return [out, steps];
}

// Bottleneck. combine = min, better = max: how wide can a single route be.
function widestFloyd(n, edges) {
  const w = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i += 1) w[i][i] = INF;
  for (const [u, v, cap] of edges) if (cap > w[u][v]) w[u][v] = cap;
  for (let k = 0; k < n; k += 1)
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1) {
        const through = w[i][k] < w[k][j] ? w[i][k] : w[k][j];
        if (through > w[i][j]) w[i][j] = through;
      }
  return w;
}

// Every pair connected by some simple path. The definition, walked out.
function reachByWalking(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v);
  const out = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let start = 0; start < n; start += 1) {
    out[start][start] = true;
    const seen = new Array(n).fill(false);
    const walk = (at) => {
      seen[at] = true;
      for (const nxt of adj[at]) {
        if (!seen[nxt]) {
          out[start][nxt] = true;
          walk(nxt);
        }
      }
      seen[at] = false;
    };
    walk(start);
  }
  return out;
}

// The widest simple path between every pair, found by walking every one.
function widestByWalking(n, edges) {
  const out = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i += 1) out[i][i] = INF;
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, cap] of edges) adj[u].push([v, cap]);
  for (let start = 0; start < n; start += 1) {
    const seen = new Array(n).fill(false);
    const walk = (at, narrowest) => {
      seen[at] = true;
      for (const [nxt, cap] of adj[at]) {
        if (!seen[nxt]) {
          const here = narrowest < cap ? narrowest : cap;
          if (here > out[start][nxt]) out[start][nxt] = here;
          walk(nxt, here);
        }
      }
      seen[at] = false;
    };
    walk(start, INF);
  }
  return out;
}

function showBool(row) {
  return row.map((x) => (x ? "y" : ".")).join("");
}

function showWidth(row) {
  return "[" + row.map((x) => (x >= INF ? "*" : String(x))).join(", ") + "]";
}

const DEMO_N = 5;
const DEMO = [[0, 1, 9], [1, 2, 3], [0, 3, 4], [3, 2, 5], [2, 4, 8]];

console.log("capacities: " + DEMO.map(([u, v, c]) => \`\${u}->\${v}:\${c}\`).join(", "));
console.log();
const [demoReach] = closureFloyd(DEMO_N, DEMO);
const demoWide = widestFloyd(DEMO_N, DEMO);
console.log("from".padEnd(6) + " " + "reaches".padEnd(10) + " " + "widest route to each node");
for (let i = 0; i < DEMO_N; i += 1) {
  console.log(String(i).padEnd(6) + " " + showBool(demoReach[i]).padEnd(10) + " " + showWidth(demoWide[i]));
}
console.log();
console.log("Node 0 reaches node 2 two ways: 9 then 3, or 4 then 5. Shortest path");
console.log("would take the first. Widest takes the second, because a route is only");
console.log("as wide as its narrowest edge -- 3 against 4.");

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 777n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let closureOk = 0;
let widestOk = 0;
const same = (a, b) => a.every((row, i) => row.every((x, j) => x === b[i][j]));
for (let t = 0; t < trials; t += 1) {
  const n = 2 + rand(5);
  const edges = [];
  for (let u = 0; u < n; u += 1)
    for (let v = 0; v < n; v += 1)
      if (u !== v && rand(3) === 0) edges.push([u, v, 1 + rand(9)]);
  const [got] = closureFloyd(n, edges);
  if (same(got, reachByWalking(n, edges))) closureOk += 1;
  if (same(widestFloyd(n, edges), widestByWalking(n, edges))) widestOk += 1;
}

console.log();
console.log(\`over \${trials} random graphs on up to 6 nodes:\`);
console.log("  the grid's reachability matched every walk  " + String(closureOk).padStart(6));
console.log("  the grid's widest route matched every walk  " + String(widestOk).padStart(6));

console.log();
console.log("and what the grid costs, against running one search per node:");
console.log("nodes".padEnd(6) + " " + "shape".padEnd(9) + " " + "grid steps".padStart(12) + " " + "n searches".padStart(12));
for (const n of [32, 64, 128, 256]) {
  const ring = [];
  for (let v = 0; v < n; v += 1) ring.push([v, (v + 1) % n, 1]);
  const dense = [];
  for (let u = 0; u < n; u += 1)
    for (let v = 0; v < n; v += 1) if (u !== v) dense.push([u, v, 1]);
  for (const [name, edges] of [["ring", ring], ["dense", dense]]) {
    const [, grid] = closureFloyd(n, edges);
    const [, search] = closureSearches(n, edges);
    console.log(
      String(n).padEnd(6) + " " + name.padEnd(9) + " " +
      String(grid).padStart(12) + " " + String(search).padStart(12),
    );
  }
}

console.log();
console.log("The grid does not care what the graph looks like: n cubed either way. The");
console.log("searches do. On a ring they win by a factor that grows with n: at n = 256");
console.log("it is 131,072 steps against 16,777,216. On a dense graph the columns are");
console.log("not close, they are equal, and the reason is arithmetic: each of the n");
console.log("searches pops n nodes and scans the n-1 edges leaving each, which is n");
console.log("cubed on the nose.");
console.log('So the rule is not "Floyd-Warshall for all pairs". It is: reach for the');
console.log("grid when the graph is dense, or small, or the weights are negative --");
console.log("and otherwise run the single-source algorithm n times.");
`,
            },
            {
              lang: "typescript",
              code: `// The same three loops with a different pair of operators.
//
// Strip the shortest-path meaning out of Floyd-Warshall and what is left is a
// shape: for every k, for every i, for every j, combine the route i->k with the
// route k->j and keep the better of that and what i->j already had. "Combine"
// and "better" are the only two things the algorithm actually needs.
//
//   shortest path   combine = +      better = min
//   reachability    combine = and    better = or
//   bottleneck      combine = min    better = max
//
// Three algorithms, one loop nest. The third one is the useful surprise: the
// widest path is the route whose narrowest edge is as wide as possible -- the
// maximum flow a single route can carry -- and it falls straight out.
const INF = 10 ** 9;

// Reachability. combine = and, better = or.
function closureFloyd(n: number, edges: number[][]): [boolean[][], number] {
  const r: boolean[][] = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let i = 0; i < n; i += 1) r[i][i] = true;
  for (const [u, v] of edges) r[u][v] = true;
  let steps = 0;
  for (let k = 0; k < n; k += 1)
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1) {
        steps += 1;
        if (r[i][k] && r[k][j]) r[i][j] = true;
      }
  return [r, steps];
}

// The same answer by running one search per node, and the steps it costs.
function closureSearches(n: number, edges: number[][]): [boolean[][], number] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v);
  const out: boolean[][] = Array.from({ length: n }, () => new Array(n).fill(false));
  let steps = 0;
  for (let start = 0; start < n; start += 1) {
    out[start][start] = true;
    const stack = [start];
    while (stack.length > 0) {
      const at = stack.pop() as number;
      steps += 1;
      for (const nxt of adj[at]) {
        steps += 1;
        if (!out[start][nxt]) {
          out[start][nxt] = true;
          stack.push(nxt);
        }
      }
    }
  }
  return [out, steps];
}

// Bottleneck. combine = min, better = max: how wide can a single route be.
function widestFloyd(n: number, edges: number[][]): number[][] {
  const w: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i += 1) w[i][i] = INF;
  for (const [u, v, cap] of edges) if (cap > w[u][v]) w[u][v] = cap;
  for (let k = 0; k < n; k += 1)
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1) {
        const through = w[i][k] < w[k][j] ? w[i][k] : w[k][j];
        if (through > w[i][j]) w[i][j] = through;
      }
  return w;
}

// Every pair connected by some simple path. The definition, walked out.
function reachByWalking(n: number, edges: number[][]): boolean[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v);
  const out: boolean[][] = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let start = 0; start < n; start += 1) {
    out[start][start] = true;
    const seen = new Array(n).fill(false);
    const walk = (at: number): void => {
      seen[at] = true;
      for (const nxt of adj[at]) {
        if (!seen[nxt]) {
          out[start][nxt] = true;
          walk(nxt);
        }
      }
      seen[at] = false;
    };
    walk(start);
  }
  return out;
}

// The widest simple path between every pair, found by walking every one.
function widestByWalking(n: number, edges: number[][]): number[][] {
  const out: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i += 1) out[i][i] = INF;
  const adj: number[][][] = Array.from({ length: n }, () => []);
  for (const [u, v, cap] of edges) adj[u].push([v, cap]);
  for (let start = 0; start < n; start += 1) {
    const seen = new Array(n).fill(false);
    const walk = (at: number, narrowest: number): void => {
      seen[at] = true;
      for (const [nxt, cap] of adj[at]) {
        if (!seen[nxt]) {
          const here = narrowest < cap ? narrowest : cap;
          if (here > out[start][nxt]) out[start][nxt] = here;
          walk(nxt, here);
        }
      }
      seen[at] = false;
    };
    walk(start, INF);
  }
  return out;
}

function showBool(row: boolean[]): string {
  return row.map((x) => (x ? "y" : ".")).join("");
}

function showWidth(row: number[]): string {
  return "[" + row.map((x) => (x >= INF ? "*" : String(x))).join(", ") + "]";
}

const DEMO_N = 5;
const DEMO = [[0, 1, 9], [1, 2, 3], [0, 3, 4], [3, 2, 5], [2, 4, 8]];

console.log("capacities: " + DEMO.map(([u, v, c]) => \`\${u}->\${v}:\${c}\`).join(", "));
console.log();
const [demoReach] = closureFloyd(DEMO_N, DEMO);
const demoWide = widestFloyd(DEMO_N, DEMO);
console.log("from".padEnd(6) + " " + "reaches".padEnd(10) + " " + "widest route to each node");
for (let i = 0; i < DEMO_N; i += 1) {
  console.log(String(i).padEnd(6) + " " + showBool(demoReach[i]).padEnd(10) + " " + showWidth(demoWide[i]));
}
console.log();
console.log("Node 0 reaches node 2 two ways: 9 then 3, or 4 then 5. Shortest path");
console.log("would take the first. Widest takes the second, because a route is only");
console.log("as wide as its narrowest edge -- 3 against 4.");

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 777n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let closureOk = 0;
let widestOk = 0;
const same = <T,>(a: T[][], b: T[][]): boolean => a.every((row, i) => row.every((x, j) => x === b[i][j]));
for (let t = 0; t < trials; t += 1) {
  const n = 2 + rand(5);
  const edges: number[][] = [];
  for (let u = 0; u < n; u += 1)
    for (let v = 0; v < n; v += 1)
      if (u !== v && rand(3) === 0) edges.push([u, v, 1 + rand(9)]);
  const [got] = closureFloyd(n, edges);
  if (same(got, reachByWalking(n, edges))) closureOk += 1;
  if (same(widestFloyd(n, edges), widestByWalking(n, edges))) widestOk += 1;
}

console.log();
console.log(\`over \${trials} random graphs on up to 6 nodes:\`);
console.log("  the grid's reachability matched every walk  " + String(closureOk).padStart(6));
console.log("  the grid's widest route matched every walk  " + String(widestOk).padStart(6));

console.log();
console.log("and what the grid costs, against running one search per node:");
console.log("nodes".padEnd(6) + " " + "shape".padEnd(9) + " " + "grid steps".padStart(12) + " " + "n searches".padStart(12));
for (const n of [32, 64, 128, 256]) {
  const ring: number[][] = [];
  for (let v = 0; v < n; v += 1) ring.push([v, (v + 1) % n, 1]);
  const dense: number[][] = [];
  for (let u = 0; u < n; u += 1)
    for (let v = 0; v < n; v += 1) if (u !== v) dense.push([u, v, 1]);
  for (const [name, edges] of [["ring", ring], ["dense", dense]] as [string, number[][]][]) {
    const [, grid] = closureFloyd(n, edges);
    const [, search] = closureSearches(n, edges);
    console.log(
      String(n).padEnd(6) + " " + name.padEnd(9) + " " +
      String(grid).padStart(12) + " " + String(search).padStart(12),
    );
  }
}

console.log();
console.log("The grid does not care what the graph looks like: n cubed either way. The");
console.log("searches do. On a ring they win by a factor that grows with n: at n = 256");
console.log("it is 131,072 steps against 16,777,216. On a dense graph the columns are");
console.log("not close, they are equal, and the reason is arithmetic: each of the n");
console.log("searches pops n nodes and scans the n-1 edges leaving each, which is n");
console.log("cubed on the nose.");
console.log('So the rule is not "Floyd-Warshall for all pairs". It is: reach for the');
console.log("grid when the graph is dense, or small, or the weights are negative --");
console.log("and otherwise run the single-source algorithm n times.");
`,
            },
            {
              lang: "java",
              code: `// The same three loops with a different pair of operators.
//
// Strip the shortest-path meaning out of Floyd-Warshall and what is left is a
// shape: for every k, for every i, for every j, combine the route i->k with the
// route k->j and keep the better of that and what i->j already had. "Combine"
// and "better" are the only two things the algorithm actually needs.
//
//   shortest path   combine = +      better = min
//   reachability    combine = and    better = or
//   bottleneck      combine = min    better = max
//
// Three algorithms, one loop nest. The third one is the useful surprise: the
// widest path is the route whose narrowest edge is as wide as possible -- the
// maximum flow a single route can carry -- and it falls straight out.
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
import java.util.List;

public class Main {
    static final int INF = 1000000000;

    /** Reachability. combine = and, better = or. */
    static boolean[][] closureFloyd(int n, int[][] edges, long[] steps) {
        boolean[][] r = new boolean[n][n];
        for (int i = 0; i < n; i++) r[i][i] = true;
        for (int[] e : edges) r[e[0]][e[1]] = true;
        for (int k = 0; k < n; k++)
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++) {
                    steps[0]++;
                    if (r[i][k] && r[k][j]) r[i][j] = true;
                }
        return r;
    }

    static List<Integer>[] outgoing(int n, int[][] edges) {
        @SuppressWarnings("unchecked")
        List<Integer>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : edges) adj[e[0]].add(e[1]);
        return adj;
    }

    /** The same answer by running one search per node, and the steps it costs. */
    static boolean[][] closureSearches(int n, int[][] edges, long[] steps) {
        List<Integer>[] adj = outgoing(n, edges);
        boolean[][] out = new boolean[n][n];
        for (int start = 0; start < n; start++) {
            out[start][start] = true;
            Deque<Integer> stack = new ArrayDeque<>();
            stack.push(start);
            while (!stack.isEmpty()) {
                int at = stack.pop();
                steps[0]++;
                for (int nxt : adj[at]) {
                    steps[0]++;
                    if (!out[start][nxt]) {
                        out[start][nxt] = true;
                        stack.push(nxt);
                    }
                }
            }
        }
        return out;
    }

    /** Bottleneck. combine = min, better = max: how wide can a single route be. */
    static int[][] widestFloyd(int n, int[][] edges) {
        int[][] w = new int[n][n];
        for (int i = 0; i < n; i++) w[i][i] = INF;
        for (int[] e : edges) if (e[2] > w[e[0]][e[1]]) w[e[0]][e[1]] = e[2];
        for (int k = 0; k < n; k++)
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++) {
                    int through = Math.min(w[i][k], w[k][j]);
                    if (through > w[i][j]) w[i][j] = through;
                }
        return w;
    }

    static void reachWalk(List<Integer>[] adj, boolean[] seen, boolean[][] out, int start, int at) {
        seen[at] = true;
        for (int nxt : adj[at]) {
            if (!seen[nxt]) {
                out[start][nxt] = true;
                reachWalk(adj, seen, out, start, nxt);
            }
        }
        seen[at] = false;
    }

    /** Every pair connected by some simple path. The definition, walked out. */
    static boolean[][] reachByWalking(int n, int[][] edges) {
        List<Integer>[] adj = outgoing(n, edges);
        boolean[][] out = new boolean[n][n];
        for (int start = 0; start < n; start++) {
            out[start][start] = true;
            reachWalk(adj, new boolean[n], out, start, start);
        }
        return out;
    }

    static void widestWalk(List<int[]>[] adj, boolean[] seen, int[][] out, int start, int at,
                           int narrowest) {
        seen[at] = true;
        for (int[] step : adj[at]) {
            if (!seen[step[0]]) {
                int here = Math.min(narrowest, step[1]);
                if (here > out[start][step[0]]) out[start][step[0]] = here;
                widestWalk(adj, seen, out, start, step[0], here);
            }
        }
        seen[at] = false;
    }

    /** The widest simple path between every pair, found by walking every one. */
    static int[][] widestByWalking(int n, int[][] edges) {
        int[][] out = new int[n][n];
        for (int i = 0; i < n; i++) out[i][i] = INF;
        @SuppressWarnings("unchecked")
        List<int[]>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : edges) adj[e[0]].add(new int[] {e[1], e[2]});
        for (int start = 0; start < n; start++)
            widestWalk(adj, new boolean[n], out, start, start, INF);
        return out;
    }

    static String showBool(boolean[] row) {
        StringBuilder sb = new StringBuilder();
        for (boolean x : row) sb.append(x ? "y" : ".");
        return sb.toString();
    }

    static String showWidth(int[] row) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < row.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(row[i] >= INF ? "*" : String.valueOf(row[i]));
        }
        return sb.append("]").toString();
    }

    // The same linear congruential generator in every language, so the random
    // graphs below are the same graphs whichever translation is run.
    static long seed = 777L;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    public static void main(String[] args) {
        int demoN = 5;
        int[][] demo = {{0, 1, 9}, {1, 2, 3}, {0, 3, 4}, {3, 2, 5}, {2, 4, 8}};

        StringBuilder caps = new StringBuilder("capacities: ");
        for (int i = 0; i < demo.length; i++) {
            if (i > 0) caps.append(", ");
            caps.append(demo[i][0]).append("->").append(demo[i][1]).append(":").append(demo[i][2]);
        }
        System.out.println(caps);
        System.out.println();
        boolean[][] demoReach = closureFloyd(demoN, demo, new long[1]);
        int[][] demoWide = widestFloyd(demoN, demo);
        System.out.printf("%-6s %-10s %s%n", "from", "reaches", "widest route to each node");
        for (int i = 0; i < demoN; i++)
            System.out.printf("%-6d %-10s %s%n", i, showBool(demoReach[i]), showWidth(demoWide[i]));
        System.out.println();
        System.out.println("Node 0 reaches node 2 two ways: 9 then 3, or 4 then 5. Shortest path");
        System.out.println("would take the first. Widest takes the second, because a route is only");
        System.out.println("as wide as its narrowest edge -- 3 against 4.");

        int trials = 3000;
        int closureOk = 0, widestOk = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(5);
            List<int[]> built = new ArrayList<>();
            for (int u = 0; u < n; u++)
                for (int v = 0; v < n; v++)
                    if (u != v && rand(3) == 0) built.add(new int[] {u, v, 1 + rand(9)});
            int[][] edges = built.toArray(new int[0][]);
            boolean[][] got = closureFloyd(n, edges, new long[1]);
            if (Arrays.deepEquals(got, reachByWalking(n, edges))) closureOk++;
            if (Arrays.deepEquals(widestFloyd(n, edges), widestByWalking(n, edges))) widestOk++;
        }

        System.out.println();
        System.out.println("over " + trials + " random graphs on up to 6 nodes:");
        System.out.printf("  the grid's reachability matched every walk  %6d%n", closureOk);
        System.out.printf("  the grid's widest route matched every walk  %6d%n", widestOk);

        System.out.println();
        System.out.println("and what the grid costs, against running one search per node:");
        System.out.printf("%-6s %-9s %12s %12s%n", "nodes", "shape", "grid steps", "n searches");
        for (int n : new int[] {32, 64, 128, 256}) {
            int[][] ring = new int[n][3];
            for (int v = 0; v < n; v++) ring[v] = new int[] {v, (v + 1) % n, 1};
            int[][] dense = new int[n * (n - 1)][3];
            int at = 0;
            for (int u = 0; u < n; u++)
                for (int v = 0; v < n; v++)
                    if (u != v) dense[at++] = new int[] {u, v, 1};
            String[] names = {"ring", "dense"};
            int[][][] shapes = {ring, dense};
            for (int s = 0; s < 2; s++) {
                long[] grid = new long[1];
                long[] search = new long[1];
                closureFloyd(n, shapes[s], grid);
                closureSearches(n, shapes[s], search);
                System.out.printf("%-6d %-9s %12d %12d%n", n, names[s], grid[0], search[0]);
            }
        }

        System.out.println();
        System.out.println("The grid does not care what the graph looks like: n cubed either way. The");
        System.out.println("searches do. On a ring they win by a factor that grows with n: at n = 256");
        System.out.println("it is 131,072 steps against 16,777,216. On a dense graph the columns are");
        System.out.println("not close, they are equal, and the reason is arithmetic: each of the n");
        System.out.println("searches pops n nodes and scans the n-1 edges leaving each, which is n");
        System.out.println("cubed on the nose.");
        System.out.println("So the rule is not \\"Floyd-Warshall for all pairs\\". It is: reach for the");
        System.out.println("grid when the graph is dense, or small, or the weights are negative --");
        System.out.println("and otherwise run the single-source algorithm n times.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The same three loops with a different pair of operators.
//
// Strip the shortest-path meaning out of Floyd-Warshall and what is left is a
// shape: for every k, for every i, for every j, combine the route i->k with the
// route k->j and keep the better of that and what i->j already had. "Combine"
// and "better" are the only two things the algorithm actually needs.
//
//   shortest path   combine = +      better = min
//   reachability    combine = and    better = or
//   bottleneck      combine = min    better = max
//
// Three algorithms, one loop nest. The third one is the useful surprise: the
// widest path is the route whose narrowest edge is as wide as possible -- the
// maximum flow a single route can carry -- and it falls straight out.
#include <array>
#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

const int INF = 1000000000;

using Edge = std::array<int, 3>;
using Bools = std::vector<std::vector<bool>>;
using Grid = std::vector<std::vector<int>>;

// Reachability. combine = and, better = or.
Bools closure_floyd(int n, const std::vector<Edge>& edges, long long& steps) {
    Bools r(n, std::vector<bool>(n, false));
    for (int i = 0; i < n; i++) r[i][i] = true;
    for (const Edge& e : edges) r[e[0]][e[1]] = true;
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++) {
                steps++;
                if (r[i][k] && r[k][j]) r[i][j] = true;
            }
    return r;
}

std::vector<std::vector<int>> outgoing(int n, const std::vector<Edge>& edges) {
    std::vector<std::vector<int>> adj(n);
    for (const Edge& e : edges) adj[e[0]].push_back(e[1]);
    return adj;
}

// The same answer by running one search per node, and the steps it costs.
Bools closure_searches(int n, const std::vector<Edge>& edges, long long& steps) {
    std::vector<std::vector<int>> adj = outgoing(n, edges);
    Bools out(n, std::vector<bool>(n, false));
    for (int start = 0; start < n; start++) {
        out[start][start] = true;
        std::vector<int> stack = {start};
        while (!stack.empty()) {
            int at = stack.back();
            stack.pop_back();
            steps++;
            for (int nxt : adj[at]) {
                steps++;
                if (!out[start][nxt]) {
                    out[start][nxt] = true;
                    stack.push_back(nxt);
                }
            }
        }
    }
    return out;
}

// Bottleneck. combine = min, better = max: how wide can a single route be.
Grid widest_floyd(int n, const std::vector<Edge>& edges) {
    Grid w(n, std::vector<int>(n, 0));
    for (int i = 0; i < n; i++) w[i][i] = INF;
    for (const Edge& e : edges)
        if (e[2] > w[e[0]][e[1]]) w[e[0]][e[1]] = e[2];
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++) {
                int through = w[i][k] < w[k][j] ? w[i][k] : w[k][j];
                if (through > w[i][j]) w[i][j] = through;
            }
    return w;
}

void reach_walk(const std::vector<std::vector<int>>& adj, std::vector<bool>& seen, Bools& out,
                int start, int at) {
    seen[at] = true;
    for (int nxt : adj[at]) {
        if (!seen[nxt]) {
            out[start][nxt] = true;
            reach_walk(adj, seen, out, start, nxt);
        }
    }
    seen[at] = false;
}

// Every pair connected by some simple path. The definition, walked out.
Bools reach_by_walking(int n, const std::vector<Edge>& edges) {
    std::vector<std::vector<int>> adj = outgoing(n, edges);
    Bools out(n, std::vector<bool>(n, false));
    for (int start = 0; start < n; start++) {
        out[start][start] = true;
        std::vector<bool> seen(n, false);
        reach_walk(adj, seen, out, start, start);
    }
    return out;
}

void widest_walk(const std::vector<std::vector<std::pair<int, int>>>& adj,
                 std::vector<bool>& seen, Grid& out, int start, int at, int narrowest) {
    seen[at] = true;
    for (const auto& step : adj[at]) {
        if (!seen[step.first]) {
            int here = narrowest < step.second ? narrowest : step.second;
            if (here > out[start][step.first]) out[start][step.first] = here;
            widest_walk(adj, seen, out, start, step.first, here);
        }
    }
    seen[at] = false;
}

// The widest simple path between every pair, found by walking every one.
Grid widest_by_walking(int n, const std::vector<Edge>& edges) {
    Grid out(n, std::vector<int>(n, 0));
    for (int i = 0; i < n; i++) out[i][i] = INF;
    std::vector<std::vector<std::pair<int, int>>> adj(n);
    for (const Edge& e : edges) adj[e[0]].push_back({e[1], e[2]});
    for (int start = 0; start < n; start++) {
        std::vector<bool> seen(n, false);
        widest_walk(adj, seen, out, start, start, INF);
    }
    return out;
}

std::string show_bool(const std::vector<bool>& row) {
    std::string s;
    for (bool x : row) s += x ? "y" : ".";
    return s;
}

std::string show_width(const std::vector<int>& row) {
    std::string s = "[";
    for (size_t i = 0; i < row.size(); i++) {
        if (i > 0) s += ", ";
        s += row[i] >= INF ? "*" : std::to_string(row[i]);
    }
    return s + "]";
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
long long seed = 777;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

int main() {
    int demo_n = 5;
    std::vector<Edge> demo = {{0, 1, 9}, {1, 2, 3}, {0, 3, 4}, {3, 2, 5}, {2, 4, 8}};

    std::cout << "capacities: ";
    for (size_t i = 0; i < demo.size(); i++) {
        if (i > 0) std::cout << ", ";
        std::cout << demo[i][0] << "->" << demo[i][1] << ":" << demo[i][2];
    }
    std::cout << "\\n\\n";

    long long ignored = 0;
    Bools demo_reach = closure_floyd(demo_n, demo, ignored);
    Grid demo_wide = widest_floyd(demo_n, demo);
    std::cout << std::left << std::setw(6) << "from" << " " << std::setw(10) << "reaches"
              << " " << "widest route to each node" << "\\n";
    for (int i = 0; i < demo_n; i++) {
        std::cout << std::left << std::setw(6) << i << " " << std::setw(10)
                  << show_bool(demo_reach[i]) << " " << show_width(demo_wide[i]) << "\\n";
    }
    std::cout << "\\n";
    std::cout << "Node 0 reaches node 2 two ways: 9 then 3, or 4 then 5. Shortest path\\n";
    std::cout << "would take the first. Widest takes the second, because a route is only\\n";
    std::cout << "as wide as its narrowest edge -- 3 against 4.\\n";

    int trials = 3000;
    int closure_ok = 0, widest_ok = 0;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(5);
        std::vector<Edge> edges;
        for (int u = 0; u < n; u++)
            for (int v = 0; v < n; v++)
                if (u != v && rand_below(3) == 0)
                    edges.push_back({u, v, 1 + rand_below(9)});
        long long unused = 0;
        if (closure_floyd(n, edges, unused) == reach_by_walking(n, edges)) closure_ok++;
        if (widest_floyd(n, edges) == widest_by_walking(n, edges)) widest_ok++;
    }

    std::cout << "\\n";
    std::cout << "over " << trials << " random graphs on up to 6 nodes:\\n";
    std::cout << std::right;
    std::cout << "  the grid's reachability matched every walk  " << std::setw(6) << closure_ok << "\\n";
    std::cout << "  the grid's widest route matched every walk  " << std::setw(6) << widest_ok << "\\n";

    std::cout << "\\n";
    std::cout << "and what the grid costs, against running one search per node:\\n";
    std::cout << std::left << std::setw(6) << "nodes" << " " << std::setw(9) << "shape" << " "
              << std::right << std::setw(12) << "grid steps" << " " << std::setw(12)
              << "n searches" << "\\n";
    for (int n : {32, 64, 128, 256}) {
        std::vector<Edge> ring;
        for (int v = 0; v < n; v++) ring.push_back({v, (v + 1) % n, 1});
        std::vector<Edge> dense;
        for (int u = 0; u < n; u++)
            for (int v = 0; v < n; v++)
                if (u != v) dense.push_back({u, v, 1});
        std::vector<std::pair<std::string, std::vector<Edge>>> shapes = {{"ring", ring},
                                                                        {"dense", dense}};
        for (const auto& shape : shapes) {
            long long grid = 0, search = 0;
            closure_floyd(n, shape.second, grid);
            closure_searches(n, shape.second, search);
            std::cout << std::left << std::setw(6) << n << " " << std::setw(9) << shape.first
                      << " " << std::right << std::setw(12) << grid << " " << std::setw(12)
                      << search << "\\n";
        }
    }

    std::cout << "\\n";
    std::cout << "The grid does not care what the graph looks like: n cubed either way. The\\n";
    std::cout << "searches do. On a ring they win by a factor that grows with n: at n = 256\\n";
    std::cout << "it is 131,072 steps against 16,777,216. On a dense graph the columns are\\n";
    std::cout << "not close, they are equal, and the reason is arithmetic: each of the n\\n";
    std::cout << "searches pops n nodes and scans the n-1 edges leaving each, which is n\\n";
    std::cout << "cubed on the nose.\\n";
    std::cout << "So the rule is not \\"Floyd-Warshall for all pairs\\". It is: reach for the\\n";
    std::cout << "grid when the graph is dense, or small, or the weights are negative --\\n";
    std::cout << "and otherwise run the single-source algorithm n times.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// The same three loops with a different pair of operators.
//
// Strip the shortest-path meaning out of Floyd-Warshall and what is left is a
// shape: for every k, for every i, for every j, combine the route i->k with the
// route k->j and keep the better of that and what i->j already had. "Combine"
// and "better" are the only two things the algorithm actually needs.
//
//   shortest path   combine = +      better = min
//   reachability    combine = and    better = or
//   bottleneck      combine = min    better = max
//
// Three algorithms, one loop nest. The third one is the useful surprise: the
// widest path is the route whose narrowest edge is as wide as possible -- the
// maximum flow a single route can carry -- and it falls straight out.
const INF: i64 = 1_000_000_000;

type Edge = (usize, usize, i64);
type Bools = Vec<Vec<bool>>;
type Grid = Vec<Vec<i64>>;

/// Reachability. combine = and, better = or.
fn closure_floyd(n: usize, edges: &[Edge]) -> (Bools, u64) {
    let mut r = vec![vec![false; n]; n];
    for i in 0..n {
        r[i][i] = true;
    }
    for &(u, v, _) in edges {
        r[u][v] = true;
    }
    let mut steps: u64 = 0;
    for k in 0..n {
        for i in 0..n {
            for j in 0..n {
                steps += 1;
                if r[i][k] && r[k][j] {
                    r[i][j] = true;
                }
            }
        }
    }
    (r, steps)
}

fn outgoing(n: usize, edges: &[Edge]) -> Vec<Vec<usize>> {
    let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
    for &(u, v, _) in edges {
        adj[u].push(v);
    }
    adj
}

/// The same answer by running one search per node, and the steps it costs.
fn closure_searches(n: usize, edges: &[Edge]) -> (Bools, u64) {
    let adj = outgoing(n, edges);
    let mut out = vec![vec![false; n]; n];
    let mut steps: u64 = 0;
    for start in 0..n {
        out[start][start] = true;
        let mut stack = vec![start];
        while let Some(at) = stack.pop() {
            steps += 1;
            for &nxt in &adj[at] {
                steps += 1;
                if !out[start][nxt] {
                    out[start][nxt] = true;
                    stack.push(nxt);
                }
            }
        }
    }
    (out, steps)
}

/// Bottleneck. combine = min, better = max: how wide can a single route be.
fn widest_floyd(n: usize, edges: &[Edge]) -> Grid {
    let mut w = vec![vec![0i64; n]; n];
    for i in 0..n {
        w[i][i] = INF;
    }
    for &(u, v, cap) in edges {
        if cap > w[u][v] {
            w[u][v] = cap;
        }
    }
    for k in 0..n {
        for i in 0..n {
            for j in 0..n {
                let through = if w[i][k] < w[k][j] { w[i][k] } else { w[k][j] };
                if through > w[i][j] {
                    w[i][j] = through;
                }
            }
        }
    }
    w
}

fn reach_walk(adj: &[Vec<usize>], seen: &mut [bool], out: &mut Bools, start: usize, at: usize) {
    seen[at] = true;
    for idx in 0..adj[at].len() {
        let nxt = adj[at][idx];
        if !seen[nxt] {
            out[start][nxt] = true;
            reach_walk(adj, seen, out, start, nxt);
        }
    }
    seen[at] = false;
}

/// Every pair connected by some simple path. The definition, walked out.
fn reach_by_walking(n: usize, edges: &[Edge]) -> Bools {
    let adj = outgoing(n, edges);
    let mut out = vec![vec![false; n]; n];
    for start in 0..n {
        out[start][start] = true;
        let mut seen = vec![false; n];
        reach_walk(&adj, &mut seen, &mut out, start, start);
    }
    out
}

fn widest_walk(
    adj: &[Vec<(usize, i64)>],
    seen: &mut [bool],
    out: &mut Grid,
    start: usize,
    at: usize,
    narrowest: i64,
) {
    seen[at] = true;
    for idx in 0..adj[at].len() {
        let (nxt, cap) = adj[at][idx];
        if !seen[nxt] {
            let here = if narrowest < cap { narrowest } else { cap };
            if here > out[start][nxt] {
                out[start][nxt] = here;
            }
            widest_walk(adj, seen, out, start, nxt, here);
        }
    }
    seen[at] = false;
}

/// The widest simple path between every pair, found by walking every one.
fn widest_by_walking(n: usize, edges: &[Edge]) -> Grid {
    let mut out = vec![vec![0i64; n]; n];
    for i in 0..n {
        out[i][i] = INF;
    }
    let mut adj: Vec<Vec<(usize, i64)>> = vec![Vec::new(); n];
    for &(u, v, cap) in edges {
        adj[u].push((v, cap));
    }
    for start in 0..n {
        let mut seen = vec![false; n];
        widest_walk(&adj, &mut seen, &mut out, start, start, INF);
    }
    out
}

fn show_bool(row: &[bool]) -> String {
    row.iter().map(|&x| if x { 'y' } else { '.' }).collect()
}

fn show_width(row: &[i64]) -> String {
    let cells: Vec<String> = row
        .iter()
        .map(|&x| if x >= INF { "*".to_string() } else { x.to_string() })
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
    let demo_n = 5usize;
    let demo: Vec<Edge> = vec![(0, 1, 9), (1, 2, 3), (0, 3, 4), (3, 2, 5), (2, 4, 8)];

    let caps: Vec<String> = demo
        .iter()
        .map(|&(u, v, c)| format!("{}->{}:{}", u, v, c))
        .collect();
    println!("capacities: {}", caps.join(", "));
    println!();
    let (demo_reach, _) = closure_floyd(demo_n, &demo);
    let demo_wide = widest_floyd(demo_n, &demo);
    println!("{:<6} {:<10} {}", "from", "reaches", "widest route to each node");
    for i in 0..demo_n {
        println!(
            "{:<6} {:<10} {}",
            i,
            show_bool(&demo_reach[i]),
            show_width(&demo_wide[i])
        );
    }
    println!();
    println!("Node 0 reaches node 2 two ways: 9 then 3, or 4 then 5. Shortest path");
    println!("would take the first. Widest takes the second, because a route is only");
    println!("as wide as its narrowest edge -- 3 against 4.");

    let mut rng = Rng { seed: 777 };
    let trials = 3000;
    let (mut closure_ok, mut widest_ok) = (0, 0);
    for _ in 0..trials {
        let n = 2 + rng.next(5) as usize;
        let mut edges: Vec<Edge> = Vec::new();
        for u in 0..n {
            for v in 0..n {
                if u != v && rng.next(3) == 0 {
                    edges.push((u, v, 1 + rng.next(9)));
                }
            }
        }
        let (got, _) = closure_floyd(n, &edges);
        if got == reach_by_walking(n, &edges) {
            closure_ok += 1;
        }
        if widest_floyd(n, &edges) == widest_by_walking(n, &edges) {
            widest_ok += 1;
        }
    }

    println!();
    println!("over {} random graphs on up to 6 nodes:", trials);
    println!("  the grid's reachability matched every walk  {:>6}", closure_ok);
    println!("  the grid's widest route matched every walk  {:>6}", widest_ok);

    println!();
    println!("and what the grid costs, against running one search per node:");
    println!("{:<6} {:<9} {:>12} {:>12}", "nodes", "shape", "grid steps", "n searches");
    for &n in &[32usize, 64, 128, 256] {
        let ring: Vec<Edge> = (0..n).map(|v| (v, (v + 1) % n, 1i64)).collect();
        let mut dense: Vec<Edge> = Vec::new();
        for u in 0..n {
            for v in 0..n {
                if u != v {
                    dense.push((u, v, 1));
                }
            }
        }
        for (name, edges) in [("ring", &ring), ("dense", &dense)] {
            let (_, grid) = closure_floyd(n, edges);
            let (_, search) = closure_searches(n, edges);
            println!("{:<6} {:<9} {:>12} {:>12}", n, name, grid, search);
        }
    }

    println!();
    println!("The grid does not care what the graph looks like: n cubed either way. The");
    println!("searches do. On a ring they win by a factor that grows with n: at n = 256");
    println!("it is 131,072 steps against 16,777,216. On a dense graph the columns are");
    println!("not close, they are equal, and the reason is arithmetic: each of the n");
    println!("searches pops n nodes and scans the n-1 edges leaving each, which is n");
    println!("cubed on the nose.");
    println!("So the rule is not \\"Floyd-Warshall for all pairs\\". It is: reach for the");
    println!("grid when the graph is dense, or small, or the weights are negative --");
    println!("and otherwise run the single-source algorithm n times.");
}
`,
            },
            {
              lang: "go",
              code: `// The same three loops with a different pair of operators.
//
// Strip the shortest-path meaning out of Floyd-Warshall and what is left is a
// shape: for every k, for every i, for every j, combine the route i->k with the
// route k->j and keep the better of that and what i->j already had. "Combine"
// and "better" are the only two things the algorithm actually needs.
//
//	shortest path   combine = +      better = min
//	reachability    combine = and    better = or
//	bottleneck      combine = min    better = max
//
// Three algorithms, one loop nest. The third one is the useful surprise: the
// widest path is the route whose narrowest edge is as wide as possible -- the
// maximum flow a single route can carry -- and it falls straight out.
package main

import (
	"fmt"
	"strings"
)

const INF = 1000000000

// Edge is a directed edge with a capacity.
type Edge struct {
	U, V, W int
}

// closureFloyd computes reachability. combine = and, better = or.
func closureFloyd(n int, edges []Edge) ([][]bool, int64) {
	r := make([][]bool, n)
	for i := range r {
		r[i] = make([]bool, n)
		r[i][i] = true
	}
	for _, e := range edges {
		r[e.U][e.V] = true
	}
	var steps int64
	for k := 0; k < n; k++ {
		for i := 0; i < n; i++ {
			for j := 0; j < n; j++ {
				steps++
				if r[i][k] && r[k][j] {
					r[i][j] = true
				}
			}
		}
	}
	return r, steps
}

func outgoing(n int, edges []Edge) [][]int {
	adj := make([][]int, n)
	for _, e := range edges {
		adj[e.U] = append(adj[e.U], e.V)
	}
	return adj
}

// closureSearches gets the same answer by running one search per node, and
// reports the steps it costs.
func closureSearches(n int, edges []Edge) ([][]bool, int64) {
	adj := outgoing(n, edges)
	out := make([][]bool, n)
	for i := range out {
		out[i] = make([]bool, n)
	}
	var steps int64
	for start := 0; start < n; start++ {
		out[start][start] = true
		stack := []int{start}
		for len(stack) > 0 {
			at := stack[len(stack)-1]
			stack = stack[:len(stack)-1]
			steps++
			for _, nxt := range adj[at] {
				steps++
				if !out[start][nxt] {
					out[start][nxt] = true
					stack = append(stack, nxt)
				}
			}
		}
	}
	return out, steps
}

// widestFloyd computes the bottleneck. combine = min, better = max: how wide
// can a single route be.
func widestFloyd(n int, edges []Edge) [][]int {
	w := make([][]int, n)
	for i := range w {
		w[i] = make([]int, n)
		w[i][i] = INF
	}
	for _, e := range edges {
		if e.W > w[e.U][e.V] {
			w[e.U][e.V] = e.W
		}
	}
	for k := 0; k < n; k++ {
		for i := 0; i < n; i++ {
			for j := 0; j < n; j++ {
				through := w[i][k]
				if w[k][j] < through {
					through = w[k][j]
				}
				if through > w[i][j] {
					w[i][j] = through
				}
			}
		}
	}
	return w
}

func reachWalk(adj [][]int, seen []bool, out [][]bool, start, at int) {
	seen[at] = true
	for _, nxt := range adj[at] {
		if !seen[nxt] {
			out[start][nxt] = true
			reachWalk(adj, seen, out, start, nxt)
		}
	}
	seen[at] = false
}

// reachByWalking finds every pair connected by some simple path. The
// definition, walked out.
func reachByWalking(n int, edges []Edge) [][]bool {
	adj := outgoing(n, edges)
	out := make([][]bool, n)
	for i := range out {
		out[i] = make([]bool, n)
	}
	for start := 0; start < n; start++ {
		out[start][start] = true
		reachWalk(adj, make([]bool, n), out, start, start)
	}
	return out
}

func widestWalk(adj [][][2]int, seen []bool, out [][]int, start, at, narrowest int) {
	seen[at] = true
	for _, step := range adj[at] {
		if !seen[step[0]] {
			here := narrowest
			if step[1] < here {
				here = step[1]
			}
			if here > out[start][step[0]] {
				out[start][step[0]] = here
			}
			widestWalk(adj, seen, out, start, step[0], here)
		}
	}
	seen[at] = false
}

// widestByWalking finds the widest simple path between every pair, by walking
// every one.
func widestByWalking(n int, edges []Edge) [][]int {
	out := make([][]int, n)
	for i := range out {
		out[i] = make([]int, n)
		out[i][i] = INF
	}
	adj := make([][][2]int, n)
	for _, e := range edges {
		adj[e.U] = append(adj[e.U], [2]int{e.V, e.W})
	}
	for start := 0; start < n; start++ {
		widestWalk(adj, make([]bool, n), out, start, start, INF)
	}
	return out
}

func sameBool(a, b [][]bool) bool {
	for i := range a {
		for j := range a[i] {
			if a[i][j] != b[i][j] {
				return false
			}
		}
	}
	return true
}

func sameInt(a, b [][]int) bool {
	for i := range a {
		for j := range a[i] {
			if a[i][j] != b[i][j] {
				return false
			}
		}
	}
	return true
}

func showBool(row []bool) string {
	var sb strings.Builder
	for _, x := range row {
		if x {
			sb.WriteString("y")
		} else {
			sb.WriteString(".")
		}
	}
	return sb.String()
}

func showWidth(row []int) string {
	cells := make([]string, len(row))
	for i, x := range row {
		if x >= INF {
			cells[i] = "*"
		} else {
			cells[i] = fmt.Sprint(x)
		}
	}
	return "[" + strings.Join(cells, ", ") + "]"
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
var seed int64 = 777

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	demoN := 5
	demo := []Edge{{0, 1, 9}, {1, 2, 3}, {0, 3, 4}, {3, 2, 5}, {2, 4, 8}}

	caps := make([]string, len(demo))
	for i, e := range demo {
		caps[i] = fmt.Sprintf("%d->%d:%d", e.U, e.V, e.W)
	}
	fmt.Println("capacities: " + strings.Join(caps, ", "))
	fmt.Println()
	demoReach, _ := closureFloyd(demoN, demo)
	demoWide := widestFloyd(demoN, demo)
	fmt.Printf("%-6s %-10s %s\\n", "from", "reaches", "widest route to each node")
	for i := 0; i < demoN; i++ {
		fmt.Printf("%-6d %-10s %s\\n", i, showBool(demoReach[i]), showWidth(demoWide[i]))
	}
	fmt.Println()
	fmt.Println("Node 0 reaches node 2 two ways: 9 then 3, or 4 then 5. Shortest path")
	fmt.Println("would take the first. Widest takes the second, because a route is only")
	fmt.Println("as wide as its narrowest edge -- 3 against 4.")

	trials := 3000
	closureOk, widestOk := 0, 0
	for t := 0; t < trials; t++ {
		n := 2 + randBelow(5)
		var edges []Edge
		for u := 0; u < n; u++ {
			for v := 0; v < n; v++ {
				if u != v && randBelow(3) == 0 {
					edges = append(edges, Edge{u, v, 1 + randBelow(9)})
				}
			}
		}
		got, _ := closureFloyd(n, edges)
		if sameBool(got, reachByWalking(n, edges)) {
			closureOk++
		}
		if sameInt(widestFloyd(n, edges), widestByWalking(n, edges)) {
			widestOk++
		}
	}

	fmt.Println()
	fmt.Printf("over %d random graphs on up to 6 nodes:\\n", trials)
	fmt.Printf("  the grid's reachability matched every walk  %6d\\n", closureOk)
	fmt.Printf("  the grid's widest route matched every walk  %6d\\n", widestOk)

	fmt.Println()
	fmt.Println("and what the grid costs, against running one search per node:")
	fmt.Printf("%-6s %-9s %12s %12s\\n", "nodes", "shape", "grid steps", "n searches")
	for _, n := range []int{32, 64, 128, 256} {
		ring := make([]Edge, n)
		for v := 0; v < n; v++ {
			ring[v] = Edge{v, (v + 1) % n, 1}
		}
		var dense []Edge
		for u := 0; u < n; u++ {
			for v := 0; v < n; v++ {
				if u != v {
					dense = append(dense, Edge{u, v, 1})
				}
			}
		}
		names := []string{"ring", "dense"}
		shapes := [][]Edge{ring, dense}
		for s := 0; s < 2; s++ {
			_, grid := closureFloyd(n, shapes[s])
			_, search := closureSearches(n, shapes[s])
			fmt.Printf("%-6d %-9s %12d %12d\\n", n, names[s], grid, search)
		}
	}

	fmt.Println()
	fmt.Println("The grid does not care what the graph looks like: n cubed either way. The")
	fmt.Println("searches do. On a ring they win by a factor that grows with n: at n = 256")
	fmt.Println("it is 131,072 steps against 16,777,216. On a dense graph the columns are")
	fmt.Println("not close, they are equal, and the reason is arithmetic: each of the n")
	fmt.Println("searches pops n nodes and scans the n-1 edges leaving each, which is n")
	fmt.Println("cubed on the nose.")
	fmt.Println("So the rule is not \\"Floyd-Warshall for all pairs\\". It is: reach for the")
	fmt.Println("grid when the graph is dense, or small, or the weights are negative --")
	fmt.Println("and otherwise run the single-source algorithm n times.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Reaching for flow machinery to find the widest route",
          body: "The most a single route can carry is the widest path, and it is Floyd-Warshall with min for combine and max for better. It matched an exhaustive walk over every simple path on all 3,000 random graphs. Maximum flow across many routes is a different problem; one route is this one.",
        },
        {
          title: "Assuming shortest and widest agree",
          body: "They routinely do not. In the demo, node 0 reaches node 2 through a 9 then a 3, or a 4 then a 5. Shortest takes the first pair, widest the second, because a route is only as wide as its narrowest edge.",
        },
      ],
    },
    {
      id: "floyd-warshall-in-four-lines",
      heading: "Floyd-Warshall in four lines",
      body: [
        "Floyd-Warshall, in four lines.",
        "**`k` has to be the outer loop**, because each pass widens the set of permitted intermediates by one node and every pair has to be brought up to date against the same set. The other orders scored 2,513 and 2,396 out of 3,000, and every failure was a plausible number.",
        "**It settles nothing, so negative weights are fine.** That is the reason to prefer it over `n` runs of Dijkstra — not the all-pairs part, which `n` Dijkstras also give, faster, on a sparse graph.",
        "**`d[i][i] < 0` is an exact yes-or-no and an inexact which.** It contained the nodes on a negative cycle on all 494 graphs that had one, strictly so on 85; it was contained in the nodes on a negative closed walk, strictly so on 110.",
        "**Combine and better are the only operations.** Swap `+`/`min` for `and`/`or` and it is reachability; swap for `min`/`max` and it is the widest path. Both matched exhaustive walks on all 3,000 graphs.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does the k loop have to be outermost in Floyd-Warshall?",
      answer:
        "Because of what a pass means. After the k-th outer pass, d[i][j] is the cheapest route from i to j whose intermediate nodes all come from {0..k}. Each pass widens that set by one node, and the loop order is what guarantees every pair is updated against the same set before the set grows. Put k inside and pair (i, j) is finished with all n intermediates while (i, j+1) has not begun, so a route needing two intermediates can be evaluated before either is available. I measured it: over 3,000 random weighted graphs, k outermost matched an exhaustive search over every simple path on all 3,000; k innermost on 2,513 and k in the middle on 2,396. The failures are the dangerous kind -- 896 and 1,174 entries too high, none too low, so every wrong number is the real cost of a real route and nothing looks impossible.",
    },
    {
      question: "When would you use Floyd-Warshall rather than running Dijkstra from every node?",
      answer:
        "Not just because I want all pairs -- n Dijkstras give that too. Three reasons. Negative weights: Dijkstra settles a node and never revisits it, so a negative edge found later is ignored; on 2,506 random graphs with weights from -3 to 5 the grid matched an exhaustive search on every one and n Dijkstras missed 64, always reporting too high. Density: the grid is n cubed whatever the shape, and n searches on a dense graph come to exactly n cubed as well -- each of the n searches pops n nodes and scans n-1 edges -- so at that point the grid is the same work in three lines with no priority queue. And small n, where the constant factor dominates. On a sparse graph I would not use it: on a ring of 256 nodes the searches took 131,072 steps against 16,777,216.",
    },
    {
      question: "What does a negative value on the diagonal tell you?",
      answer:
        "That the graph holds a negative cycle. As a yes-or-no test that is exact -- it was right on all 3,000 graphs I measured. What it does not do is name the nodes reliably. The usual claim is that d[i][i] < 0 means i is on a negative cycle, and measured against an exhaustive enumeration of every simple cycle, the diagonals always contained those nodes and on 85 graphs contained more. Measured against the wider definition -- every node on a negative closed walk, which includes nodes that can reach a paying cycle and return -- the diagonals were always contained and on 110 graphs were fewer. So it sits between two definitions and equals neither. If I need the affected set I run Bellman-Ford and do a reachability search from the edges still improving on the extra round.",
    },
    {
      question: "Can the same triple loop solve anything other than shortest paths?",
      answer:
        "Yes, and it is worth knowing because it is one line of change. The algorithm only uses two operations: combine the route i->k with k->j, and keep the better of that and what i->j held. With plus and min it is shortest paths. With and and or it is the transitive closure -- reachability between every pair. With min and max it is the widest path, the route whose narrowest edge is as wide as possible, which is the most a single route can carry. I checked both of the new ones against exhaustive walks over every simple path on 3,000 random graphs and they matched on all of them. The widest-path version is the one I would actually reach for; it answers a question that looks like it should need flow machinery.",
    },
  ],
  takeaways: [
    "After pass `k`, `d[i][j]` is the best route using intermediates from `{0..k}` — that invariant is why `k` is outermost.",
    "The wrong loop orders scored 2,513 and 2,396 out of 3,000, and produced no impossible values.",
    "Every wrong entry was too high, never too low: a real route's cost, just not the cheapest.",
    "The grid settles nothing, so negative edges are fine where Dijkstra's settle-once claim is not.",
    "`n` Dijkstras reported 117 entries too high on graphs holding a negative edge.",
    "`d[i][i] < 0` is an exact existence test for a negative cycle: right on all 3,000 graphs.",
    "It is not an exact membership test — strictly bigger than the on-a-cycle set on 85 graphs, strictly smaller than the on-a-closed-walk set on 110.",
    "Swap `+`/`min` for `and`/`or` and the same loops compute reachability.",
    "Swap for `min`/`max` and they compute the widest path — both matched exhaustive walks 3,000 out of 3,000.",
    "`n` searches beat the grid 131,072 to 16,777,216 on a ring, and tie it exactly on a dense graph.",
  ],
  status: "available",
};
