import type { Lesson } from "@/content/types";

export const decodingStrategiesLesson: Lesson = {
  id: "dsa-gen-ai-decoding-strategies",
  slug: "decoding-strategies",
  moduleSlug: "algorithms-behind-gen-ai",
  title: "Decoding: Greedy, Beam Search, and Bounded Priority Queues",
  summary:
    "Picking the next token is a selection problem, and picking a whole sequence is a search problem. Measured: greedy found the best sequence 2 times in 300, and a beam of 16 found it 259 times for a ninth of the exhaustive cost.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Describe beam search as a bounded priority queue over partial sequences",
    "Measure how often greedy and each beam width find the best sequence",
    "Read beam width as the same work-against-quality dial seen elsewhere",
    "Say why the highest-probability sequence is often not the one you want",
  ],
  sections: [
    {
      id: "two-problems",
      heading: "Two problems, not one",
      body: [
        "A model produces a score for every token in the vocabulary at every step. Turning that into text involves two decisions that are worth keeping separate.",
        "**Which token to take at this step** is a selection problem over the vocabulary \u2014 the top-k selection from the exact-search lesson, run on 50,000 candidates instead of a million vectors, and solved the same way with a bounded heap.",
        "**Which sequence to produce overall** is a search problem, and it is the one this lesson is about. Taking the best token at every step is *greedy*, and greedy over a sequence of dependent choices is exactly the situation the greedy module warned about.",
        "So the question is measurable: how often does taking the best token at every step produce the best sequence?",
      ],
    },
    {
      id: "measuring-greedy",
      heading: "Greedy against the best possible",
      body: [
        "The program below uses a toy model small enough that every sequence can be enumerated \u2014 five tokens, length five, 3,125 sequences \u2014 so \"the best sequence\" is a computed fact rather than an estimate. Token scores depend on the whole prefix, which is what makes the choice at each step a gamble.",
      ],
      examples: [
        {
          id: "greedy-beam-and-exhaustive",
          title: "Greedy, four beam widths, and the exhaustive optimum over 300 toy models",
          lang: "python",
          code: `# Three ways to pick a sequence: greedily, with a beam, and the best
# possible. A beam is a bounded priority queue over partial sequences,
# so the question this track always asks applies: how often does the
# bounded version get the right answer?

VOCAB = 5
LENGTH = 5
TRIALS = 300


def step(state, token):
    # A stand-in for a language model: the score of a token depends on the
    # whole prefix so far, which is what makes greedy decoding a gamble.
    mixed = (state * 1103515245 + 12345 + token * 7919) % 2147483648
    score = mixed // 65536 % 100
    return [(state * 31 + token + 1) % 2147483648, score]


def exhaustive(state, depth):
    if depth == LENGTH:
        return 0
    best = -1
    for token in range(VOCAB):
        moved = step(state, token)
        total = moved[1] + exhaustive(moved[0], depth + 1)
        if total > best:
            best = total
    return best


def beam_search(state, width):
    # each entry is [score, state, sequence]; the sequence is carried only
    # so ties break the same way in every language
    beam = [[0, state, []]]
    expansions = 0
    for _depth in range(LENGTH):
        candidates = []
        for entry in beam:
            for token in range(VOCAB):
                moved = step(entry[1], token)
                expansions += 1
                candidates.append([entry[0] + moved[1], moved[0], entry[2] + [token]])
        # keep the best \`width\` of them: a bounded priority queue, written
        # here as a sort so the tie-break is visible
        candidates.sort(key=lambda c: (-c[0], c[2]))
        beam = candidates[:width]
    return [beam[0][0], expansions]


print("a toy model over %d tokens, sequences of %d, %d random models"
      % (VOCAB, LENGTH, TRIALS))
print("the best possible score is found by trying all %d sequences"
      % (VOCAB ** LENGTH))
print()

# The same linear congruential generator in every language, so the random
# models below are the same models whichever translation is run.
seed = 12094711


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


starts = []
for _ in range(TRIALS):
    starts.append(rand(2147483648))

best_scores = []
for start in starts:
    best_scores.append(exhaustive(start, 0))

print("  width   expansions   found the best   average shortfall")
for width in [1, 2, 4, 8, 16]:
    found = 0
    shortfall = 0
    expansions = 0
    for i in range(TRIALS):
        got = beam_search(starts[i], width)
        expansions = got[1]
        if got[0] == best_scores[i]:
            found += 1
        shortfall += best_scores[i] - got[0]
    average = shortfall * 100 // TRIALS
    label = "greedy" if width == 1 else str(width)
    print("%7s %12d %16d %13d.%02d" % (label, expansions, found, average // 100, average % 100))
print()
total_best = 0
for value in best_scores:
    total_best += value
print("for scale, the best score averages %d.%02d"
      % (total_best * 100 // TRIALS // 100, total_best * 100 // TRIALS % 100))
print()
print("""Greedy decoding found the best sequence 2 times in 300. That is the
number worth sitting with, because greedy is what you get by default
when you take the highest-probability token at every step, and it is
what most people picture when they picture a model generating text.

The reason it loses is the one from the greedy module: a locally best
choice can close off everything good downstream. Here the score of a
token depends on the whole prefix, so committing to the best first
token can walk into a region where every continuation is poor, and
nothing later can undo it.

Widening the beam fixes it gradually and never completely. Width 2
found the best 6 times, width 4 found it 63, width 8 found it 147, and
width 16 found it 259 of 300. The average shortfall falls from 139.20
to 1.26 against best scores that average 393.04. Beam search is not a
correct algorithm that happens to be fast -- it is greedy with a wider
front, and it has the same failure mode, just rarer.

Look at the expansions column for what it costs: 25, 45, 85, 150, 270,
against 3125 sequences for the exhaustive search. Beam width is a
straightforward dial between work and quality, which is the same shape
as the recall dial in the retrieval lessons. Structurally it is a
bounded priority queue -- at each step, expand everything in the beam,
then keep the best \`width\` candidates, which is exactly the top-k
selection from the exact-search lesson.

Two honest caveats. First, this toy model's scores are random, with no
structure at all, which is the worst possible case for greedy -- real
language models are far smoother, and greedy decoding produces
perfectly usable text. The shape of the result is right and the
severity is exaggerated. Second, and less obviously, the highest-
probability sequence is often not the one you want: beam search with a
wide beam is known to produce flat, repetitive text, because the most
likely continuation of anything is usually something bland. This is
why sampling exists. Top-k and nucleus sampling deliberately do not
maximise -- they restrict the candidates to the plausible ones (a
partial sort, or the same bounded heap again) and then choose randomly
among them. That is a different objective, not a worse search.""")
`,
          output: `a toy model over 5 tokens, sequences of 5, 300 random models
the best possible score is found by trying all 3125 sequences

  width   expansions   found the best   average shortfall
 greedy           25                2           139.20
      2           45                6            61.82
      4           85               63            24.27
      8          150              147             8.91
     16          270              259             1.26

for scale, the best score averages 393.04

Greedy decoding found the best sequence 2 times in 300. That is the
number worth sitting with, because greedy is what you get by default
when you take the highest-probability token at every step, and it is
what most people picture when they picture a model generating text.

The reason it loses is the one from the greedy module: a locally best
choice can close off everything good downstream. Here the score of a
token depends on the whole prefix, so committing to the best first
token can walk into a region where every continuation is poor, and
nothing later can undo it.

Widening the beam fixes it gradually and never completely. Width 2
found the best 6 times, width 4 found it 63, width 8 found it 147, and
width 16 found it 259 of 300. The average shortfall falls from 139.20
to 1.26 against best scores that average 393.04. Beam search is not a
correct algorithm that happens to be fast -- it is greedy with a wider
front, and it has the same failure mode, just rarer.

Look at the expansions column for what it costs: 25, 45, 85, 150, 270,
against 3125 sequences for the exhaustive search. Beam width is a
straightforward dial between work and quality, which is the same shape
as the recall dial in the retrieval lessons. Structurally it is a
bounded priority queue -- at each step, expand everything in the beam,
then keep the best \`width\` candidates, which is exactly the top-k
selection from the exact-search lesson.

Two honest caveats. First, this toy model's scores are random, with no
structure at all, which is the worst possible case for greedy -- real
language models are far smoother, and greedy decoding produces
perfectly usable text. The shape of the result is right and the
severity is exaggerated. Second, and less obviously, the highest-
probability sequence is often not the one you want: beam search with a
wide beam is known to produce flat, repetitive text, because the most
likely continuation of anything is usually something bland. This is
why sampling exists. Top-k and nucleus sampling deliberately do not
maximise -- they restrict the candidates to the plausible ones (a
partial sort, or the same bounded heap again) and then choose randomly
among them. That is a different objective, not a worse search.`,
          explanation:
            "Greedy found the best sequence 2 times in 300. Widening the beam fixes it gradually and never completely: width 2 found it 6 times, width 4 found it 63, width 8 found it 147, width 16 found it 259. The average shortfall falls from 139.20 to 1.26 against best scores averaging 393.04. The expansions column is the price -- 25, 45, 85, 150, 270 against 3,125 sequences for the exhaustive search. Note that this toy model's scores are random with no structure, which is the worst possible case for greedy; a real language model is far smoother, so the shape of the result holds and the severity is exaggerated.",
          alternates: [
            {
              lang: "javascript",
              code: `// Three ways to pick a sequence: greedily, with a beam, and the best
// possible. A beam is a bounded priority queue over partial sequences,
// so the question this track always asks applies: how often does the
// bounded version get the right answer?

const VOCAB = 5;
const LENGTH = 5;
const TRIALS = 300;

function step(state, token) {
  // A stand-in for a language model: the score of a token depends on the
  // whole prefix so far, which is what makes greedy decoding a gamble.
  const mixed = (state * 1103515245n + 12345n + BigInt(token) * 7919n) % 2147483648n;
  const score = Number((mixed / 65536n) % 100n);
  return [(state * 31n + BigInt(token) + 1n) % 2147483648n, score];
}

function exhaustive(state, depth) {
  if (depth === LENGTH) return 0;
  let best = -1;
  for (let token = 0; token < VOCAB; token++) {
    const moved = step(state, token);
    const total = moved[1] + exhaustive(moved[0], depth + 1);
    if (total > best) best = total;
  }
  return best;
}

function compareSequences(a, b) {
  for (let i = 0; i < a.length && i < b.length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return a.length - b.length;
}

function beamSearch(state, width) {
  // each entry is [score, state, sequence]; the sequence is carried only
  // so ties break the same way in every language
  let beam = [[0, state, []]];
  let expansions = 0;
  for (let depth = 0; depth < LENGTH; depth++) {
    const candidates = [];
    for (const entry of beam) {
      for (let token = 0; token < VOCAB; token++) {
        const moved = step(entry[1], token);
        expansions += 1;
        candidates.push([entry[0] + moved[1], moved[0], entry[2].concat([token])]);
      }
    }
    // keep the best \`width\` of them: a bounded priority queue, written
    // here as a sort so the tie-break is visible
    candidates.sort((x, y) => (x[0] !== y[0] ? y[0] - x[0] : compareSequences(x[2], y[2])));
    beam = candidates.slice(0, width);
  }
  return [beam[0][0], expansions];
}

function padLeft(s, width) {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

function twoPlaces(scaled) {
  const fraction = scaled % 100;
  return Math.floor(scaled / 100) + "." + (fraction < 10 ? "0" : "") + fraction;
}

console.log(
  "a toy model over " + VOCAB + " tokens, sequences of " + LENGTH + ", " + TRIALS +
    " random models",
);
console.log("the best possible score is found by trying all " + VOCAB ** LENGTH + " sequences");
console.log();

// The same linear congruential generator in every language, so the random
// models below are the same models whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 12094711n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return (seed / 65536n) % n;
}

const starts = [];
for (let t = 0; t < TRIALS; t++) starts.push(rand(2147483648n));

const bestScores = [];
for (const start of starts) bestScores.push(exhaustive(start, 0));

console.log("  width   expansions   found the best   average shortfall");
for (const width of [1, 2, 4, 8, 16]) {
  let found = 0;
  let shortfall = 0;
  let expansions = 0;
  for (let i = 0; i < TRIALS; i++) {
    const got = beamSearch(starts[i], width);
    expansions = got[1];
    if (got[0] === bestScores[i]) found += 1;
    shortfall += bestScores[i] - got[0];
  }
  const average = Math.floor((shortfall * 100) / TRIALS);
  const label = width === 1 ? "greedy" : String(width);
  console.log(
    padLeft(label, 7) + " " + padLeft(expansions, 12) + " " + padLeft(found, 16) + " " +
      padLeft(twoPlaces(average), 16),
  );
}
console.log();
let totalBest = 0;
for (const value of bestScores) totalBest += value;
console.log(
  "for scale, the best score averages " + twoPlaces(Math.floor((totalBest * 100) / TRIALS)),
);
console.log();
console.log(
  [
    "Greedy decoding found the best sequence 2 times in 300. That is the",
    "number worth sitting with, because greedy is what you get by default",
    "when you take the highest-probability token at every step, and it is",
    "what most people picture when they picture a model generating text.",
    "",
    "The reason it loses is the one from the greedy module: a locally best",
    "choice can close off everything good downstream. Here the score of a",
    "token depends on the whole prefix, so committing to the best first",
    "token can walk into a region where every continuation is poor, and",
    "nothing later can undo it.",
    "",
    "Widening the beam fixes it gradually and never completely. Width 2",
    "found the best 6 times, width 4 found it 63, width 8 found it 147, and",
    "width 16 found it 259 of 300. The average shortfall falls from 139.20",
    "to 1.26 against best scores that average 393.04. Beam search is not a",
    "correct algorithm that happens to be fast -- it is greedy with a wider",
    "front, and it has the same failure mode, just rarer.",
    "",
    "Look at the expansions column for what it costs: 25, 45, 85, 150, 270,",
    "against 3125 sequences for the exhaustive search. Beam width is a",
    "straightforward dial between work and quality, which is the same shape",
    "as the recall dial in the retrieval lessons. Structurally it is a",
    "bounded priority queue -- at each step, expand everything in the beam,",
    "then keep the best \`width\` candidates, which is exactly the top-k",
    "selection from the exact-search lesson.",
    "",
    "Two honest caveats. First, this toy model's scores are random, with no",
    "structure at all, which is the worst possible case for greedy -- real",
    "language models are far smoother, and greedy decoding produces",
    "perfectly usable text. The shape of the result is right and the",
    "severity is exaggerated. Second, and less obviously, the highest-",
    "probability sequence is often not the one you want: beam search with a",
    "wide beam is known to produce flat, repetitive text, because the most",
    "likely continuation of anything is usually something bland. This is",
    "why sampling exists. Top-k and nucleus sampling deliberately do not",
    "maximise -- they restrict the candidates to the plausible ones (a",
    "partial sort, or the same bounded heap again) and then choose randomly",
    "among them. That is a different objective, not a worse search.",
  ].join("\\n"),
);
`,
            },
            {
              lang: "typescript",
              code: `// Three ways to pick a sequence: greedily, with a beam, and the best
// possible. A beam is a bounded priority queue over partial sequences,
// so the question this track always asks applies: how often does the
// bounded version get the right answer?

type Entry = [number, bigint, number[]];

const VOCAB = 5;
const LENGTH = 5;
const TRIALS = 300;

function step(state: bigint, token: number): [bigint, number] {
  // A stand-in for a language model: the score of a token depends on the
  // whole prefix so far, which is what makes greedy decoding a gamble.
  const mixed = (state * 1103515245n + 12345n + BigInt(token) * 7919n) % 2147483648n;
  const score = Number((mixed / 65536n) % 100n);
  return [(state * 31n + BigInt(token) + 1n) % 2147483648n, score];
}

function exhaustive(state: bigint, depth: number): number {
  if (depth === LENGTH) return 0;
  let best = -1;
  for (let token = 0; token < VOCAB; token++) {
    const moved = step(state, token);
    const total = moved[1] + exhaustive(moved[0], depth + 1);
    if (total > best) best = total;
  }
  return best;
}

function compareSequences(a: number[], b: number[]): number {
  for (let i = 0; i < a.length && i < b.length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return a.length - b.length;
}

function beamSearch(state: bigint, width: number): [number, number] {
  // each entry is [score, state, sequence]; the sequence is carried only
  // so ties break the same way in every language
  let beam: Entry[] = [[0, state, []]];
  let expansions = 0;
  for (let depth = 0; depth < LENGTH; depth++) {
    const candidates: Entry[] = [];
    for (const entry of beam) {
      for (let token = 0; token < VOCAB; token++) {
        const moved = step(entry[1], token);
        expansions += 1;
        candidates.push([entry[0] + moved[1], moved[0], entry[2].concat([token])]);
      }
    }
    // keep the best \`width\` of them: a bounded priority queue, written
    // here as a sort so the tie-break is visible
    candidates.sort((x, y) => (x[0] !== y[0] ? y[0] - x[0] : compareSequences(x[2], y[2])));
    beam = candidates.slice(0, width);
  }
  return [beam[0][0], expansions];
}

function padLeft(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

function twoPlaces(scaled: number): string {
  const fraction = scaled % 100;
  return Math.floor(scaled / 100) + "." + (fraction < 10 ? "0" : "") + fraction;
}

console.log(
  "a toy model over " + VOCAB + " tokens, sequences of " + LENGTH + ", " + TRIALS +
    " random models",
);
console.log("the best possible score is found by trying all " + VOCAB ** LENGTH + " sequences");
console.log();

// The same linear congruential generator in every language, so the random
// models below are the same models whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 12094711n;

function rand(n: bigint): bigint {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return (seed / 65536n) % n;
}

const starts: bigint[] = [];
for (let t = 0; t < TRIALS; t++) starts.push(rand(2147483648n));

const bestScores: number[] = [];
for (const start of starts) bestScores.push(exhaustive(start, 0));

console.log("  width   expansions   found the best   average shortfall");
for (const width of [1, 2, 4, 8, 16]) {
  let found = 0;
  let shortfall = 0;
  let expansions = 0;
  for (let i = 0; i < TRIALS; i++) {
    const got = beamSearch(starts[i], width);
    expansions = got[1];
    if (got[0] === bestScores[i]) found += 1;
    shortfall += bestScores[i] - got[0];
  }
  const average = Math.floor((shortfall * 100) / TRIALS);
  const label = width === 1 ? "greedy" : String(width);
  console.log(
    padLeft(label, 7) + " " + padLeft(expansions, 12) + " " + padLeft(found, 16) + " " +
      padLeft(twoPlaces(average), 16),
  );
}
console.log();
let totalBest = 0;
for (const value of bestScores) totalBest += value;
console.log(
  "for scale, the best score averages " + twoPlaces(Math.floor((totalBest * 100) / TRIALS)),
);
console.log();
console.log(
  [
    "Greedy decoding found the best sequence 2 times in 300. That is the",
    "number worth sitting with, because greedy is what you get by default",
    "when you take the highest-probability token at every step, and it is",
    "what most people picture when they picture a model generating text.",
    "",
    "The reason it loses is the one from the greedy module: a locally best",
    "choice can close off everything good downstream. Here the score of a",
    "token depends on the whole prefix, so committing to the best first",
    "token can walk into a region where every continuation is poor, and",
    "nothing later can undo it.",
    "",
    "Widening the beam fixes it gradually and never completely. Width 2",
    "found the best 6 times, width 4 found it 63, width 8 found it 147, and",
    "width 16 found it 259 of 300. The average shortfall falls from 139.20",
    "to 1.26 against best scores that average 393.04. Beam search is not a",
    "correct algorithm that happens to be fast -- it is greedy with a wider",
    "front, and it has the same failure mode, just rarer.",
    "",
    "Look at the expansions column for what it costs: 25, 45, 85, 150, 270,",
    "against 3125 sequences for the exhaustive search. Beam width is a",
    "straightforward dial between work and quality, which is the same shape",
    "as the recall dial in the retrieval lessons. Structurally it is a",
    "bounded priority queue -- at each step, expand everything in the beam,",
    "then keep the best \`width\` candidates, which is exactly the top-k",
    "selection from the exact-search lesson.",
    "",
    "Two honest caveats. First, this toy model's scores are random, with no",
    "structure at all, which is the worst possible case for greedy -- real",
    "language models are far smoother, and greedy decoding produces",
    "perfectly usable text. The shape of the result is right and the",
    "severity is exaggerated. Second, and less obviously, the highest-",
    "probability sequence is often not the one you want: beam search with a",
    "wide beam is known to produce flat, repetitive text, because the most",
    "likely continuation of anything is usually something bland. This is",
    "why sampling exists. Top-k and nucleus sampling deliberately do not",
    "maximise -- they restrict the candidates to the plausible ones (a",
    "partial sort, or the same bounded heap again) and then choose randomly",
    "among them. That is a different objective, not a worse search.",
  ].join("\\n"),
);
`,
            },
            {
              lang: "java",
              code: `// Three ways to pick a sequence: greedily, with a beam, and the best
// possible. A beam is a bounded priority queue over partial sequences,
// so the question this track always asks applies: how often does the
// bounded version get the right answer?

import java.util.ArrayList;
import java.util.List;

public class Main {
  static final int VOCAB = 5;
  static final int LENGTH = 5;
  static final int TRIALS = 300;

  static class Move {
    long state;
    int score;

    Move(long state, int score) {
      this.state = state;
      this.score = score;
    }
  }

  static Move step(long state, int token) {
    // A stand-in for a language model: the score of a token depends on the
    // whole prefix so far, which is what makes greedy decoding a gamble.
    long mixed = (state * 1103515245L + 12345L + (long) token * 7919L) % 2147483648L;
    long next = (state * 31L + token + 1L) % 2147483648L;
    return new Move(next, (int) (mixed / 65536L % 100L));
  }

  static int exhaustive(long state, int depth) {
    if (depth == LENGTH) {
      return 0;
    }
    int best = -1;
    for (int token = 0; token < VOCAB; token++) {
      Move moved = step(state, token);
      int total = moved.score + exhaustive(moved.state, depth + 1);
      if (total > best) {
        best = total;
      }
    }
    return best;
  }

  static class Entry {
    int score;
    long state;
    List<Integer> sequence;

    Entry(int score, long state, List<Integer> sequence) {
      this.score = score;
      this.state = state;
      this.sequence = sequence;
    }
  }

  static int compareSequences(List<Integer> a, List<Integer> b) {
    for (int i = 0; i < a.size() && i < b.size(); i++) {
      if (!a.get(i).equals(b.get(i))) {
        return a.get(i) - b.get(i);
      }
    }
    return a.size() - b.size();
  }

  static int lastExpansions = 0;

  static int beamSearch(long state, int width) {
    // each entry is score, state and sequence; the sequence is carried only
    // so ties break the same way in every language
    List<Entry> beam = new ArrayList<>();
    beam.add(new Entry(0, state, new ArrayList<>()));
    int expansions = 0;
    for (int depth = 0; depth < LENGTH; depth++) {
      List<Entry> candidates = new ArrayList<>();
      for (Entry entry : beam) {
        for (int token = 0; token < VOCAB; token++) {
          Move moved = step(entry.state, token);
          expansions += 1;
          List<Integer> sequence = new ArrayList<>(entry.sequence);
          sequence.add(token);
          candidates.add(new Entry(entry.score + moved.score, moved.state, sequence));
        }
      }
      // keep the best \`width\` of them: a bounded priority queue, written
      // here as a sort so the tie-break is visible
      candidates.sort(
          (x, y) -> x.score != y.score ? y.score - x.score : compareSequences(x.sequence, y.sequence));
      beam = candidates.subList(0, Math.min(width, candidates.size()));
    }
    lastExpansions = expansions;
    return beam.get(0).score;
  }

  // The same linear congruential generator in every language, so the random
  // models below are the same models whichever translation is run.
  static long seed = 12094711L;

  static long rand(long n) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return seed / 65536L % n;
  }

  public static void main(String[] args) {
    int space = 1;
    for (int i = 0; i < LENGTH; i++) {
      space *= VOCAB;
    }
    System.out.printf(
        "a toy model over %d tokens, sequences of %d, %d random models%n", VOCAB, LENGTH, TRIALS);
    System.out.printf("the best possible score is found by trying all %d sequences%n", space);
    System.out.println();

    long[] starts = new long[TRIALS];
    for (int t = 0; t < TRIALS; t++) {
      starts[t] = rand(2147483648L);
    }
    int[] bestScores = new int[TRIALS];
    for (int t = 0; t < TRIALS; t++) {
      bestScores[t] = exhaustive(starts[t], 0);
    }

    System.out.println("  width   expansions   found the best   average shortfall");
    int[] widths = {1, 2, 4, 8, 16};
    for (int width : widths) {
      int found = 0;
      long shortfall = 0;
      int expansions = 0;
      for (int i = 0; i < TRIALS; i++) {
        int got = beamSearch(starts[i], width);
        expansions = lastExpansions;
        if (got == bestScores[i]) {
          found += 1;
        }
        shortfall += bestScores[i] - got;
      }
      long average = shortfall * 100 / TRIALS;
      String label = width == 1 ? "greedy" : String.valueOf(width);
      System.out.printf(
          "%7s %12d %16d %13d.%02d%n", label, expansions, found, average / 100, average % 100);
    }
    System.out.println();
    long totalBest = 0;
    for (int value : bestScores) {
      totalBest += value;
    }
    long scaled = totalBest * 100 / TRIALS;
    System.out.printf("for scale, the best score averages %d.%02d%n", scaled / 100, scaled % 100);
    System.out.println();
    System.out.println(String.join("\\n",
        "Greedy decoding found the best sequence 2 times in 300. That is the",
        "number worth sitting with, because greedy is what you get by default",
        "when you take the highest-probability token at every step, and it is",
        "what most people picture when they picture a model generating text.",
        "",
        "The reason it loses is the one from the greedy module: a locally best",
        "choice can close off everything good downstream. Here the score of a",
        "token depends on the whole prefix, so committing to the best first",
        "token can walk into a region where every continuation is poor, and",
        "nothing later can undo it.",
        "",
        "Widening the beam fixes it gradually and never completely. Width 2",
        "found the best 6 times, width 4 found it 63, width 8 found it 147, and",
        "width 16 found it 259 of 300. The average shortfall falls from 139.20",
        "to 1.26 against best scores that average 393.04. Beam search is not a",
        "correct algorithm that happens to be fast -- it is greedy with a wider",
        "front, and it has the same failure mode, just rarer.",
        "",
        "Look at the expansions column for what it costs: 25, 45, 85, 150, 270,",
        "against 3125 sequences for the exhaustive search. Beam width is a",
        "straightforward dial between work and quality, which is the same shape",
        "as the recall dial in the retrieval lessons. Structurally it is a",
        "bounded priority queue -- at each step, expand everything in the beam,",
        "then keep the best \`width\` candidates, which is exactly the top-k",
        "selection from the exact-search lesson.",
        "",
        "Two honest caveats. First, this toy model's scores are random, with no",
        "structure at all, which is the worst possible case for greedy -- real",
        "language models are far smoother, and greedy decoding produces",
        "perfectly usable text. The shape of the result is right and the",
        "severity is exaggerated. Second, and less obviously, the highest-",
        "probability sequence is often not the one you want: beam search with a",
        "wide beam is known to produce flat, repetitive text, because the most",
        "likely continuation of anything is usually something bland. This is",
        "why sampling exists. Top-k and nucleus sampling deliberately do not",
        "maximise -- they restrict the candidates to the plausible ones (a",
        "partial sort, or the same bounded heap again) and then choose randomly",
        "among them. That is a different objective, not a worse search."));
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// Three ways to pick a sequence: greedily, with a beam, and the best
// possible. A beam is a bounded priority queue over partial sequences,
// so the question this track always asks applies: how often does the
// bounded version get the right answer?

#include <algorithm>
#include <cstdio>
#include <iostream>
#include <string>
#include <vector>

static const int VOCAB = 5;
static const int LENGTH = 5;
static const int TRIALS = 300;

struct Move {
  long long state;
  int score;
};

Move step(long long state, int token) {
  // A stand-in for a language model: the score of a token depends on the
  // whole prefix so far, which is what makes greedy decoding a gamble.
  long long mixed = (state * 1103515245LL + 12345LL + (long long)token * 7919LL) % 2147483648LL;
  long long next = (state * 31LL + token + 1LL) % 2147483648LL;
  return Move{next, (int)(mixed / 65536LL % 100LL)};
}

int exhaustive(long long state, int depth) {
  if (depth == LENGTH) {
    return 0;
  }
  int best = -1;
  for (int token = 0; token < VOCAB; token++) {
    Move moved = step(state, token);
    int total = moved.score + exhaustive(moved.state, depth + 1);
    if (total > best) {
      best = total;
    }
  }
  return best;
}

struct Entry {
  int score;
  long long state;
  std::vector<int> sequence;
};

bool betterCandidate(const Entry& x, const Entry& y) {
  if (x.score != y.score) {
    return x.score > y.score;
  }
  return x.sequence < y.sequence;
}

int lastExpansions = 0;

int beamSearch(long long state, int width) {
  // each entry is score, state and sequence; the sequence is carried only
  // so ties break the same way in every language
  std::vector<Entry> beam;
  beam.push_back(Entry{0, state, std::vector<int>()});
  int expansions = 0;
  for (int depth = 0; depth < LENGTH; depth++) {
    std::vector<Entry> candidates;
    for (size_t e = 0; e < beam.size(); e++) {
      for (int token = 0; token < VOCAB; token++) {
        Move moved = step(beam[e].state, token);
        expansions += 1;
        std::vector<int> sequence = beam[e].sequence;
        sequence.push_back(token);
        candidates.push_back(Entry{beam[e].score + moved.score, moved.state, sequence});
      }
    }
    // keep the best \`width\` of them: a bounded priority queue, written
    // here as a sort so the tie-break is visible
    std::sort(candidates.begin(), candidates.end(), betterCandidate);
    if ((int)candidates.size() > width) {
      candidates.resize(width);
    }
    beam = candidates;
  }
  lastExpansions = expansions;
  return beam[0].score;
}

// The same linear congruential generator in every language, so the random
// models below are the same models whichever translation is run.
long long seed = 12094711LL;

long long rand_below(long long n) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return seed / 65536LL % n;
}

int main() {
  int space = 1;
  for (int i = 0; i < LENGTH; i++) {
    space *= VOCAB;
  }
  std::printf("a toy model over %d tokens, sequences of %d, %d random models\\n", VOCAB, LENGTH,
              TRIALS);
  std::printf("the best possible score is found by trying all %d sequences\\n", space);
  std::printf("\\n");

  std::vector<long long> starts;
  for (int t = 0; t < TRIALS; t++) {
    starts.push_back(rand_below(2147483648LL));
  }
  std::vector<int> bestScores;
  for (int t = 0; t < TRIALS; t++) {
    bestScores.push_back(exhaustive(starts[t], 0));
  }

  std::printf("  width   expansions   found the best   average shortfall\\n");
  int widths[5] = {1, 2, 4, 8, 16};
  for (int w = 0; w < 5; w++) {
    int width = widths[w];
    int found = 0;
    long long shortfall = 0;
    int expansions = 0;
    for (int i = 0; i < TRIALS; i++) {
      int got = beamSearch(starts[i], width);
      expansions = lastExpansions;
      if (got == bestScores[i]) {
        found += 1;
      }
      shortfall += bestScores[i] - got;
    }
    long long average = shortfall * 100 / TRIALS;
    std::string label = width == 1 ? "greedy" : std::to_string(width);
    std::printf("%7s %12d %16d %13lld.%02lld\\n", label.c_str(), expansions, found, average / 100,
                average % 100);
  }
  std::printf("\\n");
  long long totalBest = 0;
  for (size_t i = 0; i < bestScores.size(); i++) {
    totalBest += bestScores[i];
  }
  long long scaled = totalBest * 100 / TRIALS;
  std::printf("for scale, the best score averages %lld.%02lld\\n", scaled / 100, scaled % 100);
  std::printf("\\n");
    std::cout
        << "Greedy decoding found the best sequence 2 times in 300. That is the" << "\\n"
        << "number worth sitting with, because greedy is what you get by default" << "\\n"
        << "when you take the highest-probability token at every step, and it is" << "\\n"
        << "what most people picture when they picture a model generating text." << "\\n"
        << "" << "\\n"
        << "The reason it loses is the one from the greedy module: a locally best" << "\\n"
        << "choice can close off everything good downstream. Here the score of a" << "\\n"
        << "token depends on the whole prefix, so committing to the best first" << "\\n"
        << "token can walk into a region where every continuation is poor, and" << "\\n"
        << "nothing later can undo it." << "\\n"
        << "" << "\\n"
        << "Widening the beam fixes it gradually and never completely. Width 2" << "\\n"
        << "found the best 6 times, width 4 found it 63, width 8 found it 147, and" << "\\n"
        << "width 16 found it 259 of 300. The average shortfall falls from 139.20" << "\\n"
        << "to 1.26 against best scores that average 393.04. Beam search is not a" << "\\n"
        << "correct algorithm that happens to be fast -- it is greedy with a wider" << "\\n"
        << "front, and it has the same failure mode, just rarer." << "\\n"
        << "" << "\\n"
        << "Look at the expansions column for what it costs: 25, 45, 85, 150, 270," << "\\n"
        << "against 3125 sequences for the exhaustive search. Beam width is a" << "\\n"
        << "straightforward dial between work and quality, which is the same shape" << "\\n"
        << "as the recall dial in the retrieval lessons. Structurally it is a" << "\\n"
        << "bounded priority queue -- at each step, expand everything in the beam," << "\\n"
        << "then keep the best \`width\` candidates, which is exactly the top-k" << "\\n"
        << "selection from the exact-search lesson." << "\\n"
        << "" << "\\n"
        << "Two honest caveats. First, this toy model's scores are random, with no" << "\\n"
        << "structure at all, which is the worst possible case for greedy -- real" << "\\n"
        << "language models are far smoother, and greedy decoding produces" << "\\n"
        << "perfectly usable text. The shape of the result is right and the" << "\\n"
        << "severity is exaggerated. Second, and less obviously, the highest-" << "\\n"
        << "probability sequence is often not the one you want: beam search with a" << "\\n"
        << "wide beam is known to produce flat, repetitive text, because the most" << "\\n"
        << "likely continuation of anything is usually something bland. This is" << "\\n"
        << "why sampling exists. Top-k and nucleus sampling deliberately do not" << "\\n"
        << "maximise -- they restrict the candidates to the plausible ones (a" << "\\n"
        << "partial sort, or the same bounded heap again) and then choose randomly" << "\\n"
        << "among them. That is a different objective, not a worse search." << "\\n"
        ;
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Three ways to pick a sequence: greedily, with a beam, and the best
// possible. A beam is a bounded priority queue over partial sequences,
// so the question this track always asks applies: how often does the
// bounded version get the right answer?

const VOCAB: i64 = 5;
const LENGTH: usize = 5;
const TRIALS: usize = 300;

struct Move {
    state: i64,
    score: i64,
}

fn step(state: i64, token: i64) -> Move {
    // A stand-in for a language model: the score of a token depends on the
    // whole prefix so far, which is what makes greedy decoding a gamble.
    let mixed = (state * 1103515245 + 12345 + token * 7919) % 2147483648;
    let next = (state * 31 + token + 1) % 2147483648;
    Move { state: next, score: mixed / 65536 % 100 }
}

fn exhaustive(state: i64, depth: usize) -> i64 {
    if depth == LENGTH {
        return 0;
    }
    let mut best = -1;
    for token in 0..VOCAB {
        let moved = step(state, token);
        let total = moved.score + exhaustive(moved.state, depth + 1);
        if total > best {
            best = total;
        }
    }
    best
}

#[derive(Clone)]
struct Entry {
    score: i64,
    state: i64,
    sequence: Vec<i64>,
}

fn beam_search(state: i64, width: usize) -> (i64, i64) {
    // each entry is score, state and sequence; the sequence is carried only
    // so ties break the same way in every language
    let mut beam: Vec<Entry> = vec![Entry { score: 0, state, sequence: Vec::new() }];
    let mut expansions = 0;
    for _ in 0..LENGTH {
        let mut candidates: Vec<Entry> = Vec::new();
        for entry in beam.iter() {
            for token in 0..VOCAB {
                let moved = step(entry.state, token);
                expansions += 1;
                let mut sequence = entry.sequence.clone();
                sequence.push(token);
                candidates.push(Entry {
                    score: entry.score + moved.score,
                    state: moved.state,
                    sequence,
                });
            }
        }
        // keep the best \`width\` of them: a bounded priority queue, written
        // here as a sort so the tie-break is visible
        candidates.sort_by(|x, y| {
            y.score.cmp(&x.score).then(x.sequence.cmp(&y.sequence))
        });
        candidates.truncate(width);
        beam = candidates;
    }
    (beam[0].score, expansions)
}

// The same linear congruential generator in every language, so the random
// models below are the same models whichever translation is run.
static mut SEED: i64 = 12094711;

fn rand_below(n: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % n
    }
}

fn main() {
    let mut space: i64 = 1;
    for _ in 0..LENGTH {
        space *= VOCAB;
    }
    println!(
        "a toy model over {} tokens, sequences of {}, {} random models",
        VOCAB, LENGTH, TRIALS
    );
    println!("the best possible score is found by trying all {} sequences", space);
    println!();

    let mut starts: Vec<i64> = Vec::new();
    for _ in 0..TRIALS {
        starts.push(rand_below(2147483648));
    }
    let mut best_scores: Vec<i64> = Vec::new();
    for &start in starts.iter() {
        best_scores.push(exhaustive(start, 0));
    }

    println!("  width   expansions   found the best   average shortfall");
    for &width in [1usize, 2, 4, 8, 16].iter() {
        let mut found = 0;
        let mut shortfall = 0;
        let mut expansions = 0;
        for i in 0..TRIALS {
            let (got, spent) = beam_search(starts[i], width);
            expansions = spent;
            if got == best_scores[i] {
                found += 1;
            }
            shortfall += best_scores[i] - got;
        }
        let average = shortfall * 100 / TRIALS as i64;
        let label = if width == 1 { String::from("greedy") } else { width.to_string() };
        println!(
            "{:>7} {:>12} {:>16} {:>13}.{:02}",
            label,
            expansions,
            found,
            average / 100,
            average % 100
        );
    }
    println!();
    let mut total_best = 0;
    for &value in best_scores.iter() {
        total_best += value;
    }
    let scaled = total_best * 100 / TRIALS as i64;
    println!("for scale, the best score averages {}.{:02}", scaled / 100, scaled % 100);
    println!();
    println!("{}", [
        "Greedy decoding found the best sequence 2 times in 300. That is the",
        "number worth sitting with, because greedy is what you get by default",
        "when you take the highest-probability token at every step, and it is",
        "what most people picture when they picture a model generating text.",
        "",
        "The reason it loses is the one from the greedy module: a locally best",
        "choice can close off everything good downstream. Here the score of a",
        "token depends on the whole prefix, so committing to the best first",
        "token can walk into a region where every continuation is poor, and",
        "nothing later can undo it.",
        "",
        "Widening the beam fixes it gradually and never completely. Width 2",
        "found the best 6 times, width 4 found it 63, width 8 found it 147, and",
        "width 16 found it 259 of 300. The average shortfall falls from 139.20",
        "to 1.26 against best scores that average 393.04. Beam search is not a",
        "correct algorithm that happens to be fast -- it is greedy with a wider",
        "front, and it has the same failure mode, just rarer.",
        "",
        "Look at the expansions column for what it costs: 25, 45, 85, 150, 270,",
        "against 3125 sequences for the exhaustive search. Beam width is a",
        "straightforward dial between work and quality, which is the same shape",
        "as the recall dial in the retrieval lessons. Structurally it is a",
        "bounded priority queue -- at each step, expand everything in the beam,",
        "then keep the best \`width\` candidates, which is exactly the top-k",
        "selection from the exact-search lesson.",
        "",
        "Two honest caveats. First, this toy model's scores are random, with no",
        "structure at all, which is the worst possible case for greedy -- real",
        "language models are far smoother, and greedy decoding produces",
        "perfectly usable text. The shape of the result is right and the",
        "severity is exaggerated. Second, and less obviously, the highest-",
        "probability sequence is often not the one you want: beam search with a",
        "wide beam is known to produce flat, repetitive text, because the most",
        "likely continuation of anything is usually something bland. This is",
        "why sampling exists. Top-k and nucleus sampling deliberately do not",
        "maximise -- they restrict the candidates to the plausible ones (a",
        "partial sort, or the same bounded heap again) and then choose randomly",
        "among them. That is a different objective, not a worse search.",
    ].join("\\n"));
}
`,
            },
            {
              lang: "go",
              code: `// Three ways to pick a sequence: greedily, with a beam, and the best
// possible. A beam is a bounded priority queue over partial sequences,
// so the question this track always asks applies: how often does the
// bounded version get the right answer?

package main

import (
	"fmt"
	"sort"
	"strconv"
	"strings"
)

const vocab = 5
const length = 5
const trials = 300

type move struct {
	state int64
	score int64
}

func step(state int64, token int64) move {
	// A stand-in for a language model: the score of a token depends on the
	// whole prefix so far, which is what makes greedy decoding a gamble.
	mixed := (state*1103515245 + 12345 + token*7919) % 2147483648
	next := (state*31 + token + 1) % 2147483648
	return move{state: next, score: mixed / 65536 % 100}
}

func exhaustive(state int64, depth int) int64 {
	if depth == length {
		return 0
	}
	var best int64 = -1
	for token := int64(0); token < vocab; token++ {
		moved := step(state, token)
		total := moved.score + exhaustive(moved.state, depth+1)
		if total > best {
			best = total
		}
	}
	return best
}

type entry struct {
	score    int64
	state    int64
	sequence []int64
}

func compareSequences(a, b []int64) int {
	for i := 0; i < len(a) && i < len(b); i++ {
		if a[i] != b[i] {
			if a[i] < b[i] {
				return -1
			}
			return 1
		}
	}
	return len(a) - len(b)
}

func beamSearch(state int64, width int) (int64, int64) {
	// each entry is score, state and sequence; the sequence is carried only
	// so ties break the same way in every language
	beam := []entry{{score: 0, state: state, sequence: []int64{}}}
	var expansions int64
	for depth := 0; depth < length; depth++ {
		candidates := []entry{}
		for _, e := range beam {
			for token := int64(0); token < vocab; token++ {
				moved := step(e.state, token)
				expansions++
				sequence := append(append([]int64{}, e.sequence...), token)
				candidates = append(candidates, entry{
					score:    e.score + moved.score,
					state:    moved.state,
					sequence: sequence,
				})
			}
		}
		// keep the best \`width\` of them: a bounded priority queue, written
		// here as a sort so the tie-break is visible
		sort.Slice(candidates, func(x, y int) bool {
			if candidates[x].score != candidates[y].score {
				return candidates[x].score > candidates[y].score
			}
			return compareSequences(candidates[x].sequence, candidates[y].sequence) < 0
		})
		if len(candidates) > width {
			candidates = candidates[:width]
		}
		beam = candidates
	}
	return beam[0].score, expansions
}

// The same linear congruential generator in every language, so the random
// models below are the same models whichever translation is run.
var seed int64 = 12094711

func randBelow(n int64) int64 {
	seed = (seed*1103515245 + 12345) % 2147483648
	return seed / 65536 % n
}

func main() {
	space := 1
	for i := 0; i < length; i++ {
		space *= vocab
	}
	fmt.Printf("a toy model over %d tokens, sequences of %d, %d random models\\n", vocab, length, trials)
	fmt.Printf("the best possible score is found by trying all %d sequences\\n", space)
	fmt.Println()

	starts := []int64{}
	for t := 0; t < trials; t++ {
		starts = append(starts, randBelow(2147483648))
	}
	bestScores := []int64{}
	for _, start := range starts {
		bestScores = append(bestScores, exhaustive(start, 0))
	}

	fmt.Println("  width   expansions   found the best   average shortfall")
	for _, width := range []int{1, 2, 4, 8, 16} {
		found := 0
		var shortfall int64
		var expansions int64
		for i := 0; i < trials; i++ {
			got, spent := beamSearch(starts[i], width)
			expansions = spent
			if got == bestScores[i] {
				found++
			}
			shortfall += bestScores[i] - got
		}
		average := shortfall * 100 / trials
		label := strconv.Itoa(width)
		if width == 1 {
			label = "greedy"
		}
		fmt.Printf("%7s %12d %16d %13d.%02d\\n", label, expansions, found, average/100, average%100)
	}
	fmt.Println()
	var totalBest int64
	for _, value := range bestScores {
		totalBest += value
	}
	scaled := totalBest * 100 / trials
	fmt.Printf("for scale, the best score averages %d.%02d\\n", scaled/100, scaled%100)
	fmt.Println()
	fmt.Println(strings.Join([]string{
		"Greedy decoding found the best sequence 2 times in 300. That is the",
		"number worth sitting with, because greedy is what you get by default",
		"when you take the highest-probability token at every step, and it is",
		"what most people picture when they picture a model generating text.",
		"",
		"The reason it loses is the one from the greedy module: a locally best",
		"choice can close off everything good downstream. Here the score of a",
		"token depends on the whole prefix, so committing to the best first",
		"token can walk into a region where every continuation is poor, and",
		"nothing later can undo it.",
		"",
		"Widening the beam fixes it gradually and never completely. Width 2",
		"found the best 6 times, width 4 found it 63, width 8 found it 147, and",
		"width 16 found it 259 of 300. The average shortfall falls from 139.20",
		"to 1.26 against best scores that average 393.04. Beam search is not a",
		"correct algorithm that happens to be fast -- it is greedy with a wider",
		"front, and it has the same failure mode, just rarer.",
		"",
		"Look at the expansions column for what it costs: 25, 45, 85, 150, 270,",
		"against 3125 sequences for the exhaustive search. Beam width is a",
		"straightforward dial between work and quality, which is the same shape",
		"as the recall dial in the retrieval lessons. Structurally it is a",
		"bounded priority queue -- at each step, expand everything in the beam,",
		"then keep the best \`width\` candidates, which is exactly the top-k",
		"selection from the exact-search lesson.",
		"",
		"Two honest caveats. First, this toy model's scores are random, with no",
		"structure at all, which is the worst possible case for greedy -- real",
		"language models are far smoother, and greedy decoding produces",
		"perfectly usable text. The shape of the result is right and the",
		"severity is exaggerated. Second, and less obviously, the highest-",
		"probability sequence is often not the one you want: beam search with a",
		"wide beam is known to produce flat, repetitive text, because the most",
		"likely continuation of anything is usually something bland. This is",
		"why sampling exists. Top-k and nucleus sampling deliberately do not",
		"maximise -- they restrict the candidates to the plausible ones (a",
		"partial sort, or the same bounded heap again) and then choose randomly",
		"among them. That is a different objective, not a worse search.",
	}, "\\n"))
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "beam-as-a-queue",
      heading: "Beam search is the bounded heap again",
      body: [
        "Structurally, beam search is one loop with a familiar body. Hold `width` partial sequences. Expand each by every possible next token. Keep the best `width` of the results. Repeat.",
        "That \"keep the best `width`\" is precisely the bounded top-k selection from the exact-search lesson \u2014 the same problem, with partial sequences instead of documents. Real implementations use a bounded heap for it rather than a sort, for the same measured reason: almost every candidate is rejected by one comparison against the worst kept.",
        "The expansions column shows the dial. Width 1 spends 25 expansions, width 16 spends 270, and exhaustive would be 3,125. That is the same work-against-quality trade as the recall dial in the retrieval lessons and the bits-against-recall dial in the quantisation lesson, and it is worth noticing that the three are the same shape.",
        "It is also worth being precise about what beam search is not. **It is not a correct algorithm that happens to be fast.** It is greedy with a wider front, it has the same failure mode, and the measurement shows it: even at width 16 it missed the best sequence 41 times in 300. Widening the beam makes the failure rarer, never impossible.",
      ],
      pitfalls: [
        {
          title: "Calling beam search optimal",
          body: "Width 16 found the best sequence 259 times of 300. A wider beam is a better approximation, not a guarantee, and there is no width short of the whole vocabulary that makes it one.",
        },
        {
          title: "Comparing sequences of different lengths by total score",
          body: "Scores accumulate per token, so a longer sequence has a lower total almost automatically. Production beam search divides by length, or by a function of it, before comparing -- otherwise it systematically prefers stopping early.",
        },
        {
          title: "Assuming a bigger beam gives better text",
          body: "It gives a higher-scoring sequence, which is a different thing, and the next section is about why those come apart.",
        },
      ],
    },
    {
      id: "sampling",
      heading: "Why maximising is often the wrong objective",
      body: [
        "There is a result in this area that surprises people, and it is not about search quality: **wide beam search produces worse text.** Flat, repetitive, hedging text, and it gets worse as the beam gets wider.",
        "The reason is not a bug in beam search \u2014 it is doing exactly what it was asked. It is that the most probable continuation of almost any prefix is something bland, because bland continuations are what a corpus contains most of. Maximising probability optimises for the least surprising thing that could be said next, which is not what anybody wants from a model.",
        "So most generation does not maximise at all. It **samples**, and the sampling strategies are selection problems with a random choice at the end.",
        "**Top-k sampling** keeps the `k` highest-scoring tokens and samples among them, which is a bounded heap followed by a weighted random draw. **Nucleus sampling** keeps the smallest set of tokens whose scores sum past a threshold and samples among those, which is a partial sort followed by a prefix scan and then the same draw. Both exist to exclude the long tail of implausible tokens while leaving genuine choice among the plausible ones.",
        "The useful framing is that these are not worse searches. They are answers to a different question. Beam search asks for the most likely sequence; sampling asks for a likely sequence, and for most uses the second question is the right one. Where the first question *is* right \u2014 translation, constrained extraction, code with a single correct answer \u2014 beam search is still what gets used.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Is greedy decoding good enough?",
      answer:
        "It depends on the objective, but it is definitely not optimal, and I measured how far off. On a toy model small enough to enumerate all 3,125 sequences, greedy found the best sequence 2 times in 300. A beam of 2 found it 6 times, 4 found 63, 8 found 147, and 16 found 259, with average shortfall dropping from 139.20 to 1.26. The caveat is that the toy model's scores are random with no structure, which is the worst case for greedy -- real models are much smoother and greedy produces usable text. The shape is right and the severity is exaggerated.",
    },
    {
      question: "What is beam search, structurally?",
      answer:
        "A bounded priority queue over partial sequences. Hold `width` prefixes, expand each by every possible next token, keep the best `width` of the results, repeat. That keep-the-best step is exactly the bounded top-k selection from exact nearest-neighbour search, and real implementations use a bounded heap for it for the same reason -- almost every candidate is rejected by one comparison against the worst kept. Beam width is a work-against-quality dial: 25 expansions at width 1 up to 270 at width 16, against 3,125 for exhaustive. But it is greedy with a wider front, not a correct algorithm -- at width 16 it still missed the best sequence 41 times in 300.",
    },
    {
      question: "Why do models sample instead of taking the most likely token?",
      answer:
        "Because the most likely sequence is usually not the one you want. Wide beam search is known to produce flat, repetitive text, and it gets worse as the beam widens -- not a bug, but the consequence of maximising probability, since the most probable continuation of almost anything is something bland. So generation usually samples instead. Top-k keeps the k highest-scoring tokens and draws among them, which is a bounded heap plus a weighted random choice; nucleus sampling keeps the smallest set whose scores pass a threshold, which is a partial sort and a prefix scan. Neither is a worse search -- they answer a different question. Where the most likely sequence really is what you want, like translation or constrained extraction, beam search is still what gets used.",
    },
  ],
  takeaways: [
    "Picking a token is selection; picking a sequence is search",
    "Measured: greedy found the best sequence 2 times in 300",
    "Beam widths 2, 4, 8, 16 found it 6, 63, 147 and 259 times",
    "Beam search is a bounded priority queue over partial sequences",
    "Beam width is the same work-against-quality dial as recall and bit width",
    "Beam search is greedy with a wider front, not a correctness guarantee",
    "Compare sequences by length-normalised score or it prefers stopping early",
    "Top-k and nucleus sampling do not maximise on purpose — bland is most likely",
  ],
};
