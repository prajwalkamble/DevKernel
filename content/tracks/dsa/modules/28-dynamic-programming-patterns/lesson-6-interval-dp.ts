import type { Lesson } from "@/content/types";

export const intervalDpLesson: Lesson = {
  id: "dsa-dp-interval",
  slug: "interval-dp",
  moduleSlug: "dynamic-programming-patterns",
  title: "Interval DP",
  summary:
    "The family where the state is a range and the choice is a split point inside it. Matrix chain and why greedy cannot work; burst balloons and why the recurrence has to reason about the last event rather than the first; and the fill order, which is the one part of dynamic programming where a wrong loop order produces a plausible number instead of an error.",
  estimatedMinutes: 45,
  objectives: [
    "Write a recurrence whose state is a range and whose transition is a split",
    "Check that the two sides of a split are independent, and reverse the question when they are not",
    "Say why greedy has no exchange argument on a chain",
    "Fill an interval table in an order that is topological, and recognise the failure when it is not",
  ],
  sections: [
    {
      id: "a-range-and-a-split",
      heading: "The state is a range, and the choice is a split",
      body: [
        "Every state so far has been a prefix, a pair of prefixes, or a position. This lesson is the family where the state is a *contiguous range*, and it is the one people find hardest, for a reason worth naming up front: the transition is not a small decision between two options. It is a choice among every position inside the range.",
        "Matrix chain multiplication is the canonical instance. Multiplying a `p` by `q` matrix with a `q` by `r` one costs `p * q * r` scalar multiplications, and matrix multiplication is associative, so the product of a chain is the same however you bracket it \u2014 but the cost is not. `(A B) C` and `A (B C)` compute the same matrix at wildly different prices.",
        "So the state is \"matrices `i` through `j`, bracketed as cheaply as possible\", and the transition asks where the outermost multiplication happens. Whichever split you choose at `k`, the left run and the right run are each collapsed to a single matrix first, and those two subproblems are independent \u2014 which is exactly the optimal-substructure requirement, checked rather than assumed. Then the outermost product costs `dims[i] * dims[k+1] * dims[j+1]`, whatever the two sides did internally.",
        "That gives a table of `O(n^2)` intervals with `O(n)` splits each, so `O(n^3)` work, against a number of bracketings that is the Catalan number \u2014 4,862 for a chain of ten. The example scores the table against enumerating every bracketing on chains short enough to enumerate, and it agrees on all 3,000.",
        "It also runs the greedy that everyone tries first: repeatedly multiply whichever adjacent pair is cheapest right now. That is right on 1,363 of 3,000 chains, and across the whole run it spent 35,040,227 multiplications where optimal bracketing spends 25,262,125. On its worst case here it spent 55,654 against 5,874, which is nearly ten times. Module 26's exchange argument does not apply, because no adjacent pair's immediate cost tells you anything about what the rest of the chain will then cost.",
      ],
      examples: [
        {
          id: "matrix-chain",
          title: "Matrix chain against every bracketing, and against greedy",
          lang: "python",
          code: `# Matrix chain multiplication: the first problem whose state is an interval
# rather than a prefix.
#
# The product of a chain is the same however you bracket it, but the number of
# scalar multiplications is not. The state is a contiguous run of matrices, the
# transition is where that run is split in two, and the thing to notice is that
# the split is not a choice between two options -- it is a choice among every
# position in the interval.
INF = 10 ** 18


def table(dims):
    """dp[i][j] = cheapest way to bracket matrices i through j inclusive."""
    n = len(dims) - 1
    dp = [[0] * n for _ in range(n)]
    # Filled by increasing interval length, because dp[i][j] needs shorter runs.
    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            dp[i][j] = INF
            for k in range(i, j):
                cost = dp[i][k] + dp[k + 1][j] + dims[i] * dims[k + 1] * dims[j + 1]
                if cost < dp[i][j]:
                    dp[i][j] = cost
    return dp[0][n - 1]


def enumerate_brackets(dims, i, j):
    """Every bracketing, priced. The definition the table is summarising."""
    if i == j:
        return 0
    best = INF
    for k in range(i, j):
        cost = (enumerate_brackets(dims, i, k) + enumerate_brackets(dims, k + 1, j)
                + dims[i] * dims[k + 1] * dims[j + 1])
        best = min(best, cost)
    return best


def brute(dims):
    return enumerate_brackets(dims, 0, len(dims) - 2)


def count_brackets(n):
    """How many bracketings a chain of n matrices has: the Catalan number."""
    if n <= 1:
        return 1
    return sum(count_brackets(k) * count_brackets(n - k) for k in range(1, n))


def greedy(dims):
    """Repeatedly multiply the adjacent pair that costs least right now."""
    sizes = list(dims)
    total = 0
    while len(sizes) > 2:
        best_at = 0
        best_cost = INF
        for k in range(len(sizes) - 2):
            cost = sizes[k] * sizes[k + 1] * sizes[k + 2]
            if cost < best_cost:
                best_cost = cost
                best_at = k
        total += best_cost
        sizes = sizes[:best_at + 1] + sizes[best_at + 2:]
    return total


CASES = [
    [10, 30, 5, 60],
    [40, 20, 30, 10, 30],
    [5, 4, 6, 2, 7],
    [2, 3, 4, 5],
    [10, 20, 30],
]

print(f"{'dimensions':<26}{'bracketings':>13}{'table':>9}{'every one':>12}{'greedy':>9}")
for dims in CASES:
    n = len(dims) - 1
    print(f"{str(dims):<26}{count_brackets(n):>13}{table(dims):>9}{brute(dims):>12}{greedy(dims):>9}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
table_ok = 0
greedy_ok = 0
greedy_total = 0
best_total = 0
worst_ratio_num = 1
worst_ratio_den = 1
for _ in range(TRIALS):
    n = 3 + rand(4)
    dims = [2 + rand(30) for _ in range(n + 1)]
    truth = brute(dims)
    if table(dims) == truth:
        table_ok += 1
    g = greedy(dims)
    if g == truth:
        greedy_ok += 1
    greedy_total += g
    best_total += truth
    if g * worst_ratio_den > worst_ratio_num * truth:
        worst_ratio_num, worst_ratio_den = g, truth

print(f"over {TRIALS} random chains of 3 to 6 matrices, against every bracketing:")
print(f"  the interval table                     {table_ok:>6}")
print(f"  cheapest adjacent pair first           {greedy_ok:>6}")
print()
print(f"greedy spent {greedy_total} multiplications where the best bracketing spends")
print(f"{best_total}, and on its worst case here it spent {worst_ratio_num} against {worst_ratio_den}.")
print()
print("the split is the choice, and a locally cheap split is not a globally cheap")
print("one -- which is the same reason module 26's greedy exchange argument does")
print("not apply here. There is no adjacent pair whose immediate cost predicts the")
print("rest of the chain.")
`,
          output: `dimensions                  bracketings    table   every one   greedy
[10, 30, 5, 60]                       2     4500        4500     4500
[40, 20, 30, 10, 30]                  5    26000       26000    36000
[5, 4, 6, 2, 7]                       5      158         158      158
[2, 3, 4, 5]                          2       64          64       64
[10, 20, 30]                          1     6000        6000     6000

over 3000 random chains of 3 to 6 matrices, against every bracketing:
  the interval table                       3000
  cheapest adjacent pair first             1363

greedy spent 35040227 multiplications where the best bracketing spends
25262125, and on its worst case here it spent 55654 against 5874.

the split is the choice, and a locally cheap split is not a globally cheap
one -- which is the same reason module 26's greedy exchange argument does
not apply here. There is no adjacent pair whose immediate cost predicts the
rest of the chain.`,
          explanation:
            "The interval table against an enumeration of every bracketing, plus the greedy that gets tried first. The Catalan column is there to show what the table is replacing, and the greedy column to show that the cheapest immediate multiplication predicts nothing about the rest of the chain.",
          alternates: [
            {
              lang: "javascript",
              code: `// Matrix chain multiplication: the first problem whose state is an interval
// rather than a prefix.
//
// The product of a chain is the same however you bracket it, but the number of
// scalar multiplications is not. The state is a contiguous run of matrices, the
// transition is where that run is split in two, and the thing to notice is that
// the split is not a choice between two options -- it is a choice among every
// position in the interval.

const INF = Number.MAX_SAFE_INTEGER;

/** dp[i][j] = cheapest way to bracket matrices i through j inclusive. */
function table(dims) {
  const n = dims.length - 1;
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));
  // Filled by increasing interval length, because dp[i][j] needs shorter runs.
  for (let length = 2; length <= n; length++) {
    for (let i = 0; i + length <= n; i++) {
      const j = i + length - 1;
      dp[i][j] = INF;
      for (let k = i; k < j; k++) {
        const cost = dp[i][k] + dp[k + 1][j] + dims[i] * dims[k + 1] * dims[j + 1];
        if (cost < dp[i][j]) dp[i][j] = cost;
      }
    }
  }
  return dp[0][n - 1];
}

/** Every bracketing, priced. The definition the table is summarising. */
function enumerateBrackets(dims, i, j) {
  if (i === j) return 0;
  let best = INF;
  for (let k = i; k < j; k++) {
    const cost =
      enumerateBrackets(dims, i, k) + enumerateBrackets(dims, k + 1, j) +
      dims[i] * dims[k + 1] * dims[j + 1];
    if (cost < best) best = cost;
  }
  return best;
}

const brute = (dims) => enumerateBrackets(dims, 0, dims.length - 2);

/** How many bracketings a chain of n matrices has: the Catalan number. */
function countBrackets(n) {
  if (n <= 1) return 1;
  let total = 0;
  for (let k = 1; k < n; k++) total += countBrackets(k) * countBrackets(n - k);
  return total;
}

/** Repeatedly multiply the adjacent pair that costs least right now. */
function greedy(dims) {
  let sizes = [...dims];
  let total = 0;
  while (sizes.length > 2) {
    let bestAt = 0;
    let bestCost = INF;
    for (let k = 0; k + 2 < sizes.length; k++) {
      const cost = sizes[k] * sizes[k + 1] * sizes[k + 2];
      if (cost < bestCost) {
        bestCost = cost;
        bestAt = k;
      }
    }
    total += bestCost;
    sizes = [...sizes.slice(0, bestAt + 1), ...sizes.slice(bestAt + 2)];
  }
  return total;
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
const show = (values) => \`[\${values.join(", ")}]\`;

const CASES = [
  [10, 30, 5, 60],
  [40, 20, 30, 10, 30],
  [5, 4, 6, 2, 7],
  [2, 3, 4, 5],
  [10, 20, 30],
];

console.log(padEnd("dimensions", 26) + pad("bracketings", 13) + pad("table", 9) + pad("every one", 12) + pad("greedy", 9));
for (const dims of CASES) {
  const n = dims.length - 1;
  console.log(
    padEnd(show(dims), 26) + pad(countBrackets(n), 13) + pad(table(dims), 9) +
      pad(brute(dims), 12) + pad(greedy(dims), 9)
  );
}
console.log();

const TRIALS = 3000;
let tableOk = 0;
let greedyOk = 0;
let greedyTotal = 0;
let bestTotal = 0;
let worstRatioNum = 1;
let worstRatioDen = 1;
for (let t = 0; t < TRIALS; t++) {
  const n = 3 + rand(4);
  const dims = Array.from({ length: n + 1 }, () => 2 + rand(30));
  const truth = brute(dims);
  if (table(dims) === truth) tableOk++;
  const g = greedy(dims);
  if (g === truth) greedyOk++;
  greedyTotal += g;
  bestTotal += truth;
  if (g * worstRatioDen > worstRatioNum * truth) {
    worstRatioNum = g;
    worstRatioDen = truth;
  }
}

console.log(\`over \${TRIALS} random chains of 3 to 6 matrices, against every bracketing:\`);
console.log("  the interval table                     " + pad(tableOk, 6));
console.log("  cheapest adjacent pair first           " + pad(greedyOk, 6));
console.log();
console.log(\`greedy spent \${greedyTotal} multiplications where the best bracketing spends\`);
console.log(\`\${bestTotal}, and on its worst case here it spent \${worstRatioNum} against \${worstRatioDen}.\`);
console.log();
console.log("the split is the choice, and a locally cheap split is not a globally cheap");
console.log("one -- which is the same reason module 26's greedy exchange argument does");
console.log("not apply here. There is no adjacent pair whose immediate cost predicts the");
console.log("rest of the chain.");
`,
            },
            {
              lang: "typescript",
              code: `// Matrix chain multiplication: the first problem whose state is an interval
// rather than a prefix.
//
// The product of a chain is the same however you bracket it, but the number of
// scalar multiplications is not. The state is a contiguous run of matrices, the
// transition is where that run is split in two, and the thing to notice is that
// the split is not a choice between two options -- it is a choice among every
// position in the interval.

const INF = Number.MAX_SAFE_INTEGER;

/** dp[i][j] = cheapest way to bracket matrices i through j inclusive. */
function table(dims: number[]): number {
  const n = dims.length - 1;
  const dp: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  // Filled by increasing interval length, because dp[i][j] needs shorter runs.
  for (let length = 2; length <= n; length++) {
    for (let i = 0; i + length <= n; i++) {
      const j = i + length - 1;
      dp[i][j] = INF;
      for (let k = i; k < j; k++) {
        const cost = dp[i][k] + dp[k + 1][j] + dims[i] * dims[k + 1] * dims[j + 1];
        if (cost < dp[i][j]) dp[i][j] = cost;
      }
    }
  }
  return dp[0][n - 1];
}

/** Every bracketing, priced. The definition the table is summarising. */
function enumerateBrackets(dims: number[], i: number, j: number): number {
  if (i === j) return 0;
  let best = INF;
  for (let k = i; k < j; k++) {
    const cost =
      enumerateBrackets(dims, i, k) + enumerateBrackets(dims, k + 1, j) +
      dims[i] * dims[k + 1] * dims[j + 1];
    if (cost < best) best = cost;
  }
  return best;
}

const brute = (dims: number[]): number => enumerateBrackets(dims, 0, dims.length - 2);

/** How many bracketings a chain of n matrices has: the Catalan number. */
function countBrackets(n: number): number {
  if (n <= 1) return 1;
  let total = 0;
  for (let k = 1; k < n; k++) total += countBrackets(k) * countBrackets(n - k);
  return total;
}

/** Repeatedly multiply the adjacent pair that costs least right now. */
function greedy(dims: number[]): number {
  let sizes = [...dims];
  let total = 0;
  while (sizes.length > 2) {
    let bestAt = 0;
    let bestCost = INF;
    for (let k = 0; k + 2 < sizes.length; k++) {
      const cost = sizes[k] * sizes[k + 1] * sizes[k + 2];
      if (cost < bestCost) {
        bestCost = cost;
        bestAt = k;
      }
    }
    total += bestCost;
    sizes = [...sizes.slice(0, bestAt + 1), ...sizes.slice(bestAt + 2)];
  }
  return total;
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
const show = (values: number[]): string => \`[\${values.join(", ")}]\`;

const CASES = [
  [10, 30, 5, 60],
  [40, 20, 30, 10, 30],
  [5, 4, 6, 2, 7],
  [2, 3, 4, 5],
  [10, 20, 30],
];

console.log(padEnd("dimensions", 26) + pad("bracketings", 13) + pad("table", 9) + pad("every one", 12) + pad("greedy", 9));
for (const dims of CASES) {
  const n = dims.length - 1;
  console.log(
    padEnd(show(dims), 26) + pad(countBrackets(n), 13) + pad(table(dims), 9) +
      pad(brute(dims), 12) + pad(greedy(dims), 9)
  );
}
console.log();

const TRIALS = 3000;
let tableOk = 0;
let greedyOk = 0;
let greedyTotal = 0;
let bestTotal = 0;
let worstRatioNum = 1;
let worstRatioDen = 1;
for (let t = 0; t < TRIALS; t++) {
  const n = 3 + rand(4);
  const dims = Array.from({ length: n + 1 }, () => 2 + rand(30));
  const truth = brute(dims);
  if (table(dims) === truth) tableOk++;
  const g = greedy(dims);
  if (g === truth) greedyOk++;
  greedyTotal += g;
  bestTotal += truth;
  if (g * worstRatioDen > worstRatioNum * truth) {
    worstRatioNum = g;
    worstRatioDen = truth;
  }
}

console.log(\`over \${TRIALS} random chains of 3 to 6 matrices, against every bracketing:\`);
console.log("  the interval table                     " + pad(tableOk, 6));
console.log("  cheapest adjacent pair first           " + pad(greedyOk, 6));
console.log();
console.log(\`greedy spent \${greedyTotal} multiplications where the best bracketing spends\`);
console.log(\`\${bestTotal}, and on its worst case here it spent \${worstRatioNum} against \${worstRatioDen}.\`);
console.log();
console.log("the split is the choice, and a locally cheap split is not a globally cheap");
console.log("one -- which is the same reason module 26's greedy exchange argument does");
console.log("not apply here. There is no adjacent pair whose immediate cost predicts the");
console.log("rest of the chain.");
`,
            },
            {
              lang: "java",
              code: `// Matrix chain multiplication: the first problem whose state is an interval
// rather than a prefix.
//
// The product of a chain is the same however you bracket it, but the number of
// scalar multiplications is not. The state is a contiguous run of matrices, the
// transition is where that run is split in two, and the thing to notice is that
// the split is not a choice between two options -- it is a choice among every
// position in the interval.
import java.util.ArrayList;
import java.util.List;

public class Main {
    static final long INF = Long.MAX_VALUE / 4;

    // dp[i][j] = cheapest way to bracket matrices i through j inclusive.
    static long table(int[] dims) {
        int n = dims.length - 1;
        long[][] dp = new long[n][n];
        // Filled by increasing interval length, because dp[i][j] needs shorter runs.
        for (int length = 2; length <= n; length++) {
            for (int i = 0; i + length <= n; i++) {
                int j = i + length - 1;
                dp[i][j] = INF;
                for (int k = i; k < j; k++) {
                    long cost = dp[i][k] + dp[k + 1][j] + (long) dims[i] * dims[k + 1] * dims[j + 1];
                    if (cost < dp[i][j]) dp[i][j] = cost;
                }
            }
        }
        return dp[0][n - 1];
    }

    // Every bracketing, priced. The definition the table is summarising.
    static long enumerateBrackets(int[] dims, int i, int j) {
        if (i == j) return 0;
        long best = INF;
        for (int k = i; k < j; k++) {
            long cost = enumerateBrackets(dims, i, k) + enumerateBrackets(dims, k + 1, j)
                + (long) dims[i] * dims[k + 1] * dims[j + 1];
            if (cost < best) best = cost;
        }
        return best;
    }

    static long brute(int[] dims) {
        return enumerateBrackets(dims, 0, dims.length - 2);
    }

    // How many bracketings a chain of n matrices has: the Catalan number.
    static long countBrackets(int n) {
        if (n <= 1) return 1;
        long total = 0;
        for (int k = 1; k < n; k++) total += countBrackets(k) * countBrackets(n - k);
        return total;
    }

    // Repeatedly multiply the adjacent pair that costs least right now.
    static long greedy(int[] dims) {
        List<Integer> sizes = new ArrayList<>();
        for (int d : dims) sizes.add(d);
        long total = 0;
        while (sizes.size() > 2) {
            int bestAt = 0;
            long bestCost = INF;
            for (int k = 0; k + 2 < sizes.size(); k++) {
                long cost = (long) sizes.get(k) * sizes.get(k + 1) * sizes.get(k + 2);
                if (cost < bestCost) {
                    bestCost = cost;
                    bestAt = k;
                }
            }
            total += bestCost;
            sizes.remove(bestAt + 1);
        }
        return total;
    }

    static String show(int[] values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(values[i]);
        }
        return sb.append("]").toString();
    }

    static String padEnd(Object v, int w) {
        StringBuilder sb = new StringBuilder(String.valueOf(v));
        while (sb.length() < w) sb.append(' ');
        return sb.toString();
    }

    static String pad(Object v, int w) {
        StringBuilder sb = new StringBuilder(String.valueOf(v));
        while (sb.length() < w) sb.insert(0, ' ');
        return sb.toString();
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        int[][] cases = {
            {10, 30, 5, 60},
            {40, 20, 30, 10, 30},
            {5, 4, 6, 2, 7},
            {2, 3, 4, 5},
            {10, 20, 30},
        };

        System.out.println(padEnd("dimensions", 26) + pad("bracketings", 13) + pad("table", 9)
            + pad("every one", 12) + pad("greedy", 9));
        for (int[] dims : cases) {
            int n = dims.length - 1;
            System.out.println(padEnd(show(dims), 26) + pad(countBrackets(n), 13) + pad(table(dims), 9)
                + pad(brute(dims), 12) + pad(greedy(dims), 9));
        }
        System.out.println();

        int trials = 3000;
        int tableOk = 0, greedyOk = 0;
        long greedyTotal = 0, bestTotal = 0, worstRatioNum = 1, worstRatioDen = 1;
        for (int t = 0; t < trials; t++) {
            int n = 3 + rand(4);
            int[] dims = new int[n + 1];
            for (int i = 0; i <= n; i++) dims[i] = 2 + rand(30);
            long truth = brute(dims);
            if (table(dims) == truth) tableOk++;
            long g = greedy(dims);
            if (g == truth) greedyOk++;
            greedyTotal += g;
            bestTotal += truth;
            if (g * worstRatioDen > worstRatioNum * truth) {
                worstRatioNum = g;
                worstRatioDen = truth;
            }
        }

        System.out.println("over " + trials + " random chains of 3 to 6 matrices, against every bracketing:");
        System.out.println("  the interval table                     " + pad(tableOk, 6));
        System.out.println("  cheapest adjacent pair first           " + pad(greedyOk, 6));
        System.out.println();
        System.out.println("greedy spent " + greedyTotal + " multiplications where the best bracketing spends");
        System.out.println(bestTotal + ", and on its worst case here it spent " + worstRatioNum
            + " against " + worstRatioDen + ".");
        System.out.println();
        System.out.println("the split is the choice, and a locally cheap split is not a globally cheap");
        System.out.println("one -- which is the same reason module 26's greedy exchange argument does");
        System.out.println("not apply here. There is no adjacent pair whose immediate cost predicts the");
        System.out.println("rest of the chain.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Matrix chain multiplication: the first problem whose state is an interval
// rather than a prefix.
//
// The product of a chain is the same however you bracket it, but the number of
// scalar multiplications is not. The state is a contiguous run of matrices, the
// transition is where that run is split in two, and the thing to notice is that
// the split is not a choice between two options -- it is a choice among every
// position in the interval.
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

static const std::int64_t INF = static_cast<std::int64_t>(1) << 60;

// dp[i][j] = cheapest way to bracket matrices i through j inclusive.
std::int64_t table(const std::vector<int> &dims) {
    int n = static_cast<int>(dims.size()) - 1;
    std::vector<std::vector<std::int64_t>> dp(n, std::vector<std::int64_t>(n, 0));
    // Filled by increasing interval length, because dp[i][j] needs shorter runs.
    for (int length = 2; length <= n; length++) {
        for (int i = 0; i + length <= n; i++) {
            int j = i + length - 1;
            dp[i][j] = INF;
            for (int k = i; k < j; k++) {
                std::int64_t cost = dp[i][k] + dp[k + 1][j] +
                    static_cast<std::int64_t>(dims[i]) * dims[k + 1] * dims[j + 1];
                if (cost < dp[i][j]) dp[i][j] = cost;
            }
        }
    }
    return dp[0][n - 1];
}

// Every bracketing, priced. The definition the table is summarising.
std::int64_t enumerateBrackets(const std::vector<int> &dims, int i, int j) {
    if (i == j) return 0;
    std::int64_t best = INF;
    for (int k = i; k < j; k++) {
        std::int64_t cost = enumerateBrackets(dims, i, k) + enumerateBrackets(dims, k + 1, j) +
            static_cast<std::int64_t>(dims[i]) * dims[k + 1] * dims[j + 1];
        if (cost < best) best = cost;
    }
    return best;
}

std::int64_t brute(const std::vector<int> &dims) {
    return enumerateBrackets(dims, 0, static_cast<int>(dims.size()) - 2);
}

// How many bracketings a chain of n matrices has: the Catalan number.
std::int64_t countBrackets(int n) {
    if (n <= 1) return 1;
    std::int64_t total = 0;
    for (int k = 1; k < n; k++) total += countBrackets(k) * countBrackets(n - k);
    return total;
}

// Repeatedly multiply the adjacent pair that costs least right now.
std::int64_t greedy(const std::vector<int> &dims) {
    std::vector<int> sizes = dims;
    std::int64_t total = 0;
    while (sizes.size() > 2) {
        size_t bestAt = 0;
        std::int64_t bestCost = INF;
        for (size_t k = 0; k + 2 < sizes.size(); k++) {
            std::int64_t cost = static_cast<std::int64_t>(sizes[k]) * sizes[k + 1] * sizes[k + 2];
            if (cost < bestCost) {
                bestCost = cost;
                bestAt = k;
            }
        }
        total += bestCost;
        sizes.erase(sizes.begin() + static_cast<long>(bestAt) + 1);
    }
    return total;
}

std::string show(const std::vector<int> &values) {
    std::string out = "[";
    for (size_t i = 0; i < values.size(); i++) {
        if (i > 0) out += ", ";
        out += std::to_string(values[i]);
    }
    return out + "]";
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    const std::vector<std::vector<int>> cases = {
        {10, 30, 5, 60},
        {40, 20, 30, 10, 30},
        {5, 4, 6, 2, 7},
        {2, 3, 4, 5},
        {10, 20, 30},
    };

    std::cout << std::left << std::setw(26) << "dimensions" << std::right << std::setw(13) << "bracketings"
              << std::setw(9) << "table" << std::setw(12) << "every one" << std::setw(9) << "greedy" << "\\n";
    for (const auto &dims : cases) {
        int n = static_cast<int>(dims.size()) - 1;
        std::cout << std::left << std::setw(26) << show(dims) << std::right
                  << std::setw(13) << countBrackets(n) << std::setw(9) << table(dims)
                  << std::setw(12) << brute(dims) << std::setw(9) << greedy(dims) << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 3000;
    int tableOk = 0, greedyOk = 0;
    std::int64_t greedyTotal = 0, bestTotal = 0, worstRatioNum = 1, worstRatioDen = 1;
    for (int t = 0; t < TRIALS; t++) {
        int n = 3 + rnd(4);
        std::vector<int> dims(n + 1);
        for (int i = 0; i <= n; i++) dims[i] = 2 + rnd(30);
        std::int64_t truth = brute(dims);
        if (table(dims) == truth) tableOk++;
        std::int64_t g = greedy(dims);
        if (g == truth) greedyOk++;
        greedyTotal += g;
        bestTotal += truth;
        if (g * worstRatioDen > worstRatioNum * truth) {
            worstRatioNum = g;
            worstRatioDen = truth;
        }
    }

    std::cout << "over " << TRIALS << " random chains of 3 to 6 matrices, against every bracketing:\\n";
    std::cout << "  the interval table                     " << std::setw(6) << tableOk << "\\n";
    std::cout << "  cheapest adjacent pair first           " << std::setw(6) << greedyOk << "\\n\\n";
    std::cout << "greedy spent " << greedyTotal << " multiplications where the best bracketing spends\\n";
    std::cout << bestTotal << ", and on its worst case here it spent " << worstRatioNum
              << " against " << worstRatioDen << ".\\n\\n";
    std::cout << "the split is the choice, and a locally cheap split is not a globally cheap\\n";
    std::cout << "one -- which is the same reason module 26's greedy exchange argument does\\n";
    std::cout << "not apply here. There is no adjacent pair whose immediate cost predicts the\\n";
    std::cout << "rest of the chain.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// Matrix chain multiplication: the first problem whose state is an interval
// rather than a prefix.
//
// The product of a chain is the same however you bracket it, but the number of
// scalar multiplications is not. The state is a contiguous run of matrices, the
// transition is where that run is split in two, and the thing to notice is that
// the split is not a choice between two options -- it is a choice among every
// position in the interval.

const INF: i64 = 1 << 60;

/// dp[i][j] = cheapest way to bracket matrices i through j inclusive.
fn table(dims: &[i64]) -> i64 {
    let n = dims.len() - 1;
    let mut dp = vec![vec![0i64; n]; n];
    // Filled by increasing interval length, because dp[i][j] needs shorter runs.
    for length in 2..=n {
        for i in 0..=(n - length) {
            let j = i + length - 1;
            dp[i][j] = INF;
            for k in i..j {
                let cost = dp[i][k] + dp[k + 1][j] + dims[i] * dims[k + 1] * dims[j + 1];
                if cost < dp[i][j] {
                    dp[i][j] = cost;
                }
            }
        }
    }
    dp[0][n - 1]
}

/// Every bracketing, priced. The definition the table is summarising.
fn enumerate_brackets(dims: &[i64], i: usize, j: usize) -> i64 {
    if i == j {
        return 0;
    }
    let mut best = INF;
    for k in i..j {
        let cost = enumerate_brackets(dims, i, k)
            + enumerate_brackets(dims, k + 1, j)
            + dims[i] * dims[k + 1] * dims[j + 1];
        if cost < best {
            best = cost;
        }
    }
    best
}

fn brute(dims: &[i64]) -> i64 {
    enumerate_brackets(dims, 0, dims.len() - 2)
}

/// How many bracketings a chain of n matrices has: the Catalan number.
fn count_brackets(n: usize) -> i64 {
    if n <= 1 {
        return 1;
    }
    (1..n).map(|k| count_brackets(k) * count_brackets(n - k)).sum()
}

/// Repeatedly multiply the adjacent pair that costs least right now.
fn greedy(dims: &[i64]) -> i64 {
    let mut sizes = dims.to_vec();
    let mut total = 0;
    while sizes.len() > 2 {
        let mut best_at = 0;
        let mut best_cost = INF;
        for k in 0..sizes.len() - 2 {
            let cost = sizes[k] * sizes[k + 1] * sizes[k + 2];
            if cost < best_cost {
                best_cost = cost;
                best_at = k;
            }
        }
        total += best_cost;
        sizes.remove(best_at + 1);
    }
    total
}

fn show(values: &[i64]) -> String {
    let parts: Vec<String> = values.iter().map(|v| v.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

struct Rng {
    seed: i64,
}

impl Rng {
    fn next(&mut self, n: i64) -> i64 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        self.seed / 65536 % n
    }
}

fn main() {
    let cases: Vec<Vec<i64>> = vec![
        vec![10, 30, 5, 60],
        vec![40, 20, 30, 10, 30],
        vec![5, 4, 6, 2, 7],
        vec![2, 3, 4, 5],
        vec![10, 20, 30],
    ];

    println!(
        "{:<26}{:>13}{:>9}{:>12}{:>9}",
        "dimensions", "bracketings", "table", "every one", "greedy"
    );
    for dims in &cases {
        let n = dims.len() - 1;
        println!(
            "{:<26}{:>13}{:>9}{:>12}{:>9}",
            show(dims),
            count_brackets(n),
            table(dims),
            brute(dims),
            greedy(dims)
        );
    }
    println!();

    let trials = 3000;
    let mut rng = Rng { seed: 1 };
    let (mut table_ok, mut greedy_ok) = (0, 0);
    let (mut greedy_total, mut best_total) = (0i64, 0i64);
    let (mut worst_ratio_num, mut worst_ratio_den) = (1i64, 1i64);
    for _ in 0..trials {
        let n = (3 + rng.next(4)) as usize;
        let dims: Vec<i64> = (0..=n).map(|_| 2 + rng.next(30)).collect();
        let truth = brute(&dims);
        if table(&dims) == truth {
            table_ok += 1;
        }
        let g = greedy(&dims);
        if g == truth {
            greedy_ok += 1;
        }
        greedy_total += g;
        best_total += truth;
        if g * worst_ratio_den > worst_ratio_num * truth {
            worst_ratio_num = g;
            worst_ratio_den = truth;
        }
    }

    println!("over {} random chains of 3 to 6 matrices, against every bracketing:", trials);
    println!("  the interval table                     {:>6}", table_ok);
    println!("  cheapest adjacent pair first           {:>6}", greedy_ok);
    println!();
    println!("greedy spent {} multiplications where the best bracketing spends", greedy_total);
    println!("{}, and on its worst case here it spent {} against {}.", best_total, worst_ratio_num, worst_ratio_den);
    println!();
    println!("the split is the choice, and a locally cheap split is not a globally cheap");
    println!("one -- which is the same reason module 26's greedy exchange argument does");
    println!("not apply here. There is no adjacent pair whose immediate cost predicts the");
    println!("rest of the chain.");
}
`,
            },
            {
              lang: "go",
              code: `// Matrix chain multiplication: the first problem whose state is an interval
// rather than a prefix.
//
// The product of a chain is the same however you bracket it, but the number of
// scalar multiplications is not. The state is a contiguous run of matrices, the
// transition is where that run is split in two, and the thing to notice is that
// the split is not a choice between two options -- it is a choice among every
// position in the interval.
package main

import (
	"fmt"
	"strconv"
	"strings"
)

const inf int64 = 1 << 60

// table gives dp[i][j] = cheapest way to bracket matrices i through j inclusive.
func table(dims []int) int64 {
	n := len(dims) - 1
	dp := make([][]int64, n)
	for i := range dp {
		dp[i] = make([]int64, n)
	}
	// Filled by increasing interval length, because dp[i][j] needs shorter runs.
	for length := 2; length <= n; length++ {
		for i := 0; i+length <= n; i++ {
			j := i + length - 1
			dp[i][j] = inf
			for k := i; k < j; k++ {
				cost := dp[i][k] + dp[k+1][j] + int64(dims[i])*int64(dims[k+1])*int64(dims[j+1])
				if cost < dp[i][j] {
					dp[i][j] = cost
				}
			}
		}
	}
	return dp[0][n-1]
}

// enumerateBrackets prices every bracketing, which is what the table summarises.
func enumerateBrackets(dims []int, i, j int) int64 {
	if i == j {
		return 0
	}
	best := inf
	for k := i; k < j; k++ {
		cost := enumerateBrackets(dims, i, k) + enumerateBrackets(dims, k+1, j) +
			int64(dims[i])*int64(dims[k+1])*int64(dims[j+1])
		if cost < best {
			best = cost
		}
	}
	return best
}

func brute(dims []int) int64 { return enumerateBrackets(dims, 0, len(dims)-2) }

// countBrackets is how many bracketings a chain of n matrices has: the Catalan number.
func countBrackets(n int) int64 {
	if n <= 1 {
		return 1
	}
	var total int64
	for k := 1; k < n; k++ {
		total += countBrackets(k) * countBrackets(n-k)
	}
	return total
}

// greedy repeatedly multiplies the adjacent pair that costs least right now.
func greedy(dims []int) int64 {
	sizes := append([]int(nil), dims...)
	var total int64
	for len(sizes) > 2 {
		bestAt := 0
		bestCost := inf
		for k := 0; k+2 < len(sizes); k++ {
			cost := int64(sizes[k]) * int64(sizes[k+1]) * int64(sizes[k+2])
			if cost < bestCost {
				bestCost = cost
				bestAt = k
			}
		}
		total += bestCost
		sizes = append(sizes[:bestAt+1], sizes[bestAt+2:]...)
	}
	return total
}

func show(values []int) string {
	parts := make([]string, len(values))
	for i, v := range values {
		parts[i] = strconv.Itoa(v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	cases := [][]int{
		{10, 30, 5, 60},
		{40, 20, 30, 10, 30},
		{5, 4, 6, 2, 7},
		{2, 3, 4, 5},
		{10, 20, 30},
	}

	fmt.Printf("%-26s%13s%9s%12s%9s\\n", "dimensions", "bracketings", "table", "every one", "greedy")
	for _, dims := range cases {
		n := len(dims) - 1
		fmt.Printf("%-26s%13d%9d%12d%9d\\n", show(dims), countBrackets(n), table(dims),
			brute(dims), greedy(dims))
	}
	fmt.Println()

	trials := 3000
	tableOk, greedyOk := 0, 0
	var greedyTotal, bestTotal int64
	var worstRatioNum, worstRatioDen int64 = 1, 1
	for t := 0; t < trials; t++ {
		n := 3 + rand(4)
		dims := make([]int, n+1)
		for i := 0; i <= n; i++ {
			dims[i] = 2 + rand(30)
		}
		truth := brute(dims)
		if table(dims) == truth {
			tableOk++
		}
		g := greedy(dims)
		if g == truth {
			greedyOk++
		}
		greedyTotal += g
		bestTotal += truth
		if g*worstRatioDen > worstRatioNum*truth {
			worstRatioNum = g
			worstRatioDen = truth
		}
	}

	fmt.Printf("over %d random chains of 3 to 6 matrices, against every bracketing:\\n", trials)
	fmt.Printf("  the interval table                     %6d\\n", tableOk)
	fmt.Printf("  cheapest adjacent pair first           %6d\\n", greedyOk)
	fmt.Println()
	fmt.Printf("greedy spent %d multiplications where the best bracketing spends\\n", greedyTotal)
	fmt.Printf("%d, and on its worst case here it spent %d against %d.\\n", bestTotal,
		worstRatioNum, worstRatioDen)
	fmt.Println()
	fmt.Println("the split is the choice, and a locally cheap split is not a globally cheap")
	fmt.Println("one -- which is the same reason module 26's greedy exchange argument does")
	fmt.Println("not apply here. There is no adjacent pair whose immediate cost predicts the")
	fmt.Println("rest of the chain.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "The transition is a choice among every split, not between two branches",
          body: "Prefix and grid problems get a two-way or three-way decision per cell; an interval gets one per position inside it. That is the extra factor of n, and it is also why an interval recurrence written as `min(left, right)` is almost always wrong \u2014 there is no \"left option\" and \"right option\", there is a loop over k.",
        },
        {
          title: "Greedy does not work here, and the exchange argument says why",
          body: "Repeatedly multiplying the cheapest adjacent pair was right on 1,363 of 3,000 chains and spent ten times the optimal cost on its worst case. There is no local exchange that improves any suboptimal bracketing without knowing the rest of the chain, which is precisely the property module 26 required and this problem lacks.",
        },
      ],
    },
    {
      id: "which-end-to-reason-from",
      heading: "Which end of the interval to reason about",
      body: [
        "The second thing about intervals is subtler and it is the actual difficulty of the family: a split is only a valid transition if the two sides are independent *after* the split. Sometimes the obvious split is not.",
        "Bursting balloons is the standard demonstration. Balloons sit in a row with values; bursting one earns its value times the values of its two current neighbours, and then the row closes up. Maximise the total. The obvious interval recurrence asks which balloon in the range to burst **first**, and it is wrong.",
        "It is wrong because of what closing up does. Burst `k` first, and the balloons to its left and right become adjacent \u2014 the left half's right-hand boundary is now something in the right half. The two sides are not separate problems any more; they interact across the gap. Writing the recurrence anyway produces a program that runs and returns a number.",
        "The fix is to ask which balloon is burst **last** in the range. If `k` is last, then everything in `[i, k-1]` and everything in `[k+1, j]` has already gone, so when `k` finally bursts its neighbours are the interval's own outer edges \u2014 known, fixed, and independent of what happened inside either half. That is what makes the two subproblems separable.",
        "The measurement is stark. Against enumerating every burst order, the last-balloon formulation is right on all 3,000 random rows and the first-balloon one on 166. It is not merely inaccurate: on 1,315 of them it reported a score *higher* than any real order can achieve, because it is adding up gains from two halves that could never have been collected in the same run. A number too large for the problem is a good signal to look for exactly this.",
        "The general habit: after choosing a split, say out loud what each side's boundary conditions are. If either side's answer depends on what the other side did, the split is not a transition, however natural it looks.",
      ],
      examples: [
        {
          id: "last-not-first",
          title: "Burst balloons, with the interval reasoned from each end",
          lang: "python",
          code: `# Bursting balloons, which is the interval pattern's other half: choosing the
# right end of the interval to reason about.
#
# Bursting balloon k earns its value times its two current neighbours, and then
# the neighbours close up. The obvious recurrence asks which balloon to burst
# *first* in an interval, and it is wrong -- once the first one is gone the two
# halves share a boundary that has moved, so they are not independent
# subproblems. Asking which balloon is burst *last* makes them independent,
# because that balloon's neighbours are then exactly the interval's own edges.


def brute(values):
    """Try every order of bursting. The definition, at factorial cost."""
    def best(remaining):
        if not remaining:
            return 0
        top = 0
        for k in range(len(remaining)):
            left = remaining[k - 1] if k > 0 else 1
            right = remaining[k + 1] if k + 1 < len(remaining) else 1
            gain = left * remaining[k] * right
            rest = best(remaining[:k] + remaining[k + 1:])
            top = max(top, gain + rest)
        return top

    return best(list(values))


def last_burst(values):
    """dp[i][j] = best from interval i..j, choosing which balloon bursts last."""
    pad = [1] + list(values) + [1]
    n = len(values)
    dp = [[0] * (n + 2) for _ in range(n + 2)]
    for length in range(1, n + 1):
        for i in range(1, n - length + 2):
            j = i + length - 1
            for k in range(i, j + 1):
                # k is last, so its neighbours are the interval's own edges.
                gain = pad[i - 1] * pad[k] * pad[j + 1] + dp[i][k - 1] + dp[k + 1][j]
                if gain > dp[i][j]:
                    dp[i][j] = gain
    return dp[1][n]


def first_burst(values):
    """The same shape, choosing which balloon bursts first. Not a valid split."""
    pad = [1] + list(values) + [1]
    n = len(values)
    dp = [[0] * (n + 2) for _ in range(n + 2)]
    for length in range(1, n + 1):
        for i in range(1, n - length + 2):
            j = i + length - 1
            for k in range(i, j + 1):
                # k is first, so its neighbours are whatever is next to it now.
                gain = pad[k - 1] * pad[k] * pad[k + 1] + dp[i][k - 1] + dp[k + 1][j]
                if gain > dp[i][j]:
                    dp[i][j] = gain
    return dp[1][n]


def factorial(n):
    out = 1
    for step in range(2, n + 1):
        out *= step
    return out


CASES = [
    [3, 1, 5, 8],
    [1, 5],
    [2, 4, 6],
    [9, 1, 1, 9],
    [1, 2, 3, 4, 5],
]

print(f"{'balloons':<20}{'orders':>8}{'last burst':>12}{'first burst':>13}{'every order':>13}")
for values in CASES:
    print(f"{str(values):<20}{factorial(len(values)):>8}{last_burst(values):>12}"
          f"{first_burst(values):>13}{brute(values):>13}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
last_ok = 0
first_ok = 0
first_over = 0
for _ in range(TRIALS):
    n = 2 + rand(5)
    values = [1 + rand(9) for _ in range(n)]
    truth = brute(values)
    if last_burst(values) == truth:
        last_ok += 1
    guess = first_burst(values)
    if guess == truth:
        first_ok += 1
    if guess > truth:
        first_over += 1

print(f"over {TRIALS} random rows of 2 to 6 balloons, against every burst order:")
print(f"  choosing the last balloon in the interval    {last_ok:>6}")
print(f"  choosing the first balloon in the interval   {first_ok:>6}")
print()
print(f"and the wrong one claimed a score higher than any real order allows on")
print(f"{first_over} of them, which is the giveaway: it is adding up gains from two")
print("halves that could never have been collected in the same run.")
print()
print("the recurrence is the same size either way. What differs is whether the")
print("two sides of the split are independent once the split is made.")
`,
          output: `balloons              orders  last burst  first burst  every order
[3, 1, 5, 8]              24         167           98          167
[1, 5]                     2          10           10           10
[2, 4, 6]                  6          66           80           66
[9, 1, 1, 9]              24         180           36          180
[1, 2, 3, 4, 5]          120         110          112          110

over 3000 random rows of 2 to 6 balloons, against every burst order:
  choosing the last balloon in the interval      3000
  choosing the first balloon in the interval      166

and the wrong one claimed a score higher than any real order allows on
1315 of them, which is the giveaway: it is adding up gains from two
halves that could never have been collected in the same run.

the recurrence is the same size either way. What differs is whether the
two sides of the split are independent once the split is made.`,
          explanation:
            "The same recurrence twice, differing only in whether k is the first balloon burst in the interval or the last, both scored against every burst order. The first-balloon version reports impossible totals on nearly half the trials, which is what a split between non-independent halves looks like from the outside.",
          alternates: [
            {
              lang: "javascript",
              code: `// Bursting balloons, which is the interval pattern's other half: choosing the
// right end of the interval to reason about.
//
// Bursting balloon k earns its value times its two current neighbours, and then
// the neighbours close up. The obvious recurrence asks which balloon to burst
// *first* in an interval, and it is wrong -- once the first one is gone the two
// halves share a boundary that has moved, so they are not independent
// subproblems. Asking which balloon is burst *last* makes them independent,
// because that balloon's neighbours are then exactly the interval's own edges.

/** Try every order of bursting. The definition, at factorial cost. */
function brute(values) {
  const best = (remaining) => {
    if (remaining.length === 0) return 0;
    let top = 0;
    for (let k = 0; k < remaining.length; k++) {
      const left = k > 0 ? remaining[k - 1] : 1;
      const right = k + 1 < remaining.length ? remaining[k + 1] : 1;
      const gain = left * remaining[k] * right;
      const rest = best([...remaining.slice(0, k), ...remaining.slice(k + 1)]);
      if (gain + rest > top) top = gain + rest;
    }
    return top;
  };
  return best([...values]);
}

/** dp[i][j] = best from interval i..j, choosing which balloon bursts last. */
function lastBurst(values) {
  const pad = [1, ...values, 1];
  const n = values.length;
  const dp = Array.from({ length: n + 2 }, () => new Array(n + 2).fill(0));
  for (let length = 1; length <= n; length++) {
    for (let i = 1; i + length <= n + 1; i++) {
      const j = i + length - 1;
      for (let k = i; k <= j; k++) {
        // k is last, so its neighbours are the interval's own edges.
        const gain = pad[i - 1] * pad[k] * pad[j + 1] + dp[i][k - 1] + dp[k + 1][j];
        if (gain > dp[i][j]) dp[i][j] = gain;
      }
    }
  }
  return dp[1][n];
}

/** The same shape, choosing which balloon bursts first. Not a valid split. */
function firstBurst(values) {
  const pad = [1, ...values, 1];
  const n = values.length;
  const dp = Array.from({ length: n + 2 }, () => new Array(n + 2).fill(0));
  for (let length = 1; length <= n; length++) {
    for (let i = 1; i + length <= n + 1; i++) {
      const j = i + length - 1;
      for (let k = i; k <= j; k++) {
        // k is first, so its neighbours are whatever is next to it now.
        const gain = pad[k - 1] * pad[k] * pad[k + 1] + dp[i][k - 1] + dp[k + 1][j];
        if (gain > dp[i][j]) dp[i][j] = gain;
      }
    }
  }
  return dp[1][n];
}

function factorial(n) {
  let out = 1;
  for (let step = 2; step <= n; step++) out *= step;
  return out;
}

const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);
const show = (values) => \`[\${values.join(", ")}]\`;

const CASES = [
  [3, 1, 5, 8],
  [1, 5],
  [2, 4, 6],
  [9, 1, 1, 9],
  [1, 2, 3, 4, 5],
];

console.log(padEnd("balloons", 20) + pad("orders", 8) + pad("last burst", 12) + pad("first burst", 13) + pad("every order", 13));
for (const values of CASES) {
  console.log(
    padEnd(show(values), 20) + pad(factorial(values.length), 8) + pad(lastBurst(values), 12) +
      pad(firstBurst(values), 13) + pad(brute(values), 13)
  );
}
console.log();

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const TRIALS = 3000;
let lastOk = 0;
let firstOk = 0;
let firstOver = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(5);
  const values = Array.from({ length: n }, () => 1 + rand(9));
  const truth = brute(values);
  if (lastBurst(values) === truth) lastOk++;
  const guess = firstBurst(values);
  if (guess === truth) firstOk++;
  if (guess > truth) firstOver++;
}

console.log(\`over \${TRIALS} random rows of 2 to 6 balloons, against every burst order:\`);
console.log("  choosing the last balloon in the interval    " + pad(lastOk, 6));
console.log("  choosing the first balloon in the interval   " + pad(firstOk, 6));
console.log();
console.log("and the wrong one claimed a score higher than any real order allows on");
console.log(\`\${firstOver} of them, which is the giveaway: it is adding up gains from two\`);
console.log("halves that could never have been collected in the same run.");
console.log();
console.log("the recurrence is the same size either way. What differs is whether the");
console.log("two sides of the split are independent once the split is made.");
`,
            },
            {
              lang: "typescript",
              code: `// Bursting balloons, which is the interval pattern's other half: choosing the
// right end of the interval to reason about.
//
// Bursting balloon k earns its value times its two current neighbours, and then
// the neighbours close up. The obvious recurrence asks which balloon to burst
// *first* in an interval, and it is wrong -- once the first one is gone the two
// halves share a boundary that has moved, so they are not independent
// subproblems. Asking which balloon is burst *last* makes them independent,
// because that balloon's neighbours are then exactly the interval's own edges.

/** Try every order of bursting. The definition, at factorial cost. */
function brute(values: number[]): number {
  const best = (remaining: number[]): number => {
    if (remaining.length === 0) return 0;
    let top = 0;
    for (let k = 0; k < remaining.length; k++) {
      const left = k > 0 ? remaining[k - 1] : 1;
      const right = k + 1 < remaining.length ? remaining[k + 1] : 1;
      const gain = left * remaining[k] * right;
      const rest = best([...remaining.slice(0, k), ...remaining.slice(k + 1)]);
      if (gain + rest > top) top = gain + rest;
    }
    return top;
  };
  return best([...values]);
}

/** dp[i][j] = best from interval i..j, choosing which balloon bursts last. */
function lastBurst(values: number[]): number {
  const pad = [1, ...values, 1];
  const n = values.length;
  const dp: number[][] = Array.from({ length: n + 2 }, () => new Array(n + 2).fill(0));
  for (let length = 1; length <= n; length++) {
    for (let i = 1; i + length <= n + 1; i++) {
      const j = i + length - 1;
      for (let k = i; k <= j; k++) {
        // k is last, so its neighbours are the interval's own edges.
        const gain = pad[i - 1] * pad[k] * pad[j + 1] + dp[i][k - 1] + dp[k + 1][j];
        if (gain > dp[i][j]) dp[i][j] = gain;
      }
    }
  }
  return dp[1][n];
}

/** The same shape, choosing which balloon bursts first. Not a valid split. */
function firstBurst(values: number[]): number {
  const pad = [1, ...values, 1];
  const n = values.length;
  const dp: number[][] = Array.from({ length: n + 2 }, () => new Array(n + 2).fill(0));
  for (let length = 1; length <= n; length++) {
    for (let i = 1; i + length <= n + 1; i++) {
      const j = i + length - 1;
      for (let k = i; k <= j; k++) {
        // k is first, so its neighbours are whatever is next to it now.
        const gain = pad[k - 1] * pad[k] * pad[k + 1] + dp[i][k - 1] + dp[k + 1][j];
        if (gain > dp[i][j]) dp[i][j] = gain;
      }
    }
  }
  return dp[1][n];
}

function factorial(n: number): number {
  let out = 1;
  for (let step = 2; step <= n; step++) out *= step;
  return out;
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const show = (values: number[]): string => \`[\${values.join(", ")}]\`;

const CASES = [
  [3, 1, 5, 8],
  [1, 5],
  [2, 4, 6],
  [9, 1, 1, 9],
  [1, 2, 3, 4, 5],
];

console.log(padEnd("balloons", 20) + pad("orders", 8) + pad("last burst", 12) + pad("first burst", 13) + pad("every order", 13));
for (const values of CASES) {
  console.log(
    padEnd(show(values), 20) + pad(factorial(values.length), 8) + pad(lastBurst(values), 12) +
      pad(firstBurst(values), 13) + pad(brute(values), 13)
  );
}
console.log();

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const TRIALS = 3000;
let lastOk = 0;
let firstOk = 0;
let firstOver = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(5);
  const values = Array.from({ length: n }, () => 1 + rand(9));
  const truth = brute(values);
  if (lastBurst(values) === truth) lastOk++;
  const guess = firstBurst(values);
  if (guess === truth) firstOk++;
  if (guess > truth) firstOver++;
}

console.log(\`over \${TRIALS} random rows of 2 to 6 balloons, against every burst order:\`);
console.log("  choosing the last balloon in the interval    " + pad(lastOk, 6));
console.log("  choosing the first balloon in the interval   " + pad(firstOk, 6));
console.log();
console.log("and the wrong one claimed a score higher than any real order allows on");
console.log(\`\${firstOver} of them, which is the giveaway: it is adding up gains from two\`);
console.log("halves that could never have been collected in the same run.");
console.log();
console.log("the recurrence is the same size either way. What differs is whether the");
console.log("two sides of the split are independent once the split is made.");
`,
            },
            {
              lang: "java",
              code: `// Bursting balloons, which is the interval pattern's other half: choosing the
// right end of the interval to reason about.
//
// Bursting balloon k earns its value times its two current neighbours, and then
// the neighbours close up. The obvious recurrence asks which balloon to burst
// *first* in an interval, and it is wrong -- once the first one is gone the two
// halves share a boundary that has moved, so they are not independent
// subproblems. Asking which balloon is burst *last* makes them independent,
// because that balloon's neighbours are then exactly the interval's own edges.
import java.util.ArrayList;
import java.util.List;

public class Main {
    // Try every order of bursting. The definition, at factorial cost.
    static long brute(int[] values) {
        List<Integer> remaining = new ArrayList<>();
        for (int v : values) remaining.add(v);
        return best(remaining);
    }

    static long best(List<Integer> remaining) {
        if (remaining.isEmpty()) return 0;
        long top = 0;
        for (int k = 0; k < remaining.size(); k++) {
            int left = k > 0 ? remaining.get(k - 1) : 1;
            int right = k + 1 < remaining.size() ? remaining.get(k + 1) : 1;
            long gain = (long) left * remaining.get(k) * right;
            List<Integer> rest = new ArrayList<>(remaining);
            rest.remove(k);
            long total = gain + best(rest);
            if (total > top) top = total;
        }
        return top;
    }

    // dp[i][j] = best from interval i..j, choosing which balloon bursts last.
    static long lastBurst(int[] values) {
        int n = values.length;
        int[] pad = new int[n + 2];
        pad[0] = 1;
        pad[n + 1] = 1;
        for (int i = 0; i < n; i++) pad[i + 1] = values[i];
        long[][] dp = new long[n + 2][n + 2];
        for (int length = 1; length <= n; length++) {
            for (int i = 1; i + length <= n + 1; i++) {
                int j = i + length - 1;
                for (int k = i; k <= j; k++) {
                    // k is last, so its neighbours are the interval's own edges.
                    long gain = (long) pad[i - 1] * pad[k] * pad[j + 1] + dp[i][k - 1] + dp[k + 1][j];
                    if (gain > dp[i][j]) dp[i][j] = gain;
                }
            }
        }
        return dp[1][n];
    }

    // The same shape, choosing which balloon bursts first. Not a valid split.
    static long firstBurst(int[] values) {
        int n = values.length;
        int[] pad = new int[n + 2];
        pad[0] = 1;
        pad[n + 1] = 1;
        for (int i = 0; i < n; i++) pad[i + 1] = values[i];
        long[][] dp = new long[n + 2][n + 2];
        for (int length = 1; length <= n; length++) {
            for (int i = 1; i + length <= n + 1; i++) {
                int j = i + length - 1;
                for (int k = i; k <= j; k++) {
                    // k is first, so its neighbours are whatever is next to it now.
                    long gain = (long) pad[k - 1] * pad[k] * pad[k + 1] + dp[i][k - 1] + dp[k + 1][j];
                    if (gain > dp[i][j]) dp[i][j] = gain;
                }
            }
        }
        return dp[1][n];
    }

    static long factorial(int n) {
        long out = 1;
        for (int step = 2; step <= n; step++) out *= step;
        return out;
    }

    static String show(int[] values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(values[i]);
        }
        return sb.append("]").toString();
    }

    static String padEnd(Object v, int w) {
        StringBuilder sb = new StringBuilder(String.valueOf(v));
        while (sb.length() < w) sb.append(' ');
        return sb.toString();
    }

    static String pad(Object v, int w) {
        StringBuilder sb = new StringBuilder(String.valueOf(v));
        while (sb.length() < w) sb.insert(0, ' ');
        return sb.toString();
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        int[][] cases = {
            {3, 1, 5, 8},
            {1, 5},
            {2, 4, 6},
            {9, 1, 1, 9},
            {1, 2, 3, 4, 5},
        };

        System.out.println(padEnd("balloons", 20) + pad("orders", 8) + pad("last burst", 12)
            + pad("first burst", 13) + pad("every order", 13));
        for (int[] values : cases) {
            System.out.println(padEnd(show(values), 20) + pad(factorial(values.length), 8)
                + pad(lastBurst(values), 12) + pad(firstBurst(values), 13) + pad(brute(values), 13));
        }
        System.out.println();

        int trials = 3000;
        int lastOk = 0, firstOk = 0, firstOver = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(5);
            int[] values = new int[n];
            for (int i = 0; i < n; i++) values[i] = 1 + rand(9);
            long truth = brute(values);
            if (lastBurst(values) == truth) lastOk++;
            long guess = firstBurst(values);
            if (guess == truth) firstOk++;
            if (guess > truth) firstOver++;
        }

        System.out.println("over " + trials + " random rows of 2 to 6 balloons, against every burst order:");
        System.out.println("  choosing the last balloon in the interval    " + pad(lastOk, 6));
        System.out.println("  choosing the first balloon in the interval   " + pad(firstOk, 6));
        System.out.println();
        System.out.println("and the wrong one claimed a score higher than any real order allows on");
        System.out.println(firstOver + " of them, which is the giveaway: it is adding up gains from two");
        System.out.println("halves that could never have been collected in the same run.");
        System.out.println();
        System.out.println("the recurrence is the same size either way. What differs is whether the");
        System.out.println("two sides of the split are independent once the split is made.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Bursting balloons, which is the interval pattern's other half: choosing the
// right end of the interval to reason about.
//
// Bursting balloon k earns its value times its two current neighbours, and then
// the neighbours close up. The obvious recurrence asks which balloon to burst
// *first* in an interval, and it is wrong -- once the first one is gone the two
// halves share a boundary that has moved, so they are not independent
// subproblems. Asking which balloon is burst *last* makes them independent,
// because that balloon's neighbours are then exactly the interval's own edges.
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

// Try every order of bursting. The definition, at factorial cost.
std::int64_t best(const std::vector<int> &remaining) {
    if (remaining.empty()) return 0;
    std::int64_t top = 0;
    for (size_t k = 0; k < remaining.size(); k++) {
        int left = k > 0 ? remaining[k - 1] : 1;
        int right = k + 1 < remaining.size() ? remaining[k + 1] : 1;
        std::int64_t gain = static_cast<std::int64_t>(left) * remaining[k] * right;
        std::vector<int> rest;
        for (size_t i = 0; i < remaining.size(); i++) {
            if (i != k) rest.push_back(remaining[i]);
        }
        std::int64_t total = gain + best(rest);
        if (total > top) top = total;
    }
    return top;
}

std::int64_t brute(const std::vector<int> &values) { return best(values); }

std::vector<int> padded(const std::vector<int> &values) {
    std::vector<int> pad;
    pad.push_back(1);
    for (int v : values) pad.push_back(v);
    pad.push_back(1);
    return pad;
}

// dp[i][j] = best from interval i..j, choosing which balloon bursts last.
std::int64_t lastBurst(const std::vector<int> &values) {
    std::vector<int> pad = padded(values);
    int n = static_cast<int>(values.size());
    std::vector<std::vector<std::int64_t>> dp(n + 2, std::vector<std::int64_t>(n + 2, 0));
    for (int length = 1; length <= n; length++) {
        for (int i = 1; i + length <= n + 1; i++) {
            int j = i + length - 1;
            for (int k = i; k <= j; k++) {
                // k is last, so its neighbours are the interval's own edges.
                std::int64_t gain = static_cast<std::int64_t>(pad[i - 1]) * pad[k] * pad[j + 1]
                    + dp[i][k - 1] + dp[k + 1][j];
                if (gain > dp[i][j]) dp[i][j] = gain;
            }
        }
    }
    return dp[1][n];
}

// The same shape, choosing which balloon bursts first. Not a valid split.
std::int64_t firstBurst(const std::vector<int> &values) {
    std::vector<int> pad = padded(values);
    int n = static_cast<int>(values.size());
    std::vector<std::vector<std::int64_t>> dp(n + 2, std::vector<std::int64_t>(n + 2, 0));
    for (int length = 1; length <= n; length++) {
        for (int i = 1; i + length <= n + 1; i++) {
            int j = i + length - 1;
            for (int k = i; k <= j; k++) {
                // k is first, so its neighbours are whatever is next to it now.
                std::int64_t gain = static_cast<std::int64_t>(pad[k - 1]) * pad[k] * pad[k + 1]
                    + dp[i][k - 1] + dp[k + 1][j];
                if (gain > dp[i][j]) dp[i][j] = gain;
            }
        }
    }
    return dp[1][n];
}

std::int64_t factorial(int n) {
    std::int64_t out = 1;
    for (int step = 2; step <= n; step++) out *= step;
    return out;
}

std::string show(const std::vector<int> &values) {
    std::string out = "[";
    for (size_t i = 0; i < values.size(); i++) {
        if (i > 0) out += ", ";
        out += std::to_string(values[i]);
    }
    return out + "]";
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    const std::vector<std::vector<int>> cases = {
        {3, 1, 5, 8},
        {1, 5},
        {2, 4, 6},
        {9, 1, 1, 9},
        {1, 2, 3, 4, 5},
    };

    std::cout << std::left << std::setw(20) << "balloons" << std::right << std::setw(8) << "orders"
              << std::setw(12) << "last burst" << std::setw(13) << "first burst"
              << std::setw(13) << "every order" << "\\n";
    for (const auto &values : cases) {
        std::cout << std::left << std::setw(20) << show(values) << std::right
                  << std::setw(8) << factorial(static_cast<int>(values.size()))
                  << std::setw(12) << lastBurst(values) << std::setw(13) << firstBurst(values)
                  << std::setw(13) << brute(values) << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 3000;
    int lastOk = 0, firstOk = 0, firstOver = 0;
    for (int t = 0; t < TRIALS; t++) {
        int n = 2 + rnd(5);
        std::vector<int> values(n);
        for (int i = 0; i < n; i++) values[i] = 1 + rnd(9);
        std::int64_t truth = brute(values);
        if (lastBurst(values) == truth) lastOk++;
        std::int64_t guess = firstBurst(values);
        if (guess == truth) firstOk++;
        if (guess > truth) firstOver++;
    }

    std::cout << "over " << TRIALS << " random rows of 2 to 6 balloons, against every burst order:\\n";
    std::cout << "  choosing the last balloon in the interval    " << std::setw(6) << lastOk << "\\n";
    std::cout << "  choosing the first balloon in the interval   " << std::setw(6) << firstOk << "\\n\\n";
    std::cout << "and the wrong one claimed a score higher than any real order allows on\\n";
    std::cout << firstOver << " of them, which is the giveaway: it is adding up gains from two\\n";
    std::cout << "halves that could never have been collected in the same run.\\n\\n";
    std::cout << "the recurrence is the same size either way. What differs is whether the\\n";
    std::cout << "two sides of the split are independent once the split is made.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// Bursting balloons, which is the interval pattern's other half: choosing the
// right end of the interval to reason about.
//
// Bursting balloon k earns its value times its two current neighbours, and then
// the neighbours close up. The obvious recurrence asks which balloon to burst
// *first* in an interval, and it is wrong -- once the first one is gone the two
// halves share a boundary that has moved, so they are not independent
// subproblems. Asking which balloon is burst *last* makes them independent,
// because that balloon's neighbours are then exactly the interval's own edges.

/// Try every order of bursting. The definition, at factorial cost.
fn best(remaining: &[i64]) -> i64 {
    if remaining.is_empty() {
        return 0;
    }
    let mut top = 0;
    for k in 0..remaining.len() {
        let left = if k > 0 { remaining[k - 1] } else { 1 };
        let right = if k + 1 < remaining.len() { remaining[k + 1] } else { 1 };
        let gain = left * remaining[k] * right;
        let mut rest: Vec<i64> = Vec::with_capacity(remaining.len() - 1);
        rest.extend_from_slice(&remaining[..k]);
        rest.extend_from_slice(&remaining[k + 1..]);
        let total = gain + best(&rest);
        if total > top {
            top = total;
        }
    }
    top
}

fn brute(values: &[i64]) -> i64 {
    best(values)
}

fn padded(values: &[i64]) -> Vec<i64> {
    let mut pad = vec![1];
    pad.extend_from_slice(values);
    pad.push(1);
    pad
}

/// dp[i][j] = best from interval i..j, choosing which balloon bursts last.
fn last_burst(values: &[i64]) -> i64 {
    let pad = padded(values);
    let n = values.len();
    let mut dp = vec![vec![0i64; n + 2]; n + 2];
    for length in 1..=n {
        for i in 1..=(n + 1 - length) {
            let j = i + length - 1;
            for k in i..=j {
                // k is last, so its neighbours are the interval's own edges.
                let gain = pad[i - 1] * pad[k] * pad[j + 1] + dp[i][k - 1] + dp[k + 1][j];
                if gain > dp[i][j] {
                    dp[i][j] = gain;
                }
            }
        }
    }
    dp[1][n]
}

/// The same shape, choosing which balloon bursts first. Not a valid split.
fn first_burst(values: &[i64]) -> i64 {
    let pad = padded(values);
    let n = values.len();
    let mut dp = vec![vec![0i64; n + 2]; n + 2];
    for length in 1..=n {
        for i in 1..=(n + 1 - length) {
            let j = i + length - 1;
            for k in i..=j {
                // k is first, so its neighbours are whatever is next to it now.
                let gain = pad[k - 1] * pad[k] * pad[k + 1] + dp[i][k - 1] + dp[k + 1][j];
                if gain > dp[i][j] {
                    dp[i][j] = gain;
                }
            }
        }
    }
    dp[1][n]
}

fn factorial(n: usize) -> i64 {
    (2..=n as i64).product::<i64>().max(1)
}

fn show(values: &[i64]) -> String {
    let parts: Vec<String> = values.iter().map(|v| v.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

struct Rng {
    seed: i64,
}

impl Rng {
    fn next(&mut self, n: i64) -> i64 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        self.seed / 65536 % n
    }
}

fn main() {
    let cases: Vec<Vec<i64>> = vec![
        vec![3, 1, 5, 8],
        vec![1, 5],
        vec![2, 4, 6],
        vec![9, 1, 1, 9],
        vec![1, 2, 3, 4, 5],
    ];

    println!(
        "{:<20}{:>8}{:>12}{:>13}{:>13}",
        "balloons", "orders", "last burst", "first burst", "every order"
    );
    for values in &cases {
        println!(
            "{:<20}{:>8}{:>12}{:>13}{:>13}",
            show(values),
            factorial(values.len()),
            last_burst(values),
            first_burst(values),
            brute(values)
        );
    }
    println!();

    let trials = 3000;
    let mut rng = Rng { seed: 1 };
    let (mut last_ok, mut first_ok, mut first_over) = (0, 0, 0);
    for _ in 0..trials {
        let n = 2 + rng.next(5);
        let values: Vec<i64> = (0..n).map(|_| 1 + rng.next(9)).collect();
        let truth = brute(&values);
        if last_burst(&values) == truth {
            last_ok += 1;
        }
        let guess = first_burst(&values);
        if guess == truth {
            first_ok += 1;
        }
        if guess > truth {
            first_over += 1;
        }
    }

    println!("over {} random rows of 2 to 6 balloons, against every burst order:", trials);
    println!("  choosing the last balloon in the interval    {:>6}", last_ok);
    println!("  choosing the first balloon in the interval   {:>6}", first_ok);
    println!();
    println!("and the wrong one claimed a score higher than any real order allows on");
    println!("{} of them, which is the giveaway: it is adding up gains from two", first_over);
    println!("halves that could never have been collected in the same run.");
    println!();
    println!("the recurrence is the same size either way. What differs is whether the");
    println!("two sides of the split are independent once the split is made.");
}
`,
            },
            {
              lang: "go",
              code: `// Bursting balloons, which is the interval pattern's other half: choosing the
// right end of the interval to reason about.
//
// Bursting balloon k earns its value times its two current neighbours, and then
// the neighbours close up. The obvious recurrence asks which balloon to burst
// *first* in an interval, and it is wrong -- once the first one is gone the two
// halves share a boundary that has moved, so they are not independent
// subproblems. Asking which balloon is burst *last* makes them independent,
// because that balloon's neighbours are then exactly the interval's own edges.
package main

import (
	"fmt"
	"strconv"
	"strings"
)

// best tries every order of bursting. The definition, at factorial cost.
func best(remaining []int) int64 {
	if len(remaining) == 0 {
		return 0
	}
	var top int64
	for k := range remaining {
		left, right := 1, 1
		if k > 0 {
			left = remaining[k-1]
		}
		if k+1 < len(remaining) {
			right = remaining[k+1]
		}
		gain := int64(left) * int64(remaining[k]) * int64(right)
		rest := make([]int, 0, len(remaining)-1)
		rest = append(rest, remaining[:k]...)
		rest = append(rest, remaining[k+1:]...)
		if total := gain + best(rest); total > top {
			top = total
		}
	}
	return top
}

func brute(values []int) int64 { return best(append([]int(nil), values...)) }

func padded(values []int) []int {
	pad := make([]int, len(values)+2)
	pad[0] = 1
	pad[len(values)+1] = 1
	copy(pad[1:], values)
	return pad
}

func emptyTable(n int) [][]int64 {
	dp := make([][]int64, n+2)
	for i := range dp {
		dp[i] = make([]int64, n+2)
	}
	return dp
}

// lastBurst gives dp[i][j] = best from interval i..j, choosing which balloon bursts last.
func lastBurst(values []int) int64 {
	pad := padded(values)
	n := len(values)
	dp := emptyTable(n)
	for length := 1; length <= n; length++ {
		for i := 1; i+length <= n+1; i++ {
			j := i + length - 1
			for k := i; k <= j; k++ {
				// k is last, so its neighbours are the interval's own edges.
				gain := int64(pad[i-1])*int64(pad[k])*int64(pad[j+1]) + dp[i][k-1] + dp[k+1][j]
				if gain > dp[i][j] {
					dp[i][j] = gain
				}
			}
		}
	}
	return dp[1][n]
}

// firstBurst is the same shape, choosing which balloon bursts first. Not a valid split.
func firstBurst(values []int) int64 {
	pad := padded(values)
	n := len(values)
	dp := emptyTable(n)
	for length := 1; length <= n; length++ {
		for i := 1; i+length <= n+1; i++ {
			j := i + length - 1
			for k := i; k <= j; k++ {
				// k is first, so its neighbours are whatever is next to it now.
				gain := int64(pad[k-1])*int64(pad[k])*int64(pad[k+1]) + dp[i][k-1] + dp[k+1][j]
				if gain > dp[i][j] {
					dp[i][j] = gain
				}
			}
		}
	}
	return dp[1][n]
}

func factorial(n int) int64 {
	var out int64 = 1
	for step := 2; step <= n; step++ {
		out *= int64(step)
	}
	return out
}

func show(values []int) string {
	parts := make([]string, len(values))
	for i, v := range values {
		parts[i] = strconv.Itoa(v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	cases := [][]int{
		{3, 1, 5, 8},
		{1, 5},
		{2, 4, 6},
		{9, 1, 1, 9},
		{1, 2, 3, 4, 5},
	}

	fmt.Printf("%-20s%8s%12s%13s%13s\\n", "balloons", "orders", "last burst", "first burst", "every order")
	for _, values := range cases {
		fmt.Printf("%-20s%8d%12d%13d%13d\\n", show(values), factorial(len(values)),
			lastBurst(values), firstBurst(values), brute(values))
	}
	fmt.Println()

	trials := 3000
	lastOk, firstOk, firstOver := 0, 0, 0
	for t := 0; t < trials; t++ {
		n := 2 + rand(5)
		values := make([]int, n)
		for i := range values {
			values[i] = 1 + rand(9)
		}
		truth := brute(values)
		if lastBurst(values) == truth {
			lastOk++
		}
		guess := firstBurst(values)
		if guess == truth {
			firstOk++
		}
		if guess > truth {
			firstOver++
		}
	}

	fmt.Printf("over %d random rows of 2 to 6 balloons, against every burst order:\\n", trials)
	fmt.Printf("  choosing the last balloon in the interval    %6d\\n", lastOk)
	fmt.Printf("  choosing the first balloon in the interval   %6d\\n", firstOk)
	fmt.Println()
	fmt.Println("and the wrong one claimed a score higher than any real order allows on")
	fmt.Printf("%d of them, which is the giveaway: it is adding up gains from two\\n", firstOver)
	fmt.Println("halves that could never have been collected in the same run.")
	fmt.Println()
	fmt.Println("the recurrence is the same size either way. What differs is whether the")
	fmt.Println("two sides of the split are independent once the split is made.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "A split is only a transition if the halves are independent after it",
          body: "Bursting the first balloon in a range makes the two remaining halves adjacent, so each half's boundary depends on the other. The recurrence still compiles and still returns a number: 166 correct out of 3,000. Say what each side's boundaries are before accepting a split.",
        },
        {
          title: "An answer that is too large is a structural signal",
          body: "The first-balloon formulation reported a score no real burst order can reach on 1,315 of 3,000 trials. Whenever a maximising table beats the brute force, the cause is usually that it is adding contributions from two subproblems that could not both have happened.",
        },
        {
          title: "Reversing the question is the standard repair",
          body: "Reasoning about the last event rather than the first fixes the boundaries at the interval's own edges. The same move appears in removing boxes, merging stones, and cutting a stick \u2014 if the obvious end makes the halves interact, try the other one before concluding that the problem is not an interval problem.",
        },
      ],
    },
    {
      id: "the-fill-order",
      heading: "The fill order stops being obvious",
      body: [
        "The third thing is mechanical and it is where most interval implementations actually break: the fill order.",
        "An interval recurrence reads `dp[i+1][j-1]`, `dp[i+1][j]` and `dp[i][j-1]` \u2014 and the first two are on a *later* row. The row-major sweep that every grid problem in the previous lesson used would read them before they were written. Nothing complains: those cells hold zero, and zero is a plausible value for \"the best over an empty range\".",
        "There are two orders that work. Filling by increasing interval length is the one to reach for, because it says what it means \u2014 every shorter interval is finished before any longer one starts. Sweeping `i` downwards with `j` upwards works too, and is the same order traversed differently: row `i + 1` is complete before row `i` begins.",
        "The example runs the same longest-palindromic-subsequence recurrence in all three orders. By length: 3,000 out of 3,000. `i` descending: 3,000. `i` ascending: 967, wrong on the other 2,033, and always too small rather than too large, because the cells it reads early hold zero and zero is the smallest a run can be.",
        "On `racecar` the two correct orders say 7 and the row-major one says 2. That is not a subtle numerical difference; it is the answer for a two-character interval, because that is as far as the correct information ever propagated. The reason it survives at all is that the wrong number is still in range and still increases with the input, which is what a plausible bug looks like.",
        "So: the loop order has to be a topological order of the dependency graph, the compiler will not check it, and the way to be sure is to name the three cells the recurrence reads and confirm each is finished. The picture below is worth more than that sentence \u2014 the table fills diagonal by diagonal from the main diagonal outwards, and the cell being written always reaches down and to the left.",
      ],
      examples: [
        {
          id: "three-loop-orders",
          title: "One recurrence, three loop orders, two of them right",
          lang: "python",
          code: `# One interval recurrence, three loop orders. Two of them are right.
#
# Interval tables are where fill order stops being obvious. dp[i][j] depends on
# dp[i+1][j-1], dp[i+1][j] and dp[i][j-1] -- one of which is on a *later* row --
# so the row-major sweep that every grid problem uses reads cells that have not
# been computed. It does not crash and it does not warn: those cells hold zero,
# which is a perfectly plausible answer.


def by_length(text):
    """Increasing interval length: every shorter interval is already done."""
    n = len(text)
    dp = [[0] * n for _ in range(n)]
    for i in range(n):
        dp[i][i] = 1
    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            if text[i] == text[j]:
                inner = dp[i + 1][j - 1] if i + 1 <= j - 1 else 0
                dp[i][j] = inner + 2
            else:
                dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])
    return dp[0][n - 1] if n else 0


def rows_backwards(text):
    """i descending, j ascending: row i + 1 is complete before row i starts."""
    n = len(text)
    dp = [[0] * n for _ in range(n)]
    for i in range(n - 1, -1, -1):
        dp[i][i] = 1
        for j in range(i + 1, n):
            if text[i] == text[j]:
                inner = dp[i + 1][j - 1] if i + 1 <= j - 1 else 0
                dp[i][j] = inner + 2
            else:
                dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])
    return dp[0][n - 1] if n else 0


def rows_forwards(text):
    """i ascending: the same recurrence, reading row i + 1 before it exists."""
    n = len(text)
    dp = [[0] * n for _ in range(n)]
    for i in range(n):
        dp[i][i] = 1
        for j in range(i + 1, n):
            if text[i] == text[j]:
                inner = dp[i + 1][j - 1] if i + 1 <= j - 1 else 0
                dp[i][j] = inner + 2
            else:
                dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])
    return dp[0][n - 1] if n else 0


def brute(text):
    """Every subsequence, checked for being a palindrome."""
    best = 0
    for mask in range(1 << len(text)):
        picked = "".join(text[i] for i in range(len(text)) if mask >> i & 1)
        if picked == picked[::-1] and len(picked) > best:
            best = len(picked)
    return best


CASES = ["bbbab", "cbbd", "agbdba", "abcd", "aa", "racecar"]

print(f"{'text':<12}{'by length':>11}{'i descending':>14}{'i ascending':>13}{'every subsequence':>19}")
for text in CASES:
    print(f"{text:<12}{by_length(text):>11}{rows_backwards(text):>14}"
          f"{rows_forwards(text):>13}{brute(text):>19}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


ALPHABET = "abc"
TRIALS = 3000
length_ok = 0
backwards_ok = 0
forwards_ok = 0
forwards_under = 0
for _ in range(TRIALS):
    n = 1 + rand(8)
    text = "".join(ALPHABET[rand(len(ALPHABET))] for _ in range(n))
    truth = brute(text)
    if by_length(text) == truth:
        length_ok += 1
    if rows_backwards(text) == truth:
        backwards_ok += 1
    guess = rows_forwards(text)
    if guess == truth:
        forwards_ok += 1
    if guess < truth:
        forwards_under += 1

print(f"over {TRIALS} random strings over three letters, against every subsequence:")
print(f"  filled by increasing interval length   {length_ok:>6}")
print(f"  filled with i descending               {backwards_ok:>6}")
print(f"  filled with i ascending                {forwards_ok:>6}")
print()
print(f"the third one was too small on {forwards_under} of them and never too large, because")
print("the cells it reads early are zero and zero is the smallest a run can be.")
print()
print("no compiler and no type system objects to any of the three. What separates")
print("them is whether the loop order is a topological order of the dependencies,")
print("which is a property of the recurrence and has to be checked by hand.")
`,
          output: `text          by length  i descending  i ascending  every subsequence
bbbab                 4             4            2                  4
cbbd                  2             2            1                  2
agbdba                5             5            2                  5
abcd                  1             1            1                  1
aa                    2             2            2                  2
racecar               7             7            2                  7

over 3000 random strings over three letters, against every subsequence:
  filled by increasing interval length     3000
  filled with i descending                 3000
  filled with i ascending                   967

the third one was too small on 2033 of them and never too large, because
the cells it reads early are zero and zero is the smallest a run can be.

no compiler and no type system objects to any of the three. What separates
them is whether the loop order is a topological order of the dependencies,
which is a property of the recurrence and has to be checked by hand.`,
          explanation:
            "One recurrence, three loop orders, scored against enumerating every subsequence. Two orders are topological and one is not, and the one that is not fails quietly, always downwards, because uninitialised cells hold zero.",
          alternates: [
            {
              lang: "javascript",
              code: `// One interval recurrence, three loop orders. Two of them are right.
//
// Interval tables are where fill order stops being obvious. dp[i][j] depends on
// dp[i+1][j-1], dp[i+1][j] and dp[i][j-1] -- one of which is on a *later* row --
// so the row-major sweep that every grid problem uses reads cells that have not
// been computed. It does not crash and it does not warn: those cells hold zero,
// which is a perfectly plausible answer.

const empty = (n) => Array.from({ length: n }, () => new Array(n).fill(0));

/** Increasing interval length: every shorter interval is already done. */
function byLength(text) {
  const n = text.length;
  const dp = empty(n);
  for (let i = 0; i < n; i++) dp[i][i] = 1;
  for (let length = 2; length <= n; length++) {
    for (let i = 0; i + length <= n; i++) {
      const j = i + length - 1;
      if (text[i] === text[j]) {
        const inner = i + 1 <= j - 1 ? dp[i + 1][j - 1] : 0;
        dp[i][j] = inner + 2;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
      }
    }
  }
  return n ? dp[0][n - 1] : 0;
}

/** i descending, j ascending: row i + 1 is complete before row i starts. */
function rowsBackwards(text) {
  const n = text.length;
  const dp = empty(n);
  for (let i = n - 1; i >= 0; i--) {
    dp[i][i] = 1;
    for (let j = i + 1; j < n; j++) {
      if (text[i] === text[j]) {
        const inner = i + 1 <= j - 1 ? dp[i + 1][j - 1] : 0;
        dp[i][j] = inner + 2;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
      }
    }
  }
  return n ? dp[0][n - 1] : 0;
}

/** i ascending: the same recurrence, reading row i + 1 before it exists. */
function rowsForwards(text) {
  const n = text.length;
  const dp = empty(n);
  for (let i = 0; i < n; i++) {
    dp[i][i] = 1;
    for (let j = i + 1; j < n; j++) {
      if (text[i] === text[j]) {
        const inner = i + 1 <= j - 1 ? dp[i + 1][j - 1] : 0;
        dp[i][j] = inner + 2;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
      }
    }
  }
  return n ? dp[0][n - 1] : 0;
}

/** Every subsequence, checked for being a palindrome. */
function brute(text) {
  let best = 0;
  for (let mask = 0; mask < 1 << text.length; mask++) {
    let picked = "";
    for (let i = 0; i < text.length; i++) {
      if ((mask >> i) & 1) picked += text[i];
    }
    const reversed = [...picked].reverse().join("");
    if (picked === reversed && picked.length > best) best = picked.length;
  }
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

const CASES = ["bbbab", "cbbd", "agbdba", "abcd", "aa", "racecar"];

console.log(padEnd("text", 12) + pad("by length", 11) + pad("i descending", 14) + pad("i ascending", 13) + pad("every subsequence", 19));
for (const text of CASES) {
  console.log(
    padEnd(text, 12) + pad(byLength(text), 11) + pad(rowsBackwards(text), 14) +
      pad(rowsForwards(text), 13) + pad(brute(text), 19)
  );
}
console.log();

const ALPHABET = "abc";
const TRIALS = 3000;
let lengthOk = 0;
let backwardsOk = 0;
let forwardsOk = 0;
let forwardsUnder = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 1 + rand(8);
  let text = "";
  for (let i = 0; i < n; i++) text += ALPHABET[rand(ALPHABET.length)];
  const truth = brute(text);
  if (byLength(text) === truth) lengthOk++;
  if (rowsBackwards(text) === truth) backwardsOk++;
  const guess = rowsForwards(text);
  if (guess === truth) forwardsOk++;
  if (guess < truth) forwardsUnder++;
}

console.log(\`over \${TRIALS} random strings over three letters, against every subsequence:\`);
console.log("  filled by increasing interval length   " + pad(lengthOk, 6));
console.log("  filled with i descending               " + pad(backwardsOk, 6));
console.log("  filled with i ascending                " + pad(forwardsOk, 6));
console.log();
console.log(\`the third one was too small on \${forwardsUnder} of them and never too large, because\`);
console.log("the cells it reads early are zero and zero is the smallest a run can be.");
console.log();
console.log("no compiler and no type system objects to any of the three. What separates");
console.log("them is whether the loop order is a topological order of the dependencies,");
console.log("which is a property of the recurrence and has to be checked by hand.");
`,
            },
            {
              lang: "typescript",
              code: `// One interval recurrence, three loop orders. Two of them are right.
//
// Interval tables are where fill order stops being obvious. dp[i][j] depends on
// dp[i+1][j-1], dp[i+1][j] and dp[i][j-1] -- one of which is on a *later* row --
// so the row-major sweep that every grid problem uses reads cells that have not
// been computed. It does not crash and it does not warn: those cells hold zero,
// which is a perfectly plausible answer.

const empty = (n: number): number[][] => Array.from({ length: n }, () => new Array(n).fill(0));

/** Increasing interval length: every shorter interval is already done. */
function byLength(text: string): number {
  const n = text.length;
  const dp = empty(n);
  for (let i = 0; i < n; i++) dp[i][i] = 1;
  for (let length = 2; length <= n; length++) {
    for (let i = 0; i + length <= n; i++) {
      const j = i + length - 1;
      if (text[i] === text[j]) {
        const inner = i + 1 <= j - 1 ? dp[i + 1][j - 1] : 0;
        dp[i][j] = inner + 2;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
      }
    }
  }
  return n ? dp[0][n - 1] : 0;
}

/** i descending, j ascending: row i + 1 is complete before row i starts. */
function rowsBackwards(text: string): number {
  const n = text.length;
  const dp = empty(n);
  for (let i = n - 1; i >= 0; i--) {
    dp[i][i] = 1;
    for (let j = i + 1; j < n; j++) {
      if (text[i] === text[j]) {
        const inner = i + 1 <= j - 1 ? dp[i + 1][j - 1] : 0;
        dp[i][j] = inner + 2;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
      }
    }
  }
  return n ? dp[0][n - 1] : 0;
}

/** i ascending: the same recurrence, reading row i + 1 before it exists. */
function rowsForwards(text: string): number {
  const n = text.length;
  const dp = empty(n);
  for (let i = 0; i < n; i++) {
    dp[i][i] = 1;
    for (let j = i + 1; j < n; j++) {
      if (text[i] === text[j]) {
        const inner = i + 1 <= j - 1 ? dp[i + 1][j - 1] : 0;
        dp[i][j] = inner + 2;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
      }
    }
  }
  return n ? dp[0][n - 1] : 0;
}

/** Every subsequence, checked for being a palindrome. */
function brute(text: string): number {
  let best = 0;
  for (let mask = 0; mask < 1 << text.length; mask++) {
    let picked = "";
    for (let i = 0; i < text.length; i++) {
      if ((mask >> i) & 1) picked += text[i];
    }
    const reversed = [...picked].reverse().join("");
    if (picked === reversed && picked.length > best) best = picked.length;
  }
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

const CASES = ["bbbab", "cbbd", "agbdba", "abcd", "aa", "racecar"];

console.log(padEnd("text", 12) + pad("by length", 11) + pad("i descending", 14) + pad("i ascending", 13) + pad("every subsequence", 19));
for (const text of CASES) {
  console.log(
    padEnd(text, 12) + pad(byLength(text), 11) + pad(rowsBackwards(text), 14) +
      pad(rowsForwards(text), 13) + pad(brute(text), 19)
  );
}
console.log();

const ALPHABET = "abc";
const TRIALS = 3000;
let lengthOk = 0;
let backwardsOk = 0;
let forwardsOk = 0;
let forwardsUnder = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 1 + rand(8);
  let text = "";
  for (let i = 0; i < n; i++) text += ALPHABET[rand(ALPHABET.length)];
  const truth = brute(text);
  if (byLength(text) === truth) lengthOk++;
  if (rowsBackwards(text) === truth) backwardsOk++;
  const guess = rowsForwards(text);
  if (guess === truth) forwardsOk++;
  if (guess < truth) forwardsUnder++;
}

console.log(\`over \${TRIALS} random strings over three letters, against every subsequence:\`);
console.log("  filled by increasing interval length   " + pad(lengthOk, 6));
console.log("  filled with i descending               " + pad(backwardsOk, 6));
console.log("  filled with i ascending                " + pad(forwardsOk, 6));
console.log();
console.log(\`the third one was too small on \${forwardsUnder} of them and never too large, because\`);
console.log("the cells it reads early are zero and zero is the smallest a run can be.");
console.log();
console.log("no compiler and no type system objects to any of the three. What separates");
console.log("them is whether the loop order is a topological order of the dependencies,");
console.log("which is a property of the recurrence and has to be checked by hand.");
`,
            },
            {
              lang: "java",
              code: `// One interval recurrence, three loop orders. Two of them are right.
//
// Interval tables are where fill order stops being obvious. dp[i][j] depends on
// dp[i+1][j-1], dp[i+1][j] and dp[i][j-1] -- one of which is on a *later* row --
// so the row-major sweep that every grid problem uses reads cells that have not
// been computed. It does not crash and it does not warn: those cells hold zero,
// which is a perfectly plausible answer.

public class Main {
    // Increasing interval length: every shorter interval is already done.
    static int byLength(String text) {
        int n = text.length();
        int[][] dp = new int[n][n];
        for (int i = 0; i < n; i++) dp[i][i] = 1;
        for (int length = 2; length <= n; length++) {
            for (int i = 0; i + length <= n; i++) {
                int j = i + length - 1;
                if (text.charAt(i) == text.charAt(j)) {
                    int inner = i + 1 <= j - 1 ? dp[i + 1][j - 1] : 0;
                    dp[i][j] = inner + 2;
                } else {
                    dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
                }
            }
        }
        return n > 0 ? dp[0][n - 1] : 0;
    }

    // i descending, j ascending: row i + 1 is complete before row i starts.
    static int rowsBackwards(String text) {
        int n = text.length();
        int[][] dp = new int[n][n];
        for (int i = n - 1; i >= 0; i--) {
            dp[i][i] = 1;
            for (int j = i + 1; j < n; j++) {
                if (text.charAt(i) == text.charAt(j)) {
                    int inner = i + 1 <= j - 1 ? dp[i + 1][j - 1] : 0;
                    dp[i][j] = inner + 2;
                } else {
                    dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
                }
            }
        }
        return n > 0 ? dp[0][n - 1] : 0;
    }

    // i ascending: the same recurrence, reading row i + 1 before it exists.
    static int rowsForwards(String text) {
        int n = text.length();
        int[][] dp = new int[n][n];
        for (int i = 0; i < n; i++) {
            dp[i][i] = 1;
            for (int j = i + 1; j < n; j++) {
                if (text.charAt(i) == text.charAt(j)) {
                    int inner = i + 1 <= j - 1 ? dp[i + 1][j - 1] : 0;
                    dp[i][j] = inner + 2;
                } else {
                    dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
                }
            }
        }
        return n > 0 ? dp[0][n - 1] : 0;
    }

    // Every subsequence, checked for being a palindrome.
    static int brute(String text) {
        int best = 0;
        for (int mask = 0; mask < 1 << text.length(); mask++) {
            StringBuilder picked = new StringBuilder();
            for (int i = 0; i < text.length(); i++) {
                if ((mask >> i & 1) == 1) picked.append(text.charAt(i));
            }
            String forward = picked.toString();
            String reversed = picked.reverse().toString();
            if (forward.equals(reversed) && forward.length() > best) best = forward.length();
        }
        return best;
    }

    static String padEnd(Object v, int w) {
        StringBuilder sb = new StringBuilder(String.valueOf(v));
        while (sb.length() < w) sb.append(' ');
        return sb.toString();
    }

    static String pad(Object v, int w) {
        StringBuilder sb = new StringBuilder(String.valueOf(v));
        while (sb.length() < w) sb.insert(0, ' ');
        return sb.toString();
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        String[] cases = {"bbbab", "cbbd", "agbdba", "abcd", "aa", "racecar"};

        System.out.println(padEnd("text", 12) + pad("by length", 11) + pad("i descending", 14)
            + pad("i ascending", 13) + pad("every subsequence", 19));
        for (String text : cases) {
            System.out.println(padEnd(text, 12) + pad(byLength(text), 11) + pad(rowsBackwards(text), 14)
                + pad(rowsForwards(text), 13) + pad(brute(text), 19));
        }
        System.out.println();

        String alphabet = "abc";
        int trials = 3000;
        int lengthOk = 0, backwardsOk = 0, forwardsOk = 0, forwardsUnder = 0;
        for (int t = 0; t < trials; t++) {
            int n = 1 + rand(8);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < n; i++) sb.append(alphabet.charAt(rand(alphabet.length())));
            String text = sb.toString();
            int truth = brute(text);
            if (byLength(text) == truth) lengthOk++;
            if (rowsBackwards(text) == truth) backwardsOk++;
            int guess = rowsForwards(text);
            if (guess == truth) forwardsOk++;
            if (guess < truth) forwardsUnder++;
        }

        System.out.println("over " + trials + " random strings over three letters, against every subsequence:");
        System.out.println("  filled by increasing interval length   " + pad(lengthOk, 6));
        System.out.println("  filled with i descending               " + pad(backwardsOk, 6));
        System.out.println("  filled with i ascending                " + pad(forwardsOk, 6));
        System.out.println();
        System.out.println("the third one was too small on " + forwardsUnder
            + " of them and never too large, because");
        System.out.println("the cells it reads early are zero and zero is the smallest a run can be.");
        System.out.println();
        System.out.println("no compiler and no type system objects to any of the three. What separates");
        System.out.println("them is whether the loop order is a topological order of the dependencies,");
        System.out.println("which is a property of the recurrence and has to be checked by hand.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// One interval recurrence, three loop orders. Two of them are right.
//
// Interval tables are where fill order stops being obvious. dp[i][j] depends on
// dp[i+1][j-1], dp[i+1][j] and dp[i][j-1] -- one of which is on a *later* row --
// so the row-major sweep that every grid problem uses reads cells that have not
// been computed. It does not crash and it does not warn: those cells hold zero,
// which is a perfectly plausible answer.
#include <algorithm>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

std::vector<std::vector<int>> empty(int n) {
    return std::vector<std::vector<int>>(n, std::vector<int>(n, 0));
}

// Increasing interval length: every shorter interval is already done.
int byLength(const std::string &text) {
    int n = static_cast<int>(text.size());
    auto dp = empty(n);
    for (int i = 0; i < n; i++) dp[i][i] = 1;
    for (int length = 2; length <= n; length++) {
        for (int i = 0; i + length <= n; i++) {
            int j = i + length - 1;
            if (text[i] == text[j]) {
                int inner = i + 1 <= j - 1 ? dp[i + 1][j - 1] : 0;
                dp[i][j] = inner + 2;
            } else {
                dp[i][j] = std::max(dp[i + 1][j], dp[i][j - 1]);
            }
        }
    }
    return n > 0 ? dp[0][n - 1] : 0;
}

// i descending, j ascending: row i + 1 is complete before row i starts.
int rowsBackwards(const std::string &text) {
    int n = static_cast<int>(text.size());
    auto dp = empty(n);
    for (int i = n - 1; i >= 0; i--) {
        dp[i][i] = 1;
        for (int j = i + 1; j < n; j++) {
            if (text[i] == text[j]) {
                int inner = i + 1 <= j - 1 ? dp[i + 1][j - 1] : 0;
                dp[i][j] = inner + 2;
            } else {
                dp[i][j] = std::max(dp[i + 1][j], dp[i][j - 1]);
            }
        }
    }
    return n > 0 ? dp[0][n - 1] : 0;
}

// i ascending: the same recurrence, reading row i + 1 before it exists.
int rowsForwards(const std::string &text) {
    int n = static_cast<int>(text.size());
    auto dp = empty(n);
    for (int i = 0; i < n; i++) {
        dp[i][i] = 1;
        for (int j = i + 1; j < n; j++) {
            if (text[i] == text[j]) {
                int inner = i + 1 <= j - 1 ? dp[i + 1][j - 1] : 0;
                dp[i][j] = inner + 2;
            } else {
                dp[i][j] = std::max(dp[i + 1][j], dp[i][j - 1]);
            }
        }
    }
    return n > 0 ? dp[0][n - 1] : 0;
}

// Every subsequence, checked for being a palindrome.
int brute(const std::string &text) {
    int best = 0;
    for (int mask = 0; mask < 1 << static_cast<int>(text.size()); mask++) {
        std::string picked;
        for (size_t i = 0; i < text.size(); i++) {
            if (mask >> i & 1) picked += text[i];
        }
        std::string reversed(picked.rbegin(), picked.rend());
        if (picked == reversed && static_cast<int>(picked.size()) > best) {
            best = static_cast<int>(picked.size());
        }
    }
    return best;
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    const std::vector<std::string> cases = {"bbbab", "cbbd", "agbdba", "abcd", "aa", "racecar"};

    std::cout << std::left << std::setw(12) << "text" << std::right << std::setw(11) << "by length"
              << std::setw(14) << "i descending" << std::setw(13) << "i ascending"
              << std::setw(19) << "every subsequence" << "\\n";
    for (const std::string &text : cases) {
        std::cout << std::left << std::setw(12) << text << std::right
                  << std::setw(11) << byLength(text) << std::setw(14) << rowsBackwards(text)
                  << std::setw(13) << rowsForwards(text) << std::setw(19) << brute(text) << "\\n";
    }
    std::cout << "\\n";

    const std::string alphabet = "abc";
    const int TRIALS = 3000;
    int lengthOk = 0, backwardsOk = 0, forwardsOk = 0, forwardsUnder = 0;
    for (int t = 0; t < TRIALS; t++) {
        int n = 1 + rnd(8);
        std::string text;
        for (int i = 0; i < n; i++) text += alphabet[rnd(static_cast<int>(alphabet.size()))];
        int truth = brute(text);
        if (byLength(text) == truth) lengthOk++;
        if (rowsBackwards(text) == truth) backwardsOk++;
        int guess = rowsForwards(text);
        if (guess == truth) forwardsOk++;
        if (guess < truth) forwardsUnder++;
    }

    std::cout << "over " << TRIALS << " random strings over three letters, against every subsequence:\\n";
    std::cout << "  filled by increasing interval length   " << std::setw(6) << lengthOk << "\\n";
    std::cout << "  filled with i descending               " << std::setw(6) << backwardsOk << "\\n";
    std::cout << "  filled with i ascending                " << std::setw(6) << forwardsOk << "\\n\\n";
    std::cout << "the third one was too small on " << forwardsUnder
              << " of them and never too large, because\\n";
    std::cout << "the cells it reads early are zero and zero is the smallest a run can be.\\n\\n";
    std::cout << "no compiler and no type system objects to any of the three. What separates\\n";
    std::cout << "them is whether the loop order is a topological order of the dependencies,\\n";
    std::cout << "which is a property of the recurrence and has to be checked by hand.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// One interval recurrence, three loop orders. Two of them are right.
//
// Interval tables are where fill order stops being obvious. dp[i][j] depends on
// dp[i+1][j-1], dp[i+1][j] and dp[i][j-1] -- one of which is on a *later* row --
// so the row-major sweep that every grid problem uses reads cells that have not
// been computed. It does not crash and it does not warn: those cells hold zero,
// which is a perfectly plausible answer.

fn empty(n: usize) -> Vec<Vec<i32>> {
    vec![vec![0; n]; n]
}

/// Increasing interval length: every shorter interval is already done.
fn by_length(text: &[u8]) -> i32 {
    let n = text.len();
    let mut dp = empty(n);
    for i in 0..n {
        dp[i][i] = 1;
    }
    for length in 2..=n {
        for i in 0..=(n - length) {
            let j = i + length - 1;
            if text[i] == text[j] {
                let inner = if i + 1 <= j - 1 { dp[i + 1][j - 1] } else { 0 };
                dp[i][j] = inner + 2;
            } else {
                dp[i][j] = dp[i + 1][j].max(dp[i][j - 1]);
            }
        }
    }
    if n == 0 { 0 } else { dp[0][n - 1] }
}

/// i descending, j ascending: row i + 1 is complete before row i starts.
fn rows_backwards(text: &[u8]) -> i32 {
    let n = text.len();
    let mut dp = empty(n);
    for i in (0..n).rev() {
        dp[i][i] = 1;
        for j in (i + 1)..n {
            if text[i] == text[j] {
                let inner = if i + 1 <= j - 1 { dp[i + 1][j - 1] } else { 0 };
                dp[i][j] = inner + 2;
            } else {
                dp[i][j] = dp[i + 1][j].max(dp[i][j - 1]);
            }
        }
    }
    if n == 0 { 0 } else { dp[0][n - 1] }
}

/// i ascending: the same recurrence, reading row i + 1 before it exists.
fn rows_forwards(text: &[u8]) -> i32 {
    let n = text.len();
    let mut dp = empty(n);
    for i in 0..n {
        dp[i][i] = 1;
        for j in (i + 1)..n {
            if text[i] == text[j] {
                let inner = if i + 1 <= j - 1 { dp[i + 1][j - 1] } else { 0 };
                dp[i][j] = inner + 2;
            } else {
                dp[i][j] = dp[i + 1][j].max(dp[i][j - 1]);
            }
        }
    }
    if n == 0 { 0 } else { dp[0][n - 1] }
}

/// Every subsequence, checked for being a palindrome.
fn brute(text: &[u8]) -> i32 {
    let mut best = 0;
    for mask in 0..(1u32 << text.len()) {
        let picked: Vec<u8> = (0..text.len())
            .filter(|&i| mask >> i & 1 == 1)
            .map(|i| text[i])
            .collect();
        let reversed: Vec<u8> = picked.iter().rev().copied().collect();
        if picked == reversed && picked.len() as i32 > best {
            best = picked.len() as i32;
        }
    }
    best
}

struct Rng {
    seed: i64,
}

impl Rng {
    fn next(&mut self, n: i64) -> i64 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        self.seed / 65536 % n
    }
}

fn main() {
    let cases = ["bbbab", "cbbd", "agbdba", "abcd", "aa", "racecar"];

    println!(
        "{:<12}{:>11}{:>14}{:>13}{:>19}",
        "text", "by length", "i descending", "i ascending", "every subsequence"
    );
    for text in cases {
        let bytes = text.as_bytes();
        println!(
            "{:<12}{:>11}{:>14}{:>13}{:>19}",
            text,
            by_length(bytes),
            rows_backwards(bytes),
            rows_forwards(bytes),
            brute(bytes)
        );
    }
    println!();

    let alphabet = b"abc";
    let trials = 3000;
    let mut rng = Rng { seed: 1 };
    let (mut length_ok, mut backwards_ok, mut forwards_ok, mut forwards_under) = (0, 0, 0, 0);
    for _ in 0..trials {
        let n = 1 + rng.next(8);
        let text: Vec<u8> = (0..n).map(|_| alphabet[rng.next(3) as usize]).collect();
        let truth = brute(&text);
        if by_length(&text) == truth {
            length_ok += 1;
        }
        if rows_backwards(&text) == truth {
            backwards_ok += 1;
        }
        let guess = rows_forwards(&text);
        if guess == truth {
            forwards_ok += 1;
        }
        if guess < truth {
            forwards_under += 1;
        }
    }

    println!("over {} random strings over three letters, against every subsequence:", trials);
    println!("  filled by increasing interval length   {:>6}", length_ok);
    println!("  filled with i descending               {:>6}", backwards_ok);
    println!("  filled with i ascending                {:>6}", forwards_ok);
    println!();
    println!("the third one was too small on {} of them and never too large, because", forwards_under);
    println!("the cells it reads early are zero and zero is the smallest a run can be.");
    println!();
    println!("no compiler and no type system objects to any of the three. What separates");
    println!("them is whether the loop order is a topological order of the dependencies,");
    println!("which is a property of the recurrence and has to be checked by hand.");
}
`,
            },
            {
              lang: "go",
              code: `// One interval recurrence, three loop orders. Two of them are right.
//
// Interval tables are where fill order stops being obvious. dp[i][j] depends on
// dp[i+1][j-1], dp[i+1][j] and dp[i][j-1] -- one of which is on a *later* row --
// so the row-major sweep that every grid problem uses reads cells that have not
// been computed. It does not crash and it does not warn: those cells hold zero,
// which is a perfectly plausible answer.
package main

import (
	"fmt"
	"strings"
)

func empty(n int) [][]int {
	dp := make([][]int, n)
	for i := range dp {
		dp[i] = make([]int, n)
	}
	return dp
}

func larger(a, b int) int {
	if a > b {
		return a
	}
	return b
}

// byLength fills by increasing interval length: every shorter interval is already done.
func byLength(text string) int {
	n := len(text)
	dp := empty(n)
	for i := 0; i < n; i++ {
		dp[i][i] = 1
	}
	for length := 2; length <= n; length++ {
		for i := 0; i+length <= n; i++ {
			j := i + length - 1
			if text[i] == text[j] {
				inner := 0
				if i+1 <= j-1 {
					inner = dp[i+1][j-1]
				}
				dp[i][j] = inner + 2
			} else {
				dp[i][j] = larger(dp[i+1][j], dp[i][j-1])
			}
		}
	}
	if n == 0 {
		return 0
	}
	return dp[0][n-1]
}

// rowsBackwards runs i descending, j ascending: row i + 1 is complete before row i starts.
func rowsBackwards(text string) int {
	n := len(text)
	dp := empty(n)
	for i := n - 1; i >= 0; i-- {
		dp[i][i] = 1
		for j := i + 1; j < n; j++ {
			if text[i] == text[j] {
				inner := 0
				if i+1 <= j-1 {
					inner = dp[i+1][j-1]
				}
				dp[i][j] = inner + 2
			} else {
				dp[i][j] = larger(dp[i+1][j], dp[i][j-1])
			}
		}
	}
	if n == 0 {
		return 0
	}
	return dp[0][n-1]
}

// rowsForwards runs i ascending: the same recurrence, reading row i + 1 before it exists.
func rowsForwards(text string) int {
	n := len(text)
	dp := empty(n)
	for i := 0; i < n; i++ {
		dp[i][i] = 1
		for j := i + 1; j < n; j++ {
			if text[i] == text[j] {
				inner := 0
				if i+1 <= j-1 {
					inner = dp[i+1][j-1]
				}
				dp[i][j] = inner + 2
			} else {
				dp[i][j] = larger(dp[i+1][j], dp[i][j-1])
			}
		}
	}
	if n == 0 {
		return 0
	}
	return dp[0][n-1]
}

// brute checks every subsequence for being a palindrome.
func brute(text string) int {
	best := 0
	for mask := 0; mask < 1<<len(text); mask++ {
		var picked strings.Builder
		for i := 0; i < len(text); i++ {
			if mask>>i&1 == 1 {
				picked.WriteByte(text[i])
			}
		}
		forward := picked.String()
		reversed := make([]byte, len(forward))
		for i := 0; i < len(forward); i++ {
			reversed[len(forward)-1-i] = forward[i]
		}
		if forward == string(reversed) && len(forward) > best {
			best = len(forward)
		}
	}
	return best
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	cases := []string{"bbbab", "cbbd", "agbdba", "abcd", "aa", "racecar"}

	fmt.Printf("%-12s%11s%14s%13s%19s\\n", "text", "by length", "i descending", "i ascending",
		"every subsequence")
	for _, text := range cases {
		fmt.Printf("%-12s%11d%14d%13d%19d\\n", text, byLength(text), rowsBackwards(text),
			rowsForwards(text), brute(text))
	}
	fmt.Println()

	alphabet := "abc"
	trials := 3000
	lengthOk, backwardsOk, forwardsOk, forwardsUnder := 0, 0, 0, 0
	for t := 0; t < trials; t++ {
		n := 1 + rand(8)
		var sb strings.Builder
		for i := 0; i < n; i++ {
			sb.WriteByte(alphabet[rand(len(alphabet))])
		}
		text := sb.String()
		truth := brute(text)
		if byLength(text) == truth {
			lengthOk++
		}
		if rowsBackwards(text) == truth {
			backwardsOk++
		}
		guess := rowsForwards(text)
		if guess == truth {
			forwardsOk++
		}
		if guess < truth {
			forwardsUnder++
		}
	}

	fmt.Printf("over %d random strings over three letters, against every subsequence:\\n", trials)
	fmt.Printf("  filled by increasing interval length   %6d\\n", lengthOk)
	fmt.Printf("  filled with i descending               %6d\\n", backwardsOk)
	fmt.Printf("  filled with i ascending                %6d\\n", forwardsOk)
	fmt.Println()
	fmt.Printf("the third one was too small on %d of them and never too large, because\\n", forwardsUnder)
	fmt.Println("the cells it reads early are zero and zero is the smallest a run can be.")
	fmt.Println()
	fmt.Println("no compiler and no type system objects to any of the three. What separates")
	fmt.Println("them is whether the loop order is a topological order of the dependencies,")
	fmt.Println("which is a property of the recurrence and has to be checked by hand.")
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "dp-interval-diagonals",
        kind: "dp",
        algorithm: "interval",
        title: "An interval table filling diagonal by diagonal",
        lockAlgorithm: true,
      },
      pitfalls: [
        {
          title: "Row-major order is not a valid fill order for intervals",
          body: "`dp[i][j]` reads `dp[i+1][j-1]` and `dp[i+1][j]`, which are on a later row. Sweeping i upwards reads them as zero and produced the wrong answer on 2,033 of 3,000 strings, always too small. Fill by increasing interval length, or sweep i downwards.",
        },
        {
          title: "The wrong fill order fails quietly and plausibly",
          body: "It does not crash, does not read out of bounds, and returns a number that still grows with the input \u2014 on `racecar` it says 2 where the answer is 7. Nothing in the type system or the compiler distinguishes a valid loop order from an invalid one; the check is naming the cells the recurrence reads and confirming each is already written.",
        },
      ],
    },
    {
      id: "the-shape",
      heading: "The shape, and what identifies it",
      body: [
        "The shape, and the questions that identify it.",
        "**The state is a contiguous range.** Two indices that are the ends of a run, not two independent positions \u2014 which is why the table is triangular and half of it is never touched.",
        "**The transition is a split point, chosen from inside the range.** That is what makes the work cubic rather than quadratic: `O(n^2)` states with `O(n)` choices each.",
        "**Check that the two sides are independent after the split**, and if they are not, try the other end. Last rather than first, outermost rather than innermost \u2014 the reversal that makes the boundaries fixed is the standard move, and it is the whole trick in burst balloons, and in problems about removing boxes or merging stones.",
        "**Fill by increasing length.** Or sweep `i` downwards; nothing else is a topological order, and the failure is silent.",
        "Problems in this family that are worth recognising: matrix chain, burst balloons, minimum cost to merge stones or cut a stick, optimal binary search trees, longest palindromic subsequence and substring, palindrome partitioning, and the game-theory row problems where two players alternately take from either end. All of them are a range and a split; what differs is what the split costs and which end you reason from.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Explain matrix chain multiplication and why greedy fails on it.",
      answer:
        "The product is the same however you bracket the chain but the cost is not, so the state is \"matrices i through j\" and the transition is where the outermost multiplication splits that range. For a split at k, the two sides collapse to single matrices independently of each other, and the final product then costs dims[i] * dims[k+1] * dims[j+1] regardless of what happened inside either side \u2014 that independence is what makes it a valid transition. O(n^2) intervals with O(n) splits each gives O(n^3), against a Catalan number of bracketings. Greedy \u2014 always multiply the cheapest adjacent pair \u2014 was right on 1,363 of 3,000 random chains and on its worst case spent 55,654 multiplications against the optimal 5,874. There is no exchange argument available, because a pair's immediate cost says nothing about what the rest of the chain will then cost.",
    },
    {
      question: "Burst balloons: why is the recurrence written around the last balloon rather than the first?",
      answer:
        "Because bursting the first one makes the two halves adjacent. Once k is gone, the left half's right-hand neighbour is a balloon in the right half, so the two subproblems' answers depend on each other and the split is not a transition. If k is instead the last balloon burst in the interval, everything on both sides has already gone when k bursts, so its neighbours are the interval's own outer edges \u2014 fixed and known. Now the halves really are independent. Measured against every burst order on 3,000 random rows, the last-balloon version is right 3,000 times and the first-balloon one 166, and on 1,315 of them the wrong version reports a score higher than any real order can achieve, because it is summing gains from two halves that could not both have happened.",
    },
    {
      question: "What order do you fill an interval table in, and what happens if you get it wrong?",
      answer:
        "By increasing interval length, or equivalently with i sweeping downwards and j upwards. A cell reads dp[i+1][j-1], dp[i+1][j] and dp[i][j-1], and the first two are on a later row, so the row-major order that works for grid problems reads them before they are written. What happens then is nothing visible: those cells hold zero, no bounds are violated, and the function returns a plausible number. On longest palindromic subsequence over 3,000 random strings the row-major version was right 967 times, wrong 2,033, and always too small \u2014 on `racecar` it returns 2 where the answer is 7. The check is to name the cells the recurrence reads and confirm each is already finished; the loop order has to be a topological order of that dependency graph and nothing in the language enforces it.",
    },
    {
      question: "How do you recognise an interval problem in the first place?",
      answer:
        "Two signals. The first is that the state wants to be a contiguous range rather than a prefix: the answer for a segment depends on both of its ends, so one index is not enough and two independent positions is too many. The second is that the decision is a split \u2014 some element or boundary inside the range is chosen, and it separates the range into two smaller ranges of the same kind. Chains of matrices, palindromes, merging adjacent piles, cutting a stick at chosen points, two players taking from either end: all of them are a range plus a split. Once you see that shape, the two things left to settle are which end to reason from, so the halves are independent, and the fill order, which has to go shortest interval first.",
    },
  ],
  takeaways: [
    "The state is a contiguous range, so the table is triangular and half of it is never used.",
    "The transition is a split chosen from inside the range, which is what makes the work `O(n^3)`.",
    "Matrix chain: the table was right on all 3,000 chains; the cheapest-adjacent-pair greedy on 1,363, spending ten times the optimal cost at its worst.",
    "A split is a transition only if the two halves are independent afterwards.",
    "Burst balloons has to reason about the last balloon, not the first: 3,000 correct against 166.",
    "A maximising table that beats brute force is summing subproblems that could not both have happened \u2014 it did so on 1,315 of 3,000 trials here.",
    "Interval tables fill by increasing length, or with `i` descending. Row-major reads cells that do not exist yet.",
    "That wrong order was right 967 times out of 3,000 and always too small, because the cells it reads early hold zero.",
  ],
  status: "available",
};
