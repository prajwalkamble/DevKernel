import type { Lesson } from "@/content/types";

export const rotatedAnd2dLesson: Lesson = {
  id: "dsa-bs-rotated",
  slug: "rotated-arrays-matrices-and-unbounded-input",
  moduleSlug: "binary-search",
  title: "Rotated Arrays, Matrices & Unbounded Input",
  summary:
    "Three variants that look like different problems and are the same one. What binary search actually needs is not a sorted array — it is a way to discard half.",
  estimatedMinutes: 35,
  objectives: [
    "Search a rotated sorted array in one pass",
    "Find the rotation pivot without finding the target first",
    "Search a row-major sorted matrix by index arithmetic",
    "Handle an unbounded or streamed input by doubling first",
    "State the real precondition for binary search",
  ],
  sections: [
    {
      id: "real-precondition",
      heading: "What binary search actually requires",
      body: [
        "The usual statement — \"the array must be sorted\" — is sufficient but not necessary, and believing it is what makes the variants below look like separate tricks.",
        "The real requirement is weaker: **at every step you must be able to look at the middle and rule out one side entirely.** Sorted order is the most common way to earn that, not the only one.",
        "Once you hold it that way, a rotated array is obviously searchable — one half is always sorted, so you can always rule out a side — and \"binary search on the answer\" in the next lesson stops looking like a different technique.",
      ],
    },
    {
      id: "rotated",
      heading: "Rotated sorted arrays",
      body: [
        "A sorted array rotated at some unknown pivot: `[12, 16, 23, 38, 56, 2, 5, 8]`. Cut it anywhere and **at least one half is still sorted** — the pivot can only be in one of them. Work out which half is sorted, check whether the target falls in its range, and go there or to the other side.",
      ],
      examples: [
        {
          id: "rotated",
          title: "Rotated search, the pivot, and a matrix",
          lang: "python",
          code: `def search_rotated(a, target):
    """One half of a rotated sorted array is always sorted. Decide which, then
    ask whether the target lies inside it."""
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if a[mid] == target:
            return mid
        if a[lo] <= a[mid]:                 # left half is sorted
            if a[lo] <= target < a[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:                                # right half is sorted
            if a[mid] < target <= a[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1

r = [12, 16, 23, 38, 56, 2, 5, 8]
print("rotated:", r)
for t in (56, 2, 12, 8, 99):
    print(f"  search {t:2} -> {search_rotated(r, t)}")

def find_min_rotated(a):
    """The pivot: the only element smaller than its predecessor."""
    lo, hi = 0, len(a) - 1
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if a[mid] > a[hi]:
            lo = mid + 1
        else:
            hi = mid
    return lo

print("\\npivot index:", find_min_rotated(r), "value:", r[find_min_rotated(r)])
print("unrotated  :", find_min_rotated([1, 2, 3, 4]), "(already sorted)")

def search_matrix(m, target):
    """A row-major sorted matrix is one sorted array with index arithmetic."""
    if not m or not m[0]:
        return False
    rows, cols = len(m), len(m[0])
    lo, hi = 0, rows * cols
    while lo < hi:
        mid = lo + (hi - lo) // 2
        v = m[mid // cols][mid % cols]
        if v == target:
            return True
        if v < target:
            lo = mid + 1
        else:
            hi = mid
    return False

mat = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]]
print("\\nmatrix:", mat)
for t in (3, 16, 60, 13):
    print(f"  contains {t:2}: {search_matrix(mat, t)}")`,
          output: `rotated: [12, 16, 23, 38, 56, 2, 5, 8]
  search 56 -> 4
  search  2 -> 5
  search 12 -> 0
  search  8 -> 7
  search 99 -> -1

pivot index: 5 value: 2
unrotated  : 0 (already sorted)

matrix: [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]]
  contains  3: True
  contains 16: True
  contains 60: True
  contains 13: False`,
          explanation:
            "Three details earn their place. `a[lo] <= a[mid]` uses `<=` rather than `<` so that a two-element window, where `lo == mid`, is read as sorted-left rather than falling into the wrong branch.\n\nThe **pivot search compares against `a[hi]`, not `a[lo]`**. Comparing against `a[lo]` cannot distinguish an unrotated array from a fully rotated one; comparing against the right end works in both cases, which is why `find_min_rotated([1,2,3,4])` correctly returns 0 with no special case.\n\nThe **matrix** is not a 2D problem at all. `m` rows of `n` columns sorted row-major is one sorted sequence of `m*n` elements, and `mid // cols` with `mid % cols` converts a flat index back. Same loop, different accessor.",
          alternates: [
            {
              lang: "javascript",
              code: `// One half of a rotated sorted array is always sorted. Decide which, then
// ask whether the target lies inside it.
const list = (xs) => "[" + xs.join(", ") + "]";
const grid = (m) => "[" + m.map(list).join(", ") + "]";
const padL = (v, w) => String(v).padStart(w);

function searchRotated(a, target) {
  let lo = 0;
  let hi = a.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (a[mid] === target) return mid;
    if (a[lo] <= a[mid]) {                    // left half is sorted
      if (a[lo] <= target && target < a[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {                                  // right half is sorted
      if (a[mid] < target && target <= a[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}

const r = [12, 16, 23, 38, 56, 2, 5, 8];
console.log("rotated:", list(r));
for (const t of [56, 2, 12, 8, 99]) {
  console.log(\`  search \${padL(t, 2)} -> \${searchRotated(r, t)}\`);
}

// The pivot: the only element smaller than its predecessor.
function findMinRotated(a) {
  let lo = 0;
  let hi = a.length - 1;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (a[mid] > a[hi]) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

console.log("\\npivot index:", findMinRotated(r), "value:", r[findMinRotated(r)]);
console.log("unrotated  :", findMinRotated([1, 2, 3, 4]), "(already sorted)");

// A row-major sorted matrix is one sorted array with index arithmetic.
function searchMatrix(m, target) {
  if (m.length === 0 || m[0].length === 0) return false;
  const rows = m.length;
  const cols = m[0].length;
  let lo = 0;
  let hi = rows * cols;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const v = m[Math.floor(mid / cols)][mid % cols];
    if (v === target) return true;
    if (v < target) lo = mid + 1;
    else hi = mid;
  }
  return false;
}

const mat = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]];
console.log("\\nmatrix:", grid(mat));
for (const t of [3, 16, 60, 13]) {
  console.log(\`  contains \${padL(t, 2)}: \${searchMatrix(mat, t)}\`);
}`,
              output: `rotated: [12, 16, 23, 38, 56, 2, 5, 8]
  search 56 -> 4
  search  2 -> 5
  search 12 -> 0
  search  8 -> 7
  search 99 -> -1

pivot index: 5 value: 2
unrotated  : 0 (already sorted)

matrix: [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]]
  contains  3: true
  contains 16: true
  contains 60: true
  contains 13: false`,
            },
            {
              lang: "typescript",
              code: `// One half of a rotated sorted array is always sorted. Decide which, then
// ask whether the target lies inside it.
const list = (xs: number[]): string => "[" + xs.join(", ") + "]";
const grid = (m: number[][]): string => "[" + m.map(list).join(", ") + "]";
const padL = (v: number, w: number): string => String(v).padStart(w);

function searchRotated(a: number[], target: number): number {
  let lo = 0;
  let hi = a.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (a[mid] === target) return mid;
    if (a[lo] <= a[mid]) {                    // left half is sorted
      if (a[lo] <= target && target < a[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {                                  // right half is sorted
      if (a[mid] < target && target <= a[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}

const r: number[] = [12, 16, 23, 38, 56, 2, 5, 8];
console.log("rotated:", list(r));
for (const t of [56, 2, 12, 8, 99]) {
  console.log(\`  search \${padL(t, 2)} -> \${searchRotated(r, t)}\`);
}

// The pivot: the only element smaller than its predecessor.
function findMinRotated(a: number[]): number {
  let lo = 0;
  let hi = a.length - 1;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (a[mid] > a[hi]) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

console.log("\\npivot index:", findMinRotated(r), "value:", r[findMinRotated(r)]);
console.log("unrotated  :", findMinRotated([1, 2, 3, 4]), "(already sorted)");

// A row-major sorted matrix is one sorted array with index arithmetic.
function searchMatrix(m: number[][], target: number): boolean {
  if (m.length === 0 || m[0].length === 0) return false;
  const rows = m.length;
  const cols = m[0].length;
  let lo = 0;
  let hi = rows * cols;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const v = m[Math.floor(mid / cols)][mid % cols];
    if (v === target) return true;
    if (v < target) lo = mid + 1;
    else hi = mid;
  }
  return false;
}

const mat: number[][] = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]];
console.log("\\nmatrix:", grid(mat));
for (const t of [3, 16, 60, 13]) {
  console.log(\`  contains \${padL(t, 2)}: \${searchMatrix(mat, t)}\`);
}`,
              output: `rotated: [12, 16, 23, 38, 56, 2, 5, 8]
  search 56 -> 4
  search  2 -> 5
  search 12 -> 0
  search  8 -> 7
  search 99 -> -1

pivot index: 5 value: 2
unrotated  : 0 (already sorted)

matrix: [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]]
  contains  3: true
  contains 16: true
  contains 60: true
  contains 13: false`,
            },
            {
              lang: "java",
              code: `import java.util.*;

public class Main {
    static String list(int[] xs) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < xs.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(xs[i]);
        }
        return sb.append("]").toString();
    }

    static String grid(int[][] m) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < m.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(list(m[i]));
        }
        return sb.append("]").toString();
    }

    /** One half of a rotated sorted array is always sorted. Decide which, then
        ask whether the target lies inside it. */
    static int searchRotated(int[] a, int target) {
        int lo = 0, hi = a.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] == target) return mid;
            if (a[lo] <= a[mid]) {                   // left half is sorted
                if (a[lo] <= target && target < a[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {                                 // right half is sorted
                if (a[mid] < target && target <= a[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return -1;
    }

    /** The pivot: the only element smaller than its predecessor. */
    static int findMinRotated(int[] a) {
        int lo = 0, hi = a.length - 1;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] > a[hi]) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    /** A row-major sorted matrix is one sorted array with index arithmetic. */
    static boolean searchMatrix(int[][] m, int target) {
        if (m.length == 0 || m[0].length == 0) return false;
        int rows = m.length, cols = m[0].length;
        int lo = 0, hi = rows * cols;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            int v = m[mid / cols][mid % cols];
            if (v == target) return true;
            if (v < target) lo = mid + 1;
            else hi = mid;
        }
        return false;
    }

    public static void main(String[] args) {
        int[] r = {12, 16, 23, 38, 56, 2, 5, 8};
        System.out.println("rotated: " + list(r));
        for (int t : new int[]{56, 2, 12, 8, 99}) {
            System.out.printf("  search %2d -> %d%n", t, searchRotated(r, t));
        }

        System.out.println("\\npivot index: " + findMinRotated(r)
                + " value: " + r[findMinRotated(r)]);
        System.out.println("unrotated  : " + findMinRotated(new int[]{1, 2, 3, 4})
                + " (already sorted)");

        int[][] mat = {{1, 3, 5, 7}, {10, 11, 16, 20}, {23, 30, 34, 60}};
        System.out.println("\\nmatrix: " + grid(mat));
        for (int t : new int[]{3, 16, 60, 13}) {
            System.out.printf("  contains %2d: %b%n", t, searchMatrix(mat, t));
        }
    }
}`,
              output: `rotated: [12, 16, 23, 38, 56, 2, 5, 8]
  search 56 -> 4
  search  2 -> 5
  search 12 -> 0
  search  8 -> 7
  search 99 -> -1

pivot index: 5 value: 2
unrotated  : 0 (already sorted)

matrix: [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]]
  contains  3: true
  contains 16: true
  contains 60: true
  contains 13: false`,
            },
            {
              lang: "cpp",
              code: `// One half of a rotated sorted array is always sorted. Decide which, then
// ask whether the target lies inside it.
#include <iomanip>
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

string grid(const vector<vector<int>>& m) {
    string out = "[";
    for (size_t i = 0; i < m.size(); i++) {
        if (i) out += ", ";
        out += list(m[i]);
    }
    return out + "]";
}

int searchRotated(const vector<int>& a, int target) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == target) return mid;
        if (a[lo] <= a[mid]) {                    // left half is sorted
            if (a[lo] <= target && target < a[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {                                  // right half is sorted
            if (a[mid] < target && target <= a[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}

// The pivot: the only element smaller than its predecessor.
int findMinRotated(const vector<int>& a) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] > a[hi]) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}

// A row-major sorted matrix is one sorted array with index arithmetic.
bool searchMatrix(const vector<vector<int>>& m, int target) {
    if (m.empty() || m[0].empty()) return false;
    int rows = (int)m.size(), cols = (int)m[0].size();
    int lo = 0, hi = rows * cols;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        int v = m[mid / cols][mid % cols];
        if (v == target) return true;
        if (v < target) lo = mid + 1;
        else hi = mid;
    }
    return false;
}

int main() {
    vector<int> r = {12, 16, 23, 38, 56, 2, 5, 8};
    cout << "rotated: " << list(r) << "\\n";
    for (int t : {56, 2, 12, 8, 99}) {
        cout << "  search " << setw(2) << t << " -> " << searchRotated(r, t) << "\\n";
    }

    cout << "\\npivot index: " << findMinRotated(r) << " value: " << r[findMinRotated(r)] << "\\n";
    cout << "unrotated  : " << findMinRotated({1, 2, 3, 4}) << " (already sorted)\\n";

    vector<vector<int>> mat = {{1, 3, 5, 7}, {10, 11, 16, 20}, {23, 30, 34, 60}};
    cout << "\\nmatrix: " << grid(mat) << "\\n";
    for (int t : {3, 16, 60, 13}) {
        cout << "  contains " << setw(2) << t << ": " << boolalpha
             << searchMatrix(mat, t) << "\\n";
    }
}`,
              output: `rotated: [12, 16, 23, 38, 56, 2, 5, 8]
  search 56 -> 4
  search  2 -> 5
  search 12 -> 0
  search  8 -> 7
  search 99 -> -1

pivot index: 5 value: 2
unrotated  : 0 (already sorted)

matrix: [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]]
  contains  3: true
  contains 16: true
  contains 60: true
  contains 13: false`,
            },
            {
              lang: "rust",
              code: `// One half of a rotated sorted array is always sorted. Decide which, then
// ask whether the target lies inside it.
fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn grid(m: &[Vec<i32>]) -> String {
    let parts: Vec<String> = m.iter().map(|r| list(r)).collect();
    format!("[{}]", parts.join(", "))
}

fn search_rotated(a: &[i32], target: i32) -> i32 {
    let (mut lo, mut hi) = (0i32, a.len() as i32 - 1);
    while lo <= hi {
        let mid = lo + (hi - lo) / 2;
        let (m, l, h) = (mid as usize, lo as usize, hi as usize);
        if a[m] == target {
            return mid;
        }
        if a[l] <= a[m] {
            // left half is sorted
            if a[l] <= target && target < a[m] {
                hi = mid - 1;
            } else {
                lo = mid + 1;
            }
        } else {
            // right half is sorted
            if a[m] < target && target <= a[h] {
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
    }
    -1
}

/// The pivot: the only element smaller than its predecessor.
fn find_min_rotated(a: &[i32]) -> usize {
    let (mut lo, mut hi) = (0usize, a.len() - 1);
    while lo < hi {
        let mid = lo + (hi - lo) / 2;
        if a[mid] > a[hi] {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }
    lo
}

/// A row-major sorted matrix is one sorted array with index arithmetic.
fn search_matrix(m: &[Vec<i32>], target: i32) -> bool {
    if m.is_empty() || m[0].is_empty() {
        return false;
    }
    let (rows, cols) = (m.len(), m[0].len());
    let (mut lo, mut hi) = (0usize, rows * cols);
    while lo < hi {
        let mid = lo + (hi - lo) / 2;
        let v = m[mid / cols][mid % cols];
        if v == target {
            return true;
        }
        if v < target {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }
    false
}

fn main() {
    let r = [12, 16, 23, 38, 56, 2, 5, 8];
    println!("rotated: {}", list(&r));
    for t in [56, 2, 12, 8, 99] {
        println!("  search {:2} -> {}", t, search_rotated(&r, t));
    }

    println!("\\npivot index: {} value: {}", find_min_rotated(&r), r[find_min_rotated(&r)]);
    println!("unrotated  : {} (already sorted)", find_min_rotated(&[1, 2, 3, 4]));

    let mat = vec![vec![1, 3, 5, 7], vec![10, 11, 16, 20], vec![23, 30, 34, 60]];
    println!("\\nmatrix: {}", grid(&mat));
    for t in [3, 16, 60, 13] {
        println!("  contains {:2}: {}", t, search_matrix(&mat, t));
    }
}`,
              output: `rotated: [12, 16, 23, 38, 56, 2, 5, 8]
  search 56 -> 4
  search  2 -> 5
  search 12 -> 0
  search  8 -> 7
  search 99 -> -1

pivot index: 5 value: 2
unrotated  : 0 (already sorted)

matrix: [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]]
  contains  3: true
  contains 16: true
  contains 60: true
  contains 13: false`,
            },
            {
              lang: "go",
              code: `// One half of a rotated sorted array is always sorted. Decide which, then
// ask whether the target lies inside it.
package main

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

func grid(m [][]int) string {
	parts := make([]string, len(m))
	for i, r := range m {
		parts[i] = list(r)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func searchRotated(a []int, target int) int {
	lo, hi := 0, len(a)-1
	for lo <= hi {
		mid := lo + (hi-lo)/2
		if a[mid] == target {
			return mid
		}
		if a[lo] <= a[mid] { // left half is sorted
			if a[lo] <= target && target < a[mid] {
				hi = mid - 1
			} else {
				lo = mid + 1
			}
		} else { // right half is sorted
			if a[mid] < target && target <= a[hi] {
				lo = mid + 1
			} else {
				hi = mid - 1
			}
		}
	}
	return -1
}

// The pivot: the only element smaller than its predecessor.
func findMinRotated(a []int) int {
	lo, hi := 0, len(a)-1
	for lo < hi {
		mid := lo + (hi-lo)/2
		if a[mid] > a[hi] {
			lo = mid + 1
		} else {
			hi = mid
		}
	}
	return lo
}

// A row-major sorted matrix is one sorted array with index arithmetic.
func searchMatrix(m [][]int, target int) bool {
	if len(m) == 0 || len(m[0]) == 0 {
		return false
	}
	rows, cols := len(m), len(m[0])
	lo, hi := 0, rows*cols
	for lo < hi {
		mid := lo + (hi-lo)/2
		v := m[mid/cols][mid%cols]
		if v == target {
			return true
		}
		if v < target {
			lo = mid + 1
		} else {
			hi = mid
		}
	}
	return false
}

func main() {
	r := []int{12, 16, 23, 38, 56, 2, 5, 8}
	fmt.Println("rotated:", list(r))
	for _, t := range []int{56, 2, 12, 8, 99} {
		fmt.Printf("  search %2d -> %d\\n", t, searchRotated(r, t))
	}

	fmt.Println("\\npivot index:", findMinRotated(r), "value:", r[findMinRotated(r)])
	fmt.Println("unrotated  :", findMinRotated([]int{1, 2, 3, 4}), "(already sorted)")

	mat := [][]int{{1, 3, 5, 7}, {10, 11, 16, 20}, {23, 30, 34, 60}}
	fmt.Println("\\nmatrix:", grid(mat))
	for _, t := range []int{3, 16, 60, 13} {
		fmt.Printf("  contains %2d: %t\\n", t, searchMatrix(mat, t))
	}
}`,
              output: `rotated: [12, 16, 23, 38, 56, 2, 5, 8]
  search 56 -> 4
  search  2 -> 5
  search 12 -> 0
  search  8 -> 7
  search 99 -> -1

pivot index: 5 value: 2
unrotated  : 0 (already sorted)

matrix: [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]]
  contains  3: true
  contains 16: true
  contains 60: true
  contains 13: false`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Duplicates break the rotated search",
          body: "With `[3, 1, 3, 3, 3]`, `a[lo] == a[mid] == a[hi]` and you cannot tell which half is sorted. The standard fix is to shrink both ends by one when they are equal — which degrades the worst case to O(n), and provably so: no algorithm can do better, because the duplicates hide the pivot.",
        },
        {
          title: "A matrix sorted by row *and* column is a different problem",
          body: "If each row is sorted and each column is sorted, but rows do not continue from one another, the flat-index trick is wrong. That variant is solved by starting at the top-right corner and stepping left or down — O(m + n), not O(log mn).",
        },
      ],
    },
    {
      id: "unbounded",
      heading: "Unbounded input: find a ceiling first",
      body: [
        "Sometimes there is no `len` — an infinite stream, an API you can only index, or a monotone function you can evaluate but not enumerate. Binary search needs an upper bound, so **manufacture one by doubling**: probe index 1, 2, 4, 8, 16 until the value exceeds the target, then binary search between the last two probes.",
        "The doubling costs O(log p) probes to bracket a target at position p, and the search costs another O(log p). Total is still logarithmic — and this is the same idea that makes a dynamic array's amortised append O(1).",
      ],
    },
  ],
  takeaways: [
    "The requirement is being able to discard half, not sortedness as such",
    "In a rotated array one half is always sorted — find it, then test the range",
    "Use `a[lo] <= a[mid]` so a two-element window behaves",
    "Find the pivot by comparing against `a[hi]`, which handles the unrotated case free",
    "A row-major sorted matrix is one array; convert with `mid // cols` and `mid % cols`",
    "Row-and-column sorted is a different problem — walk from the top-right corner",
    "With no upper bound, double until you overshoot, then search the last bracket",
  ],
  status: "available",
};
