import type { Lesson } from "@/content/types";

export const subsetSumLesson: Lesson = {
  id: "dsa-dp-subset-sum",
  slug: "subset-sum-and-its-reductions",
  moduleSlug: "dynamic-programming-patterns",
  title: "Subset Sum and Its Reductions",
  summary:
    "Delete the value column from a knapsack and the table stops holding numbers and starts holding yes and no \u2014 which turns out to be the most reused shape in the module. Then two reductions onto it, and the guards that are the difference between a reduction and a plausible-looking answer to a different question.",
  estimatedMinutes: 40,
  objectives: [
    "Derive subset sum from knapsack, and check the equivalence rather than assert it",
    "Reduce equal partition to subset sum, with the guard that makes the reduction legal",
    "Reduce target sum to a counting table, and place both of its guards before the division",
    "Recognise the shape by its ingredients rather than by the word subset",
  ],
  sections: [
    {
      id: "knapsack-minus-the-value",
      heading: "Knapsack with the value column deleted",
      body: [
        "The last lesson's knapsack had two columns: a weight and a value. Delete the value column and something interesting happens \u2014 there is nothing left to maximise, and the only question a cell can answer is whether a total is reachable at all.",
        "That is subset sum, and it is the single most reused shape in this module. The table stops holding numbers and starts holding yes and no, which makes it cheaper in every sense: one bit per cell rather than one integer, and a transition that is an or rather than a max.",
        "It is worth seeing the reduction rather than being told it, so below the boolean table is printed next to the knapsack it is a special case of \u2014 a knapsack whose value column is a copy of its weights. The best you can pack into a bag of size `s` is `s` itself exactly when `s` is reachable, so the boolean row is that row compared against its own index.",
        "The four rows line up, on the printed set and on four thousand random ones. The middle two are the same information twice, which is the point: **subset sum is knapsack with the objective deleted**, and recognising that means everything the last lesson established still applies \u2014 the loop direction still decides repetition, and the initialisation still decides at-most against exactly.",
        "One difference is worth flagging. Because the cells are booleans, the whole row fits in a bitset, and the transition `hit[t] |= hit[t - v]` for every `t` becomes a single shift-and-or of the entire word. That is a constant-factor win of roughly the word size, and it is why subset sum survives inputs where a value-carrying knapsack would not.",
      ],
      examples: [
        {
          id: "subset-sum-is-knapsack",
          title: "The boolean row, and the knapsack it is a special case of",
          lang: "python",
          code: `# Subset sum is the knapsack of the last lesson with the value column deleted.
# Nothing is being maximised any more -- the only question is whether a total is
# reachable at all -- and that makes the table a row of yes and no.
#
# Which is worth seeing twice: once as booleans, and once as the knapsack it
# already was, to make the reduction concrete rather than asserted.

NUMS = [3, 4, 5, 7]


def reachable(nums, limit):
    """dp[s] is true when some subset of nums adds up to exactly s."""
    hit = [False] * (limit + 1)
    hit[0] = True                       # the empty subset makes zero, and only zero
    for value in nums:
        for total in range(limit, value - 1, -1):
            if hit[total - value]:
                hit[total] = True
    return hit


def knapsack_view(nums, limit):
    """The same thing as a knapsack whose value column is a copy of its weights.

    The best you can pack into a bag of size s is s itself exactly when s is
    reachable, so the boolean row is this row compared against its own index.
    """
    table = [0] * (limit + 1)
    for value in nums:
        for total in range(limit, value - 1, -1):
            if table[total - value] + value > table[total]:
                table[total] = table[total - value] + value
    return table


def brute(nums, limit):
    """Every subset, totalled."""
    hit = [False] * (limit + 1)
    for mask in range(1 << len(nums)):
        total = 0
        for i in range(len(nums)):
            if mask >> i & 1:
                total += nums[i]
        if total <= limit:
            hit[total] = True
    return hit


LIMIT = sum(NUMS)
rows = reachable(NUMS, LIMIT)
view = knapsack_view(NUMS, LIMIT)
truth = brute(NUMS, LIMIT)


def mark(flag):
    return "y" if flag else "."


print("numbers [" + ", ".join(str(v) for v in NUMS) + "]")
print()
print(f"{'total':<24}" + "".join(f"{t:>4}" for t in range(LIMIT + 1)))
print(f"{'reachable':<24}" + "".join(f"{mark(v):>4}" for v in rows))
print(f"{'every subset says':<24}" + "".join(f"{mark(v):>4}" for v in truth))
print(f"{'knapsack best fill':<24}" + "".join(f"{v:>4}" for v in view))
print(f"{'  fill equals the total':<24}" + "".join(f"{mark(view[t] == t):>4}" for t in range(LIMIT + 1)))
print()

same_as_brute = all(rows[t] == truth[t] for t in range(LIMIT + 1))
same_as_knapsack = all(rows[t] == (view[t] == t) for t in range(LIMIT + 1))
print(f"the boolean row matches every subset:              {'yes' if same_as_brute else 'no'}")
print(f"and matches the knapsack row read against itself:  {'yes' if same_as_knapsack else 'no'}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 4000
agree_brute = 0
agree_view = 0
for _ in range(TRIALS):
    n = 1 + rand(7)
    nums = [1 + rand(9) for _ in range(n)]
    limit = sum(nums)
    a = reachable(nums, limit)
    b = brute(nums, limit)
    c = knapsack_view(nums, limit)
    if all(a[t] == b[t] for t in range(limit + 1)):
        agree_brute += 1
    if all(a[t] == (c[t] == t) for t in range(limit + 1)):
        agree_view += 1

print(f"over {TRIALS} random sets:")
print(f"  the boolean table agrees with exhaustive search   {agree_brute}")
print(f"  and with the knapsack it is a special case of     {agree_view}")
`,
          output: `numbers [3, 4, 5, 7]

total                      0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19
reachable                  y   .   .   y   y   y   .   y   y   y   y   y   y   .   y   y   y   .   .   y
every subset says          y   .   .   y   y   y   .   y   y   y   y   y   y   .   y   y   y   .   .   y
knapsack best fill         0   0   0   3   4   5   5   7   8   9  10  11  12  12  14  15  16  16  16  19
  fill equals the total    y   .   .   y   y   y   .   y   y   y   y   y   y   .   y   y   y   .   .   y

the boolean row matches every subset:              yes
and matches the knapsack row read against itself:  yes

over 4000 random sets:
  the boolean table agrees with exhaustive search   4000
  and with the knapsack it is a special case of     4000`,
          explanation:
            "The knapsack row is the same loop as the last lesson with the value column set equal to the weights. Comparing it against its own index reproduces the boolean row exactly, on the printed set and on four thousand random ones, which is what makes the reduction a demonstration rather than an assertion.",
          alternates: [
            {
              lang: "javascript",
              code: `// Subset sum is the knapsack of the last lesson with the value column deleted.
// Nothing is being maximised any more -- the only question is whether a total is
// reachable at all -- and that makes the table a row of yes and no.
//
// Which is worth seeing twice: once as booleans, and once as the knapsack it
// already was, to make the reduction concrete rather than asserted.

const NUMS = [3, 4, 5, 7];

/** dp[s] is true when some subset of nums adds up to exactly s. */
function reachable(nums, limit) {
  const hit = new Array(limit + 1).fill(false);
  hit[0] = true;                        // the empty subset makes zero, and only zero
  for (const value of nums) {
    for (let total = limit; total >= value; total--) {
      if (hit[total - value]) hit[total] = true;
    }
  }
  return hit;
}

/**
 * The same thing as a knapsack whose value column is a copy of its weights.
 *
 * The best you can pack into a bag of size s is s itself exactly when s is
 * reachable, so the boolean row is this row compared against its own index.
 */
function knapsackView(nums, limit) {
  const table = new Array(limit + 1).fill(0);
  for (const value of nums) {
    for (let total = limit; total >= value; total--) {
      if (table[total - value] + value > table[total]) {
        table[total] = table[total - value] + value;
      }
    }
  }
  return table;
}

/** Every subset, totalled. */
function brute(nums, limit) {
  const hit = new Array(limit + 1).fill(false);
  for (let mask = 0; mask < 1 << nums.length; mask++) {
    let total = 0;
    for (let i = 0; i < nums.length; i++) if ((mask >> i) & 1) total += nums[i];
    if (total <= limit) hit[total] = true;
  }
  return hit;
}

const mark = (flag) => (flag ? "y" : ".");

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);

const LIMIT = NUMS.reduce((sum, v) => sum + v, 0);
const rows = reachable(NUMS, LIMIT);
const view = knapsackView(NUMS, LIMIT);
const truth = brute(NUMS, LIMIT);

console.log(\`numbers [\${NUMS.join(", ")}]\`);
console.log();

let head = padEnd("total", 24);
let r1 = padEnd("reachable", 24);
let r2 = padEnd("every subset says", 24);
let r3 = padEnd("knapsack best fill", 24);
let r4 = padEnd("  fill equals the total", 24);
for (let t = 0; t <= LIMIT; t++) {
  head += pad(t, 4);
  r1 += pad(mark(rows[t]), 4);
  r2 += pad(mark(truth[t]), 4);
  r3 += pad(view[t], 4);
  r4 += pad(mark(view[t] === t), 4);
}
console.log(head);
console.log(r1);
console.log(r2);
console.log(r3);
console.log(r4);
console.log();

let sameAsBrute = true;
let sameAsKnapsack = true;
for (let t = 0; t <= LIMIT; t++) {
  if (rows[t] !== truth[t]) sameAsBrute = false;
  if (rows[t] !== (view[t] === t)) sameAsKnapsack = false;
}
console.log(\`the boolean row matches every subset:              \${sameAsBrute ? "yes" : "no"}\`);
console.log(\`and matches the knapsack row read against itself:  \${sameAsKnapsack ? "yes" : "no"}\`);
console.log();

const TRIALS = 4000;
let agreeBrute = 0;
let agreeView = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 1 + rand(7);
  const values = Array.from({ length: n }, () => 1 + rand(9));
  const sum = values.reduce((acc, v) => acc + v, 0);
  const a = reachable(values, sum);
  const b = brute(values, sum);
  const c = knapsackView(values, sum);
  let okBrute = true;
  let okView = true;
  for (let s = 0; s <= sum; s++) {
    if (a[s] !== b[s]) okBrute = false;
    if (a[s] !== (c[s] === s)) okView = false;
  }
  if (okBrute) agreeBrute++;
  if (okView) agreeView++;
}

console.log(\`over \${TRIALS} random sets:\`);
console.log(\`  the boolean table agrees with exhaustive search   \${agreeBrute}\`);
console.log(\`  and with the knapsack it is a special case of     \${agreeView}\`);
`,
            },
            {
              lang: "typescript",
              code: `// Subset sum is the knapsack of the last lesson with the value column deleted.
// Nothing is being maximised any more -- the only question is whether a total is
// reachable at all -- and that makes the table a row of yes and no.
//
// Which is worth seeing twice: once as booleans, and once as the knapsack it
// already was, to make the reduction concrete rather than asserted.

const NUMS = [3, 4, 5, 7];

/** dp[s] is true when some subset of nums adds up to exactly s. */
function reachable(nums: number[], limit: number): boolean[] {
  const hit = new Array(limit + 1).fill(false);
  hit[0] = true;                        // the empty subset makes zero, and only zero
  for (const value of nums) {
    for (let total = limit; total >= value; total--) {
      if (hit[total - value]) hit[total] = true;
    }
  }
  return hit;
}

/**
 * The same thing as a knapsack whose value column is a copy of its weights.
 *
 * The best you can pack into a bag of size s is s itself exactly when s is
 * reachable, so the boolean row is this row compared against its own index.
 */
function knapsackView(nums: number[], limit: number): number[] {
  const table = new Array(limit + 1).fill(0);
  for (const value of nums) {
    for (let total = limit; total >= value; total--) {
      if (table[total - value] + value > table[total]) {
        table[total] = table[total - value] + value;
      }
    }
  }
  return table;
}

/** Every subset, totalled. */
function brute(nums: number[], limit: number): boolean[] {
  const hit = new Array(limit + 1).fill(false);
  for (let mask = 0; mask < 1 << nums.length; mask++) {
    let total = 0;
    for (let i = 0; i < nums.length; i++) if ((mask >> i) & 1) total += nums[i];
    if (total <= limit) hit[total] = true;
  }
  return hit;
}

const mark = (flag: boolean): string => (flag ? "y" : ".");

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

const LIMIT = NUMS.reduce((sum, v) => sum + v, 0);
const rows = reachable(NUMS, LIMIT);
const view = knapsackView(NUMS, LIMIT);
const truth = brute(NUMS, LIMIT);

console.log(\`numbers [\${NUMS.join(", ")}]\`);
console.log();

let head = padEnd("total", 24);
let r1 = padEnd("reachable", 24);
let r2 = padEnd("every subset says", 24);
let r3 = padEnd("knapsack best fill", 24);
let r4 = padEnd("  fill equals the total", 24);
for (let t = 0; t <= LIMIT; t++) {
  head += pad(t, 4);
  r1 += pad(mark(rows[t]), 4);
  r2 += pad(mark(truth[t]), 4);
  r3 += pad(view[t], 4);
  r4 += pad(mark(view[t] === t), 4);
}
console.log(head);
console.log(r1);
console.log(r2);
console.log(r3);
console.log(r4);
console.log();

let sameAsBrute = true;
let sameAsKnapsack = true;
for (let t = 0; t <= LIMIT; t++) {
  if (rows[t] !== truth[t]) sameAsBrute = false;
  if (rows[t] !== (view[t] === t)) sameAsKnapsack = false;
}
console.log(\`the boolean row matches every subset:              \${sameAsBrute ? "yes" : "no"}\`);
console.log(\`and matches the knapsack row read against itself:  \${sameAsKnapsack ? "yes" : "no"}\`);
console.log();

const TRIALS = 4000;
let agreeBrute = 0;
let agreeView = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 1 + rand(7);
  const values = Array.from({ length: n }, () => 1 + rand(9));
  const sum = values.reduce((acc, v) => acc + v, 0);
  const a = reachable(values, sum);
  const b = brute(values, sum);
  const c = knapsackView(values, sum);
  let okBrute = true;
  let okView = true;
  for (let s = 0; s <= sum; s++) {
    if (a[s] !== b[s]) okBrute = false;
    if (a[s] !== (c[s] === s)) okView = false;
  }
  if (okBrute) agreeBrute++;
  if (okView) agreeView++;
}

console.log(\`over \${TRIALS} random sets:\`);
console.log(\`  the boolean table agrees with exhaustive search   \${agreeBrute}\`);
console.log(\`  and with the knapsack it is a special case of     \${agreeView}\`);
`,
            },
            {
              lang: "java",
              code: `// Subset sum is the knapsack of the last lesson with the value column deleted.
// Nothing is being maximised any more -- the only question is whether a total is
// reachable at all -- and that makes the table a row of yes and no.
//
// Which is worth seeing twice: once as booleans, and once as the knapsack it
// already was, to make the reduction concrete rather than asserted.
public class Main {
    static final int[] NUMS = { 3, 4, 5, 7 };

    /** dp[s] is true when some subset of nums adds up to exactly s. */
    static boolean[] reachable(int[] nums, int limit) {
        boolean[] hit = new boolean[limit + 1];
        hit[0] = true;                  // the empty subset makes zero, and only zero
        for (int value : nums) {
            for (int total = limit; total >= value; total--) {
                if (hit[total - value]) hit[total] = true;
            }
        }
        return hit;
    }

    /**
     * The same thing as a knapsack whose value column is a copy of its weights.
     *
     * The best you can pack into a bag of size s is s itself exactly when s is
     * reachable, so the boolean row is this row compared against its own index.
     */
    static int[] knapsackView(int[] nums, int limit) {
        int[] table = new int[limit + 1];
        for (int value : nums) {
            for (int total = limit; total >= value; total--) {
                if (table[total - value] + value > table[total]) {
                    table[total] = table[total - value] + value;
                }
            }
        }
        return table;
    }

    /** Every subset, totalled. */
    static boolean[] brute(int[] nums, int limit) {
        boolean[] hit = new boolean[limit + 1];
        for (int mask = 0; mask < (1 << nums.length); mask++) {
            int total = 0;
            for (int i = 0; i < nums.length; i++) {
                if ((mask >> i & 1) == 1) total += nums[i];
            }
            if (total <= limit) hit[total] = true;
        }
        return hit;
    }

    static String mark(boolean flag) {
        return flag ? "y" : ".";
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        int limit = 0;
        for (int v : NUMS) limit += v;
        boolean[] rows = reachable(NUMS, limit);
        int[] view = knapsackView(NUMS, limit);
        boolean[] truth = brute(NUMS, limit);

        StringBuilder nums = new StringBuilder();
        for (int i = 0; i < NUMS.length; i++) {
            if (i > 0) nums.append(", ");
            nums.append(NUMS[i]);
        }
        System.out.printf("numbers [%s]%n", nums);
        System.out.println();

        StringBuilder head = new StringBuilder(String.format("%-24s", "total"));
        StringBuilder r1 = new StringBuilder(String.format("%-24s", "reachable"));
        StringBuilder r2 = new StringBuilder(String.format("%-24s", "every subset says"));
        StringBuilder r3 = new StringBuilder(String.format("%-24s", "knapsack best fill"));
        StringBuilder r4 = new StringBuilder(String.format("%-24s", "  fill equals the total"));
        for (int t = 0; t <= limit; t++) {
            head.append(String.format("%4d", t));
            r1.append(String.format("%4s", mark(rows[t])));
            r2.append(String.format("%4s", mark(truth[t])));
            r3.append(String.format("%4d", view[t]));
            r4.append(String.format("%4s", mark(view[t] == t)));
        }
        System.out.println(head);
        System.out.println(r1);
        System.out.println(r2);
        System.out.println(r3);
        System.out.println(r4);
        System.out.println();

        boolean sameAsBrute = true;
        boolean sameAsKnapsack = true;
        for (int t = 0; t <= limit; t++) {
            if (rows[t] != truth[t]) sameAsBrute = false;
            if (rows[t] != (view[t] == t)) sameAsKnapsack = false;
        }
        System.out.printf("the boolean row matches every subset:              %s%n", sameAsBrute ? "yes" : "no");
        System.out.printf("and matches the knapsack row read against itself:  %s%n", sameAsKnapsack ? "yes" : "no");
        System.out.println();

        final int TRIALS = 4000;
        int agreeBrute = 0;
        int agreeView = 0;
        for (int t = 0; t < TRIALS; t++) {
            int n = 1 + rand(7);
            int[] values = new int[n];
            int sum = 0;
            for (int i = 0; i < n; i++) {
                values[i] = 1 + rand(9);
                sum += values[i];
            }
            boolean[] a = reachable(values, sum);
            boolean[] b = brute(values, sum);
            int[] c = knapsackView(values, sum);
            boolean okBrute = true;
            boolean okView = true;
            for (int s = 0; s <= sum; s++) {
                if (a[s] != b[s]) okBrute = false;
                if (a[s] != (c[s] == s)) okView = false;
            }
            if (okBrute) agreeBrute++;
            if (okView) agreeView++;
        }

        System.out.printf("over %d random sets:%n", TRIALS);
        System.out.printf("  the boolean table agrees with exhaustive search   %d%n", agreeBrute);
        System.out.printf("  and with the knapsack it is a special case of     %d%n", agreeView);
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Subset sum is the knapsack of the last lesson with the value column deleted.
// Nothing is being maximised any more -- the only question is whether a total is
// reachable at all -- and that makes the table a row of yes and no.
//
// Which is worth seeing twice: once as booleans, and once as the knapsack it
// already was, to make the reduction concrete rather than asserted.
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

static const std::vector<int> NUMS = {3, 4, 5, 7};

// dp[s] is true when some subset of nums adds up to exactly s.
std::vector<bool> reachable(const std::vector<int> &nums, int limit) {
    std::vector<bool> hit(limit + 1, false);
    hit[0] = true;   // the empty subset makes zero, and only zero
    for (int value : nums) {
        for (int total = limit; total >= value; total--) {
            if (hit[total - value]) hit[total] = true;
        }
    }
    return hit;
}

// The same thing as a knapsack whose value column is a copy of its weights.
//
// The best you can pack into a bag of size s is s itself exactly when s is
// reachable, so the boolean row is this row compared against its own index.
std::vector<int> knapsackView(const std::vector<int> &nums, int limit) {
    std::vector<int> table(limit + 1, 0);
    for (int value : nums) {
        for (int total = limit; total >= value; total--) {
            if (table[total - value] + value > table[total]) {
                table[total] = table[total - value] + value;
            }
        }
    }
    return table;
}

// Every subset, totalled.
std::vector<bool> brute(const std::vector<int> &nums, int limit) {
    std::vector<bool> hit(limit + 1, false);
    for (int mask = 0; mask < (1 << nums.size()); mask++) {
        int total = 0;
        for (size_t i = 0; i < nums.size(); i++) {
            if (mask >> i & 1) total += nums[i];
        }
        if (total <= limit) hit[total] = true;
    }
    return hit;
}

std::string mark(bool flag) {
    return flag ? "y" : ".";
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

std::string padLeft(const std::string &text, int width) {
    return std::string(width - static_cast<int>(text.size()), ' ') + text;
}

int main() {
    int limit = 0;
    for (int v : NUMS) limit += v;
    auto rows = reachable(NUMS, limit);
    auto view = knapsackView(NUMS, limit);
    auto truth = brute(NUMS, limit);

    std::cout << "numbers [";
    for (size_t i = 0; i < NUMS.size(); i++) {
        if (i > 0) std::cout << ", ";
        std::cout << NUMS[i];
    }
    std::cout << "]\\n\\n";

    std::string head = "total", r1 = "reachable", r2 = "every subset says";
    std::string r3 = "knapsack best fill", r4 = "  fill equals the total";
    head.resize(24, ' ');
    r1.resize(24, ' ');
    r2.resize(24, ' ');
    r3.resize(24, ' ');
    r4.resize(24, ' ');
    for (int t = 0; t <= limit; t++) {
        head += padLeft(std::to_string(t), 4);
        r1 += padLeft(mark(rows[t]), 4);
        r2 += padLeft(mark(truth[t]), 4);
        r3 += padLeft(std::to_string(view[t]), 4);
        r4 += padLeft(mark(view[t] == t), 4);
    }
    std::cout << head << "\\n" << r1 << "\\n" << r2 << "\\n" << r3 << "\\n" << r4 << "\\n\\n";

    bool sameAsBrute = true, sameAsKnapsack = true;
    for (int t = 0; t <= limit; t++) {
        if (rows[t] != truth[t]) sameAsBrute = false;
        if (rows[t] != (view[t] == t)) sameAsKnapsack = false;
    }
    std::cout << "the boolean row matches every subset:              "
              << (sameAsBrute ? "yes" : "no") << "\\n";
    std::cout << "and matches the knapsack row read against itself:  "
              << (sameAsKnapsack ? "yes" : "no") << "\\n\\n";

    const int TRIALS = 4000;
    int agreeBrute = 0, agreeView = 0;
    for (int t = 0; t < TRIALS; t++) {
        int n = 1 + rnd(7);
        std::vector<int> values(n);
        int sum = 0;
        for (int i = 0; i < n; i++) {
            values[i] = 1 + rnd(9);
            sum += values[i];
        }
        auto a = reachable(values, sum);
        auto b = brute(values, sum);
        auto c = knapsackView(values, sum);
        bool okBrute = true, okView = true;
        for (int s = 0; s <= sum; s++) {
            if (a[s] != b[s]) okBrute = false;
            if (a[s] != (c[s] == s)) okView = false;
        }
        if (okBrute) agreeBrute++;
        if (okView) agreeView++;
    }

    std::cout << "over " << TRIALS << " random sets:\\n";
    std::cout << "  the boolean table agrees with exhaustive search   " << agreeBrute << "\\n";
    std::cout << "  and with the knapsack it is a special case of     " << agreeView << "\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// Subset sum is the knapsack of the last lesson with the value column deleted.
// Nothing is being maximised any more -- the only question is whether a total is
// reachable at all -- and that makes the table a row of yes and no.
//
// Which is worth seeing twice: once as booleans, and once as the knapsack it
// already was, to make the reduction concrete rather than asserted.

/// dp[s] is true when some subset of nums adds up to exactly s.
fn reachable(nums: &[usize], limit: usize) -> Vec<bool> {
    let mut hit = vec![false; limit + 1];
    hit[0] = true; // the empty subset makes zero, and only zero
    for &value in nums {
        let mut total = limit;
        while total >= value {
            if hit[total - value] {
                hit[total] = true;
            }
            if total == 0 {
                break;
            }
            total -= 1;
        }
    }
    hit
}

/// The same thing as a knapsack whose value column is a copy of its weights.
///
/// The best you can pack into a bag of size s is s itself exactly when s is
/// reachable, so the boolean row is this row compared against its own index.
fn knapsack_view(nums: &[usize], limit: usize) -> Vec<usize> {
    let mut table = vec![0usize; limit + 1];
    for &value in nums {
        let mut total = limit;
        while total >= value {
            if table[total - value] + value > table[total] {
                table[total] = table[total - value] + value;
            }
            if total == 0 {
                break;
            }
            total -= 1;
        }
    }
    table
}

/// Every subset, totalled.
fn brute(nums: &[usize], limit: usize) -> Vec<bool> {
    let mut hit = vec![false; limit + 1];
    for mask in 0..(1usize << nums.len()) {
        let mut total = 0;
        for i in 0..nums.len() {
            if mask >> i & 1 == 1 {
                total += nums[i];
            }
        }
        if total <= limit {
            hit[total] = true;
        }
    }
    hit
}

fn mark(flag: bool) -> &'static str {
    if flag { "y" } else { "." }
}

fn rand(seed: &mut i64, n: i64) -> usize {
    *seed = (*seed * 1103515245 + 12345) % 2147483648;
    (*seed / 65536 % n) as usize
}

fn main() {
    let nums: Vec<usize> = vec![3, 4, 5, 7];
    let limit: usize = nums.iter().sum();
    let rows = reachable(&nums, limit);
    let view = knapsack_view(&nums, limit);
    let truth = brute(&nums, limit);

    println!("numbers [{}]", nums.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(", "));
    println!();

    let mut head = format!("{:<24}", "total");
    let mut r1 = format!("{:<24}", "reachable");
    let mut r2 = format!("{:<24}", "every subset says");
    let mut r3 = format!("{:<24}", "knapsack best fill");
    let mut r4 = format!("{:<24}", "  fill equals the total");
    for t in 0..=limit {
        head.push_str(&format!("{:>4}", t));
        r1.push_str(&format!("{:>4}", mark(rows[t])));
        r2.push_str(&format!("{:>4}", mark(truth[t])));
        r3.push_str(&format!("{:>4}", view[t]));
        r4.push_str(&format!("{:>4}", mark(view[t] == t)));
    }
    println!("{}", head);
    println!("{}", r1);
    println!("{}", r2);
    println!("{}", r3);
    println!("{}", r4);
    println!();

    let same_as_brute = (0..=limit).all(|t| rows[t] == truth[t]);
    let same_as_knapsack = (0..=limit).all(|t| rows[t] == (view[t] == t));
    println!("the boolean row matches every subset:              {}",
        if same_as_brute { "yes" } else { "no" });
    println!("and matches the knapsack row read against itself:  {}",
        if same_as_knapsack { "yes" } else { "no" });
    println!();

    const TRIALS: i32 = 4000;
    let mut seed = 1i64;
    let mut agree_brute = 0;
    let mut agree_view = 0;
    for _ in 0..TRIALS {
        let n = 1 + rand(&mut seed, 7);
        let values: Vec<usize> = (0..n).map(|_| 1 + rand(&mut seed, 9)).collect();
        let sum: usize = values.iter().sum();
        let a = reachable(&values, sum);
        let b = brute(&values, sum);
        let c = knapsack_view(&values, sum);
        if (0..=sum).all(|s| a[s] == b[s]) {
            agree_brute += 1;
        }
        if (0..=sum).all(|s| a[s] == (c[s] == s)) {
            agree_view += 1;
        }
    }

    println!("over {} random sets:", TRIALS);
    println!("  the boolean table agrees with exhaustive search   {}", agree_brute);
    println!("  and with the knapsack it is a special case of     {}", agree_view);
}
`,
            },
            {
              lang: "go",
              code: `// Subset sum is the knapsack of the last lesson with the value column deleted.
// Nothing is being maximised any more -- the only question is whether a total is
// reachable at all -- and that makes the table a row of yes and no.
//
// Which is worth seeing twice: once as booleans, and once as the knapsack it
// already was, to make the reduction concrete rather than asserted.
package main

import (
	"fmt"
	"strconv"
	"strings"
)

var NUMS = []int{3, 4, 5, 7}

// dp[s] is true when some subset of nums adds up to exactly s.
func reachable(nums []int, limit int) []bool {
	hit := make([]bool, limit+1)
	hit[0] = true // the empty subset makes zero, and only zero
	for _, value := range nums {
		for total := limit; total >= value; total-- {
			if hit[total-value] {
				hit[total] = true
			}
		}
	}
	return hit
}

// The same thing as a knapsack whose value column is a copy of its weights.
//
// The best you can pack into a bag of size s is s itself exactly when s is
// reachable, so the boolean row is this row compared against its own index.
func knapsackView(nums []int, limit int) []int {
	table := make([]int, limit+1)
	for _, value := range nums {
		for total := limit; total >= value; total-- {
			if table[total-value]+value > table[total] {
				table[total] = table[total-value] + value
			}
		}
	}
	return table
}

// Every subset, totalled.
func brute(nums []int, limit int) []bool {
	hit := make([]bool, limit+1)
	for mask := 0; mask < 1<<len(nums); mask++ {
		total := 0
		for i := range nums {
			if mask>>i&1 == 1 {
				total += nums[i]
			}
		}
		if total <= limit {
			hit[total] = true
		}
	}
	return hit
}

func mark(flag bool) string {
	if flag {
		return "y"
	}
	return "."
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	limit := 0
	for _, v := range NUMS {
		limit += v
	}
	rows := reachable(NUMS, limit)
	view := knapsackView(NUMS, limit)
	truth := brute(NUMS, limit)

	labels := make([]string, len(NUMS))
	for i, v := range NUMS {
		labels[i] = strconv.Itoa(v)
	}
	fmt.Printf("numbers [%s]\\n", strings.Join(labels, ", "))
	fmt.Println()

	head := fmt.Sprintf("%-24s", "total")
	r1 := fmt.Sprintf("%-24s", "reachable")
	r2 := fmt.Sprintf("%-24s", "every subset says")
	r3 := fmt.Sprintf("%-24s", "knapsack best fill")
	r4 := fmt.Sprintf("%-24s", "  fill equals the total")
	for t := 0; t <= limit; t++ {
		head += fmt.Sprintf("%4d", t)
		r1 += fmt.Sprintf("%4s", mark(rows[t]))
		r2 += fmt.Sprintf("%4s", mark(truth[t]))
		r3 += fmt.Sprintf("%4d", view[t])
		r4 += fmt.Sprintf("%4s", mark(view[t] == t))
	}
	fmt.Println(head)
	fmt.Println(r1)
	fmt.Println(r2)
	fmt.Println(r3)
	fmt.Println(r4)
	fmt.Println()

	sameAsBrute, sameAsKnapsack := true, true
	for t := 0; t <= limit; t++ {
		if rows[t] != truth[t] {
			sameAsBrute = false
		}
		if rows[t] != (view[t] == t) {
			sameAsKnapsack = false
		}
	}
	yes := func(ok bool) string {
		if ok {
			return "yes"
		}
		return "no"
	}
	fmt.Printf("the boolean row matches every subset:              %s\\n", yes(sameAsBrute))
	fmt.Printf("and matches the knapsack row read against itself:  %s\\n", yes(sameAsKnapsack))
	fmt.Println()

	const TRIALS = 4000
	agreeBrute, agreeView := 0, 0
	for t := 0; t < TRIALS; t++ {
		n := 1 + rand(7)
		values := make([]int, n)
		sum := 0
		for i := 0; i < n; i++ {
			values[i] = 1 + rand(9)
			sum += values[i]
		}
		a := reachable(values, sum)
		b := brute(values, sum)
		c := knapsackView(values, sum)
		okBrute, okView := true, true
		for s := 0; s <= sum; s++ {
			if a[s] != b[s] {
				okBrute = false
			}
			if a[s] != (c[s] == s) {
				okView = false
			}
		}
		if okBrute {
			agreeBrute++
		}
		if okView {
			agreeView++
		}
	}

	fmt.Printf("over %d random sets:\\n", TRIALS)
	fmt.Printf("  the boolean table agrees with exhaustive search   %d\\n", agreeBrute)
	fmt.Printf("  and with the knapsack it is a special case of     %d\\n", agreeView)
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "dp-subset-sum-row",
        kind: "dp",
        algorithm: "coins",
        title: "One additive target, filled from the bottom up",
        lockAlgorithm: true,
      },
    },
    {
      id: "splitting-in-two",
      heading: "Splitting a set in two",
      body: [
        "Now the reductions, which are the reason this shape is worth knowing. The first is the one people meet first: split a multiset into two piles with equal totals.",
        "One pile is a subset and the other is everything left over, so the two are equal exactly when the subset adds up to half the total. That is subset sum with the target fixed at `total / 2`, and the whole reduction is one line \u2014 plus a guard, which is the part that matters.",
        "**An odd total cannot be split.** Two equal integers sum to an even number, so the answer is no before any table is built. Skip that check and `total / 2` is integer division on an odd number, which quietly asks about a target that is half a unit away from the one you meant.",
        "The unguarded version is not subtly wrong. `[1, 2]` has a total of 3, cannot be split, and it says yes \u2014 because 1 is reachable and 3 / 2 is 1. Over five thousand random sets it is right 3,303 times, and of the 2,524 with an odd total it is wrong on 1,697 of them.",
        "The lesson generalises past parity: **a reduction is only as good as the conditions under which it holds**, and those conditions are part of the code rather than part of the commentary. The next section has two of them.",
      ],
      examples: [
        {
          id: "partition-and-its-guard",
          title: "Equal partition, with the parity guard and without it",
          lang: "python",
          code: `# "Split these numbers into two piles of equal total" is subset sum wearing a
# hat: one pile is a subset, the other is what is left, and they are equal
# exactly when the subset adds up to half the total.
#
# The reduction needs one guard, and the guard is not an optimisation. Halving
# an odd total with integer division asks a question nobody posed.

def reachable(nums, limit):
    hit = [False] * (limit + 1)
    hit[0] = True
    for value in nums:
        for total in range(limit, value - 1, -1):
            if hit[total - value]:
                hit[total] = True
    return hit


def can_split(nums):
    """The reduction, with the parity guard that makes it legitimate."""
    total = sum(nums)
    if total % 2 == 1:
        return False                    # two equal integers cannot sum to an odd number
    return reachable(nums, total // 2)[total // 2]


def can_split_unguarded(nums):
    """The same reduction with the guard removed, halving whatever it is given."""
    total = sum(nums)
    half = total // 2
    return reachable(nums, half)[half]


def brute(nums):
    """Every way to deal the numbers into two piles."""
    total = sum(nums)
    for mask in range(1 << len(nums)):
        picked = 0
        for i in range(len(nums)):
            if mask >> i & 1:
                picked += nums[i]
        if picked * 2 == total:
            return True
    return False


def show(nums):
    return "[" + ", ".join(str(v) for v in nums) + "]"


CASES = [
    [1, 5, 11, 5],
    [1, 2, 3, 5],
    [3, 4, 5, 7],
    [1, 2],
    [2, 2, 3, 5],
    [7],
    [6, 6],
]

print(f"{'numbers':<20}{'total':>7}{'guarded':>10}{'unguarded':>12}{'every deal':>12}")
for nums in CASES:
    print(f"{show(nums):<20}{sum(nums):>7}"
          f"{('yes' if can_split(nums) else 'no'):>10}"
          f"{('yes' if can_split_unguarded(nums) else 'no'):>12}"
          f"{('yes' if brute(nums) else 'no'):>12}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 5000
guarded_right = 0
unguarded_right = 0
odd_totals = 0
unguarded_wrong_on_odd = 0
for _ in range(TRIALS):
    n = 1 + rand(7)
    nums = [1 + rand(9) for _ in range(n)]
    truth = brute(nums)
    if can_split(nums) == truth:
        guarded_right += 1
    unguarded = can_split_unguarded(nums)
    if unguarded == truth:
        unguarded_right += 1
    if sum(nums) % 2 == 1:
        odd_totals += 1
        if unguarded != truth:
            unguarded_wrong_on_odd += 1

print(f"over {TRIALS} random sets, {odd_totals} of which have an odd total:")
print(f"  with the parity guard      {guarded_right:>6} correct")
print(f"  without it                 {unguarded_right:>6} correct")
print(f"  and of the odd-total sets, it is wrong on {unguarded_wrong_on_odd}")
`,
          output: `numbers               total   guarded   unguarded  every deal
[1, 5, 11, 5]            22       yes         yes         yes
[1, 2, 3, 5]             11        no         yes          no
[3, 4, 5, 7]             19        no         yes          no
[1, 2]                    3        no         yes          no
[2, 2, 3, 5]             12        no          no          no
[7]                       7        no          no          no
[6, 6]                   12       yes         yes         yes

over 5000 random sets, 2524 of which have an odd total:
  with the parity guard        5000 correct
  without it                   3303 correct
  and of the odd-total sets, it is wrong on 1697`,
          explanation:
            "The two functions differ by three lines: the parity check and its early return. Both are scored against a brute force that deals the numbers into two piles every possible way, so the unguarded version's failures are counted rather than described.",
          alternates: [
            {
              lang: "javascript",
              code: `// "Split these numbers into two piles of equal total" is subset sum wearing a
// hat: one pile is a subset, the other is what is left, and they are equal
// exactly when the subset adds up to half the total.
//
// The reduction needs one guard, and the guard is not an optimisation. Halving
// an odd total with integer division asks a question nobody posed.

function reachable(nums, limit) {
  const hit = new Array(limit + 1).fill(false);
  hit[0] = true;
  for (const value of nums) {
    for (let total = limit; total >= value; total--) {
      if (hit[total - value]) hit[total] = true;
    }
  }
  return hit;
}

const sum = (nums) => nums.reduce((total, v) => total + v, 0);

/** The reduction, with the parity guard that makes it legitimate. */
function canSplit(nums) {
  const total = sum(nums);
  if (total % 2 === 1) return false;    // two equal integers cannot sum to an odd number
  return reachable(nums, total / 2)[total / 2];
}

/** The same reduction with the guard removed, halving whatever it is given. */
function canSplitUnguarded(nums) {
  const half = Math.floor(sum(nums) / 2);
  return reachable(nums, half)[half];
}

/** Every way to deal the numbers into two piles. */
function brute(nums) {
  const total = sum(nums);
  for (let mask = 0; mask < 1 << nums.length; mask++) {
    let picked = 0;
    for (let i = 0; i < nums.length; i++) if ((mask >> i) & 1) picked += nums[i];
    if (picked * 2 === total) return true;
  }
  return false;
}

const show = (nums) => \`[\${nums.join(", ")}]\`;
const yes = (flag) => (flag ? "yes" : "no");

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);

const CASES = [
  [1, 5, 11, 5],
  [1, 2, 3, 5],
  [3, 4, 5, 7],
  [1, 2],
  [2, 2, 3, 5],
  [7],
  [6, 6],
];

console.log(padEnd("numbers", 20) + pad("total", 7) + pad("guarded", 10) + pad("unguarded", 12) + pad("every deal", 12));
for (const nums of CASES) {
  console.log(
    padEnd(show(nums), 20) + pad(sum(nums), 7) + pad(yes(canSplit(nums)), 10) +
      pad(yes(canSplitUnguarded(nums)), 12) + pad(yes(brute(nums)), 12)
  );
}
console.log();

const TRIALS = 5000;
let guardedRight = 0;
let unguardedRight = 0;
let oddTotals = 0;
let unguardedWrongOnOdd = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 1 + rand(7);
  const nums = Array.from({ length: n }, () => 1 + rand(9));
  const truth = brute(nums);
  if (canSplit(nums) === truth) guardedRight++;
  const unguarded = canSplitUnguarded(nums);
  if (unguarded === truth) unguardedRight++;
  if (sum(nums) % 2 === 1) {
    oddTotals++;
    if (unguarded !== truth) unguardedWrongOnOdd++;
  }
}

console.log(\`over \${TRIALS} random sets, \${oddTotals} of which have an odd total:\`);
console.log(\`  with the parity guard      \${pad(guardedRight, 6)} correct\`);
console.log(\`  without it                 \${pad(unguardedRight, 6)} correct\`);
console.log(\`  and of the odd-total sets, it is wrong on \${unguardedWrongOnOdd}\`);
`,
            },
            {
              lang: "typescript",
              code: `// "Split these numbers into two piles of equal total" is subset sum wearing a
// hat: one pile is a subset, the other is what is left, and they are equal
// exactly when the subset adds up to half the total.
//
// The reduction needs one guard, and the guard is not an optimisation. Halving
// an odd total with integer division asks a question nobody posed.

function reachable(nums: number[], limit: number): boolean[] {
  const hit = new Array(limit + 1).fill(false);
  hit[0] = true;
  for (const value of nums) {
    for (let total = limit; total >= value; total--) {
      if (hit[total - value]) hit[total] = true;
    }
  }
  return hit;
}

const sum = (nums: number[]): number => nums.reduce((total, v) => total + v, 0);

/** The reduction, with the parity guard that makes it legitimate. */
function canSplit(nums: number[]): boolean {
  const total = sum(nums);
  if (total % 2 === 1) return false;    // two equal integers cannot sum to an odd number
  return reachable(nums, total / 2)[total / 2];
}

/** The same reduction with the guard removed, halving whatever it is given. */
function canSplitUnguarded(nums: number[]): boolean {
  const half = Math.floor(sum(nums) / 2);
  return reachable(nums, half)[half];
}

/** Every way to deal the numbers into two piles. */
function brute(nums: number[]): boolean {
  const total = sum(nums);
  for (let mask = 0; mask < 1 << nums.length; mask++) {
    let picked = 0;
    for (let i = 0; i < nums.length; i++) if ((mask >> i) & 1) picked += nums[i];
    if (picked * 2 === total) return true;
  }
  return false;
}

const show = (nums: number[]): string => \`[\${nums.join(", ")}]\`;
const yes = (flag: boolean): string => (flag ? "yes" : "no");

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

const CASES = [
  [1, 5, 11, 5],
  [1, 2, 3, 5],
  [3, 4, 5, 7],
  [1, 2],
  [2, 2, 3, 5],
  [7],
  [6, 6],
];

console.log(padEnd("numbers", 20) + pad("total", 7) + pad("guarded", 10) + pad("unguarded", 12) + pad("every deal", 12));
for (const nums of CASES) {
  console.log(
    padEnd(show(nums), 20) + pad(sum(nums), 7) + pad(yes(canSplit(nums)), 10) +
      pad(yes(canSplitUnguarded(nums)), 12) + pad(yes(brute(nums)), 12)
  );
}
console.log();

const TRIALS = 5000;
let guardedRight = 0;
let unguardedRight = 0;
let oddTotals = 0;
let unguardedWrongOnOdd = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 1 + rand(7);
  const nums = Array.from({ length: n }, () => 1 + rand(9));
  const truth = brute(nums);
  if (canSplit(nums) === truth) guardedRight++;
  const unguarded = canSplitUnguarded(nums);
  if (unguarded === truth) unguardedRight++;
  if (sum(nums) % 2 === 1) {
    oddTotals++;
    if (unguarded !== truth) unguardedWrongOnOdd++;
  }
}

console.log(\`over \${TRIALS} random sets, \${oddTotals} of which have an odd total:\`);
console.log(\`  with the parity guard      \${pad(guardedRight, 6)} correct\`);
console.log(\`  without it                 \${pad(unguardedRight, 6)} correct\`);
console.log(\`  and of the odd-total sets, it is wrong on \${unguardedWrongOnOdd}\`);
`,
            },
            {
              lang: "java",
              code: `// "Split these numbers into two piles of equal total" is subset sum wearing a
// hat: one pile is a subset, the other is what is left, and they are equal
// exactly when the subset adds up to half the total.
//
// The reduction needs one guard, and the guard is not an optimisation. Halving
// an odd total with integer division asks a question nobody posed.
public class Main {
    static boolean[] reachable(int[] nums, int limit) {
        boolean[] hit = new boolean[limit + 1];
        hit[0] = true;
        for (int value : nums) {
            for (int total = limit; total >= value; total--) {
                if (hit[total - value]) hit[total] = true;
            }
        }
        return hit;
    }

    static int sum(int[] nums) {
        int total = 0;
        for (int v : nums) total += v;
        return total;
    }

    /** The reduction, with the parity guard that makes it legitimate. */
    static boolean canSplit(int[] nums) {
        int total = sum(nums);
        if (total % 2 == 1) return false;   // two equal integers cannot sum to an odd number
        return reachable(nums, total / 2)[total / 2];
    }

    /** The same reduction with the guard removed, halving whatever it is given. */
    static boolean canSplitUnguarded(int[] nums) {
        int half = sum(nums) / 2;
        return reachable(nums, half)[half];
    }

    /** Every way to deal the numbers into two piles. */
    static boolean brute(int[] nums) {
        int total = sum(nums);
        for (int mask = 0; mask < (1 << nums.length); mask++) {
            int picked = 0;
            for (int i = 0; i < nums.length; i++) {
                if ((mask >> i & 1) == 1) picked += nums[i];
            }
            if (picked * 2 == total) return true;
        }
        return false;
    }

    static String show(int[] nums) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < nums.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(nums[i]);
        }
        return sb.append("]").toString();
    }

    static String yes(boolean flag) {
        return flag ? "yes" : "no";
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    static final int[][] CASES = {
        { 1, 5, 11, 5 },
        { 1, 2, 3, 5 },
        { 3, 4, 5, 7 },
        { 1, 2 },
        { 2, 2, 3, 5 },
        { 7 },
        { 6, 6 },
    };

    public static void main(String[] args) {
        System.out.printf("%-20s%7s%10s%12s%12s%n", "numbers", "total", "guarded", "unguarded", "every deal");
        for (int[] nums : CASES) {
            System.out.printf("%-20s%7d%10s%12s%12s%n", show(nums), sum(nums),
                yes(canSplit(nums)), yes(canSplitUnguarded(nums)), yes(brute(nums)));
        }
        System.out.println();

        final int TRIALS = 5000;
        int guardedRight = 0;
        int unguardedRight = 0;
        int oddTotals = 0;
        int unguardedWrongOnOdd = 0;
        for (int t = 0; t < TRIALS; t++) {
            int n = 1 + rand(7);
            int[] nums = new int[n];
            for (int i = 0; i < n; i++) nums[i] = 1 + rand(9);
            boolean truth = brute(nums);
            if (canSplit(nums) == truth) guardedRight++;
            boolean unguarded = canSplitUnguarded(nums);
            if (unguarded == truth) unguardedRight++;
            if (sum(nums) % 2 == 1) {
                oddTotals++;
                if (unguarded != truth) unguardedWrongOnOdd++;
            }
        }

        System.out.printf("over %d random sets, %d of which have an odd total:%n", TRIALS, oddTotals);
        System.out.printf("  with the parity guard      %6d correct%n", guardedRight);
        System.out.printf("  without it                 %6d correct%n", unguardedRight);
        System.out.printf("  and of the odd-total sets, it is wrong on %d%n", unguardedWrongOnOdd);
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// "Split these numbers into two piles of equal total" is subset sum wearing a
// hat: one pile is a subset, the other is what is left, and they are equal
// exactly when the subset adds up to half the total.
//
// The reduction needs one guard, and the guard is not an optimisation. Halving
// an odd total with integer division asks a question nobody posed.
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

std::vector<bool> reachable(const std::vector<int> &nums, int limit) {
    std::vector<bool> hit(limit + 1, false);
    hit[0] = true;
    for (int value : nums) {
        for (int total = limit; total >= value; total--) {
            if (hit[total - value]) hit[total] = true;
        }
    }
    return hit;
}

int sumOf(const std::vector<int> &nums) {
    int total = 0;
    for (int v : nums) total += v;
    return total;
}

// The reduction, with the parity guard that makes it legitimate.
bool canSplit(const std::vector<int> &nums) {
    int total = sumOf(nums);
    if (total % 2 == 1) return false;   // two equal integers cannot sum to an odd number
    return reachable(nums, total / 2)[total / 2];
}

// The same reduction with the guard removed, halving whatever it is given.
bool canSplitUnguarded(const std::vector<int> &nums) {
    int half = sumOf(nums) / 2;
    return reachable(nums, half)[half];
}

// Every way to deal the numbers into two piles.
bool brute(const std::vector<int> &nums) {
    int total = sumOf(nums);
    for (int mask = 0; mask < (1 << nums.size()); mask++) {
        int picked = 0;
        for (size_t i = 0; i < nums.size(); i++) {
            if (mask >> i & 1) picked += nums[i];
        }
        if (picked * 2 == total) return true;
    }
    return false;
}

std::string show(const std::vector<int> &nums) {
    std::string out = "[";
    for (size_t i = 0; i < nums.size(); i++) {
        if (i > 0) out += ", ";
        out += std::to_string(nums[i]);
    }
    return out + "]";
}

std::string yes(bool flag) {
    return flag ? "yes" : "no";
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

static const std::vector<std::vector<int>> CASES = {
    {1, 5, 11, 5}, {1, 2, 3, 5}, {3, 4, 5, 7}, {1, 2}, {2, 2, 3, 5}, {7}, {6, 6},
};

int main() {
    std::cout << std::left << std::setw(20) << "numbers" << std::right << std::setw(7) << "total"
              << std::setw(10) << "guarded" << std::setw(12) << "unguarded"
              << std::setw(12) << "every deal" << "\\n";
    for (const auto &nums : CASES) {
        std::cout << std::left << std::setw(20) << show(nums) << std::right << std::setw(7) << sumOf(nums)
                  << std::setw(10) << yes(canSplit(nums)) << std::setw(12) << yes(canSplitUnguarded(nums))
                  << std::setw(12) << yes(brute(nums)) << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 5000;
    int guardedRight = 0, unguardedRight = 0, oddTotals = 0, unguardedWrongOnOdd = 0;
    for (int t = 0; t < TRIALS; t++) {
        int n = 1 + rnd(7);
        std::vector<int> nums(n);
        for (int i = 0; i < n; i++) nums[i] = 1 + rnd(9);
        bool truth = brute(nums);
        if (canSplit(nums) == truth) guardedRight++;
        bool unguarded = canSplitUnguarded(nums);
        if (unguarded == truth) unguardedRight++;
        if (sumOf(nums) % 2 == 1) {
            oddTotals++;
            if (unguarded != truth) unguardedWrongOnOdd++;
        }
    }

    std::cout << "over " << TRIALS << " random sets, " << oddTotals << " of which have an odd total:\\n";
    std::cout << "  with the parity guard      " << std::setw(6) << guardedRight << " correct\\n";
    std::cout << "  without it                 " << std::setw(6) << unguardedRight << " correct\\n";
    std::cout << "  and of the odd-total sets, it is wrong on " << unguardedWrongOnOdd << "\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// "Split these numbers into two piles of equal total" is subset sum wearing a
// hat: one pile is a subset, the other is what is left, and they are equal
// exactly when the subset adds up to half the total.
//
// The reduction needs one guard, and the guard is not an optimisation. Halving
// an odd total with integer division asks a question nobody posed.

fn reachable(nums: &[usize], limit: usize) -> Vec<bool> {
    let mut hit = vec![false; limit + 1];
    hit[0] = true;
    for &value in nums {
        let mut total = limit;
        while total >= value {
            if hit[total - value] {
                hit[total] = true;
            }
            if total == 0 {
                break;
            }
            total -= 1;
        }
    }
    hit
}

fn sum_of(nums: &[usize]) -> usize {
    nums.iter().sum()
}

/// The reduction, with the parity guard that makes it legitimate.
fn can_split(nums: &[usize]) -> bool {
    let total = sum_of(nums);
    if total % 2 == 1 {
        return false; // two equal integers cannot sum to an odd number
    }
    reachable(nums, total / 2)[total / 2]
}

/// The same reduction with the guard removed, halving whatever it is given.
fn can_split_unguarded(nums: &[usize]) -> bool {
    let half = sum_of(nums) / 2;
    reachable(nums, half)[half]
}

/// Every way to deal the numbers into two piles.
fn brute(nums: &[usize]) -> bool {
    let total = sum_of(nums);
    for mask in 0..(1usize << nums.len()) {
        let mut picked = 0;
        for i in 0..nums.len() {
            if mask >> i & 1 == 1 {
                picked += nums[i];
            }
        }
        if picked * 2 == total {
            return true;
        }
    }
    false
}

fn show(nums: &[usize]) -> String {
    format!("[{}]", nums.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(", "))
}

fn yes(flag: bool) -> &'static str {
    if flag { "yes" } else { "no" }
}

fn rand(seed: &mut i64, n: i64) -> usize {
    *seed = (*seed * 1103515245 + 12345) % 2147483648;
    (*seed / 65536 % n) as usize
}

fn main() {
    let cases: Vec<Vec<usize>> = vec![
        vec![1, 5, 11, 5],
        vec![1, 2, 3, 5],
        vec![3, 4, 5, 7],
        vec![1, 2],
        vec![2, 2, 3, 5],
        vec![7],
        vec![6, 6],
    ];

    println!("{:<20}{:>7}{:>10}{:>12}{:>12}", "numbers", "total", "guarded", "unguarded", "every deal");
    for nums in &cases {
        println!("{:<20}{:>7}{:>10}{:>12}{:>12}", show(nums), sum_of(nums),
            yes(can_split(nums)), yes(can_split_unguarded(nums)), yes(brute(nums)));
    }
    println!();

    const TRIALS: i32 = 5000;
    let mut seed = 1i64;
    let mut guarded_right = 0;
    let mut unguarded_right = 0;
    let mut odd_totals = 0;
    let mut unguarded_wrong_on_odd = 0;
    for _ in 0..TRIALS {
        let n = 1 + rand(&mut seed, 7);
        let nums: Vec<usize> = (0..n).map(|_| 1 + rand(&mut seed, 9)).collect();
        let truth = brute(&nums);
        if can_split(&nums) == truth {
            guarded_right += 1;
        }
        let unguarded = can_split_unguarded(&nums);
        if unguarded == truth {
            unguarded_right += 1;
        }
        if sum_of(&nums) % 2 == 1 {
            odd_totals += 1;
            if unguarded != truth {
                unguarded_wrong_on_odd += 1;
            }
        }
    }

    println!("over {} random sets, {} of which have an odd total:", TRIALS, odd_totals);
    println!("  with the parity guard      {:>6} correct", guarded_right);
    println!("  without it                 {:>6} correct", unguarded_right);
    println!("  and of the odd-total sets, it is wrong on {}", unguarded_wrong_on_odd);
}
`,
            },
            {
              lang: "go",
              code: `// "Split these numbers into two piles of equal total" is subset sum wearing a
// hat: one pile is a subset, the other is what is left, and they are equal
// exactly when the subset adds up to half the total.
//
// The reduction needs one guard, and the guard is not an optimisation. Halving
// an odd total with integer division asks a question nobody posed.
package main

import (
	"fmt"
	"strconv"
	"strings"
)

func reachable(nums []int, limit int) []bool {
	hit := make([]bool, limit+1)
	hit[0] = true
	for _, value := range nums {
		for total := limit; total >= value; total-- {
			if hit[total-value] {
				hit[total] = true
			}
		}
	}
	return hit
}

func sum(nums []int) int {
	total := 0
	for _, v := range nums {
		total += v
	}
	return total
}

// The reduction, with the parity guard that makes it legitimate.
func canSplit(nums []int) bool {
	total := sum(nums)
	if total%2 == 1 {
		return false // two equal integers cannot sum to an odd number
	}
	return reachable(nums, total/2)[total/2]
}

// The same reduction with the guard removed, halving whatever it is given.
func canSplitUnguarded(nums []int) bool {
	half := sum(nums) / 2
	return reachable(nums, half)[half]
}

// Every way to deal the numbers into two piles.
func brute(nums []int) bool {
	total := sum(nums)
	for mask := 0; mask < 1<<len(nums); mask++ {
		picked := 0
		for i := range nums {
			if mask>>i&1 == 1 {
				picked += nums[i]
			}
		}
		if picked*2 == total {
			return true
		}
	}
	return false
}

func show(nums []int) string {
	parts := make([]string, len(nums))
	for i, v := range nums {
		parts[i] = strconv.Itoa(v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func yes(flag bool) string {
	if flag {
		return "yes"
	}
	return "no"
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

var CASES = [][]int{
	{1, 5, 11, 5},
	{1, 2, 3, 5},
	{3, 4, 5, 7},
	{1, 2},
	{2, 2, 3, 5},
	{7},
	{6, 6},
}

func main() {
	fmt.Printf("%-20s%7s%10s%12s%12s\\n", "numbers", "total", "guarded", "unguarded", "every deal")
	for _, nums := range CASES {
		fmt.Printf("%-20s%7d%10s%12s%12s\\n", show(nums), sum(nums),
			yes(canSplit(nums)), yes(canSplitUnguarded(nums)), yes(brute(nums)))
	}
	fmt.Println()

	const TRIALS = 5000
	guardedRight, unguardedRight, oddTotals, unguardedWrongOnOdd := 0, 0, 0, 0
	for t := 0; t < TRIALS; t++ {
		n := 1 + rand(7)
		nums := make([]int, n)
		for i := 0; i < n; i++ {
			nums[i] = 1 + rand(9)
		}
		truth := brute(nums)
		if canSplit(nums) == truth {
			guardedRight++
		}
		unguarded := canSplitUnguarded(nums)
		if unguarded == truth {
			unguardedRight++
		}
		if sum(nums)%2 == 1 {
			oddTotals++
			if unguarded != truth {
				unguardedWrongOnOdd++
			}
		}
	}

	fmt.Printf("over %d random sets, %d of which have an odd total:\\n", TRIALS, oddTotals)
	fmt.Printf("  with the parity guard      %6d correct\\n", guardedRight)
	fmt.Printf("  without it                 %6d correct\\n", unguardedRight)
	fmt.Printf("  and of the odd-total sets, it is wrong on %d\\n", unguardedWrongOnOdd)
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "A guard on a reduction is part of the reduction",
          body: "The parity check is not a fast path taken before the real work \u2014 it is the condition under which \"half the total\" is a meaningful target at all. Reductions in this module tend to come with one or two of these, and they belong in the function rather than in a comment above it, because the version without them runs perfectly well and answers something else.",
        },
        {
          title: "Half of an odd number is not a target",
          body: "Integer division does not fail on an odd total, it rounds, and the resulting question is about a total that is half a unit from the one you meant. `[1, 2]` cannot be split and the unguarded version says it can, because 1 is reachable and 3 / 2 is 1.",
        },
      ],
    },
    {
      id: "signs-and-counting",
      heading: "Signs, and counting instead of testing",
      body: [
        "The second reduction is the one that looks least like subset sum and is the most instructive. Put a plus or a minus in front of each number so the whole expression comes to `T`.",
        "Call the numbers given a plus sign `P` and those given a minus `N`. Then `P + N = total` and `P - N = T`, so `P = (total + T) / 2`. Every sign assignment is a choice of which numbers go into `P`, so the number of ways to hit `T` is the number of subsets summing to `(total + T) / 2` \u2014 subset sum again, counting this time rather than testing.",
        "Counting rather than testing changes one line: the cell holds how many subsets reach this total, the base case is one rather than true, and the transition adds instead of or-ing. Module 27 lesson 4 said the base value must be the identity for the combine, and this is that rule cashed out \u2014 one is the identity for a count of ways to do nothing.",
        "And the reduction needs two guards, not one. `T` has to be inside `[-total, total]`, because no assignment of signs can reach further than the numbers themselves. And `total + T` has to be even, or the plus pile would need to contain half a unit.",
        "The unguarded column is the interesting one. It never crashes; it reports 5 ways to reach a target of \u22122 with five ones, and 3 ways to reach 0 with an odd total, because it is faithfully counting subsets that sum to a target it computed by rounding. Over five thousand random problems it is right 3,520 times, and 1,791 of those problems have a target of the wrong parity while 1,159 have one outside the range.",
        "Two details in the arithmetic are worth being careful about, and they are why the guards come before the division rather than after. `(total + T)` can be negative, and in most languages integer division and remainder round toward zero rather than down, so `(-3) / 2` is \u22121 and `(-3) % 2` is \u22121. A parity test written as `x % 2 == 1` silently passes for negatives; the programs here use a floored remainder so the check means what it says.",
      ],
      examples: [
        {
          id: "target-sum-reduction",
          title: "Target sum as a counting table, with both guards and without them",
          lang: "python",
          code: `# "Put a plus or a minus in front of each number so the result is T" looks like a
# different problem and is subset sum again, with counting instead of
# reachability. The plus pile P and the minus pile N satisfy P + N = total and
# P - N = T, so P = (total + T) / 2 -- and the reduction is only legal when that
# division is exact and lands inside the set.
#
# Two guards, then a counting table. Removing the guards does not crash; it
# answers a question about a target nobody asked for.

def count_subsets(nums, target):
    """How many subsets of nums add up to exactly \`target\`."""
    ways = [0] * (target + 1)
    ways[0] = 1                          # one way to make nothing: take nothing
    for value in nums:
        for total in range(target, value - 1, -1):
            ways[total] += ways[total - value]
    return ways[target]


def count_signs(nums, target):
    """The reduction, with both guards."""
    total = sum(nums)
    if target > total or target < -total:
        return 0                         # no assignment can reach outside [-total, total]
    if (total + target) % 2 == 1:
        return 0                         # the plus pile would have to be a half-integer
    return count_subsets(nums, (total + target) // 2)


def count_signs_unguarded(nums, target):
    """The same arithmetic with the guards deleted."""
    total = sum(nums)
    plus = (total + target) // 2
    if plus < 0:
        return 0                         # a negative size would break the table
    return count_subsets(nums, plus)


def brute(nums, target):
    """Every assignment of signs, counted."""
    found = 0
    for mask in range(1 << len(nums)):
        value = 0
        for i in range(len(nums)):
            value += nums[i] if mask >> i & 1 else -nums[i]
        if value == target:
            found += 1
    return found


def show(nums):
    return "[" + ", ".join(str(v) for v in nums) + "]"


NUMS = [1, 1, 1, 1, 1]
print(f"numbers {show(NUMS)}, total {sum(NUMS)}")
print()
print(f"{'target':>8}{'guarded':>10}{'unguarded':>12}{'every assignment':>19}")
for target in range(-7, 8):
    print(f"{target:>8}{count_signs(NUMS, target):>10}"
          f"{count_signs_unguarded(NUMS, target):>12}{brute(NUMS, target):>19}")
print()

OTHER = [1, 2, 3, 4, 5]
print(f"numbers {show(OTHER)}, total {sum(OTHER)}")
print(f"{'target':>8}{'guarded':>10}{'unguarded':>12}{'every assignment':>19}")
for target in range(-4, 5):
    print(f"{target:>8}{count_signs(OTHER, target):>10}"
          f"{count_signs_unguarded(OTHER, target):>12}{brute(OTHER, target):>19}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 5000
guarded_right = 0
unguarded_right = 0
parity_cases = 0
range_cases = 0
for _ in range(TRIALS):
    n = 1 + rand(7)
    nums = [1 + rand(6) for _ in range(n)]
    total = sum(nums)
    target = rand(2 * total + 7) - total - 3
    truth = brute(nums, target)
    if count_signs(nums, target) == truth:
        guarded_right += 1
    if count_signs_unguarded(nums, target) == truth:
        unguarded_right += 1
    if abs(target) <= total and (total + target) % 2 == 1:
        parity_cases += 1
    if abs(target) > total:
        range_cases += 1

print(f"over {TRIALS} random problems:")
print(f"  {parity_cases} have a target of the wrong parity, {range_cases} a target outside the range")
print(f"  with both guards           {guarded_right:>6} correct")
print(f"  without them               {unguarded_right:>6} correct")
`,
          output: `numbers [1, 1, 1, 1, 1], total 5

  target   guarded   unguarded   every assignment
      -7         0           0                  0
      -6         0           0                  0
      -5         1           1                  1
      -4         0           1                  0
      -3         5           5                  5
      -2         0           5                  0
      -1        10          10                 10
       0         0          10                  0
       1        10          10                 10
       2         0          10                  0
       3         5           5                  5
       4         0           5                  0
       5         1           1                  1
       6         0           1                  0
       7         0           0                  0

numbers [1, 2, 3, 4, 5], total 15
  target   guarded   unguarded   every assignment
      -4         0           3                  0
      -3         3           3                  3
      -2         0           3                  0
      -1         3           3                  3
       0         0           3                  0
       1         3           3                  3
       2         0           3                  0
       3         3           3                  3
       4         0           3                  0

over 5000 random problems:
  1791 have a target of the wrong parity, 1159 a target outside the range
  with both guards             5000 correct
  without them                 3520 correct`,
          explanation:
            "The guarded and unguarded columns sit next to an exhaustive search over all 2^n sign assignments. Both tables are printed over a range of targets that includes ones of the wrong parity and ones outside the reachable range, so the two failure modes are visible separately.",
          alternates: [
            {
              lang: "javascript",
              code: `// "Put a plus or a minus in front of each number so the result is T" looks like a
// different problem and is subset sum again, with counting instead of
// reachability. The plus pile P and the minus pile N satisfy P + N = total and
// P - N = T, so P = (total + T) / 2 -- and the reduction is only legal when that
// division is exact and lands inside the set.
//
// Two guards, then a counting table. Removing the guards does not crash; it
// answers a question about a target nobody asked for.

/** How many subsets of nums add up to exactly \`target\`. */
function countSubsets(nums, target) {
  const ways = new Array(target + 1).fill(0);
  ways[0] = 1;                          // one way to make nothing: take nothing
  for (const value of nums) {
    for (let total = target; total >= value; total--) {
      ways[total] += ways[total - value];
    }
  }
  return ways[target];
}

const sum = (nums) => nums.reduce((total, v) => total + v, 0);
const floorMod2 = (value) => ((value % 2) + 2) % 2;
const floorDiv2 = (value) => Math.floor(value / 2);

/** The reduction, with both guards. */
function countSigns(nums, target) {
  const total = sum(nums);
  if (target > total || target < -total) return 0;   // outside [-total, total]
  if (floorMod2(total + target) === 1) return 0;     // the plus pile would be a half-integer
  return countSubsets(nums, (total + target) / 2);
}

/** The same arithmetic with the guards deleted. */
function countSignsUnguarded(nums, target) {
  const plus = floorDiv2(sum(nums) + target);
  if (plus < 0) return 0;               // a negative size would break the table
  return countSubsets(nums, plus);
}

/** Every assignment of signs, counted. */
function brute(nums, target) {
  let found = 0;
  for (let mask = 0; mask < 1 << nums.length; mask++) {
    let value = 0;
    for (let i = 0; i < nums.length; i++) value += (mask >> i) & 1 ? nums[i] : -nums[i];
    if (value === target) found++;
  }
  return found;
}

const show = (nums) => \`[\${nums.join(", ")}]\`;

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v, w) => String(v).padStart(w);

const NUMS = [1, 1, 1, 1, 1];
console.log(\`numbers \${show(NUMS)}, total \${sum(NUMS)}\`);
console.log();
console.log(pad("target", 8) + pad("guarded", 10) + pad("unguarded", 12) + pad("every assignment", 19));
for (let target = -7; target <= 7; target++) {
  console.log(
    pad(target, 8) + pad(countSigns(NUMS, target), 10) + pad(countSignsUnguarded(NUMS, target), 12) +
      pad(brute(NUMS, target), 19)
  );
}
console.log();

const OTHER = [1, 2, 3, 4, 5];
console.log(\`numbers \${show(OTHER)}, total \${sum(OTHER)}\`);
console.log(pad("target", 8) + pad("guarded", 10) + pad("unguarded", 12) + pad("every assignment", 19));
for (let target = -4; target <= 4; target++) {
  console.log(
    pad(target, 8) + pad(countSigns(OTHER, target), 10) + pad(countSignsUnguarded(OTHER, target), 12) +
      pad(brute(OTHER, target), 19)
  );
}
console.log();

const TRIALS = 5000;
let guardedRight = 0;
let unguardedRight = 0;
let parityCases = 0;
let rangeCases = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 1 + rand(7);
  const values = Array.from({ length: n }, () => 1 + rand(6));
  const total = sum(values);
  const target = rand(2 * total + 7) - total - 3;
  const truth = brute(values, target);
  if (countSigns(values, target) === truth) guardedRight++;
  if (countSignsUnguarded(values, target) === truth) unguardedRight++;
  if (Math.abs(target) <= total && floorMod2(total + target) === 1) parityCases++;
  if (Math.abs(target) > total) rangeCases++;
}

console.log(\`over \${TRIALS} random problems:\`);
console.log(\`  \${parityCases} have a target of the wrong parity, \${rangeCases} a target outside the range\`);
console.log(\`  with both guards           \${pad(guardedRight, 6)} correct\`);
console.log(\`  without them               \${pad(unguardedRight, 6)} correct\`);
`,
            },
            {
              lang: "typescript",
              code: `// "Put a plus or a minus in front of each number so the result is T" looks like a
// different problem and is subset sum again, with counting instead of
// reachability. The plus pile P and the minus pile N satisfy P + N = total and
// P - N = T, so P = (total + T) / 2 -- and the reduction is only legal when that
// division is exact and lands inside the set.
//
// Two guards, then a counting table. Removing the guards does not crash; it
// answers a question about a target nobody asked for.

/** How many subsets of nums add up to exactly \`target\`. */
function countSubsets(nums: number[], target: number): number {
  const ways = new Array(target + 1).fill(0);
  ways[0] = 1;                          // one way to make nothing: take nothing
  for (const value of nums) {
    for (let total = target; total >= value; total--) {
      ways[total] += ways[total - value];
    }
  }
  return ways[target];
}

const sum = (nums: number[]): number => nums.reduce((total, v) => total + v, 0);
const floorMod2 = (value: number): number => ((value % 2) + 2) % 2;
const floorDiv2 = (value: number): number => Math.floor(value / 2);

/** The reduction, with both guards. */
function countSigns(nums: number[], target: number): number {
  const total = sum(nums);
  if (target > total || target < -total) return 0;   // outside [-total, total]
  if (floorMod2(total + target) === 1) return 0;     // the plus pile would be a half-integer
  return countSubsets(nums, (total + target) / 2);
}

/** The same arithmetic with the guards deleted. */
function countSignsUnguarded(nums: number[], target: number): number {
  const plus = floorDiv2(sum(nums) + target);
  if (plus < 0) return 0;               // a negative size would break the table
  return countSubsets(nums, plus);
}

/** Every assignment of signs, counted. */
function brute(nums: number[], target: number): number {
  let found = 0;
  for (let mask = 0; mask < 1 << nums.length; mask++) {
    let value = 0;
    for (let i = 0; i < nums.length; i++) value += (mask >> i) & 1 ? nums[i] : -nums[i];
    if (value === target) found++;
  }
  return found;
}

const show = (nums: number[]): string => \`[\${nums.join(", ")}]\`;

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);

const NUMS = [1, 1, 1, 1, 1];
console.log(\`numbers \${show(NUMS)}, total \${sum(NUMS)}\`);
console.log();
console.log(pad("target", 8) + pad("guarded", 10) + pad("unguarded", 12) + pad("every assignment", 19));
for (let target = -7; target <= 7; target++) {
  console.log(
    pad(target, 8) + pad(countSigns(NUMS, target), 10) + pad(countSignsUnguarded(NUMS, target), 12) +
      pad(brute(NUMS, target), 19)
  );
}
console.log();

const OTHER = [1, 2, 3, 4, 5];
console.log(\`numbers \${show(OTHER)}, total \${sum(OTHER)}\`);
console.log(pad("target", 8) + pad("guarded", 10) + pad("unguarded", 12) + pad("every assignment", 19));
for (let target = -4; target <= 4; target++) {
  console.log(
    pad(target, 8) + pad(countSigns(OTHER, target), 10) + pad(countSignsUnguarded(OTHER, target), 12) +
      pad(brute(OTHER, target), 19)
  );
}
console.log();

const TRIALS = 5000;
let guardedRight = 0;
let unguardedRight = 0;
let parityCases = 0;
let rangeCases = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 1 + rand(7);
  const values = Array.from({ length: n }, () => 1 + rand(6));
  const total = sum(values);
  const target = rand(2 * total + 7) - total - 3;
  const truth = brute(values, target);
  if (countSigns(values, target) === truth) guardedRight++;
  if (countSignsUnguarded(values, target) === truth) unguardedRight++;
  if (Math.abs(target) <= total && floorMod2(total + target) === 1) parityCases++;
  if (Math.abs(target) > total) rangeCases++;
}

console.log(\`over \${TRIALS} random problems:\`);
console.log(\`  \${parityCases} have a target of the wrong parity, \${rangeCases} a target outside the range\`);
console.log(\`  with both guards           \${pad(guardedRight, 6)} correct\`);
console.log(\`  without them               \${pad(unguardedRight, 6)} correct\`);
`,
            },
            {
              lang: "java",
              code: `// "Put a plus or a minus in front of each number so the result is T" looks like a
// different problem and is subset sum again, with counting instead of
// reachability. The plus pile P and the minus pile N satisfy P + N = total and
// P - N = T, so P = (total + T) / 2 -- and the reduction is only legal when that
// division is exact and lands inside the set.
//
// Two guards, then a counting table. Removing the guards does not crash; it
// answers a question about a target nobody asked for.
public class Main {
    /** How many subsets of nums add up to exactly \`target\`. */
    static long countSubsets(int[] nums, int target) {
        long[] ways = new long[target + 1];
        ways[0] = 1;                     // one way to make nothing: take nothing
        for (int value : nums) {
            for (int total = target; total >= value; total--) {
                ways[total] += ways[total - value];
            }
        }
        return ways[target];
    }

    static int sum(int[] nums) {
        int total = 0;
        for (int v : nums) total += v;
        return total;
    }

    /** The reduction, with both guards. */
    static long countSigns(int[] nums, int target) {
        int total = sum(nums);
        if (target > total || target < -total) return 0;   // outside [-total, total]
        if (Math.floorMod(total + target, 2) == 1) return 0;  // the plus pile would be a half-integer
        return countSubsets(nums, (total + target) / 2);
    }

    /** The same arithmetic with the guards deleted. */
    static long countSignsUnguarded(int[] nums, int target) {
        int total = sum(nums);
        int plus = Math.floorDiv(total + target, 2);
        if (plus < 0) return 0;          // a negative size would break the table
        return countSubsets(nums, plus);
    }

    /** Every assignment of signs, counted. */
    static long brute(int[] nums, int target) {
        long found = 0;
        for (int mask = 0; mask < (1 << nums.length); mask++) {
            int value = 0;
            for (int i = 0; i < nums.length; i++) {
                value += ((mask >> i & 1) == 1) ? nums[i] : -nums[i];
            }
            if (value == target) found++;
        }
        return found;
    }

    static String show(int[] nums) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < nums.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(nums[i]);
        }
        return sb.append("]").toString();
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        int[] nums = { 1, 1, 1, 1, 1 };
        System.out.printf("numbers %s, total %d%n", show(nums), sum(nums));
        System.out.println();
        System.out.printf("%8s%10s%12s%19s%n", "target", "guarded", "unguarded", "every assignment");
        for (int target = -7; target <= 7; target++) {
            System.out.printf("%8d%10d%12d%19d%n", target, countSigns(nums, target),
                countSignsUnguarded(nums, target), brute(nums, target));
        }
        System.out.println();

        int[] other = { 1, 2, 3, 4, 5 };
        System.out.printf("numbers %s, total %d%n", show(other), sum(other));
        System.out.printf("%8s%10s%12s%19s%n", "target", "guarded", "unguarded", "every assignment");
        for (int target = -4; target <= 4; target++) {
            System.out.printf("%8d%10d%12d%19d%n", target, countSigns(other, target),
                countSignsUnguarded(other, target), brute(other, target));
        }
        System.out.println();

        final int TRIALS = 5000;
        int guardedRight = 0;
        int unguardedRight = 0;
        int parityCases = 0;
        int rangeCases = 0;
        for (int t = 0; t < TRIALS; t++) {
            int n = 1 + rand(7);
            int[] values = new int[n];
            for (int i = 0; i < n; i++) values[i] = 1 + rand(6);
            int total = sum(values);
            int target = rand(2 * total + 7) - total - 3;
            long truth = brute(values, target);
            if (countSigns(values, target) == truth) guardedRight++;
            if (countSignsUnguarded(values, target) == truth) unguardedRight++;
            if (Math.abs(target) <= total && Math.floorMod(total + target, 2) == 1) parityCases++;
            if (Math.abs(target) > total) rangeCases++;
        }

        System.out.printf("over %d random problems:%n", TRIALS);
        System.out.printf("  %d have a target of the wrong parity, %d a target outside the range%n",
            parityCases, rangeCases);
        System.out.printf("  with both guards           %6d correct%n", guardedRight);
        System.out.printf("  without them               %6d correct%n", unguardedRight);
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// "Put a plus or a minus in front of each number so the result is T" looks like a
// different problem and is subset sum again, with counting instead of
// reachability. The plus pile P and the minus pile N satisfy P + N = total and
// P - N = T, so P = (total + T) / 2 -- and the reduction is only legal when that
// division is exact and lands inside the set.
//
// Two guards, then a counting table. Removing the guards does not crash; it
// answers a question about a target nobody asked for.
#include <cstdint>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

// How many subsets of nums add up to exactly \`target\`.
std::int64_t countSubsets(const std::vector<int> &nums, int target) {
    std::vector<std::int64_t> ways(target + 1, 0);
    ways[0] = 1;   // one way to make nothing: take nothing
    for (int value : nums) {
        for (int total = target; total >= value; total--) {
            ways[total] += ways[total - value];
        }
    }
    return ways[target];
}

int sumOf(const std::vector<int> &nums) {
    int total = 0;
    for (int v : nums) total += v;
    return total;
}

int floorMod2(int value) {
    int m = value % 2;
    return m < 0 ? m + 2 : m;
}

int floorDiv2(int value) {
    return value >= 0 ? value / 2 : -((-value + 1) / 2);
}

// The reduction, with both guards.
std::int64_t countSigns(const std::vector<int> &nums, int target) {
    int total = sumOf(nums);
    if (target > total || target < -total) return 0;   // outside [-total, total]
    if (floorMod2(total + target) == 1) return 0;      // the plus pile would be a half-integer
    return countSubsets(nums, (total + target) / 2);
}

// The same arithmetic with the guards deleted.
std::int64_t countSignsUnguarded(const std::vector<int> &nums, int target) {
    int plus = floorDiv2(sumOf(nums) + target);
    if (plus < 0) return 0;   // a negative size would break the table
    return countSubsets(nums, plus);
}

// Every assignment of signs, counted.
std::int64_t brute(const std::vector<int> &nums, int target) {
    std::int64_t found = 0;
    for (int mask = 0; mask < (1 << nums.size()); mask++) {
        int value = 0;
        for (size_t i = 0; i < nums.size(); i++) {
            value += (mask >> i & 1) ? nums[i] : -nums[i];
        }
        if (value == target) found++;
    }
    return found;
}

std::string show(const std::vector<int> &nums) {
    std::string out = "[";
    for (size_t i = 0; i < nums.size(); i++) {
        if (i > 0) out += ", ";
        out += std::to_string(nums[i]);
    }
    return out + "]";
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    std::vector<int> nums = {1, 1, 1, 1, 1};
    std::cout << "numbers " << show(nums) << ", total " << sumOf(nums) << "\\n\\n";
    std::cout << std::right << std::setw(8) << "target" << std::setw(10) << "guarded"
              << std::setw(12) << "unguarded" << std::setw(19) << "every assignment" << "\\n";
    for (int target = -7; target <= 7; target++) {
        std::cout << std::right << std::setw(8) << target << std::setw(10) << countSigns(nums, target)
                  << std::setw(12) << countSignsUnguarded(nums, target)
                  << std::setw(19) << brute(nums, target) << "\\n";
    }
    std::cout << "\\n";

    std::vector<int> other = {1, 2, 3, 4, 5};
    std::cout << "numbers " << show(other) << ", total " << sumOf(other) << "\\n";
    std::cout << std::right << std::setw(8) << "target" << std::setw(10) << "guarded"
              << std::setw(12) << "unguarded" << std::setw(19) << "every assignment" << "\\n";
    for (int target = -4; target <= 4; target++) {
        std::cout << std::right << std::setw(8) << target << std::setw(10) << countSigns(other, target)
                  << std::setw(12) << countSignsUnguarded(other, target)
                  << std::setw(19) << brute(other, target) << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 5000;
    int guardedRight = 0, unguardedRight = 0, parityCases = 0, rangeCases = 0;
    for (int t = 0; t < TRIALS; t++) {
        int n = 1 + rnd(7);
        std::vector<int> values(n);
        for (int i = 0; i < n; i++) values[i] = 1 + rnd(6);
        int total = sumOf(values);
        int target = rnd(2 * total + 7) - total - 3;
        std::int64_t truth = brute(values, target);
        if (countSigns(values, target) == truth) guardedRight++;
        if (countSignsUnguarded(values, target) == truth) unguardedRight++;
        if (std::abs(target) <= total && floorMod2(total + target) == 1) parityCases++;
        if (std::abs(target) > total) rangeCases++;
    }

    std::cout << "over " << TRIALS << " random problems:\\n";
    std::cout << "  " << parityCases << " have a target of the wrong parity, " << rangeCases
              << " a target outside the range\\n";
    std::cout << "  with both guards           " << std::setw(6) << guardedRight << " correct\\n";
    std::cout << "  without them               " << std::setw(6) << unguardedRight << " correct\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// "Put a plus or a minus in front of each number so the result is T" looks like a
// different problem and is subset sum again, with counting instead of
// reachability. The plus pile P and the minus pile N satisfy P + N = total and
// P - N = T, so P = (total + T) / 2 -- and the reduction is only legal when that
// division is exact and lands inside the set.
//
// Two guards, then a counting table. Removing the guards does not crash; it
// answers a question about a target nobody asked for.

/// How many subsets of nums add up to exactly \`target\`.
fn count_subsets(nums: &[i32], target: i32) -> i64 {
    let size = target as usize;
    let mut ways = vec![0i64; size + 1];
    ways[0] = 1; // one way to make nothing: take nothing
    for &value in nums {
        let v = value as usize;
        let mut total = size;
        while total >= v {
            ways[total] += ways[total - v];
            if total == 0 {
                break;
            }
            total -= 1;
        }
    }
    ways[size]
}

fn sum_of(nums: &[i32]) -> i32 {
    nums.iter().sum()
}

fn floor_mod2(value: i32) -> i32 {
    let m = value % 2;
    if m < 0 { m + 2 } else { m }
}

fn floor_div2(value: i32) -> i32 {
    if value >= 0 { value / 2 } else { -((-value + 1) / 2) }
}

/// The reduction, with both guards.
fn count_signs(nums: &[i32], target: i32) -> i64 {
    let total = sum_of(nums);
    if target > total || target < -total {
        return 0; // outside [-total, total]
    }
    if floor_mod2(total + target) == 1 {
        return 0; // the plus pile would be a half-integer
    }
    count_subsets(nums, (total + target) / 2)
}

/// The same arithmetic with the guards deleted.
fn count_signs_unguarded(nums: &[i32], target: i32) -> i64 {
    let plus = floor_div2(sum_of(nums) + target);
    if plus < 0 {
        return 0; // a negative size would break the table
    }
    count_subsets(nums, plus)
}

/// Every assignment of signs, counted.
fn brute(nums: &[i32], target: i32) -> i64 {
    let mut found = 0i64;
    for mask in 0..(1usize << nums.len()) {
        let mut value = 0;
        for i in 0..nums.len() {
            value += if mask >> i & 1 == 1 { nums[i] } else { -nums[i] };
        }
        if value == target {
            found += 1;
        }
    }
    found
}

fn show(nums: &[i32]) -> String {
    format!("[{}]", nums.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(", "))
}

fn rand(seed: &mut i64, n: i64) -> i32 {
    *seed = (*seed * 1103515245 + 12345) % 2147483648;
    (*seed / 65536 % n) as i32
}

fn main() {
    let nums: Vec<i32> = vec![1, 1, 1, 1, 1];
    println!("numbers {}, total {}", show(&nums), sum_of(&nums));
    println!();
    println!("{:>8}{:>10}{:>12}{:>19}", "target", "guarded", "unguarded", "every assignment");
    for target in -7..=7 {
        println!("{:>8}{:>10}{:>12}{:>19}", target, count_signs(&nums, target),
            count_signs_unguarded(&nums, target), brute(&nums, target));
    }
    println!();

    let other: Vec<i32> = vec![1, 2, 3, 4, 5];
    println!("numbers {}, total {}", show(&other), sum_of(&other));
    println!("{:>8}{:>10}{:>12}{:>19}", "target", "guarded", "unguarded", "every assignment");
    for target in -4..=4 {
        println!("{:>8}{:>10}{:>12}{:>19}", target, count_signs(&other, target),
            count_signs_unguarded(&other, target), brute(&other, target));
    }
    println!();

    const TRIALS: i32 = 5000;
    let mut seed = 1i64;
    let mut guarded_right = 0;
    let mut unguarded_right = 0;
    let mut parity_cases = 0;
    let mut range_cases = 0;
    for _ in 0..TRIALS {
        let n = 1 + rand(&mut seed, 7);
        let values: Vec<i32> = (0..n).map(|_| 1 + rand(&mut seed, 6)).collect();
        let total = sum_of(&values);
        let target = rand(&mut seed, (2 * total + 7) as i64) - total - 3;
        let truth = brute(&values, target);
        if count_signs(&values, target) == truth {
            guarded_right += 1;
        }
        if count_signs_unguarded(&values, target) == truth {
            unguarded_right += 1;
        }
        if target.abs() <= total && floor_mod2(total + target) == 1 {
            parity_cases += 1;
        }
        if target.abs() > total {
            range_cases += 1;
        }
    }

    println!("over {} random problems:", TRIALS);
    println!("  {} have a target of the wrong parity, {} a target outside the range", parity_cases, range_cases);
    println!("  with both guards           {:>6} correct", guarded_right);
    println!("  without them               {:>6} correct", unguarded_right);
}
`,
            },
            {
              lang: "go",
              code: `// "Put a plus or a minus in front of each number so the result is T" looks like a
// different problem and is subset sum again, with counting instead of
// reachability. The plus pile P and the minus pile N satisfy P + N = total and
// P - N = T, so P = (total + T) / 2 -- and the reduction is only legal when that
// division is exact and lands inside the set.
//
// Two guards, then a counting table. Removing the guards does not crash; it
// answers a question about a target nobody asked for.
package main

import (
	"fmt"
	"strconv"
	"strings"
)

// How many subsets of nums add up to exactly \`target\`.
func countSubsets(nums []int, target int) int64 {
	ways := make([]int64, target+1)
	ways[0] = 1 // one way to make nothing: take nothing
	for _, value := range nums {
		for total := target; total >= value; total-- {
			ways[total] += ways[total-value]
		}
	}
	return ways[target]
}

func sum(nums []int) int {
	total := 0
	for _, v := range nums {
		total += v
	}
	return total
}

func floorMod2(value int) int {
	m := value % 2
	if m < 0 {
		m += 2
	}
	return m
}

func floorDiv2(value int) int {
	if value >= 0 {
		return value / 2
	}
	return -((-value + 1) / 2)
}

// The reduction, with both guards.
func countSigns(nums []int, target int) int64 {
	total := sum(nums)
	if target > total || target < -total {
		return 0 // outside [-total, total]
	}
	if floorMod2(total+target) == 1 {
		return 0 // the plus pile would be a half-integer
	}
	return countSubsets(nums, (total+target)/2)
}

// The same arithmetic with the guards deleted.
func countSignsUnguarded(nums []int, target int) int64 {
	plus := floorDiv2(sum(nums) + target)
	if plus < 0 {
		return 0 // a negative size would break the table
	}
	return countSubsets(nums, plus)
}

// Every assignment of signs, counted.
func brute(nums []int, target int) int64 {
	var found int64
	for mask := 0; mask < 1<<len(nums); mask++ {
		value := 0
		for i := range nums {
			if mask>>i&1 == 1 {
				value += nums[i]
			} else {
				value -= nums[i]
			}
		}
		if value == target {
			found++
		}
	}
	return found
}

func show(nums []int) string {
	parts := make([]string, len(nums))
	for i, v := range nums {
		parts[i] = strconv.Itoa(v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func abs(v int) int {
	if v < 0 {
		return -v
	}
	return v
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	nums := []int{1, 1, 1, 1, 1}
	fmt.Printf("numbers %s, total %d\\n", show(nums), sum(nums))
	fmt.Println()
	fmt.Printf("%8s%10s%12s%19s\\n", "target", "guarded", "unguarded", "every assignment")
	for target := -7; target <= 7; target++ {
		fmt.Printf("%8d%10d%12d%19d\\n", target, countSigns(nums, target),
			countSignsUnguarded(nums, target), brute(nums, target))
	}
	fmt.Println()

	other := []int{1, 2, 3, 4, 5}
	fmt.Printf("numbers %s, total %d\\n", show(other), sum(other))
	fmt.Printf("%8s%10s%12s%19s\\n", "target", "guarded", "unguarded", "every assignment")
	for target := -4; target <= 4; target++ {
		fmt.Printf("%8d%10d%12d%19d\\n", target, countSigns(other, target),
			countSignsUnguarded(other, target), brute(other, target))
	}
	fmt.Println()

	const TRIALS = 5000
	guardedRight, unguardedRight, parityCases, rangeCases := 0, 0, 0, 0
	for t := 0; t < TRIALS; t++ {
		n := 1 + rand(7)
		values := make([]int, n)
		for i := 0; i < n; i++ {
			values[i] = 1 + rand(6)
		}
		total := sum(values)
		target := rand(2*total+7) - total - 3
		truth := brute(values, target)
		if countSigns(values, target) == truth {
			guardedRight++
		}
		if countSignsUnguarded(values, target) == truth {
			unguardedRight++
		}
		if abs(target) <= total && floorMod2(total+target) == 1 {
			parityCases++
		}
		if abs(target) > total {
			rangeCases++
		}
	}

	fmt.Printf("over %d random problems:\\n", TRIALS)
	fmt.Printf("  %d have a target of the wrong parity, %d a target outside the range\\n", parityCases, rangeCases)
	fmt.Printf("  with both guards           %6d correct\\n", guardedRight)
	fmt.Printf("  without them               %6d correct\\n", unguardedRight)
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Negative operands make % and / mean less than you think",
          body: "In most languages `(-3) / 2` is \u22121 and `(-3) % 2` is \u22121, because both round toward zero rather than down. A parity test written `x % 2 == 1` therefore misses negative odd numbers entirely, which for this reduction means the guard silently stops guarding on exactly the inputs that need it. The programs here use a floored remainder for that reason.",
        },
        {
          title: "Counting and testing need different base cases",
          body: "The reachability table starts with `hit[0] = true` and combines with or; the counting table starts with `ways[0] = 1` and combines with addition. Copying one and changing only the type gives a table that counts nothing, because false and zero are the identity for the wrong operator. Module 27 lesson 4 is the general statement; this is the place it usually bites.",
        },
      ],
    },
    {
      id: "the-family",
      heading: "One table, three questions",
      body: [
        "Three problems, one table. What they share is worth stating plainly, because it is the recognition rule.",
        "**Subset sum**: is a total reachable? Booleans, or-transition, `hit[0] = true`.",
        "**Partition**: is `total / 2` reachable? The same table, one guard, one lookup.",
        "**Target sum**: how many ways to reach `(total + T) / 2`? The same table counting instead of testing, two guards, one lookup.",
        "The pattern to recognise is not the word subset. It is: **one additive quantity, a target that is a number rather than a length, and a question that is reachable / how many / how few.** Coin change from module 27 is the same shape with repetition allowed. Partition into k equal piles is the same shape with an extra dimension. Balanced-partition \u2014 split so the two piles are as close as possible rather than equal \u2014 is the same table read at a different cell, the largest reachable total not exceeding half.",
        "And the cost is the same in all of them: the number of states is the target, not the input length, so these are pseudo-polynomial. A target of `10^9` is not a bigger instance of this problem, it is a different problem, and module 27 lesson 3 gave the reason.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How is subset sum related to knapsack?",
      answer:
        "It is knapsack with the value column deleted. There is nothing to maximise, so a cell holds whether a total is reachable rather than how much value fits, the transition becomes an or instead of a max, and the base case becomes `hit[0] = true`. You can see the equivalence directly by running knapsack with the value of each item set equal to its weight: the best you can pack into a bag of size s is exactly s precisely when s is reachable, so comparing that row against its own index reproduces the boolean table. Everything from the knapsack lesson still carries over \u2014 the loop direction still decides whether items repeat, and the initialisation still decides at-most against exactly.",
    },
    {
      question: "Given an array, can it be split into two subsets with equal sums?",
      answer:
        "It is subset sum with the target fixed at half the total, plus one guard that is part of the reduction rather than an optimisation: if the total is odd the answer is no, because two equal integers cannot sum to an odd number. Without that check, `total / 2` is integer division on an odd number and you end up asking about a target half a unit from the one you meant \u2014 `[1, 2]` cannot be split and the unguarded version says it can, since 1 is reachable and 3 / 2 is 1. On five thousand random sets the guarded version is right every time and the unguarded one on 3,303, failing on 1,697 of the 2,524 odd-total cases.",
    },
    {
      question: "Count the ways to put a plus or minus in front of each number so the result is T.",
      answer:
        "Let P be the numbers given a plus and N those given a minus. P + N is the total and P \u2212 N is T, so P is (total + T) / 2, and every sign assignment is a choice of which numbers go into P. So the answer is the number of subsets summing to (total + T) / 2 \u2014 subset sum, counting rather than testing, which means `ways[0] = 1` and an addition instead of an or. Two guards make the reduction legal: T must lie within [\u2212total, total], since no assignment reaches further than the numbers themselves, and total + T must be even, or the plus pile would need half a unit. I would also be careful writing the parity test, because in most languages `%` rounds toward zero, so `x % 2 == 1` is false for negative odd numbers and the guard quietly stops working on exactly the inputs it exists for.",
    },
  ],
  takeaways: [
    "Subset sum is knapsack with the value column deleted: booleans instead of numbers, or instead of max.",
    "Running knapsack with value equal to weight reproduces the boolean row exactly \u2014 the reduction is checkable, not just assertable.",
    "Because the cells are bits, the whole row fits in a bitset and the transition becomes one shift-and-or.",
    "Equal partition is subset sum at total / 2, and the odd-total guard is part of the reduction rather than a fast path.",
    "Without that guard the answer is wrong on 1,697 of 2,524 odd-total sets \u2014 [1, 2] reports that it can be split.",
    "Target sum reduces to counting subsets that reach (total + T) / 2, with guards on both parity and range.",
    "Counting needs ways[0] = 1 and addition; reachability needs hit[0] = true and or. The identity has to match the operator.",
    "In most languages % rounds toward zero, so a parity test written x % 2 == 1 stops guarding on negative targets.",
  ],
  status: "available",
};
