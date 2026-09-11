import type { Lesson } from "@/content/types";

export const longestIncreasingSubsequenceLesson: Lesson = {
  id: "dsa-dp-longest-increasing-subsequence",
  slug: "longest-increasing-subsequence",
  moduleSlug: "dynamic-programming-patterns",
  title: "Longest Increasing Subsequence",
  summary:
    "The pattern where the obvious state does not work. Why the answer is the largest cell rather than the last, what the `tails` array really holds and why its contents are not the subsequence, the one comparison that separates strict from non-strict, and the sort that turns two-dimensional problems into this one \u2014 including the tie-ordering that quietly breaks it.",
  estimatedMinutes: 45,
  objectives: [
    "Explain why the state has to name an ending rather than a prefix",
    "Write both the quadratic table and the O(n log n) tails method, and say what each one can reconstruct",
    "Get the strict and non-strict variants right in both implementations",
    "Reduce a two-dimensional problem by sorting, and order the ties so the reduction stays correct",
  ],
  sections: [
    {
      id: "the-state-that-names-an-ending",
      heading: "The state that names an ending",
      body: [
        "The state here is a single index, and what makes the family hard is that the obvious state is not the one that works.",
        "The obvious attempt is `best(i)` meaning \"the longest increasing run in the first `i` values\". It fails the second precondition from module 27: knowing that answer for a prefix tells you nothing about whether the next value can be appended, because it does not say what the run *ended on*. The fix is to move the ending into the state. Define `ending[i]` as the longest increasing run that finishes exactly at index `i`, and the transition falls out: look back at every `j < i` with `values[j] < values[i]` and take the best of those, plus one.",
        "That relocation is the whole trick, and it costs something visible. The answer is no longer the last cell \u2014 it is the largest cell anywhere in the array, because the best run can end at any index. On the demo below the table reads `1 2 1 1 3 2 3 4 3 4 4 5` and the answer is 5, which happens to sit at the end; change the last value to a 0 and it would not.",
        "The second algorithm in the example is the one worth knowing, and it is not a table at all. Keep an array `tails` where `tails[k]` is the smallest value that any increasing run of length `k + 1` can end on. Each new value either extends that array or replaces the first entry not below it, found by binary search \u2014 `O(n log n)` instead of `O(n^2)`, and both are scored below against enumerating all 4,096 subsequences of the demo, then against 3,000 random arrays. Both are right 3,000 times out of 3,000.",
        "There is one thing about `tails` that catches people, and the example measures it rather than asserting it. The **length** of that array is always the answer. The **contents** are not always a subsequence of the input. On the demo they happen to be \u2014 `[1, 4, 5, 7, 15]` really does appear in order \u2014 but on `[2, 6, 8, 3, 4, 5, 1]` the tails end up `[1, 3, 4, 5]`, and the 1 arrived last, after everything it would have to come before. Over 3,000 random arrays the array happened to be a genuine subsequence 1,804 times, which is often enough to fool a spot check and rare enough to break in production.",
        "So if the question asks for the subsequence itself and not just its length, `tails` is not enough on its own; the quadratic table with a parent pointer is, and module 27 lesson 7 covers that reconstruction.",
      ],
      examples: [
        {
          id: "quadratic-and-tails",
          title: "Both algorithms, and what the tails array is not",
          lang: "python",
          code: `# Module 27 lesson 3 settled what the state has to be: the longest run *ending
# at* i, not the longest run among the first i, because only the first pins down
# what the run ends on and so whether the next value can extend it.
#
# This is that state built out, and then the same problem solved a second time by
# an algorithm that is not a dynamic program at all -- it keeps one array of
# "the smallest value a run of each length can end on" and binary searches it.

BIG = 10 ** 6


def quadratic(values):
    """dp[i] is the longest increasing run ending exactly at i. O(n^2)."""
    ending = [1] * len(values)
    for i in range(len(values)):
        for j in range(i):
            if values[j] < values[i] and ending[j] + 1 > ending[i]:
                ending[i] = ending[j] + 1
    return max(ending) if ending else 0


def patience(values):
    """tails[k] is the smallest value any run of length k+1 can end on.

    That array is always sorted, which is the whole trick: a new value either
    extends the longest run, or replaces the first tail it is not larger than.
    Binary search finds that place in log time, so the whole thing is O(n log n).
    """
    tails = []
    for value in values:
        lo, hi = 0, len(tails)
        while lo < hi:
            mid = (lo + hi) // 2
            if tails[mid] < value:
                lo = mid + 1
            else:
                hi = mid
        if lo == len(tails):
            tails.append(value)
        else:
            tails[lo] = value
    return len(tails)


def brute(values):
    """Every subsequence, checked for being increasing."""
    best = 0
    for mask in range(1 << len(values)):
        picked = [values[i] for i in range(len(values)) if mask >> i & 1]
        rising = all(picked[k] < picked[k + 1] for k in range(len(picked) - 1))
        if rising and len(picked) > best:
            best = len(picked)
    return best


def show(values):
    return "[" + ", ".join(str(v) for v in values) + "]"


DEMO = [3, 10, 2, 1, 20, 4, 6, 21, 5, 11, 7, 15]
ending = [1] * len(DEMO)
for i in range(len(DEMO)):
    for j in range(i):
        if DEMO[j] < DEMO[i] and ending[j] + 1 > ending[i]:
            ending[i] = ending[j] + 1

print(f"values {show(DEMO)}")
print()
print("  index  " + "".join(f"{i:>4}" for i in range(len(DEMO))))
print("  value  " + "".join(f"{v:>4}" for v in DEMO))
print("  dp     " + "".join(f"{d:>4}" for d in ending))
print()
print(f"the answer is the largest of those:            {max(ending)}")
print(f"the tails array, walked once with a binary search: {patience(DEMO)}")
print(f"every one of the {1 << len(DEMO)} subsequences agrees:      {brute(DEMO)}")
print()

# The tails array is not the answer. Its length is right; its contents are only
# sometimes a real subsequence of the input, and never reliably so -- which is
# checked here rather than claimed.
def tails_of(values):
    tails = []
    for value in values:
        lo, hi = 0, len(tails)
        while lo < hi:
            mid = (lo + hi) // 2
            if tails[mid] < value:
                lo = mid + 1
            else:
                hi = mid
        if lo == len(tails):
            tails.append(value)
        else:
            tails[lo] = value
    return tails


def is_subsequence(small, big):
    j = 0
    for value in big:
        if j < len(small) and small[j] == value:
            j += 1
    return j == len(small)


TRAP = [2, 6, 8, 3, 4, 5, 1]
print(f"{'input':<44}{'tails':<20}{'a real subsequence?':>21}")
for values in (DEMO, TRAP):
    tails = tails_of(values)
    print(f"{show(values):<44}{show(tails):<20}"
          f"{('yes' if is_subsequence(tails, values) else 'no'):>21}")
print()
print("so the length is always the answer and the contents are not always a run:")
print("in the second array 1 arrives last and overwrites the first tail, leaving")
print("an array that could never have been read off the input in order.")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
quad_ok = 0
fast_ok = 0
agree = 0
tails_valid = 0
for _ in range(TRIALS):
    n = 1 + rand(12)
    values = [1 + rand(20) for _ in range(n)]
    truth = brute(values)
    a = quadratic(values)
    b = patience(values)
    if a == truth:
        quad_ok += 1
    if b == truth:
        fast_ok += 1
    if a == b:
        agree += 1
    if is_subsequence(tails_of(values), values):
        tails_valid += 1

print(f"over {TRIALS} random arrays, against every subsequence:")
print(f"  the O(n^2) table          {quad_ok:>6}")
print(f"  the O(n log n) tails      {fast_ok:>6}")
print(f"  and the two agree         {agree:>6}")
print(f"  the tails array happens to be a real subsequence   {tails_valid:>6}")
`,
          output: `values [3, 10, 2, 1, 20, 4, 6, 21, 5, 11, 7, 15]

  index     0   1   2   3   4   5   6   7   8   9  10  11
  value     3  10   2   1  20   4   6  21   5  11   7  15
  dp        1   2   1   1   3   2   3   4   3   4   4   5

the answer is the largest of those:            5
the tails array, walked once with a binary search: 5
every one of the 4096 subsequences agrees:      5

input                                       tails                 a real subsequence?
[3, 10, 2, 1, 20, 4, 6, 21, 5, 11, 7, 15]   [1, 4, 5, 7, 15]                      yes
[2, 6, 8, 3, 4, 5, 1]                       [1, 3, 4, 5]                           no

so the length is always the answer and the contents are not always a run:
in the second array 1 arrives last and overwrites the first tail, leaving
an array that could never have been read off the input in order.

over 3000 random arrays, against every subsequence:
  the O(n^2) table            3000
  the O(n log n) tails        3000
  and the two agree           3000
  the tails array happens to be a real subsequence     1804`,
          explanation:
            "Both algorithms, scored against enumerating every subsequence. The second block is the part worth reading twice: it checks programmatically whether the tails array is a subsequence of the input, finds a case where it is not, and then counts how often that happens over 3,000 random arrays rather than leaving it as a claim.",
          alternates: [
            {
              lang: "javascript",
              code: `// Module 27 lesson 3 settled what the state has to be: the longest run *ending
// at* i, not the longest run among the first i, because only the first pins down
// what the run ends on and so whether the next value can extend it.
//
// This is that state built out, and then the same problem solved a second time by
// an algorithm that is not a dynamic program at all -- it keeps one array of
// "the smallest value a run of each length can end on" and binary searches it.

/** dp[i] is the longest increasing run ending exactly at i. O(n^2). */
function quadratic(values) {
  const ending = new Array(values.length).fill(1);
  let best = 0;
  for (let i = 0; i < values.length; i++) {
    for (let j = 0; j < i; j++) {
      if (values[j] < values[i] && ending[j] + 1 > ending[i]) ending[i] = ending[j] + 1;
    }
    if (ending[i] > best) best = ending[i];
  }
  return best;
}

/**
 * tails[k] is the smallest value any run of length k+1 can end on.
 *
 * That array is always sorted, which is the whole trick: a new value either
 * extends the longest run, or replaces the first tail it is not larger than.
 * Binary search finds that place in log time, so the whole thing is O(n log n).
 */
function tailsOf(values) {
  const tails = [];
  for (const value of values) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (tails[mid] < value) lo = mid + 1;
      else hi = mid;
    }
    if (lo === tails.length) tails.push(value);
    else tails[lo] = value;
  }
  return tails;
}

function patience(values) {
  return tailsOf(values).length;
}

/** Every subsequence, checked for being increasing. */
function brute(values) {
  let best = 0;
  for (let mask = 0; mask < 1 << values.length; mask++) {
    const picked = values.filter((_, i) => (mask >> i) & 1);
    let rising = true;
    for (let k = 0; k + 1 < picked.length; k++) if (picked[k] >= picked[k + 1]) rising = false;
    if (rising && picked.length > best) best = picked.length;
  }
  return best;
}

function isSubsequence(small, big) {
  let j = 0;
  for (const value of big) if (j < small.length && small[j] === value) j++;
  return j === small.length;
}

const show = (values) => \`[\${values.join(", ")}]\`;

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);

const DEMO = [3, 10, 2, 1, 20, 4, 6, 21, 5, 11, 7, 15];
const TRAP = [2, 6, 8, 3, 4, 5, 1];

const ending = new Array(DEMO.length).fill(1);
for (let i = 0; i < DEMO.length; i++) {
  for (let j = 0; j < i; j++) {
    if (DEMO[j] < DEMO[i] && ending[j] + 1 > ending[i]) ending[i] = ending[j] + 1;
  }
}

console.log(\`values \${show(DEMO)}\`);
console.log();
console.log("  index  " + DEMO.map((_, i) => pad(i, 4)).join(""));
console.log("  value  " + DEMO.map((v) => pad(v, 4)).join(""));
console.log("  dp     " + ending.map((d) => pad(d, 4)).join(""));
console.log();
console.log(\`the answer is the largest of those:            \${Math.max(...ending)}\`);
console.log(\`the tails array, walked once with a binary search: \${patience(DEMO)}\`);
console.log(\`every one of the \${1 << DEMO.length} subsequences agrees:      \${brute(DEMO)}\`);
console.log();

// The tails array is not the answer. Its length is right; its contents are only
// sometimes a real subsequence of the input, and never reliably so -- which is
// checked here rather than claimed.
console.log(padEnd("input", 44) + padEnd("tails", 20) + pad("a real subsequence?", 21));
for (const values of [DEMO, TRAP]) {
  const tails = tailsOf(values);
  console.log(
    padEnd(show(values), 44) + padEnd(show(tails), 20) +
      pad(isSubsequence(tails, values) ? "yes" : "no", 21)
  );
}
console.log();
console.log("so the length is always the answer and the contents are not always a run:");
console.log("in the second array 1 arrives last and overwrites the first tail, leaving");
console.log("an array that could never have been read off the input in order.");
console.log();

const TRIALS = 3000;
let quadOk = 0;
let fastOk = 0;
let agree = 0;
let tailsValid = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 1 + rand(12);
  const values = Array.from({ length: n }, () => 1 + rand(20));
  const truth = brute(values);
  const a = quadratic(values);
  const b = patience(values);
  if (a === truth) quadOk++;
  if (b === truth) fastOk++;
  if (a === b) agree++;
  if (isSubsequence(tailsOf(values), values)) tailsValid++;
}

console.log(\`over \${TRIALS} random arrays, against every subsequence:\`);
console.log(\`  the O(n^2) table          \${pad(quadOk, 6)}\`);
console.log(\`  the O(n log n) tails      \${pad(fastOk, 6)}\`);
console.log(\`  and the two agree         \${pad(agree, 6)}\`);
console.log(\`  the tails array happens to be a real subsequence   \${pad(tailsValid, 6)}\`);
`,
            },
            {
              lang: "typescript",
              code: `// Module 27 lesson 3 settled what the state has to be: the longest run *ending
// at* i, not the longest run among the first i, because only the first pins down
// what the run ends on and so whether the next value can extend it.
//
// This is that state built out, and then the same problem solved a second time by
// an algorithm that is not a dynamic program at all -- it keeps one array of
// "the smallest value a run of each length can end on" and binary searches it.

/** dp[i] is the longest increasing run ending exactly at i. O(n^2). */
function quadratic(values: number[]): number {
  const ending = new Array(values.length).fill(1);
  let best = 0;
  for (let i = 0; i < values.length; i++) {
    for (let j = 0; j < i; j++) {
      if (values[j] < values[i] && ending[j] + 1 > ending[i]) ending[i] = ending[j] + 1;
    }
    if (ending[i] > best) best = ending[i];
  }
  return best;
}

/**
 * tails[k] is the smallest value any run of length k+1 can end on.
 *
 * That array is always sorted, which is the whole trick: a new value either
 * extends the longest run, or replaces the first tail it is not larger than.
 * Binary search finds that place in log time, so the whole thing is O(n log n).
 */
function tailsOf(values: number[]): number[] {
  const tails: number[] = [];
  for (const value of values) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (tails[mid] < value) lo = mid + 1;
      else hi = mid;
    }
    if (lo === tails.length) tails.push(value);
    else tails[lo] = value;
  }
  return tails;
}

function patience(values: number[]): number {
  return tailsOf(values).length;
}

/** Every subsequence, checked for being increasing. */
function brute(values: number[]): number {
  let best = 0;
  for (let mask = 0; mask < 1 << values.length; mask++) {
    const picked = values.filter((_, i) => (mask >> i) & 1);
    let rising = true;
    for (let k = 0; k + 1 < picked.length; k++) if (picked[k] >= picked[k + 1]) rising = false;
    if (rising && picked.length > best) best = picked.length;
  }
  return best;
}

function isSubsequence(small: number[], big: number[]): boolean {
  let j = 0;
  for (const value of big) if (j < small.length && small[j] === value) j++;
  return j === small.length;
}

const show = (values: number[]): string => \`[\${values.join(", ")}]\`;

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

const DEMO = [3, 10, 2, 1, 20, 4, 6, 21, 5, 11, 7, 15];
const TRAP = [2, 6, 8, 3, 4, 5, 1];

const ending = new Array(DEMO.length).fill(1);
for (let i = 0; i < DEMO.length; i++) {
  for (let j = 0; j < i; j++) {
    if (DEMO[j] < DEMO[i] && ending[j] + 1 > ending[i]) ending[i] = ending[j] + 1;
  }
}

console.log(\`values \${show(DEMO)}\`);
console.log();
console.log("  index  " + DEMO.map((_, i) => pad(i, 4)).join(""));
console.log("  value  " + DEMO.map((v) => pad(v, 4)).join(""));
console.log("  dp     " + ending.map((d) => pad(d, 4)).join(""));
console.log();
console.log(\`the answer is the largest of those:            \${Math.max(...ending)}\`);
console.log(\`the tails array, walked once with a binary search: \${patience(DEMO)}\`);
console.log(\`every one of the \${1 << DEMO.length} subsequences agrees:      \${brute(DEMO)}\`);
console.log();

// The tails array is not the answer. Its length is right; its contents are only
// sometimes a real subsequence of the input, and never reliably so -- which is
// checked here rather than claimed.
console.log(padEnd("input", 44) + padEnd("tails", 20) + pad("a real subsequence?", 21));
for (const values of [DEMO, TRAP]) {
  const tails = tailsOf(values);
  console.log(
    padEnd(show(values), 44) + padEnd(show(tails), 20) +
      pad(isSubsequence(tails, values) ? "yes" : "no", 21)
  );
}
console.log();
console.log("so the length is always the answer and the contents are not always a run:");
console.log("in the second array 1 arrives last and overwrites the first tail, leaving");
console.log("an array that could never have been read off the input in order.");
console.log();

const TRIALS = 3000;
let quadOk = 0;
let fastOk = 0;
let agree = 0;
let tailsValid = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 1 + rand(12);
  const values = Array.from({ length: n }, () => 1 + rand(20));
  const truth = brute(values);
  const a = quadratic(values);
  const b = patience(values);
  if (a === truth) quadOk++;
  if (b === truth) fastOk++;
  if (a === b) agree++;
  if (isSubsequence(tailsOf(values), values)) tailsValid++;
}

console.log(\`over \${TRIALS} random arrays, against every subsequence:\`);
console.log(\`  the O(n^2) table          \${pad(quadOk, 6)}\`);
console.log(\`  the O(n log n) tails      \${pad(fastOk, 6)}\`);
console.log(\`  and the two agree         \${pad(agree, 6)}\`);
console.log(\`  the tails array happens to be a real subsequence   \${pad(tailsValid, 6)}\`);
`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.List;

// Module 27 lesson 3 settled what the state has to be: the longest run *ending
// at* i, not the longest run among the first i, because only the first pins down
// what the run ends on and so whether the next value can extend it.
//
// This is that state built out, and then the same problem solved a second time by
// an algorithm that is not a dynamic program at all -- it keeps one array of
// "the smallest value a run of each length can end on" and binary searches it.
public class Main {
    /** dp[i] is the longest increasing run ending exactly at i. O(n^2). */
    static int quadratic(int[] values) {
        int[] ending = new int[values.length];
        int best = 0;
        for (int i = 0; i < values.length; i++) {
            ending[i] = 1;
            for (int j = 0; j < i; j++) {
                if (values[j] < values[i] && ending[j] + 1 > ending[i]) ending[i] = ending[j] + 1;
            }
            if (ending[i] > best) best = ending[i];
        }
        return best;
    }

    /**
     * tails[k] is the smallest value any run of length k+1 can end on.
     *
     * That array is always sorted, which is the whole trick: a new value either
     * extends the longest run, or replaces the first tail it is not larger than.
     * Binary search finds that place in log time, so the whole thing is O(n log n).
     */
    static List<Integer> tailsOf(int[] values) {
        List<Integer> tails = new ArrayList<>();
        for (int value : values) {
            int lo = 0;
            int hi = tails.size();
            while (lo < hi) {
                int mid = (lo + hi) / 2;
                if (tails.get(mid) < value) lo = mid + 1;
                else hi = mid;
            }
            if (lo == tails.size()) tails.add(value);
            else tails.set(lo, value);
        }
        return tails;
    }

    static int patience(int[] values) {
        return tailsOf(values).size();
    }

    /** Every subsequence, checked for being increasing. */
    static int brute(int[] values) {
        int best = 0;
        for (int mask = 0; mask < (1 << values.length); mask++) {
            List<Integer> picked = new ArrayList<>();
            for (int i = 0; i < values.length; i++) {
                if ((mask >> i & 1) == 1) picked.add(values[i]);
            }
            boolean rising = true;
            for (int k = 0; k + 1 < picked.size(); k++) {
                if (picked.get(k) >= picked.get(k + 1)) rising = false;
            }
            if (rising && picked.size() > best) best = picked.size();
        }
        return best;
    }

    static boolean isSubsequence(List<Integer> small, int[] big) {
        int j = 0;
        for (int value : big) {
            if (j < small.size() && small.get(j) == value) j++;
        }
        return j == small.size();
    }

    static String show(int[] values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(values[i]);
        }
        return sb.append("]").toString();
    }

    static String showList(List<Integer> values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(values.get(i));
        }
        return sb.append("]").toString();
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    static final int[] DEMO = { 3, 10, 2, 1, 20, 4, 6, 21, 5, 11, 7, 15 };
    static final int[] TRAP = { 2, 6, 8, 3, 4, 5, 1 };

    public static void main(String[] args) {
        int[] ending = new int[DEMO.length];
        for (int i = 0; i < DEMO.length; i++) {
            ending[i] = 1;
            for (int j = 0; j < i; j++) {
                if (DEMO[j] < DEMO[i] && ending[j] + 1 > ending[i]) ending[i] = ending[j] + 1;
            }
        }

        System.out.printf("values %s%n", show(DEMO));
        System.out.println();
        StringBuilder idx = new StringBuilder("  index  ");
        StringBuilder val = new StringBuilder("  value  ");
        StringBuilder dp = new StringBuilder("  dp     ");
        int best = 0;
        for (int i = 0; i < DEMO.length; i++) {
            idx.append(String.format("%4d", i));
            val.append(String.format("%4d", DEMO[i]));
            dp.append(String.format("%4d", ending[i]));
            if (ending[i] > best) best = ending[i];
        }
        System.out.println(idx);
        System.out.println(val);
        System.out.println(dp);
        System.out.println();
        System.out.printf("the answer is the largest of those:            %d%n", best);
        System.out.printf("the tails array, walked once with a binary search: %d%n", patience(DEMO));
        System.out.printf("every one of the %d subsequences agrees:      %d%n",
            1 << DEMO.length, brute(DEMO));
        System.out.println();

        // The tails array is not the answer. Its length is right; its contents are
        // only sometimes a real subsequence of the input, and never reliably so --
        // which is checked here rather than claimed.
        System.out.printf("%-44s%-20s%21s%n", "input", "tails", "a real subsequence?");
        for (int[] values : new int[][] { DEMO, TRAP }) {
            List<Integer> tails = tailsOf(values);
            System.out.printf("%-44s%-20s%21s%n", show(values), showList(tails),
                isSubsequence(tails, values) ? "yes" : "no");
        }
        System.out.println();
        System.out.println("so the length is always the answer and the contents are not always a run:");
        System.out.println("in the second array 1 arrives last and overwrites the first tail, leaving");
        System.out.println("an array that could never have been read off the input in order.");
        System.out.println();

        final int TRIALS = 3000;
        int quadOk = 0;
        int fastOk = 0;
        int agree = 0;
        int tailsValid = 0;
        for (int t = 0; t < TRIALS; t++) {
            int n = 1 + rand(12);
            int[] values = new int[n];
            for (int i = 0; i < n; i++) values[i] = 1 + rand(20);
            int truth = brute(values);
            int a = quadratic(values);
            int b = patience(values);
            if (a == truth) quadOk++;
            if (b == truth) fastOk++;
            if (a == b) agree++;
            if (isSubsequence(tailsOf(values), values)) tailsValid++;
        }

        System.out.printf("over %d random arrays, against every subsequence:%n", TRIALS);
        System.out.printf("  the O(n^2) table          %6d%n", quadOk);
        System.out.printf("  the O(n log n) tails      %6d%n", fastOk);
        System.out.printf("  and the two agree         %6d%n", agree);
        System.out.printf("  the tails array happens to be a real subsequence   %6d%n", tailsValid);
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Module 27 lesson 3 settled what the state has to be: the longest run *ending
// at* i, not the longest run among the first i, because only the first pins down
// what the run ends on and so whether the next value can extend it.
//
// This is that state built out, and then the same problem solved a second time by
// an algorithm that is not a dynamic program at all -- it keeps one array of
// "the smallest value a run of each length can end on" and binary searches it.
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

// dp[i] is the longest increasing run ending exactly at i. O(n^2).
int quadratic(const std::vector<int> &values) {
    std::vector<int> ending(values.size(), 1);
    int best = 0;
    for (size_t i = 0; i < values.size(); i++) {
        for (size_t j = 0; j < i; j++) {
            if (values[j] < values[i] && ending[j] + 1 > ending[i]) ending[i] = ending[j] + 1;
        }
        if (ending[i] > best) best = ending[i];
    }
    return best;
}

// tails[k] is the smallest value any run of length k+1 can end on.
//
// That array is always sorted, which is the whole trick: a new value either
// extends the longest run, or replaces the first tail it is not larger than.
// Binary search finds that place in log time, so the whole thing is O(n log n).
std::vector<int> tailsOf(const std::vector<int> &values) {
    std::vector<int> tails;
    for (int value : values) {
        size_t lo = 0, hi = tails.size();
        while (lo < hi) {
            size_t mid = (lo + hi) / 2;
            if (tails[mid] < value) lo = mid + 1;
            else hi = mid;
        }
        if (lo == tails.size()) tails.push_back(value);
        else tails[lo] = value;
    }
    return tails;
}

int patience(const std::vector<int> &values) {
    return static_cast<int>(tailsOf(values).size());
}

// Every subsequence, checked for being increasing.
int brute(const std::vector<int> &values) {
    int best = 0;
    for (int mask = 0; mask < (1 << values.size()); mask++) {
        std::vector<int> picked;
        for (size_t i = 0; i < values.size(); i++) {
            if (mask >> i & 1) picked.push_back(values[i]);
        }
        bool rising = true;
        for (size_t k = 0; k + 1 < picked.size(); k++) {
            if (picked[k] >= picked[k + 1]) rising = false;
        }
        if (rising && static_cast<int>(picked.size()) > best) best = static_cast<int>(picked.size());
    }
    return best;
}

bool isSubsequence(const std::vector<int> &small, const std::vector<int> &big) {
    size_t j = 0;
    for (int value : big) {
        if (j < small.size() && small[j] == value) j++;
    }
    return j == small.size();
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

static const std::vector<int> DEMO = {3, 10, 2, 1, 20, 4, 6, 21, 5, 11, 7, 15};
static const std::vector<int> TRAP = {2, 6, 8, 3, 4, 5, 1};

int main() {
    std::vector<int> ending(DEMO.size(), 1);
    for (size_t i = 0; i < DEMO.size(); i++) {
        for (size_t j = 0; j < i; j++) {
            if (DEMO[j] < DEMO[i] && ending[j] + 1 > ending[i]) ending[i] = ending[j] + 1;
        }
    }

    std::cout << "values " << show(DEMO) << "\\n\\n";
    std::cout << "  index  ";
    for (size_t i = 0; i < DEMO.size(); i++) std::cout << std::right << std::setw(4) << i;
    std::cout << "\\n  value  ";
    for (int v : DEMO) std::cout << std::right << std::setw(4) << v;
    std::cout << "\\n  dp     ";
    int best = 0;
    for (int v : ending) {
        std::cout << std::right << std::setw(4) << v;
        if (v > best) best = v;
    }
    std::cout << "\\n\\n";
    std::cout << "the answer is the largest of those:            " << best << "\\n";
    std::cout << "the tails array, walked once with a binary search: " << patience(DEMO) << "\\n";
    std::cout << "every one of the " << (1 << DEMO.size()) << " subsequences agrees:      "
              << brute(DEMO) << "\\n\\n";

    // The tails array is not the answer. Its length is right; its contents are
    // only sometimes a real subsequence of the input, and never reliably so --
    // which is checked here rather than claimed.
    std::cout << std::left << std::setw(44) << "input" << std::setw(20) << "tails"
              << std::right << std::setw(21) << "a real subsequence?" << "\\n";
    for (const auto &values : {DEMO, TRAP}) {
        std::vector<int> tails = tailsOf(values);
        std::cout << std::left << std::setw(44) << show(values) << std::setw(20) << show(tails)
                  << std::right << std::setw(21) << (isSubsequence(tails, values) ? "yes" : "no") << "\\n";
    }
    std::cout << "\\n";
    std::cout << "so the length is always the answer and the contents are not always a run:\\n";
    std::cout << "in the second array 1 arrives last and overwrites the first tail, leaving\\n";
    std::cout << "an array that could never have been read off the input in order.\\n\\n";

    const int TRIALS = 3000;
    int quadOk = 0, fastOk = 0, agree = 0, tailsValid = 0;
    for (int t = 0; t < TRIALS; t++) {
        int n = 1 + rnd(12);
        std::vector<int> values(n);
        for (int i = 0; i < n; i++) values[i] = 1 + rnd(20);
        int truth = brute(values);
        int a = quadratic(values);
        int b = patience(values);
        if (a == truth) quadOk++;
        if (b == truth) fastOk++;
        if (a == b) agree++;
        if (isSubsequence(tailsOf(values), values)) tailsValid++;
    }

    std::cout << "over " << TRIALS << " random arrays, against every subsequence:\\n";
    std::cout << "  the O(n^2) table          " << std::setw(6) << quadOk << "\\n";
    std::cout << "  the O(n log n) tails      " << std::setw(6) << fastOk << "\\n";
    std::cout << "  and the two agree         " << std::setw(6) << agree << "\\n";
    std::cout << "  the tails array happens to be a real subsequence   " << std::setw(6)
              << tailsValid << "\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// Module 27 lesson 3 settled what the state has to be: the longest run *ending
// at* i, not the longest run among the first i, because only the first pins down
// what the run ends on and so whether the next value can extend it.
//
// This is that state built out, and then the same problem solved a second time by
// an algorithm that is not a dynamic program at all -- it keeps one array of
// "the smallest value a run of each length can end on" and binary searches it.

/// dp[i] is the longest increasing run ending exactly at i. O(n^2).
fn quadratic(values: &[i32]) -> i32 {
    let mut ending = vec![1i32; values.len()];
    let mut best = 0;
    for i in 0..values.len() {
        for j in 0..i {
            if values[j] < values[i] && ending[j] + 1 > ending[i] {
                ending[i] = ending[j] + 1;
            }
        }
        if ending[i] > best {
            best = ending[i];
        }
    }
    best
}

/// tails[k] is the smallest value any run of length k+1 can end on.
///
/// That array is always sorted, which is the whole trick: a new value either
/// extends the longest run, or replaces the first tail it is not larger than.
/// Binary search finds that place in log time, so the whole thing is O(n log n).
fn tails_of(values: &[i32]) -> Vec<i32> {
    let mut tails: Vec<i32> = Vec::new();
    for &value in values {
        let (mut lo, mut hi) = (0usize, tails.len());
        while lo < hi {
            let mid = (lo + hi) / 2;
            if tails[mid] < value {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        if lo == tails.len() {
            tails.push(value);
        } else {
            tails[lo] = value;
        }
    }
    tails
}

fn patience(values: &[i32]) -> i32 {
    tails_of(values).len() as i32
}

/// Every subsequence, checked for being increasing.
fn brute(values: &[i32]) -> i32 {
    let mut best = 0;
    for mask in 0..(1usize << values.len()) {
        let picked: Vec<i32> = (0..values.len())
            .filter(|i| mask >> i & 1 == 1)
            .map(|i| values[i])
            .collect();
        let rising = picked.windows(2).all(|w| w[0] < w[1]);
        if rising && picked.len() as i32 > best {
            best = picked.len() as i32;
        }
    }
    best
}

fn is_subsequence(small: &[i32], big: &[i32]) -> bool {
    let mut j = 0;
    for &value in big {
        if j < small.len() && small[j] == value {
            j += 1;
        }
    }
    j == small.len()
}

fn show(values: &[i32]) -> String {
    format!("[{}]", values.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(", "))
}

fn rand(seed: &mut i64, n: i64) -> i32 {
    *seed = (*seed * 1103515245 + 12345) % 2147483648;
    (*seed / 65536 % n) as i32
}

fn main() {
    let demo: Vec<i32> = vec![3, 10, 2, 1, 20, 4, 6, 21, 5, 11, 7, 15];
    let trap: Vec<i32> = vec![2, 6, 8, 3, 4, 5, 1];

    let mut ending = vec![1i32; demo.len()];
    for i in 0..demo.len() {
        for j in 0..i {
            if demo[j] < demo[i] && ending[j] + 1 > ending[i] {
                ending[i] = ending[j] + 1;
            }
        }
    }

    println!("values {}", show(&demo));
    println!();
    let mut idx = String::from("  index  ");
    let mut val = String::from("  value  ");
    let mut dp = String::from("  dp     ");
    let mut best = 0;
    for i in 0..demo.len() {
        idx.push_str(&format!("{:>4}", i));
        val.push_str(&format!("{:>4}", demo[i]));
        dp.push_str(&format!("{:>4}", ending[i]));
        if ending[i] > best {
            best = ending[i];
        }
    }
    println!("{}", idx);
    println!("{}", val);
    println!("{}", dp);
    println!();
    println!("the answer is the largest of those:            {}", best);
    println!("the tails array, walked once with a binary search: {}", patience(&demo));
    println!("every one of the {} subsequences agrees:      {}", 1usize << demo.len(), brute(&demo));
    println!();

    // The tails array is not the answer. Its length is right; its contents are
    // only sometimes a real subsequence of the input, and never reliably so --
    // which is checked here rather than claimed.
    println!("{:<44}{:<20}{:>21}", "input", "tails", "a real subsequence?");
    for values in [&demo, &trap] {
        let tails = tails_of(values);
        println!("{:<44}{:<20}{:>21}", show(values), show(&tails),
            if is_subsequence(&tails, values) { "yes" } else { "no" });
    }
    println!();
    println!("so the length is always the answer and the contents are not always a run:");
    println!("in the second array 1 arrives last and overwrites the first tail, leaving");
    println!("an array that could never have been read off the input in order.");
    println!();

    const TRIALS: i32 = 3000;
    let mut seed = 1i64;
    let mut quad_ok = 0;
    let mut fast_ok = 0;
    let mut agree = 0;
    let mut tails_valid = 0;
    for _ in 0..TRIALS {
        let n = 1 + rand(&mut seed, 12) as usize;
        let values: Vec<i32> = (0..n).map(|_| 1 + rand(&mut seed, 20)).collect();
        let truth = brute(&values);
        let a = quadratic(&values);
        let b = patience(&values);
        if a == truth {
            quad_ok += 1;
        }
        if b == truth {
            fast_ok += 1;
        }
        if a == b {
            agree += 1;
        }
        if is_subsequence(&tails_of(&values), &values) {
            tails_valid += 1;
        }
    }

    println!("over {} random arrays, against every subsequence:", TRIALS);
    println!("  the O(n^2) table          {:>6}", quad_ok);
    println!("  the O(n log n) tails      {:>6}", fast_ok);
    println!("  and the two agree         {:>6}", agree);
    println!("  the tails array happens to be a real subsequence   {:>6}", tails_valid);
}
`,
            },
            {
              lang: "go",
              code: `// Module 27 lesson 3 settled what the state has to be: the longest run *ending
// at* i, not the longest run among the first i, because only the first pins down
// what the run ends on and so whether the next value can extend it.
//
// This is that state built out, and then the same problem solved a second time by
// an algorithm that is not a dynamic program at all -- it keeps one array of
// "the smallest value a run of each length can end on" and binary searches it.
package main

import (
	"fmt"
	"strconv"
	"strings"
)

// dp[i] is the longest increasing run ending exactly at i. O(n^2).
func quadratic(values []int) int {
	ending := make([]int, len(values))
	best := 0
	for i := range values {
		ending[i] = 1
		for j := 0; j < i; j++ {
			if values[j] < values[i] && ending[j]+1 > ending[i] {
				ending[i] = ending[j] + 1
			}
		}
		if ending[i] > best {
			best = ending[i]
		}
	}
	return best
}

// tails[k] is the smallest value any run of length k+1 can end on.
//
// That array is always sorted, which is the whole trick: a new value either
// extends the longest run, or replaces the first tail it is not larger than.
// Binary search finds that place in log time, so the whole thing is O(n log n).
func tailsOf(values []int) []int {
	var tails []int
	for _, value := range values {
		lo, hi := 0, len(tails)
		for lo < hi {
			mid := (lo + hi) / 2
			if tails[mid] < value {
				lo = mid + 1
			} else {
				hi = mid
			}
		}
		if lo == len(tails) {
			tails = append(tails, value)
		} else {
			tails[lo] = value
		}
	}
	return tails
}

func patience(values []int) int {
	return len(tailsOf(values))
}

// Every subsequence, checked for being increasing.
func brute(values []int) int {
	best := 0
	for mask := 0; mask < 1<<len(values); mask++ {
		var picked []int
		for i := range values {
			if mask>>i&1 == 1 {
				picked = append(picked, values[i])
			}
		}
		rising := true
		for k := 0; k+1 < len(picked); k++ {
			if picked[k] >= picked[k+1] {
				rising = false
			}
		}
		if rising && len(picked) > best {
			best = len(picked)
		}
	}
	return best
}

func isSubsequence(small, big []int) bool {
	j := 0
	for _, value := range big {
		if j < len(small) && small[j] == value {
			j++
		}
	}
	return j == len(small)
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

var DEMO = []int{3, 10, 2, 1, 20, 4, 6, 21, 5, 11, 7, 15}
var TRAP = []int{2, 6, 8, 3, 4, 5, 1}

func main() {
	ending := make([]int, len(DEMO))
	for i := range DEMO {
		ending[i] = 1
		for j := 0; j < i; j++ {
			if DEMO[j] < DEMO[i] && ending[j]+1 > ending[i] {
				ending[i] = ending[j] + 1
			}
		}
	}

	fmt.Printf("values %s\\n", show(DEMO))
	fmt.Println()
	idx, val, dp := "  index  ", "  value  ", "  dp     "
	best := 0
	for i := range DEMO {
		idx += fmt.Sprintf("%4d", i)
		val += fmt.Sprintf("%4d", DEMO[i])
		dp += fmt.Sprintf("%4d", ending[i])
		if ending[i] > best {
			best = ending[i]
		}
	}
	fmt.Println(idx)
	fmt.Println(val)
	fmt.Println(dp)
	fmt.Println()
	fmt.Printf("the answer is the largest of those:            %d\\n", best)
	fmt.Printf("the tails array, walked once with a binary search: %d\\n", patience(DEMO))
	fmt.Printf("every one of the %d subsequences agrees:      %d\\n", 1<<len(DEMO), brute(DEMO))
	fmt.Println()

	// The tails array is not the answer. Its length is right; its contents are
	// only sometimes a real subsequence of the input, and never reliably so --
	// which is checked here rather than claimed.
	fmt.Printf("%-44s%-20s%21s\\n", "input", "tails", "a real subsequence?")
	for _, values := range [][]int{DEMO, TRAP} {
		tails := tailsOf(values)
		answer := "no"
		if isSubsequence(tails, values) {
			answer = "yes"
		}
		fmt.Printf("%-44s%-20s%21s\\n", show(values), show(tails), answer)
	}
	fmt.Println()
	fmt.Println("so the length is always the answer and the contents are not always a run:")
	fmt.Println("in the second array 1 arrives last and overwrites the first tail, leaving")
	fmt.Println("an array that could never have been read off the input in order.")
	fmt.Println()

	const TRIALS = 3000
	quadOk, fastOk, agree, tailsValid := 0, 0, 0, 0
	for t := 0; t < TRIALS; t++ {
		n := 1 + rand(12)
		values := make([]int, n)
		for i := 0; i < n; i++ {
			values[i] = 1 + rand(20)
		}
		truth := brute(values)
		a := quadratic(values)
		b := patience(values)
		if a == truth {
			quadOk++
		}
		if b == truth {
			fastOk++
		}
		if a == b {
			agree++
		}
		if isSubsequence(tailsOf(values), values) {
			tailsValid++
		}
	}

	fmt.Printf("over %d random arrays, against every subsequence:\\n", TRIALS)
	fmt.Printf("  the O(n^2) table          %6d\\n", quadOk)
	fmt.Printf("  the O(n log n) tails      %6d\\n", fastOk)
	fmt.Printf("  and the two agree         %6d\\n", agree)
	fmt.Printf("  the tails array happens to be a real subsequence   %6d\\n", tailsValid)
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "dp-lis-tails",
        kind: "dp",
        algorithm: "lis",
        title: "The tails array, overwritten in place",
        lockAlgorithm: true,
      },
      pitfalls: [
        {
          title: "The answer is the largest cell, not the last one",
          body: "`ending[i]` is the longest run finishing exactly at `i`, so the best run can end anywhere. Returning `ending[n-1]` gives the right answer whenever the input happens to end on its best run and the wrong one otherwise. This is the same trap as the longest common substring reading in lesson 3, and it comes from the same decision: putting the ending into the state.",
        },
        {
          title: "The tails array is not the subsequence",
          body: "Its length is the answer; its contents need not appear in the input in that order, because a later small value can overwrite an early tail. Measured here, it happened to be a genuine subsequence on 1,804 of 3,000 random arrays. If the question wants the subsequence itself, keep parent pointers on the quadratic table instead.",
        },
      ],
    },
    {
      id: "strict-and-non-strict",
      heading: "One comparison, two problems",
      body: [
        "The next thing that separates a correct answer from a nearly correct one is a single character, and it appears twice in different disguises.",
        "\"Increasing\" and \"non-decreasing\" are different questions. `[1, 3, 3, 3, 5]` has a strictly increasing run of 3 and a non-decreasing run of 5. Interview statements use both, sometimes in the same paragraph, and the two implementations differ by one comparison operator.",
        "In the quadratic version the switch is easy to see: `values[j] < values[i]` becomes `values[j] <= values[i]`. In the `tails` version it is subtler and easier to get backwards, because it is not comparing input values at all \u2014 it is deciding where the binary search stops relative to a run of equal tails. Strict stops **at** the first tail equal to the value, so that tail is replaced and the length is unchanged. Non-strict stops **after** them, so the value appends past its equals and the run grows.",
        "The example runs all four combinations against exhaustive search. The two correct pairings score 3,000 out of 3,000. Either mismatched pairing \u2014 the strict question answered with the non-strict search, or the reverse \u2014 scores 917. That is the number to keep: a wrong comparison here is right about 30 percent of the time, which is exactly the failure mode that survives a handful of hand-written test cases.",
        "Note also that the two questions genuinely differ on 2,083 of those 3,000 arrays. That is a consequence of the generator drawing values from a small range on purpose; on arrays of distinct values the two answers coincide and the bug is invisible.",
      ],
      examples: [
        {
          id: "strict-vs-non-strict",
          title: "All four pairings of question and implementation",
          lang: "python",
          code: `# "Increasing" and "non-decreasing" differ by whether equal values may sit next
# to each other, which is one character in the quadratic version and one
# comparison in the fast one. Both are easy to write the wrong way round, and
# neither wrong version looks wrong.
#
# The fast version's switch is the subtler one: it decides whether the binary
# search stops before or after a run of equal values, which is the difference
# between replacing an equal tail and appending past it.

def quadratic(values, strict):
    ending = [1] * len(values)
    for i in range(len(values)):
        for j in range(i):
            ahead = values[j] < values[i] if strict else values[j] <= values[i]
            if ahead and ending[j] + 1 > ending[i]:
                ending[i] = ending[j] + 1
    return max(ending) if ending else 0


def patience(values, strict):
    """\`strict\` moves the search past equal tails instead of onto the first one."""
    tails = []
    for value in values:
        lo, hi = 0, len(tails)
        while lo < hi:
            mid = (lo + hi) // 2
            # Strict: stop at the first tail >= value, so an equal tail is
            # replaced. Non-strict: stop after them, so an equal tail is kept
            # and the run may be extended.
            before = tails[mid] < value if strict else tails[mid] <= value
            if before:
                lo = mid + 1
            else:
                hi = mid
        if lo == len(tails):
            tails.append(value)
        else:
            tails[lo] = value
    return len(tails)


def brute(values, strict):
    best = 0
    for mask in range(1 << len(values)):
        picked = [values[i] for i in range(len(values)) if mask >> i & 1]
        if strict:
            ok = all(picked[k] < picked[k + 1] for k in range(len(picked) - 1))
        else:
            ok = all(picked[k] <= picked[k + 1] for k in range(len(picked) - 1))
        if ok and len(picked) > best:
            best = len(picked)
    return best


def show(values):
    return "[" + ", ".join(str(v) for v in values) + "]"


CASES = [
    [1, 3, 3, 3, 5],
    [2, 2, 2, 2],
    [3, 10, 2, 1, 20],
    [5, 4, 3, 2, 1],
    [1, 2, 2, 3, 3, 4],
]

print(f"{'values':<22}{'strict':>8}{'brute':>7}{'non-strict':>13}{'brute':>7}")
for values in CASES:
    print(f"{show(values):<22}{patience(values, True):>8}{brute(values, True):>7}"
          f"{patience(values, False):>13}{brute(values, False):>7}")
print()

print("and the same four columns from the quadratic table:")
print(f"{'values':<22}{'strict':>8}{'non-strict':>13}")
for values in CASES:
    print(f"{show(values):<22}{quadratic(values, True):>8}{quadratic(values, False):>13}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
scores = [0, 0, 0, 0, 0, 0]
ties = 0
for _ in range(TRIALS):
    n = 1 + rand(11)
    # A small range on purpose, so equal values are common and the two
    # questions actually differ.
    values = [1 + rand(4) for _ in range(n)]
    tight = brute(values, True)
    loose = brute(values, False)
    if tight != loose:
        ties += 1
    if quadratic(values, True) == tight:
        scores[0] += 1
    if patience(values, True) == tight:
        scores[1] += 1
    if patience(values, False) == tight:
        scores[2] += 1
    if quadratic(values, False) == loose:
        scores[3] += 1
    if patience(values, False) == loose:
        scores[4] += 1
    if patience(values, True) == loose:
        scores[5] += 1

print(f"over {TRIALS} random arrays, {ties} of which answer the two questions differently:")
print(f"{'':<38}{'correct':>9}")
print(f"{'  strict, quadratic table':<38}{scores[0]:>9}")
print(f"{'  strict, tails with the strict search':<38}{scores[1]:>9}")
print(f"{'  strict, tails with the other search':<38}{scores[2]:>9}")
print(f"{'  non-strict, quadratic table':<38}{scores[3]:>9}")
print(f"{'  non-strict, tails with its search':<38}{scores[4]:>9}")
print(f"{'  non-strict, tails with the other one':<38}{scores[5]:>9}")
`,
          output: `values                  strict  brute   non-strict  brute
[1, 3, 3, 3, 5]              3      3            5      5
[2, 2, 2, 2]                 1      1            4      4
[3, 10, 2, 1, 20]            3      3            3      3
[5, 4, 3, 2, 1]              1      1            1      1
[1, 2, 2, 3, 3, 4]           4      4            6      6

and the same four columns from the quadratic table:
values                  strict   non-strict
[1, 3, 3, 3, 5]              3            5
[2, 2, 2, 2]                 1            4
[3, 10, 2, 1, 20]            3            3
[5, 4, 3, 2, 1]              1            1
[1, 2, 2, 3, 3, 4]           4            6

over 3000 random arrays, 2083 of which answer the two questions differently:
                                        correct
  strict, quadratic table                  3000
  strict, tails with the strict search     3000
  strict, tails with the other search       917
  non-strict, quadratic table              3000
  non-strict, tails with its search        3000
  non-strict, tails with the other one      917`,
          explanation:
            "All four pairings of question and implementation, run against exhaustive search. The two correct ones are perfect; both mismatches score 917 out of 3,000, which is the point \u2014 a wrong comparison operator here does not fail loudly.",
          alternates: [
            {
              lang: "javascript",
              code: `// "Increasing" and "non-decreasing" differ by whether equal values may sit next
// to each other, which is one character in the quadratic version and one
// comparison in the fast one. Both are easy to write the wrong way round, and
// neither wrong version looks wrong.
//
// The fast version's switch is the subtler one: it decides whether the binary
// search stops before or after a run of equal values, which is the difference
// between replacing an equal tail and appending past it.

function quadratic(values, strict) {
  const ending = new Array(values.length).fill(1);
  let best = 0;
  for (let i = 0; i < values.length; i++) {
    for (let j = 0; j < i; j++) {
      const ahead = strict ? values[j] < values[i] : values[j] <= values[i];
      if (ahead && ending[j] + 1 > ending[i]) ending[i] = ending[j] + 1;
    }
    if (ending[i] > best) best = ending[i];
  }
  return best;
}

/** \`strict\` moves the search past equal tails instead of onto the first one. */
function patience(values, strict) {
  const tails = [];
  for (const value of values) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      // Strict: stop at the first tail >= value, so an equal tail is replaced.
      // Non-strict: stop after them, so an equal tail is kept and the run may
      // be extended.
      const before = strict ? tails[mid] < value : tails[mid] <= value;
      if (before) lo = mid + 1;
      else hi = mid;
    }
    if (lo === tails.length) tails.push(value);
    else tails[lo] = value;
  }
  return tails.length;
}

function brute(values, strict) {
  let best = 0;
  for (let mask = 0; mask < 1 << values.length; mask++) {
    const picked = values.filter((_, i) => (mask >> i) & 1);
    let ok = true;
    for (let k = 0; k + 1 < picked.length; k++) {
      const bad = strict ? picked[k] >= picked[k + 1] : picked[k] > picked[k + 1];
      if (bad) ok = false;
    }
    if (ok && picked.length > best) best = picked.length;
  }
  return best;
}

const show = (values) => \`[\${values.join(", ")}]\`;

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
  [1, 3, 3, 3, 5],
  [2, 2, 2, 2],
  [3, 10, 2, 1, 20],
  [5, 4, 3, 2, 1],
  [1, 2, 2, 3, 3, 4],
];

console.log(padEnd("values", 22) + pad("strict", 8) + pad("brute", 7) + pad("non-strict", 13) + pad("brute", 7));
for (const values of CASES) {
  console.log(
    padEnd(show(values), 22) + pad(patience(values, true), 8) + pad(brute(values, true), 7) +
      pad(patience(values, false), 13) + pad(brute(values, false), 7)
  );
}
console.log();

console.log("and the same four columns from the quadratic table:");
console.log(padEnd("values", 22) + pad("strict", 8) + pad("non-strict", 13));
for (const values of CASES) {
  console.log(padEnd(show(values), 22) + pad(quadratic(values, true), 8) + pad(quadratic(values, false), 13));
}
console.log();

const TRIALS = 3000;
const scores = [0, 0, 0, 0, 0, 0];
let ties = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 1 + rand(11);
  // A small range on purpose, so equal values are common and the two questions
  // actually differ.
  const values = Array.from({ length: n }, () => 1 + rand(4));
  const tight = brute(values, true);
  const loose = brute(values, false);
  if (tight !== loose) ties++;
  if (quadratic(values, true) === tight) scores[0]++;
  if (patience(values, true) === tight) scores[1]++;
  if (patience(values, false) === tight) scores[2]++;
  if (quadratic(values, false) === loose) scores[3]++;
  if (patience(values, false) === loose) scores[4]++;
  if (patience(values, true) === loose) scores[5]++;
}

console.log(\`over \${TRIALS} random arrays, \${ties} of which answer the two questions differently:\`);
console.log(padEnd("", 38) + pad("correct", 9));
const LABELS = [
  "  strict, quadratic table",
  "  strict, tails with the strict search",
  "  strict, tails with the other search",
  "  non-strict, quadratic table",
  "  non-strict, tails with its search",
  "  non-strict, tails with the other one",
];
for (let k = 0; k < 6; k++) console.log(padEnd(LABELS[k], 38) + pad(scores[k], 9));
`,
            },
            {
              lang: "typescript",
              code: `// "Increasing" and "non-decreasing" differ by whether equal values may sit next
// to each other, which is one character in the quadratic version and one
// comparison in the fast one. Both are easy to write the wrong way round, and
// neither wrong version looks wrong.
//
// The fast version's switch is the subtler one: it decides whether the binary
// search stops before or after a run of equal values, which is the difference
// between replacing an equal tail and appending past it.

function quadratic(values: number[], strict: boolean): number {
  const ending = new Array(values.length).fill(1);
  let best = 0;
  for (let i = 0; i < values.length; i++) {
    for (let j = 0; j < i; j++) {
      const ahead = strict ? values[j] < values[i] : values[j] <= values[i];
      if (ahead && ending[j] + 1 > ending[i]) ending[i] = ending[j] + 1;
    }
    if (ending[i] > best) best = ending[i];
  }
  return best;
}

/** \`strict\` moves the search past equal tails instead of onto the first one. */
function patience(values: number[], strict: boolean): number {
  const tails: number[] = [];
  for (const value of values) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      // Strict: stop at the first tail >= value, so an equal tail is replaced.
      // Non-strict: stop after them, so an equal tail is kept and the run may
      // be extended.
      const before = strict ? tails[mid] < value : tails[mid] <= value;
      if (before) lo = mid + 1;
      else hi = mid;
    }
    if (lo === tails.length) tails.push(value);
    else tails[lo] = value;
  }
  return tails.length;
}

function brute(values: number[], strict: boolean): number {
  let best = 0;
  for (let mask = 0; mask < 1 << values.length; mask++) {
    const picked = values.filter((_, i) => (mask >> i) & 1);
    let ok = true;
    for (let k = 0; k + 1 < picked.length; k++) {
      const bad = strict ? picked[k] >= picked[k + 1] : picked[k] > picked[k + 1];
      if (bad) ok = false;
    }
    if (ok && picked.length > best) best = picked.length;
  }
  return best;
}

const show = (values: number[]): string => \`[\${values.join(", ")}]\`;

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
  [1, 3, 3, 3, 5],
  [2, 2, 2, 2],
  [3, 10, 2, 1, 20],
  [5, 4, 3, 2, 1],
  [1, 2, 2, 3, 3, 4],
];

console.log(padEnd("values", 22) + pad("strict", 8) + pad("brute", 7) + pad("non-strict", 13) + pad("brute", 7));
for (const values of CASES) {
  console.log(
    padEnd(show(values), 22) + pad(patience(values, true), 8) + pad(brute(values, true), 7) +
      pad(patience(values, false), 13) + pad(brute(values, false), 7)
  );
}
console.log();

console.log("and the same four columns from the quadratic table:");
console.log(padEnd("values", 22) + pad("strict", 8) + pad("non-strict", 13));
for (const values of CASES) {
  console.log(padEnd(show(values), 22) + pad(quadratic(values, true), 8) + pad(quadratic(values, false), 13));
}
console.log();

const TRIALS = 3000;
const scores = [0, 0, 0, 0, 0, 0];
let ties = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 1 + rand(11);
  // A small range on purpose, so equal values are common and the two questions
  // actually differ.
  const values = Array.from({ length: n }, () => 1 + rand(4));
  const tight = brute(values, true);
  const loose = brute(values, false);
  if (tight !== loose) ties++;
  if (quadratic(values, true) === tight) scores[0]++;
  if (patience(values, true) === tight) scores[1]++;
  if (patience(values, false) === tight) scores[2]++;
  if (quadratic(values, false) === loose) scores[3]++;
  if (patience(values, false) === loose) scores[4]++;
  if (patience(values, true) === loose) scores[5]++;
}

console.log(\`over \${TRIALS} random arrays, \${ties} of which answer the two questions differently:\`);
console.log(padEnd("", 38) + pad("correct", 9));
const LABELS = [
  "  strict, quadratic table",
  "  strict, tails with the strict search",
  "  strict, tails with the other search",
  "  non-strict, quadratic table",
  "  non-strict, tails with its search",
  "  non-strict, tails with the other one",
];
for (let k = 0; k < 6; k++) console.log(padEnd(LABELS[k], 38) + pad(scores[k], 9));
`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.List;

// "Increasing" and "non-decreasing" differ by whether equal values may sit next
// to each other, which is one character in the quadratic version and one
// comparison in the fast one. Both are easy to write the wrong way round, and
// neither wrong version looks wrong.
//
// The fast version's switch is the subtler one: it decides whether the binary
// search stops before or after a run of equal values, which is the difference
// between replacing an equal tail and appending past it.
public class Main {
    static int quadratic(int[] values, boolean strict) {
        int[] ending = new int[values.length];
        int best = 0;
        for (int i = 0; i < values.length; i++) {
            ending[i] = 1;
            for (int j = 0; j < i; j++) {
                boolean ahead = strict ? values[j] < values[i] : values[j] <= values[i];
                if (ahead && ending[j] + 1 > ending[i]) ending[i] = ending[j] + 1;
            }
            if (ending[i] > best) best = ending[i];
        }
        return best;
    }

    /** \`strict\` moves the search past equal tails instead of onto the first one. */
    static int patience(int[] values, boolean strict) {
        List<Integer> tails = new ArrayList<>();
        for (int value : values) {
            int lo = 0;
            int hi = tails.size();
            while (lo < hi) {
                int mid = (lo + hi) / 2;
                // Strict: stop at the first tail >= value, so an equal tail is
                // replaced. Non-strict: stop after them, so an equal tail is kept
                // and the run may be extended.
                boolean before = strict ? tails.get(mid) < value : tails.get(mid) <= value;
                if (before) lo = mid + 1;
                else hi = mid;
            }
            if (lo == tails.size()) tails.add(value);
            else tails.set(lo, value);
        }
        return tails.size();
    }

    static int brute(int[] values, boolean strict) {
        int best = 0;
        for (int mask = 0; mask < (1 << values.length); mask++) {
            List<Integer> picked = new ArrayList<>();
            for (int i = 0; i < values.length; i++) {
                if ((mask >> i & 1) == 1) picked.add(values[i]);
            }
            boolean ok = true;
            for (int k = 0; k + 1 < picked.size(); k++) {
                if (strict ? picked.get(k) >= picked.get(k + 1) : picked.get(k) > picked.get(k + 1)) {
                    ok = false;
                }
            }
            if (ok && picked.size() > best) best = picked.size();
        }
        return best;
    }

    static String show(int[] values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(values[i]);
        }
        return sb.append("]").toString();
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    static final int[][] CASES = {
        { 1, 3, 3, 3, 5 },
        { 2, 2, 2, 2 },
        { 3, 10, 2, 1, 20 },
        { 5, 4, 3, 2, 1 },
        { 1, 2, 2, 3, 3, 4 },
    };

    public static void main(String[] args) {
        System.out.printf("%-22s%8s%7s%13s%7s%n", "values", "strict", "brute", "non-strict", "brute");
        for (int[] values : CASES) {
            System.out.printf("%-22s%8d%7d%13d%7d%n", show(values),
                patience(values, true), brute(values, true),
                patience(values, false), brute(values, false));
        }
        System.out.println();

        System.out.println("and the same four columns from the quadratic table:");
        System.out.printf("%-22s%8s%13s%n", "values", "strict", "non-strict");
        for (int[] values : CASES) {
            System.out.printf("%-22s%8d%13d%n", show(values),
                quadratic(values, true), quadratic(values, false));
        }
        System.out.println();

        final int TRIALS = 3000;
        int[] scores = new int[6];
        int ties = 0;
        for (int t = 0; t < TRIALS; t++) {
            int n = 1 + rand(11);
            // A small range on purpose, so equal values are common and the two
            // questions actually differ.
            int[] values = new int[n];
            for (int i = 0; i < n; i++) values[i] = 1 + rand(4);
            int tight = brute(values, true);
            int loose = brute(values, false);
            if (tight != loose) ties++;
            if (quadratic(values, true) == tight) scores[0]++;
            if (patience(values, true) == tight) scores[1]++;
            if (patience(values, false) == tight) scores[2]++;
            if (quadratic(values, false) == loose) scores[3]++;
            if (patience(values, false) == loose) scores[4]++;
            if (patience(values, true) == loose) scores[5]++;
        }

        System.out.printf("over %d random arrays, %d of which answer the two questions differently:%n",
            TRIALS, ties);
        System.out.printf("%-38s%9s%n", "", "correct");
        System.out.printf("%-38s%9d%n", "  strict, quadratic table", scores[0]);
        System.out.printf("%-38s%9d%n", "  strict, tails with the strict search", scores[1]);
        System.out.printf("%-38s%9d%n", "  strict, tails with the other search", scores[2]);
        System.out.printf("%-38s%9d%n", "  non-strict, quadratic table", scores[3]);
        System.out.printf("%-38s%9d%n", "  non-strict, tails with its search", scores[4]);
        System.out.printf("%-38s%9d%n", "  non-strict, tails with the other one", scores[5]);
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// "Increasing" and "non-decreasing" differ by whether equal values may sit next
// to each other, which is one character in the quadratic version and one
// comparison in the fast one. Both are easy to write the wrong way round, and
// neither wrong version looks wrong.
//
// The fast version's switch is the subtler one: it decides whether the binary
// search stops before or after a run of equal values, which is the difference
// between replacing an equal tail and appending past it.
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

int quadratic(const std::vector<int> &values, bool strict) {
    std::vector<int> ending(values.size(), 1);
    int best = 0;
    for (size_t i = 0; i < values.size(); i++) {
        for (size_t j = 0; j < i; j++) {
            bool ahead = strict ? values[j] < values[i] : values[j] <= values[i];
            if (ahead && ending[j] + 1 > ending[i]) ending[i] = ending[j] + 1;
        }
        if (ending[i] > best) best = ending[i];
    }
    return best;
}

// \`strict\` moves the search past equal tails instead of onto the first one.
int patience(const std::vector<int> &values, bool strict) {
    std::vector<int> tails;
    for (int value : values) {
        size_t lo = 0, hi = tails.size();
        while (lo < hi) {
            size_t mid = (lo + hi) / 2;
            // Strict: stop at the first tail >= value, so an equal tail is
            // replaced. Non-strict: stop after them, so an equal tail is kept
            // and the run may be extended.
            bool before = strict ? tails[mid] < value : tails[mid] <= value;
            if (before) lo = mid + 1;
            else hi = mid;
        }
        if (lo == tails.size()) tails.push_back(value);
        else tails[lo] = value;
    }
    return static_cast<int>(tails.size());
}

int brute(const std::vector<int> &values, bool strict) {
    int best = 0;
    for (int mask = 0; mask < (1 << values.size()); mask++) {
        std::vector<int> picked;
        for (size_t i = 0; i < values.size(); i++) {
            if (mask >> i & 1) picked.push_back(values[i]);
        }
        bool ok = true;
        for (size_t k = 0; k + 1 < picked.size(); k++) {
            bool bad = strict ? picked[k] >= picked[k + 1] : picked[k] > picked[k + 1];
            if (bad) ok = false;
        }
        if (ok && static_cast<int>(picked.size()) > best) best = static_cast<int>(picked.size());
    }
    return best;
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

static const std::vector<std::vector<int>> CASES = {
    {1, 3, 3, 3, 5}, {2, 2, 2, 2}, {3, 10, 2, 1, 20}, {5, 4, 3, 2, 1}, {1, 2, 2, 3, 3, 4},
};

int main() {
    std::cout << std::left << std::setw(22) << "values" << std::right << std::setw(8) << "strict"
              << std::setw(7) << "brute" << std::setw(13) << "non-strict" << std::setw(7) << "brute" << "\\n";
    for (const auto &values : CASES) {
        std::cout << std::left << std::setw(22) << show(values) << std::right
                  << std::setw(8) << patience(values, true) << std::setw(7) << brute(values, true)
                  << std::setw(13) << patience(values, false) << std::setw(7) << brute(values, false) << "\\n";
    }
    std::cout << "\\n";

    std::cout << "and the same four columns from the quadratic table:\\n";
    std::cout << std::left << std::setw(22) << "values" << std::right << std::setw(8) << "strict"
              << std::setw(13) << "non-strict" << "\\n";
    for (const auto &values : CASES) {
        std::cout << std::left << std::setw(22) << show(values) << std::right
                  << std::setw(8) << quadratic(values, true)
                  << std::setw(13) << quadratic(values, false) << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 3000;
    std::array<int, 6> scores{};
    int ties = 0;
    for (int t = 0; t < TRIALS; t++) {
        int n = 1 + rnd(11);
        // A small range on purpose, so equal values are common and the two
        // questions actually differ.
        std::vector<int> values(n);
        for (int i = 0; i < n; i++) values[i] = 1 + rnd(4);
        int tight = brute(values, true);
        int loose = brute(values, false);
        if (tight != loose) ties++;
        if (quadratic(values, true) == tight) scores[0]++;
        if (patience(values, true) == tight) scores[1]++;
        if (patience(values, false) == tight) scores[2]++;
        if (quadratic(values, false) == loose) scores[3]++;
        if (patience(values, false) == loose) scores[4]++;
        if (patience(values, true) == loose) scores[5]++;
    }

    std::cout << "over " << TRIALS << " random arrays, " << ties
              << " of which answer the two questions differently:\\n";
    std::cout << std::left << std::setw(38) << "" << std::right << std::setw(9) << "correct" << "\\n";
    const std::array<std::string, 6> labels = {
        "  strict, quadratic table",
        "  strict, tails with the strict search",
        "  strict, tails with the other search",
        "  non-strict, quadratic table",
        "  non-strict, tails with its search",
        "  non-strict, tails with the other one",
    };
    for (int k = 0; k < 6; k++) {
        std::cout << std::left << std::setw(38) << labels[k] << std::right << std::setw(9)
                  << scores[k] << "\\n";
    }
}
`,
            },
            {
              lang: "rust",
              code: `// "Increasing" and "non-decreasing" differ by whether equal values may sit next
// to each other, which is one character in the quadratic version and one
// comparison in the fast one. Both are easy to write the wrong way round, and
// neither wrong version looks wrong.
//
// The fast version's switch is the subtler one: it decides whether the binary
// search stops before or after a run of equal values, which is the difference
// between replacing an equal tail and appending past it.

fn quadratic(values: &[i32], strict: bool) -> i32 {
    let mut ending = vec![1i32; values.len()];
    let mut best = 0;
    for i in 0..values.len() {
        for j in 0..i {
            let ahead = if strict { values[j] < values[i] } else { values[j] <= values[i] };
            if ahead && ending[j] + 1 > ending[i] {
                ending[i] = ending[j] + 1;
            }
        }
        if ending[i] > best {
            best = ending[i];
        }
    }
    best
}

/// \`strict\` moves the search past equal tails instead of onto the first one.
fn patience(values: &[i32], strict: bool) -> i32 {
    let mut tails: Vec<i32> = Vec::new();
    for &value in values {
        let (mut lo, mut hi) = (0usize, tails.len());
        while lo < hi {
            let mid = (lo + hi) / 2;
            // Strict: stop at the first tail >= value, so an equal tail is
            // replaced. Non-strict: stop after them, so an equal tail is kept
            // and the run may be extended.
            let before = if strict { tails[mid] < value } else { tails[mid] <= value };
            if before {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        if lo == tails.len() {
            tails.push(value);
        } else {
            tails[lo] = value;
        }
    }
    tails.len() as i32
}

fn brute(values: &[i32], strict: bool) -> i32 {
    let mut best = 0;
    for mask in 0..(1usize << values.len()) {
        let picked: Vec<i32> = (0..values.len())
            .filter(|i| mask >> i & 1 == 1)
            .map(|i| values[i])
            .collect();
        let ok = picked.windows(2).all(|w| if strict { w[0] < w[1] } else { w[0] <= w[1] });
        if ok && picked.len() as i32 > best {
            best = picked.len() as i32;
        }
    }
    best
}

fn show(values: &[i32]) -> String {
    format!("[{}]", values.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(", "))
}

fn rand(seed: &mut i64, n: i64) -> i32 {
    *seed = (*seed * 1103515245 + 12345) % 2147483648;
    (*seed / 65536 % n) as i32
}

fn main() {
    let cases: Vec<Vec<i32>> = vec![
        vec![1, 3, 3, 3, 5],
        vec![2, 2, 2, 2],
        vec![3, 10, 2, 1, 20],
        vec![5, 4, 3, 2, 1],
        vec![1, 2, 2, 3, 3, 4],
    ];

    println!("{:<22}{:>8}{:>7}{:>13}{:>7}", "values", "strict", "brute", "non-strict", "brute");
    for values in &cases {
        println!("{:<22}{:>8}{:>7}{:>13}{:>7}", show(values),
            patience(values, true), brute(values, true),
            patience(values, false), brute(values, false));
    }
    println!();

    println!("and the same four columns from the quadratic table:");
    println!("{:<22}{:>8}{:>13}", "values", "strict", "non-strict");
    for values in &cases {
        println!("{:<22}{:>8}{:>13}", show(values), quadratic(values, true), quadratic(values, false));
    }
    println!();

    const TRIALS: i32 = 3000;
    let mut seed = 1i64;
    let mut scores = [0i32; 6];
    let mut ties = 0;
    for _ in 0..TRIALS {
        let n = 1 + rand(&mut seed, 11) as usize;
        // A small range on purpose, so equal values are common and the two
        // questions actually differ.
        let values: Vec<i32> = (0..n).map(|_| 1 + rand(&mut seed, 4)).collect();
        let tight = brute(&values, true);
        let loose = brute(&values, false);
        if tight != loose {
            ties += 1;
        }
        if quadratic(&values, true) == tight {
            scores[0] += 1;
        }
        if patience(&values, true) == tight {
            scores[1] += 1;
        }
        if patience(&values, false) == tight {
            scores[2] += 1;
        }
        if quadratic(&values, false) == loose {
            scores[3] += 1;
        }
        if patience(&values, false) == loose {
            scores[4] += 1;
        }
        if patience(&values, true) == loose {
            scores[5] += 1;
        }
    }

    println!("over {} random arrays, {} of which answer the two questions differently:", TRIALS, ties);
    println!("{:<38}{:>9}", "", "correct");
    let labels = [
        "  strict, quadratic table",
        "  strict, tails with the strict search",
        "  strict, tails with the other search",
        "  non-strict, quadratic table",
        "  non-strict, tails with its search",
        "  non-strict, tails with the other one",
    ];
    for k in 0..6 {
        println!("{:<38}{:>9}", labels[k], scores[k]);
    }
}
`,
            },
            {
              lang: "go",
              code: `// "Increasing" and "non-decreasing" differ by whether equal values may sit next
// to each other, which is one character in the quadratic version and one
// comparison in the fast one. Both are easy to write the wrong way round, and
// neither wrong version looks wrong.
//
// The fast version's switch is the subtler one: it decides whether the binary
// search stops before or after a run of equal values, which is the difference
// between replacing an equal tail and appending past it.
package main

import (
	"fmt"
	"strconv"
	"strings"
)

func quadratic(values []int, strict bool) int {
	ending := make([]int, len(values))
	best := 0
	for i := range values {
		ending[i] = 1
		for j := 0; j < i; j++ {
			ahead := values[j] <= values[i]
			if strict {
				ahead = values[j] < values[i]
			}
			if ahead && ending[j]+1 > ending[i] {
				ending[i] = ending[j] + 1
			}
		}
		if ending[i] > best {
			best = ending[i]
		}
	}
	return best
}

// \`strict\` moves the search past equal tails instead of onto the first one.
func patience(values []int, strict bool) int {
	var tails []int
	for _, value := range values {
		lo, hi := 0, len(tails)
		for lo < hi {
			mid := (lo + hi) / 2
			// Strict: stop at the first tail >= value, so an equal tail is
			// replaced. Non-strict: stop after them, so an equal tail is kept
			// and the run may be extended.
			before := tails[mid] <= value
			if strict {
				before = tails[mid] < value
			}
			if before {
				lo = mid + 1
			} else {
				hi = mid
			}
		}
		if lo == len(tails) {
			tails = append(tails, value)
		} else {
			tails[lo] = value
		}
	}
	return len(tails)
}

func brute(values []int, strict bool) int {
	best := 0
	for mask := 0; mask < 1<<len(values); mask++ {
		var picked []int
		for i := range values {
			if mask>>i&1 == 1 {
				picked = append(picked, values[i])
			}
		}
		ok := true
		for k := 0; k+1 < len(picked); k++ {
			bad := picked[k] > picked[k+1]
			if strict {
				bad = picked[k] >= picked[k+1]
			}
			if bad {
				ok = false
			}
		}
		if ok && len(picked) > best {
			best = len(picked)
		}
	}
	return best
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

var CASES = [][]int{
	{1, 3, 3, 3, 5},
	{2, 2, 2, 2},
	{3, 10, 2, 1, 20},
	{5, 4, 3, 2, 1},
	{1, 2, 2, 3, 3, 4},
}

func main() {
	fmt.Printf("%-22s%8s%7s%13s%7s\\n", "values", "strict", "brute", "non-strict", "brute")
	for _, values := range CASES {
		fmt.Printf("%-22s%8d%7d%13d%7d\\n", show(values),
			patience(values, true), brute(values, true),
			patience(values, false), brute(values, false))
	}
	fmt.Println()

	fmt.Println("and the same four columns from the quadratic table:")
	fmt.Printf("%-22s%8s%13s\\n", "values", "strict", "non-strict")
	for _, values := range CASES {
		fmt.Printf("%-22s%8d%13d\\n", show(values), quadratic(values, true), quadratic(values, false))
	}
	fmt.Println()

	const TRIALS = 3000
	scores := [6]int{}
	ties := 0
	for t := 0; t < TRIALS; t++ {
		n := 1 + rand(11)
		// A small range on purpose, so equal values are common and the two
		// questions actually differ.
		values := make([]int, n)
		for i := 0; i < n; i++ {
			values[i] = 1 + rand(4)
		}
		tight := brute(values, true)
		loose := brute(values, false)
		if tight != loose {
			ties++
		}
		if quadratic(values, true) == tight {
			scores[0]++
		}
		if patience(values, true) == tight {
			scores[1]++
		}
		if patience(values, false) == tight {
			scores[2]++
		}
		if quadratic(values, false) == loose {
			scores[3]++
		}
		if patience(values, false) == loose {
			scores[4]++
		}
		if patience(values, true) == loose {
			scores[5]++
		}
	}

	fmt.Printf("over %d random arrays, %d of which answer the two questions differently:\\n", TRIALS, ties)
	fmt.Printf("%-38s%9s\\n", "", "correct")
	fmt.Printf("%-38s%9d\\n", "  strict, quadratic table", scores[0])
	fmt.Printf("%-38s%9d\\n", "  strict, tails with the strict search", scores[1])
	fmt.Printf("%-38s%9d\\n", "  strict, tails with the other search", scores[2])
	fmt.Printf("%-38s%9d\\n", "  non-strict, quadratic table", scores[3])
	fmt.Printf("%-38s%9d\\n", "  non-strict, tails with its search", scores[4])
	fmt.Printf("%-38s%9d\\n", "  non-strict, tails with the other one", scores[5])
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Strict and non-strict are one character apart in one version and not the other",
          body: "In the quadratic table it is `<` against `<=` on the input values. In the tails version it is where the binary search stops relative to equal tails, which is a different expression doing a different job, and copying the operator across from one to the other gets it backwards. Write both, run them against each other on small arrays with repeats, and the mismatch shows up immediately.",
        },
        {
          title: "A wrong comparison passes most tests",
          body: "The mismatched pairings scored 917 out of 3,000 here, and on arrays of distinct values they score everything, because the two questions have the same answer when nothing repeats. Any test set without deliberate duplicates will not find this.",
        },
      ],
    },
    {
      id: "sorting-a-dimension-away",
      heading: "Sorting a dimension away, and the tie that breaks it",
      body: [
        "None of this would deserve a lesson if the pattern only answered questions about arrays of numbers. It earns its place because a family of problems that look two-dimensional collapse onto it after a sort.",
        "Box nesting is the standard one. Given widths and heights, how many boxes can nest one inside another, each strictly smaller in both dimensions? Sort by width, and the width condition is satisfied by the ordering itself, so what remains is a strictly increasing run on the heights \u2014 the problem you just solved. Russian doll envelopes, the maximum number of non-overlapping chains, and the \"maximum number of buildings visible\" variants are all the same move.",
        "The sort is where it goes wrong, and the trap is entirely about ties. Two boxes of the same width can never nest, so both must not be pickable. Sorting equal widths by ascending height leaves them in increasing order on the second axis, and a strictly increasing run will happily take both \u2014 producing a chain that is not a chain. Sorting equal widths by **descending** height makes that impossible without touching the run-finding code at all.",
        "The example runs both. On `[1x1, 1x2, 1x3, 1x4]` \u2014 four boxes of the same width, none of which nest \u2014 the correct sort says 1 and the naive one says 4. Over 3,000 random box sets, 2,159 of which contain a tie, the correct sort matches exhaustive search 3,000 times and the naive one 1,607.",
        "Which is worth sitting with, because it is the general lesson of the reduction rather than a fact about boxes. The reduction moved one of the two constraints into the sort order, and the sort order is now carrying a correctness requirement that nothing in the LIS code can check. If you write a reduction like this, the comparator is part of the algorithm and deserves the same scrutiny as the recurrence.",
      ],
      examples: [
        {
          id: "box-nesting-reduction",
          title: "Box nesting, with the ties sorted both ways",
          lang: "python",
          code: `# The reduction that makes this pattern worth its own lesson. "How many boxes
# nest inside each other" is two-dimensional, and sorting on one dimension turns
# it into a longest increasing subsequence on the other.
#
# The sort has a trap in it, and the trap is entirely about ties. Two boxes of
# the same width can never nest, so they must not both be pickable -- and the
# way to arrange that is to sort equal widths by *descending* height, so the
# strictly increasing run cannot take two of them.

def lis_strict(values):
    tails = []
    for value in values:
        lo, hi = 0, len(tails)
        while lo < hi:
            mid = (lo + hi) // 2
            if tails[mid] < value:
                lo = mid + 1
            else:
                hi = mid
        if lo == len(tails):
            tails.append(value)
        else:
            tails[lo] = value
    return len(tails)


def nest_correct(boxes):
    """Width ascending; equal widths by height descending; then LIS on height."""
    order = sorted(boxes, key=lambda box: (box[0], -box[1]))
    return lis_strict([box[1] for box in order])


def nest_naive(boxes):
    """The same, with equal widths sorted by ascending height instead."""
    order = sorted(boxes, key=lambda box: (box[0], box[1]))
    return lis_strict([box[1] for box in order])


def brute(boxes):
    """Every subset, checked for forming a chain."""
    best = 0
    for mask in range(1 << len(boxes)):
        picked = sorted([boxes[i] for i in range(len(boxes)) if mask >> i & 1])
        ok = all(picked[k][0] < picked[k + 1][0] and picked[k][1] < picked[k + 1][1]
                 for k in range(len(picked) - 1))
        if ok and len(picked) > best:
            best = len(picked)
    return best


def show(boxes):
    return "[" + ", ".join(f"{w}x{h}" for w, h in boxes) + "]"


CASES = [
    [(5, 4), (6, 4), (6, 7), (2, 3)],
    [(1, 1), (1, 2), (1, 3), (1, 4)],
    [(4, 5), (4, 6), (6, 7), (2, 3)],
    [(2, 3), (5, 4), (6, 7), (6, 5)],
    [(3, 3), (3, 3), (4, 4)],
]

print(f"{'boxes':<34}{'sorted right':>14}{'sorted naively':>16}{'every subset':>14}")
for boxes in CASES:
    print(f"{show(boxes):<34}{nest_correct(boxes):>14}{nest_naive(boxes):>16}{brute(boxes):>14}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
right = 0
naive = 0
had_ties = 0
for _ in range(TRIALS):
    n = 1 + rand(8)
    # A narrow range of widths on purpose, so ties are common.
    boxes = [(1 + rand(4), 1 + rand(6)) for _ in range(n)]
    truth = brute(boxes)
    if nest_correct(boxes) == truth:
        right += 1
    if nest_naive(boxes) == truth:
        naive += 1
    widths = [w for w, _ in boxes]
    if len(set(widths)) < len(widths):
        had_ties += 1

print(f"over {TRIALS} random box sets, {had_ties} of which contain two boxes of equal width:")
print(f"  equal widths sorted by descending height   {right:>6}")
print(f"  equal widths sorted by ascending height    {naive:>6}")
print()
print("the naive sort lets a strictly increasing run pick two boxes of the same")
print("width, which is not a nesting. Sorting those ties the other way makes that")
print("impossible without any change to the run itself.")
`,
          output: `boxes                               sorted right  sorted naively  every subset
[5x4, 6x4, 6x7, 2x3]                           3               3             3
[1x1, 1x2, 1x3, 1x4]                           1               4             1
[4x5, 4x6, 6x7, 2x3]                           3               4             3
[2x3, 5x4, 6x7, 6x5]                           3               4             3
[3x3, 3x3, 4x4]                                2               2             2

over 3000 random box sets, 2159 of which contain two boxes of equal width:
  equal widths sorted by descending height     3000
  equal widths sorted by ascending height      1607

the naive sort lets a strictly increasing run pick two boxes of the same
width, which is not a nesting. Sorting those ties the other way makes that
impossible without any change to the run itself.`,
          explanation:
            "The same LIS code behind two comparators that differ only in how they order equal widths. The third column is exhaustive search over subsets, so the disagreement is measured rather than argued.",
          alternates: [
            {
              lang: "javascript",
              code: `// The reduction that makes this pattern worth its own lesson. "How many boxes
// nest inside each other" is two-dimensional, and sorting on one dimension turns
// it into a longest increasing subsequence on the other.
//
// The sort has a trap in it, and the trap is entirely about ties. Two boxes of
// the same width can never nest, so they must not both be pickable -- and the
// way to arrange that is to sort equal widths by *descending* height, so the
// strictly increasing run cannot take two of them.

function lisStrict(values) {
  const tails = [];
  for (const value of values) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (tails[mid] < value) lo = mid + 1;
      else hi = mid;
    }
    if (lo === tails.length) tails.push(value);
    else tails[lo] = value;
  }
  return tails.length;
}

const heights = (boxes) => boxes.map((box) => box[1]);

/** Width ascending; equal widths by height descending; then LIS on height. */
function nestCorrect(boxes) {
  const order = [...boxes].sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : b[1] - a[1]));
  return lisStrict(heights(order));
}

/** The same, with equal widths sorted by ascending height instead. */
function nestNaive(boxes) {
  const order = [...boxes].sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]));
  return lisStrict(heights(order));
}

/** Every subset, checked for forming a chain. */
function brute(boxes) {
  let best = 0;
  for (let mask = 0; mask < 1 << boxes.length; mask++) {
    const picked = boxes.filter((_, i) => (mask >> i) & 1);
    picked.sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]));
    let ok = true;
    for (let k = 0; k + 1 < picked.length; k++) {
      if (!(picked[k][0] < picked[k + 1][0] && picked[k][1] < picked[k + 1][1])) ok = false;
    }
    if (ok && picked.length > best) best = picked.length;
  }
  return best;
}

const show = (boxes) => \`[\${boxes.map((b) => \`\${b[0]}x\${b[1]}\`).join(", ")}]\`;

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
  [[5, 4], [6, 4], [6, 7], [2, 3]],
  [[1, 1], [1, 2], [1, 3], [1, 4]],
  [[4, 5], [4, 6], [6, 7], [2, 3]],
  [[2, 3], [5, 4], [6, 7], [6, 5]],
  [[3, 3], [3, 3], [4, 4]],
];

console.log(padEnd("boxes", 34) + pad("sorted right", 14) + pad("sorted naively", 16) + pad("every subset", 14));
for (const boxes of CASES) {
  console.log(
    padEnd(show(boxes), 34) + pad(nestCorrect(boxes), 14) + pad(nestNaive(boxes), 16) + pad(brute(boxes), 14)
  );
}
console.log();

const TRIALS = 3000;
let right = 0;
let naive = 0;
let hadTies = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 1 + rand(8);
  // A narrow range of widths on purpose, so ties are common.
  const boxes = Array.from({ length: n }, () => [1 + rand(4), 1 + rand(6)]);
  const truth = brute(boxes);
  if (nestCorrect(boxes) === truth) right++;
  if (nestNaive(boxes) === truth) naive++;
  if (new Set(boxes.map((b) => b[0])).size < boxes.length) hadTies++;
}

console.log(\`over \${TRIALS} random box sets, \${hadTies} of which contain two boxes of equal width:\`);
console.log("  equal widths sorted by descending height   " + pad(right, 6));
console.log("  equal widths sorted by ascending height    " + pad(naive, 6));
console.log();
console.log("the naive sort lets a strictly increasing run pick two boxes of the same");
console.log("width, which is not a nesting. Sorting those ties the other way makes that");
console.log("impossible without any change to the run itself.");
`,
            },
            {
              lang: "typescript",
              code: `// The reduction that makes this pattern worth its own lesson. "How many boxes
// nest inside each other" is two-dimensional, and sorting on one dimension turns
// it into a longest increasing subsequence on the other.
//
// The sort has a trap in it, and the trap is entirely about ties. Two boxes of
// the same width can never nest, so they must not both be pickable -- and the
// way to arrange that is to sort equal widths by *descending* height, so the
// strictly increasing run cannot take two of them.

type Box = [number, number];

function lisStrict(values: number[]): number {
  const tails: number[] = [];
  for (const value of values) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (tails[mid] < value) lo = mid + 1;
      else hi = mid;
    }
    if (lo === tails.length) tails.push(value);
    else tails[lo] = value;
  }
  return tails.length;
}

const heights = (boxes: Box[]): number[] => boxes.map((box) => box[1]);

/** Width ascending; equal widths by height descending; then LIS on height. */
function nestCorrect(boxes: Box[]): number {
  const order = [...boxes].sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : b[1] - a[1]));
  return lisStrict(heights(order));
}

/** The same, with equal widths sorted by ascending height instead. */
function nestNaive(boxes: Box[]): number {
  const order = [...boxes].sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]));
  return lisStrict(heights(order));
}

/** Every subset, checked for forming a chain. */
function brute(boxes: Box[]): number {
  let best = 0;
  for (let mask = 0; mask < 1 << boxes.length; mask++) {
    const picked = boxes.filter((_, i) => (mask >> i) & 1);
    picked.sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]));
    let ok = true;
    for (let k = 0; k + 1 < picked.length; k++) {
      if (!(picked[k][0] < picked[k + 1][0] && picked[k][1] < picked[k + 1][1])) ok = false;
    }
    if (ok && picked.length > best) best = picked.length;
  }
  return best;
}

const show = (boxes: Box[]): string => \`[\${boxes.map((b) => \`\${b[0]}x\${b[1]}\`).join(", ")}]\`;

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

const CASES: Box[][] = [
  [[5, 4], [6, 4], [6, 7], [2, 3]],
  [[1, 1], [1, 2], [1, 3], [1, 4]],
  [[4, 5], [4, 6], [6, 7], [2, 3]],
  [[2, 3], [5, 4], [6, 7], [6, 5]],
  [[3, 3], [3, 3], [4, 4]],
];

console.log(padEnd("boxes", 34) + pad("sorted right", 14) + pad("sorted naively", 16) + pad("every subset", 14));
for (const boxes of CASES) {
  console.log(
    padEnd(show(boxes), 34) + pad(nestCorrect(boxes), 14) + pad(nestNaive(boxes), 16) + pad(brute(boxes), 14)
  );
}
console.log();

const TRIALS = 3000;
let right = 0;
let naive = 0;
let hadTies = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 1 + rand(8);
  // A narrow range of widths on purpose, so ties are common.
  const boxes: Box[] = Array.from({ length: n }, () => [1 + rand(4), 1 + rand(6)] as Box);
  const truth = brute(boxes);
  if (nestCorrect(boxes) === truth) right++;
  if (nestNaive(boxes) === truth) naive++;
  if (new Set(boxes.map((b) => b[0])).size < boxes.length) hadTies++;
}

console.log(\`over \${TRIALS} random box sets, \${hadTies} of which contain two boxes of equal width:\`);
console.log("  equal widths sorted by descending height   " + pad(right, 6));
console.log("  equal widths sorted by ascending height    " + pad(naive, 6));
console.log();
console.log("the naive sort lets a strictly increasing run pick two boxes of the same");
console.log("width, which is not a nesting. Sorting those ties the other way makes that");
console.log("impossible without any change to the run itself.");
`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

// The reduction that makes this pattern worth its own lesson. "How many boxes
// nest inside each other" is two-dimensional, and sorting on one dimension turns
// it into a longest increasing subsequence on the other.
//
// The sort has a trap in it, and the trap is entirely about ties. Two boxes of
// the same width can never nest, so they must not both be pickable -- and the
// way to arrange that is to sort equal widths by *descending* height, so the
// strictly increasing run cannot take two of them.
public class Main {
    static int lisStrict(List<Integer> values) {
        List<Integer> tails = new ArrayList<>();
        for (int value : values) {
            int lo = 0;
            int hi = tails.size();
            while (lo < hi) {
                int mid = (lo + hi) / 2;
                if (tails.get(mid) < value) lo = mid + 1;
                else hi = mid;
            }
            if (lo == tails.size()) tails.add(value);
            else tails.set(lo, value);
        }
        return tails.size();
    }

    /** Width ascending; equal widths by height descending; then LIS on height. */
    static int nestCorrect(int[][] boxes) {
        int[][] order = copyOf(boxes);
        Arrays.sort(order, Comparator.<int[]>comparingInt(box -> box[0])
            .thenComparing(box -> -box[1]));
        return lisStrict(heights(order));
    }

    /** The same, with equal widths sorted by ascending height instead. */
    static int nestNaive(int[][] boxes) {
        int[][] order = copyOf(boxes);
        Arrays.sort(order, Comparator.<int[]>comparingInt(box -> box[0])
            .thenComparingInt(box -> box[1]));
        return lisStrict(heights(order));
    }

    static int[][] copyOf(int[][] boxes) {
        int[][] out = new int[boxes.length][];
        for (int i = 0; i < boxes.length; i++) out[i] = new int[] { boxes[i][0], boxes[i][1] };
        return out;
    }

    static List<Integer> heights(int[][] boxes) {
        List<Integer> out = new ArrayList<>();
        for (int[] box : boxes) out.add(box[1]);
        return out;
    }

    /** Every subset, checked for forming a chain. */
    static int brute(int[][] boxes) {
        int best = 0;
        for (int mask = 0; mask < (1 << boxes.length); mask++) {
            List<int[]> picked = new ArrayList<>();
            for (int i = 0; i < boxes.length; i++) {
                if ((mask >> i & 1) == 1) picked.add(boxes[i]);
            }
            picked.sort(Comparator.<int[]>comparingInt(box -> box[0]).thenComparingInt(box -> box[1]));
            boolean ok = true;
            for (int k = 0; k + 1 < picked.size(); k++) {
                if (!(picked.get(k)[0] < picked.get(k + 1)[0]
                    && picked.get(k)[1] < picked.get(k + 1)[1])) ok = false;
            }
            if (ok && picked.size() > best) best = picked.size();
        }
        return best;
    }

    static String show(int[][] boxes) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < boxes.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(boxes[i][0]).append("x").append(boxes[i][1]);
        }
        return sb.append("]").toString();
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    static final int[][][] CASES = {
        { { 5, 4 }, { 6, 4 }, { 6, 7 }, { 2, 3 } },
        { { 1, 1 }, { 1, 2 }, { 1, 3 }, { 1, 4 } },
        { { 4, 5 }, { 4, 6 }, { 6, 7 }, { 2, 3 } },
        { { 2, 3 }, { 5, 4 }, { 6, 7 }, { 6, 5 } },
        { { 3, 3 }, { 3, 3 }, { 4, 4 } },
    };

    public static void main(String[] args) {
        System.out.printf("%-34s%14s%16s%14s%n",
            "boxes", "sorted right", "sorted naively", "every subset");
        for (int[][] boxes : CASES) {
            System.out.printf("%-34s%14d%16d%14d%n", show(boxes),
                nestCorrect(boxes), nestNaive(boxes), brute(boxes));
        }
        System.out.println();

        final int TRIALS = 3000;
        int right = 0;
        int naive = 0;
        int hadTies = 0;
        for (int t = 0; t < TRIALS; t++) {
            int n = 1 + rand(8);
            // A narrow range of widths on purpose, so ties are common.
            int[][] boxes = new int[n][2];
            for (int i = 0; i < n; i++) {
                boxes[i][0] = 1 + rand(4);
                boxes[i][1] = 1 + rand(6);
            }
            int truth = brute(boxes);
            if (nestCorrect(boxes) == truth) right++;
            if (nestNaive(boxes) == truth) naive++;
            Set<Integer> widths = new HashSet<>();
            for (int[] box : boxes) widths.add(box[0]);
            if (widths.size() < n) hadTies++;
        }

        System.out.printf("over %d random box sets, %d of which contain two boxes of equal width:%n",
            TRIALS, hadTies);
        System.out.printf("  equal widths sorted by descending height   %6d%n", right);
        System.out.printf("  equal widths sorted by ascending height    %6d%n", naive);
        System.out.println();
        System.out.println("the naive sort lets a strictly increasing run pick two boxes of the same");
        System.out.println("width, which is not a nesting. Sorting those ties the other way makes that");
        System.out.println("impossible without any change to the run itself.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The reduction that makes this pattern worth its own lesson. "How many boxes
// nest inside each other" is two-dimensional, and sorting on one dimension turns
// it into a longest increasing subsequence on the other.
//
// The sort has a trap in it, and the trap is entirely about ties. Two boxes of
// the same width can never nest, so they must not both be pickable -- and the
// way to arrange that is to sort equal widths by *descending* height, so the
// strictly increasing run cannot take two of them.
#include <algorithm>
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <set>
#include <string>
#include <vector>

using Box = std::array<int, 2>;

int lisStrict(const std::vector<int> &values) {
    std::vector<int> tails;
    for (int value : values) {
        size_t lo = 0, hi = tails.size();
        while (lo < hi) {
            size_t mid = (lo + hi) / 2;
            if (tails[mid] < value) lo = mid + 1;
            else hi = mid;
        }
        if (lo == tails.size()) tails.push_back(value);
        else tails[lo] = value;
    }
    return static_cast<int>(tails.size());
}

std::vector<int> heights(const std::vector<Box> &boxes) {
    std::vector<int> out;
    for (const Box &box : boxes) out.push_back(box[1]);
    return out;
}

// Width ascending; equal widths by height descending; then LIS on height.
int nestCorrect(std::vector<Box> boxes) {
    std::sort(boxes.begin(), boxes.end(), [](const Box &a, const Box &b) {
        if (a[0] != b[0]) return a[0] < b[0];
        return a[1] > b[1];
    });
    return lisStrict(heights(boxes));
}

// The same, with equal widths sorted by ascending height instead.
int nestNaive(std::vector<Box> boxes) {
    std::sort(boxes.begin(), boxes.end(), [](const Box &a, const Box &b) {
        if (a[0] != b[0]) return a[0] < b[0];
        return a[1] < b[1];
    });
    return lisStrict(heights(boxes));
}

// Every subset, checked for forming a chain.
int brute(const std::vector<Box> &boxes) {
    int best = 0;
    for (int mask = 0; mask < (1 << boxes.size()); mask++) {
        std::vector<Box> picked;
        for (size_t i = 0; i < boxes.size(); i++) {
            if (mask >> i & 1) picked.push_back(boxes[i]);
        }
        std::sort(picked.begin(), picked.end());
        bool ok = true;
        for (size_t k = 0; k + 1 < picked.size(); k++) {
            if (!(picked[k][0] < picked[k + 1][0] && picked[k][1] < picked[k + 1][1])) ok = false;
        }
        if (ok && static_cast<int>(picked.size()) > best) best = static_cast<int>(picked.size());
    }
    return best;
}

std::string show(const std::vector<Box> &boxes) {
    std::string out = "[";
    for (size_t i = 0; i < boxes.size(); i++) {
        if (i > 0) out += ", ";
        out += std::to_string(boxes[i][0]) + "x" + std::to_string(boxes[i][1]);
    }
    return out + "]";
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

static const std::vector<std::vector<Box>> CASES = {
    {{5, 4}, {6, 4}, {6, 7}, {2, 3}},
    {{1, 1}, {1, 2}, {1, 3}, {1, 4}},
    {{4, 5}, {4, 6}, {6, 7}, {2, 3}},
    {{2, 3}, {5, 4}, {6, 7}, {6, 5}},
    {{3, 3}, {3, 3}, {4, 4}},
};

int main() {
    std::cout << std::left << std::setw(34) << "boxes" << std::right << std::setw(14) << "sorted right"
              << std::setw(16) << "sorted naively" << std::setw(14) << "every subset" << "\\n";
    for (const auto &boxes : CASES) {
        std::cout << std::left << std::setw(34) << show(boxes) << std::right
                  << std::setw(14) << nestCorrect(boxes) << std::setw(16) << nestNaive(boxes)
                  << std::setw(14) << brute(boxes) << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 3000;
    int right = 0, naive = 0, hadTies = 0;
    for (int t = 0; t < TRIALS; t++) {
        int n = 1 + rnd(8);
        // A narrow range of widths on purpose, so ties are common.
        std::vector<Box> boxes(n);
        for (int i = 0; i < n; i++) {
            boxes[i][0] = 1 + rnd(4);
            boxes[i][1] = 1 + rnd(6);
        }
        int truth = brute(boxes);
        if (nestCorrect(boxes) == truth) right++;
        if (nestNaive(boxes) == truth) naive++;
        std::set<int> widths;
        for (const Box &box : boxes) widths.insert(box[0]);
        if (static_cast<int>(widths.size()) < n) hadTies++;
    }

    std::cout << "over " << TRIALS << " random box sets, " << hadTies
              << " of which contain two boxes of equal width:\\n";
    std::cout << "  equal widths sorted by descending height   " << std::setw(6) << right << "\\n";
    std::cout << "  equal widths sorted by ascending height    " << std::setw(6) << naive << "\\n\\n";
    std::cout << "the naive sort lets a strictly increasing run pick two boxes of the same\\n";
    std::cout << "width, which is not a nesting. Sorting those ties the other way makes that\\n";
    std::cout << "impossible without any change to the run itself.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// The reduction that makes this pattern worth its own lesson. "How many boxes
// nest inside each other" is two-dimensional, and sorting on one dimension turns
// it into a longest increasing subsequence on the other.
//
// The sort has a trap in it, and the trap is entirely about ties. Two boxes of
// the same width can never nest, so they must not both be pickable -- and the
// way to arrange that is to sort equal widths by *descending* height, so the
// strictly increasing run cannot take two of them.
use std::collections::HashSet;

type Box2 = (i64, i64);

fn lis_strict(values: &[i64]) -> usize {
    let mut tails: Vec<i64> = Vec::new();
    for &value in values {
        let (mut lo, mut hi) = (0usize, tails.len());
        while lo < hi {
            let mid = (lo + hi) / 2;
            if tails[mid] < value {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        if lo == tails.len() {
            tails.push(value);
        } else {
            tails[lo] = value;
        }
    }
    tails.len()
}

fn heights(boxes: &[Box2]) -> Vec<i64> {
    boxes.iter().map(|b| b.1).collect()
}

/// Width ascending; equal widths by height descending; then LIS on height.
fn nest_correct(boxes: &[Box2]) -> usize {
    let mut order = boxes.to_vec();
    order.sort_by(|a, b| a.0.cmp(&b.0).then(b.1.cmp(&a.1)));
    lis_strict(&heights(&order))
}

/// The same, with equal widths sorted by ascending height instead.
fn nest_naive(boxes: &[Box2]) -> usize {
    let mut order = boxes.to_vec();
    order.sort_by(|a, b| a.0.cmp(&b.0).then(a.1.cmp(&b.1)));
    lis_strict(&heights(&order))
}

/// Every subset, checked for forming a chain.
fn brute(boxes: &[Box2]) -> usize {
    let mut best = 0;
    for mask in 0..(1u32 << boxes.len()) {
        let mut picked: Vec<Box2> = (0..boxes.len())
            .filter(|&i| mask >> i & 1 == 1)
            .map(|i| boxes[i])
            .collect();
        picked.sort();
        let ok = (0..picked.len().saturating_sub(1))
            .all(|k| picked[k].0 < picked[k + 1].0 && picked[k].1 < picked[k + 1].1);
        if ok && picked.len() > best {
            best = picked.len();
        }
    }
    best
}

fn show(boxes: &[Box2]) -> String {
    let parts: Vec<String> = boxes.iter().map(|b| format!("{}x{}", b.0, b.1)).collect();
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
    let cases: Vec<Vec<Box2>> = vec![
        vec![(5, 4), (6, 4), (6, 7), (2, 3)],
        vec![(1, 1), (1, 2), (1, 3), (1, 4)],
        vec![(4, 5), (4, 6), (6, 7), (2, 3)],
        vec![(2, 3), (5, 4), (6, 7), (6, 5)],
        vec![(3, 3), (3, 3), (4, 4)],
    ];

    println!(
        "{:<34}{:>14}{:>16}{:>14}",
        "boxes", "sorted right", "sorted naively", "every subset"
    );
    for boxes in &cases {
        println!(
            "{:<34}{:>14}{:>16}{:>14}",
            show(boxes),
            nest_correct(boxes),
            nest_naive(boxes),
            brute(boxes)
        );
    }
    println!();

    let trials = 3000;
    let mut rng = Rng { seed: 1 };
    let (mut right, mut naive, mut had_ties) = (0, 0, 0);
    for _ in 0..trials {
        let n = 1 + rng.next(8);
        // A narrow range of widths on purpose, so ties are common.
        let boxes: Vec<Box2> = (0..n).map(|_| (1 + rng.next(4), 1 + rng.next(6))).collect();
        let truth = brute(&boxes);
        if nest_correct(&boxes) == truth {
            right += 1;
        }
        if nest_naive(&boxes) == truth {
            naive += 1;
        }
        let widths: HashSet<i64> = boxes.iter().map(|b| b.0).collect();
        if widths.len() < boxes.len() {
            had_ties += 1;
        }
    }

    println!(
        "over {} random box sets, {} of which contain two boxes of equal width:",
        trials, had_ties
    );
    println!("  equal widths sorted by descending height   {:>6}", right);
    println!("  equal widths sorted by ascending height    {:>6}", naive);
    println!();
    println!("the naive sort lets a strictly increasing run pick two boxes of the same");
    println!("width, which is not a nesting. Sorting those ties the other way makes that");
    println!("impossible without any change to the run itself.");
}
`,
            },
            {
              lang: "go",
              code: `// The reduction that makes this pattern worth its own lesson. "How many boxes
// nest inside each other" is two-dimensional, and sorting on one dimension turns
// it into a longest increasing subsequence on the other.
//
// The sort has a trap in it, and the trap is entirely about ties. Two boxes of
// the same width can never nest, so they must not both be pickable -- and the
// way to arrange that is to sort equal widths by *descending* height, so the
// strictly increasing run cannot take two of them.
package main

import (
	"fmt"
	"sort"
	"strings"
)

func lisStrict(values []int) int {
	var tails []int
	for _, value := range values {
		lo, hi := 0, len(tails)
		for lo < hi {
			mid := (lo + hi) / 2
			if tails[mid] < value {
				lo = mid + 1
			} else {
				hi = mid
			}
		}
		if lo == len(tails) {
			tails = append(tails, value)
		} else {
			tails[lo] = value
		}
	}
	return len(tails)
}

func copyOf(boxes [][2]int) [][2]int {
	out := make([][2]int, len(boxes))
	copy(out, boxes)
	return out
}

func heights(boxes [][2]int) []int {
	out := make([]int, len(boxes))
	for i, box := range boxes {
		out[i] = box[1]
	}
	return out
}

// Width ascending; equal widths by height descending; then LIS on height.
func nestCorrect(boxes [][2]int) int {
	order := copyOf(boxes)
	sort.Slice(order, func(i, j int) bool {
		if order[i][0] != order[j][0] {
			return order[i][0] < order[j][0]
		}
		return order[i][1] > order[j][1]
	})
	return lisStrict(heights(order))
}

// The same, with equal widths sorted by ascending height instead.
func nestNaive(boxes [][2]int) int {
	order := copyOf(boxes)
	sort.Slice(order, func(i, j int) bool {
		if order[i][0] != order[j][0] {
			return order[i][0] < order[j][0]
		}
		return order[i][1] < order[j][1]
	})
	return lisStrict(heights(order))
}

// Every subset, checked for forming a chain.
func brute(boxes [][2]int) int {
	best := 0
	for mask := 0; mask < 1<<len(boxes); mask++ {
		var picked [][2]int
		for i := range boxes {
			if mask>>i&1 == 1 {
				picked = append(picked, boxes[i])
			}
		}
		sort.Slice(picked, func(i, j int) bool {
			if picked[i][0] != picked[j][0] {
				return picked[i][0] < picked[j][0]
			}
			return picked[i][1] < picked[j][1]
		})
		ok := true
		for k := 0; k+1 < len(picked); k++ {
			if !(picked[k][0] < picked[k+1][0] && picked[k][1] < picked[k+1][1]) {
				ok = false
			}
		}
		if ok && len(picked) > best {
			best = len(picked)
		}
	}
	return best
}

func show(boxes [][2]int) string {
	parts := make([]string, len(boxes))
	for i, box := range boxes {
		parts[i] = fmt.Sprintf("%dx%d", box[0], box[1])
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

var CASES = [][][2]int{
	{{5, 4}, {6, 4}, {6, 7}, {2, 3}},
	{{1, 1}, {1, 2}, {1, 3}, {1, 4}},
	{{4, 5}, {4, 6}, {6, 7}, {2, 3}},
	{{2, 3}, {5, 4}, {6, 7}, {6, 5}},
	{{3, 3}, {3, 3}, {4, 4}},
}

func main() {
	fmt.Printf("%-34s%14s%16s%14s\\n", "boxes", "sorted right", "sorted naively", "every subset")
	for _, boxes := range CASES {
		fmt.Printf("%-34s%14d%16d%14d\\n", show(boxes), nestCorrect(boxes), nestNaive(boxes), brute(boxes))
	}
	fmt.Println()

	const TRIALS = 3000
	right, naive, hadTies := 0, 0, 0
	for t := 0; t < TRIALS; t++ {
		n := 1 + rand(8)
		// A narrow range of widths on purpose, so ties are common.
		boxes := make([][2]int, n)
		for i := 0; i < n; i++ {
			boxes[i] = [2]int{1 + rand(4), 1 + rand(6)}
		}
		truth := brute(boxes)
		if nestCorrect(boxes) == truth {
			right++
		}
		if nestNaive(boxes) == truth {
			naive++
		}
		widths := map[int]bool{}
		for _, box := range boxes {
			widths[box[0]] = true
		}
		if len(widths) < n {
			hadTies++
		}
	}

	fmt.Printf("over %d random box sets, %d of which contain two boxes of equal width:\\n", TRIALS, hadTies)
	fmt.Printf("  equal widths sorted by descending height   %6d\\n", right)
	fmt.Printf("  equal widths sorted by ascending height    %6d\\n", naive)
	fmt.Println()
	fmt.Println("the naive sort lets a strictly increasing run pick two boxes of the same")
	fmt.Println("width, which is not a nesting. Sorting those ties the other way makes that")
	fmt.Println("impossible without any change to the run itself.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Sorting ties the wrong way silently breaks the reduction",
          body: "Equal widths sorted by ascending height let a strictly increasing run pick two boxes that cannot nest. Sorted by descending height, it cannot. The LIS code is identical in both cases and cannot detect the difference, which is why the comparator has to be treated as part of the algorithm rather than as setup.",
        },
        {
          title: "Check the reduction on the degenerate input first",
          body: "Four boxes of the same width answer 1, and the naive sort says 4. Any case where every element ties on the sorted dimension will expose a comparator that orders ties wrongly, and it takes one line to write.",
        },
      ],
    },
    {
      id: "the-shape",
      heading: "The shape, and what identifies it",
      body: [
        "The shape, then, and the questions that identify it.",
        "**The state is one index, and it names an ending rather than a prefix.** That is the piece to reach for whenever a prefix answer is not enough to decide the next step. It also means the answer is the largest cell rather than the last one \u2014 the same caution as the longest common substring reading in the previous lesson, for the same reason.",
        "**The transition looks backwards at every earlier index**, which is what makes the plain version quadratic. The `tails` array replaces that scan with a binary search, and only works because the quantity it maintains is monotonic.",
        "**Watch for the word \"strictly\".** It is one comparison, and getting it wrong is right often enough to pass a casual test.",
        "**And look for a second dimension that a sort can absorb.** Two constraints, one of which is a total order, is the signature. When you see it, the interesting question stops being the dynamic program and becomes the comparator \u2014 in particular what it does with ties.",
        "What this family does not have is a budget. Nothing here scales with the magnitude of the values, only with how many there are, so unlike the knapsack lessons there is no pseudo-polynomial catch. Large values cost nothing; many values cost `O(n log n)`.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does the longest increasing subsequence need `ending[i]` rather than `best(i)`?",
      answer:
        "Because \"the longest increasing run in the first i values\" fails the optimal-substructure requirement: it does not record what the run ended on, so it cannot tell you whether values[i] extends it. Moving the ending into the state fixes that \u2014 `ending[i]` is the longest run finishing exactly at index i, and now the transition is well defined: scan every j < i with values[j] < values[i] and take the best plus one. The cost of that relocation is that the answer moves. It is the largest cell in the array rather than the last one, because the best run may end anywhere, and returning the last cell is a bug that passes on any input whose best run happens to reach the end.",
    },
    {
      question: "Explain the O(n log n) algorithm, and what the array it maintains actually holds.",
      answer:
        "It keeps an array `tails` where `tails[k]` is the smallest value on which any increasing run of length k + 1 can end. Each new value is binary-searched into it: if it is above everything, it appends and the answer grows by one; otherwise it replaces the first entry not below it, which does not change the length but lowers the bar for whatever comes next. That is why the array stays sorted and why the search is valid. The important caveat is that its length is the answer and its contents are not the subsequence \u2014 a small value arriving late overwrites an early tail, leaving an array that could never have been read off the input in order. On 3,000 random arrays it happened to be a genuine subsequence only 1,804 times. If the actual subsequence is wanted, use the quadratic table with parent pointers.",
    },
    {
      question: "How would you find how many boxes can nest inside one another?",
      answer:
        "Sort by width and run a strictly increasing longest-subsequence on the heights. The sort discharges the width constraint, so all that is left is the height one. The part to say out loud is the tie handling: two boxes of equal width can never nest, so equal widths must be sorted by descending height. Ascending would leave them increasing on the second axis too, and the run would pick both \u2014 on four boxes of the same width it reports 4 where the answer is 1. Measured against exhaustive search over 3,000 random box sets, the correct comparator is right every time and the naive one 1,607 times. The comparator is part of the algorithm here, not setup.",
    },
    {
      question: "Does this family have the pseudo-polynomial problem that knapsack does?",
      answer:
        "No, and the reason is worth being precise about. Knapsack's table is indexed by capacity, so its size scales with the magnitude of a number in the input rather than with how many numbers there are \u2014 doubling the capacity doubles the work while the input grows by one digit. Nothing here is indexed by a value. The quadratic version is O(n^2) in the count of elements and the tails version O(n log n), regardless of how large the values are. The two-dimensional reductions inherit that, since the sort is O(n log n) as well.",
    },
  ],
  takeaways: [
    "The workable state names an ending, not a prefix: `ending[i]` is the longest run finishing exactly at index `i`.",
    "Because the run can end anywhere, the answer is the largest cell rather than the last one.",
    "The `tails` array holds the smallest ending value for a run of each length, giving `O(n log n)` by binary search.",
    "Its length is always the answer; its contents were a genuine subsequence on only 1,804 of 3,000 random arrays.",
    "Strict and non-strict differ by one comparison, and getting it wrong still scored 917 out of 3,000.",
    "Arrays of distinct values hide that bug entirely, so any test set for it needs deliberate duplicates.",
    "Two-dimensional problems like box nesting reduce here by sorting one dimension away.",
    "In that reduction the comparator carries correctness: equal keys must be ordered so the run cannot take two of them.",
    "Nothing in this family is indexed by a value, so there is no pseudo-polynomial catch.",
  ],
  status: "available",
};
