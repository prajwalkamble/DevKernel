import type { Lesson } from "@/content/types";

export const tokenisationLesson: Lesson = {
  id: "dsa-gen-ai-tokenisation",
  slug: "tokenisation",
  moduleSlug: "algorithms-behind-gen-ai",
  title: "Tokenisation: Byte-Pair Encoding as a Greedy Merge",
  summary:
    "The first thing that happens to your prompt is a greedy loop over a frequency map. Measured: the greedy merge order is the best possible order on 2,687 of 3,000 corpora, and loses by up to 4 tokens on the rest.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Describe byte-pair encoding as a loop over a frequency map",
    "Explain why frequent strings become single tokens without any linguistics",
    "Measure how far the greedy merge order is from the optimal one",
    "Say why optimal is unavailable at real vocabulary sizes",
  ],
  sections: [
    {
      id: "what-a-token-is",
      heading: "What a token actually is",
      body: [
        "A language model does not read text. It reads a sequence of integers, and something has to turn one into the other. That something is a tokeniser, and the dominant one \u2014 used by GPT, Llama, Mistral and most others \u2014 is byte-pair encoding.",
        "The whole algorithm fits in a sentence: **count every adjacent pair of symbols in the corpus, merge the most frequent pair into a single new symbol, and repeat**. Start from individual bytes; stop when the vocabulary is as big as you wanted.",
        "There is no grammar in it, no dictionary, no notion of a word. It is a greedy loop over a hash map of pair counts, of exactly the kind that appears throughout this track. The reason it deserves a lesson is not that it is difficult \u2014 it is that a great deal follows from this one loop, including why the model charges you differently for `\" the\"` and `\" antidisestablishmentarianism\"`.",
      ],
    },
    {
      id: "running-it",
      heading: "Running it, and then checking the greedy step",
      body: [
        "The program below does two things. First it runs the merges on a four-word corpus and prints them, which is the algorithm in full. Then it asks the question this track always asks about a greedy algorithm: is the greedy choice actually the best one?",
        "That second question is answerable here because the merge budget can be made small. With three merges and a handful of candidate pairs, every possible merge sequence can be tried exhaustively, and the greedy result compared against the true minimum.",
      ],
      examples: [
        {
          id: "bpe-greedy-against-optimal",
          title: "The merges, then greedy against an exhaustive search over merge orders",
          lang: "python",
          code: `# Byte-pair encoding is a greedy merge over a frequency map. This measures
# how often the greedy order is the best order, against an exhaustive search
# over every merge sequence of the same length.

SEP = " "


def pair_counts(corpus):
    # corpus is a list of [symbols, freq]. Returns keys sorted, and counts.
    counts = {}
    for symbols, freq in corpus:
        for i in range(len(symbols) - 1):
            key = symbols[i] + SEP + symbols[i + 1]
            counts[key] = counts.get(key, 0) + freq
    keys = sorted(counts.keys())
    return keys, counts


def best_pair(corpus):
    keys, counts = pair_counts(corpus)
    if not keys:
        return ""
    best = keys[0]
    for key in keys:
        if counts[key] > counts[best]:
            best = key
    return best


def apply_merge(corpus, key):
    cut = key.index(SEP)
    left = key[:cut]
    right = key[cut + 1:]
    joined = left + right
    out = []
    for symbols, freq in corpus:
        fresh = []
        i = 0
        while i < len(symbols):
            if i + 1 < len(symbols) and symbols[i] == left and symbols[i + 1] == right:
                fresh.append(joined)
                i += 2
            else:
                fresh.append(symbols[i])
                i += 1
        out.append([fresh, freq])
    return out


def total_tokens(corpus):
    total = 0
    for symbols, freq in corpus:
        total += len(symbols) * freq
    return total


def greedy(corpus, rounds):
    steps = []
    work = corpus
    for _ in range(rounds):
        key = best_pair(work)
        if key == "":
            break
        work = apply_merge(work, key)
        steps.append([key, total_tokens(work)])
    return steps, total_tokens(work)


def exhaustive(corpus, rounds):
    if rounds == 0:
        return total_tokens(corpus)
    keys, _ = pair_counts(corpus)
    if not keys:
        return total_tokens(corpus)
    best = -1
    for key in keys:
        got = exhaustive(apply_merge(corpus, key), rounds - 1)
        if best < 0 or got < best:
            best = got
    return best


def show(corpus):
    parts = []
    for symbols, freq in corpus:
        parts.append("".join(symbols) + "x" + str(freq))
    return " ".join(parts)


demo = [
    [list("low"), 5],
    [list("lower"), 2],
    [list("newest"), 6],
    [list("widest"), 3],
]

print("a four-word corpus, %d words and %d characters in total"
      % (sum(f for _, f in demo), total_tokens(demo)))
print()
print("step  merged pair  new symbol  tokens left")
print("   0  --           --          %11d" % total_tokens(demo))
steps, _ = greedy(demo, 6)
for i in range(len(steps)):
    key = steps[i][0]
    cut = key.index(SEP)
    print("%4d  %-11s  %-10s  %11d"
          % (i + 1, key[:cut] + " + " + key[cut + 1:], key[:cut] + key[cut + 1:], steps[i][1]))
print()

# The same linear congruential generator in every language, so the random
# corpora below are the same corpora whichever translation is run.
seed = 20240607


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


ROUNDS = 3
TRIALS = 3000
matched = 0
worse = 0
worst_gap = 0
first_loss = ""
for _ in range(TRIALS):
    corpus = []
    for _w in range(3):
        length = 3 + rand(3)
        symbols = []
        for _c in range(length):
            symbols.append("abc"[rand(3)])
        corpus.append([symbols, 1 + rand(3)])
    _, got = greedy(corpus, ROUNDS)
    want = exhaustive(corpus, ROUNDS)
    if got == want:
        matched += 1
    else:
        worse += 1
        gap = got - want
        if gap > worst_gap:
            worst_gap = gap
        if first_loss == "":
            first_loss = show(corpus) + "  greedy " + str(got) + ", best " + str(want)

print("over %d random corpora of 3 words, %d merges each:" % (TRIALS, ROUNDS))
print("  greedy found the best possible merge order  %6d" % matched)
print("  greedy did worse than some other order      %6d" % worse)
print("  the largest gap it ever left                %6d tokens" % worst_gap)
print()
print("first corpus where greedy loses:")
print("  " + first_loss)
print()
print("""The demo is the whole algorithm: count every adjacent pair weighted by
how often its word appears, merge the most frequent one into a single
symbol, recount, repeat. Nothing about it is specific to text. It is a
greedy loop over a frequency map, and the vocabulary it produces is
just the list of merges in the order they were made.

Notice what the merges are. Step one is "es" and step two is "est" --
the algorithm discovers a suffix without being told that suffixes
exist. Step four is "low", a whole word, because "low" appears often
enough that its pieces are the most frequent pair twice running. That
is the entire reason byte-pair encoding works: frequent things become
one token and rare things stay in pieces, and no linguistics is
involved.

The measurement is the part worth keeping. Greedy found the best
possible order on 2687 of 3000 corpora and lost on 313, by as much as
4 tokens. So the greedy choice is not optimal, and there is no
tie-breaking rule that would fix it -- the exhaustive search really
does find shorter encodings that the frequency-first rule walks past.

That is the standard greedy situation from earlier in this track, and
the standard resolution applies: the exhaustive search here costs
pairs to the power of merges, and a real tokeniser makes tens of
thousands of merges over a vocabulary of hundreds of thousands of
pairs. Optimal is not available at that size. Greedy is roughly right
nine times in ten and runs in one pass per merge, and being wrong 10%
of the time by a few tokens is a price the field pays without
noticing.""")
`,
          output: `a four-word corpus, 16 words and 79 characters in total

step  merged pair  new symbol  tokens left
   0  --           --                   79
   1  e + s        es                   70
   2  es + t       est                  61
   3  l + o        lo                   54
   4  lo + w       low                  47
   5  e + w        ew                   41
   6  ew + est     ewest                35

over 3000 random corpora of 3 words, 3 merges each:
  greedy found the best possible merge order    2687
  greedy did worse than some other order         313
  the largest gap it ever left                     4 tokens

first corpus where greedy loses:
  acaccx2 acccx3 ccacax3  greedy 19, best 18

The demo is the whole algorithm: count every adjacent pair weighted by
how often its word appears, merge the most frequent one into a single
symbol, recount, repeat. Nothing about it is specific to text. It is a
greedy loop over a frequency map, and the vocabulary it produces is
just the list of merges in the order they were made.

Notice what the merges are. Step one is "es" and step two is "est" --
the algorithm discovers a suffix without being told that suffixes
exist. Step four is "low", a whole word, because "low" appears often
enough that its pieces are the most frequent pair twice running. That
is the entire reason byte-pair encoding works: frequent things become
one token and rare things stay in pieces, and no linguistics is
involved.

The measurement is the part worth keeping. Greedy found the best
possible order on 2687 of 3000 corpora and lost on 313, by as much as
4 tokens. So the greedy choice is not optimal, and there is no
tie-breaking rule that would fix it -- the exhaustive search really
does find shorter encodings that the frequency-first rule walks past.

That is the standard greedy situation from earlier in this track, and
the standard resolution applies: the exhaustive search here costs
pairs to the power of merges, and a real tokeniser makes tens of
thousands of merges over a vocabulary of hundreds of thousands of
pairs. Optimal is not available at that size. Greedy is roughly right
nine times in ten and runs in one pass per merge, and being wrong 10%
of the time by a few tokens is a price the field pays without
noticing.`,
          explanation:
            "The demo shows what the merges discover. Step one is `es` and step two is `est` -- a suffix, found without anybody telling the algorithm that suffixes exist. Step four is `low`, an entire word, because it is frequent enough that its pieces are the top pair twice running. Then the measurement: over 3,000 random corpora with a budget of three merges, greedy found the best possible order 2,687 times and lost 313 times, by as much as 4 tokens. Greedy is not optimal here, and no tie-breaking rule fixes it -- the exhaustive search really does find shorter encodings that frequency-first walks past.",
          alternates: [
            {
              lang: "javascript",
              code: `// Byte-pair encoding is a greedy merge over a frequency map. This measures
// how often the greedy order is the best order, against an exhaustive search
// over every merge sequence of the same length.

const SEP = " ";

function pairCounts(corpus) {
  const counts = new Map();
  for (const [symbols, freq] of corpus) {
    for (let i = 0; i < symbols.length - 1; i++) {
      const key = symbols[i] + SEP + symbols[i + 1];
      counts.set(key, (counts.get(key) || 0) + freq);
    }
  }
  const keys = [...counts.keys()].sort();
  return [keys, counts];
}

function bestPair(corpus) {
  const [keys, counts] = pairCounts(corpus);
  if (keys.length === 0) return "";
  let best = keys[0];
  for (const key of keys) {
    if (counts.get(key) > counts.get(best)) best = key;
  }
  return best;
}

function applyMerge(corpus, key) {
  const cut = key.indexOf(SEP);
  const left = key.slice(0, cut);
  const right = key.slice(cut + 1);
  const joined = left + right;
  const out = [];
  for (const [symbols, freq] of corpus) {
    const fresh = [];
    let i = 0;
    while (i < symbols.length) {
      if (i + 1 < symbols.length && symbols[i] === left && symbols[i + 1] === right) {
        fresh.push(joined);
        i += 2;
      } else {
        fresh.push(symbols[i]);
        i += 1;
      }
    }
    out.push([fresh, freq]);
  }
  return out;
}

function totalTokens(corpus) {
  let total = 0;
  for (const [symbols, freq] of corpus) total += symbols.length * freq;
  return total;
}

function greedy(corpus, rounds) {
  const steps = [];
  let work = corpus;
  for (let r = 0; r < rounds; r++) {
    const key = bestPair(work);
    if (key === "") break;
    work = applyMerge(work, key);
    steps.push([key, totalTokens(work)]);
  }
  return [steps, totalTokens(work)];
}

function exhaustive(corpus, rounds) {
  if (rounds === 0) return totalTokens(corpus);
  const [keys] = pairCounts(corpus);
  if (keys.length === 0) return totalTokens(corpus);
  let best = -1;
  for (const key of keys) {
    const got = exhaustive(applyMerge(corpus, key), rounds - 1);
    if (best < 0 || got < best) best = got;
  }
  return best;
}

function show(corpus) {
  return corpus.map(([symbols, freq]) => symbols.join("") + "x" + freq).join(" ");
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

const demo = [
  ["low".split(""), 5],
  ["lower".split(""), 2],
  ["newest".split(""), 6],
  ["widest".split(""), 3],
];

let words = 0;
for (const [, freq] of demo) words += freq;
console.log(
  "a four-word corpus, " + words + " words and " + totalTokens(demo) +
    " characters in total",
);
console.log();
console.log("step  merged pair  new symbol  tokens left");
console.log("   0  --           --          " + padLeft(totalTokens(demo), 11));
const [steps] = greedy(demo, 6);
for (let i = 0; i < steps.length; i++) {
  const key = steps[i][0];
  const cut = key.indexOf(SEP);
  console.log(
    padLeft(i + 1, 4) + "  " + pad(key.slice(0, cut) + " + " + key.slice(cut + 1), 11) +
      "  " + pad(key.slice(0, cut) + key.slice(cut + 1), 10) + "  " +
      padLeft(steps[i][1], 11),
  );
}
console.log();

// The same linear congruential generator in every language, so the random
// corpora below are the same corpora whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 20240607n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const ROUNDS = 3;
const TRIALS = 3000;
let matched = 0;
let worse = 0;
let worstGap = 0;
let firstLoss = "";
for (let t = 0; t < TRIALS; t++) {
  const corpus = [];
  for (let w = 0; w < 3; w++) {
    const length = 3 + rand(3);
    const symbols = [];
    for (let c = 0; c < length; c++) symbols.push("abc"[rand(3)]);
    corpus.push([symbols, 1 + rand(3)]);
  }
  const [, got] = greedy(corpus, ROUNDS);
  const want = exhaustive(corpus, ROUNDS);
  if (got === want) {
    matched += 1;
  } else {
    worse += 1;
    const gap = got - want;
    if (gap > worstGap) worstGap = gap;
    if (firstLoss === "") firstLoss = show(corpus) + "  greedy " + got + ", best " + want;
  }
}

console.log("over " + TRIALS + " random corpora of 3 words, " + ROUNDS + " merges each:");
console.log("  greedy found the best possible merge order  " + padLeft(matched, 6));
console.log("  greedy did worse than some other order      " + padLeft(worse, 6));
console.log("  the largest gap it ever left                " + padLeft(worstGap, 6) + " tokens");
console.log();
console.log("first corpus where greedy loses:");
console.log("  " + firstLoss);
console.log();
console.log(
  [
    "The demo is the whole algorithm: count every adjacent pair weighted by",
    "how often its word appears, merge the most frequent one into a single",
    "symbol, recount, repeat. Nothing about it is specific to text. It is a",
    "greedy loop over a frequency map, and the vocabulary it produces is",
    "just the list of merges in the order they were made.",
    "",
    "Notice what the merges are. Step one is \\"es\\" and step two is \\"est\\" --",
    "the algorithm discovers a suffix without being told that suffixes",
    "exist. Step four is \\"low\\", a whole word, because \\"low\\" appears often",
    "enough that its pieces are the most frequent pair twice running. That",
    "is the entire reason byte-pair encoding works: frequent things become",
    "one token and rare things stay in pieces, and no linguistics is",
    "involved.",
    "",
    "The measurement is the part worth keeping. Greedy found the best",
    "possible order on 2687 of 3000 corpora and lost on 313, by as much as",
    "4 tokens. So the greedy choice is not optimal, and there is no",
    "tie-breaking rule that would fix it -- the exhaustive search really",
    "does find shorter encodings that the frequency-first rule walks past.",
    "",
    "That is the standard greedy situation from earlier in this track, and",
    "the standard resolution applies: the exhaustive search here costs",
    "pairs to the power of merges, and a real tokeniser makes tens of",
    "thousands of merges over a vocabulary of hundreds of thousands of",
    "pairs. Optimal is not available at that size. Greedy is roughly right",
    "nine times in ten and runs in one pass per merge, and being wrong 10%",
    "of the time by a few tokens is a price the field pays without",
    "noticing.",
  ].join("\\n"),
);
`,
            },
            {
              lang: "typescript",
              code: `// Byte-pair encoding is a greedy merge over a frequency map. This measures
// how often the greedy order is the best order, against an exhaustive search
// over every merge sequence of the same length.

const SEP = " ";

type Entry = [string[], number];

function pairCounts(corpus: Entry[]): [string[], Map<string, number>] {
  const counts = new Map();
  for (const [symbols, freq] of corpus) {
    for (let i = 0; i < symbols.length - 1; i++) {
      const key = symbols[i] + SEP + symbols[i + 1];
      counts.set(key, (counts.get(key) || 0) + freq);
    }
  }
  const keys = [...counts.keys()].sort();
  return [keys, counts];
}

function bestPair(corpus: Entry[]): string {
  const [keys, counts] = pairCounts(corpus);
  if (keys.length === 0) return "";
  let best = keys[0];
  for (const key of keys) {
    if (counts.get(key)! > counts.get(best)!) best = key;
  }
  return best;
}

function applyMerge(corpus: Entry[], key: string): Entry[] {
  const cut = key.indexOf(SEP);
  const left = key.slice(0, cut);
  const right = key.slice(cut + 1);
  const joined = left + right;
  const out: Entry[] = [];
  for (const [symbols, freq] of corpus) {
    const fresh: string[] = [];
    let i = 0;
    while (i < symbols.length) {
      if (i + 1 < symbols.length && symbols[i] === left && symbols[i + 1] === right) {
        fresh.push(joined);
        i += 2;
      } else {
        fresh.push(symbols[i]);
        i += 1;
      }
    }
    out.push([fresh, freq]);
  }
  return out;
}

function totalTokens(corpus: Entry[]): number {
  let total = 0;
  for (const [symbols, freq] of corpus) total += symbols.length * freq;
  return total;
}

function greedy(corpus: Entry[], rounds: number): [Array<[string, number]>, number] {
  const steps: Array<[string, number]> = [];
  let work = corpus;
  for (let r = 0; r < rounds; r++) {
    const key = bestPair(work);
    if (key === "") break;
    work = applyMerge(work, key);
    steps.push([key, totalTokens(work)]);
  }
  return [steps, totalTokens(work)];
}

function exhaustive(corpus: Entry[], rounds: number): number {
  if (rounds === 0) return totalTokens(corpus);
  const [keys] = pairCounts(corpus);
  if (keys.length === 0) return totalTokens(corpus);
  let best = -1;
  for (const key of keys) {
    const got = exhaustive(applyMerge(corpus, key), rounds - 1);
    if (best < 0 || got < best) best = got;
  }
  return best;
}

function show(corpus: Entry[]): string {
  return corpus.map(([symbols, freq]) => symbols.join("") + "x" + freq).join(" ");
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

const demo: Entry[] = [
  ["low".split(""), 5],
  ["lower".split(""), 2],
  ["newest".split(""), 6],
  ["widest".split(""), 3],
];

let words = 0;
for (const [, freq] of demo) words += freq;
console.log(
  "a four-word corpus, " + words + " words and " + totalTokens(demo) +
    " characters in total",
);
console.log();
console.log("step  merged pair  new symbol  tokens left");
console.log("   0  --           --          " + padLeft(totalTokens(demo), 11));
const [steps] = greedy(demo, 6);
for (let i = 0; i < steps.length; i++) {
  const key = steps[i][0];
  const cut = key.indexOf(SEP);
  console.log(
    padLeft(i + 1, 4) + "  " + pad(key.slice(0, cut) + " + " + key.slice(cut + 1), 11) +
      "  " + pad(key.slice(0, cut) + key.slice(cut + 1), 10) + "  " +
      padLeft(steps[i][1], 11),
  );
}
console.log();

// The same linear congruential generator in every language, so the random
// corpora below are the same corpora whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 20240607n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const ROUNDS = 3;
const TRIALS = 3000;
let matched = 0;
let worse = 0;
let worstGap = 0;
let firstLoss = "";
for (let t = 0; t < TRIALS; t++) {
  const corpus: Entry[] = [];
  for (let w = 0; w < 3; w++) {
    const length = 3 + rand(3);
    const symbols: string[] = [];
    for (let c = 0; c < length; c++) symbols.push("abc"[rand(3)]);
    corpus.push([symbols, 1 + rand(3)]);
  }
  const [, got] = greedy(corpus, ROUNDS);
  const want = exhaustive(corpus, ROUNDS);
  if (got === want) {
    matched += 1;
  } else {
    worse += 1;
    const gap = got - want;
    if (gap > worstGap) worstGap = gap;
    if (firstLoss === "") firstLoss = show(corpus) + "  greedy " + got + ", best " + want;
  }
}

console.log("over " + TRIALS + " random corpora of 3 words, " + ROUNDS + " merges each:");
console.log("  greedy found the best possible merge order  " + padLeft(matched, 6));
console.log("  greedy did worse than some other order      " + padLeft(worse, 6));
console.log("  the largest gap it ever left                " + padLeft(worstGap, 6) + " tokens");
console.log();
console.log("first corpus where greedy loses:");
console.log("  " + firstLoss);
console.log();
console.log(
  [
    "The demo is the whole algorithm: count every adjacent pair weighted by",
    "how often its word appears, merge the most frequent one into a single",
    "symbol, recount, repeat. Nothing about it is specific to text. It is a",
    "greedy loop over a frequency map, and the vocabulary it produces is",
    "just the list of merges in the order they were made.",
    "",
    "Notice what the merges are. Step one is \\"es\\" and step two is \\"est\\" --",
    "the algorithm discovers a suffix without being told that suffixes",
    "exist. Step four is \\"low\\", a whole word, because \\"low\\" appears often",
    "enough that its pieces are the most frequent pair twice running. That",
    "is the entire reason byte-pair encoding works: frequent things become",
    "one token and rare things stay in pieces, and no linguistics is",
    "involved.",
    "",
    "The measurement is the part worth keeping. Greedy found the best",
    "possible order on 2687 of 3000 corpora and lost on 313, by as much as",
    "4 tokens. So the greedy choice is not optimal, and there is no",
    "tie-breaking rule that would fix it -- the exhaustive search really",
    "does find shorter encodings that the frequency-first rule walks past.",
    "",
    "That is the standard greedy situation from earlier in this track, and",
    "the standard resolution applies: the exhaustive search here costs",
    "pairs to the power of merges, and a real tokeniser makes tens of",
    "thousands of merges over a vocabulary of hundreds of thousands of",
    "pairs. Optimal is not available at that size. Greedy is roughly right",
    "nine times in ten and runs in one pass per merge, and being wrong 10%",
    "of the time by a few tokens is a price the field pays without",
    "noticing.",
  ].join("\\n"),
);
`,
            },
            {
              lang: "java",
              code: `// Byte-pair encoding is a greedy merge over a frequency map. This measures
// how often the greedy order is the best order, against an exhaustive search
// over every merge sequence of the same length.

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Main {
  static final String SEP = " ";

  static class Entry {
    List<String> symbols;
    int freq;

    Entry(List<String> symbols, int freq) {
      this.symbols = symbols;
      this.freq = freq;
    }
  }

  static Map<String, Integer> pairCounts(List<Entry> corpus) {
    Map<String, Integer> counts = new HashMap<>();
    for (Entry e : corpus) {
      for (int i = 0; i < e.symbols.size() - 1; i++) {
        String key = e.symbols.get(i) + SEP + e.symbols.get(i + 1);
        counts.put(key, counts.getOrDefault(key, 0) + e.freq);
      }
    }
    return counts;
  }

  static List<String> sortedKeys(Map<String, Integer> counts) {
    List<String> keys = new ArrayList<>(counts.keySet());
    Collections.sort(keys);
    return keys;
  }

  static String bestPair(List<Entry> corpus) {
    Map<String, Integer> counts = pairCounts(corpus);
    List<String> keys = sortedKeys(counts);
    if (keys.isEmpty()) {
      return "";
    }
    String best = keys.get(0);
    for (String key : keys) {
      if (counts.get(key) > counts.get(best)) {
        best = key;
      }
    }
    return best;
  }

  static List<Entry> applyMerge(List<Entry> corpus, String key) {
    int cut = key.indexOf(SEP);
    String left = key.substring(0, cut);
    String right = key.substring(cut + 1);
    String joined = left + right;
    List<Entry> out = new ArrayList<>();
    for (Entry e : corpus) {
      List<String> fresh = new ArrayList<>();
      int i = 0;
      while (i < e.symbols.size()) {
        if (i + 1 < e.symbols.size()
            && e.symbols.get(i).equals(left)
            && e.symbols.get(i + 1).equals(right)) {
          fresh.add(joined);
          i += 2;
        } else {
          fresh.add(e.symbols.get(i));
          i += 1;
        }
      }
      out.add(new Entry(fresh, e.freq));
    }
    return out;
  }

  static int totalTokens(List<Entry> corpus) {
    int total = 0;
    for (Entry e : corpus) {
      total += e.symbols.size() * e.freq;
    }
    return total;
  }

  static List<String> greedySteps = new ArrayList<>();
  static List<Integer> greedyLeft = new ArrayList<>();

  static int greedy(List<Entry> corpus, int rounds, boolean record) {
    if (record) {
      greedySteps.clear();
      greedyLeft.clear();
    }
    List<Entry> work = corpus;
    for (int r = 0; r < rounds; r++) {
      String key = bestPair(work);
      if (key.equals("")) {
        break;
      }
      work = applyMerge(work, key);
      if (record) {
        greedySteps.add(key);
        greedyLeft.add(totalTokens(work));
      }
    }
    return totalTokens(work);
  }

  static int exhaustive(List<Entry> corpus, int rounds) {
    if (rounds == 0) {
      return totalTokens(corpus);
    }
    Map<String, Integer> counts = pairCounts(corpus);
    List<String> keys = sortedKeys(counts);
    if (keys.isEmpty()) {
      return totalTokens(corpus);
    }
    int best = -1;
    for (String key : keys) {
      int got = exhaustive(applyMerge(corpus, key), rounds - 1);
      if (best < 0 || got < best) {
        best = got;
      }
    }
    return best;
  }

  static String show(List<Entry> corpus) {
    StringBuilder sb = new StringBuilder();
    for (Entry e : corpus) {
      if (sb.length() > 0) {
        sb.append(" ");
      }
      sb.append(String.join("", e.symbols)).append("x").append(e.freq);
    }
    return sb.toString();
  }

  static List<String> letters(String word) {
    List<String> out = new ArrayList<>();
    for (int i = 0; i < word.length(); i++) {
      out.add(word.substring(i, i + 1));
    }
    return out;
  }

  static long seed = 20240607L;

  static int rand(int n) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return (int) (seed / 65536L % n);
  }

  public static void main(String[] args) {
    List<Entry> demo = new ArrayList<>();
    demo.add(new Entry(letters("low"), 5));
    demo.add(new Entry(letters("lower"), 2));
    demo.add(new Entry(letters("newest"), 6));
    demo.add(new Entry(letters("widest"), 3));

    int words = 0;
    for (Entry e : demo) {
      words += e.freq;
    }
    System.out.printf(
        "a four-word corpus, %d words and %d characters in total%n", words, totalTokens(demo));
    System.out.println();
    System.out.println("step  merged pair  new symbol  tokens left");
    System.out.printf("   0  --           --          %11d%n", totalTokens(demo));
    greedy(demo, 6, true);
    for (int i = 0; i < greedySteps.size(); i++) {
      String key = greedySteps.get(i);
      int cut = key.indexOf(SEP);
      System.out.printf(
          "%4d  %-11s  %-10s  %11d%n",
          i + 1,
          key.substring(0, cut) + " + " + key.substring(cut + 1),
          key.substring(0, cut) + key.substring(cut + 1),
          greedyLeft.get(i));
    }
    System.out.println();

    // The same linear congruential generator in every language, so the random
    // corpora below are the same corpora whichever translation is run.
    final int rounds = 3;
    final int trials = 3000;
    int matched = 0;
    int worse = 0;
    int worstGap = 0;
    String firstLoss = "";
    for (int t = 0; t < trials; t++) {
      List<Entry> corpus = new ArrayList<>();
      for (int w = 0; w < 3; w++) {
        int length = 3 + rand(3);
        List<String> symbols = new ArrayList<>();
        for (int c = 0; c < length; c++) {
          int pick = rand(3);
          symbols.add("abc".substring(pick, pick + 1));
        }
        corpus.add(new Entry(symbols, 1 + rand(3)));
      }
      int got = greedy(corpus, rounds, false);
      int want = exhaustive(corpus, rounds);
      if (got == want) {
        matched += 1;
      } else {
        worse += 1;
        int gap = got - want;
        if (gap > worstGap) {
          worstGap = gap;
        }
        if (firstLoss.equals("")) {
          firstLoss = show(corpus) + "  greedy " + got + ", best " + want;
        }
      }
    }

    System.out.printf(
        "over %d random corpora of 3 words, %d merges each:%n", trials, rounds);
    System.out.printf("  greedy found the best possible merge order  %6d%n", matched);
    System.out.printf("  greedy did worse than some other order      %6d%n", worse);
    System.out.printf("  the largest gap it ever left                %6d tokens%n", worstGap);
    System.out.println();
    System.out.println("first corpus where greedy loses:");
    System.out.println("  " + firstLoss);
    System.out.println();
    System.out.println(String.join("\\n",
        "The demo is the whole algorithm: count every adjacent pair weighted by",
        "how often its word appears, merge the most frequent one into a single",
        "symbol, recount, repeat. Nothing about it is specific to text. It is a",
        "greedy loop over a frequency map, and the vocabulary it produces is",
        "just the list of merges in the order they were made.",
        "",
        "Notice what the merges are. Step one is \\"es\\" and step two is \\"est\\" --",
        "the algorithm discovers a suffix without being told that suffixes",
        "exist. Step four is \\"low\\", a whole word, because \\"low\\" appears often",
        "enough that its pieces are the most frequent pair twice running. That",
        "is the entire reason byte-pair encoding works: frequent things become",
        "one token and rare things stay in pieces, and no linguistics is",
        "involved.",
        "",
        "The measurement is the part worth keeping. Greedy found the best",
        "possible order on 2687 of 3000 corpora and lost on 313, by as much as",
        "4 tokens. So the greedy choice is not optimal, and there is no",
        "tie-breaking rule that would fix it -- the exhaustive search really",
        "does find shorter encodings that the frequency-first rule walks past.",
        "",
        "That is the standard greedy situation from earlier in this track, and",
        "the standard resolution applies: the exhaustive search here costs",
        "pairs to the power of merges, and a real tokeniser makes tens of",
        "thousands of merges over a vocabulary of hundreds of thousands of",
        "pairs. Optimal is not available at that size. Greedy is roughly right",
        "nine times in ten and runs in one pass per merge, and being wrong 10%",
        "of the time by a few tokens is a price the field pays without",
        "noticing."));
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// Byte-pair encoding is a greedy merge over a frequency map. This measures
// how often the greedy order is the best order, against an exhaustive search
// over every merge sequence of the same length.

#include <algorithm>
#include <cstdio>
#include <iostream>
#include <map>
#include <string>
#include <vector>

static const std::string SEP = " ";

struct Entry {
  std::vector<std::string> symbols;
  int freq;
};

std::map<std::string, int> pairCounts(const std::vector<Entry>& corpus) {
  std::map<std::string, int> counts;
  for (const Entry& e : corpus) {
    for (size_t i = 0; i + 1 < e.symbols.size(); i++) {
      counts[e.symbols[i] + SEP + e.symbols[i + 1]] += e.freq;
    }
  }
  return counts;
}

std::string bestPair(const std::vector<Entry>& corpus) {
  std::map<std::string, int> counts = pairCounts(corpus);
  if (counts.empty()) {
    return "";
  }
  std::string best = counts.begin()->first;
  for (const auto& kv : counts) {
    if (kv.second > counts[best]) {
      best = kv.first;
    }
  }
  return best;
}

std::vector<Entry> applyMerge(const std::vector<Entry>& corpus, const std::string& key) {
  size_t cut = key.find(SEP);
  std::string left = key.substr(0, cut);
  std::string right = key.substr(cut + 1);
  std::string joined = left + right;
  std::vector<Entry> out;
  for (const Entry& e : corpus) {
    std::vector<std::string> fresh;
    size_t i = 0;
    while (i < e.symbols.size()) {
      if (i + 1 < e.symbols.size() && e.symbols[i] == left && e.symbols[i + 1] == right) {
        fresh.push_back(joined);
        i += 2;
      } else {
        fresh.push_back(e.symbols[i]);
        i += 1;
      }
    }
    Entry made;
    made.symbols = fresh;
    made.freq = e.freq;
    out.push_back(made);
  }
  return out;
}

int totalTokens(const std::vector<Entry>& corpus) {
  int total = 0;
  for (const Entry& e : corpus) {
    total += (int)e.symbols.size() * e.freq;
  }
  return total;
}

std::vector<std::string> greedySteps;
std::vector<int> greedyLeft;

int greedy(const std::vector<Entry>& corpus, int rounds, bool record) {
  if (record) {
    greedySteps.clear();
    greedyLeft.clear();
  }
  std::vector<Entry> work = corpus;
  for (int r = 0; r < rounds; r++) {
    std::string key = bestPair(work);
    if (key == "") {
      break;
    }
    work = applyMerge(work, key);
    if (record) {
      greedySteps.push_back(key);
      greedyLeft.push_back(totalTokens(work));
    }
  }
  return totalTokens(work);
}

int exhaustive(const std::vector<Entry>& corpus, int rounds) {
  if (rounds == 0) {
    return totalTokens(corpus);
  }
  std::map<std::string, int> counts = pairCounts(corpus);
  if (counts.empty()) {
    return totalTokens(corpus);
  }
  int best = -1;
  for (const auto& kv : counts) {
    int got = exhaustive(applyMerge(corpus, kv.first), rounds - 1);
    if (best < 0 || got < best) {
      best = got;
    }
  }
  return best;
}

std::string show(const std::vector<Entry>& corpus) {
  std::string out;
  for (const Entry& e : corpus) {
    if (!out.empty()) {
      out += " ";
    }
    for (const std::string& s : e.symbols) {
      out += s;
    }
    out += "x" + std::to_string(e.freq);
  }
  return out;
}

std::vector<std::string> letters(const std::string& word) {
  std::vector<std::string> out;
  for (size_t i = 0; i < word.size(); i++) {
    out.push_back(word.substr(i, 1));
  }
  return out;
}

long long seed = 20240607LL;

int rand_below(int n) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return (int)(seed / 65536LL % n);
}

int main() {
  std::vector<Entry> demo;
  demo.push_back(Entry{letters("low"), 5});
  demo.push_back(Entry{letters("lower"), 2});
  demo.push_back(Entry{letters("newest"), 6});
  demo.push_back(Entry{letters("widest"), 3});

  int words = 0;
  for (const Entry& e : demo) {
    words += e.freq;
  }
  std::printf("a four-word corpus, %d words and %d characters in total\\n", words,
              totalTokens(demo));
  std::printf("\\n");
  std::printf("step  merged pair  new symbol  tokens left\\n");
  std::printf("   0  --           --          %11d\\n", totalTokens(demo));
  greedy(demo, 6, true);
  for (size_t i = 0; i < greedySteps.size(); i++) {
    std::string key = greedySteps[i];
    size_t cut = key.find(SEP);
    std::string shown = key.substr(0, cut) + " + " + key.substr(cut + 1);
    std::string made = key.substr(0, cut) + key.substr(cut + 1);
    std::printf("%4d  %-11s  %-10s  %11d\\n", (int)i + 1, shown.c_str(), made.c_str(),
                greedyLeft[i]);
  }
  std::printf("\\n");

  // The same linear congruential generator in every language, so the random
  // corpora below are the same corpora whichever translation is run.
  const int rounds = 3;
  const int trials = 3000;
  int matched = 0;
  int worse = 0;
  int worstGap = 0;
  std::string firstLoss = "";
  for (int t = 0; t < trials; t++) {
    std::vector<Entry> corpus;
    for (int w = 0; w < 3; w++) {
      int length = 3 + rand_below(3);
      std::vector<std::string> symbols;
      for (int c = 0; c < length; c++) {
        int pick = rand_below(3);
        symbols.push_back(std::string("abc").substr(pick, 1));
      }
      Entry made;
      made.symbols = symbols;
      made.freq = 1 + rand_below(3);
      corpus.push_back(made);
    }
    int got = greedy(corpus, rounds, false);
    int want = exhaustive(corpus, rounds);
    if (got == want) {
      matched += 1;
    } else {
      worse += 1;
      int gap = got - want;
      if (gap > worstGap) {
        worstGap = gap;
      }
      if (firstLoss == "") {
        firstLoss = show(corpus) + "  greedy " + std::to_string(got) + ", best " +
                    std::to_string(want);
      }
    }
  }

  std::printf("over %d random corpora of 3 words, %d merges each:\\n", trials, rounds);
  std::printf("  greedy found the best possible merge order  %6d\\n", matched);
  std::printf("  greedy did worse than some other order      %6d\\n", worse);
  std::printf("  the largest gap it ever left                %6d tokens\\n", worstGap);
  std::printf("\\n");
  std::printf("first corpus where greedy loses:\\n");
  std::printf("  %s\\n", firstLoss.c_str());
  std::printf("\\n");
    std::cout
        << "The demo is the whole algorithm: count every adjacent pair weighted by" << "\\n"
        << "how often its word appears, merge the most frequent one into a single" << "\\n"
        << "symbol, recount, repeat. Nothing about it is specific to text. It is a" << "\\n"
        << "greedy loop over a frequency map, and the vocabulary it produces is" << "\\n"
        << "just the list of merges in the order they were made." << "\\n"
        << "" << "\\n"
        << "Notice what the merges are. Step one is \\"es\\" and step two is \\"est\\" --" << "\\n"
        << "the algorithm discovers a suffix without being told that suffixes" << "\\n"
        << "exist. Step four is \\"low\\", a whole word, because \\"low\\" appears often" << "\\n"
        << "enough that its pieces are the most frequent pair twice running. That" << "\\n"
        << "is the entire reason byte-pair encoding works: frequent things become" << "\\n"
        << "one token and rare things stay in pieces, and no linguistics is" << "\\n"
        << "involved." << "\\n"
        << "" << "\\n"
        << "The measurement is the part worth keeping. Greedy found the best" << "\\n"
        << "possible order on 2687 of 3000 corpora and lost on 313, by as much as" << "\\n"
        << "4 tokens. So the greedy choice is not optimal, and there is no" << "\\n"
        << "tie-breaking rule that would fix it -- the exhaustive search really" << "\\n"
        << "does find shorter encodings that the frequency-first rule walks past." << "\\n"
        << "" << "\\n"
        << "That is the standard greedy situation from earlier in this track, and" << "\\n"
        << "the standard resolution applies: the exhaustive search here costs" << "\\n"
        << "pairs to the power of merges, and a real tokeniser makes tens of" << "\\n"
        << "thousands of merges over a vocabulary of hundreds of thousands of" << "\\n"
        << "pairs. Optimal is not available at that size. Greedy is roughly right" << "\\n"
        << "nine times in ten and runs in one pass per merge, and being wrong 10%" << "\\n"
        << "of the time by a few tokens is a price the field pays without" << "\\n"
        << "noticing." << "\\n"
        ;
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Byte-pair encoding is a greedy merge over a frequency map. This measures
// how often the greedy order is the best order, against an exhaustive search
// over every merge sequence of the same length.

use std::collections::BTreeMap;

const SEP: &str = " ";

#[derive(Clone)]
struct Entry {
    symbols: Vec<String>,
    freq: i64,
}

fn pair_counts(corpus: &[Entry]) -> BTreeMap<String, i64> {
    let mut counts: BTreeMap<String, i64> = BTreeMap::new();
    for e in corpus {
        for i in 0..e.symbols.len().saturating_sub(1) {
            let key = format!("{}{}{}", e.symbols[i], SEP, e.symbols[i + 1]);
            *counts.entry(key).or_insert(0) += e.freq;
        }
    }
    counts
}

fn best_pair(corpus: &[Entry]) -> String {
    let counts = pair_counts(corpus);
    if counts.is_empty() {
        return String::new();
    }
    let mut best = String::new();
    let mut best_count = -1;
    for (key, count) in &counts {
        if *count > best_count {
            best_count = *count;
            best = key.clone();
        }
    }
    best
}

fn apply_merge(corpus: &[Entry], key: &str) -> Vec<Entry> {
    let cut = key.find(SEP).unwrap();
    let left = &key[..cut];
    let right = &key[cut + 1..];
    let joined = format!("{}{}", left, right);
    let mut out: Vec<Entry> = Vec::new();
    for e in corpus {
        let mut fresh: Vec<String> = Vec::new();
        let mut i = 0;
        while i < e.symbols.len() {
            if i + 1 < e.symbols.len() && e.symbols[i] == left && e.symbols[i + 1] == right {
                fresh.push(joined.clone());
                i += 2;
            } else {
                fresh.push(e.symbols[i].clone());
                i += 1;
            }
        }
        out.push(Entry { symbols: fresh, freq: e.freq });
    }
    out
}

fn total_tokens(corpus: &[Entry]) -> i64 {
    let mut total = 0;
    for e in corpus {
        total += e.symbols.len() as i64 * e.freq;
    }
    total
}

fn greedy(corpus: &[Entry], rounds: usize, steps: &mut Vec<(String, i64)>) -> i64 {
    let mut work = corpus.to_vec();
    for _ in 0..rounds {
        let key = best_pair(&work);
        if key.is_empty() {
            break;
        }
        work = apply_merge(&work, &key);
        steps.push((key, total_tokens(&work)));
    }
    total_tokens(&work)
}

fn exhaustive(corpus: &[Entry], rounds: usize) -> i64 {
    if rounds == 0 {
        return total_tokens(corpus);
    }
    let counts = pair_counts(corpus);
    if counts.is_empty() {
        return total_tokens(corpus);
    }
    let mut best = -1;
    for key in counts.keys() {
        let got = exhaustive(&apply_merge(corpus, key), rounds - 1);
        if best < 0 || got < best {
            best = got;
        }
    }
    best
}

fn show(corpus: &[Entry]) -> String {
    let mut out = String::new();
    for e in corpus {
        if !out.is_empty() {
            out.push(' ');
        }
        out.push_str(&e.symbols.join(""));
        out.push('x');
        out.push_str(&e.freq.to_string());
    }
    out
}

fn letters(word: &str) -> Vec<String> {
    word.chars().map(|c| c.to_string()).collect()
}

static mut SEED: i64 = 20240607;

fn rand_below(n: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % n
    }
}

fn main() {
    let demo = vec![
        Entry { symbols: letters("low"), freq: 5 },
        Entry { symbols: letters("lower"), freq: 2 },
        Entry { symbols: letters("newest"), freq: 6 },
        Entry { symbols: letters("widest"), freq: 3 },
    ];

    let mut words = 0;
    for e in &demo {
        words += e.freq;
    }
    println!(
        "a four-word corpus, {} words and {} characters in total",
        words,
        total_tokens(&demo)
    );
    println!();
    println!("step  merged pair  new symbol  tokens left");
    println!("   0  --           --          {:>11}", total_tokens(&demo));
    let mut steps: Vec<(String, i64)> = Vec::new();
    greedy(&demo, 6, &mut steps);
    for (i, step) in steps.iter().enumerate() {
        let key = &step.0;
        let cut = key.find(SEP).unwrap();
        let shown = format!("{} + {}", &key[..cut], &key[cut + 1..]);
        let made = format!("{}{}", &key[..cut], &key[cut + 1..]);
        println!("{:>4}  {:<11}  {:<10}  {:>11}", i + 1, shown, made, step.1);
    }
    println!();

    // The same linear congruential generator in every language, so the random
    // corpora below are the same corpora whichever translation is run.
    let rounds = 3;
    let trials = 3000;
    let mut matched = 0;
    let mut worse = 0;
    let mut worst_gap = 0;
    let mut first_loss = String::new();
    let alphabet = ["a", "b", "c"];
    for _ in 0..trials {
        let mut corpus: Vec<Entry> = Vec::new();
        for _ in 0..3 {
            let length = 3 + rand_below(3);
            let mut symbols: Vec<String> = Vec::new();
            for _ in 0..length {
                symbols.push(alphabet[rand_below(3) as usize].to_string());
            }
            corpus.push(Entry { symbols, freq: 1 + rand_below(3) });
        }
        let mut ignored: Vec<(String, i64)> = Vec::new();
        let got = greedy(&corpus, rounds, &mut ignored);
        let want = exhaustive(&corpus, rounds);
        if got == want {
            matched += 1;
        } else {
            worse += 1;
            let gap = got - want;
            if gap > worst_gap {
                worst_gap = gap;
            }
            if first_loss.is_empty() {
                first_loss = format!("{}  greedy {}, best {}", show(&corpus), got, want);
            }
        }
    }

    println!("over {} random corpora of 3 words, {} merges each:", trials, rounds);
    println!("  greedy found the best possible merge order  {:>6}", matched);
    println!("  greedy did worse than some other order      {:>6}", worse);
    println!("  the largest gap it ever left                {:>6} tokens", worst_gap);
    println!();
    println!("first corpus where greedy loses:");
    println!("  {}", first_loss);
    println!();
    println!("{}", [
        "The demo is the whole algorithm: count every adjacent pair weighted by",
        "how often its word appears, merge the most frequent one into a single",
        "symbol, recount, repeat. Nothing about it is specific to text. It is a",
        "greedy loop over a frequency map, and the vocabulary it produces is",
        "just the list of merges in the order they were made.",
        "",
        "Notice what the merges are. Step one is \\"es\\" and step two is \\"est\\" --",
        "the algorithm discovers a suffix without being told that suffixes",
        "exist. Step four is \\"low\\", a whole word, because \\"low\\" appears often",
        "enough that its pieces are the most frequent pair twice running. That",
        "is the entire reason byte-pair encoding works: frequent things become",
        "one token and rare things stay in pieces, and no linguistics is",
        "involved.",
        "",
        "The measurement is the part worth keeping. Greedy found the best",
        "possible order on 2687 of 3000 corpora and lost on 313, by as much as",
        "4 tokens. So the greedy choice is not optimal, and there is no",
        "tie-breaking rule that would fix it -- the exhaustive search really",
        "does find shorter encodings that the frequency-first rule walks past.",
        "",
        "That is the standard greedy situation from earlier in this track, and",
        "the standard resolution applies: the exhaustive search here costs",
        "pairs to the power of merges, and a real tokeniser makes tens of",
        "thousands of merges over a vocabulary of hundreds of thousands of",
        "pairs. Optimal is not available at that size. Greedy is roughly right",
        "nine times in ten and runs in one pass per merge, and being wrong 10%",
        "of the time by a few tokens is a price the field pays without",
        "noticing.",
    ].join("\\n"));
}
`,
            },
            {
              lang: "go",
              code: `// Byte-pair encoding is a greedy merge over a frequency map. This measures
// how often the greedy order is the best order, against an exhaustive search
// over every merge sequence of the same length.

package main

import (
	"fmt"
	"sort"
	"strings"
)

const sep = " "

type entry struct {
	symbols []string
	freq    int
}

func pairCounts(corpus []entry) (map[string]int, []string) {
	counts := map[string]int{}
	for _, e := range corpus {
		for i := 0; i+1 < len(e.symbols); i++ {
			counts[e.symbols[i]+sep+e.symbols[i+1]] += e.freq
		}
	}
	keys := []string{}
	for key := range counts {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	return counts, keys
}

func bestPair(corpus []entry) string {
	counts, keys := pairCounts(corpus)
	if len(keys) == 0 {
		return ""
	}
	best := keys[0]
	for _, key := range keys {
		if counts[key] > counts[best] {
			best = key
		}
	}
	return best
}

func applyMerge(corpus []entry, key string) []entry {
	cut := strings.Index(key, sep)
	left := key[:cut]
	right := key[cut+1:]
	joined := left + right
	out := []entry{}
	for _, e := range corpus {
		fresh := []string{}
		i := 0
		for i < len(e.symbols) {
			if i+1 < len(e.symbols) && e.symbols[i] == left && e.symbols[i+1] == right {
				fresh = append(fresh, joined)
				i += 2
			} else {
				fresh = append(fresh, e.symbols[i])
				i++
			}
		}
		out = append(out, entry{symbols: fresh, freq: e.freq})
	}
	return out
}

func totalTokens(corpus []entry) int {
	total := 0
	for _, e := range corpus {
		total += len(e.symbols) * e.freq
	}
	return total
}

type step struct {
	key  string
	left int
}

func greedy(corpus []entry, rounds int) ([]step, int) {
	steps := []step{}
	work := corpus
	for r := 0; r < rounds; r++ {
		key := bestPair(work)
		if key == "" {
			break
		}
		work = applyMerge(work, key)
		steps = append(steps, step{key: key, left: totalTokens(work)})
	}
	return steps, totalTokens(work)
}

func exhaustive(corpus []entry, rounds int) int {
	if rounds == 0 {
		return totalTokens(corpus)
	}
	_, keys := pairCounts(corpus)
	if len(keys) == 0 {
		return totalTokens(corpus)
	}
	best := -1
	for _, key := range keys {
		got := exhaustive(applyMerge(corpus, key), rounds-1)
		if best < 0 || got < best {
			best = got
		}
	}
	return best
}

func show(corpus []entry) string {
	parts := []string{}
	for _, e := range corpus {
		parts = append(parts, strings.Join(e.symbols, "")+"x"+fmt.Sprint(e.freq))
	}
	return strings.Join(parts, " ")
}

func letters(word string) []string {
	out := []string{}
	for _, c := range word {
		out = append(out, string(c))
	}
	return out
}

var seed int64 = 20240607

func randBelow(n int64) int64 {
	seed = (seed*1103515245 + 12345) % 2147483648
	return seed / 65536 % n
}

func main() {
	demo := []entry{
		{symbols: letters("low"), freq: 5},
		{symbols: letters("lower"), freq: 2},
		{symbols: letters("newest"), freq: 6},
		{symbols: letters("widest"), freq: 3},
	}

	words := 0
	for _, e := range demo {
		words += e.freq
	}
	fmt.Printf("a four-word corpus, %d words and %d characters in total\\n", words, totalTokens(demo))
	fmt.Println()
	fmt.Println("step  merged pair  new symbol  tokens left")
	fmt.Printf("   0  --           --          %11d\\n", totalTokens(demo))
	steps, _ := greedy(demo, 6)
	for i, s := range steps {
		cut := strings.Index(s.key, sep)
		shown := s.key[:cut] + " + " + s.key[cut+1:]
		made := s.key[:cut] + s.key[cut+1:]
		fmt.Printf("%4d  %-11s  %-10s  %11d\\n", i+1, shown, made, s.left)
	}
	fmt.Println()

	// The same linear congruential generator in every language, so the random
	// corpora below are the same corpora whichever translation is run.
	rounds := 3
	trials := 3000
	matched := 0
	worse := 0
	worstGap := 0
	firstLoss := ""
	alphabet := []string{"a", "b", "c"}
	for t := 0; t < trials; t++ {
		corpus := []entry{}
		for w := 0; w < 3; w++ {
			length := 3 + randBelow(3)
			symbols := []string{}
			for c := int64(0); c < length; c++ {
				symbols = append(symbols, alphabet[randBelow(3)])
			}
			corpus = append(corpus, entry{symbols: symbols, freq: int(1 + randBelow(3))})
		}
		_, got := greedy(corpus, rounds)
		want := exhaustive(corpus, rounds)
		if got == want {
			matched++
		} else {
			worse++
			gap := got - want
			if gap > worstGap {
				worstGap = gap
			}
			if firstLoss == "" {
				firstLoss = fmt.Sprintf("%s  greedy %d, best %d", show(corpus), got, want)
			}
		}
	}

	fmt.Printf("over %d random corpora of 3 words, %d merges each:\\n", trials, rounds)
	fmt.Printf("  greedy found the best possible merge order  %6d\\n", matched)
	fmt.Printf("  greedy did worse than some other order      %6d\\n", worse)
	fmt.Printf("  the largest gap it ever left                %6d tokens\\n", worstGap)
	fmt.Println()
	fmt.Println("first corpus where greedy loses:")
	fmt.Println("  " + firstLoss)
	fmt.Println()
	fmt.Println(strings.Join([]string{
		"The demo is the whole algorithm: count every adjacent pair weighted by",
		"how often its word appears, merge the most frequent one into a single",
		"symbol, recount, repeat. Nothing about it is specific to text. It is a",
		"greedy loop over a frequency map, and the vocabulary it produces is",
		"just the list of merges in the order they were made.",
		"",
		"Notice what the merges are. Step one is \\"es\\" and step two is \\"est\\" --",
		"the algorithm discovers a suffix without being told that suffixes",
		"exist. Step four is \\"low\\", a whole word, because \\"low\\" appears often",
		"enough that its pieces are the most frequent pair twice running. That",
		"is the entire reason byte-pair encoding works: frequent things become",
		"one token and rare things stay in pieces, and no linguistics is",
		"involved.",
		"",
		"The measurement is the part worth keeping. Greedy found the best",
		"possible order on 2687 of 3000 corpora and lost on 313, by as much as",
		"4 tokens. So the greedy choice is not optimal, and there is no",
		"tie-breaking rule that would fix it -- the exhaustive search really",
		"does find shorter encodings that the frequency-first rule walks past.",
		"",
		"That is the standard greedy situation from earlier in this track, and",
		"the standard resolution applies: the exhaustive search here costs",
		"pairs to the power of merges, and a real tokeniser makes tens of",
		"thousands of merges over a vocabulary of hundreds of thousands of",
		"pairs. Optimal is not available at that size. Greedy is roughly right",
		"nine times in ten and runs in one pass per merge, and being wrong 10%",
		"of the time by a few tokens is a price the field pays without",
		"noticing.",
	}, "\\n"))
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "why-greedy-anyway",
      heading: "Why greedy anyway",
      body: [
        "The measurement says greedy is wrong about ten percent of the time. The field uses it anyway, and the reason is the one from the greedy module: the exhaustive alternative does not exist at scale.",
        "The search tried above is *pairs to the power of merges*. Three merges over a handful of pairs is a few hundred states. A real tokeniser makes 30,000 to 100,000 merges over a corpus with hundreds of thousands of distinct adjacent pairs. There is no version of that search that finishes.",
        "Greedy, by contrast, is one pass over the corpus per merge, and each pass is a hash map of counts. It is the cheapest thing that could possibly work, it is roughly right nine times in ten, and being a few tokens off per document is a cost nobody can see.",
        "This is the honest shape of most greedy algorithms in production, and it is worth naming plainly: **the argument for greedy is rarely that it is optimal. It is that the optimal version is not available and greedy is close.** Saying that in an interview is a stronger answer than claiming an exchange argument you have not made.",
      ],
      pitfalls: [
        {
          title: "Assuming a token is a word",
          body: "It is whatever the merges produced. Common words are single tokens, rare words are several, and the same word can tokenise differently with and without a leading space -- which is why prompt formatting sometimes changes results in ways that look superstitious and are not.",
        },
        {
          title: "Assuming the tokeniser is trained with the model",
          body: "It is trained first, on its own corpus, and then frozen. Everything the model ever sees passes through a vocabulary fixed before training started.",
        },
        {
          title: "Assuming character count predicts token count",
          body: "It does not, and the ratio is worst exactly where it matters: code, non-English text, and long identifiers all tokenise far more expensively per character than ordinary English prose.",
        },
      ],
    },
    {
      id: "what-follows",
      heading: "What follows from the loop",
      body: [
        "Several things people find surprising about language models are consequences of this algorithm and nothing else.",
        "**Arithmetic is hard partly because of tokenisation.** Numbers split into pieces along merge boundaries, which are frequency artefacts, so `1234` might be one token and `1235` two. The model is not seeing digits in the way you assume it is.",
        "**Non-English text costs more.** The merges were learned from a corpus, and a script that was rare in that corpus never got merged into long tokens. The same sentence in a language with less training text can cost several times as many tokens, and you are billed per token.",
        "**Character-level tasks are unnaturally hard.** Asking how many times a letter appears in a word is asking about something below the model's input resolution \u2014 it received a handful of merged chunks, not letters.",
        "**Rare names get shattered.** An unusual surname may arrive as five fragments, which is why models are worse with rare proper nouns than with common ones, independent of how much they know about the person.",
        "None of these are mysteries about neural networks. They are all downstream of a greedy loop over a frequency map, which is why it is worth understanding the loop.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does byte-pair encoding work?",
      answer:
        "It is a greedy merge over a frequency map. Start with every character as its own symbol, count every adjacent pair weighted by how often its word occurs, merge the most frequent pair into one new symbol, recount, repeat until the vocabulary is the size you wanted. The vocabulary is just the list of merges in the order they were made. What is striking is what falls out with no linguistics involved -- running it on a small corpus, the second merge is 'est' and the fourth is the whole word 'low', because frequent things become single tokens and rare things stay in pieces.",
    },
    {
      question: "Is the greedy merge choice optimal?",
      answer:
        "No, and I measured it rather than assuming. Over 3,000 random small corpora with a budget of three merges, where every merge sequence can be tried exhaustively, greedy found the best possible order 2,687 times and lost 313 times by as much as 4 tokens. So it is right about ninety percent of the time and there is no tie-breaking rule that fixes the rest. It is used anyway because the exhaustive search is pairs to the power of merges, and a real tokeniser makes tens of thousands of merges over hundreds of thousands of pairs. The argument for greedy here is not that it is optimal, it is that optimal does not exist at that size and greedy is close.",
    },
    {
      question: "Why do language models struggle with arithmetic and counting letters?",
      answer:
        "Largely because of what tokenisation did to the input before the model saw it. Numbers split along merge boundaries that are frequency artefacts, so 1234 might be one token and 1235 two -- the model is not seeing digits the way you assume. Counting letters in a word is asking about something below the input resolution, because the word arrived as a few merged chunks rather than as characters. The same mechanism explains why non-English text costs several times more tokens and why rare surnames get shattered into fragments. All of it is downstream of that one greedy loop.",
    },
  ],
  takeaways: [
    "Byte-pair encoding is a greedy loop over a hash map of pair counts",
    "Merges discover suffixes and whole words with no linguistics involved",
    "Measured: greedy is the best order 2,687 of 3,000 times, losing by up to 4 tokens",
    "Exhaustive is pairs to the power of merges — unavailable at 50,000 merges",
    "The honest argument for greedy: optimal does not exist here, and greedy is close",
    "The tokeniser is trained first and frozen; the model never sees anything else",
    "Arithmetic, letter counting, and non-English cost are all downstream of this loop",
  ],
};
