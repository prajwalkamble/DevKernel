import type { Lesson } from "@/content/types";

export const stronglyConnectedComponentsLesson: Lesson = {
  id: "dsa-graph-algorithms-strongly-connected-components",
  slug: "strongly-connected-components",
  moduleSlug: "graph-algorithms",
  title: "Strongly Connected Components and the Condensation",
  summary:
    "Mutual reachability in one sweep instead of n, by two algorithms that share nothing but their answer \u2014 and the word \"component\" meaning something quite different here than it does anywhere else in the course. Then the reason to compute them: collapse each one and what is left is a DAG, always, which puts every directed problem back on ground the previous lessons already covered.",
  estimatedMinutes: 45,
  objectives: [
    "State what a strongly connected component is, and what it is not",
    "Find them with Kosaraju and with Tarjan",
    "Say why the condensation cannot have a cycle",
    "Answer a reachability question on the condensation instead of the graph",
    "Count the edges needed to make a graph strongly connected",
  ],
  sections: [
    {
      id: "mutual-reachability",
      heading: "Mutual reachability",
      body: [
        "Two nodes are in the same strongly connected component when each can reach the other. That is the whole definition, and the naive way to compute it is to ask, for every ordered pair, whether both directions hold \u2014 which is the oracle the two real algorithms are scored against here.",
        "**Kosaraju** does it in two passes: record finish times on the graph, then search the graph with every edge reversed, taking nodes in reverse finish order. **Tarjan** does it in one: track, for each node, the oldest node still on the stack that its subtree can reach, and when that is the node itself, everything above it on the stack is one component.",
        "Both matched the definition on all 3,000 random graphs. Neither is doing anything clever with the definition \u2014 they compute mutual reachability, in one sweep instead of `n` sweeps.",
        "The failure worth measuring is the other one, because \"connected component\" means something else everywhere in this course and the word is the same. Rub the arrows out and take undirected components: that matched on 418 of 3,000 graphs, and wrongly merged 14,782 pairs of nodes that cannot both reach each other.",
        "It can only ever be wrong in that direction \u2014 rubbing out an arrow adds routes, it never removes one. And the whole distinction fits on four nodes: the path `0\u21921\u21922\u21923` has **four** components, one per node, because no two of them can reach each other both ways. The arrows-ignored answer is one.",
      ],
      examples: [
        {
          id: "kosaraju-and-tarjan",
          title: "Two algorithms, the definition, and the wrong answer that shares the name",
          lang: "python",
          code: `# Two nodes are in the same strongly connected component when each can reach
# the other. Two algorithms, one definition.
#
# The definition is symmetric and easy to state, and the naive way to compute
# it is to ask, for every ordered pair, whether each reaches the other. That is
# the oracle below. The two real algorithms both do it in one linear sweep of
# the graph, and they do it in completely different ways:
#
#   Kosaraju -- two passes. Finish times on the graph, then a second search on
#               the graph with every edge reversed, in reverse finish order.
#   Tarjan   -- one pass. Track, for each node, the oldest node still on the
#               stack that its subtree can reach. When that is the node itself,
#               everything above it on the stack is one component.
#
# Components are named by their smallest node here, so the three answers can be
# compared without worrying about which order anything came out in.


def reachability(n, edges):
    """Who can reach whom, by closure. The definition has to come from somewhere."""
    reach = [[False] * n for _ in range(n)]
    for i in range(n):
        reach[i][i] = True
    for u, v in edges:
        reach[u][v] = True
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if reach[i][k] and reach[k][j]:
                    reach[i][j] = True
    return reach


def by_definition(n, edges):
    """Each node labelled with the smallest node it is mutually reachable with."""
    reach = reachability(n, edges)
    label = [0] * n
    for v in range(n):
        label[v] = min(u for u in range(n) if reach[u][v] and reach[v][u])
    return label


def kosaraju(n, edges):
    """Finish times forwards, then components backwards."""
    out = [[] for _ in range(n)]
    back = [[] for _ in range(n)]
    for u, v in edges:
        out[u].append(v)
        back[v].append(u)

    seen = [False] * n
    order = []

    def first(at):
        seen[at] = True
        for nxt in out[at]:
            if not seen[nxt]:
                first(nxt)
        order.append(at)

    for v in range(n):
        if not seen[v]:
            first(v)

    label = [-1] * n

    def second(at, root):
        label[at] = root
        for nxt in back[at]:
            if label[nxt] < 0:
                second(nxt, root)

    for v in reversed(order):
        if label[v] < 0:
            second(v, v)
    # Rename each component after its smallest member, so the answer does not
    # depend on which node the second pass happened to start from.
    smallest = {}
    for v in range(n):
        if label[v] not in smallest or v < smallest[label[v]]:
            smallest[label[v]] = v
    return [smallest[label[v]] for v in range(n)]


def tarjan(n, edges):
    """One pass, with a lowlink: the oldest stacked node this subtree can reach."""
    out = [[] for _ in range(n)]
    for u, v in edges:
        out[u].append(v)

    index = [-1] * n
    low = [0] * n
    on_stack = [False] * n
    stack = []
    label = [-1] * n
    counter = [0]

    def visit(at):
        index[at] = low[at] = counter[0]
        counter[0] += 1
        stack.append(at)
        on_stack[at] = True
        for nxt in out[at]:
            if index[nxt] < 0:
                visit(nxt)
                if low[nxt] < low[at]:
                    low[at] = low[nxt]
            elif on_stack[nxt]:
                # A back edge to something still open. Its index, not its
                # lowlink -- the lowlink belongs to a component still forming.
                if index[nxt] < low[at]:
                    low[at] = index[nxt]
        if low[at] == index[at]:
            root = at
            while True:
                w = stack.pop()
                on_stack[w] = False
                label[w] = root
                if w == root:
                    break

    for v in range(n):
        if index[v] < 0:
            visit(v)

    smallest = {}
    for v in range(n):
        if label[v] not in smallest or v < smallest[label[v]]:
            smallest[label[v]] = v
    return [smallest[label[v]] for v in range(n)]


def ignoring_direction(n, edges):
    """The tempting wrong answer: rub the arrows out and take components."""
    parent = list(range(n))

    def find(v):
        while parent[v] != v:
            parent[v] = parent[parent[v]]
            v = parent[v]
        return v

    for u, v in edges:
        ru, rv = find(u), find(v)
        if ru != rv:
            parent[max(ru, rv)] = min(ru, rv)
    return [find(v) for v in range(n)]


def show(label):
    return " ".join(str(x) for x in label)


def describe(edges):
    return "[" + ", ".join("%d->%d" % e for e in edges) + "]"


CASES = [
    (4, [(0, 1), (1, 2), (2, 0), (2, 3)]),
    (4, [(0, 1), (1, 2), (2, 3)]),
    (6, [(0, 1), (1, 2), (2, 0), (3, 4), (4, 5), (5, 3), (2, 3)]),
]

print("%-46s %-13s %-13s %s" % ("edges", "Kosaraju", "Tarjan", "arrows ignored"))
for n, edges in CASES:
    print("%-46s %-13s %-13s %s" % (
        describe(edges), show(kosaraju(n, edges)), show(tarjan(n, edges)),
        show(ignoring_direction(n, edges))))

# The same linear congruential generator in every language, so the random
# graphs below are the same graphs whichever translation is run.
seed = 90909


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


trials = 3000
kosaraju_ok = tarjan_ok = ignoring_ok = 0
total_components = 0
merged_wrongly = 0
for _ in range(trials):
    n = 3 + rand(4)
    edges = []
    for u in range(n):
        for v in range(n):
            if u != v and rand(4) == 0:
                edges.append((u, v))
    want = by_definition(n, edges)
    kosaraju_ok += kosaraju(n, edges) == want
    tarjan_ok += tarjan(n, edges) == want
    loose = ignoring_direction(n, edges)
    ignoring_ok += loose == want
    total_components += len(set(want))
    for u in range(n):
        for v in range(u + 1, n):
            if loose[u] == loose[v] and want[u] != want[v]:
                merged_wrongly += 1

print()
print("over %d random directed graphs on 3 to 6 nodes:" % trials)
print("  %-42s %6d" % ("Kosaraju matched the definition", kosaraju_ok))
print("  %-42s %6d" % ("Tarjan matched it", tarjan_ok))
print("  %-42s %6d" % ("ignoring the arrows matched it", ignoring_ok))
print("  %-42s %6d" % ("pairs it merged that are not mutual", merged_wrongly))
print("  %-42s %6d" % ("components found in total", total_components))

print()
print("Both algorithms are exact. Neither is doing anything clever with the")
print("definition -- they are computing mutual reachability, in one sweep")
print("instead of n sweeps.")
print()
print("Ignoring the arrows is the failure worth measuring, because it is what")
print("\\"connected component\\" means everywhere else and the word is the same. It")
print("matched on %d of %d graphs and wrongly merged %d pairs of nodes that" % (ignoring_ok, trials, merged_wrongly))
print("cannot both reach each other. It can only ever be wrong in that")
print("direction: rubbing out an arrow adds routes, it never removes one.")
print()
print("The demo's second row is the whole distinction on four nodes. A path")
print("0->1->2->3 has four components, one per node, because no two of them")
print("can reach each other both ways -- while the arrows-ignored column calls")
print("the whole thing one component.")
`,
          output: `edges                                          Kosaraju      Tarjan        arrows ignored
[0->1, 1->2, 2->0, 2->3]                       0 0 0 3       0 0 0 3       0 0 0 0
[0->1, 1->2, 2->3]                             0 1 2 3       0 1 2 3       0 0 0 0
[0->1, 1->2, 2->0, 3->4, 4->5, 5->3, 2->3]     0 0 0 3 3 3   0 0 0 3 3 3   0 0 0 0 0 0

over 3000 random directed graphs on 3 to 6 nodes:
  Kosaraju matched the definition              3000
  Tarjan matched it                            3000
  ignoring the arrows matched it                418
  pairs it merged that are not mutual         14782
  components found in total                   10849

Both algorithms are exact. Neither is doing anything clever with the
definition -- they are computing mutual reachability, in one sweep
instead of n sweeps.

Ignoring the arrows is the failure worth measuring, because it is what
"connected component" means everywhere else and the word is the same. It
matched on 418 of 3000 graphs and wrongly merged 14782 pairs of nodes that
cannot both reach each other. It can only ever be wrong in that
direction: rubbing out an arrow adds routes, it never removes one.

The demo's second row is the whole distinction on four nodes. A path
0->1->2->3 has four components, one per node, because no two of them
can reach each other both ways -- while the arrows-ignored column calls
the whole thing one component.`,
          explanation:
            "Both algorithms scored against mutual reachability computed by closure, with undirected components alongside for contrast. The direction of that third column's error is the part to notice.",
          alternates: [
            {
              lang: "javascript",
              code: `// Two nodes are in the same strongly connected component when each can reach
// the other. Two algorithms, one definition.
//
// The definition is symmetric and easy to state, and the naive way to compute
// it is to ask, for every ordered pair, whether each reaches the other. That is
// the oracle below. The two real algorithms both do it in one linear sweep of
// the graph, and they do it in completely different ways:
//
//   Kosaraju -- two passes. Finish times on the graph, then a second search on
//               the graph with every edge reversed, in reverse finish order.
//   Tarjan   -- one pass. Track, for each node, the oldest node still on the
//               stack that its subtree can reach. When that is the node itself,
//               everything above it on the stack is one component.
//
// Components are named by their smallest node here, so the three answers can be
// compared without worrying about which order anything came out in.

// Who can reach whom, by closure. The definition has to come from somewhere.
function reachability(n, edges) {
  const reach = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let i = 0; i < n; i += 1) reach[i][i] = true;
  for (const [u, v] of edges) reach[u][v] = true;
  for (let k = 0; k < n; k += 1)
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1)
        if (reach[i][k] && reach[k][j]) reach[i][j] = true;
  return reach;
}

// Each node labelled with the smallest node it is mutually reachable with.
function byDefinition(n, edges) {
  const reach = reachability(n, edges);
  const label = new Array(n).fill(0);
  for (let v = 0; v < n; v += 1) {
    let smallest = v;
    for (let u = 0; u < n; u += 1)
      if (reach[u][v] && reach[v][u] && u < smallest) smallest = u;
    label[v] = smallest;
  }
  return label;
}

// Rename each component after its smallest member, so the answer does not
// depend on which node a pass happened to start from.
function canonical(n, label) {
  const smallest = new Map();
  for (let v = 0; v < n; v += 1) {
    const key = label[v];
    if (!smallest.has(key) || v < smallest.get(key)) smallest.set(key, v);
  }
  return label.map((key) => smallest.get(key));
}

// Finish times forwards, then components backwards.
function kosaraju(n, edges) {
  const out = Array.from({ length: n }, () => []);
  const back = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    out[u].push(v);
    back[v].push(u);
  }

  const seen = new Array(n).fill(false);
  const order = [];

  const first = (at) => {
    seen[at] = true;
    for (const nxt of out[at]) if (!seen[nxt]) first(nxt);
    order.push(at);
  };

  for (let v = 0; v < n; v += 1) if (!seen[v]) first(v);

  const label = new Array(n).fill(-1);

  const second = (at, root) => {
    label[at] = root;
    for (const nxt of back[at]) if (label[nxt] < 0) second(nxt, root);
  };

  for (let i = order.length - 1; i >= 0; i -= 1) {
    const v = order[i];
    if (label[v] < 0) second(v, v);
  }
  return canonical(n, label);
}

// One pass, with a lowlink: the oldest stacked node this subtree can reach.
function tarjan(n, edges) {
  const out = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) out[u].push(v);

  const index = new Array(n).fill(-1);
  const low = new Array(n).fill(0);
  const onStack = new Array(n).fill(false);
  const stack = [];
  const label = new Array(n).fill(-1);
  let counter = 0;

  const visit = (at) => {
    index[at] = counter;
    low[at] = counter;
    counter += 1;
    stack.push(at);
    onStack[at] = true;
    for (const nxt of out[at]) {
      if (index[nxt] < 0) {
        visit(nxt);
        if (low[nxt] < low[at]) low[at] = low[nxt];
      } else if (onStack[nxt]) {
        // A back edge to something still open. Its index, not its lowlink --
        // the lowlink belongs to a component still forming.
        if (index[nxt] < low[at]) low[at] = index[nxt];
      }
    }
    if (low[at] === index[at]) {
      for (;;) {
        const w = stack.pop();
        onStack[w] = false;
        label[w] = at;
        if (w === at) break;
      }
    }
  };

  for (let v = 0; v < n; v += 1) if (index[v] < 0) visit(v);
  return canonical(n, label);
}

// The tempting wrong answer: rub the arrows out and take components.
function ignoringDirection(n, edges) {
  const parent = Array.from({ length: n }, (_, i) => i);

  const find = (v) => {
    let at = v;
    while (parent[at] !== at) {
      parent[at] = parent[parent[at]];
      at = parent[at];
    }
    return at;
  };

  for (const [u, v] of edges) {
    const ru = find(u);
    const rv = find(v);
    if (ru !== rv) parent[Math.max(ru, rv)] = Math.min(ru, rv);
  }
  return Array.from({ length: n }, (_, v) => find(v));
}

function show(label) {
  return label.join(" ");
}

function describe(edges) {
  return "[" + edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ") + "]";
}

const CASES = [
  [4, [[0, 1], [1, 2], [2, 0], [2, 3]]],
  [4, [[0, 1], [1, 2], [2, 3]]],
  [6, [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3], [2, 3]]],
];

console.log(
  "edges".padEnd(46) + " " + "Kosaraju".padEnd(13) + " " + "Tarjan".padEnd(13) + " " +
  "arrows ignored",
);
for (const [n, edges] of CASES) {
  console.log(
    describe(edges).padEnd(46) + " " + show(kosaraju(n, edges)).padEnd(13) + " " +
    show(tarjan(n, edges)).padEnd(13) + " " + show(ignoringDirection(n, edges)),
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 90909n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let kosarajuOk = 0;
let tarjanOk = 0;
let ignoringOk = 0;
let totalComponents = 0;
let mergedWrongly = 0;
const same = (a, b) => a.every((x, i) => x === b[i]);
for (let t = 0; t < trials; t += 1) {
  const n = 3 + rand(4);
  const edges = [];
  for (let u = 0; u < n; u += 1)
    for (let v = 0; v < n; v += 1)
      if (u !== v && rand(4) === 0) edges.push([u, v]);
  const want = byDefinition(n, edges);
  if (same(kosaraju(n, edges), want)) kosarajuOk += 1;
  if (same(tarjan(n, edges), want)) tarjanOk += 1;
  const loose = ignoringDirection(n, edges);
  if (same(loose, want)) ignoringOk += 1;
  totalComponents += new Set(want).size;
  for (let u = 0; u < n; u += 1)
    for (let v = u + 1; v < n; v += 1)
      if (loose[u] === loose[v] && want[u] !== want[v]) mergedWrongly += 1;
}

const row = (text, value) => "  " + text.padEnd(42) + " " + String(value).padStart(6);

console.log();
console.log(\`over \${trials} random directed graphs on 3 to 6 nodes:\`);
console.log(row("Kosaraju matched the definition", kosarajuOk));
console.log(row("Tarjan matched it", tarjanOk));
console.log(row("ignoring the arrows matched it", ignoringOk));
console.log(row("pairs it merged that are not mutual", mergedWrongly));
console.log(row("components found in total", totalComponents));

console.log();
console.log("Both algorithms are exact. Neither is doing anything clever with the");
console.log("definition -- they are computing mutual reachability, in one sweep");
console.log("instead of n sweeps.");
console.log();
console.log("Ignoring the arrows is the failure worth measuring, because it is what");
console.log('"connected component" means everywhere else and the word is the same. It');
console.log(\`matched on \${ignoringOk} of \${trials} graphs and wrongly merged \${mergedWrongly} pairs of nodes that\`);
console.log("cannot both reach each other. It can only ever be wrong in that");
console.log("direction: rubbing out an arrow adds routes, it never removes one.");
console.log();
console.log("The demo's second row is the whole distinction on four nodes. A path");
console.log("0->1->2->3 has four components, one per node, because no two of them");
console.log("can reach each other both ways -- while the arrows-ignored column calls");
console.log("the whole thing one component.");
`,
            },
            {
              lang: "typescript",
              code: `// Two nodes are in the same strongly connected component when each can reach
// the other. Two algorithms, one definition.
//
// The definition is symmetric and easy to state, and the naive way to compute
// it is to ask, for every ordered pair, whether each reaches the other. That is
// the oracle below. The two real algorithms both do it in one linear sweep of
// the graph, and they do it in completely different ways:
//
//   Kosaraju -- two passes. Finish times on the graph, then a second search on
//               the graph with every edge reversed, in reverse finish order.
//   Tarjan   -- one pass. Track, for each node, the oldest node still on the
//               stack that its subtree can reach. When that is the node itself,
//               everything above it on the stack is one component.
//
// Components are named by their smallest node here, so the three answers can be
// compared without worrying about which order anything came out in.

// Who can reach whom, by closure. The definition has to come from somewhere.
function reachability(n: number, edges: number[][]): boolean[][] {
  const reach = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let i = 0; i < n; i += 1) reach[i][i] = true;
  for (const [u, v] of edges) reach[u][v] = true;
  for (let k = 0; k < n; k += 1)
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1)
        if (reach[i][k] && reach[k][j]) reach[i][j] = true;
  return reach;
}

// Each node labelled with the smallest node it is mutually reachable with.
function byDefinition(n: number, edges: number[][]): number[] {
  const reach = reachability(n, edges);
  const label = new Array(n).fill(0);
  for (let v = 0; v < n; v += 1) {
    let smallest = v;
    for (let u = 0; u < n; u += 1)
      if (reach[u][v] && reach[v][u] && u < smallest) smallest = u;
    label[v] = smallest;
  }
  return label;
}

// Rename each component after its smallest member, so the answer does not
// depend on which node a pass happened to start from.
function canonical(n: number, label: number[]): number[] {
  const smallest = new Map<number, number>();
  for (let v = 0; v < n; v += 1) {
    const key = label[v];
    if (!smallest.has(key) || v < (smallest.get(key) as number)) smallest.set(key, v);
  }
  return label.map((key) => smallest.get(key) as number);
}

// Finish times forwards, then components backwards.
function kosaraju(n: number, edges: number[][]): number[] {
  const out: number[][] = Array.from({ length: n }, () => []);
  const back: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    out[u].push(v);
    back[v].push(u);
  }

  const seen = new Array(n).fill(false);
  const order: number[] = [];

  const first = (at: number): void => {
    seen[at] = true;
    for (const nxt of out[at]) if (!seen[nxt]) first(nxt);
    order.push(at);
  };

  for (let v = 0; v < n; v += 1) if (!seen[v]) first(v);

  const label = new Array(n).fill(-1);

  const second = (at: number, root: number): void => {
    label[at] = root;
    for (const nxt of back[at]) if (label[nxt] < 0) second(nxt, root);
  };

  for (let i = order.length - 1; i >= 0; i -= 1) {
    const v = order[i];
    if (label[v] < 0) second(v, v);
  }
  return canonical(n, label);
}

// One pass, with a lowlink: the oldest stacked node this subtree can reach.
function tarjan(n: number, edges: number[][]): number[] {
  const out: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) out[u].push(v);

  const index = new Array(n).fill(-1);
  const low = new Array(n).fill(0);
  const onStack = new Array(n).fill(false);
  const stack: number[] = [];
  const label = new Array(n).fill(-1);
  let counter = 0;

  const visit = (at: number): void => {
    index[at] = counter;
    low[at] = counter;
    counter += 1;
    stack.push(at);
    onStack[at] = true;
    for (const nxt of out[at]) {
      if (index[nxt] < 0) {
        visit(nxt);
        if (low[nxt] < low[at]) low[at] = low[nxt];
      } else if (onStack[nxt]) {
        // A back edge to something still open. Its index, not its lowlink --
        // the lowlink belongs to a component still forming.
        if (index[nxt] < low[at]) low[at] = index[nxt];
      }
    }
    if (low[at] === index[at]) {
      for (;;) {
        const w = stack.pop() as number;
        onStack[w] = false;
        label[w] = at;
        if (w === at) break;
      }
    }
  };

  for (let v = 0; v < n; v += 1) if (index[v] < 0) visit(v);
  return canonical(n, label);
}

// The tempting wrong answer: rub the arrows out and take components.
function ignoringDirection(n: number, edges: number[][]): number[] {
  const parent = Array.from({ length: n }, (_, i) => i);

  const find = (v: number): number => {
    let at = v;
    while (parent[at] !== at) {
      parent[at] = parent[parent[at]];
      at = parent[at];
    }
    return at;
  };

  for (const [u, v] of edges) {
    const ru = find(u);
    const rv = find(v);
    if (ru !== rv) parent[Math.max(ru, rv)] = Math.min(ru, rv);
  }
  return Array.from({ length: n }, (_, v) => find(v));
}

function show(label: number[]): string {
  return label.join(" ");
}

function describe(edges: number[][]): string {
  return "[" + edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ") + "]";
}

const CASES: [number, number[][]][] = [
  [4, [[0, 1], [1, 2], [2, 0], [2, 3]]],
  [4, [[0, 1], [1, 2], [2, 3]]],
  [6, [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3], [2, 3]]],
];

console.log(
  "edges".padEnd(46) + " " + "Kosaraju".padEnd(13) + " " + "Tarjan".padEnd(13) + " " +
  "arrows ignored",
);
for (const [n, edges] of CASES) {
  console.log(
    describe(edges).padEnd(46) + " " + show(kosaraju(n, edges)).padEnd(13) + " " +
    show(tarjan(n, edges)).padEnd(13) + " " + show(ignoringDirection(n, edges)),
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 90909n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let kosarajuOk = 0;
let tarjanOk = 0;
let ignoringOk = 0;
let totalComponents = 0;
let mergedWrongly = 0;
const same = (a: number[], b: number[]): boolean => a.every((x, i) => x === b[i]);
for (let t = 0; t < trials; t += 1) {
  const n = 3 + rand(4);
  const edges: number[][] = [];
  for (let u = 0; u < n; u += 1)
    for (let v = 0; v < n; v += 1)
      if (u !== v && rand(4) === 0) edges.push([u, v]);
  const want = byDefinition(n, edges);
  if (same(kosaraju(n, edges), want)) kosarajuOk += 1;
  if (same(tarjan(n, edges), want)) tarjanOk += 1;
  const loose = ignoringDirection(n, edges);
  if (same(loose, want)) ignoringOk += 1;
  totalComponents += new Set(want).size;
  for (let u = 0; u < n; u += 1)
    for (let v = u + 1; v < n; v += 1)
      if (loose[u] === loose[v] && want[u] !== want[v]) mergedWrongly += 1;
}

const row = (text: string, value: number): string => "  " + text.padEnd(42) + " " + String(value).padStart(6);

console.log();
console.log(\`over \${trials} random directed graphs on 3 to 6 nodes:\`);
console.log(row("Kosaraju matched the definition", kosarajuOk));
console.log(row("Tarjan matched it", tarjanOk));
console.log(row("ignoring the arrows matched it", ignoringOk));
console.log(row("pairs it merged that are not mutual", mergedWrongly));
console.log(row("components found in total", totalComponents));

console.log();
console.log("Both algorithms are exact. Neither is doing anything clever with the");
console.log("definition -- they are computing mutual reachability, in one sweep");
console.log("instead of n sweeps.");
console.log();
console.log("Ignoring the arrows is the failure worth measuring, because it is what");
console.log('"connected component" means everywhere else and the word is the same. It');
console.log(\`matched on \${ignoringOk} of \${trials} graphs and wrongly merged \${mergedWrongly} pairs of nodes that\`);
console.log("cannot both reach each other. It can only ever be wrong in that");
console.log("direction: rubbing out an arrow adds routes, it never removes one.");
console.log();
console.log("The demo's second row is the whole distinction on four nodes. A path");
console.log("0->1->2->3 has four components, one per node, because no two of them");
console.log("can reach each other both ways -- while the arrows-ignored column calls");
console.log("the whole thing one component.");
`,
            },
            {
              lang: "java",
              code: `// Two nodes are in the same strongly connected component when each can reach
// the other. Two algorithms, one definition.
//
// The definition is symmetric and easy to state, and the naive way to compute
// it is to ask, for every ordered pair, whether each reaches the other. That is
// the oracle below. The two real algorithms both do it in one linear sweep of
// the graph, and they do it in completely different ways:
//
//   Kosaraju -- two passes. Finish times on the graph, then a second search on
//               the graph with every edge reversed, in reverse finish order.
//   Tarjan   -- one pass. Track, for each node, the oldest node still on the
//               stack that its subtree can reach. When that is the node itself,
//               everything above it on the stack is one component.
//
// Components are named by their smallest node here, so the three answers can be
// compared without worrying about which order anything came out in.
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class Main {
    /** Who can reach whom, by closure. The definition has to come from somewhere. */
    static boolean[][] reachability(int n, int[][] edges) {
        boolean[][] reach = new boolean[n][n];
        for (int i = 0; i < n; i++) reach[i][i] = true;
        for (int[] e : edges) reach[e[0]][e[1]] = true;
        for (int k = 0; k < n; k++)
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++)
                    if (reach[i][k] && reach[k][j]) reach[i][j] = true;
        return reach;
    }

    /** Each node labelled with the smallest node it is mutually reachable with. */
    static int[] byDefinition(int n, int[][] edges) {
        boolean[][] reach = reachability(n, edges);
        int[] label = new int[n];
        for (int v = 0; v < n; v++) {
            int smallest = v;
            for (int u = 0; u < n; u++)
                if (reach[u][v] && reach[v][u] && u < smallest) smallest = u;
            label[v] = smallest;
        }
        return label;
    }

    /**
     * Rename each component after its smallest member, so the answer does not
     * depend on which node a pass happened to start from.
     */
    static int[] canonical(int n, int[] label) {
        Map<Integer, Integer> smallest = new HashMap<>();
        for (int v = 0; v < n; v++) {
            int key = label[v];
            if (!smallest.containsKey(key) || v < smallest.get(key)) smallest.put(key, v);
        }
        int[] out = new int[n];
        for (int v = 0; v < n; v++) out[v] = smallest.get(label[v]);
        return out;
    }

    static void first(List<Integer>[] out, boolean[] seen, List<Integer> order, int at) {
        seen[at] = true;
        for (int nxt : out[at]) if (!seen[nxt]) first(out, seen, order, nxt);
        order.add(at);
    }

    static void second(List<Integer>[] back, int[] label, int at, int root) {
        label[at] = root;
        for (int nxt : back[at]) if (label[nxt] < 0) second(back, label, nxt, root);
    }

    /** Finish times forwards, then components backwards. */
    static int[] kosaraju(int n, int[][] edges) {
        @SuppressWarnings("unchecked")
        List<Integer>[] out = new List[n];
        @SuppressWarnings("unchecked")
        List<Integer>[] back = new List[n];
        for (int i = 0; i < n; i++) {
            out[i] = new ArrayList<>();
            back[i] = new ArrayList<>();
        }
        for (int[] e : edges) {
            out[e[0]].add(e[1]);
            back[e[1]].add(e[0]);
        }

        boolean[] seen = new boolean[n];
        List<Integer> order = new ArrayList<>();
        for (int v = 0; v < n; v++) if (!seen[v]) first(out, seen, order, v);

        int[] label = new int[n];
        Arrays.fill(label, -1);
        for (int i = order.size() - 1; i >= 0; i--) {
            int v = order.get(i);
            if (label[v] < 0) second(back, label, v, v);
        }
        return canonical(n, label);
    }

    static int[] index;
    static int[] low;
    static boolean[] onStack;
    static List<Integer> stack;
    static int[] tarjanLabel;
    static int counter;

    static void visit(List<Integer>[] out, int at) {
        index[at] = counter;
        low[at] = counter;
        counter++;
        stack.add(at);
        onStack[at] = true;
        for (int nxt : out[at]) {
            if (index[nxt] < 0) {
                visit(out, nxt);
                if (low[nxt] < low[at]) low[at] = low[nxt];
            } else if (onStack[nxt]) {
                // A back edge to something still open. Its index, not its
                // lowlink -- the lowlink belongs to a component still forming.
                if (index[nxt] < low[at]) low[at] = index[nxt];
            }
        }
        if (low[at] == index[at]) {
            while (true) {
                int w = stack.remove(stack.size() - 1);
                onStack[w] = false;
                tarjanLabel[w] = at;
                if (w == at) break;
            }
        }
    }

    /** One pass, with a lowlink: the oldest stacked node this subtree can reach. */
    static int[] tarjan(int n, int[][] edges) {
        @SuppressWarnings("unchecked")
        List<Integer>[] out = new List[n];
        for (int i = 0; i < n; i++) out[i] = new ArrayList<>();
        for (int[] e : edges) out[e[0]].add(e[1]);

        index = new int[n];
        low = new int[n];
        onStack = new boolean[n];
        stack = new ArrayList<>();
        tarjanLabel = new int[n];
        counter = 0;
        Arrays.fill(index, -1);
        Arrays.fill(tarjanLabel, -1);
        for (int v = 0; v < n; v++) if (index[v] < 0) visit(out, v);
        return canonical(n, tarjanLabel);
    }

    static int find(int[] parent, int v) {
        while (parent[v] != v) {
            parent[v] = parent[parent[v]];
            v = parent[v];
        }
        return v;
    }

    /** The tempting wrong answer: rub the arrows out and take components. */
    static int[] ignoringDirection(int n, int[][] edges) {
        int[] parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        for (int[] e : edges) {
            int ru = find(parent, e[0]), rv = find(parent, e[1]);
            if (ru != rv) parent[Math.max(ru, rv)] = Math.min(ru, rv);
        }
        int[] out = new int[n];
        for (int v = 0; v < n; v++) out[v] = find(parent, v);
        return out;
    }

    static String show(int[] label) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < label.length; i++) {
            if (i > 0) sb.append(" ");
            sb.append(label[i]);
        }
        return sb.toString();
    }

    static String describe(int[][] edges) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < edges.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(edges[i][0]).append("->").append(edges[i][1]);
        }
        return sb.append("]").toString();
    }

    // The same linear congruential generator in every language, so the random
    // graphs below are the same graphs whichever translation is run.
    static long seed = 90909L;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    static String row(String text, int value) {
        return String.format("  %-42s %6d", text, value);
    }

    public static void main(String[] args) {
        int[] caseN = {4, 4, 6};
        int[][][] caseEdges = {
            {{0, 1}, {1, 2}, {2, 0}, {2, 3}},
            {{0, 1}, {1, 2}, {2, 3}},
            {{0, 1}, {1, 2}, {2, 0}, {3, 4}, {4, 5}, {5, 3}, {2, 3}},
        };

        System.out.printf("%-46s %-13s %-13s %s%n",
            "edges", "Kosaraju", "Tarjan", "arrows ignored");
        for (int c = 0; c < caseN.length; c++) {
            System.out.printf("%-46s %-13s %-13s %s%n", describe(caseEdges[c]),
                show(kosaraju(caseN[c], caseEdges[c])), show(tarjan(caseN[c], caseEdges[c])),
                show(ignoringDirection(caseN[c], caseEdges[c])));
        }

        int trials = 3000;
        int kosarajuOk = 0, tarjanOk = 0, ignoringOk = 0;
        int totalComponents = 0, mergedWrongly = 0;
        for (int t = 0; t < trials; t++) {
            int n = 3 + rand(4);
            List<int[]> built = new ArrayList<>();
            for (int u = 0; u < n; u++)
                for (int v = 0; v < n; v++)
                    if (u != v && rand(4) == 0) built.add(new int[] {u, v});
            int[][] edges = built.toArray(new int[0][]);
            int[] want = byDefinition(n, edges);
            if (Arrays.equals(kosaraju(n, edges), want)) kosarajuOk++;
            if (Arrays.equals(tarjan(n, edges), want)) tarjanOk++;
            int[] loose = ignoringDirection(n, edges);
            if (Arrays.equals(loose, want)) ignoringOk++;
            Set<Integer> distinct = new HashSet<>();
            for (int x : want) distinct.add(x);
            totalComponents += distinct.size();
            for (int u = 0; u < n; u++)
                for (int v = u + 1; v < n; v++)
                    if (loose[u] == loose[v] && want[u] != want[v]) mergedWrongly++;
        }

        System.out.println();
        System.out.println("over " + trials + " random directed graphs on 3 to 6 nodes:");
        System.out.println(row("Kosaraju matched the definition", kosarajuOk));
        System.out.println(row("Tarjan matched it", tarjanOk));
        System.out.println(row("ignoring the arrows matched it", ignoringOk));
        System.out.println(row("pairs it merged that are not mutual", mergedWrongly));
        System.out.println(row("components found in total", totalComponents));

        System.out.println();
        System.out.println("Both algorithms are exact. Neither is doing anything clever with the");
        System.out.println("definition -- they are computing mutual reachability, in one sweep");
        System.out.println("instead of n sweeps.");
        System.out.println();
        System.out.println("Ignoring the arrows is the failure worth measuring, because it is what");
        System.out.println("\\"connected component\\" means everywhere else and the word is the same. It");
        System.out.println("matched on " + ignoringOk + " of " + trials + " graphs and wrongly merged "
            + mergedWrongly + " pairs of nodes that");
        System.out.println("cannot both reach each other. It can only ever be wrong in that");
        System.out.println("direction: rubbing out an arrow adds routes, it never removes one.");
        System.out.println();
        System.out.println("The demo's second row is the whole distinction on four nodes. A path");
        System.out.println("0->1->2->3 has four components, one per node, because no two of them");
        System.out.println("can reach each other both ways -- while the arrows-ignored column calls");
        System.out.println("the whole thing one component.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Two nodes are in the same strongly connected component when each can reach
// the other. Two algorithms, one definition.
//
// The definition is symmetric and easy to state, and the naive way to compute
// it is to ask, for every ordered pair, whether each reaches the other. That is
// the oracle below. The two real algorithms both do it in one linear sweep of
// the graph, and they do it in completely different ways:
//
//   Kosaraju -- two passes. Finish times on the graph, then a second search on
//               the graph with every edge reversed, in reverse finish order.
//   Tarjan   -- one pass. Track, for each node, the oldest node still on the
//               stack that its subtree can reach. When that is the node itself,
//               everything above it on the stack is one component.
//
// Components are named by their smallest node here, so the three answers can be
// compared without worrying about which order anything came out in.
#include <algorithm>
#include <iomanip>
#include <iostream>
#include <map>
#include <set>
#include <string>
#include <utility>
#include <vector>

using Arrow = std::pair<int, int>;
using Labels = std::vector<int>;

// Who can reach whom, by closure. The definition has to come from somewhere.
std::vector<std::vector<bool>> reachability(int n, const std::vector<Arrow>& edges) {
    std::vector<std::vector<bool>> reach(n, std::vector<bool>(n, false));
    for (int i = 0; i < n; i++) reach[i][i] = true;
    for (const Arrow& e : edges) reach[e.first][e.second] = true;
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (reach[i][k] && reach[k][j]) reach[i][j] = true;
    return reach;
}

// Each node labelled with the smallest node it is mutually reachable with.
Labels by_definition(int n, const std::vector<Arrow>& edges) {
    std::vector<std::vector<bool>> reach = reachability(n, edges);
    Labels label(n, 0);
    for (int v = 0; v < n; v++) {
        int smallest = v;
        for (int u = 0; u < n; u++)
            if (reach[u][v] && reach[v][u] && u < smallest) smallest = u;
        label[v] = smallest;
    }
    return label;
}

// Rename each component after its smallest member, so the answer does not
// depend on which node a pass happened to start from.
Labels canonical(int n, const Labels& label) {
    std::map<int, int> smallest;
    for (int v = 0; v < n; v++) {
        int key = label[v];
        auto it = smallest.find(key);
        if (it == smallest.end() || v < it->second) smallest[key] = v;
    }
    Labels out(n, 0);
    for (int v = 0; v < n; v++) out[v] = smallest[label[v]];
    return out;
}

void first_pass(const std::vector<std::vector<int>>& out, std::vector<bool>& seen,
                std::vector<int>& order, int at) {
    seen[at] = true;
    for (int nxt : out[at])
        if (!seen[nxt]) first_pass(out, seen, order, nxt);
    order.push_back(at);
}

void second_pass(const std::vector<std::vector<int>>& back, Labels& label, int at, int root) {
    label[at] = root;
    for (int nxt : back[at])
        if (label[nxt] < 0) second_pass(back, label, nxt, root);
}

// Finish times forwards, then components backwards.
Labels kosaraju(int n, const std::vector<Arrow>& edges) {
    std::vector<std::vector<int>> out(n), back(n);
    for (const Arrow& e : edges) {
        out[e.first].push_back(e.second);
        back[e.second].push_back(e.first);
    }

    std::vector<bool> seen(n, false);
    std::vector<int> order;
    for (int v = 0; v < n; v++)
        if (!seen[v]) first_pass(out, seen, order, v);

    Labels label(n, -1);
    for (int i = static_cast<int>(order.size()) - 1; i >= 0; i--) {
        int v = order[i];
        if (label[v] < 0) second_pass(back, label, v, v);
    }
    return canonical(n, label);
}

void visit(const std::vector<std::vector<int>>& out, std::vector<int>& index,
           std::vector<int>& low, std::vector<bool>& on_stack, std::vector<int>& stack,
           Labels& label, int& counter, int at) {
    index[at] = low[at] = counter++;
    stack.push_back(at);
    on_stack[at] = true;
    for (int nxt : out[at]) {
        if (index[nxt] < 0) {
            visit(out, index, low, on_stack, stack, label, counter, nxt);
            if (low[nxt] < low[at]) low[at] = low[nxt];
        } else if (on_stack[nxt]) {
            // A back edge to something still open. Its index, not its lowlink
            // -- the lowlink belongs to a component still forming.
            if (index[nxt] < low[at]) low[at] = index[nxt];
        }
    }
    if (low[at] == index[at]) {
        for (;;) {
            int w = stack.back();
            stack.pop_back();
            on_stack[w] = false;
            label[w] = at;
            if (w == at) break;
        }
    }
}

// One pass, with a lowlink: the oldest stacked node this subtree can reach.
Labels tarjan(int n, const std::vector<Arrow>& edges) {
    std::vector<std::vector<int>> out(n);
    for (const Arrow& e : edges) out[e.first].push_back(e.second);

    std::vector<int> index(n, -1), low(n, 0), stack;
    std::vector<bool> on_stack(n, false);
    Labels label(n, -1);
    int counter = 0;
    for (int v = 0; v < n; v++)
        if (index[v] < 0) visit(out, index, low, on_stack, stack, label, counter, v);
    return canonical(n, label);
}

int find_root(std::vector<int>& parent, int v) {
    while (parent[v] != v) {
        parent[v] = parent[parent[v]];
        v = parent[v];
    }
    return v;
}

// The tempting wrong answer: rub the arrows out and take components.
Labels ignoring_direction(int n, const std::vector<Arrow>& edges) {
    std::vector<int> parent(n);
    for (int i = 0; i < n; i++) parent[i] = i;
    for (const Arrow& e : edges) {
        int ru = find_root(parent, e.first), rv = find_root(parent, e.second);
        if (ru != rv) parent[std::max(ru, rv)] = std::min(ru, rv);
    }
    Labels out(n, 0);
    for (int v = 0; v < n; v++) out[v] = find_root(parent, v);
    return out;
}

std::string show(const Labels& label) {
    std::string s;
    for (size_t i = 0; i < label.size(); i++) {
        if (i > 0) s += " ";
        s += std::to_string(label[i]);
    }
    return s;
}

std::string describe(const std::vector<Arrow>& edges) {
    std::string s = "[";
    for (size_t i = 0; i < edges.size(); i++) {
        if (i > 0) s += ", ";
        s += std::to_string(edges[i].first) + "->" + std::to_string(edges[i].second);
    }
    return s + "]";
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
long long seed = 90909;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

void row(const std::string& text, int value) {
    std::cout << "  " << std::left << std::setw(42) << text << " " << std::right
              << std::setw(6) << value << "\\n";
}

int main() {
    std::vector<int> case_n = {4, 4, 6};
    std::vector<std::vector<Arrow>> cases = {
        {{0, 1}, {1, 2}, {2, 0}, {2, 3}},
        {{0, 1}, {1, 2}, {2, 3}},
        {{0, 1}, {1, 2}, {2, 0}, {3, 4}, {4, 5}, {5, 3}, {2, 3}},
    };

    std::cout << std::left << std::setw(46) << "edges" << " " << std::setw(13) << "Kosaraju"
              << " " << std::setw(13) << "Tarjan" << " " << "arrows ignored" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        std::cout << std::left << std::setw(46) << describe(cases[c]) << " " << std::setw(13)
                  << show(kosaraju(case_n[c], cases[c])) << " " << std::setw(13)
                  << show(tarjan(case_n[c], cases[c])) << " "
                  << show(ignoring_direction(case_n[c], cases[c])) << "\\n";
    }

    int trials = 3000;
    int kosaraju_ok = 0, tarjan_ok = 0, ignoring_ok = 0;
    int total_components = 0, merged_wrongly = 0;
    for (int t = 0; t < trials; t++) {
        int n = 3 + rand_below(4);
        std::vector<Arrow> edges;
        for (int u = 0; u < n; u++)
            for (int v = 0; v < n; v++)
                if (u != v && rand_below(4) == 0) edges.push_back({u, v});
        Labels want = by_definition(n, edges);
        if (kosaraju(n, edges) == want) kosaraju_ok++;
        if (tarjan(n, edges) == want) tarjan_ok++;
        Labels loose = ignoring_direction(n, edges);
        if (loose == want) ignoring_ok++;
        std::set<int> distinct(want.begin(), want.end());
        total_components += static_cast<int>(distinct.size());
        for (int u = 0; u < n; u++)
            for (int v = u + 1; v < n; v++)
                if (loose[u] == loose[v] && want[u] != want[v]) merged_wrongly++;
    }

    std::cout << "\\n";
    std::cout << "over " << trials << " random directed graphs on 3 to 6 nodes:\\n";
    row("Kosaraju matched the definition", kosaraju_ok);
    row("Tarjan matched it", tarjan_ok);
    row("ignoring the arrows matched it", ignoring_ok);
    row("pairs it merged that are not mutual", merged_wrongly);
    row("components found in total", total_components);

    std::cout << "\\n";
    std::cout << "Both algorithms are exact. Neither is doing anything clever with the\\n";
    std::cout << "definition -- they are computing mutual reachability, in one sweep\\n";
    std::cout << "instead of n sweeps.\\n";
    std::cout << "\\n";
    std::cout << "Ignoring the arrows is the failure worth measuring, because it is what\\n";
    std::cout << "\\"connected component\\" means everywhere else and the word is the same. It\\n";
    std::cout << "matched on " << ignoring_ok << " of " << trials << " graphs and wrongly merged "
              << merged_wrongly << " pairs of nodes that\\n";
    std::cout << "cannot both reach each other. It can only ever be wrong in that\\n";
    std::cout << "direction: rubbing out an arrow adds routes, it never removes one.\\n";
    std::cout << "\\n";
    std::cout << "The demo's second row is the whole distinction on four nodes. A path\\n";
    std::cout << "0->1->2->3 has four components, one per node, because no two of them\\n";
    std::cout << "can reach each other both ways -- while the arrows-ignored column calls\\n";
    std::cout << "the whole thing one component.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Two nodes are in the same strongly connected component when each can reach
// the other. Two algorithms, one definition.
//
// The definition is symmetric and easy to state, and the naive way to compute
// it is to ask, for every ordered pair, whether each reaches the other. That is
// the oracle below. The two real algorithms both do it in one linear sweep of
// the graph, and they do it in completely different ways:
//
//   Kosaraju -- two passes. Finish times on the graph, then a second search on
//               the graph with every edge reversed, in reverse finish order.
//   Tarjan   -- one pass. Track, for each node, the oldest node still on the
//               stack that its subtree can reach. When that is the node itself,
//               everything above it on the stack is one component.
//
// Components are named by their smallest node here, so the three answers can be
// compared without worrying about which order anything came out in.
use std::collections::{BTreeMap, HashSet};

type Arrow = (usize, usize);

/// Who can reach whom, by closure. The definition has to come from somewhere.
fn reachability(n: usize, edges: &[Arrow]) -> Vec<Vec<bool>> {
    let mut reach = vec![vec![false; n]; n];
    for i in 0..n {
        reach[i][i] = true;
    }
    for &(u, v) in edges {
        reach[u][v] = true;
    }
    for k in 0..n {
        for i in 0..n {
            for j in 0..n {
                if reach[i][k] && reach[k][j] {
                    reach[i][j] = true;
                }
            }
        }
    }
    reach
}

/// Each node labelled with the smallest node it is mutually reachable with.
fn by_definition(n: usize, edges: &[Arrow]) -> Vec<usize> {
    let reach = reachability(n, edges);
    (0..n)
        .map(|v| (0..n).find(|&u| reach[u][v] && reach[v][u]).unwrap())
        .collect()
}

/// Rename each component after its smallest member, so the answer does not
/// depend on which node a pass happened to start from.
fn canonical(n: usize, label: &[i64]) -> Vec<usize> {
    let mut smallest: BTreeMap<i64, usize> = BTreeMap::new();
    for v in 0..n {
        let key = label[v];
        let entry = smallest.entry(key).or_insert(v);
        if v < *entry {
            *entry = v;
        }
    }
    (0..n).map(|v| smallest[&label[v]]).collect()
}

fn first_pass(out: &[Vec<usize>], seen: &mut [bool], order: &mut Vec<usize>, at: usize) {
    seen[at] = true;
    for idx in 0..out[at].len() {
        let nxt = out[at][idx];
        if !seen[nxt] {
            first_pass(out, seen, order, nxt);
        }
    }
    order.push(at);
}

fn second_pass(back: &[Vec<usize>], label: &mut [i64], at: usize, root: i64) {
    label[at] = root;
    for idx in 0..back[at].len() {
        let nxt = back[at][idx];
        if label[nxt] < 0 {
            second_pass(back, label, nxt, root);
        }
    }
}

/// Finish times forwards, then components backwards.
fn kosaraju(n: usize, edges: &[Arrow]) -> Vec<usize> {
    let mut out: Vec<Vec<usize>> = vec![Vec::new(); n];
    let mut back: Vec<Vec<usize>> = vec![Vec::new(); n];
    for &(u, v) in edges {
        out[u].push(v);
        back[v].push(u);
    }

    let mut seen = vec![false; n];
    let mut order: Vec<usize> = Vec::new();
    for v in 0..n {
        if !seen[v] {
            first_pass(&out, &mut seen, &mut order, v);
        }
    }

    let mut label = vec![-1i64; n];
    for &v in order.iter().rev() {
        if label[v] < 0 {
            second_pass(&back, &mut label, v, v as i64);
        }
    }
    canonical(n, &label)
}

#[allow(clippy::too_many_arguments)]
fn visit(
    out: &[Vec<usize>],
    index: &mut [i64],
    low: &mut [i64],
    on_stack: &mut [bool],
    stack: &mut Vec<usize>,
    label: &mut [i64],
    counter: &mut i64,
    at: usize,
) {
    index[at] = *counter;
    low[at] = *counter;
    *counter += 1;
    stack.push(at);
    on_stack[at] = true;
    for idx in 0..out[at].len() {
        let nxt = out[at][idx];
        if index[nxt] < 0 {
            visit(out, index, low, on_stack, stack, label, counter, nxt);
            if low[nxt] < low[at] {
                low[at] = low[nxt];
            }
        } else if on_stack[nxt] {
            // A back edge to something still open. Its index, not its lowlink
            // -- the lowlink belongs to a component still forming.
            if index[nxt] < low[at] {
                low[at] = index[nxt];
            }
        }
    }
    if low[at] == index[at] {
        loop {
            let w = stack.pop().unwrap();
            on_stack[w] = false;
            label[w] = at as i64;
            if w == at {
                break;
            }
        }
    }
}

/// One pass, with a lowlink: the oldest stacked node this subtree can reach.
fn tarjan(n: usize, edges: &[Arrow]) -> Vec<usize> {
    let mut out: Vec<Vec<usize>> = vec![Vec::new(); n];
    for &(u, v) in edges {
        out[u].push(v);
    }

    let mut index = vec![-1i64; n];
    let mut low = vec![0i64; n];
    let mut on_stack = vec![false; n];
    let mut stack: Vec<usize> = Vec::new();
    let mut label = vec![-1i64; n];
    let mut counter = 0i64;
    for v in 0..n {
        if index[v] < 0 {
            visit(
                &out,
                &mut index,
                &mut low,
                &mut on_stack,
                &mut stack,
                &mut label,
                &mut counter,
                v,
            );
        }
    }
    canonical(n, &label)
}

fn find_root(parent: &mut [usize], mut v: usize) -> usize {
    while parent[v] != v {
        parent[v] = parent[parent[v]];
        v = parent[v];
    }
    v
}

/// The tempting wrong answer: rub the arrows out and take components.
fn ignoring_direction(n: usize, edges: &[Arrow]) -> Vec<usize> {
    let mut parent: Vec<usize> = (0..n).collect();
    for &(u, v) in edges {
        let ru = find_root(&mut parent, u);
        let rv = find_root(&mut parent, v);
        if ru != rv {
            parent[ru.max(rv)] = ru.min(rv);
        }
    }
    (0..n).map(|v| find_root(&mut parent, v)).collect()
}

fn show(label: &[usize]) -> String {
    label
        .iter()
        .map(|x| x.to_string())
        .collect::<Vec<String>>()
        .join(" ")
}

fn describe(edges: &[Arrow]) -> String {
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

fn row(text: &str, value: u64) {
    println!("  {:<42} {:>6}", text, value);
}

fn main() {
    let case_n = [4usize, 4, 6];
    let cases: Vec<Vec<Arrow>> = vec![
        vec![(0, 1), (1, 2), (2, 0), (2, 3)],
        vec![(0, 1), (1, 2), (2, 3)],
        vec![(0, 1), (1, 2), (2, 0), (3, 4), (4, 5), (5, 3), (2, 3)],
    ];

    println!(
        "{:<46} {:<13} {:<13} {}",
        "edges", "Kosaraju", "Tarjan", "arrows ignored"
    );
    for c in 0..cases.len() {
        println!(
            "{:<46} {:<13} {:<13} {}",
            describe(&cases[c]),
            show(&kosaraju(case_n[c], &cases[c])),
            show(&tarjan(case_n[c], &cases[c])),
            show(&ignoring_direction(case_n[c], &cases[c]))
        );
    }

    let mut rng = Rng { seed: 90909 };
    let trials = 3000;
    let (mut kosaraju_ok, mut tarjan_ok, mut ignoring_ok) = (0u64, 0u64, 0u64);
    let (mut total_components, mut merged_wrongly) = (0u64, 0u64);
    for _ in 0..trials {
        let n = 3 + rng.next(4) as usize;
        let mut edges: Vec<Arrow> = Vec::new();
        for u in 0..n {
            for v in 0..n {
                if u != v && rng.next(4) == 0 {
                    edges.push((u, v));
                }
            }
        }
        let want = by_definition(n, &edges);
        if kosaraju(n, &edges) == want {
            kosaraju_ok += 1;
        }
        if tarjan(n, &edges) == want {
            tarjan_ok += 1;
        }
        let loose = ignoring_direction(n, &edges);
        if loose == want {
            ignoring_ok += 1;
        }
        let distinct: HashSet<usize> = want.iter().copied().collect();
        total_components += distinct.len() as u64;
        for u in 0..n {
            for v in (u + 1)..n {
                if loose[u] == loose[v] && want[u] != want[v] {
                    merged_wrongly += 1;
                }
            }
        }
    }

    println!();
    println!("over {} random directed graphs on 3 to 6 nodes:", trials);
    row("Kosaraju matched the definition", kosaraju_ok);
    row("Tarjan matched it", tarjan_ok);
    row("ignoring the arrows matched it", ignoring_ok);
    row("pairs it merged that are not mutual", merged_wrongly);
    row("components found in total", total_components);

    println!();
    println!("Both algorithms are exact. Neither is doing anything clever with the");
    println!("definition -- they are computing mutual reachability, in one sweep");
    println!("instead of n sweeps.");
    println!();
    println!("Ignoring the arrows is the failure worth measuring, because it is what");
    println!("\\"connected component\\" means everywhere else and the word is the same. It");
    println!(
        "matched on {} of {} graphs and wrongly merged {} pairs of nodes that",
        ignoring_ok, trials, merged_wrongly
    );
    println!("cannot both reach each other. It can only ever be wrong in that");
    println!("direction: rubbing out an arrow adds routes, it never removes one.");
    println!();
    println!("The demo's second row is the whole distinction on four nodes. A path");
    println!("0->1->2->3 has four components, one per node, because no two of them");
    println!("can reach each other both ways -- while the arrows-ignored column calls");
    println!("the whole thing one component.");
}
`,
            },
            {
              lang: "go",
              code: `// Two nodes are in the same strongly connected component when each can reach
// the other. Two algorithms, one definition.
//
// The definition is symmetric and easy to state, and the naive way to compute
// it is to ask, for every ordered pair, whether each reaches the other. That is
// the oracle below. The two real algorithms both do it in one linear sweep of
// the graph, and they do it in completely different ways:
//
//	Kosaraju -- two passes. Finish times on the graph, then a second search on
//	            the graph with every edge reversed, in reverse finish order.
//	Tarjan   -- one pass. Track, for each node, the oldest node still on the
//	            stack that its subtree can reach. When that is the node itself,
//	            everything above it on the stack is one component.
//
// Components are named by their smallest node here, so the three answers can be
// compared without worrying about which order anything came out in.
package main

import (
	"fmt"
	"strings"
)

// Arrow is a directed edge.
type Arrow struct {
	U, V int
}

// reachability says who can reach whom, by closure. The definition has to come
// from somewhere.
func reachability(n int, edges []Arrow) [][]bool {
	reach := make([][]bool, n)
	for i := range reach {
		reach[i] = make([]bool, n)
		reach[i][i] = true
	}
	for _, e := range edges {
		reach[e.U][e.V] = true
	}
	for k := 0; k < n; k++ {
		for i := 0; i < n; i++ {
			for j := 0; j < n; j++ {
				if reach[i][k] && reach[k][j] {
					reach[i][j] = true
				}
			}
		}
	}
	return reach
}

// byDefinition labels each node with the smallest node it is mutually
// reachable with.
func byDefinition(n int, edges []Arrow) []int {
	reach := reachability(n, edges)
	label := make([]int, n)
	for v := 0; v < n; v++ {
		smallest := v
		for u := 0; u < n; u++ {
			if reach[u][v] && reach[v][u] && u < smallest {
				smallest = u
			}
		}
		label[v] = smallest
	}
	return label
}

// canonical renames each component after its smallest member, so the answer
// does not depend on which node a pass happened to start from.
func canonical(n int, label []int) []int {
	smallest := map[int]int{}
	for v := 0; v < n; v++ {
		key := label[v]
		if cur, ok := smallest[key]; !ok || v < cur {
			smallest[key] = v
		}
	}
	out := make([]int, n)
	for v := 0; v < n; v++ {
		out[v] = smallest[label[v]]
	}
	return out
}

func firstPass(out [][]int, seen []bool, order *[]int, at int) {
	seen[at] = true
	for _, nxt := range out[at] {
		if !seen[nxt] {
			firstPass(out, seen, order, nxt)
		}
	}
	*order = append(*order, at)
}

func secondPass(back [][]int, label []int, at, root int) {
	label[at] = root
	for _, nxt := range back[at] {
		if label[nxt] < 0 {
			secondPass(back, label, nxt, root)
		}
	}
}

// kosaraju takes finish times forwards, then components backwards.
func kosaraju(n int, edges []Arrow) []int {
	out := make([][]int, n)
	back := make([][]int, n)
	for _, e := range edges {
		out[e.U] = append(out[e.U], e.V)
		back[e.V] = append(back[e.V], e.U)
	}

	seen := make([]bool, n)
	var order []int
	for v := 0; v < n; v++ {
		if !seen[v] {
			firstPass(out, seen, &order, v)
		}
	}

	label := make([]int, n)
	for i := range label {
		label[i] = -1
	}
	for i := len(order) - 1; i >= 0; i-- {
		v := order[i]
		if label[v] < 0 {
			secondPass(back, label, v, v)
		}
	}
	return canonical(n, label)
}

type tarjanState struct {
	out        [][]int
	index, low []int
	onStack    []bool
	stack      []int
	label      []int
	counter    int
}

func (s *tarjanState) visit(at int) {
	s.index[at] = s.counter
	s.low[at] = s.counter
	s.counter++
	s.stack = append(s.stack, at)
	s.onStack[at] = true
	for _, nxt := range s.out[at] {
		if s.index[nxt] < 0 {
			s.visit(nxt)
			if s.low[nxt] < s.low[at] {
				s.low[at] = s.low[nxt]
			}
		} else if s.onStack[nxt] {
			// A back edge to something still open. Its index, not its lowlink
			// -- the lowlink belongs to a component still forming.
			if s.index[nxt] < s.low[at] {
				s.low[at] = s.index[nxt]
			}
		}
	}
	if s.low[at] == s.index[at] {
		for {
			w := s.stack[len(s.stack)-1]
			s.stack = s.stack[:len(s.stack)-1]
			s.onStack[w] = false
			s.label[w] = at
			if w == at {
				break
			}
		}
	}
}

// tarjan makes one pass, with a lowlink: the oldest stacked node this subtree
// can reach.
func tarjan(n int, edges []Arrow) []int {
	out := make([][]int, n)
	for _, e := range edges {
		out[e.U] = append(out[e.U], e.V)
	}
	s := &tarjanState{
		out:     out,
		index:   make([]int, n),
		low:     make([]int, n),
		onStack: make([]bool, n),
		label:   make([]int, n),
	}
	for i := 0; i < n; i++ {
		s.index[i] = -1
		s.label[i] = -1
	}
	for v := 0; v < n; v++ {
		if s.index[v] < 0 {
			s.visit(v)
		}
	}
	return canonical(n, s.label)
}

func findRoot(parent []int, v int) int {
	for parent[v] != v {
		parent[v] = parent[parent[v]]
		v = parent[v]
	}
	return v
}

// ignoringDirection is the tempting wrong answer: rub the arrows out and take
// components.
func ignoringDirection(n int, edges []Arrow) []int {
	parent := make([]int, n)
	for i := range parent {
		parent[i] = i
	}
	for _, e := range edges {
		ru, rv := findRoot(parent, e.U), findRoot(parent, e.V)
		if ru != rv {
			if ru < rv {
				parent[rv] = ru
			} else {
				parent[ru] = rv
			}
		}
	}
	out := make([]int, n)
	for v := 0; v < n; v++ {
		out[v] = findRoot(parent, v)
	}
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

func show(label []int) string {
	cells := make([]string, len(label))
	for i, x := range label {
		cells[i] = fmt.Sprint(x)
	}
	return strings.Join(cells, " ")
}

func describe(edges []Arrow) string {
	cells := make([]string, len(edges))
	for i, e := range edges {
		cells[i] = fmt.Sprintf("%d->%d", e.U, e.V)
	}
	return "[" + strings.Join(cells, ", ") + "]"
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
var seed int64 = 90909

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func row(text string, value int) {
	fmt.Printf("  %-42s %6d\\n", text, value)
}

func main() {
	caseN := []int{4, 4, 6}
	cases := [][]Arrow{
		{{0, 1}, {1, 2}, {2, 0}, {2, 3}},
		{{0, 1}, {1, 2}, {2, 3}},
		{{0, 1}, {1, 2}, {2, 0}, {3, 4}, {4, 5}, {5, 3}, {2, 3}},
	}

	fmt.Printf("%-46s %-13s %-13s %s\\n", "edges", "Kosaraju", "Tarjan", "arrows ignored")
	for c := range cases {
		fmt.Printf("%-46s %-13s %-13s %s\\n", describe(cases[c]),
			show(kosaraju(caseN[c], cases[c])), show(tarjan(caseN[c], cases[c])),
			show(ignoringDirection(caseN[c], cases[c])))
	}

	trials := 3000
	kosarajuOk, tarjanOk, ignoringOk := 0, 0, 0
	totalComponents, mergedWrongly := 0, 0
	for t := 0; t < trials; t++ {
		n := 3 + randBelow(4)
		var edges []Arrow
		for u := 0; u < n; u++ {
			for v := 0; v < n; v++ {
				if u != v && randBelow(4) == 0 {
					edges = append(edges, Arrow{u, v})
				}
			}
		}
		want := byDefinition(n, edges)
		if same(kosaraju(n, edges), want) {
			kosarajuOk++
		}
		if same(tarjan(n, edges), want) {
			tarjanOk++
		}
		loose := ignoringDirection(n, edges)
		if same(loose, want) {
			ignoringOk++
		}
		distinct := map[int]bool{}
		for _, x := range want {
			distinct[x] = true
		}
		totalComponents += len(distinct)
		for u := 0; u < n; u++ {
			for v := u + 1; v < n; v++ {
				if loose[u] == loose[v] && want[u] != want[v] {
					mergedWrongly++
				}
			}
		}
	}

	fmt.Println()
	fmt.Printf("over %d random directed graphs on 3 to 6 nodes:\\n", trials)
	row("Kosaraju matched the definition", kosarajuOk)
	row("Tarjan matched it", tarjanOk)
	row("ignoring the arrows matched it", ignoringOk)
	row("pairs it merged that are not mutual", mergedWrongly)
	row("components found in total", totalComponents)

	fmt.Println()
	fmt.Println("Both algorithms are exact. Neither is doing anything clever with the")
	fmt.Println("definition -- they are computing mutual reachability, in one sweep")
	fmt.Println("instead of n sweeps.")
	fmt.Println()
	fmt.Println("Ignoring the arrows is the failure worth measuring, because it is what")
	fmt.Println("\\"connected component\\" means everywhere else and the word is the same. It")
	fmt.Printf("matched on %d of %d graphs and wrongly merged %d pairs of nodes that\\n", ignoringOk, trials, mergedWrongly)
	fmt.Println("cannot both reach each other. It can only ever be wrong in that")
	fmt.Println("direction: rubbing out an arrow adds routes, it never removes one.")
	fmt.Println()
	fmt.Println("The demo's second row is the whole distinction on four nodes. A path")
	fmt.Println("0->1->2->3 has four components, one per node, because no two of them")
	fmt.Println("can reach each other both ways -- while the arrows-ignored column calls")
	fmt.Println("the whole thing one component.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Using undirected connected components on a directed graph",
          body: "The word is the same and the answer is not. It matched the strongly connected answer on 418 of 3,000 random graphs and wrongly merged 14,782 pairs of nodes. The error is one-sided -- rubbing out an arrow only ever adds routes -- so it always over-merges, never under-merges.",
        },
        {
          title: "Taking a neighbour's lowlink rather than its index in Tarjan",
          body: "The textbook line takes the neighbour's `index` when it is still on the stack. Taking its `low` instead is widely called a bug and, for strongly connected components, is not: an on-stack neighbour is in the same component, so the root test fires in the same place — 20,000 random digraphs gave identical components either way. Where the distinction is real is bridges and articulation points, which compare a child's lowlink against the parent's index and do break.",
        },
        {
          title: "Forgetting that a single node is a component",
          body: "Every node is strongly connected to itself, so a graph with no cycles at all has `n` components, one each. The path in the demo has four. Code that only records components of size two or more silently loses most of the graph.",
        },
      ],
    },
    {
      id: "the-condensation-is-a-dag",
      heading: "The condensation is a DAG",
      body: [
        "Collapse every component to a single point, keep the edges that crossed between two of them, and the result \u2014 the *condensation* \u2014 is a DAG. Always.",
        "That is the reason to compute components at all. Inside a component every node reaches every other, so there is nothing left to decide; between components there is no way back, because a way back would have merged them.",
        "\"Always\" is a strong word, so the example measures it: 1,967 of 3,000 random graphs held a cycle, and every single condensation did not. It cannot fail. A cycle in the condensation would be a route from component A to B and back, which would make every node in both mutually reachable, which would have made them one component in the first place.",
        "A second counter lands on the same 1,967, and for the same reason: **the condensation shrinks a graph exactly when the graph had a cycle.** No cycle, no component with more than one node in it, nothing to collapse.",
        "So the condensation is the graph a directed problem should usually be asked on. Every node inside a component gives the same answer to \"what can I reach\" and \"what can reach me\", so all the structure is between components \u2014 and between components there are no cycles, which means topological order, one-pass dynamic programming, and everything else the DAG lesson set up. Reachability answered on the condensation agreed with reachability on the original on all 3,000 graphs, on 8,776 nodes instead of 13,514 and 5,821 edges instead of 17,164.",
      ],
      examples: [
        {
          id: "condensation-is-a-dag",
          title: "Collapse the components and measure what is left",
          lang: "python",
          code: `# Collapse every component to a point and the graph becomes a DAG. Always.
#
# That is the reason strongly connected components are worth computing at all.
# Inside a component every node reaches every other, so there is nothing left
# to decide; between components there is no way back, because a way back would
# have merged them. The quotient graph -- the condensation -- therefore has no
# cycles, and everything from the topological-sort lesson applies to it.
#
# "Always" is a strong word, so it is measured rather than asserted, on every
# random graph below.


def reachability(n, edges):
    reach = [[False] * n for _ in range(n)]
    for i in range(n):
        reach[i][i] = True
    for u, v in edges:
        reach[u][v] = True
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if reach[i][k] and reach[k][j]:
                    reach[i][j] = True
    return reach


def components(n, edges):
    """Each node labelled with the smallest node it is mutually reachable with."""
    reach = reachability(n, edges)
    return [min(u for u in range(n) if reach[u][v] and reach[v][u]) for v in range(n)]


def condense(n, edges):
    """One node per component, one edge per edge that crossed between two.

    Returns how many components there are, the edges between them, and the
    map from an original node to its component number.
    """
    label = components(n, edges)
    names = sorted(set(label))
    number = {name: i for i, name in enumerate(names)}
    small = [number[label[v]] for v in range(n)]
    crossing = set()
    for u, v in edges:
        if small[u] != small[v]:
            crossing.add((small[u], small[v]))
    return len(names), sorted(crossing), small


def has_cycle(n, edges):
    """Is any node reachable from itself in one step or more?"""
    reach = [[False] * n for _ in range(n)]
    for u, v in edges:
        reach[u][v] = True
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if reach[i][k] and reach[k][j]:
                    reach[i][j] = True
    return any(reach[i][i] for i in range(n))


def reach_via_condensation(n, edges):
    """Answer every reachability question through the collapsed graph.

    u reaches v exactly when u's component reaches v's component, and that is
    a question about a DAG -- which is a smaller graph with no cycles in it.
    """
    count, crossing, small = condense(n, edges)
    up = [[False] * count for _ in range(count)]
    for i in range(count):
        up[i][i] = True
    for a, b in crossing:
        up[a][b] = True
    for k in range(count):
        for i in range(count):
            for j in range(count):
                if up[i][k] and up[k][j]:
                    up[i][j] = True
    return [[up[small[u]][small[v]] for v in range(n)] for u in range(n)]


def show(label):
    return " ".join(str(x) for x in label)


def describe(edges):
    return "[" + ", ".join("%d->%d" % e for e in edges) + "]"


CASES = [
    (4, [(0, 1), (1, 2), (2, 0), (2, 3)]),
    (5, [(0, 1), (1, 0), (1, 2), (2, 3), (3, 2), (3, 4)]),
    (4, [(0, 1), (1, 2), (2, 3), (3, 0)]),
]

print("%-42s %-12s %-6s %s" % ("edges", "components", "nodes", "condensed edges"))
for n, edges in CASES:
    count, crossing, small = condense(n, edges)
    print("%-42s %-12s %-6d %s" % (describe(edges), show(small), count, describe(crossing)))

# The same linear congruential generator in every language, so the random
# graphs below are the same graphs whichever translation is run.
seed = 123123


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


trials = 3000
acyclic = 0
had_cycle = 0
shrank = 0
nodes_before = nodes_after = 0
edges_before = edges_after = 0
answers_match = 0
single_component = 0
for _ in range(trials):
    n = 3 + rand(4)
    edges = []
    for u in range(n):
        for v in range(n):
            if u != v and rand(3) == 0:
                edges.append((u, v))
    if has_cycle(n, edges):
        had_cycle += 1
    count, crossing, small = condense(n, edges)
    if not has_cycle(count, crossing):
        acyclic += 1
    if count < n:
        shrank += 1
    if count == 1:
        single_component += 1
    nodes_before += n
    nodes_after += count
    edges_before += len(edges)
    edges_after += len(crossing)
    answers_match += reach_via_condensation(n, edges) == reachability(n, edges)

print()
print("over %d random directed graphs on 3 to 6 nodes:" % trials)
print("  %-42s %6d" % ("graphs that held a cycle", had_cycle))
print("  %-42s %6d" % ("condensations that were acyclic", acyclic))
print("  %-42s %6d" % ("graphs the condensation made smaller", shrank))
print("  %-42s %6d" % ("graphs that were one component", single_component))
print()
print("  %-42s %6d" % ("nodes before condensing", nodes_before))
print("  %-42s %6d" % ("nodes after", nodes_after))
print("  %-42s %6d" % ("edges before", edges_before))
print("  %-42s %6d" % ("edges after", edges_after))
print()
print("  %-42s %6d" % ("reachability answered on the DAG matched", answers_match))

print()
print("%d of the %d graphs held a cycle. Every single condensation did not." % (had_cycle, trials))
print("That is not a property of these graphs -- it cannot fail. A cycle in")
print("the condensation would be a route from component A to component B and")
print("back, which would make every node in both mutually reachable, which")
print("would have made them one component in the first place.")
print()
print("The third counter is the same %d again, and for the same reason: the" % shrank)
print("condensation shrinks a graph exactly when the graph had a cycle. No")
print("cycle, no component with more than one node in it, nothing to collapse.")
print()
print("So the condensation is the graph a directed problem should usually be")
print("asked on. Every node inside a component has the same answer to \\"what")
print("can I reach\\" and \\"what can reach me\\", so the interesting structure is")
print("entirely between components -- and between components there are no")
print("cycles, which means topological order, one-pass dynamic programming,")
print("and everything else the DAG lesson set up.")
print()
print("Reachability computed on the condensation agreed with reachability")
print("computed on the original on all %d graphs, on a graph with %d nodes" % (answers_match, nodes_after))
print("instead of %d and %d edges instead of %d." % (nodes_before, edges_after, edges_before))
`,
          output: `edges                                      components   nodes  condensed edges
[0->1, 1->2, 2->0, 2->3]                   0 0 0 1      2      [0->1]
[0->1, 1->0, 1->2, 2->3, 3->2, 3->4]       0 0 1 1 2    3      [0->1, 1->2]
[0->1, 1->2, 2->3, 3->0]                   0 0 0 0      1      []

over 3000 random directed graphs on 3 to 6 nodes:
  graphs that held a cycle                     1967
  condensations that were acyclic              3000
  graphs the condensation made smaller         1967
  graphs that were one component                425

  nodes before condensing                     13514
  nodes after                                  8776
  edges before                                17164
  edges after                                  5821

  reachability answered on the DAG matched     3000

1967 of the 3000 graphs held a cycle. Every single condensation did not.
That is not a property of these graphs -- it cannot fail. A cycle in
the condensation would be a route from component A to component B and
back, which would make every node in both mutually reachable, which
would have made them one component in the first place.

The third counter is the same 1967 again, and for the same reason: the
condensation shrinks a graph exactly when the graph had a cycle. No
cycle, no component with more than one node in it, nothing to collapse.

So the condensation is the graph a directed problem should usually be
asked on. Every node inside a component has the same answer to "what
can I reach" and "what can reach me", so the interesting structure is
entirely between components -- and between components there are no
cycles, which means topological order, one-pass dynamic programming,
and everything else the DAG lesson set up.

Reachability computed on the condensation agreed with reachability
computed on the original on all 3000 graphs, on a graph with 8776 nodes
instead of 13514 and 5821 edges instead of 17164.`,
          explanation:
            "Every random graph condensed and then checked for cycles, with reachability answered twice -- once on the original and once on the smaller graph.",
          alternates: [
            {
              lang: "javascript",
              code: `// Collapse every component to a point and the graph becomes a DAG. Always.
//
// That is the reason strongly connected components are worth computing at all.
// Inside a component every node reaches every other, so there is nothing left
// to decide; between components there is no way back, because a way back would
// have merged them. The quotient graph -- the condensation -- therefore has no
// cycles, and everything from the topological-sort lesson applies to it.
//
// "Always" is a strong word, so it is measured rather than asserted, on every
// random graph below.

function reachability(n, edges) {
  const reach = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let i = 0; i < n; i += 1) reach[i][i] = true;
  for (const [u, v] of edges) reach[u][v] = true;
  for (let k = 0; k < n; k += 1)
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1)
        if (reach[i][k] && reach[k][j]) reach[i][j] = true;
  return reach;
}

// Each node labelled with the smallest node it is mutually reachable with.
function components(n, edges) {
  const reach = reachability(n, edges);
  const label = new Array(n).fill(0);
  for (let v = 0; v < n; v += 1) {
    let smallest = v;
    for (let u = 0; u < n; u += 1)
      if (reach[u][v] && reach[v][u] && u < smallest) smallest = u;
    label[v] = smallest;
  }
  return label;
}

// One node per component, one edge per edge that crossed between two.
//
// Returns how many components there are, the edges between them, and the
// map from an original node to its component number.
function condense(n, edges) {
  const label = components(n, edges);
  const names = [...new Set(label)].sort((a, b) => a - b);
  const number = new Map(names.map((name, i) => [name, i]));
  const small = label.map((x) => number.get(x));
  const crossing = new Set();
  for (const [u, v] of edges) {
    if (small[u] !== small[v]) crossing.add(\`\${small[u]},\${small[v]}\`);
  }
  const list = [...crossing]
    .map((s) => s.split(",").map(Number))
    .sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]));
  return [names.length, list, small];
}

// Is any node reachable from itself in one step or more?
function hasCycle(n, edges) {
  const reach = Array.from({ length: n }, () => new Array(n).fill(false));
  for (const [u, v] of edges) reach[u][v] = true;
  for (let k = 0; k < n; k += 1)
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1)
        if (reach[i][k] && reach[k][j]) reach[i][j] = true;
  for (let i = 0; i < n; i += 1) if (reach[i][i]) return true;
  return false;
}

// Answer every reachability question through the collapsed graph.
//
// u reaches v exactly when u's component reaches v's component, and that is
// a question about a DAG -- which is a smaller graph with no cycles in it.
function reachViaCondensation(n, edges) {
  const [count, crossing, small] = condense(n, edges);
  const up = Array.from({ length: count }, () => new Array(count).fill(false));
  for (let i = 0; i < count; i += 1) up[i][i] = true;
  for (const [a, b] of crossing) up[a][b] = true;
  for (let k = 0; k < count; k += 1)
    for (let i = 0; i < count; i += 1)
      for (let j = 0; j < count; j += 1)
        if (up[i][k] && up[k][j]) up[i][j] = true;
  return Array.from({ length: n }, (_, u) =>
    Array.from({ length: n }, (_, v) => up[small[u]][small[v]]),
  );
}

function show(label) {
  return label.join(" ");
}

function describe(edges) {
  return "[" + edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ") + "]";
}

const CASES = [
  [4, [[0, 1], [1, 2], [2, 0], [2, 3]]],
  [5, [[0, 1], [1, 0], [1, 2], [2, 3], [3, 2], [3, 4]]],
  [4, [[0, 1], [1, 2], [2, 3], [3, 0]]],
];

console.log(
  "edges".padEnd(42) + " " + "components".padEnd(12) + " " + "nodes".padEnd(6) + " " +
  "condensed edges",
);
for (const [n, edges] of CASES) {
  const [count, crossing, small] = condense(n, edges);
  console.log(
    describe(edges).padEnd(42) + " " + show(small).padEnd(12) + " " +
    String(count).padEnd(6) + " " + describe(crossing),
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 123123n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let acyclic = 0;
let hadCycle = 0;
let shrank = 0;
let nodesBefore = 0;
let nodesAfter = 0;
let edgesBefore = 0;
let edgesAfter = 0;
let answersMatch = 0;
let singleComponent = 0;
const sameGrid = (a, b) => a.every((rowA, i) => rowA.every((x, j) => x === b[i][j]));
for (let t = 0; t < trials; t += 1) {
  const n = 3 + rand(4);
  const edges = [];
  for (let u = 0; u < n; u += 1)
    for (let v = 0; v < n; v += 1)
      if (u !== v && rand(3) === 0) edges.push([u, v]);
  if (hasCycle(n, edges)) hadCycle += 1;
  const [count, crossing] = condense(n, edges);
  if (!hasCycle(count, crossing)) acyclic += 1;
  if (count < n) shrank += 1;
  if (count === 1) singleComponent += 1;
  nodesBefore += n;
  nodesAfter += count;
  edgesBefore += edges.length;
  edgesAfter += crossing.length;
  if (sameGrid(reachViaCondensation(n, edges), reachability(n, edges))) answersMatch += 1;
}

const row = (text, value) => "  " + text.padEnd(42) + " " + String(value).padStart(6);

console.log();
console.log(\`over \${trials} random directed graphs on 3 to 6 nodes:\`);
console.log(row("graphs that held a cycle", hadCycle));
console.log(row("condensations that were acyclic", acyclic));
console.log(row("graphs the condensation made smaller", shrank));
console.log(row("graphs that were one component", singleComponent));
console.log();
console.log(row("nodes before condensing", nodesBefore));
console.log(row("nodes after", nodesAfter));
console.log(row("edges before", edgesBefore));
console.log(row("edges after", edgesAfter));
console.log();
console.log(row("reachability answered on the DAG matched", answersMatch));

console.log();
console.log(\`\${hadCycle} of the \${trials} graphs held a cycle. Every single condensation did not.\`);
console.log("That is not a property of these graphs -- it cannot fail. A cycle in");
console.log("the condensation would be a route from component A to component B and");
console.log("back, which would make every node in both mutually reachable, which");
console.log("would have made them one component in the first place.");
console.log();
console.log(\`The third counter is the same \${shrank} again, and for the same reason: the\`);
console.log("condensation shrinks a graph exactly when the graph had a cycle. No");
console.log("cycle, no component with more than one node in it, nothing to collapse.");
console.log();
console.log("So the condensation is the graph a directed problem should usually be");
console.log('asked on. Every node inside a component has the same answer to "what');
console.log('can I reach" and "what can reach me", so the interesting structure is');
console.log("entirely between components -- and between components there are no");
console.log("cycles, which means topological order, one-pass dynamic programming,");
console.log("and everything else the DAG lesson set up.");
console.log();
console.log("Reachability computed on the condensation agreed with reachability");
console.log(\`computed on the original on all \${answersMatch} graphs, on a graph with \${nodesAfter} nodes\`);
console.log(\`instead of \${nodesBefore} and \${edgesAfter} edges instead of \${edgesBefore}.\`);
`,
            },
            {
              lang: "typescript",
              code: `// Collapse every component to a point and the graph becomes a DAG. Always.
//
// That is the reason strongly connected components are worth computing at all.
// Inside a component every node reaches every other, so there is nothing left
// to decide; between components there is no way back, because a way back would
// have merged them. The quotient graph -- the condensation -- therefore has no
// cycles, and everything from the topological-sort lesson applies to it.
//
// "Always" is a strong word, so it is measured rather than asserted, on every
// random graph below.

function reachability(n: number, edges: number[][]): boolean[][] {
  const reach = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let i = 0; i < n; i += 1) reach[i][i] = true;
  for (const [u, v] of edges) reach[u][v] = true;
  for (let k = 0; k < n; k += 1)
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1)
        if (reach[i][k] && reach[k][j]) reach[i][j] = true;
  return reach;
}

// Each node labelled with the smallest node it is mutually reachable with.
function components(n: number, edges: number[][]): number[] {
  const reach = reachability(n, edges);
  const label = new Array(n).fill(0);
  for (let v = 0; v < n; v += 1) {
    let smallest = v;
    for (let u = 0; u < n; u += 1)
      if (reach[u][v] && reach[v][u] && u < smallest) smallest = u;
    label[v] = smallest;
  }
  return label;
}

// One node per component, one edge per edge that crossed between two.
//
// Returns how many components there are, the edges between them, and the
// map from an original node to its component number.
function condense(n: number, edges: number[][]): [number, number[][], number[]] {
  const label = components(n, edges);
  const names = [...new Set(label)].sort((a, b) => a - b);
  const number = new Map(names.map((name, i) => [name, i]));
  const small = label.map((x) => number.get(x) as number);
  const crossing = new Set<string>();
  for (const [u, v] of edges) {
    if (small[u] !== small[v]) crossing.add(\`\${small[u]},\${small[v]}\`);
  }
  const list = [...crossing]
    .map((s) => s.split(",").map(Number))
    .sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]));
  return [names.length, list, small];
}

// Is any node reachable from itself in one step or more?
function hasCycle(n: number, edges: number[][]): boolean {
  const reach = Array.from({ length: n }, () => new Array(n).fill(false));
  for (const [u, v] of edges) reach[u][v] = true;
  for (let k = 0; k < n; k += 1)
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1)
        if (reach[i][k] && reach[k][j]) reach[i][j] = true;
  for (let i = 0; i < n; i += 1) if (reach[i][i]) return true;
  return false;
}

// Answer every reachability question through the collapsed graph.
//
// u reaches v exactly when u's component reaches v's component, and that is
// a question about a DAG -- which is a smaller graph with no cycles in it.
function reachViaCondensation(n: number, edges: number[][]): boolean[][] {
  const [count, crossing, small] = condense(n, edges);
  const up = Array.from({ length: count }, () => new Array(count).fill(false));
  for (let i = 0; i < count; i += 1) up[i][i] = true;
  for (const [a, b] of crossing) up[a][b] = true;
  for (let k = 0; k < count; k += 1)
    for (let i = 0; i < count; i += 1)
      for (let j = 0; j < count; j += 1)
        if (up[i][k] && up[k][j]) up[i][j] = true;
  return Array.from({ length: n }, (_, u) =>
    Array.from({ length: n }, (_, v) => up[small[u]][small[v]]),
  );
}

function show(label: number[]): string {
  return label.join(" ");
}

function describe(edges: number[][]): string {
  return "[" + edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ") + "]";
}

const CASES: [number, number[][]][] = [
  [4, [[0, 1], [1, 2], [2, 0], [2, 3]]],
  [5, [[0, 1], [1, 0], [1, 2], [2, 3], [3, 2], [3, 4]]],
  [4, [[0, 1], [1, 2], [2, 3], [3, 0]]],
];

console.log(
  "edges".padEnd(42) + " " + "components".padEnd(12) + " " + "nodes".padEnd(6) + " " +
  "condensed edges",
);
for (const [n, edges] of CASES) {
  const [count, crossing, small] = condense(n, edges);
  console.log(
    describe(edges).padEnd(42) + " " + show(small).padEnd(12) + " " +
    String(count).padEnd(6) + " " + describe(crossing),
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 123123n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let acyclic = 0;
let hadCycle = 0;
let shrank = 0;
let nodesBefore = 0;
let nodesAfter = 0;
let edgesBefore = 0;
let edgesAfter = 0;
let answersMatch = 0;
let singleComponent = 0;
const sameGrid = (a: boolean[][], b: boolean[][]): boolean => a.every((rowA, i) => rowA.every((x, j) => x === b[i][j]));
for (let t = 0; t < trials; t += 1) {
  const n = 3 + rand(4);
  const edges: number[][] = [];
  for (let u = 0; u < n; u += 1)
    for (let v = 0; v < n; v += 1)
      if (u !== v && rand(3) === 0) edges.push([u, v]);
  if (hasCycle(n, edges)) hadCycle += 1;
  const [count, crossing] = condense(n, edges);
  if (!hasCycle(count, crossing)) acyclic += 1;
  if (count < n) shrank += 1;
  if (count === 1) singleComponent += 1;
  nodesBefore += n;
  nodesAfter += count;
  edgesBefore += edges.length;
  edgesAfter += crossing.length;
  if (sameGrid(reachViaCondensation(n, edges), reachability(n, edges))) answersMatch += 1;
}

const row = (text: string, value: number): string => "  " + text.padEnd(42) + " " + String(value).padStart(6);

console.log();
console.log(\`over \${trials} random directed graphs on 3 to 6 nodes:\`);
console.log(row("graphs that held a cycle", hadCycle));
console.log(row("condensations that were acyclic", acyclic));
console.log(row("graphs the condensation made smaller", shrank));
console.log(row("graphs that were one component", singleComponent));
console.log();
console.log(row("nodes before condensing", nodesBefore));
console.log(row("nodes after", nodesAfter));
console.log(row("edges before", edgesBefore));
console.log(row("edges after", edgesAfter));
console.log();
console.log(row("reachability answered on the DAG matched", answersMatch));

console.log();
console.log(\`\${hadCycle} of the \${trials} graphs held a cycle. Every single condensation did not.\`);
console.log("That is not a property of these graphs -- it cannot fail. A cycle in");
console.log("the condensation would be a route from component A to component B and");
console.log("back, which would make every node in both mutually reachable, which");
console.log("would have made them one component in the first place.");
console.log();
console.log(\`The third counter is the same \${shrank} again, and for the same reason: the\`);
console.log("condensation shrinks a graph exactly when the graph had a cycle. No");
console.log("cycle, no component with more than one node in it, nothing to collapse.");
console.log();
console.log("So the condensation is the graph a directed problem should usually be");
console.log('asked on. Every node inside a component has the same answer to "what');
console.log('can I reach" and "what can reach me", so the interesting structure is');
console.log("entirely between components -- and between components there are no");
console.log("cycles, which means topological order, one-pass dynamic programming,");
console.log("and everything else the DAG lesson set up.");
console.log();
console.log("Reachability computed on the condensation agreed with reachability");
console.log(\`computed on the original on all \${answersMatch} graphs, on a graph with \${nodesAfter} nodes\`);
console.log(\`instead of \${nodesBefore} and \${edgesAfter} edges instead of \${edgesBefore}.\`);
`,
            },
            {
              lang: "java",
              code: `// Collapse every component to a point and the graph becomes a DAG. Always.
//
// That is the reason strongly connected components are worth computing at all.
// Inside a component every node reaches every other, so there is nothing left
// to decide; between components there is no way back, because a way back would
// have merged them. The quotient graph -- the condensation -- therefore has no
// cycles, and everything from the topological-sort lesson applies to it.
//
// "Always" is a strong word, so it is measured rather than asserted, on every
// random graph below.
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

public class Main {
    static boolean[][] reachability(int n, List<int[]> edges) {
        boolean[][] reach = new boolean[n][n];
        for (int i = 0; i < n; i++) reach[i][i] = true;
        for (int[] e : edges) reach[e[0]][e[1]] = true;
        for (int k = 0; k < n; k++)
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++)
                    if (reach[i][k] && reach[k][j]) reach[i][j] = true;
        return reach;
    }

    /** Each node labelled with the smallest node it is mutually reachable with. */
    static int[] components(int n, List<int[]> edges) {
        boolean[][] reach = reachability(n, edges);
        int[] label = new int[n];
        for (int v = 0; v < n; v++) {
            int smallest = v;
            for (int u = 0; u < n; u++)
                if (reach[u][v] && reach[v][u] && u < smallest) smallest = u;
            label[v] = smallest;
        }
        return label;
    }

    static int condensedCount;
    static List<int[]> condensedEdges;
    static int[] condensedOf;

    /**
     * One node per component, one edge per edge that crossed between two.
     *
     * <p>Fills in how many components there are, the edges between them, and
     * the map from an original node to its component number.
     */
    static void condense(int n, List<int[]> edges) {
        int[] label = components(n, edges);
        TreeSet<Integer> names = new TreeSet<>();
        for (int x : label) names.add(x);
        Map<Integer, Integer> number = new HashMap<>();
        int next = 0;
        for (int name : names) number.put(name, next++);
        int[] small = new int[n];
        for (int v = 0; v < n; v++) small[v] = number.get(label[v]);
        TreeSet<Long> crossing = new TreeSet<>();
        for (int[] e : edges)
            if (small[e[0]] != small[e[1]]) crossing.add((long) small[e[0]] * 1000 + small[e[1]]);
        List<int[]> list = new ArrayList<>();
        for (long key : crossing) list.add(new int[] {(int) (key / 1000), (int) (key % 1000)});
        condensedCount = names.size();
        condensedEdges = list;
        condensedOf = small;
    }

    /** Is any node reachable from itself in one step or more? */
    static boolean hasCycle(int n, List<int[]> edges) {
        boolean[][] reach = new boolean[n][n];
        for (int[] e : edges) reach[e[0]][e[1]] = true;
        for (int k = 0; k < n; k++)
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++)
                    if (reach[i][k] && reach[k][j]) reach[i][j] = true;
        for (int i = 0; i < n; i++) if (reach[i][i]) return true;
        return false;
    }

    /**
     * Answer every reachability question through the collapsed graph.
     *
     * <p>u reaches v exactly when u's component reaches v's component, and that
     * is a question about a DAG -- a smaller graph with no cycles in it.
     */
    static boolean[][] reachViaCondensation(int n, List<int[]> edges) {
        condense(n, edges);
        int count = condensedCount;
        List<int[]> crossing = condensedEdges;
        int[] small = condensedOf;
        boolean[][] up = new boolean[count][count];
        for (int i = 0; i < count; i++) up[i][i] = true;
        for (int[] e : crossing) up[e[0]][e[1]] = true;
        for (int k = 0; k < count; k++)
            for (int i = 0; i < count; i++)
                for (int j = 0; j < count; j++)
                    if (up[i][k] && up[k][j]) up[i][j] = true;
        boolean[][] out = new boolean[n][n];
        for (int u = 0; u < n; u++)
            for (int v = 0; v < n; v++) out[u][v] = up[small[u]][small[v]];
        return out;
    }

    static boolean sameGrid(boolean[][] a, boolean[][] b) {
        for (int i = 0; i < a.length; i++)
            for (int j = 0; j < a[i].length; j++)
                if (a[i][j] != b[i][j]) return false;
        return true;
    }

    static String show(int[] label) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < label.length; i++) {
            if (i > 0) sb.append(" ");
            sb.append(label[i]);
        }
        return sb.toString();
    }

    static String describe(List<int[]> edges) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < edges.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(edges.get(i)[0]).append("->").append(edges.get(i)[1]);
        }
        return sb.append("]").toString();
    }

    static List<int[]> listOf(int[][] pairs) {
        List<int[]> out = new ArrayList<>();
        for (int[] p : pairs) out.add(p);
        return out;
    }

    // The same linear congruential generator in every language, so the random
    // graphs below are the same graphs whichever translation is run.
    static long seed = 123123L;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    static String row(String text, int value) {
        return String.format("  %-42s %6d", text, value);
    }

    public static void main(String[] args) {
        int[] caseN = {4, 5, 4};
        int[][][] caseEdges = {
            {{0, 1}, {1, 2}, {2, 0}, {2, 3}},
            {{0, 1}, {1, 0}, {1, 2}, {2, 3}, {3, 2}, {3, 4}},
            {{0, 1}, {1, 2}, {2, 3}, {3, 0}},
        };

        System.out.printf("%-42s %-12s %-6s %s%n",
            "edges", "components", "nodes", "condensed edges");
        for (int c = 0; c < caseN.length; c++) {
            List<int[]> edges = listOf(caseEdges[c]);
            condense(caseN[c], edges);
            System.out.printf("%-42s %-12s %-6d %s%n", describe(edges), show(condensedOf),
                condensedCount, describe(condensedEdges));
        }

        int trials = 3000;
        int acyclic = 0, hadCycle = 0, shrank = 0, singleComponent = 0;
        int nodesBefore = 0, nodesAfter = 0, edgesBefore = 0, edgesAfter = 0;
        int answersMatch = 0;
        for (int t = 0; t < trials; t++) {
            int n = 3 + rand(4);
            List<int[]> edges = new ArrayList<>();
            for (int u = 0; u < n; u++)
                for (int v = 0; v < n; v++)
                    if (u != v && rand(3) == 0) edges.add(new int[] {u, v});
            if (hasCycle(n, edges)) hadCycle++;
            condense(n, edges);
            int count = condensedCount;
            List<int[]> crossing = condensedEdges;
            if (!hasCycle(count, crossing)) acyclic++;
            if (count < n) shrank++;
            if (count == 1) singleComponent++;
            nodesBefore += n;
            nodesAfter += count;
            edgesBefore += edges.size();
            edgesAfter += crossing.size();
            if (sameGrid(reachViaCondensation(n, edges), reachability(n, edges))) answersMatch++;
        }

        System.out.println();
        System.out.println("over " + trials + " random directed graphs on 3 to 6 nodes:");
        System.out.println(row("graphs that held a cycle", hadCycle));
        System.out.println(row("condensations that were acyclic", acyclic));
        System.out.println(row("graphs the condensation made smaller", shrank));
        System.out.println(row("graphs that were one component", singleComponent));
        System.out.println();
        System.out.println(row("nodes before condensing", nodesBefore));
        System.out.println(row("nodes after", nodesAfter));
        System.out.println(row("edges before", edgesBefore));
        System.out.println(row("edges after", edgesAfter));
        System.out.println();
        System.out.println(row("reachability answered on the DAG matched", answersMatch));

        System.out.println();
        System.out.println(hadCycle + " of the " + trials
            + " graphs held a cycle. Every single condensation did not.");
        System.out.println("That is not a property of these graphs -- it cannot fail. A cycle in");
        System.out.println("the condensation would be a route from component A to component B and");
        System.out.println("back, which would make every node in both mutually reachable, which");
        System.out.println("would have made them one component in the first place.");
        System.out.println();
        System.out.println("The third counter is the same " + shrank
            + " again, and for the same reason: the");
        System.out.println("condensation shrinks a graph exactly when the graph had a cycle. No");
        System.out.println("cycle, no component with more than one node in it, nothing to collapse.");
        System.out.println();
        System.out.println("So the condensation is the graph a directed problem should usually be");
        System.out.println("asked on. Every node inside a component has the same answer to \\"what");
        System.out.println("can I reach\\" and \\"what can reach me\\", so the interesting structure is");
        System.out.println("entirely between components -- and between components there are no");
        System.out.println("cycles, which means topological order, one-pass dynamic programming,");
        System.out.println("and everything else the DAG lesson set up.");
        System.out.println();
        System.out.println("Reachability computed on the condensation agreed with reachability");
        System.out.println("computed on the original on all " + answersMatch
            + " graphs, on a graph with " + nodesAfter + " nodes");
        System.out.println("instead of " + nodesBefore + " and " + edgesAfter + " edges instead of "
            + edgesBefore + ".");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Collapse every component to a point and the graph becomes a DAG. Always.
//
// That is the reason strongly connected components are worth computing at all.
// Inside a component every node reaches every other, so there is nothing left
// to decide; between components there is no way back, because a way back would
// have merged them. The quotient graph -- the condensation -- therefore has no
// cycles, and everything from the topological-sort lesson applies to it.
//
// "Always" is a strong word, so it is measured rather than asserted, on every
// random graph below.
#include <iomanip>
#include <iostream>
#include <map>
#include <set>
#include <string>
#include <utility>
#include <vector>

using Arrow = std::pair<int, int>;

std::vector<std::vector<bool>> reachability(int n, const std::vector<Arrow>& edges) {
    std::vector<std::vector<bool>> reach(n, std::vector<bool>(n, false));
    for (int i = 0; i < n; i++) reach[i][i] = true;
    for (const Arrow& e : edges) reach[e.first][e.second] = true;
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (reach[i][k] && reach[k][j]) reach[i][j] = true;
    return reach;
}

// Each node labelled with the smallest node it is mutually reachable with.
std::vector<int> components(int n, const std::vector<Arrow>& edges) {
    std::vector<std::vector<bool>> reach = reachability(n, edges);
    std::vector<int> label(n, 0);
    for (int v = 0; v < n; v++) {
        int smallest = v;
        for (int u = 0; u < n; u++)
            if (reach[u][v] && reach[v][u] && u < smallest) smallest = u;
        label[v] = smallest;
    }
    return label;
}

// One node per component, one edge per edge that crossed between two.
//
// Reports how many components there are, the edges between them, and the map
// from an original node to its component number.
void condense(int n, const std::vector<Arrow>& edges, int& count,
              std::vector<Arrow>& crossing, std::vector<int>& small) {
    std::vector<int> label = components(n, edges);
    std::set<int> names(label.begin(), label.end());
    std::map<int, int> number;
    int next = 0;
    for (int name : names) number[name] = next++;
    small.assign(n, 0);
    for (int v = 0; v < n; v++) small[v] = number[label[v]];
    std::set<Arrow> found;
    for (const Arrow& e : edges)
        if (small[e.first] != small[e.second]) found.insert({small[e.first], small[e.second]});
    crossing.assign(found.begin(), found.end());
    count = static_cast<int>(names.size());
}

// Is any node reachable from itself in one step or more?
bool has_cycle(int n, const std::vector<Arrow>& edges) {
    std::vector<std::vector<bool>> reach(n, std::vector<bool>(n, false));
    for (const Arrow& e : edges) reach[e.first][e.second] = true;
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (reach[i][k] && reach[k][j]) reach[i][j] = true;
    for (int i = 0; i < n; i++)
        if (reach[i][i]) return true;
    return false;
}

// Answer every reachability question through the collapsed graph.
//
// u reaches v exactly when u's component reaches v's component, and that is
// a question about a DAG -- which is a smaller graph with no cycles in it.
std::vector<std::vector<bool>> reach_via_condensation(int n, const std::vector<Arrow>& edges) {
    int count = 0;
    std::vector<Arrow> crossing;
    std::vector<int> small;
    condense(n, edges, count, crossing, small);
    std::vector<std::vector<bool>> up(count, std::vector<bool>(count, false));
    for (int i = 0; i < count; i++) up[i][i] = true;
    for (const Arrow& e : crossing) up[e.first][e.second] = true;
    for (int k = 0; k < count; k++)
        for (int i = 0; i < count; i++)
            for (int j = 0; j < count; j++)
                if (up[i][k] && up[k][j]) up[i][j] = true;
    std::vector<std::vector<bool>> out(n, std::vector<bool>(n, false));
    for (int u = 0; u < n; u++)
        for (int v = 0; v < n; v++) out[u][v] = up[small[u]][small[v]];
    return out;
}

std::string show(const std::vector<int>& label) {
    std::string s;
    for (size_t i = 0; i < label.size(); i++) {
        if (i > 0) s += " ";
        s += std::to_string(label[i]);
    }
    return s;
}

std::string describe(const std::vector<Arrow>& edges) {
    std::string s = "[";
    for (size_t i = 0; i < edges.size(); i++) {
        if (i > 0) s += ", ";
        s += std::to_string(edges[i].first) + "->" + std::to_string(edges[i].second);
    }
    return s + "]";
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
long long seed = 123123;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

void row(const std::string& text, int value) {
    std::cout << "  " << std::left << std::setw(42) << text << " " << std::right
              << std::setw(6) << value << "\\n";
}

int main() {
    std::vector<int> case_n = {4, 5, 4};
    std::vector<std::vector<Arrow>> cases = {
        {{0, 1}, {1, 2}, {2, 0}, {2, 3}},
        {{0, 1}, {1, 0}, {1, 2}, {2, 3}, {3, 2}, {3, 4}},
        {{0, 1}, {1, 2}, {2, 3}, {3, 0}},
    };

    std::cout << std::left << std::setw(42) << "edges" << " " << std::setw(12) << "components"
              << " " << std::setw(6) << "nodes" << " " << "condensed edges" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        int count = 0;
        std::vector<Arrow> crossing;
        std::vector<int> small;
        condense(case_n[c], cases[c], count, crossing, small);
        std::cout << std::left << std::setw(42) << describe(cases[c]) << " " << std::setw(12)
                  << show(small) << " " << std::setw(6) << count << " " << describe(crossing)
                  << "\\n";
    }

    int trials = 3000;
    int acyclic = 0, had_cycle = 0, shrank = 0, single_component = 0;
    int nodes_before = 0, nodes_after = 0, edges_before = 0, edges_after = 0;
    int answers_match = 0;
    for (int t = 0; t < trials; t++) {
        int n = 3 + rand_below(4);
        std::vector<Arrow> edges;
        for (int u = 0; u < n; u++)
            for (int v = 0; v < n; v++)
                if (u != v && rand_below(3) == 0) edges.push_back({u, v});
        if (has_cycle(n, edges)) had_cycle++;
        int count = 0;
        std::vector<Arrow> crossing;
        std::vector<int> small;
        condense(n, edges, count, crossing, small);
        if (!has_cycle(count, crossing)) acyclic++;
        if (count < n) shrank++;
        if (count == 1) single_component++;
        nodes_before += n;
        nodes_after += count;
        edges_before += static_cast<int>(edges.size());
        edges_after += static_cast<int>(crossing.size());
        if (reach_via_condensation(n, edges) == reachability(n, edges)) answers_match++;
    }

    std::cout << "\\n";
    std::cout << "over " << trials << " random directed graphs on 3 to 6 nodes:\\n";
    row("graphs that held a cycle", had_cycle);
    row("condensations that were acyclic", acyclic);
    row("graphs the condensation made smaller", shrank);
    row("graphs that were one component", single_component);
    std::cout << "\\n";
    row("nodes before condensing", nodes_before);
    row("nodes after", nodes_after);
    row("edges before", edges_before);
    row("edges after", edges_after);
    std::cout << "\\n";
    row("reachability answered on the DAG matched", answers_match);

    std::cout << "\\n";
    std::cout << had_cycle << " of the " << trials
              << " graphs held a cycle. Every single condensation did not.\\n";
    std::cout << "That is not a property of these graphs -- it cannot fail. A cycle in\\n";
    std::cout << "the condensation would be a route from component A to component B and\\n";
    std::cout << "back, which would make every node in both mutually reachable, which\\n";
    std::cout << "would have made them one component in the first place.\\n";
    std::cout << "\\n";
    std::cout << "The third counter is the same " << shrank
              << " again, and for the same reason: the\\n";
    std::cout << "condensation shrinks a graph exactly when the graph had a cycle. No\\n";
    std::cout << "cycle, no component with more than one node in it, nothing to collapse.\\n";
    std::cout << "\\n";
    std::cout << "So the condensation is the graph a directed problem should usually be\\n";
    std::cout << "asked on. Every node inside a component has the same answer to \\"what\\n";
    std::cout << "can I reach\\" and \\"what can reach me\\", so the interesting structure is\\n";
    std::cout << "entirely between components -- and between components there are no\\n";
    std::cout << "cycles, which means topological order, one-pass dynamic programming,\\n";
    std::cout << "and everything else the DAG lesson set up.\\n";
    std::cout << "\\n";
    std::cout << "Reachability computed on the condensation agreed with reachability\\n";
    std::cout << "computed on the original on all " << answers_match << " graphs, on a graph with "
              << nodes_after << " nodes\\n";
    std::cout << "instead of " << nodes_before << " and " << edges_after << " edges instead of "
              << edges_before << ".\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Collapse every component to a point and the graph becomes a DAG. Always.
//
// That is the reason strongly connected components are worth computing at all.
// Inside a component every node reaches every other, so there is nothing left
// to decide; between components there is no way back, because a way back would
// have merged them. The quotient graph -- the condensation -- therefore has no
// cycles, and everything from the topological-sort lesson applies to it.
//
// "Always" is a strong word, so it is measured rather than asserted, on every
// random graph below.
use std::collections::{BTreeMap, BTreeSet};

type Arrow = (usize, usize);

fn reachability(n: usize, edges: &[Arrow]) -> Vec<Vec<bool>> {
    let mut reach = vec![vec![false; n]; n];
    for i in 0..n {
        reach[i][i] = true;
    }
    for &(u, v) in edges {
        reach[u][v] = true;
    }
    for k in 0..n {
        for i in 0..n {
            for j in 0..n {
                if reach[i][k] && reach[k][j] {
                    reach[i][j] = true;
                }
            }
        }
    }
    reach
}

/// Each node labelled with the smallest node it is mutually reachable with.
fn components(n: usize, edges: &[Arrow]) -> Vec<usize> {
    let reach = reachability(n, edges);
    (0..n)
        .map(|v| (0..n).find(|&u| reach[u][v] && reach[v][u]).unwrap())
        .collect()
}

/// One node per component, one edge per edge that crossed between two.
///
/// Returns how many components there are, the edges between them, and the map
/// from an original node to its component number.
fn condense(n: usize, edges: &[Arrow]) -> (usize, Vec<Arrow>, Vec<usize>) {
    let label = components(n, edges);
    let names: BTreeSet<usize> = label.iter().copied().collect();
    let number: BTreeMap<usize, usize> =
        names.iter().enumerate().map(|(i, &name)| (name, i)).collect();
    let small: Vec<usize> = label.iter().map(|x| number[x]).collect();
    let mut found: BTreeSet<Arrow> = BTreeSet::new();
    for &(u, v) in edges {
        if small[u] != small[v] {
            found.insert((small[u], small[v]));
        }
    }
    (names.len(), found.into_iter().collect(), small)
}

/// Is any node reachable from itself in one step or more?
fn has_cycle(n: usize, edges: &[Arrow]) -> bool {
    let mut reach = vec![vec![false; n]; n];
    for &(u, v) in edges {
        reach[u][v] = true;
    }
    for k in 0..n {
        for i in 0..n {
            for j in 0..n {
                if reach[i][k] && reach[k][j] {
                    reach[i][j] = true;
                }
            }
        }
    }
    (0..n).any(|i| reach[i][i])
}

/// Answer every reachability question through the collapsed graph.
///
/// u reaches v exactly when u's component reaches v's component, and that is
/// a question about a DAG -- which is a smaller graph with no cycles in it.
fn reach_via_condensation(n: usize, edges: &[Arrow]) -> Vec<Vec<bool>> {
    let (count, crossing, small) = condense(n, edges);
    let mut up = vec![vec![false; count]; count];
    for i in 0..count {
        up[i][i] = true;
    }
    for &(a, b) in &crossing {
        up[a][b] = true;
    }
    for k in 0..count {
        for i in 0..count {
            for j in 0..count {
                if up[i][k] && up[k][j] {
                    up[i][j] = true;
                }
            }
        }
    }
    (0..n)
        .map(|u| (0..n).map(|v| up[small[u]][small[v]]).collect())
        .collect()
}

fn show(label: &[usize]) -> String {
    label
        .iter()
        .map(|x| x.to_string())
        .collect::<Vec<String>>()
        .join(" ")
}

fn describe(edges: &[Arrow]) -> String {
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

fn row(text: &str, value: u64) {
    println!("  {:<42} {:>6}", text, value);
}

fn main() {
    let case_n = [4usize, 5, 4];
    let cases: Vec<Vec<Arrow>> = vec![
        vec![(0, 1), (1, 2), (2, 0), (2, 3)],
        vec![(0, 1), (1, 0), (1, 2), (2, 3), (3, 2), (3, 4)],
        vec![(0, 1), (1, 2), (2, 3), (3, 0)],
    ];

    println!(
        "{:<42} {:<12} {:<6} {}",
        "edges", "components", "nodes", "condensed edges"
    );
    for c in 0..cases.len() {
        let (count, crossing, small) = condense(case_n[c], &cases[c]);
        println!(
            "{:<42} {:<12} {:<6} {}",
            describe(&cases[c]),
            show(&small),
            count,
            describe(&crossing)
        );
    }

    let mut rng = Rng { seed: 123123 };
    let trials = 3000;
    let (mut acyclic, mut had_cycle, mut shrank, mut single_component) = (0u64, 0u64, 0u64, 0u64);
    let (mut nodes_before, mut nodes_after) = (0u64, 0u64);
    let (mut edges_before, mut edges_after) = (0u64, 0u64);
    let mut answers_match = 0u64;
    for _ in 0..trials {
        let n = 3 + rng.next(4) as usize;
        let mut edges: Vec<Arrow> = Vec::new();
        for u in 0..n {
            for v in 0..n {
                if u != v && rng.next(3) == 0 {
                    edges.push((u, v));
                }
            }
        }
        if has_cycle(n, &edges) {
            had_cycle += 1;
        }
        let (count, crossing, _) = condense(n, &edges);
        if !has_cycle(count, &crossing) {
            acyclic += 1;
        }
        if count < n {
            shrank += 1;
        }
        if count == 1 {
            single_component += 1;
        }
        nodes_before += n as u64;
        nodes_after += count as u64;
        edges_before += edges.len() as u64;
        edges_after += crossing.len() as u64;
        if reach_via_condensation(n, &edges) == reachability(n, &edges) {
            answers_match += 1;
        }
    }

    println!();
    println!("over {} random directed graphs on 3 to 6 nodes:", trials);
    row("graphs that held a cycle", had_cycle);
    row("condensations that were acyclic", acyclic);
    row("graphs the condensation made smaller", shrank);
    row("graphs that were one component", single_component);
    println!();
    row("nodes before condensing", nodes_before);
    row("nodes after", nodes_after);
    row("edges before", edges_before);
    row("edges after", edges_after);
    println!();
    row("reachability answered on the DAG matched", answers_match);

    println!();
    println!(
        "{} of the {} graphs held a cycle. Every single condensation did not.",
        had_cycle, trials
    );
    println!("That is not a property of these graphs -- it cannot fail. A cycle in");
    println!("the condensation would be a route from component A to component B and");
    println!("back, which would make every node in both mutually reachable, which");
    println!("would have made them one component in the first place.");
    println!();
    println!(
        "The third counter is the same {} again, and for the same reason: the",
        shrank
    );
    println!("condensation shrinks a graph exactly when the graph had a cycle. No");
    println!("cycle, no component with more than one node in it, nothing to collapse.");
    println!();
    println!("So the condensation is the graph a directed problem should usually be");
    println!("asked on. Every node inside a component has the same answer to \\"what");
    println!("can I reach\\" and \\"what can reach me\\", so the interesting structure is");
    println!("entirely between components -- and between components there are no");
    println!("cycles, which means topological order, one-pass dynamic programming,");
    println!("and everything else the DAG lesson set up.");
    println!();
    println!("Reachability computed on the condensation agreed with reachability");
    println!(
        "computed on the original on all {} graphs, on a graph with {} nodes",
        answers_match, nodes_after
    );
    println!(
        "instead of {} and {} edges instead of {}.",
        nodes_before, edges_after, edges_before
    );
}
`,
            },
            {
              lang: "go",
              code: `// Collapse every component to a point and the graph becomes a DAG. Always.
//
// That is the reason strongly connected components are worth computing at all.
// Inside a component every node reaches every other, so there is nothing left
// to decide; between components there is no way back, because a way back would
// have merged them. The quotient graph -- the condensation -- therefore has no
// cycles, and everything from the topological-sort lesson applies to it.
//
// "Always" is a strong word, so it is measured rather than asserted, on every
// random graph below.
package main

import (
	"fmt"
	"sort"
	"strings"
)

// Arrow is a directed edge.
type Arrow struct {
	U, V int
}

func reachability(n int, edges []Arrow) [][]bool {
	reach := make([][]bool, n)
	for i := range reach {
		reach[i] = make([]bool, n)
		reach[i][i] = true
	}
	for _, e := range edges {
		reach[e.U][e.V] = true
	}
	for k := 0; k < n; k++ {
		for i := 0; i < n; i++ {
			for j := 0; j < n; j++ {
				if reach[i][k] && reach[k][j] {
					reach[i][j] = true
				}
			}
		}
	}
	return reach
}

// components labels each node with the smallest node it is mutually reachable
// with.
func components(n int, edges []Arrow) []int {
	reach := reachability(n, edges)
	label := make([]int, n)
	for v := 0; v < n; v++ {
		smallest := v
		for u := 0; u < n; u++ {
			if reach[u][v] && reach[v][u] && u < smallest {
				smallest = u
			}
		}
		label[v] = smallest
	}
	return label
}

// condense gives one node per component and one edge per edge that crossed
// between two.
//
// It returns how many components there are, the edges between them, and the
// map from an original node to its component number.
func condense(n int, edges []Arrow) (int, []Arrow, []int) {
	label := components(n, edges)
	seen := map[int]bool{}
	for _, x := range label {
		seen[x] = true
	}
	names := make([]int, 0, len(seen))
	for x := range seen {
		names = append(names, x)
	}
	sort.Ints(names)
	number := map[int]int{}
	for i, name := range names {
		number[name] = i
	}
	small := make([]int, n)
	for v := 0; v < n; v++ {
		small[v] = number[label[v]]
	}
	found := map[Arrow]bool{}
	for _, e := range edges {
		if small[e.U] != small[e.V] {
			found[Arrow{small[e.U], small[e.V]}] = true
		}
	}
	crossing := make([]Arrow, 0, len(found))
	for a := range found {
		crossing = append(crossing, a)
	}
	sort.Slice(crossing, func(i, j int) bool {
		if crossing[i].U != crossing[j].U {
			return crossing[i].U < crossing[j].U
		}
		return crossing[i].V < crossing[j].V
	})
	return len(names), crossing, small
}

// hasCycle asks whether any node is reachable from itself in one step or more.
func hasCycle(n int, edges []Arrow) bool {
	reach := make([][]bool, n)
	for i := range reach {
		reach[i] = make([]bool, n)
	}
	for _, e := range edges {
		reach[e.U][e.V] = true
	}
	for k := 0; k < n; k++ {
		for i := 0; i < n; i++ {
			for j := 0; j < n; j++ {
				if reach[i][k] && reach[k][j] {
					reach[i][j] = true
				}
			}
		}
	}
	for i := 0; i < n; i++ {
		if reach[i][i] {
			return true
		}
	}
	return false
}

// reachViaCondensation answers every reachability question through the
// collapsed graph.
//
// u reaches v exactly when u's component reaches v's component, and that is a
// question about a DAG -- which is a smaller graph with no cycles in it.
func reachViaCondensation(n int, edges []Arrow) [][]bool {
	count, crossing, small := condense(n, edges)
	up := make([][]bool, count)
	for i := range up {
		up[i] = make([]bool, count)
		up[i][i] = true
	}
	for _, e := range crossing {
		up[e.U][e.V] = true
	}
	for k := 0; k < count; k++ {
		for i := 0; i < count; i++ {
			for j := 0; j < count; j++ {
				if up[i][k] && up[k][j] {
					up[i][j] = true
				}
			}
		}
	}
	out := make([][]bool, n)
	for u := 0; u < n; u++ {
		out[u] = make([]bool, n)
		for v := 0; v < n; v++ {
			out[u][v] = up[small[u]][small[v]]
		}
	}
	return out
}

func sameGrid(a, b [][]bool) bool {
	for i := range a {
		for j := range a[i] {
			if a[i][j] != b[i][j] {
				return false
			}
		}
	}
	return true
}

func show(label []int) string {
	cells := make([]string, len(label))
	for i, x := range label {
		cells[i] = fmt.Sprint(x)
	}
	return strings.Join(cells, " ")
}

func describe(edges []Arrow) string {
	cells := make([]string, len(edges))
	for i, e := range edges {
		cells[i] = fmt.Sprintf("%d->%d", e.U, e.V)
	}
	return "[" + strings.Join(cells, ", ") + "]"
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
var seed int64 = 123123

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func row(text string, value int) {
	fmt.Printf("  %-42s %6d\\n", text, value)
}

func main() {
	caseN := []int{4, 5, 4}
	cases := [][]Arrow{
		{{0, 1}, {1, 2}, {2, 0}, {2, 3}},
		{{0, 1}, {1, 0}, {1, 2}, {2, 3}, {3, 2}, {3, 4}},
		{{0, 1}, {1, 2}, {2, 3}, {3, 0}},
	}

	fmt.Printf("%-42s %-12s %-6s %s\\n", "edges", "components", "nodes", "condensed edges")
	for c := range cases {
		count, crossing, small := condense(caseN[c], cases[c])
		fmt.Printf("%-42s %-12s %-6d %s\\n", describe(cases[c]), show(small), count, describe(crossing))
	}

	trials := 3000
	acyclic, hadCycle, shrank, singleComponent := 0, 0, 0, 0
	nodesBefore, nodesAfter, edgesBefore, edgesAfter := 0, 0, 0, 0
	answersMatch := 0
	for t := 0; t < trials; t++ {
		n := 3 + randBelow(4)
		var edges []Arrow
		for u := 0; u < n; u++ {
			for v := 0; v < n; v++ {
				if u != v && randBelow(3) == 0 {
					edges = append(edges, Arrow{u, v})
				}
			}
		}
		if hasCycle(n, edges) {
			hadCycle++
		}
		count, crossing, _ := condense(n, edges)
		if !hasCycle(count, crossing) {
			acyclic++
		}
		if count < n {
			shrank++
		}
		if count == 1 {
			singleComponent++
		}
		nodesBefore += n
		nodesAfter += count
		edgesBefore += len(edges)
		edgesAfter += len(crossing)
		if sameGrid(reachViaCondensation(n, edges), reachability(n, edges)) {
			answersMatch++
		}
	}

	fmt.Println()
	fmt.Printf("over %d random directed graphs on 3 to 6 nodes:\\n", trials)
	row("graphs that held a cycle", hadCycle)
	row("condensations that were acyclic", acyclic)
	row("graphs the condensation made smaller", shrank)
	row("graphs that were one component", singleComponent)
	fmt.Println()
	row("nodes before condensing", nodesBefore)
	row("nodes after", nodesAfter)
	row("edges before", edgesBefore)
	row("edges after", edgesAfter)
	fmt.Println()
	row("reachability answered on the DAG matched", answersMatch)

	fmt.Println()
	fmt.Printf("%d of the %d graphs held a cycle. Every single condensation did not.\\n", hadCycle, trials)
	fmt.Println("That is not a property of these graphs -- it cannot fail. A cycle in")
	fmt.Println("the condensation would be a route from component A to component B and")
	fmt.Println("back, which would make every node in both mutually reachable, which")
	fmt.Println("would have made them one component in the first place.")
	fmt.Println()
	fmt.Printf("The third counter is the same %d again, and for the same reason: the\\n", shrank)
	fmt.Println("condensation shrinks a graph exactly when the graph had a cycle. No")
	fmt.Println("cycle, no component with more than one node in it, nothing to collapse.")
	fmt.Println()
	fmt.Println("So the condensation is the graph a directed problem should usually be")
	fmt.Println("asked on. Every node inside a component has the same answer to \\"what")
	fmt.Println("can I reach\\" and \\"what can reach me\\", so the interesting structure is")
	fmt.Println("entirely between components -- and between components there are no")
	fmt.Println("cycles, which means topological order, one-pass dynamic programming,")
	fmt.Println("and everything else the DAG lesson set up.")
	fmt.Println()
	fmt.Println("Reachability computed on the condensation agreed with reachability")
	fmt.Printf("computed on the original on all %d graphs, on a graph with %d nodes\\n", answersMatch, nodesAfter)
	fmt.Printf("instead of %d and %d edges instead of %d.\\n", nodesBefore, edgesAfter, edgesBefore)
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "graph-scc-condensation",
        kind: "graph",
        algorithm: "topological",
        title: "Between components there is never a way back",
        lockAlgorithm: true,
      },
      pitfalls: [
        {
          title: "Running a topological sort on the graph instead of the condensation",
          body: "A directed graph with a cycle has no topological order, and both algorithms from the previous lesson correctly refuse. The condensation always has one — 3,000 of 3,000 here — so the fix is to condense first, not to give up.",
        },
        {
          title: "Keeping duplicate edges in the condensation",
          body: "Several original edges usually cross the same pair of components. Deduplicate them or the condensation carries far more edges than it needs: 5,821 distinct crossings came from 17,164 original edges here.",
        },
        {
          title: "Assuming the condensation is smaller",
          body: "It is smaller exactly when the graph had a cycle, and on 1,033 of the 3,000 graphs measured it was the same size. Condensing an acyclic graph is a no-op that still costs a pass.",
        },
      ],
    },
    {
      id: "sources-and-sinks",
      heading: "Sources and sinks",
      body: [
        "One question the condensation answers outright: how many edges does a graph need before everything can reach everything?",
        "On the condensation it is two counts. A component with nothing pointing at it can never be entered from outside \u2014 a **source**. One with nothing leaving it can never be left \u2014 a **sink**. Every added edge can fix at most one source and at most one sink, so the answer is at least `max(sources, sinks)`.",
        "And it turns out that is also enough. The interesting part of that sentence is \"it turns out\" \u2014 this module keeps disproving folklore, so the formula is scored against a brute force that actually tries every set of edges. It matched on all 2,000 graphs, never asking for too many and never for too few.",
        "The smallest interesting case is a path `0\u21921\u21922`: three components in a row, one source, one sink, one edge needed, and it is the obvious `2\u21920`. The one that catches people is a star pointing outwards \u2014 one source and three sinks, so it needs three edges, not one.",
        "And there is an exception to write down rather than discover. A graph that is already one component condenses to a single node, which has no incoming edge and no outgoing edge, so it counts as both a source and a sink and the formula says 1. The answer is 0.",
      ],
      examples: [
        {
          id: "sources-and-sinks",
          title: "max(sources, sinks), scored against actually trying every set of edges",
          lang: "python",
          code: `# One question the condensation answers outright: how many edges does this
# graph need before everything can reach everything?
#
# On the condensation the answer is two counts. A component with nothing
# pointing at it can never be entered from outside -- call it a source. A
# component with nothing leaving it can never be left -- a sink. Every added
# edge can fix at most one source and at most one sink, so the answer is at
# least max(sources, sinks), and it turns out that is also enough.
#
# The interesting part of that claim is "and it turns out". It is a real
# theorem with a construction behind it, and folklore is exactly the kind of
# thing this module keeps disproving -- so the formula is scored below against
# a brute force that actually tries every set of edges.
import itertools


def reachability(n, edges):
    reach = [[False] * n for _ in range(n)]
    for i in range(n):
        reach[i][i] = True
    for u, v in edges:
        reach[u][v] = True
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if reach[i][k] and reach[k][j]:
                    reach[i][j] = True
    return reach


def strongly_connected(n, edges):
    reach = reachability(n, edges)
    return all(reach[u][v] for u in range(n) for v in range(n))


def condense(n, edges):
    reach = reachability(n, edges)
    label = [min(u for u in range(n) if reach[u][v] and reach[v][u]) for v in range(n)]
    names = sorted(set(label))
    number = {name: i for i, name in enumerate(names)}
    small = [number[label[v]] for v in range(n)]
    crossing = set()
    for u, v in edges:
        if small[u] != small[v]:
            crossing.add((small[u], small[v]))
    return len(names), sorted(crossing)


def by_formula(n, edges):
    """max(sources, sinks) on the condensation, and zero when it is one node."""
    count, crossing = condense(n, edges)
    if count == 1:
        return 0
    has_in = [False] * count
    has_out = [False] * count
    for a, b in crossing:
        has_out[a] = True
        has_in[b] = True
    sources = sum(1 for i in range(count) if not has_in[i])
    sinks = sum(1 for i in range(count) if not has_out[i])
    return max(sources, sinks)


def by_trying(n, edges):
    """Add every set of k edges, smallest k first, until one works.

    Exponential and exact. This is what the formula is being scored against.
    """
    if strongly_connected(n, edges):
        return 0
    have = set(edges)
    candidates = [(u, v) for u in range(n) for v in range(n) if u != v and (u, v) not in have]
    for k in range(1, n + 1):
        for extra in itertools.combinations(candidates, k):
            if strongly_connected(n, edges + list(extra)):
                return k
    return -1


def describe(edges):
    return "[" + ", ".join("%d->%d" % e for e in edges) + "]"


CASES = [
    (3, [(0, 1), (1, 2), (2, 0)]),
    (3, [(0, 1), (1, 2)]),
    (4, [(0, 1), (1, 0), (2, 3), (3, 2)]),
    (4, [(0, 1), (0, 2), (0, 3)]),
]

print("%-40s %-9s %-8s %s" % ("edges", "formula", "trying", "components"))
for n, edges in CASES:
    count, _ = condense(n, edges)
    print("%-40s %-9d %-8d %d" % (describe(edges), by_formula(n, edges), by_trying(n, edges), count))

# The same linear congruential generator in every language, so the random
# graphs below are the same graphs whichever translation is run.
seed = 55555


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


trials = 2000
agreed = 0
already = 0
formula_high = formula_low = 0
worst = 0
for _ in range(trials):
    n = 2 + rand(4)
    edges = []
    for u in range(n):
        for v in range(n):
            if u != v and rand(3) == 0:
                edges.append((u, v))
    want = by_trying(n, edges)
    got = by_formula(n, edges)
    agreed += got == want
    if want == 0:
        already += 1
    if got > want:
        formula_high += 1
    if got < want:
        formula_low += 1
    if want > worst:
        worst = want

print()
print("over %d random directed graphs on 2 to 5 nodes:" % trials)
print("  %-42s %6d" % ("the formula matched the brute force", agreed))
print("  %-42s %6d" % ("graphs already strongly connected", already))
print("  %-42s %6d" % ("times the formula asked for too many", formula_high))
print("  %-42s %6d" % ("times it asked for too few", formula_low))
print("  %-42s %6d" % ("most edges any graph needed", worst))

print()
print("The formula matched an exhaustive search on all %d graphs. Small ones --" % agreed)
print("the brute force tries every subset of every missing edge, which is why")
print("the trial size here is %d graphs of at most 5 nodes rather than the" % trials)
print("usual 3,000 of up to 6.")
print()
print("Row two of the demo is the smallest interesting case. A path 0->1->2 is")
print("three components in a row: one source, one sink, one edge needed, and")
print("the edge to add is the obvious 2->0. Row four is the one that catches")
print("people -- a star pointing outwards has one source and three sinks, so")
print("it needs three edges, not one.")
print()
print("And row one is the case the formula has to special-case. A graph that is")
print("already one component condenses to a single node, which has no incoming")
print("edge and no outgoing edge, so it counts as both a source and a sink and")
print("the formula would say 1. The answer is 0. One node is the exception, and")
print("it is worth writing down rather than discovering.")
`,
          output: `edges                                    formula   trying   components
[0->1, 1->2, 2->0]                       0         0        1
[0->1, 1->2]                             1         1        3
[0->1, 1->0, 2->3, 3->2]                 2         2        2
[0->1, 0->2, 0->3]                       3         3        4

over 2000 random directed graphs on 2 to 5 nodes:
  the formula matched the brute force          2000
  graphs already strongly connected             209
  times the formula asked for too many            0
  times it asked for too few                      0
  most edges any graph needed                     4

The formula matched an exhaustive search on all 2000 graphs. Small ones --
the brute force tries every subset of every missing edge, which is why
the trial size here is 2000 graphs of at most 5 nodes rather than the
usual 3,000 of up to 6.

Row two of the demo is the smallest interesting case. A path 0->1->2 is
three components in a row: one source, one sink, one edge needed, and
the edge to add is the obvious 2->0. Row four is the one that catches
people -- a star pointing outwards has one source and three sinks, so
it needs three edges, not one.

And row one is the case the formula has to special-case. A graph that is
already one component condenses to a single node, which has no incoming
edge and no outgoing edge, so it counts as both a source and a sink and
the formula would say 1. The answer is 0. One node is the exception, and
it is worth writing down rather than discovering.`,
          explanation:
            "The standard formula against a brute force that adds every combination of missing edges, smallest first. Note the single-component row, which the formula gets wrong without its special case.",
          alternates: [
            {
              lang: "javascript",
              code: `// One question the condensation answers outright: how many edges does this
// graph need before everything can reach everything?
//
// On the condensation the answer is two counts. A component with nothing
// pointing at it can never be entered from outside -- call it a source. A
// component with nothing leaving it can never be left -- a sink. Every added
// edge can fix at most one source and at most one sink, so the answer is at
// least max(sources, sinks), and it turns out that is also enough.
//
// The interesting part of that claim is "and it turns out". It is a real
// theorem with a construction behind it, and folklore is exactly the kind of
// thing this module keeps disproving -- so the formula is scored below against
// a brute force that actually tries every set of edges.

function reachability(n, edges) {
  const reach = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let i = 0; i < n; i += 1) reach[i][i] = true;
  for (const [u, v] of edges) reach[u][v] = true;
  for (let k = 0; k < n; k += 1)
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1)
        if (reach[i][k] && reach[k][j]) reach[i][j] = true;
  return reach;
}

function stronglyConnected(n, edges) {
  const reach = reachability(n, edges);
  return reach.every((rowU) => rowU.every((x) => x));
}

function condense(n, edges) {
  const reach = reachability(n, edges);
  const label = [];
  for (let v = 0; v < n; v += 1) {
    let smallest = v;
    for (let u = 0; u < n; u += 1)
      if (reach[u][v] && reach[v][u] && u < smallest) smallest = u;
    label.push(smallest);
  }
  const names = [...new Set(label)].sort((a, b) => a - b);
  const number = new Map(names.map((name, i) => [name, i]));
  const small = label.map((x) => number.get(x));
  const crossing = new Set();
  for (const [u, v] of edges) {
    if (small[u] !== small[v]) crossing.add(\`\${small[u]},\${small[v]}\`);
  }
  const list = [...crossing]
    .map((s) => s.split(",").map(Number))
    .sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]));
  return [names.length, list];
}

// max(sources, sinks) on the condensation, and zero when it is one node.
function byFormula(n, edges) {
  const [count, crossing] = condense(n, edges);
  if (count === 1) return 0;
  const hasIn = new Array(count).fill(false);
  const hasOut = new Array(count).fill(false);
  for (const [a, b] of crossing) {
    hasOut[a] = true;
    hasIn[b] = true;
  }
  let sources = 0;
  let sinks = 0;
  for (let i = 0; i < count; i += 1) {
    if (!hasIn[i]) sources += 1;
    if (!hasOut[i]) sinks += 1;
  }
  return Math.max(sources, sinks);
}

// Every combination of k of the remaining slots, smallest k first.
function combinations(items, k) {
  const out = [];
  const pick = [];
  const walk = (start) => {
    if (pick.length === k) {
      out.push([...pick]);
      return;
    }
    for (let i = start; i < items.length; i += 1) {
      pick.push(items[i]);
      walk(i + 1);
      pick.pop();
    }
  };
  walk(0);
  return out;
}

// Add every set of k edges, smallest k first, until one works.
//
// Exponential and exact. This is what the formula is being scored against.
function byTrying(n, edges) {
  if (stronglyConnected(n, edges)) return 0;
  const have = new Set(edges.map(([u, v]) => \`\${u},\${v}\`));
  const candidates = [];
  for (let u = 0; u < n; u += 1)
    for (let v = 0; v < n; v += 1)
      if (u !== v && !have.has(\`\${u},\${v}\`)) candidates.push([u, v]);
  for (let k = 1; k <= n; k += 1) {
    for (const extra of combinations(candidates, k)) {
      if (stronglyConnected(n, [...edges, ...extra])) return k;
    }
  }
  return -1;
}

function describe(edges) {
  return "[" + edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ") + "]";
}

const CASES = [
  [3, [[0, 1], [1, 2], [2, 0]]],
  [3, [[0, 1], [1, 2]]],
  [4, [[0, 1], [1, 0], [2, 3], [3, 2]]],
  [4, [[0, 1], [0, 2], [0, 3]]],
];

console.log("edges".padEnd(40) + " " + "formula".padEnd(9) + " " + "trying".padEnd(8) + " " + "components");
for (const [n, edges] of CASES) {
  const [count] = condense(n, edges);
  console.log(
    describe(edges).padEnd(40) + " " + String(byFormula(n, edges)).padEnd(9) + " " +
    String(byTrying(n, edges)).padEnd(8) + " " + count,
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 55555n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 2000;
let agreed = 0;
let already = 0;
let formulaHigh = 0;
let formulaLow = 0;
let worst = 0;
for (let t = 0; t < trials; t += 1) {
  const n = 2 + rand(4);
  const edges = [];
  for (let u = 0; u < n; u += 1)
    for (let v = 0; v < n; v += 1)
      if (u !== v && rand(3) === 0) edges.push([u, v]);
  const want = byTrying(n, edges);
  const got = byFormula(n, edges);
  if (got === want) agreed += 1;
  if (want === 0) already += 1;
  if (got > want) formulaHigh += 1;
  if (got < want) formulaLow += 1;
  if (want > worst) worst = want;
}

const row = (text, value) => "  " + text.padEnd(42) + " " + String(value).padStart(6);

console.log();
console.log(\`over \${trials} random directed graphs on 2 to 5 nodes:\`);
console.log(row("the formula matched the brute force", agreed));
console.log(row("graphs already strongly connected", already));
console.log(row("times the formula asked for too many", formulaHigh));
console.log(row("times it asked for too few", formulaLow));
console.log(row("most edges any graph needed", worst));

console.log();
console.log(\`The formula matched an exhaustive search on all \${agreed} graphs. Small ones --\`);
console.log("the brute force tries every subset of every missing edge, which is why");
console.log(\`the trial size here is \${trials} graphs of at most 5 nodes rather than the\`);
console.log("usual 3,000 of up to 6.");
console.log();
console.log("Row two of the demo is the smallest interesting case. A path 0->1->2 is");
console.log("three components in a row: one source, one sink, one edge needed, and");
console.log("the edge to add is the obvious 2->0. Row four is the one that catches");
console.log("people -- a star pointing outwards has one source and three sinks, so");
console.log("it needs three edges, not one.");
console.log();
console.log("And row one is the case the formula has to special-case. A graph that is");
console.log("already one component condenses to a single node, which has no incoming");
console.log("edge and no outgoing edge, so it counts as both a source and a sink and");
console.log("the formula would say 1. The answer is 0. One node is the exception, and");
console.log("it is worth writing down rather than discovering.");
`,
            },
            {
              lang: "typescript",
              code: `// One question the condensation answers outright: how many edges does this
// graph need before everything can reach everything?
//
// On the condensation the answer is two counts. A component with nothing
// pointing at it can never be entered from outside -- call it a source. A
// component with nothing leaving it can never be left -- a sink. Every added
// edge can fix at most one source and at most one sink, so the answer is at
// least max(sources, sinks), and it turns out that is also enough.
//
// The interesting part of that claim is "and it turns out". It is a real
// theorem with a construction behind it, and folklore is exactly the kind of
// thing this module keeps disproving -- so the formula is scored below against
// a brute force that actually tries every set of edges.

function reachability(n: number, edges: number[][]): boolean[][] {
  const reach = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let i = 0; i < n; i += 1) reach[i][i] = true;
  for (const [u, v] of edges) reach[u][v] = true;
  for (let k = 0; k < n; k += 1)
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1)
        if (reach[i][k] && reach[k][j]) reach[i][j] = true;
  return reach;
}

function stronglyConnected(n: number, edges: number[][]): boolean {
  const reach = reachability(n, edges);
  return reach.every((rowU) => rowU.every((x) => x));
}

function condense(n: number, edges: number[][]): [number, number[][]] {
  const reach = reachability(n, edges);
  const label: number[] = [];
  for (let v = 0; v < n; v += 1) {
    let smallest = v;
    for (let u = 0; u < n; u += 1)
      if (reach[u][v] && reach[v][u] && u < smallest) smallest = u;
    label.push(smallest);
  }
  const names = [...new Set(label)].sort((a, b) => a - b);
  const number = new Map(names.map((name, i) => [name, i]));
  const small = label.map((x) => number.get(x) as number);
  const crossing = new Set<string>();
  for (const [u, v] of edges) {
    if (small[u] !== small[v]) crossing.add(\`\${small[u]},\${small[v]}\`);
  }
  const list = [...crossing]
    .map((s) => s.split(",").map(Number))
    .sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]));
  return [names.length, list];
}

// max(sources, sinks) on the condensation, and zero when it is one node.
function byFormula(n: number, edges: number[][]): number {
  const [count, crossing] = condense(n, edges);
  if (count === 1) return 0;
  const hasIn = new Array(count).fill(false);
  const hasOut = new Array(count).fill(false);
  for (const [a, b] of crossing) {
    hasOut[a] = true;
    hasIn[b] = true;
  }
  let sources = 0;
  let sinks = 0;
  for (let i = 0; i < count; i += 1) {
    if (!hasIn[i]) sources += 1;
    if (!hasOut[i]) sinks += 1;
  }
  return Math.max(sources, sinks);
}

// Every combination of k of the remaining slots, smallest k first.
function combinations(items: number[][], k: number): number[][][] {
  const out: number[][][] = [];
  const pick: number[][] = [];
  const walk = (start: number): void => {
    if (pick.length === k) {
      out.push([...pick]);
      return;
    }
    for (let i = start; i < items.length; i += 1) {
      pick.push(items[i]);
      walk(i + 1);
      pick.pop();
    }
  };
  walk(0);
  return out;
}

// Add every set of k edges, smallest k first, until one works.
//
// Exponential and exact. This is what the formula is being scored against.
function byTrying(n: number, edges: number[][]): number {
  if (stronglyConnected(n, edges)) return 0;
  const have = new Set(edges.map(([u, v]) => \`\${u},\${v}\`));
  const candidates: number[][] = [];
  for (let u = 0; u < n; u += 1)
    for (let v = 0; v < n; v += 1)
      if (u !== v && !have.has(\`\${u},\${v}\`)) candidates.push([u, v]);
  for (let k = 1; k <= n; k += 1) {
    for (const extra of combinations(candidates, k)) {
      if (stronglyConnected(n, [...edges, ...extra])) return k;
    }
  }
  return -1;
}

function describe(edges: number[][]): string {
  return "[" + edges.map(([u, v]) => \`\${u}->\${v}\`).join(", ") + "]";
}

const CASES: [number, number[][]][] = [
  [3, [[0, 1], [1, 2], [2, 0]]],
  [3, [[0, 1], [1, 2]]],
  [4, [[0, 1], [1, 0], [2, 3], [3, 2]]],
  [4, [[0, 1], [0, 2], [0, 3]]],
];

console.log("edges".padEnd(40) + " " + "formula".padEnd(9) + " " + "trying".padEnd(8) + " " + "components");
for (const [n, edges] of CASES) {
  const [count] = condense(n, edges);
  console.log(
    describe(edges).padEnd(40) + " " + String(byFormula(n, edges)).padEnd(9) + " " +
    String(byTrying(n, edges)).padEnd(8) + " " + count,
  );
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 55555n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 2000;
let agreed = 0;
let already = 0;
let formulaHigh = 0;
let formulaLow = 0;
let worst = 0;
for (let t = 0; t < trials; t += 1) {
  const n = 2 + rand(4);
  const edges: number[][] = [];
  for (let u = 0; u < n; u += 1)
    for (let v = 0; v < n; v += 1)
      if (u !== v && rand(3) === 0) edges.push([u, v]);
  const want = byTrying(n, edges);
  const got = byFormula(n, edges);
  if (got === want) agreed += 1;
  if (want === 0) already += 1;
  if (got > want) formulaHigh += 1;
  if (got < want) formulaLow += 1;
  if (want > worst) worst = want;
}

const row = (text: string, value: number): string => "  " + text.padEnd(42) + " " + String(value).padStart(6);

console.log();
console.log(\`over \${trials} random directed graphs on 2 to 5 nodes:\`);
console.log(row("the formula matched the brute force", agreed));
console.log(row("graphs already strongly connected", already));
console.log(row("times the formula asked for too many", formulaHigh));
console.log(row("times it asked for too few", formulaLow));
console.log(row("most edges any graph needed", worst));

console.log();
console.log(\`The formula matched an exhaustive search on all \${agreed} graphs. Small ones --\`);
console.log("the brute force tries every subset of every missing edge, which is why");
console.log(\`the trial size here is \${trials} graphs of at most 5 nodes rather than the\`);
console.log("usual 3,000 of up to 6.");
console.log();
console.log("Row two of the demo is the smallest interesting case. A path 0->1->2 is");
console.log("three components in a row: one source, one sink, one edge needed, and");
console.log("the edge to add is the obvious 2->0. Row four is the one that catches");
console.log("people -- a star pointing outwards has one source and three sinks, so");
console.log("it needs three edges, not one.");
console.log();
console.log("And row one is the case the formula has to special-case. A graph that is");
console.log("already one component condenses to a single node, which has no incoming");
console.log("edge and no outgoing edge, so it counts as both a source and a sink and");
console.log("the formula would say 1. The answer is 0. One node is the exception, and");
console.log("it is worth writing down rather than discovering.");
`,
            },
            {
              lang: "java",
              code: `// One question the condensation answers outright: how many edges does this
// graph need before everything can reach everything?
//
// On the condensation the answer is two counts. A component with nothing
// pointing at it can never be entered from outside -- call it a source. A
// component with nothing leaving it can never be left -- a sink. Every added
// edge can fix at most one source and at most one sink, so the answer is at
// least max(sources, sinks), and it turns out that is also enough.
//
// The interesting part of that claim is "and it turns out". It is a real
// theorem with a construction behind it, and folklore is exactly the kind of
// thing this module keeps disproving -- so the formula is scored below against
// a brute force that actually tries every set of edges.
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

public class Main {
    static boolean[][] reachability(int n, List<int[]> edges) {
        boolean[][] reach = new boolean[n][n];
        for (int i = 0; i < n; i++) reach[i][i] = true;
        for (int[] e : edges) reach[e[0]][e[1]] = true;
        for (int k = 0; k < n; k++)
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++)
                    if (reach[i][k] && reach[k][j]) reach[i][j] = true;
        return reach;
    }

    static boolean stronglyConnected(int n, List<int[]> edges) {
        boolean[][] reach = reachability(n, edges);
        for (int u = 0; u < n; u++)
            for (int v = 0; v < n; v++)
                if (!reach[u][v]) return false;
        return true;
    }

    static int condensedCount;
    static List<int[]> condensedEdges;

    static void condense(int n, List<int[]> edges) {
        boolean[][] reach = reachability(n, edges);
        int[] label = new int[n];
        for (int v = 0; v < n; v++) {
            int smallest = v;
            for (int u = 0; u < n; u++)
                if (reach[u][v] && reach[v][u] && u < smallest) smallest = u;
            label[v] = smallest;
        }
        TreeSet<Integer> names = new TreeSet<>();
        for (int x : label) names.add(x);
        Map<Integer, Integer> number = new HashMap<>();
        int next = 0;
        for (int name : names) number.put(name, next++);
        int[] small = new int[n];
        for (int v = 0; v < n; v++) small[v] = number.get(label[v]);
        TreeSet<Long> found = new TreeSet<>();
        for (int[] e : edges)
            if (small[e[0]] != small[e[1]]) found.add((long) small[e[0]] * 1000 + small[e[1]]);
        List<int[]> crossing = new ArrayList<>();
        for (long key : found) crossing.add(new int[] {(int) (key / 1000), (int) (key % 1000)});
        condensedCount = names.size();
        condensedEdges = crossing;
    }

    /** max(sources, sinks) on the condensation, and zero when it is one node. */
    static int byFormula(int n, List<int[]> edges) {
        condense(n, edges);
        int count = condensedCount;
        if (count == 1) return 0;
        boolean[] hasIn = new boolean[count];
        boolean[] hasOut = new boolean[count];
        for (int[] e : condensedEdges) {
            hasOut[e[0]] = true;
            hasIn[e[1]] = true;
        }
        int sources = 0, sinks = 0;
        for (int i = 0; i < count; i++) {
            if (!hasIn[i]) sources++;
            if (!hasOut[i]) sinks++;
        }
        return Math.max(sources, sinks);
    }

    static boolean tryCombinations(int n, List<int[]> edges, List<int[]> candidates, int k,
                                   int start, List<int[]> pick) {
        if (pick.size() == k) {
            List<int[]> all = new ArrayList<>(edges);
            all.addAll(pick);
            return stronglyConnected(n, all);
        }
        for (int i = start; i < candidates.size(); i++) {
            pick.add(candidates.get(i));
            if (tryCombinations(n, edges, candidates, k, i + 1, pick)) return true;
            pick.remove(pick.size() - 1);
        }
        return false;
    }

    /**
     * Add every set of k edges, smallest k first, until one works.
     *
     * <p>Exponential and exact. This is what the formula is being scored against.
     */
    static int byTrying(int n, List<int[]> edges) {
        if (stronglyConnected(n, edges)) return 0;
        Set<Long> have = new HashSet<>();
        for (int[] e : edges) have.add((long) e[0] * 1000 + e[1]);
        List<int[]> candidates = new ArrayList<>();
        for (int u = 0; u < n; u++)
            for (int v = 0; v < n; v++)
                if (u != v && !have.contains((long) u * 1000 + v))
                    candidates.add(new int[] {u, v});
        for (int k = 1; k <= n; k++)
            if (tryCombinations(n, edges, candidates, k, 0, new ArrayList<>())) return k;
        return -1;
    }

    static String describe(List<int[]> edges) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < edges.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(edges.get(i)[0]).append("->").append(edges.get(i)[1]);
        }
        return sb.append("]").toString();
    }

    static List<int[]> listOf(int[][] pairs) {
        List<int[]> out = new ArrayList<>();
        for (int[] p : pairs) out.add(p);
        return out;
    }

    // The same linear congruential generator in every language, so the random
    // graphs below are the same graphs whichever translation is run.
    static long seed = 55555L;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    static String row(String text, int value) {
        return String.format("  %-42s %6d", text, value);
    }

    public static void main(String[] args) {
        int[] caseN = {3, 3, 4, 4};
        int[][][] caseEdges = {
            {{0, 1}, {1, 2}, {2, 0}},
            {{0, 1}, {1, 2}},
            {{0, 1}, {1, 0}, {2, 3}, {3, 2}},
            {{0, 1}, {0, 2}, {0, 3}},
        };

        System.out.printf("%-40s %-9s %-8s %s%n", "edges", "formula", "trying", "components");
        for (int c = 0; c < caseN.length; c++) {
            List<int[]> edges = listOf(caseEdges[c]);
            condense(caseN[c], edges);
            System.out.printf("%-40s %-9d %-8d %d%n", describe(edges),
                byFormula(caseN[c], edges), byTrying(caseN[c], edges), condensedCount);
        }

        int trials = 2000;
        int agreed = 0, already = 0, formulaHigh = 0, formulaLow = 0, worst = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(4);
            List<int[]> edges = new ArrayList<>();
            for (int u = 0; u < n; u++)
                for (int v = 0; v < n; v++)
                    if (u != v && rand(3) == 0) edges.add(new int[] {u, v});
            int want = byTrying(n, edges);
            int got = byFormula(n, edges);
            if (got == want) agreed++;
            if (want == 0) already++;
            if (got > want) formulaHigh++;
            if (got < want) formulaLow++;
            if (want > worst) worst = want;
        }

        System.out.println();
        System.out.println("over " + trials + " random directed graphs on 2 to 5 nodes:");
        System.out.println(row("the formula matched the brute force", agreed));
        System.out.println(row("graphs already strongly connected", already));
        System.out.println(row("times the formula asked for too many", formulaHigh));
        System.out.println(row("times it asked for too few", formulaLow));
        System.out.println(row("most edges any graph needed", worst));

        System.out.println();
        System.out.println("The formula matched an exhaustive search on all " + agreed
            + " graphs. Small ones --");
        System.out.println("the brute force tries every subset of every missing edge, which is why");
        System.out.println("the trial size here is " + trials
            + " graphs of at most 5 nodes rather than the");
        System.out.println("usual 3,000 of up to 6.");
        System.out.println();
        System.out.println("Row two of the demo is the smallest interesting case. A path 0->1->2 is");
        System.out.println("three components in a row: one source, one sink, one edge needed, and");
        System.out.println("the edge to add is the obvious 2->0. Row four is the one that catches");
        System.out.println("people -- a star pointing outwards has one source and three sinks, so");
        System.out.println("it needs three edges, not one.");
        System.out.println();
        System.out.println("And row one is the case the formula has to special-case. A graph that is");
        System.out.println("already one component condenses to a single node, which has no incoming");
        System.out.println("edge and no outgoing edge, so it counts as both a source and a sink and");
        System.out.println("the formula would say 1. The answer is 0. One node is the exception, and");
        System.out.println("it is worth writing down rather than discovering.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// One question the condensation answers outright: how many edges does this
// graph need before everything can reach everything?
//
// On the condensation the answer is two counts. A component with nothing
// pointing at it can never be entered from outside -- call it a source. A
// component with nothing leaving it can never be left -- a sink. Every added
// edge can fix at most one source and at most one sink, so the answer is at
// least max(sources, sinks), and it turns out that is also enough.
//
// The interesting part of that claim is "and it turns out". It is a real
// theorem with a construction behind it, and folklore is exactly the kind of
// thing this module keeps disproving -- so the formula is scored below against
// a brute force that actually tries every set of edges.
#include <algorithm>
#include <iomanip>
#include <iostream>
#include <map>
#include <set>
#include <string>
#include <utility>
#include <vector>

using Arrow = std::pair<int, int>;

std::vector<std::vector<bool>> reachability(int n, const std::vector<Arrow>& edges) {
    std::vector<std::vector<bool>> reach(n, std::vector<bool>(n, false));
    for (int i = 0; i < n; i++) reach[i][i] = true;
    for (const Arrow& e : edges) reach[e.first][e.second] = true;
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (reach[i][k] && reach[k][j]) reach[i][j] = true;
    return reach;
}

bool strongly_connected(int n, const std::vector<Arrow>& edges) {
    std::vector<std::vector<bool>> reach = reachability(n, edges);
    for (int u = 0; u < n; u++)
        for (int v = 0; v < n; v++)
            if (!reach[u][v]) return false;
    return true;
}

void condense(int n, const std::vector<Arrow>& edges, int& count, std::vector<Arrow>& crossing) {
    std::vector<std::vector<bool>> reach = reachability(n, edges);
    std::vector<int> label(n, 0);
    for (int v = 0; v < n; v++) {
        int smallest = v;
        for (int u = 0; u < n; u++)
            if (reach[u][v] && reach[v][u] && u < smallest) smallest = u;
        label[v] = smallest;
    }
    std::set<int> names(label.begin(), label.end());
    std::map<int, int> number;
    int next = 0;
    for (int name : names) number[name] = next++;
    std::vector<int> small(n, 0);
    for (int v = 0; v < n; v++) small[v] = number[label[v]];
    std::set<Arrow> found;
    for (const Arrow& e : edges)
        if (small[e.first] != small[e.second]) found.insert({small[e.first], small[e.second]});
    crossing.assign(found.begin(), found.end());
    count = static_cast<int>(names.size());
}

// max(sources, sinks) on the condensation, and zero when it is one node.
int by_formula(int n, const std::vector<Arrow>& edges) {
    int count = 0;
    std::vector<Arrow> crossing;
    condense(n, edges, count, crossing);
    if (count == 1) return 0;
    std::vector<bool> has_in(count, false), has_out(count, false);
    for (const Arrow& e : crossing) {
        has_out[e.first] = true;
        has_in[e.second] = true;
    }
    int sources = 0, sinks = 0;
    for (int i = 0; i < count; i++) {
        if (!has_in[i]) sources++;
        if (!has_out[i]) sinks++;
    }
    return std::max(sources, sinks);
}

bool try_combinations(int n, const std::vector<Arrow>& edges,
                      const std::vector<Arrow>& candidates, int k, size_t start,
                      std::vector<Arrow>& pick) {
    if (static_cast<int>(pick.size()) == k) {
        std::vector<Arrow> all = edges;
        all.insert(all.end(), pick.begin(), pick.end());
        return strongly_connected(n, all);
    }
    for (size_t i = start; i < candidates.size(); i++) {
        pick.push_back(candidates[i]);
        if (try_combinations(n, edges, candidates, k, i + 1, pick)) return true;
        pick.pop_back();
    }
    return false;
}

// Add every set of k edges, smallest k first, until one works.
//
// Exponential and exact. This is what the formula is being scored against.
int by_trying(int n, const std::vector<Arrow>& edges) {
    if (strongly_connected(n, edges)) return 0;
    std::set<Arrow> have(edges.begin(), edges.end());
    std::vector<Arrow> candidates;
    for (int u = 0; u < n; u++)
        for (int v = 0; v < n; v++)
            if (u != v && !have.count({u, v})) candidates.push_back({u, v});
    for (int k = 1; k <= n; k++) {
        std::vector<Arrow> pick;
        if (try_combinations(n, edges, candidates, k, 0, pick)) return k;
    }
    return -1;
}

std::string describe(const std::vector<Arrow>& edges) {
    std::string s = "[";
    for (size_t i = 0; i < edges.size(); i++) {
        if (i > 0) s += ", ";
        s += std::to_string(edges[i].first) + "->" + std::to_string(edges[i].second);
    }
    return s + "]";
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
long long seed = 55555;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

void row(const std::string& text, int value) {
    std::cout << "  " << std::left << std::setw(42) << text << " " << std::right
              << std::setw(6) << value << "\\n";
}

int main() {
    std::vector<int> case_n = {3, 3, 4, 4};
    std::vector<std::vector<Arrow>> cases = {
        {{0, 1}, {1, 2}, {2, 0}},
        {{0, 1}, {1, 2}},
        {{0, 1}, {1, 0}, {2, 3}, {3, 2}},
        {{0, 1}, {0, 2}, {0, 3}},
    };

    std::cout << std::left << std::setw(40) << "edges" << " " << std::setw(9) << "formula"
              << " " << std::setw(8) << "trying" << " " << "components" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        int count = 0;
        std::vector<Arrow> crossing;
        condense(case_n[c], cases[c], count, crossing);
        std::cout << std::left << std::setw(40) << describe(cases[c]) << " " << std::setw(9)
                  << by_formula(case_n[c], cases[c]) << " " << std::setw(8)
                  << by_trying(case_n[c], cases[c]) << " " << count << "\\n";
    }

    int trials = 2000;
    int agreed = 0, already = 0, formula_high = 0, formula_low = 0, worst = 0;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(4);
        std::vector<Arrow> edges;
        for (int u = 0; u < n; u++)
            for (int v = 0; v < n; v++)
                if (u != v && rand_below(3) == 0) edges.push_back({u, v});
        int want = by_trying(n, edges);
        int got = by_formula(n, edges);
        if (got == want) agreed++;
        if (want == 0) already++;
        if (got > want) formula_high++;
        if (got < want) formula_low++;
        if (want > worst) worst = want;
    }

    std::cout << "\\n";
    std::cout << "over " << trials << " random directed graphs on 2 to 5 nodes:\\n";
    row("the formula matched the brute force", agreed);
    row("graphs already strongly connected", already);
    row("times the formula asked for too many", formula_high);
    row("times it asked for too few", formula_low);
    row("most edges any graph needed", worst);

    std::cout << "\\n";
    std::cout << "The formula matched an exhaustive search on all " << agreed
              << " graphs. Small ones --\\n";
    std::cout << "the brute force tries every subset of every missing edge, which is why\\n";
    std::cout << "the trial size here is " << trials
              << " graphs of at most 5 nodes rather than the\\n";
    std::cout << "usual 3,000 of up to 6.\\n";
    std::cout << "\\n";
    std::cout << "Row two of the demo is the smallest interesting case. A path 0->1->2 is\\n";
    std::cout << "three components in a row: one source, one sink, one edge needed, and\\n";
    std::cout << "the edge to add is the obvious 2->0. Row four is the one that catches\\n";
    std::cout << "people -- a star pointing outwards has one source and three sinks, so\\n";
    std::cout << "it needs three edges, not one.\\n";
    std::cout << "\\n";
    std::cout << "And row one is the case the formula has to special-case. A graph that is\\n";
    std::cout << "already one component condenses to a single node, which has no incoming\\n";
    std::cout << "edge and no outgoing edge, so it counts as both a source and a sink and\\n";
    std::cout << "the formula would say 1. The answer is 0. One node is the exception, and\\n";
    std::cout << "it is worth writing down rather than discovering.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// One question the condensation answers outright: how many edges does this
// graph need before everything can reach everything?
//
// On the condensation the answer is two counts. A component with nothing
// pointing at it can never be entered from outside -- call it a source. A
// component with nothing leaving it can never be left -- a sink. Every added
// edge can fix at most one source and at most one sink, so the answer is at
// least max(sources, sinks), and it turns out that is also enough.
//
// The interesting part of that claim is "and it turns out". It is a real
// theorem with a construction behind it, and folklore is exactly the kind of
// thing this module keeps disproving -- so the formula is scored below against
// a brute force that actually tries every set of edges.
use std::collections::{BTreeMap, BTreeSet};

type Arrow = (usize, usize);

fn reachability(n: usize, edges: &[Arrow]) -> Vec<Vec<bool>> {
    let mut reach = vec![vec![false; n]; n];
    for i in 0..n {
        reach[i][i] = true;
    }
    for &(u, v) in edges {
        reach[u][v] = true;
    }
    for k in 0..n {
        for i in 0..n {
            for j in 0..n {
                if reach[i][k] && reach[k][j] {
                    reach[i][j] = true;
                }
            }
        }
    }
    reach
}

fn strongly_connected(n: usize, edges: &[Arrow]) -> bool {
    let reach = reachability(n, edges);
    (0..n).all(|u| (0..n).all(|v| reach[u][v]))
}

fn condense(n: usize, edges: &[Arrow]) -> (usize, Vec<Arrow>) {
    let reach = reachability(n, edges);
    let label: Vec<usize> = (0..n)
        .map(|v| (0..n).find(|&u| reach[u][v] && reach[v][u]).unwrap())
        .collect();
    let names: BTreeSet<usize> = label.iter().copied().collect();
    let number: BTreeMap<usize, usize> =
        names.iter().enumerate().map(|(i, &name)| (name, i)).collect();
    let small: Vec<usize> = label.iter().map(|x| number[x]).collect();
    let mut found: BTreeSet<Arrow> = BTreeSet::new();
    for &(u, v) in edges {
        if small[u] != small[v] {
            found.insert((small[u], small[v]));
        }
    }
    (names.len(), found.into_iter().collect())
}

/// max(sources, sinks) on the condensation, and zero when it is one node.
fn by_formula(n: usize, edges: &[Arrow]) -> usize {
    let (count, crossing) = condense(n, edges);
    if count == 1 {
        return 0;
    }
    let mut has_in = vec![false; count];
    let mut has_out = vec![false; count];
    for &(a, b) in &crossing {
        has_out[a] = true;
        has_in[b] = true;
    }
    let sources = (0..count).filter(|&i| !has_in[i]).count();
    let sinks = (0..count).filter(|&i| !has_out[i]).count();
    sources.max(sinks)
}

fn try_combinations(
    n: usize,
    edges: &[Arrow],
    candidates: &[Arrow],
    k: usize,
    start: usize,
    pick: &mut Vec<Arrow>,
) -> bool {
    if pick.len() == k {
        let mut all = edges.to_vec();
        all.extend(pick.iter().copied());
        return strongly_connected(n, &all);
    }
    for i in start..candidates.len() {
        pick.push(candidates[i]);
        if try_combinations(n, edges, candidates, k, i + 1, pick) {
            return true;
        }
        pick.pop();
    }
    false
}

/// Add every set of k edges, smallest k first, until one works.
///
/// Exponential and exact. This is what the formula is being scored against.
fn by_trying(n: usize, edges: &[Arrow]) -> usize {
    if strongly_connected(n, edges) {
        return 0;
    }
    let have: BTreeSet<Arrow> = edges.iter().copied().collect();
    let mut candidates: Vec<Arrow> = Vec::new();
    for u in 0..n {
        for v in 0..n {
            if u != v && !have.contains(&(u, v)) {
                candidates.push((u, v));
            }
        }
    }
    for k in 1..=n {
        let mut pick: Vec<Arrow> = Vec::new();
        if try_combinations(n, edges, &candidates, k, 0, &mut pick) {
            return k;
        }
    }
    n + 1
}

fn describe(edges: &[Arrow]) -> String {
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

fn row(text: &str, value: u64) {
    println!("  {:<42} {:>6}", text, value);
}

fn main() {
    let case_n = [3usize, 3, 4, 4];
    let cases: Vec<Vec<Arrow>> = vec![
        vec![(0, 1), (1, 2), (2, 0)],
        vec![(0, 1), (1, 2)],
        vec![(0, 1), (1, 0), (2, 3), (3, 2)],
        vec![(0, 1), (0, 2), (0, 3)],
    ];

    println!("{:<40} {:<9} {:<8} {}", "edges", "formula", "trying", "components");
    for c in 0..cases.len() {
        let (count, _) = condense(case_n[c], &cases[c]);
        println!(
            "{:<40} {:<9} {:<8} {}",
            describe(&cases[c]),
            by_formula(case_n[c], &cases[c]),
            by_trying(case_n[c], &cases[c]),
            count
        );
    }

    let mut rng = Rng { seed: 55555 };
    let trials = 2000;
    let (mut agreed, mut already) = (0u64, 0u64);
    let (mut formula_high, mut formula_low) = (0u64, 0u64);
    let mut worst = 0usize;
    for _ in 0..trials {
        let n = 2 + rng.next(4) as usize;
        let mut edges: Vec<Arrow> = Vec::new();
        for u in 0..n {
            for v in 0..n {
                if u != v && rng.next(3) == 0 {
                    edges.push((u, v));
                }
            }
        }
        let want = by_trying(n, &edges);
        let got = by_formula(n, &edges);
        if got == want {
            agreed += 1;
        }
        if want == 0 {
            already += 1;
        }
        if got > want {
            formula_high += 1;
        }
        if got < want {
            formula_low += 1;
        }
        if want > worst {
            worst = want;
        }
    }

    println!();
    println!("over {} random directed graphs on 2 to 5 nodes:", trials);
    row("the formula matched the brute force", agreed);
    row("graphs already strongly connected", already);
    row("times the formula asked for too many", formula_high);
    row("times it asked for too few", formula_low);
    row("most edges any graph needed", worst as u64);

    println!();
    println!(
        "The formula matched an exhaustive search on all {} graphs. Small ones --",
        agreed
    );
    println!("the brute force tries every subset of every missing edge, which is why");
    println!(
        "the trial size here is {} graphs of at most 5 nodes rather than the",
        trials
    );
    println!("usual 3,000 of up to 6.");
    println!();
    println!("Row two of the demo is the smallest interesting case. A path 0->1->2 is");
    println!("three components in a row: one source, one sink, one edge needed, and");
    println!("the edge to add is the obvious 2->0. Row four is the one that catches");
    println!("people -- a star pointing outwards has one source and three sinks, so");
    println!("it needs three edges, not one.");
    println!();
    println!("And row one is the case the formula has to special-case. A graph that is");
    println!("already one component condenses to a single node, which has no incoming");
    println!("edge and no outgoing edge, so it counts as both a source and a sink and");
    println!("the formula would say 1. The answer is 0. One node is the exception, and");
    println!("it is worth writing down rather than discovering.");
}
`,
            },
            {
              lang: "go",
              code: `// One question the condensation answers outright: how many edges does this
// graph need before everything can reach everything?
//
// On the condensation the answer is two counts. A component with nothing
// pointing at it can never be entered from outside -- call it a source. A
// component with nothing leaving it can never be left -- a sink. Every added
// edge can fix at most one source and at most one sink, so the answer is at
// least max(sources, sinks), and it turns out that is also enough.
//
// The interesting part of that claim is "and it turns out". It is a real
// theorem with a construction behind it, and folklore is exactly the kind of
// thing this module keeps disproving -- so the formula is scored below against
// a brute force that actually tries every set of edges.
package main

import (
	"fmt"
	"sort"
	"strings"
)

// Arrow is a directed edge.
type Arrow struct {
	U, V int
}

func reachability(n int, edges []Arrow) [][]bool {
	reach := make([][]bool, n)
	for i := range reach {
		reach[i] = make([]bool, n)
		reach[i][i] = true
	}
	for _, e := range edges {
		reach[e.U][e.V] = true
	}
	for k := 0; k < n; k++ {
		for i := 0; i < n; i++ {
			for j := 0; j < n; j++ {
				if reach[i][k] && reach[k][j] {
					reach[i][j] = true
				}
			}
		}
	}
	return reach
}

func stronglyConnected(n int, edges []Arrow) bool {
	reach := reachability(n, edges)
	for u := 0; u < n; u++ {
		for v := 0; v < n; v++ {
			if !reach[u][v] {
				return false
			}
		}
	}
	return true
}

func condense(n int, edges []Arrow) (int, []Arrow) {
	reach := reachability(n, edges)
	label := make([]int, n)
	for v := 0; v < n; v++ {
		smallest := v
		for u := 0; u < n; u++ {
			if reach[u][v] && reach[v][u] && u < smallest {
				smallest = u
			}
		}
		label[v] = smallest
	}
	seen := map[int]bool{}
	for _, x := range label {
		seen[x] = true
	}
	names := make([]int, 0, len(seen))
	for x := range seen {
		names = append(names, x)
	}
	sort.Ints(names)
	number := map[int]int{}
	for i, name := range names {
		number[name] = i
	}
	small := make([]int, n)
	for v := 0; v < n; v++ {
		small[v] = number[label[v]]
	}
	found := map[Arrow]bool{}
	for _, e := range edges {
		if small[e.U] != small[e.V] {
			found[Arrow{small[e.U], small[e.V]}] = true
		}
	}
	crossing := make([]Arrow, 0, len(found))
	for a := range found {
		crossing = append(crossing, a)
	}
	sort.Slice(crossing, func(i, j int) bool {
		if crossing[i].U != crossing[j].U {
			return crossing[i].U < crossing[j].U
		}
		return crossing[i].V < crossing[j].V
	})
	return len(names), crossing
}

// byFormula is max(sources, sinks) on the condensation, and zero when it is
// one node.
func byFormula(n int, edges []Arrow) int {
	count, crossing := condense(n, edges)
	if count == 1 {
		return 0
	}
	hasIn := make([]bool, count)
	hasOut := make([]bool, count)
	for _, e := range crossing {
		hasOut[e.U] = true
		hasIn[e.V] = true
	}
	sources, sinks := 0, 0
	for i := 0; i < count; i++ {
		if !hasIn[i] {
			sources++
		}
		if !hasOut[i] {
			sinks++
		}
	}
	if sources > sinks {
		return sources
	}
	return sinks
}

func tryCombinations(n int, edges, candidates []Arrow, k, start int, pick []Arrow) bool {
	if len(pick) == k {
		all := append(append([]Arrow{}, edges...), pick...)
		return stronglyConnected(n, all)
	}
	for i := start; i < len(candidates); i++ {
		pick = append(pick, candidates[i])
		if tryCombinations(n, edges, candidates, k, i+1, pick) {
			return true
		}
		pick = pick[:len(pick)-1]
	}
	return false
}

// byTrying adds every set of k edges, smallest k first, until one works.
//
// Exponential and exact. This is what the formula is being scored against.
func byTrying(n int, edges []Arrow) int {
	if stronglyConnected(n, edges) {
		return 0
	}
	have := map[Arrow]bool{}
	for _, e := range edges {
		have[e] = true
	}
	var candidates []Arrow
	for u := 0; u < n; u++ {
		for v := 0; v < n; v++ {
			if u != v && !have[Arrow{u, v}] {
				candidates = append(candidates, Arrow{u, v})
			}
		}
	}
	for k := 1; k <= n; k++ {
		if tryCombinations(n, edges, candidates, k, 0, nil) {
			return k
		}
	}
	return -1
}

func describe(edges []Arrow) string {
	cells := make([]string, len(edges))
	for i, e := range edges {
		cells[i] = fmt.Sprintf("%d->%d", e.U, e.V)
	}
	return "[" + strings.Join(cells, ", ") + "]"
}

// The same linear congruential generator in every language, so the random
// graphs below are the same graphs whichever translation is run.
var seed int64 = 55555

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func row(text string, value int) {
	fmt.Printf("  %-42s %6d\\n", text, value)
}

func main() {
	caseN := []int{3, 3, 4, 4}
	cases := [][]Arrow{
		{{0, 1}, {1, 2}, {2, 0}},
		{{0, 1}, {1, 2}},
		{{0, 1}, {1, 0}, {2, 3}, {3, 2}},
		{{0, 1}, {0, 2}, {0, 3}},
	}

	fmt.Printf("%-40s %-9s %-8s %s\\n", "edges", "formula", "trying", "components")
	for c := range cases {
		count, _ := condense(caseN[c], cases[c])
		fmt.Printf("%-40s %-9d %-8d %d\\n", describe(cases[c]),
			byFormula(caseN[c], cases[c]), byTrying(caseN[c], cases[c]), count)
	}

	trials := 2000
	agreed, already, formulaHigh, formulaLow, worst := 0, 0, 0, 0, 0
	for t := 0; t < trials; t++ {
		n := 2 + randBelow(4)
		var edges []Arrow
		for u := 0; u < n; u++ {
			for v := 0; v < n; v++ {
				if u != v && randBelow(3) == 0 {
					edges = append(edges, Arrow{u, v})
				}
			}
		}
		want := byTrying(n, edges)
		got := byFormula(n, edges)
		if got == want {
			agreed++
		}
		if want == 0 {
			already++
		}
		if got > want {
			formulaHigh++
		}
		if got < want {
			formulaLow++
		}
		if want > worst {
			worst = want
		}
	}

	fmt.Println()
	fmt.Printf("over %d random directed graphs on 2 to 5 nodes:\\n", trials)
	row("the formula matched the brute force", agreed)
	row("graphs already strongly connected", already)
	row("times the formula asked for too many", formulaHigh)
	row("times it asked for too few", formulaLow)
	row("most edges any graph needed", worst)

	fmt.Println()
	fmt.Printf("The formula matched an exhaustive search on all %d graphs. Small ones --\\n", agreed)
	fmt.Println("the brute force tries every subset of every missing edge, which is why")
	fmt.Printf("the trial size here is %d graphs of at most 5 nodes rather than the\\n", trials)
	fmt.Println("usual 3,000 of up to 6.")
	fmt.Println()
	fmt.Println("Row two of the demo is the smallest interesting case. A path 0->1->2 is")
	fmt.Println("three components in a row: one source, one sink, one edge needed, and")
	fmt.Println("the edge to add is the obvious 2->0. Row four is the one that catches")
	fmt.Println("people -- a star pointing outwards has one source and three sinks, so")
	fmt.Println("it needs three edges, not one.")
	fmt.Println()
	fmt.Println("And row one is the case the formula has to special-case. A graph that is")
	fmt.Println("already one component condenses to a single node, which has no incoming")
	fmt.Println("edge and no outgoing edge, so it counts as both a source and a sink and")
	fmt.Println("the formula would say 1. The answer is 0. One node is the exception, and")
	fmt.Println("it is worth writing down rather than discovering.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Applying max(sources, sinks) to a graph that is already strongly connected",
          body: "Its condensation is one node, which has no incoming and no outgoing edge, so it counts as both a source and a sink and the formula reads 1. The answer is 0. Special-case it explicitly.",
        },
        {
          title: "Counting sources and sinks on the original graph",
          body: "Indegree zero on a node is not the same as indegree zero on its component. The counts only mean anything after condensing -- a node inside a cycle always has an incoming edge and is still stuck if its whole component is unreachable.",
        },
        {
          title: "Assuming the answer is the number of components minus one",
          body: "That is the answer for a tree-shaped question, not this one. A star pointing outwards from one node has four components and needs three edges; a path of three components needs one.",
        },
      ],
    },
    {
      id: "strongly-connected-components-in-four-lines",
      heading: "Strongly connected components in four lines",
      body: [
        "Strongly connected components, in four lines.",
        "**Same component means each can reach the other**, which is not what \"component\" means on an undirected graph \u2014 that reading matched on 418 of 3,000 graphs and wrongly merged 14,782 pairs.",
        "**Kosaraju is two passes and Tarjan is one**, and both matched the definition on all 3,000.",
        "**Collapse the components and the result is a DAG, always** \u2014 3,000 of 3,000, and it cannot fail, because a cycle between components would have merged them.",
        "**The condensation answers the graph's questions on a smaller graph**: reachability agreed on all 3,000, on 8,776 nodes instead of 13,514.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a strongly connected component, and how would you find them?",
      answer:
        "A maximal set of nodes where every one can reach every other -- mutual reachability, so it is only a meaningful idea on a directed graph. Two standard algorithms. Kosaraju is two passes: a depth-first search recording finish times, then a second search on the graph with every edge reversed, taking nodes in reverse finish order; each tree in the second pass is a component. Tarjan is one pass with a lowlink -- for each node, the oldest node still on the stack that its subtree can reach -- and when a node's lowlink equals its own index, everything above it on the stack is a component. I checked both against the definition itself, computing mutual reachability by transitive closure, on 3,000 random graphs: both exact. The one to watch out for is the wrong answer that shares the name -- undirected connected components matched on only 418 of those 3,000.",
    },
    {
      question: "Why does collapsing the components give a DAG?",
      answer:
        "Because a cycle in the condensation would be a route from component A to component B and a route back, which makes every node in A mutually reachable with every node in B -- so they would have been one component to begin with. It is not a property that can fail, and I measured it anyway: 1,967 of 3,000 random graphs held a cycle, and all 3,000 condensations were acyclic. That is the whole reason to compute components. Inside one, every node has the same answer to what it can reach and what can reach it, so all the interesting structure is between components -- where there are no cycles, which means topological order and one-pass dynamic programming apply. I confirmed reachability answered on the condensation agreed with reachability on the original on all 3,000, on a graph with 8,776 nodes instead of 13,514.",
    },
    {
      question: "How many edges does it take to make a directed graph strongly connected?",
      answer:
        "Condense it first. If the condensation is a single node the answer is zero. Otherwise count the components with no incoming edge -- sources -- and those with no outgoing edge -- sinks; the answer is max of the two. The lower bound is easy: every added edge gives an incoming edge to at most one source and an outgoing edge to at most one sink. That it is also achievable is the part worth not taking on trust, so I scored the formula against a brute force that tries every subset of every missing edge: it matched on all 2,000 random graphs, never high and never low. The trap is the single-component case -- one node has no incoming and no outgoing edge, so it counts as both a source and a sink and the formula reads 1 when the answer is 0.",
    },
    {
      question: "Where do strongly connected components show up in practice?",
      answer:
        "Anywhere a directed graph has cycles you need to reason past. Dependency graphs are the common one: a build or module graph with a cycle in it cannot be topologically sorted, but its condensation can, so the components tell you exactly which groups have to be handled together and the DAG tells you the order for the rest. Deadlock detection is the same shape -- a cycle in a wait-for graph is a component with more than one node. 2-SAT is the neat one: build an implication graph from the clauses and the formula is satisfiable exactly when no variable shares a component with its own negation, which is one Tarjan pass. And any reachability question on a big directed graph gets cheaper by asking it on the condensation first.",
    },
  ],
  takeaways: [
    "Same component means mutual reachability \u2014 a directed idea, unlike \"connected component\".",
    "The undirected reading matched on 418 of 3,000 graphs and merged 14,782 pairs wrongly.",
    "A path `0\u21921\u21922\u21923` has four components, not one.",
    "Kosaraju: finish times, then the reversed graph. Tarjan: one pass with a lowlink.",
    "Both matched the definition on all 3,000 random graphs.",
    "The condensation is always a DAG \u2014 a cycle between components would have merged them.",
    "It shrinks a graph exactly when the graph had a cycle: the same 1,967 both times.",
    "Reachability on the condensation agreed on all 3,000, on 8,776 nodes instead of 13,514.",
    "Edges needed to make a graph strongly connected: `max(sources, sinks)` on the condensation.",
    "Except when the condensation is one node, where the formula says 1 and the answer is 0.",
  ],
  status: "available",
};
