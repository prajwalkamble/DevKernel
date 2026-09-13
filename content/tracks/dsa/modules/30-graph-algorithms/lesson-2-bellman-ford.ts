import type { Lesson } from "@/content/types";

export const bellmanFordLesson: Lesson = {
  id: "dsa-graph-algorithms-bellman-ford",
  slug: "bellman-ford",
  moduleSlug: "graph-algorithms",
  title: "Bellman-Ford and Negative Cycles",
  summary:
    "The algorithm that gives up the greedy step and gets negative edges in return: where the n-1 comes from and why the bound is tight, how one extra round turns the algorithm into a negative-cycle detector and how to name the nodes that detection ruins, and the work queue that removes the provably wasted relaxations without improving the worst case.",
  estimatedMinutes: 45,
  objectives: [
    "Derive the `n - 1` round bound rather than memorising it",
    "Detect a negative cycle, and report which nodes it actually affects",
    "Explain why an unreachable negative cycle is not a problem",
    "Say what SPFA changes and what it does not",
  ],
  sections: [
    {
      id: "no-claim-at-all",
      heading: "No claim at all",
      body: [
        "Dijkstra is fast because it makes a claim \u2014 this distance is final \u2014 and the claim needs non-negative weights. Bellman-Ford is the algorithm that makes no claim at all. It never settles anything; it relaxes every edge, over and over, and stops when a full round changes nothing.",
        "Giving up the greedy step costs a factor of `V` and buys correctness on graphs with negative edges. Over 3,000 random graphs with weights from -3 to 5 it matched an exhaustive search over every simple path on every graph without a negative cycle.",
        "The famous number is `n - 1` rounds, and it is worth deriving rather than memorising. After `k` rounds, every distance reachable by a route of at most `k` edges is correct. A *shortest* route never repeats a node: repeating one means going round a cycle, and a cycle either costs something \u2014 so dropping it is cheaper \u2014 or costs nothing \u2014 so dropping it is no worse. A route through `n` distinct nodes has `n - 1` edges. Hence `n - 1` rounds.",
        "The bound is tight and almost never reached. The example builds the worst case on purpose: take a path and list its edges in reverse, so each round propagates exactly one hop. A chain of 32 nodes then uses all 31 rounds, and with one round fewer the far end is still unreached. On the random graphs the loop stopped early on most of them, running 3,668 rounds where 6,253 were allowed.",
        "Which is why the stopping rule to write is the honest one \u2014 run until a full round changes nothing \u2014 rather than a hard-coded count. It is never worse than `n - 1` and usually much better, and on the small random graphs here even `n - 2` rounds happened to suffice every time, which is exactly the kind of accident that makes a wrong constant survive testing.",
      ],
      examples: [
        {
          id: "why-n-minus-one",
          title: "The rounds needed, the rounds allowed, and a chain that needs all of them",
          lang: "python",
          code: `# Bellman-Ford, and why the number of rounds is exactly n - 1.
#
# The algorithm gives up the greedy step entirely. It never declares anything
# final; it just relaxes every edge, over and over, and stops when a full round
# changes nothing. That makes it slower than Dijkstra and correct on graphs
# Dijkstra is wrong about.
#
# The round count is the part worth understanding rather than memorising. After
# k rounds, every distance reachable by a route of at most k edges is correct.
# A shortest route never repeats a node -- repeating one would mean going round
# a cycle, and a cycle either costs something, in which case dropping it is
# cheaper, or costs nothing, in which case dropping it is no worse. So a
# shortest route has at most n - 1 edges, and n - 1 rounds is enough.
INF = 10 ** 9


def bellman_ford(n, edges, start, rounds):
    """Relax every edge, the given number of times. No settled set anywhere."""
    best = [INF] * n
    best[start] = 0
    used = 0
    for _ in range(rounds):
        changed = False
        for u, v, w in edges:
            if best[u] < INF and best[u] + w < best[v]:
                best[v] = best[u] + w
                changed = True
        used += 1
        if not changed:
            break
    return best, used


def hops_needed(n, edges, start):
    """The largest number of edges any shortest route actually uses."""
    best = [INF] * n
    hops = [0] * n
    best[start] = 0
    for _ in range(n):
        changed = False
        for u, v, w in edges:
            if best[u] < INF and best[u] + w < best[v]:
                best[v] = best[u] + w
                hops[v] = hops[u] + 1
                changed = True
        if not changed:
            break
    most = 0
    for v in range(n):
        if best[v] < INF and hops[v] > most:
            most = hops[v]
    return most


def has_negative_cycle(n, edges):
    """One extra round from an all-zero start: still improving means a loop pays."""
    best = [0] * n
    for _ in range(n - 1):
        for u, v, w in edges:
            if best[u] + w < best[v]:
                best[v] = best[u] + w
    for u, v, w in edges:
        if best[u] + w < best[v]:
            return True
    return False


def cheapest_by_walking(n, edges, start, target):
    """Every simple path. The definition."""
    neighbours = [[] for _ in range(n)]
    for u, v, w in edges:
        neighbours[u].append((v, w))
    best = [INF]
    on_path = [False] * n

    def step(v, spent):
        if v == target and spent < best[0]:
            best[0] = spent
        on_path[v] = True
        for u, w in neighbours[v]:
            if not on_path[u]:
                step(u, spent + w)
        on_path[v] = False

    step(start, 0)
    return best[0]


def show(values):
    out = []
    for v in values:
        out.append("-" if v >= INF else str(v))
    return "[" + ", ".join(out) + "]"


def show_edges(edges):
    return "[" + ", ".join(f"{u}->{v}:{w}" for u, v, w in edges) + "]"


def chain(n):
    """A path with its edges listed backwards, so one round propagates one hop."""
    return [(v, v + 1, 1) for v in range(n - 2, -1, -1)]


CASES = [
    (4, [(0, 1, 1), (0, 2, 2), (2, 1, -2), (1, 3, 1)]),
    (4, [(0, 1, 4), (0, 2, 1), (2, 1, 1), (1, 3, 1)]),
    (5, [(0, 1, 3), (1, 2, -1), (2, 3, 2), (3, 4, -2), (0, 4, 5)]),
]

print(f"{'edges':<50}{'distances':<18}{'rounds used':>13}{'hops needed':>13}")
for n, edges in CASES:
    best, used = bellman_ford(n, edges, 0, n - 1)
    truth = [cheapest_by_walking(n, edges, 0, t) for t in range(n)]
    if show(best) != show(truth):
        print("MISMATCH")
    print(f"{show_edges(edges):<50}{show(best):<18}{used:>13}{hops_needed(n, edges, 0):>13}")
print()

print(f"{'chain of':<12}{'edges':>8}{'rounds used':>13}{'hops needed':>13}"
      f"{'last, n-1 rounds':>18}{'last, n-2 rounds':>18}")
for n in [4, 8, 16, 32]:
    edges = chain(n)
    full, used = bellman_ford(n, edges, 0, n - 1)
    short, _ = bellman_ford(n, edges, 0, n - 2)
    print(f"{n:<12}{len(edges):>8}{used:>13}{hops_needed(n, edges, 0):>13}"
          f"{show([full[n - 1]]):>18}{show([short[n - 1]]):>18}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
skipped = 0
full_ok = 0
short_ok = 0
short_high = 0
early_saved = 0
total_rounds = 0
total_allowed = 0
for _ in range(TRIALS):
    n = 2 + rand(5)
    edges = []
    for u in range(n):
        for v in range(n):
            if u != v and rand(3) == 0:
                edges.append((u, v, rand(9) - 3))
    if has_negative_cycle(n, edges):
        skipped += 1
        continue
    truth = [cheapest_by_walking(n, edges, 0, t) for t in range(n)]
    full, used = bellman_ford(n, edges, 0, n - 1)
    short, _ = bellman_ford(n, edges, 0, max(1, n - 2))
    good_full = True
    good_short = True
    high = False
    for t in range(n):
        if full[t] != truth[t]:
            good_full = False
        if short[t] != truth[t]:
            good_short = False
            if short[t] > truth[t]:
                high = True
    if good_full:
        full_ok += 1
    if good_short:
        short_ok += 1
    if high:
        short_high += 1
    total_rounds += used
    total_allowed += n - 1
    if used < n - 1:
        early_saved += 1

kept = TRIALS - skipped
print(f"over {TRIALS} random graphs with weights from -3 to 5:")
print(f"  had a negative cycle, skipped        {skipped:>6}")
print(f"  n-1 rounds matched every simple path {full_ok:>6}")
print(f"  n-2 rounds matched it                {short_ok:>6}")
print(f"  n-2 rounds reported something high   {short_high:>6}")
print(f"  a full round changed nothing early   {early_saved:>6}")
print(f"  rounds run against rounds allowed    {total_rounds:>6}{total_allowed:>8}")
print()
print(f"The bound is tight and almost never reached. On the {kept} graphs kept, n-1")
print("rounds were always enough and the loop stopped early on most of them,")
print(f"running {total_rounds} rounds where {total_allowed} were allowed. On these small random")
print(f"graphs even n-2 rounds sufficed every time, coming up short on {kept - short_ok} of")
print("them -- which is exactly why this bound has to be reasoned about rather")
print("than tested into existence.")
print()
print("The chain table is the worst case built on purpose. List the edges of a")
print("path in reverse and every round propagates exactly one hop, so a chain of")
print("32 nodes uses all 31 rounds -- and with one round fewer the far end is")
print("still unreached. That is the bound being tight, and it is why the honest")
print("stopping rule is to run until a full round changes nothing rather than to")
print("guess a smaller number.")
`,
          output: `edges                                             distances           rounds used  hops needed
[0->1:1, 0->2:2, 2->1:-2, 1->3:1]                 [0, 0, 2, 1]                  2            3
[0->1:4, 0->2:1, 2->1:1, 1->3:1]                  [0, 2, 1, 3]                  2            3
[0->1:3, 1->2:-1, 2->3:2, 3->4:-2, 0->4:5]        [0, 3, 2, 4, 2]               2            4

chain of       edges  rounds used  hops needed  last, n-1 rounds  last, n-2 rounds
4                  3            3            3               [3]               [-]
8                  7            7            7               [7]               [-]
16                15           15           15              [15]               [-]
32                31           31           31              [31]               [-]

over 3000 random graphs with weights from -3 to 5:
  had a negative cycle, skipped           706
  n-1 rounds matched every simple path   2294
  n-2 rounds matched it                  2294
  n-2 rounds reported something high        0
  a full round changed nothing early     1436
  rounds run against rounds allowed      3668    6253

The bound is tight and almost never reached. On the 2294 graphs kept, n-1
rounds were always enough and the loop stopped early on most of them,
running 3668 rounds where 6253 were allowed. On these small random
graphs even n-2 rounds sufficed every time, coming up short on 0 of
them -- which is exactly why this bound has to be reasoned about rather
than tested into existence.

The chain table is the worst case built on purpose. List the edges of a
path in reverse and every round propagates exactly one hop, so a chain of
32 nodes uses all 31 rounds -- and with one round fewer the far end is
still unreached. That is the bound being tight, and it is why the honest
stopping rule is to run until a full round changes nothing rather than to
guess a smaller number.`,
          explanation:
            "Bellman-Ford scored against every simple path, with the round count measured against the bound and a chain that forces the worst case. The n-2 column on the chain is the bound being tight.",
          alternates: [
            {
              lang: "javascript",
              code: `// Bellman-Ford, and why the number of rounds is exactly n - 1.
//
// The algorithm gives up the greedy step entirely. It never declares anything
// final; it just relaxes every edge, over and over, and stops when a full round
// changes nothing. That makes it slower than Dijkstra and correct on graphs
// Dijkstra is wrong about.
//
// The round count is the part worth understanding rather than memorising. After
// k rounds, every distance reachable by a route of at most k edges is correct.
// A shortest route never repeats a node -- repeating one would mean going round
// a cycle, and a cycle either costs something, in which case dropping it is
// cheaper, or costs nothing, in which case dropping it is no worse. So a
// shortest route has at most n - 1 edges, and n - 1 rounds is enough.

const INF = 1000000000;

/** Relax every edge, the given number of times. No settled set anywhere. */
function bellmanFord(n, edges, start, rounds) {
  const best = new Array(n).fill(INF);
  best[start] = 0;
  let used = 0;
  for (let round = 0; round < rounds; round += 1) {
    let changed = false;
    for (const [u, v, w] of edges) {
      if (best[u] < INF && best[u] + w < best[v]) {
        best[v] = best[u] + w;
        changed = true;
      }
    }
    used += 1;
    if (!changed) break;
  }
  return [best, used];
}

/** The largest number of edges any shortest route actually uses. */
function hopsNeeded(n, edges, start) {
  const best = new Array(n).fill(INF);
  const hops = new Array(n).fill(0);
  best[start] = 0;
  for (let round = 0; round < n; round += 1) {
    let changed = false;
    for (const [u, v, w] of edges) {
      if (best[u] < INF && best[u] + w < best[v]) {
        best[v] = best[u] + w;
        hops[v] = hops[u] + 1;
        changed = true;
      }
    }
    if (!changed) break;
  }
  let most = 0;
  for (let v = 0; v < n; v += 1) {
    if (best[v] < INF && hops[v] > most) most = hops[v];
  }
  return most;
}

/** One extra round from an all-zero start: still improving means a loop pays. */
function hasNegativeCycle(n, edges) {
  const best = new Array(n).fill(0);
  for (let round = 0; round < n - 1; round += 1) {
    for (const [u, v, w] of edges) {
      if (best[u] + w < best[v]) best[v] = best[u] + w;
    }
  }
  for (const [u, v, w] of edges) {
    if (best[u] + w < best[v]) return true;
  }
  return false;
}

/** Every simple path. The definition. */
function cheapestByWalking(n, edges, start, target) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) neighbours[u].push([v, w]);
  let best = INF;
  const onPath = new Array(n).fill(false);

  function step(v, spent) {
    if (v === target && spent < best) best = spent;
    onPath[v] = true;
    for (const [u, w] of neighbours[v]) {
      if (!onPath[u]) step(u, spent + w);
    }
    onPath[v] = false;
  }

  step(start, 0);
  return best;
}

const show = (values) =>
  "[" + values.map((v) => (v >= INF ? "-" : String(v))).join(", ") + "]";
const showEdges = (edges) =>
  "[" + edges.map(([u, v, w]) => \`\${u}->\${v}:\${w}\`).join(", ") + "]";
const padEnd = (v, w) => String(v).padEnd(w);
const pad = (v, w) => String(v).padStart(w);

/** A path with its edges listed backwards, so one round propagates one hop. */
function chain(n) {
  const edges = [];
  for (let v = n - 2; v >= 0; v -= 1) edges.push([v, v + 1, 1]);
  return edges;
}

const CASES = [
  [4, [[0, 1, 1], [0, 2, 2], [2, 1, -2], [1, 3, 1]]],
  [4, [[0, 1, 4], [0, 2, 1], [2, 1, 1], [1, 3, 1]]],
  [5, [[0, 1, 3], [1, 2, -1], [2, 3, 2], [3, 4, -2], [0, 4, 5]]],
];

console.log(padEnd("edges", 50) + padEnd("distances", 18) + pad("rounds used", 13) + pad("hops needed", 13));
for (const [n, edges] of CASES) {
  const [best, used] = bellmanFord(n, edges, 0, n - 1);
  const truth = [];
  for (let t = 0; t < n; t += 1) truth.push(cheapestByWalking(n, edges, 0, t));
  if (show(best) !== show(truth)) console.log("MISMATCH");
  console.log(
    padEnd(showEdges(edges), 50) + padEnd(show(best), 18) + pad(used, 13) + pad(hopsNeeded(n, edges, 0), 13)
  );
}
console.log();

console.log(
  padEnd("chain of", 12) +
    pad("edges", 8) +
    pad("rounds used", 13) +
    pad("hops needed", 13) +
    pad("last, n-1 rounds", 18) +
    pad("last, n-2 rounds", 18)
);
for (const n of [4, 8, 16, 32]) {
  const edges = chain(n);
  const [full, used] = bellmanFord(n, edges, 0, n - 1);
  const [short] = bellmanFord(n, edges, 0, n - 2);
  console.log(
    padEnd(n, 12) +
      pad(edges.length, 8) +
      pad(used, 13) +
      pad(hopsNeeded(n, edges, 0), 13) +
      pad(show([full[n - 1]]), 18) +
      pad(show([short[n - 1]]), 18)
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
let skipped = 0;
let fullOk = 0;
let shortOk = 0;
let shortHigh = 0;
let earlySaved = 0;
let totalRounds = 0;
let totalAllowed = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(5);
  const edges = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v && rand(3) === 0) edges.push([u, v, rand(9) - 3]);
    }
  }
  if (hasNegativeCycle(n, edges)) {
    skipped += 1;
    continue;
  }
  const truth = [];
  for (let target = 0; target < n; target += 1) truth.push(cheapestByWalking(n, edges, 0, target));
  const [full, used] = bellmanFord(n, edges, 0, n - 1);
  const [short] = bellmanFord(n, edges, 0, Math.max(1, n - 2));
  let goodFull = true;
  let goodShort = true;
  let high = false;
  for (let target = 0; target < n; target += 1) {
    if (full[target] !== truth[target]) goodFull = false;
    if (short[target] !== truth[target]) {
      goodShort = false;
      if (short[target] > truth[target]) high = true;
    }
  }
  if (goodFull) fullOk += 1;
  if (goodShort) shortOk += 1;
  if (high) shortHigh += 1;
  totalRounds += used;
  totalAllowed += n - 1;
  if (used < n - 1) earlySaved += 1;
}

const kept = TRIALS - skipped;
console.log(\`over \${TRIALS} random graphs with weights from -3 to 5:\`);
console.log(\`  had a negative cycle, skipped        \${pad(skipped, 6)}\`);
console.log(\`  n-1 rounds matched every simple path \${pad(fullOk, 6)}\`);
console.log(\`  n-2 rounds matched it                \${pad(shortOk, 6)}\`);
console.log(\`  n-2 rounds reported something high   \${pad(shortHigh, 6)}\`);
console.log(\`  a full round changed nothing early   \${pad(earlySaved, 6)}\`);
console.log(\`  rounds run against rounds allowed    \${pad(totalRounds, 6)}\${pad(totalAllowed, 8)}\`);
console.log();
console.log(\`The bound is tight and almost never reached. On the \${kept} graphs kept, n-1\`);
console.log("rounds were always enough and the loop stopped early on most of them,");
console.log(\`running \${totalRounds} rounds where \${totalAllowed} were allowed. On these small random\`);
console.log(\`graphs even n-2 rounds sufficed every time, coming up short on \${kept - shortOk} of\`);
console.log("them -- which is exactly why this bound has to be reasoned about rather");
console.log("than tested into existence.");
console.log();
console.log("The chain table is the worst case built on purpose. List the edges of a");
console.log("path in reverse and every round propagates exactly one hop, so a chain of");
console.log("32 nodes uses all 31 rounds -- and with one round fewer the far end is");
console.log("still unreached. That is the bound being tight, and it is why the honest");
console.log("stopping rule is to run until a full round changes nothing rather than to");
console.log("guess a smaller number.");
`,
            },
            {
              lang: "typescript",
              code: `// Bellman-Ford, and why the number of rounds is exactly n - 1.
//
// The algorithm gives up the greedy step entirely. It never declares anything
// final; it just relaxes every edge, over and over, and stops when a full round
// changes nothing. That makes it slower than Dijkstra and correct on graphs
// Dijkstra is wrong about.
//
// The round count is the part worth understanding rather than memorising. After
// k rounds, every distance reachable by a route of at most k edges is correct.
// A shortest route never repeats a node -- repeating one would mean going round
// a cycle, and a cycle either costs something, in which case dropping it is
// cheaper, or costs nothing, in which case dropping it is no worse. So a
// shortest route has at most n - 1 edges, and n - 1 rounds is enough.

const INF = 1000000000;

type Weighted = [number, number, number];
type Link = [number, number];

/** Relax every edge, the given number of times. No settled set anywhere. */
function bellmanFord(n: number, edges: Weighted[], start: number, rounds: number): [number[], number] {
  const best = new Array(n).fill(INF);
  best[start] = 0;
  let used = 0;
  for (let round = 0; round < rounds; round += 1) {
    let changed = false;
    for (const [u, v, w] of edges) {
      if (best[u] < INF && best[u] + w < best[v]) {
        best[v] = best[u] + w;
        changed = true;
      }
    }
    used += 1;
    if (!changed) break;
  }
  return [best, used];
}

/** The largest number of edges any shortest route actually uses. */
function hopsNeeded(n: number, edges: Weighted[], start: number): number {
  const best = new Array(n).fill(INF);
  const hops = new Array(n).fill(0);
  best[start] = 0;
  for (let round = 0; round < n; round += 1) {
    let changed = false;
    for (const [u, v, w] of edges) {
      if (best[u] < INF && best[u] + w < best[v]) {
        best[v] = best[u] + w;
        hops[v] = hops[u] + 1;
        changed = true;
      }
    }
    if (!changed) break;
  }
  let most = 0;
  for (let v = 0; v < n; v += 1) {
    if (best[v] < INF && hops[v] > most) most = hops[v];
  }
  return most;
}

/** One extra round from an all-zero start: still improving means a loop pays. */
function hasNegativeCycle(n: number, edges: Weighted[]): boolean {
  const best = new Array(n).fill(0);
  for (let round = 0; round < n - 1; round += 1) {
    for (const [u, v, w] of edges) {
      if (best[u] + w < best[v]) best[v] = best[u] + w;
    }
  }
  for (const [u, v, w] of edges) {
    if (best[u] + w < best[v]) return true;
  }
  return false;
}

/** Every simple path. The definition. */
function cheapestByWalking(n: number, edges: Weighted[], start: number, target: number): number {
  const neighbours: Link[][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) neighbours[u].push([v, w]);
  let best = INF;
  const onPath = new Array(n).fill(false);

  function step(v: number, spent: number): void {
    if (v === target && spent < best) best = spent;
    onPath[v] = true;
    for (const [u, w] of neighbours[v]) {
      if (!onPath[u]) step(u, spent + w);
    }
    onPath[v] = false;
  }

  step(start, 0);
  return best;
}

const show = (values: number[]): string =>
  "[" + values.map((v) => (v >= INF ? "-" : String(v))).join(", ") + "]";
const showEdges = (edges: Weighted[]): string =>
  "[" + edges.map(([u, v, w]) => \`\${u}->\${v}:\${w}\`).join(", ") + "]";
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const pad = (v: string | number, w: number): string => String(v).padStart(w);

/** A path with its edges listed backwards, so one round propagates one hop. */
function chain(n: number): Weighted[] {
  const edges: Weighted[] = [];
  for (let v = n - 2; v >= 0; v -= 1) edges.push([v, v + 1, 1]);
  return edges;
}

const CASES: [number, Weighted[]][] = [
  [4, [[0, 1, 1], [0, 2, 2], [2, 1, -2], [1, 3, 1]]],
  [4, [[0, 1, 4], [0, 2, 1], [2, 1, 1], [1, 3, 1]]],
  [5, [[0, 1, 3], [1, 2, -1], [2, 3, 2], [3, 4, -2], [0, 4, 5]]],
];

console.log(padEnd("edges", 50) + padEnd("distances", 18) + pad("rounds used", 13) + pad("hops needed", 13));
for (const [n, edges] of CASES) {
  const [best, used] = bellmanFord(n, edges, 0, n - 1);
  const truth: number[] = [];
  for (let t = 0; t < n; t += 1) truth.push(cheapestByWalking(n, edges, 0, t));
  if (show(best) !== show(truth)) console.log("MISMATCH");
  console.log(
    padEnd(showEdges(edges), 50) + padEnd(show(best), 18) + pad(used, 13) + pad(hopsNeeded(n, edges, 0), 13)
  );
}
console.log();

console.log(
  padEnd("chain of", 12) +
    pad("edges", 8) +
    pad("rounds used", 13) +
    pad("hops needed", 13) +
    pad("last, n-1 rounds", 18) +
    pad("last, n-2 rounds", 18)
);
for (const n of [4, 8, 16, 32]) {
  const edges = chain(n);
  const [full, used] = bellmanFord(n, edges, 0, n - 1);
  const [short] = bellmanFord(n, edges, 0, n - 2);
  console.log(
    padEnd(n, 12) +
      pad(edges.length, 8) +
      pad(used, 13) +
      pad(hopsNeeded(n, edges, 0), 13) +
      pad(show([full[n - 1]]), 18) +
      pad(show([short[n - 1]]), 18)
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
let skipped = 0;
let fullOk = 0;
let shortOk = 0;
let shortHigh = 0;
let earlySaved = 0;
let totalRounds = 0;
let totalAllowed = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(5);
  const edges: Weighted[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v && rand(3) === 0) edges.push([u, v, rand(9) - 3]);
    }
  }
  if (hasNegativeCycle(n, edges)) {
    skipped += 1;
    continue;
  }
  const truth: number[] = [];
  for (let target = 0; target < n; target += 1) truth.push(cheapestByWalking(n, edges, 0, target));
  const [full, used] = bellmanFord(n, edges, 0, n - 1);
  const [short] = bellmanFord(n, edges, 0, Math.max(1, n - 2));
  let goodFull = true;
  let goodShort = true;
  let high = false;
  for (let target = 0; target < n; target += 1) {
    if (full[target] !== truth[target]) goodFull = false;
    if (short[target] !== truth[target]) {
      goodShort = false;
      if (short[target] > truth[target]) high = true;
    }
  }
  if (goodFull) fullOk += 1;
  if (goodShort) shortOk += 1;
  if (high) shortHigh += 1;
  totalRounds += used;
  totalAllowed += n - 1;
  if (used < n - 1) earlySaved += 1;
}

const kept = TRIALS - skipped;
console.log(\`over \${TRIALS} random graphs with weights from -3 to 5:\`);
console.log(\`  had a negative cycle, skipped        \${pad(skipped, 6)}\`);
console.log(\`  n-1 rounds matched every simple path \${pad(fullOk, 6)}\`);
console.log(\`  n-2 rounds matched it                \${pad(shortOk, 6)}\`);
console.log(\`  n-2 rounds reported something high   \${pad(shortHigh, 6)}\`);
console.log(\`  a full round changed nothing early   \${pad(earlySaved, 6)}\`);
console.log(\`  rounds run against rounds allowed    \${pad(totalRounds, 6)}\${pad(totalAllowed, 8)}\`);
console.log();
console.log(\`The bound is tight and almost never reached. On the \${kept} graphs kept, n-1\`);
console.log("rounds were always enough and the loop stopped early on most of them,");
console.log(\`running \${totalRounds} rounds where \${totalAllowed} were allowed. On these small random\`);
console.log(\`graphs even n-2 rounds sufficed every time, coming up short on \${kept - shortOk} of\`);
console.log("them -- which is exactly why this bound has to be reasoned about rather");
console.log("than tested into existence.");
console.log();
console.log("The chain table is the worst case built on purpose. List the edges of a");
console.log("path in reverse and every round propagates exactly one hop, so a chain of");
console.log("32 nodes uses all 31 rounds -- and with one round fewer the far end is");
console.log("still unreached. That is the bound being tight, and it is why the honest");
console.log("stopping rule is to run until a full round changes nothing rather than to");
console.log("guess a smaller number.");
`,
            },
            {
              lang: "java",
              code: `// Bellman-Ford, and why the number of rounds is exactly n - 1.
//
// The algorithm gives up the greedy step entirely. It never declares anything
// final; it just relaxes every edge, over and over, and stops when a full round
// changes nothing. That makes it slower than Dijkstra and correct on graphs
// Dijkstra is wrong about.
//
// The round count is the part worth understanding rather than memorising. After
// k rounds, every distance reachable by a route of at most k edges is correct.
// A shortest route never repeats a node -- repeating one would mean going round
// a cycle, and a cycle either costs something, in which case dropping it is
// cheaper, or costs nothing, in which case dropping it is no worse. So a
// shortest route has at most n - 1 edges, and n - 1 rounds is enough.

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {

    static final int INF = 1000000000;

    static int[] lastBest;
    static int lastUsed;

    /** Relax every edge, the given number of times. No settled set anywhere. */
    static void bellmanFord(int n, int[][] edges, int start, int rounds) {
        int[] best = new int[n];
        Arrays.fill(best, INF);
        best[start] = 0;
        int used = 0;
        for (int round = 0; round < rounds; round++) {
            boolean changed = false;
            for (int[] e : edges) {
                if (best[e[0]] < INF && best[e[0]] + e[2] < best[e[1]]) {
                    best[e[1]] = best[e[0]] + e[2];
                    changed = true;
                }
            }
            used++;
            if (!changed) {
                break;
            }
        }
        lastBest = best;
        lastUsed = used;
    }

    /** The largest number of edges any shortest route actually uses. */
    static int hopsNeeded(int n, int[][] edges, int start) {
        int[] best = new int[n];
        Arrays.fill(best, INF);
        int[] hops = new int[n];
        best[start] = 0;
        for (int round = 0; round < n; round++) {
            boolean changed = false;
            for (int[] e : edges) {
                if (best[e[0]] < INF && best[e[0]] + e[2] < best[e[1]]) {
                    best[e[1]] = best[e[0]] + e[2];
                    hops[e[1]] = hops[e[0]] + 1;
                    changed = true;
                }
            }
            if (!changed) {
                break;
            }
        }
        int most = 0;
        for (int v = 0; v < n; v++) {
            if (best[v] < INF && hops[v] > most) {
                most = hops[v];
            }
        }
        return most;
    }

    /** One extra round from an all-zero start: still improving means a loop pays. */
    static boolean hasNegativeCycle(int n, int[][] edges) {
        int[] best = new int[n];
        for (int round = 0; round < n - 1; round++) {
            for (int[] e : edges) {
                if (best[e[0]] + e[2] < best[e[1]]) {
                    best[e[1]] = best[e[0]] + e[2];
                }
            }
        }
        for (int[] e : edges) {
            if (best[e[0]] + e[2] < best[e[1]]) {
                return true;
            }
        }
        return false;
    }

    static int walkBest;
    static boolean[] walkOnPath;

    static void step(List<List<int[]>> neighbours, int target, int v, int spent) {
        if (v == target && spent < walkBest) {
            walkBest = spent;
        }
        walkOnPath[v] = true;
        for (int[] link : neighbours.get(v)) {
            if (!walkOnPath[link[0]]) {
                step(neighbours, target, link[0], spent + link[1]);
            }
        }
        walkOnPath[v] = false;
    }

    /** Every simple path. The definition. */
    static int cheapestByWalking(int n, int[][] edges, int start, int target) {
        List<List<int[]>> neighbours = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            neighbours.add(new ArrayList<>());
        }
        for (int[] e : edges) {
            neighbours.get(e[0]).add(new int[] {e[1], e[2]});
        }
        walkBest = INF;
        walkOnPath = new boolean[n];
        step(neighbours, target, start, 0);
        return walkBest;
    }

    static String show(int[] values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.length; i++) {
            if (i > 0) {
                sb.append(", ");
            }
            sb.append(values[i] >= INF ? "-" : String.valueOf(values[i]));
        }
        return sb.append("]").toString();
    }

    static String showEdges(int[][] edges) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < edges.length; i++) {
            if (i > 0) {
                sb.append(", ");
            }
            sb.append(edges[i][0]).append("->").append(edges[i][1]).append(":").append(edges[i][2]);
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

    /** A path with its edges listed backwards, so one round propagates one hop. */
    static int[][] chain(int n) {
        int[][] edges = new int[n - 1][3];
        int at = 0;
        for (int v = n - 2; v >= 0; v--) {
            edges[at] = new int[] {v, v + 1, 1};
            at++;
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
        int[] sizes = {4, 4, 5};
        int[][][] cases = {
            {{0, 1, 1}, {0, 2, 2}, {2, 1, -2}, {1, 3, 1}},
            {{0, 1, 4}, {0, 2, 1}, {2, 1, 1}, {1, 3, 1}},
            {{0, 1, 3}, {1, 2, -1}, {2, 3, 2}, {3, 4, -2}, {0, 4, 5}},
        };

        System.out.println(padEnd("edges", 50) + padEnd("distances", 18)
                + pad("rounds used", 13) + pad("hops needed", 13));
        for (int c = 0; c < sizes.length; c++) {
            int n = sizes[c];
            bellmanFord(n, cases[c], 0, n - 1);
            int[] best = lastBest;
            int used = lastUsed;
            int[] truth = new int[n];
            for (int t = 0; t < n; t++) {
                truth[t] = cheapestByWalking(n, cases[c], 0, t);
            }
            if (!show(best).equals(show(truth))) {
                System.out.println("MISMATCH");
            }
            System.out.println(padEnd(showEdges(cases[c]), 50) + padEnd(show(best), 18)
                    + pad(String.valueOf(used), 13)
                    + pad(String.valueOf(hopsNeeded(n, cases[c], 0)), 13));
        }
        System.out.println();

        System.out.println(padEnd("chain of", 12) + pad("edges", 8) + pad("rounds used", 13)
                + pad("hops needed", 13) + pad("last, n-1 rounds", 18) + pad("last, n-2 rounds", 18));
        int[] chainSizes = {4, 8, 16, 32};
        for (int n : chainSizes) {
            int[][] edges = chain(n);
            bellmanFord(n, edges, 0, n - 1);
            int[] full = lastBest;
            int used = lastUsed;
            bellmanFord(n, edges, 0, n - 2);
            int[] shortRun = lastBest;
            System.out.println(padEnd(String.valueOf(n), 12) + pad(String.valueOf(edges.length), 8)
                    + pad(String.valueOf(used), 13) + pad(String.valueOf(hopsNeeded(n, edges, 0)), 13)
                    + pad(show(new int[] {full[n - 1]}), 18)
                    + pad(show(new int[] {shortRun[n - 1]}), 18));
        }
        System.out.println();

        int trials = 3000;
        int skipped = 0;
        int fullOk = 0;
        int shortOk = 0;
        int shortHigh = 0;
        int earlySaved = 0;
        int totalRounds = 0;
        int totalAllowed = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(5);
            List<int[]> collected = new ArrayList<>();
            for (int u = 0; u < n; u++) {
                for (int v = 0; v < n; v++) {
                    if (u != v && rand(3) == 0) {
                        collected.add(new int[] {u, v, rand(9) - 3});
                    }
                }
            }
            int[][] edges = collected.toArray(new int[0][]);
            if (hasNegativeCycle(n, edges)) {
                skipped++;
                continue;
            }
            int[] truth = new int[n];
            for (int target = 0; target < n; target++) {
                truth[target] = cheapestByWalking(n, edges, 0, target);
            }
            bellmanFord(n, edges, 0, n - 1);
            int[] full = lastBest;
            int used = lastUsed;
            bellmanFord(n, edges, 0, Math.max(1, n - 2));
            int[] shortRun = lastBest;
            boolean goodFull = true;
            boolean goodShort = true;
            boolean high = false;
            for (int target = 0; target < n; target++) {
                if (full[target] != truth[target]) {
                    goodFull = false;
                }
                if (shortRun[target] != truth[target]) {
                    goodShort = false;
                    if (shortRun[target] > truth[target]) {
                        high = true;
                    }
                }
            }
            if (goodFull) {
                fullOk++;
            }
            if (goodShort) {
                shortOk++;
            }
            if (high) {
                shortHigh++;
            }
            totalRounds += used;
            totalAllowed += n - 1;
            if (used < n - 1) {
                earlySaved++;
            }
        }

        int kept = trials - skipped;
        System.out.println("over " + trials + " random graphs with weights from -3 to 5:");
        System.out.println("  had a negative cycle, skipped        " + pad(String.valueOf(skipped), 6));
        System.out.println("  n-1 rounds matched every simple path " + pad(String.valueOf(fullOk), 6));
        System.out.println("  n-2 rounds matched it                " + pad(String.valueOf(shortOk), 6));
        System.out.println("  n-2 rounds reported something high   " + pad(String.valueOf(shortHigh), 6));
        System.out.println("  a full round changed nothing early   " + pad(String.valueOf(earlySaved), 6));
        System.out.println("  rounds run against rounds allowed    " + pad(String.valueOf(totalRounds), 6)
                + pad(String.valueOf(totalAllowed), 8));
        System.out.println();
        System.out.println("The bound is tight and almost never reached. On the " + kept + " graphs kept, n-1");
        System.out.println("rounds were always enough and the loop stopped early on most of them,");
        System.out.println("running " + totalRounds + " rounds where " + totalAllowed + " were allowed. On these small random");
        System.out.println("graphs even n-2 rounds sufficed every time, coming up short on " + (kept - shortOk) + " of");
        System.out.println("them -- which is exactly why this bound has to be reasoned about rather");
        System.out.println("than tested into existence.");
        System.out.println();
        System.out.println("The chain table is the worst case built on purpose. List the edges of a");
        System.out.println("path in reverse and every round propagates exactly one hop, so a chain of");
        System.out.println("32 nodes uses all 31 rounds -- and with one round fewer the far end is");
        System.out.println("still unreached. That is the bound being tight, and it is why the honest");
        System.out.println("stopping rule is to run until a full round changes nothing rather than to");
        System.out.println("guess a smaller number.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Bellman-Ford, and why the number of rounds is exactly n - 1.
//
// The algorithm gives up the greedy step entirely. It never declares anything
// final; it just relaxes every edge, over and over, and stops when a full round
// changes nothing. That makes it slower than Dijkstra and correct on graphs
// Dijkstra is wrong about.
//
// The round count is the part worth understanding rather than memorising. After
// k rounds, every distance reachable by a route of at most k edges is correct.
// A shortest route never repeats a node -- repeating one would mean going round
// a cycle, and a cycle either costs something, in which case dropping it is
// cheaper, or costs nothing, in which case dropping it is no worse. So a
// shortest route has at most n - 1 edges, and n - 1 rounds is enough.

#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

const int INF = 1000000000;

struct Weighted {
    int from;
    int to;
    int cost;
};

using Link = std::pair<int, int>;

// Relax every edge, the given number of times. No settled set anywhere.
int bellman_ford(int n, const std::vector<Weighted>& edges, int start, int rounds,
                 std::vector<int>& best) {
    best.assign(n, INF);
    best[start] = 0;
    int used = 0;
    for (int round = 0; round < rounds; round++) {
        bool changed = false;
        for (const Weighted& e : edges) {
            if (best[e.from] < INF && best[e.from] + e.cost < best[e.to]) {
                best[e.to] = best[e.from] + e.cost;
                changed = true;
            }
        }
        used++;
        if (!changed) {
            break;
        }
    }
    return used;
}

// The largest number of edges any shortest route actually uses.
int hops_needed(int n, const std::vector<Weighted>& edges, int start) {
    std::vector<int> best(n, INF);
    std::vector<int> hops(n, 0);
    best[start] = 0;
    for (int round = 0; round < n; round++) {
        bool changed = false;
        for (const Weighted& e : edges) {
            if (best[e.from] < INF && best[e.from] + e.cost < best[e.to]) {
                best[e.to] = best[e.from] + e.cost;
                hops[e.to] = hops[e.from] + 1;
                changed = true;
            }
        }
        if (!changed) {
            break;
        }
    }
    int most = 0;
    for (int v = 0; v < n; v++) {
        if (best[v] < INF && hops[v] > most) {
            most = hops[v];
        }
    }
    return most;
}

// One extra round from an all-zero start: still improving means a loop pays.
bool has_negative_cycle(int n, const std::vector<Weighted>& edges) {
    std::vector<int> best(n, 0);
    for (int round = 0; round < n - 1; round++) {
        for (const Weighted& e : edges) {
            if (best[e.from] + e.cost < best[e.to]) {
                best[e.to] = best[e.from] + e.cost;
            }
        }
    }
    for (const Weighted& e : edges) {
        if (best[e.from] + e.cost < best[e.to]) {
            return true;
        }
    }
    return false;
}

void step(const std::vector<std::vector<Link>>& neighbours, std::vector<char>& on_path,
          int& best, int target, int v, int spent) {
    if (v == target && spent < best) {
        best = spent;
    }
    on_path[v] = 1;
    for (const Link& l : neighbours[v]) {
        if (!on_path[l.first]) {
            step(neighbours, on_path, best, target, l.first, spent + l.second);
        }
    }
    on_path[v] = 0;
}

// Every simple path. The definition.
int cheapest_by_walking(int n, const std::vector<Weighted>& edges, int start, int target) {
    std::vector<std::vector<Link>> neighbours(n);
    for (const Weighted& e : edges) {
        neighbours[e.from].push_back(Link(e.to, e.cost));
    }
    int best = INF;
    std::vector<char> on_path(n, 0);
    step(neighbours, on_path, best, target, start, 0);
    return best;
}

std::string show(const std::vector<int>& values) {
    std::string out = "[";
    for (size_t i = 0; i < values.size(); i++) {
        if (i > 0) {
            out += ", ";
        }
        out += (values[i] >= INF) ? std::string("-") : std::to_string(values[i]);
    }
    return out + "]";
}

std::string show_edges(const std::vector<Weighted>& edges) {
    std::string out = "[";
    for (size_t i = 0; i < edges.size(); i++) {
        if (i > 0) {
            out += ", ";
        }
        out += std::to_string(edges[i].from) + "->" + std::to_string(edges[i].to)
                + ":" + std::to_string(edges[i].cost);
    }
    return out + "]";
}

// A path with its edges listed backwards, so one round propagates one hop.
std::vector<Weighted> chain(int n) {
    std::vector<Weighted> edges;
    for (int v = n - 2; v >= 0; v--) {
        Weighted e;
        e.from = v;
        e.to = v + 1;
        e.cost = 1;
        edges.push_back(e);
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
    std::vector<int> sizes = {4, 4, 5};
    std::vector<std::vector<Weighted>> cases = {
        {{0, 1, 1}, {0, 2, 2}, {2, 1, -2}, {1, 3, 1}},
        {{0, 1, 4}, {0, 2, 1}, {2, 1, 1}, {1, 3, 1}},
        {{0, 1, 3}, {1, 2, -1}, {2, 3, 2}, {3, 4, -2}, {0, 4, 5}},
    };

    std::cout << std::left << std::setw(50) << "edges" << std::setw(18) << "distances"
              << std::right << std::setw(13) << "rounds used"
              << std::setw(13) << "hops needed" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        int n = sizes[c];
        std::vector<int> best;
        int used = bellman_ford(n, cases[c], 0, n - 1, best);
        std::vector<int> truth(n);
        for (int t = 0; t < n; t++) {
            truth[t] = cheapest_by_walking(n, cases[c], 0, t);
        }
        if (show(best) != show(truth)) {
            std::cout << "MISMATCH\\n";
        }
        std::cout << std::left << std::setw(50) << show_edges(cases[c]) << std::setw(18) << show(best)
                  << std::right << std::setw(13) << used
                  << std::setw(13) << hops_needed(n, cases[c], 0) << "\\n";
    }
    std::cout << "\\n";

    std::cout << std::left << std::setw(12) << "chain of" << std::right << std::setw(8) << "edges"
              << std::setw(13) << "rounds used" << std::setw(13) << "hops needed"
              << std::setw(18) << "last, n-1 rounds" << std::setw(18) << "last, n-2 rounds" << "\\n";
    std::vector<int> chain_sizes = {4, 8, 16, 32};
    for (int n : chain_sizes) {
        std::vector<Weighted> edges = chain(n);
        std::vector<int> full;
        int used = bellman_ford(n, edges, 0, n - 1, full);
        std::vector<int> short_run;
        bellman_ford(n, edges, 0, n - 2, short_run);
        std::vector<int> a;
        a.push_back(full[n - 1]);
        std::vector<int> b;
        b.push_back(short_run[n - 1]);
        std::cout << std::left << std::setw(12) << n << std::right << std::setw(8) << edges.size()
                  << std::setw(13) << used << std::setw(13) << hops_needed(n, edges, 0)
                  << std::setw(18) << show(a) << std::setw(18) << show(b) << "\\n";
    }
    std::cout << "\\n";

    int trials = 3000;
    int skipped = 0;
    int full_ok = 0;
    int short_ok = 0;
    int short_high = 0;
    int early_saved = 0;
    int total_rounds = 0;
    int total_allowed = 0;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(5);
        std::vector<Weighted> edges;
        for (int u = 0; u < n; u++) {
            for (int v = 0; v < n; v++) {
                if (u != v && rand_below(3) == 0) {
                    Weighted e;
                    e.from = u;
                    e.to = v;
                    e.cost = rand_below(9) - 3;
                    edges.push_back(e);
                }
            }
        }
        if (has_negative_cycle(n, edges)) {
            skipped++;
            continue;
        }
        std::vector<int> truth(n);
        for (int target = 0; target < n; target++) {
            truth[target] = cheapest_by_walking(n, edges, 0, target);
        }
        std::vector<int> full;
        int used = bellman_ford(n, edges, 0, n - 1, full);
        std::vector<int> short_run;
        int short_rounds = n - 2 < 1 ? 1 : n - 2;
        bellman_ford(n, edges, 0, short_rounds, short_run);
        bool good_full = true;
        bool good_short = true;
        bool high = false;
        for (int target = 0; target < n; target++) {
            if (full[target] != truth[target]) {
                good_full = false;
            }
            if (short_run[target] != truth[target]) {
                good_short = false;
                if (short_run[target] > truth[target]) {
                    high = true;
                }
            }
        }
        if (good_full) {
            full_ok++;
        }
        if (good_short) {
            short_ok++;
        }
        if (high) {
            short_high++;
        }
        total_rounds += used;
        total_allowed += n - 1;
        if (used < n - 1) {
            early_saved++;
        }
    }

    int kept = trials - skipped;
    std::cout << "over " << trials << " random graphs with weights from -3 to 5:\\n";
    std::cout << "  had a negative cycle, skipped        " << std::setw(6) << skipped << "\\n";
    std::cout << "  n-1 rounds matched every simple path " << std::setw(6) << full_ok << "\\n";
    std::cout << "  n-2 rounds matched it                " << std::setw(6) << short_ok << "\\n";
    std::cout << "  n-2 rounds reported something high   " << std::setw(6) << short_high << "\\n";
    std::cout << "  a full round changed nothing early   " << std::setw(6) << early_saved << "\\n";
    std::cout << "  rounds run against rounds allowed    " << std::setw(6) << total_rounds
              << std::setw(8) << total_allowed << "\\n";
    std::cout << "\\n";
    std::cout << "The bound is tight and almost never reached. On the " << kept << " graphs kept, n-1\\n";
    std::cout << "rounds were always enough and the loop stopped early on most of them,\\n";
    std::cout << "running " << total_rounds << " rounds where " << total_allowed << " were allowed. On these small random\\n";
    std::cout << "graphs even n-2 rounds sufficed every time, coming up short on " << (kept - short_ok) << " of\\n";
    std::cout << "them -- which is exactly why this bound has to be reasoned about rather\\n";
    std::cout << "than tested into existence.\\n";
    std::cout << "\\n";
    std::cout << "The chain table is the worst case built on purpose. List the edges of a\\n";
    std::cout << "path in reverse and every round propagates exactly one hop, so a chain of\\n";
    std::cout << "32 nodes uses all 31 rounds -- and with one round fewer the far end is\\n";
    std::cout << "still unreached. That is the bound being tight, and it is why the honest\\n";
    std::cout << "stopping rule is to run until a full round changes nothing rather than to\\n";
    std::cout << "guess a smaller number.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Bellman-Ford, and why the number of rounds is exactly n - 1.
//
// The algorithm gives up the greedy step entirely. It never declares anything
// final; it just relaxes every edge, over and over, and stops when a full round
// changes nothing. That makes it slower than Dijkstra and correct on graphs
// Dijkstra is wrong about.
//
// The round count is the part worth understanding rather than memorising. After
// k rounds, every distance reachable by a route of at most k edges is correct.
// A shortest route never repeats a node -- repeating one would mean going round
// a cycle, and a cycle either costs something, in which case dropping it is
// cheaper, or costs nothing, in which case dropping it is no worse. So a
// shortest route has at most n - 1 edges, and n - 1 rounds is enough.

const INF: i64 = 1_000_000_000;

/// Relax every edge, the given number of times. No settled set anywhere.
fn bellman_ford(n: usize, edges: &[(usize, usize, i64)], start: usize, rounds: usize) -> (Vec<i64>, usize) {
    let mut best = vec![INF; n];
    best[start] = 0;
    let mut used = 0;
    for _ in 0..rounds {
        let mut changed = false;
        for &(u, v, w) in edges {
            if best[u] < INF && best[u] + w < best[v] {
                best[v] = best[u] + w;
                changed = true;
            }
        }
        used += 1;
        if !changed {
            break;
        }
    }
    (best, used)
}

/// The largest number of edges any shortest route actually uses.
fn hops_needed(n: usize, edges: &[(usize, usize, i64)], start: usize) -> usize {
    let mut best = vec![INF; n];
    let mut hops = vec![0usize; n];
    best[start] = 0;
    for _ in 0..n {
        let mut changed = false;
        for &(u, v, w) in edges {
            if best[u] < INF && best[u] + w < best[v] {
                best[v] = best[u] + w;
                hops[v] = hops[u] + 1;
                changed = true;
            }
        }
        if !changed {
            break;
        }
    }
    let mut most = 0;
    for v in 0..n {
        if best[v] < INF && hops[v] > most {
            most = hops[v];
        }
    }
    most
}

/// One extra round from an all-zero start: still improving means a loop pays.
fn has_negative_cycle(n: usize, edges: &[(usize, usize, i64)]) -> bool {
    let mut best = vec![0i64; n];
    for _ in 0..n.saturating_sub(1) {
        for &(u, v, w) in edges {
            if best[u] + w < best[v] {
                best[v] = best[u] + w;
            }
        }
    }
    for &(u, v, w) in edges {
        if best[u] + w < best[v] {
            return true;
        }
    }
    false
}

fn step(
    neighbours: &[Vec<(usize, i64)>],
    on_path: &mut Vec<bool>,
    best: &mut i64,
    target: usize,
    v: usize,
    spent: i64,
) {
    if v == target && spent < *best {
        *best = spent;
    }
    on_path[v] = true;
    for i in 0..neighbours[v].len() {
        let (u, w) = neighbours[v][i];
        if !on_path[u] {
            step(neighbours, on_path, best, target, u, spent + w);
        }
    }
    on_path[v] = false;
}

/// Every simple path. The definition.
fn cheapest_by_walking(n: usize, edges: &[(usize, usize, i64)], start: usize, target: usize) -> i64 {
    let mut neighbours = vec![Vec::new(); n];
    for &(u, v, w) in edges {
        neighbours[u].push((v, w));
    }
    let mut best = INF;
    let mut on_path = vec![false; n];
    step(&neighbours, &mut on_path, &mut best, target, start, 0);
    best
}

fn show(values: &[i64]) -> String {
    let parts: Vec<String> = values
        .iter()
        .map(|&v| if v >= INF { String::from("-") } else { v.to_string() })
        .collect();
    format!("[{}]", parts.join(", "))
}

fn show_edges(edges: &[(usize, usize, i64)]) -> String {
    let parts: Vec<String> = edges
        .iter()
        .map(|&(u, v, w)| format!("{}->{}:{}", u, v, w))
        .collect();
    format!("[{}]", parts.join(", "))
}

/// A path with its edges listed backwards, so one round propagates one hop.
fn chain(n: usize) -> Vec<(usize, usize, i64)> {
    (0..n - 1).rev().map(|v| (v, v + 1, 1i64)).collect()
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
    let sizes: Vec<usize> = vec![4, 4, 5];
    let cases: Vec<Vec<(usize, usize, i64)>> = vec![
        vec![(0, 1, 1), (0, 2, 2), (2, 1, -2), (1, 3, 1)],
        vec![(0, 1, 4), (0, 2, 1), (2, 1, 1), (1, 3, 1)],
        vec![(0, 1, 3), (1, 2, -1), (2, 3, 2), (3, 4, -2), (0, 4, 5)],
    ];

    println!(
        "{}{}{}{}",
        pad_right("edges", 50),
        pad_right("distances", 18),
        pad_left("rounds used", 13),
        pad_left("hops needed", 13)
    );
    for (c, edges) in cases.iter().enumerate() {
        let n = sizes[c];
        let (best, used) = bellman_ford(n, edges, 0, n - 1);
        let truth: Vec<i64> = (0..n).map(|t| cheapest_by_walking(n, edges, 0, t)).collect();
        if show(&best) != show(&truth) {
            println!("MISMATCH");
        }
        println!(
            "{}{}{}{}",
            pad_right(&show_edges(edges), 50),
            pad_right(&show(&best), 18),
            pad_left(&used.to_string(), 13),
            pad_left(&hops_needed(n, edges, 0).to_string(), 13)
        );
    }
    println!();

    println!(
        "{}{}{}{}{}{}",
        pad_right("chain of", 12),
        pad_left("edges", 8),
        pad_left("rounds used", 13),
        pad_left("hops needed", 13),
        pad_left("last, n-1 rounds", 18),
        pad_left("last, n-2 rounds", 18)
    );
    for n in [4usize, 8, 16, 32] {
        let edges = chain(n);
        let (full, used) = bellman_ford(n, &edges, 0, n - 1);
        let (short_run, _) = bellman_ford(n, &edges, 0, n - 2);
        println!(
            "{}{}{}{}{}{}",
            pad_right(&n.to_string(), 12),
            pad_left(&edges.len().to_string(), 8),
            pad_left(&used.to_string(), 13),
            pad_left(&hops_needed(n, &edges, 0).to_string(), 13),
            pad_left(&show(&[full[n - 1]]), 18),
            pad_left(&show(&[short_run[n - 1]]), 18)
        );
    }
    println!();

    let mut rng = Rng { seed: 1 };
    let trials = 3000;
    let mut skipped = 0;
    let mut full_ok = 0;
    let mut short_ok = 0;
    let mut short_high = 0;
    let mut early_saved = 0;
    let mut total_rounds = 0usize;
    let mut total_allowed = 0usize;
    for _ in 0..trials {
        let n = (2 + rng.next(5)) as usize;
        let mut edges: Vec<(usize, usize, i64)> = Vec::new();
        for u in 0..n {
            for v in 0..n {
                if u != v && rng.next(3) == 0 {
                    let w = rng.next(9) - 3;
                    edges.push((u, v, w));
                }
            }
        }
        if has_negative_cycle(n, &edges) {
            skipped += 1;
            continue;
        }
        let truth: Vec<i64> = (0..n).map(|t| cheapest_by_walking(n, &edges, 0, t)).collect();
        let (full, used) = bellman_ford(n, &edges, 0, n - 1);
        let short_rounds = if n >= 3 { n - 2 } else { 1 };
        let (short_run, _) = bellman_ford(n, &edges, 0, short_rounds);
        let mut good_full = true;
        let mut good_short = true;
        let mut high = false;
        for target in 0..n {
            if full[target] != truth[target] {
                good_full = false;
            }
            if short_run[target] != truth[target] {
                good_short = false;
                if short_run[target] > truth[target] {
                    high = true;
                }
            }
        }
        if good_full {
            full_ok += 1;
        }
        if good_short {
            short_ok += 1;
        }
        if high {
            short_high += 1;
        }
        total_rounds += used;
        total_allowed += n - 1;
        if used < n - 1 {
            early_saved += 1;
        }
    }

    let kept = trials - skipped;
    println!("over {} random graphs with weights from -3 to 5:", trials);
    println!("  had a negative cycle, skipped        {}", pad_left(&skipped.to_string(), 6));
    println!("  n-1 rounds matched every simple path {}", pad_left(&full_ok.to_string(), 6));
    println!("  n-2 rounds matched it                {}", pad_left(&short_ok.to_string(), 6));
    println!("  n-2 rounds reported something high   {}", pad_left(&short_high.to_string(), 6));
    println!("  a full round changed nothing early   {}", pad_left(&early_saved.to_string(), 6));
    println!(
        "  rounds run against rounds allowed    {}{}",
        pad_left(&total_rounds.to_string(), 6),
        pad_left(&total_allowed.to_string(), 8)
    );
    println!();
    println!("The bound is tight and almost never reached. On the {} graphs kept, n-1", kept);
    println!("rounds were always enough and the loop stopped early on most of them,");
    println!("running {} rounds where {} were allowed. On these small random", total_rounds, total_allowed);
    println!("graphs even n-2 rounds sufficed every time, coming up short on {} of", kept - short_ok);
    println!("them -- which is exactly why this bound has to be reasoned about rather");
    println!("than tested into existence.");
    println!();
    println!("The chain table is the worst case built on purpose. List the edges of a");
    println!("path in reverse and every round propagates exactly one hop, so a chain of");
    println!("32 nodes uses all 31 rounds -- and with one round fewer the far end is");
    println!("still unreached. That is the bound being tight, and it is why the honest");
    println!("stopping rule is to run until a full round changes nothing rather than to");
    println!("guess a smaller number.");
}
`,
            },
            {
              lang: "go",
              code: `// Bellman-Ford, and why the number of rounds is exactly n - 1.
//
// The algorithm gives up the greedy step entirely. It never declares anything
// final; it just relaxes every edge, over and over, and stops when a full round
// changes nothing. That makes it slower than Dijkstra and correct on graphs
// Dijkstra is wrong about.
//
// The round count is the part worth understanding rather than memorising. After
// k rounds, every distance reachable by a route of at most k edges is correct.
// A shortest route never repeats a node -- repeating one would mean going round
// a cycle, and a cycle either costs something, in which case dropping it is
// cheaper, or costs nothing, in which case dropping it is no worse. So a
// shortest route has at most n - 1 edges, and n - 1 rounds is enough.

package main

import (
	"fmt"
	"strings"
)

const inf = 1000000000

type weighted struct{ from, to, cost int }
type link struct{ to, cost int }

// Relax every edge, the given number of times. No settled set anywhere.
func bellmanFord(n int, edges []weighted, start, rounds int) ([]int, int) {
	best := make([]int, n)
	for i := range best {
		best[i] = inf
	}
	best[start] = 0
	used := 0
	for round := 0; round < rounds; round++ {
		changed := false
		for _, e := range edges {
			if best[e.from] < inf && best[e.from]+e.cost < best[e.to] {
				best[e.to] = best[e.from] + e.cost
				changed = true
			}
		}
		used++
		if !changed {
			break
		}
	}
	return best, used
}

// The largest number of edges any shortest route actually uses.
func hopsNeeded(n int, edges []weighted, start int) int {
	best := make([]int, n)
	for i := range best {
		best[i] = inf
	}
	hops := make([]int, n)
	best[start] = 0
	for round := 0; round < n; round++ {
		changed := false
		for _, e := range edges {
			if best[e.from] < inf && best[e.from]+e.cost < best[e.to] {
				best[e.to] = best[e.from] + e.cost
				hops[e.to] = hops[e.from] + 1
				changed = true
			}
		}
		if !changed {
			break
		}
	}
	most := 0
	for v := 0; v < n; v++ {
		if best[v] < inf && hops[v] > most {
			most = hops[v]
		}
	}
	return most
}

// One extra round from an all-zero start: still improving means a loop pays.
func hasNegativeCycle(n int, edges []weighted) bool {
	best := make([]int, n)
	for round := 0; round < n-1; round++ {
		for _, e := range edges {
			if best[e.from]+e.cost < best[e.to] {
				best[e.to] = best[e.from] + e.cost
			}
		}
	}
	for _, e := range edges {
		if best[e.from]+e.cost < best[e.to] {
			return true
		}
	}
	return false
}

// Every simple path. The definition.
func cheapestByWalking(n int, edges []weighted, start, target int) int {
	neighbours := make([][]link, n)
	for i := range neighbours {
		neighbours[i] = []link{}
	}
	for _, e := range edges {
		neighbours[e.from] = append(neighbours[e.from], link{e.to, e.cost})
	}
	best := inf
	onPath := make([]bool, n)
	var step func(v, spent int)
	step = func(v, spent int) {
		if v == target && spent < best {
			best = spent
		}
		onPath[v] = true
		for _, l := range neighbours[v] {
			if !onPath[l.to] {
				step(l.to, spent+l.cost)
			}
		}
		onPath[v] = false
	}
	step(start, 0)
	return best
}

func show(values []int) string {
	parts := make([]string, len(values))
	for i, v := range values {
		if v >= inf {
			parts[i] = "-"
		} else {
			parts[i] = fmt.Sprintf("%d", v)
		}
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func showEdges(edges []weighted) string {
	parts := make([]string, len(edges))
	for i, e := range edges {
		parts[i] = fmt.Sprintf("%d->%d:%d", e.from, e.to, e.cost)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

// A path with its edges listed backwards, so one round propagates one hop.
func chain(n int) []weighted {
	edges := []weighted{}
	for v := n - 2; v >= 0; v-- {
		edges = append(edges, weighted{v, v + 1, 1})
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
	sizes := []int{4, 4, 5}
	cases := [][]weighted{
		{{0, 1, 1}, {0, 2, 2}, {2, 1, -2}, {1, 3, 1}},
		{{0, 1, 4}, {0, 2, 1}, {2, 1, 1}, {1, 3, 1}},
		{{0, 1, 3}, {1, 2, -1}, {2, 3, 2}, {3, 4, -2}, {0, 4, 5}},
	}

	fmt.Printf("%-50s%-18s%13s%13s\\n", "edges", "distances", "rounds used", "hops needed")
	for c, edges := range cases {
		n := sizes[c]
		best, used := bellmanFord(n, edges, 0, n-1)
		truth := make([]int, n)
		for t := 0; t < n; t++ {
			truth[t] = cheapestByWalking(n, edges, 0, t)
		}
		if show(best) != show(truth) {
			fmt.Println("MISMATCH")
		}
		fmt.Printf("%-50s%-18s%13d%13d\\n", showEdges(edges), show(best), used, hopsNeeded(n, edges, 0))
	}
	fmt.Println()

	fmt.Printf("%-12s%8s%13s%13s%18s%18s\\n", "chain of", "edges", "rounds used",
		"hops needed", "last, n-1 rounds", "last, n-2 rounds")
	for _, n := range []int{4, 8, 16, 32} {
		edges := chain(n)
		full, used := bellmanFord(n, edges, 0, n-1)
		shortRun, _ := bellmanFord(n, edges, 0, n-2)
		fmt.Printf("%-12d%8d%13d%13d%18s%18s\\n", n, len(edges), used, hopsNeeded(n, edges, 0),
			show([]int{full[n-1]}), show([]int{shortRun[n-1]}))
	}
	fmt.Println()

	trials := 3000
	skipped := 0
	fullOk := 0
	shortOk := 0
	shortHigh := 0
	earlySaved := 0
	totalRounds := 0
	totalAllowed := 0
	for t := 0; t < trials; t++ {
		n := 2 + rand(5)
		edges := []weighted{}
		for u := 0; u < n; u++ {
			for v := 0; v < n; v++ {
				if u != v && rand(3) == 0 {
					edges = append(edges, weighted{u, v, rand(9) - 3})
				}
			}
		}
		if hasNegativeCycle(n, edges) {
			skipped++
			continue
		}
		truth := make([]int, n)
		for target := 0; target < n; target++ {
			truth[target] = cheapestByWalking(n, edges, 0, target)
		}
		full, used := bellmanFord(n, edges, 0, n-1)
		shortRounds := n - 2
		if shortRounds < 1 {
			shortRounds = 1
		}
		shortRun, _ := bellmanFord(n, edges, 0, shortRounds)
		goodFull := true
		goodShort := true
		high := false
		for target := 0; target < n; target++ {
			if full[target] != truth[target] {
				goodFull = false
			}
			if shortRun[target] != truth[target] {
				goodShort = false
				if shortRun[target] > truth[target] {
					high = true
				}
			}
		}
		if goodFull {
			fullOk++
		}
		if goodShort {
			shortOk++
		}
		if high {
			shortHigh++
		}
		totalRounds += used
		totalAllowed += n - 1
		if used < n-1 {
			earlySaved++
		}
	}

	kept := trials - skipped
	fmt.Printf("over %d random graphs with weights from -3 to 5:\\n", trials)
	fmt.Printf("  had a negative cycle, skipped        %6d\\n", skipped)
	fmt.Printf("  n-1 rounds matched every simple path %6d\\n", fullOk)
	fmt.Printf("  n-2 rounds matched it                %6d\\n", shortOk)
	fmt.Printf("  n-2 rounds reported something high   %6d\\n", shortHigh)
	fmt.Printf("  a full round changed nothing early   %6d\\n", earlySaved)
	fmt.Printf("  rounds run against rounds allowed    %6d%8d\\n", totalRounds, totalAllowed)
	fmt.Println()
	fmt.Printf("The bound is tight and almost never reached. On the %d graphs kept, n-1\\n", kept)
	fmt.Println("rounds were always enough and the loop stopped early on most of them,")
	fmt.Printf("running %d rounds where %d were allowed. On these small random\\n", totalRounds, totalAllowed)
	fmt.Printf("graphs even n-2 rounds sufficed every time, coming up short on %d of\\n", kept-shortOk)
	fmt.Println("them -- which is exactly why this bound has to be reasoned about rather")
	fmt.Println("than tested into existence.")
	fmt.Println()
	fmt.Println("The chain table is the worst case built on purpose. List the edges of a")
	fmt.Println("path in reverse and every round propagates exactly one hop, so a chain of")
	fmt.Println("32 nodes uses all 31 rounds -- and with one round fewer the far end is")
	fmt.Println("still unreached. That is the bound being tight, and it is why the honest")
	fmt.Println("stopping rule is to run until a full round changes nothing rather than to")
	fmt.Println("guess a smaller number.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Hard-coding a round count smaller than n - 1",
          body: "The bound is not conservative, it is exact: a chain of 32 nodes with its edges listed backwards needs all 31 rounds, and with 30 the far end is unreached. Small random graphs will not show this -- n-2 rounds happened to be enough on all 2,294 measured here -- so the bound has to be reasoned about rather than tested.",
        },
        {
          title: "Running all n - 1 rounds when the answer settled early",
          body: "A round that changes nothing means every later round changes nothing too. The random graphs needed 3,668 rounds where 6,253 were allowed. The early exit is one boolean and costs nothing.",
        },
      ],
    },
    {
      id: "the-absence-of-an-answer",
      heading: "The absence of an answer",
      body: [
        "A negative cycle is not a hard case. It is the absence of an answer. Go round a loop whose edges sum below zero and the route gets cheaper every lap, so there is no shortest route \u2014 only an infinitely long one \u2014 and \"shortest path\" is undefined for every node the loop can reach.",
        "Bellman-Ford detects this for free, and the reason is the round bound. After `n - 1` rounds every genuinely shortest distance is final, so if one more round still improves something, that improvement cannot be coming from a simple route. It can only be coming from a loop that pays. One extra round, and the answer is yes or no.",
        "The part usually left out is *which* nodes are affected, and it matters because it is rarely all of them. Over 3,000 random graphs, 913 had an unbounded node and only 489 of those had every node unbounded. The other 424 have a perfectly good shortest distance for most of the graph, and reporting the whole thing as broken throws that away.",
        "The rule is: a node is unbounded when it is downstream of an edge that was still improving. So collect the endpoints of the edges that improved on the extra round, and run a reachability search from exactly those. That produced the exact set on all 3,000 graphs, scored against an independent oracle that enumerates every simple cycle and checks which ones pay.",
        "And note where the definition bites. A negative cycle that the start cannot reach is not a problem at all \u2014 the fourth row of the example has a `-5, -5` loop sitting in a component the start never enters, and nothing is unbounded.",
      ],
      examples: [
        {
          id: "which-nodes-are-ruined",
          title: "One extra round for the yes-or-no, and a search for the affected set",
          lang: "python",
          code: `# A negative cycle is not a hard case for the algorithm. It is the absence of an
# answer, and the algorithm's job changes from computing one to saying so.
#
# Go round a loop whose edges sum to less than zero and the route gets cheaper
# every lap. There is no shortest route, only an infinitely long one, so
# "shortest path" is undefined for every node the loop can reach.
#
# Bellman-Ford detects this for free. After n - 1 rounds every genuinely
# shortest distance is final, so if one more round still improves something,
# that improvement can only be coming from a loop. The example does that, then
# does the part usually left out: working out *which* nodes are affected, which
# is a reachability search from the edges that were still improving.
INF = 10 ** 9


def relax_rounds(n, edges, start, rounds):
    best = [INF] * n
    best[start] = 0
    for _ in range(rounds):
        for u, v, w in edges:
            if best[u] < INF and best[u] + w < best[v]:
                best[v] = best[u] + w
    return best


def still_improving(n, edges, best):
    """The nodes an extra round would still improve. Each one sits on or below a loop."""
    out = []
    for u, v, w in edges:
        if best[u] < INF and best[u] + w < best[v]:
            out.append(v)
    return out


def reachable_from(n, edges, sources):
    """Everything downstream of a node whose distance is unbounded."""
    neighbours = [[] for _ in range(n)]
    for u, v, _ in edges:
        neighbours[u].append(v)
    seen = [False] * n
    stack = []
    for s in sources:
        if not seen[s]:
            seen[s] = True
            stack.append(s)
    while stack:
        v = stack.pop()
        for u in neighbours[v]:
            if not seen[u]:
                seen[u] = True
                stack.append(u)
    return seen


def unbounded_nodes(n, edges, start):
    """Which nodes have no shortest distance at all."""
    best = relax_rounds(n, edges, start, n - 1)
    return reachable_from(n, edges, still_improving(n, edges, best))


def cost_of(edges, a, b):
    """The weight of the edge from a to b. The generator makes at most one."""
    for u, v, w in edges:
        if u == a and v == b:
            return w
    return INF


def negative_cycle_nodes(n, edges):
    """Enumerate every simple cycle and mark the nodes of the ones that pay.

    Exact, and independent of Bellman-Ford: a negative closed walk always
    contains a negative simple cycle, so this misses nothing.
    """
    neighbours = [[] for _ in range(n)]
    for u, v, w in edges:
        neighbours[u].append(v)
    marked = [False] * n
    path = []
    on_path = [False] * n

    def step(start, v, spent):
        for u in neighbours[v]:
            if u == start:
                total = spent + cost_of(edges, v, u)
                if total < 0:
                    for node in path:
                        marked[node] = True
            elif u > start and not on_path[u]:
                on_path[u] = True
                path.append(u)
                step(start, u, spent + cost_of(edges, v, u))
                path.pop()
                on_path[u] = False

    for start in range(n):
        on_path[start] = True
        path.append(start)
        step(start, start, 0)
        path.pop()
        on_path[start] = False
    return marked


def unbounded_by_cycles(n, edges, start):
    """A node is unbounded when a paying loop sits between the start and it."""
    marked = negative_cycle_nodes(n, edges)
    from_start = reachable_from(n, edges, [start])
    sources = [v for v in range(n) if marked[v] and from_start[v]]
    if len(sources) == 0:
        return [False] * n
    return reachable_from(n, edges, sources)


def same_flags(a, b):
    for i in range(len(a)):
        if a[i] != b[i]:
            return False
    return True


def show_flags(flags):
    return "[" + ", ".join("!" if f else "." for f in flags) + "]"


def show_edges(edges):
    return "[" + ", ".join(f"{u}->{v}:{w}" for u, v, w in edges) + "]"


CASES = [
    (4, [(0, 1, 1), (1, 2, -1), (2, 1, -1), (1, 3, 1)]),
    (4, [(0, 1, 1), (1, 2, 2), (2, 3, 3)]),
    (5, [(0, 1, 1), (1, 2, 1), (2, 3, -3), (3, 1, 1), (0, 4, 1)]),
    (4, [(0, 1, 1), (2, 3, -5), (3, 2, -5)]),
]

print(f"{'edges':<48}{'unbounded':<16}{'by enumerating cycles'}")
for n, edges in CASES:
    found = unbounded_nodes(n, edges, 0)
    truth = unbounded_by_cycles(n, edges, 0)
    print(f"{show_edges(edges):<48}{show_flags(found):<16}{show_flags(truth)}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
detect_ok = 0
nodes_ok = 0
had_cycle = 0
affected_any = 0
affected_all = 0
for _ in range(TRIALS):
    n = 2 + rand(5)
    edges = []
    for u in range(n):
        for v in range(n):
            if u != v and rand(3) == 0:
                edges.append((u, v, rand(9) - 4))
    found = unbounded_nodes(n, edges, 0)
    truth = unbounded_by_cycles(n, edges, 0)
    any_found = False
    for v in range(n):
        if found[v]:
            any_found = True
    any_true = False
    count_true = 0
    for v in range(n):
        if truth[v]:
            any_true = True
            count_true += 1
    if any_found == any_true:
        detect_ok += 1
    if same_flags(found, truth):
        nodes_ok += 1
    if any_true:
        had_cycle += 1
        affected_any += 1
        if count_true == n:
            affected_all += 1

print(f"over {TRIALS} random graphs with weights from -4 to 4:")
print(f"  \\"is anything unbounded\\" was right    {detect_ok:>6}")
print(f"  the exact set of nodes was right     {nodes_ok:>6}")
print(f"  graphs with an unbounded node        {had_cycle:>6}")
print(f"  every node unbounded                 {affected_all:>6}")
print()
print("The detection is one extra round and nothing else. After n-1 rounds every")
print("real shortest distance is final, so an edge that still improves can only")
print("be fed by a loop that pays. That is the standard test and it answers")
print("yes-or-no.")
print()
print("Which nodes are affected is the part usually left out, and it matters,")
print(f"because it is rarely all of them -- every node was unbounded on only")
print(f"{affected_all} of the {had_cycle} graphs that had a loop at all. A node is unbounded when")
print("it is downstream of an edge that was still improving, so the answer is a")
print("reachability search from exactly those edges. Everything else still has a")
print("perfectly good shortest distance, and reporting the whole graph as broken")
print("throws that away.")
`,
          output: `edges                                           unbounded       by enumerating cycles
[0->1:1, 1->2:-1, 2->1:-1, 1->3:1]              [., !, !, !]    [., !, !, !]
[0->1:1, 1->2:2, 2->3:3]                        [., ., ., .]    [., ., ., .]
[0->1:1, 1->2:1, 2->3:-3, 3->1:1, 0->4:1]       [., !, !, !, .] [., !, !, !, .]
[0->1:1, 2->3:-5, 3->2:-5]                      [., ., ., .]    [., ., ., .]

over 3000 random graphs with weights from -4 to 4:
  "is anything unbounded" was right      3000
  the exact set of nodes was right       3000
  graphs with an unbounded node           913
  every node unbounded                    489

The detection is one extra round and nothing else. After n-1 rounds every
real shortest distance is final, so an edge that still improves can only
be fed by a loop that pays. That is the standard test and it answers
yes-or-no.

Which nodes are affected is the part usually left out, and it matters,
because it is rarely all of them -- every node was unbounded on only
489 of the 913 graphs that had a loop at all. A node is unbounded when
it is downstream of an edge that was still improving, so the answer is a
reachability search from exactly those edges. Everything else still has a
perfectly good shortest distance, and reporting the whole graph as broken
throws that away.`,
          explanation:
            "One extra round detects the loop; a reachability search from the still-improving edges names the nodes it ruins. Both scored against enumerating every simple cycle and checking which ones pay.",
          alternates: [
            {
              lang: "javascript",
              code: `// A negative cycle is not a hard case for the algorithm. It is the absence of an
// answer, and the algorithm's job changes from computing one to saying so.
//
// Go round a loop whose edges sum to less than zero and the route gets cheaper
// every lap. There is no shortest route, only an infinitely long one, so
// "shortest path" is undefined for every node the loop can reach.
//
// Bellman-Ford detects this for free. After n - 1 rounds every genuinely
// shortest distance is final, so if one more round still improves something,
// that improvement can only be coming from a loop. The example does that, then
// does the part usually left out: working out *which* nodes are affected, which
// is a reachability search from the edges that were still improving.

const INF = 1000000000;

function relaxRounds(n, edges, start, rounds) {
  const best = new Array(n).fill(INF);
  best[start] = 0;
  for (let round = 0; round < rounds; round += 1) {
    for (const [u, v, w] of edges) {
      if (best[u] < INF && best[u] + w < best[v]) best[v] = best[u] + w;
    }
  }
  return best;
}

/** The nodes an extra round would still improve. Each one sits on or below a loop. */
function stillImproving(n, edges, best) {
  const out = [];
  for (const [u, v, w] of edges) {
    if (best[u] < INF && best[u] + w < best[v]) out.push(v);
  }
  return out;
}

/** Everything downstream of a node whose distance is unbounded. */
function reachableFrom(n, edges, sources) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) neighbours[u].push(v);
  const seen = new Array(n).fill(false);
  const stack = [];
  for (const s of sources) {
    if (!seen[s]) {
      seen[s] = true;
      stack.push(s);
    }
  }
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

/** Which nodes have no shortest distance at all. */
function unboundedNodes(n, edges, start) {
  const best = relaxRounds(n, edges, start, n - 1);
  return reachableFrom(n, edges, stillImproving(n, edges, best));
}

/** The weight of the edge from a to b. The generator makes at most one. */
function costOf(edges, a, b) {
  for (const [u, v, w] of edges) {
    if (u === a && v === b) return w;
  }
  return INF;
}

/**
 * Enumerate every simple cycle and mark the nodes of the ones that pay.
 *
 * Exact, and independent of Bellman-Ford: a negative closed walk always
 * contains a negative simple cycle, so this misses nothing.
 */
function negativeCycleNodes(n, edges) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) neighbours[u].push(v);
  const marked = new Array(n).fill(false);
  const path = [];
  const onPath = new Array(n).fill(false);

  function step(start, v, spent) {
    for (const u of neighbours[v]) {
      if (u === start) {
        const total = spent + costOf(edges, v, u);
        if (total < 0) {
          for (const node of path) marked[node] = true;
        }
      } else if (u > start && !onPath[u]) {
        onPath[u] = true;
        path.push(u);
        step(start, u, spent + costOf(edges, v, u));
        path.pop();
        onPath[u] = false;
      }
    }
  }

  for (let start = 0; start < n; start += 1) {
    onPath[start] = true;
    path.push(start);
    step(start, start, 0);
    path.pop();
    onPath[start] = false;
  }
  return marked;
}

/** A node is unbounded when a paying loop sits between the start and it. */
function unboundedByCycles(n, edges, start) {
  const marked = negativeCycleNodes(n, edges);
  const fromStart = reachableFrom(n, edges, [start]);
  const sources = [];
  for (let v = 0; v < n; v += 1) {
    if (marked[v] && fromStart[v]) sources.push(v);
  }
  if (sources.length === 0) return new Array(n).fill(false);
  return reachableFrom(n, edges, sources);
}

function sameFlags(a, b) {
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

const showFlags = (flags) =>
  "[" + flags.map((f) => (f ? "!" : ".")).join(", ") + "]";
const showEdges = (edges) =>
  "[" + edges.map(([u, v, w]) => \`\${u}->\${v}:\${w}\`).join(", ") + "]";
const padEnd = (v, w) => String(v).padEnd(w);
const pad = (v, w) => String(v).padStart(w);

const CASES = [
  [4, [[0, 1, 1], [1, 2, -1], [2, 1, -1], [1, 3, 1]]],
  [4, [[0, 1, 1], [1, 2, 2], [2, 3, 3]]],
  [5, [[0, 1, 1], [1, 2, 1], [2, 3, -3], [3, 1, 1], [0, 4, 1]]],
  [4, [[0, 1, 1], [2, 3, -5], [3, 2, -5]]],
];

console.log(padEnd("edges", 48) + padEnd("unbounded", 16) + "by enumerating cycles");
for (const [n, edges] of CASES) {
  const found = unboundedNodes(n, edges, 0);
  const truth = unboundedByCycles(n, edges, 0);
  console.log(padEnd(showEdges(edges), 48) + padEnd(showFlags(found), 16) + showFlags(truth));
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
let detectOk = 0;
let nodesOk = 0;
let hadCycle = 0;
let affectedAll = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(5);
  const edges = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v && rand(3) === 0) edges.push([u, v, rand(9) - 4]);
    }
  }
  const found = unboundedNodes(n, edges, 0);
  const truth = unboundedByCycles(n, edges, 0);
  let anyFound = false;
  for (let v = 0; v < n; v += 1) {
    if (found[v]) anyFound = true;
  }
  let anyTrue = false;
  let countTrue = 0;
  for (let v = 0; v < n; v += 1) {
    if (truth[v]) {
      anyTrue = true;
      countTrue += 1;
    }
  }
  if (anyFound === anyTrue) detectOk += 1;
  if (sameFlags(found, truth)) nodesOk += 1;
  if (anyTrue) {
    hadCycle += 1;
    if (countTrue === n) affectedAll += 1;
  }
}

console.log(\`over \${TRIALS} random graphs with weights from -4 to 4:\`);
console.log(\`  "is anything unbounded" was right    \${pad(detectOk, 6)}\`);
console.log(\`  the exact set of nodes was right     \${pad(nodesOk, 6)}\`);
console.log(\`  graphs with an unbounded node        \${pad(hadCycle, 6)}\`);
console.log(\`  every node unbounded                 \${pad(affectedAll, 6)}\`);
console.log();
console.log("The detection is one extra round and nothing else. After n-1 rounds every");
console.log("real shortest distance is final, so an edge that still improves can only");
console.log("be fed by a loop that pays. That is the standard test and it answers");
console.log("yes-or-no.");
console.log();
console.log("Which nodes are affected is the part usually left out, and it matters,");
console.log("because it is rarely all of them -- every node was unbounded on only");
console.log(\`\${affectedAll} of the \${hadCycle} graphs that had a loop at all. A node is unbounded when\`);
console.log("it is downstream of an edge that was still improving, so the answer is a");
console.log("reachability search from exactly those edges. Everything else still has a");
console.log("perfectly good shortest distance, and reporting the whole graph as broken");
console.log("throws that away.");
`,
            },
            {
              lang: "typescript",
              code: `// A negative cycle is not a hard case for the algorithm. It is the absence of an
// answer, and the algorithm's job changes from computing one to saying so.
//
// Go round a loop whose edges sum to less than zero and the route gets cheaper
// every lap. There is no shortest route, only an infinitely long one, so
// "shortest path" is undefined for every node the loop can reach.
//
// Bellman-Ford detects this for free. After n - 1 rounds every genuinely
// shortest distance is final, so if one more round still improves something,
// that improvement can only be coming from a loop. The example does that, then
// does the part usually left out: working out *which* nodes are affected, which
// is a reachability search from the edges that were still improving.

const INF = 1000000000;

type Weighted = [number, number, number];

function relaxRounds(n: number, edges: Weighted[], start: number, rounds: number): number[] {
  const best = new Array(n).fill(INF);
  best[start] = 0;
  for (let round = 0; round < rounds; round += 1) {
    for (const [u, v, w] of edges) {
      if (best[u] < INF && best[u] + w < best[v]) best[v] = best[u] + w;
    }
  }
  return best;
}

/** The nodes an extra round would still improve. Each one sits on or below a loop. */
function stillImproving(n: number, edges: Weighted[], best: number[]): number[] {
  const out: number[] = [];
  for (const [u, v, w] of edges) {
    if (best[u] < INF && best[u] + w < best[v]) out.push(v);
  }
  return out;
}

/** Everything downstream of a node whose distance is unbounded. */
function reachableFrom(n: number, edges: Weighted[], sources: number[]): boolean[] {
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) neighbours[u].push(v);
  const seen = new Array(n).fill(false);
  const stack: number[] = [];
  for (const s of sources) {
    if (!seen[s]) {
      seen[s] = true;
      stack.push(s);
    }
  }
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

/** Which nodes have no shortest distance at all. */
function unboundedNodes(n: number, edges: Weighted[], start: number): boolean[] {
  const best = relaxRounds(n, edges, start, n - 1);
  return reachableFrom(n, edges, stillImproving(n, edges, best));
}

/** The weight of the edge from a to b. The generator makes at most one. */
function costOf(edges: Weighted[], a: number, b: number): number {
  for (const [u, v, w] of edges) {
    if (u === a && v === b) return w;
  }
  return INF;
}

/**
 * Enumerate every simple cycle and mark the nodes of the ones that pay.
 *
 * Exact, and independent of Bellman-Ford: a negative closed walk always
 * contains a negative simple cycle, so this misses nothing.
 */
function negativeCycleNodes(n: number, edges: Weighted[]): boolean[] {
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) neighbours[u].push(v);
  const marked = new Array(n).fill(false);
  const path: number[] = [];
  const onPath = new Array(n).fill(false);

  function step(start: number, v: number, spent: number): void {
    for (const u of neighbours[v]) {
      if (u === start) {
        const total = spent + costOf(edges, v, u);
        if (total < 0) {
          for (const node of path) marked[node] = true;
        }
      } else if (u > start && !onPath[u]) {
        onPath[u] = true;
        path.push(u);
        step(start, u, spent + costOf(edges, v, u));
        path.pop();
        onPath[u] = false;
      }
    }
  }

  for (let start = 0; start < n; start += 1) {
    onPath[start] = true;
    path.push(start);
    step(start, start, 0);
    path.pop();
    onPath[start] = false;
  }
  return marked;
}

/** A node is unbounded when a paying loop sits between the start and it. */
function unboundedByCycles(n: number, edges: Weighted[], start: number): boolean[] {
  const marked = negativeCycleNodes(n, edges);
  const fromStart = reachableFrom(n, edges, [start]);
  const sources: number[] = [];
  for (let v = 0; v < n; v += 1) {
    if (marked[v] && fromStart[v]) sources.push(v);
  }
  if (sources.length === 0) return new Array(n).fill(false);
  return reachableFrom(n, edges, sources);
}

function sameFlags(a: boolean[], b: boolean[]): boolean {
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

const showFlags = (flags: boolean[]): string =>
  "[" + flags.map((f) => (f ? "!" : ".")).join(", ") + "]";
const showEdges = (edges: Weighted[]): string =>
  "[" + edges.map(([u, v, w]) => \`\${u}->\${v}:\${w}\`).join(", ") + "]";
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const pad = (v: string | number, w: number): string => String(v).padStart(w);

const CASES: [number, Weighted[]][] = [
  [4, [[0, 1, 1], [1, 2, -1], [2, 1, -1], [1, 3, 1]]],
  [4, [[0, 1, 1], [1, 2, 2], [2, 3, 3]]],
  [5, [[0, 1, 1], [1, 2, 1], [2, 3, -3], [3, 1, 1], [0, 4, 1]]],
  [4, [[0, 1, 1], [2, 3, -5], [3, 2, -5]]],
];

console.log(padEnd("edges", 48) + padEnd("unbounded", 16) + "by enumerating cycles");
for (const [n, edges] of CASES) {
  const found = unboundedNodes(n, edges, 0);
  const truth = unboundedByCycles(n, edges, 0);
  console.log(padEnd(showEdges(edges), 48) + padEnd(showFlags(found), 16) + showFlags(truth));
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
let detectOk = 0;
let nodesOk = 0;
let hadCycle = 0;
let affectedAll = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(5);
  const edges: Weighted[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v && rand(3) === 0) edges.push([u, v, rand(9) - 4]);
    }
  }
  const found = unboundedNodes(n, edges, 0);
  const truth = unboundedByCycles(n, edges, 0);
  let anyFound = false;
  for (let v = 0; v < n; v += 1) {
    if (found[v]) anyFound = true;
  }
  let anyTrue = false;
  let countTrue = 0;
  for (let v = 0; v < n; v += 1) {
    if (truth[v]) {
      anyTrue = true;
      countTrue += 1;
    }
  }
  if (anyFound === anyTrue) detectOk += 1;
  if (sameFlags(found, truth)) nodesOk += 1;
  if (anyTrue) {
    hadCycle += 1;
    if (countTrue === n) affectedAll += 1;
  }
}

console.log(\`over \${TRIALS} random graphs with weights from -4 to 4:\`);
console.log(\`  "is anything unbounded" was right    \${pad(detectOk, 6)}\`);
console.log(\`  the exact set of nodes was right     \${pad(nodesOk, 6)}\`);
console.log(\`  graphs with an unbounded node        \${pad(hadCycle, 6)}\`);
console.log(\`  every node unbounded                 \${pad(affectedAll, 6)}\`);
console.log();
console.log("The detection is one extra round and nothing else. After n-1 rounds every");
console.log("real shortest distance is final, so an edge that still improves can only");
console.log("be fed by a loop that pays. That is the standard test and it answers");
console.log("yes-or-no.");
console.log();
console.log("Which nodes are affected is the part usually left out, and it matters,");
console.log("because it is rarely all of them -- every node was unbounded on only");
console.log(\`\${affectedAll} of the \${hadCycle} graphs that had a loop at all. A node is unbounded when\`);
console.log("it is downstream of an edge that was still improving, so the answer is a");
console.log("reachability search from exactly those edges. Everything else still has a");
console.log("perfectly good shortest distance, and reporting the whole graph as broken");
console.log("throws that away.");
`,
            },
            {
              lang: "java",
              code: `// A negative cycle is not a hard case for the algorithm. It is the absence of an
// answer, and the algorithm's job changes from computing one to saying so.
//
// Go round a loop whose edges sum to less than zero and the route gets cheaper
// every lap. There is no shortest route, only an infinitely long one, so
// "shortest path" is undefined for every node the loop can reach.
//
// Bellman-Ford detects this for free. After n - 1 rounds every genuinely
// shortest distance is final, so if one more round still improves something,
// that improvement can only be coming from a loop. The example does that, then
// does the part usually left out: working out *which* nodes are affected, which
// is a reachability search from the edges that were still improving.

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {

    static final int INF = 1000000000;

    static int[] relaxRounds(int n, int[][] edges, int start, int rounds) {
        int[] best = new int[n];
        Arrays.fill(best, INF);
        best[start] = 0;
        for (int round = 0; round < rounds; round++) {
            for (int[] e : edges) {
                if (best[e[0]] < INF && best[e[0]] + e[2] < best[e[1]]) {
                    best[e[1]] = best[e[0]] + e[2];
                }
            }
        }
        return best;
    }

    /** The nodes an extra round would still improve. Each one sits on or below a loop. */
    static List<Integer> stillImproving(int n, int[][] edges, int[] best) {
        List<Integer> out = new ArrayList<>();
        for (int[] e : edges) {
            if (best[e[0]] < INF && best[e[0]] + e[2] < best[e[1]]) {
                out.add(e[1]);
            }
        }
        return out;
    }

    /** Everything downstream of a node whose distance is unbounded. */
    static boolean[] reachableFrom(int n, int[][] edges, List<Integer> sources) {
        List<List<Integer>> neighbours = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            neighbours.add(new ArrayList<>());
        }
        for (int[] e : edges) {
            neighbours.get(e[0]).add(e[1]);
        }
        boolean[] seen = new boolean[n];
        List<Integer> stack = new ArrayList<>();
        for (int s : sources) {
            if (!seen[s]) {
                seen[s] = true;
                stack.add(s);
            }
        }
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

    /** Which nodes have no shortest distance at all. */
    static boolean[] unboundedNodes(int n, int[][] edges, int start) {
        int[] best = relaxRounds(n, edges, start, n - 1);
        return reachableFrom(n, edges, stillImproving(n, edges, best));
    }

    /** The weight of the edge from a to b. The generator makes at most one. */
    static int costOf(int[][] edges, int a, int b) {
        for (int[] e : edges) {
            if (e[0] == a && e[1] == b) {
                return e[2];
            }
        }
        return INF;
    }

    static boolean[] cycleMarked;
    static List<Integer> cyclePath;
    static boolean[] cycleOnPath;

    static void cycleStep(List<List<Integer>> neighbours, int[][] edges, int start, int v, int spent) {
        for (int u : neighbours.get(v)) {
            if (u == start) {
                int total = spent + costOf(edges, v, u);
                if (total < 0) {
                    for (int node : cyclePath) {
                        cycleMarked[node] = true;
                    }
                }
            } else if (u > start && !cycleOnPath[u]) {
                cycleOnPath[u] = true;
                cyclePath.add(u);
                cycleStep(neighbours, edges, start, u, spent + costOf(edges, v, u));
                cyclePath.remove(cyclePath.size() - 1);
                cycleOnPath[u] = false;
            }
        }
    }

    /**
     * Enumerate every simple cycle and mark the nodes of the ones that pay.
     *
     * Exact, and independent of Bellman-Ford: a negative closed walk always
     * contains a negative simple cycle, so this misses nothing.
     */
    static boolean[] negativeCycleNodes(int n, int[][] edges) {
        List<List<Integer>> neighbours = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            neighbours.add(new ArrayList<>());
        }
        for (int[] e : edges) {
            neighbours.get(e[0]).add(e[1]);
        }
        cycleMarked = new boolean[n];
        cyclePath = new ArrayList<>();
        cycleOnPath = new boolean[n];
        for (int start = 0; start < n; start++) {
            cycleOnPath[start] = true;
            cyclePath.add(start);
            cycleStep(neighbours, edges, start, start, 0);
            cyclePath.remove(cyclePath.size() - 1);
            cycleOnPath[start] = false;
        }
        return cycleMarked;
    }

    /** A node is unbounded when a paying loop sits between the start and it. */
    static boolean[] unboundedByCycles(int n, int[][] edges, int start) {
        boolean[] marked = negativeCycleNodes(n, edges);
        List<Integer> justStart = new ArrayList<>();
        justStart.add(start);
        boolean[] fromStart = reachableFrom(n, edges, justStart);
        List<Integer> sources = new ArrayList<>();
        for (int v = 0; v < n; v++) {
            if (marked[v] && fromStart[v]) {
                sources.add(v);
            }
        }
        if (sources.isEmpty()) {
            return new boolean[n];
        }
        return reachableFrom(n, edges, sources);
    }

    static boolean sameFlags(boolean[] a, boolean[] b) {
        for (int i = 0; i < a.length; i++) {
            if (a[i] != b[i]) {
                return false;
            }
        }
        return true;
    }

    static String showFlags(boolean[] flags) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < flags.length; i++) {
            if (i > 0) {
                sb.append(", ");
            }
            sb.append(flags[i] ? "!" : ".");
        }
        return sb.append("]").toString();
    }

    static String showEdges(int[][] edges) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < edges.length; i++) {
            if (i > 0) {
                sb.append(", ");
            }
            sb.append(edges[i][0]).append("->").append(edges[i][1]).append(":").append(edges[i][2]);
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
        int[] sizes = {4, 4, 5, 4};
        int[][][] cases = {
            {{0, 1, 1}, {1, 2, -1}, {2, 1, -1}, {1, 3, 1}},
            {{0, 1, 1}, {1, 2, 2}, {2, 3, 3}},
            {{0, 1, 1}, {1, 2, 1}, {2, 3, -3}, {3, 1, 1}, {0, 4, 1}},
            {{0, 1, 1}, {2, 3, -5}, {3, 2, -5}},
        };

        System.out.println(padEnd("edges", 48) + padEnd("unbounded", 16) + "by enumerating cycles");
        for (int c = 0; c < sizes.length; c++) {
            int n = sizes[c];
            boolean[] found = unboundedNodes(n, cases[c], 0);
            boolean[] truth = unboundedByCycles(n, cases[c], 0);
            System.out.println(padEnd(showEdges(cases[c]), 48) + padEnd(showFlags(found), 16)
                    + showFlags(truth));
        }
        System.out.println();

        int trials = 3000;
        int detectOk = 0;
        int nodesOk = 0;
        int hadCycle = 0;
        int affectedAll = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(5);
            List<int[]> collected = new ArrayList<>();
            for (int u = 0; u < n; u++) {
                for (int v = 0; v < n; v++) {
                    if (u != v && rand(3) == 0) {
                        collected.add(new int[] {u, v, rand(9) - 4});
                    }
                }
            }
            int[][] edges = collected.toArray(new int[0][]);
            boolean[] found = unboundedNodes(n, edges, 0);
            boolean[] truth = unboundedByCycles(n, edges, 0);
            boolean anyFound = false;
            for (int v = 0; v < n; v++) {
                if (found[v]) {
                    anyFound = true;
                }
            }
            boolean anyTrue = false;
            int countTrue = 0;
            for (int v = 0; v < n; v++) {
                if (truth[v]) {
                    anyTrue = true;
                    countTrue++;
                }
            }
            if (anyFound == anyTrue) {
                detectOk++;
            }
            if (sameFlags(found, truth)) {
                nodesOk++;
            }
            if (anyTrue) {
                hadCycle++;
                if (countTrue == n) {
                    affectedAll++;
                }
            }
        }

        System.out.println("over " + trials + " random graphs with weights from -4 to 4:");
        System.out.println("  \\"is anything unbounded\\" was right    " + pad(String.valueOf(detectOk), 6));
        System.out.println("  the exact set of nodes was right     " + pad(String.valueOf(nodesOk), 6));
        System.out.println("  graphs with an unbounded node        " + pad(String.valueOf(hadCycle), 6));
        System.out.println("  every node unbounded                 " + pad(String.valueOf(affectedAll), 6));
        System.out.println();
        System.out.println("The detection is one extra round and nothing else. After n-1 rounds every");
        System.out.println("real shortest distance is final, so an edge that still improves can only");
        System.out.println("be fed by a loop that pays. That is the standard test and it answers");
        System.out.println("yes-or-no.");
        System.out.println();
        System.out.println("Which nodes are affected is the part usually left out, and it matters,");
        System.out.println("because it is rarely all of them -- every node was unbounded on only");
        System.out.println(affectedAll + " of the " + hadCycle + " graphs that had a loop at all. A node is unbounded when");
        System.out.println("it is downstream of an edge that was still improving, so the answer is a");
        System.out.println("reachability search from exactly those edges. Everything else still has a");
        System.out.println("perfectly good shortest distance, and reporting the whole graph as broken");
        System.out.println("throws that away.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// A negative cycle is not a hard case for the algorithm. It is the absence of an
// answer, and the algorithm's job changes from computing one to saying so.
//
// Go round a loop whose edges sum to less than zero and the route gets cheaper
// every lap. There is no shortest route, only an infinitely long one, so
// "shortest path" is undefined for every node the loop can reach.
//
// Bellman-Ford detects this for free. After n - 1 rounds every genuinely
// shortest distance is final, so if one more round still improves something,
// that improvement can only be coming from a loop. The example does that, then
// does the part usually left out: working out *which* nodes are affected, which
// is a reachability search from the edges that were still improving.

#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

const int INF = 1000000000;

struct Weighted {
    int from;
    int to;
    int cost;
};

std::vector<int> relax_rounds(int n, const std::vector<Weighted>& edges, int start, int rounds) {
    std::vector<int> best(n, INF);
    best[start] = 0;
    for (int round = 0; round < rounds; round++) {
        for (const Weighted& e : edges) {
            if (best[e.from] < INF && best[e.from] + e.cost < best[e.to]) {
                best[e.to] = best[e.from] + e.cost;
            }
        }
    }
    return best;
}

// The nodes an extra round would still improve. Each one sits on or below a loop.
std::vector<int> still_improving(int n, const std::vector<Weighted>& edges,
                                 const std::vector<int>& best) {
    std::vector<int> out;
    for (const Weighted& e : edges) {
        if (best[e.from] < INF && best[e.from] + e.cost < best[e.to]) {
            out.push_back(e.to);
        }
    }
    return out;
}

// Everything downstream of a node whose distance is unbounded.
std::vector<char> reachable_from(int n, const std::vector<Weighted>& edges,
                                 const std::vector<int>& sources) {
    std::vector<std::vector<int>> neighbours(n);
    for (const Weighted& e : edges) {
        neighbours[e.from].push_back(e.to);
    }
    std::vector<char> seen(n, 0);
    std::vector<int> stack;
    for (int s : sources) {
        if (!seen[s]) {
            seen[s] = 1;
            stack.push_back(s);
        }
    }
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

// Which nodes have no shortest distance at all.
std::vector<char> unbounded_nodes(int n, const std::vector<Weighted>& edges, int start) {
    std::vector<int> best = relax_rounds(n, edges, start, n - 1);
    return reachable_from(n, edges, still_improving(n, edges, best));
}

// The weight of the edge from a to b. The generator makes at most one.
int cost_of(const std::vector<Weighted>& edges, int a, int b) {
    for (const Weighted& e : edges) {
        if (e.from == a && e.to == b) {
            return e.cost;
        }
    }
    return INF;
}

void cycle_step(const std::vector<std::vector<int>>& neighbours, const std::vector<Weighted>& edges,
                std::vector<char>& marked, std::vector<int>& path, std::vector<char>& on_path,
                int start, int v, int spent) {
    for (int u : neighbours[v]) {
        if (u == start) {
            if (spent + cost_of(edges, v, u) < 0) {
                for (int node : path) {
                    marked[node] = 1;
                }
            }
        } else if (u > start && !on_path[u]) {
            on_path[u] = 1;
            path.push_back(u);
            cycle_step(neighbours, edges, marked, path, on_path, start, u,
                       spent + cost_of(edges, v, u));
            path.pop_back();
            on_path[u] = 0;
        }
    }
}

// Enumerate every simple cycle and mark the nodes of the ones that pay.
//
// Exact, and independent of Bellman-Ford: a negative closed walk always
// contains a negative simple cycle, so this misses nothing.
std::vector<char> negative_cycle_nodes(int n, const std::vector<Weighted>& edges) {
    std::vector<std::vector<int>> neighbours(n);
    for (const Weighted& e : edges) {
        neighbours[e.from].push_back(e.to);
    }
    std::vector<char> marked(n, 0);
    std::vector<int> path;
    std::vector<char> on_path(n, 0);
    for (int start = 0; start < n; start++) {
        on_path[start] = 1;
        path.push_back(start);
        cycle_step(neighbours, edges, marked, path, on_path, start, start, 0);
        path.pop_back();
        on_path[start] = 0;
    }
    return marked;
}

// A node is unbounded when a paying loop sits between the start and it.
std::vector<char> unbounded_by_cycles(int n, const std::vector<Weighted>& edges, int start) {
    std::vector<char> marked = negative_cycle_nodes(n, edges);
    std::vector<int> just_start;
    just_start.push_back(start);
    std::vector<char> from_start = reachable_from(n, edges, just_start);
    std::vector<int> sources;
    for (int v = 0; v < n; v++) {
        if (marked[v] && from_start[v]) {
            sources.push_back(v);
        }
    }
    if (sources.empty()) {
        return std::vector<char>(n, 0);
    }
    return reachable_from(n, edges, sources);
}

bool same_flags(const std::vector<char>& a, const std::vector<char>& b) {
    for (size_t i = 0; i < a.size(); i++) {
        if (a[i] != b[i]) {
            return false;
        }
    }
    return true;
}

std::string show_flags(const std::vector<char>& flags) {
    std::string out = "[";
    for (size_t i = 0; i < flags.size(); i++) {
        if (i > 0) {
            out += ", ";
        }
        out += flags[i] ? "!" : ".";
    }
    return out + "]";
}

std::string show_edges(const std::vector<Weighted>& edges) {
    std::string out = "[";
    for (size_t i = 0; i < edges.size(); i++) {
        if (i > 0) {
            out += ", ";
        }
        out += std::to_string(edges[i].from) + "->" + std::to_string(edges[i].to)
                + ":" + std::to_string(edges[i].cost);
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
    std::vector<int> sizes = {4, 4, 5, 4};
    std::vector<std::vector<Weighted>> cases = {
        {{0, 1, 1}, {1, 2, -1}, {2, 1, -1}, {1, 3, 1}},
        {{0, 1, 1}, {1, 2, 2}, {2, 3, 3}},
        {{0, 1, 1}, {1, 2, 1}, {2, 3, -3}, {3, 1, 1}, {0, 4, 1}},
        {{0, 1, 1}, {2, 3, -5}, {3, 2, -5}},
    };

    std::cout << std::left << std::setw(48) << "edges" << std::setw(16) << "unbounded"
              << "by enumerating cycles" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        int n = sizes[c];
        std::vector<char> found = unbounded_nodes(n, cases[c], 0);
        std::vector<char> truth = unbounded_by_cycles(n, cases[c], 0);
        std::cout << std::left << std::setw(48) << show_edges(cases[c])
                  << std::setw(16) << show_flags(found) << show_flags(truth) << "\\n";
    }
    std::cout << "\\n";

    int trials = 3000;
    int detect_ok = 0;
    int nodes_ok = 0;
    int had_cycle = 0;
    int affected_all = 0;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(5);
        std::vector<Weighted> edges;
        for (int u = 0; u < n; u++) {
            for (int v = 0; v < n; v++) {
                if (u != v && rand_below(3) == 0) {
                    Weighted e;
                    e.from = u;
                    e.to = v;
                    e.cost = rand_below(9) - 4;
                    edges.push_back(e);
                }
            }
        }
        std::vector<char> found = unbounded_nodes(n, edges, 0);
        std::vector<char> truth = unbounded_by_cycles(n, edges, 0);
        bool any_found = false;
        for (int v = 0; v < n; v++) {
            if (found[v]) {
                any_found = true;
            }
        }
        bool any_true = false;
        int count_true = 0;
        for (int v = 0; v < n; v++) {
            if (truth[v]) {
                any_true = true;
                count_true++;
            }
        }
        if (any_found == any_true) {
            detect_ok++;
        }
        if (same_flags(found, truth)) {
            nodes_ok++;
        }
        if (any_true) {
            had_cycle++;
            if (count_true == n) {
                affected_all++;
            }
        }
    }

    std::cout << "over " << trials << " random graphs with weights from -4 to 4:\\n";
    std::cout << "  \\"is anything unbounded\\" was right    " << std::right << std::setw(6) << detect_ok << "\\n";
    std::cout << "  the exact set of nodes was right     " << std::setw(6) << nodes_ok << "\\n";
    std::cout << "  graphs with an unbounded node        " << std::setw(6) << had_cycle << "\\n";
    std::cout << "  every node unbounded                 " << std::setw(6) << affected_all << "\\n";
    std::cout << "\\n";
    std::cout << "The detection is one extra round and nothing else. After n-1 rounds every\\n";
    std::cout << "real shortest distance is final, so an edge that still improves can only\\n";
    std::cout << "be fed by a loop that pays. That is the standard test and it answers\\n";
    std::cout << "yes-or-no.\\n";
    std::cout << "\\n";
    std::cout << "Which nodes are affected is the part usually left out, and it matters,\\n";
    std::cout << "because it is rarely all of them -- every node was unbounded on only\\n";
    std::cout << affected_all << " of the " << had_cycle << " graphs that had a loop at all. A node is unbounded when\\n";
    std::cout << "it is downstream of an edge that was still improving, so the answer is a\\n";
    std::cout << "reachability search from exactly those edges. Everything else still has a\\n";
    std::cout << "perfectly good shortest distance, and reporting the whole graph as broken\\n";
    std::cout << "throws that away.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// A negative cycle is not a hard case for the algorithm. It is the absence of an
// answer, and the algorithm's job changes from computing one to saying so.
//
// Go round a loop whose edges sum to less than zero and the route gets cheaper
// every lap. There is no shortest route, only an infinitely long one, so
// "shortest path" is undefined for every node the loop can reach.
//
// Bellman-Ford detects this for free. After n - 1 rounds every genuinely
// shortest distance is final, so if one more round still improves something,
// that improvement can only be coming from a loop. The example does that, then
// does the part usually left out: working out *which* nodes are affected, which
// is a reachability search from the edges that were still improving.

const INF: i64 = 1_000_000_000;

fn relax_rounds(n: usize, edges: &[(usize, usize, i64)], start: usize, rounds: usize) -> Vec<i64> {
    let mut best = vec![INF; n];
    best[start] = 0;
    for _ in 0..rounds {
        for &(u, v, w) in edges {
            if best[u] < INF && best[u] + w < best[v] {
                best[v] = best[u] + w;
            }
        }
    }
    best
}

/// The nodes an extra round would still improve. Each one sits on or below a loop.
fn still_improving(edges: &[(usize, usize, i64)], best: &[i64]) -> Vec<usize> {
    let mut out = Vec::new();
    for &(u, v, w) in edges {
        if best[u] < INF && best[u] + w < best[v] {
            out.push(v);
        }
    }
    out
}

/// Everything downstream of a node whose distance is unbounded.
fn reachable_from(n: usize, edges: &[(usize, usize, i64)], sources: &[usize]) -> Vec<bool> {
    let mut neighbours = vec![Vec::new(); n];
    for &(u, v, _) in edges {
        neighbours[u].push(v);
    }
    let mut seen = vec![false; n];
    let mut stack: Vec<usize> = Vec::new();
    for &s in sources {
        if !seen[s] {
            seen[s] = true;
            stack.push(s);
        }
    }
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

/// Which nodes have no shortest distance at all.
fn unbounded_nodes(n: usize, edges: &[(usize, usize, i64)], start: usize) -> Vec<bool> {
    let best = relax_rounds(n, edges, start, n - 1);
    reachable_from(n, edges, &still_improving(edges, &best))
}

/// The weight of the edge from a to b. The generator makes at most one.
fn cost_of(edges: &[(usize, usize, i64)], a: usize, b: usize) -> i64 {
    for &(u, v, w) in edges {
        if u == a && v == b {
            return w;
        }
    }
    INF
}

fn cycle_step(
    neighbours: &[Vec<usize>],
    edges: &[(usize, usize, i64)],
    marked: &mut Vec<bool>,
    path: &mut Vec<usize>,
    on_path: &mut Vec<bool>,
    start: usize,
    v: usize,
    spent: i64,
) {
    for i in 0..neighbours[v].len() {
        let u = neighbours[v][i];
        if u == start {
            if spent + cost_of(edges, v, u) < 0 {
                for &node in path.iter() {
                    marked[node] = true;
                }
            }
        } else if u > start && !on_path[u] {
            on_path[u] = true;
            path.push(u);
            cycle_step(neighbours, edges, marked, path, on_path, start, u, spent + cost_of(edges, v, u));
            path.pop();
            on_path[u] = false;
        }
    }
}

/// Enumerate every simple cycle and mark the nodes of the ones that pay.
///
/// Exact, and independent of Bellman-Ford: a negative closed walk always
/// contains a negative simple cycle, so this misses nothing.
fn negative_cycle_nodes(n: usize, edges: &[(usize, usize, i64)]) -> Vec<bool> {
    let mut neighbours = vec![Vec::new(); n];
    for &(u, v, _) in edges {
        neighbours[u].push(v);
    }
    let mut marked = vec![false; n];
    let mut path: Vec<usize> = Vec::new();
    let mut on_path = vec![false; n];
    for start in 0..n {
        on_path[start] = true;
        path.push(start);
        cycle_step(&neighbours, edges, &mut marked, &mut path, &mut on_path, start, start, 0);
        path.pop();
        on_path[start] = false;
    }
    marked
}

/// A node is unbounded when a paying loop sits between the start and it.
fn unbounded_by_cycles(n: usize, edges: &[(usize, usize, i64)], start: usize) -> Vec<bool> {
    let marked = negative_cycle_nodes(n, edges);
    let from_start = reachable_from(n, edges, &[start]);
    let sources: Vec<usize> = (0..n).filter(|&v| marked[v] && from_start[v]).collect();
    if sources.is_empty() {
        return vec![false; n];
    }
    reachable_from(n, edges, &sources)
}

fn same_flags(a: &[bool], b: &[bool]) -> bool {
    for i in 0..a.len() {
        if a[i] != b[i] {
            return false;
        }
    }
    true
}

fn show_flags(flags: &[bool]) -> String {
    let parts: Vec<String> = flags
        .iter()
        .map(|&f| String::from(if f { "!" } else { "." }))
        .collect();
    format!("[{}]", parts.join(", "))
}

fn show_edges(edges: &[(usize, usize, i64)]) -> String {
    let parts: Vec<String> = edges
        .iter()
        .map(|&(u, v, w)| format!("{}->{}:{}", u, v, w))
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
    let sizes: Vec<usize> = vec![4, 4, 5, 4];
    let cases: Vec<Vec<(usize, usize, i64)>> = vec![
        vec![(0, 1, 1), (1, 2, -1), (2, 1, -1), (1, 3, 1)],
        vec![(0, 1, 1), (1, 2, 2), (2, 3, 3)],
        vec![(0, 1, 1), (1, 2, 1), (2, 3, -3), (3, 1, 1), (0, 4, 1)],
        vec![(0, 1, 1), (2, 3, -5), (3, 2, -5)],
    ];

    println!(
        "{}{}{}",
        pad_right("edges", 48),
        pad_right("unbounded", 16),
        "by enumerating cycles"
    );
    for (c, edges) in cases.iter().enumerate() {
        let n = sizes[c];
        let found = unbounded_nodes(n, edges, 0);
        let truth = unbounded_by_cycles(n, edges, 0);
        println!(
            "{}{}{}",
            pad_right(&show_edges(edges), 48),
            pad_right(&show_flags(&found), 16),
            show_flags(&truth)
        );
    }
    println!();

    let mut rng = Rng { seed: 1 };
    let trials = 3000;
    let mut detect_ok = 0;
    let mut nodes_ok = 0;
    let mut had_cycle = 0;
    let mut affected_all = 0;
    for _ in 0..trials {
        let n = (2 + rng.next(5)) as usize;
        let mut edges: Vec<(usize, usize, i64)> = Vec::new();
        for u in 0..n {
            for v in 0..n {
                if u != v && rng.next(3) == 0 {
                    let w = rng.next(9) - 4;
                    edges.push((u, v, w));
                }
            }
        }
        let found = unbounded_nodes(n, &edges, 0);
        let truth = unbounded_by_cycles(n, &edges, 0);
        let mut any_found = false;
        for v in 0..n {
            if found[v] {
                any_found = true;
            }
        }
        let mut any_true = false;
        let mut count_true = 0;
        for v in 0..n {
            if truth[v] {
                any_true = true;
                count_true += 1;
            }
        }
        if any_found == any_true {
            detect_ok += 1;
        }
        if same_flags(&found, &truth) {
            nodes_ok += 1;
        }
        if any_true {
            had_cycle += 1;
            if count_true == n {
                affected_all += 1;
            }
        }
    }

    println!("over {} random graphs with weights from -4 to 4:", trials);
    println!("  \\"is anything unbounded\\" was right    {}", pad_left(&detect_ok.to_string(), 6));
    println!("  the exact set of nodes was right     {}", pad_left(&nodes_ok.to_string(), 6));
    println!("  graphs with an unbounded node        {}", pad_left(&had_cycle.to_string(), 6));
    println!("  every node unbounded                 {}", pad_left(&affected_all.to_string(), 6));
    println!();
    println!("The detection is one extra round and nothing else. After n-1 rounds every");
    println!("real shortest distance is final, so an edge that still improves can only");
    println!("be fed by a loop that pays. That is the standard test and it answers");
    println!("yes-or-no.");
    println!();
    println!("Which nodes are affected is the part usually left out, and it matters,");
    println!("because it is rarely all of them -- every node was unbounded on only");
    println!(
        "{} of the {} graphs that had a loop at all. A node is unbounded when",
        affected_all, had_cycle
    );
    println!("it is downstream of an edge that was still improving, so the answer is a");
    println!("reachability search from exactly those edges. Everything else still has a");
    println!("perfectly good shortest distance, and reporting the whole graph as broken");
    println!("throws that away.");
}
`,
            },
            {
              lang: "go",
              code: `// A negative cycle is not a hard case for the algorithm. It is the absence of an
// answer, and the algorithm's job changes from computing one to saying so.
//
// Go round a loop whose edges sum to less than zero and the route gets cheaper
// every lap. There is no shortest route, only an infinitely long one, so
// "shortest path" is undefined for every node the loop can reach.
//
// Bellman-Ford detects this for free. After n - 1 rounds every genuinely
// shortest distance is final, so if one more round still improves something,
// that improvement can only be coming from a loop. The example does that, then
// does the part usually left out: working out *which* nodes are affected, which
// is a reachability search from the edges that were still improving.

package main

import (
	"fmt"
	"strings"
)

const inf = 1000000000

type weighted struct{ from, to, cost int }

func relaxRounds(n int, edges []weighted, start, rounds int) []int {
	best := make([]int, n)
	for i := range best {
		best[i] = inf
	}
	best[start] = 0
	for round := 0; round < rounds; round++ {
		for _, e := range edges {
			if best[e.from] < inf && best[e.from]+e.cost < best[e.to] {
				best[e.to] = best[e.from] + e.cost
			}
		}
	}
	return best
}

// The nodes an extra round would still improve. Each one sits on or below a loop.
func stillImproving(n int, edges []weighted, best []int) []int {
	out := []int{}
	for _, e := range edges {
		if best[e.from] < inf && best[e.from]+e.cost < best[e.to] {
			out = append(out, e.to)
		}
	}
	return out
}

// Everything downstream of a node whose distance is unbounded.
func reachableFrom(n int, edges []weighted, sources []int) []bool {
	neighbours := make([][]int, n)
	for i := range neighbours {
		neighbours[i] = []int{}
	}
	for _, e := range edges {
		neighbours[e.from] = append(neighbours[e.from], e.to)
	}
	seen := make([]bool, n)
	stack := []int{}
	for _, s := range sources {
		if !seen[s] {
			seen[s] = true
			stack = append(stack, s)
		}
	}
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

// Which nodes have no shortest distance at all.
func unboundedNodes(n int, edges []weighted, start int) []bool {
	best := relaxRounds(n, edges, start, n-1)
	return reachableFrom(n, edges, stillImproving(n, edges, best))
}

// The weight of the edge from a to b. The generator makes at most one.
func costOf(edges []weighted, a, b int) int {
	for _, e := range edges {
		if e.from == a && e.to == b {
			return e.cost
		}
	}
	return inf
}

// Enumerate every simple cycle and mark the nodes of the ones that pay.
//
// Exact, and independent of Bellman-Ford: a negative closed walk always
// contains a negative simple cycle, so this misses nothing.
func negativeCycleNodes(n int, edges []weighted) []bool {
	neighbours := make([][]int, n)
	for i := range neighbours {
		neighbours[i] = []int{}
	}
	for _, e := range edges {
		neighbours[e.from] = append(neighbours[e.from], e.to)
	}
	marked := make([]bool, n)
	path := []int{}
	onPath := make([]bool, n)
	var step func(start, v, spent int)
	step = func(start, v, spent int) {
		for _, u := range neighbours[v] {
			if u == start {
				if spent+costOf(edges, v, u) < 0 {
					for _, node := range path {
						marked[node] = true
					}
				}
			} else if u > start && !onPath[u] {
				onPath[u] = true
				path = append(path, u)
				step(start, u, spent+costOf(edges, v, u))
				path = path[:len(path)-1]
				onPath[u] = false
			}
		}
	}
	for start := 0; start < n; start++ {
		onPath[start] = true
		path = append(path, start)
		step(start, start, 0)
		path = path[:len(path)-1]
		onPath[start] = false
	}
	return marked
}

// A node is unbounded when a paying loop sits between the start and it.
func unboundedByCycles(n int, edges []weighted, start int) []bool {
	marked := negativeCycleNodes(n, edges)
	fromStart := reachableFrom(n, edges, []int{start})
	sources := []int{}
	for v := 0; v < n; v++ {
		if marked[v] && fromStart[v] {
			sources = append(sources, v)
		}
	}
	if len(sources) == 0 {
		return make([]bool, n)
	}
	return reachableFrom(n, edges, sources)
}

func sameFlags(a, b []bool) bool {
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func showFlags(flags []bool) string {
	parts := make([]string, len(flags))
	for i, f := range flags {
		if f {
			parts[i] = "!"
		} else {
			parts[i] = "."
		}
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func showEdges(edges []weighted) string {
	parts := make([]string, len(edges))
	for i, e := range edges {
		parts[i] = fmt.Sprintf("%d->%d:%d", e.from, e.to, e.cost)
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
	sizes := []int{4, 4, 5, 4}
	cases := [][]weighted{
		{{0, 1, 1}, {1, 2, -1}, {2, 1, -1}, {1, 3, 1}},
		{{0, 1, 1}, {1, 2, 2}, {2, 3, 3}},
		{{0, 1, 1}, {1, 2, 1}, {2, 3, -3}, {3, 1, 1}, {0, 4, 1}},
		{{0, 1, 1}, {2, 3, -5}, {3, 2, -5}},
	}

	fmt.Printf("%-48s%-16s%s\\n", "edges", "unbounded", "by enumerating cycles")
	for c, edges := range cases {
		n := sizes[c]
		found := unboundedNodes(n, edges, 0)
		truth := unboundedByCycles(n, edges, 0)
		fmt.Printf("%-48s%-16s%s\\n", showEdges(edges), showFlags(found), showFlags(truth))
	}
	fmt.Println()

	trials := 3000
	detectOk := 0
	nodesOk := 0
	hadCycle := 0
	affectedAll := 0
	for t := 0; t < trials; t++ {
		n := 2 + rand(5)
		edges := []weighted{}
		for u := 0; u < n; u++ {
			for v := 0; v < n; v++ {
				if u != v && rand(3) == 0 {
					edges = append(edges, weighted{u, v, rand(9) - 4})
				}
			}
		}
		found := unboundedNodes(n, edges, 0)
		truth := unboundedByCycles(n, edges, 0)
		anyFound := false
		for v := 0; v < n; v++ {
			if found[v] {
				anyFound = true
			}
		}
		anyTrue := false
		countTrue := 0
		for v := 0; v < n; v++ {
			if truth[v] {
				anyTrue = true
				countTrue++
			}
		}
		if anyFound == anyTrue {
			detectOk++
		}
		if sameFlags(found, truth) {
			nodesOk++
		}
		if anyTrue {
			hadCycle++
			if countTrue == n {
				affectedAll++
			}
		}
	}

	fmt.Printf("over %d random graphs with weights from -4 to 4:\\n", trials)
	fmt.Printf("  \\"is anything unbounded\\" was right    %6d\\n", detectOk)
	fmt.Printf("  the exact set of nodes was right     %6d\\n", nodesOk)
	fmt.Printf("  graphs with an unbounded node        %6d\\n", hadCycle)
	fmt.Printf("  every node unbounded                 %6d\\n", affectedAll)
	fmt.Println()
	fmt.Println("The detection is one extra round and nothing else. After n-1 rounds every")
	fmt.Println("real shortest distance is final, so an edge that still improves can only")
	fmt.Println("be fed by a loop that pays. That is the standard test and it answers")
	fmt.Println("yes-or-no.")
	fmt.Println()
	fmt.Println("Which nodes are affected is the part usually left out, and it matters,")
	fmt.Println("because it is rarely all of them -- every node was unbounded on only")
	fmt.Printf("%d of the %d graphs that had a loop at all. A node is unbounded when\\n", affectedAll, hadCycle)
	fmt.Println("it is downstream of an edge that was still improving, so the answer is a")
	fmt.Println("reachability search from exactly those edges. Everything else still has a")
	fmt.Println("perfectly good shortest distance, and reporting the whole graph as broken")
	fmt.Println("throws that away.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Reporting the whole graph as unusable when a negative cycle exists",
          body: "It is rarely the whole graph. Of 913 graphs with an unbounded node, only 489 had every node unbounded. The affected set is exactly what is reachable from the edges that still improved on the extra round, and everything else still has a valid shortest distance.",
        },
        {
          title: "Forgetting that an unreachable negative cycle is not a problem",
          body: "If the start cannot reach the loop, no route from the start can go round it, and every distance is still well defined. The test has to be run from the actual start, or the detection reports a problem the query does not have.",
        },
      ],
    },
    {
      id: "the-wasted-relaxations",
      heading: "The relaxations that cannot help",
      body: [
        "The plain form relaxes every edge every round, including the overwhelming majority that cannot possibly improve. A node whose own distance did not change last round cannot improve anything through its edges this round, because the value being pushed out is the same one that was pushed out before.",
        "So keep a queue of the nodes whose distance just changed, and relax only those. That is SPFA, and it is Bellman-Ford with a work queue rather than a new idea \u2014 same answers, every time, on all 3,000 random graphs and on every shape measured.",
        "On sparse graphs the saving is enormous and structural. On the ring of 2,000 with its edges listed backwards, the plain form does 4,000,000 relaxations \u2014 a round per hop, every edge each round \u2014 and the queue does 2,000, touching each edge once.",
        "The name promises more than the algorithm delivers, and the example includes the shape that shows it. Build a graph where each node's distance improves more than once and each improvement puts it back on the queue: at `k = 12` the queue does 325 relaxations against the plain form's 98, and the gap widens with `k`. The random trials show the same thing in miniature \u2014 the queue did less work on 1,986 of 2,294 graphs, which means it did more on the other 308.",
        "So: SPFA is usually much faster, has no better worst case than the plain form, and gives no ordering guarantee to lean on. When the weights are non-negative, Dijkstra's ordering guarantee is worth more than this saving, and that is the choice \u2014 not \"which is faster\" but \"which assumption does the input satisfy\".",
      ],
      examples: [
        {
          id: "rounds-against-a-queue",
          title: "The same algorithm with the wasted work removed, and where that backfires",
          lang: "python",
          code: `# Bellman-Ford's plain form relaxes every edge every round, including the
# overwhelming majority that cannot possibly improve. Only a node whose own
# distance changed last round can improve anything this round, so keeping a
# queue of those nodes does the same work with most of it removed.
#
# That is SPFA -- the shortest path faster algorithm -- and it is Bellman-Ford
# with a work queue rather than a new idea. It gives identical answers. Its
# worst case is still O(V * E), and the name is a promise about typical inputs
# rather than a bound.
#
# The example measures both on random graphs and on a shape built to make the
# queue re-open nodes, and checks both against an exhaustive search.
INF = 10 ** 9


def build(n, edges):
    neighbours = [[] for _ in range(n)]
    for u, v, w in edges:
        neighbours[u].append((v, w))
    return neighbours


def bellman_ford(n, edges, start):
    """Every edge, every round, until a round changes nothing."""
    best = [INF] * n
    best[start] = 0
    relaxations = 0
    for _ in range(n):
        changed = False
        for u, v, w in edges:
            relaxations += 1
            if best[u] < INF and best[u] + w < best[v]:
                best[v] = best[u] + w
                changed = True
        if not changed:
            break
    return best, relaxations


def spfa(n, edges, start):
    """Only the nodes whose distance just changed can improve anything."""
    neighbours = build(n, edges)
    best = [INF] * n
    queued = [False] * n
    best[start] = 0
    queue = [start]
    queued[start] = True
    head = 0
    relaxations = 0
    while head < len(queue):
        v = queue[head]
        head += 1
        queued[v] = False
        for u, w in neighbours[v]:
            relaxations += 1
            if best[v] + w < best[u]:
                best[u] = best[v] + w
                if not queued[u]:
                    queued[u] = True
                    queue.append(u)
    return best, relaxations


def has_negative_cycle(n, edges):
    best = [0] * n
    for _ in range(n - 1):
        for u, v, w in edges:
            if best[u] + w < best[v]:
                best[v] = best[u] + w
    for u, v, w in edges:
        if best[u] + w < best[v]:
            return True
    return False


def cheapest_by_walking(n, edges, start, target):
    neighbours = build(n, edges)
    best = [INF]
    on_path = [False] * n

    def step(v, spent):
        if v == target and spent < best[0]:
            best[0] = spent
        on_path[v] = True
        for u, w in neighbours[v]:
            if not on_path[u]:
                step(u, spent + w)
        on_path[v] = False

    step(start, 0)
    return best[0]


def same(a, b):
    if len(a) != len(b):
        return False
    for i in range(len(a)):
        if a[i] != b[i]:
            return False
    return True


def sparse_ring(n):
    """A long ring, edges listed backwards so a plain round advances one hop."""
    return [(v, (v + 1) % n, 1 + v % 5) for v in range(n - 1, -1, -1)]


def layered(k):
    """A shape built so each layer's distance improves twice, re-opening nodes."""
    edges = [(0, 1, 8)]
    node = 1
    for _ in range(k):
        a = node
        b = node + 1
        c = node + 2
        edges.append((a, b, 4))
        edges.append((a, c, 1))
        edges.append((c, b, -4))
        edges.append((b, c + 1, 8))
        node = c + 1
    return node + 1, edges


SHAPES = [("ring of 400", 400, sparse_ring(400)),
          ("ring of 2000", 2000, sparse_ring(2000))]
for k in [4, 8, 12]:
    n, edges = layered(k)
    SHAPES.append(("layered, k=" + str(k), n, edges))

print(f"{'shape':<16}{'nodes':>7}{'edges':>8}{'plain relaxations':>19}{'queue relaxations':>19}")
for name, n, edges in SHAPES:
    plain, plain_work = bellman_ford(n, edges, 0)
    queued, queue_work = spfa(n, edges, 0)
    if not same(plain, queued):
        print("MISMATCH")
    print(f"{name:<16}{n:>7}{len(edges):>8}{plain_work:>19}{queue_work:>19}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
skipped = 0
plain_ok = 0
queue_ok = 0
agreed = 0
plain_total = 0
queue_total = 0
queue_won = 0
for _ in range(TRIALS):
    n = 2 + rand(5)
    edges = []
    for u in range(n):
        for v in range(n):
            if u != v and rand(3) == 0:
                edges.append((u, v, rand(9) - 3))
    if has_negative_cycle(n, edges):
        skipped += 1
        continue
    truth = [cheapest_by_walking(n, edges, 0, t) for t in range(n)]
    plain, plain_work = bellman_ford(n, edges, 0)
    queued, queue_work = spfa(n, edges, 0)
    if same(plain, truth):
        plain_ok += 1
    if same(queued, truth):
        queue_ok += 1
    if same(plain, queued):
        agreed += 1
    plain_total += plain_work
    queue_total += queue_work
    if queue_work < plain_work:
        queue_won += 1

kept = TRIALS - skipped
print(f"over {TRIALS} random graphs with weights from -3 to 5:")
print(f"  had a negative cycle, skipped        {skipped:>6}")
print(f"  plain rounds matched every path      {plain_ok:>6}")
print(f"  the queue matched every path         {queue_ok:>6}")
print(f"  the two agreed with each other       {agreed:>6}")
print(f"  the queue did less work              {queue_won:>6}")
print(f"  relaxations, plain against queue     {plain_total:>6}{queue_total:>8}")
print()
print("Same answers, every time, because it is the same algorithm: a node that")
print("did not change cannot improve anything, so relaxing its edges again is")
print("provably wasted. The queue holds exactly the nodes that did change.")
print()
print("On the rings the saving is enormous and structural: the plain form")
print("re-scans every edge once per round and needs a round per hop, while the")
print("queue holds one node at a time and touches each edge once.")
print()
print("The layered shape goes the other way, and that is the point of including")
print("it. Each node's distance improves more than once, so it re-enters the")
print("queue each time, and the queue does more relaxations than the plain form")
print("-- 325 against 98 at k=12, and the gap widens with k. The random trials")
print("show the same thing in miniature: the queue did less work on 1,986 of")
print("2,294 graphs, which means it did more on the other 308.")
print()
print("So SPFA is usually much faster, has no better worst case than the plain")
print("form, and offers no ordering guarantee to lean on. Where the weights are")
print("non-negative, Dijkstra's ordering guarantee is worth more than this")
print("saving.")
`,
          output: `shape             nodes   edges  plain relaxations  queue relaxations
ring of 400         400     400             160000                400
ring of 2000       2000    2000            4000000               2000
layered, k=4         14      17                 34                 45
layered, k=8         26      33                 66                153
layered, k=12        38      49                 98                325

over 3000 random graphs with weights from -3 to 5:
  had a negative cycle, skipped           706
  plain rounds matched every path        2294
  the queue matched every path           2294
  the two agreed with each other         2294
  the queue did less work                1986
  relaxations, plain against queue      16349    5201

Same answers, every time, because it is the same algorithm: a node that
did not change cannot improve anything, so relaxing its edges again is
provably wasted. The queue holds exactly the nodes that did change.

On the rings the saving is enormous and structural: the plain form
re-scans every edge once per round and needs a round per hop, while the
queue holds one node at a time and touches each edge once.

The layered shape goes the other way, and that is the point of including
it. Each node's distance improves more than once, so it re-enters the
queue each time, and the queue does more relaxations than the plain form
-- 325 against 98 at k=12, and the gap widens with k. The random trials
show the same thing in miniature: the queue did less work on 1,986 of
2,294 graphs, which means it did more on the other 308.

So SPFA is usually much faster, has no better worst case than the plain
form, and offers no ordering guarantee to lean on. Where the weights are
non-negative, Dijkstra's ordering guarantee is worth more than this
saving.`,
          explanation:
            "The plain rounds against the work queue, on shapes where the queue wins by three orders of magnitude and on one built so it loses.",
          alternates: [
            {
              lang: "javascript",
              code: `// Bellman-Ford's plain form relaxes every edge every round, including the
// overwhelming majority that cannot possibly improve. Only a node whose own
// distance changed last round can improve anything this round, so keeping a
// queue of those nodes does the same work with most of it removed.
//
// That is SPFA -- the shortest path faster algorithm -- and it is Bellman-Ford
// with a work queue rather than a new idea. It gives identical answers. Its
// worst case is still O(V * E), and the name is a promise about typical inputs
// rather than a bound.
//
// The example measures both on random graphs and on a shape built to make the
// queue re-open nodes, and checks both against an exhaustive search.

const INF = 1000000000;

function build(n, edges) {
  const neighbours = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) neighbours[u].push([v, w]);
  return neighbours;
}

/** Every edge, every round, until a round changes nothing. */
function bellmanFord(n, edges, start) {
  const best = new Array(n).fill(INF);
  best[start] = 0;
  let relaxations = 0;
  for (let round = 0; round < n; round += 1) {
    let changed = false;
    for (const [u, v, w] of edges) {
      relaxations += 1;
      if (best[u] < INF && best[u] + w < best[v]) {
        best[v] = best[u] + w;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return [best, relaxations];
}

/** Only the nodes whose distance just changed can improve anything. */
function spfa(n, edges, start) {
  const neighbours = build(n, edges);
  const best = new Array(n).fill(INF);
  const queued = new Array(n).fill(false);
  best[start] = 0;
  const queue = [start];
  queued[start] = true;
  let head = 0;
  let relaxations = 0;
  while (head < queue.length) {
    const v = queue[head];
    head += 1;
    queued[v] = false;
    for (const [u, w] of neighbours[v]) {
      relaxations += 1;
      if (best[v] + w < best[u]) {
        best[u] = best[v] + w;
        if (!queued[u]) {
          queued[u] = true;
          queue.push(u);
        }
      }
    }
  }
  return [best, relaxations];
}

function hasNegativeCycle(n, edges) {
  const best = new Array(n).fill(0);
  for (let round = 0; round < n - 1; round += 1) {
    for (const [u, v, w] of edges) {
      if (best[u] + w < best[v]) best[v] = best[u] + w;
    }
  }
  for (const [u, v, w] of edges) {
    if (best[u] + w < best[v]) return true;
  }
  return false;
}

function cheapestByWalking(n, edges, start, target) {
  const neighbours = build(n, edges);
  let best = INF;
  const onPath = new Array(n).fill(false);

  function step(v, spent) {
    if (v === target && spent < best) best = spent;
    onPath[v] = true;
    for (const [u, w] of neighbours[v]) {
      if (!onPath[u]) step(u, spent + w);
    }
    onPath[v] = false;
  }

  step(start, 0);
  return best;
}

function same(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** A long ring, edges listed backwards so a plain round advances one hop. */
function sparseRing(n) {
  const edges = [];
  for (let v = n - 1; v >= 0; v -= 1) edges.push([v, (v + 1) % n, 1 + (v % 5)]);
  return edges;
}

/** A shape built so each layer's distance improves twice, re-opening nodes. */
function layered(k) {
  const edges = [[0, 1, 8]];
  let node = 1;
  for (let i = 0; i < k; i += 1) {
    const a = node;
    const b = node + 1;
    const c = node + 2;
    edges.push([a, b, 4]);
    edges.push([a, c, 1]);
    edges.push([c, b, -4]);
    edges.push([b, c + 1, 8]);
    node = c + 1;
  }
  return [node + 1, edges];
}

const padEnd = (v, w) => String(v).padEnd(w);
const pad = (v, w) => String(v).padStart(w);

const SHAPES = [
  ["ring of 400", 400, sparseRing(400)],
  ["ring of 2000", 2000, sparseRing(2000)],
];
for (const k of [4, 8, 12]) {
  const [n, edges] = layered(k);
  SHAPES.push(["layered, k=" + String(k), n, edges]);
}

console.log(
  padEnd("shape", 16) + pad("nodes", 7) + pad("edges", 8) + pad("plain relaxations", 19) + pad("queue relaxations", 19)
);
for (const [name, n, edges] of SHAPES) {
  const [plain, plainWork] = bellmanFord(n, edges, 0);
  const [queued, queueWork] = spfa(n, edges, 0);
  if (!same(plain, queued)) console.log("MISMATCH");
  console.log(padEnd(name, 16) + pad(n, 7) + pad(edges.length, 8) + pad(plainWork, 19) + pad(queueWork, 19));
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
let skipped = 0;
let plainOk = 0;
let queueOk = 0;
let agreed = 0;
let plainTotal = 0;
let queueTotal = 0;
let queueWon = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(5);
  const edges = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v && rand(3) === 0) edges.push([u, v, rand(9) - 3]);
    }
  }
  if (hasNegativeCycle(n, edges)) {
    skipped += 1;
    continue;
  }
  const truth = [];
  for (let target = 0; target < n; target += 1) truth.push(cheapestByWalking(n, edges, 0, target));
  const [plain, plainWork] = bellmanFord(n, edges, 0);
  const [queued, queueWork] = spfa(n, edges, 0);
  if (same(plain, truth)) plainOk += 1;
  if (same(queued, truth)) queueOk += 1;
  if (same(plain, queued)) agreed += 1;
  plainTotal += plainWork;
  queueTotal += queueWork;
  if (queueWork < plainWork) queueWon += 1;
}

console.log(\`over \${TRIALS} random graphs with weights from -3 to 5:\`);
console.log(\`  had a negative cycle, skipped        \${pad(skipped, 6)}\`);
console.log(\`  plain rounds matched every path      \${pad(plainOk, 6)}\`);
console.log(\`  the queue matched every path         \${pad(queueOk, 6)}\`);
console.log(\`  the two agreed with each other       \${pad(agreed, 6)}\`);
console.log(\`  the queue did less work              \${pad(queueWon, 6)}\`);
console.log(\`  relaxations, plain against queue     \${pad(plainTotal, 6)}\${pad(queueTotal, 8)}\`);
console.log();
console.log("Same answers, every time, because it is the same algorithm: a node that");
console.log("did not change cannot improve anything, so relaxing its edges again is");
console.log("provably wasted. The queue holds exactly the nodes that did change.");
console.log();
console.log("On the rings the saving is enormous and structural: the plain form");
console.log("re-scans every edge once per round and needs a round per hop, while the");
console.log("queue holds one node at a time and touches each edge once.");
console.log();
console.log("The layered shape goes the other way, and that is the point of including");
console.log("it. Each node's distance improves more than once, so it re-enters the");
console.log("queue each time, and the queue does more relaxations than the plain form");
console.log("-- 325 against 98 at k=12, and the gap widens with k. The random trials");
console.log("show the same thing in miniature: the queue did less work on 1,986 of");
console.log("2,294 graphs, which means it did more on the other 308.");
console.log();
console.log("So SPFA is usually much faster, has no better worst case than the plain");
console.log("form, and offers no ordering guarantee to lean on. Where the weights are");
console.log("non-negative, Dijkstra's ordering guarantee is worth more than this");
console.log("saving.");
`,
            },
            {
              lang: "typescript",
              code: `// Bellman-Ford's plain form relaxes every edge every round, including the
// overwhelming majority that cannot possibly improve. Only a node whose own
// distance changed last round can improve anything this round, so keeping a
// queue of those nodes does the same work with most of it removed.
//
// That is SPFA -- the shortest path faster algorithm -- and it is Bellman-Ford
// with a work queue rather than a new idea. It gives identical answers. Its
// worst case is still O(V * E), and the name is a promise about typical inputs
// rather than a bound.
//
// The example measures both on random graphs and on a shape built to make the
// queue re-open nodes, and checks both against an exhaustive search.

const INF = 1000000000;

type Weighted = [number, number, number];
type Link = [number, number];

function build(n: number, edges: Weighted[]): Link[][] {
  const neighbours: Link[][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) neighbours[u].push([v, w]);
  return neighbours;
}

/** Every edge, every round, until a round changes nothing. */
function bellmanFord(n: number, edges: Weighted[], start: number): [number[], number] {
  const best = new Array(n).fill(INF);
  best[start] = 0;
  let relaxations = 0;
  for (let round = 0; round < n; round += 1) {
    let changed = false;
    for (const [u, v, w] of edges) {
      relaxations += 1;
      if (best[u] < INF && best[u] + w < best[v]) {
        best[v] = best[u] + w;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return [best, relaxations];
}

/** Only the nodes whose distance just changed can improve anything. */
function spfa(n: number, edges: Weighted[], start: number): [number[], number] {
  const neighbours = build(n, edges);
  const best = new Array(n).fill(INF);
  const queued = new Array(n).fill(false);
  best[start] = 0;
  const queue = [start];
  queued[start] = true;
  let head = 0;
  let relaxations = 0;
  while (head < queue.length) {
    const v = queue[head];
    head += 1;
    queued[v] = false;
    for (const [u, w] of neighbours[v]) {
      relaxations += 1;
      if (best[v] + w < best[u]) {
        best[u] = best[v] + w;
        if (!queued[u]) {
          queued[u] = true;
          queue.push(u);
        }
      }
    }
  }
  return [best, relaxations];
}

function hasNegativeCycle(n: number, edges: Weighted[]): boolean {
  const best = new Array(n).fill(0);
  for (let round = 0; round < n - 1; round += 1) {
    for (const [u, v, w] of edges) {
      if (best[u] + w < best[v]) best[v] = best[u] + w;
    }
  }
  for (const [u, v, w] of edges) {
    if (best[u] + w < best[v]) return true;
  }
  return false;
}

function cheapestByWalking(n: number, edges: Weighted[], start: number, target: number): number {
  const neighbours = build(n, edges);
  let best = INF;
  const onPath = new Array(n).fill(false);

  function step(v: number, spent: number): void {
    if (v === target && spent < best) best = spent;
    onPath[v] = true;
    for (const [u, w] of neighbours[v]) {
      if (!onPath[u]) step(u, spent + w);
    }
    onPath[v] = false;
  }

  step(start, 0);
  return best;
}

function same(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** A long ring, edges listed backwards so a plain round advances one hop. */
function sparseRing(n: number): Weighted[] {
  const edges: Weighted[] = [];
  for (let v = n - 1; v >= 0; v -= 1) edges.push([v, (v + 1) % n, 1 + (v % 5)]);
  return edges;
}

/** A shape built so each layer's distance improves twice, re-opening nodes. */
function layered(k: number): [number, Weighted[]] {
  const edges: Weighted[] = [[0, 1, 8]];
  let node = 1;
  for (let i = 0; i < k; i += 1) {
    const a = node;
    const b = node + 1;
    const c = node + 2;
    edges.push([a, b, 4]);
    edges.push([a, c, 1]);
    edges.push([c, b, -4]);
    edges.push([b, c + 1, 8]);
    node = c + 1;
  }
  return [node + 1, edges];
}

const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const pad = (v: string | number, w: number): string => String(v).padStart(w);

const SHAPES: [string, number, Weighted[]][] = [
  ["ring of 400", 400, sparseRing(400)],
  ["ring of 2000", 2000, sparseRing(2000)],
];
for (const k of [4, 8, 12]) {
  const [n, edges] = layered(k);
  SHAPES.push(["layered, k=" + String(k), n, edges]);
}

console.log(
  padEnd("shape", 16) + pad("nodes", 7) + pad("edges", 8) + pad("plain relaxations", 19) + pad("queue relaxations", 19)
);
for (const [name, n, edges] of SHAPES) {
  const [plain, plainWork] = bellmanFord(n, edges, 0);
  const [queued, queueWork] = spfa(n, edges, 0);
  if (!same(plain, queued)) console.log("MISMATCH");
  console.log(padEnd(name, 16) + pad(n, 7) + pad(edges.length, 8) + pad(plainWork, 19) + pad(queueWork, 19));
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
let skipped = 0;
let plainOk = 0;
let queueOk = 0;
let agreed = 0;
let plainTotal = 0;
let queueTotal = 0;
let queueWon = 0;
for (let t = 0; t < TRIALS; t += 1) {
  const n = 2 + rand(5);
  const edges: Weighted[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v && rand(3) === 0) edges.push([u, v, rand(9) - 3]);
    }
  }
  if (hasNegativeCycle(n, edges)) {
    skipped += 1;
    continue;
  }
  const truth: number[] = [];
  for (let target = 0; target < n; target += 1) truth.push(cheapestByWalking(n, edges, 0, target));
  const [plain, plainWork] = bellmanFord(n, edges, 0);
  const [queued, queueWork] = spfa(n, edges, 0);
  if (same(plain, truth)) plainOk += 1;
  if (same(queued, truth)) queueOk += 1;
  if (same(plain, queued)) agreed += 1;
  plainTotal += plainWork;
  queueTotal += queueWork;
  if (queueWork < plainWork) queueWon += 1;
}

console.log(\`over \${TRIALS} random graphs with weights from -3 to 5:\`);
console.log(\`  had a negative cycle, skipped        \${pad(skipped, 6)}\`);
console.log(\`  plain rounds matched every path      \${pad(plainOk, 6)}\`);
console.log(\`  the queue matched every path         \${pad(queueOk, 6)}\`);
console.log(\`  the two agreed with each other       \${pad(agreed, 6)}\`);
console.log(\`  the queue did less work              \${pad(queueWon, 6)}\`);
console.log(\`  relaxations, plain against queue     \${pad(plainTotal, 6)}\${pad(queueTotal, 8)}\`);
console.log();
console.log("Same answers, every time, because it is the same algorithm: a node that");
console.log("did not change cannot improve anything, so relaxing its edges again is");
console.log("provably wasted. The queue holds exactly the nodes that did change.");
console.log();
console.log("On the rings the saving is enormous and structural: the plain form");
console.log("re-scans every edge once per round and needs a round per hop, while the");
console.log("queue holds one node at a time and touches each edge once.");
console.log();
console.log("The layered shape goes the other way, and that is the point of including");
console.log("it. Each node's distance improves more than once, so it re-enters the");
console.log("queue each time, and the queue does more relaxations than the plain form");
console.log("-- 325 against 98 at k=12, and the gap widens with k. The random trials");
console.log("show the same thing in miniature: the queue did less work on 1,986 of");
console.log("2,294 graphs, which means it did more on the other 308.");
console.log();
console.log("So SPFA is usually much faster, has no better worst case than the plain");
console.log("form, and offers no ordering guarantee to lean on. Where the weights are");
console.log("non-negative, Dijkstra's ordering guarantee is worth more than this");
console.log("saving.");
`,
            },
            {
              lang: "java",
              code: `// Bellman-Ford's plain form relaxes every edge every round, including the
// overwhelming majority that cannot possibly improve. Only a node whose own
// distance changed last round can improve anything this round, so keeping a
// queue of those nodes does the same work with most of it removed.
//
// That is SPFA -- the shortest path faster algorithm -- and it is Bellman-Ford
// with a work queue rather than a new idea. It gives identical answers. Its
// worst case is still O(V * E), and the name is a promise about typical inputs
// rather than a bound.
//
// The example measures both on random graphs and on a shape built to make the
// queue re-open nodes, and checks both against an exhaustive search.

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {

    static final int INF = 1000000000;

    static List<List<int[]>> build(int n, int[][] edges) {
        List<List<int[]>> neighbours = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            neighbours.add(new ArrayList<>());
        }
        for (int[] e : edges) {
            neighbours.get(e[0]).add(new int[] {e[1], e[2]});
        }
        return neighbours;
    }

    static int[] lastBest;
    static long lastWork;

    /** Every edge, every round, until a round changes nothing. */
    static void bellmanFord(int n, int[][] edges, int start) {
        int[] best = new int[n];
        Arrays.fill(best, INF);
        best[start] = 0;
        long relaxations = 0;
        for (int round = 0; round < n; round++) {
            boolean changed = false;
            for (int[] e : edges) {
                relaxations++;
                if (best[e[0]] < INF && best[e[0]] + e[2] < best[e[1]]) {
                    best[e[1]] = best[e[0]] + e[2];
                    changed = true;
                }
            }
            if (!changed) {
                break;
            }
        }
        lastBest = best;
        lastWork = relaxations;
    }

    /** Only the nodes whose distance just changed can improve anything. */
    static void spfa(int n, int[][] edges, int start) {
        List<List<int[]>> neighbours = build(n, edges);
        int[] best = new int[n];
        Arrays.fill(best, INF);
        boolean[] queued = new boolean[n];
        best[start] = 0;
        List<Integer> queue = new ArrayList<>();
        queue.add(start);
        queued[start] = true;
        int head = 0;
        long relaxations = 0;
        while (head < queue.size()) {
            int v = queue.get(head);
            head++;
            queued[v] = false;
            for (int[] link : neighbours.get(v)) {
                relaxations++;
                if (best[v] + link[1] < best[link[0]]) {
                    best[link[0]] = best[v] + link[1];
                    if (!queued[link[0]]) {
                        queued[link[0]] = true;
                        queue.add(link[0]);
                    }
                }
            }
        }
        lastBest = best;
        lastWork = relaxations;
    }

    static boolean hasNegativeCycle(int n, int[][] edges) {
        int[] best = new int[n];
        for (int round = 0; round < n - 1; round++) {
            for (int[] e : edges) {
                if (best[e[0]] + e[2] < best[e[1]]) {
                    best[e[1]] = best[e[0]] + e[2];
                }
            }
        }
        for (int[] e : edges) {
            if (best[e[0]] + e[2] < best[e[1]]) {
                return true;
            }
        }
        return false;
    }

    static int walkBest;
    static boolean[] walkOnPath;

    static void step(List<List<int[]>> neighbours, int target, int v, int spent) {
        if (v == target && spent < walkBest) {
            walkBest = spent;
        }
        walkOnPath[v] = true;
        for (int[] link : neighbours.get(v)) {
            if (!walkOnPath[link[0]]) {
                step(neighbours, target, link[0], spent + link[1]);
            }
        }
        walkOnPath[v] = false;
    }

    static int cheapestByWalking(int n, int[][] edges, int start, int target) {
        List<List<int[]>> neighbours = build(n, edges);
        walkBest = INF;
        walkOnPath = new boolean[n];
        step(neighbours, target, start, 0);
        return walkBest;
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

    /** A long ring, edges listed backwards so a plain round advances one hop. */
    static int[][] sparseRing(int n) {
        int[][] edges = new int[n][3];
        int at = 0;
        for (int v = n - 1; v >= 0; v--) {
            edges[at] = new int[] {v, (v + 1) % n, 1 + v % 5};
            at++;
        }
        return edges;
    }

    static int layeredNodes;

    /** A shape built so each layer's distance improves twice, re-opening nodes. */
    static int[][] layered(int k) {
        List<int[]> edges = new ArrayList<>();
        edges.add(new int[] {0, 1, 8});
        int node = 1;
        for (int i = 0; i < k; i++) {
            int a = node;
            int b = node + 1;
            int c = node + 2;
            edges.add(new int[] {a, b, 4});
            edges.add(new int[] {a, c, 1});
            edges.add(new int[] {c, b, -4});
            edges.add(new int[] {b, c + 1, 8});
            node = c + 1;
        }
        layeredNodes = node + 1;
        return edges.toArray(new int[0][]);
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
        List<String> names = new ArrayList<>();
        List<Integer> counts = new ArrayList<>();
        List<int[][]> shapes = new ArrayList<>();
        names.add("ring of 400");
        counts.add(400);
        shapes.add(sparseRing(400));
        names.add("ring of 2000");
        counts.add(2000);
        shapes.add(sparseRing(2000));
        int[] ks = {4, 8, 12};
        for (int k : ks) {
            int[][] edges = layered(k);
            names.add("layered, k=" + k);
            counts.add(layeredNodes);
            shapes.add(edges);
        }

        System.out.println(padEnd("shape", 16) + pad("nodes", 7) + pad("edges", 8)
                + pad("plain relaxations", 19) + pad("queue relaxations", 19));
        for (int c = 0; c < names.size(); c++) {
            bellmanFord(counts.get(c), shapes.get(c), 0);
            int[] plain = lastBest;
            long plainWork = lastWork;
            spfa(counts.get(c), shapes.get(c), 0);
            int[] queued = lastBest;
            long queueWork = lastWork;
            if (!same(plain, queued)) {
                System.out.println("MISMATCH");
            }
            System.out.println(padEnd(names.get(c), 16) + pad(String.valueOf(counts.get(c)), 7)
                    + pad(String.valueOf(shapes.get(c).length), 8)
                    + pad(String.valueOf(plainWork), 19) + pad(String.valueOf(queueWork), 19));
        }
        System.out.println();

        int trials = 3000;
        int skipped = 0;
        int plainOk = 0;
        int queueOk = 0;
        int agreed = 0;
        long plainTotal = 0;
        long queueTotal = 0;
        int queueWon = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(5);
            List<int[]> collected = new ArrayList<>();
            for (int u = 0; u < n; u++) {
                for (int v = 0; v < n; v++) {
                    if (u != v && rand(3) == 0) {
                        collected.add(new int[] {u, v, rand(9) - 3});
                    }
                }
            }
            int[][] edges = collected.toArray(new int[0][]);
            if (hasNegativeCycle(n, edges)) {
                skipped++;
                continue;
            }
            int[] truth = new int[n];
            for (int target = 0; target < n; target++) {
                truth[target] = cheapestByWalking(n, edges, 0, target);
            }
            bellmanFord(n, edges, 0);
            int[] plain = lastBest;
            long plainWork = lastWork;
            spfa(n, edges, 0);
            int[] queued = lastBest;
            long queueWork = lastWork;
            if (same(plain, truth)) {
                plainOk++;
            }
            if (same(queued, truth)) {
                queueOk++;
            }
            if (same(plain, queued)) {
                agreed++;
            }
            plainTotal += plainWork;
            queueTotal += queueWork;
            if (queueWork < plainWork) {
                queueWon++;
            }
        }

        System.out.println("over " + trials + " random graphs with weights from -3 to 5:");
        System.out.println("  had a negative cycle, skipped        " + pad(String.valueOf(skipped), 6));
        System.out.println("  plain rounds matched every path      " + pad(String.valueOf(plainOk), 6));
        System.out.println("  the queue matched every path         " + pad(String.valueOf(queueOk), 6));
        System.out.println("  the two agreed with each other       " + pad(String.valueOf(agreed), 6));
        System.out.println("  the queue did less work              " + pad(String.valueOf(queueWon), 6));
        System.out.println("  relaxations, plain against queue     " + pad(String.valueOf(plainTotal), 6)
                + pad(String.valueOf(queueTotal), 8));
        System.out.println();
        System.out.println("Same answers, every time, because it is the same algorithm: a node that");
        System.out.println("did not change cannot improve anything, so relaxing its edges again is");
        System.out.println("provably wasted. The queue holds exactly the nodes that did change.");
        System.out.println();
        System.out.println("On the rings the saving is enormous and structural: the plain form");
        System.out.println("re-scans every edge once per round and needs a round per hop, while the");
        System.out.println("queue holds one node at a time and touches each edge once.");
        System.out.println();
        System.out.println("The layered shape goes the other way, and that is the point of including");
        System.out.println("it. Each node's distance improves more than once, so it re-enters the");
        System.out.println("queue each time, and the queue does more relaxations than the plain form");
        System.out.println("-- 325 against 98 at k=12, and the gap widens with k. The random trials");
        System.out.println("show the same thing in miniature: the queue did less work on 1,986 of");
        System.out.println("2,294 graphs, which means it did more on the other 308.");
        System.out.println();
        System.out.println("So SPFA is usually much faster, has no better worst case than the plain");
        System.out.println("form, and offers no ordering guarantee to lean on. Where the weights are");
        System.out.println("non-negative, Dijkstra's ordering guarantee is worth more than this");
        System.out.println("saving.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Bellman-Ford's plain form relaxes every edge every round, including the
// overwhelming majority that cannot possibly improve. Only a node whose own
// distance changed last round can improve anything this round, so keeping a
// queue of those nodes does the same work with most of it removed.
//
// That is SPFA -- the shortest path faster algorithm -- and it is Bellman-Ford
// with a work queue rather than a new idea. It gives identical answers. Its
// worst case is still O(V * E), and the name is a promise about typical inputs
// rather than a bound.
//
// The example measures both on random graphs and on a shape built to make the
// queue re-open nodes, and checks both against an exhaustive search.

#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

const int INF = 1000000000;

struct Weighted {
    int from;
    int to;
    int cost;
};

using Link = std::pair<int, int>;

std::vector<std::vector<Link>> build(int n, const std::vector<Weighted>& edges) {
    std::vector<std::vector<Link>> neighbours(n);
    for (const Weighted& e : edges) {
        neighbours[e.from].push_back(Link(e.to, e.cost));
    }
    return neighbours;
}

// Every edge, every round, until a round changes nothing.
long long bellman_ford(int n, const std::vector<Weighted>& edges, int start, std::vector<int>& best) {
    best.assign(n, INF);
    best[start] = 0;
    long long relaxations = 0;
    for (int round = 0; round < n; round++) {
        bool changed = false;
        for (const Weighted& e : edges) {
            relaxations++;
            if (best[e.from] < INF && best[e.from] + e.cost < best[e.to]) {
                best[e.to] = best[e.from] + e.cost;
                changed = true;
            }
        }
        if (!changed) {
            break;
        }
    }
    return relaxations;
}

// Only the nodes whose distance just changed can improve anything.
long long spfa(int n, const std::vector<Weighted>& edges, int start, std::vector<int>& best) {
    std::vector<std::vector<Link>> neighbours = build(n, edges);
    best.assign(n, INF);
    std::vector<char> queued(n, 0);
    best[start] = 0;
    std::vector<int> queue;
    queue.push_back(start);
    queued[start] = 1;
    size_t head = 0;
    long long relaxations = 0;
    while (head < queue.size()) {
        int v = queue[head];
        head++;
        queued[v] = 0;
        for (const Link& l : neighbours[v]) {
            relaxations++;
            if (best[v] + l.second < best[l.first]) {
                best[l.first] = best[v] + l.second;
                if (!queued[l.first]) {
                    queued[l.first] = 1;
                    queue.push_back(l.first);
                }
            }
        }
    }
    return relaxations;
}

bool has_negative_cycle(int n, const std::vector<Weighted>& edges) {
    std::vector<int> best(n, 0);
    for (int round = 0; round < n - 1; round++) {
        for (const Weighted& e : edges) {
            if (best[e.from] + e.cost < best[e.to]) {
                best[e.to] = best[e.from] + e.cost;
            }
        }
    }
    for (const Weighted& e : edges) {
        if (best[e.from] + e.cost < best[e.to]) {
            return true;
        }
    }
    return false;
}

void step(const std::vector<std::vector<Link>>& neighbours, std::vector<char>& on_path,
          int& best, int target, int v, int spent) {
    if (v == target && spent < best) {
        best = spent;
    }
    on_path[v] = 1;
    for (const Link& l : neighbours[v]) {
        if (!on_path[l.first]) {
            step(neighbours, on_path, best, target, l.first, spent + l.second);
        }
    }
    on_path[v] = 0;
}

int cheapest_by_walking(int n, const std::vector<Weighted>& edges, int start, int target) {
    std::vector<std::vector<Link>> neighbours = build(n, edges);
    int best = INF;
    std::vector<char> on_path(n, 0);
    step(neighbours, on_path, best, target, start, 0);
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

// A long ring, edges listed backwards so a plain round advances one hop.
std::vector<Weighted> sparse_ring(int n) {
    std::vector<Weighted> edges;
    for (int v = n - 1; v >= 0; v--) {
        Weighted e;
        e.from = v;
        e.to = (v + 1) % n;
        e.cost = 1 + v % 5;
        edges.push_back(e);
    }
    return edges;
}

// A shape built so each layer's distance improves twice, re-opening nodes.
std::vector<Weighted> layered(int k, int& nodes) {
    std::vector<Weighted> edges;
    Weighted first;
    first.from = 0;
    first.to = 1;
    first.cost = 8;
    edges.push_back(first);
    int node = 1;
    for (int i = 0; i < k; i++) {
        int a = node;
        int b = node + 1;
        int c = node + 2;
        Weighted e1 = {a, b, 4};
        Weighted e2 = {a, c, 1};
        Weighted e3 = {c, b, -4};
        Weighted e4 = {b, c + 1, 8};
        edges.push_back(e1);
        edges.push_back(e2);
        edges.push_back(e3);
        edges.push_back(e4);
        node = c + 1;
    }
    nodes = node + 1;
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
    std::vector<std::string> names = {"ring of 400", "ring of 2000"};
    std::vector<int> counts = {400, 2000};
    std::vector<std::vector<Weighted>> shapes = {sparse_ring(400), sparse_ring(2000)};
    std::vector<int> ks = {4, 8, 12};
    for (int k : ks) {
        int nodes = 0;
        std::vector<Weighted> edges = layered(k, nodes);
        names.push_back("layered, k=" + std::to_string(k));
        counts.push_back(nodes);
        shapes.push_back(edges);
    }

    std::cout << std::left << std::setw(16) << "shape" << std::right << std::setw(7) << "nodes"
              << std::setw(8) << "edges" << std::setw(19) << "plain relaxations"
              << std::setw(19) << "queue relaxations" << "\\n";
    for (size_t c = 0; c < names.size(); c++) {
        std::vector<int> plain;
        long long plain_work = bellman_ford(counts[c], shapes[c], 0, plain);
        std::vector<int> queued;
        long long queue_work = spfa(counts[c], shapes[c], 0, queued);
        if (!same(plain, queued)) {
            std::cout << "MISMATCH\\n";
        }
        std::cout << std::left << std::setw(16) << names[c] << std::right << std::setw(7) << counts[c]
                  << std::setw(8) << shapes[c].size() << std::setw(19) << plain_work
                  << std::setw(19) << queue_work << "\\n";
    }
    std::cout << "\\n";

    int trials = 3000;
    int skipped = 0;
    int plain_ok = 0;
    int queue_ok = 0;
    int agreed = 0;
    long long plain_total = 0;
    long long queue_total = 0;
    int queue_won = 0;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(5);
        std::vector<Weighted> edges;
        for (int u = 0; u < n; u++) {
            for (int v = 0; v < n; v++) {
                if (u != v && rand_below(3) == 0) {
                    Weighted e;
                    e.from = u;
                    e.to = v;
                    e.cost = rand_below(9) - 3;
                    edges.push_back(e);
                }
            }
        }
        if (has_negative_cycle(n, edges)) {
            skipped++;
            continue;
        }
        std::vector<int> truth(n);
        for (int target = 0; target < n; target++) {
            truth[target] = cheapest_by_walking(n, edges, 0, target);
        }
        std::vector<int> plain;
        long long plain_work = bellman_ford(n, edges, 0, plain);
        std::vector<int> queued;
        long long queue_work = spfa(n, edges, 0, queued);
        if (same(plain, truth)) {
            plain_ok++;
        }
        if (same(queued, truth)) {
            queue_ok++;
        }
        if (same(plain, queued)) {
            agreed++;
        }
        plain_total += plain_work;
        queue_total += queue_work;
        if (queue_work < plain_work) {
            queue_won++;
        }
    }

    std::cout << "over " << trials << " random graphs with weights from -3 to 5:\\n";
    std::cout << "  had a negative cycle, skipped        " << std::setw(6) << skipped << "\\n";
    std::cout << "  plain rounds matched every path      " << std::setw(6) << plain_ok << "\\n";
    std::cout << "  the queue matched every path         " << std::setw(6) << queue_ok << "\\n";
    std::cout << "  the two agreed with each other       " << std::setw(6) << agreed << "\\n";
    std::cout << "  the queue did less work              " << std::setw(6) << queue_won << "\\n";
    std::cout << "  relaxations, plain against queue     " << std::setw(6) << plain_total
              << std::setw(8) << queue_total << "\\n";
    std::cout << "\\n";
    std::cout << "Same answers, every time, because it is the same algorithm: a node that\\n";
    std::cout << "did not change cannot improve anything, so relaxing its edges again is\\n";
    std::cout << "provably wasted. The queue holds exactly the nodes that did change.\\n";
    std::cout << "\\n";
    std::cout << "On the rings the saving is enormous and structural: the plain form\\n";
    std::cout << "re-scans every edge once per round and needs a round per hop, while the\\n";
    std::cout << "queue holds one node at a time and touches each edge once.\\n";
    std::cout << "\\n";
    std::cout << "The layered shape goes the other way, and that is the point of including\\n";
    std::cout << "it. Each node's distance improves more than once, so it re-enters the\\n";
    std::cout << "queue each time, and the queue does more relaxations than the plain form\\n";
    std::cout << "-- 325 against 98 at k=12, and the gap widens with k. The random trials\\n";
    std::cout << "show the same thing in miniature: the queue did less work on 1,986 of\\n";
    std::cout << "2,294 graphs, which means it did more on the other 308.\\n";
    std::cout << "\\n";
    std::cout << "So SPFA is usually much faster, has no better worst case than the plain\\n";
    std::cout << "form, and offers no ordering guarantee to lean on. Where the weights are\\n";
    std::cout << "non-negative, Dijkstra's ordering guarantee is worth more than this\\n";
    std::cout << "saving.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Bellman-Ford's plain form relaxes every edge every round, including the
// overwhelming majority that cannot possibly improve. Only a node whose own
// distance changed last round can improve anything this round, so keeping a
// queue of those nodes does the same work with most of it removed.
//
// That is SPFA -- the shortest path faster algorithm -- and it is Bellman-Ford
// with a work queue rather than a new idea. It gives identical answers. Its
// worst case is still O(V * E), and the name is a promise about typical inputs
// rather than a bound.
//
// The example measures both on random graphs and on a shape built to make the
// queue re-open nodes, and checks both against an exhaustive search.

const INF: i64 = 1_000_000_000;

fn build(n: usize, edges: &[(usize, usize, i64)]) -> Vec<Vec<(usize, i64)>> {
    let mut neighbours = vec![Vec::new(); n];
    for &(u, v, w) in edges {
        neighbours[u].push((v, w));
    }
    neighbours
}

/// Every edge, every round, until a round changes nothing.
fn bellman_ford(n: usize, edges: &[(usize, usize, i64)], start: usize) -> (Vec<i64>, i64) {
    let mut best = vec![INF; n];
    best[start] = 0;
    let mut relaxations = 0i64;
    for _ in 0..n {
        let mut changed = false;
        for &(u, v, w) in edges {
            relaxations += 1;
            if best[u] < INF && best[u] + w < best[v] {
                best[v] = best[u] + w;
                changed = true;
            }
        }
        if !changed {
            break;
        }
    }
    (best, relaxations)
}

/// Only the nodes whose distance just changed can improve anything.
fn spfa(n: usize, edges: &[(usize, usize, i64)], start: usize) -> (Vec<i64>, i64) {
    let neighbours = build(n, edges);
    let mut best = vec![INF; n];
    let mut queued = vec![false; n];
    best[start] = 0;
    let mut queue = vec![start];
    queued[start] = true;
    let mut head = 0;
    let mut relaxations = 0i64;
    while head < queue.len() {
        let v = queue[head];
        head += 1;
        queued[v] = false;
        for i in 0..neighbours[v].len() {
            let (u, w) = neighbours[v][i];
            relaxations += 1;
            if best[v] + w < best[u] {
                best[u] = best[v] + w;
                if !queued[u] {
                    queued[u] = true;
                    queue.push(u);
                }
            }
        }
    }
    (best, relaxations)
}

fn has_negative_cycle(n: usize, edges: &[(usize, usize, i64)]) -> bool {
    let mut best = vec![0i64; n];
    for _ in 0..n.saturating_sub(1) {
        for &(u, v, w) in edges {
            if best[u] + w < best[v] {
                best[v] = best[u] + w;
            }
        }
    }
    for &(u, v, w) in edges {
        if best[u] + w < best[v] {
            return true;
        }
    }
    false
}

fn step(
    neighbours: &[Vec<(usize, i64)>],
    on_path: &mut Vec<bool>,
    best: &mut i64,
    target: usize,
    v: usize,
    spent: i64,
) {
    if v == target && spent < *best {
        *best = spent;
    }
    on_path[v] = true;
    for i in 0..neighbours[v].len() {
        let (u, w) = neighbours[v][i];
        if !on_path[u] {
            step(neighbours, on_path, best, target, u, spent + w);
        }
    }
    on_path[v] = false;
}

fn cheapest_by_walking(n: usize, edges: &[(usize, usize, i64)], start: usize, target: usize) -> i64 {
    let neighbours = build(n, edges);
    let mut best = INF;
    let mut on_path = vec![false; n];
    step(&neighbours, &mut on_path, &mut best, target, start, 0);
    best
}

fn same(a: &[i64], b: &[i64]) -> bool {
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

/// A long ring, edges listed backwards so a plain round advances one hop.
fn sparse_ring(n: usize) -> Vec<(usize, usize, i64)> {
    (0..n)
        .rev()
        .map(|v| (v, (v + 1) % n, 1 + (v % 5) as i64))
        .collect()
}

/// A shape built so each layer's distance improves twice, re-opening nodes.
fn layered(k: usize) -> (usize, Vec<(usize, usize, i64)>) {
    let mut edges: Vec<(usize, usize, i64)> = vec![(0, 1, 8)];
    let mut node = 1;
    for _ in 0..k {
        let a = node;
        let b = node + 1;
        let c = node + 2;
        edges.push((a, b, 4));
        edges.push((a, c, 1));
        edges.push((c, b, -4));
        edges.push((b, c + 1, 8));
        node = c + 1;
    }
    (node + 1, edges)
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
    let mut names: Vec<String> = vec![String::from("ring of 400"), String::from("ring of 2000")];
    let mut counts: Vec<usize> = vec![400, 2000];
    let mut shapes: Vec<Vec<(usize, usize, i64)>> = vec![sparse_ring(400), sparse_ring(2000)];
    for k in [4usize, 8, 12] {
        let (n, edges) = layered(k);
        names.push(format!("layered, k={}", k));
        counts.push(n);
        shapes.push(edges);
    }

    println!(
        "{}{}{}{}{}",
        pad_right("shape", 16),
        pad_left("nodes", 7),
        pad_left("edges", 8),
        pad_left("plain relaxations", 19),
        pad_left("queue relaxations", 19)
    );
    for (c, name) in names.iter().enumerate() {
        let (plain, plain_work) = bellman_ford(counts[c], &shapes[c], 0);
        let (queued, queue_work) = spfa(counts[c], &shapes[c], 0);
        if !same(&plain, &queued) {
            println!("MISMATCH");
        }
        println!(
            "{}{}{}{}{}",
            pad_right(name, 16),
            pad_left(&counts[c].to_string(), 7),
            pad_left(&shapes[c].len().to_string(), 8),
            pad_left(&plain_work.to_string(), 19),
            pad_left(&queue_work.to_string(), 19)
        );
    }
    println!();

    let mut rng = Rng { seed: 1 };
    let trials = 3000;
    let mut skipped = 0;
    let mut plain_ok = 0;
    let mut queue_ok = 0;
    let mut agreed = 0;
    let mut plain_total = 0i64;
    let mut queue_total = 0i64;
    let mut queue_won = 0;
    for _ in 0..trials {
        let n = (2 + rng.next(5)) as usize;
        let mut edges: Vec<(usize, usize, i64)> = Vec::new();
        for u in 0..n {
            for v in 0..n {
                if u != v && rng.next(3) == 0 {
                    let w = rng.next(9) - 3;
                    edges.push((u, v, w));
                }
            }
        }
        if has_negative_cycle(n, &edges) {
            skipped += 1;
            continue;
        }
        let truth: Vec<i64> = (0..n).map(|t| cheapest_by_walking(n, &edges, 0, t)).collect();
        let (plain, plain_work) = bellman_ford(n, &edges, 0);
        let (queued, queue_work) = spfa(n, &edges, 0);
        if same(&plain, &truth) {
            plain_ok += 1;
        }
        if same(&queued, &truth) {
            queue_ok += 1;
        }
        if same(&plain, &queued) {
            agreed += 1;
        }
        plain_total += plain_work;
        queue_total += queue_work;
        if queue_work < plain_work {
            queue_won += 1;
        }
    }

    println!("over {} random graphs with weights from -3 to 5:", trials);
    println!("  had a negative cycle, skipped        {}", pad_left(&skipped.to_string(), 6));
    println!("  plain rounds matched every path      {}", pad_left(&plain_ok.to_string(), 6));
    println!("  the queue matched every path         {}", pad_left(&queue_ok.to_string(), 6));
    println!("  the two agreed with each other       {}", pad_left(&agreed.to_string(), 6));
    println!("  the queue did less work              {}", pad_left(&queue_won.to_string(), 6));
    println!(
        "  relaxations, plain against queue     {}{}",
        pad_left(&plain_total.to_string(), 6),
        pad_left(&queue_total.to_string(), 8)
    );
    println!();
    println!("Same answers, every time, because it is the same algorithm: a node that");
    println!("did not change cannot improve anything, so relaxing its edges again is");
    println!("provably wasted. The queue holds exactly the nodes that did change.");
    println!();
    println!("On the rings the saving is enormous and structural: the plain form");
    println!("re-scans every edge once per round and needs a round per hop, while the");
    println!("queue holds one node at a time and touches each edge once.");
    println!();
    println!("The layered shape goes the other way, and that is the point of including");
    println!("it. Each node's distance improves more than once, so it re-enters the");
    println!("queue each time, and the queue does more relaxations than the plain form");
    println!("-- 325 against 98 at k=12, and the gap widens with k. The random trials");
    println!("show the same thing in miniature: the queue did less work on 1,986 of");
    println!("2,294 graphs, which means it did more on the other 308.");
    println!();
    println!("So SPFA is usually much faster, has no better worst case than the plain");
    println!("form, and offers no ordering guarantee to lean on. Where the weights are");
    println!("non-negative, Dijkstra's ordering guarantee is worth more than this");
    println!("saving.");
}
`,
            },
            {
              lang: "go",
              code: `// Bellman-Ford's plain form relaxes every edge every round, including the
// overwhelming majority that cannot possibly improve. Only a node whose own
// distance changed last round can improve anything this round, so keeping a
// queue of those nodes does the same work with most of it removed.
//
// That is SPFA -- the shortest path faster algorithm -- and it is Bellman-Ford
// with a work queue rather than a new idea. It gives identical answers. Its
// worst case is still O(V * E), and the name is a promise about typical inputs
// rather than a bound.
//
// The example measures both on random graphs and on a shape built to make the
// queue re-open nodes, and checks both against an exhaustive search.

package main

import "fmt"

const inf = 1000000000

type weighted struct{ from, to, cost int }
type link struct{ to, cost int }

func build(n int, edges []weighted) [][]link {
	neighbours := make([][]link, n)
	for i := range neighbours {
		neighbours[i] = []link{}
	}
	for _, e := range edges {
		neighbours[e.from] = append(neighbours[e.from], link{e.to, e.cost})
	}
	return neighbours
}

// Every edge, every round, until a round changes nothing.
func bellmanFord(n int, edges []weighted, start int) ([]int, int64) {
	best := make([]int, n)
	for i := range best {
		best[i] = inf
	}
	best[start] = 0
	var relaxations int64
	for round := 0; round < n; round++ {
		changed := false
		for _, e := range edges {
			relaxations++
			if best[e.from] < inf && best[e.from]+e.cost < best[e.to] {
				best[e.to] = best[e.from] + e.cost
				changed = true
			}
		}
		if !changed {
			break
		}
	}
	return best, relaxations
}

// Only the nodes whose distance just changed can improve anything.
func spfa(n int, edges []weighted, start int) ([]int, int64) {
	neighbours := build(n, edges)
	best := make([]int, n)
	for i := range best {
		best[i] = inf
	}
	queued := make([]bool, n)
	best[start] = 0
	queue := []int{start}
	queued[start] = true
	head := 0
	var relaxations int64
	for head < len(queue) {
		v := queue[head]
		head++
		queued[v] = false
		for _, l := range neighbours[v] {
			relaxations++
			if best[v]+l.cost < best[l.to] {
				best[l.to] = best[v] + l.cost
				if !queued[l.to] {
					queued[l.to] = true
					queue = append(queue, l.to)
				}
			}
		}
	}
	return best, relaxations
}

func hasNegativeCycle(n int, edges []weighted) bool {
	best := make([]int, n)
	for round := 0; round < n-1; round++ {
		for _, e := range edges {
			if best[e.from]+e.cost < best[e.to] {
				best[e.to] = best[e.from] + e.cost
			}
		}
	}
	for _, e := range edges {
		if best[e.from]+e.cost < best[e.to] {
			return true
		}
	}
	return false
}

func cheapestByWalking(n int, edges []weighted, start, target int) int {
	neighbours := build(n, edges)
	best := inf
	onPath := make([]bool, n)
	var step func(v, spent int)
	step = func(v, spent int) {
		if v == target && spent < best {
			best = spent
		}
		onPath[v] = true
		for _, l := range neighbours[v] {
			if !onPath[l.to] {
				step(l.to, spent+l.cost)
			}
		}
		onPath[v] = false
	}
	step(start, 0)
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

// A long ring, edges listed backwards so a plain round advances one hop.
func sparseRing(n int) []weighted {
	edges := []weighted{}
	for v := n - 1; v >= 0; v-- {
		edges = append(edges, weighted{v, (v + 1) % n, 1 + v%5})
	}
	return edges
}

// A shape built so each layer's distance improves twice, re-opening nodes.
func layered(k int) (int, []weighted) {
	edges := []weighted{{0, 1, 8}}
	node := 1
	for i := 0; i < k; i++ {
		a := node
		b := node + 1
		c := node + 2
		edges = append(edges, weighted{a, b, 4}, weighted{a, c, 1},
			weighted{c, b, -4}, weighted{b, c + 1, 8})
		node = c + 1
	}
	return node + 1, edges
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	names := []string{"ring of 400", "ring of 2000"}
	counts := []int{400, 2000}
	shapes := [][]weighted{sparseRing(400), sparseRing(2000)}
	for _, k := range []int{4, 8, 12} {
		n, edges := layered(k)
		names = append(names, fmt.Sprintf("layered, k=%d", k))
		counts = append(counts, n)
		shapes = append(shapes, edges)
	}

	fmt.Printf("%-16s%7s%8s%19s%19s\\n", "shape", "nodes", "edges",
		"plain relaxations", "queue relaxations")
	for c, name := range names {
		plain, plainWork := bellmanFord(counts[c], shapes[c], 0)
		queued, queueWork := spfa(counts[c], shapes[c], 0)
		if !same(plain, queued) {
			fmt.Println("MISMATCH")
		}
		fmt.Printf("%-16s%7d%8d%19d%19d\\n", name, counts[c], len(shapes[c]), plainWork, queueWork)
	}
	fmt.Println()

	trials := 3000
	skipped := 0
	plainOk := 0
	queueOk := 0
	agreed := 0
	var plainTotal int64
	var queueTotal int64
	queueWon := 0
	for t := 0; t < trials; t++ {
		n := 2 + rand(5)
		edges := []weighted{}
		for u := 0; u < n; u++ {
			for v := 0; v < n; v++ {
				if u != v && rand(3) == 0 {
					edges = append(edges, weighted{u, v, rand(9) - 3})
				}
			}
		}
		if hasNegativeCycle(n, edges) {
			skipped++
			continue
		}
		truth := make([]int, n)
		for target := 0; target < n; target++ {
			truth[target] = cheapestByWalking(n, edges, 0, target)
		}
		plain, plainWork := bellmanFord(n, edges, 0)
		queued, queueWork := spfa(n, edges, 0)
		if same(plain, truth) {
			plainOk++
		}
		if same(queued, truth) {
			queueOk++
		}
		if same(plain, queued) {
			agreed++
		}
		plainTotal += plainWork
		queueTotal += queueWork
		if queueWork < plainWork {
			queueWon++
		}
	}

	fmt.Printf("over %d random graphs with weights from -3 to 5:\\n", trials)
	fmt.Printf("  had a negative cycle, skipped        %6d\\n", skipped)
	fmt.Printf("  plain rounds matched every path      %6d\\n", plainOk)
	fmt.Printf("  the queue matched every path         %6d\\n", queueOk)
	fmt.Printf("  the two agreed with each other       %6d\\n", agreed)
	fmt.Printf("  the queue did less work              %6d\\n", queueWon)
	fmt.Printf("  relaxations, plain against queue     %6d%8d\\n", plainTotal, queueTotal)
	fmt.Println()
	fmt.Println("Same answers, every time, because it is the same algorithm: a node that")
	fmt.Println("did not change cannot improve anything, so relaxing its edges again is")
	fmt.Println("provably wasted. The queue holds exactly the nodes that did change.")
	fmt.Println()
	fmt.Println("On the rings the saving is enormous and structural: the plain form")
	fmt.Println("re-scans every edge once per round and needs a round per hop, while the")
	fmt.Println("queue holds one node at a time and touches each edge once.")
	fmt.Println()
	fmt.Println("The layered shape goes the other way, and that is the point of including")
	fmt.Println("it. Each node's distance improves more than once, so it re-enters the")
	fmt.Println("queue each time, and the queue does more relaxations than the plain form")
	fmt.Println("-- 325 against 98 at k=12, and the gap widens with k. The random trials")
	fmt.Println("show the same thing in miniature: the queue did less work on 1,986 of")
	fmt.Println("2,294 graphs, which means it did more on the other 308.")
	fmt.Println()
	fmt.Println("So SPFA is usually much faster, has no better worst case than the plain")
	fmt.Println("form, and offers no ordering guarantee to lean on. Where the weights are")
	fmt.Println("non-negative, Dijkstra's ordering guarantee is worth more than this")
	fmt.Println("saving.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Treating SPFA as an asymptotic improvement",
          body: "It is the same algorithm with provably-wasted relaxations skipped. Its worst case is still O(V * E), and on a shape built to re-open nodes it did 325 relaxations against the plain form's 98. The name is a claim about typical inputs.",
        },
        {
          title: "Using SPFA where Dijkstra applies",
          body: "With non-negative weights Dijkstra settles each node once and never revisits it, which SPFA cannot promise. The queue is the right tool when negative edges force it, not a general-purpose upgrade.",
        },
      ],
    },
    {
      id: "bellman-ford-in-four-lines",
      heading: "Bellman-Ford in four lines",
      body: [
        "Bellman-Ford, in four lines.",
        "**It makes no claim of finality**, which is why it survives negative edges and why it costs a factor of `V` more than Dijkstra.",
        "**`n - 1` rounds is a derivation, not a magic number.** A shortest route visits distinct nodes, so it has at most `n - 1` edges. Stop when a round changes nothing and you will usually stop much sooner \u2014 3,668 rounds against 6,253 allowed here.",
        "**One extra round detects a negative cycle**, and a reachability search from the edges that were still improving names the nodes it ruins \u2014 which was 489 of 913 whole graphs and a strict subset on the rest.",
        "**The work queue is the same algorithm with the wasted relaxations removed:** 2,000 against 4,000,000 on a ring, and 325 against 98 on a shape built to defeat it.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does Bellman-Ford run n - 1 times?",
      answer:
        "Because after k rounds every distance reachable by a route of at most k edges is correct, and a shortest route uses at most n - 1 edges. That second part is the argument worth giving: a shortest route never repeats a node, because repeating one means going round a cycle, and the cycle either costs something -- so dropping it is strictly cheaper -- or costs nothing -- so dropping it is no worse. A route through n distinct nodes has n - 1 edges. The bound is tight: I built a chain whose edges are listed in reverse so each round advances one hop, and a chain of 32 nodes needs all 31 rounds. In practice I would stop when a round changes nothing, which on random graphs used 3,668 rounds where 6,253 were allowed.",
    },
    {
      question: "How do you detect a negative cycle, and what do you report?",
      answer:
        "Run one more round after the n-1. If anything still improves, the improvement cannot come from a simple route -- those are all final by then -- so it comes from a loop that pays, and there is no shortest path. That is the standard yes-or-no test. The part I would not skip is which nodes are affected: over 3,000 random graphs, 913 had an unbounded node but only 489 had every node unbounded, so reporting the whole graph as broken usually throws away valid answers. A node is unbounded exactly when it is downstream of an edge that was still improving, so collect those endpoints and run a reachability search. And a negative cycle the start cannot reach is not a problem at all -- the detection has to be run from the actual source.",
    },
    {
      question: "What is SPFA and would you use it?",
      answer:
        "It is Bellman-Ford with a work queue. A node whose distance did not change cannot improve anything through its edges, so relaxing them again is provably wasted; the queue holds exactly the nodes that did change. Identical answers, and on sparse graphs an enormous saving -- on a ring of 2,000 with edges listed backwards I measured 2,000 relaxations against 4,000,000. But the worst case is unchanged: I built a layered shape where each node's distance improves repeatedly and re-enters the queue, and there SPFA did 325 relaxations against the plain form's 98. So I would use it when negative weights force Bellman-Ford and the graph is ordinary, and I would not reach for it as a general upgrade -- if the weights are non-negative, Dijkstra's settle-once guarantee is worth more than the saving.",
    },
  ],
  takeaways: [
    "Bellman-Ford settles nothing, which is why negative edges do not break it.",
    "`n - 1` rounds because a shortest route visits distinct nodes and so has at most `n - 1` edges.",
    "The bound is tight: a 32-node chain with reversed edge order needs all 31 rounds.",
    "Stop when a round changes nothing \u2014 3,668 rounds against 6,253 allowed on random graphs.",
    "One extra round detects a negative cycle, because every simple route is already final.",
    "Only 489 of 913 graphs with a negative cycle had every node unbounded \u2014 name the affected set.",
    "A node is unbounded exactly when it is downstream of an edge that was still improving.",
    "A negative cycle the start cannot reach is not a problem.",
    "SPFA is the same algorithm with a work queue: identical answers, 2,000 relaxations against 4,000,000 on a ring.",
    "Its worst case is no better: 325 relaxations against 98 on a shape built to re-open nodes.",
  ],
  status: "available",
};
