import type { Lesson } from "@/content/types";

export const constraintsBackwardsLesson: Lesson = {
  id: "dsa-pattern-atlas-constraints-backwards",
  slug: "constraints-backwards",
  moduleSlug: "pattern-atlas-drills",
  title: "Reading the Constraints Backwards",
  summary:
    "The two lines at the bottom of the statement are an instruction about which algorithm is wanted, and reading them takes ten seconds. The arithmetic behind that instruction, worked out exactly rather than remembered approximately.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Convert a stated limit on `n` into a target complexity",
    "Recite the four constraint bands that carry almost all the signal",
    "Recognise a limit that is telling you the brute force is the answer",
    "Spot the constraints that are about something other than time",
  ],
  sections: [
    {
      id: "the-instruction-at-the-bottom",
      heading: "The instruction at the bottom",
      body: [
        "Every statement ends with something like `1 <= n <= 200000`. It reads like housekeeping. It is the single most informative line in the problem.",
        "The reasoning is one step long. A time limit is worth roughly a hundred million simple operations. Your algorithm's operation count is some function of `n`. If you know `n`, you know which functions fit \u2014 and because the growth rates are so far apart, you do not need the hundred million to be accurate. A factor of ten either way almost never changes the answer.",
        "The example does the arithmetic exactly. For each growth rate it finds the largest `n` whose count is still inside the budget, by counting rather than by timing, and then reads the same table the other way: given a stated limit, which growth rates survive.",
        "The four rows worth memorising are in the output, and they are: `n <= 20` means exponential is expected. `n <= 1000` means quadratic is fine. `n <= 100,000` rules quadratic out \u2014 a hundred thousand squared is a hundred times the budget \u2014 and asks for `n log n` or better. `n <= 1,000,000` usually means linear.",
        "Read it before you start solving. The cost of not reading it is symmetric and both directions hurt: you build something too slow and find out at submission, or you spend twenty minutes finding an `n log n` answer to a problem where `n <= 100` and the brute force was the intended solution.",
      ],
      examples: [
        {
          id: "constraints-to-complexity",
          title: "What a budget buys, and what a stated limit permits",
          lang: "python",
          code: `# Reading the constraints backwards, and checking the arithmetic.
#
# A problem statement's constraints are not decoration. "1 <= n <= 200" and
# "1 <= n <= 200000" are instructions about which algorithm is wanted, and the
# instruction is legible if you know roughly how many basic operations fit in
# the time limit. A second is worth somewhere around 100 million simple
# operations in a compiled language -- the number is soft, and the conclusions
# it leads to are not, because the complexity classes are so far apart that a
# factor of ten either way rarely changes which one fits.
#
# Nothing below is timed. It is arithmetic: for each growth rate, the largest
# n whose operation count stays inside a budget, worked out by counting.
BUDGET = 100_000_000


def factorial(n):
    total = 1
    for i in range(2, n + 1):
        total *= i
        if total > 10 ** 18:
            return 10 ** 18
    return total


def cost(kind, n):
    """The operation count for one growth rate at one size. Exact, not timed."""
    if kind == "n!":
        return factorial(n)
    if kind == "2^n":
        return 2 ** n if n < 64 else 10 ** 18
    if kind == "n^3":
        return n * n * n
    if kind == "n^2":
        return n * n
    if kind == "n*sqrt(n)":
        root = 0
        while (root + 1) * (root + 1) <= n:
            root += 1
        return n * root
    if kind == "n log n":
        bits = 0
        while (1 << (bits + 1)) <= n:
            bits += 1
        return n * max(bits, 1)
    if kind == "n":
        return n
    return 1


KINDS = ["n!", "2^n", "n^3", "n^2", "n*sqrt(n)", "n log n", "n"]


def largest_fitting(kind):
    """The largest n whose count is still inside the budget.

    Binary search rather than a scan, because the answer for O(n) is the
    budget itself and counting up to it would take as long as the budget
    describes.
    """
    low, high = 1, BUDGET
    while low < high:
        mid = (low + high + 1) // 2
        if cost(kind, mid) <= BUDGET:
            low = mid
        else:
            high = mid - 1
    return low


print("a budget of %d operations buys you:" % BUDGET)
print("%-11s %14s %20s %20s" % ("growth", "largest n", "cost at that n", "cost one bigger"))
for kind in KINDS:
    n = largest_fitting(kind)
    print("%-11s %14d %20d %20d" % (kind, n, cost(kind, n), cost(kind, n + 1)))

# And the reading in the other direction: a constraint in the statement, and
# what it rules in.
LIMITS = [10, 20, 100, 1000, 100_000, 1_000_000]

print()
print("and read the other way -- what a stated limit permits:")
print("%-12s %s" % ("n <=", "growth rates that stay inside the budget"))
for limit in LIMITS:
    fits = [kind for kind in KINDS if cost(kind, limit) <= BUDGET]
    print("%-12d %s" % (limit, ", ".join(fits) if fits else "none of these"))

print()
print("The table is the whole skill, and it is worth memorising the four rows")
print("that carry almost all the signal.")
print()
print("n <= 20 or so means exponential is expected -- 2^n over subsets, or")
print("a permutation search. Nothing polynomial would need a limit that small,")
print("so the small limit is the hint.")
print()
print("n <= 1000 or a few thousand means quadratic is fine, which usually")
print("means a pair of nested loops over the input, or an O(n^2) table.")
print()
print("n <= 100,000 and up rules quadratic out. %d squared is %d," % (
    100_000, 100_000 * 100_000))
print("which is %d times over budget, so the statement is asking for n log n" % (
    100_000 * 100_000 // BUDGET))
print("or better. That is the most common constraint in interview problems,")
print("and it is telling you to sort, or to use a hash map, or to sweep once")
print("with two pointers.")
print()
print("n <= 1,000,000 usually means linear, and often means the intended")
print("solution reads the input once and keeps O(1) or O(n) state.")
print()
print("Read this before you start solving, not after. The difference between")
print("the two is whether you spend twenty minutes finding an n log n answer")
print("to a problem where n <= 100 and the brute force was the point.")
`,
          output: `a budget of 100000000 operations buys you:
growth           largest n       cost at that n      cost one bigger
n!                      11             39916800            479001600
2^n                     26             67108864            134217728
n^3                    464             99897344            100544625
n^2                  10000            100000000            100020001
n*sqrt(n)           215517             99999888            100000352
n log n            4545454             99999988            100000010
n                100000000            100000000            100000001

and read the other way -- what a stated limit permits:
n <=         growth rates that stay inside the budget
10           n!, 2^n, n^3, n^2, n*sqrt(n), n log n, n
20           2^n, n^3, n^2, n*sqrt(n), n log n, n
100          n^3, n^2, n*sqrt(n), n log n, n
1000         n^2, n*sqrt(n), n log n, n
100000       n*sqrt(n), n log n, n
1000000      n log n, n

The table is the whole skill, and it is worth memorising the four rows
that carry almost all the signal.

n <= 20 or so means exponential is expected -- 2^n over subsets, or
a permutation search. Nothing polynomial would need a limit that small,
so the small limit is the hint.

n <= 1000 or a few thousand means quadratic is fine, which usually
means a pair of nested loops over the input, or an O(n^2) table.

n <= 100,000 and up rules quadratic out. 100000 squared is 10000000000,
which is 100 times over budget, so the statement is asking for n log n
or better. That is the most common constraint in interview problems,
and it is telling you to sort, or to use a hash map, or to sweep once
with two pointers.

n <= 1,000,000 usually means linear, and often means the intended
solution reads the input once and keeps O(1) or O(n) state.

Read this before you start solving, not after. The difference between
the two is whether you spend twenty minutes finding an n log n answer
to a problem where n <= 100 and the brute force was the point.`,
          explanation:
            "The same table read in both directions, computed by counting operations rather than by timing anything. The second block is the one to internalise: a limit in the statement, and the growth rates it leaves standing.",
          alternates: [
            {
              lang: "javascript",
              code: `// Reading the constraints backwards, and checking the arithmetic.
//
// A problem statement's constraints are not decoration. "1 <= n <= 200" and
// "1 <= n <= 200000" are instructions about which algorithm is wanted, and the
// instruction is legible if you know roughly how many basic operations fit in
// the time limit. A second is worth somewhere around 100 million simple
// operations in a compiled language -- the number is soft, and the conclusions
// it leads to are not, because the complexity classes are so far apart that a
// factor of ten either way rarely changes which one fits.
//
// Nothing below is timed. It is arithmetic: for each growth rate, the largest
// n whose operation count stays inside a budget, worked out by counting.
//
// JavaScript needs BigInt here because a factorial leaves 2^53 almost at once.
const BUDGET = 100000000n;
const HUGE = 10n ** 18n;

function factorial(n) {
  let total = 1n;
  for (let i = 2n; i <= BigInt(n); i += 1n) {
    total *= i;
    if (total > HUGE) return HUGE;
  }
  return total;
}

// The operation count for one growth rate at one size. Exact, not timed.
function cost(kind, n) {
  const big = BigInt(n);
  if (kind === "n!") return factorial(n);
  if (kind === "2^n") return n < 64 ? 2n ** big : HUGE;
  if (kind === "n^3") return big * big * big;
  if (kind === "n^2") return big * big;
  if (kind === "n*sqrt(n)") {
    let root = 0n;
    while ((root + 1n) * (root + 1n) <= big) root += 1n;
    return big * root;
  }
  if (kind === "n log n") {
    let bits = 0n;
    while (2n ** (bits + 1n) <= big) bits += 1n;
    return big * (bits > 1n ? bits : 1n);
  }
  if (kind === "n") return big;
  return 1n;
}

const KINDS = ["n!", "2^n", "n^3", "n^2", "n*sqrt(n)", "n log n", "n"];

// The largest n whose count is still inside the budget.
//
// Binary search rather than a scan, because the answer for O(n) is the
// budget itself and counting up to it would take as long as the budget
// describes.
function largestFitting(kind) {
  let low = 1;
  let high = Number(BUDGET);
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (cost(kind, mid) <= BUDGET) low = mid;
    else high = mid - 1;
  }
  return low;
}

console.log(\`a budget of \${BUDGET} operations buys you:\`);
console.log(
  "growth".padEnd(11) + " " + "largest n".padStart(14) + " " +
  "cost at that n".padStart(20) + " " + "cost one bigger".padStart(20),
);
for (const kind of KINDS) {
  const n = largestFitting(kind);
  console.log(
    kind.padEnd(11) + " " + String(n).padStart(14) + " " +
    String(cost(kind, n)).padStart(20) + " " + String(cost(kind, n + 1)).padStart(20),
  );
}

// And the reading in the other direction: a constraint in the statement, and
// what it rules in.
const LIMITS = [10, 20, 100, 1000, 100000, 1000000];

console.log();
console.log("and read the other way -- what a stated limit permits:");
console.log("n <=".padEnd(12) + " " + "growth rates that stay inside the budget");
for (const limit of LIMITS) {
  const fits = KINDS.filter((kind) => cost(kind, limit) <= BUDGET);
  console.log(String(limit).padEnd(12) + " " + (fits.length > 0 ? fits.join(", ") : "none of these"));
}

console.log();
console.log("The table is the whole skill, and it is worth memorising the four rows");
console.log("that carry almost all the signal.");
console.log();
console.log("n <= 20 or so means exponential is expected -- 2^n over subsets, or");
console.log("a permutation search. Nothing polynomial would need a limit that small,");
console.log("so the small limit is the hint.");
console.log();
console.log("n <= 1000 or a few thousand means quadratic is fine, which usually");
console.log("means a pair of nested loops over the input, or an O(n^2) table.");
console.log();
console.log(\`n <= 100,000 and up rules quadratic out. \${100000} squared is \${100000 * 100000},\`);
console.log(\`which is \${(100000n * 100000n) / BUDGET} times over budget, so the statement is asking for n log n\`);
console.log("or better. That is the most common constraint in interview problems,");
console.log("and it is telling you to sort, or to use a hash map, or to sweep once");
console.log("with two pointers.");
console.log();
console.log("n <= 1,000,000 usually means linear, and often means the intended");
console.log("solution reads the input once and keeps O(1) or O(n) state.");
console.log();
console.log("Read this before you start solving, not after. The difference between");
console.log("the two is whether you spend twenty minutes finding an n log n answer");
console.log("to a problem where n <= 100 and the brute force was the point.");
`,
            },
            {
              lang: "typescript",
              code: `// Reading the constraints backwards, and checking the arithmetic.
//
// A problem statement's constraints are not decoration. "1 <= n <= 200" and
// "1 <= n <= 200000" are instructions about which algorithm is wanted, and the
// instruction is legible if you know roughly how many basic operations fit in
// the time limit. A second is worth somewhere around 100 million simple
// operations in a compiled language -- the number is soft, and the conclusions
// it leads to are not, because the complexity classes are so far apart that a
// factor of ten either way rarely changes which one fits.
//
// Nothing below is timed. It is arithmetic: for each growth rate, the largest
// n whose operation count stays inside a budget, worked out by counting.
//
// JavaScript needs BigInt here because a factorial leaves 2^53 almost at once.
const BUDGET = 100000000n;
const HUGE = 10n ** 18n;

function factorial(n: number): bigint {
  let total = 1n;
  for (let i = 2n; i <= BigInt(n); i += 1n) {
    total *= i;
    if (total > HUGE) return HUGE;
  }
  return total;
}

// The operation count for one growth rate at one size. Exact, not timed.
function cost(kind: string, n: number): bigint {
  const big = BigInt(n);
  if (kind === "n!") return factorial(n);
  if (kind === "2^n") return n < 64 ? 2n ** big : HUGE;
  if (kind === "n^3") return big * big * big;
  if (kind === "n^2") return big * big;
  if (kind === "n*sqrt(n)") {
    let root = 0n;
    while ((root + 1n) * (root + 1n) <= big) root += 1n;
    return big * root;
  }
  if (kind === "n log n") {
    let bits = 0n;
    while (2n ** (bits + 1n) <= big) bits += 1n;
    return big * (bits > 1n ? bits : 1n);
  }
  if (kind === "n") return big;
  return 1n;
}

const KINDS = ["n!", "2^n", "n^3", "n^2", "n*sqrt(n)", "n log n", "n"];

// The largest n whose count is still inside the budget.
//
// Binary search rather than a scan, because the answer for O(n) is the
// budget itself and counting up to it would take as long as the budget
// describes.
function largestFitting(kind: string): number {
  let low = 1;
  let high = Number(BUDGET);
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (cost(kind, mid) <= BUDGET) low = mid;
    else high = mid - 1;
  }
  return low;
}

console.log(\`a budget of \${BUDGET} operations buys you:\`);
console.log(
  "growth".padEnd(11) + " " + "largest n".padStart(14) + " " +
  "cost at that n".padStart(20) + " " + "cost one bigger".padStart(20),
);
for (const kind of KINDS) {
  const n = largestFitting(kind);
  console.log(
    kind.padEnd(11) + " " + String(n).padStart(14) + " " +
    String(cost(kind, n)).padStart(20) + " " + String(cost(kind, n + 1)).padStart(20),
  );
}

// And the reading in the other direction: a constraint in the statement, and
// what it rules in.
const LIMITS = [10, 20, 100, 1000, 100000, 1000000];

console.log();
console.log("and read the other way -- what a stated limit permits:");
console.log("n <=".padEnd(12) + " " + "growth rates that stay inside the budget");
for (const limit of LIMITS) {
  const fits = KINDS.filter((kind) => cost(kind, limit) <= BUDGET);
  console.log(String(limit).padEnd(12) + " " + (fits.length > 0 ? fits.join(", ") : "none of these"));
}

console.log();
console.log("The table is the whole skill, and it is worth memorising the four rows");
console.log("that carry almost all the signal.");
console.log();
console.log("n <= 20 or so means exponential is expected -- 2^n over subsets, or");
console.log("a permutation search. Nothing polynomial would need a limit that small,");
console.log("so the small limit is the hint.");
console.log();
console.log("n <= 1000 or a few thousand means quadratic is fine, which usually");
console.log("means a pair of nested loops over the input, or an O(n^2) table.");
console.log();
console.log(\`n <= 100,000 and up rules quadratic out. \${100000} squared is \${100000 * 100000},\`);
console.log(\`which is \${(100000n * 100000n) / BUDGET} times over budget, so the statement is asking for n log n\`);
console.log("or better. That is the most common constraint in interview problems,");
console.log("and it is telling you to sort, or to use a hash map, or to sweep once");
console.log("with two pointers.");
console.log();
console.log("n <= 1,000,000 usually means linear, and often means the intended");
console.log("solution reads the input once and keeps O(1) or O(n) state.");
console.log();
console.log("Read this before you start solving, not after. The difference between");
console.log("the two is whether you spend twenty minutes finding an n log n answer");
console.log("to a problem where n <= 100 and the brute force was the point.");
`,
            },
            {
              lang: "java",
              code: `// Reading the constraints backwards, and checking the arithmetic.
//
// A problem statement's constraints are not decoration. "1 <= n <= 200" and
// "1 <= n <= 200000" are instructions about which algorithm is wanted, and the
// instruction is legible if you know roughly how many basic operations fit in
// the time limit. A second is worth somewhere around 100 million simple
// operations in a compiled language -- the number is soft, and the conclusions
// it leads to are not, because the complexity classes are so far apart that a
// factor of ten either way rarely changes which one fits.
//
// Nothing below is timed. It is arithmetic: for each growth rate, the largest
// n whose operation count stays inside a budget, worked out by counting.
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;

public class Main {
    static final BigInteger BUDGET = BigInteger.valueOf(100000000L);
    static final BigInteger HUGE = BigInteger.TEN.pow(18);

    static BigInteger factorial(int n) {
        BigInteger total = BigInteger.ONE;
        for (int i = 2; i <= n; i++) {
            total = total.multiply(BigInteger.valueOf(i));
            if (total.compareTo(HUGE) > 0) return HUGE;
        }
        return total;
    }

    /** The operation count for one growth rate at one size. Exact, not timed. */
    static BigInteger cost(String kind, int n) {
        BigInteger big = BigInteger.valueOf(n);
        switch (kind) {
            case "n!":
                return factorial(n);
            case "2^n":
                return n < 64 ? BigInteger.TWO.pow(n) : HUGE;
            case "n^3":
                return big.multiply(big).multiply(big);
            case "n^2":
                return big.multiply(big);
            case "n*sqrt(n)": {
                long root = 0;
                while ((root + 1) * (root + 1) <= n) root++;
                return big.multiply(BigInteger.valueOf(root));
            }
            case "n log n": {
                int bits = 0;
                while (BigInteger.TWO.pow(bits + 1).compareTo(big) <= 0) bits++;
                return big.multiply(BigInteger.valueOf(Math.max(bits, 1)));
            }
            case "n":
                return big;
            default:
                return BigInteger.ONE;
        }
    }

    static final String[] KINDS = {"n!", "2^n", "n^3", "n^2", "n*sqrt(n)", "n log n", "n"};

    /**
     * The largest n whose count is still inside the budget.
     *
     * <p>Binary search rather than a scan, because the answer for O(n) is the
     * budget itself and counting up to it would take as long as the budget
     * describes.
     */
    static int largestFitting(String kind) {
        int low = 1;
        int high = BUDGET.intValue();
        while (low < high) {
            int mid = low + (high - low + 1) / 2;
            if (cost(kind, mid).compareTo(BUDGET) <= 0) low = mid;
            else high = mid - 1;
        }
        return low;
    }

    public static void main(String[] args) {
        System.out.println("a budget of " + BUDGET + " operations buys you:");
        System.out.printf("%-11s %14s %20s %20s%n",
            "growth", "largest n", "cost at that n", "cost one bigger");
        for (String kind : KINDS) {
            int n = largestFitting(kind);
            System.out.printf("%-11s %14d %20s %20s%n", kind, n, cost(kind, n), cost(kind, n + 1));
        }

        // And the reading in the other direction: a constraint in the
        // statement, and what it rules in.
        int[] limits = {10, 20, 100, 1000, 100000, 1000000};

        System.out.println();
        System.out.println("and read the other way -- what a stated limit permits:");
        System.out.printf("%-12s %s%n", "n <=", "growth rates that stay inside the budget");
        for (int limit : limits) {
            List<String> fits = new ArrayList<>();
            for (String kind : KINDS)
                if (cost(kind, limit).compareTo(BUDGET) <= 0) fits.add(kind);
            System.out.printf("%-12d %s%n", limit,
                fits.isEmpty() ? "none of these" : String.join(", ", fits));
        }

        System.out.println();
        System.out.println("The table is the whole skill, and it is worth memorising the four rows");
        System.out.println("that carry almost all the signal.");
        System.out.println();
        System.out.println("n <= 20 or so means exponential is expected -- 2^n over subsets, or");
        System.out.println("a permutation search. Nothing polynomial would need a limit that small,");
        System.out.println("so the small limit is the hint.");
        System.out.println();
        System.out.println("n <= 1000 or a few thousand means quadratic is fine, which usually");
        System.out.println("means a pair of nested loops over the input, or an O(n^2) table.");
        System.out.println();
        System.out.println("n <= 100,000 and up rules quadratic out. " + 100000 + " squared is "
            + (100000L * 100000L) + ",");
        System.out.println("which is " + (100000L * 100000L / 100000000L)
            + " times over budget, so the statement is asking for n log n");
        System.out.println("or better. That is the most common constraint in interview problems,");
        System.out.println("and it is telling you to sort, or to use a hash map, or to sweep once");
        System.out.println("with two pointers.");
        System.out.println();
        System.out.println("n <= 1,000,000 usually means linear, and often means the intended");
        System.out.println("solution reads the input once and keeps O(1) or O(n) state.");
        System.out.println();
        System.out.println("Read this before you start solving, not after. The difference between");
        System.out.println("the two is whether you spend twenty minutes finding an n log n answer");
        System.out.println("to a problem where n <= 100 and the brute force was the point.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Reading the constraints backwards, and checking the arithmetic.
//
// A problem statement's constraints are not decoration. "1 <= n <= 200" and
// "1 <= n <= 200000" are instructions about which algorithm is wanted, and the
// instruction is legible if you know roughly how many basic operations fit in
// the time limit. A second is worth somewhere around 100 million simple
// operations in a compiled language -- the number is soft, and the conclusions
// it leads to are not, because the complexity classes are so far apart that a
// factor of ten either way rarely changes which one fits.
//
// Nothing below is timed. It is arithmetic: for each growth rate, the largest
// n whose operation count stays inside a budget, worked out by counting.
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

const long long BUDGET = 100000000LL;
// Anything past this is "far too big to matter", and stopping there keeps
// every count inside a signed 64-bit integer.
const long long HUGE_COUNT = 1000000000000000000LL;

long long factorial(int n) {
    long long total = 1;
    for (int i = 2; i <= n; i++) {
        if (total > HUGE_COUNT / i) return HUGE_COUNT;
        total *= i;
        if (total > HUGE_COUNT) return HUGE_COUNT;
    }
    return total;
}

// The operation count for one growth rate at one size. Exact, not timed.
long long cost(const std::string& kind, long long n) {
    if (kind == "n!") return factorial(static_cast<int>(n));
    if (kind == "2^n") return n < 60 ? (1LL << n) : HUGE_COUNT;
    if (kind == "n^3") {
        if (n > 1000000) return HUGE_COUNT;
        return n * n * n;
    }
    if (kind == "n^2") {
        if (n > 3000000000LL) return HUGE_COUNT;
        return n * n;
    }
    if (kind == "n*sqrt(n)") {
        long long root = 0;
        while ((root + 1) * (root + 1) <= n) root++;
        return n * root;
    }
    if (kind == "n log n") {
        long long bits = 0;
        while ((1LL << (bits + 1)) <= n) bits++;
        return n * (bits > 1 ? bits : 1);
    }
    if (kind == "n") return n;
    return 1;
}

const std::vector<std::string> KINDS = {"n!", "2^n", "n^3", "n^2", "n*sqrt(n)", "n log n", "n"};

// The largest n whose count is still inside the budget.
//
// Binary search rather than a scan, because the answer for O(n) is the budget
// itself and counting up to it would take as long as the budget describes.
long long largest_fitting(const std::string& kind) {
    long long low = 1, high = BUDGET;
    while (low < high) {
        long long mid = low + (high - low + 1) / 2;
        if (cost(kind, mid) <= BUDGET) low = mid;
        else high = mid - 1;
    }
    return low;
}

int main() {
    std::cout << "a budget of " << BUDGET << " operations buys you:\\n";
    std::cout << std::left << std::setw(11) << "growth" << " " << std::right << std::setw(14)
              << "largest n" << " " << std::setw(20) << "cost at that n" << " "
              << std::setw(20) << "cost one bigger" << "\\n";
    for (const std::string& kind : KINDS) {
        long long n = largest_fitting(kind);
        std::cout << std::left << std::setw(11) << kind << " " << std::right << std::setw(14)
                  << n << " " << std::setw(20) << cost(kind, n) << " " << std::setw(20)
                  << cost(kind, n + 1) << "\\n";
    }

    // And the reading in the other direction: a constraint in the statement,
    // and what it rules in.
    std::vector<long long> limits = {10, 20, 100, 1000, 100000, 1000000};

    std::cout << "\\n";
    std::cout << "and read the other way -- what a stated limit permits:\\n";
    std::cout << std::left << std::setw(12) << "n <=" << " "
              << "growth rates that stay inside the budget" << "\\n";
    for (long long limit : limits) {
        std::string fits;
        for (const std::string& kind : KINDS) {
            if (cost(kind, limit) <= BUDGET) {
                if (!fits.empty()) fits += ", ";
                fits += kind;
            }
        }
        std::cout << std::left << std::setw(12) << limit << " "
                  << (fits.empty() ? "none of these" : fits) << "\\n";
    }

    std::cout << "\\n";
    std::cout << "The table is the whole skill, and it is worth memorising the four rows\\n";
    std::cout << "that carry almost all the signal.\\n";
    std::cout << "\\n";
    std::cout << "n <= 20 or so means exponential is expected -- 2^n over subsets, or\\n";
    std::cout << "a permutation search. Nothing polynomial would need a limit that small,\\n";
    std::cout << "so the small limit is the hint.\\n";
    std::cout << "\\n";
    std::cout << "n <= 1000 or a few thousand means quadratic is fine, which usually\\n";
    std::cout << "means a pair of nested loops over the input, or an O(n^2) table.\\n";
    std::cout << "\\n";
    std::cout << "n <= 100,000 and up rules quadratic out. " << 100000 << " squared is "
              << (100000LL * 100000LL) << ",\\n";
    std::cout << "which is " << (100000LL * 100000LL / BUDGET)
              << " times over budget, so the statement is asking for n log n\\n";
    std::cout << "or better. That is the most common constraint in interview problems,\\n";
    std::cout << "and it is telling you to sort, or to use a hash map, or to sweep once\\n";
    std::cout << "with two pointers.\\n";
    std::cout << "\\n";
    std::cout << "n <= 1,000,000 usually means linear, and often means the intended\\n";
    std::cout << "solution reads the input once and keeps O(1) or O(n) state.\\n";
    std::cout << "\\n";
    std::cout << "Read this before you start solving, not after. The difference between\\n";
    std::cout << "the two is whether you spend twenty minutes finding an n log n answer\\n";
    std::cout << "to a problem where n <= 100 and the brute force was the point.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Reading the constraints backwards, and checking the arithmetic.
//
// A problem statement's constraints are not decoration. "1 <= n <= 200" and
// "1 <= n <= 200000" are instructions about which algorithm is wanted, and the
// instruction is legible if you know roughly how many basic operations fit in
// the time limit. A second is worth somewhere around 100 million simple
// operations in a compiled language -- the number is soft, and the conclusions
// it leads to are not, because the complexity classes are so far apart that a
// factor of ten either way rarely changes which one fits.
//
// Nothing below is timed. It is arithmetic: for each growth rate, the largest
// n whose operation count stays inside a budget, worked out by counting.
const BUDGET: i64 = 100_000_000;
/// Anything past this is "far too big to matter", and stopping there keeps
/// every count inside a signed 64-bit integer.
const HUGE_COUNT: i64 = 1_000_000_000_000_000_000;

fn factorial(n: i64) -> i64 {
    let mut total: i64 = 1;
    for i in 2..=n {
        if total > HUGE_COUNT / i {
            return HUGE_COUNT;
        }
        total *= i;
        if total > HUGE_COUNT {
            return HUGE_COUNT;
        }
    }
    total
}

/// The operation count for one growth rate at one size. Exact, not timed.
fn cost(kind: &str, n: i64) -> i64 {
    match kind {
        "n!" => factorial(n),
        "2^n" => {
            if n < 60 {
                1i64 << n
            } else {
                HUGE_COUNT
            }
        }
        "n^3" => {
            if n > 1_000_000 {
                HUGE_COUNT
            } else {
                n * n * n
            }
        }
        "n^2" => {
            if n > 3_000_000_000 {
                HUGE_COUNT
            } else {
                n * n
            }
        }
        "n*sqrt(n)" => {
            let mut root: i64 = 0;
            while (root + 1) * (root + 1) <= n {
                root += 1;
            }
            n * root
        }
        "n log n" => {
            let mut bits: i64 = 0;
            while (1i64 << (bits + 1)) <= n {
                bits += 1;
            }
            n * if bits > 1 { bits } else { 1 }
        }
        "n" => n,
        _ => 1,
    }
}

const KINDS: [&str; 7] = ["n!", "2^n", "n^3", "n^2", "n*sqrt(n)", "n log n", "n"];

/// The largest n whose count is still inside the budget.
///
/// Binary search rather than a scan, because the answer for O(n) is the
/// budget itself and counting up to it would take as long as the budget
/// describes.
fn largest_fitting(kind: &str) -> i64 {
    let (mut low, mut high) = (1i64, BUDGET);
    while low < high {
        let mid = low + (high - low + 1) / 2;
        if cost(kind, mid) <= BUDGET {
            low = mid;
        } else {
            high = mid - 1;
        }
    }
    low
}

fn main() {
    println!("a budget of {} operations buys you:", BUDGET);
    println!(
        "{:<11} {:>14} {:>20} {:>20}",
        "growth", "largest n", "cost at that n", "cost one bigger"
    );
    for kind in KINDS.iter() {
        let n = largest_fitting(kind);
        println!(
            "{:<11} {:>14} {:>20} {:>20}",
            kind,
            n,
            cost(kind, n),
            cost(kind, n + 1)
        );
    }

    // And the reading in the other direction: a constraint in the statement,
    // and what it rules in.
    let limits: [i64; 6] = [10, 20, 100, 1000, 100_000, 1_000_000];

    println!();
    println!("and read the other way -- what a stated limit permits:");
    println!("{:<12} {}", "n <=", "growth rates that stay inside the budget");
    for &limit in limits.iter() {
        let fits: Vec<&str> = KINDS
            .iter()
            .copied()
            .filter(|kind| cost(kind, limit) <= BUDGET)
            .collect();
        println!(
            "{:<12} {}",
            limit,
            if fits.is_empty() {
                "none of these".to_string()
            } else {
                fits.join(", ")
            }
        );
    }

    println!();
    println!("The table is the whole skill, and it is worth memorising the four rows");
    println!("that carry almost all the signal.");
    println!();
    println!("n <= 20 or so means exponential is expected -- 2^n over subsets, or");
    println!("a permutation search. Nothing polynomial would need a limit that small,");
    println!("so the small limit is the hint.");
    println!();
    println!("n <= 1000 or a few thousand means quadratic is fine, which usually");
    println!("means a pair of nested loops over the input, or an O(n^2) table.");
    println!();
    println!(
        "n <= 100,000 and up rules quadratic out. {} squared is {},",
        100_000,
        100_000i64 * 100_000i64
    );
    println!(
        "which is {} times over budget, so the statement is asking for n log n",
        100_000i64 * 100_000i64 / BUDGET
    );
    println!("or better. That is the most common constraint in interview problems,");
    println!("and it is telling you to sort, or to use a hash map, or to sweep once");
    println!("with two pointers.");
    println!();
    println!("n <= 1,000,000 usually means linear, and often means the intended");
    println!("solution reads the input once and keeps O(1) or O(n) state.");
    println!();
    println!("Read this before you start solving, not after. The difference between");
    println!("the two is whether you spend twenty minutes finding an n log n answer");
    println!("to a problem where n <= 100 and the brute force was the point.");
}
`,
            },
            {
              lang: "go",
              code: `// Reading the constraints backwards, and checking the arithmetic.
//
// A problem statement's constraints are not decoration. "1 <= n <= 200" and
// "1 <= n <= 200000" are instructions about which algorithm is wanted, and the
// instruction is legible if you know roughly how many basic operations fit in
// the time limit. A second is worth somewhere around 100 million simple
// operations in a compiled language -- the number is soft, and the conclusions
// it leads to are not, because the complexity classes are so far apart that a
// factor of ten either way rarely changes which one fits.
//
// Nothing below is timed. It is arithmetic: for each growth rate, the largest
// n whose operation count stays inside a budget, worked out by counting.
package main

import (
	"fmt"
	"strings"
)

const budget int64 = 100000000

// hugeCount is "far too big to matter", and stopping there keeps every count
// inside a signed 64-bit integer.
const hugeCount int64 = 1000000000000000000

func factorial(n int64) int64 {
	var total int64 = 1
	for i := int64(2); i <= n; i++ {
		if total > hugeCount/i {
			return hugeCount
		}
		total *= i
		if total > hugeCount {
			return hugeCount
		}
	}
	return total
}

// cost is the operation count for one growth rate at one size. Exact, not timed.
func cost(kind string, n int64) int64 {
	switch kind {
	case "n!":
		return factorial(n)
	case "2^n":
		if n < 60 {
			return int64(1) << uint(n)
		}
		return hugeCount
	case "n^3":
		if n > 1000000 {
			return hugeCount
		}
		return n * n * n
	case "n^2":
		if n > 3000000000 {
			return hugeCount
		}
		return n * n
	case "n*sqrt(n)":
		var root int64
		for (root+1)*(root+1) <= n {
			root++
		}
		return n * root
	case "n log n":
		var bits int64
		for (int64(1) << uint(bits+1)) <= n {
			bits++
		}
		if bits < 1 {
			bits = 1
		}
		return n * bits
	case "n":
		return n
	}
	return 1
}

var kinds = []string{"n!", "2^n", "n^3", "n^2", "n*sqrt(n)", "n log n", "n"}

// largestFitting gives the largest n whose count is still inside the budget.
//
// Binary search rather than a scan, because the answer for O(n) is the budget
// itself and counting up to it would take as long as the budget describes.
func largestFitting(kind string) int64 {
	low, high := int64(1), budget
	for low < high {
		mid := low + (high-low+1)/2
		if cost(kind, mid) <= budget {
			low = mid
		} else {
			high = mid - 1
		}
	}
	return low
}

func main() {
	fmt.Printf("a budget of %d operations buys you:\\n", budget)
	fmt.Printf("%-11s %14s %20s %20s\\n", "growth", "largest n", "cost at that n", "cost one bigger")
	for _, kind := range kinds {
		n := largestFitting(kind)
		fmt.Printf("%-11s %14d %20d %20d\\n", kind, n, cost(kind, n), cost(kind, n+1))
	}

	// And the reading in the other direction: a constraint in the statement,
	// and what it rules in.
	limits := []int64{10, 20, 100, 1000, 100000, 1000000}

	fmt.Println()
	fmt.Println("and read the other way -- what a stated limit permits:")
	fmt.Printf("%-12s %s\\n", "n <=", "growth rates that stay inside the budget")
	for _, limit := range limits {
		var fits []string
		for _, kind := range kinds {
			if cost(kind, limit) <= budget {
				fits = append(fits, kind)
			}
		}
		text := "none of these"
		if len(fits) > 0 {
			text = strings.Join(fits, ", ")
		}
		fmt.Printf("%-12d %s\\n", limit, text)
	}

	fmt.Println()
	fmt.Println("The table is the whole skill, and it is worth memorising the four rows")
	fmt.Println("that carry almost all the signal.")
	fmt.Println()
	fmt.Println("n <= 20 or so means exponential is expected -- 2^n over subsets, or")
	fmt.Println("a permutation search. Nothing polynomial would need a limit that small,")
	fmt.Println("so the small limit is the hint.")
	fmt.Println()
	fmt.Println("n <= 1000 or a few thousand means quadratic is fine, which usually")
	fmt.Println("means a pair of nested loops over the input, or an O(n^2) table.")
	fmt.Println()
	fmt.Printf("n <= 100,000 and up rules quadratic out. %d squared is %d,\\n", 100000, int64(100000)*int64(100000))
	fmt.Printf("which is %d times over budget, so the statement is asking for n log n\\n", int64(100000)*int64(100000)/budget)
	fmt.Println("or better. That is the most common constraint in interview problems,")
	fmt.Println("and it is telling you to sort, or to use a hash map, or to sweep once")
	fmt.Println("with two pointers.")
	fmt.Println()
	fmt.Println("n <= 1,000,000 usually means linear, and often means the intended")
	fmt.Println("solution reads the input once and keeps O(1) or O(n) state.")
	fmt.Println()
	fmt.Println("Read this before you start solving, not after. The difference between")
	fmt.Println("the two is whether you spend twenty minutes finding an n log n answer")
	fmt.Println("to a problem where n <= 100 and the brute force was the point.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Treating the budget as precise",
          body: "A hundred million is an order of magnitude, not a measurement, and it moves with the language, the constant factor and the machine. It does not matter: the gap between quadratic and n log n at n = 100,000 is a factor of a hundred, so being wrong about the budget by a factor of five changes nothing about which one you pick.",
        },
        {
          title: "Reading n and ignoring the other limits",
          body: "A statement often bounds two things -- the number of items and the number of queries, or n and the value range. The product is frequently the real budget. `n <= 1000` with `q <= 1000` queries is a million, not a thousand, and a per-query linear scan is exactly on the line.",
        },
        {
          title: "Assuming a small limit means the problem is easy",
          body: "It usually means the opposite. `n <= 20` is the constraint of a problem whose intended solution is exponential -- a subset enumeration or a bitmask DP -- because nothing polynomial would need a limit that small. The small number is telling you the answer is expensive, not that the problem is.",
        },
      ],
    },
    {
      id: "limits-that-are-not-about-time",
      heading: "Limits that are not about time",
      body: [
        "Not every constraint is a complexity hint, and mistaking one kind for the other is a recognition failure of its own.",
        "**A bound on the values** rather than on their number is usually about a structure. `0 <= a[i] <= 100` invites counting sort, a frequency array, or a bitmask over a hundred bits. `a[i]` fits in 32 bits invites bit tricks. When the value range is small and stated, it is stated for a reason.",
        "**A bound that is suspiciously specific** \u2014 at most 26 distinct characters, at most 10 colours, coordinates on a 1000-by-1000 grid \u2014 is naming the size of a state you are meant to enumerate. Twenty-six suggests a bitmask over letters. Ten suggests `2^10` subsets.",
        "**A memory limit** is doing the same job for space. If `n` is a million and the limit is small, an `n`-by-`n` table is out and you are being pushed towards a rolling row or an in-place transformation.",
        "**Guarantees phrased as constraints** are the easiest to miss because they read like reassurance. \"The array is sorted.\" \"All values are distinct.\" \"The graph is connected.\" \"There is exactly one answer.\" Each of those removes a case you would otherwise have to handle, and each is usually load-bearing for the intended solution. \"Sorted\" is not a courtesy; it is the reason binary search or two pointers is available at all.",
      ],
      pitfalls: [
        {
          title: "Skipping the guarantees because they sound like flavour text",
          body: "\"All values are distinct\" is the line that makes a two-pointer sweep unambiguous, and \"the graph is connected\" is the line that says you do not need to loop over components. If a guarantee is stated, the intended solution almost certainly uses it -- and if your solution does not, you are probably solving a harder problem than the one you were given.",
        },
        {
          title: "Reading the value bound as a time bound",
          body: "`a[i] <= 1000` says nothing about how long you have; it says a frequency array of size 1001 is affordable. Two different limits, two different conclusions, and they are usually on adjacent lines.",
        },
      ],
    },
    {
      id: "the-drill",
      heading: "The drill",
      body: [
        "Same format as the last lesson, narrowed to one output. Read only the constraints \u2014 cover the statement if you have to \u2014 and write down the target complexity and one sentence saying what you expect the shape of the solution to be.",
        "Then uncover the statement and check. You will be right more often than feels reasonable, and the times you are wrong are informative: either the problem had a second limit you did not weigh, or it is one of the small minority where the intended solution is well under the budget for a reason that is not about time.",
        "It is worth doing this on twenty statements in a row before ever trying to solve one, because it makes the habit automatic. In an interview it is also free marks: reading the constraints out loud and saying \"so we are looking for something around `n log n`\" is thirty seconds of work that demonstrates exactly the reasoning the interviewer is there to see.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "The statement says n can be up to 100,000. What does that tell you?",
      answer:
        "That quadratic is out and the intended solution is around n log n or better. A hundred thousand squared is ten billion, which is about a hundred times what fits in a typical time limit, so a pair of nested loops over the input will not pass. In practice that constraint is pointing at sorting, a hash map, a single sweep with two pointers, or a heap. I would say that out loud before starting, because it rules out most of the search space in ten seconds.",
    },
    {
      question: "When is a brute force the intended answer?",
      answer:
        "When the constraints say so. If n is at most a few hundred and the statement is asking for something over pairs, quadratic is fine and inventing something cleverer is wasted time and extra risk. If n is at most about twenty, the intended solution is probably exponential -- subsets or permutations -- because no polynomial algorithm would need a limit that small. The small limit is the hint, and reading it the other way round is a common way to lose twenty minutes.",
    },
    {
      question: "What do you look for in the constraints besides the size of n?",
      answer:
        "The value range, because a small stated range invites a frequency array, counting sort, or a bitmask. Any second dimension -- number of queries, number of test cases -- because the real budget is usually the product. The memory limit, because it can rule out an n-by-n table and push you to a rolling row. And the guarantees that read like reassurance: sorted, distinct, connected, exactly one answer. Those are not courtesies, they are usually the reason the intended solution works, and if my approach does not use them I am probably solving something harder than what was asked.",
    },
  ],
  takeaways: [
    "The constraints are an instruction about which algorithm is wanted, and reading them costs ten seconds",
    "A time limit is worth roughly a hundred million simple operations — an order of magnitude, and that is enough",
    "`n <= 20` means exponential is expected; nothing polynomial needs a limit that small",
    "`n <= 1000` means quadratic is fine; `n <= 100,000` rules it out at a hundred times over budget",
    "`n <= 1,000,000` usually means linear, and often one pass with O(1) state",
    "A bound on the values, not their count, is about a structure — a frequency array or a bitmask",
    "Guarantees phrased as constraints (sorted, distinct, connected) are usually load-bearing",
    "The real budget is often a product: n times the number of queries",
  ],
};
