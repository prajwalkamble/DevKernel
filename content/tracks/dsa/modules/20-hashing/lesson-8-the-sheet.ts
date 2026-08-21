import type { Lesson } from "@/content/types";

export const hashingSheetLesson: Lesson = {
  id: "dsa-hash-sheet",
  slug: "when-a-sorted-structure-wins",
  moduleSlug: "hashing",
  title: "When a Sorted Structure Wins, and the Sheet",
  summary:
    "A hash map answers exact-key questions. The moment the question involves order — nearest, next largest, everything in a range — it is the wrong structure, and knowing where that line sits is the point of this lesson.",
  estimatedMinutes: 30,
  objectives: [
    "State which questions a hash map cannot answer at all",
    "Choose between a hash map, a sorted map and a sorted array",
    "Recall the standard problems where hashing is the whole idea",
    "Recognise when a set is enough and a map is overkill",
  ],
  sections: [
    {
      id: "the-line",
      heading: "Where hashing stops",
      body: [
        "A hash map answers one question: *is this exact key present, and what is its value?* It is unbeatable at that and incapable of anything else.",
        "The moment the question involves **order**, hashing has nothing to offer. Deliberately so — hashing works by destroying order, scattering keys across buckets so they spread evenly.",
        "So these questions all need a different structure: the smallest key greater than x, the largest key less than x, all keys between a and b, the k smallest keys, the keys in sorted order.",
        "Answering any of them with a hash map means enumerating every key, which is O(n) per query and usually O(n log n) once you sort. A `TreeMap`, `std::map`, `SortedDict` or plain sorted array with binary search answers them in O(log n).",
      ],
      examples: [
        {
          id: "ordered-queries",
          title: "The questions a map cannot answer",
          lang: "python",
          code: `scores = {"ana": 91, "bob": 72, "cy": 88, "dee": 95}

print(sorted(scores.items(), key=lambda kv: -kv[1])[:2])

import bisect
keys = sorted(scores.values())
print(keys)
print("count >= 85:", len(keys) - bisect.bisect_left(keys, 85))`,
          output: `[('dee', 95), ('ana', 91)]
[72, 88, 91, 95]
count >= 85: 3`,
          explanation:
            "Both answers require sorting first — the dict contributed nothing but storage. With four entries that is irrelevant; inside a loop over many queries it is the whole cost. If range and rank queries are the workload, the data wants to live sorted, not hashed.",
          alternates: [
            {
              lang: "javascript",
              code: `const pairs = (ps) => "[" + ps.map(([k, v]) => \`('\${k}', \${v})\`).join(", ") + "]";
const list = (xs) => "[" + xs.join(", ") + "]";

// A Map keeps insertion order, which a sort by value then has to override.
const scores = new Map([["ana", 91], ["bob", 72], ["cy", 88], ["dee", 95]]);

const byScore = [...scores].sort((a, b) => b[1] - a[1]);
console.log(pairs(byScore.slice(0, 2)));

// A sorted array answers range questions a hash map cannot.
const keys = [...scores.values()].sort((a, b) => a - b);
console.log(list(keys));

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

console.log("count >= 85:", keys.length - bisectLeft(keys, 85));`,
            },
            {
              lang: "typescript",
              code: `const pairs = (ps: [string, number][]): string => "[" + ps.map(([k, v]) => \`('\${k}', \${v})\`).join(", ") + "]";
const list = (xs: number[]): string => "[" + xs.join(", ") + "]";

// A Map keeps insertion order, which a sort by value then has to override.
const scores = new Map([["ana", 91], ["bob", 72], ["cy", 88], ["dee", 95]]);

const byScore = [...scores].sort((a, b) => b[1] - a[1]);
console.log(pairs(byScore.slice(0, 2)));

// A sorted array answers range questions a hash map cannot.
const keys = [...scores.values()].sort((a, b) => a - b);
console.log(list(keys));

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

console.log("count >= 85:", keys.length - bisectLeft(keys, 85));`,
            },
            {
              lang: "java",
              code: `import java.util.*;

public class Main {
    static String pairs(List<Map.Entry<String, Integer>> ps) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < ps.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append("('").append(ps.get(i).getKey()).append("', ")
              .append(ps.get(i).getValue()).append(")");
        }
        return sb.append("]").toString();
    }

    static String list(List<Integer> xs) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < xs.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(xs.get(i));
        }
        return sb.append("]").toString();
    }

    static int bisectLeft(List<Integer> a, int v) {
        int lo = 0, hi = a.size();
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (a.get(mid) < v) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    public static void main(String[] args) {
        // LinkedHashMap keeps insertion order, which the sort by value overrides.
        Map<String, Integer> scores = new LinkedHashMap<>();
        scores.put("ana", 91);
        scores.put("bob", 72);
        scores.put("cy", 88);
        scores.put("dee", 95);

        List<Map.Entry<String, Integer>> byScore = new ArrayList<>(scores.entrySet());
        byScore.sort((a, b) -> b.getValue() - a.getValue());
        System.out.println(pairs(byScore.subList(0, 2)));

        // A sorted list answers range questions a hash map cannot.
        List<Integer> keys = new ArrayList<>(scores.values());
        Collections.sort(keys);
        System.out.println(list(keys));
        System.out.println("count >= 85: " + (keys.size() - bisectLeft(keys, 85)));
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <iostream>
#include <string>
#include <utility>
#include <vector>
using namespace std;

string pairsOf(const vector<pair<string, int>>& ps) {
    string out = "[";
    for (size_t i = 0; i < ps.size(); i++) {
        if (i) out += ", ";
        out += "('" + ps[i].first + "', " + to_string(ps[i].second) + ")";
    }
    return out + "]";
}

string list(const vector<int>& xs) {
    string out = "[";
    for (size_t i = 0; i < xs.size(); i++) {
        if (i) out += ", ";
        out += to_string(xs[i]);
    }
    return out + "]";
}

int main() {
    // A vector of pairs, not a map: insertion order is the starting point, and
    // the sort by value overrides it.
    vector<pair<string, int>> scores = {{"ana", 91}, {"bob", 72}, {"cy", 88}, {"dee", 95}};

    vector<pair<string, int>> byScore = scores;
    stable_sort(byScore.begin(), byScore.end(),
                [](const auto& a, const auto& b) { return a.second > b.second; });
    cout << pairsOf({byScore.begin(), byScore.begin() + 2}) << "\\n";

    // A sorted array answers range questions a hash map cannot.
    vector<int> keys;
    for (const auto& kv : scores) keys.push_back(kv.second);
    sort(keys.begin(), keys.end());
    cout << list(keys) << "\\n";
    cout << "count >= 85: "
         << keys.end() - lower_bound(keys.begin(), keys.end(), 85) << "\\n";
}`,
            },
            {
              lang: "rust",
              code: `fn pairs_of(ps: &[(String, i32)]) -> String {
    let parts: Vec<String> = ps.iter().map(|(k, v)| format!("('{}', {})", k, v)).collect();
    format!("[{}]", parts.join(", "))
}

fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn main() {
    // A Vec of pairs, not a HashMap: insertion order is the starting point, and
    // the sort by value overrides it.
    let scores: Vec<(String, i32)> = vec![
        ("ana".to_string(), 91),
        ("bob".to_string(), 72),
        ("cy".to_string(), 88),
        ("dee".to_string(), 95),
    ];

    let mut by_score = scores.clone();
    by_score.sort_by(|a, b| b.1.cmp(&a.1));
    println!("{}", pairs_of(&by_score[..2]));

    // A sorted array answers range questions a hash map cannot.
    let mut keys: Vec<i32> = scores.iter().map(|kv| kv.1).collect();
    keys.sort();
    println!("{}", list(&keys));
    println!("count >= 85: {}", keys.len() - keys.partition_point(|&x| x < 85));
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

type entry struct {
	name  string
	score int
}

func pairsOf(ps []entry) string {
	parts := make([]string, len(ps))
	for i, p := range ps {
		parts[i] = fmt.Sprintf("('%s', %d)", p.name, p.score)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func list(xs []int) string {
	parts := make([]string, len(xs))
	for i, x := range xs {
		parts[i] = fmt.Sprint(x)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func main() {
	// A slice of pairs, not a map: Go randomises map iteration, and insertion
	// order is the starting point the sort by value overrides.
	scores := []entry{{"ana", 91}, {"bob", 72}, {"cy", 88}, {"dee", 95}}

	byScore := append([]entry(nil), scores...)
	sort.SliceStable(byScore, func(i, j int) bool { return byScore[i].score > byScore[j].score })
	fmt.Println(pairsOf(byScore[:2]))

	// A sorted slice answers range questions a hash map cannot.
	keys := make([]int, len(scores))
	for i, s := range scores {
		keys[i] = s.score
	}
	sort.Ints(keys)
	fmt.Println(list(keys))
	fmt.Println("count >= 85:", len(keys)-sort.SearchInts(keys, 85))
}`,
            },
          ],
        },
      ],
    },
    {
      id: "choosing",
      heading: "Choosing the structure",
      body: [
        "**Hash map** — exact lookup, insert and delete, all average O(1). No order. Use it by default when the question is membership or association.",
        "**Sorted map / balanced BST** — the same operations at O(log n), plus floor, ceiling, range and in-order traversal. Use it when order queries appear, or when a guaranteed worst case matters more than a fast average.",
        "**Sorted array with binary search** — O(log n) lookup, O(n) insert. Use it when the data is built once and queried many times, which is more common than it sounds. It is also the most cache-friendly of the three by a wide margin.",
        "**Set rather than map** — when you only need presence. Saying `set` instead of `map` communicates that no value is carried, and it is a real readability signal in an interview.",
        "A useful rule: if you find yourself sorting the keys of a hash map, you probably wanted a sorted structure from the start. If you find yourself doing that inside a loop, you definitely did.",
      ],
      pitfalls: [
        {
          title: "Reaching for a hash map when the input is already sorted",
          body: "Sorted input often makes two pointers or binary search available at O(1) extra space. A map still works and still passes — and quietly discards the property that made a better solution possible. Always check whether the input is sorted before choosing.",
        },
        {
          title: "Using a map where a set would do",
          body: "Storing a dummy value to fake a set works and reads badly. Every language has a set; using it says exactly what you mean.",
        },
        {
          title: "Sorting inside the loop",
          body: "Sorting a map's keys once is fine. Sorting them per query turns an O(1) structure into an O(n log n) one. If queries are interleaved with updates, that is precisely what a sorted map is for.",
        },
      ],
    },
    {
      id: "the-sheet",
      heading: "The sheet",
      body: [
        "The problems where hashing is not an ingredient but the entire idea. Work down the list; each names the specific move it is drilling.",
        "**Contains Duplicate** — a set, checked before insert. The smallest possible version of the pattern.",
        "**Valid Anagram** — a tally, or a 26-array. The lower bound on this module.",
        "**Two Sum** — the complement pattern, storing indices. Do it until the check-before-insert ordering is automatic.",
        "**Group Anagrams** — a canonical key. The whole difficulty is choosing it.",
        "**Top K Frequent Elements** — a tally plus a heap or bucket sort. The follow-up is always \"better than sorting all counts?\".",
        "**Longest Consecutive Sequence** — a set, plus the insight that you only start counting from a number whose predecessor is absent. That single guard is what makes it O(n) rather than O(n²), and it is the most instructive line in this list.",
        "**Subarray Sum Equals K** — prefix sums plus a map. The one from lesson 7, and the most re-used.",
        "**Longest Substring Without Repeating Characters** — a map from character to last index, driving a window. Where hashing and sliding windows meet.",
        "**Isomorphic Strings** and **Word Pattern** — two maps, checked in both directions. Forgetting the second direction is the standard bug.",
        "**LRU Cache** — a hash map for lookup plus a doubly linked list for order. The canonical demonstration that when you need both, you use both.",
        "**First Missing Positive** — the one to finish on. It looks like a hash problem and the O(1)-space solution uses the array itself as the table, which is the idea of hashing without the structure.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When would you choose a TreeMap over a HashMap?",
      answer:
        "When the workload includes order-dependent queries — floor, ceiling, range scans, in-order traversal — or when a guaranteed O(log n) worst case matters more than an average O(1). A hash map cannot answer those at all without enumerating every key.",
    },
    {
      question: "Longest Consecutive Sequence in O(n) — how?",
      answer:
        "Put everything in a set. For each value, only begin counting when `x - 1` is absent, then walk upward while `x + 1` is present. That guard means each run is traversed exactly once, giving O(n) overall despite the nested loop.",
    },
    {
      question: "What structure backs an LRU cache and why?",
      answer:
        "A hash map from key to node for O(1) lookup, plus a doubly linked list for recency order with O(1) move-to-front and eviction from the tail. Neither structure alone can do both — the map has no order and the list has no fast lookup.",
    },
  ],
  takeaways: [
    "A hash map answers exact-key questions and nothing about order",
    "Nearest, next, range and rank queries need a sorted structure",
    "Sorting a map's keys is a sign you wanted a sorted map",
    "Use a set when no value is carried — it says what you mean",
    "Check whether the input is already sorted before reaching for a map",
    "The Longest Consecutive guard is the most instructive line on the sheet",
  ],
  status: "available",
};
