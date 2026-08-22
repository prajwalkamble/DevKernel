import type { Lesson } from "@/content/types";

export const oppositeEndsLesson: Lesson = {
  id: "dsa-tp-opposite",
  slug: "opposite-ends-and-the-invariant",
  moduleSlug: "two-pointers",
  title: "Opposite Ends & the Invariant",
  summary:
    "Two indices walking towards each other turn an n² search into an n one. The mechanics take a minute; the reason it is allowed to skip what it skips is the part worth an hour.",
  estimatedMinutes: 30,
  objectives: [
    "Write the opposite-ends loop on a sorted array",
    "State the invariant it maintains",
    "Explain what each pointer move discards, and why none of it was needed",
    "Count the steps and derive the O(n) bound",
    "Recognise the precondition that makes it applicable",
  ],
  sections: [
    {
      id: "the-shape",
      heading: "The shape",
      body: [
        "A sorted array and a target sum. Put one index at each end. Look at the pair.",
        "If the sum is **too small**, the only way to increase it is to move the left pointer right — the right pointer is already on the largest available value. If the sum is **too big**, move the right pointer left. If it matches, you are done.",
        "Each step moves one pointer one place, and they only ever move towards each other, so the loop runs at most `n - 1` times. That is the whole algorithm.",
      ],
      examples: [
        {
          id: "two-sum-sorted",
          title: "Two Sum on a sorted array, traced",
          lang: "python",
          code: `def two_sum_sorted(a, target, trace=False):
    """Opposite ends. Each step discards a row or a column of the n^2 grid."""
    lo, hi = 0, len(a) - 1
    steps = 0
    while lo < hi:
        steps += 1
        s = a[lo] + a[hi]
        if trace:
            print(f"  a[{lo}]={a[lo]:3} + a[{hi}]={a[hi]:3} = {s:4}"
                  f"  {'too small' if s < target else 'too big' if s > target else 'FOUND'}")
        if s == target:
            return (lo, hi), steps
        if s < target:
            lo += 1
        else:
            hi -= 1
    return None, steps

def fmt(pair):
    return "not found" if pair is None else f"({pair[0]}, {pair[1]})"

a = [2, 5, 8, 12, 16, 23, 38, 56]
print("array:", a)
print("\\ntarget 39:")
pair, steps = two_sum_sorted(a, 39, trace=True)
print(f"  -> {fmt(pair)} in {steps} steps")

print("\\ntarget 100 (absent):")
pair, steps = two_sum_sorted(a, 100, trace=True)
print(f"  -> {fmt(pair)} in {steps} steps")

# the brute force, for the same input
def brute(a, target):
    checks = 0
    for i in range(len(a)):
        for j in range(i + 1, len(a)):
            checks += 1
            if a[i] + a[j] == target:
                return (i, j), checks
    return None, checks

print("\\ncomparison for target 39:")
print("  two pointers:", two_sum_sorted(a, 39)[1], "steps")
print("  brute force :", brute(a, 39)[1], "checks")
n = len(a)
print(f"  n={n}: at most {n - 1} steps vs {n * (n - 1) // 2} pairs")`,
          output: `array: [2, 5, 8, 12, 16, 23, 38, 56]

target 39:
  a[0]=  2 + a[7]= 56 =   58  too big
  a[0]=  2 + a[6]= 38 =   40  too big
  a[0]=  2 + a[5]= 23 =   25  too small
  a[1]=  5 + a[5]= 23 =   28  too small
  a[2]=  8 + a[5]= 23 =   31  too small
  a[3]= 12 + a[5]= 23 =   35  too small
  a[4]= 16 + a[5]= 23 =   39  FOUND
  -> (4, 5) in 7 steps

target 100 (absent):
  a[0]=  2 + a[7]= 56 =   58  too small
  a[1]=  5 + a[7]= 56 =   61  too small
  a[2]=  8 + a[7]= 56 =   64  too small
  a[3]= 12 + a[7]= 56 =   68  too small
  a[4]= 16 + a[7]= 56 =   72  too small
  a[5]= 23 + a[7]= 56 =   79  too small
  a[6]= 38 + a[7]= 56 =   94  too small
  -> not found in 7 steps

comparison for target 39:
  two pointers: 7 steps
  brute force : 23 checks
  n=8: at most 7 steps vs 28 pairs`,
          explanation:
            "Seven steps against twenty-eight possible pairs, on an array of eight. At n = 1000 it is 999 steps against half a million. The gap is the whole point of the pattern, and it comes from never examining a pair at all — not from examining pairs faster.",
          alternates: [
            {
              lang: "javascript",
              code: `// Opposite ends. Each step discards a row or a column of the n^2 grid.
const pad = (v, w) => String(v).padStart(w);

function twoSumSorted(a, target, trace = false) {
  let lo = 0;
  let hi = a.length - 1;
  let steps = 0;
  while (lo < hi) {
    steps++;
    const s = a[lo] + a[hi];
    if (trace) {
      const verdict = s < target ? "too small" : s > target ? "too big" : "FOUND";
      console.log(
        \`  a[\${lo}]=\${pad(a[lo], 3)} + a[\${hi}]=\${pad(a[hi], 3)} = \${pad(s, 4)}  \${verdict}\`
      );
    }
    if (s === target) return { pair: [lo, hi], steps };
    if (s < target) lo++;
    else hi--;
  }
  return { pair: null, steps };
}

const fmt = (pair) => (pair === null ? "not found" : \`(\${pair[0]}, \${pair[1]})\`);

const a = [2, 5, 8, 12, 16, 23, 38, 56];
console.log("array: [" + a.join(", ") + "]");
console.log("\\ntarget 39:");
let r = twoSumSorted(a, 39, true);
console.log(\`  -> \${fmt(r.pair)} in \${r.steps} steps\`);

console.log("\\ntarget 100 (absent):");
r = twoSumSorted(a, 100, true);
console.log(\`  -> \${fmt(r.pair)} in \${r.steps} steps\`);

// the brute force, for the same input
function brute(a, target) {
  let checks = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = i + 1; j < a.length; j++) {
      checks++;
      if (a[i] + a[j] === target) return checks;
    }
  }
  return checks;
}

console.log("\\ncomparison for target 39:");
console.log("  two pointers:", twoSumSorted(a, 39).steps, "steps");
console.log("  brute force :", brute(a, 39), "checks");
const n = a.length;
console.log(\`  n=\${n}: at most \${n - 1} steps vs \${(n * (n - 1)) / 2} pairs\`);`,
            },
            {
              lang: "typescript",
              code: `// Opposite ends. Each step discards a row or a column of the n^2 grid.
const pad = (v: number, w: number): string => String(v).padStart(w);

interface Result {
  pair: [number, number] | null;
  steps: number;
}

function twoSumSorted(a: number[], target: number, trace = false): Result {
  let lo = 0;
  let hi = a.length - 1;
  let steps = 0;
  while (lo < hi) {
    steps++;
    const s = a[lo] + a[hi];
    if (trace) {
      const verdict = s < target ? "too small" : s > target ? "too big" : "FOUND";
      console.log(
        \`  a[\${lo}]=\${pad(a[lo], 3)} + a[\${hi}]=\${pad(a[hi], 3)} = \${pad(s, 4)}  \${verdict}\`
      );
    }
    if (s === target) return { pair: [lo, hi], steps };
    if (s < target) lo++;
    else hi--;
  }
  return { pair: null, steps };
}

const fmt = (pair: [number, number] | null): string =>
  pair === null ? "not found" : \`(\${pair[0]}, \${pair[1]})\`;

const a: number[] = [2, 5, 8, 12, 16, 23, 38, 56];
console.log("array: [" + a.join(", ") + "]");
console.log("\\ntarget 39:");
let r = twoSumSorted(a, 39, true);
console.log(\`  -> \${fmt(r.pair)} in \${r.steps} steps\`);

console.log("\\ntarget 100 (absent):");
r = twoSumSorted(a, 100, true);
console.log(\`  -> \${fmt(r.pair)} in \${r.steps} steps\`);

// the brute force, for the same input
function brute(a: number[], target: number): number {
  let checks = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = i + 1; j < a.length; j++) {
      checks++;
      if (a[i] + a[j] === target) return checks;
    }
  }
  return checks;
}

console.log("\\ncomparison for target 39:");
console.log("  two pointers:", twoSumSorted(a, 39).steps, "steps");
console.log("  brute force :", brute(a, 39), "checks");
const n = a.length;
console.log(\`  n=\${n}: at most \${n - 1} steps vs \${(n * (n - 1)) / 2} pairs\`);`,
            },
            {
              lang: "java",
              code: `import java.util.*;

public class Main {
    /** Opposite ends. Each step discards a row or a column of the n^2 grid. */
    static int steps;

    static int[] twoSumSorted(int[] a, int target, boolean trace) {
        int lo = 0, hi = a.length - 1;
        steps = 0;
        while (lo < hi) {
            steps++;
            int s = a[lo] + a[hi];
            if (trace) {
                String verdict = s < target ? "too small" : s > target ? "too big" : "FOUND";
                System.out.printf("  a[%d]=%3d + a[%d]=%3d = %4d  %s%n",
                        lo, a[lo], hi, a[hi], s, verdict);
            }
            if (s == target) return new int[]{lo, hi};
            if (s < target) lo++;
            else hi--;
        }
        return null;
    }

    static String fmt(int[] pair) {
        return pair == null ? "not found" : "(" + pair[0] + ", " + pair[1] + ")";
    }

    static int brute(int[] a, int target) {
        int checks = 0;
        for (int i = 0; i < a.length; i++) {
            for (int j = i + 1; j < a.length; j++) {
                checks++;
                if (a[i] + a[j] == target) return checks;
            }
        }
        return checks;
    }

    public static void main(String[] args) {
        int[] a = {2, 5, 8, 12, 16, 23, 38, 56};
        System.out.println("array: " + Arrays.toString(a));
        System.out.println("\\ntarget 39:");
        int[] pair = twoSumSorted(a, 39, true);
        System.out.println("  -> " + fmt(pair) + " in " + steps + " steps");

        System.out.println("\\ntarget 100 (absent):");
        pair = twoSumSorted(a, 100, true);
        System.out.println("  -> " + fmt(pair) + " in " + steps + " steps");

        System.out.println("\\ncomparison for target 39:");
        twoSumSorted(a, 39, false);
        System.out.println("  two pointers: " + steps + " steps");
        System.out.println("  brute force : " + brute(a, 39) + " checks");
        int n = a.length;
        System.out.println("  n=" + n + ": at most " + (n - 1)
                + " steps vs " + (n * (n - 1) / 2) + " pairs");
    }
}`,
            },
            {
              lang: "cpp",
              code: `// Opposite ends. Each step discards a row or a column of the n^2 grid.
#include <iomanip>
#include <iostream>
#include <optional>
#include <utility>
#include <vector>
using namespace std;

int steps;

optional<pair<int, int>> twoSumSorted(const vector<int>& a, int target, bool trace) {
    int lo = 0, hi = (int)a.size() - 1;
    steps = 0;
    while (lo < hi) {
        steps++;
        int s = a[lo] + a[hi];
        if (trace) {
            string verdict = s < target ? "too small" : s > target ? "too big" : "FOUND";
            cout << "  a[" << lo << "]=" << setw(3) << a[lo]
                 << " + a[" << hi << "]=" << setw(3) << a[hi]
                 << " = " << setw(4) << s << "  " << verdict << "\\n";
        }
        if (s == target) return make_pair(lo, hi);
        if (s < target) lo++;
        else hi--;
    }
    return nullopt;
}

string fmt(const optional<pair<int, int>>& p) {
    if (!p) return "not found";
    return "(" + to_string(p->first) + ", " + to_string(p->second) + ")";
}

int brute(const vector<int>& a, int target) {
    int checks = 0;
    for (size_t i = 0; i < a.size(); i++)
        for (size_t j = i + 1; j < a.size(); j++) {
            checks++;
            if (a[i] + a[j] == target) return checks;
        }
    return checks;
}

int main() {
    vector<int> a = {2, 5, 8, 12, 16, 23, 38, 56};
    cout << "array: [";
    for (size_t i = 0; i < a.size(); i++) cout << (i ? ", " : "") << a[i];
    cout << "]\\n";

    cout << "\\ntarget 39:\\n";
    auto pair39 = twoSumSorted(a, 39, true);
    cout << "  -> " << fmt(pair39) << " in " << steps << " steps\\n";

    cout << "\\ntarget 100 (absent):\\n";
    auto pair100 = twoSumSorted(a, 100, true);
    cout << "  -> " << fmt(pair100) << " in " << steps << " steps\\n";

    cout << "\\ncomparison for target 39:\\n";
    twoSumSorted(a, 39, false);
    cout << "  two pointers: " << steps << " steps\\n";
    cout << "  brute force : " << brute(a, 39) << " checks\\n";
    int n = (int)a.size();
    cout << "  n=" << n << ": at most " << n - 1
         << " steps vs " << n * (n - 1) / 2 << " pairs\\n";
}`,
            },
            {
              lang: "rust",
              code: `// Opposite ends. Each step discards a row or a column of the n^2 grid.
fn two_sum_sorted(a: &[i32], target: i32, trace: bool) -> (Option<(usize, usize)>, usize) {
    let (mut lo, mut hi) = (0usize, a.len() - 1);
    let mut steps = 0;
    while lo < hi {
        steps += 1;
        let s = a[lo] + a[hi];
        if trace {
            let verdict = if s < target {
                "too small"
            } else if s > target {
                "too big"
            } else {
                "FOUND"
            };
            println!(
                "  a[{}]={:3} + a[{}]={:3} = {:4}  {}",
                lo, a[lo], hi, a[hi], s, verdict
            );
        }
        if s == target {
            return (Some((lo, hi)), steps);
        }
        if s < target {
            lo += 1;
        } else {
            hi -= 1;
        }
    }
    (None, steps)
}

fn fmt(pair: Option<(usize, usize)>) -> String {
    match pair {
        None => "not found".to_string(),
        Some((i, j)) => format!("({}, {})", i, j),
    }
}

fn brute(a: &[i32], target: i32) -> usize {
    let mut checks = 0;
    for i in 0..a.len() {
        for j in i + 1..a.len() {
            checks += 1;
            if a[i] + a[j] == target {
                return checks;
            }
        }
    }
    checks
}

fn main() {
    let a = [2, 5, 8, 12, 16, 23, 38, 56];
    let shown: Vec<String> = a.iter().map(|x| x.to_string()).collect();
    println!("array: [{}]", shown.join(", "));

    println!("\\ntarget 39:");
    let (pair, steps) = two_sum_sorted(&a, 39, true);
    println!("  -> {} in {} steps", fmt(pair), steps);

    println!("\\ntarget 100 (absent):");
    let (pair, steps) = two_sum_sorted(&a, 100, true);
    println!("  -> {} in {} steps", fmt(pair), steps);

    println!("\\ncomparison for target 39:");
    println!("  two pointers: {} steps", two_sum_sorted(&a, 39, false).1);
    println!("  brute force : {} checks", brute(&a, 39));
    let n = a.len();
    println!(
        "  n={}: at most {} steps vs {} pairs",
        n,
        n - 1,
        n * (n - 1) / 2
    );
}`,
            },
            {
              lang: "go",
              code: `// Opposite ends. Each step discards a row or a column of the n^2 grid.
package main

import (
	"fmt"
	"strings"
)

func twoSumSorted(a []int, target int, trace bool) ([]int, int) {
	lo, hi := 0, len(a)-1
	steps := 0
	for lo < hi {
		steps++
		s := a[lo] + a[hi]
		if trace {
			verdict := "FOUND"
			if s < target {
				verdict = "too small"
			} else if s > target {
				verdict = "too big"
			}
			fmt.Printf("  a[%d]=%3d + a[%d]=%3d = %4d  %s\\n",
				lo, a[lo], hi, a[hi], s, verdict)
		}
		if s == target {
			return []int{lo, hi}, steps
		}
		if s < target {
			lo++
		} else {
			hi--
		}
	}
	return nil, steps
}

func fmtPair(pair []int) string {
	if pair == nil {
		return "not found"
	}
	return fmt.Sprintf("(%d, %d)", pair[0], pair[1])
}

func brute(a []int, target int) int {
	checks := 0
	for i := range a {
		for j := i + 1; j < len(a); j++ {
			checks++
			if a[i]+a[j] == target {
				return checks
			}
		}
	}
	return checks
}

func main() {
	a := []int{2, 5, 8, 12, 16, 23, 38, 56}
	shown := make([]string, len(a))
	for i, x := range a {
		shown[i] = fmt.Sprint(x)
	}
	fmt.Println("array: [" + strings.Join(shown, ", ") + "]")

	fmt.Println("\\ntarget 39:")
	pair, steps := twoSumSorted(a, 39, true)
	fmt.Printf("  -> %s in %d steps\\n", fmtPair(pair), steps)

	fmt.Println("\\ntarget 100 (absent):")
	pair, steps = twoSumSorted(a, 100, true)
	fmt.Printf("  -> %s in %d steps\\n", fmtPair(pair), steps)

	fmt.Println("\\ncomparison for target 39:")
	_, steps = twoSumSorted(a, 39, false)
	fmt.Println("  two pointers:", steps, "steps")
	fmt.Println("  brute force :", brute(a, 39), "checks")
	n := len(a)
	fmt.Printf("  n=%d: at most %d steps vs %d pairs\\n", n, n-1, n*(n-1)/2)
}`,
            },
          ],
        },
      ],
    },
    {
      id: "the-invariant",
      heading: "The invariant, and what a move throws away",
      body: [
        "The loop maintains: **if a valid pair exists, both of its indices are inside `[lo, hi]`.** Every move must preserve that, and this is where the reasoning lives.",
        "Suppose `a[lo] + a[hi] < target` and we move `lo` rightwards. What did we discard? Every pair `(lo, j)` for `j <= hi`. Is that safe? `a[hi]` is the largest value still in the window, so `a[lo] + a[j] <= a[lo] + a[hi] < target` for every one of them. **Not one of the discarded pairs could have worked.** The move throws away a whole row of the pair grid, and every entry in it was already known to be too small.",
        "The symmetric argument covers moving `hi` when the sum is too big. That is the complete correctness proof, and it is short enough to say out loud in an interview — which is exactly what you will be asked to do.",
      ],
      pitfalls: [
        {
          title: "It needs sorted input, and sorting may not be free",
          body: "The argument above rests entirely on `a[hi]` being the largest remaining value. On unsorted input every step is unjustified. Sorting first costs O(n log n) — which is fine if the answer is the *values*, and wrong if the answer is the *original indices*, because sorting destroys them. LeetCode's Two Sum asks for indices and is a hash-map problem; Two Sum II hands you a sorted array and is this one.",
        },
        {
          title: "`while lo < hi`, not `<=`",
          body: "With `<=` the loop eventually considers the pair `(i, i)`, using one element twice. Almost every problem in this family forbids that.",
        },
      ],
      visual: {
        id: "two-pointers-visual",
        kind: "pattern",
        algorithm: "twopointers",
        lockAlgorithm: true,
        title: "The pointers converging, and what each move discards",
      },
    },
  ],
  takeaways: [
    "Two indices at opposite ends, moving towards each other, is O(n)",
    "The invariant: any valid pair still lies inside the window",
    "Moving `lo` on a too-small sum discards a row that was provably all too small",
    "The correctness argument is two sentences — be ready to say it",
    "Requires sorted input, so it needs values rather than original indices",
    "`while lo < hi` keeps an element from pairing with itself",
  ],
  status: "available",
};
