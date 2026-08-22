import type { Lesson } from "@/content/types";

export const backtrackingLesson: Lesson = {
  id: "dsa-rec-backtracking",
  slug: "choose-explore-un-choose",
  moduleSlug: "recursion-and-backtracking",
  title: "Backtracking: Choose, Explore, Un-choose",
  summary:
    "One template covers subsets, permutations, combinations and every constraint puzzle. Its three lines are always the same, and the third one — the un-choose — is the one people leave out.",
  estimatedMinutes: 35,
  objectives: [
    "Write the backtracking template from memory",
    "Explain what the un-choose restores and why it is required",
    "Say why the result must be appended as a copy",
    "Generate subsets and permutations, and see how they differ",
    "Handle duplicate inputs without a set",
  ],
  sections: [
    {
      id: "the-template",
      heading: "The template",
      body: [
        "*If the current path is a complete answer, record it. Otherwise, for each available choice: **choose** it, **explore** by recursing, then **un-choose** it.*",
        "The un-choose is the whole idea. You are walking a decision tree with a single mutable `path`, and when a branch is exhausted the path must be restored to what it was before that branch started — otherwise the next sibling branch inherits state from the previous one.",
        "That is why it is called backtracking: you go forward, and then you *undo*, deliberately.",
      ],
      examples: [
        {
          id: "backtrack",
          title: "Subsets traced, then permutations and duplicates",
          lang: "python",
          code: `def subsets(nums):
    """choose / explore / un-choose. The un-choose is what makes it correct."""
    out = []
    path = []

    def backtrack(start, depth=0):
        out.append(path[:])                       # a copy — path keeps mutating
        for i in range(start, len(nums)):
            path.append(nums[i])                  # choose
            print(f"{'  ' * depth}chose {nums[i]}, path = {path}")
            backtrack(i + 1, depth + 1)           # explore
            path.pop()                            # un-choose
        return

    backtrack(0)
    return out

print("=== subsets of [1, 2, 3] ===")
result = subsets([1, 2, 3])
print("\\nall subsets:", result)
print("count:", len(result), "= 2^3")

def permutations(nums):
    out = []
    path = []
    used = [False] * len(nums)

    def backtrack():
        if len(path) == len(nums):
            out.append(path[:])
            return
        for i in range(len(nums)):
            if used[i]:
                continue
            used[i] = True
            path.append(nums[i])
            backtrack()
            path.pop()
            used[i] = False

    backtrack()
    return out

print("\\npermutations of [1,2,3]:", permutations([1, 2, 3]))

def subsets_with_dups(nums):
    """Sort, then skip a value that equals its predecessor at the same depth."""
    nums = sorted(nums)
    out, path = [], []

    def backtrack(start):
        out.append(path[:])
        for i in range(start, len(nums)):
            if i > start and nums[i] == nums[i - 1]:
                continue                          # same choice at this level
            path.append(nums[i])
            backtrack(i + 1)
            path.pop()

    backtrack(0)
    return out

print("\\nsubsets of [1,2,2]:", subsets_with_dups([1, 2, 2]))
print("  count:", len(subsets_with_dups([1, 2, 2])), "(not 8 — duplicates removed)")`,
          output: `=== subsets of [1, 2, 3] ===
chose 1, path = [1]
  chose 2, path = [1, 2]
    chose 3, path = [1, 2, 3]
  chose 3, path = [1, 3]
chose 2, path = [2]
  chose 3, path = [2, 3]
chose 3, path = [3]

all subsets: [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]
count: 8 = 2^3

permutations of [1,2,3]: [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]

subsets of [1,2,2]: [[], [1], [1, 2], [1, 2, 2], [2], [2, 2]]
  count: 6 (not 8 — duplicates removed)`,
          explanation:
            "Follow the trace's indentation and you are looking at the decision tree directly. After `[1, 2, 3]` completes, the path unwinds to `[1]` and the next sibling gives `[1, 3]` — that unwinding is the `pop()` doing its job.\n\n**Subsets against permutations** differ in exactly one thing: subsets pass `i + 1` as the next `start`, so each element may be used once and order does not matter; permutations loop from 0 with a `used` array, so order does matter and every element appears in every position. That single difference is the whole distinction between the two problem families.",
          alternates: [
            {
              lang: "javascript",
              code: `// choose / explore / un-choose. The un-choose is what makes it correct.
const list = (xs) => "[" + xs.join(", ") + "]";
const listOfLists = (xss) => "[" + xss.map(list).join(", ") + "]";

function subsets(nums) {
  const out = [];
  const path = [];

  function backtrack(start, depth = 0) {
    out.push([...path]);                            // a copy — path keeps mutating
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);                           // choose
      console.log(\`\${"  ".repeat(depth)}chose \${nums[i]}, path = \${list(path)}\`);
      backtrack(i + 1, depth + 1);                  // explore
      path.pop();                                   // un-choose
    }
  }

  backtrack(0);
  return out;
}

console.log("=== subsets of [1, 2, 3] ===");
const result = subsets([1, 2, 3]);
console.log("\\nall subsets:", listOfLists(result));
console.log("count:", result.length, "= 2^3");

function permutations(nums) {
  const out = [];
  const path = [];
  const used = new Array(nums.length).fill(false);

  function backtrack() {
    if (path.length === nums.length) {
      out.push([...path]);
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(nums[i]);
      backtrack();
      path.pop();
      used[i] = false;
    }
  }

  backtrack();
  return out;
}

console.log("\\npermutations of [1,2,3]:", listOfLists(permutations([1, 2, 3])));

// Sort, then skip a value that equals its predecessor at the same depth.
function subsetsWithDups(input) {
  const nums = [...input].sort((a, b) => a - b);
  const out = [];
  const path = [];

  function backtrack(start) {
    out.push([...path]);
    for (let i = start; i < nums.length; i++) {
      if (i > start && nums[i] === nums[i - 1]) continue;  // same choice at this level
      path.push(nums[i]);
      backtrack(i + 1);
      path.pop();
    }
  }

  backtrack(0);
  return out;
}

console.log("\\nsubsets of [1,2,2]:", listOfLists(subsetsWithDups([1, 2, 2])));
console.log("  count:", subsetsWithDups([1, 2, 2]).length, "(not 8 — duplicates removed)");`,
            },
            {
              lang: "typescript",
              code: `// choose / explore / un-choose. The un-choose is what makes it correct.
const list = (xs: number[]): string => "[" + xs.join(", ") + "]";
const listOfLists = (xss: number[][]): string => "[" + xss.map(list).join(", ") + "]";

function subsets(nums: number[]): number[][] {
  const out: number[][] = [];
  const path: number[] = [];

  function backtrack(start: number, depth = 0): void {
    out.push([...path]);                            // a copy — path keeps mutating
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);                           // choose
      console.log(\`\${"  ".repeat(depth)}chose \${nums[i]}, path = \${list(path)}\`);
      backtrack(i + 1, depth + 1);                  // explore
      path.pop();                                   // un-choose
    }
  }

  backtrack(0);
  return out;
}

console.log("=== subsets of [1, 2, 3] ===");
const result = subsets([1, 2, 3]);
console.log("\\nall subsets:", listOfLists(result));
console.log("count:", result.length, "= 2^3");

function permutations(nums: number[]): number[][] {
  const out: number[][] = [];
  const path: number[] = [];
  const used = new Array(nums.length).fill(false);

  function backtrack(): void {
    if (path.length === nums.length) {
      out.push([...path]);
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(nums[i]);
      backtrack();
      path.pop();
      used[i] = false;
    }
  }

  backtrack();
  return out;
}

console.log("\\npermutations of [1,2,3]:", listOfLists(permutations([1, 2, 3])));

// Sort, then skip a value that equals its predecessor at the same depth.
function subsetsWithDups(input: number[]): number[][] {
  const nums = [...input].sort((a, b) => a - b);
  const out: number[][] = [];
  const path: number[] = [];

  function backtrack(start: number): void {
    out.push([...path]);
    for (let i = start; i < nums.length; i++) {
      if (i > start && nums[i] === nums[i - 1]) continue;  // same choice at this level
      path.push(nums[i]);
      backtrack(i + 1);
      path.pop();
    }
  }

  backtrack(0);
  return out;
}

console.log("\\nsubsets of [1,2,2]:", listOfLists(subsetsWithDups([1, 2, 2])));
console.log("  count:", subsetsWithDups([1, 2, 2]).length, "(not 8 — duplicates removed)");`,
            },
            {
              lang: "java",
              code: `import java.util.*;

/** choose / explore / un-choose. The un-choose is what makes it correct. */
public class Main {
    static String list(List<Integer> xs) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < xs.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(xs.get(i));
        }
        return sb.append("]").toString();
    }

    static String listOfLists(List<List<Integer>> xss) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < xss.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(list(xss.get(i)));
        }
        return sb.append("]").toString();
    }

    static List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> out = new ArrayList<>();
        List<Integer> path = new ArrayList<>();
        subsetsWalk(nums, 0, 0, path, out);
        return out;
    }

    static void subsetsWalk(int[] nums, int start, int depth,
                            List<Integer> path, List<List<Integer>> out) {
        out.add(new ArrayList<>(path));               // a copy — path keeps mutating
        for (int i = start; i < nums.length; i++) {
            path.add(nums[i]);                        // choose
            System.out.println("  ".repeat(depth) + "chose " + nums[i] + ", path = " + list(path));
            subsetsWalk(nums, i + 1, depth + 1, path, out);   // explore
            path.remove(path.size() - 1);             // un-choose
        }
    }

    static List<List<Integer>> permutations(int[] nums) {
        List<List<Integer>> out = new ArrayList<>();
        List<Integer> path = new ArrayList<>();
        boolean[] used = new boolean[nums.length];
        permWalk(nums, used, path, out);
        return out;
    }

    static void permWalk(int[] nums, boolean[] used,
                         List<Integer> path, List<List<Integer>> out) {
        if (path.size() == nums.length) {
            out.add(new ArrayList<>(path));
            return;
        }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            path.add(nums[i]);
            permWalk(nums, used, path, out);
            path.remove(path.size() - 1);
            used[i] = false;
        }
    }

    /** Sort, then skip a value that equals its predecessor at the same depth. */
    static List<List<Integer>> subsetsWithDups(int[] input) {
        int[] nums = input.clone();
        Arrays.sort(nums);
        List<List<Integer>> out = new ArrayList<>();
        dupWalk(nums, 0, new ArrayList<>(), out);
        return out;
    }

    static void dupWalk(int[] nums, int start, List<Integer> path, List<List<Integer>> out) {
        out.add(new ArrayList<>(path));
        for (int i = start; i < nums.length; i++) {
            if (i > start && nums[i] == nums[i - 1]) continue;  // same choice at this level
            path.add(nums[i]);
            dupWalk(nums, i + 1, path, out);
            path.remove(path.size() - 1);
        }
    }

    public static void main(String[] args) {
        System.out.println("=== subsets of [1, 2, 3] ===");
        List<List<Integer>> result = subsets(new int[]{1, 2, 3});
        System.out.println("\\nall subsets: " + listOfLists(result));
        System.out.println("count: " + result.size() + " = 2^3");

        System.out.println("\\npermutations of [1,2,3]: "
                + listOfLists(permutations(new int[]{1, 2, 3})));

        System.out.println("\\nsubsets of [1,2,2]: "
                + listOfLists(subsetsWithDups(new int[]{1, 2, 2})));
        System.out.println("  count: " + subsetsWithDups(new int[]{1, 2, 2}).size()
                + " (not 8 — duplicates removed)");
    }
}`,
            },
            {
              lang: "cpp",
              code: `// choose / explore / un-choose. The un-choose is what makes it correct.
#include <algorithm>
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

string listOfLists(const vector<vector<int>>& xss) {
    string out = "[";
    for (size_t i = 0; i < xss.size(); i++) {
        if (i) out += ", ";
        out += list(xss[i]);
    }
    return out + "]";
}

void subsetsWalk(const vector<int>& nums, size_t start, int depth,
                 vector<int>& path, vector<vector<int>>& out) {
    out.push_back(path);                              // a copy — path keeps mutating
    for (size_t i = start; i < nums.size(); i++) {
        path.push_back(nums[i]);                      // choose
        cout << string(depth * 2, ' ') << "chose " << nums[i]
             << ", path = " << list(path) << "\\n";
        subsetsWalk(nums, i + 1, depth + 1, path, out);   // explore
        path.pop_back();                              // un-choose
    }
}

vector<vector<int>> subsets(const vector<int>& nums) {
    vector<vector<int>> out;
    vector<int> path;
    subsetsWalk(nums, 0, 0, path, out);
    return out;
}

void permWalk(const vector<int>& nums, vector<bool>& used,
              vector<int>& path, vector<vector<int>>& out) {
    if (path.size() == nums.size()) {
        out.push_back(path);
        return;
    }
    for (size_t i = 0; i < nums.size(); i++) {
        if (used[i]) continue;
        used[i] = true;
        path.push_back(nums[i]);
        permWalk(nums, used, path, out);
        path.pop_back();
        used[i] = false;
    }
}

vector<vector<int>> permutations(const vector<int>& nums) {
    vector<vector<int>> out;
    vector<int> path;
    vector<bool> used(nums.size(), false);
    permWalk(nums, used, path, out);
    return out;
}

void dupWalk(const vector<int>& nums, size_t start,
             vector<int>& path, vector<vector<int>>& out) {
    out.push_back(path);
    for (size_t i = start; i < nums.size(); i++) {
        if (i > start && nums[i] == nums[i - 1]) continue;  // same choice at this level
        path.push_back(nums[i]);
        dupWalk(nums, i + 1, path, out);
        path.pop_back();
    }
}

// Sort, then skip a value that equals its predecessor at the same depth.
vector<vector<int>> subsetsWithDups(vector<int> nums) {
    sort(nums.begin(), nums.end());
    vector<vector<int>> out;
    vector<int> path;
    dupWalk(nums, 0, path, out);
    return out;
}

int main() {
    cout << "=== subsets of [1, 2, 3] ===\\n";
    auto result = subsets({1, 2, 3});
    cout << "\\nall subsets: " << listOfLists(result) << "\\n";
    cout << "count: " << result.size() << " = 2^3\\n";

    cout << "\\npermutations of [1,2,3]: " << listOfLists(permutations({1, 2, 3})) << "\\n";

    cout << "\\nsubsets of [1,2,2]: " << listOfLists(subsetsWithDups({1, 2, 2})) << "\\n";
    cout << "  count: " << subsetsWithDups({1, 2, 2}).size()
         << " (not 8 — duplicates removed)\\n";
}`,
            },
            {
              lang: "rust",
              code: `// choose / explore / un-choose. The un-choose is what makes it correct.
fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn list_of_lists(xss: &[Vec<i32>]) -> String {
    let parts: Vec<String> = xss.iter().map(|x| list(x)).collect();
    format!("[{}]", parts.join(", "))
}

fn subsets_walk(nums: &[i32], start: usize, depth: usize,
                path: &mut Vec<i32>, out: &mut Vec<Vec<i32>>) {
    out.push(path.clone()); // a copy — path keeps mutating
    for i in start..nums.len() {
        path.push(nums[i]); // choose
        println!("{}chose {}, path = {}", "  ".repeat(depth), nums[i], list(path));
        subsets_walk(nums, i + 1, depth + 1, path, out); // explore
        path.pop(); // un-choose
    }
}

fn subsets(nums: &[i32]) -> Vec<Vec<i32>> {
    let mut out = Vec::new();
    let mut path = Vec::new();
    subsets_walk(nums, 0, 0, &mut path, &mut out);
    out
}

fn perm_walk(nums: &[i32], used: &mut Vec<bool>,
             path: &mut Vec<i32>, out: &mut Vec<Vec<i32>>) {
    if path.len() == nums.len() {
        out.push(path.clone());
        return;
    }
    for i in 0..nums.len() {
        if used[i] {
            continue;
        }
        used[i] = true;
        path.push(nums[i]);
        perm_walk(nums, used, path, out);
        path.pop();
        used[i] = false;
    }
}

fn permutations(nums: &[i32]) -> Vec<Vec<i32>> {
    let mut out = Vec::new();
    let mut path = Vec::new();
    let mut used = vec![false; nums.len()];
    perm_walk(nums, &mut used, &mut path, &mut out);
    out
}

fn dup_walk(nums: &[i32], start: usize, path: &mut Vec<i32>, out: &mut Vec<Vec<i32>>) {
    out.push(path.clone());
    for i in start..nums.len() {
        if i > start && nums[i] == nums[i - 1] {
            continue; // same choice at this level
        }
        path.push(nums[i]);
        dup_walk(nums, i + 1, path, out);
        path.pop();
    }
}

/// Sort, then skip a value that equals its predecessor at the same depth.
fn subsets_with_dups(input: &[i32]) -> Vec<Vec<i32>> {
    let mut nums = input.to_vec();
    nums.sort();
    let mut out = Vec::new();
    let mut path = Vec::new();
    dup_walk(&nums, 0, &mut path, &mut out);
    out
}

fn main() {
    println!("=== subsets of [1, 2, 3] ===");
    let result = subsets(&[1, 2, 3]);
    println!("\\nall subsets: {}", list_of_lists(&result));
    println!("count: {} = 2^3", result.len());

    println!("\\npermutations of [1,2,3]: {}", list_of_lists(&permutations(&[1, 2, 3])));

    println!("\\nsubsets of [1,2,2]: {}", list_of_lists(&subsets_with_dups(&[1, 2, 2])));
    println!("  count: {} (not 8 — duplicates removed)", subsets_with_dups(&[1, 2, 2]).len());
}`,
            },
            {
              lang: "go",
              code: `// choose / explore / un-choose. The un-choose is what makes it correct.
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

func subsets(nums []int) [][]int {
	out := [][]int{}
	path := []int{}
	var walk func(start, depth int)
	walk = func(start, depth int) {
		out = append(out, slices.Clone(path)) // a copy — path keeps mutating
		for i := start; i < len(nums); i++ {
			path = append(path, nums[i]) // choose
			fmt.Printf("%schose %d, path = %s\\n", strings.Repeat("  ", depth), nums[i], list(path))
			walk(i+1, depth+1)          // explore
			path = path[:len(path)-1]   // un-choose
		}
	}
	walk(0, 0)
	return out
}

func permutations(nums []int) [][]int {
	out := [][]int{}
	path := []int{}
	used := make([]bool, len(nums))
	var walk func()
	walk = func() {
		if len(path) == len(nums) {
			out = append(out, slices.Clone(path))
			return
		}
		for i := range nums {
			if used[i] {
				continue
			}
			used[i] = true
			path = append(path, nums[i])
			walk()
			path = path[:len(path)-1]
			used[i] = false
		}
	}
	walk()
	return out
}

// Sort, then skip a value that equals its predecessor at the same depth.
func subsetsWithDups(input []int) [][]int {
	nums := slices.Clone(input)
	slices.Sort(nums)
	out := [][]int{}
	path := []int{}
	var walk func(start int)
	walk = func(start int) {
		out = append(out, slices.Clone(path))
		for i := start; i < len(nums); i++ {
			if i > start && nums[i] == nums[i-1] {
				continue // same choice at this level
			}
			path = append(path, nums[i])
			walk(i + 1)
			path = path[:len(path)-1]
		}
	}
	walk(0)
	return out
}

func main() {
	fmt.Println("=== subsets of [1, 2, 3] ===")
	result := subsets([]int{1, 2, 3})
	fmt.Println("\\nall subsets:", listOfLists(result))
	fmt.Println("count:", len(result), "= 2^3")

	fmt.Println("\\npermutations of [1,2,3]:", listOfLists(permutations([]int{1, 2, 3})))

	fmt.Println("\\nsubsets of [1,2,2]:", listOfLists(subsetsWithDups([]int{1, 2, 2})))
	fmt.Println("  count:", len(subsetsWithDups([]int{1, 2, 2})), "(not 8 — duplicates removed)")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "the-copy",
      heading: "Why `path[:]` and not `path`",
      body: [
        "`out.append(path)` appends a **reference**. `path` keeps mutating for the rest of the search, so every entry in `out` ends up pointing at the same list — and at the end they all show whatever `path` finished as, which is usually empty.",
        "`out.append(path[:])` — or `list(path)`, or `new ArrayList<>(path)` in Java — takes a snapshot. This is the same aliasing trap the Go module flagged for `append`, and it is the single most common backtracking bug because the code looks right and the output is uniformly wrong.",
      ],
    },
    {
      id: "duplicates",
      heading: "Duplicates: sort, then skip at the same level",
      body: [
        "With `[1, 2, 2]`, the two 2s are interchangeable, so choosing the first at a given level and choosing the second produce identical subtrees. Exploring both duplicates the output.",
        "The fix is the same shape as 3Sum's: **sort**, then within a level skip any value equal to its predecessor. The condition is `if i > start and nums[i] == nums[i - 1]: continue`.",
        "`i > start` is doing precise work. It means \"this is not the first choice *at this level*\". Using `i > 0` instead would skip the second 2 even when the first was chosen by an *ancestor* rather than a sibling, which wrongly excludes `[2, 2]`. Getting this wrong drops legitimate answers rather than adding extra ones, which is harder to spot.",
      ],
      pitfalls: [
        {
          title: "Forgetting to undo *all* the state",
          body: "The permutation version changes two things per choice — `path` and `used[i]` — so the un-choose must restore both. Any state touched on the way down must be reverted on the way up, and missing one is a bug that appears only on the second branch.",
        },
        {
          title: "`i > 0` instead of `i > start` in the duplicate skip",
          body: "It looks equivalent and is not. `i > start` compares against siblings at the same level; `i > 0` compares against the whole array and silently drops valid answers containing repeated values.",
        },
        {
          title: "Recording the answer in the wrong place",
          body: "For subsets, every node is an answer, so the record happens at the top of the function. For permutations only complete paths count, so it happens behind a length check and is followed by a `return`. Getting this wrong gives partial results in the output.",
        },
      ],
    },
  ],
  takeaways: [
    "Choose, explore, un-choose — and the un-choose is what people omit",
    "Append a *copy* of the path, or every entry aliases the same list",
    "Subsets pass `i + 1`; permutations loop from 0 with a `used` array",
    "Handle duplicates by sorting and skipping with `i > start`, not `i > 0`",
    "Undo every piece of state you touched on the way down",
    "Subsets record at every node; permutations record only at complete paths",
  ],
  status: "available",
};
