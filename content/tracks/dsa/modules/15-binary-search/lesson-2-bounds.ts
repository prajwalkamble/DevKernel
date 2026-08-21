import type { Lesson } from "@/content/types";

export const boundsLesson: Lesson = {
  id: "dsa-bs-bounds",
  slug: "lower-bound-and-upper-bound",
  moduleSlug: "binary-search",
  title: "Lower Bound, Upper Bound & Duplicates",
  summary:
    "Plain binary search returns *an* index. Almost every real problem wants the first, the last, or how many — and all three come from two functions that differ by a single character.",
  estimatedMinutes: 30,
  objectives: [
    "Write lower_bound and upper_bound and state precisely what each returns",
    "Find the first and last occurrence of a duplicated value",
    "Count occurrences in O(log n) without scanning",
    "Use the bounds as insertion points",
    "Stop writing the \"then walk left to find the start\" version",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "\"An index\" is rarely the question",
      body: [
        "Plain binary search on `[1, 2, 2, 2, 3]` searching for `2` may return index 1, 2 or 3 — whichever the halving happens to land on. That is fine for \"is it present\" and useless for almost everything else.",
        "The common follow-up is to find any occurrence and then walk outwards to the edges. **Do not.** With a million copies of the value that walk is O(n), which throws away the whole point of having searched.",
        "The right answer is two search variants that never test for equality at all.",
      ],
    },
    {
      id: "the-two",
      heading: "Two functions, one character apart",
      body: [
        "**`lower_bound(a, t)`** — the first index `i` with `a[i] >= t`. If every element is smaller, it returns `len(a)`.",
        "**`upper_bound(a, t)`** — the first index `i` with `a[i] > t`.",
        "Neither returns \"found\" or \"not found\". Both return a **position**, always valid as an insertion point, and every question you actually have is arithmetic on the pair.",
      ],
      examples: [
        {
          id: "bounds",
          title: "Both bounds, and everything derived from them",
          lang: "python",
          code: `def lower_bound(a, target):
    """First index with a[i] >= target. Equals len(a) when there is none."""
    lo, hi = 0, len(a)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo

def upper_bound(a, target):
    """First index with a[i] > target."""
    lo, hi = 0, len(a)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if a[mid] <= target:
            lo = mid + 1
        else:
            hi = mid
    return lo

a = [1, 2, 2, 2, 3, 5, 5, 8]
print("array:", a, "\\n")
for t in (2, 5, 4, 0, 9):
    lb, ub = lower_bound(a, t), upper_bound(a, t)
    first = lb if lb < len(a) and a[lb] == t else "-"
    last = ub - 1 if ub > lb else "-"
    print(f"target {t}:  lower={lb}  upper={ub}  count={ub - lb}"
          f"  first={first}  last={last}")

# the two differ in exactly one character, and that is the whole trick
print("\\nlower_bound uses  a[mid] <  target")
print("upper_bound uses  a[mid] <= target")

# insertion point: lower_bound is where a new value goes to keep order
import bisect
print("\\nmatches the standard library:")
for t in (2, 4, 9):
    print(f"  t={t}: ours lower={lower_bound(a, t)} lib lower={bisect.bisect_left(a, t)}"
          f"   ours upper={upper_bound(a, t)} lib upper={bisect.bisect_right(a, t)}")`,
          output: `array: [1, 2, 2, 2, 3, 5, 5, 8] 

target 2:  lower=1  upper=4  count=3  first=1  last=3
target 5:  lower=5  upper=7  count=2  first=5  last=6
target 4:  lower=5  upper=5  count=0  first=-  last=-
target 0:  lower=0  upper=0  count=0  first=-  last=-
target 9:  lower=8  upper=8  count=0  first=-  last=-

lower_bound uses  a[mid] <  target
upper_bound uses  a[mid] <= target

matches the standard library:
  t=2: ours lower=1 lib lower=1   ours upper=4 lib upper=4
  t=4: ours lower=5 lib lower=5   ours upper=5 lib upper=5
  t=9: ours lower=8 lib lower=8   ours upper=8 lib upper=8`,
          explanation:
            "The whole difference is `<` against `<=`. With `<`, an element equal to the target fails the test and the window collapses towards it from the right, landing on the first equal element. With `<=`, an equal element passes and gets skipped, landing just past the last one.\n\nEverything else is arithmetic. **Count** is `upper - lower`, and it is zero exactly when the value is absent — which is also the presence test, so you never need a separate one. **First occurrence** is `lower`, valid only if `lower < len` and `a[lower] == t`. **Last occurrence** is `upper - 1`.",
          alternates: [
            {
              lang: "javascript",
              code: `const list = (xs) => "[" + xs.join(", ") + "]";

// First index with a[i] >= target. Equals a.length when there is none.
function lowerBound(a, target) {
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (a[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// First index with a[i] > target.
function upperBound(a, target) {
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (a[mid] <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

const a = [1, 2, 2, 2, 3, 5, 5, 8];
console.log("array:", list(a), "\\n");
for (const t of [2, 5, 4, 0, 9]) {
  const lb = lowerBound(a, t);
  const ub = upperBound(a, t);
  const first = lb < a.length && a[lb] === t ? lb : "-";
  const last = ub > lb ? ub - 1 : "-";
  console.log(
    \`target \${t}:  lower=\${lb}  upper=\${ub}  count=\${ub - lb}  first=\${first}  last=\${last}\`
  );
}

// the two differ in exactly one character, and that is the whole trick
console.log("\\nlower_bound uses  a[mid] <  target");
console.log("upper_bound uses  a[mid] <= target");

// The Python original ends by checking these against \`bisect\`. JavaScript has
// no lower/upper bound in its standard library — Array.prototype.indexOf is a
// linear scan — so there is nothing here to check against, and the program
// stops rather than comparing the function to itself.`,
              output: `array: [1, 2, 2, 2, 3, 5, 5, 8]

target 2:  lower=1  upper=4  count=3  first=1  last=3
target 5:  lower=5  upper=7  count=2  first=5  last=6
target 4:  lower=5  upper=5  count=0  first=-  last=-
target 0:  lower=0  upper=0  count=0  first=-  last=-
target 9:  lower=8  upper=8  count=0  first=-  last=-

lower_bound uses  a[mid] <  target
upper_bound uses  a[mid] <= target`,
            },
            {
              lang: "typescript",
              code: `const list = (xs: number[]): string => "[" + xs.join(", ") + "]";

// First index with a[i] >= target. Equals a.length when there is none.
function lowerBound(a: number[], target: number): number {
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (a[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// First index with a[i] > target.
function upperBound(a: number[], target: number): number {
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (a[mid] <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

const a: number[] = [1, 2, 2, 2, 3, 5, 5, 8];
console.log("array:", list(a), "\\n");
for (const t of [2, 5, 4, 0, 9]) {
  const lb = lowerBound(a, t);
  const ub = upperBound(a, t);
  const first = lb < a.length && a[lb] === t ? lb : "-";
  const last = ub > lb ? ub - 1 : "-";
  console.log(
    \`target \${t}:  lower=\${lb}  upper=\${ub}  count=\${ub - lb}  first=\${first}  last=\${last}\`
  );
}

// the two differ in exactly one character, and that is the whole trick
console.log("\\nlower_bound uses  a[mid] <  target");
console.log("upper_bound uses  a[mid] <= target");

// The Python original ends by checking these against \`bisect\`. TypeScript has
// no lower/upper bound in its standard library — Array.prototype.indexOf is a
// linear scan — so there is nothing here to check against, and the program
// stops rather than comparing the function to itself.`,
              output: `array: [1, 2, 2, 2, 3, 5, 5, 8]

target 2:  lower=1  upper=4  count=3  first=1  last=3
target 5:  lower=5  upper=7  count=2  first=5  last=6
target 4:  lower=5  upper=5  count=0  first=-  last=-
target 0:  lower=0  upper=0  count=0  first=-  last=-
target 9:  lower=8  upper=8  count=0  first=-  last=-

lower_bound uses  a[mid] <  target
upper_bound uses  a[mid] <= target`,
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

    /** First index with a[i] >= target. Equals a.length when there is none. */
    static int lowerBound(int[] a, int target) {
        int lo = 0, hi = a.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] < target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    /** First index with a[i] > target. */
    static int upperBound(int[] a, int target) {
        int lo = 0, hi = a.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] <= target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    public static void main(String[] args) {
        int[] a = {1, 2, 2, 2, 3, 5, 5, 8};
        System.out.println("array: " + list(a) + " \\n");
        for (int t : new int[]{2, 5, 4, 0, 9}) {
            int lb = lowerBound(a, t), ub = upperBound(a, t);
            String first = (lb < a.length && a[lb] == t) ? String.valueOf(lb) : "-";
            String last = ub > lb ? String.valueOf(ub - 1) : "-";
            System.out.println("target " + t + ":  lower=" + lb + "  upper=" + ub
                    + "  count=" + (ub - lb) + "  first=" + first + "  last=" + last);
        }

        // the two differ in exactly one character, and that is the whole trick
        System.out.println("\\nlower_bound uses  a[mid] <  target");
        System.out.println("upper_bound uses  a[mid] <= target");

        // The Python original ends by checking these against \`bisect\`. Java has
        // no equivalent: Arrays.binarySearch returns -(insertion point) - 1 when
        // the value is absent, and an *arbitrary* matching index when it is
        // present, so it cannot answer either question on a run of duplicates.
    }
}`,
              output: `array: [1, 2, 2, 2, 3, 5, 5, 8]

target 2:  lower=1  upper=4  count=3  first=1  last=3
target 5:  lower=5  upper=7  count=2  first=5  last=6
target 4:  lower=5  upper=5  count=0  first=-  last=-
target 0:  lower=0  upper=0  count=0  first=-  last=-
target 9:  lower=8  upper=8  count=0  first=-  last=-

lower_bound uses  a[mid] <  target
upper_bound uses  a[mid] <= target`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
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

// First index with a[i] >= target. Equals a.size() when there is none.
size_t lowerBound(const vector<int>& a, int target) {
    size_t lo = 0, hi = a.size();
    while (lo < hi) {
        size_t mid = lo + (hi - lo) / 2;
        if (a[mid] < target) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}

// First index with a[i] > target.
size_t upperBound(const vector<int>& a, int target) {
    size_t lo = 0, hi = a.size();
    while (lo < hi) {
        size_t mid = lo + (hi - lo) / 2;
        if (a[mid] <= target) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}

int main() {
    vector<int> a = {1, 2, 2, 2, 3, 5, 5, 8};
    cout << "array: " << list(a) << " \\n\\n";
    for (int t : {2, 5, 4, 0, 9}) {
        size_t lb = lowerBound(a, t), ub = upperBound(a, t);
        string first = (lb < a.size() && a[lb] == t) ? to_string(lb) : "-";
        string last = ub > lb ? to_string(ub - 1) : "-";
        cout << "target " << t << ":  lower=" << lb << "  upper=" << ub
             << "  count=" << ub - lb << "  first=" << first
             << "  last=" << last << "\\n";
    }

    // the two differ in exactly one character, and that is the whole trick
    cout << "\\nlower_bound uses  a[mid] <  target\\n";
    cout << "upper_bound uses  a[mid] <= target\\n";

    // insertion point: lower_bound is where a new value goes to keep order
    cout << "\\nmatches the standard library:\\n";
    for (int t : {2, 4, 9}) {
        size_t libLower = std::lower_bound(a.begin(), a.end(), t) - a.begin();
        size_t libUpper = std::upper_bound(a.begin(), a.end(), t) - a.begin();
        cout << "  t=" << t << ": ours lower=" << lowerBound(a, t)
             << " lib lower=" << libLower
             << "   ours upper=" << upperBound(a, t)
             << " lib upper=" << libUpper << "\\n";
    }
}`,
            },
            {
              lang: "rust",
              code: `fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

/// First index with a[i] >= target. Equals a.len() when there is none.
fn lower_bound(a: &[i32], target: i32) -> usize {
    let (mut lo, mut hi) = (0usize, a.len());
    while lo < hi {
        let mid = lo + (hi - lo) / 2;
        if a[mid] < target {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }
    lo
}

/// First index with a[i] > target.
fn upper_bound(a: &[i32], target: i32) -> usize {
    let (mut lo, mut hi) = (0usize, a.len());
    while lo < hi {
        let mid = lo + (hi - lo) / 2;
        if a[mid] <= target {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }
    lo
}

fn main() {
    let a = [1, 2, 2, 2, 3, 5, 5, 8];
    println!("array: {} \\n", list(&a));
    for t in [2, 5, 4, 0, 9] {
        let (lb, ub) = (lower_bound(&a, t), upper_bound(&a, t));
        let first = if lb < a.len() && a[lb] == t { lb.to_string() } else { "-".to_string() };
        let last = if ub > lb { (ub - 1).to_string() } else { "-".to_string() };
        println!(
            "target {}:  lower={}  upper={}  count={}  first={}  last={}",
            t,
            lb,
            ub,
            ub - lb,
            first,
            last
        );
    }

    // the two differ in exactly one character, and that is the whole trick
    println!("\\nlower_bound uses  a[mid] <  target");
    println!("upper_bound uses  a[mid] <= target");

    // insertion point: lower_bound is where a new value goes to keep order.
    // Rust spells both of these \`partition_point\`, with the predicate carrying
    // the difference the two functions above carry in their comparison.
    println!("\\nmatches the standard library:");
    for t in [2, 4, 9] {
        let lib_lower = a.partition_point(|&x| x < t);
        let lib_upper = a.partition_point(|&x| x <= t);
        println!(
            "  t={}: ours lower={} lib lower={}   ours upper={} lib upper={}",
            t,
            lower_bound(&a, t),
            lib_lower,
            upper_bound(&a, t),
            lib_upper
        );
    }
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"sort"
	"strings"
)

func list(xs []int) string {
	parts := make([]string, len(xs))
	for i, x := range xs {
		parts[i] = fmt.Sprint(x)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

// First index with a[i] >= target. Equals len(a) when there is none.
func lowerBound(a []int, target int) int {
	lo, hi := 0, len(a)
	for lo < hi {
		mid := lo + (hi-lo)/2
		if a[mid] < target {
			lo = mid + 1
		} else {
			hi = mid
		}
	}
	return lo
}

// First index with a[i] > target.
func upperBound(a []int, target int) int {
	lo, hi := 0, len(a)
	for lo < hi {
		mid := lo + (hi-lo)/2
		if a[mid] <= target {
			lo = mid + 1
		} else {
			hi = mid
		}
	}
	return lo
}

func main() {
	a := []int{1, 2, 2, 2, 3, 5, 5, 8}
	fmt.Println("array:", list(a), "\\n")
	for _, t := range []int{2, 5, 4, 0, 9} {
		lb, ub := lowerBound(a, t), upperBound(a, t)
		first, last := "-", "-"
		if lb < len(a) && a[lb] == t {
			first = fmt.Sprint(lb)
		}
		if ub > lb {
			last = fmt.Sprint(ub - 1)
		}
		fmt.Printf("target %d:  lower=%d  upper=%d  count=%d  first=%s  last=%s\\n",
			t, lb, ub, ub-lb, first, last)
	}

	// the two differ in exactly one character, and that is the whole trick
	fmt.Println("\\nlower_bound uses  a[mid] <  target")
	fmt.Println("upper_bound uses  a[mid] <= target")

	// insertion point: lower_bound is where a new value goes to keep order.
	// Go's sort.SearchInts is lower_bound; upper_bound is sort.Search with the
	// predicate loosened by one character, exactly as above.
	fmt.Println("\\nmatches the standard library:")
	for _, t := range []int{2, 4, 9} {
		libLower := sort.SearchInts(a, t)
		libUpper := sort.Search(len(a), func(i int) bool { return a[i] > t })
		fmt.Printf("  t=%d: ours lower=%d lib lower=%d   ours upper=%d lib upper=%d\\n",
			t, lowerBound(a, t), libLower, upperBound(a, t), libUpper)
	}
}`,
            },
          ],
        },
      ],
    },
    {
      id: "in-libraries",
      heading: "Your language already has these",
      body: [
        "Python: `bisect.bisect_left` is lower bound, `bisect.bisect_right` is upper bound. Both take optional `lo` and `hi` to search a slice without copying it.",
        "C++: `std::lower_bound` and `std::upper_bound`, returning iterators; subtract `begin()` for an index. `std::equal_range` returns both at once.",
        "Java: `Arrays.binarySearch` is neither — with duplicates it returns an unspecified one of them, so you have to write the bounds yourself. This is a real gap and the reason the Java version above is worth memorising.",
        "Go: `sort.SearchInts` is lower bound. The general `sort.Search` takes a predicate and returns the first index where it holds, which is lower bound generalised — and is the shape the next lesson builds on.",
      ],
      pitfalls: [
        {
          title: "`lower_bound` returning `len(a)` is a valid answer, not a failure",
          body: "When the target is larger than everything, the correct insertion point is the end. Indexing with it without checking is an out-of-range error, and it only happens on the largest input — write `if lb < len(a) and a[lb] == t` every time.",
        },
        {
          title: "`bisect_left` on a list of tuples compares whole tuples",
          body: "Searching a list of `(key, value)` pairs for a key means constructing a sentinel: `bisect_left(pairs, (key,))` finds the first pair with that key, because a one-element tuple sorts before every two-element tuple sharing its first element. Passing a bare key raises a type error in Python 3.",
        },
      ],
    },
  ],
  takeaways: [
    "`lower_bound` is the first index with `a[i] >= t`; `upper_bound` the first with `a[i] > t`",
    "They differ only in `<` against `<=`",
    "Count is `upper - lower`, and zero count is the presence test",
    "First occurrence is `lower`; last is `upper - 1`",
    "Never find one occurrence and walk outwards — that is O(n)",
    "`len(a)` is a legitimate return value; check before indexing",
    "Java has no built-in bounds; Python has bisect, C++ has both, Go has sort.Search",
  ],
  status: "available",
};
