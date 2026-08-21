import type { Lesson } from "@/content/types";

export const matricesLesson: Lesson = {
  id: "dsa-arr-matrix",
  slug: "matrices-transposition-and-rotation",
  moduleSlug: "arrays-and-strings",
  title: "Matrices: Transposition, Rotation & Marking In Place",
  summary:
    "A matrix is an array with two indices — transposing it, rotating it in place, and using its own borders as scratch space when you are not allowed any.",
  estimatedMinutes: 25,
  objectives: [
    "Transpose a square matrix in place by visiting only one triangle",
    "Compose transpose and reversal into a 90° rotation in either direction",
    "Use the first row and column as marker storage to reach O(1) extra space",
    "Convert freely between a 2D index and a flat one",
  ],
  sections: [
    {
      id: "transpose-rotate",
      heading: "Transpose, then reverse",
      body: [
        "A matrix problem is usually an index problem. Very few of them require an idea; nearly all of them require getting `[r][c]` and `[c][r]` the right way round and not visiting anything twice.",
        "**Transposing in place** is the first one, and it has exactly one trap. Swapping `m[r][c]` with `m[c][r]` for every pair swaps everything back again — each pair gets visited twice and the matrix ends up unchanged. The fix is to visit only the upper triangle: start the inner loop at `c = r + 1`.",
        "**Rotating 90° clockwise** is then two known operations composed: transpose, then reverse each row. Counter-clockwise is the same two steps in the opposite order. There is nothing to memorise beyond that sentence, and deriving it on a 3×3 by hand takes fifteen seconds — which is what to do in an interview rather than trusting your recall of which order goes which way.",
      ],
      examples: [
        {
          id: "rotate",
          title: "Transpose and reverse, both directions",
          lang: "python",
          code: `def show(label, m):
    print(f"  {label}")
    for row in m:
        print("    " + " ".join(f"{v:>3}" for v in row))


def transpose(m):
    """Swap across the main diagonal. Only the upper triangle is visited."""
    n = len(m)
    for r in range(n):
        for c in range(r + 1, n):
            m[r][c], m[c][r] = m[c][r], m[r][c]


def reverse_each_row(m):
    for row in m:
        row.reverse()


mat = [[1, 2, 3],
       [4, 5, 6],
       [7, 8, 9]]

show("start", mat)
transpose(mat)
show("after transpose (r,c) -> (c,r)", mat)
reverse_each_row(mat)
show("after reversing each row = rotated 90 clockwise", mat)

print()
print("  counter-clockwise is the same two steps in the other order:")
mat2 = [[1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]]
reverse_each_row(mat2)
transpose(mat2)
show("reverse rows, then transpose", mat2)`,
          output: `  start
      1   2   3
      4   5   6
      7   8   9
  after transpose (r,c) -> (c,r)
      1   4   7
      2   5   8
      3   6   9
  after reversing each row = rotated 90 clockwise
      7   4   1
      8   5   2
      9   6   3

  counter-clockwise is the same two steps in the other order:
  reverse rows, then transpose
      3   6   9
      2   5   8
      1   4   7`,
          explanation:
            "Check the corner: `1` starts top-left and ends top-right under a clockwise rotation, which is what a physical quarter-turn does. That one check catches a reversed direction instantly and is worth doing every time. The transpose is O(n²) time and O(1) space, and it touches each off-diagonal pair exactly once — the diagonal itself is never touched, correctly, since `m[r][r]` swapped with itself is a no-op.",
          alternates: [
            {
              lang: "javascript",
              code: `const padL = (v, w) => String(v).padStart(w);

function show(label, m) {
  console.log(\`  \${label}\`);
  for (const row of m) console.log("    " + row.map((v) => padL(v, 3)).join(" "));
}

// Swap across the main diagonal. Only the upper triangle is visited.
function transpose(m) {
  const n = m.length;
  for (let r = 0; r < n; r++) {
    for (let c = r + 1; c < n; c++) {
      [m[r][c], m[c][r]] = [m[c][r], m[r][c]];
    }
  }
}

function reverseEachRow(m) {
  for (const row of m) row.reverse();
}

const mat = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

show("start", mat);
transpose(mat);
show("after transpose (r,c) -> (c,r)", mat);
reverseEachRow(mat);
show("after reversing each row = rotated 90 clockwise", mat);

console.log();
console.log("  counter-clockwise is the same two steps in the other order:");
const mat2 = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
reverseEachRow(mat2);
transpose(mat2);
show("reverse rows, then transpose", mat2);`,
            },
            {
              lang: "typescript",
              code: `const padL = (v: number, w: number): string => String(v).padStart(w);

function show(label: string, m: number[][]): void {
  console.log(\`  \${label}\`);
  for (const row of m) console.log("    " + row.map((v) => padL(v, 3)).join(" "));
}

// Swap across the main diagonal. Only the upper triangle is visited.
function transpose(m: number[][]): void {
  const n = m.length;
  for (let r = 0; r < n; r++) {
    for (let c = r + 1; c < n; c++) {
      [m[r][c], m[c][r]] = [m[c][r], m[r][c]];
    }
  }
}

function reverseEachRow(m: number[][]): void {
  for (const row of m) row.reverse();
}

const mat: number[][] = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

show("start", mat);
transpose(mat);
show("after transpose (r,c) -> (c,r)", mat);
reverseEachRow(mat);
show("after reversing each row = rotated 90 clockwise", mat);

console.log();
console.log("  counter-clockwise is the same two steps in the other order:");
const mat2: number[][] = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
reverseEachRow(mat2);
transpose(mat2);
show("reverse rows, then transpose", mat2);`,
            },
            {
              lang: "java",
              code: `public class Main {
    static void show(String label, int[][] m) {
        System.out.println("  " + label);
        for (int[] row : m) System.out.println("    " + joined(row));
    }

    static String joined(int[] row) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < row.length; i++) {
            if (i > 0) sb.append(" ");
            sb.append(String.format("%3d", row[i]));
        }
        return sb.toString();
    }

    /** Swap across the main diagonal. Only the upper triangle is visited. */
    static void transpose(int[][] m) {
        int n = m.length;
        for (int r = 0; r < n; r++) {
            for (int c = r + 1; c < n; c++) {
                int t = m[r][c];
                m[r][c] = m[c][r];
                m[c][r] = t;
            }
        }
    }

    static void reverseEachRow(int[][] m) {
        for (int[] row : m) {
            for (int lo = 0, hi = row.length - 1; lo < hi; lo++, hi--) {
                int t = row[lo];
                row[lo] = row[hi];
                row[hi] = t;
            }
        }
    }

    public static void main(String[] args) {
        int[][] mat = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};

        show("start", mat);
        transpose(mat);
        show("after transpose (r,c) -> (c,r)", mat);
        reverseEachRow(mat);
        show("after reversing each row = rotated 90 clockwise", mat);

        System.out.println();
        System.out.println("  counter-clockwise is the same two steps in the other order:");
        int[][] mat2 = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
        reverseEachRow(mat2);
        transpose(mat2);
        show("reverse rows, then transpose", mat2);
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

void show(const string& label, const vector<vector<int>>& m) {
    cout << "  " << label << "\\n";
    for (const auto& row : m) {
        ostringstream line;
        for (size_t i = 0; i < row.size(); i++) {
            if (i) line << " ";
            line << setw(3) << row[i];
        }
        cout << "    " << line.str() << "\\n";
    }
}

// Swap across the main diagonal. Only the upper triangle is visited.
void transpose(vector<vector<int>>& m) {
    size_t n = m.size();
    for (size_t r = 0; r < n; r++) {
        for (size_t c = r + 1; c < n; c++) swap(m[r][c], m[c][r]);
    }
}

void reverseEachRow(vector<vector<int>>& m) {
    for (auto& row : m) reverse(row.begin(), row.end());
}

int main() {
    vector<vector<int>> mat = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};

    show("start", mat);
    transpose(mat);
    show("after transpose (r,c) -> (c,r)", mat);
    reverseEachRow(mat);
    show("after reversing each row = rotated 90 clockwise", mat);

    cout << "\\n";
    cout << "  counter-clockwise is the same two steps in the other order:\\n";
    vector<vector<int>> mat2 = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
    reverseEachRow(mat2);
    transpose(mat2);
    show("reverse rows, then transpose", mat2);
}`,
            },
            {
              lang: "rust",
              code: `fn show(label: &str, m: &[Vec<i32>]) {
    println!("  {}", label);
    for row in m {
        let cells: Vec<String> = row.iter().map(|v| format!("{:>3}", v)).collect();
        println!("    {}", cells.join(" "));
    }
}

/// Swap across the main diagonal. Only the upper triangle is visited.
fn transpose(m: &mut [Vec<i32>]) {
    let n = m.len();
    for r in 0..n {
        for c in r + 1..n {
            let t = m[r][c];
            m[r][c] = m[c][r];
            m[c][r] = t;
        }
    }
}

fn reverse_each_row(m: &mut [Vec<i32>]) {
    for row in m.iter_mut() {
        row.reverse();
    }
}

fn main() {
    let mut mat = vec![vec![1, 2, 3], vec![4, 5, 6], vec![7, 8, 9]];

    show("start", &mat);
    transpose(&mut mat);
    show("after transpose (r,c) -> (c,r)", &mat);
    reverse_each_row(&mut mat);
    show("after reversing each row = rotated 90 clockwise", &mat);

    println!();
    println!("  counter-clockwise is the same two steps in the other order:");
    let mut mat2 = vec![vec![1, 2, 3], vec![4, 5, 6], vec![7, 8, 9]];
    reverse_each_row(&mut mat2);
    transpose(&mut mat2);
    show("reverse rows, then transpose", &mat2);
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"slices"
	"strings"
)

func show(label string, m [][]int) {
	fmt.Println(" ", label)
	for _, row := range m {
		cells := make([]string, len(row))
		for i, v := range row {
			cells[i] = fmt.Sprintf("%3d", v)
		}
		fmt.Println("   ", strings.Join(cells, " "))
	}
}

// Swap across the main diagonal. Only the upper triangle is visited.
func transpose(m [][]int) {
	n := len(m)
	for r := 0; r < n; r++ {
		for c := r + 1; c < n; c++ {
			m[r][c], m[c][r] = m[c][r], m[r][c]
		}
	}
}

func reverseEachRow(m [][]int) {
	for _, row := range m {
		slices.Reverse(row)
	}
}

func main() {
	mat := [][]int{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}

	show("start", mat)
	transpose(mat)
	show("after transpose (r,c) -> (c,r)", mat)
	reverseEachRow(mat)
	show("after reversing each row = rotated 90 clockwise", mat)

	fmt.Println()
	fmt.Println("  counter-clockwise is the same two steps in the other order:")
	mat2 := [][]int{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}
	reverseEachRow(mat2)
	transpose(mat2)
	show("reverse rows, then transpose", mat2)
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Transposing a non-square matrix in place",
          body: "You cannot. An r×c matrix transposes to a c×r one, and those have different shapes, so there is nowhere to put the result — in-place transposition is only defined for square matrices. A rectangular transpose has to allocate. If a problem hands you a rectangular grid and asks for a rotation, it is either asking for a new grid or the grid is secretly square; check the constraints rather than assuming.",
        },
      ],
    },
    {
      id: "markers",
      heading: "Using the matrix as its own scratch space",
      body: [
        "\"Set every row and column containing a zero to all zeroes\" is the classic O(1)-space matrix problem, and it is a good example of what a space constraint is really asking for.",
        "The natural solution keeps a set of rows and a set of columns to blank, which is O(r + c) space and completely correct. If the problem forbids that, the trick is to notice that **the matrix already has an array of length c and an array of length r inside it** — its first row and its first column. Use those as the marker arrays.",
        "The complication is that the two markers overlap at `m[0][0]`, which cannot record both \"row 0 has a zero\" and \"column 0 has a zero\". So handle one of them with a separate boolean, mark the interior, apply the interior, and blank the borders last — because blanking them earlier would destroy the flags you are still reading.",
        "**Order is the whole difficulty here.** Nothing in this is clever; it is entirely about doing three phases in the only sequence that works.",
      ],
      examples: [
        {
          id: "set-zeroes",
          title: "The borders as marker arrays",
          lang: "python",
          code: `def show(label, m):
    print(f"  {label}")
    for row in m:
        print("    " + " ".join(f"{v:>2}" for v in row))


def set_zeroes(m):
    """Row 0 and column 0 become the marker arrays, so no extra space is used."""
    rows, cols = len(m), len(m[0])
    first_row_has_zero = any(m[0][c] == 0 for c in range(cols))
    first_col_has_zero = any(m[r][0] == 0 for r in range(rows))

    for r in range(1, rows):                     # mark, using the borders
        for c in range(1, cols):
            if m[r][c] == 0:
                m[r][0] = 0
                m[0][c] = 0

    show("after marking (borders now hold the flags)", m)

    for r in range(1, rows):                     # apply, reading the borders
        for c in range(1, cols):
            if m[r][0] == 0 or m[0][c] == 0:
                m[r][c] = 0

    if first_row_has_zero:                       # the borders themselves, last
        for c in range(cols):
            m[0][c] = 0
    if first_col_has_zero:
        for r in range(rows):
            m[r][0] = 0


mat = [[1, 1, 1, 5],
       [1, 0, 1, 6],
       [2, 3, 1, 7],
       [4, 8, 0, 9]]

show("start", mat)
set_zeroes(mat)
show("final", mat)`,
          output: `  start
     1  1  1  5
     1  0  1  6
     2  3  1  7
     4  8  0  9
  after marking (borders now hold the flags)
     1  0  0  5
     0  0  1  6
     2  3  1  7
     0  8  0  9
  final
     1  0  0  5
     0  0  0  0
     2  0  0  7
     0  0  0  0`,
          explanation:
            "The middle snapshot is the one to study. After marking, `m[1][0]` and `m[3][0]` are zero because rows 1 and 3 contain a zero, and `m[0][1]` and `m[0][2]` are zero because columns 1 and 2 do — the borders are now a pair of boolean arrays that happen to live inside the data. The two flags captured *before* any marking are what make the last phase safe. Read the first row of the final matrix: it is `1 0 0 5` rather than all zeroes, correctly, because the original first row contained no zero and the ones there now are marks rather than data.",
          alternates: [
            {
              lang: "javascript",
              code: `const padL = (v, w) => String(v).padStart(w);

function show(label, m) {
  console.log(\`  \${label}\`);
  for (const row of m) console.log("    " + row.map((v) => padL(v, 2)).join(" "));
}

// Row 0 and column 0 become the marker arrays, so no extra space is used.
function setZeroes(m) {
  const rows = m.length;
  const cols = m[0].length;
  const firstRowHasZero = m[0].some((v) => v === 0);
  const firstColHasZero = m.some((row) => row[0] === 0);

  for (let r = 1; r < rows; r++) {          // mark, using the borders
    for (let c = 1; c < cols; c++) {
      if (m[r][c] === 0) {
        m[r][0] = 0;
        m[0][c] = 0;
      }
    }
  }

  show("after marking (borders now hold the flags)", m);

  for (let r = 1; r < rows; r++) {          // apply, reading the borders
    for (let c = 1; c < cols; c++) {
      if (m[r][0] === 0 || m[0][c] === 0) m[r][c] = 0;
    }
  }

  if (firstRowHasZero) {                    // the borders themselves, last
    for (let c = 0; c < cols; c++) m[0][c] = 0;
  }
  if (firstColHasZero) {
    for (let r = 0; r < rows; r++) m[r][0] = 0;
  }
}

const mat = [
  [1, 1, 1, 5],
  [1, 0, 1, 6],
  [2, 3, 1, 7],
  [4, 8, 0, 9],
];

show("start", mat);
setZeroes(mat);
show("final", mat);`,
            },
            {
              lang: "typescript",
              code: `const padL = (v: number, w: number): string => String(v).padStart(w);

function show(label: string, m: number[][]): void {
  console.log(\`  \${label}\`);
  for (const row of m) console.log("    " + row.map((v) => padL(v, 2)).join(" "));
}

// Row 0 and column 0 become the marker arrays, so no extra space is used.
function setZeroes(m: number[][]): void {
  const rows = m.length;
  const cols = m[0].length;
  const firstRowHasZero = m[0].some((v) => v === 0);
  const firstColHasZero = m.some((row) => row[0] === 0);

  for (let r = 1; r < rows; r++) {          // mark, using the borders
    for (let c = 1; c < cols; c++) {
      if (m[r][c] === 0) {
        m[r][0] = 0;
        m[0][c] = 0;
      }
    }
  }

  show("after marking (borders now hold the flags)", m);

  for (let r = 1; r < rows; r++) {          // apply, reading the borders
    for (let c = 1; c < cols; c++) {
      if (m[r][0] === 0 || m[0][c] === 0) m[r][c] = 0;
    }
  }

  if (firstRowHasZero) {                    // the borders themselves, last
    for (let c = 0; c < cols; c++) m[0][c] = 0;
  }
  if (firstColHasZero) {
    for (let r = 0; r < rows; r++) m[r][0] = 0;
  }
}

const mat: number[][] = [
  [1, 1, 1, 5],
  [1, 0, 1, 6],
  [2, 3, 1, 7],
  [4, 8, 0, 9],
];

show("start", mat);
setZeroes(mat);
show("final", mat);`,
            },
            {
              lang: "java",
              code: `public class Main {
    static void show(String label, int[][] m) {
        System.out.println("  " + label);
        for (int[] row : m) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < row.length; i++) {
                if (i > 0) sb.append(" ");
                sb.append(String.format("%2d", row[i]));
            }
            System.out.println("    " + sb);
        }
    }

    /** Row 0 and column 0 become the marker arrays, so no extra space is used. */
    static void setZeroes(int[][] m) {
        int rows = m.length, cols = m[0].length;
        boolean firstRowHasZero = false, firstColHasZero = false;
        for (int c = 0; c < cols; c++) if (m[0][c] == 0) firstRowHasZero = true;
        for (int r = 0; r < rows; r++) if (m[r][0] == 0) firstColHasZero = true;

        for (int r = 1; r < rows; r++) {          // mark, using the borders
            for (int c = 1; c < cols; c++) {
                if (m[r][c] == 0) {
                    m[r][0] = 0;
                    m[0][c] = 0;
                }
            }
        }

        show("after marking (borders now hold the flags)", m);

        for (int r = 1; r < rows; r++) {          // apply, reading the borders
            for (int c = 1; c < cols; c++) {
                if (m[r][0] == 0 || m[0][c] == 0) m[r][c] = 0;
            }
        }

        if (firstRowHasZero) {                    // the borders themselves, last
            for (int c = 0; c < cols; c++) m[0][c] = 0;
        }
        if (firstColHasZero) {
            for (int r = 0; r < rows; r++) m[r][0] = 0;
        }
    }

    public static void main(String[] args) {
        int[][] mat = {{1, 1, 1, 5}, {1, 0, 1, 6}, {2, 3, 1, 7}, {4, 8, 0, 9}};
        show("start", mat);
        setZeroes(mat);
        show("final", mat);
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

void show(const string& label, const vector<vector<int>>& m) {
    cout << "  " << label << "\\n";
    for (const auto& row : m) {
        ostringstream line;
        for (size_t i = 0; i < row.size(); i++) {
            if (i) line << " ";
            line << setw(2) << row[i];
        }
        cout << "    " << line.str() << "\\n";
    }
}

// Row 0 and column 0 become the marker arrays, so no extra space is used.
void setZeroes(vector<vector<int>>& m) {
    size_t rows = m.size(), cols = m[0].size();
    bool firstRowHasZero = false, firstColHasZero = false;
    for (size_t c = 0; c < cols; c++) if (m[0][c] == 0) firstRowHasZero = true;
    for (size_t r = 0; r < rows; r++) if (m[r][0] == 0) firstColHasZero = true;

    for (size_t r = 1; r < rows; r++) {          // mark, using the borders
        for (size_t c = 1; c < cols; c++) {
            if (m[r][c] == 0) {
                m[r][0] = 0;
                m[0][c] = 0;
            }
        }
    }

    show("after marking (borders now hold the flags)", m);

    for (size_t r = 1; r < rows; r++) {          // apply, reading the borders
        for (size_t c = 1; c < cols; c++) {
            if (m[r][0] == 0 || m[0][c] == 0) m[r][c] = 0;
        }
    }

    if (firstRowHasZero) {                       // the borders themselves, last
        for (size_t c = 0; c < cols; c++) m[0][c] = 0;
    }
    if (firstColHasZero) {
        for (size_t r = 0; r < rows; r++) m[r][0] = 0;
    }
}

int main() {
    vector<vector<int>> mat = {{1, 1, 1, 5}, {1, 0, 1, 6}, {2, 3, 1, 7}, {4, 8, 0, 9}};
    show("start", mat);
    setZeroes(mat);
    show("final", mat);
}`,
            },
            {
              lang: "rust",
              code: `fn show(label: &str, m: &[Vec<i32>]) {
    println!("  {}", label);
    for row in m {
        let cells: Vec<String> = row.iter().map(|v| format!("{:>2}", v)).collect();
        println!("    {}", cells.join(" "));
    }
}

/// Row 0 and column 0 become the marker arrays, so no extra space is used.
fn set_zeroes(m: &mut Vec<Vec<i32>>) {
    let (rows, cols) = (m.len(), m[0].len());
    let first_row_has_zero = m[0].iter().any(|v| *v == 0);
    let first_col_has_zero = m.iter().any(|row| row[0] == 0);

    for r in 1..rows {
        // mark, using the borders
        for c in 1..cols {
            if m[r][c] == 0 {
                m[r][0] = 0;
                m[0][c] = 0;
            }
        }
    }

    show("after marking (borders now hold the flags)", m);

    for r in 1..rows {
        // apply, reading the borders
        for c in 1..cols {
            if m[r][0] == 0 || m[0][c] == 0 {
                m[r][c] = 0;
            }
        }
    }

    if first_row_has_zero {
        // the borders themselves, last
        for c in 0..cols {
            m[0][c] = 0;
        }
    }
    if first_col_has_zero {
        for r in 0..rows {
            m[r][0] = 0;
        }
    }
}

fn main() {
    let mut mat = vec![
        vec![1, 1, 1, 5],
        vec![1, 0, 1, 6],
        vec![2, 3, 1, 7],
        vec![4, 8, 0, 9],
    ];
    show("start", &mat);
    set_zeroes(&mut mat);
    show("final", &mat);
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"strings"
)

func show(label string, m [][]int) {
	fmt.Println(" ", label)
	for _, row := range m {
		cells := make([]string, len(row))
		for i, v := range row {
			cells[i] = fmt.Sprintf("%2d", v)
		}
		fmt.Println("   ", strings.Join(cells, " "))
	}
}

// Row 0 and column 0 become the marker arrays, so no extra space is used.
func setZeroes(m [][]int) {
	rows, cols := len(m), len(m[0])
	firstRowHasZero, firstColHasZero := false, false
	for c := 0; c < cols; c++ {
		if m[0][c] == 0 {
			firstRowHasZero = true
		}
	}
	for r := 0; r < rows; r++ {
		if m[r][0] == 0 {
			firstColHasZero = true
		}
	}

	for r := 1; r < rows; r++ { // mark, using the borders
		for c := 1; c < cols; c++ {
			if m[r][c] == 0 {
				m[r][0] = 0
				m[0][c] = 0
			}
		}
	}

	show("after marking (borders now hold the flags)", m)

	for r := 1; r < rows; r++ { // apply, reading the borders
		for c := 1; c < cols; c++ {
			if m[r][0] == 0 || m[0][c] == 0 {
				m[r][c] = 0
			}
		}
	}

	if firstRowHasZero { // the borders themselves, last
		for c := 0; c < cols; c++ {
			m[0][c] = 0
		}
	}
	if firstColHasZero {
		for r := 0; r < rows; r++ {
			m[r][0] = 0
		}
	}
}

func main() {
	mat := [][]int{{1, 1, 1, 5}, {1, 0, 1, 6}, {2, 3, 1, 7}, {4, 8, 0, 9}}
	show("start", mat)
	setZeroes(mat)
	show("final", mat)
}`,
            },
          ],
        },
      ],
    },
    {
      id: "flattening",
      heading: "A matrix is a flat array with arithmetic on top",
      body: [
        "The last piece, and the one that reconnects this to the first lesson.",
        "A 2D index is not a different kind of thing. `m[r][c]` in row-major layout is element `r × COLS + c` of one flat array, and the inverse is `r = i / COLS`, `c = i % COLS`. That is the `base + i × width` arithmetic again with one more level of multiplication.",
        "Knowing this is directly useful. **A sorted matrix where each row starts after the previous row ends is a sorted array**, so you can binary search it in O(log(r × c)) by searching the index range and converting — no special two-dimensional algorithm required. It is also how you store a grid in a single allocation when you care about locality, and how flood-fill and BFS queues usually encode a cell as one integer instead of a pair.",
      ],
      examples: [
        {
          id: "flatten",
          title: "One array, two ways of reading it",
          lang: "java",
          code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        final int ROWS = 3, COLS = 4;
        int[] flat = new int[ROWS * COLS];
        for (int i = 0; i < flat.length; i++) flat[i] = 10 + i;

        System.out.println("one flat array: " + Arrays.toString(flat));
        System.out.println();
        System.out.println("read as a " + ROWS + "x" + COLS + " matrix, index = r * COLS + c:");
        for (int r = 0; r < ROWS; r++) {
            StringBuilder line = new StringBuilder("   ");
            for (int c = 0; c < COLS; c++) {
                line.append(String.format("%4d", flat[r * COLS + c]));
            }
            System.out.println(line);
        }

        System.out.println();
        System.out.printf("%8s %6s %6s %8s%n", "index", "row", "col", "value");
        System.out.println("   " + "-".repeat(29));
        for (int i : new int[]{0, 3, 4, 7, 11}) {
            int r = i / COLS, c = i % COLS;
            System.out.printf("%8d %6d %6d %8d%n", i, r, c, flat[i]);
        }

        System.out.println();
        System.out.println("divide and remainder invert the multiply and add — that is all a 2D index is");
    }
}`,
          output: `one flat array: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]

read as a 3x4 matrix, index = r * COLS + c:
     10  11  12  13
     14  15  16  17
     18  19  20  21

   index    row    col    value
   -----------------------------
       0      0      0       10
       3      0      3       13
       4      1      0       14
       7      1      3       17
      11      2      3       21

divide and remainder invert the multiply and add — that is all a 2D index is`,
          explanation:
            "Index 3 and index 4 are the interesting pair: consecutive in the flat array, and on different rows in the matrix. **The divisor is always the number of columns**, never the number of rows, and getting that backwards is the single most common bug in this conversion — it produces plausible-looking output on a square matrix and garbage on a rectangular one, which is exactly the wrong way round for catching it early. Test flattening code on a non-square grid.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Rotate an n×n matrix 90° clockwise in place.",
      answer:
        "Transpose it, then reverse each row. Transposing means swapping m[r][c] with m[c][r], visiting only the upper triangle — starting the inner loop at c = r + 1 — because visiting every pair swaps each one twice and leaves the matrix unchanged. Counter-clockwise is the same two operations in the other order. O(n²) time, O(1) space. I would check one corner rather than trusting my memory of the order: the top-left element must end up top-right for a clockwise turn.",
    },
    {
      question: "Set every row and column containing a zero to zero, using O(1) extra space.",
      answer:
        "Use the matrix's own first row and first column as the marker arrays, since they are already an array of length c and an array of length r. Record separately whether the first row and first column originally contained a zero, then scan the interior and mark m[r][0] and m[0][c] for each zero found, then scan the interior again and blank any cell whose row or column marker is set, then finally blank the borders themselves according to the two saved flags. The order is the whole difficulty — blanking the borders before applying the marks destroys the flags you are still reading. The obvious O(r + c) version with two sets is also correct and is worth stating first.",
    },
    {
      question: "How do you binary search a sorted m×n matrix?",
      answer:
        "If each row starts after the previous row ends, the matrix is already a sorted array with a different set of parentheses on it. Binary search the index range 0 to m×n − 1 and convert each midpoint with r = i / n and c = i % n, giving O(log(mn)) with no two-dimensional algorithm at all. The divisor is the number of columns, not rows — that is the usual bug, and it hides on a square matrix. If instead the rows and columns are each sorted but rows do not chain, that is a different problem: start at the top-right corner and walk left or down, which is O(m + n).",
    },
  ],
  takeaways: [
    "Transpose by visiting the upper triangle only — `for c in range(r+1, n)`",
    "Visiting every pair swaps each twice and changes nothing",
    "Clockwise = transpose then reverse rows; anticlockwise = the other order",
    "Check a corner instead of trusting your memory of which order",
    "In-place transposition only exists for square matrices",
    "For O(1) space, the first row and column are already marker arrays",
    "Mark, apply, then blank the borders — any other order eats the flags",
    "m[r][c] is flat[r × COLS + c]; invert with / and %, and the divisor is COLS",
  ],
  status: "available",
};
