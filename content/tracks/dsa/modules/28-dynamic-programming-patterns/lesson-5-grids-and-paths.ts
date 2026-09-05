import type { Lesson } from "@/content/types";

export const gridsAndPathsLesson: Lesson = {
  id: "dsa-dp-grids-and-paths",
  slug: "grids-and-paths",
  moduleSlug: "dynamic-programming-patterns",
  title: "Grids and Paths",
  summary:
    "Grids, and the three things that decide whether a table is the right tool: whether a closed form already answers the question, whether the movement rule leaves a dependency order to sweep in, and what happens to the state when the problem grows a budget. Including the four-direction recurrence that quietly computes the two-direction answer.",
  estimatedMinutes: 45,
  objectives: [
    "Recognise when a counting question has a closed form and when a constraint destroys it",
    "Tie the existence of a fill order to the movement rule rather than to the recurrence",
    "Say where the boundary with shortest-path algorithms is, and why it is there",
    "Add a budget dimension, and match the reading to what a layer means",
  ],
  sections: [
    {
      id: "the-table-you-do-not-need",
      heading: "The table you do not need",
      body: [
        "Grid problems are the easiest place in this module to write a correct table and the easiest place to write one nobody needed. So the lesson starts with the case where the dynamic program is genuinely unnecessary, because knowing when not to build a table is part of knowing the pattern.",
        "Count the paths from the top-left of a grid to the bottom-right, moving only right or down. The state writes itself \u2014 `paths[i][j]`, the number of ways to reach that cell \u2014 and so does the transition, since the only two cells a path can arrive from are the one above and the one to the left. Add them. The base case is a single 1 at the start.",
        "And on an open grid you should not write any of that, because the answer is `C(m + n - 2, m - 1)`. Every path is a sequence of `m - 1` downs and `n - 1` rights in some order, so counting paths is counting arrangements. That is a closed form: constant work, no table, no loop over cells.",
        "Then block one cell and it is gone. Not slower, not approximate \u2014 gone, with no natural repair. The example below runs both against an enumeration that walks every path, and the shape of the result is the point: the table is right on all 3,000 random grids, and the binomial coefficient is right on 542 of them, which is exactly the 542 that had nothing blocked. Not one grid with a wall in it agreed.",
        "That is worth stating as a habit rather than a fact about grids. A closed form answers the question it was derived for and says nothing when the question changes; a table answers the question its transition describes, and the transition is easy to change. When a problem starts as combinatorics and grows a constraint, the table is what survives.",
      ],
      examples: [
        {
          id: "table-against-closed-form",
          title: "The table, the binomial coefficient, and every path walked",
          lang: "python",
          code: `# Counting paths through a grid, three ways: a table, a closed form, and an
# enumeration that walks every path there is.
#
# The closed form is the interesting one. On an open grid the answer is a
# binomial coefficient and no dynamic program is needed at all -- and the
# moment a single cell is blocked, that shortcut is gone while the table is
# unchanged.
from math import comb


def table(grid):
    """dp[i][j] = paths reaching (i, j) from the top-left moving right or down."""
    rows, cols = len(grid), len(grid[0])
    dp = [[0] * cols for _ in range(rows)]
    for i in range(rows):
        for j in range(cols):
            if grid[i][j] == "#":
                continue
            if i == 0 and j == 0:
                dp[i][j] = 1
                continue
            above = dp[i - 1][j] if i > 0 else 0
            left = dp[i][j - 1] if j > 0 else 0
            dp[i][j] = above + left
    return dp[rows - 1][cols - 1]


def enumerate_paths(grid):
    """Every right/down path, walked. No table anywhere."""
    rows, cols = len(grid), len(grid[0])

    def walk(i, j):
        if i >= rows or j >= cols or grid[i][j] == "#":
            return 0
        if i == rows - 1 and j == cols - 1:
            return 1
        return walk(i + 1, j) + walk(i, j + 1)

    return walk(0, 0)


def closed_form(grid):
    """C(m + n - 2, m - 1). Correct only when nothing is blocked."""
    rows, cols = len(grid), len(grid[0])
    return comb(rows + cols - 2, rows - 1)


def blocked(grid):
    return sum(row.count("#") for row in grid)


CASES = [
    ["...", "...", "..."],
    ["...", ".#.", "..."],
    ["....", "....", "...."],
    ["#..", "...", "..."],
    ["...", "...", "..#"],
    [".#.", ".#.", "..."],
]

print(f"{'grid':<26}{'blocked':>9}{'table':>7}{'every path':>12}{'C(m+n-2,m-1)':>14}")
for grid in CASES:
    shown = "/".join(grid)
    print(f"{shown:<26}{blocked(grid):>9}{table(grid):>7}{enumerate_paths(grid):>12}{closed_form(grid):>14}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
agree_enum = 0
agree_form = 0
open_grids = 0
agree_form_open = 0
for _ in range(TRIALS):
    rows = 2 + rand(4)
    cols = 2 + rand(4)
    grid = ["".join("#" if rand(5) == 0 else "." for _ in range(cols)) for _ in range(rows)]
    # The endpoints are never blocked, so the question always makes sense.
    grid[0] = "." + grid[0][1:]
    grid[rows - 1] = grid[rows - 1][:cols - 1] + "."
    truth = enumerate_paths(grid)
    if table(grid) == truth:
        agree_enum += 1
    if closed_form(grid) == truth:
        agree_form += 1
    if blocked(grid) == 0:
        open_grids += 1
        if closed_form(grid) == truth:
            agree_form_open += 1

print(f"over {TRIALS} random grids, against walking every path:")
print(f"  the table                              {agree_enum:>6}")
print(f"  the binomial coefficient               {agree_form:>6}")
print()
print(f"and over the {open_grids} of those with nothing blocked at all:")
print(f"  the binomial coefficient               {agree_form_open:>6}")
print()
print("so the closed form is not an optimisation of the table, it is a different")
print("answer to a different question. One blocked cell and it is wrong; the table")
print("does not notice the difference.")
`,
          output: `grid                        blocked  table  every path  C(m+n-2,m-1)
.../.../...                       0      6           6             6
.../.#./...                       1      2           2             6
..../..../....                    0     10          10            10
#../.../...                       1      0           0             6
.../.../..#                       1      0           0             6
.#./.#./...                       2      1           1             6

over 3000 random grids, against walking every path:
  the table                                3000
  the binomial coefficient                  542

and over the 542 of those with nothing blocked at all:
  the binomial coefficient                  542

so the closed form is not an optimisation of the table, it is a different
answer to a different question. One blocked cell and it is wrong; the table
does not notice the difference.`,
          explanation:
            "Three answers to the same question: the table, the binomial coefficient, and an enumeration of every path. The last two columns are what makes the point \u2014 the closed form is right on precisely the grids with nothing blocked, and on no others.",
          alternates: [
            {
              lang: "javascript",
              code: `// Counting paths through a grid, three ways: a table, a closed form, and an
// enumeration that walks every path there is.
//
// The closed form is the interesting one. On an open grid the answer is a
// binomial coefficient and no dynamic program is needed at all -- and the
// moment a single cell is blocked, that shortcut is gone while the table is
// unchanged.

/** dp[i][j] = paths reaching (i, j) from the top-left moving right or down. */
function table(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const dp = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (grid[i][j] === "#") continue;
      if (i === 0 && j === 0) {
        dp[i][j] = 1;
        continue;
      }
      const above = i > 0 ? dp[i - 1][j] : 0;
      const left = j > 0 ? dp[i][j - 1] : 0;
      dp[i][j] = above + left;
    }
  }
  return dp[rows - 1][cols - 1];
}

/** Every right/down path, walked. No table anywhere. */
function walk(grid, i, j) {
  const rows = grid.length;
  const cols = grid[0].length;
  if (i >= rows || j >= cols || grid[i][j] === "#") return 0;
  if (i === rows - 1 && j === cols - 1) return 1;
  return walk(grid, i + 1, j) + walk(grid, i, j + 1);
}

const enumeratePaths = (grid) => walk(grid, 0, 0);

function choose(n, k) {
  let out = 1;
  for (let step = 1; step <= k; step++) out = (out * (n - k + step)) / step;
  return out;
}

/** C(m + n - 2, m - 1). Correct only when nothing is blocked. */
const closedForm = (grid) => choose(grid.length + grid[0].length - 2, grid.length - 1);

const blocked = (grid) =>
  grid.reduce((total, row) => total + [...row].filter((c) => c === "#").length, 0);

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
  ["...", "...", "..."],
  ["...", ".#.", "..."],
  ["....", "....", "...."],
  ["#..", "...", "..."],
  ["...", "...", "..#"],
  [".#.", ".#.", "..."],
];

console.log(padEnd("grid", 26) + pad("blocked", 9) + pad("table", 7) + pad("every path", 12) + pad("C(m+n-2,m-1)", 14));
for (const grid of CASES) {
  console.log(
    padEnd(grid.join("/"), 26) + pad(blocked(grid), 9) + pad(table(grid), 7) +
      pad(enumeratePaths(grid), 12) + pad(closedForm(grid), 14)
  );
}
console.log();

const TRIALS = 3000;
let agreeEnum = 0;
let agreeForm = 0;
let openGrids = 0;
let agreeFormOpen = 0;
for (let t = 0; t < TRIALS; t++) {
  const rows = 2 + rand(4);
  const cols = 2 + rand(4);
  const grid = [];
  for (let i = 0; i < rows; i++) {
    let row = "";
    for (let j = 0; j < cols; j++) row += rand(5) === 0 ? "#" : ".";
    grid.push(row);
  }
  // The endpoints are never blocked, so the question always makes sense.
  grid[0] = "." + grid[0].slice(1);
  grid[rows - 1] = grid[rows - 1].slice(0, cols - 1) + ".";
  const truth = enumeratePaths(grid);
  if (table(grid) === truth) agreeEnum++;
  if (closedForm(grid) === truth) agreeForm++;
  if (blocked(grid) === 0) {
    openGrids++;
    if (closedForm(grid) === truth) agreeFormOpen++;
  }
}

console.log(\`over \${TRIALS} random grids, against walking every path:\`);
console.log("  the table                              " + pad(agreeEnum, 6));
console.log("  the binomial coefficient               " + pad(agreeForm, 6));
console.log();
console.log(\`and over the \${openGrids} of those with nothing blocked at all:\`);
console.log("  the binomial coefficient               " + pad(agreeFormOpen, 6));
console.log();
console.log("so the closed form is not an optimisation of the table, it is a different");
console.log("answer to a different question. One blocked cell and it is wrong; the table");
console.log("does not notice the difference.");
`,
            },
            {
              lang: "typescript",
              code: `// Counting paths through a grid, three ways: a table, a closed form, and an
// enumeration that walks every path there is.
//
// The closed form is the interesting one. On an open grid the answer is a
// binomial coefficient and no dynamic program is needed at all -- and the
// moment a single cell is blocked, that shortcut is gone while the table is
// unchanged.

type Grid = string[];

/** dp[i][j] = paths reaching (i, j) from the top-left moving right or down. */
function table(grid: Grid): number {
  const rows = grid.length;
  const cols = grid[0].length;
  const dp: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (grid[i][j] === "#") continue;
      if (i === 0 && j === 0) {
        dp[i][j] = 1;
        continue;
      }
      const above = i > 0 ? dp[i - 1][j] : 0;
      const left = j > 0 ? dp[i][j - 1] : 0;
      dp[i][j] = above + left;
    }
  }
  return dp[rows - 1][cols - 1];
}

/** Every right/down path, walked. No table anywhere. */
function walk(grid: Grid, i: number, j: number): number {
  const rows = grid.length;
  const cols = grid[0].length;
  if (i >= rows || j >= cols || grid[i][j] === "#") return 0;
  if (i === rows - 1 && j === cols - 1) return 1;
  return walk(grid, i + 1, j) + walk(grid, i, j + 1);
}

const enumeratePaths = (grid: Grid): number => walk(grid, 0, 0);

function choose(n: number, k: number): number {
  let out = 1;
  for (let step = 1; step <= k; step++) out = (out * (n - k + step)) / step;
  return out;
}

/** C(m + n - 2, m - 1). Correct only when nothing is blocked. */
const closedForm = (grid: Grid): number => choose(grid.length + grid[0].length - 2, grid.length - 1);

const blocked = (grid: Grid): number =>
  grid.reduce((total, row) => total + [...row].filter((c) => c === "#").length, 0);

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

const CASES: Grid[] = [
  ["...", "...", "..."],
  ["...", ".#.", "..."],
  ["....", "....", "...."],
  ["#..", "...", "..."],
  ["...", "...", "..#"],
  [".#.", ".#.", "..."],
];

console.log(padEnd("grid", 26) + pad("blocked", 9) + pad("table", 7) + pad("every path", 12) + pad("C(m+n-2,m-1)", 14));
for (const grid of CASES) {
  console.log(
    padEnd(grid.join("/"), 26) + pad(blocked(grid), 9) + pad(table(grid), 7) +
      pad(enumeratePaths(grid), 12) + pad(closedForm(grid), 14)
  );
}
console.log();

const TRIALS = 3000;
let agreeEnum = 0;
let agreeForm = 0;
let openGrids = 0;
let agreeFormOpen = 0;
for (let t = 0; t < TRIALS; t++) {
  const rows = 2 + rand(4);
  const cols = 2 + rand(4);
  const grid: Grid = [];
  for (let i = 0; i < rows; i++) {
    let row = "";
    for (let j = 0; j < cols; j++) row += rand(5) === 0 ? "#" : ".";
    grid.push(row);
  }
  // The endpoints are never blocked, so the question always makes sense.
  grid[0] = "." + grid[0].slice(1);
  grid[rows - 1] = grid[rows - 1].slice(0, cols - 1) + ".";
  const truth = enumeratePaths(grid);
  if (table(grid) === truth) agreeEnum++;
  if (closedForm(grid) === truth) agreeForm++;
  if (blocked(grid) === 0) {
    openGrids++;
    if (closedForm(grid) === truth) agreeFormOpen++;
  }
}

console.log(\`over \${TRIALS} random grids, against walking every path:\`);
console.log("  the table                              " + pad(agreeEnum, 6));
console.log("  the binomial coefficient               " + pad(agreeForm, 6));
console.log();
console.log(\`and over the \${openGrids} of those with nothing blocked at all:\`);
console.log("  the binomial coefficient               " + pad(agreeFormOpen, 6));
console.log();
console.log("so the closed form is not an optimisation of the table, it is a different");
console.log("answer to a different question. One blocked cell and it is wrong; the table");
console.log("does not notice the difference.");
`,
            },
            {
              lang: "java",
              code: `// Counting paths through a grid, three ways: a table, a closed form, and an
// enumeration that walks every path there is.
//
// The closed form is the interesting one. On an open grid the answer is a
// binomial coefficient and no dynamic program is needed at all -- and the
// moment a single cell is blocked, that shortcut is gone while the table is
// unchanged.
import java.util.ArrayList;
import java.util.List;

public class Main {
    // dp[i][j] = paths reaching (i, j) from the top-left moving right or down.
    static long table(String[] grid) {
        int rows = grid.length, cols = grid[0].length();
        long[][] dp = new long[rows][cols];
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                if (grid[i].charAt(j) == '#') continue;
                if (i == 0 && j == 0) { dp[i][j] = 1; continue; }
                long above = i > 0 ? dp[i - 1][j] : 0;
                long left = j > 0 ? dp[i][j - 1] : 0;
                dp[i][j] = above + left;
            }
        }
        return dp[rows - 1][cols - 1];
    }

    // Every right/down path, walked. No table anywhere.
    static long enumeratePaths(String[] grid) {
        return walk(grid, 0, 0);
    }

    static long walk(String[] grid, int i, int j) {
        int rows = grid.length, cols = grid[0].length();
        if (i >= rows || j >= cols || grid[i].charAt(j) == '#') return 0;
        if (i == rows - 1 && j == cols - 1) return 1;
        return walk(grid, i + 1, j) + walk(grid, i, j + 1);
    }

    // C(m + n - 2, m - 1). Correct only when nothing is blocked.
    static long closedForm(String[] grid) {
        int rows = grid.length, cols = grid[0].length();
        return choose(rows + cols - 2, rows - 1);
    }

    static long choose(int n, int k) {
        long out = 1;
        for (int step = 1; step <= k; step++) out = out * (n - k + step) / step;
        return out;
    }

    static int blocked(String[] grid) {
        int total = 0;
        for (String row : grid) {
            for (int j = 0; j < row.length(); j++) if (row.charAt(j) == '#') total++;
        }
        return total;
    }

    static String show(String[] grid) {
        return String.join("/", grid);
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
        List<String[]> cases = new ArrayList<>();
        cases.add(new String[] {"...", "...", "..."});
        cases.add(new String[] {"...", ".#.", "..."});
        cases.add(new String[] {"....", "....", "...."});
        cases.add(new String[] {"#..", "...", "..."});
        cases.add(new String[] {"...", "...", "..#"});
        cases.add(new String[] {".#.", ".#.", "..."});

        System.out.println(padEnd("grid", 26) + pad("blocked", 9) + pad("table", 7)
            + pad("every path", 12) + pad("C(m+n-2,m-1)", 14));
        for (String[] grid : cases) {
            System.out.println(padEnd(show(grid), 26) + pad(blocked(grid), 9) + pad(table(grid), 7)
                + pad(enumeratePaths(grid), 12) + pad(closedForm(grid), 14));
        }
        System.out.println();

        int trials = 3000;
        int agreeEnum = 0, agreeForm = 0, openGrids = 0, agreeFormOpen = 0;
        for (int t = 0; t < trials; t++) {
            int rows = 2 + rand(4);
            int cols = 2 + rand(4);
            String[] grid = new String[rows];
            for (int i = 0; i < rows; i++) {
                StringBuilder row = new StringBuilder();
                for (int j = 0; j < cols; j++) row.append(rand(5) == 0 ? '#' : '.');
                grid[i] = row.toString();
            }
            // The endpoints are never blocked, so the question always makes sense.
            grid[0] = "." + grid[0].substring(1);
            grid[rows - 1] = grid[rows - 1].substring(0, cols - 1) + ".";
            long truth = enumeratePaths(grid);
            if (table(grid) == truth) agreeEnum++;
            if (closedForm(grid) == truth) agreeForm++;
            if (blocked(grid) == 0) {
                openGrids++;
                if (closedForm(grid) == truth) agreeFormOpen++;
            }
        }

        System.out.println("over " + trials + " random grids, against walking every path:");
        System.out.println("  the table                              " + pad(agreeEnum, 6));
        System.out.println("  the binomial coefficient               " + pad(agreeForm, 6));
        System.out.println();
        System.out.println("and over the " + openGrids + " of those with nothing blocked at all:");
        System.out.println("  the binomial coefficient               " + pad(agreeFormOpen, 6));
        System.out.println();
        System.out.println("so the closed form is not an optimisation of the table, it is a different");
        System.out.println("answer to a different question. One blocked cell and it is wrong; the table");
        System.out.println("does not notice the difference.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Counting paths through a grid, three ways: a table, a closed form, and an
// enumeration that walks every path there is.
//
// The closed form is the interesting one. On an open grid the answer is a
// binomial coefficient and no dynamic program is needed at all -- and the
// moment a single cell is blocked, that shortcut is gone while the table is
// unchanged.
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

using Grid = std::vector<std::string>;

// dp[i][j] = paths reaching (i, j) from the top-left moving right or down.
std::int64_t table(const Grid &grid) {
    size_t rows = grid.size(), cols = grid[0].size();
    std::vector<std::vector<std::int64_t>> dp(rows, std::vector<std::int64_t>(cols, 0));
    for (size_t i = 0; i < rows; i++) {
        for (size_t j = 0; j < cols; j++) {
            if (grid[i][j] == '#') continue;
            if (i == 0 && j == 0) { dp[i][j] = 1; continue; }
            std::int64_t above = i > 0 ? dp[i - 1][j] : 0;
            std::int64_t left = j > 0 ? dp[i][j - 1] : 0;
            dp[i][j] = above + left;
        }
    }
    return dp[rows - 1][cols - 1];
}

// Every right/down path, walked. No table anywhere.
std::int64_t walk(const Grid &grid, size_t i, size_t j) {
    size_t rows = grid.size(), cols = grid[0].size();
    if (i >= rows || j >= cols || grid[i][j] == '#') return 0;
    if (i == rows - 1 && j == cols - 1) return 1;
    return walk(grid, i + 1, j) + walk(grid, i, j + 1);
}

std::int64_t enumeratePaths(const Grid &grid) { return walk(grid, 0, 0); }

std::int64_t choose(int n, int k) {
    std::int64_t out = 1;
    for (int step = 1; step <= k; step++) out = out * (n - k + step) / step;
    return out;
}

// C(m + n - 2, m - 1). Correct only when nothing is blocked.
std::int64_t closedForm(const Grid &grid) {
    int rows = static_cast<int>(grid.size()), cols = static_cast<int>(grid[0].size());
    return choose(rows + cols - 2, rows - 1);
}

int blocked(const Grid &grid) {
    int total = 0;
    for (const std::string &row : grid) {
        for (char c : row) if (c == '#') total++;
    }
    return total;
}

std::string show(const Grid &grid) {
    std::string out;
    for (size_t i = 0; i < grid.size(); i++) {
        if (i > 0) out += "/";
        out += grid[i];
    }
    return out;
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    const std::vector<Grid> cases = {
        {"...", "...", "..."},
        {"...", ".#.", "..."},
        {"....", "....", "...."},
        {"#..", "...", "..."},
        {"...", "...", "..#"},
        {".#.", ".#.", "..."},
    };

    std::cout << std::left << std::setw(26) << "grid" << std::right << std::setw(9) << "blocked"
              << std::setw(7) << "table" << std::setw(12) << "every path"
              << std::setw(14) << "C(m+n-2,m-1)" << "\\n";
    for (const Grid &grid : cases) {
        std::cout << std::left << std::setw(26) << show(grid) << std::right
                  << std::setw(9) << blocked(grid) << std::setw(7) << table(grid)
                  << std::setw(12) << enumeratePaths(grid) << std::setw(14) << closedForm(grid) << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 3000;
    int agreeEnum = 0, agreeForm = 0, openGrids = 0, agreeFormOpen = 0;
    for (int t = 0; t < TRIALS; t++) {
        int rows = 2 + rnd(4);
        int cols = 2 + rnd(4);
        Grid grid(rows);
        for (int i = 0; i < rows; i++) {
            std::string row;
            for (int j = 0; j < cols; j++) row += rnd(5) == 0 ? '#' : '.';
            grid[i] = row;
        }
        // The endpoints are never blocked, so the question always makes sense.
        grid[0] = "." + grid[0].substr(1);
        grid[rows - 1] = grid[rows - 1].substr(0, cols - 1) + ".";
        std::int64_t truth = enumeratePaths(grid);
        if (table(grid) == truth) agreeEnum++;
        if (closedForm(grid) == truth) agreeForm++;
        if (blocked(grid) == 0) {
            openGrids++;
            if (closedForm(grid) == truth) agreeFormOpen++;
        }
    }

    std::cout << "over " << TRIALS << " random grids, against walking every path:\\n";
    std::cout << "  the table                              " << std::setw(6) << agreeEnum << "\\n";
    std::cout << "  the binomial coefficient               " << std::setw(6) << agreeForm << "\\n\\n";
    std::cout << "and over the " << openGrids << " of those with nothing blocked at all:\\n";
    std::cout << "  the binomial coefficient               " << std::setw(6) << agreeFormOpen << "\\n\\n";
    std::cout << "so the closed form is not an optimisation of the table, it is a different\\n";
    std::cout << "answer to a different question. One blocked cell and it is wrong; the table\\n";
    std::cout << "does not notice the difference.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// Counting paths through a grid, three ways: a table, a closed form, and an
// enumeration that walks every path there is.
//
// The closed form is the interesting one. On an open grid the answer is a
// binomial coefficient and no dynamic program is needed at all -- and the
// moment a single cell is blocked, that shortcut is gone while the table is
// unchanged.

type Grid = Vec<String>;

fn cell(grid: &[String], i: usize, j: usize) -> u8 {
    grid[i].as_bytes()[j]
}

/// dp[i][j] = paths reaching (i, j) from the top-left moving right or down.
fn table(grid: &[String]) -> i64 {
    let (rows, cols) = (grid.len(), grid[0].len());
    let mut dp = vec![vec![0i64; cols]; rows];
    for i in 0..rows {
        for j in 0..cols {
            if cell(grid, i, j) == b'#' {
                continue;
            }
            if i == 0 && j == 0 {
                dp[i][j] = 1;
                continue;
            }
            let above = if i > 0 { dp[i - 1][j] } else { 0 };
            let left = if j > 0 { dp[i][j - 1] } else { 0 };
            dp[i][j] = above + left;
        }
    }
    dp[rows - 1][cols - 1]
}

/// Every right/down path, walked. No table anywhere.
fn walk(grid: &[String], i: usize, j: usize) -> i64 {
    let (rows, cols) = (grid.len(), grid[0].len());
    if i >= rows || j >= cols || cell(grid, i, j) == b'#' {
        return 0;
    }
    if i == rows - 1 && j == cols - 1 {
        return 1;
    }
    walk(grid, i + 1, j) + walk(grid, i, j + 1)
}

fn enumerate_paths(grid: &[String]) -> i64 {
    walk(grid, 0, 0)
}

fn choose(n: i64, k: i64) -> i64 {
    let mut out = 1i64;
    for step in 1..=k {
        out = out * (n - k + step) / step;
    }
    out
}

/// C(m + n - 2, m - 1). Correct only when nothing is blocked.
fn closed_form(grid: &[String]) -> i64 {
    let (rows, cols) = (grid.len() as i64, grid[0].len() as i64);
    choose(rows + cols - 2, rows - 1)
}

fn blocked(grid: &[String]) -> usize {
    grid.iter().map(|row| row.bytes().filter(|&c| c == b'#').count()).sum()
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
    let cases: Vec<Grid> = vec![
        vec!["...".into(), "...".into(), "...".into()],
        vec!["...".into(), ".#.".into(), "...".into()],
        vec!["....".into(), "....".into(), "....".into()],
        vec!["#..".into(), "...".into(), "...".into()],
        vec!["...".into(), "...".into(), "..#".into()],
        vec![".#.".into(), ".#.".into(), "...".into()],
    ];

    println!(
        "{:<26}{:>9}{:>7}{:>12}{:>14}",
        "grid", "blocked", "table", "every path", "C(m+n-2,m-1)"
    );
    for grid in &cases {
        println!(
            "{:<26}{:>9}{:>7}{:>12}{:>14}",
            grid.join("/"),
            blocked(grid),
            table(grid),
            enumerate_paths(grid),
            closed_form(grid)
        );
    }
    println!();

    let trials = 3000;
    let mut rng = Rng { seed: 1 };
    let (mut agree_enum, mut agree_form, mut open_grids, mut agree_form_open) = (0, 0, 0, 0);
    for _ in 0..trials {
        let rows = (2 + rng.next(4)) as usize;
        let cols = (2 + rng.next(4)) as usize;
        let mut grid: Grid = Vec::new();
        for _ in 0..rows {
            let mut row = String::new();
            for _ in 0..cols {
                row.push(if rng.next(5) == 0 { '#' } else { '.' });
            }
            grid.push(row);
        }
        // The endpoints are never blocked, so the question always makes sense.
        grid[0] = format!(".{}", &grid[0][1..]);
        grid[rows - 1] = format!("{}.", &grid[rows - 1][..cols - 1]);
        let truth = enumerate_paths(&grid);
        if table(&grid) == truth {
            agree_enum += 1;
        }
        if closed_form(&grid) == truth {
            agree_form += 1;
        }
        if blocked(&grid) == 0 {
            open_grids += 1;
            if closed_form(&grid) == truth {
                agree_form_open += 1;
            }
        }
    }

    println!("over {} random grids, against walking every path:", trials);
    println!("  the table                              {:>6}", agree_enum);
    println!("  the binomial coefficient               {:>6}", agree_form);
    println!();
    println!("and over the {} of those with nothing blocked at all:", open_grids);
    println!("  the binomial coefficient               {:>6}", agree_form_open);
    println!();
    println!("so the closed form is not an optimisation of the table, it is a different");
    println!("answer to a different question. One blocked cell and it is wrong; the table");
    println!("does not notice the difference.");
}
`,
            },
            {
              lang: "go",
              code: `// Counting paths through a grid, three ways: a table, a closed form, and an
// enumeration that walks every path there is.
//
// The closed form is the interesting one. On an open grid the answer is a
// binomial coefficient and no dynamic program is needed at all -- and the
// moment a single cell is blocked, that shortcut is gone while the table is
// unchanged.
package main

import (
	"fmt"
	"strings"
)

// table gives dp[i][j] = paths reaching (i, j) from the top-left moving right or down.
func table(grid []string) int64 {
	rows, cols := len(grid), len(grid[0])
	dp := make([][]int64, rows)
	for i := range dp {
		dp[i] = make([]int64, cols)
	}
	for i := 0; i < rows; i++ {
		for j := 0; j < cols; j++ {
			if grid[i][j] == '#' {
				continue
			}
			if i == 0 && j == 0 {
				dp[i][j] = 1
				continue
			}
			var above, left int64
			if i > 0 {
				above = dp[i-1][j]
			}
			if j > 0 {
				left = dp[i][j-1]
			}
			dp[i][j] = above + left
		}
	}
	return dp[rows-1][cols-1]
}

// walk enumerates every right/down path. No table anywhere.
func walk(grid []string, i, j int) int64 {
	rows, cols := len(grid), len(grid[0])
	if i >= rows || j >= cols || grid[i][j] == '#' {
		return 0
	}
	if i == rows-1 && j == cols-1 {
		return 1
	}
	return walk(grid, i+1, j) + walk(grid, i, j+1)
}

func enumeratePaths(grid []string) int64 { return walk(grid, 0, 0) }

// closedForm is C(m + n - 2, m - 1). Correct only when nothing is blocked.
func closedForm(grid []string) int64 {
	rows, cols := len(grid), len(grid[0])
	return choose(rows+cols-2, rows-1)
}

func choose(n, k int) int64 {
	var out int64 = 1
	for step := 1; step <= k; step++ {
		out = out * int64(n-k+step) / int64(step)
	}
	return out
}

func blocked(grid []string) int {
	total := 0
	for _, row := range grid {
		total += strings.Count(row, "#")
	}
	return total
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	cases := [][]string{
		{"...", "...", "..."},
		{"...", ".#.", "..."},
		{"....", "....", "...."},
		{"#..", "...", "..."},
		{"...", "...", "..#"},
		{".#.", ".#.", "..."},
	}

	fmt.Printf("%-26s%9s%7s%12s%14s\\n", "grid", "blocked", "table", "every path", "C(m+n-2,m-1)")
	for _, grid := range cases {
		fmt.Printf("%-26s%9d%7d%12d%14d\\n", strings.Join(grid, "/"), blocked(grid), table(grid),
			enumeratePaths(grid), closedForm(grid))
	}
	fmt.Println()

	trials := 3000
	agreeEnum, agreeForm, openGrids, agreeFormOpen := 0, 0, 0, 0
	for t := 0; t < trials; t++ {
		rows := 2 + rand(4)
		cols := 2 + rand(4)
		grid := make([]string, rows)
		for i := 0; i < rows; i++ {
			var row strings.Builder
			for j := 0; j < cols; j++ {
				if rand(5) == 0 {
					row.WriteByte('#')
				} else {
					row.WriteByte('.')
				}
			}
			grid[i] = row.String()
		}
		// The endpoints are never blocked, so the question always makes sense.
		grid[0] = "." + grid[0][1:]
		grid[rows-1] = grid[rows-1][:cols-1] + "."
		truth := enumeratePaths(grid)
		if table(grid) == truth {
			agreeEnum++
		}
		if closedForm(grid) == truth {
			agreeForm++
		}
		if blocked(grid) == 0 {
			openGrids++
			if closedForm(grid) == truth {
				agreeFormOpen++
			}
		}
	}

	fmt.Printf("over %d random grids, against walking every path:\\n", trials)
	fmt.Printf("  the table                              %6d\\n", agreeEnum)
	fmt.Printf("  the binomial coefficient               %6d\\n", agreeForm)
	fmt.Println()
	fmt.Printf("and over the %d of those with nothing blocked at all:\\n", openGrids)
	fmt.Printf("  the binomial coefficient               %6d\\n", agreeFormOpen)
	fmt.Println()
	fmt.Println("so the closed form is not an optimisation of the table, it is a different")
	fmt.Println("answer to a different question. One blocked cell and it is wrong; the table")
	fmt.Println("does not notice the difference.")
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "dp-grid-paths",
        kind: "dp",
        algorithm: "paths",
        title: "Two neighbours added, and one wall spreading a zero",
        lockAlgorithm: true,
      },
      pitfalls: [
        {
          title: "A closed form is not an optimisation",
          body: "`C(m + n - 2, m - 1)` counts paths on an open grid and answers nothing else. Blocking a single cell makes it wrong on every grid tested here, with no correction term available. If a problem may grow constraints, the table is the version that survives them.",
        },
        {
          title: "The blocked cell is a zero, not a skip",
          body: "A wall contributes 0 to its neighbours rather than being left out of the sum, and that zero has to propagate. Writing `continue` before the cell is initialised is fine; writing it after the cell has been given a value from a previous run of the same table is not, which is the usual way a reused buffer produces paths through walls.",
        },
      ],
    },
    {
      id: "the-movement-rule",
      heading: "The movement rule is the dependency order",
      body: [
        "The second thing about grids is the one that actually separates a dynamic program from a shortest-path algorithm, and it has nothing to do with the recurrence.",
        "Take the same grid, put a cost in each open cell, and ask for the cheapest route. Moving right and down only, this is a table: `best[i][j]` is the cost of the cell plus the smaller of its two computed neighbours, and a row-major sweep computes every cell after the cells it depends on. That last clause is the whole requirement, and it is satisfied here because the movement rule is *monotone* \u2014 every step increases `i + j`, so the dependency graph is acyclic and the reading order is obvious.",
        "Now allow all four directions. The recurrence looks almost the same: the cost of the cell plus the smallest of its four neighbours. But a cell now depends on cells that depend on it, and there is no order that computes each one after its dependencies, because no such order exists. The table has not become harder to fill; it has stopped being a table.",
        "What people write at that point is the four-neighbour recurrence in a single row-major sweep, and the reason the bug is hard to see is measured in the example below. On a single pass, the two neighbours below and to the right are still at infinity, so they contribute nothing \u2014 and the pass computes, exactly, the right-and-down table. On all 3,000 grids the two agree. The code says four directions and the answer is two.",
        "The honest fix is to keep sweeping until a pass changes nothing, which is relaxation rather than tabulation. It converges here in at most 8 passes and needs more than two on 2,043 of the 3,000 grids, and it agrees with an enumeration of every non-repeating path all 3,000 times. That is Bellman-Ford wearing grid clothes; with a priority queue instead of repeated sweeps it would be Dijkstra. Which is the real boundary of this module \u2014 when the dependencies are cyclic, the answer is a shortest-path algorithm, not a dynamic program.",
        "And the number that makes this dangerous rather than merely wrong: the right-and-down table matched the four-direction answer on 2,970 of 3,000 grids. Walls have to be arranged just so before going up or left pays, and on a randomly generated test set they usually are not. The failing case in the demo is a corridor that doubles back, where the monotone answer is not merely too large but does not exist at all.",
      ],
      examples: [
        {
          id: "monotone-against-relaxation",
          title: "Right and down, all four directions, and the pass that confuses them",
          lang: "python",
          code: `# The same grid, under two movement rules. Right and down only is a dynamic
# program; all four directions is not, and the difference is not the recurrence
# but whether an order to fill the table in exists at all.
#
# A cell that may be entered from any side depends on cells that depend on it.
# There is no sweep that computes every cell after its dependencies, so the
# table has to be relaxed repeatedly until it stops changing -- and the useful
# thing to notice is that the first pass of that relaxation is exactly the
# right-and-down table, which is why the mistake is invisible.
INF = 10 ** 9


def monotone_table(grid):
    """dp[i][j] = cheapest right/down path from the top-left, entering each cell."""
    rows, cols = len(grid), len(grid[0])
    dp = [[INF] * cols for _ in range(rows)]
    for i in range(rows):
        for j in range(cols):
            if grid[i][j] == "#":
                continue
            best = 0 if i == 0 and j == 0 else INF
            if i > 0:
                best = min(best, dp[i - 1][j])
            if j > 0:
                best = min(best, dp[i][j - 1])
            if best < INF:
                dp[i][j] = best + int(grid[i][j])
    return dp[rows - 1][cols - 1]


def relax(grid, passes):
    """Row-major sweeps that relax from all four neighbours, \`passes\` of them."""
    rows, cols = len(grid), len(grid[0])
    dp = [[INF] * cols for _ in range(rows)]
    for _ in range(passes):
        for i in range(rows):
            for j in range(cols):
                if grid[i][j] == "#":
                    continue
                best = 0 if i == 0 and j == 0 else INF
                for di, dj in ((-1, 0), (0, -1), (1, 0), (0, 1)):
                    a, b = i + di, j + dj
                    if 0 <= a < rows and 0 <= b < cols:
                        best = min(best, dp[a][b])
                if best < INF:
                    dp[i][j] = min(dp[i][j], best + int(grid[i][j]))
    return dp[rows - 1][cols - 1]


def relax_to_fixed_point(grid):
    """Sweep until a whole pass changes nothing. Returns the answer and the count."""
    rows, cols = len(grid), len(grid[0])
    dp = [[INF] * cols for _ in range(rows)]
    used = 0
    while True:
        used += 1
        changed = False
        for i in range(rows):
            for j in range(cols):
                if grid[i][j] == "#":
                    continue
                best = 0 if i == 0 and j == 0 else INF
                for di, dj in ((-1, 0), (0, -1), (1, 0), (0, 1)):
                    a, b = i + di, j + dj
                    if 0 <= a < rows and 0 <= b < cols:
                        best = min(best, dp[a][b])
                if best < INF and best + int(grid[i][j]) < dp[i][j]:
                    dp[i][j] = best + int(grid[i][j])
                    changed = True
        if not changed:
            return dp[rows - 1][cols - 1], used


def walk_monotone(grid):
    """Every right/down path, walked. The definition the table is summarising."""
    rows, cols = len(grid), len(grid[0])
    best = [INF]

    def step(i, j, spent):
        if grid[i][j] == "#":
            return
        spent += int(grid[i][j])
        if spent >= best[0]:
            return
        if i == rows - 1 and j == cols - 1:
            best[0] = spent
            return
        if i + 1 < rows:
            step(i + 1, j, spent)
        if j + 1 < cols:
            step(i, j + 1, spent)

    step(0, 0, 0)
    return best[0]


def walk_any(grid):
    """Every path that does not revisit a cell, in all four directions."""
    rows, cols = len(grid), len(grid[0])
    best = [INF]
    seen = [[False] * cols for _ in range(rows)]

    def step(i, j, spent):
        if grid[i][j] == "#":
            return
        spent += int(grid[i][j])
        if spent >= best[0]:
            return
        if i == rows - 1 and j == cols - 1:
            best[0] = spent
            return
        seen[i][j] = True
        for di, dj in ((-1, 0), (0, -1), (1, 0), (0, 1)):
            a, b = i + di, j + dj
            if 0 <= a < rows and 0 <= b < cols and not seen[a][b]:
                step(a, b, spent)
        seen[i][j] = False

    step(0, 0, 0)
    return best[0]


def show(value):
    return "none" if value >= INF else str(value)


CASES = [
    ["131", "191", "111"],
    ["1111", "###1", "#111", "#1##", "1111"],
    ["11#", "#11", "#11"],
    ["1#1", "1#1", "111"],
]

print(f"{'grid':<26}{'right/down':>12}{'every such path':>17}{'any direction':>15}"
      f"{'relaxed':>9}{'passes':>8}")
for grid in CASES:
    fixed, passes = relax_to_fixed_point(grid)
    print(f"{'/'.join(grid):<26}{show(monotone_table(grid)):>12}{show(walk_monotone(grid)):>17}"
          f"{show(walk_any(grid)):>15}{show(fixed):>9}{passes:>8}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
table_ok = 0
one_pass_is_table = 0
table_matches_any = 0
fixed_ok = 0
most_passes = 0
over_two = 0
for _ in range(TRIALS):
    rows, cols = 5, 5
    grid = ["".join("#" if rand(4) == 0 else str(1 + rand(9)) for _ in range(cols))
            for _ in range(rows)]
    # The two endpoints are never walls, so the question always makes sense.
    grid[0] = str(1 + rand(9)) + grid[0][1:]
    grid[rows - 1] = grid[rows - 1][:cols - 1] + str(1 + rand(9))
    mono = monotone_table(grid)
    truth_mono = walk_monotone(grid)
    truth_any = walk_any(grid)
    fixed, passes = relax_to_fixed_point(grid)
    if mono == truth_mono:
        table_ok += 1
    if relax(grid, 1) == mono:
        one_pass_is_table += 1
    if mono == truth_any:
        table_matches_any += 1
    if fixed == truth_any:
        fixed_ok += 1
    most_passes = max(most_passes, passes)
    if passes > 2:
        over_two += 1

print(f"over {TRIALS} random 5x5 grids with about a quarter of the cells walled:")
print(f"  the table against every right/down path       {table_ok:>6}")
print(f"  one relaxation pass against that same table   {one_pass_is_table:>6}")
print(f"  relaxed to a fixed point, against every path  {fixed_ok:>6}")
print(f"  the table against every path                  {table_matches_any:>6}")
print()
print(f"the fixed point took at most {most_passes} passes, and more than two on {over_two} grids.")
print()
print("so the recurrence is not what breaks. One pass of the four-direction")
print("relaxation is identical to the right-and-down table, on all 3000 grids --")
print("the table quietly answers the smaller question and never says so.")
`,
          output: `grid                        right/down  every such path  any direction  relaxed  passes
131/191/111                          5                5              5        5       2
1111/###1/#111/#1##/1111          none             none             12       12       5
11#/#11/#11                          5                5              5        5       2
1#1/1#1/111                          5                5              5        5       4

over 3000 random 5x5 grids with about a quarter of the cells walled:
  the table against every right/down path         3000
  one relaxation pass against that same table     3000
  relaxed to a fixed point, against every path    3000
  the table against every path                    2970

the fixed point took at most 8 passes, and more than two on 2043 grids.

so the recurrence is not what breaks. One pass of the four-direction
relaxation is identical to the right-and-down table, on all 3000 grids --
the table quietly answers the smaller question and never says so.`,
          explanation:
            "The same grid under both movement rules, with the relaxation counted in passes. The measurement to read first is the second line: one pass of the four-direction relaxation equals the right-and-down table on every grid tested, which is why writing the four-neighbour recurrence and sweeping once produces no visible symptom.",
          alternates: [
            {
              lang: "javascript",
              code: `// The same grid, under two movement rules. Right and down only is a dynamic
// program; all four directions is not, and the difference is not the recurrence
// but whether an order to fill the table in exists at all.
//
// A cell that may be entered from any side depends on cells that depend on it.
// There is no sweep that computes every cell after its dependencies, so the
// table has to be relaxed repeatedly until it stops changing -- and the useful
// thing to notice is that the first pass of that relaxation is exactly the
// right-and-down table, which is why the mistake is invisible.

const INF = 1000000000;

const STEPS = [[-1, 0], [0, -1], [1, 0], [0, 1]];

/** dp[i][j] = cheapest right/down path from the top-left, entering each cell. */
function monotoneTable(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const dp = Array.from({ length: rows }, () => new Array(cols).fill(INF));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (grid[i][j] === "#") continue;
      let best = i === 0 && j === 0 ? 0 : INF;
      if (i > 0) best = Math.min(best, dp[i - 1][j]);
      if (j > 0) best = Math.min(best, dp[i][j - 1]);
      if (best < INF) dp[i][j] = best + Number(grid[i][j]);
    }
  }
  return dp[rows - 1][cols - 1];
}

/** Row-major sweeps that relax from all four neighbours, \`passes\` of them. */
function relax(grid, passes) {
  const rows = grid.length;
  const cols = grid[0].length;
  const dp = Array.from({ length: rows }, () => new Array(cols).fill(INF));
  for (let p = 0; p < passes; p++) {
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (grid[i][j] === "#") continue;
        let best = i === 0 && j === 0 ? 0 : INF;
        for (const [di, dj] of STEPS) {
          const a = i + di;
          const b = j + dj;
          if (a >= 0 && a < rows && b >= 0 && b < cols) best = Math.min(best, dp[a][b]);
        }
        if (best < INF) dp[i][j] = Math.min(dp[i][j], best + Number(grid[i][j]));
      }
    }
  }
  return dp[rows - 1][cols - 1];
}

/** Sweep until a whole pass changes nothing. Returns the answer and the count. */
function relaxToFixedPoint(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const dp = Array.from({ length: rows }, () => new Array(cols).fill(INF));
  let used = 0;
  for (;;) {
    used++;
    let changed = false;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (grid[i][j] === "#") continue;
        let best = i === 0 && j === 0 ? 0 : INF;
        for (const [di, dj] of STEPS) {
          const a = i + di;
          const b = j + dj;
          if (a >= 0 && a < rows && b >= 0 && b < cols) best = Math.min(best, dp[a][b]);
        }
        if (best < INF && best + Number(grid[i][j]) < dp[i][j]) {
          dp[i][j] = best + Number(grid[i][j]);
          changed = true;
        }
      }
    }
    if (!changed) return [dp[rows - 1][cols - 1], used];
  }
}

/** Every right/down path, walked. The definition the table is summarising. */
function walkMonotone(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  let best = INF;
  const step = (i, j, spent) => {
    if (grid[i][j] === "#") return;
    spent += Number(grid[i][j]);
    if (spent >= best) return;
    if (i === rows - 1 && j === cols - 1) {
      best = spent;
      return;
    }
    if (i + 1 < rows) step(i + 1, j, spent);
    if (j + 1 < cols) step(i, j + 1, spent);
  };
  step(0, 0, 0);
  return best;
}

/** Every path that does not revisit a cell, in all four directions. */
function walkAny(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  let best = INF;
  const seen = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const step = (i, j, spent) => {
    if (grid[i][j] === "#") return;
    spent += Number(grid[i][j]);
    if (spent >= best) return;
    if (i === rows - 1 && j === cols - 1) {
      best = spent;
      return;
    }
    seen[i][j] = true;
    for (const [di, dj] of STEPS) {
      const a = i + di;
      const b = j + dj;
      if (a >= 0 && a < rows && b >= 0 && b < cols && !seen[a][b]) step(a, b, spent);
    }
    seen[i][j] = false;
  };
  step(0, 0, 0);
  return best;
}

const show = (value) => (value >= INF ? "none" : String(value));

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
  ["131", "191", "111"],
  ["1111", "###1", "#111", "#1##", "1111"],
  ["11#", "#11", "#11"],
  ["1#1", "1#1", "111"],
];

console.log(
  padEnd("grid", 26) + pad("right/down", 12) + pad("every such path", 17) +
    pad("any direction", 15) + pad("relaxed", 9) + pad("passes", 8)
);
for (const grid of CASES) {
  const [fixed, passes] = relaxToFixedPoint(grid);
  console.log(
    padEnd(grid.join("/"), 26) + pad(show(monotoneTable(grid)), 12) + pad(show(walkMonotone(grid)), 17) +
      pad(show(walkAny(grid)), 15) + pad(show(fixed), 9) + pad(passes, 8)
  );
}
console.log();

const TRIALS = 3000;
let tableOk = 0;
let onePassIsTable = 0;
let tableMatchesAny = 0;
let fixedOk = 0;
let mostPasses = 0;
let overTwo = 0;
for (let t = 0; t < TRIALS; t++) {
  const rows = 5;
  const cols = 5;
  const grid = [];
  for (let i = 0; i < rows; i++) {
    let row = "";
    for (let j = 0; j < cols; j++) row += rand(4) === 0 ? "#" : String(1 + rand(9));
    grid.push(row);
  }
  // The two endpoints are never walls, so the question always makes sense.
  grid[0] = String(1 + rand(9)) + grid[0].slice(1);
  grid[rows - 1] = grid[rows - 1].slice(0, cols - 1) + String(1 + rand(9));
  const mono = monotoneTable(grid);
  const truthMono = walkMonotone(grid);
  const truthAny = walkAny(grid);
  const [fixed, passes] = relaxToFixedPoint(grid);
  if (mono === truthMono) tableOk++;
  if (relax(grid, 1) === mono) onePassIsTable++;
  if (mono === truthAny) tableMatchesAny++;
  if (fixed === truthAny) fixedOk++;
  if (passes > mostPasses) mostPasses = passes;
  if (passes > 2) overTwo++;
}

console.log(\`over \${TRIALS} random 5x5 grids with about a quarter of the cells walled:\`);
console.log("  the table against every right/down path       " + pad(tableOk, 6));
console.log("  one relaxation pass against that same table   " + pad(onePassIsTable, 6));
console.log("  relaxed to a fixed point, against every path  " + pad(fixedOk, 6));
console.log("  the table against every path                  " + pad(tableMatchesAny, 6));
console.log();
console.log(\`the fixed point took at most \${mostPasses} passes, and more than two on \${overTwo} grids.\`);
console.log();
console.log("so the recurrence is not what breaks. One pass of the four-direction");
console.log("relaxation is identical to the right-and-down table, on all 3000 grids --");
console.log("the table quietly answers the smaller question and never says so.");
`,
            },
            {
              lang: "typescript",
              code: `// The same grid, under two movement rules. Right and down only is a dynamic
// program; all four directions is not, and the difference is not the recurrence
// but whether an order to fill the table in exists at all.
//
// A cell that may be entered from any side depends on cells that depend on it.
// There is no sweep that computes every cell after its dependencies, so the
// table has to be relaxed repeatedly until it stops changing -- and the useful
// thing to notice is that the first pass of that relaxation is exactly the
// right-and-down table, which is why the mistake is invisible.

const INF = 1000000000;

type Grid = string[];

const STEPS: [number, number][] = [[-1, 0], [0, -1], [1, 0], [0, 1]];

/** dp[i][j] = cheapest right/down path from the top-left, entering each cell. */
function monotoneTable(grid: Grid): number {
  const rows = grid.length;
  const cols = grid[0].length;
  const dp: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(INF));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (grid[i][j] === "#") continue;
      let best = i === 0 && j === 0 ? 0 : INF;
      if (i > 0) best = Math.min(best, dp[i - 1][j]);
      if (j > 0) best = Math.min(best, dp[i][j - 1]);
      if (best < INF) dp[i][j] = best + Number(grid[i][j]);
    }
  }
  return dp[rows - 1][cols - 1];
}

/** Row-major sweeps that relax from all four neighbours, \`passes\` of them. */
function relax(grid: Grid, passes: number): number {
  const rows = grid.length;
  const cols = grid[0].length;
  const dp: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(INF));
  for (let p = 0; p < passes; p++) {
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (grid[i][j] === "#") continue;
        let best = i === 0 && j === 0 ? 0 : INF;
        for (const [di, dj] of STEPS) {
          const a = i + di;
          const b = j + dj;
          if (a >= 0 && a < rows && b >= 0 && b < cols) best = Math.min(best, dp[a][b]);
        }
        if (best < INF) dp[i][j] = Math.min(dp[i][j], best + Number(grid[i][j]));
      }
    }
  }
  return dp[rows - 1][cols - 1];
}

/** Sweep until a whole pass changes nothing. Returns the answer and the count. */
function relaxToFixedPoint(grid: Grid): [number, number] {
  const rows = grid.length;
  const cols = grid[0].length;
  const dp: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(INF));
  let used = 0;
  for (;;) {
    used++;
    let changed = false;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (grid[i][j] === "#") continue;
        let best = i === 0 && j === 0 ? 0 : INF;
        for (const [di, dj] of STEPS) {
          const a = i + di;
          const b = j + dj;
          if (a >= 0 && a < rows && b >= 0 && b < cols) best = Math.min(best, dp[a][b]);
        }
        if (best < INF && best + Number(grid[i][j]) < dp[i][j]) {
          dp[i][j] = best + Number(grid[i][j]);
          changed = true;
        }
      }
    }
    if (!changed) return [dp[rows - 1][cols - 1], used];
  }
}

/** Every right/down path, walked. The definition the table is summarising. */
function walkMonotone(grid: Grid): number {
  const rows = grid.length;
  const cols = grid[0].length;
  let best = INF;
  const step = (i: number, j: number, spent: number): void => {
    if (grid[i][j] === "#") return;
    spent += Number(grid[i][j]);
    if (spent >= best) return;
    if (i === rows - 1 && j === cols - 1) {
      best = spent;
      return;
    }
    if (i + 1 < rows) step(i + 1, j, spent);
    if (j + 1 < cols) step(i, j + 1, spent);
  };
  step(0, 0, 0);
  return best;
}

/** Every path that does not revisit a cell, in all four directions. */
function walkAny(grid: Grid): number {
  const rows = grid.length;
  const cols = grid[0].length;
  let best = INF;
  const seen: boolean[][] = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const step = (i: number, j: number, spent: number): void => {
    if (grid[i][j] === "#") return;
    spent += Number(grid[i][j]);
    if (spent >= best) return;
    if (i === rows - 1 && j === cols - 1) {
      best = spent;
      return;
    }
    seen[i][j] = true;
    for (const [di, dj] of STEPS) {
      const a = i + di;
      const b = j + dj;
      if (a >= 0 && a < rows && b >= 0 && b < cols && !seen[a][b]) step(a, b, spent);
    }
    seen[i][j] = false;
  };
  step(0, 0, 0);
  return best;
}

const show = (value: number): string => (value >= INF ? "none" : String(value));

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

const CASES: Grid[] = [
  ["131", "191", "111"],
  ["1111", "###1", "#111", "#1##", "1111"],
  ["11#", "#11", "#11"],
  ["1#1", "1#1", "111"],
];

console.log(
  padEnd("grid", 26) + pad("right/down", 12) + pad("every such path", 17) +
    pad("any direction", 15) + pad("relaxed", 9) + pad("passes", 8)
);
for (const grid of CASES) {
  const [fixed, passes] = relaxToFixedPoint(grid);
  console.log(
    padEnd(grid.join("/"), 26) + pad(show(monotoneTable(grid)), 12) + pad(show(walkMonotone(grid)), 17) +
      pad(show(walkAny(grid)), 15) + pad(show(fixed), 9) + pad(passes, 8)
  );
}
console.log();

const TRIALS = 3000;
let tableOk = 0;
let onePassIsTable = 0;
let tableMatchesAny = 0;
let fixedOk = 0;
let mostPasses = 0;
let overTwo = 0;
for (let t = 0; t < TRIALS; t++) {
  const rows = 5;
  const cols = 5;
  const grid: Grid = [];
  for (let i = 0; i < rows; i++) {
    let row = "";
    for (let j = 0; j < cols; j++) row += rand(4) === 0 ? "#" : String(1 + rand(9));
    grid.push(row);
  }
  // The two endpoints are never walls, so the question always makes sense.
  grid[0] = String(1 + rand(9)) + grid[0].slice(1);
  grid[rows - 1] = grid[rows - 1].slice(0, cols - 1) + String(1 + rand(9));
  const mono = monotoneTable(grid);
  const truthMono = walkMonotone(grid);
  const truthAny = walkAny(grid);
  const [fixed, passes] = relaxToFixedPoint(grid);
  if (mono === truthMono) tableOk++;
  if (relax(grid, 1) === mono) onePassIsTable++;
  if (mono === truthAny) tableMatchesAny++;
  if (fixed === truthAny) fixedOk++;
  if (passes > mostPasses) mostPasses = passes;
  if (passes > 2) overTwo++;
}

console.log(\`over \${TRIALS} random 5x5 grids with about a quarter of the cells walled:\`);
console.log("  the table against every right/down path       " + pad(tableOk, 6));
console.log("  one relaxation pass against that same table   " + pad(onePassIsTable, 6));
console.log("  relaxed to a fixed point, against every path  " + pad(fixedOk, 6));
console.log("  the table against every path                  " + pad(tableMatchesAny, 6));
console.log();
console.log(\`the fixed point took at most \${mostPasses} passes, and more than two on \${overTwo} grids.\`);
console.log();
console.log("so the recurrence is not what breaks. One pass of the four-direction");
console.log("relaxation is identical to the right-and-down table, on all 3000 grids --");
console.log("the table quietly answers the smaller question and never says so.");
`,
            },
            {
              lang: "java",
              code: `// The same grid, under two movement rules. Right and down only is a dynamic
// program; all four directions is not, and the difference is not the recurrence
// but whether an order to fill the table in exists at all.
//
// A cell that may be entered from any side depends on cells that depend on it.
// There is no sweep that computes every cell after its dependencies, so the
// table has to be relaxed repeatedly until it stops changing -- and the useful
// thing to notice is that the first pass of that relaxation is exactly the
// right-and-down table, which is why the mistake is invisible.
import java.util.ArrayList;
import java.util.List;

public class Main {
    static final int INF = 1000000000;
    static final int[][] STEPS = {{-1, 0}, {0, -1}, {1, 0}, {0, 1}};

    // dp[i][j] = cheapest right/down path from the top-left, entering each cell.
    static int monotoneTable(String[] grid) {
        int rows = grid.length, cols = grid[0].length();
        int[][] dp = new int[rows][cols];
        for (int[] row : dp) java.util.Arrays.fill(row, INF);
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                if (grid[i].charAt(j) == '#') continue;
                int best = i == 0 && j == 0 ? 0 : INF;
                if (i > 0) best = Math.min(best, dp[i - 1][j]);
                if (j > 0) best = Math.min(best, dp[i][j - 1]);
                if (best < INF) dp[i][j] = best + (grid[i].charAt(j) - '0');
            }
        }
        return dp[rows - 1][cols - 1];
    }

    // Row-major sweeps that relax from all four neighbours, \`passes\` of them.
    static int relax(String[] grid, int passes) {
        int rows = grid.length, cols = grid[0].length();
        int[][] dp = new int[rows][cols];
        for (int[] row : dp) java.util.Arrays.fill(row, INF);
        for (int p = 0; p < passes; p++) {
            for (int i = 0; i < rows; i++) {
                for (int j = 0; j < cols; j++) {
                    if (grid[i].charAt(j) == '#') continue;
                    int best = i == 0 && j == 0 ? 0 : INF;
                    for (int[] step : STEPS) {
                        int a = i + step[0], b = j + step[1];
                        if (a >= 0 && a < rows && b >= 0 && b < cols) best = Math.min(best, dp[a][b]);
                    }
                    if (best < INF) dp[i][j] = Math.min(dp[i][j], best + (grid[i].charAt(j) - '0'));
                }
            }
        }
        return dp[rows - 1][cols - 1];
    }

    // Sweep until a whole pass changes nothing. Returns the answer and the count.
    static int[] relaxToFixedPoint(String[] grid) {
        int rows = grid.length, cols = grid[0].length();
        int[][] dp = new int[rows][cols];
        for (int[] row : dp) java.util.Arrays.fill(row, INF);
        int used = 0;
        while (true) {
            used++;
            boolean changed = false;
            for (int i = 0; i < rows; i++) {
                for (int j = 0; j < cols; j++) {
                    if (grid[i].charAt(j) == '#') continue;
                    int best = i == 0 && j == 0 ? 0 : INF;
                    for (int[] step : STEPS) {
                        int a = i + step[0], b = j + step[1];
                        if (a >= 0 && a < rows && b >= 0 && b < cols) best = Math.min(best, dp[a][b]);
                    }
                    int cost = grid[i].charAt(j) - '0';
                    if (best < INF && best + cost < dp[i][j]) {
                        dp[i][j] = best + cost;
                        changed = true;
                    }
                }
            }
            if (!changed) return new int[] {dp[rows - 1][cols - 1], used};
        }
    }

    static int monotoneBest;

    // Every right/down path, walked. The definition the table is summarising.
    static int walkMonotone(String[] grid) {
        monotoneBest = INF;
        stepMonotone(grid, 0, 0, 0);
        return monotoneBest;
    }

    static void stepMonotone(String[] grid, int i, int j, int spent) {
        int rows = grid.length, cols = grid[0].length();
        if (grid[i].charAt(j) == '#') return;
        spent += grid[i].charAt(j) - '0';
        if (spent >= monotoneBest) return;
        if (i == rows - 1 && j == cols - 1) {
            monotoneBest = spent;
            return;
        }
        if (i + 1 < rows) stepMonotone(grid, i + 1, j, spent);
        if (j + 1 < cols) stepMonotone(grid, i, j + 1, spent);
    }

    static int anyBest;
    static boolean[][] seen;

    // Every path that does not revisit a cell, in all four directions.
    static int walkAny(String[] grid) {
        anyBest = INF;
        seen = new boolean[grid.length][grid[0].length()];
        stepAny(grid, 0, 0, 0);
        return anyBest;
    }

    static void stepAny(String[] grid, int i, int j, int spent) {
        int rows = grid.length, cols = grid[0].length();
        if (grid[i].charAt(j) == '#') return;
        spent += grid[i].charAt(j) - '0';
        if (spent >= anyBest) return;
        if (i == rows - 1 && j == cols - 1) {
            anyBest = spent;
            return;
        }
        seen[i][j] = true;
        for (int[] step : STEPS) {
            int a = i + step[0], b = j + step[1];
            if (a >= 0 && a < rows && b >= 0 && b < cols && !seen[a][b]) stepAny(grid, a, b, spent);
        }
        seen[i][j] = false;
    }

    static String show(int value) {
        return value >= INF ? "none" : String.valueOf(value);
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
        List<String[]> cases = new ArrayList<>();
        cases.add(new String[] {"131", "191", "111"});
        cases.add(new String[] {"1111", "###1", "#111", "#1##", "1111"});
        cases.add(new String[] {"11#", "#11", "#11"});
        cases.add(new String[] {"1#1", "1#1", "111"});

        System.out.println(padEnd("grid", 26) + pad("right/down", 12) + pad("every such path", 17)
            + pad("any direction", 15) + pad("relaxed", 9) + pad("passes", 8));
        for (String[] grid : cases) {
            int[] fixed = relaxToFixedPoint(grid);
            System.out.println(padEnd(String.join("/", grid), 26) + pad(show(monotoneTable(grid)), 12)
                + pad(show(walkMonotone(grid)), 17) + pad(show(walkAny(grid)), 15)
                + pad(show(fixed[0]), 9) + pad(fixed[1], 8));
        }
        System.out.println();

        int trials = 3000;
        int tableOk = 0, onePassIsTable = 0, tableMatchesAny = 0, fixedOk = 0, mostPasses = 0, overTwo = 0;
        for (int t = 0; t < trials; t++) {
            int rows = 5, cols = 5;
            String[] grid = new String[rows];
            for (int i = 0; i < rows; i++) {
                StringBuilder row = new StringBuilder();
                for (int j = 0; j < cols; j++) {
                    row.append(rand(4) == 0 ? "#" : String.valueOf(1 + rand(9)));
                }
                grid[i] = row.toString();
            }
            // The two endpoints are never walls, so the question always makes sense.
            grid[0] = (1 + rand(9)) + grid[0].substring(1);
            grid[rows - 1] = grid[rows - 1].substring(0, cols - 1) + (1 + rand(9));
            int mono = monotoneTable(grid);
            int truthMono = walkMonotone(grid);
            int truthAny = walkAny(grid);
            int[] fixed = relaxToFixedPoint(grid);
            if (mono == truthMono) tableOk++;
            if (relax(grid, 1) == mono) onePassIsTable++;
            if (mono == truthAny) tableMatchesAny++;
            if (fixed[0] == truthAny) fixedOk++;
            if (fixed[1] > mostPasses) mostPasses = fixed[1];
            if (fixed[1] > 2) overTwo++;
        }

        System.out.println("over " + trials + " random 5x5 grids with about a quarter of the cells walled:");
        System.out.println("  the table against every right/down path       " + pad(tableOk, 6));
        System.out.println("  one relaxation pass against that same table   " + pad(onePassIsTable, 6));
        System.out.println("  relaxed to a fixed point, against every path  " + pad(fixedOk, 6));
        System.out.println("  the table against every path                  " + pad(tableMatchesAny, 6));
        System.out.println();
        System.out.println("the fixed point took at most " + mostPasses + " passes, and more than two on "
            + overTwo + " grids.");
        System.out.println();
        System.out.println("so the recurrence is not what breaks. One pass of the four-direction");
        System.out.println("relaxation is identical to the right-and-down table, on all 3000 grids --");
        System.out.println("the table quietly answers the smaller question and never says so.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The same grid, under two movement rules. Right and down only is a dynamic
// program; all four directions is not, and the difference is not the recurrence
// but whether an order to fill the table in exists at all.
//
// A cell that may be entered from any side depends on cells that depend on it.
// There is no sweep that computes every cell after its dependencies, so the
// table has to be relaxed repeatedly until it stops changing -- and the useful
// thing to notice is that the first pass of that relaxation is exactly the
// right-and-down table, which is why the mistake is invisible.
#include <algorithm>
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

using Grid = std::vector<std::string>;

static const int INF = 1000000000;
static const std::array<std::array<int, 2>, 4> STEPS = {{{-1, 0}, {0, -1}, {1, 0}, {0, 1}}};

std::vector<std::vector<int>> filled(int rows, int cols) {
    return std::vector<std::vector<int>>(rows, std::vector<int>(cols, INF));
}

int cost(const Grid &grid, int i, int j) { return grid[i][j] - '0'; }

// The cheapest right/down path from the top-left, entering each cell.
int monotoneTable(const Grid &grid) {
    int rows = static_cast<int>(grid.size()), cols = static_cast<int>(grid[0].size());
    auto dp = filled(rows, cols);
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            if (grid[i][j] == '#') continue;
            int best = (i == 0 && j == 0) ? 0 : INF;
            if (i > 0) best = std::min(best, dp[i - 1][j]);
            if (j > 0) best = std::min(best, dp[i][j - 1]);
            if (best < INF) dp[i][j] = best + cost(grid, i, j);
        }
    }
    return dp[rows - 1][cols - 1];
}

// Row-major sweeps that relax from all four neighbours, \`passes\` of them.
int relax(const Grid &grid, int passes) {
    int rows = static_cast<int>(grid.size()), cols = static_cast<int>(grid[0].size());
    auto dp = filled(rows, cols);
    for (int p = 0; p < passes; p++) {
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                if (grid[i][j] == '#') continue;
                int best = (i == 0 && j == 0) ? 0 : INF;
                for (const auto &step : STEPS) {
                    int a = i + step[0], b = j + step[1];
                    if (a >= 0 && a < rows && b >= 0 && b < cols) best = std::min(best, dp[a][b]);
                }
                if (best < INF) dp[i][j] = std::min(dp[i][j], best + cost(grid, i, j));
            }
        }
    }
    return dp[rows - 1][cols - 1];
}

// Sweep until a whole pass changes nothing. Returns the answer and the count.
std::array<int, 2> relaxToFixedPoint(const Grid &grid) {
    int rows = static_cast<int>(grid.size()), cols = static_cast<int>(grid[0].size());
    auto dp = filled(rows, cols);
    int used = 0;
    for (;;) {
        used++;
        bool changed = false;
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                if (grid[i][j] == '#') continue;
                int best = (i == 0 && j == 0) ? 0 : INF;
                for (const auto &step : STEPS) {
                    int a = i + step[0], b = j + step[1];
                    if (a >= 0 && a < rows && b >= 0 && b < cols) best = std::min(best, dp[a][b]);
                }
                if (best < INF && best + cost(grid, i, j) < dp[i][j]) {
                    dp[i][j] = best + cost(grid, i, j);
                    changed = true;
                }
            }
        }
        if (!changed) return {dp[rows - 1][cols - 1], used};
    }
}

// Every right/down path, walked. The definition the table is summarising.
void stepMonotone(const Grid &grid, int i, int j, int spent, int &best) {
    int rows = static_cast<int>(grid.size()), cols = static_cast<int>(grid[0].size());
    if (grid[i][j] == '#') return;
    spent += cost(grid, i, j);
    if (spent >= best) return;
    if (i == rows - 1 && j == cols - 1) { best = spent; return; }
    if (i + 1 < rows) stepMonotone(grid, i + 1, j, spent, best);
    if (j + 1 < cols) stepMonotone(grid, i, j + 1, spent, best);
}

int walkMonotone(const Grid &grid) {
    int best = INF;
    stepMonotone(grid, 0, 0, 0, best);
    return best;
}

// Every path that does not revisit a cell, in all four directions.
void stepAny(const Grid &grid, int i, int j, int spent, int &best,
             std::vector<std::vector<bool>> &seen) {
    int rows = static_cast<int>(grid.size()), cols = static_cast<int>(grid[0].size());
    if (grid[i][j] == '#') return;
    spent += cost(grid, i, j);
    if (spent >= best) return;
    if (i == rows - 1 && j == cols - 1) { best = spent; return; }
    seen[i][j] = true;
    for (const auto &step : STEPS) {
        int a = i + step[0], b = j + step[1];
        if (a >= 0 && a < rows && b >= 0 && b < cols && !seen[a][b]) {
            stepAny(grid, a, b, spent, best, seen);
        }
    }
    seen[i][j] = false;
}

int walkAny(const Grid &grid) {
    int best = INF;
    std::vector<std::vector<bool>> seen(grid.size(), std::vector<bool>(grid[0].size(), false));
    stepAny(grid, 0, 0, 0, best, seen);
    return best;
}

std::string show(int value) {
    return value >= INF ? "none" : std::to_string(value);
}

std::string join(const Grid &grid) {
    std::string out;
    for (size_t i = 0; i < grid.size(); i++) {
        if (i > 0) out += "/";
        out += grid[i];
    }
    return out;
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    const std::vector<Grid> cases = {
        {"131", "191", "111"},
        {"1111", "###1", "#111", "#1##", "1111"},
        {"11#", "#11", "#11"},
        {"1#1", "1#1", "111"},
    };

    std::cout << std::left << std::setw(26) << "grid" << std::right << std::setw(12) << "right/down"
              << std::setw(17) << "every such path" << std::setw(15) << "any direction"
              << std::setw(9) << "relaxed" << std::setw(8) << "passes" << "\\n";
    for (const Grid &grid : cases) {
        auto fixed = relaxToFixedPoint(grid);
        std::cout << std::left << std::setw(26) << join(grid) << std::right
                  << std::setw(12) << show(monotoneTable(grid))
                  << std::setw(17) << show(walkMonotone(grid))
                  << std::setw(15) << show(walkAny(grid))
                  << std::setw(9) << show(fixed[0]) << std::setw(8) << fixed[1] << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 3000;
    int tableOk = 0, onePassIsTable = 0, tableMatchesAny = 0, fixedOk = 0, mostPasses = 0, overTwo = 0;
    for (int t = 0; t < TRIALS; t++) {
        const int rows = 5, cols = 5;
        Grid grid(rows);
        for (int i = 0; i < rows; i++) {
            std::string row;
            for (int j = 0; j < cols; j++) {
                row += rnd(4) == 0 ? '#' : static_cast<char>('0' + 1 + rnd(9));
            }
            grid[i] = row;
        }
        // The two endpoints are never walls, so the question always makes sense.
        grid[0] = static_cast<char>('0' + 1 + rnd(9)) + grid[0].substr(1);
        grid[rows - 1] = grid[rows - 1].substr(0, cols - 1) + static_cast<char>('0' + 1 + rnd(9));
        int mono = monotoneTable(grid);
        int truthMono = walkMonotone(grid);
        int truthAny = walkAny(grid);
        auto fixed = relaxToFixedPoint(grid);
        if (mono == truthMono) tableOk++;
        if (relax(grid, 1) == mono) onePassIsTable++;
        if (mono == truthAny) tableMatchesAny++;
        if (fixed[0] == truthAny) fixedOk++;
        if (fixed[1] > mostPasses) mostPasses = fixed[1];
        if (fixed[1] > 2) overTwo++;
    }

    std::cout << "over " << TRIALS << " random 5x5 grids with about a quarter of the cells walled:\\n";
    std::cout << "  the table against every right/down path       " << std::setw(6) << tableOk << "\\n";
    std::cout << "  one relaxation pass against that same table   " << std::setw(6) << onePassIsTable << "\\n";
    std::cout << "  relaxed to a fixed point, against every path  " << std::setw(6) << fixedOk << "\\n";
    std::cout << "  the table against every path                  " << std::setw(6) << tableMatchesAny << "\\n\\n";
    std::cout << "the fixed point took at most " << mostPasses << " passes, and more than two on "
              << overTwo << " grids.\\n\\n";
    std::cout << "so the recurrence is not what breaks. One pass of the four-direction\\n";
    std::cout << "relaxation is identical to the right-and-down table, on all 3000 grids --\\n";
    std::cout << "the table quietly answers the smaller question and never says so.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// The same grid, under two movement rules. Right and down only is a dynamic
// program; all four directions is not, and the difference is not the recurrence
// but whether an order to fill the table in exists at all.
//
// A cell that may be entered from any side depends on cells that depend on it.
// There is no sweep that computes every cell after its dependencies, so the
// table has to be relaxed repeatedly until it stops changing -- and the useful
// thing to notice is that the first pass of that relaxation is exactly the
// right-and-down table, which is why the mistake is invisible.

const INF: i32 = 1000000000;
const STEPS: [(i32, i32); 4] = [(-1, 0), (0, -1), (1, 0), (0, 1)];

type Grid = Vec<String>;

fn at(grid: &[String], i: usize, j: usize) -> u8 {
    grid[i].as_bytes()[j]
}

fn cost(grid: &[String], i: usize, j: usize) -> i32 {
    (at(grid, i, j) - b'0') as i32
}

fn filled(rows: usize, cols: usize) -> Vec<Vec<i32>> {
    vec![vec![INF; cols]; rows]
}

/// dp[i][j] = cheapest right/down path from the top-left, entering each cell.
fn monotone_table(grid: &[String]) -> i32 {
    let (rows, cols) = (grid.len(), grid[0].len());
    let mut dp = filled(rows, cols);
    for i in 0..rows {
        for j in 0..cols {
            if at(grid, i, j) == b'#' {
                continue;
            }
            let mut best = if i == 0 && j == 0 { 0 } else { INF };
            if i > 0 {
                best = best.min(dp[i - 1][j]);
            }
            if j > 0 {
                best = best.min(dp[i][j - 1]);
            }
            if best < INF {
                dp[i][j] = best + cost(grid, i, j);
            }
        }
    }
    dp[rows - 1][cols - 1]
}

/// Row-major sweeps that relax from all four neighbours, \`passes\` of them.
fn relax(grid: &[String], passes: usize) -> i32 {
    let (rows, cols) = (grid.len(), grid[0].len());
    let mut dp = filled(rows, cols);
    for _ in 0..passes {
        for i in 0..rows {
            for j in 0..cols {
                if at(grid, i, j) == b'#' {
                    continue;
                }
                let mut best = if i == 0 && j == 0 { 0 } else { INF };
                for (di, dj) in STEPS {
                    let (a, b) = (i as i32 + di, j as i32 + dj);
                    if a >= 0 && a < rows as i32 && b >= 0 && b < cols as i32 {
                        best = best.min(dp[a as usize][b as usize]);
                    }
                }
                if best < INF && best + cost(grid, i, j) < dp[i][j] {
                    dp[i][j] = best + cost(grid, i, j);
                }
            }
        }
    }
    dp[rows - 1][cols - 1]
}

/// Sweep until a whole pass changes nothing. Returns the answer and the count.
fn relax_to_fixed_point(grid: &[String]) -> (i32, usize) {
    let (rows, cols) = (grid.len(), grid[0].len());
    let mut dp = filled(rows, cols);
    let mut used = 0;
    loop {
        used += 1;
        let mut changed = false;
        for i in 0..rows {
            for j in 0..cols {
                if at(grid, i, j) == b'#' {
                    continue;
                }
                let mut best = if i == 0 && j == 0 { 0 } else { INF };
                for (di, dj) in STEPS {
                    let (a, b) = (i as i32 + di, j as i32 + dj);
                    if a >= 0 && a < rows as i32 && b >= 0 && b < cols as i32 {
                        best = best.min(dp[a as usize][b as usize]);
                    }
                }
                if best < INF && best + cost(grid, i, j) < dp[i][j] {
                    dp[i][j] = best + cost(grid, i, j);
                    changed = true;
                }
            }
        }
        if !changed {
            return (dp[rows - 1][cols - 1], used);
        }
    }
}

/// Every right/down path, walked. The definition the table is summarising.
fn step_monotone(grid: &[String], i: usize, j: usize, spent: i32, best: &mut i32) {
    let (rows, cols) = (grid.len(), grid[0].len());
    if at(grid, i, j) == b'#' {
        return;
    }
    let spent = spent + cost(grid, i, j);
    if spent >= *best {
        return;
    }
    if i == rows - 1 && j == cols - 1 {
        *best = spent;
        return;
    }
    if i + 1 < rows {
        step_monotone(grid, i + 1, j, spent, best);
    }
    if j + 1 < cols {
        step_monotone(grid, i, j + 1, spent, best);
    }
}

fn walk_monotone(grid: &[String]) -> i32 {
    let mut best = INF;
    step_monotone(grid, 0, 0, 0, &mut best);
    best
}

/// Every path that does not revisit a cell, in all four directions.
fn step_any(grid: &[String], i: usize, j: usize, spent: i32, best: &mut i32, seen: &mut Vec<Vec<bool>>) {
    let (rows, cols) = (grid.len(), grid[0].len());
    if at(grid, i, j) == b'#' {
        return;
    }
    let spent = spent + cost(grid, i, j);
    if spent >= *best {
        return;
    }
    if i == rows - 1 && j == cols - 1 {
        *best = spent;
        return;
    }
    seen[i][j] = true;
    for (di, dj) in STEPS {
        let (a, b) = (i as i32 + di, j as i32 + dj);
        if a >= 0 && a < rows as i32 && b >= 0 && b < cols as i32 && !seen[a as usize][b as usize] {
            step_any(grid, a as usize, b as usize, spent, best, seen);
        }
    }
    seen[i][j] = false;
}

fn walk_any(grid: &[String]) -> i32 {
    let mut best = INF;
    let mut seen = vec![vec![false; grid[0].len()]; grid.len()];
    step_any(grid, 0, 0, 0, &mut best, &mut seen);
    best
}

fn show(value: i32) -> String {
    if value >= INF {
        "none".to_string()
    } else {
        value.to_string()
    }
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
    let cases: Vec<Grid> = vec![
        vec!["131".into(), "191".into(), "111".into()],
        vec!["1111".into(), "###1".into(), "#111".into(), "#1##".into(), "1111".into()],
        vec!["11#".into(), "#11".into(), "#11".into()],
        vec!["1#1".into(), "1#1".into(), "111".into()],
    ];

    println!(
        "{:<26}{:>12}{:>17}{:>15}{:>9}{:>8}",
        "grid", "right/down", "every such path", "any direction", "relaxed", "passes"
    );
    for grid in &cases {
        let (fixed, passes) = relax_to_fixed_point(grid);
        println!(
            "{:<26}{:>12}{:>17}{:>15}{:>9}{:>8}",
            grid.join("/"),
            show(monotone_table(grid)),
            show(walk_monotone(grid)),
            show(walk_any(grid)),
            show(fixed),
            passes
        );
    }
    println!();

    let trials = 3000;
    let mut rng = Rng { seed: 1 };
    let (mut table_ok, mut one_pass_is_table, mut table_matches_any, mut fixed_ok) = (0, 0, 0, 0);
    let (mut most_passes, mut over_two) = (0usize, 0);
    for _ in 0..trials {
        let (rows, cols) = (5usize, 5usize);
        let mut grid: Grid = Vec::new();
        for _ in 0..rows {
            let mut row = String::new();
            for _ in 0..cols {
                if rng.next(4) == 0 {
                    row.push('#');
                } else {
                    row.push_str(&(1 + rng.next(9)).to_string());
                }
            }
            grid.push(row);
        }
        // The two endpoints are never walls, so the question always makes sense.
        grid[0] = format!("{}{}", 1 + rng.next(9), &grid[0][1..]);
        grid[rows - 1] = format!("{}{}", &grid[rows - 1][..cols - 1], 1 + rng.next(9));
        let mono = monotone_table(&grid);
        let truth_mono = walk_monotone(&grid);
        let truth_any = walk_any(&grid);
        let (fixed, passes) = relax_to_fixed_point(&grid);
        if mono == truth_mono {
            table_ok += 1;
        }
        if relax(&grid, 1) == mono {
            one_pass_is_table += 1;
        }
        if mono == truth_any {
            table_matches_any += 1;
        }
        if fixed == truth_any {
            fixed_ok += 1;
        }
        if passes > most_passes {
            most_passes = passes;
        }
        if passes > 2 {
            over_two += 1;
        }
    }

    println!("over {} random 5x5 grids with about a quarter of the cells walled:", trials);
    println!("  the table against every right/down path       {:>6}", table_ok);
    println!("  one relaxation pass against that same table   {:>6}", one_pass_is_table);
    println!("  relaxed to a fixed point, against every path  {:>6}", fixed_ok);
    println!("  the table against every path                  {:>6}", table_matches_any);
    println!();
    println!("the fixed point took at most {} passes, and more than two on {} grids.", most_passes, over_two);
    println!();
    println!("so the recurrence is not what breaks. One pass of the four-direction");
    println!("relaxation is identical to the right-and-down table, on all 3000 grids --");
    println!("the table quietly answers the smaller question and never says so.");
}
`,
            },
            {
              lang: "go",
              code: `// The same grid, under two movement rules. Right and down only is a dynamic
// program; all four directions is not, and the difference is not the recurrence
// but whether an order to fill the table in exists at all.
//
// A cell that may be entered from any side depends on cells that depend on it.
// There is no sweep that computes every cell after its dependencies, so the
// table has to be relaxed repeatedly until it stops changing -- and the useful
// thing to notice is that the first pass of that relaxation is exactly the
// right-and-down table, which is why the mistake is invisible.
package main

import (
	"fmt"
	"strconv"
	"strings"
)

const inf = 1000000000

var steps = [4][2]int{{-1, 0}, {0, -1}, {1, 0}, {0, 1}}

func filled(rows, cols int) [][]int {
	dp := make([][]int, rows)
	for i := range dp {
		dp[i] = make([]int, cols)
		for j := range dp[i] {
			dp[i][j] = inf
		}
	}
	return dp
}

func cost(grid []string, i, j int) int { return int(grid[i][j] - '0') }

// monotoneTable gives the cheapest right/down path from the top-left.
func monotoneTable(grid []string) int {
	rows, cols := len(grid), len(grid[0])
	dp := filled(rows, cols)
	for i := 0; i < rows; i++ {
		for j := 0; j < cols; j++ {
			if grid[i][j] == '#' {
				continue
			}
			best := inf
			if i == 0 && j == 0 {
				best = 0
			}
			if i > 0 && dp[i-1][j] < best {
				best = dp[i-1][j]
			}
			if j > 0 && dp[i][j-1] < best {
				best = dp[i][j-1]
			}
			if best < inf {
				dp[i][j] = best + cost(grid, i, j)
			}
		}
	}
	return dp[rows-1][cols-1]
}

// relax runs \`passes\` row-major sweeps that relax from all four neighbours.
func relax(grid []string, passes int) int {
	rows, cols := len(grid), len(grid[0])
	dp := filled(rows, cols)
	for p := 0; p < passes; p++ {
		for i := 0; i < rows; i++ {
			for j := 0; j < cols; j++ {
				if grid[i][j] == '#' {
					continue
				}
				best := inf
				if i == 0 && j == 0 {
					best = 0
				}
				for _, step := range steps {
					a, b := i+step[0], j+step[1]
					if a >= 0 && a < rows && b >= 0 && b < cols && dp[a][b] < best {
						best = dp[a][b]
					}
				}
				if best < inf && best+cost(grid, i, j) < dp[i][j] {
					dp[i][j] = best + cost(grid, i, j)
				}
			}
		}
	}
	return dp[rows-1][cols-1]
}

// relaxToFixedPoint sweeps until a whole pass changes nothing.
func relaxToFixedPoint(grid []string) (int, int) {
	rows, cols := len(grid), len(grid[0])
	dp := filled(rows, cols)
	used := 0
	for {
		used++
		changed := false
		for i := 0; i < rows; i++ {
			for j := 0; j < cols; j++ {
				if grid[i][j] == '#' {
					continue
				}
				best := inf
				if i == 0 && j == 0 {
					best = 0
				}
				for _, step := range steps {
					a, b := i+step[0], j+step[1]
					if a >= 0 && a < rows && b >= 0 && b < cols && dp[a][b] < best {
						best = dp[a][b]
					}
				}
				if best < inf && best+cost(grid, i, j) < dp[i][j] {
					dp[i][j] = best + cost(grid, i, j)
					changed = true
				}
			}
		}
		if !changed {
			return dp[rows-1][cols-1], used
		}
	}
}

// walkMonotone enumerates every right/down path, which is what the table summarises.
func walkMonotone(grid []string) int {
	best := inf
	var step func(i, j, spent int)
	rows, cols := len(grid), len(grid[0])
	step = func(i, j, spent int) {
		if grid[i][j] == '#' {
			return
		}
		spent += cost(grid, i, j)
		if spent >= best {
			return
		}
		if i == rows-1 && j == cols-1 {
			best = spent
			return
		}
		if i+1 < rows {
			step(i+1, j, spent)
		}
		if j+1 < cols {
			step(i, j+1, spent)
		}
	}
	step(0, 0, 0)
	return best
}

// walkAny enumerates every path that does not revisit a cell, in all four directions.
func walkAny(grid []string) int {
	rows, cols := len(grid), len(grid[0])
	best := inf
	seen := make([][]bool, rows)
	for i := range seen {
		seen[i] = make([]bool, cols)
	}
	var step func(i, j, spent int)
	step = func(i, j, spent int) {
		if grid[i][j] == '#' {
			return
		}
		spent += cost(grid, i, j)
		if spent >= best {
			return
		}
		if i == rows-1 && j == cols-1 {
			best = spent
			return
		}
		seen[i][j] = true
		for _, s := range steps {
			a, b := i+s[0], j+s[1]
			if a >= 0 && a < rows && b >= 0 && b < cols && !seen[a][b] {
				step(a, b, spent)
			}
		}
		seen[i][j] = false
	}
	step(0, 0, 0)
	return best
}

func show(value int) string {
	if value >= inf {
		return "none"
	}
	return strconv.Itoa(value)
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	cases := [][]string{
		{"131", "191", "111"},
		{"1111", "###1", "#111", "#1##", "1111"},
		{"11#", "#11", "#11"},
		{"1#1", "1#1", "111"},
	}

	fmt.Printf("%-26s%12s%17s%15s%9s%8s\\n", "grid", "right/down", "every such path",
		"any direction", "relaxed", "passes")
	for _, grid := range cases {
		fixed, passes := relaxToFixedPoint(grid)
		fmt.Printf("%-26s%12s%17s%15s%9s%8d\\n", strings.Join(grid, "/"), show(monotoneTable(grid)),
			show(walkMonotone(grid)), show(walkAny(grid)), show(fixed), passes)
	}
	fmt.Println()

	trials := 3000
	tableOk, onePassIsTable, tableMatchesAny, fixedOk, mostPasses, overTwo := 0, 0, 0, 0, 0, 0
	for t := 0; t < trials; t++ {
		rows, cols := 5, 5
		grid := make([]string, rows)
		for i := 0; i < rows; i++ {
			var row strings.Builder
			for j := 0; j < cols; j++ {
				if rand(4) == 0 {
					row.WriteByte('#')
				} else {
					row.WriteString(strconv.Itoa(1 + rand(9)))
				}
			}
			grid[i] = row.String()
		}
		// The two endpoints are never walls, so the question always makes sense.
		grid[0] = strconv.Itoa(1+rand(9)) + grid[0][1:]
		grid[rows-1] = grid[rows-1][:cols-1] + strconv.Itoa(1+rand(9))
		mono := monotoneTable(grid)
		truthMono := walkMonotone(grid)
		truthAny := walkAny(grid)
		fixed, passes := relaxToFixedPoint(grid)
		if mono == truthMono {
			tableOk++
		}
		if relax(grid, 1) == mono {
			onePassIsTable++
		}
		if mono == truthAny {
			tableMatchesAny++
		}
		if fixed == truthAny {
			fixedOk++
		}
		if passes > mostPasses {
			mostPasses = passes
		}
		if passes > 2 {
			overTwo++
		}
	}

	fmt.Printf("over %d random 5x5 grids with about a quarter of the cells walled:\\n", trials)
	fmt.Printf("  the table against every right/down path       %6d\\n", tableOk)
	fmt.Printf("  one relaxation pass against that same table   %6d\\n", onePassIsTable)
	fmt.Printf("  relaxed to a fixed point, against every path  %6d\\n", fixedOk)
	fmt.Printf("  the table against every path                  %6d\\n", tableMatchesAny)
	fmt.Println()
	fmt.Printf("the fixed point took at most %d passes, and more than two on %d grids.\\n",
		mostPasses, overTwo)
	fmt.Println()
	fmt.Println("so the recurrence is not what breaks. One pass of the four-direction")
	fmt.Println("relaxation is identical to the right-and-down table, on all 3000 grids --")
	fmt.Println("the table quietly answers the smaller question and never says so.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Four directions is not a dynamic program",
          body: "A cell reachable from all four sides depends on cells that depend on it. There is no order that computes each cell after its dependencies, so there is no table to fill \u2014 only a relaxation to iterate or a priority queue to drain. If the movement rule is not monotone in some quantity, stop looking for a sweep.",
        },
        {
          title: "One sweep of the four-neighbour recurrence silently answers the smaller question",
          body: "The neighbours below and to the right are still at infinity during a row-major pass, so they contribute nothing and the pass reproduces the right-and-down table exactly \u2014 on all 3,000 grids measured here. The code reads as though it considers four directions and the output is the two-direction answer, with nothing to indicate the difference.",
        },
        {
          title: "Two-direction and four-direction answers usually coincide",
          body: "They matched on 2,970 of 3,000 random grids, because going backwards only pays when the walls are arranged to force a detour. A random test set will very likely not contain one; the case to write by hand is a corridor that doubles back.",
        },
      ],
    },
    {
      id: "one-more-dimension",
      heading: "One more sentence, one more dimension",
      body: [
        "The third move is the one that turns a grid question into a *family* of grid questions, and it is the same move module 27 used to reduce memory, run in the other direction: change the number of indices in the state.",
        "Add one sentence to the path-counting problem \u2014 you may walk through up to `k` walls \u2014 and the state grows a third index. The table becomes `paths[i][j][u]`, and the transition is unchanged except that stepping onto a wall spends one unit of `u`. The cost is a factor of `k + 1` in both time and space, and nothing else about the program is different.",
        "What *is* different is where the answer lives, and it is worth being slow about this. The third index has to mean \"exactly this many walls used\", because that is what the transition can maintain: entering a wall moves you from layer `u - 1` to layer `u`, which only makes sense if a layer counts a fixed number. So the answer to \"at most k\" is the sum of the layers up to `k`, not the `k`-th layer.",
        "Reading the `k`-th layer alone is the mistake, and it is right often enough to be worth the measurement: on 3,000 random grids and budgets it matched the correct answer 2,047 times. It agrees exactly when the extra allowance is unusable, which on small grids is most of the time. The two readings are of the same table \u2014 nothing about the fill is wrong \u2014 so no amount of staring at the recurrence finds this.",
        "You could define the layer as \"at most this many\" instead and read the last one. That works too, and it changes the transition rather than the reading: each layer would then have to inherit from the layer below as well. Either definition is fine as long as the reading matches it, which is module 27 lesson 3's rule about writing down what a cell means before writing what fills it.",
      ],
      examples: [
        {
          id: "a-budget-dimension",
          title: "A wall budget as a third index, and the two ways of reading it",
          lang: "python",
          code: `# The same grid and the same movement, with one sentence added to the problem:
# you may walk through up to k walls. That sentence adds a dimension to the
# state, and it also moves where the answer lives.
#
# The layer index here means *exactly* this many walls used, because that is
# what the transition can maintain. "At most k" is then the sum of the layers
# up to k, not the k-th layer -- and reading the k-th layer alone is a wrong
# answer that agrees with the right one whenever the extra allowance is
# unusable, which is most small grids.


def layers(grid, k):
    """dp[i][j][u] = right/down paths reaching (i, j) having used exactly u walls."""
    rows, cols = len(grid), len(grid[0])
    dp = [[[0] * (k + 1) for _ in range(cols)] for _ in range(rows)]
    for i in range(rows):
        for j in range(cols):
            cost = 1 if grid[i][j] == "#" else 0
            for u in range(k + 1):
                if u < cost:
                    continue
                if i == 0 and j == 0:
                    dp[i][j][u] = 1 if u == cost else 0
                    continue
                above = dp[i - 1][j][u - cost] if i > 0 else 0
                left = dp[i][j - 1][u - cost] if j > 0 else 0
                dp[i][j][u] = above + left
    return dp[rows - 1][cols - 1]


def at_most(grid, k):
    """The answer: every layer up to k, added together."""
    return sum(layers(grid, k))


def last_layer_only(grid, k):
    """The same table, read as if the k-th layer already meant "at most k"."""
    return layers(grid, k)[k]


def walk(grid, k):
    """Every right/down path, counted if it crosses no more than k walls."""
    rows, cols = len(grid), len(grid[0])

    def step(i, j, used):
        used += 1 if grid[i][j] == "#" else 0
        if used > k:
            return 0
        if i == rows - 1 and j == cols - 1:
            return 1
        total = 0
        if i + 1 < rows:
            total += step(i + 1, j, used)
        if j + 1 < cols:
            total += step(i, j + 1, used)
        return total

    return step(0, 0, 0)


CASES = [
    (["...", ".#.", "..."], 0),
    (["...", ".#.", "..."], 1),
    (["...", ".#.", "..."], 2),
    (["##.", ".#.", "..."], 1),
    (["##.", ".#.", "..."], 2),
    ([".#.", "###", ".#."], 2),
]

print(f"{'grid':<18}{'k':>3}{'at most k':>11}{'k-th layer only':>17}{'every path':>12}")
for grid, k in CASES:
    print(f"{'/'.join(grid):<18}{k:>3}{at_most(grid, k):>11}"
          f"{last_layer_only(grid, k):>17}{walk(grid, k):>12}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
summed = 0
last_only = 0
same_answer = 0
for _ in range(TRIALS):
    rows = 2 + rand(4)
    cols = 2 + rand(4)
    k = rand(3)
    grid = ["".join("#" if rand(3) == 0 else "." for _ in range(cols)) for _ in range(rows)]
    truth = walk(grid, k)
    if at_most(grid, k) == truth:
        summed += 1
    if last_layer_only(grid, k) == truth:
        last_only += 1
    if at_most(grid, k) == last_layer_only(grid, k):
        same_answer += 1

print(f"over {TRIALS} random grids and budgets:")
print(f"  the layers up to k, added        {summed:>6}")
print(f"  the k-th layer on its own        {last_only:>6}")
print(f"  the two readings coincide        {same_answer:>6}")
print()
print("the table is the same table either way. What changed is the meaning given")
print("to the third index, and the reading has to match that meaning -- an extra")
print("dimension costs a factor of k + 1 in space and one more decision about")
print("where the answer is.")
`,
          output: `grid                k  at most k  k-th layer only  every path
.../.#./...         0          2                2           2
.../.#./...         1          6                4           6
.../.#./...         2          6                0           6
##./.#./...         1          1                1           1
##./.#./...         2          4                3           4
.#./###/.#.         2          2                2           2

over 3000 random grids and budgets:
  the layers up to k, added          3000
  the k-th layer on its own          2047
  the two readings coincide          2047

the table is the same table either way. What changed is the meaning given
to the third index, and the reading has to match that meaning -- an extra
dimension costs a factor of k + 1 in space and one more decision about
where the answer is.`,
          explanation:
            "A third index for the wall budget, and the two ways of reading it. The layer means exactly u walls used, so at most k is a sum; reading the k-th layer alone is measured against exhaustive enumeration rather than argued about.",
          alternates: [
            {
              lang: "javascript",
              code: `// The same grid and the same movement, with one sentence added to the problem:
// you may walk through up to k walls. That sentence adds a dimension to the
// state, and it also moves where the answer lives.
//
// The layer index here means *exactly* this many walls used, because that is
// what the transition can maintain. "At most k" is then the sum of the layers
// up to k, not the k-th layer -- and reading the k-th layer alone is a wrong
// answer that agrees with the right one whenever the extra allowance is
// unusable, which is most small grids.

/** dp[i][j][u] = right/down paths reaching (i, j) having used exactly u walls. */
function layers(grid, k) {
  const rows = grid.length;
  const cols = grid[0].length;
  const dp = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => new Array(k + 1).fill(0))
  );
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cost = grid[i][j] === "#" ? 1 : 0;
      for (let u = 0; u <= k; u++) {
        if (u < cost) continue;
        if (i === 0 && j === 0) {
          dp[i][j][u] = u === cost ? 1 : 0;
          continue;
        }
        const above = i > 0 ? dp[i - 1][j][u - cost] : 0;
        const left = j > 0 ? dp[i][j - 1][u - cost] : 0;
        dp[i][j][u] = above + left;
      }
    }
  }
  return dp[rows - 1][cols - 1];
}

