import type { Lesson } from "@/content/types";

export const frequencyCountingLesson: Lesson = {
  id: "dsa-hash-frequency",
  slug: "frequency-counting",
  moduleSlug: "hashing",
  title: "Frequency Counting",
  summary:
    "Count first, decide second. A great many problems that look like they need clever traversal are a one-line tally followed by a trivial question about the tally.",
  estimatedMinutes: 30,
  objectives: [
    "Build a frequency map idiomatically in your language",
    "Recognise problems that reduce to a question about counts",
    "Choose between a map and a fixed-size array of counts",
    "Use counts as a comparable signature for equality",
  ],
  sections: [
    {
      id: "count-first",
      heading: "Count first, decide second",
      body: [
        "A surprising share of array and string problems have the same two-phase shape: build a tally, then ask one easy question about it.",
        "Once the counts exist, \"the first non-repeating character\" is a scan for the first key with count 1. \"Can these letters form a palindrome?\" is a check that at most one count is odd. \"Are these two strings anagrams?\" is an equality test between two tallies. None of these needs a clever traversal — the tally *is* the algorithm.",
        "The reason this works is that all of these questions are invariant to order. The moment a question stops depending on where things are and starts depending on how many there are, counting is the move.",
      ],
      examples: [
        {
          id: "counting-idioms",
          title: "Three ways to say the same thing",
          lang: "python",
          code: `counts = {}
for ch in "mississippi":
    counts[ch] = counts.get(ch, 0) + 1
print(counts)

from collections import Counter
print(Counter("mississippi"))
print(Counter("mississippi").most_common(2))`,
          output: `{'m': 1, 'i': 4, 's': 4, 'p': 2}
Counter({'i': 4, 's': 4, 'p': 2, 'm': 1})
[('i', 4), ('s', 4)]`,
          explanation:
            "`get(key, 0)` is the portable idiom and worth knowing because it exists everywhere: Java's `getOrDefault`, Go's zero-value read, C++'s `operator[]` default-construction. `Counter` is Python's batteries-included version, and `most_common` is a sort under the hood — O(n log n), which matters when the problem says top-k and n is large. Note that the plain dict preserves insertion order (m, i, s, p) while `Counter` prints in descending count order.",
          alternates: [
            {
              lang: "javascript",
              code: `const dict = (ps) => "{" + ps.map(([k, v]) => \`'\${k}': \${v}\`).join(", ") + "}";
const pairs = (ps) => "[" + ps.map(([k, v]) => \`('\${k}', \${v})\`).join(", ") + "]";

// A Map, not an object: it keeps insertion order for every key type.
const counts = new Map();
for (const ch of "mississippi") counts.set(ch, (counts.get(ch) ?? 0) + 1);
console.log(dict([...counts]));

// JavaScript has no Counter. Sorting the same map by count is the whole of it —
// a stable sort, so equal counts stay in first-seen order.
const byCount = [...counts].sort((a, b) => b[1] - a[1]);
console.log(dict(byCount));
console.log(pairs(byCount.slice(0, 2)));`,
              output: `{'m': 1, 'i': 4, 's': 4, 'p': 2}
{'i': 4, 's': 4, 'p': 2, 'm': 1}
[('i', 4), ('s', 4)]`,
            },
            {
              lang: "typescript",
              code: `const dict = (ps: [string, number][]): string => "{" + ps.map(([k, v]) => \`'\${k}': \${v}\`).join(", ") + "}";
const pairs = (ps: [string, number][]): string => "[" + ps.map(([k, v]) => \`('\${k}', \${v})\`).join(", ") + "]";

// A Map, not an object: it keeps insertion order for every key type.
const counts = new Map<string, number>();
for (const ch of "mississippi") counts.set(ch, (counts.get(ch) ?? 0) + 1);
console.log(dict([...counts]));

// TypeScript has no Counter. Sorting the same map by count is the whole of it —
// a stable sort, so equal counts stay in first-seen order.
const byCount = [...counts].sort((a, b) => b[1] - a[1]);
console.log(dict(byCount));
console.log(pairs(byCount.slice(0, 2)));`,
              output: `{'m': 1, 'i': 4, 's': 4, 'p': 2}
{'i': 4, 's': 4, 'p': 2, 'm': 1}
[('i', 4), ('s', 4)]`,
            },
            {
              lang: "java",
              code: `import java.util.*;

public class Main {
    static String dict(List<Map.Entry<Character, Integer>> ps) {
        StringBuilder sb = new StringBuilder("{");
        for (int i = 0; i < ps.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append("'").append(ps.get(i).getKey()).append("': ").append(ps.get(i).getValue());
        }
        return sb.append("}").toString();
    }

    static String pairs(List<Map.Entry<Character, Integer>> ps) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < ps.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append("('").append(ps.get(i).getKey()).append("', ")
              .append(ps.get(i).getValue()).append(")");
        }
        return sb.append("]").toString();
    }

    public static void main(String[] args) {
        // LinkedHashMap, not HashMap: Python's dict iterates in insertion order.
        Map<Character, Integer> counts = new LinkedHashMap<>();
        for (char ch : "mississippi".toCharArray()) counts.merge(ch, 1, Integer::sum);
        System.out.println(dict(new ArrayList<>(counts.entrySet())));

        // Java has no Counter. Sorting the same map by count is the whole of it —
        // List.sort is stable, so equal counts stay in first-seen order.
        List<Map.Entry<Character, Integer>> byCount = new ArrayList<>(counts.entrySet());
        byCount.sort((a, b) -> b.getValue() - a.getValue());
        System.out.println(dict(byCount));
        System.out.println(pairs(byCount.subList(0, 2)));
    }
}`,
              output: `{'m': 1, 'i': 4, 's': 4, 'p': 2}
{'i': 4, 's': 4, 'p': 2, 'm': 1}
[('i', 4), ('s', 4)]`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <iostream>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>
using namespace std;

string dict(const vector<pair<char, int>>& ps) {
    string out = "{";
    for (size_t i = 0; i < ps.size(); i++) {
        if (i) out += ", ";
        out += string("'") + ps[i].first + "': " + to_string(ps[i].second);
    }
    return out + "}";
}

string pairsOf(const vector<pair<char, int>>& ps) {
    string out = "[";
    for (size_t i = 0; i < ps.size(); i++) {
        if (i) out += ", ";
        out += string("('") + ps[i].first + "', " + to_string(ps[i].second) + ")";
    }
    return out + "]";
}

int main() {
    // Neither map nor unordered_map iterates in insertion order, so the counts
    // are kept as a vector in first-seen order.
    unordered_map<char, int> index;
    vector<pair<char, int>> counts;
    for (char ch : string("mississippi")) {
        auto it = index.find(ch);
        if (it == index.end()) {
            index[ch] = (int)counts.size();
            counts.push_back({ch, 1});
        } else {
            counts[it->second].second++;
        }
    }
    cout << dict(counts) << "\\n";

    // C++ has no Counter. Sorting the same counts is the whole of it —
    // stable_sort, so equal counts stay in first-seen order.
    vector<pair<char, int>> byCount = counts;
    stable_sort(byCount.begin(), byCount.end(),
                [](const auto& a, const auto& b) { return a.second > b.second; });
    cout << dict(byCount) << "\\n";
    cout << pairsOf({byCount.begin(), byCount.begin() + 2}) << "\\n";
}`,
              output: `{'m': 1, 'i': 4, 's': 4, 'p': 2}
{'i': 4, 's': 4, 'p': 2, 'm': 1}
[('i', 4), ('s', 4)]`,
            },
            {
              lang: "rust",
              code: `use std::collections::HashMap;

fn dict(ps: &[(char, i32)]) -> String {
    let parts: Vec<String> = ps.iter().map(|(k, v)| format!("'{}': {}", k, v)).collect();
    format!("{{{}}}", parts.join(", "))
}

fn pairs_of(ps: &[(char, i32)]) -> String {
    let parts: Vec<String> = ps.iter().map(|(k, v)| format!("('{}', {})", k, v)).collect();
    format!("[{}]", parts.join(", "))
}

fn main() {
    // HashMap does not iterate in insertion order, so the counts are kept as a
    // Vec in first-seen order.
    let mut index: HashMap<char, usize> = HashMap::new();
    let mut counts: Vec<(char, i32)> = Vec::new();
    for ch in "mississippi".chars() {
        match index.get(&ch) {
            Some(&i) => counts[i].1 += 1,
            None => {
                index.insert(ch, counts.len());
                counts.push((ch, 1));
            }
        }
    }
    println!("{}", dict(&counts));

    // Rust has no Counter. Sorting the same counts is the whole of it —
    // sort_by is stable, so equal counts stay in first-seen order.
    let mut by_count = counts.clone();
    by_count.sort_by(|a, b| b.1.cmp(&a.1));
    println!("{}", dict(&by_count));
    println!("{}", pairs_of(&by_count[..2]));
}`,
              output: `{'m': 1, 'i': 4, 's': 4, 'p': 2}
{'i': 4, 's': 4, 'p': 2, 'm': 1}
[('i', 4), ('s', 4)]`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"sort"
	"strings"
)

type count struct {
	ch rune
	n  int
}

func dict(ps []count) string {
	parts := make([]string, len(ps))
	for i, p := range ps {
		parts[i] = fmt.Sprintf("'%c': %d", p.ch, p.n)
	}
	return "{" + strings.Join(parts, ", ") + "}"
}

func pairsOf(ps []count) string {
	parts := make([]string, len(ps))
	for i, p := range ps {
		parts[i] = fmt.Sprintf("('%c', %d)", p.ch, p.n)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func main() {
	// Go randomises map iteration order, so the counts are kept as a slice in
	// first-seen order.
	index := map[rune]int{}
	var counts []count
	for _, ch := range "mississippi" {
		if i, seen := index[ch]; seen {
			counts[i].n++
		} else {
			index[ch] = len(counts)
			counts = append(counts, count{ch, 1})
		}
	}
	fmt.Println(dict(counts))

	// Go has no Counter. Sorting the same counts is the whole of it —
	// SliceStable, so equal counts stay in first-seen order.
	byCount := append([]count(nil), counts...)
	sort.SliceStable(byCount, func(i, j int) bool { return byCount[i].n > byCount[j].n })
	fmt.Println(dict(byCount))
	fmt.Println(pairsOf(byCount[:2]))
}`,
              output: `{'m': 1, 'i': 4, 's': 4, 'p': 2}
{'i': 4, 's': 4, 'p': 2, 'm': 1}
[('i', 4), ('s', 4)]`,
            },
          ],
        },
      ],
      visual: {
        id: "hash-freq",
        kind: "hash-table",
        title: "Letters accumulating in a table",
        words: ["m", "i", "s", "p"],
      },
    },
    {
      id: "map-or-array",
      heading: "A map, or an array of counts?",
      body: [
        "When keys are drawn from a small known range — lowercase letters, digits, bytes, ASCII — a plain array indexed by `ch - 'a'` beats a hash map on every axis. No hashing, no boxing, contiguous memory, and the counts come back in sorted key order for free.",
        "`int[] counts = new int[26]` is the standard move for lowercase-letter problems, and interviewers notice it. It is not premature optimisation; it is choosing the structure that matches the key space.",
        "Use a map when the key space is large, unknown, or not an integer — arbitrary strings, coordinate pairs, objects. Use an array when the problem says \"lowercase English letters\", which it very often does.",
        "One caution: the array approach quietly assumes the alphabet. The moment the input can contain uppercase, Unicode, or spaces, `ch - 'a'` indexes out of bounds or silently corrupts a neighbouring count. Read the constraints before choosing.",
      ],
    },
    {
      id: "counts-as-signature",
      heading: "Counts as a signature",
      body: [
        "Two strings are anagrams exactly when their tallies are equal. That makes the tally a **canonical form**: a value that is identical for everything in the same class and different for everything outside it.",
        "This is the bridge to the next lesson. Once a tally can stand in for a whole equivalence class, it can be used as a *map key* — and grouping falls out immediately.",
        "In practice you rarely hash the tally itself. Either compare counts directly, or turn the tally into something hashable — a sorted string, a tuple of 26 counts, a `frozenset` of items. Which one depends on what your language will let you use as a key, and cheaply.",
        "The subtraction trick is worth having as a reflex: rather than build two tallies and compare, build one, decrement with the second string, and check everything landed on zero. One map instead of two, and an early exit the moment a count goes negative.",
      ],
      pitfalls: [
        {
          title: "Forgetting the length check",
          body: "Two strings of different lengths cannot be anagrams, and comparing tallies without checking length first is a bug when you use the decrement trick and stop early. One `if len(s) != len(t): return False` at the top removes a whole class of edge cases.",
        },
        {
          title: "Sorting to compare counts",
          body: "Sorting both strings and comparing is O(n log n) and perfectly correct — it is the answer people reach for first. The counting version is O(n). Mention both, then implement the second; the interviewer is usually waiting for exactly that improvement.",
        },
        {
          title: "Using most_common for top-k without noticing the sort",
          body: "`most_common(k)` sorts all distinct keys: O(d log d) for d distinct values. When d is large and k is small, a heap of size k is O(d log k), and bucket sort by count is O(d). For Top K Frequent Elements this is precisely the follow-up question.",
        },
        {
          title: "Counting when order actually matters",
          body: "A tally destroys position. Problems about substrings, subarrays or adjacency need the count to be maintained incrementally over a window rather than computed once — which is the sliding-window module, not this one.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you check whether two strings are anagrams?",
      answer:
        "Compare character tallies. Length check first, then count one string up and the other down in a single array of 26 when the input is lowercase letters, and verify every count is zero. O(n) time, O(1) space. Sorting both is the O(n log n) alternative worth naming before you improve on it.",
    },
    {
      question: "When would you use an array instead of a hash map for counting?",
      answer:
        "When the key space is small, known and integer-like — letters, digits, bytes. It avoids hashing entirely, is contiguous in memory, and yields keys in sorted order. The risk is inputs outside the assumed alphabet, so it depends on the stated constraints.",
    },
    {
      question: "Top K frequent elements, better than sorting all counts?",
      answer:
        "Yes. A min-heap of size k gives O(d log k) for d distinct values. Better still, bucket by count — index i holds the values appearing i times — and read down from the top for O(d), since counts are bounded by n.",
    },
  ],
  takeaways: [
    "Count first, decide second — the tally is often the whole algorithm",
    "Counting suits questions invariant to order",
    "A fixed array beats a map when keys are a small known range",
    "A tally is a canonical form, which makes it a grouping key",
    "Decrement with the second string instead of building two tallies",
    "most_common sorts; a heap or bucket sort is better for top-k",
  ],
  status: "available",
};
