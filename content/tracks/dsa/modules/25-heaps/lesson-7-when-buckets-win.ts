import type { Lesson } from "@/content/types";

export const bucketsLesson: Lesson = {
  id: "dsa-heap-buckets",
  slug: "when-counting-beats-the-heap",
  moduleSlug: "heaps-and-priority-queues",
  title: "When Counting Beats the Heap Outright",
  summary:
    "A heap is a comparison structure, and comparison has a log in it. When the key is a small integer you can index instead of compare, and the log disappears — which is why the canonical top-k-frequent problem is not really a heap problem.",
  estimatedMinutes: 30,
  objectives: [
    "Recognise when a key can be used as an array index rather than compared",
    "Solve top-k-frequent in O(n) with counting and buckets",
    "State the O(n + range) cost and the two ways it goes wrong",
    "Choose between sorting, a heap and buckets on the properties of the key",
  ],
  sections: [
    {
      id: "the-log-is-optional",
      heading: "The log comes from comparing",
      body: [
        "Every bound in this module so far has a log in it, and the log has one source: a comparison-based structure can only learn about an element by comparing it with another, and information-theoretically that costs log.",
        "Counting sidesteps the whole argument. If a key is a non-negative integer smaller than some manageable bound, you can use it as an *index* \u2014 and an index is O(1) and learns everything at once. No comparison happens, so no log appears.",
        "The classic case is **top k frequent**. It is taught as a heap problem, and it should not be: the thing being ranked is a count, a count cannot exceed the number of items, so counts index an array of size n + 1. Bucket every key under its count, walk down from the top bucket, stop after k. Linear, and no heap.",
        "Recognising this is a habit worth building. When a problem ranks things by a bounded integer \u2014 a count, an age, a score out of 100, a priority from a fixed small set \u2014 reach for an array before reaching for a heap.",
      ],
      examples: [
        {
          id: "top-k-frequent",
          title: "The same answer with no comparisons",
          lang: "python",
          code: `import heapq
from collections import Counter

words = ["the", "cat", "sat", "on", "the", "mat", "the", "cat", "ran",
         "the", "dog", "sat", "the", "cat"]
k = 3

counts = Counter(words)
print("counts:", " ".join(f"{w}={c}" for w, c in sorted(counts.items())))
print()

heap = []
for word, c in sorted(counts.items()):
    heapq.heappush(heap, (c, word))
    if len(heap) > k:
        heapq.heappop(heap)
by_heap = sorted(heap, reverse=True)
print("by heap, O(m log k) over m distinct words:")
for c, w in by_heap:
    print(f"  {w:<5} {c}")

print()
buckets = [[] for _ in range(len(words) + 1)]
for word, c in sorted(counts.items()):
    buckets[c].append(word)
by_bucket = []
for c in range(len(buckets) - 1, 0, -1):
    for w in buckets[c]:
        by_bucket.append((c, w))
        if len(by_bucket) == k:
            break
    if len(by_bucket) == k:
        break
print("by buckets, O(n) with no comparisons at all:")
for c, w in by_bucket:
    print(f"  {w:<5} {c}")

print()
print("same answer:", "yes" if by_heap == by_bucket else "no")
print("(the top three counts here are distinct. Were two of them tied, both")
print(" answers would still be correct and they would not have to match —")
print(" a tiebreak has to go into the key if the caller needs a fixed order.)")
print()
print("a count is bounded by n, so it can index an array. Bucketing by count")
print("and walking down from the top is linear — and there is no log anywhere.")`,
          output: `counts: cat=3 dog=1 mat=1 on=1 ran=1 sat=2 the=5

by heap, O(m log k) over m distinct words:
  the   5
  cat   3
  sat   2

by buckets, O(n) with no comparisons at all:
  the   5
  cat   3
  sat   2

same answer: yes
(the top three counts here are distinct. Were two of them tied, both
 answers would still be correct and they would not have to match —
 a tiebreak has to go into the key if the caller needs a fixed order.)

a count is bounded by n, so it can index an array. Bucketing by count
and walking down from the top is linear — and there is no log anywhere.`,
          explanation:
            "The heap version is the one everybody writes, and it is O(m log k) over the m distinct keys. The bucket version notices something the heap cannot use: a count is bounded by the number of items, so it is a valid array index. Bucketing keys by their count and walking down from the highest bucket is O(n), with no comparisons and no log. The parenthetical about ties is not a footnote \u2014 with a tie at the k-th place both methods are correct and they need not agree, so a caller who requires a fixed order has to put the tiebreak in the key.",
          alternates: [
            {
              lang: "javascript",
              code: `const words = ["the", "cat", "sat", "on", "the", "mat", "the", "cat", "ran",
  "the", "dog", "sat", "the", "cat"];
const k = 3;

const counts = new Map();
for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
const pairs = [...counts.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
console.log("counts:", pairs.map(([w, c]) => \`\${w}=\${c}\`).join(" "));
console.log();

// A min-heap of [count, word], capped at k.
const heap = [];
const less = (x, y) => (x[0] !== y[0] ? x[0] < y[0] : x[1] < y[1]);
function push(v) {
  heap.push(v);
  let i = heap.length - 1;
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (!less(heap[i], heap[p])) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
}
function pop() {
  const top = heap[0];
  const last = heap.pop();
  if (heap.length > 0) {
    heap[0] = last;
    let i = 0;
    for (;;) {
      let m = i;
      for (const c of [2 * i + 1, 2 * i + 2]) {
        if (c < heap.length && less(heap[c], heap[m])) m = c;
      }
      if (m === i) break;
      [heap[i], heap[m]] = [heap[m], heap[i]];
      i = m;
    }
  }
  return top;
}
for (const [word, c] of pairs) {
  push([c, word]);
  if (heap.length > k) pop();
}
const byHeap = [...heap].sort((a, b) => (b[0] !== a[0] ? b[0] - a[0] : (b[1] < a[1] ? -1 : 1)));
console.log("by heap, O(m log k) over m distinct words:");
for (const [c, w] of byHeap) console.log(\`  \${w.padEnd(5)} \${c}\`);

console.log();
const buckets = Array.from({ length: words.length + 1 }, () => []);
for (const [word, c] of pairs) buckets[c].push(word);
const byBucket = [];
outer:
for (let c = buckets.length - 1; c > 0; c--) {
  for (const w of buckets[c]) {
    byBucket.push([c, w]);
    if (byBucket.length === k) break outer;
  }
}
console.log("by buckets, O(n) with no comparisons at all:");
for (const [c, w] of byBucket) console.log(\`  \${w.padEnd(5)} \${c}\`);

console.log();
const same = byHeap.length === byBucket.length
  && byHeap.every((e, i) => e[0] === byBucket[i][0] && e[1] === byBucket[i][1]);
console.log("same answer:", same ? "yes" : "no");
console.log("(the top three counts here are distinct. Were two of them tied, both");
console.log(" answers would still be correct and they would not have to match —");
console.log(" a tiebreak has to go into the key if the caller needs a fixed order.)");
console.log();
console.log("a count is bounded by n, so it can index an array. Bucketing by count");
console.log("and walking down from the top is linear — and there is no log anywhere.");`,
            },
            {
              lang: "typescript",
              code: `const words: string[] = ["the", "cat", "sat", "on", "the", "mat", "the", "cat", "ran",
  "the", "dog", "sat", "the", "cat"];
const k = 3;

const counts = new Map<string, number>();
for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
const pairs: [string, number][] = [...counts.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
console.log("counts:", pairs.map(([w, c]) => \`\${w}=\${c}\`).join(" "));
console.log();

// A min-heap of [count, word], capped at k.
const heap: [number, string][] = [];
const less = (x: [number, string], y: [number, string]): boolean =>
  (x[0] !== y[0] ? x[0] < y[0] : x[1] < y[1]);
function push(v: [number, string]): void {
  heap.push(v);
  let i = heap.length - 1;
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (!less(heap[i], heap[p])) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
}
function pop(): [number, string] {
  const top = heap[0];
  const last = heap.pop() as [number, string];
  if (heap.length > 0) {
    heap[0] = last;
    let i = 0;
    for (;;) {
      let m = i;
      for (const c of [2 * i + 1, 2 * i + 2]) {
        if (c < heap.length && less(heap[c], heap[m])) m = c;
      }
      if (m === i) break;
      [heap[i], heap[m]] = [heap[m], heap[i]];
      i = m;
    }
  }
  return top;
}
for (const [word, c] of pairs) {
  push([c, word]);
  if (heap.length > k) pop();
}
const byHeap: [number, string][] = [...heap].sort((a, b) => (b[0] !== a[0] ? b[0] - a[0] : (b[1] < a[1] ? -1 : 1)));
console.log("by heap, O(m log k) over m distinct words:");
for (const [c, w] of byHeap) console.log(\`  \${w.padEnd(5)} \${c}\`);

console.log();
const buckets: string[][] = Array.from({ length: words.length + 1 }, () => []);
for (const [word, c] of pairs) buckets[c].push(word);
const byBucket: [number, string][] = [];
outer:
for (let c = buckets.length - 1; c > 0; c--) {
  for (const w of buckets[c]) {
    byBucket.push([c, w]);
    if (byBucket.length === k) break outer;
  }
}
console.log("by buckets, O(n) with no comparisons at all:");
for (const [c, w] of byBucket) console.log(\`  \${w.padEnd(5)} \${c}\`);

console.log();
const same = byHeap.length === byBucket.length
  && byHeap.every((e: [number, string], i: number) => e[0] === byBucket[i][0] && e[1] === byBucket[i][1]);
console.log("same answer:", same ? "yes" : "no");
console.log("(the top three counts here are distinct. Were two of them tied, both");
console.log(" answers would still be correct and they would not have to match —");
console.log(" a tiebreak has to go into the key if the caller needs a fixed order.)");
console.log();
console.log("a count is bounded by n, so it can index an array. Bucketing by count");
console.log("and walking down from the top is linear — and there is no log anywhere.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.TreeMap;

public class Main {
    record Entry(int count, String word) {}

    public static void main(String[] args) {
        String[] words = {"the", "cat", "sat", "on", "the", "mat", "the", "cat", "ran",
                          "the", "dog", "sat", "the", "cat"};
        int k = 3;

        Map<String, Integer> counts = new TreeMap<>();   // ordered, so the walk is deterministic
        for (String w : words) counts.merge(w, 1, Integer::sum);
        StringBuilder shown = new StringBuilder();
        for (Map.Entry<String, Integer> e : counts.entrySet()) {
            shown.append(shown.length() > 0 ? " " : "").append(e.getKey()).append("=").append(e.getValue());
        }
        System.out.println("counts: " + shown);
        System.out.println();

        PriorityQueue<Entry> heap = new PriorityQueue<>(
                Comparator.comparingInt(Entry::count).thenComparing(Entry::word));
        for (Map.Entry<String, Integer> e : counts.entrySet()) {
            heap.add(new Entry(e.getValue(), e.getKey()));
            if (heap.size() > k) heap.poll();
        }
        List<Entry> byHeap = new ArrayList<>(heap);
        byHeap.sort(Comparator.comparingInt(Entry::count).thenComparing(Entry::word).reversed());
        System.out.println("by heap, O(m log k) over m distinct words:");
        for (Entry e : byHeap) System.out.printf("  %-5s %d%n", e.word(), e.count());

        System.out.println();
        List<List<String>> buckets = new ArrayList<>();
        for (int i = 0; i <= words.length; i++) buckets.add(new ArrayList<>());
        for (Map.Entry<String, Integer> e : counts.entrySet()) buckets.get(e.getValue()).add(e.getKey());
        List<Entry> byBucket = new ArrayList<>();
        outer:
        for (int c = buckets.size() - 1; c > 0; c--) {
            for (String w : buckets.get(c)) {
                byBucket.add(new Entry(c, w));
                if (byBucket.size() == k) break outer;
            }
        }
        System.out.println("by buckets, O(n) with no comparisons at all:");
        for (Entry e : byBucket) System.out.printf("  %-5s %d%n", e.word(), e.count());

        System.out.println();
        System.out.println("same answer: " + (byHeap.equals(byBucket) ? "yes" : "no"));
        System.out.println("(the top three counts here are distinct. Were two of them tied, both");
        System.out.println(" answers would still be correct and they would not have to match —");
        System.out.println(" a tiebreak has to go into the key if the caller needs a fixed order.)");
        System.out.println();
        System.out.println("a count is bounded by n, so it can index an array. Bucketing by count");
        System.out.println("and walking down from the top is linear — and there is no log anywhere.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <functional>
#include <iomanip>
#include <iostream>
#include <map>
#include <queue>
#include <string>
#include <utility>
#include <vector>

using Entry = std::pair<int, std::string>;   // (count, word)

int main() {
    const std::vector<std::string> words = {
        "the", "cat", "sat", "on", "the", "mat", "the", "cat", "ran",
        "the", "dog", "sat", "the", "cat"};
    const int k = 3;

    std::map<std::string, int> counts;        // ordered, so the walk is deterministic
    for (const auto& w : words) counts[w] += 1;
    std::string shown;
    for (const auto& [w, c] : counts) {
        if (!shown.empty()) shown += " ";
        shown += w + "=" + std::to_string(c);
    }
    std::cout << "counts: " << shown << "\\n\\n";

    std::priority_queue<Entry, std::vector<Entry>, std::greater<Entry>> heap;
    for (const auto& [w, c] : counts) {
        heap.push({c, w});
        if (static_cast<int>(heap.size()) > k) heap.pop();
    }
    std::vector<Entry> by_heap;
    while (!heap.empty()) {
        by_heap.push_back(heap.top());
        heap.pop();
    }
    std::sort(by_heap.begin(), by_heap.end(), std::greater<Entry>());
    std::cout << "by heap, O(m log k) over m distinct words:\\n";
    for (const auto& [c, w] : by_heap) {
        std::cout << "  " << std::left << std::setw(5) << w << ' ' << c << '\\n';
    }

    std::cout << '\\n';
    std::vector<std::vector<std::string>> buckets(words.size() + 1);
    for (const auto& [w, c] : counts) buckets[static_cast<size_t>(c)].push_back(w);
    std::vector<Entry> by_bucket;
    for (int c = static_cast<int>(buckets.size()) - 1; c > 0 && static_cast<int>(by_bucket.size()) < k; --c) {
        for (const auto& w : buckets[static_cast<size_t>(c)]) {
            by_bucket.push_back({c, w});
            if (static_cast<int>(by_bucket.size()) == k) break;
        }
    }
    std::cout << "by buckets, O(n) with no comparisons at all:\\n";
    for (const auto& [c, w] : by_bucket) {
        std::cout << "  " << std::left << std::setw(5) << w << ' ' << c << '\\n';
    }

    std::cout << "\\nsame answer: " << (by_heap == by_bucket ? "yes" : "no") << '\\n';
    std::cout << "(the top three counts here are distinct. Were two of them tied, both\\n";
    std::cout << " answers would still be correct and they would not have to match —\\n";
    std::cout << " a tiebreak has to go into the key if the caller needs a fixed order.)\\n\\n";
    std::cout << "a count is bounded by n, so it can index an array. Bucketing by count\\n";
    std::cout << "and walking down from the top is linear — and there is no log anywhere.\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::cmp::Reverse;
use std::collections::{BTreeMap, BinaryHeap};

fn main() {
    let words = ["the", "cat", "sat", "on", "the", "mat", "the", "cat", "ran",
                 "the", "dog", "sat", "the", "cat"];
    let k = 3usize;

    let mut counts: BTreeMap<&str, i32> = BTreeMap::new(); // ordered, so the walk is deterministic
    for w in words {
        *counts.entry(w).or_insert(0) += 1;
    }
    let shown: Vec<String> = counts.iter().map(|(w, c)| format!("{}={}", w, c)).collect();
    println!("counts: {}", shown.join(" "));
    println!();

    let mut heap: BinaryHeap<Reverse<(i32, &str)>> = BinaryHeap::new();
    for (&w, &c) in &counts {
        heap.push(Reverse((c, w)));
        if heap.len() > k {
            heap.pop();
        }
    }
    let mut by_heap: Vec<(i32, &str)> = heap.iter().map(|Reverse(e)| *e).collect();
    by_heap.sort_by(|a, b| b.cmp(a));
    println!("by heap, O(m log k) over m distinct words:");
    for (c, w) in &by_heap {
        println!("  {:<5} {}", w, c);
    }

    println!();
    let mut buckets: Vec<Vec<&str>> = vec![Vec::new(); words.len() + 1];
    for (&w, &c) in &counts {
        buckets[c as usize].push(w);
    }
    let mut by_bucket: Vec<(i32, &str)> = Vec::new();
    'outer: for c in (1..buckets.len()).rev() {
        for &w in &buckets[c] {
            by_bucket.push((c as i32, w));
            if by_bucket.len() == k {
                break 'outer;
            }
        }
    }
    println!("by buckets, O(n) with no comparisons at all:");
    for (c, w) in &by_bucket {
        println!("  {:<5} {}", w, c);
    }

    println!();
    println!("same answer: {}", if by_heap == by_bucket { "yes" } else { "no" });
    println!("(the top three counts here are distinct. Were two of them tied, both");
    println!(" answers would still be correct and they would not have to match —");
    println!(" a tiebreak has to go into the key if the caller needs a fixed order.)");
    println!();
    println!("a count is bounded by n, so it can index an array. Bucketing by count");
    println!("and walking down from the top is linear — and there is no log anywhere.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"container/heap"
	"fmt"
	"sort"
	"strconv"
	"strings"
)

type entry struct {
	count int
	word  string
}

type entries []entry

func (e entries) Len() int { return len(e) }
func (e entries) Less(i, j int) bool {
	if e[i].count != e[j].count {
		return e[i].count < e[j].count
	}
	return e[i].word < e[j].word
}
func (e entries) Swap(i, j int)       { e[i], e[j] = e[j], e[i] }
func (e *entries) Push(x interface{}) { *e = append(*e, x.(entry)) }
func (e *entries) Pop() interface{} {
	old := *e
	n := len(old)
	last := old[n-1]
	*e = old[:n-1]
	return last
}

func main() {
	words := []string{"the", "cat", "sat", "on", "the", "mat", "the", "cat", "ran",
		"the", "dog", "sat", "the", "cat"}
	k := 3

	counts := map[string]int{}
	for _, w := range words {
		counts[w]++
	}
	// Go randomises map iteration, so the keys are sorted before anything reads them.
	keys := make([]string, 0, len(counts))
	for w := range counts {
		keys = append(keys, w)
	}
	sort.Strings(keys)
	shown := make([]string, len(keys))
	for i, w := range keys {
		shown[i] = w + "=" + strconv.Itoa(counts[w])
	}
	fmt.Println("counts:", strings.Join(shown, " "))
	fmt.Println()

	h := &entries{}
	heap.Init(h)
	for _, w := range keys {
		heap.Push(h, entry{counts[w], w})
		if h.Len() > k {
			heap.Pop(h)
		}
	}
	byHeap := append([]entry(nil), (*h)...)
	sort.Slice(byHeap, func(i, j int) bool {
		if byHeap[i].count != byHeap[j].count {
			return byHeap[i].count > byHeap[j].count
		}
		return byHeap[i].word > byHeap[j].word
	})
	fmt.Println("by heap, O(m log k) over m distinct words:")
	for _, e := range byHeap {
		fmt.Printf("  %-5s %d\\n", e.word, e.count)
	}

	fmt.Println()
	buckets := make([][]string, len(words)+1)
	for _, w := range keys {
		buckets[counts[w]] = append(buckets[counts[w]], w)
	}
	var byBucket []entry
outer:
	for c := len(buckets) - 1; c > 0; c-- {
		for _, w := range buckets[c] {
			byBucket = append(byBucket, entry{c, w})
			if len(byBucket) == k {
				break outer
			}
		}
	}
	fmt.Println("by buckets, O(n) with no comparisons at all:")
	for _, e := range byBucket {
		fmt.Printf("  %-5s %d\\n", e.word, e.count)
	}

	fmt.Println()
	same := "yes"
	for i := range byHeap {
		if byHeap[i] != byBucket[i] {
			same = "no"
			break
		}
	}
	fmt.Println("same answer:", same)
	fmt.Println("(the top three counts here are distinct. Were two of them tied, both")
	fmt.Println(" answers would still be correct and they would not have to match —")
	fmt.Println(" a tiebreak has to go into the key if the caller needs a fixed order.)")
	fmt.Println()
	fmt.Println("a count is bounded by n, so it can index an array. Bucketing by count")
	fmt.Println("and walking down from the top is linear — and there is no log anywhere.")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "what-it-costs",
      heading: "O(n + range), and both terms matter",
      body: [
        "The cost of bucketing is the number of items plus the number of buckets, and the second term is the one that decides whether this is brilliant or absurd.",
        "**When the range is comparable to n** \u2014 counts, ages, small scores \u2014 the total is linear and nothing beats it.",
        "**When the range is enormous** the buckets dominate: sorting a million 32-bit integers by bucketing needs four billion buckets to save a factor of 20 in comparisons. Radix sort is the repair \u2014 bucket by one digit at a time so the range per pass is 10 or 256, at the cost of several passes.",
        "**When the key is not an integer at all** \u2014 a float, a string ordering, a user-supplied comparator \u2014 there is no index to compute and the technique simply does not apply.",
        "This is also the honest boundary of the trick. Counting sort, bucket sort and radix sort are not general-purpose sorts that the textbooks unfairly ignore; they are specialised tools with a precondition, and the precondition is the first thing to check.",
      ],
      examples: [
        {
          id: "range-decides",
          title: "The range of the key, not the size of the input",
          lang: "python",
          code: `import math

print("the choice is about the range of the key, not the size of the input")
print()
print(f"{'key range':>26} {'buckets cost':>14} {'heap cost':>18} {'pick'}")
print("-" * 74)
n = 1_000_000
k = 10
for label, spread in [
    ("counts in a 1e6 stream", 1_000_000),
    ("ages, 0-120", 120),
    ("scores, 0-100", 100),
    ("32-bit ids", 2 ** 32),
    ("float distances", 0),
]:
    heap_cost = n * math.log2(k)
    if spread == 0:
        print(f"{label:>26} {'not possible':>14} {heap_cost:>18,.0f} heap")
        continue
    bucket_cost = n + spread
    pick = "buckets" if bucket_cost < heap_cost else "heap"
    print(f"{label:>26} {bucket_cost:>14,} {heap_cost:>18,.0f} {pick}")

print()
print("buckets cost O(n + range). That is linear when the range is comparable")
print("to n, and catastrophic when it is not — 4 billion buckets to sort a")
print("million ids, and no buckets at all for a key that is not an integer.")`,
          output: `the choice is about the range of the key, not the size of the input

                 key range   buckets cost          heap cost pick
--------------------------------------------------------------------------
    counts in a 1e6 stream      2,000,000          3,321,928 buckets
               ages, 0-120      1,000,120          3,321,928 buckets
             scores, 0-100      1,000,100          3,321,928 buckets
                32-bit ids  4,295,967,296          3,321,928 heap
           float distances   not possible          3,321,928 heap

buckets cost O(n + range). That is linear when the range is comparable
to n, and catastrophic when it is not — 4 billion buckets to sort a
million ids, and no buckets at all for a key that is not an integer.`,
          explanation:
            "Bucketing costs O(n + range) and that second term is the whole story. When the range is comparable to n \u2014 counts, ages, percentage scores, small enumerations \u2014 it is linear and beats anything comparison-based. When the range is 2\u00b3\u00b2 it is four billion buckets to sort a million values, and when the key is a float or an arbitrary object there is no bucket index at all. The mistake worth avoiding is reading *O(n) beats O(n log k)* off the page without checking which n the first one means.",
          alternates: [
            {
              lang: "javascript",
              code: `const pad = (s, w) => String(s).padStart(w);
const group = (n) => String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");

console.log("the choice is about the range of the key, not the size of the input");
console.log();
console.log(\`\${pad("key range", 26)} \${pad("buckets cost", 14)} \${pad("heap cost", 18)} pick\`);
console.log("-".repeat(74));
const n = 1000000;
const k = 10;
const cases = [
  ["counts in a 1e6 stream", 1000000],
  ["ages, 0-120", 120],
  ["scores, 0-100", 100],
  ["32-bit ids", 2 ** 32],
  ["float distances", 0],
];
for (const [label, spread] of cases) {
  const heapCost = n * Math.log2(k);
  if (spread === 0) {
    console.log(\`\${pad(label, 26)} \${pad("not possible", 14)} \${pad(group(Math.round(heapCost)), 18)} heap\`);
    continue;
  }
  const bucketCost = n + spread;
  const pick = bucketCost < heapCost ? "buckets" : "heap";
  console.log(\`\${pad(label, 26)} \${pad(group(bucketCost), 14)} \${pad(group(Math.round(heapCost)), 18)} \${pick}\`);
}

console.log();
console.log("buckets cost O(n + range). That is linear when the range is comparable");
console.log("to n, and catastrophic when it is not — 4 billion buckets to sort a");
console.log("million ids, and no buckets at all for a key that is not an integer.");`,
            },
            {
              lang: "typescript",
              code: `const pad = (s: string | number, w: number): string => String(s).padStart(w);
const group = (n: number): string => String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");

console.log("the choice is about the range of the key, not the size of the input");
console.log();
console.log(\`\${pad("key range", 26)} \${pad("buckets cost", 14)} \${pad("heap cost", 18)} pick\`);
console.log("-".repeat(74));
const n = 1000000;
const k = 10;
const cases: [string, number][] = [
  ["counts in a 1e6 stream", 1000000],
  ["ages, 0-120", 120],
  ["scores, 0-100", 100],
  ["32-bit ids", 2 ** 32],
  ["float distances", 0],
];
for (const [label, spread] of cases) {
  const heapCost = n * Math.log2(k);
  if (spread === 0) {
    console.log(\`\${pad(label, 26)} \${pad("not possible", 14)} \${pad(group(Math.round(heapCost)), 18)} heap\`);
    continue;
  }
  const bucketCost = n + spread;
  const pick = bucketCost < heapCost ? "buckets" : "heap";
  console.log(\`\${pad(label, 26)} \${pad(group(bucketCost), 14)} \${pad(group(Math.round(heapCost)), 18)} \${pick}\`);
}

console.log();
console.log("buckets cost O(n + range). That is linear when the range is comparable");
console.log("to n, and catastrophic when it is not — 4 billion buckets to sort a");
console.log("million ids, and no buckets at all for a key that is not an integer.");`,
            },
            {
              lang: "java",
              code: `public class Main {
    public static void main(String[] args) {
        System.out.println("the choice is about the range of the key, not the size of the input");
        System.out.println();
        System.out.printf("%26s %14s %18s %s%n", "key range", "buckets cost", "heap cost", "pick");
        System.out.println("-".repeat(74));
        long n = 1_000_000;
        long k = 10;
        Object[][] cases = {
            {"counts in a 1e6 stream", 1_000_000L},
            {"ages, 0-120", 120L},
            {"scores, 0-100", 100L},
            {"32-bit ids", 4_294_967_296L},
            {"float distances", 0L},
        };
        for (Object[] c : cases) {
            String label = (String) c[0];
            long spread = (Long) c[1];
            double heapCost = n * (Math.log(k) / Math.log(2));
            if (spread == 0) {
                System.out.printf("%26s %14s %,18.0f heap%n", label, "not possible", heapCost);
                continue;
            }
            long bucketCost = n + spread;
            String pick = bucketCost < heapCost ? "buckets" : "heap";
            System.out.printf("%26s %,14d %,18.0f %s%n", label, bucketCost, heapCost, pick);
        }

        System.out.println();
        System.out.println("buckets cost O(n + range). That is linear when the range is comparable");
        System.out.println("to n, and catastrophic when it is not — 4 billion buckets to sort a");
        System.out.println("million ids, and no buckets at all for a key that is not an integer.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <cmath>
#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

static std::string group(long long n) {
    std::string s = std::to_string(n), out;
    for (size_t i = 0; i < s.size(); ++i) {
        if (i > 0 && (s.size() - i) % 3 == 0) out += ',';
        out += s[i];
    }
    return out;
}

int main() {
    std::cout << "the choice is about the range of the key, not the size of the input\\n\\n";
    std::cout << std::right << std::setw(26) << "key range" << ' ' << std::setw(14) << "buckets cost"
              << ' ' << std::setw(18) << "heap cost" << " pick\\n";
    std::cout << std::string(74, '-') << '\\n';
    const long long n = 1000000, k = 10;
    const std::vector<std::pair<std::string, long long>> cases = {
        {"counts in a 1e6 stream", 1000000LL},
        {"ages, 0-120", 120LL},
        {"scores, 0-100", 100LL},
        {"32-bit ids", 4294967296LL},
        {"float distances", 0LL},
    };
    for (const auto& [label, spread] : cases) {
        double heap_cost = static_cast<double>(n) * std::log2(static_cast<double>(k));
        if (spread == 0) {
            std::cout << std::setw(26) << label << ' ' << std::setw(14) << "not possible"
                      << ' ' << std::setw(18) << group(std::llround(heap_cost)) << " heap\\n";
            continue;
        }
        long long bucket_cost = n + spread;
        const char* pick = static_cast<double>(bucket_cost) < heap_cost ? "buckets" : "heap";
        std::cout << std::setw(26) << label << ' ' << std::setw(14) << group(bucket_cost)
                  << ' ' << std::setw(18) << group(std::llround(heap_cost)) << ' ' << pick << '\\n';
    }

    std::cout << "\\nbuckets cost O(n + range). That is linear when the range is comparable\\n";
    std::cout << "to n, and catastrophic when it is not — 4 billion buckets to sort a\\n";
    std::cout << "million ids, and no buckets at all for a key that is not an integer.\\n";
}`,
            },
            {
              lang: "rust",
              code: `fn group(n: i64) -> String {
    let s = n.to_string();
    let mut out = String::new();
    for (i, c) in s.chars().enumerate() {
        if i > 0 && (s.len() - i) % 3 == 0 {
            out.push(',');
        }
        out.push(c);
    }
    out
}

fn main() {
    println!("the choice is about the range of the key, not the size of the input");
    println!();
    println!("{:>26} {:>14} {:>18} pick", "key range", "buckets cost", "heap cost");
    println!("{}", "-".repeat(74));
    let (n, k) = (1_000_000i64, 10i64);
    let cases: [(&str, i64); 5] = [
        ("counts in a 1e6 stream", 1_000_000),
        ("ages, 0-120", 120),
        ("scores, 0-100", 100),
        ("32-bit ids", 4_294_967_296),
        ("float distances", 0),
    ];
    for (label, spread) in cases {
        let heap_cost = n as f64 * (k as f64).log2();
        if spread == 0 {
            println!("{:>26} {:>14} {:>18} heap", label, "not possible", group(heap_cost.round() as i64));
            continue;
        }
        let bucket_cost = n + spread;
        let pick = if (bucket_cost as f64) < heap_cost { "buckets" } else { "heap" };
        println!("{:>26} {:>14} {:>18} {}", label, group(bucket_cost),
                 group(heap_cost.round() as i64), pick);
    }

    println!();
    println!("buckets cost O(n + range). That is linear when the range is comparable");
    println!("to n, and catastrophic when it is not — 4 billion buckets to sort a");
    println!("million ids, and no buckets at all for a key that is not an integer.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"math"
	"strconv"
	"strings"
)

func group(n int64) string {
	s := strconv.FormatInt(n, 10)
	var out strings.Builder
	for i, c := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			out.WriteByte(',')
		}
		out.WriteRune(c)
	}
	return out.String()
}

func main() {
	fmt.Println("the choice is about the range of the key, not the size of the input")
	fmt.Println()
	fmt.Printf("%26s %14s %18s %s\\n", "key range", "buckets cost", "heap cost", "pick")
	fmt.Println(strings.Repeat("-", 74))
	var n, k int64 = 1000000, 10
	cases := []struct {
		label  string
		spread int64
	}{
		{"counts in a 1e6 stream", 1000000},
		{"ages, 0-120", 120},
		{"scores, 0-100", 100},
		{"32-bit ids", 4294967296},
		{"float distances", 0},
	}
	for _, c := range cases {
		heapCost := float64(n) * math.Log2(float64(k))
		if c.spread == 0 {
			fmt.Printf("%26s %14s %18s heap\\n", c.label, "not possible", group(int64(math.Round(heapCost))))
			continue
		}
		bucketCost := n + c.spread
		pick := "heap"
		if float64(bucketCost) < heapCost {
			pick = "buckets"
		}
		fmt.Printf("%26s %14s %18s %s\\n", c.label, group(bucketCost), group(int64(math.Round(heapCost))), pick)
	}

	fmt.Println()
	fmt.Println("buckets cost O(n + range). That is linear when the range is comparable")
	fmt.Println("to n, and catastrophic when it is not — 4 billion buckets to sort a")
	fmt.Println("million ids, and no buckets at all for a key that is not an integer.")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "choosing",
      heading: "Sort, heap, or buckets",
      body: [
        "Three tools answer the same question and the choice is nearly mechanical.",
        "**Sort** when clarity matters more than the constant factor, when k is close to n, or when you need the full ordering anyway. It is one line and it is rarely the bottleneck.",
        "**Heap** when k is small relative to n, when the data arrives as a stream, or when it does not fit in memory. It is also the only one of the three that gives a *running* answer.",
        "**Buckets** when the ranking key is a bounded non-negative integer. Then it is linear, and the only reason not to use it is that the bound turns out not to be small.",
        "The generality runs the opposite way to the speed, which is the thing to hold on to: the fastest option is the one that assumes the most, so the assumption is what you check first.",
      ],
      examples: [
        {
          id: "three-answers",
          title: "Three answers, one condition",
          lang: "python",
          code: `import heapq

# Same question, three answers, on a deliberately small case so the
# whole thing can be checked by eye.
scores = [88, 91, 88, 70, 91, 91, 55, 70, 88, 91]
k = 2

def show(pairs):
    return " ".join(f"{v}x{c}" for v, c in pairs)


print("scores:", " ".join(str(s) for s in scores))
print(f"the {k} most common:")
print()

counts = {}
for s in scores:
    counts[s] = counts.get(s, 0) + 1
pairs = sorted(counts.items())

full_sort = sorted(pairs, key=lambda p: -p[1])[:k]
print("  sort by count       ", show(full_sort), "  O(m log m)")

heap = []
for value, c in pairs:
    heapq.heappush(heap, (c, value))
    if len(heap) > k:
        heapq.heappop(heap)
by_heap = [(v, c) for c, v in sorted(heap, reverse=True)]
print("  heap capped at k    ", show(by_heap), "  O(m log k)")

buckets = [[] for _ in range(len(scores) + 1)]
for value, c in pairs:
    buckets[c].append(value)
by_bucket = []
for c in range(len(buckets) - 1, 0, -1):
    for v in buckets[c]:
        by_bucket.append((v, c))
print("  buckets by count    ", show(by_bucket[:k]), "  O(n)")

print()
print("all three agree. The bucket version is the fastest and the least")
print("general: it needs the key to be a small non-negative integer, and")
print("here it is, because a count cannot exceed the number of items.")
print()
print("that condition is the whole decision. When it holds, buckets win")
print("outright. When it does not — real numbers, huge ranges, keys that")
print("are only comparable — the heap is what is left.")`,
          output: `scores: 88 91 88 70 91 91 55 70 88 91
the 2 most common:

  sort by count        91x4 88x3   O(m log m)
  heap capped at k     91x4 88x3   O(m log k)
  buckets by count     91x4 88x3   O(n)

all three agree. The bucket version is the fastest and the least
general: it needs the key to be a small non-negative integer, and
here it is, because a count cannot exceed the number of items.

that condition is the whole decision. When it holds, buckets win
outright. When it does not — real numbers, huge ranges, keys that
are only comparable — the heap is what is left.`,
          explanation:
            "All three are correct, and the ordering by speed is the reverse of the ordering by generality. Sorting works on anything comparable. The heap works on anything comparable and saves work when k is small. Buckets need the key to be a small non-negative integer, and when that holds they win outright \u2014 which is exactly why *top k frequent* is a bucket problem rather than a heap problem, even though it is nearly always taught as the latter.",
          alternates: [
            {
              lang: "javascript",
              code: `// Same question, three answers, on a deliberately small case so the
// whole thing can be checked by eye.
const scores = [88, 91, 88, 70, 91, 91, 55, 70, 88, 91];
const k = 2;

const show = (pairs) => pairs.map(([v, c]) => \`\${v}x\${c}\`).join(" ");
console.log("scores:", scores.join(" "));
console.log(\`the \${k} most common:\`);
console.log();

const counts = new Map();
for (const s of scores) counts.set(s, (counts.get(s) ?? 0) + 1);
const pairs = [...counts.entries()].sort((a, b) => a[0] - b[0]);

const fullSort = [...pairs].sort((a, b) => b[1] - a[1]).slice(0, k);
console.log("  sort by count       ", show(fullSort), "  O(m log m)");

// A min-heap of [count, value], capped at k.
const heap = [];
const less = (x, y) => (x[0] !== y[0] ? x[0] < y[0] : x[1] < y[1]);
function push(v) {
  heap.push(v);
  let i = heap.length - 1;
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (!less(heap[i], heap[p])) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
}
function pop() {
  const top = heap[0];
  const last = heap.pop();
  if (heap.length > 0) {
    heap[0] = last;
    let i = 0;
    for (;;) {
      let m = i;
      for (const c of [2 * i + 1, 2 * i + 2]) {
        if (c < heap.length && less(heap[c], heap[m])) m = c;
      }
      if (m === i) break;
      [heap[i], heap[m]] = [heap[m], heap[i]];
      i = m;
    }
  }
  return top;
}
for (const [value, c] of pairs) {
  push([c, value]);
  if (heap.length > k) pop();
}
const byHeap = [...heap].sort((a, b) => (b[0] !== a[0] ? b[0] - a[0] : b[1] - a[1]))
  .map(([c, v]) => [v, c]);
console.log("  heap capped at k    ", show(byHeap), "  O(m log k)");

const buckets = Array.from({ length: scores.length + 1 }, () => []);
for (const [value, c] of pairs) buckets[c].push(value);
const byBucket = [];
for (let c = buckets.length - 1; c > 0; c--) {
  for (const v of buckets[c]) byBucket.push([v, c]);
}
console.log("  buckets by count    ", show(byBucket.slice(0, k)), "  O(n)");

console.log();
console.log("all three agree. The bucket version is the fastest and the least");
console.log("general: it needs the key to be a small non-negative integer, and");
console.log("here it is, because a count cannot exceed the number of items.");
console.log();
console.log("that condition is the whole decision. When it holds, buckets win");
console.log("outright. When it does not — real numbers, huge ranges, keys that");
console.log("are only comparable — the heap is what is left.");`,
            },
            {
              lang: "typescript",
              code: `// Same question, three answers, on a deliberately small case so the
// whole thing can be checked by eye.
const scores: number[] = [88, 91, 88, 70, 91, 91, 55, 70, 88, 91];
const k = 2;

const show = (pairs: [number, number][]): string => pairs.map(([v, c]) => \`\${v}x\${c}\`).join(" ");
console.log("scores:", scores.join(" "));
console.log(\`the \${k} most common:\`);
console.log();

const counts = new Map<number, number>();
for (const s of scores) counts.set(s, (counts.get(s) ?? 0) + 1);
const pairs: [number, number][] = [...counts.entries()].sort((a, b) => a[0] - b[0]);

const fullSort: [number, number][] = [...pairs].sort((a, b) => b[1] - a[1]).slice(0, k);
console.log("  sort by count       ", show(fullSort), "  O(m log m)");

// A min-heap of [count, value], capped at k.
const heap: [number, number][] = [];
const less = (x: [number, number], y: [number, number]): boolean =>
  (x[0] !== y[0] ? x[0] < y[0] : x[1] < y[1]);
function push(v: [number, number]): void {
  heap.push(v);
  let i = heap.length - 1;
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (!less(heap[i], heap[p])) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
}
function pop(): [number, number] {
  const top = heap[0];
  const last = heap.pop() as [number, number];
  if (heap.length > 0) {
    heap[0] = last;
    let i = 0;
    for (;;) {
      let m = i;
      for (const c of [2 * i + 1, 2 * i + 2]) {
        if (c < heap.length && less(heap[c], heap[m])) m = c;
      }
      if (m === i) break;
      [heap[i], heap[m]] = [heap[m], heap[i]];
      i = m;
    }
  }
  return top;
}
for (const [value, c] of pairs) {
  push([c, value]);
  if (heap.length > k) pop();
}
const byHeap: [number, number][] = [...heap].sort((a, b) => (b[0] !== a[0] ? b[0] - a[0] : b[1] - a[1]))
  .map(([c, v]) => [v, c] as [number, number]);
console.log("  heap capped at k    ", show(byHeap), "  O(m log k)");

const buckets: number[][] = Array.from({ length: scores.length + 1 }, () => []);
for (const [value, c] of pairs) buckets[c].push(value);
const byBucket: [number, number][] = [];
for (let c = buckets.length - 1; c > 0; c--) {
  for (const v of buckets[c]) byBucket.push([v, c]);
}
console.log("  buckets by count    ", show(byBucket.slice(0, k)), "  O(n)");

console.log();
console.log("all three agree. The bucket version is the fastest and the least");
console.log("general: it needs the key to be a small non-negative integer, and");
console.log("here it is, because a count cannot exceed the number of items.");
console.log();
console.log("that condition is the whole decision. When it holds, buckets win");
console.log("outright. When it does not — real numbers, huge ranges, keys that");
console.log("are only comparable — the heap is what is left.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.TreeMap;

public class Main {
    record Pair(int value, int count) {}

    static String show(List<Pair> pairs) {
        StringBuilder sb = new StringBuilder();
        for (Pair p : pairs) sb.append(sb.length() > 0 ? " " : "").append(p.value()).append("x").append(p.count());
        return sb.toString();
    }

    public static void main(String[] args) {
        // Same question, three answers, on a deliberately small case so the
        // whole thing can be checked by eye.
        int[] scores = {88, 91, 88, 70, 91, 91, 55, 70, 88, 91};
        int k = 2;

        StringBuilder raw = new StringBuilder();
        for (int s : scores) raw.append(raw.length() > 0 ? " " : "").append(s);
        System.out.println("scores: " + raw);
        System.out.printf("the %d most common:%n%n", k);

        Map<Integer, Integer> counts = new TreeMap<>();
        for (int s : scores) counts.merge(s, 1, Integer::sum);
        List<Pair> pairs = new ArrayList<>();
        for (Map.Entry<Integer, Integer> e : counts.entrySet()) pairs.add(new Pair(e.getKey(), e.getValue()));

        List<Pair> fullSort = new ArrayList<>(pairs);
        fullSort.sort(Comparator.comparingInt(Pair::count).reversed());
        System.out.println("  sort by count        " + show(fullSort.subList(0, k)) + "   O(m log m)");

        PriorityQueue<Pair> heap = new PriorityQueue<>(
                Comparator.comparingInt(Pair::count).thenComparingInt(Pair::value));
        for (Pair p : pairs) {
            heap.add(p);
            if (heap.size() > k) heap.poll();
        }
        List<Pair> byHeap = new ArrayList<>(heap);
        byHeap.sort(Comparator.comparingInt(Pair::count).thenComparingInt(Pair::value).reversed());
        System.out.println("  heap capped at k     " + show(byHeap) + "   O(m log k)");

        List<List<Integer>> buckets = new ArrayList<>();
        for (int i = 0; i <= scores.length; i++) buckets.add(new ArrayList<>());
        for (Pair p : pairs) buckets.get(p.count()).add(p.value());
        List<Pair> byBucket = new ArrayList<>();
        for (int c = buckets.size() - 1; c > 0; c--) {
            for (int v : buckets.get(c)) byBucket.add(new Pair(v, c));
        }
        System.out.println("  buckets by count     " + show(byBucket.subList(0, k)) + "   O(n)");

        System.out.println();
        System.out.println("all three agree. The bucket version is the fastest and the least");
        System.out.println("general: it needs the key to be a small non-negative integer, and");
        System.out.println("here it is, because a count cannot exceed the number of items.");
        System.out.println();
        System.out.println("that condition is the whole decision. When it holds, buckets win");
        System.out.println("outright. When it does not — real numbers, huge ranges, keys that");
        System.out.println("are only comparable — the heap is what is left.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <functional>
#include <iostream>
#include <map>
#include <queue>
#include <string>
#include <utility>
#include <vector>

using Pair = std::pair<int, int>;   // (count, value) for the heap's ordering

static std::string show(const std::vector<Pair>& pairs) {
    std::string out;
    for (const auto& [value, count] : pairs) {
        if (!out.empty()) out += " ";
        out += std::to_string(value) + "x" + std::to_string(count);
    }
    return out;
}

int main() {
    // Same question, three answers, on a deliberately small case so the
    // whole thing can be checked by eye.
    const std::vector<int> scores = {88, 91, 88, 70, 91, 91, 55, 70, 88, 91};
    const int k = 2;

    std::string raw;
    for (int s : scores) {
        if (!raw.empty()) raw += " ";
        raw += std::to_string(s);
    }
    std::cout << "scores: " << raw << '\\n';
    std::cout << "the " << k << " most common:\\n\\n";

    std::map<int, int> counts;      // ordered, so the walk below is deterministic
    for (int s : scores) counts[s] += 1;
    std::vector<Pair> pairs;        // (value, count)
    for (const auto& [value, c] : counts) pairs.push_back({value, c});

    std::vector<Pair> full_sort = pairs;
    std::stable_sort(full_sort.begin(), full_sort.end(),
                     [](const Pair& a, const Pair& b) { return a.second > b.second; });
    full_sort.resize(static_cast<size_t>(k));
    std::cout << "  sort by count        " << show(full_sort) << "   O(m log m)\\n";

    std::priority_queue<Pair, std::vector<Pair>, std::greater<Pair>> heap;   // (count, value)
    for (const auto& [value, c] : pairs) {
        heap.push({c, value});
        if (static_cast<int>(heap.size()) > k) heap.pop();
    }
    std::vector<Pair> by_heap;
    while (!heap.empty()) {
        auto [c, value] = heap.top();
        heap.pop();
        by_heap.push_back({value, c});
    }
    std::sort(by_heap.begin(), by_heap.end(), [](const Pair& a, const Pair& b) {
        return a.second != b.second ? a.second > b.second : a.first > b.first;
    });
    std::cout << "  heap capped at k     " << show(by_heap) << "   O(m log k)\\n";

    std::vector<std::vector<int>> buckets(scores.size() + 1);
    for (const auto& [value, c] : pairs) buckets[static_cast<size_t>(c)].push_back(value);
    std::vector<Pair> by_bucket;
    for (int c = static_cast<int>(buckets.size()) - 1; c > 0; --c) {
        for (int v : buckets[static_cast<size_t>(c)]) by_bucket.push_back({v, c});
    }
    by_bucket.resize(static_cast<size_t>(k));
    std::cout << "  buckets by count     " << show(by_bucket) << "   O(n)\\n";

    std::cout << "\\nall three agree. The bucket version is the fastest and the least\\n";
    std::cout << "general: it needs the key to be a small non-negative integer, and\\n";
    std::cout << "here it is, because a count cannot exceed the number of items.\\n\\n";
    std::cout << "that condition is the whole decision. When it holds, buckets win\\n";
    std::cout << "outright. When it does not — real numbers, huge ranges, keys that\\n";
    std::cout << "are only comparable — the heap is what is left.\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::cmp::Reverse;
use std::collections::{BTreeMap, BinaryHeap};

fn show(pairs: &[(i32, i32)]) -> String {
    pairs.iter().map(|(v, c)| format!("{}x{}", v, c)).collect::<Vec<_>>().join(" ")
}

fn main() {
    // Same question, three answers, on a deliberately small case so the
    // whole thing can be checked by eye.
    let scores = [88, 91, 88, 70, 91, 91, 55, 70, 88, 91];
    let k = 2usize;

    let raw: Vec<String> = scores.iter().map(|s| s.to_string()).collect();
    println!("scores: {}", raw.join(" "));
    println!("the {} most common:", k);
    println!();

    let mut counts: BTreeMap<i32, i32> = BTreeMap::new(); // ordered, so the walk is deterministic
    for &s in scores.iter() {
        *counts.entry(s).or_insert(0) += 1;
    }
    let pairs: Vec<(i32, i32)> = counts.iter().map(|(&v, &c)| (v, c)).collect();

    let mut full_sort = pairs.clone();
    full_sort.sort_by(|a, b| b.1.cmp(&a.1)); // stable, so ties keep value order
    println!("  sort by count        {}   O(m log m)", show(&full_sort[..k]));

    let mut heap: BinaryHeap<Reverse<(i32, i32)>> = BinaryHeap::new(); // (count, value)
    for &(value, c) in &pairs {
        heap.push(Reverse((c, value)));
        if heap.len() > k {
            heap.pop();
        }
    }
    let mut by_heap: Vec<(i32, i32)> = heap.iter().map(|Reverse((c, v))| (*v, *c)).collect();
    by_heap.sort_by(|a, b| if a.1 != b.1 { b.1.cmp(&a.1) } else { b.0.cmp(&a.0) });
    println!("  heap capped at k     {}   O(m log k)", show(&by_heap));

    let mut buckets: Vec<Vec<i32>> = vec![Vec::new(); scores.len() + 1];
    for &(value, c) in &pairs {
        buckets[c as usize].push(value);
    }
    let mut by_bucket: Vec<(i32, i32)> = Vec::new();
    for c in (1..buckets.len()).rev() {
        for &v in &buckets[c] {
            by_bucket.push((v, c as i32));
        }
    }
    println!("  buckets by count     {}   O(n)", show(&by_bucket[..k]));

    println!();
    println!("all three agree. The bucket version is the fastest and the least");
    println!("general: it needs the key to be a small non-negative integer, and");
    println!("here it is, because a count cannot exceed the number of items.");
    println!();
    println!("that condition is the whole decision. When it holds, buckets win");
    println!("outright. When it does not — real numbers, huge ranges, keys that");
    println!("are only comparable — the heap is what is left.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"container/heap"
	"fmt"
	"sort"
	"strconv"
	"strings"
)

type pair struct{ value, count int }

type byCount []pair

func (b byCount) Len() int { return len(b) }
func (b byCount) Less(i, j int) bool {
	if b[i].count != b[j].count {
		return b[i].count < b[j].count
	}
	return b[i].value < b[j].value
}
func (b byCount) Swap(i, j int)       { b[i], b[j] = b[j], b[i] }
func (b *byCount) Push(x interface{}) { *b = append(*b, x.(pair)) }
func (b *byCount) Pop() interface{} {
	old := *b
	n := len(old)
	last := old[n-1]
	*b = old[:n-1]
	return last
}

func show(pairs []pair) string {
	parts := make([]string, len(pairs))
	for i, p := range pairs {
		parts[i] = strconv.Itoa(p.value) + "x" + strconv.Itoa(p.count)
	}
	return strings.Join(parts, " ")
}

func main() {
	// Same question, three answers, on a deliberately small case so the
	// whole thing can be checked by eye.
	scores := []int{88, 91, 88, 70, 91, 91, 55, 70, 88, 91}
	k := 2

	raw := make([]string, len(scores))
	for i, s := range scores {
		raw[i] = strconv.Itoa(s)
	}
	fmt.Println("scores:", strings.Join(raw, " "))
	fmt.Printf("the %d most common:\\n\\n", k)

	counts := map[int]int{}
	for _, s := range scores {
		counts[s]++
	}
	// Go randomises map iteration, so the keys are sorted before anything reads them.
	keys := make([]int, 0, len(counts))
	for v := range counts {
		keys = append(keys, v)
	}
	sort.Ints(keys)
	pairs := make([]pair, 0, len(keys))
	for _, v := range keys {
		pairs = append(pairs, pair{v, counts[v]})
	}

	fullSort := append([]pair(nil), pairs...)
	sort.SliceStable(fullSort, func(i, j int) bool { return fullSort[i].count > fullSort[j].count })
	fmt.Println("  sort by count       ", show(fullSort[:k]), "  O(m log m)")

	h := &byCount{}
	heap.Init(h)
	for _, p := range pairs {
		heap.Push(h, p)
		if h.Len() > k {
			heap.Pop(h)
		}
	}
	byHeap := append([]pair(nil), (*h)...)
	sort.Slice(byHeap, func(i, j int) bool {
		if byHeap[i].count != byHeap[j].count {
			return byHeap[i].count > byHeap[j].count
		}
		return byHeap[i].value > byHeap[j].value
	})
	fmt.Println("  heap capped at k    ", show(byHeap), "  O(m log k)")

	buckets := make([][]int, len(scores)+1)
	for _, p := range pairs {
		buckets[p.count] = append(buckets[p.count], p.value)
	}
	var byBucket []pair
	for c := len(buckets) - 1; c > 0; c-- {
		for _, v := range buckets[c] {
			byBucket = append(byBucket, pair{v, c})
		}
	}
	fmt.Println("  buckets by count    ", show(byBucket[:k]), "  O(n)")

	fmt.Println()
	fmt.Println("all three agree. The bucket version is the fastest and the least")
	fmt.Println("general: it needs the key to be a small non-negative integer, and")
	fmt.Println("here it is, because a count cannot exceed the number of items.")
	fmt.Println()
	fmt.Println("that condition is the whole decision. When it holds, buckets win")
	fmt.Println("outright. When it does not — real numbers, huge ranges, keys that")
	fmt.Println("are only comparable — the heap is what is left.")
}`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Find the k most frequent elements in an array.",
      answer:
        "Count with a hash map, then bucket by count: an array of n + 1 lists, where bucket i holds every key seen exactly i times. Walk down from the highest bucket collecting keys until you have k. That is O(n) \u2014 counting is linear, bucketing is linear, and the walk visits each bucket once. The heap answer, keeping a min-heap of size k over the distinct keys, is O(m log k) and is what most people give; the bucket answer is better and the reason is that a count is bounded by n, so it can be an index rather than something to compare.",
    },
    {
      question: "When would you not use counting or bucket sort?",
      answer:
        "When the range of the key is large relative to n, or when the key is not a bounded non-negative integer at all. Bucketing is O(n + range), so sorting a million 32-bit integers this way needs four billion buckets \u2014 radix sort exists precisely to fix that by bucketing one digit at a time. Floats, strings under a locale-aware collation, and anything with only a user-supplied comparator have no index to compute, so the technique does not apply and a comparison sort or a heap is what is left.",
    },
    {
      question: "Why does a heap have a log in it at all?",
      answer:
        "Because it only ever learns about elements by comparing them, and a comparison yields one bit. Sorting n items by comparison needs log(n!) \u2248 n log n bits of information, and the same argument bounds anything comparison-based from below. Counting escapes it by not comparing: using the key as an index extracts its full value in one step. That is why the O(n) results in this area all require a key you can index by, and why they are not counterexamples to the sorting lower bound.",
    },
  ],
  takeaways: [
    "The log in every heap bound comes from comparing; indexing does not compare, so it has no log.",
    "A count is bounded by n, which makes it a valid array index \u2014 this is why top-k-frequent is O(n), not O(n log k).",
    "Bucketing costs O(n + range). Check the second term before celebrating the first.",
    "Radix sort is the repair for a large range: bucket one digit at a time, several passes, small range each pass.",
    "Speed and generality run in opposite directions here \u2014 the fastest option assumes the most, so check the assumption first.",
    "With a tie at the k-th place, two correct answers need not match; put the tiebreak in the key if the caller cares.",
  ],
  status: "available",
};
