import type { Lesson } from "@/content/types";

export const invertibleAggregatesLesson: Lesson = {
  id: "dsa-ps-invertible",
  slug: "which-aggregates-prefix",
  moduleSlug: "prefix-sums-and-range-queries",
  title: "Which Aggregates Prefix, and Which Do Not",
  summary:
    "Prefix sums work because subtraction undoes addition. State the requirement that way and it becomes obvious which other aggregates work — XOR does, minimum does not, and knowing why saves you writing the wrong one.",
  estimatedMinutes: 25,
  objectives: [
    "State the invertibility requirement",
    "Use prefix XOR for range-XOR queries",
    "Explain why prefix minimum and maximum do not work",
    "Name the structure that answers non-invertible range queries",
  ],
  sections: [
    {
      id: "the-requirement",
      heading: "The requirement is an inverse",
      body: [
        "`sum(a[lo:hi]) = prefix[hi] - prefix[lo]` works because subtraction **undoes** addition: the elements before `lo` were added into both prefixes, and subtracting removes them exactly.",
        "So the technique applies to any operation with an inverse — formally, any *group* operation. Addition has subtraction. XOR is its own inverse. Multiplication has division, with the caveats already covered.",
        "Minimum and maximum have no inverse. Once the minimum of a prefix is 3, nothing tells you what the minimum would have been without the first few elements. That is not a limitation of the implementation; it is the operation.",
      ],
      examples: [
        {
          id: "xor-prefix",
          title: "Prefix XOR, and why maximum fails",
          lang: "python",
          code: `from collections import defaultdict

# Prefix XOR: XOR is its own inverse, so it prefixes exactly like a sum.
def prefix_xor(a):
    p = [0] * (len(a) + 1)
    for i, v in enumerate(a):
        p[i + 1] = p[i] ^ v
    return p

a = [4, 2, 2, 6, 4]
p = prefix_xor(a)
print("array     :", a)
print("prefix xor:", p)
for lo, hi in ((0, 3), (1, 4), (2, 3)):
    got = p[hi] ^ p[lo]
    want = 0
    for v in a[lo:hi]:
        want ^= v
    print(f"  xor of a[{lo}:{hi}] = {got}  check {want}")

def count_xor_subarrays(nums, k):
    seen = defaultdict(int)
    seen[0] = 1
    run = 0
    total = 0
    for v in nums:
        run ^= v
        total += seen[run ^ k]
        seen[run] += 1
    return total

print("\\nsubarrays with xor = 6:", count_xor_subarrays([4, 2, 2, 6, 4], 6))

def brute_xor(nums, k):
    n = 0
    for i in range(len(nums)):
        x = 0
        for j in range(i, len(nums)):
            x ^= nums[j]
            if x == k:
                n += 1
    return n
print("brute force            :", brute_xor([4, 2, 2, 6, 4], 6))

# Which aggregates prefix, and which do not.
print("\\nwhich aggregates work:")
print("  sum      yes  — subtraction inverts addition")
print("  xor      yes  — xor is its own inverse")
print("  product  only with no zeros, and only for exact division")
print("  min/max  NO   — there is no inverse; removing the min tells you nothing")
print("  count    yes  — it is a sum of ones")

# demonstrating that max does not prefix
b = [3, 9, 1, 7]
pm = [float("-inf")]
for v in b:
    pm.append(max(pm[-1], v))
print(f"\\nprefix max of {b}: {pm[1:]}")
print("  max of b[1:3] is", max(b[1:3]), "but there is no arithmetic on")
print("  prefix maxima that recovers it — 9 is in both prefixes.")`,
          output: `array     : [4, 2, 2, 6, 4]
prefix xor: [0, 4, 6, 4, 2, 6]
  xor of a[0:3] = 4  check 4
  xor of a[1:4] = 6  check 6
  xor of a[2:3] = 2  check 2

subarrays with xor = 6: 4
brute force            : 4

which aggregates work:
  sum      yes  — subtraction inverts addition
  xor      yes  — xor is its own inverse
  product  only with no zeros, and only for exact division
  min/max  NO   — there is no inverse; removing the min tells you nothing
  count    yes  — it is a sum of ones

prefix max of [3, 9, 1, 7]: [3, 9, 9, 9]
  max of b[1:3] is 9 but there is no arithmetic on
  prefix maxima that recovers it — 9 is in both prefixes.`,
          explanation:
            "**Prefix XOR** substitutes directly into everything from lesson 2. The complement lookup becomes `run ^ k` instead of `run - k`, because XOR is its own inverse — `x ^ k ^ k == x`. That one substitution turns \"count subarrays summing to k\" into \"count subarrays XOR-ing to k\", which is a common problem in its own right.\n\nThe prefix-maximum output shows the failure concretely. `9` appears in the prefix maximum at every position from index 1 onwards, so both `pm[1]` and `pm[3]` are 9, and no operation on those two numbers recovers the maximum of the range between them.",
          alternates: [
            {
              lang: "javascript",
              code: `// Prefix XOR: XOR is its own inverse, so it prefixes exactly like a sum.
const list = (xs) => "[" + xs.join(", ") + "]";

function prefixXor(a) {
  const p = new Array(a.length + 1).fill(0);
  for (let i = 0; i < a.length; i++) p[i + 1] = p[i] ^ a[i];
  return p;
}

const a = [4, 2, 2, 6, 4];
const p = prefixXor(a);
console.log("array     :", list(a));
console.log("prefix xor:", list(p));
for (const [lo, hi] of [[0, 3], [1, 4], [2, 3]]) {
  const got = p[hi] ^ p[lo];
  let want = 0;
  for (const v of a.slice(lo, hi)) want ^= v;
  console.log(\`  xor of a[\${lo}:\${hi}] = \${got}  check \${want}\`);
}

function countXorSubarrays(nums, k) {
  const seen = new Map();
  seen.set(0, 1);
  let run = 0;
  let total = 0;
  for (const v of nums) {
    run ^= v;
    total += seen.get(run ^ k) ?? 0;
    seen.set(run, (seen.get(run) ?? 0) + 1);
  }
  return total;
}

console.log("\\nsubarrays with xor = 6:", countXorSubarrays([4, 2, 2, 6, 4], 6));

function bruteXor(nums, k) {
  let n = 0;
  for (let i = 0; i < nums.length; i++) {
    let x = 0;
    for (let j = i; j < nums.length; j++) {
      x ^= nums[j];
      if (x === k) n++;
    }
  }
  return n;
}
console.log("brute force            :", bruteXor([4, 2, 2, 6, 4], 6));

// Which aggregates prefix, and which do not.
console.log("\\nwhich aggregates work:");
console.log("  sum      yes  — subtraction inverts addition");
console.log("  xor      yes  — xor is its own inverse");
console.log("  product  only with no zeros, and only for exact division");
console.log("  min/max  NO   — there is no inverse; removing the min tells you nothing");
console.log("  count    yes  — it is a sum of ones");

// demonstrating that max does not prefix
const b = [3, 9, 1, 7];
const pm = [-Infinity];
for (const v of b) pm.push(Math.max(pm[pm.length - 1], v));
console.log(\`\\nprefix max of \${list(b)}: \${list(pm.slice(1))}\`);
console.log("  max of b[1:3] is", Math.max(...b.slice(1, 3)), "but there is no arithmetic on");
console.log("  prefix maxima that recovers it — 9 is in both prefixes.");`,
            },
            {
              lang: "typescript",
              code: `// Prefix XOR: XOR is its own inverse, so it prefixes exactly like a sum.
const list = (xs: number[]): string => "[" + xs.join(", ") + "]";

function prefixXor(a: number[]): number[] {
  const p = new Array(a.length + 1).fill(0);
  for (let i = 0; i < a.length; i++) p[i + 1] = p[i] ^ a[i];
  return p;
}

const a: number[] = [4, 2, 2, 6, 4];
const p = prefixXor(a);
console.log("array     :", list(a));
console.log("prefix xor:", list(p));
for (const [lo, hi] of [[0, 3], [1, 4], [2, 3]]) {
  const got = p[hi] ^ p[lo];
  let want = 0;
  for (const v of a.slice(lo, hi)) want ^= v;
  console.log(\`  xor of a[\${lo}:\${hi}] = \${got}  check \${want}\`);
}

function countXorSubarrays(nums: number[], k: number): number {
  const seen = new Map<number, number>();
  seen.set(0, 1);
  let run = 0;
  let total = 0;
  for (const v of nums) {
    run ^= v;
    total += seen.get(run ^ k) ?? 0;
    seen.set(run, (seen.get(run) ?? 0) + 1);
  }
  return total;
}

console.log("\\nsubarrays with xor = 6:", countXorSubarrays([4, 2, 2, 6, 4], 6));

function bruteXor(nums: number[], k: number): number {
  let n = 0;
  for (let i = 0; i < nums.length; i++) {
    let x = 0;
    for (let j = i; j < nums.length; j++) {
      x ^= nums[j];
      if (x === k) n++;
    }
  }
  return n;
}
console.log("brute force            :", bruteXor([4, 2, 2, 6, 4], 6));

// Which aggregates prefix, and which do not.
console.log("\\nwhich aggregates work:");
console.log("  sum      yes  — subtraction inverts addition");
console.log("  xor      yes  — xor is its own inverse");
console.log("  product  only with no zeros, and only for exact division");
console.log("  min/max  NO   — there is no inverse; removing the min tells you nothing");
console.log("  count    yes  — it is a sum of ones");

// demonstrating that max does not prefix
const b: number[] = [3, 9, 1, 7];
const pm: number[] = [-Infinity];
for (const v of b) pm.push(Math.max(pm[pm.length - 1], v));
console.log(\`\\nprefix max of \${list(b)}: \${list(pm.slice(1))}\`);
console.log("  max of b[1:3] is", Math.max(...b.slice(1, 3)), "but there is no arithmetic on");
console.log("  prefix maxima that recovers it — 9 is in both prefixes.");`,
            },
            {
              lang: "java",
              code: `import java.util.*;

/** Prefix XOR: XOR is its own inverse, so it prefixes exactly like a sum. */
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

    static int[] prefixXor(int[] a) {
        int[] p = new int[a.length + 1];
        for (int i = 0; i < a.length; i++) p[i + 1] = p[i] ^ a[i];
        return p;
    }

    static int countXorSubarrays(int[] nums, int k) {
        Map<Integer, Integer> seen = new HashMap<>();
        seen.put(0, 1);
        int run = 0, total = 0;
        for (int v : nums) {
            run ^= v;
            total += seen.getOrDefault(run ^ k, 0);
            seen.merge(run, 1, Integer::sum);
        }
        return total;
    }

    static int bruteXor(int[] nums, int k) {
        int n = 0;
        for (int i = 0; i < nums.length; i++) {
            int x = 0;
            for (int j = i; j < nums.length; j++) {
                x ^= nums[j];
                if (x == k) n++;
            }
        }
        return n;
    }

    public static void main(String[] args) {
        int[] a = {4, 2, 2, 6, 4};
        int[] p = prefixXor(a);
        System.out.println("array     : " + list(a));
        System.out.println("prefix xor: " + list(p));
        int[][] ranges = {{0, 3}, {1, 4}, {2, 3}};
        for (int[] r : ranges) {
            int lo = r[0], hi = r[1];
            int got = p[hi] ^ p[lo], want = 0;
            for (int i = lo; i < hi; i++) want ^= a[i];
            System.out.println("  xor of a[" + lo + ":" + hi + "] = " + got + "  check " + want);
        }

        System.out.println("\\nsubarrays with xor = 6: " + countXorSubarrays(a, 6));
        System.out.println("brute force            : " + bruteXor(a, 6));

        // Which aggregates prefix, and which do not.
        System.out.println("\\nwhich aggregates work:");
        System.out.println("  sum      yes  — subtraction inverts addition");
        System.out.println("  xor      yes  — xor is its own inverse");
        System.out.println("  product  only with no zeros, and only for exact division");
        System.out.println("  min/max  NO   — there is no inverse; removing the min tells you nothing");
        System.out.println("  count    yes  — it is a sum of ones");

        // demonstrating that max does not prefix
        int[] b = {3, 9, 1, 7};
        int[] pm = new int[b.length];
        int running = Integer.MIN_VALUE;
        for (int i = 0; i < b.length; i++) {
            running = Math.max(running, b[i]);
            pm[i] = running;
        }
        System.out.println("\\nprefix max of " + list(b) + ": " + list(pm));
        System.out.println("  max of b[1:3] is " + Math.max(b[1], b[2])
                + " but there is no arithmetic on");
        System.out.println("  prefix maxima that recovers it — 9 is in both prefixes.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `// Prefix XOR: XOR is its own inverse, so it prefixes exactly like a sum.
#include <algorithm>
#include <climits>
#include <iostream>
#include <string>
#include <unordered_map>
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

vector<int> prefixXor(const vector<int>& a) {
    vector<int> p(a.size() + 1, 0);
    for (size_t i = 0; i < a.size(); i++) p[i + 1] = p[i] ^ a[i];
    return p;
}

int countXorSubarrays(const vector<int>& nums, int k) {
    unordered_map<int, int> seen;
    seen[0] = 1;
    int run = 0, total = 0;
    for (int v : nums) {
        run ^= v;
        auto it = seen.find(run ^ k);
        if (it != seen.end()) total += it->second;
        seen[run]++;
    }
    return total;
}

int bruteXor(const vector<int>& nums, int k) {
    int n = 0;
    for (size_t i = 0; i < nums.size(); i++) {
        int x = 0;
        for (size_t j = i; j < nums.size(); j++) {
            x ^= nums[j];
            if (x == k) n++;
        }
    }
    return n;
}

int main() {
    vector<int> a = {4, 2, 2, 6, 4};
    vector<int> p = prefixXor(a);
    cout << "array     : " << list(a) << "\\n";
    cout << "prefix xor: " << list(p) << "\\n";
    for (auto [lo, hi] : vector<pair<int, int>>{{0, 3}, {1, 4}, {2, 3}}) {
        int got = p[hi] ^ p[lo], want = 0;
        for (int i = lo; i < hi; i++) want ^= a[i];
        cout << "  xor of a[" << lo << ":" << hi << "] = " << got << "  check " << want << "\\n";
    }

    cout << "\\nsubarrays with xor = 6: " << countXorSubarrays(a, 6) << "\\n";
    cout << "brute force            : " << bruteXor(a, 6) << "\\n";

    // Which aggregates prefix, and which do not.
    cout << "\\nwhich aggregates work:\\n";
    cout << "  sum      yes  — subtraction inverts addition\\n";
    cout << "  xor      yes  — xor is its own inverse\\n";
    cout << "  product  only with no zeros, and only for exact division\\n";
    cout << "  min/max  NO   — there is no inverse; removing the min tells you nothing\\n";
    cout << "  count    yes  — it is a sum of ones\\n";

    // demonstrating that max does not prefix
    vector<int> b = {3, 9, 1, 7};
    vector<int> pm;
    int running = INT_MIN;
    for (int v : b) {
        running = max(running, v);
        pm.push_back(running);
    }
    cout << "\\nprefix max of " << list(b) << ": " << list(pm) << "\\n";
    cout << "  max of b[1:3] is " << max(b[1], b[2]) << " but there is no arithmetic on\\n";
    cout << "  prefix maxima that recovers it — 9 is in both prefixes.\\n";
}`,
            },
            {
              lang: "rust",
              code: `// Prefix XOR: XOR is its own inverse, so it prefixes exactly like a sum.
use std::collections::HashMap;

fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn prefix_xor(a: &[i32]) -> Vec<i32> {
    let mut p = vec![0; a.len() + 1];
    for (i, v) in a.iter().enumerate() {
        p[i + 1] = p[i] ^ v;
    }
    p
}

fn count_xor_subarrays(nums: &[i32], k: i32) -> i32 {
    let mut seen: HashMap<i32, i32> = HashMap::new();
    seen.insert(0, 1);
    let (mut run, mut total) = (0, 0);
    for v in nums {
        run ^= v;
        total += seen.get(&(run ^ k)).copied().unwrap_or(0);
        *seen.entry(run).or_insert(0) += 1;
    }
    total
}

fn brute_xor(nums: &[i32], k: i32) -> i32 {
    let mut n = 0;
    for i in 0..nums.len() {
        let mut x = 0;
        for j in i..nums.len() {
            x ^= nums[j];
            if x == k {
                n += 1;
            }
        }
    }
    n
}

fn main() {
    let a = [4, 2, 2, 6, 4];
    let p = prefix_xor(&a);
    println!("array     : {}", list(&a));
    println!("prefix xor: {}", list(&p));
    for (lo, hi) in [(0usize, 3usize), (1, 4), (2, 3)] {
        let got = p[hi] ^ p[lo];
        let want = a[lo..hi].iter().fold(0, |acc, v| acc ^ v);
        println!("  xor of a[{}:{}] = {}  check {}", lo, hi, got, want);
    }

    println!("\\nsubarrays with xor = 6: {}", count_xor_subarrays(&a, 6));
    println!("brute force            : {}", brute_xor(&a, 6));

    // Which aggregates prefix, and which do not.
    println!("\\nwhich aggregates work:");
    println!("  sum      yes  — subtraction inverts addition");
    println!("  xor      yes  — xor is its own inverse");
    println!("  product  only with no zeros, and only for exact division");
    println!("  min/max  NO   — there is no inverse; removing the min tells you nothing");
    println!("  count    yes  — it is a sum of ones");

    // demonstrating that max does not prefix
    let b = [3, 9, 1, 7];
    let mut pm: Vec<i32> = Vec::new();
    let mut running = i32::MIN;
    for v in b {
        running = running.max(v);
        pm.push(running);
    }
    println!("\\nprefix max of {}: {}", list(&b), list(&pm));
    println!("  max of b[1:3] is {} but there is no arithmetic on", b[1].max(b[2]));
    println!("  prefix maxima that recovers it — 9 is in both prefixes.");
}`,
            },
            {
              lang: "go",
              code: `// Prefix XOR: XOR is its own inverse, so it prefixes exactly like a sum.
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

func prefixXor(a []int) []int {
	p := make([]int, len(a)+1)
	for i, v := range a {
		p[i+1] = p[i] ^ v
	}
	return p
}

func countXorSubarrays(nums []int, k int) int {
	seen := map[int]int{}
	seen[0] = 1
	run, total := 0, 0
	for _, v := range nums {
		run ^= v
		total += seen[run^k]
		seen[run]++
	}
	return total
}

func bruteXor(nums []int, k int) int {
	n := 0
	for i := range nums {
		x := 0
		for j := i; j < len(nums); j++ {
			x ^= nums[j]
			if x == k {
				n++
			}
		}
	}
	return n
}

func main() {
	a := []int{4, 2, 2, 6, 4}
	p := prefixXor(a)
	fmt.Println("array     :", list(a))
	fmt.Println("prefix xor:", list(p))
	for _, r := range [][2]int{{0, 3}, {1, 4}, {2, 3}} {
		lo, hi := r[0], r[1]
		got, want := p[hi]^p[lo], 0
		for _, v := range a[lo:hi] {
			want ^= v
		}
		fmt.Printf("  xor of a[%d:%d] = %d  check %d\\n", lo, hi, got, want)
	}

	fmt.Println("\\nsubarrays with xor = 6:", countXorSubarrays(a, 6))
	fmt.Println("brute force            :", bruteXor(a, 6))

	// Which aggregates prefix, and which do not.
	fmt.Println("\\nwhich aggregates work:")
	fmt.Println("  sum      yes  — subtraction inverts addition")
	fmt.Println("  xor      yes  — xor is its own inverse")
	fmt.Println("  product  only with no zeros, and only for exact division")
	fmt.Println("  min/max  NO   — there is no inverse; removing the min tells you nothing")
	fmt.Println("  count    yes  — it is a sum of ones")

	// demonstrating that max does not prefix
	b := []int{3, 9, 1, 7}
	pm := []int{}
	running := math.MinInt
	for _, v := range b {
		running = max(running, v)
		pm = append(pm, running)
	}
	fmt.Printf("\\nprefix max of %s: %s\\n", list(b), list(pm))
	fmt.Println("  max of b[1:3] is", max(b[1], b[2]), "but there is no arithmetic on")
	fmt.Println("  prefix maxima that recovers it — 9 is in both prefixes.")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "non-invertible",
      heading: "What to use instead",
      body: [
        "Range minimum, range maximum, and range GCD are all **idempotent** — `min(x, x) == x` — which fails the group requirement but enables a different structure.",
        "**Sparse table.** O(n log n) to build, O(1) per query, and the array must not change. It works by precomputing the answer for every power-of-two-length range and covering any query with two overlapping ones — overlapping is fine precisely *because* the operation is idempotent.",
        "**Segment tree.** O(n) to build, O(log n) per query, and it supports updates. The general answer for any associative operation.",
        "**Fenwick tree.** O(log n) for both, smaller and faster than a segment tree, but it needs an invertible operation — so it does sums and not minima.",
        "All three live in the advanced-structures elective. Knowing *which* one a problem needs is the part that matters here, and it follows directly from whether the operation has an inverse and whether the array changes.",
      ],
      pitfalls: [
        {
          title: "Prefix GCD looks like it works, and does not",
          body: "GCD has no inverse: `gcd(a[0:5])` and `gcd(a[0:2])` do not determine `gcd(a[2:5])`. It is a common near-miss because prefix GCD *arrays* are still useful for other purposes — just not for range queries.",
        },
        {
          title: "Using a sparse table on a mutable array",
          body: "It has no update operation. One element changing invalidates O(n log n) precomputed entries. If the array changes at all, it is a segment tree.",
        },
      ],
    },
  ],
  takeaways: [
    "Prefix queries need an operation with an inverse",
    "Sum, XOR and count work; minimum, maximum and GCD do not",
    "Prefix XOR substitutes into every technique from the hash-map lesson via `run ^ k`",
    "Products work only with no zeros and exact division",
    "Range min/max on a static array: sparse table, O(1) queries",
    "Anything mutable: segment tree, O(log n)",
    "Fenwick trees are smaller but still need invertibility",
  ],
  status: "available",
};
