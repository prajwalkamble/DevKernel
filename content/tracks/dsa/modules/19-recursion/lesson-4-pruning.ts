import type { Lesson } from "@/content/types";

export const pruningLesson: Lesson = {
  id: "dsa-rec-pruning",
  slug: "pruning-and-constraint-problems",
  moduleSlug: "recursion-and-backtracking",
  title: "Pruning & Constraint Problems",
  summary:
    "Backtracking without pruning is brute force with extra steps. N-queens is the demonstration: the same search, pruned, visits nine thousand times fewer nodes at n=8 — and that ratio grows.",
  estimatedMinutes: 35,
  objectives: [
    "Add constraint checks that reject a branch as early as possible",
    "Track constraints in O(1) rather than rescanning the partial solution",
    "Measure the difference pruning makes",
    "Apply the pattern to N-queens, sudoku and word search",
  ],
  sections: [
    {
      id: "the-idea",
      heading: "Reject early, not at the leaves",
      body: [
        "The naive way to solve a constraint puzzle is to generate every candidate and check each one at the end. Backtracking's advantage is that it can reject a *partial* candidate — and when it does, it discards the entire subtree beneath it unexamined.",
        "The earlier the rejection, the bigger the subtree discarded. Rejecting at depth 1 in an 8-queens search throws away everything below one of eight branches; rejecting at depth 7 throws away almost nothing.",
        "So the design question is always: **what is the earliest point at which I can know this branch is doomed?**",
      ],
      examples: [
        {
          id: "n-queens",
          title: "N-queens, pruned and unpruned",
          lang: "python",
          code: `def n_queens(n, count_only=True):
    """Pruning turns a factorial search into something that finishes."""
    cols = set()
    diag1 = set()          # r - c
    diag2 = set()          # r + c
    solutions = []
    nodes = [0]

    def place(row, board):
        nodes[0] += 1
        if row == n:
            solutions.append(board[:])
            return
        for col in range(n):
            if col in cols or (row - col) in diag1 or (row + col) in diag2:
                continue                                  # prune
            cols.add(col); diag1.add(row - col); diag2.add(row + col)
            board.append(col)
            place(row + 1, board)
            board.pop()
            cols.remove(col); diag1.remove(row - col); diag2.remove(row + col)

    place(0, [])
    return len(solutions), nodes[0], solutions

for n in (4, 5, 6, 8):
    count, nodes, sols = n_queens(n)
    print(f"n={n}: {count:3} solutions, {nodes:6,} nodes visited"
          f"   (n^n would be {n ** n:,})")

count, nodes, sols = n_queens(4)
print("\\nthe two 4-queens boards (column index per row):", sols)
for board in sols:
    print()
    for c in board:
        print("  " + "".join("Q" if i == c else "." for i in range(4)))

# Without pruning: generate every arrangement then filter.
def n_queens_no_prune(n):
    nodes = [0]
    found = [0]

    def place(row, board):
        nodes[0] += 1
        if row == n:
            ok = True
            for r1 in range(n):
                for r2 in range(r1 + 1, n):
                    if board[r1] == board[r2] or abs(board[r1] - board[r2]) == r2 - r1:
                        ok = False
            if ok:
                found[0] += 1
            return
        for col in range(n):
            board.append(col)
            place(row + 1, board)
            board.pop()

    place(0, [])
    return found[0], nodes[0]

print("\\npruned vs unpruned:")
for n in (4, 6, 8):
    _, pruned_nodes, _ = n_queens(n)
    found, raw_nodes = n_queens_no_prune(n)
    print(f"  n={n}: pruned {pruned_nodes:7,} nodes    unpruned {raw_nodes:9,} nodes"
          f"   ratio {raw_nodes / pruned_nodes:6.1f}x")`,
          output: `n=4:   2 solutions,     17 nodes visited   (n^n would be 256)
n=5:  10 solutions,     54 nodes visited   (n^n would be 3,125)
n=6:   4 solutions,    153 nodes visited   (n^n would be 46,656)
n=8:  92 solutions,  2,057 nodes visited   (n^n would be 16,777,216)

the two 4-queens boards (column index per row): [[1, 3, 0, 2], [2, 0, 3, 1]]

  .Q..
  ...Q
  Q...
  ..Q.

  ..Q.
  Q...
  ...Q
  .Q..

pruned vs unpruned:
  n=4: pruned      17 nodes    unpruned       341 nodes   ratio   20.1x
  n=6: pruned     153 nodes    unpruned    55,987 nodes   ratio  365.9x
  n=8: pruned   2,057 nodes    unpruned 19,173,961 nodes   ratio 9321.3x`,
          explanation:
            "**The ratio grows with n**: 20× at n=4, 366× at n=6, 9321× at n=8. Pruning is not a constant-factor optimisation — it changes the effective base of the exponential, and the gap widens without limit.\n\nNote that 2,057 nodes at n=8 is already less than the 16.7 million arrangements the search space nominally contains, and it is *also* far less than the 40,320 permutations that placing one queen per column would give. The constraint checks are doing real work at every level.",
          alternates: [
            {
              lang: "javascript",
              code: `// Pruning turns a factorial search into something that finishes.
const list = (xs) => "[" + xs.join(", ") + "]";
const listOfLists = (xss) => "[" + xss.map(list).join(", ") + "]";
const commas = (n) => String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");
const padL = (v, w) => String(v).padStart(w);

function nQueens(n) {
  const cols = new Set();
  const diag1 = new Set();     // r - c
  const diag2 = new Set();     // r + c
  const solutions = [];
  let nodes = 0;

  function place(row, board) {
    nodes++;
    if (row === n) {
      solutions.push([...board]);
      return;
    }
    for (let col = 0; col < n; col++) {
      if (cols.has(col) || diag1.has(row - col) || diag2.has(row + col)) continue; // prune
      cols.add(col); diag1.add(row - col); diag2.add(row + col);
      board.push(col);
      place(row + 1, board);
      board.pop();
      cols.delete(col); diag1.delete(row - col); diag2.delete(row + col);
    }
  }

  place(0, []);
  return { count: solutions.length, nodes, solutions };
}

for (const n of [4, 5, 6, 8]) {
  const { count, nodes } = nQueens(n);
  console.log(
    \`n=\${n}: \${padL(count, 3)} solutions, \${padL(commas(nodes), 6)} nodes visited\` +
      \`   (n^n would be \${commas(n ** n)})\`
  );
}

const { solutions: sols } = nQueens(4);
console.log("\\nthe two 4-queens boards (column index per row):", listOfLists(sols));
for (const board of sols) {
  console.log();
  for (const c of board) {
    let row = "";
    for (let i = 0; i < 4; i++) row += i === c ? "Q" : ".";
    console.log("  " + row);
  }
}

// Without pruning: generate every arrangement then filter.
function nQueensNoPrune(n) {
  let nodes = 0;
  let found = 0;

  function place(row, board) {
    nodes++;
    if (row === n) {
      let ok = true;
      for (let r1 = 0; r1 < n; r1++) {
        for (let r2 = r1 + 1; r2 < n; r2++) {
          if (board[r1] === board[r2] || Math.abs(board[r1] - board[r2]) === r2 - r1) ok = false;
        }
      }
      if (ok) found++;
      return;
    }
    for (let col = 0; col < n; col++) {
      board.push(col);
      place(row + 1, board);
      board.pop();
    }
  }

  place(0, []);
  return { found, nodes };
}

console.log("\\npruned vs unpruned:");
for (const n of [4, 6, 8]) {
  const prunedNodes = nQueens(n).nodes;
  const rawNodes = nQueensNoPrune(n).nodes;
  const ratio = (rawNodes / prunedNodes).toFixed(1);
  console.log(
    \`  n=\${n}: pruned \${padL(commas(prunedNodes), 7)} nodes    unpruned \${padL(commas(rawNodes), 9)} nodes\` +
      \`   ratio \${padL(ratio, 6)}x\`
  );
}`,
            },
            {
              lang: "typescript",
              code: `// Pruning turns a factorial search into something that finishes.
const list = (xs: number[]): string => "[" + xs.join(", ") + "]";
const listOfLists = (xss: number[][]): string => "[" + xss.map(list).join(", ") + "]";
const commas = (n: number): string => String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");
const padL = (v: number | string, w: number): string => String(v).padStart(w);

function nQueens(n: number): { count: number; nodes: number; solutions: number[][] } {
  const cols = new Set<number>();
  const diag1 = new Set<number>();     // r - c
  const diag2 = new Set<number>();     // r + c
  const solutions: number[][] = [];
  let nodes = 0;

  function place(row: number, board: number[]): void {
    nodes++;
    if (row === n) {
      solutions.push([...board]);
      return;
    }
    for (let col = 0; col < n; col++) {
      if (cols.has(col) || diag1.has(row - col) || diag2.has(row + col)) continue; // prune
      cols.add(col); diag1.add(row - col); diag2.add(row + col);
      board.push(col);
      place(row + 1, board);
      board.pop();
      cols.delete(col); diag1.delete(row - col); diag2.delete(row + col);
    }
  }

  place(0, []);
  return { count: solutions.length, nodes, solutions };
}

for (const n of [4, 5, 6, 8]) {
  const { count, nodes } = nQueens(n);
  console.log(
    \`n=\${n}: \${padL(count, 3)} solutions, \${padL(commas(nodes), 6)} nodes visited\` +
      \`   (n^n would be \${commas(n ** n)})\`
  );
}

const { solutions: sols } = nQueens(4);
console.log("\\nthe two 4-queens boards (column index per row):", listOfLists(sols));
for (const board of sols) {
  console.log();
  for (const c of board) {
    let row = "";
    for (let i = 0; i < 4; i++) row += i === c ? "Q" : ".";
    console.log("  " + row);
  }
}

// Without pruning: generate every arrangement then filter.
function nQueensNoPrune(n: number): { found: number; nodes: number } {
  let nodes = 0;
  let found = 0;

  function place(row: number, board: number[]): void {
    nodes++;
    if (row === n) {
      let ok = true;
      for (let r1 = 0; r1 < n; r1++) {
        for (let r2 = r1 + 1; r2 < n; r2++) {
          if (board[r1] === board[r2] || Math.abs(board[r1] - board[r2]) === r2 - r1) ok = false;
        }
      }
      if (ok) found++;
      return;
    }
    for (let col = 0; col < n; col++) {
      board.push(col);
      place(row + 1, board);
      board.pop();
    }
  }

  place(0, []);
  return { found, nodes };
}

console.log("\\npruned vs unpruned:");
for (const n of [4, 6, 8]) {
  const prunedNodes = nQueens(n).nodes;
  const rawNodes = nQueensNoPrune(n).nodes;
  const ratio = (rawNodes / prunedNodes).toFixed(1);
  console.log(
    \`  n=\${n}: pruned \${padL(commas(prunedNodes), 7)} nodes    unpruned \${padL(commas(rawNodes), 9)} nodes\` +
      \`   ratio \${padL(ratio, 6)}x\`
  );
}`,
            },
            {
              lang: "java",
              code: `import java.util.*;

/** Pruning turns a factorial search into something that finishes. */
public class Main {
    static String list(List<Integer> xs) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < xs.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(xs.get(i));
        }
        return sb.append("]").toString();
    }

    static String listOfLists(List<List<Integer>> xss) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < xss.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(list(xss.get(i)));
        }
        return sb.append("]").toString();
    }

    static String commas(long n) {
        return String.format(Locale.ROOT, "%,d", n);
    }

    static int size;
    static Set<Integer> cols, diag1, diag2;
    static List<List<Integer>> solutions;
    static long nodes;

    static void place(int row, List<Integer> board) {
        nodes++;
        if (row == size) {
            solutions.add(new ArrayList<>(board));
            return;
        }
        for (int col = 0; col < size; col++) {
            if (cols.contains(col) || diag1.contains(row - col) || diag2.contains(row + col))
                continue;                                       // prune
            cols.add(col); diag1.add(row - col); diag2.add(row + col);
            board.add(col);
            place(row + 1, board);
            board.remove(board.size() - 1);
            cols.remove(col); diag1.remove(row - col); diag2.remove(row + col);
        }
    }

    static void nQueens(int n) {
        size = n;
        cols = new HashSet<>();
        diag1 = new HashSet<>();                                // r - c
        diag2 = new HashSet<>();                                // r + c
        solutions = new ArrayList<>();
        nodes = 0;
        place(0, new ArrayList<>());
    }

    static long rawNodes, found;

    /** Without pruning: generate every arrangement then filter. */
    static void placeNoPrune(int n, int row, int[] board) {
        rawNodes++;
        if (row == n) {
            boolean ok = true;
            for (int r1 = 0; r1 < n; r1++) {
                for (int r2 = r1 + 1; r2 < n; r2++) {
                    if (board[r1] == board[r2] || Math.abs(board[r1] - board[r2]) == r2 - r1)
                        ok = false;
                }
            }
            if (ok) found++;
            return;
        }
        for (int col = 0; col < n; col++) {
            board[row] = col;
            placeNoPrune(n, row + 1, board);
        }
    }

    static void nQueensNoPrune(int n) {
        rawNodes = 0;
        found = 0;
        placeNoPrune(n, 0, new int[n]);
    }

    public static void main(String[] args) {
        for (int n : new int[]{4, 5, 6, 8}) {
            nQueens(n);
            System.out.printf(Locale.ROOT, "n=%d: %3d solutions, %6s nodes visited   (n^n would be %s)%n",
                    n, solutions.size(), commas(nodes), commas((long) Math.pow(n, n)));
        }

        nQueens(4);
        List<List<Integer>> sols = solutions;
        System.out.println("\\nthe two 4-queens boards (column index per row): " + listOfLists(sols));
        for (List<Integer> board : sols) {
            System.out.println();
            for (int c : board) {
                StringBuilder row = new StringBuilder();
                for (int i = 0; i < 4; i++) row.append(i == c ? "Q" : ".");
                System.out.println("  " + row);
            }
        }

        System.out.println("\\npruned vs unpruned:");
        for (int n : new int[]{4, 6, 8}) {
            nQueens(n);
            long prunedNodes = nodes;
            nQueensNoPrune(n);
            System.out.printf(Locale.ROOT,
                    "  n=%d: pruned %7s nodes    unpruned %9s nodes   ratio %6.1fx%n",
                    n, commas(prunedNodes), commas(rawNodes), (double) rawNodes / prunedNodes);
        }
    }
}`,
            },
            {
              lang: "cpp",
              code: `// Pruning turns a factorial search into something that finishes.
#include <cmath>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <set>
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

string listOfLists(const vector<vector<int>>& xss) {
    string out = "[";
    for (size_t i = 0; i < xss.size(); i++) {
        if (i) out += ", ";
        out += list(xss[i]);
    }
    return out + "]";
}

string commas(long long n) {
    string s = to_string(n), out;
    int c = 0;
    for (int i = (int)s.size() - 1; i >= 0; i--) {
        out += s[i];
        if (++c % 3 == 0 && i > 0) out += ',';
    }
    return string(out.rbegin(), out.rend());
}

struct Search {
    int n;
    set<int> cols, diag1, diag2;      // diag1 is r - c, diag2 is r + c
    vector<vector<int>> solutions;
    long long nodes = 0;

    void place(int row, vector<int>& board) {
        nodes++;
        if (row == n) {
            solutions.push_back(board);
            return;
        }
        for (int col = 0; col < n; col++) {
            if (cols.count(col) || diag1.count(row - col) || diag2.count(row + col))
                continue;                                       // prune
            cols.insert(col); diag1.insert(row - col); diag2.insert(row + col);
            board.push_back(col);
            place(row + 1, board);
            board.pop_back();
            cols.erase(col); diag1.erase(row - col); diag2.erase(row + col);
        }
    }
};

Search nQueens(int n) {
    Search s;
    s.n = n;
    vector<int> board;
    s.place(0, board);
    return s;
}

// Without pruning: generate every arrangement then filter.
struct RawSearch {
    int n;
    long long nodes = 0, found = 0;

    void place(int row, vector<int>& board) {
        nodes++;
        if (row == n) {
            bool ok = true;
            for (int r1 = 0; r1 < n; r1++)
                for (int r2 = r1 + 1; r2 < n; r2++)
                    if (board[r1] == board[r2] || abs(board[r1] - board[r2]) == r2 - r1)
                        ok = false;
            if (ok) found++;
            return;
        }
        for (int col = 0; col < n; col++) {
            board.push_back(col);
            place(row + 1, board);
            board.pop_back();
        }
    }
};

RawSearch nQueensNoPrune(int n) {
    RawSearch s;
    s.n = n;
    vector<int> board;
    s.place(0, board);
    return s;
}

int main() {
    for (int n : {4, 5, 6, 8}) {
        Search s = nQueens(n);
        long long pow = 1;
        for (int i = 0; i < n; i++) pow *= n;
        cout << "n=" << n << ": " << setw(3) << s.solutions.size()
             << " solutions, " << setw(6) << commas(s.nodes)
             << " nodes visited   (n^n would be " << commas(pow) << ")\\n";
    }

    Search four = nQueens(4);
    cout << "\\nthe two 4-queens boards (column index per row): "
         << listOfLists(four.solutions) << "\\n";
    for (const auto& board : four.solutions) {
        cout << "\\n";
        for (int c : board) {
            string row;
            for (int i = 0; i < 4; i++) row += (i == c ? 'Q' : '.');
            cout << "  " << row << "\\n";
        }
    }

    cout << "\\npruned vs unpruned:\\n";
    for (int n : {4, 6, 8}) {
        long long prunedNodes = nQueens(n).nodes;
        long long rawNodes = nQueensNoPrune(n).nodes;
        cout << "  n=" << n << ": pruned " << setw(7) << commas(prunedNodes)
             << " nodes    unpruned " << setw(9) << commas(rawNodes)
             << " nodes   ratio " << setw(6) << fixed << setprecision(1)
             << (double)rawNodes / prunedNodes << "x\\n";
    }
}`,
            },
            {
              lang: "rust",
              code: `// Pruning turns a factorial search into something that finishes.
use std::collections::HashSet;

fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn list_of_lists(xss: &[Vec<i32>]) -> String {
    let parts: Vec<String> = xss.iter().map(|x| list(x)).collect();
    format!("[{}]", parts.join(", "))
}

fn commas(n: u64) -> String {
    let s = n.to_string();
    let mut out = String::new();
    for (i, ch) in s.chars().enumerate() {
        if i > 0 && (s.len() - i) % 3 == 0 {
            out.push(',');
        }
        out.push(ch);
    }
    out
}

struct Search {
    n: i32,
    cols: HashSet<i32>,
    diag1: HashSet<i32>, // r - c
    diag2: HashSet<i32>, // r + c
    solutions: Vec<Vec<i32>>,
    nodes: u64,
}

impl Search {
    fn place(&mut self, row: i32, board: &mut Vec<i32>) {
        self.nodes += 1;
        if row == self.n {
            self.solutions.push(board.clone());
            return;
        }
        for col in 0..self.n {
            if self.cols.contains(&col)
                || self.diag1.contains(&(row - col))
                || self.diag2.contains(&(row + col))
            {
                continue; // prune
            }
            self.cols.insert(col);
            self.diag1.insert(row - col);
            self.diag2.insert(row + col);
            board.push(col);
            self.place(row + 1, board);
            board.pop();
            self.cols.remove(&col);
            self.diag1.remove(&(row - col));
            self.diag2.remove(&(row + col));
        }
    }
}

fn n_queens(n: i32) -> Search {
    let mut s = Search {
        n,
        cols: HashSet::new(),
        diag1: HashSet::new(),
        diag2: HashSet::new(),
        solutions: Vec::new(),
        nodes: 0,
    };
    let mut board = Vec::new();
    s.place(0, &mut board);
    s
}

/// Without pruning: generate every arrangement then filter.
struct RawSearch {
    n: i32,
    nodes: u64,
    found: u64,
}

impl RawSearch {
    fn place(&mut self, row: i32, board: &mut Vec<i32>) {
        self.nodes += 1;
        if row == self.n {
            let mut ok = true;
            for r1 in 0..self.n as usize {
                for r2 in r1 + 1..self.n as usize {
                    if board[r1] == board[r2]
                        || (board[r1] - board[r2]).abs() == (r2 - r1) as i32
                    {
                        ok = false;
                    }
                }
            }
            if ok {
                self.found += 1;
            }
            return;
        }
        for col in 0..self.n {
            board.push(col);
            self.place(row + 1, board);
            board.pop();
        }
    }
}

fn n_queens_no_prune(n: i32) -> RawSearch {
    let mut s = RawSearch { n, nodes: 0, found: 0 };
    let mut board = Vec::new();
    s.place(0, &mut board);
    s
}

fn main() {
    for n in [4i32, 5, 6, 8] {
        let s = n_queens(n);
        let pow = (n as u64).pow(n as u32);
        println!(
            "n={}: {:3} solutions, {:>6} nodes visited   (n^n would be {})",
            n,
            s.solutions.len(),
            commas(s.nodes),
            commas(pow)
        );
    }

    let four = n_queens(4);
    println!(
        "\\nthe two 4-queens boards (column index per row): {}",
        list_of_lists(&four.solutions)
    );
    for board in &four.solutions {
        println!();
        for c in board {
            let row: String = (0..4).map(|i| if i == *c { 'Q' } else { '.' }).collect();
            println!("  {}", row);
        }
    }

    println!("\\npruned vs unpruned:");
    for n in [4i32, 6, 8] {
        let pruned_nodes = n_queens(n).nodes;
        let raw_nodes = n_queens_no_prune(n).nodes;
        println!(
            "  n={}: pruned {:>7} nodes    unpruned {:>9} nodes   ratio {:>6.1}x",
            n,
            commas(pruned_nodes),
            commas(raw_nodes),
            raw_nodes as f64 / pruned_nodes as f64
        );
    }
}`,
            },
            {
              lang: "go",
              code: `// Pruning turns a factorial search into something that finishes.
package main

import (
	"fmt"
	"slices"
	"strings"
)

func list(xs []int) string {
	parts := make([]string, len(xs))
	for i, x := range xs {
		parts[i] = fmt.Sprint(x)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func listOfLists(xss [][]int) string {
	parts := make([]string, len(xss))
	for i, xs := range xss {
		parts[i] = list(xs)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func commas(n int) string {
	s := fmt.Sprint(n)
	var b strings.Builder
	for i, ch := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			b.WriteByte(',')
		}
		b.WriteRune(ch)
	}
	return b.String()
}

func nQueens(n int) (solutions [][]int, nodes int) {
	cols := map[int]bool{}
	diag1 := map[int]bool{} // r - c
	diag2 := map[int]bool{} // r + c
	board := []int{}
	var place func(row int)
	place = func(row int) {
		nodes++
		if row == n {
			solutions = append(solutions, slices.Clone(board))
			return
		}
		for col := 0; col < n; col++ {
			if cols[col] || diag1[row-col] || diag2[row+col] {
				continue // prune
			}
			cols[col], diag1[row-col], diag2[row+col] = true, true, true
			board = append(board, col)
			place(row + 1)
			board = board[:len(board)-1]
			delete(cols, col)
			delete(diag1, row-col)
			delete(diag2, row+col)
		}
	}
	place(0)
	return solutions, nodes
}

// Without pruning: generate every arrangement then filter.
func nQueensNoPrune(n int) (found, nodes int) {
	board := make([]int, n)
	var place func(row int)
	place = func(row int) {
		nodes++
		if row == n {
			ok := true
			for r1 := 0; r1 < n; r1++ {
				for r2 := r1 + 1; r2 < n; r2++ {
					d := board[r1] - board[r2]
					if d < 0 {
						d = -d
					}
					if board[r1] == board[r2] || d == r2-r1 {
						ok = false
					}
				}
			}
			if ok {
				found++
			}
			return
		}
		for col := 0; col < n; col++ {
			board[row] = col
			place(row + 1)
		}
	}
	place(0)
	return found, nodes
}

func main() {
	for _, n := range []int{4, 5, 6, 8} {
		solutions, nodes := nQueens(n)
		pow := 1
		for i := 0; i < n; i++ {
			pow *= n
		}
		fmt.Printf("n=%d: %3d solutions, %6s nodes visited   (n^n would be %s)\\n",
			n, len(solutions), commas(nodes), commas(pow))
	}

	sols, _ := nQueens(4)
	fmt.Println("\\nthe two 4-queens boards (column index per row):", listOfLists(sols))
	for _, board := range sols {
		fmt.Println()
		for _, c := range board {
			row := []byte("....")
			row[c] = 'Q'
			fmt.Println("  " + string(row))
		}
	}

	fmt.Println("\\npruned vs unpruned:")
	for _, n := range []int{4, 6, 8} {
		_, prunedNodes := nQueens(n)
		_, rawNodes := nQueensNoPrune(n)
		fmt.Printf("  n=%d: pruned %7s nodes    unpruned %9s nodes   ratio %6.1fx\\n",
			n, commas(prunedNodes), commas(rawNodes), float64(rawNodes)/float64(prunedNodes))
	}
}`,
            },
          ],
        },
      ],
    },
    {
      id: "o1-checks",
      heading: "Checking constraints in O(1)",
      body: [
        "The pruning above never scans the board. Three sets do the work, and the diagonal encoding is the part worth knowing.",
        "**Columns.** A set of occupied column indices.",
        "**One diagonal.** Every square on a ↘ diagonal has the same `row - col`. So a set of those values marks the occupied ones.",
        "**The other diagonal.** Every square on a ↙ diagonal has the same `row + col`.",
        "That is three O(1) lookups per candidate square instead of an O(n) scan of the placed queens — and it is a general move: **find an invariant that identifies the constraint class, and index by it.** In sudoku the equivalent is `box = (row / 3) * 3 + col / 3`.",
      ],
    },
    {
      id: "the-family",
      heading: "The constraint family",
      body: [
        "**Sudoku Solver.** State: nine row sets, nine column sets, nine box sets. Choose the empty cell with the *fewest* remaining candidates rather than the first one — that single heuristic, called most-constrained-variable, is usually the difference between instant and hopeless.",
        "**Word Search.** The grid is the state. Mark a cell as visited on the way in, unmark on the way out — the un-choose again. Prune by checking the next character before recursing rather than after.",
        "**Combination Sum.** Sort the candidates, then `break` rather than `continue` once the running total exceeds the target: everything after it in a sorted list is worse. That turns a `continue` into a whole-subtree cut.",
        "**Palindrome Partitioning.** Precompute which substrings are palindromes with a DP table, so the check inside the search is O(1) rather than O(n).",
      ],
      pitfalls: [
        {
          title: "Checking validity at the leaves",
          body: "This is what the unpruned version above does, and it is brute force wearing a recursion. If your `if row == n` block contains a validity check, the pruning belongs further up.",
        },
        {
          title: "Rescanning the partial solution on every candidate",
          body: "An O(depth) validity check inside an O(n) loop at every level multiplies straight into the total. Maintain incremental state — sets, counters, bitmasks — and update it in the choose and un-choose steps.",
        },
        {
          title: "`continue` where `break` is correct",
          body: "On sorted input, once a candidate is too large every later one is too. `break` cuts the remaining siblings *and* their subtrees; `continue` visits them all to reject them individually. Same answer, very different cost.",
        },
      ],
    },
  ],
  takeaways: [
    "Reject partial candidates as early as possible — that discards whole subtrees",
    "Pruning changes the base of the exponential, so the gap grows with n",
    "Encode constraints so checks are O(1): `row - col` and `row + col` for diagonals",
    "Maintain incremental state in the choose/un-choose steps, never rescan",
    "On sorted candidates, `break` beats `continue` once the bound is exceeded",
    "Choose the most-constrained variable next when you have the freedom to",
  ],
  status: "available",
};