/** The answer: every layer up to k, added together. */
const atMost = (grid, k) =>
  layers(grid, k).reduce((total, count) => total + count, 0);

/** The same table, read as if the k-th layer already meant "at most k". */
const lastLayerOnly = (grid, k) => layers(grid, k)[k];

/** Every right/down path, counted if it crosses no more than k walls. */
function walk(grid, k) {
  const rows = grid.length;
  const cols = grid[0].length;
  const step = (i, j, used) => {
    used += grid[i][j] === "#" ? 1 : 0;
    if (used > k) return 0;
    if (i === rows - 1 && j === cols - 1) return 1;
    let total = 0;
    if (i + 1 < rows) total += step(i + 1, j, used);
    if (j + 1 < cols) total += step(i, j + 1, used);
    return total;
  };
  return step(0, 0, 0);
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

const CASES = [
  [["...", ".#.", "..."], 0],
  [["...", ".#.", "..."], 1],
  [["...", ".#.", "..."], 2],
  [["##.", ".#.", "..."], 1],
  [["##.", ".#.", "..."], 2],
  [[".#.", "###", ".#."], 2],
];

console.log(padEnd("grid", 18) + pad("k", 3) + pad("at most k", 11) + pad("k-th layer only", 17) + pad("every path", 12));
for (const [grid, k] of CASES) {
  console.log(
    padEnd(grid.join("/"), 18) + pad(k, 3) + pad(atMost(grid, k), 11) +
      pad(lastLayerOnly(grid, k), 17) + pad(walk(grid, k), 12)
  );
}
console.log();

const TRIALS = 3000;
let summed = 0;
let lastOnly = 0;
let sameAnswer = 0;
for (let t = 0; t < TRIALS; t++) {
  const rows = 2 + rand(4);
  const cols = 2 + rand(4);
  const k = rand(3);
  const grid = [];
  for (let i = 0; i < rows; i++) {
    let row = "";
    for (let j = 0; j < cols; j++) row += rand(3) === 0 ? "#" : ".";
    grid.push(row);
  }
  const truth = walk(grid, k);
  if (atMost(grid, k) === truth) summed++;
  if (lastLayerOnly(grid, k) === truth) lastOnly++;
  if (atMost(grid, k) === lastLayerOnly(grid, k)) sameAnswer++;
}

console.log(\`over \${TRIALS} random grids and budgets:\`);
console.log("  the layers up to k, added        " + pad(summed, 6));
console.log("  the k-th layer on its own        " + pad(lastOnly, 6));
console.log("  the two readings coincide        " + pad(sameAnswer, 6));
console.log();
console.log("the table is the same table either way. What changed is the meaning given");
console.log("to the third index, and the reading has to match that meaning -- an extra");
console.log("dimension costs a factor of k + 1 in space and one more decision about");
console.log("where the answer is.");
`,
            },
            {
              lang: "typescript",
              code: `// The same grid and the same movement, with one sentence added to the problem:
// you may walk through up to k walls. That sentence adds a dimension to the
// state, and it also moves where the answer lives.
//
// The layer index here means *exactly* this many walls used, because that is
// what the transition can maintain. "At most k" is then the sum of the layers
// up to k, not the k-th layer -- and reading the k-th layer alone is a wrong
// answer that agrees with the right one whenever the extra allowance is
// unusable, which is most small grids.

type Grid = string[];

/** dp[i][j][u] = right/down paths reaching (i, j) having used exactly u walls. */
function layers(grid: Grid, k: number): number[] {
  const rows = grid.length;
  const cols = grid[0].length;
  const dp: number[][][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => new Array(k + 1).fill(0))
  );
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cost = grid[i][j] === "#" ? 1 : 0;
      for (let u = 0; u <= k; u++) {
        if (u < cost) continue;
        if (i === 0 && j === 0) {
          dp[i][j][u] = u === cost ? 1 : 0;
          continue;
        }
        const above = i > 0 ? dp[i - 1][j][u - cost] : 0;
        const left = j > 0 ? dp[i][j - 1][u - cost] : 0;
        dp[i][j][u] = above + left;
      }
    }
  }
  return dp[rows - 1][cols - 1];
}

/** The answer: every layer up to k, added together. */
const atMost = (grid: Grid, k: number): number =>
  layers(grid, k).reduce((total, count) => total + count, 0);

/** The same table, read as if the k-th layer already meant "at most k". */
const lastLayerOnly = (grid: Grid, k: number): number => layers(grid, k)[k];

/** Every right/down path, counted if it crosses no more than k walls. */
function walk(grid: Grid, k: number): number {
  const rows = grid.length;
  const cols = grid[0].length;
  const step = (i: number, j: number, used: number): number => {
    used += grid[i][j] === "#" ? 1 : 0;
    if (used > k) return 0;
    if (i === rows - 1 && j === cols - 1) return 1;
    let total = 0;
    if (i + 1 < rows) total += step(i + 1, j, used);
    if (j + 1 < cols) total += step(i, j + 1, used);
    return total;
  };
  return step(0, 0, 0);
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

const CASES: [Grid, number][] = [
  [["...", ".#.", "..."], 0],
  [["...", ".#.", "..."], 1],
  [["...", ".#.", "..."], 2],
  [["##.", ".#.", "..."], 1],
  [["##.", ".#.", "..."], 2],
  [[".#.", "###", ".#."], 2],
];

console.log(padEnd("grid", 18) + pad("k", 3) + pad("at most k", 11) + pad("k-th layer only", 17) + pad("every path", 12));
for (const [grid, k] of CASES) {
  console.log(
    padEnd(grid.join("/"), 18) + pad(k, 3) + pad(atMost(grid, k), 11) +
      pad(lastLayerOnly(grid, k), 17) + pad(walk(grid, k), 12)
  );
}
console.log();

const TRIALS = 3000;
let summed = 0;
let lastOnly = 0;
let sameAnswer = 0;
for (let t = 0; t < TRIALS; t++) {
  const rows = 2 + rand(4);
  const cols = 2 + rand(4);
  const k = rand(3);
  const grid: Grid = [];
  for (let i = 0; i < rows; i++) {
    let row = "";
    for (let j = 0; j < cols; j++) row += rand(3) === 0 ? "#" : ".";
    grid.push(row);
  }
  const truth = walk(grid, k);
  if (atMost(grid, k) === truth) summed++;
  if (lastLayerOnly(grid, k) === truth) lastOnly++;
  if (atMost(grid, k) === lastLayerOnly(grid, k)) sameAnswer++;
}

console.log(\`over \${TRIALS} random grids and budgets:\`);
console.log("  the layers up to k, added        " + pad(summed, 6));
console.log("  the k-th layer on its own        " + pad(lastOnly, 6));
console.log("  the two readings coincide        " + pad(sameAnswer, 6));
console.log();
console.log("the table is the same table either way. What changed is the meaning given");
console.log("to the third index, and the reading has to match that meaning -- an extra");
console.log("dimension costs a factor of k + 1 in space and one more decision about");
console.log("where the answer is.");
`,
            },
            {
              lang: "java",
              code: `// The same grid and the same movement, with one sentence added to the problem:
// you may walk through up to k walls. That sentence adds a dimension to the
// state, and it also moves where the answer lives.
//
// The layer index here means *exactly* this many walls used, because that is
// what the transition can maintain. "At most k" is then the sum of the layers
// up to k, not the k-th layer -- and reading the k-th layer alone is a wrong
// answer that agrees with the right one whenever the extra allowance is
// unusable, which is most small grids.
import java.util.ArrayList;
import java.util.List;

public class Main {
    // dp[i][j][u] = right/down paths reaching (i, j) having used exactly u walls.
    static long[] layers(String[] grid, int k) {
        int rows = grid.length, cols = grid[0].length();
        long[][][] dp = new long[rows][cols][k + 1];
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                int cost = grid[i].charAt(j) == '#' ? 1 : 0;
                for (int u = 0; u <= k; u++) {
                    if (u < cost) continue;
                    if (i == 0 && j == 0) {
                        dp[i][j][u] = u == cost ? 1 : 0;
                        continue;
                    }
                    long above = i > 0 ? dp[i - 1][j][u - cost] : 0;
                    long left = j > 0 ? dp[i][j - 1][u - cost] : 0;
                    dp[i][j][u] = above + left;
                }
            }
        }
        return dp[rows - 1][cols - 1];
    }

    // The answer: every layer up to k, added together.
    static long atMost(String[] grid, int k) {
        long total = 0;
        for (long count : layers(grid, k)) total += count;
        return total;
    }

    // The same table, read as if the k-th layer already meant "at most k".
    static long lastLayerOnly(String[] grid, int k) {
        return layers(grid, k)[k];
    }

    // Every right/down path, counted if it crosses no more than k walls.
    static long walk(String[] grid, int k) {
        return step(grid, k, 0, 0, 0);
    }

    static long step(String[] grid, int k, int i, int j, int used) {
        int rows = grid.length, cols = grid[0].length();
        used += grid[i].charAt(j) == '#' ? 1 : 0;
        if (used > k) return 0;
        if (i == rows - 1 && j == cols - 1) return 1;
        long total = 0;
        if (i + 1 < rows) total += step(grid, k, i + 1, j, used);
        if (j + 1 < cols) total += step(grid, k, i, j + 1, used);
        return total;
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
        List<String[]> grids = new ArrayList<>();
        List<Integer> budgets = new ArrayList<>();
        grids.add(new String[] {"...", ".#.", "..."}); budgets.add(0);
        grids.add(new String[] {"...", ".#.", "..."}); budgets.add(1);
        grids.add(new String[] {"...", ".#.", "..."}); budgets.add(2);
        grids.add(new String[] {"##.", ".#.", "..."}); budgets.add(1);
        grids.add(new String[] {"##.", ".#.", "..."}); budgets.add(2);
        grids.add(new String[] {".#.", "###", ".#."}); budgets.add(2);

        System.out.println(padEnd("grid", 18) + pad("k", 3) + pad("at most k", 11)
            + pad("k-th layer only", 17) + pad("every path", 12));
        for (int c = 0; c < grids.size(); c++) {
            String[] grid = grids.get(c);
            int k = budgets.get(c);
            System.out.println(padEnd(String.join("/", grid), 18) + pad(k, 3) + pad(atMost(grid, k), 11)
                + pad(lastLayerOnly(grid, k), 17) + pad(walk(grid, k), 12));
        }
        System.out.println();

        int trials = 3000;
        int summed = 0, lastOnly = 0, sameAnswer = 0;
        for (int t = 0; t < trials; t++) {
            int rows = 2 + rand(4);
            int cols = 2 + rand(4);
            int k = rand(3);
            String[] grid = new String[rows];
            for (int i = 0; i < rows; i++) {
                StringBuilder row = new StringBuilder();
                for (int j = 0; j < cols; j++) row.append(rand(3) == 0 ? '#' : '.');
                grid[i] = row.toString();
            }
            long truth = walk(grid, k);
            if (atMost(grid, k) == truth) summed++;
            if (lastLayerOnly(grid, k) == truth) lastOnly++;
            if (atMost(grid, k) == lastLayerOnly(grid, k)) sameAnswer++;
        }

        System.out.println("over " + trials + " random grids and budgets:");
        System.out.println("  the layers up to k, added        " + pad(summed, 6));
        System.out.println("  the k-th layer on its own        " + pad(lastOnly, 6));
        System.out.println("  the two readings coincide        " + pad(sameAnswer, 6));
        System.out.println();
        System.out.println("the table is the same table either way. What changed is the meaning given");
        System.out.println("to the third index, and the reading has to match that meaning -- an extra");
        System.out.println("dimension costs a factor of k + 1 in space and one more decision about");
        System.out.println("where the answer is.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The same grid and the same movement, with one sentence added to the problem:
// you may walk through up to k walls. That sentence adds a dimension to the
// state, and it also moves where the answer lives.
//
// The layer index here means *exactly* this many walls used, because that is
// what the transition can maintain. "At most k" is then the sum of the layers
// up to k, not the k-th layer -- and reading the k-th layer alone is a wrong
// answer that agrees with the right one whenever the extra allowance is
// unusable, which is most small grids.
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

using Grid = std::vector<std::string>;

// dp[i][j][u] = right/down paths reaching (i, j) having used exactly u walls.
std::vector<std::int64_t> layers(const Grid &grid, int k) {
    int rows = static_cast<int>(grid.size()), cols = static_cast<int>(grid[0].size());
    std::vector<std::vector<std::vector<std::int64_t>>> dp(
        rows, std::vector<std::vector<std::int64_t>>(cols, std::vector<std::int64_t>(k + 1, 0)));
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            int cost = grid[i][j] == '#' ? 1 : 0;
            for (int u = 0; u <= k; u++) {
                if (u < cost) continue;
                if (i == 0 && j == 0) {
                    dp[i][j][u] = u == cost ? 1 : 0;
                    continue;
                }
                std::int64_t above = i > 0 ? dp[i - 1][j][u - cost] : 0;
                std::int64_t left = j > 0 ? dp[i][j - 1][u - cost] : 0;
                dp[i][j][u] = above + left;
            }
        }
    }
    return dp[rows - 1][cols - 1];
}

// The answer: every layer up to k, added together.
std::int64_t atMost(const Grid &grid, int k) {
    std::int64_t total = 0;
    for (std::int64_t count : layers(grid, k)) total += count;
    return total;
}

// The same table, read as if the k-th layer already meant "at most k".
std::int64_t lastLayerOnly(const Grid &grid, int k) {
    return layers(grid, k)[k];
}

// Every right/down path, counted if it crosses no more than k walls.
std::int64_t step(const Grid &grid, int k, int i, int j, int used) {
    int rows = static_cast<int>(grid.size()), cols = static_cast<int>(grid[0].size());
    used += grid[i][j] == '#' ? 1 : 0;
    if (used > k) return 0;
    if (i == rows - 1 && j == cols - 1) return 1;
    std::int64_t total = 0;
    if (i + 1 < rows) total += step(grid, k, i + 1, j, used);
    if (j + 1 < cols) total += step(grid, k, i, j + 1, used);
    return total;
}

std::int64_t walk(const Grid &grid, int k) { return step(grid, k, 0, 0, 0); }

std::string join(const Grid &grid) {
    std::string out;
    for (size_t i = 0; i < grid.size(); i++) {
        if (i > 0) out += "/";
        out += grid[i];
    }
    return out;
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    const std::vector<Grid> grids = {
        {"...", ".#.", "..."},
        {"...", ".#.", "..."},
        {"...", ".#.", "..."},
        {"##.", ".#.", "..."},
        {"##.", ".#.", "..."},
        {".#.", "###", ".#."},
    };
    const std::vector<int> budgets = {0, 1, 2, 1, 2, 2};

    std::cout << std::left << std::setw(18) << "grid" << std::right << std::setw(3) << "k"
              << std::setw(11) << "at most k" << std::setw(17) << "k-th layer only"
              << std::setw(12) << "every path" << "\\n";
    for (size_t c = 0; c < grids.size(); c++) {
        const Grid &grid = grids[c];
        int k = budgets[c];
        std::cout << std::left << std::setw(18) << join(grid) << std::right << std::setw(3) << k
                  << std::setw(11) << atMost(grid, k) << std::setw(17) << lastLayerOnly(grid, k)
                  << std::setw(12) << walk(grid, k) << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 3000;
    int summed = 0, lastOnly = 0, sameAnswer = 0;
    for (int t = 0; t < TRIALS; t++) {
        int rows = 2 + rnd(4);
        int cols = 2 + rnd(4);
        int k = rnd(3);
        Grid grid(rows);
        for (int i = 0; i < rows; i++) {
            std::string row;
            for (int j = 0; j < cols; j++) row += rnd(3) == 0 ? '#' : '.';
            grid[i] = row;
        }
        std::int64_t truth = walk(grid, k);
        if (atMost(grid, k) == truth) summed++;
        if (lastLayerOnly(grid, k) == truth) lastOnly++;
        if (atMost(grid, k) == lastLayerOnly(grid, k)) sameAnswer++;
    }

    std::cout << "over " << TRIALS << " random grids and budgets:\\n";
    std::cout << "  the layers up to k, added        " << std::setw(6) << summed << "\\n";
    std::cout << "  the k-th layer on its own        " << std::setw(6) << lastOnly << "\\n";
    std::cout << "  the two readings coincide        " << std::setw(6) << sameAnswer << "\\n\\n";
    std::cout << "the table is the same table either way. What changed is the meaning given\\n";
    std::cout << "to the third index, and the reading has to match that meaning -- an extra\\n";
    std::cout << "dimension costs a factor of k + 1 in space and one more decision about\\n";
    std::cout << "where the answer is.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// The same grid and the same movement, with one sentence added to the problem:
// you may walk through up to k walls. That sentence adds a dimension to the
// state, and it also moves where the answer lives.
//
// The layer index here means *exactly* this many walls used, because that is
// what the transition can maintain. "At most k" is then the sum of the layers
// up to k, not the k-th layer -- and reading the k-th layer alone is a wrong
// answer that agrees with the right one whenever the extra allowance is
// unusable, which is most small grids.

type Grid = Vec<String>;

fn at(grid: &[String], i: usize, j: usize) -> u8 {
    grid[i].as_bytes()[j]
}

/// dp[i][j][u] = right/down paths reaching (i, j) having used exactly u walls.
fn layers(grid: &[String], k: usize) -> Vec<i64> {
    let (rows, cols) = (grid.len(), grid[0].len());
    let mut dp = vec![vec![vec![0i64; k + 1]; cols]; rows];
    for i in 0..rows {
        for j in 0..cols {
            let cost = if at(grid, i, j) == b'#' { 1 } else { 0 };
            for u in 0..=k {
                if u < cost {
                    continue;
                }
                if i == 0 && j == 0 {
                    dp[i][j][u] = if u == cost { 1 } else { 0 };
                    continue;
                }
                let above = if i > 0 { dp[i - 1][j][u - cost] } else { 0 };
                let left = if j > 0 { dp[i][j - 1][u - cost] } else { 0 };
                dp[i][j][u] = above + left;
            }
        }
    }
    dp[rows - 1][cols - 1].clone()
}

/// The answer: every layer up to k, added together.
fn at_most(grid: &[String], k: usize) -> i64 {
    layers(grid, k).iter().sum()
}

/// The same table, read as if the k-th layer already meant "at most k".
fn last_layer_only(grid: &[String], k: usize) -> i64 {
    layers(grid, k)[k]
}

/// Every right/down path, counted if it crosses no more than k walls.
fn step(grid: &[String], k: usize, i: usize, j: usize, used: usize) -> i64 {
    let (rows, cols) = (grid.len(), grid[0].len());
    let used = used + if at(grid, i, j) == b'#' { 1 } else { 0 };
    if used > k {
        return 0;
    }
    if i == rows - 1 && j == cols - 1 {
        return 1;
    }
    let mut total = 0;
    if i + 1 < rows {
        total += step(grid, k, i + 1, j, used);
    }
    if j + 1 < cols {
        total += step(grid, k, i, j + 1, used);
    }
    total
}

fn walk(grid: &[String], k: usize) -> i64 {
    step(grid, k, 0, 0, 0)
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
    let grids: Vec<Grid> = vec![
        vec!["...".into(), ".#.".into(), "...".into()],
        vec!["...".into(), ".#.".into(), "...".into()],
        vec!["...".into(), ".#.".into(), "...".into()],
        vec!["##.".into(), ".#.".into(), "...".into()],
        vec!["##.".into(), ".#.".into(), "...".into()],
        vec![".#.".into(), "###".into(), ".#.".into()],
    ];
    let budgets = [0usize, 1, 2, 1, 2, 2];

    println!(
        "{:<18}{:>3}{:>11}{:>17}{:>12}",
        "grid", "k", "at most k", "k-th layer only", "every path"
    );
    for (c, grid) in grids.iter().enumerate() {
        let k = budgets[c];
        println!(
            "{:<18}{:>3}{:>11}{:>17}{:>12}",
            grid.join("/"),
            k,
            at_most(grid, k),
            last_layer_only(grid, k),
            walk(grid, k)
        );
    }
    println!();

    let trials = 3000;
    let mut rng = Rng { seed: 1 };
    let (mut summed, mut last_only, mut same_answer) = (0, 0, 0);
    for _ in 0..trials {
        let rows = (2 + rng.next(4)) as usize;
        let cols = (2 + rng.next(4)) as usize;
        let k = rng.next(3) as usize;
        let mut grid: Grid = Vec::new();
        for _ in 0..rows {
            let mut row = String::new();
            for _ in 0..cols {
                row.push(if rng.next(3) == 0 { '#' } else { '.' });
            }
            grid.push(row);
        }
        let truth = walk(&grid, k);
        if at_most(&grid, k) == truth {
            summed += 1;
        }
        if last_layer_only(&grid, k) == truth {
            last_only += 1;
        }
        if at_most(&grid, k) == last_layer_only(&grid, k) {
            same_answer += 1;
        }
    }

    println!("over {} random grids and budgets:", trials);
    println!("  the layers up to k, added        {:>6}", summed);
    println!("  the k-th layer on its own        {:>6}", last_only);
    println!("  the two readings coincide        {:>6}", same_answer);
    println!();
    println!("the table is the same table either way. What changed is the meaning given");
    println!("to the third index, and the reading has to match that meaning -- an extra");
    println!("dimension costs a factor of k + 1 in space and one more decision about");
    println!("where the answer is.");
}
`,
            },
            {
              lang: "go",
              code: `// The same grid and the same movement, with one sentence added to the problem:
// you may walk through up to k walls. That sentence adds a dimension to the
// state, and it also moves where the answer lives.
//
// The layer index here means *exactly* this many walls used, because that is
// what the transition can maintain. "At most k" is then the sum of the layers
// up to k, not the k-th layer -- and reading the k-th layer alone is a wrong
// answer that agrees with the right one whenever the extra allowance is
// unusable, which is most small grids.
package main

import (
	"fmt"
	"strings"
)

// layers gives dp[i][j][u] = right/down paths reaching (i, j) having used exactly u walls.
func layers(grid []string, k int) []int64 {
	rows, cols := len(grid), len(grid[0])
	dp := make([][][]int64, rows)
	for i := range dp {
		dp[i] = make([][]int64, cols)
		for j := range dp[i] {
			dp[i][j] = make([]int64, k+1)
		}
	}
	for i := 0; i < rows; i++ {
		for j := 0; j < cols; j++ {
			cost := 0
			if grid[i][j] == '#' {
				cost = 1
			}
			for u := 0; u <= k; u++ {
				if u < cost {
					continue
				}
				if i == 0 && j == 0 {
					if u == cost {
						dp[i][j][u] = 1
					}
					continue
				}
				var above, left int64
				if i > 0 {
					above = dp[i-1][j][u-cost]
				}
				if j > 0 {
					left = dp[i][j-1][u-cost]
				}
				dp[i][j][u] = above + left
			}
		}
	}
	return dp[rows-1][cols-1]
}

// atMost is the answer: every layer up to k, added together.
func atMost(grid []string, k int) int64 {
	var total int64
	for _, count := range layers(grid, k) {
		total += count
	}
	return total
}

// lastLayerOnly reads the table as if the k-th layer already meant "at most k".
func lastLayerOnly(grid []string, k int) int64 {
	return layers(grid, k)[k]
}

// walk enumerates every right/down path, counting those that cross no more than k walls.
func walk(grid []string, k int) int64 {
	rows, cols := len(grid), len(grid[0])
	var step func(i, j, used int) int64
	step = func(i, j, used int) int64 {
		if grid[i][j] == '#' {
			used++
		}
		if used > k {
			return 0
		}
		if i == rows-1 && j == cols-1 {
			return 1
		}
		var total int64
		if i+1 < rows {
			total += step(i+1, j, used)
		}
		if j+1 < cols {
			total += step(i, j+1, used)
		}
		return total
	}
	return step(0, 0, 0)
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	grids := [][]string{
		{"...", ".#.", "..."},
		{"...", ".#.", "..."},
		{"...", ".#.", "..."},
		{"##.", ".#.", "..."},
		{"##.", ".#.", "..."},
		{".#.", "###", ".#."},
	}
	budgets := []int{0, 1, 2, 1, 2, 2}

	fmt.Printf("%-18s%3s%11s%17s%12s\\n", "grid", "k", "at most k", "k-th layer only", "every path")
	for c, grid := range grids {
		k := budgets[c]
		fmt.Printf("%-18s%3d%11d%17d%12d\\n", strings.Join(grid, "/"), k, atMost(grid, k),
			lastLayerOnly(grid, k), walk(grid, k))
	}
	fmt.Println()

	trials := 3000
	summed, lastOnly, sameAnswer := 0, 0, 0
	for t := 0; t < trials; t++ {
		rows := 2 + rand(4)
		cols := 2 + rand(4)
		k := rand(3)
		grid := make([]string, rows)
		for i := 0; i < rows; i++ {
			var row strings.Builder
			for j := 0; j < cols; j++ {
				if rand(3) == 0 {
					row.WriteByte('#')
				} else {
					row.WriteByte('.')
				}
			}
			grid[i] = row.String()
		}
		truth := walk(grid, k)
		if atMost(grid, k) == truth {
			summed++
		}
		if lastLayerOnly(grid, k) == truth {
			lastOnly++
		}
		if atMost(grid, k) == lastLayerOnly(grid, k) {
			sameAnswer++
		}
	}

	fmt.Printf("over %d random grids and budgets:\\n", trials)
	fmt.Printf("  the layers up to k, added        %6d\\n", summed)
	fmt.Printf("  the k-th layer on its own        %6d\\n", lastOnly)
	fmt.Printf("  the two readings coincide        %6d\\n", sameAnswer)
	fmt.Println()
	fmt.Println("the table is the same table either way. What changed is the meaning given")
	fmt.Println("to the third index, and the reading has to match that meaning -- an extra")
	fmt.Println("dimension costs a factor of k + 1 in space and one more decision about")
	fmt.Println("where the answer is.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "A budget dimension changes where the answer is",
          body: "If the layer index means exactly u units spent, \"at most k\" is the sum of layers 0 through k. Reading the k-th layer alone agreed with the correct answer on 2,047 of 3,000 random cases here, which is the right frequency to survive a review and fail in production.",
        },
        {
          title: "Pick the layer's meaning before writing the transition",
          body: "\"Exactly u\" and \"at most u\" are both workable, and they need different code: the first sums at the end, the second inherits from the layer below during the fill. Mixing one definition's transition with the other's reading is the actual bug, and it is invisible in either half on its own.",
        },
      ],
    },
    {
      id: "the-shape",
      heading: "The shape, and what identifies it",
      body: [
        "So the shape.",
        "**The state is a position, and sometimes a position plus a resource.** Two indices for where you are, and one more for anything the problem lets you spend \u2014 walls broken, moves remaining, keys collected. Each extra index multiplies the table.",
        "**The transition is the movement rule**, and the movement rule decides whether a table is possible at all. Monotone movement gives an acyclic dependency graph and a fill order; movement that can go backwards does not, and needs relaxation or a priority queue.",
        "**Ask whether the table is needed.** Open grids and unconstrained counting often have closed forms, and a closed form is not a table that got faster \u2014 it is a different answer that stops applying the moment a constraint appears.",
        "**And say what a cell means before deciding where to read it.** Grids inherit both readings problems from earlier in this module: the largest-cell case from the substring reading, and now the summed-layer case from a budget dimension.",
        "Everything else transfers unchanged. The row-at-a-time reduction from module 27 lesson 6 applies to all of these, at the usual cost of the traceback; the counting variants start from a 1 rather than a 0, as lesson 4 of that module set out; and the enumeration that scores each program here is the same habit the whole module runs on.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Count the paths across an m by n grid. When would you not use dynamic programming for it?",
      answer:
        "On an open grid, never \u2014 the answer is C(m + n - 2, m - 1), because a path is a sequence of m - 1 downs and n - 1 rights and counting paths is counting arrangements of that multiset. Constant work, no table. The table earns its place the moment a constraint arrives. Block one cell and the closed form has no repair: measured against enumeration on 3,000 random grids it was right on 542 of them, which were exactly the 542 with nothing blocked. The table was right on all 3,000 and did not change at all between the two versions. That is the general trade: a closed form answers one question very fast, and a transition can be edited.",
    },
    {
      question: "Minimum path sum on a grid, but you may move in all four directions. Does the table still work?",
      answer:
        "No, and the reason is the dependency order rather than the recurrence. With right and down only, every step increases i + j, so the dependency graph is acyclic and a row-major sweep computes each cell after the cells it needs. Allow up and left and a cell depends on cells that depend on it; no fill order exists. What that turns into is a relaxation \u2014 sweep repeatedly until nothing changes, which is Bellman-Ford \u2014 or a priority queue, which is Dijkstra. The trap is that writing the four-neighbour recurrence and sweeping once compiles and runs: the neighbours below and to the right are still at infinity, so the pass reproduces the two-direction table exactly. I measured that on 3,000 grids and it matched every time, and the two-direction answer itself matched the true four-direction answer on 2,970 of them, so the bug survives most test sets.",
    },
    {
      question: "Paths across a grid where you may break at most k walls.",
      answer:
        "Add a third index to the state: paths[i][j][u], where u is how many walls have been broken so far. The transition is the same sum of the cell above and the cell to the left, except that stepping onto a wall reads from layer u - 1 instead of u. Time and space both grow by a factor of k + 1. The part worth saying explicitly is where the answer is. The layer has to mean exactly u walls used, because that is what the transition maintains, so \"at most k\" is the sum of layers 0 through k rather than layer k. Reading layer k alone matched the correct answer on 2,047 of 3,000 random grids and budgets \u2014 it agrees whenever the extra allowance is unusable \u2014 so it is the kind of mistake that passes review.",
    },
    {
      question: "What is the general test for whether a grid problem can be solved with a table?",
      answer:
        "Whether the movement rule makes the dependency graph acyclic, and whether there is a sweep order that respects it. Right and down are monotone in i + j, so row-major works. Right, down and diagonal are still monotone. Adding up or left is not, and neither is anything that lets a route revisit a region. When the graph is acyclic you have a dynamic program; when it is not you have a shortest-path problem and the tools are relaxation or a priority queue. The separate question is what the state has to include: a position on its own is enough only when nothing is being spent, and any budget \u2014 walls, moves, fuel, keys \u2014 becomes another index, with the usual consequence that where you read the answer changes too.",
    },
  ],
  takeaways: [
    "Path counting on an open grid is `C(m + n - 2, m - 1)` and needs no table at all.",
    "Block one cell and the closed form was wrong on every grid tested; the table did not change.",
    "Right and down are monotone in `i + j`, which is what gives the table a fill order.",
    "All four directions makes the dependency graph cyclic, so there is no table \u2014 only relaxation or a priority queue.",
    "One row-major pass of the four-neighbour recurrence reproduces the two-direction table exactly, on all 3,000 grids measured.",
    "The two answers coincide on 2,970 of 3,000 random grids, so the mistake rarely shows up in testing.",
    "A budget like \"break up to k walls\" is one more index, costing a factor of `k + 1`.",
    "If the layer means exactly `u` spent, \"at most k\" is a sum of layers; reading the last layer alone was right 2,047 times out of 3,000.",
    "Decide what a cell means before deciding where to read the answer \u2014 grids inherit both of this module's reading traps.",
  ],
  status: "available",
};
