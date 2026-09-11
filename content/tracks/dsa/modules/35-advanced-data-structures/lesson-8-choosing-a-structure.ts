import type { Lesson } from "@/content/types";

export const choosingAStructureLesson: Lesson = {
  id: "dsa-advanced-structures-choosing-a-structure",
  slug: "choosing-a-structure",
  moduleSlug: "advanced-data-structures",
  title: "Choosing Between Them: The Decision the Constraints Make",
  summary:
    "Which range structure wins depends on the operation and on the share of updates, and the crossover arrives sooner than intuition suggests. Measured: a sparse table beats a segment tree with no updates and loses at one update per thousand operations.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Classify a range problem by operation, update pattern and query count",
    "Measure total cost, including the build, across update shares",
    "Locate the crossover points between structures",
    "Map a problem statement to a structure in a few questions",
  ],
  sections: [
    {
      id: "three-questions",
      heading: "Three questions",
      body: [
        "Every structure in this module answers range questions over an array. Picking one is three questions about the problem, asked in order.",
        "**What is the operation?** If it has an inverse \u2014 sum, count, XOR \u2014 a range answer can be a difference of two prefixes, so prefix arrays and Fenwick trees are available. If it is idempotent \u2014 min, max, gcd \u2014 overlapping windows are harmless, so a sparse table is available. If it is neither, or the answer is a composite record, only a segment tree applies.",
        "**Do values change, and how?** No updates allows static structures: prefix array, sparse table. Point updates rule those out and leave Fenwick and segment trees. Range updates need a difference-array Fenwick or lazy propagation.",
        "**How many operations, and in what mix?** This decides between structures that are all correct, and it is the question the measurement answers.",
      ],
    },
    {
      id: "measured",
      heading: "The crossover, measured",
      body: [
        "Each row runs 2,000 operations on 1,024 values with a given share of point updates, counting every element read or written, including the build.",
      ],
      examples: [
        {
          id: "cheapest-structure-by-update-share",
          title: "Range sum and range minimum under increasing update shares, build included",
          lang: "python",
          code: `# The same question under different mixes of updates and queries, answered by
# every structure that can answer it. Build cost is included, every element
# read or written is counted, and the cheapest one is named per row.

N = 1024
OPS = 2000
INF = 1 << 30

work = [0]


def bits_in(x):
    return x.bit_length()


# --- range sums ----------------------------------------------------------

class PlainSums:
    def __init__(self, values):
        self.a = list(values)

    def update(self, i, value):
        work[0] += 1
        self.a[i] = value

    def query(self, lo, hi):
        total = 0
        for i in range(lo, hi + 1):
            work[0] += 1
            total += self.a[i]
        return total


class PrefixSums:
    def __init__(self, values):
        self.a = list(values)
        self.p = [0] * (len(values) + 1)
        for i in range(len(values)):
            work[0] += 1
            self.p[i + 1] = self.p[i] + values[i]

    def update(self, i, value):
        delta = value - self.a[i]
        self.a[i] = value
        for j in range(i + 1, len(self.p)):
            work[0] += 1
            self.p[j] += delta

    def query(self, lo, hi):
        work[0] += 2
        return self.p[hi + 1] - self.p[lo]


class FenwickSums:
    def __init__(self, values):
        self.a = [0] * len(values)
        self.tree = [0] * (len(values) + 1)
        for i in range(len(values)):
            self.update(i, values[i])

    def add(self, i, delta):
        k = i + 1
        while k < len(self.tree):
            work[0] += 1
            self.tree[k] += delta
            k += k & -k

    def prefix(self, i):
        total = 0
        k = i + 1
        while k > 0:
            work[0] += 1
            total += self.tree[k]
            k -= k & -k
        return total

    def update(self, i, value):
        self.add(i, value - self.a[i])
        self.a[i] = value

    def query(self, lo, hi):
        return self.prefix(hi) - self.prefix(lo - 1)


# --- range minimums ------------------------------------------------------

class ScanMin:
    def __init__(self, values):
        self.a = list(values)

    def update(self, i, value):
        work[0] += 1
        self.a[i] = value

    def query(self, lo, hi):
        best = INF
        for i in range(lo, hi + 1):
            work[0] += 1
            best = min(best, self.a[i])
        return best


class SparseMin:
    def __init__(self, values):
        self.a = list(values)
        self.rebuild()

    def rebuild(self):
        self.table = [list(self.a)]
        work[0] += len(self.a)
        k = 1
        while (1 << k) <= len(self.a):
            prev = self.table[k - 1]
            half = 1 << (k - 1)
            row = []
            for i in range(len(self.a) - (1 << k) + 1):
                work[0] += 1
                row.append(min(prev[i], prev[i + half]))
            self.table.append(row)
            k += 1

    def update(self, i, value):
        self.a[i] = value
        self.rebuild()             # a static table has no cheaper way

    def query(self, lo, hi):
        work[0] += 2
        k = bits_in(hi - lo + 1) - 1
        return min(self.table[k][lo], self.table[k][hi - (1 << k) + 1])


class SegmentMin:
    # bottom-up: leaves at size..2*size-1, parents above them
    def __init__(self, values):
        self.size = len(values)
        self.tree = [INF] * (2 * self.size)
        for i in range(self.size):
            work[0] += 1
            self.tree[self.size + i] = values[i]
        for node in range(self.size - 1, 0, -1):
            work[0] += 1
            self.tree[node] = min(self.tree[2 * node], self.tree[2 * node + 1])

    def update(self, i, value):
        node = self.size + i
        work[0] += 1
        self.tree[node] = value
        node //= 2
        while node >= 1:
            work[0] += 1
            self.tree[node] = min(self.tree[2 * node], self.tree[2 * node + 1])
            node //= 2

    def query(self, lo, hi):
        best = INF
        lo += self.size
        hi += self.size + 1
        while lo < hi:
            if lo & 1:
                work[0] += 1
                best = min(best, self.tree[lo])
                lo += 1
            if hi & 1:
                hi -= 1
                work[0] += 1
                best = min(best, self.tree[hi])
            lo //= 2
            hi //= 2
        return best


# The same linear congruential generator in every language, so the
# workloads below are the same whichever translation is run.
seed = 26400019


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


def run(kinds, names, per_mille_list, title):
    values = [rand(1000) for _ in range(N)]
    print(title)
    header = "  updates"
    for name in names:
        header += "%15s" % name
    print(header + "   cheapest")
    agreed = 0
    answered = 0
    for per_mille in per_mille_list:
        ops = []
        for _ in range(OPS):
            if rand(1000) < per_mille:
                ops.append([0, rand(N), rand(1000)])
            else:
                lo = rand(N)
                ops.append([1, lo, lo + rand(N - lo)])
        costs = []
        answers = []
        for kind in kinds:
            work[0] = 0
            s = kind(values)
            out = []
            for op in ops:
                if op[0] == 0:
                    s.update(op[1], op[2])
                else:
                    out.append(s.query(op[1], op[2]))
            costs.append(work[0])
            answers.append(out)
        for q in range(len(answers[0])):
            answered += 1
            same = True
            for other in answers:
                if other[q] != answers[0][q]:
                    same = False
            if same:
                agreed += 1
        best = 0
        for i in range(len(costs)):
            if costs[i] < costs[best]:
                best = i
        line = "%7d.%d%%" % (per_mille // 10, per_mille % 10)
        for c in costs:
            line += "%15d" % c
        print(line + "   " + names[best])
    print("  every structure gave the same answer on %d of %d queries" % (agreed, answered))


print("%d values, %d operations per row, build cost included" % (N, OPS))
print()
run([PlainSums, PrefixSums, FenwickSums], ["plain array", "prefix array", "fenwick"],
    [0, 10, 100, 500], "range sum")
print()
run([ScanMin, SparseMin, SegmentMin], ["scan", "sparse table", "segment tree"],
    [0, 1, 10, 100], "range minimum")
`,
          output: `1024 values, 2000 operations per row, build cost included

range sum
  updates    plain array   prefix array        fenwick   cheapest
      0.0%         500539           5024          27683   prefix array
      1.0%         524051          16402          27602   prefix array
     10.0%         459454         118635          26635   fenwick
     50.0%         235037         548849          22643   fenwick
  every structure gave the same answer on 6699 of 6699 queries

range minimum
  updates           scan   sparse table   segment tree   cheapest
      0.0%         510725          13228          16649   sparse table
      0.1%         490680          22454          16297   segment tree
      1.0%         500886         197748          16659   segment tree
     10.0%         460343        1729264          17200   segment tree
  every structure gave the same answer on 7793 of 7793 queries`,
          explanation:
            "For range sums, the prefix array wins with no updates at 5,024 touches and still wins at 1% updates, then loses to the Fenwick tree at 10%, where every update rewrites a large part of the prefix array. By 50% the prefix array costs 548,849 against Fenwick's 22,643. For range minimum, the sparse table wins with no updates, 13,228 against the segment tree's 16,649, and loses at 0.1% updates, because each update is a full rebuild of about 10,000 cells. The plain scan never wins either table. Every structure gave the same answers on all queries in both tables.",
          alternates: [
            {
              lang: "javascript",
              code: `// The same question under different mixes of updates and queries, answered by
// every structure that can answer it. Build cost is included, every element
// read or written is counted, and the cheapest one is named per row.

const N = 1024;
const OPS = 2000;
const INF = 1 << 30;

let work = 0;

function bitsIn(x) {
  return x.toString(2).length;
}

// --- range sums ----------------------------------------------------------

class PlainSums {
  constructor(values) {
    this.a = values.slice();
  }

  update(i, value) {
    work += 1;
    this.a[i] = value;
  }

  query(lo, hi) {
    let total = 0;
    for (let i = lo; i <= hi; i++) {
      work += 1;
      total += this.a[i];
    }
    return total;
  }
}

class PrefixSums {
  constructor(values) {
    this.a = values.slice();
    this.p = new Array(values.length + 1).fill(0);
    for (let i = 0; i < values.length; i++) {
      work += 1;
      this.p[i + 1] = this.p[i] + values[i];
    }
  }

  update(i, value) {
    const delta = value - this.a[i];
    this.a[i] = value;
    for (let j = i + 1; j < this.p.length; j++) {
      work += 1;
      this.p[j] += delta;
    }
  }

  query(lo, hi) {
    work += 2;
    return this.p[hi + 1] - this.p[lo];
  }
}

class FenwickSums {
  constructor(values) {
    this.a = new Array(values.length).fill(0);
    this.tree = new Array(values.length + 1).fill(0);
    for (let i = 0; i < values.length; i++) this.update(i, values[i]);
  }

  add(i, delta) {
    let k = i + 1;
    while (k < this.tree.length) {
      work += 1;
      this.tree[k] += delta;
      k += k & -k;
    }
  }

  prefix(i) {
    let total = 0;
    let k = i + 1;
    while (k > 0) {
      work += 1;
      total += this.tree[k];
      k -= k & -k;
    }
    return total;
  }

  update(i, value) {
    this.add(i, value - this.a[i]);
    this.a[i] = value;
  }

  query(lo, hi) {
    return this.prefix(hi) - this.prefix(lo - 1);
  }
}

// --- range minimums ------------------------------------------------------

class ScanMin {
  constructor(values) {
    this.a = values.slice();
  }

  update(i, value) {
    work += 1;
    this.a[i] = value;
  }

  query(lo, hi) {
    let best = INF;
    for (let i = lo; i <= hi; i++) {
      work += 1;
      best = Math.min(best, this.a[i]);
    }
    return best;
  }
}

class SparseMin {
  constructor(values) {
    this.a = values.slice();
    this.table = [];
    this.rebuild();
  }

  rebuild() {
    this.table = [this.a.slice()];
    work += this.a.length;
    for (let k = 1; 1 << k <= this.a.length; k++) {
      const prev = this.table[k - 1];
      const half = 1 << (k - 1);
      const row = [];
      for (let i = 0; i + (1 << k) <= this.a.length; i++) {
        work += 1;
        row.push(Math.min(prev[i], prev[i + half]));
      }
      this.table.push(row);
    }
  }

  update(i, value) {
    this.a[i] = value;
    this.rebuild(); // a static table has no cheaper way
  }

  query(lo, hi) {
    work += 2;
    const k = bitsIn(hi - lo + 1) - 1;
    return Math.min(this.table[k][lo], this.table[k][hi - (1 << k) + 1]);
  }
}

class SegmentMin {
  // bottom-up: leaves at size..2*size-1, parents above them
  constructor(values) {
    this.size = values.length;
    this.tree = new Array(2 * this.size).fill(INF);
    for (let i = 0; i < this.size; i++) {
      work += 1;
      this.tree[this.size + i] = values[i];
    }
    for (let node = this.size - 1; node > 0; node--) {
      work += 1;
      this.tree[node] = Math.min(this.tree[2 * node], this.tree[2 * node + 1]);
    }
  }

  update(i, value) {
    let node = this.size + i;
    work += 1;
    this.tree[node] = value;
    node = Math.floor(node / 2);
    while (node >= 1) {
      work += 1;
      this.tree[node] = Math.min(this.tree[2 * node], this.tree[2 * node + 1]);
      node = Math.floor(node / 2);
    }
  }

  query(lo, hi) {
    let best = INF;
    lo += this.size;
    hi += this.size + 1;
    while (lo < hi) {
      if (lo & 1) {
        work += 1;
        best = Math.min(best, this.tree[lo]);
        lo += 1;
      }
      if (hi & 1) {
        hi -= 1;
        work += 1;
        best = Math.min(best, this.tree[hi]);
      }
      lo = Math.floor(lo / 2);
      hi = Math.floor(hi / 2);
    }
    return best;
  }
}

// The same linear congruential generator in every language, so the
// workloads below are the same whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 26400019n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function padLeft(s, width) {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

function run(kinds, names, perMilleList, title) {
  const values = [];
  for (let i = 0; i < N; i++) values.push(rand(1000));
  console.log(title);
  let header = "  updates";
  for (const name of names) header += padLeft(name, 15);
  console.log(header + "   cheapest");
  let agreed = 0;
  let answered = 0;
  for (const perMille of perMilleList) {
    const ops = [];
    for (let o = 0; o < OPS; o++) {
      if (rand(1000) < perMille) {
        const index = rand(N);
        ops.push([0, index, rand(1000)]);
      } else {
        const lo = rand(N);
        ops.push([1, lo, lo + rand(N - lo)]);
      }
    }
    const costs = [];
    const answers = [];
    for (const Kind of kinds) {
      work = 0;
      const s = new Kind(values);
      const out = [];
      for (const op of ops) {
        if (op[0] === 0) s.update(op[1], op[2]);
        else out.push(s.query(op[1], op[2]));
      }
      costs.push(work);
      answers.push(out);
    }
    for (let q = 0; q < answers[0].length; q++) {
      answered += 1;
      let same = true;
      for (const other of answers) {
        if (other[q] !== answers[0][q]) same = false;
      }
      if (same) agreed += 1;
    }
    let best = 0;
    for (let i = 0; i < costs.length; i++) {
      if (costs[i] < costs[best]) best = i;
    }
    let line = padLeft(Math.floor(perMille / 10), 7) + "." + (perMille % 10) + "%";
    for (const c of costs) line += padLeft(c, 15);
    console.log(line + "   " + names[best]);
  }
  console.log("  every structure gave the same answer on " + agreed + " of " + answered + " queries");
}

console.log(N + " values, " + OPS + " operations per row, build cost included");
console.log();
run([PlainSums, PrefixSums, FenwickSums], ["plain array", "prefix array", "fenwick"],
  [0, 10, 100, 500], "range sum");
console.log();
run([ScanMin, SparseMin, SegmentMin], ["scan", "sparse table", "segment tree"],
  [0, 1, 10, 100], "range minimum");
`,
            },
            {
              lang: "typescript",
              code: `// The same question under different mixes of updates and queries, answered by
// every structure that can answer it. Build cost is included, every element
// read or written is counted, and the cheapest one is named per row.

const N = 1024;
const OPS = 2000;
const INF = 1 << 30;

interface RangeStructure {
  update(i: number, value: number): void;
  query(lo: number, hi: number): number;
}

type Kind = new (values: number[]) => RangeStructure;

let work = 0;

function bitsIn(x: number): number {
  return x.toString(2).length;
}

// --- range sums ----------------------------------------------------------

class PlainSums implements RangeStructure {
  a: number[];

  constructor(values: number[]) {
    this.a = values.slice();
  }

  update(i: number, value: number): void {
    work += 1;
    this.a[i] = value;
  }

  query(lo: number, hi: number): number {
    let total = 0;
    for (let i = lo; i <= hi; i++) {
      work += 1;
      total += this.a[i];
    }
    return total;
  }
}

class PrefixSums implements RangeStructure {
  a: number[];
  p: number[];

  constructor(values: number[]) {
    this.a = values.slice();
    this.p = new Array(values.length + 1).fill(0);
    for (let i = 0; i < values.length; i++) {
      work += 1;
      this.p[i + 1] = this.p[i] + values[i];
    }
  }

  update(i: number, value: number): void {
    const delta = value - this.a[i];
    this.a[i] = value;
    for (let j = i + 1; j < this.p.length; j++) {
      work += 1;
      this.p[j] += delta;
    }
  }

  query(lo: number, hi: number): number {
    work += 2;
    return this.p[hi + 1] - this.p[lo];
  }
}

class FenwickSums implements RangeStructure {
  a: number[];
  tree: number[];

  constructor(values: number[]) {
    this.a = new Array(values.length).fill(0);
    this.tree = new Array(values.length + 1).fill(0);
    for (let i = 0; i < values.length; i++) this.update(i, values[i]);
  }

  add(i: number, delta: number): void {
    let k = i + 1;
    while (k < this.tree.length) {
      work += 1;
      this.tree[k] += delta;
      k += k & -k;
    }
  }

  prefix(i: number): number {
    let total = 0;
    let k = i + 1;
    while (k > 0) {
      work += 1;
      total += this.tree[k];
      k -= k & -k;
    }
    return total;
  }

  update(i: number, value: number): void {
    this.add(i, value - this.a[i]);
    this.a[i] = value;
  }

  query(lo: number, hi: number): number {
    return this.prefix(hi) - this.prefix(lo - 1);
  }
}

// --- range minimums ------------------------------------------------------

class ScanMin implements RangeStructure {
  a: number[];

  constructor(values: number[]) {
    this.a = values.slice();
  }

  update(i: number, value: number): void {
    work += 1;
    this.a[i] = value;
  }

  query(lo: number, hi: number): number {
    let best = INF;
    for (let i = lo; i <= hi; i++) {
      work += 1;
      best = Math.min(best, this.a[i]);
    }
    return best;
  }
}

class SparseMin implements RangeStructure {
  a: number[];
  table: number[][];

  constructor(values: number[]) {
    this.a = values.slice();
    this.table = [];
    this.rebuild();
  }

  rebuild(): void {
    this.table = [this.a.slice()];
    work += this.a.length;
    for (let k = 1; 1 << k <= this.a.length; k++) {
      const prev = this.table[k - 1];
      const half = 1 << (k - 1);
      const row: number[] = [];
      for (let i = 0; i + (1 << k) <= this.a.length; i++) {
        work += 1;
        row.push(Math.min(prev[i], prev[i + half]));
      }
      this.table.push(row);
    }
  }

  update(i: number, value: number): void {
    this.a[i] = value;
    this.rebuild(); // a static table has no cheaper way
  }

  query(lo: number, hi: number): number {
    work += 2;
    const k = bitsIn(hi - lo + 1) - 1;
    return Math.min(this.table[k][lo], this.table[k][hi - (1 << k) + 1]);
  }
}

class SegmentMin implements RangeStructure {
  size: number;
  tree: number[];

  // bottom-up: leaves at size..2*size-1, parents above them
  constructor(values: number[]) {
    this.size = values.length;
    this.tree = new Array(2 * this.size).fill(INF);
    for (let i = 0; i < this.size; i++) {
      work += 1;
      this.tree[this.size + i] = values[i];
    }
    for (let node = this.size - 1; node > 0; node--) {
      work += 1;
      this.tree[node] = Math.min(this.tree[2 * node], this.tree[2 * node + 1]);
    }
  }

  update(i: number, value: number): void {
    let node = this.size + i;
    work += 1;
    this.tree[node] = value;
    node = Math.floor(node / 2);
    while (node >= 1) {
      work += 1;
      this.tree[node] = Math.min(this.tree[2 * node], this.tree[2 * node + 1]);
      node = Math.floor(node / 2);
    }
  }

  query(lo: number, hi: number): number {
    let best = INF;
    lo += this.size;
    hi += this.size + 1;
    while (lo < hi) {
      if (lo & 1) {
        work += 1;
        best = Math.min(best, this.tree[lo]);
        lo += 1;
      }
      if (hi & 1) {
        hi -= 1;
        work += 1;
        best = Math.min(best, this.tree[hi]);
      }
      lo = Math.floor(lo / 2);
      hi = Math.floor(hi / 2);
    }
    return best;
  }
}

// The same linear congruential generator in every language, so the
// workloads below are the same whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 26400019n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function padLeft(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

function run(kinds: Kind[], names: string[], perMilleList: number[], title: string): void {
  const values: number[] = [];
  for (let i = 0; i < N; i++) values.push(rand(1000));
  console.log(title);
  let header = "  updates";
  for (const name of names) header += padLeft(name, 15);
  console.log(header + "   cheapest");
  let agreed = 0;
  let answered = 0;
  for (const perMille of perMilleList) {
    const ops: number[][] = [];
    for (let o = 0; o < OPS; o++) {
      if (rand(1000) < perMille) {
        const index = rand(N);
        ops.push([0, index, rand(1000)]);
      } else {
        const lo = rand(N);
        ops.push([1, lo, lo + rand(N - lo)]);
      }
    }
    const costs: number[] = [];
    const answers: number[][] = [];
    for (const Kind of kinds) {
      work = 0;
      const s = new Kind(values);
      const out: number[] = [];
      for (const op of ops) {
        if (op[0] === 0) s.update(op[1], op[2]);
        else out.push(s.query(op[1], op[2]));
      }
      costs.push(work);
      answers.push(out);
    }
    for (let q = 0; q < answers[0].length; q++) {
      answered += 1;
      let same = true;
      for (const other of answers) {
        if (other[q] !== answers[0][q]) same = false;
      }
      if (same) agreed += 1;
    }
    let best = 0;
    for (let i = 0; i < costs.length; i++) {
      if (costs[i] < costs[best]) best = i;
    }
    let line = padLeft(Math.floor(perMille / 10), 7) + "." + (perMille % 10) + "%";
    for (const c of costs) line += padLeft(c, 15);
    console.log(line + "   " + names[best]);
  }
  console.log("  every structure gave the same answer on " + agreed + " of " + answered + " queries");
}

console.log(N + " values, " + OPS + " operations per row, build cost included");
console.log();
run([PlainSums, PrefixSums, FenwickSums], ["plain array", "prefix array", "fenwick"],
  [0, 10, 100, 500], "range sum");
console.log();
run([ScanMin, SparseMin, SegmentMin], ["scan", "sparse table", "segment tree"],
  [0, 1, 10, 100], "range minimum");
`,
            },
            {
              lang: "java",
              code: `// The same question under different mixes of updates and queries, answered by
// every structure that can answer it. Build cost is included, every element
// read or written is counted, and the cheapest one is named per row.

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

public class Main {
  static final int N = 1024;
  static final int OPS = 2000;
  static final int INF = 1 << 30;

  static long work = 0;

  interface RangeStructure {
    void update(int i, int value);

    long query(int lo, int hi);
  }

  // --- range sums ----------------------------------------------------------

  static class PlainSums implements RangeStructure {
    int[] a;

    PlainSums(int[] values) {
      a = values.clone();
    }

    public void update(int i, int value) {
      work += 1;
      a[i] = value;
    }

    public long query(int lo, int hi) {
      long total = 0;
      for (int i = lo; i <= hi; i++) {
        work += 1;
        total += a[i];
      }
      return total;
    }
  }

  static class PrefixSums implements RangeStructure {
    int[] a;
    long[] p;

    PrefixSums(int[] values) {
      a = values.clone();
      p = new long[values.length + 1];
      for (int i = 0; i < values.length; i++) {
        work += 1;
        p[i + 1] = p[i] + values[i];
      }
    }

    public void update(int i, int value) {
      long delta = value - a[i];
      a[i] = value;
      for (int j = i + 1; j < p.length; j++) {
        work += 1;
        p[j] += delta;
      }
    }

    public long query(int lo, int hi) {
      work += 2;
      return p[hi + 1] - p[lo];
    }
  }

  static class FenwickSums implements RangeStructure {
    int[] a;
    long[] tree;

    FenwickSums(int[] values) {
      a = new int[values.length];
      tree = new long[values.length + 1];
      for (int i = 0; i < values.length; i++) {
        update(i, values[i]);
      }
    }

    void add(int i, long delta) {
      int k = i + 1;
      while (k < tree.length) {
        work += 1;
        tree[k] += delta;
        k += k & -k;
      }
    }

    long prefix(int i) {
      long total = 0;
      int k = i + 1;
      while (k > 0) {
        work += 1;
        total += tree[k];
        k -= k & -k;
      }
      return total;
    }

    public void update(int i, int value) {
      add(i, value - a[i]);
      a[i] = value;
    }

    public long query(int lo, int hi) {
      return prefix(hi) - prefix(lo - 1);
    }
  }

  // --- range minimums ------------------------------------------------------

  static class ScanMin implements RangeStructure {
    int[] a;

    ScanMin(int[] values) {
      a = values.clone();
    }

    public void update(int i, int value) {
      work += 1;
      a[i] = value;
    }

    public long query(int lo, int hi) {
      int best = INF;
      for (int i = lo; i <= hi; i++) {
        work += 1;
        best = Math.min(best, a[i]);
      }
      return best;
    }
  }

  static class SparseMin implements RangeStructure {
    int[] a;
    List<int[]> table = new ArrayList<>();

    SparseMin(int[] values) {
      a = values.clone();
      rebuild();
    }

    void rebuild() {
      table.clear();
      table.add(a.clone());
      work += a.length;
      for (int k = 1; (1 << k) <= a.length; k++) {
        int[] prev = table.get(k - 1);
        int half = 1 << (k - 1);
        int[] row = new int[a.length - (1 << k) + 1];
        for (int i = 0; i < row.length; i++) {
          work += 1;
          row[i] = Math.min(prev[i], prev[i + half]);
        }
        table.add(row);
      }
    }

    public void update(int i, int value) {
      a[i] = value;
      rebuild(); // a static table has no cheaper way
    }

    public long query(int lo, int hi) {
      work += 2;
      int k = 31 - Integer.numberOfLeadingZeros(hi - lo + 1);
      return Math.min(table.get(k)[lo], table.get(k)[hi - (1 << k) + 1]);
    }
  }

  static class SegmentMin implements RangeStructure {
    // bottom-up: leaves at size..2*size-1, parents above them
    int size;
    int[] tree;

    SegmentMin(int[] values) {
      size = values.length;
      tree = new int[2 * size];
      java.util.Arrays.fill(tree, INF);
      for (int i = 0; i < size; i++) {
        work += 1;
        tree[size + i] = values[i];
      }
      for (int node = size - 1; node > 0; node--) {
        work += 1;
        tree[node] = Math.min(tree[2 * node], tree[2 * node + 1]);
      }
    }

    public void update(int i, int value) {
      int node = size + i;
      work += 1;
      tree[node] = value;
      node /= 2;
      while (node >= 1) {
        work += 1;
        tree[node] = Math.min(tree[2 * node], tree[2 * node + 1]);
        node /= 2;
      }
    }

    public long query(int lo, int hi) {
      int best = INF;
      lo += size;
      hi += size + 1;
      while (lo < hi) {
        if ((lo & 1) == 1) {
          work += 1;
          best = Math.min(best, tree[lo]);
          lo += 1;
        }
        if ((hi & 1) == 1) {
          hi -= 1;
          work += 1;
          best = Math.min(best, tree[hi]);
        }
        lo /= 2;
        hi /= 2;
      }
      return best;
    }
  }

  // The same linear congruential generator in every language, so the
  // workloads below are the same whichever translation is run.
  static long seed = 26400019L;

  static int rand(int n) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return (int) (seed / 65536L % n);
  }

  static void run(
      List<Function<int[], RangeStructure>> kinds, String[] names, int[] perMilleList, String title) {
    int[] values = new int[N];
    for (int i = 0; i < N; i++) {
      values[i] = rand(1000);
    }
    System.out.println(title);
    StringBuilder header = new StringBuilder("  updates");
    for (String name : names) {
      header.append(String.format("%15s", name));
    }
    System.out.println(header + "   cheapest");
    int agreed = 0;
    int answered = 0;
    for (int perMille : perMilleList) {
      int[][] ops = new int[OPS][3];
      for (int o = 0; o < OPS; o++) {
        if (rand(1000) < perMille) {
          ops[o][0] = 0;
          ops[o][1] = rand(N);
          ops[o][2] = rand(1000);
        } else {
          int lo = rand(N);
          ops[o][0] = 1;
          ops[o][1] = lo;
          ops[o][2] = lo + rand(N - lo);
        }
      }
      long[] costs = new long[kinds.size()];
      List<List<Long>> answers = new ArrayList<>();
      for (int k = 0; k < kinds.size(); k++) {
        work = 0;
        RangeStructure s = kinds.get(k).apply(values);
        List<Long> out = new ArrayList<>();
        for (int[] op : ops) {
          if (op[0] == 0) {
            s.update(op[1], op[2]);
          } else {
            out.add(s.query(op[1], op[2]));
          }
        }
        costs[k] = work;
        answers.add(out);
      }
      for (int q = 0; q < answers.get(0).size(); q++) {
        answered += 1;
        boolean same = true;
        for (List<Long> other : answers) {
          if (!other.get(q).equals(answers.get(0).get(q))) {
            same = false;
          }
        }
        if (same) {
          agreed += 1;
        }
      }
      int best = 0;
      for (int i = 0; i < costs.length; i++) {
        if (costs[i] < costs[best]) {
          best = i;
        }
      }
      StringBuilder line = new StringBuilder(String.format("%7d.%d%%", perMille / 10, perMille % 10));
      for (long c : costs) {
        line.append(String.format("%15d", c));
      }
      System.out.println(line + "   " + names[best]);
    }
    System.out.printf("  every structure gave the same answer on %d of %d queries%n", agreed, answered);
  }

  public static void main(String[] args) {
    System.out.printf("%d values, %d operations per row, build cost included%n", N, OPS);
    System.out.println();
    List<Function<int[], RangeStructure>> sums = new ArrayList<>();
    sums.add(PlainSums::new);
    sums.add(PrefixSums::new);
    sums.add(FenwickSums::new);
    run(sums, new String[] {"plain array", "prefix array", "fenwick"}, new int[] {0, 10, 100, 500},
        "range sum");
    System.out.println();
    List<Function<int[], RangeStructure>> mins = new ArrayList<>();
    mins.add(ScanMin::new);
    mins.add(SparseMin::new);
    mins.add(SegmentMin::new);
    run(mins, new String[] {"scan", "sparse table", "segment tree"}, new int[] {0, 1, 10, 100},
        "range minimum");
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// The same question under different mixes of updates and queries, answered by
// every structure that can answer it. Build cost is included, every element
// read or written is counted, and the cheapest one is named per row.

#include <algorithm>
#include <cstdio>
#include <functional>
#include <memory>
#include <string>
#include <vector>

static const int N = 1024;
static const int OPS = 2000;
static const int INF = 1 << 30;

long long work = 0;

struct RangeStructure {
  virtual ~RangeStructure() {}
  virtual void update(int i, int value) = 0;
  virtual long long query(int lo, int hi) = 0;
};

// --- range sums ----------------------------------------------------------

struct PlainSums : RangeStructure {
  std::vector<int> a;

  explicit PlainSums(const std::vector<int>& values) : a(values) {}

  void update(int i, int value) override {
    work += 1;
    a[i] = value;
  }

  long long query(int lo, int hi) override {
    long long total = 0;
    for (int i = lo; i <= hi; i++) {
      work += 1;
      total += a[i];
    }
    return total;
  }
};

struct PrefixSums : RangeStructure {
  std::vector<int> a;
  std::vector<long long> p;

  explicit PrefixSums(const std::vector<int>& values) : a(values), p(values.size() + 1, 0) {
    for (size_t i = 0; i < values.size(); i++) {
      work += 1;
      p[i + 1] = p[i] + values[i];
    }
  }

  void update(int i, int value) override {
    long long delta = value - a[i];
    a[i] = value;
    for (size_t j = i + 1; j < p.size(); j++) {
      work += 1;
      p[j] += delta;
    }
  }

  long long query(int lo, int hi) override {
    work += 2;
    return p[hi + 1] - p[lo];
  }
};

struct FenwickSums : RangeStructure {
  std::vector<int> a;
  std::vector<long long> tree;

  explicit FenwickSums(const std::vector<int>& values)
      : a(values.size(), 0), tree(values.size() + 1, 0) {
    for (size_t i = 0; i < values.size(); i++) {
      update((int)i, values[i]);
    }
  }

  void add(int i, long long delta) {
    int k = i + 1;
    while (k < (int)tree.size()) {
      work += 1;
      tree[k] += delta;
      k += k & -k;
    }
  }

  long long prefix(int i) {
    long long total = 0;
    int k = i + 1;
    while (k > 0) {
      work += 1;
      total += tree[k];
      k -= k & -k;
    }
    return total;
  }

  void update(int i, int value) override {
    add(i, value - a[i]);
    a[i] = value;
  }

  long long query(int lo, int hi) override {
    return prefix(hi) - prefix(lo - 1);
  }
};

// --- range minimums ------------------------------------------------------

struct ScanMin : RangeStructure {
  std::vector<int> a;

  explicit ScanMin(const std::vector<int>& values) : a(values) {}

  void update(int i, int value) override {
    work += 1;
    a[i] = value;
  }

  long long query(int lo, int hi) override {
    int best = INF;
    for (int i = lo; i <= hi; i++) {
      work += 1;
      best = std::min(best, a[i]);
    }
    return best;
  }
};

struct SparseMin : RangeStructure {
  std::vector<int> a;
  std::vector<std::vector<int> > table;

  explicit SparseMin(const std::vector<int>& values) : a(values) {
    rebuild();
  }

  void rebuild() {
    table.assign(1, a);
    work += (long long)a.size();
    for (int k = 1; (1 << k) <= (int)a.size(); k++) {
      int half = 1 << (k - 1);
      std::vector<int> row;
      for (int i = 0; i + (1 << k) <= (int)a.size(); i++) {
        work += 1;
        row.push_back(std::min(table[k - 1][i], table[k - 1][i + half]));
      }
      table.push_back(row);
    }
  }

  void update(int i, int value) override {
    a[i] = value;
    rebuild();  // a static table has no cheaper way
  }

  long long query(int lo, int hi) override {
    work += 2;
    int length = hi - lo + 1;
    int k = 0;
    while ((2 << k) <= length) {
      k += 1;
    }
    return std::min(table[k][lo], table[k][hi - (1 << k) + 1]);
  }
};

struct SegmentMin : RangeStructure {
  // bottom-up: leaves at size..2*size-1, parents above them
  int size;
  std::vector<int> tree;

  explicit SegmentMin(const std::vector<int>& values)
      : size((int)values.size()), tree(2 * values.size(), INF) {
    for (int i = 0; i < size; i++) {
      work += 1;
      tree[size + i] = values[i];
    }
    for (int node = size - 1; node > 0; node--) {
      work += 1;
      tree[node] = std::min(tree[2 * node], tree[2 * node + 1]);
    }
  }

  void update(int i, int value) override {
    int node = size + i;
    work += 1;
    tree[node] = value;
    node /= 2;
    while (node >= 1) {
      work += 1;
      tree[node] = std::min(tree[2 * node], tree[2 * node + 1]);
      node /= 2;
    }
  }

  long long query(int lo, int hi) override {
    int best = INF;
    lo += size;
    hi += size + 1;
    while (lo < hi) {
      if (lo & 1) {
        work += 1;
        best = std::min(best, tree[lo]);
        lo += 1;
      }
      if (hi & 1) {
        hi -= 1;
        work += 1;
        best = std::min(best, tree[hi]);
      }
      lo /= 2;
      hi /= 2;
    }
    return best;
  }
};

// The same linear congruential generator in every language, so the
// workloads below are the same whichever translation is run.
long long seed = 26400019LL;

int rand_below(int n) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return (int)(seed / 65536LL % n);
}

typedef std::function<std::unique_ptr<RangeStructure>(const std::vector<int>&)> Kind;

void run(const std::vector<Kind>& kinds, const std::vector<std::string>& names,
         const std::vector<int>& perMilleList, const char* title) {
  std::vector<int> values;
  for (int i = 0; i < N; i++) {
    values.push_back(rand_below(1000));
  }
  std::printf("%s\\n", title);
  std::printf("  updates");
  for (const std::string& name : names) {
    std::printf("%15s", name.c_str());
  }
  std::printf("   cheapest\\n");
  int agreed = 0;
  int answered = 0;
  for (int perMille : perMilleList) {
    std::vector<std::vector<int> > ops;
    for (int o = 0; o < OPS; o++) {
      if (rand_below(1000) < perMille) {
        int index = rand_below(N);
        int value = rand_below(1000);
        ops.push_back({0, index, value});
      } else {
        int lo = rand_below(N);
        int hi = lo + rand_below(N - lo);
        ops.push_back({1, lo, hi});
      }
    }
    std::vector<long long> costs;
    std::vector<std::vector<long long> > answers;
    for (const Kind& kind : kinds) {
      work = 0;
      std::unique_ptr<RangeStructure> s = kind(values);
      std::vector<long long> out;
      for (const std::vector<int>& op : ops) {
        if (op[0] == 0) {
          s->update(op[1], op[2]);
        } else {
          out.push_back(s->query(op[1], op[2]));
        }
      }
      costs.push_back(work);
      answers.push_back(out);
    }
    for (size_t q = 0; q < answers[0].size(); q++) {
      answered += 1;
      bool same = true;
      for (const std::vector<long long>& other : answers) {
        if (other[q] != answers[0][q]) {
          same = false;
        }
      }
      if (same) {
        agreed += 1;
      }
    }
    size_t best = 0;
    for (size_t i = 0; i < costs.size(); i++) {
      if (costs[i] < costs[best]) {
        best = i;
      }
    }
    std::printf("%7d.%d%%", perMille / 10, perMille % 10);
    for (long long c : costs) {
      std::printf("%15lld", c);
    }
    std::printf("   %s\\n", names[best].c_str());
  }
  std::printf("  every structure gave the same answer on %d of %d queries\\n", agreed, answered);
}

int main() {
  std::printf("%d values, %d operations per row, build cost included\\n", N, OPS);
  std::printf("\\n");
  std::vector<Kind> sums = {
      [](const std::vector<int>& v) { return std::unique_ptr<RangeStructure>(new PlainSums(v)); },
      [](const std::vector<int>& v) { return std::unique_ptr<RangeStructure>(new PrefixSums(v)); },
      [](const std::vector<int>& v) { return std::unique_ptr<RangeStructure>(new FenwickSums(v)); },
  };
  run(sums, {"plain array", "prefix array", "fenwick"}, {0, 10, 100, 500}, "range sum");
  std::printf("\\n");
  std::vector<Kind> mins = {
      [](const std::vector<int>& v) { return std::unique_ptr<RangeStructure>(new ScanMin(v)); },
      [](const std::vector<int>& v) { return std::unique_ptr<RangeStructure>(new SparseMin(v)); },
      [](const std::vector<int>& v) { return std::unique_ptr<RangeStructure>(new SegmentMin(v)); },
  };
  run(mins, {"scan", "sparse table", "segment tree"}, {0, 1, 10, 100}, "range minimum");
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// The same question under different mixes of updates and queries, answered by
// every structure that can answer it. Build cost is included, every element
// read or written is counted, and the cheapest one is named per row.

const N: usize = 1024;
const OPS: usize = 2000;
const INF: i64 = 1 << 30;

static mut WORK: i64 = 0;

fn tick(amount: i64) {
    unsafe {
        WORK += amount;
    }
}

trait RangeStructure {
    fn update(&mut self, i: usize, value: i64);
    fn query(&mut self, lo: usize, hi: usize) -> i64;
}

// --- range sums ----------------------------------------------------------

struct PlainSums {
    a: Vec<i64>,
}

impl RangeStructure for PlainSums {
    fn update(&mut self, i: usize, value: i64) {
        tick(1);
        self.a[i] = value;
    }

    fn query(&mut self, lo: usize, hi: usize) -> i64 {
        let mut total = 0;
        for i in lo..=hi {
            tick(1);
            total += self.a[i];
        }
        total
    }
}

struct PrefixSums {
    a: Vec<i64>,
    p: Vec<i64>,
}

impl PrefixSums {
    fn new(values: &[i64]) -> PrefixSums {
        let mut p = vec![0; values.len() + 1];
        for i in 0..values.len() {
            tick(1);
            p[i + 1] = p[i] + values[i];
        }
        PrefixSums { a: values.to_vec(), p }
    }
}

impl RangeStructure for PrefixSums {
    fn update(&mut self, i: usize, value: i64) {
        let delta = value - self.a[i];
        self.a[i] = value;
        for j in (i + 1)..self.p.len() {
            tick(1);
            self.p[j] += delta;
        }
    }

    fn query(&mut self, lo: usize, hi: usize) -> i64 {
        tick(2);
        self.p[hi + 1] - self.p[lo]
    }
}

struct FenwickSums {
    a: Vec<i64>,
    tree: Vec<i64>,
}

impl FenwickSums {
    fn new(values: &[i64]) -> FenwickSums {
        let mut f = FenwickSums { a: vec![0; values.len()], tree: vec![0; values.len() + 1] };
        for (i, &v) in values.iter().enumerate() {
            f.update(i, v);
        }
        f
    }

    fn add(&mut self, i: usize, delta: i64) {
        let mut k = i + 1;
        while k < self.tree.len() {
            tick(1);
            self.tree[k] += delta;
            k += k & k.wrapping_neg();
        }
    }

    // sum of the first \`count\` values
    fn prefix(&self, count: usize) -> i64 {
        let mut total = 0;
        let mut k = count;
        while k > 0 {
            tick(1);
            total += self.tree[k];
            k -= k & k.wrapping_neg();
        }
        total
    }
}

impl RangeStructure for FenwickSums {
    fn update(&mut self, i: usize, value: i64) {
        let delta = value - self.a[i];
        self.add(i, delta);
        self.a[i] = value;
    }

    fn query(&mut self, lo: usize, hi: usize) -> i64 {
        self.prefix(hi + 1) - self.prefix(lo)
    }
}

// --- range minimums ------------------------------------------------------

struct ScanMin {
    a: Vec<i64>,
}

impl RangeStructure for ScanMin {
    fn update(&mut self, i: usize, value: i64) {
        tick(1);
        self.a[i] = value;
    }

    fn query(&mut self, lo: usize, hi: usize) -> i64 {
        let mut best = INF;
        for i in lo..=hi {
            tick(1);
            best = best.min(self.a[i]);
        }
        best
    }
}

struct SparseMin {
    a: Vec<i64>,
    table: Vec<Vec<i64>>,
}

impl SparseMin {
    fn new(values: &[i64]) -> SparseMin {
        let mut s = SparseMin { a: values.to_vec(), table: Vec::new() };
        s.rebuild();
        s
    }

    fn rebuild(&mut self) {
        self.table = vec![self.a.clone()];
        tick(self.a.len() as i64);
        let mut k = 1;
        while (1usize << k) <= self.a.len() {
            let half = 1usize << (k - 1);
            let mut row: Vec<i64> = Vec::new();
            let mut i = 0;
            while i + (1usize << k) <= self.a.len() {
                tick(1);
                row.push(self.table[k - 1][i].min(self.table[k - 1][i + half]));
                i += 1;
            }
            self.table.push(row);
            k += 1;
        }
    }
}

impl RangeStructure for SparseMin {
    fn update(&mut self, i: usize, value: i64) {
        self.a[i] = value;
        self.rebuild(); // a static table has no cheaper way
    }

    fn query(&mut self, lo: usize, hi: usize) -> i64 {
        tick(2);
        let length = hi - lo + 1;
        let k = (usize::BITS - length.leading_zeros() - 1) as usize;
        self.table[k][lo].min(self.table[k][hi + 1 - (1usize << k)])
    }
}

struct SegmentMin {
    // bottom-up: leaves at size..2*size-1, parents above them
    size: usize,
    tree: Vec<i64>,
}

impl SegmentMin {
    fn new(values: &[i64]) -> SegmentMin {
        let size = values.len();
        let mut tree = vec![INF; 2 * size];
        for i in 0..size {
            tick(1);
            tree[size + i] = values[i];
        }
        for node in (1..size).rev() {
            tick(1);
            tree[node] = tree[2 * node].min(tree[2 * node + 1]);
        }
        SegmentMin { size, tree }
    }
}

impl RangeStructure for SegmentMin {
    fn update(&mut self, i: usize, value: i64) {
        let mut node = self.size + i;
        tick(1);
        self.tree[node] = value;
        node /= 2;
        while node >= 1 {
            tick(1);
            self.tree[node] = self.tree[2 * node].min(self.tree[2 * node + 1]);
            node /= 2;
        }
    }

    fn query(&mut self, lo: usize, hi: usize) -> i64 {
        let mut best = INF;
        let mut l = lo + self.size;
        let mut h = hi + self.size + 1;
        while l < h {
            if l & 1 == 1 {
                tick(1);
                best = best.min(self.tree[l]);
                l += 1;
            }
            if h & 1 == 1 {
                h -= 1;
                tick(1);
                best = best.min(self.tree[h]);
            }
            l /= 2;
            h /= 2;
        }
        best
    }
}

// The same linear congruential generator in every language, so the
// workloads below are the same whichever translation is run.
static mut SEED: i64 = 26400019;

fn rand_below(n: usize) -> usize {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        (SEED / 65536 % n as i64) as usize
    }
}

type Kind = fn(&[i64]) -> Box<dyn RangeStructure>;

fn run(kinds: &[Kind], names: &[&str], per_mille_list: &[usize], title: &str) {
    let values: Vec<i64> = (0..N).map(|_| rand_below(1000) as i64).collect();
    println!("{}", title);
    let mut header = String::from("  updates");
    for name in names {
        header.push_str(&format!("{:>15}", name));
    }
    println!("{}   cheapest", header);
    let mut agreed = 0;
    let mut answered = 0;
    for &per_mille in per_mille_list {
        let mut ops: Vec<(usize, usize, usize)> = Vec::new();
        for _ in 0..OPS {
            if rand_below(1000) < per_mille {
                let index = rand_below(N);
                let value = rand_below(1000);
                ops.push((0, index, value));
            } else {
                let lo = rand_below(N);
                let hi = lo + rand_below(N - lo);
                ops.push((1, lo, hi));
            }
        }
        let mut costs: Vec<i64> = Vec::new();
        let mut answers: Vec<Vec<i64>> = Vec::new();
        for kind in kinds {
            unsafe {
                WORK = 0;
            }
            let mut s = kind(&values);
            let mut out: Vec<i64> = Vec::new();
            for op in ops.iter() {
                if op.0 == 0 {
                    s.update(op.1, op.2 as i64);
                } else {
                    out.push(s.query(op.1, op.2));
                }
            }
            costs.push(unsafe { WORK });
            answers.push(out);
        }
        for q in 0..answers[0].len() {
            answered += 1;
            if answers.iter().all(|other| other[q] == answers[0][q]) {
                agreed += 1;
            }
        }
        let mut best = 0;
        for i in 0..costs.len() {
            if costs[i] < costs[best] {
                best = i;
            }
        }
        let mut line = format!("{:>7}.{}%", per_mille / 10, per_mille % 10);
        for c in costs.iter() {
            line.push_str(&format!("{:>15}", c));
        }
        println!("{}   {}", line, names[best]);
    }
    println!("  every structure gave the same answer on {} of {} queries", agreed, answered);
}

fn main() {
    println!("{} values, {} operations per row, build cost included", N, OPS);
    println!();
    let sums: [Kind; 3] = [
        |v| Box::new(PlainSums { a: v.to_vec() }),
        |v| Box::new(PrefixSums::new(v)),
        |v| Box::new(FenwickSums::new(v)),
    ];
    run(&sums, &["plain array", "prefix array", "fenwick"], &[0, 10, 100, 500], "range sum");
    println!();
    let mins: [Kind; 3] = [
        |v| Box::new(ScanMin { a: v.to_vec() }),
        |v| Box::new(SparseMin::new(v)),
        |v| Box::new(SegmentMin::new(v)),
    ];
    run(&mins, &["scan", "sparse table", "segment tree"], &[0, 1, 10, 100], "range minimum");
}
`,
            },
            {
              lang: "go",
              code: `// The same question under different mixes of updates and queries, answered by
// every structure that can answer it. Build cost is included, every element
// read or written is counted, and the cheapest one is named per row.

package main

import (
	"fmt"
	"math/bits"
)

const n = 1024
const opCount = 2000
const inf = 1 << 30

var work int64

type rangeStructure interface {
	update(i, value int)
	query(lo, hi int) int64
}

// --- range sums ----------------------------------------------------------

type plainSums struct{ a []int }

func newPlainSums(values []int) rangeStructure {
	return &plainSums{a: append([]int{}, values...)}
}

func (s *plainSums) update(i, value int) {
	work++
	s.a[i] = value
}

func (s *plainSums) query(lo, hi int) int64 {
	var total int64
	for i := lo; i <= hi; i++ {
		work++
		total += int64(s.a[i])
	}
	return total
}

type prefixSums struct {
	a []int
	p []int64
}

func newPrefixSums(values []int) rangeStructure {
	s := &prefixSums{a: append([]int{}, values...), p: make([]int64, len(values)+1)}
	for i, v := range values {
		work++
		s.p[i+1] = s.p[i] + int64(v)
	}
	return s
}

func (s *prefixSums) update(i, value int) {
	delta := int64(value - s.a[i])
	s.a[i] = value
	for j := i + 1; j < len(s.p); j++ {
		work++
		s.p[j] += delta
	}
}

func (s *prefixSums) query(lo, hi int) int64 {
	work += 2
	return s.p[hi+1] - s.p[lo]
}

type fenwickSums struct {
	a    []int
	tree []int64
}

func newFenwickSums(values []int) rangeStructure {
	f := &fenwickSums{a: make([]int, len(values)), tree: make([]int64, len(values)+1)}
	for i, v := range values {
		f.update(i, v)
	}
	return f
}

func (f *fenwickSums) add(i int, delta int64) {
	for k := i + 1; k < len(f.tree); k += k & -k {
		work++
		f.tree[k] += delta
	}
}

func (f *fenwickSums) prefix(i int) int64 {
	var total int64
	for k := i + 1; k > 0; k -= k & -k {
		work++
		total += f.tree[k]
	}
	return total
}

func (f *fenwickSums) update(i, value int) {
	f.add(i, int64(value-f.a[i]))
	f.a[i] = value
}

func (f *fenwickSums) query(lo, hi int) int64 {
	return f.prefix(hi) - f.prefix(lo-1)
}

// --- range minimums ------------------------------------------------------

type scanMin struct{ a []int }

func newScanMin(values []int) rangeStructure {
	return &scanMin{a: append([]int{}, values...)}
}

func (s *scanMin) update(i, value int) {
	work++
	s.a[i] = value
}

func (s *scanMin) query(lo, hi int) int64 {
	best := inf
	for i := lo; i <= hi; i++ {
		work++
		best = min(best, s.a[i])
	}
	return int64(best)
}

type sparseMin struct {
	a     []int
	table [][]int
}

func newSparseMin(values []int) rangeStructure {
	s := &sparseMin{a: append([]int{}, values...)}
	s.rebuild()
	return s
}

func (s *sparseMin) rebuild() {
	s.table = [][]int{append([]int{}, s.a...)}
	work += int64(len(s.a))
	for k := 1; 1<<k <= len(s.a); k++ {
		half := 1 << (k - 1)
		row := []int{}
		for i := 0; i+(1<<k) <= len(s.a); i++ {
			work++
			row = append(row, min(s.table[k-1][i], s.table[k-1][i+half]))
		}
		s.table = append(s.table, row)
	}
}

func (s *sparseMin) update(i, value int) {
	s.a[i] = value
	s.rebuild() // a static table has no cheaper way
}

func (s *sparseMin) query(lo, hi int) int64 {
	work += 2
	k := bits.Len(uint(hi-lo+1)) - 1
	return int64(min(s.table[k][lo], s.table[k][hi-(1<<k)+1]))
}

// bottom-up: leaves at size..2*size-1, parents above them
type segmentMin struct {
	size int
	tree []int
}

func newSegmentMin(values []int) rangeStructure {
	s := &segmentMin{size: len(values), tree: make([]int, 2*len(values))}
	for i := range s.tree {
		s.tree[i] = inf
	}
	for i, v := range values {
		work++
		s.tree[s.size+i] = v
	}
	for node := s.size - 1; node > 0; node-- {
		work++
		s.tree[node] = min(s.tree[2*node], s.tree[2*node+1])
	}
	return s
}

func (s *segmentMin) update(i, value int) {
	node := s.size + i
	work++
	s.tree[node] = value
	for node /= 2; node >= 1; node /= 2 {
		work++
		s.tree[node] = min(s.tree[2*node], s.tree[2*node+1])
	}
}

func (s *segmentMin) query(lo, hi int) int64 {
	best := inf
	lo += s.size
	hi += s.size + 1
	for lo < hi {
		if lo&1 == 1 {
			work++
			best = min(best, s.tree[lo])
			lo++
		}
		if hi&1 == 1 {
			hi--
			work++
			best = min(best, s.tree[hi])
		}
		lo /= 2
		hi /= 2
	}
	return int64(best)
}

// The same linear congruential generator in every language, so the
// workloads below are the same whichever translation is run.
var seed int64 = 26400019

func randBelow(limit int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(limit))
}

func run(kinds []func([]int) rangeStructure, names []string, perMilleList []int, title string) {
	values := make([]int, n)
	for i := range values {
		values[i] = randBelow(1000)
	}
	fmt.Println(title)
	header := "  updates"
	for _, name := range names {
		header += fmt.Sprintf("%15s", name)
	}
	fmt.Println(header + "   cheapest")
	agreed := 0
	answered := 0
	for _, perMille := range perMilleList {
		ops := make([][3]int, opCount)
		for o := range ops {
			if randBelow(1000) < perMille {
				index := randBelow(n)
				ops[o] = [3]int{0, index, randBelow(1000)}
			} else {
				lo := randBelow(n)
				ops[o] = [3]int{1, lo, lo + randBelow(n-lo)}
			}
		}
		costs := []int64{}
		answers := [][]int64{}
		for _, kind := range kinds {
			work = 0
			s := kind(values)
			out := []int64{}
			for _, op := range ops {
				if op[0] == 0 {
					s.update(op[1], op[2])
				} else {
					out = append(out, s.query(op[1], op[2]))
				}
			}
			costs = append(costs, work)
			answers = append(answers, out)
		}
		for q := range answers[0] {
			answered++
			same := true
			for _, other := range answers {
				if other[q] != answers[0][q] {
					same = false
				}
			}
			if same {
				agreed++
			}
		}
		best := 0
		for i := range costs {
			if costs[i] < costs[best] {
				best = i
			}
		}
		line := fmt.Sprintf("%7d.%d%%", perMille/10, perMille%10)
		for _, c := range costs {
			line += fmt.Sprintf("%15d", c)
		}
		fmt.Println(line + "   " + names[best])
	}
	fmt.Printf("  every structure gave the same answer on %d of %d queries\\n", agreed, answered)
}

func main() {
	fmt.Printf("%d values, %d operations per row, build cost included\\n", n, opCount)
	fmt.Println()
	run([]func([]int) rangeStructure{newPlainSums, newPrefixSums, newFenwickSums},
		[]string{"plain array", "prefix array", "fenwick"}, []int{0, 10, 100, 500}, "range sum")
	fmt.Println()
	run([]func([]int) rangeStructure{newScanMin, newSparseMin, newSegmentMin},
		[]string{"scan", "sparse table", "segment tree"}, []int{0, 1, 10, 100}, "range minimum")
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "reading-it",
      heading: "Reading the crossovers",
      body: [
        "**Static structures lose almost immediately once updates appear.** At 1,024 values, one update per thousand operations was enough to make the sparse table more expensive than a segment tree. Its query advantage is two reads against about twenty node visits; one rebuild of `n log n` cells erases hundreds of those.",
        "**The prefix array survives a little longer** because its update costs `n - i` rather than `n log n`, so at 1% updates it still won. At 10% it did not. \"Rarely updated\" in a problem statement usually means a Fenwick or segment tree, not a static array, unless the updates are genuinely a handful.",
        "**The logarithmic structures are flat.** Fenwick cost between 22,643 and 27,683 across all four rows, and the segment tree between 16,297 and 17,200. When the update share is unknown or varies, that flatness is worth more than winning the best case.",
        "**Build cost matters only at small operation counts.** The Fenwick build here was about 10,000 touches, a third of its total. With a million operations it would be negligible, and with fifty it would decide the row.",
      ],
      pitfalls: [
        {
          title: "Choosing a sparse table for data with any updates",
          body: "Measured: it lost at one update per thousand operations. Unless the data is truly static, use a segment tree.",
        },
        {
          title: "Reaching for a segment tree when a prefix array suffices",
          body: "With no updates the prefix array cost 5,024 against about 27,000 for Fenwick. Static sums need nothing more.",
        },
        {
          title: "Ignoring the operation's algebra",
          body: "A Fenwick tree for range minimum, or a sparse table for range sum, is not slow \u2014 it is wrong. Settle the operation before the costs.",
        },
      ],
    },
    {
      id: "the-map",
      heading: "The map",
      body: [
        "**Static array, invertible operation** (range sum, count, XOR): prefix array. Two dimensions: 2-D prefix array.",
        "**Static array, idempotent operation, many queries** (range min, max, gcd): sparse table.",
        "**Point updates, invertible operation**: Fenwick tree \u2014 shortest code, smallest constant.",
        "**Point updates, any associative operation or a composite answer**: segment tree.",
        "**Range updates with point queries, invertible operation**: Fenwick tree over a difference array.",
        "**Range updates with range queries**: segment tree with lazy propagation, or two Fenwick trees for range add with range sum.",
        "**Order statistics over a changing set** (k-th smallest, rank): order-statistic tree, or a Fenwick tree over compressed keys when the key universe is known in advance.",
        "**Prefix questions over strings**: trie.",
        "**Groups that only merge, with relations inside them**: union-find with a value per node.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you choose between a prefix array, a Fenwick tree, a segment tree and a sparse table?",
      answer:
        "By the operation first, then the updates, then the mix. An invertible operation like sum allows prefix structures; an idempotent one like min allows a sparse table; anything else or a composite answer needs a segment tree. No updates allows static structures; point updates need Fenwick or segment tree; range updates need a difference-array Fenwick or lazy propagation. Then the mix decides among correct options. I measured it at 1,024 values and 2,000 operations: the prefix array won range sums at 0% and 1% updates and lost to Fenwick at 10%; the sparse table won range minimum with no updates and lost to the segment tree at 0.1%.",
    },
    {
      question: "The problem says updates are rare. Is a static structure fine?",
      answer:
        "Usually not, and the crossover is earlier than it sounds. In my measurement one update per thousand operations was enough for a segment tree to beat a sparse table on range minimum, because each update forces a rebuild of roughly n log n cells, which cancels hundreds of cheap queries. The prefix array lasted a little longer on sums, still winning at 1% updates, and lost at 10%. The logarithmic structures stayed nearly flat across every update share, which is the safer choice when the rate is uncertain.",
    },
  ],
  takeaways: [
    "Operation first: invertible allows prefixes, idempotent allows sparse tables",
    "Updates second: static, point, or range",
    "Mix third: it decides among the structures that are correct",
    "Measured: prefix array wins sums up to 1% updates, Fenwick wins from 10%",
    "Measured: sparse table wins minimums at 0% and loses at 0.1% updates",
    "Fenwick and segment tree costs stay flat across update shares",
    "A wrong operation for the structure is not slow, it is incorrect",
  ],
};
