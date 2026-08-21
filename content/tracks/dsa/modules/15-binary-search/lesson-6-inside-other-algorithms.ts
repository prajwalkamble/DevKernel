import type { Lesson } from "@/content/types";

export const insideOtherAlgorithmsLesson: Lesson = {
  id: "dsa-bs-inside",
  slug: "binary-search-inside-other-algorithms",
  moduleSlug: "binary-search",
  title: "Binary Search Inside Other Algorithms",
  summary:
    "The technique rarely appears alone in a hard problem. It appears as the inner step that drops an O(n²) algorithm to O(n log n) — and the canonical example is longest increasing subsequence.",
  estimatedMinutes: 35,
  objectives: [
    "Recognise binary search as an accelerator rather than a whole solution",
    "Derive the O(n log n) LIS algorithm and explain what its array holds",
    "Say why the maintained array is sorted, and why that is what makes it work",
    "Switch between strictly increasing and non-decreasing correctly",
  ],
  sections: [
    {
      id: "as-a-step",
      heading: "The inner loop that did not have to be linear",
      body: [
        "A great many O(n²) algorithms have the same shape: for each element, scan everything before it looking for something. If the thing being scanned is **kept sorted**, that inner scan is a binary search, and the whole algorithm drops to O(n log n).",
        "That is the entire idea. What makes each instance interesting is finding the thing to keep sorted — it is rarely the input.",
      ],
    },
    {
      id: "lis",
      heading: "Longest increasing subsequence",
      body: [
        "The O(n²) version is the obvious dynamic program: `best[i]` is the longest increasing subsequence ending at `i`, computed by scanning every earlier `j`. Simple and quadratic.",
        "The fast version keeps a different array. **`tails[k]` is the smallest value that can end an increasing subsequence of length `k + 1`.** That array is *automatically sorted* — a longer subsequence must end on something at least as large — which is what admits a binary search.",
      ],
      examples: [
        {
          id: "lis",
          title: "LIS in O(n log n), traced",
          lang: "python",
          code: `from bisect import bisect_left, bisect_right

def lis_length(a, trace=False):
    """Longest strictly increasing subsequence, O(n log n).

    \`tails[k]\` is the smallest possible tail of an increasing subsequence of
    length k+1. It is sorted, which is what lets binary search find the slot.
    """
    tails = []
    for v in a:
        i = bisect_left(tails, v)
        if i == len(tails):
            tails.append(v)
        else:
            tails[i] = v
        if trace:
            print(f"  saw {v:3} -> tails {tails}")
    return len(tails)

a = [10, 9, 2, 5, 3, 7, 101, 18]
print("input:", a)
print("trace:")
n = lis_length(a, trace=True)
print("LIS length:", n)

print("\\nnote: tails is NOT the subsequence itself —")
print("it is only ever the same *length* as one.")

# non-decreasing needs bisect_right instead
def lis_non_decreasing(a):
    tails = []
    for v in a:
        i = bisect_right(tails, v)
        if i == len(tails):
            tails.append(v)
        else:
            tails[i] = v
    return len(tails)

b = [2, 2, 2, 3, 3]
print(f"\\n{b}: strict={lis_length(b)}  non-decreasing={lis_non_decreasing(b)}")

# the O(n^2) version, for comparison on a small input
def lis_quadratic(a):
    if not a:
        return 0
    best = [1] * len(a)
    for i in range(len(a)):
        for j in range(i):
            if a[j] < a[i]:
                best[i] = max(best[i], best[j] + 1)
    return max(best)

# A Lehmer generator rather than \`random\`: every language has to produce the
# same 400 values for the two implementations to be compared on the same input,
# and no other language reproduces Python's Mersenne Twister. Every product here
# stays under 2^53, so a double holds it exactly too.
seed = 7
def next_rand():
    global seed
    seed = (seed * 16807) % 2147483647
    return seed

c = [next_rand() % 1001 for _ in range(400)]
fast, slow = lis_length(c), lis_quadratic(c)
print(f"\\nboth agree on 400 pseudo-random values: {fast} vs {slow}"
      f"  {'ok' if fast == slow else 'MISMATCH'}")`,
          output: `input: [10, 9, 2, 5, 3, 7, 101, 18]
trace:
  saw  10 -> tails [10]
  saw   9 -> tails [9]
  saw   2 -> tails [2]
  saw   5 -> tails [2, 5]
  saw   3 -> tails [2, 3]
  saw   7 -> tails [2, 3, 7]
  saw 101 -> tails [2, 3, 7, 101]
  saw  18 -> tails [2, 3, 7, 18]
LIS length: 4

note: tails is NOT the subsequence itself —
it is only ever the same *length* as one.

[2, 2, 2, 3, 3]: strict=2  non-decreasing=5

both agree on 400 pseudo-random values: 35 vs 35  ok`,
          explanation:
            "Follow the trace. Seeing `3` when `tails` is `[2, 5]` replaces the 5: there is still a length-2 subsequence, but now it ends on 3 rather than 5, which leaves more room for whatever comes next. **Replacing never changes the length; appending is the only thing that grows it.**\n\nThe warning in the middle matters. The final `tails` is `[2, 3, 7, 18]`, which is *not* an increasing subsequence of the input — 18 comes after 101, and the actual LIS is `[2, 3, 7, 101]` or `[2, 3, 7, 18]`. `tails` is only guaranteed to have the right *length*. Reconstructing the subsequence itself needs a parallel array of predecessor indices.\n\nStrict versus non-decreasing is one function call. `bisect_left` finds the first slot `>= v` and so overwrites an equal value, forbidding repeats. `bisect_right` skips past equals and appends, allowing them. `[2, 2, 2, 3, 3]` gives 2 and 5 respectively — a difference no amount of testing on distinct values would reveal.",
          alternates: [
            {
              lang: "javascript",
              code: `const list = (xs) => "[" + xs.join(", ") + "]";
const padL = (v, w) => String(v).padStart(w);

// \`bisect_left\` and \`bisect_right\`, written out: the only difference is
// whether an equal element counts as already-placed.
function bisectLeft(a, v) {
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (a[mid] < v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function bisectRight(a, v) {
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (a[mid] <= v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// Longest strictly increasing subsequence, O(n log n).
//
// \`tails[k]\` is the smallest possible tail of an increasing subsequence of
// length k+1. It is sorted, which is what lets binary search find the slot.
function lisLength(a, trace = false) {
  const tails = [];
  for (const v of a) {
    const i = bisectLeft(tails, v);
    if (i === tails.length) tails.push(v);
    else tails[i] = v;
    if (trace) console.log(\`  saw \${padL(v, 3)} -> tails \${list(tails)}\`);
  }
  return tails.length;
}

const a = [10, 9, 2, 5, 3, 7, 101, 18];
console.log("input:", list(a));
console.log("trace:");
const n = lisLength(a, true);
console.log("LIS length:", n);

console.log("\\nnote: tails is NOT the subsequence itself —");
console.log("it is only ever the same *length* as one.");

// non-decreasing needs bisectRight instead
function lisNonDecreasing(a) {
  const tails = [];
  for (const v of a) {
    const i = bisectRight(tails, v);
    if (i === tails.length) tails.push(v);
    else tails[i] = v;
  }
  return tails.length;
}

const b = [2, 2, 2, 3, 3];
console.log(\`\\n\${list(b)}: strict=\${lisLength(b)}  non-decreasing=\${lisNonDecreasing(b)}\`);

// the O(n^2) version, for comparison on a small input
function lisQuadratic(a) {
  if (a.length === 0) return 0;
  const best = new Array(a.length).fill(1);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < i; j++) {
      if (a[j] < a[i]) best[i] = Math.max(best[i], best[j] + 1);
    }
  }
  return Math.max(...best);
}

// A Lehmer generator rather than a library RNG: every language has to produce
// the same 400 values for the two implementations to be compared on the same
// input. Every product here stays under 2^53, so a double holds it exactly.
let seed = 7;
function nextRand() {
  seed = (seed * 16807) % 2147483647;
  return seed;
}

const c = [];
for (let i = 0; i < 400; i++) c.push(nextRand() % 1001);
const fast = lisLength(c);
const slow = lisQuadratic(c);
console.log(
  \`\\nboth agree on 400 pseudo-random values: \${fast} vs \${slow}  \${fast === slow ? "ok" : "MISMATCH"}\`
);`,
            },
            {
              lang: "typescript",
              code: `const list = (xs: number[]): string => "[" + xs.join(", ") + "]";
const padL = (v: number, w: number): string => String(v).padStart(w);

// \`bisect_left\` and \`bisect_right\`, written out: the only difference is
// whether an equal element counts as already-placed.
function bisectLeft(a: number[], v: number): number {
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (a[mid] < v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function bisectRight(a: number[], v: number): number {
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (a[mid] <= v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// Longest strictly increasing subsequence, O(n log n).
//
// \`tails[k]\` is the smallest possible tail of an increasing subsequence of
// length k+1. It is sorted, which is what lets binary search find the slot.
function lisLength(a: number[], trace = false): number {
  const tails: number[] = [];
  for (const v of a) {
    const i = bisectLeft(tails, v);
    if (i === tails.length) tails.push(v);
    else tails[i] = v;
    if (trace) console.log(\`  saw \${padL(v, 3)} -> tails \${list(tails)}\`);
  }
  return tails.length;
}

const a: number[] = [10, 9, 2, 5, 3, 7, 101, 18];
console.log("input:", list(a));
console.log("trace:");
const n = lisLength(a, true);
console.log("LIS length:", n);

console.log("\\nnote: tails is NOT the subsequence itself —");
console.log("it is only ever the same *length* as one.");

// non-decreasing needs bisectRight instead
function lisNonDecreasing(a: number[]): number {
  const tails: number[] = [];
  for (const v of a) {
    const i = bisectRight(tails, v);
    if (i === tails.length) tails.push(v);
    else tails[i] = v;
  }
  return tails.length;
}

const b: number[] = [2, 2, 2, 3, 3];
console.log(\`\\n\${list(b)}: strict=\${lisLength(b)}  non-decreasing=\${lisNonDecreasing(b)}\`);

// the O(n^2) version, for comparison on a small input
function lisQuadratic(a: number[]): number {
  if (a.length === 0) return 0;
  const best = new Array(a.length).fill(1);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < i; j++) {
      if (a[j] < a[i]) best[i] = Math.max(best[i], best[j] + 1);
    }
  }
  return Math.max(...best);
}

// A Lehmer generator rather than a library RNG: every language has to produce
// the same 400 values for the two implementations to be compared on the same
// input. Every product here stays under 2^53, so a double holds it exactly.
let seed = 7;
function nextRand() {
  seed = (seed * 16807) % 2147483647;
  return seed;
}

const c: number[] = [];
for (let i = 0; i < 400; i++) c.push(nextRand() % 1001);
const fast = lisLength(c);
const slow = lisQuadratic(c);
console.log(
  \`\\nboth agree on 400 pseudo-random values: \${fast} vs \${slow}  \${fast === slow ? "ok" : "MISMATCH"}\`
);`,
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

    static String list(int[] xs) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < xs.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(xs[i]);
        }
        return sb.append("]").toString();
    }

    /* \`bisect_left\` and \`bisect_right\`, written out. Arrays.binarySearch cannot
       stand in: on a run of equal values it returns an arbitrary one of them. */
    static int bisectLeft(List<Integer> a, int v) {
        int lo = 0, hi = a.size();
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (a.get(mid) < v) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    static int bisectRight(List<Integer> a, int v) {
        int lo = 0, hi = a.size();
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (a.get(mid) <= v) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    /**
     * Longest strictly increasing subsequence, O(n log n).
     *
     * \`tails[k]\` is the smallest possible tail of an increasing subsequence of
     * length k+1. It is sorted, which is what lets binary search find the slot.
     */
    static int lisLength(int[] a, boolean trace) {
        List<Integer> tails = new ArrayList<>();
        for (int v : a) {
            int i = bisectLeft(tails, v);
            if (i == tails.size()) tails.add(v);
            else tails.set(i, v);
            if (trace) System.out.printf("  saw %3d -> tails %s%n", v, list(tails));
        }
        return tails.size();
    }

    /** non-decreasing needs bisectRight instead */
    static int lisNonDecreasing(int[] a) {
        List<Integer> tails = new ArrayList<>();
        for (int v : a) {
            int i = bisectRight(tails, v);
            if (i == tails.size()) tails.add(v);
            else tails.set(i, v);
        }
        return tails.size();
    }

    /** the O(n^2) version, for comparison on a small input */
    static int lisQuadratic(int[] a) {
        if (a.length == 0) return 0;
        int[] best = new int[a.length];
        Arrays.fill(best, 1);
        int answer = 1;
        for (int i = 0; i < a.length; i++) {
            for (int j = 0; j < i; j++) {
                if (a[j] < a[i]) best[i] = Math.max(best[i], best[j] + 1);
            }
            answer = Math.max(answer, best[i]);
        }
        return answer;
    }

    static long seed = 7;

    static long nextRand() {
        seed = (seed * 16807) % 2147483647L;
        return seed;
    }

    public static void main(String[] args) {
        int[] a = {10, 9, 2, 5, 3, 7, 101, 18};
        System.out.println("input: " + list(a));
        System.out.println("trace:");
        int n = lisLength(a, true);
        System.out.println("LIS length: " + n);

        System.out.println("\\nnote: tails is NOT the subsequence itself —");
        System.out.println("it is only ever the same *length* as one.");

        int[] b = {2, 2, 2, 3, 3};
        System.out.println("\\n" + list(b) + ": strict=" + lisLength(b, false)
                + "  non-decreasing=" + lisNonDecreasing(b));

        // A Lehmer generator rather than a library RNG: every language has to
        // produce the same 400 values for the two implementations to be
        // compared on the same input.
        int[] c = new int[400];
        for (int i = 0; i < 400; i++) c[i] = (int) (nextRand() % 1001);
        int fast = lisLength(c, false), slow = lisQuadratic(c);
        System.out.println("\\nboth agree on 400 pseudo-random values: " + fast + " vs " + slow
                + "  " + (fast == slow ? "ok" : "MISMATCH"));
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
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

/* Longest strictly increasing subsequence, O(n log n).

   \`tails[k]\` is the smallest possible tail of an increasing subsequence of
   length k+1. It is sorted, which is what lets binary search find the slot. */
size_t lisLength(const vector<int>& a, bool trace) {
    vector<int> tails;
    for (int v : a) {
        auto it = lower_bound(tails.begin(), tails.end(), v);
        if (it == tails.end()) tails.push_back(v);
        else *it = v;
        if (trace) {
            cout << "  saw " << setw(3) << v << " -> tails " << list(tails) << "\\n";
        }
    }
    return tails.size();
}

// non-decreasing needs upper_bound instead
size_t lisNonDecreasing(const vector<int>& a) {
    vector<int> tails;
    for (int v : a) {
        auto it = upper_bound(tails.begin(), tails.end(), v);
        if (it == tails.end()) tails.push_back(v);
        else *it = v;
    }
    return tails.size();
}

// the O(n^2) version, for comparison on a small input
size_t lisQuadratic(const vector<int>& a) {
    if (a.empty()) return 0;
    vector<int> best(a.size(), 1);
    int answer = 1;
    for (size_t i = 0; i < a.size(); i++) {
        for (size_t j = 0; j < i; j++) {
            if (a[j] < a[i]) best[i] = max(best[i], best[j] + 1);
        }
        answer = max(answer, best[i]);
    }
    return (size_t)answer;
}

long long seed = 7;

long long nextRand() {
    seed = (seed * 16807) % 2147483647LL;
    return seed;
}

int main() {
    vector<int> a = {10, 9, 2, 5, 3, 7, 101, 18};
    cout << "input: " << list(a) << "\\n";
    cout << "trace:\\n";
    size_t n = lisLength(a, true);
    cout << "LIS length: " << n << "\\n";

    cout << "\\nnote: tails is NOT the subsequence itself —\\n";
    cout << "it is only ever the same *length* as one.\\n";

    vector<int> b = {2, 2, 2, 3, 3};
    cout << "\\n" << list(b) << ": strict=" << lisLength(b, false)
         << "  non-decreasing=" << lisNonDecreasing(b) << "\\n";

    // A Lehmer generator rather than a library RNG: every language has to
    // produce the same 400 values for the two implementations to be compared
    // on the same input.
    vector<int> c;
    for (int i = 0; i < 400; i++) c.push_back((int)(nextRand() % 1001));
    size_t fast = lisLength(c, false), slow = lisQuadratic(c);
    cout << "\\nboth agree on 400 pseudo-random values: " << fast << " vs " << slow
         << "  " << (fast == slow ? "ok" : "MISMATCH") << "\\n";
}`,
            },
            {
              lang: "rust",
              code: `fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

/// Longest strictly increasing subsequence, O(n log n).
///
/// \`tails[k]\` is the smallest possible tail of an increasing subsequence of
/// length k+1. It is sorted, which is what lets binary search find the slot.
/// Rust spells both bisects \`partition_point\`; the predicate carries the
/// difference between them.
fn lis_length(a: &[i32], trace: bool) -> usize {
    let mut tails: Vec<i32> = Vec::new();
    for &v in a {
        let i = tails.partition_point(|&x| x < v);
        if i == tails.len() {
            tails.push(v);
        } else {
            tails[i] = v;
        }
        if trace {
            println!("  saw {:3} -> tails {}", v, list(&tails));
        }
    }
    tails.len()
}

/// non-decreasing needs \`<=\` in the predicate instead
fn lis_non_decreasing(a: &[i32]) -> usize {
    let mut tails: Vec<i32> = Vec::new();
    for &v in a {
        let i = tails.partition_point(|&x| x <= v);
        if i == tails.len() {
            tails.push(v);
        } else {
            tails[i] = v;
        }
    }
    tails.len()
}

/// the O(n^2) version, for comparison on a small input
fn lis_quadratic(a: &[i32]) -> usize {
    if a.is_empty() {
        return 0;
    }
    let mut best = vec![1usize; a.len()];
    let mut answer = 1;
    for i in 0..a.len() {
        for j in 0..i {
            if a[j] < a[i] {
                best[i] = best[i].max(best[j] + 1);
            }
        }
        answer = answer.max(best[i]);
    }
    answer
}

fn main() {
    let a = [10, 9, 2, 5, 3, 7, 101, 18];
    println!("input: {}", list(&a));
    println!("trace:");
    let n = lis_length(&a, true);
    println!("LIS length: {}", n);

    println!("\\nnote: tails is NOT the subsequence itself —");
    println!("it is only ever the same *length* as one.");

    let b = [2, 2, 2, 3, 3];
    println!(
        "\\n{}: strict={}  non-decreasing={}",
        list(&b),
        lis_length(&b, false),
        lis_non_decreasing(&b)
    );

    // A Lehmer generator rather than a library RNG: every language has to
    // produce the same 400 values for the two implementations to be compared
    // on the same input.
    let mut seed: i64 = 7;
    let mut next_rand = || {
        seed = (seed * 16807) % 2147483647;
        seed
    };
    let c: Vec<i32> = (0..400).map(|_| (next_rand() % 1001) as i32).collect();
    let (fast, slow) = (lis_length(&c, false), lis_quadratic(&c));
    println!(
        "\\nboth agree on 400 pseudo-random values: {} vs {}  {}",
        fast,
        slow,
        if fast == slow { "ok" } else { "MISMATCH" }
    );
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

// Longest strictly increasing subsequence, O(n log n).
//
// tails[k] is the smallest possible tail of an increasing subsequence of
// length k+1. It is sorted, which is what lets binary search find the slot.
// sort.SearchInts is bisect_left; bisect_right is sort.Search with the
// predicate loosened by one character.
func lisLength(a []int, trace bool) int {
	tails := []int{}
	for _, v := range a {
		i := sort.SearchInts(tails, v)
		if i == len(tails) {
			tails = append(tails, v)
		} else {
			tails[i] = v
		}
		if trace {
			fmt.Printf("  saw %3d -> tails %s\\n", v, list(tails))
		}
	}
	return len(tails)
}

// non-decreasing needs the strict predicate instead
func lisNonDecreasing(a []int) int {
	tails := []int{}
	for _, v := range a {
		i := sort.Search(len(tails), func(i int) bool { return tails[i] > v })
		if i == len(tails) {
			tails = append(tails, v)
		} else {
			tails[i] = v
		}
	}
	return len(tails)
}

// the O(n^2) version, for comparison on a small input
func lisQuadratic(a []int) int {
	if len(a) == 0 {
		return 0
	}
	best := make([]int, len(a))
	answer := 1
	for i := range a {
		best[i] = 1
		for j := 0; j < i; j++ {
			if a[j] < a[i] {
				best[i] = max(best[i], best[j]+1)
			}
		}
		answer = max(answer, best[i])
	}
	return answer
}

var seed int64 = 7

func nextRand() int64 {
	seed = (seed * 16807) % 2147483647
	return seed
}

func main() {
	a := []int{10, 9, 2, 5, 3, 7, 101, 18}
	fmt.Println("input:", list(a))
	fmt.Println("trace:")
	n := lisLength(a, true)
	fmt.Println("LIS length:", n)

	fmt.Println("\\nnote: tails is NOT the subsequence itself —")
	fmt.Println("it is only ever the same *length* as one.")

	b := []int{2, 2, 2, 3, 3}
	fmt.Printf("\\n%s: strict=%d  non-decreasing=%d\\n", list(b), lisLength(b, false), lisNonDecreasing(b))

	// A Lehmer generator rather than a library RNG: every language has to
	// produce the same 400 values for the two implementations to be compared
	// on the same input.
	c := make([]int, 400)
	for i := range c {
		c[i] = int(nextRand() % 1001)
	}
	fast, slow := lisLength(c, false), lisQuadratic(c)
	verdict := "MISMATCH"
	if fast == slow {
		verdict = "ok"
	}
	fmt.Printf("\\nboth agree on 400 pseudo-random values: %d vs %d  %s\\n", fast, slow, verdict)
}`,
            },
          ],
        },
      ],
    },
    {
      id: "others",
      heading: "The same move elsewhere",
      body: [
        "**Two-sum on a sorted array.** For each element, binary search for its complement — O(n log n), and the two-pointer version in the next module does it in O(n).",
        "**Counting pairs below a threshold.** Sort, then for each element `lower_bound` the largest partner that still fits, and add the count. The whole family of \"how many pairs satisfy…\" problems is this.",
        "**Merging intervals against a query set.** Sort the intervals by start, then binary search for the first interval that could overlap each query.",
        "**Any DP whose transition scans a sorted state.** Job scheduling with weights — sort jobs by end time, and binary search for the last job that does not conflict.",
        "The recognition cue is a nested loop where the inner one is looking for a boundary in something ordered, or something you could order without breaking the problem.",
      ],
      pitfalls: [
        {
          title: "Sorting may destroy the problem",
          body: "The LIS array is *not* sorted, and must not be — the order is the problem. Before sorting to enable a binary search, check that order does not carry meaning. This is the difference between \"count pairs with a small difference\", where sorting is free, and \"count inversions\", where sorting is the thing being measured.",
        },
        {
          title: "`bisect_left` against `bisect_right` is not a stylistic choice",
          body: "It decides whether equal elements are allowed, and the two answers can differ by the whole length of the array. Decide from the problem statement's wording — \"increasing\" is strict, \"non-decreasing\" and \"increasing or equal\" are not.",
        },
      ],
    },
  ],
  takeaways: [
    "Binary search usually appears as the inner step of a larger algorithm",
    "Any O(n²) scan over something you can keep sorted becomes O(n log n)",
    "LIS keeps `tails[k]` = smallest tail of a length-(k+1) subsequence",
    "That array is sorted automatically, which is what admits the search",
    "Replacing keeps the length; appending is what grows it",
    "`tails` has the right length but is not itself the subsequence",
    "`bisect_left` for strictly increasing, `bisect_right` for non-decreasing",
  ],
  status: "available",
};
