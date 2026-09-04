import type { Lesson } from "@/content/types";

export const reconstructingTheAnswerLesson: Lesson = {
  id: "dsa-dp-reconstructing-the-answer",
  slug: "reconstructing-the-answer",
  moduleSlug: "dynamic-programming-foundations",
  title: "Reconstructing the Answer",
  summary:
    "Almost no problem wants a number, and getting the items, edits or route back out of the table is its own step. Two ways to do it, a way to do it without the table at all, and the tie rule that decides which optimal answer you get — a bug no value-based test can see.",
  estimatedMinutes: 40,
  objectives: [
    "Recover a solution by re-deriving choices and by recording them, and say what each costs",
    "Recognise that a tie rule chooses between optimal answers without changing any value",
    "Use divide and conquer over the table to get a path in linear space",
    "Count the optimal solutions, and know when listing them is not a question you can answer",
  ],
  sections: [
    {
      id: "two-ways-back",
      heading: "Two ways back out of the table",
      body: [
        "A finished table holds a number. Very few problems actually want a number \u2014 they want the items, the edits, the schedule, the route \u2014 and getting those out is a separate step with its own choices and its own bugs.",
        "There are two ways. **Re-derive the choice from the values**: at each cell, ask which predecessor is consistent with what is written there. That costs no extra memory, but it needs the table intact and it needs to ask the question the same way the fill answered it. **Record the choice while making it**: a second table, written during the fill, read straight back. That is unambiguous and trivially correct, and it costs a table.",
        "Both are correct, and on a problem with no ties they return the same thing every time. Ties are not rare, though. Whenever two packings are worth the same, something has to break the tie, and what breaks it is a comparison buried in the fill.",
        "All three methods return a legal packing of the optimal value on all five thousand instances \u2014 there is no correctness question here. The traceback and the pointers recorded with the same comparison agree on the actual items five thousand times out of five thousand, which is what you would hope, because the traceback is re-deriving exactly the decision that comparison made.",
        "Change one character in the fill \u2014 `>` becomes \"or equal\" \u2014 and the value in every cell is unchanged while the packing comes back different on 1,856 of the 5,000. On the worked example it is A B C against A C F, both worth 150.",
        "Two things follow. The first is a bug you cannot find by testing values: **a traceback whose comparison has drifted from the fill's returns a different optimal answer, and no value-based test will ever notice**. The second is a technique: when a problem asks for the lexicographically smallest optimal solution, or the one with fewest items, it is asking you to choose the tie rule deliberately \u2014 and the place to choose it is the fill, with the traceback following.",
      ],
      examples: [
        {
          id: "traceback-or-pointers",
          title: "The same packing recovered two ways, and what a tie rule changes",
          lang: "python",
          code: `# The table holds the value. Getting the answer back out of it is a separate
# step, and there are two ways to do it: re-derive each choice from the numbers,
# or write the choice down while you make it.
#
# They agree exactly as long as they use the same rule for a tie -- and a tie is
# not a rare event, it is the normal case whenever two packings are worth the
# same.

WEIGHT = [3, 4, 5, 2, 6, 4]
VALUE = [40, 50, 60, 20, 70, 50]
CAPACITY = 12


def fill(weights, values, capacity, prefer_taking):
    """The ordinary table, plus a second table recording each decision.

    \`prefer_taking\` changes one comparison: whether a tie counts as a reason to
    take the item. It cannot change the value in any cell, only which of two
    equally good packings the pointers describe.
    """
    n = len(weights)
    table = [[0] * (capacity + 1) for _ in range(n + 1)]
    took = [[0] * (capacity + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for cap in range(capacity + 1):
            best = table[i - 1][cap]
            take = 0
            if weights[i - 1] <= cap:
                candidate = values[i - 1] + table[i - 1][cap - weights[i - 1]]
                if candidate > best or (prefer_taking and candidate == best):
                    best = candidate
                    take = 1
            table[i][cap] = best
            took[i][cap] = take
    return table, took


def by_traceback(weights, table, capacity):
    """No extra memory: an item was taken exactly when the row changed value."""
    chosen = []
    cap = capacity
    for i in range(len(weights), 0, -1):
        if table[i][cap] != table[i - 1][cap]:
            chosen.append(i - 1)
            cap -= weights[i - 1]
    chosen.reverse()
    return chosen


def by_pointers(weights, took, capacity):
    """A second table, written during the fill, read straight back."""
    chosen = []
    cap = capacity
    for i in range(len(weights), 0, -1):
        if took[i][cap]:
            chosen.append(i - 1)
            cap -= weights[i - 1]
    chosen.reverse()
    return chosen


def show(weights, values, chosen):
    names = " ".join(chr(65 + i) for i in chosen) if chosen else "(none)"
    load = sum(weights[i] for i in chosen)
    worth = sum(values[i] for i in chosen)
    return names, load, worth


table, took_strict = fill(WEIGHT, VALUE, CAPACITY, False)
_, took_ties = fill(WEIGHT, VALUE, CAPACITY, True)

print(f"{'item':<6}{'weight':>8}{'value':>8}")
for i in range(len(WEIGHT)):
    print(f"{chr(65 + i):<6}{WEIGHT[i]:>8}{VALUE[i]:>8}")
print(f"capacity {CAPACITY}, best value {table[len(WEIGHT)][CAPACITY]}")
print()

print(f"{'method':<34}{'items':<14}{'weight':>8}{'value':>8}")
for label, chosen in (
    ("read back off the table", by_traceback(WEIGHT, table, CAPACITY)),
    ("pointers, ties go to leaving it", by_pointers(WEIGHT, took_strict, CAPACITY)),
    ("pointers, ties go to taking it", by_pointers(WEIGHT, took_ties, CAPACITY)),
):
    names, load, worth = show(WEIGHT, VALUE, chosen)
    print(f"{label:<34}{names:<14}{load:>8}{worth:>8}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 5000
optimal = [0, 0, 0]
agrees_with_traceback = [0, 0, 0]
different = None
for _ in range(TRIALS):
    n = 3 + rand(5)
    weights = [1 + rand(6) for _ in range(n)]
    # Deliberately coarse values, so ties between different packings are common
    # rather than rare.
    values = [10 * (1 + rand(3)) for _ in range(n)]
    cap = 4 + rand(10)
    table, took_strict = fill(weights, values, cap, False)
    _, took_ties = fill(weights, values, cap, True)
    best = table[n][cap]
    picks = [
        by_traceback(weights, table, cap),
        by_pointers(weights, took_strict, cap),
        by_pointers(weights, took_ties, cap),
    ]
    for k, chosen in enumerate(picks):
        if sum(weights[i] for i in chosen) <= cap and sum(values[i] for i in chosen) == best:
            optimal[k] += 1
        if chosen == picks[0]:
            agrees_with_traceback[k] += 1
    if picks[2] != picks[0] and different is None:
        different = (weights, values, cap, picks[0], picks[2], best)

print(f"over {TRIALS} random knapsacks:")
print(f"{'method':<34}{'legal and optimal':>18}{'same items as traceback':>26}")
for k, label in enumerate(
    ("read back off the table", "pointers, ties go to leaving it", "pointers, ties go to taking it")
):
    print(f"{label:<34}{optimal[k]:>18}{agrees_with_traceback[k]:>26}")
print()

weights, values, cap, a, b, best = different
print("the first instance where the tie rule changes the packing:")
print("  weights  [" + ", ".join(str(w) for w in weights) + "]")
print("  values   [" + ", ".join(str(v) for v in values) + "]")
na, la, wa = show(weights, values, a)
nb, lb, wb = show(weights, values, b)
print(f"  capacity {cap}, best value {best}")
print(f"  ties go to leaving it: {na:<12} weight {la}, value {wa}")
print(f"  ties go to taking it:  {nb:<12} weight {lb}, value {wb}")
`,
          output: `item    weight   value
A            3      40
B            4      50
C            5      60
D            2      20
E            6      70
F            4      50
capacity 12, best value 150

method                            items           weight   value
read back off the table           A B C               12     150
pointers, ties go to leaving it   A B C               12     150
pointers, ties go to taking it    A C F               12     150

over 5000 random knapsacks:
method                             legal and optimal   same items as traceback
read back off the table                         5000                      5000
pointers, ties go to leaving it                 5000                      5000
pointers, ties go to taking it                  5000                      3144

the first instance where the tie rule changes the packing:
  weights  [5, 4, 2, 2, 6, 1]
  values   [10, 10, 10, 20, 30, 10]
  capacity 4, best value 30
  ties go to leaving it: C D          weight 4, value 30
  ties go to taking it:  D F          weight 3, value 30`,
          explanation:
            "The three rows differ only in how the choice is recovered and, for the last one, in which way a tie goes during the fill. Every result is checked for being a legal packing of the optimal value, so the disagreement between them is about which optimal answer rather than about correctness.",
          alternates: [
            {
              lang: "javascript",
              code: `// The table holds the value. Getting the answer back out of it is a separate
// step, and there are two ways to do it: re-derive each choice from the numbers,
// or write the choice down while you make it.
//
// They agree exactly as long as they use the same rule for a tie -- and a tie is
// not a rare event, it is the normal case whenever two packings are worth the
// same.

const WEIGHT = [3, 4, 5, 2, 6, 4];
const VALUE = [40, 50, 60, 20, 70, 50];
const CAPACITY = 12;

/**
 * The ordinary table, plus a second table recording each decision.
 *
 * \`preferTaking\` changes one comparison: whether a tie counts as a reason to
 * take the item. It cannot change the value in any cell, only which of two
 * equally good packings the pointers describe.
 */
function fill(weights, values, capacity, preferTaking) {
  const n = weights.length;
  const table = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));
  const took = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let cap = 0; cap <= capacity; cap++) {
      let best = table[i - 1][cap];
      let take = 0;
      if (weights[i - 1] <= cap) {
        const candidate = values[i - 1] + table[i - 1][cap - weights[i - 1]];
        if (candidate > best || (preferTaking && candidate === best)) {
          best = candidate;
          take = 1;
        }
      }
      table[i][cap] = best;
      took[i][cap] = take;
    }
  }
  return [table, took];
}

/** No extra memory: an item was taken exactly when the row changed value. */
function byTraceback(weights, table, capacity) {
  const chosen = [];
  let cap = capacity;
  for (let i = weights.length; i > 0; i--) {
    if (table[i][cap] !== table[i - 1][cap]) {
      chosen.push(i - 1);
      cap -= weights[i - 1];
    }
  }
  chosen.reverse();
  return chosen;
}

/** A second table, written during the fill, read straight back. */
function byPointers(weights, took, capacity) {
  const chosen = [];
  let cap = capacity;
  for (let i = weights.length; i > 0; i--) {
    if (took[i][cap] !== 0) {
      chosen.push(i - 1);
      cap -= weights[i - 1];
    }
  }
  chosen.reverse();
  return chosen;
}

const names = (chosen) =>
  chosen.length === 0 ? "(none)" : chosen.map((i) => String.fromCharCode(65 + i)).join(" ");
const total = (amounts, chosen) => chosen.reduce((sum, i) => sum + amounts[i], 0);
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const show = (values) => \`[\${values.join(", ")}]\`;
const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const [strictTable, tookStrict] = fill(WEIGHT, VALUE, CAPACITY, false);
const [, tookTies] = fill(WEIGHT, VALUE, CAPACITY, true);

console.log(padEnd("item", 6) + pad("weight", 8) + pad("value", 8));
for (let i = 0; i < WEIGHT.length; i++) {
  console.log(padEnd(String.fromCharCode(65 + i), 6) + pad(WEIGHT[i], 8) + pad(VALUE[i], 8));
}
console.log(\`capacity \${CAPACITY}, best value \${strictTable[WEIGHT.length][CAPACITY]}\`);
console.log();

const LABELS = [
  "read back off the table", "pointers, ties go to leaving it", "pointers, ties go to taking it",
];
console.log(padEnd("method", 34) + padEnd("items", 14) + pad("weight", 8) + pad("value", 8));
const picks = [
  byTraceback(WEIGHT, strictTable, CAPACITY),
  byPointers(WEIGHT, tookStrict, CAPACITY),
  byPointers(WEIGHT, tookTies, CAPACITY),
];
for (let k = 0; k < 3; k++) {
  console.log(
    padEnd(LABELS[k], 34) + padEnd(names(picks[k]), 14) + pad(total(WEIGHT, picks[k]), 8) +
      pad(total(VALUE, picks[k]), 8)
  );
}
console.log();

const TRIALS = 5000;
const optimal = [0, 0, 0];
const agrees = [0, 0, 0];
let bad = null;
for (let t = 0; t < TRIALS; t++) {
  const n = 3 + rand(5);
  const weights = Array.from({ length: n }, () => 1 + rand(6));
  // Deliberately coarse values, so ties between different packings are common
  // rather than rare.
  const values = Array.from({ length: n }, () => 10 * (1 + rand(3)));
  const cap = 4 + rand(10);
  const [tbl, ps] = fill(weights, values, cap, false);
  const [, pt] = fill(weights, values, cap, true);
  const best = tbl[n][cap];
  const got = [
    byTraceback(weights, tbl, cap),
    byPointers(weights, ps, cap),
    byPointers(weights, pt, cap),
  ];
  for (let k = 0; k < 3; k++) {
    if (total(weights, got[k]) <= cap && total(values, got[k]) === best) optimal[k]++;
    if (same(got[k], got[0])) agrees[k]++;
  }
  if (!same(got[2], got[0]) && bad === null) bad = [weights, values, cap, best, got[0], got[2]];
}

console.log(\`over \${TRIALS} random knapsacks:\`);
console.log(padEnd("method", 34) + pad("legal and optimal", 18) + pad("same items as traceback", 26));
for (let k = 0; k < 3; k++) {
  console.log(padEnd(LABELS[k], 34) + pad(optimal[k], 18) + pad(agrees[k], 26));
}
console.log();

const [bw, bv, bcap, bbest, ba, bb] = bad;
console.log("the first instance where the tie rule changes the packing:");
console.log(\`  weights  \${show(bw)}\`);
console.log(\`  values   \${show(bv)}\`);
console.log(\`  capacity \${bcap}, best value \${bbest}\`);
console.log(\`  ties go to leaving it: \${padEnd(names(ba), 12)} weight \${total(bw, ba)}, value \${total(bv, ba)}\`);
console.log(\`  ties go to taking it:  \${padEnd(names(bb), 12)} weight \${total(bw, bb)}, value \${total(bv, bb)}\`);
`,
            },
            {
              lang: "typescript",
              code: `// The table holds the value. Getting the answer back out of it is a separate
// step, and there are two ways to do it: re-derive each choice from the numbers,
// or write the choice down while you make it.
//
// They agree exactly as long as they use the same rule for a tie -- and a tie is
// not a rare event, it is the normal case whenever two packings are worth the
// same.

const WEIGHT = [3, 4, 5, 2, 6, 4];
const VALUE = [40, 50, 60, 20, 70, 50];
const CAPACITY = 12;

/**
 * The ordinary table, plus a second table recording each decision.
 *
 * \`preferTaking\` changes one comparison: whether a tie counts as a reason to
 * take the item. It cannot change the value in any cell, only which of two
 * equally good packings the pointers describe.
 */
function fill(weights: number[], values: number[], capacity: number, preferTaking: boolean): [number[][], number[][]] {
  const n = weights.length;
  const table = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));
  const took = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let cap = 0; cap <= capacity; cap++) {
      let best = table[i - 1][cap];
      let take = 0;
      if (weights[i - 1] <= cap) {
        const candidate = values[i - 1] + table[i - 1][cap - weights[i - 1]];
        if (candidate > best || (preferTaking && candidate === best)) {
          best = candidate;
          take = 1;
        }
      }
      table[i][cap] = best;
      took[i][cap] = take;
    }
  }
  return [table, took];
}

/** No extra memory: an item was taken exactly when the row changed value. */
function byTraceback(weights: number[], table: number[][], capacity: number): number[] {
  const chosen: number[] = [];
  let cap = capacity;
  for (let i = weights.length; i > 0; i--) {
    if (table[i][cap] !== table[i - 1][cap]) {
      chosen.push(i - 1);
      cap -= weights[i - 1];
    }
  }
  chosen.reverse();
  return chosen;
}

/** A second table, written during the fill, read straight back. */
function byPointers(weights: number[], took: number[][], capacity: number): number[] {
  const chosen: number[] = [];
  let cap = capacity;
  for (let i = weights.length; i > 0; i--) {
    if (took[i][cap] !== 0) {
      chosen.push(i - 1);
      cap -= weights[i - 1];
    }
  }
  chosen.reverse();
  return chosen;
}

const names = (chosen: number[]): string =>
  chosen.length === 0 ? "(none)" : chosen.map((i) => String.fromCharCode(65 + i)).join(" ");
const total = (amounts: number[], chosen: number[]): number => chosen.reduce((sum, i) => sum + amounts[i], 0);
const same = (a: number[], b: number[]): boolean => a.length === b.length && a.every((v, i) => v === b[i]);
const show = (values: number[]): string => \`[\${values.join(", ")}]\`;
const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const [strictTable, tookStrict] = fill(WEIGHT, VALUE, CAPACITY, false);
const [, tookTies] = fill(WEIGHT, VALUE, CAPACITY, true);

console.log(padEnd("item", 6) + pad("weight", 8) + pad("value", 8));
for (let i = 0; i < WEIGHT.length; i++) {
  console.log(padEnd(String.fromCharCode(65 + i), 6) + pad(WEIGHT[i], 8) + pad(VALUE[i], 8));
}
console.log(\`capacity \${CAPACITY}, best value \${strictTable[WEIGHT.length][CAPACITY]}\`);
console.log();

const LABELS = [
  "read back off the table", "pointers, ties go to leaving it", "pointers, ties go to taking it",
];
console.log(padEnd("method", 34) + padEnd("items", 14) + pad("weight", 8) + pad("value", 8));
const picks = [
  byTraceback(WEIGHT, strictTable, CAPACITY),
  byPointers(WEIGHT, tookStrict, CAPACITY),
  byPointers(WEIGHT, tookTies, CAPACITY),
];
for (let k = 0; k < 3; k++) {
  console.log(
    padEnd(LABELS[k], 34) + padEnd(names(picks[k]), 14) + pad(total(WEIGHT, picks[k]), 8) +
      pad(total(VALUE, picks[k]), 8)
  );
}
console.log();

const TRIALS = 5000;
const optimal = [0, 0, 0];
const agrees = [0, 0, 0];
let bad: [number[], number[], number, number, number[], number[]] | null = null;
for (let t = 0; t < TRIALS; t++) {
  const n = 3 + rand(5);
  const weights = Array.from({ length: n }, () => 1 + rand(6));
  // Deliberately coarse values, so ties between different packings are common
  // rather than rare.
  const values = Array.from({ length: n }, () => 10 * (1 + rand(3)));
  const cap = 4 + rand(10);
  const [tbl, ps] = fill(weights, values, cap, false);
  const [, pt] = fill(weights, values, cap, true);
  const best = tbl[n][cap];
  const got = [
    byTraceback(weights, tbl, cap),
    byPointers(weights, ps, cap),
    byPointers(weights, pt, cap),
  ];
  for (let k = 0; k < 3; k++) {
    if (total(weights, got[k]) <= cap && total(values, got[k]) === best) optimal[k]++;
    if (same(got[k], got[0])) agrees[k]++;
  }
  if (!same(got[2], got[0]) && bad === null) bad = [weights, values, cap, best, got[0], got[2]];
}

console.log(\`over \${TRIALS} random knapsacks:\`);
console.log(padEnd("method", 34) + pad("legal and optimal", 18) + pad("same items as traceback", 26));
for (let k = 0; k < 3; k++) {
  console.log(padEnd(LABELS[k], 34) + pad(optimal[k], 18) + pad(agrees[k], 26));
}
console.log();

const [bw, bv, bcap, bbest, ba, bb] = bad!;
console.log("the first instance where the tie rule changes the packing:");
console.log(\`  weights  \${show(bw)}\`);
console.log(\`  values   \${show(bv)}\`);
console.log(\`  capacity \${bcap}, best value \${bbest}\`);
console.log(\`  ties go to leaving it: \${padEnd(names(ba), 12)} weight \${total(bw, ba)}, value \${total(bv, ba)}\`);
console.log(\`  ties go to taking it:  \${padEnd(names(bb), 12)} weight \${total(bw, bb)}, value \${total(bv, bb)}\`);
`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

// The table holds the value. Getting the answer back out of it is a separate
// step, and there are two ways to do it: re-derive each choice from the numbers,
// or write the choice down while you make it.
//
// They agree exactly as long as they use the same rule for a tie -- and a tie is
// not a rare event, it is the normal case whenever two packings are worth the
// same.
public class Main {
    static final int[] WEIGHT = { 3, 4, 5, 2, 6, 4 };
    static final int[] VALUE = { 40, 50, 60, 20, 70, 50 };
    static final int CAPACITY = 12;

    static int[][] table;
    static int[][] took;

    /**
     * The ordinary table, plus a second table recording each decision.
     *
     * \`preferTaking\` changes one comparison: whether a tie counts as a reason to
     * take the item. It cannot change the value in any cell, only which of two
     * equally good packings the pointers describe.
     */
    static void fill(int[] weights, int[] values, int capacity, boolean preferTaking) {
        int n = weights.length;
        table = new int[n + 1][capacity + 1];
        took = new int[n + 1][capacity + 1];
        for (int i = 1; i <= n; i++) {
            for (int cap = 0; cap <= capacity; cap++) {
                int best = table[i - 1][cap];
                int take = 0;
                if (weights[i - 1] <= cap) {
                    int candidate = values[i - 1] + table[i - 1][cap - weights[i - 1]];
                    if (candidate > best || (preferTaking && candidate == best)) {
                        best = candidate;
                        take = 1;
                    }
                }
                table[i][cap] = best;
                took[i][cap] = take;
            }
        }
    }

    /** No extra memory: an item was taken exactly when the row changed value. */
    static List<Integer> byTraceback(int[] weights, int[][] values, int capacity) {
        List<Integer> chosen = new ArrayList<>();
        int cap = capacity;
        for (int i = weights.length; i > 0; i--) {
            if (values[i][cap] != values[i - 1][cap]) {
                chosen.add(i - 1);
                cap -= weights[i - 1];
            }
        }
        Collections.reverse(chosen);
        return chosen;
    }

    /** A second table, written during the fill, read straight back. */
    static List<Integer> byPointers(int[] weights, int[][] pointers, int capacity) {
        List<Integer> chosen = new ArrayList<>();
        int cap = capacity;
        for (int i = weights.length; i > 0; i--) {
            if (pointers[i][cap] != 0) {
                chosen.add(i - 1);
                cap -= weights[i - 1];
            }
        }
        Collections.reverse(chosen);
        return chosen;
    }

    static String names(List<Integer> chosen) {
        if (chosen.isEmpty()) return "(none)";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < chosen.size(); i++) {
            if (i > 0) sb.append(" ");
            sb.append((char) ('A' + chosen.get(i)));
        }
        return sb.toString();
    }

    static int total(int[] amounts, List<Integer> chosen) {
        int sum = 0;
        for (int i : chosen) sum += amounts[i];
        return sum;
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    static String show(int[] values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(values[i]);
        }
        return sb.append("]").toString();
    }

    public static void main(String[] args) {
        fill(WEIGHT, VALUE, CAPACITY, false);
        int[][] strictTable = table;
        int[][] tookStrict = took;
        fill(WEIGHT, VALUE, CAPACITY, true);
        int[][] tookTies = took;

        System.out.printf("%-6s%8s%8s%n", "item", "weight", "value");
        for (int i = 0; i < WEIGHT.length; i++) {
            System.out.printf("%-6s%8d%8d%n", (char) ('A' + i), WEIGHT[i], VALUE[i]);
        }
        System.out.printf("capacity %d, best value %d%n", CAPACITY, strictTable[WEIGHT.length][CAPACITY]);
        System.out.println();

        System.out.printf("%-34s%-14s%8s%8s%n", "method", "items", "weight", "value");
        String[] labels = {
            "read back off the table", "pointers, ties go to leaving it", "pointers, ties go to taking it",
        };
        List<List<Integer>> picks = new ArrayList<>();
        picks.add(byTraceback(WEIGHT, strictTable, CAPACITY));
        picks.add(byPointers(WEIGHT, tookStrict, CAPACITY));
        picks.add(byPointers(WEIGHT, tookTies, CAPACITY));
        for (int k = 0; k < 3; k++) {
            System.out.printf("%-34s%-14s%8d%8d%n", labels[k], names(picks.get(k)),
                total(WEIGHT, picks.get(k)), total(VALUE, picks.get(k)));
        }
        System.out.println();

        final int TRIALS = 5000;
        int[] optimal = new int[3];
        int[] agrees = new int[3];
        int[] badWeights = null, badValues = null;
        int badCap = 0, badBest = 0;
        List<Integer> badA = null, badB = null;
        for (int t = 0; t < TRIALS; t++) {
            int n = 3 + rand(5);
            int[] weights = new int[n];
            int[] values = new int[n];
            for (int i = 0; i < n; i++) weights[i] = 1 + rand(6);
            // Deliberately coarse values, so ties between different packings are
            // common rather than rare.
            for (int i = 0; i < n; i++) values[i] = 10 * (1 + rand(3));
            int cap = 4 + rand(10);
            fill(weights, values, cap, false);
            int[][] tbl = table;
            int[][] ps = took;
            fill(weights, values, cap, true);
            int[][] pt = took;
            int best = tbl[n][cap];
            List<List<Integer>> got = new ArrayList<>();
            got.add(byTraceback(weights, tbl, cap));
            got.add(byPointers(weights, ps, cap));
            got.add(byPointers(weights, pt, cap));
            for (int k = 0; k < 3; k++) {
                if (total(weights, got.get(k)) <= cap && total(values, got.get(k)) == best) optimal[k]++;
                if (got.get(k).equals(got.get(0))) agrees[k]++;
            }
            if (!got.get(2).equals(got.get(0)) && badWeights == null) {
                badWeights = weights;
                badValues = values;
                badCap = cap;
                badBest = best;
                badA = got.get(0);
                badB = got.get(2);
            }
        }

        System.out.printf("over %d random knapsacks:%n", TRIALS);
        System.out.printf("%-34s%18s%26s%n", "method", "legal and optimal", "same items as traceback");
        for (int k = 0; k < 3; k++) {
            System.out.printf("%-34s%18d%26d%n", labels[k], optimal[k], agrees[k]);
        }
        System.out.println();

        System.out.println("the first instance where the tie rule changes the packing:");
        System.out.printf("  weights  %s%n", show(badWeights));
        System.out.printf("  values   %s%n", show(badValues));
        System.out.printf("  capacity %d, best value %d%n", badCap, badBest);
        System.out.printf("  ties go to leaving it: %-12s weight %d, value %d%n", names(badA),
            total(badWeights, badA), total(badValues, badA));
        System.out.printf("  ties go to taking it:  %-12s weight %d, value %d%n", names(badB),
            total(badWeights, badB), total(badValues, badB));
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The table holds the value. Getting the answer back out of it is a separate
// step, and there are two ways to do it: re-derive each choice from the numbers,
// or write the choice down while you make it.
//
// They agree exactly as long as they use the same rule for a tie -- and a tie is
// not a rare event, it is the normal case whenever two packings are worth the
// same.
#include <algorithm>
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

static const std::vector<int> WEIGHT = {3, 4, 5, 2, 6, 4};
static const std::vector<int> VALUE = {40, 50, 60, 20, 70, 50};
static const int CAPACITY = 12;

using Grid = std::vector<std::vector<int>>;

// The ordinary table, plus a second table recording each decision.
//
// \`preferTaking\` changes one comparison: whether a tie counts as a reason to
// take the item. It cannot change the value in any cell, only which of two
// equally good packings the pointers describe.
void fill(const std::vector<int> &weights, const std::vector<int> &values, int capacity,
          bool preferTaking, Grid &table, Grid &took) {
    int n = static_cast<int>(weights.size());
    table.assign(n + 1, std::vector<int>(capacity + 1, 0));
    took.assign(n + 1, std::vector<int>(capacity + 1, 0));
    for (int i = 1; i <= n; i++) {
        for (int cap = 0; cap <= capacity; cap++) {
            int best = table[i - 1][cap];
            int take = 0;
            if (weights[i - 1] <= cap) {
                int candidate = values[i - 1] + table[i - 1][cap - weights[i - 1]];
                if (candidate > best || (preferTaking && candidate == best)) {
                    best = candidate;
                    take = 1;
                }
            }
            table[i][cap] = best;
            took[i][cap] = take;
        }
    }
}

// No extra memory: an item was taken exactly when the row changed value.
std::vector<int> byTraceback(const std::vector<int> &weights, const Grid &table, int capacity) {
    std::vector<int> chosen;
    int cap = capacity;
    for (int i = static_cast<int>(weights.size()); i > 0; i--) {
        if (table[i][cap] != table[i - 1][cap]) {
            chosen.push_back(i - 1);
            cap -= weights[i - 1];
        }
    }
    std::reverse(chosen.begin(), chosen.end());
    return chosen;
}

// A second table, written during the fill, read straight back.
std::vector<int> byPointers(const std::vector<int> &weights, const Grid &took, int capacity) {
    std::vector<int> chosen;
    int cap = capacity;
    for (int i = static_cast<int>(weights.size()); i > 0; i--) {
        if (took[i][cap] != 0) {
            chosen.push_back(i - 1);
            cap -= weights[i - 1];
        }
    }
    std::reverse(chosen.begin(), chosen.end());
    return chosen;
}

std::string names(const std::vector<int> &chosen) {
    if (chosen.empty()) return "(none)";
    std::string out;
    for (size_t i = 0; i < chosen.size(); i++) {
        if (i > 0) out += " ";
        out += static_cast<char>('A' + chosen[i]);
    }
    return out;
}

int total(const std::vector<int> &amounts, const std::vector<int> &chosen) {
    int sum = 0;
    for (int i : chosen) sum += amounts[i];
    return sum;
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

std::string show(const std::vector<int> &values) {
    std::string out = "[";
    for (size_t i = 0; i < values.size(); i++) {
        if (i > 0) out += ", ";
        out += std::to_string(values[i]);
    }
    return out + "]";
}

int main() {
    Grid strictTable, tookStrict, tiesTable, tookTies;
    fill(WEIGHT, VALUE, CAPACITY, false, strictTable, tookStrict);
    fill(WEIGHT, VALUE, CAPACITY, true, tiesTable, tookTies);

    std::cout << std::left << std::setw(6) << "item" << std::right << std::setw(8) << "weight"
              << std::setw(8) << "value" << "\\n";
    for (size_t i = 0; i < WEIGHT.size(); i++) {
        std::cout << std::left << std::setw(6) << std::string(1, static_cast<char>('A' + i))
                  << std::right << std::setw(8) << WEIGHT[i] << std::setw(8) << VALUE[i] << "\\n";
    }
    std::cout << "capacity " << CAPACITY << ", best value " << strictTable[WEIGHT.size()][CAPACITY] << "\\n\\n";

    std::array<std::string, 3> labels = {
        "read back off the table", "pointers, ties go to leaving it", "pointers, ties go to taking it",
    };
    std::cout << std::left << std::setw(34) << "method" << std::setw(14) << "items"
              << std::right << std::setw(8) << "weight" << std::setw(8) << "value" << "\\n";
    std::vector<std::vector<int>> picks = {
        byTraceback(WEIGHT, strictTable, CAPACITY),
        byPointers(WEIGHT, tookStrict, CAPACITY),
        byPointers(WEIGHT, tookTies, CAPACITY),
    };
    for (int k = 0; k < 3; k++) {
        std::cout << std::left << std::setw(34) << labels[k] << std::setw(14) << names(picks[k])
                  << std::right << std::setw(8) << total(WEIGHT, picks[k])
                  << std::setw(8) << total(VALUE, picks[k]) << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 5000;
    std::array<int, 3> optimal{}, agrees{};
    bool haveBad = false;
    std::vector<int> badWeights, badValues, badA, badB;
    int badCap = 0, badBest = 0;
    for (int t = 0; t < TRIALS; t++) {
        int n = 3 + rnd(5);
        std::vector<int> weights(n), values(n);
        for (int i = 0; i < n; i++) weights[i] = 1 + rnd(6);
        // Deliberately coarse values, so ties between different packings are
        // common rather than rare.
        for (int i = 0; i < n; i++) values[i] = 10 * (1 + rnd(3));
        int cap = 4 + rnd(10);
        Grid tbl, ps, tbl2, pt;
        fill(weights, values, cap, false, tbl, ps);
        fill(weights, values, cap, true, tbl2, pt);
        int best = tbl[n][cap];
        std::vector<std::vector<int>> got = {
            byTraceback(weights, tbl, cap),
            byPointers(weights, ps, cap),
            byPointers(weights, pt, cap),
        };
        for (int k = 0; k < 3; k++) {
            if (total(weights, got[k]) <= cap && total(values, got[k]) == best) optimal[k]++;
            if (got[k] == got[0]) agrees[k]++;
        }
        if (got[2] != got[0] && !haveBad) {
            haveBad = true;
            badWeights = weights;
            badValues = values;
            badCap = cap;
            badBest = best;
            badA = got[0];
            badB = got[2];
        }
    }

    std::cout << "over " << TRIALS << " random knapsacks:\\n";
    std::cout << std::left << std::setw(34) << "method" << std::right << std::setw(18)
              << "legal and optimal" << std::setw(26) << "same items as traceback" << "\\n";
    for (int k = 0; k < 3; k++) {
        std::cout << std::left << std::setw(34) << labels[k] << std::right << std::setw(18)
                  << optimal[k] << std::setw(26) << agrees[k] << "\\n";
    }
    std::cout << "\\n";

    std::cout << "the first instance where the tie rule changes the packing:\\n";
    std::cout << "  weights  " << show(badWeights) << "\\n";
    std::cout << "  values   " << show(badValues) << "\\n";
    std::cout << "  capacity " << badCap << ", best value " << badBest << "\\n";
    std::cout << "  ties go to leaving it: " << std::left << std::setw(12) << names(badA)
              << " weight " << total(badWeights, badA) << ", value " << total(badValues, badA) << "\\n";
    std::cout << "  ties go to taking it:  " << std::left << std::setw(12) << names(badB)
              << " weight " << total(badWeights, badB) << ", value " << total(badValues, badB) << "\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// The table holds the value. Getting the answer back out of it is a separate
// step, and there are two ways to do it: re-derive each choice from the numbers,
// or write the choice down while you make it.
//
// They agree exactly as long as they use the same rule for a tie -- and a tie is
// not a rare event, it is the normal case whenever two packings are worth the
// same.

type Grid = Vec<Vec<i32>>;

/// The ordinary table, plus a second table recording each decision.
///
/// \`prefer_taking\` changes one comparison: whether a tie counts as a reason to
/// take the item. It cannot change the value in any cell, only which of two
/// equally good packings the pointers describe.
fn fill(weights: &[i32], values: &[i32], capacity: i32, prefer_taking: bool) -> (Grid, Grid) {
    let n = weights.len();
    let cap_n = capacity as usize;
    let mut table = vec![vec![0i32; cap_n + 1]; n + 1];
    let mut took = vec![vec![0i32; cap_n + 1]; n + 1];
    for i in 1..=n {
        for cap in 0..=cap_n {
            let mut best = table[i - 1][cap];
            let mut take = 0;
            if weights[i - 1] <= cap as i32 {
                let candidate = values[i - 1] + table[i - 1][cap - weights[i - 1] as usize];
                if candidate > best || (prefer_taking && candidate == best) {
                    best = candidate;
                    take = 1;
                }
            }
            table[i][cap] = best;
            took[i][cap] = take;
        }
    }
    (table, took)
}

/// No extra memory: an item was taken exactly when the row changed value.
fn by_traceback(weights: &[i32], table: &Grid, capacity: i32) -> Vec<usize> {
    let mut chosen = Vec::new();
    let mut cap = capacity as usize;
    for i in (1..=weights.len()).rev() {
        if table[i][cap] != table[i - 1][cap] {
            chosen.push(i - 1);
            cap -= weights[i - 1] as usize;
        }
    }
    chosen.reverse();
    chosen
}

/// A second table, written during the fill, read straight back.
fn by_pointers(weights: &[i32], took: &Grid, capacity: i32) -> Vec<usize> {
    let mut chosen = Vec::new();
    let mut cap = capacity as usize;
    for i in (1..=weights.len()).rev() {
        if took[i][cap] != 0 {
            chosen.push(i - 1);
            cap -= weights[i - 1] as usize;
        }
    }
    chosen.reverse();
    chosen
}

fn names(chosen: &[usize]) -> String {
    if chosen.is_empty() {
        return String::from("(none)");
    }
    chosen.iter().map(|&i| ((b'A' + i as u8) as char).to_string()).collect::<Vec<_>>().join(" ")
}

fn total(amounts: &[i32], chosen: &[usize]) -> i32 {
    chosen.iter().map(|&i| amounts[i]).sum()
}

fn rand(seed: &mut i64, n: i64) -> i32 {
    *seed = (*seed * 1103515245 + 12345) % 2147483648;
    (*seed / 65536 % n) as i32
}

fn show(values: &[i32]) -> String {
    format!("[{}]", values.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(", "))
}

fn main() {
    let weight = vec![3, 4, 5, 2, 6, 4];
    let value = vec![40, 50, 60, 20, 70, 50];
    let capacity = 12;

    let (strict_table, took_strict) = fill(&weight, &value, capacity, false);
    let (_, took_ties) = fill(&weight, &value, capacity, true);

    println!("{:<6}{:>8}{:>8}", "item", "weight", "value");
    for i in 0..weight.len() {
        println!("{:<6}{:>8}{:>8}", (b'A' + i as u8) as char, weight[i], value[i]);
    }
    println!("capacity {}, best value {}", capacity, strict_table[weight.len()][capacity as usize]);
    println!();

    let labels = [
        "read back off the table", "pointers, ties go to leaving it", "pointers, ties go to taking it",
    ];
    println!("{:<34}{:<14}{:>8}{:>8}", "method", "items", "weight", "value");
    let picks = vec![
        by_traceback(&weight, &strict_table, capacity),
        by_pointers(&weight, &took_strict, capacity),
        by_pointers(&weight, &took_ties, capacity),
    ];
    for k in 0..3 {
        println!("{:<34}{:<14}{:>8}{:>8}", labels[k], names(&picks[k]),
            total(&weight, &picks[k]), total(&value, &picks[k]));
    }
    println!();

    const TRIALS: i32 = 5000;
    let mut seed = 1i64;
    let mut optimal = [0i32; 3];
    let mut agrees = [0i32; 3];
    let mut bad: Option<(Vec<i32>, Vec<i32>, i32, i32, Vec<usize>, Vec<usize>)> = None;
    for _ in 0..TRIALS {
        let n = 3 + rand(&mut seed, 5);
        let weights: Vec<i32> = (0..n).map(|_| 1 + rand(&mut seed, 6)).collect();
        // Deliberately coarse values, so ties between different packings are
        // common rather than rare.
        let values: Vec<i32> = (0..n).map(|_| 10 * (1 + rand(&mut seed, 3))).collect();
        let cap = 4 + rand(&mut seed, 10);
        let (tbl, ps) = fill(&weights, &values, cap, false);
        let (_, pt) = fill(&weights, &values, cap, true);
        let best = tbl[n as usize][cap as usize];
        let got = vec![
            by_traceback(&weights, &tbl, cap),
            by_pointers(&weights, &ps, cap),
            by_pointers(&weights, &pt, cap),
        ];
        for k in 0..3 {
            if total(&weights, &got[k]) <= cap && total(&values, &got[k]) == best {
                optimal[k] += 1;
            }
            if got[k] == got[0] {
                agrees[k] += 1;
            }
        }
        if got[2] != got[0] && bad.is_none() {
            bad = Some((weights, values, cap, best, got[0].clone(), got[2].clone()));
        }
    }

    println!("over {} random knapsacks:", TRIALS);
    println!("{:<34}{:>18}{:>26}", "method", "legal and optimal", "same items as traceback");
    for k in 0..3 {
        println!("{:<34}{:>18}{:>26}", labels[k], optimal[k], agrees[k]);
    }
    println!();

    let (bw, bv, bcap, bbest, ba, bb) = bad.unwrap();
    println!("the first instance where the tie rule changes the packing:");
    println!("  weights  {}", show(&bw));
    println!("  values   {}", show(&bv));
    println!("  capacity {}, best value {}", bcap, bbest);
    println!("  ties go to leaving it: {:<12} weight {}, value {}", names(&ba), total(&bw, &ba), total(&bv, &ba));
    println!("  ties go to taking it:  {:<12} weight {}, value {}", names(&bb), total(&bw, &bb), total(&bv, &bb));
}
`,
            },
            {
              lang: "go",
              code: `// The table holds the value. Getting the answer back out of it is a separate
// step, and there are two ways to do it: re-derive each choice from the numbers,
// or write the choice down while you make it.
//
// They agree exactly as long as they use the same rule for a tie -- and a tie is
// not a rare event, it is the normal case whenever two packings are worth the
// same.
package main

import (
	"fmt"
	"strconv"
	"strings"
)

var WEIGHT = []int{3, 4, 5, 2, 6, 4}
var VALUE = []int{40, 50, 60, 20, 70, 50}

const CAPACITY = 12

// The ordinary table, plus a second table recording each decision.
//
// \`preferTaking\` changes one comparison: whether a tie counts as a reason to
// take the item. It cannot change the value in any cell, only which of two
// equally good packings the pointers describe.
func fill(weights, values []int, capacity int, preferTaking bool) ([][]int, [][]int) {
	n := len(weights)
	table := make([][]int, n+1)
	took := make([][]int, n+1)
	for i := range table {
		table[i] = make([]int, capacity+1)
		took[i] = make([]int, capacity+1)
	}
	for i := 1; i <= n; i++ {
		for cap := 0; cap <= capacity; cap++ {
			best := table[i-1][cap]
			take := 0
			if weights[i-1] <= cap {
				candidate := values[i-1] + table[i-1][cap-weights[i-1]]
				if candidate > best || (preferTaking && candidate == best) {
					best = candidate
					take = 1
				}
			}
			table[i][cap] = best
			took[i][cap] = take
		}
	}
	return table, took
}

// No extra memory: an item was taken exactly when the row changed value.
func byTraceback(weights []int, table [][]int, capacity int) []int {
	var chosen []int
	cap := capacity
	for i := len(weights); i > 0; i-- {
		if table[i][cap] != table[i-1][cap] {
			chosen = append(chosen, i-1)
			cap -= weights[i-1]
		}
	}
	for a, b := 0, len(chosen)-1; a < b; a, b = a+1, b-1 {
		chosen[a], chosen[b] = chosen[b], chosen[a]
	}
	return chosen
}

// A second table, written during the fill, read straight back.
func byPointers(weights []int, took [][]int, capacity int) []int {
	var chosen []int
	cap := capacity
	for i := len(weights); i > 0; i-- {
		if took[i][cap] != 0 {
			chosen = append(chosen, i-1)
			cap -= weights[i-1]
		}
	}
	for a, b := 0, len(chosen)-1; a < b; a, b = a+1, b-1 {
		chosen[a], chosen[b] = chosen[b], chosen[a]
	}
	return chosen
}

func names(chosen []int) string {
	if len(chosen) == 0 {
		return "(none)"
	}
	parts := make([]string, len(chosen))
	for i, v := range chosen {
		parts[i] = string(rune('A' + v))
	}
	return strings.Join(parts, " ")
}

func total(amounts []int, chosen []int) int {
	sum := 0
	for _, i := range chosen {
		sum += amounts[i]
	}
	return sum
}

func same(a, b []int) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func show(values []int) string {
	parts := make([]string, len(values))
	for i, v := range values {
		parts[i] = strconv.Itoa(v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func main() {
	strictTable, tookStrict := fill(WEIGHT, VALUE, CAPACITY, false)
	_, tookTies := fill(WEIGHT, VALUE, CAPACITY, true)

	fmt.Printf("%-6s%8s%8s\\n", "item", "weight", "value")
	for i := range WEIGHT {
		fmt.Printf("%-6s%8d%8d\\n", string(rune('A'+i)), WEIGHT[i], VALUE[i])
	}
	fmt.Printf("capacity %d, best value %d\\n", CAPACITY, strictTable[len(WEIGHT)][CAPACITY])
	fmt.Println()

	labels := []string{
		"read back off the table", "pointers, ties go to leaving it", "pointers, ties go to taking it",
	}
	fmt.Printf("%-34s%-14s%8s%8s\\n", "method", "items", "weight", "value")
	picks := [][]int{
		byTraceback(WEIGHT, strictTable, CAPACITY),
		byPointers(WEIGHT, tookStrict, CAPACITY),
		byPointers(WEIGHT, tookTies, CAPACITY),
	}
	for k := 0; k < 3; k++ {
		fmt.Printf("%-34s%-14s%8d%8d\\n", labels[k], names(picks[k]), total(WEIGHT, picks[k]), total(VALUE, picks[k]))
	}
	fmt.Println()

	const TRIALS = 5000
	optimal := [3]int{}
	agrees := [3]int{}
	var badWeights, badValues, badA, badB []int
	badCap, badBest := 0, 0
	for t := 0; t < TRIALS; t++ {
		n := 3 + rand(5)
		weights := make([]int, n)
		values := make([]int, n)
		for i := 0; i < n; i++ {
			weights[i] = 1 + rand(6)
		}
		// Deliberately coarse values, so ties between different packings are
		// common rather than rare.
		for i := 0; i < n; i++ {
			values[i] = 10 * (1 + rand(3))
		}
		cap := 4 + rand(10)
		tbl, ps := fill(weights, values, cap, false)
		_, pt := fill(weights, values, cap, true)
		best := tbl[n][cap]
		got := [][]int{
			byTraceback(weights, tbl, cap),
			byPointers(weights, ps, cap),
			byPointers(weights, pt, cap),
		}
		for k := 0; k < 3; k++ {
			if total(weights, got[k]) <= cap && total(values, got[k]) == best {
				optimal[k]++
			}
			if same(got[k], got[0]) {
				agrees[k]++
			}
		}
		if !same(got[2], got[0]) && badWeights == nil {
			badWeights, badValues, badCap, badBest, badA, badB = weights, values, cap, best, got[0], got[2]
		}
	}

	fmt.Printf("over %d random knapsacks:\\n", TRIALS)
	fmt.Printf("%-34s%18s%26s\\n", "method", "legal and optimal", "same items as traceback")
	for k := 0; k < 3; k++ {
		fmt.Printf("%-34s%18d%26d\\n", labels[k], optimal[k], agrees[k])
	}
	fmt.Println()

	fmt.Println("the first instance where the tie rule changes the packing:")
	fmt.Printf("  weights  %s\\n", show(badWeights))
	fmt.Printf("  values   %s\\n", show(badValues))
	fmt.Printf("  capacity %d, best value %d\\n", badCap, badBest)
	fmt.Printf("  ties go to leaving it: %-12s weight %d, value %d\\n", names(badA), total(badWeights, badA), total(badValues, badA))
	fmt.Printf("  ties go to taking it:  %-12s weight %d, value %d\\n", names(badB), total(badWeights, badB), total(badValues, badB))
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "dp-knapsack-traceback",
        kind: "dp",
        algorithm: "knapsack",
        title: "The cells a traceback walks back through",
        lockAlgorithm: true,
      },
      pitfalls: [
        {
          title: "A drifting tie rule is invisible to value-based tests",
          body: "If the traceback compares differently from the fill, every value it reports is still right and the solution it returns is still optimal -- it is simply a different one. Nothing short of comparing the returned solution against an expected one will catch it, which is why a problem that specifies a tie-break needs the rule fixed in the fill and mirrored in the extraction.",
        },
        {
          title: "Parent pointers are not the cheap option",
          body: "They cost a table the same shape as the original, so they are no help at all when memory is the reason you are here. What they buy is that the decision is recorded rather than re-derived, which matters when the values are floating point or the comparison is not a simple `>` -- re-deriving a choice by testing equality on floats is a bug waiting for the right input.",
        },
      ],
    },
    {
      id: "the-path-in-linear-space",
      heading: "The path, without the table",
      body: [
        "Lesson 6 ended on a conflict: the space optimisation overwrites exactly the cells the traceback wants to read. That is true of the obvious traceback. It is not a law about the problem.",
        "Hirschberg's observation is that the optimal path has to cross the middle row of the table somewhere, and finding *where* needs only the row itself. Run the rolling version forwards on the top half of the first string, run it backwards on the bottom half against the reversed second string, add the two rows together, and the column where the sum is largest is where the answer crosses. Then recurse on the two halves.",
        "A hundred and fifty times less memory, and the path comes back. The cost is in the last column: about twice the cell-writes, which is the geometric series \u2014 the top level does the whole table's work, the two halves together do half of it, their four children a quarter, and 1 + 1/2 + 1/4 + ... converges to 2.",
        "The honesty is in the two lines underneath. Hirschberg returns *a* longest common subsequence \u2014 verified as a genuine one on all six hundred short pairs \u2014 but character for character the same one as the table's traceback only 435 times. That is section 1's tie rule again, arriving from a different direction: the two algorithms break ties differently, so they land on different members of the same optimal set.",
        "This generalises past this one algorithm. Divide and conquer over a dynamic programming table is the standard way to get a path in linear space, and the shape is always the same: find where the optimum crosses the middle using only rolling rows, then solve two smaller problems. What it costs is a constant factor of time; what it buys is the difference between a program that runs and one that cannot allocate.",
      ],
      examples: [
        {
          id: "hirschberg",
          title: "Longest common subsequence recovered in two rows of memory",
          lang: "python",
          code: `# Lesson 6 said the space optimisation and the traceback are in conflict, because
# the traceback reads cells the rolling array has already overwritten. That is
# true of the obvious traceback. It is not a law.
#
# Hirschberg's trick: split the first string in half, use two rolling rows to
# find where the answer crosses the second string, and recurse on both halves.
# Linear space, and the path comes back.

writes = [0, 0]


def full_table(a, b):
    """The whole table, kept, so that the path can be walked out of it."""
    rows = len(a) + 1
    cols = len(b) + 1
    table = [[0] * cols for _ in range(rows)]
    for i in range(1, rows):
        for j in range(1, cols):
            writes[0] += 1
            if a[i - 1] == b[j - 1]:
                table[i][j] = table[i - 1][j - 1] + 1
            else:
                table[i][j] = max(table[i - 1][j], table[i][j - 1])
    out = []
    i, j = len(a), len(b)
    while i > 0 and j > 0:
        if a[i - 1] == b[j - 1]:
            out.append(a[i - 1])
            i -= 1
            j -= 1
        elif table[i - 1][j] >= table[i][j - 1]:
            i -= 1
        else:
            j -= 1
    out.reverse()
    return "".join(out), rows * cols


def last_row(a, b):
    """The final row of the LCS table for a against b, in two rows of memory."""
    cols = len(b) + 1
    previous = [0] * cols
    current = [0] * cols
    for i in range(1, len(a) + 1):
        for j in range(1, cols):
            writes[1] += 1
            if a[i - 1] == b[j - 1]:
                current[j] = previous[j - 1] + 1
            else:
                current[j] = max(previous[j], current[j - 1])
        for j in range(cols):
            previous[j] = current[j]
            current[j] = 0
    return previous


def hirschberg(a, b):
    """The subsequence itself, never holding more than a couple of rows."""
    if len(a) == 0 or len(b) == 0:
        return ""
    if len(a) == 1:
        return a if a in b else ""
    mid = len(a) // 2
    left = last_row(a[:mid], b)
    right = last_row(a[mid:][::-1], b[::-1])
    # Where the two halves meet: the split of b that maximises the total.
    best_j = 0
    best = -1
    for j in range(len(b) + 1):
        total = left[j] + right[len(b) - j]
        if total > best:
            best = total
            best_j = j
    return hirschberg(a[:mid], b[:best_j]) + hirschberg(a[mid:], b[best_j:])


seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


A = "".join(chr(97 + rand(4)) for _ in range(300))
B = "".join(chr(97 + rand(4)) for _ in range(400))


def is_subsequence(small, big):
    j = 0
    for ch in big:
        if j < len(small) and small[j] == ch:
            j += 1
    return j == len(small)


table_answer, table_cells = full_table(A, B)
hirsch_answer = hirschberg(A, B)

print(f"longest common subsequence of a {len(A)}-character and a {len(B)}-character string")
print()
print(f"{'method':<28}{'length':>8}{'cells held':>12}{'cells written':>15}")
print(f"{'the whole table':<28}{len(table_answer):>8}{table_cells:>12}{writes[0]:>15}")
print(f"{'Hirschberg, two rows':<28}{len(hirsch_answer):>8}{2 * (len(B) + 1):>12}{writes[1]:>15}")
print()
print(f"the two answers are the same string: {'yes' if table_answer == hirsch_answer else 'no'}")
print(f"it is a subsequence of the first:    {'yes' if is_subsequence(hirsch_answer, A) else 'no'}")
print(f"it is a subsequence of the second:   {'yes' if is_subsequence(hirsch_answer, B) else 'no'}")
print(f"memory: {table_cells // (2 * (len(B) + 1))}x less")
print(f"work:   {writes[1] * 100 // writes[0]}% of the cells, so about twice over")
print()
print(f"the first sixty characters of it:")
print("  " + hirsch_answer[:60])
print()

# One long instance is one data point. Check the two agree on short ones too,
# where a brute force can also be consulted.
TRIALS = 600
same = 0
valid = 0
for _ in range(TRIALS):
    a = "".join(chr(65 + rand(3)) for _ in range(1 + rand(9)))
    b = "".join(chr(65 + rand(3)) for _ in range(1 + rand(9)))
    x = full_table(a, b)[0]
    y = hirschberg(a, b)
    if x == y:
        same += 1
    if len(x) == len(y) and is_subsequence(y, a) and is_subsequence(y, b):
        valid += 1

print(f"on {TRIALS} short random pairs:")
print(f"  Hirschberg returns a genuine longest common subsequence  {valid}")
print(f"  and it is character for character the table's answer     {same}")
`,
          output: `longest common subsequence of a 300-character and a 400-character string

method                        length  cells held  cells written
the whole table                  220      120701         120000
Hirschberg, two rows             220         802         239311

the two answers are the same string: no
it is a subsequence of the first:    yes
it is a subsequence of the second:   yes
memory: 150x less
work:   199% of the cells, so about twice over

the first sixty characters of it:
  ccbdddcdacbaadbdbccdddccaabcccbbbdcbdccbaadcccbbddddabbccaca

on 600 short random pairs:
  Hirschberg returns a genuine longest common subsequence  600
  and it is character for character the table's answer     435`,
          explanation:
            "The two methods are run on the same pair and compared directly, with the cell-writes counted so the extra work is visible rather than asserted. The result is then checked for being a subsequence of both inputs, and the whole thing is re-run against the full table on six hundred short pairs.",
          alternates: [
            {
              lang: "javascript",
              code: `// Lesson 6 said the space optimisation and the traceback are in conflict, because
// the traceback reads cells the rolling array has already overwritten. That is
// true of the obvious traceback. It is not a law.
//
// Hirschberg's trick: split the first string in half, use two rolling rows to
// find where the answer crosses the second string, and recurse on both halves.
// Linear space, and the path comes back.

const writes = [0, 0];

/** The whole table, kept, so that the path can be walked out of it. */
function fullTable(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      writes[0]++;
      if (a[i - 1] === b[j - 1]) {
        table[i][j] = table[i - 1][j - 1] + 1;
      } else {
        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
      }
    }
  }
  const out = [];
  let i = a.length;
  let j = b.length;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      out.push(a[i - 1]);
      i--;
      j--;
    } else if (table[i - 1][j] >= table[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  out.reverse();
  return [out.join(""), rows * cols];
}

/** The final row of the LCS table for a against b, in two rows of memory. */
function lastRow(a, b) {
  const cols = b.length + 1;
  const previous = new Array(cols).fill(0);
  const current = new Array(cols).fill(0);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j < cols; j++) {
      writes[1]++;
      if (a[i - 1] === b[j - 1]) {
        current[j] = previous[j - 1] + 1;
      } else {
        current[j] = Math.max(previous[j], current[j - 1]);
      }
    }
    for (let j = 0; j < cols; j++) {
      previous[j] = current[j];
      current[j] = 0;
    }
  }
  return previous;
}

const reversed = (text) => text.split("").reverse().join("");

/** The subsequence itself, never holding more than a couple of rows. */
function hirschberg(a, b) {
  if (a.length === 0 || b.length === 0) return "";
  if (a.length === 1) return b.includes(a) ? a : "";
  const mid = Math.floor(a.length / 2);
  const left = lastRow(a.slice(0, mid), b);
  const right = lastRow(reversed(a.slice(mid)), reversed(b));
  // Where the two halves meet: the split of b that maximises the total.
  let bestJ = 0;
  let best = -1;
  for (let j = 0; j <= b.length; j++) {
    const total = left[j] + right[b.length - j];
    if (total > best) {
      best = total;
      bestJ = j;
    }
  }
  return hirschberg(a.slice(0, mid), b.slice(0, bestJ)) + hirschberg(a.slice(mid), b.slice(bestJ));
}

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function isSubsequence(small, big) {
  let j = 0;
  for (const ch of big) if (j < small.length && small[j] === ch) j++;
  return j === small.length;
}

const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);

let A = "";
for (let i = 0; i < 300; i++) A += String.fromCharCode(97 + rand(4));
let B = "";
for (let i = 0; i < 400; i++) B += String.fromCharCode(97 + rand(4));

const [tableAnswer, tableCells] = fullTable(A, B);
const hirschAnswer = hirschberg(A, B);

console.log(\`longest common subsequence of a \${A.length}-character and a \${B.length}-character string\`);
console.log();
console.log(padEnd("method", 28) + pad("length", 8) + pad("cells held", 12) + pad("cells written", 15));
console.log(padEnd("the whole table", 28) + pad(tableAnswer.length, 8) + pad(tableCells, 12) + pad(writes[0], 15));
console.log(
  padEnd("Hirschberg, two rows", 28) + pad(hirschAnswer.length, 8) + pad(2 * (B.length + 1), 12) +
    pad(writes[1], 15)
);
console.log();
console.log(\`the two answers are the same string: \${tableAnswer === hirschAnswer ? "yes" : "no"}\`);
console.log(\`it is a subsequence of the first:    \${isSubsequence(hirschAnswer, A) ? "yes" : "no"}\`);
console.log(\`it is a subsequence of the second:   \${isSubsequence(hirschAnswer, B) ? "yes" : "no"}\`);
console.log(\`memory: \${Math.floor(tableCells / (2 * (B.length + 1)))}x less\`);
console.log(\`work:   \${Math.floor((writes[1] * 100) / writes[0])}% of the cells, so about twice over\`);
console.log();
console.log("the first sixty characters of it:");
console.log("  " + hirschAnswer.slice(0, 60));
console.log();

// One long instance is one data point. Check the two agree on short ones too,
// where a brute force can also be consulted.
const TRIALS = 600;
let same = 0;
let valid = 0;
for (let t = 0; t < TRIALS; t++) {
  let p = "";
  const na = 1 + rand(9);
  for (let i = 0; i < na; i++) p += String.fromCharCode(65 + rand(3));
  let q = "";
  const nb = 1 + rand(9);
  for (let i = 0; i < nb; i++) q += String.fromCharCode(65 + rand(3));
  const fromTable = fullTable(p, q)[0];
  const fromHirsch = hirschberg(p, q);
  if (fromTable === fromHirsch) same++;
  if (fromTable.length === fromHirsch.length && isSubsequence(fromHirsch, p) && isSubsequence(fromHirsch, q)) {
    valid++;
  }
}

console.log(\`on \${TRIALS} short random pairs:\`);
console.log(\`  Hirschberg returns a genuine longest common subsequence  \${valid}\`);
console.log(\`  and it is character for character the table's answer     \${same}\`);
`,
            },
            {
              lang: "typescript",
              code: `// Lesson 6 said the space optimisation and the traceback are in conflict, because
// the traceback reads cells the rolling array has already overwritten. That is
// true of the obvious traceback. It is not a law.
//
// Hirschberg's trick: split the first string in half, use two rolling rows to
// find where the answer crosses the second string, and recurse on both halves.
// Linear space, and the path comes back.

const writes = [0, 0];

/** The whole table, kept, so that the path can be walked out of it. */
function fullTable(a: string, b: string): [string, number] {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      writes[0]++;
      if (a[i - 1] === b[j - 1]) {
        table[i][j] = table[i - 1][j - 1] + 1;
      } else {
        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
      }
    }
  }
  const out: string[] = [];
  let i = a.length;
  let j = b.length;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      out.push(a[i - 1]);
      i--;
      j--;
    } else if (table[i - 1][j] >= table[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  out.reverse();
  return [out.join(""), rows * cols];
}

/** The final row of the LCS table for a against b, in two rows of memory. */
function lastRow(a: string, b: string): number[] {
  const cols = b.length + 1;
  const previous = new Array(cols).fill(0);
  const current = new Array(cols).fill(0);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j < cols; j++) {
      writes[1]++;
      if (a[i - 1] === b[j - 1]) {
        current[j] = previous[j - 1] + 1;
      } else {
        current[j] = Math.max(previous[j], current[j - 1]);
      }
    }
    for (let j = 0; j < cols; j++) {
      previous[j] = current[j];
      current[j] = 0;
    }
  }
  return previous;
}

const reversed = (text: string): string => text.split("").reverse().join("");

/** The subsequence itself, never holding more than a couple of rows. */
function hirschberg(a: string, b: string): string {
  if (a.length === 0 || b.length === 0) return "";
  if (a.length === 1) return b.includes(a) ? a : "";
  const mid = Math.floor(a.length / 2);
  const left = lastRow(a.slice(0, mid), b);
  const right = lastRow(reversed(a.slice(mid)), reversed(b));
  // Where the two halves meet: the split of b that maximises the total.
  let bestJ = 0;
  let best = -1;
  for (let j = 0; j <= b.length; j++) {
    const total = left[j] + right[b.length - j];
    if (total > best) {
      best = total;
      bestJ = j;
    }
  }
  return hirschberg(a.slice(0, mid), b.slice(0, bestJ)) + hirschberg(a.slice(mid), b.slice(bestJ));
}

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function isSubsequence(small: string, big: string): boolean {
  let j = 0;
  for (const ch of big) if (j < small.length && small[j] === ch) j++;
  return j === small.length;
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

let A = "";
for (let i = 0; i < 300; i++) A += String.fromCharCode(97 + rand(4));
let B = "";
for (let i = 0; i < 400; i++) B += String.fromCharCode(97 + rand(4));

const [tableAnswer, tableCells] = fullTable(A, B);
const hirschAnswer = hirschberg(A, B);

console.log(\`longest common subsequence of a \${A.length}-character and a \${B.length}-character string\`);
console.log();
console.log(padEnd("method", 28) + pad("length", 8) + pad("cells held", 12) + pad("cells written", 15));
console.log(padEnd("the whole table", 28) + pad(tableAnswer.length, 8) + pad(tableCells, 12) + pad(writes[0], 15));
console.log(
  padEnd("Hirschberg, two rows", 28) + pad(hirschAnswer.length, 8) + pad(2 * (B.length + 1), 12) +
    pad(writes[1], 15)
);
console.log();
console.log(\`the two answers are the same string: \${tableAnswer === hirschAnswer ? "yes" : "no"}\`);
console.log(\`it is a subsequence of the first:    \${isSubsequence(hirschAnswer, A) ? "yes" : "no"}\`);
console.log(\`it is a subsequence of the second:   \${isSubsequence(hirschAnswer, B) ? "yes" : "no"}\`);
console.log(\`memory: \${Math.floor(tableCells / (2 * (B.length + 1)))}x less\`);
console.log(\`work:   \${Math.floor((writes[1] * 100) / writes[0])}% of the cells, so about twice over\`);
console.log();
console.log("the first sixty characters of it:");
console.log("  " + hirschAnswer.slice(0, 60));
console.log();

// One long instance is one data point. Check the two agree on short ones too,
// where a brute force can also be consulted.
const TRIALS = 600;
let same = 0;
let valid = 0;
for (let t = 0; t < TRIALS; t++) {
  let p = "";
  const na = 1 + rand(9);
  for (let i = 0; i < na; i++) p += String.fromCharCode(65 + rand(3));
  let q = "";
  const nb = 1 + rand(9);
  for (let i = 0; i < nb; i++) q += String.fromCharCode(65 + rand(3));
  const fromTable = fullTable(p, q)[0];
  const fromHirsch = hirschberg(p, q);
  if (fromTable === fromHirsch) same++;
  if (fromTable.length === fromHirsch.length && isSubsequence(fromHirsch, p) && isSubsequence(fromHirsch, q)) {
    valid++;
  }
}

console.log(\`on \${TRIALS} short random pairs:\`);
console.log(\`  Hirschberg returns a genuine longest common subsequence  \${valid}\`);
console.log(\`  and it is character for character the table's answer     \${same}\`);
`,
            },
            {
              lang: "java",
              code: `// Lesson 6 said the space optimisation and the traceback are in conflict, because
// the traceback reads cells the rolling array has already overwritten. That is
// true of the obvious traceback. It is not a law.
//
// Hirschberg's trick: split the first string in half, use two rolling rows to
// find where the answer crosses the second string, and recurse on both halves.
// Linear space, and the path comes back.
public class Main {
    static long[] writes = new long[2];

    /** The whole table, kept, so that the path can be walked out of it. */
    static Object[] fullTable(String a, String b) {
        int rows = a.length() + 1;
        int cols = b.length() + 1;
        int[][] table = new int[rows][cols];
        for (int i = 1; i < rows; i++) {
            for (int j = 1; j < cols; j++) {
                writes[0]++;
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    table[i][j] = table[i - 1][j - 1] + 1;
                } else {
                    table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
                }
            }
        }
        StringBuilder out = new StringBuilder();
        int i = a.length();
        int j = b.length();
        while (i > 0 && j > 0) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) {
                out.append(a.charAt(i - 1));
                i--;
                j--;
            } else if (table[i - 1][j] >= table[i][j - 1]) {
                i--;
            } else {
                j--;
            }
        }
        return new Object[] { out.reverse().toString(), rows * cols };
    }

    /** The final row of the LCS table for a against b, in two rows of memory. */
    static int[] lastRow(String a, String b) {
        int cols = b.length() + 1;
        int[] previous = new int[cols];
        int[] current = new int[cols];
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j < cols; j++) {
                writes[1]++;
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    current[j] = previous[j - 1] + 1;
                } else {
                    current[j] = Math.max(previous[j], current[j - 1]);
                }
            }
            for (int j = 0; j < cols; j++) {
                previous[j] = current[j];
                current[j] = 0;
            }
        }
        return previous;
    }

    /** The subsequence itself, never holding more than a couple of rows. */
    static String hirschberg(String a, String b) {
        if (a.isEmpty() || b.isEmpty()) return "";
        if (a.length() == 1) return b.contains(a) ? a : "";
        int mid = a.length() / 2;
        int[] left = lastRow(a.substring(0, mid), b);
        int[] right = lastRow(reverse(a.substring(mid)), reverse(b));
        // Where the two halves meet: the split of b that maximises the total.
        int bestJ = 0;
        int best = -1;
        for (int j = 0; j <= b.length(); j++) {
            int totalHere = left[j] + right[b.length() - j];
            if (totalHere > best) {
                best = totalHere;
                bestJ = j;
            }
        }
        return hirschberg(a.substring(0, mid), b.substring(0, bestJ))
             + hirschberg(a.substring(mid), b.substring(bestJ));
    }

    static String reverse(String text) {
        return new StringBuilder(text).reverse().toString();
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    static boolean isSubsequence(String small, String big) {
        int j = 0;
        for (int i = 0; i < big.length(); i++) {
            if (j < small.length() && small.charAt(j) == big.charAt(i)) j++;
        }
        return j == small.length();
    }

    public static void main(String[] args) {
        StringBuilder sa = new StringBuilder();
        for (int i = 0; i < 300; i++) sa.append((char) (97 + rand(4)));
        String A = sa.toString();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 400; i++) sb.append((char) (97 + rand(4)));
        String B = sb.toString();

        Object[] result = fullTable(A, B);
        String tableAnswer = (String) result[0];
        int tableCells = (Integer) result[1];
        String hirschAnswer = hirschberg(A, B);

        System.out.printf("longest common subsequence of a %d-character and a %d-character string%n",
            A.length(), B.length());
        System.out.println();
        System.out.printf("%-28s%8s%12s%15s%n", "method", "length", "cells held", "cells written");
        System.out.printf("%-28s%8d%12d%15d%n", "the whole table", tableAnswer.length(), tableCells, writes[0]);
        System.out.printf("%-28s%8d%12d%15d%n", "Hirschberg, two rows", hirschAnswer.length(),
            2 * (B.length() + 1), writes[1]);
        System.out.println();
        System.out.printf("the two answers are the same string: %s%n",
            tableAnswer.equals(hirschAnswer) ? "yes" : "no");
        System.out.printf("it is a subsequence of the first:    %s%n",
            isSubsequence(hirschAnswer, A) ? "yes" : "no");
        System.out.printf("it is a subsequence of the second:   %s%n",
            isSubsequence(hirschAnswer, B) ? "yes" : "no");
        System.out.printf("memory: %dx less%n", tableCells / (2 * (B.length() + 1)));
        System.out.printf("work:   %d%% of the cells, so about twice over%n", writes[1] * 100 / writes[0]);
        System.out.println();
        System.out.println("the first sixty characters of it:");
        System.out.println("  " + hirschAnswer.substring(0, 60));
        System.out.println();

        // One long instance is one data point. Check the two agree on short ones
        // too, where a brute force can also be consulted.
        final int TRIALS = 600;
        int same = 0;
        int valid = 0;
        for (int t = 0; t < TRIALS; t++) {
            StringBuilder x = new StringBuilder();
            int na = 1 + rand(9);
            for (int i = 0; i < na; i++) x.append((char) (65 + rand(3)));
            StringBuilder y = new StringBuilder();
            int nb = 1 + rand(9);
            for (int i = 0; i < nb; i++) y.append((char) (65 + rand(3)));
            String p = x.toString();
            String q = y.toString();
            String fromTable = (String) fullTable(p, q)[0];
            String fromHirsch = hirschberg(p, q);
            if (fromTable.equals(fromHirsch)) same++;
            if (fromTable.length() == fromHirsch.length() && isSubsequence(fromHirsch, p)
                && isSubsequence(fromHirsch, q)) valid++;
        }

        System.out.printf("on %d short random pairs:%n", TRIALS);
        System.out.printf("  Hirschberg returns a genuine longest common subsequence  %d%n", valid);
        System.out.printf("  and it is character for character the table's answer     %d%n", same);
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Lesson 6 said the space optimisation and the traceback are in conflict, because
// the traceback reads cells the rolling array has already overwritten. That is
// true of the obvious traceback. It is not a law.
//
// Hirschberg's trick: split the first string in half, use two rolling rows to
// find where the answer crosses the second string, and recurse on both halves.
// Linear space, and the path comes back.
#include <algorithm>
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

static std::array<std::int64_t, 2> writes{};

// The whole table, kept, so that the path can be walked out of it.
std::string fullTable(const std::string &a, const std::string &b, int &cells) {
    int rows = static_cast<int>(a.size()) + 1;
    int cols = static_cast<int>(b.size()) + 1;
    std::vector<std::vector<int>> table(rows, std::vector<int>(cols, 0));
    for (int i = 1; i < rows; i++) {
        for (int j = 1; j < cols; j++) {
            writes[0]++;
            if (a[i - 1] == b[j - 1]) {
                table[i][j] = table[i - 1][j - 1] + 1;
            } else {
                table[i][j] = std::max(table[i - 1][j], table[i][j - 1]);
            }
        }
    }
    std::string out;
    int i = static_cast<int>(a.size());
    int j = static_cast<int>(b.size());
    while (i > 0 && j > 0) {
        if (a[i - 1] == b[j - 1]) {
            out += a[i - 1];
            i--;
            j--;
        } else if (table[i - 1][j] >= table[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }
    std::reverse(out.begin(), out.end());
    cells = rows * cols;
    return out;
}

// The final row of the LCS table for a against b, in two rows of memory.
std::vector<int> lastRow(const std::string &a, const std::string &b) {
    int cols = static_cast<int>(b.size()) + 1;
    std::vector<int> previous(cols, 0), current(cols, 0);
    for (size_t i = 1; i <= a.size(); i++) {
        for (int j = 1; j < cols; j++) {
            writes[1]++;
            if (a[i - 1] == b[j - 1]) {
                current[j] = previous[j - 1] + 1;
            } else {
                current[j] = std::max(previous[j], current[j - 1]);
            }
        }
        for (int j = 0; j < cols; j++) {
            previous[j] = current[j];
            current[j] = 0;
        }
    }
    return previous;
}

std::string reversed(const std::string &text) {
    std::string out = text;
    std::reverse(out.begin(), out.end());
    return out;
}

// The subsequence itself, never holding more than a couple of rows.
std::string hirschberg(const std::string &a, const std::string &b) {
    if (a.empty() || b.empty()) return "";
    if (a.size() == 1) return b.find(a) != std::string::npos ? a : "";
    size_t mid = a.size() / 2;
    std::vector<int> left = lastRow(a.substr(0, mid), b);
    std::vector<int> right = lastRow(reversed(a.substr(mid)), reversed(b));
    // Where the two halves meet: the split of b that maximises the total.
    size_t bestJ = 0;
    int best = -1;
    for (size_t j = 0; j <= b.size(); j++) {
        int total = left[j] + right[b.size() - j];
        if (total > best) {
            best = total;
            bestJ = j;
        }
    }
    return hirschberg(a.substr(0, mid), b.substr(0, bestJ))
         + hirschberg(a.substr(mid), b.substr(bestJ));
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

bool isSubsequence(const std::string &small, const std::string &big) {
    size_t j = 0;
    for (char ch : big) {
        if (j < small.size() && small[j] == ch) j++;
    }
    return j == small.size();
}

int main() {
    std::string A, B;
    for (int i = 0; i < 300; i++) A += static_cast<char>(97 + rnd(4));
    for (int i = 0; i < 400; i++) B += static_cast<char>(97 + rnd(4));

    int tableCells = 0;
    std::string tableAnswer = fullTable(A, B, tableCells);
    std::string hirschAnswer = hirschberg(A, B);

    std::cout << "longest common subsequence of a " << A.size() << "-character and a "
              << B.size() << "-character string\\n\\n";
    std::cout << std::left << std::setw(28) << "method" << std::right << std::setw(8) << "length"
              << std::setw(12) << "cells held" << std::setw(15) << "cells written" << "\\n";
    std::cout << std::left << std::setw(28) << "the whole table" << std::right << std::setw(8)
              << tableAnswer.size() << std::setw(12) << tableCells << std::setw(15) << writes[0] << "\\n";
    std::cout << std::left << std::setw(28) << "Hirschberg, two rows" << std::right << std::setw(8)
              << hirschAnswer.size() << std::setw(12) << 2 * (B.size() + 1) << std::setw(15)
              << writes[1] << "\\n\\n";
    std::cout << "the two answers are the same string: " << (tableAnswer == hirschAnswer ? "yes" : "no") << "\\n";
    std::cout << "it is a subsequence of the first:    " << (isSubsequence(hirschAnswer, A) ? "yes" : "no") << "\\n";
    std::cout << "it is a subsequence of the second:   " << (isSubsequence(hirschAnswer, B) ? "yes" : "no") << "\\n";
    std::cout << "memory: " << tableCells / (2 * (B.size() + 1)) << "x less\\n";
    std::cout << "work:   " << writes[1] * 100 / writes[0] << "% of the cells, so about twice over\\n\\n";
    std::cout << "the first sixty characters of it:\\n";
    std::cout << "  " << hirschAnswer.substr(0, 60) << "\\n\\n";

    // One long instance is one data point. Check the two agree on short ones
    // too, where a brute force can also be consulted.
    const int TRIALS = 600;
    int same = 0, valid = 0;
    for (int t = 0; t < TRIALS; t++) {
        std::string p, q;
        int na = 1 + rnd(9);
        for (int i = 0; i < na; i++) p += static_cast<char>(65 + rnd(3));
        int nb = 1 + rnd(9);
        for (int i = 0; i < nb; i++) q += static_cast<char>(65 + rnd(3));
        int ignored = 0;
        std::string fromTable = fullTable(p, q, ignored);
        std::string fromHirsch = hirschberg(p, q);
        if (fromTable == fromHirsch) same++;
        if (fromTable.size() == fromHirsch.size() && isSubsequence(fromHirsch, p)
            && isSubsequence(fromHirsch, q)) valid++;
    }

    std::cout << "on " << TRIALS << " short random pairs:\\n";
    std::cout << "  Hirschberg returns a genuine longest common subsequence  " << valid << "\\n";
    std::cout << "  and it is character for character the table's answer     " << same << "\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// Lesson 6 said the space optimisation and the traceback are in conflict, because
// the traceback reads cells the rolling array has already overwritten. That is
// true of the obvious traceback. It is not a law.
//
// Hirschberg's trick: split the first string in half, use two rolling rows to
// find where the answer crosses the second string, and recurse on both halves.
// Linear space, and the path comes back.

/// The whole table, kept, so that the path can be walked out of it.
fn full_table(a: &[u8], b: &[u8], writes: &mut [i64; 2]) -> (Vec<u8>, usize) {
    let rows = a.len() + 1;
    let cols = b.len() + 1;
    let mut table = vec![vec![0i32; cols]; rows];
    for i in 1..rows {
        for j in 1..cols {
            writes[0] += 1;
            table[i][j] = if a[i - 1] == b[j - 1] {
                table[i - 1][j - 1] + 1
            } else {
                table[i - 1][j].max(table[i][j - 1])
            };
        }
    }
    let mut out = Vec::new();
    let mut i = a.len();
    let mut j = b.len();
    while i > 0 && j > 0 {
        if a[i - 1] == b[j - 1] {
            out.push(a[i - 1]);
            i -= 1;
            j -= 1;
        } else if table[i - 1][j] >= table[i][j - 1] {
            i -= 1;
        } else {
            j -= 1;
        }
    }
    out.reverse();
    (out, rows * cols)
}

/// The final row of the LCS table for a against b, in two rows of memory.
fn last_row(a: &[u8], b: &[u8], writes: &mut [i64; 2]) -> Vec<i32> {
    let cols = b.len() + 1;
    let mut previous = vec![0i32; cols];
    let mut current = vec![0i32; cols];
    for i in 1..=a.len() {
        for j in 1..cols {
            writes[1] += 1;
            current[j] = if a[i - 1] == b[j - 1] {
                previous[j - 1] + 1
            } else {
                previous[j].max(current[j - 1])
            };
        }
        for j in 0..cols {
            previous[j] = current[j];
            current[j] = 0;
        }
    }
    previous
}

fn reversed(text: &[u8]) -> Vec<u8> {
    let mut out = text.to_vec();
    out.reverse();
    out
}

/// The subsequence itself, never holding more than a couple of rows.
fn hirschberg(a: &[u8], b: &[u8], writes: &mut [i64; 2]) -> Vec<u8> {
    if a.is_empty() || b.is_empty() {
        return Vec::new();
    }
    if a.len() == 1 {
        return if b.contains(&a[0]) { a.to_vec() } else { Vec::new() };
    }
    let mid = a.len() / 2;
    let left = last_row(&a[..mid], b, writes);
    let right = last_row(&reversed(&a[mid..]), &reversed(b), writes);
    // Where the two halves meet: the split of b that maximises the total.
    let mut best_j = 0;
    let mut best = -1;
    for j in 0..=b.len() {
        let total = left[j] + right[b.len() - j];
        if total > best {
            best = total;
            best_j = j;
        }
    }
    let mut out = hirschberg(&a[..mid], &b[..best_j], writes);
    out.extend(hirschberg(&a[mid..], &b[best_j..], writes));
    out
}

fn rand(seed: &mut i64, n: i64) -> i32 {
    *seed = (*seed * 1103515245 + 12345) % 2147483648;
    (*seed / 65536 % n) as i32
}

fn is_subsequence(small: &[u8], big: &[u8]) -> bool {
    let mut j = 0;
    for &ch in big {
        if j < small.len() && small[j] == ch {
            j += 1;
        }
    }
    j == small.len()
}

fn main() {
    let mut seed = 1i64;
    let mut writes = [0i64; 2];
    let a: Vec<u8> = (0..300).map(|_| (97 + rand(&mut seed, 4)) as u8).collect();
    let b: Vec<u8> = (0..400).map(|_| (97 + rand(&mut seed, 4)) as u8).collect();

    let (table_answer, table_cells) = full_table(&a, &b, &mut writes);
    let hirsch_answer = hirschberg(&a, &b, &mut writes);

    println!("longest common subsequence of a {}-character and a {}-character string", a.len(), b.len());
    println!();
    println!("{:<28}{:>8}{:>12}{:>15}", "method", "length", "cells held", "cells written");
    println!("{:<28}{:>8}{:>12}{:>15}", "the whole table", table_answer.len(), table_cells, writes[0]);
    println!("{:<28}{:>8}{:>12}{:>15}", "Hirschberg, two rows", hirsch_answer.len(), 2 * (b.len() + 1), writes[1]);
    println!();
    println!("the two answers are the same string: {}", if table_answer == hirsch_answer { "yes" } else { "no" });
    println!("it is a subsequence of the first:    {}", if is_subsequence(&hirsch_answer, &a) { "yes" } else { "no" });
    println!("it is a subsequence of the second:   {}", if is_subsequence(&hirsch_answer, &b) { "yes" } else { "no" });
    println!("memory: {}x less", table_cells / (2 * (b.len() + 1)));
    println!("work:   {}% of the cells, so about twice over", writes[1] * 100 / writes[0]);
    println!();
    println!("the first sixty characters of it:");
    println!("  {}", String::from_utf8_lossy(&hirsch_answer[..60]));
    println!();

    // One long instance is one data point. Check the two agree on short ones
    // too, where a brute force can also be consulted.
    const TRIALS: i32 = 600;
    let mut same = 0;
    let mut valid = 0;
    for _ in 0..TRIALS {
        let na = 1 + rand(&mut seed, 9);
        let p: Vec<u8> = (0..na).map(|_| (65 + rand(&mut seed, 3)) as u8).collect();
        let nb = 1 + rand(&mut seed, 9);
        let q: Vec<u8> = (0..nb).map(|_| (65 + rand(&mut seed, 3)) as u8).collect();
        let (from_table, _) = full_table(&p, &q, &mut writes);
        let from_hirsch = hirschberg(&p, &q, &mut writes);
        if from_table == from_hirsch {
            same += 1;
        }
        if from_table.len() == from_hirsch.len()
            && is_subsequence(&from_hirsch, &p)
            && is_subsequence(&from_hirsch, &q)
        {
            valid += 1;
        }
    }

    println!("on {} short random pairs:", TRIALS);
    println!("  Hirschberg returns a genuine longest common subsequence  {}", valid);
    println!("  and it is character for character the table's answer     {}", same);
}
`,
            },
            {
              lang: "go",
              code: `// Lesson 6 said the space optimisation and the traceback are in conflict, because
// the traceback reads cells the rolling array has already overwritten. That is
// true of the obvious traceback. It is not a law.
//
// Hirschberg's trick: split the first string in half, use two rolling rows to
// find where the answer crosses the second string, and recurse on both halves.
// Linear space, and the path comes back.
package main

import (
	"fmt"
	"strings"
)

var writes [2]int64

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

// The whole table, kept, so that the path can be walked out of it.
func fullTable(a, b string) (string, int) {
	rows := len(a) + 1
	cols := len(b) + 1
	table := make([][]int, rows)
	for i := range table {
		table[i] = make([]int, cols)
	}
	for i := 1; i < rows; i++ {
		for j := 1; j < cols; j++ {
			writes[0]++
			if a[i-1] == b[j-1] {
				table[i][j] = table[i-1][j-1] + 1
			} else {
				table[i][j] = max(table[i-1][j], table[i][j-1])
			}
		}
	}
	var out []byte
	i, j := len(a), len(b)
	for i > 0 && j > 0 {
		if a[i-1] == b[j-1] {
			out = append(out, a[i-1])
			i--
			j--
		} else if table[i-1][j] >= table[i][j-1] {
			i--
		} else {
			j--
		}
	}
	for x, y := 0, len(out)-1; x < y; x, y = x+1, y-1 {
		out[x], out[y] = out[y], out[x]
	}
	return string(out), rows * cols
}

// The final row of the LCS table for a against b, in two rows of memory.
func lastRow(a, b string) []int {
	cols := len(b) + 1
	previous := make([]int, cols)
	current := make([]int, cols)
	for i := 1; i <= len(a); i++ {
		for j := 1; j < cols; j++ {
			writes[1]++
			if a[i-1] == b[j-1] {
				current[j] = previous[j-1] + 1
			} else {
				current[j] = max(previous[j], current[j-1])
			}
		}
		for j := 0; j < cols; j++ {
			previous[j] = current[j]
			current[j] = 0
		}
	}
	return previous
}

func reverse(text string) string {
	out := []byte(text)
	for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
		out[i], out[j] = out[j], out[i]
	}
	return string(out)
}

// The subsequence itself, never holding more than a couple of rows.
func hirschberg(a, b string) string {
	if len(a) == 0 || len(b) == 0 {
		return ""
	}
	if len(a) == 1 {
		if strings.Contains(b, a) {
			return a
		}
		return ""
	}
	mid := len(a) / 2
	left := lastRow(a[:mid], b)
	right := lastRow(reverse(a[mid:]), reverse(b))
	// Where the two halves meet: the split of b that maximises the total.
	bestJ, best := 0, -1
	for j := 0; j <= len(b); j++ {
		total := left[j] + right[len(b)-j]
		if total > best {
			best = total
			bestJ = j
		}
	}
	return hirschberg(a[:mid], b[:bestJ]) + hirschberg(a[mid:], b[bestJ:])
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func isSubsequence(small, big string) bool {
	j := 0
	for i := 0; i < len(big); i++ {
		if j < len(small) && small[j] == big[i] {
			j++
		}
	}
	return j == len(small)
}

func main() {
	var sa, sb strings.Builder
	for i := 0; i < 300; i++ {
		sa.WriteByte(byte(97 + rand(4)))
	}
	A := sa.String()
	for i := 0; i < 400; i++ {
		sb.WriteByte(byte(97 + rand(4)))
	}
	B := sb.String()

	tableAnswer, tableCells := fullTable(A, B)
	hirschAnswer := hirschberg(A, B)

	fmt.Printf("longest common subsequence of a %d-character and a %d-character string\\n", len(A), len(B))
	fmt.Println()
	fmt.Printf("%-28s%8s%12s%15s\\n", "method", "length", "cells held", "cells written")
	fmt.Printf("%-28s%8d%12d%15d\\n", "the whole table", len(tableAnswer), tableCells, writes[0])
	fmt.Printf("%-28s%8d%12d%15d\\n", "Hirschberg, two rows", len(hirschAnswer), 2*(len(B)+1), writes[1])
	fmt.Println()
	sameString := "no"
	if tableAnswer == hirschAnswer {
		sameString = "yes"
	}
	inFirst := "no"
	if isSubsequence(hirschAnswer, A) {
		inFirst = "yes"
	}
	inSecond := "no"
	if isSubsequence(hirschAnswer, B) {
		inSecond = "yes"
	}
	fmt.Printf("the two answers are the same string: %s\\n", sameString)
	fmt.Printf("it is a subsequence of the first:    %s\\n", inFirst)
	fmt.Printf("it is a subsequence of the second:   %s\\n", inSecond)
	fmt.Printf("memory: %dx less\\n", tableCells/(2*(len(B)+1)))
	fmt.Printf("work:   %d%% of the cells, so about twice over\\n", writes[1]*100/writes[0])
	fmt.Println()
	fmt.Println("the first sixty characters of it:")
	fmt.Println("  " + hirschAnswer[:60])
	fmt.Println()

	// One long instance is one data point. Check the two agree on short ones
	// too, where a brute force can also be consulted.
	const TRIALS = 600
	same, valid := 0, 0
	for t := 0; t < TRIALS; t++ {
		var x, y strings.Builder
		na := 1 + rand(9)
		for i := 0; i < na; i++ {
			x.WriteByte(byte(65 + rand(3)))
		}
		nb := 1 + rand(9)
		for i := 0; i < nb; i++ {
			y.WriteByte(byte(65 + rand(3)))
		}
		p, q := x.String(), y.String()
		fromTable, _ := fullTable(p, q)
		fromHirsch := hirschberg(p, q)
		if fromTable == fromHirsch {
			same++
		}
		if len(fromTable) == len(fromHirsch) && isSubsequence(fromHirsch, p) && isSubsequence(fromHirsch, q) {
			valid++
		}
	}

	fmt.Printf("on %d short random pairs:\\n", TRIALS)
	fmt.Printf("  Hirschberg returns a genuine longest common subsequence  %d\\n", valid)
	fmt.Printf("  and it is character for character the table's answer     %d\\n", same)
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "It returns an optimal answer, not the same one",
          body: "Hirschberg and a table traceback break ties differently, so they agree on the length every time and on the exact string 435 times in 600. If the problem demands a particular optimal answer, that has to be built into both, which is harder here than it is with a plain traceback.",
        },
        {
          title: "The factor of two is time, not space",
          body: "The recursion redoes the top half's work at every level, and the series sums to about twice the original -- measured here at 199% of the cells. That is the price of the memory, and it is worth paying only when the memory was actually the problem.",
        },
      ],
    },
    {
      id: "how-many-you-walked-past",
      heading: "How many answers you walked past",
      body: [
        "Reconstruction hands you one optimal answer. It is worth knowing how many it walked past, for two reasons \u2014 because \"how many optimal solutions are there\" is itself a common question, and because the answer decides whether \"list them all\" is a request you can honour.",
        "Counting is a dynamic program of the same shape as the original, with one wrinkle: a subsequence reachable both by dropping a character from one string and by dropping one from the other has been counted twice, so the recurrence needs an inclusion-exclusion subtraction. The program below checks that against exhaustive enumeration rather than trusting it.",
        "The count is right on all three thousand short pairs, and then the family in the middle shows why this matters. Two strings of fifty-six characters have 40,116,600 distinct longest common subsequences, and the number is exactly the central binomial coefficient \u2014 checked for every k from 1 to 14 rather than asserted.",
        "So the three questions are three different problems. **\"What is the best value\"** is the table. **\"What is an optimal solution\"** is the table plus a traceback, and which one you get is decided by the tie rule. **\"How many optimal solutions are there\"** is a second table of the same size. And **\"list all optimal solutions\"** is not a dynamic program at all \u2014 the output is larger than any table you could build, so the only honest algorithm is an enumeration over the table's ties whose cost is proportional to the number of answers rather than to the size of the input.",
      ],
      examples: [
        {
          id: "counting-the-answers",
          title: "Counting the optimal solutions, and a family where the count explodes",
          lang: "python",
          code: `# Reconstruction gives you one optimal answer. It is worth knowing how many you
# walked past, because the number is usually not one and is sometimes enormous --
# and because counting them is a dynamic program while listing them is not.

def lcs_table(a, b):
    rows = len(a) + 1
    cols = len(b) + 1
    table = [[0] * cols for _ in range(rows)]
    for i in range(1, rows):
        for j in range(1, cols):
            if a[i - 1] == b[j - 1]:
                table[i][j] = table[i - 1][j - 1] + 1
            else:
                table[i][j] = max(table[i - 1][j], table[i][j - 1])
    return table


def count_distinct(a, b):
    """How many *different strings* are longest common subsequences.

    The subtraction is inclusion-exclusion: a subsequence reachable both by
    dropping a character of a and by dropping one of b has been counted twice.
    """
    table = lcs_table(a, b)
    rows = len(a) + 1
    cols = len(b) + 1
    ways = [[0] * cols for _ in range(rows)]
    for i in range(rows):
        ways[i][0] = 1
    for j in range(cols):
        ways[0][j] = 1
    for i in range(1, rows):
        for j in range(1, cols):
            if a[i - 1] == b[j - 1]:
                ways[i][j] = ways[i - 1][j - 1]
            else:
                total = 0
                if table[i - 1][j] == table[i][j]:
                    total += ways[i - 1][j]
                if table[i][j - 1] == table[i][j]:
                    total += ways[i][j - 1]
                if table[i - 1][j - 1] == table[i][j]:
                    total -= ways[i - 1][j - 1]
                ways[i][j] = total
    return table[rows - 1][cols - 1], ways[rows - 1][cols - 1]


def brute_distinct(a, b):
    """Every subsequence of a that is also one of b, kept in a set."""
    best = 0
    found = set()
    for mask in range(1 << len(a)):
        pick = "".join(a[i] for i in range(len(a)) if mask >> i & 1)
        j = 0
        for ch in b:
            if j < len(pick) and pick[j] == ch:
                j += 1
        if j != len(pick):
            continue
        if len(pick) > best:
            best = len(pick)
            found = {pick}
        elif len(pick) == best:
            found.add(pick)
    return best, len(found)


seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


def quoted(text):
    return "'" + text + "'"


A = "ABCBDAB"
B = "BDCABA"
length, count = count_distinct(A, B)
b_length, b_count = brute_distinct(A, B)
print(f"{quoted(A)} against {quoted(B)}")
print(f"  longest common subsequence: length {length}")
print(f"  the table counts {count} different ones; enumerating every subsequence finds {b_count}")
print()

# The count is a dynamic program, so it scales -- and the number it reports does
# not stay small. On this family it is exactly the central binomial coefficient,
# which the program checks rather than claims.
def central_binomial(k):
    value = 1
    for i in range(1, k + 1):
        value = value * (k + i) // i
    return value


print(f"{'k':>3}{'strings':>26}{'lcs':>6}{'different ones':>18}{'C(2k, k)':>12}")
for k in (1, 2, 4, 6, 8, 10, 12, 14):
    a = "AABB" * k
    b = "ABAB" * k
    length, count = count_distinct(a, b)
    print(f"{k:>3}{f'{len(a)} characters each':>26}{length:>6}{count:>18}{central_binomial(k):>12}")

matches = sum(1 for k in range(1, 15) if count_distinct("AABB" * k, "ABAB" * k)[1] == central_binomial(k))
print(f"the two columns agree for every k from 1 to 14: {matches} of 14")
print()

TRIALS = 3000
agree = 0
for _ in range(TRIALS):
    a = "".join(chr(65 + rand(3)) for _ in range(1 + rand(8)))
    b = "".join(chr(65 + rand(3)) for _ in range(1 + rand(8)))
    if count_distinct(a, b) == brute_distinct(a, b):
        agree += 1

print(f"the counting table against exhaustive enumeration, on {TRIALS} short pairs: {agree} agree")
print()
print("so reconstruction returns one of these, chosen by the tie rule and nothing")
print("else. Counting them is a table of the same shape; listing them is not a")
print("dynamic program at all, because the output is bigger than any table.")
`,
          output: `'ABCBDAB' against 'BDCABA'
  longest common subsequence: length 4
  the table counts 3 different ones; enumerating every subsequence finds 3

  k                   strings   lcs    different ones    C(2k, k)
  1         4 characters each     3                 2           2
  2         8 characters each     6                 6           6
  4        16 characters each    12                70          70
  6        24 characters each    18               924         924
  8        32 characters each    24             12870       12870
 10        40 characters each    30            184756      184756
 12        48 characters each    36           2704156     2704156
 14        56 characters each    42          40116600    40116600
the two columns agree for every k from 1 to 14: 14 of 14

the counting table against exhaustive enumeration, on 3000 short pairs: 3000 agree

so reconstruction returns one of these, chosen by the tie rule and nothing
else. Counting them is a table of the same shape; listing them is not a
dynamic program at all, because the output is bigger than any table.`,
          explanation:
            "The counting recurrence is checked against a set-based enumeration on three thousand short pairs before it is used on anything large. The constructed family then gives a number that can be verified independently -- it is the central binomial coefficient, computed separately and compared for every k.",
          alternates: [
            {
              lang: "javascript",
              code: `// Reconstruction gives you one optimal answer. It is worth knowing how many you
// walked past, because the number is usually not one and is sometimes enormous --
// and because counting them is a dynamic program while listing them is not.

function lcsTable(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) {
        table[i][j] = table[i - 1][j - 1] + 1;
      } else {
        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
      }
    }
  }
  return table;
}

/**
 * How many *different strings* are longest common subsequences.
 *
 * The subtraction is inclusion-exclusion: a subsequence reachable both by
 * dropping a character of a and by dropping one of b has been counted twice.
 */
function countDistinct(a, b) {
  const table = lcsTable(a, b);
  const rows = a.length + 1;
  const cols = b.length + 1;
  const ways = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i++) ways[i][0] = 1;
  for (let j = 0; j < cols; j++) ways[0][j] = 1;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) {
        ways[i][j] = ways[i - 1][j - 1];
      } else {
        let total = 0;
        if (table[i - 1][j] === table[i][j]) total += ways[i - 1][j];
        if (table[i][j - 1] === table[i][j]) total += ways[i][j - 1];
        if (table[i - 1][j - 1] === table[i][j]) total -= ways[i - 1][j - 1];
        ways[i][j] = total;
      }
    }
  }
  return [table[rows - 1][cols - 1], ways[rows - 1][cols - 1]];
}

/** Every subsequence of a that is also one of b, kept in a set. */
function bruteDistinct(a, b) {
  let best = 0;
  let found = new Set();
  for (let mask = 0; mask < 1 << a.length; mask++) {
    let pick = "";
    for (let i = 0; i < a.length; i++) if ((mask >> i) & 1) pick += a[i];
    let j = 0;
    for (const ch of b) if (j < pick.length && pick[j] === ch) j++;
    if (j !== pick.length) continue;
    if (pick.length > best) {
      best = pick.length;
      found = new Set([pick]);
    } else if (pick.length === best) {
      found.add(pick);
    }
  }
  return [best, found.size];
}

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const quoted = (text) => \`'\${text}'\`;
const pad = (v, w) => String(v).padStart(w);

function centralBinomial(k) {
  let value = 1;
  for (let i = 1; i <= k; i++) value = (value * (k + i)) / i;
  return value;
}

const A = "ABCBDAB";
const B = "BDCABA";
const [length, count] = countDistinct(A, B);
const [, bruteCount] = bruteDistinct(A, B);
console.log(\`\${quoted(A)} against \${quoted(B)}\`);
console.log(\`  longest common subsequence: length \${length}\`);
console.log(\`  the table counts \${count} different ones; enumerating every subsequence finds \${bruteCount}\`);
console.log();

// The count is a dynamic program, so it scales -- and the number it reports does
// not stay small. On this family it is exactly the central binomial coefficient,
// which the program checks rather than claims.
console.log(pad("k", 3) + pad("strings", 26) + pad("lcs", 6) + pad("different ones", 18) + pad("C(2k, k)", 12));
for (const k of [1, 2, 4, 6, 8, 10, 12, 14]) {
  const a = "AABB".repeat(k);
  const b = "ABAB".repeat(k);
  const [l, c] = countDistinct(a, b);
  console.log(
    pad(k, 3) + pad(\`\${a.length} characters each\`, 26) + pad(l, 6) + pad(c, 18) + pad(centralBinomial(k), 12)
  );
}
let matches = 0;
for (let k = 1; k <= 14; k++) {
  if (countDistinct("AABB".repeat(k), "ABAB".repeat(k))[1] === centralBinomial(k)) matches++;
}
console.log(\`the two columns agree for every k from 1 to 14: \${matches} of 14\`);
console.log();

const TRIALS = 3000;
let agree = 0;
for (let t = 0; t < TRIALS; t++) {
  let p = "";
  const na = 1 + rand(8);
  for (let i = 0; i < na; i++) p += String.fromCharCode(65 + rand(3));
  let q = "";
  const nb = 1 + rand(8);
  for (let i = 0; i < nb; i++) q += String.fromCharCode(65 + rand(3));
  const x = countDistinct(p, q);
  const y = bruteDistinct(p, q);
  if (x[0] === y[0] && x[1] === y[1]) agree++;
}

console.log(\`the counting table against exhaustive enumeration, on \${TRIALS} short pairs: \${agree} agree\`);
console.log();
console.log("so reconstruction returns one of these, chosen by the tie rule and nothing");
console.log("else. Counting them is a table of the same shape; listing them is not a");
console.log("dynamic program at all, because the output is bigger than any table.");
`,
            },
            {
              lang: "typescript",
              code: `// Reconstruction gives you one optimal answer. It is worth knowing how many you
// walked past, because the number is usually not one and is sometimes enormous --
// and because counting them is a dynamic program while listing them is not.

function lcsTable(a: string, b: string): number[][] {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) {
        table[i][j] = table[i - 1][j - 1] + 1;
      } else {
        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
      }
    }
  }
  return table;
}

/**
 * How many *different strings* are longest common subsequences.
 *
 * The subtraction is inclusion-exclusion: a subsequence reachable both by
 * dropping a character of a and by dropping one of b has been counted twice.
 */
function countDistinct(a: string, b: string): [number, number] {
  const table = lcsTable(a, b);
  const rows = a.length + 1;
  const cols = b.length + 1;
  const ways = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i++) ways[i][0] = 1;
  for (let j = 0; j < cols; j++) ways[0][j] = 1;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) {
        ways[i][j] = ways[i - 1][j - 1];
      } else {
        let total = 0;
        if (table[i - 1][j] === table[i][j]) total += ways[i - 1][j];
        if (table[i][j - 1] === table[i][j]) total += ways[i][j - 1];
        if (table[i - 1][j - 1] === table[i][j]) total -= ways[i - 1][j - 1];
        ways[i][j] = total;
      }
    }
  }
  return [table[rows - 1][cols - 1], ways[rows - 1][cols - 1]];
}

/** Every subsequence of a that is also one of b, kept in a set. */
function bruteDistinct(a: string, b: string): [number, number] {
  let best = 0;
  let found = new Set<string>();
  for (let mask = 0; mask < 1 << a.length; mask++) {
    let pick = "";
    for (let i = 0; i < a.length; i++) if ((mask >> i) & 1) pick += a[i];
    let j = 0;
    for (const ch of b) if (j < pick.length && pick[j] === ch) j++;
    if (j !== pick.length) continue;
    if (pick.length > best) {
      best = pick.length;
      found = new Set([pick]);
    } else if (pick.length === best) {
      found.add(pick);
    }
  }
  return [best, found.size];
}

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const quoted = (text: string): string => \`'\${text}'\`;
const pad = (v: string | number, w: number): string => String(v).padStart(w);

function centralBinomial(k: number): number {
  let value = 1;
  for (let i = 1; i <= k; i++) value = (value * (k + i)) / i;
  return value;
}

const A = "ABCBDAB";
const B = "BDCABA";
const [length, count] = countDistinct(A, B);
const [, bruteCount] = bruteDistinct(A, B);
console.log(\`\${quoted(A)} against \${quoted(B)}\`);
console.log(\`  longest common subsequence: length \${length}\`);
console.log(\`  the table counts \${count} different ones; enumerating every subsequence finds \${bruteCount}\`);
console.log();

// The count is a dynamic program, so it scales -- and the number it reports does
// not stay small. On this family it is exactly the central binomial coefficient,
// which the program checks rather than claims.
console.log(pad("k", 3) + pad("strings", 26) + pad("lcs", 6) + pad("different ones", 18) + pad("C(2k, k)", 12));
for (const k of [1, 2, 4, 6, 8, 10, 12, 14]) {
  const a = "AABB".repeat(k);
  const b = "ABAB".repeat(k);
  const [l, c] = countDistinct(a, b);
  console.log(
    pad(k, 3) + pad(\`\${a.length} characters each\`, 26) + pad(l, 6) + pad(c, 18) + pad(centralBinomial(k), 12)
  );
}
let matches = 0;
for (let k = 1; k <= 14; k++) {
  if (countDistinct("AABB".repeat(k), "ABAB".repeat(k))[1] === centralBinomial(k)) matches++;
}
console.log(\`the two columns agree for every k from 1 to 14: \${matches} of 14\`);
console.log();

const TRIALS = 3000;
let agree = 0;
for (let t = 0; t < TRIALS; t++) {
  let p = "";
  const na = 1 + rand(8);
  for (let i = 0; i < na; i++) p += String.fromCharCode(65 + rand(3));
  let q = "";
  const nb = 1 + rand(8);
  for (let i = 0; i < nb; i++) q += String.fromCharCode(65 + rand(3));
  const x = countDistinct(p, q);
  const y = bruteDistinct(p, q);
  if (x[0] === y[0] && x[1] === y[1]) agree++;
}

console.log(\`the counting table against exhaustive enumeration, on \${TRIALS} short pairs: \${agree} agree\`);
console.log();
console.log("so reconstruction returns one of these, chosen by the tie rule and nothing");
console.log("else. Counting them is a table of the same shape; listing them is not a");
console.log("dynamic program at all, because the output is bigger than any table.");
`,
            },
            {
              lang: "java",
              code: `import java.util.HashSet;
import java.util.Set;

// Reconstruction gives you one optimal answer. It is worth knowing how many you
// walked past, because the number is usually not one and is sometimes enormous --
// and because counting them is a dynamic program while listing them is not.
public class Main {
    static int[][] lcsTable(String a, String b) {
        int rows = a.length() + 1;
        int cols = b.length() + 1;
        int[][] table = new int[rows][cols];
        for (int i = 1; i < rows; i++) {
            for (int j = 1; j < cols; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    table[i][j] = table[i - 1][j - 1] + 1;
                } else {
                    table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
                }
            }
        }
        return table;
    }

    /**
     * How many *different strings* are longest common subsequences.
     *
     * The subtraction is inclusion-exclusion: a subsequence reachable both by
     * dropping a character of a and by dropping one of b has been counted twice.
     */
    static long[] countDistinct(String a, String b) {
        int[][] table = lcsTable(a, b);
        int rows = a.length() + 1;
        int cols = b.length() + 1;
        long[][] ways = new long[rows][cols];
        for (int i = 0; i < rows; i++) ways[i][0] = 1;
        for (int j = 0; j < cols; j++) ways[0][j] = 1;
        for (int i = 1; i < rows; i++) {
            for (int j = 1; j < cols; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    ways[i][j] = ways[i - 1][j - 1];
                } else {
                    long total = 0;
                    if (table[i - 1][j] == table[i][j]) total += ways[i - 1][j];
                    if (table[i][j - 1] == table[i][j]) total += ways[i][j - 1];
                    if (table[i - 1][j - 1] == table[i][j]) total -= ways[i - 1][j - 1];
                    ways[i][j] = total;
                }
            }
        }
        return new long[] { table[rows - 1][cols - 1], ways[rows - 1][cols - 1] };
    }

    /** Every subsequence of a that is also one of b, kept in a set. */
    static long[] bruteDistinct(String a, String b) {
        int best = 0;
        Set<String> found = new HashSet<>();
        for (int mask = 0; mask < (1 << a.length()); mask++) {
            StringBuilder pick = new StringBuilder();
            for (int i = 0; i < a.length(); i++) {
                if ((mask >> i & 1) == 1) pick.append(a.charAt(i));
            }
            int j = 0;
            for (int k = 0; k < b.length(); k++) {
                if (j < pick.length() && pick.charAt(j) == b.charAt(k)) j++;
            }
            if (j != pick.length()) continue;
            if (pick.length() > best) {
                best = pick.length();
                found = new HashSet<>();
                found.add(pick.toString());
            } else if (pick.length() == best) {
                found.add(pick.toString());
            }
        }
        return new long[] { best, found.size() };
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    static String quoted(String text) {
        return "'" + text + "'";
    }

    static long centralBinomial(int k) {
        long value = 1;
        for (int i = 1; i <= k; i++) value = value * (k + i) / i;
        return value;
    }

    static String repeat(String unit, int k) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < k; i++) sb.append(unit);
        return sb.toString();
    }

    public static void main(String[] args) {
        String A = "ABCBDAB";
        String B = "BDCABA";
        long[] counted = countDistinct(A, B);
        long[] brute = bruteDistinct(A, B);
        System.out.printf("%s against %s%n", quoted(A), quoted(B));
        System.out.printf("  longest common subsequence: length %d%n", counted[0]);
        System.out.printf("  the table counts %d different ones; enumerating every subsequence finds %d%n",
            counted[1], brute[1]);
        System.out.println();

        // The count is a dynamic program, so it scales -- and the number it
        // reports does not stay small. On this family it is exactly the central
        // binomial coefficient, which the program checks rather than claims.
        System.out.printf("%3s%26s%6s%18s%12s%n", "k", "strings", "lcs", "different ones", "C(2k, k)");
        for (int k : new int[] { 1, 2, 4, 6, 8, 10, 12, 14 }) {
            String a = repeat("AABB", k);
            String b = repeat("ABAB", k);
            long[] row = countDistinct(a, b);
            System.out.printf("%3d%26s%6d%18d%12d%n", k, a.length() + " characters each",
                row[0], row[1], centralBinomial(k));
        }
        int matches = 0;
        for (int k = 1; k <= 14; k++) {
            if (countDistinct(repeat("AABB", k), repeat("ABAB", k))[1] == centralBinomial(k)) matches++;
        }
        System.out.printf("the two columns agree for every k from 1 to 14: %d of 14%n", matches);
        System.out.println();

        final int TRIALS = 3000;
        int agree = 0;
        for (int t = 0; t < TRIALS; t++) {
            StringBuilder x = new StringBuilder();
            int na = 1 + rand(8);
            for (int i = 0; i < na; i++) x.append((char) (65 + rand(3)));
            StringBuilder y = new StringBuilder();
            int nb = 1 + rand(8);
            for (int i = 0; i < nb; i++) y.append((char) (65 + rand(3)));
            long[] p = countDistinct(x.toString(), y.toString());
            long[] q = bruteDistinct(x.toString(), y.toString());
            if (p[0] == q[0] && p[1] == q[1]) agree++;
        }

        System.out.printf("the counting table against exhaustive enumeration, on %d short pairs: %d agree%n",
            TRIALS, agree);
        System.out.println();
        System.out.println("so reconstruction returns one of these, chosen by the tie rule and nothing");
        System.out.println("else. Counting them is a table of the same shape; listing them is not a");
        System.out.println("dynamic program at all, because the output is bigger than any table.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Reconstruction gives you one optimal answer. It is worth knowing how many you
// walked past, because the number is usually not one and is sometimes enormous --
// and because counting them is a dynamic program while listing them is not.
#include <algorithm>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <set>
#include <string>
#include <vector>

std::vector<std::vector<int>> lcsTable(const std::string &a, const std::string &b) {
    int rows = static_cast<int>(a.size()) + 1;
    int cols = static_cast<int>(b.size()) + 1;
    std::vector<std::vector<int>> table(rows, std::vector<int>(cols, 0));
    for (int i = 1; i < rows; i++) {
        for (int j = 1; j < cols; j++) {
            if (a[i - 1] == b[j - 1]) {
                table[i][j] = table[i - 1][j - 1] + 1;
            } else {
                table[i][j] = std::max(table[i - 1][j], table[i][j - 1]);
            }
        }
    }
    return table;
}

// How many *different strings* are longest common subsequences.
//
// The subtraction is inclusion-exclusion: a subsequence reachable both by
// dropping a character of a and by dropping one of b has been counted twice.
void countDistinct(const std::string &a, const std::string &b, std::int64_t &length,
                   std::int64_t &count) {
    auto table = lcsTable(a, b);
    int rows = static_cast<int>(a.size()) + 1;
    int cols = static_cast<int>(b.size()) + 1;
    std::vector<std::vector<std::int64_t>> ways(rows, std::vector<std::int64_t>(cols, 0));
    for (int i = 0; i < rows; i++) ways[i][0] = 1;
    for (int j = 0; j < cols; j++) ways[0][j] = 1;
    for (int i = 1; i < rows; i++) {
        for (int j = 1; j < cols; j++) {
            if (a[i - 1] == b[j - 1]) {
                ways[i][j] = ways[i - 1][j - 1];
            } else {
                std::int64_t total = 0;
                if (table[i - 1][j] == table[i][j]) total += ways[i - 1][j];
                if (table[i][j - 1] == table[i][j]) total += ways[i][j - 1];
                if (table[i - 1][j - 1] == table[i][j]) total -= ways[i - 1][j - 1];
                ways[i][j] = total;
            }
        }
    }
    length = table[rows - 1][cols - 1];
    count = ways[rows - 1][cols - 1];
}

// Every subsequence of a that is also one of b, kept in a set.
void bruteDistinct(const std::string &a, const std::string &b, std::int64_t &length,
                   std::int64_t &count) {
    int best = 0;
    std::set<std::string> found;
    for (int mask = 0; mask < (1 << a.size()); mask++) {
        std::string pick;
        for (size_t i = 0; i < a.size(); i++) {
            if (mask >> i & 1) pick += a[i];
        }
        size_t j = 0;
        for (char ch : b) {
            if (j < pick.size() && pick[j] == ch) j++;
        }
        if (j != pick.size()) continue;
        if (static_cast<int>(pick.size()) > best) {
            best = static_cast<int>(pick.size());
            found.clear();
            found.insert(pick);
        } else if (static_cast<int>(pick.size()) == best) {
            found.insert(pick);
        }
    }
    length = best;
    count = static_cast<std::int64_t>(found.size());
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

// Not \`quoted\`: <iomanip> declares std::quoted, and argument-dependent lookup
// finds it for a std::string argument, which would print double quotes instead.
std::string quotedText(const std::string &text) {
    return "'" + text + "'";
}

std::int64_t centralBinomial(int k) {
    std::int64_t value = 1;
    for (int i = 1; i <= k; i++) value = value * (k + i) / i;
    return value;
}

std::string repeat(const std::string &unit, int k) {
    std::string out;
    for (int i = 0; i < k; i++) out += unit;
    return out;
}

int main() {
    std::string A = "ABCBDAB";
    std::string B = "BDCABA";
    std::int64_t length = 0, count = 0, bruteLength = 0, bruteCount = 0;
    countDistinct(A, B, length, count);
    bruteDistinct(A, B, bruteLength, bruteCount);
    std::cout << quotedText(A) << " against " << quotedText(B) << "\\n";
    std::cout << "  longest common subsequence: length " << length << "\\n";
    std::cout << "  the table counts " << count
              << " different ones; enumerating every subsequence finds " << bruteCount << "\\n\\n";

    // The count is a dynamic program, so it scales -- and the number it reports
    // does not stay small. On this family it is exactly the central binomial
    // coefficient, which the program checks rather than claims.
    std::cout << std::right << std::setw(3) << "k" << std::setw(26) << "strings" << std::setw(6) << "lcs"
              << std::setw(18) << "different ones" << std::setw(12) << "C(2k, k)" << "\\n";
    for (int k : {1, 2, 4, 6, 8, 10, 12, 14}) {
        std::string a = repeat("AABB", k);
        std::string b = repeat("ABAB", k);
        countDistinct(a, b, length, count);
        std::cout << std::right << std::setw(3) << k << std::setw(26)
                  << (std::to_string(a.size()) + " characters each") << std::setw(6) << length
                  << std::setw(18) << count << std::setw(12) << centralBinomial(k) << "\\n";
    }
    int matches = 0;
    for (int k = 1; k <= 14; k++) {
        countDistinct(repeat("AABB", k), repeat("ABAB", k), length, count);
        if (count == centralBinomial(k)) matches++;
    }
    std::cout << "the two columns agree for every k from 1 to 14: " << matches << " of 14\\n\\n";

    const int TRIALS = 3000;
    int agree = 0;
    for (int t = 0; t < TRIALS; t++) {
        std::string p, q;
        int na = 1 + rnd(8);
        for (int i = 0; i < na; i++) p += static_cast<char>(65 + rnd(3));
        int nb = 1 + rnd(8);
        for (int i = 0; i < nb; i++) q += static_cast<char>(65 + rnd(3));
        std::int64_t l1 = 0, c1 = 0, l2 = 0, c2 = 0;
        countDistinct(p, q, l1, c1);
        bruteDistinct(p, q, l2, c2);
        if (l1 == l2 && c1 == c2) agree++;
    }

    std::cout << "the counting table against exhaustive enumeration, on " << TRIALS
              << " short pairs: " << agree << " agree\\n\\n";
    std::cout << "so reconstruction returns one of these, chosen by the tie rule and nothing\\n";
    std::cout << "else. Counting them is a table of the same shape; listing them is not a\\n";
    std::cout << "dynamic program at all, because the output is bigger than any table.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// Reconstruction gives you one optimal answer. It is worth knowing how many you
// walked past, because the number is usually not one and is sometimes enormous --
// and because counting them is a dynamic program while listing them is not.
use std::collections::HashSet;

fn lcs_table(a: &[u8], b: &[u8]) -> Vec<Vec<i32>> {
    let rows = a.len() + 1;
    let cols = b.len() + 1;
    let mut table = vec![vec![0i32; cols]; rows];
    for i in 1..rows {
        for j in 1..cols {
            table[i][j] = if a[i - 1] == b[j - 1] {
                table[i - 1][j - 1] + 1
            } else {
                table[i - 1][j].max(table[i][j - 1])
            };
        }
    }
    table
}

/// How many *different strings* are longest common subsequences.
///
/// The subtraction is inclusion-exclusion: a subsequence reachable both by
/// dropping a character of a and by dropping one of b has been counted twice.
fn count_distinct(a: &[u8], b: &[u8]) -> (i64, i64) {
    let table = lcs_table(a, b);
    let rows = a.len() + 1;
    let cols = b.len() + 1;
    let mut ways = vec![vec![0i64; cols]; rows];
    for i in 0..rows {
        ways[i][0] = 1;
    }
    for j in 0..cols {
        ways[0][j] = 1;
    }
    for i in 1..rows {
        for j in 1..cols {
            if a[i - 1] == b[j - 1] {
                ways[i][j] = ways[i - 1][j - 1];
            } else {
                let mut total = 0;
                if table[i - 1][j] == table[i][j] {
                    total += ways[i - 1][j];
                }
                if table[i][j - 1] == table[i][j] {
                    total += ways[i][j - 1];
                }
                if table[i - 1][j - 1] == table[i][j] {
                    total -= ways[i - 1][j - 1];
                }
                ways[i][j] = total;
            }
        }
    }
    (table[rows - 1][cols - 1] as i64, ways[rows - 1][cols - 1])
}

/// Every subsequence of a that is also one of b, kept in a set.
fn brute_distinct(a: &[u8], b: &[u8]) -> (i64, i64) {
    let mut best = 0;
    let mut found: HashSet<Vec<u8>> = HashSet::new();
    for mask in 0..(1usize << a.len()) {
        let pick: Vec<u8> = (0..a.len()).filter(|i| mask >> i & 1 == 1).map(|i| a[i]).collect();
        let mut j = 0;
        for &ch in b {
            if j < pick.len() && pick[j] == ch {
                j += 1;
            }
        }
        if j != pick.len() {
            continue;
        }
        if pick.len() > best {
            best = pick.len();
            found.clear();
            found.insert(pick);
        } else if pick.len() == best {
            found.insert(pick);
        }
    }
    (best as i64, found.len() as i64)
}

fn rand(seed: &mut i64, n: i64) -> i32 {
    *seed = (*seed * 1103515245 + 12345) % 2147483648;
    (*seed / 65536 % n) as i32
}

fn quoted(text: &str) -> String {
    format!("'{}'", text)
}

fn central_binomial(k: i64) -> i64 {
    let mut value = 1i64;
    for i in 1..=k {
        value = value * (k + i) / i;
    }
    value
}

fn main() {
    let a = "ABCBDAB";
    let b = "BDCABA";
    let (length, count) = count_distinct(a.as_bytes(), b.as_bytes());
    let (_, brute_count) = brute_distinct(a.as_bytes(), b.as_bytes());
    println!("{} against {}", quoted(a), quoted(b));
    println!("  longest common subsequence: length {}", length);
    println!("  the table counts {} different ones; enumerating every subsequence finds {}", count, brute_count);
    println!();

    // The count is a dynamic program, so it scales -- and the number it reports
    // does not stay small. On this family it is exactly the central binomial
    // coefficient, which the program checks rather than claims.
    println!("{:>3}{:>26}{:>6}{:>18}{:>12}", "k", "strings", "lcs", "different ones", "C(2k, k)");
    for k in [1, 2, 4, 6, 8, 10, 12, 14] {
        let x = "AABB".repeat(k);
        let y = "ABAB".repeat(k);
        let (l, c) = count_distinct(x.as_bytes(), y.as_bytes());
        println!("{:>3}{:>26}{:>6}{:>18}{:>12}", k,
            format!("{} characters each", x.len()), l, c, central_binomial(k as i64));
    }
    let mut matches = 0;
    for k in 1..=14 {
        let x = "AABB".repeat(k);
        let y = "ABAB".repeat(k);
        if count_distinct(x.as_bytes(), y.as_bytes()).1 == central_binomial(k as i64) {
            matches += 1;
        }
    }
    println!("the two columns agree for every k from 1 to 14: {} of 14", matches);
    println!();

    const TRIALS: i32 = 3000;
    let mut seed = 1i64;
    let mut agree = 0;
    for _ in 0..TRIALS {
        let na = 1 + rand(&mut seed, 8);
        let p: Vec<u8> = (0..na).map(|_| (65 + rand(&mut seed, 3)) as u8).collect();
        let nb = 1 + rand(&mut seed, 8);
        let q: Vec<u8> = (0..nb).map(|_| (65 + rand(&mut seed, 3)) as u8).collect();
        if count_distinct(&p, &q) == brute_distinct(&p, &q) {
            agree += 1;
        }
    }

    println!("the counting table against exhaustive enumeration, on {} short pairs: {} agree", TRIALS, agree);
    println!();
    println!("so reconstruction returns one of these, chosen by the tie rule and nothing");
    println!("else. Counting them is a table of the same shape; listing them is not a");
    println!("dynamic program at all, because the output is bigger than any table.");
}
`,
            },
            {
              lang: "go",
              code: `// Reconstruction gives you one optimal answer. It is worth knowing how many you
// walked past, because the number is usually not one and is sometimes enormous --
// and because counting them is a dynamic program while listing them is not.
package main

import (
	"fmt"
	"strings"
)

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func lcsTable(a, b string) [][]int {
	rows := len(a) + 1
	cols := len(b) + 1
	table := make([][]int, rows)
	for i := range table {
		table[i] = make([]int, cols)
	}
	for i := 1; i < rows; i++ {
		for j := 1; j < cols; j++ {
			if a[i-1] == b[j-1] {
				table[i][j] = table[i-1][j-1] + 1
			} else {
				table[i][j] = max(table[i-1][j], table[i][j-1])
			}
		}
	}
	return table
}

// How many *different strings* are longest common subsequences.
//
// The subtraction is inclusion-exclusion: a subsequence reachable both by
// dropping a character of a and by dropping one of b has been counted twice.
func countDistinct(a, b string) (int64, int64) {
	table := lcsTable(a, b)
	rows := len(a) + 1
	cols := len(b) + 1
	ways := make([][]int64, rows)
	for i := range ways {
		ways[i] = make([]int64, cols)
	}
	for i := 0; i < rows; i++ {
		ways[i][0] = 1
	}
	for j := 0; j < cols; j++ {
		ways[0][j] = 1
	}
	for i := 1; i < rows; i++ {
		for j := 1; j < cols; j++ {
			if a[i-1] == b[j-1] {
				ways[i][j] = ways[i-1][j-1]
			} else {
				var total int64
				if table[i-1][j] == table[i][j] {
					total += ways[i-1][j]
				}
				if table[i][j-1] == table[i][j] {
					total += ways[i][j-1]
				}
				if table[i-1][j-1] == table[i][j] {
					total -= ways[i-1][j-1]
				}
				ways[i][j] = total
			}
		}
	}
	return int64(table[rows-1][cols-1]), ways[rows-1][cols-1]
}

// Every subsequence of a that is also one of b, kept in a set.
func bruteDistinct(a, b string) (int64, int64) {
	best := 0
	found := map[string]bool{}
	for mask := 0; mask < 1<<len(a); mask++ {
		pick := ""
		for i := 0; i < len(a); i++ {
			if mask>>i&1 == 1 {
				pick += string(a[i])
			}
		}
		j := 0
		for k := 0; k < len(b); k++ {
			if j < len(pick) && pick[j] == b[k] {
				j++
			}
		}
		if j != len(pick) {
			continue
		}
		if len(pick) > best {
			best = len(pick)
			found = map[string]bool{pick: true}
		} else if len(pick) == best {
			found[pick] = true
		}
	}
	return int64(best), int64(len(found))
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func quoted(text string) string {
	return "'" + text + "'"
}

func centralBinomial(k int) int64 {
	var value int64 = 1
	for i := 1; i <= k; i++ {
		value = value * int64(k+i) / int64(i)
	}
	return value
}

func main() {
	A := "ABCBDAB"
	B := "BDCABA"
	length, count := countDistinct(A, B)
	_, bruteCount := bruteDistinct(A, B)
	fmt.Printf("%s against %s\\n", quoted(A), quoted(B))
	fmt.Printf("  longest common subsequence: length %d\\n", length)
	fmt.Printf("  the table counts %d different ones; enumerating every subsequence finds %d\\n", count, bruteCount)
	fmt.Println()

	// The count is a dynamic program, so it scales -- and the number it reports
	// does not stay small. On this family it is exactly the central binomial
	// coefficient, which the program checks rather than claims.
	fmt.Printf("%3s%26s%6s%18s%12s\\n", "k", "strings", "lcs", "different ones", "C(2k, k)")
	for _, k := range []int{1, 2, 4, 6, 8, 10, 12, 14} {
		a := strings.Repeat("AABB", k)
		b := strings.Repeat("ABAB", k)
		l, c := countDistinct(a, b)
		fmt.Printf("%3d%26s%6d%18d%12d\\n", k, fmt.Sprintf("%d characters each", len(a)), l, c, centralBinomial(k))
	}
	matches := 0
	for k := 1; k <= 14; k++ {
		if _, c := countDistinct(strings.Repeat("AABB", k), strings.Repeat("ABAB", k)); c == centralBinomial(k) {
			matches++
		}
	}
	fmt.Printf("the two columns agree for every k from 1 to 14: %d of 14\\n", matches)
	fmt.Println()

	const TRIALS = 3000
	agree := 0
	for t := 0; t < TRIALS; t++ {
		p := ""
		na := 1 + rand(8)
		for i := 0; i < na; i++ {
			p += string(rune(65 + rand(3)))
		}
		q := ""
		nb := 1 + rand(8)
		for i := 0; i < nb; i++ {
			q += string(rune(65 + rand(3)))
		}
		l1, c1 := countDistinct(p, q)
		l2, c2 := bruteDistinct(p, q)
		if l1 == l2 && c1 == c2 {
			agree++
		}
	}

	fmt.Printf("the counting table against exhaustive enumeration, on %d short pairs: %d agree\\n", TRIALS, agree)
	fmt.Println()
	fmt.Println("so reconstruction returns one of these, chosen by the tie rule and nothing")
	fmt.Println("else. Counting them is a table of the same shape; listing them is not a")
	fmt.Println("dynamic program at all, because the output is bigger than any table.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Counting solutions needs inclusion-exclusion, not just addition",
          body: "Adding the two predecessors double-counts every solution reachable both ways, which is why the recurrence subtracts the diagonal when it is also optimal. The symptom is a count that is too large by an amount with no pattern, and the fix is the same one lesson 4 named for counting problems: make sure each object has exactly one derivation.",
        },
        {
          title: "\"List all optimal solutions\" may not be answerable",
          body: "Fifty-six characters is enough for forty million distinct optimal subsequences, so an algorithm that lists them cannot be polynomial in the input -- its cost is proportional to the output. If a problem asks for all of them, count them first; the count is cheap and it tells you whether the request is reasonable.",
        },
      ],
    },
    {
      id: "choosing",
      heading: "Which of these you actually need",
      body: [
        "Which reduces to a short decision.",
        "**If the answer is a number**, optimise the space freely \u2014 lesson 6 applies with nothing lost.",
        "**If you need one optimal solution and the table fits**, either method works. Prefer recorded pointers when the values are floating point, when the comparison is a custom comparator, or when the recurrence has many branches, because re-deriving a choice by testing equality is fragile in exactly those cases. Prefer the traceback when memory is tight, since it needs nothing beyond the table you already have.",
        "**If you need one optimal solution and the table does not fit**, use the divide-and-conquer form. Roughly twice the time, linear space, and the path comes back.",
        "**If you need a *particular* optimal solution**, fix the tie rule in the fill and make the extraction follow it. This is the case people get wrong, because the wrong answer has the right value.",
        "**If you need the count**, that is a second table. **If you need them all**, count them first and then decide whether the question was reasonable.",
        "And whichever you choose, check the reconstruction rather than trusting it: replay it and confirm it produces what the table promised. Every example in this module does that, it takes one extra function, and it is the only test that can catch an extraction bug at all.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Your dynamic program computes the optimal value. How do you get the actual solution?",
      answer:
        "Two options. Re-derive it: walk back from the final cell and, at each step, ask which predecessor is consistent with the value written there \u2014 free in memory but it needs the table intact. Or record it: a second table written during the fill saying which branch won, read straight back \u2014 unambiguous, and it costs a table the same shape as the original. I would use pointers when the values are floating point or the comparison is a custom one, because re-deriving by testing equality is fragile there, and the traceback when memory is tight. Either way I would replay the reconstructed solution and check it produces the value the table promised, because that is the only test that catches an extraction bug.",
    },
    {
      question: "Two implementations of the same dynamic program return different solutions with the same value. Is one of them wrong?",
      answer:
        "Not necessarily \u2014 that is what a tie looks like. Whenever two solutions are worth the same, something has to break the tie, and it is a comparison inside the fill. Changing `>` to \"greater or equal\" leaves every cell's value identical and changes which packing comes back on about a third of random knapsacks. It becomes a bug in two situations: when the traceback's comparison has drifted from the fill's, which no value-based test can detect; and when the problem asked for a specific optimal solution, like the lexicographically smallest. In both cases the fix is to fix the tie rule in the fill deliberately and make the extraction mirror it.",
    },
    {
      question: "You need the actual alignment of two strings that are too long for the table to fit in memory. What do you do?",
      answer:
        "Hirschberg's algorithm \u2014 divide and conquer over the table. The optimal path has to cross the middle row somewhere, and finding where needs only rows: run the rolling computation forwards over the top half and backwards over the bottom half against the reversed second string, add the two rows, and take the column where the sum is largest. Then recurse on the two halves. That is linear space and about twice the time, because the work halves at each level and the series sums to two \u2014 measured, 802 cells instead of 120,701 and 199% of the cell-writes. The caveat worth stating is that it returns an optimal alignment rather than the same one a table traceback would, since the two break ties differently.",
    },
  ],
  takeaways: [
    "The table holds the value; extracting the solution is a separate step with its own bugs.",
    "Re-deriving the choice costs no memory but needs the table; recording it costs a second table and is unambiguous.",
    "Ties are the normal case, and the comparison in the fill is what breaks them.",
    "Changing the tie rule leaves every value identical and changes the answer on 1,856 of 5,000 knapsacks.",
    "A traceback whose comparison drifts from the fill's is invisible to any test that only checks values.",
    "Hirschberg recovers the path in two rows \u2014 802 cells instead of 120,701 \u2014 for about twice the work.",
    "Counting the optimal solutions is a second table, and it needs inclusion-exclusion rather than plain addition.",
    "Fifty-six characters can have 40,116,600 optimal answers, so listing them all is not a dynamic program.",
  ],
  status: "available",
};
