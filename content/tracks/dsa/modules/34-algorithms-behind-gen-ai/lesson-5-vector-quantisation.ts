import type { Lesson } from "@/content/types";

export const vectorQuantisationLesson: Lesson = {
  id: "dsa-gen-ai-vector-quantisation",
  slug: "vector-quantisation",
  moduleSlug: "algorithms-behind-gen-ai",
  title: "Vector Quantisation, and the Shortlist That Rescues It",
  summary:
    "Storing less of each vector costs recall, and the loss is a cliff rather than a slope. Measured: at sixteen bits a vector, product quantisation recovers 61.0% of the true neighbours — and 98.4% once fifty candidates are rescored exactly.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Distinguish scalar quantisation from product quantisation by what each discards",
    "Measure recall against bits per vector for both schemes",
    "Explain why a codebook beats rounding at the same budget",
    "Apply the shortlist-then-rescore pattern that makes compression safe",
  ],
  sections: [
    {
      id: "why-compress",
      heading: "Why compress at all",
      body: [
        "A million vectors of 1,536 dimensions in fp32 is about 6 GB. Ten million is 60 GB, and a billion is 6 TB — past any single machine's RAM. The index structures from the previous lesson do not help \u2014 they decide which vectors to look at, not how much each one costs to keep.",
        "So the vectors themselves get compressed, and the question is the same one as before with a different currency: **how much recall does a byte buy?**",
        "Two schemes cover most of practice. **Scalar quantisation** stores each coordinate in fewer bits \u2014 8 instead of 32, or 4, or 1. **Product quantisation** splits the vector into slices and replaces each slice with the index of the nearest entry in a small learned codebook.",
        "The program measures both against a full-precision baseline, and then measures the one line that changes the conclusion.",
      ],
    },
    {
      id: "measured",
      heading: "What the compression costs",
      body: [
        "The values here are 0 to 999, so ten bits per coordinate is the honest full-precision figure, and eight dimensions makes 80 bits a vector.",
      ],
      examples: [
        {
          id: "bits-against-recall",
          title: "Two compression schemes, and the effect of rescoring a shortlist",
          lang: "python",
          code: `# Vector quantisation: store less of each vector and see what it costs you.
# Two schemes, then the one line of code that buys most of the loss back.

DIM = 8
N = 2000
QUERIES = 150
K = 10
BITS_PER_VALUE = 10       # values are 0..999, so ten bits is honest
SUBSPACES = 4             # for product quantisation
CENTROIDS = 16            # per subspace, so four bits per code
RERANK = 50


def sq_dist(a, b):
    total = 0
    for i in range(len(a)):
        d = a[i] - b[i]
        total += d * d
    return total


def top_k(scores, limit):
    order = []
    for i in range(len(scores)):
        order.append([scores[i], i])
    order.sort()
    return [pair[1] for pair in order[:limit]]


# The same linear congruential generator in every language, so the random
# vectors below are the same vectors whichever translation is run.
seed = 77400013


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

exact = []
for q in queries:
    exact.append(top_k([sq_dist(q, d) for d in docs], K))


def recall_of(found, wanted):
    keep = {}
    for i in wanted:
        keep[i] = True
    hit = 0
    for i in found:
        if i in keep:
            hit += 1
    return hit


def rerank(query, candidates):
    scored = []
    for i in candidates:
        scored.append([sq_dist(query, docs[i]), i])
    scored.sort()
    return [pair[1] for pair in scored[:K]]


# --- scheme one: scalar quantisation, throw away the low bits -----------

def scalar_run(bits):
    shift = BITS_PER_VALUE - bits
    small = []
    for d in docs:
        small.append([v >> shift for v in d])
    plain = 0
    reranked = 0
    for t in range(QUERIES):
        q = [v >> shift for v in queries[t]]
        scores = [sq_dist(q, s) for s in small]
        plain += recall_of(top_k(scores, K), exact[t])
        reranked += recall_of(rerank(queries[t], top_k(scores, RERANK)), exact[t])
    return [DIM * bits, plain, reranked]


# --- scheme two: product quantisation, a codebook per slice -------------

WIDTH = DIM // SUBSPACES
books = []
for s in range(SUBSPACES):
    book = []
    for c in range(CENTROIDS):
        pick = docs[rand(N)]
        book.append(pick[s * WIDTH:(s + 1) * WIDTH])
    for _round in range(4):
        sums = [[0] * WIDTH for _ in range(CENTROIDS)]
        counts = [0] * CENTROIDS
        for d in docs:
            piece = d[s * WIDTH:(s + 1) * WIDTH]
            best = 0
            best_d = sq_dist(piece, book[0])
            for c in range(1, CENTROIDS):
                got = sq_dist(piece, book[c])
                if got < best_d:
                    best_d = got
                    best = c
            counts[best] += 1
            for j in range(WIDTH):
                sums[best][j] += piece[j]
        for c in range(CENTROIDS):
            if counts[c] > 0:
                book[c] = [sums[c][j] // counts[c] for j in range(WIDTH)]
    books.append(book)

codes = []
for d in docs:
    row = []
    for s in range(SUBSPACES):
        piece = d[s * WIDTH:(s + 1) * WIDTH]
        best = 0
        best_d = sq_dist(piece, books[s][0])
        for c in range(1, CENTROIDS):
            got = sq_dist(piece, books[s][c])
            if got < best_d:
                best_d = got
                best = c
        row.append(best)
    codes.append(row)


def product_run():
    plain = 0
    reranked = 0
    for t in range(QUERIES):
        # one small table per slice, then every document is four lookups
        tables = []
        for s in range(SUBSPACES):
            piece = queries[t][s * WIDTH:(s + 1) * WIDTH]
            tables.append([sq_dist(piece, books[s][c]) for c in range(CENTROIDS)])
        scores = []
        for i in range(N):
            total = 0
            for s in range(SUBSPACES):
                total += tables[s][codes[i][s]]
            scores.append(total)
        plain += recall_of(top_k(scores, K), exact[t])
        reranked += recall_of(rerank(queries[t], top_k(scores, RERANK)), exact[t])
    return [SUBSPACES * 4, plain, reranked]


rows = [["full precision", DIM * BITS_PER_VALUE, QUERIES * K, QUERIES * K]]
for bits in [8, 4, 2, 1]:
    got = scalar_run(bits)
    label = "scalar, %d bit" % bits + ("" if bits == 1 else "s")
    rows.append([label, got[0], got[1], got[2]])
got = product_run()
rows.append(["product, %d x %d" % (SUBSPACES, CENTROIDS), got[0], got[1], got[2]])

total = QUERIES * K
print("%d documents of %d dimensions, top %d, %d queries" % (N, DIM, K, QUERIES))
print()
print("scheme            bits/vector   compression   recall   reranked")
for row in rows:
    plain = row[2] * 1000 // total
    fixed = row[3] * 1000 // total
    shrink = DIM * BITS_PER_VALUE * 10 // row[1]
    print("%-16s %11d  %10d.%dx   %3d.%d%%     %3d.%d%%"
          % (row[0], row[1], shrink // 10, shrink % 10,
             plain // 10, plain % 10, fixed // 10, fixed % 10))
print()
print("""The full-precision row is the control. Everything else stores less of
each vector and loses answers for it, and the two columns on the right
are the whole argument.

Read the recall column first. Dropping from ten bits per value to
eight costs almost nothing, 99.1%, because the low two bits of a
coordinate were never deciding which neighbour was nearest. Four bits
costs real accuracy at 85.0%. Two bits collapses to 48.0%. The loss
is not gradual -- it is nothing, then a little, then a cliff, and
where the cliff is depends on the data rather than on any rule of
thumb. That is the argument for measuring rather than choosing a
bit width from a blog post.

Now compare the two schemes at the same size. Sixteen bits per vector
buys 48.0% with scalar quantisation and 61.0% with product
quantisation, and the reason is what each one throws away. Scalar
keeps every coordinate and blurs all of them equally. Product
quantisation splits the vector into four slices and replaces each
slice with the nearest of sixteen learned representatives, so the
representatives sit where the data actually is, and coordinates that
never vary cost nothing to store. It is a codebook rather than a
rounding rule, and at the same budget the codebook wins.

Product quantisation also changes what a query costs, in a way the
table does not show. The query computes sixteen distances per slice
once -- sixty-four in total -- and then every document is four array
lookups and three additions. No multiplies at all in the inner loop.
That is the same trick as precomputing a table in dynamic programming,
applied to distance.

The last column is the one worth taking away. Take the top fifty by
the compressed distance, then rescore just those fifty against the
full-precision vectors, and product quantisation at sixteen bits a
vector goes from 61.0% to 98.4%. Fifty exact distances per query, against two thousand
for the exact scan. The compressed index does not have to be right --
it only has to put the true neighbours somewhere in a shortlist, and
being roughly right is enough for that. Nearly every production vector
index is built this way: a small approximate structure to shortlist,
and the real vectors consulted only for the handful that survive.""")
`,
          output: `2000 documents of 8 dimensions, top 10, 150 queries

scheme            bits/vector   compression   recall   reranked
full precision            80           1.0x   100.0%     100.0%
scalar, 8 bits            64           1.2x    99.1%     100.0%
scalar, 4 bits            32           2.5x    85.0%     100.0%
scalar, 2 bits            16           5.0x    48.0%      90.8%
scalar, 1 bit              8          10.0x    26.0%      53.2%
product, 4 x 16           16           5.0x    61.0%      98.4%

The full-precision row is the control. Everything else stores less of
each vector and loses answers for it, and the two columns on the right
are the whole argument.

Read the recall column first. Dropping from ten bits per value to
eight costs almost nothing, 99.1%, because the low two bits of a
coordinate were never deciding which neighbour was nearest. Four bits
costs real accuracy at 85.0%. Two bits collapses to 48.0%. The loss
is not gradual -- it is nothing, then a little, then a cliff, and
where the cliff is depends on the data rather than on any rule of
thumb. That is the argument for measuring rather than choosing a
bit width from a blog post.

Now compare the two schemes at the same size. Sixteen bits per vector
buys 48.0% with scalar quantisation and 61.0% with product
quantisation, and the reason is what each one throws away. Scalar
keeps every coordinate and blurs all of them equally. Product
quantisation splits the vector into four slices and replaces each
slice with the nearest of sixteen learned representatives, so the
representatives sit where the data actually is, and coordinates that
never vary cost nothing to store. It is a codebook rather than a
rounding rule, and at the same budget the codebook wins.

Product quantisation also changes what a query costs, in a way the
table does not show. The query computes sixteen distances per slice
once -- sixty-four in total -- and then every document is four array
lookups and three additions. No multiplies at all in the inner loop.
That is the same trick as precomputing a table in dynamic programming,
applied to distance.

The last column is the one worth taking away. Take the top fifty by
the compressed distance, then rescore just those fifty against the
full-precision vectors, and product quantisation at sixteen bits a
vector goes from 61.0% to 98.4%. Fifty exact distances per query, against two thousand
for the exact scan. The compressed index does not have to be right --
it only has to put the true neighbours somewhere in a shortlist, and
being roughly right is enough for that. Nearly every production vector
index is built this way: a small approximate structure to shortlist,
and the real vectors consulted only for the handful that survive.`,
          explanation:
            "Dropping from ten bits per value to eight costs almost nothing at 99.1%, because the low bits were never deciding which neighbour was nearest. Four bits costs real accuracy at 85.0%, and two bits collapses to 48.0%. The loss is nothing, then a little, then a cliff, and where the cliff falls depends on the data rather than on any rule of thumb. At the same sixteen bits a vector, product quantisation manages 61.0% against scalar's 48.0%. Then the last column: take the top fifty by the compressed distance and rescore only those against the full-precision vectors, and product quantisation goes from 61.0% to 98.4%.",
          alternates: [
            {
              lang: "javascript",
              code: `// Vector quantisation: store less of each vector and see what it costs you.
// Two schemes, then the one line of code that buys most of the loss back.

const DIM = 8;
const N = 2000;
const QUERIES = 150;
const K = 10;
const BITS_PER_VALUE = 10; // values are 0..999, so ten bits is honest
const SUBSPACES = 4; // for product quantisation
const CENTROIDS = 16; // per subspace, so four bits per code
const RERANK = 50;

function sqDist(a, b) {
  let total = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    total += d * d;
  }
  return total;
}

function byScoreThenIndex(x, y) {
  return x[0] !== y[0] ? x[0] - y[0] : x[1] - y[1];
}

function topK(scores, limit) {
  const order = [];
  for (let i = 0; i < scores.length; i++) order.push([scores[i], i]);
  order.sort(byScoreThenIndex);
  return order.slice(0, limit).map((pair) => pair[1]);
}

// The same linear congruential generator in every language, so the random
// vectors below are the same vectors whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 77400013n;

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

const exact = [];
for (const q of queries) {
  exact.push(topK(docs.map((d) => sqDist(q, d)), K));
}

function recallOf(found, wanted) {
  const keep = new Map();
  for (const i of wanted) keep.set(i, true);
  let hit = 0;
  for (const i of found) {
    if (keep.has(i)) hit += 1;
  }
  return hit;
}

function rerank(query, candidates) {
  const scored = [];
  for (const i of candidates) scored.push([sqDist(query, docs[i]), i]);
  scored.sort(byScoreThenIndex);
  return scored.slice(0, K).map((pair) => pair[1]);
}

// --- scheme one: scalar quantisation, throw away the low bits -----------

function scalarRun(bits) {
  const shift = BITS_PER_VALUE - bits;
  const small = docs.map((d) => d.map((v) => v >> shift));
  let plain = 0;
  let reranked = 0;
  for (let t = 0; t < QUERIES; t++) {
    const q = queries[t].map((v) => v >> shift);
    const scores = small.map((s) => sqDist(q, s));
    plain += recallOf(topK(scores, K), exact[t]);
    reranked += recallOf(rerank(queries[t], topK(scores, RERANK)), exact[t]);
  }
  return [DIM * bits, plain, reranked];
}

// --- scheme two: product quantisation, a codebook per slice -------------

const WIDTH = DIM / SUBSPACES;
const books = [];
for (let s = 0; s < SUBSPACES; s++) {
  const book = [];
  for (let c = 0; c < CENTROIDS; c++) {
    const pick = docs[rand(N)];
    book.push(pick.slice(s * WIDTH, (s + 1) * WIDTH));
  }
  for (let round = 0; round < 4; round++) {
    const sums = [];
    for (let c = 0; c < CENTROIDS; c++) sums.push(new Array(WIDTH).fill(0));
    const counts = new Array(CENTROIDS).fill(0);
    for (const d of docs) {
      const piece = d.slice(s * WIDTH, (s + 1) * WIDTH);
      let best = 0;
      let bestD = sqDist(piece, book[0]);
      for (let c = 1; c < CENTROIDS; c++) {
        const got = sqDist(piece, book[c]);
        if (got < bestD) {
          bestD = got;
          best = c;
        }
      }
      counts[best] += 1;
      for (let j = 0; j < WIDTH; j++) sums[best][j] += piece[j];
    }
    for (let c = 0; c < CENTROIDS; c++) {
      if (counts[c] > 0) {
        for (let j = 0; j < WIDTH; j++) book[c][j] = Math.floor(sums[c][j] / counts[c]);
      }
    }
  }
  books.push(book);
}

const codes = [];
for (const d of docs) {
  const row = [];
  for (let s = 0; s < SUBSPACES; s++) {
    const piece = d.slice(s * WIDTH, (s + 1) * WIDTH);
    let best = 0;
    let bestD = sqDist(piece, books[s][0]);
    for (let c = 1; c < CENTROIDS; c++) {
      const got = sqDist(piece, books[s][c]);
      if (got < bestD) {
        bestD = got;
        best = c;
      }
    }
    row.push(best);
  }
  codes.push(row);
}

function productRun() {
  let plain = 0;
  let reranked = 0;
  for (let t = 0; t < QUERIES; t++) {
    // one small table per slice, then every document is four lookups
    const tables = [];
    for (let s = 0; s < SUBSPACES; s++) {
      const piece = queries[t].slice(s * WIDTH, (s + 1) * WIDTH);
      const table = [];
      for (let c = 0; c < CENTROIDS; c++) table.push(sqDist(piece, books[s][c]));
      tables.push(table);
    }
    const scores = [];
    for (let i = 0; i < N; i++) {
      let total = 0;
      for (let s = 0; s < SUBSPACES; s++) total += tables[s][codes[i][s]];
      scores.push(total);
    }
    plain += recallOf(topK(scores, K), exact[t]);
    reranked += recallOf(rerank(queries[t], topK(scores, RERANK)), exact[t]);
  }
  return [SUBSPACES * 4, plain, reranked];
}

const rows = [["full precision", DIM * BITS_PER_VALUE, QUERIES * K, QUERIES * K]];
for (const bits of [8, 4, 2, 1]) {
  const got = scalarRun(bits);
  const label = "scalar, " + bits + " bit" + (bits === 1 ? "" : "s");
  rows.push([label, got[0], got[1], got[2]]);
}
const pq = productRun();
rows.push(["product, " + SUBSPACES + " x " + CENTROIDS, pq[0], pq[1], pq[2]]);

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

const total = QUERIES * K;
console.log(N + " documents of " + DIM + " dimensions, top " + K + ", " + QUERIES + " queries");
console.log();
console.log("scheme            bits/vector   compression   recall   reranked");
for (const row of rows) {
  const plain = Math.floor((row[2] * 1000) / total);
  const fixed = Math.floor((row[3] * 1000) / total);
  const shrink = Math.floor((DIM * BITS_PER_VALUE * 10) / row[1]);
  console.log(
    pad(row[0], 16) + " " + padLeft(row[1], 11) + "  " + padLeft(Math.floor(shrink / 10), 10) +
      "." + (shrink % 10) + "x   " + padLeft(Math.floor(plain / 10), 3) + "." + (plain % 10) +
      "%     " + padLeft(Math.floor(fixed / 10), 3) + "." + (fixed % 10) + "%",
  );
}
console.log();
console.log(
  [
    "The full-precision row is the control. Everything else stores less of",
    "each vector and loses answers for it, and the two columns on the right",
    "are the whole argument.",
    "",
    "Read the recall column first. Dropping from ten bits per value to",
    "eight costs almost nothing, 99.1%, because the low two bits of a",
    "coordinate were never deciding which neighbour was nearest. Four bits",
    "costs real accuracy at 85.0%. Two bits collapses to 48.0%. The loss",
    "is not gradual -- it is nothing, then a little, then a cliff, and",
    "where the cliff is depends on the data rather than on any rule of",
    "thumb. That is the argument for measuring rather than choosing a",
    "bit width from a blog post.",
    "",
    "Now compare the two schemes at the same size. Sixteen bits per vector",
    "buys 48.0% with scalar quantisation and 61.0% with product",
    "quantisation, and the reason is what each one throws away. Scalar",
    "keeps every coordinate and blurs all of them equally. Product",
    "quantisation splits the vector into four slices and replaces each",
    "slice with the nearest of sixteen learned representatives, so the",
    "representatives sit where the data actually is, and coordinates that",
    "never vary cost nothing to store. It is a codebook rather than a",
    "rounding rule, and at the same budget the codebook wins.",
    "",
    "Product quantisation also changes what a query costs, in a way the",
    "table does not show. The query computes sixteen distances per slice",
    "once -- sixty-four in total -- and then every document is four array",
    "lookups and three additions. No multiplies at all in the inner loop.",
    "That is the same trick as precomputing a table in dynamic programming,",
    "applied to distance.",
    "",
    "The last column is the one worth taking away. Take the top fifty by",
    "the compressed distance, then rescore just those fifty against the",
    "full-precision vectors, and product quantisation at sixteen bits a",
    "vector goes from 61.0% to 98.4%. Fifty exact distances per query, against two thousand",
    "for the exact scan. The compressed index does not have to be right --",
    "it only has to put the true neighbours somewhere in a shortlist, and",
    "being roughly right is enough for that. Nearly every production vector",
    "index is built this way: a small approximate structure to shortlist,",
    "and the real vectors consulted only for the handful that survive.",
  ].join("\\n"),
);
`,
            },
            {
              lang: "typescript",
              code: `// Vector quantisation: store less of each vector and see what it costs you.
// Two schemes, then the one line of code that buys most of the loss back.

type Pair = [number, number];

const DIM = 8;
const N = 2000;
const QUERIES = 150;
const K = 10;
const BITS_PER_VALUE = 10; // values are 0..999, so ten bits is honest
const SUBSPACES = 4; // for product quantisation
const CENTROIDS = 16; // per subspace, so four bits per code
const RERANK = 50;

function sqDist(a: number[], b: number[]): number {
  let total = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    total += d * d;
  }
  return total;
}

function byScoreThenIndex(x: Pair, y: Pair): number {
  return x[0] !== y[0] ? x[0] - y[0] : x[1] - y[1];
}

function topK(scores: number[], limit: number): number[] {
  const order: Pair[] = [];
  for (let i = 0; i < scores.length; i++) order.push([scores[i], i]);
  order.sort(byScoreThenIndex);
  return order.slice(0, limit).map((pair) => pair[1]);
}

// The same linear congruential generator in every language, so the random
// vectors below are the same vectors whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 77400013n;

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

const exact: number[][] = [];
for (const q of queries) {
  exact.push(topK(docs.map((d) => sqDist(q, d)), K));
}

function recallOf(found: number[], wanted: number[]): number {
  const keep = new Map<number, boolean>();
  for (const i of wanted) keep.set(i, true);
  let hit = 0;
  for (const i of found) {
    if (keep.has(i)) hit += 1;
  }
  return hit;
}

function rerank(query: number[], candidates: number[]): number[] {
  const scored: Pair[] = [];
  for (const i of candidates) scored.push([sqDist(query, docs[i]), i]);
  scored.sort(byScoreThenIndex);
  return scored.slice(0, K).map((pair) => pair[1]);
}

// --- scheme one: scalar quantisation, throw away the low bits -----------

function scalarRun(bits: number): number[] {
  const shift = BITS_PER_VALUE - bits;
  const small = docs.map((d) => d.map((v) => v >> shift));
  let plain = 0;
  let reranked = 0;
  for (let t = 0; t < QUERIES; t++) {
    const q = queries[t].map((v) => v >> shift);
    const scores = small.map((s) => sqDist(q, s));
    plain += recallOf(topK(scores, K), exact[t]);
    reranked += recallOf(rerank(queries[t], topK(scores, RERANK)), exact[t]);
  }
  return [DIM * bits, plain, reranked];
}

// --- scheme two: product quantisation, a codebook per slice -------------

const WIDTH = DIM / SUBSPACES;
const books: number[][][] = [];
for (let s = 0; s < SUBSPACES; s++) {
  const book: number[][] = [];
  for (let c = 0; c < CENTROIDS; c++) {
    const pick = docs[rand(N)];
    book.push(pick.slice(s * WIDTH, (s + 1) * WIDTH));
  }
  for (let round = 0; round < 4; round++) {
    const sums: number[][] = [];
    for (let c = 0; c < CENTROIDS; c++) sums.push(new Array(WIDTH).fill(0));
    const counts = new Array(CENTROIDS).fill(0);
    for (const d of docs) {
      const piece = d.slice(s * WIDTH, (s + 1) * WIDTH);
      let best = 0;
      let bestD = sqDist(piece, book[0]);
      for (let c = 1; c < CENTROIDS; c++) {
        const got = sqDist(piece, book[c]);
        if (got < bestD) {
          bestD = got;
          best = c;
        }
      }
      counts[best] += 1;
      for (let j = 0; j < WIDTH; j++) sums[best][j] += piece[j];
    }
    for (let c = 0; c < CENTROIDS; c++) {
      if (counts[c] > 0) {
        for (let j = 0; j < WIDTH; j++) book[c][j] = Math.floor(sums[c][j] / counts[c]);
      }
    }
  }
  books.push(book);
}

const codes: number[][] = [];
for (const d of docs) {
  const row: number[] = [];
  for (let s = 0; s < SUBSPACES; s++) {
    const piece = d.slice(s * WIDTH, (s + 1) * WIDTH);
    let best = 0;
    let bestD = sqDist(piece, books[s][0]);
    for (let c = 1; c < CENTROIDS; c++) {
      const got = sqDist(piece, books[s][c]);
      if (got < bestD) {
        bestD = got;
        best = c;
      }
    }
    row.push(best);
  }
  codes.push(row);
}

function productRun(): number[] {
  let plain = 0;
  let reranked = 0;
  for (let t = 0; t < QUERIES; t++) {
    // one small table per slice, then every document is four lookups
    const tables: number[][] = [];
    for (let s = 0; s < SUBSPACES; s++) {
      const piece = queries[t].slice(s * WIDTH, (s + 1) * WIDTH);
      const table: number[] = [];
      for (let c = 0; c < CENTROIDS; c++) table.push(sqDist(piece, books[s][c]));
      tables.push(table);
    }
    const scores: number[] = [];
    for (let i = 0; i < N; i++) {
      let total = 0;
      for (let s = 0; s < SUBSPACES; s++) total += tables[s][codes[i][s]];
      scores.push(total);
    }
    plain += recallOf(topK(scores, K), exact[t]);
    reranked += recallOf(rerank(queries[t], topK(scores, RERANK)), exact[t]);
  }
  return [SUBSPACES * 4, plain, reranked];
}

const rows: Array<[string, number, number, number]> = [["full precision", DIM * BITS_PER_VALUE, QUERIES * K, QUERIES * K]];
for (const bits of [8, 4, 2, 1]) {
  const got = scalarRun(bits);
  const label = "scalar, " + bits + " bit" + (bits === 1 ? "" : "s");
  rows.push([label, got[0], got[1], got[2]]);
}
const pq = productRun();
rows.push(["product, " + SUBSPACES + " x " + CENTROIDS, pq[0], pq[1], pq[2]]);

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

const total = QUERIES * K;
console.log(N + " documents of " + DIM + " dimensions, top " + K + ", " + QUERIES + " queries");
console.log();
console.log("scheme            bits/vector   compression   recall   reranked");
for (const row of rows) {
  const plain = Math.floor((row[2] * 1000) / total);
  const fixed = Math.floor((row[3] * 1000) / total);
  const shrink = Math.floor((DIM * BITS_PER_VALUE * 10) / row[1]);
  console.log(
    pad(row[0], 16) + " " + padLeft(row[1], 11) + "  " + padLeft(Math.floor(shrink / 10), 10) +
      "." + (shrink % 10) + "x   " + padLeft(Math.floor(plain / 10), 3) + "." + (plain % 10) +
      "%     " + padLeft(Math.floor(fixed / 10), 3) + "." + (fixed % 10) + "%",
  );
}
console.log();
console.log(
  [
    "The full-precision row is the control. Everything else stores less of",
    "each vector and loses answers for it, and the two columns on the right",
    "are the whole argument.",
    "",
    "Read the recall column first. Dropping from ten bits per value to",
    "eight costs almost nothing, 99.1%, because the low two bits of a",
    "coordinate were never deciding which neighbour was nearest. Four bits",
    "costs real accuracy at 85.0%. Two bits collapses to 48.0%. The loss",
    "is not gradual -- it is nothing, then a little, then a cliff, and",
    "where the cliff is depends on the data rather than on any rule of",
    "thumb. That is the argument for measuring rather than choosing a",
    "bit width from a blog post.",
    "",
    "Now compare the two schemes at the same size. Sixteen bits per vector",
    "buys 48.0% with scalar quantisation and 61.0% with product",
    "quantisation, and the reason is what each one throws away. Scalar",
    "keeps every coordinate and blurs all of them equally. Product",
    "quantisation splits the vector into four slices and replaces each",
    "slice with the nearest of sixteen learned representatives, so the",
    "representatives sit where the data actually is, and coordinates that",
    "never vary cost nothing to store. It is a codebook rather than a",
    "rounding rule, and at the same budget the codebook wins.",
    "",
    "Product quantisation also changes what a query costs, in a way the",
    "table does not show. The query computes sixteen distances per slice",
    "once -- sixty-four in total -- and then every document is four array",
    "lookups and three additions. No multiplies at all in the inner loop.",
    "That is the same trick as precomputing a table in dynamic programming,",
    "applied to distance.",
    "",
    "The last column is the one worth taking away. Take the top fifty by",
    "the compressed distance, then rescore just those fifty against the",
    "full-precision vectors, and product quantisation at sixteen bits a",
    "vector goes from 61.0% to 98.4%. Fifty exact distances per query, against two thousand",
    "for the exact scan. The compressed index does not have to be right --",
    "it only has to put the true neighbours somewhere in a shortlist, and",
    "being roughly right is enough for that. Nearly every production vector",
    "index is built this way: a small approximate structure to shortlist,",
    "and the real vectors consulted only for the handful that survive.",
  ].join("\\n"),
);
`,
            },
            {
              lang: "java",
              code: `// Vector quantisation: store less of each vector and see what it costs you.
// Two schemes, then the one line of code that buys most of the loss back.

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class Main {
  static final int DIM = 8;
  static final int N = 2000;
  static final int QUERIES = 150;
  static final int K = 10;
  static final int BITS_PER_VALUE = 10; // values are 0..999, so ten bits is honest
  static final int SUBSPACES = 4; // for product quantisation
  static final int CENTROIDS = 16; // per subspace, so four bits per code
  static final int RERANK = 50;
  static final int WIDTH = DIM / SUBSPACES;

  static long[][] docs = new long[N][DIM];
  static long[][] queries = new long[QUERIES][DIM];
  static long[][][] books = new long[SUBSPACES][CENTROIDS][WIDTH];
  static int[][] codes = new int[N][SUBSPACES];
  static List<List<Integer>> exact = new ArrayList<>();

  static long sqDist(long[] a, long[] b) {
    long total = 0;
    for (int i = 0; i < a.length; i++) {
      long d = a[i] - b[i];
      total += d * d;
    }
    return total;
  }

  static class Pair {
    long score;
    int index;

    Pair(long score, int index) {
      this.score = score;
      this.index = index;
    }
  }

  static List<Integer> topK(long[] scores, int limit) {
    List<Pair> order = new ArrayList<>();
    for (int i = 0; i < scores.length; i++) {
      order.add(new Pair(scores[i], i));
    }
    order.sort((x, y) -> x.score != y.score ? Long.compare(x.score, y.score) : x.index - y.index);
    List<Integer> out = new ArrayList<>();
    for (int i = 0; i < limit && i < order.size(); i++) {
      out.add(order.get(i).index);
    }
    return out;
  }

  // The same linear congruential generator in every language, so the random
  // vectors below are the same vectors whichever translation is run.
  static long seed = 77400013L;

  static long rand(long n) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return seed / 65536L % n;
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

  static List<Integer> rerank(long[] query, List<Integer> candidates) {
    long[] scores = new long[candidates.size()];
    for (int c = 0; c < candidates.size(); c++) {
      scores[c] = sqDist(query, docs[candidates.get(c)]);
    }
    List<Integer> picked = topK(scores, K);
    List<Integer> out = new ArrayList<>();
    for (int p : picked) {
      out.add(candidates.get(p));
    }
    return out;
  }

  static long[] slice(long[] v, int s) {
    long[] out = new long[WIDTH];
    for (int j = 0; j < WIDTH; j++) {
      out[j] = v[s * WIDTH + j];
    }
    return out;
  }

  // --- scheme one: scalar quantisation, throw away the low bits -----------

  static long[] scalarRun(int bits) {
    int shift = BITS_PER_VALUE - bits;
    long[][] small = new long[N][DIM];
    for (int d = 0; d < N; d++) {
      for (int i = 0; i < DIM; i++) {
        small[d][i] = docs[d][i] >> shift;
      }
    }
    long plain = 0;
    long reranked = 0;
    for (int t = 0; t < QUERIES; t++) {
      long[] q = new long[DIM];
      for (int i = 0; i < DIM; i++) {
        q[i] = queries[t][i] >> shift;
      }
      long[] scores = new long[N];
      for (int d = 0; d < N; d++) {
        scores[d] = sqDist(q, small[d]);
      }
      plain += recallOf(topK(scores, K), exact.get(t));
      reranked += recallOf(rerank(queries[t], topK(scores, RERANK)), exact.get(t));
    }
    return new long[] {DIM * bits, plain, reranked};
  }

  // --- scheme two: product quantisation, a codebook per slice -------------

  static long[] productRun() {
    long plain = 0;
    long reranked = 0;
    for (int t = 0; t < QUERIES; t++) {
      // one small table per slice, then every document is four lookups
      long[][] tables = new long[SUBSPACES][CENTROIDS];
      for (int s = 0; s < SUBSPACES; s++) {
        long[] piece = slice(queries[t], s);
        for (int c = 0; c < CENTROIDS; c++) {
          tables[s][c] = sqDist(piece, books[s][c]);
        }
      }
      long[] scores = new long[N];
      for (int i = 0; i < N; i++) {
        long total = 0;
        for (int s = 0; s < SUBSPACES; s++) {
          total += tables[s][codes[i][s]];
        }
        scores[i] = total;
      }
      plain += recallOf(topK(scores, K), exact.get(t));
      reranked += recallOf(rerank(queries[t], topK(scores, RERANK)), exact.get(t));
    }
    return new long[] {SUBSPACES * 4, plain, reranked};
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
    for (int q = 0; q < QUERIES; q++) {
      long[] scores = new long[N];
      for (int d = 0; d < N; d++) {
        scores[d] = sqDist(queries[q], docs[d]);
      }
      exact.add(topK(scores, K));
    }

    for (int s = 0; s < SUBSPACES; s++) {
      for (int c = 0; c < CENTROIDS; c++) {
        books[s][c] = slice(docs[(int) rand(N)], s);
      }
      for (int round = 0; round < 4; round++) {
        long[][] sums = new long[CENTROIDS][WIDTH];
        int[] counts = new int[CENTROIDS];
        for (int d = 0; d < N; d++) {
          long[] piece = slice(docs[d], s);
          int best = 0;
          long bestD = sqDist(piece, books[s][0]);
          for (int c = 1; c < CENTROIDS; c++) {
            long got = sqDist(piece, books[s][c]);
            if (got < bestD) {
              bestD = got;
              best = c;
            }
          }
          counts[best] += 1;
          for (int j = 0; j < WIDTH; j++) {
            sums[best][j] += piece[j];
          }
        }
        for (int c = 0; c < CENTROIDS; c++) {
          if (counts[c] > 0) {
            for (int j = 0; j < WIDTH; j++) {
              books[s][c][j] = sums[c][j] / counts[c];
            }
          }
        }
      }
    }

    for (int d = 0; d < N; d++) {
      for (int s = 0; s < SUBSPACES; s++) {
        long[] piece = slice(docs[d], s);
        int best = 0;
        long bestD = sqDist(piece, books[s][0]);
        for (int c = 1; c < CENTROIDS; c++) {
          long got = sqDist(piece, books[s][c]);
          if (got < bestD) {
            bestD = got;
            best = c;
          }
        }
        codes[d][s] = best;
      }
    }

    List<Object[]> rows = new ArrayList<>();
    rows.add(new Object[] {"full precision", (long) DIM * BITS_PER_VALUE,
      (long) QUERIES * K, (long) QUERIES * K});
    int[] widths = {8, 4, 2, 1};
    for (int bits : widths) {
      long[] got = scalarRun(bits);
      String label = "scalar, " + bits + " bit" + (bits == 1 ? "" : "s");
      rows.add(new Object[] {label, got[0], got[1], got[2]});
    }
    long[] pq = productRun();
    rows.add(new Object[] {"product, " + SUBSPACES + " x " + CENTROIDS, pq[0], pq[1], pq[2]});

    long total = (long) QUERIES * K;
    System.out.printf("%d documents of %d dimensions, top %d, %d queries%n", N, DIM, K, QUERIES);
    System.out.println();
    System.out.println("scheme            bits/vector   compression   recall   reranked");
    for (Object[] row : rows) {
      long bits = (Long) row[1];
      long plain = (Long) row[2] * 1000 / total;
      long fixed = (Long) row[3] * 1000 / total;
      long shrink = (long) DIM * BITS_PER_VALUE * 10 / bits;
      System.out.printf(
          "%-16s %11d  %10d.%dx   %3d.%d%%     %3d.%d%%%n",
          row[0], bits, shrink / 10, shrink % 10, plain / 10, plain % 10, fixed / 10, fixed % 10);
    }
    System.out.println();
    System.out.println(String.join("\\n",
        "The full-precision row is the control. Everything else stores less of",
        "each vector and loses answers for it, and the two columns on the right",
        "are the whole argument.",
        "",
        "Read the recall column first. Dropping from ten bits per value to",
        "eight costs almost nothing, 99.1%, because the low two bits of a",
        "coordinate were never deciding which neighbour was nearest. Four bits",
        "costs real accuracy at 85.0%. Two bits collapses to 48.0%. The loss",
        "is not gradual -- it is nothing, then a little, then a cliff, and",
        "where the cliff is depends on the data rather than on any rule of",
        "thumb. That is the argument for measuring rather than choosing a",
        "bit width from a blog post.",
        "",
        "Now compare the two schemes at the same size. Sixteen bits per vector",
        "buys 48.0% with scalar quantisation and 61.0% with product",
        "quantisation, and the reason is what each one throws away. Scalar",
        "keeps every coordinate and blurs all of them equally. Product",
        "quantisation splits the vector into four slices and replaces each",
        "slice with the nearest of sixteen learned representatives, so the",
        "representatives sit where the data actually is, and coordinates that",
        "never vary cost nothing to store. It is a codebook rather than a",
        "rounding rule, and at the same budget the codebook wins.",
        "",
        "Product quantisation also changes what a query costs, in a way the",
        "table does not show. The query computes sixteen distances per slice",
        "once -- sixty-four in total -- and then every document is four array",
        "lookups and three additions. No multiplies at all in the inner loop.",
        "That is the same trick as precomputing a table in dynamic programming,",
        "applied to distance.",
        "",
        "The last column is the one worth taking away. Take the top fifty by",
        "the compressed distance, then rescore just those fifty against the",
        "full-precision vectors, and product quantisation at sixteen bits a",
        "vector goes from 61.0% to 98.4%. Fifty exact distances per query, against two thousand",
        "for the exact scan. The compressed index does not have to be right --",
        "it only has to put the true neighbours somewhere in a shortlist, and",
        "being roughly right is enough for that. Nearly every production vector",
        "index is built this way: a small approximate structure to shortlist,",
        "and the real vectors consulted only for the handful that survive."));
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// Vector quantisation: store less of each vector and see what it costs you.
// Two schemes, then the one line of code that buys most of the loss back.

#include <algorithm>
#include <cstdio>
#include <iostream>
#include <set>
#include <string>
#include <vector>

static const int DIM = 8;
static const int N = 2000;
static const int QUERIES = 150;
static const int K = 10;
static const int BITS_PER_VALUE = 10;  // values are 0..999, so ten bits is honest
static const int SUBSPACES = 4;        // for product quantisation
static const int CENTROIDS = 16;       // per subspace, so four bits per code
static const int RERANK = 50;
static const int WIDTH = DIM / SUBSPACES;

typedef std::vector<long long> Vec;

std::vector<Vec> docs;
std::vector<Vec> queries;
std::vector<std::vector<Vec> > books;
std::vector<std::vector<int> > codes;
std::vector<std::vector<int> > exact;

long long sqDist(const Vec& a, const Vec& b) {
  long long total = 0;
  for (size_t i = 0; i < a.size(); i++) {
    long long d = a[i] - b[i];
    total += d * d;
  }
  return total;
}

struct Pair {
  long long score;
  int index;
};

bool byScoreThenIndex(const Pair& x, const Pair& y) {
  return x.score != y.score ? x.score < y.score : x.index < y.index;
}

std::vector<int> topK(const Vec& scores, int limit) {
  std::vector<Pair> order;
  for (size_t i = 0; i < scores.size(); i++) {
    order.push_back(Pair{scores[i], (int)i});
  }
  std::sort(order.begin(), order.end(), byScoreThenIndex);
  std::vector<int> out;
  for (int i = 0; i < limit && i < (int)order.size(); i++) {
    out.push_back(order[i].index);
  }
  return out;
}

// The same linear congruential generator in every language, so the random
// vectors below are the same vectors whichever translation is run.
long long seed = 77400013LL;

long long rand_below(long long n) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return seed / 65536LL % n;
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

std::vector<int> rerank(const Vec& query, const std::vector<int>& candidates) {
  std::vector<Pair> scored;
  for (size_t c = 0; c < candidates.size(); c++) {
    scored.push_back(Pair{sqDist(query, docs[candidates[c]]), candidates[c]});
  }
  std::sort(scored.begin(), scored.end(), byScoreThenIndex);
  std::vector<int> out;
  for (int i = 0; i < K && i < (int)scored.size(); i++) {
    out.push_back(scored[i].index);
  }
  return out;
}

Vec slice(const Vec& v, int s) {
  Vec out;
  for (int j = 0; j < WIDTH; j++) {
    out.push_back(v[s * WIDTH + j]);
  }
  return out;
}

// --- scheme one: scalar quantisation, throw away the low bits -----------

Vec scalarRun(int bits) {
  int shift = BITS_PER_VALUE - bits;
  std::vector<Vec> small;
  for (int d = 0; d < N; d++) {
    Vec row;
    for (int i = 0; i < DIM; i++) {
      row.push_back(docs[d][i] >> shift);
    }
    small.push_back(row);
  }
  long long plain = 0;
  long long reranked = 0;
  for (int t = 0; t < QUERIES; t++) {
    Vec q;
    for (int i = 0; i < DIM; i++) {
      q.push_back(queries[t][i] >> shift);
    }
    Vec scores;
    for (int d = 0; d < N; d++) {
      scores.push_back(sqDist(q, small[d]));
    }
    plain += recallOf(topK(scores, K), exact[t]);
    reranked += recallOf(rerank(queries[t], topK(scores, RERANK)), exact[t]);
  }
  Vec out;
  out.push_back((long long)DIM * bits);
  out.push_back(plain);
  out.push_back(reranked);
  return out;
}

// --- scheme two: product quantisation, a codebook per slice -------------

Vec productRun() {
  long long plain = 0;
  long long reranked = 0;
  for (int t = 0; t < QUERIES; t++) {
    // one small table per slice, then every document is four lookups
    std::vector<Vec> tables;
    for (int s = 0; s < SUBSPACES; s++) {
      Vec piece = slice(queries[t], s);
      Vec table;
      for (int c = 0; c < CENTROIDS; c++) {
        table.push_back(sqDist(piece, books[s][c]));
      }
      tables.push_back(table);
    }
    Vec scores;
    for (int i = 0; i < N; i++) {
      long long total = 0;
      for (int s = 0; s < SUBSPACES; s++) {
        total += tables[s][codes[i][s]];
      }
      scores.push_back(total);
    }
    plain += recallOf(topK(scores, K), exact[t]);
    reranked += recallOf(rerank(queries[t], topK(scores, RERANK)), exact[t]);
  }
  Vec out;
  out.push_back((long long)SUBSPACES * 4);
  out.push_back(plain);
  out.push_back(reranked);
  return out;
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
  for (int q = 0; q < QUERIES; q++) {
    Vec scores;
    for (int d = 0; d < N; d++) {
      scores.push_back(sqDist(queries[q], docs[d]));
    }
    exact.push_back(topK(scores, K));
  }

  for (int s = 0; s < SUBSPACES; s++) {
    std::vector<Vec> book;
    for (int c = 0; c < CENTROIDS; c++) {
      book.push_back(slice(docs[(int)rand_below(N)], s));
    }
    for (int round = 0; round < 4; round++) {
      std::vector<Vec> sums(CENTROIDS, Vec(WIDTH, 0));
      std::vector<int> counts(CENTROIDS, 0);
      for (int d = 0; d < N; d++) {
        Vec piece = slice(docs[d], s);
        int best = 0;
        long long bestD = sqDist(piece, book[0]);
        for (int c = 1; c < CENTROIDS; c++) {
          long long got = sqDist(piece, book[c]);
          if (got < bestD) {
            bestD = got;
            best = c;
          }
        }
        counts[best] += 1;
        for (int j = 0; j < WIDTH; j++) {
          sums[best][j] += piece[j];
        }
      }
      for (int c = 0; c < CENTROIDS; c++) {
        if (counts[c] > 0) {
          for (int j = 0; j < WIDTH; j++) {
            book[c][j] = sums[c][j] / counts[c];
          }
        }
      }
    }
    books.push_back(book);
  }

  for (int d = 0; d < N; d++) {
    std::vector<int> row;
    for (int s = 0; s < SUBSPACES; s++) {
      Vec piece = slice(docs[d], s);
      int best = 0;
      long long bestD = sqDist(piece, books[s][0]);
      for (int c = 1; c < CENTROIDS; c++) {
        long long got = sqDist(piece, books[s][c]);
        if (got < bestD) {
          bestD = got;
          best = c;
        }
      }
      row.push_back(best);
    }
    codes.push_back(row);
  }

  std::vector<std::string> labels;
  std::vector<long long> bitsCol;
  std::vector<long long> plainCol;
  std::vector<long long> fixedCol;
  labels.push_back("full precision");
  bitsCol.push_back((long long)DIM * BITS_PER_VALUE);
  plainCol.push_back((long long)QUERIES * K);
  fixedCol.push_back((long long)QUERIES * K);
  int widths[4] = {8, 4, 2, 1};
  for (int w = 0; w < 4; w++) {
    Vec got = scalarRun(widths[w]);
    char buffer[64];
    std::snprintf(buffer, sizeof(buffer), "scalar, %d bit%s", widths[w],
                  widths[w] == 1 ? "" : "s");
    labels.push_back(buffer);
    bitsCol.push_back(got[0]);
    plainCol.push_back(got[1]);
    fixedCol.push_back(got[2]);
  }
  Vec pq = productRun();
  char buffer[64];
  std::snprintf(buffer, sizeof(buffer), "product, %d x %d", SUBSPACES, CENTROIDS);
  labels.push_back(buffer);
  bitsCol.push_back(pq[0]);
  plainCol.push_back(pq[1]);
  fixedCol.push_back(pq[2]);

  long long total = (long long)QUERIES * K;
  std::printf("%d documents of %d dimensions, top %d, %d queries\\n", N, DIM, K, QUERIES);
  std::printf("\\n");
  std::printf("scheme            bits/vector   compression   recall   reranked\\n");
  for (size_t r = 0; r < labels.size(); r++) {
    long long plain = plainCol[r] * 1000 / total;
    long long fixed = fixedCol[r] * 1000 / total;
    long long shrink = (long long)DIM * BITS_PER_VALUE * 10 / bitsCol[r];
    std::printf("%-16s %11lld  %10lld.%lldx   %3lld.%lld%%     %3lld.%lld%%\\n", labels[r].c_str(),
                bitsCol[r], shrink / 10, shrink % 10, plain / 10, plain % 10, fixed / 10,
                fixed % 10);
  }
  std::printf("\\n");
    std::cout
        << "The full-precision row is the control. Everything else stores less of" << "\\n"
        << "each vector and loses answers for it, and the two columns on the right" << "\\n"
        << "are the whole argument." << "\\n"
        << "" << "\\n"
        << "Read the recall column first. Dropping from ten bits per value to" << "\\n"
        << "eight costs almost nothing, 99.1%, because the low two bits of a" << "\\n"
        << "coordinate were never deciding which neighbour was nearest. Four bits" << "\\n"
        << "costs real accuracy at 85.0%. Two bits collapses to 48.0%. The loss" << "\\n"
        << "is not gradual -- it is nothing, then a little, then a cliff, and" << "\\n"
        << "where the cliff is depends on the data rather than on any rule of" << "\\n"
        << "thumb. That is the argument for measuring rather than choosing a" << "\\n"
        << "bit width from a blog post." << "\\n"
        << "" << "\\n"
        << "Now compare the two schemes at the same size. Sixteen bits per vector" << "\\n"
        << "buys 48.0% with scalar quantisation and 61.0% with product" << "\\n"
        << "quantisation, and the reason is what each one throws away. Scalar" << "\\n"
        << "keeps every coordinate and blurs all of them equally. Product" << "\\n"
        << "quantisation splits the vector into four slices and replaces each" << "\\n"
        << "slice with the nearest of sixteen learned representatives, so the" << "\\n"
        << "representatives sit where the data actually is, and coordinates that" << "\\n"
        << "never vary cost nothing to store. It is a codebook rather than a" << "\\n"
        << "rounding rule, and at the same budget the codebook wins." << "\\n"
        << "" << "\\n"
        << "Product quantisation also changes what a query costs, in a way the" << "\\n"
        << "table does not show. The query computes sixteen distances per slice" << "\\n"
        << "once -- sixty-four in total -- and then every document is four array" << "\\n"
        << "lookups and three additions. No multiplies at all in the inner loop." << "\\n"
        << "That is the same trick as precomputing a table in dynamic programming," << "\\n"
        << "applied to distance." << "\\n"
        << "" << "\\n"
        << "The last column is the one worth taking away. Take the top fifty by" << "\\n"
        << "the compressed distance, then rescore just those fifty against the" << "\\n"
        << "full-precision vectors, and product quantisation at sixteen bits a" << "\\n"
        << "vector goes from 61.0% to 98.4%. Fifty exact distances per query, against two thousand" << "\\n"
        << "for the exact scan. The compressed index does not have to be right --" << "\\n"
        << "it only has to put the true neighbours somewhere in a shortlist, and" << "\\n"
        << "being roughly right is enough for that. Nearly every production vector" << "\\n"
        << "index is built this way: a small approximate structure to shortlist," << "\\n"
        << "and the real vectors consulted only for the handful that survive." << "\\n"
        ;
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Vector quantisation: store less of each vector and see what it costs you.
// Two schemes, then the one line of code that buys most of the loss back.

use std::collections::HashSet;

const DIM: usize = 8;
const N: usize = 2000;
const QUERIES: usize = 150;
const K: usize = 10;
const BITS_PER_VALUE: usize = 10; // values are 0..999, so ten bits is honest
const SUBSPACES: usize = 4; // for product quantisation
const CENTROIDS: usize = 16; // per subspace, so four bits per code
const RERANK: usize = 50;
const WIDTH: usize = DIM / SUBSPACES;

fn sq_dist(a: &[i64], b: &[i64]) -> i64 {
    let mut total = 0;
    for i in 0..a.len() {
        let d = a[i] - b[i];
        total += d * d;
    }
    total
}

fn top_k(scores: &[i64], limit: usize) -> Vec<usize> {
    let mut order: Vec<(i64, usize)> = Vec::new();
    for i in 0..scores.len() {
        order.push((scores[i], i));
    }
    order.sort();
    order.iter().take(limit).map(|p| p.1).collect()
}

// The same linear congruential generator in every language, so the random
// vectors below are the same vectors whichever translation is run.
static mut SEED: i64 = 77400013;

fn rand_below(n: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % n
    }
}

fn recall_of(found: &[usize], wanted: &[usize]) -> i64 {
    let keep: HashSet<usize> = wanted.iter().cloned().collect();
    let mut hit = 0;
    for i in found {
        if keep.contains(i) {
            hit += 1;
        }
    }
    hit
}

fn rerank(query: &[i64], candidates: &[usize], docs: &[Vec<i64>]) -> Vec<usize> {
    let mut scored: Vec<(i64, usize)> = Vec::new();
    for &i in candidates {
        scored.push((sq_dist(query, &docs[i]), i));
    }
    scored.sort();
    scored.iter().take(K).map(|p| p.1).collect()
}

fn slice(v: &[i64], s: usize) -> Vec<i64> {
    v[s * WIDTH..(s + 1) * WIDTH].to_vec()
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
    let mut exact: Vec<Vec<usize>> = Vec::new();
    for q in queries.iter() {
        let scores: Vec<i64> = docs.iter().map(|d| sq_dist(q, d)).collect();
        exact.push(top_k(&scores, K));
    }

    // --- scheme two's codebooks, learned once -------------------------------

    let mut books: Vec<Vec<Vec<i64>>> = Vec::new();
    for s in 0..SUBSPACES {
        let mut book: Vec<Vec<i64>> = Vec::new();
        for _ in 0..CENTROIDS {
            let pick = rand_below(N as i64) as usize;
            book.push(slice(&docs[pick], s));
        }
        for _ in 0..4 {
            let mut sums: Vec<Vec<i64>> = vec![vec![0; WIDTH]; CENTROIDS];
            let mut counts: Vec<i64> = vec![0; CENTROIDS];
            for d in docs.iter() {
                let piece = slice(d, s);
                let mut best = 0;
                let mut best_d = sq_dist(&piece, &book[0]);
                for c in 1..CENTROIDS {
                    let got = sq_dist(&piece, &book[c]);
                    if got < best_d {
                        best_d = got;
                        best = c;
                    }
                }
                counts[best] += 1;
                for j in 0..WIDTH {
                    sums[best][j] += piece[j];
                }
            }
            for c in 0..CENTROIDS {
                if counts[c] > 0 {
                    for j in 0..WIDTH {
                        book[c][j] = sums[c][j] / counts[c];
                    }
                }
            }
        }
        books.push(book);
    }

    let mut codes: Vec<Vec<usize>> = Vec::new();
    for d in docs.iter() {
        let mut row: Vec<usize> = Vec::new();
        for s in 0..SUBSPACES {
            let piece = slice(d, s);
            let mut best = 0;
            let mut best_d = sq_dist(&piece, &books[s][0]);
            for c in 1..CENTROIDS {
                let got = sq_dist(&piece, &books[s][c]);
                if got < best_d {
                    best_d = got;
                    best = c;
                }
            }
            row.push(best);
        }
        codes.push(row);
    }

    // --- scheme one: scalar quantisation, throw away the low bits -----------

    let scalar_run = |bits: usize, docs: &[Vec<i64>]| -> (i64, i64, i64) {
        let shift = (BITS_PER_VALUE - bits) as i64;
        let small: Vec<Vec<i64>> = docs.iter().map(|d| d.iter().map(|v| v >> shift).collect()).collect();
        let mut plain = 0;
        let mut reranked = 0;
        for t in 0..QUERIES {
            let q: Vec<i64> = queries[t].iter().map(|v| v >> shift).collect();
            let scores: Vec<i64> = small.iter().map(|s| sq_dist(&q, s)).collect();
            plain += recall_of(&top_k(&scores, K), &exact[t]);
            reranked += recall_of(&rerank(&queries[t], &top_k(&scores, RERANK), docs), &exact[t]);
        }
        ((DIM * bits) as i64, plain, reranked)
    };

    // --- scheme two: product quantisation, a codebook per slice -------------

    let product_run = |docs: &[Vec<i64>]| -> (i64, i64, i64) {
        let mut plain = 0;
        let mut reranked = 0;
        for t in 0..QUERIES {
            // one small table per slice, then every document is four lookups
            let mut tables: Vec<Vec<i64>> = Vec::new();
            for s in 0..SUBSPACES {
                let piece = slice(&queries[t], s);
                let mut table: Vec<i64> = Vec::new();
                for c in 0..CENTROIDS {
                    table.push(sq_dist(&piece, &books[s][c]));
                }
                tables.push(table);
            }
            let mut scores: Vec<i64> = Vec::new();
            for i in 0..N {
                let mut total = 0;
                for s in 0..SUBSPACES {
                    total += tables[s][codes[i][s]];
                }
                scores.push(total);
            }
            plain += recall_of(&top_k(&scores, K), &exact[t]);
            reranked += recall_of(&rerank(&queries[t], &top_k(&scores, RERANK), docs), &exact[t]);
        }
        ((SUBSPACES * 4) as i64, plain, reranked)
    };

    let mut rows: Vec<(String, i64, i64, i64)> = Vec::new();
    rows.push((
        "full precision".to_string(),
        (DIM * BITS_PER_VALUE) as i64,
        (QUERIES * K) as i64,
        (QUERIES * K) as i64,
    ));
    for &bits in [8usize, 4, 2, 1].iter() {
        let got = scalar_run(bits, &docs);
        let label = format!("scalar, {} bit{}", bits, if bits == 1 { "" } else { "s" });
        rows.push((label, got.0, got.1, got.2));
    }
    let pq = product_run(&docs);
    rows.push((
        format!("product, {} x {}", SUBSPACES, CENTROIDS),
        pq.0,
        pq.1,
        pq.2,
    ));

    let total = (QUERIES * K) as i64;
    println!("{} documents of {} dimensions, top {}, {} queries", N, DIM, K, QUERIES);
    println!();
    println!("scheme            bits/vector   compression   recall   reranked");
    for row in rows.iter() {
        let plain = row.2 * 1000 / total;
        let fixed = row.3 * 1000 / total;
        let shrink = (DIM * BITS_PER_VALUE) as i64 * 10 / row.1;
        println!(
            "{:<16} {:>11}  {:>10}.{}x   {:>3}.{}%     {:>3}.{}%",
            row.0,
            row.1,
            shrink / 10,
            shrink % 10,
            plain / 10,
            plain % 10,
            fixed / 10,
            fixed % 10
        );
    }
    println!();
    println!("{}", [
        "The full-precision row is the control. Everything else stores less of",
        "each vector and loses answers for it, and the two columns on the right",
        "are the whole argument.",
        "",
        "Read the recall column first. Dropping from ten bits per value to",
        "eight costs almost nothing, 99.1%, because the low two bits of a",
        "coordinate were never deciding which neighbour was nearest. Four bits",
        "costs real accuracy at 85.0%. Two bits collapses to 48.0%. The loss",
        "is not gradual -- it is nothing, then a little, then a cliff, and",
        "where the cliff is depends on the data rather than on any rule of",
        "thumb. That is the argument for measuring rather than choosing a",
        "bit width from a blog post.",
        "",
        "Now compare the two schemes at the same size. Sixteen bits per vector",
        "buys 48.0% with scalar quantisation and 61.0% with product",
        "quantisation, and the reason is what each one throws away. Scalar",
        "keeps every coordinate and blurs all of them equally. Product",
        "quantisation splits the vector into four slices and replaces each",
        "slice with the nearest of sixteen learned representatives, so the",
        "representatives sit where the data actually is, and coordinates that",
        "never vary cost nothing to store. It is a codebook rather than a",
        "rounding rule, and at the same budget the codebook wins.",
        "",
        "Product quantisation also changes what a query costs, in a way the",
        "table does not show. The query computes sixteen distances per slice",
        "once -- sixty-four in total -- and then every document is four array",
        "lookups and three additions. No multiplies at all in the inner loop.",
        "That is the same trick as precomputing a table in dynamic programming,",
        "applied to distance.",
        "",
        "The last column is the one worth taking away. Take the top fifty by",
        "the compressed distance, then rescore just those fifty against the",
        "full-precision vectors, and product quantisation at sixteen bits a",
        "vector goes from 61.0% to 98.4%. Fifty exact distances per query, against two thousand",
        "for the exact scan. The compressed index does not have to be right --",
        "it only has to put the true neighbours somewhere in a shortlist, and",
        "being roughly right is enough for that. Nearly every production vector",
        "index is built this way: a small approximate structure to shortlist,",
        "and the real vectors consulted only for the handful that survive.",
    ].join("\\n"));
}
`,
            },
            {
              lang: "go",
              code: `// Vector quantisation: store less of each vector and see what it costs you.
// Two schemes, then the one line of code that buys most of the loss back.

package main

import (
	"fmt"
	"sort"
	"strings"
)

const dim = 8
const n = 2000
const queryCount = 150
const k = 10
const bitsPerValue = 10 // values are 0..999, so ten bits is honest
const subspaces = 4     // for product quantisation
const centroids = 16    // per subspace, so four bits per code
const rerankTo = 50
const width = dim / subspaces

var docs [][]int64
var queries [][]int64
var books [][][]int64
var codes [][]int
var exact [][]int

func sqDist(a, b []int64) int64 {
	var total int64
	for i := range a {
		d := a[i] - b[i]
		total += d * d
	}
	return total
}

type pair struct {
	score int64
	index int
}

func topK(scores []int64, limit int) []int {
	order := make([]pair, len(scores))
	for i, s := range scores {
		order[i] = pair{score: s, index: i}
	}
	sort.Slice(order, func(x, y int) bool {
		if order[x].score != order[y].score {
			return order[x].score < order[y].score
		}
		return order[x].index < order[y].index
	})
	out := []int{}
	for i := 0; i < limit && i < len(order); i++ {
		out = append(out, order[i].index)
	}
	return out
}

// The same linear congruential generator in every language, so the random
// vectors below are the same vectors whichever translation is run.
var seed int64 = 77400013

func randBelow(limit int64) int64 {
	seed = (seed*1103515245 + 12345) % 2147483648
	return seed / 65536 % limit
}

func recallOf(found, wanted []int) int64 {
	keep := map[int]bool{}
	for _, i := range wanted {
		keep[i] = true
	}
	var hit int64
	for _, i := range found {
		if keep[i] {
			hit++
		}
	}
	return hit
}

func rerank(query []int64, candidates []int) []int {
	scored := make([]pair, len(candidates))
	for c, i := range candidates {
		scored[c] = pair{score: sqDist(query, docs[i]), index: i}
	}
	sort.Slice(scored, func(x, y int) bool {
		if scored[x].score != scored[y].score {
			return scored[x].score < scored[y].score
		}
		return scored[x].index < scored[y].index
	})
	out := []int{}
	for i := 0; i < k && i < len(scored); i++ {
		out = append(out, scored[i].index)
	}
	return out
}

func slice(v []int64, s int) []int64 {
	return v[s*width : (s+1)*width]
}

// --- scheme one: scalar quantisation, throw away the low bits -----------

func scalarRun(bits int) (int64, int64, int64) {
	shift := uint(bitsPerValue - bits)
	small := make([][]int64, n)
	for d := 0; d < n; d++ {
		row := make([]int64, dim)
		for i := 0; i < dim; i++ {
			row[i] = docs[d][i] >> shift
		}
		small[d] = row
	}
	var plain int64
	var reranked int64
	for t := 0; t < queryCount; t++ {
		q := make([]int64, dim)
		for i := 0; i < dim; i++ {
			q[i] = queries[t][i] >> shift
		}
		scores := make([]int64, n)
		for d := 0; d < n; d++ {
			scores[d] = sqDist(q, small[d])
		}
		plain += recallOf(topK(scores, k), exact[t])
		reranked += recallOf(rerank(queries[t], topK(scores, rerankTo)), exact[t])
	}
	return int64(dim * bits), plain, reranked
}

// --- scheme two: product quantisation, a codebook per slice -------------

func productRun() (int64, int64, int64) {
	var plain int64
	var reranked int64
	for t := 0; t < queryCount; t++ {
		// one small table per slice, then every document is four lookups
		tables := make([][]int64, subspaces)
		for s := 0; s < subspaces; s++ {
			piece := slice(queries[t], s)
			table := make([]int64, centroids)
			for c := 0; c < centroids; c++ {
				table[c] = sqDist(piece, books[s][c])
			}
			tables[s] = table
		}
		scores := make([]int64, n)
		for i := 0; i < n; i++ {
			var total int64
			for s := 0; s < subspaces; s++ {
				total += tables[s][codes[i][s]]
			}
			scores[i] = total
		}
		plain += recallOf(topK(scores, k), exact[t])
		reranked += recallOf(rerank(queries[t], topK(scores, rerankTo)), exact[t])
	}
	return int64(subspaces * 4), plain, reranked
}

func main() {
	for d := 0; d < n; d++ {
		v := make([]int64, dim)
		for i := 0; i < dim; i++ {
			v[i] = randBelow(1000)
		}
		docs = append(docs, v)
	}
	for q := 0; q < queryCount; q++ {
		v := make([]int64, dim)
		for i := 0; i < dim; i++ {
			v[i] = randBelow(1000)
		}
		queries = append(queries, v)
	}
	for q := 0; q < queryCount; q++ {
		scores := make([]int64, n)
		for d := 0; d < n; d++ {
			scores[d] = sqDist(queries[q], docs[d])
		}
		exact = append(exact, topK(scores, k))
	}

	for s := 0; s < subspaces; s++ {
		book := make([][]int64, centroids)
		for c := 0; c < centroids; c++ {
			book[c] = append([]int64{}, slice(docs[randBelow(n)], s)...)
		}
		for round := 0; round < 4; round++ {
			sums := make([][]int64, centroids)
			for c := range sums {
				sums[c] = make([]int64, width)
			}
			counts := make([]int64, centroids)
			for d := 0; d < n; d++ {
				piece := slice(docs[d], s)
				best := 0
				bestD := sqDist(piece, book[0])
				for c := 1; c < centroids; c++ {
					got := sqDist(piece, book[c])
					if got < bestD {
						bestD = got
						best = c
					}
				}
				counts[best]++
				for j := 0; j < width; j++ {
					sums[best][j] += piece[j]
				}
			}
			for c := 0; c < centroids; c++ {
				if counts[c] > 0 {
					for j := 0; j < width; j++ {
						book[c][j] = sums[c][j] / counts[c]
					}
				}
			}
		}
		books = append(books, book)
	}

	for d := 0; d < n; d++ {
		row := make([]int, subspaces)
		for s := 0; s < subspaces; s++ {
			piece := slice(docs[d], s)
			best := 0
			bestD := sqDist(piece, books[s][0])
			for c := 1; c < centroids; c++ {
				got := sqDist(piece, books[s][c])
				if got < bestD {
					bestD = got
					best = c
				}
			}
			row[s] = best
		}
		codes = append(codes, row)
	}

	type entry struct {
		label string
		bits  int64
		plain int64
		fixed int64
	}
	rows := []entry{{"full precision", dim * bitsPerValue, queryCount * k, queryCount * k}}
	for _, bits := range []int{8, 4, 2, 1} {
		b, plain, reranked := scalarRun(bits)
		suffix := "s"
		if bits == 1 {
			suffix = ""
		}
		rows = append(rows, entry{fmt.Sprintf("scalar, %d bit%s", bits, suffix), b, plain, reranked})
	}
	b, plain, reranked := productRun()
	rows = append(rows, entry{fmt.Sprintf("product, %d x %d", subspaces, centroids), b, plain, reranked})

	var total int64 = queryCount * k
	fmt.Printf("%d documents of %d dimensions, top %d, %d queries\\n", n, dim, k, queryCount)
	fmt.Println()
	fmt.Println("scheme            bits/vector   compression   recall   reranked")
	for _, row := range rows {
		plain := row.plain * 1000 / total
		fixed := row.fixed * 1000 / total
		shrink := int64(dim*bitsPerValue) * 10 / row.bits
		fmt.Printf("%-16s %11d  %10d.%dx   %3d.%d%%     %3d.%d%%\\n", row.label, row.bits,
			shrink/10, shrink%10, plain/10, plain%10, fixed/10, fixed%10)
	}
	fmt.Println()
	fmt.Println(strings.Join([]string{
		"The full-precision row is the control. Everything else stores less of",
		"each vector and loses answers for it, and the two columns on the right",
		"are the whole argument.",
		"",
		"Read the recall column first. Dropping from ten bits per value to",
		"eight costs almost nothing, 99.1%, because the low two bits of a",
		"coordinate were never deciding which neighbour was nearest. Four bits",
		"costs real accuracy at 85.0%. Two bits collapses to 48.0%. The loss",
		"is not gradual -- it is nothing, then a little, then a cliff, and",
		"where the cliff is depends on the data rather than on any rule of",
		"thumb. That is the argument for measuring rather than choosing a",
		"bit width from a blog post.",
		"",
		"Now compare the two schemes at the same size. Sixteen bits per vector",
		"buys 48.0% with scalar quantisation and 61.0% with product",
		"quantisation, and the reason is what each one throws away. Scalar",
		"keeps every coordinate and blurs all of them equally. Product",
		"quantisation splits the vector into four slices and replaces each",
		"slice with the nearest of sixteen learned representatives, so the",
		"representatives sit where the data actually is, and coordinates that",
		"never vary cost nothing to store. It is a codebook rather than a",
		"rounding rule, and at the same budget the codebook wins.",
		"",
		"Product quantisation also changes what a query costs, in a way the",
		"table does not show. The query computes sixteen distances per slice",
		"once -- sixty-four in total -- and then every document is four array",
		"lookups and three additions. No multiplies at all in the inner loop.",
		"That is the same trick as precomputing a table in dynamic programming,",
		"applied to distance.",
		"",
		"The last column is the one worth taking away. Take the top fifty by",
		"the compressed distance, then rescore just those fifty against the",
		"full-precision vectors, and product quantisation at sixteen bits a",
		"vector goes from 61.0% to 98.4%. Fifty exact distances per query, against two thousand",
		"for the exact scan. The compressed index does not have to be right --",
		"it only has to put the true neighbours somewhere in a shortlist, and",
		"being roughly right is enough for that. Nearly every production vector",
		"index is built this way: a small approximate structure to shortlist,",
		"and the real vectors consulted only for the handful that survive.",
	}, "\\n"))
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "codebook-beats-rounding",
      heading: "Why the codebook wins at the same size",
      body: [
        "Both schemes above spend sixteen bits a vector, and product quantisation recovers 61.0% against scalar's 48.0%. The difference is what each one assumes.",
        "Scalar quantisation is a **rounding rule**. It keeps every coordinate and blurs all of them by the same amount, and it does that whether or not the data ever varies along that coordinate. A dimension where every document has nearly the same value gets exactly as many bits as the dimension that separates everything.",
        "Product quantisation is a **codebook**. Each slice of the vector is replaced by the nearest of sixteen representatives, and those representatives were learned from the data \u2014 they sit where the vectors actually are. Coordinates that never vary cost nothing, because no codebook entry needs to distinguish them.",
        "There is a second saving the recall table does not show. A product-quantised query computes sixteen distances per slice once \u2014 sixty-four in total \u2014 and then every document is four array lookups and three additions. **No multiplies in the inner loop at all.** That is the precomputed-table trick from dynamic programming, applied to distance, and it is why product quantisation is fast as well as small.",
      ],
      pitfalls: [
        {
          title: "Choosing a bit width from a rule of thumb",
          body: "The measured curve is 99.1, 85.0, 48.0, 26.0 for eight, four, two and one bits. The cliff is real and its position depends on the data. Measure it on your vectors.",
        },
        {
          title: "Training the codebook on the queries",
          body: "The codebook must be learned from the stored vectors, and recall must be measured against exact answers for queries the codebook never saw. Otherwise the number is not recall, it is memorisation.",
        },
        {
          title: "Quantising and then trusting the distances",
          body: "A compressed distance is an estimate. It is good enough to shortlist and not good enough to rank, which is the whole point of the next section.",
        },
      ],
    },
    {
      id: "the-shortlist",
      heading: "Shortlist, then rescore",
      body: [
        "The last column of the table is the technique that makes all of this usable, and it is worth stating as a rule.",
        "**The compressed index does not have to be right. It only has to put the true neighbours somewhere in a shortlist.**",
        "Sixty-one percent of the true top ten were in the compressed top ten. But nearly all of them were somewhere in the compressed top *fifty* \u2014 which is why rescoring those fifty against the full-precision vectors reaches 98.4%. Fifty exact distances per query, against two thousand for a full exact scan.",
        "The two stages have genuinely different jobs. The first stage is optimised for **recall at a large k** and is allowed to be sloppy about order. The second stage is optimised for **precision at a small k** and is allowed to be slow, because it only ever sees the shortlist.",
        "This is the same structure as the reranking stage in a retrieval pipeline, and the two lessons arrive at it from opposite directions \u2014 one from compression, one from search. That it appears twice is the signal that it is a pattern rather than a trick.",
        "It also resolves the memory question. The compressed vectors live in RAM, where the scan happens; the full-precision vectors live on disk, where fifty random reads per query is entirely affordable. Compression buys the fast path, and the slow path is only ever asked about fifty things.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you fit a billion vectors in memory?",
      answer:
        "Compress them, and measure what the compression costs rather than guessing. Two schemes: scalar quantisation stores each coordinate in fewer bits, and product quantisation splits the vector into slices and stores the index of the nearest entry in a learned codebook per slice. I measured both. Scalar goes 99.1%, 85.0%, 48.0%, 26.0% recall at eight, four, two and one bits -- nothing, then a little, then a cliff. At the same sixteen bits a vector, product quantisation gets 61.0% against scalar's 48.0%, because a codebook sits where the data actually is while rounding blurs every coordinate equally. Product quantisation is also faster: the query builds one small distance table per slice, and then each document is four lookups and three adds, with no multiplies in the inner loop.",
    },
    {
      question: "If quantisation loses that much recall, how is it usable?",
      answer:
        "Because the compressed index does not have to be right, it only has to put the true neighbours somewhere in a shortlist. In my measurement, product quantisation at sixteen bits found 61.0% of the true top ten in its own top ten -- but taking its top fifty and rescoring just those against the full-precision vectors reached 98.4%. That is fifty exact distances per query against two thousand for a full scan. The two stages have different jobs: the first is optimised for recall at a large k and allowed to be sloppy about order, the second for precision at a small k and allowed to be slow. It also solves the memory problem cleanly, since the compressed vectors live in RAM and the full ones can sit on disk.",
    },
  ],
  takeaways: [
    "Index structures choose what to look at; quantisation chooses what to store",
    "Measured recall by bit width: 99.1, 85.0, 48.0, 26.0 — a cliff, not a slope",
    "At sixteen bits a vector: product quantisation 61.0%, scalar 48.0%",
    "A codebook sits where the data is; rounding blurs every coordinate equally",
    "Product quantisation's inner loop is table lookups, with no multiplies",
    "Rescoring fifty candidates exactly took 61.0% to 98.4%",
    "First stage: recall at large k. Second stage: precision at small k",
  ],
};
