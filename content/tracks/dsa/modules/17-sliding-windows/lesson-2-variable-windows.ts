import type { Lesson } from "@/content/types";

export const variableWindowsLesson: Lesson = {
  id: "dsa-sw-variable",
  slug: "variable-size-windows",
  moduleSlug: "sliding-windows",
  title: "Variable-Size Windows: Grow Right, Shrink Left",
  summary:
    "The shape that solves the whole family. One loop over the right edge, an inner while that moves the left edge, and an amortised argument that the two-loop structure is still linear.",
  estimatedMinutes: 35,
  objectives: [
    "Write the grow-right shrink-left skeleton from memory",
    "Choose between shrinking while invalid and shrinking while valid",
    "Prove the nested loop is O(n), not O(n²)",
    "Record the answer at the right moment for longest and for shortest",
  ],
  sections: [
    {
      id: "the-skeleton",
      heading: "The skeleton",
      body: [
        "Every variable window is this, and the only decisions are what the state is and what the condition says:",
        "*For each `right`: add `a[right]` to the state. While the window needs fixing, remove `a[left]` and advance `left`. Record the answer.*",
        "There are two families, and they differ in one word.",
        "**Longest valid window** — shrink **while the window is invalid**. The inner loop restores validity, so after it the window is the longest valid one ending at `right`. Record after shrinking.",
        "**Shortest valid window** — shrink **while the window is still valid**. Each shrink step is a candidate answer, so you record *inside* the inner loop, before removing.",
        "Getting these the wrong way round is the most common bug in the pattern, and it produces plausible answers rather than crashes.",
      ],
      examples: [
        {
          id: "variable",
          title: "Longest and shortest, side by side",
          lang: "python",
          code: `def longest_no_repeat(s, trace=False):
    """Variable window: grow right always, shrink left while invalid."""
    last = {}
    left = 0
    best = 0
    best_str = ""
    for right, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            if trace:
                print(f"  right={right} '{ch}' repeats -> left {left} => {last[ch] + 1}")
            left = last[ch] + 1
        last[ch] = right
        if right - left + 1 > best:
            best = right - left + 1
            best_str = s[left:right + 1]
        if trace:
            print(f"  window '{s[left:right + 1]}' len={right - left + 1}")
    return best, best_str

for s in ("abcabcbb", "bbbbb", "pwwkew", ""):
    n, sub = longest_no_repeat(s)
    quoted = f'"{s}"'
    print(f'{quoted:12} -> {n}  "{sub}"')

print("\\ntrace for 'pwwkew':")
longest_no_repeat("pwwkew", trace=True)

def min_subarray_len(target, nums):
    """Smallest window with sum >= target. Shrink while STILL valid."""
    left = 0
    total = 0
    best = None
    for right, v in enumerate(nums):
        total += v
        while total >= target:
            span = right - left + 1
            best = span if best is None else min(best, span)
            total -= nums[left]
            left += 1
    return best or 0

print("\\nminimum length with sum >= 7:")
for xs in ([2,3,1,2,4,3], [1,4,4], [1,1,1,1,1,1,1,1]):
    print(f"  {str(xs):26} -> {min_subarray_len(7, xs)}")`,
          output: `"abcabcbb"   -> 3  "abc"
"bbbbb"      -> 1  "b"
"pwwkew"     -> 3  "wke"
""           -> 0  ""

trace for 'pwwkew':
  window 'p' len=1
  window 'pw' len=2
  right=2 'w' repeats -> left 0 => 2
  window 'w' len=1
  window 'wk' len=2
  window 'wke' len=3
  right=5 'w' repeats -> left 2 => 3
  window 'kew' len=3

minimum length with sum >= 7:
  [2, 3, 1, 2, 4, 3]         -> 2
  [1, 4, 4]                  -> 2
  [1, 1, 1, 1, 1, 1, 1, 1]   -> 7`,
          explanation:
            "The `longest` version uses a **jump** rather than a loop: seeing a repeat, `left` moves straight to just past the previous occurrence. That is an optimisation of the same shrink — the `while` version, decrementing counts one at a time, is equally correct and easier to adapt.\n\nThe `last[ch] >= left` guard is essential. `'pwwkew'` at `right=5` sees a `w` last seen at index 2, but `left` is already 2 — so the character is *not* in the current window and moving `left` backwards would be wrong. Without that check, `left` can go backwards and the algorithm breaks.\n\nIn `min_subarray_len` the answer is recorded **before** shrinking, inside the loop. Each iteration of that inner while is a genuinely valid window, and the smallest of them is the one you want.",
          alternates: [
            {
              lang: "javascript",
              code: `// Variable window: grow right always, shrink left while invalid.
const list = (xs) => "[" + xs.join(", ") + "]";

function longestNoRepeat(s, trace = false) {
  const last = new Map();
  let left = 0;
  let best = 0;
  let bestStr = "";
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (last.has(ch) && last.get(ch) >= left) {
      if (trace) {
        console.log(\`  right=\${right} '\${ch}' repeats -> left \${left} => \${last.get(ch) + 1}\`);
      }
      left = last.get(ch) + 1;
    }
    last.set(ch, right);
    if (right - left + 1 > best) {
      best = right - left + 1;
      bestStr = s.slice(left, right + 1);
    }
    if (trace) {
      console.log(\`  window '\${s.slice(left, right + 1)}' len=\${right - left + 1}\`);
    }
  }
  return { best, bestStr };
}

for (const s of ["abcabcbb", "bbbbb", "pwwkew", ""]) {
  const { best, bestStr } = longestNoRepeat(s);
  const quoted = \`"\${s}"\`;
  console.log(\`\${quoted.padEnd(12)} -> \${best}  "\${bestStr}"\`);
}

console.log("\\ntrace for 'pwwkew':");
longestNoRepeat("pwwkew", true);

// Smallest window with sum >= target. Shrink while STILL valid.
function minSubarrayLen(target, nums) {
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

console.log("\\nminimum length with sum >= 7:");
for (const xs of [[2, 3, 1, 2, 4, 3], [1, 4, 4], [1, 1, 1, 1, 1, 1, 1, 1]]) {
  console.log(\`  \${list(xs).padEnd(26)} -> \${minSubarrayLen(7, xs)}\`);
}`,
            },
            {
              lang: "typescript",
              code: `// Variable window: grow right always, shrink left while invalid.
const list = (xs: number[]): string => "[" + xs.join(", ") + "]";

function longestNoRepeat(s: string, trace = false): { best: number; bestStr: string } {
  const last = new Map<string, number>();
  let left = 0;
  let best = 0;
  let bestStr = "";
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (last.has(ch) && last.get(ch) >= left) {
      if (trace) {
        console.log(\`  right=\${right} '\${ch}' repeats -> left \${left} => \${last.get(ch)! + 1}\`);
      }
      left = last.get(ch)! + 1;
    }
    last.set(ch, right);
    if (right - left + 1 > best) {
      best = right - left + 1;
      bestStr = s.slice(left, right + 1);
    }
    if (trace) {
      console.log(\`  window '\${s.slice(left, right + 1)}' len=\${right - left + 1}\`);
    }
  }
  return { best, bestStr };
}

for (const s of ["abcabcbb", "bbbbb", "pwwkew", ""]) {
  const { best, bestStr } = longestNoRepeat(s);
  const quoted = \`"\${s}"\`;
  console.log(\`\${quoted.padEnd(12)} -> \${best}  "\${bestStr}"\`);
}

console.log("\\ntrace for 'pwwkew':");
longestNoRepeat("pwwkew", true);

// Smallest window with sum >= target. Shrink while STILL valid.
function minSubarrayLen(target: number, nums: number[]): number {
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

console.log("\\nminimum length with sum >= 7:");
for (const xs of [[2, 3, 1, 2, 4, 3], [1, 4, 4], [1, 1, 1, 1, 1, 1, 1, 1]]) {
  console.log(\`  \${list(xs).padEnd(26)} -> \${minSubarrayLen(7, xs)}\`);
}`,
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

    static int best;
    static String bestStr;

    /** Variable window: grow right always, shrink left while invalid. */
    static void longestNoRepeat(String s, boolean trace) {
        Map<Character, Integer> last = new HashMap<>();
        int left = 0;
        best = 0;
        bestStr = "";
        for (int right = 0; right < s.length(); right++) {
            char ch = s.charAt(right);
            Integer seen = last.get(ch);
            if (seen != null && seen >= left) {
                if (trace) {
                    System.out.println("  right=" + right + " '" + ch
                            + "' repeats -> left " + left + " => " + (seen + 1));
                }
                left = seen + 1;
            }
            last.put(ch, right);
            if (right - left + 1 > best) {
                best = right - left + 1;
                bestStr = s.substring(left, right + 1);
            }
            if (trace) {
                System.out.println("  window '" + s.substring(left, right + 1)
                        + "' len=" + (right - left + 1));
            }
        }
    }

    /** Smallest window with sum >= target. Shrink while STILL valid. */
    static int minSubarrayLen(int target, int[] nums) {
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

    public static void main(String[] args) {
        for (String s : new String[]{"abcabcbb", "bbbbb", "pwwkew", ""}) {
            longestNoRepeat(s, false);
            System.out.printf("%-12s -> %d  \\"%s\\"%n", "\\"" + s + "\\"", best, bestStr);
        }

        System.out.println("\\ntrace for 'pwwkew':");
        longestNoRepeat("pwwkew", true);

        System.out.println("\\nminimum length with sum >= 7:");
        int[][] cases = {{2, 3, 1, 2, 4, 3}, {1, 4, 4}, {1, 1, 1, 1, 1, 1, 1, 1}};
        for (int[] xs : cases) {
            System.out.printf("  %-26s -> %d%n", list(xs), minSubarrayLen(7, xs));
        }
    }
}`,
            },
            {
              lang: "cpp",
              code: `// Variable window: grow right always, shrink left while invalid.
#include <algorithm>
#include <iomanip>
#include <iostream>
#include <optional>
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

pair<int, string> longestNoRepeat(const string& s, bool trace) {
    unordered_map<char, int> last;
    int left = 0, best = 0;
    string bestStr;
    for (int right = 0; right < (int)s.size(); right++) {
        char ch = s[right];
        auto it = last.find(ch);
        if (it != last.end() && it->second >= left) {
            if (trace) {
                cout << "  right=" << right << " '" << ch << "' repeats -> left "
                     << left << " => " << it->second + 1 << "\\n";
            }
            left = it->second + 1;
        }
        last[ch] = right;
        if (right - left + 1 > best) {
            best = right - left + 1;
            bestStr = s.substr(left, right - left + 1);
        }
        if (trace) {
            cout << "  window '" << s.substr(left, right - left + 1)
                 << "' len=" << right - left + 1 << "\\n";
        }
    }
    return {best, bestStr};
}

// Smallest window with sum >= target. Shrink while STILL valid.
int minSubarrayLen(int target, const vector<int>& nums) {
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

int main() {
    for (const string& s : {"abcabcbb", "bbbbb", "pwwkew", ""}) {
        auto [best, bestStr] = longestNoRepeat(s, false);
        cout << left << setw(12) << ("\\"" + s + "\\"")
             << " -> " << best << "  \\"" << bestStr << "\\"\\n";
    }

    cout << "\\ntrace for 'pwwkew':\\n";
    longestNoRepeat("pwwkew", true);

    cout << "\\nminimum length with sum >= 7:\\n";
    vector<vector<int>> cases = {{2, 3, 1, 2, 4, 3}, {1, 4, 4}, {1, 1, 1, 1, 1, 1, 1, 1}};
    for (const auto& xs : cases) {
        cout << "  " << left << setw(26) << list(xs) << " -> " << minSubarrayLen(7, xs) << "\\n";
    }
}`,
            },
            {
              lang: "rust",
              code: `// Variable window: grow right always, shrink left while invalid.
use std::collections::HashMap;

fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn longest_no_repeat(s: &str, trace: bool) -> (usize, String) {
    let chars: Vec<char> = s.chars().collect();
    let mut last: HashMap<char, usize> = HashMap::new();
    let mut left = 0usize;
    let mut best = 0usize;
    let mut best_str = String::new();
    for right in 0..chars.len() {
        let ch = chars[right];
        if let Some(&seen) = last.get(&ch) {
            if seen >= left {
                if trace {
                    println!("  right={} '{}' repeats -> left {} => {}", right, ch, left, seen + 1);
                }
                left = seen + 1;
            }
        }
        last.insert(ch, right);
        let window: String = chars[left..right + 1].iter().collect();
        if right - left + 1 > best {
            best = right - left + 1;
            best_str = window.clone();
        }
        if trace {
            println!("  window '{}' len={}", window, right - left + 1);
        }
    }
    (best, best_str)
}

/// Smallest window with sum >= target. Shrink while STILL valid.
fn min_subarray_len(target: i32, nums: &[i32]) -> usize {
    let mut left = 0usize;
    let mut total = 0;
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

fn main() {
    for s in ["abcabcbb", "bbbbb", "pwwkew", ""] {
        let (best, best_str) = longest_no_repeat(s, false);
        println!("{:<12} -> {}  \\"{}\\"", format!("\\"{}\\"", s), best, best_str);
    }

    println!("\\ntrace for 'pwwkew':");
    longest_no_repeat("pwwkew", true);

    println!("\\nminimum length with sum >= 7:");
    let cases: Vec<Vec<i32>> = vec![
        vec![2, 3, 1, 2, 4, 3],
        vec![1, 4, 4],
        vec![1, 1, 1, 1, 1, 1, 1, 1],
    ];
    for xs in &cases {
        println!("  {:<26} -> {}", list(xs), min_subarray_len(7, xs));
    }
}`,
            },
            {
              lang: "go",
              code: `// Variable window: grow right always, shrink left while invalid.
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

func longestNoRepeat(s string, trace bool) (int, string) {
	r := []rune(s)
	last := map[rune]int{}
	left, best := 0, 0
	bestStr := ""
	for right := 0; right < len(r); right++ {
		ch := r[right]
		if seen, ok := last[ch]; ok && seen >= left {
			if trace {
				fmt.Printf("  right=%d '%c' repeats -> left %d => %d\\n", right, ch, left, seen+1)
			}
			left = seen + 1
		}
		last[ch] = right
		window := string(r[left : right+1])
		if right-left+1 > best {
			best = right - left + 1
			bestStr = window
		}
		if trace {
			fmt.Printf("  window '%s' len=%d\\n", window, right-left+1)
		}
	}
	return best, bestStr
}

// Smallest window with sum >= target. Shrink while STILL valid.
func minSubarrayLen(target int, nums []int) int {
	left, total := 0, 0
	best := -1
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

func main() {
	for _, s := range []string{"abcabcbb", "bbbbb", "pwwkew", ""} {
		best, bestStr := longestNoRepeat(s, false)
		fmt.Printf("%-12s -> %d  %q\\n", \`"\`+s+\`"\`, best, bestStr)
	}

	fmt.Println("\\ntrace for 'pwwkew':")
	longestNoRepeat("pwwkew", true)

	fmt.Println("\\nminimum length with sum >= 7:")
	cases := [][]int{{2, 3, 1, 2, 4, 3}, {1, 4, 4}, {1, 1, 1, 1, 1, 1, 1, 1}}
	for _, xs := range cases {
		fmt.Printf("  %-26s -> %d\\n", list(xs), minSubarrayLen(7, xs))
	}
}`,
            },
          ],
        },
      ],
      visual: {
        id: "window-visual",
        kind: "pattern",
        algorithm: "window",
        lockAlgorithm: true,
        title: "Grow right, shrink left",
      },
    },
    {
      id: "amortised",
      heading: "Why a nested loop is still O(n)",
      body: [
        "It looks quadratic: a `for` over `right` with a `while` over `left` inside. It is not, and the argument is the same amortised one the arrays module used for cyclic sort.",
        "**`left` only ever increases, and it can never exceed `n`.** The inner `while` may run many times on one iteration and zero times on the next, but summed over the entire outer loop it executes at most `n` times in total. So the two pointers together do at most `2n` moves.",
        "Say this out loud in an interview. \"The inner loop looks nested but `left` is monotonic, so the total work is O(n)\" is the sentence that gets the complexity question right, and people who have only memorised the shape cannot produce it.",
      ],
      pitfalls: [
        {
          title: "Recording the answer in the wrong place",
          body: "For a *longest* window, record after the inner loop, when the window is valid again. For a *shortest*, record inside it, while the window is still valid. Swap them and you will report the longest invalid window or miss the smallest valid one — and both bugs return numbers that look reasonable.",
        },
        {
          title: "Letting `left` move backwards",
          body: "In the jump form, always guard with `last[ch] >= left`. A character last seen *before* the window started is not in the window, and jumping to it un-shrinks the window and breaks the monotonic argument the complexity depends on.",
        },
        {
          title: "Returning `best` when nothing was ever valid",
          body: "`min_subarray_len` returns `best or 0` because the problem asks for 0 when no window qualifies. Initialising `best` to zero instead would make every answer zero, since `min` would never beat it.",
        },
      ],
    },
  ],
  takeaways: [
    "Grow right always; shrink left in an inner while",
    "Longest: shrink while invalid, record after. Shortest: shrink while valid, record inside",
    "`left` is monotonic, so the nested loop is O(n) amortised — say this out loud",
    "Guard a left-jump with `last[ch] >= left` or the window can un-shrink",
    "Initialise the best-so-far so that \"never valid\" is distinguishable",
  ],
  status: "available",
};
