import type { Lesson } from "@/content/types";

export const atMostKLesson: Lesson = {
  id: "dsa-sw-atmostk",
  slug: "at-most-k-and-the-exactly-k-trick",
  moduleSlug: "sliding-windows",
  title: "At Most K, and the Exactly-K Trick",
  summary:
    "\"Exactly k distinct\" is not windowable and \"at most k distinct\" is. The reframing that connects them is one subtraction, and it is the most reusable trick in this module.",
  estimatedMinutes: 30,
  objectives: [
    "Count subarrays with at most k distinct values",
    "Explain why `right - left + 1` counts windows rather than one",
    "Derive exactly-k from at-most-k",
    "Recognise other problems the same subtraction unlocks",
  ],
  sections: [
    {
      id: "why-exactly-fails",
      heading: "Why \"exactly\" resists a window",
      body: [
        "Apply the previous lesson's test to \"count subarrays with exactly 2 distinct values\". Adding an element can take the distinct count from 2 to 3 — invalid — and removing from the left can take it from 2 to 1 — also invalid. **The condition can break in both directions**, so there is no rule for which pointer to move.",
        "\"At most 2\", by contrast, only breaks upwards. Adding can push you over; removing brings you back. That is monotone, and a window handles it.",
      ],
    },
    {
      id: "counting",
      heading: "Counting windows, not finding one",
      body: [
        "There is a second idea here worth isolating, because it appears whenever a problem says *count the subarrays* rather than *find the best one*.",
        "When the window `[left, right]` is valid and `left` is as small as it can be, **every** window ending at `right` and starting anywhere from `left` to `right` is also valid — because shrinking a valid window keeps it valid under an at-most condition. There are `right - left + 1` of them, and adding that to a running total counts every valid subarray exactly once, grouped by its right endpoint.",
      ],
      examples: [
        {
          id: "at-most-k",
          title: "At most k, exactly k, and minimum window substring",
          lang: "python",
          code: `from collections import Counter, defaultdict

def at_most_k_distinct(nums, k):
    """Count subarrays with AT MOST k distinct values. This is windowable."""
    count = defaultdict(int)
    left = 0
    total = 0
    for right, v in enumerate(nums):
        count[v] += 1
        while len(count) > k:
            count[nums[left]] -= 1
            if count[nums[left]] == 0:
                del count[nums[left]]
            left += 1
        # every window ending at \`right\` and starting at >= left is valid
        total += right - left + 1
    return total

def exactly_k_distinct(nums, k):
    """exactly(k) = atMost(k) - atMost(k-1). The subtraction is the trick."""
    return at_most_k_distinct(nums, k) - at_most_k_distinct(nums, k - 1)

xs = [1, 2, 1, 2, 3]
print("array:", xs)
for k in (1, 2, 3):
    print(f"  at most {k}: {at_most_k_distinct(xs, k):2}   exactly {k}: {exactly_k_distinct(xs, k):2}")

def brute_exactly(nums, k):
    n = 0
    for i in range(len(nums)):
        for j in range(i, len(nums)):
            if len(set(nums[i:j + 1])) == k:
                n += 1
    return n

print("\\nchecked against brute force:")
for k in (1, 2, 3):
    print(f"  k={k}: window {exactly_k_distinct(xs, k)}  brute {brute_exactly(xs, k)}"
          f"  {'ok' if exactly_k_distinct(xs, k) == brute_exactly(xs, k) else 'MISMATCH'}")

def min_window(s, t):
    """Smallest substring of s containing every character of t, with multiplicity."""
    if not t or not s:
        return ""
    need = Counter(t)
    missing = len(t)
    left = 0
    best = (float("inf"), 0, 0)
    for right, ch in enumerate(s):
        if need[ch] > 0:
            missing -= 1
        need[ch] -= 1
        while missing == 0:
            if right - left + 1 < best[0]:
                best = (right - left + 1, left, right)
            need[s[left]] += 1
            if need[s[left]] > 0:
                missing += 1
            left += 1
    return "" if best[0] == float("inf") else s[best[1]:best[2] + 1]

for s, t in (("ADOBECODEBANC", "ABC"), ("a", "a"), ("a", "aa"), ("aa", "aa")):
    qs, qt = f'"{s}"', f'"{t}"'
    print(f'min_window({qs:15}, {qt:5}) = "{min_window(s, t)}"')`,
          output: `array: [1, 2, 1, 2, 3]
  at most 1:  5   exactly 1:  5
  at most 2: 12   exactly 2:  7
  at most 3: 15   exactly 3:  3

checked against brute force:
  k=1: window 5  brute 5  ok
  k=2: window 7  brute 7  ok
  k=3: window 3  brute 3  ok
min_window("ADOBECODEBANC", "ABC") = "BANC"
min_window("a"            , "a"  ) = "a"
min_window("a"            , "aa" ) = ""
min_window("aa"           , "aa" ) = "aa"`,
          explanation:
            "`exactly(2) = atMost(2) - atMost(1) = 12 - 5 = 7`, confirmed against brute force. The subtraction works because every subarray with at most 2 distinct values has either exactly 2 or exactly 1, so removing the at-most-1 count leaves precisely the exactly-2 ones.\n\n**Minimum window substring** is a different shape worth studying next to it. The state is a `need` map that goes *negative* for surplus characters, plus a single `missing` counter. `need[ch] > 0` before the decrement means this character was still required, so `missing` drops; after `left` moves, `need[s[left]] > 0` means we have just given up a character we needed. Tracking one integer rather than comparing two maps each step is what keeps it O(n) instead of O(n · alphabet).",
          alternates: [
            {
              lang: "javascript",
              code: `// At most k, exactly k, and the minimum window.
const list = (xs) => "[" + xs.join(", ") + "]";
const padL = (v, w) => String(v).padStart(w);

// Count subarrays with AT MOST k distinct values. This is windowable.
function atMostKDistinct(nums, k) {
  const count = new Map();
  let left = 0;
  let total = 0;
  for (let right = 0; right < nums.length; right++) {
    const v = nums[right];
    count.set(v, (count.get(v) ?? 0) + 1);
    while (count.size > k) {
      const out = nums[left];
      count.set(out, count.get(out) - 1);
      if (count.get(out) === 0) count.delete(out);
      left++;
    }
    // every window ending at \`right\` and starting at >= left is valid
    total += right - left + 1;
  }
  return total;
}

// exactly(k) = atMost(k) - atMost(k-1). The subtraction is the trick.
function exactlyKDistinct(nums, k) {
  return atMostKDistinct(nums, k) - atMostKDistinct(nums, k - 1);
}

const xs = [1, 2, 1, 2, 3];
console.log("array:", list(xs));
for (const k of [1, 2, 3]) {
  console.log(
    \`  at most \${k}: \${padL(atMostKDistinct(xs, k), 2)}   exactly \${k}: \${padL(exactlyKDistinct(xs, k), 2)}\`
  );
}

function bruteExactly(nums, k) {
  let n = 0;
  for (let i = 0; i < nums.length; i++) {
    for (let j = i; j < nums.length; j++) {
      if (new Set(nums.slice(i, j + 1)).size === k) n++;
    }
  }
  return n;
}

console.log("\\nchecked against brute force:");
for (const k of [1, 2, 3]) {
  const w = exactlyKDistinct(xs, k);
  const b = bruteExactly(xs, k);
  console.log(\`  k=\${k}: window \${w}  brute \${b}  \${w === b ? "ok" : "MISMATCH"}\`);
}

// Smallest substring of s containing every character of t, with multiplicity.
function minWindow(s, t) {
  if (t.length === 0 || s.length === 0) return "";
  const need = new Map();
  for (const ch of t) need.set(ch, (need.get(ch) ?? 0) + 1);
  let missing = t.length;
  let left = 0;
  let bestLen = Infinity;
  let bestLo = 0;
  let bestHi = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if ((need.get(ch) ?? 0) > 0) missing--;
    need.set(ch, (need.get(ch) ?? 0) - 1);
    while (missing === 0) {
      if (right - left + 1 < bestLen) {
        bestLen = right - left + 1;
        bestLo = left;
        bestHi = right;
      }
      const out = s[left];
      need.set(out, need.get(out) + 1);
      if (need.get(out) > 0) missing++;
      left++;
    }
  }
  return bestLen === Infinity ? "" : s.slice(bestLo, bestHi + 1);
}

for (const [s, t] of [["ADOBECODEBANC", "ABC"], ["a", "a"], ["a", "aa"], ["aa", "aa"]]) {
  const qs = \`"\${s}"\`;
  const qt = \`"\${t}"\`;
  console.log(\`min_window(\${qs.padEnd(15)}, \${qt.padEnd(5)}) = "\${minWindow(s, t)}"\`);
}`,
            },
            {
              lang: "typescript",
              code: `// At most k, exactly k, and the minimum window.
const list = (xs: number[]): string => "[" + xs.join(", ") + "]";
const padL = (v: number, w: number): string => String(v).padStart(w);

// Count subarrays with AT MOST k distinct values. This is windowable.
function atMostKDistinct(nums: number[], k: number): number {
  const count = new Map<number, number>();
  let left = 0;
  let total = 0;
  for (let right = 0; right < nums.length; right++) {
    const v = nums[right];
    count.set(v, (count.get(v) ?? 0) + 1);
    while (count.size > k) {
      const out = nums[left];
      count.set(out, count.get(out)! - 1);
      if (count.get(out) === 0) count.delete(out);
      left++;
    }
    // every window ending at \`right\` and starting at >= left is valid
    total += right - left + 1;
  }
  return total;
}

// exactly(k) = atMost(k) - atMost(k-1). The subtraction is the trick.
function exactlyKDistinct(nums: number[], k: number): number {
  return atMostKDistinct(nums, k) - atMostKDistinct(nums, k - 1);
}

const xs: number[] = [1, 2, 1, 2, 3];
console.log("array:", list(xs));
for (const k of [1, 2, 3]) {
  console.log(
    \`  at most \${k}: \${padL(atMostKDistinct(xs, k), 2)}   exactly \${k}: \${padL(exactlyKDistinct(xs, k), 2)}\`
  );
}

function bruteExactly(nums: number[], k: number): number {
  let n = 0;
  for (let i = 0; i < nums.length; i++) {
    for (let j = i; j < nums.length; j++) {
      if (new Set(nums.slice(i, j + 1)).size === k) n++;
    }
  }
  return n;
}

console.log("\\nchecked against brute force:");
for (const k of [1, 2, 3]) {
  const w = exactlyKDistinct(xs, k);
  const b = bruteExactly(xs, k);
  console.log(\`  k=\${k}: window \${w}  brute \${b}  \${w === b ? "ok" : "MISMATCH"}\`);
}

// Smallest substring of s containing every character of t, with multiplicity.
function minWindow(s: string, t: string): string {
  if (t.length === 0 || s.length === 0) return "";
  const need = new Map<string, number>();
  for (const ch of t) need.set(ch, (need.get(ch) ?? 0) + 1);
  let missing = t.length;
  let left = 0;
  let bestLen = Infinity;
  let bestLo = 0;
  let bestHi = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if ((need.get(ch) ?? 0) > 0) missing--;
    need.set(ch, (need.get(ch) ?? 0) - 1);
    while (missing === 0) {
      if (right - left + 1 < bestLen) {
        bestLen = right - left + 1;
        bestLo = left;
        bestHi = right;
      }
      const out = s[left];
      need.set(out, need.get(out)! + 1);
      if (need.get(out)! > 0) missing++;
      left++;
    }
  }
  return bestLen === Infinity ? "" : s.slice(bestLo, bestHi + 1);
}

for (const [s, t] of [["ADOBECODEBANC", "ABC"], ["a", "a"], ["a", "aa"], ["aa", "aa"]]) {
  const qs = \`"\${s}"\`;
  const qt = \`"\${t}"\`;
  console.log(\`min_window(\${qs.padEnd(15)}, \${qt.padEnd(5)}) = "\${minWindow(s, t)}"\`);
}`,
            },
            {
              lang: "java",
              code: `import java.util.*;

/** At most k, exactly k, and the minimum window. */
public class Main {
    static String list(int[] xs) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < xs.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(xs[i]);
        }
        return sb.append("]").toString();
    }

    /** Count subarrays with AT MOST k distinct values. This is windowable. */
    static long atMostKDistinct(int[] nums, int k) {
        Map<Integer, Integer> count = new HashMap<>();
        int left = 0;
        long total = 0;
        for (int right = 0; right < nums.length; right++) {
            count.merge(nums[right], 1, Integer::sum);
            while (count.size() > k) {
                int out = nums[left];
                if (count.merge(out, -1, Integer::sum) == 0) count.remove(out);
                left++;
            }
            // every window ending at \`right\` and starting at >= left is valid
            total += right - left + 1;
        }
        return total;
    }

    /** exactly(k) = atMost(k) - atMost(k-1). The subtraction is the trick. */
    static long exactlyKDistinct(int[] nums, int k) {
        return atMostKDistinct(nums, k) - atMostKDistinct(nums, k - 1);
    }

    static long bruteExactly(int[] nums, int k) {
        long n = 0;
        for (int i = 0; i < nums.length; i++) {
            for (int j = i; j < nums.length; j++) {
                Set<Integer> seen = new HashSet<>();
                for (int m = i; m <= j; m++) seen.add(nums[m]);
                if (seen.size() == k) n++;
            }
        }
        return n;
    }

    /** Smallest substring of s containing every character of t, with multiplicity. */
    static String minWindow(String s, String t) {
        if (t.isEmpty() || s.isEmpty()) return "";
        Map<Character, Integer> need = new HashMap<>();
        for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);
        int missing = t.length();
        int left = 0, bestLen = Integer.MAX_VALUE, bestLo = 0, bestHi = 0;
        for (int right = 0; right < s.length(); right++) {
            char ch = s.charAt(right);
            if (need.getOrDefault(ch, 0) > 0) missing--;
            need.merge(ch, -1, Integer::sum);
            while (missing == 0) {
                if (right - left + 1 < bestLen) {
                    bestLen = right - left + 1;
                    bestLo = left;
                    bestHi = right;
                }
                char out = s.charAt(left);
                if (need.merge(out, 1, Integer::sum) > 0) missing++;
                left++;
            }
        }
        return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestLo, bestHi + 1);
    }

    public static void main(String[] args) {
        int[] xs = {1, 2, 1, 2, 3};
        System.out.println("array: " + list(xs));
        for (int k : new int[]{1, 2, 3}) {
            System.out.printf("  at most %d: %2d   exactly %d: %2d%n",
                    k, atMostKDistinct(xs, k), k, exactlyKDistinct(xs, k));
        }

        System.out.println("\\nchecked against brute force:");
        for (int k : new int[]{1, 2, 3}) {
            long w = exactlyKDistinct(xs, k), b = bruteExactly(xs, k);
            System.out.printf("  k=%d: window %d  brute %d  %s%n", k, w, b, w == b ? "ok" : "MISMATCH");
        }

        String[][] pairs = {{"ADOBECODEBANC", "ABC"}, {"a", "a"}, {"a", "aa"}, {"aa", "aa"}};
        for (String[] p : pairs) {
            System.out.printf("min_window(%-15s, %-5s) = \\"%s\\"%n",
                    "\\"" + p[0] + "\\"", "\\"" + p[1] + "\\"", minWindow(p[0], p[1]));
        }
    }
}`,
            },
            {
              lang: "cpp",
              code: `// At most k, exactly k, and the minimum window.
#include <climits>
#include <iomanip>
#include <iostream>
#include <set>
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

// Count subarrays with AT MOST k distinct values. This is windowable.
long long atMostKDistinct(const vector<int>& nums, int k) {
    unordered_map<int, int> count;
    int left = 0;
    long long total = 0;
    for (int right = 0; right < (int)nums.size(); right++) {
        count[nums[right]]++;
        while ((int)count.size() > k) {
            int out = nums[left];
            if (--count[out] == 0) count.erase(out);
            left++;
        }
        // every window ending at \`right\` and starting at >= left is valid
        total += right - left + 1;
    }
    return total;
}

// exactly(k) = atMost(k) - atMost(k-1). The subtraction is the trick.
long long exactlyKDistinct(const vector<int>& nums, int k) {
    return atMostKDistinct(nums, k) - atMostKDistinct(nums, k - 1);
}

long long bruteExactly(const vector<int>& nums, int k) {
    long long n = 0;
    for (size_t i = 0; i < nums.size(); i++)
        for (size_t j = i; j < nums.size(); j++) {
            set<int> seen(nums.begin() + i, nums.begin() + j + 1);
            if ((int)seen.size() == k) n++;
        }
    return n;
}

// Smallest substring of s containing every character of t, with multiplicity.
string minWindow(const string& s, const string& t) {
    if (t.empty() || s.empty()) return "";
    unordered_map<char, int> need;
    for (char c : t) need[c]++;
    int missing = (int)t.size();
    int left = 0, bestLen = INT_MAX, bestLo = 0, bestHi = 0;
    for (int right = 0; right < (int)s.size(); right++) {
        char ch = s[right];
        if (need[ch] > 0) missing--;
        need[ch]--;
        while (missing == 0) {
            if (right - left + 1 < bestLen) {
                bestLen = right - left + 1;
                bestLo = left;
                bestHi = right;
            }
            char out = s[left];
            if (++need[out] > 0) missing++;
            left++;
        }
    }
    return bestLen == INT_MAX ? "" : s.substr(bestLo, bestHi - bestLo + 1);
}

int main() {
    vector<int> xs = {1, 2, 1, 2, 3};
    cout << "array: " << list(xs) << "\\n";
    for (int k : {1, 2, 3}) {
        cout << "  at most " << k << ": " << setw(2) << atMostKDistinct(xs, k)
             << "   exactly " << k << ": " << setw(2) << exactlyKDistinct(xs, k) << "\\n";
    }

    cout << "\\nchecked against brute force:\\n";
    for (int k : {1, 2, 3}) {
        long long w = exactlyKDistinct(xs, k), b = bruteExactly(xs, k);
        cout << "  k=" << k << ": window " << w << "  brute " << b
             << "  " << (w == b ? "ok" : "MISMATCH") << "\\n";
    }

    vector<pair<string, string>> pairs = {
        {"ADOBECODEBANC", "ABC"}, {"a", "a"}, {"a", "aa"}, {"aa", "aa"}};
    for (const auto& [s, t] : pairs) {
        cout << "min_window(" << left << setw(15) << ("\\"" + s + "\\"") << ", "
             << left << setw(5) << ("\\"" + t + "\\"") << ") = \\"" << minWindow(s, t) << "\\"\\n";
    }
}`,
            },
            {
              lang: "rust",
              code: `// At most k, exactly k, and the minimum window.
use std::collections::{HashMap, HashSet};

fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

/// Count subarrays with AT MOST k distinct values. This is windowable.
fn at_most_k_distinct(nums: &[i32], k: usize) -> i64 {
    let mut count: HashMap<i32, i32> = HashMap::new();
    let mut left = 0usize;
    let mut total: i64 = 0;
    for right in 0..nums.len() {
        *count.entry(nums[right]).or_insert(0) += 1;
        while count.len() > k {
            let out = nums[left];
            let c = count.get_mut(&out).unwrap();
            *c -= 1;
            if *c == 0 {
                count.remove(&out);
            }
            left += 1;
        }
        // every window ending at \`right\` and starting at >= left is valid.
        // \`right + 1 - left\`, not \`right - left + 1\`: with k = 0 the shrink
        // loop leaves left at right + 1, and the second form underflows usize.
        total += (right + 1 - left) as i64;
    }
    total
}

/// exactly(k) = at_most(k) - at_most(k-1). The subtraction is the trick.
fn exactly_k_distinct(nums: &[i32], k: usize) -> i64 {
    at_most_k_distinct(nums, k) - at_most_k_distinct(nums, k - 1)
}

fn brute_exactly(nums: &[i32], k: usize) -> i64 {
    let mut n = 0;
    for i in 0..nums.len() {
        for j in i..nums.len() {
            let seen: HashSet<i32> = nums[i..=j].iter().copied().collect();
            if seen.len() == k {
                n += 1;
            }
        }
    }
    n
}

/// Smallest substring of s containing every character of t, with multiplicity.
fn min_window(s: &str, t: &str) -> String {
    let sc: Vec<char> = s.chars().collect();
    if t.is_empty() || sc.is_empty() {
        return String::new();
    }
    let mut need: HashMap<char, i32> = HashMap::new();
    for c in t.chars() {
        *need.entry(c).or_insert(0) += 1;
    }
    let mut missing = t.chars().count() as i32;
    let mut left = 0usize;
    let (mut best_len, mut best_lo, mut best_hi) = (usize::MAX, 0usize, 0usize);
    for right in 0..sc.len() {
        let ch = sc[right];
        let e = need.entry(ch).or_insert(0);
        if *e > 0 {
            missing -= 1;
        }
        *e -= 1;
        while missing == 0 {
            if right - left + 1 < best_len {
                best_len = right - left + 1;
                best_lo = left;
                best_hi = right;
            }
            let out = sc[left];
            let e = need.entry(out).or_insert(0);
            *e += 1;
            if *e > 0 {
                missing += 1;
            }
            left += 1;
        }
    }
    if best_len == usize::MAX {
        String::new()
    } else {
        sc[best_lo..=best_hi].iter().collect()
    }
}

fn main() {
    let xs = [1, 2, 1, 2, 3];
    println!("array: {}", list(&xs));
    for k in 1..=3usize {
        println!(
            "  at most {}: {:2}   exactly {}: {:2}",
            k,
            at_most_k_distinct(&xs, k),
            k,
            exactly_k_distinct(&xs, k)
        );
    }

    println!("\\nchecked against brute force:");
    for k in 1..=3usize {
        let (w, b) = (exactly_k_distinct(&xs, k), brute_exactly(&xs, k));
        println!(
            "  k={}: window {}  brute {}  {}",
            k,
            w,
            b,
            if w == b { "ok" } else { "MISMATCH" }
        );
    }

    let pairs = [
        ("ADOBECODEBANC", "ABC"),
        ("a", "a"),
        ("a", "aa"),
        ("aa", "aa"),
    ];
    for (s, t) in pairs {
        println!(
            "min_window({:<15}, {:<5}) = \\"{}\\"",
            format!("\\"{}\\"", s),
            format!("\\"{}\\"", t),
            min_window(s, t)
        );
    }
}`,
            },
            {
              lang: "go",
              code: `// At most k, exactly k, and the minimum window.
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

// Count subarrays with AT MOST k distinct values. This is windowable.
func atMostKDistinct(nums []int, k int) int {
	count := map[int]int{}
	left, total := 0, 0
	for right := 0; right < len(nums); right++ {
		count[nums[right]]++
		for len(count) > k {
			out := nums[left]
			count[out]--
			if count[out] == 0 {
				delete(count, out)
			}
			left++
		}
		// every window ending at \`right\` and starting at >= left is valid
		total += right - left + 1
	}
	return total
}

// exactly(k) = atMost(k) - atMost(k-1). The subtraction is the trick.
func exactlyKDistinct(nums []int, k int) int {
	return atMostKDistinct(nums, k) - atMostKDistinct(nums, k-1)
}

func bruteExactly(nums []int, k int) int {
	n := 0
	for i := range nums {
		for j := i; j < len(nums); j++ {
			seen := map[int]bool{}
			for m := i; m <= j; m++ {
				seen[nums[m]] = true
			}
			if len(seen) == k {
				n++
			}
		}
	}
	return n
}

// Smallest substring of s containing every character of t, with multiplicity.
func minWindow(s, t string) string {
	if len(t) == 0 || len(s) == 0 {
		return ""
	}
	need := map[byte]int{}
	for i := 0; i < len(t); i++ {
		need[t[i]]++
	}
	missing := len(t)
	left, bestLen, bestLo, bestHi := 0, -1, 0, 0
	for right := 0; right < len(s); right++ {
		ch := s[right]
		if need[ch] > 0 {
			missing--
		}
		need[ch]--
		for missing == 0 {
			if bestLen == -1 || right-left+1 < bestLen {
				bestLen = right - left + 1
				bestLo, bestHi = left, right
			}
			out := s[left]
			need[out]++
			if need[out] > 0 {
				missing++
			}
			left++
		}
	}
	if bestLen == -1 {
		return ""
	}
	return s[bestLo : bestHi+1]
}

func main() {
	xs := []int{1, 2, 1, 2, 3}
	fmt.Println("array:", list(xs))
	for k := 1; k <= 3; k++ {
		fmt.Printf("  at most %d: %2d   exactly %d: %2d\\n",
			k, atMostKDistinct(xs, k), k, exactlyKDistinct(xs, k))
	}

	fmt.Println("\\nchecked against brute force:")
	for k := 1; k <= 3; k++ {
		w, b := exactlyKDistinct(xs, k), bruteExactly(xs, k)
		verdict := "MISMATCH"
		if w == b {
			verdict = "ok"
		}
		fmt.Printf("  k=%d: window %d  brute %d  %s\\n", k, w, b, verdict)
	}

	pairs := [][2]string{{"ADOBECODEBANC", "ABC"}, {"a", "a"}, {"a", "aa"}, {"aa", "aa"}}
	for _, p := range pairs {
		fmt.Printf("min_window(%-15s, %-5s) = %q\\n", \`"\`+p[0]+\`"\`, \`"\`+p[1]+\`"\`, minWindow(p[0], p[1]))
	}
}`,
            },
          ],
        },
      ],
    },
    {
      id: "the-family",
      heading: "Where else the subtraction works",
      body: [
        "The trick is not about distinct values. It applies whenever \"exactly k\" is not monotone but \"at most k\" is.",
        "**Subarrays with exactly k odd numbers** — count odds instead of distinct values, same subtraction. This is LeetCode's \"Count Number of Nice Subarrays\".",
        "**Subarrays with sum exactly k, all values non-negative** — `atMost(k) - atMost(k - 1)`.",
        "**Binary subarrays with sum exactly k** — the same.",
        "The recognition cue is the word **exactly** in a *counting* problem. Ask whether the at-most version is windowable; if it is, write that function once and call it twice.",
      ],
      pitfalls: [
        {
          title: "`atMost(k - 1)` when k is 0",
          body: "The subtraction calls the helper with `k - 1`, which is `-1` when `k` is zero. The helper must return 0 rather than misbehaving — with the `while len(count) > k` form it does, because the window immediately empties. Check it rather than assume it.",
        },
        {
          title: "Deleting the key at zero, not just decrementing",
          body: "`len(count)` is the distinct count, so a key sitting at zero still inflates it. The `del` is load-bearing. Using a plain integer `distinct` counter that you decrement when a count hits zero is equivalent and slightly faster.",
        },
        {
          title: "Counting `right - left + 1` before the shrink",
          body: "The count must be added *after* the inner while restores validity, or you are counting invalid windows. It is one line in the wrong place and the answer is silently too large.",
        },
      ],
    },
  ],
  takeaways: [
    "\"Exactly k\" breaks in both directions and is not windowable; \"at most k\" is",
    "`exactly(k) = atMost(k) - atMost(k - 1)`",
    "For counting problems, add `right - left + 1` after restoring validity",
    "That counts every valid subarray once, grouped by right endpoint",
    "Delete a frequency key at zero or the distinct count is wrong",
    "Minimum window substring tracks one `missing` integer, not a map comparison",
    "The cue is the word \"exactly\" in a counting problem",
  ],
  status: "available",
};
