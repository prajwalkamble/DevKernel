import type { Lesson } from "@/content/types";

export const peakFindingLesson: Lesson = {
  id: "dsa-bs-peak",
  slug: "peak-finding-without-sorted-input",
  moduleSlug: "binary-search",
  title: "Peak Finding: Binary Search Without Sorted Input",
  summary:
    "The clearest proof that sortedness was never the requirement. An array in no order at all, and binary search still finds a peak in logarithmic time — because a local comparison is enough to rule out a whole side.",
  estimatedMinutes: 25,
  objectives: [
    "Find a peak in an unsorted array in O(log n)",
    "State the invariant that justifies discarding half",
    "Explain why a peak is guaranteed to exist",
    "Distinguish finding *a* peak from finding *the* maximum",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "A peak, and why one always exists",
      body: [
        "A **peak** is an index whose value is at least as large as both its neighbours, with out-of-range treated as negative infinity. So the first element is a peak if it beats the second, and the last is a peak if it beats the second-last.",
        "Every non-empty array has at least one. Walk from the left edge: either the sequence never rises, in which case index 0 is a peak, or it rises somewhere and — since the right edge is negative infinity — it must stop rising at some point, and that point is a peak.",
        "That argument is not decoration. It is what makes the algorithm correct, because it applies to *any* subarray whose edges you have compared.",
      ],
    },
    {
      id: "the-algorithm",
      heading: "Uphill is enough",
      body: [
        "Look at `mid` and `mid + 1`. If `a[mid] < a[mid + 1]`, the sequence is climbing at `mid + 1` — and by the argument above, the climb must stop somewhere to the right, so **a peak exists in `[mid + 1, hi]`**. Discard the left half. Otherwise the sequence is flat or falling at `mid`, so a peak exists in `[lo, mid]`. Discard the right.",
        "No sortedness anywhere. One local comparison rules out half the array.",
      ],
      examples: [
        {
          id: "peak",
          title: "Peak finding, traced",
          lang: "python",
          code: `# Peak finding: an unsorted array, and binary search still works.

def find_peak(a, trace=False):
    """An index whose value is >= both neighbours. Out-of-range counts as -inf."""
    lo, hi = 0, len(a) - 1
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if trace:
            print(f"  lo={lo} hi={hi} mid={mid} a[mid]={a[mid]} a[mid+1]={a[mid + 1]}")
        if a[mid] < a[mid + 1]:
            lo = mid + 1        # uphill to the right: a peak lies that way
        else:
            hi = mid            # flat or downhill: a peak lies at mid or left
    return lo

a = [1, 5, 3, 9, 2, 8, 4]
print("array:", a, "(not sorted)")
p = find_peak(a, trace=True)
print(f"peak at index {p}, value {a[p]}")

def is_peak(a, i):
    left = a[i - 1] if i > 0 else float("-inf")
    right = a[i + 1] if i + 1 < len(a) else float("-inf")
    return a[i] >= left and a[i] >= right

print("verified:", is_peak(a, p))

for case in ([1, 2, 3, 4], [4, 3, 2, 1], [7], [1, 2]):
    q = find_peak(case)
    print(f"  {str(case):12} -> index {q} value {case[q]}  peak? {is_peak(case, q)}")

# Why it is valid: the invariant is "a peak exists inside [lo, hi]".
print("\\nThe array is NOT sorted, yet half is discardable at every step:")
print("if a[mid] < a[mid+1], the right side must contain a peak, because the")
print("sequence rises at mid+1 and must eventually stop rising (the edge is -inf).")`,
          output: `array: [1, 5, 3, 9, 2, 8, 4] (not sorted)
  lo=0 hi=6 mid=3 a[mid]=9 a[mid+1]=2
  lo=0 hi=3 mid=1 a[mid]=5 a[mid+1]=3
  lo=0 hi=1 mid=0 a[mid]=1 a[mid+1]=5
peak at index 1, value 5
verified: True
  [1, 2, 3, 4] -> index 3 value 4  peak? True
  [4, 3, 2, 1] -> index 0 value 4  peak? True
  [7]          -> index 0 value 7  peak? True
  [1, 2]       -> index 1 value 2  peak? True

The array is NOT sorted, yet half is discardable at every step:
if a[mid] < a[mid+1], the right side must contain a peak, because the
sequence rises at mid+1 and must eventually stop rising (the edge is -inf).`,
          explanation:
            "It returns index 1, value 5 — and the array's actual maximum is 9, at index 3. **That is correct.** The problem asks for *a* peak, and 5 beats both 1 and 3. Finding the maximum genuinely requires looking at every element, and no logarithmic algorithm can do it; finding a peak does not.\n\nNote the loop uses `hi = len(a) - 1` and `lo < hi`, so `mid + 1` is always a valid index — `mid` is strictly less than `hi` whenever the loop body runs. Getting that wrong is the one way to break this, and it is why the closed convention is the natural fit here even though half-open was the default elsewhere.",
          alternates: [
            {
              lang: "javascript",
              code: `// Peak finding: an unsorted array, and binary search still works.
const list = (xs) => "[" + xs.join(", ") + "]";
const padR = (v, w) => String(v).padEnd(w);

// An index whose value is >= both neighbours. Out-of-range counts as -inf.
function findPeak(a, trace = false) {
  let lo = 0;
  let hi = a.length - 1;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (trace) {
      console.log(\`  lo=\${lo} hi=\${hi} mid=\${mid} a[mid]=\${a[mid]} a[mid+1]=\${a[mid + 1]}\`);
    }
    if (a[mid] < a[mid + 1]) lo = mid + 1;   // uphill to the right: a peak lies that way
    else hi = mid;                            // flat or downhill: a peak lies at mid or left
  }
  return lo;
}

const a = [1, 5, 3, 9, 2, 8, 4];
console.log("array:", list(a), "(not sorted)");
const p = findPeak(a, true);
console.log(\`peak at index \${p}, value \${a[p]}\`);

function isPeak(a, i) {
  const left = i > 0 ? a[i - 1] : -Infinity;
  const right = i + 1 < a.length ? a[i + 1] : -Infinity;
  return a[i] >= left && a[i] >= right;
}

console.log("verified:", isPeak(a, p));

for (const c of [[1, 2, 3, 4], [4, 3, 2, 1], [7], [1, 2]]) {
  const q = findPeak(c);
  console.log(\`  \${padR(list(c), 12)} -> index \${q} value \${c[q]}  peak? \${isPeak(c, q)}\`);
}

// Why it is valid: the invariant is "a peak exists inside [lo, hi]".
console.log("\\nThe array is NOT sorted, yet half is discardable at every step:");
console.log("if a[mid] < a[mid+1], the right side must contain a peak, because the");
console.log("sequence rises at mid+1 and must eventually stop rising (the edge is -inf).");`,
              output: `array: [1, 5, 3, 9, 2, 8, 4] (not sorted)
  lo=0 hi=6 mid=3 a[mid]=9 a[mid+1]=2
  lo=0 hi=3 mid=1 a[mid]=5 a[mid+1]=3
  lo=0 hi=1 mid=0 a[mid]=1 a[mid+1]=5
peak at index 1, value 5
verified: true
  [1, 2, 3, 4] -> index 3 value 4  peak? true
  [4, 3, 2, 1] -> index 0 value 4  peak? true
  [7]          -> index 0 value 7  peak? true
  [1, 2]       -> index 1 value 2  peak? true

The array is NOT sorted, yet half is discardable at every step:
if a[mid] < a[mid+1], the right side must contain a peak, because the
sequence rises at mid+1 and must eventually stop rising (the edge is -inf).`,
            },
            {
              lang: "typescript",
              code: `// Peak finding: an unsorted array, and binary search still works.
const list = (xs: number[]): string => "[" + xs.join(", ") + "]";
const padR = (v: string, w: number): string => String(v).padEnd(w);

// An index whose value is >= both neighbours. Out-of-range counts as -inf.
function findPeak(a: number[], trace = false): number {
  let lo = 0;
  let hi = a.length - 1;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (trace) {
      console.log(\`  lo=\${lo} hi=\${hi} mid=\${mid} a[mid]=\${a[mid]} a[mid+1]=\${a[mid + 1]}\`);
    }
    if (a[mid] < a[mid + 1]) lo = mid + 1;   // uphill to the right: a peak lies that way
    else hi = mid;                            // flat or downhill: a peak lies at mid or left
  }
  return lo;
}

const a: number[] = [1, 5, 3, 9, 2, 8, 4];
console.log("array:", list(a), "(not sorted)");
const p = findPeak(a, true);
console.log(\`peak at index \${p}, value \${a[p]}\`);

function isPeak(a: number[], i: number): boolean {
  const left = i > 0 ? a[i - 1] : -Infinity;
  const right = i + 1 < a.length ? a[i + 1] : -Infinity;
  return a[i] >= left && a[i] >= right;
}

console.log("verified:", isPeak(a, p));

for (const c of [[1, 2, 3, 4], [4, 3, 2, 1], [7], [1, 2]]) {
  const q = findPeak(c);
  console.log(\`  \${padR(list(c), 12)} -> index \${q} value \${c[q]}  peak? \${isPeak(c, q)}\`);
}

// Why it is valid: the invariant is "a peak exists inside [lo, hi]".
console.log("\\nThe array is NOT sorted, yet half is discardable at every step:");
console.log("if a[mid] < a[mid+1], the right side must contain a peak, because the");
console.log("sequence rises at mid+1 and must eventually stop rising (the edge is -inf).");`,
              output: `array: [1, 5, 3, 9, 2, 8, 4] (not sorted)
  lo=0 hi=6 mid=3 a[mid]=9 a[mid+1]=2
  lo=0 hi=3 mid=1 a[mid]=5 a[mid+1]=3
  lo=0 hi=1 mid=0 a[mid]=1 a[mid+1]=5
peak at index 1, value 5
verified: true
  [1, 2, 3, 4] -> index 3 value 4  peak? true
  [4, 3, 2, 1] -> index 0 value 4  peak? true
  [7]          -> index 0 value 7  peak? true
  [1, 2]       -> index 1 value 2  peak? true

The array is NOT sorted, yet half is discardable at every step:
if a[mid] < a[mid+1], the right side must contain a peak, because the
sequence rises at mid+1 and must eventually stop rising (the edge is -inf).`,
            },
            {
              lang: "java",
              code: `import java.util.*;

/** Peak finding: an unsorted array, and binary search still works. */
public class Main {
    static String list(int[] xs) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < xs.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(xs[i]);
        }
        return sb.append("]").toString();
    }

    /** An index whose value is >= both neighbours. Out-of-range counts as -inf. */
    static int findPeak(int[] a, boolean trace) {
        int lo = 0, hi = a.length - 1;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (trace) {
                System.out.println("  lo=" + lo + " hi=" + hi + " mid=" + mid
                        + " a[mid]=" + a[mid] + " a[mid+1]=" + a[mid + 1]);
            }
            if (a[mid] < a[mid + 1]) lo = mid + 1;  // uphill right: a peak lies that way
            else hi = mid;                          // flat or downhill: at mid or left
        }
        return lo;
    }

    static boolean isPeak(int[] a, int i) {
        int left = i > 0 ? a[i - 1] : Integer.MIN_VALUE;
        int right = i + 1 < a.length ? a[i + 1] : Integer.MIN_VALUE;
        return a[i] >= left && a[i] >= right;
    }

    public static void main(String[] args) {
        int[] a = {1, 5, 3, 9, 2, 8, 4};
        System.out.println("array: " + list(a) + " (not sorted)");
        int p = findPeak(a, true);
        System.out.println("peak at index " + p + ", value " + a[p]);
        System.out.println("verified: " + isPeak(a, p));

        int[][] cases = {{1, 2, 3, 4}, {4, 3, 2, 1}, {7}, {1, 2}};
        for (int[] c : cases) {
            int q = findPeak(c, false);
            System.out.printf("  %-12s -> index %d value %d  peak? %b%n",
                    list(c), q, c[q], isPeak(c, q));
        }

        // Why it is valid: the invariant is "a peak exists inside [lo, hi]".
        System.out.println("\\nThe array is NOT sorted, yet half is discardable at every step:");
        System.out.println("if a[mid] < a[mid+1], the right side must contain a peak, because the");
        System.out.println("sequence rises at mid+1 and must eventually stop rising (the edge is -inf).");
    }
}`,
              output: `array: [1, 5, 3, 9, 2, 8, 4] (not sorted)
  lo=0 hi=6 mid=3 a[mid]=9 a[mid+1]=2
  lo=0 hi=3 mid=1 a[mid]=5 a[mid+1]=3
  lo=0 hi=1 mid=0 a[mid]=1 a[mid+1]=5
peak at index 1, value 5
verified: true
  [1, 2, 3, 4] -> index 3 value 4  peak? true
  [4, 3, 2, 1] -> index 0 value 4  peak? true
  [7]          -> index 0 value 7  peak? true
  [1, 2]       -> index 1 value 2  peak? true

The array is NOT sorted, yet half is discardable at every step:
if a[mid] < a[mid+1], the right side must contain a peak, because the
sequence rises at mid+1 and must eventually stop rising (the edge is -inf).`,
            },
            {
              lang: "cpp",
              code: `// Peak finding: an unsorted array, and binary search still works.
#include <climits>
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

// An index whose value is >= both neighbours. Out-of-range counts as -inf.
size_t findPeak(const vector<int>& a, bool trace) {
    size_t lo = 0, hi = a.size() - 1;
    while (lo < hi) {
        size_t mid = lo + (hi - lo) / 2;
        if (trace) {
            cout << "  lo=" << lo << " hi=" << hi << " mid=" << mid
                 << " a[mid]=" << a[mid] << " a[mid+1]=" << a[mid + 1] << "\\n";
        }
        if (a[mid] < a[mid + 1]) lo = mid + 1;   // uphill right: a peak lies that way
        else hi = mid;                           // flat or downhill: at mid or left
    }
    return lo;
}

bool isPeak(const vector<int>& a, size_t i) {
    int left = i > 0 ? a[i - 1] : INT_MIN;
    int right = i + 1 < a.size() ? a[i + 1] : INT_MIN;
    return a[i] >= left && a[i] >= right;
}

int main() {
    vector<int> a = {1, 5, 3, 9, 2, 8, 4};
    cout << "array: " << list(a) << " (not sorted)\\n";
    size_t p = findPeak(a, true);
    cout << "peak at index " << p << ", value " << a[p] << "\\n";
    cout << "verified: " << boolalpha << isPeak(a, p) << "\\n";

    vector<vector<int>> cases = {{1, 2, 3, 4}, {4, 3, 2, 1}, {7}, {1, 2}};
    for (const auto& c : cases) {
        size_t q = findPeak(c, false);
        cout << "  " << left << setw(12) << list(c) << " -> index " << q
             << " value " << c[q] << "  peak? " << boolalpha << isPeak(c, q) << "\\n";
    }

    // Why it is valid: the invariant is "a peak exists inside [lo, hi]".
    cout << "\\nThe array is NOT sorted, yet half is discardable at every step:\\n";
    cout << "if a[mid] < a[mid+1], the right side must contain a peak, because the\\n";
    cout << "sequence rises at mid+1 and must eventually stop rising (the edge is -inf).\\n";
}`,
              output: `array: [1, 5, 3, 9, 2, 8, 4] (not sorted)
  lo=0 hi=6 mid=3 a[mid]=9 a[mid+1]=2
  lo=0 hi=3 mid=1 a[mid]=5 a[mid+1]=3
  lo=0 hi=1 mid=0 a[mid]=1 a[mid+1]=5
peak at index 1, value 5
verified: true
  [1, 2, 3, 4] -> index 3 value 4  peak? true
  [4, 3, 2, 1] -> index 0 value 4  peak? true
  [7]          -> index 0 value 7  peak? true
  [1, 2]       -> index 1 value 2  peak? true

The array is NOT sorted, yet half is discardable at every step:
if a[mid] < a[mid+1], the right side must contain a peak, because the
sequence rises at mid+1 and must eventually stop rising (the edge is -inf).`,
            },
            {
              lang: "rust",
              code: `// Peak finding: an unsorted array, and binary search still works.
fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

/// An index whose value is >= both neighbours. Out-of-range counts as -inf.
fn find_peak(a: &[i32], trace: bool) -> usize {
    let (mut lo, mut hi) = (0usize, a.len() - 1);
    while lo < hi {
        let mid = lo + (hi - lo) / 2;
        if trace {
            println!(
                "  lo={} hi={} mid={} a[mid]={} a[mid+1]={}",
                lo,
                hi,
                mid,
                a[mid],
                a[mid + 1]
            );
        }
        if a[mid] < a[mid + 1] {
            lo = mid + 1; // uphill to the right: a peak lies that way
        } else {
            hi = mid; // flat or downhill: a peak lies at mid or left
        }
    }
    lo
}

fn is_peak(a: &[i32], i: usize) -> bool {
    let left = if i > 0 { a[i - 1] } else { i32::MIN };
    let right = if i + 1 < a.len() { a[i + 1] } else { i32::MIN };
    a[i] >= left && a[i] >= right
}

fn main() {
    let a = [1, 5, 3, 9, 2, 8, 4];
    println!("array: {} (not sorted)", list(&a));
    let p = find_peak(&a, true);
    println!("peak at index {}, value {}", p, a[p]);
    println!("verified: {}", is_peak(&a, p));

    let cases: Vec<Vec<i32>> = vec![vec![1, 2, 3, 4], vec![4, 3, 2, 1], vec![7], vec![1, 2]];
    for c in &cases {
        let q = find_peak(c, false);
        println!(
            "  {:<12} -> index {} value {}  peak? {}",
            list(c),
            q,
            c[q],
            is_peak(c, q)
        );
    }

    // Why it is valid: the invariant is "a peak exists inside [lo, hi]".
    println!("\\nThe array is NOT sorted, yet half is discardable at every step:");
    println!("if a[mid] < a[mid+1], the right side must contain a peak, because the");
    println!("sequence rises at mid+1 and must eventually stop rising (the edge is -inf).");
}`,
              output: `array: [1, 5, 3, 9, 2, 8, 4] (not sorted)
  lo=0 hi=6 mid=3 a[mid]=9 a[mid+1]=2
  lo=0 hi=3 mid=1 a[mid]=5 a[mid+1]=3
  lo=0 hi=1 mid=0 a[mid]=1 a[mid+1]=5
peak at index 1, value 5
verified: true
  [1, 2, 3, 4] -> index 3 value 4  peak? true
  [4, 3, 2, 1] -> index 0 value 4  peak? true
  [7]          -> index 0 value 7  peak? true
  [1, 2]       -> index 1 value 2  peak? true

The array is NOT sorted, yet half is discardable at every step:
if a[mid] < a[mid+1], the right side must contain a peak, because the
sequence rises at mid+1 and must eventually stop rising (the edge is -inf).`,
            },
            {
              lang: "go",
              code: `// Peak finding: an unsorted array, and binary search still works.
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

// An index whose value is >= both neighbours. Out-of-range counts as -inf.
func findPeak(a []int, trace bool) int {
	lo, hi := 0, len(a)-1
	for lo < hi {
		mid := lo + (hi-lo)/2
		if trace {
			fmt.Printf("  lo=%d hi=%d mid=%d a[mid]=%d a[mid+1]=%d\\n",
				lo, hi, mid, a[mid], a[mid+1])
		}
		if a[mid] < a[mid+1] {
			lo = mid + 1 // uphill to the right: a peak lies that way
		} else {
			hi = mid // flat or downhill: a peak lies at mid or left
		}
	}
	return lo
}

func isPeak(a []int, i int) bool {
	left, right := math.MinInt, math.MinInt
	if i > 0 {
		left = a[i-1]
	}
	if i+1 < len(a) {
		right = a[i+1]
	}
	return a[i] >= left && a[i] >= right
}

func main() {
	a := []int{1, 5, 3, 9, 2, 8, 4}
	fmt.Println("array:", list(a), "(not sorted)")
	p := findPeak(a, true)
	fmt.Printf("peak at index %d, value %d\\n", p, a[p])
	fmt.Println("verified:", isPeak(a, p))

	for _, c := range [][]int{{1, 2, 3, 4}, {4, 3, 2, 1}, {7}, {1, 2}} {
		q := findPeak(c, false)
		fmt.Printf("  %-12s -> index %d value %d  peak? %t\\n", list(c), q, c[q], isPeak(c, q))
	}

	// Why it is valid: the invariant is "a peak exists inside [lo, hi]".
	fmt.Println("\\nThe array is NOT sorted, yet half is discardable at every step:")
	fmt.Println("if a[mid] < a[mid+1], the right side must contain a peak, because the")
	fmt.Println("sequence rises at mid+1 and must eventually stop rising (the edge is -inf).")
}`,
              output: `array: [1, 5, 3, 9, 2, 8, 4] (not sorted)
  lo=0 hi=6 mid=3 a[mid]=9 a[mid+1]=2
  lo=0 hi=3 mid=1 a[mid]=5 a[mid+1]=3
  lo=0 hi=1 mid=0 a[mid]=1 a[mid+1]=5
peak at index 1, value 5
verified: true
  [1, 2, 3, 4] -> index 3 value 4  peak? true
  [4, 3, 2, 1] -> index 0 value 4  peak? true
  [7]          -> index 0 value 7  peak? true
  [1, 2]       -> index 1 value 2  peak? true

The array is NOT sorted, yet half is discardable at every step:
if a[mid] < a[mid+1], the right side must contain a peak, because the
sequence rises at mid+1 and must eventually stop rising (the edge is -inf).`,
            },
          ],
        },
      ],
    },
    {
      id: "generalising",
      heading: "What this tells you about the other variants",
      body: [
        "Every problem in this module is the same loop with a different rule for discarding.",
        "**Sorted array** — `a[mid]` against the target.",
        "**Rotated array** — which half is sorted, then a range test.",
        "**Binary search on the answer** — `feasible(mid)`.",
        "**Peak finding** — `a[mid]` against `a[mid + 1]`.",
        "The question to ask of a new problem is not \"is this sorted\" but **\"can I look at one point and rule out a side?\"** If yes, the cost is logarithmic and you should be looking for the rule.",
      ],
      pitfalls: [
        {
          title: "`a[mid + 1]` needs `hi = len - 1`",
          body: "With a half-open `hi = len`, `mid` can equal `len - 1` and `mid + 1` runs off the end. Either use the closed convention as above, or guard the comparison. This is the standard bug in this problem.",
        },
        {
          title: "A plateau breaks the guarantee",
          body: "The argument assumes you can always tell uphill from not-uphill. With equal adjacent values the algorithm still terminates and still returns a peak by the `>=` definition, but a *strict* peak — greater than both neighbours — may not exist at all in an array of equal values. Check which definition the problem uses.",
        },
      ],
    },
  ],
  takeaways: [
    "A peak is at least as large as both neighbours, with edges treated as -infinity",
    "One always exists, by a rise-must-stop argument",
    "`a[mid] < a[mid+1]` means a peak lies to the right; otherwise at mid or left",
    "The array need not be sorted in any way",
    "It finds *a* peak, not the maximum — the maximum needs O(n)",
    "Use `hi = len - 1` so `mid + 1` is always valid",
    "Ask \"can I rule out a side\", not \"is this sorted\"",
  ],
  status: "available",
};
