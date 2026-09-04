import type { Lesson } from "@/content/types";

export const bruteForceToMemoisationLesson: Lesson = {
  id: "dsa-dp-memoisation",
  slug: "from-brute-force-to-memoisation",
  moduleSlug: "dynamic-programming-foundations",
  title: "From Brute Force to Memoisation",
  summary:
    "The repair is four lines long, deletes nothing, and has exactly one precondition: the key has to name every argument the answer depends on, and nothing else. Both ways of getting that wrong are here, one of them fast and wrong and the other correct and pointless.",
  estimatedMinutes: 35,
  objectives: [
    "Apply the four-line memoisation edit to a recursion without restructuring it",
    "Predict a memoised recursion's cost from its state count rather than from its call tree",
    "Diagnose a key that is missing an argument, including which way its answers are wrong",
    "Recognise an accumulator in the signature as a sign the return value is defined wrongly",
  ],
  sections: [
    {
      id: "the-edit",
      heading: "Four lines, and nothing is deleted",
      body: [
        "Lesson 1 said dynamic programming is a diagnosis about a recursion you already have. This lesson is the repair, and the reason it comes second is that it is genuinely mechanical: there is a fixed edit, it is four lines long, and it deletes nothing.",
        "The edit is this. **Name the subproblem** \u2014 build a key out of exactly the arguments that vary. **Look the key up** and return the stored answer if it is there. **Store the answer** before returning it. **Return that one variable** rather than a fresh expression, so there is a single place the value comes from.",
        "That last step sounds like pedantry and is not. The commonest way to break this edit is to compute the answer, return it, and forget the line that stores it, which produces a program that is correct, has a memo, and never fills it in. Routing every return through one named variable makes that mistake hard to make.",
        "Below is a recursion nobody would think of as a dynamic program \u2014 counting routes through a grid with walls in it \u2014 with both versions side by side. Read them as a diff. The bounds check has moved above the key on purpose, so that squares off the edge of the grid never take up a row in the table; everything else is untouched.",
        "On the seven-by-ten grid the count drops from 1,551 calls to 123, and the memo ends up holding 62 subproblems out of 70 squares \u2014 which is every square that is not one of the eight walls, each computed exactly once. That is the shape of the guarantee: **the memoised version does work proportional to the number of states, and the plain one does work proportional to the number of answers.**",
        "The table underneath is that sentence as a measurement. The `routes` column and the `calls` column climb together, because the recursion has to walk every route to count it. The `memo calls` and `stored` columns climb together too, and much more slowly, because there are only ever `n * n` squares. By twelve by twelve the two costs are 3,997,447 against 287.",
        "One detail in that table is worth checking rather than skimming: the memo-calls column is exactly `2 * stored - 1` on every row. Each stored square is computed once and makes two calls of its own, except the target square, which returns immediately \u2014 so the total is fixed by the state count and has nothing to do with how many routes there are. That is what it means for a cost to be driven by the state space.",
      ],
      examples: [
        {
          id: "the-edit",
          title: "The same recursion twice, once with a memo",
          lang: "python",
          code: `# The repair, in the smallest form it comes in. \`count_paths\` is the recursion
# anybody would write first. \`count_paths_memo\` is the same function with four
# lines added and nothing removed, and the point of putting them side by side is
# that there is nothing else to the edit.

GRID = [
    "..........",
    ".#..#.....",
    "....#..#..",
    "..#.......",
    ".....#....",
    "..#....#..",
    "..........",
]
ROWS = len(GRID)
COLS = len(GRID[0])

calls = [0, 0]


def count_paths(r, c):
    calls[0] += 1
    if r >= ROWS or c >= COLS or GRID[r][c] == "#":
        return 0
    if r == ROWS - 1 and c == COLS - 1:
        return 1
    return count_paths(r + 1, c) + count_paths(r, c + 1)


def count_paths_memo(r, c, memo):
    calls[1] += 1
    if r >= ROWS or c >= COLS or GRID[r][c] == "#":
        return 0
    key = r * 100 + c                       # 1. name the subproblem
    if key in memo:                         # 2. answer from the memo if it is there
        return memo[key]
    if r == ROWS - 1 and c == COLS - 1:
        value = 1
    else:
        value = count_paths_memo(r + 1, c, memo) + count_paths_memo(r, c + 1, memo)
    memo[key] = value                       # 3. record it before returning
    return value                            # 4. and return the one variable


print("the grid, # for a blocked square:")
for row in GRID:
    print("  " + row)
print()

memo = {}
plain = count_paths(0, 0)
cached = count_paths_memo(0, 0, memo)
print(f"routes from the top left to the bottom right: {plain}")
print(f"the memoised version agrees: {'yes' if plain == cached else 'no'}")
print(f"calls: {calls[0]} without the memo, {calls[1]} with it")
print(f"subproblems stored: {len(memo)}, out of {ROWS * COLS} squares")
print()

# The same edit on empty square grids, so the two costs can be watched growing
# apart. The recursion's cost tracks the number of routes; the memo's tracks the
# number of squares, which is the entire idea.
print(f"{'grid':>6}{'routes':>12}{'calls':>12}{'memo calls':>12}{'stored':>8}")
for n in range(2, 13):
    GRID = ["." * n for _ in range(n)]
    ROWS = n
    COLS = n
    calls[0] = 0
    calls[1] = 0
    memo = {}
    routes = count_paths(0, 0)
    assert count_paths_memo(0, 0, memo) == routes
    print(f"{f'{n}x{n}':>6}{routes:>12}{calls[0]:>12}{calls[1]:>12}{len(memo):>8}")
`,
          output: `the grid, # for a blocked square:
  ..........
  .#..#.....
  ....#..#..
  ..#.......
  .....#....
  ..#....#..
  ..........

routes from the top left to the bottom right: 179
the memoised version agrees: yes
calls: 1551 without the memo, 123 with it
subproblems stored: 62, out of 70 squares

  grid      routes       calls  memo calls  stored
   2x2           2           7           7       4
   3x3           6          27          17       9
   4x4          20          99          31      16
   5x5          70         363          49      25
   6x6         252        1343          71      36
   7x7         924        5015          97      49
   8x8        3432       18875         127      64
   9x9       12870       71499         161      81
 10x10       48620      272271         199     100
 11x11      184756     1041351         241     121
 12x12      705432     3997447         287     144`,
          explanation:
            "The two functions are the same function. `count_paths_memo` adds a key, a lookup, a store and a single named return, and moves the bounds check above the key so that squares off the grid never occupy a row in the table. The grid at the top has eight walls, and the memo ends up holding 62 of the 70 squares -- every reachable one, exactly once.",
          alternates: [
            {
              lang: "javascript",
              code: `// The repair, in the smallest form it comes in. \`countPaths\` is the recursion
// anybody would write first. \`countPathsMemo\` is the same function with four
// lines added and nothing removed, and the point of putting them side by side is
// that there is nothing else to the edit.

let grid = [
  "..........",
  ".#..#.....",
  "....#..#..",
  "..#.......",
  ".....#....",
  "..#....#..",
  "..........",
];
let rows = grid.length;
let cols = grid[0].length;

const calls = [0, 0];

function countPaths(r, c) {
  calls[0]++;
  if (r >= rows || c >= cols || grid[r][c] === "#") return 0;
  if (r === rows - 1 && c === cols - 1) return 1;
  return countPaths(r + 1, c) + countPaths(r, c + 1);
}

function countPathsMemo(r, c, memo) {
  calls[1]++;
  if (r >= rows || c >= cols || grid[r][c] === "#") return 0;
  const key = r * 100 + c;              // 1. name the subproblem
  const seen = memo.get(key);           // 2. answer from the memo if it is there
  if (seen !== undefined) return seen;
  let value;
  if (r === rows - 1 && c === cols - 1) {
    value = 1;
  } else {
    value = countPathsMemo(r + 1, c, memo) + countPathsMemo(r, c + 1, memo);
  }
  memo.set(key, value);                 // 3. record it before returning
  return value;                         // 4. and return the one variable
}

const pad = (value, width) => String(value).padStart(width);

console.log("the grid, # for a blocked square:");
for (const row of grid) console.log("  " + row);
console.log();

let memo = new Map();
const plain = countPaths(0, 0);
const cached = countPathsMemo(0, 0, memo);
console.log(\`routes from the top left to the bottom right: \${plain}\`);
console.log(\`the memoised version agrees: \${plain === cached ? "yes" : "no"}\`);
console.log(\`calls: \${calls[0]} without the memo, \${calls[1]} with it\`);
console.log(\`subproblems stored: \${memo.size}, out of \${rows * cols} squares\`);
console.log();

// The same edit on empty square grids, so the two costs can be watched growing
// apart. The recursion's cost tracks the number of routes; the memo's tracks the
// number of squares, which is the entire idea.
console.log(pad("grid", 6) + pad("routes", 12) + pad("calls", 12) + pad("memo calls", 12) + pad("stored", 8));
for (let n = 2; n <= 12; n++) {
  grid = new Array(n).fill(".".repeat(n));
  rows = n;
  cols = n;
  calls[0] = 0;
  calls[1] = 0;
  memo = new Map();
  const routes = countPaths(0, 0);
  if (countPathsMemo(0, 0, memo) !== routes) throw new Error("disagreement");
  console.log(pad(\`\${n}x\${n}\`, 6) + pad(routes, 12) + pad(calls[0], 12) + pad(calls[1], 12) + pad(memo.size, 8));
}
`,
            },
            {
              lang: "typescript",
              code: `// The repair, in the smallest form it comes in. \`countPaths\` is the recursion
// anybody would write first. \`countPathsMemo\` is the same function with four
// lines added and nothing removed, and the point of putting them side by side is
// that there is nothing else to the edit.

let grid = [
  "..........",
  ".#..#.....",
  "....#..#..",
  "..#.......",
  ".....#....",
  "..#....#..",
  "..........",
];
let rows = grid.length;
let cols = grid[0].length;

const calls = [0, 0];

function countPaths(r: number, c: number): number {
  calls[0]++;
  if (r >= rows || c >= cols || grid[r][c] === "#") return 0;
  if (r === rows - 1 && c === cols - 1) return 1;
  return countPaths(r + 1, c) + countPaths(r, c + 1);
}

function countPathsMemo(r: number, c: number, memo: Map<number, number>): number {
  calls[1]++;
  if (r >= rows || c >= cols || grid[r][c] === "#") return 0;
  const key = r * 100 + c;              // 1. name the subproblem
  const seen = memo.get(key);           // 2. answer from the memo if it is there
  if (seen !== undefined) return seen;
  let value: number;
  if (r === rows - 1 && c === cols - 1) {
    value = 1;
  } else {
    value = countPathsMemo(r + 1, c, memo) + countPathsMemo(r, c + 1, memo);
  }
  memo.set(key, value);                 // 3. record it before returning
  return value;                         // 4. and return the one variable
}

const pad = (value: string | number, width: number): string => String(value).padStart(width);

console.log("the grid, # for a blocked square:");
for (const row of grid) console.log("  " + row);
console.log();

let memo = new Map();
const plain = countPaths(0, 0);
const cached = countPathsMemo(0, 0, memo);
console.log(\`routes from the top left to the bottom right: \${plain}\`);
console.log(\`the memoised version agrees: \${plain === cached ? "yes" : "no"}\`);
console.log(\`calls: \${calls[0]} without the memo, \${calls[1]} with it\`);
console.log(\`subproblems stored: \${memo.size}, out of \${rows * cols} squares\`);
console.log();

// The same edit on empty square grids, so the two costs can be watched growing
// apart. The recursion's cost tracks the number of routes; the memo's tracks the
// number of squares, which is the entire idea.
console.log(pad("grid", 6) + pad("routes", 12) + pad("calls", 12) + pad("memo calls", 12) + pad("stored", 8));
for (let n = 2; n <= 12; n++) {
  grid = new Array(n).fill(".".repeat(n));
  rows = n;
  cols = n;
  calls[0] = 0;
  calls[1] = 0;
  memo = new Map();
  const routes = countPaths(0, 0);
  if (countPathsMemo(0, 0, memo) !== routes) throw new Error("disagreement");
  console.log(pad(\`\${n}x\${n}\`, 6) + pad(routes, 12) + pad(calls[0], 12) + pad(calls[1], 12) + pad(memo.size, 8));
}
`,
            },
            {
              lang: "java",
              code: `import java.util.HashMap;
import java.util.Map;

// The repair, in the smallest form it comes in. \`countPaths\` is the recursion
// anybody would write first. \`countPathsMemo\` is the same function with four
// lines added and nothing removed, and the point of putting them side by side is
// that there is nothing else to the edit.
public class Main {
    static String[] grid = {
        "..........",
        ".#..#.....",
        "....#..#..",
        "..#.......",
        ".....#....",
        "..#....#..",
        "..........",
    };
    static int rows = grid.length;
    static int cols = grid[0].length();

    static long[] calls = new long[2];

    static long countPaths(int r, int c) {
        calls[0]++;
        if (r >= rows || c >= cols || grid[r].charAt(c) == '#') return 0;
        if (r == rows - 1 && c == cols - 1) return 1;
        return countPaths(r + 1, c) + countPaths(r, c + 1);
    }

    static long countPathsMemo(int r, int c, Map<Integer, Long> memo) {
        calls[1]++;
        if (r >= rows || c >= cols || grid[r].charAt(c) == '#') return 0;
        int key = r * 100 + c;                    // 1. name the subproblem
        if (memo.containsKey(key)) {              // 2. answer from the memo if it is there
            return memo.get(key);
        }
        long value;
        if (r == rows - 1 && c == cols - 1) {
            value = 1;
        } else {
            value = countPathsMemo(r + 1, c, memo) + countPathsMemo(r, c + 1, memo);
        }
        memo.put(key, value);                     // 3. record it before returning
        return value;                             // 4. and return the one variable
    }

    public static void main(String[] args) {
        System.out.println("the grid, # for a blocked square:");
        for (String row : grid) System.out.println("  " + row);
        System.out.println();

        Map<Integer, Long> memo = new HashMap<>();
        long plain = countPaths(0, 0);
        long cached = countPathsMemo(0, 0, memo);
        System.out.printf("routes from the top left to the bottom right: %d%n", plain);
        System.out.printf("the memoised version agrees: %s%n", plain == cached ? "yes" : "no");
        System.out.printf("calls: %d without the memo, %d with it%n", calls[0], calls[1]);
        System.out.printf("subproblems stored: %d, out of %d squares%n", memo.size(), rows * cols);
        System.out.println();

        // The same edit on empty square grids, so the two costs can be watched
        // growing apart. The recursion's cost tracks the number of routes; the
        // memo's tracks the number of squares, which is the entire idea.
        System.out.printf("%6s%12s%12s%12s%8s%n", "grid", "routes", "calls", "memo calls", "stored");
        for (int n = 2; n <= 12; n++) {
            grid = new String[n];
            for (int i = 0; i < n; i++) grid[i] = ".".repeat(n);
            rows = n;
            cols = n;
            calls[0] = 0;
            calls[1] = 0;
            memo = new HashMap<>();
            long routes = countPaths(0, 0);
            if (countPathsMemo(0, 0, memo) != routes) throw new AssertionError();
            System.out.printf("%6s%12d%12d%12d%8d%n", n + "x" + n, routes, calls[0], calls[1], memo.size());
        }
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The repair, in the smallest form it comes in. \`countPaths\` is the recursion
// anybody would write first. \`countPathsMemo\` is the same function with four
// lines added and nothing removed, and the point of putting them side by side is
// that there is nothing else to the edit.
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <vector>

static std::vector<std::string> grid = {
    "..........",
    ".#..#.....",
    "....#..#..",
    "..#.......",
    ".....#....",
    "..#....#..",
    "..........",
};
static int rows = static_cast<int>(grid.size());
static int cols = static_cast<int>(grid[0].size());

static std::array<std::int64_t, 2> calls{};

std::int64_t countPaths(int r, int c) {
    calls[0]++;
    if (r >= rows || c >= cols || grid[r][c] == '#') return 0;
    if (r == rows - 1 && c == cols - 1) return 1;
    return countPaths(r + 1, c) + countPaths(r, c + 1);
}

std::int64_t countPathsMemo(int r, int c, std::map<int, std::int64_t> &memo) {
    calls[1]++;
    if (r >= rows || c >= cols || grid[r][c] == '#') return 0;
    int key = r * 100 + c;              // 1. name the subproblem
    auto it = memo.find(key);           // 2. answer from the memo if it is there
    if (it != memo.end()) return it->second;
    std::int64_t value;
    if (r == rows - 1 && c == cols - 1) {
        value = 1;
    } else {
        value = countPathsMemo(r + 1, c, memo) + countPathsMemo(r, c + 1, memo);
    }
    memo[key] = value;                  // 3. record it before returning
    return value;                       // 4. and return the one variable
}

int main() {
    std::cout << "the grid, # for a blocked square:\\n";
    for (const std::string &row : grid) std::cout << "  " << row << "\\n";
    std::cout << "\\n";

    std::map<int, std::int64_t> memo;
    std::int64_t plain = countPaths(0, 0);
    std::int64_t cached = countPathsMemo(0, 0, memo);
    std::cout << "routes from the top left to the bottom right: " << plain << "\\n";
    std::cout << "the memoised version agrees: " << (plain == cached ? "yes" : "no") << "\\n";
    std::cout << "calls: " << calls[0] << " without the memo, " << calls[1] << " with it\\n";
    std::cout << "subproblems stored: " << memo.size() << ", out of " << rows * cols << " squares\\n\\n";

    // The same edit on empty square grids, so the two costs can be watched
    // growing apart. The recursion's cost tracks the number of routes; the
    // memo's tracks the number of squares, which is the entire idea.
    std::cout << std::right << std::setw(6) << "grid" << std::setw(12) << "routes"
              << std::setw(12) << "calls" << std::setw(12) << "memo calls"
              << std::setw(8) << "stored" << "\\n";
    for (int n = 2; n <= 12; n++) {
        grid.assign(n, std::string(n, '.'));
        rows = n;
        cols = n;
        calls[0] = 0;
        calls[1] = 0;
        memo.clear();
        std::int64_t routes = countPaths(0, 0);
        if (countPathsMemo(0, 0, memo) != routes) return 1;
        std::cout << std::setw(6) << (std::to_string(n) + "x" + std::to_string(n))
                  << std::setw(12) << routes << std::setw(12) << calls[0]
                  << std::setw(12) << calls[1] << std::setw(8) << memo.size() << "\\n";
    }
}
`,
            },
            {
              lang: "rust",
              code: `// The repair, in the smallest form it comes in. \`count_paths\` is the recursion
// anybody would write first. \`count_paths_memo\` is the same function with four
// lines added and nothing removed, and the point of putting them side by side is
// that there is nothing else to the edit.
use std::collections::HashMap;

struct Board {
    grid: Vec<String>,
    rows: usize,
    cols: usize,
}

fn blocked(b: &Board, r: usize, c: usize) -> bool {
    r >= b.rows || c >= b.cols || b.grid[r].as_bytes()[c] == b'#'
}

fn count_paths(b: &Board, r: usize, c: usize, calls: &mut [i64; 2]) -> i64 {
    calls[0] += 1;
    if blocked(b, r, c) {
        return 0;
    }
    if r == b.rows - 1 && c == b.cols - 1 {
        return 1;
    }
    count_paths(b, r + 1, c, calls) + count_paths(b, r, c + 1, calls)
}

fn count_paths_memo(
    b: &Board, r: usize, c: usize, memo: &mut HashMap<usize, i64>, calls: &mut [i64; 2],
) -> i64 {
    calls[1] += 1;
    if blocked(b, r, c) {
        return 0;
    }
    let key = r * 100 + c; // 1. name the subproblem
    if let Some(&v) = memo.get(&key) {
        return v; // 2. answer from the memo if it is there
    }
    let value = if r == b.rows - 1 && c == b.cols - 1 {
        1
    } else {
        count_paths_memo(b, r + 1, c, memo, calls) + count_paths_memo(b, r, c + 1, memo, calls)
    };
    memo.insert(key, value); // 3. record it before returning
    value // 4. and return the one variable
}

fn main() {
    let lines = [
        "..........",
        ".#..#.....",
        "....#..#..",
        "..#.......",
        ".....#....",
        "..#....#..",
        "..........",
    ];
    let mut board = Board {
        grid: lines.iter().map(|s| s.to_string()).collect(),
        rows: lines.len(),
        cols: lines[0].len(),
    };

    println!("the grid, # for a blocked square:");
    for row in &board.grid {
        println!("  {}", row);
    }
    println!();

    let mut calls = [0i64; 2];
    let mut memo: HashMap<usize, i64> = HashMap::new();
    let plain = count_paths(&board, 0, 0, &mut calls);
    let cached = count_paths_memo(&board, 0, 0, &mut memo, &mut calls);
    println!("routes from the top left to the bottom right: {}", plain);
    println!(
        "the memoised version agrees: {}",
        if plain == cached { "yes" } else { "no" }
    );
    println!("calls: {} without the memo, {} with it", calls[0], calls[1]);
    println!(
        "subproblems stored: {}, out of {} squares",
        memo.len(),
        board.rows * board.cols
    );
    println!();

    // The same edit on empty square grids, so the two costs can be watched
    // growing apart. The recursion's cost tracks the number of routes; the
    // memo's tracks the number of squares, which is the entire idea.
    println!("{:>6}{:>12}{:>12}{:>12}{:>8}", "grid", "routes", "calls", "memo calls", "stored");
    for n in 2..=12usize {
        board = Board { grid: vec![".".repeat(n); n], rows: n, cols: n };
        calls = [0i64; 2];
        memo = HashMap::new();
        let routes = count_paths(&board, 0, 0, &mut calls);
        assert_eq!(count_paths_memo(&board, 0, 0, &mut memo, &mut calls), routes);
        println!(
            "{:>6}{:>12}{:>12}{:>12}{:>8}",
            format!("{}x{}", n, n), routes, calls[0], calls[1], memo.len()
        );
    }
}
`,
            },
            {
              lang: "go",
              code: `// The repair, in the smallest form it comes in. \`countPaths\` is the recursion
// anybody would write first. \`countPathsMemo\` is the same function with four
// lines added and nothing removed, and the point of putting them side by side is
// that there is nothing else to the edit.
package main

import (
	"fmt"
	"strings"
)

var grid = []string{
	"..........",
	".#..#.....",
	"....#..#..",
	"..#.......",
	".....#....",
	"..#....#..",
	"..........",
}
var rows = len(grid)
var cols = len(grid[0])

var calls [2]int64

func countPaths(r, c int) int64 {
	calls[0]++
	if r >= rows || c >= cols || grid[r][c] == '#' {
		return 0
	}
	if r == rows-1 && c == cols-1 {
		return 1
	}
	return countPaths(r+1, c) + countPaths(r, c+1)
}

func countPathsMemo(r, c int, memo map[int]int64) int64 {
	calls[1]++
	if r >= rows || c >= cols || grid[r][c] == '#' {
		return 0
	}
	key := r*100 + c // 1. name the subproblem
	if v, ok := memo[key]; ok {
		return v // 2. answer from the memo if it is there
	}
	var value int64
	if r == rows-1 && c == cols-1 {
		value = 1
	} else {
		value = countPathsMemo(r+1, c, memo) + countPathsMemo(r, c+1, memo)
	}
	memo[key] = value // 3. record it before returning
	return value      // 4. and return the one variable
}

func main() {
	fmt.Println("the grid, # for a blocked square:")
	for _, row := range grid {
		fmt.Println("  " + row)
	}
	fmt.Println()

	memo := map[int]int64{}
	plain := countPaths(0, 0)
	cached := countPathsMemo(0, 0, memo)
	fmt.Printf("routes from the top left to the bottom right: %d\\n", plain)
	agrees := "no"
	if plain == cached {
		agrees = "yes"
	}
	fmt.Printf("the memoised version agrees: %s\\n", agrees)
	fmt.Printf("calls: %d without the memo, %d with it\\n", calls[0], calls[1])
	fmt.Printf("subproblems stored: %d, out of %d squares\\n", len(memo), rows*cols)
	fmt.Println()

	// The same edit on empty square grids, so the two costs can be watched
	// growing apart. The recursion's cost tracks the number of routes; the
	// memo's tracks the number of squares, which is the entire idea.
	fmt.Printf("%6s%12s%12s%12s%8s\\n", "grid", "routes", "calls", "memo calls", "stored")
	for n := 2; n <= 12; n++ {
		grid = make([]string, n)
		for i := 0; i < n; i++ {
			grid[i] = strings.Repeat(".", n)
		}
		rows = n
		cols = n
		calls[0] = 0
		calls[1] = 0
		memo = map[int]int64{}
		routes := countPaths(0, 0)
		if countPathsMemo(0, 0, memo) != routes {
			panic("disagreement")
		}
		fmt.Printf("%6s%12d%12d%12d%8d\\n", fmt.Sprintf("%dx%d", n, n), routes, calls[0], calls[1], len(memo))
	}
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "the-key-is-the-state",
      heading: "The key has to name everything the answer depends on",
      body: [
        "The edit has one precondition, and it is the whole of what can go wrong with it: **the key has to name every argument the answer depends on.** Not every argument \u2014 every argument the answer depends on.",
        "It is easy to say and easy to violate, because the arguments that matter are not always the ones that look important. In the knapsack recursion below, the answer to \"the best I can do from item `i` onwards\" plainly depends on `i`. It depends just as much on how much room is left, and that is the one people leave out, because `cap` reads like a running detail rather than part of the question.",
        "Leave it out and nothing announces itself. The program is faster than the correct one \u2014 11 calls instead of 41 \u2014 it terminates, it prints a number in the right range, and on small inputs it is often the right number. That combination is worse than a crash.",
        "On the five-item instance the broken key reports 230 against a true optimum of 120, and every one of the 32 subsets was checked to establish that 120 is right. Across twenty thousand random knapsacks the correct key is optimal on all twenty thousand and the broken one on 1,241 \u2014 about six per cent.",
        "The direction of the error is not random, and the reason is worth having. The recursion tries `skip` before `take`, so the first time it ever reaches item `i` it does so having taken nothing, with the full capacity still in hand. That roomy answer is what gets stored under the key `i`, and every later visit to item `i` \u2014 with less room, having packed things \u2014 reads it back. So the memo consistently reports the value of a knapsack bigger than the one you have: 18,759 overstatements and, out of twenty thousand trials, not a single understatement.",
        "That is the useful form of the check. A broken key does not add noise, it answers a *systematically different question*, and which question it answers is determined by whichever call happened to arrive first.",
      ],
      examples: [
        {
          id: "broken-key",
          title: "The same recursion, keyed two ways, scored against brute force",
          lang: "python",
          code: `# The edit has one precondition, and this is what it looks like when it is
# broken. The key has to name every argument the answer depends on. Leave one
# out and the memo starts answering a question it was never asked -- quickly,
# confidently, and wrongly.

WEIGHT = [3, 4, 5, 2, 6]
VALUE = [30, 50, 60, 20, 70]
CAPACITY = 10

calls = 0


def best(i, cap, memo, full_key):
    """The most value obtainable from items i onwards, within \`cap\`."""
    global calls
    calls += 1
    if i == len(WEIGHT):
        return 0
    # The only difference between a correct memo and a broken one.
    key = i * 1000 + cap if full_key else i
    if key in memo:
        return memo[key]
    skip = best(i + 1, cap, memo, full_key)
    take = 0
    if WEIGHT[i] <= cap:
        take = VALUE[i] + best(i + 1, cap - WEIGHT[i], memo, full_key)
    answer = skip if skip > take else take
    memo[key] = answer
    return answer


def brute_force(weights, values, cap):
    n = len(weights)
    top = 0
    for mask in range(1 << n):
        load = 0
        worth = 0
        for i in range(n):
            if mask >> i & 1:
                load += weights[i]
                worth += values[i]
        if load <= cap and worth > top:
            top = worth
    return top


print(f"{'item':<6}{'weight':>8}{'value':>8}")
for i in range(len(WEIGHT)):
    print(f"{chr(65 + i):<6}{WEIGHT[i]:>8}{VALUE[i]:>8}")
print(f"capacity {CAPACITY}")
print()

truth = brute_force(WEIGHT, VALUE, CAPACITY)
memo = {}
calls = 0
full = best(0, CAPACITY, memo, True)
full_calls, full_states = calls, len(memo)
memo = {}
calls = 0
broken = best(0, CAPACITY, memo, False)
broken_calls, broken_states = calls, len(memo)

print(f"{'every subset, checked':<28}{truth:>6}")
print(f"{'memo keyed on (item, cap)':<28}{full:>6}   {full_calls:>4} calls, {full_states} states")
print(f"{'memo keyed on item alone':<28}{broken:>6}   {broken_calls:>4} calls, {broken_states} states")
print()

# One instance proves nothing either way -- a broken memo is right a great deal
# of the time, which is exactly what makes it dangerous. Score both against the
# truth on a few thousand random knapsacks.
seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 20000
full_right = 0
broken_right = 0
over = 0
under = 0
worst_gap = 0
first_bad = None
for trial in range(TRIALS):
    n = 4 + rand(4)
    WEIGHT = [1 + rand(8) for _ in range(n)]
    VALUE = [10 * (1 + rand(9)) for _ in range(n)]
    CAPACITY = 5 + rand(12)
    truth = brute_force(WEIGHT, VALUE, CAPACITY)
    if best(0, CAPACITY, {}, True) == truth:
        full_right += 1
    answer = best(0, CAPACITY, {}, False)
    if answer == truth:
        broken_right += 1
    elif answer > truth:
        over += 1
        if answer - truth > worst_gap:
            worst_gap = answer - truth
        if first_bad is None:
            first_bad = (list(WEIGHT), list(VALUE), CAPACITY, truth, answer)
    else:
        under += 1

print(f"optimal on how many of {TRIALS} random knapsacks:")
print(f"  memo keyed on (item, cap)   {full_right:>7}")
print(f"  memo keyed on item alone    {broken_right:>7}")
print()
print("when the broken key is wrong, which way is it wrong:")
print(f"  claims more than any legal packing holds   {over:>7}")
print(f"  claims less                                {under:>7}")
print(f"  largest amount it invents                  {worst_gap:>7}")
print()

w, v, cap, truth, answer = first_bad
print("the first instance the broken key gets wrong:")
print(f"  weights  {w}")
print(f"  values   {v}")
print(f"  capacity {cap}, really {truth}, broken memo says {answer}")
`,
          output: `item    weight   value
A            3      30
B            4      50
C            5      60
D            2      20
E            6      70
capacity 10

every subset, checked          120
memo keyed on (item, cap)      120     41 calls, 24 states
memo keyed on item alone       230     11 calls, 5 states

optimal on how many of 20000 random knapsacks:
  memo keyed on (item, cap)     20000
  memo keyed on item alone       1241

when the broken key is wrong, which way is it wrong:
  claims more than any legal packing holds     18759
  claims less                                      0
  largest amount it invents                      430

the first instance the broken key gets wrong:
  weights  [7, 2, 4, 4, 4, 3]
  values   [40, 40, 10, 50, 60, 40]
  capacity 5, really 80, broken memo says 200`,
          explanation:
            "`full_key` is the only difference between the two runs, and it changes one expression. Every instance is also solved by checking all 2^n subsets, so the comparison is against the truth rather than against another algorithm. The last block reports not just how often the broken key is wrong but which way -- it overstates on all 18,759 of its errors and understates on none.",
          alternates: [
            {
              lang: "javascript",
              code: `// The edit has one precondition, and this is what it looks like when it is
// broken. The key has to name every argument the answer depends on. Leave one
// out and the memo starts answering a question it was never asked -- quickly,
// confidently, and wrongly.

let weight = [3, 4, 5, 2, 6];
let value = [30, 50, 60, 20, 70];
let capacity = 10;

let calls = 0;

/** The most value obtainable from items i onwards, within \`cap\`. */
function best(i, cap, memo, fullKey) {
  calls++;
  if (i === weight.length) return 0;
  // The only difference between a correct memo and a broken one.
  const key = fullKey ? i * 1000 + cap : i;
  const seen = memo.get(key);
  if (seen !== undefined) return seen;
  const skip = best(i + 1, cap, memo, fullKey);
  let take = 0;
  if (weight[i] <= cap) take = value[i] + best(i + 1, cap - weight[i], memo, fullKey);
  const answer = skip > take ? skip : take;
  memo.set(key, answer);
  return answer;
}

function bruteForce(weights, values, cap) {
  const n = weights.length;
  let top = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let load = 0;
    let worth = 0;
    for (let i = 0; i < n; i++) {
      if ((mask >> i) & 1) {
        load += weights[i];
        worth += values[i];
      }
    }
    if (load <= cap && worth > top) top = worth;
  }
  return top;
}

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const show = (values) => \`[\${values.join(", ")}]\`;
const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);

console.log(padEnd("item", 6) + pad("weight", 8) + pad("value", 8));
for (let i = 0; i < weight.length; i++) {
  console.log(padEnd(String.fromCharCode(65 + i), 6) + pad(weight[i], 8) + pad(value[i], 8));
}
console.log(\`capacity \${capacity}\`);
console.log();

let truth = bruteForce(weight, value, capacity);
let memo = new Map();
calls = 0;
const full = best(0, capacity, memo, true);
const fullCalls = calls;
const fullStates = memo.size;
memo = new Map();
calls = 0;
const broken = best(0, capacity, memo, false);
const brokenCalls = calls;
const brokenStates = memo.size;

console.log(padEnd("every subset, checked", 28) + pad(truth, 6));
console.log(padEnd("memo keyed on (item, cap)", 28) + pad(full, 6) + \`   \${pad(fullCalls, 4)} calls, \${fullStates} states\`);
console.log(padEnd("memo keyed on item alone", 28) + pad(broken, 6) + \`   \${pad(brokenCalls, 4)} calls, \${brokenStates} states\`);
console.log();

// One instance proves nothing either way -- a broken memo is right a great deal
// of the time, which is exactly what makes it dangerous. Score both against the
// truth on a few thousand random knapsacks.
const TRIALS = 20000;
let fullRight = 0;
let brokenRight = 0;
let over = 0;
let under = 0;
let worstGap = 0;
let firstBad = null;
for (let trial = 0; trial < TRIALS; trial++) {
  const n = 4 + rand(4);
  weight = Array.from({ length: n }, () => 1 + rand(8));
  value = Array.from({ length: n }, () => 10 * (1 + rand(9)));
  capacity = 5 + rand(12);
  truth = bruteForce(weight, value, capacity);
  if (best(0, capacity, new Map(), true) === truth) fullRight++;
  const answer = best(0, capacity, new Map(), false);
  if (answer === truth) {
    brokenRight++;
  } else if (answer > truth) {
    over++;
    if (answer - truth > worstGap) worstGap = answer - truth;
    if (firstBad === null) firstBad = [show(weight), show(value), capacity, truth, answer];
  } else {
    under++;
  }
}

console.log(\`optimal on how many of \${TRIALS} random knapsacks:\`);
console.log(\`  memo keyed on (item, cap)   \${pad(fullRight, 7)}\`);
console.log(\`  memo keyed on item alone    \${pad(brokenRight, 7)}\`);
console.log();
console.log("when the broken key is wrong, which way is it wrong:");
console.log(\`  claims more than any legal packing holds   \${pad(over, 7)}\`);
console.log(\`  claims less                                \${pad(under, 7)}\`);
console.log(\`  largest amount it invents                  \${pad(worstGap, 7)}\`);
console.log();

console.log("the first instance the broken key gets wrong:");
console.log(\`  weights  \${firstBad[0]}\`);
console.log(\`  values   \${firstBad[1]}\`);
console.log(\`  capacity \${firstBad[2]}, really \${firstBad[3]}, broken memo says \${firstBad[4]}\`);
`,
            },
            {
              lang: "typescript",
              code: `// The edit has one precondition, and this is what it looks like when it is
// broken. The key has to name every argument the answer depends on. Leave one
// out and the memo starts answering a question it was never asked -- quickly,
// confidently, and wrongly.

let weight = [3, 4, 5, 2, 6];
let value = [30, 50, 60, 20, 70];
let capacity = 10;

let calls = 0;

/** The most value obtainable from items i onwards, within \`cap\`. */
function best(i: number, cap: number, memo: Map<number, number>, fullKey: boolean): number {
  calls++;
  if (i === weight.length) return 0;
  // The only difference between a correct memo and a broken one.
  const key = fullKey ? i * 1000 + cap : i;
  const seen = memo.get(key);
  if (seen !== undefined) return seen;
  const skip = best(i + 1, cap, memo, fullKey);
  let take = 0;
  if (weight[i] <= cap) take = value[i] + best(i + 1, cap - weight[i], memo, fullKey);
  const answer = skip > take ? skip : take;
  memo.set(key, answer);
  return answer;
}

function bruteForce(weights: number[], values: number[], cap: number): number {
  const n = weights.length;
  let top = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let load = 0;
    let worth = 0;
    for (let i = 0; i < n; i++) {
      if ((mask >> i) & 1) {
        load += weights[i];
        worth += values[i];
      }
    }
    if (load <= cap && worth > top) top = worth;
  }
  return top;
}

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const show = (values: number[]): string => \`[\${values.join(", ")}]\`;
const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

console.log(padEnd("item", 6) + pad("weight", 8) + pad("value", 8));
for (let i = 0; i < weight.length; i++) {
  console.log(padEnd(String.fromCharCode(65 + i), 6) + pad(weight[i], 8) + pad(value[i], 8));
}
console.log(\`capacity \${capacity}\`);
console.log();

let truth = bruteForce(weight, value, capacity);
let memo = new Map();
calls = 0;
const full = best(0, capacity, memo, true);
const fullCalls = calls;
const fullStates = memo.size;
memo = new Map();
calls = 0;
const broken = best(0, capacity, memo, false);
const brokenCalls = calls;
const brokenStates = memo.size;

console.log(padEnd("every subset, checked", 28) + pad(truth, 6));
console.log(padEnd("memo keyed on (item, cap)", 28) + pad(full, 6) + \`   \${pad(fullCalls, 4)} calls, \${fullStates} states\`);
console.log(padEnd("memo keyed on item alone", 28) + pad(broken, 6) + \`   \${pad(brokenCalls, 4)} calls, \${brokenStates} states\`);
console.log();

// One instance proves nothing either way -- a broken memo is right a great deal
// of the time, which is exactly what makes it dangerous. Score both against the
// truth on a few thousand random knapsacks.
const TRIALS = 20000;
let fullRight = 0;
let brokenRight = 0;
let over = 0;
let under = 0;
let worstGap = 0;
let firstBad: [string, string, number, number, number] | null = null;
for (let trial = 0; trial < TRIALS; trial++) {
  const n = 4 + rand(4);
  weight = Array.from({ length: n }, () => 1 + rand(8));
  value = Array.from({ length: n }, () => 10 * (1 + rand(9)));
  capacity = 5 + rand(12);
  truth = bruteForce(weight, value, capacity);
  if (best(0, capacity, new Map(), true) === truth) fullRight++;
  const answer = best(0, capacity, new Map(), false);
  if (answer === truth) {
    brokenRight++;
  } else if (answer > truth) {
    over++;
    if (answer - truth > worstGap) worstGap = answer - truth;
    if (firstBad === null) firstBad = [show(weight), show(value), capacity, truth, answer];
  } else {
    under++;
  }
}

console.log(\`optimal on how many of \${TRIALS} random knapsacks:\`);
console.log(\`  memo keyed on (item, cap)   \${pad(fullRight, 7)}\`);
console.log(\`  memo keyed on item alone    \${pad(brokenRight, 7)}\`);
console.log();
console.log("when the broken key is wrong, which way is it wrong:");
console.log(\`  claims more than any legal packing holds   \${pad(over, 7)}\`);
console.log(\`  claims less                                \${pad(under, 7)}\`);
console.log(\`  largest amount it invents                  \${pad(worstGap, 7)}\`);
console.log();

console.log("the first instance the broken key gets wrong:");
const [badWeights, badValues, badCap, badTruth, badAnswer] = firstBad!;
console.log(\`  weights  \${badWeights}\`);
console.log(\`  values   \${badValues}\`);
console.log(\`  capacity \${badCap}, really \${badTruth}, broken memo says \${badAnswer}\`);
`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// The edit has one precondition, and this is what it looks like when it is
// broken. The key has to name every argument the answer depends on. Leave one
// out and the memo starts answering a question it was never asked -- quickly,
// confidently, and wrongly.
public class Main {
    static int[] weight = { 3, 4, 5, 2, 6 };
    static int[] value = { 30, 50, 60, 20, 70 };
    static int capacity = 10;

    static long calls = 0;

    /** The most value obtainable from items i onwards, within \`cap\`. */
    static int best(int i, int cap, Map<Integer, Integer> memo, boolean fullKey) {
        calls++;
        if (i == weight.length) return 0;
        // The only difference between a correct memo and a broken one.
        int key = fullKey ? i * 1000 + cap : i;
        if (memo.containsKey(key)) return memo.get(key);
        int skip = best(i + 1, cap, memo, fullKey);
        int take = 0;
        if (weight[i] <= cap) take = value[i] + best(i + 1, cap - weight[i], memo, fullKey);
        int answer = skip > take ? skip : take;
        memo.put(key, answer);
        return answer;
    }

    static int bruteForce(int[] weights, int[] values, int cap) {
        int n = weights.length;
        int top = 0;
        for (int mask = 0; mask < (1 << n); mask++) {
            int load = 0;
            int worth = 0;
            for (int i = 0; i < n; i++) {
                if ((mask >> i & 1) == 1) {
                    load += weights[i];
                    worth += values[i];
                }
            }
            if (load <= cap && worth > top) top = worth;
        }
        return top;
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
        System.out.printf("%-6s%8s%8s%n", "item", "weight", "value");
        for (int i = 0; i < weight.length; i++) {
            System.out.printf("%-6s%8d%8d%n", (char) ('A' + i), weight[i], value[i]);
        }
        System.out.printf("capacity %d%n", capacity);
        System.out.println();

        int truth = bruteForce(weight, value, capacity);
        Map<Integer, Integer> memo = new HashMap<>();
        calls = 0;
        int full = best(0, capacity, memo, true);
        long fullCalls = calls;
        int fullStates = memo.size();
        memo = new HashMap<>();
        calls = 0;
        int broken = best(0, capacity, memo, false);
        long brokenCalls = calls;
        int brokenStates = memo.size();

        System.out.printf("%-28s%6d%n", "every subset, checked", truth);
        System.out.printf("%-28s%6d   %4d calls, %d states%n", "memo keyed on (item, cap)", full, fullCalls, fullStates);
        System.out.printf("%-28s%6d   %4d calls, %d states%n", "memo keyed on item alone", broken, brokenCalls, brokenStates);
        System.out.println();

        // One instance proves nothing either way -- a broken memo is right a
        // great deal of the time, which is exactly what makes it dangerous.
        // Score both against the truth on a few thousand random knapsacks.
        final int TRIALS = 20000;
        int fullRight = 0;
        int brokenRight = 0;
        int over = 0;
        int under = 0;
        int worstGap = 0;
        List<Object> firstBad = null;
        for (int trial = 0; trial < TRIALS; trial++) {
            int n = 4 + rand(4);
            weight = new int[n];
            value = new int[n];
            for (int i = 0; i < n; i++) weight[i] = 1 + rand(8);
            for (int i = 0; i < n; i++) value[i] = 10 * (1 + rand(9));
            capacity = 5 + rand(12);
            truth = bruteForce(weight, value, capacity);
            if (best(0, capacity, new HashMap<>(), true) == truth) fullRight++;
            int answer = best(0, capacity, new HashMap<>(), false);
            if (answer == truth) {
                brokenRight++;
            } else if (answer > truth) {
                over++;
                if (answer - truth > worstGap) worstGap = answer - truth;
                if (firstBad == null) {
                    firstBad = new ArrayList<>();
                    firstBad.add(show(weight));
                    firstBad.add(show(value));
                    firstBad.add(capacity);
                    firstBad.add(truth);
                    firstBad.add(answer);
                }
            } else {
                under++;
            }
        }

        System.out.printf("optimal on how many of %d random knapsacks:%n", TRIALS);
        System.out.printf("  memo keyed on (item, cap)   %7d%n", fullRight);
        System.out.printf("  memo keyed on item alone    %7d%n", brokenRight);
        System.out.println();
        System.out.println("when the broken key is wrong, which way is it wrong:");
        System.out.printf("  claims more than any legal packing holds   %7d%n", over);
        System.out.printf("  claims less                                %7d%n", under);
        System.out.printf("  largest amount it invents                  %7d%n", worstGap);
        System.out.println();

        System.out.println("the first instance the broken key gets wrong:");
        System.out.printf("  weights  %s%n", firstBad.get(0));
        System.out.printf("  values   %s%n", firstBad.get(1));
        System.out.printf("  capacity %d, really %d, broken memo says %d%n",
            firstBad.get(2), firstBad.get(3), firstBad.get(4));
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The edit has one precondition, and this is what it looks like when it is
// broken. The key has to name every argument the answer depends on. Leave one
// out and the memo starts answering a question it was never asked -- quickly,
// confidently, and wrongly.
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <vector>

static std::vector<int> weight = {3, 4, 5, 2, 6};
static std::vector<int> value = {30, 50, 60, 20, 70};
static int capacity = 10;

static std::int64_t calls = 0;

// The most value obtainable from items i onwards, within \`cap\`.
int best(int i, int cap, std::map<int, int> &memo, bool fullKey) {
    calls++;
    if (i == static_cast<int>(weight.size())) return 0;
    // The only difference between a correct memo and a broken one.
    int key = fullKey ? i * 1000 + cap : i;
    auto it = memo.find(key);
    if (it != memo.end()) return it->second;
    int skip = best(i + 1, cap, memo, fullKey);
    int take = 0;
    if (weight[i] <= cap) take = value[i] + best(i + 1, cap - weight[i], memo, fullKey);
    int answer = skip > take ? skip : take;
    memo[key] = answer;
    return answer;
}

int bruteForce(const std::vector<int> &weights, const std::vector<int> &values, int cap) {
    int n = static_cast<int>(weights.size());
    int top = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        int load = 0, worth = 0;
        for (int i = 0; i < n; i++) {
            if (mask >> i & 1) {
                load += weights[i];
                worth += values[i];
            }
        }
        if (load <= cap && worth > top) top = worth;
    }
    return top;
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
    std::cout << std::left << std::setw(6) << "item" << std::right << std::setw(8) << "weight"
              << std::setw(8) << "value" << "\\n";
    for (size_t i = 0; i < weight.size(); i++) {
        std::cout << std::left << std::setw(6) << std::string(1, static_cast<char>('A' + i))
                  << std::right << std::setw(8) << weight[i] << std::setw(8) << value[i] << "\\n";
    }
    std::cout << "capacity " << capacity << "\\n\\n";

    int truth = bruteForce(weight, value, capacity);
    std::map<int, int> memo;
    calls = 0;
    int full = best(0, capacity, memo, true);
    std::int64_t fullCalls = calls;
    size_t fullStates = memo.size();
    memo.clear();
    calls = 0;
    int broken = best(0, capacity, memo, false);
    std::int64_t brokenCalls = calls;
    size_t brokenStates = memo.size();

    std::cout << std::left << std::setw(28) << "every subset, checked" << std::right << std::setw(6) << truth << "\\n";
    std::cout << std::left << std::setw(28) << "memo keyed on (item, cap)" << std::right << std::setw(6) << full
              << "   " << std::setw(4) << fullCalls << " calls, " << fullStates << " states\\n";
    std::cout << std::left << std::setw(28) << "memo keyed on item alone" << std::right << std::setw(6) << broken
              << "   " << std::setw(4) << brokenCalls << " calls, " << brokenStates << " states\\n\\n";

    // One instance proves nothing either way -- a broken memo is right a great
    // deal of the time, which is exactly what makes it dangerous. Score both
    // against the truth on a few thousand random knapsacks.
    const int TRIALS = 20000;
    int fullRight = 0, brokenRight = 0, over = 0, under = 0, worstGap = 0;
    bool haveBad = false;
    std::string badWeights, badValues;
    int badCap = 0, badTruth = 0, badAnswer = 0;
    for (int trial = 0; trial < TRIALS; trial++) {
        int n = 4 + rnd(4);
        weight.assign(n, 0);
        value.assign(n, 0);
        for (int i = 0; i < n; i++) weight[i] = 1 + rnd(8);
        for (int i = 0; i < n; i++) value[i] = 10 * (1 + rnd(9));
        capacity = 5 + rnd(12);
        truth = bruteForce(weight, value, capacity);
        std::map<int, int> a;
        if (best(0, capacity, a, true) == truth) fullRight++;
        std::map<int, int> b;
        int answer = best(0, capacity, b, false);
        if (answer == truth) {
            brokenRight++;
        } else if (answer > truth) {
            over++;
            if (answer - truth > worstGap) worstGap = answer - truth;
            if (!haveBad) {
                haveBad = true;
                badWeights = show(weight);
                badValues = show(value);
                badCap = capacity;
                badTruth = truth;
                badAnswer = answer;
            }
        } else {
            under++;
        }
    }

    std::cout << "optimal on how many of " << TRIALS << " random knapsacks:\\n";
    std::cout << "  memo keyed on (item, cap)   " << std::setw(7) << fullRight << "\\n";
    std::cout << "  memo keyed on item alone    " << std::setw(7) << brokenRight << "\\n\\n";
    std::cout << "when the broken key is wrong, which way is it wrong:\\n";
    std::cout << "  claims more than any legal packing holds   " << std::setw(7) << over << "\\n";
    std::cout << "  claims less                                " << std::setw(7) << under << "\\n";
    std::cout << "  largest amount it invents                  " << std::setw(7) << worstGap << "\\n\\n";

    std::cout << "the first instance the broken key gets wrong:\\n";
    std::cout << "  weights  " << badWeights << "\\n";
    std::cout << "  values   " << badValues << "\\n";
    std::cout << "  capacity " << badCap << ", really " << badTruth << ", broken memo says " << badAnswer << "\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// The edit has one precondition, and this is what it looks like when it is
// broken. The key has to name every argument the answer depends on. Leave one
// out and the memo starts answering a question it was never asked -- quickly,
// confidently, and wrongly.
use std::collections::HashMap;

struct Knapsack {
    weight: Vec<i32>,
    value: Vec<i32>,
    capacity: i32,
}

/// The most value obtainable from items i onwards, within \`cap\`.
fn best(
    k: &Knapsack, i: usize, cap: i32, memo: &mut HashMap<i32, i32>, full_key: bool,
    calls: &mut i64,
) -> i32 {
    *calls += 1;
    if i == k.weight.len() {
        return 0;
    }
    // The only difference between a correct memo and a broken one.
    let key = if full_key { i as i32 * 1000 + cap } else { i as i32 };
    if let Some(&v) = memo.get(&key) {
        return v;
    }
    let skip = best(k, i + 1, cap, memo, full_key, calls);
    let mut take = 0;
    if k.weight[i] <= cap {
        take = k.value[i] + best(k, i + 1, cap - k.weight[i], memo, full_key, calls);
    }
    let answer = if skip > take { skip } else { take };
    memo.insert(key, answer);
    answer
}

fn brute_force(weights: &[i32], values: &[i32], cap: i32) -> i32 {
    let n = weights.len();
    let mut top = 0;
    for mask in 0..(1usize << n) {
        let mut load = 0;
        let mut worth = 0;
        for i in 0..n {
            if mask >> i & 1 == 1 {
                load += weights[i];
                worth += values[i];
            }
        }
        if load <= cap && worth > top {
            top = worth;
        }
    }
    top
}

fn rand(seed: &mut i64, n: i64) -> i32 {
    *seed = (*seed * 1103515245 + 12345) % 2147483648;
    (*seed / 65536 % n) as i32
}

fn show(values: &[i32]) -> String {
    format!("[{}]", values.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(", "))
}

fn main() {
    let mut k = Knapsack {
        weight: vec![3, 4, 5, 2, 6],
        value: vec![30, 50, 60, 20, 70],
        capacity: 10,
    };

    println!("{:<6}{:>8}{:>8}", "item", "weight", "value");
    for i in 0..k.weight.len() {
        println!("{:<6}{:>8}{:>8}", (b'A' + i as u8) as char, k.weight[i], k.value[i]);
    }
    println!("capacity {}", k.capacity);
    println!();

    let mut truth = brute_force(&k.weight, &k.value, k.capacity);
    let mut calls = 0i64;
    let mut memo: HashMap<i32, i32> = HashMap::new();
    let full = best(&k, 0, k.capacity, &mut memo, true, &mut calls);
    let (full_calls, full_states) = (calls, memo.len());
    calls = 0;
    memo = HashMap::new();
    let broken = best(&k, 0, k.capacity, &mut memo, false, &mut calls);
    let (broken_calls, broken_states) = (calls, memo.len());

    println!("{:<28}{:>6}", "every subset, checked", truth);
    println!("{:<28}{:>6}   {:>4} calls, {} states", "memo keyed on (item, cap)", full, full_calls, full_states);
    println!("{:<28}{:>6}   {:>4} calls, {} states", "memo keyed on item alone", broken, broken_calls, broken_states);
    println!();

    // One instance proves nothing either way -- a broken memo is right a great
    // deal of the time, which is exactly what makes it dangerous. Score both
    // against the truth on a few thousand random knapsacks.
    const TRIALS: i32 = 20000;
    let mut seed = 1i64;
    let (mut full_right, mut broken_right) = (0, 0);
    let (mut over, mut under, mut worst_gap) = (0, 0, 0);
    let mut bad: Option<(String, String, i32, i32, i32)> = None;
    for _ in 0..TRIALS {
        let n = 4 + rand(&mut seed, 4);
        k.weight = (0..n).map(|_| 1 + rand(&mut seed, 8)).collect();
        k.value = (0..n).map(|_| 10 * (1 + rand(&mut seed, 9))).collect();
        k.capacity = 5 + rand(&mut seed, 12);
        truth = brute_force(&k.weight, &k.value, k.capacity);
        let mut a: HashMap<i32, i32> = HashMap::new();
        if best(&k, 0, k.capacity, &mut a, true, &mut calls) == truth {
            full_right += 1;
        }
        let mut b: HashMap<i32, i32> = HashMap::new();
        let answer = best(&k, 0, k.capacity, &mut b, false, &mut calls);
        if answer == truth {
            broken_right += 1;
        } else if answer > truth {
            over += 1;
            if answer - truth > worst_gap {
                worst_gap = answer - truth;
            }
            if bad.is_none() {
                bad = Some((show(&k.weight), show(&k.value), k.capacity, truth, answer));
            }
        } else {
            under += 1;
        }
    }

    println!("optimal on how many of {} random knapsacks:", TRIALS);
    println!("  memo keyed on (item, cap)   {:>7}", full_right);
    println!("  memo keyed on item alone    {:>7}", broken_right);
    println!();
    println!("when the broken key is wrong, which way is it wrong:");
    println!("  claims more than any legal packing holds   {:>7}", over);
    println!("  claims less                                {:>7}", under);
    println!("  largest amount it invents                  {:>7}", worst_gap);
    println!();

    let (bad_weights, bad_values, bad_cap, bad_truth, bad_answer) = bad.unwrap();
    println!("the first instance the broken key gets wrong:");
    println!("  weights  {}", bad_weights);
    println!("  values   {}", bad_values);
    println!("  capacity {}, really {}, broken memo says {}", bad_cap, bad_truth, bad_answer);
}
`,
            },
            {
              lang: "go",
              code: `// The edit has one precondition, and this is what it looks like when it is
// broken. The key has to name every argument the answer depends on. Leave one
// out and the memo starts answering a question it was never asked -- quickly,
// confidently, and wrongly.
package main

import (
	"fmt"
	"strings"
)

var weight = []int{3, 4, 5, 2, 6}
var value = []int{30, 50, 60, 20, 70}
var capacity = 10

var calls int64

// The most value obtainable from items i onwards, within \`cap\`.
func best(i, cap int, memo map[int]int, fullKey bool) int {
	calls++
	if i == len(weight) {
		return 0
	}
	// The only difference between a correct memo and a broken one.
	key := i
	if fullKey {
		key = i*1000 + cap
	}
	if v, ok := memo[key]; ok {
		return v
	}
	skip := best(i+1, cap, memo, fullKey)
	take := 0
	if weight[i] <= cap {
		take = value[i] + best(i+1, cap-weight[i], memo, fullKey)
	}
	answer := skip
	if take > answer {
		answer = take
	}
	memo[key] = answer
	return answer
}

func bruteForce(weights, values []int, cap int) int {
	n := len(weights)
	top := 0
	for mask := 0; mask < 1<<n; mask++ {
		load, worth := 0, 0
		for i := 0; i < n; i++ {
			if mask>>i&1 == 1 {
				load += weights[i]
				worth += values[i]
			}
		}
		if load <= cap && worth > top {
			top = worth
		}
	}
	return top
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func show(values []int) string {
	parts := make([]string, len(values))
	for i, v := range values {
		parts[i] = fmt.Sprintf("%d", v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func main() {
	fmt.Printf("%-6s%8s%8s\\n", "item", "weight", "value")
	for i := range weight {
		fmt.Printf("%-6s%8d%8d\\n", string(rune('A'+i)), weight[i], value[i])
	}
	fmt.Printf("capacity %d\\n", capacity)
	fmt.Println()

	truth := bruteForce(weight, value, capacity)
	memo := map[int]int{}
	calls = 0
	full := best(0, capacity, memo, true)
	fullCalls, fullStates := calls, len(memo)
	memo = map[int]int{}
	calls = 0
	broken := best(0, capacity, memo, false)
	brokenCalls, brokenStates := calls, len(memo)

	fmt.Printf("%-28s%6d\\n", "every subset, checked", truth)
	fmt.Printf("%-28s%6d   %4d calls, %d states\\n", "memo keyed on (item, cap)", full, fullCalls, fullStates)
	fmt.Printf("%-28s%6d   %4d calls, %d states\\n", "memo keyed on item alone", broken, brokenCalls, brokenStates)
	fmt.Println()

	// One instance proves nothing either way -- a broken memo is right a great
	// deal of the time, which is exactly what makes it dangerous. Score both
	// against the truth on a few thousand random knapsacks.
	const TRIALS = 20000
	fullRight, brokenRight := 0, 0
	over, under, worstGap := 0, 0, 0
	var firstBad []string
	var firstNums []int
	for trial := 0; trial < TRIALS; trial++ {
		n := 4 + rand(4)
		weight = make([]int, n)
		value = make([]int, n)
		for i := 0; i < n; i++ {
			weight[i] = 1 + rand(8)
		}
		for i := 0; i < n; i++ {
			value[i] = 10 * (1 + rand(9))
		}
		capacity = 5 + rand(12)
		truth = bruteForce(weight, value, capacity)
		if best(0, capacity, map[int]int{}, true) == truth {
			fullRight++
		}
		answer := best(0, capacity, map[int]int{}, false)
		if answer == truth {
			brokenRight++
		} else if answer > truth {
			over++
			if answer-truth > worstGap {
				worstGap = answer - truth
			}
			if firstBad == nil {
				firstBad = []string{show(weight), show(value)}
				firstNums = []int{capacity, truth, answer}
			}
		} else {
			under++
		}
	}

	fmt.Printf("optimal on how many of %d random knapsacks:\\n", TRIALS)
	fmt.Printf("  memo keyed on (item, cap)   %7d\\n", fullRight)
	fmt.Printf("  memo keyed on item alone    %7d\\n", brokenRight)
	fmt.Println()
	fmt.Println("when the broken key is wrong, which way is it wrong:")
	fmt.Printf("  claims more than any legal packing holds   %7d\\n", over)
	fmt.Printf("  claims less                                %7d\\n", under)
	fmt.Printf("  largest amount it invents                  %7d\\n", worstGap)
	fmt.Println()

	fmt.Println("the first instance the broken key gets wrong:")
	fmt.Printf("  weights  %s\\n", firstBad[0])
	fmt.Printf("  values   %s\\n", firstBad[1])
	fmt.Printf("  capacity %d, really %d, broken memo says %d\\n", firstNums[0], firstNums[1], firstNums[2])
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "dp-knapsack-table",
        kind: "dp",
        algorithm: "knapsack",
        title: "The two arguments the key needs, drawn as a grid",
        lockAlgorithm: true,
      },
      pitfalls: [
        {
          title: "A broken key is faster, not slower",
          body: "The instinct that a wrong answer will look wrong does not apply here. The broken memo makes 11 calls where the correct one makes 41, because a key that collapses many states into one produces a smaller table and more hits. Speed is evidence of nothing; the only check is a comparison against a brute force you trust, on inputs small enough to run it.",
        },
        {
          title: "It is right often enough to pass your own testing",
          body: "Six per cent of random knapsacks here, and a much higher share of the tiny hand-written cases people actually try, because with few items and generous capacity the roomy first answer is often the right one anyway. Random testing against brute force on small inputs is the cheapest habit in this module and it catches essentially all of this.",
        },
        {
          title: "Arrays and constants are not part of the state",
          body: "The other direction on the same point: the item list, the coin denominations and the input string do not vary between calls, so they never belong in the key. Only the arguments that change from one call to the next do. Getting this backwards -- hashing the whole array into the key -- gives a correct program whose memo never hits, which is section 3's failure by another route.",
        },
      ],
    },
    {
      id: "and-nothing-else",
      heading: "And nothing the answer does not depend on",
      body: [
        "The opposite mistake produces a program that is never wrong, which is why it survives code review and then quietly costs you the problem.",
        "Here the same knapsack is written the way people often write it first, carrying a running total: `carried(i, cap, sofar)` returns the value of the best complete packing *given that `sofar` is already banked*. It is a perfectly correct recursion. Memoise it honestly, with all three arguments in the key, and it stays correct \u2014 and the state space is now multiplied by the number of distinct running totals that can reach each square.",
        "The tempting repair is to leave `sofar` out of the key while still passing it, which is section 2's bug wearing a different hat. The actual repair is neither: change what the function returns.",
        "Read the three rows as one argument. Carrying the total and keying honestly is correct at 651 states. Carrying the total and keying on `(item, cap)` costs 187 states and is wrong \u2014 205 instead of 235 here, and optimal on 9,360 of 20,000. Returning the value from here on costs *the same* 187 states, makes exactly the same 305 calls with the same 118 hits, and is optimal on all 20,000.",
        "So the accumulator was never a trade-off between speed and correctness. The third row is strictly better than the second and strictly cheaper than the first. `sofar` was simply the wrong thing to have in the function at all.",
        "The rule that falls out of this is the most useful sentence in the module: **a state should describe what is left to decide, not what has already been decided.** `i` and `cap` describe what remains \u2014 which items are still on offer, how much room is left. `sofar` describes history. History belongs to the caller, and an accumulator in the signature is nearly always a sign that the return value has been defined wrongly.",
        "Notice that the two failures are the same failure. In section 2 the key was smaller than the state the answer actually depended on. Here the state was larger than the answer actually needed. The key has to *equal* the state, and getting it wrong in either direction has a cost \u2014 one of them in correctness and the other in the size of the table.",
      ],
      examples: [
        {
          id: "accumulator-in-the-state",
          title: "An accumulator in the state, and the rewrite that removes it",
          lang: "python",
          code: `# Lesson 2's other failure, and the more interesting one, because the program is
# never wrong. An argument that only records where you came from belongs in
# neither the key nor the signature, and the giveaway is that the function is
# returning the wrong thing.

WEIGHT = [3, 4, 5, 2, 6, 4, 7, 3, 5, 2, 6, 4]
VALUE = [30, 50, 60, 20, 70, 40, 80, 25, 55, 15, 65, 45]
CAPACITY = 20

calls = 0
hits = 0


def carried(i, cap, sofar, memo, full_key):
    """Best TOTAL value of a complete packing, given \`sofar\` already banked."""
    global calls, hits
    calls += 1
    key = (i * 1000 + cap) * 10000 + sofar if full_key else i * 1000 + cap
    if key in memo:
        hits += 1
        return memo[key]
    if i == len(WEIGHT):
        answer = sofar
    else:
        answer = carried(i + 1, cap, sofar, memo, full_key)
        if WEIGHT[i] <= cap:
            take = carried(i + 1, cap - WEIGHT[i], sofar + VALUE[i], memo, full_key)
            if take > answer:
                answer = take
    memo[key] = answer
    return answer


def from_here(i, cap, memo):
    """Best value obtainable from items i onwards. No accumulator, same answer."""
    global calls, hits
    calls += 1
    key = i * 1000 + cap
    if key in memo:
        hits += 1
        return memo[key]
    if i == len(WEIGHT):
        answer = 0
    else:
        answer = from_here(i + 1, cap, memo)
        if WEIGHT[i] <= cap:
            take = VALUE[i] + from_here(i + 1, cap - WEIGHT[i], memo)
            if take > answer:
                answer = take
    memo[key] = answer
    return answer


def measure(label, run):
    global calls, hits
    calls = 0
    hits = 0
    memo = {}
    answer = run(memo)
    return (label, answer, calls, hits, len(memo))


rows = [
    measure("carries the total, keys on all three", lambda m: carried(0, CAPACITY, 0, m, True)),
    measure("carries the total, keys on (item, cap)", lambda m: carried(0, CAPACITY, 0, m, False)),
    measure("returns the value from here on", lambda m: from_here(0, CAPACITY, m)),
]

print(f"{len(WEIGHT)} items, capacity {CAPACITY}")
print()
print(f"{'formulation':<40}{'answer':>8}{'calls':>9}{'hits':>8}{'states':>8}")
for label, answer, c, h, states in rows:
    print(f"{label:<40}{answer:>8}{c:>9}{h:>8}{states:>8}")
print()


def brute_force(weights, values, cap):
    n = len(weights)
    top = 0
    for mask in range(1 << n):
        load = 0
        worth = 0
        for i in range(n):
            if mask >> i & 1:
                load += weights[i]
                worth += values[i]
        if load <= cap and worth > top:
            top = worth
    return top


print(f"every one of the {1 << len(WEIGHT)} subsets agrees the best is {brute_force(WEIGHT, VALUE, CAPACITY)}")
print()

# The middle row is right on this instance, which is the whole problem with it.
seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 20000
right = [0, 0, 0]
for _ in range(TRIALS):
    n = 4 + rand(4)
    WEIGHT = [1 + rand(8) for _ in range(n)]
    VALUE = [10 * (1 + rand(9)) for _ in range(n)]
    CAPACITY = 5 + rand(12)
    truth = brute_force(WEIGHT, VALUE, CAPACITY)
    if carried(0, CAPACITY, 0, {}, True) == truth:
        right[0] += 1
    if carried(0, CAPACITY, 0, {}, False) == truth:
        right[1] += 1
    if from_here(0, CAPACITY, {}) == truth:
        right[2] += 1

print(f"optimal on how many of {TRIALS} random knapsacks:")
for i, (label, _, _, _, _) in enumerate(rows):
    print(f"  {label:<40}{right[i]:>7}")
`,
          output: `12 items, capacity 20

formulation                               answer    calls    hits  states
carries the total, keys on all three         235      921     270     651
carries the total, keys on (item, cap)       205      305     118     187
returns the value from here on               235      305     118     187

every one of the 4096 subsets agrees the best is 235

optimal on how many of 20000 random knapsacks:
  carries the total, keys on all three      20000
  carries the total, keys on (item, cap)     9360
  returns the value from here on            20000`,
          explanation:
            "Three formulations of one knapsack, measured together. The first two differ only in the key; the third differs in what the function returns. The middle row is the interesting one, because it is right on the twelve-item instance printed above and wrong on more than half of twenty thousand random ones.",
          alternates: [
            {
              lang: "javascript",
              code: `// Lesson 2's other failure, and the more interesting one, because the program is
// never wrong. An argument that only records where you came from belongs in
// neither the key nor the signature, and the giveaway is that the function is
// returning the wrong thing.

let weight = [3, 4, 5, 2, 6, 4, 7, 3, 5, 2, 6, 4];
let value = [30, 50, 60, 20, 70, 40, 80, 25, 55, 15, 65, 45];
let capacity = 20;

const stats = { calls: 0, hits: 0 };

/** Best TOTAL value of a complete packing, given \`sofar\` already banked. */
function carried(i, cap, sofar, memo, fullKey) {
  stats.calls++;
  const base = i * 1000 + cap;
  const key = fullKey ? base * 10000 + sofar : base;
  const seen = memo.get(key);
  if (seen !== undefined) {
    stats.hits++;
    return seen;
  }
  let answer;
  if (i === weight.length) {
    answer = sofar;
  } else {
    answer = carried(i + 1, cap, sofar, memo, fullKey);
    if (weight[i] <= cap) {
      const take = carried(i + 1, cap - weight[i], sofar + value[i], memo, fullKey);
      if (take > answer) answer = take;
    }
  }
  memo.set(key, answer);
  return answer;
}

/** Best value obtainable from items i onwards. No accumulator, same answer. */
function fromHere(i, cap, memo) {
  stats.calls++;
  const key = i * 1000 + cap;
  const seen = memo.get(key);
  if (seen !== undefined) {
    stats.hits++;
    return seen;
  }
  let answer;
  if (i === weight.length) {
    answer = 0;
  } else {
    answer = fromHere(i + 1, cap, memo);
    if (weight[i] <= cap) {
      const take = value[i] + fromHere(i + 1, cap - weight[i], memo);
      if (take > answer) answer = take;
    }
  }
  memo.set(key, answer);
  return answer;
}

const LABELS = [
  "carries the total, keys on all three",
  "carries the total, keys on (item, cap)",
  "returns the value from here on",
];

function run(which, memo) {
  if (which === 0) return carried(0, capacity, 0, memo, true);
  if (which === 1) return carried(0, capacity, 0, memo, false);
  return fromHere(0, capacity, memo);
}

function bruteForce(weights, values, cap) {
  const n = weights.length;
  let top = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let load = 0;
    let worth = 0;
    for (let i = 0; i < n; i++) {
      if ((mask >> i) & 1) {
        load += weights[i];
        worth += values[i];
      }
    }
    if (load <= cap && worth > top) top = worth;
  }
  return top;
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

console.log(\`\${weight.length} items, capacity \${capacity}\`);
console.log();
console.log(padEnd("formulation", 40) + pad("answer", 8) + pad("calls", 9) + pad("hits", 8) + pad("states", 8));
for (let r = 0; r < 3; r++) {
  stats.calls = 0;
  stats.hits = 0;
  const memo = new Map();
  const answer = run(r, memo);
  console.log(
    padEnd(LABELS[r], 40) + pad(answer, 8) + pad(stats.calls, 9) + pad(stats.hits, 8) + pad(memo.size, 8)
  );
}
console.log();

console.log(\`every one of the \${1 << weight.length} subsets agrees the best is \${bruteForce(weight, value, capacity)}\`);
console.log();

// The middle row is right on this instance, which is the whole problem with it.
const TRIALS = 20000;
const right = [0, 0, 0];
for (let trial = 0; trial < TRIALS; trial++) {
  const n = 4 + rand(4);
  weight = Array.from({ length: n }, () => 1 + rand(8));
  value = Array.from({ length: n }, () => 10 * (1 + rand(9)));
  capacity = 5 + rand(12);
  const truth = bruteForce(weight, value, capacity);
  for (let r = 0; r < 3; r++) {
    if (run(r, new Map()) === truth) right[r]++;
  }
}

console.log(\`optimal on how many of \${TRIALS} random knapsacks:\`);
for (let r = 0; r < 3; r++) {
  console.log(\`  \${padEnd(LABELS[r], 40)}\${pad(right[r], 7)}\`);
}
`,
            },
            {
              lang: "typescript",
              code: `// Lesson 2's other failure, and the more interesting one, because the program is
// never wrong. An argument that only records where you came from belongs in
// neither the key nor the signature, and the giveaway is that the function is
// returning the wrong thing.

let weight = [3, 4, 5, 2, 6, 4, 7, 3, 5, 2, 6, 4];
let value = [30, 50, 60, 20, 70, 40, 80, 25, 55, 15, 65, 45];
let capacity = 20;

const stats = { calls: 0, hits: 0 };

/** Best TOTAL value of a complete packing, given \`sofar\` already banked. */
function carried(i: number, cap: number, sofar: number, memo: Map<number, number>, fullKey: boolean): number {
  stats.calls++;
  const base = i * 1000 + cap;
  const key = fullKey ? base * 10000 + sofar : base;
  const seen = memo.get(key);
  if (seen !== undefined) {
    stats.hits++;
    return seen;
  }
  let answer: number;
  if (i === weight.length) {
    answer = sofar;
  } else {
    answer = carried(i + 1, cap, sofar, memo, fullKey);
    if (weight[i] <= cap) {
      const take = carried(i + 1, cap - weight[i], sofar + value[i], memo, fullKey);
      if (take > answer) answer = take;
    }
  }
  memo.set(key, answer);
  return answer;
}

/** Best value obtainable from items i onwards. No accumulator, same answer. */
function fromHere(i: number, cap: number, memo: Map<number, number>): number {
  stats.calls++;
  const key = i * 1000 + cap;
  const seen = memo.get(key);
  if (seen !== undefined) {
    stats.hits++;
    return seen;
  }
  let answer: number;
  if (i === weight.length) {
    answer = 0;
  } else {
    answer = fromHere(i + 1, cap, memo);
    if (weight[i] <= cap) {
      const take = value[i] + fromHere(i + 1, cap - weight[i], memo);
      if (take > answer) answer = take;
    }
  }
  memo.set(key, answer);
  return answer;
}

const LABELS = [
  "carries the total, keys on all three",
  "carries the total, keys on (item, cap)",
  "returns the value from here on",
];

function run(which: number, memo: Map<number, number>): number {
  if (which === 0) return carried(0, capacity, 0, memo, true);
  if (which === 1) return carried(0, capacity, 0, memo, false);
  return fromHere(0, capacity, memo);
}

function bruteForce(weights: number[], values: number[], cap: number): number {
  const n = weights.length;
  let top = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let load = 0;
    let worth = 0;
    for (let i = 0; i < n; i++) {
      if ((mask >> i) & 1) {
        load += weights[i];
        worth += values[i];
      }
    }
    if (load <= cap && worth > top) top = worth;
  }
  return top;
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

console.log(\`\${weight.length} items, capacity \${capacity}\`);
console.log();
console.log(padEnd("formulation", 40) + pad("answer", 8) + pad("calls", 9) + pad("hits", 8) + pad("states", 8));
for (let r = 0; r < 3; r++) {
  stats.calls = 0;
  stats.hits = 0;
  const memo = new Map();
  const answer = run(r, memo);
  console.log(
    padEnd(LABELS[r], 40) + pad(answer, 8) + pad(stats.calls, 9) + pad(stats.hits, 8) + pad(memo.size, 8)
  );
}
console.log();

console.log(\`every one of the \${1 << weight.length} subsets agrees the best is \${bruteForce(weight, value, capacity)}\`);
console.log();

// The middle row is right on this instance, which is the whole problem with it.
const TRIALS = 20000;
const right = [0, 0, 0];
for (let trial = 0; trial < TRIALS; trial++) {
  const n = 4 + rand(4);
  weight = Array.from({ length: n }, () => 1 + rand(8));
  value = Array.from({ length: n }, () => 10 * (1 + rand(9)));
  capacity = 5 + rand(12);
  const truth = bruteForce(weight, value, capacity);
  for (let r = 0; r < 3; r++) {
    if (run(r, new Map()) === truth) right[r]++;
  }
}

console.log(\`optimal on how many of \${TRIALS} random knapsacks:\`);
for (let r = 0; r < 3; r++) {
  console.log(\`  \${padEnd(LABELS[r], 40)}\${pad(right[r], 7)}\`);
}
`,
            },
            {
              lang: "java",
              code: `import java.util.HashMap;
import java.util.Map;

// Lesson 2's other failure, and the more interesting one, because the program is
// never wrong. An argument that only records where you came from belongs in
// neither the key nor the signature, and the giveaway is that the function is
// returning the wrong thing.
public class Main {
    static int[] weight = { 3, 4, 5, 2, 6, 4, 7, 3, 5, 2, 6, 4 };
    static int[] value = { 30, 50, 60, 20, 70, 40, 80, 25, 55, 15, 65, 45 };
    static int capacity = 20;

    static long calls = 0;
    static long hits = 0;

    /** Best TOTAL value of a complete packing, given \`sofar\` already banked. */
    static int carried(int i, int cap, int sofar, Map<Integer, Integer> memo, boolean fullKey) {
        calls++;
        int key = fullKey ? (i * 1000 + cap) * 10000 + sofar : i * 1000 + cap;
        if (memo.containsKey(key)) {
            hits++;
            return memo.get(key);
        }
        int answer;
        if (i == weight.length) {
            answer = sofar;
        } else {
            answer = carried(i + 1, cap, sofar, memo, fullKey);
            if (weight[i] <= cap) {
                int take = carried(i + 1, cap - weight[i], sofar + value[i], memo, fullKey);
                if (take > answer) answer = take;
            }
        }
        memo.put(key, answer);
        return answer;
    }

    /** Best value obtainable from items i onwards. No accumulator, same answer. */
    static int fromHere(int i, int cap, Map<Integer, Integer> memo) {
        calls++;
        int key = i * 1000 + cap;
        if (memo.containsKey(key)) {
            hits++;
            return memo.get(key);
        }
        int answer;
        if (i == weight.length) {
            answer = 0;
        } else {
            answer = fromHere(i + 1, cap, memo);
            if (weight[i] <= cap) {
                int take = value[i] + fromHere(i + 1, cap - weight[i], memo);
                if (take > answer) answer = take;
            }
        }
        memo.put(key, answer);
        return answer;
    }

    static final String[] LABELS = {
        "carries the total, keys on all three",
        "carries the total, keys on (item, cap)",
        "returns the value from here on",
    };

    static int run(int which, Map<Integer, Integer> memo) {
        if (which == 0) return carried(0, capacity, 0, memo, true);
        if (which == 1) return carried(0, capacity, 0, memo, false);
        return fromHere(0, capacity, memo);
    }

    static int bruteForce(int[] weights, int[] values, int cap) {
        int n = weights.length;
        int top = 0;
        for (int mask = 0; mask < (1 << n); mask++) {
            int load = 0;
            int worth = 0;
            for (int i = 0; i < n; i++) {
                if ((mask >> i & 1) == 1) {
                    load += weights[i];
                    worth += values[i];
                }
            }
            if (load <= cap && worth > top) top = worth;
        }
        return top;
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        System.out.printf("%d items, capacity %d%n", weight.length, capacity);
        System.out.println();
        System.out.printf("%-40s%8s%9s%8s%8s%n", "formulation", "answer", "calls", "hits", "states");
        for (int r = 0; r < 3; r++) {
            calls = 0;
            hits = 0;
            Map<Integer, Integer> memo = new HashMap<>();
            int answer = run(r, memo);
            System.out.printf("%-40s%8d%9d%8d%8d%n", LABELS[r], answer, calls, hits, memo.size());
        }
        System.out.println();

        System.out.printf("every one of the %d subsets agrees the best is %d%n",
            1 << weight.length, bruteForce(weight, value, capacity));
        System.out.println();

        // The middle row is right on this instance, which is the whole problem
        // with it.
        final int TRIALS = 20000;
        int[] right = new int[3];
        for (int trial = 0; trial < TRIALS; trial++) {
            int n = 4 + rand(4);
            weight = new int[n];
            value = new int[n];
            for (int i = 0; i < n; i++) weight[i] = 1 + rand(8);
            for (int i = 0; i < n; i++) value[i] = 10 * (1 + rand(9));
            capacity = 5 + rand(12);
            int truth = bruteForce(weight, value, capacity);
            for (int r = 0; r < 3; r++) {
                if (run(r, new HashMap<>()) == truth) right[r]++;
            }
        }

        System.out.printf("optimal on how many of %d random knapsacks:%n", TRIALS);
        for (int r = 0; r < 3; r++) {
            System.out.printf("  %-40s%7d%n", LABELS[r], right[r]);
        }
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Lesson 2's other failure, and the more interesting one, because the program is
// never wrong. An argument that only records where you came from belongs in
// neither the key nor the signature, and the giveaway is that the function is
// returning the wrong thing.
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <vector>

static std::vector<int> weight = {3, 4, 5, 2, 6, 4, 7, 3, 5, 2, 6, 4};
static std::vector<int> value = {30, 50, 60, 20, 70, 40, 80, 25, 55, 15, 65, 45};
static int capacity = 20;

static std::int64_t calls = 0;
static std::int64_t hits = 0;

// Best TOTAL value of a complete packing, given \`sofar\` already banked.
int carried(int i, int cap, int sofar, std::map<int, int> &memo, bool fullKey) {
    calls++;
    int key = fullKey ? (i * 1000 + cap) * 10000 + sofar : i * 1000 + cap;
    auto it = memo.find(key);
    if (it != memo.end()) {
        hits++;
        return it->second;
    }
    int answer;
    if (i == static_cast<int>(weight.size())) {
        answer = sofar;
    } else {
        answer = carried(i + 1, cap, sofar, memo, fullKey);
        if (weight[i] <= cap) {
            int take = carried(i + 1, cap - weight[i], sofar + value[i], memo, fullKey);
            if (take > answer) answer = take;
        }
    }
    memo[key] = answer;
    return answer;
}

// Best value obtainable from items i onwards. No accumulator, same answer.
int fromHere(int i, int cap, std::map<int, int> &memo) {
    calls++;
    int key = i * 1000 + cap;
    auto it = memo.find(key);
    if (it != memo.end()) {
        hits++;
        return it->second;
    }
    int answer;
    if (i == static_cast<int>(weight.size())) {
        answer = 0;
    } else {
        answer = fromHere(i + 1, cap, memo);
        if (weight[i] <= cap) {
            int take = value[i] + fromHere(i + 1, cap - weight[i], memo);
            if (take > answer) answer = take;
        }
    }
    memo[key] = answer;
    return answer;
}

static const std::array<std::string, 3> LABELS = {
    "carries the total, keys on all three",
    "carries the total, keys on (item, cap)",
    "returns the value from here on",
};

int run(int which, std::map<int, int> &memo) {
    if (which == 0) return carried(0, capacity, 0, memo, true);
    if (which == 1) return carried(0, capacity, 0, memo, false);
    return fromHere(0, capacity, memo);
}

int bruteForce(const std::vector<int> &weights, const std::vector<int> &values, int cap) {
    int n = static_cast<int>(weights.size());
    int top = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        int load = 0, worth = 0;
        for (int i = 0; i < n; i++) {
            if (mask >> i & 1) {
                load += weights[i];
                worth += values[i];
            }
        }
        if (load <= cap && worth > top) top = worth;
    }
    return top;
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    std::cout << weight.size() << " items, capacity " << capacity << "\\n\\n";
    std::cout << std::left << std::setw(40) << "formulation" << std::right << std::setw(8) << "answer"
              << std::setw(9) << "calls" << std::setw(8) << "hits" << std::setw(8) << "states" << "\\n";
    for (int r = 0; r < 3; r++) {
        calls = 0;
        hits = 0;
        std::map<int, int> memo;
        int answer = run(r, memo);
        std::cout << std::left << std::setw(40) << LABELS[r] << std::right << std::setw(8) << answer
                  << std::setw(9) << calls << std::setw(8) << hits << std::setw(8) << memo.size() << "\\n";
    }
    std::cout << "\\n";

    std::cout << "every one of the " << (1 << weight.size()) << " subsets agrees the best is "
              << bruteForce(weight, value, capacity) << "\\n\\n";

    // The middle row is right on this instance, which is the whole problem with it.
    const int TRIALS = 20000;
    std::array<int, 3> right{};
    for (int trial = 0; trial < TRIALS; trial++) {
        int n = 4 + rnd(4);
        weight.assign(n, 0);
        value.assign(n, 0);
        for (int i = 0; i < n; i++) weight[i] = 1 + rnd(8);
        for (int i = 0; i < n; i++) value[i] = 10 * (1 + rnd(9));
        capacity = 5 + rnd(12);
        int truth = bruteForce(weight, value, capacity);
        for (int r = 0; r < 3; r++) {
            std::map<int, int> memo;
            if (run(r, memo) == truth) right[r]++;
        }
    }

    std::cout << "optimal on how many of " << TRIALS << " random knapsacks:\\n";
    for (int r = 0; r < 3; r++) {
        std::cout << "  " << std::left << std::setw(40) << LABELS[r] << std::right << std::setw(7)
                  << right[r] << "\\n";
    }
}
`,
            },
            {
              lang: "rust",
              code: `// Lesson 2's other failure, and the more interesting one, because the program is
// never wrong. An argument that only records where you came from belongs in
// neither the key nor the signature, and the giveaway is that the function is
// returning the wrong thing.
use std::collections::HashMap;

struct Knapsack {
    weight: Vec<i32>,
    value: Vec<i32>,
    capacity: i32,
}

struct Stats {
    calls: i64,
    hits: i64,
}

/// Best TOTAL value of a complete packing, given \`sofar\` already banked.
fn carried(
    k: &Knapsack, i: usize, cap: i32, sofar: i32, memo: &mut HashMap<i32, i32>,
    full_key: bool, st: &mut Stats,
) -> i32 {
    st.calls += 1;
    let base = i as i32 * 1000 + cap;
    let key = if full_key { base * 10000 + sofar } else { base };
    if let Some(&v) = memo.get(&key) {
        st.hits += 1;
        return v;
    }
    let mut answer;
    if i == k.weight.len() {
        answer = sofar;
    } else {
        answer = carried(k, i + 1, cap, sofar, memo, full_key, st);
        if k.weight[i] <= cap {
            let take = carried(k, i + 1, cap - k.weight[i], sofar + k.value[i], memo, full_key, st);
            if take > answer {
                answer = take;
            }
        }
    }
    memo.insert(key, answer);
    answer
}

/// Best value obtainable from items i onwards. No accumulator, same answer.
fn from_here(k: &Knapsack, i: usize, cap: i32, memo: &mut HashMap<i32, i32>, st: &mut Stats) -> i32 {
    st.calls += 1;
    let key = i as i32 * 1000 + cap;
    if let Some(&v) = memo.get(&key) {
        st.hits += 1;
        return v;
    }
    let mut answer;
    if i == k.weight.len() {
        answer = 0;
    } else {
        answer = from_here(k, i + 1, cap, memo, st);
        if k.weight[i] <= cap {
            let take = k.value[i] + from_here(k, i + 1, cap - k.weight[i], memo, st);
            if take > answer {
                answer = take;
            }
        }
    }
    memo.insert(key, answer);
    answer
}

const LABELS: [&str; 3] = [
    "carries the total, keys on all three",
    "carries the total, keys on (item, cap)",
    "returns the value from here on",
];

fn run(k: &Knapsack, which: usize, memo: &mut HashMap<i32, i32>, st: &mut Stats) -> i32 {
    match which {
        0 => carried(k, 0, k.capacity, 0, memo, true, st),
        1 => carried(k, 0, k.capacity, 0, memo, false, st),
        _ => from_here(k, 0, k.capacity, memo, st),
    }
}

fn brute_force(weights: &[i32], values: &[i32], cap: i32) -> i32 {
    let n = weights.len();
    let mut top = 0;
    for mask in 0..(1usize << n) {
        let mut load = 0;
        let mut worth = 0;
        for i in 0..n {
            if mask >> i & 1 == 1 {
                load += weights[i];
                worth += values[i];
            }
        }
        if load <= cap && worth > top {
            top = worth;
        }
    }
    top
}

fn rand(seed: &mut i64, n: i64) -> i32 {
    *seed = (*seed * 1103515245 + 12345) % 2147483648;
    (*seed / 65536 % n) as i32
}

fn main() {
    let mut k = Knapsack {
        weight: vec![3, 4, 5, 2, 6, 4, 7, 3, 5, 2, 6, 4],
        value: vec![30, 50, 60, 20, 70, 40, 80, 25, 55, 15, 65, 45],
        capacity: 20,
    };

    println!("{} items, capacity {}", k.weight.len(), k.capacity);
    println!();
    println!("{:<40}{:>8}{:>9}{:>8}{:>8}", "formulation", "answer", "calls", "hits", "states");
    for r in 0..3 {
        let mut st = Stats { calls: 0, hits: 0 };
        let mut memo: HashMap<i32, i32> = HashMap::new();
        let answer = run(&k, r, &mut memo, &mut st);
        println!("{:<40}{:>8}{:>9}{:>8}{:>8}", LABELS[r], answer, st.calls, st.hits, memo.len());
    }
    println!();

    println!(
        "every one of the {} subsets agrees the best is {}",
        1usize << k.weight.len(),
        brute_force(&k.weight, &k.value, k.capacity)
    );
    println!();

    // The middle row is right on this instance, which is the whole problem with it.
    const TRIALS: i32 = 20000;
    let mut seed = 1i64;
    let mut right = [0i32; 3];
    for _ in 0..TRIALS {
        let n = 4 + rand(&mut seed, 4);
        k.weight = (0..n).map(|_| 1 + rand(&mut seed, 8)).collect();
        k.value = (0..n).map(|_| 10 * (1 + rand(&mut seed, 9))).collect();
        k.capacity = 5 + rand(&mut seed, 12);
        let truth = brute_force(&k.weight, &k.value, k.capacity);
        for r in 0..3 {
            let mut st = Stats { calls: 0, hits: 0 };
            let mut memo: HashMap<i32, i32> = HashMap::new();
            if run(&k, r, &mut memo, &mut st) == truth {
                right[r] += 1;
            }
        }
    }

    println!("optimal on how many of {} random knapsacks:", TRIALS);
    for r in 0..3 {
        println!("  {:<40}{:>7}", LABELS[r], right[r]);
    }
}
`,
            },
            {
              lang: "go",
              code: `// Lesson 2's other failure, and the more interesting one, because the program is
// never wrong. An argument that only records where you came from belongs in
// neither the key nor the signature, and the giveaway is that the function is
// returning the wrong thing.
package main

import "fmt"

var weight = []int{3, 4, 5, 2, 6, 4, 7, 3, 5, 2, 6, 4}
var value = []int{30, 50, 60, 20, 70, 40, 80, 25, 55, 15, 65, 45}
var capacity = 20

var calls int64
var hits int64

// Best TOTAL value of a complete packing, given \`sofar\` already banked.
func carried(i, cap, sofar int, memo map[int]int, fullKey bool) int {
	calls++
	key := i*1000 + cap
	if fullKey {
		key = key*10000 + sofar
	}
	if v, ok := memo[key]; ok {
		hits++
		return v
	}
	var answer int
	if i == len(weight) {
		answer = sofar
	} else {
		answer = carried(i+1, cap, sofar, memo, fullKey)
		if weight[i] <= cap {
			take := carried(i+1, cap-weight[i], sofar+value[i], memo, fullKey)
			if take > answer {
				answer = take
			}
		}
	}
	memo[key] = answer
	return answer
}

// Best value obtainable from items i onwards. No accumulator, same answer.
func fromHere(i, cap int, memo map[int]int) int {
	calls++
	key := i*1000 + cap
	if v, ok := memo[key]; ok {
		hits++
		return v
	}
	var answer int
	if i == len(weight) {
		answer = 0
	} else {
		answer = fromHere(i+1, cap, memo)
		if weight[i] <= cap {
			take := value[i] + fromHere(i+1, cap-weight[i], memo)
			if take > answer {
				answer = take
			}
		}
	}
	memo[key] = answer
	return answer
}

var LABELS = []string{
	"carries the total, keys on all three",
	"carries the total, keys on (item, cap)",
	"returns the value from here on",
}

func run(which int, memo map[int]int) int {
	if which == 0 {
		return carried(0, capacity, 0, memo, true)
	}
	if which == 1 {
		return carried(0, capacity, 0, memo, false)
	}
	return fromHere(0, capacity, memo)
}

func bruteForce(weights, values []int, cap int) int {
	n := len(weights)
	top := 0
	for mask := 0; mask < 1<<n; mask++ {
		load, worth := 0, 0
		for i := 0; i < n; i++ {
			if mask>>i&1 == 1 {
				load += weights[i]
				worth += values[i]
			}
		}
		if load <= cap && worth > top {
			top = worth
		}
	}
	return top
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	fmt.Printf("%d items, capacity %d\\n", len(weight), capacity)
	fmt.Println()
	fmt.Printf("%-40s%8s%9s%8s%8s\\n", "formulation", "answer", "calls", "hits", "states")
	for r := 0; r < 3; r++ {
		calls, hits = 0, 0
		memo := map[int]int{}
		answer := run(r, memo)
		fmt.Printf("%-40s%8d%9d%8d%8d\\n", LABELS[r], answer, calls, hits, len(memo))
	}
	fmt.Println()

	fmt.Printf("every one of the %d subsets agrees the best is %d\\n",
		1<<len(weight), bruteForce(weight, value, capacity))
	fmt.Println()

	// The middle row is right on this instance, which is the whole problem with it.
	const TRIALS = 20000
	right := [3]int{}
	for trial := 0; trial < TRIALS; trial++ {
		n := 4 + rand(4)
		weight = make([]int, n)
		value = make([]int, n)
		for i := 0; i < n; i++ {
			weight[i] = 1 + rand(8)
		}
		for i := 0; i < n; i++ {
			value[i] = 10 * (1 + rand(9))
		}
		capacity = 5 + rand(12)
		truth := bruteForce(weight, value, capacity)
		for r := 0; r < 3; r++ {
			if run(r, map[int]int{}) == truth {
				right[r]++
			}
		}
	}

	fmt.Printf("optimal on how many of %d random knapsacks:\\n", TRIALS)
	for r := 0; r < 3; r++ {
		fmt.Printf("  %-40s%7d\\n", LABELS[r], right[r])
	}
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Clear the memo between instances",
          body: "A memo held in a global or a default argument outlives the call that filled it, so the second test case in a batch reads answers computed for the first. It is the single commonest bug in contest submissions and it produces the worst possible symptom: correct on the sample, wrong on the judge, and correct again when you rerun the sample on its own.",
        },
        {
          title: "Top-down memoisation recurses as deep as the state chain",
          body: "The edit here keeps the recursion, so a DP over an array of 100,000 elements does 100,000 nested calls. Python's default limit is 1,000 and will raise; other languages will run out of stack less politely. This is the main practical reason to convert a working top-down solution to bottom-up, which lesson 5 does mechanically -- so it is a reason to convert something correct, not a reason to write it bottom-up first.",
        },
      ],
    },
    {
      id: "when-the-edit-is-illegal",
      heading: "What you are asserting when you add the four lines",
      body: [
        "Everything above assumes the function is safe to cache at all, which is worth making explicit because it is assumed silently almost everywhere else.",
        "A memoised function has to be **pure over its key**: the same key must always deserve the same answer. That rules out reading mutable state that changes during the run, anything that consults the clock or a random source, and \u2014 the one that actually bites \u2014 a function whose answer depends on how the call was reached rather than on its arguments. That last one is not a special case, it is exactly what section 3 was about.",
        "There is a subtler failure that has nothing to do with the recursion. If the cached value is a mutable object rather than a number, the memo is handing out a reference, and a caller that modifies what it got back has modified what every future hit will see. Storing a list or an array is fine as long as nobody writes to it; the moment somebody does, the bug appears far away from the memo and looks like anything but a caching problem.",
        "None of this is a reason to be nervous. It is a reason to know what you are asserting when you add four lines to a recursion, so that when the number comes out wrong you know which of a very small number of things to check.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "You have a brute-force recursion. Walk me through turning it into a dynamic program.",
      answer:
        "Four lines, and nothing is removed. Build a key out of exactly the arguments that vary between calls; return the stored answer if that key is already in the memo; store the answer before returning it; and return a single named variable rather than an expression, so there is one place the value comes from and one place the store can be forgotten. Then check two things: that the key names every argument the answer depends on, and that it names nothing else. The recursion itself does not change, which is the point \u2014 the version on the page still reads as the definition of the problem.",
    },
    {
      question: "How do you decide what belongs in the memo key?",
      answer:
        "The key has to equal the state, and the state is the set of arguments the answer genuinely depends on. Leave one out and the memo answers a different question \u2014 knapsack keyed on the item index alone reports 230 for a knapsack whose optimum is 120, and does it consistently rather than randomly, because whichever call arrives first decides what everything later reads. Put something in that the answer does not depend on and the program stays correct while the table multiplies. The test I would actually apply is: does this argument describe what is left to decide, or what has already been decided? Capacity remaining is the former. A running total is the latter, and if one is in the signature the return value is usually defined wrongly.",
    },
    {
      question: "Your memoised solution is fast and returns the wrong answer. Where do you look?",
      answer:
        "The key, first \u2014 something the answer depends on is missing from it. Then whether the memo is being cleared between test cases, because a global memo that survives one instance into the next is the classic version of this. Then whether the function is pure over its key at all: reading mutable state that changes during the run, or handing back a mutable object that a caller then modifies, both make a cached answer stop being the right answer. And I would confirm all of it by running the memoised version against the brute force on a few thousand small random inputs, because the failure mode here is being right most of the time.",
    },
  ],
  takeaways: [
    "Memoising is a fixed four-line edit \u2014 name the subproblem, look it up, store it, return the one variable \u2014 and it deletes nothing.",
    "Route every return through one named variable, because forgetting the store is the commonest way to get a memo that never fills.",
    "A memoised recursion costs the number of states; the plain one costs the number of answers. On a 12x12 grid that is 287 calls against 3,997,447.",
    "The key must name every argument the answer depends on. Leaving one out gives a faster program that is confidently and systematically wrong.",
    "A broken key does not add noise: whichever call arrives first fixes what everything later reads, so knapsack keyed on the index alone overstates every single time.",
    "The key must also name nothing else. An extra argument multiplies the table without changing an answer.",
    "A state describes what is left to decide, not what has already been decided \u2014 an accumulator in the signature means the return value is wrong.",
    "The edit assumes the function is pure over its key, which rules out path-dependent answers, uncleared memos between test cases, and handing out mutable values.",
  ],
  status: "available",
};
