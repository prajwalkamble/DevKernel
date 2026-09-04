import type { Lesson } from "@/content/types";

export const definingTheStateLesson: Lesson = {
  id: "dsa-dp-defining-the-state",
  slug: "defining-the-state",
  moduleSlug: "dynamic-programming-foundations",
  title: "Defining the State",
  summary:
    "Everything else follows almost mechanically once the state is right, and nothing can be got right while it is vague. The test is a sentence you can write down, and the three ways it fails are a sentence that is not a function, a dimension that rules nothing out, and a rule the state cannot express.",
  estimatedMinutes: 40,
  objectives: [
    "Write the one-sentence definition of a cell, and test whether it is a function at all",
    "Recognise that the answer is often a fold over the states rather than one of them",
    "Delete a dimension that rules nothing out, and keep one that does",
    "Spot a rule the current state cannot express, and add the dimension that lets it",
  ],
  sections: [
    {
      id: "a-sentence-first",
      heading: "A state is a sentence before it is an array",
      body: [
        "Ask somebody stuck on a dynamic programming problem what `dp[i]` means and you will usually get a pause, then something like \"the best answer so far\". That pause is the whole problem. Everything else in this module \u2014 the recurrence, the base cases, the loop order, the space optimisation \u2014 follows almost mechanically once the state is right, and none of it can be got right while the state is vague.",
        "So here is the test, and it is worth applying literally. **Say what `dp[i]` means in one English sentence that never uses the word `dp`, and that a stranger could use to fill in any single cell by hand without seeing your code.** If you cannot write that sentence, you do not have a state yet, and writing the recurrence first will not produce one.",
        "The reason the test bites is that a sentence can be true, precise and computable and still not be a state. Below are two sentences about longest increasing subsequences. Both describe a real quantity. Only one of them supports a recurrence, and the one that fails is the one almost everybody writes first \u2014 because it is the answer, and defining `dp[n]` to be the answer feels like progress.",
        "The search finds its witness after six random arrays, which is the point: this is not an exotic corner case. Two prefixes both arrive with sentence A's value equal to 1 and both read the value 6 next. Everything A remembers about them is identical. One continues to 2 and the other to 1, so no rule from `(dp[i-1], next value)` to `dp[i]` can exist, and A is not a state no matter how carefully the recurrence is written.",
        "What A forgot is what the best subsequence *ended on*. `[8, 5, 1, 6]` can extend a run that ended at 1; `[12, 6]` cannot extend one that ended at 12. Sentence B carries exactly that, by insisting the subsequence ends at index `i`, and the recurrence closes immediately: look back at every earlier index holding a smaller value and take the best of them, plus one.",
        "The price is that `dp[n-1]` is no longer the answer \u2014 you have to take the largest cell in the table. That trade shows up constantly and is worth expecting: **a state that is literally the answer is usually not a state**, and the answer is usually a fold over the states rather than one of them. Being willing to define something that is not quite what you were asked for is most of the skill.",
      ],
      examples: [
        {
          id: "two-sentences",
          title: "Two sentences about the same problem, one of which is a state",
          lang: "python",
          code: `# The state is the whole job, and a state is a sentence before it is an array.
# Here are two sentences for the same problem. Both are true statements about
# longest increasing subsequences. Only one of them is a state.
#
#   A: dp[i] is the length of the longest increasing subsequence
#      among the first i values.
#   B: dp[i] is the length of the longest increasing subsequence
#      that ends exactly at value i.
#
# Sentence A is the one people write first, and this program is the search that
# shows it cannot be a state: two prefixes agreeing on everything A remembers,
# disagreeing on what comes next.

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


def prefix_lis(values):
    """Sentence A, computed honestly: the best over the whole prefix, for each i."""
    best = []
    for i in range(len(values) + 1):
        ending = [1] * i
        for a in range(i):
            for b in range(a):
                if values[b] < values[a] and ending[b] + 1 > ending[a]:
                    ending[a] = ending[b] + 1
        best.append(max(ending) if ending else 0)
    return best


# If A were a state there would be a rule taking dp[i-1] and the next value to
# dp[i]. Hunt for two situations where that rule would have to give two answers.
def show(values):
    return "[" + ", ".join(str(v) for v in values) + "]"


seen = {}
witness = None
trials = 0
while witness is None and trials < 200000:
    trials += 1
    values = [1 + rand(20) for _ in range(2 + rand(7))]
    best = prefix_lis(values)
    for i in range(1, len(values) + 1):
        key = best[i - 1] * 100 + values[i - 1]   # what sentence A would remember
        if key in seen:
            other, other_i, other_best = seen[key]
            if other_best[other_i] != best[i]:
                witness = (other, other_i, other_best, values, i, best)
                break
        else:
            seen[key] = (values, i, best)

left, li, lbest, right, ri, rbest = witness
print("sentence A: dp[i] is the best subsequence among the first i values")
print()
print(f"  {show(left):<26} first {li} values -> {lbest[li]}")
print(f"  {show(right):<26} first {ri} values -> {rbest[ri]}")
print()
print(f"  both arrive with dp = {lbest[li - 1]} and read the value {left[li - 1]},")
print(f"  and A has to answer both {lbest[li]} and {rbest[ri]}. It is not a state.")
print(f"  ({trials} random arrays searched)")
print()

# Sentence B, which pins down the one thing A forgot: what the subsequence ends
# on. That is enough to extend it, so the recurrence closes.
def lis_ending_at(values):
    ending = [1] * len(values)
    for a in range(len(values)):
        for b in range(a):
            if values[b] < values[a] and ending[b] + 1 > ending[a]:
                ending[a] = ending[b] + 1
    return ending


def brute_force_lis(values):
    n = len(values)
    top = 0
    for mask in range(1 << n):
        picked = [values[i] for i in range(n) if mask >> i & 1]
        rising = all(picked[k] < picked[k + 1] for k in range(len(picked) - 1))
        if rising and len(picked) > top:
            top = len(picked)
    return top


DEMO = [3, 10, 2, 1, 20, 4, 6, 21, 5, 11, 7, 15]
ending = lis_ending_at(DEMO)
print("sentence B: dp[i] is the best subsequence ending exactly at index i")
print()
print("  index  " + "".join(f"{i:>4}" for i in range(len(DEMO))))
print("  value  " + "".join(f"{v:>4}" for v in DEMO))
print("  dp     " + "".join(f"{d:>4}" for d in ending))
print()
print(f"  answer is the largest of those: {max(ending)}")
print(f"  every one of the {1 << len(DEMO)} subsequences agrees: {brute_force_lis(DEMO)}")
print()

agree = 0
TRIALS = 3000
for _ in range(TRIALS):
    values = [1 + rand(20) for _ in range(1 + rand(12))]
    if max(lis_ending_at(values)) == brute_force_lis(values):
        agree += 1
print(f"sentence B against brute force on {TRIALS} random arrays: {agree} agree")
`,
          output: `sentence A: dp[i] is the best subsequence among the first i values

  [8, 5, 1, 6, 4, 10, 4]     first 4 values -> 2
  [12, 6, 3, 17, 5]          first 2 values -> 1

  both arrive with dp = 1 and read the value 6,
  and A has to answer both 2 and 1. It is not a state.
  (6 random arrays searched)

sentence B: dp[i] is the best subsequence ending exactly at index i

  index     0   1   2   3   4   5   6   7   8   9  10  11
  value     3  10   2   1  20   4   6  21   5  11   7  15
  dp        1   2   1   1   3   2   3   4   3   4   4   5

  answer is the largest of those: 5
  every one of the 4096 subsequences agrees: 5

sentence B against brute force on 3000 random arrays: 3000 agree`,
          explanation:
            "The first half hunts for a witness against sentence A: two prefixes agreeing on everything A remembers and disagreeing on what happens next. Finding one takes six random arrays. The second half is sentence B, whose table is printed in full and checked against all 4,096 subsequences of the demo array and then against brute force on three thousand more.",
          alternates: [
            {
              lang: "javascript",
              code: `// The state is the whole job, and a state is a sentence before it is an array.
// Here are two sentences for the same problem. Both are true statements about
// longest increasing subsequences. Only one of them is a state.
//
//   A: dp[i] is the length of the longest increasing subsequence
//      among the first i values.
//   B: dp[i] is the length of the longest increasing subsequence
//      that ends exactly at value i.
//
// Sentence A is the one people write first, and this program is the search that
// shows it cannot be a state: two prefixes agreeing on everything A remembers,
// disagreeing on what comes next.

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

/** Sentence A, computed honestly: the best over the whole prefix, for each i. */
function prefixLis(values) {
  const best = [];
  for (let i = 0; i <= values.length; i++) {
    const ending = new Array(i).fill(1);
    let top = 0;
    for (let a = 0; a < i; a++) {
      for (let b = 0; b < a; b++) {
        if (values[b] < values[a] && ending[b] + 1 > ending[a]) ending[a] = ending[b] + 1;
      }
      if (ending[a] > top) top = ending[a];
    }
    best.push(top);
  }
  return best;
}

const show = (values) => \`[\${values.join(", ")}]\`;
const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);

function lisEndingAt(values) {
  const ending = new Array(values.length).fill(1);
  for (let a = 0; a < values.length; a++) {
    for (let b = 0; b < a; b++) {
      if (values[b] < values[a] && ending[b] + 1 > ending[a]) ending[a] = ending[b] + 1;
    }
  }
  return ending;
}

function bruteForceLis(values) {
  const n = values.length;
  let top = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    const picked = values.filter((_, i) => (mask >> i) & 1);
    let rising = true;
    for (let k = 0; k + 1 < picked.length; k++) if (picked[k] >= picked[k + 1]) rising = false;
    if (rising && picked.length > top) top = picked.length;
  }
  return top;
}

// If A were a state there would be a rule taking dp[i-1] and the next value to
// dp[i]. Hunt for two situations where that rule would have to give two answers.
const seen = new Map();
let witness = null;
let trials = 0;
while (witness === null && trials < 200000) {
  trials++;
  const n = 2 + rand(7);
  const values = Array.from({ length: n }, () => 1 + rand(20));
  const best = prefixLis(values);
  for (let i = 1; i <= n; i++) {
    const key = best[i - 1] * 100 + values[i - 1];   // what sentence A would remember
    const other = seen.get(key);
    if (other !== undefined) {
      if (other.best[other.index] !== best[i]) {
        witness = [other.values, other.index, other.best, values, i, best];
        break;
      }
    } else {
      seen.set(key, { values, index: i, best });
    }
  }
}

const [left, li, lbest, right, ri, rbest] = witness;
console.log("sentence A: dp[i] is the best subsequence among the first i values");
console.log();
console.log(\`  \${padEnd(show(left), 26)} first \${li} values -> \${lbest[li]}\`);
console.log(\`  \${padEnd(show(right), 26)} first \${ri} values -> \${rbest[ri]}\`);
console.log();
console.log(\`  both arrive with dp = \${lbest[li - 1]} and read the value \${left[li - 1]},\`);
console.log(\`  and A has to answer both \${lbest[li]} and \${rbest[ri]}. It is not a state.\`);
console.log(\`  (\${trials} random arrays searched)\`);
console.log();

// Sentence B, which pins down the one thing A forgot: what the subsequence ends
// on. That is enough to extend it, so the recurrence closes.
const DEMO = [3, 10, 2, 1, 20, 4, 6, 21, 5, 11, 7, 15];
const ending = lisEndingAt(DEMO);
console.log("sentence B: dp[i] is the best subsequence ending exactly at index i");
console.log();
console.log("  index  " + DEMO.map((_, i) => pad(i, 4)).join(""));
console.log("  value  " + DEMO.map((v) => pad(v, 4)).join(""));
console.log("  dp     " + ending.map((d) => pad(d, 4)).join(""));
console.log();
console.log(\`  answer is the largest of those: \${Math.max(...ending)}\`);
console.log(\`  every one of the \${1 << DEMO.length} subsequences agrees: \${bruteForceLis(DEMO)}\`);
console.log();

let agree = 0;
const TRIALS = 3000;
for (let t = 0; t < TRIALS; t++) {
  const n = 1 + rand(12);
  const values = Array.from({ length: n }, () => 1 + rand(20));
  if (Math.max(...lisEndingAt(values)) === bruteForceLis(values)) agree++;
}
console.log(\`sentence B against brute force on \${TRIALS} random arrays: \${agree} agree\`);
`,
            },
            {
              lang: "typescript",
              code: `// The state is the whole job, and a state is a sentence before it is an array.
// Here are two sentences for the same problem. Both are true statements about
// longest increasing subsequences. Only one of them is a state.
//
//   A: dp[i] is the length of the longest increasing subsequence
//      among the first i values.
//   B: dp[i] is the length of the longest increasing subsequence
//      that ends exactly at value i.
//
// Sentence A is the one people write first, and this program is the search that
// shows it cannot be a state: two prefixes agreeing on everything A remembers,
// disagreeing on what comes next.

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

/** Sentence A, computed honestly: the best over the whole prefix, for each i. */
function prefixLis(values: number[]): number[] {
  const best: number[] = [];
  for (let i = 0; i <= values.length; i++) {
    const ending = new Array(i).fill(1);
    let top = 0;
    for (let a = 0; a < i; a++) {
      for (let b = 0; b < a; b++) {
        if (values[b] < values[a] && ending[b] + 1 > ending[a]) ending[a] = ending[b] + 1;
      }
      if (ending[a] > top) top = ending[a];
    }
    best.push(top);
  }
  return best;
}

const show = (values: number[]): string => \`[\${values.join(", ")}]\`;
const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

function lisEndingAt(values: number[]): number[] {
  const ending = new Array(values.length).fill(1);
  for (let a = 0; a < values.length; a++) {
    for (let b = 0; b < a; b++) {
      if (values[b] < values[a] && ending[b] + 1 > ending[a]) ending[a] = ending[b] + 1;
    }
  }
  return ending;
}

function bruteForceLis(values: number[]): number {
  const n = values.length;
  let top = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    const picked = values.filter((_, i) => (mask >> i) & 1);
    let rising = true;
    for (let k = 0; k + 1 < picked.length; k++) if (picked[k] >= picked[k + 1]) rising = false;
    if (rising && picked.length > top) top = picked.length;
  }
  return top;
}

// If A were a state there would be a rule taking dp[i-1] and the next value to
// dp[i]. Hunt for two situations where that rule would have to give two answers.
interface Sighting {
  values: number[];
  index: number;
  best: number[];
}

const seen = new Map<number, Sighting>();
let witness: [number[], number, number[], number[], number, number[]] | null = null;
let trials = 0;
while (witness === null && trials < 200000) {
  trials++;
  const n = 2 + rand(7);
  const values = Array.from({ length: n }, () => 1 + rand(20));
  const best = prefixLis(values);
  for (let i = 1; i <= n; i++) {
    const key = best[i - 1] * 100 + values[i - 1];   // what sentence A would remember
    const other = seen.get(key);
    if (other !== undefined) {
      if (other.best[other.index] !== best[i]) {
        witness = [other.values, other.index, other.best, values, i, best];
        break;
      }
    } else {
      seen.set(key, { values, index: i, best });
    }
  }
}

const [left, li, lbest, right, ri, rbest] = witness!;
console.log("sentence A: dp[i] is the best subsequence among the first i values");
console.log();
console.log(\`  \${padEnd(show(left), 26)} first \${li} values -> \${lbest[li]}\`);
console.log(\`  \${padEnd(show(right), 26)} first \${ri} values -> \${rbest[ri]}\`);
console.log();
console.log(\`  both arrive with dp = \${lbest[li - 1]} and read the value \${left[li - 1]},\`);
console.log(\`  and A has to answer both \${lbest[li]} and \${rbest[ri]}. It is not a state.\`);
console.log(\`  (\${trials} random arrays searched)\`);
console.log();

// Sentence B, which pins down the one thing A forgot: what the subsequence ends
// on. That is enough to extend it, so the recurrence closes.
const DEMO = [3, 10, 2, 1, 20, 4, 6, 21, 5, 11, 7, 15];
const ending = lisEndingAt(DEMO);
console.log("sentence B: dp[i] is the best subsequence ending exactly at index i");
console.log();
console.log("  index  " + DEMO.map((_, i) => pad(i, 4)).join(""));
console.log("  value  " + DEMO.map((v) => pad(v, 4)).join(""));
console.log("  dp     " + ending.map((d) => pad(d, 4)).join(""));
console.log();
console.log(\`  answer is the largest of those: \${Math.max(...ending)}\`);
console.log(\`  every one of the \${1 << DEMO.length} subsequences agrees: \${bruteForceLis(DEMO)}\`);
console.log();

let agree = 0;
const TRIALS = 3000;
for (let t = 0; t < TRIALS; t++) {
  const n = 1 + rand(12);
  const values = Array.from({ length: n }, () => 1 + rand(20));
  if (Math.max(...lisEndingAt(values)) === bruteForceLis(values)) agree++;
}
console.log(\`sentence B against brute force on \${TRIALS} random arrays: \${agree} agree\`);
`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// The state is the whole job, and a state is a sentence before it is an array.
// Here are two sentences for the same problem. Both are true statements about
// longest increasing subsequences. Only one of them is a state.
//
//   A: dp[i] is the length of the longest increasing subsequence
//      among the first i values.
//   B: dp[i] is the length of the longest increasing subsequence
//      that ends exactly at value i.
//
// Sentence A is the one people write first, and this program is the search that
// shows it cannot be a state: two prefixes agreeing on everything A remembers,
// disagreeing on what comes next.
public class Main {
    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    /** Sentence A, computed honestly: the best over the whole prefix, for each i. */
    static int[] prefixLis(int[] values) {
        int[] best = new int[values.length + 1];
        for (int i = 0; i <= values.length; i++) {
            int[] ending = new int[i];
            int top = 0;
            for (int a = 0; a < i; a++) {
                ending[a] = 1;
                for (int b = 0; b < a; b++) {
                    if (values[b] < values[a] && ending[b] + 1 > ending[a]) ending[a] = ending[b] + 1;
                }
                if (ending[a] > top) top = ending[a];
            }
            best[i] = top;
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

    static int[] lisEndingAt(int[] values) {
        int[] ending = new int[values.length];
        for (int a = 0; a < values.length; a++) {
            ending[a] = 1;
            for (int b = 0; b < a; b++) {
                if (values[b] < values[a] && ending[b] + 1 > ending[a]) ending[a] = ending[b] + 1;
            }
        }
        return ending;
    }

    static int bruteForceLis(int[] values) {
        int n = values.length;
        int top = 0;
        for (int mask = 0; mask < (1 << n); mask++) {
            List<Integer> picked = new ArrayList<>();
            for (int i = 0; i < n; i++) if ((mask >> i & 1) == 1) picked.add(values[i]);
            boolean rising = true;
            for (int k = 0; k + 1 < picked.size(); k++) {
                if (picked.get(k) >= picked.get(k + 1)) rising = false;
            }
            if (rising && picked.size() > top) top = picked.size();
        }
        return top;
    }

    public static void main(String[] args) {
        // If A were a state there would be a rule taking dp[i-1] and the next
        // value to dp[i]. Hunt for two situations where that rule would have to
        // give two answers.
        Map<Integer, int[]> seenValues = new HashMap<>();
        Map<Integer, Integer> seenIndex = new HashMap<>();
        Map<Integer, int[]> seenBest = new HashMap<>();
        int[] left = null, right = null, lbest = null, rbest = null;
        int li = 0, ri = 0;
        int trials = 0;
        while (left == null && trials < 200000) {
            trials++;
            int n = 2 + rand(7);
            int[] values = new int[n];
            for (int i = 0; i < n; i++) values[i] = 1 + rand(20);
            int[] best = prefixLis(values);
            for (int i = 1; i <= n; i++) {
                int key = best[i - 1] * 100 + values[i - 1];   // what sentence A would remember
                if (seenValues.containsKey(key)) {
                    int otherI = seenIndex.get(key);
                    int[] otherBest = seenBest.get(key);
                    if (otherBest[otherI] != best[i]) {
                        left = seenValues.get(key);
                        li = otherI;
                        lbest = otherBest;
                        right = values;
                        ri = i;
                        rbest = best;
                        break;
                    }
                } else {
                    seenValues.put(key, values);
                    seenIndex.put(key, i);
                    seenBest.put(key, best);
                }
            }
        }

        System.out.println("sentence A: dp[i] is the best subsequence among the first i values");
        System.out.println();
        System.out.printf("  %-26s first %d values -> %d%n", show(left), li, lbest[li]);
        System.out.printf("  %-26s first %d values -> %d%n", show(right), ri, rbest[ri]);
        System.out.println();
        System.out.printf("  both arrive with dp = %d and read the value %d,%n", lbest[li - 1], left[li - 1]);
        System.out.printf("  and A has to answer both %d and %d. It is not a state.%n", lbest[li], rbest[ri]);
        System.out.printf("  (%d random arrays searched)%n", trials);
        System.out.println();

        // Sentence B, which pins down the one thing A forgot: what the
        // subsequence ends on. That is enough to extend it, so the recurrence
        // closes.
        int[] demo = { 3, 10, 2, 1, 20, 4, 6, 21, 5, 11, 7, 15 };
        int[] ending = lisEndingAt(demo);
        System.out.println("sentence B: dp[i] is the best subsequence ending exactly at index i");
        System.out.println();
        StringBuilder idx = new StringBuilder("  index  ");
        StringBuilder val = new StringBuilder("  value  ");
        StringBuilder dp = new StringBuilder("  dp     ");
        int top = 0;
        for (int i = 0; i < demo.length; i++) {
            idx.append(String.format("%4d", i));
            val.append(String.format("%4d", demo[i]));
            dp.append(String.format("%4d", ending[i]));
            if (ending[i] > top) top = ending[i];
        }
        System.out.println(idx);
        System.out.println(val);
        System.out.println(dp);
        System.out.println();
        System.out.printf("  answer is the largest of those: %d%n", top);
        System.out.printf("  every one of the %d subsequences agrees: %d%n", 1 << demo.length, bruteForceLis(demo));
        System.out.println();

        int agree = 0;
        final int TRIALS = 3000;
        for (int t = 0; t < TRIALS; t++) {
            int n = 1 + rand(12);
            int[] values = new int[n];
            for (int i = 0; i < n; i++) values[i] = 1 + rand(20);
            int[] e = lisEndingAt(values);
            int best = 0;
            for (int v : e) if (v > best) best = v;
            if (best == bruteForceLis(values)) agree++;
        }
        System.out.printf("sentence B against brute force on %d random arrays: %d agree%n", TRIALS, agree);
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The state is the whole job, and a state is a sentence before it is an array.
// Here are two sentences for the same problem. Both are true statements about
// longest increasing subsequences. Only one of them is a state.
//
//   A: dp[i] is the length of the longest increasing subsequence
//      among the first i values.
//   B: dp[i] is the length of the longest increasing subsequence
//      that ends exactly at value i.
//
// Sentence A is the one people write first, and this program is the search that
// shows it cannot be a state: two prefixes agreeing on everything A remembers,
// disagreeing on what comes next.
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <vector>

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

// Sentence A, computed honestly: the best over the whole prefix, for each i.
std::vector<int> prefixLis(const std::vector<int> &values) {
    std::vector<int> best(values.size() + 1, 0);
    for (size_t i = 0; i <= values.size(); i++) {
        std::vector<int> ending(i, 1);
        int top = 0;
        for (size_t a = 0; a < i; a++) {
            for (size_t b = 0; b < a; b++) {
                if (values[b] < values[a] && ending[b] + 1 > ending[a]) ending[a] = ending[b] + 1;
            }
            if (ending[a] > top) top = ending[a];
        }
        best[i] = top;
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

std::vector<int> lisEndingAt(const std::vector<int> &values) {
    std::vector<int> ending(values.size(), 1);
    for (size_t a = 0; a < values.size(); a++) {
        for (size_t b = 0; b < a; b++) {
            if (values[b] < values[a] && ending[b] + 1 > ending[a]) ending[a] = ending[b] + 1;
        }
    }
    return ending;
}

int bruteForceLis(const std::vector<int> &values) {
    int n = static_cast<int>(values.size());
    int top = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        std::vector<int> picked;
        for (int i = 0; i < n; i++)
            if (mask >> i & 1) picked.push_back(values[i]);
        bool rising = true;
        for (size_t k = 0; k + 1 < picked.size(); k++)
            if (picked[k] >= picked[k + 1]) rising = false;
        if (rising && static_cast<int>(picked.size()) > top) top = static_cast<int>(picked.size());
    }
    return top;
}

struct Sighting {
    std::vector<int> values;
    int index;
    std::vector<int> best;
};

int main() {
    // If A were a state there would be a rule taking dp[i-1] and the next value
    // to dp[i]. Hunt for two situations where that rule would have to give two
    // answers.
    std::map<int, Sighting> seen;
    std::vector<int> left, right, lbest, rbest;
    int li = 0, ri = 0, trials = 0;
    while (left.empty() && trials < 200000) {
        trials++;
        int n = 2 + rnd(7);
        std::vector<int> values(n);
        for (int i = 0; i < n; i++) values[i] = 1 + rnd(20);
        std::vector<int> best = prefixLis(values);
        for (int i = 1; i <= n; i++) {
            int key = best[i - 1] * 100 + values[i - 1];   // what sentence A would remember
            auto it = seen.find(key);
            if (it != seen.end()) {
                if (it->second.best[it->second.index] != best[i]) {
                    left = it->second.values;
                    li = it->second.index;
                    lbest = it->second.best;
                    right = values;
                    ri = i;
                    rbest = best;
                    break;
                }
            } else {
                seen[key] = Sighting{values, i, best};
            }
        }
    }

    std::cout << "sentence A: dp[i] is the best subsequence among the first i values\\n\\n";
    std::cout << "  " << std::left << std::setw(26) << show(left) << " first " << li
              << " values -> " << lbest[li] << "\\n";
    std::cout << "  " << std::left << std::setw(26) << show(right) << " first " << ri
              << " values -> " << rbest[ri] << "\\n\\n";
    std::cout << "  both arrive with dp = " << lbest[li - 1] << " and read the value "
              << left[li - 1] << ",\\n";
    std::cout << "  and A has to answer both " << lbest[li] << " and " << rbest[ri]
              << ". It is not a state.\\n";
    std::cout << "  (" << trials << " random arrays searched)\\n\\n";

    // Sentence B, which pins down the one thing A forgot: what the subsequence
    // ends on. That is enough to extend it, so the recurrence closes.
    std::vector<int> demo = {3, 10, 2, 1, 20, 4, 6, 21, 5, 11, 7, 15};
    std::vector<int> ending = lisEndingAt(demo);
    std::cout << "sentence B: dp[i] is the best subsequence ending exactly at index i\\n\\n";
    std::cout << "  index  ";
    for (size_t i = 0; i < demo.size(); i++) std::cout << std::right << std::setw(4) << i;
    std::cout << "\\n  value  ";
    for (int v : demo) std::cout << std::right << std::setw(4) << v;
    std::cout << "\\n  dp     ";
    int top = 0;
    for (int v : ending) {
        std::cout << std::right << std::setw(4) << v;
        if (v > top) top = v;
    }
    std::cout << "\\n\\n";
    std::cout << "  answer is the largest of those: " << top << "\\n";
    std::cout << "  every one of the " << (1 << demo.size()) << " subsequences agrees: "
              << bruteForceLis(demo) << "\\n\\n";

    int agree = 0;
    const int TRIALS = 3000;
    for (int t = 0; t < TRIALS; t++) {
        int n = 1 + rnd(12);
        std::vector<int> values(n);
        for (int i = 0; i < n; i++) values[i] = 1 + rnd(20);
        std::vector<int> e = lisEndingAt(values);
        int best = 0;
        for (int v : e)
            if (v > best) best = v;
        if (best == bruteForceLis(values)) agree++;
    }
    std::cout << "sentence B against brute force on " << TRIALS << " random arrays: " << agree
              << " agree\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// The state is the whole job, and a state is a sentence before it is an array.
// Here are two sentences for the same problem. Both are true statements about
// longest increasing subsequences. Only one of them is a state.
//
//   A: dp[i] is the length of the longest increasing subsequence
//      among the first i values.
//   B: dp[i] is the length of the longest increasing subsequence
//      that ends exactly at value i.
//
// Sentence A is the one people write first, and this program is the search that
// shows it cannot be a state: two prefixes agreeing on everything A remembers,
// disagreeing on what comes next.
use std::collections::HashMap;

fn rand(seed: &mut i64, n: i64) -> i32 {
    *seed = (*seed * 1103515245 + 12345) % 2147483648;
    (*seed / 65536 % n) as i32
}

/// Sentence A, computed honestly: the best over the whole prefix, for each i.
fn prefix_lis(values: &[i32]) -> Vec<i32> {
    let mut best = vec![0i32; values.len() + 1];
    for i in 0..=values.len() {
        let mut ending = vec![1i32; i];
        let mut top = 0;
        for a in 0..i {
            for b in 0..a {
                if values[b] < values[a] && ending[b] + 1 > ending[a] {
                    ending[a] = ending[b] + 1;
                }
            }
            if ending[a] > top {
                top = ending[a];
            }
        }
        best[i] = top;
    }
    best
}

fn show(values: &[i32]) -> String {
    format!("[{}]", values.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(", "))
}

fn lis_ending_at(values: &[i32]) -> Vec<i32> {
    let mut ending = vec![1i32; values.len()];
    for a in 0..values.len() {
        for b in 0..a {
            if values[b] < values[a] && ending[b] + 1 > ending[a] {
                ending[a] = ending[b] + 1;
            }
        }
    }
    ending
}

fn brute_force_lis(values: &[i32]) -> i32 {
    let n = values.len();
    let mut top = 0;
    for mask in 0..(1usize << n) {
        let picked: Vec<i32> = (0..n).filter(|i| mask >> i & 1 == 1).map(|i| values[i]).collect();
        let rising = picked.windows(2).all(|w| w[0] < w[1]);
        if rising && picked.len() as i32 > top {
            top = picked.len() as i32;
        }
    }
    top
}

struct Sighting {
    values: Vec<i32>,
    index: usize,
    best: Vec<i32>,
}

fn main() {
    let mut seed = 1i64;

    // If A were a state there would be a rule taking dp[i-1] and the next value
    // to dp[i]. Hunt for two situations where that rule would have to give two
    // answers.
    let mut seen: HashMap<i32, Sighting> = HashMap::new();
    let mut witness: Option<(Vec<i32>, usize, Vec<i32>, Vec<i32>, usize, Vec<i32>)> = None;
    let mut trials = 0;
    while witness.is_none() && trials < 200000 {
        trials += 1;
        let n = 2 + rand(&mut seed, 7) as usize;
        let values: Vec<i32> = (0..n).map(|_| 1 + rand(&mut seed, 20)).collect();
        let best = prefix_lis(&values);
        for i in 1..=n {
            let key = best[i - 1] * 100 + values[i - 1]; // what sentence A would remember
            if let Some(other) = seen.get(&key) {
                if other.best[other.index] != best[i] {
                    witness = Some((
                        other.values.clone(), other.index, other.best.clone(),
                        values.clone(), i, best.clone(),
                    ));
                    break;
                }
            } else {
                seen.insert(key, Sighting { values: values.clone(), index: i, best: best.clone() });
            }
        }
    }

    let (left, li, lbest, right, ri, rbest) = witness.unwrap();
    println!("sentence A: dp[i] is the best subsequence among the first i values");
    println!();
    println!("  {:<26} first {} values -> {}", show(&left), li, lbest[li]);
    println!("  {:<26} first {} values -> {}", show(&right), ri, rbest[ri]);
    println!();
    println!("  both arrive with dp = {} and read the value {},", lbest[li - 1], left[li - 1]);
    println!("  and A has to answer both {} and {}. It is not a state.", lbest[li], rbest[ri]);
    println!("  ({} random arrays searched)", trials);
    println!();

    // Sentence B, which pins down the one thing A forgot: what the subsequence
    // ends on. That is enough to extend it, so the recurrence closes.
    let demo = vec![3, 10, 2, 1, 20, 4, 6, 21, 5, 11, 7, 15];
    let ending = lis_ending_at(&demo);
    println!("sentence B: dp[i] is the best subsequence ending exactly at index i");
    println!();
    let mut idx = String::from("  index  ");
    let mut val = String::from("  value  ");
    let mut dp = String::from("  dp     ");
    let mut top = 0;
    for i in 0..demo.len() {
        idx.push_str(&format!("{:>4}", i));
        val.push_str(&format!("{:>4}", demo[i]));
        dp.push_str(&format!("{:>4}", ending[i]));
        if ending[i] > top {
            top = ending[i];
        }
    }
    println!("{}", idx);
    println!("{}", val);
    println!("{}", dp);
    println!();
    println!("  answer is the largest of those: {}", top);
    println!("  every one of the {} subsequences agrees: {}", 1usize << demo.len(), brute_force_lis(&demo));
    println!();

    let mut agree = 0;
    const TRIALS: i32 = 3000;
    for _ in 0..TRIALS {
        let n = 1 + rand(&mut seed, 12) as usize;
        let values: Vec<i32> = (0..n).map(|_| 1 + rand(&mut seed, 20)).collect();
        let best = *lis_ending_at(&values).iter().max().unwrap();
        if best == brute_force_lis(&values) {
            agree += 1;
        }
    }
    println!("sentence B against brute force on {} random arrays: {} agree", TRIALS, agree);
}
`,
            },
            {
              lang: "go",
              code: `// The state is the whole job, and a state is a sentence before it is an array.
// Here are two sentences for the same problem. Both are true statements about
// longest increasing subsequences. Only one of them is a state.
//
//	A: dp[i] is the length of the longest increasing subsequence
//	   among the first i values.
//	B: dp[i] is the length of the longest increasing subsequence
//	   that ends exactly at value i.
//
// Sentence A is the one people write first, and this program is the search that
// shows it cannot be a state: two prefixes agreeing on everything A remembers,
// disagreeing on what comes next.
package main

import (
	"fmt"
	"strings"
)

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

// Sentence A, computed honestly: the best over the whole prefix, for each i.
func prefixLis(values []int) []int {
	best := make([]int, len(values)+1)
	for i := 0; i <= len(values); i++ {
		ending := make([]int, i)
		top := 0
		for a := 0; a < i; a++ {
			ending[a] = 1
			for b := 0; b < a; b++ {
				if values[b] < values[a] && ending[b]+1 > ending[a] {
					ending[a] = ending[b] + 1
				}
			}
			if ending[a] > top {
				top = ending[a]
			}
		}
		best[i] = top
	}
	return best
}

func show(values []int) string {
	parts := make([]string, len(values))
	for i, v := range values {
		parts[i] = fmt.Sprintf("%d", v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func lisEndingAt(values []int) []int {
	ending := make([]int, len(values))
	for a := range values {
		ending[a] = 1
		for b := 0; b < a; b++ {
			if values[b] < values[a] && ending[b]+1 > ending[a] {
				ending[a] = ending[b] + 1
			}
		}
	}
	return ending
}

func bruteForceLis(values []int) int {
	n := len(values)
	top := 0
	for mask := 0; mask < 1<<n; mask++ {
		var picked []int
		for i := 0; i < n; i++ {
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
		if rising && len(picked) > top {
			top = len(picked)
		}
	}
	return top
}

type sighting struct {
	values []int
	index  int
	best   []int
}

func main() {
	// If A were a state there would be a rule taking dp[i-1] and the next value
	// to dp[i]. Hunt for two situations where that rule would have to give two
	// answers.
	seen := map[int]sighting{}
	var left, right, lbest, rbest []int
	li, ri, trials := 0, 0, 0
	for left == nil && trials < 200000 {
		trials++
		n := 2 + rand(7)
		values := make([]int, n)
		for i := range values {
			values[i] = 1 + rand(20)
		}
		best := prefixLis(values)
		for i := 1; i <= n; i++ {
			key := best[i-1]*100 + values[i-1] // what sentence A would remember
			if other, ok := seen[key]; ok {
				if other.best[other.index] != best[i] {
					left, li, lbest = other.values, other.index, other.best
					right, ri, rbest = values, i, best
					break
				}
			} else {
				seen[key] = sighting{values, i, best}
			}
		}
	}

	fmt.Println("sentence A: dp[i] is the best subsequence among the first i values")
	fmt.Println()
	fmt.Printf("  %-26s first %d values -> %d\\n", show(left), li, lbest[li])
	fmt.Printf("  %-26s first %d values -> %d\\n", show(right), ri, rbest[ri])
	fmt.Println()
	fmt.Printf("  both arrive with dp = %d and read the value %d,\\n", lbest[li-1], left[li-1])
	fmt.Printf("  and A has to answer both %d and %d. It is not a state.\\n", lbest[li], rbest[ri])
	fmt.Printf("  (%d random arrays searched)\\n", trials)
	fmt.Println()

	// Sentence B, which pins down the one thing A forgot: what the subsequence
	// ends on. That is enough to extend it, so the recurrence closes.
	demo := []int{3, 10, 2, 1, 20, 4, 6, 21, 5, 11, 7, 15}
	ending := lisEndingAt(demo)
	fmt.Println("sentence B: dp[i] is the best subsequence ending exactly at index i")
	fmt.Println()
	idx, val, dp := "  index  ", "  value  ", "  dp     "
	top := 0
	for i, v := range demo {
		idx += fmt.Sprintf("%4d", i)
		val += fmt.Sprintf("%4d", v)
		dp += fmt.Sprintf("%4d", ending[i])
		if ending[i] > top {
			top = ending[i]
		}
	}
	fmt.Println(idx)
	fmt.Println(val)
	fmt.Println(dp)
	fmt.Println()
	fmt.Printf("  answer is the largest of those: %d\\n", top)
	fmt.Printf("  every one of the %d subsequences agrees: %d\\n", 1<<len(demo), bruteForceLis(demo))
	fmt.Println()

	agree := 0
	const TRIALS = 3000
	for t := 0; t < TRIALS; t++ {
		n := 1 + rand(12)
		values := make([]int, n)
		for i := range values {
			values[i] = 1 + rand(20)
		}
		e := lisEndingAt(values)
		best := 0
		for _, v := range e {
			if v > best {
				best = v
			}
		}
		if best == bruteForceLis(values) {
			agree++
		}
	}
	fmt.Printf("sentence B against brute force on %d random arrays: %d agree\\n", TRIALS, agree)
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "dp-lcs-grid",
        kind: "dp",
        algorithm: "lcs",
        title: "Every cell a state, every state a sentence",
        lockAlgorithm: true,
      },
    },
    {
      id: "one-dimension-too-many",
      heading: "Every dimension has to be doing work",
      body: [
        "The second question to ask about a state is whether every part of it is doing work. Below are two formulations of unbounded coin change. Both are correct \u2014 the program checks that they agree on every amount from 0 to 200 \u2014 and one of them has an entire dimension that constrains nothing.",
        "The `(index, amount)` version is what you get by writing the recursion in the obvious way: walk the denominations, and at each one decide whether to use it. The index is in the state because it is an argument. But ask what it actually restricts. Any coin may be used any number of times, in any order, so \"which denominations are still available\" never rules anything out \u2014 every amount has the same set of options no matter how you got there.",
        "Forty-eight states against two hundred and thirty-nine, for the same answer. The table at the bottom is the sharper version: the `(amount)` state stays at 121 states as the coin list grows from four denominations to eight, while `(index, amount)` climbs from 604 to 1,088. The wasted dimension does not cost a constant, it costs a factor of the number of denominations.",
        "It is worth being clear about when the index *is* load-bearing, because the same-looking recursion needs it for 0/1 knapsack. There, each item may be used once, so \"which items remain\" is precisely what stops you taking the same thing twice \u2014 delete it and the states that should stay apart merge, which is lesson 2's broken key. The test is not \"does the recursion have this argument\" but **\"if I deleted this component, which two situations would collapse into one that genuinely deserve different answers?\"** If you cannot name such a pair, the component is not part of the state.",
      ],
      examples: [
        {
          id: "wasted-dimension",
          title: "The same coin change with and without the index",
          lang: "python",
          code: `# Two states for one problem, both of them correct. The difference is a whole
# dimension, and it comes from noticing that one of the arguments never actually
# constrains anything.

COINS = [1, 4, 6, 9]
AMOUNT = 47

calls = [0, 0]


def show(values):
    return "[" + ", ".join(str(v) for v in values) + "]"


def by_index(i, amount, memo):
    """dp[i][amount]: the fewest coins for \`amount\` using denominations i onwards."""
    calls[0] += 1
    key = i * 10000 + amount
    if key in memo:
        return memo[key]
    if amount == 0:
        answer = 0
    elif i == len(COINS):
        answer = -1
    else:
        answer = by_index(i + 1, amount, memo)
        if COINS[i] <= amount:
            # Staying on i is what makes the coin reusable.
            sub = by_index(i, amount - COINS[i], memo)
            if sub >= 0 and (answer < 0 or sub + 1 < answer):
                answer = sub + 1
    memo[key] = answer
    return answer


def by_amount(amount, memo):
    """dp[amount]: the fewest coins for \`amount\`, using any denomination."""
    calls[1] += 1
    if amount in memo:
        return memo[amount]
    if amount == 0:
        answer = 0
    else:
        answer = -1
        for coin in COINS:
            if coin <= amount:
                sub = by_amount(amount - coin, memo)
                if sub >= 0 and (answer < 0 or sub + 1 < answer):
                    answer = sub + 1
    memo[amount] = answer
    return answer


memo_a = {}
memo_b = {}
first = by_index(0, AMOUNT, memo_a)
second = by_amount(AMOUNT, memo_b)

print(f"coins {show(COINS)}, making {AMOUNT}")
print()
print(f"{'state':<34}{'answer':>8}{'calls':>9}{'states':>9}")
print(f"{'(index, amount)':<34}{first:>8}{calls[0]:>9}{len(memo_a):>9}")
print(f"{'(amount)':<34}{second:>8}{calls[1]:>9}{len(memo_b):>9}")
print()

# The two agree everywhere, so this is a choice about cost and not about
# correctness -- which is exactly what makes it easy to get wrong quietly.
same = 0
for target in range(0, 201):
    if by_index(0, target, {}) == by_amount(target, {}):
        same += 1
print(f"the two states agree on every amount from 0 to 200: {same} of 201")
print()

# The extra dimension is not free, and it grows with the coin list.
print(f"{'coins':<22}{'amount':>8}{'(i, amount)':>14}{'(amount)':>11}")
for extra in range(0, 5):
    COINS = [1, 4, 6, 9] + [12 + 3 * k for k in range(extra)]
    memo_a = {}
    memo_b = {}
    by_index(0, 120, memo_a)
    by_amount(120, memo_b)
    print(f"{str(len(COINS)) + ' denominations':<22}{120:>8}{len(memo_a):>14}{len(memo_b):>11}")
`,
          output: `coins [1, 4, 6, 9], making 47

state                               answer    calls   states
(index, amount)                          7      361      239
(amount)                                 7      173       48

the two states agree on every amount from 0 to 200: 201 of 201

coins                   amount   (i, amount)   (amount)
4 denominations            120           604        121
5 denominations            120           725        121
6 denominations            120           846        121
7 denominations            120           967        121
8 denominations            120          1088        121`,
          explanation:
            "Both formulations are memoised the same way and both are correct, which the middle check establishes across every amount from 0 to 200. The table at the end grows the coin list without changing the amount, so the two state counts can be watched diverging: one is flat, the other is proportional to the number of denominations.",
          alternates: [
            {
              lang: "javascript",
              code: `// Two states for one problem, both of them correct. The difference is a whole
// dimension, and it comes from noticing that one of the arguments never actually
// constrains anything.

let coins = [1, 4, 6, 9];
const AMOUNT = 47;

const calls = [0, 0];

const show = (values) => \`[\${values.join(", ")}]\`;
const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);

/** dp[i][amount]: the fewest coins for \`amount\` using denominations i onwards. */
function byIndex(i, amount, memo) {
  calls[0]++;
  const key = i * 10000 + amount;
  const seen = memo.get(key);
  if (seen !== undefined) return seen;
  let answer;
  if (amount === 0) {
    answer = 0;
  } else if (i === coins.length) {
    answer = -1;
  } else {
    answer = byIndex(i + 1, amount, memo);
    if (coins[i] <= amount) {
      // Staying on i is what makes the coin reusable.
      const sub = byIndex(i, amount - coins[i], memo);
      if (sub >= 0 && (answer < 0 || sub + 1 < answer)) answer = sub + 1;
    }
  }
  memo.set(key, answer);
  return answer;
}

/** dp[amount]: the fewest coins for \`amount\`, using any denomination. */
function byAmount(amount, memo) {
  calls[1]++;
  const seen = memo.get(amount);
  if (seen !== undefined) return seen;
  let answer;
  if (amount === 0) {
    answer = 0;
  } else {
    answer = -1;
    for (const coin of coins) {
      if (coin <= amount) {
        const sub = byAmount(amount - coin, memo);
        if (sub >= 0 && (answer < 0 || sub + 1 < answer)) answer = sub + 1;
      }
    }
  }
  memo.set(amount, answer);
  return answer;
}

let memoA = new Map();
let memoB = new Map();
const first = byIndex(0, AMOUNT, memoA);
const second = byAmount(AMOUNT, memoB);

console.log(\`coins \${show(coins)}, making \${AMOUNT}\`);
console.log();
console.log(padEnd("state", 34) + pad("answer", 8) + pad("calls", 9) + pad("states", 9));
console.log(padEnd("(index, amount)", 34) + pad(first, 8) + pad(calls[0], 9) + pad(memoA.size, 9));
console.log(padEnd("(amount)", 34) + pad(second, 8) + pad(calls[1], 9) + pad(memoB.size, 9));
console.log();

// The two agree everywhere, so this is a choice about cost and not about
// correctness -- which is exactly what makes it easy to get wrong quietly.
let same = 0;
for (let target = 0; target <= 200; target++) {
  if (byIndex(0, target, new Map()) === byAmount(target, new Map())) same++;
}
console.log(\`the two states agree on every amount from 0 to 200: \${same} of 201\`);
console.log();

// The extra dimension is not free, and it grows with the coin list.
console.log(padEnd("coins", 22) + pad("amount", 8) + pad("(i, amount)", 14) + pad("(amount)", 11));
for (let extra = 0; extra < 5; extra++) {
  coins = [1, 4, 6, 9];
  for (let k = 0; k < extra; k++) coins.push(12 + 3 * k);
  memoA = new Map();
  memoB = new Map();
  byIndex(0, 120, memoA);
  byAmount(120, memoB);
  console.log(
    padEnd(\`\${coins.length} denominations\`, 22) + pad(120, 8) + pad(memoA.size, 14) + pad(memoB.size, 11)
  );
}
`,
            },
            {
              lang: "typescript",
              code: `// Two states for one problem, both of them correct. The difference is a whole
// dimension, and it comes from noticing that one of the arguments never actually
// constrains anything.

let coins = [1, 4, 6, 9];
const AMOUNT = 47;

const calls = [0, 0];

const show = (values: number[]): string => \`[\${values.join(", ")}]\`;
const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

/** dp[i][amount]: the fewest coins for \`amount\` using denominations i onwards. */
function byIndex(i: number, amount: number, memo: Map<number, number>): number {
  calls[0]++;
  const key = i * 10000 + amount;
  const seen = memo.get(key);
  if (seen !== undefined) return seen;
  let answer: number;
  if (amount === 0) {
    answer = 0;
  } else if (i === coins.length) {
    answer = -1;
  } else {
    answer = byIndex(i + 1, amount, memo);
    if (coins[i] <= amount) {
      // Staying on i is what makes the coin reusable.
      const sub = byIndex(i, amount - coins[i], memo);
      if (sub >= 0 && (answer < 0 || sub + 1 < answer)) answer = sub + 1;
    }
  }
  memo.set(key, answer);
  return answer;
}

/** dp[amount]: the fewest coins for \`amount\`, using any denomination. */
function byAmount(amount: number, memo: Map<number, number>): number {
  calls[1]++;
  const seen = memo.get(amount);
  if (seen !== undefined) return seen;
  let answer: number;
  if (amount === 0) {
    answer = 0;
  } else {
    answer = -1;
    for (const coin of coins) {
      if (coin <= amount) {
        const sub = byAmount(amount - coin, memo);
        if (sub >= 0 && (answer < 0 || sub + 1 < answer)) answer = sub + 1;
      }
    }
  }
  memo.set(amount, answer);
  return answer;
}

let memoA = new Map();
let memoB = new Map();
const first = byIndex(0, AMOUNT, memoA);
const second = byAmount(AMOUNT, memoB);

console.log(\`coins \${show(coins)}, making \${AMOUNT}\`);
console.log();
console.log(padEnd("state", 34) + pad("answer", 8) + pad("calls", 9) + pad("states", 9));
console.log(padEnd("(index, amount)", 34) + pad(first, 8) + pad(calls[0], 9) + pad(memoA.size, 9));
console.log(padEnd("(amount)", 34) + pad(second, 8) + pad(calls[1], 9) + pad(memoB.size, 9));
console.log();

// The two agree everywhere, so this is a choice about cost and not about
// correctness -- which is exactly what makes it easy to get wrong quietly.
let same = 0;
for (let target = 0; target <= 200; target++) {
  if (byIndex(0, target, new Map()) === byAmount(target, new Map())) same++;
}
console.log(\`the two states agree on every amount from 0 to 200: \${same} of 201\`);
console.log();

// The extra dimension is not free, and it grows with the coin list.
console.log(padEnd("coins", 22) + pad("amount", 8) + pad("(i, amount)", 14) + pad("(amount)", 11));
for (let extra = 0; extra < 5; extra++) {
  coins = [1, 4, 6, 9];
  for (let k = 0; k < extra; k++) coins.push(12 + 3 * k);
  memoA = new Map();
  memoB = new Map();
  byIndex(0, 120, memoA);
  byAmount(120, memoB);
  console.log(
    padEnd(\`\${coins.length} denominations\`, 22) + pad(120, 8) + pad(memoA.size, 14) + pad(memoB.size, 11)
  );
}
`,
            },
            {
              lang: "java",
              code: `import java.util.HashMap;
import java.util.Map;

// Two states for one problem, both of them correct. The difference is a whole
// dimension, and it comes from noticing that one of the arguments never actually
// constrains anything.
public class Main {
    static int[] coins = { 1, 4, 6, 9 };
    static final int AMOUNT = 47;

    static long[] calls = new long[2];

    static String show(int[] values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(values[i]);
        }
        return sb.append("]").toString();
    }

    /** dp[i][amount]: the fewest coins for \`amount\` using denominations i onwards. */
    static int byIndex(int i, int amount, Map<Integer, Integer> memo) {
        calls[0]++;
        int key = i * 10000 + amount;
        if (memo.containsKey(key)) return memo.get(key);
        int answer;
        if (amount == 0) {
            answer = 0;
        } else if (i == coins.length) {
            answer = -1;
        } else {
            answer = byIndex(i + 1, amount, memo);
            if (coins[i] <= amount) {
                // Staying on i is what makes the coin reusable.
                int sub = byIndex(i, amount - coins[i], memo);
                if (sub >= 0 && (answer < 0 || sub + 1 < answer)) answer = sub + 1;
            }
        }
        memo.put(key, answer);
        return answer;
    }

    /** dp[amount]: the fewest coins for \`amount\`, using any denomination. */
    static int byAmount(int amount, Map<Integer, Integer> memo) {
        calls[1]++;
        if (memo.containsKey(amount)) return memo.get(amount);
        int answer;
        if (amount == 0) {
            answer = 0;
        } else {
            answer = -1;
            for (int coin : coins) {
                if (coin <= amount) {
                    int sub = byAmount(amount - coin, memo);
                    if (sub >= 0 && (answer < 0 || sub + 1 < answer)) answer = sub + 1;
                }
            }
        }
        memo.put(amount, answer);
        return answer;
    }

    public static void main(String[] args) {
        Map<Integer, Integer> memoA = new HashMap<>();
        Map<Integer, Integer> memoB = new HashMap<>();
        int first = byIndex(0, AMOUNT, memoA);
        int second = byAmount(AMOUNT, memoB);

        System.out.printf("coins %s, making %d%n", show(coins), AMOUNT);
        System.out.println();
        System.out.printf("%-34s%8s%9s%9s%n", "state", "answer", "calls", "states");
        System.out.printf("%-34s%8d%9d%9d%n", "(index, amount)", first, calls[0], memoA.size());
        System.out.printf("%-34s%8d%9d%9d%n", "(amount)", second, calls[1], memoB.size());
        System.out.println();

        // The two agree everywhere, so this is a choice about cost and not about
        // correctness -- which is exactly what makes it easy to get wrong quietly.
        int same = 0;
        for (int target = 0; target <= 200; target++) {
            if (byIndex(0, target, new HashMap<>()) == byAmount(target, new HashMap<>())) same++;
        }
        System.out.printf("the two states agree on every amount from 0 to 200: %d of 201%n", same);
        System.out.println();

        // The extra dimension is not free, and it grows with the coin list.
        System.out.printf("%-22s%8s%14s%11s%n", "coins", "amount", "(i, amount)", "(amount)");
        for (int extra = 0; extra < 5; extra++) {
            coins = new int[4 + extra];
            int[] base = { 1, 4, 6, 9 };
            System.arraycopy(base, 0, coins, 0, 4);
            for (int k = 0; k < extra; k++) coins[4 + k] = 12 + 3 * k;
            memoA = new HashMap<>();
            memoB = new HashMap<>();
            byIndex(0, 120, memoA);
            byAmount(120, memoB);
            System.out.printf("%-22s%8d%14d%11d%n", coins.length + " denominations", 120, memoA.size(), memoB.size());
        }
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Two states for one problem, both of them correct. The difference is a whole
// dimension, and it comes from noticing that one of the arguments never actually
// constrains anything.
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <vector>

static std::vector<int> coins = {1, 4, 6, 9};
static const int AMOUNT = 47;

static std::array<std::int64_t, 2> calls{};

std::string show(const std::vector<int> &values) {
    std::string out = "[";
    for (size_t i = 0; i < values.size(); i++) {
        if (i > 0) out += ", ";
        out += std::to_string(values[i]);
    }
    return out + "]";
}

// dp[i][amount]: the fewest coins for \`amount\` using denominations i onwards.
int byIndex(int i, int amount, std::map<int, int> &memo) {
    calls[0]++;
    int key = i * 10000 + amount;
    auto it = memo.find(key);
    if (it != memo.end()) return it->second;
    int answer;
    if (amount == 0) {
        answer = 0;
    } else if (i == static_cast<int>(coins.size())) {
        answer = -1;
    } else {
        answer = byIndex(i + 1, amount, memo);
        if (coins[i] <= amount) {
            // Staying on i is what makes the coin reusable.
            int sub = byIndex(i, amount - coins[i], memo);
            if (sub >= 0 && (answer < 0 || sub + 1 < answer)) answer = sub + 1;
        }
    }
    memo[key] = answer;
    return answer;
}

// dp[amount]: the fewest coins for \`amount\`, using any denomination.
int byAmount(int amount, std::map<int, int> &memo) {
    calls[1]++;
    auto it = memo.find(amount);
    if (it != memo.end()) return it->second;
    int answer;
    if (amount == 0) {
        answer = 0;
    } else {
        answer = -1;
        for (int coin : coins) {
            if (coin <= amount) {
                int sub = byAmount(amount - coin, memo);
                if (sub >= 0 && (answer < 0 || sub + 1 < answer)) answer = sub + 1;
            }
        }
    }
    memo[amount] = answer;
    return answer;
}

int main() {
    std::map<int, int> memoA, memoB;
    int first = byIndex(0, AMOUNT, memoA);
    int second = byAmount(AMOUNT, memoB);

    std::cout << "coins " << show(coins) << ", making " << AMOUNT << "\\n\\n";
    std::cout << std::left << std::setw(34) << "state" << std::right << std::setw(8) << "answer"
              << std::setw(9) << "calls" << std::setw(9) << "states" << "\\n";
    std::cout << std::left << std::setw(34) << "(index, amount)" << std::right << std::setw(8) << first
              << std::setw(9) << calls[0] << std::setw(9) << memoA.size() << "\\n";
    std::cout << std::left << std::setw(34) << "(amount)" << std::right << std::setw(8) << second
              << std::setw(9) << calls[1] << std::setw(9) << memoB.size() << "\\n\\n";

    // The two agree everywhere, so this is a choice about cost and not about
    // correctness -- which is exactly what makes it easy to get wrong quietly.
    int same = 0;
    for (int target = 0; target <= 200; target++) {
        std::map<int, int> a, b;
        if (byIndex(0, target, a) == byAmount(target, b)) same++;
    }
    std::cout << "the two states agree on every amount from 0 to 200: " << same << " of 201\\n\\n";

    // The extra dimension is not free, and it grows with the coin list.
    std::cout << std::left << std::setw(22) << "coins" << std::right << std::setw(8) << "amount"
              << std::setw(14) << "(i, amount)" << std::setw(11) << "(amount)" << "\\n";
    for (int extra = 0; extra < 5; extra++) {
        coins = {1, 4, 6, 9};
        for (int k = 0; k < extra; k++) coins.push_back(12 + 3 * k);
        memoA.clear();
        memoB.clear();
        byIndex(0, 120, memoA);
        byAmount(120, memoB);
        std::cout << std::left << std::setw(22) << (std::to_string(coins.size()) + " denominations")
                  << std::right << std::setw(8) << 120 << std::setw(14) << memoA.size()
                  << std::setw(11) << memoB.size() << "\\n";
    }
}
`,
            },
            {
              lang: "rust",
              code: `// Two states for one problem, both of them correct. The difference is a whole
// dimension, and it comes from noticing that one of the arguments never actually
// constrains anything.
use std::collections::HashMap;

const AMOUNT: i32 = 47;

fn show(values: &[i32]) -> String {
    format!("[{}]", values.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(", "))
}

/// dp[i][amount]: the fewest coins for \`amount\` using denominations i onwards.
fn by_index(coins: &[i32], i: usize, amount: i32, memo: &mut HashMap<i32, i32>, calls: &mut [i64; 2]) -> i32 {
    calls[0] += 1;
    let key = i as i32 * 10000 + amount;
    if let Some(&v) = memo.get(&key) {
        return v;
    }
    let answer = if amount == 0 {
        0
    } else if i == coins.len() {
        -1
    } else {
        let mut best = by_index(coins, i + 1, amount, memo, calls);
        if coins[i] <= amount {
            // Staying on i is what makes the coin reusable.
            let sub = by_index(coins, i, amount - coins[i], memo, calls);
            if sub >= 0 && (best < 0 || sub + 1 < best) {
                best = sub + 1;
            }
        }
        best
    };
    memo.insert(key, answer);
    answer
}

/// dp[amount]: the fewest coins for \`amount\`, using any denomination.
fn by_amount(coins: &[i32], amount: i32, memo: &mut HashMap<i32, i32>, calls: &mut [i64; 2]) -> i32 {
    calls[1] += 1;
    if let Some(&v) = memo.get(&amount) {
        return v;
    }
    let answer = if amount == 0 {
        0
    } else {
        let mut best = -1;
        for &coin in coins {
            if coin <= amount {
                let sub = by_amount(coins, amount - coin, memo, calls);
                if sub >= 0 && (best < 0 || sub + 1 < best) {
                    best = sub + 1;
                }
            }
        }
        best
    };
    memo.insert(amount, answer);
    answer
}

fn main() {
    let mut coins: Vec<i32> = vec![1, 4, 6, 9];
    let mut calls = [0i64; 2];
    let mut memo_a: HashMap<i32, i32> = HashMap::new();
    let mut memo_b: HashMap<i32, i32> = HashMap::new();
    let first = by_index(&coins, 0, AMOUNT, &mut memo_a, &mut calls);
    let second = by_amount(&coins, AMOUNT, &mut memo_b, &mut calls);

    println!("coins {}, making {}", show(&coins), AMOUNT);
    println!();
    println!("{:<34}{:>8}{:>9}{:>9}", "state", "answer", "calls", "states");
    println!("{:<34}{:>8}{:>9}{:>9}", "(index, amount)", first, calls[0], memo_a.len());
    println!("{:<34}{:>8}{:>9}{:>9}", "(amount)", second, calls[1], memo_b.len());
    println!();

    // The two agree everywhere, so this is a choice about cost and not about
    // correctness -- which is exactly what makes it easy to get wrong quietly.
    let mut same = 0;
    for target in 0..=200 {
        let mut a: HashMap<i32, i32> = HashMap::new();
        let mut b: HashMap<i32, i32> = HashMap::new();
        if by_index(&coins, 0, target, &mut a, &mut calls) == by_amount(&coins, target, &mut b, &mut calls) {
            same += 1;
        }
    }
    println!("the two states agree on every amount from 0 to 200: {} of 201", same);
    println!();

    // The extra dimension is not free, and it grows with the coin list.
    println!("{:<22}{:>8}{:>14}{:>11}", "coins", "amount", "(i, amount)", "(amount)");
    for extra in 0..5 {
        coins = vec![1, 4, 6, 9];
        for k in 0..extra {
            coins.push(12 + 3 * k);
        }
        memo_a = HashMap::new();
        memo_b = HashMap::new();
        by_index(&coins, 0, 120, &mut memo_a, &mut calls);
        by_amount(&coins, 120, &mut memo_b, &mut calls);
        println!(
            "{:<22}{:>8}{:>14}{:>11}",
            format!("{} denominations", coins.len()), 120, memo_a.len(), memo_b.len()
        );
    }
}
`,
            },
            {
              lang: "go",
              code: `// Two states for one problem, both of them correct. The difference is a whole
// dimension, and it comes from noticing that one of the arguments never actually
// constrains anything.
package main

import (
	"fmt"
	"strings"
)

var coins = []int{1, 4, 6, 9}

const AMOUNT = 47

var calls [2]int64

func show(values []int) string {
	parts := make([]string, len(values))
	for i, v := range values {
		parts[i] = fmt.Sprintf("%d", v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

// dp[i][amount]: the fewest coins for \`amount\` using denominations i onwards.
func byIndex(i, amount int, memo map[int]int) int {
	calls[0]++
	key := i*10000 + amount
	if v, ok := memo[key]; ok {
		return v
	}
	var answer int
	if amount == 0 {
		answer = 0
	} else if i == len(coins) {
		answer = -1
	} else {
		answer = byIndex(i+1, amount, memo)
		if coins[i] <= amount {
			// Staying on i is what makes the coin reusable.
			sub := byIndex(i, amount-coins[i], memo)
			if sub >= 0 && (answer < 0 || sub+1 < answer) {
				answer = sub + 1
			}
		}
	}
	memo[key] = answer
	return answer
}

// dp[amount]: the fewest coins for \`amount\`, using any denomination.
func byAmount(amount int, memo map[int]int) int {
	calls[1]++
	if v, ok := memo[amount]; ok {
		return v
	}
	var answer int
	if amount == 0 {
		answer = 0
	} else {
		answer = -1
		for _, coin := range coins {
			if coin <= amount {
				sub := byAmount(amount-coin, memo)
				if sub >= 0 && (answer < 0 || sub+1 < answer) {
					answer = sub + 1
				}
			}
		}
	}
	memo[amount] = answer
	return answer
}

func main() {
	memoA := map[int]int{}
	memoB := map[int]int{}
	first := byIndex(0, AMOUNT, memoA)
	second := byAmount(AMOUNT, memoB)

	fmt.Printf("coins %s, making %d\\n", show(coins), AMOUNT)
	fmt.Println()
	fmt.Printf("%-34s%8s%9s%9s\\n", "state", "answer", "calls", "states")
	fmt.Printf("%-34s%8d%9d%9d\\n", "(index, amount)", first, calls[0], len(memoA))
	fmt.Printf("%-34s%8d%9d%9d\\n", "(amount)", second, calls[1], len(memoB))
	fmt.Println()

	// The two agree everywhere, so this is a choice about cost and not about
	// correctness -- which is exactly what makes it easy to get wrong quietly.
	same := 0
	for target := 0; target <= 200; target++ {
		if byIndex(0, target, map[int]int{}) == byAmount(target, map[int]int{}) {
			same++
		}
	}
	fmt.Printf("the two states agree on every amount from 0 to 200: %d of 201\\n", same)
	fmt.Println()

	// The extra dimension is not free, and it grows with the coin list.
	fmt.Printf("%-22s%8s%14s%11s\\n", "coins", "amount", "(i, amount)", "(amount)")
	for extra := 0; extra < 5; extra++ {
		coins = []int{1, 4, 6, 9}
		for k := 0; k < extra; k++ {
			coins = append(coins, 12+3*k)
		}
		memoA = map[int]int{}
		memoB = map[int]int{}
		byIndex(0, 120, memoA)
		byAmount(120, memoB)
		fmt.Printf("%-22s%8d%14d%11d\\n", fmt.Sprintf("%d denominations", len(coins)), 120, len(memoA), len(memoB))
	}
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "A state whose size depends on a value rather than a length is pseudo-polynomial",
          body: "The `(amount)` state has one cell per unit of money, so making 120 costs 121 states and making 10^9 costs a billion. That is linear in the amount and exponential in the number of digits used to write it, which is why coin change and subset sum are described as pseudo-polynomial and why they stop being practical long before the input looks large. Multiplying out the ranges is what makes this visible before you implement anything.",
        },
        {
          title: "\"Up to i\" and \"from i onwards\" are different states",
          body: "Both are perfectly good, and mixing them is a real and confusing bug: the recurrence reads one meaning while the base case supplies the other, and the table comes out plausible and wrong. Pick a direction, write it into the sentence, and keep the base cases in the same language.",
        },
      ],
    },
    {
      id: "one-dimension-short",
      heading: "When the state has to carry something no argument records",
      body: [
        "The third failure is the only one that needs an idea rather than a correction, and it is the one worth practising. Sometimes the state has to carry a fact that no argument records \u2014 something about the world rather than about the input \u2014 and until you invent it, the recurrence cannot express the rule it is meant to obey.",
        "The problem below is the usual buy-and-sell-a-share one with a single extra sentence: after you sell, you must sit out the next day. The two-state formulation `(day, holding)` is not sloppy and is not a broken key. It is a complete, correct dynamic program \u2014 for the problem without that sentence. It gets the wrong answer because it has nowhere to write down that yesterday ended in a sale, so it cannot refuse to buy today.",
        "Twenty-five against a true fifteen on the printed run, and across four thousand random price series the two-state model is right 1,996 times, too high 2,004 times, and too low never. That last number is not luck: a model that cannot see a restriction can only ever permit more than the rules allow, so its answer is an upper bound on the truth by construction.",
        "The repair is one extra bit. `cooling` is not derivable from `day`, it is not derivable from `holding`, and no rearrangement of the two produces it \u2014 it has to be added. And that is the signal to watch for while writing the transition: **the moment you catch yourself needing a fact the arguments do not provide, you have found a dimension.** \"Was yesterday a sale?\" is a dimension. \"How many transactions have I used?\" is a dimension. \"What was the last thing I took?\" is a dimension, and it is the one sentence B was quietly adding back in the first section.",
        "The invented dimension is nearly always small and categorical \u2014 a flag, a remainder, a small count \u2014 and the cost here is thirty states instead of twenty-one. Multiplying the table by a small constant to make it able to state the rule is almost always the right trade, and it is a very different thing from section 2's wasted dimension, which multiplied the table and bought nothing.",
      ],
      examples: [
        {
          id: "missing-dimension",
          title: "A model that cannot express its own rule, and the bit that fixes it",
          lang: "python",
          code: `# The third way to get a state wrong, and the only one that needs an idea rather
# than a correction. Sometimes the state has to carry something that is not an
# argument yet -- a fact about the world that no index records -- and until you
# invent it the recurrence cannot express the rule it is supposed to obey.
#
# The problem: buy and sell a share as often as you like, one share at a time,
# but after a sale you must sit out the next day.

PRICES = [4, 9, 2, 7, 3, 8, 1, 6, 5, 10]

calls = [0, 0]


def show(values):
    return "[" + ", ".join(str(v) for v in values) + "]"


def two_state(day, holding, memo):
    """Best profit from \`day\` on, remembering only whether a share is held.

    A complete and correct dynamic program -- for the problem with no cooldown.
    Nothing here is able to say "and you may not buy today", because the state
    has nowhere to record that yesterday ended in a sale.
    """
    calls[0] += 1
    key = day * 2 + holding
    if key in memo:
        return memo[key]
    if day == len(PRICES):
        answer = 0
    else:
        answer = two_state(day + 1, holding, memo)          # sit still
        if holding:
            sell = PRICES[day] + two_state(day + 1, 0, memo)
            if sell > answer:
                answer = sell
        else:
            buy = -PRICES[day] + two_state(day + 1, 1, memo)
            if buy > answer:
                answer = buy
    memo[key] = answer
    return answer


def three_state(day, holding, cooling, memo):
    """The same, plus one bit: whether today is the day you must sit out."""
    calls[1] += 1
    key = (day * 2 + holding) * 2 + cooling
    if key in memo:
        return memo[key]
    if day == len(PRICES):
        answer = 0
    else:
        answer = three_state(day + 1, holding, 0, memo)     # sit still
        if holding:
            # Selling today is what puts tomorrow into cooldown.
            sell = PRICES[day] + three_state(day + 1, 0, 1, memo)
            if sell > answer:
                answer = sell
        elif not cooling:
            buy = -PRICES[day] + three_state(day + 1, 1, 0, memo)
            if buy > answer:
                answer = buy
    memo[key] = answer
    return answer


def brute_force(day, holding, cooling):
    """Every legal sequence of decisions, with no state and no memo at all."""
    if day == len(PRICES):
        return 0
    best = brute_force(day + 1, holding, 0)
    if holding:
        sell = PRICES[day] + brute_force(day + 1, 0, 1)
        if sell > best:
            best = sell
    elif not cooling:
        buy = -PRICES[day] + brute_force(day + 1, 1, 0)
        if buy > best:
            best = buy
    return best


memo_a = {}
memo_b = {}
two = two_state(0, 0, memo_a)
three = three_state(0, 0, 0, memo_b)
truth = brute_force(0, 0, 0)

print(f"prices {show(PRICES)}")
print(f"rule: after selling, you sit out the next day")
print()
print(f"{'state':<38}{'profit':>8}{'calls':>8}{'states':>8}")
print(f"{'(day, holding)':<38}{two:>8}{calls[0]:>8}{len(memo_a):>8}")
print(f"{'(day, holding, cooling)':<38}{three:>8}{calls[1]:>8}{len(memo_b):>8}")
print(f"{'every legal sequence, enumerated':<38}{truth:>8}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 4000
two_right = 0
three_right = 0
over = 0
under = 0
for _ in range(TRIALS):
    PRICES = [1 + rand(20) for _ in range(2 + rand(11))]
    truth = brute_force(0, 0, 0)
    answer = two_state(0, 0, {})
    if answer == truth:
        two_right += 1
    elif answer > truth:
        over += 1
    else:
        under += 1
    if three_state(0, 0, 0, {}) == truth:
        three_right += 1

print(f"scored against every legal sequence on {TRIALS} random price runs:")
print(f"  (day, holding)             {two_right:>6} right, {over} too high, {under} too low")
print(f"  (day, holding, cooling)    {three_right:>6} right")
`,
          output: `prices [4, 9, 2, 7, 3, 8, 1, 6, 5, 10]
rule: after selling, you sit out the next day

state                                   profit   calls  states
(day, holding)                              25      39      21
(day, holding, cooling)                     15      47      30
every legal sequence, enumerated            15

scored against every legal sequence on 4000 random price runs:
  (day, holding)               1996 right, 2004 too high, 0 too low
  (day, holding, cooling)      4000 right`,
          explanation:
            "The brute force enumerates every legal sequence of decisions with no state and no memo, so it is the rule itself rather than another model of it. The two-state version is a correct implementation -- the flaw is in what it is able to represent, not in how it is written.",
          alternates: [
            {
              lang: "javascript",
              code: `// The third way to get a state wrong, and the only one that needs an idea rather
// than a correction. Sometimes the state has to carry something that is not an
// argument yet -- a fact about the world that no index records -- and until you
// invent it the recurrence cannot express the rule it is supposed to obey.
//
// The problem: buy and sell a share as often as you like, one share at a time,
// but after a sale you must sit out the next day.

let prices = [4, 9, 2, 7, 3, 8, 1, 6, 5, 10];

const calls = [0, 0];

const show = (values) => \`[\${values.join(", ")}]\`;
const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);

/**
 * Best profit from \`day\` on, remembering only whether a share is held.
 *
 * A complete and correct dynamic program -- for the problem with no cooldown.
 * Nothing here is able to say "and you may not buy today", because the state has
 * nowhere to record that yesterday ended in a sale.
 */
function twoState(day, holding, memo) {
  calls[0]++;
  const key = day * 2 + holding;
  const seen = memo.get(key);
  if (seen !== undefined) return seen;
  let answer;
  if (day === prices.length) {
    answer = 0;
  } else {
    answer = twoState(day + 1, holding, memo);              // sit still
    if (holding === 1) {
      const sell = prices[day] + twoState(day + 1, 0, memo);
      if (sell > answer) answer = sell;
    } else {
      const buy = -prices[day] + twoState(day + 1, 1, memo);
      if (buy > answer) answer = buy;
    }
  }
  memo.set(key, answer);
  return answer;
}

/** The same, plus one bit: whether today is the day you must sit out. */
function threeState(day, holding, cooling, memo) {
  calls[1]++;
  const key = (day * 2 + holding) * 2 + cooling;
  const seen = memo.get(key);
  if (seen !== undefined) return seen;
  let answer;
  if (day === prices.length) {
    answer = 0;
  } else {
    answer = threeState(day + 1, holding, 0, memo);         // sit still
    if (holding === 1) {
      // Selling today is what puts tomorrow into cooldown.
      const sell = prices[day] + threeState(day + 1, 0, 1, memo);
      if (sell > answer) answer = sell;
    } else if (cooling === 0) {
      const buy = -prices[day] + threeState(day + 1, 1, 0, memo);
      if (buy > answer) answer = buy;
    }
  }
  memo.set(key, answer);
  return answer;
}

/** Every legal sequence of decisions, with no state and no memo at all. */
function bruteForce(day, holding, cooling) {
  if (day === prices.length) return 0;
  let best = bruteForce(day + 1, holding, 0);
  if (holding === 1) {
    const sell = prices[day] + bruteForce(day + 1, 0, 1);
    if (sell > best) best = sell;
  } else if (cooling === 0) {
    const buy = -prices[day] + bruteForce(day + 1, 1, 0);
    if (buy > best) best = buy;
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

const memoA = new Map();
const memoB = new Map();
const two = twoState(0, 0, memoA);
const three = threeState(0, 0, 0, memoB);
let truth = bruteForce(0, 0, 0);

console.log(\`prices \${show(prices)}\`);
console.log("rule: after selling, you sit out the next day");
console.log();
console.log(padEnd("state", 38) + pad("profit", 8) + pad("calls", 8) + pad("states", 8));
console.log(padEnd("(day, holding)", 38) + pad(two, 8) + pad(calls[0], 8) + pad(memoA.size, 8));
console.log(padEnd("(day, holding, cooling)", 38) + pad(three, 8) + pad(calls[1], 8) + pad(memoB.size, 8));
console.log(padEnd("every legal sequence, enumerated", 38) + pad(truth, 8));
console.log();

const TRIALS = 4000;
let twoRight = 0;
let threeRight = 0;
let over = 0;
let under = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(11);
  prices = Array.from({ length: n }, () => 1 + rand(20));
  truth = bruteForce(0, 0, 0);
  const answer = twoState(0, 0, new Map());
  if (answer === truth) {
    twoRight++;
  } else if (answer > truth) {
    over++;
  } else {
    under++;
  }
  if (threeState(0, 0, 0, new Map()) === truth) threeRight++;
}

console.log(\`scored against every legal sequence on \${TRIALS} random price runs:\`);
console.log(\`  (day, holding)             \${pad(twoRight, 6)} right, \${over} too high, \${under} too low\`);
console.log(\`  (day, holding, cooling)    \${pad(threeRight, 6)} right\`);
`,
            },
            {
              lang: "typescript",
              code: `// The third way to get a state wrong, and the only one that needs an idea rather
// than a correction. Sometimes the state has to carry something that is not an
// argument yet -- a fact about the world that no index records -- and until you
// invent it the recurrence cannot express the rule it is supposed to obey.
//
// The problem: buy and sell a share as often as you like, one share at a time,
// but after a sale you must sit out the next day.

let prices = [4, 9, 2, 7, 3, 8, 1, 6, 5, 10];

const calls = [0, 0];

const show = (values: number[]): string => \`[\${values.join(", ")}]\`;
const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

/**
 * Best profit from \`day\` on, remembering only whether a share is held.
 *
 * A complete and correct dynamic program -- for the problem with no cooldown.
 * Nothing here is able to say "and you may not buy today", because the state has
 * nowhere to record that yesterday ended in a sale.
 */
function twoState(day: number, holding: number, memo: Map<number, number>): number {
  calls[0]++;
  const key = day * 2 + holding;
  const seen = memo.get(key);
  if (seen !== undefined) return seen;
  let answer: number;
  if (day === prices.length) {
    answer = 0;
  } else {
    answer = twoState(day + 1, holding, memo);              // sit still
    if (holding === 1) {
      const sell = prices[day] + twoState(day + 1, 0, memo);
      if (sell > answer) answer = sell;
    } else {
      const buy = -prices[day] + twoState(day + 1, 1, memo);
      if (buy > answer) answer = buy;
    }
  }
  memo.set(key, answer);
  return answer;
}

/** The same, plus one bit: whether today is the day you must sit out. */
function threeState(day: number, holding: number, cooling: number, memo: Map<number, number>): number {
  calls[1]++;
  const key = (day * 2 + holding) * 2 + cooling;
  const seen = memo.get(key);
  if (seen !== undefined) return seen;
  let answer: number;
  if (day === prices.length) {
    answer = 0;
  } else {
    answer = threeState(day + 1, holding, 0, memo);         // sit still
    if (holding === 1) {
      // Selling today is what puts tomorrow into cooldown.
      const sell = prices[day] + threeState(day + 1, 0, 1, memo);
      if (sell > answer) answer = sell;
    } else if (cooling === 0) {
      const buy = -prices[day] + threeState(day + 1, 1, 0, memo);
      if (buy > answer) answer = buy;
    }
  }
  memo.set(key, answer);
  return answer;
}

/** Every legal sequence of decisions, with no state and no memo at all. */
function bruteForce(day: number, holding: number, cooling: number): number {
  if (day === prices.length) return 0;
  let best = bruteForce(day + 1, holding, 0);
  if (holding === 1) {
    const sell = prices[day] + bruteForce(day + 1, 0, 1);
    if (sell > best) best = sell;
  } else if (cooling === 0) {
    const buy = -prices[day] + bruteForce(day + 1, 1, 0);
    if (buy > best) best = buy;
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

const memoA = new Map();
const memoB = new Map();
const two = twoState(0, 0, memoA);
const three = threeState(0, 0, 0, memoB);
let truth = bruteForce(0, 0, 0);

console.log(\`prices \${show(prices)}\`);
console.log("rule: after selling, you sit out the next day");
console.log();
console.log(padEnd("state", 38) + pad("profit", 8) + pad("calls", 8) + pad("states", 8));
console.log(padEnd("(day, holding)", 38) + pad(two, 8) + pad(calls[0], 8) + pad(memoA.size, 8));
console.log(padEnd("(day, holding, cooling)", 38) + pad(three, 8) + pad(calls[1], 8) + pad(memoB.size, 8));
console.log(padEnd("every legal sequence, enumerated", 38) + pad(truth, 8));
console.log();

const TRIALS = 4000;
let twoRight = 0;
let threeRight = 0;
let over = 0;
let under = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(11);
  prices = Array.from({ length: n }, () => 1 + rand(20));
  truth = bruteForce(0, 0, 0);
  const answer = twoState(0, 0, new Map());
  if (answer === truth) {
    twoRight++;
  } else if (answer > truth) {
    over++;
  } else {
    under++;
  }
  if (threeState(0, 0, 0, new Map()) === truth) threeRight++;
}

console.log(\`scored against every legal sequence on \${TRIALS} random price runs:\`);
console.log(\`  (day, holding)             \${pad(twoRight, 6)} right, \${over} too high, \${under} too low\`);
console.log(\`  (day, holding, cooling)    \${pad(threeRight, 6)} right\`);
`,
            },
            {
              lang: "java",
              code: `import java.util.HashMap;
import java.util.Map;

// The third way to get a state wrong, and the only one that needs an idea rather
// than a correction. Sometimes the state has to carry something that is not an
// argument yet -- a fact about the world that no index records -- and until you
// invent it the recurrence cannot express the rule it is supposed to obey.
//
// The problem: buy and sell a share as often as you like, one share at a time,
// but after a sale you must sit out the next day.
public class Main {
    static int[] prices = { 4, 9, 2, 7, 3, 8, 1, 6, 5, 10 };

    static long[] calls = new long[2];

    static String show(int[] values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(values[i]);
        }
        return sb.append("]").toString();
    }

    /**
     * Best profit from \`day\` on, remembering only whether a share is held.
     *
     * A complete and correct dynamic program -- for the problem with no cooldown.
     * Nothing here is able to say "and you may not buy today", because the state
     * has nowhere to record that yesterday ended in a sale.
     */
    static int twoState(int day, int holding, Map<Integer, Integer> memo) {
        calls[0]++;
        int key = day * 2 + holding;
        if (memo.containsKey(key)) return memo.get(key);
        int answer;
        if (day == prices.length) {
            answer = 0;
        } else {
            answer = twoState(day + 1, holding, memo);              // sit still
            if (holding == 1) {
                int sell = prices[day] + twoState(day + 1, 0, memo);
                if (sell > answer) answer = sell;
            } else {
                int buy = -prices[day] + twoState(day + 1, 1, memo);
                if (buy > answer) answer = buy;
            }
        }
        memo.put(key, answer);
        return answer;
    }

    /** The same, plus one bit: whether today is the day you must sit out. */
    static int threeState(int day, int holding, int cooling, Map<Integer, Integer> memo) {
        calls[1]++;
        int key = (day * 2 + holding) * 2 + cooling;
        if (memo.containsKey(key)) return memo.get(key);
        int answer;
        if (day == prices.length) {
            answer = 0;
        } else {
            answer = threeState(day + 1, holding, 0, memo);         // sit still
            if (holding == 1) {
                // Selling today is what puts tomorrow into cooldown.
                int sell = prices[day] + threeState(day + 1, 0, 1, memo);
                if (sell > answer) answer = sell;
            } else if (cooling == 0) {
                int buy = -prices[day] + threeState(day + 1, 1, 0, memo);
                if (buy > answer) answer = buy;
            }
        }
        memo.put(key, answer);
        return answer;
    }

    /** Every legal sequence of decisions, with no state and no memo at all. */
    static int bruteForce(int day, int holding, int cooling) {
        if (day == prices.length) return 0;
        int best = bruteForce(day + 1, holding, 0);
        if (holding == 1) {
            int sell = prices[day] + bruteForce(day + 1, 0, 1);
            if (sell > best) best = sell;
        } else if (cooling == 0) {
            int buy = -prices[day] + bruteForce(day + 1, 1, 0);
            if (buy > best) best = buy;
        }
        return best;
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        Map<Integer, Integer> memoA = new HashMap<>();
        Map<Integer, Integer> memoB = new HashMap<>();
        int two = twoState(0, 0, memoA);
        int three = threeState(0, 0, 0, memoB);
        int truth = bruteForce(0, 0, 0);

        System.out.printf("prices %s%n", show(prices));
        System.out.println("rule: after selling, you sit out the next day");
        System.out.println();
        System.out.printf("%-38s%8s%8s%8s%n", "state", "profit", "calls", "states");
        System.out.printf("%-38s%8d%8d%8d%n", "(day, holding)", two, calls[0], memoA.size());
        System.out.printf("%-38s%8d%8d%8d%n", "(day, holding, cooling)", three, calls[1], memoB.size());
        System.out.printf("%-38s%8d%n", "every legal sequence, enumerated", truth);
        System.out.println();

        final int TRIALS = 4000;
        int twoRight = 0;
        int threeRight = 0;
        int over = 0;
        int under = 0;
        for (int t = 0; t < TRIALS; t++) {
            int n = 2 + rand(11);
            prices = new int[n];
            for (int i = 0; i < n; i++) prices[i] = 1 + rand(20);
            truth = bruteForce(0, 0, 0);
            int answer = twoState(0, 0, new HashMap<>());
            if (answer == truth) {
                twoRight++;
            } else if (answer > truth) {
                over++;
            } else {
                under++;
            }
            if (threeState(0, 0, 0, new HashMap<>()) == truth) threeRight++;
        }

        System.out.printf("scored against every legal sequence on %d random price runs:%n", TRIALS);
        System.out.printf("  (day, holding)             %6d right, %d too high, %d too low%n", twoRight, over, under);
        System.out.printf("  (day, holding, cooling)    %6d right%n", threeRight);
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The third way to get a state wrong, and the only one that needs an idea rather
// than a correction. Sometimes the state has to carry something that is not an
// argument yet -- a fact about the world that no index records -- and until you
// invent it the recurrence cannot express the rule it is supposed to obey.
//
// The problem: buy and sell a share as often as you like, one share at a time,
// but after a sale you must sit out the next day.
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <vector>

static std::vector<int> prices = {4, 9, 2, 7, 3, 8, 1, 6, 5, 10};

static std::array<std::int64_t, 2> calls{};

std::string show(const std::vector<int> &values) {
    std::string out = "[";
    for (size_t i = 0; i < values.size(); i++) {
        if (i > 0) out += ", ";
        out += std::to_string(values[i]);
    }
    return out + "]";
}

// Best profit from \`day\` on, remembering only whether a share is held.
//
// A complete and correct dynamic program -- for the problem with no cooldown.
// Nothing here is able to say "and you may not buy today", because the state has
// nowhere to record that yesterday ended in a sale.
int twoState(int day, int holding, std::map<int, int> &memo) {
    calls[0]++;
    int key = day * 2 + holding;
    auto it = memo.find(key);
    if (it != memo.end()) return it->second;
    int answer;
    if (day == static_cast<int>(prices.size())) {
        answer = 0;
    } else {
        answer = twoState(day + 1, holding, memo);              // sit still
        if (holding == 1) {
            int sell = prices[day] + twoState(day + 1, 0, memo);
            if (sell > answer) answer = sell;
        } else {
            int buy = -prices[day] + twoState(day + 1, 1, memo);
            if (buy > answer) answer = buy;
        }
    }
    memo[key] = answer;
    return answer;
}

// The same, plus one bit: whether today is the day you must sit out.
int threeState(int day, int holding, int cooling, std::map<int, int> &memo) {
    calls[1]++;
    int key = (day * 2 + holding) * 2 + cooling;
    auto it = memo.find(key);
    if (it != memo.end()) return it->second;
    int answer;
    if (day == static_cast<int>(prices.size())) {
        answer = 0;
    } else {
        answer = threeState(day + 1, holding, 0, memo);         // sit still
        if (holding == 1) {
            // Selling today is what puts tomorrow into cooldown.
            int sell = prices[day] + threeState(day + 1, 0, 1, memo);
            if (sell > answer) answer = sell;
        } else if (cooling == 0) {
            int buy = -prices[day] + threeState(day + 1, 1, 0, memo);
            if (buy > answer) answer = buy;
        }
    }
    memo[key] = answer;
    return answer;
}

// Every legal sequence of decisions, with no state and no memo at all.
int bruteForce(int day, int holding, int cooling) {
    if (day == static_cast<int>(prices.size())) return 0;
    int best = bruteForce(day + 1, holding, 0);
    if (holding == 1) {
        int sell = prices[day] + bruteForce(day + 1, 0, 1);
        if (sell > best) best = sell;
    } else if (cooling == 0) {
        int buy = -prices[day] + bruteForce(day + 1, 1, 0);
        if (buy > best) best = buy;
    }
    return best;
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    std::map<int, int> memoA, memoB;
    int two = twoState(0, 0, memoA);
    int three = threeState(0, 0, 0, memoB);
    int truth = bruteForce(0, 0, 0);

    std::cout << "prices " << show(prices) << "\\n";
    std::cout << "rule: after selling, you sit out the next day\\n\\n";
    std::cout << std::left << std::setw(38) << "state" << std::right << std::setw(8) << "profit"
              << std::setw(8) << "calls" << std::setw(8) << "states" << "\\n";
    std::cout << std::left << std::setw(38) << "(day, holding)" << std::right << std::setw(8) << two
              << std::setw(8) << calls[0] << std::setw(8) << memoA.size() << "\\n";
    std::cout << std::left << std::setw(38) << "(day, holding, cooling)" << std::right << std::setw(8)
              << three << std::setw(8) << calls[1] << std::setw(8) << memoB.size() << "\\n";
    std::cout << std::left << std::setw(38) << "every legal sequence, enumerated" << std::right
              << std::setw(8) << truth << "\\n\\n";

    const int TRIALS = 4000;
    int twoRight = 0, threeRight = 0, over = 0, under = 0;
    for (int t = 0; t < TRIALS; t++) {
        int n = 2 + rnd(11);
        prices.assign(n, 0);
        for (int i = 0; i < n; i++) prices[i] = 1 + rnd(20);
        truth = bruteForce(0, 0, 0);
        std::map<int, int> a;
        int answer = twoState(0, 0, a);
        if (answer == truth) {
            twoRight++;
        } else if (answer > truth) {
            over++;
        } else {
            under++;
        }
        std::map<int, int> b;
        if (threeState(0, 0, 0, b) == truth) threeRight++;
    }

    std::cout << "scored against every legal sequence on " << TRIALS << " random price runs:\\n";
    std::cout << "  (day, holding)             " << std::right << std::setw(6) << twoRight
              << " right, " << over << " too high, " << under << " too low\\n";
    std::cout << "  (day, holding, cooling)    " << std::right << std::setw(6) << threeRight << " right\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// The third way to get a state wrong, and the only one that needs an idea rather
// than a correction. Sometimes the state has to carry something that is not an
// argument yet -- a fact about the world that no index records -- and until you
// invent it the recurrence cannot express the rule it is supposed to obey.
//
// The problem: buy and sell a share as often as you like, one share at a time,
// but after a sale you must sit out the next day.
use std::collections::HashMap;

fn show(values: &[i32]) -> String {
    format!("[{}]", values.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(", "))
}

/// Best profit from \`day\` on, remembering only whether a share is held.
///
/// A complete and correct dynamic program -- for the problem with no cooldown.
/// Nothing here is able to say "and you may not buy today", because the state
/// has nowhere to record that yesterday ended in a sale.
fn two_state(
    prices: &[i32], day: usize, holding: i32, memo: &mut HashMap<i32, i32>, calls: &mut [i64; 2],
) -> i32 {
    calls[0] += 1;
    let key = day as i32 * 2 + holding;
    if let Some(&v) = memo.get(&key) {
        return v;
    }
    let answer = if day == prices.len() {
        0
    } else {
        let mut best = two_state(prices, day + 1, holding, memo, calls); // sit still
        if holding == 1 {
            let sell = prices[day] + two_state(prices, day + 1, 0, memo, calls);
            if sell > best {
                best = sell;
            }
        } else {
            let buy = -prices[day] + two_state(prices, day + 1, 1, memo, calls);
            if buy > best {
                best = buy;
            }
        }
        best
    };
    memo.insert(key, answer);
    answer
}

/// The same, plus one bit: whether today is the day you must sit out.
fn three_state(
    prices: &[i32], day: usize, holding: i32, cooling: i32, memo: &mut HashMap<i32, i32>,
    calls: &mut [i64; 2],
) -> i32 {
    calls[1] += 1;
    let key = (day as i32 * 2 + holding) * 2 + cooling;
    if let Some(&v) = memo.get(&key) {
        return v;
    }
    let answer = if day == prices.len() {
        0
    } else {
        let mut best = three_state(prices, day + 1, holding, 0, memo, calls); // sit still
        if holding == 1 {
            // Selling today is what puts tomorrow into cooldown.
            let sell = prices[day] + three_state(prices, day + 1, 0, 1, memo, calls);
            if sell > best {
                best = sell;
            }
        } else if cooling == 0 {
            let buy = -prices[day] + three_state(prices, day + 1, 1, 0, memo, calls);
            if buy > best {
                best = buy;
            }
        }
        best
    };
    memo.insert(key, answer);
    answer
}

/// Every legal sequence of decisions, with no state and no memo at all.
fn brute_force(prices: &[i32], day: usize, holding: i32, cooling: i32) -> i32 {
    if day == prices.len() {
        return 0;
    }
    let mut best = brute_force(prices, day + 1, holding, 0);
    if holding == 1 {
        let sell = prices[day] + brute_force(prices, day + 1, 0, 1);
        if sell > best {
            best = sell;
        }
    } else if cooling == 0 {
        let buy = -prices[day] + brute_force(prices, day + 1, 1, 0);
        if buy > best {
            best = buy;
        }
    }
    best
}

fn rand(seed: &mut i64, n: i64) -> i32 {
    *seed = (*seed * 1103515245 + 12345) % 2147483648;
    (*seed / 65536 % n) as i32
}

fn main() {
    let mut prices: Vec<i32> = vec![4, 9, 2, 7, 3, 8, 1, 6, 5, 10];
    let mut calls = [0i64; 2];
    let mut memo_a: HashMap<i32, i32> = HashMap::new();
    let mut memo_b: HashMap<i32, i32> = HashMap::new();
    let two = two_state(&prices, 0, 0, &mut memo_a, &mut calls);
    let three = three_state(&prices, 0, 0, 0, &mut memo_b, &mut calls);
    let mut truth = brute_force(&prices, 0, 0, 0);

    println!("prices {}", show(&prices));
    println!("rule: after selling, you sit out the next day");
    println!();
    println!("{:<38}{:>8}{:>8}{:>8}", "state", "profit", "calls", "states");
    println!("{:<38}{:>8}{:>8}{:>8}", "(day, holding)", two, calls[0], memo_a.len());
    println!("{:<38}{:>8}{:>8}{:>8}", "(day, holding, cooling)", three, calls[1], memo_b.len());
    println!("{:<38}{:>8}", "every legal sequence, enumerated", truth);
    println!();

    const TRIALS: i32 = 4000;
    let mut seed = 1i64;
    let (mut two_right, mut three_right, mut over, mut under) = (0, 0, 0, 0);
    for _ in 0..TRIALS {
        let n = 2 + rand(&mut seed, 11) as usize;
        prices = (0..n).map(|_| 1 + rand(&mut seed, 20)).collect();
        truth = brute_force(&prices, 0, 0, 0);
        let mut a: HashMap<i32, i32> = HashMap::new();
        let answer = two_state(&prices, 0, 0, &mut a, &mut calls);
        if answer == truth {
            two_right += 1;
        } else if answer > truth {
            over += 1;
        } else {
            under += 1;
        }
        let mut b: HashMap<i32, i32> = HashMap::new();
        if three_state(&prices, 0, 0, 0, &mut b, &mut calls) == truth {
            three_right += 1;
        }
    }

    println!("scored against every legal sequence on {} random price runs:", TRIALS);
    println!("  (day, holding)             {:>6} right, {} too high, {} too low", two_right, over, under);
    println!("  (day, holding, cooling)    {:>6} right", three_right);
}
`,
            },
            {
              lang: "go",
              code: `// The third way to get a state wrong, and the only one that needs an idea rather
// than a correction. Sometimes the state has to carry something that is not an
// argument yet -- a fact about the world that no index records -- and until you
// invent it the recurrence cannot express the rule it is supposed to obey.
//
// The problem: buy and sell a share as often as you like, one share at a time,
// but after a sale you must sit out the next day.
package main

import (
	"fmt"
	"strings"
)

var prices = []int{4, 9, 2, 7, 3, 8, 1, 6, 5, 10}

var calls [2]int64

func show(values []int) string {
	parts := make([]string, len(values))
	for i, v := range values {
		parts[i] = fmt.Sprintf("%d", v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

// Best profit from \`day\` on, remembering only whether a share is held.
//
// A complete and correct dynamic program -- for the problem with no cooldown.
// Nothing here is able to say "and you may not buy today", because the state has
// nowhere to record that yesterday ended in a sale.
func twoState(day, holding int, memo map[int]int) int {
	calls[0]++
	key := day*2 + holding
	if v, ok := memo[key]; ok {
		return v
	}
	var answer int
	if day == len(prices) {
		answer = 0
	} else {
		answer = twoState(day+1, holding, memo) // sit still
		if holding == 1 {
			if sell := prices[day] + twoState(day+1, 0, memo); sell > answer {
				answer = sell
			}
		} else {
			if buy := -prices[day] + twoState(day+1, 1, memo); buy > answer {
				answer = buy
			}
		}
	}
	memo[key] = answer
	return answer
}

// The same, plus one bit: whether today is the day you must sit out.
func threeState(day, holding, cooling int, memo map[int]int) int {
	calls[1]++
	key := (day*2+holding)*2 + cooling
	if v, ok := memo[key]; ok {
		return v
	}
	var answer int
	if day == len(prices) {
		answer = 0
	} else {
		answer = threeState(day+1, holding, 0, memo) // sit still
		if holding == 1 {
			// Selling today is what puts tomorrow into cooldown.
			if sell := prices[day] + threeState(day+1, 0, 1, memo); sell > answer {
				answer = sell
			}
		} else if cooling == 0 {
			if buy := -prices[day] + threeState(day+1, 1, 0, memo); buy > answer {
				answer = buy
			}
		}
	}
	memo[key] = answer
	return answer
}

// Every legal sequence of decisions, with no state and no memo at all.
func bruteForce(day, holding, cooling int) int {
	if day == len(prices) {
		return 0
	}
	best := bruteForce(day+1, holding, 0)
	if holding == 1 {
		if sell := prices[day] + bruteForce(day+1, 0, 1); sell > best {
			best = sell
		}
	} else if cooling == 0 {
		if buy := -prices[day] + bruteForce(day+1, 1, 0); buy > best {
			best = buy
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
	memoA := map[int]int{}
	memoB := map[int]int{}
	two := twoState(0, 0, memoA)
	three := threeState(0, 0, 0, memoB)
	truth := bruteForce(0, 0, 0)

	fmt.Printf("prices %s\\n", show(prices))
	fmt.Println("rule: after selling, you sit out the next day")
	fmt.Println()
	fmt.Printf("%-38s%8s%8s%8s\\n", "state", "profit", "calls", "states")
	fmt.Printf("%-38s%8d%8d%8d\\n", "(day, holding)", two, calls[0], len(memoA))
	fmt.Printf("%-38s%8d%8d%8d\\n", "(day, holding, cooling)", three, calls[1], len(memoB))
	fmt.Printf("%-38s%8d\\n", "every legal sequence, enumerated", truth)
	fmt.Println()

	const TRIALS = 4000
	twoRight, threeRight, over, under := 0, 0, 0, 0
	for t := 0; t < TRIALS; t++ {
		n := 2 + rand(11)
		prices = make([]int, n)
		for i := range prices {
			prices[i] = 1 + rand(20)
		}
		truth = bruteForce(0, 0, 0)
		answer := twoState(0, 0, map[int]int{})
		if answer == truth {
			twoRight++
		} else if answer > truth {
			over++
		} else {
			under++
		}
		if threeState(0, 0, 0, map[int]int{}) == truth {
			threeRight++
		}
	}

	fmt.Printf("scored against every legal sequence on %d random price runs:\\n", TRIALS)
	fmt.Printf("  (day, holding)             %6d right, %d too high, %d too low\\n", twoRight, over, under)
	fmt.Printf("  (day, holding, cooling)    %6d right\\n", threeRight)
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "A model that cannot see a restriction gives an upper bound, not a wrong number",
          body: "The two-state answer is never below the truth in four thousand trials, and that is structural rather than lucky: ignoring a rule can only widen the set of things you are allowed to do. It is worth noticing because it is occasionally useful \u2014 an over-permissive model is a bound you can prune with, which is exactly the role the fractional relaxation played at the end of the greedy module.",
        },
        {
          title: "The answer is not always the last cell",
          body: "Sentence B's answer is the largest cell in the table, not the final one; the cooldown answer is the cell for day zero with nothing held and no cooldown. Deciding this while writing the sentence, rather than after the table is full, avoids a bug where everything is correct except which cell you read.",
        },
      ],
    },
    {
      id: "writing-the-sentence",
      heading: "The procedure, on paper, before any code",
      body: [
        "Put together, that is a four-step procedure, and it is worth running on paper before any code.",
        "**Write the sentence.** No `dp` in it. The shape that works is \"the best *objective* over *the choices still open*, given *what the arguments have fixed*\". If the sentence needs a comma and the word \"and\", that is fine \u2014 it usually means you have found a second dimension.",
        "**Check it is a function.** Two situations with the same arguments must deserve the same answer. This is the sentence-A test, and the cheapest way to run it is the one in the first example: search for two situations that agree on the arguments and disagree on the answer. Finding one takes seconds and settles the question.",
        "**Check every argument earns its place.** Delete each component in turn and name the pair of situations that would wrongly merge. If you cannot name one, the component is not part of the state and is costing you a dimension.",
        "**Multiply the ranges.** The product is the table size, and with the work per state it is the running time. This is the step that tells you whether the state you just defined is the one you can afford, and it costs a minute rather than an implementation.",
        "One last thing to write down while the sentence is fresh: **where the answer lives**. Sometimes it is the last cell, sometimes the largest cell, sometimes a particular corner. A correct table read at the wrong cell is one of the more confusing bugs to hit, because everything about the table is right.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you choose the state for a dynamic programming problem?",
      answer:
        "I write a sentence, not an array. The sentence has to say what one cell means without using the word dp, in the form \"the best objective over the choices still open, given what the arguments have fixed\", and a stranger should be able to fill in a cell by hand from it. Then I check three things. That it is a function \u2014 two situations with the same arguments must deserve the same answer, and the cheapest test is to search for a pair that agree on the arguments and disagree on the answer. That every component earns its place \u2014 delete each in turn and name the pair of situations that would wrongly merge. And what the ranges multiply out to, because that product is the table size and the running time, and it tells me whether this is the state I can afford before I write anything.",
    },
    {
      question: "Why does dp[i] as \"the longest increasing subsequence among the first i values\" not work, when dp[i] as \"the longest increasing subsequence ending at i\" does?",
      answer:
        "Because the first one is not a function of the things you would build it from. Two prefixes can have the same answer and read the same next value and still continue differently \u2014 the search in the lesson finds such a pair after six random arrays \u2014 so there is no rule from the previous cell and the next value to this cell. What the first sentence forgets is what the best subsequence ended on, which is exactly what decides whether the next value can extend it. Ending at i carries that, so the recurrence closes: look back at every earlier index with a smaller value and take the best, plus one. The cost is that the answer becomes the largest cell rather than the last one, which is normal \u2014 a state that is literally the answer usually is not a state.",
    },
    {
      question: "Your dynamic program is correct but the table is too big. Where do you look first?",
      answer:
        "At whether every dimension is load-bearing. For each component I ask which two situations would collapse together if I deleted it, and if I cannot name a pair, it is not part of the state. Unbounded coin change is the clean example: written by walking the denominations you get an index in the state, but any coin can be used any number of times, so the index rules nothing out \u2014 dropping it takes 239 states to 48, and, more to the point, stops the table growing with the number of denominations at all. The same index is genuinely required for 0/1 knapsack, where it is what stops an item being taken twice, so this is a question about the problem rather than about the shape of the recursion. After that I would look at whether the ranges are pseudo-polynomial \u2014 a dimension sized by a value rather than by a length is the usual reason a table is enormous for a small-looking input.",
    },
  ],
  takeaways: [
    "Say what one cell means in an English sentence with no \"dp\" in it. If you cannot, you do not have a state yet.",
    "A sentence can be true, precise and computable and still not be a state \u2014 it must also be a function of what you build it from.",
    "A state that is literally the answer usually is not a state; the answer is often the largest cell rather than the last one.",
    "The failing LIS sentence forgets what the subsequence ended on, and a witness against it turns up in six random arrays.",
    "Every dimension must rule something out: delete it and name the two situations that would wrongly merge.",
    "The index is wasted in unbounded coin change and load-bearing in 0/1 knapsack, on recursions that look the same.",
    "When a transition needs a fact the arguments do not provide, that fact is a missing dimension \u2014 and it is usually one small categorical value.",
    "The product of the ranges is the table size and the running time, and it can be computed before a line is written.",
  ],
  status: "available",
};
