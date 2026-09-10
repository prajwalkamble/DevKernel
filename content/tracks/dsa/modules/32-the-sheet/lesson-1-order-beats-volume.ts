import type { Lesson } from "@/content/types";

export const orderBeatsVolumeLesson: Lesson = {
  id: "dsa-the-sheet-order-beats-volume",
  slug: "order-beats-volume",
  moduleSlug: "the-sheet",
  title: "The Ordered Core Sheet, and Why Order Beats Volume",
  summary:
    "A pattern list is a dependency graph wearing a list costume. What a wrong order actually costs, measured on this track's own prerequisites, and why the sheet you want is short and sequenced rather than long.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Describe a pattern sheet as a dependency graph rather than a list",
    "Say what a premature attempt costs and why it teaches nothing",
    "Read progress off the blocked count rather than the solved count",
    "Choose a sheet on its ordering rather than its length",
  ],
  sections: [
    {
      id: "a-list-that-is-a-graph",
      heading: "A list that is a graph",
      body: [
        "Every popular sheet is presented as a list: a hundred and fifty problems, tick them off. The presentation is wrong, and it is wrong in a way that costs real time.",
        "Patterns depend on each other. Sliding windows assume two pointers. Monotonic stacks assume stacks. Dijkstra assumes graphs *and* heaps. That is a directed acyclic graph, and the previous module has already told you what to do with one \u2014 put it in topological order.",
        "Work the sheet out of order and you meet a problem while missing a prerequisite. That problem is hard, but it is hard for the wrong reason: you cannot tell whether the pattern beat you or the missing piece did, so you learn neither. This is the single most common reason people report that a sheet \"stopped working\" partway through.",
        "The example writes this track's own dependency structure out \u2014 26 patterns, 34 edges \u2014 and measures the orderings. A safe order has zero premature attempts, by construction. A random shuffle averages 16 and reaches 27 at worst, and **not one of 3,000 shuffles was safe by luck**. Alphabetical order, which is roughly what a sheet grouped by topic name gives you, produces 14.",
        "That last number is the one worth sitting with. Grouping by topic *name* is not grouping by dependency, and it produces almost as many premature attempts as shuffling.",
      ],
      examples: [
        {
          id: "order-beats-volume",
          title: "The dependency graph behind a pattern sheet, and what each ordering costs",
          lang: "python",
          code: `# Why the order of a sheet matters more than its length.
#
# A pattern list is not a list. It is a dependency graph: sliding windows
# assume you are comfortable with two pointers, monotonic stacks assume
# stacks, Dijkstra assumes both graphs and heaps. Work a sheet in the wrong
# order and a problem is not hard because the pattern is hard -- it is hard
# because you are meeting two new things at once and cannot tell which one is
# defeating you.
#
# The graph below is this track's own dependency structure, written out. The
# measurements are about the *order*, not about the problems: how many
# premature attempts each ordering produces, where the entry points are, and
# how deep the deepest chain goes.
from collections import deque

# pattern -> the patterns it assumes you already have
NEEDS = {
    "arrays": [],
    "hashing": ["arrays"],
    "sorting": ["arrays"],
    "two pointers": ["arrays", "sorting"],
    "binary search": ["arrays", "sorting"],
    "sliding window": ["two pointers"],
    "prefix sums": ["arrays"],
    "binary search on answer": ["binary search"],
    "stacks": ["arrays"],
    "monotonic stack": ["stacks"],
    "recursion": ["arrays"],
    "backtracking": ["recursion"],
    "trees": ["recursion"],
    "heaps": ["trees", "sorting"],
    "greedy": ["sorting"],
    "intervals": ["sorting", "greedy"],
    "dp 1d": ["recursion"],
    "dp 2d": ["dp 1d"],
    "dp on subsets": ["dp 1d", "backtracking"],
    "graphs": ["hashing", "recursion"],
    "bfs and dfs": ["graphs"],
    "topological order": ["bfs and dfs"],
    "union find": ["graphs"],
    "shortest paths": ["bfs and dfs", "heaps"],
    "minimum spanning tree": ["union find", "greedy"],
    "dp on dags": ["topological order", "dp 1d"],
}

NAMES = sorted(NEEDS)


def in_order(order):
    """How many patterns appear before something they depend on?

    One premature attempt is one problem you will meet while missing a piece,
    and it is the specific kind of hard that teaches nothing.
    """
    place = {name: i for i, name in enumerate(order)}
    early = 0
    for name, needs in NEEDS.items():
        for need in needs:
            if place[need] > place[name]:
                early += 1
    return early


def kahn_order():
    """A safe order: never a pattern before everything it assumes."""
    waiting = {name: len(NEEDS[name]) for name in NAMES}
    unlocks = {name: [] for name in NAMES}
    for name, needs in NEEDS.items():
        for need in needs:
            unlocks[need].append(name)
    ready = deque(sorted(name for name in NAMES if waiting[name] == 0))
    order = []
    while ready:
        at = ready.popleft()
        order.append(at)
        for nxt in sorted(unlocks[at]):
            waiting[nxt] -= 1
            if waiting[nxt] == 0:
                ready.append(nxt)
    return order


def depth_of(name, memo):
    """How many patterns deep is this one? The longest chain ending here."""
    if name in memo:
        return memo[name]
    best = 0
    for need in NEEDS[name]:
        d = depth_of(need, memo) + 1
        if d > best:
            best = d
    memo[name] = best
    return best


def frontier_after(order, k):
    """After the first k of this order: how many are ready, how many blocked.

    Ready means every prerequisite is done. Blocked means at least one is
    not, and no amount of effort on that pattern is going to go well yet.
    """
    done = set(order[:k])
    ready = blocked = 0
    for name in NAMES:
        if name in done:
            continue
        if all(need in done for need in NEEDS[name]):
            ready += 1
        else:
            blocked += 1
    return ready, blocked


safe = kahn_order()
memo = {}
depths = {name: depth_of(name, memo) for name in NAMES}
entry = [name for name in NAMES if not NEEDS[name]]

print("%d patterns, %d dependency edges" % (
    len(NAMES), sum(len(v) for v in NEEDS.values())))
print()
print("%-26s %s" % ("pattern", "depth (longest chain ending here)"))
for name in sorted(NAMES, key=lambda n: (depths[n], n)):
    print("%-26s %d" % (name, depths[name]))

# The same linear congruential generator in every language, so the random
# orders below are the same orders whichever translation is run.
seed = 32032


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


trials = 3000
total_early = 0
worst_early = 0
clean = 0
for _ in range(trials):
    order = list(NAMES)
    for i in range(len(order) - 1, 0, -1):
        j = rand(i + 1)
        order[i], order[j] = order[j], order[i]
    early = in_order(order)
    total_early += early
    if early > worst_early:
        worst_early = early
    if early == 0:
        clean += 1

alphabetical = in_order(NAMES)
backwards = in_order(list(reversed(safe)))

print()
print("premature attempts -- a pattern met before something it assumes:")
print("  %-40s %6d" % ("a safe order, by dependency", in_order(safe)))
print("  %-40s %6d" % ("alphabetical", alphabetical))
print("  %-40s %6d" % ("the safe order, reversed", backwards))
print("  %-40s %6d" % ("average over %d shuffles" % trials, total_early // trials))
print("  %-40s %6d" % ("worst shuffle seen", worst_early))
print("  %-40s %6d" % ("shuffles that happened to be safe", clean))

print()
print("and where an ordered sheet lets you start:")
print("  %-40s %6d" % ("patterns with no prerequisites", len(entry)))
print("  %-40s %6d" % ("deepest chain in the graph", max(depths.values())))
print()
print("%-8s %-14s %s" % ("done", "ready to start", "still blocked"))
for k in (0, 1, 3, 6, 10, 15, 20, 25):
    ready, blocked = frontier_after(safe, k)
    print("%-8d %-14d %d" % (k, ready, blocked))

print()
print("The first table answers \\"where do I start\\", and the answer is narrow:")
print("%d pattern in %d assumes nothing at all, and everything else sits" % (len(entry), len(NAMES)))
print("downstream of it. There is no version of this graph in which heaps")
print("come before trees, and the deepest chain is %d patterns long." % max(depths.values()))
print()
print("The middle block is the cost of ignoring that. A random order produces")
print("%d premature attempts on average and %d at worst, out of %d edges." % (
    total_early // trials, worst_early, sum(len(v) for v in NEEDS.values())))
print("Only %d of %d shuffles happened to be safe. Alphabetical -- which is" % (clean, trials))
print("roughly what a sheet grouped by topic name gives you -- produces %d." % alphabetical)
print()
print("Each of those is a problem you will meet while missing a piece, and")
print("that is the expensive kind of hard: you cannot tell whether the pattern")
print("beat you or the prerequisite did, so you learn neither. Twenty problems")
print("in dependency order teach more than sixty in arrival order, and this is")
print("the whole reason the sheet is ordered rather than long.")
print()
print("The last table is the honest shape of progress. At the start exactly")
print("one pattern is available and %d are blocked. The blocked column falls" % frontier_after(safe, 0)[1])
print("steadily -- that is the real measure of progress on a sheet, and it is")
print("not the number of problems solved. The ready column does not climb")
print("steadily: it is a frontier, and it rises and falls as chains open and")
print("close. Being on a narrow part of the frontier feels like being stuck")
print("and is not.")
`,
          output: `26 patterns, 34 dependency edges

pattern                    depth (longest chain ending here)
arrays                     0
hashing                    1
prefix sums                1
recursion                  1
sorting                    1
stacks                     1
backtracking               2
binary search              2
dp 1d                      2
graphs                     2
greedy                     2
monotonic stack            2
trees                      2
two pointers               2
bfs and dfs                3
binary search on answer    3
dp 2d                      3
dp on subsets              3
heaps                      3
intervals                  3
sliding window             3
union find                 3
minimum spanning tree      4
shortest paths             4
topological order          4
dp on dags                 5

premature attempts -- a pattern met before something it assumes:
  a safe order, by dependency                   0
  alphabetical                                 14
  the safe order, reversed                     34
  average over 3000 shuffles                   16
  worst shuffle seen                           27
  shuffles that happened to be safe             0

and where an ordered sheet lets you start:
  patterns with no prerequisites                1
  deepest chain in the graph                    5

done     ready to start still blocked
0        1              25
1        5              20
3        3              20
6        8              12
10       9              7
15       7              4
20       5              1
25       1              0

The first table answers "where do I start", and the answer is narrow:
1 pattern in 26 assumes nothing at all, and everything else sits
downstream of it. There is no version of this graph in which heaps
come before trees, and the deepest chain is 5 patterns long.

The middle block is the cost of ignoring that. A random order produces
16 premature attempts on average and 27 at worst, out of 34 edges.
Only 0 of 3000 shuffles happened to be safe. Alphabetical -- which is
roughly what a sheet grouped by topic name gives you -- produces 14.

Each of those is a problem you will meet while missing a piece, and
that is the expensive kind of hard: you cannot tell whether the pattern
beat you or the prerequisite did, so you learn neither. Twenty problems
in dependency order teach more than sixty in arrival order, and this is
the whole reason the sheet is ordered rather than long.

The last table is the honest shape of progress. At the start exactly
one pattern is available and 25 are blocked. The blocked column falls
steadily -- that is the real measure of progress on a sheet, and it is
not the number of problems solved. The ready column does not climb
steadily: it is a frontier, and it rises and falls as chains open and
close. Being on a narrow part of the frontier feels like being stuck
and is not.`,
          explanation:
            "This track's prerequisites written out and measured. The middle block is the cost of ignoring the order; the last one is what progress actually looks like.",
          alternates: [
            {
              lang: "javascript",
              code: `// Why the order of a sheet matters more than its length.
//
// A pattern list is not a list. It is a dependency graph: sliding windows
// assume you are comfortable with two pointers, monotonic stacks assume
// stacks, Dijkstra assumes both graphs and heaps. Work a sheet in the wrong
// order and a problem is not hard because the pattern is hard -- it is hard
// because you are meeting two new things at once and cannot tell which one is
// defeating you.
//
// The graph below is this track's own dependency structure, written out. The
// measurements are about the *order*, not about the problems: how many
// premature attempts each ordering produces, where the entry points are, and
// how deep the deepest chain goes.

// pattern -> the patterns it assumes you already have
const NEEDS = new Map([
  ["arrays", []],
  ["hashing", ["arrays"]],
  ["sorting", ["arrays"]],
  ["two pointers", ["arrays", "sorting"]],
  ["binary search", ["arrays", "sorting"]],
  ["sliding window", ["two pointers"]],
  ["prefix sums", ["arrays"]],
  ["binary search on answer", ["binary search"]],
  ["stacks", ["arrays"]],
  ["monotonic stack", ["stacks"]],
  ["recursion", ["arrays"]],
  ["backtracking", ["recursion"]],
  ["trees", ["recursion"]],
  ["heaps", ["trees", "sorting"]],
  ["greedy", ["sorting"]],
  ["intervals", ["sorting", "greedy"]],
  ["dp 1d", ["recursion"]],
  ["dp 2d", ["dp 1d"]],
  ["dp on subsets", ["dp 1d", "backtracking"]],
  ["graphs", ["hashing", "recursion"]],
  ["bfs and dfs", ["graphs"]],
  ["topological order", ["bfs and dfs"]],
  ["union find", ["graphs"]],
  ["shortest paths", ["bfs and dfs", "heaps"]],
  ["minimum spanning tree", ["union find", "greedy"]],
  ["dp on dags", ["topological order", "dp 1d"]],
]);

const NAMES = [...NEEDS.keys()].sort();

// How many patterns appear before something they depend on?
//
// One premature attempt is one problem you will meet while missing a piece,
// and it is the specific kind of hard that teaches nothing.
function inOrder(order) {
  const place = new Map(order.map((name, i) => [name, i]));
  let early = 0;
  for (const name of NAMES) {
    for (const need of NEEDS.get(name)) {
      if (place.get(need) > place.get(name)) early += 1;
    }
  }
  return early;
}

// A safe order: never a pattern before everything it assumes.
function kahnOrder() {
  const waiting = new Map(NAMES.map((name) => [name, NEEDS.get(name).length]));
  const unlocks = new Map(NAMES.map((name) => [name, []]));
  for (const name of NAMES) {
    for (const need of NEEDS.get(name)) unlocks.get(need).push(name);
  }
  const ready = NAMES.filter((name) => waiting.get(name) === 0).sort();
  const order = [];
  let head = 0;
  while (head < ready.length) {
    const at = ready[head];
    head += 1;
    order.push(at);
    for (const nxt of [...unlocks.get(at)].sort()) {
      waiting.set(nxt, waiting.get(nxt) - 1);
      if (waiting.get(nxt) === 0) ready.push(nxt);
    }
  }
  return order;
}

// How many patterns deep is this one? The longest chain ending here.
function depthOf(name, memo) {
  if (memo.has(name)) return memo.get(name);
  let best = 0;
  for (const need of NEEDS.get(name)) {
    const d = depthOf(need, memo) + 1;
    if (d > best) best = d;
  }
  memo.set(name, best);
  return best;
}

// After the first k of this order: how many are ready, how many blocked.
//
// Ready means every prerequisite is done. Blocked means at least one is
// not, and no amount of effort on that pattern is going to go well yet.
function frontierAfter(order, k) {
  const done = new Set(order.slice(0, k));
  let ready = 0;
  let blocked = 0;
  for (const name of NAMES) {
    if (done.has(name)) continue;
    if (NEEDS.get(name).every((need) => done.has(need))) ready += 1;
    else blocked += 1;
  }
  return [ready, blocked];
}

const safe = kahnOrder();
const memo = new Map();
const depths = new Map(NAMES.map((name) => [name, depthOf(name, memo)]));
const entry = NAMES.filter((name) => NEEDS.get(name).length === 0);
const edgeCount = NAMES.reduce((sum, name) => sum + NEEDS.get(name).length, 0);

console.log(\`\${NAMES.length} patterns, \${edgeCount} dependency edges\`);
console.log();
console.log("pattern".padEnd(26) + " " + "depth (longest chain ending here)");
const byDepth = [...NAMES].sort((a, b) => {
  if (depths.get(a) !== depths.get(b)) return depths.get(a) - depths.get(b);
  return a < b ? -1 : 1;
});
for (const name of byDepth) {
  console.log(name.padEnd(26) + " " + depths.get(name));
}

// The same linear congruential generator in every language, so the random
// orders below are the same orders whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 32032n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let totalEarly = 0;
let worstEarly = 0;
let clean = 0;
for (let t = 0; t < trials; t += 1) {
  const order = [...NAMES];
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = rand(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  const early = inOrder(order);
  totalEarly += early;
  if (early > worstEarly) worstEarly = early;
  if (early === 0) clean += 1;
}

const alphabetical = inOrder(NAMES);
const backwards = inOrder([...safe].reverse());

const row = (text, value) => "  " + text.padEnd(40) + " " + String(value).padStart(6);

console.log();
console.log("premature attempts -- a pattern met before something it assumes:");
console.log(row("a safe order, by dependency", inOrder(safe)));
console.log(row("alphabetical", alphabetical));
console.log(row("the safe order, reversed", backwards));
console.log(row(\`average over \${trials} shuffles\`, Math.floor(totalEarly / trials)));
console.log(row("worst shuffle seen", worstEarly));
console.log(row("shuffles that happened to be safe", clean));

console.log();
console.log("and where an ordered sheet lets you start:");
console.log(row("patterns with no prerequisites", entry.length));
console.log(row("deepest chain in the graph", Math.max(...depths.values())));

console.log();
console.log("done".padEnd(8) + " " + "ready to start".padEnd(14) + " " + "still blocked");
for (const k of [0, 1, 3, 6, 10, 15, 20, 25]) {
  const [ready, blocked] = frontierAfter(safe, k);
  console.log(String(k).padEnd(8) + " " + String(ready).padEnd(14) + " " + blocked);
}

console.log();
console.log('The first table answers "where do I start", and the answer is narrow:');
console.log(\`\${entry.length} pattern in \${NAMES.length} assumes nothing at all, and everything else sits\`);
console.log("downstream of it. There is no version of this graph in which heaps");
console.log(\`come before trees, and the deepest chain is \${Math.max(...depths.values())} patterns long.\`);
console.log();
console.log("The middle block is the cost of ignoring that. A random order produces");
console.log(\`\${Math.floor(totalEarly / trials)} premature attempts on average and \${worstEarly} at worst, out of \${edgeCount} edges.\`);
console.log(\`Only \${clean} of \${trials} shuffles happened to be safe. Alphabetical -- which is\`);
console.log(\`roughly what a sheet grouped by topic name gives you -- produces \${alphabetical}.\`);
console.log();
console.log("Each of those is a problem you will meet while missing a piece, and");
console.log("that is the expensive kind of hard: you cannot tell whether the pattern");
console.log("beat you or the prerequisite did, so you learn neither. Twenty problems");
console.log("in dependency order teach more than sixty in arrival order, and this is");
console.log("the whole reason the sheet is ordered rather than long.");
console.log();
console.log("The last table is the honest shape of progress. At the start exactly");
console.log(\`one pattern is available and \${frontierAfter(safe, 0)[1]} are blocked. The blocked column falls\`);
console.log("steadily -- that is the real measure of progress on a sheet, and it is");
console.log("not the number of problems solved. The ready column does not climb");
console.log("steadily: it is a frontier, and it rises and falls as chains open and");
console.log("close. Being on a narrow part of the frontier feels like being stuck");
console.log("and is not.");
`,
            },
            {
              lang: "typescript",
              code: `// Why the order of a sheet matters more than its length.
//
// A pattern list is not a list. It is a dependency graph: sliding windows
// assume you are comfortable with two pointers, monotonic stacks assume
// stacks, Dijkstra assumes both graphs and heaps. Work a sheet in the wrong
// order and a problem is not hard because the pattern is hard -- it is hard
// because you are meeting two new things at once and cannot tell which one is
// defeating you.
//
// The graph below is this track's own dependency structure, written out. The
// measurements are about the *order*, not about the problems: how many
// premature attempts each ordering produces, where the entry points are, and
// how deep the deepest chain goes.

// pattern -> the patterns it assumes you already have
const NEEDS = new Map<string, string[]>([
  ["arrays", []],
  ["hashing", ["arrays"]],
  ["sorting", ["arrays"]],
  ["two pointers", ["arrays", "sorting"]],
  ["binary search", ["arrays", "sorting"]],
  ["sliding window", ["two pointers"]],
  ["prefix sums", ["arrays"]],
  ["binary search on answer", ["binary search"]],
  ["stacks", ["arrays"]],
  ["monotonic stack", ["stacks"]],
  ["recursion", ["arrays"]],
  ["backtracking", ["recursion"]],
  ["trees", ["recursion"]],
  ["heaps", ["trees", "sorting"]],
  ["greedy", ["sorting"]],
  ["intervals", ["sorting", "greedy"]],
  ["dp 1d", ["recursion"]],
  ["dp 2d", ["dp 1d"]],
  ["dp on subsets", ["dp 1d", "backtracking"]],
  ["graphs", ["hashing", "recursion"]],
  ["bfs and dfs", ["graphs"]],
  ["topological order", ["bfs and dfs"]],
  ["union find", ["graphs"]],
  ["shortest paths", ["bfs and dfs", "heaps"]],
  ["minimum spanning tree", ["union find", "greedy"]],
  ["dp on dags", ["topological order", "dp 1d"]],
]);

const NAMES = [...NEEDS.keys()].sort();

// How many patterns appear before something they depend on?
//
// One premature attempt is one problem you will meet while missing a piece,
// and it is the specific kind of hard that teaches nothing.
function inOrder(order: string[]): number {
  const place = new Map<string, number>(order.map((name, i) => [name, i]));
  let early = 0;
  for (const name of NAMES) {
    for (const need of NEEDS.get(name) as string[]) {
      if ((place.get(need) as number) > (place.get(name) as number)) early += 1;
    }
  }
  return early;
}

// A safe order: never a pattern before everything it assumes.
function kahnOrder(): string[] {
  const waiting = new Map<string, number>(NAMES.map((name) => [name, (NEEDS.get(name) as string[]).length]));
  const unlocks = new Map<string, string[]>(NAMES.map((name) => [name, [] as string[]]));
  for (const name of NAMES) {
    for (const need of NEEDS.get(name) as string[]) (unlocks.get(need) as string[]).push(name);
  }
  const ready: string[] = NAMES.filter((name) => waiting.get(name) === 0).sort();
  const order: string[] = [];
  let head = 0;
  while (head < ready.length) {
    const at = ready[head];
    head += 1;
    order.push(at);
    for (const nxt of [...(unlocks.get(at) as string[])].sort()) {
      waiting.set(nxt, (waiting.get(nxt) as number) - 1);
      if (waiting.get(nxt) === 0) ready.push(nxt);
    }
  }
  return order;
}

// How many patterns deep is this one? The longest chain ending here.
function depthOf(name: string, memo: Map<string, number>): number {
  if (memo.has(name)) return memo.get(name) as number;
  let best = 0;
  for (const need of NEEDS.get(name) as string[]) {
    const d = depthOf(need, memo) + 1;
    if (d > best) best = d;
  }
  memo.set(name, best);
  return best;
}

// After the first k of this order: how many are ready, how many blocked.
//
// Ready means every prerequisite is done. Blocked means at least one is
// not, and no amount of effort on that pattern is going to go well yet.
function frontierAfter(order: string[], k: number): [number, number] {
  const done = new Set(order.slice(0, k));
  let ready = 0;
  let blocked = 0;
  for (const name of NAMES) {
    if (done.has(name)) continue;
    if ((NEEDS.get(name) as string[]).every((need) => done.has(need))) ready += 1;
    else blocked += 1;
  }
  return [ready, blocked];
}

const safe = kahnOrder();
const memo = new Map<string, number>();
const depths = new Map<string, number>(NAMES.map((name) => [name, depthOf(name, memo)]));
const entry = NAMES.filter((name) => (NEEDS.get(name) as string[]).length === 0);
const edgeCount = NAMES.reduce((sum, name) => sum + (NEEDS.get(name) as string[]).length, 0);

console.log(\`\${NAMES.length} patterns, \${edgeCount} dependency edges\`);
console.log();
console.log("pattern".padEnd(26) + " " + "depth (longest chain ending here)");
const byDepth = [...NAMES].sort((a, b) => {
  if (depths.get(a) !== depths.get(b)) return (depths.get(a) as number) - (depths.get(b) as number);
  return a < b ? -1 : 1;
});
for (const name of byDepth) {
  console.log(name.padEnd(26) + " " + depths.get(name));
}

// The same linear congruential generator in every language, so the random
// orders below are the same orders whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 32032n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let totalEarly = 0;
let worstEarly = 0;
let clean = 0;
for (let t = 0; t < trials; t += 1) {
  const order = [...NAMES];
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = rand(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  const early = inOrder(order);
  totalEarly += early;
  if (early > worstEarly) worstEarly = early;
  if (early === 0) clean += 1;
}

const alphabetical = inOrder(NAMES);
const backwards = inOrder([...safe].reverse());

const row = (text: string, value: number): string => "  " + text.padEnd(40) + " " + String(value).padStart(6);

console.log();
console.log("premature attempts -- a pattern met before something it assumes:");
console.log(row("a safe order, by dependency", inOrder(safe)));
console.log(row("alphabetical", alphabetical));
console.log(row("the safe order, reversed", backwards));
console.log(row(\`average over \${trials} shuffles\`, Math.floor(totalEarly / trials)));
console.log(row("worst shuffle seen", worstEarly));
console.log(row("shuffles that happened to be safe", clean));

console.log();
console.log("and where an ordered sheet lets you start:");
console.log(row("patterns with no prerequisites", entry.length));
console.log(row("deepest chain in the graph", Math.max(...depths.values())));

console.log();
console.log("done".padEnd(8) + " " + "ready to start".padEnd(14) + " " + "still blocked");
for (const k of [0, 1, 3, 6, 10, 15, 20, 25]) {
  const [ready, blocked] = frontierAfter(safe, k);
  console.log(String(k).padEnd(8) + " " + String(ready).padEnd(14) + " " + blocked);
}

console.log();
console.log('The first table answers "where do I start", and the answer is narrow:');
console.log(\`\${entry.length} pattern in \${NAMES.length} assumes nothing at all, and everything else sits\`);
console.log("downstream of it. There is no version of this graph in which heaps");
console.log(\`come before trees, and the deepest chain is \${Math.max(...depths.values())} patterns long.\`);
console.log();
console.log("The middle block is the cost of ignoring that. A random order produces");
console.log(\`\${Math.floor(totalEarly / trials)} premature attempts on average and \${worstEarly} at worst, out of \${edgeCount} edges.\`);
console.log(\`Only \${clean} of \${trials} shuffles happened to be safe. Alphabetical -- which is\`);
console.log(\`roughly what a sheet grouped by topic name gives you -- produces \${alphabetical}.\`);
console.log();
console.log("Each of those is a problem you will meet while missing a piece, and");
console.log("that is the expensive kind of hard: you cannot tell whether the pattern");
console.log("beat you or the prerequisite did, so you learn neither. Twenty problems");
console.log("in dependency order teach more than sixty in arrival order, and this is");
console.log("the whole reason the sheet is ordered rather than long.");
console.log();
console.log("The last table is the honest shape of progress. At the start exactly");
console.log(\`one pattern is available and \${frontierAfter(safe, 0)[1]} are blocked. The blocked column falls\`);
console.log("steadily -- that is the real measure of progress on a sheet, and it is");
console.log("not the number of problems solved. The ready column does not climb");
console.log("steadily: it is a frontier, and it rises and falls as chains open and");
console.log("close. Being on a narrow part of the frontier feels like being stuck");
console.log("and is not.");
`,
            },
            {
              lang: "java",
              code: `// Why the order of a sheet matters more than its length.
//
// A pattern list is not a list. It is a dependency graph: sliding windows
// assume you are comfortable with two pointers, monotonic stacks assume
// stacks, Dijkstra assumes both graphs and heaps. Work a sheet in the wrong
// order and a problem is not hard because the pattern is hard -- it is hard
// because you are meeting two new things at once and cannot tell which one is
// defeating you.
//
// The graph below is this track's own dependency structure, written out. The
// measurements are about the *order*, not about the problems: how many
// premature attempts each ordering produces, where the entry points are, and
// how deep the deepest chain goes.
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class Main {
    /** pattern -> the patterns it assumes you already have */
    static final Map<String, List<String>> NEEDS = new LinkedHashMap<>();

    static void need(String name, String... needs) {
        NEEDS.put(name, List.of(needs));
    }

    static {
        need("arrays");
        need("hashing", "arrays");
        need("sorting", "arrays");
        need("two pointers", "arrays", "sorting");
        need("binary search", "arrays", "sorting");
        need("sliding window", "two pointers");
        need("prefix sums", "arrays");
        need("binary search on answer", "binary search");
        need("stacks", "arrays");
        need("monotonic stack", "stacks");
        need("recursion", "arrays");
        need("backtracking", "recursion");
        need("trees", "recursion");
        need("heaps", "trees", "sorting");
        need("greedy", "sorting");
        need("intervals", "sorting", "greedy");
        need("dp 1d", "recursion");
        need("dp 2d", "dp 1d");
        need("dp on subsets", "dp 1d", "backtracking");
        need("graphs", "hashing", "recursion");
        need("bfs and dfs", "graphs");
        need("topological order", "bfs and dfs");
        need("union find", "graphs");
        need("shortest paths", "bfs and dfs", "heaps");
        need("minimum spanning tree", "union find", "greedy");
        need("dp on dags", "topological order", "dp 1d");
    }

    static final List<String> NAMES = new ArrayList<>(NEEDS.keySet());

    static {
        Collections.sort(NAMES);
    }

    /**
     * How many patterns appear before something they depend on?
     *
     * <p>One premature attempt is one problem you will meet while missing a
     * piece, and it is the specific kind of hard that teaches nothing.
     */
    static int inOrder(List<String> order) {
        Map<String, Integer> place = new HashMap<>();
        for (int i = 0; i < order.size(); i++) place.put(order.get(i), i);
        int early = 0;
        for (String name : NAMES)
            for (String need : NEEDS.get(name))
                if (place.get(need) > place.get(name)) early++;
        return early;
    }

    /** A safe order: never a pattern before everything it assumes. */
    static List<String> kahnOrder() {
        Map<String, Integer> waiting = new HashMap<>();
        Map<String, List<String>> unlocks = new HashMap<>();
        for (String name : NAMES) {
            waiting.put(name, NEEDS.get(name).size());
            unlocks.put(name, new ArrayList<>());
        }
        for (String name : NAMES)
            for (String have : NEEDS.get(name)) unlocks.get(have).add(name);
        List<String> ready = new ArrayList<>();
        for (String name : NAMES) if (waiting.get(name) == 0) ready.add(name);
        Collections.sort(ready);
        List<String> order = new ArrayList<>();
        int head = 0;
        while (head < ready.size()) {
            String at = ready.get(head++);
            order.add(at);
            List<String> next = new ArrayList<>(unlocks.get(at));
            Collections.sort(next);
            for (String nxt : next) {
                waiting.put(nxt, waiting.get(nxt) - 1);
                if (waiting.get(nxt) == 0) ready.add(nxt);
            }
        }
        return order;
    }

    /** How many patterns deep is this one? The longest chain ending here. */
    static int depthOf(String name, Map<String, Integer> memo) {
        if (memo.containsKey(name)) return memo.get(name);
        int best = 0;
        for (String have : NEEDS.get(name)) {
            int d = depthOf(have, memo) + 1;
            if (d > best) best = d;
        }
        memo.put(name, best);
        return best;
    }

    /**
     * After the first k of this order: how many are ready, how many blocked.
     *
     * <p>Ready means every prerequisite is done. Blocked means at least one is
     * not, and no amount of effort on that pattern is going to go well yet.
     */
    static int[] frontierAfter(List<String> order, int k) {
        Set<String> done = new HashSet<>(order.subList(0, k));
        int ready = 0, blocked = 0;
        for (String name : NAMES) {
            if (done.contains(name)) continue;
            boolean all = true;
            for (String have : NEEDS.get(name)) if (!done.contains(have)) all = false;
            if (all) ready++;
            else blocked++;
        }
        return new int[] {ready, blocked};
    }

    // The same linear congruential generator in every language, so the random
    // orders below are the same orders whichever translation is run.
    static long seed = 32032L;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    static String row(String text, int value) {
        return String.format("  %-40s %6d", text, value);
    }

    public static void main(String[] args) {
        List<String> safe = kahnOrder();
        Map<String, Integer> memo = new HashMap<>();
        Map<String, Integer> depths = new HashMap<>();
        for (String name : NAMES) depths.put(name, depthOf(name, memo));
        List<String> entry = new ArrayList<>();
        for (String name : NAMES) if (NEEDS.get(name).isEmpty()) entry.add(name);
        int edgeCount = 0;
        for (String name : NAMES) edgeCount += NEEDS.get(name).size();
        int deepest = 0;
        for (String name : NAMES) deepest = Math.max(deepest, depths.get(name));

        System.out.println(NAMES.size() + " patterns, " + edgeCount + " dependency edges");
        System.out.println();
        System.out.printf("%-26s %s%n", "pattern", "depth (longest chain ending here)");
        List<String> byDepth = new ArrayList<>(NAMES);
        byDepth.sort((a, b) -> {
            if (!depths.get(a).equals(depths.get(b))) return depths.get(a) - depths.get(b);
            return a.compareTo(b);
        });
        for (String name : byDepth) System.out.printf("%-26s %d%n", name, depths.get(name));

        int trials = 3000;
        long totalEarly = 0;
        int worstEarly = 0, clean = 0;
        for (int t = 0; t < trials; t++) {
            List<String> order = new ArrayList<>(NAMES);
            for (int i = order.size() - 1; i > 0; i--) {
                int j = rand(i + 1);
                Collections.swap(order, i, j);
            }
            int early = inOrder(order);
            totalEarly += early;
            if (early > worstEarly) worstEarly = early;
            if (early == 0) clean++;
        }

        int alphabetical = inOrder(NAMES);
        List<String> reversed = new ArrayList<>(safe);
        Collections.reverse(reversed);
        int backwards = inOrder(reversed);
        int average = (int) (totalEarly / trials);

        System.out.println();
        System.out.println("premature attempts -- a pattern met before something it assumes:");
        System.out.println(row("a safe order, by dependency", inOrder(safe)));
        System.out.println(row("alphabetical", alphabetical));
        System.out.println(row("the safe order, reversed", backwards));
        System.out.println(row("average over " + trials + " shuffles", average));
        System.out.println(row("worst shuffle seen", worstEarly));
        System.out.println(row("shuffles that happened to be safe", clean));

        System.out.println();
        System.out.println("and where an ordered sheet lets you start:");
        System.out.println(row("patterns with no prerequisites", entry.size()));
        System.out.println(row("deepest chain in the graph", deepest));

        System.out.println();
        System.out.printf("%-8s %-14s %s%n", "done", "ready to start", "still blocked");
        for (int k : new int[] {0, 1, 3, 6, 10, 15, 20, 25}) {
            int[] f = frontierAfter(safe, k);
            System.out.printf("%-8d %-14d %d%n", k, f[0], f[1]);
        }

        System.out.println();
        System.out.println("The first table answers \\"where do I start\\", and the answer is narrow:");
        System.out.println(entry.size() + " pattern in " + NAMES.size()
            + " assumes nothing at all, and everything else sits");
        System.out.println("downstream of it. There is no version of this graph in which heaps");
        System.out.println("come before trees, and the deepest chain is " + deepest
            + " patterns long.");
        System.out.println();
        System.out.println("The middle block is the cost of ignoring that. A random order produces");
        System.out.println(average + " premature attempts on average and " + worstEarly
            + " at worst, out of " + edgeCount + " edges.");
        System.out.println("Only " + clean + " of " + trials
            + " shuffles happened to be safe. Alphabetical -- which is");
        System.out.println("roughly what a sheet grouped by topic name gives you -- produces "
            + alphabetical + ".");
        System.out.println();
        System.out.println("Each of those is a problem you will meet while missing a piece, and");
        System.out.println("that is the expensive kind of hard: you cannot tell whether the pattern");
        System.out.println("beat you or the prerequisite did, so you learn neither. Twenty problems");
        System.out.println("in dependency order teach more than sixty in arrival order, and this is");
        System.out.println("the whole reason the sheet is ordered rather than long.");
        System.out.println();
        System.out.println("The last table is the honest shape of progress. At the start exactly");
        System.out.println("one pattern is available and " + frontierAfter(safe, 0)[1]
            + " are blocked. The blocked column falls");
        System.out.println("steadily -- that is the real measure of progress on a sheet, and it is");
        System.out.println("not the number of problems solved. The ready column does not climb");
        System.out.println("steadily: it is a frontier, and it rises and falls as chains open and");
        System.out.println("close. Being on a narrow part of the frontier feels like being stuck");
        System.out.println("and is not.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Why the order of a sheet matters more than its length.
//
// A pattern list is not a list. It is a dependency graph: sliding windows
// assume you are comfortable with two pointers, monotonic stacks assume
// stacks, Dijkstra assumes both graphs and heaps. Work a sheet in the wrong
// order and a problem is not hard because the pattern is hard -- it is hard
// because you are meeting two new things at once and cannot tell which one is
// defeating you.
//
// The graph below is this track's own dependency structure, written out. The
// measurements are about the *order*, not about the problems: how many
// premature attempts each ordering produces, where the entry points are, and
// how deep the deepest chain goes.
#include <algorithm>
#include <iomanip>
#include <iostream>
#include <map>
#include <set>
#include <string>
#include <vector>

// pattern -> the patterns it assumes you already have
const std::map<std::string, std::vector<std::string>> NEEDS = {
    {"arrays", {}},
    {"hashing", {"arrays"}},
    {"sorting", {"arrays"}},
    {"two pointers", {"arrays", "sorting"}},
    {"binary search", {"arrays", "sorting"}},
    {"sliding window", {"two pointers"}},
    {"prefix sums", {"arrays"}},
    {"binary search on answer", {"binary search"}},
    {"stacks", {"arrays"}},
    {"monotonic stack", {"stacks"}},
    {"recursion", {"arrays"}},
    {"backtracking", {"recursion"}},
    {"trees", {"recursion"}},
    {"heaps", {"trees", "sorting"}},
    {"greedy", {"sorting"}},
    {"intervals", {"sorting", "greedy"}},
    {"dp 1d", {"recursion"}},
    {"dp 2d", {"dp 1d"}},
    {"dp on subsets", {"dp 1d", "backtracking"}},
    {"graphs", {"hashing", "recursion"}},
    {"bfs and dfs", {"graphs"}},
    {"topological order", {"bfs and dfs"}},
    {"union find", {"graphs"}},
    {"shortest paths", {"bfs and dfs", "heaps"}},
    {"minimum spanning tree", {"union find", "greedy"}},
    {"dp on dags", {"topological order", "dp 1d"}},
};

std::vector<std::string> all_names() {
    std::vector<std::string> names;
    for (const auto& entry : NEEDS) names.push_back(entry.first);
    std::sort(names.begin(), names.end());
    return names;
}

const std::vector<std::string> NAMES = all_names();

// How many patterns appear before something they depend on?
//
// One premature attempt is one problem you will meet while missing a piece,
// and it is the specific kind of hard that teaches nothing.
int in_order(const std::vector<std::string>& order) {
    std::map<std::string, int> place;
    for (size_t i = 0; i < order.size(); i++) place[order[i]] = static_cast<int>(i);
    int early = 0;
    for (const std::string& name : NAMES)
        for (const std::string& need : NEEDS.at(name))
            if (place[need] > place[name]) early++;
    return early;
}

// A safe order: never a pattern before everything it assumes.
std::vector<std::string> kahn_order() {
    std::map<std::string, int> waiting;
    std::map<std::string, std::vector<std::string>> unlocks;
    for (const std::string& name : NAMES) {
        waiting[name] = static_cast<int>(NEEDS.at(name).size());
        unlocks[name] = {};
    }
    for (const std::string& name : NAMES)
        for (const std::string& have : NEEDS.at(name)) unlocks[have].push_back(name);
    std::vector<std::string> ready;
    for (const std::string& name : NAMES)
        if (waiting[name] == 0) ready.push_back(name);
    std::sort(ready.begin(), ready.end());
    std::vector<std::string> order;
    size_t head = 0;
    while (head < ready.size()) {
        std::string at = ready[head++];
        order.push_back(at);
        std::vector<std::string> next = unlocks[at];
        std::sort(next.begin(), next.end());
        for (const std::string& nxt : next) {
            if (--waiting[nxt] == 0) ready.push_back(nxt);
        }
    }
    return order;
}

// How many patterns deep is this one? The longest chain ending here.
int depth_of(const std::string& name, std::map<std::string, int>& memo) {
    auto it = memo.find(name);
    if (it != memo.end()) return it->second;
    int best = 0;
    for (const std::string& have : NEEDS.at(name)) {
        int d = depth_of(have, memo) + 1;
        if (d > best) best = d;
    }
    memo[name] = best;
    return best;
}

// After the first k of this order: how many are ready, how many blocked.
//
// Ready means every prerequisite is done. Blocked means at least one is not,
// and no amount of effort on that pattern is going to go well yet.
void frontier_after(const std::vector<std::string>& order, size_t k, int& ready, int& blocked) {
    std::set<std::string> done(order.begin(), order.begin() + k);
    ready = 0;
    blocked = 0;
    for (const std::string& name : NAMES) {
        if (done.count(name)) continue;
        bool all = true;
        for (const std::string& have : NEEDS.at(name))
            if (!done.count(have)) all = false;
        if (all) ready++;
        else blocked++;
    }
}

// The same linear congruential generator in every language, so the random
// orders below are the same orders whichever translation is run.
long long seed = 32032;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

void row(const std::string& text, long long value) {
    std::cout << "  " << std::left << std::setw(40) << text << " " << std::right
              << std::setw(6) << value << "\\n";
}

int main() {
    std::vector<std::string> safe = kahn_order();
    std::map<std::string, int> memo;
    std::map<std::string, int> depths;
    for (const std::string& name : NAMES) depths[name] = depth_of(name, memo);
    std::vector<std::string> entry;
    for (const std::string& name : NAMES)
        if (NEEDS.at(name).empty()) entry.push_back(name);
    int edge_count = 0;
    for (const std::string& name : NAMES) edge_count += static_cast<int>(NEEDS.at(name).size());
    int deepest = 0;
    for (const std::string& name : NAMES) deepest = std::max(deepest, depths[name]);

    std::cout << NAMES.size() << " patterns, " << edge_count << " dependency edges\\n";
    std::cout << "\\n";
    std::cout << std::left << std::setw(26) << "pattern" << " "
              << "depth (longest chain ending here)" << "\\n";
    std::vector<std::string> by_depth = NAMES;
    std::sort(by_depth.begin(), by_depth.end(),
              [&](const std::string& a, const std::string& b) {
                  if (depths[a] != depths[b]) return depths[a] < depths[b];
                  return a < b;
              });
    for (const std::string& name : by_depth)
        std::cout << std::left << std::setw(26) << name << " " << depths[name] << "\\n";

    int trials = 3000;
    long long total_early = 0;
    int worst_early = 0, clean = 0;
    for (int t = 0; t < trials; t++) {
        std::vector<std::string> order = NAMES;
        for (int i = static_cast<int>(order.size()) - 1; i > 0; i--) {
            int j = rand_below(i + 1);
            std::swap(order[i], order[j]);
        }
        int early = in_order(order);
        total_early += early;
        if (early > worst_early) worst_early = early;
        if (early == 0) clean++;
    }

    int alphabetical = in_order(NAMES);
    std::vector<std::string> reversed(safe.rbegin(), safe.rend());
    int backwards = in_order(reversed);
    long long average = total_early / trials;

    std::cout << "\\n";
    std::cout << "premature attempts -- a pattern met before something it assumes:\\n";
    row("a safe order, by dependency", in_order(safe));
    row("alphabetical", alphabetical);
    row("the safe order, reversed", backwards);
    row("average over " + std::to_string(trials) + " shuffles", average);
    row("worst shuffle seen", worst_early);
    row("shuffles that happened to be safe", clean);

    std::cout << "\\n";
    std::cout << "and where an ordered sheet lets you start:\\n";
    row("patterns with no prerequisites", static_cast<long long>(entry.size()));
    row("deepest chain in the graph", deepest);

    std::cout << "\\n";
    std::cout << std::left << std::setw(8) << "done" << " " << std::setw(14) << "ready to start"
              << " " << "still blocked" << "\\n";
    for (int k : {0, 1, 3, 6, 10, 15, 20, 25}) {
        int ready = 0, blocked = 0;
        frontier_after(safe, static_cast<size_t>(k), ready, blocked);
        std::cout << std::left << std::setw(8) << k << " " << std::setw(14) << ready << " "
                  << blocked << "\\n";
    }

    int start_ready = 0, start_blocked = 0;
    frontier_after(safe, 0, start_ready, start_blocked);

    std::cout << "\\n";
    std::cout << "The first table answers \\"where do I start\\", and the answer is narrow:\\n";
    std::cout << entry.size() << " pattern in " << NAMES.size()
              << " assumes nothing at all, and everything else sits\\n";
    std::cout << "downstream of it. There is no version of this graph in which heaps\\n";
    std::cout << "come before trees, and the deepest chain is " << deepest << " patterns long.\\n";
    std::cout << "\\n";
    std::cout << "The middle block is the cost of ignoring that. A random order produces\\n";
    std::cout << average << " premature attempts on average and " << worst_early
              << " at worst, out of " << edge_count << " edges.\\n";
    std::cout << "Only " << clean << " of " << trials
              << " shuffles happened to be safe. Alphabetical -- which is\\n";
    std::cout << "roughly what a sheet grouped by topic name gives you -- produces "
              << alphabetical << ".\\n";
    std::cout << "\\n";
    std::cout << "Each of those is a problem you will meet while missing a piece, and\\n";
    std::cout << "that is the expensive kind of hard: you cannot tell whether the pattern\\n";
    std::cout << "beat you or the prerequisite did, so you learn neither. Twenty problems\\n";
    std::cout << "in dependency order teach more than sixty in arrival order, and this is\\n";
    std::cout << "the whole reason the sheet is ordered rather than long.\\n";
    std::cout << "\\n";
    std::cout << "The last table is the honest shape of progress. At the start exactly\\n";
    std::cout << "one pattern is available and " << start_blocked
              << " are blocked. The blocked column falls\\n";
    std::cout << "steadily -- that is the real measure of progress on a sheet, and it is\\n";
    std::cout << "not the number of problems solved. The ready column does not climb\\n";
    std::cout << "steadily: it is a frontier, and it rises and falls as chains open and\\n";
    std::cout << "close. Being on a narrow part of the frontier feels like being stuck\\n";
    std::cout << "and is not.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Why the order of a sheet matters more than its length.
//
// A pattern list is not a list. It is a dependency graph: sliding windows
// assume you are comfortable with two pointers, monotonic stacks assume
// stacks, Dijkstra assumes both graphs and heaps. Work a sheet in the wrong
// order and a problem is not hard because the pattern is hard -- it is hard
// because you are meeting two new things at once and cannot tell which one is
// defeating you.
//
// The graph below is this track's own dependency structure, written out. The
// measurements are about the *order*, not about the problems: how many
// premature attempts each ordering produces, where the entry points are, and
// how deep the deepest chain goes.
use std::collections::{BTreeMap, BTreeSet};

/// pattern -> the patterns it assumes you already have
fn needs_table() -> BTreeMap<&'static str, Vec<&'static str>> {
    let pairs: Vec<(&str, Vec<&str>)> = vec![
        ("arrays", vec![]),
        ("hashing", vec!["arrays"]),
        ("sorting", vec!["arrays"]),
        ("two pointers", vec!["arrays", "sorting"]),
        ("binary search", vec!["arrays", "sorting"]),
        ("sliding window", vec!["two pointers"]),
        ("prefix sums", vec!["arrays"]),
        ("binary search on answer", vec!["binary search"]),
        ("stacks", vec!["arrays"]),
        ("monotonic stack", vec!["stacks"]),
        ("recursion", vec!["arrays"]),
        ("backtracking", vec!["recursion"]),
        ("trees", vec!["recursion"]),
        ("heaps", vec!["trees", "sorting"]),
        ("greedy", vec!["sorting"]),
        ("intervals", vec!["sorting", "greedy"]),
        ("dp 1d", vec!["recursion"]),
        ("dp 2d", vec!["dp 1d"]),
        ("dp on subsets", vec!["dp 1d", "backtracking"]),
        ("graphs", vec!["hashing", "recursion"]),
        ("bfs and dfs", vec!["graphs"]),
        ("topological order", vec!["bfs and dfs"]),
        ("union find", vec!["graphs"]),
        ("shortest paths", vec!["bfs and dfs", "heaps"]),
        ("minimum spanning tree", vec!["union find", "greedy"]),
        ("dp on dags", vec!["topological order", "dp 1d"]),
    ];
    pairs.into_iter().collect()
}

/// How many patterns appear before something they depend on?
///
/// One premature attempt is one problem you will meet while missing a piece,
/// and it is the specific kind of hard that teaches nothing.
fn in_order(needs: &BTreeMap<&str, Vec<&str>>, names: &[&str], order: &[&str]) -> i64 {
    let place: BTreeMap<&str, usize> =
        order.iter().enumerate().map(|(i, &name)| (name, i)).collect();
    let mut early = 0i64;
    for name in names {
        for need in &needs[name] {
            if place[need] > place[name] {
                early += 1;
            }
        }
    }
    early
}

/// A safe order: never a pattern before everything it assumes.
fn kahn_order<'a>(needs: &BTreeMap<&'a str, Vec<&'a str>>, names: &[&'a str]) -> Vec<&'a str> {
    let mut waiting: BTreeMap<&str, usize> =
        names.iter().map(|&name| (name, needs[name].len())).collect();
    let mut unlocks: BTreeMap<&str, Vec<&str>> =
        names.iter().map(|&name| (name, Vec::new())).collect();
    for name in names {
        for have in &needs[name] {
            unlocks.get_mut(have).unwrap().push(name);
        }
    }
    let mut ready: Vec<&str> = names.iter().copied().filter(|n| waiting[n] == 0).collect();
    ready.sort();
    let mut order: Vec<&str> = Vec::new();
    let mut head = 0;
    while head < ready.len() {
        let at = ready[head];
        head += 1;
        order.push(at);
        let mut next = unlocks[at].clone();
        next.sort();
        for nxt in next {
            let left = waiting.get_mut(nxt).unwrap();
            *left -= 1;
            if *left == 0 {
                ready.push(nxt);
            }
        }
    }
    order
}

/// How many patterns deep is this one? The longest chain ending here.
fn depth_of(
    needs: &BTreeMap<&str, Vec<&str>>,
    name: &str,
    memo: &mut BTreeMap<String, i64>,
) -> i64 {
    if let Some(&d) = memo.get(name) {
        return d;
    }
    let mut best = 0i64;
    for have in &needs[name] {
        let d = depth_of(needs, have, memo) + 1;
        if d > best {
            best = d;
        }
    }
    memo.insert(name.to_string(), best);
    best
}

/// After the first k of this order: how many are ready, how many blocked.
///
/// Ready means every prerequisite is done. Blocked means at least one is not,
/// and no amount of effort on that pattern is going to go well yet.
fn frontier_after(
    needs: &BTreeMap<&str, Vec<&str>>,
    names: &[&str],
    order: &[&str],
    k: usize,
) -> (i64, i64) {
    let done: BTreeSet<&str> = order[..k].iter().copied().collect();
    let (mut ready, mut blocked) = (0i64, 0i64);
    for name in names {
        if done.contains(name) {
            continue;
        }
        if needs[name].iter().all(|have| done.contains(have)) {
            ready += 1;
        } else {
            blocked += 1;
        }
    }
    (ready, blocked)
}

/// The same linear congruential generator in every language, so the random
/// orders below are the same orders whichever translation is run.
struct Rng {
    seed: i64,
}

impl Rng {
    fn next(&mut self, n: i64) -> i64 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        self.seed / 65536 % n
    }
}

fn row(text: &str, value: i64) {
    println!("  {:<40} {:>6}", text, value);
}

fn main() {
    let needs = needs_table();
    let names: Vec<&str> = needs.keys().copied().collect();

    let safe = kahn_order(&needs, &names);
    let mut memo: BTreeMap<String, i64> = BTreeMap::new();
    let depths: BTreeMap<&str, i64> = names
        .iter()
        .map(|&name| (name, depth_of(&needs, name, &mut memo)))
        .collect();
    let entry: Vec<&str> = names.iter().copied().filter(|n| needs[n].is_empty()).collect();
    let edge_count: i64 = names.iter().map(|n| needs[n].len() as i64).sum();
    let deepest = *depths.values().max().unwrap();

    println!("{} patterns, {} dependency edges", names.len(), edge_count);
    println!();
    println!("{:<26} {}", "pattern", "depth (longest chain ending here)");
    let mut by_depth = names.clone();
    by_depth.sort_by(|a, b| (depths[a], *a).cmp(&(depths[b], *b)));
    for name in &by_depth {
        println!("{:<26} {}", name, depths[name]);
    }

    let mut rng = Rng { seed: 32032 };
    let trials = 3000i64;
    let mut total_early = 0i64;
    let (mut worst_early, mut clean) = (0i64, 0i64);
    for _ in 0..trials {
        let mut order = names.clone();
        for i in (1..order.len()).rev() {
            let j = rng.next(i as i64 + 1) as usize;
            order.swap(i, j);
        }
        let early = in_order(&needs, &names, &order);
        total_early += early;
        if early > worst_early {
            worst_early = early;
        }
        if early == 0 {
            clean += 1;
        }
    }

    let alphabetical = in_order(&needs, &names, &names);
    let reversed: Vec<&str> = safe.iter().rev().copied().collect();
    let backwards = in_order(&needs, &names, &reversed);
    let average = total_early / trials;

    println!();
    println!("premature attempts -- a pattern met before something it assumes:");
    row("a safe order, by dependency", in_order(&needs, &names, &safe));
    row("alphabetical", alphabetical);
    row("the safe order, reversed", backwards);
    row(&format!("average over {} shuffles", trials), average);
    row("worst shuffle seen", worst_early);
    row("shuffles that happened to be safe", clean);

    println!();
    println!("and where an ordered sheet lets you start:");
    row("patterns with no prerequisites", entry.len() as i64);
    row("deepest chain in the graph", deepest);

    println!();
    println!("{:<8} {:<14} {}", "done", "ready to start", "still blocked");
    for k in [0usize, 1, 3, 6, 10, 15, 20, 25] {
        let (ready, blocked) = frontier_after(&needs, &names, &safe, k);
        println!("{:<8} {:<14} {}", k, ready, blocked);
    }

    let (_, start_blocked) = frontier_after(&needs, &names, &safe, 0);

    println!();
    println!("The first table answers \\"where do I start\\", and the answer is narrow:");
    println!(
        "{} pattern in {} assumes nothing at all, and everything else sits",
        entry.len(),
        names.len()
    );
    println!("downstream of it. There is no version of this graph in which heaps");
    println!("come before trees, and the deepest chain is {} patterns long.", deepest);
    println!();
    println!("The middle block is the cost of ignoring that. A random order produces");
    println!(
        "{} premature attempts on average and {} at worst, out of {} edges.",
        average, worst_early, edge_count
    );
    println!(
        "Only {} of {} shuffles happened to be safe. Alphabetical -- which is",
        clean, trials
    );
    println!(
        "roughly what a sheet grouped by topic name gives you -- produces {}.",
        alphabetical
    );
    println!();
    println!("Each of those is a problem you will meet while missing a piece, and");
    println!("that is the expensive kind of hard: you cannot tell whether the pattern");
    println!("beat you or the prerequisite did, so you learn neither. Twenty problems");
    println!("in dependency order teach more than sixty in arrival order, and this is");
    println!("the whole reason the sheet is ordered rather than long.");
    println!();
    println!("The last table is the honest shape of progress. At the start exactly");
    println!(
        "one pattern is available and {} are blocked. The blocked column falls",
        start_blocked
    );
    println!("steadily -- that is the real measure of progress on a sheet, and it is");
    println!("not the number of problems solved. The ready column does not climb");
    println!("steadily: it is a frontier, and it rises and falls as chains open and");
    println!("close. Being on a narrow part of the frontier feels like being stuck");
    println!("and is not.");
}
`,
            },
            {
              lang: "go",
              code: `// Why the order of a sheet matters more than its length.
//
// A pattern list is not a list. It is a dependency graph: sliding windows
// assume you are comfortable with two pointers, monotonic stacks assume
// stacks, Dijkstra assumes both graphs and heaps. Work a sheet in the wrong
// order and a problem is not hard because the pattern is hard -- it is hard
// because you are meeting two new things at once and cannot tell which one is
// defeating you.
//
// The graph below is this track's own dependency structure, written out. The
// measurements are about the *order*, not about the problems: how many
// premature attempts each ordering produces, where the entry points are, and
// how deep the deepest chain goes.
package main

import (
	"fmt"
	"sort"
)

// needs maps a pattern to the patterns it assumes you already have.
var needs = map[string][]string{
	"arrays":                  {},
	"hashing":                 {"arrays"},
	"sorting":                 {"arrays"},
	"two pointers":            {"arrays", "sorting"},
	"binary search":           {"arrays", "sorting"},
	"sliding window":          {"two pointers"},
	"prefix sums":             {"arrays"},
	"binary search on answer": {"binary search"},
	"stacks":                  {"arrays"},
	"monotonic stack":         {"stacks"},
	"recursion":               {"arrays"},
	"backtracking":            {"recursion"},
	"trees":                   {"recursion"},
	"heaps":                   {"trees", "sorting"},
	"greedy":                  {"sorting"},
	"intervals":               {"sorting", "greedy"},
	"dp 1d":                   {"recursion"},
	"dp 2d":                   {"dp 1d"},
	"dp on subsets":           {"dp 1d", "backtracking"},
	"graphs":                  {"hashing", "recursion"},
	"bfs and dfs":             {"graphs"},
	"topological order":       {"bfs and dfs"},
	"union find":              {"graphs"},
	"shortest paths":          {"bfs and dfs", "heaps"},
	"minimum spanning tree":   {"union find", "greedy"},
	"dp on dags":              {"topological order", "dp 1d"},
}

func allNames() []string {
	names := make([]string, 0, len(needs))
	for name := range needs {
		names = append(names, name)
	}
	sort.Strings(names)
	return names
}

var names = allNames()

// inOrder counts the patterns that appear before something they depend on.
//
// One premature attempt is one problem you will meet while missing a piece,
// and it is the specific kind of hard that teaches nothing.
func inOrder(order []string) int {
	place := map[string]int{}
	for i, name := range order {
		place[name] = i
	}
	early := 0
	for _, name := range names {
		for _, need := range needs[name] {
			if place[need] > place[name] {
				early++
			}
		}
	}
	return early
}

// kahnOrder gives a safe order: never a pattern before everything it assumes.
func kahnOrder() []string {
	waiting := map[string]int{}
	unlocks := map[string][]string{}
	for _, name := range names {
		waiting[name] = len(needs[name])
		unlocks[name] = nil
	}
	for _, name := range names {
		for _, have := range needs[name] {
			unlocks[have] = append(unlocks[have], name)
		}
	}
	var ready []string
	for _, name := range names {
		if waiting[name] == 0 {
			ready = append(ready, name)
		}
	}
	sort.Strings(ready)
	var order []string
	head := 0
	for head < len(ready) {
		at := ready[head]
		head++
		order = append(order, at)
		next := append([]string{}, unlocks[at]...)
		sort.Strings(next)
		for _, nxt := range next {
			waiting[nxt]--
			if waiting[nxt] == 0 {
				ready = append(ready, nxt)
			}
		}
	}
	return order
}

// depthOf gives the longest chain of prerequisites ending at this pattern.
func depthOf(name string, memo map[string]int) int {
	if d, ok := memo[name]; ok {
		return d
	}
	best := 0
	for _, have := range needs[name] {
		if d := depthOf(have, memo) + 1; d > best {
			best = d
		}
	}
	memo[name] = best
	return best
}

// frontierAfter reports, after the first k of this order, how many patterns
// are ready and how many are blocked.
//
// Ready means every prerequisite is done. Blocked means at least one is not,
// and no amount of effort on that pattern is going to go well yet.
func frontierAfter(order []string, k int) (int, int) {
	done := map[string]bool{}
	for _, name := range order[:k] {
		done[name] = true
	}
	ready, blocked := 0, 0
	for _, name := range names {
		if done[name] {
			continue
		}
		all := true
		for _, have := range needs[name] {
			if !done[have] {
				all = false
			}
		}
		if all {
			ready++
		} else {
			blocked++
		}
	}
	return ready, blocked
}

// The same linear congruential generator in every language, so the random
// orders below are the same orders whichever translation is run.
var seed int64 = 32032

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func row(text string, value int) {
	fmt.Printf("  %-40s %6d\\n", text, value)
}

func main() {
	safe := kahnOrder()
	memo := map[string]int{}
	depths := map[string]int{}
	for _, name := range names {
		depths[name] = depthOf(name, memo)
	}
	var entry []string
	for _, name := range names {
		if len(needs[name]) == 0 {
			entry = append(entry, name)
		}
	}
	edgeCount := 0
	for _, name := range names {
		edgeCount += len(needs[name])
	}
	deepest := 0
	for _, name := range names {
		if depths[name] > deepest {
			deepest = depths[name]
		}
	}

	fmt.Printf("%d patterns, %d dependency edges\\n", len(names), edgeCount)
	fmt.Println()
	fmt.Printf("%-26s %s\\n", "pattern", "depth (longest chain ending here)")
	byDepth := append([]string{}, names...)
	sort.Slice(byDepth, func(i, j int) bool {
		if depths[byDepth[i]] != depths[byDepth[j]] {
			return depths[byDepth[i]] < depths[byDepth[j]]
		}
		return byDepth[i] < byDepth[j]
	})
	for _, name := range byDepth {
		fmt.Printf("%-26s %d\\n", name, depths[name])
	}

	trials := 3000
	totalEarly, worstEarly, clean := 0, 0, 0
	for t := 0; t < trials; t++ {
		order := append([]string{}, names...)
		for i := len(order) - 1; i > 0; i-- {
			j := randBelow(i + 1)
			order[i], order[j] = order[j], order[i]
		}
		early := inOrder(order)
		totalEarly += early
		if early > worstEarly {
			worstEarly = early
		}
		if early == 0 {
			clean++
		}
	}

	alphabetical := inOrder(names)
	reversed := make([]string, len(safe))
	for i, name := range safe {
		reversed[len(safe)-1-i] = name
	}
	backwards := inOrder(reversed)
	average := totalEarly / trials

	fmt.Println()
	fmt.Println("premature attempts -- a pattern met before something it assumes:")
	row("a safe order, by dependency", inOrder(safe))
	row("alphabetical", alphabetical)
	row("the safe order, reversed", backwards)
	row(fmt.Sprintf("average over %d shuffles", trials), average)
	row("worst shuffle seen", worstEarly)
	row("shuffles that happened to be safe", clean)

	fmt.Println()
	fmt.Println("and where an ordered sheet lets you start:")
	row("patterns with no prerequisites", len(entry))
	row("deepest chain in the graph", deepest)

	fmt.Println()
	fmt.Printf("%-8s %-14s %s\\n", "done", "ready to start", "still blocked")
	for _, k := range []int{0, 1, 3, 6, 10, 15, 20, 25} {
		ready, blocked := frontierAfter(safe, k)
		fmt.Printf("%-8d %-14d %d\\n", k, ready, blocked)
	}

	_, startBlocked := frontierAfter(safe, 0)

	fmt.Println()
	fmt.Println("The first table answers \\"where do I start\\", and the answer is narrow:")
	fmt.Printf("%d pattern in %d assumes nothing at all, and everything else sits\\n", len(entry), len(names))
	fmt.Println("downstream of it. There is no version of this graph in which heaps")
	fmt.Printf("come before trees, and the deepest chain is %d patterns long.\\n", deepest)
	fmt.Println()
	fmt.Println("The middle block is the cost of ignoring that. A random order produces")
	fmt.Printf("%d premature attempts on average and %d at worst, out of %d edges.\\n", average, worstEarly, edgeCount)
	fmt.Printf("Only %d of %d shuffles happened to be safe. Alphabetical -- which is\\n", clean, trials)
	fmt.Printf("roughly what a sheet grouped by topic name gives you -- produces %d.\\n", alphabetical)
	fmt.Println()
	fmt.Println("Each of those is a problem you will meet while missing a piece, and")
	fmt.Println("that is the expensive kind of hard: you cannot tell whether the pattern")
	fmt.Println("beat you or the prerequisite did, so you learn neither. Twenty problems")
	fmt.Println("in dependency order teach more than sixty in arrival order, and this is")
	fmt.Println("the whole reason the sheet is ordered rather than long.")
	fmt.Println()
	fmt.Println("The last table is the honest shape of progress. At the start exactly")
	fmt.Printf("one pattern is available and %d are blocked. The blocked column falls\\n", startBlocked)
	fmt.Println("steadily -- that is the real measure of progress on a sheet, and it is")
	fmt.Println("not the number of problems solved. The ready column does not climb")
	fmt.Println("steadily: it is a frontier, and it rises and falls as chains open and")
	fmt.Println("close. Being on a narrow part of the frontier feels like being stuck")
	fmt.Println("and is not.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Choosing a sheet by length",
          body: "A hundred and fifty problems in arrival order is worse than forty in dependency order, because a large fraction of the hundred and fifty will be met while a prerequisite is missing. Length is the easiest thing to compare and the least informative.",
        },
        {
          title: "Grouping by topic name and calling it ordered",
          body: "Alphabetical produced 14 premature attempts against a shuffle's 16. A section called \"Graphs\" placed before one called \"Heaps\" reads tidy and puts Dijkstra before the structure it needs.",
        },
        {
          title: "Skipping ahead to the pattern you are weak at",
          body: "It is the most natural instinct and it is usually the pattern deepest in the graph, which is exactly the one where a missing prerequisite is hardest to notice. If a pattern keeps defeating you, check its prerequisites before doing more of it.",
        },
      ],
    },
    {
      id: "what-progress-looks-like",
      heading: "What progress actually looks like",
      body: [
        "The last table in the example is the honest shape of it. At the start exactly **one** pattern is available and 25 are blocked. That is not a discouraging fact, it is the structure: everything is downstream of arrays, and the deepest chain in the graph is five patterns long.",
        "As you work, the blocked column falls steadily. **That is the measure of progress** \u2014 not the number of problems solved, which is the number every tracker shows you and the least informative one available.",
        "The ready column does something different: it rises and falls. It is a frontier, and frontiers are wide in some places and narrow in others. Being on a narrow part \u2014 one or two patterns available \u2014 feels like being stuck and is not; it means you are in the middle of a chain, which is where the deep patterns live.",
        "This is also why abandoning the order early is expensive in a way that does not show up immediately. Skipping ahead does not block you, it just quietly moves you into the population that meets patterns while missing pieces, and the cost arrives three weeks later as \"I am bad at DP\".",
      ],
    },
    {
      id: "building-or-choosing-one",
      heading: "Building or choosing one",
      body: [
        "If you are choosing a sheet, the test is not its length or its reputation. Open it and ask: **does anything appear before something it assumes?** Two minutes of checking, and it separates the sheets that were sequenced from the sheets that were collected.",
        "If you are building one \u2014 and building one from a track you are already working through is a good use of an evening \u2014 the recipe is short. Write down the patterns. For each one, write what it assumes; you will know, because you have met them. Then topologically sort. If you find a cycle, one of your edges is wrong, because pattern prerequisites genuinely are acyclic.",
        "Then attach problems. Three to six per pattern, and they belong to the pattern rather than to a difficulty tier \u2014 the next lesson is about finishing a pattern before moving on, and the one after that is about the progression *within* it.",
        "Keep it short. Twenty-six patterns at four problems each is around a hundred problems, and that is a complete sheet for interview preparation. The value is entirely in the sequencing; the length is a consequence.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you choose which problems to work through?",
      answer:
        "In dependency order, and I would rather have forty problems sequenced than a hundred and fifty collected. Patterns depend on each other -- sliding windows assume two pointers, Dijkstra assumes graphs and heaps -- so a sheet is really a DAG and the right thing to do with it is a topological sort. I measured what ignoring that costs on a 26-pattern graph with 34 edges: a random order produces 16 premature attempts on average, and not one of 3,000 shuffles was safe by accident. Alphabetical, which is roughly what grouping by topic name gives you, produces 14. Each premature attempt is a problem met while missing a piece, which is the expensive kind of hard because you cannot tell whether the pattern or the prerequisite beat you.",
    },
    {
      question: "How do you know whether you are making progress on a sheet?",
      answer:
        "By how many patterns are still blocked, not by how many problems are solved. Solved count is what every tracker shows and it is the least informative number available -- it goes up whether or not anything opened. Blocked count falls monotonically as prerequisites land, so it measures the thing you care about. The other number worth watching is the frontier, how many patterns you could legitimately start next, and it is worth knowing that it rises and falls rather than climbing. A narrow frontier feels like being stuck and usually means you are midway through a chain, which is where the deep patterns are.",
    },
  ],
  takeaways: [
    "A pattern sheet is a dependency graph, and the right operation on it is a topological sort",
    "A random order produced 16 premature attempts on average, 27 at worst, out of 34 edges",
    "Not one of 3,000 shuffles was safe by luck; alphabetical produced 14",
    "A premature attempt teaches nothing — you cannot tell what beat you",
    "One pattern in 26 assumes nothing; the deepest chain is five patterns long",
    "Progress is the blocked count falling, not the solved count rising",
    "The ready frontier rises and falls; a narrow one is not being stuck",
    "Judge a sheet by whether anything precedes its prerequisites, not by its length",
  ],
};
