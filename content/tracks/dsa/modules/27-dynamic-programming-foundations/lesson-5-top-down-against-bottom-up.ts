import type { Lesson } from "@/content/types";

export const topDownBottomUpLesson: Lesson = {
  id: "dsa-dp-top-down-bottom-up",
  slug: "top-down-against-bottom-up",
  moduleSlug: "dynamic-programming-foundations",
  title: "Top-Down Against Bottom-Up",
  summary:
    "Not two algorithms but one table filled in two orders, so the question is which order and why. What each buys is measurable; what bottom-up costs is a failure mode top-down does not have, where one word in a for-loop changes which problem you solved.",
  estimatedMinutes: 40,
  objectives: [
    "Read the fill order of both forms and see that they produce the same table",
    "Measure when top-down's reachable set is sparse enough to matter, and when it is not",
    "Predict a top-down solution's recursion depth from the dependency chain",
    "Convert a working memoised recursion into a loop, and choose the direction deliberately",
  ],
  sections: [
    {
      id: "one-table-two-orders",
      heading: "One table, filled in two orders",
      body: [
        "Top-down and bottom-up get discussed as though they were two algorithms with a preference between them. They are one table filled in two orders, and the fastest way to stop arguing about it is to print both orders.",
        "They are held to the same requirement: **a cell must not be computed before the cells it reads.** What differs is who enforces it. Top-down gets it for free, because a recursive call cannot return until its own calls have, so the order is discovered rather than chosen. Bottom-up has to be given an order that happens to satisfy it, which is a real obligation and the subject of the third section.",
        "Below is edit distance both ways, with the step at which each cell was finished printed in place of its value.",
        "The values agree in every cell they share, which is the claim being made. The orders do not resemble each other at all: bottom-up runs 1 to 56 in reading order, while top-down dives at the diagonal, finishes the cells it needed on the way, and comes back for the rest.",
        "The six zeros in the top-down grid are the interesting part. Those are cells the recursion never asked for, because nothing the answer depends on reads them \u2014 and they are the first half of the next section. Bottom-up computed all 56 because a loop has no way to know which ones matter.",
      ],
      examples: [
        {
          id: "two-orders",
          title: "Edit distance, with the fill order printed instead of the values",
          lang: "python",
          code: `# Top-down and bottom-up are not two algorithms. They are one table filled in
# two orders, and this prints both orders so that the claim is checkable rather
# than reassuring.

A = "kitten"
B = "sitting"
ROWS = len(A) + 1
COLS = len(B) + 1


def top_down():
    """Recursion plus a memo. Cells are finished in the order the recursion needs."""
    table = [[-1] * COLS for _ in range(ROWS)]
    order = [[0] * COLS for _ in range(ROWS)]
    step = [0]

    def solve(i, j):
        if table[i][j] >= 0:
            return table[i][j]
        if i == 0:
            answer = j
        elif j == 0:
            answer = i
        elif A[i - 1] == B[j - 1]:
            answer = solve(i - 1, j - 1)
        else:
            a = solve(i - 1, j - 1)
            b = solve(i - 1, j)
            c = solve(i, j - 1)
            answer = 1 + min(a, b, c)
        table[i][j] = answer
        step[0] += 1
        order[i][j] = step[0]
        return answer

    solve(ROWS - 1, COLS - 1)
    return table, order


def bottom_up():
    """The same cells, filled row by row. No recursion, so the order is the loop."""
    table = [[-1] * COLS for _ in range(ROWS)]
    order = [[0] * COLS for _ in range(ROWS)]
    step = 0
    for i in range(ROWS):
        for j in range(COLS):
            if i == 0:
                answer = j
            elif j == 0:
                answer = i
            elif A[i - 1] == B[j - 1]:
                answer = table[i - 1][j - 1]
            else:
                answer = 1 + min(table[i - 1][j - 1], table[i - 1][j], table[i][j - 1])
            table[i][j] = answer
            step += 1
            order[i][j] = step
    return table, order


def quoted(text):
    return "'" + text + "'"


def grid(title, values, width):
    lines = [title]
    lines.append("      " + "".join(f"{c:>{width}}" for c in ("-" + B)))
    for i in range(ROWS):
        label = "-" if i == 0 else A[i - 1]
        lines.append(f"   {label:<3}" + "".join(f"{values[i][j]:>{width}}" for j in range(COLS)))
    return lines


td_table, td_order = top_down()
bu_table, bu_order = bottom_up()

print(f"turning {quoted(A)} into {quoted(B)}, one edit at a time")
print()
for line in grid("the table both of them fill:", bu_table, 4):
    print(line)
print()

# Top-down never visits a cell the answer does not depend on, so compare the
# cells it did fill in.
visited = [(i, j) for i in range(ROWS) for j in range(COLS) if td_order[i][j] > 0]
same = all(td_table[i][j] == bu_table[i][j] for i, j in visited)
print(f"top-down filled {len(visited)} of the {ROWS * COLS} cells, and bottom-up filled all of them")
print(f"on the {len(visited)} they share, every value agrees: {'yes' if same else 'no'}")
print(f"edit distance: {bu_table[ROWS - 1][COLS - 1]}")
print()

left = grid("top-down: the order cells are finished", td_order, 4)
right = grid("bottom-up: the order cells are filled", bu_order, 4)
for a, b in zip(left, right):
    print(f"{a:<40}{b}")
print()

print("a 0 in the left grid is a cell the recursion never asked for.")
print("top-down finishes a cell only after everything it needs, which is why its")
print("numbers climb from the corner the recursion started at; bottom-up guarantees")
print("the same thing by choosing a loop order that reaches dependencies first.")
`,
          output: `turning 'kitten' into 'sitting', one edit at a time

the table both of them fill:
         -   s   i   t   t   i   n   g
   -     0   1   2   3   4   5   6   7
   k     1   1   2   3   4   5   6   7
   i     2   2   1   2   3   4   5   6
   t     3   3   2   1   2   3   4   5
   t     4   4   3   2   1   2   3   4
   e     5   5   4   3   2   2   3   4
   n     6   6   5   4   3   3   2   3

top-down filled 50 of the 56 cells, and bottom-up filled all of them
on the 50 they share, every value agrees: yes
edit distance: 3

top-down: the order cells are finished  bottom-up: the order cells are filled
         -   s   i   t   t   i   n   g           -   s   i   t   t   i   n   g
   -     3   1   2   7  12  20  22  43     -     1   2   3   4   5   6   7   8
   k     4   5   6   8  13  21  23  44     k     9  10  11  12  13  14  15  16
   i    27  28   9  10  14  15  24  45     i    17  18  19  20  21  22  23  24
   t    29  30  31  17  11  16  25  46     t    25  26  27  28  29  30  31  32
   t    33  34  35  32  18  19  26  47     t    33  34  35  36  37  38  39  40
   e    36  37  38  39  40  41  42  48     e    41  42  43  44  45  46  47  48
   n     0   0   0   0   0   0  49  50     n    49  50  51  52  53  54  55  56

a 0 in the left grid is a cell the recursion never asked for.
top-down finishes a cell only after everything it needs, which is why its
numbers climb from the corner the recursion started at; bottom-up guarantees
the same thing by choosing a loop order that reaches dependencies first.`,
          explanation:
            "Both halves compute the same recurrence; the grids show the step at which each cell was finished rather than what it holds. The comparison is restricted to the cells top-down actually filled, because the six it skipped are ones the answer does not depend on -- which is the measurement the next section makes properly.",
          alternates: [
            {
              lang: "javascript",
              code: `// Top-down and bottom-up are not two algorithms. They are one table filled in
// two orders, and this prints both orders so that the claim is checkable rather
// than reassuring.

const A = "kitten";
const B = "sitting";
const ROWS = A.length + 1;
const COLS = B.length + 1;

const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);
const quoted = (text) => \`'\${text}'\`;
const newGrid = (fill) => Array.from({ length: ROWS }, () => new Array(COLS).fill(fill));

/** Recursion plus a memo. Cells are finished in the order the recursion needs. */
function topDown() {
  const table = newGrid(-1);
  const order = newGrid(0);
  let step = 0;

  function solve(i, j) {
    if (table[i][j] >= 0) return table[i][j];
    let answer;
    if (i === 0) {
      answer = j;
    } else if (j === 0) {
      answer = i;
    } else if (A[i - 1] === B[j - 1]) {
      answer = solve(i - 1, j - 1);
    } else {
      const a = solve(i - 1, j - 1);
      const b = solve(i - 1, j);
      const c = solve(i, j - 1);
      answer = 1 + Math.min(a, b, c);
    }
    table[i][j] = answer;
    step++;
    order[i][j] = step;
    return answer;
  }

  solve(ROWS - 1, COLS - 1);
  return [table, order];
}

/** The same cells, filled row by row. No recursion, so the order is the loop. */
function bottomUp() {
  const table = newGrid(-1);
  const order = newGrid(0);
  let step = 0;
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      let answer;
      if (i === 0) {
        answer = j;
      } else if (j === 0) {
        answer = i;
      } else if (A[i - 1] === B[j - 1]) {
        answer = table[i - 1][j - 1];
      } else {
        answer = 1 + Math.min(table[i - 1][j - 1], table[i - 1][j], table[i][j - 1]);
      }
      table[i][j] = answer;
      step++;
      order[i][j] = step;
    }
  }
  return [table, order];
}

function grid(title, values, width) {
  const lines = [title];
  lines.push("      " + ("-" + B).split("").map((c) => pad(c, width)).join(""));
  for (let i = 0; i < ROWS; i++) {
    const label = i === 0 ? "-" : A[i - 1];
    lines.push("   " + padEnd(label, 3) + values[i].map((v) => pad(v, width)).join(""));
  }
  return lines;
}

const [tdTable, tdOrder] = topDown();
const [buTable, buOrder] = bottomUp();

console.log(\`turning \${quoted(A)} into \${quoted(B)}, one edit at a time\`);
console.log();
for (const line of grid("the table both of them fill:", buTable, 4)) console.log(line);
console.log();

// Top-down never visits a cell the answer does not depend on, so compare the
// cells it did fill in.
let visited = 0;
let same = true;
for (let i = 0; i < ROWS; i++) {
  for (let j = 0; j < COLS; j++) {
    if (tdOrder[i][j] > 0) {
      visited++;
      if (tdTable[i][j] !== buTable[i][j]) same = false;
    }
  }
}
console.log(\`top-down filled \${visited} of the \${ROWS * COLS} cells, and bottom-up filled all of them\`);
console.log(\`on the \${visited} they share, every value agrees: \${same ? "yes" : "no"}\`);
console.log(\`edit distance: \${buTable[ROWS - 1][COLS - 1]}\`);
console.log();

const left = grid("top-down: the order cells are finished", tdOrder, 4);
const right = grid("bottom-up: the order cells are filled", buOrder, 4);
for (let i = 0; i < left.length; i++) console.log(padEnd(left[i], 40) + right[i]);
console.log();

console.log("a 0 in the left grid is a cell the recursion never asked for.");
console.log("top-down finishes a cell only after everything it needs, which is why its");
console.log("numbers climb from the corner the recursion started at; bottom-up guarantees");
console.log("the same thing by choosing a loop order that reaches dependencies first.");
`,
            },
            {
              lang: "typescript",
              code: `// Top-down and bottom-up are not two algorithms. They are one table filled in
// two orders, and this prints both orders so that the claim is checkable rather
// than reassuring.

const A = "kitten";
const B = "sitting";
const ROWS = A.length + 1;
const COLS = B.length + 1;

const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const quoted = (text: string): string => \`'\${text}'\`;
const newGrid = (fill: number): number[][] =>
  Array.from({ length: ROWS }, () => new Array<number>(COLS).fill(fill));

/** Recursion plus a memo. Cells are finished in the order the recursion needs. */
function topDown(): [number[][], number[][]] {
  const table = newGrid(-1);
  const order = newGrid(0);
  let step = 0;

  function solve(i: number, j: number): number {
    if (table[i][j] >= 0) return table[i][j];
    let answer: number;
    if (i === 0) {
      answer = j;
    } else if (j === 0) {
      answer = i;
    } else if (A[i - 1] === B[j - 1]) {
      answer = solve(i - 1, j - 1);
    } else {
      const a = solve(i - 1, j - 1);
      const b = solve(i - 1, j);
      const c = solve(i, j - 1);
      answer = 1 + Math.min(a, b, c);
    }
    table[i][j] = answer;
    step++;
    order[i][j] = step;
    return answer;
  }

  solve(ROWS - 1, COLS - 1);
  return [table, order];
}

/** The same cells, filled row by row. No recursion, so the order is the loop. */
function bottomUp(): [number[][], number[][]] {
  const table = newGrid(-1);
  const order = newGrid(0);
  let step = 0;
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      let answer: number;
      if (i === 0) {
        answer = j;
      } else if (j === 0) {
        answer = i;
      } else if (A[i - 1] === B[j - 1]) {
        answer = table[i - 1][j - 1];
      } else {
        answer = 1 + Math.min(table[i - 1][j - 1], table[i - 1][j], table[i][j - 1]);
      }
      table[i][j] = answer;
      step++;
      order[i][j] = step;
    }
  }
  return [table, order];
}

function grid(title: string, values: number[][], width: number): string[] {
  const lines = [title];
  lines.push("      " + ("-" + B).split("").map((c) => pad(c, width)).join(""));
  for (let i = 0; i < ROWS; i++) {
    const label = i === 0 ? "-" : A[i - 1];
    lines.push("   " + padEnd(label, 3) + values[i].map((v) => pad(v, width)).join(""));
  }
  return lines;
}

const [tdTable, tdOrder] = topDown();
const [buTable, buOrder] = bottomUp();

console.log(\`turning \${quoted(A)} into \${quoted(B)}, one edit at a time\`);
console.log();
for (const line of grid("the table both of them fill:", buTable, 4)) console.log(line);
console.log();

// Top-down never visits a cell the answer does not depend on, so compare the
// cells it did fill in.
let visited = 0;
let same = true;
for (let i = 0; i < ROWS; i++) {
  for (let j = 0; j < COLS; j++) {
    if (tdOrder[i][j] > 0) {
      visited++;
      if (tdTable[i][j] !== buTable[i][j]) same = false;
    }
  }
}
console.log(\`top-down filled \${visited} of the \${ROWS * COLS} cells, and bottom-up filled all of them\`);
console.log(\`on the \${visited} they share, every value agrees: \${same ? "yes" : "no"}\`);
console.log(\`edit distance: \${buTable[ROWS - 1][COLS - 1]}\`);
console.log();

const left = grid("top-down: the order cells are finished", tdOrder, 4);
const right = grid("bottom-up: the order cells are filled", buOrder, 4);
for (let i = 0; i < left.length; i++) console.log(padEnd(left[i], 40) + right[i]);
console.log();

console.log("a 0 in the left grid is a cell the recursion never asked for.");
console.log("top-down finishes a cell only after everything it needs, which is why its");
console.log("numbers climb from the corner the recursion started at; bottom-up guarantees");
console.log("the same thing by choosing a loop order that reaches dependencies first.");
`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.List;

// Top-down and bottom-up are not two algorithms. They are one table filled in
// two orders, and this prints both orders so that the claim is checkable rather
// than reassuring.
public class Main {
    static final String A = "kitten";
    static final String B = "sitting";
    static final int ROWS = A.length() + 1;
    static final int COLS = B.length() + 1;

    static int[][] table;
    static int[][] order;
    static int step;

    /** Recursion plus a memo. Cells are finished in the order the recursion needs. */
    static int solve(int i, int j) {
        if (table[i][j] >= 0) return table[i][j];
        int answer;
        if (i == 0) {
            answer = j;
        } else if (j == 0) {
            answer = i;
        } else if (A.charAt(i - 1) == B.charAt(j - 1)) {
            answer = solve(i - 1, j - 1);
        } else {
            int a = solve(i - 1, j - 1);
            int b = solve(i - 1, j);
            int c = solve(i, j - 1);
            answer = 1 + Math.min(a, Math.min(b, c));
        }
        table[i][j] = answer;
        step++;
        order[i][j] = step;
        return answer;
    }

    static int[][][] topDown() {
        table = new int[ROWS][COLS];
        order = new int[ROWS][COLS];
        for (int i = 0; i < ROWS; i++) {
            for (int j = 0; j < COLS; j++) table[i][j] = -1;
        }
        step = 0;
        solve(ROWS - 1, COLS - 1);
        return new int[][][] { table, order };
    }

    /** The same cells, filled row by row. No recursion, so the order is the loop. */
    static int[][][] bottomUp() {
        int[][] values = new int[ROWS][COLS];
        int[][] filled = new int[ROWS][COLS];
        int count = 0;
        for (int i = 0; i < ROWS; i++) {
            for (int j = 0; j < COLS; j++) {
                int answer;
                if (i == 0) {
                    answer = j;
                } else if (j == 0) {
                    answer = i;
                } else if (A.charAt(i - 1) == B.charAt(j - 1)) {
                    answer = values[i - 1][j - 1];
                } else {
                    answer = 1 + Math.min(values[i - 1][j - 1], Math.min(values[i - 1][j], values[i][j - 1]));
                }
                values[i][j] = answer;
                count++;
                filled[i][j] = count;
            }
        }
        return new int[][][] { values, filled };
    }

    static String quoted(String text) {
        return "'" + text + "'";
    }

    static List<String> grid(String title, int[][] values, int width) {
        List<String> lines = new ArrayList<>();
        lines.add(title);
        String head = "      ";
        String labels = "-" + B;
        for (int j = 0; j < labels.length(); j++) {
            head += String.format("%" + width + "s", labels.charAt(j));
        }
        lines.add(head);
        for (int i = 0; i < ROWS; i++) {
            String label = i == 0 ? "-" : String.valueOf(A.charAt(i - 1));
            StringBuilder line = new StringBuilder("   " + String.format("%-3s", label));
            for (int j = 0; j < COLS; j++) line.append(String.format("%" + width + "d", values[i][j]));
            lines.add(line.toString());
        }
        return lines;
    }

    public static void main(String[] args) {
        int[][][] td = topDown();
        int[][] tdTable = td[0];
        int[][] tdOrder = td[1];
        int[][][] bu = bottomUp();
        int[][] buTable = bu[0];
        int[][] buOrder = bu[1];

        System.out.printf("turning %s into %s, one edit at a time%n", quoted(A), quoted(B));
        System.out.println();
        for (String line : grid("the table both of them fill:", buTable, 4)) System.out.println(line);
        System.out.println();

        // Top-down never visits a cell the answer does not depend on, so compare
        // the cells it did fill in.
        int visited = 0;
        boolean same = true;
        for (int i = 0; i < ROWS; i++) {
            for (int j = 0; j < COLS; j++) {
                if (tdOrder[i][j] > 0) {
                    visited++;
                    if (tdTable[i][j] != buTable[i][j]) same = false;
                }
            }
        }
        System.out.printf("top-down filled %d of the %d cells, and bottom-up filled all of them%n",
            visited, ROWS * COLS);
        System.out.printf("on the %d they share, every value agrees: %s%n", visited, same ? "yes" : "no");
        System.out.printf("edit distance: %d%n", buTable[ROWS - 1][COLS - 1]);
        System.out.println();

        List<String> left = grid("top-down: the order cells are finished", tdOrder, 4);
        List<String> right = grid("bottom-up: the order cells are filled", buOrder, 4);
        for (int i = 0; i < left.size(); i++) {
            System.out.printf("%-40s%s%n", left.get(i), right.get(i));
        }
        System.out.println();

        System.out.println("a 0 in the left grid is a cell the recursion never asked for.");
        System.out.println("top-down finishes a cell only after everything it needs, which is why its");
        System.out.println("numbers climb from the corner the recursion started at; bottom-up guarantees");
        System.out.println("the same thing by choosing a loop order that reaches dependencies first.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Top-down and bottom-up are not two algorithms. They are one table filled in
// two orders, and this prints both orders so that the claim is checkable rather
// than reassuring.
#include <algorithm>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

static const std::string A = "kitten";
static const std::string B = "sitting";
static const int ROWS = 7;
static const int COLS = 8;

static std::vector<std::vector<int>> table_(ROWS, std::vector<int>(COLS, -1));
static std::vector<std::vector<int>> order_(ROWS, std::vector<int>(COLS, 0));
static int step = 0;

// Recursion plus a memo. Cells are finished in the order the recursion needs.
int solve(int i, int j) {
    if (table_[i][j] >= 0) return table_[i][j];
    int answer;
    if (i == 0) {
        answer = j;
    } else if (j == 0) {
        answer = i;
    } else if (A[i - 1] == B[j - 1]) {
        answer = solve(i - 1, j - 1);
    } else {
        int a = solve(i - 1, j - 1);
        int b = solve(i - 1, j);
        int c = solve(i, j - 1);
        answer = 1 + std::min(a, std::min(b, c));
    }
    table_[i][j] = answer;
    step++;
    order_[i][j] = step;
    return answer;
}

// The same cells, filled row by row. No recursion, so the order is the loop.
void bottomUp(std::vector<std::vector<int>> &values, std::vector<std::vector<int>> &filled) {
    int count = 0;
    for (int i = 0; i < ROWS; i++) {
        for (int j = 0; j < COLS; j++) {
            int answer;
            if (i == 0) {
                answer = j;
            } else if (j == 0) {
                answer = i;
            } else if (A[i - 1] == B[j - 1]) {
                answer = values[i - 1][j - 1];
            } else {
                answer = 1 + std::min(values[i - 1][j - 1], std::min(values[i - 1][j], values[i][j - 1]));
            }
            values[i][j] = answer;
            count++;
            filled[i][j] = count;
        }
    }
}

std::string quoted(const std::string &text) {
    return "'" + text + "'";
}

std::vector<std::string> grid(const std::string &title, const std::vector<std::vector<int>> &values,
                              int width) {
    std::vector<std::string> lines{title};
    std::ostringstream head;
    head << "      ";
    std::string labels = "-" + B;
    for (char ch : labels) head << std::right << std::setw(width) << std::string(1, ch);
    lines.push_back(head.str());
    for (int i = 0; i < ROWS; i++) {
        std::ostringstream line;
        std::string label = i == 0 ? "-" : std::string(1, A[i - 1]);
        line << "   " << std::left << std::setw(3) << label;
        for (int j = 0; j < COLS; j++) line << std::right << std::setw(width) << values[i][j];
        lines.push_back(line.str());
    }
    return lines;
}

int main() {
    solve(ROWS - 1, COLS - 1);
    std::vector<std::vector<int>> tdTable = table_;
    std::vector<std::vector<int>> tdOrder = order_;

    std::vector<std::vector<int>> buTable(ROWS, std::vector<int>(COLS, -1));
    std::vector<std::vector<int>> buOrder(ROWS, std::vector<int>(COLS, 0));
    bottomUp(buTable, buOrder);

    std::cout << "turning " << quoted(A) << " into " << quoted(B) << ", one edit at a time\\n\\n";
    for (const std::string &line : grid("the table both of them fill:", buTable, 4))
        std::cout << line << "\\n";
    std::cout << "\\n";

    // Top-down never visits a cell the answer does not depend on, so compare the
    // cells it did fill in.
    int visited = 0;
    bool same = true;
    for (int i = 0; i < ROWS; i++) {
        for (int j = 0; j < COLS; j++) {
            if (tdOrder[i][j] > 0) {
                visited++;
                if (tdTable[i][j] != buTable[i][j]) same = false;
            }
        }
    }
    std::cout << "top-down filled " << visited << " of the " << ROWS * COLS
              << " cells, and bottom-up filled all of them\\n";
    std::cout << "on the " << visited << " they share, every value agrees: " << (same ? "yes" : "no") << "\\n";
    std::cout << "edit distance: " << buTable[ROWS - 1][COLS - 1] << "\\n\\n";

    auto left = grid("top-down: the order cells are finished", tdOrder, 4);
    auto right = grid("bottom-up: the order cells are filled", buOrder, 4);
    for (size_t i = 0; i < left.size(); i++) {
        std::cout << std::left << std::setw(40) << left[i] << right[i] << "\\n";
    }
    std::cout << "\\n";

    std::cout << "a 0 in the left grid is a cell the recursion never asked for.\\n";
    std::cout << "top-down finishes a cell only after everything it needs, which is why its\\n";
    std::cout << "numbers climb from the corner the recursion started at; bottom-up guarantees\\n";
    std::cout << "the same thing by choosing a loop order that reaches dependencies first.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// Top-down and bottom-up are not two algorithms. They are one table filled in
// two orders, and this prints both orders so that the claim is checkable rather
// than reassuring.

const A: &str = "kitten";
const B: &str = "sitting";
const ROWS: usize = 7;
const COLS: usize = 8;

struct Fill {
    table: Vec<Vec<i32>>,
    order: Vec<Vec<i32>>,
    step: i32,
}

/// Recursion plus a memo. Cells are finished in the order the recursion needs.
fn solve(i: usize, j: usize, f: &mut Fill) -> i32 {
    if f.table[i][j] >= 0 {
        return f.table[i][j];
    }
    let a = A.as_bytes();
    let b = B.as_bytes();
    let answer = if i == 0 {
        j as i32
    } else if j == 0 {
        i as i32
    } else if a[i - 1] == b[j - 1] {
        solve(i - 1, j - 1, f)
    } else {
        let x = solve(i - 1, j - 1, f);
        let y = solve(i - 1, j, f);
        let z = solve(i, j - 1, f);
        1 + x.min(y).min(z)
    };
    f.table[i][j] = answer;
    f.step += 1;
    f.order[i][j] = f.step;
    answer
}

/// The same cells, filled row by row. No recursion, so the order is the loop.
fn bottom_up() -> (Vec<Vec<i32>>, Vec<Vec<i32>>) {
    let a = A.as_bytes();
    let b = B.as_bytes();
    let mut values = vec![vec![0i32; COLS]; ROWS];
    let mut filled = vec![vec![0i32; COLS]; ROWS];
    let mut count = 0;
    for i in 0..ROWS {
        for j in 0..COLS {
            let answer = if i == 0 {
                j as i32
            } else if j == 0 {
                i as i32
            } else if a[i - 1] == b[j - 1] {
                values[i - 1][j - 1]
            } else {
                1 + values[i - 1][j - 1].min(values[i - 1][j]).min(values[i][j - 1])
            };
            values[i][j] = answer;
            count += 1;
            filled[i][j] = count;
        }
    }
    (values, filled)
}

fn quoted(text: &str) -> String {
    format!("'{}'", text)
}

fn grid(title: &str, values: &[Vec<i32>], width: usize) -> Vec<String> {
    let mut lines = vec![title.to_string()];
    let mut head = String::from("      ");
    let labels: String = format!("-{}", B);
    for ch in labels.chars() {
        head.push_str(&format!("{:>width$}", ch, width = width));
    }
    lines.push(head);
    for i in 0..ROWS {
        let label = if i == 0 {
            String::from("-")
        } else {
            (A.as_bytes()[i - 1] as char).to_string()
        };
        let mut line = format!("   {:<3}", label);
        for j in 0..COLS {
            line.push_str(&format!("{:>width$}", values[i][j], width = width));
        }
        lines.push(line);
    }
    lines
}

fn main() {
    let mut f = Fill {
        table: vec![vec![-1i32; COLS]; ROWS],
        order: vec![vec![0i32; COLS]; ROWS],
        step: 0,
    };
    solve(ROWS - 1, COLS - 1, &mut f);
    let (bu_table, bu_order) = bottom_up();

    println!("turning {} into {}, one edit at a time", quoted(A), quoted(B));
    println!();
    for line in grid("the table both of them fill:", &bu_table, 4) {
        println!("{}", line);
    }
    println!();

    // Top-down never visits a cell the answer does not depend on, so compare the
    // cells it did fill in.
    let mut visited = 0;
    let mut same = true;
    for i in 0..ROWS {
        for j in 0..COLS {
            if f.order[i][j] > 0 {
                visited += 1;
                if f.table[i][j] != bu_table[i][j] {
                    same = false;
                }
            }
        }
    }
    println!("top-down filled {} of the {} cells, and bottom-up filled all of them", visited, ROWS * COLS);
    println!("on the {} they share, every value agrees: {}", visited, if same { "yes" } else { "no" });
    println!("edit distance: {}", bu_table[ROWS - 1][COLS - 1]);
    println!();

    let left = grid("top-down: the order cells are finished", &f.order, 4);
    let right = grid("bottom-up: the order cells are filled", &bu_order, 4);
    for i in 0..left.len() {
        println!("{:<40}{}", left[i], right[i]);
    }
    println!();

    println!("a 0 in the left grid is a cell the recursion never asked for.");
    println!("top-down finishes a cell only after everything it needs, which is why its");
    println!("numbers climb from the corner the recursion started at; bottom-up guarantees");
    println!("the same thing by choosing a loop order that reaches dependencies first.");
}
`,
            },
            {
              lang: "go",
              code: `// Top-down and bottom-up are not two algorithms. They are one table filled in
// two orders, and this prints both orders so that the claim is checkable rather
// than reassuring.
package main

import "fmt"

const A = "kitten"
const B = "sitting"

var ROWS = len(A) + 1
var COLS = len(B) + 1

var table [][]int
var order [][]int
var step int

// Recursion plus a memo. Cells are finished in the order the recursion needs.
func solve(i, j int) int {
	if table[i][j] >= 0 {
		return table[i][j]
	}
	var answer int
	if i == 0 {
		answer = j
	} else if j == 0 {
		answer = i
	} else if A[i-1] == B[j-1] {
		answer = solve(i-1, j-1)
	} else {
		a, b, c := solve(i-1, j-1), solve(i-1, j), solve(i, j-1)
		answer = a
		if b < answer {
			answer = b
		}
		if c < answer {
			answer = c
		}
		answer++
	}
	table[i][j] = answer
	step++
	order[i][j] = step
	return answer
}

func newGrid() [][]int {
	g := make([][]int, ROWS)
	for i := range g {
		g[i] = make([]int, COLS)
	}
	return g
}

func topDown() ([][]int, [][]int) {
	table = newGrid()
	order = newGrid()
	for i := range table {
		for j := range table[i] {
			table[i][j] = -1
		}
	}
	step = 0
	solve(ROWS-1, COLS-1)
	return table, order
}

// The same cells, filled row by row. No recursion, so the order is the loop.
func bottomUp() ([][]int, [][]int) {
	values := newGrid()
	filled := newGrid()
	count := 0
	for i := 0; i < ROWS; i++ {
		for j := 0; j < COLS; j++ {
			var answer int
			if i == 0 {
				answer = j
			} else if j == 0 {
				answer = i
			} else if A[i-1] == B[j-1] {
				answer = values[i-1][j-1]
			} else {
				answer = values[i-1][j-1]
				if values[i-1][j] < answer {
					answer = values[i-1][j]
				}
				if values[i][j-1] < answer {
					answer = values[i][j-1]
				}
				answer++
			}
			values[i][j] = answer
			count++
			filled[i][j] = count
		}
	}
	return values, filled
}

func quoted(text string) string {
	return "'" + text + "'"
}

func grid(title string, values [][]int, width int) []string {
	lines := []string{title}
	head := "      "
	labels := "-" + B
	for j := 0; j < len(labels); j++ {
		head += fmt.Sprintf("%*s", width, string(labels[j]))
	}
	lines = append(lines, head)
	for i := 0; i < ROWS; i++ {
		label := "-"
		if i > 0 {
			label = string(A[i-1])
		}
		line := "   " + fmt.Sprintf("%-3s", label)
		for j := 0; j < COLS; j++ {
			line += fmt.Sprintf("%*d", width, values[i][j])
		}
		lines = append(lines, line)
	}
	return lines
}

func main() {
	tdTable, tdOrder := topDown()
	buTable, buOrder := bottomUp()

	fmt.Printf("turning %s into %s, one edit at a time\\n", quoted(A), quoted(B))
	fmt.Println()
	for _, line := range grid("the table both of them fill:", buTable, 4) {
		fmt.Println(line)
	}
	fmt.Println()

	// Top-down never visits a cell the answer does not depend on, so compare the
	// cells it did fill in.
	visited := 0
	same := true
	for i := 0; i < ROWS; i++ {
		for j := 0; j < COLS; j++ {
			if tdOrder[i][j] > 0 {
				visited++
				if tdTable[i][j] != buTable[i][j] {
					same = false
				}
			}
		}
	}
	agrees := "no"
	if same {
		agrees = "yes"
	}
	fmt.Printf("top-down filled %d of the %d cells, and bottom-up filled all of them\\n", visited, ROWS*COLS)
	fmt.Printf("on the %d they share, every value agrees: %s\\n", visited, agrees)
	fmt.Printf("edit distance: %d\\n", buTable[ROWS-1][COLS-1])
	fmt.Println()

	left := grid("top-down: the order cells are finished", tdOrder, 4)
	right := grid("bottom-up: the order cells are filled", buOrder, 4)
	for i := range left {
		fmt.Printf("%-40s%s\\n", left[i], right[i])
	}
	fmt.Println()

	fmt.Println("a 0 in the left grid is a cell the recursion never asked for.")
	fmt.Println("top-down finishes a cell only after everything it needs, which is why its")
	fmt.Println("numbers climb from the corner the recursion started at; bottom-up guarantees")
	fmt.Println("the same thing by choosing a loop order that reaches dependencies first.")
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "dp-edit-distance",
        kind: "dp",
        algorithm: "edit",
        title: "The table both orders are filling",
        lockAlgorithm: true,
      },
    },
    {
      id: "what-each-one-buys",
      heading: "What each order buys, in numbers",
      body: [
        "So what does each order actually buy? Two things, and both are measurable rather than matters of taste.",
        "**Top-down computes a state only if the answer depends on it.** When the reachable set is much smaller than the table, that is not a constant-factor saving. Coins of 100 and 175 can only ever reach amounts that differ from the target by a multiple of 25, so the recursion asks about a twenty-fifth of the amounts a loop would visit.",
        "**Bottom-up does not recurse.** Its stack depth is the same whatever the input, while top-down nests as deep as the longest chain of dependencies \u2014 and a chain of a hundred thousand states is not slow, it is a crash.",
        "1,192 states against 30,001 cells, and the reachable amounts printed underneath are exactly the multiples of 25, which is the arithmetic reason rather than an accident of this instance. On a problem shaped like this, bottom-up is doing twenty-five times the work to produce the same number.",
        "The depth column is the other direction. Top-down on 30,000 nests 301 calls, which is fine; the same code on a chain of 100,000 states would nest 100,000 and fall over. Bottom-up nests none, ever.",
        "That is the trade, and it is worth stating both ways round so neither becomes a habit. **Top-down wins when the reachable set is sparse.** **Bottom-up wins when the chain is deep**, when the constant factor of a call per state matters, and \u2014 the reason the next lesson exists \u2014 when you want to drop a dimension from the table, which is a rearrangement of the loop and has no top-down equivalent. When the state space is dense, top-down's saving is zero and its overhead is real.",
      ],
      examples: [
        {
          id: "sparse-against-dense",
          title: "States reached against cells filled, and how deep the recursion goes",
          lang: "python",
          code: `# What each order actually buys you, measured rather than argued.
#
# Top-down computes a state only if the answer depends on it, so on a sparse
# problem it can skip most of the table. Bottom-up computes every cell whether
# or not anything needs it, and in exchange it never recurses, so its stack
# depth is a constant instead of growing with the input.

COINS = [100, 175]
BIG = 10 ** 6


def top_down(amount, memo, depth, deepest):
    """Only the amounts the answer reaches are ever computed."""
    if depth > deepest[0]:
        deepest[0] = depth
    if amount in memo:
        return memo[amount]
    if amount == 0:
        answer = 0
    else:
        answer = BIG
        for coin in COINS:
            if coin <= amount:
                sub = top_down(amount - coin, memo, depth + 1, deepest)
                if sub + 1 < answer:
                    answer = sub + 1
    memo[amount] = answer
    return answer


def bottom_up(amount):
    """Every amount from 0 upwards, needed or not. No recursion at all."""
    table = [BIG] * (amount + 1)
    table[0] = 0
    for value in range(1, amount + 1):
        for coin in COINS:
            if coin <= value and table[value - coin] + 1 < table[value]:
                table[value] = table[value - coin] + 1
    return table


def shown(value):
    return str(value) if value < BIG else "-"


print(f"coins [{', '.join(str(c) for c in COINS)}]. '-' means the amount cannot be made.")
print()
print(f"{'amount':>8}{'answer':>8}{'states top-down':>18}{'cells bottom-up':>18}{'deepest call':>14}")
for amount in (500, 1000, 3000, 10000, 30000):
    memo = {}
    deepest = [0]
    answer = top_down(amount, memo, 1, deepest)
    table = bottom_up(amount)
    assert shown(answer) == shown(table[amount])
    print(f"{amount:>8}{shown(answer):>8}{len(memo):>18}{amount + 1:>18}{deepest[0]:>14}")
print()

# Where the two costs come from. Top-down only ever asks about amounts of the
# form 3000 - 7a - 11b, and bottom-up walks all 3001 of them.
memo = {}
deepest = [0]
top_down(30000, memo, 1, deepest)
reached = sorted(memo)
print(f"of the 30001 amounts from 0 to 30000, top-down asked about {len(reached)}")
print("  the smallest few: [" + ", ".join(str(v) for v in reached[:8]) + "]")
print("  the largest few:  [" + ", ".join(str(v) for v in reached[-4:]) + "]")
print()

print("and the depth is the reason the two orders are not interchangeable:")
print(f"  top-down on 30000 nests {deepest[0]} calls deep")
print("  bottom-up nests none, at any size")
print("  a few thousand frames is all most runtimes allow before the stack")
print("  gives out, so past that the choice stops being about speed.")
`,
          output: `coins [100, 175]. '-' means the amount cannot be made.

  amount  answer   states top-down   cells bottom-up  deepest call
     500       5                12               501             6
    1000       7                32              1001            11
    3000      18               112              3001            31
   10000      58               392             10001           101
   30000     174              1192             30001           301

of the 30001 amounts from 0 to 30000, top-down asked about 1192
  the smallest few: [0, 25, 50, 75, 100, 125, 150, 175]
  the largest few:  [29800, 29825, 29900, 30000]

and the depth is the reason the two orders are not interchangeable:
  top-down on 30000 nests 301 calls deep
  bottom-up nests none, at any size
  a few thousand frames is all most runtimes allow before the stack
  gives out, so past that the choice stops being about speed.`,
          explanation:
            "The coins are chosen so that the reachable amounts are sparse: everything the recursion asks about differs from the target by a multiple of 25, and the printed list confirms it. The last column instruments the recursion's own depth, which is the quantity that decides whether a top-down solution runs at all.",
          alternates: [
            {
              lang: "javascript",
              code: `// What each order actually buys you, measured rather than argued.
//
// Top-down computes a state only if the answer depends on it, so on a sparse
// problem it can skip most of the table. Bottom-up computes every cell whether
// or not anything needs it, and in exchange it never recurses, so its stack
// depth is a constant instead of growing with the input.

const COINS = [100, 175];
const BIG = 1000000;

const deepest = [0];

/** Only the amounts the answer reaches are ever computed. */
function topDown(amount, memo, depth) {
  if (depth > deepest[0]) deepest[0] = depth;
  const seen = memo.get(amount);
  if (seen !== undefined) return seen;
  let answer;
  if (amount === 0) {
    answer = 0;
  } else {
    answer = BIG;
    for (const coin of COINS) {
      if (coin <= amount) {
        const sub = topDown(amount - coin, memo, depth + 1);
        if (sub + 1 < answer) answer = sub + 1;
      }
    }
  }
  memo.set(amount, answer);
  return answer;
}

/** Every amount from 0 upwards, needed or not. No recursion at all. */
function bottomUp(amount) {
  const table = new Array(amount + 1).fill(BIG);
  table[0] = 0;
  for (let value = 1; value <= amount; value++) {
    for (const coin of COINS) {
      if (coin <= value && table[value - coin] + 1 < table[value]) {
        table[value] = table[value - coin] + 1;
      }
    }
  }
  return table;
}

const shown = (value) => (value < BIG ? String(value) : "-");
const pad = (v, w) => String(v).padStart(w);

console.log(\`coins [\${COINS.join(", ")}]. '-' means the amount cannot be made.\`);
console.log();
console.log(
  pad("amount", 8) + pad("answer", 8) + pad("states top-down", 18) + pad("cells bottom-up", 18) +
    pad("deepest call", 14)
);
for (const amount of [500, 1000, 3000, 10000, 30000]) {
  const memo = new Map();
  deepest[0] = 0;
  const answer = topDown(amount, memo, 1);
  const table = bottomUp(amount);
  if (shown(answer) !== shown(table[amount])) throw new Error("disagreement");
  console.log(
    pad(amount, 8) + pad(shown(answer), 8) + pad(memo.size, 18) + pad(amount + 1, 18) + pad(deepest[0], 14)
  );
}
console.log();

// Where the two costs come from. Top-down only ever asks about amounts of the
// form 30000 - 100a - 175b, and bottom-up walks all 30001 of them.
const memo = new Map();
deepest[0] = 0;
topDown(30000, memo, 1);
const reached = [...memo.keys()].sort((a, b) => a - b);
console.log(\`of the 30001 amounts from 0 to 30000, top-down asked about \${reached.length}\`);
console.log(\`  the smallest few: [\${reached.slice(0, 8).join(", ")}]\`);
console.log(\`  the largest few:  [\${reached.slice(-4).join(", ")}]\`);
console.log();

console.log("and the depth is the reason the two orders are not interchangeable:");
console.log(\`  top-down on 30000 nests \${deepest[0]} calls deep\`);
console.log("  bottom-up nests none, at any size");
console.log("  a few thousand frames is all most runtimes allow before the stack");
console.log("  gives out, so past that the choice stops being about speed.");
`,
            },
            {
              lang: "typescript",
              code: `// What each order actually buys you, measured rather than argued.
//
// Top-down computes a state only if the answer depends on it, so on a sparse
// problem it can skip most of the table. Bottom-up computes every cell whether
// or not anything needs it, and in exchange it never recurses, so its stack
// depth is a constant instead of growing with the input.

const COINS = [100, 175];
const BIG = 1000000;

const deepest = [0];

/** Only the amounts the answer reaches are ever computed. */
function topDown(amount: number, memo: Map<number, number>, depth: number): number {
  if (depth > deepest[0]) deepest[0] = depth;
  const seen = memo.get(amount);
  if (seen !== undefined) return seen;
  let answer: number;
  if (amount === 0) {
    answer = 0;
  } else {
    answer = BIG;
    for (const coin of COINS) {
      if (coin <= amount) {
        const sub = topDown(amount - coin, memo, depth + 1);
        if (sub + 1 < answer) answer = sub + 1;
      }
    }
  }
  memo.set(amount, answer);
  return answer;
}

/** Every amount from 0 upwards, needed or not. No recursion at all. */
function bottomUp(amount: number): number[] {
  const table = new Array(amount + 1).fill(BIG);
  table[0] = 0;
  for (let value = 1; value <= amount; value++) {
    for (const coin of COINS) {
      if (coin <= value && table[value - coin] + 1 < table[value]) {
        table[value] = table[value - coin] + 1;
      }
    }
  }
  return table;
}

const shown = (value: number): string => (value < BIG ? String(value) : "-");
const pad = (v: string | number, w: number): string => String(v).padStart(w);

console.log(\`coins [\${COINS.join(", ")}]. '-' means the amount cannot be made.\`);
console.log();
console.log(
  pad("amount", 8) + pad("answer", 8) + pad("states top-down", 18) + pad("cells bottom-up", 18) +
    pad("deepest call", 14)
);
for (const amount of [500, 1000, 3000, 10000, 30000]) {
  const memo = new Map();
  deepest[0] = 0;
  const answer = topDown(amount, memo, 1);
  const table = bottomUp(amount);
  if (shown(answer) !== shown(table[amount])) throw new Error("disagreement");
  console.log(
    pad(amount, 8) + pad(shown(answer), 8) + pad(memo.size, 18) + pad(amount + 1, 18) + pad(deepest[0], 14)
  );
}
console.log();

// Where the two costs come from. Top-down only ever asks about amounts of the
// form 30000 - 100a - 175b, and bottom-up walks all 30001 of them.
const memo = new Map();
deepest[0] = 0;
topDown(30000, memo, 1);
const reached = [...memo.keys()].sort((a, b) => a - b);
console.log(\`of the 30001 amounts from 0 to 30000, top-down asked about \${reached.length}\`);
console.log(\`  the smallest few: [\${reached.slice(0, 8).join(", ")}]\`);
console.log(\`  the largest few:  [\${reached.slice(-4).join(", ")}]\`);
console.log();

console.log("and the depth is the reason the two orders are not interchangeable:");
console.log(\`  top-down on 30000 nests \${deepest[0]} calls deep\`);
console.log("  bottom-up nests none, at any size");
console.log("  a few thousand frames is all most runtimes allow before the stack");
console.log("  gives out, so past that the choice stops being about speed.");
`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// What each order actually buys you, measured rather than argued.
//
// Top-down computes a state only if the answer depends on it, so on a sparse
// problem it can skip most of the table. Bottom-up computes every cell whether
// or not anything needs it, and in exchange it never recurses, so its stack
// depth is a constant instead of growing with the input.
public class Main {
    static final int[] COINS = { 100, 175 };
    static final int BIG = 1000000;

    static int deepest;

    /** Only the amounts the answer reaches are ever computed. */
    static int topDown(int amount, Map<Integer, Integer> memo, int depth) {
        if (depth > deepest) deepest = depth;
        if (memo.containsKey(amount)) return memo.get(amount);
        int answer;
        if (amount == 0) {
            answer = 0;
        } else {
            answer = BIG;
            for (int coin : COINS) {
                if (coin <= amount) {
                    int sub = topDown(amount - coin, memo, depth + 1);
                    if (sub + 1 < answer) answer = sub + 1;
                }
            }
        }
        memo.put(amount, answer);
        return answer;
    }

    /** Every amount from 0 upwards, needed or not. No recursion at all. */
    static int[] bottomUp(int amount) {
        int[] table = new int[amount + 1];
        for (int i = 0; i <= amount; i++) table[i] = BIG;
        table[0] = 0;
        for (int value = 1; value <= amount; value++) {
            for (int coin : COINS) {
                if (coin <= value && table[value - coin] + 1 < table[value]) {
                    table[value] = table[value - coin] + 1;
                }
            }
        }
        return table;
    }

    static String shown(int value) {
        return value < BIG ? String.valueOf(value) : "-";
    }

    public static void main(String[] args) {
        StringBuilder coins = new StringBuilder();
        for (int i = 0; i < COINS.length; i++) {
            if (i > 0) coins.append(", ");
            coins.append(COINS[i]);
        }
        System.out.printf("coins [%s]. '-' means the amount cannot be made.%n", coins);
        System.out.println();
        System.out.printf("%8s%8s%18s%18s%14s%n", "amount", "answer", "states top-down",
            "cells bottom-up", "deepest call");
        for (int amount : new int[] { 500, 1000, 3000, 10000, 30000 }) {
            Map<Integer, Integer> memo = new HashMap<>();
            deepest = 0;
            int answer = topDown(amount, memo, 1);
            int[] table = bottomUp(amount);
            if (!shown(answer).equals(shown(table[amount]))) throw new AssertionError();
            System.out.printf("%8d%8s%18d%18d%14d%n", amount, shown(answer), memo.size(), amount + 1, deepest);
        }
        System.out.println();

        // Where the two costs come from. Top-down only ever asks about amounts of
        // the form 30000 - 100a - 175b, and bottom-up walks all 30001 of them.
        Map<Integer, Integer> memo = new HashMap<>();
        deepest = 0;
        topDown(30000, memo, 1);
        List<Integer> reached = new ArrayList<>(memo.keySet());
        Collections.sort(reached);
        System.out.printf("of the 30001 amounts from 0 to 30000, top-down asked about %d%n", reached.size());
        StringBuilder small = new StringBuilder();
        for (int i = 0; i < 8; i++) {
            if (i > 0) small.append(", ");
            small.append(reached.get(i));
        }
        StringBuilder large = new StringBuilder();
        for (int i = reached.size() - 4; i < reached.size(); i++) {
            if (i > reached.size() - 4) large.append(", ");
            large.append(reached.get(i));
        }
        System.out.printf("  the smallest few: [%s]%n", small);
        System.out.printf("  the largest few:  [%s]%n", large);
        System.out.println();

        System.out.println("and the depth is the reason the two orders are not interchangeable:");
        System.out.printf("  top-down on 30000 nests %d calls deep%n", deepest);
        System.out.println("  bottom-up nests none, at any size");
        System.out.println("  a few thousand frames is all most runtimes allow before the stack");
        System.out.println("  gives out, so past that the choice stops being about speed.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// What each order actually buys you, measured rather than argued.
//
// Top-down computes a state only if the answer depends on it, so on a sparse
// problem it can skip most of the table. Bottom-up computes every cell whether
// or not anything needs it, and in exchange it never recurses, so its stack
// depth is a constant instead of growing with the input.
#include <array>
#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <vector>

static const std::array<int, 2> COINS = {100, 175};
static const int BIG = 1000000;

static int deepest = 0;

// Only the amounts the answer reaches are ever computed.
int topDown(int amount, std::map<int, int> &memo, int depth) {
    if (depth > deepest) deepest = depth;
    auto it = memo.find(amount);
    if (it != memo.end()) return it->second;
    int answer;
    if (amount == 0) {
        answer = 0;
    } else {
        answer = BIG;
        for (int coin : COINS) {
            if (coin <= amount) {
                int sub = topDown(amount - coin, memo, depth + 1);
                if (sub + 1 < answer) answer = sub + 1;
            }
        }
    }
    memo[amount] = answer;
    return answer;
}

// Every amount from 0 upwards, needed or not. No recursion at all.
std::vector<int> bottomUp(int amount) {
    std::vector<int> table(amount + 1, BIG);
    table[0] = 0;
    for (int value = 1; value <= amount; value++) {
        for (int coin : COINS) {
            if (coin <= value && table[value - coin] + 1 < table[value]) {
                table[value] = table[value - coin] + 1;
            }
        }
    }
    return table;
}

std::string shown(int value) {
    return value < BIG ? std::to_string(value) : "-";
}

int main() {
    std::cout << "coins [";
    for (size_t i = 0; i < COINS.size(); i++) {
        if (i > 0) std::cout << ", ";
        std::cout << COINS[i];
    }
    std::cout << "]. '-' means the amount cannot be made.\\n\\n";
    std::cout << std::right << std::setw(8) << "amount" << std::setw(8) << "answer"
              << std::setw(18) << "states top-down" << std::setw(18) << "cells bottom-up"
              << std::setw(14) << "deepest call" << "\\n";
    for (int amount : {500, 1000, 3000, 10000, 30000}) {
        std::map<int, int> memo;
        deepest = 0;
        int answer = topDown(amount, memo, 1);
        std::vector<int> table = bottomUp(amount);
        if (shown(answer) != shown(table[amount])) return 1;
        std::cout << std::right << std::setw(8) << amount << std::setw(8) << shown(answer)
                  << std::setw(18) << memo.size() << std::setw(18) << amount + 1
                  << std::setw(14) << deepest << "\\n";
    }
    std::cout << "\\n";

    // Where the two costs come from. Top-down only ever asks about amounts of
    // the form 30000 - 100a - 175b, and bottom-up walks all 30001 of them.
    std::map<int, int> memo;
    deepest = 0;
    topDown(30000, memo, 1);
    std::vector<int> reached;
    for (const auto &entry : memo) reached.push_back(entry.first);
    std::cout << "of the 30001 amounts from 0 to 30000, top-down asked about " << reached.size() << "\\n";
    std::cout << "  the smallest few: [";
    for (int i = 0; i < 8; i++) {
        if (i > 0) std::cout << ", ";
        std::cout << reached[i];
    }
    std::cout << "]\\n  the largest few:  [";
    for (size_t i = reached.size() - 4; i < reached.size(); i++) {
        if (i > reached.size() - 4) std::cout << ", ";
        std::cout << reached[i];
    }
    std::cout << "]\\n\\n";

    std::cout << "and the depth is the reason the two orders are not interchangeable:\\n";
    std::cout << "  top-down on 30000 nests " << deepest << " calls deep\\n";
    std::cout << "  bottom-up nests none, at any size\\n";
    std::cout << "  a few thousand frames is all most runtimes allow before the stack\\n";
    std::cout << "  gives out, so past that the choice stops being about speed.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// What each order actually buys you, measured rather than argued.
//
// Top-down computes a state only if the answer depends on it, so on a sparse
// problem it can skip most of the table. Bottom-up computes every cell whether
// or not anything needs it, and in exchange it never recurses, so its stack
// depth is a constant instead of growing with the input.
use std::collections::HashMap;

const COINS: [i32; 2] = [100, 175];
const BIG: i32 = 1000000;

/// Only the amounts the answer reaches are ever computed.
fn top_down(amount: i32, memo: &mut HashMap<i32, i32>, depth: i32, deepest: &mut i32) -> i32 {
    if depth > *deepest {
        *deepest = depth;
    }
    if let Some(&v) = memo.get(&amount) {
        return v;
    }
    let answer = if amount == 0 {
        0
    } else {
        let mut best = BIG;
        for &coin in COINS.iter() {
            if coin <= amount {
                let sub = top_down(amount - coin, memo, depth + 1, deepest);
                if sub + 1 < best {
                    best = sub + 1;
                }
            }
        }
        best
    };
    memo.insert(amount, answer);
    answer
}

/// Every amount from 0 upwards, needed or not. No recursion at all.
fn bottom_up(amount: i32) -> Vec<i32> {
    let n = amount as usize;
    let mut table = vec![BIG; n + 1];
    table[0] = 0;
    for value in 1..=n {
        for &coin in COINS.iter() {
            let c = coin as usize;
            if c <= value && table[value - c] + 1 < table[value] {
                table[value] = table[value - c] + 1;
            }
        }
    }
    table
}

fn shown(value: i32) -> String {
    if value < BIG { value.to_string() } else { String::from("-") }
}

fn main() {
    let coins: Vec<String> = COINS.iter().map(|c| c.to_string()).collect();
    println!("coins [{}]. '-' means the amount cannot be made.", coins.join(", "));
    println!();
    println!("{:>8}{:>8}{:>18}{:>18}{:>14}", "amount", "answer", "states top-down",
        "cells bottom-up", "deepest call");
    for amount in [500, 1000, 3000, 10000, 30000] {
        let mut memo: HashMap<i32, i32> = HashMap::new();
        let mut deepest = 0;
        let answer = top_down(amount, &mut memo, 1, &mut deepest);
        let table = bottom_up(amount);
        assert_eq!(shown(answer), shown(table[amount as usize]));
        println!("{:>8}{:>8}{:>18}{:>18}{:>14}", amount, shown(answer), memo.len(), amount + 1, deepest);
    }
    println!();

    // Where the two costs come from. Top-down only ever asks about amounts of
    // the form 30000 - 100a - 175b, and bottom-up walks all 30001 of them.
    let mut memo: HashMap<i32, i32> = HashMap::new();
    let mut deepest = 0;
    top_down(30000, &mut memo, 1, &mut deepest);
    let mut reached: Vec<i32> = memo.keys().copied().collect();
    reached.sort();
    println!("of the 30001 amounts from 0 to 30000, top-down asked about {}", reached.len());
    let small: Vec<String> = reached[..8].iter().map(|v| v.to_string()).collect();
    let large: Vec<String> = reached[reached.len() - 4..].iter().map(|v| v.to_string()).collect();
    println!("  the smallest few: [{}]", small.join(", "));
    println!("  the largest few:  [{}]", large.join(", "));
    println!();

    println!("and the depth is the reason the two orders are not interchangeable:");
    println!("  top-down on 30000 nests {} calls deep", deepest);
    println!("  bottom-up nests none, at any size");
    println!("  a few thousand frames is all most runtimes allow before the stack");
    println!("  gives out, so past that the choice stops being about speed.");
}
`,
            },
            {
              lang: "go",
              code: `// What each order actually buys you, measured rather than argued.
//
// Top-down computes a state only if the answer depends on it, so on a sparse
// problem it can skip most of the table. Bottom-up computes every cell whether
// or not anything needs it, and in exchange it never recurses, so its stack
// depth is a constant instead of growing with the input.
package main

import (
	"fmt"
	"sort"
	"strconv"
	"strings"
)

var COINS = []int{100, 175}

const BIG = 1000000

var deepest int

// Only the amounts the answer reaches are ever computed.
func topDown(amount int, memo map[int]int, depth int) int {
	if depth > deepest {
		deepest = depth
	}
	if v, ok := memo[amount]; ok {
		return v
	}
	var answer int
	if amount == 0 {
		answer = 0
	} else {
		answer = BIG
		for _, coin := range COINS {
			if coin <= amount {
				if sub := topDown(amount-coin, memo, depth+1); sub+1 < answer {
					answer = sub + 1
				}
			}
		}
	}
	memo[amount] = answer
	return answer
}

// Every amount from 0 upwards, needed or not. No recursion at all.
func bottomUp(amount int) []int {
	table := make([]int, amount+1)
	for i := range table {
		table[i] = BIG
	}
	table[0] = 0
	for value := 1; value <= amount; value++ {
		for _, coin := range COINS {
			if coin <= value && table[value-coin]+1 < table[value] {
				table[value] = table[value-coin] + 1
			}
		}
	}
	return table
}

func shown(value int) string {
	if value < BIG {
		return strconv.Itoa(value)
	}
	return "-"
}

func main() {
	parts := make([]string, len(COINS))
	for i, c := range COINS {
		parts[i] = strconv.Itoa(c)
	}
	fmt.Printf("coins [%s]. '-' means the amount cannot be made.\\n", strings.Join(parts, ", "))
	fmt.Println()
	fmt.Printf("%8s%8s%18s%18s%14s\\n", "amount", "answer", "states top-down", "cells bottom-up", "deepest call")
	for _, amount := range []int{500, 1000, 3000, 10000, 30000} {
		memo := map[int]int{}
		deepest = 0
		answer := topDown(amount, memo, 1)
		table := bottomUp(amount)
		if shown(answer) != shown(table[amount]) {
			panic("disagreement")
		}
		fmt.Printf("%8d%8s%18d%18d%14d\\n", amount, shown(answer), len(memo), amount+1, deepest)
	}
	fmt.Println()

	// Where the two costs come from. Top-down only ever asks about amounts of
	// the form 30000 - 100a - 175b, and bottom-up walks all 30001 of them.
	memo := map[int]int{}
	deepest = 0
	topDown(30000, memo, 1)
	reached := make([]int, 0, len(memo))
	for amount := range memo {
		reached = append(reached, amount)
	}
	sort.Ints(reached)
	fmt.Printf("of the 30001 amounts from 0 to 30000, top-down asked about %d\\n", len(reached))
	small := make([]string, 8)
	for i := 0; i < 8; i++ {
		small[i] = strconv.Itoa(reached[i])
	}
	large := make([]string, 4)
	for i := 0; i < 4; i++ {
		large[i] = strconv.Itoa(reached[len(reached)-4+i])
	}
	fmt.Printf("  the smallest few: [%s]\\n", strings.Join(small, ", "))
	fmt.Printf("  the largest few:  [%s]\\n", strings.Join(large, ", "))
	fmt.Println()

	fmt.Println("and the depth is the reason the two orders are not interchangeable:")
	fmt.Printf("  top-down on 30000 nests %d calls deep\\n", deepest)
	fmt.Println("  bottom-up nests none, at any size")
	fmt.Println("  a few thousand frames is all most runtimes allow before the stack")
	fmt.Println("  gives out, so past that the choice stops being about speed.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Top-down's saving disappears when the table is dense",
          body: "On a problem where nearly every cell is needed, the recursion visits nearly every cell anyway and pays a function call for each one. The sparse case in this example is 25 to 1; a grid-path DP is 1 to 1, and there the loop is simply the better implementation of the same thing.",
        },
        {
          title: "Deep recursion is a crash, not a slowdown",
          body: "A chain DP over an array of 100,000 elements nests 100,000 calls in the top-down form. That is not a performance question and no amount of memo tuning helps; it is the reason to convert, and it is worth checking the depth against the input size before assuming a working small case will scale.",
        },
      ],
    },
    {
      id: "the-loop-order-is-the-meaning",
      heading: "In bottom-up, the loop order is part of the meaning",
      body: [
        "Bottom-up has one failure mode top-down simply does not have, and it is worth meeting deliberately rather than in a submission.",
        "Top-down states which subproblem it wants by calling it. `solve(i + 1, cap)` and `solve(i, cap)` are visibly different questions \u2014 one moves past this item, the other stays on it \u2014 and the difference is an argument you can read. Bottom-up says the same thing with the direction of a loop, and the two versions differ by one word.",
        "Both loops are correct dynamic programs, and they solve different problems. Ascending, `table[cap - w]` may already have been updated for this item, so the item can be picked up again and again, and the row matches an exhaustive search over multisets on all three thousand random instances. Descending, that cell still holds the previous item's row, so each item is used at most once, and it matches an exhaustive search over subsets on all three thousand.",
        "Each is wrong for the other reading on the great majority of instances \u2014 they agree on 610 out of 3,000, which is only the instances where the two problems happen to have the same answer. One word in a for-loop is the entire difference between 0/1 knapsack and unbounded knapsack.",
        "The general form of the requirement: **the loop must visit the states in a topological order of the dependency graph.** The practical version is to write down which cells a cell reads, and check that every one of them is already final at the moment it is read. That is exactly the check the recursion was performing on your behalf.",
      ],
      examples: [
        {
          id: "loop-direction",
          title: "The same loop run in both directions, scored against both problems",
          lang: "python",
          code: `# Bottom-up has one failure mode top-down does not: the loop order is part of
# the meaning. Top-down says which subproblem it wants by calling it, so the
# distinction below is a visible argument. Bottom-up says it with the direction
# of a for-loop, and the two versions differ by one word.

WEIGHT = [3, 4, 5, 7]
VALUE = [40, 50, 60, 90]
CAPACITY = 12


def pack(descending):
    """One row of cells, updated once per item.

    Ascending, \`table[cap - w]\` may already include this item, so the item can be
    used again and again. Descending, it cannot, so each item is used at most
    once. Nothing else about the code changes.
    """
    table = [0] * (CAPACITY + 1)
    for i in range(len(WEIGHT)):
        caps = range(CAPACITY, WEIGHT[i] - 1, -1) if descending else range(WEIGHT[i], CAPACITY + 1)
        for cap in caps:
            candidate = table[cap - WEIGHT[i]] + VALUE[i]
            if candidate > table[cap]:
                table[cap] = candidate
    return table


def brute_once(cap):
    """Every subset: each item taken at most once."""
    best = 0
    for mask in range(1 << len(WEIGHT)):
        load = 0
        worth = 0
        for i in range(len(WEIGHT)):
            if mask >> i & 1:
                load += WEIGHT[i]
                worth += VALUE[i]
        if load <= cap and worth > best:
            best = worth
    return best


def brute_many(cap, i=0):
    """Every multiset: each item taken any number of times."""
    if i == len(WEIGHT):
        return 0
    best = brute_many(cap, i + 1)
    if WEIGHT[i] <= cap:
        take = VALUE[i] + brute_many(cap - WEIGHT[i], i)
        if take > best:
            best = take
    return best


up = pack(False)
down = pack(True)

print(f"{'item':<6}{'weight':>8}{'value':>8}")
for i in range(len(WEIGHT)):
    print(f"{chr(65 + i):<6}{WEIGHT[i]:>8}{VALUE[i]:>8}")
print()

print(f"{'capacity':<26}" + "".join(f"{c:>5}" for c in range(CAPACITY + 1)))
print(f"{'inner loop ascending':<26}" + "".join(f"{v:>5}" for v in up))
print(f"{'inner loop descending':<26}" + "".join(f"{v:>5}" for v in down))
print(f"{'every subset':<26}" + "".join(f"{brute_once(c):>5}" for c in range(CAPACITY + 1)))
print(f"{'every multiset':<26}" + "".join(f"{brute_many(c):>5}" for c in range(CAPACITY + 1)))
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
scores = [0, 0, 0, 0]
for _ in range(TRIALS):
    n = 2 + rand(4)
    WEIGHT = [1 + rand(7) for _ in range(n)]
    VALUE = [10 * (1 + rand(9)) for _ in range(n)]
    CAPACITY = 4 + rand(10)
    once = brute_once(CAPACITY)
    many = brute_many(CAPACITY)
    up = pack(False)
    down = pack(True)
    if up[CAPACITY] == many:
        scores[0] += 1
    if up[CAPACITY] == once:
        scores[1] += 1
    if down[CAPACITY] == once:
        scores[2] += 1
    if down[CAPACITY] == many:
        scores[3] += 1

print(f"scored against exhaustive search on {TRIALS} random instances:")
print(f"  ascending  matches every multiset (items reusable)   {scores[0]:>6}")
print(f"  ascending  matches every subset   (items once)       {scores[1]:>6}")
print(f"  descending matches every subset   (items once)       {scores[2]:>6}")
print(f"  descending matches every multiset (items reusable)   {scores[3]:>6}")
`,
          output: `item    weight   value
A            3      40
B            4      50
C            5      60
D            7      90

capacity                      0    1    2    3    4    5    6    7    8    9   10   11   12
inner loop ascending          0    0    0   40   50   60   80   90  100  120  130  140  160
inner loop descending         0    0    0   40   50   60   60   90  100  110  130  140  150
every subset                  0    0    0   40   50   60   60   90  100  110  130  140  150
every multiset                0    0    0   40   50   60   80   90  100  120  130  140  160

scored against exhaustive search on 3000 random instances:
  ascending  matches every multiset (items reusable)     3000
  ascending  matches every subset   (items once)          610
  descending matches every subset   (items once)         3000
  descending matches every multiset (items reusable)      610`,
          explanation:
            "`pack` differs only in the direction of the inner loop. Each direction is checked against the exhaustive search that matches it -- every subset for one, every multiset for the other -- and against the one that does not, so the table shows both that each is right and what it is right about.",
          alternates: [
            {
              lang: "javascript",
              code: `// Bottom-up has one failure mode top-down does not: the loop order is part of
// the meaning. Top-down says which subproblem it wants by calling it, so the
// distinction below is a visible argument. Bottom-up says it with the direction
// of a for-loop, and the two versions differ by one word.

let weight = [3, 4, 5, 7];
let value = [40, 50, 60, 90];
let capacity = 12;

/**
 * One row of cells, updated once per item.
 *
 * Ascending, \`table[cap - w]\` may already include this item, so the item can be
 * used again and again. Descending, it cannot, so each item is used at most
 * once. Nothing else about the code changes.
 */
function pack(descending) {
  const table = new Array(capacity + 1).fill(0);
  for (let i = 0; i < weight.length; i++) {
    if (descending) {
      for (let cap = capacity; cap >= weight[i]; cap--) {
        const candidate = table[cap - weight[i]] + value[i];
        if (candidate > table[cap]) table[cap] = candidate;
      }
    } else {
      for (let cap = weight[i]; cap <= capacity; cap++) {
        const candidate = table[cap - weight[i]] + value[i];
        if (candidate > table[cap]) table[cap] = candidate;
      }
    }
  }
  return table;
}

/** Every subset: each item taken at most once. */
function bruteOnce(cap) {
  let best = 0;
  for (let mask = 0; mask < 1 << weight.length; mask++) {
    let load = 0;
    let worth = 0;
    for (let i = 0; i < weight.length; i++) {
      if ((mask >> i) & 1) {
        load += weight[i];
        worth += value[i];
      }
    }
    if (load <= cap && worth > best) best = worth;
  }
  return best;
}

/** Every multiset: each item taken any number of times. */
function bruteMany(cap, i) {
  if (i === weight.length) return 0;
  let best = bruteMany(cap, i + 1);
  if (weight[i] <= cap) {
    const take = value[i] + bruteMany(cap - weight[i], i);
    if (take > best) best = take;
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

let up = pack(false);
let down = pack(true);

console.log(padEnd("item", 6) + pad("weight", 8) + pad("value", 8));
for (let i = 0; i < weight.length; i++) {
  console.log(padEnd(String.fromCharCode(65 + i), 6) + pad(weight[i], 8) + pad(value[i], 8));
}
console.log();

let header = padEnd("capacity", 26);
let rowUp = padEnd("inner loop ascending", 26);
let rowDown = padEnd("inner loop descending", 26);
let rowOnce = padEnd("every subset", 26);
let rowMany = padEnd("every multiset", 26);
for (let c = 0; c <= capacity; c++) {
  header += pad(c, 5);
  rowUp += pad(up[c], 5);
  rowDown += pad(down[c], 5);
  rowOnce += pad(bruteOnce(c), 5);
  rowMany += pad(bruteMany(c, 0), 5);
}
console.log(header);
console.log(rowUp);
console.log(rowDown);
console.log(rowOnce);
console.log(rowMany);
console.log();

const TRIALS = 3000;
const scores = [0, 0, 0, 0];
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(4);
  weight = Array.from({ length: n }, () => 1 + rand(7));
  value = Array.from({ length: n }, () => 10 * (1 + rand(9)));
  capacity = 4 + rand(10);
  const once = bruteOnce(capacity);
  const many = bruteMany(capacity, 0);
  up = pack(false);
  down = pack(true);
  if (up[capacity] === many) scores[0]++;
  if (up[capacity] === once) scores[1]++;
  if (down[capacity] === once) scores[2]++;
  if (down[capacity] === many) scores[3]++;
}

console.log(\`scored against exhaustive search on \${TRIALS} random instances:\`);
console.log(\`  ascending  matches every multiset (items reusable)   \${pad(scores[0], 6)}\`);
console.log(\`  ascending  matches every subset   (items once)       \${pad(scores[1], 6)}\`);
console.log(\`  descending matches every subset   (items once)       \${pad(scores[2], 6)}\`);
console.log(\`  descending matches every multiset (items reusable)   \${pad(scores[3], 6)}\`);
`,
            },
            {
              lang: "typescript",
              code: `// Bottom-up has one failure mode top-down does not: the loop order is part of
// the meaning. Top-down says which subproblem it wants by calling it, so the
// distinction below is a visible argument. Bottom-up says it with the direction
// of a for-loop, and the two versions differ by one word.

let weight = [3, 4, 5, 7];
let value = [40, 50, 60, 90];
let capacity = 12;

/**
 * One row of cells, updated once per item.
 *
 * Ascending, \`table[cap - w]\` may already include this item, so the item can be
 * used again and again. Descending, it cannot, so each item is used at most
 * once. Nothing else about the code changes.
 */
function pack(descending: boolean): number[] {
  const table = new Array(capacity + 1).fill(0);
  for (let i = 0; i < weight.length; i++) {
    if (descending) {
      for (let cap = capacity; cap >= weight[i]; cap--) {
        const candidate = table[cap - weight[i]] + value[i];
        if (candidate > table[cap]) table[cap] = candidate;
      }
    } else {
      for (let cap = weight[i]; cap <= capacity; cap++) {
        const candidate = table[cap - weight[i]] + value[i];
        if (candidate > table[cap]) table[cap] = candidate;
      }
    }
  }
  return table;
}

/** Every subset: each item taken at most once. */
function bruteOnce(cap: number): number {
  let best = 0;
  for (let mask = 0; mask < 1 << weight.length; mask++) {
    let load = 0;
    let worth = 0;
    for (let i = 0; i < weight.length; i++) {
      if ((mask >> i) & 1) {
        load += weight[i];
        worth += value[i];
      }
    }
    if (load <= cap && worth > best) best = worth;
  }
  return best;
}

/** Every multiset: each item taken any number of times. */
function bruteMany(cap: number, i: number): number {
  if (i === weight.length) return 0;
  let best = bruteMany(cap, i + 1);
  if (weight[i] <= cap) {
    const take = value[i] + bruteMany(cap - weight[i], i);
    if (take > best) best = take;
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

let up = pack(false);
let down = pack(true);

console.log(padEnd("item", 6) + pad("weight", 8) + pad("value", 8));
for (let i = 0; i < weight.length; i++) {
  console.log(padEnd(String.fromCharCode(65 + i), 6) + pad(weight[i], 8) + pad(value[i], 8));
}
console.log();

let header = padEnd("capacity", 26);
let rowUp = padEnd("inner loop ascending", 26);
let rowDown = padEnd("inner loop descending", 26);
let rowOnce = padEnd("every subset", 26);
let rowMany = padEnd("every multiset", 26);
for (let c = 0; c <= capacity; c++) {
  header += pad(c, 5);
  rowUp += pad(up[c], 5);
  rowDown += pad(down[c], 5);
  rowOnce += pad(bruteOnce(c), 5);
  rowMany += pad(bruteMany(c, 0), 5);
}
console.log(header);
console.log(rowUp);
console.log(rowDown);
console.log(rowOnce);
console.log(rowMany);
console.log();

const TRIALS = 3000;
const scores = [0, 0, 0, 0];
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(4);
  weight = Array.from({ length: n }, () => 1 + rand(7));
  value = Array.from({ length: n }, () => 10 * (1 + rand(9)));
  capacity = 4 + rand(10);
  const once = bruteOnce(capacity);
  const many = bruteMany(capacity, 0);
  up = pack(false);
  down = pack(true);
  if (up[capacity] === many) scores[0]++;
  if (up[capacity] === once) scores[1]++;
  if (down[capacity] === once) scores[2]++;
  if (down[capacity] === many) scores[3]++;
}

console.log(\`scored against exhaustive search on \${TRIALS} random instances:\`);
console.log(\`  ascending  matches every multiset (items reusable)   \${pad(scores[0], 6)}\`);
console.log(\`  ascending  matches every subset   (items once)       \${pad(scores[1], 6)}\`);
console.log(\`  descending matches every subset   (items once)       \${pad(scores[2], 6)}\`);
console.log(\`  descending matches every multiset (items reusable)   \${pad(scores[3], 6)}\`);
`,
            },
            {
              lang: "java",
              code: `// Bottom-up has one failure mode top-down does not: the loop order is part of
// the meaning. Top-down says which subproblem it wants by calling it, so the
// distinction below is a visible argument. Bottom-up says it with the direction
// of a for-loop, and the two versions differ by one word.
public class Main {
    static int[] weight = { 3, 4, 5, 7 };
    static int[] value = { 40, 50, 60, 90 };
    static int capacity = 12;

    /**
     * One row of cells, updated once per item.
     *
     * Ascending, \`table[cap - w]\` may already include this item, so the item can
     * be used again and again. Descending, it cannot, so each item is used at
     * most once. Nothing else about the code changes.
     */
    static int[] pack(boolean descending) {
        int[] table = new int[capacity + 1];
        for (int i = 0; i < weight.length; i++) {
            if (descending) {
                for (int cap = capacity; cap >= weight[i]; cap--) {
                    int candidate = table[cap - weight[i]] + value[i];
                    if (candidate > table[cap]) table[cap] = candidate;
                }
            } else {
                for (int cap = weight[i]; cap <= capacity; cap++) {
                    int candidate = table[cap - weight[i]] + value[i];
                    if (candidate > table[cap]) table[cap] = candidate;
                }
            }
        }
        return table;
    }

    /** Every subset: each item taken at most once. */
    static int bruteOnce(int cap) {
        int best = 0;
        for (int mask = 0; mask < (1 << weight.length); mask++) {
            int load = 0;
            int worth = 0;
            for (int i = 0; i < weight.length; i++) {
                if ((mask >> i & 1) == 1) {
                    load += weight[i];
                    worth += value[i];
                }
            }
            if (load <= cap && worth > best) best = worth;
        }
        return best;
    }

    /** Every multiset: each item taken any number of times. */
    static int bruteMany(int cap, int i) {
        if (i == weight.length) return 0;
        int best = bruteMany(cap, i + 1);
        if (weight[i] <= cap) {
            int take = value[i] + bruteMany(cap - weight[i], i);
            if (take > best) best = take;
        }
        return best;
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        int[] up = pack(false);
        int[] down = pack(true);

        System.out.printf("%-6s%8s%8s%n", "item", "weight", "value");
        for (int i = 0; i < weight.length; i++) {
            System.out.printf("%-6s%8d%8d%n", (char) ('A' + i), weight[i], value[i]);
        }
        System.out.println();

        StringBuilder header = new StringBuilder(String.format("%-26s", "capacity"));
        StringBuilder rowUp = new StringBuilder(String.format("%-26s", "inner loop ascending"));
        StringBuilder rowDown = new StringBuilder(String.format("%-26s", "inner loop descending"));
        StringBuilder rowOnce = new StringBuilder(String.format("%-26s", "every subset"));
        StringBuilder rowMany = new StringBuilder(String.format("%-26s", "every multiset"));
        for (int c = 0; c <= capacity; c++) {
            header.append(String.format("%5d", c));
            rowUp.append(String.format("%5d", up[c]));
            rowDown.append(String.format("%5d", down[c]));
            rowOnce.append(String.format("%5d", bruteOnce(c)));
            rowMany.append(String.format("%5d", bruteMany(c, 0)));
        }
        System.out.println(header);
        System.out.println(rowUp);
        System.out.println(rowDown);
        System.out.println(rowOnce);
        System.out.println(rowMany);
        System.out.println();

        final int TRIALS = 3000;
        int[] scores = new int[4];
        for (int t = 0; t < TRIALS; t++) {
            int n = 2 + rand(4);
            weight = new int[n];
            value = new int[n];
            for (int i = 0; i < n; i++) weight[i] = 1 + rand(7);
            for (int i = 0; i < n; i++) value[i] = 10 * (1 + rand(9));
            capacity = 4 + rand(10);
            int once = bruteOnce(capacity);
            int many = bruteMany(capacity, 0);
            up = pack(false);
            down = pack(true);
            if (up[capacity] == many) scores[0]++;
            if (up[capacity] == once) scores[1]++;
            if (down[capacity] == once) scores[2]++;
            if (down[capacity] == many) scores[3]++;
        }

        System.out.printf("scored against exhaustive search on %d random instances:%n", TRIALS);
        System.out.printf("  ascending  matches every multiset (items reusable)   %6d%n", scores[0]);
        System.out.printf("  ascending  matches every subset   (items once)       %6d%n", scores[1]);
        System.out.printf("  descending matches every subset   (items once)       %6d%n", scores[2]);
        System.out.printf("  descending matches every multiset (items reusable)   %6d%n", scores[3]);
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Bottom-up has one failure mode top-down does not: the loop order is part of
// the meaning. Top-down says which subproblem it wants by calling it, so the
// distinction below is a visible argument. Bottom-up says it with the direction
// of a for-loop, and the two versions differ by one word.
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

static std::vector<int> weight = {3, 4, 5, 7};
static std::vector<int> value = {40, 50, 60, 90};
static int capacity = 12;

// One row of cells, updated once per item.
//
// Ascending, \`table[cap - w]\` may already include this item, so the item can be
// used again and again. Descending, it cannot, so each item is used at most
// once. Nothing else about the code changes.
std::vector<int> pack(bool descending) {
    std::vector<int> table(capacity + 1, 0);
    for (size_t i = 0; i < weight.size(); i++) {
        if (descending) {
            for (int cap = capacity; cap >= weight[i]; cap--) {
                int candidate = table[cap - weight[i]] + value[i];
                if (candidate > table[cap]) table[cap] = candidate;
            }
        } else {
            for (int cap = weight[i]; cap <= capacity; cap++) {
                int candidate = table[cap - weight[i]] + value[i];
                if (candidate > table[cap]) table[cap] = candidate;
            }
        }
    }
    return table;
}

// Every subset: each item taken at most once.
int bruteOnce(int cap) {
    int best = 0;
    for (int mask = 0; mask < (1 << weight.size()); mask++) {
        int load = 0, worth = 0;
        for (size_t i = 0; i < weight.size(); i++) {
            if (mask >> i & 1) {
                load += weight[i];
                worth += value[i];
            }
        }
        if (load <= cap && worth > best) best = worth;
    }
    return best;
}

// Every multiset: each item taken any number of times.
int bruteMany(int cap, size_t i) {
    if (i == weight.size()) return 0;
    int best = bruteMany(cap, i + 1);
    if (weight[i] <= cap) {
        int take = value[i] + bruteMany(cap - weight[i], i);
        if (take > best) best = take;
    }
    return best;
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    std::vector<int> up = pack(false);
    std::vector<int> down = pack(true);

    std::cout << std::left << std::setw(6) << "item" << std::right << std::setw(8) << "weight"
              << std::setw(8) << "value" << "\\n";
    for (size_t i = 0; i < weight.size(); i++) {
        std::cout << std::left << std::setw(6) << std::string(1, static_cast<char>('A' + i))
                  << std::right << std::setw(8) << weight[i] << std::setw(8) << value[i] << "\\n";
    }
    std::cout << "\\n";

    std::string header = "capacity", rowUp = "inner loop ascending";
    std::string rowDown = "inner loop descending", rowOnce = "every subset", rowMany = "every multiset";
    header.resize(26, ' ');
    rowUp.resize(26, ' ');
    rowDown.resize(26, ' ');
    rowOnce.resize(26, ' ');
    rowMany.resize(26, ' ');
    auto cell = [](int v) {
        std::string s = std::to_string(v);
        return std::string(5 - s.size(), ' ') + s;
    };
    for (int c = 0; c <= capacity; c++) {
        header += cell(c);
        rowUp += cell(up[c]);
        rowDown += cell(down[c]);
        rowOnce += cell(bruteOnce(c));
        rowMany += cell(bruteMany(c, 0));
    }
    std::cout << header << "\\n" << rowUp << "\\n" << rowDown << "\\n" << rowOnce << "\\n" << rowMany << "\\n\\n";

    const int TRIALS = 3000;
    std::array<int, 4> scores{};
    for (int t = 0; t < TRIALS; t++) {
        int n = 2 + rnd(4);
        weight.assign(n, 0);
        value.assign(n, 0);
        for (int i = 0; i < n; i++) weight[i] = 1 + rnd(7);
        for (int i = 0; i < n; i++) value[i] = 10 * (1 + rnd(9));
        capacity = 4 + rnd(10);
        int once = bruteOnce(capacity);
        int many = bruteMany(capacity, 0);
        up = pack(false);
        down = pack(true);
        if (up[capacity] == many) scores[0]++;
        if (up[capacity] == once) scores[1]++;
        if (down[capacity] == once) scores[2]++;
        if (down[capacity] == many) scores[3]++;
    }

    std::cout << "scored against exhaustive search on " << TRIALS << " random instances:\\n";
    std::cout << "  ascending  matches every multiset (items reusable)   " << std::setw(6) << scores[0] << "\\n";
    std::cout << "  ascending  matches every subset   (items once)       " << std::setw(6) << scores[1] << "\\n";
    std::cout << "  descending matches every subset   (items once)       " << std::setw(6) << scores[2] << "\\n";
    std::cout << "  descending matches every multiset (items reusable)   " << std::setw(6) << scores[3] << "\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// Bottom-up has one failure mode top-down does not: the loop order is part of
// the meaning. Top-down says which subproblem it wants by calling it, so the
// distinction below is a visible argument. Bottom-up says it with the direction
// of a for-loop, and the two versions differ by one word.

struct Bag {
    weight: Vec<i32>,
    value: Vec<i32>,
    capacity: i32,
}

/// One row of cells, updated once per item.
///
/// Ascending, \`table[cap - w]\` may already include this item, so the item can be
/// used again and again. Descending, it cannot, so each item is used at most
/// once. Nothing else about the code changes.
fn pack(bag: &Bag, descending: bool) -> Vec<i32> {
    let mut table = vec![0i32; bag.capacity as usize + 1];
    for i in 0..bag.weight.len() {
        let w = bag.weight[i];
        if descending {
            let mut cap = bag.capacity;
            while cap >= w {
                let candidate = table[(cap - w) as usize] + bag.value[i];
                if candidate > table[cap as usize] {
                    table[cap as usize] = candidate;
                }
                cap -= 1;
            }
        } else {
            let mut cap = w;
            while cap <= bag.capacity {
                let candidate = table[(cap - w) as usize] + bag.value[i];
                if candidate > table[cap as usize] {
                    table[cap as usize] = candidate;
                }
                cap += 1;
            }
        }
    }
    table
}

/// Every subset: each item taken at most once.
fn brute_once(bag: &Bag, cap: i32) -> i32 {
    let n = bag.weight.len();
    let mut best = 0;
    for mask in 0..(1usize << n) {
        let mut load = 0;
        let mut worth = 0;
        for i in 0..n {
            if mask >> i & 1 == 1 {
                load += bag.weight[i];
                worth += bag.value[i];
            }
        }
        if load <= cap && worth > best {
            best = worth;
        }
    }
    best
}

/// Every multiset: each item taken any number of times.
fn brute_many(bag: &Bag, cap: i32, i: usize) -> i32 {
    if i == bag.weight.len() {
        return 0;
    }
    let mut best = brute_many(bag, cap, i + 1);
    if bag.weight[i] <= cap {
        let take = bag.value[i] + brute_many(bag, cap - bag.weight[i], i);
        if take > best {
            best = take;
        }
    }
    best
}

fn rand(seed: &mut i64, n: i64) -> i32 {
    *seed = (*seed * 1103515245 + 12345) % 2147483648;
    (*seed / 65536 % n) as i32
}

fn main() {
    let mut bag = Bag { weight: vec![3, 4, 5, 7], value: vec![40, 50, 60, 90], capacity: 12 };
    let up = pack(&bag, false);
    let down = pack(&bag, true);

    println!("{:<6}{:>8}{:>8}", "item", "weight", "value");
    for i in 0..bag.weight.len() {
        println!("{:<6}{:>8}{:>8}", (b'A' + i as u8) as char, bag.weight[i], bag.value[i]);
    }
    println!();

    let mut header = format!("{:<26}", "capacity");
    let mut row_up = format!("{:<26}", "inner loop ascending");
    let mut row_down = format!("{:<26}", "inner loop descending");
    let mut row_once = format!("{:<26}", "every subset");
    let mut row_many = format!("{:<26}", "every multiset");
    for c in 0..=bag.capacity {
        header.push_str(&format!("{:>5}", c));
        row_up.push_str(&format!("{:>5}", up[c as usize]));
        row_down.push_str(&format!("{:>5}", down[c as usize]));
        row_once.push_str(&format!("{:>5}", brute_once(&bag, c)));
        row_many.push_str(&format!("{:>5}", brute_many(&bag, c, 0)));
    }
    println!("{}", header);
    println!("{}", row_up);
    println!("{}", row_down);
    println!("{}", row_once);
    println!("{}", row_many);
    println!();

    const TRIALS: i32 = 3000;
    let mut seed = 1i64;
    let mut scores = [0i32; 4];
    for _ in 0..TRIALS {
        let n = 2 + rand(&mut seed, 4);
        bag.weight = (0..n).map(|_| 1 + rand(&mut seed, 7)).collect();
        bag.value = (0..n).map(|_| 10 * (1 + rand(&mut seed, 9))).collect();
        bag.capacity = 4 + rand(&mut seed, 10);
        let once = brute_once(&bag, bag.capacity);
        let many = brute_many(&bag, bag.capacity, 0);
        let up = pack(&bag, false);
        let down = pack(&bag, true);
        let cap = bag.capacity as usize;
        if up[cap] == many {
            scores[0] += 1;
        }
        if up[cap] == once {
            scores[1] += 1;
        }
        if down[cap] == once {
            scores[2] += 1;
        }
        if down[cap] == many {
            scores[3] += 1;
        }
    }

    println!("scored against exhaustive search on {} random instances:", TRIALS);
    println!("  ascending  matches every multiset (items reusable)   {:>6}", scores[0]);
    println!("  ascending  matches every subset   (items once)       {:>6}", scores[1]);
    println!("  descending matches every subset   (items once)       {:>6}", scores[2]);
    println!("  descending matches every multiset (items reusable)   {:>6}", scores[3]);
}
`,
            },
            {
              lang: "go",
              code: `// Bottom-up has one failure mode top-down does not: the loop order is part of
// the meaning. Top-down says which subproblem it wants by calling it, so the
// distinction below is a visible argument. Bottom-up says it with the direction
// of a for-loop, and the two versions differ by one word.
package main

import "fmt"

var weight = []int{3, 4, 5, 7}
var value = []int{40, 50, 60, 90}
var capacity = 12

// One row of cells, updated once per item.
//
// Ascending, \`table[cap - w]\` may already include this item, so the item can be
// used again and again. Descending, it cannot, so each item is used at most
// once. Nothing else about the code changes.
func pack(descending bool) []int {
	table := make([]int, capacity+1)
	for i := range weight {
		if descending {
			for cap := capacity; cap >= weight[i]; cap-- {
				if candidate := table[cap-weight[i]] + value[i]; candidate > table[cap] {
					table[cap] = candidate
				}
			}
		} else {
			for cap := weight[i]; cap <= capacity; cap++ {
				if candidate := table[cap-weight[i]] + value[i]; candidate > table[cap] {
					table[cap] = candidate
				}
			}
		}
	}
	return table
}

// Every subset: each item taken at most once.
func bruteOnce(cap int) int {
	best := 0
	for mask := 0; mask < 1<<len(weight); mask++ {
		load, worth := 0, 0
		for i := range weight {
			if mask>>i&1 == 1 {
				load += weight[i]
				worth += value[i]
			}
		}
		if load <= cap && worth > best {
			best = worth
		}
	}
	return best
}

// Every multiset: each item taken any number of times.
func bruteMany(cap, i int) int {
	if i == len(weight) {
		return 0
	}
	best := bruteMany(cap, i+1)
	if weight[i] <= cap {
		if take := value[i] + bruteMany(cap-weight[i], i); take > best {
			best = take
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
	up := pack(false)
	down := pack(true)

	fmt.Printf("%-6s%8s%8s\\n", "item", "weight", "value")
	for i := range weight {
		fmt.Printf("%-6s%8d%8d\\n", string(rune('A'+i)), weight[i], value[i])
	}
	fmt.Println()

	header := fmt.Sprintf("%-26s", "capacity")
	rowUp := fmt.Sprintf("%-26s", "inner loop ascending")
	rowDown := fmt.Sprintf("%-26s", "inner loop descending")
	rowOnce := fmt.Sprintf("%-26s", "every subset")
	rowMany := fmt.Sprintf("%-26s", "every multiset")
	for c := 0; c <= capacity; c++ {
		header += fmt.Sprintf("%5d", c)
		rowUp += fmt.Sprintf("%5d", up[c])
		rowDown += fmt.Sprintf("%5d", down[c])
		rowOnce += fmt.Sprintf("%5d", bruteOnce(c))
		rowMany += fmt.Sprintf("%5d", bruteMany(c, 0))
	}
	fmt.Println(header)
	fmt.Println(rowUp)
	fmt.Println(rowDown)
	fmt.Println(rowOnce)
	fmt.Println(rowMany)
	fmt.Println()

	const TRIALS = 3000
	scores := [4]int{}
	for t := 0; t < TRIALS; t++ {
		n := 2 + rand(4)
		weight = make([]int, n)
		value = make([]int, n)
		for i := 0; i < n; i++ {
			weight[i] = 1 + rand(7)
		}
		for i := 0; i < n; i++ {
			value[i] = 10 * (1 + rand(9))
		}
		capacity = 4 + rand(10)
		once := bruteOnce(capacity)
		many := bruteMany(capacity, 0)
		up = pack(false)
		down = pack(true)
		if up[capacity] == many {
			scores[0]++
		}
		if up[capacity] == once {
			scores[1]++
		}
		if down[capacity] == once {
			scores[2]++
		}
		if down[capacity] == many {
			scores[3]++
		}
	}

	fmt.Printf("scored against exhaustive search on %d random instances:\\n", TRIALS)
	fmt.Printf("  ascending  matches every multiset (items reusable)   %6d\\n", scores[0])
	fmt.Printf("  ascending  matches every subset   (items once)       %6d\\n", scores[1])
	fmt.Printf("  descending matches every subset   (items once)       %6d\\n", scores[2])
	fmt.Printf("  descending matches every multiset (items reusable)   %6d\\n", scores[3])
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "The loop direction is not a style choice",
          body: "Ascending and descending are 0/1 knapsack and unbounded knapsack, and nothing in the code says so. If you cannot state which problem a direction is solving, write down which cells the update reads and ask whether they still hold the previous item's row -- that question has a definite answer and it is the whole distinction.",
        },
        {
          title: "Convert, then diff",
          body: "The order bug is introduced during the conversion and produces a plausible number rather than a crash, so the cheapest defence is to keep the top-down version and run both on a few thousand small random inputs. Every example in this module does exactly that against a brute force, and it costs a second.",
        },
      ],
    },
    {
      id: "converting-between-them",
      heading: "Converting one into the other, mechanically",
      body: [
        "Given a top-down solution that works, the conversion is mechanical.",
        "**The state and its ranges become the array's dimensions.** This is why lesson 3 insisted on multiplying the ranges out \u2014 that product is now literally the allocation.",
        "**The base cases become the initialisation.** Both of them, including the impossible value, which is a good moment to re-read lesson 4's warning about what an infinity has to survive.",
        "**The direction comes from which way the recursion's arguments move.** If `solve(i)` calls `solve(i + 1)`, then `i` must be iterated downwards; if it calls `solve(i - 1)`, upwards. Where two indices move, each gets its own direction, and where an index can stay put \u2014 the reusable-coin case \u2014 the direction decides whether reuse is allowed.",
        "**Each recursive call becomes an array read**, and the top-level call becomes the cell you print at the end.",
        "Which leaves the question of which to write first, and the answer is nearly always top-down. It is the memoisation edit applied to a recursion you already believe, it cannot get the order wrong, and it gives you a correct implementation to compare against. Convert when you need the stack depth, the space, or the constant \u2014 and when you do, keep the top-down version and run the two against each other on a few thousand random inputs. The conversion is exactly where the order bug appears, and it is a bug that produces confident wrong answers rather than a crash.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between top-down and bottom-up dynamic programming?",
      answer:
        "They fill the same table in different orders. Both have to satisfy the same rule \u2014 no cell computed before the cells it reads \u2014 and the difference is who enforces it. Top-down gets it for free, because a recursive call cannot return before its own calls have. Bottom-up needs a loop order that happens to be a topological order of the dependencies, which is an obligation you take on. Concretely, on an edit distance table, top-down finished 50 of the 56 cells in an order that dives at the diagonal, and bottom-up filled all 56 in reading order, and every cell they share holds the same value.",
    },
    {
      question: "When would you choose one over the other?",
      answer:
        "Top-down when the reachable states are much sparser than the table \u2014 coin change with denominations of 100 and 175 asks about 1,192 amounts where the loop fills 30,001, because only multiples of 25 are ever reachable. Bottom-up when the dependency chain is deep, because top-down nests one call per link and a chain of 100,000 states is a stack overflow rather than a slow program; also when the constant factor of a call per state matters, and when I want to drop a dimension to save space, which is a rearrangement of the loop with no top-down equivalent. In practice I write top-down first \u2014 it is the memoisation edit on a recursion I already believe and it cannot get the order wrong \u2014 and convert when one of those reasons applies.",
    },
    {
      question: "In a bottom-up knapsack, why does the inner loop run backwards?",
      answer:
        "Because the direction is what says whether an item may be reused. Running the capacity downwards, `table[cap - w]` still holds the row from before this item was considered, so the item is used at most once and you have 0/1 knapsack. Running it upwards, that cell may already include this item, so it can be picked up repeatedly and you have the unbounded version. They are both correct dynamic programs for different problems: on three thousand random instances each matches its own exhaustive search every single time and the other one on 610. Top-down never exposes this, because there the distinction is a visible argument \u2014 `solve(i + 1, ...)` against `solve(i, ...)`.",
    },
  ],
  takeaways: [
    "Top-down and bottom-up are one table filled in two orders, not two algorithms.",
    "Both must compute a cell after everything it reads; recursion enforces that for free, a loop does not.",
    "Top-down computes only the states the answer reaches \u2014 1,192 against 30,001 when the reachable set is a twenty-fifth of the table.",
    "Bottom-up never recurses, so a chain of 100,000 states is a loop rather than a stack overflow.",
    "When the table is dense, top-down saves nothing and still pays a call per state.",
    "In bottom-up the loop direction carries meaning: ascending is unbounded knapsack, descending is 0/1.",
    "The loop must visit states in a topological order of the dependencies \u2014 check which cells each update reads.",
    "Write top-down first, convert when you need depth or space, and diff the two on random inputs afterwards.",
  ],
  status: "available",
};
