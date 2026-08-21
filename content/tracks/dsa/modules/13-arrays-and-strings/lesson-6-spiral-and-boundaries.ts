import type { Lesson } from "@/content/types";

export const spiralAndBoundariesLesson: Lesson = {
  id: "dsa-arr-spiral",
  slug: "spiral-order-and-shrinking-boundaries",
  moduleSlug: "arrays-and-strings",
  title: "Spiral Order & Shrinking Boundaries",
  summary:
    "Four boundaries that close in on each other, the two guards everybody forgets, and the direction-vector idiom that reappears in every grid problem for the rest of the track.",
  estimatedMinutes: 25,
  objectives: [
    "Traverse a matrix in spiral order with four shrinking boundaries",
    "Explain exactly which degenerate shapes need the two guards",
    "Use direction vectors and a turn rule instead of four separate loops",
    "Build a test set from the shapes that break boundary code",
  ],
  sections: [
    {
      id: "boundaries",
      heading: "Four numbers that close in",
      body: [
        "Spiral traversal is the standard boundary problem, and the reason it is worth a lesson is not the spiral. It is that **the state of the traversal is four integers, and every step must leave them consistent** — which is the same discipline every windowing and partitioning algorithm in the next few modules demands.",
        "Keep `top`, `bottom`, `left`, `right` as the still-unvisited rectangle. One lap of the spiral is four moves: across the top row left to right, down the right column, back across the bottom row, up the left column. After each move, retire that edge by moving its boundary inward. Loop while `top <= bottom and left <= right`.",
        "**The invariant**: everything outside the `[top..bottom] × [left..right]` rectangle has been collected, and everything inside has not. When the rectangle empties, you are done — and the total is r × c because each cell leaves the rectangle exactly once.",
      ],
      examples: [
        {
          id: "spiral",
          title: "Spiral order, with the rectangle shrinking",
          lang: "python",
          code: `def spiral_order(m, trace=False):
    if not m or not m[0]:
        return []
    top, bottom = 0, len(m) - 1
    left, right = 0, len(m[0]) - 1
    out = []
    while top <= bottom and left <= right:
        for c in range(left, right + 1):
            out.append(m[top][c])
        top += 1
        for r in range(top, bottom + 1):
            out.append(m[r][right])
        right -= 1
        if top <= bottom:                       # guard: the row may be gone
            for c in range(right, left - 1, -1):
                out.append(m[bottom][c])
            bottom -= 1
        if left <= right:                       # guard: the column may be gone
            for r in range(bottom, top - 1, -1):
                out.append(m[r][left])
            left += 1
        if trace:
            print(f"    top={top} bottom={bottom} left={left} right={right}"
                  f"  collected={len(out)}")
    return out


grids = [
    [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
    [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]],
    [[1], [2], [3]],
    [[1, 2, 3]],
    [[1]],
]

for g in grids:
    rows, cols = len(g), len(g[0])
    print(f"{rows}x{cols}: {spiral_order(g)}")

print()
print("the 3x3, with the boundaries after each full lap:")
spiral_order([[1, 2, 3], [4, 5, 6], [7, 8, 9]], trace=True)`,
          output: `3x3: [1, 2, 3, 6, 9, 8, 7, 4, 5]
3x4: [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]
3x1: [1, 2, 3]
1x3: [1, 2, 3]
1x1: [1]

the 3x3, with the boundaries after each full lap:
    top=1 bottom=1 left=1 right=1  collected=8
    top=2 bottom=1 left=1 right=0  collected=9`,
          explanation:
            "The trace shows the whole story in two lines. After the first lap the rectangle has shrunk to the single cell `[1..1] × [1..1]` and eight of nine values are collected. The second lap takes that cell in its very first move, then the two guards both fail — `top` is now 2 and `bottom` is still 1 — so the third and fourth moves are correctly skipped, and the loop condition ends it. **The centre cell of an odd square is the case that exposes an unguarded implementation**, and it is why 3×3 belongs in your test set as well as 4×4.",
          alternates: [
            {
              lang: "javascript",
              code: `const list = (xs) => "[" + xs.join(", ") + "]";

function spiralOrder(m, trace = false) {
  if (m.length === 0 || m[0].length === 0) return [];
  let top = 0;
  let bottom = m.length - 1;
  let left = 0;
  let right = m[0].length - 1;
  const out = [];
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) out.push(m[top][c]);
    top++;
    for (let r = top; r <= bottom; r++) out.push(m[r][right]);
    right--;
    if (top <= bottom) {                      // guard: the row may be gone
      for (let c = right; c >= left; c--) out.push(m[bottom][c]);
      bottom--;
    }
    if (left <= right) {                      // guard: the column may be gone
      for (let r = bottom; r >= top; r--) out.push(m[r][left]);
      left++;
    }
    if (trace) {
      console.log(
        \`    top=\${top} bottom=\${bottom} left=\${left} right=\${right}  collected=\${out.length}\`
      );
    }
  }
  return out;
}

const grids = [
  [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
  [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]],
  [[1], [2], [3]],
  [[1, 2, 3]],
  [[1]],
];

for (const g of grids) {
  console.log(\`\${g.length}x\${g[0].length}: \${list(spiralOrder(g))}\`);
}

console.log();
console.log("the 3x3, with the boundaries after each full lap:");
spiralOrder([[1, 2, 3], [4, 5, 6], [7, 8, 9]], true);`,
            },
            {
              lang: "typescript",
              code: `const list = (xs: number[]): string => "[" + xs.join(", ") + "]";

function spiralOrder(m: number[][], trace = false): number[] {
  if (m.length === 0 || m[0].length === 0) return [];
  let top = 0;
  let bottom = m.length - 1;
  let left = 0;
  let right = m[0].length - 1;
  const out: number[] = [];
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) out.push(m[top][c]);
    top++;
    for (let r = top; r <= bottom; r++) out.push(m[r][right]);
    right--;
    if (top <= bottom) {                      // guard: the row may be gone
      for (let c = right; c >= left; c--) out.push(m[bottom][c]);
      bottom--;
    }
    if (left <= right) {                      // guard: the column may be gone
      for (let r = bottom; r >= top; r--) out.push(m[r][left]);
      left++;
    }
    if (trace) {
      console.log(
        \`    top=\${top} bottom=\${bottom} left=\${left} right=\${right}  collected=\${out.length}\`
      );
    }
  }
  return out;
}

const grids: number[][][] = [
  [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
  [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]],
  [[1], [2], [3]],
  [[1, 2, 3]],
  [[1]],
];

for (const g of grids) {
  console.log(\`\${g.length}x\${g[0].length}: \${list(spiralOrder(g))}\`);
}

console.log();
console.log("the 3x3, with the boundaries after each full lap:");
spiralOrder([[1, 2, 3], [4, 5, 6], [7, 8, 9]], true);`,
            },
            {
              lang: "java",
              code: `import java.util.*;

public class Main {
    static String list(List<Integer> xs) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < xs.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(xs.get(i));
        }
        return sb.append("]").toString();
    }

    static List<Integer> spiralOrder(int[][] m, boolean trace) {
        List<Integer> out = new ArrayList<>();
        if (m.length == 0 || m[0].length == 0) return out;
        int top = 0, bottom = m.length - 1, left = 0, right = m[0].length - 1;
        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) out.add(m[top][c]);
            top++;
            for (int r = top; r <= bottom; r++) out.add(m[r][right]);
            right--;
            if (top <= bottom) {                  // guard: the row may be gone
                for (int c = right; c >= left; c--) out.add(m[bottom][c]);
                bottom--;
            }
            if (left <= right) {                  // guard: the column may be gone
                for (int r = bottom; r >= top; r--) out.add(m[r][left]);
                left++;
            }
            if (trace) {
                System.out.println("    top=" + top + " bottom=" + bottom
                        + " left=" + left + " right=" + right
                        + "  collected=" + out.size());
            }
        }
        return out;
    }

    public static void main(String[] args) {
        int[][][] grids = {
            {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}},
            {{1, 2, 3, 4}, {5, 6, 7, 8}, {9, 10, 11, 12}},
            {{1}, {2}, {3}},
            {{1, 2, 3}},
            {{1}},
        };
        for (int[][] g : grids) {
            System.out.println(g.length + "x" + g[0].length + ": " + list(spiralOrder(g, false)));
        }

        System.out.println();
        System.out.println("the 3x3, with the boundaries after each full lap:");
        spiralOrder(new int[][]{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}, true);
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <iostream>
#include <string>
#include <vector>
using namespace std;

string list(const vector<int>& xs) {
    string out = "[";
    for (size_t i = 0; i < xs.size(); i++) {
        if (i) out += ", ";
        out += to_string(xs[i]);
    }
    return out + "]";
}

vector<int> spiralOrder(const vector<vector<int>>& m, bool trace = false) {
    vector<int> out;
    if (m.empty() || m[0].empty()) return out;
    int top = 0, bottom = (int)m.size() - 1, left = 0, right = (int)m[0].size() - 1;
    while (top <= bottom && left <= right) {
        for (int c = left; c <= right; c++) out.push_back(m[top][c]);
        top++;
        for (int r = top; r <= bottom; r++) out.push_back(m[r][right]);
        right--;
        if (top <= bottom) {                      // guard: the row may be gone
            for (int c = right; c >= left; c--) out.push_back(m[bottom][c]);
            bottom--;
        }
        if (left <= right) {                      // guard: the column may be gone
            for (int r = bottom; r >= top; r--) out.push_back(m[r][left]);
            left++;
        }
        if (trace) {
            cout << "    top=" << top << " bottom=" << bottom
                 << " left=" << left << " right=" << right
                 << "  collected=" << out.size() << "\\n";
        }
    }
    return out;
}

int main() {
    vector<vector<vector<int>>> grids = {
        {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}},
        {{1, 2, 3, 4}, {5, 6, 7, 8}, {9, 10, 11, 12}},
        {{1}, {2}, {3}},
        {{1, 2, 3}},
        {{1}},
    };
    for (const auto& g : grids) {
        cout << g.size() << "x" << g[0].size() << ": " << list(spiralOrder(g)) << "\\n";
    }

    cout << "\\n";
    cout << "the 3x3, with the boundaries after each full lap:\\n";
    spiralOrder({{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}, true);
}`,
            },
            {
              lang: "rust",
              code: `fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn spiral_order(m: &[Vec<i32>], trace: bool) -> Vec<i32> {
    let mut out = Vec::new();
    if m.is_empty() || m[0].is_empty() {
        return out;
    }
    let (mut top, mut bottom) = (0i32, m.len() as i32 - 1);
    let (mut left, mut right) = (0i32, m[0].len() as i32 - 1);
    while top <= bottom && left <= right {
        for c in left..=right {
            out.push(m[top as usize][c as usize]);
        }
        top += 1;
        for r in top..=bottom {
            out.push(m[r as usize][right as usize]);
        }
        right -= 1;
        if top <= bottom {
            // guard: the row may be gone
            for c in (left..=right).rev() {
                out.push(m[bottom as usize][c as usize]);
            }
            bottom -= 1;
        }
        if left <= right {
            // guard: the column may be gone
            for r in (top..=bottom).rev() {
                out.push(m[r as usize][left as usize]);
            }
            left += 1;
        }
        if trace {
            println!(
                "    top={} bottom={} left={} right={}  collected={}",
                top,
                bottom,
                left,
                right,
                out.len()
            );
        }
    }
    out
}

fn main() {
    let grids: Vec<Vec<Vec<i32>>> = vec![
        vec![vec![1, 2, 3], vec![4, 5, 6], vec![7, 8, 9]],
        vec![vec![1, 2, 3, 4], vec![5, 6, 7, 8], vec![9, 10, 11, 12]],
        vec![vec![1], vec![2], vec![3]],
        vec![vec![1, 2, 3]],
        vec![vec![1]],
    ];
    for g in &grids {
        println!("{}x{}: {}", g.len(), g[0].len(), list(&spiral_order(g, false)));
    }

    println!();
    println!("the 3x3, with the boundaries after each full lap:");
    spiral_order(&vec![vec![1, 2, 3], vec![4, 5, 6], vec![7, 8, 9]], true);
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"strings"
)

func list(xs []int) string {
	parts := make([]string, len(xs))
	for i, x := range xs {
		parts[i] = fmt.Sprint(x)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func spiralOrder(m [][]int, trace bool) []int {
	out := []int{}
	if len(m) == 0 || len(m[0]) == 0 {
		return out
	}
	top, bottom := 0, len(m)-1
	left, right := 0, len(m[0])-1
	for top <= bottom && left <= right {
		for c := left; c <= right; c++ {
			out = append(out, m[top][c])
		}
		top++
		for r := top; r <= bottom; r++ {
			out = append(out, m[r][right])
		}
		right--
		if top <= bottom { // guard: the row may be gone
			for c := right; c >= left; c-- {
				out = append(out, m[bottom][c])
			}
			bottom--
		}
		if left <= right { // guard: the column may be gone
			for r := bottom; r >= top; r-- {
				out = append(out, m[r][left])
			}
			left++
		}
		if trace {
			fmt.Printf("    top=%d bottom=%d left=%d right=%d  collected=%d\\n",
				top, bottom, left, right, len(out))
		}
	}
	return out
}

func main() {
	grids := [][][]int{
		{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}},
		{{1, 2, 3, 4}, {5, 6, 7, 8}, {9, 10, 11, 12}},
		{{1}, {2}, {3}},
		{{1, 2, 3}},
		{{1}},
	}
	for _, g := range grids {
		fmt.Printf("%dx%d: %s\\n", len(g), len(g[0]), list(spiralOrder(g, false)))
	}

	fmt.Println()
	fmt.Println("the 3x3, with the boundaries after each full lap:")
	spiralOrder([][]int{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}, true)
}`,
            },
          ],
        },
      ],
    },
    {
      id: "guards",
      heading: "The two guards, and what they are protecting",
      body: [
        "Every implementation of this gets written without the guards the first time, and it passes on square matrices. That is exactly what makes it a good interview question.",
        "The problem: after walking the top row and the right column, the rectangle may already be empty. If it had one row, `top` has passed `bottom` — but the third loop runs anyway, and walks that same single row backwards, emitting every value a second time. The same happens to the fourth loop with a single column.",
        "So the guards are not defensive padding. They are the statement that **the rectangle must be re-checked between the moves, not only between laps**, because two of the four moves shrink it.",
      ],
      examples: [
        {
          id: "guards",
          title: "The same code with the guards removed",
          lang: "python",
          code: `def spiral(m, guarded):
    top, bottom = 0, len(m) - 1
    left, right = 0, len(m[0]) - 1
    out = []
    while top <= bottom and left <= right:
        for c in range(left, right + 1):
            out.append(m[top][c])
        top += 1
        for r in range(top, bottom + 1):
            out.append(m[r][right])
        right -= 1
        if not guarded or top <= bottom:
            for c in range(right, left - 1, -1):
                out.append(m[bottom][c])
            bottom -= 1
        if not guarded or left <= right:
            for r in range(bottom, top - 1, -1):
                out.append(m[r][left])
            left += 1
    return out


grids = {
    "1 x 4 (single row)": [[1, 2, 3, 4]],
    "4 x 1 (single col)": [[1], [2], [3], [4]],
    "3 x 3 (odd centre)": [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
    "2 x 2 (even)":       [[1, 2], [3, 4]],
}

print(f"{'grid':<20} {'with guards':<26} {'without'}")
print("-" * 74)
for name, g in grids.items():
    good = spiral(g, True)
    bad = spiral(g, False)
    flag = "" if good == bad else "   <- differs"
    print(f"{name:<20} {str(good):<26} {bad}{flag}")

print()
print("without the guards a single row is walked back a second time,")
print("because \`bottom\` still equals \`top - 1\` and the loop runs anyway.")`,
          output: `grid                 with guards                without
--------------------------------------------------------------------------
1 x 4 (single row)   [1, 2, 3, 4]               [1, 2, 3, 4, 3, 2, 1]   <- differs
4 x 1 (single col)   [1, 2, 3, 4]               [1, 2, 3, 4, 3, 2]   <- differs
3 x 3 (odd centre)   [1, 2, 3, 6, 9, 8, 7, 4, 5] [1, 2, 3, 6, 9, 8, 7, 4, 5]
2 x 2 (even)         [1, 2, 4, 3]               [1, 2, 4, 3]

without the guards a single row is walked back a second time,
because \`bottom\` still equals \`top - 1\` and the loop runs anyway.`,
          explanation:
            "The two shapes that break it are the two that are usually left out of a hand-written test. Notice that the 3×3 agrees here — the odd centre is handled by the *loop condition* rather than the guards, so it is not the case that distinguishes them. **The test set for any boundary algorithm is: 1×1, 1×n, n×1, an even square, an odd square, and a rectangle in each orientation.** Six shapes, thirty seconds to write, and they catch essentially every bug this family of problems has.",
          alternates: [
            {
              lang: "javascript",
              code: `const list = (xs) => "[" + xs.join(", ") + "]";
const padR = (s, w) => String(s).padEnd(w);

function spiral(m, guarded) {
  let top = 0;
  let bottom = m.length - 1;
  let left = 0;
  let right = m[0].length - 1;
  const out = [];
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) out.push(m[top][c]);
    top++;
    for (let r = top; r <= bottom; r++) out.push(m[r][right]);
    right--;
    if (!guarded || top <= bottom) {
      for (let c = right; c >= left; c--) out.push(m[bottom][c]);
      bottom--;
    }
    if (!guarded || left <= right) {
      for (let r = bottom; r >= top; r--) out.push(m[r][left]);
      left++;
    }
  }
  return out;
}

const grids = [
  ["1 x 4 (single row)", [[1, 2, 3, 4]]],
  ["4 x 1 (single col)", [[1], [2], [3], [4]]],
  ["3 x 3 (odd centre)", [[1, 2, 3], [4, 5, 6], [7, 8, 9]]],
  ["2 x 2 (even)", [[1, 2], [3, 4]]],
];

console.log(\`\${padR("grid", 20)} \${padR("with guards", 26)} without\`);
console.log("-".repeat(74));
for (const [name, g] of grids) {
  const good = list(spiral(g, true));
  const bad = list(spiral(g, false));
  const flag = good === bad ? "" : "   <- differs";
  console.log(\`\${padR(name, 20)} \${padR(good, 26)} \${bad}\${flag}\`);
}

console.log();
console.log("without the guards a single row is walked back a second time,");
console.log("because \`bottom\` still equals \`top - 1\` and the loop runs anyway.");`,
            },
            {
              lang: "typescript",
              code: `const list = (xs: number[]): string => "[" + xs.join(", ") + "]";
const padR = (s: string, w: number): string => String(s).padEnd(w);

function spiral(m: number[][], guarded: boolean): number[] {
  let top = 0;
  let bottom = m.length - 1;
  let left = 0;
  let right = m[0].length - 1;
  const out: number[] = [];
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) out.push(m[top][c]);
    top++;
    for (let r = top; r <= bottom; r++) out.push(m[r][right]);
    right--;
    if (!guarded || top <= bottom) {
      for (let c = right; c >= left; c--) out.push(m[bottom][c]);
      bottom--;
    }
    if (!guarded || left <= right) {
      for (let r = bottom; r >= top; r--) out.push(m[r][left]);
      left++;
    }
  }
  return out;
}

const grids: [string, number[][]][] = [
  ["1 x 4 (single row)", [[1, 2, 3, 4]]],
  ["4 x 1 (single col)", [[1], [2], [3], [4]]],
  ["3 x 3 (odd centre)", [[1, 2, 3], [4, 5, 6], [7, 8, 9]]],
  ["2 x 2 (even)", [[1, 2], [3, 4]]],
];

console.log(\`\${padR("grid", 20)} \${padR("with guards", 26)} without\`);
console.log("-".repeat(74));
for (const [name, g] of grids) {
  const good = list(spiral(g, true));
  const bad = list(spiral(g, false));
  const flag = good === bad ? "" : "   <- differs";
  console.log(\`\${padR(name, 20)} \${padR(good, 26)} \${bad}\${flag}\`);
}

console.log();
console.log("without the guards a single row is walked back a second time,");
console.log("because \`bottom\` still equals \`top - 1\` and the loop runs anyway.");`,
            },
            {
              lang: "java",
              code: `import java.util.*;

public class Main {
    static String list(List<Integer> xs) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < xs.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(xs.get(i));
        }
        return sb.append("]").toString();
    }

    static List<Integer> spiral(int[][] m, boolean guarded) {
        int top = 0, bottom = m.length - 1, left = 0, right = m[0].length - 1;
        List<Integer> out = new ArrayList<>();
        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) out.add(m[top][c]);
            top++;
            for (int r = top; r <= bottom; r++) out.add(m[r][right]);
            right--;
            if (!guarded || top <= bottom) {
                for (int c = right; c >= left; c--) out.add(m[bottom][c]);
                bottom--;
            }
            if (!guarded || left <= right) {
                for (int r = bottom; r >= top; r--) out.add(m[r][left]);
                left++;
            }
        }
        return out;
    }

    public static void main(String[] args) {
        String[] names = {"1 x 4 (single row)", "4 x 1 (single col)",
                          "3 x 3 (odd centre)", "2 x 2 (even)"};
        int[][][] grids = {
            {{1, 2, 3, 4}},
            {{1}, {2}, {3}, {4}},
            {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}},
            {{1, 2}, {3, 4}},
        };

        System.out.printf("%-20s %-26s %s%n", "grid", "with guards", "without");
        System.out.println("-".repeat(74));
        for (int i = 0; i < names.length; i++) {
            String good = list(spiral(grids[i], true));
            String bad = list(spiral(grids[i], false));
            String flag = good.equals(bad) ? "" : "   <- differs";
            System.out.printf("%-20s %-26s %s%s%n", names[i], good, bad, flag);
        }

        System.out.println();
        System.out.println("without the guards a single row is walked back a second time,");
        System.out.println("because \`bottom\` still equals \`top - 1\` and the loop runs anyway.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <iomanip>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

string list(const vector<int>& xs) {
    string out = "[";
    for (size_t i = 0; i < xs.size(); i++) {
        if (i) out += ", ";
        out += to_string(xs[i]);
    }
    return out + "]";
}

vector<int> spiral(const vector<vector<int>>& m, bool guarded) {
    int top = 0, bottom = (int)m.size() - 1, left = 0, right = (int)m[0].size() - 1;
    vector<int> out;
    while (top <= bottom && left <= right) {
        for (int c = left; c <= right; c++) out.push_back(m[top][c]);
        top++;
        for (int r = top; r <= bottom; r++) out.push_back(m[r][right]);
        right--;
        if (!guarded || top <= bottom) {
            for (int c = right; c >= left; c--) out.push_back(m[bottom][c]);
            bottom--;
        }
        if (!guarded || left <= right) {
            for (int r = bottom; r >= top; r--) out.push_back(m[r][left]);
            left++;
        }
    }
    return out;
}

int main() {
    vector<pair<string, vector<vector<int>>>> grids = {
        {"1 x 4 (single row)", {{1, 2, 3, 4}}},
        {"4 x 1 (single col)", {{1}, {2}, {3}, {4}}},
        {"3 x 3 (odd centre)", {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}},
        {"2 x 2 (even)", {{1, 2}, {3, 4}}},
    };

    cout << left << setw(20) << "grid" << " " << setw(26) << "with guards" << " without\\n";
    cout << string(74, '-') << "\\n";
    for (const auto& [name, g] : grids) {
        string good = list(spiral(g, true));
        string bad = list(spiral(g, false));
        string flag = good == bad ? "" : "   <- differs";
        cout << left << setw(20) << name << " " << setw(26) << good << " " << bad << flag << "\\n";
    }

    cout << "\\n";
    cout << "without the guards a single row is walked back a second time,\\n";
    cout << "because \`bottom\` still equals \`top - 1\` and the loop runs anyway.\\n";
}`,
            },
            {
              lang: "rust",
              code: `fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn spiral(m: &[Vec<i32>], guarded: bool) -> Vec<i32> {
    let (mut top, mut bottom) = (0i32, m.len() as i32 - 1);
    let (mut left, mut right) = (0i32, m[0].len() as i32 - 1);
    let mut out = Vec::new();
    while top <= bottom && left <= right {
        for c in left..=right {
            out.push(m[top as usize][c as usize]);
        }
        top += 1;
        for r in top..=bottom {
            out.push(m[r as usize][right as usize]);
        }
        right -= 1;
        if !guarded || top <= bottom {
            for c in (left..=right).rev() {
                out.push(m[bottom as usize][c as usize]);
            }
            bottom -= 1;
        }
        if !guarded || left <= right {
            for r in (top..=bottom).rev() {
                out.push(m[r as usize][left as usize]);
            }
            left += 1;
        }
    }
    out
}

fn main() {
    let grids: Vec<(&str, Vec<Vec<i32>>)> = vec![
        ("1 x 4 (single row)", vec![vec![1, 2, 3, 4]]),
        ("4 x 1 (single col)", vec![vec![1], vec![2], vec![3], vec![4]]),
        ("3 x 3 (odd centre)", vec![vec![1, 2, 3], vec![4, 5, 6], vec![7, 8, 9]]),
        ("2 x 2 (even)", vec![vec![1, 2], vec![3, 4]]),
    ];

    println!("{:<20} {:<26} {}", "grid", "with guards", "without");
    println!("{}", "-".repeat(74));
    for (name, g) in &grids {
        let good = list(&spiral(g, true));
        let bad = list(&spiral(g, false));
        let flag = if good == bad { "" } else { "   <- differs" };
        println!("{:<20} {:<26} {}{}", name, good, bad, flag);
    }

    println!();
    println!("without the guards a single row is walked back a second time,");
    println!("because \`bottom\` still equals \`top - 1\` and the loop runs anyway.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"strings"
)

func list(xs []int) string {
	parts := make([]string, len(xs))
	for i, x := range xs {
		parts[i] = fmt.Sprint(x)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func spiral(m [][]int, guarded bool) []int {
	top, bottom := 0, len(m)-1
	left, right := 0, len(m[0])-1
	out := []int{}
	for top <= bottom && left <= right {
		for c := left; c <= right; c++ {
			out = append(out, m[top][c])
		}
		top++
		for r := top; r <= bottom; r++ {
			out = append(out, m[r][right])
		}
		right--
		if !guarded || top <= bottom {
			for c := right; c >= left; c-- {
				out = append(out, m[bottom][c])
			}
			bottom--
		}
		if !guarded || left <= right {
			for r := bottom; r >= top; r-- {
				out = append(out, m[r][left])
			}
			left++
		}
	}
	return out
}

func main() {
	type entry struct {
		name string
		grid [][]int
	}
	grids := []entry{
		{"1 x 4 (single row)", [][]int{{1, 2, 3, 4}}},
		{"4 x 1 (single col)", [][]int{{1}, {2}, {3}, {4}}},
		{"3 x 3 (odd centre)", [][]int{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}},
		{"2 x 2 (even)", [][]int{{1, 2}, {3, 4}}},
	}

	fmt.Printf("%-20s %-26s %s\\n", "grid", "with guards", "without")
	fmt.Println(strings.Repeat("-", 74))
	for _, e := range grids {
		good := list(spiral(e.grid, true))
		bad := list(spiral(e.grid, false))
		flag := ""
		if good != bad {
			flag = "   <- differs"
		}
		fmt.Printf("%-20s %-26s %s%s\\n", e.name, good, bad, flag)
	}

	fmt.Println()
	fmt.Println("without the guards a single row is walked back a second time,")
	fmt.Println("because \`bottom\` still equals \`top - 1\` and the loop runs anyway.")
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Testing only on square matrices",
          body: "Every bug in this lesson — the double-swap in transposition, the wrong divisor when flattening, and both missing guards here — is invisible on a square matrix and obvious on a rectangular one. If you write one test for a matrix problem, make it non-square, and make one dimension 1.",
        },
      ],
    },
    {
      id: "direction-vectors",
      heading: "The other formulation: walk and turn",
      body: [
        "There is a second way to write a spiral that replaces the four boundaries with a direction and a rule. It is worth learning here because **the idiom is used constantly from the graph modules onward**, and this is the gentlest place to meet it.",
        "Keep the four directions as parallel arrays of row and column deltas, ordered so that turning right is `(d + 1) % 4`. Then the whole algorithm is: write the value, try to step forward, and if the step would leave the grid or land on a cell already written, turn right and step instead.",
        "For traversal the boundary version is usually cleaner. For *generating* a spiral it is clearly better, because the already-written cells double as the boundary — no separate state at all.",
      ],
      examples: [
        {
          id: "generate",
          title: "Generating a spiral with one rule",
          lang: "java",
          code: `import java.util.*;

public class Main {
    // right, down, left, up — turning right is (d + 1) % 4
    static final int[] DR = {0, 1, 0, -1};
    static final int[] DC = {1, 0, -1, 0};

    static int[][] generate(int n) {
        int[][] m = new int[n][n];
        int r = 0, c = 0, d = 0;
        for (int v = 1; v <= n * n; v++) {
            m[r][c] = v;
            int nr = r + DR[d], nc = c + DC[d];
            if (nr < 0 || nr >= n || nc < 0 || nc >= n || m[nr][nc] != 0) {
                d = (d + 1) % 4;                     // blocked: turn right
                nr = r + DR[d];
                nc = c + DC[d];
            }
            r = nr;
            c = nc;
        }
        return m;
    }

    public static void main(String[] args) {
        for (int n : new int[]{1, 3, 4}) {
            System.out.println("n = " + n);
            for (int[] row : generate(n)) {
                StringBuilder sb = new StringBuilder("  ");
                for (int v : row) sb.append(String.format("%4d", v));
                System.out.println(sb);
            }
        }
        System.out.println();
        System.out.println("one rule: go straight until blocked, then turn right");
    }
}`,
          output: `n = 1
     1
n = 3
     1   2   3
     8   9   4
     7   6   5
n = 4
     1   2   3   4
    12  13  14   5
    11  16  15   6
    10   9   8   7

one rule: go straight until blocked, then turn right`,
          explanation:
            "Two details carry most of the weight. **The delta arrays are ordered so that a right turn is `+1 mod 4`** — that ordering is a choice you make once and then rely on, and getting it wrong produces a spiral that unwinds the wrong way. And `m[nr][nc] != 0` uses the array's own zero-initialisation as the visited marker, which works here because the values start at 1; when 0 is a legal value you need a real visited array, and that is precisely the situation you meet in the grid-traversal problems later. The bounds check must come *before* the array access, or the first step off the edge throws — `||` short-circuits, which is what makes that one line safe.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Return the elements of a matrix in spiral order.",
      answer:
        "Keep four boundaries — top, bottom, left, right — describing the rectangle not yet collected, and loop while top ≤ bottom and left ≤ right. Each lap walks the top row rightwards, the right column downwards, the bottom row leftwards and the left column upwards, retiring each edge by moving its boundary inward as it goes. The two things that matter are the guards before the third and fourth moves — re-check top ≤ bottom and left ≤ right, because the first two moves may already have emptied the rectangle — and the fact that it is O(r × c) time with O(1) extra space, since each cell leaves the rectangle exactly once.",
    },
    {
      question: "What breaks a spiral traversal that has no guards, and what does not?",
      answer:
        "A single row or a single column breaks it. After the top row and right column are taken, top has passed bottom, but an unguarded third loop still walks that same row backwards and emits every value twice. What does *not* break it is the odd-sized square everybody expects to — a 3×3 comes out correct without guards, because the centre cell is handled by the loop condition rather than by them. That is why the test set for a boundary algorithm should be 1×1, 1×n, n×1, an even square, an odd square and a rectangle each way round.",
    },
    {
      question: "How would you generate an n×n spiral matrix rather than read one?",
      answer:
        "The direction-vector formulation is cleaner for generating. Keep row and column delta arrays ordered right, down, left, up so a right turn is (d + 1) % 4, then write each value from 1 to n², try to step forward, and turn right if the step would leave the grid or land on a cell already written. The already-written cells act as the boundary, so there is no boundary state to keep at all. The bounds check has to short-circuit before the array access, and using 0 as the visited marker only works because the values start at 1.",
    },
  ],
  takeaways: [
    "Four boundaries describe the rectangle not yet collected; retire an edge per move",
    "Loop while top ≤ bottom and left ≤ right; each cell leaves exactly once",
    "Guard the third and fourth moves — the first two may have emptied the rectangle",
    "A single row or column is what breaks it, not the odd-sized square",
    "Test 1×1, 1×n, n×1, even square, odd square, and rectangles both ways",
    "Every bug in this module is invisible on a square matrix",
    "Direction vectors ordered right/down/left/up make a right turn `(d+1) % 4`",
    "For generation, the already-written cells are the boundary",
  ],
  status: "available",
};
