import type { Lesson } from "@/content/types";

export const approximateNeighboursLesson: Lesson = {
  id: "dsa-gen-ai-approximate-neighbours",
  slug: "approximate-neighbours",
  moduleSlug: "algorithms-behind-gen-ai",
  title: "Approximate Nearest Neighbours: Hashing, Clusters and Graphs",
  summary:
    "Recall is a dial, not a property, and it is turned with distance computations. Measured: an inverted file index climbing 53% to 99.6% recall as the probe widens, against hashing that buys the cheap end better and cannot reach the top.",
  estimatedMinutes: 40,
  status: "available",
  objectives: [
    "Explain why an approximate index is the only way below the exact-scan floor",
    "Build an inverted file index and a hash-signature index over the same data",
    "Read a recall-against-cost table and say which index wins where",
    "Place HNSW as the graph search it is, and say when it is worth its memory",
  ],
  sections: [
    {
      id: "the-trade",
      heading: "The trade being made",
      body: [
        "The previous lesson ended at a floor: exact search must compute `n` distances because skipping a candidate risks skipping the answer. Everything in this lesson is bought by accepting that risk.",
        "The word for what you get back is **recall**: of the true nearest neighbours, what fraction did the index actually return? Not a bug rate \u2014 a dial. Every approximate index has a knob, and turning it towards more accuracy costs more distance computations, until at the far end it costs `n` and you are doing an exact scan again.",
        "This reframes the design question usefully. It is not \"is this index correct\" but \"what exchange rate does this index give me between distance computations and recall\", and that is a question with a number in it.",
        "Two indexes, built on the same data, measured on the same queries.",
      ],
    },
    {
      id: "two-indexes",
      heading: "Two indexes, one exchange rate",
      body: [
        "**The inverted file index** clusters the vectors once \u2014 the program runs three rounds of Lloyd's algorithm over sixteen centroids \u2014 and stores each vector in its cluster's bucket. A query measures the sixteen centroids, then searches only the `nprobe` nearest buckets. The knob is `nprobe`.",
        "**Locality-sensitive hashing** picks twelve random hyperplanes and records, for each vector, which side of each plane it fell on. That twelve-bit signature is the bucket key. Nearby vectors usually agree on most planes, so they usually land in the same or a nearby bucket. The knob is how many bits you are willing to flip when probing.",
      ],
      examples: [
        {
          id: "recall-against-distance-computations",
          title: "Two approximate indexes over the same 2,000 vectors, with the cost and the recall",
          lang: "python",
          code: `# Approximate nearest neighbours. Two indexes, one measurement: how many
# distance computations each one spends, and how much of the true answer
# it gives back for the money.

DIM = 8
N = 2000
QUERIES = 300
K = 10
CLUSTERS = 16
BITS = 12

distances = [0]


def sq_dist(a, b):
    total = 0
    for i in range(len(a)):
        d = a[i] - b[i]
        total += d * d
    distances[0] += 1
    return total


def top_k(query, docs, candidates):
    scored = []
    for i in candidates:
        scored.append([sq_dist(query, docs[i]), i])
    scored.sort()
    return [pair[1] for pair in scored[:K]]


# The same linear congruential generator in every language, so the random
# vectors below are the same vectors whichever translation is run.
seed = 30310007


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


docs = []
for _ in range(N):
    docs.append([rand(1000) for _ in range(DIM)])
queries = []
for _ in range(QUERIES):
    queries.append([rand(1000) for _ in range(DIM)])

# --- an inverted file index: cluster once, then search a few clusters ----

centroids = []
for c in range(CLUSTERS):
    centroids.append(list(docs[rand(N)]))
assignment = [0] * N
for _round in range(3):
    for i in range(N):
        best = 0
        best_d = sq_dist(docs[i], centroids[0])
        for c in range(1, CLUSTERS):
            d = sq_dist(docs[i], centroids[c])
            if d < best_d:
                best_d = d
                best = c
        assignment[i] = best
    sums = [[0] * DIM for _ in range(CLUSTERS)]
    counts = [0] * CLUSTERS
    for i in range(N):
        c = assignment[i]
        counts[c] += 1
        for j in range(DIM):
            sums[c][j] += docs[i][j]
    for c in range(CLUSTERS):
        if counts[c] > 0:
            for j in range(DIM):
                centroids[c][j] = sums[c][j] // counts[c]
buckets = [[] for _ in range(CLUSTERS)]
for i in range(N):
    buckets[assignment[i]].append(i)


def ivf_search(query, nprobe):
    order = []
    for c in range(CLUSTERS):
        order.append([sq_dist(query, centroids[c]), c])
    order.sort()
    candidates = []
    for p in range(nprobe):
        candidates.extend(buckets[order[p][1]])
    return top_k(query, docs, candidates)


# --- locality-sensitive hashing: a signature of which side of each plane -

planes = []
for b in range(BITS):
    planes.append([rand(3) - 1 for _ in range(DIM)])


def signature(v):
    key = 0
    for b in range(BITS):
        total = 0
        for j in range(DIM):
            total += (v[j] - 500) * planes[b][j]
        if total > 0:
            key += 1 << b
    return key


table = {}
for i in range(N):
    key = signature(docs[i])
    if key not in table:
        table[key] = []
    table[key].append(i)


def lsh_search(query, radius):
    key = signature(query)
    candidates = []
    seen = {}
    probes = [key]
    if radius >= 1:
        for b in range(BITS):
            probes.append(key ^ (1 << b))
    if radius >= 2:
        for b in range(BITS):
            for c in range(b + 1, BITS):
                probes.append(key ^ (1 << b) ^ (1 << c))
    for probe in probes:
        if probe in seen:
            continue
        seen[probe] = True
        if probe in table:
            candidates.extend(table[probe])
    return top_k(query, docs, candidates)


# --- the measurement ----------------------------------------------------

exact = []
distances[0] = 0
for q in queries:
    exact.append(top_k(q, docs, list(range(N))))
exact_cost = distances[0] // QUERIES


def recall_of(found, wanted):
    keep = {}
    for i in wanted:
        keep[i] = True
    hit = 0
    for i in found:
        if i in keep:
            hit += 1
    return hit


print("%d documents of %d dimensions, top %d, %d queries" % (N, DIM, K, QUERIES))
print("index built once: %d clusters, and %d-bit signatures" % (CLUSTERS, BITS))
print()
print("index                distances per query   found of %d" % (QUERIES * K))
print("exact scan           %19d   %10d" % (exact_cost, QUERIES * K))

rows = []
for nprobe in [1, 2, 4, 8]:
    distances[0] = 0
    hit = 0
    for i in range(QUERIES):
        hit += recall_of(ivf_search(queries[i], nprobe), exact[i])
    rows.append(["ivf, %d of %d clusters" % (nprobe, CLUSTERS), distances[0] // QUERIES, hit])
for radius in [0, 1, 2]:
    distances[0] = 0
    hit = 0
    for i in range(QUERIES):
        hit += recall_of(lsh_search(queries[i], radius), exact[i])
    rows.append(["lsh, %d bits flipped" % radius, distances[0] // QUERIES, hit])
for row in rows:
    print("%-20s %19d   %10d" % (row[0], row[1], row[2]))
print()
print("index                recall      speed-up over the exact scan")
for row in rows:
    recall = row[2] * 1000 // (QUERIES * K)
    speed = exact_cost * 10 // row[1] if row[1] > 0 else 0
    print("%-20s %5d.%d%%   %20d.%dx"
          % (row[0], recall // 10, recall % 10, speed // 10, speed % 10))
print()
print("""Every row above is wrong some of the time, and that is the point of
the lesson rather than a defect in the code. Exact search costs 2000
distance computations and returns all 3000 of the true neighbours.
Everything else returns fewer, and the whole design question is what
exchange rate you are getting.

Read the two indexes against each other at similar cost. Locality-
sensitive hashing with two bits flipped spends 104 distances and
recovers 62.2%. The inverted file index probing one cluster of
sixteen spends 142 and recovers 53.1%. At this size, on this data,
the hash table is the better buy at the cheap end -- which is not the
usual folklore, and it is what the measurement says.

Then read the top end. The inverted file index climbs to 99.6% at
1022 distances, and it climbs smoothly: 53, 75, 92, 99.6 as the probe
widens. Hashing has no comparable move. Going from one flipped bit to
two multiplies the buckets probed from 13 to 79 and still only reaches
62.2%, because a signature that lands on the wrong side of one plane
puts a true neighbour somewhere the probe order does not reach early.
That is the practical reason inverted file indexes are the default in
vector databases and pure hashing mostly is not: the knob works all
the way up.

Both share the shape that matters. A partition is built once and
reused, and a query looks at a fraction of it. Recall is a dial, not
a property, and it is turned with distance computations. The lesson
before this one showed that exact search cannot avoid n distances; the
rows here avoid them by not looking, and pay for it in answers that
are merely mostly right.

The third structure named in this area, the navigable small-world
graph, is not measured here because it is the graph search from
earlier in this track rather than a new idea: nodes are vectors,
edges join near neighbours, and a query is a greedy walk downhill
towards the query point with a bounded candidate heap -- the same
bounded heap as the previous lesson. Its recall dial is the size of
that heap. What it buys over the two rows above is that the walk is
logarithmic rather than proportional to a fraction of n, which is why
it wins at a billion vectors and is not worth its memory at two
thousand.""")
`,
          output: `2000 documents of 8 dimensions, top 10, 300 queries
index built once: 16 clusters, and 12-bit signatures

index                distances per query   found of 3000
exact scan                          2000         3000
ivf, 1 of 16 clusters                 142         1594
ivf, 2 of 16 clusters                 268         2257
ivf, 4 of 16 clusters                 519         2764
ivf, 8 of 16 clusters                1022         2990
lsh, 0 bits flipped                    4          296
lsh, 1 bits flipped                   30         1007
lsh, 2 bits flipped                  104         1868

index                recall      speed-up over the exact scan
ivf, 1 of 16 clusters    53.1%                     14.0x
ivf, 2 of 16 clusters    75.2%                      7.4x
ivf, 4 of 16 clusters    92.1%                      3.8x
ivf, 8 of 16 clusters    99.6%                      1.9x
lsh, 0 bits flipped      9.8%                    500.0x
lsh, 1 bits flipped     33.5%                     66.6x
lsh, 2 bits flipped     62.2%                     19.2x

Every row above is wrong some of the time, and that is the point of
the lesson rather than a defect in the code. Exact search costs 2000
distance computations and returns all 3000 of the true neighbours.
Everything else returns fewer, and the whole design question is what
exchange rate you are getting.

Read the two indexes against each other at similar cost. Locality-
sensitive hashing with two bits flipped spends 104 distances and
recovers 62.2%. The inverted file index probing one cluster of
sixteen spends 142 and recovers 53.1%. At this size, on this data,
the hash table is the better buy at the cheap end -- which is not the
usual folklore, and it is what the measurement says.

Then read the top end. The inverted file index climbs to 99.6% at
1022 distances, and it climbs smoothly: 53, 75, 92, 99.6 as the probe
widens. Hashing has no comparable move. Going from one flipped bit to
two multiplies the buckets probed from 13 to 79 and still only reaches
62.2%, because a signature that lands on the wrong side of one plane
puts a true neighbour somewhere the probe order does not reach early.
That is the practical reason inverted file indexes are the default in
vector databases and pure hashing mostly is not: the knob works all
the way up.

Both share the shape that matters. A partition is built once and
reused, and a query looks at a fraction of it. Recall is a dial, not
a property, and it is turned with distance computations. The lesson
before this one showed that exact search cannot avoid n distances; the
rows here avoid them by not looking, and pay for it in answers that
are merely mostly right.

The third structure named in this area, the navigable small-world
graph, is not measured here because it is the graph search from
earlier in this track rather than a new idea: nodes are vectors,
edges join near neighbours, and a query is a greedy walk downhill
towards the query point with a bounded candidate heap -- the same
bounded heap as the previous lesson. Its recall dial is the size of
that heap. What it buys over the two rows above is that the walk is
logarithmic rather than proportional to a fraction of n, which is why
it wins at a billion vectors and is not worth its memory at two
thousand.`,
          explanation:
            "Every row is wrong some of the time, and that is the lesson rather than a defect. Compare the two indexes at similar cost: hashing with two bits flipped spends 104 distances for 62.2% recall, while the inverted file index probing one cluster spends 142 for 53.1%. At the cheap end the hash table is the better buy here -- which is not the usual folklore, and it is what the measurement says. Then compare the top ends: the inverted file index climbs smoothly, 53.1, 75.2, 92.1, 99.6, as the probe widens. Hashing has no comparable move -- going from one flipped bit to two multiplies the buckets probed from 13 to 79 and still reaches only 62.2%, because a vector on the wrong side of one plane sits somewhere the probe order does not reach early.",
          alternates: [
            {
              lang: "javascript",
              code: `// Approximate nearest neighbours. Two indexes, one measurement: how many
// distance computations each one spends, and how much of the true answer
// it gives back for the money.

const DIM = 8;
const N = 2000;
const QUERIES = 300;
const K = 10;
const CLUSTERS = 16;
const BITS = 12;

const distances = [0];

function sqDist(a, b) {
  let total = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    total += d * d;
  }
  distances[0] += 1;
  return total;
}

function byDistThenIndex(x, y) {
  return x[0] !== y[0] ? x[0] - y[0] : x[1] - y[1];
}

function topK(query, docs, candidates) {
  const scored = [];
  for (const i of candidates) scored.push([sqDist(query, docs[i]), i]);
  scored.sort(byDistThenIndex);
  return scored.slice(0, K).map((pair) => pair[1]);
}

// The same linear congruential generator in every language, so the random
// vectors below are the same vectors whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 30310007n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const docs = [];
for (let d = 0; d < N; d++) {
  const v = [];
  for (let i = 0; i < DIM; i++) v.push(rand(1000));
  docs.push(v);
}
const queries = [];
for (let q = 0; q < QUERIES; q++) {
  const v = [];
  for (let i = 0; i < DIM; i++) v.push(rand(1000));
  queries.push(v);
}

// --- an inverted file index: cluster once, then search a few clusters ----

const centroids = [];
for (let c = 0; c < CLUSTERS; c++) centroids.push(docs[rand(N)].slice());
const assignment = new Array(N).fill(0);
for (let round = 0; round < 3; round++) {
  for (let i = 0; i < N; i++) {
    let best = 0;
    let bestD = sqDist(docs[i], centroids[0]);
    for (let c = 1; c < CLUSTERS; c++) {
      const d = sqDist(docs[i], centroids[c]);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    assignment[i] = best;
  }
  const sums = [];
  for (let c = 0; c < CLUSTERS; c++) sums.push(new Array(DIM).fill(0));
  const counts = new Array(CLUSTERS).fill(0);
  for (let i = 0; i < N; i++) {
    const c = assignment[i];
    counts[c] += 1;
    for (let j = 0; j < DIM; j++) sums[c][j] += docs[i][j];
  }
  for (let c = 0; c < CLUSTERS; c++) {
    if (counts[c] > 0) {
      for (let j = 0; j < DIM; j++) centroids[c][j] = Math.floor(sums[c][j] / counts[c]);
    }
  }
}
const buckets = [];
for (let c = 0; c < CLUSTERS; c++) buckets.push([]);
for (let i = 0; i < N; i++) buckets[assignment[i]].push(i);

function ivfSearch(query, nprobe) {
  const order = [];
  for (let c = 0; c < CLUSTERS; c++) order.push([sqDist(query, centroids[c]), c]);
  order.sort(byDistThenIndex);
  let candidates = [];
  for (let p = 0; p < nprobe; p++) candidates = candidates.concat(buckets[order[p][1]]);
  return topK(query, docs, candidates);
}

// --- locality-sensitive hashing: a signature of which side of each plane -

const planes = [];
for (let b = 0; b < BITS; b++) {
  const plane = [];
  for (let j = 0; j < DIM; j++) plane.push(rand(3) - 1);
  planes.push(plane);
}

function signature(v) {
  let key = 0;
  for (let b = 0; b < BITS; b++) {
    let total = 0;
    for (let j = 0; j < DIM; j++) total += (v[j] - 500) * planes[b][j];
    if (total > 0) key += 1 << b;
  }
  return key;
}

const table = new Map();
for (let i = 0; i < N; i++) {
  const key = signature(docs[i]);
  if (!table.has(key)) table.set(key, []);
  table.get(key).push(i);
}

function lshSearch(query, radius) {
  const key = signature(query);
  let candidates = [];
  const seen = new Map();
  const probes = [key];
  if (radius >= 1) {
    for (let b = 0; b < BITS; b++) probes.push(key ^ (1 << b));
  }
  if (radius >= 2) {
    for (let b = 0; b < BITS; b++) {
      for (let c = b + 1; c < BITS; c++) probes.push(key ^ (1 << b) ^ (1 << c));
    }
  }
  for (const probe of probes) {
    if (seen.has(probe)) continue;
    seen.set(probe, true);
    if (table.has(probe)) candidates = candidates.concat(table.get(probe));
  }
  return topK(query, docs, candidates);
}

// --- the measurement ----------------------------------------------------

const everything = [];
for (let i = 0; i < N; i++) everything.push(i);
const exact = [];
distances[0] = 0;
for (const q of queries) exact.push(topK(q, docs, everything));
const exactCost = Math.floor(distances[0] / QUERIES);

function recallOf(found, wanted) {
  const keep = new Map();
  for (const i of wanted) keep.set(i, true);
  let hit = 0;
  for (const i of found) {
    if (keep.has(i)) hit += 1;
  }
  return hit;
}

function pad(s, width) {
  let out = String(s);
  while (out.length < width) out += " ";
  return out;
}

function padLeft(s, width) {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

console.log(N + " documents of " + DIM + " dimensions, top " + K + ", " + QUERIES + " queries");
console.log("index built once: " + CLUSTERS + " clusters, and " + BITS + "-bit signatures");
console.log();
console.log("index                distances per query   found of " + QUERIES * K);
console.log("exact scan           " + padLeft(exactCost, 19) + "   " + padLeft(QUERIES * K, 10));

const rows = [];
for (const nprobe of [1, 2, 4, 8]) {
  distances[0] = 0;
  let hit = 0;
  for (let i = 0; i < QUERIES; i++) hit += recallOf(ivfSearch(queries[i], nprobe), exact[i]);
  rows.push(["ivf, " + nprobe + " of " + CLUSTERS + " clusters",
    Math.floor(distances[0] / QUERIES), hit]);
}
for (const radius of [0, 1, 2]) {
  distances[0] = 0;
  let hit = 0;
  for (let i = 0; i < QUERIES; i++) hit += recallOf(lshSearch(queries[i], radius), exact[i]);
  rows.push(["lsh, " + radius + " bits flipped", Math.floor(distances[0] / QUERIES), hit]);
}
for (const row of rows) {
  console.log(pad(row[0], 20) + " " + padLeft(row[1], 19) + "   " + padLeft(row[2], 10));
}
console.log();
console.log("index                recall      speed-up over the exact scan");
for (const row of rows) {
  const recall = Math.floor((row[2] * 1000) / (QUERIES * K));
  const speed = row[1] > 0 ? Math.floor((exactCost * 10) / row[1]) : 0;
  console.log(
    pad(row[0], 20) + " " + padLeft(Math.floor(recall / 10), 5) + "." + (recall % 10) + "%   " +
      padLeft(Math.floor(speed / 10), 20) + "." + (speed % 10) + "x",
  );
}
console.log();
console.log(
  [
    "Every row above is wrong some of the time, and that is the point of",
    "the lesson rather than a defect in the code. Exact search costs 2000",
    "distance computations and returns all 3000 of the true neighbours.",
    "Everything else returns fewer, and the whole design question is what",
    "exchange rate you are getting.",
    "",
    "Read the two indexes against each other at similar cost. Locality-",
    "sensitive hashing with two bits flipped spends 104 distances and",
    "recovers 62.2%. The inverted file index probing one cluster of",
    "sixteen spends 142 and recovers 53.1%. At this size, on this data,",
    "the hash table is the better buy at the cheap end -- which is not the",
    "usual folklore, and it is what the measurement says.",
    "",
    "Then read the top end. The inverted file index climbs to 99.6% at",
    "1022 distances, and it climbs smoothly: 53, 75, 92, 99.6 as the probe",
    "widens. Hashing has no comparable move. Going from one flipped bit to",
    "two multiplies the buckets probed from 13 to 79 and still only reaches",
    "62.2%, because a signature that lands on the wrong side of one plane",
    "puts a true neighbour somewhere the probe order does not reach early.",
    "That is the practical reason inverted file indexes are the default in",
    "vector databases and pure hashing mostly is not: the knob works all",
    "the way up.",
    "",
    "Both share the shape that matters. A partition is built once and",
    "reused, and a query looks at a fraction of it. Recall is a dial, not",
    "a property, and it is turned with distance computations. The lesson",
    "before this one showed that exact search cannot avoid n distances; the",
    "rows here avoid them by not looking, and pay for it in answers that",
    "are merely mostly right.",
    "",
    "The third structure named in this area, the navigable small-world",
    "graph, is not measured here because it is the graph search from",
    "earlier in this track rather than a new idea: nodes are vectors,",
    "edges join near neighbours, and a query is a greedy walk downhill",
    "towards the query point with a bounded candidate heap -- the same",
    "bounded heap as the previous lesson. Its recall dial is the size of",
    "that heap. What it buys over the two rows above is that the walk is",
    "logarithmic rather than proportional to a fraction of n, which is why",
    "it wins at a billion vectors and is not worth its memory at two",
    "thousand.",
  ].join("\\n"),
);
`,
            },
            {
              lang: "typescript",
              code: `// Approximate nearest neighbours. Two indexes, one measurement: how many
// distance computations each one spends, and how much of the true answer
// it gives back for the money.

type Pair = [number, number];

const DIM = 8;
const N = 2000;
const QUERIES = 300;
const K = 10;
const CLUSTERS = 16;
const BITS = 12;

const distances = [0];

function sqDist(a: number[], b: number[]): number {
  let total = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    total += d * d;
  }
  distances[0] += 1;
  return total;
}

function byDistThenIndex(x: Pair, y: Pair): number {
  return x[0] !== y[0] ? x[0] - y[0] : x[1] - y[1];
}

function topK(query: number[], docs: number[][], candidates: number[]): number[] {
  const scored: Pair[] = [];
  for (const i of candidates) scored.push([sqDist(query, docs[i]), i]);
  scored.sort(byDistThenIndex);
  return scored.slice(0, K).map((pair) => pair[1]);
}

// The same linear congruential generator in every language, so the random
// vectors below are the same vectors whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 30310007n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const docs: number[][] = [];
for (let d = 0; d < N; d++) {
  const v: number[] = [];
  for (let i = 0; i < DIM; i++) v.push(rand(1000));
  docs.push(v);
}
const queries: number[][] = [];
for (let q = 0; q < QUERIES; q++) {
  const v: number[] = [];
  for (let i = 0; i < DIM; i++) v.push(rand(1000));
  queries.push(v);
}

// --- an inverted file index: cluster once, then search a few clusters ----

const centroids: number[][] = [];
for (let c = 0; c < CLUSTERS; c++) centroids.push(docs[rand(N)].slice());
const assignment = new Array(N).fill(0);
for (let round = 0; round < 3; round++) {
  for (let i = 0; i < N; i++) {
    let best = 0;
    let bestD = sqDist(docs[i], centroids[0]);
    for (let c = 1; c < CLUSTERS; c++) {
      const d = sqDist(docs[i], centroids[c]);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    assignment[i] = best;
  }
  const sums: number[][] = [];
  for (let c = 0; c < CLUSTERS; c++) sums.push(new Array(DIM).fill(0));
  const counts = new Array(CLUSTERS).fill(0);
  for (let i = 0; i < N; i++) {
    const c = assignment[i];
    counts[c] += 1;
    for (let j = 0; j < DIM; j++) sums[c][j] += docs[i][j];
  }
  for (let c = 0; c < CLUSTERS; c++) {
    if (counts[c] > 0) {
      for (let j = 0; j < DIM; j++) centroids[c][j] = Math.floor(sums[c][j] / counts[c]);
    }
  }
}
const buckets: number[][] = [];
for (let c = 0; c < CLUSTERS; c++) buckets.push([]);
for (let i = 0; i < N; i++) buckets[assignment[i]].push(i);

function ivfSearch(query: number[], nprobe: number): number[] {
  const order: Pair[] = [];
  for (let c = 0; c < CLUSTERS; c++) order.push([sqDist(query, centroids[c]), c]);
  order.sort(byDistThenIndex);
  let candidates: number[] = [];
  for (let p = 0; p < nprobe; p++) candidates = candidates.concat(buckets[order[p][1]]);
  return topK(query, docs, candidates);
}

// --- locality-sensitive hashing: a signature of which side of each plane -

const planes: number[][] = [];
for (let b = 0; b < BITS; b++) {
  const plane: number[] = [];
  for (let j = 0; j < DIM; j++) plane.push(rand(3) - 1);
  planes.push(plane);
}

function signature(v: number[]): number {
  let key = 0;
  for (let b = 0; b < BITS; b++) {
    let total = 0;
    for (let j = 0; j < DIM; j++) total += (v[j] - 500) * planes[b][j];
    if (total > 0) key += 1 << b;
  }
  return key;
}

const table = new Map<number, number[]>();
for (let i = 0; i < N; i++) {
  const key = signature(docs[i]);
  if (!table.has(key)) table.set(key, []);
  table.get(key)!.push(i);
}

function lshSearch(query: number[], radius: number): number[] {
  const key = signature(query);
  let candidates: number[] = [];
  const seen = new Map<number, boolean>();
  const probes = [key];
  if (radius >= 1) {
    for (let b = 0; b < BITS; b++) probes.push(key ^ (1 << b));
  }
  if (radius >= 2) {
    for (let b = 0; b < BITS; b++) {
      for (let c = b + 1; c < BITS; c++) probes.push(key ^ (1 << b) ^ (1 << c));
    }
  }
  for (const probe of probes) {
    if (seen.has(probe)) continue;
    seen.set(probe, true);
    if (table.has(probe)) candidates = candidates.concat(table.get(probe)!);
  }
  return topK(query, docs, candidates);
}

// --- the measurement ----------------------------------------------------

const everything: number[] = [];
for (let i = 0; i < N; i++) everything.push(i);
const exact: number[][] = [];
distances[0] = 0;
for (const q of queries) exact.push(topK(q, docs, everything));
const exactCost = Math.floor(distances[0] / QUERIES);

function recallOf(found: number[], wanted: number[]): number {
  const keep = new Map<number, boolean>();
  for (const i of wanted) keep.set(i, true);
  let hit = 0;
  for (const i of found) {
    if (keep.has(i)) hit += 1;
  }
  return hit;
}

function pad(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out += " ";
  return out;
}

function padLeft(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

console.log(N + " documents of " + DIM + " dimensions, top " + K + ", " + QUERIES + " queries");
console.log("index built once: " + CLUSTERS + " clusters, and " + BITS + "-bit signatures");
console.log();
console.log("index                distances per query   found of " + QUERIES * K);
console.log("exact scan           " + padLeft(exactCost, 19) + "   " + padLeft(QUERIES * K, 10));

const rows: Array<[string, number, number]> = [];
for (const nprobe of [1, 2, 4, 8]) {
  distances[0] = 0;
  let hit = 0;
  for (let i = 0; i < QUERIES; i++) hit += recallOf(ivfSearch(queries[i], nprobe), exact[i]);
  rows.push(["ivf, " + nprobe + " of " + CLUSTERS + " clusters",
    Math.floor(distances[0] / QUERIES), hit]);
}
for (const radius of [0, 1, 2]) {
  distances[0] = 0;
  let hit = 0;
  for (let i = 0; i < QUERIES; i++) hit += recallOf(lshSearch(queries[i], radius), exact[i]);
  rows.push(["lsh, " + radius + " bits flipped", Math.floor(distances[0] / QUERIES), hit]);
}
for (const row of rows) {
  console.log(pad(row[0], 20) + " " + padLeft(row[1], 19) + "   " + padLeft(row[2], 10));
}
console.log();
console.log("index                recall      speed-up over the exact scan");
for (const row of rows) {
  const recall = Math.floor((row[2] * 1000) / (QUERIES * K));
  const speed = row[1] > 0 ? Math.floor((exactCost * 10) / row[1]) : 0;
  console.log(
    pad(row[0], 20) + " " + padLeft(Math.floor(recall / 10), 5) + "." + (recall % 10) + "%   " +
      padLeft(Math.floor(speed / 10), 20) + "." + (speed % 10) + "x",
  );
}
console.log();
console.log(
  [
    "Every row above is wrong some of the time, and that is the point of",
    "the lesson rather than a defect in the code. Exact search costs 2000",
    "distance computations and returns all 3000 of the true neighbours.",
    "Everything else returns fewer, and the whole design question is what",
    "exchange rate you are getting.",
    "",
    "Read the two indexes against each other at similar cost. Locality-",
    "sensitive hashing with two bits flipped spends 104 distances and",
    "recovers 62.2%. The inverted file index probing one cluster of",
    "sixteen spends 142 and recovers 53.1%. At this size, on this data,",
    "the hash table is the better buy at the cheap end -- which is not the",
    "usual folklore, and it is what the measurement says.",
    "",
    "Then read the top end. The inverted file index climbs to 99.6% at",
    "1022 distances, and it climbs smoothly: 53, 75, 92, 99.6 as the probe",
    "widens. Hashing has no comparable move. Going from one flipped bit to",
    "two multiplies the buckets probed from 13 to 79 and still only reaches",
    "62.2%, because a signature that lands on the wrong side of one plane",
    "puts a true neighbour somewhere the probe order does not reach early.",
    "That is the practical reason inverted file indexes are the default in",
    "vector databases and pure hashing mostly is not: the knob works all",
    "the way up.",
    "",
    "Both share the shape that matters. A partition is built once and",
    "reused, and a query looks at a fraction of it. Recall is a dial, not",
    "a property, and it is turned with distance computations. The lesson",
    "before this one showed that exact search cannot avoid n distances; the",
    "rows here avoid them by not looking, and pay for it in answers that",
    "are merely mostly right.",
    "",
    "The third structure named in this area, the navigable small-world",
    "graph, is not measured here because it is the graph search from",
    "earlier in this track rather than a new idea: nodes are vectors,",
    "edges join near neighbours, and a query is a greedy walk downhill",
    "towards the query point with a bounded candidate heap -- the same",
    "bounded heap as the previous lesson. Its recall dial is the size of",
    "that heap. What it buys over the two rows above is that the walk is",
    "logarithmic rather than proportional to a fraction of n, which is why",
    "it wins at a billion vectors and is not worth its memory at two",
    "thousand.",
  ].join("\\n"),
);
`,
            },
            {
              lang: "java",
              code: `// Approximate nearest neighbours. Two indexes, one measurement: how many
// distance computations each one spends, and how much of the true answer
// it gives back for the money.

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class Main {
  static final int DIM = 8;
  static final int N = 2000;
  static final int QUERIES = 300;
  static final int K = 10;
  static final int CLUSTERS = 16;
  static final int BITS = 12;

  static long distances = 0;

  static long sqDist(long[] a, long[] b) {
    long total = 0;
    for (int i = 0; i < a.length; i++) {
      long d = a[i] - b[i];
      total += d * d;
    }
    distances += 1;
    return total;
  }

  static class Pair {
    long dist;
    int index;

    Pair(long dist, int index) {
      this.dist = dist;
      this.index = index;
    }
  }

  static void sortPairs(List<Pair> pairs) {
    pairs.sort((x, y) -> x.dist != y.dist ? Long.compare(x.dist, y.dist) : x.index - y.index);
  }

  static long[][] docs = new long[N][DIM];
  static long[][] queries = new long[QUERIES][DIM];

  static List<Integer> topK(long[] query, List<Integer> candidates) {
    List<Pair> scored = new ArrayList<>();
    for (int i : candidates) {
      scored.add(new Pair(sqDist(query, docs[i]), i));
    }
    sortPairs(scored);
    List<Integer> out = new ArrayList<>();
    for (int i = 0; i < K && i < scored.size(); i++) {
      out.add(scored.get(i).index);
    }
    return out;
  }

  // The same linear congruential generator in every language, so the random
  // vectors below are the same vectors whichever translation is run.
  static long seed = 30310007L;

  static long rand(long n) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return seed / 65536L % n;
  }

  static long[][] centroids = new long[CLUSTERS][DIM];
  static List<List<Integer>> buckets = new ArrayList<>();
  static long[][] planes = new long[BITS][DIM];
  static Map<Integer, List<Integer>> table = new HashMap<>();

  static List<Integer> ivfSearch(long[] query, int nprobe) {
    List<Pair> order = new ArrayList<>();
    for (int c = 0; c < CLUSTERS; c++) {
      order.add(new Pair(sqDist(query, centroids[c]), c));
    }
    sortPairs(order);
    List<Integer> candidates = new ArrayList<>();
    for (int p = 0; p < nprobe; p++) {
      candidates.addAll(buckets.get(order.get(p).index));
    }
    return topK(query, candidates);
  }

  static int signature(long[] v) {
    int key = 0;
    for (int b = 0; b < BITS; b++) {
      long total = 0;
      for (int j = 0; j < DIM; j++) {
        total += (v[j] - 500) * planes[b][j];
      }
      if (total > 0) {
        key += 1 << b;
      }
    }
    return key;
  }

  static List<Integer> lshSearch(long[] query, int radius) {
    int key = signature(query);
    List<Integer> candidates = new ArrayList<>();
    Set<Integer> seen = new HashSet<>();
    List<Integer> probes = new ArrayList<>();
    probes.add(key);
    if (radius >= 1) {
      for (int b = 0; b < BITS; b++) {
        probes.add(key ^ (1 << b));
      }
    }
    if (radius >= 2) {
      for (int b = 0; b < BITS; b++) {
        for (int c = b + 1; c < BITS; c++) {
          probes.add(key ^ (1 << b) ^ (1 << c));
        }
      }
    }
    for (int probe : probes) {
      if (seen.contains(probe)) {
        continue;
      }
      seen.add(probe);
      if (table.containsKey(probe)) {
        candidates.addAll(table.get(probe));
      }
    }
    return topK(query, candidates);
  }

  static int recallOf(List<Integer> found, List<Integer> wanted) {
    Set<Integer> keep = new HashSet<>(wanted);
    int hit = 0;
    for (int i : found) {
      if (keep.contains(i)) {
        hit += 1;
      }
    }
    return hit;
  }

  public static void main(String[] args) {
    for (int d = 0; d < N; d++) {
      for (int i = 0; i < DIM; i++) {
        docs[d][i] = rand(1000);
      }
    }
    for (int q = 0; q < QUERIES; q++) {
      for (int i = 0; i < DIM; i++) {
        queries[q][i] = rand(1000);
      }
    }

    // --- an inverted file index: cluster once, then search a few clusters ----

    for (int c = 0; c < CLUSTERS; c++) {
      long[] pick = docs[(int) rand(N)];
      for (int j = 0; j < DIM; j++) {
        centroids[c][j] = pick[j];
      }
    }
    int[] assignment = new int[N];
    for (int round = 0; round < 3; round++) {
      for (int i = 0; i < N; i++) {
        int best = 0;
        long bestD = sqDist(docs[i], centroids[0]);
        for (int c = 1; c < CLUSTERS; c++) {
          long d = sqDist(docs[i], centroids[c]);
          if (d < bestD) {
            bestD = d;
            best = c;
          }
        }
        assignment[i] = best;
      }
      long[][] sums = new long[CLUSTERS][DIM];
      int[] counts = new int[CLUSTERS];
      for (int i = 0; i < N; i++) {
        int c = assignment[i];
        counts[c] += 1;
        for (int j = 0; j < DIM; j++) {
          sums[c][j] += docs[i][j];
        }
      }
      for (int c = 0; c < CLUSTERS; c++) {
        if (counts[c] > 0) {
          for (int j = 0; j < DIM; j++) {
            centroids[c][j] = sums[c][j] / counts[c];
          }
        }
      }
    }
    for (int c = 0; c < CLUSTERS; c++) {
      buckets.add(new ArrayList<>());
    }
    for (int i = 0; i < N; i++) {
      buckets.get(assignment[i]).add(i);
    }

    // --- locality-sensitive hashing: a signature of which side of each plane -

    for (int b = 0; b < BITS; b++) {
      for (int j = 0; j < DIM; j++) {
        planes[b][j] = rand(3) - 1;
      }
    }
    for (int i = 0; i < N; i++) {
      int key = signature(docs[i]);
      if (!table.containsKey(key)) {
        table.put(key, new ArrayList<>());
      }
      table.get(key).add(i);
    }

    // --- the measurement ----------------------------------------------------

    List<Integer> everything = new ArrayList<>();
    for (int i = 0; i < N; i++) {
      everything.add(i);
    }
    List<List<Integer>> exact = new ArrayList<>();
    distances = 0;
    for (int q = 0; q < QUERIES; q++) {
      exact.add(topK(queries[q], everything));
    }
    long exactCost = distances / QUERIES;

    System.out.printf(
        "%d documents of %d dimensions, top %d, %d queries%n", N, DIM, K, QUERIES);
    System.out.printf(
        "index built once: %d clusters, and %d-bit signatures%n", CLUSTERS, BITS);
    System.out.println();
    System.out.printf("index                distances per query   found of %d%n", QUERIES * K);
    System.out.printf("exact scan           %19d   %10d%n", exactCost, QUERIES * K);

    List<Object[]> rows = new ArrayList<>();
    int[] probes = {1, 2, 4, 8};
    for (int nprobe : probes) {
      distances = 0;
      int hit = 0;
      for (int i = 0; i < QUERIES; i++) {
        hit += recallOf(ivfSearch(queries[i], nprobe), exact.get(i));
      }
      rows.add(
          new Object[] {
            String.format("ivf, %d of %d clusters", nprobe, CLUSTERS), distances / QUERIES, hit
          });
    }
    int[] radii = {0, 1, 2};
    for (int radius : radii) {
      distances = 0;
      int hit = 0;
      for (int i = 0; i < QUERIES; i++) {
        hit += recallOf(lshSearch(queries[i], radius), exact.get(i));
      }
      rows.add(
          new Object[] {
            String.format("lsh, %d bits flipped", radius), distances / QUERIES, hit
          });
    }
    for (Object[] row : rows) {
      System.out.printf("%-20s %19d   %10d%n", row[0], (Long) row[1], (Integer) row[2]);
    }
    System.out.println();
    System.out.println("index                recall      speed-up over the exact scan");
    for (Object[] row : rows) {
      long cost = (Long) row[1];
      long recall = (long) (Integer) row[2] * 1000 / (QUERIES * K);
      long speed = cost > 0 ? exactCost * 10 / cost : 0;
      System.out.printf(
          "%-20s %5d.%d%%   %20d.%dx%n", row[0], recall / 10, recall % 10, speed / 10, speed % 10);
    }
    System.out.println();
    System.out.println(String.join("\\n",
        "Every row above is wrong some of the time, and that is the point of",
        "the lesson rather than a defect in the code. Exact search costs 2000",
        "distance computations and returns all 3000 of the true neighbours.",
        "Everything else returns fewer, and the whole design question is what",
        "exchange rate you are getting.",
        "",
        "Read the two indexes against each other at similar cost. Locality-",
        "sensitive hashing with two bits flipped spends 104 distances and",
        "recovers 62.2%. The inverted file index probing one cluster of",
        "sixteen spends 142 and recovers 53.1%. At this size, on this data,",
        "the hash table is the better buy at the cheap end -- which is not the",
        "usual folklore, and it is what the measurement says.",
        "",
        "Then read the top end. The inverted file index climbs to 99.6% at",
        "1022 distances, and it climbs smoothly: 53, 75, 92, 99.6 as the probe",
        "widens. Hashing has no comparable move. Going from one flipped bit to",
        "two multiplies the buckets probed from 13 to 79 and still only reaches",
        "62.2%, because a signature that lands on the wrong side of one plane",
        "puts a true neighbour somewhere the probe order does not reach early.",
        "That is the practical reason inverted file indexes are the default in",
        "vector databases and pure hashing mostly is not: the knob works all",
        "the way up.",
        "",
        "Both share the shape that matters. A partition is built once and",
        "reused, and a query looks at a fraction of it. Recall is a dial, not",
        "a property, and it is turned with distance computations. The lesson",
        "before this one showed that exact search cannot avoid n distances; the",
        "rows here avoid them by not looking, and pay for it in answers that",
        "are merely mostly right.",
        "",
        "The third structure named in this area, the navigable small-world",
        "graph, is not measured here because it is the graph search from",
        "earlier in this track rather than a new idea: nodes are vectors,",
        "edges join near neighbours, and a query is a greedy walk downhill",
        "towards the query point with a bounded candidate heap -- the same",
        "bounded heap as the previous lesson. Its recall dial is the size of",
        "that heap. What it buys over the two rows above is that the walk is",
        "logarithmic rather than proportional to a fraction of n, which is why",
        "it wins at a billion vectors and is not worth its memory at two",
        "thousand."));
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// Approximate nearest neighbours. Two indexes, one measurement: how many
// distance computations each one spends, and how much of the true answer
// it gives back for the money.

#include <algorithm>
#include <cstdio>
#include <iostream>
#include <map>
#include <set>
#include <string>
#include <vector>

static const int DIM = 8;
static const int N = 2000;
static const int QUERIES = 300;
static const int K = 10;
static const int CLUSTERS = 16;
static const int BITS = 12;

typedef std::vector<long long> Vec;

long long distances = 0;

long long sqDist(const Vec& a, const Vec& b) {
  long long total = 0;
  for (size_t i = 0; i < a.size(); i++) {
    long long d = a[i] - b[i];
    total += d * d;
  }
  distances += 1;
  return total;
}

struct Pair {
  long long dist;
  int index;
};

bool byDistThenIndex(const Pair& x, const Pair& y) {
  return x.dist != y.dist ? x.dist < y.dist : x.index < y.index;
}

std::vector<Vec> docs;
std::vector<Vec> queries;
std::vector<Vec> centroids;
std::vector<std::vector<int> > buckets;
std::vector<Vec> planes;
std::map<int, std::vector<int> > table;

std::vector<int> topK(const Vec& query, const std::vector<int>& candidates) {
  std::vector<Pair> scored;
  for (size_t c = 0; c < candidates.size(); c++) {
    int i = candidates[c];
    scored.push_back(Pair{sqDist(query, docs[i]), i});
  }
  std::sort(scored.begin(), scored.end(), byDistThenIndex);
  std::vector<int> out;
  for (int i = 0; i < K && i < (int)scored.size(); i++) {
    out.push_back(scored[i].index);
  }
  return out;
}

// The same linear congruential generator in every language, so the random
// vectors below are the same vectors whichever translation is run.
long long seed = 30310007LL;

long long rand_below(long long n) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return seed / 65536LL % n;
}

std::vector<int> ivfSearch(const Vec& query, int nprobe) {
  std::vector<Pair> order;
  for (int c = 0; c < CLUSTERS; c++) {
    order.push_back(Pair{sqDist(query, centroids[c]), c});
  }
  std::sort(order.begin(), order.end(), byDistThenIndex);
  std::vector<int> candidates;
  for (int p = 0; p < nprobe; p++) {
    const std::vector<int>& bucket = buckets[order[p].index];
    candidates.insert(candidates.end(), bucket.begin(), bucket.end());
  }
  return topK(query, candidates);
}

int signature(const Vec& v) {
  int key = 0;
  for (int b = 0; b < BITS; b++) {
    long long total = 0;
    for (int j = 0; j < DIM; j++) {
      total += (v[j] - 500) * planes[b][j];
    }
    if (total > 0) {
      key += 1 << b;
    }
  }
  return key;
}

std::vector<int> lshSearch(const Vec& query, int radius) {
  int key = signature(query);
  std::vector<int> candidates;
  std::set<int> seen;
  std::vector<int> probes;
  probes.push_back(key);
  if (radius >= 1) {
    for (int b = 0; b < BITS; b++) {
      probes.push_back(key ^ (1 << b));
    }
  }
  if (radius >= 2) {
    for (int b = 0; b < BITS; b++) {
      for (int c = b + 1; c < BITS; c++) {
        probes.push_back(key ^ (1 << b) ^ (1 << c));
      }
    }
  }
  for (size_t p = 0; p < probes.size(); p++) {
    int probe = probes[p];
    if (seen.count(probe) > 0) {
      continue;
    }
    seen.insert(probe);
    if (table.count(probe) > 0) {
      const std::vector<int>& bucket = table[probe];
      candidates.insert(candidates.end(), bucket.begin(), bucket.end());
    }
  }
  return topK(query, candidates);
}

int recallOf(const std::vector<int>& found, const std::vector<int>& wanted) {
  std::set<int> keep(wanted.begin(), wanted.end());
  int hit = 0;
  for (size_t i = 0; i < found.size(); i++) {
    if (keep.count(found[i]) > 0) {
      hit += 1;
    }
  }
  return hit;
}

int main() {
  for (int d = 0; d < N; d++) {
    Vec v;
    for (int i = 0; i < DIM; i++) {
      v.push_back(rand_below(1000));
    }
    docs.push_back(v);
  }
  for (int q = 0; q < QUERIES; q++) {
    Vec v;
    for (int i = 0; i < DIM; i++) {
      v.push_back(rand_below(1000));
    }
    queries.push_back(v);
  }

  // --- an inverted file index: cluster once, then search a few clusters ----

  for (int c = 0; c < CLUSTERS; c++) {
    centroids.push_back(docs[(int)rand_below(N)]);
  }
  std::vector<int> assignment(N, 0);
  for (int round = 0; round < 3; round++) {
    for (int i = 0; i < N; i++) {
      int best = 0;
      long long bestD = sqDist(docs[i], centroids[0]);
      for (int c = 1; c < CLUSTERS; c++) {
        long long d = sqDist(docs[i], centroids[c]);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      assignment[i] = best;
    }
    std::vector<Vec> sums(CLUSTERS, Vec(DIM, 0));
    std::vector<int> counts(CLUSTERS, 0);
    for (int i = 0; i < N; i++) {
      int c = assignment[i];
      counts[c] += 1;
      for (int j = 0; j < DIM; j++) {
        sums[c][j] += docs[i][j];
      }
    }
    for (int c = 0; c < CLUSTERS; c++) {
      if (counts[c] > 0) {
        for (int j = 0; j < DIM; j++) {
          centroids[c][j] = sums[c][j] / counts[c];
        }
      }
    }
  }
  buckets.resize(CLUSTERS);
  for (int i = 0; i < N; i++) {
    buckets[assignment[i]].push_back(i);
  }

  // --- locality-sensitive hashing: a signature of which side of each plane -

  for (int b = 0; b < BITS; b++) {
    Vec plane;
    for (int j = 0; j < DIM; j++) {
      plane.push_back(rand_below(3) - 1);
    }
    planes.push_back(plane);
  }
  for (int i = 0; i < N; i++) {
    table[signature(docs[i])].push_back(i);
  }

  // --- the measurement ----------------------------------------------------

  std::vector<int> everything;
  for (int i = 0; i < N; i++) {
    everything.push_back(i);
  }
  std::vector<std::vector<int> > exact;
  distances = 0;
  for (int q = 0; q < QUERIES; q++) {
    exact.push_back(topK(queries[q], everything));
  }
  long long exactCost = distances / QUERIES;

  std::printf("%d documents of %d dimensions, top %d, %d queries\\n", N, DIM, K, QUERIES);
  std::printf("index built once: %d clusters, and %d-bit signatures\\n", CLUSTERS, BITS);
  std::printf("\\n");
  std::printf("index                distances per query   found of %d\\n", QUERIES * K);
  std::printf("exact scan           %19lld   %10d\\n", exactCost, QUERIES * K);

  std::vector<std::string> labels;
  std::vector<long long> costs;
  std::vector<int> hits;
  int probeCounts[4] = {1, 2, 4, 8};
  for (int p = 0; p < 4; p++) {
    distances = 0;
    int hit = 0;
    for (int i = 0; i < QUERIES; i++) {
      hit += recallOf(ivfSearch(queries[i], probeCounts[p]), exact[i]);
    }
    char buffer[64];
    std::snprintf(buffer, sizeof(buffer), "ivf, %d of %d clusters", probeCounts[p], CLUSTERS);
    labels.push_back(buffer);
    costs.push_back(distances / QUERIES);
    hits.push_back(hit);
  }
  for (int radius = 0; radius < 3; radius++) {
    distances = 0;
    int hit = 0;
    for (int i = 0; i < QUERIES; i++) {
      hit += recallOf(lshSearch(queries[i], radius), exact[i]);
    }
    char buffer[64];
    std::snprintf(buffer, sizeof(buffer), "lsh, %d bits flipped", radius);
    labels.push_back(buffer);
    costs.push_back(distances / QUERIES);
    hits.push_back(hit);
  }
  for (size_t r = 0; r < labels.size(); r++) {
    std::printf("%-20s %19lld   %10d\\n", labels[r].c_str(), costs[r], hits[r]);
  }
  std::printf("\\n");
  std::printf("index                recall      speed-up over the exact scan\\n");
  for (size_t r = 0; r < labels.size(); r++) {
    long long recall = (long long)hits[r] * 1000 / (QUERIES * K);
    long long speed = costs[r] > 0 ? exactCost * 10 / costs[r] : 0;
    std::printf("%-20s %5lld.%lld%%   %20lld.%lldx\\n", labels[r].c_str(), recall / 10,
                recall % 10, speed / 10, speed % 10);
  }
  std::printf("\\n");
    std::cout
        << "Every row above is wrong some of the time, and that is the point of" << "\\n"
        << "the lesson rather than a defect in the code. Exact search costs 2000" << "\\n"
        << "distance computations and returns all 3000 of the true neighbours." << "\\n"
        << "Everything else returns fewer, and the whole design question is what" << "\\n"
        << "exchange rate you are getting." << "\\n"
        << "" << "\\n"
        << "Read the two indexes against each other at similar cost. Locality-" << "\\n"
        << "sensitive hashing with two bits flipped spends 104 distances and" << "\\n"
        << "recovers 62.2%. The inverted file index probing one cluster of" << "\\n"
        << "sixteen spends 142 and recovers 53.1%. At this size, on this data," << "\\n"
        << "the hash table is the better buy at the cheap end -- which is not the" << "\\n"
        << "usual folklore, and it is what the measurement says." << "\\n"
        << "" << "\\n"
        << "Then read the top end. The inverted file index climbs to 99.6% at" << "\\n"
        << "1022 distances, and it climbs smoothly: 53, 75, 92, 99.6 as the probe" << "\\n"
        << "widens. Hashing has no comparable move. Going from one flipped bit to" << "\\n"
        << "two multiplies the buckets probed from 13 to 79 and still only reaches" << "\\n"
        << "62.2%, because a signature that lands on the wrong side of one plane" << "\\n"
        << "puts a true neighbour somewhere the probe order does not reach early." << "\\n"
        << "That is the practical reason inverted file indexes are the default in" << "\\n"
        << "vector databases and pure hashing mostly is not: the knob works all" << "\\n"
        << "the way up." << "\\n"
        << "" << "\\n"
        << "Both share the shape that matters. A partition is built once and" << "\\n"
        << "reused, and a query looks at a fraction of it. Recall is a dial, not" << "\\n"
        << "a property, and it is turned with distance computations. The lesson" << "\\n"
        << "before this one showed that exact search cannot avoid n distances; the" << "\\n"
        << "rows here avoid them by not looking, and pay for it in answers that" << "\\n"
        << "are merely mostly right." << "\\n"
        << "" << "\\n"
        << "The third structure named in this area, the navigable small-world" << "\\n"
        << "graph, is not measured here because it is the graph search from" << "\\n"
        << "earlier in this track rather than a new idea: nodes are vectors," << "\\n"
        << "edges join near neighbours, and a query is a greedy walk downhill" << "\\n"
        << "towards the query point with a bounded candidate heap -- the same" << "\\n"
        << "bounded heap as the previous lesson. Its recall dial is the size of" << "\\n"
        << "that heap. What it buys over the two rows above is that the walk is" << "\\n"
        << "logarithmic rather than proportional to a fraction of n, which is why" << "\\n"
        << "it wins at a billion vectors and is not worth its memory at two" << "\\n"
        << "thousand." << "\\n"
        ;
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Approximate nearest neighbours. Two indexes, one measurement: how many
// distance computations each one spends, and how much of the true answer
// it gives back for the money.

use std::collections::HashMap;
use std::collections::HashSet;

const DIM: usize = 8;
const N: usize = 2000;
const QUERIES: usize = 300;
const K: usize = 10;
const CLUSTERS: usize = 16;
const BITS: usize = 12;

static mut DISTANCES: i64 = 0;

fn sq_dist(a: &[i64], b: &[i64]) -> i64 {
    let mut total = 0;
    for i in 0..a.len() {
        let d = a[i] - b[i];
        total += d * d;
    }
    unsafe {
        DISTANCES += 1;
    }
    total
}

fn spent() -> i64 {
    unsafe { DISTANCES }
}

fn reset() {
    unsafe {
        DISTANCES = 0;
    }
}

fn top_k(query: &[i64], docs: &[Vec<i64>], candidates: &[usize]) -> Vec<usize> {
    let mut scored: Vec<(i64, usize)> = Vec::new();
    for &i in candidates {
        scored.push((sq_dist(query, &docs[i]), i));
    }
    scored.sort();
    scored.iter().take(K).map(|p| p.1).collect()
}

// The same linear congruential generator in every language, so the random
// vectors below are the same vectors whichever translation is run.
static mut SEED: i64 = 30310007;

fn rand_below(n: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % n
    }
}

fn signature(v: &[i64], planes: &[Vec<i64>]) -> i32 {
    let mut key = 0;
    for b in 0..BITS {
        let mut total = 0;
        for j in 0..DIM {
            total += (v[j] - 500) * planes[b][j];
        }
        if total > 0 {
            key += 1 << b;
        }
    }
    key
}

fn main() {
    let mut docs: Vec<Vec<i64>> = Vec::new();
    for _ in 0..N {
        let mut v: Vec<i64> = Vec::new();
        for _ in 0..DIM {
            v.push(rand_below(1000));
        }
        docs.push(v);
    }
    let mut queries: Vec<Vec<i64>> = Vec::new();
    for _ in 0..QUERIES {
        let mut v: Vec<i64> = Vec::new();
        for _ in 0..DIM {
            v.push(rand_below(1000));
        }
        queries.push(v);
    }

    // --- an inverted file index: cluster once, then search a few clusters ----

    let mut centroids: Vec<Vec<i64>> = Vec::new();
    for _ in 0..CLUSTERS {
        let pick = rand_below(N as i64) as usize;
        centroids.push(docs[pick].clone());
    }
    let mut assignment: Vec<usize> = vec![0; N];
    for _ in 0..3 {
        for i in 0..N {
            let mut best = 0;
            let mut best_d = sq_dist(&docs[i], &centroids[0]);
            for c in 1..CLUSTERS {
                let d = sq_dist(&docs[i], &centroids[c]);
                if d < best_d {
                    best_d = d;
                    best = c;
                }
            }
            assignment[i] = best;
        }
        let mut sums: Vec<Vec<i64>> = vec![vec![0; DIM]; CLUSTERS];
        let mut counts: Vec<i64> = vec![0; CLUSTERS];
        for i in 0..N {
            let c = assignment[i];
            counts[c] += 1;
            for j in 0..DIM {
                sums[c][j] += docs[i][j];
            }
        }
        for c in 0..CLUSTERS {
            if counts[c] > 0 {
                for j in 0..DIM {
                    centroids[c][j] = sums[c][j] / counts[c];
                }
            }
        }
    }
    let mut buckets: Vec<Vec<usize>> = vec![Vec::new(); CLUSTERS];
    for i in 0..N {
        buckets[assignment[i]].push(i);
    }

    // --- locality-sensitive hashing: a signature of which side of each plane -

    let mut planes: Vec<Vec<i64>> = Vec::new();
    for _ in 0..BITS {
        let mut plane: Vec<i64> = Vec::new();
        for _ in 0..DIM {
            plane.push(rand_below(3) - 1);
        }
        planes.push(plane);
    }
    let mut table: HashMap<i32, Vec<usize>> = HashMap::new();
    for i in 0..N {
        table.entry(signature(&docs[i], &planes)).or_insert_with(Vec::new).push(i);
    }

    let ivf_search = |query: &[i64], nprobe: usize, docs: &[Vec<i64>]| -> Vec<usize> {
        let mut order: Vec<(i64, usize)> = Vec::new();
        for c in 0..CLUSTERS {
            order.push((sq_dist(query, &centroids[c]), c));
        }
        order.sort();
        let mut candidates: Vec<usize> = Vec::new();
        for p in 0..nprobe {
            candidates.extend(buckets[order[p].1].iter());
        }
        top_k(query, docs, &candidates)
    };

    let lsh_search = |query: &[i64], radius: usize, docs: &[Vec<i64>]| -> Vec<usize> {
        let key = signature(query, &planes);
        let mut candidates: Vec<usize> = Vec::new();
        let mut seen: HashSet<i32> = HashSet::new();
        let mut probes: Vec<i32> = vec![key];
        if radius >= 1 {
            for b in 0..BITS {
                probes.push(key ^ (1 << b));
            }
        }
        if radius >= 2 {
            for b in 0..BITS {
                for c in (b + 1)..BITS {
                    probes.push(key ^ (1 << b) ^ (1 << c));
                }
            }
        }
        for probe in probes {
            if seen.contains(&probe) {
                continue;
            }
            seen.insert(probe);
            if let Some(bucket) = table.get(&probe) {
                candidates.extend(bucket.iter());
            }
        }
        top_k(query, docs, &candidates)
    };

    // --- the measurement ----------------------------------------------------

    let everything: Vec<usize> = (0..N).collect();
    let mut exact: Vec<Vec<usize>> = Vec::new();
    reset();
    for q in queries.iter() {
        exact.push(top_k(q, &docs, &everything));
    }
    let exact_cost = spent() / QUERIES as i64;

    println!("{} documents of {} dimensions, top {}, {} queries", N, DIM, K, QUERIES);
    println!("index built once: {} clusters, and {}-bit signatures", CLUSTERS, BITS);
    println!();
    println!("index                distances per query   found of {}", QUERIES * K);
    println!("exact scan           {:>19}   {:>10}", exact_cost, QUERIES * K);

    let recall_of = |found: &[usize], wanted: &[usize]| -> i64 {
        let keep: HashSet<usize> = wanted.iter().cloned().collect();
        let mut hit = 0;
        for i in found {
            if keep.contains(i) {
                hit += 1;
            }
        }
        hit
    };

    let mut rows: Vec<(String, i64, i64)> = Vec::new();
    for &nprobe in [1usize, 2, 4, 8].iter() {
        reset();
        let mut hit = 0;
        for i in 0..QUERIES {
            hit += recall_of(&ivf_search(&queries[i], nprobe, &docs), &exact[i]);
        }
        rows.push((
            format!("ivf, {} of {} clusters", nprobe, CLUSTERS),
            spent() / QUERIES as i64,
            hit,
        ));
    }
    for &radius in [0usize, 1, 2].iter() {
        reset();
        let mut hit = 0;
        for i in 0..QUERIES {
            hit += recall_of(&lsh_search(&queries[i], radius, &docs), &exact[i]);
        }
        rows.push((
            format!("lsh, {} bits flipped", radius),
            spent() / QUERIES as i64,
            hit,
        ));
    }
    for row in rows.iter() {
        println!("{:<20} {:>19}   {:>10}", row.0, row.1, row.2);
    }
    println!();
    println!("index                recall      speed-up over the exact scan");
    for row in rows.iter() {
        let recall = row.2 * 1000 / (QUERIES * K) as i64;
        let speed = if row.1 > 0 { exact_cost * 10 / row.1 } else { 0 };
        println!(
            "{:<20} {:>5}.{}%   {:>20}.{}x",
            row.0,
            recall / 10,
            recall % 10,
            speed / 10,
            speed % 10
        );
    }
    println!();
    println!("{}", [
        "Every row above is wrong some of the time, and that is the point of",
        "the lesson rather than a defect in the code. Exact search costs 2000",
        "distance computations and returns all 3000 of the true neighbours.",
        "Everything else returns fewer, and the whole design question is what",
        "exchange rate you are getting.",
        "",
        "Read the two indexes against each other at similar cost. Locality-",
        "sensitive hashing with two bits flipped spends 104 distances and",
        "recovers 62.2%. The inverted file index probing one cluster of",
        "sixteen spends 142 and recovers 53.1%. At this size, on this data,",
        "the hash table is the better buy at the cheap end -- which is not the",
        "usual folklore, and it is what the measurement says.",
        "",
        "Then read the top end. The inverted file index climbs to 99.6% at",
        "1022 distances, and it climbs smoothly: 53, 75, 92, 99.6 as the probe",
        "widens. Hashing has no comparable move. Going from one flipped bit to",
        "two multiplies the buckets probed from 13 to 79 and still only reaches",
        "62.2%, because a signature that lands on the wrong side of one plane",
        "puts a true neighbour somewhere the probe order does not reach early.",
        "That is the practical reason inverted file indexes are the default in",
        "vector databases and pure hashing mostly is not: the knob works all",
        "the way up.",
        "",
        "Both share the shape that matters. A partition is built once and",
        "reused, and a query looks at a fraction of it. Recall is a dial, not",
        "a property, and it is turned with distance computations. The lesson",
        "before this one showed that exact search cannot avoid n distances; the",
        "rows here avoid them by not looking, and pay for it in answers that",
        "are merely mostly right.",
        "",
        "The third structure named in this area, the navigable small-world",
        "graph, is not measured here because it is the graph search from",
        "earlier in this track rather than a new idea: nodes are vectors,",
        "edges join near neighbours, and a query is a greedy walk downhill",
        "towards the query point with a bounded candidate heap -- the same",
        "bounded heap as the previous lesson. Its recall dial is the size of",
        "that heap. What it buys over the two rows above is that the walk is",
        "logarithmic rather than proportional to a fraction of n, which is why",
        "it wins at a billion vectors and is not worth its memory at two",
        "thousand.",
    ].join("\\n"));
}
`,
            },
            {
              lang: "go",
              code: `// Approximate nearest neighbours. Two indexes, one measurement: how many
// distance computations each one spends, and how much of the true answer
// it gives back for the money.

package main

import (
	"fmt"
	"sort"
	"strings"
)

const dim = 8
const n = 2000
const queryCount = 300
const k = 10
const clusters = 16
const bits = 12

var distances int64

func sqDist(a, b []int64) int64 {
	var total int64
	for i := range a {
		d := a[i] - b[i]
		total += d * d
	}
	distances++
	return total
}

type pair struct {
	dist  int64
	index int
}

func sortPairs(pairs []pair) {
	sort.Slice(pairs, func(x, y int) bool {
		if pairs[x].dist != pairs[y].dist {
			return pairs[x].dist < pairs[y].dist
		}
		return pairs[x].index < pairs[y].index
	})
}

var docs [][]int64
var queries [][]int64
var centroids [][]int64
var buckets [][]int
var planes [][]int64
var table map[int][]int

func topK(query []int64, candidates []int) []int {
	scored := []pair{}
	for _, i := range candidates {
		scored = append(scored, pair{dist: sqDist(query, docs[i]), index: i})
	}
	sortPairs(scored)
	out := []int{}
	for i := 0; i < k && i < len(scored); i++ {
		out = append(out, scored[i].index)
	}
	return out
}

// The same linear congruential generator in every language, so the random
// vectors below are the same vectors whichever translation is run.
var seed int64 = 30310007

func randBelow(limit int64) int64 {
	seed = (seed*1103515245 + 12345) % 2147483648
	return seed / 65536 % limit
}

func ivfSearch(query []int64, nprobe int) []int {
	order := []pair{}
	for c := 0; c < clusters; c++ {
		order = append(order, pair{dist: sqDist(query, centroids[c]), index: c})
	}
	sortPairs(order)
	candidates := []int{}
	for p := 0; p < nprobe; p++ {
		candidates = append(candidates, buckets[order[p].index]...)
	}
	return topK(query, candidates)
}

func signature(v []int64) int {
	key := 0
	for b := 0; b < bits; b++ {
		var total int64
		for j := 0; j < dim; j++ {
			total += (v[j] - 500) * planes[b][j]
		}
		if total > 0 {
			key += 1 << b
		}
	}
	return key
}

func lshSearch(query []int64, radius int) []int {
	key := signature(query)
	candidates := []int{}
	seen := map[int]bool{}
	probes := []int{key}
	if radius >= 1 {
		for b := 0; b < bits; b++ {
			probes = append(probes, key^(1<<b))
		}
	}
	if radius >= 2 {
		for b := 0; b < bits; b++ {
			for c := b + 1; c < bits; c++ {
				probes = append(probes, key^(1<<b)^(1<<c))
			}
		}
	}
	for _, probe := range probes {
		if seen[probe] {
			continue
		}
		seen[probe] = true
		if bucket, ok := table[probe]; ok {
			candidates = append(candidates, bucket...)
		}
	}
	return topK(query, candidates)
}

func recallOf(found, wanted []int) int {
	keep := map[int]bool{}
	for _, i := range wanted {
		keep[i] = true
	}
	hit := 0
	for _, i := range found {
		if keep[i] {
			hit++
		}
	}
	return hit
}

func main() {
	for d := 0; d < n; d++ {
		v := []int64{}
		for i := 0; i < dim; i++ {
			v = append(v, randBelow(1000))
		}
		docs = append(docs, v)
	}
	for q := 0; q < queryCount; q++ {
		v := []int64{}
		for i := 0; i < dim; i++ {
			v = append(v, randBelow(1000))
		}
		queries = append(queries, v)
	}

	// --- an inverted file index: cluster once, then search a few clusters ----

	for c := 0; c < clusters; c++ {
		pick := docs[randBelow(n)]
		centroids = append(centroids, append([]int64{}, pick...))
	}
	assignment := make([]int, n)
	for round := 0; round < 3; round++ {
		for i := 0; i < n; i++ {
			best := 0
			bestD := sqDist(docs[i], centroids[0])
			for c := 1; c < clusters; c++ {
				d := sqDist(docs[i], centroids[c])
				if d < bestD {
					bestD = d
					best = c
				}
			}
			assignment[i] = best
		}
		sums := make([][]int64, clusters)
		for c := range sums {
			sums[c] = make([]int64, dim)
		}
		counts := make([]int64, clusters)
		for i := 0; i < n; i++ {
			c := assignment[i]
			counts[c]++
			for j := 0; j < dim; j++ {
				sums[c][j] += docs[i][j]
			}
		}
		for c := 0; c < clusters; c++ {
			if counts[c] > 0 {
				for j := 0; j < dim; j++ {
					centroids[c][j] = sums[c][j] / counts[c]
				}
			}
		}
	}
	buckets = make([][]int, clusters)
	for i := 0; i < n; i++ {
		buckets[assignment[i]] = append(buckets[assignment[i]], i)
	}

	// --- locality-sensitive hashing: a signature of which side of each plane -

	for b := 0; b < bits; b++ {
		plane := []int64{}
		for j := 0; j < dim; j++ {
			plane = append(plane, randBelow(3)-1)
		}
		planes = append(planes, plane)
	}
	table = map[int][]int{}
	for i := 0; i < n; i++ {
		key := signature(docs[i])
		table[key] = append(table[key], i)
	}

	// --- the measurement ----------------------------------------------------

	everything := []int{}
	for i := 0; i < n; i++ {
		everything = append(everything, i)
	}
	exact := [][]int{}
	distances = 0
	for q := 0; q < queryCount; q++ {
		exact = append(exact, topK(queries[q], everything))
	}
	exactCost := distances / queryCount

	fmt.Printf("%d documents of %d dimensions, top %d, %d queries\\n", n, dim, k, queryCount)
	fmt.Printf("index built once: %d clusters, and %d-bit signatures\\n", clusters, bits)
	fmt.Println()
	fmt.Printf("index                distances per query   found of %d\\n", queryCount*k)
	fmt.Printf("exact scan           %19d   %10d\\n", exactCost, queryCount*k)

	type row struct {
		label string
		cost  int64
		hits  int
	}
	rows := []row{}
	for _, nprobe := range []int{1, 2, 4, 8} {
		distances = 0
		hit := 0
		for i := 0; i < queryCount; i++ {
			hit += recallOf(ivfSearch(queries[i], nprobe), exact[i])
		}
		rows = append(rows, row{
			label: fmt.Sprintf("ivf, %d of %d clusters", nprobe, clusters),
			cost:  distances / queryCount,
			hits:  hit,
		})
	}
	for _, radius := range []int{0, 1, 2} {
		distances = 0
		hit := 0
		for i := 0; i < queryCount; i++ {
			hit += recallOf(lshSearch(queries[i], radius), exact[i])
		}
		rows = append(rows, row{
			label: fmt.Sprintf("lsh, %d bits flipped", radius),
			cost:  distances / queryCount,
			hits:  hit,
		})
	}
	for _, r := range rows {
		fmt.Printf("%-20s %19d   %10d\\n", r.label, r.cost, r.hits)
	}
	fmt.Println()
	fmt.Println("index                recall      speed-up over the exact scan")
	for _, r := range rows {
		recall := int64(r.hits) * 1000 / int64(queryCount*k)
		var speed int64
		if r.cost > 0 {
			speed = exactCost * 10 / r.cost
		}
		fmt.Printf("%-20s %5d.%d%%   %20d.%dx\\n", r.label, recall/10, recall%10, speed/10, speed%10)
	}
	fmt.Println()
	fmt.Println(strings.Join([]string{
		"Every row above is wrong some of the time, and that is the point of",
		"the lesson rather than a defect in the code. Exact search costs 2000",
		"distance computations and returns all 3000 of the true neighbours.",
		"Everything else returns fewer, and the whole design question is what",
		"exchange rate you are getting.",
		"",
		"Read the two indexes against each other at similar cost. Locality-",
		"sensitive hashing with two bits flipped spends 104 distances and",
		"recovers 62.2%. The inverted file index probing one cluster of",
		"sixteen spends 142 and recovers 53.1%. At this size, on this data,",
		"the hash table is the better buy at the cheap end -- which is not the",
		"usual folklore, and it is what the measurement says.",
		"",
		"Then read the top end. The inverted file index climbs to 99.6% at",
		"1022 distances, and it climbs smoothly: 53, 75, 92, 99.6 as the probe",
		"widens. Hashing has no comparable move. Going from one flipped bit to",
		"two multiplies the buckets probed from 13 to 79 and still only reaches",
		"62.2%, because a signature that lands on the wrong side of one plane",
		"puts a true neighbour somewhere the probe order does not reach early.",
		"That is the practical reason inverted file indexes are the default in",
		"vector databases and pure hashing mostly is not: the knob works all",
		"the way up.",
		"",
		"Both share the shape that matters. A partition is built once and",
		"reused, and a query looks at a fraction of it. Recall is a dial, not",
		"a property, and it is turned with distance computations. The lesson",
		"before this one showed that exact search cannot avoid n distances; the",
		"rows here avoid them by not looking, and pay for it in answers that",
		"are merely mostly right.",
		"",
		"The third structure named in this area, the navigable small-world",
		"graph, is not measured here because it is the graph search from",
		"earlier in this track rather than a new idea: nodes are vectors,",
		"edges join near neighbours, and a query is a greedy walk downhill",
		"towards the query point with a bounded candidate heap -- the same",
		"bounded heap as the previous lesson. Its recall dial is the size of",
		"that heap. What it buys over the two rows above is that the walk is",
		"logarithmic rather than proportional to a fraction of n, which is why",
		"it wins at a billion vectors and is not worth its memory at two",
		"thousand.",
	}, "\\n"))
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "reading-it",
      heading: "Why the inverted index is the production default",
      body: [
        "Both indexes share the shape that matters: partition once, search a fraction. The difference the table exposes is not the cheap end, where hashing wins here \u2014 it is that **the inverted index's knob keeps working**.",
        "Recall of 53, 75, 92, 99.6 as `nprobe` doubles is a usable curve: you can pick a latency budget and read off the recall, or pick a recall target and read off the budget. That is what an operator needs.",
        "Hashing's knob saturates. The probe count grows combinatorially \u2014 one bit is 13 buckets, two bits is 79, three would be 299 \u2014 while recall creeps. The reason is structural: the signature discards everything except which side of each plane the vector fell on, and a near neighbour that lands on the wrong side of one plane is not merely ranked lower, it is in a different bucket, reachable only by widening the probe to include a great many buckets that contain nothing relevant.",
        "That is why production vector databases are built on clustered inverted indexes and graph indexes rather than on pure hashing, and it is a better reason than \"hashing is old\".",
      ],
      pitfalls: [
        {
          title: "Reporting recall without reporting cost",
          body: "Either number alone is meaningless. 99.6% recall at 1,022 distances and 9.8% at 4 are both on the same curve; only the pair says anything.",
        },
        {
          title: "Tuning nprobe on the training data",
          body: "Recall must be measured against exact answers on held-out queries, which is what the program does -- exact top-k is computed first and everything is scored against it.",
        },
        {
          title: "Assuming a bigger index means better recall",
          body: "More clusters with the same nprobe means smaller buckets and lower recall at lower cost. The two knobs interact, and only the measured curve tells you where you are.",
        },
      ],
    },
    {
      id: "hnsw",
      heading: "The graph index, and where it belongs",
      body: [
        "The third structure in this area \u2014 the hierarchical navigable small-world graph, HNSW \u2014 is not measured above, and it is worth saying plainly why: at two thousand vectors it would not earn its memory, and the honest table would show it losing.",
        "Structurally it is the graph search from earlier in this track, with nothing new in it. Each vector is a node. Edges join it to some of its near neighbours. A query enters at an arbitrary node and walks greedily downhill towards the query point, keeping a bounded candidate heap \u2014 the same bounded heap from the previous lesson \u2014 and stopping when no neighbour of anything in the heap improves on it. The recall knob is the size of that heap.",
        "The hierarchy is the part the name emphasises and it is a familiar idea: several layers, sparse at the top and complete at the bottom, so the walk takes long strides first and short ones near the target. That is a skip list applied to a graph.",
        "What it buys is the search being roughly logarithmic in `n` rather than a fixed fraction of it, which is why it dominates at a hundred million vectors and is pointless at two thousand. What it costs is memory for every edge and an index that is expensive to build and awkward to update, since deleting a node leaves the graph's navigability to be repaired.",
        "The useful summary of this area: **hashing partitions by a random projection, the inverted index partitions by clustering, and the graph does not partition at all \u2014 it navigates.** All three are ways of not looking at everything, and all three are paid for in recall.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does an approximate nearest-neighbour index work, and what does it cost?",
      answer:
        "It partitions the data once so a query can look at a fraction of it, and it pays for that in recall -- the fraction of the true neighbours it actually returns. Recall is a dial, not a property. I measured two indexes on the same 2,000 vectors: an inverted file index that clusters into sixteen buckets and probes the nearest few, and locality-sensitive hashing with twelve random hyperplanes. At similar cost hashing did better at the cheap end, 62.2% recall for 104 distances against 53.1% for 142. But the inverted index climbs smoothly to 99.6% at 1,022 distances as the probe widens, and hashing saturates around 62% because a neighbour on the wrong side of one plane is in a different bucket entirely. The usable knob is why clustered indexes are the production default.",
    },
    {
      question: "What is HNSW, in data structures terms?",
      answer:
        "It is a graph search, and there is nothing in it this track has not already covered. Vectors are nodes, edges join near neighbours, and a query walks greedily downhill towards the query point keeping a bounded candidate heap -- the same bounded max-heap as exact top-k, and its size is the recall knob. The hierarchy is a skip list applied to a graph: sparse layers on top for long strides, the complete graph at the bottom for the final approach. It buys search that is roughly logarithmic in n rather than a fixed fraction of n, which is why it wins at a hundred million vectors and is not worth its memory at a few thousand. It costs memory per edge and it is awkward to update, since deleting a node leaves the navigability to repair.",
    },
  ],
  takeaways: [
    "Recall is a dial turned with distance computations, not a correctness property",
    "Report recall and cost together — either number alone says nothing",
    "Measured: hashing better at the cheap end, 62.2% for 104 distances",
    "Measured: the inverted index climbs 53 → 75 → 92 → 99.6 as the probe widens",
    "Hashing saturates because a wrong side of one plane means a different bucket",
    "HNSW is a greedy graph walk with a bounded heap, plus a skip list of layers",
    "Hashing partitions by projection, the inverted index by clustering, the graph navigates",
  ],
};
