import type { Lesson } from "@/content/types";

export const droppingADimensionLesson: Lesson = {
  id: "dsa-dp-dropping-a-dimension",
  slug: "dropping-a-dimension",
  moduleSlug: "dynamic-programming-foundations",
  title: "Dropping a Dimension",
  summary:
    "Most of a dynamic programming table is dead the moment it is written, and the recurrence says exactly how much of it to keep — which is not always two rows. The saving is real at scale, and it costs you the one thing the next lesson is about.",
  estimatedMinutes: 35,
  objectives: [
    "Reduce a table to two rows, and then to one, without changing the answer",
    "Explain what the saved diagonal is for, and what happens without it",
    "Size a rolling window from the reach of the transition rather than by habit",
    "Recognise when the optimisation destroys the answer you were actually asked for",
  ],
  sections: [
    {
      id: "throwing-the-table-away",
      heading: "Throwing the table away as it is built",
      body: [
        "Every table in this module so far has been allocated in full and then read at exactly one cell. That is usually more memory than the algorithm needs, and the reason is visible in the recurrence rather than in the code: if a row only ever reads the row above it, then two rows back is dead the moment the current row starts, and keeping it is just habit.",
        "So the ladder goes: the whole table, then two rows, then \u2014 when the row can be updated in place \u2014 one row and a single saved value. The answer never changes, and neither does the running time; the only thing that changes is what stays allocated.",
        "The last rung has a trap in it, and it is worth meeting on purpose. Updating a row in place means `row[j]` is overwritten before `row[j + 1]` reads it, and `row[j + 1]` wanted the *old* value \u2014 the diagonal. One variable stashes it. Without that variable the code still runs, still returns a plausible number, and is wrong.",
        "Fifty-six cells, then sixteen, then nine, for the same answer, checked against every subsequence of the first string. The broken version is also right on the printed example, which is the fourth time in this module that a wrong implementation has agreed with the worked example \u2014 and across four thousand random string pairs it is right 2,460 times, so it is not even usually wrong.",
        "That pattern is worth naming rather than noticing repeatedly. **Near-miss dynamic programs fail on the instances that exercise the thing you got wrong**, and a short hand-picked example rarely does. Random testing against a brute force, on inputs small enough to enumerate, is what separates the two, and it has caught every bug in this module in about a second.",
      ],
      examples: [
        {
          id: "the-ladder",
          title: "Longest common subsequence in four widths of memory",
          lang: "python",
          code: `# A row of the table usually reads only the row above it. When that is true the
# rows below have nothing left to say to anything, and the table can be thrown
# away as it is built -- which is the whole of the space optimisation.
#
# Longest common subsequence, four ways. Three of them are right.

A = "AGGTAB"
B = "GXTXAYB"


def full_table(a, b):
    """Every cell kept. (len(a)+1) * (len(b)+1) of them."""
    rows = len(a) + 1
    cols = len(b) + 1
    table = [[0] * cols for _ in range(rows)]
    for i in range(1, rows):
        for j in range(1, cols):
            if a[i - 1] == b[j - 1]:
                table[i][j] = table[i - 1][j - 1] + 1
            else:
                table[i][j] = max(table[i - 1][j], table[i][j - 1])
    return table[rows - 1][cols - 1], rows * cols


def two_rows(a, b):
    """Only the previous row is ever read, so only two rows need to exist."""
    cols = len(b) + 1
    previous = [0] * cols
    current = [0] * cols
    for i in range(1, len(a) + 1):
        for j in range(1, cols):
            if a[i - 1] == b[j - 1]:
                current[j] = previous[j - 1] + 1
            else:
                current[j] = max(previous[j], current[j - 1])
        previous, current = current, previous
    return previous[cols - 1], 2 * cols


def one_row(a, b):
    """One row, plus one saved value.

    Writing row[j] destroys the diagonal that row[j+1] is about to need, so the
    old row[j] is stashed before the write. That single variable is the whole
    difference between this and the version below.
    """
    cols = len(b) + 1
    row = [0] * cols
    for i in range(1, len(a) + 1):
        diagonal = 0                       # row[0] from the previous row
        for j in range(1, cols):
            above = row[j]                 # the previous row's value, still here
            if a[i - 1] == b[j - 1]:
                row[j] = diagonal + 1
            else:
                row[j] = max(above, row[j - 1])
            diagonal = above               # for the next j
    return row[cols - 1], cols + 1


def one_row_broken(a, b):
    """The same, without the stash. row[j-1] has already been overwritten."""
    cols = len(b) + 1
    row = [0] * cols
    for i in range(1, len(a) + 1):
        for j in range(1, cols):
            if a[i - 1] == b[j - 1]:
                row[j] = row[j - 1] + 1
            else:
                row[j] = max(row[j], row[j - 1])
    return row[cols - 1], cols


def brute_force(a, b):
    """Every subsequence of a, checked for being a subsequence of b."""
    best = 0
    for mask in range(1 << len(a)):
        pick = "".join(a[i] for i in range(len(a)) if mask >> i & 1)
        j = 0
        for ch in b:
            if j < len(pick) and pick[j] == ch:
                j += 1
        if j == len(pick) and len(pick) > best:
            best = len(pick)
    return best


def quoted(text):
    return "'" + text + "'"


print(f"longest common subsequence of {quoted(A)} and {quoted(B)}")
print()
print(f"{'method':<28}{'answer':>8}{'cells held':>12}")
for label, run in (
    ("the whole table", full_table),
    ("two rows", two_rows),
    ("one row and one variable", one_row),
    ("one row, no variable", one_row_broken),
):
    answer, cells = run(A, B)
    print(f"{label:<28}{answer:>8}{cells:>12}")
print(f"{'every subsequence, checked':<28}{brute_force(A, B):>8}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 4000
scores = [0, 0, 0, 0]
for _ in range(TRIALS):
    a = "".join(chr(65 + rand(4)) for _ in range(1 + rand(8)))
    b = "".join(chr(65 + rand(4)) for _ in range(1 + rand(8)))
    truth = brute_force(a, b)
    for k, run in enumerate((full_table, two_rows, one_row, one_row_broken)):
        if run(a, b)[0] == truth:
            scores[k] += 1

print(f"scored against every subsequence on {TRIALS} random string pairs:")
for k, label in enumerate(
    ("the whole table", "two rows", "one row and one variable", "one row, no variable")
):
    print(f"  {label:<28}{scores[k]:>6}")
`,
          output: `longest common subsequence of 'AGGTAB' and 'GXTXAYB'

method                        answer  cells held
the whole table                    4          56
two rows                           4          16
one row and one variable           4           9
one row, no variable               4           8
every subsequence, checked         4

scored against every subsequence on 4000 random string pairs:
  the whole table               4000
  two rows                      4000
  one row and one variable      4000
  one row, no variable          2460`,
          explanation:
            "The three correct versions differ only in how much they keep. The fourth is the one-row version with the saved diagonal removed, which is the single most common way to get this wrong, and it is scored alongside the others against an exhaustive search over subsequences.",
          alternates: [
            {
              lang: "javascript",
              code: `// A row of the table usually reads only the row above it. When that is true the
// rows below have nothing left to say to anything, and the table can be thrown
// away as it is built -- which is the whole of the space optimisation.
//
// Longest common subsequence, four ways. Three of them are right.

const A = "AGGTAB";
const B = "GXTXAYB";

/** Every cell kept. (len(a)+1) * (len(b)+1) of them. */
function fullTable(a, b) {
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
  return [table[rows - 1][cols - 1], rows * cols];
}

/** Only the previous row is ever read, so only two rows need to exist. */
function twoRows(a, b) {
  const cols = b.length + 1;
  let previous = new Array(cols).fill(0);
  let current = new Array(cols).fill(0);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) {
        current[j] = previous[j - 1] + 1;
      } else {
        current[j] = Math.max(previous[j], current[j - 1]);
      }
    }
    const swap = previous;
    previous = current;
    current = swap;
  }
  return [previous[cols - 1], 2 * cols];
}

/**
 * One row, plus one saved value.
 *
 * Writing row[j] destroys the diagonal that row[j+1] is about to need, so the
 * old row[j] is stashed before the write. That single variable is the whole
 * difference between this and the version below.
 */
function oneRow(a, b) {
  const cols = b.length + 1;
  const row = new Array(cols).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = 0;                     // row[0] from the previous row
    for (let j = 1; j < cols; j++) {
      const above = row[j];               // the previous row's value, still here
      if (a[i - 1] === b[j - 1]) {
        row[j] = diagonal + 1;
      } else {
        row[j] = Math.max(above, row[j - 1]);
      }
      diagonal = above;                   // for the next j
    }
  }
  return [row[cols - 1], cols + 1];
}

/** The same, without the stash. row[j-1] has already been overwritten. */
function oneRowBroken(a, b) {
  const cols = b.length + 1;
  const row = new Array(cols).fill(0);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) {
        row[j] = row[j - 1] + 1;
      } else {
        row[j] = Math.max(row[j], row[j - 1]);
      }
    }
  }
  return [row[cols - 1], cols];
}

/** Every subsequence of a, checked for being a subsequence of b. */
function bruteForce(a, b) {
  let best = 0;
  for (let mask = 0; mask < 1 << a.length; mask++) {
    let pick = "";
    for (let i = 0; i < a.length; i++) if ((mask >> i) & 1) pick += a[i];
    let j = 0;
    for (const ch of b) if (j < pick.length && pick[j] === ch) j++;
    if (j === pick.length && pick.length > best) best = pick.length;
  }
  return best;
}

const quoted = (text) => \`'\${text}'\`;
const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const LABELS = ["the whole table", "two rows", "one row and one variable", "one row, no variable"];

function run(which, a, b) {
  if (which === 0) return fullTable(a, b);
  if (which === 1) return twoRows(a, b);
  if (which === 2) return oneRow(a, b);
  return oneRowBroken(a, b);
}

console.log(\`longest common subsequence of \${quoted(A)} and \${quoted(B)}\`);
console.log();
console.log(padEnd("method", 28) + pad("answer", 8) + pad("cells held", 12));
for (let k = 0; k < 4; k++) {
  const [answer, cells] = run(k, A, B);
  console.log(padEnd(LABELS[k], 28) + pad(answer, 8) + pad(cells, 12));
}
console.log(padEnd("every subsequence, checked", 28) + pad(bruteForce(A, B), 8));
console.log();

const TRIALS = 4000;
const scores = [0, 0, 0, 0];
for (let t = 0; t < TRIALS; t++) {
  let a = "";
  const na = 1 + rand(8);
  for (let i = 0; i < na; i++) a += String.fromCharCode(65 + rand(4));
  let b = "";
  const nb = 1 + rand(8);
  for (let i = 0; i < nb; i++) b += String.fromCharCode(65 + rand(4));
  const truth = bruteForce(a, b);
  for (let k = 0; k < 4; k++) if (run(k, a, b)[0] === truth) scores[k]++;
}

console.log(\`scored against every subsequence on \${TRIALS} random string pairs:\`);
for (let k = 0; k < 4; k++) console.log(\`  \${padEnd(LABELS[k], 28)}\${pad(scores[k], 6)}\`);
`,
            },
            {
              lang: "typescript",
              code: `// A row of the table usually reads only the row above it. When that is true the
// rows below have nothing left to say to anything, and the table can be thrown
// away as it is built -- which is the whole of the space optimisation.
//
// Longest common subsequence, four ways. Three of them are right.

const A = "AGGTAB";
const B = "GXTXAYB";

/** Every cell kept. (len(a)+1) * (len(b)+1) of them. */
function fullTable(a: string, b: string): [number, number] {
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
  return [table[rows - 1][cols - 1], rows * cols];
}

/** Only the previous row is ever read, so only two rows need to exist. */
function twoRows(a: string, b: string): [number, number] {
  const cols = b.length + 1;
  let previous = new Array(cols).fill(0);
  let current = new Array(cols).fill(0);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) {
        current[j] = previous[j - 1] + 1;
      } else {
        current[j] = Math.max(previous[j], current[j - 1]);
      }
    }
    const swap = previous;
    previous = current;
    current = swap;
  }
  return [previous[cols - 1], 2 * cols];
}

/**
 * One row, plus one saved value.
 *
 * Writing row[j] destroys the diagonal that row[j+1] is about to need, so the
 * old row[j] is stashed before the write. That single variable is the whole
 * difference between this and the version below.
 */
function oneRow(a: string, b: string): [number, number] {
  const cols = b.length + 1;
  const row = new Array(cols).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = 0;                     // row[0] from the previous row
    for (let j = 1; j < cols; j++) {
      const above = row[j];               // the previous row's value, still here
      if (a[i - 1] === b[j - 1]) {
        row[j] = diagonal + 1;
      } else {
        row[j] = Math.max(above, row[j - 1]);
      }
      diagonal = above;                   // for the next j
    }
  }
  return [row[cols - 1], cols + 1];
}

/** The same, without the stash. row[j-1] has already been overwritten. */
function oneRowBroken(a: string, b: string): [number, number] {
  const cols = b.length + 1;
  const row = new Array(cols).fill(0);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) {
        row[j] = row[j - 1] + 1;
      } else {
        row[j] = Math.max(row[j], row[j - 1]);
      }
    }
  }
  return [row[cols - 1], cols];
}

/** Every subsequence of a, checked for being a subsequence of b. */
function bruteForce(a: string, b: string): number {
  let best = 0;
  for (let mask = 0; mask < 1 << a.length; mask++) {
    let pick = "";
    for (let i = 0; i < a.length; i++) if ((mask >> i) & 1) pick += a[i];
    let j = 0;
    for (const ch of b) if (j < pick.length && pick[j] === ch) j++;
    if (j === pick.length && pick.length > best) best = pick.length;
  }
  return best;
}

const quoted = (text: string): string => \`'\${text}'\`;
const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const LABELS = ["the whole table", "two rows", "one row and one variable", "one row, no variable"];

function run(which: number, a: string, b: string): [number, number] {
  if (which === 0) return fullTable(a, b);
  if (which === 1) return twoRows(a, b);
  if (which === 2) return oneRow(a, b);
  return oneRowBroken(a, b);
}

console.log(\`longest common subsequence of \${quoted(A)} and \${quoted(B)}\`);
console.log();
console.log(padEnd("method", 28) + pad("answer", 8) + pad("cells held", 12));
for (let k = 0; k < 4; k++) {
  const [answer, cells] = run(k, A, B);
  console.log(padEnd(LABELS[k], 28) + pad(answer, 8) + pad(cells, 12));
}
console.log(padEnd("every subsequence, checked", 28) + pad(bruteForce(A, B), 8));
console.log();

const TRIALS = 4000;
const scores = [0, 0, 0, 0];
for (let t = 0; t < TRIALS; t++) {
  let a = "";
  const na = 1 + rand(8);
  for (let i = 0; i < na; i++) a += String.fromCharCode(65 + rand(4));
  let b = "";
  const nb = 1 + rand(8);
  for (let i = 0; i < nb; i++) b += String.fromCharCode(65 + rand(4));
  const truth = bruteForce(a, b);
  for (let k = 0; k < 4; k++) if (run(k, a, b)[0] === truth) scores[k]++;
}

console.log(\`scored against every subsequence on \${TRIALS} random string pairs:\`);
for (let k = 0; k < 4; k++) console.log(\`  \${padEnd(LABELS[k], 28)}\${pad(scores[k], 6)}\`);
`,
            },
            {
              lang: "java",
              code: `// A row of the table usually reads only the row above it. When that is true the
// rows below have nothing left to say to anything, and the table can be thrown
// away as it is built -- which is the whole of the space optimisation.
//
// Longest common subsequence, four ways. Three of them are right.
public class Main {
    static final String A = "AGGTAB";
    static final String B = "GXTXAYB";

    /** Every cell kept. (len(a)+1) * (len(b)+1) of them. */
    static int[] fullTable(String a, String b) {
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
        return new int[] { table[rows - 1][cols - 1], rows * cols };
    }

    /** Only the previous row is ever read, so only two rows need to exist. */
    static int[] twoRows(String a, String b) {
        int cols = b.length() + 1;
        int[] previous = new int[cols];
        int[] current = new int[cols];
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j < cols; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    current[j] = previous[j - 1] + 1;
                } else {
                    current[j] = Math.max(previous[j], current[j - 1]);
                }
            }
            int[] swap = previous;
            previous = current;
            current = swap;
        }
        return new int[] { previous[cols - 1], 2 * cols };
    }

    /**
     * One row, plus one saved value.
     *
     * Writing row[j] destroys the diagonal that row[j+1] is about to need, so the
     * old row[j] is stashed before the write. That single variable is the whole
     * difference between this and the version below.
     */
    static int[] oneRow(String a, String b) {
        int cols = b.length() + 1;
        int[] row = new int[cols];
        for (int i = 1; i <= a.length(); i++) {
            int diagonal = 0;                       // row[0] from the previous row
            for (int j = 1; j < cols; j++) {
                int above = row[j];                 // the previous row's value, still here
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    row[j] = diagonal + 1;
                } else {
                    row[j] = Math.max(above, row[j - 1]);
                }
                diagonal = above;                   // for the next j
            }
        }
        return new int[] { row[cols - 1], cols + 1 };
    }

    /** The same, without the stash. row[j-1] has already been overwritten. */
    static int[] oneRowBroken(String a, String b) {
        int cols = b.length() + 1;
        int[] row = new int[cols];
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j < cols; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    row[j] = row[j - 1] + 1;
                } else {
                    row[j] = Math.max(row[j], row[j - 1]);
                }
            }
        }
        return new int[] { row[cols - 1], cols };
    }

    /** Every subsequence of a, checked for being a subsequence of b. */
    static int bruteForce(String a, String b) {
        int best = 0;
        for (int mask = 0; mask < (1 << a.length()); mask++) {
            StringBuilder pick = new StringBuilder();
            for (int i = 0; i < a.length(); i++) {
                if ((mask >> i & 1) == 1) pick.append(a.charAt(i));
            }
            int j = 0;
            for (int k = 0; k < b.length(); k++) {
                if (j < pick.length() && pick.charAt(j) == b.charAt(k)) j++;
            }
            if (j == pick.length() && pick.length() > best) best = pick.length();
        }
        return best;
    }

    static String quoted(String text) {
        return "'" + text + "'";
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    static final String[] LABELS = {
        "the whole table", "two rows", "one row and one variable", "one row, no variable",
    };

    static int[] run(int which, String a, String b) {
        if (which == 0) return fullTable(a, b);
        if (which == 1) return twoRows(a, b);
        if (which == 2) return oneRow(a, b);
        return oneRowBroken(a, b);
    }

    public static void main(String[] args) {
        System.out.printf("longest common subsequence of %s and %s%n", quoted(A), quoted(B));
        System.out.println();
        System.out.printf("%-28s%8s%12s%n", "method", "answer", "cells held");
        for (int k = 0; k < 4; k++) {
            int[] result = run(k, A, B);
            System.out.printf("%-28s%8d%12d%n", LABELS[k], result[0], result[1]);
        }
        System.out.printf("%-28s%8d%n", "every subsequence, checked", bruteForce(A, B));
        System.out.println();

        final int TRIALS = 4000;
        int[] scores = new int[4];
        for (int t = 0; t < TRIALS; t++) {
            StringBuilder a = new StringBuilder();
            int na = 1 + rand(8);
            for (int i = 0; i < na; i++) a.append((char) (65 + rand(4)));
            StringBuilder b = new StringBuilder();
            int nb = 1 + rand(8);
            for (int i = 0; i < nb; i++) b.append((char) (65 + rand(4)));
            int truth = bruteForce(a.toString(), b.toString());
            for (int k = 0; k < 4; k++) {
                if (run(k, a.toString(), b.toString())[0] == truth) scores[k]++;
            }
        }

        System.out.printf("scored against every subsequence on %d random string pairs:%n", TRIALS);
        for (int k = 0; k < 4; k++) {
            System.out.printf("  %-28s%6d%n", LABELS[k], scores[k]);
        }
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// A row of the table usually reads only the row above it. When that is true the
// rows below have nothing left to say to anything, and the table can be thrown
// away as it is built -- which is the whole of the space optimisation.
//
// Longest common subsequence, four ways. Three of them are right.
#include <algorithm>
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

static const std::string A = "AGGTAB";
static const std::string B = "GXTXAYB";

// Every cell kept. (len(a)+1) * (len(b)+1) of them.
std::array<int, 2> fullTable(const std::string &a, const std::string &b) {
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
    return {table[rows - 1][cols - 1], rows * cols};
}

// Only the previous row is ever read, so only two rows need to exist.
std::array<int, 2> twoRows(const std::string &a, const std::string &b) {
    int cols = static_cast<int>(b.size()) + 1;
    std::vector<int> previous(cols, 0), current(cols, 0);
    for (size_t i = 1; i <= a.size(); i++) {
        for (int j = 1; j < cols; j++) {
            if (a[i - 1] == b[j - 1]) {
                current[j] = previous[j - 1] + 1;
            } else {
                current[j] = std::max(previous[j], current[j - 1]);
            }
        }
        std::swap(previous, current);
    }
    return {previous[cols - 1], 2 * cols};
}

// One row, plus one saved value.
//
// Writing row[j] destroys the diagonal that row[j+1] is about to need, so the
// old row[j] is stashed before the write. That single variable is the whole
// difference between this and the version below.
std::array<int, 2> oneRow(const std::string &a, const std::string &b) {
    int cols = static_cast<int>(b.size()) + 1;
    std::vector<int> row(cols, 0);
    for (size_t i = 1; i <= a.size(); i++) {
        int diagonal = 0;               // row[0] from the previous row
        for (int j = 1; j < cols; j++) {
            int above = row[j];         // the previous row's value, still here
            if (a[i - 1] == b[j - 1]) {
                row[j] = diagonal + 1;
            } else {
                row[j] = std::max(above, row[j - 1]);
            }
            diagonal = above;           // for the next j
        }
    }
    return {row[cols - 1], cols + 1};
}

// The same, without the stash. row[j-1] has already been overwritten.
std::array<int, 2> oneRowBroken(const std::string &a, const std::string &b) {
    int cols = static_cast<int>(b.size()) + 1;
    std::vector<int> row(cols, 0);
    for (size_t i = 1; i <= a.size(); i++) {
        for (int j = 1; j < cols; j++) {
            if (a[i - 1] == b[j - 1]) {
                row[j] = row[j - 1] + 1;
            } else {
                row[j] = std::max(row[j], row[j - 1]);
            }
        }
    }
    return {row[cols - 1], cols};
}

// Every subsequence of a, checked for being a subsequence of b.
int bruteForce(const std::string &a, const std::string &b) {
    int best = 0;
    for (int mask = 0; mask < (1 << a.size()); mask++) {
        std::string pick;
        for (size_t i = 0; i < a.size(); i++) {
            if (mask >> i & 1) pick += a[i];
        }
        size_t j = 0;
        for (char ch : b) {
            if (j < pick.size() && pick[j] == ch) j++;
        }
        if (j == pick.size() && static_cast<int>(pick.size()) > best) best = static_cast<int>(pick.size());
    }
    return best;
}

std::string quoted(const std::string &text) {
    return "'" + text + "'";
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

static const std::array<std::string, 4> LABELS = {
    "the whole table", "two rows", "one row and one variable", "one row, no variable",
};

std::array<int, 2> run(int which, const std::string &a, const std::string &b) {
    if (which == 0) return fullTable(a, b);
    if (which == 1) return twoRows(a, b);
    if (which == 2) return oneRow(a, b);
    return oneRowBroken(a, b);
}

int main() {
    std::cout << "longest common subsequence of " << quoted(A) << " and " << quoted(B) << "\\n\\n";
    std::cout << std::left << std::setw(28) << "method" << std::right << std::setw(8) << "answer"
              << std::setw(12) << "cells held" << "\\n";
    for (int k = 0; k < 4; k++) {
        auto result = run(k, A, B);
        std::cout << std::left << std::setw(28) << LABELS[k] << std::right << std::setw(8) << result[0]
                  << std::setw(12) << result[1] << "\\n";
    }
    std::cout << std::left << std::setw(28) << "every subsequence, checked" << std::right
              << std::setw(8) << bruteForce(A, B) << "\\n\\n";

    const int TRIALS = 4000;
    std::array<int, 4> scores{};
    for (int t = 0; t < TRIALS; t++) {
        std::string a, b;
        int na = 1 + rnd(8);
        for (int i = 0; i < na; i++) a += static_cast<char>(65 + rnd(4));
        int nb = 1 + rnd(8);
        for (int i = 0; i < nb; i++) b += static_cast<char>(65 + rnd(4));
        int truth = bruteForce(a, b);
        for (int k = 0; k < 4; k++) {
            if (run(k, a, b)[0] == truth) scores[k]++;
        }
    }

    std::cout << "scored against every subsequence on " << TRIALS << " random string pairs:\\n";
    for (int k = 0; k < 4; k++) {
        std::cout << "  " << std::left << std::setw(28) << LABELS[k] << std::right << std::setw(6)
                  << scores[k] << "\\n";
    }
}
`,
            },
            {
              lang: "rust",
              code: `// A row of the table usually reads only the row above it. When that is true the
// rows below have nothing left to say to anything, and the table can be thrown
// away as it is built -- which is the whole of the space optimisation.
//
// Longest common subsequence, four ways. Three of them are right.

const A: &str = "AGGTAB";
const B: &str = "GXTXAYB";

/// Every cell kept. (len(a)+1) * (len(b)+1) of them.
fn full_table(a: &[u8], b: &[u8]) -> (i32, i32) {
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
    (table[rows - 1][cols - 1], (rows * cols) as i32)
}

/// Only the previous row is ever read, so only two rows need to exist.
fn two_rows(a: &[u8], b: &[u8]) -> (i32, i32) {
    let cols = b.len() + 1;
    let mut previous = vec![0i32; cols];
    let mut current = vec![0i32; cols];
    for i in 1..=a.len() {
        for j in 1..cols {
            current[j] = if a[i - 1] == b[j - 1] {
                previous[j - 1] + 1
            } else {
                previous[j].max(current[j - 1])
            };
        }
        std::mem::swap(&mut previous, &mut current);
    }
    (previous[cols - 1], (2 * cols) as i32)
}

/// One row, plus one saved value.
///
/// Writing row[j] destroys the diagonal that row[j+1] is about to need, so the
/// old row[j] is stashed before the write. That single variable is the whole
/// difference between this and the version below.
fn one_row(a: &[u8], b: &[u8]) -> (i32, i32) {
    let cols = b.len() + 1;
    let mut row = vec![0i32; cols];
    for i in 1..=a.len() {
        let mut diagonal = 0; // row[0] from the previous row
        for j in 1..cols {
            let above = row[j]; // the previous row's value, still here
            row[j] = if a[i - 1] == b[j - 1] {
                diagonal + 1
            } else {
                above.max(row[j - 1])
            };
            diagonal = above; // for the next j
        }
    }
    (row[cols - 1], (cols + 1) as i32)
}

/// The same, without the stash. row[j-1] has already been overwritten.
fn one_row_broken(a: &[u8], b: &[u8]) -> (i32, i32) {
    let cols = b.len() + 1;
    let mut row = vec![0i32; cols];
    for i in 1..=a.len() {
        for j in 1..cols {
            row[j] = if a[i - 1] == b[j - 1] {
                row[j - 1] + 1
            } else {
                row[j].max(row[j - 1])
            };
        }
    }
    (row[cols - 1], cols as i32)
}

/// Every subsequence of a, checked for being a subsequence of b.
fn brute_force(a: &[u8], b: &[u8]) -> i32 {
    let mut best = 0;
    for mask in 0..(1usize << a.len()) {
        let pick: Vec<u8> = (0..a.len()).filter(|i| mask >> i & 1 == 1).map(|i| a[i]).collect();
        let mut j = 0;
        for &ch in b {
            if j < pick.len() && pick[j] == ch {
                j += 1;
            }
        }
        if j == pick.len() && pick.len() as i32 > best {
            best = pick.len() as i32;
        }
    }
    best
}

fn quoted(text: &str) -> String {
    format!("'{}'", text)
}

fn rand(seed: &mut i64, n: i64) -> i32 {
    *seed = (*seed * 1103515245 + 12345) % 2147483648;
    (*seed / 65536 % n) as i32
}

const LABELS: [&str; 4] = [
    "the whole table", "two rows", "one row and one variable", "one row, no variable",
];

fn run(which: usize, a: &[u8], b: &[u8]) -> (i32, i32) {
    match which {
        0 => full_table(a, b),
        1 => two_rows(a, b),
        2 => one_row(a, b),
        _ => one_row_broken(a, b),
    }
}

fn main() {
    let a = A.as_bytes();
    let b = B.as_bytes();

    println!("longest common subsequence of {} and {}", quoted(A), quoted(B));
    println!();
    println!("{:<28}{:>8}{:>12}", "method", "answer", "cells held");
    for k in 0..4 {
        let (answer, cells) = run(k, a, b);
        println!("{:<28}{:>8}{:>12}", LABELS[k], answer, cells);
    }
    println!("{:<28}{:>8}", "every subsequence, checked", brute_force(a, b));
    println!();

    const TRIALS: i32 = 4000;
    let mut seed = 1i64;
    let mut scores = [0i32; 4];
    for _ in 0..TRIALS {
        let na = 1 + rand(&mut seed, 8);
        let sa: Vec<u8> = (0..na).map(|_| (65 + rand(&mut seed, 4)) as u8).collect();
        let nb = 1 + rand(&mut seed, 8);
        let sb: Vec<u8> = (0..nb).map(|_| (65 + rand(&mut seed, 4)) as u8).collect();
        let truth = brute_force(&sa, &sb);
        for k in 0..4 {
            if run(k, &sa, &sb).0 == truth {
                scores[k] += 1;
            }
        }
    }

    println!("scored against every subsequence on {} random string pairs:", TRIALS);
    for k in 0..4 {
        println!("  {:<28}{:>6}", LABELS[k], scores[k]);
    }
}
`,
            },
            {
              lang: "go",
              code: `// A row of the table usually reads only the row above it. When that is true the
// rows below have nothing left to say to anything, and the table can be thrown
// away as it is built -- which is the whole of the space optimisation.
//
// Longest common subsequence, four ways. Three of them are right.
package main

import "fmt"

const A = "AGGTAB"
const B = "GXTXAYB"

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

// Every cell kept. (len(a)+1) * (len(b)+1) of them.
func fullTable(a, b string) (int, int) {
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
	return table[rows-1][cols-1], rows * cols
}

// Only the previous row is ever read, so only two rows need to exist.
func twoRows(a, b string) (int, int) {
	cols := len(b) + 1
	previous := make([]int, cols)
	current := make([]int, cols)
	for i := 1; i <= len(a); i++ {
		for j := 1; j < cols; j++ {
			if a[i-1] == b[j-1] {
				current[j] = previous[j-1] + 1
			} else {
				current[j] = max(previous[j], current[j-1])
			}
		}
		previous, current = current, previous
	}
	return previous[cols-1], 2 * cols
}

// One row, plus one saved value.
//
// Writing row[j] destroys the diagonal that row[j+1] is about to need, so the
// old row[j] is stashed before the write. That single variable is the whole
// difference between this and the version below.
func oneRow(a, b string) (int, int) {
	cols := len(b) + 1
	row := make([]int, cols)
	for i := 1; i <= len(a); i++ {
		diagonal := 0 // row[0] from the previous row
		for j := 1; j < cols; j++ {
			above := row[j] // the previous row's value, still here
			if a[i-1] == b[j-1] {
				row[j] = diagonal + 1
			} else {
				row[j] = max(above, row[j-1])
			}
			diagonal = above // for the next j
		}
	}
	return row[cols-1], cols + 1
}

// The same, without the stash. row[j-1] has already been overwritten.
func oneRowBroken(a, b string) (int, int) {
	cols := len(b) + 1
	row := make([]int, cols)
	for i := 1; i <= len(a); i++ {
		for j := 1; j < cols; j++ {
			if a[i-1] == b[j-1] {
				row[j] = row[j-1] + 1
			} else {
				row[j] = max(row[j], row[j-1])
			}
		}
	}
	return row[cols-1], cols
}

// Every subsequence of a, checked for being a subsequence of b.
func bruteForce(a, b string) int {
	best := 0
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
		if j == len(pick) && len(pick) > best {
			best = len(pick)
		}
	}
	return best
}

func quoted(text string) string {
	return "'" + text + "'"
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

var LABELS = []string{
	"the whole table", "two rows", "one row and one variable", "one row, no variable",
}

func run(which int, a, b string) (int, int) {
	switch which {
	case 0:
		return fullTable(a, b)
	case 1:
		return twoRows(a, b)
	case 2:
		return oneRow(a, b)
	default:
		return oneRowBroken(a, b)
	}
}

func main() {
	fmt.Printf("longest common subsequence of %s and %s\\n", quoted(A), quoted(B))
	fmt.Println()
	fmt.Printf("%-28s%8s%12s\\n", "method", "answer", "cells held")
	for k := 0; k < 4; k++ {
		answer, cells := run(k, A, B)
		fmt.Printf("%-28s%8d%12d\\n", LABELS[k], answer, cells)
	}
	fmt.Printf("%-28s%8d\\n", "every subsequence, checked", bruteForce(A, B))
	fmt.Println()

	const TRIALS = 4000
	scores := [4]int{}
	for t := 0; t < TRIALS; t++ {
		a := ""
		na := 1 + rand(8)
		for i := 0; i < na; i++ {
			a += string(rune(65 + rand(4)))
		}
		b := ""
		nb := 1 + rand(8)
		for i := 0; i < nb; i++ {
			b += string(rune(65 + rand(4)))
		}
		truth := bruteForce(a, b)
		for k := 0; k < 4; k++ {
			if answer, _ := run(k, a, b); answer == truth {
				scores[k]++
			}
		}
	}

	fmt.Printf("scored against every subsequence on %d random string pairs:\\n", TRIALS)
	for k := 0; k < 4; k++ {
		fmt.Printf("  %-28s%6d\\n", LABELS[k], scores[k])
	}
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "dp-lcs-rolling",
        kind: "dp",
        algorithm: "lcs",
        title: "Watch which cells a row actually reads",
        lockAlgorithm: true,
      },
    },
    {
      id: "how-many-rows-to-keep",
      heading: "How many rows to keep is how far the transition reaches",
      body: [
        "How many rows to keep is not a matter of taste and it is not always two. It is exactly how far back the transition reaches, and that number is readable straight off the recurrence.",
        "Climbing a staircase where each step costs something and you may jump up to `k` steps at a time makes the point plainly: `dp[i]` reads `dp[i + 1]` through `dp[i + k]`, so `k` values have to be alive at once. Below, a ring buffer of `k` is checked against the whole array, and so is a ring of `k - 1`.",
        "A ring of `k` agrees with the whole array every time. A ring of `k - 1` agrees once out of five, and that once is a coincidence \u2014 for `k = 6` the sixth jump happens not to be worth taking.",
        "The interesting line is the last one. The too-small ring is not producing noise: it gives the answer to the `k - 1` problem, every single time, and the reason is arithmetic. Slot `(i + k) mod (k - 1)` is slot `(i + 1) mod (k - 1)`, so the longest jump reads the cell belonging to the shortest one, the longest jump stops being an option, and what remains is a correct solution to a smaller problem.",
        "So the rule is not \"keep two rows\". It is **keep as many as the transition reaches back**, and two happens to be the answer for most two-dimensional tables because their recurrences only ever look at `i - 1`. When the reach is longer, the count follows it; when the reach is across two indices rather than back along one, the fix is usually to reorder the loops until it is contiguous.",
      ],
      examples: [
        {
          id: "the-reach",
          title: "A ring buffer sized right, and sized one too small",
          lang: "python",
          code: `# How many rows you have to keep is not a matter of taste. It is exactly how far
# back the transition reaches, and that number is readable off the recurrence.
#
# Climbing a staircase where each step costs something and you may jump up to k
# steps at a time: dp[i] reads dp[i+1] through dp[i+k], so k values have to be
# alive at once and k-1 is not enough.

COSTS = [7, 2, 9, 4, 1, 8, 3, 6, 5, 2, 9, 1, 4, 7, 3, 8, 2, 6, 1, 5]
BIG = 10 ** 6


def full_array(k):
    """Every dp value kept: n + 1 of them."""
    n = len(COSTS)
    dp = [BIG] * (n + 1)
    dp[n] = 0
    for i in range(n - 1, -1, -1):
        best = BIG
        for jump in range(1, k + 1):
            if i + jump <= n and dp[i + jump] < best:
                best = dp[i + jump]
        dp[i] = COSTS[i] + best
    return dp[0], n + 1


def window(k, keep):
    """The same, holding only \`keep\` of the recent values in a ring."""
    n = len(COSTS)
    ring = [BIG] * keep
    ring[n % keep] = 0
    for i in range(n - 1, -1, -1):
        best = BIG
        for jump in range(1, k + 1):
            if i + jump <= n and ring[(i + jump) % keep] < best:
                best = ring[(i + jump) % keep]
        ring[i % keep] = COSTS[i] + best
    return ring[0], keep


print(f"{len(COSTS)} steps, costs [" + ", ".join(str(c) for c in COSTS) + "]")
print()
print(f"{'max jump k':>11}{'whole array':>13}{'ring of k':>11}{'ring of k-1':>13}{'cells: array':>14}{'ring':>6}")
for k in range(1, 7):
    whole, whole_cells = full_array(k)
    exact, exact_cells = window(k, k)
    short = window(k, k - 1)[0] if k > 1 else whole
    print(f"{k:>11}{whole:>13}{exact:>11}{short if k > 1 else whole:>13}{whole_cells:>14}{exact_cells:>6}")
print()

agree_exact = 0
agree_short = 0
checked = 0
for k in range(2, 7):
    whole = full_array(k)[0]
    checked += 1
    if window(k, k)[0] == whole:
        agree_exact += 1
    if window(k, k - 1)[0] == whole:
        agree_short += 1

# The too-small ring does not produce noise. Reading slot (i+k) mod (k-1) is
# reading slot (i+1), so the longest jump silently becomes the shortest one and
# the program solves the k-1 problem instead.
solves_smaller = 0
for k in range(2, 7):
    if window(k, k - 1)[0] == full_array(k - 1)[0]:
        solves_smaller += 1

print(f"of the {checked} values of k above 1:")
print(f"  a ring of k values agrees with the whole array   {agree_exact} times")
print(f"  a ring of k-1 values agrees                      {agree_short} times")
print(f"  a ring of k-1 values gives the k-1 answer        {solves_smaller} times")
print()
print("that last line is the shape of the bug: too small a window does not")
print("produce noise, it quietly solves a smaller problem, because the slot the")
print("longest jump wanted has already been reused by the shortest one.")
print()
print("so the rule is not 'keep two rows'. It is 'keep as many as the transition")
print("reaches back', and for a two-dimensional table that is usually one row")
print("because the recurrence only ever looks at i-1 -- not because two is special.")
`,
          output: `20 steps, costs [7, 2, 9, 4, 1, 8, 3, 6, 5, 2, 9, 1, 4, 7, 3, 8, 2, 6, 1, 5]

 max jump k  whole array  ring of k  ring of k-1  cells: array  ring
          1           93         93           93            21     1
          2           35         35           93            21     2
          3           22         22           35            21     3
          4           18         18           22            21     4
          5           13         13           18            21     5
          6           13         13           13            21     6

of the 5 values of k above 1:
  a ring of k values agrees with the whole array   5 times
  a ring of k-1 values agrees                      1 times
  a ring of k-1 values gives the k-1 answer        5 times

that last line is the shape of the bug: too small a window does not
produce noise, it quietly solves a smaller problem, because the slot the
longest jump wanted has already been reused by the shortest one.

so the rule is not 'keep two rows'. It is 'keep as many as the transition
reaches back', and for a two-dimensional table that is usually one row
because the recurrence only ever looks at i-1 -- not because two is special.`,
          explanation:
            "The staircase allows jumps of up to k, so the reach is a parameter rather than a constant and the right window size can be watched tracking it. The last check establishes what the too-small ring is actually computing, which turns out to be the k-1 problem exactly.",
          alternates: [
            {
              lang: "javascript",
              code: `// How many rows you have to keep is not a matter of taste. It is exactly how far
// back the transition reaches, and that number is readable off the recurrence.
//
// Climbing a staircase where each step costs something and you may jump up to k
// steps at a time: dp[i] reads dp[i+1] through dp[i+k], so k values have to be
// alive at once and k-1 is not enough.

const COSTS = [7, 2, 9, 4, 1, 8, 3, 6, 5, 2, 9, 1, 4, 7, 3, 8, 2, 6, 1, 5];
const BIG = 1000000;

/** Every dp value kept: n + 1 of them. */
function fullArray(k) {
  const n = COSTS.length;
  const dp = new Array(n + 1).fill(BIG);
  dp[n] = 0;
  for (let i = n - 1; i >= 0; i--) {
    let best = BIG;
    for (let jump = 1; jump <= k; jump++) {
      if (i + jump <= n && dp[i + jump] < best) best = dp[i + jump];
    }
    dp[i] = COSTS[i] + best;
  }
  return [dp[0], n + 1];
}

/** The same, holding only \`keep\` of the recent values in a ring. */
function window(k, keep) {
  const n = COSTS.length;
  const ring = new Array(keep).fill(BIG);
  ring[n % keep] = 0;
  for (let i = n - 1; i >= 0; i--) {
    let best = BIG;
    for (let jump = 1; jump <= k; jump++) {
      if (i + jump <= n && ring[(i + jump) % keep] < best) best = ring[(i + jump) % keep];
    }
    ring[i % keep] = COSTS[i] + best;
  }
  return [ring[0], keep];
}

const pad = (v, w) => String(v).padStart(w);

console.log(\`\${COSTS.length} steps, costs [\${COSTS.join(", ")}]\`);
console.log();
console.log(
  pad("max jump k", 11) + pad("whole array", 13) + pad("ring of k", 11) + pad("ring of k-1", 13) +
    pad("cells: array", 14) + pad("ring", 6)
);
for (let k = 1; k <= 6; k++) {
  const [whole, wholeCells] = fullArray(k);
  const [exact, exactCells] = window(k, k);
  const shortRing = k > 1 ? window(k, k - 1)[0] : whole;
  console.log(
    pad(k, 11) + pad(whole, 13) + pad(exact, 11) + pad(shortRing, 13) + pad(wholeCells, 14) +
      pad(exactCells, 6)
  );
}
console.log();

let agreeExact = 0;
let agreeShort = 0;
let checked = 0;
for (let k = 2; k <= 6; k++) {
  const whole = fullArray(k)[0];
  checked++;
  if (window(k, k)[0] === whole) agreeExact++;
  if (window(k, k - 1)[0] === whole) agreeShort++;
}

// The too-small ring does not produce noise. Reading slot (i+k) mod (k-1) is
// reading slot (i+1), so the longest jump silently becomes the shortest one and
// the program solves the k-1 problem instead.
let solvesSmaller = 0;
for (let k = 2; k <= 6; k++) {
  if (window(k, k - 1)[0] === fullArray(k - 1)[0]) solvesSmaller++;
}

console.log(\`of the \${checked} values of k above 1:\`);
console.log(\`  a ring of k values agrees with the whole array   \${agreeExact} times\`);
console.log(\`  a ring of k-1 values agrees                      \${agreeShort} times\`);
console.log(\`  a ring of k-1 values gives the k-1 answer        \${solvesSmaller} times\`);
console.log();
console.log("that last line is the shape of the bug: too small a window does not");
console.log("produce noise, it quietly solves a smaller problem, because the slot the");
console.log("longest jump wanted has already been reused by the shortest one.");
console.log();
console.log("so the rule is not 'keep two rows'. It is 'keep as many as the transition");
console.log("reaches back', and for a two-dimensional table that is usually one row");
console.log("because the recurrence only ever looks at i-1 -- not because two is special.");
`,
            },
            {
              lang: "typescript",
              code: `// How many rows you have to keep is not a matter of taste. It is exactly how far
// back the transition reaches, and that number is readable off the recurrence.
//
// Climbing a staircase where each step costs something and you may jump up to k
// steps at a time: dp[i] reads dp[i+1] through dp[i+k], so k values have to be
// alive at once and k-1 is not enough.

const COSTS = [7, 2, 9, 4, 1, 8, 3, 6, 5, 2, 9, 1, 4, 7, 3, 8, 2, 6, 1, 5];
const BIG = 1000000;

/** Every dp value kept: n + 1 of them. */
function fullArray(k: number): [number, number] {
  const n = COSTS.length;
  const dp = new Array(n + 1).fill(BIG);
  dp[n] = 0;
  for (let i = n - 1; i >= 0; i--) {
    let best = BIG;
    for (let jump = 1; jump <= k; jump++) {
      if (i + jump <= n && dp[i + jump] < best) best = dp[i + jump];
    }
    dp[i] = COSTS[i] + best;
  }
  return [dp[0], n + 1];
}

/** The same, holding only \`keep\` of the recent values in a ring. */
function window(k: number, keep: number): [number, number] {
  const n = COSTS.length;
  const ring = new Array(keep).fill(BIG);
  ring[n % keep] = 0;
  for (let i = n - 1; i >= 0; i--) {
    let best = BIG;
    for (let jump = 1; jump <= k; jump++) {
      if (i + jump <= n && ring[(i + jump) % keep] < best) best = ring[(i + jump) % keep];
    }
    ring[i % keep] = COSTS[i] + best;
  }
  return [ring[0], keep];
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);

console.log(\`\${COSTS.length} steps, costs [\${COSTS.join(", ")}]\`);
console.log();
console.log(
  pad("max jump k", 11) + pad("whole array", 13) + pad("ring of k", 11) + pad("ring of k-1", 13) +
    pad("cells: array", 14) + pad("ring", 6)
);
for (let k = 1; k <= 6; k++) {
  const [whole, wholeCells] = fullArray(k);
  const [exact, exactCells] = window(k, k);
  const shortRing = k > 1 ? window(k, k - 1)[0] : whole;
  console.log(
    pad(k, 11) + pad(whole, 13) + pad(exact, 11) + pad(shortRing, 13) + pad(wholeCells, 14) +
      pad(exactCells, 6)
  );
}
console.log();

let agreeExact = 0;
let agreeShort = 0;
let checked = 0;
for (let k = 2; k <= 6; k++) {
  const whole = fullArray(k)[0];
  checked++;
  if (window(k, k)[0] === whole) agreeExact++;
  if (window(k, k - 1)[0] === whole) agreeShort++;
}

// The too-small ring does not produce noise. Reading slot (i+k) mod (k-1) is
// reading slot (i+1), so the longest jump silently becomes the shortest one and
// the program solves the k-1 problem instead.
let solvesSmaller = 0;
for (let k = 2; k <= 6; k++) {
  if (window(k, k - 1)[0] === fullArray(k - 1)[0]) solvesSmaller++;
}

console.log(\`of the \${checked} values of k above 1:\`);
console.log(\`  a ring of k values agrees with the whole array   \${agreeExact} times\`);
console.log(\`  a ring of k-1 values agrees                      \${agreeShort} times\`);
console.log(\`  a ring of k-1 values gives the k-1 answer        \${solvesSmaller} times\`);
console.log();
console.log("that last line is the shape of the bug: too small a window does not");
console.log("produce noise, it quietly solves a smaller problem, because the slot the");
console.log("longest jump wanted has already been reused by the shortest one.");
console.log();
console.log("so the rule is not 'keep two rows'. It is 'keep as many as the transition");
console.log("reaches back', and for a two-dimensional table that is usually one row");
console.log("because the recurrence only ever looks at i-1 -- not because two is special.");
`,
            },
            {
              lang: "java",
              code: `// How many rows you have to keep is not a matter of taste. It is exactly how far
// back the transition reaches, and that number is readable off the recurrence.
//
// Climbing a staircase where each step costs something and you may jump up to k
// steps at a time: dp[i] reads dp[i+1] through dp[i+k], so k values have to be
// alive at once and k-1 is not enough.
public class Main {
    static final int[] COSTS = { 7, 2, 9, 4, 1, 8, 3, 6, 5, 2, 9, 1, 4, 7, 3, 8, 2, 6, 1, 5 };
    static final int BIG = 1000000;

    /** Every dp value kept: n + 1 of them. */
    static int[] fullArray(int k) {
        int n = COSTS.length;
        int[] dp = new int[n + 1];
        for (int i = 0; i < n; i++) dp[i] = BIG;
        dp[n] = 0;
        for (int i = n - 1; i >= 0; i--) {
            int best = BIG;
            for (int jump = 1; jump <= k; jump++) {
                if (i + jump <= n && dp[i + jump] < best) best = dp[i + jump];
            }
            dp[i] = COSTS[i] + best;
        }
        return new int[] { dp[0], n + 1 };
    }

    /** The same, holding only \`keep\` of the recent values in a ring. */
    static int[] window(int k, int keep) {
        int n = COSTS.length;
        int[] ring = new int[keep];
        for (int i = 0; i < keep; i++) ring[i] = BIG;
        ring[n % keep] = 0;
        for (int i = n - 1; i >= 0; i--) {
            int best = BIG;
            for (int jump = 1; jump <= k; jump++) {
                if (i + jump <= n && ring[(i + jump) % keep] < best) best = ring[(i + jump) % keep];
            }
            ring[i % keep] = COSTS[i] + best;
        }
        return new int[] { ring[0], keep };
    }

    public static void main(String[] args) {
        StringBuilder costs = new StringBuilder();
        for (int i = 0; i < COSTS.length; i++) {
            if (i > 0) costs.append(", ");
            costs.append(COSTS[i]);
        }
        System.out.printf("%d steps, costs [%s]%n", COSTS.length, costs);
        System.out.println();
        System.out.printf("%11s%13s%11s%13s%14s%6s%n", "max jump k", "whole array", "ring of k",
            "ring of k-1", "cells: array", "ring");
        for (int k = 1; k <= 6; k++) {
            int[] whole = fullArray(k);
            int[] exact = window(k, k);
            int shortRing = k > 1 ? window(k, k - 1)[0] : whole[0];
            System.out.printf("%11d%13d%11d%13d%14d%6d%n", k, whole[0], exact[0], shortRing,
                whole[1], exact[1]);
        }
        System.out.println();

        int agreeExact = 0;
        int agreeShort = 0;
        int checked = 0;
        for (int k = 2; k <= 6; k++) {
            int whole = fullArray(k)[0];
            checked++;
            if (window(k, k)[0] == whole) agreeExact++;
            if (window(k, k - 1)[0] == whole) agreeShort++;
        }

        // The too-small ring does not produce noise. Reading slot (i+k) mod (k-1)
        // is reading slot (i+1), so the longest jump silently becomes the
        // shortest one and the program solves the k-1 problem instead.
        int solvesSmaller = 0;
        for (int k = 2; k <= 6; k++) {
            if (window(k, k - 1)[0] == fullArray(k - 1)[0]) solvesSmaller++;
        }

        System.out.printf("of the %d values of k above 1:%n", checked);
        System.out.printf("  a ring of k values agrees with the whole array   %d times%n", agreeExact);
        System.out.printf("  a ring of k-1 values agrees                      %d times%n", agreeShort);
        System.out.printf("  a ring of k-1 values gives the k-1 answer        %d times%n", solvesSmaller);
        System.out.println();
        System.out.println("that last line is the shape of the bug: too small a window does not");
        System.out.println("produce noise, it quietly solves a smaller problem, because the slot the");
        System.out.println("longest jump wanted has already been reused by the shortest one.");
        System.out.println();
        System.out.println("so the rule is not 'keep two rows'. It is 'keep as many as the transition");
        System.out.println("reaches back', and for a two-dimensional table that is usually one row");
        System.out.println("because the recurrence only ever looks at i-1 -- not because two is special.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// How many rows you have to keep is not a matter of taste. It is exactly how far
// back the transition reaches, and that number is readable off the recurrence.
//
// Climbing a staircase where each step costs something and you may jump up to k
// steps at a time: dp[i] reads dp[i+1] through dp[i+k], so k values have to be
// alive at once and k-1 is not enough.
#include <array>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

static const std::vector<int> COSTS = {7, 2, 9, 4, 1, 8, 3, 6, 5, 2,
                                       9, 1, 4, 7, 3, 8, 2, 6, 1, 5};
static const int BIG = 1000000;

// Every dp value kept: n + 1 of them.
std::array<int, 2> fullArray(int k) {
    int n = static_cast<int>(COSTS.size());
    std::vector<int> dp(n + 1, BIG);
    dp[n] = 0;
    for (int i = n - 1; i >= 0; i--) {
        int best = BIG;
        for (int jump = 1; jump <= k; jump++) {
            if (i + jump <= n && dp[i + jump] < best) best = dp[i + jump];
        }
        dp[i] = COSTS[i] + best;
    }
    return {dp[0], n + 1};
}

// The same, holding only \`keep\` of the recent values in a ring.
std::array<int, 2> window(int k, int keep) {
    int n = static_cast<int>(COSTS.size());
    std::vector<int> ring(keep, BIG);
    ring[n % keep] = 0;
    for (int i = n - 1; i >= 0; i--) {
        int best = BIG;
        for (int jump = 1; jump <= k; jump++) {
            if (i + jump <= n && ring[(i + jump) % keep] < best) best = ring[(i + jump) % keep];
        }
        ring[i % keep] = COSTS[i] + best;
    }
    return {ring[0], keep};
}

int main() {
    std::cout << COSTS.size() << " steps, costs [";
    for (size_t i = 0; i < COSTS.size(); i++) {
        if (i > 0) std::cout << ", ";
        std::cout << COSTS[i];
    }
    std::cout << "]\\n\\n";
    std::cout << std::right << std::setw(11) << "max jump k" << std::setw(13) << "whole array"
              << std::setw(11) << "ring of k" << std::setw(13) << "ring of k-1"
              << std::setw(14) << "cells: array" << std::setw(6) << "ring" << "\\n";
    for (int k = 1; k <= 6; k++) {
        auto whole = fullArray(k);
        auto exact = window(k, k);
        int shortRing = k > 1 ? window(k, k - 1)[0] : whole[0];
        std::cout << std::right << std::setw(11) << k << std::setw(13) << whole[0]
                  << std::setw(11) << exact[0] << std::setw(13) << shortRing
                  << std::setw(14) << whole[1] << std::setw(6) << exact[1] << "\\n";
    }
    std::cout << "\\n";

    int agreeExact = 0, agreeShort = 0, checked = 0;
    for (int k = 2; k <= 6; k++) {
        int whole = fullArray(k)[0];
        checked++;
        if (window(k, k)[0] == whole) agreeExact++;
        if (window(k, k - 1)[0] == whole) agreeShort++;
    }

    // The too-small ring does not produce noise. Reading slot (i+k) mod (k-1) is
    // reading slot (i+1), so the longest jump silently becomes the shortest one
    // and the program solves the k-1 problem instead.
    int solvesSmaller = 0;
    for (int k = 2; k <= 6; k++) {
        if (window(k, k - 1)[0] == fullArray(k - 1)[0]) solvesSmaller++;
    }

    std::cout << "of the " << checked << " values of k above 1:\\n";
    std::cout << "  a ring of k values agrees with the whole array   " << agreeExact << " times\\n";
    std::cout << "  a ring of k-1 values agrees                      " << agreeShort << " times\\n";
    std::cout << "  a ring of k-1 values gives the k-1 answer        " << solvesSmaller << " times\\n\\n";
    std::cout << "that last line is the shape of the bug: too small a window does not\\n";
    std::cout << "produce noise, it quietly solves a smaller problem, because the slot the\\n";
    std::cout << "longest jump wanted has already been reused by the shortest one.\\n\\n";
    std::cout << "so the rule is not 'keep two rows'. It is 'keep as many as the transition\\n";
    std::cout << "reaches back', and for a two-dimensional table that is usually one row\\n";
    std::cout << "because the recurrence only ever looks at i-1 -- not because two is special.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// How many rows you have to keep is not a matter of taste. It is exactly how far
// back the transition reaches, and that number is readable off the recurrence.
//
// Climbing a staircase where each step costs something and you may jump up to k
// steps at a time: dp[i] reads dp[i+1] through dp[i+k], so k values have to be
// alive at once and k-1 is not enough.

const COSTS: [i32; 20] = [7, 2, 9, 4, 1, 8, 3, 6, 5, 2, 9, 1, 4, 7, 3, 8, 2, 6, 1, 5];
const BIG: i32 = 1000000;

/// Every dp value kept: n + 1 of them.
fn full_array(k: usize) -> (i32, i32) {
    let n = COSTS.len();
    let mut dp = vec![BIG; n + 1];
    dp[n] = 0;
    for i in (0..n).rev() {
        let mut best = BIG;
        for jump in 1..=k {
            if i + jump <= n && dp[i + jump] < best {
                best = dp[i + jump];
            }
        }
        dp[i] = COSTS[i] + best;
    }
    (dp[0], (n + 1) as i32)
}

/// The same, holding only \`keep\` of the recent values in a ring.
fn window(k: usize, keep: usize) -> (i32, i32) {
    let n = COSTS.len();
    let mut ring = vec![BIG; keep];
    ring[n % keep] = 0;
    for i in (0..n).rev() {
        let mut best = BIG;
        for jump in 1..=k {
            if i + jump <= n && ring[(i + jump) % keep] < best {
                best = ring[(i + jump) % keep];
            }
        }
        ring[i % keep] = COSTS[i] + best;
    }
    (ring[0], keep as i32)
}

fn main() {
    let costs: Vec<String> = COSTS.iter().map(|c| c.to_string()).collect();
    println!("{} steps, costs [{}]", COSTS.len(), costs.join(", "));
    println!();
    println!("{:>11}{:>13}{:>11}{:>13}{:>14}{:>6}", "max jump k", "whole array", "ring of k",
        "ring of k-1", "cells: array", "ring");
    for k in 1..=6usize {
        let (whole, whole_cells) = full_array(k);
        let (exact, exact_cells) = window(k, k);
        let short_ring = if k > 1 { window(k, k - 1).0 } else { whole };
        println!("{:>11}{:>13}{:>11}{:>13}{:>14}{:>6}", k, whole, exact, short_ring, whole_cells, exact_cells);
    }
    println!();

    let mut agree_exact = 0;
    let mut agree_short = 0;
    let mut checked = 0;
    for k in 2..=6usize {
        let whole = full_array(k).0;
        checked += 1;
        if window(k, k).0 == whole {
            agree_exact += 1;
        }
        if window(k, k - 1).0 == whole {
            agree_short += 1;
        }
    }

    // The too-small ring does not produce noise. Reading slot (i+k) mod (k-1) is
    // reading slot (i+1), so the longest jump silently becomes the shortest one
    // and the program solves the k-1 problem instead.
    let mut solves_smaller = 0;
    for k in 2..=6usize {
        if window(k, k - 1).0 == full_array(k - 1).0 {
            solves_smaller += 1;
        }
    }

    println!("of the {} values of k above 1:", checked);
    println!("  a ring of k values agrees with the whole array   {} times", agree_exact);
    println!("  a ring of k-1 values agrees                      {} times", agree_short);
    println!("  a ring of k-1 values gives the k-1 answer        {} times", solves_smaller);
    println!();
    println!("that last line is the shape of the bug: too small a window does not");
    println!("produce noise, it quietly solves a smaller problem, because the slot the");
    println!("longest jump wanted has already been reused by the shortest one.");
    println!();
    println!("so the rule is not 'keep two rows'. It is 'keep as many as the transition");
    println!("reaches back', and for a two-dimensional table that is usually one row");
    println!("because the recurrence only ever looks at i-1 -- not because two is special.");
}
`,
            },
            {
              lang: "go",
              code: `// How many rows you have to keep is not a matter of taste. It is exactly how far
// back the transition reaches, and that number is readable off the recurrence.
//
// Climbing a staircase where each step costs something and you may jump up to k
// steps at a time: dp[i] reads dp[i+1] through dp[i+k], so k values have to be
// alive at once and k-1 is not enough.
package main

import (
	"fmt"
	"strconv"
	"strings"
)

var COSTS = []int{7, 2, 9, 4, 1, 8, 3, 6, 5, 2, 9, 1, 4, 7, 3, 8, 2, 6, 1, 5}

const BIG = 1000000

// Every dp value kept: n + 1 of them.
func fullArray(k int) (int, int) {
	n := len(COSTS)
	dp := make([]int, n+1)
	for i := 0; i < n; i++ {
		dp[i] = BIG
	}
	dp[n] = 0
	for i := n - 1; i >= 0; i-- {
		best := BIG
		for jump := 1; jump <= k; jump++ {
			if i+jump <= n && dp[i+jump] < best {
				best = dp[i+jump]
			}
		}
		dp[i] = COSTS[i] + best
	}
	return dp[0], n + 1
}

// The same, holding only \`keep\` of the recent values in a ring.
func window(k, keep int) (int, int) {
	n := len(COSTS)
	ring := make([]int, keep)
	for i := range ring {
		ring[i] = BIG
	}
	ring[n%keep] = 0
	for i := n - 1; i >= 0; i-- {
		best := BIG
		for jump := 1; jump <= k; jump++ {
			if i+jump <= n && ring[(i+jump)%keep] < best {
				best = ring[(i+jump)%keep]
			}
		}
		ring[i%keep] = COSTS[i] + best
	}
	return ring[0], keep
}

func main() {
	parts := make([]string, len(COSTS))
	for i, c := range COSTS {
		parts[i] = strconv.Itoa(c)
	}
	fmt.Printf("%d steps, costs [%s]\\n", len(COSTS), strings.Join(parts, ", "))
	fmt.Println()
	fmt.Printf("%11s%13s%11s%13s%14s%6s\\n", "max jump k", "whole array", "ring of k",
		"ring of k-1", "cells: array", "ring")
	for k := 1; k <= 6; k++ {
		whole, wholeCells := fullArray(k)
		exact, exactCells := window(k, k)
		shortRing := whole
		if k > 1 {
			shortRing, _ = window(k, k-1)
		}
		fmt.Printf("%11d%13d%11d%13d%14d%6d\\n", k, whole, exact, shortRing, wholeCells, exactCells)
	}
	fmt.Println()

	agreeExact, agreeShort, checked := 0, 0, 0
	for k := 2; k <= 6; k++ {
		whole, _ := fullArray(k)
		checked++
		if exact, _ := window(k, k); exact == whole {
			agreeExact++
		}
		if short, _ := window(k, k-1); short == whole {
			agreeShort++
		}
	}

	// The too-small ring does not produce noise. Reading slot (i+k) mod (k-1) is
	// reading slot (i+1), so the longest jump silently becomes the shortest one
	// and the program solves the k-1 problem instead.
	solvesSmaller := 0
	for k := 2; k <= 6; k++ {
		short, _ := window(k, k-1)
		smaller, _ := fullArray(k - 1)
		if short == smaller {
			solvesSmaller++
		}
	}

	fmt.Printf("of the %d values of k above 1:\\n", checked)
	fmt.Printf("  a ring of k values agrees with the whole array   %d times\\n", agreeExact)
	fmt.Printf("  a ring of k-1 values agrees                      %d times\\n", agreeShort)
	fmt.Printf("  a ring of k-1 values gives the k-1 answer        %d times\\n", solvesSmaller)
	fmt.Println()
	fmt.Println("that last line is the shape of the bug: too small a window does not")
	fmt.Println("produce noise, it quietly solves a smaller problem, because the slot the")
	fmt.Println("longest jump wanted has already been reused by the shortest one.")
	fmt.Println()
	fmt.Println("so the rule is not 'keep two rows'. It is 'keep as many as the transition")
	fmt.Println("reaches back', and for a two-dimensional table that is usually one row")
	fmt.Println("because the recurrence only ever looks at i-1 -- not because two is special.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "\"Keep two rows\" is a special case, not a rule",
          body: "Two is right for the usual two-dimensional table because its recurrence reads only `i - 1`. A transition that reaches back three rows needs three, and a ring sized for two will run happily and answer a different question. Read the reach off the recurrence rather than off habit.",
        },
        {
          title: "A ring buffer aliases silently",
          body: "Sizing a ring one too small does not produce garbage, it produces the answer to a smaller problem, because the slot the longest transition wanted has already been reused by the shortest. There is no bounds error to catch, which is why the size has to be argued rather than tried.",
        },
      ],
    },
    {
      id: "what-it-costs",
      heading: "What it saves, and what it takes away",
      body: [
        "At the sizes where any of this matters, the saving is not a nicety. Two strings of six hundred and eight hundred characters give a table of nearly half a million cells; one row is eight hundred and two.",
        "And it is worth being explicit about what is being traded away, because \"optimisation\" makes it sound free. A rolling array keeps the answer and throws away the working.",
        "Six hundred times less memory for the same 406. At this size the full table is about two megabytes and nobody cares; at fifty thousand characters a side it is two and a half billion cells and the program does not start, which is the case the optimisation actually exists for.",
        "The block underneath is the price. From the full table you can walk backwards and recover the edits themselves \u2014 808 steps, 406 of them real edits, and replaying them on the first string produces the second exactly. From the one-row version you have the number 406 and nothing else, because every cell the traceback would have read was overwritten as the algorithm ran.",
        "Which is a genuine tension rather than an inconvenience: **the space optimisation and the ability to reconstruct the answer are in direct conflict**, and if the question was \"which edits?\" rather than \"how many?\" you have optimised away the thing you were asked for. The next lesson is about having both.",
      ],
      examples: [
        {
          id: "the-trade",
          title: "The same distance at three widths, and the edits only one of them can name",
          lang: "python",
          code: `# What the optimisation costs, at a size where it obviously matters, and what it
# takes away in exchange.
#
# A rolling array keeps the answer and throws away the working. That is fine
# when the answer is a number, and it is exactly wrong when the question was
# "and what were the edits?" -- which is the next lesson's subject.

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


A = "".join(chr(97 + rand(4)) for _ in range(600))
B = "".join(chr(97 + rand(4)) for _ in range(800))


def full_table():
    rows = len(A) + 1
    cols = len(B) + 1
    table = [[0] * cols for _ in range(rows)]
    for j in range(cols):
        table[0][j] = j
    for i in range(1, rows):
        table[i][0] = i
        for j in range(1, cols):
            if A[i - 1] == B[j - 1]:
                table[i][j] = table[i - 1][j - 1]
            else:
                table[i][j] = 1 + min(table[i - 1][j - 1], table[i - 1][j], table[i][j - 1])
    return table


def two_rows():
    cols = len(B) + 1
    previous = list(range(cols))
    current = [0] * cols
    for i in range(1, len(A) + 1):
        current[0] = i
        for j in range(1, cols):
            if A[i - 1] == B[j - 1]:
                current[j] = previous[j - 1]
            else:
                current[j] = 1 + min(previous[j - 1], previous[j], current[j - 1])
        previous, current = current, previous
    return previous[cols - 1]


def one_row():
    cols = len(B) + 1
    row = list(range(cols))
    for i in range(1, len(A) + 1):
        diagonal = row[0]
        row[0] = i
        for j in range(1, cols):
            above = row[j]
            if A[i - 1] == B[j - 1]:
                row[j] = diagonal
            else:
                row[j] = 1 + min(diagonal, above, row[j - 1])
            diagonal = above
    return row[cols - 1]


def script(table):
    """Walk the finished table backwards to recover the edits themselves."""
    i = len(A)
    j = len(B)
    steps = []
    while i > 0 or j > 0:
        if i > 0 and j > 0 and A[i - 1] == B[j - 1] and table[i][j] == table[i - 1][j - 1]:
            steps.append(("keep", A[i - 1]))
            i -= 1
            j -= 1
        elif i > 0 and j > 0 and table[i][j] == table[i - 1][j - 1] + 1:
            steps.append(("swap", A[i - 1] + B[j - 1]))
            i -= 1
            j -= 1
        elif i > 0 and table[i][j] == table[i - 1][j] + 1:
            steps.append(("drop", A[i - 1]))
            i -= 1
        else:
            steps.append(("add", B[j - 1]))
            j -= 1
    steps.reverse()
    return steps


def replay(steps):
    """Apply the script to A and see whether B falls out."""
    out = []
    at = 0
    for kind, text in steps:
        if kind == "keep":
            out.append(A[at])
            at += 1
        elif kind == "swap":
            out.append(text[1])
            at += 1
        elif kind == "drop":
            at += 1
        else:
            out.append(text)
    return "".join(out), at


rows = len(A) + 1
cols = len(B) + 1
table = full_table()
distance = table[rows - 1][cols - 1]

print(f"turning a {len(A)}-character string into an {len(B)}-character one")
print()
print(f"{'method':<28}{'answer':>8}{'cells held':>12}{'against the table':>20}")
print(f"{'the whole table':<28}{distance:>8}{rows * cols:>12}{'1x':>20}")
print(f"{'two rows':<28}{two_rows():>8}{2 * cols:>12}{f'{rows * cols // (2 * cols)}x less':>20}")
print(f"{'one row and one variable':<28}{one_row():>8}{cols + 1:>12}{f'{rows * cols // (cols + 1)}x less':>20}")
print()

steps = script(table)
edits = sum(1 for kind, _ in steps if kind != "keep")
rebuilt, consumed = replay(steps)
print("and this is what the two smaller versions can no longer answer:")
print("  the first twelve edits: " + ", ".join(f"{k} {t}" for k, t in steps[:12]))
print(f"  the script has {len(steps)} steps, {edits} of them real edits")
print(f"  replaying it on the first string reads all {consumed} of its characters")
print(f"  and produces the second string exactly: {'yes' if rebuilt == B else 'no'}")
print(f"  {edits} edits, and the table said the distance was {distance}")
`,
          output: `turning a 600-character string into an 800-character one

method                        answer  cells held   against the table
the whole table                  406      481401                  1x
two rows                         406        1602           300x less
one row and one variable         406         802           600x less

and this is what the two smaller versions can no longer answer:
  the first twelve edits: drop c, swap ca, keep b, keep d, swap da, swap da, swap cd, keep d, keep a, keep c, keep b, drop d
  the script has 808 steps, 406 of them real edits
  replaying it on the first string reads all 600 of its characters
  and produces the second string exactly: yes
  406 edits, and the table said the distance was 406`,
          explanation:
            "The three methods are checked against each other on a pair of strings large enough for the ratio to mean something. The traceback is then verified rather than trusted: the script it recovers is replayed against the first string, and the result compared with the second character for character.",
          alternates: [
            {
              lang: "javascript",
              code: `// What the optimisation costs, at a size where it obviously matters, and what it
// takes away in exchange.
//
// A rolling array keeps the answer and throws away the working. That is fine
// when the answer is a number, and it is exactly wrong when the question was
// "and what were the edits?" -- which is the next lesson's subject.

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

let A = "";
for (let i = 0; i < 600; i++) A += String.fromCharCode(97 + rand(4));
let B = "";
for (let i = 0; i < 800; i++) B += String.fromCharCode(97 + rand(4));

function fullTable() {
  const rows = A.length + 1;
  const cols = B.length + 1;
  const table = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let j = 0; j < cols; j++) table[0][j] = j;
  for (let i = 1; i < rows; i++) {
    table[i][0] = i;
    for (let j = 1; j < cols; j++) {
      if (A[i - 1] === B[j - 1]) {
        table[i][j] = table[i - 1][j - 1];
      } else {
        table[i][j] = 1 + Math.min(table[i - 1][j - 1], table[i - 1][j], table[i][j - 1]);
      }
    }
  }
  return table;
}

function twoRows() {
  const cols = B.length + 1;
  let previous = Array.from({ length: cols }, (_, j) => j);
  let current = new Array(cols).fill(0);
  for (let i = 1; i <= A.length; i++) {
    current[0] = i;
    for (let j = 1; j < cols; j++) {
      if (A[i - 1] === B[j - 1]) {
        current[j] = previous[j - 1];
      } else {
        current[j] = 1 + Math.min(previous[j - 1], previous[j], current[j - 1]);
      }
    }
    const swap = previous;
    previous = current;
    current = swap;
  }
  return previous[cols - 1];
}

function oneRow() {
  const cols = B.length + 1;
  const row = Array.from({ length: cols }, (_, j) => j);
  for (let i = 1; i <= A.length; i++) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j < cols; j++) {
      const above = row[j];
      if (A[i - 1] === B[j - 1]) {
        row[j] = diagonal;
      } else {
        row[j] = 1 + Math.min(diagonal, above, row[j - 1]);
      }
      diagonal = above;
    }
  }
  return row[cols - 1];
}

/** Walk the finished table backwards to recover the edits themselves. */
function script(table) {
  let i = A.length;
  let j = B.length;
  const steps = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && A[i - 1] === B[j - 1] && table[i][j] === table[i - 1][j - 1]) {
      steps.push(["keep", A[i - 1]]);
      i--;
      j--;
    } else if (i > 0 && j > 0 && table[i][j] === table[i - 1][j - 1] + 1) {
      steps.push(["swap", A[i - 1] + B[j - 1]]);
      i--;
      j--;
    } else if (i > 0 && table[i][j] === table[i - 1][j] + 1) {
      steps.push(["drop", A[i - 1]]);
      i--;
    } else {
      steps.push(["add", B[j - 1]]);
      j--;
    }
  }
  steps.reverse();
  return steps;
}

/** Apply the script to A and see whether B falls out. */
function replay(steps) {
  const out = [];
  let at = 0;
  for (const [kind, text] of steps) {
    if (kind === "keep") {
      out.push(A[at]);
      at++;
    } else if (kind === "swap") {
      out.push(text[1]);
      at++;
    } else if (kind === "drop") {
      at++;
    } else {
      out.push(text);
    }
  }
  return [out.join(""), at];
}

const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);

const rows = A.length + 1;
const cols = B.length + 1;
const table = fullTable();
const distance = table[rows - 1][cols - 1];

console.log(\`turning a \${A.length}-character string into an \${B.length}-character one\`);
console.log();
console.log(padEnd("method", 28) + pad("answer", 8) + pad("cells held", 12) + pad("against the table", 20));
console.log(padEnd("the whole table", 28) + pad(distance, 8) + pad(rows * cols, 12) + pad("1x", 20));
console.log(
  padEnd("two rows", 28) + pad(twoRows(), 8) + pad(2 * cols, 12) +
    pad(\`\${Math.floor((rows * cols) / (2 * cols))}x less\`, 20)
);
console.log(
  padEnd("one row and one variable", 28) + pad(oneRow(), 8) + pad(cols + 1, 12) +
    pad(\`\${Math.floor((rows * cols) / (cols + 1))}x less\`, 20)
);
console.log();

const steps = script(table);
const edits = steps.filter(([kind]) => kind !== "keep").length;
const [rebuilt, consumed] = replay(steps);

console.log("and this is what the two smaller versions can no longer answer:");
console.log("  the first twelve edits: " + steps.slice(0, 12).map(([k, t]) => \`\${k} \${t}\`).join(", "));
console.log(\`  the script has \${steps.length} steps, \${edits} of them real edits\`);
console.log(\`  replaying it on the first string reads all \${consumed} of its characters\`);
console.log(\`  and produces the second string exactly: \${rebuilt === B ? "yes" : "no"}\`);
console.log(\`  \${edits} edits, and the table said the distance was \${distance}\`);
`,
            },
            {
              lang: "typescript",
              code: `// What the optimisation costs, at a size where it obviously matters, and what it
// takes away in exchange.
//
// A rolling array keeps the answer and throws away the working. That is fine
// when the answer is a number, and it is exactly wrong when the question was
// "and what were the edits?" -- which is the next lesson's subject.

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

let A = "";
for (let i = 0; i < 600; i++) A += String.fromCharCode(97 + rand(4));
let B = "";
for (let i = 0; i < 800; i++) B += String.fromCharCode(97 + rand(4));

function fullTable(): number[][] {
  const rows = A.length + 1;
  const cols = B.length + 1;
  const table = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let j = 0; j < cols; j++) table[0][j] = j;
  for (let i = 1; i < rows; i++) {
    table[i][0] = i;
    for (let j = 1; j < cols; j++) {
      if (A[i - 1] === B[j - 1]) {
        table[i][j] = table[i - 1][j - 1];
      } else {
        table[i][j] = 1 + Math.min(table[i - 1][j - 1], table[i - 1][j], table[i][j - 1]);
      }
    }
  }
  return table;
}

function twoRows(): number {
  const cols = B.length + 1;
  let previous = Array.from({ length: cols }, (_, j) => j);
  let current = new Array(cols).fill(0);
  for (let i = 1; i <= A.length; i++) {
    current[0] = i;
    for (let j = 1; j < cols; j++) {
      if (A[i - 1] === B[j - 1]) {
        current[j] = previous[j - 1];
      } else {
        current[j] = 1 + Math.min(previous[j - 1], previous[j], current[j - 1]);
      }
    }
    const swap = previous;
    previous = current;
    current = swap;
  }
  return previous[cols - 1];
}

function oneRow(): number {
  const cols = B.length + 1;
  const row = Array.from({ length: cols }, (_, j) => j);
  for (let i = 1; i <= A.length; i++) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j < cols; j++) {
      const above = row[j];
      if (A[i - 1] === B[j - 1]) {
        row[j] = diagonal;
      } else {
        row[j] = 1 + Math.min(diagonal, above, row[j - 1]);
      }
      diagonal = above;
    }
  }
  return row[cols - 1];
}

/** Walk the finished table backwards to recover the edits themselves. */
type Step = [string, string];

function script(table: number[][]): Step[] {
  let i = A.length;
  let j = B.length;
  const steps: Step[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && A[i - 1] === B[j - 1] && table[i][j] === table[i - 1][j - 1]) {
      steps.push(["keep", A[i - 1]]);
      i--;
      j--;
    } else if (i > 0 && j > 0 && table[i][j] === table[i - 1][j - 1] + 1) {
      steps.push(["swap", A[i - 1] + B[j - 1]]);
      i--;
      j--;
    } else if (i > 0 && table[i][j] === table[i - 1][j] + 1) {
      steps.push(["drop", A[i - 1]]);
      i--;
    } else {
      steps.push(["add", B[j - 1]]);
      j--;
    }
  }
  steps.reverse();
  return steps;
}

/** Apply the script to A and see whether B falls out. */
function replay(steps: Step[]): [string, number] {
  const out: string[] = [];
  let at = 0;
  for (const [kind, text] of steps) {
    if (kind === "keep") {
      out.push(A[at]);
      at++;
    } else if (kind === "swap") {
      out.push(text[1]);
      at++;
    } else if (kind === "drop") {
      at++;
    } else {
      out.push(text);
    }
  }
  return [out.join(""), at];
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

const rows = A.length + 1;
const cols = B.length + 1;
const table = fullTable();
const distance = table[rows - 1][cols - 1];

console.log(\`turning a \${A.length}-character string into an \${B.length}-character one\`);
console.log();
console.log(padEnd("method", 28) + pad("answer", 8) + pad("cells held", 12) + pad("against the table", 20));
console.log(padEnd("the whole table", 28) + pad(distance, 8) + pad(rows * cols, 12) + pad("1x", 20));
console.log(
  padEnd("two rows", 28) + pad(twoRows(), 8) + pad(2 * cols, 12) +
    pad(\`\${Math.floor((rows * cols) / (2 * cols))}x less\`, 20)
);
console.log(
  padEnd("one row and one variable", 28) + pad(oneRow(), 8) + pad(cols + 1, 12) +
    pad(\`\${Math.floor((rows * cols) / (cols + 1))}x less\`, 20)
);
console.log();

const steps = script(table);
const edits = steps.filter(([kind]) => kind !== "keep").length;
const [rebuilt, consumed] = replay(steps);

console.log("and this is what the two smaller versions can no longer answer:");
console.log("  the first twelve edits: " + steps.slice(0, 12).map(([k, t]) => \`\${k} \${t}\`).join(", "));
console.log(\`  the script has \${steps.length} steps, \${edits} of them real edits\`);
console.log(\`  replaying it on the first string reads all \${consumed} of its characters\`);
console.log(\`  and produces the second string exactly: \${rebuilt === B ? "yes" : "no"}\`);
console.log(\`  \${edits} edits, and the table said the distance was \${distance}\`);
`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

// What the optimisation costs, at a size where it obviously matters, and what it
// takes away in exchange.
//
// A rolling array keeps the answer and throws away the working. That is fine
// when the answer is a number, and it is exactly wrong when the question was
// "and what were the edits?" -- which is the next lesson's subject.
public class Main {
    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    static String A;
    static String B;

    static int[][] fullTable() {
        int rows = A.length() + 1;
        int cols = B.length() + 1;
        int[][] table = new int[rows][cols];
        for (int j = 0; j < cols; j++) table[0][j] = j;
        for (int i = 1; i < rows; i++) {
            table[i][0] = i;
            for (int j = 1; j < cols; j++) {
                if (A.charAt(i - 1) == B.charAt(j - 1)) {
                    table[i][j] = table[i - 1][j - 1];
                } else {
                    table[i][j] = 1 + Math.min(table[i - 1][j - 1],
                        Math.min(table[i - 1][j], table[i][j - 1]));
                }
            }
        }
        return table;
    }

    static int twoRows() {
        int cols = B.length() + 1;
        int[] previous = new int[cols];
        int[] current = new int[cols];
        for (int j = 0; j < cols; j++) previous[j] = j;
        for (int i = 1; i <= A.length(); i++) {
            current[0] = i;
            for (int j = 1; j < cols; j++) {
                if (A.charAt(i - 1) == B.charAt(j - 1)) {
                    current[j] = previous[j - 1];
                } else {
                    current[j] = 1 + Math.min(previous[j - 1], Math.min(previous[j], current[j - 1]));
                }
            }
            int[] swap = previous;
            previous = current;
            current = swap;
        }
        return previous[cols - 1];
    }

    static int oneRow() {
        int cols = B.length() + 1;
        int[] row = new int[cols];
        for (int j = 0; j < cols; j++) row[j] = j;
        for (int i = 1; i <= A.length(); i++) {
            int diagonal = row[0];
            row[0] = i;
            for (int j = 1; j < cols; j++) {
                int above = row[j];
                if (A.charAt(i - 1) == B.charAt(j - 1)) {
                    row[j] = diagonal;
                } else {
                    row[j] = 1 + Math.min(diagonal, Math.min(above, row[j - 1]));
                }
                diagonal = above;
            }
        }
        return row[cols - 1];
    }

    /** Walk the finished table backwards to recover the edits themselves. */
    static List<String[]> script(int[][] table) {
        int i = A.length();
        int j = B.length();
        List<String[]> steps = new ArrayList<>();
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && A.charAt(i - 1) == B.charAt(j - 1)
                && table[i][j] == table[i - 1][j - 1]) {
                steps.add(new String[] { "keep", String.valueOf(A.charAt(i - 1)) });
                i--;
                j--;
            } else if (i > 0 && j > 0 && table[i][j] == table[i - 1][j - 1] + 1) {
                steps.add(new String[] { "swap", "" + A.charAt(i - 1) + B.charAt(j - 1) });
                i--;
                j--;
            } else if (i > 0 && table[i][j] == table[i - 1][j] + 1) {
                steps.add(new String[] { "drop", String.valueOf(A.charAt(i - 1)) });
                i--;
            } else {
                steps.add(new String[] { "add", String.valueOf(B.charAt(j - 1)) });
                j--;
            }
        }
        Collections.reverse(steps);
        return steps;
    }

    /** Apply the script to A and see whether B falls out. */
    static Object[] replay(List<String[]> steps) {
        StringBuilder out = new StringBuilder();
        int at = 0;
        for (String[] step : steps) {
            if (step[0].equals("keep")) {
                out.append(A.charAt(at));
                at++;
            } else if (step[0].equals("swap")) {
                out.append(step[1].charAt(1));
                at++;
            } else if (step[0].equals("drop")) {
                at++;
            } else {
                out.append(step[1]);
            }
        }
        return new Object[] { out.toString(), at };
    }

    public static void main(String[] args) {
        StringBuilder a = new StringBuilder();
        for (int i = 0; i < 600; i++) a.append((char) (97 + rand(4)));
        A = a.toString();
        StringBuilder b = new StringBuilder();
        for (int i = 0; i < 800; i++) b.append((char) (97 + rand(4)));
        B = b.toString();

        int rows = A.length() + 1;
        int cols = B.length() + 1;
        int[][] table = fullTable();
        int distance = table[rows - 1][cols - 1];

        System.out.printf("turning a %d-character string into an %d-character one%n", A.length(), B.length());
        System.out.println();
        System.out.printf("%-28s%8s%12s%20s%n", "method", "answer", "cells held", "against the table");
        System.out.printf("%-28s%8d%12d%20s%n", "the whole table", distance, rows * cols, "1x");
        System.out.printf("%-28s%8d%12d%20s%n", "two rows", twoRows(), 2 * cols,
            (rows * cols / (2 * cols)) + "x less");
        System.out.printf("%-28s%8d%12d%20s%n", "one row and one variable", oneRow(), cols + 1,
            (rows * cols / (cols + 1)) + "x less");
        System.out.println();

        List<String[]> steps = script(table);
        int edits = 0;
        for (String[] step : steps) {
            if (!step[0].equals("keep")) edits++;
        }
        Object[] played = replay(steps);
        String rebuilt = (String) played[0];
        int consumed = (Integer) played[1];

        System.out.println("and this is what the two smaller versions can no longer answer:");
        StringBuilder first = new StringBuilder();
        for (int k = 0; k < 12; k++) {
            if (k > 0) first.append(", ");
            first.append(steps.get(k)[0]).append(" ").append(steps.get(k)[1]);
        }
        System.out.printf("  the first twelve edits: %s%n", first);
        System.out.printf("  the script has %d steps, %d of them real edits%n", steps.size(), edits);
        System.out.printf("  replaying it on the first string reads all %d of its characters%n", consumed);
        System.out.printf("  and produces the second string exactly: %s%n", rebuilt.equals(B) ? "yes" : "no");
        System.out.printf("  %d edits, and the table said the distance was %d%n", edits, distance);
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// What the optimisation costs, at a size where it obviously matters, and what it
// takes away in exchange.
//
// A rolling array keeps the answer and throws away the working. That is fine
// when the answer is a number, and it is exactly wrong when the question was
// "and what were the edits?" -- which is the next lesson's subject.
#include <algorithm>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

static std::string A;
static std::string B;

std::vector<std::vector<int>> fullTable() {
    int rows = static_cast<int>(A.size()) + 1;
    int cols = static_cast<int>(B.size()) + 1;
    std::vector<std::vector<int>> table(rows, std::vector<int>(cols, 0));
    for (int j = 0; j < cols; j++) table[0][j] = j;
    for (int i = 1; i < rows; i++) {
        table[i][0] = i;
        for (int j = 1; j < cols; j++) {
            if (A[i - 1] == B[j - 1]) {
                table[i][j] = table[i - 1][j - 1];
            } else {
                table[i][j] = 1 + std::min(table[i - 1][j - 1],
                                           std::min(table[i - 1][j], table[i][j - 1]));
            }
        }
    }
    return table;
}

int twoRows() {
    int cols = static_cast<int>(B.size()) + 1;
    std::vector<int> previous(cols), current(cols, 0);
    for (int j = 0; j < cols; j++) previous[j] = j;
    for (size_t i = 1; i <= A.size(); i++) {
        current[0] = static_cast<int>(i);
        for (int j = 1; j < cols; j++) {
            if (A[i - 1] == B[j - 1]) {
                current[j] = previous[j - 1];
            } else {
                current[j] = 1 + std::min(previous[j - 1], std::min(previous[j], current[j - 1]));
            }
        }
        std::swap(previous, current);
    }
    return previous[cols - 1];
}

int oneRow() {
    int cols = static_cast<int>(B.size()) + 1;
    std::vector<int> row(cols);
    for (int j = 0; j < cols; j++) row[j] = j;
    for (size_t i = 1; i <= A.size(); i++) {
        int diagonal = row[0];
        row[0] = static_cast<int>(i);
        for (int j = 1; j < cols; j++) {
            int above = row[j];
            if (A[i - 1] == B[j - 1]) {
                row[j] = diagonal;
            } else {
                row[j] = 1 + std::min(diagonal, std::min(above, row[j - 1]));
            }
            diagonal = above;
        }
    }
    return row[cols - 1];
}

struct Step {
    std::string kind;
    std::string text;
};

// Walk the finished table backwards to recover the edits themselves.
std::vector<Step> script(const std::vector<std::vector<int>> &table) {
    int i = static_cast<int>(A.size());
    int j = static_cast<int>(B.size());
    std::vector<Step> steps;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && A[i - 1] == B[j - 1] && table[i][j] == table[i - 1][j - 1]) {
            steps.push_back({"keep", std::string(1, A[i - 1])});
            i--;
            j--;
        } else if (i > 0 && j > 0 && table[i][j] == table[i - 1][j - 1] + 1) {
            steps.push_back({"swap", std::string(1, A[i - 1]) + std::string(1, B[j - 1])});
            i--;
            j--;
        } else if (i > 0 && table[i][j] == table[i - 1][j] + 1) {
            steps.push_back({"drop", std::string(1, A[i - 1])});
            i--;
        } else {
            steps.push_back({"add", std::string(1, B[j - 1])});
            j--;
        }
    }
    std::reverse(steps.begin(), steps.end());
    return steps;
}

// Apply the script to A and see whether B falls out.
void replay(const std::vector<Step> &steps, std::string &out, int &at) {
    out.clear();
    at = 0;
    for (const Step &s : steps) {
        if (s.kind == "keep") {
            out += A[at];
            at++;
        } else if (s.kind == "swap") {
            out += s.text[1];
            at++;
        } else if (s.kind == "drop") {
            at++;
        } else {
            out += s.text;
        }
    }
}

int main() {
    for (int i = 0; i < 600; i++) A += static_cast<char>(97 + rnd(4));
    for (int i = 0; i < 800; i++) B += static_cast<char>(97 + rnd(4));

    int rows = static_cast<int>(A.size()) + 1;
    int cols = static_cast<int>(B.size()) + 1;
    auto table = fullTable();
    int distance = table[rows - 1][cols - 1];

    std::cout << "turning a " << A.size() << "-character string into an " << B.size()
              << "-character one\\n\\n";
    std::cout << std::left << std::setw(28) << "method" << std::right << std::setw(8) << "answer"
              << std::setw(12) << "cells held" << std::setw(20) << "against the table" << "\\n";
    std::cout << std::left << std::setw(28) << "the whole table" << std::right << std::setw(8) << distance
              << std::setw(12) << rows * cols << std::setw(20) << "1x" << "\\n";
    std::cout << std::left << std::setw(28) << "two rows" << std::right << std::setw(8) << twoRows()
              << std::setw(12) << 2 * cols << std::setw(20)
              << (std::to_string(rows * cols / (2 * cols)) + "x less") << "\\n";
    std::cout << std::left << std::setw(28) << "one row and one variable" << std::right << std::setw(8)
              << oneRow() << std::setw(12) << cols + 1 << std::setw(20)
              << (std::to_string(rows * cols / (cols + 1)) + "x less") << "\\n\\n";

    auto steps = script(table);
    int edits = 0;
    for (const Step &s : steps) {
        if (s.kind != "keep") edits++;
    }
    std::string rebuilt;
    int consumed = 0;
    replay(steps, rebuilt, consumed);

    std::cout << "and this is what the two smaller versions can no longer answer:\\n";
    std::cout << "  the first twelve edits: ";
    for (int k = 0; k < 12; k++) {
        if (k > 0) std::cout << ", ";
        std::cout << steps[k].kind << " " << steps[k].text;
    }
    std::cout << "\\n";
    std::cout << "  the script has " << steps.size() << " steps, " << edits << " of them real edits\\n";
    std::cout << "  replaying it on the first string reads all " << consumed << " of its characters\\n";
    std::cout << "  and produces the second string exactly: " << (rebuilt == B ? "yes" : "no") << "\\n";
    std::cout << "  " << edits << " edits, and the table said the distance was " << distance << "\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// What the optimisation costs, at a size where it obviously matters, and what it
// takes away in exchange.
//
// A rolling array keeps the answer and throws away the working. That is fine
// when the answer is a number, and it is exactly wrong when the question was
// "and what were the edits?" -- which is the next lesson's subject.

fn rand(seed: &mut i64, n: i64) -> i32 {
    *seed = (*seed * 1103515245 + 12345) % 2147483648;
    (*seed / 65536 % n) as i32
}

fn full_table(a: &[u8], b: &[u8]) -> Vec<Vec<i32>> {
    let rows = a.len() + 1;
    let cols = b.len() + 1;
    let mut table = vec![vec![0i32; cols]; rows];
    for j in 0..cols {
        table[0][j] = j as i32;
    }
    for i in 1..rows {
        table[i][0] = i as i32;
        for j in 1..cols {
            table[i][j] = if a[i - 1] == b[j - 1] {
                table[i - 1][j - 1]
            } else {
                1 + table[i - 1][j - 1].min(table[i - 1][j]).min(table[i][j - 1])
            };
        }
    }
    table
}

fn two_rows(a: &[u8], b: &[u8]) -> i32 {
    let cols = b.len() + 1;
    let mut previous: Vec<i32> = (0..cols as i32).collect();
    let mut current = vec![0i32; cols];
    for i in 1..=a.len() {
        current[0] = i as i32;
        for j in 1..cols {
            current[j] = if a[i - 1] == b[j - 1] {
                previous[j - 1]
            } else {
                1 + previous[j - 1].min(previous[j]).min(current[j - 1])
            };
        }
        std::mem::swap(&mut previous, &mut current);
    }
    previous[cols - 1]
}

fn one_row(a: &[u8], b: &[u8]) -> i32 {
    let cols = b.len() + 1;
    let mut row: Vec<i32> = (0..cols as i32).collect();
    for i in 1..=a.len() {
        let mut diagonal = row[0];
        row[0] = i as i32;
        for j in 1..cols {
            let above = row[j];
            row[j] = if a[i - 1] == b[j - 1] {
                diagonal
            } else {
                1 + diagonal.min(above).min(row[j - 1])
            };
            diagonal = above;
        }
    }
    row[cols - 1]
}

struct Step {
    kind: &'static str,
    text: String,
}

/// Walk the finished table backwards to recover the edits themselves.
fn script(a: &[u8], b: &[u8], table: &[Vec<i32>]) -> Vec<Step> {
    let mut i = a.len();
    let mut j = b.len();
    let mut steps = Vec::new();
    while i > 0 || j > 0 {
        if i > 0 && j > 0 && a[i - 1] == b[j - 1] && table[i][j] == table[i - 1][j - 1] {
            steps.push(Step { kind: "keep", text: (a[i - 1] as char).to_string() });
            i -= 1;
            j -= 1;
        } else if i > 0 && j > 0 && table[i][j] == table[i - 1][j - 1] + 1 {
            steps.push(Step {
                kind: "swap",
                text: format!("{}{}", a[i - 1] as char, b[j - 1] as char),
            });
            i -= 1;
            j -= 1;
        } else if i > 0 && table[i][j] == table[i - 1][j] + 1 {
            steps.push(Step { kind: "drop", text: (a[i - 1] as char).to_string() });
            i -= 1;
        } else {
            steps.push(Step { kind: "add", text: (b[j - 1] as char).to_string() });
            j -= 1;
        }
    }
    steps.reverse();
    steps
}

/// Apply the script to A and see whether B falls out.
fn replay(a: &[u8], steps: &[Step]) -> (String, usize) {
    let mut out = String::new();
    let mut at = 0;
    for s in steps {
        match s.kind {
            "keep" => {
                out.push(a[at] as char);
                at += 1;
            }
            "swap" => {
                out.push(s.text.as_bytes()[1] as char);
                at += 1;
            }
            "drop" => at += 1,
            _ => out.push_str(&s.text),
        }
    }
    (out, at)
}

fn main() {
    let mut seed = 1i64;
    let a: Vec<u8> = (0..600).map(|_| (97 + rand(&mut seed, 4)) as u8).collect();
    let b: Vec<u8> = (0..800).map(|_| (97 + rand(&mut seed, 4)) as u8).collect();

    let rows = a.len() + 1;
    let cols = b.len() + 1;
    let table = full_table(&a, &b);
    let distance = table[rows - 1][cols - 1];

    println!("turning a {}-character string into an {}-character one", a.len(), b.len());
    println!();
    println!("{:<28}{:>8}{:>12}{:>20}", "method", "answer", "cells held", "against the table");
    println!("{:<28}{:>8}{:>12}{:>20}", "the whole table", distance, rows * cols, "1x");
    println!("{:<28}{:>8}{:>12}{:>20}", "two rows", two_rows(&a, &b), 2 * cols,
        format!("{}x less", rows * cols / (2 * cols)));
    println!("{:<28}{:>8}{:>12}{:>20}", "one row and one variable", one_row(&a, &b), cols + 1,
        format!("{}x less", rows * cols / (cols + 1)));
    println!();

    let steps = script(&a, &b, &table);
    let edits = steps.iter().filter(|s| s.kind != "keep").count();
    let (rebuilt, consumed) = replay(&a, &steps);

    println!("and this is what the two smaller versions can no longer answer:");
    let first: Vec<String> = steps[..12].iter().map(|s| format!("{} {}", s.kind, s.text)).collect();
    println!("  the first twelve edits: {}", first.join(", "));
    println!("  the script has {} steps, {} of them real edits", steps.len(), edits);
    println!("  replaying it on the first string reads all {} of its characters", consumed);
    let target: String = b.iter().map(|&c| c as char).collect();
    println!("  and produces the second string exactly: {}", if rebuilt == target { "yes" } else { "no" });
    println!("  {} edits, and the table said the distance was {}", edits, distance);
}
`,
            },
            {
              lang: "go",
              code: `// What the optimisation costs, at a size where it obviously matters, and what it
// takes away in exchange.
//
// A rolling array keeps the answer and throws away the working. That is fine
// when the answer is a number, and it is exactly wrong when the question was
// "and what were the edits?" -- which is the next lesson's subject.
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

var A string
var B string

func min3(a, b, c int) int {
	if b < a {
		a = b
	}
	if c < a {
		a = c
	}
	return a
}

func fullTable() [][]int {
	rows := len(A) + 1
	cols := len(B) + 1
	table := make([][]int, rows)
	for i := range table {
		table[i] = make([]int, cols)
	}
	for j := 0; j < cols; j++ {
		table[0][j] = j
	}
	for i := 1; i < rows; i++ {
		table[i][0] = i
		for j := 1; j < cols; j++ {
			if A[i-1] == B[j-1] {
				table[i][j] = table[i-1][j-1]
			} else {
				table[i][j] = 1 + min3(table[i-1][j-1], table[i-1][j], table[i][j-1])
			}
		}
	}
	return table
}

func twoRows() int {
	cols := len(B) + 1
	previous := make([]int, cols)
	current := make([]int, cols)
	for j := 0; j < cols; j++ {
		previous[j] = j
	}
	for i := 1; i <= len(A); i++ {
		current[0] = i
		for j := 1; j < cols; j++ {
			if A[i-1] == B[j-1] {
				current[j] = previous[j-1]
			} else {
				current[j] = 1 + min3(previous[j-1], previous[j], current[j-1])
			}
		}
		previous, current = current, previous
	}
	return previous[cols-1]
}

func oneRow() int {
	cols := len(B) + 1
	row := make([]int, cols)
	for j := 0; j < cols; j++ {
		row[j] = j
	}
	for i := 1; i <= len(A); i++ {
		diagonal := row[0]
		row[0] = i
		for j := 1; j < cols; j++ {
			above := row[j]
			if A[i-1] == B[j-1] {
				row[j] = diagonal
			} else {
				row[j] = 1 + min3(diagonal, above, row[j-1])
			}
			diagonal = above
		}
	}
	return row[cols-1]
}

type step struct{ kind, text string }

// Walk the finished table backwards to recover the edits themselves.
func script(table [][]int) []step {
	i := len(A)
	j := len(B)
	var steps []step
	for i > 0 || j > 0 {
		switch {
		case i > 0 && j > 0 && A[i-1] == B[j-1] && table[i][j] == table[i-1][j-1]:
			steps = append(steps, step{"keep", string(A[i-1])})
			i--
			j--
		case i > 0 && j > 0 && table[i][j] == table[i-1][j-1]+1:
			steps = append(steps, step{"swap", string(A[i-1]) + string(B[j-1])})
			i--
			j--
		case i > 0 && table[i][j] == table[i-1][j]+1:
			steps = append(steps, step{"drop", string(A[i-1])})
			i--
		default:
			steps = append(steps, step{"add", string(B[j-1])})
			j--
		}
	}
	for a, b := 0, len(steps)-1; a < b; a, b = a+1, b-1 {
		steps[a], steps[b] = steps[b], steps[a]
	}
	return steps
}

// Apply the script to A and see whether B falls out.
func replay(steps []step) (string, int) {
	var out strings.Builder
	at := 0
	for _, s := range steps {
		switch s.kind {
		case "keep":
			out.WriteByte(A[at])
			at++
		case "swap":
			out.WriteByte(s.text[1])
			at++
		case "drop":
			at++
		default:
			out.WriteString(s.text)
		}
	}
	return out.String(), at
}

func main() {
	var a, b strings.Builder
	for i := 0; i < 600; i++ {
		a.WriteByte(byte(97 + rand(4)))
	}
	A = a.String()
	for i := 0; i < 800; i++ {
		b.WriteByte(byte(97 + rand(4)))
	}
	B = b.String()

	rows := len(A) + 1
	cols := len(B) + 1
	table := fullTable()
	distance := table[rows-1][cols-1]

	fmt.Printf("turning a %d-character string into an %d-character one\\n", len(A), len(B))
	fmt.Println()
	fmt.Printf("%-28s%8s%12s%20s\\n", "method", "answer", "cells held", "against the table")
	fmt.Printf("%-28s%8d%12d%20s\\n", "the whole table", distance, rows*cols, "1x")
	fmt.Printf("%-28s%8d%12d%20s\\n", "two rows", twoRows(), 2*cols,
		fmt.Sprintf("%dx less", rows*cols/(2*cols)))
	fmt.Printf("%-28s%8d%12d%20s\\n", "one row and one variable", oneRow(), cols+1,
		fmt.Sprintf("%dx less", rows*cols/(cols+1)))
	fmt.Println()

	steps := script(table)
	edits := 0
	for _, s := range steps {
		if s.kind != "keep" {
			edits++
		}
	}
	rebuilt, consumed := replay(steps)

	fmt.Println("and this is what the two smaller versions can no longer answer:")
	parts := make([]string, 12)
	for k := 0; k < 12; k++ {
		parts[k] = steps[k].kind + " " + steps[k].text
	}
	fmt.Printf("  the first twelve edits: %s\\n", strings.Join(parts, ", "))
	fmt.Printf("  the script has %d steps, %d of them real edits\\n", len(steps), edits)
	fmt.Printf("  replaying it on the first string reads all %d of its characters\\n", consumed)
	exact := "no"
	if rebuilt == B {
		exact = "yes"
	}
	fmt.Printf("  and produces the second string exactly: %s\\n", exact)
	fmt.Printf("  %d edits, and the table said the distance was %d\\n", edits, distance)
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Space optimisation and reconstruction are in direct conflict",
          body: "The traceback reads cells the rolling version has already overwritten, so you cannot simply add it back afterwards. If the question asks which items, which edits or which path, decide that before optimising -- or use the technique in the next lesson, which recovers the path in linear space at the cost of computing the table roughly twice.",
        },
        {
          title: "It is a space optimisation, not a speed one",
          body: "The same cells are computed in the same order with the same arithmetic; only the allocation shrinks. Any speed difference comes from cache behaviour and belongs to measurement rather than to expectation.",
        },
      ],
    },
    {
      id: "when-to-do-it",
      heading: "When to do it, and when not to",
      body: [
        "So the judgement, stated plainly, because reflex is the wrong mode here.",
        "**Do it when the answer is a number and the table does not fit.** That is the unambiguous case and it is the only one. Two megabytes is not a reason; two and a half billion cells is.",
        "**Do not do it before the full version is correct.** The rolling form is a refactor of a working program, and the full-table version is the oracle you check it against \u2014 which matters more here than usual, because the characteristic bug produces a plausible number on a small input.",
        "**Do not expect it to be faster.** The same cells are computed in the same order doing the same arithmetic. Only the allocation changes. It can help in practice through cache behaviour, and that is a measurement rather than an assumption.",
        "**Check what the question actually asked.** If the answer is a path, a schedule, a subsequence or a set of edits rather than a count, throwing away the table throws away the answer.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you reduce a two-dimensional dynamic programming table to one dimension?",
      answer:
        "By reading the recurrence rather than the code. If a row only reads the row above it, nothing below the current row is alive, so two rows suffice; and if the row can be updated left to right without destroying a value it still needs, one row plus a saved variable suffices. The variable is the whole subtlety in the one-row form: writing `row[j]` overwrites the diagonal that `row[j + 1]` is about to read, so the old value has to be stashed first. Leaving it out gives a program that runs, returns a plausible number, and is right about sixty per cent of the time on random inputs \u2014 which is why I would keep the full-table version and diff the two.",
    },
    {
      question: "Is two rows always enough?",
      answer:
        "No \u2014 the number of rows you must keep is exactly how far back the transition reaches. Two is right for the common case because those recurrences only look at `i - 1`. A staircase allowing jumps of up to k reads `dp[i+1]` through `dp[i+k]`, so it needs k values alive, and a ring of k-1 does not crash or produce noise: slot `(i+k) mod (k-1)` is slot `(i+1)`, so the longest jump reads the shortest jump's cell and the program returns a correct answer to the k-1 problem. The size has to be argued from the recurrence, because nothing about running it will tell you.",
    },
    {
      question: "You have space-optimised a dynamic program and now need the actual solution, not just its value. What now?",
      answer:
        "The two goals are in direct conflict, because the traceback reads exactly the cells the rolling array overwrote \u2014 so it cannot be bolted back on. Three honest options: keep the full table if it fits, which for a 600 by 800 edit distance is about two megabytes and no problem at all; store parent pointers alongside, which is the same order of memory as the table so it only helps if the values are much larger than the choices; or divide and conquer on the table, computing it in linear space twice per level to recover the path, which is Hirschberg's algorithm and costs roughly a factor of two in time. Which one is right depends entirely on whether the question asked how many or which, and that is worth settling before optimising rather than after.",
    },
  ],
  takeaways: [
    "If a row only reads the row above, everything below it is dead and need not be kept.",
    "The ladder is the whole table, then two rows, then one row plus a saved diagonal \u2014 same answer, same running time.",
    "The one-row form overwrites the diagonal the next cell needs; the stash variable is the entire difference between right and wrong.",
    "The broken version is right on the worked example and on 2,460 of 4,000 random ones \u2014 random testing against brute force is what catches it.",
    "How many rows to keep is exactly how far the transition reaches back, not two.",
    "A ring buffer one slot too small gives a correct answer to a smaller problem, silently.",
    "At 600 by 800 the saving is 481,401 cells against 802 \u2014 a factor of 600, for the same answer.",
    "The optimisation trades the working for the space, so it destroys the traceback: decide whether you were asked how many or which.",
  ],
  status: "available",
};
