import type { Lesson } from "@/content/types";

export const knapsackFamilyLesson: Lesson = {
  id: "dsa-dp-knapsack-family",
  slug: "the-knapsack-family",
  moduleSlug: "dynamic-programming-patterns",
  title: "The Knapsack Family",
  summary:
    "More problems reduce to a knapsack than to anything else in this module, and the family is three questions separated by one clause. The loop direction is the repetition rule, a binary split turns k copies into log k, and the base case is the difference between filling a bag well and filling it exactly.",
  estimatedMinutes: 40,
  objectives: [
    "Tell 0/1, unbounded and bounded knapsack apart by which cell the update reads",
    "Bundle a bounded item into powers of two, and check the split leaves no gaps",
    "Initialise for \"at most\" and for \"exactly\", and guard the sentinel on both sides",
    "Recognise a knapsack by its shape rather than by the word bag",
  ],
  sections: [
    {
      id: "three-questions-one-loop",
      heading: "Three questions, one loop",
      body: [
        "The last module built the machinery. This one is the catalogue, and it opens with the pattern the rest of it keeps referring back to, because more problems reduce to a knapsack than to anything else here.",
        "The family is three problems, and they differ by one clause in the statement: **how many times may an item be taken?** Once. Any number of times. At most `k` times. Nothing else changes \u2014 same items, same capacity, same question about total value \u2014 and the code changes by about as much as the sentence does.",
        "Module 27 lesson 5 already met two of them without naming them. Running the inner loop downwards reads `table[cap - w]` from before this item was considered, so the item can be used at most once. Running it upwards reads a cell this item may already be in, so it can be used again and again. That is the whole distinction, and below it is scored against three different exhaustive searches \u2014 subsets, multisets, and multisets with a ceiling.",
        "Three loops that differ in a direction and a repeat count, each agreeing with its own exhaustive search on all three thousand random instances. The printed rows differ where you would want them to: at capacity 12 the answers are 150, 160 and 150, because two items may be reused, and at capacity 9 they are 110, 120 and 110.",
        "The bounded row is done here in the obvious way \u2014 offer each item as `k` separate copies and run the 0/1 loop over the longer list. It is correct, and it costs `k` copies per item. The next section does it with about `log2(k)`.",
      ],
      examples: [
        {
          id: "one-loop-three-variants",
          title: "The three variants, each against its own exhaustive search",
          lang: "python",
          code: `# The knapsack family is three problems that differ by one word in the statement
# and almost nothing in the code: how many times may an item be taken? Once, any
# number of times, or at most k times.
#
# Each answer is checked against its own exhaustive search, so "one loop solves
# all three" is a measurement rather than a claim.

WEIGHT = [3, 4, 5, 7]
VALUE = [40, 50, 60, 90]
CAPACITY = 14
LIMIT = 2                      # for the bounded variant: at most this many of each


def pack_once(weights, values, capacity):
    """0/1. The inner loop runs downwards, so table[cap - w] is the previous row."""
    table = [0] * (capacity + 1)
    for i in range(len(weights)):
        for cap in range(capacity, weights[i] - 1, -1):
            candidate = table[cap - weights[i]] + values[i]
            if candidate > table[cap]:
                table[cap] = candidate
    return table


def pack_many(weights, values, capacity):
    """Unbounded. Upwards, so table[cap - w] may already include this item."""
    table = [0] * (capacity + 1)
    for i in range(len(weights)):
        for cap in range(weights[i], capacity + 1):
            candidate = table[cap - weights[i]] + values[i]
            if candidate > table[cap]:
                table[cap] = candidate
    return table


def pack_bounded(weights, values, capacity, limit):
    """At most \`limit\` of each, by offering each item as \`limit\` separate copies."""
    copies_w = []
    copies_v = []
    for i in range(len(weights)):
        for _ in range(limit):
            copies_w.append(weights[i])
            copies_v.append(values[i])
    return pack_once(copies_w, copies_v, capacity)


def brute(weights, values, capacity, limit):
    """Every assignment of counts. \`limit\` below zero means no ceiling."""
    n = len(weights)
    best = [0]

    def walk(i, room, worth):
        if i == n:
            if worth > best[0]:
                best[0] = worth
            return
        top = room // weights[i]
        if 0 <= limit < top:
            top = limit
        for count in range(top + 1):
            walk(i + 1, room - count * weights[i], worth + count * values[i])

    walk(0, capacity, 0)
    return best[0]


once = pack_once(WEIGHT, VALUE, CAPACITY)
many = pack_many(WEIGHT, VALUE, CAPACITY)
bounded = pack_bounded(WEIGHT, VALUE, CAPACITY, LIMIT)

print(f"{'item':<6}{'weight':>8}{'value':>8}")
for i in range(len(WEIGHT)):
    print(f"{chr(65 + i):<6}{WEIGHT[i]:>8}{VALUE[i]:>8}")
print(f"capacity {CAPACITY}, and at most {LIMIT} of each for the bounded rows")
print()

print(f"{'capacity':<32}" + "".join(f"{c:>5}" for c in range(CAPACITY + 1)))
print(f"{'each item at most once':<32}" + "".join(f"{v:>5}" for v in once))
print(f"{'  every subset':<32}" + "".join(f"{brute(WEIGHT, VALUE, c, 1):>5}" for c in range(CAPACITY + 1)))
print(f"{'each item any number of times':<32}" + "".join(f"{v:>5}" for v in many))
print(f"{'  every multiset':<32}" + "".join(f"{brute(WEIGHT, VALUE, c, -1):>5}" for c in range(CAPACITY + 1)))
print(f"{'each item at most twice':<32}" + "".join(f"{v:>5}" for v in bounded))
print(f"{'  every count up to two':<32}" + "".join(f"{brute(WEIGHT, VALUE, c, LIMIT):>5}" for c in range(CAPACITY + 1)))
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
scores = [0, 0, 0]
for _ in range(TRIALS):
    n = 2 + rand(4)
    weights = [1 + rand(6) for _ in range(n)]
    values = [10 * (1 + rand(9)) for _ in range(n)]
    cap = 4 + rand(12)
    limit = 1 + rand(3)
    if pack_once(weights, values, cap)[cap] == brute(weights, values, cap, 1):
        scores[0] += 1
    if pack_many(weights, values, cap)[cap] == brute(weights, values, cap, -1):
        scores[1] += 1
    if pack_bounded(weights, values, cap, limit)[cap] == brute(weights, values, cap, limit):
        scores[2] += 1

print(f"scored against exhaustive search on {TRIALS} random instances:")
print(f"  at most once             {scores[0]:>6}")
print(f"  any number of times      {scores[1]:>6}")
print(f"  at most k times          {scores[2]:>6}")
`,
          output: `item    weight   value
A            3      40
B            4      50
C            5      60
D            7      90
capacity 14, and at most 2 of each for the bounded rows

capacity                            0    1    2    3    4    5    6    7    8    9   10   11   12   13   14
each item at most once              0    0    0   40   50   60   60   90  100  110  130  140  150  150  180
  every subset                      0    0    0   40   50   60   60   90  100  110  130  140  150  150  180
each item any number of times       0    0    0   40   50   60   80   90  100  120  130  140  160  170  180
  every multiset                    0    0    0   40   50   60   80   90  100  120  130  140  160  170  180
each item at most twice             0    0    0   40   50   60   80   90  100  110  130  140  150  170  180
  every count up to two             0    0    0   40   50   60   80   90  100  110  130  140  150  170  180

scored against exhaustive search on 3000 random instances:
  at most once               3000
  any number of times        3000
  at most k times            3000`,
          explanation:
            "The three functions differ in a loop direction and, for the bounded one, in how many copies of each item are offered. Each is scored against the search that matches its rule \u2014 every subset, every multiset, and every multiset with a ceiling \u2014 so the rows agreeing is evidence rather than construction.",
          alternates: [
            {
              lang: "javascript",
              code: `// The knapsack family is three problems that differ by one word in the statement
// and almost nothing in the code: how many times may an item be taken? Once, any
// number of times, or at most k times.
//
// Each answer is checked against its own exhaustive search, so "one loop solves
// all three" is a measurement rather than a claim.

const WEIGHT = [3, 4, 5, 7];
const VALUE = [40, 50, 60, 90];
const CAPACITY = 14;
const LIMIT = 2;                 // for the bounded variant: at most this many of each

/** 0/1. The inner loop runs downwards, so table[cap - w] is the previous row. */
function packOnce(weights, values, capacity) {
  const table = new Array(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    for (let cap = capacity; cap >= weights[i]; cap--) {
      const candidate = table[cap - weights[i]] + values[i];
      if (candidate > table[cap]) table[cap] = candidate;
    }
  }
  return table;
}

/** Unbounded. Upwards, so table[cap - w] may already include this item. */
function packMany(weights, values, capacity) {
  const table = new Array(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    for (let cap = weights[i]; cap <= capacity; cap++) {
      const candidate = table[cap - weights[i]] + values[i];
      if (candidate > table[cap]) table[cap] = candidate;
    }
  }
  return table;
}

/** At most \`limit\` of each, by offering each item as \`limit\` separate copies. */
function packBounded(weights, values, capacity, limit) {
  const w = [];
  const v = [];
  for (let i = 0; i < weights.length; i++) {
    for (let c = 0; c < limit; c++) {
      w.push(weights[i]);
      v.push(values[i]);
    }
  }
  return packOnce(w, v, capacity);
}

let best = 0;

function walk(weights, values, i, room, worth, limit) {
  if (i === weights.length) {
    if (worth > best) best = worth;
    return;
  }
  let top = Math.floor(room / weights[i]);
  if (limit >= 0 && limit < top) top = limit;
  for (let count = 0; count <= top; count++) {
    walk(weights, values, i + 1, room - count * weights[i], worth + count * values[i], limit);
  }
}

/** Every assignment of counts. \`limit\` below zero means no ceiling. */
function brute(weights, values, capacity, limit) {
  best = 0;
  walk(weights, values, 0, capacity, 0, limit);
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
const row = (label, values) => padEnd(label, 32) + values.map((v) => pad(v, 5)).join("");

const once = packOnce(WEIGHT, VALUE, CAPACITY);
const many = packMany(WEIGHT, VALUE, CAPACITY);
const bounded = packBounded(WEIGHT, VALUE, CAPACITY, LIMIT);

console.log(padEnd("item", 6) + pad("weight", 8) + pad("value", 8));
for (let i = 0; i < WEIGHT.length; i++) {
  console.log(padEnd(String.fromCharCode(65 + i), 6) + pad(WEIGHT[i], 8) + pad(VALUE[i], 8));
}
console.log(\`capacity \${CAPACITY}, and at most \${LIMIT} of each for the bounded rows\`);
console.log();

const caps = [];
const bruteOnce = [];
const bruteMany = [];
const bruteBounded = [];
for (let c = 0; c <= CAPACITY; c++) {
  caps.push(c);
  bruteOnce.push(brute(WEIGHT, VALUE, c, 1));
  bruteMany.push(brute(WEIGHT, VALUE, c, -1));
  bruteBounded.push(brute(WEIGHT, VALUE, c, LIMIT));
}
console.log(row("capacity", caps));
console.log(row("each item at most once", once));
console.log(row("  every subset", bruteOnce));
console.log(row("each item any number of times", many));
console.log(row("  every multiset", bruteMany));
console.log(row("each item at most twice", bounded));
console.log(row("  every count up to two", bruteBounded));
console.log();

const TRIALS = 3000;
const scores = [0, 0, 0];
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(4);
  const weights = Array.from({ length: n }, () => 1 + rand(6));
  const values = Array.from({ length: n }, () => 10 * (1 + rand(9)));
  const cap = 4 + rand(12);
  const limit = 1 + rand(3);
  if (packOnce(weights, values, cap)[cap] === brute(weights, values, cap, 1)) scores[0]++;
  if (packMany(weights, values, cap)[cap] === brute(weights, values, cap, -1)) scores[1]++;
  if (packBounded(weights, values, cap, limit)[cap] === brute(weights, values, cap, limit)) scores[2]++;
}

console.log(\`scored against exhaustive search on \${TRIALS} random instances:\`);
console.log(\`  at most once             \${pad(scores[0], 6)}\`);
console.log(\`  any number of times      \${pad(scores[1], 6)}\`);
console.log(\`  at most k times          \${pad(scores[2], 6)}\`);
`,
            },
            {
              lang: "typescript",
              code: `// The knapsack family is three problems that differ by one word in the statement
// and almost nothing in the code: how many times may an item be taken? Once, any
// number of times, or at most k times.
//
// Each answer is checked against its own exhaustive search, so "one loop solves
// all three" is a measurement rather than a claim.

const WEIGHT = [3, 4, 5, 7];
const VALUE = [40, 50, 60, 90];
const CAPACITY = 14;
const LIMIT = 2;                 // for the bounded variant: at most this many of each

/** 0/1. The inner loop runs downwards, so table[cap - w] is the previous row. */
function packOnce(weights: number[], values: number[], capacity: number): number[] {
  const table = new Array(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    for (let cap = capacity; cap >= weights[i]; cap--) {
      const candidate = table[cap - weights[i]] + values[i];
      if (candidate > table[cap]) table[cap] = candidate;
    }
  }
  return table;
}

/** Unbounded. Upwards, so table[cap - w] may already include this item. */
function packMany(weights: number[], values: number[], capacity: number): number[] {
  const table = new Array(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    for (let cap = weights[i]; cap <= capacity; cap++) {
      const candidate = table[cap - weights[i]] + values[i];
      if (candidate > table[cap]) table[cap] = candidate;
    }
  }
  return table;
}

/** At most \`limit\` of each, by offering each item as \`limit\` separate copies. */
function packBounded(weights: number[], values: number[], capacity: number, limit: number): number[] {
  const w: number[] = [];
  const v: number[] = [];
  for (let i = 0; i < weights.length; i++) {
    for (let c = 0; c < limit; c++) {
      w.push(weights[i]);
      v.push(values[i]);
    }
  }
  return packOnce(w, v, capacity);
}

let best = 0;

function walk(weights: number[], values: number[], i: number, room: number, worth: number, limit: number): void {
  if (i === weights.length) {
    if (worth > best) best = worth;
    return;
  }
  let top = Math.floor(room / weights[i]);
  if (limit >= 0 && limit < top) top = limit;
  for (let count = 0; count <= top; count++) {
    walk(weights, values, i + 1, room - count * weights[i], worth + count * values[i], limit);
  }
}

/** Every assignment of counts. \`limit\` below zero means no ceiling. */
function brute(weights: number[], values: number[], capacity: number, limit: number): number {
  best = 0;
  walk(weights, values, 0, capacity, 0, limit);
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
const row = (label: string, values: number[]): string =>
  padEnd(label, 32) + values.map((v) => pad(v, 5)).join("");

const once = packOnce(WEIGHT, VALUE, CAPACITY);
const many = packMany(WEIGHT, VALUE, CAPACITY);
const bounded = packBounded(WEIGHT, VALUE, CAPACITY, LIMIT);

console.log(padEnd("item", 6) + pad("weight", 8) + pad("value", 8));
for (let i = 0; i < WEIGHT.length; i++) {
  console.log(padEnd(String.fromCharCode(65 + i), 6) + pad(WEIGHT[i], 8) + pad(VALUE[i], 8));
}
console.log(\`capacity \${CAPACITY}, and at most \${LIMIT} of each for the bounded rows\`);
console.log();

const caps: number[] = [];
const bruteOnce: number[] = [];
const bruteMany: number[] = [];
const bruteBounded: number[] = [];
for (let c = 0; c <= CAPACITY; c++) {
  caps.push(c);
  bruteOnce.push(brute(WEIGHT, VALUE, c, 1));
  bruteMany.push(brute(WEIGHT, VALUE, c, -1));
  bruteBounded.push(brute(WEIGHT, VALUE, c, LIMIT));
}
console.log(row("capacity", caps));
console.log(row("each item at most once", once));
console.log(row("  every subset", bruteOnce));
console.log(row("each item any number of times", many));
console.log(row("  every multiset", bruteMany));
console.log(row("each item at most twice", bounded));
console.log(row("  every count up to two", bruteBounded));
console.log();

const TRIALS = 3000;
const scores = [0, 0, 0];
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(4);
  const weights = Array.from({ length: n }, () => 1 + rand(6));
  const values = Array.from({ length: n }, () => 10 * (1 + rand(9)));
  const cap = 4 + rand(12);
  const limit = 1 + rand(3);
  if (packOnce(weights, values, cap)[cap] === brute(weights, values, cap, 1)) scores[0]++;
  if (packMany(weights, values, cap)[cap] === brute(weights, values, cap, -1)) scores[1]++;
  if (packBounded(weights, values, cap, limit)[cap] === brute(weights, values, cap, limit)) scores[2]++;
}

console.log(\`scored against exhaustive search on \${TRIALS} random instances:\`);
console.log(\`  at most once             \${pad(scores[0], 6)}\`);
console.log(\`  any number of times      \${pad(scores[1], 6)}\`);
console.log(\`  at most k times          \${pad(scores[2], 6)}\`);
`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.List;

// The knapsack family is three problems that differ by one word in the statement
// and almost nothing in the code: how many times may an item be taken? Once, any
// number of times, or at most k times.
//
// Each answer is checked against its own exhaustive search, so "one loop solves
// all three" is a measurement rather than a claim.
public class Main {
    static final int[] WEIGHT = { 3, 4, 5, 7 };
    static final int[] VALUE = { 40, 50, 60, 90 };
    static final int CAPACITY = 14;
    static final int LIMIT = 2;   // for the bounded variant: at most this many of each

    /** 0/1. The inner loop runs downwards, so table[cap - w] is the previous row. */
    static int[] packOnce(int[] weights, int[] values, int capacity) {
        int[] table = new int[capacity + 1];
        for (int i = 0; i < weights.length; i++) {
            for (int cap = capacity; cap >= weights[i]; cap--) {
                int candidate = table[cap - weights[i]] + values[i];
                if (candidate > table[cap]) table[cap] = candidate;
            }
        }
        return table;
    }

    /** Unbounded. Upwards, so table[cap - w] may already include this item. */
    static int[] packMany(int[] weights, int[] values, int capacity) {
        int[] table = new int[capacity + 1];
        for (int i = 0; i < weights.length; i++) {
            for (int cap = weights[i]; cap <= capacity; cap++) {
                int candidate = table[cap - weights[i]] + values[i];
                if (candidate > table[cap]) table[cap] = candidate;
            }
        }
        return table;
    }

    /** At most \`limit\` of each, by offering each item as \`limit\` separate copies. */
    static int[] packBounded(int[] weights, int[] values, int capacity, int limit) {
        List<Integer> w = new ArrayList<>();
        List<Integer> v = new ArrayList<>();
        for (int i = 0; i < weights.length; i++) {
            for (int c = 0; c < limit; c++) {
                w.add(weights[i]);
                v.add(values[i]);
            }
        }
        int[] cw = new int[w.size()];
        int[] cv = new int[v.size()];
        for (int i = 0; i < cw.length; i++) {
            cw[i] = w.get(i);
            cv[i] = v.get(i);
        }
        return packOnce(cw, cv, capacity);
    }

    static int best;

    /** Every assignment of counts. \`limit\` below zero means no ceiling. */
    static int brute(int[] weights, int[] values, int capacity, int limit) {
        best = 0;
        walk(weights, values, 0, capacity, 0, limit);
        return best;
    }

    static void walk(int[] weights, int[] values, int i, int room, int worth, int limit) {
        if (i == weights.length) {
            if (worth > best) best = worth;
            return;
        }
        int top = room / weights[i];
        if (limit >= 0 && limit < top) top = limit;
        for (int count = 0; count <= top; count++) {
            walk(weights, values, i + 1, room - count * weights[i], worth + count * values[i], limit);
        }
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    static String row(String label, int[] values) {
        StringBuilder sb = new StringBuilder(String.format("%-32s", label));
        for (int v : values) sb.append(String.format("%5d", v));
        return sb.toString();
    }

    public static void main(String[] args) {
        int[] once = packOnce(WEIGHT, VALUE, CAPACITY);
        int[] many = packMany(WEIGHT, VALUE, CAPACITY);
        int[] bounded = packBounded(WEIGHT, VALUE, CAPACITY, LIMIT);

        System.out.printf("%-6s%8s%8s%n", "item", "weight", "value");
        for (int i = 0; i < WEIGHT.length; i++) {
            System.out.printf("%-6s%8d%8d%n", (char) ('A' + i), WEIGHT[i], VALUE[i]);
        }
        System.out.printf("capacity %d, and at most %d of each for the bounded rows%n", CAPACITY, LIMIT);
        System.out.println();

        int[] caps = new int[CAPACITY + 1];
        int[] bruteOnce = new int[CAPACITY + 1];
        int[] bruteMany = new int[CAPACITY + 1];
        int[] bruteBounded = new int[CAPACITY + 1];
        for (int c = 0; c <= CAPACITY; c++) {
            caps[c] = c;
            bruteOnce[c] = brute(WEIGHT, VALUE, c, 1);
            bruteMany[c] = brute(WEIGHT, VALUE, c, -1);
            bruteBounded[c] = brute(WEIGHT, VALUE, c, LIMIT);
        }
        System.out.println(row("capacity", caps));
        System.out.println(row("each item at most once", once));
        System.out.println(row("  every subset", bruteOnce));
        System.out.println(row("each item any number of times", many));
        System.out.println(row("  every multiset", bruteMany));
        System.out.println(row("each item at most twice", bounded));
        System.out.println(row("  every count up to two", bruteBounded));
        System.out.println();

        final int TRIALS = 3000;
        int[] scores = new int[3];
        for (int t = 0; t < TRIALS; t++) {
            int n = 2 + rand(4);
            int[] weights = new int[n];
            int[] values = new int[n];
            for (int i = 0; i < n; i++) weights[i] = 1 + rand(6);
            for (int i = 0; i < n; i++) values[i] = 10 * (1 + rand(9));
            int cap = 4 + rand(12);
            int limit = 1 + rand(3);
            if (packOnce(weights, values, cap)[cap] == brute(weights, values, cap, 1)) scores[0]++;
            if (packMany(weights, values, cap)[cap] == brute(weights, values, cap, -1)) scores[1]++;
            if (packBounded(weights, values, cap, limit)[cap] == brute(weights, values, cap, limit)) scores[2]++;
        }

        System.out.printf("scored against exhaustive search on %d random instances:%n", TRIALS);
        System.out.printf("  at most once             %6d%n", scores[0]);
        System.out.printf("  any number of times      %6d%n", scores[1]);
        System.out.printf("  at most k times          %6d%n", scores[2]);
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The knapsack family is three problems that differ by one word in the statement
// and almost nothing in the code: how many times may an item be taken? Once, any
// number of times, or at most k times.
//
// Each answer is checked against its own exhaustive search, so "one loop solves
// all three" is a measurement rather than a claim.
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

static const std::vector<int> WEIGHT = {3, 4, 5, 7};
static const std::vector<int> VALUE = {40, 50, 60, 90};
static const int CAPACITY = 14;
static const int LIMIT = 2;   // for the bounded variant: at most this many of each

// 0/1. The inner loop runs downwards, so table[cap - w] is the previous row.
std::vector<int> packOnce(const std::vector<int> &weights, const std::vector<int> &values, int capacity) {
    std::vector<int> table(capacity + 1, 0);
    for (size_t i = 0; i < weights.size(); i++) {
        for (int cap = capacity; cap >= weights[i]; cap--) {
            int candidate = table[cap - weights[i]] + values[i];
            if (candidate > table[cap]) table[cap] = candidate;
        }
    }
    return table;
}

// Unbounded. Upwards, so table[cap - w] may already include this item.
std::vector<int> packMany(const std::vector<int> &weights, const std::vector<int> &values, int capacity) {
    std::vector<int> table(capacity + 1, 0);
    for (size_t i = 0; i < weights.size(); i++) {
        for (int cap = weights[i]; cap <= capacity; cap++) {
            int candidate = table[cap - weights[i]] + values[i];
            if (candidate > table[cap]) table[cap] = candidate;
        }
    }
    return table;
}

// At most \`limit\` of each, by offering each item as \`limit\` separate copies.
std::vector<int> packBounded(const std::vector<int> &weights, const std::vector<int> &values,
                             int capacity, int limit) {
    std::vector<int> w, v;
    for (size_t i = 0; i < weights.size(); i++) {
        for (int c = 0; c < limit; c++) {
            w.push_back(weights[i]);
            v.push_back(values[i]);
        }
    }
    return packOnce(w, v, capacity);
}

static int best = 0;

void walk(const std::vector<int> &weights, const std::vector<int> &values, size_t i, int room,
          int worth, int limit) {
    if (i == weights.size()) {
        if (worth > best) best = worth;
        return;
    }
    int top = room / weights[i];
    if (limit >= 0 && limit < top) top = limit;
    for (int count = 0; count <= top; count++) {
        walk(weights, values, i + 1, room - count * weights[i], worth + count * values[i], limit);
    }
}

// Every assignment of counts. \`limit\` below zero means no ceiling.
int brute(const std::vector<int> &weights, const std::vector<int> &values, int capacity, int limit) {
    best = 0;
    walk(weights, values, 0, capacity, 0, limit);
    return best;
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

std::string row(const std::string &label, const std::vector<int> &values) {
    std::string out = label;
    out.resize(32, ' ');
    for (int v : values) {
        std::string cell = std::to_string(v);
        out += std::string(5 - cell.size(), ' ') + cell;
    }
    return out;
}

int main() {
    auto once = packOnce(WEIGHT, VALUE, CAPACITY);
    auto many = packMany(WEIGHT, VALUE, CAPACITY);
    auto bounded = packBounded(WEIGHT, VALUE, CAPACITY, LIMIT);

    std::cout << std::left << std::setw(6) << "item" << std::right << std::setw(8) << "weight"
              << std::setw(8) << "value" << "\\n";
    for (size_t i = 0; i < WEIGHT.size(); i++) {
        std::cout << std::left << std::setw(6) << std::string(1, static_cast<char>('A' + i))
                  << std::right << std::setw(8) << WEIGHT[i] << std::setw(8) << VALUE[i] << "\\n";
    }
    std::cout << "capacity " << CAPACITY << ", and at most " << LIMIT
              << " of each for the bounded rows\\n\\n";

    std::vector<int> caps, bruteOnce, bruteMany, bruteBounded;
    for (int c = 0; c <= CAPACITY; c++) {
        caps.push_back(c);
        bruteOnce.push_back(brute(WEIGHT, VALUE, c, 1));
        bruteMany.push_back(brute(WEIGHT, VALUE, c, -1));
        bruteBounded.push_back(brute(WEIGHT, VALUE, c, LIMIT));
    }
    std::cout << row("capacity", caps) << "\\n";
    std::cout << row("each item at most once", once) << "\\n";
    std::cout << row("  every subset", bruteOnce) << "\\n";
    std::cout << row("each item any number of times", many) << "\\n";
    std::cout << row("  every multiset", bruteMany) << "\\n";
    std::cout << row("each item at most twice", bounded) << "\\n";
    std::cout << row("  every count up to two", bruteBounded) << "\\n\\n";

    const int TRIALS = 3000;
    std::array<int, 3> scores{};
    for (int t = 0; t < TRIALS; t++) {
        int n = 2 + rnd(4);
        std::vector<int> weights(n), values(n);
        for (int i = 0; i < n; i++) weights[i] = 1 + rnd(6);
        for (int i = 0; i < n; i++) values[i] = 10 * (1 + rnd(9));
        int cap = 4 + rnd(12);
        int limit = 1 + rnd(3);
        if (packOnce(weights, values, cap)[cap] == brute(weights, values, cap, 1)) scores[0]++;
        if (packMany(weights, values, cap)[cap] == brute(weights, values, cap, -1)) scores[1]++;
        if (packBounded(weights, values, cap, limit)[cap] == brute(weights, values, cap, limit)) scores[2]++;
    }

    std::cout << "scored against exhaustive search on " << TRIALS << " random instances:\\n";
    std::cout << "  at most once             " << std::setw(6) << scores[0] << "\\n";
    std::cout << "  any number of times      " << std::setw(6) << scores[1] << "\\n";
    std::cout << "  at most k times          " << std::setw(6) << scores[2] << "\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// The knapsack family is three problems that differ by one word in the statement
// and almost nothing in the code: how many times may an item be taken? Once, any
// number of times, or at most k times.
//
// Each answer is checked against its own exhaustive search, so "one loop solves
// all three" is a measurement rather than a claim.

const CAPACITY: usize = 14;
const LIMIT: i32 = 2; // for the bounded variant: at most this many of each

/// 0/1. The inner loop runs downwards, so table[cap - w] is the previous row.
fn pack_once(weights: &[usize], values: &[i32], capacity: usize) -> Vec<i32> {
    let mut table = vec![0i32; capacity + 1];
    for i in 0..weights.len() {
        let mut cap = capacity;
        while cap >= weights[i] {
            let candidate = table[cap - weights[i]] + values[i];
            if candidate > table[cap] {
                table[cap] = candidate;
            }
            if cap == 0 {
                break;
            }
            cap -= 1;
        }
    }
    table
}

/// Unbounded. Upwards, so table[cap - w] may already include this item.
fn pack_many(weights: &[usize], values: &[i32], capacity: usize) -> Vec<i32> {
    let mut table = vec![0i32; capacity + 1];
    for i in 0..weights.len() {
        for cap in weights[i]..=capacity {
            let candidate = table[cap - weights[i]] + values[i];
            if candidate > table[cap] {
                table[cap] = candidate;
            }
        }
    }
    table
}

/// At most \`limit\` of each, by offering each item as \`limit\` separate copies.
fn pack_bounded(weights: &[usize], values: &[i32], capacity: usize, limit: i32) -> Vec<i32> {
    let mut w = Vec::new();
    let mut v = Vec::new();
    for i in 0..weights.len() {
        for _ in 0..limit {
            w.push(weights[i]);
            v.push(values[i]);
        }
    }
    pack_once(&w, &v, capacity)
}

fn walk(weights: &[usize], values: &[i32], i: usize, room: usize, worth: i32, limit: i32, best: &mut i32) {
    if i == weights.len() {
        if worth > *best {
            *best = worth;
        }
        return;
    }
    let mut top = (room / weights[i]) as i32;
    if limit >= 0 && limit < top {
        top = limit;
    }
    for count in 0..=top {
        walk(weights, values, i + 1, room - count as usize * weights[i],
             worth + count * values[i], limit, best);
    }
}

/// Every assignment of counts. \`limit\` below zero means no ceiling.
fn brute(weights: &[usize], values: &[i32], capacity: usize, limit: i32) -> i32 {
    let mut best = 0;
    walk(weights, values, 0, capacity, 0, limit, &mut best);
    best
}

fn rand(seed: &mut i64, n: i64) -> i32 {
    *seed = (*seed * 1103515245 + 12345) % 2147483648;
    (*seed / 65536 % n) as i32
}

fn row(label: &str, values: &[i32]) -> String {
    let mut out = format!("{:<32}", label);
    for v in values {
        out.push_str(&format!("{:>5}", v));
    }
    out
}

fn main() {
    let weight: Vec<usize> = vec![3, 4, 5, 7];
    let value: Vec<i32> = vec![40, 50, 60, 90];

    let once = pack_once(&weight, &value, CAPACITY);
    let many = pack_many(&weight, &value, CAPACITY);
    let bounded = pack_bounded(&weight, &value, CAPACITY, LIMIT);

    println!("{:<6}{:>8}{:>8}", "item", "weight", "value");
    for i in 0..weight.len() {
        println!("{:<6}{:>8}{:>8}", (b'A' + i as u8) as char, weight[i], value[i]);
    }
    println!("capacity {}, and at most {} of each for the bounded rows", CAPACITY, LIMIT);
    println!();

    let caps: Vec<i32> = (0..=CAPACITY as i32).collect();
    let brute_once: Vec<i32> = (0..=CAPACITY).map(|c| brute(&weight, &value, c, 1)).collect();
    let brute_many: Vec<i32> = (0..=CAPACITY).map(|c| brute(&weight, &value, c, -1)).collect();
    let brute_bounded: Vec<i32> = (0..=CAPACITY).map(|c| brute(&weight, &value, c, LIMIT)).collect();
    println!("{}", row("capacity", &caps));
    println!("{}", row("each item at most once", &once));
    println!("{}", row("  every subset", &brute_once));
    println!("{}", row("each item any number of times", &many));
    println!("{}", row("  every multiset", &brute_many));
    println!("{}", row("each item at most twice", &bounded));
    println!("{}", row("  every count up to two", &brute_bounded));
    println!();

    const TRIALS: i32 = 3000;
    let mut seed = 1i64;
    let mut scores = [0i32; 3];
    for _ in 0..TRIALS {
        let n = 2 + rand(&mut seed, 4) as usize;
        let weights: Vec<usize> = (0..n).map(|_| 1 + rand(&mut seed, 6) as usize).collect();
        let values: Vec<i32> = (0..n).map(|_| 10 * (1 + rand(&mut seed, 9))).collect();
        let cap = 4 + rand(&mut seed, 12) as usize;
        let limit = 1 + rand(&mut seed, 3);
        if pack_once(&weights, &values, cap)[cap] == brute(&weights, &values, cap, 1) {
            scores[0] += 1;
        }
        if pack_many(&weights, &values, cap)[cap] == brute(&weights, &values, cap, -1) {
            scores[1] += 1;
        }
        if pack_bounded(&weights, &values, cap, limit)[cap] == brute(&weights, &values, cap, limit) {
            scores[2] += 1;
        }
    }

    println!("scored against exhaustive search on {} random instances:", TRIALS);
    println!("  at most once             {:>6}", scores[0]);
    println!("  any number of times      {:>6}", scores[1]);
    println!("  at most k times          {:>6}", scores[2]);
}
`,
            },
            {
              lang: "go",
              code: `// The knapsack family is three problems that differ by one word in the statement
// and almost nothing in the code: how many times may an item be taken? Once, any
// number of times, or at most k times.
//
// Each answer is checked against its own exhaustive search, so "one loop solves
// all three" is a measurement rather than a claim.
package main

import "fmt"

var WEIGHT = []int{3, 4, 5, 7}
var VALUE = []int{40, 50, 60, 90}

const CAPACITY = 14
const LIMIT = 2 // for the bounded variant: at most this many of each

// 0/1. The inner loop runs downwards, so table[cap - w] is the previous row.
func packOnce(weights, values []int, capacity int) []int {
	table := make([]int, capacity+1)
	for i := range weights {
		for cap := capacity; cap >= weights[i]; cap-- {
			if candidate := table[cap-weights[i]] + values[i]; candidate > table[cap] {
				table[cap] = candidate
			}
		}
	}
	return table
}

// Unbounded. Upwards, so table[cap - w] may already include this item.
func packMany(weights, values []int, capacity int) []int {
	table := make([]int, capacity+1)
	for i := range weights {
		for cap := weights[i]; cap <= capacity; cap++ {
			if candidate := table[cap-weights[i]] + values[i]; candidate > table[cap] {
				table[cap] = candidate
			}
		}
	}
	return table
}

// At most \`limit\` of each, by offering each item as \`limit\` separate copies.
func packBounded(weights, values []int, capacity, limit int) []int {
	var w, v []int
	for i := range weights {
		for c := 0; c < limit; c++ {
			w = append(w, weights[i])
			v = append(v, values[i])
		}
	}
	return packOnce(w, v, capacity)
}

var best int

// Every assignment of counts. \`limit\` below zero means no ceiling.
func brute(weights, values []int, capacity, limit int) int {
	best = 0
	walk(weights, values, 0, capacity, 0, limit)
	return best
}

func walk(weights, values []int, i, room, worth, limit int) {
	if i == len(weights) {
		if worth > best {
			best = worth
		}
		return
	}
	top := room / weights[i]
	if limit >= 0 && limit < top {
		top = limit
	}
	for count := 0; count <= top; count++ {
		walk(weights, values, i+1, room-count*weights[i], worth+count*values[i], limit)
	}
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func row(label string, values []int) string {
	out := fmt.Sprintf("%-32s", label)
	for _, v := range values {
		out += fmt.Sprintf("%5d", v)
	}
	return out
}

func main() {
	once := packOnce(WEIGHT, VALUE, CAPACITY)
	many := packMany(WEIGHT, VALUE, CAPACITY)
	bounded := packBounded(WEIGHT, VALUE, CAPACITY, LIMIT)

	fmt.Printf("%-6s%8s%8s\\n", "item", "weight", "value")
	for i := range WEIGHT {
		fmt.Printf("%-6s%8d%8d\\n", string(rune('A'+i)), WEIGHT[i], VALUE[i])
	}
	fmt.Printf("capacity %d, and at most %d of each for the bounded rows\\n", CAPACITY, LIMIT)
	fmt.Println()

	caps := make([]int, CAPACITY+1)
	bruteOnce := make([]int, CAPACITY+1)
	bruteMany := make([]int, CAPACITY+1)
	bruteBounded := make([]int, CAPACITY+1)
	for c := 0; c <= CAPACITY; c++ {
		caps[c] = c
		bruteOnce[c] = brute(WEIGHT, VALUE, c, 1)
		bruteMany[c] = brute(WEIGHT, VALUE, c, -1)
		bruteBounded[c] = brute(WEIGHT, VALUE, c, LIMIT)
	}
	fmt.Println(row("capacity", caps))
	fmt.Println(row("each item at most once", once))
	fmt.Println(row("  every subset", bruteOnce))
	fmt.Println(row("each item any number of times", many))
	fmt.Println(row("  every multiset", bruteMany))
	fmt.Println(row("each item at most twice", bounded))
	fmt.Println(row("  every count up to two", bruteBounded))
	fmt.Println()

	const TRIALS = 3000
	scores := [3]int{}
	for t := 0; t < TRIALS; t++ {
		n := 2 + rand(4)
		weights := make([]int, n)
		values := make([]int, n)
		for i := 0; i < n; i++ {
			weights[i] = 1 + rand(6)
		}
		for i := 0; i < n; i++ {
			values[i] = 10 * (1 + rand(9))
		}
		cap := 4 + rand(12)
		limit := 1 + rand(3)
		if packOnce(weights, values, cap)[cap] == brute(weights, values, cap, 1) {
			scores[0]++
		}
		if packMany(weights, values, cap)[cap] == brute(weights, values, cap, -1) {
			scores[1]++
		}
		if packBounded(weights, values, cap, limit)[cap] == brute(weights, values, cap, limit) {
			scores[2]++
		}
	}

	fmt.Printf("scored against exhaustive search on %d random instances:\\n", TRIALS)
	fmt.Printf("  at most once             %6d\\n", scores[0])
	fmt.Printf("  any number of times      %6d\\n", scores[1])
	fmt.Printf("  at most k times          %6d\\n", scores[2])
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "dp-knapsack-family",
        kind: "dp",
        algorithm: "knapsack",
        title: "The take-or-leave table the whole family shares",
        lockAlgorithm: true,
      },
    },
    {
      id: "bundles-instead-of-copies",
      heading: "Bundles instead of copies",
      body: [
        "Expanding an item into `k` copies makes the cost `O(n * k * W)`, which is fine when `k` is 3 and painful when `k` is 1,000. The standard repair is to bundle the copies into powers of two, and it rests on a fact worth checking rather than believing: **the sizes 1, 2, 4, 8, \u2026 plus a remainder have subset sums that are exactly the integers 0 through k, with no gaps and nothing over.**",
        "So instead of `k` interchangeable copies you offer a handful of bundles \u2014 one unit, two units, four units \u2014 each priced and weighed for its size. Any count from 0 to `k` is then some subset of the bundles, and the 0/1 loop is already the thing that picks a subset.",
        "The first table is the claim, checked: for every `k` shown, the subset sums of the split are precisely `0..k`. The second is what it buys \u2014 255 copies become 8, and the ratio grows with `k` because one is linear and the other logarithmic.",
        "The third table is the part that matters for trusting it. The two expansions are run side by side on the same knapsack and against an exhaustive search over counts, and all three columns agree for every `k` from 1 to 5. Two thousand random bounded knapsacks agree as well.",
        "Worth noticing what this technique actually is. It does not make bounded knapsack a new algorithm \u2014 it is still the 0/1 loop, unchanged. It changes the *input*, so that a smaller item list expresses the same set of choices. That move, re-encoding the instance rather than rewriting the recurrence, comes up again in the subset-sum lesson and is worth having a name for.",
      ],
      examples: [
        {
          id: "binary-bundles",
          title: "Splitting k into powers of two, and checking it leaves no gaps",
          lang: "python",
          code: `# "At most k of each" was solved on the previous page by offering k separate
# copies of every item, which is correct and costs k copies. It can be done with
# about log2(k) copies instead, and the reason is a fact about binary that is
# worth checking rather than believing.

def split(k):
    """Sizes whose subset sums are exactly the counts 0 through k: 1, 2, 4, ..."""
    parts = []
    piece = 1
    left = k
    while piece <= left:
        parts.append(piece)
        left -= piece
        piece *= 2
    if left > 0:
        parts.append(left)
    return parts


def reachable(parts):
    """Every total a subset of \`parts\` can make."""
    seen = {0}
    for part in parts:
        seen = seen | {total + part for total in seen}
    return seen


def pack_once(weights, values, capacity):
    table = [0] * (capacity + 1)
    for i in range(len(weights)):
        for cap in range(capacity, weights[i] - 1, -1):
            candidate = table[cap - weights[i]] + values[i]
            if candidate > table[cap]:
                table[cap] = candidate
    return table


def expand_every(weights, values, limit):
    """One copy per allowed unit: k copies of each item."""
    out_w, out_v = [], []
    for i in range(len(weights)):
        for _ in range(limit):
            out_w.append(weights[i])
            out_v.append(values[i])
    return out_w, out_v


def expand_binary(weights, values, limit):
    """One copy per power of two: a bundle of \`part\` units, priced accordingly."""
    out_w, out_v = [], []
    for i in range(len(weights)):
        for part in split(limit):
            out_w.append(weights[i] * part)
            out_v.append(values[i] * part)
    return out_w, out_v


def brute(weights, values, capacity, limit):
    n = len(weights)
    best = [0]

    def walk(i, room, worth):
        if i == n:
            if worth > best[0]:
                best[0] = worth
            return
        top = min(room // weights[i], limit)
        for count in range(top + 1):
            walk(i + 1, room - count * weights[i], worth + count * values[i])

    walk(0, capacity, 0)
    return best[0]


print("the split, and what its subsets can count to:")
print(f"{'k':>5}{'parts':>28}{'copies':>8}{'covers 0..k exactly':>22}")
for k in (1, 2, 3, 5, 7, 10, 15, 31, 100, 255):
    parts = split(k)
    exact = reachable(parts) == set(range(k + 1))
    shown = "[" + ", ".join(str(p) for p in parts) + "]"
    if len(shown) > 26:
        shown = shown[:23] + "...]"
    print(f"{k:>5}{shown:>28}{len(parts):>8}{('yes' if exact else 'no'):>22}")
print()

print(f"{'k':>5}{'copies, one per unit':>22}{'copies, binary':>16}{'ratio':>8}")
for k in (1, 3, 7, 15, 31, 63, 127, 255):
    print(f"{k:>5}{k:>22}{len(split(k)):>16}{k // len(split(k)):>8}")
print()

WEIGHT = [3, 4, 5, 7]
VALUE = [40, 50, 60, 90]
CAPACITY = 41

print(f"{'k':>5}{'one copy per unit':>20}{'binary bundles':>17}{'every count':>14}")
for k in (1, 2, 3, 4, 5):
    w1, v1 = expand_every(WEIGHT, VALUE, k)
    w2, v2 = expand_binary(WEIGHT, VALUE, k)
    a = pack_once(w1, v1, CAPACITY)[CAPACITY]
    b = pack_once(w2, v2, CAPACITY)[CAPACITY]
    print(f"{k:>5}{a:>20}{b:>17}{brute(WEIGHT, VALUE, CAPACITY, k):>14}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 2000
agree = 0
exact_cover = 0
for _ in range(TRIALS):
    n = 2 + rand(3)
    weights = [1 + rand(6) for _ in range(n)]
    values = [10 * (1 + rand(9)) for _ in range(n)]
    cap = 4 + rand(12)
    k = 1 + rand(5)
    truth = brute(weights, values, cap, k)
    w2, v2 = expand_binary(weights, values, k)
    if pack_once(w2, v2, cap)[cap] == truth:
        agree += 1
    if reachable(split(k)) == set(range(k + 1)):
        exact_cover += 1

print(f"over {TRIALS} random bounded knapsacks:")
print(f"  binary bundles match exhaustive search   {agree}")
print(f"  the split covers 0..k with no gaps       {exact_cover}")
`,
          output: `the split, and what its subsets can count to:
    k                       parts  copies   covers 0..k exactly
    1                         [1]       1                   yes
    2                      [1, 1]       2                   yes
    3                      [1, 2]       2                   yes
    5                   [1, 2, 2]       3                   yes
    7                   [1, 2, 4]       3                   yes
   10                [1, 2, 4, 3]       4                   yes
   15                [1, 2, 4, 8]       4                   yes
   31            [1, 2, 4, 8, 16]       5                   yes
  100    [1, 2, 4, 8, 16, 32, 37]       7                   yes
  255 [1, 2, 4, 8, 16, 32, 64...]       8                   yes

    k  copies, one per unit  copies, binary   ratio
    1                     1               1       1
    3                     3               2       1
    7                     7               3       2
   15                    15               4       3
   31                    31               5       6
   63                    63               6      10
  127                   127               7      18
  255                   255               8      31

    k   one copy per unit   binary bundles   every count
    1                 240              240           240
    2                 480              480           480
    3                 520              520           520
    4                 530              530           530
    5                 530              530           530

over 2000 random bounded knapsacks:
  binary bundles match exhaustive search   2000
  the split covers 0..k with no gaps       2000`,
          explanation:
            "The first block establishes the property the technique depends on by enumerating every subset sum of the split and comparing the set with 0..k. Only then are the two expansions compared against each other and against an exhaustive search over counts.",
          alternates: [
            {
              lang: "javascript",
              code: `// "At most k of each" was solved on the previous page by offering k separate
// copies of every item, which is correct and costs k copies. It can be done with
// about log2(k) copies instead, and the reason is a fact about binary that is
// worth checking rather than believing.

/** Sizes whose subset sums are exactly the counts 0 through k: 1, 2, 4, ... */
function split(k) {
  const parts = [];
  let piece = 1;
  let left = k;
  while (piece <= left) {
    parts.push(piece);
    left -= piece;
    piece *= 2;
  }
  if (left > 0) parts.push(left);
  return parts;
}

/** Every total a subset of \`parts\` can make. */
function reachable(parts) {
  let seen = new Set([0]);
  for (const part of parts) {
    const next = new Set(seen);
    for (const total of seen) next.add(total + part);
    seen = next;
  }
  return seen;
}

function coversExactly(parts, k) {
  const seen = reachable(parts);
  if (seen.size !== k + 1) return false;
  for (let i = 0; i <= k; i++) if (!seen.has(i)) return false;
  return true;
}

function packOnce(weights, values, capacity) {
  const table = new Array(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    for (let cap = capacity; cap >= weights[i]; cap--) {
      const candidate = table[cap - weights[i]] + values[i];
      if (candidate > table[cap]) table[cap] = candidate;
    }
  }
  return table;
}

/** One copy per allowed unit: k copies of each item. */
function expandEvery(weights, values, limit) {
  const w = [];
  const v = [];
  for (let i = 0; i < weights.length; i++) {
    for (let c = 0; c < limit; c++) {
      w.push(weights[i]);
      v.push(values[i]);
    }
  }
  return [w, v];
}

/** One copy per power of two: a bundle of \`part\` units, priced accordingly. */
function expandBinary(weights, values, limit) {
  const w = [];
  const v = [];
  for (let i = 0; i < weights.length; i++) {
    for (const part of split(limit)) {
      w.push(weights[i] * part);
      v.push(values[i] * part);
    }
  }
  return [w, v];
}

let best = 0;

function walk(weights, values, i, room, worth, limit) {
  if (i === weights.length) {
    if (worth > best) best = worth;
    return;
  }
  const top = Math.min(Math.floor(room / weights[i]), limit);
  for (let count = 0; count <= top; count++) {
    walk(weights, values, i + 1, room - count * weights[i], worth + count * values[i], limit);
  }
}

function brute(weights, values, capacity, limit) {
  best = 0;
  walk(weights, values, 0, capacity, 0, limit);
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

const WEIGHT = [3, 4, 5, 7];
const VALUE = [40, 50, 60, 90];
const CAPACITY = 41;

console.log("the split, and what its subsets can count to:");
console.log(pad("k", 5) + pad("parts", 28) + pad("copies", 8) + pad("covers 0..k exactly", 22));
for (const k of [1, 2, 3, 5, 7, 10, 15, 31, 100, 255]) {
  const parts = split(k);
  let shown = \`[\${parts.join(", ")}]\`;
  if (shown.length > 26) shown = shown.slice(0, 23) + "...]";
  console.log(
    pad(k, 5) + pad(shown, 28) + pad(parts.length, 8) + pad(coversExactly(parts, k) ? "yes" : "no", 22)
  );
}
console.log();

console.log(pad("k", 5) + pad("copies, one per unit", 22) + pad("copies, binary", 16) + pad("ratio", 8));
for (const k of [1, 3, 7, 15, 31, 63, 127, 255]) {
  const copies = split(k).length;
  console.log(pad(k, 5) + pad(k, 22) + pad(copies, 16) + pad(Math.floor(k / copies), 8));
}
console.log();

console.log(pad("k", 5) + pad("one copy per unit", 20) + pad("binary bundles", 17) + pad("every count", 14));
for (let k = 1; k <= 5; k++) {
  const [w1, v1] = expandEvery(WEIGHT, VALUE, k);
  const [w2, v2] = expandBinary(WEIGHT, VALUE, k);
  const a = packOnce(w1, v1, CAPACITY)[CAPACITY];
  const b = packOnce(w2, v2, CAPACITY)[CAPACITY];
  console.log(pad(k, 5) + pad(a, 20) + pad(b, 17) + pad(brute(WEIGHT, VALUE, CAPACITY, k), 14));
}
console.log();

const TRIALS = 2000;
let agree = 0;
let exactCover = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(3);
  const weights = Array.from({ length: n }, () => 1 + rand(6));
  const values = Array.from({ length: n }, () => 10 * (1 + rand(9)));
  const cap = 4 + rand(12);
  const k = 1 + rand(5);
  const truth = brute(weights, values, cap, k);
  const [w2, v2] = expandBinary(weights, values, k);
  if (packOnce(w2, v2, cap)[cap] === truth) agree++;
  if (coversExactly(split(k), k)) exactCover++;
}

console.log(\`over \${TRIALS} random bounded knapsacks:\`);
console.log(\`  binary bundles match exhaustive search   \${agree}\`);
console.log(\`  the split covers 0..k with no gaps       \${exactCover}\`);
`,
            },
            {
              lang: "typescript",
              code: `// "At most k of each" was solved on the previous page by offering k separate
// copies of every item, which is correct and costs k copies. It can be done with
// about log2(k) copies instead, and the reason is a fact about binary that is
// worth checking rather than believing.

/** Sizes whose subset sums are exactly the counts 0 through k: 1, 2, 4, ... */
function split(k: number): number[] {
  const parts: number[] = [];
  let piece = 1;
  let left = k;
  while (piece <= left) {
    parts.push(piece);
    left -= piece;
    piece *= 2;
  }
  if (left > 0) parts.push(left);
  return parts;
}

/** Every total a subset of \`parts\` can make. */
function reachable(parts: number[]): Set<number> {
  let seen = new Set<number>([0]);
  for (const part of parts) {
    const next = new Set(seen);
    for (const total of seen) next.add(total + part);
    seen = next;
  }
  return seen;
}

function coversExactly(parts: number[], k: number): boolean {
  const seen = reachable(parts);
  if (seen.size !== k + 1) return false;
  for (let i = 0; i <= k; i++) if (!seen.has(i)) return false;
  return true;
}

function packOnce(weights: number[], values: number[], capacity: number): number[] {
  const table = new Array(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    for (let cap = capacity; cap >= weights[i]; cap--) {
      const candidate = table[cap - weights[i]] + values[i];
      if (candidate > table[cap]) table[cap] = candidate;
    }
  }
  return table;
}

/** One copy per allowed unit: k copies of each item. */
function expandEvery(weights: number[], values: number[], limit: number): [number[], number[]] {
  const w: number[] = [];
  const v: number[] = [];
  for (let i = 0; i < weights.length; i++) {
    for (let c = 0; c < limit; c++) {
      w.push(weights[i]);
      v.push(values[i]);
    }
  }
  return [w, v];
}

/** One copy per power of two: a bundle of \`part\` units, priced accordingly. */
function expandBinary(weights: number[], values: number[], limit: number): [number[], number[]] {
  const w: number[] = [];
  const v: number[] = [];
  for (let i = 0; i < weights.length; i++) {
    for (const part of split(limit)) {
      w.push(weights[i] * part);
      v.push(values[i] * part);
    }
  }
  return [w, v];
}

let best = 0;

function walk(weights: number[], values: number[], i: number, room: number, worth: number, limit: number): void {
  if (i === weights.length) {
    if (worth > best) best = worth;
    return;
  }
  const top = Math.min(Math.floor(room / weights[i]), limit);
  for (let count = 0; count <= top; count++) {
    walk(weights, values, i + 1, room - count * weights[i], worth + count * values[i], limit);
  }
}

function brute(weights: number[], values: number[], capacity: number, limit: number): number {
  best = 0;
  walk(weights, values, 0, capacity, 0, limit);
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

const WEIGHT = [3, 4, 5, 7];
const VALUE = [40, 50, 60, 90];
const CAPACITY = 41;

console.log("the split, and what its subsets can count to:");
console.log(pad("k", 5) + pad("parts", 28) + pad("copies", 8) + pad("covers 0..k exactly", 22));
for (const k of [1, 2, 3, 5, 7, 10, 15, 31, 100, 255]) {
  const parts = split(k);
  let shown = \`[\${parts.join(", ")}]\`;
  if (shown.length > 26) shown = shown.slice(0, 23) + "...]";
  console.log(
    pad(k, 5) + pad(shown, 28) + pad(parts.length, 8) + pad(coversExactly(parts, k) ? "yes" : "no", 22)
  );
}
console.log();

console.log(pad("k", 5) + pad("copies, one per unit", 22) + pad("copies, binary", 16) + pad("ratio", 8));
for (const k of [1, 3, 7, 15, 31, 63, 127, 255]) {
  const copies = split(k).length;
  console.log(pad(k, 5) + pad(k, 22) + pad(copies, 16) + pad(Math.floor(k / copies), 8));
}
console.log();

console.log(pad("k", 5) + pad("one copy per unit", 20) + pad("binary bundles", 17) + pad("every count", 14));
for (let k = 1; k <= 5; k++) {
  const [w1, v1] = expandEvery(WEIGHT, VALUE, k);
  const [w2, v2] = expandBinary(WEIGHT, VALUE, k);
  const a = packOnce(w1, v1, CAPACITY)[CAPACITY];
  const b = packOnce(w2, v2, CAPACITY)[CAPACITY];
  console.log(pad(k, 5) + pad(a, 20) + pad(b, 17) + pad(brute(WEIGHT, VALUE, CAPACITY, k), 14));
}
console.log();

const TRIALS = 2000;
let agree = 0;
let exactCover = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(3);
  const weights = Array.from({ length: n }, () => 1 + rand(6));
  const values = Array.from({ length: n }, () => 10 * (1 + rand(9)));
  const cap = 4 + rand(12);
  const k = 1 + rand(5);
  const truth = brute(weights, values, cap, k);
  const [w2, v2] = expandBinary(weights, values, k);
  if (packOnce(w2, v2, cap)[cap] === truth) agree++;
  if (coversExactly(split(k), k)) exactCover++;
}

console.log(\`over \${TRIALS} random bounded knapsacks:\`);
console.log(\`  binary bundles match exhaustive search   \${agree}\`);
console.log(\`  the split covers 0..k with no gaps       \${exactCover}\`);
`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

// "At most k of each" was solved on the previous page by offering k separate
// copies of every item, which is correct and costs k copies. It can be done with
// about log2(k) copies instead, and the reason is a fact about binary that is
// worth checking rather than believing.
public class Main {
    /** Sizes whose subset sums are exactly the counts 0 through k: 1, 2, 4, ... */
    static List<Integer> split(int k) {
        List<Integer> parts = new ArrayList<>();
        int piece = 1;
        int left = k;
        while (piece <= left) {
            parts.add(piece);
            left -= piece;
            piece *= 2;
        }
        if (left > 0) parts.add(left);
        return parts;
    }

    /** Every total a subset of \`parts\` can make. */
    static Set<Integer> reachable(List<Integer> parts) {
        Set<Integer> seen = new HashSet<>();
        seen.add(0);
        for (int part : parts) {
            Set<Integer> next = new HashSet<>(seen);
            for (int total : seen) next.add(total + part);
            seen = next;
        }
        return seen;
    }

    static int[] packOnce(int[] weights, int[] values, int capacity) {
        int[] table = new int[capacity + 1];
        for (int i = 0; i < weights.length; i++) {
            for (int cap = capacity; cap >= weights[i]; cap--) {
                int candidate = table[cap - weights[i]] + values[i];
                if (candidate > table[cap]) table[cap] = candidate;
            }
        }
        return table;
    }

    /** One copy per allowed unit: k copies of each item. */
    static int[][] expandEvery(int[] weights, int[] values, int limit) {
        List<Integer> w = new ArrayList<>();
        List<Integer> v = new ArrayList<>();
        for (int i = 0; i < weights.length; i++) {
            for (int c = 0; c < limit; c++) {
                w.add(weights[i]);
                v.add(values[i]);
            }
        }
        return toArrays(w, v);
    }

    /** One copy per power of two: a bundle of \`part\` units, priced accordingly. */
    static int[][] expandBinary(int[] weights, int[] values, int limit) {
        List<Integer> w = new ArrayList<>();
        List<Integer> v = new ArrayList<>();
        for (int i = 0; i < weights.length; i++) {
            for (int part : split(limit)) {
                w.add(weights[i] * part);
                v.add(values[i] * part);
            }
        }
        return toArrays(w, v);
    }

    static int[][] toArrays(List<Integer> w, List<Integer> v) {
        int[] cw = new int[w.size()];
        int[] cv = new int[v.size()];
        for (int i = 0; i < cw.length; i++) {
            cw[i] = w.get(i);
            cv[i] = v.get(i);
        }
        return new int[][] { cw, cv };
    }

    static int best;

    static int brute(int[] weights, int[] values, int capacity, int limit) {
        best = 0;
        walk(weights, values, 0, capacity, 0, limit);
        return best;
    }

    static void walk(int[] weights, int[] values, int i, int room, int worth, int limit) {
        if (i == weights.length) {
            if (worth > best) best = worth;
            return;
        }
        int top = Math.min(room / weights[i], limit);
        for (int count = 0; count <= top; count++) {
            walk(weights, values, i + 1, room - count * weights[i], worth + count * values[i], limit);
        }
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    static final int[] WEIGHT = { 3, 4, 5, 7 };
    static final int[] VALUE = { 40, 50, 60, 90 };
    static final int CAPACITY = 41;

    public static void main(String[] args) {
        System.out.println("the split, and what its subsets can count to:");
        System.out.printf("%5s%28s%8s%22s%n", "k", "parts", "copies", "covers 0..k exactly");
        for (int k : new int[] { 1, 2, 3, 5, 7, 10, 15, 31, 100, 255 }) {
            List<Integer> parts = split(k);
            Set<Integer> want = new HashSet<>();
            for (int i = 0; i <= k; i++) want.add(i);
            boolean exact = reachable(parts).equals(want);
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < parts.size(); i++) {
                if (i > 0) sb.append(", ");
                sb.append(parts.get(i));
            }
            sb.append("]");
            String shown = sb.toString();
            if (shown.length() > 26) shown = shown.substring(0, 23) + "...]";
            System.out.printf("%5d%28s%8d%22s%n", k, shown, parts.size(), exact ? "yes" : "no");
        }
        System.out.println();

        System.out.printf("%5s%22s%16s%8s%n", "k", "copies, one per unit", "copies, binary", "ratio");
        for (int k : new int[] { 1, 3, 7, 15, 31, 63, 127, 255 }) {
            System.out.printf("%5d%22d%16d%8d%n", k, k, split(k).size(), k / split(k).size());
        }
        System.out.println();

        System.out.printf("%5s%20s%17s%14s%n", "k", "one copy per unit", "binary bundles", "every count");
        for (int k = 1; k <= 5; k++) {
            int[][] every = expandEvery(WEIGHT, VALUE, k);
            int[][] binary = expandBinary(WEIGHT, VALUE, k);
            int a = packOnce(every[0], every[1], CAPACITY)[CAPACITY];
            int b = packOnce(binary[0], binary[1], CAPACITY)[CAPACITY];
            System.out.printf("%5d%20d%17d%14d%n", k, a, b, brute(WEIGHT, VALUE, CAPACITY, k));
        }
        System.out.println();

        final int TRIALS = 2000;
        int agree = 0;
        int exactCover = 0;
        for (int t = 0; t < TRIALS; t++) {
            int n = 2 + rand(3);
            int[] weights = new int[n];
            int[] values = new int[n];
            for (int i = 0; i < n; i++) weights[i] = 1 + rand(6);
            for (int i = 0; i < n; i++) values[i] = 10 * (1 + rand(9));
            int cap = 4 + rand(12);
            int k = 1 + rand(5);
            int truth = brute(weights, values, cap, k);
            int[][] binary = expandBinary(weights, values, k);
            if (packOnce(binary[0], binary[1], cap)[cap] == truth) agree++;
            Set<Integer> want = new HashSet<>();
            for (int i = 0; i <= k; i++) want.add(i);
            if (reachable(split(k)).equals(want)) exactCover++;
        }

        System.out.printf("over %d random bounded knapsacks:%n", TRIALS);
        System.out.printf("  binary bundles match exhaustive search   %d%n", agree);
        System.out.printf("  the split covers 0..k with no gaps       %d%n", exactCover);
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// "At most k of each" was solved on the previous page by offering k separate
// copies of every item, which is correct and costs k copies. It can be done with
// about log2(k) copies instead, and the reason is a fact about binary that is
// worth checking rather than believing.
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <set>
#include <string>
#include <vector>

// Sizes whose subset sums are exactly the counts 0 through k: 1, 2, 4, ...
std::vector<int> split(int k) {
    std::vector<int> parts;
    int piece = 1;
    int left = k;
    while (piece <= left) {
        parts.push_back(piece);
        left -= piece;
        piece *= 2;
    }
    if (left > 0) parts.push_back(left);
    return parts;
}

// Every total a subset of \`parts\` can make.
std::set<int> reachable(const std::vector<int> &parts) {
    std::set<int> seen{0};
    for (int part : parts) {
        std::set<int> next = seen;
        for (int total : seen) next.insert(total + part);
        seen = next;
    }
    return seen;
}

bool coversExactly(const std::vector<int> &parts, int k) {
    std::set<int> want;
    for (int i = 0; i <= k; i++) want.insert(i);
    return reachable(parts) == want;
}

std::vector<int> packOnce(const std::vector<int> &weights, const std::vector<int> &values, int capacity) {
    std::vector<int> table(capacity + 1, 0);
    for (size_t i = 0; i < weights.size(); i++) {
        for (int cap = capacity; cap >= weights[i]; cap--) {
            int candidate = table[cap - weights[i]] + values[i];
            if (candidate > table[cap]) table[cap] = candidate;
        }
    }
    return table;
}

// One copy per allowed unit: k copies of each item.
void expandEvery(const std::vector<int> &weights, const std::vector<int> &values, int limit,
                 std::vector<int> &w, std::vector<int> &v) {
    w.clear();
    v.clear();
    for (size_t i = 0; i < weights.size(); i++) {
        for (int c = 0; c < limit; c++) {
            w.push_back(weights[i]);
            v.push_back(values[i]);
        }
    }
}

// One copy per power of two: a bundle of \`part\` units, priced accordingly.
void expandBinary(const std::vector<int> &weights, const std::vector<int> &values, int limit,
                  std::vector<int> &w, std::vector<int> &v) {
    w.clear();
    v.clear();
    for (size_t i = 0; i < weights.size(); i++) {
        for (int part : split(limit)) {
            w.push_back(weights[i] * part);
            v.push_back(values[i] * part);
        }
    }
}

static int best = 0;

void walk(const std::vector<int> &weights, const std::vector<int> &values, size_t i, int room,
          int worth, int limit) {
    if (i == weights.size()) {
        if (worth > best) best = worth;
        return;
    }
    int top = room / weights[i];
    if (limit < top) top = limit;
    for (int count = 0; count <= top; count++) {
        walk(weights, values, i + 1, room - count * weights[i], worth + count * values[i], limit);
    }
}

int brute(const std::vector<int> &weights, const std::vector<int> &values, int capacity, int limit) {
    best = 0;
    walk(weights, values, 0, capacity, 0, limit);
    return best;
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

static const std::vector<int> WEIGHT = {3, 4, 5, 7};
static const std::vector<int> VALUE = {40, 50, 60, 90};
static const int CAPACITY = 41;

int main() {
    std::cout << "the split, and what its subsets can count to:\\n";
    std::cout << std::right << std::setw(5) << "k" << std::setw(28) << "parts" << std::setw(8)
              << "copies" << std::setw(22) << "covers 0..k exactly" << "\\n";
    for (int k : {1, 2, 3, 5, 7, 10, 15, 31, 100, 255}) {
        std::vector<int> parts = split(k);
        std::string shown = "[";
        for (size_t i = 0; i < parts.size(); i++) {
            if (i > 0) shown += ", ";
            shown += std::to_string(parts[i]);
        }
        shown += "]";
        if (shown.size() > 26) shown = shown.substr(0, 23) + "...]";
        std::cout << std::right << std::setw(5) << k << std::setw(28) << shown << std::setw(8)
                  << parts.size() << std::setw(22) << (coversExactly(parts, k) ? "yes" : "no") << "\\n";
    }
    std::cout << "\\n";

    std::cout << std::right << std::setw(5) << "k" << std::setw(22) << "copies, one per unit"
              << std::setw(16) << "copies, binary" << std::setw(8) << "ratio" << "\\n";
    for (int k : {1, 3, 7, 15, 31, 63, 127, 255}) {
        int copies = static_cast<int>(split(k).size());
        std::cout << std::right << std::setw(5) << k << std::setw(22) << k << std::setw(16)
                  << copies << std::setw(8) << k / copies << "\\n";
    }
    std::cout << "\\n";

    std::cout << std::right << std::setw(5) << "k" << std::setw(20) << "one copy per unit"
              << std::setw(17) << "binary bundles" << std::setw(14) << "every count" << "\\n";
    for (int k = 1; k <= 5; k++) {
        std::vector<int> w1, v1, w2, v2;
        expandEvery(WEIGHT, VALUE, k, w1, v1);
        expandBinary(WEIGHT, VALUE, k, w2, v2);
        int a = packOnce(w1, v1, CAPACITY)[CAPACITY];
        int b = packOnce(w2, v2, CAPACITY)[CAPACITY];
        std::cout << std::right << std::setw(5) << k << std::setw(20) << a << std::setw(17) << b
                  << std::setw(14) << brute(WEIGHT, VALUE, CAPACITY, k) << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 2000;
    int agree = 0, exactCover = 0;
    for (int t = 0; t < TRIALS; t++) {
        int n = 2 + rnd(3);
        std::vector<int> weights(n), values(n);
        for (int i = 0; i < n; i++) weights[i] = 1 + rnd(6);
        for (int i = 0; i < n; i++) values[i] = 10 * (1 + rnd(9));
        int cap = 4 + rnd(12);
        int k = 1 + rnd(5);
        int truth = brute(weights, values, cap, k);
        std::vector<int> w2, v2;
        expandBinary(weights, values, k, w2, v2);
        if (packOnce(w2, v2, cap)[cap] == truth) agree++;
        if (coversExactly(split(k), k)) exactCover++;
    }

    std::cout << "over " << TRIALS << " random bounded knapsacks:\\n";
    std::cout << "  binary bundles match exhaustive search   " << agree << "\\n";
    std::cout << "  the split covers 0..k with no gaps       " << exactCover << "\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// "At most k of each" was solved on the previous page by offering k separate
// copies of every item, which is correct and costs k copies. It can be done with
// about log2(k) copies instead, and the reason is a fact about binary that is
// worth checking rather than believing.
use std::collections::BTreeSet;

/// Sizes whose subset sums are exactly the counts 0 through k: 1, 2, 4, ...
fn split(k: i32) -> Vec<i32> {
    let mut parts = Vec::new();
    let mut piece = 1;
    let mut left = k;
    while piece <= left {
        parts.push(piece);
        left -= piece;
        piece *= 2;
    }
    if left > 0 {
        parts.push(left);
    }
    parts
}

/// Every total a subset of \`parts\` can make.
fn reachable(parts: &[i32]) -> BTreeSet<i32> {
    let mut seen: BTreeSet<i32> = BTreeSet::new();
    seen.insert(0);
    for &part in parts {
        let mut next = seen.clone();
        for &total in &seen {
            next.insert(total + part);
        }
        seen = next;
    }
    seen
}

fn covers_exactly(parts: &[i32], k: i32) -> bool {
    let want: BTreeSet<i32> = (0..=k).collect();
    reachable(parts) == want
}

fn pack_once(weights: &[usize], values: &[i32], capacity: usize) -> Vec<i32> {
    let mut table = vec![0i32; capacity + 1];
    for i in 0..weights.len() {
        let mut cap = capacity;
        while cap >= weights[i] {
            let candidate = table[cap - weights[i]] + values[i];
            if candidate > table[cap] {
                table[cap] = candidate;
            }
            if cap == 0 {
                break;
            }
            cap -= 1;
        }
    }
    table
}

/// One copy per allowed unit: k copies of each item.
fn expand_every(weights: &[usize], values: &[i32], limit: i32) -> (Vec<usize>, Vec<i32>) {
    let mut w = Vec::new();
    let mut v = Vec::new();
    for i in 0..weights.len() {
        for _ in 0..limit {
            w.push(weights[i]);
            v.push(values[i]);
        }
    }
    (w, v)
}

/// One copy per power of two: a bundle of \`part\` units, priced accordingly.
fn expand_binary(weights: &[usize], values: &[i32], limit: i32) -> (Vec<usize>, Vec<i32>) {
    let mut w = Vec::new();
    let mut v = Vec::new();
    for i in 0..weights.len() {
        for part in split(limit) {
            w.push(weights[i] * part as usize);
            v.push(values[i] * part);
        }
    }
    (w, v)
}

fn walk(weights: &[usize], values: &[i32], i: usize, room: usize, worth: i32, limit: i32, best: &mut i32) {
    if i == weights.len() {
        if worth > *best {
            *best = worth;
        }
        return;
    }
    let mut top = (room / weights[i]) as i32;
    if limit < top {
        top = limit;
    }
    for count in 0..=top {
        walk(weights, values, i + 1, room - count as usize * weights[i],
             worth + count * values[i], limit, best);
    }
}

fn brute(weights: &[usize], values: &[i32], capacity: usize, limit: i32) -> i32 {
    let mut best = 0;
    walk(weights, values, 0, capacity, 0, limit, &mut best);
    best
}

fn rand(seed: &mut i64, n: i64) -> i32 {
    *seed = (*seed * 1103515245 + 12345) % 2147483648;
    (*seed / 65536 % n) as i32
}

const CAPACITY: usize = 41;

fn main() {
    let weight: Vec<usize> = vec![3, 4, 5, 7];
    let value: Vec<i32> = vec![40, 50, 60, 90];

    println!("the split, and what its subsets can count to:");
    println!("{:>5}{:>28}{:>8}{:>22}", "k", "parts", "copies", "covers 0..k exactly");
    for k in [1, 2, 3, 5, 7, 10, 15, 31, 100, 255] {
        let parts = split(k);
        let mut shown = format!("[{}]",
            parts.iter().map(|p| p.to_string()).collect::<Vec<_>>().join(", "));
        if shown.len() > 26 {
            shown = format!("{}...]", &shown[..23]);
        }
        let exact = if covers_exactly(&parts, k) { "yes" } else { "no" };
        println!("{:>5}{:>28}{:>8}{:>22}", k, shown, parts.len(), exact);
    }
    println!();

    println!("{:>5}{:>22}{:>16}{:>8}", "k", "copies, one per unit", "copies, binary", "ratio");
    for k in [1, 3, 7, 15, 31, 63, 127, 255] {
        let copies = split(k).len() as i32;
        println!("{:>5}{:>22}{:>16}{:>8}", k, k, copies, k / copies);
    }
    println!();

    println!("{:>5}{:>20}{:>17}{:>14}", "k", "one copy per unit", "binary bundles", "every count");
    for k in 1..=5 {
        let (w1, v1) = expand_every(&weight, &value, k);
        let (w2, v2) = expand_binary(&weight, &value, k);
        let a = pack_once(&w1, &v1, CAPACITY)[CAPACITY];
        let b = pack_once(&w2, &v2, CAPACITY)[CAPACITY];
        println!("{:>5}{:>20}{:>17}{:>14}", k, a, b, brute(&weight, &value, CAPACITY, k));
    }
    println!();

    const TRIALS: i32 = 2000;
    let mut seed = 1i64;
    let mut agree = 0;
    let mut exact_cover = 0;
    for _ in 0..TRIALS {
        let n = 2 + rand(&mut seed, 3) as usize;
        let weights: Vec<usize> = (0..n).map(|_| 1 + rand(&mut seed, 6) as usize).collect();
        let values: Vec<i32> = (0..n).map(|_| 10 * (1 + rand(&mut seed, 9))).collect();
        let cap = 4 + rand(&mut seed, 12) as usize;
        let k = 1 + rand(&mut seed, 5);
        let truth = brute(&weights, &values, cap, k);
        let (w2, v2) = expand_binary(&weights, &values, k);
        if pack_once(&w2, &v2, cap)[cap] == truth {
            agree += 1;
        }
        if covers_exactly(&split(k), k) {
            exact_cover += 1;
        }
    }

    println!("over {} random bounded knapsacks:", TRIALS);
    println!("  binary bundles match exhaustive search   {}", agree);
    println!("  the split covers 0..k with no gaps       {}", exact_cover);
}
`,
            },
            {
              lang: "go",
              code: `// "At most k of each" was solved on the previous page by offering k separate
// copies of every item, which is correct and costs k copies. It can be done with
// about log2(k) copies instead, and the reason is a fact about binary that is
// worth checking rather than believing.
package main

import (
	"fmt"
	"strconv"
	"strings"
)

// Sizes whose subset sums are exactly the counts 0 through k: 1, 2, 4, ...
func split(k int) []int {
	var parts []int
	piece := 1
	left := k
	for piece <= left {
		parts = append(parts, piece)
		left -= piece
		piece *= 2
	}
	if left > 0 {
		parts = append(parts, left)
	}
	return parts
}

// Every total a subset of \`parts\` can make.
func reachable(parts []int) map[int]bool {
	seen := map[int]bool{0: true}
	for _, part := range parts {
		next := map[int]bool{}
		for total := range seen {
			next[total] = true
			next[total+part] = true
		}
		seen = next
	}
	return seen
}

func coversExactly(parts []int, k int) bool {
	seen := reachable(parts)
	if len(seen) != k+1 {
		return false
	}
	for i := 0; i <= k; i++ {
		if !seen[i] {
			return false
		}
	}
	return true
}

func packOnce(weights, values []int, capacity int) []int {
	table := make([]int, capacity+1)
	for i := range weights {
		for cap := capacity; cap >= weights[i]; cap-- {
			if candidate := table[cap-weights[i]] + values[i]; candidate > table[cap] {
				table[cap] = candidate
			}
		}
	}
	return table
}

// One copy per allowed unit: k copies of each item.
func expandEvery(weights, values []int, limit int) ([]int, []int) {
	var w, v []int
	for i := range weights {
		for c := 0; c < limit; c++ {
			w = append(w, weights[i])
			v = append(v, values[i])
		}
	}
	return w, v
}

// One copy per power of two: a bundle of \`part\` units, priced accordingly.
func expandBinary(weights, values []int, limit int) ([]int, []int) {
	var w, v []int
	for i := range weights {
		for _, part := range split(limit) {
			w = append(w, weights[i]*part)
			v = append(v, values[i]*part)
		}
	}
	return w, v
}

var best int

func brute(weights, values []int, capacity, limit int) int {
	best = 0
	walk(weights, values, 0, capacity, 0, limit)
	return best
}

func walk(weights, values []int, i, room, worth, limit int) {
	if i == len(weights) {
		if worth > best {
			best = worth
		}
		return
	}
	top := room / weights[i]
	if limit < top {
		top = limit
	}
	for count := 0; count <= top; count++ {
		walk(weights, values, i+1, room-count*weights[i], worth+count*values[i], limit)
	}
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

var WEIGHT = []int{3, 4, 5, 7}
var VALUE = []int{40, 50, 60, 90}

const CAPACITY = 41

func main() {
	fmt.Println("the split, and what its subsets can count to:")
	fmt.Printf("%5s%28s%8s%22s\\n", "k", "parts", "copies", "covers 0..k exactly")
	for _, k := range []int{1, 2, 3, 5, 7, 10, 15, 31, 100, 255} {
		parts := split(k)
		labels := make([]string, len(parts))
		for i, p := range parts {
			labels[i] = strconv.Itoa(p)
		}
		shown := "[" + strings.Join(labels, ", ") + "]"
		if len(shown) > 26 {
			shown = shown[:23] + "...]"
		}
		exact := "no"
		if coversExactly(parts, k) {
			exact = "yes"
		}
		fmt.Printf("%5d%28s%8d%22s\\n", k, shown, len(parts), exact)
	}
	fmt.Println()

	fmt.Printf("%5s%22s%16s%8s\\n", "k", "copies, one per unit", "copies, binary", "ratio")
	for _, k := range []int{1, 3, 7, 15, 31, 63, 127, 255} {
		fmt.Printf("%5d%22d%16d%8d\\n", k, k, len(split(k)), k/len(split(k)))
	}
	fmt.Println()

	fmt.Printf("%5s%20s%17s%14s\\n", "k", "one copy per unit", "binary bundles", "every count")
	for k := 1; k <= 5; k++ {
		w1, v1 := expandEvery(WEIGHT, VALUE, k)
		w2, v2 := expandBinary(WEIGHT, VALUE, k)
		a := packOnce(w1, v1, CAPACITY)[CAPACITY]
		b := packOnce(w2, v2, CAPACITY)[CAPACITY]
		fmt.Printf("%5d%20d%17d%14d\\n", k, a, b, brute(WEIGHT, VALUE, CAPACITY, k))
	}
	fmt.Println()

	const TRIALS = 2000
	agree, exactCover := 0, 0
	for t := 0; t < TRIALS; t++ {
		n := 2 + rand(3)
		weights := make([]int, n)
		values := make([]int, n)
		for i := 0; i < n; i++ {
			weights[i] = 1 + rand(6)
		}
		for i := 0; i < n; i++ {
			values[i] = 10 * (1 + rand(9))
		}
		cap := 4 + rand(12)
		k := 1 + rand(5)
		truth := brute(weights, values, cap, k)
		w2, v2 := expandBinary(weights, values, k)
		if packOnce(w2, v2, cap)[cap] == truth {
			agree++
		}
		if coversExactly(split(k), k) {
			exactCover++
		}
	}

	fmt.Printf("over %d random bounded knapsacks:\\n", TRIALS)
	fmt.Printf("  binary bundles match exhaustive search   %d\\n", agree)
	fmt.Printf("  the split covers 0..k with no gaps       %d\\n", exactCover)
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "The remainder is part of the split, not an afterthought",
          body: "For k = 10 the parts are 1, 2, 4 and 3 \u2014 the last is what is left, not the next power of two. Using 1, 2, 4, 8 instead would let you count to 15, which is a different problem, and using 1, 2, 4 alone would stop at 7. The check in the example is worth keeping in your own code the first time you write this.",
        },
        {
          title: "It changes the input, not the recurrence",
          body: "Nothing about the 0/1 loop is modified; only the item list it is handed. That is why the technique is safe \u2014 it inherits the correctness of a loop you already trust \u2014 and it is a move worth recognising, because re-encoding an instance to fit a pattern you already have is often easier than deriving a new recurrence.",
        },
      ],
    },
    {
      id: "at-most-against-exactly",
      heading: "At most, against exactly",
      body: [
        "One more variation, and it is the one that catches people, because the two versions are indistinguishable below the first line.",
        "\"Fill the bag as well as you can\" and \"fill the bag exactly\" are different questions. The loop is identical. What differs is what the table starts as, and that is module 27 lesson 4's two base cases arriving in a concrete problem: **every capacity is reachable** if the answer may be under-full, because the empty set weighs nothing and is a legal answer for any capacity. **Only zero is reachable** if the total must be exact, and every other capacity has to be built up to or admit there is no answer.",
        "The two rows differ visibly: capacities 1, 2, 6 and 13 cannot be hit exactly by any subset of 3, 4, 5 and 7, and the exact row says so rather than reporting a number.",
        "The last row is the bug. It is written as the exact version \u2014 by someone meaning to answer \"exactly\" \u2014 but initialised to zeros, and it comes out identical to the at-most row. It is not producing noise or crashing; it is quietly answering the other question, and it is right on 1,290 of 4,000 random instances, which is exactly the instances where the two questions happen to have the same answer.",
        "The tell is available before you run anything: **if a table can report a value for a state nothing can reach, the base case is wrong.** Almost 2,000 of those 4,000 capacities were unreachable, and a version that never says so cannot be solving the exact problem.",
      ],
      examples: [
        {
          id: "exactly-or-at-most",
          title: "The same loop under two initialisations, and the one that answers the wrong question",
          lang: "python",
          code: `# Two knapsacks that share every line of the loop and differ in one line before
# it. "Fill the bag as well as you can" and "fill the bag exactly" are not the
# same question, and the whole of the difference is what the table starts as.

NONE = -10 ** 6                # this capacity cannot be hit at all

WEIGHT = [3, 4, 5, 7]
VALUE = [40, 50, 60, 90]
CAPACITY = 14


def at_most(weights, values, capacity):
    """Every capacity starts reachable: the empty set weighs nothing and is legal."""
    table = [0] * (capacity + 1)
    for i in range(len(weights)):
        for cap in range(capacity, weights[i] - 1, -1):
            candidate = table[cap - weights[i]] + values[i]
            if candidate > table[cap]:
                table[cap] = candidate
    return table


def exactly(weights, values, capacity):
    """Only zero starts reachable. Everything else has to be built to, or stays out."""
    table = [NONE] * (capacity + 1)
    table[0] = 0
    for i in range(len(weights)):
        for cap in range(capacity, weights[i] - 1, -1):
            if table[cap - weights[i]] > NONE:
                candidate = table[cap - weights[i]] + values[i]
                if candidate > table[cap]:
                    table[cap] = candidate
    return table


def exactly_but_zeroed(weights, values, capacity):
    """The same intent, initialised the other way. It answers the other question."""
    table = [0] * (capacity + 1)
    table[0] = 0
    for i in range(len(weights)):
        for cap in range(capacity, weights[i] - 1, -1):
            candidate = table[cap - weights[i]] + values[i]
            if candidate > table[cap]:
                table[cap] = candidate
    return table


def brute(weights, values, capacity, must_be_exact):
    n = len(weights)
    best = [NONE]
    for mask in range(1 << n):
        load = 0
        worth = 0
        for i in range(n):
            if mask >> i & 1:
                load += weights[i]
                worth += values[i]
        fits = load == capacity if must_be_exact else load <= capacity
        if fits and worth > best[0]:
            best[0] = worth
    return best[0]


def cell(value):
    return str(value) if value > NONE else "-"


print(f"{'item':<6}{'weight':>8}{'value':>8}")
for i in range(len(WEIGHT)):
    print(f"{chr(65 + i):<6}{WEIGHT[i]:>8}{VALUE[i]:>8}")
print("'-' is a capacity no subset of these weights adds up to")
print()

rows = [
    ("fill to at most this weight", at_most(WEIGHT, VALUE, CAPACITY)),
    ("  every subset weighing at most", [brute(WEIGHT, VALUE, c, False) for c in range(CAPACITY + 1)]),
    ("fill to exactly this weight", exactly(WEIGHT, VALUE, CAPACITY)),
    ("  every subset weighing exactly", [brute(WEIGHT, VALUE, c, True) for c in range(CAPACITY + 1)]),
    ("exactly, but started at zero", exactly_but_zeroed(WEIGHT, VALUE, CAPACITY)),
]
print(f"{'capacity':<34}" + "".join(f"{c:>5}" for c in range(CAPACITY + 1)))
for label, row in rows:
    print(f"{label:<34}" + "".join(f"{cell(v):>5}" for v in row))
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 4000
scores = [0, 0, 0]
unreachable = 0
for _ in range(TRIALS):
    n = 2 + rand(4)
    weights = [1 + rand(6) for _ in range(n)]
    values = [10 * (1 + rand(9)) for _ in range(n)]
    cap = 4 + rand(12)
    loose = brute(weights, values, cap, False)
    tight = brute(weights, values, cap, True)
    if tight == NONE:
        unreachable += 1
    if at_most(weights, values, cap)[cap] == loose:
        scores[0] += 1
    got = exactly(weights, values, cap)[cap]
    if (got if got > NONE else NONE) == tight:
        scores[1] += 1
    if exactly_but_zeroed(weights, values, cap)[cap] == tight:
        scores[2] += 1

print(f"over {TRIALS} random instances, of which {unreachable} have no subset hitting the capacity:")
print(f"  at most, against every subset weighing at most     {scores[0]:>6}")
print(f"  exactly, against every subset weighing exactly     {scores[1]:>6}")
print(f"  exactly-but-zeroed, against the same               {scores[2]:>6}")
`,
          output: `item    weight   value
A            3      40
B            4      50
C            5      60
D            7      90
'-' is a capacity no subset of these weights adds up to

capacity                              0    1    2    3    4    5    6    7    8    9   10   11   12   13   14
fill to at most this weight           0    0    0   40   50   60   60   90  100  110  130  140  150  150  180
  every subset weighing at most       0    0    0   40   50   60   60   90  100  110  130  140  150  150  180
fill to exactly this weight           0    -    -   40   50   60    -   90  100  110  130  140  150    -  180
  every subset weighing exactly       0    -    -   40   50   60    -   90  100  110  130  140  150    -  180
exactly, but started at zero          0    0    0   40   50   60   60   90  100  110  130  140  150  150  180

over 4000 random instances, of which 1952 have no subset hitting the capacity:
  at most, against every subset weighing at most       4000
  exactly, against every subset weighing exactly       4000
  exactly-but-zeroed, against the same                 1290`,
          explanation:
            "The third function is the second one written by somebody who meant \"exactly\" and initialised as though they meant \"at most\". It is not marked as broken anywhere in the code, which is the point; the scoring at the bottom is what separates it from the version above it.",
          alternates: [
            {
              lang: "javascript",
              code: `// Two knapsacks that share every line of the loop and differ in one line before
// it. "Fill the bag as well as you can" and "fill the bag exactly" are not the
// same question, and the whole of the difference is what the table starts as.

const NONE = -1000000;           // this capacity cannot be hit at all

const WEIGHT = [3, 4, 5, 7];
const VALUE = [40, 50, 60, 90];
const CAPACITY = 14;

/** Every capacity starts reachable: the empty set weighs nothing and is legal. */
function atMost(weights, values, capacity) {
  const table = new Array(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    for (let cap = capacity; cap >= weights[i]; cap--) {
      const candidate = table[cap - weights[i]] + values[i];
      if (candidate > table[cap]) table[cap] = candidate;
    }
  }
  return table;
}

/** Only zero starts reachable. Everything else has to be built to, or stays out. */
function exactly(weights, values, capacity) {
  const table = new Array(capacity + 1).fill(NONE);
  table[0] = 0;
  for (let i = 0; i < weights.length; i++) {
    for (let cap = capacity; cap >= weights[i]; cap--) {
      if (table[cap - weights[i]] > NONE) {
        const candidate = table[cap - weights[i]] + values[i];
        if (candidate > table[cap]) table[cap] = candidate;
      }
    }
  }
  return table;
}

/** The same intent, initialised the other way. It answers the other question. */
function exactlyButZeroed(weights, values, capacity) {
  const table = new Array(capacity + 1).fill(0);
  table[0] = 0;
  for (let i = 0; i < weights.length; i++) {
    for (let cap = capacity; cap >= weights[i]; cap--) {
      const candidate = table[cap - weights[i]] + values[i];
      if (candidate > table[cap]) table[cap] = candidate;
    }
  }
  return table;
}

function brute(weights, values, capacity, mustBeExact) {
  const n = weights.length;
  let best = NONE;
  for (let mask = 0; mask < 1 << n; mask++) {
    let load = 0;
    let worth = 0;
    for (let i = 0; i < n; i++) {
      if ((mask >> i) & 1) {
        load += weights[i];
        worth += values[i];
      }
    }
    const fits = mustBeExact ? load === capacity : load <= capacity;
    if (fits && worth > best) best = worth;
  }
  return best;
}

const cell = (value) => (value > NONE ? String(value) : "-");

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);
const row = (label, values) => padEnd(label, 34) + values.map((v) => pad(cell(v), 5)).join("");

console.log(padEnd("item", 6) + pad("weight", 8) + pad("value", 8));
for (let i = 0; i < WEIGHT.length; i++) {
  console.log(padEnd(String.fromCharCode(65 + i), 6) + pad(WEIGHT[i], 8) + pad(VALUE[i], 8));
}
console.log("'-' is a capacity no subset of these weights adds up to");
console.log();

const caps = [];
const bruteLoose = [];
const bruteTight = [];
for (let c = 0; c <= CAPACITY; c++) {
  caps.push(c);
  bruteLoose.push(brute(WEIGHT, VALUE, c, false));
  bruteTight.push(brute(WEIGHT, VALUE, c, true));
}
console.log(row("capacity", caps));
console.log(row("fill to at most this weight", atMost(WEIGHT, VALUE, CAPACITY)));
console.log(row("  every subset weighing at most", bruteLoose));
console.log(row("fill to exactly this weight", exactly(WEIGHT, VALUE, CAPACITY)));
console.log(row("  every subset weighing exactly", bruteTight));
console.log(row("exactly, but started at zero", exactlyButZeroed(WEIGHT, VALUE, CAPACITY)));
console.log();

const TRIALS = 4000;
const scores = [0, 0, 0];
let unreachable = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(4);
  const weights = Array.from({ length: n }, () => 1 + rand(6));
  const values = Array.from({ length: n }, () => 10 * (1 + rand(9)));
  const cap = 4 + rand(12);
  const loose = brute(weights, values, cap, false);
  const tight = brute(weights, values, cap, true);
  if (tight === NONE) unreachable++;
  if (atMost(weights, values, cap)[cap] === loose) scores[0]++;
  const got = exactly(weights, values, cap)[cap];
  if ((got > NONE ? got : NONE) === tight) scores[1]++;
  if (exactlyButZeroed(weights, values, cap)[cap] === tight) scores[2]++;
}

console.log(\`over \${TRIALS} random instances, of which \${unreachable} have no subset hitting the capacity:\`);
console.log(\`  at most, against every subset weighing at most     \${pad(scores[0], 6)}\`);
console.log(\`  exactly, against every subset weighing exactly     \${pad(scores[1], 6)}\`);
console.log(\`  exactly-but-zeroed, against the same               \${pad(scores[2], 6)}\`);
`,
            },
            {
              lang: "typescript",
              code: `// Two knapsacks that share every line of the loop and differ in one line before
// it. "Fill the bag as well as you can" and "fill the bag exactly" are not the
// same question, and the whole of the difference is what the table starts as.

const NONE = -1000000;           // this capacity cannot be hit at all

const WEIGHT = [3, 4, 5, 7];
const VALUE = [40, 50, 60, 90];
const CAPACITY = 14;

/** Every capacity starts reachable: the empty set weighs nothing and is legal. */
function atMost(weights: number[], values: number[], capacity: number): number[] {
  const table = new Array(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    for (let cap = capacity; cap >= weights[i]; cap--) {
      const candidate = table[cap - weights[i]] + values[i];
      if (candidate > table[cap]) table[cap] = candidate;
    }
  }
  return table;
}

/** Only zero starts reachable. Everything else has to be built to, or stays out. */
function exactly(weights: number[], values: number[], capacity: number): number[] {
  const table = new Array(capacity + 1).fill(NONE);
  table[0] = 0;
  for (let i = 0; i < weights.length; i++) {
    for (let cap = capacity; cap >= weights[i]; cap--) {
      if (table[cap - weights[i]] > NONE) {
        const candidate = table[cap - weights[i]] + values[i];
        if (candidate > table[cap]) table[cap] = candidate;
      }
    }
  }
  return table;
}

/** The same intent, initialised the other way. It answers the other question. */
function exactlyButZeroed(weights: number[], values: number[], capacity: number): number[] {
  const table = new Array(capacity + 1).fill(0);
  table[0] = 0;
  for (let i = 0; i < weights.length; i++) {
    for (let cap = capacity; cap >= weights[i]; cap--) {
      const candidate = table[cap - weights[i]] + values[i];
      if (candidate > table[cap]) table[cap] = candidate;
    }
  }
  return table;
}

function brute(weights: number[], values: number[], capacity: number, mustBeExact: boolean): number {
  const n = weights.length;
  let best = NONE;
  for (let mask = 0; mask < 1 << n; mask++) {
    let load = 0;
    let worth = 0;
    for (let i = 0; i < n; i++) {
      if ((mask >> i) & 1) {
        load += weights[i];
        worth += values[i];
      }
    }
    const fits = mustBeExact ? load === capacity : load <= capacity;
    if (fits && worth > best) best = worth;
  }
  return best;
}

const cell = (value: number): string => (value > NONE ? String(value) : "-");

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const row = (label: string, values: number[]): string =>
  padEnd(label, 34) + values.map((v) => pad(cell(v), 5)).join("");

console.log(padEnd("item", 6) + pad("weight", 8) + pad("value", 8));
for (let i = 0; i < WEIGHT.length; i++) {
  console.log(padEnd(String.fromCharCode(65 + i), 6) + pad(WEIGHT[i], 8) + pad(VALUE[i], 8));
}
console.log("'-' is a capacity no subset of these weights adds up to");
console.log();

const caps: number[] = [];
const bruteLoose: number[] = [];
const bruteTight: number[] = [];
for (let c = 0; c <= CAPACITY; c++) {
  caps.push(c);
  bruteLoose.push(brute(WEIGHT, VALUE, c, false));
  bruteTight.push(brute(WEIGHT, VALUE, c, true));
}
console.log(row("capacity", caps));
console.log(row("fill to at most this weight", atMost(WEIGHT, VALUE, CAPACITY)));
console.log(row("  every subset weighing at most", bruteLoose));
console.log(row("fill to exactly this weight", exactly(WEIGHT, VALUE, CAPACITY)));
console.log(row("  every subset weighing exactly", bruteTight));
console.log(row("exactly, but started at zero", exactlyButZeroed(WEIGHT, VALUE, CAPACITY)));
console.log();

const TRIALS = 4000;
const scores = [0, 0, 0];
let unreachable = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(4);
  const weights = Array.from({ length: n }, () => 1 + rand(6));
  const values = Array.from({ length: n }, () => 10 * (1 + rand(9)));
  const cap = 4 + rand(12);
  const loose = brute(weights, values, cap, false);
  const tight = brute(weights, values, cap, true);
  if (tight === NONE) unreachable++;
  if (atMost(weights, values, cap)[cap] === loose) scores[0]++;
  const got = exactly(weights, values, cap)[cap];
  if ((got > NONE ? got : NONE) === tight) scores[1]++;
  if (exactlyButZeroed(weights, values, cap)[cap] === tight) scores[2]++;
}

console.log(\`over \${TRIALS} random instances, of which \${unreachable} have no subset hitting the capacity:\`);
console.log(\`  at most, against every subset weighing at most     \${pad(scores[0], 6)}\`);
console.log(\`  exactly, against every subset weighing exactly     \${pad(scores[1], 6)}\`);
console.log(\`  exactly-but-zeroed, against the same               \${pad(scores[2], 6)}\`);
`,
            },
            {
              lang: "java",
              code: `// Two knapsacks that share every line of the loop and differ in one line before
// it. "Fill the bag as well as you can" and "fill the bag exactly" are not the
// same question, and the whole of the difference is what the table starts as.
public class Main {
    static final int NONE = -1000000;   // this capacity cannot be hit at all

    static final int[] WEIGHT = { 3, 4, 5, 7 };
    static final int[] VALUE = { 40, 50, 60, 90 };
    static final int CAPACITY = 14;

    /** Every capacity starts reachable: the empty set weighs nothing and is legal. */
    static int[] atMost(int[] weights, int[] values, int capacity) {
        int[] table = new int[capacity + 1];
        for (int i = 0; i < weights.length; i++) {
            for (int cap = capacity; cap >= weights[i]; cap--) {
                int candidate = table[cap - weights[i]] + values[i];
                if (candidate > table[cap]) table[cap] = candidate;
            }
        }
        return table;
    }

    /** Only zero starts reachable. Everything else has to be built to, or stays out. */
    static int[] exactly(int[] weights, int[] values, int capacity) {
        int[] table = new int[capacity + 1];
        for (int c = 0; c <= capacity; c++) table[c] = NONE;
        table[0] = 0;
        for (int i = 0; i < weights.length; i++) {
            for (int cap = capacity; cap >= weights[i]; cap--) {
                if (table[cap - weights[i]] > NONE) {
                    int candidate = table[cap - weights[i]] + values[i];
                    if (candidate > table[cap]) table[cap] = candidate;
                }
            }
        }
        return table;
    }

    /** The same intent, initialised the other way. It answers the other question. */
    static int[] exactlyButZeroed(int[] weights, int[] values, int capacity) {
        int[] table = new int[capacity + 1];
        table[0] = 0;
        for (int i = 0; i < weights.length; i++) {
            for (int cap = capacity; cap >= weights[i]; cap--) {
                int candidate = table[cap - weights[i]] + values[i];
                if (candidate > table[cap]) table[cap] = candidate;
            }
        }
        return table;
    }

    static int brute(int[] weights, int[] values, int capacity, boolean mustBeExact) {
        int n = weights.length;
        int best = NONE;
        for (int mask = 0; mask < (1 << n); mask++) {
            int load = 0;
            int worth = 0;
            for (int i = 0; i < n; i++) {
                if ((mask >> i & 1) == 1) {
                    load += weights[i];
                    worth += values[i];
                }
            }
            boolean fits = mustBeExact ? load == capacity : load <= capacity;
            if (fits && worth > best) best = worth;
        }
        return best;
    }

    static String cell(int value) {
        return value > NONE ? String.valueOf(value) : "-";
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    static String row(String label, int[] values) {
        StringBuilder sb = new StringBuilder(String.format("%-34s", label));
        for (int v : values) sb.append(String.format("%5s", cell(v)));
        return sb.toString();
    }

    public static void main(String[] args) {
        System.out.printf("%-6s%8s%8s%n", "item", "weight", "value");
        for (int i = 0; i < WEIGHT.length; i++) {
            System.out.printf("%-6s%8d%8d%n", (char) ('A' + i), WEIGHT[i], VALUE[i]);
        }
        System.out.println("'-' is a capacity no subset of these weights adds up to");
        System.out.println();

        int[] caps = new int[CAPACITY + 1];
        int[] bruteLoose = new int[CAPACITY + 1];
        int[] bruteTight = new int[CAPACITY + 1];
        for (int c = 0; c <= CAPACITY; c++) {
            caps[c] = c;
            bruteLoose[c] = brute(WEIGHT, VALUE, c, false);
            bruteTight[c] = brute(WEIGHT, VALUE, c, true);
        }
        System.out.println(row("capacity", caps));
        System.out.println(row("fill to at most this weight", atMost(WEIGHT, VALUE, CAPACITY)));
        System.out.println(row("  every subset weighing at most", bruteLoose));
        System.out.println(row("fill to exactly this weight", exactly(WEIGHT, VALUE, CAPACITY)));
        System.out.println(row("  every subset weighing exactly", bruteTight));
        System.out.println(row("exactly, but started at zero", exactlyButZeroed(WEIGHT, VALUE, CAPACITY)));
        System.out.println();

        final int TRIALS = 4000;
        int[] scores = new int[3];
        int unreachable = 0;
        for (int t = 0; t < TRIALS; t++) {
            int n = 2 + rand(4);
            int[] weights = new int[n];
            int[] values = new int[n];
            for (int i = 0; i < n; i++) weights[i] = 1 + rand(6);
            for (int i = 0; i < n; i++) values[i] = 10 * (1 + rand(9));
            int cap = 4 + rand(12);
            int loose = brute(weights, values, cap, false);
            int tight = brute(weights, values, cap, true);
            if (tight == NONE) unreachable++;
            if (atMost(weights, values, cap)[cap] == loose) scores[0]++;
            int got = exactly(weights, values, cap)[cap];
            if ((got > NONE ? got : NONE) == tight) scores[1]++;
            if (exactlyButZeroed(weights, values, cap)[cap] == tight) scores[2]++;
        }

        System.out.printf("over %d random instances, of which %d have no subset hitting the capacity:%n",
            TRIALS, unreachable);
        System.out.printf("  at most, against every subset weighing at most     %6d%n", scores[0]);
        System.out.printf("  exactly, against every subset weighing exactly     %6d%n", scores[1]);
        System.out.printf("  exactly-but-zeroed, against the same               %6d%n", scores[2]);
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Two knapsacks that share every line of the loop and differ in one line before
// it. "Fill the bag as well as you can" and "fill the bag exactly" are not the
// same question, and the whole of the difference is what the table starts as.
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

static const int NONE = -1000000;   // this capacity cannot be hit at all

static const std::vector<int> WEIGHT = {3, 4, 5, 7};
static const std::vector<int> VALUE = {40, 50, 60, 90};
static const int CAPACITY = 14;

// Every capacity starts reachable: the empty set weighs nothing and is legal.
std::vector<int> atMost(const std::vector<int> &weights, const std::vector<int> &values, int capacity) {
    std::vector<int> table(capacity + 1, 0);
    for (size_t i = 0; i < weights.size(); i++) {
        for (int cap = capacity; cap >= weights[i]; cap--) {
            int candidate = table[cap - weights[i]] + values[i];
            if (candidate > table[cap]) table[cap] = candidate;
        }
    }
    return table;
}

// Only zero starts reachable. Everything else has to be built to, or stays out.
std::vector<int> exactly(const std::vector<int> &weights, const std::vector<int> &values, int capacity) {
    std::vector<int> table(capacity + 1, NONE);
    table[0] = 0;
    for (size_t i = 0; i < weights.size(); i++) {
        for (int cap = capacity; cap >= weights[i]; cap--) {
            if (table[cap - weights[i]] > NONE) {
                int candidate = table[cap - weights[i]] + values[i];
                if (candidate > table[cap]) table[cap] = candidate;
            }
        }
    }
    return table;
}

// The same intent, initialised the other way. It answers the other question.
std::vector<int> exactlyButZeroed(const std::vector<int> &weights, const std::vector<int> &values,
                                  int capacity) {
    std::vector<int> table(capacity + 1, 0);
    table[0] = 0;
    for (size_t i = 0; i < weights.size(); i++) {
        for (int cap = capacity; cap >= weights[i]; cap--) {
            int candidate = table[cap - weights[i]] + values[i];
            if (candidate > table[cap]) table[cap] = candidate;
        }
    }
    return table;
}

int brute(const std::vector<int> &weights, const std::vector<int> &values, int capacity,
          bool mustBeExact) {
    int n = static_cast<int>(weights.size());
    int best = NONE;
    for (int mask = 0; mask < (1 << n); mask++) {
        int load = 0, worth = 0;
        for (int i = 0; i < n; i++) {
            if (mask >> i & 1) {
                load += weights[i];
                worth += values[i];
            }
        }
        bool fits = mustBeExact ? load == capacity : load <= capacity;
        if (fits && worth > best) best = worth;
    }
    return best;
}

std::string cell(int value) {
    return value > NONE ? std::to_string(value) : "-";
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

std::string row(const std::string &label, const std::vector<int> &values) {
    std::string out = label;
    out.resize(34, ' ');
    for (int v : values) {
        std::string text = cell(v);
        out += std::string(5 - text.size(), ' ') + text;
    }
    return out;
}

int main() {
    std::cout << std::left << std::setw(6) << "item" << std::right << std::setw(8) << "weight"
              << std::setw(8) << "value" << "\\n";
    for (size_t i = 0; i < WEIGHT.size(); i++) {
        std::cout << std::left << std::setw(6) << std::string(1, static_cast<char>('A' + i))
                  << std::right << std::setw(8) << WEIGHT[i] << std::setw(8) << VALUE[i] << "\\n";
    }
    std::cout << "'-' is a capacity no subset of these weights adds up to\\n\\n";

    std::vector<int> caps, bruteLoose, bruteTight;
    for (int c = 0; c <= CAPACITY; c++) {
        caps.push_back(c);
        bruteLoose.push_back(brute(WEIGHT, VALUE, c, false));
        bruteTight.push_back(brute(WEIGHT, VALUE, c, true));
    }
    std::cout << row("capacity", caps) << "\\n";
    std::cout << row("fill to at most this weight", atMost(WEIGHT, VALUE, CAPACITY)) << "\\n";
    std::cout << row("  every subset weighing at most", bruteLoose) << "\\n";
    std::cout << row("fill to exactly this weight", exactly(WEIGHT, VALUE, CAPACITY)) << "\\n";
    std::cout << row("  every subset weighing exactly", bruteTight) << "\\n";
    std::cout << row("exactly, but started at zero", exactlyButZeroed(WEIGHT, VALUE, CAPACITY)) << "\\n\\n";

    const int TRIALS = 4000;
    std::array<int, 3> scores{};
    int unreachable = 0;
    for (int t = 0; t < TRIALS; t++) {
        int n = 2 + rnd(4);
        std::vector<int> weights(n), values(n);
        for (int i = 0; i < n; i++) weights[i] = 1 + rnd(6);
        for (int i = 0; i < n; i++) values[i] = 10 * (1 + rnd(9));
        int cap = 4 + rnd(12);
        int loose = brute(weights, values, cap, false);
        int tight = brute(weights, values, cap, true);
        if (tight == NONE) unreachable++;
        if (atMost(weights, values, cap)[cap] == loose) scores[0]++;
        int got = exactly(weights, values, cap)[cap];
        if ((got > NONE ? got : NONE) == tight) scores[1]++;
        if (exactlyButZeroed(weights, values, cap)[cap] == tight) scores[2]++;
    }

    std::cout << "over " << TRIALS << " random instances, of which " << unreachable
              << " have no subset hitting the capacity:\\n";
    std::cout << "  at most, against every subset weighing at most     " << std::setw(6) << scores[0] << "\\n";
    std::cout << "  exactly, against every subset weighing exactly     " << std::setw(6) << scores[1] << "\\n";
    std::cout << "  exactly-but-zeroed, against the same               " << std::setw(6) << scores[2] << "\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// Two knapsacks that share every line of the loop and differ in one line before
// it. "Fill the bag as well as you can" and "fill the bag exactly" are not the
// same question, and the whole of the difference is what the table starts as.

const NONE: i32 = -1000000; // this capacity cannot be hit at all
const CAPACITY: usize = 14;

/// Every capacity starts reachable: the empty set weighs nothing and is legal.
fn at_most(weights: &[usize], values: &[i32], capacity: usize) -> Vec<i32> {
    let mut table = vec![0i32; capacity + 1];
    for i in 0..weights.len() {
        let mut cap = capacity;
        while cap >= weights[i] {
            let candidate = table[cap - weights[i]] + values[i];
            if candidate > table[cap] {
                table[cap] = candidate;
            }
            if cap == 0 {
                break;
            }
            cap -= 1;
        }
    }
    table
}

/// Only zero starts reachable. Everything else has to be built to, or stays out.
fn exactly(weights: &[usize], values: &[i32], capacity: usize) -> Vec<i32> {
    let mut table = vec![NONE; capacity + 1];
    table[0] = 0;
    for i in 0..weights.len() {
        let mut cap = capacity;
        while cap >= weights[i] {
            if table[cap - weights[i]] > NONE {
                let candidate = table[cap - weights[i]] + values[i];
                if candidate > table[cap] {
                    table[cap] = candidate;
                }
            }
            if cap == 0 {
                break;
            }
            cap -= 1;
        }
    }
    table
}

/// The same intent, initialised the other way. It answers the other question.
fn exactly_but_zeroed(weights: &[usize], values: &[i32], capacity: usize) -> Vec<i32> {
    let mut table = vec![0i32; capacity + 1];
    table[0] = 0;
    for i in 0..weights.len() {
        let mut cap = capacity;
        while cap >= weights[i] {
            let candidate = table[cap - weights[i]] + values[i];
            if candidate > table[cap] {
                table[cap] = candidate;
            }
            if cap == 0 {
                break;
            }
            cap -= 1;
        }
    }
    table
}

fn brute(weights: &[usize], values: &[i32], capacity: usize, must_be_exact: bool) -> i32 {
    let n = weights.len();
    let mut best = NONE;
    for mask in 0..(1usize << n) {
        let mut load = 0usize;
        let mut worth = 0i32;
        for i in 0..n {
            if mask >> i & 1 == 1 {
                load += weights[i];
                worth += values[i];
            }
        }
        let fits = if must_be_exact { load == capacity } else { load <= capacity };
        if fits && worth > best {
            best = worth;
        }
    }
    best
}

fn cell(value: i32) -> String {
    if value > NONE { value.to_string() } else { String::from("-") }
}

fn rand(seed: &mut i64, n: i64) -> i32 {
    *seed = (*seed * 1103515245 + 12345) % 2147483648;
    (*seed / 65536 % n) as i32
}

fn row(label: &str, values: &[i32]) -> String {
    let mut out = format!("{:<34}", label);
    for v in values {
        out.push_str(&format!("{:>5}", cell(*v)));
    }
    out
}

fn main() {
    let weight: Vec<usize> = vec![3, 4, 5, 7];
    let value: Vec<i32> = vec![40, 50, 60, 90];

    println!("{:<6}{:>8}{:>8}", "item", "weight", "value");
    for i in 0..weight.len() {
        println!("{:<6}{:>8}{:>8}", (b'A' + i as u8) as char, weight[i], value[i]);
    }
    println!("'-' is a capacity no subset of these weights adds up to");
    println!();

    let caps: Vec<i32> = (0..=CAPACITY as i32).collect();
    let brute_loose: Vec<i32> = (0..=CAPACITY).map(|c| brute(&weight, &value, c, false)).collect();
    let brute_tight: Vec<i32> = (0..=CAPACITY).map(|c| brute(&weight, &value, c, true)).collect();
    println!("{}", row("capacity", &caps));
    println!("{}", row("fill to at most this weight", &at_most(&weight, &value, CAPACITY)));
    println!("{}", row("  every subset weighing at most", &brute_loose));
    println!("{}", row("fill to exactly this weight", &exactly(&weight, &value, CAPACITY)));
    println!("{}", row("  every subset weighing exactly", &brute_tight));
    println!("{}", row("exactly, but started at zero", &exactly_but_zeroed(&weight, &value, CAPACITY)));
    println!();

    const TRIALS: i32 = 4000;
    let mut seed = 1i64;
    let mut scores = [0i32; 3];
    let mut unreachable = 0;
    for _ in 0..TRIALS {
        let n = 2 + rand(&mut seed, 4) as usize;
        let weights: Vec<usize> = (0..n).map(|_| 1 + rand(&mut seed, 6) as usize).collect();
        let values: Vec<i32> = (0..n).map(|_| 10 * (1 + rand(&mut seed, 9))).collect();
        let cap = 4 + rand(&mut seed, 12) as usize;
        let loose = brute(&weights, &values, cap, false);
        let tight = brute(&weights, &values, cap, true);
        if tight == NONE {
            unreachable += 1;
        }
        if at_most(&weights, &values, cap)[cap] == loose {
            scores[0] += 1;
        }
        let got = exactly(&weights, &values, cap)[cap];
        if (if got > NONE { got } else { NONE }) == tight {
            scores[1] += 1;
        }
        if exactly_but_zeroed(&weights, &values, cap)[cap] == tight {
            scores[2] += 1;
        }
    }

    println!("over {} random instances, of which {} have no subset hitting the capacity:", TRIALS, unreachable);
    println!("  at most, against every subset weighing at most     {:>6}", scores[0]);
    println!("  exactly, against every subset weighing exactly     {:>6}", scores[1]);
    println!("  exactly-but-zeroed, against the same               {:>6}", scores[2]);
}
`,
            },
            {
              lang: "go",
              code: `// Two knapsacks that share every line of the loop and differ in one line before
// it. "Fill the bag as well as you can" and "fill the bag exactly" are not the
// same question, and the whole of the difference is what the table starts as.
package main

import (
	"fmt"
	"strconv"
)

const NONE = -1000000 // this capacity cannot be hit at all

var WEIGHT = []int{3, 4, 5, 7}
var VALUE = []int{40, 50, 60, 90}

const CAPACITY = 14

// Every capacity starts reachable: the empty set weighs nothing and is legal.
func atMost(weights, values []int, capacity int) []int {
	table := make([]int, capacity+1)
	for i := range weights {
		for cap := capacity; cap >= weights[i]; cap-- {
			if candidate := table[cap-weights[i]] + values[i]; candidate > table[cap] {
				table[cap] = candidate
			}
		}
	}
	return table
}

// Only zero starts reachable. Everything else has to be built to, or stays out.
func exactly(weights, values []int, capacity int) []int {
	table := make([]int, capacity+1)
	for c := range table {
		table[c] = NONE
	}
	table[0] = 0
	for i := range weights {
		for cap := capacity; cap >= weights[i]; cap-- {
			if table[cap-weights[i]] > NONE {
				if candidate := table[cap-weights[i]] + values[i]; candidate > table[cap] {
					table[cap] = candidate
				}
			}
		}
	}
	return table
}

// The same intent, initialised the other way. It answers the other question.
func exactlyButZeroed(weights, values []int, capacity int) []int {
	table := make([]int, capacity+1)
	table[0] = 0
	for i := range weights {
		for cap := capacity; cap >= weights[i]; cap-- {
			if candidate := table[cap-weights[i]] + values[i]; candidate > table[cap] {
				table[cap] = candidate
			}
		}
	}
	return table
}

func brute(weights, values []int, capacity int, mustBeExact bool) int {
	n := len(weights)
	best := NONE
	for mask := 0; mask < 1<<n; mask++ {
		load, worth := 0, 0
		for i := 0; i < n; i++ {
			if mask>>i&1 == 1 {
				load += weights[i]
				worth += values[i]
			}
		}
		fits := load <= capacity
		if mustBeExact {
			fits = load == capacity
		}
		if fits && worth > best {
			best = worth
		}
	}
	return best
}

func cell(value int) string {
	if value > NONE {
		return strconv.Itoa(value)
	}
	return "-"
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func row(label string, values []int) string {
	out := fmt.Sprintf("%-34s", label)
	for _, v := range values {
		out += fmt.Sprintf("%5s", cell(v))
	}
	return out
}

func main() {
	fmt.Printf("%-6s%8s%8s\\n", "item", "weight", "value")
	for i := range WEIGHT {
		fmt.Printf("%-6s%8d%8d\\n", string(rune('A'+i)), WEIGHT[i], VALUE[i])
	}
	fmt.Println("'-' is a capacity no subset of these weights adds up to")
	fmt.Println()

	caps := make([]int, CAPACITY+1)
	bruteLoose := make([]int, CAPACITY+1)
	bruteTight := make([]int, CAPACITY+1)
	for c := 0; c <= CAPACITY; c++ {
		caps[c] = c
		bruteLoose[c] = brute(WEIGHT, VALUE, c, false)
		bruteTight[c] = brute(WEIGHT, VALUE, c, true)
	}
	fmt.Println(row("capacity", caps))
	fmt.Println(row("fill to at most this weight", atMost(WEIGHT, VALUE, CAPACITY)))
	fmt.Println(row("  every subset weighing at most", bruteLoose))
	fmt.Println(row("fill to exactly this weight", exactly(WEIGHT, VALUE, CAPACITY)))
	fmt.Println(row("  every subset weighing exactly", bruteTight))
	fmt.Println(row("exactly, but started at zero", exactlyButZeroed(WEIGHT, VALUE, CAPACITY)))
	fmt.Println()

	const TRIALS = 4000
	scores := [3]int{}
	unreachable := 0
	for t := 0; t < TRIALS; t++ {
		n := 2 + rand(4)
		weights := make([]int, n)
		values := make([]int, n)
		for i := 0; i < n; i++ {
			weights[i] = 1 + rand(6)
		}
		for i := 0; i < n; i++ {
			values[i] = 10 * (1 + rand(9))
		}
		cap := 4 + rand(12)
		loose := brute(weights, values, cap, false)
		tight := brute(weights, values, cap, true)
		if tight == NONE {
			unreachable++
		}
		if atMost(weights, values, cap)[cap] == loose {
			scores[0]++
		}
		got := exactly(weights, values, cap)[cap]
		if got <= NONE {
			got = NONE
		}
		if got == tight {
			scores[1]++
		}
		if exactlyButZeroed(weights, values, cap)[cap] == tight {
			scores[2]++
		}
	}

	fmt.Printf("over %d random instances, of which %d have no subset hitting the capacity:\\n", TRIALS, unreachable)
	fmt.Printf("  at most, against every subset weighing at most     %6d\\n", scores[0])
	fmt.Printf("  exactly, against every subset weighing exactly     %6d\\n", scores[1])
	fmt.Printf("  exactly-but-zeroed, against the same               %6d\\n", scores[2])
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "A reachability sentinel is not an optimisation",
          body: "It is the difference between two problems. Nearly half the random capacities here cannot be hit exactly, and a table initialised to zero reports a comfortable-looking number for every one of them. If the problem says \"exactly\", \"equal to\" or \"partition into\", the sentinel is part of the specification.",
        },
        {
          title: "Guard the read as well as the write",
          body: "Filling with a sentinel is only half of it: the transition has to refuse to build on an unreachable cell, or the sentinel gets arithmetic done to it and becomes an ordinary-looking number. That is the same failure module 27 lesson 4 measured on coin change, where an unguarded -1 became 0 after one addition.",
        },
      ],
    },
    {
      id: "the-shape-to-remember",
      heading: "The shape to remember",
      body: [
        "So the pattern, in the form worth memorising, because everything else in this module is a variation on it.",
        "**The state is `(items considered, capacity used)`**, and the second component is the one sized by a value rather than a length \u2014 which is why knapsack is pseudo-polynomial, and why a capacity of `10^9` is a different problem rather than a bigger one.",
        "**The transition is take-or-leave**, and the answer at each cell is the better of the two.",
        "**The repetition rule is the loop direction.** Downwards for once, upwards for any number of times, and binary bundles for at most `k`.",
        "**The base case is the question.** All zeros for at-most, and a sentinel everywhere but zero for exactly.",
        "When you meet a new problem, the question that identifies it as a knapsack is not \"is there a bag\" \u2014 it is: **am I choosing a subset of things, subject to one additive budget, to optimise one additive quantity?** Bag and capacity are the costume. The next lesson takes the same shape with the value deleted, which turns out to be a surprising number of problems.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between 0/1 knapsack and unbounded knapsack in code?",
      answer:
        "The direction of the inner loop, and nothing else. Iterating capacity downwards means `table[cap - w]` still holds the row from before this item was considered, so the item is used at most once. Iterating upwards means that cell may already include this item, so it can be taken repeatedly. Both are correct dynamic programs for different problems \u2014 on three thousand random instances each matches its own exhaustive search every time, the descending one against every subset and the ascending one against every multiset. It is worth being able to say which cell the update reads, because that question has a definite answer and it is the whole distinction.",
    },
    {
      question: "How would you handle \"at most k of each item\" without making the solution k times slower?",
      answer:
        "Split k into 1, 2, 4, 8 and whatever remainder is left, and offer each item as those bundles \u2014 a bundle of four units weighing 4w and worth 4v \u2014 then run the ordinary 0/1 loop. The subset sums of that split are exactly the integers 0 through k, so every legal count is expressible and no illegal one is, which is a property worth checking rather than assuming: for k = 10 the parts are 1, 2, 4, 3, and the remainder matters. That takes k copies down to about log2(k) \u2014 255 becomes 8. The recurrence is untouched; only the item list changes, which is why the result inherits the correctness of the loop you already had.",
    },
    {
      question: "The problem asks for a subset summing to exactly W rather than at most W. What changes?",
      answer:
        "The initialisation, which is the base case. For \"at most\", every capacity starts at zero because the empty set is a legal answer for any capacity. For \"exactly\", only capacity zero starts at zero and everything else starts at a sentinel meaning unreachable \u2014 and the transition must refuse to build on a sentinel, or it gets a value added to it and turns back into an ordinary number. The two versions are otherwise identical, so the failure is quiet: initialising the exact version to zeros produces something that runs, returns plausible numbers, and is right on about a third of random instances, because it is answering the at-most question. Nearly half the capacities in that test could not be hit exactly at all, and a table that never says so is not solving the problem asked.",
    },
  ],
  takeaways: [
    "The knapsack family is three problems separated by one clause: each item once, any number of times, or at most k times.",
    "The loop direction is the repetition rule \u2014 downwards for 0/1, upwards for unbounded.",
    "Bounded knapsack by k copies is correct and costs k; binary bundles cost about log2(k), taking 255 copies to 8.",
    "The split 1, 2, 4, \u2026 plus a remainder has subset sums exactly 0..k \u2014 a property to check, since the remainder is easy to get wrong.",
    "Binary bundling re-encodes the input rather than changing the recurrence, so it inherits a loop you already trust.",
    "\"At most W\" and \"exactly W\" share every line of the loop and differ in what the table starts as.",
    "An exact-fit table initialised to zeros silently answers the at-most question, and is right on about a third of instances.",
    "If a table can report a value for a state nothing can reach, the base case is wrong.",
  ],
  status: "available",
};
