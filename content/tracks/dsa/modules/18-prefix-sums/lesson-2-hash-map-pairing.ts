import type { Lesson } from "@/content/types";

export const hashMapPairingLesson: Lesson = {
  id: "dsa-ps-hashmap",
  slug: "prefix-sums-with-a-hash-map",
  moduleSlug: "prefix-sums-and-range-queries",
  title: "Prefix Sums with a Hash Map",
  summary:
    "The single most valuable idea in this module. It finds subarrays summing to k in one pass with negatives allowed — exactly the case where the sliding window silently returns the wrong answer.",
  estimatedMinutes: 35,
  objectives: [
    "Derive the complement identity from the prefix definition",
    "Count subarrays summing to k in O(n)",
    "Explain why the map starts with `{0: 1}`",
    "Say why this works where a window does not",
    "Adapt it to \"longest\" rather than \"count\"",
  ],
  sections: [
    {
      id: "the-identity",
      heading: "One line of algebra",
      body: [
        "The sum of `a[i:j]` is `prefix[j] - prefix[i]`. Set that equal to k and rearrange:",
        "**`prefix[i] = prefix[j] - k`**",
        "So while walking the array with a running sum, at each position `j` the question \"how many subarrays ending here sum to k?\" becomes \"how many earlier prefixes equalled `running - k`?\" — which a hash map answers in O(1).",
        "That is the entire technique. One running total, one map from prefix value to how many times it has been seen, one lookup per element.",
      ],
      examples: [
        {
          id: "subarray-k",
          title: "Counting subarrays that sum to k",
          lang: "python",
          code: `from collections import defaultdict

def subarray_sum_equals_k(nums, k, trace=False):
    """Count subarrays summing to exactly k. Works with negatives."""
    seen = defaultdict(int)
    seen[0] = 1                      # the empty prefix
    running = 0
    total = 0
    for i, v in enumerate(nums):
        running += v
        found = seen[running - k]
        total += found
        if trace:
            print(f"  i={i} v={v:3} running={running:3}"
                  f"  looking for {running - k:3} -> found {found}"
                  f"  total={total}")
        seen[running] += 1
    return total

nums = [1, 2, 3, -3, 1, 1, 1]
print("array:", nums, " k=3")
print(subarray_sum_equals_k(nums, 3, trace=True))

def brute(nums, k):
    n = 0
    for i in range(len(nums)):
        s = 0
        for j in range(i, len(nums)):
            s += nums[j]
            if s == k:
                n += 1
    return n

print("\\nchecked against brute force:")
for xs, k in (([1,2,3,-3,1,1,1], 3), ([1,1,1], 2), ([-1,-1,1], 0), ([3,4,7,2,-3,1,4,2], 7)):
    a, b = subarray_sum_equals_k(xs, k), brute(xs, k)
    print(f"  {str(xs):26} k={k:2}: prefix {a:2}  brute {b:2}  {'ok' if a == b else 'MISMATCH'}")

print("\\nwhy seen[0] = 1 matters:")
print("  without it, a subarray starting at index 0 is never counted —")
print("  its prefix difference is running - 0, and 0 must already be in the map.")`,
          output: `array: [1, 2, 3, -3, 1, 1, 1]  k=3
  i=0 v=  1 running=  1  looking for  -2 -> found 0  total=0
  i=1 v=  2 running=  3  looking for   0 -> found 1  total=1
  i=2 v=  3 running=  6  looking for   3 -> found 1  total=2
  i=3 v= -3 running=  3  looking for   0 -> found 1  total=3
  i=4 v=  1 running=  4  looking for   1 -> found 1  total=4
  i=5 v=  1 running=  5  looking for   2 -> found 0  total=4
  i=6 v=  1 running=  6  looking for   3 -> found 2  total=6
6

checked against brute force:
  [1, 2, 3, -3, 1, 1, 1]     k= 3: prefix  6  brute  6  ok
  [1, 1, 1]                  k= 2: prefix  2  brute  2  ok
  [-1, -1, 1]                k= 0: prefix  1  brute  1  ok
  [3, 4, 7, 2, -3, 1, 4, 2]  k= 7: prefix  4  brute  4  ok

why seen[0] = 1 matters:
  without it, a subarray starting at index 0 is never counted —
  its prefix difference is running - 0, and 0 must already be in the map.`,
          explanation:
            "Follow `i=1`: the running sum is 3, we look for `3 - 3 = 0`, and find it once — the empty prefix — which correctly counts the subarray `[1, 2]` starting at index 0.\n\nThe input has a negative in it. Compare this against the sliding-window module's demonstration, where a single negative made the window return 4 instead of 1. **Nothing here cares about sign.** The identity `prefix[i] = prefix[j] - k` is algebra, not an argument about monotonicity, so it holds for any values at all.\n\nAt `i=6` the map already holds the prefix value 3 twice — from indices 1 and 3 — so one step counts two subarrays. That is why the map stores *counts* rather than a set of seen values.",
          alternates: [
            {
              lang: "javascript",
              code: `// Count subarrays summing to exactly k. Works with negatives.
const list = (xs) => "[" + xs.join(", ") + "]";
const padL = (v, w) => String(v).padStart(w);
const padR = (v, w) => String(v).padEnd(w);

function subarraySumEqualsK(nums, k, trace = false) {
  const seen = new Map();
  seen.set(0, 1); // the empty prefix
  let running = 0;
  let total = 0;
  for (let i = 0; i < nums.length; i++) {
    running += nums[i];
    const found = seen.get(running - k) ?? 0;
    total += found;
    if (trace) {
      console.log(
        \`  i=\${i} v=\${padL(nums[i], 3)} running=\${padL(running, 3)}\` +
          \`  looking for \${padL(running - k, 3)} -> found \${found}\` +
          \`  total=\${total}\`
      );
    }
    seen.set(running, (seen.get(running) ?? 0) + 1);
  }
  return total;
}

const nums = [1, 2, 3, -3, 1, 1, 1];
console.log("array:", list(nums), " k=3");
console.log(subarraySumEqualsK(nums, 3, true));

function brute(nums, k) {
  let n = 0;
  for (let i = 0; i < nums.length; i++) {
    let s = 0;
    for (let j = i; j < nums.length; j++) {
      s += nums[j];
      if (s === k) n++;
    }
  }
  return n;
}

console.log("\\nchecked against brute force:");
const cases = [
  [[1, 2, 3, -3, 1, 1, 1], 3],
  [[1, 1, 1], 2],
  [[-1, -1, 1], 0],
  [[3, 4, 7, 2, -3, 1, 4, 2], 7],
];
for (const [xs, k] of cases) {
  const a = subarraySumEqualsK(xs, k);
  const b = brute(xs, k);
  console.log(
    \`  \${padR(list(xs), 26)} k=\${padL(k, 2)}: prefix \${padL(a, 2)}  brute \${padL(b, 2)}  \${a === b ? "ok" : "MISMATCH"}\`
  );
}

console.log("\\nwhy seen[0] = 1 matters:");
console.log("  without it, a subarray starting at index 0 is never counted —");
console.log("  its prefix difference is running - 0, and 0 must already be in the map.");`,
            },
            {
              lang: "typescript",
              code: `// Count subarrays summing to exactly k. Works with negatives.
const list = (xs: number[]): string => "[" + xs.join(", ") + "]";
const padL = (v: number, w: number): string => String(v).padStart(w);
const padR = (v: string, w: number): string => String(v).padEnd(w);

function subarraySumEqualsK(nums: number[], k: number, trace = false): number {
  const seen = new Map<number, number>();
  seen.set(0, 1); // the empty prefix
  let running = 0;
  let total = 0;
  for (let i = 0; i < nums.length; i++) {
    running += nums[i];
    const found = seen.get(running - k) ?? 0;
    total += found;
    if (trace) {
      console.log(
        \`  i=\${i} v=\${padL(nums[i], 3)} running=\${padL(running, 3)}\` +
          \`  looking for \${padL(running - k, 3)} -> found \${found}\` +
          \`  total=\${total}\`
      );
    }
    seen.set(running, (seen.get(running) ?? 0) + 1);
  }
  return total;
}

const nums: number[] = [1, 2, 3, -3, 1, 1, 1];
console.log("array:", list(nums), " k=3");
console.log(subarraySumEqualsK(nums, 3, true));

function brute(nums: number[], k: number): number {
  let n = 0;
  for (let i = 0; i < nums.length; i++) {
    let s = 0;
    for (let j = i; j < nums.length; j++) {
      s += nums[j];
      if (s === k) n++;
    }
  }
  return n;
}

console.log("\\nchecked against brute force:");
const cases: [number[], number][] = [
  [[1, 2, 3, -3, 1, 1, 1], 3],
  [[1, 1, 1], 2],
  [[-1, -1, 1], 0],
  [[3, 4, 7, 2, -3, 1, 4, 2], 7],
];
for (const [xs, k] of cases) {
  const a = subarraySumEqualsK(xs, k);
  const b = brute(xs, k);
  console.log(
    \`  \${padR(list(xs), 26)} k=\${padL(k, 2)}: prefix \${padL(a, 2)}  brute \${padL(b, 2)}  \${a === b ? "ok" : "MISMATCH"}\`
  );
}

console.log("\\nwhy seen[0] = 1 matters:");
console.log("  without it, a subarray starting at index 0 is never counted —");
console.log("  its prefix difference is running - 0, and 0 must already be in the map.");`,
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

    /** Count subarrays summing to exactly k. Works with negatives. */
    static int subarraySumEqualsK(int[] nums, int k, boolean trace) {
        Map<Integer, Integer> seen = new HashMap<>();
        seen.put(0, 1);                  // the empty prefix
        int running = 0, total = 0;
        for (int i = 0; i < nums.length; i++) {
            running += nums[i];
            int found = seen.getOrDefault(running - k, 0);
            total += found;
            if (trace) {
                System.out.printf("  i=%d v=%3d running=%3d  looking for %3d -> found %d  total=%d%n",
                        i, nums[i], running, running - k, found, total);
            }
            seen.merge(running, 1, Integer::sum);
        }
        return total;
    }

    static int brute(int[] nums, int k) {
        int n = 0;
        for (int i = 0; i < nums.length; i++) {
            int s = 0;
            for (int j = i; j < nums.length; j++) {
                s += nums[j];
                if (s == k) n++;
            }
        }
        return n;
    }

    public static void main(String[] args) {
        int[] nums = {1, 2, 3, -3, 1, 1, 1};
        System.out.println("array: " + list(nums) + "  k=3");
        System.out.println(subarraySumEqualsK(nums, 3, true));

        System.out.println("\\nchecked against brute force:");
        int[][] arrays = {{1, 2, 3, -3, 1, 1, 1}, {1, 1, 1}, {-1, -1, 1}, {3, 4, 7, 2, -3, 1, 4, 2}};
        int[] ks = {3, 2, 0, 7};
        for (int i = 0; i < arrays.length; i++) {
            int a = subarraySumEqualsK(arrays[i], ks[i], false);
            int b = brute(arrays[i], ks[i]);
            System.out.printf("  %-26s k=%2d: prefix %2d  brute %2d  %s%n",
                    list(arrays[i]), ks[i], a, b, a == b ? "ok" : "MISMATCH");
        }

        System.out.println("\\nwhy seen[0] = 1 matters:");
        System.out.println("  without it, a subarray starting at index 0 is never counted —");
        System.out.println("  its prefix difference is running - 0, and 0 must already be in the map.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `// Count subarrays summing to exactly k. Works with negatives.
#include <iomanip>
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

int subarraySumEqualsK(const vector<int>& nums, int k, bool trace) {
    unordered_map<int, int> seen;
    seen[0] = 1;                     // the empty prefix
    int running = 0, total = 0;
    for (size_t i = 0; i < nums.size(); i++) {
        running += nums[i];
        int found = seen.count(running - k) ? seen[running - k] : 0;
        total += found;
        if (trace) {
            cout << "  i=" << i << " v=" << setw(3) << nums[i]
                 << " running=" << setw(3) << running
                 << "  looking for " << setw(3) << running - k
                 << " -> found " << found << "  total=" << total << "\\n";
        }
        seen[running]++;
    }
    return total;
}

int brute(const vector<int>& nums, int k) {
    int n = 0;
    for (size_t i = 0; i < nums.size(); i++) {
        int s = 0;
        for (size_t j = i; j < nums.size(); j++) {
            s += nums[j];
            if (s == k) n++;
        }
    }
    return n;
}

int main() {
    vector<int> nums = {1, 2, 3, -3, 1, 1, 1};
    cout << "array: " << list(nums) << "  k=3\\n";
    int answer = subarraySumEqualsK(nums, 3, true);
    cout << answer << "\\n";

    cout << "\\nchecked against brute force:\\n";
    vector<pair<vector<int>, int>> cases = {
        {{1, 2, 3, -3, 1, 1, 1}, 3}, {{1, 1, 1}, 2},
        {{-1, -1, 1}, 0}, {{3, 4, 7, 2, -3, 1, 4, 2}, 7}};
    for (const auto& [xs, k] : cases) {
        int a = subarraySumEqualsK(xs, k, false), b = brute(xs, k);
        cout << "  " << left << setw(26) << list(xs) << " k=" << right << setw(2) << k
             << ": prefix " << setw(2) << a << "  brute " << setw(2) << b
             << "  " << (a == b ? "ok" : "MISMATCH") << "\\n";
    }

    cout << "\\nwhy seen[0] = 1 matters:\\n";
    cout << "  without it, a subarray starting at index 0 is never counted —\\n";
    cout << "  its prefix difference is running - 0, and 0 must already be in the map.\\n";
}`,
            },
            {
              lang: "rust",
              code: `// Count subarrays summing to exactly k. Works with negatives.
use std::collections::HashMap;

fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn subarray_sum_equals_k(nums: &[i32], k: i32, trace: bool) -> i32 {
    let mut seen: HashMap<i32, i32> = HashMap::new();
    seen.insert(0, 1); // the empty prefix
    let (mut running, mut total) = (0, 0);
    for (i, v) in nums.iter().enumerate() {
        running += v;
        let found = *seen.get(&(running - k)).unwrap_or(&0);
        total += found;
        if trace {
            println!(
                "  i={} v={:3} running={:3}  looking for {:3} -> found {}  total={}",
                i,
                v,
                running,
                running - k,
                found,
                total
            );
        }
        *seen.entry(running).or_insert(0) += 1;
    }
    total
}

fn brute(nums: &[i32], k: i32) -> i32 {
    let mut n = 0;
    for i in 0..nums.len() {
        let mut s = 0;
        for j in i..nums.len() {
            s += nums[j];
            if s == k {
                n += 1;
            }
        }
    }
    n
}

fn main() {
    let nums = [1, 2, 3, -3, 1, 1, 1];
    println!("array: {}  k=3", list(&nums));
    println!("{}", subarray_sum_equals_k(&nums, 3, true));

    println!("\\nchecked against brute force:");
    let cases: Vec<(Vec<i32>, i32)> = vec![
        (vec![1, 2, 3, -3, 1, 1, 1], 3),
        (vec![1, 1, 1], 2),
        (vec![-1, -1, 1], 0),
        (vec![3, 4, 7, 2, -3, 1, 4, 2], 7),
    ];
    for (xs, k) in &cases {
        let (a, b) = (subarray_sum_equals_k(xs, *k, false), brute(xs, *k));
        println!(
            "  {:<26} k={:2}: prefix {:2}  brute {:2}  {}",
            list(xs),
            k,
            a,
            b,
            if a == b { "ok" } else { "MISMATCH" }
        );
    }

    println!("\\nwhy seen[0] = 1 matters:");
    println!("  without it, a subarray starting at index 0 is never counted —");
    println!("  its prefix difference is running - 0, and 0 must already be in the map.");
}`,
            },
            {
              lang: "go",
              code: `// Count subarrays summing to exactly k. Works with negatives.
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

func subarraySumEqualsK(nums []int, k int, trace bool) int {
	seen := map[int]int{}
	seen[0] = 1 // the empty prefix
	running, total := 0, 0
	for i, v := range nums {
		running += v
		found := seen[running-k]
		total += found
		if trace {
			fmt.Printf("  i=%d v=%3d running=%3d  looking for %3d -> found %d  total=%d\\n",
				i, v, running, running-k, found, total)
		}
		seen[running]++
	}
	return total
}

func brute(nums []int, k int) int {
	n := 0
	for i := range nums {
		s := 0
		for j := i; j < len(nums); j++ {
			s += nums[j]
			if s == k {
				n++
			}
		}
	}
	return n
}

func main() {
	nums := []int{1, 2, 3, -3, 1, 1, 1}
	fmt.Println("array:", list(nums), " k=3")
	fmt.Println(subarraySumEqualsK(nums, 3, true))

	fmt.Println("\\nchecked against brute force:")
	type testCase struct {
		xs []int
		k  int
	}
	cases := []testCase{
		{[]int{1, 2, 3, -3, 1, 1, 1}, 3},
		{[]int{1, 1, 1}, 2},
		{[]int{-1, -1, 1}, 0},
		{[]int{3, 4, 7, 2, -3, 1, 4, 2}, 7},
	}
	for _, c := range cases {
		a, b := subarraySumEqualsK(c.xs, c.k, false), brute(c.xs, c.k)
		verdict := "MISMATCH"
		if a == b {
			verdict = "ok"
		}
		fmt.Printf("  %-26s k=%2d: prefix %2d  brute %2d  %s\\n", list(c.xs), c.k, a, b, verdict)
	}

	fmt.Println("\\nwhy seen[0] = 1 matters:")
	fmt.Println("  without it, a subarray starting at index 0 is never counted —")
	fmt.Println("  its prefix difference is running - 0, and 0 must already be in the map.")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "the-zero-entry",
      heading: "`seen[0] = 1`",
      body: [
        "This one line is the most commonly forgotten part, and its absence produces an answer that is *nearly* right, which makes it worse.",
        "The empty prefix — the sum of the first zero elements — is 0, and it has been \"seen\" once before the loop starts. Without it, a subarray that begins at index 0 has `running - k == 0`, finds nothing, and goes uncounted.",
        "Test it on `[3]` with `k = 3`: the correct answer is 1, and without the initialisation it is 0. That is the smallest case that catches it, and it is worth running whenever this technique appears.",
      ],
    },
    {
      id: "variants",
      heading: "The variants",
      body: [
        "**Longest subarray summing to k.** Store the *first* index at which each prefix value appeared, and never overwrite — an earlier start gives a longer subarray. Then the answer is `j - first[running - k]`.",
        "**Shortest subarray summing to k.** Store the *most recent* index and always overwrite.",
        "**Subarray sum divisible by k.** Key the map on `running % k` instead of `running`, because two prefixes with the same remainder differ by a multiple of k. Remember to normalise a negative remainder — `((r % k) + k) % k` — in every language except Python.",
        "**Contiguous array with equal 0s and 1s.** Map every 0 to −1, then look for a subarray summing to 0. A reframing rather than a new technique.",
        "**Binary subarrays with sum k**, and **count of nice subarrays** — both are this, though both also yield to the at-most-k window trick.",
      ],
      pitfalls: [
        {
          title: "Recording the current prefix before doing the lookup",
          body: "The `seen[running] += 1` must come *after* the lookup, or an element equal to k counts itself twice through a zero-length subarray. In the loop above the order is: update running, look up, then record.",
        },
        {
          title: "Using a set instead of a count map",
          body: "For \"does such a subarray exist\" a set is enough. For \"how many\", the same prefix value can occur many times and each occurrence is a separate subarray — the trace above counts two at once. A set gives an undercount that only appears on inputs with repeated prefix values.",
        },
        {
          title: "Storing every index in a list \"just in case\"",
          body: "For the counting variant you need only the count; for longest, only the earliest index. Keeping lists of indices turns O(n) space into O(n) space with a much larger constant and tempts an O(n²) scan at query time.",
        },
      ],
    },
  ],
  takeaways: [
    "`prefix[i] = prefix[j] - k` is the whole technique",
    "Walk once with a running sum and a map from prefix value to count",
    "Initialise `seen[0] = 1` for the empty prefix, or subarrays from index 0 are lost",
    "Sign does not matter — this is algebra, not a monotonicity argument",
    "Look up *before* recording the current prefix",
    "Longest wants the earliest index; shortest wants the latest",
    "Divisible-by-k keys on the remainder, normalised to be non-negative",
  ],
  status: "available",
};
