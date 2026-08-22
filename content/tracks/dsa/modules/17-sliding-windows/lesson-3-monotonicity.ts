import type { Lesson } from "@/content/types";

export const monotonicityLesson: Lesson = {
  id: "dsa-sw-monotone",
  slug: "the-monotonicity-condition",
  moduleSlug: "sliding-windows",
  title: "The Condition That Decides Whether It Applies",
  summary:
    "A sliding window is only valid when extending the window can push the condition in one direction and shrinking it can push it back. One negative number destroys that — and the code still runs, still returns a number, and is wrong.",
  estimatedMinutes: 30,
  objectives: [
    "State the monotonicity requirement precisely",
    "Check it before committing to a window",
    "Explain why negative numbers break the sum-based window",
    "Name the replacement technique when the window does not apply",
  ],
  sections: [
    {
      id: "the-requirement",
      heading: "The requirement",
      body: [
        "The shrink step assumes something specific: **once the window is invalid, making it wider cannot fix it — only making it narrower can.**",
        "For \"sum at least 7 with all-positive values\", that holds. Adding an element only increases the sum, so if the window is already too big, growing it further will not help; removing from the left is the only move.",
        "That is the condition. Written as a property: as the window grows, the quantity you are testing must move in one direction only, and as it shrinks, back the other way. If it can move both ways under the same operation, the pointers have no rule to follow.",
      ],
    },
    {
      id: "the-failure",
      heading: "One negative number",
      body: [
        "Introduce a single negative value and the property is gone: extending the window can now *decrease* the sum. So a window that is currently too large might become valid by growing — and the algorithm, which only ever shrinks in that situation, never finds out.",
      ],
      examples: [
        {
          id: "monotone",
          title: "The same code, correct then wrong",
          lang: "python",
          code: `# The monotonicity condition, and where it fails.

def min_len_positive(target, nums):
    left, total, best = 0, 0, None
    for right, v in enumerate(nums):
        total += v
        while total >= target:
            span = right - left + 1
            best = span if best is None else min(best, span)
            total -= nums[left]
            left += 1
    return best or 0

pos = [2, 3, 1, 2, 4, 3]
print("all positive:", pos, " target 7 ->", min_len_positive(7, pos))

# With a negative in the array the shrink rule is unjustified.
neg = [2, -1, 2, 3, -4, 5]
print("\\nwith negatives:", neg, " target 5")
print("  window answer :", min_len_positive(5, neg))

def brute_min_len(target, nums):
    best = None
    for i in range(len(nums)):
        s = 0
        for j in range(i, len(nums)):
            s += nums[j]
            if s >= target:
                span = j - i + 1
                best = span if best is None else min(best, span)
                break
    return best or 0

print("  brute force   :", brute_min_len(5, neg))
print("  they disagree :", min_len_positive(5, neg) != brute_min_len(5, neg))

# why: extending a window no longer only increases the sum
print("\\nprefix sums of", neg)
run = 0
for i, v in enumerate(neg):
    run += v
    print(f"  after index {i}: running sum {run:3}")
print("\\nThe running sum falls at index 1 and index 4. A window's sum is not a")
print("monotone function of its right edge, so 'shrink while valid' is invalid.")`,
          output: `all positive: [2, 3, 1, 2, 4, 3]  target 7 -> 2

with negatives: [2, -1, 2, 3, -4, 5]  target 5
  window answer : 4
  brute force   : 1
  they disagree : True

prefix sums of [2, -1, 2, 3, -4, 5]
  after index 0: running sum   2
  after index 1: running sum   1
  after index 2: running sum   3
  after index 3: running sum   6
  after index 4: running sum   2
  after index 5: running sum   7

The running sum falls at index 1 and index 4. A window's sum is not a
monotone function of its right edge, so 'shrink while valid' is invalid.`,
          explanation:
            "The window says 4; the answer is **1** — the single element `5` at the end. The window never considers it because by the time `right` reaches it, `left` has already been dragged forward past everything, and the algorithm has no mechanism to reconsider a window it discarded.\n\nNote what did *not* happen: no exception, no obviously silly output. `4` is a perfectly plausible length. This is why the condition has to be checked deliberately rather than noticed in testing.",
          alternates: [
            {
              lang: "javascript",
              code: `// The monotonicity condition, and where it fails.
const list = (xs) => "[" + xs.join(", ") + "]";
const pad = (v, w) => String(v).padStart(w);

function minLenPositive(target, nums) {
  let left = 0;
  let total = 0;
  let best = null;
  for (let right = 0; right < nums.length; right++) {
    total += nums[right];
    while (total >= target) {
      const span = right - left + 1;
      best = best === null ? span : Math.min(best, span);
      total -= nums[left];
      left++;
    }
  }
  return best ?? 0;
}

const pos = [2, 3, 1, 2, 4, 3];
console.log("all positive:", list(pos), " target 7 ->", minLenPositive(7, pos));

// With a negative in the array the shrink rule is unjustified.
const neg = [2, -1, 2, 3, -4, 5];
console.log("\\nwith negatives:", list(neg), " target 5");
console.log("  window answer :", minLenPositive(5, neg));

function bruteMinLen(target, nums) {
  let best = null;
  for (let i = 0; i < nums.length; i++) {
    let s = 0;
    for (let j = i; j < nums.length; j++) {
      s += nums[j];
      if (s >= target) {
        const span = j - i + 1;
        best = best === null ? span : Math.min(best, span);
        break;
      }
    }
  }
  return best ?? 0;
}

console.log("  brute force   :", bruteMinLen(5, neg));
console.log("  they disagree :", minLenPositive(5, neg) !== bruteMinLen(5, neg));

// why: extending a window no longer only increases the sum
console.log("\\nprefix sums of", list(neg));
let run = 0;
for (let i = 0; i < neg.length; i++) {
  run += neg[i];
  console.log(\`  after index \${i}: running sum \${pad(run, 3)}\`);
}
console.log("\\nThe running sum falls at index 1 and index 4. A window's sum is not a");
console.log("monotone function of its right edge, so 'shrink while valid' is invalid.");`,
              output: `all positive: [2, 3, 1, 2, 4, 3]  target 7 -> 2

with negatives: [2, -1, 2, 3, -4, 5]  target 5
  window answer : 4
  brute force   : 1
  they disagree : true

prefix sums of [2, -1, 2, 3, -4, 5]
  after index 0: running sum   2
  after index 1: running sum   1
  after index 2: running sum   3
  after index 3: running sum   6
  after index 4: running sum   2
  after index 5: running sum   7

The running sum falls at index 1 and index 4. A window's sum is not a
monotone function of its right edge, so 'shrink while valid' is invalid.`,
            },
            {
              lang: "typescript",
              code: `// The monotonicity condition, and where it fails.
const list = (xs: number[]): string => "[" + xs.join(", ") + "]";
const pad = (v: number, w: number): string => String(v).padStart(w);

function minLenPositive(target: number, nums: number[]): number {
  let left = 0;
  let total = 0;
  let best: number | null = null;
  for (let right = 0; right < nums.length; right++) {
    total += nums[right];
    while (total >= target) {
      const span = right - left + 1;
      best = best === null ? span : Math.min(best, span);
      total -= nums[left];
      left++;
    }
  }
  return best ?? 0;
}

const pos: number[] = [2, 3, 1, 2, 4, 3];
console.log("all positive:", list(pos), " target 7 ->", minLenPositive(7, pos));

// With a negative in the array the shrink rule is unjustified.
const neg: number[] = [2, -1, 2, 3, -4, 5];
console.log("\\nwith negatives:", list(neg), " target 5");
console.log("  window answer :", minLenPositive(5, neg));

function bruteMinLen(target: number, nums: number[]): number {
  let best: number | null = null;
  for (let i = 0; i < nums.length; i++) {
    let s = 0;
    for (let j = i; j < nums.length; j++) {
      s += nums[j];
      if (s >= target) {
        const span = j - i + 1;
        best = best === null ? span : Math.min(best, span);
        break;
      }
    }
  }
  return best ?? 0;
}

console.log("  brute force   :", bruteMinLen(5, neg));
console.log("  they disagree :", minLenPositive(5, neg) !== bruteMinLen(5, neg));

// why: extending a window no longer only increases the sum
console.log("\\nprefix sums of", list(neg));
let run = 0;
for (let i = 0; i < neg.length; i++) {
  run += neg[i];
  console.log(\`  after index \${i}: running sum \${pad(run, 3)}\`);
}
console.log("\\nThe running sum falls at index 1 and index 4. A window's sum is not a");
console.log("monotone function of its right edge, so 'shrink while valid' is invalid.");`,
              output: `all positive: [2, 3, 1, 2, 4, 3]  target 7 -> 2

with negatives: [2, -1, 2, 3, -4, 5]  target 5
  window answer : 4
  brute force   : 1
  they disagree : true

prefix sums of [2, -1, 2, 3, -4, 5]
  after index 0: running sum   2
  after index 1: running sum   1
  after index 2: running sum   3
  after index 3: running sum   6
  after index 4: running sum   2
  after index 5: running sum   7

The running sum falls at index 1 and index 4. A window's sum is not a
monotone function of its right edge, so 'shrink while valid' is invalid.`,
            },
            {
              lang: "java",
              code: `import java.util.*;

/** The monotonicity condition, and where it fails. */
public class Main {
    static String list(int[] xs) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < xs.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(xs[i]);
        }
        return sb.append("]").toString();
    }

    static int minLenPositive(int target, int[] nums) {
        int left = 0, total = 0;
        Integer best = null;
        for (int right = 0; right < nums.length; right++) {
            total += nums[right];
            while (total >= target) {
                int span = right - left + 1;
                best = best == null ? span : Math.min(best, span);
                total -= nums[left];
                left++;
            }
        }
        return best == null ? 0 : best;
    }

    static int bruteMinLen(int target, int[] nums) {
        Integer best = null;
        for (int i = 0; i < nums.length; i++) {
            int s = 0;
            for (int j = i; j < nums.length; j++) {
                s += nums[j];
                if (s >= target) {
                    int span = j - i + 1;
                    best = best == null ? span : Math.min(best, span);
                    break;
                }
            }
        }
        return best == null ? 0 : best;
    }

    public static void main(String[] args) {
        int[] pos = {2, 3, 1, 2, 4, 3};
        System.out.println("all positive: " + list(pos) + "  target 7 -> " + minLenPositive(7, pos));

        // With a negative in the array the shrink rule is unjustified.
        int[] neg = {2, -1, 2, 3, -4, 5};
        System.out.println("\\nwith negatives: " + list(neg) + "  target 5");
        System.out.println("  window answer : " + minLenPositive(5, neg));
        System.out.println("  brute force   : " + bruteMinLen(5, neg));
        System.out.println("  they disagree : " + (minLenPositive(5, neg) != bruteMinLen(5, neg)));

        // why: extending a window no longer only increases the sum
        System.out.println("\\nprefix sums of " + list(neg));
        int run = 0;
        for (int i = 0; i < neg.length; i++) {
            run += neg[i];
            System.out.printf("  after index %d: running sum %3d%n", i, run);
        }
        System.out.println("\\nThe running sum falls at index 1 and index 4. A window's sum is not a");
        System.out.println("monotone function of its right edge, so 'shrink while valid' is invalid.");
    }
}`,
              output: `all positive: [2, 3, 1, 2, 4, 3]  target 7 -> 2

with negatives: [2, -1, 2, 3, -4, 5]  target 5
  window answer : 4
  brute force   : 1
  they disagree : true

prefix sums of [2, -1, 2, 3, -4, 5]
  after index 0: running sum   2
  after index 1: running sum   1
  after index 2: running sum   3
  after index 3: running sum   6
  after index 4: running sum   2
  after index 5: running sum   7

The running sum falls at index 1 and index 4. A window's sum is not a
monotone function of its right edge, so 'shrink while valid' is invalid.`,
            },
            {
              lang: "cpp",
              code: `// The monotonicity condition, and where it fails.
#include <algorithm>
#include <iomanip>
#include <iostream>
#include <optional>
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

int minLenPositive(int target, const vector<int>& nums) {
    int left = 0, total = 0;
    optional<int> best;
    for (int right = 0; right < (int)nums.size(); right++) {
        total += nums[right];
        while (total >= target) {
            int span = right - left + 1;
            best = best ? min(*best, span) : span;
            total -= nums[left];
            left++;
        }
    }
    return best.value_or(0);
}

int bruteMinLen(int target, const vector<int>& nums) {
    optional<int> best;
    for (int i = 0; i < (int)nums.size(); i++) {
        int s = 0;
        for (int j = i; j < (int)nums.size(); j++) {
            s += nums[j];
            if (s >= target) {
                int span = j - i + 1;
                best = best ? min(*best, span) : span;
                break;
            }
        }
    }
    return best.value_or(0);
}

int main() {
    vector<int> pos = {2, 3, 1, 2, 4, 3};
    cout << "all positive: " << list(pos) << "  target 7 -> " << minLenPositive(7, pos) << "\\n";

    // With a negative in the array the shrink rule is unjustified.
    vector<int> neg = {2, -1, 2, 3, -4, 5};
    cout << "\\nwith negatives: " << list(neg) << "  target 5\\n";
    cout << "  window answer : " << minLenPositive(5, neg) << "\\n";
    cout << "  brute force   : " << bruteMinLen(5, neg) << "\\n";
    cout << "  they disagree : " << boolalpha
         << (minLenPositive(5, neg) != bruteMinLen(5, neg)) << "\\n";

    // why: extending a window no longer only increases the sum
    cout << "\\nprefix sums of " << list(neg) << "\\n";
    int run = 0;
    for (size_t i = 0; i < neg.size(); i++) {
        run += neg[i];
        cout << "  after index " << i << ": running sum " << setw(3) << run << "\\n";
    }
    cout << "\\nThe running sum falls at index 1 and index 4. A window's sum is not a\\n";
    cout << "monotone function of its right edge, so 'shrink while valid' is invalid.\\n";
}`,
              output: `all positive: [2, 3, 1, 2, 4, 3]  target 7 -> 2

with negatives: [2, -1, 2, 3, -4, 5]  target 5
  window answer : 4
  brute force   : 1
  they disagree : true

prefix sums of [2, -1, 2, 3, -4, 5]
  after index 0: running sum   2
  after index 1: running sum   1
  after index 2: running sum   3
  after index 3: running sum   6
  after index 4: running sum   2
  after index 5: running sum   7

The running sum falls at index 1 and index 4. A window's sum is not a
monotone function of its right edge, so 'shrink while valid' is invalid.`,
            },
            {
              lang: "rust",
              code: `// The monotonicity condition, and where it fails.
fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn min_len_positive(target: i32, nums: &[i32]) -> usize {
    let (mut left, mut total) = (0usize, 0);
    let mut best: Option<usize> = None;
    for right in 0..nums.len() {
        total += nums[right];
        while total >= target {
            let span = right - left + 1;
            best = Some(match best {
                None => span,
                Some(b) => b.min(span),
            });
            total -= nums[left];
            left += 1;
        }
    }
    best.unwrap_or(0)
}

fn brute_min_len(target: i32, nums: &[i32]) -> usize {
    let mut best: Option<usize> = None;
    for i in 0..nums.len() {
        let mut s = 0;
        for j in i..nums.len() {
            s += nums[j];
            if s >= target {
                let span = j - i + 1;
                best = Some(match best {
                    None => span,
                    Some(b) => b.min(span),
                });
                break;
            }
        }
    }
    best.unwrap_or(0)
}

fn main() {
    let pos = [2, 3, 1, 2, 4, 3];
    println!("all positive: {}  target 7 -> {}", list(&pos), min_len_positive(7, &pos));

    // With a negative in the array the shrink rule is unjustified.
    let neg = [2, -1, 2, 3, -4, 5];
    println!("\\nwith negatives: {}  target 5", list(&neg));
    println!("  window answer : {}", min_len_positive(5, &neg));
    println!("  brute force   : {}", brute_min_len(5, &neg));
    println!("  they disagree : {}", min_len_positive(5, &neg) != brute_min_len(5, &neg));

    // why: extending a window no longer only increases the sum
    println!("\\nprefix sums of {}", list(&neg));
    let mut run = 0;
    for (i, v) in neg.iter().enumerate() {
        run += v;
        println!("  after index {}: running sum {:3}", i, run);
    }
    println!("\\nThe running sum falls at index 1 and index 4. A window's sum is not a");
    println!("monotone function of its right edge, so 'shrink while valid' is invalid.");
}`,
              output: `all positive: [2, 3, 1, 2, 4, 3]  target 7 -> 2

with negatives: [2, -1, 2, 3, -4, 5]  target 5
  window answer : 4
  brute force   : 1
  they disagree : true

prefix sums of [2, -1, 2, 3, -4, 5]
  after index 0: running sum   2
  after index 1: running sum   1
  after index 2: running sum   3
  after index 3: running sum   6
  after index 4: running sum   2
  after index 5: running sum   7

The running sum falls at index 1 and index 4. A window's sum is not a
monotone function of its right edge, so 'shrink while valid' is invalid.`,
            },
            {
              lang: "go",
              code: `// The monotonicity condition, and where it fails.
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

func minLenPositive(target int, nums []int) int {
	left, total, best := 0, 0, -1
	for right := 0; right < len(nums); right++ {
		total += nums[right]
		for total >= target {
			span := right - left + 1
			if best == -1 || span < best {
				best = span
			}
			total -= nums[left]
			left++
		}
	}
	if best == -1 {
		return 0
	}
	return best
}

func bruteMinLen(target int, nums []int) int {
	best := -1
	for i := range nums {
		s := 0
		for j := i; j < len(nums); j++ {
			s += nums[j]
			if s >= target {
				span := j - i + 1
				if best == -1 || span < best {
					best = span
				}
				break
			}
		}
	}
	if best == -1 {
		return 0
	}
	return best
}

func main() {
	pos := []int{2, 3, 1, 2, 4, 3}
	fmt.Println("all positive:", list(pos), " target 7 ->", minLenPositive(7, pos))

	// With a negative in the array the shrink rule is unjustified.
	neg := []int{2, -1, 2, 3, -4, 5}
	fmt.Println("\\nwith negatives:", list(neg), " target 5")
	fmt.Println("  window answer :", minLenPositive(5, neg))
	fmt.Println("  brute force   :", bruteMinLen(5, neg))
	fmt.Println("  they disagree :", minLenPositive(5, neg) != bruteMinLen(5, neg))

	// why: extending a window no longer only increases the sum
	fmt.Println("\\nprefix sums of", list(neg))
	run := 0
	for i, v := range neg {
		run += v
		fmt.Printf("  after index %d: running sum %3d\\n", i, run)
	}
	fmt.Println("\\nThe running sum falls at index 1 and index 4. A window's sum is not a")
	fmt.Println("monotone function of its right edge, so 'shrink while valid' is invalid.")
}`,
              output: `all positive: [2, 3, 1, 2, 4, 3]  target 7 -> 2

with negatives: [2, -1, 2, 3, -4, 5]  target 5
  window answer : 4
  brute force   : 1
  they disagree : true

prefix sums of [2, -1, 2, 3, -4, 5]
  after index 0: running sum   2
  after index 1: running sum   1
  after index 2: running sum   3
  after index 3: running sum   6
  after index 4: running sum   2
  after index 5: running sum   7

The running sum falls at index 1 and index 4. A window's sum is not a
monotone function of its right edge, so 'shrink while valid' is invalid.`,
            },
          ],
        },
      ],
    },
    {
      id: "checking",
      heading: "How to check before committing",
      body: [
        "Ask two questions, in this order.",
        "**Does adding an element move the quantity one way only?** For a sum with positive values, yes — up. For a count of distinct characters, yes — up or level, never down. For a sum with any negative values, no.",
        "**Does removing from the left move it back?** For a sum, yes. For \"contains at least one vowel\", no — removing a non-vowel changes nothing, which is fine, but the condition is not a simple threshold and needs care.",
        "If either answer is no, the window does not apply as stated. Sometimes a reformulation rescues it — see the at-most-k lesson — and sometimes it does not.",
      ],
    },
    {
      id: "replacements",
      heading: "What replaces it",
      body: [
        "**Prefix sums with a hash map.** For \"subarray sums to exactly k\" with negatives allowed, store each prefix sum in a map and look for `prefix - k`. O(n), no window, and it does not care about signs. The prefix-sums module is next and is largely about this.",
        "**Kadane's algorithm.** For \"maximum subarray sum\" with negatives, the answer is a one-line DP rather than a window.",
        "**A monotonic deque.** When the state is a window maximum or minimum, the removal is not O(1) and the plain window is not enough.",
        "**Binary search on the answer.** For \"longest window such that…\" where the condition is monotone in the *window length* rather than in its contents.",
      ],
      visual: {
        id: "kadane-visual",
        kind: "pattern",
        algorithm: "kadane",
        lockAlgorithm: true,
        title: "Kadane's: restart, or extend",
      },
      pitfalls: [
        {
          title: "\"All values are positive\" is a constraint, not a coincidence",
          body: "When a problem statement says `1 <= nums[i]`, that clause is there to make a window legal. Read the constraints looking for it. Its absence, especially an explicit `-10^4 <= nums[i]`, is the setter telling you a window will not work.",
        },
        {
          title: "Zero is usually fine, but check",
          body: "A zero does not break monotonicity for a sum — it just fails to increase it. It does break the *strict* version of some shrink conditions, and it makes \"product of the window\" collapse. For product problems, a zero is a special case that must be handled separately.",
        },
      ],
    },
  ],
  takeaways: [
    "The window needs the tested quantity to move one way on growth and back on shrink",
    "One negative value destroys that for a sum, silently",
    "Check the constraints for `1 <= nums[i]` — it is there on purpose",
    "A wrong window returns a plausible number, not an error",
    "Replacements: prefix sums with a map, Kadane, a monotonic deque, or binary search",
    "Zeros are usually harmless for sums and fatal for products",
  ],
  status: "available",
};
