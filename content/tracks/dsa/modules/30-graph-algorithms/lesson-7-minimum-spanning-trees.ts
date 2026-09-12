import type { Lesson } from "@/content/types";

export const minimumSpanningTreesLesson: Lesson = {
  id: "dsa-graph-algorithms-minimum-spanning-trees",
  slug: "minimum-spanning-trees",
  moduleSlug: "graph-algorithms",
  title: "Minimum Spanning Trees: Prim, Kruskal and the Cut Property",
  summary:
    "Two greedy algorithms that are provably right, and the theorem that makes them so \u2014 stated as two rules and checked against every spanning tree there is. Then why \"the\" minimum spanning tree is usually several of them, what an MST is emphatically not, and the exact question it answers that nobody asked it.",
  estimatedMinutes: 45,
  objectives: [
    "Build a minimum spanning tree both by growing and by sorting",
    "State the cut property and the cycle property, and say which algorithm uses which",
    "Explain why two correct algorithms return different trees",
    "Say what a minimum spanning tree does not give you",
    "Read the bottleneck answer off the tree",
  ],
  sections: [
    {
      id: "two-directions-one-total",
      heading: "Two directions, one total",
      body: [
        "A spanning tree connects every node using `n - 1` edges and no cycle. A minimum spanning tree is the cheapest such set. Two algorithms find one, and they are greedy in opposite directions: **Prim** grows a single tree, repeatedly taking the cheapest edge leaving it; **Kruskal** sorts every edge and takes it whenever its two ends are not already joined.",
        "Both are provably minimum, which is worth checking rather than believing. Scored against an exhaustive enumeration of every spanning tree on 2,626 connected graphs, both hit the minimum every time.",
        "That is the guarantee, and it is worth noticing how little it says: minimum **total**, and nothing else.",
        "Prim and Kruskal also returned the *identical edge set* on all 2,626 \u2014 which is not a coincidence and not a theorem about the algorithms. Both were given the same total order on edges, weight first and then the endpoints, so they break every tie the same way.",
        "Flip only that tie-break and the totals do not move: still minimum on all 2,626. The edge sets move on 1,211 of them. And the two counters that settle the point line up exactly \u2014 flipping the ties returned the same edges on 1,415 graphs, and 1,415 graphs had exactly one minimum tree. Same number because it is the same fact: **the tie-break can only matter where there is more than one right answer.**",
        "Only 386 of the 2,626 graphs had all-distinct weights, and distinct weights force uniqueness. Ties are what let two correct algorithms hand back different trees.",
      ],
      examples: [
        {
          id: "prim-and-kruskal",
          title: "Both algorithms, scored against every spanning tree",
          lang: "python",
          code: `# Two greedy algorithms, one answer, and the condition for "one".
#
# A spanning tree connects every node using n-1 edges and no cycle. A minimum
# spanning tree is the cheapest such set. Two algorithms find one, and they are
# greedy in different directions:
#
#   Prim     -- grow one tree. Repeatedly take the cheapest edge leaving it.
#   Kruskal  -- sort every edge. Take it if its ends are not already joined.
#
# Both are provably minimum, which is the thing worth checking rather than
# believing: the totals below are scored against every spanning tree there is.
INF = 10 ** 9


class Sets:
    """Union-find, as the previous lesson ended up. Kruskal is its main customer."""

    def __init__(self, n):
        self.parent = list(range(n))
        self.size = [1] * n

    def find(self, v):
        root = v
        while self.parent[root] != root:
            root = self.parent[root]
        while self.parent[v] != root:
            nxt = self.parent[v]
            self.parent[v] = root
            v = nxt
        return root

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.size[rb] > self.size[ra]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]
        return True


def kruskal(n, edges, flip=False):
    """Cheapest edge first, skipped when both ends are already joined.

    \`flip\` only changes how equal weights are ordered against each other. It
    cannot change the total -- and it does change which edges come back.
    """
    sign = -1 if flip else 1
    order = sorted(range(len(edges)),
                   key=lambda i: (edges[i][2], sign * edges[i][0], sign * edges[i][1]))
    sets = Sets(n)
    chosen = []
    for i in order:
        u, v, _ = edges[i]
        if sets.union(u, v):
            chosen.append(i)
    return sorted(chosen) if len(chosen) == n - 1 else None


def prim(n, edges):
    """One tree, grown by the cheapest edge leaving it. No priority queue here:
    at this size a linear scan for the cheapest crossing edge is clearer, and
    the choice of container is the next example's subject."""
    inside = [False] * n
    inside[0] = True
    chosen = []
    for _ in range(n - 1):
        best = -1
        for i, (u, v, w) in enumerate(edges):
            if inside[u] == inside[v]:
                continue
            if best < 0:
                best = i
                continue
            bw, bu, bv = edges[best][2], edges[best][0], edges[best][1]
            if (w, u, v) < (bw, bu, bv):
                best = i
        if best < 0:
            return None
        u, v, _ = edges[best]
        inside[u] = True
        inside[v] = True
        chosen.append(best)
    return sorted(chosen)


def weight_of(edges, chosen):
    return sum(edges[i][2] for i in chosen) if chosen is not None else INF


def spans(n, edges, chosen):
    """Does this edge set connect everything with no edge to spare?"""
    if chosen is None or len(chosen) != n - 1:
        return False
    sets = Sets(n)
    for i in chosen:
        u, v, _ = edges[i]
        if not sets.union(u, v):
            return False
    return True


def survey(n, edges):
    """Every subset of n-1 edges, checked. The count and the minimum are facts."""
    m = len(edges)
    best = INF
    trees = 0
    minimum = 0
    pick = []

    def choose(start):
        nonlocal best, trees, minimum
        if len(pick) == n - 1:
            if spans(n, edges, pick):
                trees += 1
                w = weight_of(edges, pick)
                if w < best:
                    best = w
                    minimum = 1
                elif w == best:
                    minimum += 1
            return
        for i in range(start, m):
            pick.append(i)
            choose(i + 1)
            pick.pop()

    choose(0)
    return best, trees, minimum


def show(edges, chosen):
    if chosen is None:
        return "none"
    return " ".join("%d-%d" % (edges[i][0], edges[i][1]) for i in chosen)


def label(edges):
    return "[" + ", ".join("%d-%d:%d" % e for e in edges) + "]"


CASES = [
    (4, [(0, 1, 1), (1, 2, 2), (2, 3, 3), (0, 3, 4)]),
    (4, [(0, 1, 1), (1, 2, 1), (2, 3, 1), (0, 3, 1)]),
    (5, [(0, 1, 4), (0, 2, 1), (1, 2, 2), (1, 3, 5), (2, 3, 8), (3, 4, 3)]),
]

print("%-46s %-14s %-14s %s" % ("edges", "Kruskal", "ties flipped", "cost / minimum trees"))
for n, edges in CASES:
    a, c = kruskal(n, edges), kruskal(n, edges, True)
    best, _, minimum = survey(n, edges)
    print("%-46s %-14s %-14s %d / %d" % (
        label(edges), show(edges, a), show(edges, c), weight_of(edges, a), minimum))

# The same linear congruential generator in every language, so the random
# graphs below are the same graphs whichever translation is run.
seed = 271828


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


trials = 3000
connected = 0
kruskal_min = prim_min = flip_min = 0
agreed = flip_agreed = 0
unique_tree = distinct_weights = 0
for _ in range(trials):
    n = 3 + rand(4)
    edges = []
    for u in range(n):
        for v in range(u + 1, n):
            if rand(3) > 0:
                edges.append((u, v, 1 + rand(4)))
    best, trees, minimum = survey(n, edges)
    if trees == 0:
        continue
    connected += 1
    a, b, c = kruskal(n, edges), prim(n, edges), kruskal(n, edges, True)
    kruskal_min += weight_of(edges, a) == best
    prim_min += weight_of(edges, b) == best
    flip_min += weight_of(edges, c) == best
    agreed += a == b
    flip_agreed += a == c
    if minimum == 1:
        unique_tree += 1
    weights = [w for _, _, w in edges]
    if len(weights) == len(set(weights)):
        distinct_weights += 1

print()
print("over the %d connected graphs among %d random ones on 3 to 6 nodes:" % (connected, trials))
print("  %-42s %6d" % ("Kruskal's total was the minimum", kruskal_min))
print("  %-42s %6d" % ("Prim's total was the minimum", prim_min))
print("  %-42s %6d" % ("the same total with the ties flipped", flip_min))
print("  %-42s %6d" % ("Prim and Kruskal picked the same edges", agreed))
print("  %-42s %6d" % ("flipping the ties picked the same edges", flip_agreed))
print("  %-42s %6d" % ("graphs with exactly one minimum tree", unique_tree))
print("  %-42s %6d" % ("graphs whose weights were all distinct", distinct_weights))

print()
print("Both algorithms hit the minimum on every connected graph, scored against")
print("every spanning tree there is. That is the guarantee, and it is worth")
print("noticing how little it says: minimum *total*, and nothing else.")
print()
print("Prim and Kruskal returned the identical edge set on %d of %d, which" % (agreed, connected))
print("is not a coincidence: both were given the same total order on edges --")
print("weight first, then the endpoints -- so they break every tie the same way.")
print()
print("Flip that tie-break and the totals do not move: still minimum on all")
print("%d. The edge sets do move, on %d of them. That is the whole point." % (flip_min, connected - flip_agreed))
print("And the two counters that matter line up exactly: flipping the ties")
print("returned the same edges on %d graphs, and %d graphs had exactly one" % (flip_agreed, unique_tree))
print("minimum tree. Those are the same number because they are the same fact --")
print("the tie-break can only matter where there is more than one right answer.")
print()
print("Only %d of the %d graphs had all-distinct weights, and distinct weights" % (distinct_weights, connected))
print("force uniqueness. Ties are what let two correct algorithms hand back")
print("different trees; the demo's second row is the smallest case, a square of")
print("four equal edges with four minimum trees and no reason to prefer any.")
`,
          output: `edges                                          Kruskal        ties flipped   cost / minimum trees
[0-1:1, 1-2:2, 2-3:3, 0-3:4]                   0-1 1-2 2-3    0-1 1-2 2-3    6 / 1
[0-1:1, 1-2:1, 2-3:1, 0-3:1]                   0-1 1-2 0-3    1-2 2-3 0-3    3 / 4
[0-1:4, 0-2:1, 1-2:2, 1-3:5, 2-3:8, 3-4:3]     0-2 1-2 1-3 3-4 0-2 1-2 1-3 3-4 11 / 1

over the 2626 connected graphs among 3000 random ones on 3 to 6 nodes:
  Kruskal's total was the minimum              2626
  Prim's total was the minimum                 2626
  the same total with the ties flipped         2626
  Prim and Kruskal picked the same edges       2626
  flipping the ties picked the same edges      1415
  graphs with exactly one minimum tree         1415
  graphs whose weights were all distinct        386

Both algorithms hit the minimum on every connected graph, scored against
every spanning tree there is. That is the guarantee, and it is worth
noticing how little it says: minimum *total*, and nothing else.

Prim and Kruskal returned the identical edge set on 2626 of 2626, which
is not a coincidence: both were given the same total order on edges --
weight first, then the endpoints -- so they break every tie the same way.

Flip that tie-break and the totals do not move: still minimum on all
2626. The edge sets do move, on 1211 of them. That is the whole point.
And the two counters that matter line up exactly: flipping the ties
returned the same edges on 1415 graphs, and 1415 graphs had exactly one
minimum tree. Those are the same number because they are the same fact --
the tie-break can only matter where there is more than one right answer.

Only 386 of the 2626 graphs had all-distinct weights, and distinct weights
force uniqueness. Ties are what let two correct algorithms hand back
different trees; the demo's second row is the smallest case, a square of
four equal edges with four minimum trees and no reason to prefer any.`,
          explanation:
            "Prim and Kruskal against an exhaustive enumeration, plus the same Kruskal with only its tie-break reversed. Watch the last two counters in the block: they are the same number, and that is the point.",
          alternates: [
            {
              lang: "javascript",
              code: `// Two greedy algorithms, one answer, and the condition for "one".
//
// A spanning tree connects every node using n-1 edges and no cycle. A minimum
// spanning tree is the cheapest such set. Two algorithms find one, and they are
// greedy in different directions:
//
//   Prim     -- grow one tree. Repeatedly take the cheapest edge leaving it.
//   Kruskal  -- sort every edge. Take it if its ends are not already joined.
//
// Both are provably minimum, which is the thing worth checking rather than
// believing: the totals below are scored against every spanning tree there is.
const INF = 10 ** 9;

// Union-find, as the previous lesson ended up. Kruskal is its main customer.
class Sets {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.size = new Array(n).fill(1);
  }

  find(v) {
    let root = v;
    while (this.parent[root] !== root) root = this.parent[root];
    let at = v;
    while (this.parent[at] !== root) {
      const nxt = this.parent[at];
      this.parent[at] = root;
      at = nxt;
    }
    return root;
  }

  union(a, b) {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return false;
    if (this.size[rb] > this.size[ra]) {
      const tmp = ra;
      ra = rb;
      rb = tmp;
    }
    this.parent[rb] = ra;
    this.size[ra] += this.size[rb];
    return true;
  }
}

// Cheapest edge first, skipped when both ends are already joined.
//
// \`flip\` only changes how equal weights are ordered against each other. It
// cannot change the total -- and it does change which edges come back.
function kruskal(n, edges, flip) {
  const sign = flip ? -1 : 1;
  const order = Array.from({ length: edges.length }, (_, i) => i);
  order.sort((i, j) => {
    if (edges[i][2] !== edges[j][2]) return edges[i][2] - edges[j][2];
    if (edges[i][0] !== edges[j][0]) return sign * edges[i][0] - sign * edges[j][0];
    return sign * edges[i][1] - sign * edges[j][1];
  });
  const sets = new Sets(n);
  const chosen = [];
  for (const i of order) {
    if (sets.union(edges[i][0], edges[i][1])) chosen.push(i);
  }
  return chosen.length === n - 1 ? chosen.sort((a, b) => a - b) : null;
}

// One tree, grown by the cheapest edge leaving it. No priority queue here:
// at this size a linear scan for the cheapest crossing edge is clearer, and
// the choice of container is the next example's subject.
function prim(n, edges) {
  const inside = new Array(n).fill(false);
  inside[0] = true;
  const chosen = [];
  for (let step = 0; step < n - 1; step += 1) {
    let best = -1;
    edges.forEach(([u, v, w], i) => {
      if (inside[u] === inside[v]) return;
      if (best < 0) {
        best = i;
        return;
      }
      const [bu, bv, bw] = edges[best];
      if (w < bw || (w === bw && (u < bu || (u === bu && v < bv)))) best = i;
    });
    if (best < 0) return null;
    inside[edges[best][0]] = true;
    inside[edges[best][1]] = true;
    chosen.push(best);
  }
  return chosen.sort((a, b) => a - b);
}

function weightOf(edges, chosen) {
  if (chosen === null) return INF;
  return chosen.reduce((sum, i) => sum + edges[i][2], 0);
}

// Does this edge set connect everything with no edge to spare?
function spans(n, edges, chosen) {
  if (chosen === null || chosen.length !== n - 1) return false;
  const sets = new Sets(n);
  for (const i of chosen) {
    if (!sets.union(edges[i][0], edges[i][1])) return false;
  }
  return true;
}

// Every subset of n-1 edges, checked. The count and the minimum are facts.
function survey(n, edges) {
  const m = edges.length;
  let best = INF;
  let trees = 0;
  let minimum = 0;
  const pick = [];

  const choose = (start) => {
    if (pick.length === n - 1) {
      if (spans(n, edges, pick)) {
        trees += 1;
        const w = weightOf(edges, pick);
        if (w < best) {
          best = w;
          minimum = 1;
        } else if (w === best) {
          minimum += 1;
        }
      }
      return;
    }
    for (let i = start; i < m; i += 1) {
      pick.push(i);
      choose(i + 1);
      pick.pop();
    }
  };

  choose(0);
  return [best, trees, minimum];
}

function show(edges, chosen) {
  if (chosen === null) return "none";
  return chosen.map((i) => \`\${edges[i][0]}-\${edges[i][1]}\`).join(" ");
}

function label(edges) {
  return "[" + edges.map(([u, v, w]) => \`\${u}-\${v}:\${w}\`).join(", ") + "]";
}

const CASES = [
  [4, [[0, 1, 1], [1, 2, 2], [2, 3, 3], [0, 3, 4]]],
  [4, [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 3, 1]]],
  [5, [[0, 1, 4], [0, 2, 1], [1, 2, 2], [1, 3, 5], [2, 3, 8], [3, 4, 3]]],
];

console.log(
  "edges".padEnd(46) + " " + "Kruskal".padEnd(14) + " " + "ties flipped".padEnd(14) + " " +
  "cost / minimum trees",
);
for (const [n, edges] of CASES) {
  const a = kruskal(n, edges, false);
  const c = kruskal(n, edges, true);
  const [, , minimum] = survey(n, edges);
  console.log(
    label(edges).padEnd(46) + " " + show(edges, a).padEnd(14) + " " +
    show(edges, c).padEnd(14) + " " + \`\${weightOf(edges, a)} / \${minimum}\`,
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 271828n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let connected = 0;
let kruskalMin = 0;
let primMin = 0;
let flipMin = 0;
let agreed = 0;
let flipAgreed = 0;
let uniqueTree = 0;
let distinctWeights = 0;
const same = (a, b) =>
  a !== null && b !== null && a.length === b.length && a.every((x, i) => x === b[i]);
for (let t = 0; t < trials; t += 1) {
  const n = 3 + rand(4);
  const edges = [];
  for (let u = 0; u < n; u += 1)
    for (let v = u + 1; v < n; v += 1)
      if (rand(3) > 0) edges.push([u, v, 1 + rand(4)]);
  const [best, trees, minimum] = survey(n, edges);
  if (trees === 0) continue;
  connected += 1;
  const a = kruskal(n, edges, false);
  const b = prim(n, edges);
  const c = kruskal(n, edges, true);
  if (weightOf(edges, a) === best) kruskalMin += 1;
  if (weightOf(edges, b) === best) primMin += 1;
  if (weightOf(edges, c) === best) flipMin += 1;
  if (same(a, b)) agreed += 1;
  if (same(a, c)) flipAgreed += 1;
  if (minimum === 1) uniqueTree += 1;
  const weights = edges.map(([, , w]) => w);
  if (new Set(weights).size === weights.length) distinctWeights += 1;
}

const row = (text, value) => "  " + text.padEnd(42) + " " + String(value).padStart(6);

console.log();
console.log(\`over the \${connected} connected graphs among \${trials} random ones on 3 to 6 nodes:\`);
console.log(row("Kruskal's total was the minimum", kruskalMin));
console.log(row("Prim's total was the minimum", primMin));
console.log(row("the same total with the ties flipped", flipMin));
console.log(row("Prim and Kruskal picked the same edges", agreed));
console.log(row("flipping the ties picked the same edges", flipAgreed));
console.log(row("graphs with exactly one minimum tree", uniqueTree));
console.log(row("graphs whose weights were all distinct", distinctWeights));

console.log();
console.log("Both algorithms hit the minimum on every connected graph, scored against");
console.log("every spanning tree there is. That is the guarantee, and it is worth");
console.log("noticing how little it says: minimum *total*, and nothing else.");
console.log();
console.log(\`Prim and Kruskal returned the identical edge set on \${agreed} of \${connected}, which\`);
console.log("is not a coincidence: both were given the same total order on edges --");
console.log("weight first, then the endpoints -- so they break every tie the same way.");
console.log();
console.log("Flip that tie-break and the totals do not move: still minimum on all");
console.log(\`\${flipMin}. The edge sets do move, on \${connected - flipAgreed} of them. That is the whole point.\`);
console.log("And the two counters that matter line up exactly: flipping the ties");
console.log(\`returned the same edges on \${flipAgreed} graphs, and \${uniqueTree} graphs had exactly one\`);
console.log("minimum tree. Those are the same number because they are the same fact --");
console.log("the tie-break can only matter where there is more than one right answer.");
console.log();
console.log(\`Only \${distinctWeights} of the \${connected} graphs had all-distinct weights, and distinct weights\`);
console.log("force uniqueness. Ties are what let two correct algorithms hand back");
console.log("different trees; the demo's second row is the smallest case, a square of");
console.log("four equal edges with four minimum trees and no reason to prefer any.");
`,
            },
            {
              lang: "typescript",
              code: `// Two greedy algorithms, one answer, and the condition for "one".
//
// A spanning tree connects every node using n-1 edges and no cycle. A minimum
// spanning tree is the cheapest such set. Two algorithms find one, and they are
// greedy in different directions:
//
//   Prim     -- grow one tree. Repeatedly take the cheapest edge leaving it.
//   Kruskal  -- sort every edge. Take it if its ends are not already joined.
//
// Both are provably minimum, which is the thing worth checking rather than
// believing: the totals below are scored against every spanning tree there is.
const INF = 10 ** 9;

// Union-find, as the previous lesson ended up. Kruskal is its main customer.
class Sets {
  parent: number[];
  size: number[];

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.size = new Array(n).fill(1);
  }

  find(v: number): number {
    let root = v;
    while (this.parent[root] !== root) root = this.parent[root];
    let at = v;
    while (this.parent[at] !== root) {
      const nxt = this.parent[at];
      this.parent[at] = root;
      at = nxt;
    }
    return root;
  }

  union(a: number, b: number): boolean {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return false;
    if (this.size[rb] > this.size[ra]) {
      const tmp = ra;
      ra = rb;
      rb = tmp;
    }
    this.parent[rb] = ra;
    this.size[ra] += this.size[rb];
    return true;
  }
}

// Cheapest edge first, skipped when both ends are already joined.
//
// \`flip\` only changes how equal weights are ordered against each other. It
// cannot change the total -- and it does change which edges come back.
function kruskal(n: number, edges: number[][], flip: boolean): number[] | null {
  const sign = flip ? -1 : 1;
  const order = Array.from({ length: edges.length }, (_, i) => i);
  order.sort((i, j) => {
    if (edges[i][2] !== edges[j][2]) return edges[i][2] - edges[j][2];
    if (edges[i][0] !== edges[j][0]) return sign * edges[i][0] - sign * edges[j][0];
    return sign * edges[i][1] - sign * edges[j][1];
  });
  const sets = new Sets(n);
  const chosen: number[] = [];
  for (const i of order) {
    if (sets.union(edges[i][0], edges[i][1])) chosen.push(i);
  }
  return chosen.length === n - 1 ? chosen.sort((a, b) => a - b) : null;
}

// One tree, grown by the cheapest edge leaving it. No priority queue here:
// at this size a linear scan for the cheapest crossing edge is clearer, and
// the choice of container is the next example's subject.
function prim(n: number, edges: number[][]): number[] | null {
  const inside = new Array(n).fill(false);
  inside[0] = true;
  const chosen: number[] = [];
  for (let step = 0; step < n - 1; step += 1) {
    let best = -1;
    edges.forEach(([u, v, w], i) => {
      if (inside[u] === inside[v]) return;
      if (best < 0) {
        best = i;
        return;
      }
      const [bu, bv, bw] = edges[best];
      if (w < bw || (w === bw && (u < bu || (u === bu && v < bv)))) best = i;
    });
    if (best < 0) return null;
    inside[edges[best][0]] = true;
    inside[edges[best][1]] = true;
    chosen.push(best);
  }
  return chosen.sort((a, b) => a - b);
}

function weightOf(edges: number[][], chosen: number[] | null): number {
  if (chosen === null) return INF;
  return chosen.reduce((sum, i) => sum + edges[i][2], 0);
}

// Does this edge set connect everything with no edge to spare?
function spans(n: number, edges: number[][], chosen: number[] | null): boolean {
  if (chosen === null || chosen.length !== n - 1) return false;
  const sets = new Sets(n);
  for (const i of chosen) {
    if (!sets.union(edges[i][0], edges[i][1])) return false;
  }
  return true;
}

// Every subset of n-1 edges, checked. The count and the minimum are facts.
function survey(n: number, edges: number[][]): [number, number, number] {
  const m = edges.length;
  let best = INF;
  let trees = 0;
  let minimum = 0;
  const pick: number[] = [];

  const choose = (start: number): void => {
    if (pick.length === n - 1) {
      if (spans(n, edges, pick)) {
        trees += 1;
        const w = weightOf(edges, pick);
        if (w < best) {
          best = w;
          minimum = 1;
        } else if (w === best) {
          minimum += 1;
        }
      }
      return;
    }
    for (let i = start; i < m; i += 1) {
      pick.push(i);
      choose(i + 1);
      pick.pop();
    }
  };

  choose(0);
  return [best, trees, minimum];
}

function show(edges: number[][], chosen: number[] | null): string {
  if (chosen === null) return "none";
  return chosen.map((i) => \`\${edges[i][0]}-\${edges[i][1]}\`).join(" ");
}

function label(edges: number[][]): string {
  return "[" + edges.map(([u, v, w]) => \`\${u}-\${v}:\${w}\`).join(", ") + "]";
}

const CASES: [number, number[][]][] = [
  [4, [[0, 1, 1], [1, 2, 2], [2, 3, 3], [0, 3, 4]]],
  [4, [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 3, 1]]],
  [5, [[0, 1, 4], [0, 2, 1], [1, 2, 2], [1, 3, 5], [2, 3, 8], [3, 4, 3]]],
];

console.log(
  "edges".padEnd(46) + " " + "Kruskal".padEnd(14) + " " + "ties flipped".padEnd(14) + " " +
  "cost / minimum trees",
);
for (const [n, edges] of CASES) {
  const a = kruskal(n, edges, false);
  const c = kruskal(n, edges, true);
  const [, , minimum] = survey(n, edges);
  console.log(
    label(edges).padEnd(46) + " " + show(edges, a).padEnd(14) + " " +
    show(edges, c).padEnd(14) + " " + \`\${weightOf(edges, a)} / \${minimum}\`,
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 271828n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let connected = 0;
let kruskalMin = 0;
let primMin = 0;
let flipMin = 0;
let agreed = 0;
let flipAgreed = 0;
let uniqueTree = 0;
let distinctWeights = 0;
const same = (a: number[] | null, b: number[] | null): boolean =>
  a !== null && b !== null && a.length === b.length && a.every((x, i) => x === b[i]);
for (let t = 0; t < trials; t += 1) {
  const n = 3 + rand(4);
  const edges: number[][] = [];
  for (let u = 0; u < n; u += 1)
    for (let v = u + 1; v < n; v += 1)
      if (rand(3) > 0) edges.push([u, v, 1 + rand(4)]);
  const [best, trees, minimum] = survey(n, edges);
  if (trees === 0) continue;
  connected += 1;
  const a = kruskal(n, edges, false);
  const b = prim(n, edges);
  const c = kruskal(n, edges, true);
  if (weightOf(edges, a) === best) kruskalMin += 1;
  if (weightOf(edges, b) === best) primMin += 1;
  if (weightOf(edges, c) === best) flipMin += 1;
  if (same(a, b)) agreed += 1;
  if (same(a, c)) flipAgreed += 1;
  if (minimum === 1) uniqueTree += 1;
  const weights = edges.map(([, , w]) => w);
  if (new Set(weights).size === weights.length) distinctWeights += 1;
}

const row = (text: string, value: number): string => "  " + text.padEnd(42) + " " + String(value).padStart(6);

console.log();
console.log(\`over the \${connected} connected graphs among \${trials} random ones on 3 to 6 nodes:\`);
console.log(row("Kruskal's total was the minimum", kruskalMin));
console.log(row("Prim's total was the minimum", primMin));
console.log(row("the same total with the ties flipped", flipMin));
console.log(row("Prim and Kruskal picked the same edges", agreed));
console.log(row("flipping the ties picked the same edges", flipAgreed));
console.log(row("graphs with exactly one minimum tree", uniqueTree));
console.log(row("graphs whose weights were all distinct", distinctWeights));

console.log();
console.log("Both algorithms hit the minimum on every connected graph, scored against");
console.log("every spanning tree there is. That is the guarantee, and it is worth");
console.log("noticing how little it says: minimum *total*, and nothing else.");
console.log();
console.log(\`Prim and Kruskal returned the identical edge set on \${agreed} of \${connected}, which\`);
console.log("is not a coincidence: both were given the same total order on edges --");
console.log("weight first, then the endpoints -- so they break every tie the same way.");
console.log();
console.log("Flip that tie-break and the totals do not move: still minimum on all");
console.log(\`\${flipMin}. The edge sets do move, on \${connected - flipAgreed} of them. That is the whole point.\`);
console.log("And the two counters that matter line up exactly: flipping the ties");
console.log(\`returned the same edges on \${flipAgreed} graphs, and \${uniqueTree} graphs had exactly one\`);
console.log("minimum tree. Those are the same number because they are the same fact --");
console.log("the tie-break can only matter where there is more than one right answer.");
console.log();
console.log(\`Only \${distinctWeights} of the \${connected} graphs had all-distinct weights, and distinct weights\`);
console.log("force uniqueness. Ties are what let two correct algorithms hand back");
console.log("different trees; the demo's second row is the smallest case, a square of");
console.log("four equal edges with four minimum trees and no reason to prefer any.");
`,
            },
            {
              lang: "java",
              code: `// Two greedy algorithms, one answer, and the condition for "one".
//
// A spanning tree connects every node using n-1 edges and no cycle. A minimum
// spanning tree is the cheapest such set. Two algorithms find one, and they are
// greedy in different directions:
//
//   Prim     -- grow one tree. Repeatedly take the cheapest edge leaving it.
//   Kruskal  -- sort every edge. Take it if its ends are not already joined.
//
// Both are provably minimum, which is the thing worth checking rather than
// believing: the totals below are scored against every spanning tree there is.
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class Main {
    static final int INF = 1000000000;

    /** Union-find, as the previous lesson ended up. Kruskal is its main customer. */
    static class Sets {
        int[] parent;
        int[] size;

        Sets(int n) {
            parent = new int[n];
            size = new int[n];
            for (int i = 0; i < n; i++) {
                parent[i] = i;
                size[i] = 1;
            }
        }

        int find(int v) {
            int root = v;
            while (parent[root] != root) root = parent[root];
            int at = v;
            while (parent[at] != root) {
                int nxt = parent[at];
                parent[at] = root;
                at = nxt;
            }
            return root;
        }

        boolean union(int a, int b) {
            int ra = find(a), rb = find(b);
            if (ra == rb) return false;
            if (size[rb] > size[ra]) {
                int tmp = ra;
                ra = rb;
                rb = tmp;
            }
            parent[rb] = ra;
            size[ra] += size[rb];
            return true;
        }
    }

    /**
     * Cheapest edge first, skipped when both ends are already joined.
     *
     * <p>{@code flip} only changes how equal weights are ordered against each
     * other. It cannot change the total -- and it does change which edges come
     * back.
     */
    static List<Integer> kruskal(int n, int[][] edges, boolean flip) {
        int sign = flip ? -1 : 1;
        List<Integer> order = new ArrayList<>();
        for (int i = 0; i < edges.length; i++) order.add(i);
        order.sort((i, j) -> {
            if (edges[i][2] != edges[j][2]) return Integer.compare(edges[i][2], edges[j][2]);
            if (edges[i][0] != edges[j][0])
                return Integer.compare(sign * edges[i][0], sign * edges[j][0]);
            return Integer.compare(sign * edges[i][1], sign * edges[j][1]);
        });
        Sets sets = new Sets(n);
        List<Integer> chosen = new ArrayList<>();
        for (int i : order) if (sets.union(edges[i][0], edges[i][1])) chosen.add(i);
        if (chosen.size() != n - 1) return null;
        Collections.sort(chosen);
        return chosen;
    }

    /**
     * One tree, grown by the cheapest edge leaving it. No priority queue here:
     * at this size a linear scan for the cheapest crossing edge is clearer, and
     * the choice of container is the next example's subject.
     */
    static List<Integer> prim(int n, int[][] edges) {
        boolean[] inside = new boolean[n];
        inside[0] = true;
        List<Integer> chosen = new ArrayList<>();
        for (int step = 0; step < n - 1; step++) {
            int best = -1;
            for (int i = 0; i < edges.length; i++) {
                int u = edges[i][0], v = edges[i][1], w = edges[i][2];
                if (inside[u] == inside[v]) continue;
                if (best < 0) {
                    best = i;
                    continue;
                }
                int bu = edges[best][0], bv = edges[best][1], bw = edges[best][2];
                if (w < bw || (w == bw && (u < bu || (u == bu && v < bv)))) best = i;
            }
            if (best < 0) return null;
            inside[edges[best][0]] = true;
            inside[edges[best][1]] = true;
            chosen.add(best);
        }
        Collections.sort(chosen);
        return chosen;
    }

    static int weightOf(int[][] edges, List<Integer> chosen) {
        if (chosen == null) return INF;
        int total = 0;
        for (int i : chosen) total += edges[i][2];
        return total;
    }

    /** Does this edge set connect everything with no edge to spare? */
    static boolean spans(int n, int[][] edges, List<Integer> chosen) {
        if (chosen == null || chosen.size() != n - 1) return false;
        Sets sets = new Sets(n);
        for (int i : chosen) if (!sets.union(edges[i][0], edges[i][1])) return false;
        return true;
    }

    static int best;
    static int trees;
    static int minimum;

    static void choose(int n, int[][] edges, List<Integer> pick, int start) {
        if (pick.size() == n - 1) {
            if (spans(n, edges, pick)) {
                trees++;
                int w = weightOf(edges, pick);
                if (w < best) {
                    best = w;
                    minimum = 1;
                } else if (w == best) {
                    minimum++;
                }
            }
            return;
        }
        for (int i = start; i < edges.length; i++) {
            pick.add(i);
            choose(n, edges, pick, i + 1);
            pick.remove(pick.size() - 1);
        }
    }

    /** Every subset of n-1 edges, checked. The count and the minimum are facts. */
    static int[] survey(int n, int[][] edges) {
        best = INF;
        trees = 0;
        minimum = 0;
        choose(n, edges, new ArrayList<>(), 0);
        return new int[] {best, trees, minimum};
    }

    static String show(int[][] edges, List<Integer> chosen) {
        if (chosen == null) return "none";
        StringBuilder sb = new StringBuilder();
        for (int k = 0; k < chosen.size(); k++) {
            if (k > 0) sb.append(" ");
            sb.append(edges[chosen.get(k)][0]).append("-").append(edges[chosen.get(k)][1]);
        }
        return sb.toString();
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
    static long seed = 271828L;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    static String row(String text, int value) {
        return String.format("  %-42s %6d", text, value);
    }

    public static void main(String[] args) {
        int[] caseN = {4, 4, 5};
        int[][][] caseEdges = {
            {{0, 1, 1}, {1, 2, 2}, {2, 3, 3}, {0, 3, 4}},
            {{0, 1, 1}, {1, 2, 1}, {2, 3, 1}, {0, 3, 1}},
            {{0, 1, 4}, {0, 2, 1}, {1, 2, 2}, {1, 3, 5}, {2, 3, 8}, {3, 4, 3}},
        };

        System.out.printf("%-46s %-14s %-14s %s%n",
            "edges", "Kruskal", "ties flipped", "cost / minimum trees");
        for (int c = 0; c < caseN.length; c++) {
            List<Integer> a = kruskal(caseN[c], caseEdges[c], false);
            List<Integer> f = kruskal(caseN[c], caseEdges[c], true);
            int[] surveyed = survey(caseN[c], caseEdges[c]);
            System.out.printf("%-46s %-14s %-14s %d / %d%n", label(caseEdges[c]),
                show(caseEdges[c], a), show(caseEdges[c], f),
                weightOf(caseEdges[c], a), surveyed[2]);
        }

        int trialCount = 3000;
        int connected = 0, kruskalMin = 0, primMin = 0, flipMin = 0;
        int agreed = 0, flipAgreed = 0, uniqueTree = 0, distinctWeights = 0;
        for (int t = 0; t < trialCount; t++) {
            int n = 3 + rand(4);
            List<int[]> built = new ArrayList<>();
            for (int u = 0; u < n; u++)
                for (int v = u + 1; v < n; v++)
                    if (rand(3) > 0) built.add(new int[] {u, v, 1 + rand(4)});
            int[][] edges = built.toArray(new int[0][]);
            int[] surveyed = survey(n, edges);
            if (surveyed[1] == 0) continue;
            connected++;
            List<Integer> a = kruskal(n, edges, false);
            List<Integer> b = prim(n, edges);
            List<Integer> c = kruskal(n, edges, true);
            if (weightOf(edges, a) == surveyed[0]) kruskalMin++;
            if (weightOf(edges, b) == surveyed[0]) primMin++;
            if (weightOf(edges, c) == surveyed[0]) flipMin++;
            if (a != null && a.equals(b)) agreed++;
            if (a != null && a.equals(c)) flipAgreed++;
            if (surveyed[2] == 1) uniqueTree++;
            Set<Integer> weights = new HashSet<>();
            for (int[] e : edges) weights.add(e[2]);
            if (weights.size() == edges.length) distinctWeights++;
        }

        System.out.println();
        System.out.println("over the " + connected + " connected graphs among " + trialCount
            + " random ones on 3 to 6 nodes:");
        System.out.println(row("Kruskal's total was the minimum", kruskalMin));
        System.out.println(row("Prim's total was the minimum", primMin));
        System.out.println(row("the same total with the ties flipped", flipMin));
        System.out.println(row("Prim and Kruskal picked the same edges", agreed));
        System.out.println(row("flipping the ties picked the same edges", flipAgreed));
        System.out.println(row("graphs with exactly one minimum tree", uniqueTree));
        System.out.println(row("graphs whose weights were all distinct", distinctWeights));

        System.out.println();
        System.out.println("Both algorithms hit the minimum on every connected graph, scored against");
        System.out.println("every spanning tree there is. That is the guarantee, and it is worth");
        System.out.println("noticing how little it says: minimum *total*, and nothing else.");
        System.out.println();
        System.out.println("Prim and Kruskal returned the identical edge set on " + agreed + " of "
            + connected + ", which");
        System.out.println("is not a coincidence: both were given the same total order on edges --");
        System.out.println("weight first, then the endpoints -- so they break every tie the same way.");
        System.out.println();
        System.out.println("Flip that tie-break and the totals do not move: still minimum on all");
        System.out.println(flipMin + ". The edge sets do move, on " + (connected - flipAgreed)
            + " of them. That is the whole point.");
        System.out.println("And the two counters that matter line up exactly: flipping the ties");
        System.out.println("returned the same edges on " + flipAgreed + " graphs, and " + uniqueTree
            + " graphs had exactly one");
        System.out.println("minimum tree. Those are the same number because they are the same fact --");
        System.out.println("the tie-break can only matter where there is more than one right answer.");
        System.out.println();
        System.out.println("Only " + distinctWeights + " of the " + connected
            + " graphs had all-distinct weights, and distinct weights");
        System.out.println("force uniqueness. Ties are what let two correct algorithms hand back");
        System.out.println("different trees; the demo's second row is the smallest case, a square of");
        System.out.println("four equal edges with four minimum trees and no reason to prefer any.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Two greedy algorithms, one answer, and the condition for "one".
//
// A spanning tree connects every node using n-1 edges and no cycle. A minimum
// spanning tree is the cheapest such set. Two algorithms find one, and they are
// greedy in different directions:
//
//   Prim     -- grow one tree. Repeatedly take the cheapest edge leaving it.
//   Kruskal  -- sort every edge. Take it if its ends are not already joined.
//
// Both are provably minimum, which is the thing worth checking rather than
// believing: the totals below are scored against every spanning tree there is.
#include <algorithm>
#include <array>
#include <iomanip>
#include <iostream>
#include <set>
#include <string>
#include <vector>

const int INF = 1000000000;

using Edge = std::array<int, 3>;
using Chosen = std::vector<int>;

// Union-find, as the previous lesson ended up. Kruskal is its main customer.
struct Sets {
    std::vector<int> parent;
    std::vector<int> size;

    explicit Sets(int n) {
        parent.resize(n);
        size.assign(n, 1);
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    int find(int v) {
        int root = v;
        while (parent[root] != root) root = parent[root];
        int at = v;
        while (parent[at] != root) {
            int nxt = parent[at];
            parent[at] = root;
            at = nxt;
        }
        return root;
    }

    bool unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (size[rb] > size[ra]) std::swap(ra, rb);
        parent[rb] = ra;
        size[ra] += size[rb];
        return true;
    }
};

// Cheapest edge first, skipped when both ends are already joined.
//
// \`flip\` only changes how equal weights are ordered against each other. It
// cannot change the total -- and it does change which edges come back.
Chosen kruskal(int n, const std::vector<Edge>& edges, bool flip) {
    int sign = flip ? -1 : 1;
    Chosen order(edges.size());
    for (size_t i = 0; i < order.size(); i++) order[i] = static_cast<int>(i);
    std::sort(order.begin(), order.end(), [&](int i, int j) {
        if (edges[i][2] != edges[j][2]) return edges[i][2] < edges[j][2];
        if (edges[i][0] != edges[j][0]) return sign * edges[i][0] < sign * edges[j][0];
        return sign * edges[i][1] < sign * edges[j][1];
    });
    Sets sets(n);
    Chosen chosen;
    for (int i : order)
        if (sets.unite(edges[i][0], edges[i][1])) chosen.push_back(i);
    if (static_cast<int>(chosen.size()) != n - 1) return Chosen();
    std::sort(chosen.begin(), chosen.end());
    return chosen;
}

// One tree, grown by the cheapest edge leaving it. No priority queue here:
// at this size a linear scan for the cheapest crossing edge is clearer, and
// the choice of container is the next example's subject.
Chosen prim(int n, const std::vector<Edge>& edges) {
    std::vector<bool> inside(n, false);
    inside[0] = true;
    Chosen chosen;
    for (int step = 0; step < n - 1; step++) {
        int best = -1;
        for (size_t i = 0; i < edges.size(); i++) {
            int u = edges[i][0], v = edges[i][1], w = edges[i][2];
            if (inside[u] == inside[v]) continue;
            if (best < 0) {
                best = static_cast<int>(i);
                continue;
            }
            int bu = edges[best][0], bv = edges[best][1], bw = edges[best][2];
            if (w < bw || (w == bw && (u < bu || (u == bu && v < bv))))
                best = static_cast<int>(i);
        }
        if (best < 0) return Chosen();
        inside[edges[best][0]] = true;
        inside[edges[best][1]] = true;
        chosen.push_back(best);
    }
    std::sort(chosen.begin(), chosen.end());
    return chosen;
}

int weight_of(const std::vector<Edge>& edges, const Chosen& chosen) {
    if (chosen.empty()) return INF;
    int total = 0;
    for (int i : chosen) total += edges[i][2];
    return total;
}

// Does this edge set connect everything with no edge to spare?
bool spans(int n, const std::vector<Edge>& edges, const Chosen& chosen) {
    if (static_cast<int>(chosen.size()) != n - 1) return false;
    Sets sets(n);
    for (int i : chosen)
        if (!sets.unite(edges[i][0], edges[i][1])) return false;
    return true;
}

void choose(int n, const std::vector<Edge>& edges, Chosen& pick, int start, int& best,
            int& trees, int& minimum) {
    if (static_cast<int>(pick.size()) == n - 1) {
        if (spans(n, edges, pick)) {
            trees++;
            int w = 0;
            for (int i : pick) w += edges[i][2];
            if (w < best) {
                best = w;
                minimum = 1;
            } else if (w == best) {
                minimum++;
            }
        }
        return;
    }
    for (size_t i = start; i < edges.size(); i++) {
        pick.push_back(static_cast<int>(i));
        choose(n, edges, pick, static_cast<int>(i) + 1, best, trees, minimum);
        pick.pop_back();
    }
}

// Every subset of n-1 edges, checked. The count and the minimum are facts.
void survey(int n, const std::vector<Edge>& edges, int& best, int& trees, int& minimum) {
    best = INF;
    trees = 0;
    minimum = 0;
    Chosen pick;
    choose(n, edges, pick, 0, best, trees, minimum);
}

std::string show(const std::vector<Edge>& edges, const Chosen& chosen) {
    if (chosen.empty()) return "none";
    std::string s;
    for (size_t k = 0; k < chosen.size(); k++) {
        if (k > 0) s += " ";
        s += std::to_string(edges[chosen[k]][0]) + "-" + std::to_string(edges[chosen[k]][1]);
    }
    return s;
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
long long seed = 271828;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

void row(const std::string& text, int value) {
    std::cout << "  " << std::left << std::setw(42) << text << " " << std::right
              << std::setw(6) << value << "\\n";
}

int main() {
    std::vector<int> case_n = {4, 4, 5};
    std::vector<std::vector<Edge>> cases = {
        {{0, 1, 1}, {1, 2, 2}, {2, 3, 3}, {0, 3, 4}},
        {{0, 1, 1}, {1, 2, 1}, {2, 3, 1}, {0, 3, 1}},
        {{0, 1, 4}, {0, 2, 1}, {1, 2, 2}, {1, 3, 5}, {2, 3, 8}, {3, 4, 3}},
    };

    std::cout << std::left << std::setw(46) << "edges" << " " << std::setw(14) << "Kruskal"
              << " " << std::setw(14) << "ties flipped" << " " << "cost / minimum trees" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        Chosen a = kruskal(case_n[c], cases[c], false);
        Chosen f = kruskal(case_n[c], cases[c], true);
        int best = 0, trees = 0, minimum = 0;
        survey(case_n[c], cases[c], best, trees, minimum);
        std::cout << std::left << std::setw(46) << label(cases[c]) << " " << std::setw(14)
                  << show(cases[c], a) << " " << std::setw(14) << show(cases[c], f) << " "
                  << weight_of(cases[c], a) << " / " << minimum << "\\n";
    }

    int trials = 3000;
    int connected = 0, kruskal_min = 0, prim_min = 0, flip_min = 0;
    int agreed = 0, flip_agreed = 0, unique_tree = 0, distinct_weights = 0;
    for (int t = 0; t < trials; t++) {
        int n = 3 + rand_below(4);
        std::vector<Edge> edges;
        for (int u = 0; u < n; u++)
            for (int v = u + 1; v < n; v++)
                if (rand_below(3) > 0) edges.push_back({u, v, 1 + rand_below(4)});
        int best = 0, trees = 0, minimum = 0;
        survey(n, edges, best, trees, minimum);
        if (trees == 0) continue;
        connected++;
        Chosen a = kruskal(n, edges, false);
        Chosen b = prim(n, edges);
        Chosen c = kruskal(n, edges, true);
        if (weight_of(edges, a) == best) kruskal_min++;
        if (weight_of(edges, b) == best) prim_min++;
        if (weight_of(edges, c) == best) flip_min++;
        if (a == b) agreed++;
        if (a == c) flip_agreed++;
        if (minimum == 1) unique_tree++;
        std::set<int> weights;
        for (const Edge& e : edges) weights.insert(e[2]);
        if (weights.size() == edges.size()) distinct_weights++;
    }

    std::cout << "\\n";
    std::cout << "over the " << connected << " connected graphs among " << trials
              << " random ones on 3 to 6 nodes:\\n";
    row("Kruskal's total was the minimum", kruskal_min);
    row("Prim's total was the minimum", prim_min);
    row("the same total with the ties flipped", flip_min);
    row("Prim and Kruskal picked the same edges", agreed);
    row("flipping the ties picked the same edges", flip_agreed);
    row("graphs with exactly one minimum tree", unique_tree);
    row("graphs whose weights were all distinct", distinct_weights);

    std::cout << "\\n";
    std::cout << "Both algorithms hit the minimum on every connected graph, scored against\\n";
    std::cout << "every spanning tree there is. That is the guarantee, and it is worth\\n";
    std::cout << "noticing how little it says: minimum *total*, and nothing else.\\n";
    std::cout << "\\n";
    std::cout << "Prim and Kruskal returned the identical edge set on " << agreed << " of "
              << connected << ", which\\n";
    std::cout << "is not a coincidence: both were given the same total order on edges --\\n";
    std::cout << "weight first, then the endpoints -- so they break every tie the same way.\\n";
    std::cout << "\\n";
    std::cout << "Flip that tie-break and the totals do not move: still minimum on all\\n";
    std::cout << flip_min << ". The edge sets do move, on " << (connected - flip_agreed)
              << " of them. That is the whole point.\\n";
    std::cout << "And the two counters that matter line up exactly: flipping the ties\\n";
    std::cout << "returned the same edges on " << flip_agreed << " graphs, and " << unique_tree
              << " graphs had exactly one\\n";
    std::cout << "minimum tree. Those are the same number because they are the same fact --\\n";
    std::cout << "the tie-break can only matter where there is more than one right answer.\\n";
    std::cout << "\\n";
    std::cout << "Only " << distinct_weights << " of the " << connected
              << " graphs had all-distinct weights, and distinct weights\\n";
    std::cout << "force uniqueness. Ties are what let two correct algorithms hand back\\n";
    std::cout << "different trees; the demo's second row is the smallest case, a square of\\n";
    std::cout << "four equal edges with four minimum trees and no reason to prefer any.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Two greedy algorithms, one answer, and the condition for "one".
//
// A spanning tree connects every node using n-1 edges and no cycle. A minimum
// spanning tree is the cheapest such set. Two algorithms find one, and they are
// greedy in different directions:
//
//   Prim     -- grow one tree. Repeatedly take the cheapest edge leaving it.
//   Kruskal  -- sort every edge. Take it if its ends are not already joined.
//
// Both are provably minimum, which is the thing worth checking rather than
// believing: the totals below are scored against every spanning tree there is.
use std::collections::HashSet;

const INF: i64 = 1_000_000_000;

type Edge = (usize, usize, i64);

/// Union-find, as the previous lesson ended up. Kruskal is its main customer.
struct Sets {
    parent: Vec<usize>,
    size: Vec<usize>,
}

impl Sets {
    fn new(n: usize) -> Sets {
        Sets {
            parent: (0..n).collect(),
            size: vec![1; n],
        }
    }

    fn find(&mut self, v: usize) -> usize {
        let mut root = v;
        while self.parent[root] != root {
            root = self.parent[root];
        }
        let mut at = v;
        while self.parent[at] != root {
            let nxt = self.parent[at];
            self.parent[at] = root;
            at = nxt;
        }
        root
    }

    fn unite(&mut self, a: usize, b: usize) -> bool {
        let mut ra = self.find(a);
        let mut rb = self.find(b);
        if ra == rb {
            return false;
        }
        if self.size[rb] > self.size[ra] {
            std::mem::swap(&mut ra, &mut rb);
        }
        self.parent[rb] = ra;
        self.size[ra] += self.size[rb];
        true
    }
}

/// Cheapest edge first, skipped when both ends are already joined.
///
/// \`flip\` only changes how equal weights are ordered against each other. It
/// cannot change the total -- and it does change which edges come back.
fn kruskal(n: usize, edges: &[Edge], flip: bool) -> Option<Vec<usize>> {
    let sign: i64 = if flip { -1 } else { 1 };
    let mut order: Vec<usize> = (0..edges.len()).collect();
    order.sort_by(|&i, &j| {
        (
            edges[i].2,
            sign * edges[i].0 as i64,
            sign * edges[i].1 as i64,
        )
            .cmp(&(
                edges[j].2,
                sign * edges[j].0 as i64,
                sign * edges[j].1 as i64,
            ))
    });
    let mut sets = Sets::new(n);
    let mut chosen: Vec<usize> = Vec::new();
    for &i in &order {
        if sets.unite(edges[i].0, edges[i].1) {
            chosen.push(i);
        }
    }
    if chosen.len() != n - 1 {
        return None;
    }
    chosen.sort();
    Some(chosen)
}

/// One tree, grown by the cheapest edge leaving it. No priority queue here:
/// at this size a linear scan for the cheapest crossing edge is clearer, and
/// the choice of container is the next example's subject.
fn prim(n: usize, edges: &[Edge]) -> Option<Vec<usize>> {
    let mut inside = vec![false; n];
    inside[0] = true;
    let mut chosen: Vec<usize> = Vec::new();
    for _ in 0..(n - 1) {
        let mut best: i64 = -1;
        for (i, &(u, v, w)) in edges.iter().enumerate() {
            if inside[u] == inside[v] {
                continue;
            }
            if best < 0 {
                best = i as i64;
                continue;
            }
            let (bu, bv, bw) = edges[best as usize];
            if (w, u, v) < (bw, bu, bv) {
                best = i as i64;
            }
        }
        if best < 0 {
            return None;
        }
        let (u, v, _) = edges[best as usize];
        inside[u] = true;
        inside[v] = true;
        chosen.push(best as usize);
    }
    chosen.sort();
    Some(chosen)
}

fn weight_of(edges: &[Edge], chosen: &Option<Vec<usize>>) -> i64 {
    match chosen {
        None => INF,
        Some(c) => c.iter().map(|&i| edges[i].2).sum(),
    }
}

/// Does this edge set connect everything with no edge to spare?
fn spans(n: usize, edges: &[Edge], chosen: &[usize]) -> bool {
    if chosen.len() != n - 1 {
        return false;
    }
    let mut sets = Sets::new(n);
    for &i in chosen {
        if !sets.unite(edges[i].0, edges[i].1) {
            return false;
        }
    }
    true
}

fn choose(
    n: usize,
    edges: &[Edge],
    pick: &mut Vec<usize>,
    start: usize,
    best: &mut i64,
    trees: &mut u64,
    minimum: &mut u64,
) {
    if pick.len() == n - 1 {
        if spans(n, edges, pick) {
            *trees += 1;
            let w: i64 = pick.iter().map(|&i| edges[i].2).sum();
            if w < *best {
                *best = w;
                *minimum = 1;
            } else if w == *best {
                *minimum += 1;
            }
        }
        return;
    }
    for i in start..edges.len() {
        pick.push(i);
        choose(n, edges, pick, i + 1, best, trees, minimum);
        pick.pop();
    }
}

/// Every subset of n-1 edges, checked. The count and the minimum are facts.
fn survey(n: usize, edges: &[Edge]) -> (i64, u64, u64) {
    let mut best = INF;
    let mut trees = 0;
    let mut minimum = 0;
    let mut pick: Vec<usize> = Vec::new();
    choose(n, edges, &mut pick, 0, &mut best, &mut trees, &mut minimum);
    (best, trees, minimum)
}

fn show(edges: &[Edge], chosen: &Option<Vec<usize>>) -> String {
    match chosen {
        None => "none".to_string(),
        Some(c) => c
            .iter()
            .map(|&i| format!("{}-{}", edges[i].0, edges[i].1))
            .collect::<Vec<String>>()
            .join(" "),
    }
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

fn row(text: &str, value: u64) {
    println!("  {:<42} {:>6}", text, value);
}

fn main() {
    let case_n = [4usize, 4, 5];
    let cases: Vec<Vec<Edge>> = vec![
        vec![(0, 1, 1), (1, 2, 2), (2, 3, 3), (0, 3, 4)],
        vec![(0, 1, 1), (1, 2, 1), (2, 3, 1), (0, 3, 1)],
        vec![(0, 1, 4), (0, 2, 1), (1, 2, 2), (1, 3, 5), (2, 3, 8), (3, 4, 3)],
    ];

    println!(
        "{:<46} {:<14} {:<14} {}",
        "edges", "Kruskal", "ties flipped", "cost / minimum trees"
    );
    for c in 0..cases.len() {
        let a = kruskal(case_n[c], &cases[c], false);
        let f = kruskal(case_n[c], &cases[c], true);
        let (_, _, minimum) = survey(case_n[c], &cases[c]);
        println!(
            "{:<46} {:<14} {:<14} {} / {}",
            label(&cases[c]),
            show(&cases[c], &a),
            show(&cases[c], &f),
            weight_of(&cases[c], &a),
            minimum
        );
    }

    let mut rng = Rng { seed: 271828 };
    let trials = 3000;
    let mut connected = 0u64;
    let (mut kruskal_min, mut prim_min, mut flip_min) = (0u64, 0u64, 0u64);
    let (mut agreed, mut flip_agreed) = (0u64, 0u64);
    let (mut unique_tree, mut distinct_weights) = (0u64, 0u64);
    for _ in 0..trials {
        let n = 3 + rng.next(4) as usize;
        let mut edges: Vec<Edge> = Vec::new();
        for u in 0..n {
            for v in (u + 1)..n {
                if rng.next(3) > 0 {
                    edges.push((u, v, 1 + rng.next(4)));
                }
            }
        }
        let (best, trees, minimum) = survey(n, &edges);
        if trees == 0 {
            continue;
        }
        connected += 1;
        let a = kruskal(n, &edges, false);
        let b = prim(n, &edges);
        let c = kruskal(n, &edges, true);
        if weight_of(&edges, &a) == best {
            kruskal_min += 1;
        }
        if weight_of(&edges, &b) == best {
            prim_min += 1;
        }
        if weight_of(&edges, &c) == best {
            flip_min += 1;
        }
        if a == b {
            agreed += 1;
        }
        if a == c {
            flip_agreed += 1;
        }
        if minimum == 1 {
            unique_tree += 1;
        }
        let weights: HashSet<i64> = edges.iter().map(|&(_, _, w)| w).collect();
        if weights.len() == edges.len() {
            distinct_weights += 1;
        }
    }

    println!();
    println!(
        "over the {} connected graphs among {} random ones on 3 to 6 nodes:",
        connected, trials
    );
    row("Kruskal's total was the minimum", kruskal_min);
    row("Prim's total was the minimum", prim_min);
    row("the same total with the ties flipped", flip_min);
    row("Prim and Kruskal picked the same edges", agreed);
    row("flipping the ties picked the same edges", flip_agreed);
    row("graphs with exactly one minimum tree", unique_tree);
    row("graphs whose weights were all distinct", distinct_weights);

    println!();
    println!("Both algorithms hit the minimum on every connected graph, scored against");
    println!("every spanning tree there is. That is the guarantee, and it is worth");
    println!("noticing how little it says: minimum *total*, and nothing else.");
    println!();
    println!(
        "Prim and Kruskal returned the identical edge set on {} of {}, which",
        agreed, connected
    );
    println!("is not a coincidence: both were given the same total order on edges --");
    println!("weight first, then the endpoints -- so they break every tie the same way.");
    println!();
    println!("Flip that tie-break and the totals do not move: still minimum on all");
    println!(
        "{}. The edge sets do move, on {} of them. That is the whole point.",
        flip_min,
        connected - flip_agreed
    );
    println!("And the two counters that matter line up exactly: flipping the ties");
    println!(
        "returned the same edges on {} graphs, and {} graphs had exactly one",
        flip_agreed, unique_tree
    );
    println!("minimum tree. Those are the same number because they are the same fact --");
    println!("the tie-break can only matter where there is more than one right answer.");
    println!();
    println!(
        "Only {} of the {} graphs had all-distinct weights, and distinct weights",
        distinct_weights, connected
    );
    println!("force uniqueness. Ties are what let two correct algorithms hand back");
    println!("different trees; the demo's second row is the smallest case, a square of");
    println!("four equal edges with four minimum trees and no reason to prefer any.");
}
`,
            },
            {
              lang: "go",
              code: `// Two greedy algorithms, one answer, and the condition for "one".
//
// A spanning tree connects every node using n-1 edges and no cycle. A minimum
// spanning tree is the cheapest such set. Two algorithms find one, and they are
// greedy in different directions:
//
//	Prim     -- grow one tree. Repeatedly take the cheapest edge leaving it.
//	Kruskal  -- sort every edge. Take it if its ends are not already joined.
//
// Both are provably minimum, which is the thing worth checking rather than
// believing: the totals below are scored against every spanning tree there is.
package main

import (
	"fmt"
	"sort"
	"strings"
)

const INF = 1000000000

// Edge is an undirected edge with a weight.
type Edge struct {
	U, V, W int
}

// Sets is union-find, as the previous lesson ended up. Kruskal is its main
// customer.
type Sets struct {
	parent []int
	size   []int
}

func newSets(n int) *Sets {
	s := &Sets{parent: make([]int, n), size: make([]int, n)}
	for i := range s.parent {
		s.parent[i] = i
		s.size[i] = 1
	}
	return s
}

func (s *Sets) find(v int) int {
	root := v
	for s.parent[root] != root {
		root = s.parent[root]
	}
	at := v
	for s.parent[at] != root {
		nxt := s.parent[at]
		s.parent[at] = root
		at = nxt
	}
	return root
}

func (s *Sets) unite(a, b int) bool {
	ra, rb := s.find(a), s.find(b)
	if ra == rb {
		return false
	}
	if s.size[rb] > s.size[ra] {
		ra, rb = rb, ra
	}
	s.parent[rb] = ra
	s.size[ra] += s.size[rb]
	return true
}

// kruskal takes the cheapest edge first, skipping it when both ends are
// already joined.
//
// flip only changes how equal weights are ordered against each other. It
// cannot change the total -- and it does change which edges come back.
func kruskal(n int, edges []Edge, flip bool) []int {
	sign := 1
	if flip {
		sign = -1
	}
	order := make([]int, len(edges))
	for i := range order {
		order[i] = i
	}
	sort.Slice(order, func(a, b int) bool {
		i, j := order[a], order[b]
		if edges[i].W != edges[j].W {
			return edges[i].W < edges[j].W
		}
		if edges[i].U != edges[j].U {
			return sign*edges[i].U < sign*edges[j].U
		}
		return sign*edges[i].V < sign*edges[j].V
	})
	sets := newSets(n)
	var chosen []int
	for _, i := range order {
		if sets.unite(edges[i].U, edges[i].V) {
			chosen = append(chosen, i)
		}
	}
	if len(chosen) != n-1 {
		return nil
	}
	sort.Ints(chosen)
	return chosen
}

// prim grows one tree by the cheapest edge leaving it. No priority queue here:
// at this size a linear scan for the cheapest crossing edge is clearer, and
// the choice of container is the next example's subject.
func prim(n int, edges []Edge) []int {
	inside := make([]bool, n)
	inside[0] = true
	var chosen []int
	for step := 0; step < n-1; step++ {
		best := -1
		for i, e := range edges {
			if inside[e.U] == inside[e.V] {
				continue
			}
			if best < 0 {
				best = i
				continue
			}
			b := edges[best]
			if e.W < b.W || (e.W == b.W && (e.U < b.U || (e.U == b.U && e.V < b.V))) {
				best = i
			}
		}
		if best < 0 {
			return nil
		}
		inside[edges[best].U] = true
		inside[edges[best].V] = true
		chosen = append(chosen, best)
	}
	sort.Ints(chosen)
	return chosen
}

func weightOf(edges []Edge, chosen []int) int {
	if chosen == nil {
		return INF
	}
	total := 0
	for _, i := range chosen {
		total += edges[i].W
	}
	return total
}

// spans asks whether this edge set connects everything with no edge to spare.
func spans(n int, edges []Edge, chosen []int) bool {
	if len(chosen) != n-1 {
		return false
	}
	sets := newSets(n)
	for _, i := range chosen {
		if !sets.unite(edges[i].U, edges[i].V) {
			return false
		}
	}
	return true
}

func choose(n int, edges []Edge, pick []int, start int, best, trees, minimum *int) []int {
	if len(pick) == n-1 {
		if spans(n, edges, pick) {
			*trees++
			w := 0
			for _, i := range pick {
				w += edges[i].W
			}
			if w < *best {
				*best = w
				*minimum = 1
			} else if w == *best {
				*minimum++
			}
		}
		return pick
	}
	for i := start; i < len(edges); i++ {
		pick = append(pick, i)
		pick = choose(n, edges, pick, i+1, best, trees, minimum)
		pick = pick[:len(pick)-1]
	}
	return pick
}

// survey checks every subset of n-1 edges. The count and the minimum are facts.
func survey(n int, edges []Edge) (int, int, int) {
	best, trees, minimum := INF, 0, 0
	choose(n, edges, nil, 0, &best, &trees, &minimum)
	return best, trees, minimum
}

func sameChoice(a, b []int) bool {
	if a == nil || b == nil || len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func show(edges []Edge, chosen []int) string {
	if chosen == nil {
		return "none"
	}
	cells := make([]string, len(chosen))
	for k, i := range chosen {
		cells[k] = fmt.Sprintf("%d-%d", edges[i].U, edges[i].V)
	}
	return strings.Join(cells, " ")
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
var seed int64 = 271828

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func row(text string, value int) {
	fmt.Printf("  %-42s %6d\\n", text, value)
}

func main() {
	caseN := []int{4, 4, 5}
	cases := [][]Edge{
		{{0, 1, 1}, {1, 2, 2}, {2, 3, 3}, {0, 3, 4}},
		{{0, 1, 1}, {1, 2, 1}, {2, 3, 1}, {0, 3, 1}},
		{{0, 1, 4}, {0, 2, 1}, {1, 2, 2}, {1, 3, 5}, {2, 3, 8}, {3, 4, 3}},
	}

	fmt.Printf("%-46s %-14s %-14s %s\\n",
		"edges", "Kruskal", "ties flipped", "cost / minimum trees")
	for c := range cases {
		a := kruskal(caseN[c], cases[c], false)
		f := kruskal(caseN[c], cases[c], true)
		_, _, minimum := survey(caseN[c], cases[c])
		fmt.Printf("%-46s %-14s %-14s %d / %d\\n", label(cases[c]),
			show(cases[c], a), show(cases[c], f), weightOf(cases[c], a), minimum)
	}

	trials := 3000
	connected, kruskalMin, primMin, flipMin := 0, 0, 0, 0
	agreed, flipAgreed, uniqueTree, distinctWeights := 0, 0, 0, 0
	for t := 0; t < trials; t++ {
		n := 3 + randBelow(4)
		var edges []Edge
		for u := 0; u < n; u++ {
			for v := u + 1; v < n; v++ {
				if randBelow(3) > 0 {
					edges = append(edges, Edge{u, v, 1 + randBelow(4)})
				}
			}
		}
		best, trees, minimum := survey(n, edges)
		if trees == 0 {
			continue
		}
		connected++
		a := kruskal(n, edges, false)
		b := prim(n, edges)
		c := kruskal(n, edges, true)
		if weightOf(edges, a) == best {
			kruskalMin++
		}
		if weightOf(edges, b) == best {
			primMin++
		}
		if weightOf(edges, c) == best {
			flipMin++
		}
		if sameChoice(a, b) {
			agreed++
		}
		if sameChoice(a, c) {
			flipAgreed++
		}
		if minimum == 1 {
			uniqueTree++
		}
		weights := map[int]bool{}
		for _, e := range edges {
			weights[e.W] = true
		}
		if len(weights) == len(edges) {
			distinctWeights++
		}
	}

	fmt.Println()
	fmt.Printf("over the %d connected graphs among %d random ones on 3 to 6 nodes:\\n", connected, trials)
	row("Kruskal's total was the minimum", kruskalMin)
	row("Prim's total was the minimum", primMin)
	row("the same total with the ties flipped", flipMin)
	row("Prim and Kruskal picked the same edges", agreed)
	row("flipping the ties picked the same edges", flipAgreed)
	row("graphs with exactly one minimum tree", uniqueTree)
	row("graphs whose weights were all distinct", distinctWeights)

	fmt.Println()
	fmt.Println("Both algorithms hit the minimum on every connected graph, scored against")
	fmt.Println("every spanning tree there is. That is the guarantee, and it is worth")
	fmt.Println("noticing how little it says: minimum *total*, and nothing else.")
	fmt.Println()
	fmt.Printf("Prim and Kruskal returned the identical edge set on %d of %d, which\\n", agreed, connected)
	fmt.Println("is not a coincidence: both were given the same total order on edges --")
	fmt.Println("weight first, then the endpoints -- so they break every tie the same way.")
	fmt.Println()
	fmt.Println("Flip that tie-break and the totals do not move: still minimum on all")
	fmt.Printf("%d. The edge sets do move, on %d of them. That is the whole point.\\n", flipMin, connected-flipAgreed)
	fmt.Println("And the two counters that matter line up exactly: flipping the ties")
	fmt.Printf("returned the same edges on %d graphs, and %d graphs had exactly one\\n", flipAgreed, uniqueTree)
	fmt.Println("minimum tree. Those are the same number because they are the same fact --")
	fmt.Println("the tie-break can only matter where there is more than one right answer.")
	fmt.Println()
	fmt.Printf("Only %d of the %d graphs had all-distinct weights, and distinct weights\\n", distinctWeights, connected)
	fmt.Println("force uniqueness. Ties are what let two correct algorithms hand back")
	fmt.Println("different trees; the demo's second row is the smallest case, a square of")
	fmt.Println("four equal edges with four minimum trees and no reason to prefer any.")
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "graph-kruskal-mst",
        kind: "graph",
        algorithm: "kruskal",
        title: "Cheapest edge first, skipped when it would close a cycle",
        lockAlgorithm: true,
      },
      pitfalls: [
        {
          title: "Asserting the exact edge list in a test",
          body: "Only 1,415 of 2,626 random graphs had a unique minimum tree. Flipping nothing but the tie-break changed the edge set on 1,211 graphs without changing a single total. Assert the total weight, or assert that the result spans and is minimum -- not which edges came back.",
        },
        {
          title: "Assuming Prim and Kruskal disagree",
          body: "They returned the identical set on all 2,626 graphs here, and that is a fact about the comparator, not the algorithms. Give them the same total order on edges and they break every tie the same way. Give them different orders and they diverge on exactly the graphs with more than one minimum tree.",
        },
        {
          title: "Starting Prim from a node with no edges",
          body: "Prim grows one tree, so it only ever reaches one component. On a disconnected graph it stops early with fewer than n-1 edges -- which is the same signal Kruskal gives, and worth checking rather than assuming the input is connected.",
        },
      ],
    },
    {
      id: "why-greedy-is-allowed",
      heading: "Why greedy is allowed",
      body: [
        "Greedy algorithms are usually wrong. Dijkstra needed a condition to be right, and minimum spanning trees have their own, in two halves.",
        "**The cut property:** split the nodes into two sides, any way at all. The cheapest edge crossing that split belongs in a minimum tree; if it is *uniquely* cheapest, it is in all of them. Over 38,325 cuts examined, a cheapest crossing edge was in some minimum tree every single time, and on the 21,657 cuts with one strictly cheapest edge, that edge was in every minimum tree.",
        "**The cycle property:** take any cycle; its heaviest edge is in no minimum tree, if it is uniquely heaviest. Over 27,508 cycles, that held on all 15,153 where the heaviest was strict.",
        "Neither algorithm is guessing. Prim applies the cut property to the split between \"in my tree\" and \"not yet\". Kruskal applies it to the split its next edge would join \u2014 the cheapest edge with its ends in different components *is* the cheapest edge crossing the cut between one of those components and everything else.",
        "Note the word *strictly* in both counters. A cheapest crossing edge is always in some minimum tree; only a uniquely cheapest one is in every minimum tree. That is the previous section's tie business, seen from the other side.",
        "And the cycle property is an algorithm too, for free: start with every edge and repeatedly delete the dearest one you can spare. Reverse-delete hit the minimum on all 2,619 graphs. Nobody uses it \u2014 a connectivity check after every candidate deletion is far more work than sorting once \u2014 but it is the same theorem read backwards.",
      ],
      examples: [
        {
          id: "cut-and-cycle",
          title: "The two rules that make the greedy step safe, checked exhaustively",
          lang: "python",
          code: `# Why greedy is allowed here, stated as two rules and checked against every tree.
#
# Greedy algorithms are usually wrong, and the Dijkstra lesson is about the one
# condition that makes one right. Minimum spanning trees have their own
# condition, and it comes in two halves:
#
#   the cut property   -- split the nodes into two sides any way at all. The
#                         cheapest edge crossing that split belongs in a
#                         minimum tree; if it is uniquely cheapest, in all of
#                         them.
#   the cycle property -- take any cycle. Its heaviest edge is in no minimum
#                         tree, if it is uniquely heaviest.
#
# Prim is the cut property applied to the split between "in my tree" and "not
# yet". Kruskal is it applied to the split its next edge would join. And the
# cycle property gives a third algorithm for free: start with everything and
# delete the most expensive edge you can spare.
INF = 10 ** 9


class Sets:
    def __init__(self, n):
        self.parent = list(range(n))

    def find(self, v):
        while self.parent[v] != v:
            self.parent[v] = self.parent[self.parent[v]]
            v = self.parent[v]
        return v

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        self.parent[rb] = ra
        return True


def spans(n, edges, chosen):
    if len(chosen) != n - 1:
        return False
    sets = Sets(n)
    for i in chosen:
        u, v, _ = edges[i]
        if not sets.union(u, v):
            return False
    return True


def survey(n, edges):
    """Every spanning tree, by brute force.

    Returns the minimum total, how many trees hit it, and for each edge how
    many of those trees contain it. Everything below is scored against these.
    """
    m = len(edges)
    best = INF
    count = 0
    inside = [0] * m
    pick = []

    def choose(start):
        nonlocal best, count, inside
        if len(pick) == n - 1:
            if spans(n, edges, pick):
                w = sum(edges[i][2] for i in pick)
                if w < best:
                    best = w
                    count = 1
                    inside = [0] * m
                    for i in pick:
                        inside[i] = 1
                elif w == best:
                    count += 1
                    for i in pick:
                        inside[i] += 1
            return
        for i in range(start, m):
            pick.append(i)
            choose(i + 1)
            pick.pop()

    choose(0)
    return best, count, inside


def reverse_delete(n, edges):
    """The cycle property as an algorithm: drop the dearest edge you can spare."""
    order = sorted(range(len(edges)),
                   key=lambda i: (-edges[i][2], edges[i][0], edges[i][1]))
    kept = set(range(len(edges)))
    for i in order:
        kept.discard(i)
        sets = Sets(n)
        joined = 0
        for j in kept:
            u, v, _ = edges[j]
            if sets.union(u, v):
                joined += 1
        if joined != n - 1:
            kept.add(i)
    return sorted(kept)


def simple_cycles(n, edges):
    """Every cycle in the graph, as a list of edge indices. Exponential, exact."""
    adj = [[] for _ in range(n)]
    for i, (u, v, _) in enumerate(edges):
        adj[u].append((v, i))
        adj[v].append((u, i))
    found = []

    for start in range(n):
        path = []
        seen = [False] * n
        seen[start] = True

        def walk(at):
            for nxt, i in adj[at]:
                if i in path:
                    continue
                if nxt == start:
                    if len(path) >= 2:
                        found.append(sorted(path + [i]))
                elif not seen[nxt] and nxt > start:
                    seen[nxt] = True
                    path.append(i)
                    walk(nxt)
                    path.pop()
                    seen[nxt] = False

        walk(start)
    return [list(c) for c in set(tuple(c) for c in found)]


def show(edges, chosen):
    return " ".join("%d-%d" % (edges[i][0], edges[i][1]) for i in chosen)


def label(edges):
    return "[" + ", ".join("%d-%d:%d" % e for e in edges) + "]"


CASES = [
    (4, [(0, 1, 1), (1, 2, 2), (2, 3, 3), (0, 3, 4)]),
    (4, [(0, 1, 3), (1, 2, 1), (2, 3, 3), (0, 3, 1), (0, 2, 2)]),
    (5, [(0, 1, 4), (0, 2, 1), (1, 2, 2), (1, 3, 5), (2, 3, 8), (3, 4, 3)]),
]

print("%-46s %-18s %s" % ("edges", "reverse-delete", "cost / minimum"))
for n, edges in CASES:
    kept = reverse_delete(n, edges)
    best, count, _ = survey(n, edges)
    print("%-46s %-18s %d / %d" % (
        label(edges), show(edges, kept), sum(edges[i][2] for i in kept), best))

# The same linear congruential generator in every language, so the random
# graphs below are the same graphs whichever translation is run.
seed = 161803


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


trials = 3000
connected = 0
cuts_checked = cut_holds = cut_unique = cut_unique_holds = 0
cycles_checked = cycle_unique = cycle_holds = 0
delete_min = 0
for _ in range(trials):
    n = 3 + rand(4)
    edges = []
    for u in range(n):
        for v in range(u + 1, n):
            if rand(3) > 0:
                edges.append((u, v, 1 + rand(4)))
    best, count, inside = survey(n, edges)
    if count == 0:
        continue
    connected += 1

    kept = reverse_delete(n, edges)
    delete_min += sum(edges[i][2] for i in kept) == best

    # Every way of splitting the nodes in two, with node 0 always on the left.
    for mask in range(1, 1 << (n - 1)):
        side = [False] * n
        for v in range(1, n):
            if mask >> (v - 1) & 1:
                side[v] = True
        crossing = [i for i, (u, v, _) in enumerate(edges) if side[u] != side[v]]
        if not crossing:
            continue
        cuts_checked += 1
        cheapest = min(edges[i][2] for i in crossing)
        winners = [i for i in crossing if edges[i][2] == cheapest]
        if any(inside[i] > 0 for i in winners):
            cut_holds += 1
        if len(winners) == 1:
            cut_unique += 1
            if inside[winners[0]] == count:
                cut_unique_holds += 1

    for cycle in simple_cycles(n, edges):
        cycles_checked += 1
        dearest = max(edges[i][2] for i in cycle)
        losers = [i for i in cycle if edges[i][2] == dearest]
        if len(losers) == 1:
            cycle_unique += 1
            if inside[losers[0]] == 0:
                cycle_holds += 1

print()
print("over the %d connected graphs among %d random ones on 3 to 6 nodes:" % (connected, trials))
print("  %-42s %6d" % ("cuts examined", cuts_checked))
print("  %-42s %6d" % ("a cheapest crossing edge was in some", cut_holds))
print("  %-42s %6d" % ("cuts with one strictly cheapest edge", cut_unique))
print("  %-42s %6d" % ("that edge was in every minimum tree", cut_unique_holds))
print()
print("  %-42s %6d" % ("cycles examined", cycles_checked))
print("  %-42s %6d" % ("cycles with one strictly dearest edge", cycle_unique))
print("  %-42s %6d" % ("that edge was in no minimum tree", cycle_holds))
print()
print("  %-42s %6d" % ("reverse-delete hit the minimum", delete_min))

print()
print("Both rules held everywhere they were checked, which is what makes the")
print("greedy step safe. Prim takes the cheapest edge crossing the cut between")
print("the tree it has grown and everything else. Kruskal takes the cheapest")
print("edge whose two ends are in different components, which is the cheapest")
print("edge crossing the cut between one of those components and the rest.")
print("Neither is guessing; both are applying the same theorem.")
print()
print("Note the word \\"strictly\\" in the counters. A cheapest crossing edge is")
print("always in some minimum tree, but only a uniquely cheapest one is in")
print("every minimum tree -- which is the same tie business as the previous")
print("example, seen from the other side.")
print()
print("And the cycle property is an algorithm too: delete the dearest edge you")
print("can spare, repeatedly, and stop when nothing more can go. It hit the")
print("minimum on all %d graphs. Nobody uses it -- checking connectivity after" % delete_min)
print("every candidate deletion is far more work than sorting once -- but it is")
print("the same theorem read backwards.")
`,
          output: `edges                                          reverse-delete     cost / minimum
[0-1:1, 1-2:2, 2-3:3, 0-3:4]                   0-1 1-2 2-3        6 / 6
[0-1:3, 1-2:1, 2-3:3, 0-3:1, 0-2:2]            1-2 0-3 0-2        4 / 4
[0-1:4, 0-2:1, 1-2:2, 1-3:5, 2-3:8, 3-4:3]     0-2 1-2 1-3 3-4    11 / 11

over the 2619 connected graphs among 3000 random ones on 3 to 6 nodes:
  cuts examined                               38325
  a cheapest crossing edge was in some        38325
  cuts with one strictly cheapest edge        21657
  that edge was in every minimum tree         21657

  cycles examined                             27508
  cycles with one strictly dearest edge       15153
  that edge was in no minimum tree            15153

  reverse-delete hit the minimum               2619

Both rules held everywhere they were checked, which is what makes the
greedy step safe. Prim takes the cheapest edge crossing the cut between
the tree it has grown and everything else. Kruskal takes the cheapest
edge whose two ends are in different components, which is the cheapest
edge crossing the cut between one of those components and the rest.
Neither is guessing; both are applying the same theorem.

Note the word "strictly" in the counters. A cheapest crossing edge is
always in some minimum tree, but only a uniquely cheapest one is in
every minimum tree -- which is the same tie business as the previous
example, seen from the other side.

And the cycle property is an algorithm too: delete the dearest edge you
can spare, repeatedly, and stop when nothing more can go. It hit the
minimum on all 2619 graphs. Nobody uses it -- checking connectivity after
every candidate deletion is far more work than sorting once -- but it is
the same theorem read backwards.`,
          explanation:
            "Every cut and every cycle of every random graph, scored against the full set of minimum spanning trees. Reverse-delete at the end is the cycle property turned into an algorithm.",
          alternates: [
            {
              lang: "javascript",
              code: `// Why greedy is allowed here, stated as two rules and checked against every tree.
//
// Greedy algorithms are usually wrong, and the Dijkstra lesson is about the one
// condition that makes one right. Minimum spanning trees have their own
// condition, and it comes in two halves:
//
//   the cut property   -- split the nodes into two sides any way at all. The
//                         cheapest edge crossing that split belongs in a
//                         minimum tree; if it is uniquely cheapest, in all of
//                         them.
//   the cycle property -- take any cycle. Its heaviest edge is in no minimum
//                         tree, if it is uniquely heaviest.
//
// Prim is the cut property applied to the split between "in my tree" and "not
// yet". Kruskal is it applied to the split its next edge would join. And the
// cycle property gives a third algorithm for free: start with everything and
// delete the most expensive edge you can spare.
const INF = 10 ** 9;

class Sets {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
  }

  find(v) {
    let at = v;
    while (this.parent[at] !== at) {
      this.parent[at] = this.parent[this.parent[at]];
      at = this.parent[at];
    }
    return at;
  }

  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return false;
    this.parent[rb] = ra;
    return true;
  }
}

function spans(n, edges, chosen) {
  if (chosen.length !== n - 1) return false;
  const sets = new Sets(n);
  for (const i of chosen) {
    if (!sets.union(edges[i][0], edges[i][1])) return false;
  }
  return true;
}

// Every spanning tree, by brute force.
//
// Returns the minimum total, how many trees hit it, and for each edge how
// many of those trees contain it. Everything below is scored against these.
function survey(n, edges) {
  const m = edges.length;
  let best = INF;
  let count = 0;
  let inside = new Array(m).fill(0);
  const pick = [];

  const choose = (start) => {
    if (pick.length === n - 1) {
      if (spans(n, edges, pick)) {
        const w = pick.reduce((sum, i) => sum + edges[i][2], 0);
        if (w < best) {
          best = w;
          count = 1;
          inside = new Array(m).fill(0);
          for (const i of pick) inside[i] = 1;
        } else if (w === best) {
          count += 1;
          for (const i of pick) inside[i] += 1;
        }
      }
      return;
    }
    for (let i = start; i < m; i += 1) {
      pick.push(i);
      choose(i + 1);
      pick.pop();
    }
  };

  choose(0);
  return [best, count, inside];
}

// The cycle property as an algorithm: drop the dearest edge you can spare.
function reverseDelete(n, edges) {
  const order = Array.from({ length: edges.length }, (_, i) => i);
  order.sort((i, j) => {
    if (edges[i][2] !== edges[j][2]) return edges[j][2] - edges[i][2];
    if (edges[i][0] !== edges[j][0]) return edges[i][0] - edges[j][0];
    return edges[i][1] - edges[j][1];
  });
  const kept = new Set(order);
  for (const i of order) {
    kept.delete(i);
    const sets = new Sets(n);
    let joined = 0;
    for (const j of kept) {
      if (sets.union(edges[j][0], edges[j][1])) joined += 1;
    }
    if (joined !== n - 1) kept.add(i);
  }
  return [...kept].sort((a, b) => a - b);
}

// Every cycle in the graph, as a list of edge indices. Exponential, exact.
function simpleCycles(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], i) => {
    adj[u].push([v, i]);
    adj[v].push([u, i]);
  });
  const found = new Set();

  for (let start = 0; start < n; start += 1) {
    const path = [];
    const seen = new Array(n).fill(false);
    seen[start] = true;

    const walk = (at) => {
      for (const [nxt, i] of adj[at]) {
        if (path.includes(i)) continue;
        if (nxt === start) {
          if (path.length >= 2) found.add([...path, i].sort((a, b) => a - b).join(","));
        } else if (!seen[nxt] && nxt > start) {
          seen[nxt] = true;
          path.push(i);
          walk(nxt);
          path.pop();
          seen[nxt] = false;
        }
      }
    };

    walk(start);
  }
  return [...found].map((s) => s.split(",").map(Number));
}

function show(edges, chosen) {
  return chosen.map((i) => \`\${edges[i][0]}-\${edges[i][1]}\`).join(" ");
}

function label(edges) {
  return "[" + edges.map(([u, v, w]) => \`\${u}-\${v}:\${w}\`).join(", ") + "]";
}

const CASES = [
  [4, [[0, 1, 1], [1, 2, 2], [2, 3, 3], [0, 3, 4]]],
  [4, [[0, 1, 3], [1, 2, 1], [2, 3, 3], [0, 3, 1], [0, 2, 2]]],
  [5, [[0, 1, 4], [0, 2, 1], [1, 2, 2], [1, 3, 5], [2, 3, 8], [3, 4, 3]]],
];

console.log("edges".padEnd(46) + " " + "reverse-delete".padEnd(18) + " " + "cost / minimum");
for (const [n, edges] of CASES) {
  const kept = reverseDelete(n, edges);
  const [best] = survey(n, edges);
  console.log(
    label(edges).padEnd(46) + " " + show(edges, kept).padEnd(18) + " " +
    \`\${kept.reduce((sum, i) => sum + edges[i][2], 0)} / \${best}\`,
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 161803n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let connected = 0;
let cutsChecked = 0;
let cutHolds = 0;
let cutUnique = 0;
let cutUniqueHolds = 0;
let cyclesChecked = 0;
let cycleUnique = 0;
let cycleHolds = 0;
let deleteMin = 0;
for (let t = 0; t < trials; t += 1) {
  const n = 3 + rand(4);
  const edges = [];
  for (let u = 0; u < n; u += 1)
    for (let v = u + 1; v < n; v += 1)
      if (rand(3) > 0) edges.push([u, v, 1 + rand(4)]);
  const [best, count, inside] = survey(n, edges);
  if (count === 0) continue;
  connected += 1;

  const kept = reverseDelete(n, edges);
  if (kept.reduce((sum, i) => sum + edges[i][2], 0) === best) deleteMin += 1;

  // Every way of splitting the nodes in two, with node 0 always on the left.
  for (let mask = 1; mask < 1 << (n - 1); mask += 1) {
    const side = new Array(n).fill(false);
    for (let v = 1; v < n; v += 1) if ((mask >> (v - 1)) & 1) side[v] = true;
    const crossing = [];
    edges.forEach(([u, v], i) => {
      if (side[u] !== side[v]) crossing.push(i);
    });
    if (crossing.length === 0) continue;
    cutsChecked += 1;
    const cheapest = Math.min(...crossing.map((i) => edges[i][2]));
    const winners = crossing.filter((i) => edges[i][2] === cheapest);
    if (winners.some((i) => inside[i] > 0)) cutHolds += 1;
    if (winners.length === 1) {
      cutUnique += 1;
      if (inside[winners[0]] === count) cutUniqueHolds += 1;
    }
  }

  for (const cycle of simpleCycles(n, edges)) {
    cyclesChecked += 1;
    const dearest = Math.max(...cycle.map((i) => edges[i][2]));
    const losers = cycle.filter((i) => edges[i][2] === dearest);
    if (losers.length === 1) {
      cycleUnique += 1;
      if (inside[losers[0]] === 0) cycleHolds += 1;
    }
  }
}

const row = (text, value) => "  " + text.padEnd(42) + " " + String(value).padStart(6);

console.log();
console.log(\`over the \${connected} connected graphs among \${trials} random ones on 3 to 6 nodes:\`);
console.log(row("cuts examined", cutsChecked));
console.log(row("a cheapest crossing edge was in some", cutHolds));
console.log(row("cuts with one strictly cheapest edge", cutUnique));
console.log(row("that edge was in every minimum tree", cutUniqueHolds));
console.log();
console.log(row("cycles examined", cyclesChecked));
console.log(row("cycles with one strictly dearest edge", cycleUnique));
console.log(row("that edge was in no minimum tree", cycleHolds));
console.log();
console.log(row("reverse-delete hit the minimum", deleteMin));

console.log();
console.log("Both rules held everywhere they were checked, which is what makes the");
console.log("greedy step safe. Prim takes the cheapest edge crossing the cut between");
console.log("the tree it has grown and everything else. Kruskal takes the cheapest");
console.log("edge whose two ends are in different components, which is the cheapest");
console.log("edge crossing the cut between one of those components and the rest.");
console.log("Neither is guessing; both are applying the same theorem.");
console.log();
console.log('Note the word "strictly" in the counters. A cheapest crossing edge is');
console.log("always in some minimum tree, but only a uniquely cheapest one is in");
console.log("every minimum tree -- which is the same tie business as the previous");
console.log("example, seen from the other side.");
console.log();
console.log("And the cycle property is an algorithm too: delete the dearest edge you");
console.log("can spare, repeatedly, and stop when nothing more can go. It hit the");
console.log(\`minimum on all \${deleteMin} graphs. Nobody uses it -- checking connectivity after\`);
console.log("every candidate deletion is far more work than sorting once -- but it is");
console.log("the same theorem read backwards.");
`,
            },
            {
              lang: "typescript",
              code: `// Why greedy is allowed here, stated as two rules and checked against every tree.
//
// Greedy algorithms are usually wrong, and the Dijkstra lesson is about the one
// condition that makes one right. Minimum spanning trees have their own
// condition, and it comes in two halves:
//
//   the cut property   -- split the nodes into two sides any way at all. The
//                         cheapest edge crossing that split belongs in a
//                         minimum tree; if it is uniquely cheapest, in all of
//                         them.
//   the cycle property -- take any cycle. Its heaviest edge is in no minimum
//                         tree, if it is uniquely heaviest.
//
// Prim is the cut property applied to the split between "in my tree" and "not
// yet". Kruskal is it applied to the split its next edge would join. And the
// cycle property gives a third algorithm for free: start with everything and
// delete the most expensive edge you can spare.
const INF = 10 ** 9;

class Sets {
  parent: number[];

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
  }

  find(v: number): number {
    let at = v;
    while (this.parent[at] !== at) {
      this.parent[at] = this.parent[this.parent[at]];
      at = this.parent[at];
    }
    return at;
  }

  union(a: number, b: number): boolean {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return false;
    this.parent[rb] = ra;
    return true;
  }
}

function spans(n: number, edges: number[][], chosen: number[]): boolean {
  if (chosen.length !== n - 1) return false;
  const sets = new Sets(n);
  for (const i of chosen) {
    if (!sets.union(edges[i][0], edges[i][1])) return false;
  }
  return true;
}

// Every spanning tree, by brute force.
//
// Returns the minimum total, how many trees hit it, and for each edge how
// many of those trees contain it. Everything below is scored against these.
function survey(n: number, edges: number[][]): [number, number, number[]] {
  const m = edges.length;
  let best = INF;
  let count = 0;
  let inside = new Array(m).fill(0);
  const pick: number[] = [];

  const choose = (start: number): void => {
    if (pick.length === n - 1) {
      if (spans(n, edges, pick)) {
        const w = pick.reduce((sum, i) => sum + edges[i][2], 0);
        if (w < best) {
          best = w;
          count = 1;
          inside = new Array(m).fill(0);
          for (const i of pick) inside[i] = 1;
        } else if (w === best) {
          count += 1;
          for (const i of pick) inside[i] += 1;
        }
      }
      return;
    }
    for (let i = start; i < m; i += 1) {
      pick.push(i);
      choose(i + 1);
      pick.pop();
    }
  };

  choose(0);
  return [best, count, inside];
}

// The cycle property as an algorithm: drop the dearest edge you can spare.
function reverseDelete(n: number, edges: number[][]): number[] {
  const order = Array.from({ length: edges.length }, (_, i) => i);
  order.sort((i, j) => {
    if (edges[i][2] !== edges[j][2]) return edges[j][2] - edges[i][2];
    if (edges[i][0] !== edges[j][0]) return edges[i][0] - edges[j][0];
    return edges[i][1] - edges[j][1];
  });
  const kept = new Set(order);
  for (const i of order) {
    kept.delete(i);
    const sets = new Sets(n);
    let joined = 0;
    for (const j of kept) {
      if (sets.union(edges[j][0], edges[j][1])) joined += 1;
    }
    if (joined !== n - 1) kept.add(i);
  }
  return [...kept].sort((a, b) => a - b);
}

// Every cycle in the graph, as a list of edge indices. Exponential, exact.
function simpleCycles(n: number, edges: number[][]): number[][] {
  const adj: number[][][] = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], i) => {
    adj[u].push([v, i]);
    adj[v].push([u, i]);
  });
  const found = new Set<string>();

  for (let start = 0; start < n; start += 1) {
    const path: number[] = [];
    const seen = new Array(n).fill(false);
    seen[start] = true;

    const walk = (at: number): void => {
      for (const [nxt, i] of adj[at]) {
        if (path.includes(i)) continue;
        if (nxt === start) {
          if (path.length >= 2) found.add([...path, i].sort((a, b) => a - b).join(","));
        } else if (!seen[nxt] && nxt > start) {
          seen[nxt] = true;
          path.push(i);
          walk(nxt);
          path.pop();
          seen[nxt] = false;
        }
      }
    };

    walk(start);
  }
  return [...found].map((s) => s.split(",").map(Number));
}

function show(edges: number[][], chosen: number[]): string {
  return chosen.map((i) => \`\${edges[i][0]}-\${edges[i][1]}\`).join(" ");
}

function label(edges: number[][]): string {
  return "[" + edges.map(([u, v, w]) => \`\${u}-\${v}:\${w}\`).join(", ") + "]";
}

const CASES: [number, number[][]][] = [
  [4, [[0, 1, 1], [1, 2, 2], [2, 3, 3], [0, 3, 4]]],
  [4, [[0, 1, 3], [1, 2, 1], [2, 3, 3], [0, 3, 1], [0, 2, 2]]],
  [5, [[0, 1, 4], [0, 2, 1], [1, 2, 2], [1, 3, 5], [2, 3, 8], [3, 4, 3]]],
];

console.log("edges".padEnd(46) + " " + "reverse-delete".padEnd(18) + " " + "cost / minimum");
for (const [n, edges] of CASES) {
  const kept = reverseDelete(n, edges);
  const [best] = survey(n, edges);
  console.log(
    label(edges).padEnd(46) + " " + show(edges, kept).padEnd(18) + " " +
    \`\${kept.reduce((sum, i) => sum + edges[i][2], 0)} / \${best}\`,
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 161803n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let connected = 0;
let cutsChecked = 0;
let cutHolds = 0;
let cutUnique = 0;
let cutUniqueHolds = 0;
let cyclesChecked = 0;
let cycleUnique = 0;
let cycleHolds = 0;
let deleteMin = 0;
for (let t = 0; t < trials; t += 1) {
  const n = 3 + rand(4);
  const edges: number[][] = [];
  for (let u = 0; u < n; u += 1)
    for (let v = u + 1; v < n; v += 1)
      if (rand(3) > 0) edges.push([u, v, 1 + rand(4)]);
  const [best, count, inside] = survey(n, edges);
  if (count === 0) continue;
  connected += 1;

  const kept = reverseDelete(n, edges);
  if (kept.reduce((sum, i) => sum + edges[i][2], 0) === best) deleteMin += 1;

  // Every way of splitting the nodes in two, with node 0 always on the left.
  for (let mask = 1; mask < 1 << (n - 1); mask += 1) {
    const side = new Array(n).fill(false);
    for (let v = 1; v < n; v += 1) if ((mask >> (v - 1)) & 1) side[v] = true;
    const crossing: number[] = [];
    edges.forEach(([u, v], i) => {
      if (side[u] !== side[v]) crossing.push(i);
    });
    if (crossing.length === 0) continue;
    cutsChecked += 1;
    const cheapest = Math.min(...crossing.map((i) => edges[i][2]));
    const winners = crossing.filter((i) => edges[i][2] === cheapest);
    if (winners.some((i) => inside[i] > 0)) cutHolds += 1;
    if (winners.length === 1) {
      cutUnique += 1;
      if (inside[winners[0]] === count) cutUniqueHolds += 1;
    }
  }

  for (const cycle of simpleCycles(n, edges)) {
    cyclesChecked += 1;
    const dearest = Math.max(...cycle.map((i) => edges[i][2]));
    const losers = cycle.filter((i) => edges[i][2] === dearest);
    if (losers.length === 1) {
      cycleUnique += 1;
      if (inside[losers[0]] === 0) cycleHolds += 1;
    }
  }
}

const row = (text: string, value: number): string => "  " + text.padEnd(42) + " " + String(value).padStart(6);

console.log();
console.log(\`over the \${connected} connected graphs among \${trials} random ones on 3 to 6 nodes:\`);
console.log(row("cuts examined", cutsChecked));
console.log(row("a cheapest crossing edge was in some", cutHolds));
console.log(row("cuts with one strictly cheapest edge", cutUnique));
console.log(row("that edge was in every minimum tree", cutUniqueHolds));
console.log();
console.log(row("cycles examined", cyclesChecked));
console.log(row("cycles with one strictly dearest edge", cycleUnique));
console.log(row("that edge was in no minimum tree", cycleHolds));
console.log();
console.log(row("reverse-delete hit the minimum", deleteMin));

console.log();
console.log("Both rules held everywhere they were checked, which is what makes the");
console.log("greedy step safe. Prim takes the cheapest edge crossing the cut between");
console.log("the tree it has grown and everything else. Kruskal takes the cheapest");
console.log("edge whose two ends are in different components, which is the cheapest");
console.log("edge crossing the cut between one of those components and the rest.");
console.log("Neither is guessing; both are applying the same theorem.");
console.log();
console.log('Note the word "strictly" in the counters. A cheapest crossing edge is');
console.log("always in some minimum tree, but only a uniquely cheapest one is in");
console.log("every minimum tree -- which is the same tie business as the previous");
console.log("example, seen from the other side.");
console.log();
console.log("And the cycle property is an algorithm too: delete the dearest edge you");
console.log("can spare, repeatedly, and stop when nothing more can go. It hit the");
console.log(\`minimum on all \${deleteMin} graphs. Nobody uses it -- checking connectivity after\`);
console.log("every candidate deletion is far more work than sorting once -- but it is");
console.log("the same theorem read backwards.");
`,
            },
            {
              lang: "java",
              code: `// Why greedy is allowed here, stated as two rules and checked against every tree.
//
// Greedy algorithms are usually wrong, and the Dijkstra lesson is about the one
// condition that makes one right. Minimum spanning trees have their own
// condition, and it comes in two halves:
//
//   the cut property   -- split the nodes into two sides any way at all. The
//                         cheapest edge crossing that split belongs in a
//                         minimum tree; if it is uniquely cheapest, in all of
//                         them.
//   the cycle property -- take any cycle. Its heaviest edge is in no minimum
//                         tree, if it is uniquely heaviest.
//
// Prim is the cut property applied to the split between "in my tree" and "not
// yet". Kruskal is it applied to the split its next edge would join. And the
// cycle property gives a third algorithm for free: start with everything and
// delete the most expensive edge you can spare.
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

public class Main {
    static final int INF = 1000000000;

    static class Sets {
        int[] parent;

        Sets(int n) {
            parent = new int[n];
            for (int i = 0; i < n; i++) parent[i] = i;
        }

        int find(int v) {
            while (parent[v] != v) {
                parent[v] = parent[parent[v]];
                v = parent[v];
            }
            return v;
        }

        boolean union(int a, int b) {
            int ra = find(a), rb = find(b);
            if (ra == rb) return false;
            parent[rb] = ra;
            return true;
        }
    }

    static boolean spans(int n, int[][] edges, List<Integer> chosen) {
        if (chosen.size() != n - 1) return false;
        Sets sets = new Sets(n);
        for (int i : chosen) if (!sets.union(edges[i][0], edges[i][1])) return false;
        return true;
    }

    static int best;
    static int count;
    static int[] inside;

    static void choose(int n, int[][] edges, List<Integer> pick, int start) {
        if (pick.size() == n - 1) {
            if (spans(n, edges, pick)) {
                int w = 0;
                for (int i : pick) w += edges[i][2];
                if (w < best) {
                    best = w;
                    count = 1;
                    inside = new int[edges.length];
                    for (int i : pick) inside[i] = 1;
                } else if (w == best) {
                    count++;
                    for (int i : pick) inside[i]++;
                }
            }
            return;
        }
        for (int i = start; i < edges.length; i++) {
            pick.add(i);
            choose(n, edges, pick, i + 1);
            pick.remove(pick.size() - 1);
        }
    }

    /**
     * Every spanning tree, by brute force.
     *
     * <p>Fills in the minimum total, how many trees hit it, and for each edge
     * how many of those trees contain it. Everything below is scored against
     * these.
     */
    static void survey(int n, int[][] edges) {
        best = INF;
        count = 0;
        inside = new int[edges.length];
        choose(n, edges, new ArrayList<>(), 0);
    }

    /** The cycle property as an algorithm: drop the dearest edge you can spare. */
    static List<Integer> reverseDelete(int n, int[][] edges) {
        List<Integer> order = new ArrayList<>();
        for (int i = 0; i < edges.length; i++) order.add(i);
        order.sort((i, j) -> {
            if (edges[i][2] != edges[j][2]) return Integer.compare(edges[j][2], edges[i][2]);
            if (edges[i][0] != edges[j][0]) return Integer.compare(edges[i][0], edges[j][0]);
            return Integer.compare(edges[i][1], edges[j][1]);
        });
        Set<Integer> kept = new TreeSet<>(order);
        for (int i : order) {
            kept.remove(i);
            Sets sets = new Sets(n);
            int joined = 0;
            for (int j : kept) if (sets.union(edges[j][0], edges[j][1])) joined++;
            if (joined != n - 1) kept.add(i);
        }
        return new ArrayList<>(kept);
    }

    static void cycleWalk(List<int[]>[] adj, List<Integer> path, boolean[] seen,
                          Set<String> found, int start, int at) {
        for (int[] step : adj[at]) {
            int nxt = step[0], i = step[1];
            if (path.contains(i)) continue;
            if (nxt == start) {
                if (path.size() >= 2) {
                    List<Integer> cycle = new ArrayList<>(path);
                    cycle.add(i);
                    Collections.sort(cycle);
                    StringBuilder key = new StringBuilder();
                    for (int k = 0; k < cycle.size(); k++) {
                        if (k > 0) key.append(",");
                        key.append(cycle.get(k));
                    }
                    found.add(key.toString());
                }
            } else if (!seen[nxt] && nxt > start) {
                seen[nxt] = true;
                path.add(i);
                cycleWalk(adj, path, seen, found, start, nxt);
                path.remove(path.size() - 1);
                seen[nxt] = false;
            }
        }
    }

    /** Every cycle in the graph, as a list of edge indices. Exponential, exact. */
    static List<List<Integer>> simpleCycles(int n, int[][] edges) {
        @SuppressWarnings("unchecked")
        List<int[]>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int i = 0; i < edges.length; i++) {
            adj[edges[i][0]].add(new int[] {edges[i][1], i});
            adj[edges[i][1]].add(new int[] {edges[i][0], i});
        }
        Set<String> found = new HashSet<>();
        for (int start = 0; start < n; start++) {
            boolean[] seen = new boolean[n];
            seen[start] = true;
            cycleWalk(adj, new ArrayList<>(), seen, found, start, start);
        }
        List<List<Integer>> out = new ArrayList<>();
        for (String key : found) {
            List<Integer> cycle = new ArrayList<>();
            for (String part : key.split(",")) cycle.add(Integer.parseInt(part));
            out.add(cycle);
        }
        return out;
    }

    static String show(int[][] edges, List<Integer> chosen) {
        StringBuilder sb = new StringBuilder();
        for (int k = 0; k < chosen.size(); k++) {
            if (k > 0) sb.append(" ");
            sb.append(edges[chosen.get(k)][0]).append("-").append(edges[chosen.get(k)][1]);
        }
        return sb.toString();
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
    static long seed = 161803L;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    static String row(String text, int value) {
        return String.format("  %-42s %6d", text, value);
    }

    public static void main(String[] args) {
        int[] caseN = {4, 4, 5};
        int[][][] caseEdges = {
            {{0, 1, 1}, {1, 2, 2}, {2, 3, 3}, {0, 3, 4}},
            {{0, 1, 3}, {1, 2, 1}, {2, 3, 3}, {0, 3, 1}, {0, 2, 2}},
            {{0, 1, 4}, {0, 2, 1}, {1, 2, 2}, {1, 3, 5}, {2, 3, 8}, {3, 4, 3}},
        };

        System.out.printf("%-46s %-18s %s%n", "edges", "reverse-delete", "cost / minimum");
        for (int c = 0; c < caseN.length; c++) {
            List<Integer> kept = reverseDelete(caseN[c], caseEdges[c]);
            survey(caseN[c], caseEdges[c]);
            int total = 0;
            for (int i : kept) total += caseEdges[c][i][2];
            System.out.printf("%-46s %-18s %d / %d%n", label(caseEdges[c]),
                show(caseEdges[c], kept), total, best);
        }

        int trials = 3000;
        int connected = 0;
        int cutsChecked = 0, cutHolds = 0, cutUnique = 0, cutUniqueHolds = 0;
        int cyclesChecked = 0, cycleUnique = 0, cycleHolds = 0;
        int deleteMin = 0;
        for (int t = 0; t < trials; t++) {
            int n = 3 + rand(4);
            List<int[]> built = new ArrayList<>();
            for (int u = 0; u < n; u++)
                for (int v = u + 1; v < n; v++)
                    if (rand(3) > 0) built.add(new int[] {u, v, 1 + rand(4)});
            int[][] edges = built.toArray(new int[0][]);
            survey(n, edges);
            if (count == 0) continue;
            int minTotal = best;
            int minCount = count;
            int[] minInside = inside;
            connected++;

            List<Integer> kept = reverseDelete(n, edges);
            int total = 0;
            for (int i : kept) total += edges[i][2];
            if (total == minTotal) deleteMin++;

            // Every way of splitting the nodes in two, with node 0 on the left.
            for (int mask = 1; mask < 1 << (n - 1); mask++) {
                boolean[] side = new boolean[n];
                for (int v = 1; v < n; v++) if ((mask >> (v - 1) & 1) == 1) side[v] = true;
                List<Integer> crossing = new ArrayList<>();
                for (int i = 0; i < edges.length; i++)
                    if (side[edges[i][0]] != side[edges[i][1]]) crossing.add(i);
                if (crossing.isEmpty()) continue;
                cutsChecked++;
                int cheapest = INF;
                for (int i : crossing) cheapest = Math.min(cheapest, edges[i][2]);
                List<Integer> winners = new ArrayList<>();
                for (int i : crossing) if (edges[i][2] == cheapest) winners.add(i);
                boolean any = false;
                for (int i : winners) if (minInside[i] > 0) any = true;
                if (any) cutHolds++;
                if (winners.size() == 1) {
                    cutUnique++;
                    if (minInside[winners.get(0)] == minCount) cutUniqueHolds++;
                }
            }

            for (List<Integer> cycle : simpleCycles(n, edges)) {
                cyclesChecked++;
                int dearest = -INF;
                for (int i : cycle) dearest = Math.max(dearest, edges[i][2]);
                List<Integer> losers = new ArrayList<>();
                for (int i : cycle) if (edges[i][2] == dearest) losers.add(i);
                if (losers.size() == 1) {
                    cycleUnique++;
                    if (minInside[losers.get(0)] == 0) cycleHolds++;
                }
            }
        }

        System.out.println();
        System.out.println("over the " + connected + " connected graphs among " + trials
            + " random ones on 3 to 6 nodes:");
        System.out.println(row("cuts examined", cutsChecked));
        System.out.println(row("a cheapest crossing edge was in some", cutHolds));
        System.out.println(row("cuts with one strictly cheapest edge", cutUnique));
        System.out.println(row("that edge was in every minimum tree", cutUniqueHolds));
        System.out.println();
        System.out.println(row("cycles examined", cyclesChecked));
        System.out.println(row("cycles with one strictly dearest edge", cycleUnique));
        System.out.println(row("that edge was in no minimum tree", cycleHolds));
        System.out.println();
        System.out.println(row("reverse-delete hit the minimum", deleteMin));

        System.out.println();
        System.out.println("Both rules held everywhere they were checked, which is what makes the");
        System.out.println("greedy step safe. Prim takes the cheapest edge crossing the cut between");
        System.out.println("the tree it has grown and everything else. Kruskal takes the cheapest");
        System.out.println("edge whose two ends are in different components, which is the cheapest");
        System.out.println("edge crossing the cut between one of those components and the rest.");
        System.out.println("Neither is guessing; both are applying the same theorem.");
        System.out.println();
        System.out.println("Note the word \\"strictly\\" in the counters. A cheapest crossing edge is");
        System.out.println("always in some minimum tree, but only a uniquely cheapest one is in");
        System.out.println("every minimum tree -- which is the same tie business as the previous");
        System.out.println("example, seen from the other side.");
        System.out.println();
        System.out.println("And the cycle property is an algorithm too: delete the dearest edge you");
        System.out.println("can spare, repeatedly, and stop when nothing more can go. It hit the");
        System.out.println("minimum on all " + deleteMin
            + " graphs. Nobody uses it -- checking connectivity after");
        System.out.println("every candidate deletion is far more work than sorting once -- but it is");
        System.out.println("the same theorem read backwards.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Why greedy is allowed here, stated as two rules and checked against every tree.
//
// Greedy algorithms are usually wrong, and the Dijkstra lesson is about the one
// condition that makes one right. Minimum spanning trees have their own
// condition, and it comes in two halves:
//
//   the cut property   -- split the nodes into two sides any way at all. The
//                         cheapest edge crossing that split belongs in a
//                         minimum tree; if it is uniquely cheapest, in all of
//                         them.
//   the cycle property -- take any cycle. Its heaviest edge is in no minimum
//                         tree, if it is uniquely heaviest.
//
// Prim is the cut property applied to the split between "in my tree" and "not
// yet". Kruskal is it applied to the split its next edge would join. And the
// cycle property gives a third algorithm for free: start with everything and
// delete the most expensive edge you can spare.
#include <algorithm>
#include <array>
#include <iomanip>
#include <iostream>
#include <set>
#include <string>
#include <vector>

const int INF = 1000000000;

using Edge = std::array<int, 3>;
using Chosen = std::vector<int>;

struct Sets {
    std::vector<int> parent;

    explicit Sets(int n) {
        parent.resize(n);
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    int find(int v) {
        while (parent[v] != v) {
            parent[v] = parent[parent[v]];
            v = parent[v];
        }
        return v;
    }

    bool unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        parent[rb] = ra;
        return true;
    }
};

bool spans(int n, const std::vector<Edge>& edges, const Chosen& chosen) {
    if (static_cast<int>(chosen.size()) != n - 1) return false;
    Sets sets(n);
    for (int i : chosen)
        if (!sets.unite(edges[i][0], edges[i][1])) return false;
    return true;
}

void choose(int n, const std::vector<Edge>& edges, Chosen& pick, int start, int& best,
            int& count, std::vector<int>& inside) {
    if (static_cast<int>(pick.size()) == n - 1) {
        if (spans(n, edges, pick)) {
            int w = 0;
            for (int i : pick) w += edges[i][2];
            if (w < best) {
                best = w;
                count = 1;
                inside.assign(edges.size(), 0);
                for (int i : pick) inside[i] = 1;
            } else if (w == best) {
                count++;
                for (int i : pick) inside[i]++;
            }
        }
        return;
    }
    for (size_t i = start; i < edges.size(); i++) {
        pick.push_back(static_cast<int>(i));
        choose(n, edges, pick, static_cast<int>(i) + 1, best, count, inside);
        pick.pop_back();
    }
}

// Every spanning tree, by brute force.
//
// Returns the minimum total, how many trees hit it, and for each edge how
// many of those trees contain it. Everything below is scored against these.
void survey(int n, const std::vector<Edge>& edges, int& best, int& count,
            std::vector<int>& inside) {
    best = INF;
    count = 0;
    inside.assign(edges.size(), 0);
    Chosen pick;
    choose(n, edges, pick, 0, best, count, inside);
}

// The cycle property as an algorithm: drop the dearest edge you can spare.
Chosen reverse_delete(int n, const std::vector<Edge>& edges) {
    Chosen order(edges.size());
    for (size_t i = 0; i < order.size(); i++) order[i] = static_cast<int>(i);
    std::sort(order.begin(), order.end(), [&](int i, int j) {
        if (edges[i][2] != edges[j][2]) return edges[i][2] > edges[j][2];
        if (edges[i][0] != edges[j][0]) return edges[i][0] < edges[j][0];
        return edges[i][1] < edges[j][1];
    });
    std::set<int> kept(order.begin(), order.end());
    for (int i : order) {
        kept.erase(i);
        Sets sets(n);
        int joined = 0;
        for (int j : kept)
            if (sets.unite(edges[j][0], edges[j][1])) joined++;
        if (joined != n - 1) kept.insert(i);
    }
    return Chosen(kept.begin(), kept.end());
}

void cycle_walk(const std::vector<std::vector<std::pair<int, int>>>& adj, Chosen& path,
                std::vector<bool>& seen, std::set<Chosen>& found, int start, int at) {
    for (const auto& step : adj[at]) {
        int nxt = step.first, i = step.second;
        if (std::find(path.begin(), path.end(), i) != path.end()) continue;
        if (nxt == start) {
            if (path.size() >= 2) {
                Chosen cycle = path;
                cycle.push_back(i);
                std::sort(cycle.begin(), cycle.end());
                found.insert(cycle);
            }
        } else if (!seen[nxt] && nxt > start) {
            seen[nxt] = true;
            path.push_back(i);
            cycle_walk(adj, path, seen, found, start, nxt);
            path.pop_back();
            seen[nxt] = false;
        }
    }
}

// Every cycle in the graph, as a list of edge indices. Exponential, exact.
std::vector<Chosen> simple_cycles(int n, const std::vector<Edge>& edges) {
    std::vector<std::vector<std::pair<int, int>>> adj(n);
    for (size_t i = 0; i < edges.size(); i++) {
        adj[edges[i][0]].push_back({edges[i][1], static_cast<int>(i)});
        adj[edges[i][1]].push_back({edges[i][0], static_cast<int>(i)});
    }
    std::set<Chosen> found;
    for (int start = 0; start < n; start++) {
        std::vector<bool> seen(n, false);
        seen[start] = true;
        Chosen path;
        cycle_walk(adj, path, seen, found, start, start);
    }
    return std::vector<Chosen>(found.begin(), found.end());
}

std::string show(const std::vector<Edge>& edges, const Chosen& chosen) {
    std::string s;
    for (size_t k = 0; k < chosen.size(); k++) {
        if (k > 0) s += " ";
        s += std::to_string(edges[chosen[k]][0]) + "-" + std::to_string(edges[chosen[k]][1]);
    }
    return s;
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
long long seed = 161803;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

void row(const std::string& text, int value) {
    std::cout << "  " << std::left << std::setw(42) << text << " " << std::right
              << std::setw(6) << value << "\\n";
}

int main() {
    std::vector<int> case_n = {4, 4, 5};
    std::vector<std::vector<Edge>> cases = {
        {{0, 1, 1}, {1, 2, 2}, {2, 3, 3}, {0, 3, 4}},
        {{0, 1, 3}, {1, 2, 1}, {2, 3, 3}, {0, 3, 1}, {0, 2, 2}},
        {{0, 1, 4}, {0, 2, 1}, {1, 2, 2}, {1, 3, 5}, {2, 3, 8}, {3, 4, 3}},
    };

    std::cout << std::left << std::setw(46) << "edges" << " " << std::setw(18)
              << "reverse-delete" << " " << "cost / minimum" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        Chosen kept = reverse_delete(case_n[c], cases[c]);
        int best = 0, count = 0;
        std::vector<int> inside;
        survey(case_n[c], cases[c], best, count, inside);
        int total = 0;
        for (int i : kept) total += cases[c][i][2];
        std::cout << std::left << std::setw(46) << label(cases[c]) << " " << std::setw(18)
                  << show(cases[c], kept) << " " << total << " / " << best << "\\n";
    }

    int trials = 3000;
    int connected = 0;
    int cuts_checked = 0, cut_holds = 0, cut_unique = 0, cut_unique_holds = 0;
    int cycles_checked = 0, cycle_unique = 0, cycle_holds = 0;
    int delete_min = 0;
    for (int t = 0; t < trials; t++) {
        int n = 3 + rand_below(4);
        std::vector<Edge> edges;
        for (int u = 0; u < n; u++)
            for (int v = u + 1; v < n; v++)
                if (rand_below(3) > 0) edges.push_back({u, v, 1 + rand_below(4)});
        int best = 0, count = 0;
        std::vector<int> inside;
        survey(n, edges, best, count, inside);
        if (count == 0) continue;
        connected++;

        Chosen kept = reverse_delete(n, edges);
        int total = 0;
        for (int i : kept) total += edges[i][2];
        if (total == best) delete_min++;

        // Every way of splitting the nodes in two, with node 0 on the left.
        for (int mask = 1; mask < 1 << (n - 1); mask++) {
            std::vector<bool> side(n, false);
            for (int v = 1; v < n; v++)
                if (mask >> (v - 1) & 1) side[v] = true;
            Chosen crossing;
            for (size_t i = 0; i < edges.size(); i++)
                if (side[edges[i][0]] != side[edges[i][1]])
                    crossing.push_back(static_cast<int>(i));
            if (crossing.empty()) continue;
            cuts_checked++;
            int cheapest = INF;
            for (int i : crossing) cheapest = std::min(cheapest, edges[i][2]);
            Chosen winners;
            for (int i : crossing)
                if (edges[i][2] == cheapest) winners.push_back(i);
            bool any = false;
            for (int i : winners)
                if (inside[i] > 0) any = true;
            if (any) cut_holds++;
            if (winners.size() == 1) {
                cut_unique++;
                if (inside[winners[0]] == count) cut_unique_holds++;
            }
        }

        for (const Chosen& cycle : simple_cycles(n, edges)) {
            cycles_checked++;
            int dearest = -INF;
            for (int i : cycle) dearest = std::max(dearest, edges[i][2]);
            Chosen losers;
            for (int i : cycle)
                if (edges[i][2] == dearest) losers.push_back(i);
            if (losers.size() == 1) {
                cycle_unique++;
                if (inside[losers[0]] == 0) cycle_holds++;
            }
        }
    }

    std::cout << "\\n";
    std::cout << "over the " << connected << " connected graphs among " << trials
              << " random ones on 3 to 6 nodes:\\n";
    row("cuts examined", cuts_checked);
    row("a cheapest crossing edge was in some", cut_holds);
    row("cuts with one strictly cheapest edge", cut_unique);
    row("that edge was in every minimum tree", cut_unique_holds);
    std::cout << "\\n";
    row("cycles examined", cycles_checked);
    row("cycles with one strictly dearest edge", cycle_unique);
    row("that edge was in no minimum tree", cycle_holds);
    std::cout << "\\n";
    row("reverse-delete hit the minimum", delete_min);

    std::cout << "\\n";
    std::cout << "Both rules held everywhere they were checked, which is what makes the\\n";
    std::cout << "greedy step safe. Prim takes the cheapest edge crossing the cut between\\n";
    std::cout << "the tree it has grown and everything else. Kruskal takes the cheapest\\n";
    std::cout << "edge whose two ends are in different components, which is the cheapest\\n";
    std::cout << "edge crossing the cut between one of those components and the rest.\\n";
    std::cout << "Neither is guessing; both are applying the same theorem.\\n";
    std::cout << "\\n";
    std::cout << "Note the word \\"strictly\\" in the counters. A cheapest crossing edge is\\n";
    std::cout << "always in some minimum tree, but only a uniquely cheapest one is in\\n";
    std::cout << "every minimum tree -- which is the same tie business as the previous\\n";
    std::cout << "example, seen from the other side.\\n";
    std::cout << "\\n";
    std::cout << "And the cycle property is an algorithm too: delete the dearest edge you\\n";
    std::cout << "can spare, repeatedly, and stop when nothing more can go. It hit the\\n";
    std::cout << "minimum on all " << delete_min
              << " graphs. Nobody uses it -- checking connectivity after\\n";
    std::cout << "every candidate deletion is far more work than sorting once -- but it is\\n";
    std::cout << "the same theorem read backwards.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Why greedy is allowed here, stated as two rules and checked against every tree.
//
// Greedy algorithms are usually wrong, and the Dijkstra lesson is about the one
// condition that makes one right. Minimum spanning trees have their own
// condition, and it comes in two halves:
//
//   the cut property   -- split the nodes into two sides any way at all. The
//                         cheapest edge crossing that split belongs in a
//                         minimum tree; if it is uniquely cheapest, in all of
//                         them.
//   the cycle property -- take any cycle. Its heaviest edge is in no minimum
//                         tree, if it is uniquely heaviest.
//
// Prim is the cut property applied to the split between "in my tree" and "not
// yet". Kruskal is it applied to the split its next edge would join. And the
// cycle property gives a third algorithm for free: start with everything and
// delete the most expensive edge you can spare.
use std::collections::BTreeSet;

const INF: i64 = 1_000_000_000;

type Edge = (usize, usize, i64);

struct Sets {
    parent: Vec<usize>,
}

impl Sets {
    fn new(n: usize) -> Sets {
        Sets {
            parent: (0..n).collect(),
        }
    }

    fn find(&mut self, mut v: usize) -> usize {
        while self.parent[v] != v {
            self.parent[v] = self.parent[self.parent[v]];
            v = self.parent[v];
        }
        v
    }

    fn unite(&mut self, a: usize, b: usize) -> bool {
        let ra = self.find(a);
        let rb = self.find(b);
        if ra == rb {
            return false;
        }
        self.parent[rb] = ra;
        true
    }
}

fn spans(n: usize, edges: &[Edge], chosen: &[usize]) -> bool {
    if chosen.len() != n - 1 {
        return false;
    }
    let mut sets = Sets::new(n);
    for &i in chosen {
        if !sets.unite(edges[i].0, edges[i].1) {
            return false;
        }
    }
    true
}

fn choose(
    n: usize,
    edges: &[Edge],
    pick: &mut Vec<usize>,
    start: usize,
    best: &mut i64,
    count: &mut u64,
    inside: &mut Vec<u64>,
) {
    if pick.len() == n - 1 {
        if spans(n, edges, pick) {
            let w: i64 = pick.iter().map(|&i| edges[i].2).sum();
            if w < *best {
                *best = w;
                *count = 1;
                inside.iter_mut().for_each(|x| *x = 0);
                for &i in pick.iter() {
                    inside[i] = 1;
                }
            } else if w == *best {
                *count += 1;
                for &i in pick.iter() {
                    inside[i] += 1;
                }
            }
        }
        return;
    }
    for i in start..edges.len() {
        pick.push(i);
        choose(n, edges, pick, i + 1, best, count, inside);
        pick.pop();
    }
}

/// Every spanning tree, by brute force.
///
/// Returns the minimum total, how many trees hit it, and for each edge how
/// many of those trees contain it. Everything below is scored against these.
fn survey(n: usize, edges: &[Edge]) -> (i64, u64, Vec<u64>) {
    let mut best = INF;
    let mut count = 0;
    let mut inside = vec![0u64; edges.len()];
    let mut pick: Vec<usize> = Vec::new();
    choose(n, edges, &mut pick, 0, &mut best, &mut count, &mut inside);
    (best, count, inside)
}

/// The cycle property as an algorithm: drop the dearest edge you can spare.
fn reverse_delete(n: usize, edges: &[Edge]) -> Vec<usize> {
    let mut order: Vec<usize> = (0..edges.len()).collect();
    order.sort_by(|&i, &j| {
        (-edges[i].2, edges[i].0, edges[i].1).cmp(&(-edges[j].2, edges[j].0, edges[j].1))
    });
    let mut kept: BTreeSet<usize> = order.iter().copied().collect();
    for &i in &order {
        kept.remove(&i);
        let mut sets = Sets::new(n);
        let mut joined = 0;
        for &j in &kept {
            if sets.unite(edges[j].0, edges[j].1) {
                joined += 1;
            }
        }
        if joined != n - 1 {
            kept.insert(i);
        }
    }
    kept.into_iter().collect()
}

fn cycle_walk(
    adj: &[Vec<(usize, usize)>],
    path: &mut Vec<usize>,
    seen: &mut [bool],
    found: &mut BTreeSet<Vec<usize>>,
    start: usize,
    at: usize,
) {
    for idx in 0..adj[at].len() {
        let (nxt, i) = adj[at][idx];
        if path.contains(&i) {
            continue;
        }
        if nxt == start {
            if path.len() >= 2 {
                let mut cycle = path.clone();
                cycle.push(i);
                cycle.sort();
                found.insert(cycle);
            }
        } else if !seen[nxt] && nxt > start {
            seen[nxt] = true;
            path.push(i);
            cycle_walk(adj, path, seen, found, start, nxt);
            path.pop();
            seen[nxt] = false;
        }
    }
}

/// Every cycle in the graph, as a list of edge indices. Exponential, exact.
fn simple_cycles(n: usize, edges: &[Edge]) -> Vec<Vec<usize>> {
    let mut adj: Vec<Vec<(usize, usize)>> = vec![Vec::new(); n];
    for (i, &(u, v, _)) in edges.iter().enumerate() {
        adj[u].push((v, i));
        adj[v].push((u, i));
    }
    let mut found: BTreeSet<Vec<usize>> = BTreeSet::new();
    for start in 0..n {
        let mut seen = vec![false; n];
        seen[start] = true;
        let mut path: Vec<usize> = Vec::new();
        cycle_walk(&adj, &mut path, &mut seen, &mut found, start, start);
    }
    found.into_iter().collect()
}

fn show(edges: &[Edge], chosen: &[usize]) -> String {
    chosen
        .iter()
        .map(|&i| format!("{}-{}", edges[i].0, edges[i].1))
        .collect::<Vec<String>>()
        .join(" ")
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

fn row(text: &str, value: u64) {
    println!("  {:<42} {:>6}", text, value);
}

fn main() {
    let case_n = [4usize, 4, 5];
    let cases: Vec<Vec<Edge>> = vec![
        vec![(0, 1, 1), (1, 2, 2), (2, 3, 3), (0, 3, 4)],
        vec![(0, 1, 3), (1, 2, 1), (2, 3, 3), (0, 3, 1), (0, 2, 2)],
        vec![(0, 1, 4), (0, 2, 1), (1, 2, 2), (1, 3, 5), (2, 3, 8), (3, 4, 3)],
    ];

    println!("{:<46} {:<18} {}", "edges", "reverse-delete", "cost / minimum");
    for c in 0..cases.len() {
        let kept = reverse_delete(case_n[c], &cases[c]);
        let (best, _, _) = survey(case_n[c], &cases[c]);
        let total: i64 = kept.iter().map(|&i| cases[c][i].2).sum();
        println!(
            "{:<46} {:<18} {} / {}",
            label(&cases[c]),
            show(&cases[c], &kept),
            total,
            best
        );
    }

    let mut rng = Rng { seed: 161803 };
    let trials = 3000;
    let mut connected = 0u64;
    let (mut cuts_checked, mut cut_holds) = (0u64, 0u64);
    let (mut cut_unique, mut cut_unique_holds) = (0u64, 0u64);
    let (mut cycles_checked, mut cycle_unique, mut cycle_holds) = (0u64, 0u64, 0u64);
    let mut delete_min = 0u64;
    for _ in 0..trials {
        let n = 3 + rng.next(4) as usize;
        let mut edges: Vec<Edge> = Vec::new();
        for u in 0..n {
            for v in (u + 1)..n {
                if rng.next(3) > 0 {
                    edges.push((u, v, 1 + rng.next(4)));
                }
            }
        }
        let (best, count, inside) = survey(n, &edges);
        if count == 0 {
            continue;
        }
        connected += 1;

        let kept = reverse_delete(n, &edges);
        let total: i64 = kept.iter().map(|&i| edges[i].2).sum();
        if total == best {
            delete_min += 1;
        }

        // Every way of splitting the nodes in two, with node 0 on the left.
        for mask in 1..(1u32 << (n - 1)) {
            let mut side = vec![false; n];
            for v in 1..n {
                if mask >> (v - 1) & 1 == 1 {
                    side[v] = true;
                }
            }
            let crossing: Vec<usize> = (0..edges.len())
                .filter(|&i| side[edges[i].0] != side[edges[i].1])
                .collect();
            if crossing.is_empty() {
                continue;
            }
            cuts_checked += 1;
            let cheapest = crossing.iter().map(|&i| edges[i].2).min().unwrap();
            let winners: Vec<usize> = crossing
                .iter()
                .copied()
                .filter(|&i| edges[i].2 == cheapest)
                .collect();
            if winners.iter().any(|&i| inside[i] > 0) {
                cut_holds += 1;
            }
            if winners.len() == 1 {
                cut_unique += 1;
                if inside[winners[0]] == count {
                    cut_unique_holds += 1;
                }
            }
        }

        for cycle in simple_cycles(n, &edges) {
            cycles_checked += 1;
            let dearest = cycle.iter().map(|&i| edges[i].2).max().unwrap();
            let losers: Vec<usize> = cycle
                .iter()
                .copied()
                .filter(|&i| edges[i].2 == dearest)
                .collect();
            if losers.len() == 1 {
                cycle_unique += 1;
                if inside[losers[0]] == 0 {
                    cycle_holds += 1;
                }
            }
        }
    }

    println!();
    println!(
        "over the {} connected graphs among {} random ones on 3 to 6 nodes:",
        connected, trials
    );
    row("cuts examined", cuts_checked);
    row("a cheapest crossing edge was in some", cut_holds);
    row("cuts with one strictly cheapest edge", cut_unique);
    row("that edge was in every minimum tree", cut_unique_holds);
    println!();
    row("cycles examined", cycles_checked);
    row("cycles with one strictly dearest edge", cycle_unique);
    row("that edge was in no minimum tree", cycle_holds);
    println!();
    row("reverse-delete hit the minimum", delete_min);

    println!();
    println!("Both rules held everywhere they were checked, which is what makes the");
    println!("greedy step safe. Prim takes the cheapest edge crossing the cut between");
    println!("the tree it has grown and everything else. Kruskal takes the cheapest");
    println!("edge whose two ends are in different components, which is the cheapest");
    println!("edge crossing the cut between one of those components and the rest.");
    println!("Neither is guessing; both are applying the same theorem.");
    println!();
    println!("Note the word \\"strictly\\" in the counters. A cheapest crossing edge is");
    println!("always in some minimum tree, but only a uniquely cheapest one is in");
    println!("every minimum tree -- which is the same tie business as the previous");
    println!("example, seen from the other side.");
    println!();
    println!("And the cycle property is an algorithm too: delete the dearest edge you");
    println!("can spare, repeatedly, and stop when nothing more can go. It hit the");
    println!(
        "minimum on all {} graphs. Nobody uses it -- checking connectivity after",
        delete_min
    );
    println!("every candidate deletion is far more work than sorting once -- but it is");
    println!("the same theorem read backwards.");
}
`,
            },
            {
              lang: "go",
              code: `// Why greedy is allowed here, stated as two rules and checked against every tree.
//
// Greedy algorithms are usually wrong, and the Dijkstra lesson is about the one
// condition that makes one right. Minimum spanning trees have their own
// condition, and it comes in two halves:
//
//	the cut property   -- split the nodes into two sides any way at all. The
//	                      cheapest edge crossing that split belongs in a
//	                      minimum tree; if it is uniquely cheapest, in all of
//	                      them.
//	the cycle property -- take any cycle. Its heaviest edge is in no minimum
//	                      tree, if it is uniquely heaviest.
//
// Prim is the cut property applied to the split between "in my tree" and "not
// yet". Kruskal is it applied to the split its next edge would join. And the
// cycle property gives a third algorithm for free: start with everything and
// delete the most expensive edge you can spare.
package main

import (
	"fmt"
	"sort"
	"strconv"
	"strings"
)

const INF = 1000000000

// Edge is an undirected edge with a weight.
type Edge struct {
	U, V, W int
}

// Sets is the plain union-find the brute force needs.
type Sets struct {
	parent []int
}

func newSets(n int) *Sets {
	s := &Sets{parent: make([]int, n)}
	for i := range s.parent {
		s.parent[i] = i
	}
	return s
}

func (s *Sets) find(v int) int {
	for s.parent[v] != v {
		s.parent[v] = s.parent[s.parent[v]]
		v = s.parent[v]
	}
	return v
}

func (s *Sets) unite(a, b int) bool {
	ra, rb := s.find(a), s.find(b)
	if ra == rb {
		return false
	}
	s.parent[rb] = ra
	return true
}

func spans(n int, edges []Edge, chosen []int) bool {
	if len(chosen) != n-1 {
		return false
	}
	sets := newSets(n)
	for _, i := range chosen {
		if !sets.unite(edges[i].U, edges[i].V) {
			return false
		}
	}
	return true
}

func choose(n int, edges []Edge, pick []int, start int, best, count *int, inside []int) []int {
	if len(pick) == n-1 {
		if spans(n, edges, pick) {
			w := 0
			for _, i := range pick {
				w += edges[i].W
			}
			if w < *best {
				*best = w
				*count = 1
				for i := range inside {
					inside[i] = 0
				}
				for _, i := range pick {
					inside[i] = 1
				}
			} else if w == *best {
				*count++
				for _, i := range pick {
					inside[i]++
				}
			}
		}
		return pick
	}
	for i := start; i < len(edges); i++ {
		pick = append(pick, i)
		pick = choose(n, edges, pick, i+1, best, count, inside)
		pick = pick[:len(pick)-1]
	}
	return pick
}

// survey enumerates every spanning tree by brute force.
//
// It returns the minimum total, how many trees hit it, and for each edge how
// many of those trees contain it. Everything below is scored against these.
func survey(n int, edges []Edge) (int, int, []int) {
	best, count := INF, 0
	inside := make([]int, len(edges))
	choose(n, edges, nil, 0, &best, &count, inside)
	return best, count, inside
}

// reverseDelete is the cycle property as an algorithm: drop the dearest edge
// you can spare.
func reverseDelete(n int, edges []Edge) []int {
	order := make([]int, len(edges))
	for i := range order {
		order[i] = i
	}
	sort.Slice(order, func(a, b int) bool {
		i, j := order[a], order[b]
		if edges[i].W != edges[j].W {
			return edges[i].W > edges[j].W
		}
		if edges[i].U != edges[j].U {
			return edges[i].U < edges[j].U
		}
		return edges[i].V < edges[j].V
	})
	kept := map[int]bool{}
	for _, i := range order {
		kept[i] = true
	}
	for _, i := range order {
		delete(kept, i)
		sets := newSets(n)
		joined := 0
		for j := range kept {
			if sets.unite(edges[j].U, edges[j].V) {
				joined++
			}
		}
		if joined != n-1 {
			kept[i] = true
		}
	}
	out := make([]int, 0, len(kept))
	for i := range kept {
		out = append(out, i)
	}
	sort.Ints(out)
	return out
}

func contains(xs []int, x int) bool {
	for _, v := range xs {
		if v == x {
			return true
		}
	}
	return false
}

func cycleWalk(adj [][][2]int, path *[]int, seen []bool, found map[string]bool, start, at int) {
	for _, step := range adj[at] {
		nxt, i := step[0], step[1]
		if contains(*path, i) {
			continue
		}
		if nxt == start {
			if len(*path) >= 2 {
				cycle := append(append([]int{}, *path...), i)
				sort.Ints(cycle)
				cells := make([]string, len(cycle))
				for k, v := range cycle {
					cells[k] = strconv.Itoa(v)
				}
				found[strings.Join(cells, ",")] = true
			}
		} else if !seen[nxt] && nxt > start {
			seen[nxt] = true
			*path = append(*path, i)
			cycleWalk(adj, path, seen, found, start, nxt)
			*path = (*path)[:len(*path)-1]
			seen[nxt] = false
		}
	}
}

// simpleCycles lists every cycle as edge indices. Exponential, exact.
func simpleCycles(n int, edges []Edge) [][]int {
	adj := make([][][2]int, n)
	for i, e := range edges {
		adj[e.U] = append(adj[e.U], [2]int{e.V, i})
		adj[e.V] = append(adj[e.V], [2]int{e.U, i})
	}
	found := map[string]bool{}
	for start := 0; start < n; start++ {
		seen := make([]bool, n)
		seen[start] = true
		var path []int
		cycleWalk(adj, &path, seen, found, start, start)
	}
	var out [][]int
	for key := range found {
		var cycle []int
		for _, part := range strings.Split(key, ",") {
			v, _ := strconv.Atoi(part)
			cycle = append(cycle, v)
		}
		out = append(out, cycle)
	}
	return out
}

func show(edges []Edge, chosen []int) string {
	cells := make([]string, len(chosen))
	for k, i := range chosen {
		cells[k] = fmt.Sprintf("%d-%d", edges[i].U, edges[i].V)
	}
	return strings.Join(cells, " ")
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
var seed int64 = 161803

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func row(text string, value int) {
	fmt.Printf("  %-42s %6d\\n", text, value)
}

func main() {
	caseN := []int{4, 4, 5}
	cases := [][]Edge{
		{{0, 1, 1}, {1, 2, 2}, {2, 3, 3}, {0, 3, 4}},
		{{0, 1, 3}, {1, 2, 1}, {2, 3, 3}, {0, 3, 1}, {0, 2, 2}},
		{{0, 1, 4}, {0, 2, 1}, {1, 2, 2}, {1, 3, 5}, {2, 3, 8}, {3, 4, 3}},
	}

	fmt.Printf("%-46s %-18s %s\\n", "edges", "reverse-delete", "cost / minimum")
	for c := range cases {
		kept := reverseDelete(caseN[c], cases[c])
		best, _, _ := survey(caseN[c], cases[c])
		total := 0
		for _, i := range kept {
			total += cases[c][i].W
		}
		fmt.Printf("%-46s %-18s %d / %d\\n", label(cases[c]), show(cases[c], kept), total, best)
	}

	trials := 3000
	connected := 0
	cutsChecked, cutHolds, cutUnique, cutUniqueHolds := 0, 0, 0, 0
	cyclesChecked, cycleUnique, cycleHolds := 0, 0, 0
	deleteMin := 0
	for t := 0; t < trials; t++ {
		n := 3 + randBelow(4)
		var edges []Edge
		for u := 0; u < n; u++ {
			for v := u + 1; v < n; v++ {
				if randBelow(3) > 0 {
					edges = append(edges, Edge{u, v, 1 + randBelow(4)})
				}
			}
		}
		best, count, inside := survey(n, edges)
		if count == 0 {
			continue
		}
		connected++

		kept := reverseDelete(n, edges)
		total := 0
		for _, i := range kept {
			total += edges[i].W
		}
		if total == best {
			deleteMin++
		}

		// Every way of splitting the nodes in two, with node 0 on the left.
		for mask := 1; mask < 1<<(n-1); mask++ {
			side := make([]bool, n)
			for v := 1; v < n; v++ {
				if mask>>(v-1)&1 == 1 {
					side[v] = true
				}
			}
			var crossing []int
			for i, e := range edges {
				if side[e.U] != side[e.V] {
					crossing = append(crossing, i)
				}
			}
			if len(crossing) == 0 {
				continue
			}
			cutsChecked++
			cheapest := INF
			for _, i := range crossing {
				if edges[i].W < cheapest {
					cheapest = edges[i].W
				}
			}
			var winners []int
			for _, i := range crossing {
				if edges[i].W == cheapest {
					winners = append(winners, i)
				}
			}
			any := false
			for _, i := range winners {
				if inside[i] > 0 {
					any = true
				}
			}
			if any {
				cutHolds++
			}
			if len(winners) == 1 {
				cutUnique++
				if inside[winners[0]] == count {
					cutUniqueHolds++
				}
			}
		}

		for _, cycle := range simpleCycles(n, edges) {
			cyclesChecked++
			dearest := -INF
			for _, i := range cycle {
				if edges[i].W > dearest {
					dearest = edges[i].W
				}
			}
			var losers []int
			for _, i := range cycle {
				if edges[i].W == dearest {
					losers = append(losers, i)
				}
			}
			if len(losers) == 1 {
				cycleUnique++
				if inside[losers[0]] == 0 {
					cycleHolds++
				}
			}
		}
	}

	fmt.Println()
	fmt.Printf("over the %d connected graphs among %d random ones on 3 to 6 nodes:\\n", connected, trials)
	row("cuts examined", cutsChecked)
	row("a cheapest crossing edge was in some", cutHolds)
	row("cuts with one strictly cheapest edge", cutUnique)
	row("that edge was in every minimum tree", cutUniqueHolds)
	fmt.Println()
	row("cycles examined", cyclesChecked)
	row("cycles with one strictly dearest edge", cycleUnique)
	row("that edge was in no minimum tree", cycleHolds)
	fmt.Println()
	row("reverse-delete hit the minimum", deleteMin)

	fmt.Println()
	fmt.Println("Both rules held everywhere they were checked, which is what makes the")
	fmt.Println("greedy step safe. Prim takes the cheapest edge crossing the cut between")
	fmt.Println("the tree it has grown and everything else. Kruskal takes the cheapest")
	fmt.Println("edge whose two ends are in different components, which is the cheapest")
	fmt.Println("edge crossing the cut between one of those components and the rest.")
	fmt.Println("Neither is guessing; both are applying the same theorem.")
	fmt.Println()
	fmt.Println("Note the word \\"strictly\\" in the counters. A cheapest crossing edge is")
	fmt.Println("always in some minimum tree, but only a uniquely cheapest one is in")
	fmt.Println("every minimum tree -- which is the same tie business as the previous")
	fmt.Println("example, seen from the other side.")
	fmt.Println()
	fmt.Println("And the cycle property is an algorithm too: delete the dearest edge you")
	fmt.Println("can spare, repeatedly, and stop when nothing more can go. It hit the")
	fmt.Printf("minimum on all %d graphs. Nobody uses it -- checking connectivity after\\n", deleteMin)
	fmt.Println("every candidate deletion is far more work than sorting once -- but it is")
	fmt.Println("the same theorem read backwards.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Reading the cut property as \"the cheapest crossing edge is in the minimum tree\"",
          body: "In *a* minimum tree. Only a strictly cheapest crossing edge is in all of them. The measurement separates the two: 38,325 cuts where some cheapest crossing edge was in some minimum tree, and 21,657 of those where it was strictly cheapest and therefore in every one.",
        },
        {
          title: "Applying either property to a directed graph",
          body: "Both rules are about undirected cuts and undirected cycles. The directed problem -- a minimum spanning arborescence, every node reachable from a root -- is Edmonds' algorithm and looks nothing like these two.",
        },
        {
          title: "Reaching for reverse-delete because it is simpler to state",
          body: "It is correct -- it hit the minimum on all 2,619 graphs -- and it re-checks connectivity after every candidate deletion, which is far more work than one sort. The cycle property is worth knowing as a theorem, not as an implementation.",
        },
      ],
    },
    {
      id: "not-a-shortest-path-tree",
      heading: "Not a shortest-path tree",
      body: [
        "The tree is minimum in total, and that gets read as more than it says. The most common misreading is that walking the tree from `a` to `b` gives the shortest route from `a` to `b`.",
        "It does not. Over 46,650 ordered pairs, the tree route was also the shortest route 36,256 times and longer 10,394 times \u2014 never shorter, which it could not be, since a tree route is a route. Only 967 of 2,624 graphs had a tree whose routes were all shortest.",
        "There is no reason it should be a shortest-path tree: it minimises the sum over the whole graph, not any one route.",
        "What it does give, exactly and every time, is the **bottleneck** route. Of all the ways from `a` to `b`, the tree's is the one whose worst edge is as small as possible \u2014 on all 46,650 pairs, with no exceptions. So one tree answers, for every pair at once, the question \"how small can the worst edge on a route be\" — the least steep climb, the lightest maximum load. The mirror image, the route whose narrowest edge is as wide as possible, comes from a *maximum* spanning tree: over 27,898 pairs the minimum tree gave the smallest worst edge every time and the widest narrowest edge only 4,450 times, where the maximum tree gave it on all of them.",
        "That is the widest-path idea from the Floyd-Warshall lesson turned upside down — minimise the maximum rather than maximise the minimum — and it falls out of a structure built for a completely different reason. One tree, and every pair's answer is a walk.",
      ],
      examples: [
        {
          id: "bottleneck-not-shortest",
          title: "The tree route against the shortest route, and against the widest",
          lang: "python",
          code: `# What a minimum spanning tree is not, and the thing it quietly is.
#
# The tree is minimum in total. That is the only promise, and it gets read as
# more than it says. The most common misreading: that walking the tree from a
# to b gives the shortest route from a to b. It does not, and the counters
# below say how often.
#
# What the tree does give -- exactly, every time -- is the *bottleneck* route:
# of all the ways to get from a to b, the one whose worst edge is as small as
# possible. That is the widest-path idea from the Floyd-Warshall lesson, turned
# around, and it falls out of a structure built for a different reason.
INF = 10 ** 9


class Sets:
    def __init__(self, n):
        self.parent = list(range(n))

    def find(self, v):
        while self.parent[v] != v:
            self.parent[v] = self.parent[self.parent[v]]
            v = self.parent[v]
        return v

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        self.parent[rb] = ra
        return True


def kruskal(n, edges):
    """The minimum spanning tree, as a list of edge indices."""
    order = sorted(range(len(edges)), key=lambda i: (edges[i][2], edges[i][0], edges[i][1]))
    sets = Sets(n)
    chosen = []
    for i in order:
        u, v, _ = edges[i]
        if sets.union(u, v):
            chosen.append(i)
    return chosen if len(chosen) == n - 1 else None


def walk_tree(n, edges, tree, start):
    """From start, the total and the worst single edge on the tree route to each node.

    A tree has exactly one route between any two nodes, so there is nothing to
    choose here -- this is a plain walk, not a search.
    """
    adj = [[] for _ in range(n)]
    for i in tree:
        u, v, w = edges[i]
        adj[u].append((v, w))
        adj[v].append((u, w))
    total = [INF] * n
    worst = [INF] * n
    total[start] = 0
    worst[start] = 0
    stack = [start]
    seen = [False] * n
    seen[start] = True
    while stack:
        at = stack.pop()
        for nxt, w in adj[at]:
            if not seen[nxt]:
                seen[nxt] = True
                total[nxt] = total[at] + w
                worst[nxt] = w if w > worst[at] else worst[at]
                stack.append(nxt)
    return total, worst


def shortest_by_walking(n, edges, start):
    """The cheapest simple path to everywhere, and the smallest worst edge.

    Two different questions answered on the same walk, both from the
    definition: minimise the sum, or minimise the maximum.
    """
    adj = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((v, w))
        adj[v].append((u, w))
    cheapest = [INF] * n
    narrowest = [INF] * n
    cheapest[start] = 0
    narrowest[start] = 0
    seen = [False] * n

    def walk(at, total, worst):
        seen[at] = True
        for nxt, w in adj[at]:
            if not seen[nxt]:
                t = total + w
                x = w if w > worst else worst
                if t < cheapest[nxt]:
                    cheapest[nxt] = t
                if x < narrowest[nxt]:
                    narrowest[nxt] = x
                walk(nxt, t, x)
        seen[at] = False

    walk(start, 0, 0)
    return cheapest, narrowest


def show(row):
    return "[" + ", ".join("-" if x >= INF else str(x) for x in row) + "]"


def label(edges):
    return "[" + ", ".join("%d-%d:%d" % e for e in edges) + "]"


CASES = [
    (3, [(0, 1, 2), (1, 2, 2), (0, 2, 3)]),
    (4, [(0, 1, 1), (1, 2, 1), (2, 3, 1), (0, 3, 2)]),
    (5, [(0, 1, 9), (1, 2, 1), (0, 2, 8), (2, 3, 2), (0, 3, 7), (3, 4, 1)]),
]

print("%-44s %-18s %-18s %s" % ("edges", "tree route", "shortest", "worst edge"))
for n, edges in CASES:
    tree = kruskal(n, edges)
    total, worst = walk_tree(n, edges, tree, 0)
    cheapest, _ = shortest_by_walking(n, edges, 0)
    print("%-44s %-18s %-18s %s" % (label(edges), show(total), show(cheapest), show(worst)))

# The same linear congruential generator in every language, so the random
# graphs below are the same graphs whichever translation is run.
seed = 141421


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


trials = 3000
connected = 0
pairs = 0
route_shortest = route_longer = route_shorter = 0
bottleneck_right = 0
whole_tree_shortest = 0
for _ in range(trials):
    n = 3 + rand(4)
    edges = []
    for u in range(n):
        for v in range(u + 1, n):
            if rand(3) > 0:
                edges.append((u, v, 1 + rand(9)))
    tree = kruskal(n, edges)
    if tree is None:
        continue
    connected += 1
    all_match = True
    for start in range(n):
        total, worst = walk_tree(n, edges, tree, start)
        cheapest, narrowest = shortest_by_walking(n, edges, start)
        for b in range(n):
            if b == start:
                continue
            pairs += 1
            if total[b] == cheapest[b]:
                route_shortest += 1
            else:
                all_match = False
                if total[b] > cheapest[b]:
                    route_longer += 1
                else:
                    route_shorter += 1
            if worst[b] == narrowest[b]:
                bottleneck_right += 1
    if all_match:
        whole_tree_shortest += 1

print()
print("over the %d connected graphs among %d random ones on 3 to 6 nodes:" % (connected, trials))
print("  %-42s %6d" % ("ordered pairs of nodes examined", pairs))
print("  %-42s %6d" % ("tree route was also the shortest route", route_shortest))
print("  %-42s %6d" % ("tree route was longer", route_longer))
print("  %-42s %6d" % ("tree route was shorter", route_shorter))
print("  %-42s %6d" % ("graphs where every pair matched", whole_tree_shortest))
print()
print("  %-42s %6d" % ("tree route's worst edge was the smallest", bottleneck_right))
print("  %-42s %6d" % ("out of pairs examined", pairs))

print()
print("The tree route was the shortest route on %d of %d pairs, and on the" % (route_shortest, pairs))
print("other %d it was longer -- never shorter, which it could not be, since" % route_longer)
print("the tree route is a route. Only %d of %d graphs had a tree whose" % (whole_tree_shortest, connected))
print("routes were all shortest. A minimum spanning tree is not a shortest-path")
print("tree and there is no reason it should be: it minimises the sum over the")
print("whole graph, not any one route.")
print()
print("The last pair of counters is the compensation, and it is exact. On every")
print("one of the %d pairs, the worst edge on the tree route was the smallest" % pairs)
print("worst edge any route could manage. So the tree answers the bottleneck")
print("question for every pair at once -- the maximum load a single route can")
print("carry, the lowest bridge on the way -- the widest-path idea from the")
print("Floyd-Warshall lesson, read the other way up. One tree, and every")
print("pair's answer is a walk.")
`,
          output: `edges                                        tree route         shortest           worst edge
[0-1:2, 1-2:2, 0-2:3]                        [0, 2, 4]          [0, 2, 3]          [0, 2, 2]
[0-1:1, 1-2:1, 2-3:1, 0-3:2]                 [0, 1, 2, 3]       [0, 1, 2, 2]       [0, 1, 1, 1]
[0-1:9, 1-2:1, 0-2:8, 2-3:2, 0-3:7, 3-4:1]   [0, 10, 9, 7, 8]   [0, 9, 8, 7, 8]    [0, 7, 7, 7, 7]

over the 2624 connected graphs among 3000 random ones on 3 to 6 nodes:
  ordered pairs of nodes examined             46650
  tree route was also the shortest route      36256
  tree route was longer                       10394
  tree route was shorter                          0
  graphs where every pair matched               967

  tree route's worst edge was the smallest    46650
  out of pairs examined                       46650

The tree route was the shortest route on 36256 of 46650 pairs, and on the
other 10394 it was longer -- never shorter, which it could not be, since
the tree route is a route. Only 967 of 2624 graphs had a tree whose
routes were all shortest. A minimum spanning tree is not a shortest-path
tree and there is no reason it should be: it minimises the sum over the
whole graph, not any one route.

The last pair of counters is the compensation, and it is exact. On every
one of the 46650 pairs, the worst edge on the tree route was the smallest
worst edge any route could manage. So the tree answers the bottleneck
question for every pair at once -- the maximum load a single route can
carry, the lowest bridge on the way -- the widest-path idea from the
Floyd-Warshall lesson, read the other way up. One tree, and every
pair's answer is a walk.`,
          explanation:
            "Every ordered pair of nodes on every random connected graph, with the tree's route scored twice: once on total weight, where it often loses, and once on its worst edge, where it never does.",
          alternates: [
            {
              lang: "javascript",
              code: `// What a minimum spanning tree is not, and the thing it quietly is.
//
// The tree is minimum in total. That is the only promise, and it gets read as
// more than it says. The most common misreading: that walking the tree from a
// to b gives the shortest route from a to b. It does not, and the counters
// below say how often.
//
// What the tree does give -- exactly, every time -- is the *bottleneck* route:
// of all the ways to get from a to b, the one whose worst edge is as small as
// possible. That is the widest-path idea from the Floyd-Warshall lesson, turned
// around, and it falls out of a structure built for a different reason.
const INF = 10 ** 9;

class Sets {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
  }

  find(v) {
    let at = v;
    while (this.parent[at] !== at) {
      this.parent[at] = this.parent[this.parent[at]];
      at = this.parent[at];
    }
    return at;
  }

  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return false;
    this.parent[rb] = ra;
    return true;
  }
}

// The minimum spanning tree, as a list of edge indices.
function kruskal(n, edges) {
  const order = Array.from({ length: edges.length }, (_, i) => i);
  order.sort((i, j) => {
    if (edges[i][2] !== edges[j][2]) return edges[i][2] - edges[j][2];
    if (edges[i][0] !== edges[j][0]) return edges[i][0] - edges[j][0];
    return edges[i][1] - edges[j][1];
  });
  const sets = new Sets(n);
  const chosen = [];
  for (const i of order) {
    if (sets.union(edges[i][0], edges[i][1])) chosen.push(i);
  }
  return chosen.length === n - 1 ? chosen : null;
}

// From start, the total and the worst single edge on the tree route to each node.
//
// A tree has exactly one route between any two nodes, so there is nothing to
// choose here -- this is a plain walk, not a search.
function walkTree(n, edges, tree, start) {
  const adj = Array.from({ length: n }, () => []);
  for (const i of tree) {
    const [u, v, w] = edges[i];
    adj[u].push([v, w]);
    adj[v].push([u, w]);
  }
  const total = new Array(n).fill(INF);
  const worst = new Array(n).fill(INF);
  total[start] = 0;
  worst[start] = 0;
  const stack = [start];
  const seen = new Array(n).fill(false);
  seen[start] = true;
  while (stack.length > 0) {
    const at = stack.pop();
    for (const [nxt, w] of adj[at]) {
      if (!seen[nxt]) {
        seen[nxt] = true;
        total[nxt] = total[at] + w;
        worst[nxt] = w > worst[at] ? w : worst[at];
        stack.push(nxt);
      }
    }
  }
  return [total, worst];
}

// The cheapest simple path to everywhere, and the smallest worst edge.
//
// Two different questions answered on the same walk, both from the
// definition: minimise the sum, or minimise the maximum.
function shortestByWalking(n, edges, start) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    adj[u].push([v, w]);
    adj[v].push([u, w]);
  }
  const cheapest = new Array(n).fill(INF);
  const narrowest = new Array(n).fill(INF);
  cheapest[start] = 0;
  narrowest[start] = 0;
  const seen = new Array(n).fill(false);

  const walk = (at, total, worst) => {
    seen[at] = true;
    for (const [nxt, w] of adj[at]) {
      if (!seen[nxt]) {
        const t = total + w;
        const x = w > worst ? w : worst;
        if (t < cheapest[nxt]) cheapest[nxt] = t;
        if (x < narrowest[nxt]) narrowest[nxt] = x;
        walk(nxt, t, x);
      }
    }
    seen[at] = false;
  };

  walk(start, 0, 0);
  return [cheapest, narrowest];
}

function show(row) {
  return "[" + row.map((x) => (x >= INF ? "-" : String(x))).join(", ") + "]";
}

function label(edges) {
  return "[" + edges.map(([u, v, w]) => \`\${u}-\${v}:\${w}\`).join(", ") + "]";
}

const CASES = [
  [3, [[0, 1, 2], [1, 2, 2], [0, 2, 3]]],
  [4, [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 3, 2]]],
  [5, [[0, 1, 9], [1, 2, 1], [0, 2, 8], [2, 3, 2], [0, 3, 7], [3, 4, 1]]],
];

console.log(
  "edges".padEnd(44) + " " + "tree route".padEnd(18) + " " + "shortest".padEnd(18) + " " +
  "worst edge",
);
for (const [n, edges] of CASES) {
  const tree = kruskal(n, edges);
  const [total, worst] = walkTree(n, edges, tree, 0);
  const [cheapest] = shortestByWalking(n, edges, 0);
  console.log(
    label(edges).padEnd(44) + " " + show(total).padEnd(18) + " " +
    show(cheapest).padEnd(18) + " " + show(worst),
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 141421n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let connected = 0;
let pairs = 0;
let routeShortest = 0;
let routeLonger = 0;
let routeShorter = 0;
let bottleneckRight = 0;
let wholeTreeShortest = 0;
for (let t = 0; t < trials; t += 1) {
  const n = 3 + rand(4);
  const edges = [];
  for (let u = 0; u < n; u += 1)
    for (let v = u + 1; v < n; v += 1)
      if (rand(3) > 0) edges.push([u, v, 1 + rand(9)]);
  const tree = kruskal(n, edges);
  if (tree === null) continue;
  connected += 1;
  let allMatch = true;
  for (let start = 0; start < n; start += 1) {
    const [total, worst] = walkTree(n, edges, tree, start);
    const [cheapest, narrowest] = shortestByWalking(n, edges, start);
    for (let b = 0; b < n; b += 1) {
      if (b === start) continue;
      pairs += 1;
      if (total[b] === cheapest[b]) {
        routeShortest += 1;
      } else {
        allMatch = false;
        if (total[b] > cheapest[b]) routeLonger += 1;
        else routeShorter += 1;
      }
      if (worst[b] === narrowest[b]) bottleneckRight += 1;
    }
  }
  if (allMatch) wholeTreeShortest += 1;
}

const row = (text, value) => "  " + text.padEnd(42) + " " + String(value).padStart(6);

console.log();
console.log(\`over the \${connected} connected graphs among \${trials} random ones on 3 to 6 nodes:\`);
console.log(row("ordered pairs of nodes examined", pairs));
console.log(row("tree route was also the shortest route", routeShortest));
console.log(row("tree route was longer", routeLonger));
console.log(row("tree route was shorter", routeShorter));
console.log(row("graphs where every pair matched", wholeTreeShortest));
console.log();
console.log(row("tree route's worst edge was the smallest", bottleneckRight));
console.log(row("out of pairs examined", pairs));

console.log();
console.log(\`The tree route was the shortest route on \${routeShortest} of \${pairs} pairs, and on the\`);
console.log(\`other \${routeLonger} it was longer -- never shorter, which it could not be, since\`);
console.log(\`the tree route is a route. Only \${wholeTreeShortest} of \${connected} graphs had a tree whose\`);
console.log("routes were all shortest. A minimum spanning tree is not a shortest-path");
console.log("tree and there is no reason it should be: it minimises the sum over the");
console.log("whole graph, not any one route.");
console.log();
console.log("The last pair of counters is the compensation, and it is exact. On every");
console.log(\`one of the \${pairs} pairs, the worst edge on the tree route was the smallest\`);
console.log("worst edge any route could manage. So the tree answers the bottleneck");
console.log("question for every pair at once -- the maximum load a single route can");
console.log("carry, the lowest bridge on the way -- the widest-path idea from the");
console.log("Floyd-Warshall lesson, read the other way up. One tree, and every");
console.log("pair's answer is a walk.");
`,
            },
            {
              lang: "typescript",
              code: `// What a minimum spanning tree is not, and the thing it quietly is.
//
// The tree is minimum in total. That is the only promise, and it gets read as
// more than it says. The most common misreading: that walking the tree from a
// to b gives the shortest route from a to b. It does not, and the counters
// below say how often.
//
// What the tree does give -- exactly, every time -- is the *bottleneck* route:
// of all the ways to get from a to b, the one whose worst edge is as small as
// possible. That is the widest-path idea from the Floyd-Warshall lesson, turned
// around, and it falls out of a structure built for a different reason.
const INF = 10 ** 9;

class Sets {
  parent: number[];

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
  }

  find(v: number): number {
    let at = v;
    while (this.parent[at] !== at) {
      this.parent[at] = this.parent[this.parent[at]];
      at = this.parent[at];
    }
    return at;
  }

  union(a: number, b: number): boolean {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return false;
    this.parent[rb] = ra;
    return true;
  }
}

// The minimum spanning tree, as a list of edge indices.
function kruskal(n: number, edges: number[][]): number[] | null {
  const order = Array.from({ length: edges.length }, (_, i) => i);
  order.sort((i, j) => {
    if (edges[i][2] !== edges[j][2]) return edges[i][2] - edges[j][2];
    if (edges[i][0] !== edges[j][0]) return edges[i][0] - edges[j][0];
    return edges[i][1] - edges[j][1];
  });
  const sets = new Sets(n);
  const chosen: number[] = [];
  for (const i of order) {
    if (sets.union(edges[i][0], edges[i][1])) chosen.push(i);
  }
  return chosen.length === n - 1 ? chosen : null;
}

// From start, the total and the worst single edge on the tree route to each node.
//
// A tree has exactly one route between any two nodes, so there is nothing to
// choose here -- this is a plain walk, not a search.
function walkTree(n: number, edges: number[][], tree: number[], start: number): [number[], number[]] {
  const adj: number[][][] = Array.from({ length: n }, () => []);
  for (const i of tree) {
    const [u, v, w] = edges[i];
    adj[u].push([v, w]);
    adj[v].push([u, w]);
  }
  const total = new Array(n).fill(INF);
  const worst = new Array(n).fill(INF);
  total[start] = 0;
  worst[start] = 0;
  const stack: number[] = [start];
  const seen = new Array(n).fill(false);
  seen[start] = true;
  while (stack.length > 0) {
    const at = stack.pop() as number;
    for (const [nxt, w] of adj[at]) {
      if (!seen[nxt]) {
        seen[nxt] = true;
        total[nxt] = total[at] + w;
        worst[nxt] = w > worst[at] ? w : worst[at];
        stack.push(nxt);
      }
    }
  }
  return [total, worst];
}

// The cheapest simple path to everywhere, and the smallest worst edge.
//
// Two different questions answered on the same walk, both from the
// definition: minimise the sum, or minimise the maximum.
function shortestByWalking(n: number, edges: number[][], start: number): [number[], number[]] {
  const adj: number[][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    adj[u].push([v, w]);
    adj[v].push([u, w]);
  }
  const cheapest = new Array(n).fill(INF);
  const narrowest = new Array(n).fill(INF);
  cheapest[start] = 0;
  narrowest[start] = 0;
  const seen = new Array(n).fill(false);

  const walk = (at: number, total: number, worst: number): void => {
    seen[at] = true;
    for (const [nxt, w] of adj[at]) {
      if (!seen[nxt]) {
        const t = total + w;
        const x = w > worst ? w : worst;
        if (t < cheapest[nxt]) cheapest[nxt] = t;
        if (x < narrowest[nxt]) narrowest[nxt] = x;
        walk(nxt, t, x);
      }
    }
    seen[at] = false;
  };

  walk(start, 0, 0);
  return [cheapest, narrowest];
}

function show(row: number[]): string {
  return "[" + row.map((x) => (x >= INF ? "-" : String(x))).join(", ") + "]";
}

function label(edges: number[][]): string {
  return "[" + edges.map(([u, v, w]) => \`\${u}-\${v}:\${w}\`).join(", ") + "]";
}

const CASES: [number, number[][]][] = [
  [3, [[0, 1, 2], [1, 2, 2], [0, 2, 3]]],
  [4, [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 3, 2]]],
  [5, [[0, 1, 9], [1, 2, 1], [0, 2, 8], [2, 3, 2], [0, 3, 7], [3, 4, 1]]],
];

console.log(
  "edges".padEnd(44) + " " + "tree route".padEnd(18) + " " + "shortest".padEnd(18) + " " +
  "worst edge",
);
for (const [n, edges] of CASES) {
  const tree = kruskal(n, edges) as number[];
  const [total, worst] = walkTree(n, edges, tree, 0);
  const [cheapest] = shortestByWalking(n, edges, 0);
  console.log(
    label(edges).padEnd(44) + " " + show(total).padEnd(18) + " " +
    show(cheapest).padEnd(18) + " " + show(worst),
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 141421n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let connected = 0;
let pairs = 0;
let routeShortest = 0;
let routeLonger = 0;
let routeShorter = 0;
let bottleneckRight = 0;
let wholeTreeShortest = 0;
for (let t = 0; t < trials; t += 1) {
  const n = 3 + rand(4);
  const edges: number[][] = [];
  for (let u = 0; u < n; u += 1)
    for (let v = u + 1; v < n; v += 1)
      if (rand(3) > 0) edges.push([u, v, 1 + rand(9)]);
  const tree = kruskal(n, edges);
  if (tree === null) continue;
  connected += 1;
  let allMatch = true;
  for (let start = 0; start < n; start += 1) {
    const [total, worst] = walkTree(n, edges, tree, start);
    const [cheapest, narrowest] = shortestByWalking(n, edges, start);
    for (let b = 0; b < n; b += 1) {
      if (b === start) continue;
      pairs += 1;
      if (total[b] === cheapest[b]) {
        routeShortest += 1;
      } else {
        allMatch = false;
        if (total[b] > cheapest[b]) routeLonger += 1;
        else routeShorter += 1;
      }
      if (worst[b] === narrowest[b]) bottleneckRight += 1;
    }
  }
  if (allMatch) wholeTreeShortest += 1;
}

const row = (text: string, value: number): string => "  " + text.padEnd(42) + " " + String(value).padStart(6);

console.log();
console.log(\`over the \${connected} connected graphs among \${trials} random ones on 3 to 6 nodes:\`);
console.log(row("ordered pairs of nodes examined", pairs));
console.log(row("tree route was also the shortest route", routeShortest));
console.log(row("tree route was longer", routeLonger));
console.log(row("tree route was shorter", routeShorter));
console.log(row("graphs where every pair matched", wholeTreeShortest));
console.log();
console.log(row("tree route's worst edge was the smallest", bottleneckRight));
console.log(row("out of pairs examined", pairs));

console.log();
console.log(\`The tree route was the shortest route on \${routeShortest} of \${pairs} pairs, and on the\`);
console.log(\`other \${routeLonger} it was longer -- never shorter, which it could not be, since\`);
console.log(\`the tree route is a route. Only \${wholeTreeShortest} of \${connected} graphs had a tree whose\`);
console.log("routes were all shortest. A minimum spanning tree is not a shortest-path");
console.log("tree and there is no reason it should be: it minimises the sum over the");
console.log("whole graph, not any one route.");
console.log();
console.log("The last pair of counters is the compensation, and it is exact. On every");
console.log(\`one of the \${pairs} pairs, the worst edge on the tree route was the smallest\`);
console.log("worst edge any route could manage. So the tree answers the bottleneck");
console.log("question for every pair at once -- the maximum load a single route can");
console.log("carry, the lowest bridge on the way -- the widest-path idea from the");
console.log("Floyd-Warshall lesson, read the other way up. One tree, and every");
console.log("pair's answer is a walk.");
`,
            },
            {
              lang: "java",
              code: `// What a minimum spanning tree is not, and the thing it quietly is.
//
// The tree is minimum in total. That is the only promise, and it gets read as
// more than it says. The most common misreading: that walking the tree from a
// to b gives the shortest route from a to b. It does not, and the counters
// below say how often.
//
// What the tree does give -- exactly, every time -- is the *bottleneck* route:
// of all the ways to get from a to b, the one whose worst edge is as small as
// possible. That is the widest-path idea from the Floyd-Warshall lesson, turned
// around, and it falls out of a structure built for a different reason.
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
    static final int INF = 1000000000;

    static class Sets {
        int[] parent;

        Sets(int n) {
            parent = new int[n];
            for (int i = 0; i < n; i++) parent[i] = i;
        }

        int find(int v) {
            while (parent[v] != v) {
                parent[v] = parent[parent[v]];
                v = parent[v];
            }
            return v;
        }

        boolean union(int a, int b) {
            int ra = find(a), rb = find(b);
            if (ra == rb) return false;
            parent[rb] = ra;
            return true;
        }
    }

    /** The minimum spanning tree, as a list of edge indices. */
    static List<Integer> kruskal(int n, int[][] edges) {
        List<Integer> order = new ArrayList<>();
        for (int i = 0; i < edges.length; i++) order.add(i);
        order.sort((i, j) -> {
            if (edges[i][2] != edges[j][2]) return Integer.compare(edges[i][2], edges[j][2]);
            if (edges[i][0] != edges[j][0]) return Integer.compare(edges[i][0], edges[j][0]);
            return Integer.compare(edges[i][1], edges[j][1]);
        });
        Sets sets = new Sets(n);
        List<Integer> chosen = new ArrayList<>();
        for (int i : order) if (sets.union(edges[i][0], edges[i][1])) chosen.add(i);
        return chosen.size() == n - 1 ? chosen : null;
    }

    /**
     * From start, the total and the worst single edge on the tree route to each node.
     *
     * <p>A tree has exactly one route between any two nodes, so there is nothing
     * to choose here -- this is a plain walk, not a search.
     */
    static int[][] walkTree(int n, int[][] edges, List<Integer> tree, int start) {
        @SuppressWarnings("unchecked")
        List<int[]>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int i : tree) {
            adj[edges[i][0]].add(new int[] {edges[i][1], edges[i][2]});
            adj[edges[i][1]].add(new int[] {edges[i][0], edges[i][2]});
        }
        int[] total = new int[n];
        int[] worst = new int[n];
        Arrays.fill(total, INF);
        Arrays.fill(worst, INF);
        total[start] = 0;
        worst[start] = 0;
        List<Integer> stack = new ArrayList<>();
        stack.add(start);
        boolean[] seen = new boolean[n];
        seen[start] = true;
        while (!stack.isEmpty()) {
            int at = stack.remove(stack.size() - 1);
            for (int[] step : adj[at]) {
                if (!seen[step[0]]) {
                    seen[step[0]] = true;
                    total[step[0]] = total[at] + step[1];
                    worst[step[0]] = Math.max(step[1], worst[at]);
                    stack.add(step[0]);
                }
            }
        }
        return new int[][] {total, worst};
    }

    static void walk(List<int[]>[] adj, boolean[] seen, int[] cheapest, int[] narrowest,
                     int at, int total, int worst) {
        seen[at] = true;
        for (int[] step : adj[at]) {
            if (!seen[step[0]]) {
                int t = total + step[1];
                int x = Math.max(step[1], worst);
                if (t < cheapest[step[0]]) cheapest[step[0]] = t;
                if (x < narrowest[step[0]]) narrowest[step[0]] = x;
                walk(adj, seen, cheapest, narrowest, step[0], t, x);
            }
        }
        seen[at] = false;
    }

    /**
     * The cheapest simple path to everywhere, and the smallest worst edge.
     *
     * <p>Two different questions answered on the same walk, both from the
     * definition: minimise the sum, or minimise the maximum.
     */
    static int[][] shortestByWalking(int n, int[][] edges, int start) {
        @SuppressWarnings("unchecked")
        List<int[]>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : edges) {
            adj[e[0]].add(new int[] {e[1], e[2]});
            adj[e[1]].add(new int[] {e[0], e[2]});
        }
        int[] cheapest = new int[n];
        int[] narrowest = new int[n];
        Arrays.fill(cheapest, INF);
        Arrays.fill(narrowest, INF);
        cheapest[start] = 0;
        narrowest[start] = 0;
        walk(adj, new boolean[n], cheapest, narrowest, start, 0, 0);
        return new int[][] {cheapest, narrowest};
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
    static long seed = 141421L;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    static String row(String text, int value) {
        return String.format("  %-42s %6d", text, value);
    }

    public static void main(String[] args) {
        int[] caseN = {3, 4, 5};
        int[][][] caseEdges = {
            {{0, 1, 2}, {1, 2, 2}, {0, 2, 3}},
            {{0, 1, 1}, {1, 2, 1}, {2, 3, 1}, {0, 3, 2}},
            {{0, 1, 9}, {1, 2, 1}, {0, 2, 8}, {2, 3, 2}, {0, 3, 7}, {3, 4, 1}},
        };

        System.out.printf("%-44s %-18s %-18s %s%n",
            "edges", "tree route", "shortest", "worst edge");
        for (int c = 0; c < caseN.length; c++) {
            List<Integer> tree = kruskal(caseN[c], caseEdges[c]);
            int[][] walked = walkTree(caseN[c], caseEdges[c], tree, 0);
            int[][] byWalking = shortestByWalking(caseN[c], caseEdges[c], 0);
            System.out.printf("%-44s %-18s %-18s %s%n", label(caseEdges[c]),
                show(walked[0]), show(byWalking[0]), show(walked[1]));
        }

        int trials = 3000;
        int connected = 0, pairs = 0;
        int routeShortest = 0, routeLonger = 0, routeShorter = 0;
        int bottleneckRight = 0, wholeTreeShortest = 0;
        for (int t = 0; t < trials; t++) {
            int n = 3 + rand(4);
            List<int[]> built = new ArrayList<>();
            for (int u = 0; u < n; u++)
                for (int v = u + 1; v < n; v++)
                    if (rand(3) > 0) built.add(new int[] {u, v, 1 + rand(9)});
            int[][] edges = built.toArray(new int[0][]);
            List<Integer> tree = kruskal(n, edges);
            if (tree == null) continue;
            connected++;
            boolean allMatch = true;
            for (int start = 0; start < n; start++) {
                int[][] walked = walkTree(n, edges, tree, start);
                int[][] byWalking = shortestByWalking(n, edges, start);
                for (int b = 0; b < n; b++) {
                    if (b == start) continue;
                    pairs++;
                    if (walked[0][b] == byWalking[0][b]) {
                        routeShortest++;
                    } else {
                        allMatch = false;
                        if (walked[0][b] > byWalking[0][b]) routeLonger++;
                        else routeShorter++;
                    }
                    if (walked[1][b] == byWalking[1][b]) bottleneckRight++;
                }
            }
            if (allMatch) wholeTreeShortest++;
        }

        System.out.println();
        System.out.println("over the " + connected + " connected graphs among " + trials
            + " random ones on 3 to 6 nodes:");
        System.out.println(row("ordered pairs of nodes examined", pairs));
        System.out.println(row("tree route was also the shortest route", routeShortest));
        System.out.println(row("tree route was longer", routeLonger));
        System.out.println(row("tree route was shorter", routeShorter));
        System.out.println(row("graphs where every pair matched", wholeTreeShortest));
        System.out.println();
        System.out.println(row("tree route's worst edge was the smallest", bottleneckRight));
        System.out.println(row("out of pairs examined", pairs));

        System.out.println();
        System.out.println("The tree route was the shortest route on " + routeShortest + " of "
            + pairs + " pairs, and on the");
        System.out.println("other " + routeLonger
            + " it was longer -- never shorter, which it could not be, since");
        System.out.println("the tree route is a route. Only " + wholeTreeShortest + " of "
            + connected + " graphs had a tree whose");
        System.out.println("routes were all shortest. A minimum spanning tree is not a shortest-path");
        System.out.println("tree and there is no reason it should be: it minimises the sum over the");
        System.out.println("whole graph, not any one route.");
        System.out.println();
        System.out.println("The last pair of counters is the compensation, and it is exact. On every");
        System.out.println("one of the " + pairs
            + " pairs, the worst edge on the tree route was the smallest");
        System.out.println("worst edge any route could manage. So the tree answers the bottleneck");
        System.out.println("question for every pair at once -- the maximum load a single route can");
        System.out.println("carry, the lowest bridge on the way -- the widest-path idea from the");
        System.out.println("Floyd-Warshall lesson, read the other way up. One tree, and every");
        System.out.println("pair's answer is a walk.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// What a minimum spanning tree is not, and the thing it quietly is.
//
// The tree is minimum in total. That is the only promise, and it gets read as
// more than it says. The most common misreading: that walking the tree from a
// to b gives the shortest route from a to b. It does not, and the counters
// below say how often.
//
// What the tree does give -- exactly, every time -- is the *bottleneck* route:
// of all the ways to get from a to b, the one whose worst edge is as small as
// possible. That is the widest-path idea from the Floyd-Warshall lesson, turned
// around, and it falls out of a structure built for a different reason.
#include <algorithm>
#include <array>
#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

const int INF = 1000000000;

using Edge = std::array<int, 3>;
using Adj = std::vector<std::vector<std::pair<int, int>>>;

struct Sets {
    std::vector<int> parent;

    explicit Sets(int n) {
        parent.resize(n);
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    int find(int v) {
        while (parent[v] != v) {
            parent[v] = parent[parent[v]];
            v = parent[v];
        }
        return v;
    }

    bool unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        parent[rb] = ra;
        return true;
    }
};

// The minimum spanning tree, as a list of edge indices.
std::vector<int> kruskal(int n, const std::vector<Edge>& edges) {
    std::vector<int> order(edges.size());
    for (size_t i = 0; i < order.size(); i++) order[i] = static_cast<int>(i);
    std::sort(order.begin(), order.end(), [&](int i, int j) {
        if (edges[i][2] != edges[j][2]) return edges[i][2] < edges[j][2];
        if (edges[i][0] != edges[j][0]) return edges[i][0] < edges[j][0];
        return edges[i][1] < edges[j][1];
    });
    Sets sets(n);
    std::vector<int> chosen;
    for (int i : order)
        if (sets.unite(edges[i][0], edges[i][1])) chosen.push_back(i);
    if (static_cast<int>(chosen.size()) != n - 1) return std::vector<int>();
    return chosen;
}

// From start, the total and the worst single edge on the tree route to each node.
//
// A tree has exactly one route between any two nodes, so there is nothing to
// choose here -- this is a plain walk, not a search.
void walk_tree(int n, const std::vector<Edge>& edges, const std::vector<int>& tree, int start,
               std::vector<int>& total, std::vector<int>& worst) {
    Adj adj(n);
    for (int i : tree) {
        adj[edges[i][0]].push_back({edges[i][1], edges[i][2]});
        adj[edges[i][1]].push_back({edges[i][0], edges[i][2]});
    }
    total.assign(n, INF);
    worst.assign(n, INF);
    total[start] = 0;
    worst[start] = 0;
    std::vector<int> stack = {start};
    std::vector<bool> seen(n, false);
    seen[start] = true;
    while (!stack.empty()) {
        int at = stack.back();
        stack.pop_back();
        for (const auto& step : adj[at]) {
            if (!seen[step.first]) {
                seen[step.first] = true;
                total[step.first] = total[at] + step.second;
                worst[step.first] = step.second > worst[at] ? step.second : worst[at];
                stack.push_back(step.first);
            }
        }
    }
}

void walk(const Adj& adj, std::vector<bool>& seen, std::vector<int>& cheapest,
          std::vector<int>& narrowest, int at, int total, int worst) {
    seen[at] = true;
    for (const auto& step : adj[at]) {
        if (!seen[step.first]) {
            int t = total + step.second;
            int x = step.second > worst ? step.second : worst;
            if (t < cheapest[step.first]) cheapest[step.first] = t;
            if (x < narrowest[step.first]) narrowest[step.first] = x;
            walk(adj, seen, cheapest, narrowest, step.first, t, x);
        }
    }
    seen[at] = false;
}

// The cheapest simple path to everywhere, and the smallest worst edge.
//
// Two different questions answered on the same walk, both from the
// definition: minimise the sum, or minimise the maximum.
void shortest_by_walking(int n, const std::vector<Edge>& edges, int start,
                         std::vector<int>& cheapest, std::vector<int>& narrowest) {
    Adj adj(n);
    for (const Edge& e : edges) {
        adj[e[0]].push_back({e[1], e[2]});
        adj[e[1]].push_back({e[0], e[2]});
    }
    cheapest.assign(n, INF);
    narrowest.assign(n, INF);
    cheapest[start] = 0;
    narrowest[start] = 0;
    std::vector<bool> seen(n, false);
    walk(adj, seen, cheapest, narrowest, start, 0, 0);
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
long long seed = 141421;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

void row(const std::string& text, int value) {
    std::cout << "  " << std::left << std::setw(42) << text << " " << std::right
              << std::setw(6) << value << "\\n";
}

int main() {
    std::vector<int> case_n = {3, 4, 5};
    std::vector<std::vector<Edge>> cases = {
        {{0, 1, 2}, {1, 2, 2}, {0, 2, 3}},
        {{0, 1, 1}, {1, 2, 1}, {2, 3, 1}, {0, 3, 2}},
        {{0, 1, 9}, {1, 2, 1}, {0, 2, 8}, {2, 3, 2}, {0, 3, 7}, {3, 4, 1}},
    };

    std::cout << std::left << std::setw(44) << "edges" << " " << std::setw(18) << "tree route"
              << " " << std::setw(18) << "shortest" << " " << "worst edge" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        std::vector<int> tree = kruskal(case_n[c], cases[c]);
        std::vector<int> total, worst, cheapest, narrowest;
        walk_tree(case_n[c], cases[c], tree, 0, total, worst);
        shortest_by_walking(case_n[c], cases[c], 0, cheapest, narrowest);
        std::cout << std::left << std::setw(44) << label(cases[c]) << " " << std::setw(18)
                  << show(total) << " " << std::setw(18) << show(cheapest) << " "
                  << show(worst) << "\\n";
    }

    int trials = 3000;
    int connected = 0, pairs = 0;
    int route_shortest = 0, route_longer = 0, route_shorter = 0;
    int bottleneck_right = 0, whole_tree_shortest = 0;
    for (int t = 0; t < trials; t++) {
        int n = 3 + rand_below(4);
        std::vector<Edge> edges;
        for (int u = 0; u < n; u++)
            for (int v = u + 1; v < n; v++)
                if (rand_below(3) > 0) edges.push_back({u, v, 1 + rand_below(9)});
        std::vector<int> tree = kruskal(n, edges);
        if (tree.empty()) continue;
        connected++;
        bool all_match = true;
        for (int start = 0; start < n; start++) {
            std::vector<int> total, worst, cheapest, narrowest;
            walk_tree(n, edges, tree, start, total, worst);
            shortest_by_walking(n, edges, start, cheapest, narrowest);
            for (int b = 0; b < n; b++) {
                if (b == start) continue;
                pairs++;
                if (total[b] == cheapest[b]) {
                    route_shortest++;
                } else {
                    all_match = false;
                    if (total[b] > cheapest[b]) route_longer++;
                    else route_shorter++;
                }
                if (worst[b] == narrowest[b]) bottleneck_right++;
            }
        }
        if (all_match) whole_tree_shortest++;
    }

    std::cout << "\\n";
    std::cout << "over the " << connected << " connected graphs among " << trials
              << " random ones on 3 to 6 nodes:\\n";
    row("ordered pairs of nodes examined", pairs);
    row("tree route was also the shortest route", route_shortest);
    row("tree route was longer", route_longer);
    row("tree route was shorter", route_shorter);
    row("graphs where every pair matched", whole_tree_shortest);
    std::cout << "\\n";
    row("tree route's worst edge was the smallest", bottleneck_right);
    row("out of pairs examined", pairs);

    std::cout << "\\n";
    std::cout << "The tree route was the shortest route on " << route_shortest << " of " << pairs
              << " pairs, and on the\\n";
    std::cout << "other " << route_longer
              << " it was longer -- never shorter, which it could not be, since\\n";
    std::cout << "the tree route is a route. Only " << whole_tree_shortest << " of " << connected
              << " graphs had a tree whose\\n";
    std::cout << "routes were all shortest. A minimum spanning tree is not a shortest-path\\n";
    std::cout << "tree and there is no reason it should be: it minimises the sum over the\\n";
    std::cout << "whole graph, not any one route.\\n";
    std::cout << "\\n";
    std::cout << "The last pair of counters is the compensation, and it is exact. On every\\n";
    std::cout << "one of the " << pairs
              << " pairs, the worst edge on the tree route was the smallest\\n";
    std::cout << "worst edge any route could manage. So the tree answers the bottleneck\\n";
    std::cout << "question for every pair at once -- the maximum load a single route can\\n";
    std::cout << "carry, the lowest bridge on the way -- the widest-path idea from the\\n";
    std::cout << "Floyd-Warshall lesson, read the other way up. One tree, and every\\n";
    std::cout << "pair's answer is a walk.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// What a minimum spanning tree is not, and the thing it quietly is.
//
// The tree is minimum in total. That is the only promise, and it gets read as
// more than it says. The most common misreading: that walking the tree from a
// to b gives the shortest route from a to b. It does not, and the counters
// below say how often.
//
// What the tree does give -- exactly, every time -- is the *bottleneck* route:
// of all the ways to get from a to b, the one whose worst edge is as small as
// possible. That is the widest-path idea from the Floyd-Warshall lesson, turned
// around, and it falls out of a structure built for a different reason.
const INF: i64 = 1_000_000_000;

type Edge = (usize, usize, i64);
type Adj = Vec<Vec<(usize, i64)>>;

struct Sets {
    parent: Vec<usize>,
}

impl Sets {
    fn new(n: usize) -> Sets {
        Sets {
            parent: (0..n).collect(),
        }
    }

    fn find(&mut self, mut v: usize) -> usize {
        while self.parent[v] != v {
            self.parent[v] = self.parent[self.parent[v]];
            v = self.parent[v];
        }
        v
    }

    fn unite(&mut self, a: usize, b: usize) -> bool {
        let ra = self.find(a);
        let rb = self.find(b);
        if ra == rb {
            return false;
        }
        self.parent[rb] = ra;
        true
    }
}

/// The minimum spanning tree, as a list of edge indices.
fn kruskal(n: usize, edges: &[Edge]) -> Option<Vec<usize>> {
    let mut order: Vec<usize> = (0..edges.len()).collect();
    order.sort_by(|&i, &j| (edges[i].2, edges[i].0, edges[i].1).cmp(&(edges[j].2, edges[j].0, edges[j].1)));
    let mut sets = Sets::new(n);
    let mut chosen: Vec<usize> = Vec::new();
    for &i in &order {
        if sets.unite(edges[i].0, edges[i].1) {
            chosen.push(i);
        }
    }
    if chosen.len() == n - 1 {
        Some(chosen)
    } else {
        None
    }
}

/// From start, the total and the worst single edge on the tree route to each node.
///
/// A tree has exactly one route between any two nodes, so there is nothing to
/// choose here -- this is a plain walk, not a search.
fn walk_tree(n: usize, edges: &[Edge], tree: &[usize], start: usize) -> (Vec<i64>, Vec<i64>) {
    let mut adj: Adj = vec![Vec::new(); n];
    for &i in tree {
        let (u, v, w) = edges[i];
        adj[u].push((v, w));
        adj[v].push((u, w));
    }
    let mut total = vec![INF; n];
    let mut worst = vec![INF; n];
    total[start] = 0;
    worst[start] = 0;
    let mut stack = vec![start];
    let mut seen = vec![false; n];
    seen[start] = true;
    while let Some(at) = stack.pop() {
        for idx in 0..adj[at].len() {
            let (nxt, w) = adj[at][idx];
            if !seen[nxt] {
                seen[nxt] = true;
                total[nxt] = total[at] + w;
                worst[nxt] = if w > worst[at] { w } else { worst[at] };
                stack.push(nxt);
            }
        }
    }
    (total, worst)
}

fn walk(
    adj: &Adj,
    seen: &mut [bool],
    cheapest: &mut [i64],
    narrowest: &mut [i64],
    at: usize,
    total: i64,
    worst: i64,
) {
    seen[at] = true;
    for idx in 0..adj[at].len() {
        let (nxt, w) = adj[at][idx];
        if !seen[nxt] {
            let t = total + w;
            let x = if w > worst { w } else { worst };
            if t < cheapest[nxt] {
                cheapest[nxt] = t;
            }
            if x < narrowest[nxt] {
                narrowest[nxt] = x;
            }
            walk(adj, seen, cheapest, narrowest, nxt, t, x);
        }
    }
    seen[at] = false;
}

/// The cheapest simple path to everywhere, and the smallest worst edge.
///
/// Two different questions answered on the same walk, both from the
/// definition: minimise the sum, or minimise the maximum.
fn shortest_by_walking(n: usize, edges: &[Edge], start: usize) -> (Vec<i64>, Vec<i64>) {
    let mut adj: Adj = vec![Vec::new(); n];
    for &(u, v, w) in edges {
        adj[u].push((v, w));
        adj[v].push((u, w));
    }
    let mut cheapest = vec![INF; n];
    let mut narrowest = vec![INF; n];
    cheapest[start] = 0;
    narrowest[start] = 0;
    let mut seen = vec![false; n];
    walk(&adj, &mut seen, &mut cheapest, &mut narrowest, start, 0, 0);
    (cheapest, narrowest)
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

fn row(text: &str, value: u64) {
    println!("  {:<42} {:>6}", text, value);
}

fn main() {
    let case_n = [3usize, 4, 5];
    let cases: Vec<Vec<Edge>> = vec![
        vec![(0, 1, 2), (1, 2, 2), (0, 2, 3)],
        vec![(0, 1, 1), (1, 2, 1), (2, 3, 1), (0, 3, 2)],
        vec![(0, 1, 9), (1, 2, 1), (0, 2, 8), (2, 3, 2), (0, 3, 7), (3, 4, 1)],
    ];

    println!(
        "{:<44} {:<18} {:<18} {}",
        "edges", "tree route", "shortest", "worst edge"
    );
    for c in 0..cases.len() {
        let tree = kruskal(case_n[c], &cases[c]).unwrap();
        let (total, worst) = walk_tree(case_n[c], &cases[c], &tree, 0);
        let (cheapest, _) = shortest_by_walking(case_n[c], &cases[c], 0);
        println!(
            "{:<44} {:<18} {:<18} {}",
            label(&cases[c]),
            show(&total),
            show(&cheapest),
            show(&worst)
        );
    }

    let mut rng = Rng { seed: 141421 };
    let trials = 3000;
    let (mut connected, mut pairs) = (0u64, 0u64);
    let (mut route_shortest, mut route_longer, mut route_shorter) = (0u64, 0u64, 0u64);
    let (mut bottleneck_right, mut whole_tree_shortest) = (0u64, 0u64);
    for _ in 0..trials {
        let n = 3 + rng.next(4) as usize;
        let mut edges: Vec<Edge> = Vec::new();
        for u in 0..n {
            for v in (u + 1)..n {
                if rng.next(3) > 0 {
                    edges.push((u, v, 1 + rng.next(9)));
                }
            }
        }
        let tree = match kruskal(n, &edges) {
            Some(t) => t,
            None => continue,
        };
        connected += 1;
        let mut all_match = true;
        for start in 0..n {
            let (total, worst) = walk_tree(n, &edges, &tree, start);
            let (cheapest, narrowest) = shortest_by_walking(n, &edges, start);
            for b in 0..n {
                if b == start {
                    continue;
                }
                pairs += 1;
                if total[b] == cheapest[b] {
                    route_shortest += 1;
                } else {
                    all_match = false;
                    if total[b] > cheapest[b] {
                        route_longer += 1;
                    } else {
                        route_shorter += 1;
                    }
                }
                if worst[b] == narrowest[b] {
                    bottleneck_right += 1;
                }
            }
        }
        if all_match {
            whole_tree_shortest += 1;
        }
    }

    println!();
    println!(
        "over the {} connected graphs among {} random ones on 3 to 6 nodes:",
        connected, trials
    );
    row("ordered pairs of nodes examined", pairs);
    row("tree route was also the shortest route", route_shortest);
    row("tree route was longer", route_longer);
    row("tree route was shorter", route_shorter);
    row("graphs where every pair matched", whole_tree_shortest);
    println!();
    row("tree route's worst edge was the smallest", bottleneck_right);
    row("out of pairs examined", pairs);

    println!();
    println!(
        "The tree route was the shortest route on {} of {} pairs, and on the",
        route_shortest, pairs
    );
    println!(
        "other {} it was longer -- never shorter, which it could not be, since",
        route_longer
    );
    println!(
        "the tree route is a route. Only {} of {} graphs had a tree whose",
        whole_tree_shortest, connected
    );
    println!("routes were all shortest. A minimum spanning tree is not a shortest-path");
    println!("tree and there is no reason it should be: it minimises the sum over the");
    println!("whole graph, not any one route.");
    println!();
    println!("The last pair of counters is the compensation, and it is exact. On every");
    println!(
        "one of the {} pairs, the worst edge on the tree route was the smallest",
        pairs
    );
    println!("worst edge any route could manage. So the tree answers the bottleneck");
    println!("question for every pair at once -- the maximum load a single route can");
    println!("carry, the lowest bridge on the way -- the widest-path idea from the");
    println!("Floyd-Warshall lesson, read the other way up. One tree, and every");
    println!("pair's answer is a walk.");
}
`,
            },
            {
              lang: "go",
              code: `// What a minimum spanning tree is not, and the thing it quietly is.
//
// The tree is minimum in total. That is the only promise, and it gets read as
// more than it says. The most common misreading: that walking the tree from a
// to b gives the shortest route from a to b. It does not, and the counters
// below say how often.
//
// What the tree does give -- exactly, every time -- is the *bottleneck* route:
// of all the ways to get from a to b, the one whose worst edge is as small as
// possible. That is the widest-path idea from the Floyd-Warshall lesson, turned
// around, and it falls out of a structure built for a different reason.
package main

import (
	"fmt"
	"sort"
	"strings"
)

const INF = 1000000000

// Edge is an undirected edge with a weight.
type Edge struct {
	U, V, W int
}

// Sets is the plain union-find Kruskal needs.
type Sets struct {
	parent []int
}

func newSets(n int) *Sets {
	s := &Sets{parent: make([]int, n)}
	for i := range s.parent {
		s.parent[i] = i
	}
	return s
}

func (s *Sets) find(v int) int {
	for s.parent[v] != v {
		s.parent[v] = s.parent[s.parent[v]]
		v = s.parent[v]
	}
	return v
}

func (s *Sets) unite(a, b int) bool {
	ra, rb := s.find(a), s.find(b)
	if ra == rb {
		return false
	}
	s.parent[rb] = ra
	return true
}

// kruskal returns the minimum spanning tree as a list of edge indices.
func kruskal(n int, edges []Edge) []int {
	order := make([]int, len(edges))
	for i := range order {
		order[i] = i
	}
	sort.Slice(order, func(a, b int) bool {
		i, j := order[a], order[b]
		if edges[i].W != edges[j].W {
			return edges[i].W < edges[j].W
		}
		if edges[i].U != edges[j].U {
			return edges[i].U < edges[j].U
		}
		return edges[i].V < edges[j].V
	})
	sets := newSets(n)
	var chosen []int
	for _, i := range order {
		if sets.unite(edges[i].U, edges[i].V) {
			chosen = append(chosen, i)
		}
	}
	if len(chosen) != n-1 {
		return nil
	}
	return chosen
}

// walkTree gives, from start, the total and the worst single edge on the tree
// route to each node.
//
// A tree has exactly one route between any two nodes, so there is nothing to
// choose here -- this is a plain walk, not a search.
func walkTree(n int, edges []Edge, tree []int, start int) ([]int, []int) {
	adj := make([][][2]int, n)
	for _, i := range tree {
		e := edges[i]
		adj[e.U] = append(adj[e.U], [2]int{e.V, e.W})
		adj[e.V] = append(adj[e.V], [2]int{e.U, e.W})
	}
	total := make([]int, n)
	worst := make([]int, n)
	for i := range total {
		total[i] = INF
		worst[i] = INF
	}
	total[start] = 0
	worst[start] = 0
	stack := []int{start}
	seen := make([]bool, n)
	seen[start] = true
	for len(stack) > 0 {
		at := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		for _, step := range adj[at] {
			if !seen[step[0]] {
				seen[step[0]] = true
				total[step[0]] = total[at] + step[1]
				if step[1] > worst[at] {
					worst[step[0]] = step[1]
				} else {
					worst[step[0]] = worst[at]
				}
				stack = append(stack, step[0])
			}
		}
	}
	return total, worst
}

func walk(adj [][][2]int, seen []bool, cheapest, narrowest []int, at, total, worst int) {
	seen[at] = true
	for _, step := range adj[at] {
		if !seen[step[0]] {
			t := total + step[1]
			x := worst
			if step[1] > x {
				x = step[1]
			}
			if t < cheapest[step[0]] {
				cheapest[step[0]] = t
			}
			if x < narrowest[step[0]] {
				narrowest[step[0]] = x
			}
			walk(adj, seen, cheapest, narrowest, step[0], t, x)
		}
	}
	seen[at] = false
}

// shortestByWalking gives the cheapest simple path to everywhere, and the
// smallest worst edge.
//
// Two different questions answered on the same walk, both from the
// definition: minimise the sum, or minimise the maximum.
func shortestByWalking(n int, edges []Edge, start int) ([]int, []int) {
	adj := make([][][2]int, n)
	for _, e := range edges {
		adj[e.U] = append(adj[e.U], [2]int{e.V, e.W})
		adj[e.V] = append(adj[e.V], [2]int{e.U, e.W})
	}
	cheapest := make([]int, n)
	narrowest := make([]int, n)
	for i := range cheapest {
		cheapest[i] = INF
		narrowest[i] = INF
	}
	cheapest[start] = 0
	narrowest[start] = 0
	walk(adj, make([]bool, n), cheapest, narrowest, start, 0, 0)
	return cheapest, narrowest
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
var seed int64 = 141421

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func row(text string, value int) {
	fmt.Printf("  %-42s %6d\\n", text, value)
}

func main() {
	caseN := []int{3, 4, 5}
	cases := [][]Edge{
		{{0, 1, 2}, {1, 2, 2}, {0, 2, 3}},
		{{0, 1, 1}, {1, 2, 1}, {2, 3, 1}, {0, 3, 2}},
		{{0, 1, 9}, {1, 2, 1}, {0, 2, 8}, {2, 3, 2}, {0, 3, 7}, {3, 4, 1}},
	}

	fmt.Printf("%-44s %-18s %-18s %s\\n", "edges", "tree route", "shortest", "worst edge")
	for c := range cases {
		tree := kruskal(caseN[c], cases[c])
		total, worst := walkTree(caseN[c], cases[c], tree, 0)
		cheapest, _ := shortestByWalking(caseN[c], cases[c], 0)
		fmt.Printf("%-44s %-18s %-18s %s\\n", label(cases[c]), show(total), show(cheapest), show(worst))
	}

	trials := 3000
	connected, pairs := 0, 0
	routeShortest, routeLonger, routeShorter := 0, 0, 0
	bottleneckRight, wholeTreeShortest := 0, 0
	for t := 0; t < trials; t++ {
		n := 3 + randBelow(4)
		var edges []Edge
		for u := 0; u < n; u++ {
			for v := u + 1; v < n; v++ {
				if randBelow(3) > 0 {
					edges = append(edges, Edge{u, v, 1 + randBelow(9)})
				}
			}
		}
		tree := kruskal(n, edges)
		if tree == nil {
			continue
		}
		connected++
		allMatch := true
		for start := 0; start < n; start++ {
			total, worst := walkTree(n, edges, tree, start)
			cheapest, narrowest := shortestByWalking(n, edges, start)
			for b := 0; b < n; b++ {
				if b == start {
					continue
				}
				pairs++
				if total[b] == cheapest[b] {
					routeShortest++
				} else {
					allMatch = false
					if total[b] > cheapest[b] {
						routeLonger++
					} else {
						routeShorter++
					}
				}
				if worst[b] == narrowest[b] {
					bottleneckRight++
				}
			}
		}
		if allMatch {
			wholeTreeShortest++
		}
	}

	fmt.Println()
	fmt.Printf("over the %d connected graphs among %d random ones on 3 to 6 nodes:\\n", connected, trials)
	row("ordered pairs of nodes examined", pairs)
	row("tree route was also the shortest route", routeShortest)
	row("tree route was longer", routeLonger)
	row("tree route was shorter", routeShorter)
	row("graphs where every pair matched", wholeTreeShortest)
	fmt.Println()
	row("tree route's worst edge was the smallest", bottleneckRight)
	row("out of pairs examined", pairs)

	fmt.Println()
	fmt.Printf("The tree route was the shortest route on %d of %d pairs, and on the\\n", routeShortest, pairs)
	fmt.Printf("other %d it was longer -- never shorter, which it could not be, since\\n", routeLonger)
	fmt.Printf("the tree route is a route. Only %d of %d graphs had a tree whose\\n", wholeTreeShortest, connected)
	fmt.Println("routes were all shortest. A minimum spanning tree is not a shortest-path")
	fmt.Println("tree and there is no reason it should be: it minimises the sum over the")
	fmt.Println("whole graph, not any one route.")
	fmt.Println()
	fmt.Println("The last pair of counters is the compensation, and it is exact. On every")
	fmt.Printf("one of the %d pairs, the worst edge on the tree route was the smallest\\n", pairs)
	fmt.Println("worst edge any route could manage. So the tree answers the bottleneck")
	fmt.Println("question for every pair at once -- the maximum load a single route can")
	fmt.Println("carry, the lowest bridge on the way -- the widest-path idea from the")
	fmt.Println("Floyd-Warshall lesson, read the other way up. One tree, and every")
	fmt.Println("pair's answer is a walk.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Using the MST to answer a shortest-path question",
          body: "It was longer on 10,394 of 46,650 pairs. The failure is one-sided -- a tree route is a route, so it can never be shorter than the shortest -- which makes it exactly the kind of wrong answer that looks plausible.",
        },
        {
          title: "Reaching for a flow algorithm to find the bottleneck route",
          body: "The minimum spanning tree already holds it, for every pair at once: on all 46,650 pairs the worst edge on the tree route was the smallest worst edge any route could manage. One Kruskal and a walk.",
        },
        {
          title: "Thinking a graph whose MST is a shortest-path tree is normal",
          body: "967 of 2,624 graphs had that property, which is common enough to mislead a handful of hand-written test cases and rare enough to break in production.",
        },
      ],
    },
    {
      id: "minimum-spanning-trees-in-four-lines",
      heading: "Minimum spanning trees in four lines",
      body: [
        "Minimum spanning trees, in four lines.",
        "**Two opposite greedy algorithms, both exactly minimum** \u2014 2,626 of 2,626 against an exhaustive enumeration of every spanning tree.",
        "**The cut property is why.** A cheapest edge across any split is in some minimum tree, on all 38,325 cuts checked; a strictly cheapest one is in every minimum tree.",
        "**\"The\" minimum tree is usually several.** Only 1,415 of 2,626 graphs had a unique one, and that is exactly the set where the tie-break stopped mattering.",
        "**It is not a shortest-path tree** \u2014 longer on 10,394 of 46,650 pairs \u2014 **but it is a bottleneck tree**, correct on all 46,650.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Describe Prim and Kruskal, and say why either one is correct.",
      answer:
        "Prim grows a single tree: start anywhere and repeatedly add the cheapest edge with exactly one end inside. Kruskal sorts every edge and adds it whenever its two ends are in different components, which is what union-find is for. Both are correct because of the cut property: for any way of splitting the nodes into two sides, the cheapest edge crossing that split is in a minimum spanning tree. Prim applies it to the split between the tree it has grown and everything else; Kruskal applies it to the split its next edge would join. I checked the property directly rather than taking it on trust -- over 38,325 cuts on random graphs, a cheapest crossing edge was in some minimum tree every time, and where it was strictly cheapest it was in every minimum tree. And I scored both algorithms against an exhaustive enumeration of every spanning tree on 2,626 connected graphs: both hit the minimum on all of them.",
    },
    {
      question: "Is the minimum spanning tree unique?",
      answer:
        "Only when the weights force it. Over 2,626 connected random graphs, exactly 1,415 had a single minimum spanning tree, and only 386 had all-distinct weights -- distinct weights guarantee uniqueness, ties are what allow several. The measurement I like here is that Prim and Kruskal returned the identical edge set on all 2,626, which sounds like a theorem and is not: both were given the same total order on edges, weight then endpoints, so they break ties identically. Flipping only the tie-break left every total unchanged -- still minimum on all 2,626 -- and changed the edge set on 1,211 of them. Those 1,415 unchanged graphs are precisely the 1,415 with a unique tree. So in a test I would assert the total, or the property, not the specific edge list.",
    },
    {
      question: "Does the minimum spanning tree give shortest paths?",
      answer:
        "No, and it is a common and expensive assumption. Over 46,650 ordered pairs on random connected graphs, the route through the tree was the shortest route 36,256 times and longer 10,394 times -- never shorter, since a tree route is still a route. Only 967 of 2,624 graphs had a tree whose routes were all shortest. There is no reason it should: an MST minimises the total weight over the whole graph, not the distance between any particular pair. What it does give exactly is the bottleneck path -- of all routes from a to b, the tree's route has the smallest possible maximum edge, and that held on all 46,650 pairs. So if the question is how small the worst edge on a route can be, the MST answers it for every pair at once; if it is the widest route — the largest possible narrowest edge — that is a maximum spanning tree instead.",
    },
    {
      question: "When would you choose Prim over Kruskal?",
      answer:
        "It comes down to what each one needs. Kruskal needs the edges sorted and a union-find, so it is natural when the edges are already in a list, are already sorted, or arrive sorted from somewhere else; the union-find part is one find and one union per edge. Prim needs a priority queue over nodes and an adjacency structure, so it fits when the graph is dense or is stored as an adjacency matrix, where the queue is over V rather than E. Both give a minimum tree, so the choice is about the data you already have rather than about the answer. And if the graph is directed, neither applies -- a minimum spanning arborescence is a different algorithm entirely.",
    },
  ],
  takeaways: [
    "Prim grows one tree; Kruskal sorts every edge. Both were exactly minimum on 2,626 of 2,626 graphs.",
    "The cut property is why: a cheapest edge across any split is in some minimum tree \u2014 38,325 of 38,325 cuts.",
    "Strictly cheapest means in *every* minimum tree; merely cheapest means in *some*.",
    "The cycle property is the same theorem backwards, and reverse-delete is its algorithm.",
    "Only 1,415 of 2,626 graphs had a unique minimum tree; distinct weights force uniqueness.",
    "Two correct algorithms agree only because they were given the same tie-break.",
    "Flipping the tie-break changed no total and changed 1,211 edge sets.",
    "An MST is not a shortest-path tree: longer on 10,394 of 46,650 pairs, never shorter.",
    "It is a bottleneck tree: the tree route's worst edge was the smallest possible on all 46,650 pairs.",
    "Test the total or the property, never the specific edge list.",
  ],
  status: "available",
};
