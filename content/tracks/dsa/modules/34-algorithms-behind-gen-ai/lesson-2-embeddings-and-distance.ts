import type { Lesson } from "@/content/types";

export const embeddingsAndDistanceLesson: Lesson = {
  id: "dsa-gen-ai-embeddings-and-distance",
  slug: "embeddings-and-distance",
  moduleSlug: "algorithms-behind-gen-ai",
  title: "Embeddings and Distance: Cosine, Dot Product, Euclidean",
  summary:
    "Three metrics, three different nearest neighbours for the same query. Measured: scaling every document by a random factor left cosine's answer unchanged 3,000 times out of 3,000, dot product's 1,190 times, and euclidean's 766.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "State what an embedding is in terms a data structures course can check",
    "Distinguish dot product, cosine and euclidean distance by what each ignores",
    "Measure which of the three is invariant to vector length",
    "Explain why normalising on the way in makes the choice disappear",
  ],
  sections: [
    {
      id: "what-an-embedding-is",
      heading: "What an embedding is, structurally",
      body: [
        "An embedding is an array of numbers, typically 384, 768 or 1536 of them, produced by a model from a piece of text. That is the entire data structure: a fixed-length array of floats.",
        "The claim that makes it useful is that **direction encodes meaning**. Two texts about the same thing produce arrays pointing roughly the same way; two texts about different things point differently. Nothing in this lesson depends on why that is true \u2014 it is the model's job \u2014 but everything depends on that word *direction*, which is what the measurement below is about.",
        "Given that, semantic search reduces to a problem this track already covered: given a query point and a million stored points, find the nearest ones. The hard part is not the search. It is that \"nearest\" has at least three definitions and they disagree.",
      ],
    },
    {
      id: "three-metrics",
      heading: "Three metrics that disagree",
      body: [
        "**Dot product**: multiply matching components, add them up. Large when the vectors point the same way *and* when either one is long.",
        "**Cosine similarity**: the dot product divided by both lengths. Purely the angle; length cancels.",
        "**Euclidean distance**: the length of the difference. Position, not direction \u2014 two vectors pointing identically but of different lengths are far apart.",
        "The program below puts one query against four documents chosen to separate the three, and then runs the experiment that decides which to use: multiply every document by a random factor, which changes each vector's length and nothing about its direction, and see whose answer survives.",
      ],
      examples: [
        {
          id: "three-metrics-one-query",
          title: "The same four documents, ranked three ways, then stretched",
          lang: "python",
          code: `# Three ways to say two vectors are close. They are three different orderings,
# and only one of them ignores how long the vectors are.

DIM = 5


def dot(a, b):
    total = 0
    for i in range(len(a)):
        total += a[i] * b[i]
    return total


def sq_len(a):
    return dot(a, a)


def sq_dist(a, b):
    total = 0
    for i in range(len(a)):
        d = a[i] - b[i]
        total += d * d
    return total


def cos2_milli(a, b):
    # cosine squared, times 1000, in integers. Every component here is
    # non-negative, so the cosine is too, and squaring keeps the order.
    top = dot(a, b) * dot(a, b) * 1000
    bottom = sq_len(a) * sq_len(b)
    if bottom == 0:
        return 0
    return top // bottom


def best_by_dot(query, docs):
    best = 0
    for i in range(1, len(docs)):
        if dot(query, docs[i]) > dot(query, docs[best]):
            best = i
    return best


def best_by_cosine(query, docs):
    # compare a.b1 squared times |b2| squared against a.b2 squared times
    # |b1| squared -- the same comparison as cosine, with no division.
    best = 0
    for i in range(1, len(docs)):
        left = dot(query, docs[i]) * dot(query, docs[i]) * sq_len(docs[best])
        right = dot(query, docs[best]) * dot(query, docs[best]) * sq_len(docs[i])
        if left > right:
            best = i
    return best


def best_by_euclidean(query, docs):
    best = 0
    for i in range(1, len(docs)):
        if sq_dist(query, docs[i]) < sq_dist(query, docs[best]):
            best = i
    return best


def scaled(v, k):
    return [x * k for x in v]


def show(v):
    return "[" + " ".join("%d" % x for x in v) + "]"


query = [3, 1, 4, 1, 5]
docs = [
    [6, 2, 8, 2, 10],   # exactly twice the query
    [3, 1, 4, 1, 5],    # the query itself
    [9, 9, 9, 9, 9],    # long, and pointing somewhere else
    [1, 0, 1, 0, 2],    # short, and pointing almost the same way
]
names = ["twice the query", "the query itself", "long, wrong way", "short, right way"]

print("query %s" % show(query))
print()
print("document          vector           dot   len^2   dist^2  cos^2 x1000")
for i in range(len(docs)):
    print("%-16s  %-14s %5d  %6d  %7d  %11d"
          % (names[i], show(docs[i]), dot(query, docs[i]), sq_len(docs[i]),
             sq_dist(query, docs[i]), cos2_milli(query, docs[i])))
print()
print("nearest by dot product   %s" % names[best_by_dot(query, docs)])
print("nearest by cosine        %s" % names[best_by_cosine(query, docs)])
print("nearest by euclidean     %s" % names[best_by_euclidean(query, docs)])
print()

# The same linear congruential generator in every language, so the random
# vectors below are the same vectors whichever translation is run.
seed = 91130477


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
DOCS = 8
agree_dot_cos = 0
agree_euc_cos = 0
agree_dot_euc = 0
kept_dot = 0
kept_cos = 0
kept_euc = 0
for _ in range(TRIALS):
    q = [rand(10) for _ in range(DIM)]
    library = []
    for _d in range(DOCS):
        library.append([rand(10) for _ in range(DIM)])
    d0 = best_by_dot(q, library)
    c0 = best_by_cosine(q, library)
    e0 = best_by_euclidean(q, library)
    if d0 == c0:
        agree_dot_cos += 1
    if e0 == c0:
        agree_euc_cos += 1
    if d0 == e0:
        agree_dot_euc += 1
    stretched = []
    for d in range(DOCS):
        stretched.append(scaled(library[d], 1 + rand(5)))
    if best_by_dot(q, stretched) == d0:
        kept_dot += 1
    if best_by_cosine(q, stretched) == c0:
        kept_cos += 1
    if best_by_euclidean(q, stretched) == e0:
        kept_euc += 1

print("over %d random queries against %d random documents each:" % (TRIALS, DOCS))
print()
print("  pair of metrics            picked the same document")
print("  dot and cosine             %8d" % agree_dot_cos)
print("  euclidean and cosine       %8d" % agree_euc_cos)
print("  dot and euclidean          %8d" % agree_dot_euc)
print()
print("then every document is multiplied by a random 1 to 5, which changes")
print("its length and not its direction:")
print()
print("  metric                     still picked the same document")
print("  dot product                %8d" % kept_dot)
print("  cosine                     %8d" % kept_cos)
print("  euclidean                  %8d" % kept_euc)
print()
print("""Four documents, one query, three metrics, three different answers.
That is the whole lesson and it is worth sitting with, because the
three are routinely spoken of as though they were the same idea.

Dot product picks the all-nines vector. It points somewhere else
entirely -- its cosine is the worst of the four -- but it is long, and
the dot product rewards length. Euclidean picks the exact copy, which
is correct here and is correct for the wrong reason: it is measuring
position, so a vector twice as long is far away even when it points
the same way. Cosine cannot tell the query from twice the query,
because they have the same direction, and it reports 1000 for both.

The stretching experiment is the one that settles which to use.
Multiply every document by a random factor and nothing about its
meaning has changed -- direction is what an embedding encodes. Cosine
kept the same answer 3000 times out of 3000, which is not a
statistical result but an identity: scaling cancels in the
denominator. Dot product kept it 1190 times and euclidean 766.

So the reason cosine is the default for text embeddings is not
tradition. It is the only one of the three that ignores a quantity the
model never meant to encode -- and a document's vector length in
practice tracks things like how long the document was, which is
exactly the thing you do not want deciding your search results.

The other two are not wrong, they are answers to different questions.
And there is a shortcut worth knowing: if every vector is normalised
to length one first, the denominator becomes one and cosine is just
the dot product, while euclidean distance becomes two minus twice the
dot product. All three collapse into the same ordering. That is why
production vector databases normalise on the way in and then use dot
product -- it is cosine, with the division already paid for.""")
`,
          output: `query [3 1 4 1 5]

document          vector           dot   len^2   dist^2  cos^2 x1000
twice the query   [6 2 8 2 10]     104     208       52         1000
the query itself  [3 1 4 1 5]       52      52        0         1000
long, wrong way   [9 9 9 9 9]      126     405      205          753
short, right way  [1 0 1 0 2]       17       6       24          926

nearest by dot product   long, wrong way
nearest by cosine        twice the query
nearest by euclidean     the query itself

over 3000 random queries against 8 random documents each:

  pair of metrics            picked the same document
  dot and cosine                 1222
  euclidean and cosine           2117
  dot and euclidean               820

then every document is multiplied by a random 1 to 5, which changes
its length and not its direction:

  metric                     still picked the same document
  dot product                    1190
  cosine                         3000
  euclidean                       766

Four documents, one query, three metrics, three different answers.
That is the whole lesson and it is worth sitting with, because the
three are routinely spoken of as though they were the same idea.

Dot product picks the all-nines vector. It points somewhere else
entirely -- its cosine is the worst of the four -- but it is long, and
the dot product rewards length. Euclidean picks the exact copy, which
is correct here and is correct for the wrong reason: it is measuring
position, so a vector twice as long is far away even when it points
the same way. Cosine cannot tell the query from twice the query,
because they have the same direction, and it reports 1000 for both.

The stretching experiment is the one that settles which to use.
Multiply every document by a random factor and nothing about its
meaning has changed -- direction is what an embedding encodes. Cosine
kept the same answer 3000 times out of 3000, which is not a
statistical result but an identity: scaling cancels in the
denominator. Dot product kept it 1190 times and euclidean 766.

So the reason cosine is the default for text embeddings is not
tradition. It is the only one of the three that ignores a quantity the
model never meant to encode -- and a document's vector length in
practice tracks things like how long the document was, which is
exactly the thing you do not want deciding your search results.

The other two are not wrong, they are answers to different questions.
And there is a shortcut worth knowing: if every vector is normalised
to length one first, the denominator becomes one and cosine is just
the dot product, while euclidean distance becomes two minus twice the
dot product. All three collapse into the same ordering. That is why
production vector databases normalise on the way in and then use dot
product -- it is cosine, with the division already paid for.`,
          explanation:
            "Four documents, three metrics, three different winners. Dot product picks the all-nines vector, which has the worst cosine of the four but is the longest -- length is exactly what the dot product rewards. Euclidean picks the exact copy, correct here for the wrong reason, since it measures position and a vector twice as long is far away even pointing identically. Cosine cannot distinguish the query from twice the query and reports 1000 for both. Then the stretching: scale every document by a random 1 to 5 and cosine kept its answer 3,000 times out of 3,000 -- that is an identity, not a statistic, because the scale cancels in the denominator. Dot product kept it 1,190 times and euclidean 766.",
          alternates: [
            {
              lang: "javascript",
              code: `// Three ways to say two vectors are close. They are three different orderings,
// and only one of them ignores how long the vectors are.

const DIM = 5;

function dot(a, b) {
  let total = 0;
  for (let i = 0; i < a.length; i++) total += a[i] * b[i];
  return total;
}

function sqLen(a) {
  return dot(a, a);
}

function sqDist(a, b) {
  let total = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    total += d * d;
  }
  return total;
}

function cos2Milli(a, b) {
  // cosine squared, times 1000, in integers. Every component here is
  // non-negative, so the cosine is too, and squaring keeps the order.
  const top = dot(a, b) * dot(a, b) * 1000;
  const bottom = sqLen(a) * sqLen(b);
  if (bottom === 0) return 0;
  return Math.floor(top / bottom);
}

function bestByDot(query, docs) {
  let best = 0;
  for (let i = 1; i < docs.length; i++) {
    if (dot(query, docs[i]) > dot(query, docs[best])) best = i;
  }
  return best;
}

function bestByCosine(query, docs) {
  // compare a.b1 squared times |b2| squared against a.b2 squared times
  // |b1| squared -- the same comparison as cosine, with no division.
  let best = 0;
  for (let i = 1; i < docs.length; i++) {
    const left = dot(query, docs[i]) * dot(query, docs[i]) * sqLen(docs[best]);
    const right = dot(query, docs[best]) * dot(query, docs[best]) * sqLen(docs[i]);
    if (left > right) best = i;
  }
  return best;
}

function bestByEuclidean(query, docs) {
  let best = 0;
  for (let i = 1; i < docs.length; i++) {
    if (sqDist(query, docs[i]) < sqDist(query, docs[best])) best = i;
  }
  return best;
}

function scaled(v, k) {
  return v.map((x) => x * k);
}

function show(v) {
  return "[" + v.join(" ") + "]";
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

const query = [3, 1, 4, 1, 5];
const docs = [
  [6, 2, 8, 2, 10], // exactly twice the query
  [3, 1, 4, 1, 5], // the query itself
  [9, 9, 9, 9, 9], // long, and pointing somewhere else
  [1, 0, 1, 0, 2], // short, and pointing almost the same way
];
const names = ["twice the query", "the query itself", "long, wrong way", "short, right way"];

console.log("query " + show(query));
console.log();
console.log("document          vector           dot   len^2   dist^2  cos^2 x1000");
for (let i = 0; i < docs.length; i++) {
  console.log(
    pad(names[i], 16) + "  " + pad(show(docs[i]), 14) + " " +
      padLeft(dot(query, docs[i]), 5) + "  " + padLeft(sqLen(docs[i]), 6) + "  " +
      padLeft(sqDist(query, docs[i]), 7) + "  " + padLeft(cos2Milli(query, docs[i]), 11),
  );
}
console.log();
console.log("nearest by dot product   " + names[bestByDot(query, docs)]);
console.log("nearest by cosine        " + names[bestByCosine(query, docs)]);
console.log("nearest by euclidean     " + names[bestByEuclidean(query, docs)]);
console.log();

// The same linear congruential generator in every language, so the random
// vectors below are the same vectors whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 91130477n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const TRIALS = 3000;
const DOCS = 8;
let agreeDotCos = 0;
let agreeEucCos = 0;
let agreeDotEuc = 0;
let keptDot = 0;
let keptCos = 0;
let keptEuc = 0;
for (let t = 0; t < TRIALS; t++) {
  const q = [];
  for (let i = 0; i < DIM; i++) q.push(rand(10));
  const library = [];
  for (let d = 0; d < DOCS; d++) {
    const v = [];
    for (let i = 0; i < DIM; i++) v.push(rand(10));
    library.push(v);
  }
  const d0 = bestByDot(q, library);
  const c0 = bestByCosine(q, library);
  const e0 = bestByEuclidean(q, library);
  if (d0 === c0) agreeDotCos += 1;
  if (e0 === c0) agreeEucCos += 1;
  if (d0 === e0) agreeDotEuc += 1;
  const stretched = [];
  for (let d = 0; d < DOCS; d++) stretched.push(scaled(library[d], 1 + rand(5)));
  if (bestByDot(q, stretched) === d0) keptDot += 1;
  if (bestByCosine(q, stretched) === c0) keptCos += 1;
  if (bestByEuclidean(q, stretched) === e0) keptEuc += 1;
}

console.log("over " + TRIALS + " random queries against " + DOCS + " random documents each:");
console.log();
console.log("  pair of metrics            picked the same document");
console.log("  dot and cosine             " + padLeft(agreeDotCos, 8));
console.log("  euclidean and cosine       " + padLeft(agreeEucCos, 8));
console.log("  dot and euclidean          " + padLeft(agreeDotEuc, 8));
console.log();
console.log("then every document is multiplied by a random 1 to 5, which changes");
console.log("its length and not its direction:");
console.log();
console.log("  metric                     still picked the same document");
console.log("  dot product                " + padLeft(keptDot, 8));
console.log("  cosine                     " + padLeft(keptCos, 8));
console.log("  euclidean                  " + padLeft(keptEuc, 8));
console.log();
console.log(
  [
    "Four documents, one query, three metrics, three different answers.",
    "That is the whole lesson and it is worth sitting with, because the",
    "three are routinely spoken of as though they were the same idea.",
    "",
    "Dot product picks the all-nines vector. It points somewhere else",
    "entirely -- its cosine is the worst of the four -- but it is long, and",
    "the dot product rewards length. Euclidean picks the exact copy, which",
    "is correct here and is correct for the wrong reason: it is measuring",
    "position, so a vector twice as long is far away even when it points",
    "the same way. Cosine cannot tell the query from twice the query,",
    "because they have the same direction, and it reports 1000 for both.",
    "",
    "The stretching experiment is the one that settles which to use.",
    "Multiply every document by a random factor and nothing about its",
    "meaning has changed -- direction is what an embedding encodes. Cosine",
    "kept the same answer 3000 times out of 3000, which is not a",
    "statistical result but an identity: scaling cancels in the",
    "denominator. Dot product kept it 1190 times and euclidean 766.",
    "",
    "So the reason cosine is the default for text embeddings is not",
    "tradition. It is the only one of the three that ignores a quantity the",
    "model never meant to encode -- and a document's vector length in",
    "practice tracks things like how long the document was, which is",
    "exactly the thing you do not want deciding your search results.",
    "",
    "The other two are not wrong, they are answers to different questions.",
    "And there is a shortcut worth knowing: if every vector is normalised",
    "to length one first, the denominator becomes one and cosine is just",
    "the dot product, while euclidean distance becomes two minus twice the",
    "dot product. All three collapse into the same ordering. That is why",
    "production vector databases normalise on the way in and then use dot",
    "product -- it is cosine, with the division already paid for.",
  ].join("\\n"),
);
`,
            },
            {
              lang: "typescript",
              code: `// Three ways to say two vectors are close. They are three different orderings,
// and only one of them ignores how long the vectors are.

const DIM = 5;

function dot(a: number[], b: number[]): number {
  let total = 0;
  for (let i = 0; i < a.length; i++) total += a[i] * b[i];
  return total;
}

function sqLen(a: number[]): number {
  return dot(a, a);
}

function sqDist(a: number[], b: number[]): number {
  let total = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    total += d * d;
  }
  return total;
}

function cos2Milli(a: number[], b: number[]): number {
  // cosine squared, times 1000, in integers. Every component here is
  // non-negative, so the cosine is too, and squaring keeps the order.
  const top = dot(a, b) * dot(a, b) * 1000;
  const bottom = sqLen(a) * sqLen(b);
  if (bottom === 0) return 0;
  return Math.floor(top / bottom);
}

function bestByDot(query: number[], docs: number[][]): number {
  let best = 0;
  for (let i = 1; i < docs.length; i++) {
    if (dot(query, docs[i]) > dot(query, docs[best])) best = i;
  }
  return best;
}

function bestByCosine(query: number[], docs: number[][]): number {
  // compare a.b1 squared times |b2| squared against a.b2 squared times
  // |b1| squared -- the same comparison as cosine, with no division.
  let best = 0;
  for (let i = 1; i < docs.length; i++) {
    const left = dot(query, docs[i]) * dot(query, docs[i]) * sqLen(docs[best]);
    const right = dot(query, docs[best]) * dot(query, docs[best]) * sqLen(docs[i]);
    if (left > right) best = i;
  }
  return best;
}

function bestByEuclidean(query: number[], docs: number[][]): number {
  let best = 0;
  for (let i = 1; i < docs.length; i++) {
    if (sqDist(query, docs[i]) < sqDist(query, docs[best])) best = i;
  }
  return best;
}

function scaled(v: number[], k: number): number[] {
  return v.map((x) => x * k);
}

function show(v: number[]): string {
  return "[" + v.join(" ") + "]";
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

const query = [3, 1, 4, 1, 5];
const docs = [
  [6, 2, 8, 2, 10], // exactly twice the query
  [3, 1, 4, 1, 5], // the query itself
  [9, 9, 9, 9, 9], // long, and pointing somewhere else
  [1, 0, 1, 0, 2], // short, and pointing almost the same way
];
const names = ["twice the query", "the query itself", "long, wrong way", "short, right way"];

console.log("query " + show(query));
console.log();
console.log("document          vector           dot   len^2   dist^2  cos^2 x1000");
for (let i = 0; i < docs.length; i++) {
  console.log(
    pad(names[i], 16) + "  " + pad(show(docs[i]), 14) + " " +
      padLeft(dot(query, docs[i]), 5) + "  " + padLeft(sqLen(docs[i]), 6) + "  " +
      padLeft(sqDist(query, docs[i]), 7) + "  " + padLeft(cos2Milli(query, docs[i]), 11),
  );
}
console.log();
console.log("nearest by dot product   " + names[bestByDot(query, docs)]);
console.log("nearest by cosine        " + names[bestByCosine(query, docs)]);
console.log("nearest by euclidean     " + names[bestByEuclidean(query, docs)]);
console.log();

// The same linear congruential generator in every language, so the random
// vectors below are the same vectors whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 91130477n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const TRIALS = 3000;
const DOCS = 8;
let agreeDotCos = 0;
let agreeEucCos = 0;
let agreeDotEuc = 0;
let keptDot = 0;
let keptCos = 0;
let keptEuc = 0;
for (let t = 0; t < TRIALS; t++) {
  const q: number[] = [];
  for (let i = 0; i < DIM; i++) q.push(rand(10));
  const library: number[][] = [];
  for (let d = 0; d < DOCS; d++) {
    const v: number[] = [];
    for (let i = 0; i < DIM; i++) v.push(rand(10));
    library.push(v);
  }
  const d0 = bestByDot(q, library);
  const c0 = bestByCosine(q, library);
  const e0 = bestByEuclidean(q, library);
  if (d0 === c0) agreeDotCos += 1;
  if (e0 === c0) agreeEucCos += 1;
  if (d0 === e0) agreeDotEuc += 1;
  const stretched: number[][] = [];
  for (let d = 0; d < DOCS; d++) stretched.push(scaled(library[d], 1 + rand(5)));
  if (bestByDot(q, stretched) === d0) keptDot += 1;
  if (bestByCosine(q, stretched) === c0) keptCos += 1;
  if (bestByEuclidean(q, stretched) === e0) keptEuc += 1;
}

console.log("over " + TRIALS + " random queries against " + DOCS + " random documents each:");
console.log();
console.log("  pair of metrics            picked the same document");
console.log("  dot and cosine             " + padLeft(agreeDotCos, 8));
console.log("  euclidean and cosine       " + padLeft(agreeEucCos, 8));
console.log("  dot and euclidean          " + padLeft(agreeDotEuc, 8));
console.log();
console.log("then every document is multiplied by a random 1 to 5, which changes");
console.log("its length and not its direction:");
console.log();
console.log("  metric                     still picked the same document");
console.log("  dot product                " + padLeft(keptDot, 8));
console.log("  cosine                     " + padLeft(keptCos, 8));
console.log("  euclidean                  " + padLeft(keptEuc, 8));
console.log();
console.log(
  [
    "Four documents, one query, three metrics, three different answers.",
    "That is the whole lesson and it is worth sitting with, because the",
    "three are routinely spoken of as though they were the same idea.",
    "",
    "Dot product picks the all-nines vector. It points somewhere else",
    "entirely -- its cosine is the worst of the four -- but it is long, and",
    "the dot product rewards length. Euclidean picks the exact copy, which",
    "is correct here and is correct for the wrong reason: it is measuring",
    "position, so a vector twice as long is far away even when it points",
    "the same way. Cosine cannot tell the query from twice the query,",
    "because they have the same direction, and it reports 1000 for both.",
    "",
    "The stretching experiment is the one that settles which to use.",
    "Multiply every document by a random factor and nothing about its",
    "meaning has changed -- direction is what an embedding encodes. Cosine",
    "kept the same answer 3000 times out of 3000, which is not a",
    "statistical result but an identity: scaling cancels in the",
    "denominator. Dot product kept it 1190 times and euclidean 766.",
    "",
    "So the reason cosine is the default for text embeddings is not",
    "tradition. It is the only one of the three that ignores a quantity the",
    "model never meant to encode -- and a document's vector length in",
    "practice tracks things like how long the document was, which is",
    "exactly the thing you do not want deciding your search results.",
    "",
    "The other two are not wrong, they are answers to different questions.",
    "And there is a shortcut worth knowing: if every vector is normalised",
    "to length one first, the denominator becomes one and cosine is just",
    "the dot product, while euclidean distance becomes two minus twice the",
    "dot product. All three collapse into the same ordering. That is why",
    "production vector databases normalise on the way in and then use dot",
    "product -- it is cosine, with the division already paid for.",
  ].join("\\n"),
);
`,
            },
            {
              lang: "java",
              code: `// Three ways to say two vectors are close. They are three different orderings,
// and only one of them ignores how long the vectors are.

public class Main {
  static final int DIM = 5;

  static long dot(long[] a, long[] b) {
    long total = 0;
    for (int i = 0; i < a.length; i++) {
      total += a[i] * b[i];
    }
    return total;
  }

  static long sqLen(long[] a) {
    return dot(a, a);
  }

  static long sqDist(long[] a, long[] b) {
    long total = 0;
    for (int i = 0; i < a.length; i++) {
      long d = a[i] - b[i];
      total += d * d;
    }
    return total;
  }

  static long cos2Milli(long[] a, long[] b) {
    // cosine squared, times 1000, in integers. Every component here is
    // non-negative, so the cosine is too, and squaring keeps the order.
    long top = dot(a, b) * dot(a, b) * 1000;
    long bottom = sqLen(a) * sqLen(b);
    if (bottom == 0) {
      return 0;
    }
    return top / bottom;
  }

  static int bestByDot(long[] query, long[][] docs) {
    int best = 0;
    for (int i = 1; i < docs.length; i++) {
      if (dot(query, docs[i]) > dot(query, docs[best])) {
        best = i;
      }
    }
    return best;
  }

  static int bestByCosine(long[] query, long[][] docs) {
    // compare a.b1 squared times |b2| squared against a.b2 squared times
    // |b1| squared -- the same comparison as cosine, with no division.
    int best = 0;
    for (int i = 1; i < docs.length; i++) {
      long left = dot(query, docs[i]) * dot(query, docs[i]) * sqLen(docs[best]);
      long right = dot(query, docs[best]) * dot(query, docs[best]) * sqLen(docs[i]);
      if (left > right) {
        best = i;
      }
    }
    return best;
  }

  static int bestByEuclidean(long[] query, long[][] docs) {
    int best = 0;
    for (int i = 1; i < docs.length; i++) {
      if (sqDist(query, docs[i]) < sqDist(query, docs[best])) {
        best = i;
      }
    }
    return best;
  }

  static long[] scaled(long[] v, long k) {
    long[] out = new long[v.length];
    for (int i = 0; i < v.length; i++) {
      out[i] = v[i] * k;
    }
    return out;
  }

  static String show(long[] v) {
    StringBuilder sb = new StringBuilder("[");
    for (int i = 0; i < v.length; i++) {
      if (i > 0) {
        sb.append(" ");
      }
      sb.append(v[i]);
    }
    return sb.append("]").toString();
  }

  static long seed = 91130477L;

  static long rand(long n) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return seed / 65536L % n;
  }

  public static void main(String[] args) {
    long[] query = {3, 1, 4, 1, 5};
    long[][] docs = {
      {6, 2, 8, 2, 10}, // exactly twice the query
      {3, 1, 4, 1, 5}, // the query itself
      {9, 9, 9, 9, 9}, // long, and pointing somewhere else
      {1, 0, 1, 0, 2}, // short, and pointing almost the same way
    };
    String[] names = {
      "twice the query", "the query itself", "long, wrong way", "short, right way"
    };

    System.out.println("query " + show(query));
    System.out.println();
    System.out.println("document          vector           dot   len^2   dist^2  cos^2 x1000");
    for (int i = 0; i < docs.length; i++) {
      System.out.printf(
          "%-16s  %-14s %5d  %6d  %7d  %11d%n",
          names[i],
          show(docs[i]),
          dot(query, docs[i]),
          sqLen(docs[i]),
          sqDist(query, docs[i]),
          cos2Milli(query, docs[i]));
    }
    System.out.println();
    System.out.println("nearest by dot product   " + names[bestByDot(query, docs)]);
    System.out.println("nearest by cosine        " + names[bestByCosine(query, docs)]);
    System.out.println("nearest by euclidean     " + names[bestByEuclidean(query, docs)]);
    System.out.println();

    // The same linear congruential generator in every language, so the random
    // vectors below are the same vectors whichever translation is run.
    final int trials = 3000;
    final int docCount = 8;
    int agreeDotCos = 0;
    int agreeEucCos = 0;
    int agreeDotEuc = 0;
    int keptDot = 0;
    int keptCos = 0;
    int keptEuc = 0;
    for (int t = 0; t < trials; t++) {
      long[] q = new long[DIM];
      for (int i = 0; i < DIM; i++) {
        q[i] = rand(10);
      }
      long[][] library = new long[docCount][DIM];
      for (int d = 0; d < docCount; d++) {
        for (int i = 0; i < DIM; i++) {
          library[d][i] = rand(10);
        }
      }
      int d0 = bestByDot(q, library);
      int c0 = bestByCosine(q, library);
      int e0 = bestByEuclidean(q, library);
      if (d0 == c0) {
        agreeDotCos += 1;
      }
      if (e0 == c0) {
        agreeEucCos += 1;
      }
      if (d0 == e0) {
        agreeDotEuc += 1;
      }
      long[][] stretched = new long[docCount][];
      for (int d = 0; d < docCount; d++) {
        stretched[d] = scaled(library[d], 1 + rand(5));
      }
      if (bestByDot(q, stretched) == d0) {
        keptDot += 1;
      }
      if (bestByCosine(q, stretched) == c0) {
        keptCos += 1;
      }
      if (bestByEuclidean(q, stretched) == e0) {
        keptEuc += 1;
      }
    }

    System.out.printf(
        "over %d random queries against %d random documents each:%n", trials, docCount);
    System.out.println();
    System.out.println("  pair of metrics            picked the same document");
    System.out.printf("  dot and cosine             %8d%n", agreeDotCos);
    System.out.printf("  euclidean and cosine       %8d%n", agreeEucCos);
    System.out.printf("  dot and euclidean          %8d%n", agreeDotEuc);
    System.out.println();
    System.out.println("then every document is multiplied by a random 1 to 5, which changes");
    System.out.println("its length and not its direction:");
    System.out.println();
    System.out.println("  metric                     still picked the same document");
    System.out.printf("  dot product                %8d%n", keptDot);
    System.out.printf("  cosine                     %8d%n", keptCos);
    System.out.printf("  euclidean                  %8d%n", keptEuc);
    System.out.println();
    System.out.println(String.join("\\n",
        "Four documents, one query, three metrics, three different answers.",
        "That is the whole lesson and it is worth sitting with, because the",
        "three are routinely spoken of as though they were the same idea.",
        "",
        "Dot product picks the all-nines vector. It points somewhere else",
        "entirely -- its cosine is the worst of the four -- but it is long, and",
        "the dot product rewards length. Euclidean picks the exact copy, which",
        "is correct here and is correct for the wrong reason: it is measuring",
        "position, so a vector twice as long is far away even when it points",
        "the same way. Cosine cannot tell the query from twice the query,",
        "because they have the same direction, and it reports 1000 for both.",
        "",
        "The stretching experiment is the one that settles which to use.",
        "Multiply every document by a random factor and nothing about its",
        "meaning has changed -- direction is what an embedding encodes. Cosine",
        "kept the same answer 3000 times out of 3000, which is not a",
        "statistical result but an identity: scaling cancels in the",
        "denominator. Dot product kept it 1190 times and euclidean 766.",
        "",
        "So the reason cosine is the default for text embeddings is not",
        "tradition. It is the only one of the three that ignores a quantity the",
        "model never meant to encode -- and a document's vector length in",
        "practice tracks things like how long the document was, which is",
        "exactly the thing you do not want deciding your search results.",
        "",
        "The other two are not wrong, they are answers to different questions.",
        "And there is a shortcut worth knowing: if every vector is normalised",
        "to length one first, the denominator becomes one and cosine is just",
        "the dot product, while euclidean distance becomes two minus twice the",
        "dot product. All three collapse into the same ordering. That is why",
        "production vector databases normalise on the way in and then use dot",
        "product -- it is cosine, with the division already paid for."));
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// Three ways to say two vectors are close. They are three different orderings,
// and only one of them ignores how long the vectors are.

#include <cstdio>
#include <iostream>
#include <string>
#include <vector>

static const int DIM = 5;

typedef std::vector<long long> Vec;

long long dot(const Vec& a, const Vec& b) {
  long long total = 0;
  for (size_t i = 0; i < a.size(); i++) {
    total += a[i] * b[i];
  }
  return total;
}

long long sqLen(const Vec& a) {
  return dot(a, a);
}

long long sqDist(const Vec& a, const Vec& b) {
  long long total = 0;
  for (size_t i = 0; i < a.size(); i++) {
    long long d = a[i] - b[i];
    total += d * d;
  }
  return total;
}

long long cos2Milli(const Vec& a, const Vec& b) {
  // cosine squared, times 1000, in integers. Every component here is
  // non-negative, so the cosine is too, and squaring keeps the order.
  long long top = dot(a, b) * dot(a, b) * 1000;
  long long bottom = sqLen(a) * sqLen(b);
  if (bottom == 0) {
    return 0;
  }
  return top / bottom;
}

int bestByDot(const Vec& query, const std::vector<Vec>& docs) {
  int best = 0;
  for (size_t i = 1; i < docs.size(); i++) {
    if (dot(query, docs[i]) > dot(query, docs[best])) {
      best = (int)i;
    }
  }
  return best;
}

int bestByCosine(const Vec& query, const std::vector<Vec>& docs) {
  // compare a.b1 squared times |b2| squared against a.b2 squared times
  // |b1| squared -- the same comparison as cosine, with no division.
  int best = 0;
  for (size_t i = 1; i < docs.size(); i++) {
    long long left = dot(query, docs[i]) * dot(query, docs[i]) * sqLen(docs[best]);
    long long right = dot(query, docs[best]) * dot(query, docs[best]) * sqLen(docs[i]);
    if (left > right) {
      best = (int)i;
    }
  }
  return best;
}

int bestByEuclidean(const Vec& query, const std::vector<Vec>& docs) {
  int best = 0;
  for (size_t i = 1; i < docs.size(); i++) {
    if (sqDist(query, docs[i]) < sqDist(query, docs[best])) {
      best = (int)i;
    }
  }
  return best;
}

Vec scaled(const Vec& v, long long k) {
  Vec out;
  for (size_t i = 0; i < v.size(); i++) {
    out.push_back(v[i] * k);
  }
  return out;
}

std::string show(const Vec& v) {
  std::string out = "[";
  for (size_t i = 0; i < v.size(); i++) {
    if (i > 0) {
      out += " ";
    }
    out += std::to_string(v[i]);
  }
  return out + "]";
}

long long seed = 91130477LL;

long long rand_below(long long n) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return seed / 65536LL % n;
}

int main() {
  Vec query = {3, 1, 4, 1, 5};
  std::vector<Vec> docs = {
      {6, 2, 8, 2, 10},  // exactly twice the query
      {3, 1, 4, 1, 5},   // the query itself
      {9, 9, 9, 9, 9},   // long, and pointing somewhere else
      {1, 0, 1, 0, 2},   // short, and pointing almost the same way
  };
  std::vector<std::string> names = {"twice the query", "the query itself", "long, wrong way",
                                    "short, right way"};

  std::printf("query %s\\n", show(query).c_str());
  std::printf("\\n");
  std::printf("document          vector           dot   len^2   dist^2  cos^2 x1000\\n");
  for (size_t i = 0; i < docs.size(); i++) {
    std::printf("%-16s  %-14s %5lld  %6lld  %7lld  %11lld\\n", names[i].c_str(),
                show(docs[i]).c_str(), dot(query, docs[i]), sqLen(docs[i]),
                sqDist(query, docs[i]), cos2Milli(query, docs[i]));
  }
  std::printf("\\n");
  std::printf("nearest by dot product   %s\\n", names[bestByDot(query, docs)].c_str());
  std::printf("nearest by cosine        %s\\n", names[bestByCosine(query, docs)].c_str());
  std::printf("nearest by euclidean     %s\\n", names[bestByEuclidean(query, docs)].c_str());
  std::printf("\\n");

  // The same linear congruential generator in every language, so the random
  // vectors below are the same vectors whichever translation is run.
  const int trials = 3000;
  const int docCount = 8;
  int agreeDotCos = 0;
  int agreeEucCos = 0;
  int agreeDotEuc = 0;
  int keptDot = 0;
  int keptCos = 0;
  int keptEuc = 0;
  for (int t = 0; t < trials; t++) {
    Vec q;
    for (int i = 0; i < DIM; i++) {
      q.push_back(rand_below(10));
    }
    std::vector<Vec> library;
    for (int d = 0; d < docCount; d++) {
      Vec v;
      for (int i = 0; i < DIM; i++) {
        v.push_back(rand_below(10));
      }
      library.push_back(v);
    }
    int d0 = bestByDot(q, library);
    int c0 = bestByCosine(q, library);
    int e0 = bestByEuclidean(q, library);
    if (d0 == c0) {
      agreeDotCos += 1;
    }
    if (e0 == c0) {
      agreeEucCos += 1;
    }
    if (d0 == e0) {
      agreeDotEuc += 1;
    }
    std::vector<Vec> stretched;
    for (int d = 0; d < docCount; d++) {
      stretched.push_back(scaled(library[d], 1 + rand_below(5)));
    }
    if (bestByDot(q, stretched) == d0) {
      keptDot += 1;
    }
    if (bestByCosine(q, stretched) == c0) {
      keptCos += 1;
    }
    if (bestByEuclidean(q, stretched) == e0) {
      keptEuc += 1;
    }
  }

  std::printf("over %d random queries against %d random documents each:\\n", trials, docCount);
  std::printf("\\n");
  std::printf("  pair of metrics            picked the same document\\n");
  std::printf("  dot and cosine             %8d\\n", agreeDotCos);
  std::printf("  euclidean and cosine       %8d\\n", agreeEucCos);
  std::printf("  dot and euclidean          %8d\\n", agreeDotEuc);
  std::printf("\\n");
  std::printf("then every document is multiplied by a random 1 to 5, which changes\\n");
  std::printf("its length and not its direction:\\n");
  std::printf("\\n");
  std::printf("  metric                     still picked the same document\\n");
  std::printf("  dot product                %8d\\n", keptDot);
  std::printf("  cosine                     %8d\\n", keptCos);
  std::printf("  euclidean                  %8d\\n", keptEuc);
  std::printf("\\n");
    std::cout
        << "Four documents, one query, three metrics, three different answers." << "\\n"
        << "That is the whole lesson and it is worth sitting with, because the" << "\\n"
        << "three are routinely spoken of as though they were the same idea." << "\\n"
        << "" << "\\n"
        << "Dot product picks the all-nines vector. It points somewhere else" << "\\n"
        << "entirely -- its cosine is the worst of the four -- but it is long, and" << "\\n"
        << "the dot product rewards length. Euclidean picks the exact copy, which" << "\\n"
        << "is correct here and is correct for the wrong reason: it is measuring" << "\\n"
        << "position, so a vector twice as long is far away even when it points" << "\\n"
        << "the same way. Cosine cannot tell the query from twice the query," << "\\n"
        << "because they have the same direction, and it reports 1000 for both." << "\\n"
        << "" << "\\n"
        << "The stretching experiment is the one that settles which to use." << "\\n"
        << "Multiply every document by a random factor and nothing about its" << "\\n"
        << "meaning has changed -- direction is what an embedding encodes. Cosine" << "\\n"
        << "kept the same answer 3000 times out of 3000, which is not a" << "\\n"
        << "statistical result but an identity: scaling cancels in the" << "\\n"
        << "denominator. Dot product kept it 1190 times and euclidean 766." << "\\n"
        << "" << "\\n"
        << "So the reason cosine is the default for text embeddings is not" << "\\n"
        << "tradition. It is the only one of the three that ignores a quantity the" << "\\n"
        << "model never meant to encode -- and a document's vector length in" << "\\n"
        << "practice tracks things like how long the document was, which is" << "\\n"
        << "exactly the thing you do not want deciding your search results." << "\\n"
        << "" << "\\n"
        << "The other two are not wrong, they are answers to different questions." << "\\n"
        << "And there is a shortcut worth knowing: if every vector is normalised" << "\\n"
        << "to length one first, the denominator becomes one and cosine is just" << "\\n"
        << "the dot product, while euclidean distance becomes two minus twice the" << "\\n"
        << "dot product. All three collapse into the same ordering. That is why" << "\\n"
        << "production vector databases normalise on the way in and then use dot" << "\\n"
        << "product -- it is cosine, with the division already paid for." << "\\n"
        ;
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Three ways to say two vectors are close. They are three different orderings,
// and only one of them ignores how long the vectors are.

const DIM: usize = 5;

fn dot(a: &[i64], b: &[i64]) -> i64 {
    let mut total = 0;
    for i in 0..a.len() {
        total += a[i] * b[i];
    }
    total
}

fn sq_len(a: &[i64]) -> i64 {
    dot(a, a)
}

fn sq_dist(a: &[i64], b: &[i64]) -> i64 {
    let mut total = 0;
    for i in 0..a.len() {
        let d = a[i] - b[i];
        total += d * d;
    }
    total
}

fn cos2_milli(a: &[i64], b: &[i64]) -> i64 {
    // cosine squared, times 1000, in integers. Every component here is
    // non-negative, so the cosine is too, and squaring keeps the order.
    let top = dot(a, b) * dot(a, b) * 1000;
    let bottom = sq_len(a) * sq_len(b);
    if bottom == 0 {
        return 0;
    }
    top / bottom
}

fn best_by_dot(query: &[i64], docs: &[Vec<i64>]) -> usize {
    let mut best = 0;
    for i in 1..docs.len() {
        if dot(query, &docs[i]) > dot(query, &docs[best]) {
            best = i;
        }
    }
    best
}

fn best_by_cosine(query: &[i64], docs: &[Vec<i64>]) -> usize {
    // compare a.b1 squared times |b2| squared against a.b2 squared times
    // |b1| squared -- the same comparison as cosine, with no division.
    let mut best = 0;
    for i in 1..docs.len() {
        let left = dot(query, &docs[i]) * dot(query, &docs[i]) * sq_len(&docs[best]);
        let right = dot(query, &docs[best]) * dot(query, &docs[best]) * sq_len(&docs[i]);
        if left > right {
            best = i;
        }
    }
    best
}

fn best_by_euclidean(query: &[i64], docs: &[Vec<i64>]) -> usize {
    let mut best = 0;
    for i in 1..docs.len() {
        if sq_dist(query, &docs[i]) < sq_dist(query, &docs[best]) {
            best = i;
        }
    }
    best
}

fn scaled(v: &[i64], k: i64) -> Vec<i64> {
    v.iter().map(|x| x * k).collect()
}

fn show(v: &[i64]) -> String {
    let parts: Vec<String> = v.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(" "))
}

static mut SEED: i64 = 91130477;

fn rand_below(n: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % n
    }
}

fn main() {
    let query: Vec<i64> = vec![3, 1, 4, 1, 5];
    let docs: Vec<Vec<i64>> = vec![
        vec![6, 2, 8, 2, 10], // exactly twice the query
        vec![3, 1, 4, 1, 5],  // the query itself
        vec![9, 9, 9, 9, 9],  // long, and pointing somewhere else
        vec![1, 0, 1, 0, 2],  // short, and pointing almost the same way
    ];
    let names = [
        "twice the query",
        "the query itself",
        "long, wrong way",
        "short, right way",
    ];

    println!("query {}", show(&query));
    println!();
    println!("document          vector           dot   len^2   dist^2  cos^2 x1000");
    for i in 0..docs.len() {
        println!(
            "{:<16}  {:<14} {:>5}  {:>6}  {:>7}  {:>11}",
            names[i],
            show(&docs[i]),
            dot(&query, &docs[i]),
            sq_len(&docs[i]),
            sq_dist(&query, &docs[i]),
            cos2_milli(&query, &docs[i])
        );
    }
    println!();
    println!("nearest by dot product   {}", names[best_by_dot(&query, &docs)]);
    println!("nearest by cosine        {}", names[best_by_cosine(&query, &docs)]);
    println!("nearest by euclidean     {}", names[best_by_euclidean(&query, &docs)]);
    println!();

    // The same linear congruential generator in every language, so the random
    // vectors below are the same vectors whichever translation is run.
    let trials = 3000;
    let doc_count = 8;
    let mut agree_dot_cos = 0;
    let mut agree_euc_cos = 0;
    let mut agree_dot_euc = 0;
    let mut kept_dot = 0;
    let mut kept_cos = 0;
    let mut kept_euc = 0;
    for _ in 0..trials {
        let mut q: Vec<i64> = Vec::new();
        for _ in 0..DIM {
            q.push(rand_below(10));
        }
        let mut library: Vec<Vec<i64>> = Vec::new();
        for _ in 0..doc_count {
            let mut v: Vec<i64> = Vec::new();
            for _ in 0..DIM {
                v.push(rand_below(10));
            }
            library.push(v);
        }
        let d0 = best_by_dot(&q, &library);
        let c0 = best_by_cosine(&q, &library);
        let e0 = best_by_euclidean(&q, &library);
        if d0 == c0 {
            agree_dot_cos += 1;
        }
        if e0 == c0 {
            agree_euc_cos += 1;
        }
        if d0 == e0 {
            agree_dot_euc += 1;
        }
        let mut stretched: Vec<Vec<i64>> = Vec::new();
        for d in 0..doc_count {
            stretched.push(scaled(&library[d], 1 + rand_below(5)));
        }
        if best_by_dot(&q, &stretched) == d0 {
            kept_dot += 1;
        }
        if best_by_cosine(&q, &stretched) == c0 {
            kept_cos += 1;
        }
        if best_by_euclidean(&q, &stretched) == e0 {
            kept_euc += 1;
        }
    }

    println!(
        "over {} random queries against {} random documents each:",
        trials, doc_count
    );
    println!();
    println!("  pair of metrics            picked the same document");
    println!("  dot and cosine             {:>8}", agree_dot_cos);
    println!("  euclidean and cosine       {:>8}", agree_euc_cos);
    println!("  dot and euclidean          {:>8}", agree_dot_euc);
    println!();
    println!("then every document is multiplied by a random 1 to 5, which changes");
    println!("its length and not its direction:");
    println!();
    println!("  metric                     still picked the same document");
    println!("  dot product                {:>8}", kept_dot);
    println!("  cosine                     {:>8}", kept_cos);
    println!("  euclidean                  {:>8}", kept_euc);
    println!();
    println!("{}", [
        "Four documents, one query, three metrics, three different answers.",
        "That is the whole lesson and it is worth sitting with, because the",
        "three are routinely spoken of as though they were the same idea.",
        "",
        "Dot product picks the all-nines vector. It points somewhere else",
        "entirely -- its cosine is the worst of the four -- but it is long, and",
        "the dot product rewards length. Euclidean picks the exact copy, which",
        "is correct here and is correct for the wrong reason: it is measuring",
        "position, so a vector twice as long is far away even when it points",
        "the same way. Cosine cannot tell the query from twice the query,",
        "because they have the same direction, and it reports 1000 for both.",
        "",
        "The stretching experiment is the one that settles which to use.",
        "Multiply every document by a random factor and nothing about its",
        "meaning has changed -- direction is what an embedding encodes. Cosine",
        "kept the same answer 3000 times out of 3000, which is not a",
        "statistical result but an identity: scaling cancels in the",
        "denominator. Dot product kept it 1190 times and euclidean 766.",
        "",
        "So the reason cosine is the default for text embeddings is not",
        "tradition. It is the only one of the three that ignores a quantity the",
        "model never meant to encode -- and a document's vector length in",
        "practice tracks things like how long the document was, which is",
        "exactly the thing you do not want deciding your search results.",
        "",
        "The other two are not wrong, they are answers to different questions.",
        "And there is a shortcut worth knowing: if every vector is normalised",
        "to length one first, the denominator becomes one and cosine is just",
        "the dot product, while euclidean distance becomes two minus twice the",
        "dot product. All three collapse into the same ordering. That is why",
        "production vector databases normalise on the way in and then use dot",
        "product -- it is cosine, with the division already paid for.",
    ].join("\\n"));
}
`,
            },
            {
              lang: "go",
              code: `// Three ways to say two vectors are close. They are three different orderings,
// and only one of them ignores how long the vectors are.

package main

import (
	"fmt"
	"strconv"
	"strings"
)

const dim = 5

func dot(a, b []int64) int64 {
	var total int64
	for i := range a {
		total += a[i] * b[i]
	}
	return total
}

func sqLen(a []int64) int64 {
	return dot(a, a)
}

func sqDist(a, b []int64) int64 {
	var total int64
	for i := range a {
		d := a[i] - b[i]
		total += d * d
	}
	return total
}

func cos2Milli(a, b []int64) int64 {
	// cosine squared, times 1000, in integers. Every component here is
	// non-negative, so the cosine is too, and squaring keeps the order.
	top := dot(a, b) * dot(a, b) * 1000
	bottom := sqLen(a) * sqLen(b)
	if bottom == 0 {
		return 0
	}
	return top / bottom
}

func bestByDot(query []int64, docs [][]int64) int {
	best := 0
	for i := 1; i < len(docs); i++ {
		if dot(query, docs[i]) > dot(query, docs[best]) {
			best = i
		}
	}
	return best
}

func bestByCosine(query []int64, docs [][]int64) int {
	// compare a.b1 squared times |b2| squared against a.b2 squared times
	// |b1| squared -- the same comparison as cosine, with no division.
	best := 0
	for i := 1; i < len(docs); i++ {
		left := dot(query, docs[i]) * dot(query, docs[i]) * sqLen(docs[best])
		right := dot(query, docs[best]) * dot(query, docs[best]) * sqLen(docs[i])
		if left > right {
			best = i
		}
	}
	return best
}

func bestByEuclidean(query []int64, docs [][]int64) int {
	best := 0
	for i := 1; i < len(docs); i++ {
		if sqDist(query, docs[i]) < sqDist(query, docs[best]) {
			best = i
		}
	}
	return best
}

func scaled(v []int64, k int64) []int64 {
	out := make([]int64, len(v))
	for i := range v {
		out[i] = v[i] * k
	}
	return out
}

func show(v []int64) string {
	parts := []string{}
	for _, x := range v {
		parts = append(parts, strconv.FormatInt(x, 10))
	}
	return "[" + strings.Join(parts, " ") + "]"
}

var seed int64 = 91130477

func randBelow(n int64) int64 {
	seed = (seed*1103515245 + 12345) % 2147483648
	return seed / 65536 % n
}

func main() {
	query := []int64{3, 1, 4, 1, 5}
	docs := [][]int64{
		{6, 2, 8, 2, 10}, // exactly twice the query
		{3, 1, 4, 1, 5},  // the query itself
		{9, 9, 9, 9, 9},  // long, and pointing somewhere else
		{1, 0, 1, 0, 2},  // short, and pointing almost the same way
	}
	names := []string{"twice the query", "the query itself", "long, wrong way", "short, right way"}

	fmt.Println("query " + show(query))
	fmt.Println()
	fmt.Println("document          vector           dot   len^2   dist^2  cos^2 x1000")
	for i := range docs {
		fmt.Printf("%-16s  %-14s %5d  %6d  %7d  %11d\\n", names[i], show(docs[i]),
			dot(query, docs[i]), sqLen(docs[i]), sqDist(query, docs[i]), cos2Milli(query, docs[i]))
	}
	fmt.Println()
	fmt.Println("nearest by dot product   " + names[bestByDot(query, docs)])
	fmt.Println("nearest by cosine        " + names[bestByCosine(query, docs)])
	fmt.Println("nearest by euclidean     " + names[bestByEuclidean(query, docs)])
	fmt.Println()

	// The same linear congruential generator in every language, so the random
	// vectors below are the same vectors whichever translation is run.
	trials := 3000
	docCount := 8
	agreeDotCos := 0
	agreeEucCos := 0
	agreeDotEuc := 0
	keptDot := 0
	keptCos := 0
	keptEuc := 0
	for t := 0; t < trials; t++ {
		q := []int64{}
		for i := 0; i < dim; i++ {
			q = append(q, randBelow(10))
		}
		library := [][]int64{}
		for d := 0; d < docCount; d++ {
			v := []int64{}
			for i := 0; i < dim; i++ {
				v = append(v, randBelow(10))
			}
			library = append(library, v)
		}
		d0 := bestByDot(q, library)
		c0 := bestByCosine(q, library)
		e0 := bestByEuclidean(q, library)
		if d0 == c0 {
			agreeDotCos++
		}
		if e0 == c0 {
			agreeEucCos++
		}
		if d0 == e0 {
			agreeDotEuc++
		}
		stretched := [][]int64{}
		for d := 0; d < docCount; d++ {
			stretched = append(stretched, scaled(library[d], 1+randBelow(5)))
		}
		if bestByDot(q, stretched) == d0 {
			keptDot++
		}
		if bestByCosine(q, stretched) == c0 {
			keptCos++
		}
		if bestByEuclidean(q, stretched) == e0 {
			keptEuc++
		}
	}

	fmt.Printf("over %d random queries against %d random documents each:\\n", trials, docCount)
	fmt.Println()
	fmt.Println("  pair of metrics            picked the same document")
	fmt.Printf("  dot and cosine             %8d\\n", agreeDotCos)
	fmt.Printf("  euclidean and cosine       %8d\\n", agreeEucCos)
	fmt.Printf("  dot and euclidean          %8d\\n", agreeDotEuc)
	fmt.Println()
	fmt.Println("then every document is multiplied by a random 1 to 5, which changes")
	fmt.Println("its length and not its direction:")
	fmt.Println()
	fmt.Println("  metric                     still picked the same document")
	fmt.Printf("  dot product                %8d\\n", keptDot)
	fmt.Printf("  cosine                     %8d\\n", keptCos)
	fmt.Printf("  euclidean                  %8d\\n", keptEuc)
	fmt.Println()
	fmt.Println(strings.Join([]string{
		"Four documents, one query, three metrics, three different answers.",
		"That is the whole lesson and it is worth sitting with, because the",
		"three are routinely spoken of as though they were the same idea.",
		"",
		"Dot product picks the all-nines vector. It points somewhere else",
		"entirely -- its cosine is the worst of the four -- but it is long, and",
		"the dot product rewards length. Euclidean picks the exact copy, which",
		"is correct here and is correct for the wrong reason: it is measuring",
		"position, so a vector twice as long is far away even when it points",
		"the same way. Cosine cannot tell the query from twice the query,",
		"because they have the same direction, and it reports 1000 for both.",
		"",
		"The stretching experiment is the one that settles which to use.",
		"Multiply every document by a random factor and nothing about its",
		"meaning has changed -- direction is what an embedding encodes. Cosine",
		"kept the same answer 3000 times out of 3000, which is not a",
		"statistical result but an identity: scaling cancels in the",
		"denominator. Dot product kept it 1190 times and euclidean 766.",
		"",
		"So the reason cosine is the default for text embeddings is not",
		"tradition. It is the only one of the three that ignores a quantity the",
		"model never meant to encode -- and a document's vector length in",
		"practice tracks things like how long the document was, which is",
		"exactly the thing you do not want deciding your search results.",
		"",
		"The other two are not wrong, they are answers to different questions.",
		"And there is a shortcut worth knowing: if every vector is normalised",
		"to length one first, the denominator becomes one and cosine is just",
		"the dot product, while euclidean distance becomes two minus twice the",
		"dot product. All three collapse into the same ordering. That is why",
		"production vector databases normalise on the way in and then use dot",
		"product -- it is cosine, with the division already paid for.",
	}, "\\n"))
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "which-to-use",
      heading: "Which to use, and the shortcut",
      body: [
        "Cosine is the default for text embeddings and the measurement says why: it is the only one of the three that ignores a quantity the model never intended to encode. A document vector's length in practice tracks incidental things \u2014 how long the document was, how confident the encoder was \u2014 and you do not want those deciding search results.",
        "The other two are not wrong; they answer different questions. Dot product is the right metric when magnitude is meaningful, which happens in recommender systems where a longer vector legitimately means a more popular or more confident item. Euclidean is right when the coordinates are actual positions rather than a direction \u2014 clustering geographic points, for instance.",
        "**The shortcut everything in production uses:** normalise every vector to length one when it is stored. Then the denominator in cosine is one, so cosine *is* the dot product; and euclidean distance squared becomes two minus twice the dot product, which is a decreasing function of it. All three orderings collapse into the same ordering.",
        "That is why vector databases normalise on the way in and then compute dot products: it is cosine with the division already paid for, and it means the index can use the cheapest of the three kernels without changing any answers.",
      ],
      pitfalls: [
        {
          title: "Assuming cosine and dot product agree",
          body: "They agreed on the top document in 1,222 of 3,000 random trials above. On unnormalised vectors they are different metrics, and the difference is systematically biased towards long vectors.",
        },
        {
          title: "Mixing embeddings from two different models",
          body: "The arrays have no shared coordinate system. The distances computed between them are arithmetic, not meaning, and they will look plausible while being noise.",
        },
        {
          title: "Normalising at query time but not at index time, or the reverse",
          body: "Half-normalised is the worst of both: the metric you think you are using is not the one you are computing. Normalise once, on the way in, and be consistent.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between cosine similarity and dot product?",
      answer:
        "Cosine is the dot product divided by both lengths, so it is purely the angle and length cancels; the raw dot product rewards length as well as direction. That difference is not academic -- I measured it, and on random unnormalised vectors the two picked the same nearest document in only 1,222 of 3,000 trials. The test that settles it is scaling: multiply every document by a random factor, which changes length and not direction, and cosine kept the same answer 3,000 out of 3,000 times, dot product 1,190 and euclidean 766. Cosine's 3,000 is an identity rather than a statistic, since the scale cancels in the denominator. That is why cosine is the default for text -- vector length tracks things like document length that the model never meant to encode.",
    },
    {
      question: "If cosine is best, why do vector databases use dot product?",
      answer:
        "Because they normalise on the way in, and once every vector has length one the denominator is one, so the dot product is cosine. Euclidean distance squared also becomes two minus twice the dot product on unit vectors, which is a decreasing function of it, so all three orderings collapse into the same ordering. Normalising once at index time buys the cheapest kernel with no change to any answer. The trap is doing it on one side only -- normalising queries but not documents means the metric you think you are computing is not the one you are computing.",
    },
  ],
  takeaways: [
    "An embedding is a fixed-length array whose direction is supposed to carry meaning",
    "Dot product rewards length; cosine is the angle alone; euclidean is position",
    "Same query, same four documents, three metrics, three different winners",
    "Stretching test: cosine 3000/3000, dot product 1190, euclidean 766",
    "Cosine's 3000 is an identity — the scale cancels in the denominator",
    "Normalise at index time and cosine becomes the dot product",
    "Never mix embeddings from two models; the coordinate systems are unrelated",
  ],
};
