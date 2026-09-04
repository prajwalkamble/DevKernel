import type { Lesson } from "@/content/types";

export const threeCostumesLesson: Lesson = {
  id: "dsa-dp-three-costumes",
  slug: "one-problem-three-costumes",
  moduleSlug: "dynamic-programming-foundations",
  title: "One Problem, Three Costumes",
  summary:
    "There are many more statements than there are recurrences, and telling which one you have is a two-minute mechanical test rather than a flash of memory. Then the trap on the other side: five words added to a familiar statement, and the state is no longer the one you remember.",
  estimatedMinutes: 35,
  objectives: [
    "Recognise one recurrence behind statements that share no vocabulary",
    "Tell a genuine restatement from a change that adds a dimension to the state",
    "Identify an unfamiliar problem from the first few answers of its brute force",
    "Run the module's whole procedure end to end on a problem you have not seen",
  ],
  sections: [
    {
      id: "four-statements-one-recurrence",
      heading: "Four statements, one recurrence",
      body: [
        "The catalogue of dynamic programming *statements* is enormous. The catalogue of dynamic programming *recurrences* is not, and the gap between those two facts is most of what makes the subject feel harder than it is.",
        "Below are four statements with no vocabulary in common \u2014 a staircase, a tiled board, a set of binary strings, a family of subsets. Each is counted by its own enumeration: the stairs enumerate step sequences, the tiling puts actual dominoes on an actual board, and the last two check every subset. Nothing is shared between them, so the agreement in the table is a result rather than a construction.",
        "Four statements, one recurrence, and the columns are only two distinct sequences. Stairs and tilings are `fib(n+1)`; strings with no `11` and subsets with no two consecutive members are `fib(n+2)` \u2014 checked for every n from 0 to 15 rather than eyeballed.",
        "The shift between the two families is the whole of the difference, and the shift comes from the base cases. There is one empty staircase and one empty board, and there are two binary strings of length one \u2014 that single fact is why the last two columns are the first two moved along by one place.",
        "This is the practical payoff of recognition. Identify the recurrence and you inherit everything the previous seven lessons established about it: what the state is, whether it can be rolled down to two values, how to get the path back. You are not solving a new problem, you are recognising an old one in a costume.",
      ],
      examples: [
        {
          id: "one-recurrence",
          title: "Four enumerations that happen to agree",
          lang: "python",
          code: `# Four statements that share no vocabulary and turn out to be one recurrence.
# Each is counted here by its own enumeration -- climbing enumerates step
# sequences, tiling places actual dominoes on an actual board, and the last two
# check every subset -- so the agreement between the columns is a result rather
# than four calls to the same function.

def climb(n):
    """Every sequence of 1s and 2s adding up to n, enumerated."""
    total = 0
    stack = [0]
    while stack:
        at = stack.pop()
        if at == n:
            total += 1
        else:
            if at + 1 <= n:
                stack.append(at + 1)
            if at + 2 <= n:
                stack.append(at + 2)
    return total


def tile(n):
    """Every covering of a 2-by-n board, dominoes placed one at a time."""
    covered = [[False] * n for _ in range(2)]

    def place():
        # Find the first empty cell, reading the board in column order.
        spot = None
        for col in range(n):
            for row in range(2):
                if not covered[row][col]:
                    spot = (row, col)
                    break
            if spot:
                break
        if spot is None:
            return 1
        row, col = spot
        total = 0
        # Vertical: this cell and the one below it.
        if row == 0 and not covered[1][col]:
            covered[0][col] = covered[1][col] = True
            total += place()
            covered[0][col] = covered[1][col] = False
        # Horizontal: this cell and the one to its right.
        if col + 1 < n and not covered[row][col + 1]:
            covered[row][col] = covered[row][col + 1] = True
            total += place()
            covered[row][col] = covered[row][col + 1] = False
        return total

    return place()


def strings_without_11(n):
    """Every binary string of length n, kept if it holds no two adjacent ones."""
    total = 0
    for mask in range(1 << n):
        bits = [(mask >> i) & 1 for i in range(n)]
        if all(not (bits[i] and bits[i + 1]) for i in range(n - 1)):
            total += 1
    return total


def sparse_subsets(n):
    """Every subset of 1..n, kept if no two of its members are consecutive."""
    total = 0
    for mask in range(1 << n):
        members = [i + 1 for i in range(n) if mask >> i & 1]
        gaps_ok = all(members[k + 1] - members[k] > 1 for k in range(len(members) - 1))
        if gaps_ok:
            total += 1
    return total


def fib(n):
    """The sequence itself: fib(1) = fib(2) = 1."""
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a


print(f"{'n':>3}{'stairs':>10}{'tilings':>10}{'no 11':>10}{'sparse':>10}{'fib(n+1)':>10}{'fib(n+2)':>10}")
for n in range(0, 16):
    print(f"{n:>3}{climb(n):>10}{tile(n):>10}{strings_without_11(n):>10}{sparse_subsets(n):>10}"
          f"{fib(n + 1):>10}{fib(n + 2):>10}")
print()

stairs_ok = all(climb(n) == fib(n + 1) for n in range(16))
tiles_ok = all(tile(n) == fib(n + 1) for n in range(16))
strings_ok = all(strings_without_11(n) == fib(n + 2) for n in range(16))
subsets_ok = all(sparse_subsets(n) == fib(n + 2) for n in range(16))

print("checked for every n from 0 to 15:")
print(f"  stairs equals fib(n+1)          {'yes' if stairs_ok else 'no'}")
print(f"  tilings equals fib(n+1)         {'yes' if tiles_ok else 'no'}")
print(f"  strings with no 11 is fib(n+2)  {'yes' if strings_ok else 'no'}")
print(f"  sparse subsets is fib(n+2)      {'yes' if subsets_ok else 'no'}")
print()
print("so there are not four problems here. There is one recurrence, f(n) =")
print("f(n-1) + f(n-2), and the base cases are the whole of the difference --")
print("which is why the last two columns are the first two shifted by one place.")
`,
          output: `  n    stairs   tilings     no 11    sparse  fib(n+1)  fib(n+2)
  0         1         1         1         1         1         1
  1         1         1         2         2         1         2
  2         2         2         3         3         2         3
  3         3         3         5         5         3         5
  4         5         5         8         8         5         8
  5         8         8        13        13         8        13
  6        13        13        21        21        13        21
  7        21        21        34        34        21        34
  8        34        34        55        55        34        55
  9        55        55        89        89        55        89
 10        89        89       144       144        89       144
 11       144       144       233       233       144       233
 12       233       233       377       377       233       377
 13       377       377       610       610       377       610
 14       610       610       987       987       610       987
 15       987       987      1597      1597       987      1597

checked for every n from 0 to 15:
  stairs equals fib(n+1)          yes
  tilings equals fib(n+1)         yes
  strings with no 11 is fib(n+2)  yes
  sparse subsets is fib(n+2)      yes

so there are not four problems here. There is one recurrence, f(n) =
f(n-1) + f(n-2), and the base cases are the whole of the difference --
which is why the last two columns are the first two shifted by one place.`,
          explanation:
            "No dynamic programming appears anywhere in this program. Each statement is counted the slow honest way -- the tiling really does place dominoes on a board and backtrack -- so the columns matching is evidence about the problems rather than a consequence of shared code.",
          alternates: [
            {
              lang: "javascript",
              code: `// Four statements that share no vocabulary and turn out to be one recurrence.
// Each is counted here by its own enumeration -- climbing enumerates step
// sequences, tiling places actual dominoes on an actual board, and the last two
// check every subset -- so the agreement between the columns is a result rather
// than four calls to the same function.

/** Every sequence of 1s and 2s adding up to n, enumerated. */
function climb(n) {
  let total = 0;
  const stack = [0];
  while (stack.length > 0) {
    const at = stack.pop();
    if (at === n) {
      total++;
    } else {
      if (at + 1 <= n) stack.push(at + 1);
      if (at + 2 <= n) stack.push(at + 2);
    }
  }
  return total;
}

let covered = [];
let width = 0;

function place() {
  // Find the first empty cell, reading the board in column order.
  let foundRow = -1;
  let foundCol = -1;
  for (let col = 0; col < width && foundRow < 0; col++) {
    for (let row = 0; row < 2; row++) {
      if (!covered[row][col]) {
        foundRow = row;
        foundCol = col;
        break;
      }
    }
  }
  if (foundRow < 0) return 1;
  let total = 0;
  // Vertical: this cell and the one below it.
  if (foundRow === 0 && !covered[1][foundCol]) {
    covered[0][foundCol] = true;
    covered[1][foundCol] = true;
    total += place();
    covered[0][foundCol] = false;
    covered[1][foundCol] = false;
  }
  // Horizontal: this cell and the one to its right.
  if (foundCol + 1 < width && !covered[foundRow][foundCol + 1]) {
    covered[foundRow][foundCol] = true;
    covered[foundRow][foundCol + 1] = true;
    total += place();
    covered[foundRow][foundCol] = false;
    covered[foundRow][foundCol + 1] = false;
  }
  return total;
}

/** Every covering of a 2-by-n board, dominoes placed one at a time. */
function tile(n) {
  covered = [new Array(Math.max(n, 1)).fill(false), new Array(Math.max(n, 1)).fill(false)];
  width = n;
  return place();
}

/** Every binary string of length n, kept if it holds no two adjacent ones. */
function stringsWithout11(n) {
  let total = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let ok = true;
    for (let i = 0; i < n - 1; i++) {
      if ((mask >> i) & 1 && (mask >> (i + 1)) & 1) ok = false;
    }
    if (ok) total++;
  }
  return total;
}

/** Every subset of 1..n, kept if no two of its members are consecutive. */
function sparseSubsets(n) {
  let total = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let previous = -10;
    let ok = true;
    for (let i = 0; i < n; i++) {
      if ((mask >> i) & 1) {
        if (i + 1 - previous <= 1) ok = false;
        previous = i + 1;
      }
    }
    if (ok) total++;
  }
  return total;
}

/** The sequence itself: fib(1) = fib(2) = 1. */
function fib(n) {
  let a = 0;
  let b = 1;
  for (let i = 0; i < n; i++) {
    const next = a + b;
    a = b;
    b = next;
  }
  return a;
}

const pad = (v, w) => String(v).padStart(w);

console.log(
  pad("n", 3) + pad("stairs", 10) + pad("tilings", 10) + pad("no 11", 10) + pad("sparse", 10) +
    pad("fib(n+1)", 10) + pad("fib(n+2)", 10)
);
for (let n = 0; n < 16; n++) {
  console.log(
    pad(n, 3) + pad(climb(n), 10) + pad(tile(n), 10) + pad(stringsWithout11(n), 10) +
      pad(sparseSubsets(n), 10) + pad(fib(n + 1), 10) + pad(fib(n + 2), 10)
  );
}
console.log();

let stairsOk = true;
let tilesOk = true;
let stringsOk = true;
let subsetsOk = true;
for (let n = 0; n < 16; n++) {
  if (climb(n) !== fib(n + 1)) stairsOk = false;
  if (tile(n) !== fib(n + 1)) tilesOk = false;
  if (stringsWithout11(n) !== fib(n + 2)) stringsOk = false;
  if (sparseSubsets(n) !== fib(n + 2)) subsetsOk = false;
}

console.log("checked for every n from 0 to 15:");
console.log(\`  stairs equals fib(n+1)          \${stairsOk ? "yes" : "no"}\`);
console.log(\`  tilings equals fib(n+1)         \${tilesOk ? "yes" : "no"}\`);
console.log(\`  strings with no 11 is fib(n+2)  \${stringsOk ? "yes" : "no"}\`);
console.log(\`  sparse subsets is fib(n+2)      \${subsetsOk ? "yes" : "no"}\`);
console.log();
console.log("so there are not four problems here. There is one recurrence, f(n) =");
console.log("f(n-1) + f(n-2), and the base cases are the whole of the difference --");
console.log("which is why the last two columns are the first two shifted by one place.");
`,
            },
            {
              lang: "typescript",
              code: `// Four statements that share no vocabulary and turn out to be one recurrence.
// Each is counted here by its own enumeration -- climbing enumerates step
// sequences, tiling places actual dominoes on an actual board, and the last two
// check every subset -- so the agreement between the columns is a result rather
// than four calls to the same function.

/** Every sequence of 1s and 2s adding up to n, enumerated. */
function climb(n: number): number {
  let total = 0;
  const stack = [0];
  while (stack.length > 0) {
    const at = stack.pop()!;
    if (at === n) {
      total++;
    } else {
      if (at + 1 <= n) stack.push(at + 1);
      if (at + 2 <= n) stack.push(at + 2);
    }
  }
  return total;
}

let covered: boolean[][] = [];
let width = 0;

function place(): number {
  // Find the first empty cell, reading the board in column order.
  let foundRow = -1;
  let foundCol = -1;
  for (let col = 0; col < width && foundRow < 0; col++) {
    for (let row = 0; row < 2; row++) {
      if (!covered[row][col]) {
        foundRow = row;
        foundCol = col;
        break;
      }
    }
  }
  if (foundRow < 0) return 1;
  let total = 0;
  // Vertical: this cell and the one below it.
  if (foundRow === 0 && !covered[1][foundCol]) {
    covered[0][foundCol] = true;
    covered[1][foundCol] = true;
    total += place();
    covered[0][foundCol] = false;
    covered[1][foundCol] = false;
  }
  // Horizontal: this cell and the one to its right.
  if (foundCol + 1 < width && !covered[foundRow][foundCol + 1]) {
    covered[foundRow][foundCol] = true;
    covered[foundRow][foundCol + 1] = true;
    total += place();
    covered[foundRow][foundCol] = false;
    covered[foundRow][foundCol + 1] = false;
  }
  return total;
}

/** Every covering of a 2-by-n board, dominoes placed one at a time. */
function tile(n: number): number {
  covered = [new Array(Math.max(n, 1)).fill(false), new Array(Math.max(n, 1)).fill(false)];
  width = n;
  return place();
}

/** Every binary string of length n, kept if it holds no two adjacent ones. */
function stringsWithout11(n: number): number {
  let total = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let ok = true;
    for (let i = 0; i < n - 1; i++) {
      if ((mask >> i) & 1 && (mask >> (i + 1)) & 1) ok = false;
    }
    if (ok) total++;
  }
  return total;
}

/** Every subset of 1..n, kept if no two of its members are consecutive. */
function sparseSubsets(n: number): number {
  let total = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let previous = -10;
    let ok = true;
    for (let i = 0; i < n; i++) {
      if ((mask >> i) & 1) {
        if (i + 1 - previous <= 1) ok = false;
        previous = i + 1;
      }
    }
    if (ok) total++;
  }
  return total;
}

/** The sequence itself: fib(1) = fib(2) = 1. */
function fib(n: number): number {
  let a = 0;
  let b = 1;
  for (let i = 0; i < n; i++) {
    const next = a + b;
    a = b;
    b = next;
  }
  return a;
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);

console.log(
  pad("n", 3) + pad("stairs", 10) + pad("tilings", 10) + pad("no 11", 10) + pad("sparse", 10) +
    pad("fib(n+1)", 10) + pad("fib(n+2)", 10)
);
for (let n = 0; n < 16; n++) {
  console.log(
    pad(n, 3) + pad(climb(n), 10) + pad(tile(n), 10) + pad(stringsWithout11(n), 10) +
      pad(sparseSubsets(n), 10) + pad(fib(n + 1), 10) + pad(fib(n + 2), 10)
  );
}
console.log();

let stairsOk = true;
let tilesOk = true;
let stringsOk = true;
let subsetsOk = true;
for (let n = 0; n < 16; n++) {
  if (climb(n) !== fib(n + 1)) stairsOk = false;
  if (tile(n) !== fib(n + 1)) tilesOk = false;
  if (stringsWithout11(n) !== fib(n + 2)) stringsOk = false;
  if (sparseSubsets(n) !== fib(n + 2)) subsetsOk = false;
}

console.log("checked for every n from 0 to 15:");
console.log(\`  stairs equals fib(n+1)          \${stairsOk ? "yes" : "no"}\`);
console.log(\`  tilings equals fib(n+1)         \${tilesOk ? "yes" : "no"}\`);
console.log(\`  strings with no 11 is fib(n+2)  \${stringsOk ? "yes" : "no"}\`);
console.log(\`  sparse subsets is fib(n+2)      \${subsetsOk ? "yes" : "no"}\`);
console.log();
console.log("so there are not four problems here. There is one recurrence, f(n) =");
console.log("f(n-1) + f(n-2), and the base cases are the whole of the difference --");
console.log("which is why the last two columns are the first two shifted by one place.");
`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayDeque;
import java.util.Deque;

// Four statements that share no vocabulary and turn out to be one recurrence.
// Each is counted here by its own enumeration -- climbing enumerates step
// sequences, tiling places actual dominoes on an actual board, and the last two
// check every subset -- so the agreement between the columns is a result rather
// than four calls to the same function.
public class Main {
    /** Every sequence of 1s and 2s adding up to n, enumerated. */
    static long climb(int n) {
        long total = 0;
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(0);
        while (!stack.isEmpty()) {
            int at = stack.pop();
            if (at == n) {
                total++;
            } else {
                if (at + 1 <= n) stack.push(at + 1);
                if (at + 2 <= n) stack.push(at + 2);
            }
        }
        return total;
    }

    static boolean[][] covered;
    static int width;

    /** Every covering of a 2-by-n board, dominoes placed one at a time. */
    static long tile(int n) {
        covered = new boolean[2][Math.max(n, 1)];
        width = n;
        return place();
    }

    static long place() {
        // Find the first empty cell, reading the board in column order.
        int foundRow = -1;
        int foundCol = -1;
        outer:
        for (int col = 0; col < width; col++) {
            for (int row = 0; row < 2; row++) {
                if (!covered[row][col]) {
                    foundRow = row;
                    foundCol = col;
                    break outer;
                }
            }
        }
        if (foundRow < 0) return 1;
        long total = 0;
        // Vertical: this cell and the one below it.
        if (foundRow == 0 && !covered[1][foundCol]) {
            covered[0][foundCol] = true;
            covered[1][foundCol] = true;
            total += place();
            covered[0][foundCol] = false;
            covered[1][foundCol] = false;
        }
        // Horizontal: this cell and the one to its right.
        if (foundCol + 1 < width && !covered[foundRow][foundCol + 1]) {
            covered[foundRow][foundCol] = true;
            covered[foundRow][foundCol + 1] = true;
            total += place();
            covered[foundRow][foundCol] = false;
            covered[foundRow][foundCol + 1] = false;
        }
        return total;
    }

    /** Every binary string of length n, kept if it holds no two adjacent ones. */
    static long stringsWithout11(int n) {
        long total = 0;
        for (int mask = 0; mask < (1 << n); mask++) {
            boolean ok = true;
            for (int i = 0; i < n - 1; i++) {
                if ((mask >> i & 1) == 1 && (mask >> (i + 1) & 1) == 1) ok = false;
            }
            if (ok) total++;
        }
        return total;
    }

    /** Every subset of 1..n, kept if no two of its members are consecutive. */
    static long sparseSubsets(int n) {
        long total = 0;
        for (int mask = 0; mask < (1 << n); mask++) {
            int previous = -10;
            boolean ok = true;
            for (int i = 0; i < n; i++) {
                if ((mask >> i & 1) == 1) {
                    if (i + 1 - previous <= 1) ok = false;
                    previous = i + 1;
                }
            }
            if (ok) total++;
        }
        return total;
    }

    /** The sequence itself: fib(1) = fib(2) = 1. */
    static long fib(int n) {
        long a = 0;
        long b = 1;
        for (int i = 0; i < n; i++) {
            long next = a + b;
            a = b;
            b = next;
        }
        return a;
    }

    public static void main(String[] args) {
        System.out.printf("%3s%10s%10s%10s%10s%10s%10s%n", "n", "stairs", "tilings", "no 11",
            "sparse", "fib(n+1)", "fib(n+2)");
        for (int n = 0; n < 16; n++) {
            System.out.printf("%3d%10d%10d%10d%10d%10d%10d%n", n, climb(n), tile(n),
                stringsWithout11(n), sparseSubsets(n), fib(n + 1), fib(n + 2));
        }
        System.out.println();

        boolean stairsOk = true, tilesOk = true, stringsOk = true, subsetsOk = true;
        for (int n = 0; n < 16; n++) {
            if (climb(n) != fib(n + 1)) stairsOk = false;
            if (tile(n) != fib(n + 1)) tilesOk = false;
            if (stringsWithout11(n) != fib(n + 2)) stringsOk = false;
            if (sparseSubsets(n) != fib(n + 2)) subsetsOk = false;
        }

        System.out.println("checked for every n from 0 to 15:");
        System.out.printf("  stairs equals fib(n+1)          %s%n", stairsOk ? "yes" : "no");
        System.out.printf("  tilings equals fib(n+1)         %s%n", tilesOk ? "yes" : "no");
        System.out.printf("  strings with no 11 is fib(n+2)  %s%n", stringsOk ? "yes" : "no");
        System.out.printf("  sparse subsets is fib(n+2)      %s%n", subsetsOk ? "yes" : "no");
        System.out.println();
        System.out.println("so there are not four problems here. There is one recurrence, f(n) =");
        System.out.println("f(n-1) + f(n-2), and the base cases are the whole of the difference --");
        System.out.println("which is why the last two columns are the first two shifted by one place.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Four statements that share no vocabulary and turn out to be one recurrence.
// Each is counted here by its own enumeration -- climbing enumerates step
// sequences, tiling places actual dominoes on an actual board, and the last two
// check every subset -- so the agreement between the columns is a result rather
// than four calls to the same function.
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <vector>

// Every sequence of 1s and 2s adding up to n, enumerated.
std::int64_t climb(int n) {
    std::int64_t total = 0;
    std::vector<int> stack{0};
    while (!stack.empty()) {
        int at = stack.back();
        stack.pop_back();
        if (at == n) {
            total++;
        } else {
            if (at + 1 <= n) stack.push_back(at + 1);
            if (at + 2 <= n) stack.push_back(at + 2);
        }
    }
    return total;
}

static std::vector<std::vector<bool>> covered;
static int width = 0;

std::int64_t place() {
    // Find the first empty cell, reading the board in column order.
    int foundRow = -1, foundCol = -1;
    for (int col = 0; col < width && foundRow < 0; col++) {
        for (int row = 0; row < 2; row++) {
            if (!covered[row][col]) {
                foundRow = row;
                foundCol = col;
                break;
            }
        }
    }
    if (foundRow < 0) return 1;
    std::int64_t total = 0;
    // Vertical: this cell and the one below it.
    if (foundRow == 0 && !covered[1][foundCol]) {
        covered[0][foundCol] = true;
        covered[1][foundCol] = true;
        total += place();
        covered[0][foundCol] = false;
        covered[1][foundCol] = false;
    }
    // Horizontal: this cell and the one to its right.
    if (foundCol + 1 < width && !covered[foundRow][foundCol + 1]) {
        covered[foundRow][foundCol] = true;
        covered[foundRow][foundCol + 1] = true;
        total += place();
        covered[foundRow][foundCol] = false;
        covered[foundRow][foundCol + 1] = false;
    }
    return total;
}

// Every covering of a 2-by-n board, dominoes placed one at a time.
std::int64_t tile(int n) {
    covered.assign(2, std::vector<bool>(n < 1 ? 1 : n, false));
    width = n;
    return place();
}

// Every binary string of length n, kept if it holds no two adjacent ones.
std::int64_t stringsWithout11(int n) {
    std::int64_t total = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        bool ok = true;
        for (int i = 0; i < n - 1; i++) {
            if ((mask >> i & 1) && (mask >> (i + 1) & 1)) ok = false;
        }
        if (ok) total++;
    }
    return total;
}

// Every subset of 1..n, kept if no two of its members are consecutive.
std::int64_t sparseSubsets(int n) {
    std::int64_t total = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        int previous = -10;
        bool ok = true;
        for (int i = 0; i < n; i++) {
            if (mask >> i & 1) {
                if (i + 1 - previous <= 1) ok = false;
                previous = i + 1;
            }
        }
        if (ok) total++;
    }
    return total;
}

// The sequence itself: fib(1) = fib(2) = 1.
std::int64_t fib(int n) {
    std::int64_t a = 0, b = 1;
    for (int i = 0; i < n; i++) {
        std::int64_t next = a + b;
        a = b;
        b = next;
    }
    return a;
}

int main() {
    std::cout << std::right << std::setw(3) << "n" << std::setw(10) << "stairs" << std::setw(10)
              << "tilings" << std::setw(10) << "no 11" << std::setw(10) << "sparse"
              << std::setw(10) << "fib(n+1)" << std::setw(10) << "fib(n+2)" << "\\n";
    for (int n = 0; n < 16; n++) {
        std::cout << std::right << std::setw(3) << n << std::setw(10) << climb(n) << std::setw(10)
                  << tile(n) << std::setw(10) << stringsWithout11(n) << std::setw(10)
                  << sparseSubsets(n) << std::setw(10) << fib(n + 1) << std::setw(10)
                  << fib(n + 2) << "\\n";
    }
    std::cout << "\\n";

    bool stairsOk = true, tilesOk = true, stringsOk = true, subsetsOk = true;
    for (int n = 0; n < 16; n++) {
        if (climb(n) != fib(n + 1)) stairsOk = false;
        if (tile(n) != fib(n + 1)) tilesOk = false;
        if (stringsWithout11(n) != fib(n + 2)) stringsOk = false;
        if (sparseSubsets(n) != fib(n + 2)) subsetsOk = false;
    }

    std::cout << "checked for every n from 0 to 15:\\n";
    std::cout << "  stairs equals fib(n+1)          " << (stairsOk ? "yes" : "no") << "\\n";
    std::cout << "  tilings equals fib(n+1)         " << (tilesOk ? "yes" : "no") << "\\n";
    std::cout << "  strings with no 11 is fib(n+2)  " << (stringsOk ? "yes" : "no") << "\\n";
    std::cout << "  sparse subsets is fib(n+2)      " << (subsetsOk ? "yes" : "no") << "\\n\\n";
    std::cout << "so there are not four problems here. There is one recurrence, f(n) =\\n";
    std::cout << "f(n-1) + f(n-2), and the base cases are the whole of the difference --\\n";
    std::cout << "which is why the last two columns are the first two shifted by one place.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// Four statements that share no vocabulary and turn out to be one recurrence.
// Each is counted here by its own enumeration -- climbing enumerates step
// sequences, tiling places actual dominoes on an actual board, and the last two
// check every subset -- so the agreement between the columns is a result rather
// than four calls to the same function.

/// Every sequence of 1s and 2s adding up to n, enumerated.
fn climb(n: i32) -> i64 {
    let mut total = 0i64;
    let mut stack = vec![0i32];
    while let Some(at) = stack.pop() {
        if at == n {
            total += 1;
        } else {
            if at + 1 <= n {
                stack.push(at + 1);
            }
            if at + 2 <= n {
                stack.push(at + 2);
            }
        }
    }
    total
}

struct Board {
    covered: Vec<Vec<bool>>,
    width: usize,
}

fn place(board: &mut Board) -> i64 {
    // Find the first empty cell, reading the board in column order.
    let mut found: Option<(usize, usize)> = None;
    'outer: for col in 0..board.width {
        for row in 0..2 {
            if !board.covered[row][col] {
                found = Some((row, col));
                break 'outer;
            }
        }
    }
    let (row, col) = match found {
        None => return 1,
        Some(spot) => spot,
    };
    let mut total = 0i64;
    // Vertical: this cell and the one below it.
    if row == 0 && !board.covered[1][col] {
        board.covered[0][col] = true;
        board.covered[1][col] = true;
        total += place(board);
        board.covered[0][col] = false;
        board.covered[1][col] = false;
    }
    // Horizontal: this cell and the one to its right.
    if col + 1 < board.width && !board.covered[row][col + 1] {
        board.covered[row][col] = true;
        board.covered[row][col + 1] = true;
        total += place(board);
        board.covered[row][col] = false;
        board.covered[row][col + 1] = false;
    }
    total
}

/// Every covering of a 2-by-n board, dominoes placed one at a time.
fn tile(n: usize) -> i64 {
    let mut board = Board { covered: vec![vec![false; n.max(1)]; 2], width: n };
    place(&mut board)
}

/// Every binary string of length n, kept if it holds no two adjacent ones.
fn strings_without_11(n: usize) -> i64 {
    let mut total = 0i64;
    for mask in 0..(1usize << n) {
        let mut ok = true;
        for i in 0..n.saturating_sub(1) {
            if mask >> i & 1 == 1 && mask >> (i + 1) & 1 == 1 {
                ok = false;
            }
        }
        if ok {
            total += 1;
        }
    }
    total
}

/// Every subset of 1..n, kept if no two of its members are consecutive.
fn sparse_subsets(n: usize) -> i64 {
    let mut total = 0i64;
    for mask in 0..(1usize << n) {
        let mut previous: i32 = -10;
        let mut ok = true;
        for i in 0..n {
            if mask >> i & 1 == 1 {
                if i as i32 + 1 - previous <= 1 {
                    ok = false;
                }
                previous = i as i32 + 1;
            }
        }
        if ok {
            total += 1;
        }
    }
    total
}

/// The sequence itself: fib(1) = fib(2) = 1.
fn fib(n: i32) -> i64 {
    let (mut a, mut b) = (0i64, 1i64);
    for _ in 0..n {
        let next = a + b;
        a = b;
        b = next;
    }
    a
}

fn main() {
    println!("{:>3}{:>10}{:>10}{:>10}{:>10}{:>10}{:>10}", "n", "stairs", "tilings", "no 11",
        "sparse", "fib(n+1)", "fib(n+2)");
    for n in 0..16 {
        println!("{:>3}{:>10}{:>10}{:>10}{:>10}{:>10}{:>10}", n, climb(n as i32), tile(n),
            strings_without_11(n), sparse_subsets(n), fib(n as i32 + 1), fib(n as i32 + 2));
    }
    println!();

    let stairs_ok = (0..16).all(|n| climb(n as i32) == fib(n as i32 + 1));
    let tiles_ok = (0..16).all(|n| tile(n) == fib(n as i32 + 1));
    let strings_ok = (0..16).all(|n| strings_without_11(n) == fib(n as i32 + 2));
    let subsets_ok = (0..16).all(|n| sparse_subsets(n) == fib(n as i32 + 2));

    println!("checked for every n from 0 to 15:");
    println!("  stairs equals fib(n+1)          {}", if stairs_ok { "yes" } else { "no" });
    println!("  tilings equals fib(n+1)         {}", if tiles_ok { "yes" } else { "no" });
    println!("  strings with no 11 is fib(n+2)  {}", if strings_ok { "yes" } else { "no" });
    println!("  sparse subsets is fib(n+2)      {}", if subsets_ok { "yes" } else { "no" });
    println!();
    println!("so there are not four problems here. There is one recurrence, f(n) =");
    println!("f(n-1) + f(n-2), and the base cases are the whole of the difference --");
    println!("which is why the last two columns are the first two shifted by one place.");
}
`,
            },
            {
              lang: "go",
              code: `// Four statements that share no vocabulary and turn out to be one recurrence.
// Each is counted here by its own enumeration -- climbing enumerates step
// sequences, tiling places actual dominoes on an actual board, and the last two
// check every subset -- so the agreement between the columns is a result rather
// than four calls to the same function.
package main

import "fmt"

// Every sequence of 1s and 2s adding up to n, enumerated.
func climb(n int) int64 {
	var total int64
	stack := []int{0}
	for len(stack) > 0 {
		at := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		if at == n {
			total++
		} else {
			if at+1 <= n {
				stack = append(stack, at+1)
			}
			if at+2 <= n {
				stack = append(stack, at+2)
			}
		}
	}
	return total
}

var covered [2][]bool
var width int

// Every covering of a 2-by-n board, dominoes placed one at a time.
func tile(n int) int64 {
	size := n
	if size < 1 {
		size = 1
	}
	covered[0] = make([]bool, size)
	covered[1] = make([]bool, size)
	width = n
	return place()
}

func place() int64 {
	// Find the first empty cell, reading the board in column order.
	foundRow, foundCol := -1, -1
	for col := 0; col < width && foundRow < 0; col++ {
		for row := 0; row < 2; row++ {
			if !covered[row][col] {
				foundRow, foundCol = row, col
				break
			}
		}
	}
	if foundRow < 0 {
		return 1
	}
	var total int64
	// Vertical: this cell and the one below it.
	if foundRow == 0 && !covered[1][foundCol] {
		covered[0][foundCol] = true
		covered[1][foundCol] = true
		total += place()
		covered[0][foundCol] = false
		covered[1][foundCol] = false
	}
	// Horizontal: this cell and the one to its right.
	if foundCol+1 < width && !covered[foundRow][foundCol+1] {
		covered[foundRow][foundCol] = true
		covered[foundRow][foundCol+1] = true
		total += place()
		covered[foundRow][foundCol] = false
		covered[foundRow][foundCol+1] = false
	}
	return total
}

// Every binary string of length n, kept if it holds no two adjacent ones.
func stringsWithout11(n int) int64 {
	var total int64
	for mask := 0; mask < 1<<n; mask++ {
		ok := true
		for i := 0; i < n-1; i++ {
			if mask>>i&1 == 1 && mask>>(i+1)&1 == 1 {
				ok = false
			}
		}
		if ok {
			total++
		}
	}
	return total
}

// Every subset of 1..n, kept if no two of its members are consecutive.
func sparseSubsets(n int) int64 {
	var total int64
	for mask := 0; mask < 1<<n; mask++ {
		previous := -10
		ok := true
		for i := 0; i < n; i++ {
			if mask>>i&1 == 1 {
				if i+1-previous <= 1 {
					ok = false
				}
				previous = i + 1
			}
		}
		if ok {
			total++
		}
	}
	return total
}

// The sequence itself: fib(1) = fib(2) = 1.
func fib(n int) int64 {
	var a, b int64 = 0, 1
	for i := 0; i < n; i++ {
		a, b = b, a+b
	}
	return a
}

func main() {
	fmt.Printf("%3s%10s%10s%10s%10s%10s%10s\\n", "n", "stairs", "tilings", "no 11", "sparse", "fib(n+1)", "fib(n+2)")
	for n := 0; n < 16; n++ {
		fmt.Printf("%3d%10d%10d%10d%10d%10d%10d\\n", n, climb(n), tile(n),
			stringsWithout11(n), sparseSubsets(n), fib(n+1), fib(n+2))
	}
	fmt.Println()

	stairsOk, tilesOk, stringsOk, subsetsOk := true, true, true, true
	for n := 0; n < 16; n++ {
		if climb(n) != fib(n+1) {
			stairsOk = false
		}
		if tile(n) != fib(n+1) {
			tilesOk = false
		}
		if stringsWithout11(n) != fib(n+2) {
			stringsOk = false
		}
		if sparseSubsets(n) != fib(n+2) {
			subsetsOk = false
		}
	}
	yes := func(ok bool) string {
		if ok {
			return "yes"
		}
		return "no"
	}

	fmt.Println("checked for every n from 0 to 15:")
	fmt.Printf("  stairs equals fib(n+1)          %s\\n", yes(stairsOk))
	fmt.Printf("  tilings equals fib(n+1)         %s\\n", yes(tilesOk))
	fmt.Printf("  strings with no 11 is fib(n+2)  %s\\n", yes(stringsOk))
	fmt.Printf("  sparse subsets is fib(n+2)      %s\\n", yes(subsetsOk))
	fmt.Println()
	fmt.Println("so there are not four problems here. There is one recurrence, f(n) =")
	fmt.Println("f(n-1) + f(n-2), and the base cases are the whole of the difference --")
	fmt.Println("which is why the last two columns are the first two shifted by one place.")
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "dp-fibonacci-costumes",
        kind: "dp",
        algorithm: "fibonacci",
        title: "The recurrence all four statements are wearing",
        lockAlgorithm: true,
      },
    },
    {
      id: "three-costumes-and-an-impostor",
      heading: "Three costumes and an impostor",
      body: [
        "The same thing happens with optimisation, and there it is more useful, because the disguises are better.",
        "Three of the four statements below are one problem. A row of houses where you cannot rob two in a row, and a heaviest independent set on a path graph, are the identical problem in two vocabularies. Bending the row into a ring is a real change but a small one \u2014 the first and last house cannot both be taken, so the answer is the better of two runs of the straight version.",
        "The fourth adds five words. \"At most three of them.\" It looks like the same problem and it is not.",
        "The first three agree with exhaustive search on all two thousand random rows, which is what \"the same problem\" means here. The fourth also agrees \u2014 because its state gained a dimension to hold the count, exactly as lesson 3 described.",
        "The last row is the one to sit with. Solving the unconstrained problem and then clipping the answer to the k most valuable houses is right on the worked example, and right on 1,787 of 2,000 random ones. It is the module's recurring failure mode one final time: **a wrong dynamic program usually agrees with your worked example.**",
        "So recognition is not matching on words. Five words changed the state, and no amount of remembering that this looked like house robber would have caught it. What recognition buys is a place to start \u2014 the shape of the recurrence, the vocabulary of the state \u2014 and the state itself still has to be re-derived from the statement in front of you.",
      ],
      examples: [
        {
          id: "costumes",
          title: "The same optimisation in three vocabularies, and one that only looks like it",
          lang: "python",
          code: `# The same trick, three costumes and one impostor. Two of these are the identical
# problem in different vocabulary, the third needs one idea on top, and the
# fourth looks like all of them and is not -- which is the skill the module has
# been building towards.

def rob_linear(values):
    """Best total from a row of houses, never taking two next to each other."""
    take = 0        # best if this house is taken
    skip = 0        # best if it is not
    for v in values:
        take, skip = skip + v, max(skip, take)
    return max(take, skip)


def rob_circular(values):
    """The same row bent into a ring, so the first and last are neighbours.

    One idea on top: the first and the last cannot both be taken, so the answer
    is the better of two runs of the straight version -- one that is not allowed
    the last house, one that is not allowed the first.
    """
    if len(values) == 1:
        return values[0]
    return max(rob_linear(values[:-1]), rob_linear(values[1:]))


def heaviest_independent_set(weights, edges):
    """Same problem, graph vocabulary: no two chosen vertices share an edge."""
    n = len(weights)
    best = 0
    for mask in range(1 << n):
        ok = True
        for u, v in edges:
            if mask >> u & 1 and mask >> v & 1:
                ok = False
        if ok:
            total = sum(weights[i] for i in range(n) if mask >> i & 1)
            if total > best:
                best = total
    return best


def brute(values, circular):
    """Every subset, checked for adjacency."""
    n = len(values)
    best = 0
    for mask in range(1 << n):
        ok = True
        for i in range(n - 1):
            if mask >> i & 1 and mask >> (i + 1) & 1:
                ok = False
        if circular and n > 1 and mask & 1 and mask >> (n - 1) & 1:
            ok = False
        if ok:
            total = sum(values[i] for i in range(n) if mask >> i & 1)
            if total > best:
                best = total
    return best


def at_most_k_wrong(values, k):
    """The impostor: the same recurrence, then the count clipped afterwards."""
    return min(rob_linear(values), sum(sorted(values, reverse=True)[:k]))


def at_most_k_right(values, k):
    """The state needs a second component: how many have been taken."""
    n = len(values)
    best = [[0] * (k + 1) for _ in range(n + 1)]
    for i in range(n - 1, -1, -1):
        for used in range(k + 1):
            skip = best[i + 1][used]
            take = 0
            if used < k:
                nxt = best[i + 2][used + 1] if i + 2 <= n else 0
                take = values[i] + nxt
            best[i][used] = max(skip, take)
    return best[0][0]


def brute_at_most_k(values, k):
    n = len(values)
    best = 0
    for mask in range(1 << n):
        chosen = [i for i in range(n) if mask >> i & 1]
        if len(chosen) > k:
            continue
        ok = all(chosen[j + 1] - chosen[j] > 1 for j in range(len(chosen) - 1))
        if ok:
            total = sum(values[i] for i in chosen)
            if total > best:
                best = total
    return best


HOUSES = [6, 1, 2, 7, 1, 3, 9, 2, 5, 4]
edges = [(i, i + 1) for i in range(len(HOUSES) - 1)]

print("houses [" + ", ".join(str(v) for v in HOUSES) + "]")
print()
print(f"{'statement':<44}{'answer':>8}{'brute force':>14}")
print(f"{'a row of houses, no two adjacent':<44}{rob_linear(HOUSES):>8}{brute(HOUSES, False):>14}")
print(f"{'a ring of houses, no two adjacent':<44}{rob_circular(HOUSES):>8}{brute(HOUSES, True):>14}")
print(f"{'heaviest independent set on a path':<44}"
      f"{heaviest_independent_set(HOUSES, edges):>8}{brute(HOUSES, False):>14}")
print(f"{'a row, no two adjacent, at most 3 of them':<44}"
      f"{at_most_k_right(HOUSES, 3):>8}{brute_at_most_k(HOUSES, 3):>14}")
print(f"{'  the same, with the count clipped afterwards':<44}{at_most_k_wrong(HOUSES, 3):>8}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 2000
scores = [0, 0, 0, 0, 0]
for _ in range(TRIALS):
    n = 1 + rand(10)
    values = [1 + rand(12) for _ in range(n)]
    k = 1 + rand(4)
    links = [(i, i + 1) for i in range(n - 1)]
    if rob_linear(values) == brute(values, False):
        scores[0] += 1
    if rob_circular(values) == brute(values, True):
        scores[1] += 1
    if heaviest_independent_set(values, links) == brute(values, False):
        scores[2] += 1
    if at_most_k_right(values, k) == brute_at_most_k(values, k):
        scores[3] += 1
    if at_most_k_wrong(values, k) == brute_at_most_k(values, k):
        scores[4] += 1

print(f"scored against exhaustive search on {TRIALS} random rows:")
labels = (
    "a row of houses, no two adjacent",
    "a ring of houses, no two adjacent",
    "heaviest independent set on a path",
    "at most k, with k in the state",
    "at most k, clipped afterwards",
)
for i, label in enumerate(labels):
    print(f"  {label:<40}{scores[i]:>6}")
print()
print("the first three are one problem wearing three hats. The fourth adds five")
print("words to the statement and adds a dimension to the state, and the fifth is")
print("what happens when you assume it did not.")
`,
          output: `houses [6, 1, 2, 7, 1, 3, 9, 2, 5, 4]

statement                                     answer   brute force
a row of houses, no two adjacent                  27            27
a ring of houses, no two adjacent                 27            27
heaviest independent set on a path                27            27
a row, no two adjacent, at most 3 of them         22            22
  the same, with the count clipped afterwards      22

scored against exhaustive search on 2000 random rows:
  a row of houses, no two adjacent          2000
  a ring of houses, no two adjacent         2000
  heaviest independent set on a path        2000
  at most k, with k in the state            2000
  at most k, clipped afterwards             1787

the first three are one problem wearing three hats. The fourth adds five
words to the statement and adds a dimension to the state, and the fifth is
what happens when you assume it did not.`,
          explanation:
            "Every row is scored against an exhaustive search over subsets, so \"the same problem\" is a measurement. The last row is the version that solves the unconstrained problem and clips the count afterwards, which is what recognising a pattern too eagerly produces.",
          alternates: [
            {
              lang: "javascript",
              code: `// The same trick, three costumes and one impostor. Two of these are the identical
// problem in different vocabulary, the third needs one idea on top, and the
// fourth looks like all of them and is not -- which is the skill the module has
// been building towards.

/** Best total from a row of houses, never taking two next to each other. */
function robLinear(values) {
  let take = 0;   // best if this house is taken
  let skip = 0;   // best if it is not
  for (const v of values) {
    const nextTake = skip + v;
    const nextSkip = Math.max(skip, take);
    take = nextTake;
    skip = nextSkip;
  }
  return Math.max(take, skip);
}

/**
 * The same row bent into a ring, so the first and last are neighbours.
 *
 * One idea on top: the first and the last cannot both be taken, so the answer is
 * the better of two runs of the straight version -- one that is not allowed the
 * last house, one that is not allowed the first.
 */
function robCircular(values) {
  if (values.length === 1) return values[0];
  return Math.max(robLinear(values.slice(0, -1)), robLinear(values.slice(1)));
}

/** Same problem, graph vocabulary: no two chosen vertices share an edge. */
function heaviestIndependentSet(weights, edges) {
  const n = weights.length;
  let best = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let ok = true;
    for (const [u, v] of edges) {
      if ((mask >> u) & 1 && (mask >> v) & 1) ok = false;
    }
    if (ok) {
      let total = 0;
      for (let i = 0; i < n; i++) if ((mask >> i) & 1) total += weights[i];
      if (total > best) best = total;
    }
  }
  return best;
}

/** Every subset, checked for adjacency. */
function brute(values, circular) {
  const n = values.length;
  let best = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let ok = true;
    for (let i = 0; i < n - 1; i++) {
      if ((mask >> i) & 1 && (mask >> (i + 1)) & 1) ok = false;
    }
    if (circular && n > 1 && mask & 1 && (mask >> (n - 1)) & 1) ok = false;
    if (ok) {
      let total = 0;
      for (let i = 0; i < n; i++) if ((mask >> i) & 1) total += values[i];
      if (total > best) best = total;
    }
  }
  return best;
}

/** The impostor: the same recurrence, then the count clipped afterwards. */
function atMostKWrong(values, k) {
  const sorted = [...values].sort((a, b) => b - a);
  let top = 0;
  for (let i = 0; i < k && i < sorted.length; i++) top += sorted[i];
  return Math.min(robLinear(values), top);
}

/** The state needs a second component: how many have been taken. */
function atMostKRight(values, k) {
  const n = values.length;
  const best = Array.from({ length: n + 2 }, () => new Array(k + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let used = 0; used <= k; used++) {
      const skip = best[i + 1][used];
      let take = 0;
      if (used < k) take = values[i] + best[i + 2][used + 1];
      best[i][used] = Math.max(skip, take);
    }
  }
  return best[0][0];
}

function bruteAtMostK(values, k) {
  const n = values.length;
  let best = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    const chosen = [];
    for (let i = 0; i < n; i++) if ((mask >> i) & 1) chosen.push(i);
    if (chosen.length > k) continue;
    let ok = true;
    for (let j = 0; j + 1 < chosen.length; j++) if (chosen[j + 1] - chosen[j] <= 1) ok = false;
    if (ok) {
      let total = 0;
      for (const i of chosen) total += values[i];
      if (total > best) best = total;
    }
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

const HOUSES = [6, 1, 2, 7, 1, 3, 9, 2, 5, 4];
const EDGES = [];
for (let i = 0; i + 1 < HOUSES.length; i++) EDGES.push([i, i + 1]);

console.log(\`houses [\${HOUSES.join(", ")}]\`);
console.log();
console.log(padEnd("statement", 44) + pad("answer", 8) + pad("brute force", 14));
console.log(
  padEnd("a row of houses, no two adjacent", 44) + pad(robLinear(HOUSES), 8) + pad(brute(HOUSES, false), 14)
);
console.log(
  padEnd("a ring of houses, no two adjacent", 44) + pad(robCircular(HOUSES), 8) + pad(brute(HOUSES, true), 14)
);
console.log(
  padEnd("heaviest independent set on a path", 44) + pad(heaviestIndependentSet(HOUSES, EDGES), 8) +
    pad(brute(HOUSES, false), 14)
);
console.log(
  padEnd("a row, no two adjacent, at most 3 of them", 44) + pad(atMostKRight(HOUSES, 3), 8) +
    pad(bruteAtMostK(HOUSES, 3), 14)
);
console.log(padEnd("  the same, with the count clipped afterwards", 44) + pad(atMostKWrong(HOUSES, 3), 8));
console.log();

const TRIALS = 2000;
const scores = [0, 0, 0, 0, 0];
for (let t = 0; t < TRIALS; t++) {
  const n = 1 + rand(10);
  const values = Array.from({ length: n }, () => 1 + rand(12));
  const k = 1 + rand(4);
  const links = [];
  for (let i = 0; i + 1 < n; i++) links.push([i, i + 1]);
  if (robLinear(values) === brute(values, false)) scores[0]++;
  if (robCircular(values) === brute(values, true)) scores[1]++;
  if (heaviestIndependentSet(values, links) === brute(values, false)) scores[2]++;
  if (atMostKRight(values, k) === bruteAtMostK(values, k)) scores[3]++;
  if (atMostKWrong(values, k) === bruteAtMostK(values, k)) scores[4]++;
}

console.log(\`scored against exhaustive search on \${TRIALS} random rows:\`);
const LABELS = [
  "a row of houses, no two adjacent",
  "a ring of houses, no two adjacent",
  "heaviest independent set on a path",
  "at most k, with k in the state",
  "at most k, clipped afterwards",
];
for (let i = 0; i < 5; i++) console.log(\`  \${padEnd(LABELS[i], 40)}\${pad(scores[i], 6)}\`);
console.log();
console.log("the first three are one problem wearing three hats. The fourth adds five");
console.log("words to the statement and adds a dimension to the state, and the fifth is");
console.log("what happens when you assume it did not.");
`,
            },
            {
              lang: "typescript",
              code: `// The same trick, three costumes and one impostor. Two of these are the identical
// problem in different vocabulary, the third needs one idea on top, and the
// fourth looks like all of them and is not -- which is the skill the module has
// been building towards.

/** Best total from a row of houses, never taking two next to each other. */
function robLinear(values: number[]): number {
  let take = 0;   // best if this house is taken
  let skip = 0;   // best if it is not
  for (const v of values) {
    const nextTake = skip + v;
    const nextSkip = Math.max(skip, take);
    take = nextTake;
    skip = nextSkip;
  }
  return Math.max(take, skip);
}

/**
 * The same row bent into a ring, so the first and last are neighbours.
 *
 * One idea on top: the first and the last cannot both be taken, so the answer is
 * the better of two runs of the straight version -- one that is not allowed the
 * last house, one that is not allowed the first.
 */
function robCircular(values: number[]): number {
  if (values.length === 1) return values[0];
  return Math.max(robLinear(values.slice(0, -1)), robLinear(values.slice(1)));
}

/** Same problem, graph vocabulary: no two chosen vertices share an edge. */
function heaviestIndependentSet(weights: number[], edges: number[][]): number {
  const n = weights.length;
  let best = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let ok = true;
    for (const [u, v] of edges) {
      if ((mask >> u) & 1 && (mask >> v) & 1) ok = false;
    }
    if (ok) {
      let total = 0;
      for (let i = 0; i < n; i++) if ((mask >> i) & 1) total += weights[i];
      if (total > best) best = total;
    }
  }
  return best;
}

/** Every subset, checked for adjacency. */
function brute(values: number[], circular: boolean): number {
  const n = values.length;
  let best = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let ok = true;
    for (let i = 0; i < n - 1; i++) {
      if ((mask >> i) & 1 && (mask >> (i + 1)) & 1) ok = false;
    }
    if (circular && n > 1 && mask & 1 && (mask >> (n - 1)) & 1) ok = false;
    if (ok) {
      let total = 0;
      for (let i = 0; i < n; i++) if ((mask >> i) & 1) total += values[i];
      if (total > best) best = total;
    }
  }
  return best;
}

/** The impostor: the same recurrence, then the count clipped afterwards. */
function atMostKWrong(values: number[], k: number): number {
  const sorted = [...values].sort((a, b) => b - a);
  let top = 0;
  for (let i = 0; i < k && i < sorted.length; i++) top += sorted[i];
  return Math.min(robLinear(values), top);
}

/** The state needs a second component: how many have been taken. */
function atMostKRight(values: number[], k: number): number {
  const n = values.length;
  const best = Array.from({ length: n + 2 }, () => new Array(k + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let used = 0; used <= k; used++) {
      const skip = best[i + 1][used];
      let take = 0;
      if (used < k) take = values[i] + best[i + 2][used + 1];
      best[i][used] = Math.max(skip, take);
    }
  }
  return best[0][0];
}

function bruteAtMostK(values: number[], k: number): number {
  const n = values.length;
  let best = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    const chosen: number[] = [];
    for (let i = 0; i < n; i++) if ((mask >> i) & 1) chosen.push(i);
    if (chosen.length > k) continue;
    let ok = true;
    for (let j = 0; j + 1 < chosen.length; j++) if (chosen[j + 1] - chosen[j] <= 1) ok = false;
    if (ok) {
      let total = 0;
      for (const i of chosen) total += values[i];
      if (total > best) best = total;
    }
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

const HOUSES = [6, 1, 2, 7, 1, 3, 9, 2, 5, 4];
const EDGES: number[][] = [];
for (let i = 0; i + 1 < HOUSES.length; i++) EDGES.push([i, i + 1]);

console.log(\`houses [\${HOUSES.join(", ")}]\`);
console.log();
console.log(padEnd("statement", 44) + pad("answer", 8) + pad("brute force", 14));
console.log(
  padEnd("a row of houses, no two adjacent", 44) + pad(robLinear(HOUSES), 8) + pad(brute(HOUSES, false), 14)
);
console.log(
  padEnd("a ring of houses, no two adjacent", 44) + pad(robCircular(HOUSES), 8) + pad(brute(HOUSES, true), 14)
);
console.log(
  padEnd("heaviest independent set on a path", 44) + pad(heaviestIndependentSet(HOUSES, EDGES), 8) +
    pad(brute(HOUSES, false), 14)
);
console.log(
  padEnd("a row, no two adjacent, at most 3 of them", 44) + pad(atMostKRight(HOUSES, 3), 8) +
    pad(bruteAtMostK(HOUSES, 3), 14)
);
console.log(padEnd("  the same, with the count clipped afterwards", 44) + pad(atMostKWrong(HOUSES, 3), 8));
console.log();

const TRIALS = 2000;
const scores = [0, 0, 0, 0, 0];
for (let t = 0; t < TRIALS; t++) {
  const n = 1 + rand(10);
  const values = Array.from({ length: n }, () => 1 + rand(12));
  const k = 1 + rand(4);
  const links: number[][] = [];
  for (let i = 0; i + 1 < n; i++) links.push([i, i + 1]);
  if (robLinear(values) === brute(values, false)) scores[0]++;
  if (robCircular(values) === brute(values, true)) scores[1]++;
  if (heaviestIndependentSet(values, links) === brute(values, false)) scores[2]++;
  if (atMostKRight(values, k) === bruteAtMostK(values, k)) scores[3]++;
  if (atMostKWrong(values, k) === bruteAtMostK(values, k)) scores[4]++;
}

console.log(\`scored against exhaustive search on \${TRIALS} random rows:\`);
const LABELS = [
  "a row of houses, no two adjacent",
  "a ring of houses, no two adjacent",
  "heaviest independent set on a path",
  "at most k, with k in the state",
  "at most k, clipped afterwards",
];
for (let i = 0; i < 5; i++) console.log(\`  \${padEnd(LABELS[i], 40)}\${pad(scores[i], 6)}\`);
console.log();
console.log("the first three are one problem wearing three hats. The fourth adds five");
console.log("words to the statement and adds a dimension to the state, and the fifth is");
console.log("what happens when you assume it did not.");
`,
            },
            {
              lang: "java",
              code: `// The same trick, three costumes and one impostor. Two of these are the identical
// problem in different vocabulary, the third needs one idea on top, and the
// fourth looks like all of them and is not -- which is the skill the module has
// been building towards.
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
    /** Best total from a row of houses, never taking two next to each other. */
    static int robLinear(int[] values) {
        int take = 0;   // best if this house is taken
        int skip = 0;   // best if it is not
        for (int v : values) {
            int nextTake = skip + v;
            int nextSkip = Math.max(skip, take);
            take = nextTake;
            skip = nextSkip;
        }
        return Math.max(take, skip);
    }

    /**
     * The same row bent into a ring, so the first and last are neighbours.
     *
     * One idea on top: the first and the last cannot both be taken, so the answer
     * is the better of two runs of the straight version -- one that is not allowed
     * the last house, one that is not allowed the first.
     */
    static int robCircular(int[] values) {
        if (values.length == 1) return values[0];
        int[] head = Arrays.copyOfRange(values, 0, values.length - 1);
        int[] tail = Arrays.copyOfRange(values, 1, values.length);
        return Math.max(robLinear(head), robLinear(tail));
    }

    /** Same problem, graph vocabulary: no two chosen vertices share an edge. */
    static int heaviestIndependentSet(int[] weights, int[][] edges) {
        int n = weights.length;
        int best = 0;
        for (int mask = 0; mask < (1 << n); mask++) {
            boolean ok = true;
            for (int[] e : edges) {
                if ((mask >> e[0] & 1) == 1 && (mask >> e[1] & 1) == 1) ok = false;
            }
            if (ok) {
                int total = 0;
                for (int i = 0; i < n; i++) if ((mask >> i & 1) == 1) total += weights[i];
                if (total > best) best = total;
            }
        }
        return best;
    }

    /** Every subset, checked for adjacency. */
    static int brute(int[] values, boolean circular) {
        int n = values.length;
        int best = 0;
        for (int mask = 0; mask < (1 << n); mask++) {
            boolean ok = true;
            for (int i = 0; i < n - 1; i++) {
                if ((mask >> i & 1) == 1 && (mask >> (i + 1) & 1) == 1) ok = false;
            }
            if (circular && n > 1 && (mask & 1) == 1 && (mask >> (n - 1) & 1) == 1) ok = false;
            if (ok) {
                int total = 0;
                for (int i = 0; i < n; i++) if ((mask >> i & 1) == 1) total += values[i];
                if (total > best) best = total;
            }
        }
        return best;
    }

    /** The impostor: the same recurrence, then the count clipped afterwards. */
    static int atMostKWrong(int[] values, int k) {
        int[] sorted = values.clone();
        Arrays.sort(sorted);
        int top = 0;
        for (int i = 0; i < k && i < sorted.length; i++) top += sorted[sorted.length - 1 - i];
        return Math.min(robLinear(values), top);
    }

    /** The state needs a second component: how many have been taken. */
    static int atMostKRight(int[] values, int k) {
        int n = values.length;
        int[][] best = new int[n + 2][k + 1];
        for (int i = n - 1; i >= 0; i--) {
            for (int used = 0; used <= k; used++) {
                int skip = best[i + 1][used];
                int take = 0;
                if (used < k) take = values[i] + best[i + 2][used + 1];
                best[i][used] = Math.max(skip, take);
            }
        }
        return best[0][0];
    }

    static int bruteAtMostK(int[] values, int k) {
        int n = values.length;
        int best = 0;
        for (int mask = 0; mask < (1 << n); mask++) {
            List<Integer> chosen = new ArrayList<>();
            for (int i = 0; i < n; i++) if ((mask >> i & 1) == 1) chosen.add(i);
            if (chosen.size() > k) continue;
            boolean ok = true;
            for (int j = 0; j + 1 < chosen.size(); j++) {
                if (chosen.get(j + 1) - chosen.get(j) <= 1) ok = false;
            }
            if (ok) {
                int total = 0;
                for (int i : chosen) total += values[i];
                if (total > best) best = total;
            }
        }
        return best;
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        int[] houses = { 6, 1, 2, 7, 1, 3, 9, 2, 5, 4 };
        int[][] edges = new int[houses.length - 1][2];
        for (int i = 0; i < houses.length - 1; i++) edges[i] = new int[] { i, i + 1 };

        StringBuilder row = new StringBuilder();
        for (int i = 0; i < houses.length; i++) {
            if (i > 0) row.append(", ");
            row.append(houses[i]);
        }
        System.out.printf("houses [%s]%n", row);
        System.out.println();
        System.out.printf("%-44s%8s%14s%n", "statement", "answer", "brute force");
        System.out.printf("%-44s%8d%14d%n", "a row of houses, no two adjacent",
            robLinear(houses), brute(houses, false));
        System.out.printf("%-44s%8d%14d%n", "a ring of houses, no two adjacent",
            robCircular(houses), brute(houses, true));
        System.out.printf("%-44s%8d%14d%n", "heaviest independent set on a path",
            heaviestIndependentSet(houses, edges), brute(houses, false));
        System.out.printf("%-44s%8d%14d%n", "a row, no two adjacent, at most 3 of them",
            atMostKRight(houses, 3), bruteAtMostK(houses, 3));
        System.out.printf("%-44s%8d%n", "  the same, with the count clipped afterwards",
            atMostKWrong(houses, 3));
        System.out.println();

        final int TRIALS = 2000;
        int[] scores = new int[5];
        for (int t = 0; t < TRIALS; t++) {
            int n = 1 + rand(10);
            int[] values = new int[n];
            for (int i = 0; i < n; i++) values[i] = 1 + rand(12);
            int k = 1 + rand(4);
            int[][] links = new int[Math.max(n - 1, 0)][2];
            for (int i = 0; i < n - 1; i++) links[i] = new int[] { i, i + 1 };
            if (robLinear(values) == brute(values, false)) scores[0]++;
            if (robCircular(values) == brute(values, true)) scores[1]++;
            if (heaviestIndependentSet(values, links) == brute(values, false)) scores[2]++;
            if (atMostKRight(values, k) == bruteAtMostK(values, k)) scores[3]++;
            if (atMostKWrong(values, k) == bruteAtMostK(values, k)) scores[4]++;
        }

        System.out.printf("scored against exhaustive search on %d random rows:%n", TRIALS);
        String[] labels = {
            "a row of houses, no two adjacent",
            "a ring of houses, no two adjacent",
            "heaviest independent set on a path",
            "at most k, with k in the state",
            "at most k, clipped afterwards",
        };
        for (int i = 0; i < 5; i++) {
            System.out.printf("  %-40s%6d%n", labels[i], scores[i]);
        }
        System.out.println();
        System.out.println("the first three are one problem wearing three hats. The fourth adds five");
        System.out.println("words to the statement and adds a dimension to the state, and the fifth is");
        System.out.println("what happens when you assume it did not.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The same trick, three costumes and one impostor. Two of these are the identical
// problem in different vocabulary, the third needs one idea on top, and the
// fourth looks like all of them and is not -- which is the skill the module has
// been building towards.
#include <algorithm>
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

// Best total from a row of houses, never taking two next to each other.
int robLinear(const std::vector<int> &values) {
    int take = 0;   // best if this house is taken
    int skip = 0;   // best if it is not
    for (int v : values) {
        int nextTake = skip + v;
        int nextSkip = std::max(skip, take);
        take = nextTake;
        skip = nextSkip;
    }
    return std::max(take, skip);
}

// The same row bent into a ring, so the first and last are neighbours.
//
// One idea on top: the first and the last cannot both be taken, so the answer is
// the better of two runs of the straight version -- one that is not allowed the
// last house, one that is not allowed the first.
int robCircular(const std::vector<int> &values) {
    if (values.size() == 1) return values[0];
    std::vector<int> head(values.begin(), values.end() - 1);
    std::vector<int> tail(values.begin() + 1, values.end());
    return std::max(robLinear(head), robLinear(tail));
}

// Same problem, graph vocabulary: no two chosen vertices share an edge.
int heaviestIndependentSet(const std::vector<int> &weights,
                           const std::vector<std::array<int, 2>> &edges) {
    int n = static_cast<int>(weights.size());
    int best = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        bool ok = true;
        for (const auto &e : edges) {
            if ((mask >> e[0] & 1) && (mask >> e[1] & 1)) ok = false;
        }
        if (ok) {
            int total = 0;
            for (int i = 0; i < n; i++)
                if (mask >> i & 1) total += weights[i];
            if (total > best) best = total;
        }
    }
    return best;
}

// Every subset, checked for adjacency.
int brute(const std::vector<int> &values, bool circular) {
    int n = static_cast<int>(values.size());
    int best = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        bool ok = true;
        for (int i = 0; i < n - 1; i++) {
            if ((mask >> i & 1) && (mask >> (i + 1) & 1)) ok = false;
        }
        if (circular && n > 1 && (mask & 1) && (mask >> (n - 1) & 1)) ok = false;
        if (ok) {
            int total = 0;
            for (int i = 0; i < n; i++)
                if (mask >> i & 1) total += values[i];
            if (total > best) best = total;
        }
    }
    return best;
}

// The impostor: the same recurrence, then the count clipped afterwards.
int atMostKWrong(const std::vector<int> &values, int k) {
    std::vector<int> sorted = values;
    std::sort(sorted.rbegin(), sorted.rend());
    int top = 0;
    for (int i = 0; i < k && i < static_cast<int>(sorted.size()); i++) top += sorted[i];
    return std::min(robLinear(values), top);
}

// The state needs a second component: how many have been taken.
int atMostKRight(const std::vector<int> &values, int k) {
    int n = static_cast<int>(values.size());
    std::vector<std::vector<int>> best(n + 2, std::vector<int>(k + 1, 0));
    for (int i = n - 1; i >= 0; i--) {
        for (int used = 0; used <= k; used++) {
            int skip = best[i + 1][used];
            int take = 0;
            if (used < k) take = values[i] + best[i + 2][used + 1];
            best[i][used] = std::max(skip, take);
        }
    }
    return best[0][0];
}

int bruteAtMostK(const std::vector<int> &values, int k) {
    int n = static_cast<int>(values.size());
    int best = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        std::vector<int> chosen;
        for (int i = 0; i < n; i++)
            if (mask >> i & 1) chosen.push_back(i);
        if (static_cast<int>(chosen.size()) > k) continue;
        bool ok = true;
        for (size_t j = 0; j + 1 < chosen.size(); j++) {
            if (chosen[j + 1] - chosen[j] <= 1) ok = false;
        }
        if (ok) {
            int total = 0;
            for (int i : chosen) total += values[i];
            if (total > best) best = total;
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
    std::vector<int> houses = {6, 1, 2, 7, 1, 3, 9, 2, 5, 4};
    std::vector<std::array<int, 2>> edges;
    for (size_t i = 0; i + 1 < houses.size(); i++) edges.push_back({static_cast<int>(i), static_cast<int>(i + 1)});

    std::cout << "houses [";
    for (size_t i = 0; i < houses.size(); i++) {
        if (i > 0) std::cout << ", ";
        std::cout << houses[i];
    }
    std::cout << "]\\n\\n";
    std::cout << std::left << std::setw(44) << "statement" << std::right << std::setw(8) << "answer"
              << std::setw(14) << "brute force" << "\\n";
    std::cout << std::left << std::setw(44) << "a row of houses, no two adjacent" << std::right
              << std::setw(8) << robLinear(houses) << std::setw(14) << brute(houses, false) << "\\n";
    std::cout << std::left << std::setw(44) << "a ring of houses, no two adjacent" << std::right
              << std::setw(8) << robCircular(houses) << std::setw(14) << brute(houses, true) << "\\n";
    std::cout << std::left << std::setw(44) << "heaviest independent set on a path" << std::right
              << std::setw(8) << heaviestIndependentSet(houses, edges) << std::setw(14)
              << brute(houses, false) << "\\n";
    std::cout << std::left << std::setw(44) << "a row, no two adjacent, at most 3 of them" << std::right
              << std::setw(8) << atMostKRight(houses, 3) << std::setw(14) << bruteAtMostK(houses, 3) << "\\n";
    std::cout << std::left << std::setw(44) << "  the same, with the count clipped afterwards"
              << std::right << std::setw(8) << atMostKWrong(houses, 3) << "\\n\\n";

    const int TRIALS = 2000;
    std::array<int, 5> scores{};
    for (int t = 0; t < TRIALS; t++) {
        int n = 1 + rnd(10);
        std::vector<int> values(n);
        for (int i = 0; i < n; i++) values[i] = 1 + rnd(12);
        int k = 1 + rnd(4);
        std::vector<std::array<int, 2>> links;
        for (int i = 0; i + 1 < n; i++) links.push_back({i, i + 1});
        if (robLinear(values) == brute(values, false)) scores[0]++;
        if (robCircular(values) == brute(values, true)) scores[1]++;
        if (heaviestIndependentSet(values, links) == brute(values, false)) scores[2]++;
        if (atMostKRight(values, k) == bruteAtMostK(values, k)) scores[3]++;
        if (atMostKWrong(values, k) == bruteAtMostK(values, k)) scores[4]++;
    }

    std::cout << "scored against exhaustive search on " << TRIALS << " random rows:\\n";
    std::array<std::string, 5> labels = {
        "a row of houses, no two adjacent",
        "a ring of houses, no two adjacent",
        "heaviest independent set on a path",
        "at most k, with k in the state",
        "at most k, clipped afterwards",
    };
    for (int i = 0; i < 5; i++) {
        std::cout << "  " << std::left << std::setw(40) << labels[i] << std::right << std::setw(6)
                  << scores[i] << "\\n";
    }
    std::cout << "\\n";
    std::cout << "the first three are one problem wearing three hats. The fourth adds five\\n";
    std::cout << "words to the statement and adds a dimension to the state, and the fifth is\\n";
    std::cout << "what happens when you assume it did not.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// The same trick, three costumes and one impostor. Two of these are the identical
// problem in different vocabulary, the third needs one idea on top, and the
// fourth looks like all of them and is not -- which is the skill the module has
// been building towards.

/// Best total from a row of houses, never taking two next to each other.
fn rob_linear(values: &[i32]) -> i32 {
    let mut take = 0; // best if this house is taken
    let mut skip = 0; // best if it is not
    for &v in values {
        let next_take = skip + v;
        let next_skip = skip.max(take);
        take = next_take;
        skip = next_skip;
    }
    take.max(skip)
}

/// The same row bent into a ring, so the first and last are neighbours.
///
/// One idea on top: the first and the last cannot both be taken, so the answer
/// is the better of two runs of the straight version -- one that is not allowed
/// the last house, one that is not allowed the first.
fn rob_circular(values: &[i32]) -> i32 {
    if values.len() == 1 {
        return values[0];
    }
    rob_linear(&values[..values.len() - 1]).max(rob_linear(&values[1..]))
}

/// Same problem, graph vocabulary: no two chosen vertices share an edge.
fn heaviest_independent_set(weights: &[i32], edges: &[(usize, usize)]) -> i32 {
    let n = weights.len();
    let mut best = 0;
    for mask in 0..(1usize << n) {
        let mut ok = true;
        for &(u, v) in edges {
            if mask >> u & 1 == 1 && mask >> v & 1 == 1 {
                ok = false;
            }
        }
        if ok {
            let total: i32 = (0..n).filter(|i| mask >> i & 1 == 1).map(|i| weights[i]).sum();
            if total > best {
                best = total;
            }
        }
    }
    best
}

/// Every subset, checked for adjacency.
fn brute(values: &[i32], circular: bool) -> i32 {
    let n = values.len();
    let mut best = 0;
    for mask in 0..(1usize << n) {
        let mut ok = true;
        for i in 0..n.saturating_sub(1) {
            if mask >> i & 1 == 1 && mask >> (i + 1) & 1 == 1 {
                ok = false;
            }
        }
        if circular && n > 1 && mask & 1 == 1 && mask >> (n - 1) & 1 == 1 {
            ok = false;
        }
        if ok {
            let total: i32 = (0..n).filter(|i| mask >> i & 1 == 1).map(|i| values[i]).sum();
            if total > best {
                best = total;
            }
        }
    }
    best
}

/// The impostor: the same recurrence, then the count clipped afterwards.
fn at_most_k_wrong(values: &[i32], k: usize) -> i32 {
    let mut sorted = values.to_vec();
    sorted.sort_by(|a, b| b.cmp(a));
    let top: i32 = sorted.iter().take(k).sum();
    rob_linear(values).min(top)
}

/// The state needs a second component: how many have been taken.
fn at_most_k_right(values: &[i32], k: usize) -> i32 {
    let n = values.len();
    let mut best = vec![vec![0i32; k + 1]; n + 2];
    for i in (0..n).rev() {
        for used in 0..=k {
            let skip = best[i + 1][used];
            let mut take = 0;
            if used < k {
                take = values[i] + best[i + 2][used + 1];
            }
            best[i][used] = skip.max(take);
        }
    }
    best[0][0]
}

fn brute_at_most_k(values: &[i32], k: usize) -> i32 {
    let n = values.len();
    let mut best = 0;
    for mask in 0..(1usize << n) {
        let chosen: Vec<usize> = (0..n).filter(|i| mask >> i & 1 == 1).collect();
        if chosen.len() > k {
            continue;
        }
        let ok = chosen.windows(2).all(|w| w[1] - w[0] > 1);
        if ok {
            let total: i32 = chosen.iter().map(|&i| values[i]).sum();
            if total > best {
                best = total;
            }
        }
    }
    best
}

fn rand(seed: &mut i64, n: i64) -> i32 {
    *seed = (*seed * 1103515245 + 12345) % 2147483648;
    (*seed / 65536 % n) as i32
}

fn main() {
    let houses = vec![6, 1, 2, 7, 1, 3, 9, 2, 5, 4];
    let edges: Vec<(usize, usize)> = (0..houses.len() - 1).map(|i| (i, i + 1)).collect();

    println!("houses [{}]", houses.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(", "));
    println!();
    println!("{:<44}{:>8}{:>14}", "statement", "answer", "brute force");
    println!("{:<44}{:>8}{:>14}", "a row of houses, no two adjacent", rob_linear(&houses), brute(&houses, false));
    println!("{:<44}{:>8}{:>14}", "a ring of houses, no two adjacent", rob_circular(&houses), brute(&houses, true));
    println!("{:<44}{:>8}{:>14}", "heaviest independent set on a path",
        heaviest_independent_set(&houses, &edges), brute(&houses, false));
    println!("{:<44}{:>8}{:>14}", "a row, no two adjacent, at most 3 of them",
        at_most_k_right(&houses, 3), brute_at_most_k(&houses, 3));
    println!("{:<44}{:>8}", "  the same, with the count clipped afterwards", at_most_k_wrong(&houses, 3));
    println!();

    const TRIALS: i32 = 2000;
    let mut seed = 1i64;
    let mut scores = [0i32; 5];
    for _ in 0..TRIALS {
        let n = 1 + rand(&mut seed, 10) as usize;
        let values: Vec<i32> = (0..n).map(|_| 1 + rand(&mut seed, 12)).collect();
        let k = 1 + rand(&mut seed, 4) as usize;
        let links: Vec<(usize, usize)> = (0..n.saturating_sub(1)).map(|i| (i, i + 1)).collect();
        if rob_linear(&values) == brute(&values, false) {
            scores[0] += 1;
        }
        if rob_circular(&values) == brute(&values, true) {
            scores[1] += 1;
        }
        if heaviest_independent_set(&values, &links) == brute(&values, false) {
            scores[2] += 1;
        }
        if at_most_k_right(&values, k) == brute_at_most_k(&values, k) {
            scores[3] += 1;
        }
        if at_most_k_wrong(&values, k) == brute_at_most_k(&values, k) {
            scores[4] += 1;
        }
    }

    println!("scored against exhaustive search on {} random rows:", TRIALS);
    let labels = [
        "a row of houses, no two adjacent",
        "a ring of houses, no two adjacent",
        "heaviest independent set on a path",
        "at most k, with k in the state",
        "at most k, clipped afterwards",
    ];
    for i in 0..5 {
        println!("  {:<40}{:>6}", labels[i], scores[i]);
    }
    println!();
    println!("the first three are one problem wearing three hats. The fourth adds five");
    println!("words to the statement and adds a dimension to the state, and the fifth is");
    println!("what happens when you assume it did not.");
}
`,
            },
            {
              lang: "go",
              code: `// The same trick, three costumes and one impostor. Two of these are the identical
// problem in different vocabulary, the third needs one idea on top, and the
// fourth looks like all of them and is not -- which is the skill the module has
// been building towards.
package main

import (
	"fmt"
	"sort"
	"strconv"
	"strings"
)

func maxOf(a, b int) int {
	if a > b {
		return a
	}
	return b
}

// Best total from a row of houses, never taking two next to each other.
func robLinear(values []int) int {
	take, skip := 0, 0 // best if this house is taken; best if it is not
	for _, v := range values {
		take, skip = skip+v, maxOf(skip, take)
	}
	return maxOf(take, skip)
}

// The same row bent into a ring, so the first and last are neighbours.
//
// One idea on top: the first and the last cannot both be taken, so the answer is
// the better of two runs of the straight version -- one that is not allowed the
// last house, one that is not allowed the first.
func robCircular(values []int) int {
	if len(values) == 1 {
		return values[0]
	}
	return maxOf(robLinear(values[:len(values)-1]), robLinear(values[1:]))
}

// Same problem, graph vocabulary: no two chosen vertices share an edge.
func heaviestIndependentSet(weights []int, edges [][2]int) int {
	n := len(weights)
	best := 0
	for mask := 0; mask < 1<<n; mask++ {
		ok := true
		for _, e := range edges {
			if mask>>e[0]&1 == 1 && mask>>e[1]&1 == 1 {
				ok = false
			}
		}
		if ok {
			total := 0
			for i := 0; i < n; i++ {
				if mask>>i&1 == 1 {
					total += weights[i]
				}
			}
			if total > best {
				best = total
			}
		}
	}
	return best
}

// Every subset, checked for adjacency.
func brute(values []int, circular bool) int {
	n := len(values)
	best := 0
	for mask := 0; mask < 1<<n; mask++ {
		ok := true
		for i := 0; i < n-1; i++ {
			if mask>>i&1 == 1 && mask>>(i+1)&1 == 1 {
				ok = false
			}
		}
		if circular && n > 1 && mask&1 == 1 && mask>>(n-1)&1 == 1 {
			ok = false
		}
		if ok {
			total := 0
			for i := 0; i < n; i++ {
				if mask>>i&1 == 1 {
					total += values[i]
				}
			}
			if total > best {
				best = total
			}
		}
	}
	return best
}

// The impostor: the same recurrence, then the count clipped afterwards.
func atMostKWrong(values []int, k int) int {
	sorted := append([]int{}, values...)
	sort.Sort(sort.Reverse(sort.IntSlice(sorted)))
	top := 0
	for i := 0; i < k && i < len(sorted); i++ {
		top += sorted[i]
	}
	if robLinear(values) < top {
		return robLinear(values)
	}
	return top
}

// The state needs a second component: how many have been taken.
func atMostKRight(values []int, k int) int {
	n := len(values)
	best := make([][]int, n+2)
	for i := range best {
		best[i] = make([]int, k+1)
	}
	for i := n - 1; i >= 0; i-- {
		for used := 0; used <= k; used++ {
			skip := best[i+1][used]
			take := 0
			if used < k {
				take = values[i] + best[i+2][used+1]
			}
			best[i][used] = maxOf(skip, take)
		}
	}
	return best[0][0]
}

func bruteAtMostK(values []int, k int) int {
	n := len(values)
	best := 0
	for mask := 0; mask < 1<<n; mask++ {
		var chosen []int
		for i := 0; i < n; i++ {
			if mask>>i&1 == 1 {
				chosen = append(chosen, i)
			}
		}
		if len(chosen) > k {
			continue
		}
		ok := true
		for j := 0; j+1 < len(chosen); j++ {
			if chosen[j+1]-chosen[j] <= 1 {
				ok = false
			}
		}
		if ok {
			total := 0
			for _, i := range chosen {
				total += values[i]
			}
			if total > best {
				best = total
			}
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
	houses := []int{6, 1, 2, 7, 1, 3, 9, 2, 5, 4}
	edges := make([][2]int, len(houses)-1)
	for i := 0; i < len(houses)-1; i++ {
		edges[i] = [2]int{i, i + 1}
	}

	parts := make([]string, len(houses))
	for i, v := range houses {
		parts[i] = strconv.Itoa(v)
	}
	fmt.Printf("houses [%s]\\n", strings.Join(parts, ", "))
	fmt.Println()
	fmt.Printf("%-44s%8s%14s\\n", "statement", "answer", "brute force")
	fmt.Printf("%-44s%8d%14d\\n", "a row of houses, no two adjacent", robLinear(houses), brute(houses, false))
	fmt.Printf("%-44s%8d%14d\\n", "a ring of houses, no two adjacent", robCircular(houses), brute(houses, true))
	fmt.Printf("%-44s%8d%14d\\n", "heaviest independent set on a path",
		heaviestIndependentSet(houses, edges), brute(houses, false))
	fmt.Printf("%-44s%8d%14d\\n", "a row, no two adjacent, at most 3 of them",
		atMostKRight(houses, 3), bruteAtMostK(houses, 3))
	fmt.Printf("%-44s%8d\\n", "  the same, with the count clipped afterwards", atMostKWrong(houses, 3))
	fmt.Println()

	const TRIALS = 2000
	scores := [5]int{}
	for t := 0; t < TRIALS; t++ {
		n := 1 + rand(10)
		values := make([]int, n)
		for i := range values {
			values[i] = 1 + rand(12)
		}
		k := 1 + rand(4)
		links := make([][2]int, 0, n)
		for i := 0; i < n-1; i++ {
			links = append(links, [2]int{i, i + 1})
		}
		if robLinear(values) == brute(values, false) {
			scores[0]++
		}
		if robCircular(values) == brute(values, true) {
			scores[1]++
		}
		if heaviestIndependentSet(values, links) == brute(values, false) {
			scores[2]++
		}
		if atMostKRight(values, k) == bruteAtMostK(values, k) {
			scores[3]++
		}
		if atMostKWrong(values, k) == bruteAtMostK(values, k) {
			scores[4]++
		}
	}

	fmt.Printf("scored against exhaustive search on %d random rows:\\n", TRIALS)
	labels := []string{
		"a row of houses, no two adjacent",
		"a ring of houses, no two adjacent",
		"heaviest independent set on a path",
		"at most k, with k in the state",
		"at most k, clipped afterwards",
	}
	for i, label := range labels {
		fmt.Printf("  %-40s%6d\\n", label, scores[i])
	}
	fmt.Println()
	fmt.Println("the first three are one problem wearing three hats. The fourth adds five")
	fmt.Println("words to the statement and adds a dimension to the state, and the fifth is")
	fmt.Println("what happens when you assume it did not.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Recognition tells you where to start, not what the answer is",
          body: "Adding \"at most k of them\" to a familiar statement adds a dimension to the state, and nothing about the resemblance warns you. The useful discipline is to let recognition suggest the shape and then re-derive the state from the statement in front of you, using lesson 3's checks, rather than from the memory of a similar problem.",
        },
        {
          title: "A small change to the statement can be a large change to the state",
          body: "Bending the row into a ring costs one idea and no extra dimension. Capping the count costs a dimension. Neither is predictable from how similar the sentences look, which is why the state gets written out in English before any code.",
        },
      ],
    },
    {
      id: "recognition-by-fingerprint",
      heading: "Recognising a problem by its first ten answers",
      body: [
        "Which raises a practical question: on an unseen problem, how do you find out *which* old problem it is? There is a mechanical answer, and it takes about two minutes.",
        "Write the brute force \u2014 you were going to write it anyway, because lesson 1 said the diagnosis needs a recursion to diagnose. Run it on the first ten inputs. Look at the sequence.",
        "Six statements, five distinct sequences, and the collapse is visible without any theory: the strings and the subsets are the same problem, and the two families of sequences are the two step-sets shifted by one place. The four identities at the bottom are checked, not asserted.",
        "That is the whole of pattern recognition made concrete, and it is worth doing even when you do not recognise the sequence \u2014 because a brute force that produces the first ten answers is exactly the oracle every example in this module has been checked against. Recognising the sequence is a bonus; having something to test against is the point.",
        "If the sequence looks familiar but you cannot place it, the encyclopedia of integer sequences exists precisely for this and takes ten seconds to search. That is a legitimate move, not a cheat: identifying the recurrence tells you which of the last seven lessons to apply.",
      ],
      examples: [
        {
          id: "fingerprints",
          title: "Six statements, grouped by the sequences they produce",
          lang: "python",
          code: `# The recognition drill, done by machine. Six statements, each counted by its own
# exhaustive enumeration, and then the first ten answers of each printed as a
# fingerprint. Statements with the same fingerprint are the same problem; the
# fingerprint is also how you tell apart two that merely look alike.

def bits(mask, n):
    return [(mask >> i) & 1 for i in range(n)]


def no_two_ones(n):
    """Binary strings of length n with no two adjacent ones."""
    total = 0
    for mask in range(1 << n):
        b = bits(mask, n)
        if all(not (b[i] and b[i + 1]) for i in range(n - 1)):
            total += 1
    return total


def sparse_subsets(n):
    """Subsets of 1..n with no two consecutive members."""
    total = 0
    for mask in range(1 << n):
        members = [i for i in range(n) if mask >> i & 1]
        if all(members[k + 1] - members[k] > 1 for k in range(len(members) - 1)):
            total += 1
    return total


def steps_one_two(n):
    """Sequences of 1s and 2s summing to n."""
    if n == 0:
        return 1
    total = 0
    if n >= 1:
        total += steps_one_two(n - 1)
    if n >= 2:
        total += steps_one_two(n - 2)
    return total


def no_three_ones(n):
    """Binary strings of length n with no three adjacent ones."""
    total = 0
    for mask in range(1 << n):
        b = bits(mask, n)
        if all(not (b[i] and b[i + 1] and b[i + 2]) for i in range(n - 2)):
            total += 1
    return total


def steps_one_two_three(n):
    """Sequences of 1s, 2s and 3s summing to n."""
    if n == 0:
        return 1
    total = 0
    for step in (1, 2, 3):
        if n >= step:
            total += steps_one_two_three(n - step)
    return total


def any_composition(n):
    """Sequences of any positive numbers summing to n."""
    if n == 0:
        return 1
    total = 0
    for step in range(1, n + 1):
        total += any_composition(n - step)
    return total


LENGTH = 10
STATEMENTS = [
    ("binary strings with no 11", no_two_ones),
    ("subsets with no two consecutive", sparse_subsets),
    ("sequences of 1s and 2s", steps_one_two),
    ("binary strings with no 111", no_three_ones),
    ("sequences of 1s, 2s and 3s", steps_one_two_three),
    ("sequences of any positive numbers", any_composition),
]

prints = []
for label, run in STATEMENTS:
    prints.append((label, [run(n) for n in range(LENGTH)]))

print(f"{'statement':<36}" + "".join(f"{n:>6}" for n in range(LENGTH)))
for label, row in prints:
    print(f"{label:<36}" + "".join(f"{v:>6}" for v in row))
print()

# Group by fingerprint, in the order the statements were listed.
groups = []
for label, row in prints:
    placed = False
    for group in groups:
        if group[0] == row:
            group[1].append(label)
            placed = True
            break
    if not placed:
        groups.append((row, [label]))

print(f"{len(prints)} statements, {len(groups)} distinct sequences:")
for row, labels in groups:
    print("  " + " = ".join(labels))
    print(f"      {row[0]}, {row[1]}, {row[2]}, {row[3]}, {row[4]}, {row[5]}, ...")
print()

# The first group is Fibonacci, the second is shifted Fibonacci, the third is
# tribonacci and the fourth is the powers of two. Checked rather than said.
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a


def trib(n):
    a, b, c = 0, 0, 1
    for _ in range(n):
        a, b, c = b, c, a + b + c
    return c


checks = [
    ("no 11 is fib(n+2)", all(no_two_ones(n) == fib(n + 2) for n in range(LENGTH))),
    ("1s and 2s is fib(n+1)", all(steps_one_two(n) == fib(n + 1) for n in range(LENGTH))),
    ("1s, 2s and 3s is tribonacci", all(steps_one_two_three(n) == trib(n) for n in range(LENGTH))),
    ("any positive numbers is 2^(n-1)",
     all(any_composition(n) == (1 if n == 0 else 1 << (n - 1)) for n in range(LENGTH))),
]
for label, ok in checks:
    print(f"  {label:<34}{'yes' if ok else 'no'}")
print()
print("two statements with the same fingerprint are the same recurrence with the")
print("same base cases; two that differ by a shift are the same recurrence started")
print("in a different place. That is the whole of pattern recognition, and it can")
print("be done from ten small answers before any code is written.")
`,
          output: `statement                                0     1     2     3     4     5     6     7     8     9
binary strings with no 11                1     2     3     5     8    13    21    34    55    89
subsets with no two consecutive          1     2     3     5     8    13    21    34    55    89
sequences of 1s and 2s                   1     1     2     3     5     8    13    21    34    55
binary strings with no 111               1     2     4     7    13    24    44    81   149   274
sequences of 1s, 2s and 3s               1     1     2     4     7    13    24    44    81   149
sequences of any positive numbers        1     1     2     4     8    16    32    64   128   256

6 statements, 5 distinct sequences:
  binary strings with no 11 = subsets with no two consecutive
      1, 2, 3, 5, 8, 13, ...
  sequences of 1s and 2s
      1, 1, 2, 3, 5, 8, ...
  binary strings with no 111
      1, 2, 4, 7, 13, 24, ...
  sequences of 1s, 2s and 3s
      1, 1, 2, 4, 7, 13, ...
  sequences of any positive numbers
      1, 1, 2, 4, 8, 16, ...

  no 11 is fib(n+2)                 yes
  1s and 2s is fib(n+1)             yes
  1s, 2s and 3s is tribonacci       yes
  any positive numbers is 2^(n-1)   yes

two statements with the same fingerprint are the same recurrence with the
same base cases; two that differ by a shift are the same recurrence started
in a different place. That is the whole of pattern recognition, and it can
be done from ten small answers before any code is written.`,
          explanation:
            "Each statement gets its own enumeration and the first ten answers become its fingerprint. Grouping is done on the fingerprints alone, with no knowledge of what any statement means -- and the identities at the end are checked against the sequences they claim to be.",
          alternates: [
            {
              lang: "javascript",
              code: `// The recognition drill, done by machine. Six statements, each counted by its own
// exhaustive enumeration, and then the first ten answers of each printed as a
// fingerprint. Statements with the same fingerprint are the same problem; the
// fingerprint is also how you tell apart two that merely look alike.

/** Binary strings of length n with no two adjacent ones. */
function noTwoOnes(n) {
  let total = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let ok = true;
    for (let i = 0; i < n - 1; i++) {
      if ((mask >> i) & 1 && (mask >> (i + 1)) & 1) ok = false;
    }
    if (ok) total++;
  }
  return total;
}

/** Subsets of 1..n with no two consecutive members. */
function sparseSubsets(n) {
  let total = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    const members = [];
    for (let i = 0; i < n; i++) if ((mask >> i) & 1) members.push(i);
    let ok = true;
    for (let k = 0; k + 1 < members.length; k++) if (members[k + 1] - members[k] <= 1) ok = false;
    if (ok) total++;
  }
  return total;
}

/** Sequences of 1s and 2s summing to n. */
function stepsOneTwo(n) {
  if (n === 0) return 1;
  let total = 0;
  if (n >= 1) total += stepsOneTwo(n - 1);
  if (n >= 2) total += stepsOneTwo(n - 2);
  return total;
}

/** Binary strings of length n with no three adjacent ones. */
function noThreeOnes(n) {
  let total = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let ok = true;
    for (let i = 0; i < n - 2; i++) {
      if ((mask >> i) & 1 && (mask >> (i + 1)) & 1 && (mask >> (i + 2)) & 1) ok = false;
    }
    if (ok) total++;
  }
  return total;
}

/** Sequences of 1s, 2s and 3s summing to n. */
function stepsOneTwoThree(n) {
  if (n === 0) return 1;
  let total = 0;
  for (let step = 1; step <= 3; step++) if (n >= step) total += stepsOneTwoThree(n - step);
  return total;
}

/** Sequences of any positive numbers summing to n. */
function anyComposition(n) {
  if (n === 0) return 1;
  let total = 0;
  for (let step = 1; step <= n; step++) total += anyComposition(n - step);
  return total;
}

const LENGTH = 10;
const LABELS = [
  "binary strings with no 11",
  "subsets with no two consecutive",
  "sequences of 1s and 2s",
  "binary strings with no 111",
  "sequences of 1s, 2s and 3s",
  "sequences of any positive numbers",
];

function run(which, n) {
  if (which === 0) return noTwoOnes(n);
  if (which === 1) return sparseSubsets(n);
  if (which === 2) return stepsOneTwo(n);
  if (which === 3) return noThreeOnes(n);
  if (which === 4) return stepsOneTwoThree(n);
  return anyComposition(n);
}

/** The sequence itself: fib(1) = fib(2) = 1. */
function fib(n) {
  let a = 0;
  let b = 1;
  for (let i = 0; i < n; i++) {
    const next = a + b;
    a = b;
    b = next;
  }
  return a;
}

function trib(n) {
  let a = 0;
  let b = 0;
  let c = 1;
  for (let i = 0; i < n; i++) {
    const next = a + b + c;
    a = b;
    b = c;
    c = next;
  }
  return c;
}

const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);

const prints = LABELS.map((_, k) => Array.from({ length: LENGTH }, (__, n) => run(k, n)));

let header = padEnd("statement", 36);
for (let n = 0; n < LENGTH; n++) header += pad(n, 6);
console.log(header);
for (let k = 0; k < LABELS.length; k++) {
  console.log(padEnd(LABELS[k], 36) + prints[k].map((v) => pad(v, 6)).join(""));
}
console.log();

// Group by fingerprint, in the order the statements were listed.
const rows = [];
const names = [];
for (let k = 0; k < LABELS.length; k++) {
  let placed = false;
  for (let g = 0; g < rows.length; g++) {
    if (rows[g].every((v, n) => v === prints[k][n])) {
      names[g].push(LABELS[k]);
      placed = true;
      break;
    }
  }
  if (!placed) {
    rows.push(prints[k]);
    names.push([LABELS[k]]);
  }
}

console.log(\`\${LABELS.length} statements, \${rows.length} distinct sequences:\`);
for (let g = 0; g < rows.length; g++) {
  console.log("  " + names[g].join(" = "));
  const r = rows[g];
  console.log(\`      \${r[0]}, \${r[1]}, \${r[2]}, \${r[3]}, \${r[4]}, \${r[5]}, ...\`);
}
console.log();

// The first group is Fibonacci, the second is shifted Fibonacci, the third is
// tribonacci and the fourth is the powers of two. Checked rather than said.
let a = true;
let b = true;
let c = true;
let d = true;
for (let n = 0; n < LENGTH; n++) {
  if (noTwoOnes(n) !== fib(n + 2)) a = false;
  if (stepsOneTwo(n) !== fib(n + 1)) b = false;
  if (stepsOneTwoThree(n) !== trib(n)) c = false;
  if (anyComposition(n) !== (n === 0 ? 1 : 2 ** (n - 1))) d = false;
}
console.log(\`  \${padEnd("no 11 is fib(n+2)", 34)}\${a ? "yes" : "no"}\`);
console.log(\`  \${padEnd("1s and 2s is fib(n+1)", 34)}\${b ? "yes" : "no"}\`);
console.log(\`  \${padEnd("1s, 2s and 3s is tribonacci", 34)}\${c ? "yes" : "no"}\`);
console.log(\`  \${padEnd("any positive numbers is 2^(n-1)", 34)}\${d ? "yes" : "no"}\`);
console.log();
console.log("two statements with the same fingerprint are the same recurrence with the");
console.log("same base cases; two that differ by a shift are the same recurrence started");
console.log("in a different place. That is the whole of pattern recognition, and it can");
console.log("be done from ten small answers before any code is written.");
`,
            },
            {
              lang: "typescript",
              code: `// The recognition drill, done by machine. Six statements, each counted by its own
// exhaustive enumeration, and then the first ten answers of each printed as a
// fingerprint. Statements with the same fingerprint are the same problem; the
// fingerprint is also how you tell apart two that merely look alike.

/** Binary strings of length n with no two adjacent ones. */
function noTwoOnes(n: number): number {
  let total = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let ok = true;
    for (let i = 0; i < n - 1; i++) {
      if ((mask >> i) & 1 && (mask >> (i + 1)) & 1) ok = false;
    }
    if (ok) total++;
  }
  return total;
}

/** Subsets of 1..n with no two consecutive members. */
function sparseSubsets(n: number): number {
  let total = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    const members: number[] = [];
    for (let i = 0; i < n; i++) if ((mask >> i) & 1) members.push(i);
    let ok = true;
    for (let k = 0; k + 1 < members.length; k++) if (members[k + 1] - members[k] <= 1) ok = false;
    if (ok) total++;
  }
  return total;
}

/** Sequences of 1s and 2s summing to n. */
function stepsOneTwo(n: number): number {
  if (n === 0) return 1;
  let total = 0;
  if (n >= 1) total += stepsOneTwo(n - 1);
  if (n >= 2) total += stepsOneTwo(n - 2);
  return total;
}

/** Binary strings of length n with no three adjacent ones. */
function noThreeOnes(n: number): number {
  let total = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let ok = true;
    for (let i = 0; i < n - 2; i++) {
      if ((mask >> i) & 1 && (mask >> (i + 1)) & 1 && (mask >> (i + 2)) & 1) ok = false;
    }
    if (ok) total++;
  }
  return total;
}

/** Sequences of 1s, 2s and 3s summing to n. */
function stepsOneTwoThree(n: number): number {
  if (n === 0) return 1;
  let total = 0;
  for (let step = 1; step <= 3; step++) if (n >= step) total += stepsOneTwoThree(n - step);
  return total;
}

/** Sequences of any positive numbers summing to n. */
function anyComposition(n: number): number {
  if (n === 0) return 1;
  let total = 0;
  for (let step = 1; step <= n; step++) total += anyComposition(n - step);
  return total;
}

const LENGTH = 10;
const LABELS = [
  "binary strings with no 11",
  "subsets with no two consecutive",
  "sequences of 1s and 2s",
  "binary strings with no 111",
  "sequences of 1s, 2s and 3s",
  "sequences of any positive numbers",
];

function run(which: number, n: number): number {
  if (which === 0) return noTwoOnes(n);
  if (which === 1) return sparseSubsets(n);
  if (which === 2) return stepsOneTwo(n);
  if (which === 3) return noThreeOnes(n);
  if (which === 4) return stepsOneTwoThree(n);
  return anyComposition(n);
}

/** The sequence itself: fib(1) = fib(2) = 1. */
function fib(n: number): number {
  let a = 0;
  let b = 1;
  for (let i = 0; i < n; i++) {
    const next = a + b;
    a = b;
    b = next;
  }
  return a;
}

function trib(n: number): number {
  let a = 0;
  let b = 0;
  let c = 1;
  for (let i = 0; i < n; i++) {
    const next = a + b + c;
    a = b;
    b = c;
    c = next;
  }
  return c;
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

const prints = LABELS.map((_, k) => Array.from({ length: LENGTH }, (__, n) => run(k, n)));

let header = padEnd("statement", 36);
for (let n = 0; n < LENGTH; n++) header += pad(n, 6);
console.log(header);
for (let k = 0; k < LABELS.length; k++) {
  console.log(padEnd(LABELS[k], 36) + prints[k].map((v) => pad(v, 6)).join(""));
}
console.log();

// Group by fingerprint, in the order the statements were listed.
const rows: number[][] = [];
const names: string[][] = [];
for (let k = 0; k < LABELS.length; k++) {
  let placed = false;
  for (let g = 0; g < rows.length; g++) {
    if (rows[g].every((v, n) => v === prints[k][n])) {
      names[g].push(LABELS[k]);
      placed = true;
      break;
    }
  }
  if (!placed) {
    rows.push(prints[k]);
    names.push([LABELS[k]]);
  }
}

console.log(\`\${LABELS.length} statements, \${rows.length} distinct sequences:\`);
for (let g = 0; g < rows.length; g++) {
  console.log("  " + names[g].join(" = "));
  const r = rows[g];
  console.log(\`      \${r[0]}, \${r[1]}, \${r[2]}, \${r[3]}, \${r[4]}, \${r[5]}, ...\`);
}
console.log();

// The first group is Fibonacci, the second is shifted Fibonacci, the third is
// tribonacci and the fourth is the powers of two. Checked rather than said.
let a = true;
let b = true;
let c = true;
let d = true;
for (let n = 0; n < LENGTH; n++) {
  if (noTwoOnes(n) !== fib(n + 2)) a = false;
  if (stepsOneTwo(n) !== fib(n + 1)) b = false;
  if (stepsOneTwoThree(n) !== trib(n)) c = false;
  if (anyComposition(n) !== (n === 0 ? 1 : 2 ** (n - 1))) d = false;
}
console.log(\`  \${padEnd("no 11 is fib(n+2)", 34)}\${a ? "yes" : "no"}\`);
console.log(\`  \${padEnd("1s and 2s is fib(n+1)", 34)}\${b ? "yes" : "no"}\`);
console.log(\`  \${padEnd("1s, 2s and 3s is tribonacci", 34)}\${c ? "yes" : "no"}\`);
console.log(\`  \${padEnd("any positive numbers is 2^(n-1)", 34)}\${d ? "yes" : "no"}\`);
console.log();
console.log("two statements with the same fingerprint are the same recurrence with the");
console.log("same base cases; two that differ by a shift are the same recurrence started");
console.log("in a different place. That is the whole of pattern recognition, and it can");
console.log("be done from ten small answers before any code is written.");
`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

// The recognition drill, done by machine. Six statements, each counted by its own
// exhaustive enumeration, and then the first ten answers of each printed as a
// fingerprint. Statements with the same fingerprint are the same problem; the
// fingerprint is also how you tell apart two that merely look alike.
public class Main {
    /** Binary strings of length n with no two adjacent ones. */
    static long noTwoOnes(int n) {
        long total = 0;
        for (int mask = 0; mask < (1 << n); mask++) {
            boolean ok = true;
            for (int i = 0; i < n - 1; i++) {
                if ((mask >> i & 1) == 1 && (mask >> (i + 1) & 1) == 1) ok = false;
            }
            if (ok) total++;
        }
        return total;
    }

    /** Subsets of 1..n with no two consecutive members. */
    static long sparseSubsets(int n) {
        long total = 0;
        for (int mask = 0; mask < (1 << n); mask++) {
            List<Integer> members = new ArrayList<>();
            for (int i = 0; i < n; i++) if ((mask >> i & 1) == 1) members.add(i);
            boolean ok = true;
            for (int k = 0; k + 1 < members.size(); k++) {
                if (members.get(k + 1) - members.get(k) <= 1) ok = false;
            }
            if (ok) total++;
        }
        return total;
    }

    /** Sequences of 1s and 2s summing to n. */
    static long stepsOneTwo(int n) {
        if (n == 0) return 1;
        long total = 0;
        if (n >= 1) total += stepsOneTwo(n - 1);
        if (n >= 2) total += stepsOneTwo(n - 2);
        return total;
    }

    /** Binary strings of length n with no three adjacent ones. */
    static long noThreeOnes(int n) {
        long total = 0;
        for (int mask = 0; mask < (1 << n); mask++) {
            boolean ok = true;
            for (int i = 0; i < n - 2; i++) {
                if ((mask >> i & 1) == 1 && (mask >> (i + 1) & 1) == 1 && (mask >> (i + 2) & 1) == 1) {
                    ok = false;
                }
            }
            if (ok) total++;
        }
        return total;
    }

    /** Sequences of 1s, 2s and 3s summing to n. */
    static long stepsOneTwoThree(int n) {
        if (n == 0) return 1;
        long total = 0;
        for (int step = 1; step <= 3; step++) {
            if (n >= step) total += stepsOneTwoThree(n - step);
        }
        return total;
    }

    /** Sequences of any positive numbers summing to n. */
    static long anyComposition(int n) {
        if (n == 0) return 1;
        long total = 0;
        for (int step = 1; step <= n; step++) total += anyComposition(n - step);
        return total;
    }

    static final int LENGTH = 10;
    static final String[] LABELS = {
        "binary strings with no 11",
        "subsets with no two consecutive",
        "sequences of 1s and 2s",
        "binary strings with no 111",
        "sequences of 1s, 2s and 3s",
        "sequences of any positive numbers",
    };

    static long run(int which, int n) {
        switch (which) {
            case 0: return noTwoOnes(n);
            case 1: return sparseSubsets(n);
            case 2: return stepsOneTwo(n);
            case 3: return noThreeOnes(n);
            case 4: return stepsOneTwoThree(n);
            default: return anyComposition(n);
        }
    }

    /** The sequence itself: fib(1) = fib(2) = 1. */
    static long fib(int n) {
        long a = 0, b = 1;
        for (int i = 0; i < n; i++) {
            long next = a + b;
            a = b;
            b = next;
        }
        return a;
    }

    static long trib(int n) {
        long a = 0, b = 0, c = 1;
        for (int i = 0; i < n; i++) {
            long next = a + b + c;
            a = b;
            b = c;
            c = next;
        }
        return c;
    }

    public static void main(String[] args) {
        List<long[]> prints = new ArrayList<>();
        for (int k = 0; k < LABELS.length; k++) {
            long[] row = new long[LENGTH];
            for (int n = 0; n < LENGTH; n++) row[n] = run(k, n);
            prints.add(row);
        }

        StringBuilder header = new StringBuilder(String.format("%-36s", "statement"));
        for (int n = 0; n < LENGTH; n++) header.append(String.format("%6d", n));
        System.out.println(header);
        for (int k = 0; k < LABELS.length; k++) {
            StringBuilder line = new StringBuilder(String.format("%-36s", LABELS[k]));
            for (int n = 0; n < LENGTH; n++) line.append(String.format("%6d", prints.get(k)[n]));
            System.out.println(line);
        }
        System.out.println();

        // Group by fingerprint, in the order the statements were listed.
        List<long[]> rows = new ArrayList<>();
        List<List<String>> names = new ArrayList<>();
        for (int k = 0; k < LABELS.length; k++) {
            boolean placed = false;
            for (int g = 0; g < rows.size(); g++) {
                if (Arrays.equals(rows.get(g), prints.get(k))) {
                    names.get(g).add(LABELS[k]);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                rows.add(prints.get(k));
                List<String> group = new ArrayList<>();
                group.add(LABELS[k]);
                names.add(group);
            }
        }

        System.out.printf("%d statements, %d distinct sequences:%n", LABELS.length, rows.size());
        for (int g = 0; g < rows.size(); g++) {
            System.out.println("  " + String.join(" = ", names.get(g)));
            long[] row = rows.get(g);
            System.out.printf("      %d, %d, %d, %d, %d, %d, ...%n",
                row[0], row[1], row[2], row[3], row[4], row[5]);
        }
        System.out.println();

        // The first group is Fibonacci, the second is shifted Fibonacci, the
        // third is tribonacci and the fourth is the powers of two. Checked rather
        // than said.
        boolean a = true, b = true, c = true, d = true;
        for (int n = 0; n < LENGTH; n++) {
            if (noTwoOnes(n) != fib(n + 2)) a = false;
            if (stepsOneTwo(n) != fib(n + 1)) b = false;
            if (stepsOneTwoThree(n) != trib(n)) c = false;
            if (anyComposition(n) != (n == 0 ? 1L : 1L << (n - 1))) d = false;
        }
        System.out.printf("  %-34s%s%n", "no 11 is fib(n+2)", a ? "yes" : "no");
        System.out.printf("  %-34s%s%n", "1s and 2s is fib(n+1)", b ? "yes" : "no");
        System.out.printf("  %-34s%s%n", "1s, 2s and 3s is tribonacci", c ? "yes" : "no");
        System.out.printf("  %-34s%s%n", "any positive numbers is 2^(n-1)", d ? "yes" : "no");
        System.out.println();
        System.out.println("two statements with the same fingerprint are the same recurrence with the");
        System.out.println("same base cases; two that differ by a shift are the same recurrence started");
        System.out.println("in a different place. That is the whole of pattern recognition, and it can");
        System.out.println("be done from ten small answers before any code is written.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The recognition drill, done by machine. Six statements, each counted by its own
// exhaustive enumeration, and then the first ten answers of each printed as a
// fingerprint. Statements with the same fingerprint are the same problem; the
// fingerprint is also how you tell apart two that merely look alike.
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

// Binary strings of length n with no two adjacent ones.
std::int64_t noTwoOnes(int n) {
    std::int64_t total = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        bool ok = true;
        for (int i = 0; i < n - 1; i++) {
            if ((mask >> i & 1) && (mask >> (i + 1) & 1)) ok = false;
        }
        if (ok) total++;
    }
    return total;
}

// Subsets of 1..n with no two consecutive members.
std::int64_t sparseSubsets(int n) {
    std::int64_t total = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        std::vector<int> members;
        for (int i = 0; i < n; i++)
            if (mask >> i & 1) members.push_back(i);
        bool ok = true;
        for (size_t k = 0; k + 1 < members.size(); k++) {
            if (members[k + 1] - members[k] <= 1) ok = false;
        }
        if (ok) total++;
    }
    return total;
}

// Sequences of 1s and 2s summing to n.
std::int64_t stepsOneTwo(int n) {
    if (n == 0) return 1;
    std::int64_t total = 0;
    if (n >= 1) total += stepsOneTwo(n - 1);
    if (n >= 2) total += stepsOneTwo(n - 2);
    return total;
}

// Binary strings of length n with no three adjacent ones.
std::int64_t noThreeOnes(int n) {
    std::int64_t total = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        bool ok = true;
        for (int i = 0; i < n - 2; i++) {
            if ((mask >> i & 1) && (mask >> (i + 1) & 1) && (mask >> (i + 2) & 1)) ok = false;
        }
        if (ok) total++;
    }
    return total;
}

// Sequences of 1s, 2s and 3s summing to n.
std::int64_t stepsOneTwoThree(int n) {
    if (n == 0) return 1;
    std::int64_t total = 0;
    for (int step = 1; step <= 3; step++) {
        if (n >= step) total += stepsOneTwoThree(n - step);
    }
    return total;
}

// Sequences of any positive numbers summing to n.
std::int64_t anyComposition(int n) {
    if (n == 0) return 1;
    std::int64_t total = 0;
    for (int step = 1; step <= n; step++) total += anyComposition(n - step);
    return total;
}

static const int LENGTH = 10;
static const std::array<std::string, 6> LABELS = {
    "binary strings with no 11",
    "subsets with no two consecutive",
    "sequences of 1s and 2s",
    "binary strings with no 111",
    "sequences of 1s, 2s and 3s",
    "sequences of any positive numbers",
};

std::int64_t run(int which, int n) {
    switch (which) {
        case 0: return noTwoOnes(n);
        case 1: return sparseSubsets(n);
        case 2: return stepsOneTwo(n);
        case 3: return noThreeOnes(n);
        case 4: return stepsOneTwoThree(n);
        default: return anyComposition(n);
    }
}

// The sequence itself: fib(1) = fib(2) = 1.
std::int64_t fib(int n) {
    std::int64_t a = 0, b = 1;
    for (int i = 0; i < n; i++) {
        std::int64_t next = a + b;
        a = b;
        b = next;
    }
    return a;
}

std::int64_t trib(int n) {
    std::int64_t a = 0, b = 0, c = 1;
    for (int i = 0; i < n; i++) {
        std::int64_t next = a + b + c;
        a = b;
        b = c;
        c = next;
    }
    return c;
}

int main() {
    std::vector<std::vector<std::int64_t>> prints;
    for (size_t k = 0; k < LABELS.size(); k++) {
        std::vector<std::int64_t> row;
        for (int n = 0; n < LENGTH; n++) row.push_back(run(static_cast<int>(k), n));
        prints.push_back(row);
    }

    std::cout << std::left << std::setw(36) << "statement";
    for (int n = 0; n < LENGTH; n++) std::cout << std::right << std::setw(6) << n;
    std::cout << "\\n";
    for (size_t k = 0; k < LABELS.size(); k++) {
        std::cout << std::left << std::setw(36) << LABELS[k];
        for (int n = 0; n < LENGTH; n++) std::cout << std::right << std::setw(6) << prints[k][n];
        std::cout << "\\n";
    }
    std::cout << "\\n";

    // Group by fingerprint, in the order the statements were listed.
    std::vector<std::vector<std::int64_t>> rows;
    std::vector<std::vector<std::string>> names;
    for (size_t k = 0; k < LABELS.size(); k++) {
        bool placed = false;
        for (size_t g = 0; g < rows.size(); g++) {
            if (rows[g] == prints[k]) {
                names[g].push_back(LABELS[k]);
                placed = true;
                break;
            }
        }
        if (!placed) {
            rows.push_back(prints[k]);
            names.push_back({LABELS[k]});
        }
    }

    std::cout << LABELS.size() << " statements, " << rows.size() << " distinct sequences:\\n";
    for (size_t g = 0; g < rows.size(); g++) {
        std::cout << "  ";
        for (size_t i = 0; i < names[g].size(); i++) {
            if (i > 0) std::cout << " = ";
            std::cout << names[g][i];
        }
        std::cout << "\\n      " << rows[g][0] << ", " << rows[g][1] << ", " << rows[g][2] << ", "
                  << rows[g][3] << ", " << rows[g][4] << ", " << rows[g][5] << ", ...\\n";
    }
    std::cout << "\\n";

    // The first group is Fibonacci, the second is shifted Fibonacci, the third is
    // tribonacci and the fourth is the powers of two. Checked rather than said.
    bool a = true, b = true, c = true, d = true;
    for (int n = 0; n < LENGTH; n++) {
        if (noTwoOnes(n) != fib(n + 2)) a = false;
        if (stepsOneTwo(n) != fib(n + 1)) b = false;
        if (stepsOneTwoThree(n) != trib(n)) c = false;
        std::int64_t want = n == 0 ? 1 : (std::int64_t(1) << (n - 1));
        if (anyComposition(n) != want) d = false;
    }
    std::cout << "  " << std::left << std::setw(34) << "no 11 is fib(n+2)" << (a ? "yes" : "no") << "\\n";
    std::cout << "  " << std::left << std::setw(34) << "1s and 2s is fib(n+1)" << (b ? "yes" : "no") << "\\n";
    std::cout << "  " << std::left << std::setw(34) << "1s, 2s and 3s is tribonacci" << (c ? "yes" : "no") << "\\n";
    std::cout << "  " << std::left << std::setw(34) << "any positive numbers is 2^(n-1)" << (d ? "yes" : "no") << "\\n\\n";
    std::cout << "two statements with the same fingerprint are the same recurrence with the\\n";
    std::cout << "same base cases; two that differ by a shift are the same recurrence started\\n";
    std::cout << "in a different place. That is the whole of pattern recognition, and it can\\n";
    std::cout << "be done from ten small answers before any code is written.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// The recognition drill, done by machine. Six statements, each counted by its own
// exhaustive enumeration, and then the first ten answers of each printed as a
// fingerprint. Statements with the same fingerprint are the same problem; the
// fingerprint is also how you tell apart two that merely look alike.

/// Binary strings of length n with no two adjacent ones.
fn no_two_ones(n: usize) -> i64 {
    let mut total = 0i64;
    for mask in 0..(1usize << n) {
        let mut ok = true;
        for i in 0..n.saturating_sub(1) {
            if mask >> i & 1 == 1 && mask >> (i + 1) & 1 == 1 {
                ok = false;
            }
        }
        if ok {
            total += 1;
        }
    }
    total
}

/// Subsets of 1..n with no two consecutive members.
fn sparse_subsets(n: usize) -> i64 {
    let mut total = 0i64;
    for mask in 0..(1usize << n) {
        let members: Vec<usize> = (0..n).filter(|i| mask >> i & 1 == 1).collect();
        if members.windows(2).all(|w| w[1] - w[0] > 1) {
            total += 1;
        }
    }
    total
}

/// Sequences of 1s and 2s summing to n.
fn steps_one_two(n: i32) -> i64 {
    if n == 0 {
        return 1;
    }
    let mut total = 0i64;
    if n >= 1 {
        total += steps_one_two(n - 1);
    }
    if n >= 2 {
        total += steps_one_two(n - 2);
    }
    total
}

/// Binary strings of length n with no three adjacent ones.
fn no_three_ones(n: usize) -> i64 {
    let mut total = 0i64;
    for mask in 0..(1usize << n) {
        let mut ok = true;
        for i in 0..n.saturating_sub(2) {
            if mask >> i & 1 == 1 && mask >> (i + 1) & 1 == 1 && mask >> (i + 2) & 1 == 1 {
                ok = false;
            }
        }
        if ok {
            total += 1;
        }
    }
    total
}

/// Sequences of 1s, 2s and 3s summing to n.
fn steps_one_two_three(n: i32) -> i64 {
    if n == 0 {
        return 1;
    }
    let mut total = 0i64;
    for step in 1..=3 {
        if n >= step {
            total += steps_one_two_three(n - step);
        }
    }
    total
}

/// Sequences of any positive numbers summing to n.
fn any_composition(n: i32) -> i64 {
    if n == 0 {
        return 1;
    }
    let mut total = 0i64;
    for step in 1..=n {
        total += any_composition(n - step);
    }
    total
}

const LENGTH: usize = 10;
const LABELS: [&str; 6] = [
    "binary strings with no 11",
    "subsets with no two consecutive",
    "sequences of 1s and 2s",
    "binary strings with no 111",
    "sequences of 1s, 2s and 3s",
    "sequences of any positive numbers",
];

fn run(which: usize, n: usize) -> i64 {
    match which {
        0 => no_two_ones(n),
        1 => sparse_subsets(n),
        2 => steps_one_two(n as i32),
        3 => no_three_ones(n),
        4 => steps_one_two_three(n as i32),
        _ => any_composition(n as i32),
    }
}

/// The sequence itself: fib(1) = fib(2) = 1.
fn fib(n: i32) -> i64 {
    let (mut a, mut b) = (0i64, 1i64);
    for _ in 0..n {
        let next = a + b;
        a = b;
        b = next;
    }
    a
}

fn trib(n: i32) -> i64 {
    let (mut a, mut b, mut c) = (0i64, 0i64, 1i64);
    for _ in 0..n {
        let next = a + b + c;
        a = b;
        b = c;
        c = next;
    }
    c
}

fn main() {
    let prints: Vec<Vec<i64>> =
        (0..LABELS.len()).map(|k| (0..LENGTH).map(|n| run(k, n)).collect()).collect();

    let mut header = format!("{:<36}", "statement");
    for n in 0..LENGTH {
        header.push_str(&format!("{:>6}", n));
    }
    println!("{}", header);
    for k in 0..LABELS.len() {
        let mut line = format!("{:<36}", LABELS[k]);
        for n in 0..LENGTH {
            line.push_str(&format!("{:>6}", prints[k][n]));
        }
        println!("{}", line);
    }
    println!();

    // Group by fingerprint, in the order the statements were listed.
    let mut rows: Vec<Vec<i64>> = Vec::new();
    let mut names: Vec<Vec<&str>> = Vec::new();
    for k in 0..LABELS.len() {
        let mut placed = false;
        for g in 0..rows.len() {
            if rows[g] == prints[k] {
                names[g].push(LABELS[k]);
                placed = true;
                break;
            }
        }
        if !placed {
            rows.push(prints[k].clone());
            names.push(vec![LABELS[k]]);
        }
    }

    println!("{} statements, {} distinct sequences:", LABELS.len(), rows.len());
    for g in 0..rows.len() {
        println!("  {}", names[g].join(" = "));
        println!("      {}, {}, {}, {}, {}, {}, ...",
            rows[g][0], rows[g][1], rows[g][2], rows[g][3], rows[g][4], rows[g][5]);
    }
    println!();

    // The first group is Fibonacci, the second is shifted Fibonacci, the third is
    // tribonacci and the fourth is the powers of two. Checked rather than said.
    let a = (0..LENGTH).all(|n| no_two_ones(n) == fib(n as i32 + 2));
    let b = (0..LENGTH).all(|n| steps_one_two(n as i32) == fib(n as i32 + 1));
    let c = (0..LENGTH).all(|n| steps_one_two_three(n as i32) == trib(n as i32));
    let d = (0..LENGTH).all(|n| {
        let want = if n == 0 { 1i64 } else { 1i64 << (n - 1) };
        any_composition(n as i32) == want
    });
    let yes = |ok: bool| if ok { "yes" } else { "no" };
    println!("  {:<34}{}", "no 11 is fib(n+2)", yes(a));
    println!("  {:<34}{}", "1s and 2s is fib(n+1)", yes(b));
    println!("  {:<34}{}", "1s, 2s and 3s is tribonacci", yes(c));
    println!("  {:<34}{}", "any positive numbers is 2^(n-1)", yes(d));
    println!();
    println!("two statements with the same fingerprint are the same recurrence with the");
    println!("same base cases; two that differ by a shift are the same recurrence started");
    println!("in a different place. That is the whole of pattern recognition, and it can");
    println!("be done from ten small answers before any code is written.");
}
`,
            },
            {
              lang: "go",
              code: `// The recognition drill, done by machine. Six statements, each counted by its own
// exhaustive enumeration, and then the first ten answers of each printed as a
// fingerprint. Statements with the same fingerprint are the same problem; the
// fingerprint is also how you tell apart two that merely look alike.
package main

import (
	"fmt"
	"strings"
)

// Binary strings of length n with no two adjacent ones.
func noTwoOnes(n int) int64 {
	var total int64
	for mask := 0; mask < 1<<n; mask++ {
		ok := true
		for i := 0; i < n-1; i++ {
			if mask>>i&1 == 1 && mask>>(i+1)&1 == 1 {
				ok = false
			}
		}
		if ok {
			total++
		}
	}
	return total
}

// Subsets of 1..n with no two consecutive members.
func sparseSubsets(n int) int64 {
	var total int64
	for mask := 0; mask < 1<<n; mask++ {
		var members []int
		for i := 0; i < n; i++ {
			if mask>>i&1 == 1 {
				members = append(members, i)
			}
		}
		ok := true
		for k := 0; k+1 < len(members); k++ {
			if members[k+1]-members[k] <= 1 {
				ok = false
			}
		}
		if ok {
			total++
		}
	}
	return total
}

// Sequences of 1s and 2s summing to n.
func stepsOneTwo(n int) int64 {
	if n == 0 {
		return 1
	}
	var total int64
	if n >= 1 {
		total += stepsOneTwo(n - 1)
	}
	if n >= 2 {
		total += stepsOneTwo(n - 2)
	}
	return total
}

// Binary strings of length n with no three adjacent ones.
func noThreeOnes(n int) int64 {
	var total int64
	for mask := 0; mask < 1<<n; mask++ {
		ok := true
		for i := 0; i < n-2; i++ {
			if mask>>i&1 == 1 && mask>>(i+1)&1 == 1 && mask>>(i+2)&1 == 1 {
				ok = false
			}
		}
		if ok {
			total++
		}
	}
	return total
}

// Sequences of 1s, 2s and 3s summing to n.
func stepsOneTwoThree(n int) int64 {
	if n == 0 {
		return 1
	}
	var total int64
	for step := 1; step <= 3; step++ {
		if n >= step {
			total += stepsOneTwoThree(n - step)
		}
	}
	return total
}

// Sequences of any positive numbers summing to n.
func anyComposition(n int) int64 {
	if n == 0 {
		return 1
	}
	var total int64
	for step := 1; step <= n; step++ {
		total += anyComposition(n - step)
	}
	return total
}

const LENGTH = 10

var LABELS = []string{
	"binary strings with no 11",
	"subsets with no two consecutive",
	"sequences of 1s and 2s",
	"binary strings with no 111",
	"sequences of 1s, 2s and 3s",
	"sequences of any positive numbers",
}

func run(which, n int) int64 {
	switch which {
	case 0:
		return noTwoOnes(n)
	case 1:
		return sparseSubsets(n)
	case 2:
		return stepsOneTwo(n)
	case 3:
		return noThreeOnes(n)
	case 4:
		return stepsOneTwoThree(n)
	default:
		return anyComposition(n)
	}
}

// The sequence itself: fib(1) = fib(2) = 1.
func fib(n int) int64 {
	var a, b int64 = 0, 1
	for i := 0; i < n; i++ {
		a, b = b, a+b
	}
	return a
}

func trib(n int) int64 {
	var a, b, c int64 = 0, 0, 1
	for i := 0; i < n; i++ {
		a, b, c = b, c, a+b+c
	}
	return c
}

func main() {
	prints := make([][]int64, len(LABELS))
	for k := range LABELS {
		prints[k] = make([]int64, LENGTH)
		for n := 0; n < LENGTH; n++ {
			prints[k][n] = run(k, n)
		}
	}

	header := fmt.Sprintf("%-36s", "statement")
	for n := 0; n < LENGTH; n++ {
		header += fmt.Sprintf("%6d", n)
	}
	fmt.Println(header)
	for k, label := range LABELS {
		line := fmt.Sprintf("%-36s", label)
		for n := 0; n < LENGTH; n++ {
			line += fmt.Sprintf("%6d", prints[k][n])
		}
		fmt.Println(line)
	}
	fmt.Println()

	// Group by fingerprint, in the order the statements were listed.
	var rows [][]int64
	var names [][]string
	for k, label := range LABELS {
		placed := false
		for g := range rows {
			same := true
			for n := 0; n < LENGTH; n++ {
				if rows[g][n] != prints[k][n] {
					same = false
				}
			}
			if same {
				names[g] = append(names[g], label)
				placed = true
				break
			}
		}
		if !placed {
			rows = append(rows, prints[k])
			names = append(names, []string{label})
		}
	}

	fmt.Printf("%d statements, %d distinct sequences:\\n", len(LABELS), len(rows))
	for g := range rows {
		fmt.Println("  " + strings.Join(names[g], " = "))
		fmt.Printf("      %d, %d, %d, %d, %d, %d, ...\\n",
			rows[g][0], rows[g][1], rows[g][2], rows[g][3], rows[g][4], rows[g][5])
	}
	fmt.Println()

	// The first group is Fibonacci, the second is shifted Fibonacci, the third is
	// tribonacci and the fourth is the powers of two. Checked rather than said.
	a, b, c, d := true, true, true, true
	for n := 0; n < LENGTH; n++ {
		if noTwoOnes(n) != fib(n+2) {
			a = false
		}
		if stepsOneTwo(n) != fib(n+1) {
			b = false
		}
		if stepsOneTwoThree(n) != trib(n) {
			c = false
		}
		want := int64(1)
		if n > 0 {
			want = int64(1) << (n - 1)
		}
		if anyComposition(n) != want {
			d = false
		}
	}
	yes := func(ok bool) string {
		if ok {
			return "yes"
		}
		return "no"
	}
	fmt.Printf("  %-34s%s\\n", "no 11 is fib(n+2)", yes(a))
	fmt.Printf("  %-34s%s\\n", "1s and 2s is fib(n+1)", yes(b))
	fmt.Printf("  %-34s%s\\n", "1s, 2s and 3s is tribonacci", yes(c))
	fmt.Printf("  %-34s%s\\n", "any positive numbers is 2^(n-1)", yes(d))
	fmt.Println()
	fmt.Println("two statements with the same fingerprint are the same recurrence with the")
	fmt.Println("same base cases; two that differ by a shift are the same recurrence started")
	fmt.Println("in a different place. That is the whole of pattern recognition, and it can")
	fmt.Println("be done from ten small answers before any code is written.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Ten values identify a sequence; they do not prove one",
          body: "Two recurrences can agree for a while and diverge later, so a matching fingerprint is a strong hint and not a proof. Treat it as the thing that tells you which recurrence to try, then check the recurrence itself against the brute force on a few thousand inputs -- which is the same check the whole module has been running.",
        },
        {
          title: "The brute force is worth writing even when you recognise it instantly",
          body: "Its real job is not identification, it is being the oracle. Every failure in these eight lessons was found by comparing against exhaustive search on small inputs, and none of them would have been found by reading the code.",
        },
      ],
    },
    {
      id: "what-the-module-was-for",
      heading: "The whole procedure, in one place",
      body: [
        "Eight lessons, and they are one procedure.",
        "**Write the brute force.** You cannot diagnose a recursion you have not written, and it doubles as the oracle you will check everything else against.",
        "**Measure the overlap.** Count distinct argument tuples against total calls. One call each is divide and conquer; 191,993 each is a dynamic program waiting to happen.",
        "**Say what one cell means, in a sentence with no `dp` in it.** Check it is a function of what you build it from, check every component rules something out, and multiply the ranges to price it before writing anything.",
        "**Name the last decision to get the choices, and the question to get the combine.** Give the impossible state its own value, one the arithmetic cannot rescue. Confirm something strictly decreases along every transition.",
        "**Add the four lines.** Convert to a loop when the recursion depth or the space demands it, and diff the two afterwards.",
        "**Drop dimensions only when the answer is a number**, and size the window by how far the transition reaches rather than by habit.",
        "**Extract the solution deliberately** \u2014 fix the tie rule, mirror it in the traceback, and replay the result to check it produces what the table promised.",
        "One habit runs through all of it and is worth more than any single step: **every claim in these eight lessons was checked against exhaustive search on inputs small enough to enumerate.** That is what caught the key that was missing an argument, the base case that made the impossible free, the ring buffer one slot too small, the traceback that drifted from its fill, and the clipped count in the section above. Each of those produced a confident, plausible, wrong number, and each was found in under a second by a loop over a few thousand tiny inputs.",
        "What comes next is the catalogue \u2014 knapsack and its variants, the string-pair family, longest increasing subsequence, grids, intervals, trees, bitmasks. That module is a list of shapes. This one is what makes a list of shapes readable instead of memorised.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Climbing stairs, tiling a 2-by-n board, and counting binary strings with no two adjacent ones. How are these related?",
      answer:
        "They are one recurrence, f(n) = f(n-1) + f(n-2), with different base cases. Stairs and tilings are both fib(n+1); the binary strings are fib(n+2), and so are subsets of 1..n with no two consecutive members. The shift is entirely the base cases \u2014 there is one way to tile an empty board and there are two binary strings of length one. The reason this is worth noticing is not trivia: once you know which recurrence you have, you inherit the state, the space optimisation and the reconstruction technique that go with it, so recognising the costume saves the whole derivation.",
    },
    {
      question: "You recognise a new problem as house robber. What do you do next?",
      answer:
        "Re-derive the state from the statement rather than reusing the one I remember. Adding five words can change it: \"at most k houses\" turns a one-dimensional state into a two-dimensional one, and the version that solves the unconstrained problem and then clips to the k most valuable houses is right on most hand-written examples and on 1,787 of 2,000 random ones. Bending the row into a ring, by contrast, costs no extra dimension \u2014 just two runs of the linear version, since the first and last cannot both be taken. Neither of those is predictable from how similar the sentences look. Recognition tells me which shape to start from; lesson 3's checks tell me what the state actually is.",
    },
    {
      question: "How would you work out whether an unfamiliar problem is one you already know?",
      answer:
        "Write the brute force and print the first ten answers. That sequence is a fingerprint, and it groups statements far more reliably than their wording does \u2014 six statements in the lesson collapse into five sequences on it, with the strings-and-subsets pair identical and the two step-set families differing only by a shift. If I recognise the sequence I have the recurrence; if I do not, the encyclopedia of integer sequences takes ten seconds. And either way the brute force has already earned its keep, because it is the oracle I will check the real solution against \u2014 which is how every bug in this module was found.",
    },
  ],
  takeaways: [
    "There are far more dynamic programming statements than dynamic programming recurrences.",
    "Stairs, 2-by-n tilings, binary strings with no 11 and sparse subsets are one recurrence with different base cases.",
    "The shift between two such families is the base cases and nothing else.",
    "A row of houses, a ring of houses and a heaviest independent set on a path are one problem in three vocabularies.",
    "Adding \"at most k\" adds a dimension; the version that clips afterwards is right on 1,787 of 2,000 random rows.",
    "Recognition suggests the shape; the state still has to be re-derived from the statement in front of you.",
    "The first ten answers of a brute force are a fingerprint, and they group statements better than their wording does.",
    "Every claim in this module was checked against exhaustive search on small inputs, and that is what caught every bug in it.",
  ],
  status: "available",
};
