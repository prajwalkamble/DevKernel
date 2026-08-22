import type { Lesson } from "@/content/types";

export const writingItCorrectlyLesson: Lesson = {
  id: "dsa-bs-correct",
  slug: "writing-binary-search-correctly",
  moduleSlug: "binary-search",
  title: "Writing It Correctly",
  summary:
    "Everybody knows the idea and most people cannot write it without a bug. The fix is not care — it is picking one of the two conventions and never mixing them.",
  estimatedMinutes: 30,
  objectives: [
    "State the loop invariant that makes binary search correct",
    "Write the half-open and closed-interval versions from memory",
    "Explain why the two must never be mixed",
    "Compute the midpoint without overflowing",
    "Justify the O(log n) bound",
  ],
  sections: [
    {
      id: "why-hard",
      heading: "Why an easy idea is a hard function",
      body: [
        "Jon Bentley reported that when he set professional programmers the task of writing binary search, about **ninety per cent** produced a buggy version — given as much time as they wanted, with no compiler pressure. Bentley's own published version, and the one in the JDK, both carried an overflow bug for years.",
        "The idea is trivial: look at the middle, throw away half. The difficulty is entirely in the boundaries, and the reason people get them wrong is that they half-remember two different conventions and blend them.",
        "So this lesson does one thing: names both conventions, states the invariant each one maintains, and insists you pick one.",
      ],
    },
    {
      id: "invariant",
      heading: "The invariant",
      body: [
        "Binary search is a loop that maintains one promise: **if the target is present, it is inside the current window.** Every iteration shrinks the window while keeping that promise true. When the window is empty, the promise says the target was never there.",
        "Everything else follows. `mid` is inside the window. If `a[mid] < target`, the target cannot be at `mid` or to its left, so the window becomes everything right of `mid`. If `a[mid] > target`, the window becomes everything left of it. Getting the boundaries right *is* keeping this promise exactly — no more and no less.",
      ],
      examples: [
        {
          id: "bs-trace",
          title: "The half-open version, traced",
          lang: "python",
          code: `def binary_search(a, target, trace=False):
    """Half-open convention: lo is inclusive, hi is exclusive. hi starts at len."""
    lo, hi = 0, len(a)
    steps = 0
    while lo < hi:
        mid = lo + (hi - lo) // 2
        steps += 1
        if trace:
            print(f"  lo={lo:2} hi={hi:2} mid={mid:2} a[mid]={a[mid]:3}")
        if a[mid] == target:
            return mid, steps
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return -1, steps

a = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
print("array:", a)
print("\\nsearching for 72:")
idx, steps = binary_search(a, 72, trace=True)
print(f"  -> index {idx} in {steps} steps")

print("\\nsearching for 4 (absent):")
idx, steps = binary_search(a, 4, trace=True)
print(f"  -> {idx} in {steps} steps")

# the search space halves; 2^steps covers the array
import math
n = 1_000_000
print(f"\\n{n} elements needs at most {math.ceil(math.log2(n))} comparisons")`,
          output: `array: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]

searching for 72:
  lo= 0 hi=10 mid= 5 a[mid]= 23
  lo= 6 hi=10 mid= 8 a[mid]= 72
  -> index 8 in 2 steps

searching for 4 (absent):
  lo= 0 hi=10 mid= 5 a[mid]= 23
  lo= 0 hi= 5 mid= 2 a[mid]=  8
  lo= 0 hi= 2 mid= 1 a[mid]=  5
  lo= 0 hi= 1 mid= 0 a[mid]=  2
  -> -1 in 4 steps

1000000 elements needs at most 20 comparisons`,
          explanation:
            "Watch the window in the absent case: `[0,10)`, `[0,5)`, `[0,2)`, `[0,1)`, then empty. Each line halves it, and the loop ends when `lo == hi` — a window containing nothing. Twenty comparisons for a million elements is the entire reason this is worth getting right; a linear scan would average half a million.",
          alternates: [
            {
              lang: "javascript",
              code: `// Half-open convention: lo is inclusive, hi is exclusive. hi starts at length.
const list = (xs) => "[" + xs.join(", ") + "]";
const padL = (v, w) => String(v).padStart(w);

function binarySearch(a, target, trace = false) {
  let lo = 0;
  let hi = a.length;
  let steps = 0;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    steps++;
    if (trace) {
      console.log(
        \`  lo=\${padL(lo, 2)} hi=\${padL(hi, 2)} mid=\${padL(mid, 2)} a[mid]=\${padL(a[mid], 3)}\`
      );
    }
    if (a[mid] === target) return { idx: mid, steps };
    if (a[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return { idx: -1, steps };
}

const a = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
console.log("array:", list(a));
console.log("\\nsearching for 72:");
let r = binarySearch(a, 72, true);
console.log(\`  -> index \${r.idx} in \${r.steps} steps\`);

console.log("\\nsearching for 4 (absent):");
r = binarySearch(a, 4, true);
console.log(\`  -> \${r.idx} in \${r.steps} steps\`);

// the search space halves; 2^steps covers the array
const n = 1000000;
console.log(\`\\n\${n} elements needs at most \${Math.ceil(Math.log2(n))} comparisons\`);`,
            },
            {
              lang: "typescript",
              code: `// Half-open convention: lo is inclusive, hi is exclusive. hi starts at length.
const list = (xs: number[]): string => "[" + xs.join(", ") + "]";
const padL = (v: number, w: number): string => String(v).padStart(w);

function binarySearch(a: number[], target: number, trace = false): { idx: number; steps: number } {
  let lo = 0;
  let hi = a.length;
  let steps = 0;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    steps++;
    if (trace) {
      console.log(
        \`  lo=\${padL(lo, 2)} hi=\${padL(hi, 2)} mid=\${padL(mid, 2)} a[mid]=\${padL(a[mid], 3)}\`
      );
    }
    if (a[mid] === target) return { idx: mid, steps };
    if (a[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return { idx: -1, steps };
}

const a: number[] = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
console.log("array:", list(a));
console.log("\\nsearching for 72:");
let r = binarySearch(a, 72, true);
console.log(\`  -> index \${r.idx} in \${r.steps} steps\`);

console.log("\\nsearching for 4 (absent):");
r = binarySearch(a, 4, true);
console.log(\`  -> \${r.idx} in \${r.steps} steps\`);

// the search space halves; 2^steps covers the array
const n = 1000000;
console.log(\`\\n\${n} elements needs at most \${Math.ceil(Math.log2(n))} comparisons\`);`,
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

    static int steps;

    /** Half-open convention: lo is inclusive, hi is exclusive. hi starts at length. */
    static int binarySearch(int[] a, int target, boolean trace) {
        int lo = 0, hi = a.length;
        steps = 0;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            steps++;
            if (trace) {
                System.out.printf("  lo=%2d hi=%2d mid=%2d a[mid]=%3d%n", lo, hi, mid, a[mid]);
            }
            if (a[mid] == target) return mid;
            if (a[mid] < target) lo = mid + 1;
            else hi = mid;
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] a = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
        System.out.println("array: " + list(a));
        System.out.println("\\nsearching for 72:");
        int idx = binarySearch(a, 72, true);
        System.out.println("  -> index " + idx + " in " + steps + " steps");

        System.out.println("\\nsearching for 4 (absent):");
        idx = binarySearch(a, 4, true);
        System.out.println("  -> " + idx + " in " + steps + " steps");

        // the search space halves; 2^steps covers the array
        int n = 1_000_000;
        System.out.println("\\n" + n + " elements needs at most "
                + (int) Math.ceil(Math.log(n) / Math.log(2)) + " comparisons");
    }
}`,
            },
            {
              lang: "cpp",
              code: `// Half-open convention: lo is inclusive, hi is exclusive. hi starts at length.
#include <cmath>
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

int steps;

int binarySearch(const vector<int>& a, int target, bool trace) {
    int lo = 0, hi = (int)a.size();
    steps = 0;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        steps++;
        if (trace) {
            cout << "  lo=" << setw(2) << lo << " hi=" << setw(2) << hi
                 << " mid=" << setw(2) << mid << " a[mid]=" << setw(3) << a[mid] << "\\n";
        }
        if (a[mid] == target) return mid;
        if (a[mid] < target) lo = mid + 1;
        else hi = mid;
    }
    return -1;
}

int main() {
    vector<int> a = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    cout << "array: " << list(a) << "\\n";
    cout << "\\nsearching for 72:\\n";
    int idx = binarySearch(a, 72, true);
    cout << "  -> index " << idx << " in " << steps << " steps\\n";

    cout << "\\nsearching for 4 (absent):\\n";
    idx = binarySearch(a, 4, true);
    cout << "  -> " << idx << " in " << steps << " steps\\n";

    // the search space halves; 2^steps covers the array
    int n = 1000000;
    cout << "\\n" << n << " elements needs at most "
         << (int)ceil(log2((double)n)) << " comparisons\\n";
}`,
            },
            {
              lang: "rust",
              code: `// Half-open convention: lo is inclusive, hi is exclusive. hi starts at length.
fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn binary_search(a: &[i32], target: i32, trace: bool) -> (i32, u32) {
    let (mut lo, mut hi) = (0usize, a.len());
    let mut steps = 0;
    while lo < hi {
        let mid = lo + (hi - lo) / 2;
        steps += 1;
        if trace {
            println!("  lo={:2} hi={:2} mid={:2} a[mid]={:3}", lo, hi, mid, a[mid]);
        }
        if a[mid] == target {
            return (mid as i32, steps);
        }
        if a[mid] < target {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }
    (-1, steps)
}

fn main() {
    let a = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
    println!("array: {}", list(&a));
    println!("\\nsearching for 72:");
    let (idx, steps) = binary_search(&a, 72, true);
    println!("  -> index {} in {} steps", idx, steps);

    println!("\\nsearching for 4 (absent):");
    let (idx, steps) = binary_search(&a, 4, true);
    println!("  -> {} in {} steps", idx, steps);

    // the search space halves; 2^steps covers the array
    let n = 1_000_000u32;
    println!("\\n{} elements needs at most {} comparisons", n, (n as f64).log2().ceil() as u32);
}`,
            },
            {
              lang: "go",
              code: `// Half-open convention: lo is inclusive, hi is exclusive. hi starts at length.
package main

import (
	"fmt"
	"math"
	"strings"
)

func list(xs []int) string {
	parts := make([]string, len(xs))
	for i, x := range xs {
		parts[i] = fmt.Sprint(x)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func binarySearch(a []int, target int, trace bool) (int, int) {
	lo, hi, steps := 0, len(a), 0
	for lo < hi {
		mid := lo + (hi-lo)/2
		steps++
		if trace {
			fmt.Printf("  lo=%2d hi=%2d mid=%2d a[mid]=%3d\\n", lo, hi, mid, a[mid])
		}
		if a[mid] == target {
			return mid, steps
		}
		if a[mid] < target {
			lo = mid + 1
		} else {
			hi = mid
		}
	}
	return -1, steps
}

func main() {
	a := []int{2, 5, 8, 12, 16, 23, 38, 56, 72, 91}
	fmt.Println("array:", list(a))
	fmt.Println("\\nsearching for 72:")
	idx, steps := binarySearch(a, 72, true)
	fmt.Printf("  -> index %d in %d steps\\n", idx, steps)

	fmt.Println("\\nsearching for 4 (absent):")
	idx, steps = binarySearch(a, 4, true)
	fmt.Printf("  -> %d in %d steps\\n", idx, steps)

	// the search space halves; 2^steps covers the array
	n := 1000000
	fmt.Printf("\\n%d elements needs at most %d comparisons\\n", n, int(math.Ceil(math.Log2(float64(n)))))
}`,
            },
          ],
        },
      ],
      visual: {
        id: "binary-search-visual",
        kind: "searching",
        algorithm: "binary",
        title: "The window, halving",
      },
    },
    {
      id: "two-conventions",
      heading: "The two conventions",
      body: [
        "**Half-open, `[lo, hi)`.** `hi` starts at `len(a)` and is *never* a valid index. Loop while `lo < hi`. Move with `lo = mid + 1` or `hi = mid`.",
        "**Closed, `[lo, hi]`.** `hi` starts at `len(a) - 1` and *is* a valid index. Loop while `lo <= hi`. Move with `lo = mid + 1` or `hi = mid - 1`.",
        "Both are correct. They differ in three places — the initial `hi`, the loop test, and the `hi` update — and those three choices are a package. Take two from one and one from the other and you get an infinite loop, an off-by-one, or an index error.",
        "**Pick half-open.** It generalises to `lower_bound` and `upper_bound` without changing shape, which the next lesson depends on, and `hi = len(a)` needs no `- 1` to forget.",
      ],
      examples: [
        {
          id: "bs-bugs",
          title: "The three failures, each shown happening",
          lang: "python",
          code: `# The three bugs, each shown failing then fixed.

# 1. The infinite loop: mid rounds down, so lo = mid does not advance.
def broken_infinite(a, target, budget=6):
    lo, hi = 0, len(a) - 1
    spins = 0
    while lo < hi:
        mid = (lo + hi) // 2
        spins += 1
        if spins > budget:
            return f"still spinning at lo={lo} hi={hi} mid={mid}"
        if a[mid] < target:
            lo = mid          # BUG: should be mid + 1
        else:
            hi = mid
    return f"settled at {lo}"

a = [1, 3, 5, 7]
print("closed-interval with lo = mid :", broken_infinite(a, 7))

# 2. Off-by-one: hi = len(a) with a <= condition reads past the end.
def broken_bounds(a, target):
    lo, hi = 0, len(a)          # exclusive upper bound...
    while lo <= hi:             # ...but an inclusive test
        mid = (lo + hi) // 2
        try:
            if a[mid] == target:
                return mid
        except IndexError:
            return f"IndexError at mid={mid}, len={len(a)}"
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

print("mixed conventions            :", broken_bounds([1, 3, 5, 7], 9))

# 3. The correct pair, stated once each.
def half_open(a, target):
    lo, hi = 0, len(a)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if a[mid] == target:
            return mid
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return -1

def closed(a, target):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if a[mid] == target:
            return mid
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

b = [2, 4, 6, 8, 10]
print("\\nboth conventions agree:")
for t in (2, 6, 10, 5):
    print(f"  target {t:2}: half-open {half_open(b, t):2}   closed {closed(b, t):2}")`,
          output: `closed-interval with lo = mid : still spinning at lo=2 hi=3 mid=2
mixed conventions            : IndexError at mid=4, len=4

both conventions agree:
  target  2: half-open  0   closed  0
  target  6: half-open  2   closed  2
  target 10: half-open  4   closed  4
  target  5: half-open -1   closed -1`,
          explanation:
            "The infinite loop is the instructive one. With `lo = 2, hi = 3`, `mid` is `(2+3)//2 = 2`, and `lo = mid` sets `lo` to 2 — exactly where it already was. Nothing shrinks, forever. Integer division rounding *down* is what makes `lo = mid` unsafe and `hi = mid` safe; if it rounded up, the danger would swap sides.",
        },
      ],
    },
    {
      id: "midpoint",
      heading: "The midpoint, and the JDK's nine-year bug",
      body: [
        "`(lo + hi) / 2` is wrong in any fixed-width language. Both values can be individually valid and their sum overflow, and the result is a negative index.",
        "`lo + (hi - lo) / 2` is exactly equal whenever the first is correct, and correct when it is not — because `hi - lo` is a difference between two in-range values and is therefore in range itself.",
      ],
      examples: [
        {
          id: "bs-java",
          title: "Java, and what a negative return means",
          lang: "java",
          code: `import java.util.*;

public class Main {
    // Half-open. hi is exclusive, so it starts at length and never indexes.
    static int search(int[] a, int target) {
        int lo = 0, hi = a.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;      // never overflows
            if (a[mid] == target) return mid;
            if (a[mid] < target) lo = mid + 1;
            else hi = mid;
        }
        return -1;
    }

    static int lowerBound(int[] a, int target) {
        int lo = 0, hi = a.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] < target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    public static void main(String[] args) {
        int[] a = {2, 4, 6, 8, 10, 12};
        System.out.println("search(8)      = " + search(a, 8));
        System.out.println("search(7)      = " + search(a, 7));
        System.out.println("lowerBound(7)  = " + lowerBound(a, 7));
        System.out.println("lowerBound(2)  = " + lowerBound(a, 2));
        System.out.println("lowerBound(99) = " + lowerBound(a, 99) + " (== length)");

        // The library, and what its negative return actually means.
        int found = Arrays.binarySearch(a, 8);
        int missing = Arrays.binarySearch(a, 7);
        System.out.println("\\nArrays.binarySearch(8) = " + found);
        System.out.println("Arrays.binarySearch(7) = " + missing
            + "  -> insertion point " + (-missing - 1));

        // The overflow the JDK itself shipped for nine years.
        int lo = 2_000_000_000, hi = 2_100_000_000;
        System.out.println("\\n(lo + hi) / 2      = " + ((lo + hi) / 2));
        System.out.println("lo + (hi - lo) / 2 = " + (lo + (hi - lo) / 2));
    }
}`,
          output: `search(8)      = 3
search(7)      = -1
lowerBound(7)  = 3
lowerBound(2)  = 0
lowerBound(99) = 6 (== length)

Arrays.binarySearch(8) = 3
Arrays.binarySearch(7) = -4  -> insertion point 3

(lo + hi) / 2      = -97483648
lo + (hi - lo) / 2 = 2050000000`,
          explanation:
            "`Arrays.binarySearch` returning `-4` is not an error code. The contract is `-(insertion point) - 1`, so `-4` means the value belongs at index 3 — the same answer `lowerBound` gives directly. The encoding exists because `0` is a valid index and a plain `-1` could not distinguish \"belongs at the front\" from \"not found\".",
        },
      ],
      pitfalls: [
        {
          title: "The array must actually be sorted",
          body: "Binary search on unsorted data does not error — it returns a confident wrong answer, and often finds the element anyway on small inputs, which is how the bug survives testing. If a problem does not state that the input is sorted, sorting first costs O(n log n) and destroys the advantage; think about whether you needed a hash map instead.",
        },
        {
          title: "`Arrays.binarySearch` on an unsorted array is undefined, not an error",
          body: "The JDK documents this explicitly: the result is unspecified. It will not throw.",
        },
      ],
    },
  ],
  takeaways: [
    "The invariant: if the target exists, it is inside the current window",
    "Half-open `[lo, hi)`: `hi = len`, loop while `lo < hi`, move `hi = mid`",
    "Closed `[lo, hi]`: `hi = len - 1`, loop while `lo <= hi`, move `hi = mid - 1`",
    "Never mix the two — that is where the off-by-one and the infinite loop come from",
    "`lo = mid` never terminates, because integer division rounds down",
    "`lo + (hi - lo) / 2` for the midpoint, always",
    "`Arrays.binarySearch` returns `-(insertion point) - 1` when absent",
  ],
  status: "available",
};
