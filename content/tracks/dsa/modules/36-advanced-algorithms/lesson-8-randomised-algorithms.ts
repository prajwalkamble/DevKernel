import type { Lesson } from "@/content/types";

export const randomisedAlgorithmsLesson: Lesson = {
  id: "dsa-advanced-algorithms-randomised-algorithms",
  slug: "randomised-algorithms",
  moduleSlug: "advanced-algorithms",
  title: "Randomised Algorithms, and When Approximate Is the Right Answer",
  summary:
    "A randomised algorithm gives up a guarantee to save time or memory, and the size of what it gives up can be measured. Measured: Freivalds wrongly accepted 510 of 1,000 bad matrix products with one round and 2 with ten, in under a sixth of the multiplications of recomputing the product.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Distinguish algorithms that are always right from algorithms that are probably right",
    "Verify a matrix product with Freivalds' algorithm and amplify its confidence",
    "Estimate a distinct count in fixed memory with a k-minimum-values sketch",
    "Decide when an approximate answer is the right one to compute",
  ],
  sections: [
    {
      id: "two-kinds",
      heading: "Two kinds of randomised algorithm",
      body: [
        "**Las Vegas algorithms are always correct; their running time is random.** Quicksort with a random pivot is one: the output is always sorted, and randomness only makes the slow cases unlikely for every input rather than impossible for some inputs and certain for others.",
        "**Monte Carlo algorithms run in a fixed time; their answer is correct with some probability.** The design question is how the error is bounded and how it can be driven down.",
        "Monte Carlo error comes in two shapes. **One-sided**: one of the two answers is always trustworthy \u2014 a Freivalds \"wrong\" is certain, only a \"correct\" can be mistaken. **Two-sided**: either answer can be wrong. One-sided error is much easier to use, because repeating the test and taking any certain answer drives the error down multiplicatively.",
      ],
    },
    {
      id: "freivalds",
      heading: "Freivalds: checking a product without recomputing it",
      body: [
        "Given `n \u00d7 n` matrices `A`, `B` and a claimed product `C`, multiplying `A` by `B` to check costs `n^3` multiplications. Freivalds picks a random vector `r` of zeros and ones and compares `A(Br)` with `Cr`. That is three matrix-vector products, `3n^2` multiplications.",
        "If `C = AB` the two vectors are always equal. If `C \u2260 AB`, let `D = AB - C`, which has some non-zero entry `d_ij`. Row `i` of `Dr` is `d_ij\u00b7r_j` plus terms not involving `r_j`. Whatever those terms add up to, at most one of the two choices for `r_j` makes the total zero, so the test detects the error with probability at least 1/2.",
        "Independent rounds multiply the miss probability: `k` rounds miss with probability at most `1/2^k`, and a round that detects the error ends the check early.",
      ],
      examples: [
        {
          id: "freivalds-and-kmv",
          title: "Freivalds' error by number of rounds, and a distinct-count sketch's error by size",
          lang: "python",
          code: `# Two randomised algorithms whose error can be measured. Freivalds checks a
# matrix product without recomputing it and can wrongly say "correct"; the
# k-minimum-values sketch counts distinct items in fixed memory and is never
# exactly right. Both errors shrink with effort in a way that can be counted.

# The same linear congruential generator in every language, so the random
# choices below are the same whichever translation is run.
seed = 11400023


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


work = [0]


# --- Freivalds: is C really A times B? -----------------------------------

def multiply(a, b):
    n = len(a)
    out = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            total = 0
            for k in range(n):
                work[0] += 1
                total += a[i][k] * b[k][j]
            out[i][j] = total
    return out


def times_vector(m, v):
    out = []
    for row in m:
        total = 0
        for j in range(len(v)):
            work[0] += 1
            total += row[j] * v[j]
        out.append(total)
    return out


def freivalds(a, b, c, rounds):
    # a random 0/1 vector r: if A(Br) != Cr then C is certainly wrong.
    # If C is wrong, a single round misses it with probability at most 1/2.
    for _ in range(rounds):
        r = [rand(2) for _ in range(len(a))]
        if times_vector(a, times_vector(b, r)) != times_vector(c, r):
            return False
    return True


N = 40
TRIALS = 1000
print("freivalds: %d x %d matrices, %d wrong products, one entry off by one" % (N, N, TRIALS))
print()
print("  rounds   wrong products accepted   multiplications per check")
a = [[rand(10) for _ in range(N)] for _ in range(N)]
b = [[rand(10) for _ in range(N)] for _ in range(N)]
work[0] = 0
product = multiply(a, b)
full = work[0]
for rounds in [1, 2, 5, 10]:
    accepted = 0
    work[0] = 0
    for _ in range(TRIALS):
        i = rand(N)
        j = rand(N)
        product[i][j] += 1
        if freivalds(a, b, product, rounds):
            accepted += 1
        product[i][j] -= 1
    print("%8d %25d %27d" % (rounds, accepted, work[0] // TRIALS))
correct = 0
for _ in range(100):
    if freivalds(a, b, product, 1):
        correct += 1
print("  the true product was accepted %d times out of 100" % correct)
print("  multiplying out A times B directly costs %d multiplications" % full)
print()


# --- k minimum values: distinct count in fixed memory ---------------------

RANGE = 4294967296


def mix(value):
    # a fixed scramble of 32-bit integers (the MurmurHash3 finaliser), so
    # that the hash values of distinct items are spread evenly over the range
    h = value % RANGE
    h ^= h >> 16
    h = h * 0x85EBCA6B % RANGE
    h ^= h >> 13
    h = h * 0xC2B2AE35 % RANGE
    h ^= h >> 16
    return h


def kmv_estimate(stream, k):
    # keep the k smallest distinct hash values; if they are spread evenly,
    # the k-th smallest sits about k / distinct of the way through the range
    kept = []
    for item in stream:
        h = mix(item)
        if len(kept) == k and h >= kept[k - 1]:
            continue
        lo = 0
        hi = len(kept)
        while lo < hi:
            mid = (lo + hi) // 2
            if kept[mid] < h:
                lo = mid + 1
            else:
                hi = mid
        if lo < len(kept) and kept[lo] == h:
            continue                     # already kept: a repeat of the same item
        kept.insert(lo, h)
        if len(kept) > k:
            kept.pop()
    if len(kept) < k:
        return len(kept)
    return (k - 1) * RANGE // kept[k - 1]


STREAM = 20000
RUNS = 20
print("k minimum values: %d runs, each a stream of %d items drawn from %d possible values"
      % (RUNS, STREAM, STREAM))
print()
streams = []
truths = []
for _ in range(RUNS):
    stream = [rand(STREAM) for _ in range(STREAM)]
    exact = {}
    for item in stream:
        exact[item] = True
    streams.append(stream)
    truths.append(len(exact))
print("       k   mean error per thousand   worst run per thousand   values kept")
for k in [16, 64, 256, 1024]:
    total = 0
    worst = 0
    for run in range(RUNS):
        estimate = kmv_estimate(streams[run], k)
        error = abs(estimate - truths[run]) * 1000 // truths[run]
        total += error
        worst = max(worst, error)
    print("%8d %25d %24d %13d" % (k, total // RUNS, worst, k))
print("an exact count keeps every distinct value: about %d per run" % (sum(truths) // RUNS))
`,
          output: `freivalds: 40 x 40 matrices, 1000 wrong products, one entry off by one

  rounds   wrong products accepted   multiplications per check
       1                       510                        4800
       2                       264                        7363
       5                        31                        9523
      10                         2                        9508
  the true product was accepted 100 times out of 100
  multiplying out A times B directly costs 64000 multiplications

k minimum values: 20 runs, each a stream of 20000 items drawn from 20000 possible values

       k   mean error per thousand   worst run per thousand   values kept
      16                        96                      403            16
      64                        69                      177            64
     256                        61                      138           256
    1024                        14                       36          1024
an exact count keeps every distinct value: about 12303 per run`,
          explanation:
            "With one entry of the product off by one, a single round accepted 510 of 1,000 wrong products, close to the bound of one half. Two rounds accepted 264, five accepted 31, ten accepted 2, following halving each round. The true product was accepted 100 times out of 100: the error is one-sided. The work column is per check, and grows less than the round count because a detected error stops the check: 9,508 multiplications at ten rounds against 64,000 to multiply the matrices out. The second table estimates the number of distinct items in 20 streams of 20,000 items, about 12,300 distinct each. Keeping 16 values the mean error was 96 per thousand; keeping 1,024 it was 14.",
          alternates: [
            {
              lang: "javascript",
              code: `// Two randomised algorithms whose error can be measured. Freivalds checks a
// matrix product without recomputing it and can wrongly say "correct"; the
// k-minimum-values sketch counts distinct items in fixed memory and is never
// exactly right. Both errors shrink with effort in a way that can be counted.

// The same linear congruential generator in every language, so the random
// choices below are the same whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 11400023n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

let work = 0;

// --- Freivalds: is C really A times B? -----------------------------------

function multiply(a, b) {
  const n = a.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j < n; j++) {
      let total = 0;
      for (let k = 0; k < n; k++) {
        work += 1;
        total += a[i][k] * b[k][j];
      }
      row.push(total);
    }
    out.push(row);
  }
  return out;
}

function timesVector(m, v) {
  const out = [];
  for (const row of m) {
    let total = 0;
    for (let j = 0; j < v.length; j++) {
      work += 1;
      total += row[j] * v[j];
    }
    out.push(total);
  }
  return out;
}

function freivalds(a, b, c, rounds) {
  // a random 0/1 vector r: if A(Br) != Cr then C is certainly wrong.
  // If C is wrong, a single round misses it with probability at most 1/2.
  for (let round = 0; round < rounds; round++) {
    const r = [];
    for (let i = 0; i < a.length; i++) r.push(rand(2));
    const left = timesVector(a, timesVector(b, r));
    const right = timesVector(c, r);
    if (left.join(",") !== right.join(",")) return false;
  }
  return true;
}

function padLeft(s, width) {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

function randomMatrix(n) {
  const m = [];
  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j < n; j++) row.push(rand(10));
    m.push(row);
  }
  return m;
}

const N = 40;
const TRIALS = 1000;
console.log("freivalds: " + N + " x " + N + " matrices, " + TRIALS + " wrong products, one entry off by one");
console.log();
console.log("  rounds   wrong products accepted   multiplications per check");
const a = randomMatrix(N);
const b = randomMatrix(N);
work = 0;
const product = multiply(a, b);
const full = work;
for (const rounds of [1, 2, 5, 10]) {
  let accepted = 0;
  work = 0;
  for (let t = 0; t < TRIALS; t++) {
    const i = rand(N);
    const j = rand(N);
    product[i][j] += 1;
    if (freivalds(a, b, product, rounds)) accepted += 1;
    product[i][j] -= 1;
  }
  console.log(padLeft(rounds, 8) + " " + padLeft(accepted, 25) + " " + padLeft(Math.floor(work / TRIALS), 27));
}
let correct = 0;
for (let t = 0; t < 100; t++) {
  if (freivalds(a, b, product, 1)) correct += 1;
}
console.log("  the true product was accepted " + correct + " times out of 100");
console.log("  multiplying out A times B directly costs " + full + " multiplications");
console.log();

// --- k minimum values: distinct count in fixed memory ---------------------

const RANGE = 4294967296;

function mix(value) {
  // a fixed scramble of 32-bit integers (the MurmurHash3 finaliser), so
  // that the hash values of distinct items are spread evenly over the range
  let h = value >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

function kmvEstimate(stream, k) {
  // keep the k smallest distinct hash values; if they are spread evenly,
  // the k-th smallest sits about k / distinct of the way through the range
  const kept = [];
  for (const item of stream) {
    const h = mix(item);
    if (kept.length === k && h >= kept[k - 1]) continue;
    let lo = 0;
    let hi = kept.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (kept[mid] < h) lo = mid + 1;
      else hi = mid;
    }
    if (lo < kept.length && kept[lo] === h) continue; // already kept: a repeat of the same item
    kept.splice(lo, 0, h);
    if (kept.length > k) kept.pop();
  }
  if (kept.length < k) return kept.length;
  return Math.floor(((k - 1) * RANGE) / kept[k - 1]);
}

const STREAM = 20000;
const RUNS = 20;
console.log(
  "k minimum values: " + RUNS + " runs, each a stream of " + STREAM + " items drawn from " +
    STREAM + " possible values",
);
console.log();
const streams = [];
const truths = [];
for (let run = 0; run < RUNS; run++) {
  const stream = [];
  for (let i = 0; i < STREAM; i++) stream.push(rand(STREAM));
  streams.push(stream);
  truths.push(new Set(stream).size);
}
console.log("       k   mean error per thousand   worst run per thousand   values kept");
for (const k of [16, 64, 256, 1024]) {
  let total = 0;
  let worst = 0;
  for (let run = 0; run < RUNS; run++) {
    const estimate = kmvEstimate(streams[run], k);
    const error = Math.floor((Math.abs(estimate - truths[run]) * 1000) / truths[run]);
    total += error;
    worst = Math.max(worst, error);
  }
  console.log(padLeft(k, 8) + " " + padLeft(Math.floor(total / RUNS), 25) + " " + padLeft(worst, 24) + " " + padLeft(k, 13));
}
let truthSum = 0;
for (const v of truths) truthSum += v;
console.log("an exact count keeps every distinct value: about " + Math.floor(truthSum / RUNS) + " per run");
`,
            },
            {
              lang: "typescript",
              code: `// Two randomised algorithms whose error can be measured. Freivalds checks a
// matrix product without recomputing it and can wrongly say "correct"; the
// k-minimum-values sketch counts distinct items in fixed memory and is never
// exactly right. Both errors shrink with effort in a way that can be counted.

// The same linear congruential generator in every language, so the random
// choices below are the same whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 11400023n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

let work = 0;

// --- Freivalds: is C really A times B? -----------------------------------

function multiply(a: number[][], b: number[][]): number[][] {
  const n = a.length;
  const out: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      let total = 0;
      for (let k = 0; k < n; k++) {
        work += 1;
        total += a[i][k] * b[k][j];
      }
      row.push(total);
    }
    out.push(row);
  }
  return out;
}

function timesVector(m: number[][], v: number[]): number[] {
  const out: number[] = [];
  for (const row of m) {
    let total = 0;
    for (let j = 0; j < v.length; j++) {
      work += 1;
      total += row[j] * v[j];
    }
    out.push(total);
  }
  return out;
}

function freivalds(a: number[][], b: number[][], c: number[][], rounds: number): boolean {
  // a random 0/1 vector r: if A(Br) != Cr then C is certainly wrong.
  // If C is wrong, a single round misses it with probability at most 1/2.
  for (let round = 0; round < rounds; round++) {
    const r: number[] = [];
    for (let i = 0; i < a.length; i++) r.push(rand(2));
    const left = timesVector(a, timesVector(b, r));
    const right = timesVector(c, r);
    if (left.join(",") !== right.join(",")) return false;
  }
  return true;
}

function padLeft(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

function randomMatrix(n: number): number[][] {
  const m: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) row.push(rand(10));
    m.push(row);
  }
  return m;
}

const N = 40;
const TRIALS = 1000;
console.log("freivalds: " + N + " x " + N + " matrices, " + TRIALS + " wrong products, one entry off by one");
console.log();
console.log("  rounds   wrong products accepted   multiplications per check");
const a = randomMatrix(N);
const b = randomMatrix(N);
work = 0;
const product = multiply(a, b);
const full = work;
for (const rounds of [1, 2, 5, 10]) {
  let accepted = 0;
  work = 0;
  for (let t = 0; t < TRIALS; t++) {
    const i = rand(N);
    const j = rand(N);
    product[i][j] += 1;
    if (freivalds(a, b, product, rounds)) accepted += 1;
    product[i][j] -= 1;
  }
  console.log(padLeft(rounds, 8) + " " + padLeft(accepted, 25) + " " + padLeft(Math.floor(work / TRIALS), 27));
}
let correct = 0;
for (let t = 0; t < 100; t++) {
  if (freivalds(a, b, product, 1)) correct += 1;
}
console.log("  the true product was accepted " + correct + " times out of 100");
console.log("  multiplying out A times B directly costs " + full + " multiplications");
console.log();

// --- k minimum values: distinct count in fixed memory ---------------------

const RANGE = 4294967296;

function mix(value: number): number {
  // a fixed scramble of 32-bit integers (the MurmurHash3 finaliser), so
  // that the hash values of distinct items are spread evenly over the range
  let h = value >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

function kmvEstimate(stream: number[], k: number): number {
  // keep the k smallest distinct hash values; if they are spread evenly,
  // the k-th smallest sits about k / distinct of the way through the range
  const kept: number[] = [];
  for (const item of stream) {
    const h = mix(item);
    if (kept.length === k && h >= kept[k - 1]) continue;
    let lo = 0;
    let hi = kept.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (kept[mid] < h) lo = mid + 1;
      else hi = mid;
    }
    if (lo < kept.length && kept[lo] === h) continue; // already kept: a repeat of the same item
    kept.splice(lo, 0, h);
    if (kept.length > k) kept.pop();
  }
  if (kept.length < k) return kept.length;
  return Math.floor(((k - 1) * RANGE) / kept[k - 1]);
}

const STREAM = 20000;
const RUNS = 20;
console.log(
  "k minimum values: " + RUNS + " runs, each a stream of " + STREAM + " items drawn from " +
    STREAM + " possible values",
);
console.log();
const streams: number[][] = [];
const truths: number[] = [];
for (let run = 0; run < RUNS; run++) {
  const stream: number[] = [];
  for (let i = 0; i < STREAM; i++) stream.push(rand(STREAM));
  streams.push(stream);
  truths.push(new Set(stream).size);
}
console.log("       k   mean error per thousand   worst run per thousand   values kept");
for (const k of [16, 64, 256, 1024]) {
  let total = 0;
  let worst = 0;
  for (let run = 0; run < RUNS; run++) {
    const estimate = kmvEstimate(streams[run], k);
    const error = Math.floor((Math.abs(estimate - truths[run]) * 1000) / truths[run]);
    total += error;
    worst = Math.max(worst, error);
  }
  console.log(padLeft(k, 8) + " " + padLeft(Math.floor(total / RUNS), 25) + " " + padLeft(worst, 24) + " " + padLeft(k, 13));
}
let truthSum = 0;
for (const v of truths) truthSum += v;
console.log("an exact count keeps every distinct value: about " + Math.floor(truthSum / RUNS) + " per run");
`,
            },
            {
              lang: "java",
              code: `// Two randomised algorithms whose error can be measured. Freivalds checks a
// matrix product without recomputing it and can wrongly say "correct"; the
// k-minimum-values sketch counts distinct items in fixed memory and is never
// exactly right. Both errors shrink with effort in a way that can be counted.

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class Main {
  // The same linear congruential generator in every language, so the random
  // choices below are the same whichever translation is run.
  static long seed = 11400023L;

  static int rand(int n) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return (int) (seed / 65536L % n);
  }

  static long work = 0;

  // --- Freivalds: is C really A times B? -----------------------------------

  static long[][] multiply(long[][] a, long[][] b) {
    int n = a.length;
    long[][] out = new long[n][n];
    for (int i = 0; i < n; i++) {
      for (int j = 0; j < n; j++) {
        long total = 0;
        for (int k = 0; k < n; k++) {
          work += 1;
          total += a[i][k] * b[k][j];
        }
        out[i][j] = total;
      }
    }
    return out;
  }

  static long[] timesVector(long[][] m, long[] v) {
    long[] out = new long[m.length];
    for (int i = 0; i < m.length; i++) {
      long total = 0;
      for (int j = 0; j < v.length; j++) {
        work += 1;
        total += m[i][j] * v[j];
      }
      out[i] = total;
    }
    return out;
  }

  static boolean freivalds(long[][] a, long[][] b, long[][] c, int rounds) {
    // a random 0/1 vector r: if A(Br) != Cr then C is certainly wrong.
    // If C is wrong, a single round misses it with probability at most 1/2.
    for (int round = 0; round < rounds; round++) {
      long[] r = new long[a.length];
      for (int i = 0; i < a.length; i++) {
        r[i] = rand(2);
      }
      long[] left = timesVector(a, timesVector(b, r));
      long[] right = timesVector(c, r);
      if (!Arrays.equals(left, right)) {
        return false;
      }
    }
    return true;
  }

  static long[][] randomMatrix(int n) {
    long[][] m = new long[n][n];
    for (int i = 0; i < n; i++) {
      for (int j = 0; j < n; j++) {
        m[i][j] = rand(10);
      }
    }
    return m;
  }

  // --- k minimum values: distinct count in fixed memory ---------------------

  static final long RANGE = 4294967296L;

  static long mix(long value) {
    // a fixed scramble of 32-bit integers (the MurmurHash3 finaliser), so
    // that the hash values of distinct items are spread evenly over the range
    long h = value & 0xFFFFFFFFL;
    h ^= h >>> 16;
    h = (h * 0x85EBCA6BL) & 0xFFFFFFFFL;
    h ^= h >>> 13;
    h = (h * 0xC2B2AE35L) & 0xFFFFFFFFL;
    h ^= h >>> 16;
    return h;
  }

  static long kmvEstimate(int[] stream, int k) {
    // keep the k smallest distinct hash values; if they are spread evenly,
    // the k-th smallest sits about k / distinct of the way through the range
    List<Long> kept = new ArrayList<>();
    for (int item : stream) {
      long h = mix(item);
      if (kept.size() == k && h >= kept.get(k - 1)) {
        continue;
      }
      int lo = 0;
      int hi = kept.size();
      while (lo < hi) {
        int mid = (lo + hi) / 2;
        if (kept.get(mid) < h) {
          lo = mid + 1;
        } else {
          hi = mid;
        }
      }
      if (lo < kept.size() && kept.get(lo) == h) {
        continue; // already kept: a repeat of the same item
      }
      kept.add(lo, h);
      if (kept.size() > k) {
        kept.remove(kept.size() - 1);
      }
    }
    if (kept.size() < k) {
      return kept.size();
    }
    return (k - 1) * RANGE / kept.get(k - 1);
  }

  public static void main(String[] args) {
    final int n = 40;
    final int trials = 1000;
    System.out.printf("freivalds: %d x %d matrices, %d wrong products, one entry off by one%n", n, n, trials);
    System.out.println();
    System.out.println("  rounds   wrong products accepted   multiplications per check");
    long[][] a = randomMatrix(n);
    long[][] b = randomMatrix(n);
    work = 0;
    long[][] product = multiply(a, b);
    long full = work;
    int[] roundCounts = {1, 2, 5, 10};
    for (int rounds : roundCounts) {
      int accepted = 0;
      work = 0;
      for (int t = 0; t < trials; t++) {
        int i = rand(n);
        int j = rand(n);
        product[i][j] += 1;
        if (freivalds(a, b, product, rounds)) {
          accepted += 1;
        }
        product[i][j] -= 1;
      }
      System.out.printf("%8d %25d %27d%n", rounds, accepted, work / trials);
    }
    int correct = 0;
    for (int t = 0; t < 100; t++) {
      if (freivalds(a, b, product, 1)) {
        correct += 1;
      }
    }
    System.out.printf("  the true product was accepted %d times out of 100%n", correct);
    System.out.printf("  multiplying out A times B directly costs %d multiplications%n", full);
    System.out.println();

    final int streamLength = 20000;
    final int runs = 20;
    System.out.printf(
        "k minimum values: %d runs, each a stream of %d items drawn from %d possible values%n",
        runs, streamLength, streamLength);
    System.out.println();
    int[][] streams = new int[runs][streamLength];
    int[] truths = new int[runs];
    for (int run = 0; run < runs; run++) {
      Set<Integer> exact = new HashSet<>();
      for (int i = 0; i < streamLength; i++) {
        streams[run][i] = rand(streamLength);
        exact.add(streams[run][i]);
      }
      truths[run] = exact.size();
    }
    System.out.println("       k   mean error per thousand   worst run per thousand   values kept");
    int[] ks = {16, 64, 256, 1024};
    for (int k : ks) {
      long total = 0;
      long worst = 0;
      for (int run = 0; run < runs; run++) {
        long estimate = kmvEstimate(streams[run], k);
        long error = Math.abs(estimate - truths[run]) * 1000 / truths[run];
        total += error;
        worst = Math.max(worst, error);
      }
      System.out.printf("%8d %25d %24d %13d%n", k, total / runs, worst, k);
    }
    long truthSum = 0;
    for (int v : truths) {
      truthSum += v;
    }
    System.out.printf("an exact count keeps every distinct value: about %d per run%n", truthSum / runs);
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// Two randomised algorithms whose error can be measured. Freivalds checks a
// matrix product without recomputing it and can wrongly say "correct"; the
// k-minimum-values sketch counts distinct items in fixed memory and is never
// exactly right. Both errors shrink with effort in a way that can be counted.

#include <algorithm>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <unordered_set>
#include <vector>

typedef std::vector<std::vector<long long> > Matrix;

// The same linear congruential generator in every language, so the random
// choices below are the same whichever translation is run.
long long seed = 11400023LL;

int rand_below(int n) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return (int)(seed / 65536LL % n);
}

long long work = 0;

// --- Freivalds: is C really A times B? -----------------------------------

Matrix multiply(const Matrix& a, const Matrix& b) {
  size_t n = a.size();
  Matrix out(n, std::vector<long long>(n, 0));
  for (size_t i = 0; i < n; i++) {
    for (size_t j = 0; j < n; j++) {
      long long total = 0;
      for (size_t k = 0; k < n; k++) {
        work += 1;
        total += a[i][k] * b[k][j];
      }
      out[i][j] = total;
    }
  }
  return out;
}

std::vector<long long> timesVector(const Matrix& m, const std::vector<long long>& v) {
  std::vector<long long> out;
  for (const std::vector<long long>& row : m) {
    long long total = 0;
    for (size_t j = 0; j < v.size(); j++) {
      work += 1;
      total += row[j] * v[j];
    }
    out.push_back(total);
  }
  return out;
}

bool freivalds(const Matrix& a, const Matrix& b, const Matrix& c, int rounds) {
  // a random 0/1 vector r: if A(Br) != Cr then C is certainly wrong.
  // If C is wrong, a single round misses it with probability at most 1/2.
  for (int round = 0; round < rounds; round++) {
    std::vector<long long> r;
    for (size_t i = 0; i < a.size(); i++) {
      r.push_back(rand_below(2));
    }
    std::vector<long long> left = timesVector(a, timesVector(b, r));
    std::vector<long long> right = timesVector(c, r);
    if (left != right) {
      return false;
    }
  }
  return true;
}

Matrix randomMatrix(int n) {
  Matrix m(n, std::vector<long long>(n, 0));
  for (int i = 0; i < n; i++) {
    for (int j = 0; j < n; j++) {
      m[i][j] = rand_below(10);
    }
  }
  return m;
}

// --- k minimum values: distinct count in fixed memory ---------------------

static const long long RANGE = 4294967296LL;

uint64_t mix(uint64_t value) {
  // a fixed scramble of 32-bit integers (the MurmurHash3 finaliser), so
  // that the hash values of distinct items are spread evenly over the range
  uint64_t h = value & 0xFFFFFFFFULL;
  h ^= h >> 16;
  h = (h * 0x85EBCA6BULL) & 0xFFFFFFFFULL;
  h ^= h >> 13;
  h = (h * 0xC2B2AE35ULL) & 0xFFFFFFFFULL;
  h ^= h >> 16;
  return h;
}

long long kmvEstimate(const std::vector<int>& stream, int k) {
  // keep the k smallest distinct hash values; if they are spread evenly,
  // the k-th smallest sits about k / distinct of the way through the range
  std::vector<uint64_t> kept;
  for (int item : stream) {
    uint64_t h = mix((uint64_t)item);
    if ((int)kept.size() == k && h >= kept[k - 1]) {
      continue;
    }
    std::vector<uint64_t>::iterator at = std::lower_bound(kept.begin(), kept.end(), h);
    if (at != kept.end() && *at == h) {
      continue;  // already kept: a repeat of the same item
    }
    kept.insert(at, h);
    if ((int)kept.size() > k) {
      kept.pop_back();
    }
  }
  if ((int)kept.size() < k) {
    return (long long)kept.size();
  }
  return (long long)(k - 1) * RANGE / (long long)kept[k - 1];
}

int main() {
  const int n = 40;
  const int trials = 1000;
  std::printf("freivalds: %d x %d matrices, %d wrong products, one entry off by one\\n", n, n, trials);
  std::printf("\\n");
  std::printf("  rounds   wrong products accepted   multiplications per check\\n");
  Matrix a = randomMatrix(n);
  Matrix b = randomMatrix(n);
  work = 0;
  Matrix product = multiply(a, b);
  long long full = work;
  int roundCounts[4] = {1, 2, 5, 10};
  for (int rounds : roundCounts) {
    int accepted = 0;
    work = 0;
    for (int t = 0; t < trials; t++) {
      int i = rand_below(n);
      int j = rand_below(n);
      product[i][j] += 1;
      if (freivalds(a, b, product, rounds)) {
        accepted += 1;
      }
      product[i][j] -= 1;
    }
    std::printf("%8d %25d %27lld\\n", rounds, accepted, work / trials);
  }
  int correct = 0;
  for (int t = 0; t < 100; t++) {
    if (freivalds(a, b, product, 1)) {
      correct += 1;
    }
  }
  std::printf("  the true product was accepted %d times out of 100\\n", correct);
  std::printf("  multiplying out A times B directly costs %lld multiplications\\n", full);
  std::printf("\\n");

  const int streamLength = 20000;
  const int runs = 20;
  std::printf("k minimum values: %d runs, each a stream of %d items drawn from %d possible values\\n",
              runs, streamLength, streamLength);
  std::printf("\\n");
  std::vector<std::vector<int> > streams;
  std::vector<long long> truths;
  for (int run = 0; run < runs; run++) {
    std::vector<int> stream;
    for (int i = 0; i < streamLength; i++) {
      stream.push_back(rand_below(streamLength));
    }
    std::unordered_set<int> exact(stream.begin(), stream.end());
    streams.push_back(stream);
    truths.push_back((long long)exact.size());
  }
  std::printf("       k   mean error per thousand   worst run per thousand   values kept\\n");
  int ks[4] = {16, 64, 256, 1024};
  for (int k : ks) {
    long long total = 0;
    long long worst = 0;
    for (int run = 0; run < runs; run++) {
      long long estimate = kmvEstimate(streams[run], k);
      long long error = std::llabs(estimate - truths[run]) * 1000 / truths[run];
      total += error;
      worst = std::max(worst, error);
    }
    std::printf("%8d %25lld %24lld %13d\\n", k, total / runs, worst, k);
  }
  long long truthSum = 0;
  for (long long v : truths) {
    truthSum += v;
  }
  std::printf("an exact count keeps every distinct value: about %lld per run\\n", truthSum / runs);
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Two randomised algorithms whose error can be measured. Freivalds checks a
// matrix product without recomputing it and can wrongly say "correct"; the
// k-minimum-values sketch counts distinct items in fixed memory and is never
// exactly right. Both errors shrink with effort in a way that can be counted.

use std::collections::HashSet;

// The same linear congruential generator in every language, so the random
// choices below are the same whichever translation is run.
static mut SEED: i64 = 11400023;

fn rand_below(n: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % n
    }
}

type Matrix = Vec<Vec<i64>>;

// --- Freivalds: is C really A times B? -----------------------------------

fn multiply(a: &Matrix, b: &Matrix, work: &mut i64) -> Matrix {
    let n = a.len();
    let mut out = vec![vec![0i64; n]; n];
    for i in 0..n {
        for j in 0..n {
            let mut total = 0;
            for k in 0..n {
                *work += 1;
                total += a[i][k] * b[k][j];
            }
            out[i][j] = total;
        }
    }
    out
}

fn times_vector(m: &Matrix, v: &[i64], work: &mut i64) -> Vec<i64> {
    let mut out = Vec::new();
    for row in m.iter() {
        let mut total = 0;
        for j in 0..v.len() {
            *work += 1;
            total += row[j] * v[j];
        }
        out.push(total);
    }
    out
}

fn freivalds(a: &Matrix, b: &Matrix, c: &Matrix, rounds: usize, work: &mut i64) -> bool {
    // a random 0/1 vector r: if A(Br) != Cr then C is certainly wrong.
    // If C is wrong, a single round misses it with probability at most 1/2.
    for _ in 0..rounds {
        let r: Vec<i64> = (0..a.len()).map(|_| rand_below(2)).collect();
        let br = times_vector(b, &r, work);
        let left = times_vector(a, &br, work);
        let right = times_vector(c, &r, work);
        if left != right {
            return false;
        }
    }
    true
}

fn random_matrix(n: usize) -> Matrix {
    let mut m = vec![vec![0i64; n]; n];
    for i in 0..n {
        for j in 0..n {
            m[i][j] = rand_below(10);
        }
    }
    m
}

// --- k minimum values: distinct count in fixed memory ---------------------

const RANGE: u64 = 4294967296;

fn mix(value: u64) -> u64 {
    // a fixed scramble of 32-bit integers (the MurmurHash3 finaliser), so
    // that the hash values of distinct items are spread evenly over the range
    let mut h = value & 0xFFFF_FFFF;
    h ^= h >> 16;
    h = h.wrapping_mul(0x85EB_CA6B) & 0xFFFF_FFFF;
    h ^= h >> 13;
    h = h.wrapping_mul(0xC2B2_AE35) & 0xFFFF_FFFF;
    h ^= h >> 16;
    h
}

fn kmv_estimate(stream: &[i64], k: usize) -> i64 {
    // keep the k smallest distinct hash values; if they are spread evenly,
    // the k-th smallest sits about k / distinct of the way through the range
    let mut kept: Vec<u64> = Vec::new();
    for &item in stream.iter() {
        let h = mix(item as u64);
        if kept.len() == k && h >= kept[k - 1] {
            continue;
        }
        let at = kept.partition_point(|&x| x < h);
        if at < kept.len() && kept[at] == h {
            continue; // already kept: a repeat of the same item
        }
        kept.insert(at, h);
        if kept.len() > k {
            kept.pop();
        }
    }
    if kept.len() < k {
        return kept.len() as i64;
    }
    ((k as u64 - 1) * RANGE / kept[k - 1]) as i64
}

fn main() {
    let n = 40;
    let trials = 1000;
    println!("freivalds: {} x {} matrices, {} wrong products, one entry off by one", n, n, trials);
    println!();
    println!("  rounds   wrong products accepted   multiplications per check");
    let a = random_matrix(n);
    let b = random_matrix(n);
    let mut full = 0;
    let mut product = multiply(&a, &b, &mut full);
    for &rounds in [1usize, 2, 5, 10].iter() {
        let mut accepted = 0;
        let mut work = 0;
        for _ in 0..trials {
            let i = rand_below(n as i64) as usize;
            let j = rand_below(n as i64) as usize;
            product[i][j] += 1;
            if freivalds(&a, &b, &product, rounds, &mut work) {
                accepted += 1;
            }
            product[i][j] -= 1;
        }
        println!("{:>8} {:>25} {:>27}", rounds, accepted, work / trials);
    }
    let mut ignored = 0;
    let mut correct = 0;
    for _ in 0..100 {
        if freivalds(&a, &b, &product, 1, &mut ignored) {
            correct += 1;
        }
    }
    println!("  the true product was accepted {} times out of 100", correct);
    println!("  multiplying out A times B directly costs {} multiplications", full);
    println!();

    let stream_length = 20000;
    let runs = 20;
    println!(
        "k minimum values: {} runs, each a stream of {} items drawn from {} possible values",
        runs, stream_length, stream_length
    );
    println!();
    let mut streams: Vec<Vec<i64>> = Vec::new();
    let mut truths: Vec<i64> = Vec::new();
    for _ in 0..runs {
        let stream: Vec<i64> = (0..stream_length).map(|_| rand_below(stream_length)).collect();
        let exact: HashSet<i64> = stream.iter().cloned().collect();
        truths.push(exact.len() as i64);
        streams.push(stream);
    }
    println!("       k   mean error per thousand   worst run per thousand   values kept");
    for &k in [16usize, 64, 256, 1024].iter() {
        let mut total = 0;
        let mut worst = 0;
        for run in 0..runs as usize {
            let estimate = kmv_estimate(&streams[run], k);
            let error = (estimate - truths[run]).abs() * 1000 / truths[run];
            total += error;
            worst = worst.max(error);
        }
        println!("{:>8} {:>25} {:>24} {:>13}", k, total / runs, worst, k);
    }
    let truth_sum: i64 = truths.iter().sum();
    println!("an exact count keeps every distinct value: about {} per run", truth_sum / runs);
}
`,
            },
            {
              lang: "go",
              code: `// Two randomised algorithms whose error can be measured. Freivalds checks a
// matrix product without recomputing it and can wrongly say "correct"; the
// k-minimum-values sketch counts distinct items in fixed memory and is never
// exactly right. Both errors shrink with effort in a way that can be counted.

package main

import (
	"fmt"
	"sort"
)

// The same linear congruential generator in every language, so the random
// choices below are the same whichever translation is run.
var seed int64 = 11400023

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

var work int64

// --- Freivalds: is C really A times B? -----------------------------------

func multiply(a, b [][]int64) [][]int64 {
	n := len(a)
	out := make([][]int64, n)
	for i := 0; i < n; i++ {
		out[i] = make([]int64, n)
		for j := 0; j < n; j++ {
			var total int64
			for k := 0; k < n; k++ {
				work++
				total += a[i][k] * b[k][j]
			}
			out[i][j] = total
		}
	}
	return out
}

func timesVector(m [][]int64, v []int64) []int64 {
	out := []int64{}
	for _, row := range m {
		var total int64
		for j := range v {
			work++
			total += row[j] * v[j]
		}
		out = append(out, total)
	}
	return out
}

func freivalds(a, b, c [][]int64, rounds int) bool {
	// a random 0/1 vector r: if A(Br) != Cr then C is certainly wrong.
	// If C is wrong, a single round misses it with probability at most 1/2.
	for round := 0; round < rounds; round++ {
		r := make([]int64, len(a))
		for i := range r {
			r[i] = int64(randBelow(2))
		}
		left := timesVector(a, timesVector(b, r))
		right := timesVector(c, r)
		for i := range left {
			if left[i] != right[i] {
				return false
			}
		}
	}
	return true
}

func randomMatrix(n int) [][]int64 {
	m := make([][]int64, n)
	for i := range m {
		m[i] = make([]int64, n)
		for j := range m[i] {
			m[i][j] = int64(randBelow(10))
		}
	}
	return m
}

// --- k minimum values: distinct count in fixed memory ---------------------

const rangeSize = 4294967296

func mix(value uint64) uint64 {
	// a fixed scramble of 32-bit integers (the MurmurHash3 finaliser), so
	// that the hash values of distinct items are spread evenly over the range
	h := value & 0xFFFFFFFF
	h ^= h >> 16
	h = (h * 0x85EBCA6B) & 0xFFFFFFFF
	h ^= h >> 13
	h = (h * 0xC2B2AE35) & 0xFFFFFFFF
	h ^= h >> 16
	return h
}

func kmvEstimate(stream []int, k int) int64 {
	// keep the k smallest distinct hash values; if they are spread evenly,
	// the k-th smallest sits about k / distinct of the way through the range
	kept := []uint64{}
	for _, item := range stream {
		h := mix(uint64(item))
		if len(kept) == k && h >= kept[k-1] {
			continue
		}
		at := sort.Search(len(kept), func(i int) bool { return kept[i] >= h })
		if at < len(kept) && kept[at] == h {
			continue // already kept: a repeat of the same item
		}
		kept = append(kept, 0)
		copy(kept[at+1:], kept[at:])
		kept[at] = h
		if len(kept) > k {
			kept = kept[:k]
		}
	}
	if len(kept) < k {
		return int64(len(kept))
	}
	return int64(uint64(k-1) * rangeSize / kept[k-1])
}

func main() {
	const n = 40
	const trials = 1000
	fmt.Printf("freivalds: %d x %d matrices, %d wrong products, one entry off by one\\n", n, n, trials)
	fmt.Println()
	fmt.Println("  rounds   wrong products accepted   multiplications per check")
	a := randomMatrix(n)
	b := randomMatrix(n)
	work = 0
	product := multiply(a, b)
	full := work
	for _, rounds := range []int{1, 2, 5, 10} {
		accepted := 0
		work = 0
		for t := 0; t < trials; t++ {
			i := randBelow(n)
			j := randBelow(n)
			product[i][j]++
			if freivalds(a, b, product, rounds) {
				accepted++
			}
			product[i][j]--
		}
		fmt.Printf("%8d %25d %27d\\n", rounds, accepted, work/trials)
	}
	correct := 0
	for t := 0; t < 100; t++ {
		if freivalds(a, b, product, 1) {
			correct++
		}
	}
	fmt.Printf("  the true product was accepted %d times out of 100\\n", correct)
	fmt.Printf("  multiplying out A times B directly costs %d multiplications\\n", full)
	fmt.Println()

	const streamLength = 20000
	const runs = 20
	fmt.Printf("k minimum values: %d runs, each a stream of %d items drawn from %d possible values\\n", runs, streamLength, streamLength)
	fmt.Println()
	streams := [][]int{}
	truths := []int64{}
	for run := 0; run < runs; run++ {
		stream := make([]int, streamLength)
		exact := map[int]bool{}
		for i := range stream {
			stream[i] = randBelow(streamLength)
			exact[stream[i]] = true
		}
		streams = append(streams, stream)
		truths = append(truths, int64(len(exact)))
	}
	fmt.Println("       k   mean error per thousand   worst run per thousand   values kept")
	for _, k := range []int{16, 64, 256, 1024} {
		var total int64
		var worst int64
		for run := 0; run < runs; run++ {
			estimate := kmvEstimate(streams[run], k)
			difference := estimate - truths[run]
			if difference < 0 {
				difference = -difference
			}
			e := difference * 1000 / truths[run]
			total += e
			worst = max(worst, e)
		}
		fmt.Printf("%8d %25d %24d %13d\\n", k, total/runs, worst, k)
	}
	var truthSum int64
	for _, v := range truths {
		truthSum += v
	}
	fmt.Printf("an exact count keeps every distinct value: about %d per run\\n", truthSum/runs)
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "sketches",
      heading: "Counting distinct items in fixed memory",
      body: [
        "An exact distinct count stores every distinct value \u2014 about 12,300 per stream in the measurement, and billions in a real log. A **sketch** stores a small summary and returns an estimate.",
        "**k minimum values.** Hash every item to a number spread uniformly over a range `R`, and keep only the `k` smallest distinct hashes seen. Repeats of an item hash to the same value, so they change nothing. If there are `D` distinct items, their hashes are about `R/D` apart, so the `k`-th smallest sits near `k\u00b7R/D`. Solving gives the estimate `(k - 1)\u00b7R / kth_smallest`.",
        "The measured error fell from 96 per thousand at 16 values to 14 per thousand at 1,024, with the middle sizes close to each other over 20 runs; memory is exactly `k` values regardless of the stream's length.",
        "Two properties make sketches practical beyond their size. They are **mergeable**: the `k` smallest hashes of a union are the `k` smallest of two sketches combined, so counts over many machines or days combine without rescanning. And the error depends on `k`, not on `D`, so the same sketch works at a thousand distinct items or a billion.",
        "HyperLogLog is the production refinement of the same idea, recording the longest run of leading zeros seen in each of many hash buckets. Redis's implementation uses 12 KB per counter for a standard error of 0.81%.",
      ],
      pitfalls: [
        {
          title: "A weak hash function in a sketch",
          body: "The estimate assumes the hashes of distinct items are spread evenly. A hash that maps nearby integers to nearby values clusters the smallest hashes and skews the estimate. Use a well-mixed hash such as the MurmurHash3 finaliser the program uses.",
        },
        {
          title: "Repeating a two-sided test and taking a majority as if it were one-sided",
          body: "Repetition works for both, but only one-sided errors let a single certain answer settle the question. For two-sided error, take a majority vote over independent runs.",
        },
        {
          title: "A fixed random seed in an adversarial setting",
          body: "If an attacker knows the seed, the 'random' choices are predictable and inputs can be built to hit the bad cases. Seed from a secure source at run time.",
        },
      ],
    },
    {
      id: "when-approximate",
      heading: "When approximate is the right answer",
      body: [
        "**When the exact answer does not fit.** A stream seen once, with no room to store it, has no exact distinct count available at all. The choice is between an estimate and nothing.",
        "**When checking is cheaper than computing.** Freivalds does not produce a product; it verifies one. Pairing an expensive computation with a cheap probabilistic check is how results from untrusted or unreliable sources are accepted.",
        "**When the error bound is known and smaller than other uncertainty in the system.** A dashboard of unique visitors that is 1% off is indistinguishable from the variation between days. An account balance that is 1% off is a defect.",
        "**When it is not.** Anything that must be exactly right for each individual case \u2014 money, access control, a single user's data \u2014 needs an exact algorithm, or a probabilistic one whose error can be driven below the chance of a hardware fault and is then verified.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How can you check that C = AB without multiplying A and B?",
      answer:
        "Freivalds' algorithm: pick a random vector r of zeros and ones and compare A(Br) with Cr, which is three matrix-vector products, O(n^2). If C is correct they always match. If it is wrong, D = AB - C has a non-zero entry d_ij, and for any values of the other entries of r at most one choice of r_j makes that row of Dr zero, so each round catches the error with probability at least 1/2. I measured it with one entry off by one: 510 of 1,000 wrong products slipped past one round, 264 past two, 31 past five, 2 past ten, and the true product was never rejected.",
    },
    {
      question: "How do you count distinct items in a stream too large to store?",
      answer:
        "With a sketch. The k-minimum-values version hashes each item uniformly, keeps the k smallest distinct hash values, and estimates the count as (k - 1) times the hash range divided by the k-th smallest -- repeats hash the same, so they change nothing. Memory is k values whatever the stream length, and sketches merge by keeping the k smallest of both. In my measurement on streams with about 12,300 distinct items, mean error was 96 per thousand keeping 16 values and 14 per thousand keeping 1,024. HyperLogLog is the production form; Redis uses 12 KB per counter for 0.81% standard error.",
    },
    {
      question: "What is the difference between a Las Vegas and a Monte Carlo algorithm?",
      answer:
        "A Las Vegas algorithm is always correct and its running time is random -- quicksort with a random pivot always sorts, and the randomness only makes slow cases unlikely for every input. A Monte Carlo algorithm runs in bounded time and is correct with some probability. The useful distinction inside Monte Carlo is one-sided against two-sided error: Freivalds' 'wrong' is certain and only its 'correct' can be mistaken, so independent repetitions halve the error each time and any certain answer ends the check.",
    },
  ],
  takeaways: [
    "Las Vegas: always right, random time. Monte Carlo: bounded time, probably right",
    "One-sided error amplifies cleanly: k rounds miss with probability at most 1/2^k",
    "Freivalds checks AB = C in O(n^2) per round",
    "Measured: 510, 264, 31 and 2 wrong products accepted at 1, 2, 5 and 10 rounds",
    "A k-minimum-values sketch estimates distinct counts in k values of memory",
    "Measured mean error: 96 per thousand at k = 16, 14 at k = 1,024",
    "Sketches merge, and their error depends on k, not on the stream",
    "Approximate is right when exact does not fit and the error is below the noise",
  ],
};
