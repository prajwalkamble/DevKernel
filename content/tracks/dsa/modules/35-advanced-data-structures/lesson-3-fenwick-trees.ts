import type { Lesson } from "@/content/types";

export const fenwickTreesLesson: Lesson = {
  id: "dsa-advanced-structures-fenwick-trees",
  slug: "fenwick-trees",
  moduleSlug: "advanced-data-structures",
  title: "Fenwick Trees: Prefix Sums That Survive Updates",
  summary:
    "A plain array makes updates cheap and queries expensive; a prefix array does the reverse. A Fenwick tree pays one logarithm for each. Measured: 5 elements touched per operation at n = 1,024 whatever the update share, and a worst case equal to the number of bits in n.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Explain what range each Fenwick cell stores, in terms of the lowest set bit",
    "Implement update and prefix query and say why the tree is one-indexed",
    "Measure the three structures under different update shares",
    "Extend the tree to range updates",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "Why neither array works",
      body: [
        "An array with changing values and prefix-sum queries has two naive answers, and the measurement below shows both failing in opposite directions.",
        "A **plain array** updates one cell and answers a prefix query by adding up to `n` values. A **prefix array** answers in one read and must rewrite every later entry on an update. At n = 1,024 with 1% updates, the plain array touched 513 elements per operation; with 99% updates the prefix array touched 508.",
        "A Fenwick tree \u2014 a binary indexed tree \u2014 stores partial sums arranged so that both operations touch `O(log n)` cells.",
      ],
    },
    {
      id: "the-layout",
      heading: "What each cell holds",
      body: [
        "Index cells from 1. Let `lowbit(k)` be the value of the lowest set bit of `k`, computed as `k & -k`. Cell `k` stores the sum of the `lowbit(k)` values ending at position `k` \u2014 the half-open range `(k - lowbit(k), k]`.",
        "So cell 12 (binary `1100`, lowbit 4) holds positions 9 to 12; cell 8 (`1000`, lowbit 8) holds 1 to 8; cell 7 (`0111`, lowbit 1) holds position 7 alone.",
        "**Prefix query** `sum(1..k)`: add cell `k`, then `k -= lowbit(k)`, until `k` is 0. Each step clears the lowest set bit, so the ranges tile `1..k` exactly and there are at most as many steps as set bits. For `k = 13`: cells 13, 12, 8, covering 13, 9\u201312, 1\u20138.",
        "**Update** position `i` by `delta`: add to cell `i`, then `i += lowbit(i)`, until past `n`. Each step moves to the next cell whose range contains `i`. For `i = 5`: cells 5, 6, 8, 16.",
        "The one-indexing is not a convention. `lowbit(0)` is 0, so a zero-indexed loop never advances. Implementations that expose zero-based positions add 1 on entry, as the program does.",
      ],
    },
    {
      id: "measured",
      heading: "Three structures, three workloads",
      body: [
      ],
      examples: [
        {
          id: "fenwick-against-plain-and-prefix",
          title: "Elements touched per operation as the update share changes, and the Fenwick worst case",
          lang: "python",
          code: `# Prefix sums while the array keeps changing. A plain array makes the update
# cheap and the query expensive, a prefix array does the opposite, and a
# Fenwick tree pays a logarithm for each. Every element read or written is
# counted.

N = 1024
OPS = 4000

work = [0]


class Plain:
    def __init__(self, values):
        self.a = list(values)

    def add(self, i, delta):
        work[0] += 1
        self.a[i] += delta

    def prefix(self, i):
        # sum of a[0..i]
        total = 0
        for j in range(i + 1):
            work[0] += 1
            total += self.a[j]
        return total


class PrefixArray:
    def __init__(self, values):
        self.p = []
        running = 0
        for v in values:
            running += v
            self.p.append(running)

    def add(self, i, delta):
        for j in range(i, len(self.p)):
            work[0] += 1
            self.p[j] += delta

    def prefix(self, i):
        work[0] += 1
        return self.p[i]


class Fenwick:
    def __init__(self, values):
        self.tree = [0] * (len(values) + 1)
        for i in range(len(values)):
            self.add(i, values[i])

    def add(self, i, delta):
        k = i + 1
        while k < len(self.tree):
            work[0] += 1
            self.tree[k] += delta
            k += k & -k          # climb to the next range that covers i

    def prefix(self, i):
        total = 0
        k = i + 1
        while k > 0:
            work[0] += 1
            total += self.tree[k]
            k -= k & -k          # drop the lowest set bit
        return total


# The same linear congruential generator in every language, so the
# operations below are the same operations whichever translation is run.
seed = 61002221


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


values = [rand(100) for _ in range(N)]

print("an array of %d values, %d operations per workload" % (N, OPS))
print()
print("updates   elements touched per operation")
print("  share        plain   prefix array    fenwick")
agree = 0
answers = 0
for percent in [1, 50, 99]:
    ops = []
    for _ in range(OPS):
        if rand(100) < percent:
            ops.append([0, rand(N), rand(100) - 50])
        else:
            ops.append([1, rand(N), 0])
    structures = [Plain(values), PrefixArray(values), Fenwick(values)]
    costs = []
    results = []
    for s in structures:
        work[0] = 0
        out = []
        for op in ops:
            if op[0] == 0:
                s.add(op[1], op[2])
            else:
                out.append(s.prefix(op[1]))
        costs.append(work[0] // OPS)
        results.append(out)
    for q in range(len(results[0])):
        answers += 1
        if results[0][q] == results[1][q] and results[1][q] == results[2][q]:
            agree += 1
    print("%6d%% %12d %14d %10d" % (percent, costs[0], costs[1], costs[2]))
print()
print("all three returned the same prefix sum on %d of %d queries" % (agree, answers))
print()
print("         n   worst fenwick update   worst fenwick query   bits in n")
for n in [256, 1024, 4096, 16384]:
    f = Fenwick([0] * n)
    worst_update = 0
    worst_query = 0
    for i in range(n):
        work[0] = 0
        f.add(i, 1)
        worst_update = max(worst_update, work[0])
        work[0] = 0
        f.prefix(i)
        worst_query = max(worst_query, work[0])
    print("%10d %22d %21d %11d" % (n, worst_update, worst_query, n.bit_length()))
`,
          output: `an array of 1024 values, 4000 operations per workload

updates   elements touched per operation
  share        plain   prefix array    fenwick
     1%          513              4          5
    50%          250            258          5
    99%            5            508          5

all three returned the same prefix sum on 5986 of 5986 queries

         n   worst fenwick update   worst fenwick query   bits in n
       256                      9                     8           9
      1024                     11                    10          11
      4096                     13                    12          13
     16384                     15                    14          15`,
          explanation:
            "All three return the same prefix sum on 5,986 of 5,986 queries. The plain array costs 513 per operation at 1% updates and falls to 5 at 99%. The prefix array does the reverse, 4 at 1% and 508 at 99%. The Fenwick tree costs 5 in every row: its cost does not depend on the mix. The second table is its worst case over every position. At n = 1,024 an update touched at most 11 cells and a query at most 10; each doubling of n adds exactly one to both, tracking the number of bits in n.",
          alternates: [
            {
              lang: "javascript",
              code: `// Prefix sums while the array keeps changing. A plain array makes the update
// cheap and the query expensive, a prefix array does the opposite, and a
// Fenwick tree pays a logarithm for each. Every element read or written is
// counted.

const N = 1024;
const OPS = 4000;

let work = 0;

class Plain {
  constructor(values) {
    this.a = values.slice();
  }

  add(i, delta) {
    work += 1;
    this.a[i] += delta;
  }

  prefix(i) {
    // sum of a[0..i]
    let total = 0;
    for (let j = 0; j <= i; j++) {
      work += 1;
      total += this.a[j];
    }
    return total;
  }
}

class PrefixArray {
  constructor(values) {
    this.p = [];
    let running = 0;
    for (const v of values) {
      running += v;
      this.p.push(running);
    }
  }

  add(i, delta) {
    for (let j = i; j < this.p.length; j++) {
      work += 1;
      this.p[j] += delta;
    }
  }

  prefix(i) {
    work += 1;
    return this.p[i];
  }
}

class Fenwick {
  constructor(values) {
    this.tree = new Array(values.length + 1).fill(0);
    for (let i = 0; i < values.length; i++) this.add(i, values[i]);
  }

  add(i, delta) {
    let k = i + 1;
    while (k < this.tree.length) {
      work += 1;
      this.tree[k] += delta;
      k += k & -k; // climb to the next range that covers i
    }
  }

  prefix(i) {
    let total = 0;
    let k = i + 1;
    while (k > 0) {
      work += 1;
      total += this.tree[k];
      k -= k & -k; // drop the lowest set bit
    }
    return total;
  }
}

// The same linear congruential generator in every language, so the
// operations below are the same operations whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 61002221n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function padLeft(s, width) {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

const values = [];
for (let i = 0; i < N; i++) values.push(rand(100));

console.log("an array of " + N + " values, " + OPS + " operations per workload");
console.log();
console.log("updates   elements touched per operation");
console.log("  share        plain   prefix array    fenwick");
let agree = 0;
let answers = 0;
for (const percent of [1, 50, 99]) {
  const ops = [];
  for (let o = 0; o < OPS; o++) {
    if (rand(100) < percent) ops.push([0, rand(N), rand(100) - 50]);
    else ops.push([1, rand(N), 0]);
  }
  const structures = [new Plain(values), new PrefixArray(values), new Fenwick(values)];
  const costs = [];
  const results = [];
  for (const s of structures) {
    work = 0;
    const out = [];
    for (const op of ops) {
      if (op[0] === 0) s.add(op[1], op[2]);
      else out.push(s.prefix(op[1]));
    }
    costs.push(Math.floor(work / OPS));
    results.push(out);
  }
  for (let q = 0; q < results[0].length; q++) {
    answers += 1;
    if (results[0][q] === results[1][q] && results[1][q] === results[2][q]) agree += 1;
  }
  console.log(
    padLeft(percent, 6) + "% " + padLeft(costs[0], 12) + " " + padLeft(costs[1], 14) + " " +
      padLeft(costs[2], 10),
  );
}
console.log();
console.log("all three returned the same prefix sum on " + agree + " of " + answers + " queries");
console.log();
console.log("         n   worst fenwick update   worst fenwick query   bits in n");
for (const n of [256, 1024, 4096, 16384]) {
  const f = new Fenwick(new Array(n).fill(0));
  let worstUpdate = 0;
  let worstQuery = 0;
  for (let i = 0; i < n; i++) {
    work = 0;
    f.add(i, 1);
    worstUpdate = Math.max(worstUpdate, work);
    work = 0;
    f.prefix(i);
    worstQuery = Math.max(worstQuery, work);
  }
  console.log(
    padLeft(n, 10) + " " + padLeft(worstUpdate, 22) + " " + padLeft(worstQuery, 21) + " " +
      padLeft(n.toString(2).length, 11),
  );
}
`,
            },
            {
              lang: "typescript",
              code: `// Prefix sums while the array keeps changing. A plain array makes the update
// cheap and the query expensive, a prefix array does the opposite, and a
// Fenwick tree pays a logarithm for each. Every element read or written is
// counted.

const N = 1024;
const OPS = 4000;

let work = 0;

class Plain {
  a: number[];

  constructor(values: number[]) {
    this.a = values.slice();
  }

  add(i: number, delta: number): void {
    work += 1;
    this.a[i] += delta;
  }

  prefix(i: number): number {
    // sum of a[0..i]
    let total = 0;
    for (let j = 0; j <= i; j++) {
      work += 1;
      total += this.a[j];
    }
    return total;
  }
}

class PrefixArray {
  p: number[];

  constructor(values: number[]) {
    this.p = [];
    let running = 0;
    for (const v of values) {
      running += v;
      this.p.push(running);
    }
  }

  add(i: number, delta: number): void {
    for (let j = i; j < this.p.length; j++) {
      work += 1;
      this.p[j] += delta;
    }
  }

  prefix(i: number): number {
    work += 1;
    return this.p[i];
  }
}

class Fenwick {
  tree: number[];

  constructor(values: number[]) {
    this.tree = new Array(values.length + 1).fill(0);
    for (let i = 0; i < values.length; i++) this.add(i, values[i]);
  }

  add(i: number, delta: number): void {
    let k = i + 1;
    while (k < this.tree.length) {
      work += 1;
      this.tree[k] += delta;
      k += k & -k; // climb to the next range that covers i
    }
  }

  prefix(i: number): number {
    let total = 0;
    let k = i + 1;
    while (k > 0) {
      work += 1;
      total += this.tree[k];
      k -= k & -k; // drop the lowest set bit
    }
    return total;
  }
}

// The same linear congruential generator in every language, so the
// operations below are the same operations whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 61002221n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function padLeft(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

const values: number[] = [];
for (let i = 0; i < N; i++) values.push(rand(100));

console.log("an array of " + N + " values, " + OPS + " operations per workload");
console.log();
console.log("updates   elements touched per operation");
console.log("  share        plain   prefix array    fenwick");
let agree = 0;
let answers = 0;
for (const percent of [1, 50, 99]) {
  const ops: number[][] = [];
  for (let o = 0; o < OPS; o++) {
    if (rand(100) < percent) ops.push([0, rand(N), rand(100) - 50]);
    else ops.push([1, rand(N), 0]);
  }
  const structures = [new Plain(values), new PrefixArray(values), new Fenwick(values)];
  const costs: number[] = [];
  const results: number[][] = [];
  for (const s of structures) {
    work = 0;
    const out: number[] = [];
    for (const op of ops) {
      if (op[0] === 0) s.add(op[1], op[2]);
      else out.push(s.prefix(op[1]));
    }
    costs.push(Math.floor(work / OPS));
    results.push(out);
  }
  for (let q = 0; q < results[0].length; q++) {
    answers += 1;
    if (results[0][q] === results[1][q] && results[1][q] === results[2][q]) agree += 1;
  }
  console.log(
    padLeft(percent, 6) + "% " + padLeft(costs[0], 12) + " " + padLeft(costs[1], 14) + " " +
      padLeft(costs[2], 10),
  );
}
console.log();
console.log("all three returned the same prefix sum on " + agree + " of " + answers + " queries");
console.log();
console.log("         n   worst fenwick update   worst fenwick query   bits in n");
for (const n of [256, 1024, 4096, 16384]) {
  const f = new Fenwick(new Array(n).fill(0));
  let worstUpdate = 0;
  let worstQuery = 0;
  for (let i = 0; i < n; i++) {
    work = 0;
    f.add(i, 1);
    worstUpdate = Math.max(worstUpdate, work);
    work = 0;
    f.prefix(i);
    worstQuery = Math.max(worstQuery, work);
  }
  console.log(
    padLeft(n, 10) + " " + padLeft(worstUpdate, 22) + " " + padLeft(worstQuery, 21) + " " +
      padLeft(n.toString(2).length, 11),
  );
}
`,
            },
            {
              lang: "java",
              code: `// Prefix sums while the array keeps changing. A plain array makes the update
// cheap and the query expensive, a prefix array does the opposite, and a
// Fenwick tree pays a logarithm for each. Every element read or written is
// counted.

import java.util.ArrayList;
import java.util.List;

public class Main {
  static final int N = 1024;
  static final int OPS = 4000;

  static long work = 0;

  interface PrefixSums {
    void add(int i, long delta);

    long prefix(int i);
  }

  static class Plain implements PrefixSums {
    long[] a;

    Plain(long[] values) {
      a = values.clone();
    }

    public void add(int i, long delta) {
      work += 1;
      a[i] += delta;
    }

    public long prefix(int i) {
      // sum of a[0..i]
      long total = 0;
      for (int j = 0; j <= i; j++) {
        work += 1;
        total += a[j];
      }
      return total;
    }
  }

  static class PrefixArray implements PrefixSums {
    long[] p;

    PrefixArray(long[] values) {
      p = new long[values.length];
      long running = 0;
      for (int i = 0; i < values.length; i++) {
        running += values[i];
        p[i] = running;
      }
    }

    public void add(int i, long delta) {
      for (int j = i; j < p.length; j++) {
        work += 1;
        p[j] += delta;
      }
    }

    public long prefix(int i) {
      work += 1;
      return p[i];
    }
  }

  static class Fenwick implements PrefixSums {
    long[] tree;

    Fenwick(long[] values) {
      tree = new long[values.length + 1];
      for (int i = 0; i < values.length; i++) {
        add(i, values[i]);
      }
    }

    public void add(int i, long delta) {
      int k = i + 1;
      while (k < tree.length) {
        work += 1;
        tree[k] += delta;
        k += k & -k; // climb to the next range that covers i
      }
    }

    public long prefix(int i) {
      long total = 0;
      int k = i + 1;
      while (k > 0) {
        work += 1;
        total += tree[k];
        k -= k & -k; // drop the lowest set bit
      }
      return total;
    }
  }

  // The same linear congruential generator in every language, so the
  // operations below are the same operations whichever translation is run.
  static long seed = 61002221L;

  static int rand(int n) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return (int) (seed / 65536L % n);
  }

  public static void main(String[] args) {
    long[] values = new long[N];
    for (int i = 0; i < N; i++) {
      values[i] = rand(100);
    }

    System.out.printf("an array of %d values, %d operations per workload%n", N, OPS);
    System.out.println();
    System.out.println("updates   elements touched per operation");
    System.out.println("  share        plain   prefix array    fenwick");
    int agree = 0;
    int answers = 0;
    int[] percents = {1, 50, 99};
    for (int percent : percents) {
      int[][] ops = new int[OPS][3];
      for (int o = 0; o < OPS; o++) {
        if (rand(100) < percent) {
          ops[o][0] = 0;
          ops[o][1] = rand(N);
          ops[o][2] = rand(100) - 50;
        } else {
          ops[o][0] = 1;
          ops[o][1] = rand(N);
          ops[o][2] = 0;
        }
      }
      PrefixSums[] structures = {new Plain(values), new PrefixArray(values), new Fenwick(values)};
      long[] costs = new long[3];
      List<List<Long>> results = new ArrayList<>();
      for (int s = 0; s < 3; s++) {
        work = 0;
        List<Long> out = new ArrayList<>();
        for (int[] op : ops) {
          if (op[0] == 0) {
            structures[s].add(op[1], op[2]);
          } else {
            out.add(structures[s].prefix(op[1]));
          }
        }
        costs[s] = work / OPS;
        results.add(out);
      }
      for (int q = 0; q < results.get(0).size(); q++) {
        answers += 1;
        if (results.get(0).get(q).equals(results.get(1).get(q))
            && results.get(1).get(q).equals(results.get(2).get(q))) {
          agree += 1;
        }
      }
      System.out.printf("%6d%% %12d %14d %10d%n", percent, costs[0], costs[1], costs[2]);
    }
    System.out.println();
    System.out.printf("all three returned the same prefix sum on %d of %d queries%n", agree, answers);
    System.out.println();
    System.out.println("         n   worst fenwick update   worst fenwick query   bits in n");
    int[] sizes = {256, 1024, 4096, 16384};
    for (int n : sizes) {
      Fenwick f = new Fenwick(new long[n]);
      long worstUpdate = 0;
      long worstQuery = 0;
      for (int i = 0; i < n; i++) {
        work = 0;
        f.add(i, 1);
        worstUpdate = Math.max(worstUpdate, work);
        work = 0;
        f.prefix(i);
        worstQuery = Math.max(worstQuery, work);
      }
      int bits = 32 - Integer.numberOfLeadingZeros(n);
      System.out.printf("%10d %22d %21d %11d%n", n, worstUpdate, worstQuery, bits);
    }
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// Prefix sums while the array keeps changing. A plain array makes the update
// cheap and the query expensive, a prefix array does the opposite, and a
// Fenwick tree pays a logarithm for each. Every element read or written is
// counted.

#include <algorithm>
#include <cstdio>
#include <vector>

static const int N = 1024;
static const int OPS = 4000;

long long work = 0;

struct PrefixSums {
  virtual ~PrefixSums() {}
  virtual void add(int i, long long delta) = 0;
  virtual long long prefix(int i) = 0;
};

struct Plain : PrefixSums {
  std::vector<long long> a;

  explicit Plain(const std::vector<long long>& values) : a(values) {}

  void add(int i, long long delta) override {
    work += 1;
    a[i] += delta;
  }

  long long prefix(int i) override {
    // sum of a[0..i]
    long long total = 0;
    for (int j = 0; j <= i; j++) {
      work += 1;
      total += a[j];
    }
    return total;
  }
};

struct PrefixArray : PrefixSums {
  std::vector<long long> p;

  explicit PrefixArray(const std::vector<long long>& values) {
    long long running = 0;
    for (long long v : values) {
      running += v;
      p.push_back(running);
    }
  }

  void add(int i, long long delta) override {
    for (int j = i; j < (int)p.size(); j++) {
      work += 1;
      p[j] += delta;
    }
  }

  long long prefix(int i) override {
    work += 1;
    return p[i];
  }
};

struct Fenwick : PrefixSums {
  std::vector<long long> tree;

  explicit Fenwick(const std::vector<long long>& values) : tree(values.size() + 1, 0) {
    for (int i = 0; i < (int)values.size(); i++) {
      add(i, values[i]);
    }
  }

  void add(int i, long long delta) override {
    int k = i + 1;
    while (k < (int)tree.size()) {
      work += 1;
      tree[k] += delta;
      k += k & -k;  // climb to the next range that covers i
    }
  }

  long long prefix(int i) override {
    long long total = 0;
    int k = i + 1;
    while (k > 0) {
      work += 1;
      total += tree[k];
      k -= k & -k;  // drop the lowest set bit
    }
    return total;
  }
};

// The same linear congruential generator in every language, so the
// operations below are the same operations whichever translation is run.
long long seed = 61002221LL;

int rand_below(int n) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return (int)(seed / 65536LL % n);
}

int main() {
  std::vector<long long> values;
  for (int i = 0; i < N; i++) {
    values.push_back(rand_below(100));
  }

  std::printf("an array of %d values, %d operations per workload\\n", N, OPS);
  std::printf("\\n");
  std::printf("updates   elements touched per operation\\n");
  std::printf("  share        plain   prefix array    fenwick\\n");
  int agree = 0;
  int answers = 0;
  int percents[3] = {1, 50, 99};
  for (int percent : percents) {
    std::vector<std::vector<int> > ops;
    for (int o = 0; o < OPS; o++) {
      if (rand_below(100) < percent) {
        int index = rand_below(N);
        int delta = rand_below(100) - 50;
        ops.push_back({0, index, delta});
      } else {
        ops.push_back({1, rand_below(N), 0});
      }
    }
    Plain plain(values);
    PrefixArray prefixArray(values);
    Fenwick fenwick(values);
    PrefixSums* structures[3] = {&plain, &prefixArray, &fenwick};
    long long costs[3];
    std::vector<std::vector<long long> > results(3);
    for (int s = 0; s < 3; s++) {
      work = 0;
      for (const std::vector<int>& op : ops) {
        if (op[0] == 0) {
          structures[s]->add(op[1], op[2]);
        } else {
          results[s].push_back(structures[s]->prefix(op[1]));
        }
      }
      costs[s] = work / OPS;
    }
    for (size_t q = 0; q < results[0].size(); q++) {
      answers += 1;
      if (results[0][q] == results[1][q] && results[1][q] == results[2][q]) {
        agree += 1;
      }
    }
    std::printf("%6d%% %12lld %14lld %10lld\\n", percent, costs[0], costs[1], costs[2]);
  }
  std::printf("\\n");
  std::printf("all three returned the same prefix sum on %d of %d queries\\n", agree, answers);
  std::printf("\\n");
  std::printf("         n   worst fenwick update   worst fenwick query   bits in n\\n");
  int sizes[4] = {256, 1024, 4096, 16384};
  for (int n : sizes) {
    Fenwick f(std::vector<long long>(n, 0));
    long long worstUpdate = 0;
    long long worstQuery = 0;
    for (int i = 0; i < n; i++) {
      work = 0;
      f.add(i, 1);
      worstUpdate = std::max(worstUpdate, work);
      work = 0;
      f.prefix(i);
      worstQuery = std::max(worstQuery, work);
    }
    int bits = 0;
    for (int v = n; v > 0; v >>= 1) {
      bits += 1;
    }
    std::printf("%10d %22lld %21lld %11d\\n", n, worstUpdate, worstQuery, bits);
  }
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Prefix sums while the array keeps changing. A plain array makes the update
// cheap and the query expensive, a prefix array does the opposite, and a
// Fenwick tree pays a logarithm for each. Every element read or written is
// counted.

const N: usize = 1024;
const OPS: usize = 4000;

trait PrefixSums {
    fn add(&mut self, i: usize, delta: i64, work: &mut i64);
    fn prefix(&self, i: usize, work: &mut i64) -> i64;
}

struct Plain {
    a: Vec<i64>,
}

impl PrefixSums for Plain {
    fn add(&mut self, i: usize, delta: i64, work: &mut i64) {
        *work += 1;
        self.a[i] += delta;
    }

    fn prefix(&self, i: usize, work: &mut i64) -> i64 {
        // sum of a[0..i]
        let mut total = 0;
        for j in 0..=i {
            *work += 1;
            total += self.a[j];
        }
        total
    }
}

struct PrefixArray {
    p: Vec<i64>,
}

impl PrefixArray {
    fn new(values: &[i64]) -> PrefixArray {
        let mut p = Vec::new();
        let mut running = 0;
        for &v in values {
            running += v;
            p.push(running);
        }
        PrefixArray { p }
    }
}

impl PrefixSums for PrefixArray {
    fn add(&mut self, i: usize, delta: i64, work: &mut i64) {
        for j in i..self.p.len() {
            *work += 1;
            self.p[j] += delta;
        }
    }

    fn prefix(&self, i: usize, work: &mut i64) -> i64 {
        *work += 1;
        self.p[i]
    }
}

struct Fenwick {
    tree: Vec<i64>,
}

impl Fenwick {
    fn new(values: &[i64]) -> Fenwick {
        let mut f = Fenwick { tree: vec![0; values.len() + 1] };
        let mut ignored = 0;
        for (i, &v) in values.iter().enumerate() {
            f.add(i, v, &mut ignored);
        }
        f
    }
}

impl PrefixSums for Fenwick {
    fn add(&mut self, i: usize, delta: i64, work: &mut i64) {
        let mut k = i + 1;
        while k < self.tree.len() {
            *work += 1;
            self.tree[k] += delta;
            k += k & k.wrapping_neg(); // climb to the next range that covers i
        }
    }

    fn prefix(&self, i: usize, work: &mut i64) -> i64 {
        let mut total = 0;
        let mut k = i + 1;
        while k > 0 {
            *work += 1;
            total += self.tree[k];
            k -= k & k.wrapping_neg(); // drop the lowest set bit
        }
        total
    }
}

// The same linear congruential generator in every language, so the
// operations below are the same operations whichever translation is run.
static mut SEED: i64 = 61002221;

fn rand_below(n: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % n
    }
}

fn main() {
    let values: Vec<i64> = (0..N).map(|_| rand_below(100)).collect();

    println!("an array of {} values, {} operations per workload", N, OPS);
    println!();
    println!("updates   elements touched per operation");
    println!("  share        plain   prefix array    fenwick");
    let mut agree = 0;
    let mut answers = 0;
    for &percent in [1i64, 50, 99].iter() {
        let mut ops: Vec<(i64, usize, i64)> = Vec::new();
        for _ in 0..OPS {
            if rand_below(100) < percent {
                let index = rand_below(N as i64) as usize;
                let delta = rand_below(100) - 50;
                ops.push((0, index, delta));
            } else {
                ops.push((1, rand_below(N as i64) as usize, 0));
            }
        }
        let mut structures: Vec<Box<dyn PrefixSums>> = vec![
            Box::new(Plain { a: values.clone() }),
            Box::new(PrefixArray::new(&values)),
            Box::new(Fenwick::new(&values)),
        ];
        let mut costs: Vec<i64> = Vec::new();
        let mut results: Vec<Vec<i64>> = Vec::new();
        for s in structures.iter_mut() {
            let mut work = 0;
            let mut out: Vec<i64> = Vec::new();
            for op in ops.iter() {
                if op.0 == 0 {
                    s.add(op.1, op.2, &mut work);
                } else {
                    out.push(s.prefix(op.1, &mut work));
                }
            }
            costs.push(work / OPS as i64);
            results.push(out);
        }
        for q in 0..results[0].len() {
            answers += 1;
            if results[0][q] == results[1][q] && results[1][q] == results[2][q] {
                agree += 1;
            }
        }
        println!("{:>6}% {:>12} {:>14} {:>10}", percent, costs[0], costs[1], costs[2]);
    }
    println!();
    println!("all three returned the same prefix sum on {} of {} queries", agree, answers);
    println!();
    println!("         n   worst fenwick update   worst fenwick query   bits in n");
    for &n in [256usize, 1024, 4096, 16384].iter() {
        let mut f = Fenwick::new(&vec![0; n]);
        let mut worst_update = 0;
        let mut worst_query = 0;
        for i in 0..n {
            let mut work = 0;
            f.add(i, 1, &mut work);
            worst_update = worst_update.max(work);
            work = 0;
            f.prefix(i, &mut work);
            worst_query = worst_query.max(work);
        }
        let bits = usize::BITS - n.leading_zeros();
        println!("{:>10} {:>22} {:>21} {:>11}", n, worst_update, worst_query, bits);
    }
}
`,
            },
            {
              lang: "go",
              code: `// Prefix sums while the array keeps changing. A plain array makes the update
// cheap and the query expensive, a prefix array does the opposite, and a
// Fenwick tree pays a logarithm for each. Every element read or written is
// counted.

package main

import (
	"fmt"
	"math/bits"
)

const n = 1024
const opCount = 4000

var work int64

type prefixSums interface {
	add(i int, delta int64)
	prefix(i int) int64
}

type plain struct{ a []int64 }

func (p *plain) add(i int, delta int64) {
	work++
	p.a[i] += delta
}

func (p *plain) prefix(i int) int64 {
	// sum of a[0..i]
	var total int64
	for j := 0; j <= i; j++ {
		work++
		total += p.a[j]
	}
	return total
}

type prefixArray struct{ p []int64 }

func newPrefixArray(values []int64) *prefixArray {
	p := make([]int64, len(values))
	var running int64
	for i, v := range values {
		running += v
		p[i] = running
	}
	return &prefixArray{p: p}
}

func (s *prefixArray) add(i int, delta int64) {
	for j := i; j < len(s.p); j++ {
		work++
		s.p[j] += delta
	}
}

func (s *prefixArray) prefix(i int) int64 {
	work++
	return s.p[i]
}

type fenwick struct{ tree []int64 }

func newFenwick(values []int64) *fenwick {
	f := &fenwick{tree: make([]int64, len(values)+1)}
	for i, v := range values {
		f.add(i, v)
	}
	return f
}

func (f *fenwick) add(i int, delta int64) {
	k := i + 1
	for k < len(f.tree) {
		work++
		f.tree[k] += delta
		k += k & -k // climb to the next range that covers i
	}
}

func (f *fenwick) prefix(i int) int64 {
	var total int64
	k := i + 1
	for k > 0 {
		work++
		total += f.tree[k]
		k -= k & -k // drop the lowest set bit
	}
	return total
}

// The same linear congruential generator in every language, so the
// operations below are the same operations whichever translation is run.
var seed int64 = 61002221

func randBelow(limit int64) int64 {
	seed = (seed*1103515245 + 12345) % 2147483648
	return seed / 65536 % limit
}

func main() {
	values := make([]int64, n)
	for i := range values {
		values[i] = randBelow(100)
	}

	fmt.Printf("an array of %d values, %d operations per workload\\n", n, opCount)
	fmt.Println()
	fmt.Println("updates   elements touched per operation")
	fmt.Println("  share        plain   prefix array    fenwick")
	agree := 0
	answers := 0
	for _, percent := range []int64{1, 50, 99} {
		ops := make([][3]int64, opCount)
		for o := range ops {
			if randBelow(100) < percent {
				index := randBelow(n)
				delta := randBelow(100) - 50
				ops[o] = [3]int64{0, index, delta}
			} else {
				ops[o] = [3]int64{1, randBelow(n), 0}
			}
		}
		structures := []prefixSums{
			&plain{a: append([]int64{}, values...)},
			newPrefixArray(values),
			newFenwick(values),
		}
		costs := make([]int64, 3)
		results := make([][]int64, 3)
		for s, structure := range structures {
			work = 0
			for _, op := range ops {
				if op[0] == 0 {
					structure.add(int(op[1]), op[2])
				} else {
					results[s] = append(results[s], structure.prefix(int(op[1])))
				}
			}
			costs[s] = work / opCount
		}
		for q := range results[0] {
			answers++
			if results[0][q] == results[1][q] && results[1][q] == results[2][q] {
				agree++
			}
		}
		fmt.Printf("%6d%% %12d %14d %10d\\n", percent, costs[0], costs[1], costs[2])
	}
	fmt.Println()
	fmt.Printf("all three returned the same prefix sum on %d of %d queries\\n", agree, answers)
	fmt.Println()
	fmt.Println("         n   worst fenwick update   worst fenwick query   bits in n")
	for _, size := range []int{256, 1024, 4096, 16384} {
		f := newFenwick(make([]int64, size))
		var worstUpdate int64
		var worstQuery int64
		for i := 0; i < size; i++ {
			work = 0
			f.add(i, 1)
			if work > worstUpdate {
				worstUpdate = work
			}
			work = 0
			f.prefix(i)
			if work > worstQuery {
				worstQuery = work
			}
		}
		fmt.Printf("%10d %22d %21d %11d\\n", size, worstUpdate, worstQuery, bits.Len(uint(size)))
	}
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "ranges-and-variants",
      heading: "Ranges, and the variants",
      body: [
        "**Range sum** `sum(l..r)` is `prefix(r) - prefix(l - 1)`. That subtraction is the requirement: the operation needs an inverse. Sums, counts and XOR work; minimum and maximum do not, because a minimum over `1..l-1` cannot be removed from a minimum over `1..r`. For those, use a segment tree.",
        "**Range update, point query.** Store differences instead of values. Adding `delta` to positions `l..r` becomes `update(l, +delta)` and `update(r + 1, -delta)`; the value at `i` is `prefix(i)`.",
        "**Range update, range query.** Keep two Fenwick trees, `B1` and `B2`. Add `delta` to `l..r` with `B1.update(l, delta)`, `B1.update(r+1, -delta)`, `B2.update(l, delta*(l-1))`, `B2.update(r+1, -delta*r)`. Then `prefix(i) = B1.prefix(i) * i - B2.prefix(i)`. Both operations stay `O(log n)`.",
        "**Linear-time build.** Inserting `n` values one at a time costs `O(n log n)`. Instead, copy the values into the cells and for each `k` from 1 to `n` add cell `k` into cell `k + lowbit(k)` if that exists. Each cell is pushed to its parent once.",
      ],
      pitfalls: [
        {
          title: "A zero-based lowbit loop",
          body: "`0 & -0` is 0, so the update loop never moves. Shift positions by one on entry.",
        },
        {
          title: "Using it for range minimum",
          body: "A range answer comes from subtracting two prefixes, and a minimum has no inverse. The result is simply wrong for ranges that do not start at the first position.",
        },
        {
          title: "Overflow in the cells",
          body: "A cell near the top holds the sum of up to half the array. Size the cell type for the total, not for one value.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does a Fenwick tree work?",
      answer:
        "Index from 1 and let lowbit(k) = k & -k. Cell k stores the sum of the lowbit(k) values ending at k. A prefix query adds cell k and then clears its lowest set bit, repeating until zero, so the ranges tile 1..k exactly with at most log n cells. An update at i adds to cell i and then adds lowbit(i), moving to each larger cell whose range contains i. I measured it at n = 1,024: 5 elements touched per operation regardless of the update share, against 513 for a plain array at 1% updates and 508 for a prefix array at 99%, with a worst case equal to the number of bits in n.",
    },
    {
      question: "Can a Fenwick tree answer range minimum queries?",
      answer:
        "Not in the standard form. A range answer is prefix(r) minus prefix(l-1), which needs the operation to have an inverse. Sums, counts and XOR have one; minimum does not, because you cannot remove the minimum of a prefix from the minimum of a longer prefix. For range minimum with updates use a segment tree, and for a static array a sparse table. Fenwick trees do extend to range updates with point queries through a difference array, and to range updates with range queries using two trees.",
    },
  ],
  takeaways: [
    "Cell k holds the lowbit(k) values ending at k",
    "Query: add the cell, clear the lowest set bit, repeat",
    "Update: add to the cell, add the lowest set bit, repeat",
    "One-indexed because lowbit(0) is 0",
    "Measured: 5 elements per operation at every update share, worst case bits in n",
    "Range sums need subtraction, so there is no range minimum",
    "Difference array gives range update with point query; two trees give both ranges",
  ],
};
