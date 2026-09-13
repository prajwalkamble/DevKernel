import type { Lesson } from "@/content/types";

export const modellingLesson: Lesson = {
  id: "dsa-graphs-modelling",
  slug: "modelling-a-problem-as-a-graph",
  moduleSlug: "graphs",
  title: "Modelling a Problem as a Graph",
  summary:
    "The step before any graph algorithm: deciding what a node is, what an edge is, and whether the graph should exist at all. A word ladder built two ways, a map where the node has to carry the keys as well as the position, and a search over a graph that is never materialised \u2014 with the bound that quietly deletes nodes if it is guessed.",
  estimatedMinutes: 45,
  objectives: [
    "Turn a problem with no graph in its statement into one with a node and an edge",
    "Test whether a node carries enough state to determine the legal moves",
    "Weigh two constructions of the same graph against each other by cost",
    "Search an implicit graph, and bound it deliberately rather than by guess",
  ],
  sections: [
    {
      id: "the-graph-nobody-gave-you",
      heading: "The graph nobody gave you",
      body: [
        "Graph algorithms have a reputation for being hard that the algorithms themselves do not deserve. Breadth-first search is about fifteen lines. Depth-first search is fewer. What is hard is the step before either of them: looking at a problem that mentions no nodes and no edges, and deciding that it is a graph, and deciding *which* graph.",
        "Take the word ladder. From a start word, reach a target word by changing one letter at a time, with every intermediate word in a dictionary. There is nothing graph-shaped in that sentence. But say \"a node is a word, and an edge joins two words that differ in exactly one position\", and the question becomes \"how many edges is the shortest route\" \u2014 which is breadth-first search, unchanged, on a graph you have just invented.",
        "That invention is a choice, and it has a price. The example below builds the same graph two ways. Comparing every pair of words is the obvious construction and costs `n(n-1)/2` comparisons. Grouping words into buckets by wildcard pattern \u2014 the bucket for \"h, anything, t\" holds `hit` and `hot` \u2014 costs one insertion per letter position, so `n` times the word length. Both describe the same graph and both give the same answers on all 3,000 random word sets tested.",
        "What is worth noticing is that the clever one is not always cheaper. For three-letter words the crossover is at seven words, and below that the buckets do more work, not less. Over the small random sets in the example, buckets cost 43,275 insertions against 32,917 comparisons. The quadratic model wins at small `n` and loses catastrophically at large: at ten thousand words it is 49,995,000 comparisons against 30,000 insertions.",
        "Two constructions, one graph, and the choice between them is arithmetic rather than taste.",
      ],
      examples: [
        {
          id: "one-graph-two-constructions",
          title: "A word ladder, built two ways and checked against no graph at all",
          lang: "python",
          code: `# The modelling step, which is the part of graph problems that is actually
# hard. The algorithms are short and standard; deciding what a node is and what
# an edge is takes the thinking.
#
# The problem below has no graph in its statement at all: from a start word,
# reach a target word by changing one letter at a time, with every intermediate
# word in a dictionary. There is no picture of a graph anywhere in that, and
# yet the moment you say "a node is a word, an edge joins words one letter
# apart", the answer is a breadth-first search you already know how to write.
#
# The point of this example is the *cost* of that choice. The same problem is
# modelled twice -- once with an edge list built by comparing every pair of
# words, once by generating neighbours on demand from wildcard buckets -- and
# both give the same answers while doing very different amounts of work.


def one_apart(a, b):
    """True when two equal-length words differ in exactly one position."""
    if len(a) != len(b):
        return False
    seen = 0
    for i in range(len(a)):
        if a[i] != b[i]:
            seen += 1
    return seen == 1


def position_of(words, word):
    for i in range(len(words)):
        if words[i] == word:
            return i
    return -1


def bfs(neighbours, start, target):
    """Fewest edges from start to target, or -1 if there is no route."""
    distance = [-1] * len(neighbours)
    distance[start] = 0
    queue = [start]
    head = 0
    while head < len(queue):
        v = queue[head]
        head += 1
        if v == target:
            return distance[v]
        for u in neighbours[v]:
            if distance[u] < 0:
                distance[u] = distance[v] + 1
                queue.append(u)
    return distance[target]


def by_pairs(words, start, target):
    """Model 1: compare every pair of words to build the adjacency list."""
    n = len(words)
    from_at = position_of(words, start)
    to_at = position_of(words, target)
    if from_at < 0 or to_at < 0:
        return -1, 0
    comparisons = 0
    neighbours = [[] for _ in range(n)]
    for i in range(n):
        for j in range(i + 1, n):
            comparisons += 1
            if one_apart(words[i], words[j]):
                neighbours[i].append(j)
                neighbours[j].append(i)
    return bfs(neighbours, from_at, to_at), comparisons


def by_buckets(words, start, target):
    """Model 2: group words by wildcard patterns; neighbours share a bucket."""
    n = len(words)
    from_at = position_of(words, start)
    to_at = position_of(words, target)
    if from_at < 0 or to_at < 0:
        return -1, 0
    insertions = 0
    keys = []
    members = []
    for i in range(n):
        word = words[i]
        for spot in range(len(word)):
            key = word[:spot] + "*" + word[spot + 1:]
            insertions += 1
            at = position_of(keys, key)
            if at < 0:
                keys.append(key)
                members.append([i])
            else:
                members[at].append(i)
    neighbours = [[] for _ in range(n)]
    for group in members:
        for a in group:
            for b in group:
                if a != b:
                    neighbours[a].append(b)
    return bfs(neighbours, from_at, to_at), insertions


def walk_every_path(words, start, target):
    """No graph at all: search the words directly, tracking the shortest chain."""
    from_at = position_of(words, start)
    to_at = position_of(words, target)
    if from_at < 0 or to_at < 0:
        return -1
    best = [-1]
    used = [False] * len(words)

    def step(at, length):
        if at == to_at:
            if best[0] < 0 or length < best[0]:
                best[0] = length
            return
        if best[0] >= 0 and length >= best[0]:
            return
        for i in range(len(words)):
            if not used[i] and one_apart(words[at], words[i]):
                used[i] = True
                step(i, length + 1)
                used[i] = False

    used[from_at] = True
    step(from_at, 0)
    return best[0]


WORDS = ["hit", "hot", "dot", "dog", "lot", "log", "cog", "cat", "cot", "cag"]

CASES = [
    ("hit", "cog"),
    ("hit", "hit"),
    ("hit", "cat"),
    ("dog", "cat"),
    ("cat", "log"),
]

print(f"{'from':<7}{'to':<7}{'by pairs':>10}{'by buckets':>12}{'no graph':>10}")
for start, target in CASES:
    pairs, _ = by_pairs(WORDS, start, target)
    buckets, _ = by_buckets(WORDS, start, target)
    print(f"{start:<7}{target:<7}{pairs:>10}{buckets:>12}"
          f"{walk_every_path(WORDS, start, target):>10}")
print()

print("and what each way of building the edges costs, for words of three letters:")
print(f"{'words':>8}{'pair comparisons':>18}{'bucket insertions':>19}")
for size in [7, 10, 100, 1000, 10000]:
    print(f"{size:>8}{size * (size - 1) // 2:>18}{size * 3:>19}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


LETTERS = "abcd"

TRIALS = 3000
agree = 0
same_as_search = 0
pair_total = 0
bucket_total = 0
for _ in range(TRIALS):
    count = 2 + rand(7)
    words = []
    for _ in range(count):
        word = "".join(LETTERS[rand(len(LETTERS))] for _ in range(3))
        if position_of(words, word) < 0:
            words.append(word)
    start = words[0]
    target = words[len(words) - 1]
    pairs, pair_work = by_pairs(words, start, target)
    buckets, bucket_work = by_buckets(words, start, target)
    if pairs == buckets:
        agree += 1
    if pairs == walk_every_path(words, start, target):
        same_as_search += 1
    pair_total += pair_work
    bucket_total += bucket_work

print(f"over {TRIALS} random word sets:")
print(f"  the two models agree                    {agree:>6}")
print(f"  and agree with searching the words      {same_as_search:>6}")
print()
print(f"building edges cost {pair_total} pair comparisons against {bucket_total} bucket")
print("insertions. On word sets this small the bucket model does more work, not")
print("less -- the crossover for three-letter words is at seven of them, and the")
print("table above is where it goes. Both models describe the same graph, so both")
print("give the same answers; what differs is the price of the modelling itself,")
print("quadratic in the number of words against linear.")
`,
          output: `from   to       by pairs  by buckets  no graph
hit    cog             3           3         3
hit    hit             0           0         0
hit    cat             3           3         3
dog    cat             3           3         3
cat    log             3           3         3

and what each way of building the edges costs, for words of three letters:
   words  pair comparisons  bucket insertions
       7                21                 21
      10                45                 30
     100              4950                300
    1000            499500               3000
   10000          49995000              30000

over 3000 random word sets:
  the two models agree                      3000
  and agree with searching the words        3000

building edges cost 32917 pair comparisons against 43275 bucket
insertions. On word sets this small the bucket model does more work, not
less -- the crossover for three-letter words is at seven of them, and the
table above is where it goes. Both models describe the same graph, so both
give the same answers; what differs is the price of the modelling itself,
quadratic in the number of words against linear.`,
          explanation:
            "One problem, two constructions of the same graph, and an answer computed without any graph at all as the check. The second table is the part to take away: which construction is cheaper depends on the size, and the crossover for three-letter words is at seven of them.",
          alternates: [
            {
              lang: "javascript",
              code: `// The modelling step, which is the part of graph problems that is actually
// hard. The algorithms are short and standard; deciding what a node is and what
// an edge is takes the thinking.
//
// The problem below has no graph in its statement at all: from a start word,
// reach a target word by changing one letter at a time, with every intermediate
// word in a dictionary. There is no picture of a graph anywhere in that, and
// yet the moment you say "a node is a word, an edge joins words one letter
// apart", the answer is a breadth-first search you already know how to write.
//
// The point of this example is the *cost* of that choice. The same problem is
// modelled twice -- once with an edge list built by comparing every pair of
// words, once by generating neighbours on demand from wildcard buckets -- and
// both give the same answers while doing very different amounts of work.

/** True when two equal-length words differ in exactly one position. */
function oneApart(a, b) {
  if (a.length !== b.length) return false;
  let seen = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) seen++;
  }
  return seen === 1;
}

function positionOf(words, word) {
  for (let i = 0; i < words.length; i++) {
    if (words[i] === word) return i;
  }
  return -1;
}

/** Fewest edges from start to target, or -1 if there is no route. */
function bfs(neighbours, start, target) {
  const distance = new Array(neighbours.length).fill(-1);
  distance[start] = 0;
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const v = queue[head];
    head++;
    if (v === target) return distance[v];
    for (const u of neighbours[v]) {
      if (distance[u] < 0) {
        distance[u] = distance[v] + 1;
        queue.push(u);
      }
    }
  }
  return distance[target];
}

/** Model 1: compare every pair of words to build the adjacency list. */
function byPairs(words, start, target) {
  const n = words.length;
  const fromAt = positionOf(words, start);
  const toAt = positionOf(words, target);
  if (fromAt < 0 || toAt < 0) return [-1, 0];
  let comparisons = 0;
  const neighbours = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      comparisons++;
      if (oneApart(words[i], words[j])) {
        neighbours[i].push(j);
        neighbours[j].push(i);
      }
    }
  }
  return [bfs(neighbours, fromAt, toAt), comparisons];
}

/** Model 2: group words by wildcard patterns; neighbours share a bucket. */
function byBuckets(words, start, target) {
  const n = words.length;
  const fromAt = positionOf(words, start);
  const toAt = positionOf(words, target);
  if (fromAt < 0 || toAt < 0) return [-1, 0];
  let insertions = 0;
  const keys = [];
  const members = [];
  for (let i = 0; i < n; i++) {
    const word = words[i];
    for (let spot = 0; spot < word.length; spot++) {
      const key = word.slice(0, spot) + "*" + word.slice(spot + 1);
      insertions++;
      const at = positionOf(keys, key);
      if (at < 0) {
        keys.push(key);
        members.push([i]);
      } else {
        members[at].push(i);
      }
    }
  }
  const neighbours = Array.from({ length: n }, () => []);
  for (const group of members) {
    for (const a of group) {
      for (const b of group) {
        if (a !== b) neighbours[a].push(b);
      }
    }
  }
  return [bfs(neighbours, fromAt, toAt), insertions];
}

/** No graph at all: search the words directly, tracking the shortest chain. */
function walkEveryPath(words, start, target) {
  const fromAt = positionOf(words, start);
  const toAt = positionOf(words, target);
  if (fromAt < 0 || toAt < 0) return -1;
  let best = -1;
  const used = new Array(words.length).fill(false);

  const step = (at, length) => {
    if (at === toAt) {
      if (best < 0 || length < best) best = length;
      return;
    }
    if (best >= 0 && length >= best) return;
    for (let i = 0; i < words.length; i++) {
      if (!used[i] && oneApart(words[at], words[i])) {
        used[i] = true;
        step(i, length + 1);
        used[i] = false;
      }
    }
  };

  used[fromAt] = true;
  step(fromAt, 0);
  return best;
}

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);

const WORDS = ["hit", "hot", "dot", "dog", "lot", "log", "cog", "cat", "cot", "cag"];

const CASES = [
  ["hit", "cog"],
  ["hit", "hit"],
  ["hit", "cat"],
  ["dog", "cat"],
  ["cat", "log"],
];

console.log(padEnd("from", 7) + padEnd("to", 7) + pad("by pairs", 10) + pad("by buckets", 12) + pad("no graph", 10));
for (const [start, target] of CASES) {
  const [pairs] = byPairs(WORDS, start, target);
  const [buckets] = byBuckets(WORDS, start, target);
  console.log(
    padEnd(start, 7) + padEnd(target, 7) + pad(pairs, 10) + pad(buckets, 12) +
      pad(walkEveryPath(WORDS, start, target), 10)
  );
}
console.log();

console.log("and what each way of building the edges costs, for words of three letters:");
console.log(pad("words", 8) + pad("pair comparisons", 18) + pad("bucket insertions", 19));
for (const size of [7, 10, 100, 1000, 10000]) {
  console.log(pad(size, 8) + pad((size * (size - 1)) / 2, 18) + pad(size * 3, 19));
}
console.log();

const LETTERS = "abcd";

const TRIALS = 3000;
let agree = 0;
let sameAsSearch = 0;
let pairTotal = 0;
let bucketTotal = 0;
for (let t = 0; t < TRIALS; t++) {
  const count = 2 + rand(7);
  const words = [];
  for (let k = 0; k < count; k++) {
    let word = "";
    for (let c = 0; c < 3; c++) word += LETTERS[rand(LETTERS.length)];
    if (positionOf(words, word) < 0) words.push(word);
  }
  const start = words[0];
  const target = words[words.length - 1];
  const [pairs, pairWork] = byPairs(words, start, target);
  const [buckets, bucketWork] = byBuckets(words, start, target);
  if (pairs === buckets) agree++;
  if (pairs === walkEveryPath(words, start, target)) sameAsSearch++;
  pairTotal += pairWork;
  bucketTotal += bucketWork;
}

console.log(\`over \${TRIALS} random word sets:\`);
console.log("  the two models agree                    " + pad(agree, 6));
console.log("  and agree with searching the words      " + pad(sameAsSearch, 6));
console.log();
console.log(\`building edges cost \${pairTotal} pair comparisons against \${bucketTotal} bucket\`);
console.log("insertions. On word sets this small the bucket model does more work, not");
console.log("less -- the crossover for three-letter words is at seven of them, and the");
console.log("table above is where it goes. Both models describe the same graph, so both");
console.log("give the same answers; what differs is the price of the modelling itself,");
console.log("quadratic in the number of words against linear.");
`,
            },
            {
              lang: "typescript",
              code: `// The modelling step, which is the part of graph problems that is actually
// hard. The algorithms are short and standard; deciding what a node is and what
// an edge is takes the thinking.
//
// The problem below has no graph in its statement at all: from a start word,
// reach a target word by changing one letter at a time, with every intermediate
// word in a dictionary. There is no picture of a graph anywhere in that, and
// yet the moment you say "a node is a word, an edge joins words one letter
// apart", the answer is a breadth-first search you already know how to write.
//
// The point of this example is the *cost* of that choice. The same problem is
// modelled twice -- once with an edge list built by comparing every pair of
// words, once by generating neighbours on demand from wildcard buckets -- and
// both give the same answers while doing very different amounts of work.

/** True when two equal-length words differ in exactly one position. */
function oneApart(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let seen = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) seen++;
  }
  return seen === 1;
}

function positionOf(words: string[], word: string): number {
  for (let i = 0; i < words.length; i++) {
    if (words[i] === word) return i;
  }
  return -1;
}

/** Fewest edges from start to target, or -1 if there is no route. */
function bfs(neighbours: number[][], start: number, target: number): number {
  const distance = new Array(neighbours.length).fill(-1);
  distance[start] = 0;
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const v = queue[head];
    head++;
    if (v === target) return distance[v];
    for (const u of neighbours[v]) {
      if (distance[u] < 0) {
        distance[u] = distance[v] + 1;
        queue.push(u);
      }
    }
  }
  return distance[target];
}

/** Model 1: compare every pair of words to build the adjacency list. */
function byPairs(words: string[], start: string, target: string): [number, number] {
  const n = words.length;
  const fromAt = positionOf(words, start);
  const toAt = positionOf(words, target);
  if (fromAt < 0 || toAt < 0) return [-1, 0];
  let comparisons = 0;
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      comparisons++;
      if (oneApart(words[i], words[j])) {
        neighbours[i].push(j);
        neighbours[j].push(i);
      }
    }
  }
  return [bfs(neighbours, fromAt, toAt), comparisons];
}

/** Model 2: group words by wildcard patterns; neighbours share a bucket. */
function byBuckets(words: string[], start: string, target: string): [number, number] {
  const n = words.length;
  const fromAt = positionOf(words, start);
  const toAt = positionOf(words, target);
  if (fromAt < 0 || toAt < 0) return [-1, 0];
  let insertions = 0;
  const keys: string[] = [];
  const members: number[][] = [];
  for (let i = 0; i < n; i++) {
    const word = words[i];
    for (let spot = 0; spot < word.length; spot++) {
      const key = word.slice(0, spot) + "*" + word.slice(spot + 1);
      insertions++;
      const at = positionOf(keys, key);
      if (at < 0) {
        keys.push(key);
        members.push([i]);
      } else {
        members[at].push(i);
      }
    }
  }
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const group of members) {
    for (const a of group) {
      for (const b of group) {
        if (a !== b) neighbours[a].push(b);
      }
    }
  }
  return [bfs(neighbours, fromAt, toAt), insertions];
}

/** No graph at all: search the words directly, tracking the shortest chain. */
function walkEveryPath(words: string[], start: string, target: string): number {
  const fromAt = positionOf(words, start);
  const toAt = positionOf(words, target);
  if (fromAt < 0 || toAt < 0) return -1;
  let best = -1;
  const used = new Array(words.length).fill(false);

  const step = (at: number, length: number): void => {
    if (at === toAt) {
      if (best < 0 || length < best) best = length;
      return;
    }
    if (best >= 0 && length >= best) return;
    for (let i = 0; i < words.length; i++) {
      if (!used[i] && oneApart(words[at], words[i])) {
        used[i] = true;
        step(i, length + 1);
        used[i] = false;
      }
    }
  };

  used[fromAt] = true;
  step(fromAt, 0);
  return best;
}

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

const WORDS = ["hit", "hot", "dot", "dog", "lot", "log", "cog", "cat", "cot", "cag"];

const CASES: [string, string][] = [
  ["hit", "cog"],
  ["hit", "hit"],
  ["hit", "cat"],
  ["dog", "cat"],
  ["cat", "log"],
];

console.log(padEnd("from", 7) + padEnd("to", 7) + pad("by pairs", 10) + pad("by buckets", 12) + pad("no graph", 10));
for (const [start, target] of CASES) {
  const [pairs] = byPairs(WORDS, start, target);
  const [buckets] = byBuckets(WORDS, start, target);
  console.log(
    padEnd(start, 7) + padEnd(target, 7) + pad(pairs, 10) + pad(buckets, 12) +
      pad(walkEveryPath(WORDS, start, target), 10)
  );
}
console.log();

console.log("and what each way of building the edges costs, for words of three letters:");
console.log(pad("words", 8) + pad("pair comparisons", 18) + pad("bucket insertions", 19));
for (const size of [7, 10, 100, 1000, 10000]) {
  console.log(pad(size, 8) + pad((size * (size - 1)) / 2, 18) + pad(size * 3, 19));
}
console.log();

const LETTERS = "abcd";

const TRIALS = 3000;
let agree = 0;
let sameAsSearch = 0;
let pairTotal = 0;
let bucketTotal = 0;
for (let t = 0; t < TRIALS; t++) {
  const count = 2 + rand(7);
  const words: string[] = [];
  for (let k = 0; k < count; k++) {
    let word = "";
    for (let c = 0; c < 3; c++) word += LETTERS[rand(LETTERS.length)];
    if (positionOf(words, word) < 0) words.push(word);
  }
  const start = words[0];
  const target = words[words.length - 1];
  const [pairs, pairWork] = byPairs(words, start, target);
  const [buckets, bucketWork] = byBuckets(words, start, target);
  if (pairs === buckets) agree++;
  if (pairs === walkEveryPath(words, start, target)) sameAsSearch++;
  pairTotal += pairWork;
  bucketTotal += bucketWork;
}

console.log(\`over \${TRIALS} random word sets:\`);
console.log("  the two models agree                    " + pad(agree, 6));
console.log("  and agree with searching the words      " + pad(sameAsSearch, 6));
console.log();
console.log(\`building edges cost \${pairTotal} pair comparisons against \${bucketTotal} bucket\`);
console.log("insertions. On word sets this small the bucket model does more work, not");
console.log("less -- the crossover for three-letter words is at seven of them, and the");
console.log("table above is where it goes. Both models describe the same graph, so both");
console.log("give the same answers; what differs is the price of the modelling itself,");
console.log("quadratic in the number of words against linear.");
`,
            },
            {
              lang: "java",
              code: `// The modelling step, which is the part of graph problems that is actually
// hard. The algorithms are short and standard; deciding what a node is and what
// an edge is takes the thinking.
//
// The problem below has no graph in its statement at all: from a start word,
// reach a target word by changing one letter at a time, with every intermediate
// word in a dictionary. There is no picture of a graph anywhere in that, and
// yet the moment you say "a node is a word, an edge joins words one letter
// apart", the answer is a breadth-first search you already know how to write.
//
// The point of this example is the *cost* of that choice. The same problem is
// modelled twice -- once with an edge list built by comparing every pair of
// words, once by generating neighbours on demand from wildcard buckets -- and
// both give the same answers while doing very different amounts of work.
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
    static long work;

    // True when two equal-length words differ in exactly one position.
    static boolean oneApart(String a, String b) {
        if (a.length() != b.length()) return false;
        int seen = 0;
        for (int i = 0; i < a.length(); i++) {
            if (a.charAt(i) != b.charAt(i)) seen++;
        }
        return seen == 1;
    }

    static int positionOf(List<String> words, String word) {
        for (int i = 0; i < words.size(); i++) {
            if (words.get(i).equals(word)) return i;
        }
        return -1;
    }

    // Fewest edges from start to target, or -1 if there is no route.
    static int bfs(List<List<Integer>> neighbours, int start, int target) {
        int[] distance = new int[neighbours.size()];
        Arrays.fill(distance, -1);
        distance[start] = 0;
        List<Integer> queue = new ArrayList<>();
        queue.add(start);
        int head = 0;
        while (head < queue.size()) {
            int v = queue.get(head);
            head++;
            if (v == target) return distance[v];
            for (int u : neighbours.get(v)) {
                if (distance[u] < 0) {
                    distance[u] = distance[v] + 1;
                    queue.add(u);
                }
            }
        }
        return distance[target];
    }

    static List<List<Integer>> emptyLists(int n) {
        List<List<Integer>> out = new ArrayList<>();
        for (int i = 0; i < n; i++) out.add(new ArrayList<>());
        return out;
    }

    // Model 1: compare every pair of words to build the adjacency list.
    static int byPairs(List<String> words, String start, String target) {
        int n = words.size();
        int fromAt = positionOf(words, start);
        int toAt = positionOf(words, target);
        work = 0;
        if (fromAt < 0 || toAt < 0) return -1;
        List<List<Integer>> neighbours = emptyLists(n);
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                work++;
                if (oneApart(words.get(i), words.get(j))) {
                    neighbours.get(i).add(j);
                    neighbours.get(j).add(i);
                }
            }
        }
        return bfs(neighbours, fromAt, toAt);
    }

    // Model 2: group words by wildcard patterns; neighbours share a bucket.
    static int byBuckets(List<String> words, String start, String target) {
        int n = words.size();
        int fromAt = positionOf(words, start);
        int toAt = positionOf(words, target);
        work = 0;
        if (fromAt < 0 || toAt < 0) return -1;
        List<String> keys = new ArrayList<>();
        List<List<Integer>> members = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            String word = words.get(i);
            for (int spot = 0; spot < word.length(); spot++) {
                String key = word.substring(0, spot) + "*" + word.substring(spot + 1);
                work++;
                int at = positionOf(keys, key);
                if (at < 0) {
                    keys.add(key);
                    List<Integer> fresh = new ArrayList<>();
                    fresh.add(i);
                    members.add(fresh);
                } else {
                    members.get(at).add(i);
                }
            }
        }
        List<List<Integer>> neighbours = emptyLists(n);
        for (List<Integer> group : members) {
            for (int a : group) {
                for (int b : group) {
                    if (a != b) neighbours.get(a).add(b);
                }
            }
        }
        return bfs(neighbours, fromAt, toAt);
    }

    static int walkBest;
    static boolean[] walkUsed;
    static List<String> walkWords;
    static int walkTarget;

    // No graph at all: search the words directly, tracking the shortest chain.
    static int walkEveryPath(List<String> words, String start, String target) {
        int fromAt = positionOf(words, start);
        int toAt = positionOf(words, target);
        if (fromAt < 0 || toAt < 0) return -1;
        walkBest = -1;
        walkUsed = new boolean[words.size()];
        walkWords = words;
        walkTarget = toAt;
        walkUsed[fromAt] = true;
        walkStep(fromAt, 0);
        return walkBest;
    }

    static void walkStep(int at, int length) {
        if (at == walkTarget) {
            if (walkBest < 0 || length < walkBest) walkBest = length;
            return;
        }
        if (walkBest >= 0 && length >= walkBest) return;
        for (int i = 0; i < walkWords.size(); i++) {
            if (!walkUsed[i] && oneApart(walkWords.get(at), walkWords.get(i))) {
                walkUsed[i] = true;
                walkStep(i, length + 1);
                walkUsed[i] = false;
            }
        }
    }

    static String padEnd(Object v, int w) {
        StringBuilder sb = new StringBuilder(String.valueOf(v));
        while (sb.length() < w) sb.append(' ');
        return sb.toString();
    }

    static String pad(Object v, int w) {
        StringBuilder sb = new StringBuilder(String.valueOf(v));
        while (sb.length() < w) sb.insert(0, ' ');
        return sb.toString();
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        List<String> words = new ArrayList<>(Arrays.asList(
            "hit", "hot", "dot", "dog", "lot", "log", "cog", "cat", "cot", "cag"));
        String[][] cases = {
            {"hit", "cog"}, {"hit", "hit"}, {"hit", "cat"}, {"dog", "cat"}, {"cat", "log"},
        };

        System.out.println(padEnd("from", 7) + padEnd("to", 7) + pad("by pairs", 10)
            + pad("by buckets", 12) + pad("no graph", 10));
        for (String[] pair : cases) {
            int pairs = byPairs(words, pair[0], pair[1]);
            int buckets = byBuckets(words, pair[0], pair[1]);
            System.out.println(padEnd(pair[0], 7) + padEnd(pair[1], 7) + pad(pairs, 10)
                + pad(buckets, 12) + pad(walkEveryPath(words, pair[0], pair[1]), 10));
        }
        System.out.println();

        System.out.println("and what each way of building the edges costs, for words of three letters:");
        System.out.println(pad("words", 8) + pad("pair comparisons", 18) + pad("bucket insertions", 19));
        for (int size : new int[] {7, 10, 100, 1000, 10000}) {
            System.out.println(pad(size, 8) + pad((long) size * (size - 1) / 2, 18) + pad(size * 3, 19));
        }
        System.out.println();

        String letters = "abcd";
        int trials = 3000;
        int agree = 0, sameAsSearch = 0;
        long pairTotal = 0, bucketTotal = 0;
        for (int t = 0; t < trials; t++) {
            int count = 2 + rand(7);
            List<String> pool = new ArrayList<>();
            for (int k = 0; k < count; k++) {
                StringBuilder sb = new StringBuilder();
                for (int c = 0; c < 3; c++) sb.append(letters.charAt(rand(letters.length())));
                String word = sb.toString();
                if (positionOf(pool, word) < 0) pool.add(word);
            }
            String start = pool.get(0);
            String target = pool.get(pool.size() - 1);
            int pairs = byPairs(pool, start, target);
            long pairWork = work;
            int buckets = byBuckets(pool, start, target);
            long bucketWork = work;
            if (pairs == buckets) agree++;
            if (pairs == walkEveryPath(pool, start, target)) sameAsSearch++;
            pairTotal += pairWork;
            bucketTotal += bucketWork;
        }

        System.out.println("over " + trials + " random word sets:");
        System.out.println("  the two models agree                    " + pad(agree, 6));
        System.out.println("  and agree with searching the words      " + pad(sameAsSearch, 6));
        System.out.println();
        System.out.println("building edges cost " + pairTotal + " pair comparisons against "
            + bucketTotal + " bucket");
        System.out.println("insertions. On word sets this small the bucket model does more work, not");
        System.out.println("less -- the crossover for three-letter words is at seven of them, and the");
        System.out.println("table above is where it goes. Both models describe the same graph, so both");
        System.out.println("give the same answers; what differs is the price of the modelling itself,");
        System.out.println("quadratic in the number of words against linear.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The modelling step, which is the part of graph problems that is actually
// hard. The algorithms are short and standard; deciding what a node is and what
// an edge is takes the thinking.
//
// The problem below has no graph in its statement at all: from a start word,
// reach a target word by changing one letter at a time, with every intermediate
// word in a dictionary. There is no picture of a graph anywhere in that, and
// yet the moment you say "a node is a word, an edge joins words one letter
// apart", the answer is a breadth-first search you already know how to write.
//
// The point of this example is the *cost* of that choice. The same problem is
// modelled twice -- once with an edge list built by comparing every pair of
// words, once by generating neighbours on demand from wildcard buckets -- and
// both give the same answers while doing very different amounts of work.
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

// True when two equal-length words differ in exactly one position.
bool oneApart(const std::string &a, const std::string &b) {
    if (a.size() != b.size()) return false;
    int seen = 0;
    for (size_t i = 0; i < a.size(); i++) {
        if (a[i] != b[i]) seen++;
    }
    return seen == 1;
}

int positionOf(const std::vector<std::string> &words, const std::string &word) {
    for (size_t i = 0; i < words.size(); i++) {
        if (words[i] == word) return static_cast<int>(i);
    }
    return -1;
}

// Fewest edges from start to target, or -1 if there is no route.
int bfs(const std::vector<std::vector<int>> &neighbours, int start, int target) {
    std::vector<int> distance(neighbours.size(), -1);
    distance[start] = 0;
    std::vector<int> queue = {start};
    for (size_t head = 0; head < queue.size(); head++) {
        int v = queue[head];
        if (v == target) return distance[v];
        for (int u : neighbours[v]) {
            if (distance[u] < 0) {
                distance[u] = distance[v] + 1;
                queue.push_back(u);
            }
        }
    }
    return distance[target];
}

// Model 1: compare every pair of words to build the adjacency list.
std::pair<int, std::int64_t> byPairs(const std::vector<std::string> &words,
                                     const std::string &start, const std::string &target) {
    int n = static_cast<int>(words.size());
    int fromAt = positionOf(words, start);
    int toAt = positionOf(words, target);
    if (fromAt < 0 || toAt < 0) return {-1, 0};
    std::int64_t comparisons = 0;
    std::vector<std::vector<int>> neighbours(n);
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            comparisons++;
            if (oneApart(words[i], words[j])) {
                neighbours[i].push_back(j);
                neighbours[j].push_back(i);
            }
        }
    }
    return {bfs(neighbours, fromAt, toAt), comparisons};
}

// Model 2: group words by wildcard patterns; neighbours share a bucket.
std::pair<int, std::int64_t> byBuckets(const std::vector<std::string> &words,
                                       const std::string &start, const std::string &target) {
    int n = static_cast<int>(words.size());
    int fromAt = positionOf(words, start);
    int toAt = positionOf(words, target);
    if (fromAt < 0 || toAt < 0) return {-1, 0};
    std::int64_t insertions = 0;
    std::vector<std::string> keys;
    std::vector<std::vector<int>> members;
    for (int i = 0; i < n; i++) {
        const std::string &word = words[i];
        for (size_t spot = 0; spot < word.size(); spot++) {
            std::string key = word.substr(0, spot) + "*" + word.substr(spot + 1);
            insertions++;
            int at = positionOf(keys, key);
            if (at < 0) {
                keys.push_back(key);
                members.push_back({i});
            } else {
                members[at].push_back(i);
            }
        }
    }
    std::vector<std::vector<int>> neighbours(n);
    for (const auto &group : members) {
        for (int a : group) {
            for (int b : group) {
                if (a != b) neighbours[a].push_back(b);
            }
        }
    }
    return {bfs(neighbours, fromAt, toAt), insertions};
}

void walkStep(const std::vector<std::string> &words, int toAt, int at, int length,
              int &best, std::vector<bool> &used) {
    if (at == toAt) {
        if (best < 0 || length < best) best = length;
        return;
    }
    if (best >= 0 && length >= best) return;
    for (size_t i = 0; i < words.size(); i++) {
        if (!used[i] && oneApart(words[at], words[i])) {
            used[i] = true;
            walkStep(words, toAt, static_cast<int>(i), length + 1, best, used);
            used[i] = false;
        }
    }
}

// No graph at all: search the words directly, tracking the shortest chain.
int walkEveryPath(const std::vector<std::string> &words,
                  const std::string &start, const std::string &target) {
    int fromAt = positionOf(words, start);
    int toAt = positionOf(words, target);
    if (fromAt < 0 || toAt < 0) return -1;
    int best = -1;
    std::vector<bool> used(words.size(), false);
    used[fromAt] = true;
    walkStep(words, toAt, fromAt, 0, best, used);
    return best;
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    const std::vector<std::string> words = {
        "hit", "hot", "dot", "dog", "lot", "log", "cog", "cat", "cot", "cag"};
    const std::vector<std::pair<std::string, std::string>> cases = {
        {"hit", "cog"}, {"hit", "hit"}, {"hit", "cat"}, {"dog", "cat"}, {"cat", "log"},
    };

    std::cout << std::left << std::setw(7) << "from" << std::setw(7) << "to" << std::right
              << std::setw(10) << "by pairs" << std::setw(12) << "by buckets"
              << std::setw(10) << "no graph" << "\\n";
    for (const auto &pair : cases) {
        std::cout << std::left << std::setw(7) << pair.first << std::setw(7) << pair.second
                  << std::right << std::setw(10) << byPairs(words, pair.first, pair.second).first
                  << std::setw(12) << byBuckets(words, pair.first, pair.second).first
                  << std::setw(10) << walkEveryPath(words, pair.first, pair.second) << "\\n";
    }
    std::cout << "\\n";

    std::cout << "and what each way of building the edges costs, for words of three letters:\\n";
    std::cout << std::right << std::setw(8) << "words" << std::setw(18) << "pair comparisons"
              << std::setw(19) << "bucket insertions" << "\\n";
    for (int size : {7, 10, 100, 1000, 10000}) {
        std::cout << std::setw(8) << size
                  << std::setw(18) << static_cast<std::int64_t>(size) * (size - 1) / 2
                  << std::setw(19) << size * 3 << "\\n";
    }
    std::cout << "\\n";

    const std::string letters = "abcd";
    const int TRIALS = 3000;
    int agree = 0, sameAsSearch = 0;
    std::int64_t pairTotal = 0, bucketTotal = 0;
    for (int t = 0; t < TRIALS; t++) {
        int count = 2 + rnd(7);
        std::vector<std::string> pool;
        for (int k = 0; k < count; k++) {
            std::string word;
            for (int c = 0; c < 3; c++) word += letters[rnd(static_cast<int>(letters.size()))];
            if (positionOf(pool, word) < 0) pool.push_back(word);
        }
        const std::string start = pool.front();
        const std::string target = pool.back();
        auto pairs = byPairs(pool, start, target);
        auto buckets = byBuckets(pool, start, target);
        if (pairs.first == buckets.first) agree++;
        if (pairs.first == walkEveryPath(pool, start, target)) sameAsSearch++;
        pairTotal += pairs.second;
        bucketTotal += buckets.second;
    }

    std::cout << "over " << TRIALS << " random word sets:\\n";
    std::cout << "  the two models agree                    " << std::setw(6) << agree << "\\n";
    std::cout << "  and agree with searching the words      " << std::setw(6) << sameAsSearch << "\\n\\n";
    std::cout << "building edges cost " << pairTotal << " pair comparisons against "
              << bucketTotal << " bucket\\n";
    std::cout << "insertions. On word sets this small the bucket model does more work, not\\n";
    std::cout << "less -- the crossover for three-letter words is at seven of them, and the\\n";
    std::cout << "table above is where it goes. Both models describe the same graph, so both\\n";
    std::cout << "give the same answers; what differs is the price of the modelling itself,\\n";
    std::cout << "quadratic in the number of words against linear.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// The modelling step, which is the part of graph problems that is actually
// hard. The algorithms are short and standard; deciding what a node is and what
// an edge is takes the thinking.
//
// The problem below has no graph in its statement at all: from a start word,
// reach a target word by changing one letter at a time, with every intermediate
// word in a dictionary. There is no picture of a graph anywhere in that, and
// yet the moment you say "a node is a word, an edge joins words one letter
// apart", the answer is a breadth-first search you already know how to write.
//
// The point of this example is the *cost* of that choice. The same problem is
// modelled twice -- once with an edge list built by comparing every pair of
// words, once by generating neighbours on demand from wildcard buckets -- and
// both give the same answers while doing very different amounts of work.

/// True when two equal-length words differ in exactly one position.
fn one_apart(a: &str, b: &str) -> bool {
    if a.len() != b.len() {
        return false;
    }
    let (ab, bb) = (a.as_bytes(), b.as_bytes());
    let mut seen = 0;
    for i in 0..ab.len() {
        if ab[i] != bb[i] {
            seen += 1;
        }
    }
    seen == 1
}

fn position_of(words: &[String], word: &str) -> i32 {
    for (i, w) in words.iter().enumerate() {
        if w == word {
            return i as i32;
        }
    }
    -1
}

/// Fewest edges from start to target, or -1 if there is no route.
fn bfs(neighbours: &[Vec<usize>], start: usize, target: usize) -> i32 {
    let mut distance = vec![-1i32; neighbours.len()];
    distance[start] = 0;
    let mut queue = vec![start];
    let mut head = 0;
    while head < queue.len() {
        let v = queue[head];
        head += 1;
        if v == target {
            return distance[v];
        }
        for k in 0..neighbours[v].len() {
            let u = neighbours[v][k];
            if distance[u] < 0 {
                distance[u] = distance[v] + 1;
                queue.push(u);
            }
        }
    }
    distance[target]
}

/// Model 1: compare every pair of words to build the adjacency list.
fn by_pairs(words: &[String], start: &str, target: &str) -> (i32, i64) {
    let n = words.len();
    let from_at = position_of(words, start);
    let to_at = position_of(words, target);
    if from_at < 0 || to_at < 0 {
        return (-1, 0);
    }
    let mut comparisons = 0i64;
    let mut neighbours: Vec<Vec<usize>> = vec![Vec::new(); n];
    for i in 0..n {
        for j in (i + 1)..n {
            comparisons += 1;
            if one_apart(&words[i], &words[j]) {
                neighbours[i].push(j);
                neighbours[j].push(i);
            }
        }
    }
    (bfs(&neighbours, from_at as usize, to_at as usize), comparisons)
}

/// Model 2: group words by wildcard patterns; neighbours share a bucket.
fn by_buckets(words: &[String], start: &str, target: &str) -> (i32, i64) {
    let n = words.len();
    let from_at = position_of(words, start);
    let to_at = position_of(words, target);
    if from_at < 0 || to_at < 0 {
        return (-1, 0);
    }
    let mut insertions = 0i64;
    let mut keys: Vec<String> = Vec::new();
    let mut members: Vec<Vec<usize>> = Vec::new();
    for i in 0..n {
        let word = &words[i];
        for spot in 0..word.len() {
            let key = format!("{}*{}", &word[..spot], &word[spot + 1..]);
            insertions += 1;
            let at = position_of(&keys, &key);
            if at < 0 {
                keys.push(key);
                members.push(vec![i]);
            } else {
                members[at as usize].push(i);
            }
        }
    }
    let mut neighbours: Vec<Vec<usize>> = vec![Vec::new(); n];
    for group in &members {
        for &a in group {
            for &b in group {
                if a != b {
                    neighbours[a].push(b);
                }
            }
        }
    }
    (bfs(&neighbours, from_at as usize, to_at as usize), insertions)
}

fn walk_step(words: &[String], to_at: usize, at: usize, length: i32,
             best: &mut i32, used: &mut Vec<bool>) {
    if at == to_at {
        if *best < 0 || length < *best {
            *best = length;
        }
        return;
    }
    if *best >= 0 && length >= *best {
        return;
    }
    for i in 0..words.len() {
        if !used[i] && one_apart(&words[at], &words[i]) {
            used[i] = true;
            walk_step(words, to_at, i, length + 1, best, used);
            used[i] = false;
        }
    }
}

/// No graph at all: search the words directly, tracking the shortest chain.
fn walk_every_path(words: &[String], start: &str, target: &str) -> i32 {
    let from_at = position_of(words, start);
    let to_at = position_of(words, target);
    if from_at < 0 || to_at < 0 {
        return -1;
    }
    let mut best = -1;
    let mut used = vec![false; words.len()];
    used[from_at as usize] = true;
    walk_step(words, to_at as usize, from_at as usize, 0, &mut best, &mut used);
    best
}

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
    let words: Vec<String> = ["hit", "hot", "dot", "dog", "lot", "log", "cog", "cat", "cot", "cag"]
        .iter()
        .map(|s| s.to_string())
        .collect();
    let cases = [
        ("hit", "cog"), ("hit", "hit"), ("hit", "cat"), ("dog", "cat"), ("cat", "log"),
    ];

    println!("{:<7}{:<7}{:>10}{:>12}{:>10}", "from", "to", "by pairs", "by buckets", "no graph");
    for (start, target) in cases {
        let (pairs, _) = by_pairs(&words, start, target);
        let (buckets, _) = by_buckets(&words, start, target);
        println!(
            "{:<7}{:<7}{:>10}{:>12}{:>10}",
            start, target, pairs, buckets,
            walk_every_path(&words, start, target)
        );
    }
    println!();

    println!("and what each way of building the edges costs, for words of three letters:");
    println!("{:>8}{:>18}{:>19}", "words", "pair comparisons", "bucket insertions");
    for size in [7i64, 10, 100, 1000, 10000] {
        println!("{:>8}{:>18}{:>19}", size, size * (size - 1) / 2, size * 3);
    }
    println!();

    let letters = b"abcd";
    let trials = 3000;
    let mut rng = Rng { seed: 1 };
    let (mut agree, mut same_as_search) = (0, 0);
    let (mut pair_total, mut bucket_total) = (0i64, 0i64);
    for _ in 0..trials {
        let count = 2 + rng.next(7);
        let mut pool: Vec<String> = Vec::new();
        for _ in 0..count {
            let mut word = String::new();
            for _ in 0..3 {
                word.push(letters[rng.next(4) as usize] as char);
            }
            if position_of(&pool, &word) < 0 {
                pool.push(word);
            }
        }
        let start = pool[0].clone();
        let target = pool[pool.len() - 1].clone();
        let (pairs, pair_work) = by_pairs(&pool, &start, &target);
        let (buckets, bucket_work) = by_buckets(&pool, &start, &target);
        if pairs == buckets {
            agree += 1;
        }
        if pairs == walk_every_path(&pool, &start, &target) {
            same_as_search += 1;
        }
        pair_total += pair_work;
        bucket_total += bucket_work;
    }

    println!("over {} random word sets:", trials);
    println!("  the two models agree                    {:>6}", agree);
    println!("  and agree with searching the words      {:>6}", same_as_search);
    println!();
    println!("building edges cost {} pair comparisons against {} bucket", pair_total, bucket_total);
    println!("insertions. On word sets this small the bucket model does more work, not");
    println!("less -- the crossover for three-letter words is at seven of them, and the");
    println!("table above is where it goes. Both models describe the same graph, so both");
    println!("give the same answers; what differs is the price of the modelling itself,");
    println!("quadratic in the number of words against linear.");
}
`,
            },
            {
              lang: "go",
              code: `// The modelling step, which is the part of graph problems that is actually
// hard. The algorithms are short and standard; deciding what a node is and what
// an edge is takes the thinking.
//
// The problem below has no graph in its statement at all: from a start word,
// reach a target word by changing one letter at a time, with every intermediate
// word in a dictionary. There is no picture of a graph anywhere in that, and
// yet the moment you say "a node is a word, an edge joins words one letter
// apart", the answer is a breadth-first search you already know how to write.
//
// The point of this example is the *cost* of that choice. The same problem is
// modelled twice -- once with an edge list built by comparing every pair of
// words, once by generating neighbours on demand from wildcard buckets -- and
// both give the same answers while doing very different amounts of work.
package main

import "fmt"

// oneApart is true when two equal-length words differ in exactly one position.
func oneApart(a, b string) bool {
	if len(a) != len(b) {
		return false
	}
	seen := 0
	for i := 0; i < len(a); i++ {
		if a[i] != b[i] {
			seen++
		}
	}
	return seen == 1
}

func positionOf(words []string, word string) int {
	for i, w := range words {
		if w == word {
			return i
		}
	}
	return -1
}

// bfs gives the fewest edges from start to target, or -1 if there is no route.
func bfs(neighbours [][]int, start, target int) int {
	distance := make([]int, len(neighbours))
	for i := range distance {
		distance[i] = -1
	}
	distance[start] = 0
	queue := []int{start}
	for head := 0; head < len(queue); head++ {
		v := queue[head]
		if v == target {
			return distance[v]
		}
		for _, u := range neighbours[v] {
			if distance[u] < 0 {
				distance[u] = distance[v] + 1
				queue = append(queue, u)
			}
		}
	}
	return distance[target]
}

// byPairs compares every pair of words to build the adjacency list.
func byPairs(words []string, start, target string) (int, int64) {
	n := len(words)
	fromAt := positionOf(words, start)
	toAt := positionOf(words, target)
	if fromAt < 0 || toAt < 0 {
		return -1, 0
	}
	var comparisons int64
	neighbours := make([][]int, n)
	for i := 0; i < n; i++ {
		for j := i + 1; j < n; j++ {
			comparisons++
			if oneApart(words[i], words[j]) {
				neighbours[i] = append(neighbours[i], j)
				neighbours[j] = append(neighbours[j], i)
			}
		}
	}
	return bfs(neighbours, fromAt, toAt), comparisons
}

// byBuckets groups words by wildcard patterns; neighbours share a bucket.
func byBuckets(words []string, start, target string) (int, int64) {
	n := len(words)
	fromAt := positionOf(words, start)
	toAt := positionOf(words, target)
	if fromAt < 0 || toAt < 0 {
		return -1, 0
	}
	var insertions int64
	var keys []string
	var members [][]int
	for i := 0; i < n; i++ {
		word := words[i]
		for spot := 0; spot < len(word); spot++ {
			key := word[:spot] + "*" + word[spot+1:]
			insertions++
			at := positionOf(keys, key)
			if at < 0 {
				keys = append(keys, key)
				members = append(members, []int{i})
			} else {
				members[at] = append(members[at], i)
			}
		}
	}
	neighbours := make([][]int, n)
	for _, group := range members {
		for _, a := range group {
			for _, b := range group {
				if a != b {
					neighbours[a] = append(neighbours[a], b)
				}
			}
		}
	}
	return bfs(neighbours, fromAt, toAt), insertions
}

// walkEveryPath searches the words directly, with no graph anywhere.
func walkEveryPath(words []string, start, target string) int {
	fromAt := positionOf(words, start)
	toAt := positionOf(words, target)
	if fromAt < 0 || toAt < 0 {
		return -1
	}
	best := -1
	used := make([]bool, len(words))
	var step func(at, length int)
	step = func(at, length int) {
		if at == toAt {
			if best < 0 || length < best {
				best = length
			}
			return
		}
		if best >= 0 && length >= best {
			return
		}
		for i := range words {
			if !used[i] && oneApart(words[at], words[i]) {
				used[i] = true
				step(i, length+1)
				used[i] = false
			}
		}
	}
	used[fromAt] = true
	step(fromAt, 0)
	return best
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	words := []string{"hit", "hot", "dot", "dog", "lot", "log", "cog", "cat", "cot", "cag"}
	cases := [][2]string{
		{"hit", "cog"}, {"hit", "hit"}, {"hit", "cat"}, {"dog", "cat"}, {"cat", "log"},
	}

	fmt.Printf("%-7s%-7s%10s%12s%10s\\n", "from", "to", "by pairs", "by buckets", "no graph")
	for _, pair := range cases {
		pairs, _ := byPairs(words, pair[0], pair[1])
		buckets, _ := byBuckets(words, pair[0], pair[1])
		fmt.Printf("%-7s%-7s%10d%12d%10d\\n", pair[0], pair[1], pairs, buckets,
			walkEveryPath(words, pair[0], pair[1]))
	}
	fmt.Println()

	fmt.Println("and what each way of building the edges costs, for words of three letters:")
	fmt.Printf("%8s%18s%19s\\n", "words", "pair comparisons", "bucket insertions")
	for _, size := range []int{7, 10, 100, 1000, 10000} {
		fmt.Printf("%8d%18d%19d\\n", size, int64(size)*int64(size-1)/2, size*3)
	}
	fmt.Println()

	letters := "abcd"
	trials := 3000
	agree, sameAsSearch := 0, 0
	var pairTotal, bucketTotal int64
	for t := 0; t < trials; t++ {
		count := 2 + rand(7)
		var pool []string
		for k := 0; k < count; k++ {
			word := ""
			for c := 0; c < 3; c++ {
				word += string(letters[rand(len(letters))])
			}
			if positionOf(pool, word) < 0 {
				pool = append(pool, word)
			}
		}
		start := pool[0]
		target := pool[len(pool)-1]
		pairs, pairWork := byPairs(pool, start, target)
		buckets, bucketWork := byBuckets(pool, start, target)
		if pairs == buckets {
			agree++
		}
		if pairs == walkEveryPath(pool, start, target) {
			sameAsSearch++
		}
		pairTotal += pairWork
		bucketTotal += bucketWork
	}

	fmt.Printf("over %d random word sets:\\n", trials)
	fmt.Printf("  the two models agree                    %6d\\n", agree)
	fmt.Printf("  and agree with searching the words      %6d\\n", sameAsSearch)
	fmt.Println()
	fmt.Printf("building edges cost %d pair comparisons against %d bucket\\n", pairTotal, bucketTotal)
	fmt.Println("insertions. On word sets this small the bucket model does more work, not")
	fmt.Println("less -- the crossover for three-letter words is at seven of them, and the")
	fmt.Println("table above is where it goes. Both models describe the same graph, so both")
	fmt.Println("give the same answers; what differs is the price of the modelling itself,")
	fmt.Println("quadratic in the number of words against linear.")
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "graph-bfs-layers",
        kind: "graph",
        algorithm: "bfs",
        title: "The traversal all of this is aimed at",
        lockAlgorithm: true,
      },
      pitfalls: [
        {
          title: "The clever construction is not always cheaper",
          body: "Wildcard buckets beat all-pairs comparison asymptotically and lose below seven three-letter words \u2014 measured here, 43,275 insertions against 32,917 comparisons on small sets. Which construction to use is a question about the expected size, and the answer at n = 10 is different from the answer at n = 10,000.",
        },
        {
          title: "Building the graph is part of the cost",
          body: "It is easy to quote the complexity of the traversal and forget that the adjacency list had to be built first. On a word ladder the search is linear in the edges and the *construction* can be quadratic in the words, so the construction dominates and is the thing to optimise.",
        },
      ],
    },
    {
      id: "a-node-is-a-state",
      heading: "A node is a state, not a place",
      body: [
        "The second decision is the one that decides whether the program is correct, and it is where most graph bugs actually live.",
        "A node does not have to be a *place*. It is whatever has to be known for the rest of the journey to be determined \u2014 which is the same requirement module 27 called the second precondition, arriving here from a completely different direction.",
        "The example is a map with doors and keys: walking onto a door is legal only if the matching key has already been picked up. \"Where am I\" does not determine which moves are legal, so a cell is not a node. A cell **paired with the set of keys held** is. The graph is bigger \u2014 the same cell appears once per key set \u2014 and it is the graph the problem actually describes.",
        "Both ways of deleting that state are measured. Treating doors as always open is right on 2,407 of 3,000 random maps and claims a shorter route than exists on 45 of them. Treating doors as walls is right on 2,755 and misses a route that does exist on 245. Both run, both return plausible small integers, and neither has any way to notice it is answering a different question.",
        "The reliable signal that a piece of state is missing is this: try to write the rule for which moves are legal, using only what the node holds. If you cannot, the node is incomplete. In the map, the door rule needs the key set, so the key set is part of the node. That test takes ten seconds and catches the class of bug that is otherwise found in production.",
      ],
      examples: [
        {
          id: "the-node-carries-the-keys",
          title: "A map with doors and keys, with the state deleted two ways",
          lang: "python",
          code: `# The second modelling decision, and the one that decides whether the program is
# correct rather than merely fast: a node does not have to be a *place*. It is
# whatever has to be true for the rest of the journey to be determined.
#
# The map below has doors and keys. Walking onto a door is only allowed if the
# matching key has already been picked up, so "where am I" is not enough to know
# what moves are legal -- "where am I, and what am I carrying" is. The node is a
# cell paired with the set of keys held, which is the same correction module 28
# kept making, arriving here from a completely different direction.
#
# Maps use keys a, b, c and doors A, B, C, so a key set is three bits and there
# are eight of them.
INF = 10 ** 9
MASKS = 8
STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def find(grid, what):
    for i in range(len(grid)):
        for j in range(len(grid[i])):
            if grid[i][j] == what:
                return i, j
    return -1, -1


def is_key(c):
    return "a" <= c <= "c"


def is_door(c):
    return "A" <= c <= "C"


def with_keys(grid):
    """The node is (row, column, keys held). Doors are checked against the set."""
    rows, cols = len(grid), len(grid[0])
    start_row, start_col = find(grid, "@")
    distance = [[[-1] * MASKS for _ in range(cols)] for _ in range(rows)]
    distance[start_row][start_col][0] = 0
    queue = [(start_row, start_col, 0)]
    head = 0
    states = 1
    while head < len(queue):
        i, j, held = queue[head]
        head += 1
        if grid[i][j] == "X":
            return distance[i][j][held], states
        for di, dj in STEPS:
            a, b = i + di, j + dj
            if not (0 <= a < rows and 0 <= b < cols):
                continue
            cell = grid[a][b]
            if cell == "#":
                continue
            if is_door(cell) and not held >> (ord(cell) - ord("A")) & 1:
                continue
            carry = held
            if is_key(cell):
                carry |= 1 << (ord(cell) - ord("a"))
            if distance[a][b][carry] < 0:
                distance[a][b][carry] = distance[i][j][held] + 1
                queue.append((a, b, carry))
                states += 1
    return -1, states


def flat(grid, doors_block):
    """The node is just (row, column). Doors are either always open or always shut."""
    rows, cols = len(grid), len(grid[0])
    start_row, start_col = find(grid, "@")
    distance = [[-1] * cols for _ in range(rows)]
    distance[start_row][start_col] = 0
    queue = [(start_row, start_col)]
    head = 0
    while head < len(queue):
        i, j = queue[head]
        head += 1
        if grid[i][j] == "X":
            return distance[i][j]
        for di, dj in STEPS:
            a, b = i + di, j + dj
            if not (0 <= a < rows and 0 <= b < cols):
                continue
            cell = grid[a][b]
            if cell == "#":
                continue
            if doors_block and is_door(cell):
                continue
            if distance[a][b] < 0:
                distance[a][b] = distance[i][j] + 1
                queue.append((a, b))
    return -1


def brute(grid):
    """Walk every route that never repeats a (cell, keys) state. No layering."""
    rows, cols = len(grid), len(grid[0])
    start_row, start_col = find(grid, "@")
    best = [INF]
    on_path = [[[False] * MASKS for _ in range(cols)] for _ in range(rows)]

    def step(i, j, held, length):
        if length >= best[0]:
            return
        if grid[i][j] == "X":
            best[0] = length
            return
        on_path[i][j][held] = True
        for di, dj in STEPS:
            a, b = i + di, j + dj
            if not (0 <= a < rows and 0 <= b < cols):
                continue
            cell = grid[a][b]
            if cell == "#":
                continue
            if is_door(cell) and not held >> (ord(cell) - ord("A")) & 1:
                continue
            carry = held
            if is_key(cell):
                carry |= 1 << (ord(cell) - ord("a"))
            if not on_path[a][b][carry]:
                step(a, b, carry, length + 1)
        on_path[i][j][held] = False

    step(start_row, start_col, 0, 0)
    return -1 if best[0] >= INF else best[0]


def show(grid):
    return "/".join(grid)


CASES = [
    ["@..", "..A", "a#X"],
    ["@..", ".#A", "a#X"],
    ["@..", "..#", "aAX"],
    ["@.a", ".#A", "..X"],
    ["@aA", "###", "..X"],
    ["@.b", "aB.", "A.X"],
]

print(f"{'map':<20}{'cell and keys':>15}{'doors open':>12}{'doors shut':>12}{'every route':>13}{'states':>8}")
for grid in CASES:
    answer, states = with_keys(grid)
    print(f"{show(grid):<20}{answer:>15}{flat(grid, False):>12}{flat(grid, True):>12}"
          f"{brute(grid):>13}{states:>8}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


PALETTE = "...#ab.AB"

TRIALS = 3000
keyed_ok = 0
open_ok = 0
shut_ok = 0
open_short = 0
shut_long = 0
for _ in range(TRIALS):
    rows, cols = 3, 3
    cells = []
    for _ in range(rows * cols):
        cells.append(PALETTE[rand(len(PALETTE))])
    cells[0] = "@"
    cells[rows * cols - 1] = "X"
    grid = ["".join(cells[i * cols:(i + 1) * cols]) for i in range(rows)]
    truth = brute(grid)
    answer, _ = with_keys(grid)
    if answer == truth:
        keyed_ok += 1
    loose = flat(grid, False)
    tight = flat(grid, True)
    if loose == truth:
        open_ok += 1
    if tight == truth:
        shut_ok += 1
    if truth >= 0 and (loose < 0 or loose < truth):
        open_short += 1
    if truth >= 0 and (tight < 0 or tight > truth):
        shut_long += 1

print(f"over {TRIALS} random 3 by 3 maps, against walking every route:")
print(f"  the node is a cell and a key set   {keyed_ok:>6}")
print(f"  the node is a cell, doors open     {open_ok:>6}")
print(f"  the node is a cell, doors shut     {shut_ok:>6}")
print()
print(f"treating doors as open claimed a shorter route than exists {open_short} times;")
print(f"treating them as walls missed a route that does exist {shut_long} times. Both")
print("run, both return plausible numbers, and both are answering a question with a")
print("piece of the state deleted. The key set is not extra bookkeeping -- without")
print("it the graph is a different graph.")
`,
          output: `map                   cell and keys  doors open  doors shut  every route  states
@../..A/a#X                       6           4          -1            6      13
@../.#A/a#X                       8           4          -1            8      11
@../..#/aAX                       4           4          -1            4      12
@.a/.#A/..X                       4           4           4            4      11
@aA/###/..X                      -1          -1          -1           -1       4
@.b/aB./A.X                       4           4           4            4      17

over 3000 random 3 by 3 maps, against walking every route:
  the node is a cell and a key set     3000
  the node is a cell, doors open       2407
  the node is a cell, doors shut       2755

treating doors as open claimed a shorter route than exists 45 times;
treating them as walls missed a route that does exist 245 times. Both
run, both return plausible numbers, and both are answering a question with a
piece of the state deleted. The key set is not extra bookkeeping -- without
it the graph is a different graph.`,
          explanation:
            "The same map searched three ways. The first makes the node a cell and a key set; the other two delete the key set in the two possible directions. Both wrong versions are right most of the time, which is precisely what makes them dangerous.",
          alternates: [
            {
              lang: "javascript",
              code: `// The second modelling decision, and the one that decides whether the program is
// correct rather than merely fast: a node does not have to be a *place*. It is
// whatever has to be true for the rest of the journey to be determined.
//
// The map below has doors and keys. Walking onto a door is only allowed if the
// matching key has already been picked up, so "where am I" is not enough to know
// what moves are legal -- "where am I, and what am I carrying" is. The node is a
// cell paired with the set of keys held, which is the same correction module 28
// kept making, arriving here from a completely different direction.
//
// Maps use keys a, b, c and doors A, B, C, so a key set is three bits and there
// are eight of them.

const INF = 1000000000;
const MASKS = 8;
const STEPS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function find(grid, what) {
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      if (grid[i][j] === what) return [i, j];
    }
  }
  return [-1, -1];
}

const isKey = (c) => c >= "a" && c <= "c";
const isDoor = (c) => c >= "A" && c <= "C";

/** The node is (row, column, keys held). Doors are checked against the set. */
function withKeys(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const [startRow, startCol] = find(grid, "@");
  const distance = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => new Array(MASKS).fill(-1))
  );
  distance[startRow][startCol][0] = 0;
  const queue = [[startRow, startCol, 0]];
  let head = 0;
  let states = 1;
  while (head < queue.length) {
    const [i, j, held] = queue[head];
    head++;
    if (grid[i][j] === "X") return [distance[i][j][held], states];
    for (const [di, dj] of STEPS) {
      const a = i + di;
      const b = j + dj;
      if (!(a >= 0 && a < rows && b >= 0 && b < cols)) continue;
      const cell = grid[a][b];
      if (cell === "#") continue;
      if (isDoor(cell) && !((held >> (cell.charCodeAt(0) - 65)) & 1)) continue;
      let carry = held;
      if (isKey(cell)) carry |= 1 << (cell.charCodeAt(0) - 97);
      if (distance[a][b][carry] < 0) {
        distance[a][b][carry] = distance[i][j][held] + 1;
        queue.push([a, b, carry]);
        states++;
      }
    }
  }
  return [-1, states];
}

/** The node is just (row, column). Doors are either always open or always shut. */
function flat(grid, doorsBlock) {
  const rows = grid.length;
  const cols = grid[0].length;
  const [startRow, startCol] = find(grid, "@");
  const distance = Array.from({ length: rows }, () => new Array(cols).fill(-1));
  distance[startRow][startCol] = 0;
  const queue = [[startRow, startCol]];
  let head = 0;
  while (head < queue.length) {
    const [i, j] = queue[head];
    head++;
    if (grid[i][j] === "X") return distance[i][j];
    for (const [di, dj] of STEPS) {
      const a = i + di;
      const b = j + dj;
      if (!(a >= 0 && a < rows && b >= 0 && b < cols)) continue;
      const cell = grid[a][b];
      if (cell === "#") continue;
      if (doorsBlock && isDoor(cell)) continue;
      if (distance[a][b] < 0) {
        distance[a][b] = distance[i][j] + 1;
        queue.push([a, b]);
      }
    }
  }
  return -1;
}

/** Walk every route that never repeats a (cell, keys) state. No layering. */
function brute(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const [startRow, startCol] = find(grid, "@");
  let best = INF;
  const onPath = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => new Array(MASKS).fill(false))
  );

  const step = (i, j, held, length) => {
    if (length >= best) return;
    if (grid[i][j] === "X") {
      best = length;
      return;
    }
    onPath[i][j][held] = true;
    for (const [di, dj] of STEPS) {
      const a = i + di;
      const b = j + dj;
      if (!(a >= 0 && a < rows && b >= 0 && b < cols)) continue;
      const cell = grid[a][b];
      if (cell === "#") continue;
      if (isDoor(cell) && !((held >> (cell.charCodeAt(0) - 65)) & 1)) continue;
      let carry = held;
      if (isKey(cell)) carry |= 1 << (cell.charCodeAt(0) - 97);
      if (!onPath[a][b][carry]) step(a, b, carry, length + 1);
    }
    onPath[i][j][held] = false;
  };

  step(startRow, startCol, 0, 0);
  return best >= INF ? -1 : best;
}

const show = (grid) => grid.join("/");

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);

const CASES = [
  ["@..", "..A", "a#X"],
  ["@..", ".#A", "a#X"],
  ["@..", "..#", "aAX"],
  ["@.a", ".#A", "..X"],
  ["@aA", "###", "..X"],
  ["@.b", "aB.", "A.X"],
];

console.log(
  padEnd("map", 20) + pad("cell and keys", 15) + pad("doors open", 12) +
    pad("doors shut", 12) + pad("every route", 13) + pad("states", 8)
);
for (const grid of CASES) {
  const [answer, states] = withKeys(grid);
  console.log(
    padEnd(show(grid), 20) + pad(answer, 15) + pad(flat(grid, false), 12) +
      pad(flat(grid, true), 12) + pad(brute(grid), 13) + pad(states, 8)
  );
}
console.log();

const PALETTE = "...#ab.AB";

const TRIALS = 3000;
let keyedOk = 0;
let openOk = 0;
let shutOk = 0;
let openShort = 0;
let shutLong = 0;
for (let t = 0; t < TRIALS; t++) {
  const rows = 3;
  const cols = 3;
  const cells = [];
  for (let k = 0; k < rows * cols; k++) cells.push(PALETTE[rand(PALETTE.length)]);
  cells[0] = "@";
  cells[rows * cols - 1] = "X";
  const grid = [];
  for (let i = 0; i < rows; i++) grid.push(cells.slice(i * cols, (i + 1) * cols).join(""));
  const truth = brute(grid);
  const [answer] = withKeys(grid);
  if (answer === truth) keyedOk++;
  const loose = flat(grid, false);
  const tight = flat(grid, true);
  if (loose === truth) openOk++;
  if (tight === truth) shutOk++;
  if (truth >= 0 && (loose < 0 || loose < truth)) openShort++;
  if (truth >= 0 && (tight < 0 || tight > truth)) shutLong++;
}

console.log(\`over \${TRIALS} random 3 by 3 maps, against walking every route:\`);
console.log("  the node is a cell and a key set   " + pad(keyedOk, 6));
console.log("  the node is a cell, doors open     " + pad(openOk, 6));
console.log("  the node is a cell, doors shut     " + pad(shutOk, 6));
console.log();
console.log(\`treating doors as open claimed a shorter route than exists \${openShort} times;\`);
console.log(\`treating them as walls missed a route that does exist \${shutLong} times. Both\`);
console.log("run, both return plausible numbers, and both are answering a question with a");
console.log("piece of the state deleted. The key set is not extra bookkeeping -- without");
console.log("it the graph is a different graph.");
`,
            },
            {
              lang: "typescript",
              code: `// The second modelling decision, and the one that decides whether the program is
// correct rather than merely fast: a node does not have to be a *place*. It is
// whatever has to be true for the rest of the journey to be determined.
//
// The map below has doors and keys. Walking onto a door is only allowed if the
// matching key has already been picked up, so "where am I" is not enough to know
// what moves are legal -- "where am I, and what am I carrying" is. The node is a
// cell paired with the set of keys held, which is the same correction module 28
// kept making, arriving here from a completely different direction.
//
// Maps use keys a, b, c and doors A, B, C, so a key set is three bits and there
// are eight of them.

const INF = 1000000000;
const MASKS = 8;
const STEPS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

type Grid = string[];

function find(grid: Grid, what: string): [number, number] {
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      if (grid[i][j] === what) return [i, j];
    }
  }
  return [-1, -1];
}

const isKey = (c: string): boolean => c >= "a" && c <= "c";
const isDoor = (c: string): boolean => c >= "A" && c <= "C";

/** The node is (row, column, keys held). Doors are checked against the set. */
function withKeys(grid: Grid): [number, number] {
  const rows = grid.length;
  const cols = grid[0].length;
  const [startRow, startCol] = find(grid, "@");
  const distance: number[][][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => new Array(MASKS).fill(-1))
  );
  distance[startRow][startCol][0] = 0;
  const queue: [number, number, number][] = [[startRow, startCol, 0]];
  let head = 0;
  let states = 1;
  while (head < queue.length) {
    const [i, j, held] = queue[head];
    head++;
    if (grid[i][j] === "X") return [distance[i][j][held], states];
    for (const [di, dj] of STEPS) {
      const a = i + di;
      const b = j + dj;
      if (!(a >= 0 && a < rows && b >= 0 && b < cols)) continue;
      const cell = grid[a][b];
      if (cell === "#") continue;
      if (isDoor(cell) && !((held >> (cell.charCodeAt(0) - 65)) & 1)) continue;
      let carry = held;
      if (isKey(cell)) carry |= 1 << (cell.charCodeAt(0) - 97);
      if (distance[a][b][carry] < 0) {
        distance[a][b][carry] = distance[i][j][held] + 1;
        queue.push([a, b, carry]);
        states++;
      }
    }
  }
  return [-1, states];
}

/** The node is just (row, column). Doors are either always open or always shut. */
function flat(grid: Grid, doorsBlock: boolean): number {
  const rows = grid.length;
  const cols = grid[0].length;
  const [startRow, startCol] = find(grid, "@");
  const distance: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(-1));
  distance[startRow][startCol] = 0;
  const queue: [number, number][] = [[startRow, startCol]];
  let head = 0;
  while (head < queue.length) {
    const [i, j] = queue[head];
    head++;
    if (grid[i][j] === "X") return distance[i][j];
    for (const [di, dj] of STEPS) {
      const a = i + di;
      const b = j + dj;
      if (!(a >= 0 && a < rows && b >= 0 && b < cols)) continue;
      const cell = grid[a][b];
      if (cell === "#") continue;
      if (doorsBlock && isDoor(cell)) continue;
      if (distance[a][b] < 0) {
        distance[a][b] = distance[i][j] + 1;
        queue.push([a, b]);
      }
    }
  }
  return -1;
}

/** Walk every route that never repeats a (cell, keys) state. No layering. */
function brute(grid: Grid): number {
  const rows = grid.length;
  const cols = grid[0].length;
  const [startRow, startCol] = find(grid, "@");
  let best = INF;
  const onPath: boolean[][][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => new Array(MASKS).fill(false))
  );

  const step = (i: number, j: number, held: number, length: number): void => {
    if (length >= best) return;
    if (grid[i][j] === "X") {
      best = length;
      return;
    }
    onPath[i][j][held] = true;
    for (const [di, dj] of STEPS) {
      const a = i + di;
      const b = j + dj;
      if (!(a >= 0 && a < rows && b >= 0 && b < cols)) continue;
      const cell = grid[a][b];
      if (cell === "#") continue;
      if (isDoor(cell) && !((held >> (cell.charCodeAt(0) - 65)) & 1)) continue;
      let carry = held;
      if (isKey(cell)) carry |= 1 << (cell.charCodeAt(0) - 97);
      if (!onPath[a][b][carry]) step(a, b, carry, length + 1);
    }
    onPath[i][j][held] = false;
  };

  step(startRow, startCol, 0, 0);
  return best >= INF ? -1 : best;
}

const show = (grid: Grid): string => grid.join("/");

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

const CASES: Grid[] = [
  ["@..", "..A", "a#X"],
  ["@..", ".#A", "a#X"],
  ["@..", "..#", "aAX"],
  ["@.a", ".#A", "..X"],
  ["@aA", "###", "..X"],
  ["@.b", "aB.", "A.X"],
];

console.log(
  padEnd("map", 20) + pad("cell and keys", 15) + pad("doors open", 12) +
    pad("doors shut", 12) + pad("every route", 13) + pad("states", 8)
);
for (const grid of CASES) {
  const [answer, states] = withKeys(grid);
  console.log(
    padEnd(show(grid), 20) + pad(answer, 15) + pad(flat(grid, false), 12) +
      pad(flat(grid, true), 12) + pad(brute(grid), 13) + pad(states, 8)
  );
}
console.log();

const PALETTE = "...#ab.AB";

const TRIALS = 3000;
let keyedOk = 0;
let openOk = 0;
let shutOk = 0;
let openShort = 0;
let shutLong = 0;
for (let t = 0; t < TRIALS; t++) {
  const rows = 3;
  const cols = 3;
  const cells: string[] = [];
  for (let k = 0; k < rows * cols; k++) cells.push(PALETTE[rand(PALETTE.length)]);
  cells[0] = "@";
  cells[rows * cols - 1] = "X";
  const grid: Grid = [];
  for (let i = 0; i < rows; i++) grid.push(cells.slice(i * cols, (i + 1) * cols).join(""));
  const truth = brute(grid);
  const [answer] = withKeys(grid);
  if (answer === truth) keyedOk++;
  const loose = flat(grid, false);
  const tight = flat(grid, true);
  if (loose === truth) openOk++;
  if (tight === truth) shutOk++;
  if (truth >= 0 && (loose < 0 || loose < truth)) openShort++;
  if (truth >= 0 && (tight < 0 || tight > truth)) shutLong++;
}

console.log(\`over \${TRIALS} random 3 by 3 maps, against walking every route:\`);
console.log("  the node is a cell and a key set   " + pad(keyedOk, 6));
console.log("  the node is a cell, doors open     " + pad(openOk, 6));
console.log("  the node is a cell, doors shut     " + pad(shutOk, 6));
console.log();
console.log(\`treating doors as open claimed a shorter route than exists \${openShort} times;\`);
console.log(\`treating them as walls missed a route that does exist \${shutLong} times. Both\`);
console.log("run, both return plausible numbers, and both are answering a question with a");
console.log("piece of the state deleted. The key set is not extra bookkeeping -- without");
console.log("it the graph is a different graph.");
`,
            },
            {
              lang: "java",
              code: `// The second modelling decision, and the one that decides whether the program is
// correct rather than merely fast: a node does not have to be a *place*. It is
// whatever has to be true for the rest of the journey to be determined.
//
// The map below has doors and keys. Walking onto a door is only allowed if the
// matching key has already been picked up, so "where am I" is not enough to know
// what moves are legal -- "where am I, and what am I carrying" is. The node is a
// cell paired with the set of keys held, which is the same correction module 28
// kept making, arriving here from a completely different direction.
//
// Maps use keys a, b, c and doors A, B, C, so a key set is three bits and there
// are eight of them.
import java.util.ArrayList;
import java.util.List;

public class Main {
    static final int INF = 1000000000;
    static final int MASKS = 8;
    static final int[][] STEPS = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};

    static int[] find(String[] grid, char what) {
        for (int i = 0; i < grid.length; i++) {
            for (int j = 0; j < grid[i].length(); j++) {
                if (grid[i].charAt(j) == what) return new int[] {i, j};
            }
        }
        return new int[] {-1, -1};
    }

    static boolean isKey(char c) {
        return c >= 'a' && c <= 'c';
    }

    static boolean isDoor(char c) {
        return c >= 'A' && c <= 'C';
    }

    static int visitedStates;

    // The node is (row, column, keys held). Doors are checked against the set.
    static int withKeys(String[] grid) {
        int rows = grid.length, cols = grid[0].length();
        int[] start = find(grid, '@');
        int[][][] distance = new int[rows][cols][MASKS];
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                for (int m = 0; m < MASKS; m++) distance[i][j][m] = -1;
            }
        }
        distance[start[0]][start[1]][0] = 0;
        List<int[]> queue = new ArrayList<>();
        queue.add(new int[] {start[0], start[1], 0});
        int head = 0;
        visitedStates = 1;
        while (head < queue.size()) {
            int[] at = queue.get(head);
            head++;
            int i = at[0], j = at[1], held = at[2];
            if (grid[i].charAt(j) == 'X') return distance[i][j][held];
            for (int[] stepAt : STEPS) {
                int a = i + stepAt[0], b = j + stepAt[1];
                if (!(a >= 0 && a < rows && b >= 0 && b < cols)) continue;
                char cell = grid[a].charAt(b);
                if (cell == '#') continue;
                if (isDoor(cell) && (held >> (cell - 'A') & 1) == 0) continue;
                int carry = held;
                if (isKey(cell)) carry |= 1 << (cell - 'a');
                if (distance[a][b][carry] < 0) {
                    distance[a][b][carry] = distance[i][j][held] + 1;
                    queue.add(new int[] {a, b, carry});
                    visitedStates++;
                }
            }
        }
        return -1;
    }

    // The node is just (row, column). Doors are either always open or always shut.
    static int flat(String[] grid, boolean doorsBlock) {
        int rows = grid.length, cols = grid[0].length();
        int[] start = find(grid, '@');
        int[][] distance = new int[rows][cols];
        for (int[] row : distance) java.util.Arrays.fill(row, -1);
        distance[start[0]][start[1]] = 0;
        List<int[]> queue = new ArrayList<>();
        queue.add(new int[] {start[0], start[1]});
        int head = 0;
        while (head < queue.size()) {
            int[] at = queue.get(head);
            head++;
            int i = at[0], j = at[1];
            if (grid[i].charAt(j) == 'X') return distance[i][j];
            for (int[] stepAt : STEPS) {
                int a = i + stepAt[0], b = j + stepAt[1];
                if (!(a >= 0 && a < rows && b >= 0 && b < cols)) continue;
                char cell = grid[a].charAt(b);
                if (cell == '#') continue;
                if (doorsBlock && isDoor(cell)) continue;
                if (distance[a][b] < 0) {
                    distance[a][b] = distance[i][j] + 1;
                    queue.add(new int[] {a, b});
                }
            }
        }
        return -1;
    }

    static int bruteBest;
    static boolean[][][] onPath;
    static String[] bruteGrid;

    // Walk every route that never repeats a (cell, keys) state. No layering.
    static int brute(String[] grid) {
        int rows = grid.length, cols = grid[0].length();
        int[] start = find(grid, '@');
        bruteBest = INF;
        bruteGrid = grid;
        onPath = new boolean[rows][cols][MASKS];
        bruteStep(start[0], start[1], 0, 0);
        return bruteBest >= INF ? -1 : bruteBest;
    }

    static void bruteStep(int i, int j, int held, int length) {
        int rows = bruteGrid.length, cols = bruteGrid[0].length();
        if (length >= bruteBest) return;
        if (bruteGrid[i].charAt(j) == 'X') {
            bruteBest = length;
            return;
        }
        onPath[i][j][held] = true;
        for (int[] stepAt : STEPS) {
            int a = i + stepAt[0], b = j + stepAt[1];
            if (!(a >= 0 && a < rows && b >= 0 && b < cols)) continue;
            char cell = bruteGrid[a].charAt(b);
            if (cell == '#') continue;
            if (isDoor(cell) && (held >> (cell - 'A') & 1) == 0) continue;
            int carry = held;
            if (isKey(cell)) carry |= 1 << (cell - 'a');
            if (!onPath[a][b][carry]) bruteStep(a, b, carry, length + 1);
        }
        onPath[i][j][held] = false;
    }

    static String show(String[] grid) {
        return String.join("/", grid);
    }

    static String padEnd(Object v, int w) {
        StringBuilder sb = new StringBuilder(String.valueOf(v));
        while (sb.length() < w) sb.append(' ');
        return sb.toString();
    }

    static String pad(Object v, int w) {
        StringBuilder sb = new StringBuilder(String.valueOf(v));
        while (sb.length() < w) sb.insert(0, ' ');
        return sb.toString();
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        String[][] cases = {
            {"@..", "..A", "a#X"},
            {"@..", ".#A", "a#X"},
            {"@..", "..#", "aAX"},
            {"@.a", ".#A", "..X"},
            {"@aA", "###", "..X"},
            {"@.b", "aB.", "A.X"},
        };

        System.out.println(padEnd("map", 20) + pad("cell and keys", 15) + pad("doors open", 12)
            + pad("doors shut", 12) + pad("every route", 13) + pad("states", 8));
        for (String[] grid : cases) {
            int answer = withKeys(grid);
            int states = visitedStates;
            System.out.println(padEnd(show(grid), 20) + pad(answer, 15) + pad(flat(grid, false), 12)
                + pad(flat(grid, true), 12) + pad(brute(grid), 13) + pad(states, 8));
        }
        System.out.println();

        String palette = "...#ab.AB";
        int trials = 3000;
        int keyedOk = 0, openOk = 0, shutOk = 0, openShort = 0, shutLong = 0;
        for (int t = 0; t < trials; t++) {
            int rows = 3, cols = 3;
            char[] cells = new char[rows * cols];
            for (int k = 0; k < rows * cols; k++) cells[k] = palette.charAt(rand(palette.length()));
            cells[0] = '@';
            cells[rows * cols - 1] = 'X';
            String[] grid = new String[rows];
            for (int i = 0; i < rows; i++) grid[i] = new String(cells, i * cols, cols);
            int truth = brute(grid);
            if (withKeys(grid) == truth) keyedOk++;
            int loose = flat(grid, false);
            int tight = flat(grid, true);
            if (loose == truth) openOk++;
            if (tight == truth) shutOk++;
            if (truth >= 0 && (loose < 0 || loose < truth)) openShort++;
            if (truth >= 0 && (tight < 0 || tight > truth)) shutLong++;
        }

        System.out.println("over " + trials + " random 3 by 3 maps, against walking every route:");
        System.out.println("  the node is a cell and a key set   " + pad(keyedOk, 6));
        System.out.println("  the node is a cell, doors open     " + pad(openOk, 6));
        System.out.println("  the node is a cell, doors shut     " + pad(shutOk, 6));
        System.out.println();
        System.out.println("treating doors as open claimed a shorter route than exists " + openShort + " times;");
        System.out.println("treating them as walls missed a route that does exist " + shutLong + " times. Both");
        System.out.println("run, both return plausible numbers, and both are answering a question with a");
        System.out.println("piece of the state deleted. The key set is not extra bookkeeping -- without");
        System.out.println("it the graph is a different graph.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The second modelling decision, and the one that decides whether the program is
// correct rather than merely fast: a node does not have to be a *place*. It is
// whatever has to be true for the rest of the journey to be determined.
//
// The map below has doors and keys. Walking onto a door is only allowed if the
// matching key has already been picked up, so "where am I" is not enough to know
// what moves are legal -- "where am I, and what am I carrying" is. The node is a
// cell paired with the set of keys held, which is the same correction module 28
// kept making, arriving here from a completely different direction.
//
// Maps use keys a, b, c and doors A, B, C, so a key set is three bits and there
// are eight of them.
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

using Grid = std::vector<std::string>;

static const int INF = 1000000000;
static const int MASKS = 8;
static const std::array<std::array<int, 2>, 4> STEPS = {{{-1, 0}, {1, 0}, {0, -1}, {0, 1}}};

std::array<int, 2> find(const Grid &grid, char what) {
    for (size_t i = 0; i < grid.size(); i++) {
        for (size_t j = 0; j < grid[i].size(); j++) {
            if (grid[i][j] == what) return {static_cast<int>(i), static_cast<int>(j)};
        }
    }
    return {-1, -1};
}

bool isKey(char c) { return c >= 'a' && c <= 'c'; }
bool isDoor(char c) { return c >= 'A' && c <= 'C'; }

// The node is (row, column, keys held). Doors are checked against the set.
std::pair<int, int> withKeys(const Grid &grid) {
    int rows = static_cast<int>(grid.size()), cols = static_cast<int>(grid[0].size());
    auto start = find(grid, '@');
    std::vector<std::vector<std::vector<int>>> distance(
        rows, std::vector<std::vector<int>>(cols, std::vector<int>(MASKS, -1)));
    distance[start[0]][start[1]][0] = 0;
    std::vector<std::array<int, 3>> queue = {{start[0], start[1], 0}};
    int states = 1;
    for (size_t head = 0; head < queue.size(); head++) {
        int i = queue[head][0], j = queue[head][1], held = queue[head][2];
        if (grid[i][j] == 'X') return {distance[i][j][held], states};
        for (const auto &s : STEPS) {
            int a = i + s[0], b = j + s[1];
            if (!(a >= 0 && a < rows && b >= 0 && b < cols)) continue;
            char cell = grid[a][b];
            if (cell == '#') continue;
            if (isDoor(cell) && !(held >> (cell - 'A') & 1)) continue;
            int carry = held;
            if (isKey(cell)) carry |= 1 << (cell - 'a');
            if (distance[a][b][carry] < 0) {
                distance[a][b][carry] = distance[i][j][held] + 1;
                queue.push_back({a, b, carry});
                states++;
            }
        }
    }
    return {-1, states};
}

// The node is just (row, column). Doors are either always open or always shut.
int flat(const Grid &grid, bool doorsBlock) {
    int rows = static_cast<int>(grid.size()), cols = static_cast<int>(grid[0].size());
    auto start = find(grid, '@');
    std::vector<std::vector<int>> distance(rows, std::vector<int>(cols, -1));
    distance[start[0]][start[1]] = 0;
    std::vector<std::array<int, 2>> queue = {{start[0], start[1]}};
    for (size_t head = 0; head < queue.size(); head++) {
        int i = queue[head][0], j = queue[head][1];
        if (grid[i][j] == 'X') return distance[i][j];
        for (const auto &s : STEPS) {
            int a = i + s[0], b = j + s[1];
            if (!(a >= 0 && a < rows && b >= 0 && b < cols)) continue;
            char cell = grid[a][b];
            if (cell == '#') continue;
            if (doorsBlock && isDoor(cell)) continue;
            if (distance[a][b] < 0) {
                distance[a][b] = distance[i][j] + 1;
                queue.push_back({a, b});
            }
        }
    }
    return -1;
}

void bruteStep(const Grid &grid, int i, int j, int held, int length, int &best,
               std::vector<std::vector<std::vector<bool>>> &onPath) {
    int rows = static_cast<int>(grid.size()), cols = static_cast<int>(grid[0].size());
    if (length >= best) return;
    if (grid[i][j] == 'X') {
        best = length;
        return;
    }
    onPath[i][j][held] = true;
    for (const auto &s : STEPS) {
        int a = i + s[0], b = j + s[1];
        if (!(a >= 0 && a < rows && b >= 0 && b < cols)) continue;
        char cell = grid[a][b];
        if (cell == '#') continue;
        if (isDoor(cell) && !(held >> (cell - 'A') & 1)) continue;
        int carry = held;
        if (isKey(cell)) carry |= 1 << (cell - 'a');
        if (!onPath[a][b][carry]) bruteStep(grid, a, b, carry, length + 1, best, onPath);
    }
    onPath[i][j][held] = false;
}

// Walk every route that never repeats a (cell, keys) state. No layering.
int brute(const Grid &grid) {
    int rows = static_cast<int>(grid.size()), cols = static_cast<int>(grid[0].size());
    auto start = find(grid, '@');
    int best = INF;
    std::vector<std::vector<std::vector<bool>>> onPath(
        rows, std::vector<std::vector<bool>>(cols, std::vector<bool>(MASKS, false)));
    bruteStep(grid, start[0], start[1], 0, 0, best, onPath);
    return best >= INF ? -1 : best;
}

std::string show(const Grid &grid) {
    std::string out;
    for (size_t i = 0; i < grid.size(); i++) {
        if (i > 0) out += "/";
        out += grid[i];
    }
    return out;
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    const std::vector<Grid> cases = {
        {"@..", "..A", "a#X"},
        {"@..", ".#A", "a#X"},
        {"@..", "..#", "aAX"},
        {"@.a", ".#A", "..X"},
        {"@aA", "###", "..X"},
        {"@.b", "aB.", "A.X"},
    };

    std::cout << std::left << std::setw(20) << "map" << std::right << std::setw(15) << "cell and keys"
              << std::setw(12) << "doors open" << std::setw(12) << "doors shut"
              << std::setw(13) << "every route" << std::setw(8) << "states" << "\\n";
    for (const Grid &grid : cases) {
        auto found = withKeys(grid);
        std::cout << std::left << std::setw(20) << show(grid) << std::right
                  << std::setw(15) << found.first << std::setw(12) << flat(grid, false)
                  << std::setw(12) << flat(grid, true) << std::setw(13) << brute(grid)
                  << std::setw(8) << found.second << "\\n";
    }
    std::cout << "\\n";

    const std::string palette = "...#ab.AB";
    const int TRIALS = 3000;
    int keyedOk = 0, openOk = 0, shutOk = 0, openShort = 0, shutLong = 0;
    for (int t = 0; t < TRIALS; t++) {
        const int rows = 3, cols = 3;
        std::string cells;
        for (int k = 0; k < rows * cols; k++) cells += palette[rnd(static_cast<int>(palette.size()))];
        cells[0] = '@';
        cells[rows * cols - 1] = 'X';
        Grid grid;
        for (int i = 0; i < rows; i++) grid.push_back(cells.substr(i * cols, cols));
        int truth = brute(grid);
        if (withKeys(grid).first == truth) keyedOk++;
        int loose = flat(grid, false);
        int tight = flat(grid, true);
        if (loose == truth) openOk++;
        if (tight == truth) shutOk++;
        if (truth >= 0 && (loose < 0 || loose < truth)) openShort++;
        if (truth >= 0 && (tight < 0 || tight > truth)) shutLong++;
    }

    std::cout << "over " << TRIALS << " random 3 by 3 maps, against walking every route:\\n";
    std::cout << "  the node is a cell and a key set   " << std::setw(6) << keyedOk << "\\n";
    std::cout << "  the node is a cell, doors open     " << std::setw(6) << openOk << "\\n";
    std::cout << "  the node is a cell, doors shut     " << std::setw(6) << shutOk << "\\n\\n";
    std::cout << "treating doors as open claimed a shorter route than exists " << openShort << " times;\\n";
    std::cout << "treating them as walls missed a route that does exist " << shutLong << " times. Both\\n";
    std::cout << "run, both return plausible numbers, and both are answering a question with a\\n";
    std::cout << "piece of the state deleted. The key set is not extra bookkeeping -- without\\n";
    std::cout << "it the graph is a different graph.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// The second modelling decision, and the one that decides whether the program is
// correct rather than merely fast: a node does not have to be a *place*. It is
// whatever has to be true for the rest of the journey to be determined.
//
// The map below has doors and keys. Walking onto a door is only allowed if the
// matching key has already been picked up, so "where am I" is not enough to know
// what moves are legal -- "where am I, and what am I carrying" is. The node is a
// cell paired with the set of keys held, which is the same correction module 28
// kept making, arriving here from a completely different direction.
//
// Maps use keys a, b, c and doors A, B, C, so a key set is three bits and there
// are eight of them.

const INF: i32 = 1000000000;
const MASKS: usize = 8;
const STEPS: [(i32, i32); 4] = [(-1, 0), (1, 0), (0, -1), (0, 1)];

type Grid = Vec<String>;

fn at(grid: &[String], i: usize, j: usize) -> u8 {
    grid[i].as_bytes()[j]
}

fn find(grid: &[String], what: u8) -> (usize, usize) {
    for i in 0..grid.len() {
        for j in 0..grid[i].len() {
            if at(grid, i, j) == what {
                return (i, j);
            }
        }
    }
    (0, 0)
}

fn is_key(c: u8) -> bool {
    (b'a'..=b'c').contains(&c)
}

fn is_door(c: u8) -> bool {
    (b'A'..=b'C').contains(&c)
}

/// The node is (row, column, keys held). Doors are checked against the set.
fn with_keys(grid: &[String]) -> (i32, i32) {
    let (rows, cols) = (grid.len(), grid[0].len());
    let (start_row, start_col) = find(grid, b'@');
    let mut distance = vec![vec![vec![-1i32; MASKS]; cols]; rows];
    distance[start_row][start_col][0] = 0;
    let mut queue = vec![(start_row, start_col, 0usize)];
    let mut states = 1;
    let mut head = 0;
    while head < queue.len() {
        let (i, j, held) = queue[head];
        head += 1;
        if at(grid, i, j) == b'X' {
            return (distance[i][j][held], states);
        }
        for (di, dj) in STEPS {
            let (a, b) = (i as i32 + di, j as i32 + dj);
            if !(a >= 0 && a < rows as i32 && b >= 0 && b < cols as i32) {
                continue;
            }
            let (a, b) = (a as usize, b as usize);
            let cell = at(grid, a, b);
            if cell == b'#' {
                continue;
            }
            if is_door(cell) && held >> (cell - b'A') & 1 == 0 {
                continue;
            }
            let mut carry = held;
            if is_key(cell) {
                carry |= 1 << (cell - b'a');
            }
            if distance[a][b][carry] < 0 {
                distance[a][b][carry] = distance[i][j][held] + 1;
                queue.push((a, b, carry));
                states += 1;
            }
        }
    }
    (-1, states)
}

/// The node is just (row, column). Doors are either always open or always shut.
fn flat(grid: &[String], doors_block: bool) -> i32 {
    let (rows, cols) = (grid.len(), grid[0].len());
    let (start_row, start_col) = find(grid, b'@');
    let mut distance = vec![vec![-1i32; cols]; rows];
    distance[start_row][start_col] = 0;
    let mut queue = vec![(start_row, start_col)];
    let mut head = 0;
    while head < queue.len() {
        let (i, j) = queue[head];
        head += 1;
        if at(grid, i, j) == b'X' {
            return distance[i][j];
        }
        for (di, dj) in STEPS {
            let (a, b) = (i as i32 + di, j as i32 + dj);
            if !(a >= 0 && a < rows as i32 && b >= 0 && b < cols as i32) {
                continue;
            }
            let (a, b) = (a as usize, b as usize);
            let cell = at(grid, a, b);
            if cell == b'#' {
                continue;
            }
            if doors_block && is_door(cell) {
                continue;
            }
            if distance[a][b] < 0 {
                distance[a][b] = distance[i][j] + 1;
                queue.push((a, b));
            }
        }
    }
    -1
}

fn brute_step(grid: &[String], i: usize, j: usize, held: usize, length: i32,
              best: &mut i32, on_path: &mut Vec<Vec<Vec<bool>>>) {
    let (rows, cols) = (grid.len(), grid[0].len());
    if length >= *best {
        return;
    }
    if at(grid, i, j) == b'X' {
        *best = length;
        return;
    }
    on_path[i][j][held] = true;
    for (di, dj) in STEPS {
        let (a, b) = (i as i32 + di, j as i32 + dj);
        if !(a >= 0 && a < rows as i32 && b >= 0 && b < cols as i32) {
            continue;
        }
        let (a, b) = (a as usize, b as usize);
        let cell = at(grid, a, b);
        if cell == b'#' {
            continue;
        }
        if is_door(cell) && held >> (cell - b'A') & 1 == 0 {
            continue;
        }
        let mut carry = held;
        if is_key(cell) {
            carry |= 1 << (cell - b'a');
        }
        if !on_path[a][b][carry] {
            brute_step(grid, a, b, carry, length + 1, best, on_path);
        }
    }
    on_path[i][j][held] = false;
}

/// Walk every route that never repeats a (cell, keys) state. No layering.
fn brute(grid: &[String]) -> i32 {
    let (rows, cols) = (grid.len(), grid[0].len());
    let (start_row, start_col) = find(grid, b'@');
    let mut best = INF;
    let mut on_path = vec![vec![vec![false; MASKS]; cols]; rows];
    brute_step(grid, start_row, start_col, 0, 0, &mut best, &mut on_path);
    if best >= INF { -1 } else { best }
}

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
    let cases: Vec<Grid> = vec![
        vec!["@..".into(), "..A".into(), "a#X".into()],
        vec!["@..".into(), ".#A".into(), "a#X".into()],
        vec!["@..".into(), "..#".into(), "aAX".into()],
        vec!["@.a".into(), ".#A".into(), "..X".into()],
        vec!["@aA".into(), "###".into(), "..X".into()],
        vec!["@.b".into(), "aB.".into(), "A.X".into()],
    ];

    println!(
        "{:<20}{:>15}{:>12}{:>12}{:>13}{:>8}",
        "map", "cell and keys", "doors open", "doors shut", "every route", "states"
    );
    for grid in &cases {
        let (answer, states) = with_keys(grid);
        println!(
            "{:<20}{:>15}{:>12}{:>12}{:>13}{:>8}",
            grid.join("/"),
            answer,
            flat(grid, false),
            flat(grid, true),
            brute(grid),
            states
        );
    }
    println!();

    let palette = b"...#ab.AB";
    let trials = 3000;
    let mut rng = Rng { seed: 1 };
    let (mut keyed_ok, mut open_ok, mut shut_ok) = (0, 0, 0);
    let (mut open_short, mut shut_long) = (0, 0);
    for _ in 0..trials {
        let (rows, cols) = (3usize, 3usize);
        let mut cells = vec![0u8; rows * cols];
        for k in 0..rows * cols {
            cells[k] = palette[rng.next(palette.len() as i64) as usize];
        }
        cells[0] = b'@';
        cells[rows * cols - 1] = b'X';
        let mut grid: Grid = Vec::new();
        for i in 0..rows {
            grid.push(String::from_utf8(cells[i * cols..(i + 1) * cols].to_vec()).unwrap());
        }
        let truth = brute(&grid);
        let (answer, _) = with_keys(&grid);
        if answer == truth {
            keyed_ok += 1;
        }
        let loose = flat(&grid, false);
        let tight = flat(&grid, true);
        if loose == truth {
            open_ok += 1;
        }
        if tight == truth {
            shut_ok += 1;
        }
        if truth >= 0 && (loose < 0 || loose < truth) {
            open_short += 1;
        }
        if truth >= 0 && (tight < 0 || tight > truth) {
            shut_long += 1;
        }
    }

    println!("over {} random 3 by 3 maps, against walking every route:", trials);
    println!("  the node is a cell and a key set   {:>6}", keyed_ok);
    println!("  the node is a cell, doors open     {:>6}", open_ok);
    println!("  the node is a cell, doors shut     {:>6}", shut_ok);
    println!();
    println!("treating doors as open claimed a shorter route than exists {} times;", open_short);
    println!("treating them as walls missed a route that does exist {} times. Both", shut_long);
    println!("run, both return plausible numbers, and both are answering a question with a");
    println!("piece of the state deleted. The key set is not extra bookkeeping -- without");
    println!("it the graph is a different graph.");
}
`,
            },
            {
              lang: "go",
              code: `// The second modelling decision, and the one that decides whether the program is
// correct rather than merely fast: a node does not have to be a *place*. It is
// whatever has to be true for the rest of the journey to be determined.
//
// The map below has doors and keys. Walking onto a door is only allowed if the
// matching key has already been picked up, so "where am I" is not enough to know
// what moves are legal -- "where am I, and what am I carrying" is. The node is a
// cell paired with the set of keys held, which is the same correction module 28
// kept making, arriving here from a completely different direction.
//
// Maps use keys a, b, c and doors A, B, C, so a key set is three bits and there
// are eight of them.
package main

import (
	"fmt"
	"strings"
)

const inf = 1000000000
const masks = 8

var steps = [4][2]int{{-1, 0}, {1, 0}, {0, -1}, {0, 1}}

func find(grid []string, what byte) (int, int) {
	for i := range grid {
		for j := 0; j < len(grid[i]); j++ {
			if grid[i][j] == what {
				return i, j
			}
		}
	}
	return -1, -1
}

func isKey(c byte) bool  { return c >= 'a' && c <= 'c' }
func isDoor(c byte) bool { return c >= 'A' && c <= 'C' }

// withKeys makes the node (row, column, keys held); doors are checked against the set.
func withKeys(grid []string) (int, int) {
	rows, cols := len(grid), len(grid[0])
	startRow, startCol := find(grid, '@')
	distance := make([][][]int, rows)
	for i := range distance {
		distance[i] = make([][]int, cols)
		for j := range distance[i] {
			distance[i][j] = make([]int, masks)
			for m := range distance[i][j] {
				distance[i][j][m] = -1
			}
		}
	}
	distance[startRow][startCol][0] = 0
	queue := [][3]int{{startRow, startCol, 0}}
	states := 1
	for head := 0; head < len(queue); head++ {
		i, j, held := queue[head][0], queue[head][1], queue[head][2]
		if grid[i][j] == 'X' {
			return distance[i][j][held], states
		}
		for _, s := range steps {
			a, b := i+s[0], j+s[1]
			if !(a >= 0 && a < rows && b >= 0 && b < cols) {
				continue
			}
			cell := grid[a][b]
			if cell == '#' {
				continue
			}
			if isDoor(cell) && held>>(cell-'A')&1 == 0 {
				continue
			}
			carry := held
			if isKey(cell) {
				carry |= 1 << (cell - 'a')
			}
			if distance[a][b][carry] < 0 {
				distance[a][b][carry] = distance[i][j][held] + 1
				queue = append(queue, [3]int{a, b, carry})
				states++
			}
		}
	}
	return -1, states
}

// flat makes the node just (row, column); doors are always open or always shut.
func flat(grid []string, doorsBlock bool) int {
	rows, cols := len(grid), len(grid[0])
	startRow, startCol := find(grid, '@')
	distance := make([][]int, rows)
	for i := range distance {
		distance[i] = make([]int, cols)
		for j := range distance[i] {
			distance[i][j] = -1
		}
	}
	distance[startRow][startCol] = 0
	queue := [][2]int{{startRow, startCol}}
	for head := 0; head < len(queue); head++ {
		i, j := queue[head][0], queue[head][1]
		if grid[i][j] == 'X' {
			return distance[i][j]
		}
		for _, s := range steps {
			a, b := i+s[0], j+s[1]
			if !(a >= 0 && a < rows && b >= 0 && b < cols) {
				continue
			}
			cell := grid[a][b]
			if cell == '#' {
				continue
			}
			if doorsBlock && isDoor(cell) {
				continue
			}
			if distance[a][b] < 0 {
				distance[a][b] = distance[i][j] + 1
				queue = append(queue, [2]int{a, b})
			}
		}
	}
	return -1
}

// brute walks every route that never repeats a (cell, keys) state.
func brute(grid []string) int {
	rows, cols := len(grid), len(grid[0])
	startRow, startCol := find(grid, '@')
	best := inf
	onPath := make([][][]bool, rows)
	for i := range onPath {
		onPath[i] = make([][]bool, cols)
		for j := range onPath[i] {
			onPath[i][j] = make([]bool, masks)
		}
	}
	var step func(i, j, held, length int)
	step = func(i, j, held, length int) {
		if length >= best {
			return
		}
		if grid[i][j] == 'X' {
			best = length
			return
		}
		onPath[i][j][held] = true
		for _, s := range steps {
			a, b := i+s[0], j+s[1]
			if !(a >= 0 && a < rows && b >= 0 && b < cols) {
				continue
			}
			cell := grid[a][b]
			if cell == '#' {
				continue
			}
			if isDoor(cell) && held>>(cell-'A')&1 == 0 {
				continue
			}
			carry := held
			if isKey(cell) {
				carry |= 1 << (cell - 'a')
			}
			if !onPath[a][b][carry] {
				step(a, b, carry, length+1)
			}
		}
		onPath[i][j][held] = false
	}
	step(startRow, startCol, 0, 0)
	if best >= inf {
		return -1
	}
	return best
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	cases := [][]string{
		{"@..", "..A", "a#X"},
		{"@..", ".#A", "a#X"},
		{"@..", "..#", "aAX"},
		{"@.a", ".#A", "..X"},
		{"@aA", "###", "..X"},
		{"@.b", "aB.", "A.X"},
	}

	fmt.Printf("%-20s%15s%12s%12s%13s%8s\\n", "map", "cell and keys", "doors open",
		"doors shut", "every route", "states")
	for _, grid := range cases {
		answer, states := withKeys(grid)
		fmt.Printf("%-20s%15d%12d%12d%13d%8d\\n", strings.Join(grid, "/"), answer,
			flat(grid, false), flat(grid, true), brute(grid), states)
	}
	fmt.Println()

	palette := "...#ab.AB"
	trials := 3000
	keyedOk, openOk, shutOk, openShort, shutLong := 0, 0, 0, 0, 0
	for t := 0; t < trials; t++ {
		rows, cols := 3, 3
		cells := make([]byte, rows*cols)
		for k := range cells {
			cells[k] = palette[rand(len(palette))]
		}
		cells[0] = '@'
		cells[rows*cols-1] = 'X'
		grid := make([]string, rows)
		for i := 0; i < rows; i++ {
			grid[i] = string(cells[i*cols : (i+1)*cols])
		}
		truth := brute(grid)
		answer, _ := withKeys(grid)
		if answer == truth {
			keyedOk++
		}
		loose := flat(grid, false)
		tight := flat(grid, true)
		if loose == truth {
			openOk++
		}
		if tight == truth {
			shutOk++
		}
		if truth >= 0 && (loose < 0 || loose < truth) {
			openShort++
		}
		if truth >= 0 && (tight < 0 || tight > truth) {
			shutLong++
		}
	}

	fmt.Printf("over %d random 3 by 3 maps, against walking every route:\\n", trials)
	fmt.Printf("  the node is a cell and a key set   %6d\\n", keyedOk)
	fmt.Printf("  the node is a cell, doors open     %6d\\n", openOk)
	fmt.Printf("  the node is a cell, doors shut     %6d\\n", shutOk)
	fmt.Println()
	fmt.Printf("treating doors as open claimed a shorter route than exists %d times;\\n", openShort)
	fmt.Printf("treating them as walls missed a route that does exist %d times. Both\\n", shutLong)
	fmt.Println("run, both return plausible numbers, and both are answering a question with a")
	fmt.Println("piece of the state deleted. The key set is not extra bookkeeping -- without")
	fmt.Println("it the graph is a different graph.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "A node that is only a place loses the rules",
          body: "If which moves are legal depends on anything but the current node, that anything belongs in the node. Deleting the key set from a doors-and-keys map gives answers that are right on about 80 percent of random maps and quietly wrong on the rest, in whichever direction the deletion happened to point.",
        },
        {
          title: "Both ways of getting it wrong look reasonable",
          body: "Treating doors as open under-reports the distance; treating them as walls over-reports it or reports no route. Neither crashes, and both produce small plausible integers. The test that catches it is trying to write the legal-move rule from the node alone.",
        },
      ],
    },
    {
      id: "the-graph-never-built",
      heading: "The graph that is never built",
      body: [
        "The third decision is that the graph often should not exist at all.",
        "A search does not need a data structure. It needs a way to ask a node for its neighbours, and if that question can be answered by a function, nothing has to be stored but the frontier. \"From `start`, reach `target` by doubling or subtracting one\" has a perfectly definite graph behind it, and building that graph would mean allocating every node in the range and every edge between them, the overwhelming majority of which the search will never look at.",
        "The example runs both and counts. The implicit search touched 21,381 nodes; materialising the graph first built 73,941 edges before the search had started. Same answers on all 3,000 trials, and the same answers again against an iterative-deepening search that has neither a graph nor a queue.",
        "There is a catch, and the example walks into it deliberately. An implicit graph over the integers is infinite, so something has to bound it, and that bound is a modelling decision like any other. The natural guess is twice the target: doubling past that is never useful, since every later move can only subtract one. That guess is right whenever the start already fits underneath it, and it silently reports no route at all when the start is larger than the target \u2014 wrong on 351 of 3,000 random pairs, all of them reported as unreachable rather than as an error.",
        "Which is the general hazard of implicit graphs: a bound that is too small does not crash, it deletes nodes. The fix here is one `max`, and the way it was found was comparing against a bound far wider than necessary \u2014 the same \"check it against something slower\" habit the previous two modules ran on.",
      ],
      examples: [
        {
          id: "implicit-against-materialised",
          title: "The same search with the graph built, generated, and absent",
          lang: "python",
          code: `# The third modelling decision: a graph does not have to exist.
#
# "From \`start\`, reach \`target\` using only doubling and subtracting one, in as
# few steps as possible" has nodes and edges in it, but there is no list of
# either anywhere in the problem, and there is no reason to build one. A
# breadth-first search asks a node for its neighbours; if a function can answer
# that, the graph never has to be materialised.
#
# The cost of materialising it is the second half of the lesson. Building the
# whole adjacency list means paying for every edge in the space, including the
# overwhelming majority the search will never look at.
INF = 10 ** 9


def implicit(start, target, cap):
    """Ask for neighbours on demand. Nothing is stored but the frontier."""
    distance = [-1] * (cap + 1)
    if start > cap:
        return -1, 0
    distance[start] = 0
    queue = [start]
    head = 0
    touched = 0
    while head < len(queue):
        v = queue[head]
        head += 1
        touched += 1
        if v == target:
            return distance[v], touched
        for u in (v * 2, v - 1):
            if 0 <= u <= cap and distance[u] < 0:
                distance[u] = distance[v] + 1
                queue.append(u)
    return -1, touched


def materialised(start, target, cap):
    """Build every edge first, then run the same search over the stored lists."""
    neighbours = [[] for _ in range(cap + 1)]
    edges = 0
    for v in range(cap + 1):
        for u in (v * 2, v - 1):
            if 0 <= u <= cap:
                neighbours[v].append(u)
                edges += 1
    distance = [-1] * (cap + 1)
    if start > cap:
        return -1, edges
    distance[start] = 0
    queue = [start]
    head = 0
    while head < len(queue):
        v = queue[head]
        head += 1
        if v == target:
            return distance[v], edges
        for u in neighbours[v]:
            if distance[u] < 0:
                distance[u] = distance[v] + 1
                queue.append(u)
    return -1, edges


def deepening(start, target, cap, limit):
    """No graph and no queue: try every sequence of moves up to \`limit\` long."""
    def step(value, left):
        if value == target:
            return True
        if left == 0:
            return False
        for u in (value * 2, value - 1):
            if 0 <= u <= cap and step(u, left - 1):
                return True
        return False

    for depth in range(limit + 1):
        if step(start, depth):
            return depth
    return -1


def roomy(start, target):
    """Doubling past twice the target is never useful, and the start has to fit."""
    return max(start, 2 * target) + 2


CASES = [
    (2, 3),
    (5, 8),
    (3, 10),
    (1, 100),
    (7, 7),
    (10, 1),
    (11, 1),
]

print(f"{'from':>6}{'to':>6}{'implicit':>10}{'materialised':>14}{'deepening':>11}"
      f"{'nodes touched':>15}{'edges built':>13}")
for start, target in CASES:
    cap = roomy(start, target)
    steps, touched = implicit(start, target, cap)
    built, edges = materialised(start, target, cap)
    print(f"{start:>6}{target:>6}{steps:>10}{built:>14}"
          f"{deepening(start, target, cap, 12):>11}{touched:>15}{edges:>13}")
print()

# The cap is a modelling decision too, and the obvious guess is wrong. Twice the
# target is enough room above, but it is not enough room to hold a start that is
# already larger than that.
print("and the cap, which is a modelling decision too:")
print(f"{'from':>6}{'to':>6}{'cap 2t+2':>10}{'cap max(s,2t)+2':>17}{'a very wide cap':>17}")
for start, target in CASES:
    guessed, _ = implicit(start, target, 2 * target + 2)
    chosen, _ = implicit(start, target, roomy(start, target))
    wide, _ = implicit(start, target, 16 * target + 16 + start)
    print(f"{start:>6}{target:>6}{guessed:>10}{chosen:>17}{wide:>17}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
same_answer = 0
same_as_deepening = 0
chosen_ok = 0
guessed_ok = 0
touched_total = 0
edges_total = 0
for _ in range(TRIALS):
    start = rand(12)
    target = 1 + rand(12)
    cap = roomy(start, target)
    steps, touched = implicit(start, target, cap)
    built, edges = materialised(start, target, cap)
    if steps == built:
        same_answer += 1
    if steps == deepening(start, target, cap, 12):
        same_as_deepening += 1
    wide, _ = implicit(start, target, 16 * target + 16 + start)
    if steps == wide:
        chosen_ok += 1
    guessed, _ = implicit(start, target, 2 * target + 2)
    if guessed == wide:
        guessed_ok += 1
    touched_total += touched
    edges_total += edges

print(f"over {TRIALS} random pairs below 12, against a cap far wider than needed:")
print(f"  the implicit search              {chosen_ok:>6}")
print(f"  the guessed cap of 2t+2          {guessed_ok:>6}")
print()
print(f"and against each other:")
print(f"  implicit against materialised    {same_answer:>6}")
print(f"  implicit against deepening       {same_as_deepening:>6}")
print()
print(f"the implicit search touched {touched_total} nodes; materialising the graph first")
print(f"built {edges_total} edges before the search even started. Same graph, same")
print("answers -- one of them is described by a function and the other by a data")
print("structure, and only one of those has to be paid for up front.")
print()
print("and the cap is not a detail. 2t+2 is the natural guess, it is right whenever")
print("the start already fits under it, and it silently reports no route at all when")
print("the start is larger than the target -- which is the modelling equivalent of")
print("leaving nodes out of the graph.")
`,
          output: `  from    to  implicit  materialised  deepening  nodes touched  edges built
     2     3         2             2          2              5           13
     5     8         2             2          2              5           28
     3    10         3             3          3              9           34
     1   100        10            10         10             92          304
     7     7         0             0          0              1           25
    10     1         9             9          9             12           19
    11     1        10            10         10             12           20

and the cap, which is a modelling decision too:
  from    to  cap 2t+2  cap max(s,2t)+2  a very wide cap
     2     3         2                2                2
     5     8         2                2                2
     3    10         3                3                3
     1   100        10               10               10
     7     7         0                0                0
    10     1        -1                9                9
    11     1        -1               10               10

over 3000 random pairs below 12, against a cap far wider than needed:
  the implicit search                3000
  the guessed cap of 2t+2            2649

and against each other:
  implicit against materialised      3000
  implicit against deepening         3000

the implicit search touched 21381 nodes; materialising the graph first
built 73941 edges before the search even started. Same graph, same
answers -- one of them is described by a function and the other by a data
structure, and only one of those has to be paid for up front.

and the cap is not a detail. 2t+2 is the natural guess, it is right whenever
the start already fits under it, and it silently reports no route at all when
the start is larger than the target -- which is the modelling equivalent of
leaving nodes out of the graph.`,
          explanation:
            "The same search with the graph built and with it generated on demand, checked against an iterative deepening search that uses neither. The second table is the trap: the bound on an implicit space is a modelling decision, and the obvious guess deletes nodes rather than failing.",
          alternates: [
            {
              lang: "javascript",
              code: `// The third modelling decision: a graph does not have to exist.
//
// "From \`start\`, reach \`target\` using only doubling and subtracting one, in as
// few steps as possible" has nodes and edges in it, but there is no list of
// either anywhere in the problem, and there is no reason to build one. A
// breadth-first search asks a node for its neighbours; if a function can answer
// that, the graph never has to be materialised.
//
// The cost of materialising it is the second half of the lesson. Building the
// whole adjacency list means paying for every edge in the space, including the
// overwhelming majority the search will never look at.

/** Ask for neighbours on demand. Nothing is stored but the frontier. */
function implicit(start, target, cap) {
  const distance = new Array(cap + 1).fill(-1);
  if (start > cap) return [-1, 0];
  distance[start] = 0;
  const queue = [start];
  let head = 0;
  let touched = 0;
  while (head < queue.length) {
    const v = queue[head];
    head++;
    touched++;
    if (v === target) return [distance[v], touched];
    for (const u of [v * 2, v - 1]) {
      if (u >= 0 && u <= cap && distance[u] < 0) {
        distance[u] = distance[v] + 1;
        queue.push(u);
      }
    }
  }
  return [-1, touched];
}

/** Build every edge first, then run the same search over the stored lists. */
function materialised(start, target, cap) {
  const neighbours = Array.from({ length: cap + 1 }, () => []);
  let edges = 0;
  for (let v = 0; v <= cap; v++) {
    for (const u of [v * 2, v - 1]) {
      if (u >= 0 && u <= cap) {
        neighbours[v].push(u);
        edges++;
      }
    }
  }
  const distance = new Array(cap + 1).fill(-1);
  if (start > cap) return [-1, edges];
  distance[start] = 0;
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const v = queue[head];
    head++;
    if (v === target) return [distance[v], edges];
    for (const u of neighbours[v]) {
      if (distance[u] < 0) {
        distance[u] = distance[v] + 1;
        queue.push(u);
      }
    }
  }
  return [-1, edges];
}

/** No graph and no queue: try every sequence of moves up to \`limit\` long. */
function deepening(start, target, cap, limit) {
  const step = (value, left) => {
    if (value === target) return true;
    if (left === 0) return false;
    for (const u of [value * 2, value - 1]) {
      if (u >= 0 && u <= cap && step(u, left - 1)) return true;
    }
    return false;
  };
  for (let depth = 0; depth <= limit; depth++) {
    if (step(start, depth)) return depth;
  }
  return -1;
}

/** Doubling past twice the target is never useful, and the start has to fit. */
const roomy = (start, target) => Math.max(start, 2 * target) + 2;

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v, w) => String(v).padStart(w);

const CASES = [
  [2, 3],
  [5, 8],
  [3, 10],
  [1, 100],
  [7, 7],
  [10, 1],
  [11, 1],
];

console.log(
  pad("from", 6) + pad("to", 6) + pad("implicit", 10) + pad("materialised", 14) +
    pad("deepening", 11) + pad("nodes touched", 15) + pad("edges built", 13)
);
for (const [start, target] of CASES) {
  const cap = roomy(start, target);
  const [steps, touched] = implicit(start, target, cap);
  const [built, edges] = materialised(start, target, cap);
  console.log(
    pad(start, 6) + pad(target, 6) + pad(steps, 10) + pad(built, 14) +
      pad(deepening(start, target, cap, 12), 11) + pad(touched, 15) + pad(edges, 13)
  );
}
console.log();

// The cap is a modelling decision too, and the obvious guess is wrong. Twice the
// target is enough room above, but it is not enough room to hold a start that is
// already larger than that.
console.log("and the cap, which is a modelling decision too:");
console.log(pad("from", 6) + pad("to", 6) + pad("cap 2t+2", 10) + pad("cap max(s,2t)+2", 17) + pad("a very wide cap", 17));
for (const [start, target] of CASES) {
  const [guessed] = implicit(start, target, 2 * target + 2);
  const [chosen] = implicit(start, target, roomy(start, target));
  const [wide] = implicit(start, target, 16 * target + 16 + start);
  console.log(pad(start, 6) + pad(target, 6) + pad(guessed, 10) + pad(chosen, 17) + pad(wide, 17));
}
console.log();

const TRIALS = 3000;
let sameAnswer = 0;
let sameAsDeepening = 0;
let chosenOk = 0;
let guessedOk = 0;
let touchedTotal = 0;
let edgesTotal = 0;
for (let t = 0; t < TRIALS; t++) {
  const start = rand(12);
  const target = 1 + rand(12);
  const cap = roomy(start, target);
  const [steps, touched] = implicit(start, target, cap);
  const [built, edges] = materialised(start, target, cap);
  if (steps === built) sameAnswer++;
  if (steps === deepening(start, target, cap, 12)) sameAsDeepening++;
  const [wide] = implicit(start, target, 16 * target + 16 + start);
  if (steps === wide) chosenOk++;
  const [guessed] = implicit(start, target, 2 * target + 2);
  if (guessed === wide) guessedOk++;
  touchedTotal += touched;
  edgesTotal += edges;
}

console.log(\`over \${TRIALS} random pairs below 12, against a cap far wider than needed:\`);
console.log("  the implicit search              " + pad(chosenOk, 6));
console.log("  the guessed cap of 2t+2          " + pad(guessedOk, 6));
console.log();
console.log("and against each other:");
console.log("  implicit against materialised    " + pad(sameAnswer, 6));
console.log("  implicit against deepening       " + pad(sameAsDeepening, 6));
console.log();
console.log(\`the implicit search touched \${touchedTotal} nodes; materialising the graph first\`);
console.log(\`built \${edgesTotal} edges before the search even started. Same graph, same\`);
console.log("answers -- one of them is described by a function and the other by a data");
console.log("structure, and only one of those has to be paid for up front.");
console.log();
console.log("and the cap is not a detail. 2t+2 is the natural guess, it is right whenever");
console.log("the start already fits under it, and it silently reports no route at all when");
console.log("the start is larger than the target -- which is the modelling equivalent of");
console.log("leaving nodes out of the graph.");
`,
            },
            {
              lang: "typescript",
              code: `// The third modelling decision: a graph does not have to exist.
//
// "From \`start\`, reach \`target\` using only doubling and subtracting one, in as
// few steps as possible" has nodes and edges in it, but there is no list of
// either anywhere in the problem, and there is no reason to build one. A
// breadth-first search asks a node for its neighbours; if a function can answer
// that, the graph never has to be materialised.
//
// The cost of materialising it is the second half of the lesson. Building the
// whole adjacency list means paying for every edge in the space, including the
// overwhelming majority the search will never look at.

/** Ask for neighbours on demand. Nothing is stored but the frontier. */
function implicit(start: number, target: number, cap: number): [number, number] {
  const distance = new Array(cap + 1).fill(-1);
  if (start > cap) return [-1, 0];
  distance[start] = 0;
  const queue = [start];
  let head = 0;
  let touched = 0;
  while (head < queue.length) {
    const v = queue[head];
    head++;
    touched++;
    if (v === target) return [distance[v], touched];
    for (const u of [v * 2, v - 1]) {
      if (u >= 0 && u <= cap && distance[u] < 0) {
        distance[u] = distance[v] + 1;
        queue.push(u);
      }
    }
  }
  return [-1, touched];
}

/** Build every edge first, then run the same search over the stored lists. */
function materialised(start: number, target: number, cap: number): [number, number] {
  const neighbours: number[][] = Array.from({ length: cap + 1 }, () => []);
  let edges = 0;
  for (let v = 0; v <= cap; v++) {
    for (const u of [v * 2, v - 1]) {
      if (u >= 0 && u <= cap) {
        neighbours[v].push(u);
        edges++;
      }
    }
  }
  const distance = new Array(cap + 1).fill(-1);
  if (start > cap) return [-1, edges];
  distance[start] = 0;
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const v = queue[head];
    head++;
    if (v === target) return [distance[v], edges];
    for (const u of neighbours[v]) {
      if (distance[u] < 0) {
        distance[u] = distance[v] + 1;
        queue.push(u);
      }
    }
  }
  return [-1, edges];
}

/** No graph and no queue: try every sequence of moves up to \`limit\` long. */
function deepening(start: number, target: number, cap: number, limit: number): number {
  const step = (value: number, left: number): boolean => {
    if (value === target) return true;
    if (left === 0) return false;
    for (const u of [value * 2, value - 1]) {
      if (u >= 0 && u <= cap && step(u, left - 1)) return true;
    }
    return false;
  };
  for (let depth = 0; depth <= limit; depth++) {
    if (step(start, depth)) return depth;
  }
  return -1;
}

/** Doubling past twice the target is never useful, and the start has to fit. */
const roomy = (start: number, target: number): number => Math.max(start, 2 * target) + 2;

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);

const CASES: [number, number][] = [
  [2, 3],
  [5, 8],
  [3, 10],
  [1, 100],
  [7, 7],
  [10, 1],
  [11, 1],
];

console.log(
  pad("from", 6) + pad("to", 6) + pad("implicit", 10) + pad("materialised", 14) +
    pad("deepening", 11) + pad("nodes touched", 15) + pad("edges built", 13)
);
for (const [start, target] of CASES) {
  const cap = roomy(start, target);
  const [steps, touched] = implicit(start, target, cap);
  const [built, edges] = materialised(start, target, cap);
  console.log(
    pad(start, 6) + pad(target, 6) + pad(steps, 10) + pad(built, 14) +
      pad(deepening(start, target, cap, 12), 11) + pad(touched, 15) + pad(edges, 13)
  );
}
console.log();

// The cap is a modelling decision too, and the obvious guess is wrong. Twice the
// target is enough room above, but it is not enough room to hold a start that is
// already larger than that.
console.log("and the cap, which is a modelling decision too:");
console.log(pad("from", 6) + pad("to", 6) + pad("cap 2t+2", 10) + pad("cap max(s,2t)+2", 17) + pad("a very wide cap", 17));
for (const [start, target] of CASES) {
  const [guessed] = implicit(start, target, 2 * target + 2);
  const [chosen] = implicit(start, target, roomy(start, target));
  const [wide] = implicit(start, target, 16 * target + 16 + start);
  console.log(pad(start, 6) + pad(target, 6) + pad(guessed, 10) + pad(chosen, 17) + pad(wide, 17));
}
console.log();

const TRIALS = 3000;
let sameAnswer = 0;
let sameAsDeepening = 0;
let chosenOk = 0;
let guessedOk = 0;
let touchedTotal = 0;
let edgesTotal = 0;
for (let t = 0; t < TRIALS; t++) {
  const start = rand(12);
  const target = 1 + rand(12);
  const cap = roomy(start, target);
  const [steps, touched] = implicit(start, target, cap);
  const [built, edges] = materialised(start, target, cap);
  if (steps === built) sameAnswer++;
  if (steps === deepening(start, target, cap, 12)) sameAsDeepening++;
  const [wide] = implicit(start, target, 16 * target + 16 + start);
  if (steps === wide) chosenOk++;
  const [guessed] = implicit(start, target, 2 * target + 2);
  if (guessed === wide) guessedOk++;
  touchedTotal += touched;
  edgesTotal += edges;
}

console.log(\`over \${TRIALS} random pairs below 12, against a cap far wider than needed:\`);
console.log("  the implicit search              " + pad(chosenOk, 6));
console.log("  the guessed cap of 2t+2          " + pad(guessedOk, 6));
console.log();
console.log("and against each other:");
console.log("  implicit against materialised    " + pad(sameAnswer, 6));
console.log("  implicit against deepening       " + pad(sameAsDeepening, 6));
console.log();
console.log(\`the implicit search touched \${touchedTotal} nodes; materialising the graph first\`);
console.log(\`built \${edgesTotal} edges before the search even started. Same graph, same\`);
console.log("answers -- one of them is described by a function and the other by a data");
console.log("structure, and only one of those has to be paid for up front.");
console.log();
console.log("and the cap is not a detail. 2t+2 is the natural guess, it is right whenever");
console.log("the start already fits under it, and it silently reports no route at all when");
console.log("the start is larger than the target -- which is the modelling equivalent of");
console.log("leaving nodes out of the graph.");
`,
            },
            {
              lang: "java",
              code: `// The third modelling decision: a graph does not have to exist.
//
// "From \`start\`, reach \`target\` using only doubling and subtracting one, in as
// few steps as possible" has nodes and edges in it, but there is no list of
// either anywhere in the problem, and there is no reason to build one. A
// breadth-first search asks a node for its neighbours; if a function can answer
// that, the graph never has to be materialised.
//
// The cost of materialising it is the second half of the lesson. Building the
// whole adjacency list means paying for every edge in the space, including the
// overwhelming majority the search will never look at.
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
    static long counted;

    // Ask for neighbours on demand. Nothing is stored but the frontier.
    static int implicitSearch(int start, int target, int cap) {
        int[] distance = new int[cap + 1];
        Arrays.fill(distance, -1);
        counted = 0;
        if (start > cap) return -1;
        distance[start] = 0;
        List<Integer> queue = new ArrayList<>();
        queue.add(start);
        int head = 0;
        while (head < queue.size()) {
            int v = queue.get(head);
            head++;
            counted++;
            if (v == target) return distance[v];
            for (int u : new int[] {v * 2, v - 1}) {
                if (u >= 0 && u <= cap && distance[u] < 0) {
                    distance[u] = distance[v] + 1;
                    queue.add(u);
                }
            }
        }
        return -1;
    }

    // Build every edge first, then run the same search over the stored lists.
    static int materialised(int start, int target, int cap) {
        List<List<Integer>> neighbours = new ArrayList<>();
        for (int v = 0; v <= cap; v++) neighbours.add(new ArrayList<>());
        counted = 0;
        for (int v = 0; v <= cap; v++) {
            for (int u : new int[] {v * 2, v - 1}) {
                if (u >= 0 && u <= cap) {
                    neighbours.get(v).add(u);
                    counted++;
                }
            }
        }
        int[] distance = new int[cap + 1];
        Arrays.fill(distance, -1);
        if (start > cap) return -1;
        distance[start] = 0;
        List<Integer> queue = new ArrayList<>();
        queue.add(start);
        int head = 0;
        while (head < queue.size()) {
            int v = queue.get(head);
            head++;
            if (v == target) return distance[v];
            for (int u : neighbours.get(v)) {
                if (distance[u] < 0) {
                    distance[u] = distance[v] + 1;
                    queue.add(u);
                }
            }
        }
        return -1;
    }

    // No graph and no queue: try every sequence of moves up to \`limit\` long.
    static int deepening(int start, int target, int cap, int limit) {
        for (int depth = 0; depth <= limit; depth++) {
            if (deepStep(start, target, cap, depth)) return depth;
        }
        return -1;
    }

    static boolean deepStep(int value, int target, int cap, int left) {
        if (value == target) return true;
        if (left == 0) return false;
        for (int u : new int[] {value * 2, value - 1}) {
            if (u >= 0 && u <= cap && deepStep(u, target, cap, left - 1)) return true;
        }
        return false;
    }

    // Doubling past twice the target is never useful, and the start has to fit.
    static int roomy(int start, int target) {
        return Math.max(start, 2 * target) + 2;
    }

    static String pad(Object v, int w) {
        StringBuilder sb = new StringBuilder(String.valueOf(v));
        while (sb.length() < w) sb.insert(0, ' ');
        return sb.toString();
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        int[][] cases = {{2, 3}, {5, 8}, {3, 10}, {1, 100}, {7, 7}, {10, 1}, {11, 1}};

        System.out.println(pad("from", 6) + pad("to", 6) + pad("implicit", 10)
            + pad("materialised", 14) + pad("deepening", 11) + pad("nodes touched", 15)
            + pad("edges built", 13));
        for (int[] pair : cases) {
            int start = pair[0], target = pair[1];
            int cap = roomy(start, target);
            int steps = implicitSearch(start, target, cap);
            long touched = counted;
            int built = materialised(start, target, cap);
            long edges = counted;
            System.out.println(pad(start, 6) + pad(target, 6) + pad(steps, 10) + pad(built, 14)
                + pad(deepening(start, target, cap, 12), 11) + pad(touched, 15) + pad(edges, 13));
        }
        System.out.println();

        // The cap is a modelling decision too, and the obvious guess is wrong. Twice the
        // target is enough room above, but it is not enough room to hold a start that is
        // already larger than that.
        System.out.println("and the cap, which is a modelling decision too:");
        System.out.println(pad("from", 6) + pad("to", 6) + pad("cap 2t+2", 10)
            + pad("cap max(s,2t)+2", 17) + pad("a very wide cap", 17));
        for (int[] pair : cases) {
            int start = pair[0], target = pair[1];
            System.out.println(pad(start, 6) + pad(target, 6)
                + pad(implicitSearch(start, target, 2 * target + 2), 10)
                + pad(implicitSearch(start, target, roomy(start, target)), 17)
                + pad(implicitSearch(start, target, 16 * target + 16 + start), 17));
        }
        System.out.println();

        int trials = 3000;
        int sameAnswer = 0, sameAsDeepening = 0, chosenOk = 0, guessedOk = 0;
        long touchedTotal = 0, edgesTotal = 0;
        for (int t = 0; t < trials; t++) {
            int start = rand(12);
            int target = 1 + rand(12);
            int cap = roomy(start, target);
            int steps = implicitSearch(start, target, cap);
            long touched = counted;
            int built = materialised(start, target, cap);
            long edges = counted;
            if (steps == built) sameAnswer++;
            if (steps == deepening(start, target, cap, 12)) sameAsDeepening++;
            int wide = implicitSearch(start, target, 16 * target + 16 + start);
            if (steps == wide) chosenOk++;
            int guessed = implicitSearch(start, target, 2 * target + 2);
            if (guessed == wide) guessedOk++;
            touchedTotal += touched;
            edgesTotal += edges;
        }

        System.out.println("over " + trials + " random pairs below 12, against a cap far wider than needed:");
        System.out.println("  the implicit search              " + pad(chosenOk, 6));
        System.out.println("  the guessed cap of 2t+2          " + pad(guessedOk, 6));
        System.out.println();
        System.out.println("and against each other:");
        System.out.println("  implicit against materialised    " + pad(sameAnswer, 6));
        System.out.println("  implicit against deepening       " + pad(sameAsDeepening, 6));
        System.out.println();
        System.out.println("the implicit search touched " + touchedTotal
            + " nodes; materialising the graph first");
        System.out.println("built " + edgesTotal + " edges before the search even started. Same graph, same");
        System.out.println("answers -- one of them is described by a function and the other by a data");
        System.out.println("structure, and only one of those has to be paid for up front.");
        System.out.println();
        System.out.println("and the cap is not a detail. 2t+2 is the natural guess, it is right whenever");
        System.out.println("the start already fits under it, and it silently reports no route at all when");
        System.out.println("the start is larger than the target -- which is the modelling equivalent of");
        System.out.println("leaving nodes out of the graph.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The third modelling decision: a graph does not have to exist.
//
// "From \`start\`, reach \`target\` using only doubling and subtracting one, in as
// few steps as possible" has nodes and edges in it, but there is no list of
// either anywhere in the problem, and there is no reason to build one. A
// breadth-first search asks a node for its neighbours; if a function can answer
// that, the graph never has to be materialised.
//
// The cost of materialising it is the second half of the lesson. Building the
// whole adjacency list means paying for every edge in the space, including the
// overwhelming majority the search will never look at.
#include <algorithm>
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <utility>
#include <vector>

// Ask for neighbours on demand. Nothing is stored but the frontier.
std::pair<int, std::int64_t> implicitSearch(int start, int target, int cap) {
    std::vector<int> distance(cap + 1, -1);
    if (start > cap) return {-1, 0};
    distance[start] = 0;
    std::vector<int> queue = {start};
    std::int64_t touched = 0;
    for (size_t head = 0; head < queue.size(); head++) {
        int v = queue[head];
        touched++;
        if (v == target) return {distance[v], touched};
        for (int u : std::array<int, 2>{v * 2, v - 1}) {
            if (u >= 0 && u <= cap && distance[u] < 0) {
                distance[u] = distance[v] + 1;
                queue.push_back(u);
            }
        }
    }
    return {-1, touched};
}

// Build every edge first, then run the same search over the stored lists.
std::pair<int, std::int64_t> materialised(int start, int target, int cap) {
    std::vector<std::vector<int>> neighbours(cap + 1);
    std::int64_t edges = 0;
    for (int v = 0; v <= cap; v++) {
        for (int u : std::array<int, 2>{v * 2, v - 1}) {
            if (u >= 0 && u <= cap) {
                neighbours[v].push_back(u);
                edges++;
            }
        }
    }
    std::vector<int> distance(cap + 1, -1);
    if (start > cap) return {-1, edges};
    distance[start] = 0;
    std::vector<int> queue = {start};
    for (size_t head = 0; head < queue.size(); head++) {
        int v = queue[head];
        if (v == target) return {distance[v], edges};
        for (int u : neighbours[v]) {
            if (distance[u] < 0) {
                distance[u] = distance[v] + 1;
                queue.push_back(u);
            }
        }
    }
    return {-1, edges};
}

bool deepStep(int value, int target, int cap, int left) {
    if (value == target) return true;
    if (left == 0) return false;
    for (int u : std::array<int, 2>{value * 2, value - 1}) {
        if (u >= 0 && u <= cap && deepStep(u, target, cap, left - 1)) return true;
    }
    return false;
}

// No graph and no queue: try every sequence of moves up to \`limit\` long.
int deepening(int start, int target, int cap, int limit) {
    for (int depth = 0; depth <= limit; depth++) {
        if (deepStep(start, target, cap, depth)) return depth;
    }
    return -1;
}

// Doubling past twice the target is never useful, and the start has to fit.
int roomy(int start, int target) { return std::max(start, 2 * target) + 2; }

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    const std::vector<std::array<int, 2>> cases = {
        {2, 3}, {5, 8}, {3, 10}, {1, 100}, {7, 7}, {10, 1}, {11, 1}};

    std::cout << std::right << std::setw(6) << "from" << std::setw(6) << "to"
              << std::setw(10) << "implicit" << std::setw(14) << "materialised"
              << std::setw(11) << "deepening" << std::setw(15) << "nodes touched"
              << std::setw(13) << "edges built" << "\\n";
    for (const auto &pair : cases) {
        int start = pair[0], target = pair[1];
        int cap = roomy(start, target);
        auto found = implicitSearch(start, target, cap);
        auto built = materialised(start, target, cap);
        std::cout << std::setw(6) << start << std::setw(6) << target << std::setw(10) << found.first
                  << std::setw(14) << built.first
                  << std::setw(11) << deepening(start, target, cap, 12)
                  << std::setw(15) << found.second << std::setw(13) << built.second << "\\n";
    }
    std::cout << "\\n";

    // The cap is a modelling decision too, and the obvious guess is wrong. Twice the
    // target is enough room above, but it is not enough room to hold a start that is
    // already larger than that.
    std::cout << "and the cap, which is a modelling decision too:\\n";
    std::cout << std::setw(6) << "from" << std::setw(6) << "to" << std::setw(10) << "cap 2t+2"
              << std::setw(17) << "cap max(s,2t)+2" << std::setw(17) << "a very wide cap" << "\\n";
    for (const auto &pair : cases) {
        int start = pair[0], target = pair[1];
        std::cout << std::setw(6) << start << std::setw(6) << target
                  << std::setw(10) << implicitSearch(start, target, 2 * target + 2).first
                  << std::setw(17) << implicitSearch(start, target, roomy(start, target)).first
                  << std::setw(17) << implicitSearch(start, target, 16 * target + 16 + start).first
                  << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 3000;
    int sameAnswer = 0, sameAsDeepening = 0, chosenOk = 0, guessedOk = 0;
    std::int64_t touchedTotal = 0, edgesTotal = 0;
    for (int t = 0; t < TRIALS; t++) {
        int start = rnd(12);
        int target = 1 + rnd(12);
        int cap = roomy(start, target);
        auto found = implicitSearch(start, target, cap);
        auto built = materialised(start, target, cap);
        if (found.first == built.first) sameAnswer++;
        if (found.first == deepening(start, target, cap, 12)) sameAsDeepening++;
        int wide = implicitSearch(start, target, 16 * target + 16 + start).first;
        if (found.first == wide) chosenOk++;
        int guessed = implicitSearch(start, target, 2 * target + 2).first;
        if (guessed == wide) guessedOk++;
        touchedTotal += found.second;
        edgesTotal += built.second;
    }

    std::cout << "over " << TRIALS << " random pairs below 12, against a cap far wider than needed:\\n";
    std::cout << "  the implicit search              " << std::setw(6) << chosenOk << "\\n";
    std::cout << "  the guessed cap of 2t+2          " << std::setw(6) << guessedOk << "\\n\\n";
    std::cout << "and against each other:\\n";
    std::cout << "  implicit against materialised    " << std::setw(6) << sameAnswer << "\\n";
    std::cout << "  implicit against deepening       " << std::setw(6) << sameAsDeepening << "\\n\\n";
    std::cout << "the implicit search touched " << touchedTotal
              << " nodes; materialising the graph first\\n";
    std::cout << "built " << edgesTotal << " edges before the search even started. Same graph, same\\n";
    std::cout << "answers -- one of them is described by a function and the other by a data\\n";
    std::cout << "structure, and only one of those has to be paid for up front.\\n\\n";
    std::cout << "and the cap is not a detail. 2t+2 is the natural guess, it is right whenever\\n";
    std::cout << "the start already fits under it, and it silently reports no route at all when\\n";
    std::cout << "the start is larger than the target -- which is the modelling equivalent of\\n";
    std::cout << "leaving nodes out of the graph.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// The third modelling decision: a graph does not have to exist.
//
// "From \`start\`, reach \`target\` using only doubling and subtracting one, in as
// few steps as possible" has nodes and edges in it, but there is no list of
// either anywhere in the problem, and there is no reason to build one. A
// breadth-first search asks a node for its neighbours; if a function can answer
// that, the graph never has to be materialised.
//
// The cost of materialising it is the second half of the lesson. Building the
// whole adjacency list means paying for every edge in the space, including the
// overwhelming majority the search will never look at.

/// Ask for neighbours on demand. Nothing is stored but the frontier.
fn implicit(start: i64, target: i64, cap: i64) -> (i64, i64) {
    let mut distance = vec![-1i64; (cap + 1) as usize];
    if start > cap {
        return (-1, 0);
    }
    distance[start as usize] = 0;
    let mut queue = vec![start];
    let mut touched = 0i64;
    let mut head = 0;
    while head < queue.len() {
        let v = queue[head];
        head += 1;
        touched += 1;
        if v == target {
            return (distance[v as usize], touched);
        }
        for u in [v * 2, v - 1] {
            if u >= 0 && u <= cap && distance[u as usize] < 0 {
                distance[u as usize] = distance[v as usize] + 1;
                queue.push(u);
            }
        }
    }
    (-1, touched)
}

/// Build every edge first, then run the same search over the stored lists.
fn materialised(start: i64, target: i64, cap: i64) -> (i64, i64) {
    let mut neighbours: Vec<Vec<i64>> = vec![Vec::new(); (cap + 1) as usize];
    let mut edges = 0i64;
    for v in 0..=cap {
        for u in [v * 2, v - 1] {
            if u >= 0 && u <= cap {
                neighbours[v as usize].push(u);
                edges += 1;
            }
        }
    }
    let mut distance = vec![-1i64; (cap + 1) as usize];
    if start > cap {
        return (-1, edges);
    }
    distance[start as usize] = 0;
    let mut queue = vec![start];
    let mut head = 0;
    while head < queue.len() {
        let v = queue[head];
        head += 1;
        if v == target {
            return (distance[v as usize], edges);
        }
        for k in 0..neighbours[v as usize].len() {
            let u = neighbours[v as usize][k];
            if distance[u as usize] < 0 {
                distance[u as usize] = distance[v as usize] + 1;
                queue.push(u);
            }
        }
    }
    (-1, edges)
}

fn deep_step(value: i64, target: i64, cap: i64, left: i64) -> bool {
    if value == target {
        return true;
    }
    if left == 0 {
        return false;
    }
    for u in [value * 2, value - 1] {
        if u >= 0 && u <= cap && deep_step(u, target, cap, left - 1) {
            return true;
        }
    }
    false
}

/// No graph and no queue: try every sequence of moves up to \`limit\` long.
fn deepening(start: i64, target: i64, cap: i64, limit: i64) -> i64 {
    for depth in 0..=limit {
        if deep_step(start, target, cap, depth) {
            return depth;
        }
    }
    -1
}

/// Doubling past twice the target is never useful, and the start has to fit.
fn roomy(start: i64, target: i64) -> i64 {
    start.max(2 * target) + 2
}

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
    let cases: [(i64, i64); 7] = [(2, 3), (5, 8), (3, 10), (1, 100), (7, 7), (10, 1), (11, 1)];

    println!(
        "{:>6}{:>6}{:>10}{:>14}{:>11}{:>15}{:>13}",
        "from", "to", "implicit", "materialised", "deepening", "nodes touched", "edges built"
    );
    for (start, target) in cases {
        let cap = roomy(start, target);
        let (steps, touched) = implicit(start, target, cap);
        let (built, edges) = materialised(start, target, cap);
        println!(
            "{:>6}{:>6}{:>10}{:>14}{:>11}{:>15}{:>13}",
            start, target, steps, built,
            deepening(start, target, cap, 12), touched, edges
        );
    }
    println!();

    // The cap is a modelling decision too, and the obvious guess is wrong. Twice the
    // target is enough room above, but it is not enough room to hold a start that is
    // already larger than that.
    println!("and the cap, which is a modelling decision too:");
    println!(
        "{:>6}{:>6}{:>10}{:>17}{:>17}",
        "from", "to", "cap 2t+2", "cap max(s,2t)+2", "a very wide cap"
    );
    for (start, target) in cases {
        let (guessed, _) = implicit(start, target, 2 * target + 2);
        let (chosen, _) = implicit(start, target, roomy(start, target));
        let (wide, _) = implicit(start, target, 16 * target + 16 + start);
        println!("{:>6}{:>6}{:>10}{:>17}{:>17}", start, target, guessed, chosen, wide);
    }
    println!();

    let trials = 3000;
    let mut rng = Rng { seed: 1 };
    let (mut same_answer, mut same_as_deepening, mut chosen_ok, mut guessed_ok) = (0, 0, 0, 0);
    let (mut touched_total, mut edges_total) = (0i64, 0i64);
    for _ in 0..trials {
        let start = rng.next(12);
        let target = 1 + rng.next(12);
        let cap = roomy(start, target);
        let (steps, touched) = implicit(start, target, cap);
        let (built, edges) = materialised(start, target, cap);
        if steps == built {
            same_answer += 1;
        }
        if steps == deepening(start, target, cap, 12) {
            same_as_deepening += 1;
        }
        let (wide, _) = implicit(start, target, 16 * target + 16 + start);
        if steps == wide {
            chosen_ok += 1;
        }
        let (guessed, _) = implicit(start, target, 2 * target + 2);
        if guessed == wide {
            guessed_ok += 1;
        }
        touched_total += touched;
        edges_total += edges;
    }

    println!("over {} random pairs below 12, against a cap far wider than needed:", trials);
    println!("  the implicit search              {:>6}", chosen_ok);
    println!("  the guessed cap of 2t+2          {:>6}", guessed_ok);
    println!();
    println!("and against each other:");
    println!("  implicit against materialised    {:>6}", same_answer);
    println!("  implicit against deepening       {:>6}", same_as_deepening);
    println!();
    println!("the implicit search touched {} nodes; materialising the graph first", touched_total);
    println!("built {} edges before the search even started. Same graph, same", edges_total);
    println!("answers -- one of them is described by a function and the other by a data");
    println!("structure, and only one of those has to be paid for up front.");
    println!();
    println!("and the cap is not a detail. 2t+2 is the natural guess, it is right whenever");
    println!("the start already fits under it, and it silently reports no route at all when");
    println!("the start is larger than the target -- which is the modelling equivalent of");
    println!("leaving nodes out of the graph.");
}
`,
            },
            {
              lang: "go",
              code: `// The third modelling decision: a graph does not have to exist.
//
// "From \`start\`, reach \`target\` using only doubling and subtracting one, in as
// few steps as possible" has nodes and edges in it, but there is no list of
// either anywhere in the problem, and there is no reason to build one. A
// breadth-first search asks a node for its neighbours; if a function can answer
// that, the graph never has to be materialised.
//
// The cost of materialising it is the second half of the lesson. Building the
// whole adjacency list means paying for every edge in the space, including the
// overwhelming majority the search will never look at.
package main

import "fmt"

// implicit asks for neighbours on demand. Nothing is stored but the frontier.
func implicit(start, target, cap int) (int, int64) {
	distance := make([]int, cap+1)
	for i := range distance {
		distance[i] = -1
	}
	if start > cap {
		return -1, 0
	}
	distance[start] = 0
	queue := []int{start}
	var touched int64
	for head := 0; head < len(queue); head++ {
		v := queue[head]
		touched++
		if v == target {
			return distance[v], touched
		}
		for _, u := range [2]int{v * 2, v - 1} {
			if u >= 0 && u <= cap && distance[u] < 0 {
				distance[u] = distance[v] + 1
				queue = append(queue, u)
			}
		}
	}
	return -1, touched
}

// materialised builds every edge first, then runs the same search over the lists.
func materialised(start, target, cap int) (int, int64) {
	neighbours := make([][]int, cap+1)
	var edges int64
	for v := 0; v <= cap; v++ {
		for _, u := range [2]int{v * 2, v - 1} {
			if u >= 0 && u <= cap {
				neighbours[v] = append(neighbours[v], u)
				edges++
			}
		}
	}
	distance := make([]int, cap+1)
	for i := range distance {
		distance[i] = -1
	}
	if start > cap {
		return -1, edges
	}
	distance[start] = 0
	queue := []int{start}
	for head := 0; head < len(queue); head++ {
		v := queue[head]
		if v == target {
			return distance[v], edges
		}
		for _, u := range neighbours[v] {
			if distance[u] < 0 {
				distance[u] = distance[v] + 1
				queue = append(queue, u)
			}
		}
	}
	return -1, edges
}

// deepening tries every sequence of moves up to limit long, with no graph and no queue.
func deepening(start, target, cap, limit int) int {
	var step func(value, left int) bool
	step = func(value, left int) bool {
		if value == target {
			return true
		}
		if left == 0 {
			return false
		}
		for _, u := range [2]int{value * 2, value - 1} {
			if u >= 0 && u <= cap && step(u, left-1) {
				return true
			}
		}
		return false
	}
	for depth := 0; depth <= limit; depth++ {
		if step(start, depth) {
			return depth
		}
	}
	return -1
}

// roomy: doubling past twice the target is never useful, and the start has to fit.
func roomy(start, target int) int {
	if start > 2*target {
		return start + 2
	}
	return 2*target + 2
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	cases := [][2]int{{2, 3}, {5, 8}, {3, 10}, {1, 100}, {7, 7}, {10, 1}, {11, 1}}

	fmt.Printf("%6s%6s%10s%14s%11s%15s%13s\\n", "from", "to", "implicit", "materialised",
		"deepening", "nodes touched", "edges built")
	for _, pair := range cases {
		start, target := pair[0], pair[1]
		capacity := roomy(start, target)
		steps, touched := implicit(start, target, capacity)
		built, edges := materialised(start, target, capacity)
		fmt.Printf("%6d%6d%10d%14d%11d%15d%13d\\n", start, target, steps, built,
			deepening(start, target, capacity, 12), touched, edges)
	}
	fmt.Println()

	// The cap is a modelling decision too, and the obvious guess is wrong. Twice the
	// target is enough room above, but it is not enough room to hold a start that is
	// already larger than that.
	fmt.Println("and the cap, which is a modelling decision too:")
	fmt.Printf("%6s%6s%10s%17s%17s\\n", "from", "to", "cap 2t+2", "cap max(s,2t)+2", "a very wide cap")
	for _, pair := range cases {
		start, target := pair[0], pair[1]
		guessed, _ := implicit(start, target, 2*target+2)
		chosen, _ := implicit(start, target, roomy(start, target))
		wide, _ := implicit(start, target, 16*target+16+start)
		fmt.Printf("%6d%6d%10d%17d%17d\\n", start, target, guessed, chosen, wide)
	}
	fmt.Println()

	trials := 3000
	sameAnswer, sameAsDeepening, chosenOk, guessedOk := 0, 0, 0, 0
	var touchedTotal, edgesTotal int64
	for t := 0; t < trials; t++ {
		start := rand(12)
		target := 1 + rand(12)
		capacity := roomy(start, target)
		steps, touched := implicit(start, target, capacity)
		built, edges := materialised(start, target, capacity)
		if steps == built {
			sameAnswer++
		}
		if steps == deepening(start, target, capacity, 12) {
			sameAsDeepening++
		}
		wide, _ := implicit(start, target, 16*target+16+start)
		if steps == wide {
			chosenOk++
		}
		guessed, _ := implicit(start, target, 2*target+2)
		if guessed == wide {
			guessedOk++
		}
		touchedTotal += touched
		edgesTotal += edges
	}

	fmt.Printf("over %d random pairs below 12, against a cap far wider than needed:\\n", trials)
	fmt.Printf("  the implicit search              %6d\\n", chosenOk)
	fmt.Printf("  the guessed cap of 2t+2          %6d\\n", guessedOk)
	fmt.Println()
	fmt.Println("and against each other:")
	fmt.Printf("  implicit against materialised    %6d\\n", sameAnswer)
	fmt.Printf("  implicit against deepening       %6d\\n", sameAsDeepening)
	fmt.Println()
	fmt.Printf("the implicit search touched %d nodes; materialising the graph first\\n", touchedTotal)
	fmt.Printf("built %d edges before the search even started. Same graph, same\\n", edgesTotal)
	fmt.Println("answers -- one of them is described by a function and the other by a data")
	fmt.Println("structure, and only one of those has to be paid for up front.")
	fmt.Println()
	fmt.Println("and the cap is not a detail. 2t+2 is the natural guess, it is right whenever")
	fmt.Println("the start already fits under it, and it silently reports no route at all when")
	fmt.Println("the start is larger than the target -- which is the modelling equivalent of")
	fmt.Println("leaving nodes out of the graph.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "An implicit graph needs a bound, and the bound is a modelling decision",
          body: "Twice the target is the natural guess and it deletes every node above it, including the start when the start is larger. That failure looks exactly like \"no route exists\", which is a legitimate answer, so nothing draws attention to it \u2014 351 of 3,000 random pairs here.",
        },
        {
          title: "Materialise only what will be looked at",
          body: "Building the whole adjacency list cost 73,941 edges against the 21,381 nodes the search actually touched. Materialise when the graph is small, reused across queries, or has to be examined as a whole; otherwise a neighbours function is the same graph without the bill.",
        },
      ],
    },
    {
      id: "three-questions",
      heading: "The three questions, in order",
      body: [
        "So, three questions to ask before writing any graph code, in this order.",
        "**What is a node?** Not \"what is a thing in this problem\" \u2014 what has to be known for the rest of the journey to be determined. If the legal-moves rule cannot be written from the node alone, the node is missing something.",
        "**What is an edge?** One legal move, and its cost if there is one. This is also where a problem stops being a graph problem: if the legal moves depend on the whole history rather than on the current node, no amount of searching will fix it, and the state has to grow until they do not.",
        "**Does the graph need to exist?** Materialise it when it is small, reused, or needs to be examined as a whole. Generate neighbours on demand when the space is large or unbounded \u2014 and then bound it deliberately, because an implicit graph will happily let you search a space that is missing the answer.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How would you approach a problem you suspect is a graph problem?",
      answer:
        "By answering three questions before writing any code. What is a node \u2014 meaning what has to be known for the rest of the journey to be determined, not simply what objects the problem mentions. What is an edge \u2014 one legal move, and its cost if there is one. And does the graph need to exist, or can neighbours be generated on demand. The first is where correctness is won or lost: if the rule for which moves are legal cannot be written from the node alone, the node is missing state. On a map with doors and keys, the node has to be the cell paired with the keys held, and deleting the keys gives a program that is right on about 80 percent of random maps and silently wrong on the rest.",
    },
    {
      question: "Word ladder: how do you build the graph, and what does it cost?",
      answer:
        "A node is a word and an edge joins words differing in one position. The obvious construction compares every pair, which is n(n-1)/2 comparisons of length-L words. The better one buckets each word under L patterns, one per position, each with that letter replaced by a wildcard, and every pair sharing a bucket is an edge \u2014 which is n times L insertions. Both describe the same graph and give the same answers, and the interesting part is that the second is not always cheaper: for three-letter words the crossover is at seven words. At ten thousand words it is about 50 million comparisons against 30 thousand insertions, so the construction, not the search, is what to optimise at scale.",
    },
    {
      question: "When would you not build the adjacency list?",
      answer:
        "When the node space is large, unbounded, or mostly irrelevant to the query. A search only needs to ask a node for its neighbours, so a function answering that question is a complete substitute for the data structure, and nothing is stored but the frontier. Measured on a small numeric puzzle, the implicit search touched about 21,000 nodes while materialising the graph first built about 74,000 edges before the search began. The catch is that an implicit space usually needs an explicit bound, and getting the bound wrong deletes nodes rather than raising an error \u2014 the answer comes back as \"unreachable\", which is indistinguishable from a genuine answer. The way to check a bound is to compare against a much wider one on small inputs.",
    },
  ],
  takeaways: [
    "The algorithms are short; the modelling is the hard part, so decide the node and the edge first.",
    "A node is what has to be known for the rest of the journey to be determined \u2014 not necessarily a place.",
    "If the legal-move rule cannot be written from the node alone, the node is missing state.",
    "Deleting state gives a program that is right most of the time: 2,407 and 2,755 out of 3,000 for the two ways of dropping a key set.",
    "The same graph can be built cheaply or expensively, and which is which depends on the size.",
    "Wildcard buckets beat all-pairs comparison above seven three-letter words and lose below it.",
    "A search needs a neighbours function, not a data structure \u2014 implicit graphs cost nothing to build.",
    "An implicit space needs a deliberate bound, and a bound that is too small reports \"no route\" rather than failing.",
  ],
  status: "available",
};
