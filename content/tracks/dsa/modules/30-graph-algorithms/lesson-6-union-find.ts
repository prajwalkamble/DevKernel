import type { Lesson } from "@/content/types";

export const unionFindLesson: Lesson = {
  id: "dsa-graph-algorithms-union-find",
  slug: "union-find",
  moduleSlug: "graph-algorithms",
  title: "Union-Find: Grouping Under Merges",
  summary:
    "Connectivity when the graph is still being built, which is the case a search cannot handle. What union-find replaces and what it costs before the standard fixes; the two fixes measured separately, because they do genuinely different jobs; and the one operation it cannot do at all, plus the reversal trick that gets round it anyway.",
  estimatedMinutes: 40,
  objectives: [
    "Say why a search is the wrong tool once merges are interleaved with queries",
    "Implement union-find and know what the bare version costs",
    "Separate what union by size does from what path compression does",
    "Recognise that union-find cannot delete, and why",
    "Turn an offline deletion stream into an insertion stream",
  ],
  sections: [
    {
      id: "the-same-group-so-far",
      heading: "The same group, so far",
      body: [
        "\"Are these two in the same group?\" is graph connectivity, and module 29 answered it with a search. That answer stops working when the graph keeps growing: edges arrive one at a time and queries are interleaved with them, so there is no finished graph to search.",
        "Three structures handle that, and all three are correct \u2014 over 3,000 random operation streams every one of them matched a definition that recomputed the whole picture from scratch at each query. What separates them is where the work sits.",
        "**A search per query** re-walks a component that has not changed since the last time it walked it. **A label array** \u2014 one component number per node \u2014 makes a query one comparison, and pays for it at every merge by rewriting a whole side. **Union-find** gives each node a single parent pointer: a merge is one write, and a query follows pointers until it reaches a root.",
        "That last trade is the interesting one, and the first version of it is not yet a win. On a stream that merges 1,600 nodes in the order that builds the longest chain, the search took 3,839,199 steps, the label array 2,558,400 writes and bare union-find 1,279,200 pointer hops. Better, and still quadratic.",
        "The reason is visible in the number: a chain of merges builds a chain of pointers, and then every query walks it. Which is exactly what the next example fixes.",
      ],
      examples: [
        {
          id: "three-ways-to-group",
          title: "A search, a label array and one parent pointer",
          lang: "python",
          code: `# Three ways to answer "are these two in the same group, so far?"
#
# The question sounds like graph connectivity, and it is -- but the graph keeps
# growing. Edges arrive one at a time and queries are interleaved with them, so
# there is no finished graph to run a search on.
#
#   search per query -- correct, and re-walks the component every time
#   label array      -- one number per node; merging rewrites one whole side
#   union-find       -- one parent pointer per node; merging is one write
#
# All three answer every query correctly. The interesting part is what they
# cost, and the answer is not close.
from collections import deque


def by_search(n, ops):
    """Rebuild nothing, walk everything. One search per query."""
    adj = [[] for _ in range(n)]
    answers = []
    steps = 0
    for kind, a, b in ops:
        if kind == 0:
            adj[a].append(b)
            adj[b].append(a)
            continue
        seen = [False] * n
        seen[a] = True
        q = deque([a])
        found = a == b
        while q:
            at = q.popleft()
            steps += 1
            for nxt in adj[at]:
                steps += 1
                if not seen[nxt]:
                    seen[nxt] = True
                    if nxt == b:
                        found = True
                    q.append(nxt)
        answers.append(found)
    return answers, steps


def by_labels(n, ops):
    """One label per node. A query is one comparison; a merge rewrites a side."""
    label = list(range(n))
    answers = []
    writes = 0
    for kind, a, b in ops:
        if kind == 0:
            if label[a] != label[b]:
                old, new = label[b], label[a]
                for v in range(n):
                    writes += 1
                    if label[v] == old:
                        label[v] = new
            continue
        answers.append(label[a] == label[b])
    return answers, writes


def by_union_find(n, ops):
    """One parent pointer per node. A merge is a single write.

    No path compression and no union by rank yet -- those are the next
    example. This is the bare idea: every node points at another node in its
    group, and following the pointers far enough lands on the group's root.
    """
    parent = list(range(n))
    answers = []
    hops = 0

    def find(v):
        nonlocal hops
        while parent[v] != v:
            hops += 1
            v = parent[v]
        return v

    for kind, a, b in ops:
        ra, rb = find(a), find(b)
        if kind == 0:
            if ra != rb:
                parent[rb] = ra
            continue
        answers.append(ra == rb)
    return answers, hops


def components_now(n, edges):
    """The definition, recomputed from scratch: which nodes reach which."""
    reach = [[False] * n for _ in range(n)]
    for i in range(n):
        reach[i][i] = True
    for u, v in edges:
        reach[u][v] = True
        reach[v][u] = True
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if reach[i][k] and reach[k][j]:
                    reach[i][j] = True
    return reach


def truth(n, ops):
    """Every query answered by rebuilding the whole picture at that moment."""
    edges = []
    answers = []
    for kind, a, b in ops:
        if kind == 0:
            edges.append((a, b))
            continue
        answers.append(components_now(n, edges)[a][b])
    return answers


def show(flags):
    return "".join("y" if x else "." for x in flags)


def describe(ops):
    parts = []
    for kind, a, b in ops:
        parts.append(("%d-%d" if kind == 0 else "%d?%d") % (a, b))
    return " ".join(parts)


CASES = [
    (4, [(0, 0, 1), (1, 0, 1), (1, 0, 2), (0, 2, 3), (1, 0, 3), (0, 1, 2), (1, 0, 3)]),
    (5, [(1, 0, 4), (0, 0, 1), (0, 1, 2), (0, 2, 3), (0, 3, 4), (1, 0, 4)]),
    (3, [(1, 0, 0), (0, 1, 2), (1, 0, 1), (1, 1, 2)]),
]

print("%-42s %-9s %-9s %s" % ("operations (a-b merge, a?b query)", "search", "labels", "union-find"))
for n, ops in CASES:
    a, _ = by_search(n, ops)
    b, _ = by_labels(n, ops)
    c, _ = by_union_find(n, ops)
    print("%-42s %-9s %-9s %s" % (describe(ops), show(a), show(b), show(c)))

# The same linear congruential generator in every language, so the random
# operation streams below are the same streams whichever translation is run.
seed = 606


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


trials = 3000
search_ok = labels_ok = uf_ok = 0
for _ in range(trials):
    n = 2 + rand(5)
    ops = []
    for _ in range(2 * n):
        ops.append((rand(2), rand(n), rand(n)))
    want = truth(n, ops)
    a, _ = by_search(n, ops)
    b, _ = by_labels(n, ops)
    c, _ = by_union_find(n, ops)
    search_ok += a == want
    labels_ok += b == want
    uf_ok += c == want

print()
print("over %d random operation streams on up to 6 nodes:" % trials)
print("  %-40s %6d" % ("search per query matched the definition", search_ok))
print("  %-40s %6d" % ("label array matched it", labels_ok))
print("  %-40s %6d" % ("union-find matched it", uf_ok))

print()
print("and what each one costs on a stream that merges everything, in the")
print("order that builds the longest chain of pointers:")
print("%-8s %14s %14s %14s" % ("nodes", "search steps", "label writes", "uf hops"))
for n in (200, 400, 800, 1600):
    ops = []
    for v in range(n - 1):
        ops.append((0, v + 1, v))
        ops.append((1, 0, v + 1))
    _, steps = by_search(n, ops)
    _, writes = by_labels(n, ops)
    _, hops = by_union_find(n, ops)
    print("%-8d %14d %14d %14d" % (n, steps, writes, hops))

print()
print("All three are correct on every stream. What separates them is the shape")
print("of the work. The search re-walks a component that has not changed since")
print("the last time it walked it. The label array is fast to query -- one")
print("comparison -- and pays for it at every merge, rewriting a whole side.")
print()
print("Union-find writes one pointer per merge and follows pointers on a query,")
print("which trades the cost the other way round. On this stream that is still")
print("quadratic, because the chain of merges builds a chain of pointers -- and")
print("that is exactly the problem the next example is about.")
`,
          output: `operations (a-b merge, a?b query)          search    labels    union-find
0-1 0?1 0?2 2-3 0?3 1-2 0?3                y..y      y..y      y..y
0?4 0-1 1-2 2-3 3-4 0?4                    .y        .y        .y
0?0 1-2 0?1 1?2                            y.y       y.y       y.y

over 3000 random operation streams on up to 6 nodes:
  search per query matched the definition    3000
  label array matched it                     3000
  union-find matched it                      3000

and what each one costs on a stream that merges everything, in the
order that builds the longest chain of pointers:
nodes      search steps   label writes        uf hops
200               59899          39800          19900
400              239799         159600          79800
800              959599         639200         319600
1600            3839199        2558400        1279200

All three are correct on every stream. What separates them is the shape
of the work. The search re-walks a component that has not changed since
the last time it walked it. The label array is fast to query -- one
comparison -- and pays for it at every merge, rewriting a whole side.

Union-find writes one pointer per merge and follows pointers on a query,
which trades the cost the other way round. On this stream that is still
quadratic, because the chain of merges builds a chain of pointers -- and
that is exactly the problem the next example is about.`,
          explanation:
            "Three correct answers to the same question, scored against recomputing the components from scratch at every query. The cost columns are the reason only one of them is the standard answer.",
          alternates: [
            {
              lang: "javascript",
              code: `// Three ways to answer "are these two in the same group, so far?"
//
// The question sounds like graph connectivity, and it is -- but the graph keeps
// growing. Edges arrive one at a time and queries are interleaved with them, so
// there is no finished graph to run a search on.
//
//   search per query -- correct, and re-walks the component every time
//   label array      -- one number per node; merging rewrites one whole side
//   union-find       -- one parent pointer per node; merging is one write
//
// All three answer every query correctly. The interesting part is what they
// cost, and the answer is not close.

// Rebuild nothing, walk everything. One search per query.
function bySearch(n, ops) {
  const adj = Array.from({ length: n }, () => []);
  const answers = [];
  let steps = 0;
  for (const [kind, a, b] of ops) {
    if (kind === 0) {
      adj[a].push(b);
      adj[b].push(a);
      continue;
    }
    const seen = new Array(n).fill(false);
    seen[a] = true;
    const q = [a];
    let head = 0;
    let found = a === b;
    while (head < q.length) {
      const at = q[head];
      head += 1;
      steps += 1;
      for (const nxt of adj[at]) {
        steps += 1;
        if (!seen[nxt]) {
          seen[nxt] = true;
          if (nxt === b) found = true;
          q.push(nxt);
        }
      }
    }
    answers.push(found);
  }
  return [answers, steps];
}

// One label per node. A query is one comparison; a merge rewrites a side.
function byLabels(n, ops) {
  const label = Array.from({ length: n }, (_, i) => i);
  const answers = [];
  let writes = 0;
  for (const [kind, a, b] of ops) {
    if (kind === 0) {
      if (label[a] !== label[b]) {
        const old = label[b];
        const fresh = label[a];
        for (let v = 0; v < n; v += 1) {
          writes += 1;
          if (label[v] === old) label[v] = fresh;
        }
      }
      continue;
    }
    answers.push(label[a] === label[b]);
  }
  return [answers, writes];
}

// One parent pointer per node. A merge is a single write.
//
// No path compression and no union by rank yet -- those are the next
// example. This is the bare idea: every node points at another node in its
// group, and following the pointers far enough lands on the group's root.
function byUnionFind(n, ops) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const answers = [];
  let hops = 0;

  const find = (v) => {
    let at = v;
    while (parent[at] !== at) {
      hops += 1;
      at = parent[at];
    }
    return at;
  };

  for (const [kind, a, b] of ops) {
    const ra = find(a);
    const rb = find(b);
    if (kind === 0) {
      if (ra !== rb) parent[rb] = ra;
      continue;
    }
    answers.push(ra === rb);
  }
  return [answers, hops];
}

// The definition, recomputed from scratch: which nodes reach which.
function componentsNow(n, edges) {
  const reach = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let i = 0; i < n; i += 1) reach[i][i] = true;
  for (const [u, v] of edges) {
    reach[u][v] = true;
    reach[v][u] = true;
  }
  for (let k = 0; k < n; k += 1)
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1)
        if (reach[i][k] && reach[k][j]) reach[i][j] = true;
  return reach;
}

// Every query answered by rebuilding the whole picture at that moment.
function truth(n, ops) {
  const edges = [];
  const answers = [];
  for (const [kind, a, b] of ops) {
    if (kind === 0) {
      edges.push([a, b]);
      continue;
    }
    answers.push(componentsNow(n, edges)[a][b]);
  }
  return answers;
}

function show(flags) {
  return flags.map((x) => (x ? "y" : ".")).join("");
}

function describe(ops) {
  return ops.map(([kind, a, b]) => (kind === 0 ? \`\${a}-\${b}\` : \`\${a}?\${b}\`)).join(" ");
}

const CASES = [
  [4, [[0, 0, 1], [1, 0, 1], [1, 0, 2], [0, 2, 3], [1, 0, 3], [0, 1, 2], [1, 0, 3]]],
  [5, [[1, 0, 4], [0, 0, 1], [0, 1, 2], [0, 2, 3], [0, 3, 4], [1, 0, 4]]],
  [3, [[1, 0, 0], [0, 1, 2], [1, 0, 1], [1, 1, 2]]],
];

console.log(
  "operations (a-b merge, a?b query)".padEnd(42) + " " + "search".padEnd(9) + " " +
  "labels".padEnd(9) + " " + "union-find",
);
for (const [n, ops] of CASES) {
  const [a] = bySearch(n, ops);
  const [b] = byLabels(n, ops);
  const [c] = byUnionFind(n, ops);
  console.log(
    describe(ops).padEnd(42) + " " + show(a).padEnd(9) + " " + show(b).padEnd(9) + " " + show(c),
  );
}

// The same linear congruential generator in every language, so the random
// operation streams below are the same streams whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 606n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let searchOk = 0;
let labelsOk = 0;
let ufOk = 0;
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
for (let t = 0; t < trials; t += 1) {
  const n = 2 + rand(5);
  const ops = [];
  for (let i = 0; i < 2 * n; i += 1) ops.push([rand(2), rand(n), rand(n)]);
  const want = truth(n, ops);
  const [a] = bySearch(n, ops);
  const [b] = byLabels(n, ops);
  const [c] = byUnionFind(n, ops);
  if (same(a, want)) searchOk += 1;
  if (same(b, want)) labelsOk += 1;
  if (same(c, want)) ufOk += 1;
}

const row = (text, value) => "  " + text.padEnd(40) + " " + String(value).padStart(6);

console.log();
console.log(\`over \${trials} random operation streams on up to 6 nodes:\`);
console.log(row("search per query matched the definition", searchOk));
console.log(row("label array matched it", labelsOk));
console.log(row("union-find matched it", ufOk));

console.log();
console.log("and what each one costs on a stream that merges everything, in the");
console.log("order that builds the longest chain of pointers:");
console.log(
  "nodes".padEnd(8) + " " + "search steps".padStart(14) + " " +
  "label writes".padStart(14) + " " + "uf hops".padStart(14),
);
for (const n of [200, 400, 800, 1600]) {
  const ops = [];
  for (let v = 0; v < n - 1; v += 1) {
    ops.push([0, v + 1, v]);
    ops.push([1, 0, v + 1]);
  }
  const [, steps] = bySearch(n, ops);
  const [, writes] = byLabels(n, ops);
  const [, hops] = byUnionFind(n, ops);
  console.log(
    String(n).padEnd(8) + " " + String(steps).padStart(14) + " " +
    String(writes).padStart(14) + " " + String(hops).padStart(14),
  );
}

console.log();
console.log("All three are correct on every stream. What separates them is the shape");
console.log("of the work. The search re-walks a component that has not changed since");
console.log("the last time it walked it. The label array is fast to query -- one");
console.log("comparison -- and pays for it at every merge, rewriting a whole side.");
console.log();
console.log("Union-find writes one pointer per merge and follows pointers on a query,");
console.log("which trades the cost the other way round. On this stream that is still");
console.log("quadratic, because the chain of merges builds a chain of pointers -- and");
console.log("that is exactly the problem the next example is about.");
`,
            },
            {
              lang: "typescript",
              code: `// Three ways to answer "are these two in the same group, so far?"
//
// The question sounds like graph connectivity, and it is -- but the graph keeps
// growing. Edges arrive one at a time and queries are interleaved with them, so
// there is no finished graph to run a search on.
//
//   search per query -- correct, and re-walks the component every time
//   label array      -- one number per node; merging rewrites one whole side
//   union-find       -- one parent pointer per node; merging is one write
//
// All three answer every query correctly. The interesting part is what they
// cost, and the answer is not close.

// Rebuild nothing, walk everything. One search per query.
function bySearch(n: number, ops: number[][]): [boolean[], number] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  const answers: boolean[] = [];
  let steps = 0;
  for (const [kind, a, b] of ops) {
    if (kind === 0) {
      adj[a].push(b);
      adj[b].push(a);
      continue;
    }
    const seen = new Array(n).fill(false);
    seen[a] = true;
    const q: number[] = [a];
    let head = 0;
    let found = a === b;
    while (head < q.length) {
      const at = q[head];
      head += 1;
      steps += 1;
      for (const nxt of adj[at]) {
        steps += 1;
        if (!seen[nxt]) {
          seen[nxt] = true;
          if (nxt === b) found = true;
          q.push(nxt);
        }
      }
    }
    answers.push(found);
  }
  return [answers, steps];
}

// One label per node. A query is one comparison; a merge rewrites a side.
function byLabels(n: number, ops: number[][]): [boolean[], number] {
  const label = Array.from({ length: n }, (_, i) => i);
  const answers: boolean[] = [];
  let writes = 0;
  for (const [kind, a, b] of ops) {
    if (kind === 0) {
      if (label[a] !== label[b]) {
        const old = label[b];
        const fresh = label[a];
        for (let v = 0; v < n; v += 1) {
          writes += 1;
          if (label[v] === old) label[v] = fresh;
        }
      }
      continue;
    }
    answers.push(label[a] === label[b]);
  }
  return [answers, writes];
}

// One parent pointer per node. A merge is a single write.
//
// No path compression and no union by rank yet -- those are the next
// example. This is the bare idea: every node points at another node in its
// group, and following the pointers far enough lands on the group's root.
function byUnionFind(n: number, ops: number[][]): [boolean[], number] {
  const parent = Array.from({ length: n }, (_, i) => i);
  const answers: boolean[] = [];
  let hops = 0;

  const find = (v: number): number => {
    let at = v;
    while (parent[at] !== at) {
      hops += 1;
      at = parent[at];
    }
    return at;
  };

  for (const [kind, a, b] of ops) {
    const ra = find(a);
    const rb = find(b);
    if (kind === 0) {
      if (ra !== rb) parent[rb] = ra;
      continue;
    }
    answers.push(ra === rb);
  }
  return [answers, hops];
}

// The definition, recomputed from scratch: which nodes reach which.
function componentsNow(n: number, edges: number[][]): boolean[][] {
  const reach = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let i = 0; i < n; i += 1) reach[i][i] = true;
  for (const [u, v] of edges) {
    reach[u][v] = true;
    reach[v][u] = true;
  }
  for (let k = 0; k < n; k += 1)
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1)
        if (reach[i][k] && reach[k][j]) reach[i][j] = true;
  return reach;
}

// Every query answered by rebuilding the whole picture at that moment.
function truth(n: number, ops: number[][]): boolean[] {
  const edges: number[][] = [];
  const answers: boolean[] = [];
  for (const [kind, a, b] of ops) {
    if (kind === 0) {
      edges.push([a, b]);
      continue;
    }
    answers.push(componentsNow(n, edges)[a][b]);
  }
  return answers;
}

function show(flags: boolean[]): string {
  return flags.map((x) => (x ? "y" : ".")).join("");
}

function describe(ops: number[][]): string {
  return ops.map(([kind, a, b]) => (kind === 0 ? \`\${a}-\${b}\` : \`\${a}?\${b}\`)).join(" ");
}

const CASES: [number, number[][]][] = [
  [4, [[0, 0, 1], [1, 0, 1], [1, 0, 2], [0, 2, 3], [1, 0, 3], [0, 1, 2], [1, 0, 3]]],
  [5, [[1, 0, 4], [0, 0, 1], [0, 1, 2], [0, 2, 3], [0, 3, 4], [1, 0, 4]]],
  [3, [[1, 0, 0], [0, 1, 2], [1, 0, 1], [1, 1, 2]]],
];

console.log(
  "operations (a-b merge, a?b query)".padEnd(42) + " " + "search".padEnd(9) + " " +
  "labels".padEnd(9) + " " + "union-find",
);
for (const [n, ops] of CASES) {
  const [a] = bySearch(n, ops);
  const [b] = byLabels(n, ops);
  const [c] = byUnionFind(n, ops);
  console.log(
    describe(ops).padEnd(42) + " " + show(a).padEnd(9) + " " + show(b).padEnd(9) + " " + show(c),
  );
}

// The same linear congruential generator in every language, so the random
// operation streams below are the same streams whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 606n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let searchOk = 0;
let labelsOk = 0;
let ufOk = 0;
const same = (a: boolean[], b: boolean[]): boolean => a.length === b.length && a.every((x, i) => x === b[i]);
for (let t = 0; t < trials; t += 1) {
  const n = 2 + rand(5);
  const ops: number[][] = [];
  for (let i = 0; i < 2 * n; i += 1) ops.push([rand(2), rand(n), rand(n)]);
  const want = truth(n, ops);
  const [a] = bySearch(n, ops);
  const [b] = byLabels(n, ops);
  const [c] = byUnionFind(n, ops);
  if (same(a, want)) searchOk += 1;
  if (same(b, want)) labelsOk += 1;
  if (same(c, want)) ufOk += 1;
}

const row = (text: string, value: number): string => "  " + text.padEnd(40) + " " + String(value).padStart(6);

console.log();
console.log(\`over \${trials} random operation streams on up to 6 nodes:\`);
console.log(row("search per query matched the definition", searchOk));
console.log(row("label array matched it", labelsOk));
console.log(row("union-find matched it", ufOk));

console.log();
console.log("and what each one costs on a stream that merges everything, in the");
console.log("order that builds the longest chain of pointers:");
console.log(
  "nodes".padEnd(8) + " " + "search steps".padStart(14) + " " +
  "label writes".padStart(14) + " " + "uf hops".padStart(14),
);
for (const n of [200, 400, 800, 1600]) {
  const ops: number[][] = [];
  for (let v = 0; v < n - 1; v += 1) {
    ops.push([0, v + 1, v]);
    ops.push([1, 0, v + 1]);
  }
  const [, steps] = bySearch(n, ops);
  const [, writes] = byLabels(n, ops);
  const [, hops] = byUnionFind(n, ops);
  console.log(
    String(n).padEnd(8) + " " + String(steps).padStart(14) + " " +
    String(writes).padStart(14) + " " + String(hops).padStart(14),
  );
}

console.log();
console.log("All three are correct on every stream. What separates them is the shape");
console.log("of the work. The search re-walks a component that has not changed since");
console.log("the last time it walked it. The label array is fast to query -- one");
console.log("comparison -- and pays for it at every merge, rewriting a whole side.");
console.log();
console.log("Union-find writes one pointer per merge and follows pointers on a query,");
console.log("which trades the cost the other way round. On this stream that is still");
console.log("quadratic, because the chain of merges builds a chain of pointers -- and");
console.log("that is exactly the problem the next example is about.");
`,
            },
            {
              lang: "java",
              code: `// Three ways to answer "are these two in the same group, so far?"
//
// The question sounds like graph connectivity, and it is -- but the graph keeps
// growing. Edges arrive one at a time and queries are interleaved with them, so
// there is no finished graph to run a search on.
//
//   search per query -- correct, and re-walks the component every time
//   label array      -- one number per node; merging rewrites one whole side
//   union-find       -- one parent pointer per node; merging is one write
//
// All three answer every query correctly. The interesting part is what they
// cost, and the answer is not close.
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

public class Main {
    /** Rebuild nothing, walk everything. One search per query. */
    static List<Boolean> bySearch(int n, int[][] ops, long[] stats) {
        @SuppressWarnings("unchecked")
        List<Integer>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        List<Boolean> answers = new ArrayList<>();
        long steps = 0;
        for (int[] op : ops) {
            int kind = op[0], a = op[1], b = op[2];
            if (kind == 0) {
                adj[a].add(b);
                adj[b].add(a);
                continue;
            }
            boolean[] seen = new boolean[n];
            seen[a] = true;
            Deque<Integer> q = new ArrayDeque<>();
            q.addLast(a);
            boolean found = a == b;
            while (!q.isEmpty()) {
                int at = q.pollFirst();
                steps++;
                for (int nxt : adj[at]) {
                    steps++;
                    if (!seen[nxt]) {
                        seen[nxt] = true;
                        if (nxt == b) found = true;
                        q.addLast(nxt);
                    }
                }
            }
            answers.add(found);
        }
        stats[0] = steps;
        return answers;
    }

    /** One label per node. A query is one comparison; a merge rewrites a side. */
    static List<Boolean> byLabels(int n, int[][] ops, long[] stats) {
        int[] label = new int[n];
        for (int i = 0; i < n; i++) label[i] = i;
        List<Boolean> answers = new ArrayList<>();
        long writes = 0;
        for (int[] op : ops) {
            int kind = op[0], a = op[1], b = op[2];
            if (kind == 0) {
                if (label[a] != label[b]) {
                    int old = label[b], fresh = label[a];
                    for (int v = 0; v < n; v++) {
                        writes++;
                        if (label[v] == old) label[v] = fresh;
                    }
                }
                continue;
            }
            answers.add(label[a] == label[b]);
        }
        stats[0] = writes;
        return answers;
    }

    static long ufHops = 0;

    static int find(int[] parent, int v) {
        while (parent[v] != v) {
            ufHops++;
            v = parent[v];
        }
        return v;
    }

    /**
     * One parent pointer per node. A merge is a single write.
     *
     * <p>No path compression and no union by rank yet -- those are the next
     * example. This is the bare idea: every node points at another node in its
     * group, and following the pointers far enough lands on the group's root.
     */
    static List<Boolean> byUnionFind(int n, int[][] ops, long[] stats) {
        int[] parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        List<Boolean> answers = new ArrayList<>();
        ufHops = 0;
        for (int[] op : ops) {
            int kind = op[0], a = op[1], b = op[2];
            int ra = find(parent, a), rb = find(parent, b);
            if (kind == 0) {
                if (ra != rb) parent[rb] = ra;
                continue;
            }
            answers.add(ra == rb);
        }
        stats[0] = ufHops;
        return answers;
    }

    /** The definition, recomputed from scratch: which nodes reach which. */
    static boolean[][] componentsNow(int n, List<int[]> edges) {
        boolean[][] reach = new boolean[n][n];
        for (int i = 0; i < n; i++) reach[i][i] = true;
        for (int[] e : edges) {
            reach[e[0]][e[1]] = true;
            reach[e[1]][e[0]] = true;
        }
        for (int k = 0; k < n; k++)
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++)
                    if (reach[i][k] && reach[k][j]) reach[i][j] = true;
        return reach;
    }

    /** Every query answered by rebuilding the whole picture at that moment. */
    static List<Boolean> truth(int n, int[][] ops) {
        List<int[]> edges = new ArrayList<>();
        List<Boolean> answers = new ArrayList<>();
        for (int[] op : ops) {
            if (op[0] == 0) {
                edges.add(new int[] {op[1], op[2]});
                continue;
            }
            answers.add(componentsNow(n, edges)[op[1]][op[2]]);
        }
        return answers;
    }

    static String show(List<Boolean> flags) {
        StringBuilder sb = new StringBuilder();
        for (boolean x : flags) sb.append(x ? "y" : ".");
        return sb.toString();
    }

    static String describe(int[][] ops) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < ops.length; i++) {
            if (i > 0) sb.append(" ");
            sb.append(ops[i][1]).append(ops[i][0] == 0 ? "-" : "?").append(ops[i][2]);
        }
        return sb.toString();
    }

    // The same linear congruential generator in every language, so the random
    // operation streams below are the same streams whichever translation is run.
    static long seed = 606L;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    static String row(String text, long value) {
        return String.format("  %-40s %6d", text, value);
    }

    public static void main(String[] args) {
        int[] caseN = {4, 5, 3};
        int[][][] caseOps = {
            {{0, 0, 1}, {1, 0, 1}, {1, 0, 2}, {0, 2, 3}, {1, 0, 3}, {0, 1, 2}, {1, 0, 3}},
            {{1, 0, 4}, {0, 0, 1}, {0, 1, 2}, {0, 2, 3}, {0, 3, 4}, {1, 0, 4}},
            {{1, 0, 0}, {0, 1, 2}, {1, 0, 1}, {1, 1, 2}},
        };

        System.out.printf("%-42s %-9s %-9s %s%n",
            "operations (a-b merge, a?b query)", "search", "labels", "union-find");
        for (int c = 0; c < caseN.length; c++) {
            System.out.printf("%-42s %-9s %-9s %s%n", describe(caseOps[c]),
                show(bySearch(caseN[c], caseOps[c], new long[1])),
                show(byLabels(caseN[c], caseOps[c], new long[1])),
                show(byUnionFind(caseN[c], caseOps[c], new long[1])));
        }

        int trials = 3000;
        int searchOk = 0, labelsOk = 0, ufOk = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(5);
            int[][] ops = new int[2 * n][3];
            for (int i = 0; i < 2 * n; i++)
                ops[i] = new int[] {rand(2), rand(n), rand(n)};
            List<Boolean> want = truth(n, ops);
            if (bySearch(n, ops, new long[1]).equals(want)) searchOk++;
            if (byLabels(n, ops, new long[1]).equals(want)) labelsOk++;
            if (byUnionFind(n, ops, new long[1]).equals(want)) ufOk++;
        }

        System.out.println();
        System.out.println("over " + trials + " random operation streams on up to 6 nodes:");
        System.out.println(row("search per query matched the definition", searchOk));
        System.out.println(row("label array matched it", labelsOk));
        System.out.println(row("union-find matched it", ufOk));

        System.out.println();
        System.out.println("and what each one costs on a stream that merges everything, in the");
        System.out.println("order that builds the longest chain of pointers:");
        System.out.printf("%-8s %14s %14s %14s%n",
            "nodes", "search steps", "label writes", "uf hops");
        for (int n : new int[] {200, 400, 800, 1600}) {
            int[][] ops = new int[2 * (n - 1)][3];
            for (int v = 0; v < n - 1; v++) {
                ops[2 * v] = new int[] {0, v + 1, v};
                ops[2 * v + 1] = new int[] {1, 0, v + 1};
            }
            long[] steps = new long[1];
            long[] writes = new long[1];
            long[] hops = new long[1];
            bySearch(n, ops, steps);
            byLabels(n, ops, writes);
            byUnionFind(n, ops, hops);
            System.out.printf("%-8d %14d %14d %14d%n", n, steps[0], writes[0], hops[0]);
        }

        System.out.println();
        System.out.println("All three are correct on every stream. What separates them is the shape");
        System.out.println("of the work. The search re-walks a component that has not changed since");
        System.out.println("the last time it walked it. The label array is fast to query -- one");
        System.out.println("comparison -- and pays for it at every merge, rewriting a whole side.");
        System.out.println();
        System.out.println("Union-find writes one pointer per merge and follows pointers on a query,");
        System.out.println("which trades the cost the other way round. On this stream that is still");
        System.out.println("quadratic, because the chain of merges builds a chain of pointers -- and");
        System.out.println("that is exactly the problem the next example is about.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Three ways to answer "are these two in the same group, so far?"
//
// The question sounds like graph connectivity, and it is -- but the graph keeps
// growing. Edges arrive one at a time and queries are interleaved with them, so
// there is no finished graph to run a search on.
//
//   search per query -- correct, and re-walks the component every time
//   label array      -- one number per node; merging rewrites one whole side
//   union-find       -- one parent pointer per node; merging is one write
//
// All three answer every query correctly. The interesting part is what they
// cost, and the answer is not close.
#include <array>
#include <deque>
#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

using Op = std::array<int, 3>;
using Flags = std::vector<bool>;

// Rebuild nothing, walk everything. One search per query.
Flags by_search(int n, const std::vector<Op>& ops, long long& steps) {
    std::vector<std::vector<int>> adj(n);
    Flags answers;
    steps = 0;
    for (const Op& op : ops) {
        int kind = op[0], a = op[1], b = op[2];
        if (kind == 0) {
            adj[a].push_back(b);
            adj[b].push_back(a);
            continue;
        }
        std::vector<bool> seen(n, false);
        seen[a] = true;
        std::deque<int> q = {a};
        bool found = a == b;
        while (!q.empty()) {
            int at = q.front();
            q.pop_front();
            steps++;
            for (int nxt : adj[at]) {
                steps++;
                if (!seen[nxt]) {
                    seen[nxt] = true;
                    if (nxt == b) found = true;
                    q.push_back(nxt);
                }
            }
        }
        answers.push_back(found);
    }
    return answers;
}

// One label per node. A query is one comparison; a merge rewrites a side.
Flags by_labels(int n, const std::vector<Op>& ops, long long& writes) {
    std::vector<int> label(n);
    for (int i = 0; i < n; i++) label[i] = i;
    Flags answers;
    writes = 0;
    for (const Op& op : ops) {
        int kind = op[0], a = op[1], b = op[2];
        if (kind == 0) {
            if (label[a] != label[b]) {
                int old = label[b], fresh = label[a];
                for (int v = 0; v < n; v++) {
                    writes++;
                    if (label[v] == old) label[v] = fresh;
                }
            }
            continue;
        }
        answers.push_back(label[a] == label[b]);
    }
    return answers;
}

int find_root(std::vector<int>& parent, int v, long long& hops) {
    while (parent[v] != v) {
        hops++;
        v = parent[v];
    }
    return v;
}

// One parent pointer per node. A merge is a single write.
//
// No path compression and no union by rank yet -- those are the next
// example. This is the bare idea: every node points at another node in its
// group, and following the pointers far enough lands on the group's root.
Flags by_union_find(int n, const std::vector<Op>& ops, long long& hops) {
    std::vector<int> parent(n);
    for (int i = 0; i < n; i++) parent[i] = i;
    Flags answers;
    hops = 0;
    for (const Op& op : ops) {
        int kind = op[0], a = op[1], b = op[2];
        int ra = find_root(parent, a, hops), rb = find_root(parent, b, hops);
        if (kind == 0) {
            if (ra != rb) parent[rb] = ra;
            continue;
        }
        answers.push_back(ra == rb);
    }
    return answers;
}

// The definition, recomputed from scratch: which nodes reach which.
std::vector<std::vector<bool>> components_now(int n, const std::vector<std::pair<int, int>>& edges) {
    std::vector<std::vector<bool>> reach(n, std::vector<bool>(n, false));
    for (int i = 0; i < n; i++) reach[i][i] = true;
    for (const auto& e : edges) {
        reach[e.first][e.second] = true;
        reach[e.second][e.first] = true;
    }
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (reach[i][k] && reach[k][j]) reach[i][j] = true;
    return reach;
}

// Every query answered by rebuilding the whole picture at that moment.
Flags truth(int n, const std::vector<Op>& ops) {
    std::vector<std::pair<int, int>> edges;
    Flags answers;
    for (const Op& op : ops) {
        if (op[0] == 0) {
            edges.push_back({op[1], op[2]});
            continue;
        }
        answers.push_back(components_now(n, edges)[op[1]][op[2]]);
    }
    return answers;
}

std::string show(const Flags& flags) {
    std::string s;
    for (bool x : flags) s += x ? "y" : ".";
    return s;
}

std::string describe(const std::vector<Op>& ops) {
    std::string s;
    for (size_t i = 0; i < ops.size(); i++) {
        if (i > 0) s += " ";
        s += std::to_string(ops[i][1]) + (ops[i][0] == 0 ? "-" : "?") + std::to_string(ops[i][2]);
    }
    return s;
}

// The same linear congruential generator in every language, so the random
// operation streams below are the same streams whichever translation is run.
long long seed = 606;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

void row(const std::string& text, long long value) {
    std::cout << "  " << std::left << std::setw(40) << text << " " << std::right
              << std::setw(6) << value << "\\n";
}

int main() {
    std::vector<int> case_n = {4, 5, 3};
    std::vector<std::vector<Op>> cases = {
        {{0, 0, 1}, {1, 0, 1}, {1, 0, 2}, {0, 2, 3}, {1, 0, 3}, {0, 1, 2}, {1, 0, 3}},
        {{1, 0, 4}, {0, 0, 1}, {0, 1, 2}, {0, 2, 3}, {0, 3, 4}, {1, 0, 4}},
        {{1, 0, 0}, {0, 1, 2}, {1, 0, 1}, {1, 1, 2}},
    };

    std::cout << std::left << std::setw(42) << "operations (a-b merge, a?b query)" << " "
              << std::setw(9) << "search" << " " << std::setw(9) << "labels" << " "
              << "union-find" << "\\n";
    for (size_t c = 0; c < cases.size(); c++) {
        long long steps = 0, writes = 0, hops = 0;
        std::cout << std::left << std::setw(42) << describe(cases[c]) << " " << std::setw(9)
                  << show(by_search(case_n[c], cases[c], steps)) << " " << std::setw(9)
                  << show(by_labels(case_n[c], cases[c], writes)) << " "
                  << show(by_union_find(case_n[c], cases[c], hops)) << "\\n";
    }

    int trials = 3000;
    int search_ok = 0, labels_ok = 0, uf_ok = 0;
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(5);
        std::vector<Op> ops;
        for (int i = 0; i < 2 * n; i++)
            ops.push_back({rand_below(2), rand_below(n), rand_below(n)});
        Flags want = truth(n, ops);
        long long steps = 0, writes = 0, hops = 0;
        if (by_search(n, ops, steps) == want) search_ok++;
        if (by_labels(n, ops, writes) == want) labels_ok++;
        if (by_union_find(n, ops, hops) == want) uf_ok++;
    }

    std::cout << "\\n";
    std::cout << "over " << trials << " random operation streams on up to 6 nodes:\\n";
    row("search per query matched the definition", search_ok);
    row("label array matched it", labels_ok);
    row("union-find matched it", uf_ok);

    std::cout << "\\n";
    std::cout << "and what each one costs on a stream that merges everything, in the\\n";
    std::cout << "order that builds the longest chain of pointers:\\n";
    std::cout << std::left << std::setw(8) << "nodes" << " " << std::right << std::setw(14)
              << "search steps" << " " << std::setw(14) << "label writes" << " "
              << std::setw(14) << "uf hops" << "\\n";
    for (int n : {200, 400, 800, 1600}) {
        std::vector<Op> ops;
        for (int v = 0; v < n - 1; v++) {
            ops.push_back({0, v + 1, v});
            ops.push_back({1, 0, v + 1});
        }
        long long steps = 0, writes = 0, hops = 0;
        by_search(n, ops, steps);
        by_labels(n, ops, writes);
        by_union_find(n, ops, hops);
        std::cout << std::left << std::setw(8) << n << " " << std::right << std::setw(14)
                  << steps << " " << std::setw(14) << writes << " " << std::setw(14) << hops
                  << "\\n";
    }

    std::cout << "\\n";
    std::cout << "All three are correct on every stream. What separates them is the shape\\n";
    std::cout << "of the work. The search re-walks a component that has not changed since\\n";
    std::cout << "the last time it walked it. The label array is fast to query -- one\\n";
    std::cout << "comparison -- and pays for it at every merge, rewriting a whole side.\\n";
    std::cout << "\\n";
    std::cout << "Union-find writes one pointer per merge and follows pointers on a query,\\n";
    std::cout << "which trades the cost the other way round. On this stream that is still\\n";
    std::cout << "quadratic, because the chain of merges builds a chain of pointers -- and\\n";
    std::cout << "that is exactly the problem the next example is about.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Three ways to answer "are these two in the same group, so far?"
//
// The question sounds like graph connectivity, and it is -- but the graph keeps
// growing. Edges arrive one at a time and queries are interleaved with them, so
// there is no finished graph to run a search on.
//
//   search per query -- correct, and re-walks the component every time
//   label array      -- one number per node; merging rewrites one whole side
//   union-find       -- one parent pointer per node; merging is one write
//
// All three answer every query correctly. The interesting part is what they
// cost, and the answer is not close.
use std::collections::VecDeque;

type Op = (usize, usize, usize);

/// Rebuild nothing, walk everything. One search per query.
fn by_search(n: usize, ops: &[Op]) -> (Vec<bool>, u64) {
    let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
    let mut answers = Vec::new();
    let mut steps: u64 = 0;
    for &(kind, a, b) in ops {
        if kind == 0 {
            adj[a].push(b);
            adj[b].push(a);
            continue;
        }
        let mut seen = vec![false; n];
        seen[a] = true;
        let mut q: VecDeque<usize> = VecDeque::new();
        q.push_back(a);
        let mut found = a == b;
        while let Some(at) = q.pop_front() {
            steps += 1;
            for idx in 0..adj[at].len() {
                let nxt = adj[at][idx];
                steps += 1;
                if !seen[nxt] {
                    seen[nxt] = true;
                    if nxt == b {
                        found = true;
                    }
                    q.push_back(nxt);
                }
            }
        }
        answers.push(found);
    }
    (answers, steps)
}

/// One label per node. A query is one comparison; a merge rewrites a side.
fn by_labels(n: usize, ops: &[Op]) -> (Vec<bool>, u64) {
    let mut label: Vec<usize> = (0..n).collect();
    let mut answers = Vec::new();
    let mut writes: u64 = 0;
    for &(kind, a, b) in ops {
        if kind == 0 {
            if label[a] != label[b] {
                let (old, fresh) = (label[b], label[a]);
                for v in 0..n {
                    writes += 1;
                    if label[v] == old {
                        label[v] = fresh;
                    }
                }
            }
            continue;
        }
        answers.push(label[a] == label[b]);
    }
    (answers, writes)
}

fn find_root(parent: &[usize], mut v: usize, hops: &mut u64) -> usize {
    while parent[v] != v {
        *hops += 1;
        v = parent[v];
    }
    v
}

/// One parent pointer per node. A merge is a single write.
///
/// No path compression and no union by rank yet -- those are the next
/// example. This is the bare idea: every node points at another node in its
/// group, and following the pointers far enough lands on the group's root.
fn by_union_find(n: usize, ops: &[Op]) -> (Vec<bool>, u64) {
    let mut parent: Vec<usize> = (0..n).collect();
    let mut answers = Vec::new();
    let mut hops: u64 = 0;
    for &(kind, a, b) in ops {
        let ra = find_root(&parent, a, &mut hops);
        let rb = find_root(&parent, b, &mut hops);
        if kind == 0 {
            if ra != rb {
                parent[rb] = ra;
            }
            continue;
        }
        answers.push(ra == rb);
    }
    (answers, hops)
}

/// The definition, recomputed from scratch: which nodes reach which.
fn components_now(n: usize, edges: &[(usize, usize)]) -> Vec<Vec<bool>> {
    let mut reach = vec![vec![false; n]; n];
    for i in 0..n {
        reach[i][i] = true;
    }
    for &(u, v) in edges {
        reach[u][v] = true;
        reach[v][u] = true;
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

/// Every query answered by rebuilding the whole picture at that moment.
fn truth(n: usize, ops: &[Op]) -> Vec<bool> {
    let mut edges: Vec<(usize, usize)> = Vec::new();
    let mut answers = Vec::new();
    for &(kind, a, b) in ops {
        if kind == 0 {
            edges.push((a, b));
            continue;
        }
        answers.push(components_now(n, &edges)[a][b]);
    }
    answers
}

fn show(flags: &[bool]) -> String {
    flags.iter().map(|&x| if x { 'y' } else { '.' }).collect()
}

fn describe(ops: &[Op]) -> String {
    let cells: Vec<String> = ops
        .iter()
        .map(|&(kind, a, b)| format!("{}{}{}", a, if kind == 0 { "-" } else { "?" }, b))
        .collect();
    cells.join(" ")
}

/// The same linear congruential generator in every language, so the random
/// operation streams below are the same streams whichever translation is run.
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
    println!("  {:<40} {:>6}", text, value);
}

fn main() {
    let case_n = [4usize, 5, 3];
    let cases: Vec<Vec<Op>> = vec![
        vec![(0, 0, 1), (1, 0, 1), (1, 0, 2), (0, 2, 3), (1, 0, 3), (0, 1, 2), (1, 0, 3)],
        vec![(1, 0, 4), (0, 0, 1), (0, 1, 2), (0, 2, 3), (0, 3, 4), (1, 0, 4)],
        vec![(1, 0, 0), (0, 1, 2), (1, 0, 1), (1, 1, 2)],
    ];

    println!(
        "{:<42} {:<9} {:<9} {}",
        "operations (a-b merge, a?b query)", "search", "labels", "union-find"
    );
    for c in 0..cases.len() {
        let (a, _) = by_search(case_n[c], &cases[c]);
        let (b, _) = by_labels(case_n[c], &cases[c]);
        let (d, _) = by_union_find(case_n[c], &cases[c]);
        println!(
            "{:<42} {:<9} {:<9} {}",
            describe(&cases[c]),
            show(&a),
            show(&b),
            show(&d)
        );
    }

    let mut rng = Rng { seed: 606 };
    let trials = 3000;
    let (mut search_ok, mut labels_ok, mut uf_ok) = (0u64, 0u64, 0u64);
    for _ in 0..trials {
        let n = 2 + rng.next(5) as usize;
        let mut ops: Vec<Op> = Vec::new();
        for _ in 0..(2 * n) {
            ops.push((
                rng.next(2) as usize,
                rng.next(n as i64) as usize,
                rng.next(n as i64) as usize,
            ));
        }
        let want = truth(n, &ops);
        let (a, _) = by_search(n, &ops);
        let (b, _) = by_labels(n, &ops);
        let (c, _) = by_union_find(n, &ops);
        if a == want {
            search_ok += 1;
        }
        if b == want {
            labels_ok += 1;
        }
        if c == want {
            uf_ok += 1;
        }
    }

    println!();
    println!("over {} random operation streams on up to 6 nodes:", trials);
    row("search per query matched the definition", search_ok);
    row("label array matched it", labels_ok);
    row("union-find matched it", uf_ok);

    println!();
    println!("and what each one costs on a stream that merges everything, in the");
    println!("order that builds the longest chain of pointers:");
    println!(
        "{:<8} {:>14} {:>14} {:>14}",
        "nodes", "search steps", "label writes", "uf hops"
    );
    for &n in &[200usize, 400, 800, 1600] {
        let mut ops: Vec<Op> = Vec::new();
        for v in 0..(n - 1) {
            ops.push((0, v + 1, v));
            ops.push((1, 0, v + 1));
        }
        let (_, steps) = by_search(n, &ops);
        let (_, writes) = by_labels(n, &ops);
        let (_, hops) = by_union_find(n, &ops);
        println!("{:<8} {:>14} {:>14} {:>14}", n, steps, writes, hops);
    }

    println!();
    println!("All three are correct on every stream. What separates them is the shape");
    println!("of the work. The search re-walks a component that has not changed since");
    println!("the last time it walked it. The label array is fast to query -- one");
    println!("comparison -- and pays for it at every merge, rewriting a whole side.");
    println!();
    println!("Union-find writes one pointer per merge and follows pointers on a query,");
    println!("which trades the cost the other way round. On this stream that is still");
    println!("quadratic, because the chain of merges builds a chain of pointers -- and");
    println!("that is exactly the problem the next example is about.");
}
`,
            },
            {
              lang: "go",
              code: `// Three ways to answer "are these two in the same group, so far?"
//
// The question sounds like graph connectivity, and it is -- but the graph keeps
// growing. Edges arrive one at a time and queries are interleaved with them, so
// there is no finished graph to run a search on.
//
//	search per query -- correct, and re-walks the component every time
//	label array      -- one number per node; merging rewrites one whole side
//	union-find       -- one parent pointer per node; merging is one write
//
// All three answer every query correctly. The interesting part is what they
// cost, and the answer is not close.
package main

import (
	"fmt"
	"strings"
)

// Op is one operation: kind 0 merges A and B, kind 1 asks about them.
type Op struct {
	Kind, A, B int
}

// bySearch rebuilds nothing and walks everything: one search per query.
func bySearch(n int, ops []Op) ([]bool, int64) {
	adj := make([][]int, n)
	var answers []bool
	var steps int64
	for _, op := range ops {
		if op.Kind == 0 {
			adj[op.A] = append(adj[op.A], op.B)
			adj[op.B] = append(adj[op.B], op.A)
			continue
		}
		seen := make([]bool, n)
		seen[op.A] = true
		q := []int{op.A}
		head := 0
		found := op.A == op.B
		for head < len(q) {
			at := q[head]
			head++
			steps++
			for _, nxt := range adj[at] {
				steps++
				if !seen[nxt] {
					seen[nxt] = true
					if nxt == op.B {
						found = true
					}
					q = append(q, nxt)
				}
			}
		}
		answers = append(answers, found)
	}
	return answers, steps
}

// byLabels keeps one label per node. A query is one comparison; a merge
// rewrites a whole side.
func byLabels(n int, ops []Op) ([]bool, int64) {
	label := make([]int, n)
	for i := range label {
		label[i] = i
	}
	var answers []bool
	var writes int64
	for _, op := range ops {
		if op.Kind == 0 {
			if label[op.A] != label[op.B] {
				old, fresh := label[op.B], label[op.A]
				for v := 0; v < n; v++ {
					writes++
					if label[v] == old {
						label[v] = fresh
					}
				}
			}
			continue
		}
		answers = append(answers, label[op.A] == label[op.B])
	}
	return answers, writes
}

func findRoot(parent []int, v int, hops *int64) int {
	for parent[v] != v {
		*hops++
		v = parent[v]
	}
	return v
}

// byUnionFind keeps one parent pointer per node. A merge is a single write.
//
// No path compression and no union by rank yet -- those are the next
// example. This is the bare idea: every node points at another node in its
// group, and following the pointers far enough lands on the group's root.
func byUnionFind(n int, ops []Op) ([]bool, int64) {
	parent := make([]int, n)
	for i := range parent {
		parent[i] = i
	}
	var answers []bool
	var hops int64
	for _, op := range ops {
		ra := findRoot(parent, op.A, &hops)
		rb := findRoot(parent, op.B, &hops)
		if op.Kind == 0 {
			if ra != rb {
				parent[rb] = ra
			}
			continue
		}
		answers = append(answers, ra == rb)
	}
	return answers, hops
}

// componentsNow is the definition, recomputed from scratch.
func componentsNow(n int, edges [][2]int) [][]bool {
	reach := make([][]bool, n)
	for i := range reach {
		reach[i] = make([]bool, n)
		reach[i][i] = true
	}
	for _, e := range edges {
		reach[e[0]][e[1]] = true
		reach[e[1]][e[0]] = true
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

// truth answers every query by rebuilding the whole picture at that moment.
func truth(n int, ops []Op) []bool {
	var edges [][2]int
	var answers []bool
	for _, op := range ops {
		if op.Kind == 0 {
			edges = append(edges, [2]int{op.A, op.B})
			continue
		}
		answers = append(answers, componentsNow(n, edges)[op.A][op.B])
	}
	return answers
}

func same(a, b []bool) bool {
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

func show(flags []bool) string {
	var sb strings.Builder
	for _, x := range flags {
		if x {
			sb.WriteString("y")
		} else {
			sb.WriteString(".")
		}
	}
	return sb.String()
}

func describe(ops []Op) string {
	cells := make([]string, len(ops))
	for i, op := range ops {
		sep := "?"
		if op.Kind == 0 {
			sep = "-"
		}
		cells[i] = fmt.Sprintf("%d%s%d", op.A, sep, op.B)
	}
	return strings.Join(cells, " ")
}

// The same linear congruential generator in every language, so the random
// operation streams below are the same streams whichever translation is run.
var seed int64 = 606

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func row(text string, value int64) {
	fmt.Printf("  %-40s %6d\\n", text, value)
}

func main() {
	caseN := []int{4, 5, 3}
	cases := [][]Op{
		{{0, 0, 1}, {1, 0, 1}, {1, 0, 2}, {0, 2, 3}, {1, 0, 3}, {0, 1, 2}, {1, 0, 3}},
		{{1, 0, 4}, {0, 0, 1}, {0, 1, 2}, {0, 2, 3}, {0, 3, 4}, {1, 0, 4}},
		{{1, 0, 0}, {0, 1, 2}, {1, 0, 1}, {1, 1, 2}},
	}

	fmt.Printf("%-42s %-9s %-9s %s\\n",
		"operations (a-b merge, a?b query)", "search", "labels", "union-find")
	for c := range cases {
		a, _ := bySearch(caseN[c], cases[c])
		b, _ := byLabels(caseN[c], cases[c])
		d, _ := byUnionFind(caseN[c], cases[c])
		fmt.Printf("%-42s %-9s %-9s %s\\n", describe(cases[c]), show(a), show(b), show(d))
	}

	trials := 3000
	searchOk, labelsOk, ufOk := 0, 0, 0
	for t := 0; t < trials; t++ {
		n := 2 + randBelow(5)
		var ops []Op
		for i := 0; i < 2*n; i++ {
			ops = append(ops, Op{randBelow(2), randBelow(n), randBelow(n)})
		}
		want := truth(n, ops)
		a, _ := bySearch(n, ops)
		b, _ := byLabels(n, ops)
		c, _ := byUnionFind(n, ops)
		if same(a, want) {
			searchOk++
		}
		if same(b, want) {
			labelsOk++
		}
		if same(c, want) {
			ufOk++
		}
	}

	fmt.Println()
	fmt.Printf("over %d random operation streams on up to 6 nodes:\\n", trials)
	row("search per query matched the definition", int64(searchOk))
	row("label array matched it", int64(labelsOk))
	row("union-find matched it", int64(ufOk))

	fmt.Println()
	fmt.Println("and what each one costs on a stream that merges everything, in the")
	fmt.Println("order that builds the longest chain of pointers:")
	fmt.Printf("%-8s %14s %14s %14s\\n", "nodes", "search steps", "label writes", "uf hops")
	for _, n := range []int{200, 400, 800, 1600} {
		var ops []Op
		for v := 0; v < n-1; v++ {
			ops = append(ops, Op{0, v + 1, v})
			ops = append(ops, Op{1, 0, v + 1})
		}
		_, steps := bySearch(n, ops)
		_, writes := byLabels(n, ops)
		_, hops := byUnionFind(n, ops)
		fmt.Printf("%-8d %14d %14d %14d\\n", n, steps, writes, hops)
	}

	fmt.Println()
	fmt.Println("All three are correct on every stream. What separates them is the shape")
	fmt.Println("of the work. The search re-walks a component that has not changed since")
	fmt.Println("the last time it walked it. The label array is fast to query -- one")
	fmt.Println("comparison -- and pays for it at every merge, rewriting a whole side.")
	fmt.Println()
	fmt.Println("Union-find writes one pointer per merge and follows pointers on a query,")
	fmt.Println("which trades the cost the other way round. On this stream that is still")
	fmt.Println("quadratic, because the chain of merges builds a chain of pointers -- and")
	fmt.Println("that is exactly the problem the next example is about.")
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "graph-union-find",
        kind: "graph",
        algorithm: "unionfind",
        title: "One pointer per node, one write per merge",
        lockAlgorithm: true,
      },
      pitfalls: [
        {
          title: "Reaching for a search when merges and queries are interleaved",
          body: "It is correct and it re-walks a component that has not changed. On a 1,600-node merge stream that was 3,839,199 steps against 1,279,200 pointer hops, before either standard optimisation was applied.",
        },
        {
          title: "Using a label array because queries are O(1)",
          body: "They are, and the merge is the problem: relabelling one whole side cost 2,558,400 writes on the same stream. It is the right structure only when merges are rare compared with queries.",
        },
        {
          title: "Writing find as a loop that stops one step early",
          body: "The root is the node whose parent is itself, not the node one hop up. `while parent[v] != v: v = parent[v]` -- the loop condition, not a fixed number of hops. Getting this wrong gives a structure that reports two nodes in the same group as separate, intermittently.",
        },
      ],
    },
    {
      id: "a-bound-and-a-repair",
      heading: "A bound and a repair",
      body: [
        "Two standard repairs, each about a line, and they are almost always presented together \u2014 which hides the fact that they work in completely different ways.",
        "**Union by size** hangs the smaller tree under the larger one. It *prevents* deep trees: on the adversarial merge order, no find ever walked more than one pointer.",
        "**Path compression** points every node on a find's path straight at the root on the way back. It does not prevent deep trees \u2014 on the same order it let the chain form, and the structure it left behind still had a chain of 1,998 in it. It flattens after the fact, so the first query through a deep chain pays and the rest do not.",
        "All four variants \u2014 neither, either, both \u2014 are correct on all 3,000 random streams. They always were; the fixes are about cost and nothing about the answers changes.",
        "And on a merge order that is not adversarial, all four columns are identical: 3,997 hops each. The bare version was already flat and neither fix had anything to do. Which is the honest summary \u2014 union by size is a bound, path compression is a repair, and the reason to write both is that only the bound holds whatever order the merges arrive in.",
      ],
      examples: [
        {
          id: "bound-and-repair",
          title: "Union by size and path compression, one at a time",
          lang: "python",
          code: `# The two one-line fixes, measured one at a time.
#
# Bare union-find is only as good as the trees it builds, and merging in the
# wrong order builds a chain -- at which point a query walks the whole thing.
# Two standard repairs, each about a line:
#
#   union by size -- hang the smaller tree under the larger one, so no tree
#                    ever gets deeper than log n
#   path compression -- on the way back from a find, point every node visited
#                    straight at the root
#
# They are usually presented together, which hides how differently they work.
# Union by size prevents deep trees. Path compression does not prevent them --
# it flattens them after the fact, so the first query pays and the rest do not.
# The counters below separate the two.


class Sets:
    """Union-find with either fix, both, or neither.

    \`hops\` counts pointer follows, which is the work the queries actually do.
    \`worst_walk\` is the longest single walk any one find had to make, which is
    the thing union by size exists to bound.
    """

    def __init__(self, n, by_size, compress):
        self.parent = list(range(n))
        self.size = [1] * n
        self.by_size = by_size
        self.compress = compress
        self.hops = 0
        self.worst_walk = 0

    def find(self, v):
        root = v
        walk = 0
        while self.parent[root] != root:
            walk += 1
            root = self.parent[root]
        self.hops += walk
        if walk > self.worst_walk:
            self.worst_walk = walk
        if self.compress:
            while self.parent[v] != root:
                nxt = self.parent[v]
                self.parent[v] = root
                v = nxt
        return root

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.by_size and self.size[rb] > self.size[ra]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]
        return True

    def deepest(self):
        """The longest chain of pointers left in the structure at the end."""
        worst = 0
        for v in range(len(self.parent)):
            steps = 0
            at = v
            while self.parent[at] != at:
                steps += 1
                at = self.parent[at]
            if steps > worst:
                worst = steps
        return worst


def run(n, ops, by_size, compress):
    """Answer every query, and report what the structure cost to do it."""
    sets = Sets(n, by_size, compress)
    answers = []
    for kind, a, b in ops:
        if kind == 0:
            sets.union(a, b)
            continue
        answers.append(sets.find(a) == sets.find(b))
    return answers, sets.hops, sets.worst_walk, sets.deepest()


def components_now(n, edges):
    reach = [[False] * n for _ in range(n)]
    for i in range(n):
        reach[i][i] = True
    for u, v in edges:
        reach[u][v] = True
        reach[v][u] = True
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if reach[i][k] and reach[k][j]:
                    reach[i][j] = True
    return reach


def truth(n, ops):
    """Every query answered by rebuilding the whole picture at that moment."""
    edges = []
    answers = []
    for kind, a, b in ops:
        if kind == 0:
            edges.append((a, b))
            continue
        answers.append(components_now(n, edges)[a][b])
    return answers


VARIANTS = [
    ("neither", False, False),
    ("by size", True, False),
    ("compress", False, True),
    ("both", True, True),
]

# The same linear congruential generator in every language, so the random
# operation streams below are the same streams whichever translation is run.
seed = 4004


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


trials = 3000
correct = [0] * len(VARIANTS)
for _ in range(trials):
    n = 2 + rand(5)
    ops = []
    for _ in range(2 * n):
        ops.append((rand(2), rand(n), rand(n)))
    want = truth(n, ops)
    for i, (_, by_size, compress) in enumerate(VARIANTS):
        got, _, _, _ = run(n, ops, by_size, compress)
        correct[i] += got == want

print("over %d random operation streams on up to 6 nodes:" % trials)
for i, (name, _, _) in enumerate(VARIANTS):
    print("  %-40s %6d" % ("%s matched the definition" % name, correct[i]))

print()
print("and on the merge order built to make a chain of %d nodes:" % 2000)
print("%-10s %12s %12s %12s" % ("variant", "hops", "worst walk", "left deep"))
n = 2000
chain = []
for v in range(n - 1):
    chain.append((0, v + 1, v))
    chain.append((1, 0, v + 1))
for name, by_size, compress in VARIANTS:
    _, hops, worst, left = run(n, chain, by_size, compress)
    print("%-10s %12d %12d %12d" % (name, hops, worst, left))

print()
print("and on a merge order that is not adversarial at all:")
print("%-10s %12s %12s %12s" % ("variant", "hops", "worst walk", "left deep"))
friendly = []
for v in range(n - 1):
    friendly.append((0, v, v + 1))
    friendly.append((1, 0, v + 1))
for name, by_size, compress in VARIANTS:
    _, hops, worst, left = run(n, friendly, by_size, compress)
    print("%-10s %12d %12d %12d" % (name, hops, worst, left))

print()
print("All four variants are correct. They always were -- the fixes are about")
print("cost, and nothing about the answers changes.")
print()
print("The two tables are the reason to know which fix does what. On the")
print("adversarial order the bare version walks a chain that grows with every")
print("merge -- one find had to follow 1,999 pointers. Union by size stops the")
print("chain from ever forming: no find ever walked more than one pointer.")
print("Path compression lets the chain form and flattens it afterwards, so the")
print("structure it leaves behind is still deep in places, but almost no query")
print("pays for it.")
print()
print("On the friendly order the bare version is already flat and neither fix")
print("has anything to do -- all four columns are identical.")
print()
print("Which is the honest summary: union by size is a bound, path compression")
print("is a repair, and the reason to write both is that only the bound holds")
print("whatever order the merges arrive in.")
`,
          output: `over 3000 random operation streams on up to 6 nodes:
  neither matched the definition             3000
  by size matched the definition             3000
  compress matched the definition            3000
  both matched the definition                3000

and on the merge order built to make a chain of 2000 nodes:
variant            hops   worst walk    left deep
neither         1999000         1999         1999
by size            5994            1            1
compress           3997            2         1998
both               5994            1            1

and on a merge order that is not adversarial at all:
variant            hops   worst walk    left deep
neither            3997            1            1
by size            3997            1            1
compress           3997            1            1
both               3997            1            1

All four variants are correct. They always were -- the fixes are about
cost, and nothing about the answers changes.

The two tables are the reason to know which fix does what. On the
adversarial order the bare version walks a chain that grows with every
merge -- one find had to follow 1,999 pointers. Union by size stops the
chain from ever forming: no find ever walked more than one pointer.
Path compression lets the chain form and flattens it afterwards, so the
structure it leaves behind is still deep in places, but almost no query
pays for it.

On the friendly order the bare version is already flat and neither fix
has anything to do -- all four columns are identical.

Which is the honest summary: union by size is a bound, path compression
is a repair, and the reason to write both is that only the bound holds
whatever order the merges arrive in.`,
          explanation:
            "All four combinations scored for correctness and then measured on an adversarial merge order and a friendly one. The worst-walk column is what union by size bounds; the left-deep column is what path compression does not.",
          alternates: [
            {
              lang: "javascript",
              code: `// The two one-line fixes, measured one at a time.
//
// Bare union-find is only as good as the trees it builds, and merging in the
// wrong order builds a chain -- at which point a query walks the whole thing.
// Two standard repairs, each about a line:
//
//   union by size -- hang the smaller tree under the larger one, so no tree
//                    ever gets deeper than log n
//   path compression -- on the way back from a find, point every node visited
//                    straight at the root
//
// They are usually presented together, which hides how differently they work.
// Union by size prevents deep trees. Path compression does not prevent them --
// it flattens them after the fact, so the first query pays and the rest do not.
// The counters below separate the two.

// Union-find with either fix, both, or neither.
//
// \`hops\` counts pointer follows, which is the work the queries actually do.
// \`worstWalk\` is the longest single walk any one find had to make, which is
// the thing union by size exists to bound.
class Sets {
  constructor(n, bySize, compress) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.size = new Array(n).fill(1);
    this.bySize = bySize;
    this.compress = compress;
    this.hops = 0;
    this.worstWalk = 0;
  }

  find(v) {
    let root = v;
    let walk = 0;
    while (this.parent[root] !== root) {
      walk += 1;
      root = this.parent[root];
    }
    this.hops += walk;
    if (walk > this.worstWalk) this.worstWalk = walk;
    if (this.compress) {
      let at = v;
      while (this.parent[at] !== root) {
        const nxt = this.parent[at];
        this.parent[at] = root;
        at = nxt;
      }
    }
    return root;
  }

  union(a, b) {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return false;
    if (this.bySize && this.size[rb] > this.size[ra]) {
      const tmp = ra;
      ra = rb;
      rb = tmp;
    }
    this.parent[rb] = ra;
    this.size[ra] += this.size[rb];
    return true;
  }

  // The longest chain of pointers left in the structure at the end.
  deepest() {
    let worst = 0;
    for (let v = 0; v < this.parent.length; v += 1) {
      let steps = 0;
      let at = v;
      while (this.parent[at] !== at) {
        steps += 1;
        at = this.parent[at];
      }
      if (steps > worst) worst = steps;
    }
    return worst;
  }
}

// Answer every query, and report what the structure cost to do it.
function run(n, ops, bySize, compress) {
  const sets = new Sets(n, bySize, compress);
  const answers = [];
  for (const [kind, a, b] of ops) {
    if (kind === 0) {
      sets.union(a, b);
      continue;
    }
    answers.push(sets.find(a) === sets.find(b));
  }
  return [answers, sets.hops, sets.worstWalk, sets.deepest()];
}

function componentsNow(n, edges) {
  const reach = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let i = 0; i < n; i += 1) reach[i][i] = true;
  for (const [u, v] of edges) {
    reach[u][v] = true;
    reach[v][u] = true;
  }
  for (let k = 0; k < n; k += 1)
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1)
        if (reach[i][k] && reach[k][j]) reach[i][j] = true;
  return reach;
}

// Every query answered by rebuilding the whole picture at that moment.
function truth(n, ops) {
  const edges = [];
  const answers = [];
  for (const [kind, a, b] of ops) {
    if (kind === 0) {
      edges.push([a, b]);
      continue;
    }
    answers.push(componentsNow(n, edges)[a][b]);
  }
  return answers;
}

const VARIANTS = [
  ["neither", false, false],
  ["by size", true, false],
  ["compress", false, true],
  ["both", true, true],
];

// The same linear congruential generator in every language, so the random
// operation streams below are the same streams whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 4004n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
const correct = VARIANTS.map(() => 0);
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
for (let t = 0; t < trials; t += 1) {
  const n = 2 + rand(5);
  const ops = [];
  for (let i = 0; i < 2 * n; i += 1) ops.push([rand(2), rand(n), rand(n)]);
  const want = truth(n, ops);
  VARIANTS.forEach(([, bySize, compress], i) => {
    const [got] = run(n, ops, bySize, compress);
    if (same(got, want)) correct[i] += 1;
  });
}

console.log(\`over \${trials} random operation streams on up to 6 nodes:\`);
VARIANTS.forEach(([name], i) => {
  console.log("  " + \`\${name} matched the definition\`.padEnd(40) + " " + String(correct[i]).padStart(6));
});

const n = 2000;
console.log();
console.log(\`and on the merge order built to make a chain of \${n} nodes:\`);
console.log(
  "variant".padEnd(10) + " " + "hops".padStart(12) + " " +
  "worst walk".padStart(12) + " " + "left deep".padStart(12),
);
const chain = [];
for (let v = 0; v < n - 1; v += 1) {
  chain.push([0, v + 1, v]);
  chain.push([1, 0, v + 1]);
}
for (const [name, bySize, compress] of VARIANTS) {
  const [, hops, worst, left] = run(n, chain, bySize, compress);
  console.log(
    name.padEnd(10) + " " + String(hops).padStart(12) + " " +
    String(worst).padStart(12) + " " + String(left).padStart(12),
  );
}

console.log();
console.log("and on a merge order that is not adversarial at all:");
console.log(
  "variant".padEnd(10) + " " + "hops".padStart(12) + " " +
  "worst walk".padStart(12) + " " + "left deep".padStart(12),
);
const friendly = [];
for (let v = 0; v < n - 1; v += 1) {
  friendly.push([0, v, v + 1]);
  friendly.push([1, 0, v + 1]);
}
for (const [name, bySize, compress] of VARIANTS) {
  const [, hops, worst, left] = run(n, friendly, bySize, compress);
  console.log(
    name.padEnd(10) + " " + String(hops).padStart(12) + " " +
    String(worst).padStart(12) + " " + String(left).padStart(12),
  );
}

console.log();
console.log("All four variants are correct. They always were -- the fixes are about");
console.log("cost, and nothing about the answers changes.");
console.log();
console.log("The two tables are the reason to know which fix does what. On the");
console.log("adversarial order the bare version walks a chain that grows with every");
console.log("merge -- one find had to follow 1,999 pointers. Union by size stops the");
console.log("chain from ever forming: no find ever walked more than one pointer.");
console.log("Path compression lets the chain form and flattens it afterwards, so the");
console.log("structure it leaves behind is still deep in places, but almost no query");
console.log("pays for it.");
console.log();
console.log("On the friendly order the bare version is already flat and neither fix");
console.log("has anything to do -- all four columns are identical.");
console.log();
console.log("Which is the honest summary: union by size is a bound, path compression");
console.log("is a repair, and the reason to write both is that only the bound holds");
console.log("whatever order the merges arrive in.");
`,
            },
            {
              lang: "typescript",
              code: `// The two one-line fixes, measured one at a time.
//
// Bare union-find is only as good as the trees it builds, and merging in the
// wrong order builds a chain -- at which point a query walks the whole thing.
// Two standard repairs, each about a line:
//
//   union by size -- hang the smaller tree under the larger one, so no tree
//                    ever gets deeper than log n
//   path compression -- on the way back from a find, point every node visited
//                    straight at the root
//
// They are usually presented together, which hides how differently they work.
// Union by size prevents deep trees. Path compression does not prevent them --
// it flattens them after the fact, so the first query pays and the rest do not.
// The counters below separate the two.

// Union-find with either fix, both, or neither.
//
// \`hops\` counts pointer follows, which is the work the queries actually do.
// \`worstWalk\` is the longest single walk any one find had to make, which is
// the thing union by size exists to bound.
class Sets {
  parent: number[];
  size: number[];
  bySize: boolean;
  compress: boolean;
  hops: number;
  worstWalk: number;

  constructor(n: number, bySize: boolean, compress: boolean) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.size = new Array(n).fill(1);
    this.bySize = bySize;
    this.compress = compress;
    this.hops = 0;
    this.worstWalk = 0;
  }

  find(v: number): number {
    let root = v;
    let walk = 0;
    while (this.parent[root] !== root) {
      walk += 1;
      root = this.parent[root];
    }
    this.hops += walk;
    if (walk > this.worstWalk) this.worstWalk = walk;
    if (this.compress) {
      let at = v;
      while (this.parent[at] !== root) {
        const nxt = this.parent[at];
        this.parent[at] = root;
        at = nxt;
      }
    }
    return root;
  }

  union(a: number, b: number): boolean {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return false;
    if (this.bySize && this.size[rb] > this.size[ra]) {
      const tmp = ra;
      ra = rb;
      rb = tmp;
    }
    this.parent[rb] = ra;
    this.size[ra] += this.size[rb];
    return true;
  }

  // The longest chain of pointers left in the structure at the end.
  deepest(): number {
    let worst = 0;
    for (let v = 0; v < this.parent.length; v += 1) {
      let steps = 0;
      let at = v;
      while (this.parent[at] !== at) {
        steps += 1;
        at = this.parent[at];
      }
      if (steps > worst) worst = steps;
    }
    return worst;
  }
}

// Answer every query, and report what the structure cost to do it.
function run(n: number, ops: number[][], bySize: boolean, compress: boolean): [boolean[], number, number, number] {
  const sets = new Sets(n, bySize, compress);
  const answers: boolean[] = [];
  for (const [kind, a, b] of ops) {
    if (kind === 0) {
      sets.union(a, b);
      continue;
    }
    answers.push(sets.find(a) === sets.find(b));
  }
  return [answers, sets.hops, sets.worstWalk, sets.deepest()];
}

function componentsNow(n: number, edges: number[][]): boolean[][] {
  const reach = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let i = 0; i < n; i += 1) reach[i][i] = true;
  for (const [u, v] of edges) {
    reach[u][v] = true;
    reach[v][u] = true;
  }
  for (let k = 0; k < n; k += 1)
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1)
        if (reach[i][k] && reach[k][j]) reach[i][j] = true;
  return reach;
}

// Every query answered by rebuilding the whole picture at that moment.
function truth(n: number, ops: number[][]): boolean[] {
  const edges: number[][] = [];
  const answers: boolean[] = [];
  for (const [kind, a, b] of ops) {
    if (kind === 0) {
      edges.push([a, b]);
      continue;
    }
    answers.push(componentsNow(n, edges)[a][b]);
  }
  return answers;
}

const VARIANTS: [string, boolean, boolean][] = [
  ["neither", false, false],
  ["by size", true, false],
  ["compress", false, true],
  ["both", true, true],
];

// The same linear congruential generator in every language, so the random
// operation streams below are the same streams whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 4004n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
const correct = VARIANTS.map(() => 0);
const same = (a: boolean[], b: boolean[]): boolean => a.length === b.length && a.every((x, i) => x === b[i]);
for (let t = 0; t < trials; t += 1) {
  const n = 2 + rand(5);
  const ops: number[][] = [];
  for (let i = 0; i < 2 * n; i += 1) ops.push([rand(2), rand(n), rand(n)]);
  const want = truth(n, ops);
  VARIANTS.forEach(([, bySize, compress], i) => {
    const [got] = run(n, ops, bySize, compress);
    if (same(got, want)) correct[i] += 1;
  });
}

console.log(\`over \${trials} random operation streams on up to 6 nodes:\`);
VARIANTS.forEach(([name], i) => {
  console.log("  " + \`\${name} matched the definition\`.padEnd(40) + " " + String(correct[i]).padStart(6));
});

const n = 2000;
console.log();
console.log(\`and on the merge order built to make a chain of \${n} nodes:\`);
console.log(
  "variant".padEnd(10) + " " + "hops".padStart(12) + " " +
  "worst walk".padStart(12) + " " + "left deep".padStart(12),
);
const chain: number[][] = [];
for (let v = 0; v < n - 1; v += 1) {
  chain.push([0, v + 1, v]);
  chain.push([1, 0, v + 1]);
}
for (const [name, bySize, compress] of VARIANTS) {
  const [, hops, worst, left] = run(n, chain, bySize, compress);
  console.log(
    name.padEnd(10) + " " + String(hops).padStart(12) + " " +
    String(worst).padStart(12) + " " + String(left).padStart(12),
  );
}

console.log();
console.log("and on a merge order that is not adversarial at all:");
console.log(
  "variant".padEnd(10) + " " + "hops".padStart(12) + " " +
  "worst walk".padStart(12) + " " + "left deep".padStart(12),
);
const friendly: number[][] = [];
for (let v = 0; v < n - 1; v += 1) {
  friendly.push([0, v, v + 1]);
  friendly.push([1, 0, v + 1]);
}
for (const [name, bySize, compress] of VARIANTS) {
  const [, hops, worst, left] = run(n, friendly, bySize, compress);
  console.log(
    name.padEnd(10) + " " + String(hops).padStart(12) + " " +
    String(worst).padStart(12) + " " + String(left).padStart(12),
  );
}

console.log();
console.log("All four variants are correct. They always were -- the fixes are about");
console.log("cost, and nothing about the answers changes.");
console.log();
console.log("The two tables are the reason to know which fix does what. On the");
console.log("adversarial order the bare version walks a chain that grows with every");
console.log("merge -- one find had to follow 1,999 pointers. Union by size stops the");
console.log("chain from ever forming: no find ever walked more than one pointer.");
console.log("Path compression lets the chain form and flattens it afterwards, so the");
console.log("structure it leaves behind is still deep in places, but almost no query");
console.log("pays for it.");
console.log();
console.log("On the friendly order the bare version is already flat and neither fix");
console.log("has anything to do -- all four columns are identical.");
console.log();
console.log("Which is the honest summary: union by size is a bound, path compression");
console.log("is a repair, and the reason to write both is that only the bound holds");
console.log("whatever order the merges arrive in.");
`,
            },
            {
              lang: "java",
              code: `// The two one-line fixes, measured one at a time.
//
// Bare union-find is only as good as the trees it builds, and merging in the
// wrong order builds a chain -- at which point a query walks the whole thing.
// Two standard repairs, each about a line:
//
//   union by size -- hang the smaller tree under the larger one, so no tree
//                    ever gets deeper than log n
//   path compression -- on the way back from a find, point every node visited
//                    straight at the root
//
// They are usually presented together, which hides how differently they work.
// Union by size prevents deep trees. Path compression does not prevent them --
// it flattens them after the fact, so the first query pays and the rest do not.
// The counters below separate the two.
import java.util.ArrayList;
import java.util.List;

public class Main {
    /**
     * Union-find with either fix, both, or neither.
     *
     * <p>{@code hops} counts pointer follows, which is the work the queries
     * actually do. {@code worstWalk} is the longest single walk any one find
     * had to make, which is the thing union by size exists to bound.
     */
    static class Sets {
        int[] parent;
        int[] size;
        boolean bySize;
        boolean compress;
        long hops = 0;
        int worstWalk = 0;

        Sets(int n, boolean bySize, boolean compress) {
            parent = new int[n];
            size = new int[n];
            for (int i = 0; i < n; i++) {
                parent[i] = i;
                size[i] = 1;
            }
            this.bySize = bySize;
            this.compress = compress;
        }

        int find(int v) {
            int root = v;
            int walk = 0;
            while (parent[root] != root) {
                walk++;
                root = parent[root];
            }
            hops += walk;
            if (walk > worstWalk) worstWalk = walk;
            if (compress) {
                int at = v;
                while (parent[at] != root) {
                    int nxt = parent[at];
                    parent[at] = root;
                    at = nxt;
                }
            }
            return root;
        }

        boolean union(int a, int b) {
            int ra = find(a), rb = find(b);
            if (ra == rb) return false;
            if (bySize && size[rb] > size[ra]) {
                int tmp = ra;
                ra = rb;
                rb = tmp;
            }
            parent[rb] = ra;
            size[ra] += size[rb];
            return true;
        }

        /** The longest chain of pointers left in the structure at the end. */
        int deepest() {
            int worst = 0;
            for (int v = 0; v < parent.length; v++) {
                int steps = 0, at = v;
                while (parent[at] != at) {
                    steps++;
                    at = parent[at];
                }
                if (steps > worst) worst = steps;
            }
            return worst;
        }
    }

    /** Answer every query, and report what the structure cost to do it. */
    static List<Boolean> run(int n, int[][] ops, boolean bySize, boolean compress, long[] stats) {
        Sets sets = new Sets(n, bySize, compress);
        List<Boolean> answers = new ArrayList<>();
        for (int[] op : ops) {
            if (op[0] == 0) {
                sets.union(op[1], op[2]);
                continue;
            }
            answers.add(sets.find(op[1]) == sets.find(op[2]));
        }
        stats[0] = sets.hops;
        stats[1] = sets.worstWalk;
        stats[2] = sets.deepest();
        return answers;
    }

    static boolean[][] componentsNow(int n, List<int[]> edges) {
        boolean[][] reach = new boolean[n][n];
        for (int i = 0; i < n; i++) reach[i][i] = true;
        for (int[] e : edges) {
            reach[e[0]][e[1]] = true;
            reach[e[1]][e[0]] = true;
        }
        for (int k = 0; k < n; k++)
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++)
                    if (reach[i][k] && reach[k][j]) reach[i][j] = true;
        return reach;
    }

    /** Every query answered by rebuilding the whole picture at that moment. */
    static List<Boolean> truth(int n, int[][] ops) {
        List<int[]> edges = new ArrayList<>();
        List<Boolean> answers = new ArrayList<>();
        for (int[] op : ops) {
            if (op[0] == 0) {
                edges.add(new int[] {op[1], op[2]});
                continue;
            }
            answers.add(componentsNow(n, edges)[op[1]][op[2]]);
        }
        return answers;
    }

    static final String[] NAMES = {"neither", "by size", "compress", "both"};
    static final boolean[] BY_SIZE = {false, true, false, true};
    static final boolean[] COMPRESS = {false, false, true, true};

    // The same linear congruential generator in every language, so the random
    // operation streams below are the same streams whichever translation is run.
    static long seed = 4004L;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    public static void main(String[] args) {
        int trials = 3000;
        int[] correct = new int[NAMES.length];
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(5);
            int[][] ops = new int[2 * n][3];
            for (int i = 0; i < 2 * n; i++) ops[i] = new int[] {rand(2), rand(n), rand(n)};
            List<Boolean> want = truth(n, ops);
            for (int i = 0; i < NAMES.length; i++)
                if (run(n, ops, BY_SIZE[i], COMPRESS[i], new long[3]).equals(want)) correct[i]++;
        }

        System.out.println("over " + trials + " random operation streams on up to 6 nodes:");
        for (int i = 0; i < NAMES.length; i++)
            System.out.printf("  %-40s %6d%n", NAMES[i] + " matched the definition", correct[i]);

        int n = 2000;
        System.out.println();
        System.out.println("and on the merge order built to make a chain of " + n + " nodes:");
        System.out.printf("%-10s %12s %12s %12s%n", "variant", "hops", "worst walk", "left deep");
        int[][] chain = new int[2 * (n - 1)][3];
        for (int v = 0; v < n - 1; v++) {
            chain[2 * v] = new int[] {0, v + 1, v};
            chain[2 * v + 1] = new int[] {1, 0, v + 1};
        }
        for (int i = 0; i < NAMES.length; i++) {
            long[] stats = new long[3];
            run(n, chain, BY_SIZE[i], COMPRESS[i], stats);
            System.out.printf("%-10s %12d %12d %12d%n", NAMES[i], stats[0], stats[1], stats[2]);
        }

        System.out.println();
        System.out.println("and on a merge order that is not adversarial at all:");
        System.out.printf("%-10s %12s %12s %12s%n", "variant", "hops", "worst walk", "left deep");
        int[][] friendly = new int[2 * (n - 1)][3];
        for (int v = 0; v < n - 1; v++) {
            friendly[2 * v] = new int[] {0, v, v + 1};
            friendly[2 * v + 1] = new int[] {1, 0, v + 1};
        }
        for (int i = 0; i < NAMES.length; i++) {
            long[] stats = new long[3];
            run(n, friendly, BY_SIZE[i], COMPRESS[i], stats);
            System.out.printf("%-10s %12d %12d %12d%n", NAMES[i], stats[0], stats[1], stats[2]);
        }

        System.out.println();
        System.out.println("All four variants are correct. They always were -- the fixes are about");
        System.out.println("cost, and nothing about the answers changes.");
        System.out.println();
        System.out.println("The two tables are the reason to know which fix does what. On the");
        System.out.println("adversarial order the bare version walks a chain that grows with every");
        System.out.println("merge -- one find had to follow 1,999 pointers. Union by size stops the");
        System.out.println("chain from ever forming: no find ever walked more than one pointer.");
        System.out.println("Path compression lets the chain form and flattens it afterwards, so the");
        System.out.println("structure it leaves behind is still deep in places, but almost no query");
        System.out.println("pays for it.");
        System.out.println();
        System.out.println("On the friendly order the bare version is already flat and neither fix");
        System.out.println("has anything to do -- all four columns are identical.");
        System.out.println();
        System.out.println("Which is the honest summary: union by size is a bound, path compression");
        System.out.println("is a repair, and the reason to write both is that only the bound holds");
        System.out.println("whatever order the merges arrive in.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The two one-line fixes, measured one at a time.
//
// Bare union-find is only as good as the trees it builds, and merging in the
// wrong order builds a chain -- at which point a query walks the whole thing.
// Two standard repairs, each about a line:
//
//   union by size -- hang the smaller tree under the larger one, so no tree
//                    ever gets deeper than log n
//   path compression -- on the way back from a find, point every node visited
//                    straight at the root
//
// They are usually presented together, which hides how differently they work.
// Union by size prevents deep trees. Path compression does not prevent them --
// it flattens them after the fact, so the first query pays and the rest do not.
// The counters below separate the two.
#include <array>
#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

using Op = std::array<int, 3>;
using Flags = std::vector<bool>;

// Union-find with either fix, both, or neither.
//
// \`hops\` counts pointer follows, which is the work the queries actually do.
// \`worst_walk\` is the longest single walk any one find had to make, which is
// the thing union by size exists to bound.
struct Sets {
    std::vector<int> parent;
    std::vector<int> size;
    bool by_size;
    bool compress;
    long long hops = 0;
    int worst_walk = 0;

    Sets(int n, bool by_size_, bool compress_) : by_size(by_size_), compress(compress_) {
        parent.resize(n);
        size.assign(n, 1);
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    int find(int v) {
        int root = v;
        int walk = 0;
        while (parent[root] != root) {
            walk++;
            root = parent[root];
        }
        hops += walk;
        if (walk > worst_walk) worst_walk = walk;
        if (compress) {
            int at = v;
            while (parent[at] != root) {
                int nxt = parent[at];
                parent[at] = root;
                at = nxt;
            }
        }
        return root;
    }

    bool unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (by_size && size[rb] > size[ra]) std::swap(ra, rb);
        parent[rb] = ra;
        size[ra] += size[rb];
        return true;
    }

    // The longest chain of pointers left in the structure at the end.
    int deepest() {
        int worst = 0;
        for (size_t v = 0; v < parent.size(); v++) {
            int steps = 0;
            int at = static_cast<int>(v);
            while (parent[at] != at) {
                steps++;
                at = parent[at];
            }
            if (steps > worst) worst = steps;
        }
        return worst;
    }
};

// Answer every query, and report what the structure cost to do it.
Flags run(int n, const std::vector<Op>& ops, bool by_size, bool compress, long long& hops,
          int& worst, int& left) {
    Sets sets(n, by_size, compress);
    Flags answers;
    for (const Op& op : ops) {
        if (op[0] == 0) {
            sets.unite(op[1], op[2]);
            continue;
        }
        answers.push_back(sets.find(op[1]) == sets.find(op[2]));
    }
    hops = sets.hops;
    worst = sets.worst_walk;
    left = sets.deepest();
    return answers;
}

std::vector<std::vector<bool>> components_now(int n,
                                              const std::vector<std::pair<int, int>>& edges) {
    std::vector<std::vector<bool>> reach(n, std::vector<bool>(n, false));
    for (int i = 0; i < n; i++) reach[i][i] = true;
    for (const auto& e : edges) {
        reach[e.first][e.second] = true;
        reach[e.second][e.first] = true;
    }
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (reach[i][k] && reach[k][j]) reach[i][j] = true;
    return reach;
}

// Every query answered by rebuilding the whole picture at that moment.
Flags truth(int n, const std::vector<Op>& ops) {
    std::vector<std::pair<int, int>> edges;
    Flags answers;
    for (const Op& op : ops) {
        if (op[0] == 0) {
            edges.push_back({op[1], op[2]});
            continue;
        }
        answers.push_back(components_now(n, edges)[op[1]][op[2]]);
    }
    return answers;
}

const std::string NAMES[4] = {"neither", "by size", "compress", "both"};
const bool BY_SIZE[4] = {false, true, false, true};
const bool COMPRESS[4] = {false, false, true, true};

// The same linear congruential generator in every language, so the random
// operation streams below are the same streams whichever translation is run.
long long seed = 4004;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

int main() {
    int trials = 3000;
    int correct[4] = {0, 0, 0, 0};
    for (int t = 0; t < trials; t++) {
        int n = 2 + rand_below(5);
        std::vector<Op> ops;
        for (int i = 0; i < 2 * n; i++)
            ops.push_back({rand_below(2), rand_below(n), rand_below(n)});
        Flags want = truth(n, ops);
        for (int i = 0; i < 4; i++) {
            long long hops = 0;
            int worst = 0, left = 0;
            if (run(n, ops, BY_SIZE[i], COMPRESS[i], hops, worst, left) == want) correct[i]++;
        }
    }

    std::cout << "over " << trials << " random operation streams on up to 6 nodes:\\n";
    for (int i = 0; i < 4; i++)
        std::cout << "  " << std::left << std::setw(40) << (NAMES[i] + " matched the definition")
                  << " " << std::right << std::setw(6) << correct[i] << "\\n";

    int n = 2000;
    std::cout << "\\n";
    std::cout << "and on the merge order built to make a chain of " << n << " nodes:\\n";
    std::cout << std::left << std::setw(10) << "variant" << " " << std::right << std::setw(12)
              << "hops" << " " << std::setw(12) << "worst walk" << " " << std::setw(12)
              << "left deep" << "\\n";
    std::vector<Op> chain;
    for (int v = 0; v < n - 1; v++) {
        chain.push_back({0, v + 1, v});
        chain.push_back({1, 0, v + 1});
    }
    for (int i = 0; i < 4; i++) {
        long long hops = 0;
        int worst = 0, left = 0;
        run(n, chain, BY_SIZE[i], COMPRESS[i], hops, worst, left);
        std::cout << std::left << std::setw(10) << NAMES[i] << " " << std::right << std::setw(12)
                  << hops << " " << std::setw(12) << worst << " " << std::setw(12) << left << "\\n";
    }

    std::cout << "\\n";
    std::cout << "and on a merge order that is not adversarial at all:\\n";
    std::cout << std::left << std::setw(10) << "variant" << " " << std::right << std::setw(12)
              << "hops" << " " << std::setw(12) << "worst walk" << " " << std::setw(12)
              << "left deep" << "\\n";
    std::vector<Op> friendly;
    for (int v = 0; v < n - 1; v++) {
        friendly.push_back({0, v, v + 1});
        friendly.push_back({1, 0, v + 1});
    }
    for (int i = 0; i < 4; i++) {
        long long hops = 0;
        int worst = 0, left = 0;
        run(n, friendly, BY_SIZE[i], COMPRESS[i], hops, worst, left);
        std::cout << std::left << std::setw(10) << NAMES[i] << " " << std::right << std::setw(12)
                  << hops << " " << std::setw(12) << worst << " " << std::setw(12) << left << "\\n";
    }

    std::cout << "\\n";
    std::cout << "All four variants are correct. They always were -- the fixes are about\\n";
    std::cout << "cost, and nothing about the answers changes.\\n";
    std::cout << "\\n";
    std::cout << "The two tables are the reason to know which fix does what. On the\\n";
    std::cout << "adversarial order the bare version walks a chain that grows with every\\n";
    std::cout << "merge -- one find had to follow 1,999 pointers. Union by size stops the\\n";
    std::cout << "chain from ever forming: no find ever walked more than one pointer.\\n";
    std::cout << "Path compression lets the chain form and flattens it afterwards, so the\\n";
    std::cout << "structure it leaves behind is still deep in places, but almost no query\\n";
    std::cout << "pays for it.\\n";
    std::cout << "\\n";
    std::cout << "On the friendly order the bare version is already flat and neither fix\\n";
    std::cout << "has anything to do -- all four columns are identical.\\n";
    std::cout << "\\n";
    std::cout << "Which is the honest summary: union by size is a bound, path compression\\n";
    std::cout << "is a repair, and the reason to write both is that only the bound holds\\n";
    std::cout << "whatever order the merges arrive in.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// The two one-line fixes, measured one at a time.
//
// Bare union-find is only as good as the trees it builds, and merging in the
// wrong order builds a chain -- at which point a query walks the whole thing.
// Two standard repairs, each about a line:
//
//   union by size -- hang the smaller tree under the larger one, so no tree
//                    ever gets deeper than log n
//   path compression -- on the way back from a find, point every node visited
//                    straight at the root
//
// They are usually presented together, which hides how differently they work.
// Union by size prevents deep trees. Path compression does not prevent them --
// it flattens them after the fact, so the first query pays and the rest do not.
// The counters below separate the two.
type Op = (usize, usize, usize);

/// Union-find with either fix, both, or neither.
///
/// \`hops\` counts pointer follows, which is the work the queries actually do.
/// \`worst_walk\` is the longest single walk any one find had to make, which is
/// the thing union by size exists to bound.
struct Sets {
    parent: Vec<usize>,
    size: Vec<usize>,
    by_size: bool,
    compress: bool,
    hops: u64,
    worst_walk: u32,
}

impl Sets {
    fn new(n: usize, by_size: bool, compress: bool) -> Sets {
        Sets {
            parent: (0..n).collect(),
            size: vec![1; n],
            by_size,
            compress,
            hops: 0,
            worst_walk: 0,
        }
    }

    fn find(&mut self, v: usize) -> usize {
        let mut root = v;
        let mut walk: u32 = 0;
        while self.parent[root] != root {
            walk += 1;
            root = self.parent[root];
        }
        self.hops += walk as u64;
        if walk > self.worst_walk {
            self.worst_walk = walk;
        }
        if self.compress {
            let mut at = v;
            while self.parent[at] != root {
                let nxt = self.parent[at];
                self.parent[at] = root;
                at = nxt;
            }
        }
        root
    }

    fn unite(&mut self, a: usize, b: usize) -> bool {
        let mut ra = self.find(a);
        let mut rb = self.find(b);
        if ra == rb {
            return false;
        }
        if self.by_size && self.size[rb] > self.size[ra] {
            std::mem::swap(&mut ra, &mut rb);
        }
        self.parent[rb] = ra;
        self.size[ra] += self.size[rb];
        true
    }

    /// The longest chain of pointers left in the structure at the end.
    fn deepest(&self) -> u32 {
        let mut worst = 0;
        for v in 0..self.parent.len() {
            let mut steps: u32 = 0;
            let mut at = v;
            while self.parent[at] != at {
                steps += 1;
                at = self.parent[at];
            }
            if steps > worst {
                worst = steps;
            }
        }
        worst
    }
}

/// Answer every query, and report what the structure cost to do it.
fn run(n: usize, ops: &[Op], by_size: bool, compress: bool) -> (Vec<bool>, u64, u32, u32) {
    let mut sets = Sets::new(n, by_size, compress);
    let mut answers = Vec::new();
    for &(kind, a, b) in ops {
        if kind == 0 {
            sets.unite(a, b);
            continue;
        }
        let ra = sets.find(a);
        let rb = sets.find(b);
        answers.push(ra == rb);
    }
    let deep = sets.deepest();
    (answers, sets.hops, sets.worst_walk, deep)
}

fn components_now(n: usize, edges: &[(usize, usize)]) -> Vec<Vec<bool>> {
    let mut reach = vec![vec![false; n]; n];
    for i in 0..n {
        reach[i][i] = true;
    }
    for &(u, v) in edges {
        reach[u][v] = true;
        reach[v][u] = true;
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

/// Every query answered by rebuilding the whole picture at that moment.
fn truth(n: usize, ops: &[Op]) -> Vec<bool> {
    let mut edges: Vec<(usize, usize)> = Vec::new();
    let mut answers = Vec::new();
    for &(kind, a, b) in ops {
        if kind == 0 {
            edges.push((a, b));
            continue;
        }
        answers.push(components_now(n, &edges)[a][b]);
    }
    answers
}

const NAMES: [&str; 4] = ["neither", "by size", "compress", "both"];
const BY_SIZE: [bool; 4] = [false, true, false, true];
const COMPRESS: [bool; 4] = [false, false, true, true];

/// The same linear congruential generator in every language, so the random
/// operation streams below are the same streams whichever translation is run.
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
    let mut rng = Rng { seed: 4004 };
    let trials = 3000;
    let mut correct = [0u64; 4];
    for _ in 0..trials {
        let n = 2 + rng.next(5) as usize;
        let mut ops: Vec<Op> = Vec::new();
        for _ in 0..(2 * n) {
            ops.push((
                rng.next(2) as usize,
                rng.next(n as i64) as usize,
                rng.next(n as i64) as usize,
            ));
        }
        let want = truth(n, &ops);
        for i in 0..4 {
            let (got, _, _, _) = run(n, &ops, BY_SIZE[i], COMPRESS[i]);
            if got == want {
                correct[i] += 1;
            }
        }
    }

    println!("over {} random operation streams on up to 6 nodes:", trials);
    for i in 0..4 {
        println!(
            "  {:<40} {:>6}",
            format!("{} matched the definition", NAMES[i]),
            correct[i]
        );
    }

    let n = 2000usize;
    println!();
    println!("and on the merge order built to make a chain of {} nodes:", n);
    println!("{:<10} {:>12} {:>12} {:>12}", "variant", "hops", "worst walk", "left deep");
    let mut chain: Vec<Op> = Vec::new();
    for v in 0..(n - 1) {
        chain.push((0, v + 1, v));
        chain.push((1, 0, v + 1));
    }
    for i in 0..4 {
        let (_, hops, worst, left) = run(n, &chain, BY_SIZE[i], COMPRESS[i]);
        println!("{:<10} {:>12} {:>12} {:>12}", NAMES[i], hops, worst, left);
    }

    println!();
    println!("and on a merge order that is not adversarial at all:");
    println!("{:<10} {:>12} {:>12} {:>12}", "variant", "hops", "worst walk", "left deep");
    let mut friendly: Vec<Op> = Vec::new();
    for v in 0..(n - 1) {
        friendly.push((0, v, v + 1));
        friendly.push((1, 0, v + 1));
    }
    for i in 0..4 {
        let (_, hops, worst, left) = run(n, &friendly, BY_SIZE[i], COMPRESS[i]);
        println!("{:<10} {:>12} {:>12} {:>12}", NAMES[i], hops, worst, left);
    }

    println!();
    println!("All four variants are correct. They always were -- the fixes are about");
    println!("cost, and nothing about the answers changes.");
    println!();
    println!("The two tables are the reason to know which fix does what. On the");
    println!("adversarial order the bare version walks a chain that grows with every");
    println!("merge -- one find had to follow 1,999 pointers. Union by size stops the");
    println!("chain from ever forming: no find ever walked more than one pointer.");
    println!("Path compression lets the chain form and flattens it afterwards, so the");
    println!("structure it leaves behind is still deep in places, but almost no query");
    println!("pays for it.");
    println!();
    println!("On the friendly order the bare version is already flat and neither fix");
    println!("has anything to do -- all four columns are identical.");
    println!();
    println!("Which is the honest summary: union by size is a bound, path compression");
    println!("is a repair, and the reason to write both is that only the bound holds");
    println!("whatever order the merges arrive in.");
}
`,
            },
            {
              lang: "go",
              code: `// The two one-line fixes, measured one at a time.
//
// Bare union-find is only as good as the trees it builds, and merging in the
// wrong order builds a chain -- at which point a query walks the whole thing.
// Two standard repairs, each about a line:
//
//	union by size -- hang the smaller tree under the larger one, so no tree
//	                 ever gets deeper than log n
//	path compression -- on the way back from a find, point every node visited
//	                 straight at the root
//
// They are usually presented together, which hides how differently they work.
// Union by size prevents deep trees. Path compression does not prevent them --
// it flattens them after the fact, so the first query pays and the rest do not.
// The counters below separate the two.
package main

import "fmt"

// Op is one operation: kind 0 merges A and B, kind 1 asks about them.
type Op struct {
	Kind, A, B int
}

// Sets is union-find with either fix, both, or neither.
//
// hops counts pointer follows, which is the work the queries actually do.
// worstWalk is the longest single walk any one find had to make, which is the
// thing union by size exists to bound.
type Sets struct {
	parent    []int
	size      []int
	bySize    bool
	compress  bool
	hops      int64
	worstWalk int
}

func newSets(n int, bySize, compress bool) *Sets {
	s := &Sets{parent: make([]int, n), size: make([]int, n), bySize: bySize, compress: compress}
	for i := range s.parent {
		s.parent[i] = i
		s.size[i] = 1
	}
	return s
}

func (s *Sets) find(v int) int {
	root := v
	walk := 0
	for s.parent[root] != root {
		walk++
		root = s.parent[root]
	}
	s.hops += int64(walk)
	if walk > s.worstWalk {
		s.worstWalk = walk
	}
	if s.compress {
		at := v
		for s.parent[at] != root {
			nxt := s.parent[at]
			s.parent[at] = root
			at = nxt
		}
	}
	return root
}

func (s *Sets) unite(a, b int) bool {
	ra, rb := s.find(a), s.find(b)
	if ra == rb {
		return false
	}
	if s.bySize && s.size[rb] > s.size[ra] {
		ra, rb = rb, ra
	}
	s.parent[rb] = ra
	s.size[ra] += s.size[rb]
	return true
}

// deepest is the longest chain of pointers left in the structure at the end.
func (s *Sets) deepest() int {
	worst := 0
	for v := range s.parent {
		steps, at := 0, v
		for s.parent[at] != at {
			steps++
			at = s.parent[at]
		}
		if steps > worst {
			worst = steps
		}
	}
	return worst
}

// run answers every query, and reports what the structure cost to do it.
func run(n int, ops []Op, bySize, compress bool) ([]bool, int64, int, int) {
	sets := newSets(n, bySize, compress)
	var answers []bool
	for _, op := range ops {
		if op.Kind == 0 {
			sets.unite(op.A, op.B)
			continue
		}
		answers = append(answers, sets.find(op.A) == sets.find(op.B))
	}
	return answers, sets.hops, sets.worstWalk, sets.deepest()
}

func componentsNow(n int, edges [][2]int) [][]bool {
	reach := make([][]bool, n)
	for i := range reach {
		reach[i] = make([]bool, n)
		reach[i][i] = true
	}
	for _, e := range edges {
		reach[e[0]][e[1]] = true
		reach[e[1]][e[0]] = true
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

// truth answers every query by rebuilding the whole picture at that moment.
func truth(n int, ops []Op) []bool {
	var edges [][2]int
	var answers []bool
	for _, op := range ops {
		if op.Kind == 0 {
			edges = append(edges, [2]int{op.A, op.B})
			continue
		}
		answers = append(answers, componentsNow(n, edges)[op.A][op.B])
	}
	return answers
}

func same(a, b []bool) bool {
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

var names = []string{"neither", "by size", "compress", "both"}
var bySizeFlags = []bool{false, true, false, true}
var compressFlags = []bool{false, false, true, true}

// The same linear congruential generator in every language, so the random
// operation streams below are the same streams whichever translation is run.
var seed int64 = 4004

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	trials := 3000
	correct := make([]int, len(names))
	for t := 0; t < trials; t++ {
		n := 2 + randBelow(5)
		var ops []Op
		for i := 0; i < 2*n; i++ {
			ops = append(ops, Op{randBelow(2), randBelow(n), randBelow(n)})
		}
		want := truth(n, ops)
		for i := range names {
			got, _, _, _ := run(n, ops, bySizeFlags[i], compressFlags[i])
			if same(got, want) {
				correct[i]++
			}
		}
	}

	fmt.Printf("over %d random operation streams on up to 6 nodes:\\n", trials)
	for i := range names {
		fmt.Printf("  %-40s %6d\\n", names[i]+" matched the definition", correct[i])
	}

	n := 2000
	fmt.Println()
	fmt.Printf("and on the merge order built to make a chain of %d nodes:\\n", n)
	fmt.Printf("%-10s %12s %12s %12s\\n", "variant", "hops", "worst walk", "left deep")
	var chain []Op
	for v := 0; v < n-1; v++ {
		chain = append(chain, Op{0, v + 1, v})
		chain = append(chain, Op{1, 0, v + 1})
	}
	for i := range names {
		_, hops, worst, left := run(n, chain, bySizeFlags[i], compressFlags[i])
		fmt.Printf("%-10s %12d %12d %12d\\n", names[i], hops, worst, left)
	}

	fmt.Println()
	fmt.Println("and on a merge order that is not adversarial at all:")
	fmt.Printf("%-10s %12s %12s %12s\\n", "variant", "hops", "worst walk", "left deep")
	var friendly []Op
	for v := 0; v < n-1; v++ {
		friendly = append(friendly, Op{0, v, v + 1})
		friendly = append(friendly, Op{1, 0, v + 1})
	}
	for i := range names {
		_, hops, worst, left := run(n, friendly, bySizeFlags[i], compressFlags[i])
		fmt.Printf("%-10s %12d %12d %12d\\n", names[i], hops, worst, left)
	}

	fmt.Println()
	fmt.Println("All four variants are correct. They always were -- the fixes are about")
	fmt.Println("cost, and nothing about the answers changes.")
	fmt.Println()
	fmt.Println("The two tables are the reason to know which fix does what. On the")
	fmt.Println("adversarial order the bare version walks a chain that grows with every")
	fmt.Println("merge -- one find had to follow 1,999 pointers. Union by size stops the")
	fmt.Println("chain from ever forming: no find ever walked more than one pointer.")
	fmt.Println("Path compression lets the chain form and flattens it afterwards, so the")
	fmt.Println("structure it leaves behind is still deep in places, but almost no query")
	fmt.Println("pays for it.")
	fmt.Println()
	fmt.Println("On the friendly order the bare version is already flat and neither fix")
	fmt.Println("has anything to do -- all four columns are identical.")
	fmt.Println()
	fmt.Println("Which is the honest summary: union by size is a bound, path compression")
	fmt.Println("is a repair, and the reason to write both is that only the bound holds")
	fmt.Println("whatever order the merges arrive in.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Treating the two fixes as one optimisation",
          body: "They do different jobs. Union by size stopped the adversarial chain from ever forming -- worst walk of 1. Path compression let it form and flattened it, leaving a structure 1,998 deep. If only one is written, knowing which one is missing tells you what the failure will look like.",
        },
        {
          title: "Concluding a fix is unnecessary because a benchmark did not improve",
          body: "On a friendly merge order all four variants cost exactly 3,997 hops. The bare version was already flat. A benchmark that does not build a deep tree cannot tell you anything about the fix that bounds tree depth.",
        },
        {
          title: "Comparing sizes of nodes rather than of roots",
          body: "`size` is only meaningful at a root. Comparing `size[a]` and `size[b]` for arbitrary nodes reads stale numbers from the middle of a tree and hangs the wrong side under the other, which quietly gives up the bound.",
        },
      ],
    },
    {
      id: "the-operation-it-does-not-have",
      heading: "The operation it does not have",
      body: [
        "Union-find merges, and it has no undo. There is no way to take a pointer back out, because a root has forgotten which of its descendants arrived in which merge \u2014 throwing that away is the whole reason it is fast.",
        "So a stream of edge *deletions* with connectivity queries in between looks like the wrong problem for it. Taken in order, it is. Taken backwards, it is exactly the right one: run time in reverse and every deletion becomes an insertion.",
        "That matched a recompute-from-scratch definition on all 3,000 random streams, using the same union-find as before with nothing added. Every edge that is never deleted goes in first, then the operations are walked from last to first, and the answers come out reversed.",
        "The obvious shortcut \u2014 merge everything and ignore the deletions \u2014 matched on 1,092 of 3,000, and all 5,065 of its mistakes were in the same direction: **connected, when the edge that connected them is gone**. It can only ever be wrong that way, because adding edges only merges groups, so what it reports is the truth about a graph that is a superset of the real one.",
        "The requirement, and the trade, is knowing the whole stream in advance. That is what \"offline\" means: the algorithm cannot answer a query before it has been told what comes after it. When queries genuinely arrive live and edges genuinely disappear, union-find is the wrong structure and the answer is a dynamic connectivity structure, which is a different subject.",
      ],
      examples: [
        {
          id: "deletions-in-reverse",
          title: "The stream run backwards, and the shortcut that does not work",
          lang: "python",
          code: `# The thing union-find cannot do, and the trick that gets round it anyway.
#
# Union-find merges. It has no undo. There is no way to take a pointer back
# out, because a root has forgotten which of its descendants arrived in which
# merge -- the whole reason it is fast is that it threw that away.
#
# So a stream of edge *deletions* with connectivity queries in between looks
# like the wrong problem for it. It is, taken in order. Taken backwards it is
# exactly the right one: run time in reverse and every deletion becomes an
# insertion. That works whenever the whole stream is available up front, which
# is what "offline" means.
from collections import deque


class Sets:
    """Union-find with both fixes, as the previous example ended up."""

    def __init__(self, n):
        self.parent = list(range(n))
        self.size = [1] * n
        self.hops = 0

    def find(self, v):
        root = v
        while self.parent[root] != root:
            self.hops += 1
            root = self.parent[root]
        while self.parent[v] != root:
            nxt = self.parent[v]
            self.parent[v] = root
            v = nxt
        return root

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return
        if self.size[rb] > self.size[ra]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]


def by_recompute(n, edges, ops):
    """The definition: after every deletion, walk the graph that is left."""
    alive = [True] * len(edges)
    answers = []
    steps = 0
    for kind, a, b in ops:
        if kind == 0:
            alive[a] = False
            continue
        adj = [[] for _ in range(n)]
        for i, (u, v) in enumerate(edges):
            if alive[i]:
                adj[u].append(v)
                adj[v].append(u)
        seen = [False] * n
        seen[a] = True
        q = deque([a])
        while q:
            at = q.popleft()
            steps += 1
            for nxt in adj[at]:
                steps += 1
                if not seen[nxt]:
                    seen[nxt] = True
                    q.append(nxt)
        answers.append(seen[b])
    return answers, steps


def ignoring_deletions(n, edges, ops):
    """The tempting wrong answer: merge everything and never take it back."""
    sets = Sets(n)
    for u, v in edges:
        sets.union(u, v)
    answers = []
    for kind, a, b in ops:
        if kind == 0:
            continue
        answers.append(sets.find(a) == sets.find(b))
    return answers, sets.hops


def offline_reverse(n, edges, ops):
    """Read the whole stream, then run it backwards.

    Every edge that is never deleted is present the whole time, so those go in
    first. Then walk the operations from last to first: a deletion, seen
    backwards, is the moment the edge comes back. Queries get answered on the
    way, and the answers come out in reverse order.
    """
    deleted = [False] * len(edges)
    for kind, a, _ in ops:
        if kind == 0:
            deleted[a] = True
    sets = Sets(n)
    for i, (u, v) in enumerate(edges):
        if not deleted[i]:
            sets.union(u, v)
    answers = []
    for kind, a, b in reversed(ops):
        if kind == 0:
            u, v = edges[a]
            sets.union(u, v)
            continue
        answers.append(sets.find(a) == sets.find(b))
    answers.reverse()
    return answers, sets.hops


def show(flags):
    return "".join("y" if x else "." for x in flags)


def describe(edges, ops):
    parts = []
    for kind, a, b in ops:
        if kind == 0:
            parts.append("-%d%d" % edges[a])
        else:
            parts.append("%d?%d" % (a, b))
    return " ".join(parts)


CASES = [
    (4, [(0, 1), (1, 2), (2, 3)], [(1, 0, 3), (0, 1, 0), (1, 0, 3), (1, 2, 3)]),
    (4, [(0, 1), (1, 2), (0, 2)], [(1, 0, 2), (0, 2, 0), (1, 0, 2), (0, 0, 0), (1, 0, 2)]),
    (5, [(0, 1), (2, 3), (3, 4)], [(1, 0, 1), (0, 0, 0), (1, 0, 1), (1, 2, 4)]),
]

print("%-34s %-8s %-8s %s" % ("operations (-uv delete, a?b query)", "truth", "ignoring", "reversed"))
for n, edges, ops in CASES:
    a, _ = by_recompute(n, edges, ops)
    b, _ = ignoring_deletions(n, edges, ops)
    c, _ = offline_reverse(n, edges, ops)
    print("%-34s %-8s %-8s %s" % (describe(edges, ops), show(a), show(b), show(c)))

# The same linear congruential generator in every language, so the random
# streams below are the same streams whichever translation is run.
seed = 31415


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


trials = 3000
reverse_ok = ignoring_ok = 0
false_yes = false_no = 0
for _ in range(trials):
    n = 3 + rand(4)
    edges = []
    for u in range(n):
        for v in range(u + 1, n):
            if rand(2) == 0:
                edges.append((u, v))
    if not edges:
        edges.append((0, n - 1))
    ops = []
    order = list(range(len(edges)))
    for i in range(len(order) - 1, 0, -1):
        j = rand(i + 1)
        order[i], order[j] = order[j], order[i]
    nxt = 0
    for _ in range(2 * n):
        if rand(2) == 0 and nxt < len(order):
            ops.append((0, order[nxt], 0))
            nxt += 1
        else:
            ops.append((1, rand(n), rand(n)))
    want, _ = by_recompute(n, edges, ops)
    a, _ = offline_reverse(n, edges, ops)
    b, _ = ignoring_deletions(n, edges, ops)
    reverse_ok += a == want
    ignoring_ok += b == want
    for i in range(len(want)):
        if b[i] and not want[i]:
            false_yes += 1
        if want[i] and not b[i]:
            false_no += 1

print()
print("over %d random deletion streams on 3 to 6 nodes:" % trials)
print("  %-40s %6d" % ("running the stream backwards matched", reverse_ok))
print("  %-40s %6d" % ("ignoring the deletions matched", ignoring_ok))
print("  %-40s %6d" % ("queries it wrongly called connected", false_yes))
print("  %-40s %6d" % ("queries it wrongly called separate", false_no))

print()
print("and what the two correct methods cost as the graph grows:")
print("%-8s %16s %14s" % ("nodes", "recompute steps", "reversed hops"))
for n in (200, 400, 800):
    edges = [(v, v + 1) for v in range(n - 1)]
    ops = []
    for v in range(n - 1):
        ops.append((0, n - 2 - v, 0))
        ops.append((1, 0, n - 1))
    _, steps = by_recompute(n, edges, ops)
    _, hops = offline_reverse(n, edges, ops)
    print("%-8d %16d %14d" % (n, steps, hops))

print()
print("Ignoring the deletions is not a small error. It matched the definition")
print("on %d of %d streams, and every one of its %d mistakes was in the" % (ignoring_ok, trials, false_yes))
print("same direction: connected, when the edge that connected them is gone.")
print("It never called two nodes separate that were not -- adding edges can")
print("only merge groups, so the answer it gives is the answer for a graph")
print("that is a superset of the real one.")
print()
print("Running the stream backwards is exactly right on all %d, and it is" % reverse_ok)
print("the same union-find as before with nothing added. The only requirement")
print("is knowing the whole stream in advance, which is the trade: an offline")
print("algorithm cannot answer a query before it has been told what comes")
print("after it. When queries genuinely arrive live and edges genuinely")
print("disappear, union-find is the wrong structure and the answer is a")
print("dynamic connectivity structure, which is a different subject.")
`,
          output: `operations (-uv delete, a?b query) truth    ignoring reversed
0?3 -12 0?3 2?3                    y.y      yyy      y.y
0?2 -02 0?2 -01 0?2                yy.      yyy      yy.
0?1 -01 0?1 2?4                    y.y      yyy      y.y

over 3000 random deletion streams on 3 to 6 nodes:
  running the stream backwards matched       3000
  ignoring the deletions matched              727
  queries it wrongly called connected        5065
  queries it wrongly called separate            0

and what the two correct methods cost as the graph grows:
nodes     recompute steps  reversed hops
200                 59302            198
400                238602            398
800                957202            798

Ignoring the deletions is not a small error. It matched the definition
on 727 of 3000 streams, and every one of its 5065 mistakes was in the
same direction: connected, when the edge that connected them is gone.
It never called two nodes separate that were not -- adding edges can
only merge groups, so the answer it gives is the answer for a graph
that is a superset of the real one.

Running the stream backwards is exactly right on all 3000, and it is
the same union-find as before with nothing added. The only requirement
is knowing the whole stream in advance, which is the trade: an offline
algorithm cannot answer a query before it has been told what comes
after it. When queries genuinely arrive live and edges genuinely
disappear, union-find is the wrong structure and the answer is a
dynamic connectivity structure, which is a different subject.`,
          explanation:
            "A deletion stream answered three ways: recomputed from scratch, ignored, and reversed. The direction of the shortcut's errors is the part worth noticing.",
          alternates: [
            {
              lang: "javascript",
              code: `// The thing union-find cannot do, and the trick that gets round it anyway.
//
// Union-find merges. It has no undo. There is no way to take a pointer back
// out, because a root has forgotten which of its descendants arrived in which
// merge -- the whole reason it is fast is that it threw that away.
//
// So a stream of edge *deletions* with connectivity queries in between looks
// like the wrong problem for it. It is, taken in order. Taken backwards it is
// exactly the right one: run time in reverse and every deletion becomes an
// insertion. That works whenever the whole stream is available up front, which
// is what "offline" means.

// Union-find with both fixes, as the previous example ended up.
class Sets {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.size = new Array(n).fill(1);
    this.hops = 0;
  }

  find(v) {
    let root = v;
    while (this.parent[root] !== root) {
      this.hops += 1;
      root = this.parent[root];
    }
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
    if (ra === rb) return;
    if (this.size[rb] > this.size[ra]) {
      const tmp = ra;
      ra = rb;
      rb = tmp;
    }
    this.parent[rb] = ra;
    this.size[ra] += this.size[rb];
  }
}

// The definition: after every deletion, walk the graph that is left.
function byRecompute(n, edges, ops) {
  const alive = new Array(edges.length).fill(true);
  const answers = [];
  let steps = 0;
  for (const [kind, a, b] of ops) {
    if (kind === 0) {
      alive[a] = false;
      continue;
    }
    const adj = Array.from({ length: n }, () => []);
    edges.forEach(([u, v], i) => {
      if (alive[i]) {
        adj[u].push(v);
        adj[v].push(u);
      }
    });
    const seen = new Array(n).fill(false);
    seen[a] = true;
    const q = [a];
    let head = 0;
    while (head < q.length) {
      const at = q[head];
      head += 1;
      steps += 1;
      for (const nxt of adj[at]) {
        steps += 1;
        if (!seen[nxt]) {
          seen[nxt] = true;
          q.push(nxt);
        }
      }
    }
    answers.push(seen[b]);
  }
  return [answers, steps];
}

// The tempting wrong answer: merge everything and never take it back.
function ignoringDeletions(n, edges, ops) {
  const sets = new Sets(n);
  for (const [u, v] of edges) sets.union(u, v);
  const answers = [];
  for (const [kind, a, b] of ops) {
    if (kind === 0) continue;
    answers.push(sets.find(a) === sets.find(b));
  }
  return [answers, sets.hops];
}

// Read the whole stream, then run it backwards.
//
// Every edge that is never deleted is present the whole time, so those go in
// first. Then walk the operations from last to first: a deletion, seen
// backwards, is the moment the edge comes back. Queries get answered on the
// way, and the answers come out in reverse order.
function offlineReverse(n, edges, ops) {
  const deleted = new Array(edges.length).fill(false);
  for (const [kind, a] of ops) if (kind === 0) deleted[a] = true;
  const sets = new Sets(n);
  edges.forEach(([u, v], i) => {
    if (!deleted[i]) sets.union(u, v);
  });
  const answers = [];
  for (let i = ops.length - 1; i >= 0; i -= 1) {
    const [kind, a, b] = ops[i];
    if (kind === 0) {
      const [u, v] = edges[a];
      sets.union(u, v);
      continue;
    }
    answers.push(sets.find(a) === sets.find(b));
  }
  answers.reverse();
  return [answers, sets.hops];
}

function show(flags) {
  return flags.map((x) => (x ? "y" : ".")).join("");
}

function describe(edges, ops) {
  return ops
    .map(([kind, a, b]) => (kind === 0 ? \`-\${edges[a][0]}\${edges[a][1]}\` : \`\${a}?\${b}\`))
    .join(" ");
}

const CASES = [
  [4, [[0, 1], [1, 2], [2, 3]], [[1, 0, 3], [0, 1, 0], [1, 0, 3], [1, 2, 3]]],
  [4, [[0, 1], [1, 2], [0, 2]], [[1, 0, 2], [0, 2, 0], [1, 0, 2], [0, 0, 0], [1, 0, 2]]],
  [5, [[0, 1], [2, 3], [3, 4]], [[1, 0, 1], [0, 0, 0], [1, 0, 1], [1, 2, 4]]],
];

console.log(
  "operations (-uv delete, a?b query)".padEnd(34) + " " + "truth".padEnd(8) + " " +
  "ignoring".padEnd(8) + " " + "reversed",
);
for (const [n, edges, ops] of CASES) {
  const [a] = byRecompute(n, edges, ops);
  const [b] = ignoringDeletions(n, edges, ops);
  const [c] = offlineReverse(n, edges, ops);
  console.log(
    describe(edges, ops).padEnd(34) + " " + show(a).padEnd(8) + " " +
    show(b).padEnd(8) + " " + show(c),
  );
}

// The same linear congruential generator in every language, so the random
// streams below are the same streams whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 31415n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let reverseOk = 0;
let ignoringOk = 0;
let falseYes = 0;
let falseNo = 0;
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
for (let t = 0; t < trials; t += 1) {
  const n = 3 + rand(4);
  const edges = [];
  for (let u = 0; u < n; u += 1)
    for (let v = u + 1; v < n; v += 1)
      if (rand(2) === 0) edges.push([u, v]);
  if (edges.length === 0) edges.push([0, n - 1]);
  const ops = [];
  const order = Array.from({ length: edges.length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = rand(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  let nxt = 0;
  for (let i = 0; i < 2 * n; i += 1) {
    if (rand(2) === 0 && nxt < order.length) {
      ops.push([0, order[nxt], 0]);
      nxt += 1;
    } else {
      ops.push([1, rand(n), rand(n)]);
    }
  }
  const [want] = byRecompute(n, edges, ops);
  const [a] = offlineReverse(n, edges, ops);
  const [b] = ignoringDeletions(n, edges, ops);
  if (same(a, want)) reverseOk += 1;
  if (same(b, want)) ignoringOk += 1;
  for (let i = 0; i < want.length; i += 1) {
    if (b[i] && !want[i]) falseYes += 1;
    if (want[i] && !b[i]) falseNo += 1;
  }
}

const row = (text, value) => "  " + text.padEnd(40) + " " + String(value).padStart(6);

console.log();
console.log(\`over \${trials} random deletion streams on 3 to 6 nodes:\`);
console.log(row("running the stream backwards matched", reverseOk));
console.log(row("ignoring the deletions matched", ignoringOk));
console.log(row("queries it wrongly called connected", falseYes));
console.log(row("queries it wrongly called separate", falseNo));

console.log();
console.log("and what the two correct methods cost as the graph grows:");
console.log("nodes".padEnd(8) + " " + "recompute steps".padStart(16) + " " + "reversed hops".padStart(14));
for (const n of [200, 400, 800]) {
  const edges = [];
  for (let v = 0; v < n - 1; v += 1) edges.push([v, v + 1]);
  const ops = [];
  for (let v = 0; v < n - 1; v += 1) {
    ops.push([0, n - 2 - v, 0]);
    ops.push([1, 0, n - 1]);
  }
  const [, steps] = byRecompute(n, edges, ops);
  const [, hops] = offlineReverse(n, edges, ops);
  console.log(String(n).padEnd(8) + " " + String(steps).padStart(16) + " " + String(hops).padStart(14));
}

console.log();
console.log("Ignoring the deletions is not a small error. It matched the definition");
console.log(\`on \${ignoringOk} of \${trials} streams, and every one of its \${falseYes} mistakes was in the\`);
console.log("same direction: connected, when the edge that connected them is gone.");
console.log("It never called two nodes separate that were not -- adding edges can");
console.log("only merge groups, so the answer it gives is the answer for a graph");
console.log("that is a superset of the real one.");
console.log();
console.log(\`Running the stream backwards is exactly right on all \${reverseOk}, and it is\`);
console.log("the same union-find as before with nothing added. The only requirement");
console.log("is knowing the whole stream in advance, which is the trade: an offline");
console.log("algorithm cannot answer a query before it has been told what comes");
console.log("after it. When queries genuinely arrive live and edges genuinely");
console.log("disappear, union-find is the wrong structure and the answer is a");
console.log("dynamic connectivity structure, which is a different subject.");
`,
            },
            {
              lang: "typescript",
              code: `// The thing union-find cannot do, and the trick that gets round it anyway.
//
// Union-find merges. It has no undo. There is no way to take a pointer back
// out, because a root has forgotten which of its descendants arrived in which
// merge -- the whole reason it is fast is that it threw that away.
//
// So a stream of edge *deletions* with connectivity queries in between looks
// like the wrong problem for it. It is, taken in order. Taken backwards it is
// exactly the right one: run time in reverse and every deletion becomes an
// insertion. That works whenever the whole stream is available up front, which
// is what "offline" means.

// Union-find with both fixes, as the previous example ended up.
class Sets {
  parent: number[];
  size: number[];
  hops: number;

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.size = new Array(n).fill(1);
    this.hops = 0;
  }

  find(v: number): number {
    let root = v;
    while (this.parent[root] !== root) {
      this.hops += 1;
      root = this.parent[root];
    }
    let at = v;
    while (this.parent[at] !== root) {
      const nxt = this.parent[at];
      this.parent[at] = root;
      at = nxt;
    }
    return root;
  }

  union(a: number, b: number): void {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return;
    if (this.size[rb] > this.size[ra]) {
      const tmp = ra;
      ra = rb;
      rb = tmp;
    }
    this.parent[rb] = ra;
    this.size[ra] += this.size[rb];
  }
}

// The definition: after every deletion, walk the graph that is left.
function byRecompute(n: number, edges: number[][], ops: number[][]): [boolean[], number] {
  const alive = new Array(edges.length).fill(true);
  const answers: boolean[] = [];
  let steps = 0;
  for (const [kind, a, b] of ops) {
    if (kind === 0) {
      alive[a] = false;
      continue;
    }
    const adj: number[][] = Array.from({ length: n }, () => []);
    edges.forEach(([u, v], i) => {
      if (alive[i]) {
        adj[u].push(v);
        adj[v].push(u);
      }
    });
    const seen = new Array(n).fill(false);
    seen[a] = true;
    const q: number[] = [a];
    let head = 0;
    while (head < q.length) {
      const at = q[head];
      head += 1;
      steps += 1;
      for (const nxt of adj[at]) {
        steps += 1;
        if (!seen[nxt]) {
          seen[nxt] = true;
          q.push(nxt);
        }
      }
    }
    answers.push(seen[b]);
  }
  return [answers, steps];
}

// The tempting wrong answer: merge everything and never take it back.
function ignoringDeletions(n: number, edges: number[][], ops: number[][]): [boolean[], number] {
  const sets = new Sets(n);
  for (const [u, v] of edges) sets.union(u, v);
  const answers: boolean[] = [];
  for (const [kind, a, b] of ops) {
    if (kind === 0) continue;
    answers.push(sets.find(a) === sets.find(b));
  }
  return [answers, sets.hops];
}

// Read the whole stream, then run it backwards.
//
// Every edge that is never deleted is present the whole time, so those go in
// first. Then walk the operations from last to first: a deletion, seen
// backwards, is the moment the edge comes back. Queries get answered on the
// way, and the answers come out in reverse order.
function offlineReverse(n: number, edges: number[][], ops: number[][]): [boolean[], number] {
  const deleted = new Array(edges.length).fill(false);
  for (const [kind, a] of ops) if (kind === 0) deleted[a] = true;
  const sets = new Sets(n);
  edges.forEach(([u, v], i) => {
    if (!deleted[i]) sets.union(u, v);
  });
  const answers: boolean[] = [];
  for (let i = ops.length - 1; i >= 0; i -= 1) {
    const [kind, a, b] = ops[i];
    if (kind === 0) {
      const [u, v] = edges[a];
      sets.union(u, v);
      continue;
    }
    answers.push(sets.find(a) === sets.find(b));
  }
  answers.reverse();
  return [answers, sets.hops];
}

function show(flags: boolean[]): string {
  return flags.map((x) => (x ? "y" : ".")).join("");
}

function describe(edges: number[][], ops: number[][]): string {
  return ops
    .map(([kind, a, b]) => (kind === 0 ? \`-\${edges[a][0]}\${edges[a][1]}\` : \`\${a}?\${b}\`))
    .join(" ");
}

const CASES: [number, number[][], number[][]][] = [
  [4, [[0, 1], [1, 2], [2, 3]], [[1, 0, 3], [0, 1, 0], [1, 0, 3], [1, 2, 3]]],
  [4, [[0, 1], [1, 2], [0, 2]], [[1, 0, 2], [0, 2, 0], [1, 0, 2], [0, 0, 0], [1, 0, 2]]],
  [5, [[0, 1], [2, 3], [3, 4]], [[1, 0, 1], [0, 0, 0], [1, 0, 1], [1, 2, 4]]],
];

console.log(
  "operations (-uv delete, a?b query)".padEnd(34) + " " + "truth".padEnd(8) + " " +
  "ignoring".padEnd(8) + " " + "reversed",
);
for (const [n, edges, ops] of CASES) {
  const [a] = byRecompute(n, edges, ops);
  const [b] = ignoringDeletions(n, edges, ops);
  const [c] = offlineReverse(n, edges, ops);
  console.log(
    describe(edges, ops).padEnd(34) + " " + show(a).padEnd(8) + " " +
    show(b).padEnd(8) + " " + show(c),
  );
}

// The same linear congruential generator in every language, so the random
// streams below are the same streams whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 31415n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let reverseOk = 0;
let ignoringOk = 0;
let falseYes = 0;
let falseNo = 0;
const same = (a: boolean[], b: boolean[]): boolean => a.length === b.length && a.every((x, i) => x === b[i]);
for (let t = 0; t < trials; t += 1) {
  const n = 3 + rand(4);
  const edges: number[][] = [];
  for (let u = 0; u < n; u += 1)
    for (let v = u + 1; v < n; v += 1)
      if (rand(2) === 0) edges.push([u, v]);
  if (edges.length === 0) edges.push([0, n - 1]);
  const ops: number[][] = [];
  const order = Array.from({ length: edges.length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = rand(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  let nxt = 0;
  for (let i = 0; i < 2 * n; i += 1) {
    if (rand(2) === 0 && nxt < order.length) {
      ops.push([0, order[nxt], 0]);
      nxt += 1;
    } else {
      ops.push([1, rand(n), rand(n)]);
    }
  }
  const [want] = byRecompute(n, edges, ops);
  const [a] = offlineReverse(n, edges, ops);
  const [b] = ignoringDeletions(n, edges, ops);
  if (same(a, want)) reverseOk += 1;
  if (same(b, want)) ignoringOk += 1;
  for (let i = 0; i < want.length; i += 1) {
    if (b[i] && !want[i]) falseYes += 1;
    if (want[i] && !b[i]) falseNo += 1;
  }
}

const row = (text: string, value: number): string => "  " + text.padEnd(40) + " " + String(value).padStart(6);

console.log();
console.log(\`over \${trials} random deletion streams on 3 to 6 nodes:\`);
console.log(row("running the stream backwards matched", reverseOk));
console.log(row("ignoring the deletions matched", ignoringOk));
console.log(row("queries it wrongly called connected", falseYes));
console.log(row("queries it wrongly called separate", falseNo));

console.log();
console.log("and what the two correct methods cost as the graph grows:");
console.log("nodes".padEnd(8) + " " + "recompute steps".padStart(16) + " " + "reversed hops".padStart(14));
for (const n of [200, 400, 800]) {
  const edges: number[][] = [];
  for (let v = 0; v < n - 1; v += 1) edges.push([v, v + 1]);
  const ops: number[][] = [];
  for (let v = 0; v < n - 1; v += 1) {
    ops.push([0, n - 2 - v, 0]);
    ops.push([1, 0, n - 1]);
  }
  const [, steps] = byRecompute(n, edges, ops);
  const [, hops] = offlineReverse(n, edges, ops);
  console.log(String(n).padEnd(8) + " " + String(steps).padStart(16) + " " + String(hops).padStart(14));
}

console.log();
console.log("Ignoring the deletions is not a small error. It matched the definition");
console.log(\`on \${ignoringOk} of \${trials} streams, and every one of its \${falseYes} mistakes was in the\`);
console.log("same direction: connected, when the edge that connected them is gone.");
console.log("It never called two nodes separate that were not -- adding edges can");
console.log("only merge groups, so the answer it gives is the answer for a graph");
console.log("that is a superset of the real one.");
console.log();
console.log(\`Running the stream backwards is exactly right on all \${reverseOk}, and it is\`);
console.log("the same union-find as before with nothing added. The only requirement");
console.log("is knowing the whole stream in advance, which is the trade: an offline");
console.log("algorithm cannot answer a query before it has been told what comes");
console.log("after it. When queries genuinely arrive live and edges genuinely");
console.log("disappear, union-find is the wrong structure and the answer is a");
console.log("dynamic connectivity structure, which is a different subject.");
`,
            },
            {
              lang: "java",
              code: `// The thing union-find cannot do, and the trick that gets round it anyway.
//
// Union-find merges. It has no undo. There is no way to take a pointer back
// out, because a root has forgotten which of its descendants arrived in which
// merge -- the whole reason it is fast is that it threw that away.
//
// So a stream of edge *deletions* with connectivity queries in between looks
// like the wrong problem for it. It is, taken in order. Taken backwards it is
// exactly the right one: run time in reverse and every deletion becomes an
// insertion. That works whenever the whole stream is available up front, which
// is what "offline" means.
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Main {
    /** Union-find with both fixes, as the previous example ended up. */
    static class Sets {
        int[] parent;
        int[] size;
        long hops = 0;

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
            while (parent[root] != root) {
                hops++;
                root = parent[root];
            }
            int at = v;
            while (parent[at] != root) {
                int nxt = parent[at];
                parent[at] = root;
                at = nxt;
            }
            return root;
        }

        void union(int a, int b) {
            int ra = find(a), rb = find(b);
            if (ra == rb) return;
            if (size[rb] > size[ra]) {
                int tmp = ra;
                ra = rb;
                rb = tmp;
            }
            parent[rb] = ra;
            size[ra] += size[rb];
        }
    }

    /** The definition: after every deletion, walk the graph that is left. */
    static List<Boolean> byRecompute(int n, int[][] edges, int[][] ops, long[] stats) {
        boolean[] alive = new boolean[edges.length];
        java.util.Arrays.fill(alive, true);
        List<Boolean> answers = new ArrayList<>();
        long steps = 0;
        for (int[] op : ops) {
            if (op[0] == 0) {
                alive[op[1]] = false;
                continue;
            }
            @SuppressWarnings("unchecked")
            List<Integer>[] adj = new List[n];
            for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
            for (int i = 0; i < edges.length; i++) {
                if (alive[i]) {
                    adj[edges[i][0]].add(edges[i][1]);
                    adj[edges[i][1]].add(edges[i][0]);
                }
            }
            boolean[] seen = new boolean[n];
            seen[op[1]] = true;
            List<Integer> q = new ArrayList<>();
            q.add(op[1]);
            int head = 0;
            while (head < q.size()) {
                int at = q.get(head++);
                steps++;
                for (int nxt : adj[at]) {
                    steps++;
                    if (!seen[nxt]) {
                        seen[nxt] = true;
                        q.add(nxt);
                    }
                }
            }
            answers.add(seen[op[2]]);
        }
        stats[0] = steps;
        return answers;
    }

    /** The tempting wrong answer: merge everything and never take it back. */
    static List<Boolean> ignoringDeletions(int n, int[][] edges, int[][] ops, long[] stats) {
        Sets sets = new Sets(n);
        for (int[] e : edges) sets.union(e[0], e[1]);
        List<Boolean> answers = new ArrayList<>();
        for (int[] op : ops) {
            if (op[0] == 0) continue;
            answers.add(sets.find(op[1]) == sets.find(op[2]));
        }
        stats[0] = sets.hops;
        return answers;
    }

    /**
     * Read the whole stream, then run it backwards.
     *
     * <p>Every edge that is never deleted is present the whole time, so those go
     * in first. Then walk the operations from last to first: a deletion, seen
     * backwards, is the moment the edge comes back. Queries get answered on the
     * way, and the answers come out in reverse order.
     */
    static List<Boolean> offlineReverse(int n, int[][] edges, int[][] ops, long[] stats) {
        boolean[] deleted = new boolean[edges.length];
        for (int[] op : ops) if (op[0] == 0) deleted[op[1]] = true;
        Sets sets = new Sets(n);
        for (int i = 0; i < edges.length; i++)
            if (!deleted[i]) sets.union(edges[i][0], edges[i][1]);
        List<Boolean> answers = new ArrayList<>();
        for (int i = ops.length - 1; i >= 0; i--) {
            int[] op = ops[i];
            if (op[0] == 0) {
                sets.union(edges[op[1]][0], edges[op[1]][1]);
                continue;
            }
            answers.add(sets.find(op[1]) == sets.find(op[2]));
        }
        Collections.reverse(answers);
        stats[0] = sets.hops;
        return answers;
    }

    static String show(List<Boolean> flags) {
        StringBuilder sb = new StringBuilder();
        for (boolean x : flags) sb.append(x ? "y" : ".");
        return sb.toString();
    }

    static String describe(int[][] edges, int[][] ops) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < ops.length; i++) {
            if (i > 0) sb.append(" ");
            if (ops[i][0] == 0)
                sb.append("-").append(edges[ops[i][1]][0]).append(edges[ops[i][1]][1]);
            else sb.append(ops[i][1]).append("?").append(ops[i][2]);
        }
        return sb.toString();
    }

    // The same linear congruential generator in every language, so the random
    // streams below are the same streams whichever translation is run.
    static long seed = 31415L;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    static String row(String text, long value) {
        return String.format("  %-40s %6d", text, value);
    }

    public static void main(String[] args) {
        int[] caseN = {4, 4, 5};
        int[][][] caseEdges = {
            {{0, 1}, {1, 2}, {2, 3}},
            {{0, 1}, {1, 2}, {0, 2}},
            {{0, 1}, {2, 3}, {3, 4}},
        };
        int[][][] caseOps = {
            {{1, 0, 3}, {0, 1, 0}, {1, 0, 3}, {1, 2, 3}},
            {{1, 0, 2}, {0, 2, 0}, {1, 0, 2}, {0, 0, 0}, {1, 0, 2}},
            {{1, 0, 1}, {0, 0, 0}, {1, 0, 1}, {1, 2, 4}},
        };

        System.out.printf("%-34s %-8s %-8s %s%n",
            "operations (-uv delete, a?b query)", "truth", "ignoring", "reversed");
        for (int c = 0; c < caseN.length; c++) {
            System.out.printf("%-34s %-8s %-8s %s%n", describe(caseEdges[c], caseOps[c]),
                show(byRecompute(caseN[c], caseEdges[c], caseOps[c], new long[1])),
                show(ignoringDeletions(caseN[c], caseEdges[c], caseOps[c], new long[1])),
                show(offlineReverse(caseN[c], caseEdges[c], caseOps[c], new long[1])));
        }

        int trials = 3000;
        int reverseOk = 0, ignoringOk = 0, falseYes = 0, falseNo = 0;
        for (int t = 0; t < trials; t++) {
            int n = 3 + rand(4);
            List<int[]> built = new ArrayList<>();
            for (int u = 0; u < n; u++)
                for (int v = u + 1; v < n; v++)
                    if (rand(2) == 0) built.add(new int[] {u, v});
            if (built.isEmpty()) built.add(new int[] {0, n - 1});
            int[][] edges = built.toArray(new int[0][]);
            int[] order = new int[edges.length];
            for (int i = 0; i < order.length; i++) order[i] = i;
            for (int i = order.length - 1; i > 0; i--) {
                int j = rand(i + 1);
                int tmp = order[i];
                order[i] = order[j];
                order[j] = tmp;
            }
            List<int[]> opList = new ArrayList<>();
            int nxt = 0;
            for (int i = 0; i < 2 * n; i++) {
                if (rand(2) == 0 && nxt < order.length) {
                    opList.add(new int[] {0, order[nxt], 0});
                    nxt++;
                } else {
                    opList.add(new int[] {1, rand(n), rand(n)});
                }
            }
            int[][] ops = opList.toArray(new int[0][]);
            List<Boolean> want = byRecompute(n, edges, ops, new long[1]);
            List<Boolean> a = offlineReverse(n, edges, ops, new long[1]);
            List<Boolean> b = ignoringDeletions(n, edges, ops, new long[1]);
            if (a.equals(want)) reverseOk++;
            if (b.equals(want)) ignoringOk++;
            for (int i = 0; i < want.size(); i++) {
                if (b.get(i) && !want.get(i)) falseYes++;
                if (want.get(i) && !b.get(i)) falseNo++;
            }
        }

        System.out.println();
        System.out.println("over " + trials + " random deletion streams on 3 to 6 nodes:");
        System.out.println(row("running the stream backwards matched", reverseOk));
        System.out.println(row("ignoring the deletions matched", ignoringOk));
        System.out.println(row("queries it wrongly called connected", falseYes));
        System.out.println(row("queries it wrongly called separate", falseNo));

        System.out.println();
        System.out.println("and what the two correct methods cost as the graph grows:");
        System.out.printf("%-8s %16s %14s%n", "nodes", "recompute steps", "reversed hops");
        for (int n : new int[] {200, 400, 800}) {
            int[][] edges = new int[n - 1][2];
            for (int v = 0; v < n - 1; v++) edges[v] = new int[] {v, v + 1};
            int[][] ops = new int[2 * (n - 1)][3];
            for (int v = 0; v < n - 1; v++) {
                ops[2 * v] = new int[] {0, n - 2 - v, 0};
                ops[2 * v + 1] = new int[] {1, 0, n - 1};
            }
            long[] steps = new long[1];
            long[] hops = new long[1];
            byRecompute(n, edges, ops, steps);
            offlineReverse(n, edges, ops, hops);
            System.out.printf("%-8d %16d %14d%n", n, steps[0], hops[0]);
        }

        System.out.println();
        System.out.println("Ignoring the deletions is not a small error. It matched the definition");
        System.out.println("on " + ignoringOk + " of " + trials + " streams, and every one of its "
            + falseYes + " mistakes was in the");
        System.out.println("same direction: connected, when the edge that connected them is gone.");
        System.out.println("It never called two nodes separate that were not -- adding edges can");
        System.out.println("only merge groups, so the answer it gives is the answer for a graph");
        System.out.println("that is a superset of the real one.");
        System.out.println();
        System.out.println("Running the stream backwards is exactly right on all " + reverseOk
            + ", and it is");
        System.out.println("the same union-find as before with nothing added. The only requirement");
        System.out.println("is knowing the whole stream in advance, which is the trade: an offline");
        System.out.println("algorithm cannot answer a query before it has been told what comes");
        System.out.println("after it. When queries genuinely arrive live and edges genuinely");
        System.out.println("disappear, union-find is the wrong structure and the answer is a");
        System.out.println("dynamic connectivity structure, which is a different subject.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The thing union-find cannot do, and the trick that gets round it anyway.
//
// Union-find merges. It has no undo. There is no way to take a pointer back
// out, because a root has forgotten which of its descendants arrived in which
// merge -- the whole reason it is fast is that it threw that away.
//
// So a stream of edge *deletions* with connectivity queries in between looks
// like the wrong problem for it. It is, taken in order. Taken backwards it is
// exactly the right one: run time in reverse and every deletion becomes an
// insertion. That works whenever the whole stream is available up front, which
// is what "offline" means.
#include <algorithm>
#include <array>
#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

using Op = std::array<int, 3>;
using Arrow = std::pair<int, int>;
using Flags = std::vector<bool>;

// Union-find with both fixes, as the previous example ended up.
struct Sets {
    std::vector<int> parent;
    std::vector<int> size;
    long long hops = 0;

    explicit Sets(int n) {
        parent.resize(n);
        size.assign(n, 1);
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    int find(int v) {
        int root = v;
        while (parent[root] != root) {
            hops++;
            root = parent[root];
        }
        int at = v;
        while (parent[at] != root) {
            int nxt = parent[at];
            parent[at] = root;
            at = nxt;
        }
        return root;
    }

    void unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return;
        if (size[rb] > size[ra]) std::swap(ra, rb);
        parent[rb] = ra;
        size[ra] += size[rb];
    }
};

// The definition: after every deletion, walk the graph that is left.
Flags by_recompute(int n, const std::vector<Arrow>& edges, const std::vector<Op>& ops,
                   long long& steps) {
    std::vector<bool> alive(edges.size(), true);
    Flags answers;
    steps = 0;
    for (const Op& op : ops) {
        if (op[0] == 0) {
            alive[op[1]] = false;
            continue;
        }
        std::vector<std::vector<int>> adj(n);
        for (size_t i = 0; i < edges.size(); i++) {
            if (alive[i]) {
                adj[edges[i].first].push_back(edges[i].second);
                adj[edges[i].second].push_back(edges[i].first);
            }
        }
        std::vector<bool> seen(n, false);
        seen[op[1]] = true;
        std::vector<int> q = {op[1]};
        size_t head = 0;
        while (head < q.size()) {
            int at = q[head++];
            steps++;
            for (int nxt : adj[at]) {
                steps++;
                if (!seen[nxt]) {
                    seen[nxt] = true;
                    q.push_back(nxt);
                }
            }
        }
        answers.push_back(seen[op[2]]);
    }
    return answers;
}

// The tempting wrong answer: merge everything and never take it back.
Flags ignoring_deletions(int n, const std::vector<Arrow>& edges, const std::vector<Op>& ops,
                         long long& hops) {
    Sets sets(n);
    for (const Arrow& e : edges) sets.unite(e.first, e.second);
    Flags answers;
    for (const Op& op : ops) {
        if (op[0] == 0) continue;
        answers.push_back(sets.find(op[1]) == sets.find(op[2]));
    }
    hops = sets.hops;
    return answers;
}

// Read the whole stream, then run it backwards.
//
// Every edge that is never deleted is present the whole time, so those go in
// first. Then walk the operations from last to first: a deletion, seen
// backwards, is the moment the edge comes back. Queries get answered on the
// way, and the answers come out in reverse order.
Flags offline_reverse(int n, const std::vector<Arrow>& edges, const std::vector<Op>& ops,
                      long long& hops) {
    std::vector<bool> deleted(edges.size(), false);
    for (const Op& op : ops)
        if (op[0] == 0) deleted[op[1]] = true;
    Sets sets(n);
    for (size_t i = 0; i < edges.size(); i++)
        if (!deleted[i]) sets.unite(edges[i].first, edges[i].second);
    Flags answers;
    for (int i = static_cast<int>(ops.size()) - 1; i >= 0; i--) {
        const Op& op = ops[i];
        if (op[0] == 0) {
            sets.unite(edges[op[1]].first, edges[op[1]].second);
            continue;
        }
        answers.push_back(sets.find(op[1]) == sets.find(op[2]));
    }
    std::reverse(answers.begin(), answers.end());
    hops = sets.hops;
    return answers;
}

std::string show(const Flags& flags) {
    std::string s;
    for (bool x : flags) s += x ? "y" : ".";
    return s;
}

std::string describe(const std::vector<Arrow>& edges, const std::vector<Op>& ops) {
    std::string s;
    for (size_t i = 0; i < ops.size(); i++) {
        if (i > 0) s += " ";
        if (ops[i][0] == 0)
            s += "-" + std::to_string(edges[ops[i][1]].first) +
                 std::to_string(edges[ops[i][1]].second);
        else s += std::to_string(ops[i][1]) + "?" + std::to_string(ops[i][2]);
    }
    return s;
}

// The same linear congruential generator in every language, so the random
// streams below are the same streams whichever translation is run.
long long seed = 31415;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

void row(const std::string& text, long long value) {
    std::cout << "  " << std::left << std::setw(40) << text << " " << std::right
              << std::setw(6) << value << "\\n";
}

int main() {
    std::vector<int> case_n = {4, 4, 5};
    std::vector<std::vector<Arrow>> case_edges = {
        {{0, 1}, {1, 2}, {2, 3}},
        {{0, 1}, {1, 2}, {0, 2}},
        {{0, 1}, {2, 3}, {3, 4}},
    };
    std::vector<std::vector<Op>> case_ops = {
        {{1, 0, 3}, {0, 1, 0}, {1, 0, 3}, {1, 2, 3}},
        {{1, 0, 2}, {0, 2, 0}, {1, 0, 2}, {0, 0, 0}, {1, 0, 2}},
        {{1, 0, 1}, {0, 0, 0}, {1, 0, 1}, {1, 2, 4}},
    };

    std::cout << std::left << std::setw(34) << "operations (-uv delete, a?b query)" << " "
              << std::setw(8) << "truth" << " " << std::setw(8) << "ignoring" << " "
              << "reversed" << "\\n";
    for (size_t c = 0; c < case_n.size(); c++) {
        long long steps = 0, hops = 0;
        std::cout << std::left << std::setw(34) << describe(case_edges[c], case_ops[c]) << " "
                  << std::setw(8) << show(by_recompute(case_n[c], case_edges[c], case_ops[c], steps))
                  << " " << std::setw(8)
                  << show(ignoring_deletions(case_n[c], case_edges[c], case_ops[c], hops)) << " "
                  << show(offline_reverse(case_n[c], case_edges[c], case_ops[c], hops)) << "\\n";
    }

    int trials = 3000;
    int reverse_ok = 0, ignoring_ok = 0, false_yes = 0, false_no = 0;
    for (int t = 0; t < trials; t++) {
        int n = 3 + rand_below(4);
        std::vector<Arrow> edges;
        for (int u = 0; u < n; u++)
            for (int v = u + 1; v < n; v++)
                if (rand_below(2) == 0) edges.push_back({u, v});
        if (edges.empty()) edges.push_back({0, n - 1});
        std::vector<int> order(edges.size());
        for (size_t i = 0; i < order.size(); i++) order[i] = static_cast<int>(i);
        for (int i = static_cast<int>(order.size()) - 1; i > 0; i--) {
            int j = rand_below(i + 1);
            std::swap(order[i], order[j]);
        }
        std::vector<Op> ops;
        size_t nxt = 0;
        for (int i = 0; i < 2 * n; i++) {
            if (rand_below(2) == 0 && nxt < order.size()) {
                ops.push_back({0, order[nxt], 0});
                nxt++;
            } else {
                ops.push_back({1, rand_below(n), rand_below(n)});
            }
        }
        long long steps = 0, hops = 0;
        Flags want = by_recompute(n, edges, ops, steps);
        Flags a = offline_reverse(n, edges, ops, hops);
        Flags b = ignoring_deletions(n, edges, ops, hops);
        if (a == want) reverse_ok++;
        if (b == want) ignoring_ok++;
        for (size_t i = 0; i < want.size(); i++) {
            if (b[i] && !want[i]) false_yes++;
            if (want[i] && !b[i]) false_no++;
        }
    }

    std::cout << "\\n";
    std::cout << "over " << trials << " random deletion streams on 3 to 6 nodes:\\n";
    row("running the stream backwards matched", reverse_ok);
    row("ignoring the deletions matched", ignoring_ok);
    row("queries it wrongly called connected", false_yes);
    row("queries it wrongly called separate", false_no);

    std::cout << "\\n";
    std::cout << "and what the two correct methods cost as the graph grows:\\n";
    std::cout << std::left << std::setw(8) << "nodes" << " " << std::right << std::setw(16)
              << "recompute steps" << " " << std::setw(14) << "reversed hops" << "\\n";
    for (int n : {200, 400, 800}) {
        std::vector<Arrow> edges;
        for (int v = 0; v < n - 1; v++) edges.push_back({v, v + 1});
        std::vector<Op> ops;
        for (int v = 0; v < n - 1; v++) {
            ops.push_back({0, n - 2 - v, 0});
            ops.push_back({1, 0, n - 1});
        }
        long long steps = 0, hops = 0;
        by_recompute(n, edges, ops, steps);
        offline_reverse(n, edges, ops, hops);
        std::cout << std::left << std::setw(8) << n << " " << std::right << std::setw(16)
                  << steps << " " << std::setw(14) << hops << "\\n";
    }

    std::cout << "\\n";
    std::cout << "Ignoring the deletions is not a small error. It matched the definition\\n";
    std::cout << "on " << ignoring_ok << " of " << trials << " streams, and every one of its "
              << false_yes << " mistakes was in the\\n";
    std::cout << "same direction: connected, when the edge that connected them is gone.\\n";
    std::cout << "It never called two nodes separate that were not -- adding edges can\\n";
    std::cout << "only merge groups, so the answer it gives is the answer for a graph\\n";
    std::cout << "that is a superset of the real one.\\n";
    std::cout << "\\n";
    std::cout << "Running the stream backwards is exactly right on all " << reverse_ok
              << ", and it is\\n";
    std::cout << "the same union-find as before with nothing added. The only requirement\\n";
    std::cout << "is knowing the whole stream in advance, which is the trade: an offline\\n";
    std::cout << "algorithm cannot answer a query before it has been told what comes\\n";
    std::cout << "after it. When queries genuinely arrive live and edges genuinely\\n";
    std::cout << "disappear, union-find is the wrong structure and the answer is a\\n";
    std::cout << "dynamic connectivity structure, which is a different subject.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// The thing union-find cannot do, and the trick that gets round it anyway.
//
// Union-find merges. It has no undo. There is no way to take a pointer back
// out, because a root has forgotten which of its descendants arrived in which
// merge -- the whole reason it is fast is that it threw that away.
//
// So a stream of edge *deletions* with connectivity queries in between looks
// like the wrong problem for it. It is, taken in order. Taken backwards it is
// exactly the right one: run time in reverse and every deletion becomes an
// insertion. That works whenever the whole stream is available up front, which
// is what "offline" means.
type Op = (usize, usize, usize);
type Arrow = (usize, usize);

/// Union-find with both fixes, as the previous example ended up.
struct Sets {
    parent: Vec<usize>,
    size: Vec<usize>,
    hops: u64,
}

impl Sets {
    fn new(n: usize) -> Sets {
        Sets {
            parent: (0..n).collect(),
            size: vec![1; n],
            hops: 0,
        }
    }

    fn find(&mut self, v: usize) -> usize {
        let mut root = v;
        while self.parent[root] != root {
            self.hops += 1;
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

    fn unite(&mut self, a: usize, b: usize) {
        let mut ra = self.find(a);
        let mut rb = self.find(b);
        if ra == rb {
            return;
        }
        if self.size[rb] > self.size[ra] {
            std::mem::swap(&mut ra, &mut rb);
        }
        self.parent[rb] = ra;
        self.size[ra] += self.size[rb];
    }
}

/// The definition: after every deletion, walk the graph that is left.
fn by_recompute(n: usize, edges: &[Arrow], ops: &[Op]) -> (Vec<bool>, u64) {
    let mut alive = vec![true; edges.len()];
    let mut answers = Vec::new();
    let mut steps: u64 = 0;
    for &(kind, a, b) in ops {
        if kind == 0 {
            alive[a] = false;
            continue;
        }
        let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
        for (i, &(u, v)) in edges.iter().enumerate() {
            if alive[i] {
                adj[u].push(v);
                adj[v].push(u);
            }
        }
        let mut seen = vec![false; n];
        seen[a] = true;
        let mut q = vec![a];
        let mut head = 0;
        while head < q.len() {
            let at = q[head];
            head += 1;
            steps += 1;
            for idx in 0..adj[at].len() {
                let nxt = adj[at][idx];
                steps += 1;
                if !seen[nxt] {
                    seen[nxt] = true;
                    q.push(nxt);
                }
            }
        }
        answers.push(seen[b]);
    }
    (answers, steps)
}

/// The tempting wrong answer: merge everything and never take it back.
fn ignoring_deletions(n: usize, edges: &[Arrow], ops: &[Op]) -> (Vec<bool>, u64) {
    let mut sets = Sets::new(n);
    for &(u, v) in edges {
        sets.unite(u, v);
    }
    let mut answers = Vec::new();
    for &(kind, a, b) in ops {
        if kind == 0 {
            continue;
        }
        let ra = sets.find(a);
        let rb = sets.find(b);
        answers.push(ra == rb);
    }
    (answers, sets.hops)
}

/// Read the whole stream, then run it backwards.
///
/// Every edge that is never deleted is present the whole time, so those go in
/// first. Then walk the operations from last to first: a deletion, seen
/// backwards, is the moment the edge comes back. Queries get answered on the
/// way, and the answers come out in reverse order.
fn offline_reverse(n: usize, edges: &[Arrow], ops: &[Op]) -> (Vec<bool>, u64) {
    let mut deleted = vec![false; edges.len()];
    for &(kind, a, _) in ops {
        if kind == 0 {
            deleted[a] = true;
        }
    }
    let mut sets = Sets::new(n);
    for (i, &(u, v)) in edges.iter().enumerate() {
        if !deleted[i] {
            sets.unite(u, v);
        }
    }
    let mut answers = Vec::new();
    for &(kind, a, b) in ops.iter().rev() {
        if kind == 0 {
            let (u, v) = edges[a];
            sets.unite(u, v);
            continue;
        }
        let ra = sets.find(a);
        let rb = sets.find(b);
        answers.push(ra == rb);
    }
    answers.reverse();
    (answers, sets.hops)
}

fn show(flags: &[bool]) -> String {
    flags.iter().map(|&x| if x { 'y' } else { '.' }).collect()
}

fn describe(edges: &[Arrow], ops: &[Op]) -> String {
    let cells: Vec<String> = ops
        .iter()
        .map(|&(kind, a, b)| {
            if kind == 0 {
                format!("-{}{}", edges[a].0, edges[a].1)
            } else {
                format!("{}?{}", a, b)
            }
        })
        .collect();
    cells.join(" ")
}

/// The same linear congruential generator in every language, so the random
/// streams below are the same streams whichever translation is run.
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
    println!("  {:<40} {:>6}", text, value);
}

fn main() {
    let case_n = [4usize, 4, 5];
    let case_edges: Vec<Vec<Arrow>> = vec![
        vec![(0, 1), (1, 2), (2, 3)],
        vec![(0, 1), (1, 2), (0, 2)],
        vec![(0, 1), (2, 3), (3, 4)],
    ];
    let case_ops: Vec<Vec<Op>> = vec![
        vec![(1, 0, 3), (0, 1, 0), (1, 0, 3), (1, 2, 3)],
        vec![(1, 0, 2), (0, 2, 0), (1, 0, 2), (0, 0, 0), (1, 0, 2)],
        vec![(1, 0, 1), (0, 0, 0), (1, 0, 1), (1, 2, 4)],
    ];

    println!(
        "{:<34} {:<8} {:<8} {}",
        "operations (-uv delete, a?b query)", "truth", "ignoring", "reversed"
    );
    for c in 0..case_n.len() {
        let (a, _) = by_recompute(case_n[c], &case_edges[c], &case_ops[c]);
        let (b, _) = ignoring_deletions(case_n[c], &case_edges[c], &case_ops[c]);
        let (d, _) = offline_reverse(case_n[c], &case_edges[c], &case_ops[c]);
        println!(
            "{:<34} {:<8} {:<8} {}",
            describe(&case_edges[c], &case_ops[c]),
            show(&a),
            show(&b),
            show(&d)
        );
    }

    let mut rng = Rng { seed: 31415 };
    let trials = 3000;
    let (mut reverse_ok, mut ignoring_ok) = (0u64, 0u64);
    let (mut false_yes, mut false_no) = (0u64, 0u64);
    for _ in 0..trials {
        let n = 3 + rng.next(4) as usize;
        let mut edges: Vec<Arrow> = Vec::new();
        for u in 0..n {
            for v in (u + 1)..n {
                if rng.next(2) == 0 {
                    edges.push((u, v));
                }
            }
        }
        if edges.is_empty() {
            edges.push((0, n - 1));
        }
        let mut order: Vec<usize> = (0..edges.len()).collect();
        for i in (1..order.len()).rev() {
            let j = rng.next(i as i64 + 1) as usize;
            order.swap(i, j);
        }
        let mut ops: Vec<Op> = Vec::new();
        let mut nxt = 0;
        for _ in 0..(2 * n) {
            if rng.next(2) == 0 && nxt < order.len() {
                ops.push((0, order[nxt], 0));
                nxt += 1;
            } else {
                ops.push((1, rng.next(n as i64) as usize, rng.next(n as i64) as usize));
            }
        }
        let (want, _) = by_recompute(n, &edges, &ops);
        let (a, _) = offline_reverse(n, &edges, &ops);
        let (b, _) = ignoring_deletions(n, &edges, &ops);
        if a == want {
            reverse_ok += 1;
        }
        if b == want {
            ignoring_ok += 1;
        }
        for i in 0..want.len() {
            if b[i] && !want[i] {
                false_yes += 1;
            }
            if want[i] && !b[i] {
                false_no += 1;
            }
        }
    }

    println!();
    println!("over {} random deletion streams on 3 to 6 nodes:", trials);
    row("running the stream backwards matched", reverse_ok);
    row("ignoring the deletions matched", ignoring_ok);
    row("queries it wrongly called connected", false_yes);
    row("queries it wrongly called separate", false_no);

    println!();
    println!("and what the two correct methods cost as the graph grows:");
    println!("{:<8} {:>16} {:>14}", "nodes", "recompute steps", "reversed hops");
    for &n in &[200usize, 400, 800] {
        let edges: Vec<Arrow> = (0..(n - 1)).map(|v| (v, v + 1)).collect();
        let mut ops: Vec<Op> = Vec::new();
        for v in 0..(n - 1) {
            ops.push((0, n - 2 - v, 0));
            ops.push((1, 0, n - 1));
        }
        let (_, steps) = by_recompute(n, &edges, &ops);
        let (_, hops) = offline_reverse(n, &edges, &ops);
        println!("{:<8} {:>16} {:>14}", n, steps, hops);
    }

    println!();
    println!("Ignoring the deletions is not a small error. It matched the definition");
    println!(
        "on {} of {} streams, and every one of its {} mistakes was in the",
        ignoring_ok, trials, false_yes
    );
    println!("same direction: connected, when the edge that connected them is gone.");
    println!("It never called two nodes separate that were not -- adding edges can");
    println!("only merge groups, so the answer it gives is the answer for a graph");
    println!("that is a superset of the real one.");
    println!();
    println!(
        "Running the stream backwards is exactly right on all {}, and it is",
        reverse_ok
    );
    println!("the same union-find as before with nothing added. The only requirement");
    println!("is knowing the whole stream in advance, which is the trade: an offline");
    println!("algorithm cannot answer a query before it has been told what comes");
    println!("after it. When queries genuinely arrive live and edges genuinely");
    println!("disappear, union-find is the wrong structure and the answer is a");
    println!("dynamic connectivity structure, which is a different subject.");
}
`,
            },
            {
              lang: "go",
              code: `// The thing union-find cannot do, and the trick that gets round it anyway.
//
// Union-find merges. It has no undo. There is no way to take a pointer back
// out, because a root has forgotten which of its descendants arrived in which
// merge -- the whole reason it is fast is that it threw that away.
//
// So a stream of edge *deletions* with connectivity queries in between looks
// like the wrong problem for it. It is, taken in order. Taken backwards it is
// exactly the right one: run time in reverse and every deletion becomes an
// insertion. That works whenever the whole stream is available up front, which
// is what "offline" means.
package main

import (
	"fmt"
	"strings"
)

// Op is one operation: kind 0 deletes edge A, kind 1 asks about A and B.
type Op struct {
	Kind, A, B int
}

// Arrow is an undirected edge.
type Arrow struct {
	U, V int
}

// Sets is union-find with both fixes, as the previous example ended up.
type Sets struct {
	parent []int
	size   []int
	hops   int64
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
		s.hops++
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

func (s *Sets) unite(a, b int) {
	ra, rb := s.find(a), s.find(b)
	if ra == rb {
		return
	}
	if s.size[rb] > s.size[ra] {
		ra, rb = rb, ra
	}
	s.parent[rb] = ra
	s.size[ra] += s.size[rb]
}

// byRecompute is the definition: after every deletion, walk what is left.
func byRecompute(n int, edges []Arrow, ops []Op) ([]bool, int64) {
	alive := make([]bool, len(edges))
	for i := range alive {
		alive[i] = true
	}
	var answers []bool
	var steps int64
	for _, op := range ops {
		if op.Kind == 0 {
			alive[op.A] = false
			continue
		}
		adj := make([][]int, n)
		for i, e := range edges {
			if alive[i] {
				adj[e.U] = append(adj[e.U], e.V)
				adj[e.V] = append(adj[e.V], e.U)
			}
		}
		seen := make([]bool, n)
		seen[op.A] = true
		q := []int{op.A}
		head := 0
		for head < len(q) {
			at := q[head]
			head++
			steps++
			for _, nxt := range adj[at] {
				steps++
				if !seen[nxt] {
					seen[nxt] = true
					q = append(q, nxt)
				}
			}
		}
		answers = append(answers, seen[op.B])
	}
	return answers, steps
}

// ignoringDeletions is the tempting wrong answer: merge everything and never
// take it back.
func ignoringDeletions(n int, edges []Arrow, ops []Op) ([]bool, int64) {
	sets := newSets(n)
	for _, e := range edges {
		sets.unite(e.U, e.V)
	}
	var answers []bool
	for _, op := range ops {
		if op.Kind == 0 {
			continue
		}
		answers = append(answers, sets.find(op.A) == sets.find(op.B))
	}
	return answers, sets.hops
}

// offlineReverse reads the whole stream, then runs it backwards.
//
// Every edge that is never deleted is present the whole time, so those go in
// first. Then walk the operations from last to first: a deletion, seen
// backwards, is the moment the edge comes back. Queries get answered on the
// way, and the answers come out in reverse order.
func offlineReverse(n int, edges []Arrow, ops []Op) ([]bool, int64) {
	deleted := make([]bool, len(edges))
	for _, op := range ops {
		if op.Kind == 0 {
			deleted[op.A] = true
		}
	}
	sets := newSets(n)
	for i, e := range edges {
		if !deleted[i] {
			sets.unite(e.U, e.V)
		}
	}
	var answers []bool
	for i := len(ops) - 1; i >= 0; i-- {
		op := ops[i]
		if op.Kind == 0 {
			sets.unite(edges[op.A].U, edges[op.A].V)
			continue
		}
		answers = append(answers, sets.find(op.A) == sets.find(op.B))
	}
	for i, j := 0, len(answers)-1; i < j; i, j = i+1, j-1 {
		answers[i], answers[j] = answers[j], answers[i]
	}
	return answers, sets.hops
}

func same(a, b []bool) bool {
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

func show(flags []bool) string {
	var sb strings.Builder
	for _, x := range flags {
		if x {
			sb.WriteString("y")
		} else {
			sb.WriteString(".")
		}
	}
	return sb.String()
}

func describe(edges []Arrow, ops []Op) string {
	cells := make([]string, len(ops))
	for i, op := range ops {
		if op.Kind == 0 {
			cells[i] = fmt.Sprintf("-%d%d", edges[op.A].U, edges[op.A].V)
		} else {
			cells[i] = fmt.Sprintf("%d?%d", op.A, op.B)
		}
	}
	return strings.Join(cells, " ")
}

// The same linear congruential generator in every language, so the random
// streams below are the same streams whichever translation is run.
var seed int64 = 31415

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func row(text string, value int64) {
	fmt.Printf("  %-40s %6d\\n", text, value)
}

func main() {
	caseN := []int{4, 4, 5}
	caseEdges := [][]Arrow{
		{{0, 1}, {1, 2}, {2, 3}},
		{{0, 1}, {1, 2}, {0, 2}},
		{{0, 1}, {2, 3}, {3, 4}},
	}
	caseOps := [][]Op{
		{{1, 0, 3}, {0, 1, 0}, {1, 0, 3}, {1, 2, 3}},
		{{1, 0, 2}, {0, 2, 0}, {1, 0, 2}, {0, 0, 0}, {1, 0, 2}},
		{{1, 0, 1}, {0, 0, 0}, {1, 0, 1}, {1, 2, 4}},
	}

	fmt.Printf("%-34s %-8s %-8s %s\\n",
		"operations (-uv delete, a?b query)", "truth", "ignoring", "reversed")
	for c := range caseN {
		a, _ := byRecompute(caseN[c], caseEdges[c], caseOps[c])
		b, _ := ignoringDeletions(caseN[c], caseEdges[c], caseOps[c])
		d, _ := offlineReverse(caseN[c], caseEdges[c], caseOps[c])
		fmt.Printf("%-34s %-8s %-8s %s\\n", describe(caseEdges[c], caseOps[c]),
			show(a), show(b), show(d))
	}

	trials := 3000
	reverseOk, ignoringOk, falseYes, falseNo := 0, 0, 0, 0
	for t := 0; t < trials; t++ {
		n := 3 + randBelow(4)
		var edges []Arrow
		for u := 0; u < n; u++ {
			for v := u + 1; v < n; v++ {
				if randBelow(2) == 0 {
					edges = append(edges, Arrow{u, v})
				}
			}
		}
		if len(edges) == 0 {
			edges = append(edges, Arrow{0, n - 1})
		}
		order := make([]int, len(edges))
		for i := range order {
			order[i] = i
		}
		for i := len(order) - 1; i > 0; i-- {
			j := randBelow(i + 1)
			order[i], order[j] = order[j], order[i]
		}
		var ops []Op
		nxt := 0
		for i := 0; i < 2*n; i++ {
			if randBelow(2) == 0 && nxt < len(order) {
				ops = append(ops, Op{0, order[nxt], 0})
				nxt++
			} else {
				ops = append(ops, Op{1, randBelow(n), randBelow(n)})
			}
		}
		want, _ := byRecompute(n, edges, ops)
		a, _ := offlineReverse(n, edges, ops)
		b, _ := ignoringDeletions(n, edges, ops)
		if same(a, want) {
			reverseOk++
		}
		if same(b, want) {
			ignoringOk++
		}
		for i := range want {
			if b[i] && !want[i] {
				falseYes++
			}
			if want[i] && !b[i] {
				falseNo++
			}
		}
	}

	fmt.Println()
	fmt.Printf("over %d random deletion streams on 3 to 6 nodes:\\n", trials)
	row("running the stream backwards matched", int64(reverseOk))
	row("ignoring the deletions matched", int64(ignoringOk))
	row("queries it wrongly called connected", int64(falseYes))
	row("queries it wrongly called separate", int64(falseNo))

	fmt.Println()
	fmt.Println("and what the two correct methods cost as the graph grows:")
	fmt.Printf("%-8s %16s %14s\\n", "nodes", "recompute steps", "reversed hops")
	for _, n := range []int{200, 400, 800} {
		edges := make([]Arrow, n-1)
		for v := 0; v < n-1; v++ {
			edges[v] = Arrow{v, v + 1}
		}
		var ops []Op
		for v := 0; v < n-1; v++ {
			ops = append(ops, Op{0, n - 2 - v, 0})
			ops = append(ops, Op{1, 0, n - 1})
		}
		_, steps := byRecompute(n, edges, ops)
		_, hops := offlineReverse(n, edges, ops)
		fmt.Printf("%-8d %16d %14d\\n", n, steps, hops)
	}

	fmt.Println()
	fmt.Println("Ignoring the deletions is not a small error. It matched the definition")
	fmt.Printf("on %d of %d streams, and every one of its %d mistakes was in the\\n", ignoringOk, trials, falseYes)
	fmt.Println("same direction: connected, when the edge that connected them is gone.")
	fmt.Println("It never called two nodes separate that were not -- adding edges can")
	fmt.Println("only merge groups, so the answer it gives is the answer for a graph")
	fmt.Println("that is a superset of the real one.")
	fmt.Println()
	fmt.Printf("Running the stream backwards is exactly right on all %d, and it is\\n", reverseOk)
	fmt.Println("the same union-find as before with nothing added. The only requirement")
	fmt.Println("is knowing the whole stream in advance, which is the trade: an offline")
	fmt.Println("algorithm cannot answer a query before it has been told what comes")
	fmt.Println("after it. When queries genuinely arrive live and edges genuinely")
	fmt.Println("disappear, union-find is the wrong structure and the answer is a")
	fmt.Println("dynamic connectivity structure, which is a different subject.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Trying to add a delete by resetting a parent pointer",
          body: "There is nothing to reset it to. The root does not know which descendants arrived with the edge being removed, and the pointers of everything under it were rewritten by path compression. The structure is one-way by construction.",
        },
        {
          title: "Ignoring deletions and hoping",
          body: "It matched the truth on 1,092 of 3,000 streams, and every one of its 5,065 errors was the same kind: connected when the connecting edge is gone. Never the reverse -- which makes it exactly the sort of error that survives a spot check.",
        },
        {
          title: "Reaching for the reversal trick when queries arrive live",
          body: "It needs the whole stream up front, because an answer depends on what comes after it. That is what offline means, and it is not a limitation you can work around -- if queries are genuinely interactive, this is a dynamic connectivity problem and a different structure.",
        },
      ],
    },
    {
      id: "union-find-in-four-lines",
      heading: "Union-find in four lines",
      body: [
        "Union-find, in four lines.",
        "**It answers connectivity while the graph is still being built**, which is the case a search handles badly \u2014 3,839,199 search steps against 1,279,200 pointer hops on the same 1,600-node stream, before any optimisation.",
        "**Union by size is a bound.** On the adversarial merge order, no find ever walked more than one pointer.",
        "**Path compression is a repair.** It let the same chain form and flattened it afterwards \u2014 1,998 deep in the structure it left behind, and almost no query paying for it.",
        "**There is no delete.** But an offline deletion stream run backwards is an insertion stream, and that matched the definition on all 3,000 streams tested.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why use union-find instead of running a search?",
      answer:
        "Because the graph is not finished. If edges arrive interleaved with connectivity queries, a search re-walks a component that has not changed since the last time it walked it. I measured three approaches on a stream that merges 1,600 nodes: a search per query took 3,839,199 steps, a label array -- one component number per node, rewritten on every merge -- took 2,558,400 writes, and bare union-find took 1,279,200 pointer hops. All three gave identical answers, verified against recomputing components from scratch at every query on 3,000 random streams. The label array is the interesting comparison: it makes queries free and merges expensive, which is exactly the trade union-find reverses.",
    },
    {
      question: "What do union by size and path compression each do?",
      answer:
        "Different things, which is why I would not describe them as one optimisation. Union by size hangs the smaller tree under the larger, and it prevents deep trees from forming at all -- on a merge order built to make a chain of 2,000 nodes, no find ever walked more than a single pointer. Path compression does not prevent them; it repairs them, pointing every node on a find's path straight at the root on the way back. On the same adversarial order it let the chain form -- the structure it left behind still had a chain of 1,998 in it -- but almost no query paid for that. Both are correct with or without the other; I measured all four combinations against a recompute-from-scratch definition on 3,000 streams and all four matched every time. The reason to write both is that only the bound holds regardless of the order the merges arrive in.",
    },
    {
      question: "Can union-find handle edge deletions?",
      answer:
        "Not directly. It has no undo, because a root has forgotten which descendants arrived in which merge -- discarding that is why it is fast. But if the whole operation stream is known in advance, run it backwards: in reverse, every deletion is an insertion. Union the edges that are never deleted, then walk the operations from last to first, answering queries as you go, and reverse the answers at the end. That matched a recompute-from-scratch definition on all 3,000 random streams I tested. The tempting shortcut of just ignoring deletions matched on 1,092 of them, and all 5,065 of its mistakes were the same kind -- reporting connected when the connecting edge is gone -- because adding edges only merges groups. If queries genuinely arrive live, union-find is the wrong structure and you want a dynamic connectivity structure instead.",
    },
    {
      question: "What is union-find actually used for?",
      answer:
        "Anything phrased as \"merge these two groups\" or \"are these in the same group\". Kruskal's algorithm for minimum spanning trees is the canonical one -- it walks edges cheapest first and takes an edge exactly when its two endpoints are in different components, which is one find and one union. Beyond that: connected components in a grid or image, cycle detection in an undirected graph while reading edges, equivalence classes from a list of equalities, and account or entity merging where records keep turning out to be the same thing. The tell is that groups only ever get bigger.",
    },
  ],
  takeaways: [
    "Union-find answers connectivity while the graph is still being built \u2014 a search cannot.",
    "One parent pointer per node; a merge is one write, a query follows pointers to a root.",
    "Bare union-find is still quadratic on the merge order that builds a chain: 1,279,200 hops on 1,600 nodes.",
    "Union by size prevents deep trees \u2014 worst walk of 1 on the adversarial order.",
    "Path compression does not prevent them, it flattens them afterwards \u2014 1,998 deep left behind.",
    "All four combinations are correct; the fixes change cost, never answers.",
    "On a friendly merge order all four cost exactly the same, 3,997 hops.",
    "There is no delete, and there cannot be: the structure discarded what it would need to undo.",
    "An offline deletion stream run backwards is an insertion stream \u2014 right on all 3,000 tested.",
    "Ignoring deletions is wrong in one direction only: connected when it should be separate, 5,065 times.",
  ],
  status: "available",
};
