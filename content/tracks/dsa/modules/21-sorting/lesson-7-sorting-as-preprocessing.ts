import type { Lesson } from "@/content/types";

export const sortingAsPreprocessingLesson: Lesson = {
  id: "dsa-sort-preprocessing",
  slug: "sorting-as-preprocessing",
  moduleSlug: "sorting",
  title: "Sorting as Preprocessing",
  summary:
    "Most of the time sorting is not the answer — it is the move that makes the answer available. Order brings adjacency, monotonicity and binary search with it, and the cost is one log factor.",
  estimatedMinutes: 35,
  objectives: [
    "Name the three properties sorting buys you",
    "Apply the sort-then-sweep shape to interval problems",
    "Decide when the log factor is worth paying",
    "Recognise when sorting destroys the thing you needed",
  ],
  sections: [
    {
      id: "what-order-buys",
      heading: "Three things you get from order",
      body: [
        "**Adjacency.** Equal or near-equal elements end up next to each other. Duplicate detection becomes a single scan comparing neighbours; the closest pair of values becomes a scan of adjacent differences.",
        "**Monotonicity.** Moving right never decreases the key. That is precisely the precondition for two pointers and for binary search — and both go from unavailable to trivial the moment the data is sorted.",
        "**A canonical order for greedy.** Many greedy algorithms are \"process in the right order and take what fits\". Sorting establishes the order, and the proof that the greedy choice is safe usually depends on it.",
        "The price is O(n log n) and, if you sort a copy, O(n) space. Almost always worth it: an O(n log n) preprocessing step followed by an O(n) sweep is a better algorithm than an O(n²) scan, and it is usually shorter to write.",
      ],
    },
    {
      id: "intervals",
      heading: "Intervals: the canonical example",
      body: [
        "Interval problems are the purest demonstration. Unsorted, an interval can overlap any other and you are looking at O(n²) pairwise checks. Sorted by start time, any interval can only overlap the one immediately before it in the output — so a single pass suffices.",
        "That reduction from \"could overlap anything\" to \"can only overlap the previous one\" is what the sort bought, and it is worth being able to state, because it is the argument for correctness.",
      ],
      examples: [
        {
          id: "merge-intervals",
          title: "Merge Intervals",
          lang: "python",
          code: `def merge_intervals(intervals):
    intervals = sorted(intervals, key=lambda p: p[0])
    out = []
    for start, end in intervals:
        if out and start <= out[-1][1]:
            out[-1][1] = max(out[-1][1], end)
        else:
            out.append([start, end])
    return out

print(merge_intervals([[1, 3], [2, 6], [8, 10], [15, 18]]))
print(merge_intervals([[1, 4], [4, 5]]))
print(merge_intervals([[1, 10], [2, 3], [4, 5]]))`,
          output: `[[1, 6], [8, 10], [15, 18]]
[[1, 5]]
[[1, 10]]`,
          explanation:
            "`max(out[-1][1], end)` is the line people leave out. The third case is why: `[1,10]` fully contains `[2,3]`, so the merged end must stay 10 rather than shrink to 3. Without the `max`, sorted-by-start input still produces a wrong answer whenever one interval nests inside another. The second case pins down the boundary convention — touching intervals `[1,4]` and `[4,5]` merge here because the test is `<=`; a problem treating them as disjoint wants `<`.",
          alternates: [
            {
              lang: "javascript",
              code: `const grid = (m) => "[" + m.map((r) => "[" + r.join(", ") + "]").join(", ") + "]";

function mergeIntervals(input) {
  const intervals = [...input].sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [start, end] of intervals) {
    const last = out[out.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else out.push([start, end]);
  }
  return out;
}

console.log(grid(mergeIntervals([[1, 3], [2, 6], [8, 10], [15, 18]])));
console.log(grid(mergeIntervals([[1, 4], [4, 5]])));
console.log(grid(mergeIntervals([[1, 10], [2, 3], [4, 5]])));`,
            },
            {
              lang: "typescript",
              code: `const grid = (m: number[][]): string => "[" + m.map((r) => "[" + r.join(", ") + "]").join(", ") + "]";

function mergeIntervals(input: number[][]): number[][] {
  const intervals = [...input].sort((a, b) => a[0] - b[0]);
  const out: number[][] = [];
  for (const [start, end] of intervals) {
    const last = out[out.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else out.push([start, end]);
  }
  return out;
}

console.log(grid(mergeIntervals([[1, 3], [2, 6], [8, 10], [15, 18]])));
console.log(grid(mergeIntervals([[1, 4], [4, 5]])));
console.log(grid(mergeIntervals([[1, 10], [2, 3], [4, 5]])));`,
            },
            {
              lang: "java",
              code: `import java.util.*;

public class Main {
    static String grid(List<int[]> m) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < m.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append("[").append(m.get(i)[0]).append(", ").append(m.get(i)[1]).append("]");
        }
        return sb.append("]").toString();
    }

    static List<int[]> mergeIntervals(int[][] input) {
        int[][] intervals = input.clone();
        Arrays.sort(intervals, Comparator.comparingInt(p -> p[0]));
        List<int[]> out = new ArrayList<>();
        for (int[] iv : intervals) {
            if (!out.isEmpty() && iv[0] <= out.get(out.size() - 1)[1]) {
                int[] last = out.get(out.size() - 1);
                last[1] = Math.max(last[1], iv[1]);
            } else {
                out.add(new int[]{iv[0], iv[1]});
            }
        }
        return out;
    }

    public static void main(String[] args) {
        System.out.println(grid(mergeIntervals(new int[][]{{1, 3}, {2, 6}, {8, 10}, {15, 18}})));
        System.out.println(grid(mergeIntervals(new int[][]{{1, 4}, {4, 5}})));
        System.out.println(grid(mergeIntervals(new int[][]{{1, 10}, {2, 3}, {4, 5}})));
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <array>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

string grid(const vector<array<int, 2>>& m) {
    string out = "[";
    for (size_t i = 0; i < m.size(); i++) {
        if (i) out += ", ";
        out += "[" + to_string(m[i][0]) + ", " + to_string(m[i][1]) + "]";
    }
    return out + "]";
}

vector<array<int, 2>> mergeIntervals(vector<array<int, 2>> intervals) {
    sort(intervals.begin(), intervals.end(),
         [](const auto& a, const auto& b) { return a[0] < b[0]; });
    vector<array<int, 2>> out;
    for (const auto& iv : intervals) {
        if (!out.empty() && iv[0] <= out.back()[1]) out.back()[1] = max(out.back()[1], iv[1]);
        else out.push_back(iv);
    }
    return out;
}

int main() {
    cout << grid(mergeIntervals({{1, 3}, {2, 6}, {8, 10}, {15, 18}})) << "\\n";
    cout << grid(mergeIntervals({{1, 4}, {4, 5}})) << "\\n";
    cout << grid(mergeIntervals({{1, 10}, {2, 3}, {4, 5}})) << "\\n";
}`,
            },
            {
              lang: "rust",
              code: `fn grid(m: &[[i32; 2]]) -> String {
    let parts: Vec<String> = m.iter().map(|r| format!("[{}, {}]", r[0], r[1])).collect();
    format!("[{}]", parts.join(", "))
}

fn merge_intervals(input: &[[i32; 2]]) -> Vec<[i32; 2]> {
    let mut intervals = input.to_vec();
    intervals.sort_by_key(|p| p[0]);
    let mut out: Vec<[i32; 2]> = Vec::new();
    for iv in intervals {
        match out.last_mut() {
            Some(last) if iv[0] <= last[1] => last[1] = last[1].max(iv[1]),
            _ => out.push(iv),
        }
    }
    out
}

fn main() {
    println!("{}", grid(&merge_intervals(&[[1, 3], [2, 6], [8, 10], [15, 18]])));
    println!("{}", grid(&merge_intervals(&[[1, 4], [4, 5]])));
    println!("{}", grid(&merge_intervals(&[[1, 10], [2, 3], [4, 5]])));
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"slices"
	"strings"
)

func grid(m [][2]int) string {
	parts := make([]string, len(m))
	for i, r := range m {
		parts[i] = fmt.Sprintf("[%d, %d]", r[0], r[1])
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func mergeIntervals(input [][2]int) [][2]int {
	intervals := slices.Clone(input)
	slices.SortFunc(intervals, func(a, b [2]int) int { return a[0] - b[0] })
	out := [][2]int{}
	for _, iv := range intervals {
		if n := len(out); n > 0 && iv[0] <= out[n-1][1] {
			out[n-1][1] = max(out[n-1][1], iv[1])
		} else {
			out = append(out, iv)
		}
	}
	return out
}

func main() {
	fmt.Println(grid(mergeIntervals([][2]int{{1, 3}, {2, 6}, {8, 10}, {15, 18}})))
	fmt.Println(grid(mergeIntervals([][2]int{{1, 4}, {4, 5}})))
	fmt.Println(grid(mergeIntervals([][2]int{{1, 10}, {2, 3}, {4, 5}})))
}`,
            },
          ],
        },
      ],
    },
    {
      id: "the-shapes",
      heading: "The recurring shapes",
      body: [
        "**Sort by start, sweep** — merge intervals, insert interval, meeting rooms.",
        "**Sort by end, take greedily** — activity selection, non-overlapping intervals, minimum arrows to burst balloons. Sorting by *end* rather than start is what makes the greedy choice provably optimal, and choosing the wrong one of the two is the standard mistake.",
        "**Sort, then two pointers** — 3Sum, container-style problems, closest pair to a target. Sorting makes the monotone shrink-and-grow argument valid.",
        "**Sort, then binary search** — count elements below a threshold, find insertion points, answer many queries against fixed data.",
        "**Sort, then scan neighbours** — contains-duplicate, minimum absolute difference, longest consecutive run when you are allowed O(n log n).",
        "**Sort both sides and compare** — anagram checking, or verifying two collections are permutations of each other.",
        "**Coordinate compression** — sort the distinct values and replace each by its rank, turning huge coordinates into indices a Fenwick tree or DP table can use. It is sorting used purely to shrink the key space.",
      ],
      pitfalls: [
        {
          title: "Sorting when the answer is positions",
          body: "Sorting destroys indices. Two Sum asks for positions, so sorting costs you the answer unless you carry the original index alongside each value — which reintroduces the O(n) space that sorting was supposed to save.",
        },
        {
          title: "Sorting inside a loop",
          body: "An O(n log n) sort inside an O(n) loop is O(n² log n) and is almost always an accident. Sort once, before the loop. If the data changes each iteration, you want a heap or an ordered structure rather than a repeated sort.",
        },
        {
          title: "Sorting by start when the greedy needs the end",
          body: "For selecting the most non-overlapping intervals, sorting by end is correct and sorting by start is not — the earliest-ending interval leaves the most room for the rest. Both orderings look plausible; only one has a proof.",
        },
        {
          title: "Mutating the caller's list",
          body: "`list.sort()` and `Collections.sort` sort in place. If the caller needs the original order afterwards, sort a copy. This is the kind of bug that only shows up in the second test case.",
        },
      ],
    },
    {
      id: "when-not-to",
      heading: "When not to sort",
      body: [
        "**When O(n) is required.** Sorting is the reflex and the log factor is sometimes exactly what the problem forbids. Longest Consecutive Sequence is O(n log n) with a sort and O(n) with a set — and the O(n) version is the one being asked for.",
        "**When you need positions.** As above.",
        "**When you need only one element.** Quickselect finds the k-th smallest in O(n) average; a heap of size k gives O(n log k). Both beat sorting for a single answer.",
        "**When the data is already sorted.** Check — the problem often says so, and it makes two pointers or binary search available immediately at O(1) space.",
        "**When it arrives as a stream.** You cannot sort what you have not seen. That is heap territory.",
        "A useful discipline: before writing `sort()`, say what property you are buying with the log factor. If you cannot name it — adjacency, monotonicity, a greedy order — you may not need the sort.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does sorting make interval merging linear?",
      answer:
        "Sorted by start, an interval can only overlap the most recent one in the output, since anything earlier ends before this one begins or has already been merged. That turns pairwise overlap checking into a single pass.",
    },
    {
      question: "Merge intervals — what is the common bug?",
      answer:
        "Setting the merged end to the new interval's end instead of the maximum of the two. When one interval nests inside another the end must not shrink, so it has to be `max(previous_end, end)`.",
    },
    {
      question: "When does sorting by end beat sorting by start?",
      answer:
        "For greedy interval selection — the most non-overlapping intervals, minimum removals, minimum arrows. Taking the earliest-ending interval leaves the most room for what follows, and that is the exchange argument the proof rests on. Sorting by start does not support it.",
    },
  ],
  takeaways: [
    "Sorting buys adjacency, monotonicity and a greedy order",
    "Sorted by start, an interval can only overlap the previous one",
    "max(previous_end, end) — the nesting case is the standard bug",
    "Sort by end for greedy selection, by start for merging",
    "Sorting destroys positions and forbids an O(n) requirement",
    "Name the property you are buying before paying the log factor",
  ],
  status: "available",
};
