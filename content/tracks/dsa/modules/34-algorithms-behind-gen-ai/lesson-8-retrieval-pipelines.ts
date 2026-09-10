import type { Lesson } from "@/content/types";

export const retrievalPipelinesLesson: Lesson = {
  id: "dsa-gen-ai-retrieval-pipelines",
  slug: "retrieval-pipelines",
  moduleSlug: "algorithms-behind-gen-ai",
  title: "Retrieval Pipelines: Inverted Indexes, BM25, Fusion and Reranking",
  summary:
    "Measured end to end, including the result that contradicts the sales pitch: fusing BM25 with a weak dense ranking scored 88.7%, worse than BM25 alone at 96.6%, and a second stage over the shortlist reached 100%.",
  estimatedMinutes: 40,
  status: "available",
  objectives: [
    "Build an inverted index and say what it saves",
    "Explain BM25's two corrections over counting query terms, and measure them",
    "Show when hybrid fusion helps and when it does not",
    "Structure a pipeline as a broad first stage and a precise second stage",
  ],
  sections: [
    {
      id: "the-index",
      heading: "The inverted index",
      body: [
        "Before any ranking, there is a data structure question: which documents are even worth scoring?",
        "An **inverted index** is a hash map from term to the list of documents containing it \u2014 the *posting list*. A query looks up its terms, takes the union (or intersection) of their posting lists, and scores only those. Documents containing none of the query terms are never touched.",
        "That is the entire idea, and it is a hash map of lists. It is also the reason full-text search over a billion documents is possible on hardware that could not scan a billion documents per query.",
        "The saving is measurable and the program measures it, along with three questions about what to do with the shortlist once you have it.",
      ],
    },
    {
      id: "measured",
      heading: "The whole pipeline, measured",
      body: [
        "Documents here are drawn from hidden topics, a query is drawn from one topic, and a document is relevant when it came from the query's topic. Relevance is defined by construction, so precision can be counted rather than judged.",
      ],
      examples: [
        {
          id: "index-bm25-fusion-rerank",
          title: "An inverted index, four rankings over it, and a second stage",
          lang: "python",
          code: `# A retrieval pipeline, measured end to end: an inverted index to shortlist,
# BM25 to score, a dense index for the words the query did not use, and
# fusion to put the two together.

VOCAB = 200
TOPICS = 40
CORE = 8           # words that make a topic what it is
N = 2000
DOC_LENGTH = 30
QUERIES = 200
TERMS = 3
DIM = 8
K = 10


def log2_milli(value_milli):
    # floor(1000 * log2(value_milli / 1000)), integers only, because a
    # logarithm formats differently in every language and this has to
    # print the same everywhere.
    if value_milli < 1000:
        return 0
    whole = 0
    y = value_milli
    while y >= 2000:
        y //= 2
        whole += 1
    frac = 0
    for _ in range(10):
        y = y * y // 1000
        frac *= 2
        if y >= 2000:
            y //= 2
            frac += 1
    return whole * 1000 + frac * 1000 // 1024


# The same linear congruential generator in every language, so the corpus
# below is the same corpus whichever translation is run.
seed = 4480021


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


# --- a corpus with topics in it -----------------------------------------

topic_words = []
topic_centres = []
for t in range(TOPICS):
    words = []
    for _ in range(CORE):
        words.append(rand(VOCAB))
    topic_words.append(words)
    topic_centres.append([rand(100) for _ in range(DIM)])

doc_topic = []
docs = []
doc_vectors = []
for d in range(N):
    t = rand(TOPICS)
    doc_topic.append(t)
    words = []
    for _ in range(DOC_LENGTH):
        if rand(10) < 4:
            words.append(topic_words[t][rand(CORE)])
        else:
            words.append(rand(VOCAB))
    docs.append(words)
    doc_vectors.append([topic_centres[t][j] + rand(81) - 40 for j in range(DIM)])

query_topic = []
queries = []
query_vectors = []
for q in range(QUERIES):
    t = rand(TOPICS)
    query_topic.append(t)
    terms = []
    for _ in range(TERMS):
        terms.append(topic_words[t][rand(CORE)])
    queries.append(terms)
    query_vectors.append([topic_centres[t][j] + rand(81) - 40 for j in range(DIM)])

# --- the inverted index -------------------------------------------------

postings = {}
term_frequency = []
lengths = []
for d in range(N):
    counts = {}
    for w in docs[d]:
        counts[w] = counts.get(w, 0) + 1
    term_frequency.append(counts)
    lengths.append(len(docs[d]))
    for w in counts:
        if w not in postings:
            postings[w] = []
        postings[w].append(d)

total_length = 0
for length in lengths:
    total_length += length
average_length = total_length // N


def shortlist(terms):
    seen = {}
    out = []
    for term in terms:
        if term in postings:
            for d in postings[term]:
                if d not in seen:
                    seen[d] = True
                    out.append(d)
    out.sort()
    return out


# --- three ways to score ------------------------------------------------

def count_matches(terms, d):
    total = 0
    for term in terms:
        total += term_frequency[d].get(term, 0)
    return total


K1 = 1500   # 1.5, in thousandths
B = 750     # 0.75


def bm25(terms, d):
    total = 0
    for term in terms:
        tf = term_frequency[d].get(term, 0)
        if tf == 0:
            continue
        df = len(postings[term])
        ratio = (2 * N - 2 * df + 1) * 1000 // (2 * df + 1) + 1000
        idf = log2_milli(ratio)
        top = tf * (K1 + 1000)
        norm = 1000 - B + B * lengths[d] // average_length
        bottom = tf * 1000 + K1 * norm // 1000
        total += idf * top // bottom
    return total


def dense_score(q, d):
    # smaller distance is better, so negate to make bigger better
    total = 0
    for j in range(DIM):
        diff = query_vectors[q][j] - doc_vectors[d][j]
        total += diff * diff
    return -total


def ranked(scores, limit):
    order = []
    for pair in scores:
        order.append([-pair[0], pair[1]])
    order.sort()
    return [pair[1] for pair in order[:limit]]


def precision(found, topic):
    hit = 0
    for d in found:
        if doc_topic[d] == topic:
            hit += 1
    return hit


# --- run everything -----------------------------------------------------

scanned_all = 0
scanned_index = 0
p_count = 0
p_bm25 = 0
p_dense = 0
p_hybrid = 0
p_reranked = 0
overlap = 0
for q in range(QUERIES):
    terms = queries[q]
    topic = query_topic[q]
    candidates = shortlist(terms)
    scanned_all += N
    scanned_index += len(candidates)

    by_count = ranked([[count_matches(terms, d), d] for d in candidates], K)
    by_bm25_all = ranked([[bm25(terms, d), d] for d in candidates], 50)
    by_dense_all = ranked([[dense_score(q, d), d] for d in range(N)], 50)
    by_bm25 = by_bm25_all[:K]
    by_dense = by_dense_all[:K]

    p_count += precision(by_count, topic)
    p_bm25 += precision(by_bm25, topic)
    p_dense += precision(by_dense, topic)
    shared = {}
    for d in by_bm25:
        shared[d] = True
    for d in by_dense:
        if d in shared:
            overlap += 1

    # reciprocal rank fusion: 1/(60 + rank), in scaled integers
    fused = {}
    for rank in range(len(by_bm25_all)):
        d = by_bm25_all[rank]
        fused[d] = fused.get(d, 0) + 1000000 // (60 + rank + 1)
    for rank in range(len(by_dense_all)):
        d = by_dense_all[rank]
        fused[d] = fused.get(d, 0) + 1000000 // (60 + rank + 1)
    fused_list = []
    for d in fused:
        fused_list.append([fused[d], d])
    fused_list.sort(key=lambda pair: (-pair[0], pair[1]))
    p_hybrid += precision([pair[1] for pair in fused_list[:K]], topic)

    # rerank the fused shortlist with a query the first stage could not
    # have used: the original terms plus the commonest words among the
    # documents the first stage liked
    top50 = [pair[1] for pair in fused_list[:50]]
    tally = {}
    for d in top50[:K]:
        for w in term_frequency[d]:
            tally[w] = tally.get(w, 0) + term_frequency[d][w]
    ordered = []
    for w in tally:
        ordered.append([-tally[w], w])
    ordered.sort()
    expanded = list(terms)
    for pair in ordered[:5]:
        if pair[1] not in expanded:
            expanded.append(pair[1])
    rescored = []
    for d in top50:
        rescored.append([bm25(expanded, d), d])
    p_reranked += precision(ranked(rescored, K), topic)

total = QUERIES * K
print("%d documents over %d topics, %d queries of %d terms, top %d"
      % (N, TOPICS, QUERIES, TERMS, K))
print("a document is relevant when it came from the query's topic")
print()
print("documents scored per query")
print("  full scan                %8d" % (scanned_all // QUERIES))
print("  inverted index           %8d" % (scanned_index // QUERIES))
print()
print("ranking                     relevant in top %d of %d" % (K, total))
for name, value in [("count the query terms", p_count), ("bm25", p_bm25),
                    ("dense vectors", p_dense), ("hybrid, rank fusion", p_hybrid),
                    ("hybrid then reranked", p_reranked)]:
    share = value * 1000 // total
    print("  %-24s %7d   %3d.%d%%" % (name, value, share // 10, share % 10))
print()
print("bm25 and dense agreed on %d of their %d top-%d picks, so %d%% of"
      % (overlap, total, K, (total - overlap) * 100 // total))
print("what each one found, the other one missed.")
print()
print("""Four things are measured here and one of them is not what the
folklore says.

The inverted index is the uncontroversial part. Scoring only the
documents that contain at least one query term means 574 documents
per query instead of 2000. That is the whole reason a posting list
exists: a hash map from term to the documents containing it, so
scoring is proportional to the documents that could possibly match
rather than to the collection.

BM25 against plain term counting is 96.6% to 86.7%, and the ten
points come from two corrections. Inverse document frequency
downweights a term that appears everywhere, because matching a common
word says almost nothing. Length normalisation stops a long document
winning merely by containing more words. Counting matches has neither,
so it rewards long documents stuffed with common terms -- which is
exactly the failure people notice in naive search.

Now the result that does not follow the script. Fusing BM25 with the
dense ranking scored 88.7%, which is worse than BM25 alone at 96.6%.
Hybrid retrieval is usually described as strictly better, and here it
is not, for a plain reason: the dense ranking is weak on this corpus
at 41.2%, and reciprocal rank fusion has no idea that one of its
inputs is bad. It weights the two lists equally because that is what
it was told to do. Fusion combines rankings; it does not judge them.
If one retriever is much worse than the other, fusion drags the good
one down, and the fix is a weight -- which has to be tuned on measured
data, not assumed.

The last row is why the pipeline has a second stage at all. Reranking
the fused top fifty with an expanded query -- the original terms plus
the commonest words among the documents the first stage liked -- scores
100%. The first stage was mediocre at ordering, but it was good at
gathering: the right documents were somewhere in its fifty, and a
better scorer that would be far too slow to run on two thousand
documents is perfectly affordable on fifty.

That is the shape of every production retrieval system, and it is the
same shape as the reranking step in the quantisation lesson. A cheap,
broad first stage whose only job is to put the answer somewhere in the
shortlist, and an expensive, accurate second stage that only ever sees
the shortlist. Recall first, precision second.""")
`,
          output: `2000 documents over 40 topics, 200 queries of 3 terms, top 10
a document is relevant when it came from the query's topic

documents scored per query
  full scan                    2000
  inverted index                574

ranking                     relevant in top 10 of 2000
  count the query terms       1734    86.7%
  bm25                        1933    96.6%
  dense vectors                824    41.2%
  hybrid, rank fusion         1775    88.7%
  hybrid then reranked        2000   100.0%

bm25 and dense agreed on 145 of their 2000 top-10 picks, so 92% of
what each one found, the other one missed.

Four things are measured here and one of them is not what the
folklore says.

The inverted index is the uncontroversial part. Scoring only the
documents that contain at least one query term means 574 documents
per query instead of 2000. That is the whole reason a posting list
exists: a hash map from term to the documents containing it, so
scoring is proportional to the documents that could possibly match
rather than to the collection.

BM25 against plain term counting is 96.6% to 86.7%, and the ten
points come from two corrections. Inverse document frequency
downweights a term that appears everywhere, because matching a common
word says almost nothing. Length normalisation stops a long document
winning merely by containing more words. Counting matches has neither,
so it rewards long documents stuffed with common terms -- which is
exactly the failure people notice in naive search.

Now the result that does not follow the script. Fusing BM25 with the
dense ranking scored 88.7%, which is worse than BM25 alone at 96.6%.
Hybrid retrieval is usually described as strictly better, and here it
is not, for a plain reason: the dense ranking is weak on this corpus
at 41.2%, and reciprocal rank fusion has no idea that one of its
inputs is bad. It weights the two lists equally because that is what
it was told to do. Fusion combines rankings; it does not judge them.
If one retriever is much worse than the other, fusion drags the good
one down, and the fix is a weight -- which has to be tuned on measured
data, not assumed.

The last row is why the pipeline has a second stage at all. Reranking
the fused top fifty with an expanded query -- the original terms plus
the commonest words among the documents the first stage liked -- scores
100%. The first stage was mediocre at ordering, but it was good at
gathering: the right documents were somewhere in its fifty, and a
better scorer that would be far too slow to run on two thousand
documents is perfectly affordable on fifty.

That is the shape of every production retrieval system, and it is the
same shape as the reranking step in the quantisation lesson. A cheap,
broad first stage whose only job is to put the answer somewhere in the
shortlist, and an expensive, accurate second stage that only ever sees
the shortlist. Recall first, precision second.`,
          explanation:
            "The index scores 574 documents per query instead of 2,000. BM25 beats counting query terms 96.6% to 86.7%. Then the result that does not follow the script: fusing BM25 with the dense ranking scored 88.7%, which is worse than BM25 alone -- because the dense ranking is weak on this corpus at 41.2%, and reciprocal rank fusion weights its two inputs equally because that is what it was told to do. Fusion combines rankings; it does not judge them. The last row is why the second stage exists: reranking the fused top fifty with an expanded query scores 100%, because the first stage was mediocre at ordering and good at gathering.",
          alternates: [
            {
              lang: "javascript",
              code: `// A retrieval pipeline, measured end to end: an inverted index to shortlist,
// BM25 to score, a dense index for the words the query did not use, and
// fusion to put the two together.

const VOCAB = 200;
const TOPICS = 40;
const CORE = 8; // words that make a topic what it is
const N = 2000;
const DOC_LENGTH = 30;
const QUERIES = 200;
const TERMS = 3;
const DIM = 8;
const K = 10;

function log2Milli(valueMilli) {
  // floor(1000 * log2(valueMilli / 1000)), integers only, because a
  // logarithm formats differently in every language and this has to
  // print the same everywhere.
  if (valueMilli < 1000) return 0;
  let whole = 0;
  let y = valueMilli;
  while (y >= 2000) {
    y = Math.floor(y / 2);
    whole += 1;
  }
  let frac = 0;
  for (let i = 0; i < 10; i++) {
    y = Math.floor((y * y) / 1000);
    frac *= 2;
    if (y >= 2000) {
      y = Math.floor(y / 2);
      frac += 1;
    }
  }
  return whole * 1000 + Math.floor((frac * 1000) / 1024);
}

// The same linear congruential generator in every language, so the corpus
// below is the same corpus whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 4480021n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

// --- a corpus with topics in it -----------------------------------------

const topicWords = [];
const topicCentres = [];
for (let t = 0; t < TOPICS; t++) {
  const words = [];
  for (let c = 0; c < CORE; c++) words.push(rand(VOCAB));
  topicWords.push(words);
  const centre = [];
  for (let j = 0; j < DIM; j++) centre.push(rand(100));
  topicCentres.push(centre);
}

const docTopic = [];
const docs = [];
const docVectors = [];
for (let d = 0; d < N; d++) {
  const t = rand(TOPICS);
  docTopic.push(t);
  const words = [];
  for (let w = 0; w < DOC_LENGTH; w++) {
    if (rand(10) < 4) words.push(topicWords[t][rand(CORE)]);
    else words.push(rand(VOCAB));
  }
  docs.push(words);
  const v = [];
  for (let j = 0; j < DIM; j++) v.push(topicCentres[t][j] + rand(81) - 40);
  docVectors.push(v);
}

const queryTopic = [];
const queries = [];
const queryVectors = [];
for (let q = 0; q < QUERIES; q++) {
  const t = rand(TOPICS);
  queryTopic.push(t);
  const terms = [];
  for (let i = 0; i < TERMS; i++) terms.push(topicWords[t][rand(CORE)]);
  queries.push(terms);
  const v = [];
  for (let j = 0; j < DIM; j++) v.push(topicCentres[t][j] + rand(81) - 40);
  queryVectors.push(v);
}

// --- the inverted index -------------------------------------------------

const postings = new Map();
const termFrequency = [];
const lengths = [];
for (let d = 0; d < N; d++) {
  const counts = new Map();
  for (const w of docs[d]) counts.set(w, (counts.get(w) || 0) + 1);
  termFrequency.push(counts);
  lengths.push(docs[d].length);
  for (const w of counts.keys()) {
    if (!postings.has(w)) postings.set(w, []);
    postings.get(w).push(d);
  }
}

let totalLength = 0;
for (const length of lengths) totalLength += length;
const averageLength = Math.floor(totalLength / N);

function shortlist(terms) {
  const seen = new Map();
  const out = [];
  for (const term of terms) {
    if (postings.has(term)) {
      for (const d of postings.get(term)) {
        if (!seen.has(d)) {
          seen.set(d, true);
          out.push(d);
        }
      }
    }
  }
  out.sort((a, b) => a - b);
  return out;
}

// --- three ways to score ------------------------------------------------

function countMatches(terms, d) {
  let total = 0;
  for (const term of terms) total += termFrequency[d].get(term) || 0;
  return total;
}

const K1 = 1500; // 1.5, in thousandths
const B = 750; // 0.75

function bm25(terms, d) {
  let total = 0;
  for (const term of terms) {
    const tf = termFrequency[d].get(term) || 0;
    if (tf === 0) continue;
    const df = postings.get(term).length;
    const ratio = Math.floor(((2 * N - 2 * df + 1) * 1000) / (2 * df + 1)) + 1000;
    const idf = log2Milli(ratio);
    const top = tf * (K1 + 1000);
    const norm = 1000 - B + Math.floor((B * lengths[d]) / averageLength);
    const bottom = tf * 1000 + Math.floor((K1 * norm) / 1000);
    total += Math.floor((idf * top) / bottom);
  }
  return total;
}

function denseScore(q, d) {
  // smaller distance is better, so negate to make bigger better
  let total = 0;
  for (let j = 0; j < DIM; j++) {
    const diff = queryVectors[q][j] - docVectors[d][j];
    total += diff * diff;
  }
  return -total;
}

function ranked(scores, limit) {
  const order = scores.map((pair) => [-pair[0], pair[1]]);
  order.sort((x, y) => (x[0] !== y[0] ? x[0] - y[0] : x[1] - y[1]));
  return order.slice(0, limit).map((pair) => pair[1]);
}

function precision(found, topic) {
  let hit = 0;
  for (const d of found) {
    if (docTopic[d] === topic) hit += 1;
  }
  return hit;
}

// --- run everything -----------------------------------------------------

let scannedAll = 0;
let scannedIndex = 0;
let pCount = 0;
let pBm25 = 0;
let pDense = 0;
let pHybrid = 0;
let pReranked = 0;
let overlap = 0;
for (let q = 0; q < QUERIES; q++) {
  const terms = queries[q];
  const topic = queryTopic[q];
  const candidates = shortlist(terms);
  scannedAll += N;
  scannedIndex += candidates.length;

  const byCount = ranked(candidates.map((d) => [countMatches(terms, d), d]), K);
  const byBm25All = ranked(candidates.map((d) => [bm25(terms, d), d]), 50);
  const everything = [];
  for (let d = 0; d < N; d++) everything.push([denseScore(q, d), d]);
  const byDenseAll = ranked(everything, 50);
  const byBm25 = byBm25All.slice(0, K);
  const byDense = byDenseAll.slice(0, K);

  pCount += precision(byCount, topic);
  pBm25 += precision(byBm25, topic);
  pDense += precision(byDense, topic);
  const shared = new Map();
  for (const d of byBm25) shared.set(d, true);
  for (const d of byDense) {
    if (shared.has(d)) overlap += 1;
  }

  // reciprocal rank fusion: 1/(60 + rank), in scaled integers
  const fused = new Map();
  for (let rank = 0; rank < byBm25All.length; rank++) {
    const d = byBm25All[rank];
    fused.set(d, (fused.get(d) || 0) + Math.floor(1000000 / (60 + rank + 1)));
  }
  for (let rank = 0; rank < byDenseAll.length; rank++) {
    const d = byDenseAll[rank];
    fused.set(d, (fused.get(d) || 0) + Math.floor(1000000 / (60 + rank + 1)));
  }
  const fusedList = [];
  for (const [d, score] of fused) fusedList.push([score, d]);
  fusedList.sort((x, y) => (x[0] !== y[0] ? y[0] - x[0] : x[1] - y[1]));
  pHybrid += precision(fusedList.slice(0, K).map((pair) => pair[1]), topic);

  // rerank the fused shortlist with a query the first stage could not
  // have used: the original terms plus the commonest words among the
  // documents the first stage liked
  const top50 = fusedList.slice(0, 50).map((pair) => pair[1]);
  const tally = new Map();
  for (const d of top50.slice(0, K)) {
    for (const [w, count] of termFrequency[d]) tally.set(w, (tally.get(w) || 0) + count);
  }
  const ordered = [];
  for (const [w, count] of tally) ordered.push([-count, w]);
  ordered.sort((x, y) => (x[0] !== y[0] ? x[0] - y[0] : x[1] - y[1]));
  const expanded = terms.slice();
  for (const pair of ordered.slice(0, 5)) {
    if (!expanded.includes(pair[1])) expanded.push(pair[1]);
  }
  const rescored = top50.map((d) => [bm25(expanded, d), d]);
  pReranked += precision(ranked(rescored, K), topic);
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

const total = QUERIES * K;
console.log(
  N + " documents over " + TOPICS + " topics, " + QUERIES + " queries of " + TERMS +
    " terms, top " + K,
);
console.log("a document is relevant when it came from the query's topic");
console.log();
console.log("documents scored per query");
console.log("  full scan                " + padLeft(Math.floor(scannedAll / QUERIES), 8));
console.log("  inverted index           " + padLeft(Math.floor(scannedIndex / QUERIES), 8));
console.log();
console.log("ranking                     relevant in top " + K + " of " + total);
const table = [
  ["count the query terms", pCount],
  ["bm25", pBm25],
  ["dense vectors", pDense],
  ["hybrid, rank fusion", pHybrid],
  ["hybrid then reranked", pReranked],
];
for (const [name, value] of table) {
  const share = Math.floor((value * 1000) / total);
  console.log(
    "  " + pad(name, 24) + " " + padLeft(value, 7) + "   " +
      padLeft(Math.floor(share / 10), 3) + "." + (share % 10) + "%",
  );
}
console.log();
console.log(
  "bm25 and dense agreed on " + overlap + " of their " + total + " top-" + K + " picks, so " +
    Math.floor(((total - overlap) * 100) / total) + "% of",
);
console.log("what each one found, the other one missed.");
console.log();
console.log(
  [
    "Four things are measured here and one of them is not what the",
    "folklore says.",
    "",
    "The inverted index is the uncontroversial part. Scoring only the",
    "documents that contain at least one query term means 574 documents",
    "per query instead of 2000. That is the whole reason a posting list",
    "exists: a hash map from term to the documents containing it, so",
    "scoring is proportional to the documents that could possibly match",
    "rather than to the collection.",
    "",
    "BM25 against plain term counting is 96.6% to 86.7%, and the ten",
    "points come from two corrections. Inverse document frequency",
    "downweights a term that appears everywhere, because matching a common",
    "word says almost nothing. Length normalisation stops a long document",
    "winning merely by containing more words. Counting matches has neither,",
    "so it rewards long documents stuffed with common terms -- which is",
    "exactly the failure people notice in naive search.",
    "",
    "Now the result that does not follow the script. Fusing BM25 with the",
    "dense ranking scored 88.7%, which is worse than BM25 alone at 96.6%.",
    "Hybrid retrieval is usually described as strictly better, and here it",
    "is not, for a plain reason: the dense ranking is weak on this corpus",
    "at 41.2%, and reciprocal rank fusion has no idea that one of its",
    "inputs is bad. It weights the two lists equally because that is what",
    "it was told to do. Fusion combines rankings; it does not judge them.",
    "If one retriever is much worse than the other, fusion drags the good",
    "one down, and the fix is a weight -- which has to be tuned on measured",
    "data, not assumed.",
    "",
    "The last row is why the pipeline has a second stage at all. Reranking",
    "the fused top fifty with an expanded query -- the original terms plus",
    "the commonest words among the documents the first stage liked -- scores",
    "100%. The first stage was mediocre at ordering, but it was good at",
    "gathering: the right documents were somewhere in its fifty, and a",
    "better scorer that would be far too slow to run on two thousand",
    "documents is perfectly affordable on fifty.",
    "",
    "That is the shape of every production retrieval system, and it is the",
    "same shape as the reranking step in the quantisation lesson. A cheap,",
    "broad first stage whose only job is to put the answer somewhere in the",
    "shortlist, and an expensive, accurate second stage that only ever sees",
    "the shortlist. Recall first, precision second.",
  ].join("\\n"),
);
`,
            },
            {
              lang: "typescript",
              code: `// A retrieval pipeline, measured end to end: an inverted index to shortlist,
// BM25 to score, a dense index for the words the query did not use, and
// fusion to put the two together.

type Pair = [number, number];

const VOCAB = 200;
const TOPICS = 40;
const CORE = 8; // words that make a topic what it is
const N = 2000;
const DOC_LENGTH = 30;
const QUERIES = 200;
const TERMS = 3;
const DIM = 8;
const K = 10;

function log2Milli(valueMilli: number): number {
  // floor(1000 * log2(valueMilli / 1000)), integers only, because a
  // logarithm formats differently in every language and this has to
  // print the same everywhere.
  if (valueMilli < 1000) return 0;
  let whole = 0;
  let y = valueMilli;
  while (y >= 2000) {
    y = Math.floor(y / 2);
    whole += 1;
  }
  let frac = 0;
  for (let i = 0; i < 10; i++) {
    y = Math.floor((y * y) / 1000);
    frac *= 2;
    if (y >= 2000) {
      y = Math.floor(y / 2);
      frac += 1;
    }
  }
  return whole * 1000 + Math.floor((frac * 1000) / 1024);
}

// The same linear congruential generator in every language, so the corpus
// below is the same corpus whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 4480021n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

// --- a corpus with topics in it -----------------------------------------

const topicWords: number[][] = [];
const topicCentres: number[][] = [];
for (let t = 0; t < TOPICS; t++) {
  const words: number[] = [];
  for (let c = 0; c < CORE; c++) words.push(rand(VOCAB));
  topicWords.push(words);
  const centre: number[] = [];
  for (let j = 0; j < DIM; j++) centre.push(rand(100));
  topicCentres.push(centre);
}

const docTopic: number[] = [];
const docs: number[][] = [];
const docVectors: number[][] = [];
for (let d = 0; d < N; d++) {
  const t = rand(TOPICS);
  docTopic.push(t);
  const words: number[] = [];
  for (let w = 0; w < DOC_LENGTH; w++) {
    if (rand(10) < 4) words.push(topicWords[t][rand(CORE)]);
    else words.push(rand(VOCAB));
  }
  docs.push(words);
  const v: number[] = [];
  for (let j = 0; j < DIM; j++) v.push(topicCentres[t][j] + rand(81) - 40);
  docVectors.push(v);
}

const queryTopic: number[] = [];
const queries: number[][] = [];
const queryVectors: number[][] = [];
for (let q = 0; q < QUERIES; q++) {
  const t = rand(TOPICS);
  queryTopic.push(t);
  const terms: number[] = [];
  for (let i = 0; i < TERMS; i++) terms.push(topicWords[t][rand(CORE)]);
  queries.push(terms);
  const v: number[] = [];
  for (let j = 0; j < DIM; j++) v.push(topicCentres[t][j] + rand(81) - 40);
  queryVectors.push(v);
}

// --- the inverted index -------------------------------------------------

const postings = new Map<number, number[]>();
const termFrequency: Array<Map<number, number>> = [];
const lengths: number[] = [];
for (let d = 0; d < N; d++) {
  const counts = new Map<number, number>();
  for (const w of docs[d]) counts.set(w, (counts.get(w) || 0) + 1);
  termFrequency.push(counts);
  lengths.push(docs[d].length);
  for (const w of counts.keys()) {
    if (!postings.has(w)) postings.set(w, []);
    postings.get(w)!.push(d);
  }
}

let totalLength = 0;
for (const length of lengths) totalLength += length;
const averageLength = Math.floor(totalLength / N);

function shortlist(terms: number[]): number[] {
  const seen = new Map<number, boolean>();
  const out: number[] = [];
  for (const term of terms) {
    if (postings.has(term)) {
      for (const d of postings.get(term)!) {
        if (!seen.has(d)) {
          seen.set(d, true);
          out.push(d);
        }
      }
    }
  }
  out.sort((a, b) => a - b);
  return out;
}

// --- three ways to score ------------------------------------------------

function countMatches(terms: number[], d: number): number {
  let total = 0;
  for (const term of terms) total += termFrequency[d].get(term) || 0;
  return total;
}

const K1 = 1500; // 1.5, in thousandths
const B = 750; // 0.75

function bm25(terms: number[], d: number): number {
  let total = 0;
  for (const term of terms) {
    const tf = termFrequency[d].get(term) || 0;
    if (tf === 0) continue;
    const df = postings.get(term)!.length;
    const ratio = Math.floor(((2 * N - 2 * df + 1) * 1000) / (2 * df + 1)) + 1000;
    const idf = log2Milli(ratio);
    const top = tf * (K1 + 1000);
    const norm = 1000 - B + Math.floor((B * lengths[d]) / averageLength);
    const bottom = tf * 1000 + Math.floor((K1 * norm) / 1000);
    total += Math.floor((idf * top) / bottom);
  }
  return total;
}

function denseScore(q: number, d: number): number {
  // smaller distance is better, so negate to make bigger better
  let total = 0;
  for (let j = 0; j < DIM; j++) {
    const diff = queryVectors[q][j] - docVectors[d][j];
    total += diff * diff;
  }
  return -total;
}

function ranked(scores: Pair[], limit: number): number[] {
  const order: Pair[] = scores.map((pair) => [-pair[0], pair[1]]);
  order.sort((x, y) => (x[0] !== y[0] ? x[0] - y[0] : x[1] - y[1]));
  return order.slice(0, limit).map((pair) => pair[1]);
}

function precision(found: number[], topic: number): number {
  let hit = 0;
  for (const d of found) {
    if (docTopic[d] === topic) hit += 1;
  }
  return hit;
}

// --- run everything -----------------------------------------------------

let scannedAll = 0;
let scannedIndex = 0;
let pCount = 0;
let pBm25 = 0;
let pDense = 0;
let pHybrid = 0;
let pReranked = 0;
let overlap = 0;
for (let q = 0; q < QUERIES; q++) {
  const terms = queries[q];
  const topic = queryTopic[q];
  const candidates = shortlist(terms);
  scannedAll += N;
  scannedIndex += candidates.length;

  const byCount = ranked(candidates.map((d): Pair => [countMatches(terms, d), d]), K);
  const byBm25All = ranked(candidates.map((d): Pair => [bm25(terms, d), d]), 50);
  const everything: Pair[] = [];
  for (let d = 0; d < N; d++) everything.push([denseScore(q, d), d]);
  const byDenseAll = ranked(everything, 50);
  const byBm25 = byBm25All.slice(0, K);
  const byDense = byDenseAll.slice(0, K);

  pCount += precision(byCount, topic);
  pBm25 += precision(byBm25, topic);
  pDense += precision(byDense, topic);
  const shared = new Map<number, boolean>();
  for (const d of byBm25) shared.set(d, true);
  for (const d of byDense) {
    if (shared.has(d)) overlap += 1;
  }

  // reciprocal rank fusion: 1/(60 + rank), in scaled integers
  const fused = new Map<number, number>();
  for (let rank = 0; rank < byBm25All.length; rank++) {
    const d = byBm25All[rank];
    fused.set(d, (fused.get(d) || 0) + Math.floor(1000000 / (60 + rank + 1)));
  }
  for (let rank = 0; rank < byDenseAll.length; rank++) {
    const d = byDenseAll[rank];
    fused.set(d, (fused.get(d) || 0) + Math.floor(1000000 / (60 + rank + 1)));
  }
  const fusedList: Pair[] = [];
  for (const [d, score] of fused) fusedList.push([score, d]);
  fusedList.sort((x, y) => (x[0] !== y[0] ? y[0] - x[0] : x[1] - y[1]));
  pHybrid += precision(fusedList.slice(0, K).map((pair) => pair[1]), topic);

  // rerank the fused shortlist with a query the first stage could not
  // have used: the original terms plus the commonest words among the
  // documents the first stage liked
  const top50 = fusedList.slice(0, 50).map((pair) => pair[1]);
  const tally = new Map<number, number>();
  for (const d of top50.slice(0, K)) {
    for (const [w, count] of termFrequency[d]) tally.set(w, (tally.get(w) || 0) + count);
  }
  const ordered: Pair[] = [];
  for (const [w, count] of tally) ordered.push([-count, w]);
  ordered.sort((x, y) => (x[0] !== y[0] ? x[0] - y[0] : x[1] - y[1]));
  const expanded = terms.slice();
  for (const pair of ordered.slice(0, 5)) {
    if (!expanded.includes(pair[1])) expanded.push(pair[1]);
  }
  const rescored = top50.map((d): Pair => [bm25(expanded, d), d]);
  pReranked += precision(ranked(rescored, K), topic);
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

const total = QUERIES * K;
console.log(
  N + " documents over " + TOPICS + " topics, " + QUERIES + " queries of " + TERMS +
    " terms, top " + K,
);
console.log("a document is relevant when it came from the query's topic");
console.log();
console.log("documents scored per query");
console.log("  full scan                " + padLeft(Math.floor(scannedAll / QUERIES), 8));
console.log("  inverted index           " + padLeft(Math.floor(scannedIndex / QUERIES), 8));
console.log();
console.log("ranking                     relevant in top " + K + " of " + total);
const table: Array<[string, number]> = [
  ["count the query terms", pCount],
  ["bm25", pBm25],
  ["dense vectors", pDense],
  ["hybrid, rank fusion", pHybrid],
  ["hybrid then reranked", pReranked],
];
for (const [name, value] of table) {
  const share = Math.floor((value * 1000) / total);
  console.log(
    "  " + pad(name, 24) + " " + padLeft(value, 7) + "   " +
      padLeft(Math.floor(share / 10), 3) + "." + (share % 10) + "%",
  );
}
console.log();
console.log(
  "bm25 and dense agreed on " + overlap + " of their " + total + " top-" + K + " picks, so " +
    Math.floor(((total - overlap) * 100) / total) + "% of",
);
console.log("what each one found, the other one missed.");
console.log();
console.log(
  [
    "Four things are measured here and one of them is not what the",
    "folklore says.",
    "",
    "The inverted index is the uncontroversial part. Scoring only the",
    "documents that contain at least one query term means 574 documents",
    "per query instead of 2000. That is the whole reason a posting list",
    "exists: a hash map from term to the documents containing it, so",
    "scoring is proportional to the documents that could possibly match",
    "rather than to the collection.",
    "",
    "BM25 against plain term counting is 96.6% to 86.7%, and the ten",
    "points come from two corrections. Inverse document frequency",
    "downweights a term that appears everywhere, because matching a common",
    "word says almost nothing. Length normalisation stops a long document",
    "winning merely by containing more words. Counting matches has neither,",
    "so it rewards long documents stuffed with common terms -- which is",
    "exactly the failure people notice in naive search.",
    "",
    "Now the result that does not follow the script. Fusing BM25 with the",
    "dense ranking scored 88.7%, which is worse than BM25 alone at 96.6%.",
    "Hybrid retrieval is usually described as strictly better, and here it",
    "is not, for a plain reason: the dense ranking is weak on this corpus",
    "at 41.2%, and reciprocal rank fusion has no idea that one of its",
    "inputs is bad. It weights the two lists equally because that is what",
    "it was told to do. Fusion combines rankings; it does not judge them.",
    "If one retriever is much worse than the other, fusion drags the good",
    "one down, and the fix is a weight -- which has to be tuned on measured",
    "data, not assumed.",
    "",
    "The last row is why the pipeline has a second stage at all. Reranking",
    "the fused top fifty with an expanded query -- the original terms plus",
    "the commonest words among the documents the first stage liked -- scores",
    "100%. The first stage was mediocre at ordering, but it was good at",
    "gathering: the right documents were somewhere in its fifty, and a",
    "better scorer that would be far too slow to run on two thousand",
    "documents is perfectly affordable on fifty.",
    "",
    "That is the shape of every production retrieval system, and it is the",
    "same shape as the reranking step in the quantisation lesson. A cheap,",
    "broad first stage whose only job is to put the answer somewhere in the",
    "shortlist, and an expensive, accurate second stage that only ever sees",
    "the shortlist. Recall first, precision second.",
  ].join("\\n"),
);
`,
            },
            {
              lang: "java",
              code: `// A retrieval pipeline, measured end to end: an inverted index to shortlist,
// BM25 to score, a dense index for the words the query did not use, and
// fusion to put the two together.

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Main {
  static final int VOCAB = 200;
  static final int TOPICS = 40;
  static final int CORE = 8; // words that make a topic what it is
  static final int N = 2000;
  static final int DOC_LENGTH = 30;
  static final int QUERIES = 200;
  static final int TERMS = 3;
  static final int DIM = 8;
  static final int K = 10;
  static final int K1 = 1500; // 1.5, in thousandths
  static final int B = 750; // 0.75

  static long log2Milli(long valueMilli) {
    // floor(1000 * log2(valueMilli / 1000)), integers only, because a
    // logarithm formats differently in every language and this has to
    // print the same everywhere.
    if (valueMilli < 1000) {
      return 0;
    }
    long whole = 0;
    long y = valueMilli;
    while (y >= 2000) {
      y /= 2;
      whole += 1;
    }
    long frac = 0;
    for (int i = 0; i < 10; i++) {
      y = y * y / 1000;
      frac *= 2;
      if (y >= 2000) {
        y /= 2;
        frac += 1;
      }
    }
    return whole * 1000 + frac * 1000 / 1024;
  }

  // The same linear congruential generator in every language, so the corpus
  // below is the same corpus whichever translation is run.
  static long seed = 4480021L;

  static int rand(int n) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return (int) (seed / 65536L % n);
  }

  static int[] docTopic = new int[N];
  static int[][] docs = new int[N][DOC_LENGTH];
  static long[][] docVectors = new long[N][DIM];
  static int[] queryTopic = new int[QUERIES];
  static int[][] queries = new int[QUERIES][TERMS];
  static long[][] queryVectors = new long[QUERIES][DIM];
  static Map<Integer, List<Integer>> postings = new HashMap<>();
  static List<Map<Integer, Integer>> termFrequency = new ArrayList<>();
  static int[] lengths = new int[N];
  static int averageLength = 0;

  static List<Integer> shortlist(int[] terms) {
    Map<Integer, Boolean> seen = new HashMap<>();
    List<Integer> out = new ArrayList<>();
    for (int term : terms) {
      List<Integer> list = postings.get(term);
      if (list != null) {
        for (int d : list) {
          if (!seen.containsKey(d)) {
            seen.put(d, true);
            out.add(d);
          }
        }
      }
    }
    out.sort(null);
    return out;
  }

  static long countMatches(int[] terms, int d) {
    long total = 0;
    for (int term : terms) {
      total += termFrequency.get(d).getOrDefault(term, 0);
    }
    return total;
  }

  static long bm25(List<Integer> terms, int d) {
    long total = 0;
    for (int term : terms) {
      long tf = termFrequency.get(d).getOrDefault(term, 0);
      if (tf == 0) {
        continue;
      }
      long df = postings.get(term).size();
      long ratio = (2L * N - 2 * df + 1) * 1000 / (2 * df + 1) + 1000;
      long idf = log2Milli(ratio);
      long top = tf * (K1 + 1000);
      long norm = 1000 - B + (long) B * lengths[d] / averageLength;
      long bottom = tf * 1000 + (long) K1 * norm / 1000;
      total += idf * top / bottom;
    }
    return total;
  }

  static List<Integer> asList(int[] terms) {
    List<Integer> out = new ArrayList<>();
    for (int term : terms) {
      out.add(term);
    }
    return out;
  }

  static long denseScore(int q, int d) {
    // smaller distance is better, so negate to make bigger better
    long total = 0;
    for (int j = 0; j < DIM; j++) {
      long diff = queryVectors[q][j] - docVectors[d][j];
      total += diff * diff;
    }
    return -total;
  }

  static class Scored {
    long score;
    int index;

    Scored(long score, int index) {
      this.score = score;
      this.index = index;
    }
  }

  static List<Integer> ranked(List<Scored> scores, int limit) {
    List<Scored> order = new ArrayList<>(scores);
    order.sort(
        (x, y) -> x.score != y.score ? Long.compare(y.score, x.score) : x.index - y.index);
    List<Integer> out = new ArrayList<>();
    for (int i = 0; i < limit && i < order.size(); i++) {
      out.add(order.get(i).index);
    }
    return out;
  }

  static int precision(List<Integer> found, int topic) {
    int hit = 0;
    for (int d : found) {
      if (docTopic[d] == topic) {
        hit += 1;
      }
    }
    return hit;
  }

  public static void main(String[] args) {
    int[][] topicWords = new int[TOPICS][CORE];
    long[][] topicCentres = new long[TOPICS][DIM];
    for (int t = 0; t < TOPICS; t++) {
      for (int c = 0; c < CORE; c++) {
        topicWords[t][c] = rand(VOCAB);
      }
      for (int j = 0; j < DIM; j++) {
        topicCentres[t][j] = rand(100);
      }
    }

    for (int d = 0; d < N; d++) {
      int t = rand(TOPICS);
      docTopic[d] = t;
      for (int w = 0; w < DOC_LENGTH; w++) {
        if (rand(10) < 4) {
          docs[d][w] = topicWords[t][rand(CORE)];
        } else {
          docs[d][w] = rand(VOCAB);
        }
      }
      for (int j = 0; j < DIM; j++) {
        docVectors[d][j] = topicCentres[t][j] + rand(81) - 40;
      }
    }
    for (int q = 0; q < QUERIES; q++) {
      int t = rand(TOPICS);
      queryTopic[q] = t;
      for (int i = 0; i < TERMS; i++) {
        queries[q][i] = topicWords[t][rand(CORE)];
      }
      for (int j = 0; j < DIM; j++) {
        queryVectors[q][j] = topicCentres[t][j] + rand(81) - 40;
      }
    }

    long totalLength = 0;
    for (int d = 0; d < N; d++) {
      Map<Integer, Integer> counts = new HashMap<>();
      for (int w : docs[d]) {
        counts.put(w, counts.getOrDefault(w, 0) + 1);
      }
      termFrequency.add(counts);
      lengths[d] = docs[d].length;
      totalLength += lengths[d];
      for (int w : counts.keySet()) {
        postings.computeIfAbsent(w, key -> new ArrayList<>()).add(d);
      }
    }
    for (List<Integer> list : postings.values()) {
      list.sort(null);
    }
    averageLength = (int) (totalLength / N);

    long scannedAll = 0;
    long scannedIndex = 0;
    long pCount = 0;
    long pBm25 = 0;
    long pDense = 0;
    long pHybrid = 0;
    long pReranked = 0;
    long overlap = 0;
    for (int q = 0; q < QUERIES; q++) {
      int[] terms = queries[q];
      int topic = queryTopic[q];
      List<Integer> candidates = shortlist(terms);
      scannedAll += N;
      scannedIndex += candidates.size();

      List<Scored> counted = new ArrayList<>();
      List<Scored> scoredBm25 = new ArrayList<>();
      for (int d : candidates) {
        counted.add(new Scored(countMatches(terms, d), d));
        scoredBm25.add(new Scored(bm25(asList(terms), d), d));
      }
      List<Scored> scoredDense = new ArrayList<>();
      for (int d = 0; d < N; d++) {
        scoredDense.add(new Scored(denseScore(q, d), d));
      }
      List<Integer> byCount = ranked(counted, K);
      List<Integer> byBm25All = ranked(scoredBm25, 50);
      List<Integer> byDenseAll = ranked(scoredDense, 50);
      List<Integer> byBm25 = byBm25All.subList(0, Math.min(K, byBm25All.size()));
      List<Integer> byDense = byDenseAll.subList(0, Math.min(K, byDenseAll.size()));

      pCount += precision(byCount, topic);
      pBm25 += precision(byBm25, topic);
      pDense += precision(byDense, topic);
      Map<Integer, Boolean> shared = new HashMap<>();
      for (int d : byBm25) {
        shared.put(d, true);
      }
      for (int d : byDense) {
        if (shared.containsKey(d)) {
          overlap += 1;
        }
      }

      // reciprocal rank fusion: 1/(60 + rank), in scaled integers
      Map<Integer, Long> fused = new HashMap<>();
      for (int rank = 0; rank < byBm25All.size(); rank++) {
        int d = byBm25All.get(rank);
        fused.put(d, fused.getOrDefault(d, 0L) + 1000000L / (60 + rank + 1));
      }
      for (int rank = 0; rank < byDenseAll.size(); rank++) {
        int d = byDenseAll.get(rank);
        fused.put(d, fused.getOrDefault(d, 0L) + 1000000L / (60 + rank + 1));
      }
      List<Scored> fusedList = new ArrayList<>();
      for (Map.Entry<Integer, Long> pair : fused.entrySet()) {
        fusedList.add(new Scored(pair.getValue(), pair.getKey()));
      }
      List<Integer> fusedOrder = ranked(fusedList, fusedList.size());
      pHybrid += precision(fusedOrder.subList(0, Math.min(K, fusedOrder.size())), topic);

      // rerank the fused shortlist with a query the first stage could not
      // have used: the original terms plus the commonest words among the
      // documents the first stage liked
      List<Integer> top50 = fusedOrder.subList(0, Math.min(50, fusedOrder.size()));
      Map<Integer, Integer> tally = new HashMap<>();
      for (int i = 0; i < K && i < top50.size(); i++) {
        for (Map.Entry<Integer, Integer> pair : termFrequency.get(top50.get(i)).entrySet()) {
          tally.put(pair.getKey(), tally.getOrDefault(pair.getKey(), 0) + pair.getValue());
        }
      }
      List<Scored> ordered = new ArrayList<>();
      for (Map.Entry<Integer, Integer> pair : tally.entrySet()) {
        ordered.add(new Scored(pair.getValue(), pair.getKey()));
      }
      List<Integer> commonest = ranked(ordered, ordered.size());
      List<Integer> expanded = asList(terms);
      for (int i = 0; i < 5 && i < commonest.size(); i++) {
        if (!expanded.contains(commonest.get(i))) {
          expanded.add(commonest.get(i));
        }
      }
      List<Scored> rescored = new ArrayList<>();
      for (int d : top50) {
        rescored.add(new Scored(bm25(expanded, d), d));
      }
      pReranked += precision(ranked(rescored, K), topic);
    }

    long total = (long) QUERIES * K;
    System.out.printf(
        "%d documents over %d topics, %d queries of %d terms, top %d%n",
        N, TOPICS, QUERIES, TERMS, K);
    System.out.println("a document is relevant when it came from the query's topic");
    System.out.println();
    System.out.println("documents scored per query");
    System.out.printf("  full scan                %8d%n", scannedAll / QUERIES);
    System.out.printf("  inverted index           %8d%n", scannedIndex / QUERIES);
    System.out.println();
    System.out.printf("ranking                     relevant in top %d of %d%n", K, total);
    String[] names = {
      "count the query terms", "bm25", "dense vectors", "hybrid, rank fusion",
      "hybrid then reranked"
    };
    long[] values = {pCount, pBm25, pDense, pHybrid, pReranked};
    for (int i = 0; i < names.length; i++) {
      long share = values[i] * 1000 / total;
      System.out.printf(
          "  %-24s %7d   %3d.%d%%%n", names[i], values[i], share / 10, share % 10);
    }
    System.out.println();
    System.out.printf(
        "bm25 and dense agreed on %d of their %d top-%d picks, so %d%% of%n",
        overlap, total, K, (total - overlap) * 100 / total);
    System.out.println("what each one found, the other one missed.");
    System.out.println();
    System.out.println(String.join("\\n",
        "Four things are measured here and one of them is not what the",
        "folklore says.",
        "",
        "The inverted index is the uncontroversial part. Scoring only the",
        "documents that contain at least one query term means 574 documents",
        "per query instead of 2000. That is the whole reason a posting list",
        "exists: a hash map from term to the documents containing it, so",
        "scoring is proportional to the documents that could possibly match",
        "rather than to the collection.",
        "",
        "BM25 against plain term counting is 96.6% to 86.7%, and the ten",
        "points come from two corrections. Inverse document frequency",
        "downweights a term that appears everywhere, because matching a common",
        "word says almost nothing. Length normalisation stops a long document",
        "winning merely by containing more words. Counting matches has neither,",
        "so it rewards long documents stuffed with common terms -- which is",
        "exactly the failure people notice in naive search.",
        "",
        "Now the result that does not follow the script. Fusing BM25 with the",
        "dense ranking scored 88.7%, which is worse than BM25 alone at 96.6%.",
        "Hybrid retrieval is usually described as strictly better, and here it",
        "is not, for a plain reason: the dense ranking is weak on this corpus",
        "at 41.2%, and reciprocal rank fusion has no idea that one of its",
        "inputs is bad. It weights the two lists equally because that is what",
        "it was told to do. Fusion combines rankings; it does not judge them.",
        "If one retriever is much worse than the other, fusion drags the good",
        "one down, and the fix is a weight -- which has to be tuned on measured",
        "data, not assumed.",
        "",
        "The last row is why the pipeline has a second stage at all. Reranking",
        "the fused top fifty with an expanded query -- the original terms plus",
        "the commonest words among the documents the first stage liked -- scores",
        "100%. The first stage was mediocre at ordering, but it was good at",
        "gathering: the right documents were somewhere in its fifty, and a",
        "better scorer that would be far too slow to run on two thousand",
        "documents is perfectly affordable on fifty.",
        "",
        "That is the shape of every production retrieval system, and it is the",
        "same shape as the reranking step in the quantisation lesson. A cheap,",
        "broad first stage whose only job is to put the answer somewhere in the",
        "shortlist, and an expensive, accurate second stage that only ever sees",
        "the shortlist. Recall first, precision second."));
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// A retrieval pipeline, measured end to end: an inverted index to shortlist,
// BM25 to score, a dense index for the words the query did not use, and
// fusion to put the two together.

#include <algorithm>
#include <cstdio>
#include <iostream>
#include <map>
#include <set>
#include <string>
#include <vector>

static const int VOCAB = 200;
static const int TOPICS = 40;
static const int CORE = 8;  // words that make a topic what it is
static const int N = 2000;
static const int DOC_LENGTH = 30;
static const int QUERIES = 200;
static const int TERMS = 3;
static const int DIM = 8;
static const int K = 10;
static const int K1 = 1500;  // 1.5, in thousandths
static const int B = 750;    // 0.75

long long log2Milli(long long valueMilli) {
  // floor(1000 * log2(valueMilli / 1000)), integers only, because a
  // logarithm formats differently in every language and this has to
  // print the same everywhere.
  if (valueMilli < 1000) {
    return 0;
  }
  long long whole = 0;
  long long y = valueMilli;
  while (y >= 2000) {
    y /= 2;
    whole += 1;
  }
  long long frac = 0;
  for (int i = 0; i < 10; i++) {
    y = y * y / 1000;
    frac *= 2;
    if (y >= 2000) {
      y /= 2;
      frac += 1;
    }
  }
  return whole * 1000 + frac * 1000 / 1024;
}

// The same linear congruential generator in every language, so the corpus
// below is the same corpus whichever translation is run.
long long seed = 4480021LL;

int rand_below(int n) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return (int)(seed / 65536LL % n);
}

std::vector<int> docTopic;
std::vector<std::vector<int> > docs;
std::vector<std::vector<long long> > docVectors;
std::vector<int> queryTopic;
std::vector<std::vector<int> > queries;
std::vector<std::vector<long long> > queryVectors;
std::map<int, std::vector<int> > postings;
std::vector<std::map<int, int> > termFrequency;
std::vector<int> lengths;
int averageLength = 0;

std::vector<int> shortlist(const std::vector<int>& terms) {
  std::set<int> seen;
  std::vector<int> out;
  for (size_t t = 0; t < terms.size(); t++) {
    std::map<int, std::vector<int> >::iterator found = postings.find(terms[t]);
    if (found != postings.end()) {
      for (size_t i = 0; i < found->second.size(); i++) {
        int d = found->second[i];
        if (seen.count(d) == 0) {
          seen.insert(d);
          out.push_back(d);
        }
      }
    }
  }
  std::sort(out.begin(), out.end());
  return out;
}

long long countMatches(const std::vector<int>& terms, int d) {
  long long total = 0;
  for (size_t t = 0; t < terms.size(); t++) {
    std::map<int, int>::iterator found = termFrequency[d].find(terms[t]);
    if (found != termFrequency[d].end()) {
      total += found->second;
    }
  }
  return total;
}

long long bm25(const std::vector<int>& terms, int d) {
  long long total = 0;
  for (size_t t = 0; t < terms.size(); t++) {
    std::map<int, int>::iterator found = termFrequency[d].find(terms[t]);
    if (found == termFrequency[d].end()) {
      continue;
    }
    long long tf = found->second;
    long long df = (long long)postings[terms[t]].size();
    long long ratio = (2LL * N - 2 * df + 1) * 1000 / (2 * df + 1) + 1000;
    long long idf = log2Milli(ratio);
    long long top = tf * (K1 + 1000);
    long long norm = 1000 - B + (long long)B * lengths[d] / averageLength;
    long long bottom = tf * 1000 + (long long)K1 * norm / 1000;
    total += idf * top / bottom;
  }
  return total;
}

long long denseScore(int q, int d) {
  // smaller distance is better, so negate to make bigger better
  long long total = 0;
  for (int j = 0; j < DIM; j++) {
    long long diff = queryVectors[q][j] - docVectors[d][j];
    total += diff * diff;
  }
  return -total;
}

struct Scored {
  long long score;
  int index;
};

bool betterScored(const Scored& x, const Scored& y) {
  return x.score != y.score ? x.score > y.score : x.index < y.index;
}

std::vector<int> ranked(std::vector<Scored> scores, int limit) {
  std::sort(scores.begin(), scores.end(), betterScored);
  std::vector<int> out;
  for (int i = 0; i < limit && i < (int)scores.size(); i++) {
    out.push_back(scores[i].index);
  }
  return out;
}

int precision(const std::vector<int>& found, int topic) {
  int hit = 0;
  for (size_t i = 0; i < found.size(); i++) {
    if (docTopic[found[i]] == topic) {
      hit += 1;
    }
  }
  return hit;
}

int main() {
  std::vector<std::vector<int> > topicWords;
  std::vector<std::vector<long long> > topicCentres;
  for (int t = 0; t < TOPICS; t++) {
    std::vector<int> words;
    for (int c = 0; c < CORE; c++) {
      words.push_back(rand_below(VOCAB));
    }
    topicWords.push_back(words);
    std::vector<long long> centre;
    for (int j = 0; j < DIM; j++) {
      centre.push_back(rand_below(100));
    }
    topicCentres.push_back(centre);
  }

  for (int d = 0; d < N; d++) {
    int t = rand_below(TOPICS);
    docTopic.push_back(t);
    std::vector<int> words;
    for (int w = 0; w < DOC_LENGTH; w++) {
      if (rand_below(10) < 4) {
        words.push_back(topicWords[t][rand_below(CORE)]);
      } else {
        words.push_back(rand_below(VOCAB));
      }
    }
    docs.push_back(words);
    std::vector<long long> v;
    for (int j = 0; j < DIM; j++) {
      v.push_back(topicCentres[t][j] + rand_below(81) - 40);
    }
    docVectors.push_back(v);
  }
  for (int q = 0; q < QUERIES; q++) {
    int t = rand_below(TOPICS);
    queryTopic.push_back(t);
    std::vector<int> terms;
    for (int i = 0; i < TERMS; i++) {
      terms.push_back(topicWords[t][rand_below(CORE)]);
    }
    queries.push_back(terms);
    std::vector<long long> v;
    for (int j = 0; j < DIM; j++) {
      v.push_back(topicCentres[t][j] + rand_below(81) - 40);
    }
    queryVectors.push_back(v);
  }

  long long totalLength = 0;
  for (int d = 0; d < N; d++) {
    std::map<int, int> counts;
    for (size_t w = 0; w < docs[d].size(); w++) {
      counts[docs[d][w]] += 1;
    }
    termFrequency.push_back(counts);
    lengths.push_back((int)docs[d].size());
    totalLength += lengths[d];
    for (std::map<int, int>::iterator it = counts.begin(); it != counts.end(); ++it) {
      postings[it->first].push_back(d);
    }
  }
  averageLength = (int)(totalLength / N);

  long long scannedAll = 0;
  long long scannedIndex = 0;
  long long pCount = 0;
  long long pBm25 = 0;
  long long pDense = 0;
  long long pHybrid = 0;
  long long pReranked = 0;
  long long overlap = 0;
  for (int q = 0; q < QUERIES; q++) {
    const std::vector<int>& terms = queries[q];
    int topic = queryTopic[q];
    std::vector<int> candidates = shortlist(terms);
    scannedAll += N;
    scannedIndex += (long long)candidates.size();

    std::vector<Scored> counted;
    std::vector<Scored> scoredBm25;
    for (size_t i = 0; i < candidates.size(); i++) {
      int d = candidates[i];
      counted.push_back(Scored{countMatches(terms, d), d});
      scoredBm25.push_back(Scored{bm25(terms, d), d});
    }
    std::vector<Scored> scoredDense;
    for (int d = 0; d < N; d++) {
      scoredDense.push_back(Scored{denseScore(q, d), d});
    }
    std::vector<int> byCount = ranked(counted, K);
    std::vector<int> byBm25All = ranked(scoredBm25, 50);
    std::vector<int> byDenseAll = ranked(scoredDense, 50);
    std::vector<int> byBm25(byBm25All.begin(),
                            byBm25All.begin() + std::min((size_t)K, byBm25All.size()));
    std::vector<int> byDense(byDenseAll.begin(),
                             byDenseAll.begin() + std::min((size_t)K, byDenseAll.size()));

    pCount += precision(byCount, topic);
    pBm25 += precision(byBm25, topic);
    pDense += precision(byDense, topic);
    std::set<int> shared(byBm25.begin(), byBm25.end());
    for (size_t i = 0; i < byDense.size(); i++) {
      if (shared.count(byDense[i]) > 0) {
        overlap += 1;
      }
    }

    // reciprocal rank fusion: 1/(60 + rank), in scaled integers
    std::map<int, long long> fused;
    for (size_t rank = 0; rank < byBm25All.size(); rank++) {
      fused[byBm25All[rank]] += 1000000LL / (60 + (long long)rank + 1);
    }
    for (size_t rank = 0; rank < byDenseAll.size(); rank++) {
      fused[byDenseAll[rank]] += 1000000LL / (60 + (long long)rank + 1);
    }
    std::vector<Scored> fusedList;
    for (std::map<int, long long>::iterator it = fused.begin(); it != fused.end(); ++it) {
      fusedList.push_back(Scored{it->second, it->first});
    }
    std::vector<int> fusedOrder = ranked(fusedList, (int)fusedList.size());
    std::vector<int> hybridTop(fusedOrder.begin(),
                               fusedOrder.begin() + std::min((size_t)K, fusedOrder.size()));
    pHybrid += precision(hybridTop, topic);

    // rerank the fused shortlist with a query the first stage could not
    // have used: the original terms plus the commonest words among the
    // documents the first stage liked
    std::vector<int> top50(fusedOrder.begin(),
                           fusedOrder.begin() + std::min((size_t)50, fusedOrder.size()));
    std::map<int, int> tally;
    for (int i = 0; i < K && i < (int)top50.size(); i++) {
      std::map<int, int>& counts = termFrequency[top50[i]];
      for (std::map<int, int>::iterator it = counts.begin(); it != counts.end(); ++it) {
        tally[it->first] += it->second;
      }
    }
    std::vector<Scored> ordered;
    for (std::map<int, int>::iterator it = tally.begin(); it != tally.end(); ++it) {
      ordered.push_back(Scored{it->second, it->first});
    }
    std::vector<int> commonest = ranked(ordered, (int)ordered.size());
    std::vector<int> expanded = terms;
    for (int i = 0; i < 5 && i < (int)commonest.size(); i++) {
      if (std::find(expanded.begin(), expanded.end(), commonest[i]) == expanded.end()) {
        expanded.push_back(commonest[i]);
      }
    }
    std::vector<Scored> rescored;
    for (size_t i = 0; i < top50.size(); i++) {
      rescored.push_back(Scored{bm25(expanded, top50[i]), top50[i]});
    }
    pReranked += precision(ranked(rescored, K), topic);
  }

  long long total = (long long)QUERIES * K;
  std::printf("%d documents over %d topics, %d queries of %d terms, top %d\\n", N, TOPICS,
              QUERIES, TERMS, K);
  std::printf("a document is relevant when it came from the query's topic\\n");
  std::printf("\\n");
  std::printf("documents scored per query\\n");
  std::printf("  full scan                %8lld\\n", scannedAll / QUERIES);
  std::printf("  inverted index           %8lld\\n", scannedIndex / QUERIES);
  std::printf("\\n");
  std::printf("ranking                     relevant in top %d of %lld\\n", K, total);
  const char* names[5] = {"count the query terms", "bm25", "dense vectors",
                          "hybrid, rank fusion", "hybrid then reranked"};
  long long values[5] = {pCount, pBm25, pDense, pHybrid, pReranked};
  for (int i = 0; i < 5; i++) {
    long long share = values[i] * 1000 / total;
    std::printf("  %-24s %7lld   %3lld.%lld%%\\n", names[i], values[i], share / 10, share % 10);
  }
  std::printf("\\n");
  std::printf("bm25 and dense agreed on %lld of their %lld top-%d picks, so %lld%% of\\n", overlap,
              total, K, (total - overlap) * 100 / total);
  std::printf("what each one found, the other one missed.\\n");
  std::printf("\\n");
    std::cout
        << "Four things are measured here and one of them is not what the" << "\\n"
        << "folklore says." << "\\n"
        << "" << "\\n"
        << "The inverted index is the uncontroversial part. Scoring only the" << "\\n"
        << "documents that contain at least one query term means 574 documents" << "\\n"
        << "per query instead of 2000. That is the whole reason a posting list" << "\\n"
        << "exists: a hash map from term to the documents containing it, so" << "\\n"
        << "scoring is proportional to the documents that could possibly match" << "\\n"
        << "rather than to the collection." << "\\n"
        << "" << "\\n"
        << "BM25 against plain term counting is 96.6% to 86.7%, and the ten" << "\\n"
        << "points come from two corrections. Inverse document frequency" << "\\n"
        << "downweights a term that appears everywhere, because matching a common" << "\\n"
        << "word says almost nothing. Length normalisation stops a long document" << "\\n"
        << "winning merely by containing more words. Counting matches has neither," << "\\n"
        << "so it rewards long documents stuffed with common terms -- which is" << "\\n"
        << "exactly the failure people notice in naive search." << "\\n"
        << "" << "\\n"
        << "Now the result that does not follow the script. Fusing BM25 with the" << "\\n"
        << "dense ranking scored 88.7%, which is worse than BM25 alone at 96.6%." << "\\n"
        << "Hybrid retrieval is usually described as strictly better, and here it" << "\\n"
        << "is not, for a plain reason: the dense ranking is weak on this corpus" << "\\n"
        << "at 41.2%, and reciprocal rank fusion has no idea that one of its" << "\\n"
        << "inputs is bad. It weights the two lists equally because that is what" << "\\n"
        << "it was told to do. Fusion combines rankings; it does not judge them." << "\\n"
        << "If one retriever is much worse than the other, fusion drags the good" << "\\n"
        << "one down, and the fix is a weight -- which has to be tuned on measured" << "\\n"
        << "data, not assumed." << "\\n"
        << "" << "\\n"
        << "The last row is why the pipeline has a second stage at all. Reranking" << "\\n"
        << "the fused top fifty with an expanded query -- the original terms plus" << "\\n"
        << "the commonest words among the documents the first stage liked -- scores" << "\\n"
        << "100%. The first stage was mediocre at ordering, but it was good at" << "\\n"
        << "gathering: the right documents were somewhere in its fifty, and a" << "\\n"
        << "better scorer that would be far too slow to run on two thousand" << "\\n"
        << "documents is perfectly affordable on fifty." << "\\n"
        << "" << "\\n"
        << "That is the shape of every production retrieval system, and it is the" << "\\n"
        << "same shape as the reranking step in the quantisation lesson. A cheap," << "\\n"
        << "broad first stage whose only job is to put the answer somewhere in the" << "\\n"
        << "shortlist, and an expensive, accurate second stage that only ever sees" << "\\n"
        << "the shortlist. Recall first, precision second." << "\\n"
        ;
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// A retrieval pipeline, measured end to end: an inverted index to shortlist,
// BM25 to score, a dense index for the words the query did not use, and
// fusion to put the two together.

use std::collections::BTreeMap;
use std::collections::HashSet;

const VOCAB: i64 = 200;
const TOPICS: usize = 40;
const CORE: i64 = 8; // words that make a topic what it is
const N: usize = 2000;
const DOC_LENGTH: usize = 30;
const QUERIES: usize = 200;
const TERMS: usize = 3;
const DIM: usize = 8;
const K: usize = 10;
const K1: i64 = 1500; // 1.5, in thousandths
const B: i64 = 750; // 0.75

fn log2_milli(value_milli: i64) -> i64 {
    // floor(1000 * log2(value_milli / 1000)), integers only, because a
    // logarithm formats differently in every language and this has to
    // print the same everywhere.
    if value_milli < 1000 {
        return 0;
    }
    let mut whole = 0;
    let mut y = value_milli;
    while y >= 2000 {
        y /= 2;
        whole += 1;
    }
    let mut frac = 0;
    for _ in 0..10 {
        y = y * y / 1000;
        frac *= 2;
        if y >= 2000 {
            y /= 2;
            frac += 1;
        }
    }
    whole * 1000 + frac * 1000 / 1024
}

// The same linear congruential generator in every language, so the corpus
// below is the same corpus whichever translation is run.
static mut SEED: i64 = 4480021;

fn rand_below(n: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % n
    }
}

struct Corpus {
    doc_topic: Vec<usize>,
    doc_vectors: Vec<Vec<i64>>,
    query_topic: Vec<usize>,
    queries: Vec<Vec<i64>>,
    query_vectors: Vec<Vec<i64>>,
    postings: BTreeMap<i64, Vec<usize>>,
    term_frequency: Vec<BTreeMap<i64, i64>>,
    lengths: Vec<i64>,
    average_length: i64,
}

fn shortlist(c: &Corpus, terms: &[i64]) -> Vec<usize> {
    let mut seen: HashSet<usize> = HashSet::new();
    let mut out: Vec<usize> = Vec::new();
    for term in terms {
        if let Some(list) = c.postings.get(term) {
            for &d in list {
                if seen.insert(d) {
                    out.push(d);
                }
            }
        }
    }
    out.sort();
    out
}

fn count_matches(c: &Corpus, terms: &[i64], d: usize) -> i64 {
    let mut total = 0;
    for term in terms {
        total += *c.term_frequency[d].get(term).unwrap_or(&0);
    }
    total
}

fn bm25(c: &Corpus, terms: &[i64], d: usize) -> i64 {
    let mut total = 0;
    for term in terms {
        let tf = *c.term_frequency[d].get(term).unwrap_or(&0);
        if tf == 0 {
            continue;
        }
        let df = c.postings[term].len() as i64;
        let ratio = (2 * N as i64 - 2 * df + 1) * 1000 / (2 * df + 1) + 1000;
        let idf = log2_milli(ratio);
        let top = tf * (K1 + 1000);
        let norm = 1000 - B + B * c.lengths[d] / c.average_length;
        let bottom = tf * 1000 + K1 * norm / 1000;
        total += idf * top / bottom;
    }
    total
}

fn dense_score(c: &Corpus, q: usize, d: usize) -> i64 {
    // smaller distance is better, so negate to make bigger better
    let mut total = 0;
    for j in 0..DIM {
        let diff = c.query_vectors[q][j] - c.doc_vectors[d][j];
        total += diff * diff;
    }
    -total
}

fn ranked(mut scores: Vec<(i64, usize)>, limit: usize) -> Vec<usize> {
    scores.sort_by(|x, y| y.0.cmp(&x.0).then(x.1.cmp(&y.1)));
    scores.iter().take(limit).map(|p| p.1).collect()
}

fn precision(c: &Corpus, found: &[usize], topic: usize) -> i64 {
    let mut hit = 0;
    for &d in found {
        if c.doc_topic[d] == topic {
            hit += 1;
        }
    }
    hit
}

fn main() {
    let mut topic_words: Vec<Vec<i64>> = Vec::new();
    let mut topic_centres: Vec<Vec<i64>> = Vec::new();
    for _ in 0..TOPICS {
        let mut words: Vec<i64> = Vec::new();
        for _ in 0..CORE {
            words.push(rand_below(VOCAB));
        }
        topic_words.push(words);
        let mut centre: Vec<i64> = Vec::new();
        for _ in 0..DIM {
            centre.push(rand_below(100));
        }
        topic_centres.push(centre);
    }

    let mut doc_topic: Vec<usize> = Vec::new();
    let mut docs: Vec<Vec<i64>> = Vec::new();
    let mut doc_vectors: Vec<Vec<i64>> = Vec::new();
    for _ in 0..N {
        let t = rand_below(TOPICS as i64) as usize;
        doc_topic.push(t);
        let mut words: Vec<i64> = Vec::new();
        for _ in 0..DOC_LENGTH {
            if rand_below(10) < 4 {
                words.push(topic_words[t][rand_below(CORE) as usize]);
            } else {
                words.push(rand_below(VOCAB));
            }
        }
        docs.push(words);
        let mut v: Vec<i64> = Vec::new();
        for j in 0..DIM {
            v.push(topic_centres[t][j] + rand_below(81) - 40);
        }
        doc_vectors.push(v);
    }
    let mut query_topic: Vec<usize> = Vec::new();
    let mut queries: Vec<Vec<i64>> = Vec::new();
    let mut query_vectors: Vec<Vec<i64>> = Vec::new();
    for _ in 0..QUERIES {
        let t = rand_below(TOPICS as i64) as usize;
        query_topic.push(t);
        let mut terms: Vec<i64> = Vec::new();
        for _ in 0..TERMS {
            terms.push(topic_words[t][rand_below(CORE) as usize]);
        }
        queries.push(terms);
        let mut v: Vec<i64> = Vec::new();
        for j in 0..DIM {
            v.push(topic_centres[t][j] + rand_below(81) - 40);
        }
        query_vectors.push(v);
    }

    let mut postings: BTreeMap<i64, Vec<usize>> = BTreeMap::new();
    let mut term_frequency: Vec<BTreeMap<i64, i64>> = Vec::new();
    let mut lengths: Vec<i64> = Vec::new();
    let mut total_length = 0;
    for d in 0..N {
        let mut counts: BTreeMap<i64, i64> = BTreeMap::new();
        for &w in docs[d].iter() {
            *counts.entry(w).or_insert(0) += 1;
        }
        for w in counts.keys() {
            postings.entry(*w).or_insert_with(Vec::new).push(d);
        }
        term_frequency.push(counts);
        lengths.push(docs[d].len() as i64);
        total_length += docs[d].len() as i64;
    }
    let average_length = total_length / N as i64;

    let c = Corpus {
        doc_topic,
        doc_vectors,
        query_topic,
        queries,
        query_vectors,
        postings,
        term_frequency,
        lengths,
        average_length,
    };

    let mut scanned_all: i64 = 0;
    let mut scanned_index: i64 = 0;
    let mut p_count: i64 = 0;
    let mut p_bm25: i64 = 0;
    let mut p_dense: i64 = 0;
    let mut p_hybrid: i64 = 0;
    let mut p_reranked: i64 = 0;
    let mut overlap: i64 = 0;
    for q in 0..QUERIES {
        let terms = c.queries[q].clone();
        let topic = c.query_topic[q];
        let candidates = shortlist(&c, &terms);
        scanned_all += N as i64;
        scanned_index += candidates.len() as i64;

        let counted: Vec<(i64, usize)> =
            candidates.iter().map(|&d| (count_matches(&c, &terms, d), d)).collect();
        let scored_bm25: Vec<(i64, usize)> =
            candidates.iter().map(|&d| (bm25(&c, &terms, d), d)).collect();
        let scored_dense: Vec<(i64, usize)> =
            (0..N).map(|d| (dense_score(&c, q, d), d)).collect();
        let by_count = ranked(counted, K);
        let by_bm25_all = ranked(scored_bm25, 50);
        let by_dense_all = ranked(scored_dense, 50);
        let by_bm25: Vec<usize> = by_bm25_all.iter().take(K).cloned().collect();
        let by_dense: Vec<usize> = by_dense_all.iter().take(K).cloned().collect();

        p_count += precision(&c, &by_count, topic);
        p_bm25 += precision(&c, &by_bm25, topic);
        p_dense += precision(&c, &by_dense, topic);
        let shared: HashSet<usize> = by_bm25.iter().cloned().collect();
        for d in by_dense.iter() {
            if shared.contains(d) {
                overlap += 1;
            }
        }

        // reciprocal rank fusion: 1/(60 + rank), in scaled integers
        let mut fused: BTreeMap<usize, i64> = BTreeMap::new();
        for (rank, &d) in by_bm25_all.iter().enumerate() {
            *fused.entry(d).or_insert(0) += 1000000 / (60 + rank as i64 + 1);
        }
        for (rank, &d) in by_dense_all.iter().enumerate() {
            *fused.entry(d).or_insert(0) += 1000000 / (60 + rank as i64 + 1);
        }
        let fused_list: Vec<(i64, usize)> = fused.iter().map(|(&d, &s)| (s, d)).collect();
        let fused_len = fused_list.len();
        let fused_order = ranked(fused_list, fused_len);
        let hybrid_top: Vec<usize> = fused_order.iter().take(K).cloned().collect();
        p_hybrid += precision(&c, &hybrid_top, topic);

        // rerank the fused shortlist with a query the first stage could not
        // have used: the original terms plus the commonest words among the
        // documents the first stage liked
        let top50: Vec<usize> = fused_order.iter().take(50).cloned().collect();
        let mut tally: BTreeMap<i64, i64> = BTreeMap::new();
        for &d in top50.iter().take(K) {
            for (&w, &count) in c.term_frequency[d].iter() {
                *tally.entry(w).or_insert(0) += count;
            }
        }
        let ordered: Vec<(i64, usize)> = tally.iter().map(|(&w, &n)| (n, w as usize)).collect();
        let ordered_len = ordered.len();
        let commonest = ranked(ordered, ordered_len);
        let mut expanded = terms.clone();
        for &w in commonest.iter().take(5) {
            if !expanded.contains(&(w as i64)) {
                expanded.push(w as i64);
            }
        }
        let rescored: Vec<(i64, usize)> =
            top50.iter().map(|&d| (bm25(&c, &expanded, d), d)).collect();
        p_reranked += precision(&c, &ranked(rescored, K), topic);
    }

    let total = (QUERIES * K) as i64;
    println!(
        "{} documents over {} topics, {} queries of {} terms, top {}",
        N, TOPICS, QUERIES, TERMS, K
    );
    println!("a document is relevant when it came from the query's topic");
    println!();
    println!("documents scored per query");
    println!("  full scan                {:>8}", scanned_all / QUERIES as i64);
    println!("  inverted index           {:>8}", scanned_index / QUERIES as i64);
    println!();
    println!("ranking                     relevant in top {} of {}", K, total);
    let names = [
        "count the query terms",
        "bm25",
        "dense vectors",
        "hybrid, rank fusion",
        "hybrid then reranked",
    ];
    let values = [p_count, p_bm25, p_dense, p_hybrid, p_reranked];
    for i in 0..5 {
        let share = values[i] * 1000 / total;
        println!("  {:<24} {:>7}   {:>3}.{}%", names[i], values[i], share / 10, share % 10);
    }
    println!();
    println!(
        "bm25 and dense agreed on {} of their {} top-{} picks, so {}% of",
        overlap,
        total,
        K,
        (total - overlap) * 100 / total
    );
    println!("what each one found, the other one missed.");
    println!();
    println!("{}", [
        "Four things are measured here and one of them is not what the",
        "folklore says.",
        "",
        "The inverted index is the uncontroversial part. Scoring only the",
        "documents that contain at least one query term means 574 documents",
        "per query instead of 2000. That is the whole reason a posting list",
        "exists: a hash map from term to the documents containing it, so",
        "scoring is proportional to the documents that could possibly match",
        "rather than to the collection.",
        "",
        "BM25 against plain term counting is 96.6% to 86.7%, and the ten",
        "points come from two corrections. Inverse document frequency",
        "downweights a term that appears everywhere, because matching a common",
        "word says almost nothing. Length normalisation stops a long document",
        "winning merely by containing more words. Counting matches has neither,",
        "so it rewards long documents stuffed with common terms -- which is",
        "exactly the failure people notice in naive search.",
        "",
        "Now the result that does not follow the script. Fusing BM25 with the",
        "dense ranking scored 88.7%, which is worse than BM25 alone at 96.6%.",
        "Hybrid retrieval is usually described as strictly better, and here it",
        "is not, for a plain reason: the dense ranking is weak on this corpus",
        "at 41.2%, and reciprocal rank fusion has no idea that one of its",
        "inputs is bad. It weights the two lists equally because that is what",
        "it was told to do. Fusion combines rankings; it does not judge them.",
        "If one retriever is much worse than the other, fusion drags the good",
        "one down, and the fix is a weight -- which has to be tuned on measured",
        "data, not assumed.",
        "",
        "The last row is why the pipeline has a second stage at all. Reranking",
        "the fused top fifty with an expanded query -- the original terms plus",
        "the commonest words among the documents the first stage liked -- scores",
        "100%. The first stage was mediocre at ordering, but it was good at",
        "gathering: the right documents were somewhere in its fifty, and a",
        "better scorer that would be far too slow to run on two thousand",
        "documents is perfectly affordable on fifty.",
        "",
        "That is the shape of every production retrieval system, and it is the",
        "same shape as the reranking step in the quantisation lesson. A cheap,",
        "broad first stage whose only job is to put the answer somewhere in the",
        "shortlist, and an expensive, accurate second stage that only ever sees",
        "the shortlist. Recall first, precision second.",
    ].join("\\n"));
}
`,
            },
            {
              lang: "go",
              code: `// A retrieval pipeline, measured end to end: an inverted index to shortlist,
// BM25 to score, a dense index for the words the query did not use, and
// fusion to put the two together.

package main

import (
	"fmt"
	"sort"
	"strings"
)

const vocab = 200
const topics = 40
const core = 8 // words that make a topic what it is
const n = 2000
const docLength = 30
const queryCount = 200
const terms = 3
const dim = 8
const k = 10
const k1 = 1500 // 1.5, in thousandths
const b = 750   // 0.75

func log2Milli(valueMilli int64) int64 {
	// floor(1000 * log2(valueMilli / 1000)), integers only, because a
	// logarithm formats differently in every language and this has to
	// print the same everywhere.
	if valueMilli < 1000 {
		return 0
	}
	var whole int64
	y := valueMilli
	for y >= 2000 {
		y /= 2
		whole++
	}
	var frac int64
	for i := 0; i < 10; i++ {
		y = y * y / 1000
		frac *= 2
		if y >= 2000 {
			y /= 2
			frac++
		}
	}
	return whole*1000 + frac*1000/1024
}

// The same linear congruential generator in every language, so the corpus
// below is the same corpus whichever translation is run.
var seed int64 = 4480021

func randBelow(limit int64) int64 {
	seed = (seed*1103515245 + 12345) % 2147483648
	return seed / 65536 % limit
}

var docTopic []int
var docs [][]int64
var docVectors [][]int64
var queryTopic []int
var queries [][]int64
var queryVectors [][]int64
var postings map[int64][]int
var termFrequency []map[int64]int64
var lengths []int64
var averageLength int64

func shortlist(query []int64) []int {
	seen := map[int]bool{}
	out := []int{}
	for _, term := range query {
		for _, d := range postings[term] {
			if !seen[d] {
				seen[d] = true
				out = append(out, d)
			}
		}
	}
	sort.Ints(out)
	return out
}

func countMatches(query []int64, d int) int64 {
	var total int64
	for _, term := range query {
		total += termFrequency[d][term]
	}
	return total
}

func bm25(query []int64, d int) int64 {
	var total int64
	for _, term := range query {
		tf := termFrequency[d][term]
		if tf == 0 {
			continue
		}
		df := int64(len(postings[term]))
		ratio := (2*int64(n)-2*df+1)*1000/(2*df+1) + 1000
		idf := log2Milli(ratio)
		top := tf * (k1 + 1000)
		norm := 1000 - int64(b) + int64(b)*lengths[d]/averageLength
		bottom := tf*1000 + int64(k1)*norm/1000
		total += idf * top / bottom
	}
	return total
}

func denseScore(q, d int) int64 {
	// smaller distance is better, so negate to make bigger better
	var total int64
	for j := 0; j < dim; j++ {
		diff := queryVectors[q][j] - docVectors[d][j]
		total += diff * diff
	}
	return -total
}

type scored struct {
	score int64
	index int
}

func ranked(scores []scored, limit int) []int {
	order := append([]scored{}, scores...)
	sort.Slice(order, func(x, y int) bool {
		if order[x].score != order[y].score {
			return order[x].score > order[y].score
		}
		return order[x].index < order[y].index
	})
	out := []int{}
	for i := 0; i < limit && i < len(order); i++ {
		out = append(out, order[i].index)
	}
	return out
}

func precision(found []int, topic int) int64 {
	var hit int64
	for _, d := range found {
		if docTopic[d] == topic {
			hit++
		}
	}
	return hit
}

func main() {
	topicWords := make([][]int64, topics)
	topicCentres := make([][]int64, topics)
	for t := 0; t < topics; t++ {
		words := make([]int64, core)
		for c := 0; c < core; c++ {
			words[c] = randBelow(vocab)
		}
		topicWords[t] = words
		centre := make([]int64, dim)
		for j := 0; j < dim; j++ {
			centre[j] = randBelow(100)
		}
		topicCentres[t] = centre
	}

	for d := 0; d < n; d++ {
		t := int(randBelow(topics))
		docTopic = append(docTopic, t)
		words := make([]int64, docLength)
		for w := 0; w < docLength; w++ {
			if randBelow(10) < 4 {
				words[w] = topicWords[t][randBelow(core)]
			} else {
				words[w] = randBelow(vocab)
			}
		}
		docs = append(docs, words)
		v := make([]int64, dim)
		for j := 0; j < dim; j++ {
			v[j] = topicCentres[t][j] + randBelow(81) - 40
		}
		docVectors = append(docVectors, v)
	}
	for q := 0; q < queryCount; q++ {
		t := int(randBelow(topics))
		queryTopic = append(queryTopic, t)
		query := make([]int64, terms)
		for i := 0; i < terms; i++ {
			query[i] = topicWords[t][randBelow(core)]
		}
		queries = append(queries, query)
		v := make([]int64, dim)
		for j := 0; j < dim; j++ {
			v[j] = topicCentres[t][j] + randBelow(81) - 40
		}
		queryVectors = append(queryVectors, v)
	}

	postings = map[int64][]int{}
	var totalLength int64
	for d := 0; d < n; d++ {
		counts := map[int64]int64{}
		for _, w := range docs[d] {
			counts[w]++
		}
		termFrequency = append(termFrequency, counts)
		lengths = append(lengths, int64(len(docs[d])))
		totalLength += int64(len(docs[d]))
		words := []int64{}
		for w := range counts {
			words = append(words, w)
		}
		sort.Slice(words, func(x, y int) bool { return words[x] < words[y] })
		for _, w := range words {
			postings[w] = append(postings[w], d)
		}
	}
	averageLength = totalLength / n

	var scannedAll int64
	var scannedIndex int64
	var pCount int64
	var pBm25 int64
	var pDense int64
	var pHybrid int64
	var pReranked int64
	var overlap int64
	for q := 0; q < queryCount; q++ {
		query := queries[q]
		topic := queryTopic[q]
		candidates := shortlist(query)
		scannedAll += n
		scannedIndex += int64(len(candidates))

		counted := []scored{}
		scoredBm25 := []scored{}
		for _, d := range candidates {
			counted = append(counted, scored{score: countMatches(query, d), index: d})
			scoredBm25 = append(scoredBm25, scored{score: bm25(query, d), index: d})
		}
		scoredDense := []scored{}
		for d := 0; d < n; d++ {
			scoredDense = append(scoredDense, scored{score: denseScore(q, d), index: d})
		}
		byCount := ranked(counted, k)
		byBm25All := ranked(scoredBm25, 50)
		byDenseAll := ranked(scoredDense, 50)
		byBm25 := byBm25All[:min(k, len(byBm25All))]
		byDense := byDenseAll[:min(k, len(byDenseAll))]

		pCount += precision(byCount, topic)
		pBm25 += precision(byBm25, topic)
		pDense += precision(byDense, topic)
		shared := map[int]bool{}
		for _, d := range byBm25 {
			shared[d] = true
		}
		for _, d := range byDense {
			if shared[d] {
				overlap++
			}
		}

		// reciprocal rank fusion: 1/(60 + rank), in scaled integers
		fused := map[int]int64{}
		for rank, d := range byBm25All {
			fused[d] += 1000000 / int64(60+rank+1)
		}
		for rank, d := range byDenseAll {
			fused[d] += 1000000 / int64(60+rank+1)
		}
		fusedList := []scored{}
		for d, s := range fused {
			fusedList = append(fusedList, scored{score: s, index: d})
		}
		fusedOrder := ranked(fusedList, len(fusedList))
		pHybrid += precision(fusedOrder[:min(k, len(fusedOrder))], topic)

		// rerank the fused shortlist with a query the first stage could not
		// have used: the original terms plus the commonest words among the
		// documents the first stage liked
		top50 := fusedOrder[:min(50, len(fusedOrder))]
		tally := map[int64]int64{}
		for _, d := range top50[:min(k, len(top50))] {
			for w, count := range termFrequency[d] {
				tally[w] += count
			}
		}
		ordered := []scored{}
		for w, count := range tally {
			ordered = append(ordered, scored{score: count, index: int(w)})
		}
		commonest := ranked(ordered, len(ordered))
		expanded := append([]int64{}, query...)
		for _, w := range commonest[:min(5, len(commonest))] {
			seen := false
			for _, have := range expanded {
				if have == int64(w) {
					seen = true
				}
			}
			if !seen {
				expanded = append(expanded, int64(w))
			}
		}
		rescored := []scored{}
		for _, d := range top50 {
			rescored = append(rescored, scored{score: bm25(expanded, d), index: d})
		}
		pReranked += precision(ranked(rescored, k), topic)
	}

	var total int64 = queryCount * k
	fmt.Printf("%d documents over %d topics, %d queries of %d terms, top %d\\n",
		n, topics, queryCount, terms, k)
	fmt.Println("a document is relevant when it came from the query's topic")
	fmt.Println()
	fmt.Println("documents scored per query")
	fmt.Printf("  full scan                %8d\\n", scannedAll/queryCount)
	fmt.Printf("  inverted index           %8d\\n", scannedIndex/queryCount)
	fmt.Println()
	fmt.Printf("ranking                     relevant in top %d of %d\\n", k, total)
	names := []string{"count the query terms", "bm25", "dense vectors",
		"hybrid, rank fusion", "hybrid then reranked"}
	values := []int64{pCount, pBm25, pDense, pHybrid, pReranked}
	for i, name := range names {
		share := values[i] * 1000 / total
		fmt.Printf("  %-24s %7d   %3d.%d%%\\n", name, values[i], share/10, share%10)
	}
	fmt.Println()
	fmt.Printf("bm25 and dense agreed on %d of their %d top-%d picks, so %d%% of\\n",
		overlap, total, k, (total-overlap)*100/total)
	fmt.Println("what each one found, the other one missed.")
	fmt.Println()
	fmt.Println(strings.Join([]string{
		"Four things are measured here and one of them is not what the",
		"folklore says.",
		"",
		"The inverted index is the uncontroversial part. Scoring only the",
		"documents that contain at least one query term means 574 documents",
		"per query instead of 2000. That is the whole reason a posting list",
		"exists: a hash map from term to the documents containing it, so",
		"scoring is proportional to the documents that could possibly match",
		"rather than to the collection.",
		"",
		"BM25 against plain term counting is 96.6% to 86.7%, and the ten",
		"points come from two corrections. Inverse document frequency",
		"downweights a term that appears everywhere, because matching a common",
		"word says almost nothing. Length normalisation stops a long document",
		"winning merely by containing more words. Counting matches has neither,",
		"so it rewards long documents stuffed with common terms -- which is",
		"exactly the failure people notice in naive search.",
		"",
		"Now the result that does not follow the script. Fusing BM25 with the",
		"dense ranking scored 88.7%, which is worse than BM25 alone at 96.6%.",
		"Hybrid retrieval is usually described as strictly better, and here it",
		"is not, for a plain reason: the dense ranking is weak on this corpus",
		"at 41.2%, and reciprocal rank fusion has no idea that one of its",
		"inputs is bad. It weights the two lists equally because that is what",
		"it was told to do. Fusion combines rankings; it does not judge them.",
		"If one retriever is much worse than the other, fusion drags the good",
		"one down, and the fix is a weight -- which has to be tuned on measured",
		"data, not assumed.",
		"",
		"The last row is why the pipeline has a second stage at all. Reranking",
		"the fused top fifty with an expanded query -- the original terms plus",
		"the commonest words among the documents the first stage liked -- scores",
		"100%. The first stage was mediocre at ordering, but it was good at",
		"gathering: the right documents were somewhere in its fifty, and a",
		"better scorer that would be far too slow to run on two thousand",
		"documents is perfectly affordable on fifty.",
		"",
		"That is the shape of every production retrieval system, and it is the",
		"same shape as the reranking step in the quantisation lesson. A cheap,",
		"broad first stage whose only job is to put the answer somewhere in the",
		"shortlist, and an expensive, accurate second stage that only ever sees",
		"the shortlist. Recall first, precision second.",
	}, "\\n"))
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "bm25",
      heading: "What BM25 corrects",
      body: [
        "Counting how many query terms a document contains scored 86.7%; BM25 scored 96.6%. The ten points come from two corrections, and both are worth being able to state.",
        "**Inverse document frequency.** A term appearing in almost every document tells you almost nothing when it matches, and a rare term tells you a great deal. BM25 weights each term by roughly the log of how rare it is, so matching a rare term dominates matching a common one. Counting has no such weighting, which is why naive search returns documents that happen to contain \"the\".",
        "**Length normalisation.** A long document contains more words, so it matches more query terms by accident. BM25 divides by a document's length relative to the average, so being long is no longer an advantage. Counting rewards it directly.",
        "There is a third, smaller correction: **saturating term frequency**. The tenth occurrence of a word in a document says much less than the second, so BM25's `tf` term flattens out rather than growing linearly. Counting treats the tenth occurrence as worth exactly as much as the first, which is the mechanism behind keyword stuffing.",
        "Worth noticing that the program computes BM25's logarithm in integer fixed point, for the reason the comment gives: a floating-point log formats differently in different languages and this table has to read identically in all of them. That is the same constraint that shapes every measured table in this track.",
      ],
      pitfalls: [
        {
          title: "Ranking by term count",
          body: "It rewards long documents stuffed with common words. The measured gap to BM25 is ten points of precision, and the failures are the ones users notice.",
        },
        {
          title: "Treating BM25's constants as universal",
          body: "k1 and b control the term-frequency saturation and the length normalisation. The usual 1.5 and 0.75 are defaults, not laws, and they are tuned on measured data.",
        },
        {
          title: "Assuming dense retrieval replaces lexical search",
          body: "In the measurement, BM25 and dense agreed on only 145 of 2,000 top-ten picks. They find different things, and the dense one was the weaker of the two here.",
        },
      ],
    },
    {
      id: "fusion",
      heading: "Fusion combines rankings; it does not judge them",
      body: [
        "Hybrid retrieval is normally described as strictly better than either half. The measurement here says otherwise, and the reason is worth understanding because it is not a quirk of this data.",
        "Reciprocal rank fusion adds `1/(60 + rank)` from each list. It uses only rank, never score, which makes it robust to the two systems' scores being on incomparable scales \u2014 that is its main virtue. But it also means it has no information about whether either list is any good, and it weights them equally because nothing told it not to.",
        "Here BM25 scores 96.6% and dense scores 41.2%. Fusing them scores 88.7% \u2014 the weak list drags the strong one down, exactly as an unweighted average of a good estimate and a bad one is worse than the good estimate.",
        "The fix is a weight, and the point is that **the weight has to come from measurement**. \"Add a dense retriever and fuse\" is not a design; the design is knowing how each retriever performs on your data and combining them accordingly. Where dense retrieval genuinely is strong \u2014 synonyms, paraphrase, queries whose words do not appear in the relevant document \u2014 fusion pays off, and the same measurement is what tells you so.",
        "The overlap number is the reason people try fusion at all, and it is real: BM25 and dense agreed on 145 of their 2,000 top-ten picks, so 92% of what each found, the other missed. That is a genuine complementarity. It just does not automatically survive being averaged.",
      ],
    },
    {
      id: "two-stages",
      heading: "Broad first, precise second",
      body: [
        "The last row of the table scores 100%, and the structure that produced it is the one to take away from this module.",
        "The fused ranking was mediocre at ordering \u2014 88.7%. But the right documents were somewhere in its top fifty. Rescoring those fifty with a better query \u2014 the original terms plus the commonest words among the documents the first stage liked, which is pseudo-relevance feedback \u2014 put them in the right order.",
        "The two stages are optimised for different things, and confusing them is the common design error:",
        "**First stage: recall.** Its only job is to make sure the answer is somewhere in the shortlist. It is allowed to be sloppy about order, and it has to be cheap because it looks at everything the index returns.",
        "**Second stage: precision.** It only ever sees the shortlist, so it can afford to be expensive \u2014 a cross-encoder that reads the query and document together, a full-precision distance, an expanded query. Fifty documents is a budget that permits almost anything.",
        "This is the same pattern as rescoring a quantised shortlist against full-precision vectors in the quantisation lesson, and it arrived there from compression rather than from search. **A cheap broad stage that must not lose the answer, and an expensive narrow stage that only sees what survived** \u2014 that is the shape, and it is the shape of essentially every production retrieval system.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does a search engine avoid scoring every document?",
      answer:
        "An inverted index: a hash map from term to the list of documents containing it. A query looks up its terms, unions or intersects the posting lists, and scores only those documents. In my measurement that was 574 documents per query instead of 2,000, and the ratio gets far better as the collection grows, because the posting lists depend on how common the query terms are rather than on how big the collection is.",
    },
    {
      question: "What does BM25 add over counting query term matches?",
      answer:
        "Two corrections worth about ten points of precision in my measurement -- 96.6% against 86.7%. Inverse document frequency: a term in almost every document says nothing when it matches, so BM25 weights by roughly the log of its rarity, and matching a rare term dominates. Length normalisation: a long document matches more terms by accident, so BM25 divides by length relative to the average. There is a third, smaller one -- term frequency saturates, so the tenth occurrence of a word counts much less than the second, which is what stops keyword stuffing from working.",
    },
    {
      question: "Is hybrid search always better than lexical or dense alone?",
      answer:
        "No, and my measurement is a counterexample. BM25 scored 96.6%, dense scored 41.2%, and reciprocal rank fusion of the two scored 88.7% -- worse than BM25 alone. Fusion uses only rank, which makes it robust to incomparable score scales, but it also means it has no idea one of its inputs is bad, and it weights them equally. Averaging a good estimate with a bad one is worse than the good estimate. The complementarity is real -- the two agreed on only 145 of 2,000 top-ten picks, so 92% of what each found the other missed -- but capturing it needs a weight, and the weight has to come from measurement rather than from the assumption that hybrid wins.",
    },
    {
      question: "How would you structure a retrieval system?",
      answer:
        "Two stages with different objectives. A broad first stage whose only job is recall -- get the answer somewhere into a shortlist of fifty or a few hundred -- which has to be cheap because it touches everything the index returns and is allowed to be sloppy about order. Then a precise second stage that only ever sees the shortlist and can therefore afford to be expensive: a cross-encoder, full-precision distances, an expanded query. In my measurement the fused first stage ordered badly at 88.7%, but the right documents were in its top fifty, and reranking those reached 100%. The same shape shows up in vector search, where a quantised index shortlists and full-precision vectors rescore -- cheap and broad, then expensive and narrow.",
    },
  ],
  takeaways: [
    "An inverted index is a hash map from term to posting list",
    "Measured: 574 documents scored per query instead of 2,000",
    "BM25 beats term counting 96.6% to 86.7% on idf and length normalisation",
    "Term frequency saturates, which is what defeats keyword stuffing",
    "Measured: fusing a strong ranking with a weak one scored worse than the strong one",
    "Rank fusion combines rankings and cannot judge them — the weight is yours to measure",
    "BM25 and dense agreed on 145 of 2,000 picks: real complementarity, not automatic gain",
    "First stage recall, second stage precision — the same shape as rescoring a quantised shortlist",
  ],
};
