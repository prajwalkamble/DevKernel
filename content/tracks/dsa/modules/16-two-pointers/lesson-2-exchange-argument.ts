import type { Lesson } from "@/content/types";

export const exchangeArgumentLesson: Lesson = {
  id: "dsa-tp-exchange",
  slug: "proving-a-pointer-move-is-safe",
  moduleSlug: "two-pointers",
  title: "Proving a Pointer Move Is Safe",
  summary:
    "The argument interviewers actually ask for, and the one that separates a memorised solution from an understood one. Container With Most Water is the case where it is genuinely non-obvious.",
  estimatedMinutes: 30,
  objectives: [
    "State the general form of an exchange argument",
    "Prove the container move discards nothing optimal",
    "Recognise when a greedy pointer move is *not* justified",
    "Present the argument compactly under interview conditions",
  ],
  sections: [
    {
      id: "the-form",
      heading: "The general form",
      body: [
        "Every two-pointer proof has the same skeleton, and it is worth memorising as a shape rather than as a sentence about any one problem.",
        "*Suppose the optimal answer uses a pair we are about to discard. Show that some pair we keep is at least as good. Therefore discarding costs nothing.*",
        "That is an **exchange argument** — you exchange the hypothetical optimal solution for one inside your remaining search space, without making it worse. It is the same technique that proves greedy algorithms correct, which is why the greedy module later leans on this one.",
      ],
    },
    {
      id: "container",
      heading: "Container With Most Water: the non-obvious case",
      body: [
        "Given heights, pick two lines; the water held is `width × min(height)`. Maximise it.",
        "Start at the ends, so the width is maximal. Now move **the shorter side inward**. Why is that safe, and why is it right rather than arbitrary?",
        "Consider the shorter line, say the left one at index `lo`. Any pair using `lo` has area `(j - lo) × min(h[lo], h[j])`, which is at most `(hi - lo) × h[lo]` — because the width can only shrink as `j` comes in from `hi`, and the height can never exceed `h[lo]` since `lo` is the shorter of the two. But `(hi - lo) × h[lo]` is exactly the area we just measured. **So every remaining pair involving `lo` is no better than the one we already have.** Discarding all of them costs nothing, and `lo` can move.",
        "Moving the *taller* side would have no such argument, and would be wrong: it shrinks the width while the binding constraint — the short side — stays put.",
      ],
      examples: [
        {
          id: "container",
          title: "Container, rain water, and palindromes",
          lang: "python",
          code: `def max_area(h, trace=False):
    """Container with most water. Move the SHORTER side — that is the exchange
    argument, and it is the whole problem."""
    lo, hi = 0, len(h) - 1
    best = 0
    while lo < hi:
        area = (hi - lo) * min(h[lo], h[hi])
        if trace and area >= best:
            print(f"  lo={lo} hi={hi} width={hi - lo} height={min(h[lo], h[hi])} area={area}")
        best = max(best, area)
        if h[lo] < h[hi]:
            lo += 1
        else:
            hi -= 1
    return best

h = [1, 8, 6, 2, 5, 4, 8, 3, 7]
print("heights:", h)
print("improving states:")
print("max area:", max_area(h, trace=True))

def trap(h):
    """Trapping rain water. Water above i is min(maxLeft, maxRight) - h[i];
    two pointers track both maxima without precomputing either array."""
    if not h:
        return 0
    lo, hi = 0, len(h) - 1
    left_max, right_max = h[lo], h[hi]
    total = 0
    while lo < hi:
        if left_max <= right_max:
            lo += 1
            left_max = max(left_max, h[lo])
            total += left_max - h[lo]
        else:
            hi -= 1
            right_max = max(right_max, h[hi])
            total += right_max - h[hi]
    return total

for xs in ([0,1,0,2,1,0,1,3,2,1,2,1], [4,2,0,3,2,5], [3,3,3], []):
    print(f"trap({str(xs):26}) = {trap(xs)}")

def is_palindrome(s):
    lo, hi = 0, len(s) - 1
    while lo < hi:
        while lo < hi and not s[lo].isalnum():
            lo += 1
        while lo < hi and not s[hi].isalnum():
            hi -= 1
        if s[lo].lower() != s[hi].lower():
            return False
        lo += 1
        hi -= 1
    return True

for s in ("A man, a plan, a canal: Panama", "race a car", " ", "ab_a"):
    quoted = f'"{s}"'
    print(f"is_palindrome({quoted:34}) = {is_palindrome(s)}")`,
          output: `heights: [1, 8, 6, 2, 5, 4, 8, 3, 7]
improving states:
  lo=0 hi=8 width=8 height=1 area=8
  lo=1 hi=8 width=7 height=7 area=49
max area: 49
trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]) = 6
trap([4, 2, 0, 3, 2, 5]        ) = 9
trap([3, 3, 3]                 ) = 0
trap([]                        ) = 0
is_palindrome("A man, a plan, a canal: Panama"  ) = True
is_palindrome("race a car"                      ) = False
is_palindrome(" "                               ) = True
is_palindrome("ab_a"                            ) = True`,
          explanation:
            "The container's answer is found on the *second* state examined and never improved on — the loop still has to run to be sure, but the widest-first ordering means good candidates appear early.\n\n**Trapping rain water** is the same argument one level deeper. Water above index `i` is `min(maxLeft, maxRight) - h[i]`. The trick is that you do not need both maxima exactly: whichever side's running maximum is *smaller* is the binding one, so you can safely settle that index using only that side's maximum. Advancing from the smaller side keeps that true. It replaces two O(n) precomputed arrays with two variables.\n\n**The palindrome** shows the skip-junk variant: inner `while` loops advance past characters that do not participate, and both are guarded with `lo < hi` so a string of nothing but punctuation cannot run off either end.",
          alternates: [
            {
              lang: "javascript",
              code: `// Container with most water, trapping rain water, and palindromes —
// three problems, one exchange argument.
const list = (xs) => "[" + xs.join(", ") + "]";
const isAlnum = (c) => /[a-zA-Z0-9]/.test(c);

function maxArea(h, trace = false) {
  let lo = 0;
  let hi = h.length - 1;
  let best = 0;
  while (lo < hi) {
    const height = Math.min(h[lo], h[hi]);
    const area = (hi - lo) * height;
    if (trace && area >= best) {
      console.log(\`  lo=\${lo} hi=\${hi} width=\${hi - lo} height=\${height} area=\${area}\`);
    }
    best = Math.max(best, area);
    if (h[lo] < h[hi]) lo++;
    else hi--;
  }
  return best;
}

const h = [1, 8, 6, 2, 5, 4, 8, 3, 7];
console.log("heights:", list(h));
console.log("improving states:");
console.log("max area:", maxArea(h, true));

// Water above i is min(maxLeft, maxRight) - h[i]; two pointers track both
// maxima without precomputing either array.
function trap(h) {
  if (h.length === 0) return 0;
  let lo = 0;
  let hi = h.length - 1;
  let leftMax = h[lo];
  let rightMax = h[hi];
  let total = 0;
  while (lo < hi) {
    if (leftMax <= rightMax) {
      lo++;
      leftMax = Math.max(leftMax, h[lo]);
      total += leftMax - h[lo];
    } else {
      hi--;
      rightMax = Math.max(rightMax, h[hi]);
      total += rightMax - h[hi];
    }
  }
  return total;
}

for (const xs of [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1], [4, 2, 0, 3, 2, 5], [3, 3, 3], []]) {
  console.log(\`trap(\${list(xs).padEnd(26)}) = \${trap(xs)}\`);
}

function isPalindrome(s) {
  let lo = 0;
  let hi = s.length - 1;
  while (lo < hi) {
    while (lo < hi && !isAlnum(s[lo])) lo++;
    while (lo < hi && !isAlnum(s[hi])) hi--;
    if (s[lo].toLowerCase() !== s[hi].toLowerCase()) return false;
    lo++;
    hi--;
  }
  return true;
}

for (const s of ["A man, a plan, a canal: Panama", "race a car", " ", "ab_a"]) {
  const quoted = \`"\${s}"\`;
  console.log(\`is_palindrome(\${quoted.padEnd(34)}) = \${isPalindrome(s)}\`);
}`,
              output: `heights: [1, 8, 6, 2, 5, 4, 8, 3, 7]
improving states:
  lo=0 hi=8 width=8 height=1 area=8
  lo=1 hi=8 width=7 height=7 area=49
max area: 49
trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]) = 6
trap([4, 2, 0, 3, 2, 5]        ) = 9
trap([3, 3, 3]                 ) = 0
trap([]                        ) = 0
is_palindrome("A man, a plan, a canal: Panama"  ) = true
is_palindrome("race a car"                      ) = false
is_palindrome(" "                               ) = true
is_palindrome("ab_a"                            ) = true`,
            },
            {
              lang: "typescript",
              code: `// Container with most water, trapping rain water, and palindromes —
// three problems, one exchange argument.
const list = (xs: number[]): string => "[" + xs.join(", ") + "]";
const isAlnum = (c: string): boolean => /[a-zA-Z0-9]/.test(c);

function maxArea(h: number[], trace = false): number {
  let lo = 0;
  let hi = h.length - 1;
  let best = 0;
  while (lo < hi) {
    const height = Math.min(h[lo], h[hi]);
    const area = (hi - lo) * height;
    if (trace && area >= best) {
      console.log(\`  lo=\${lo} hi=\${hi} width=\${hi - lo} height=\${height} area=\${area}\`);
    }
    best = Math.max(best, area);
    if (h[lo] < h[hi]) lo++;
    else hi--;
  }
  return best;
}

const h: number[] = [1, 8, 6, 2, 5, 4, 8, 3, 7];
console.log("heights:", list(h));
console.log("improving states:");
console.log("max area:", maxArea(h, true));

// Water above i is min(maxLeft, maxRight) - h[i]; two pointers track both
// maxima without precomputing either array.
function trap(h: number[]): number {
  if (h.length === 0) return 0;
  let lo = 0;
  let hi = h.length - 1;
  let leftMax = h[lo];
  let rightMax = h[hi];
  let total = 0;
  while (lo < hi) {
    if (leftMax <= rightMax) {
      lo++;
      leftMax = Math.max(leftMax, h[lo]);
      total += leftMax - h[lo];
    } else {
      hi--;
      rightMax = Math.max(rightMax, h[hi]);
      total += rightMax - h[hi];
    }
  }
  return total;
}

const cases: number[][] = [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1], [4, 2, 0, 3, 2, 5], [3, 3, 3], []];
for (const xs of cases) {
  console.log(\`trap(\${list(xs).padEnd(26)}) = \${trap(xs)}\`);
}

function isPalindrome(s: string): boolean {
  let lo = 0;
  let hi = s.length - 1;
  while (lo < hi) {
    while (lo < hi && !isAlnum(s[lo])) lo++;
    while (lo < hi && !isAlnum(s[hi])) hi--;
    if (s[lo].toLowerCase() !== s[hi].toLowerCase()) return false;
    lo++;
    hi--;
  }
  return true;
}

for (const s of ["A man, a plan, a canal: Panama", "race a car", " ", "ab_a"]) {
  const quoted = \`"\${s}"\`;
  console.log(\`is_palindrome(\${quoted.padEnd(34)}) = \${isPalindrome(s)}\`);
}`,
              output: `heights: [1, 8, 6, 2, 5, 4, 8, 3, 7]
improving states:
  lo=0 hi=8 width=8 height=1 area=8
  lo=1 hi=8 width=7 height=7 area=49
max area: 49
trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]) = 6
trap([4, 2, 0, 3, 2, 5]        ) = 9
trap([3, 3, 3]                 ) = 0
trap([]                        ) = 0
is_palindrome("A man, a plan, a canal: Panama"  ) = true
is_palindrome("race a car"                      ) = false
is_palindrome(" "                               ) = true
is_palindrome("ab_a"                            ) = true`,
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

    /** Container with most water. Move the SHORTER side — that is the
        exchange argument, and it is the whole problem. */
    static int maxArea(int[] h, boolean trace) {
        int lo = 0, hi = h.length - 1, best = 0;
        while (lo < hi) {
            int height = Math.min(h[lo], h[hi]);
            int area = (hi - lo) * height;
            if (trace && area >= best) {
                System.out.println("  lo=" + lo + " hi=" + hi + " width=" + (hi - lo)
                        + " height=" + height + " area=" + area);
            }
            best = Math.max(best, area);
            if (h[lo] < h[hi]) lo++;
            else hi--;
        }
        return best;
    }

    /** Water above i is min(maxLeft, maxRight) - h[i]; two pointers track both
        maxima without precomputing either array. */
    static int trap(int[] h) {
        if (h.length == 0) return 0;
        int lo = 0, hi = h.length - 1;
        int leftMax = h[lo], rightMax = h[hi], total = 0;
        while (lo < hi) {
            if (leftMax <= rightMax) {
                lo++;
                leftMax = Math.max(leftMax, h[lo]);
                total += leftMax - h[lo];
            } else {
                hi--;
                rightMax = Math.max(rightMax, h[hi]);
                total += rightMax - h[hi];
            }
        }
        return total;
    }

    static boolean isPalindrome(String s) {
        int lo = 0, hi = s.length() - 1;
        while (lo < hi) {
            while (lo < hi && !Character.isLetterOrDigit(s.charAt(lo))) lo++;
            while (lo < hi && !Character.isLetterOrDigit(s.charAt(hi))) hi--;
            if (Character.toLowerCase(s.charAt(lo)) != Character.toLowerCase(s.charAt(hi)))
                return false;
            lo++;
            hi--;
        }
        return true;
    }

    public static void main(String[] args) {
        int[] h = {1, 8, 6, 2, 5, 4, 8, 3, 7};
        System.out.println("heights: " + list(h));
        System.out.println("improving states:");
        System.out.println("max area: " + maxArea(h, true));

        int[][] cases = {{0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1}, {4, 2, 0, 3, 2, 5}, {3, 3, 3}, {}};
        for (int[] xs : cases) {
            System.out.printf("trap(%-26s) = %d%n", list(xs), trap(xs));
        }

        String[] words = {"A man, a plan, a canal: Panama", "race a car", " ", "ab_a"};
        for (String s : words) {
            System.out.printf("is_palindrome(%-34s) = %b%n", "\\"" + s + "\\"", isPalindrome(s));
        }
    }
}`,
              output: `heights: [1, 8, 6, 2, 5, 4, 8, 3, 7]
improving states:
  lo=0 hi=8 width=8 height=1 area=8
  lo=1 hi=8 width=7 height=7 area=49
max area: 49
trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]) = 6
trap([4, 2, 0, 3, 2, 5]        ) = 9
trap([3, 3, 3]                 ) = 0
trap([]                        ) = 0
is_palindrome("A man, a plan, a canal: Panama"  ) = true
is_palindrome("race a car"                      ) = false
is_palindrome(" "                               ) = true
is_palindrome("ab_a"                            ) = true`,
            },
            {
              lang: "cpp",
              code: `// Container with most water, trapping rain water, and palindromes —
// three problems, one exchange argument.
#include <algorithm>
#include <cctype>
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

// Move the SHORTER side — that is the exchange argument, and it is the
// whole problem.
int maxArea(const vector<int>& h, bool trace) {
    int lo = 0, hi = (int)h.size() - 1, best = 0;
    while (lo < hi) {
        int height = min(h[lo], h[hi]);
        int area = (hi - lo) * height;
        if (trace && area >= best) {
            cout << "  lo=" << lo << " hi=" << hi << " width=" << hi - lo
                 << " height=" << height << " area=" << area << "\\n";
        }
        best = max(best, area);
        if (h[lo] < h[hi]) lo++;
        else hi--;
    }
    return best;
}

// Water above i is min(maxLeft, maxRight) - h[i]; two pointers track both
// maxima without precomputing either array.
int trap(const vector<int>& h) {
    if (h.empty()) return 0;
    int lo = 0, hi = (int)h.size() - 1;
    int leftMax = h[lo], rightMax = h[hi], total = 0;
    while (lo < hi) {
        if (leftMax <= rightMax) {
            lo++;
            leftMax = max(leftMax, h[lo]);
            total += leftMax - h[lo];
        } else {
            hi--;
            rightMax = max(rightMax, h[hi]);
            total += rightMax - h[hi];
        }
    }
    return total;
}

bool isPalindrome(const string& s) {
    int lo = 0, hi = (int)s.size() - 1;
    while (lo < hi) {
        while (lo < hi && !isalnum((unsigned char)s[lo])) lo++;
        while (lo < hi && !isalnum((unsigned char)s[hi])) hi--;
        if (tolower((unsigned char)s[lo]) != tolower((unsigned char)s[hi])) return false;
        lo++;
        hi--;
    }
    return true;
}

int main() {
    vector<int> h = {1, 8, 6, 2, 5, 4, 8, 3, 7};
    cout << "heights: " << list(h) << "\\n";
    cout << "improving states:\\n";
    // Computed before the print, not inside it: \`<<\` sequences left-to-right,
    // so streaming the label first would put it above the trace the call emits.
    int best = maxArea(h, true);
    cout << "max area: " << best << "\\n";

    vector<vector<int>> cases = {{0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1}, {4, 2, 0, 3, 2, 5}, {3, 3, 3}, {}};
    for (const auto& xs : cases) {
        cout << "trap(" << left << setw(26) << list(xs) << ") = " << trap(xs) << "\\n";
    }

    vector<string> words = {"A man, a plan, a canal: Panama", "race a car", " ", "ab_a"};
    for (const auto& s : words) {
        cout << "is_palindrome(" << left << setw(34) << ("\\"" + s + "\\"")
             << ") = " << (isPalindrome(s) ? "true" : "false") << "\\n";
    }
}`,
              output: `heights: [1, 8, 6, 2, 5, 4, 8, 3, 7]
improving states:
  lo=0 hi=8 width=8 height=1 area=8
  lo=1 hi=8 width=7 height=7 area=49
max area: 49
trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]) = 6
trap([4, 2, 0, 3, 2, 5]        ) = 9
trap([3, 3, 3]                 ) = 0
trap([]                        ) = 0
is_palindrome("A man, a plan, a canal: Panama"  ) = true
is_palindrome("race a car"                      ) = false
is_palindrome(" "                               ) = true
is_palindrome("ab_a"                            ) = true`,
            },
            {
              lang: "rust",
              code: `// Container with most water, trapping rain water, and palindromes —
// three problems, one exchange argument.
fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

/// Move the SHORTER side — that is the exchange argument, and it is the
/// whole problem.
fn max_area(h: &[i32], trace: bool) -> i32 {
    let (mut lo, mut hi) = (0usize, h.len() - 1);
    let mut best = 0;
    while lo < hi {
        let height = h[lo].min(h[hi]);
        let area = (hi - lo) as i32 * height;
        if trace && area >= best {
            println!(
                "  lo={} hi={} width={} height={} area={}",
                lo,
                hi,
                hi - lo,
                height,
                area
            );
        }
        best = best.max(area);
        if h[lo] < h[hi] {
            lo += 1;
        } else {
            hi -= 1;
        }
    }
    best
}

/// Water above i is min(max_left, max_right) - h[i]; two pointers track both
/// maxima without precomputing either array.
fn trap(h: &[i32]) -> i32 {
    if h.is_empty() {
        return 0;
    }
    let (mut lo, mut hi) = (0usize, h.len() - 1);
    let (mut left_max, mut right_max) = (h[lo], h[hi]);
    let mut total = 0;
    while lo < hi {
        if left_max <= right_max {
            lo += 1;
            left_max = left_max.max(h[lo]);
            total += left_max - h[lo];
        } else {
            hi -= 1;
            right_max = right_max.max(h[hi]);
            total += right_max - h[hi];
        }
    }
    total
}

fn is_palindrome(s: &str) -> bool {
    let c: Vec<char> = s.chars().collect();
    if c.is_empty() {
        return true;
    }
    let (mut lo, mut hi) = (0usize, c.len() - 1);
    while lo < hi {
        while lo < hi && !c[lo].is_alphanumeric() {
            lo += 1;
        }
        while lo < hi && !c[hi].is_alphanumeric() {
            hi -= 1;
        }
        if c[lo].to_ascii_lowercase() != c[hi].to_ascii_lowercase() {
            return false;
        }
        lo += 1;
        hi -= 1;
    }
    true
}

fn main() {
    let h = [1, 8, 6, 2, 5, 4, 8, 3, 7];
    println!("heights: {}", list(&h));
    println!("improving states:");
    println!("max area: {}", max_area(&h, true));

    let cases: Vec<Vec<i32>> = vec![
        vec![0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1],
        vec![4, 2, 0, 3, 2, 5],
        vec![3, 3, 3],
        vec![],
    ];
    for xs in &cases {
        println!("trap({:<26}) = {}", list(xs), trap(xs));
    }

    let words = [
        "A man, a plan, a canal: Panama",
        "race a car",
        " ",
        "ab_a",
    ];
    for s in &words {
        println!(
            "is_palindrome({:<34}) = {}",
            format!("\\"{}\\"", s),
            is_palindrome(s)
        );
    }
}`,
              output: `heights: [1, 8, 6, 2, 5, 4, 8, 3, 7]
improving states:
  lo=0 hi=8 width=8 height=1 area=8
  lo=1 hi=8 width=7 height=7 area=49
max area: 49
trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]) = 6
trap([4, 2, 0, 3, 2, 5]        ) = 9
trap([3, 3, 3]                 ) = 0
trap([]                        ) = 0
is_palindrome("A man, a plan, a canal: Panama"  ) = true
is_palindrome("race a car"                      ) = false
is_palindrome(" "                               ) = true
is_palindrome("ab_a"                            ) = true`,
            },
            {
              lang: "go",
              code: `// Container with most water, trapping rain water, and palindromes —
