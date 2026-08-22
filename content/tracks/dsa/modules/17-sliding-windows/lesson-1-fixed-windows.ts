import type { Lesson } from "@/content/types";

export const fixedWindowsLesson: Lesson = {
  id: "dsa-sw-fixed",
  slug: "fixed-size-windows",
  moduleSlug: "sliding-windows",
  title: "Fixed-Size Windows: One In, One Out",
  summary:
    "The simplest version of the pattern, and the one that makes the idea obvious: when the window is a fixed width, moving it is two arithmetic operations rather than a recomputation.",
  estimatedMinutes: 25,
  objectives: [
    "Write the fixed-window loop with an incremental update",
    "Compare the operation count against recomputing each window",
    "Identify what \"window state\" means for a given problem",
    "Handle the first window separately and say why",
  ],
  sections: [
    {
      id: "the-idea",
      heading: "The redundancy the pattern removes",
      body: [
        "Maximum sum of any three consecutive elements. The obvious solution slides a window and adds up its contents each time — and almost all of that addition is repeated work. Two adjacent windows of width three share **two** of their three elements.",
        "The fix is the whole pattern: **maintain the state incrementally.** When the window moves one place right, one element enters and one leaves. Add the entering value, subtract the leaving one, and the sum is up to date in two operations regardless of how wide the window is.",
      ],
      examples: [
        {
          id: "fixed",
          title: "One in, one out",
          lang: "python",
          code: `def max_sum_fixed(a, k, trace=False):
    """Fixed window: add the entering element, drop the leaving one."""
    if len(a) < k:
        return None
    total = sum(a[:k])
    best = total
    if trace:
        print(f"  window {a[:k]} sum={total}")
    for right in range(k, len(a)):
        total += a[right] - a[right - k]
        if trace:
            print(f"  +{a[right]:3} -{a[right - k]:3} -> {a[right - k + 1:right + 1]} sum={total}")
        best = max(best, total)
    return best

a = [2, 1, 5, 1, 3, 2, 7, 1]
print("array:", a, " k=3")
print("max sum:", max_sum_fixed(a, 3, trace=True))

# the recompute-every-window version, for the cost comparison
def max_sum_naive(a, k):
    ops = 0
    best = None
    for i in range(len(a) - k + 1):
        s = 0
        for j in range(i, i + k):
            s += a[j]
            ops += 1
        best = s if best is None else max(best, s)
    return best, ops

def max_sum_ops(a, k):
    total = sum(a[:k])
    ops = k
    best = total
    for right in range(k, len(a)):
        total += a[right] - a[right - k]
        ops += 2
        best = max(best, total)
    return best, ops

n, k = 10_000, 500
big = [i % 17 for i in range(n)]
print(f"\\nn={n}, k={k}")
print("  sliding:", max_sum_ops(big, k)[1], "operations")
print("  naive  :", max_sum_naive(big, k)[1], "operations")`,
          output: `array: [2, 1, 5, 1, 3, 2, 7, 1]  k=3
  window [2, 1, 5] sum=8
  +  1 -  2 -> [1, 5, 1] sum=7
  +  3 -  1 -> [5, 1, 3] sum=9
  +  2 -  5 -> [1, 3, 2] sum=6
  +  7 -  1 -> [3, 2, 7] sum=12
  +  1 -  3 -> [2, 7, 1] sum=10
max sum: 12

n=10000, k=500
  sliding: 19500 operations
  naive  : 4750500 operations`,
          explanation:
            "Nineteen thousand operations against four and three-quarter million — a factor of 244, which is roughly `k / 2` as the arithmetic predicts. The naive version is O(n·k); the sliding one is O(n) **regardless of k**, and that independence from the window width is the property worth remembering.",
          alternates: [
            {
              lang: "javascript",
              code: `// Fixed window: add the entering element, drop the leaving one.
const list = (xs) => "[" + xs.join(", ") + "]";
const pad = (v, w) => String(v).padStart(w);

function maxSumFixed(a, k, trace = false) {
  if (a.length < k) return null;
  let total = a.slice(0, k).reduce((s, v) => s + v, 0);
  let best = total;
  if (trace) console.log(\`  window \${list(a.slice(0, k))} sum=\${total}\`);
  for (let right = k; right < a.length; right++) {
    total += a[right] - a[right - k];
    if (trace) {
      console.log(
        \`  +\${pad(a[right], 3)} -\${pad(a[right - k], 3)} -> \${list(a.slice(right - k + 1, right + 1))} sum=\${total}\`
      );
    }
    best = Math.max(best, total);
  }
  return best;
}

const a = [2, 1, 5, 1, 3, 2, 7, 1];
console.log("array:", list(a), " k=3");
console.log("max sum:", maxSumFixed(a, 3, true));

// the recompute-every-window version, for the cost comparison
function maxSumNaive(a, k) {
  let ops = 0;
  let best = null;
  for (let i = 0; i + k <= a.length; i++) {
    let s = 0;
    for (let j = i; j < i + k; j++) {
      s += a[j];
      ops++;
    }
    best = best === null ? s : Math.max(best, s);
  }
  return { best, ops };
}

function maxSumOps(a, k) {
  let total = a.slice(0, k).reduce((s, v) => s + v, 0);
  let ops = k;
  let best = total;
  for (let right = k; right < a.length; right++) {
    total += a[right] - a[right - k];
    ops += 2;
    best = Math.max(best, total);
  }
  return { best, ops };
}

const n = 10000;
const k = 500;
const big = Array.from({ length: n }, (_, i) => i % 17);
console.log(\`\\nn=\${n}, k=\${k}\`);
console.log("  sliding:", maxSumOps(big, k).ops, "operations");
console.log("  naive  :", maxSumNaive(big, k).ops, "operations");`,
            },
            {
              lang: "typescript",
              code: `// Fixed window: add the entering element, drop the leaving one.
const list = (xs: number[]): string => "[" + xs.join(", ") + "]";
const pad = (v: number, w: number): string => String(v).padStart(w);

function maxSumFixed(a: number[], k: number, trace = false): number | null {
  if (a.length < k) return null;
  let total = a.slice(0, k).reduce((s, v) => s + v, 0);
  let best = total;
  if (trace) console.log(\`  window \${list(a.slice(0, k))} sum=\${total}\`);
  for (let right = k; right < a.length; right++) {
    total += a[right] - a[right - k];
    if (trace) {
      console.log(
        \`  +\${pad(a[right], 3)} -\${pad(a[right - k], 3)} -> \${list(a.slice(right - k + 1, right + 1))} sum=\${total}\`
      );
    }
    best = Math.max(best, total);
  }
  return best;
}

const a: number[] = [2, 1, 5, 1, 3, 2, 7, 1];
console.log("array:", list(a), " k=3");
console.log("max sum:", maxSumFixed(a, 3, true));

// the recompute-every-window version, for the cost comparison
function maxSumNaive(a: number[], k: number): { best: number | null; ops: number } {
  let ops = 0;
  let best: number | null = null;
  for (let i = 0; i + k <= a.length; i++) {
    let s = 0;
    for (let j = i; j < i + k; j++) {
      s += a[j];
      ops++;
    }
    best = best === null ? s : Math.max(best, s);
  }
  return { best, ops };
}

function maxSumOps(a: number[], k: number): { best: number; ops: number } {
  let total = a.slice(0, k).reduce((s, v) => s + v, 0);
  let ops = k;
  let best = total;
  for (let right = k; right < a.length; right++) {
    total += a[right] - a[right - k];
    ops += 2;
    best = Math.max(best, total);
  }
  return { best, ops };
}

const n = 10000;
const k = 500;
const big = Array.from({ length: n }, (_, i) => i % 17);
console.log(\`\\nn=\${n}, k=\${k}\`);
console.log("  sliding:", maxSumOps(big, k).ops, "operations");
console.log("  naive  :", maxSumNaive(big, k).ops, "operations");`,
            },
            {
              lang: "java",
              code: `import java.util.*;

public class Main {
    static String list(int[] xs, int from, int to) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = from; i < to; i++) {
            if (i > from) sb.append(", ");
            sb.append(xs[i]);
        }
        return sb.append("]").toString();
    }

    static String list(int[] xs) {
        return list(xs, 0, xs.length);
    }

    /** Fixed window: add the entering element, drop the leaving one. */
    static Integer maxSumFixed(int[] a, int k, boolean trace) {
        if (a.length < k) return null;
        int total = 0;
        for (int i = 0; i < k; i++) total += a[i];
        int best = total;
        if (trace) System.out.println("  window " + list(a, 0, k) + " sum=" + total);
        for (int right = k; right < a.length; right++) {
            total += a[right] - a[right - k];
            if (trace) {
                System.out.printf("  +%3d -%3d -> %s sum=%d%n",
                        a[right], a[right - k], list(a, right - k + 1, right + 1), total);
            }
            best = Math.max(best, total);
        }
        return best;
    }

    /** the recompute-every-window version, for the cost comparison */
    static long maxSumNaiveOps(int[] a, int k) {
        long ops = 0;
        Integer best = null;
        for (int i = 0; i + k <= a.length; i++) {
            int s = 0;
            for (int j = i; j < i + k; j++) {
                s += a[j];
                ops++;
            }
            best = best == null ? s : Math.max(best, s);
        }
        return ops;
    }

    static long maxSumOps(int[] a, int k) {
        int total = 0;
        for (int i = 0; i < k; i++) total += a[i];
        long ops = k;
        int best = total;
        for (int right = k; right < a.length; right++) {
            total += a[right] - a[right - k];
            ops += 2;
            best = Math.max(best, total);
        }
        return ops;
    }

    public static void main(String[] args) {
        int[] a = {2, 1, 5, 1, 3, 2, 7, 1};
        System.out.println("array: " + list(a) + "  k=3");
        System.out.println("max sum: " + maxSumFixed(a, 3, true));

        int n = 10000, k = 500;
        int[] big = new int[n];
        for (int i = 0; i < n; i++) big[i] = i % 17;
        System.out.println("\\nn=" + n + ", k=" + k);
        System.out.println("  sliding: " + maxSumOps(big, k) + " operations");
        System.out.println("  naive  : " + maxSumNaiveOps(big, k) + " operations");
    }
}`,
            },
            {
              lang: "cpp",
              code: `// Fixed window: add the entering element, drop the leaving one.
#include <algorithm>
#include <iostream>
#include <optional>
#include <string>
#include <vector>
using namespace std;

string list(const vector<int>& xs, size_t from, size_t to) {
    string out = "[";
    for (size_t i = from; i < to; i++) {
        if (i > from) out += ", ";
        out += to_string(xs[i]);
    }
    return out + "]";
}

string list(const vector<int>& xs) { return list(xs, 0, xs.size()); }

string pad(int v, int w) {
    string s = to_string(v);
    return string(max(0, w - (int)s.size()), ' ') + s;
}

optional<int> maxSumFixed(const vector<int>& a, size_t k, bool trace) {
    if (a.size() < k) return nullopt;
    int total = 0;
    for (size_t i = 0; i < k; i++) total += a[i];
    int best = total;
    if (trace) cout << "  window " << list(a, 0, k) << " sum=" << total << "\\n";
    for (size_t right = k; right < a.size(); right++) {
        total += a[right] - a[right - k];
        if (trace) {
            cout << "  +" << pad(a[right], 3) << " -" << pad(a[right - k], 3)
                 << " -> " << list(a, right - k + 1, right + 1)
                 << " sum=" << total << "\\n";
        }
        best = max(best, total);
    }
    return best;
}

// the recompute-every-window version, for the cost comparison
long long maxSumNaiveOps(const vector<int>& a, size_t k) {
    long long ops = 0;
    for (size_t i = 0; i + k <= a.size(); i++) {
        int s = 0;
        for (size_t j = i; j < i + k; j++) {
            s += a[j];
            ops++;
        }
        (void)s;
    }
    return ops;
}

long long maxSumOps(const vector<int>& a, size_t k) {
    int total = 0;
    for (size_t i = 0; i < k; i++) total += a[i];
    long long ops = (long long)k;
    int best = total;
    for (size_t right = k; right < a.size(); right++) {
        total += a[right] - a[right - k];
        ops += 2;
        best = max(best, total);
    }
    (void)best;
    return ops;
}

int main() {
    vector<int> a = {2, 1, 5, 1, 3, 2, 7, 1};
    cout << "array: " << list(a) << "  k=3\\n";
    // Computed before the print: \`<<\` runs left to right, so streaming the
    // label first would put it above the trace the call emits.
    auto best = maxSumFixed(a, 3, true);
    cout << "max sum: " << *best << "\\n";

    int n = 10000, k = 500;
    vector<int> big(n);
    for (int i = 0; i < n; i++) big[i] = i % 17;
    cout << "\\nn=" << n << ", k=" << k << "\\n";
    cout << "  sliding: " << maxSumOps(big, k) << " operations\\n";
    cout << "  naive  : " << maxSumNaiveOps(big, k) << " operations\\n";
}`,
            },
            {
              lang: "rust",
              code: `// Fixed window: add the entering element, drop the leaving one.
fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn max_sum_fixed(a: &[i32], k: usize, trace: bool) -> Option<i32> {
    if a.len() < k {
        return None;
    }
    let mut total: i32 = a[..k].iter().sum();
    let mut best = total;
    if trace {
        println!("  window {} sum={}", list(&a[..k]), total);
    }
    for right in k..a.len() {
        total += a[right] - a[right - k];
        if trace {
            println!(
                "  +{:3} -{:3} -> {} sum={}",
                a[right],
                a[right - k],
                list(&a[right - k + 1..right + 1]),
                total
            );
        }
        best = best.max(total);
    }
    Some(best)
}

/// the recompute-every-window version, for the cost comparison
fn max_sum_naive_ops(a: &[i32], k: usize) -> u64 {
    let mut ops = 0u64;
    for i in 0..=a.len() - k {
        let mut s = 0;
        for j in i..i + k {
            s += a[j];
            ops += 1;
        }
        let _ = s;
    }
    ops
}

fn max_sum_ops(a: &[i32], k: usize) -> u64 {
    let mut total: i32 = a[..k].iter().sum();
    let mut ops = k as u64;
    let mut best = total;
    for right in k..a.len() {
        total += a[right] - a[right - k];
        ops += 2;
        best = best.max(total);
    }
    let _ = best;
    ops
}

fn main() {
    let a = [2, 1, 5, 1, 3, 2, 7, 1];
    println!("array: {}  k=3", list(&a));
    println!("max sum: {}", max_sum_fixed(&a, 3, true).unwrap());

    let (n, k) = (10_000usize, 500usize);
    let big: Vec<i32> = (0..n).map(|i| (i % 17) as i32).collect();
    println!("\\nn={}, k={}", n, k);
    println!("  sliding: {} operations", max_sum_ops(&big, k));
    println!("  naive  : {} operations", max_sum_naive_ops(&big, k));
}`,
            },
            {
              lang: "go",
              code: `// Fixed window: add the entering element, drop the leaving one.
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

func maxSumFixed(a []int, k int, trace bool) (int, bool) {
	if len(a) < k {
		return 0, false
	}
	total := 0
	for _, v := range a[:k] {
		total += v
	}
	best := total
	if trace {
		fmt.Printf("  window %s sum=%d\\n", list(a[:k]), total)
	}
	for right := k; right < len(a); right++ {
		total += a[right] - a[right-k]
		if trace {
			fmt.Printf("  +%3d -%3d -> %s sum=%d\\n",
				a[right], a[right-k], list(a[right-k+1:right+1]), total)
		}
		best = max(best, total)
	}
	return best, true
}

// the recompute-every-window version, for the cost comparison
func maxSumNaiveOps(a []int, k int) int {
	ops := 0
	for i := 0; i+k <= len(a); i++ {
		s := 0
		for j := i; j < i+k; j++ {
			s += a[j]
			ops++
		}
		_ = s
	}
	return ops
}

func maxSumOps(a []int, k int) int {
	total := 0
	for _, v := range a[:k] {
		total += v
	}
	ops := k
	best := total
	for right := k; right < len(a); right++ {
		total += a[right] - a[right-k]
		ops += 2
		best = max(best, total)
	}
	_ = best
	return ops
}

func main() {
	a := []int{2, 1, 5, 1, 3, 2, 7, 1}
	fmt.Println("array:", list(a), " k=3")
	best, _ := maxSumFixed(a, 3, true)
	fmt.Println("max sum:", best)

	n, k := 10000, 500
	big := make([]int, n)
	for i := range big {
		big[i] = i % 17
	}
	fmt.Printf("\\nn=%d, k=%d\\n", n, k)
	fmt.Println("  sliding:", maxSumOps(big, k), "operations")
	fmt.Println("  naive  :", maxSumNaiveOps(big, k), "operations")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "window-state",
      heading: "What \"state\" means",
      body: [
        "The sum is the easy case. The pattern generalises to any summary of the window that can be updated in O(1) when one element enters and one leaves.",
        "**A sum** — add and subtract. **A frequency map** — increment the entering key, decrement the leaving one, and delete it at zero. **A count of distinct values** — the size of that map. **An average** — the sum divided by k. **A maximum** — this one is *not* O(1), because removing the current maximum forces you to find the next one; it needs a monotonic deque, which the stacks-and-queues module covers.",
        "Before writing a window, ask what the state is and whether both the entering and the leaving update are cheap. If removal is expensive, the plain window is not enough.",
      ],
      pitfalls: [
        {
          title: "Building the first window inside the loop",
          body: "The incremental update needs an element to leave, and for the first window there is none. Either fill the first window before the loop, as above, or guard with `if right >= k`. Trying to do both in one loop without a guard reads `a[-1]` in Python — the *last* element — which is a wrong answer rather than an error.",
        },
        {
          title: "Forgetting the `len(a) < k` case",
          body: "A window wider than the array has no valid position. Returning `sum(a[:k])` silently gives the sum of the whole array, which passes small tests and fails the edge case the grader always includes.",
        },
      ],
    },
  ],
  takeaways: [
    "Adjacent windows share all but two elements; the pattern stops recomputing them",
    "Add the entering element, subtract the leaving one — two operations",
    "Cost is O(n) regardless of the window width",
    "State can be a sum, a frequency map, or a distinct count",
    "A window *maximum* is not O(1) to maintain — that needs a monotonic deque",
    "Build the first window before the loop, and handle `len(a) < k`",
  ],
  status: "available",
};
