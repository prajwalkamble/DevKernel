import type { Lesson } from "@/content/types";

export const duplicatesAndKsumLesson: Lesson = {
  id: "dsa-tp-ksum",
  slug: "duplicates-and-k-sum",
  moduleSlug: "two-pointers",
  title: "Duplicates & k-Sum",
  summary:
    "3Sum is Two Sum with an outer loop, and almost all of its difficulty is duplicate handling. The skip-while idiom does it without a set — and then the same construction shows you exactly where k-Sum stops being worth it.",
  estimatedMinutes: 35,
  objectives: [
    "Write 3Sum with two pointers inside a loop",
    "Skip duplicates at all three positions correctly",
    "Explain why the skip beats deduplicating with a set",
    "Derive the O(n^(k-1)) cost of k-Sum and say when to stop",
  ],
  sections: [
    {
      id: "the-construction",
      heading: "Fix one, two-point the rest",
      body: [
        "3Sum: find all distinct triples summing to zero. Sort the array, then for each index `i`, look for a **pair** in the remainder summing to `-nums[i]` — which is the previous lesson's problem exactly.",
        "The outer loop is O(n) and the inner walk is O(n), so 3Sum is **O(n²)** after an O(n log n) sort. That is the expected answer, and the brute force it replaces is O(n³).",
      ],
      examples: [
        {
          id: "three-sum",
          title: "3Sum, with duplicates handled by skipping",
          lang: "python",
          code: `def three_sum(nums):
    """Sort, fix one, two-point the rest. Duplicates skipped without a set."""
    nums = sorted(nums)
    out = []
    n = len(nums)
    for i in range(n - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue                       # same anchor as last time
        if nums[i] > 0:
            break                          # sorted: no way back to zero
        lo, hi = i + 1, n - 1
        while lo < hi:
            s = nums[i] + nums[lo] + nums[hi]
            if s < 0:
                lo += 1
            elif s > 0:
                hi -= 1
            else:
                out.append([nums[i], nums[lo], nums[hi]])
                lo += 1
                hi -= 1
                while lo < hi and nums[lo] == nums[lo - 1]:
                    lo += 1                # skip duplicate seconds
                while lo < hi and nums[hi] == nums[hi + 1]:
                    hi -= 1                # skip duplicate thirds
    return out

for xs in ([-1, 0, 1, 2, -1, -4], [0, 0, 0, 0], [1, 2, 3], [-2, 0, 1, 1, 2]):
    print(f"{str(xs):22} -> {three_sum(xs)}")

# the duplicate-skip is what makes a set unnecessary
def three_sum_with_set(nums):
    nums = sorted(nums)
    seen = set()
    n = len(nums)
    for i in range(n - 2):
        lo, hi = i + 1, n - 1
        while lo < hi:
            s = nums[i] + nums[lo] + nums[hi]
            if s < 0:
                lo += 1
            elif s > 0:
                hi -= 1
            else:
                seen.add((nums[i], nums[lo], nums[hi]))
                lo += 1
                hi -= 1
    return [list(t) for t in sorted(seen)]

xs = [-1, 0, 1, 2, -1, -4]
print("\\nsame answer, set version:", three_sum_with_set(xs))
print("skip version            :", three_sum(xs))`,
          output: `[-1, 0, 1, 2, -1, -4]  -> [[-1, -1, 2], [-1, 0, 1]]
[0, 0, 0, 0]           -> [[0, 0, 0]]
[1, 2, 3]              -> []
[-2, 0, 1, 1, 2]       -> [[-2, 0, 2], [-2, 1, 1]]

same answer, set version: [[-1, -1, 2], [-1, 0, 1]]
skip version            : [[-1, -1, 2], [-1, 0, 1]]`,
          explanation:
            "There are **three** duplicate skips and all three are necessary. The outer `if i > 0 and nums[i] == nums[i-1]: continue` stops the same anchor being used twice. The two inner `while` loops, which run only *after* a triple is recorded, stop the same second and third elements being reused with that anchor.\n\n`[0, 0, 0, 0]` is the test that catches a missing skip: it should give exactly one triple, and a version without the inner skips gives three. It is the case worth running by hand.\n\nThe `if nums[i] > 0: break` is a genuine optimisation, not decoration — once the smallest of the three is positive, no triple from a sorted array can reach zero, and on an input of large positives it turns the whole run into a single iteration.",
          alternates: [
            {
              lang: "javascript",
              code: `// Sort, fix one, two-point the rest. Duplicates skipped without a set.
const list = (xs) => "[" + xs.join(", ") + "]";
const listOfLists = (xss) => "[" + xss.map(list).join(", ") + "]";

function threeSum(input) {
  const nums = [...input].sort((a, b) => a - b);
  const out = [];
  const n = nums.length;
  for (let i = 0; i < n - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue; // same anchor as last time
    if (nums[i] > 0) break;                         // sorted: no way back to zero
    let lo = i + 1;
    let hi = n - 1;
    while (lo < hi) {
      const s = nums[i] + nums[lo] + nums[hi];
      if (s < 0) lo++;
      else if (s > 0) hi--;
      else {
        out.push([nums[i], nums[lo], nums[hi]]);
        lo++;
        hi--;
        while (lo < hi && nums[lo] === nums[lo - 1]) lo++; // skip duplicate seconds
        while (lo < hi && nums[hi] === nums[hi + 1]) hi--; // skip duplicate thirds
      }
    }
  }
  return out;
}

for (const xs of [[-1, 0, 1, 2, -1, -4], [0, 0, 0, 0], [1, 2, 3], [-2, 0, 1, 1, 2]]) {
  console.log(\`\${list(xs).padEnd(22)} -> \${listOfLists(threeSum(xs))}\`);
}

// the duplicate-skip is what makes a set unnecessary
function threeSumWithSet(input) {
  const nums = [...input].sort((a, b) => a - b);
  const seen = new Set();
  const n = nums.length;
  for (let i = 0; i < n - 2; i++) {
    let lo = i + 1;
    let hi = n - 1;
    while (lo < hi) {
      const s = nums[i] + nums[lo] + nums[hi];
      if (s < 0) lo++;
      else if (s > 0) hi--;
      else {
        seen.add(\`\${nums[i]},\${nums[lo]},\${nums[hi]}\`);
        lo++;
        hi--;
      }
    }
  }
  const triples = [...seen].map((k) => k.split(",").map(Number));
  triples.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  return triples;
}

const xs = [-1, 0, 1, 2, -1, -4];
console.log("\\nsame answer, set version:", listOfLists(threeSumWithSet(xs)));
console.log("skip version            :", listOfLists(threeSum(xs)));`,
            },
            {
              lang: "typescript",
              code: `// Sort, fix one, two-point the rest. Duplicates skipped without a set.
const list = (xs: number[]): string => "[" + xs.join(", ") + "]";
const listOfLists = (xss: number[][]): string => "[" + xss.map(list).join(", ") + "]";

function threeSum(input: number[]): number[][] {
  const nums = [...input].sort((a, b) => a - b);
  const out: number[][] = [];
  const n = nums.length;
  for (let i = 0; i < n - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue; // same anchor as last time
    if (nums[i] > 0) break;                         // sorted: no way back to zero
    let lo = i + 1;
    let hi = n - 1;
    while (lo < hi) {
      const s = nums[i] + nums[lo] + nums[hi];
      if (s < 0) lo++;
      else if (s > 0) hi--;
      else {
        out.push([nums[i], nums[lo], nums[hi]]);
        lo++;
        hi--;
        while (lo < hi && nums[lo] === nums[lo - 1]) lo++; // skip duplicate seconds
        while (lo < hi && nums[hi] === nums[hi + 1]) hi--; // skip duplicate thirds
      }
    }
  }
  return out;
}

for (const xs of [[-1, 0, 1, 2, -1, -4], [0, 0, 0, 0], [1, 2, 3], [-2, 0, 1, 1, 2]]) {
  console.log(\`\${list(xs).padEnd(22)} -> \${listOfLists(threeSum(xs))}\`);
}

// the duplicate-skip is what makes a set unnecessary
function threeSumWithSet(input: number[]): number[][] {
  const nums = [...input].sort((a, b) => a - b);
  const seen = new Set<string>();
  const n = nums.length;
  for (let i = 0; i < n - 2; i++) {
    let lo = i + 1;
    let hi = n - 1;
    while (lo < hi) {
      const s = nums[i] + nums[lo] + nums[hi];
      if (s < 0) lo++;
      else if (s > 0) hi--;
      else {
        seen.add(\`\${nums[i]},\${nums[lo]},\${nums[hi]}\`);
        lo++;
        hi--;
      }
    }
  }
  const triples = [...seen].map((k) => k.split(",").map(Number));
  triples.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  return triples;
}

const xs: number[] = [-1, 0, 1, 2, -1, -4];
console.log("\\nsame answer, set version:", listOfLists(threeSumWithSet(xs)));
console.log("skip version            :", listOfLists(threeSum(xs)));`,
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

    static String listOfLists(List<int[]> xss) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < xss.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(list(xss.get(i)));
        }
        return sb.append("]").toString();
    }

    /** Sort, fix one, two-point the rest. Duplicates skipped without a set. */
    static List<int[]> threeSum(int[] input) {
        int[] nums = input.clone();
        Arrays.sort(nums);
        List<int[]> out = new ArrayList<>();
        int n = nums.length;
        for (int i = 0; i < n - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;  // same anchor as last time
            if (nums[i] > 0) break;                         // sorted: no way back to zero
            int lo = i + 1, hi = n - 1;
            while (lo < hi) {
                int s = nums[i] + nums[lo] + nums[hi];
                if (s < 0) lo++;
                else if (s > 0) hi--;
                else {
                    out.add(new int[]{nums[i], nums[lo], nums[hi]});
                    lo++;
                    hi--;
                    while (lo < hi && nums[lo] == nums[lo - 1]) lo++;  // duplicate seconds
                    while (lo < hi && nums[hi] == nums[hi + 1]) hi--;  // duplicate thirds
                }
            }
        }
        return out;
    }

    /** the duplicate-skip is what makes a set unnecessary */
    static List<int[]> threeSumWithSet(int[] input) {
        int[] nums = input.clone();
        Arrays.sort(nums);
        Set<List<Integer>> seen = new HashSet<>();
        int n = nums.length;
        for (int i = 0; i < n - 2; i++) {
            int lo = i + 1, hi = n - 1;
            while (lo < hi) {
                int s = nums[i] + nums[lo] + nums[hi];
                if (s < 0) lo++;
                else if (s > 0) hi--;
                else {
                    seen.add(List.of(nums[i], nums[lo], nums[hi]));
                    lo++;
                    hi--;
                }
            }
        }
        List<List<Integer>> sorted = new ArrayList<>(seen);
        sorted.sort((a, b) -> {
            for (int i = 0; i < 3; i++) {
                int c = Integer.compare(a.get(i), b.get(i));
                if (c != 0) return c;
            }
            return 0;
        });
        List<int[]> out = new ArrayList<>();
        for (List<Integer> t : sorted) {
            out.add(new int[]{t.get(0), t.get(1), t.get(2)});
        }
        return out;
    }

    public static void main(String[] args) {
        int[][] cases = {{-1, 0, 1, 2, -1, -4}, {0, 0, 0, 0}, {1, 2, 3}, {-2, 0, 1, 1, 2}};
        for (int[] xs : cases) {
            System.out.printf("%-22s -> %s%n", list(xs), listOfLists(threeSum(xs)));
        }

        int[] xs = {-1, 0, 1, 2, -1, -4};
        System.out.println("\\nsame answer, set version: " + listOfLists(threeSumWithSet(xs)));
        System.out.println("skip version            : " + listOfLists(threeSum(xs)));
    }
}`,
            },
            {
              lang: "cpp",
              code: `// Sort, fix one, two-point the rest. Duplicates skipped without a set.
#include <algorithm>
#include <array>
#include <iomanip>
#include <iostream>
#include <set>
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

string listOfLists(const vector<vector<int>>& xss) {
    string out = "[";
    for (size_t i = 0; i < xss.size(); i++) {
        if (i) out += ", ";
        out += list(xss[i]);
    }
    return out + "]";
}

vector<vector<int>> threeSum(vector<int> nums) {
    sort(nums.begin(), nums.end());
    vector<vector<int>> out;
    int n = (int)nums.size();
    for (int i = 0; i < n - 2; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue;  // same anchor as last time
        if (nums[i] > 0) break;                         // sorted: no way back to zero
        int lo = i + 1, hi = n - 1;
        while (lo < hi) {
            int s = nums[i] + nums[lo] + nums[hi];
            if (s < 0) lo++;
            else if (s > 0) hi--;
            else {
                out.push_back({nums[i], nums[lo], nums[hi]});
                lo++;
                hi--;
                while (lo < hi && nums[lo] == nums[lo - 1]) lo++;  // duplicate seconds
                while (lo < hi && nums[hi] == nums[hi + 1]) hi--;  // duplicate thirds
            }
        }
    }
    return out;
}

// the duplicate-skip is what makes a set unnecessary
vector<vector<int>> threeSumWithSet(vector<int> nums) {
    sort(nums.begin(), nums.end());
    set<array<int, 3>> seen;
    int n = (int)nums.size();
    for (int i = 0; i < n - 2; i++) {
        int lo = i + 1, hi = n - 1;
        while (lo < hi) {
            int s = nums[i] + nums[lo] + nums[hi];
            if (s < 0) lo++;
            else if (s > 0) hi--;
            else {
                seen.insert({nums[i], nums[lo], nums[hi]});
                lo++;
                hi--;
            }
        }
    }
    vector<vector<int>> out;
    for (const auto& t : seen) out.push_back({t[0], t[1], t[2]});
    return out;
}

int main() {
    vector<vector<int>> cases = {{-1, 0, 1, 2, -1, -4}, {0, 0, 0, 0}, {1, 2, 3}, {-2, 0, 1, 1, 2}};
    for (const auto& xs : cases) {
        cout << left << setw(22) << list(xs) << " -> " << listOfLists(threeSum(xs)) << "\\n";
    }

    vector<int> xs = {-1, 0, 1, 2, -1, -4};
    cout << "\\nsame answer, set version: " << listOfLists(threeSumWithSet(xs)) << "\\n";
    cout << "skip version            : " << listOfLists(threeSum(xs)) << "\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::collections::BTreeSet;

fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn list_of_lists(xss: &[Vec<i32>]) -> String {
    let parts: Vec<String> = xss.iter().map(|x| list(x)).collect();
    format!("[{}]", parts.join(", "))
}

/// Sort, fix one, two-point the rest. Duplicates skipped without a set.
fn three_sum(input: &[i32]) -> Vec<Vec<i32>> {
    let mut nums = input.to_vec();
    nums.sort();
    let mut out = Vec::new();
    let n = nums.len();
    for i in 0..n.saturating_sub(2) {
        if i > 0 && nums[i] == nums[i - 1] {
            continue; // same anchor as last time
        }
        if nums[i] > 0 {
            break; // sorted: no way back to zero
        }
        let (mut lo, mut hi) = (i + 1, n - 1);
        while lo < hi {
            let s = nums[i] + nums[lo] + nums[hi];
            if s < 0 {
                lo += 1;
            } else if s > 0 {
                hi -= 1;
            } else {
                out.push(vec![nums[i], nums[lo], nums[hi]]);
                lo += 1;
                hi -= 1;
                while lo < hi && nums[lo] == nums[lo - 1] {
                    lo += 1; // skip duplicate seconds
                }
                while lo < hi && nums[hi] == nums[hi + 1] {
                    hi -= 1; // skip duplicate thirds
                }
            }
        }
    }
    out
}

/// the duplicate-skip is what makes a set unnecessary
fn three_sum_with_set(input: &[i32]) -> Vec<Vec<i32>> {
    let mut nums = input.to_vec();
    nums.sort();
    let mut seen: BTreeSet<(i32, i32, i32)> = BTreeSet::new();
    let n = nums.len();
    for i in 0..n.saturating_sub(2) {
        let (mut lo, mut hi) = (i + 1, n - 1);
        while lo < hi {
            let s = nums[i] + nums[lo] + nums[hi];
            if s < 0 {
                lo += 1;
            } else if s > 0 {
                hi -= 1;
            } else {
                seen.insert((nums[i], nums[lo], nums[hi]));
                lo += 1;
                hi -= 1;
            }
        }
    }
    seen.into_iter().map(|(a, b, c)| vec![a, b, c]).collect()
}

fn main() {
    let cases: Vec<Vec<i32>> = vec![
        vec![-1, 0, 1, 2, -1, -4],
        vec![0, 0, 0, 0],
        vec![1, 2, 3],
        vec![-2, 0, 1, 1, 2],
    ];
    for xs in &cases {
        println!("{:<22} -> {}", list(xs), list_of_lists(&three_sum(xs)));
    }

    let xs = [-1, 0, 1, 2, -1, -4];
    println!("\\nsame answer, set version: {}", list_of_lists(&three_sum_with_set(&xs)));
    println!("skip version            : {}", list_of_lists(&three_sum(&xs)));
}`,
            },
            {
              lang: "go",
              code: `// Sort, fix one, two-point the rest. Duplicates skipped without a set.
package main

import (
	"fmt"
	"slices"
	"strings"
)

func list(xs []int) string {
	parts := make([]string, len(xs))
	for i, x := range xs {
		parts[i] = fmt.Sprint(x)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func listOfLists(xss [][]int) string {
	parts := make([]string, len(xss))
	for i, xs := range xss {
		parts[i] = list(xs)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func threeSum(input []int) [][]int {
	nums := slices.Clone(input)
	slices.Sort(nums)
	out := [][]int{}
	n := len(nums)
	for i := 0; i < n-2; i++ {
		if i > 0 && nums[i] == nums[i-1] {
			continue // same anchor as last time
		}
		if nums[i] > 0 {
			break // sorted: no way back to zero
		}
		lo, hi := i+1, n-1
		for lo < hi {
			s := nums[i] + nums[lo] + nums[hi]
			if s < 0 {
				lo++
			} else if s > 0 {
				hi--
			} else {
				out = append(out, []int{nums[i], nums[lo], nums[hi]})
				lo++
				hi--
				for lo < hi && nums[lo] == nums[lo-1] {
					lo++ // skip duplicate seconds
				}
				for lo < hi && nums[hi] == nums[hi+1] {
					hi-- // skip duplicate thirds
				}
			}
		}
	}
	return out
}

// the duplicate-skip is what makes a set unnecessary
func threeSumWithSet(input []int) [][]int {
	nums := slices.Clone(input)
	slices.Sort(nums)
	seen := map[[3]int]bool{}
	n := len(nums)
	for i := 0; i < n-2; i++ {
		lo, hi := i+1, n-1
		for lo < hi {
			s := nums[i] + nums[lo] + nums[hi]
			if s < 0 {
				lo++
			} else if s > 0 {
				hi--
			} else {
				seen[[3]int{nums[i], nums[lo], nums[hi]}] = true
				lo++
				hi--
			}
		}
	}
	keys := make([][3]int, 0, len(seen))
	for k := range seen {
		keys = append(keys, k)
	}
	slices.SortFunc(keys, func(a, b [3]int) int {
		for i := range a {
			if a[i] != b[i] {
				return a[i] - b[i]
			}
		}
		return 0
	})
	out := [][]int{}
	for _, k := range keys {
		out = append(out, []int{k[0], k[1], k[2]})
	}
	return out
}

func main() {
	cases := [][]int{{-1, 0, 1, 2, -1, -4}, {0, 0, 0, 0}, {1, 2, 3}, {-2, 0, 1, 1, 2}}
	for _, xs := range cases {
		fmt.Printf("%-22s -> %s\\n", list(xs), listOfLists(threeSum(xs)))
	}

	xs := []int{-1, 0, 1, 2, -1, -4}
	fmt.Println("\\nsame answer, set version:", listOfLists(threeSumWithSet(xs)))
	fmt.Println("skip version            :", listOfLists(threeSum(xs)))
}`,
            },
          ],
        },
      ],
    },
    {
      id: "skip-vs-set",
      heading: "Why skip rather than deduplicate",
      body: [
        "The set version works and is shorter to write, and the comparison above shows they agree. Three reasons the skip is still the answer you want to give.",
        "**Space.** The set holds every triple found, which can be O(n²) of them. The skip version holds nothing.",
        "**Time.** Hashing a tuple costs more than comparing two integers, and the set version does it once per found triple rather than once per distinct one.",
        "**It generalises.** The skip idiom is the same at every level of k-Sum. A set of k-tuples gets slower and heavier as k grows.",
        "There is a fourth, softer reason: the skip demonstrates that you understand *where* duplicates come from, and the set demonstrates that you know they exist. Interviewers can tell the difference.",
      ],
    },
    {
      id: "k-sum",
      heading: "k-Sum, and where to stop",
      body: [
        "The construction recurses. **4Sum** is two nested loops around a two-pointer walk: O(n³). **k-Sum** is `k - 2` nested loops around one walk: **O(n^(k-1))**.",
        "So 3Sum at n = 3000 is nine million operations — fine. 4Sum at n = 200 is eight million — fine. 4Sum at n = 3000 is 2.7 × 10¹⁰, and it is not fine. The constraints tell you which k the intended solution uses.",
        "**Past k = 4, stop.** The better route is meet-in-the-middle: build a hash map of all pair sums, which is O(n²) space and time, then look up complements. That solves 4Sum in O(n²) and is the intended answer whenever n is large enough that O(n³) fails.",
      ],
      pitfalls: [
        {
          title: "Skipping *before* recording rather than after",
          body: "The inner skips must come after appending the triple and after advancing both pointers. Skipping first drops legitimate triples that happen to share a value with a previous one at a different position. `[-2, 0, 1, 1, 2]` — which should give both `[-2, 0, 2]` and `[-2, 1, 1]` — is the case that catches it.",
        },
        {
          title: "`while lo < hi` inside the skips",
          body: "Both inner skip loops must re-test `lo < hi` or they can cross, and the next comparison reads a nonsensical pair. On an all-equal input such as `[0, 0, 0, 0]` this is not hypothetical.",
        },
      ],
    },
  ],
  takeaways: [
    "3Sum = sort, fix one element, two-point the rest — O(n²) after the sort",
    "Three duplicate skips: one on the anchor, two after recording a triple",
    "Skip after appending and advancing, never before",
    "Guard the inner skips with `lo < hi`",
    "`[0, 0, 0, 0]` is the test that catches a missing skip",
    "Skipping beats a set on space, time, and generalisation",
    "k-Sum is O(n^(k-1)); past k=4 use meet-in-the-middle on pair sums",
  ],
  status: "available",
};