// three problems, one exchange argument.
package main

import (
	"fmt"
	"strings"
	"unicode"
)

func list(xs []int) string {
	parts := make([]string, len(xs))
	for i, x := range xs {
		parts[i] = fmt.Sprint(x)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

// Move the SHORTER side — that is the exchange argument, and it is the
// whole problem.
func maxArea(h []int, trace bool) int {
	lo, hi, best := 0, len(h)-1, 0
	for lo < hi {
		height := min(h[lo], h[hi])
		area := (hi - lo) * height
		if trace && area >= best {
			fmt.Printf("  lo=%d hi=%d width=%d height=%d area=%d\\n",
				lo, hi, hi-lo, height, area)
		}
		best = max(best, area)
		if h[lo] < h[hi] {
			lo++
		} else {
			hi--
		}
	}
	return best
}

// Water above i is min(maxLeft, maxRight) - h[i]; two pointers track both
// maxima without precomputing either array.
func trap(h []int) int {
	if len(h) == 0 {
		return 0
	}
	lo, hi := 0, len(h)-1
	leftMax, rightMax, total := h[lo], h[hi], 0
	for lo < hi {
		if leftMax <= rightMax {
			lo++
			leftMax = max(leftMax, h[lo])
			total += leftMax - h[lo]
		} else {
			hi--
			rightMax = max(rightMax, h[hi])
			total += rightMax - h[hi]
		}
	}
	return total
}

func isPalindrome(s string) bool {
	r := []rune(s)
	if len(r) == 0 {
		return true
	}
	lo, hi := 0, len(r)-1
	alnum := func(c rune) bool { return unicode.IsLetter(c) || unicode.IsDigit(c) }
	for lo < hi {
		for lo < hi && !alnum(r[lo]) {
			lo++
		}
		for lo < hi && !alnum(r[hi]) {
			hi--
		}
		if unicode.ToLower(r[lo]) != unicode.ToLower(r[hi]) {
			return false
		}
		lo++
		hi--
	}
	return true
}

func main() {
	h := []int{1, 8, 6, 2, 5, 4, 8, 3, 7}
	fmt.Println("heights:", list(h))
	fmt.Println("improving states:")
	fmt.Println("max area:", maxArea(h, true))

	cases := [][]int{{0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1}, {4, 2, 0, 3, 2, 5}, {3, 3, 3}, {}}
	for _, xs := range cases {
		fmt.Printf("trap(%-26s) = %d\\n", list(xs), trap(xs))
	}

	words := []string{"A man, a plan, a canal: Panama", "race a car", " ", "ab_a"}
	for _, s := range words {
		fmt.Printf("is_palindrome(%-34s) = %t\\n", "\\""+s+"\\"", isPalindrome(s))
	}
}`,
              output: `heights: [1, 8, 6, 2, 5, 4, 8, 3, 7]
improving states:
  lo=0 hi=8 width=8 height=1 area=8
  lo=1 hi=8 width=7 height=7 area=49
max area: 49
trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]) = 6
trap([4, 2, 0, 3, 2, 5]        ) = 9
trap([3, 3, 3]                 ) = 0
trap([]                        ) = 0
is_palindrome("A man, a plan, a canal: Panama"  ) = true
is_palindrome("race a car"                      ) = false
is_palindrome(" "                               ) = true
is_palindrome("ab_a"                            ) = true`,
            },
          ],
        },
      ],
    },
    {
      id: "when-not",
      heading: "When the argument does not exist",
      body: [
        "Not every problem with two ends admits this. If you cannot construct the exchange argument, the pattern does not apply — and the honest response is to notice that rather than to write the loop anyway and hope.",
        "The classic trap is **unsorted Two Sum**. With `[3, 1, 4, 1, 5]` and target 6, the ends give `3 + 5 = 8`, too big, so you would move `hi` inwards and lose the 5 — which is half of the actual answer `1 + 5`. There is no argument, because `a[hi]` being large tells you nothing about the values behind it.",
        "The second trap is a problem where **both** moves are sometimes right. If the sum being too big could be fixed by moving either pointer, you have a branch rather than a walk, and a branch is exponential. That is the signal to reach for a hash map or a sort.",
      ],
      pitfalls: [
        {
          title: "Ties: move either, but pick one and be consistent",
          body: "In the container problem, `h[lo] == h[hi]` means both moves are safe — the pair itself is already measured, and neither side can do better with the other end held fixed. Moving both at once is also correct here, but it is a different loop; the version above moves `hi`, which is the `else` branch.",
        },
        {
          title: "Rehearse the argument, not just the code",
          body: "\"Move the shorter side\" is a rule you can state in five seconds and defend in thirty. Interviewers ask *why* precisely because the rule is memorable and the reason is not, so the answer separates the two groups. Practise saying it: the shorter side caps every remaining pair it appears in, and the widest of those is the one you just measured.",
        },
      ],
    },
  ],
  takeaways: [
    "Exchange argument: if the optimum used a discarded pair, some kept pair is as good",
    "Container: the shorter side caps every pair it belongs to, and the widest was just measured",
    "Moving the taller side is unjustified — the binding constraint would not move",
    "Rain water: settle from whichever side's running maximum is smaller",
    "No exchange argument means the pattern does not apply",
    "Unsorted Two Sum is the canonical non-example",
    "Be ready to state the proof out loud in two sentences",
  ],
  status: "available",
};
