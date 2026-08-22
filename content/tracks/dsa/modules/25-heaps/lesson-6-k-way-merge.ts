import type { Lesson } from "@/content/types";

export const kWayMergeLesson: Lesson = {
  id: "dsa-heap-k-way-merge",
  slug: "k-way-merge",
  moduleSlug: "heaps-and-priority-queues",
  title: "K-Way Merge, and Merging More Than Fits",
  summary:
    "Merging two sorted lists needs two cursors. Merging k of them needs a heap of k cursors — and the memory never grows past k, which is what makes it the answer when the inputs do not fit at all.",
  estimatedMinutes: 30,
  objectives: [
    "Merge k sorted sequences with a heap holding one cursor per sequence",
    "Explain why one entry per list is always sufficient",
    "Compare against concatenate-and-sort, including what Timsort does to that comparison",
    "Recognise the pattern as the merge phase of an external sort",
  ],
  sections: [
    {
      id: "one-cursor-each",
      heading: "A heap of cursors, not of values",
      body: [
        "Merging two sorted lists is a classic: walk a cursor along each, take the smaller, advance that one. The comparison is a single `if`.",
        "With k lists the same algorithm needs to find the smallest of k cursor values on every step, which is O(k) by scanning \u2014 so merging k lists of n/k elements each costs O(nk). For k = 1000 that is worse than throwing the order away and re-sorting.",
        "Replace the scan with a heap and each step becomes O(log k). What goes into the heap is not the lists but a cursor into each: the value under the cursor, plus enough information to advance it.",
        "One cursor per list is always enough, and the reason is worth saying out loud: a list is sorted, so its second element cannot be the global minimum while its first is still unclaimed. Holding more would be holding values that cannot be needed yet.",
      ],
      examples: [
        {
          id: "k-way-trace",
          title: "One entry per list, and why that is enough",
          lang: "python",
          code: `import heapq

lists = [
    [1, 4, 9, 15],
    [2, 3, 8],
    [0, 7, 11, 20, 31],
]

# One entry per list: (value, which list, position in it).
heap = [(row[0], i, 0) for i, row in enumerate(lists) if row]
heapq.heapify(heap)

merged = []
print(f"{'take':>5}  {'from list':>9}  {'heap holds':<24} {'merged so far'}")
print("-" * 72)
while heap:
    value, li, pos = heapq.heappop(heap)
    merged.append(value)
    if pos + 1 < len(lists[li]):
        heapq.heappush(heap, (lists[li][pos + 1], li, pos + 1))
    holding = sorted(v for v, _, _ in heap)
    print(f"{value:>5}  {li:>9}  {str(holding):<24} {merged}")

print()
print("merged:", merged)
print(f"the heap never held more than {len(lists)} values — one per list,")
print("because a list's next value cannot be needed until its current one is taken.")`,
          output: ` take  from list  heap holds               merged so far
------------------------------------------------------------------------
    0          2  [1, 2, 7]                [0]
    1          0  [2, 4, 7]                [0, 1]
    2          1  [3, 4, 7]                [0, 1, 2]
    3          1  [4, 7, 8]                [0, 1, 2, 3]
    4          0  [7, 8, 9]                [0, 1, 2, 3, 4]
    7          2  [8, 9, 11]               [0, 1, 2, 3, 4, 7]
    8          1  [9, 11]                  [0, 1, 2, 3, 4, 7, 8]
    9          0  [11, 15]                 [0, 1, 2, 3, 4, 7, 8, 9]
   11          2  [15, 20]                 [0, 1, 2, 3, 4, 7, 8, 9, 11]
   15          0  [20]                     [0, 1, 2, 3, 4, 7, 8, 9, 11, 15]
   20          2  [31]                     [0, 1, 2, 3, 4, 7, 8, 9, 11, 15, 20]
   31          2  []                       [0, 1, 2, 3, 4, 7, 8, 9, 11, 15, 20, 31]

merged: [0, 1, 2, 3, 4, 7, 8, 9, 11, 15, 20, 31]
the heap never held more than 3 values — one per list,
because a list's next value cannot be needed until its current one is taken.`,
          explanation:
            "The heap holds a *cursor* into each list rather than the lists themselves, which is the idea the whole pattern rests on: a list's second value cannot possibly be the next smallest while its first is still unclaimed, so there is never a reason to hold more than one entry per list. Each pop is followed by at most one push from the same list, so the heap stays at exactly k until the lists start running out. The index travels in the tuple because the heap has to know which list to refill from \u2014 in a linked-list version the node itself carries that, and no index is needed.",
          alternates: [
            {
              lang: "javascript",
              code: `const lists = [
  [1, 4, 9, 15],
  [2, 3, 8],
  [0, 7, 11, 20, 31],
];

// One entry per list: [value, which list, position in it].
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

lists.forEach((row, i) => {
  if (row.length > 0) push([row[0], i, 0]);
});

const merged = [];
const padStart = (s, w) => String(s).padStart(w);
const padEnd = (s, w) => String(s).padEnd(w);
const show = (a) => "[" + a.join(", ") + "]";

console.log(\`\${padStart("take", 5)}  \${padStart("from list", 9)}  \${padEnd("heap holds", 24)} \${"merged so far"}\`);
console.log("-".repeat(72));
while (heap.length > 0) {
  const [value, li, pos] = pop();
  merged.push(value);
  if (pos + 1 < lists[li].length) push([lists[li][pos + 1], li, pos + 1]);
  const holding = show(heap.map((e) => e[0]).sort((a, b) => a - b));
  console.log(\`\${padStart(value, 5)}  \${padStart(li, 9)}  \${padEnd(holding, 24)} \${show(merged)}\`);
}

console.log();
console.log("merged:", show(merged));
console.log(\`the heap never held more than \${lists.length} values — one per list,\`);
console.log("because a list's next value cannot be needed until its current one is taken.");`,
            },
            {
              lang: "typescript",
              code: `const lists: number[][] = [
  [1, 4, 9, 15],
  [2, 3, 8],
  [0, 7, 11, 20, 31],
];

// One entry per list: [value, which list, position in it].
const heap: [number, number, number][] = [];
const less = (x: [number, number, number], y: [number, number, number]): boolean =>
  (x[0] !== y[0] ? x[0] < y[0] : x[1] < y[1]);
function push(v: [number, number, number]): void {
  heap.push(v);
  let i = heap.length - 1;
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (!less(heap[i], heap[p])) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
}
function pop(): [number, number, number] {
  const top = heap[0];
  const last = heap.pop() as [number, number, number];
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

lists.forEach((row: number[], i: number) => {
  if (row.length > 0) push([row[0], i, 0]);
});

const merged: number[] = [];
const padStart = (s: string | number, w: number): string => String(s).padStart(w);
const padEnd = (s: string | number, w: number): string => String(s).padEnd(w);
const show = (a: number[]): string => "[" + a.join(", ") + "]";

console.log(\`\${padStart("take", 5)}  \${padStart("from list", 9)}  \${padEnd("heap holds", 24)} \${"merged so far"}\`);
console.log("-".repeat(72));
while (heap.length > 0) {
  const [value, li, pos] = pop();
  merged.push(value);
  if (pos + 1 < lists[li].length) push([lists[li][pos + 1], li, pos + 1]);
  const holding = show(heap.map((e) => e[0]).sort((a: number, b: number) => a - b));
  console.log(\`\${padStart(value, 5)}  \${padStart(li, 9)}  \${padEnd(holding, 24)} \${show(merged)}\`);
}

console.log();
console.log("merged:", show(merged));
console.log(\`the heap never held more than \${lists.length} values — one per list,\`);
console.log("because a list's next value cannot be needed until its current one is taken.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.PriorityQueue;

public class Main {
    // One entry per list: the value, which list it came from, and where in it.
    record Cursor(int value, int list, int pos) {}

    public static void main(String[] args) {
        int[][] lists = {
            {1, 4, 9, 15},
            {2, 3, 8},
            {0, 7, 11, 20, 31},
        };

        PriorityQueue<Cursor> heap = new PriorityQueue<>(
                Comparator.comparingInt(Cursor::value).thenComparingInt(Cursor::list));
        for (int i = 0; i < lists.length; i++) {
            if (lists[i].length > 0) heap.add(new Cursor(lists[i][0], i, 0));
        }

        List<Integer> merged = new ArrayList<>();
        System.out.printf("%5s  %9s  %-24s %s%n", "take", "from list", "heap holds", "merged so far");
        System.out.println("-".repeat(72));
        while (!heap.isEmpty()) {
            Cursor c = heap.poll();
            merged.add(c.value());
            if (c.pos() + 1 < lists[c.list()].length) {
                heap.add(new Cursor(lists[c.list()][c.pos() + 1], c.list(), c.pos() + 1));
            }
            List<Integer> holding = new ArrayList<>();
            for (Cursor h : heap) holding.add(h.value());
            holding.sort(null);
            System.out.printf("%5d  %9d  %-24s %s%n", c.value(), c.list(), holding, merged);
        }

        System.out.println();
        System.out.println("merged: " + merged);
        System.out.printf("the heap never held more than %d values — one per list,%n", lists.length);
        System.out.println("because a list's next value cannot be needed until its current one is taken.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <functional>
#include <iomanip>
#include <iostream>
#include <queue>
#include <string>
#include <tuple>
#include <vector>

static std::string show(const std::vector<int>& a) {
    std::string out = "[";
    for (size_t i = 0; i < a.size(); ++i) {
        if (i) out += ", ";
        out += std::to_string(a[i]);
    }
    return out + "]";
}

int main() {
    const std::vector<std::vector<int>> lists = {
        {1, 4, 9, 15},
        {2, 3, 8},
        {0, 7, 11, 20, 31},
    };

    // One entry per list: value, which list, position in it. A tuple compares
    // field by field, which is the ordering this needs.
    using Cursor = std::tuple<int, int, int>;
    std::priority_queue<Cursor, std::vector<Cursor>, std::greater<Cursor>> heap;
    std::vector<Cursor> mirror;                  // only so the contents can be printed
    for (size_t i = 0; i < lists.size(); ++i) {
        if (!lists[i].empty()) {
            heap.push({lists[i][0], static_cast<int>(i), 0});
            mirror.push_back({lists[i][0], static_cast<int>(i), 0});
        }
    }

    std::vector<int> merged;
    std::cout << std::right << std::setw(5) << "take" << "  " << std::setw(9) << "from list"
              << "  " << std::left << std::setw(24) << "heap holds" << " merged so far" << '\\n';
    std::cout << std::string(72, '-') << '\\n';
    while (!heap.empty()) {
        auto [value, li, pos] = heap.top();
        heap.pop();
        mirror.erase(std::find(mirror.begin(), mirror.end(), Cursor{value, li, pos}));
        merged.push_back(value);
        if (pos + 1 < static_cast<int>(lists[li].size())) {
            heap.push({lists[li][pos + 1], li, pos + 1});
            mirror.push_back({lists[li][pos + 1], li, pos + 1});
        }
        std::vector<int> holding;
        for (const auto& c : mirror) holding.push_back(std::get<0>(c));
        std::sort(holding.begin(), holding.end());
        std::cout << std::right << std::setw(5) << value << "  " << std::setw(9) << li << "  "
                  << std::left << std::setw(24) << show(holding) << ' ' << show(merged) << '\\n';
    }

    std::cout << "\\nmerged: " << show(merged) << '\\n';
    std::cout << "the heap never held more than " << lists.size() << " values — one per list,\\n";
    std::cout << "because a list's next value cannot be needed until its current one is taken.\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::cmp::Reverse;
use std::collections::BinaryHeap;

fn show(a: &[i32]) -> String {
    let parts: Vec<String> = a.iter().map(|v| v.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn main() {
    let lists: Vec<Vec<i32>> = vec![
        vec![1, 4, 9, 15],
        vec![2, 3, 8],
        vec![0, 7, 11, 20, 31],
    ];

    // One entry per list: value, which list, position in it. A tuple orders
    // field by field, and Reverse turns the max-heap into a min-heap.
    let mut heap: BinaryHeap<Reverse<(i32, usize, usize)>> = BinaryHeap::new();
    for (i, row) in lists.iter().enumerate() {
        if !row.is_empty() {
            heap.push(Reverse((row[0], i, 0)));
        }
    }

    let mut merged: Vec<i32> = Vec::new();
    println!("{:>5}  {:>9}  {:<24} {}", "take", "from list", "heap holds", "merged so far");
    println!("{}", "-".repeat(72));
    while let Some(Reverse((value, li, pos))) = heap.pop() {
        merged.push(value);
        if pos + 1 < lists[li].len() {
            heap.push(Reverse((lists[li][pos + 1], li, pos + 1)));
        }
        let mut holding: Vec<i32> = heap.iter().map(|Reverse((v, _, _))| *v).collect();
        holding.sort_unstable();
        println!("{:>5}  {:>9}  {:<24} {}", value, li, show(&holding), show(&merged));
    }

    println!();
    println!("merged: {}", show(&merged));
    println!("the heap never held more than {} values — one per list,", lists.len());
    println!("because a list's next value cannot be needed until its current one is taken.");
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

// One entry per list: the value, which list it came from, and where in it.
type cursor struct {
	value, list, pos int
}

type cursors []cursor

func (c cursors) Len() int { return len(c) }
func (c cursors) Less(i, j int) bool {
	if c[i].value != c[j].value {
		return c[i].value < c[j].value
	}
	return c[i].list < c[j].list
}
func (c cursors) Swap(i, j int)       { c[i], c[j] = c[j], c[i] }
func (c *cursors) Push(x interface{}) { *c = append(*c, x.(cursor)) }
func (c *cursors) Pop() interface{} {
	old := *c
	n := len(old)
	last := old[n-1]
	*c = old[:n-1]
	return last
}

func show(a []int) string {
	parts := make([]string, len(a))
	for i, v := range a {
		parts[i] = strconv.Itoa(v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func main() {
	lists := [][]int{
		{1, 4, 9, 15},
		{2, 3, 8},
		{0, 7, 11, 20, 31},
	}

	h := &cursors{}
	heap.Init(h)
	for i, row := range lists {
		if len(row) > 0 {
			heap.Push(h, cursor{row[0], i, 0})
		}
	}

	var merged []int
	fmt.Printf("%5s  %9s  %-24s %s\\n", "take", "from list", "heap holds", "merged so far")
	fmt.Println(strings.Repeat("-", 72))
	for h.Len() > 0 {
		c := heap.Pop(h).(cursor)
		merged = append(merged, c.value)
		if c.pos+1 < len(lists[c.list]) {
			heap.Push(h, cursor{lists[c.list][c.pos+1], c.list, c.pos + 1})
		}
		holding := make([]int, 0, h.Len())
		for _, e := range *h {
			holding = append(holding, e.value)
		}
		sort.Ints(holding)
		fmt.Printf("%5d  %9d  %-24s %s\\n", c.value, c.list, show(holding), show(merged))
	}

	fmt.Println()
	fmt.Println("merged:", show(merged))
	fmt.Printf("the heap never held more than %d values — one per list,\\n", len(lists))
	fmt.Println("because a list's next value cannot be needed until its current one is taken.")
}`,
            },
          ],
        },
      ],
      visual: {
        id: "kway-visual",
        kind: "heap",
        title: "k cursors, one per list",
      },
    },
    {
      id: "against-resorting",
      heading: "Why not concatenate and sort?",
      body: [
        "It is one line, it is correct, and for most inputs it is fine. It also throws away the fact you were given \u2014 that each input is already sorted \u2014 and then pays to rediscover it.",
        "The complexity argument is n log n against n log k, which is a genuine but modest win: about 2.3\u00d7 at a thousand lists, and less below that.",
        "The complexity argument is also weaker than it looks, because the mainstream sorts are adaptive. Timsort in Python and `List.sort` in Java both scan for existing runs and merge them, which means sorting a concatenation of sorted lists is already doing something close to a k-way merge internally, with tighter constants than a hand-written heap.",
        "So if both approaches fit in memory, reach for the library. The heap wins the argument on a different axis entirely.",
      ],
      examples: [
        {
          id: "merge-cost",
          title: "Against throwing the order away",
          lang: "python",
          code: `import heapq
import math

seed = 7


def next_rand():
    global seed
    seed = (seed * 16807) % 2147483647
    return seed


def make_lists(k, per):
    out = []
    for _ in range(k):
        row = sorted(next_rand() % 100_000 for _ in range(per))
        out.append(row)
    return out


def merge_by_heap(lists):
    heap = [(row[0], i, 0) for i, row in enumerate(lists) if row]
    heapq.heapify(heap)
    out = []
    while heap:
        value, li, pos = heapq.heappop(heap)
        out.append(value)
        if pos + 1 < len(lists[li]):
            heapq.heappush(heap, (lists[li][pos + 1], li, pos + 1))
    return out


def merge_by_sorting(lists):
    everything = []
    for row in lists:
        everything.extend(row)
    return sorted(everything)


k, per = 50, 400
lists = make_lists(k, per)
n = k * per
a = merge_by_heap(lists)
b = merge_by_sorting(lists)
print(f"{k} lists of {per} = {n:,} values")
print("both produce the same merged order:", "yes" if a == b else "no")
print()

print(f"{'k':>6} {'n':>10} {'heap: n log2 k':>16} {'sort: n log2 n':>16} {'ratio':>7}")
print("-" * 60)
for k in (4, 50, 1_000):
    n = k * 10_000
    heap_work = n * math.log2(k)
    sort_work = n * math.log2(n)
    print(f"{k:>6} {n:>10,} {heap_work:>16,.0f} {sort_work:>16,.0f} {sort_work / heap_work:>6.1f}x")

print()
print("throwing away the existing order and re-sorting is n log n; the heap")
print("keeps it and pays only n log k. But the honest note is that a library")
print("sort on nearly-sorted runs is very fast — Timsort detects the runs and")
print("merges them, which is the same algorithm with better constants.")`,
          output: `50 lists of 400 = 20,000 values
both produce the same merged order: yes

     k          n   heap: n log2 k   sort: n log2 n   ratio
------------------------------------------------------------
     4     40,000           80,000          611,508    7.6x
    50    500,000        2,821,928        9,465,784    3.4x
  1000 10,000,000       99,657,843      232,534,967    2.3x

throwing away the existing order and re-sorting is n log n; the heap
keeps it and pays only n log k. But the honest note is that a library
sort on nearly-sorted runs is very fast — Timsort detects the runs and
merges them, which is the same algorithm with better constants.`,
          explanation:
            "Concatenating and re-sorting is correct and one line, and it discards the sortedness you were handed. n log n against n log k is the argument for keeping it, and the ratio is real but modest \u2014 2.3\u00d7 at a thousand lists. The caveat is the last paragraph and it matters: Python's Timsort and Java's `List.sort` both detect existing runs and merge them, so `sorted(concatenated)` on already-sorted inputs is closer to O(n log k) in practice than the formula suggests. The heap's decisive advantage is not the exponent; it is the next example.",
          alternates: [
            {
              lang: "javascript",
              code: `let seed = 7;
function nextRand() {
  seed = (seed * 16807) % 2147483647;
  return seed;
}

function makeLists(k, per) {
  const out = [];
  for (let i = 0; i < k; i++) {
    const row = Array.from({ length: per }, () => nextRand() % 100000);
    row.sort((a, b) => a - b);
    out.push(row);
  }
  return out;
}

function mergeByHeap(lists) {
  const heap = [];
  const less = (x, y) => (x[0] !== y[0] ? x[0] < y[0] : x[1] < y[1]);
  const push = (v) => {
    heap.push(v);
    let i = heap.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (!less(heap[i], heap[p])) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
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
  };

  lists.forEach((row, i) => {
    if (row.length > 0) push([row[0], i, 0]);
  });
  const out = [];
  while (heap.length > 0) {
    const [value, li, pos] = pop();
    out.push(value);
    if (pos + 1 < lists[li].length) push([lists[li][pos + 1], li, pos + 1]);
  }
  return out;
}

function mergeBySorting(lists) {
  const everything = [];
  for (const row of lists) everything.push(...row);
  everything.sort((a, b) => a - b);
  return everything;
}

const k = 50;
const per = 400;
const lists = makeLists(k, per);
const n = k * per;
const a = mergeByHeap(lists);
const b = mergeBySorting(lists);
const same = a.length === b.length && a.every((v, i) => v === b[i]);
const group = (x) => String(x).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");
console.log(\`\${k} lists of \${per} = \${group(n)} values\`);
console.log("both produce the same merged order:", same ? "yes" : "no");
console.log();

const pad = (s, w) => String(s).padStart(w);
console.log(\`\${pad("k", 6)} \${pad("n", 10)} \${pad("heap: n log2 k", 16)} \${pad("sort: n log2 n", 16)} \${pad("ratio", 7)}\`);
console.log("-".repeat(60));
for (const kk of [4, 50, 1000]) {
  const nn = kk * 10000;
  const heapWork = nn * Math.log2(kk);
  const sortWork = nn * Math.log2(nn);
  console.log(\`\${pad(kk, 6)} \${pad(group(nn), 10)} \${pad(group(Math.round(heapWork)), 16)} \${pad(group(Math.round(sortWork)), 16)} \${pad((sortWork / heapWork).toFixed(1), 6)}x\`);
}

console.log();
console.log("throwing away the existing order and re-sorting is n log n; the heap");
console.log("keeps it and pays only n log k. But the honest note is that a library");
console.log("sort on nearly-sorted runs is very fast — Timsort detects the runs and");
console.log("merges them, which is the same algorithm with better constants.");`,
            },
            {
              lang: "typescript",
              code: `let seed = 7;
function nextRand(): number {
  seed = (seed * 16807) % 2147483647;
  return seed;
}

function makeLists(k: number, per: number): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < k; i++) {
    const row = Array.from({ length: per }, () => nextRand() % 100000);
    row.sort((a: number, b: number) => a - b);
    out.push(row);
  }
  return out;
}

function mergeByHeap(lists: number[][]): number[] {
  const heap: [number, number, number][] = [];
  const less = (x: [number, number, number], y: [number, number, number]): boolean =>
    (x[0] !== y[0] ? x[0] < y[0] : x[1] < y[1]);
  const push = (v: [number, number, number]): void => {
    heap.push(v);
    let i = heap.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (!less(heap[i], heap[p])) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = (): [number, number, number] => {
    const top = heap[0];
    const last = heap.pop() as [number, number, number];
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
  };

  lists.forEach((row: number[], i: number) => {
    if (row.length > 0) push([row[0], i, 0]);
  });
  const out: number[][] = [];
  while (heap.length > 0) {
    const [value, li, pos] = pop();
    out.push(value);
    if (pos + 1 < lists[li].length) push([lists[li][pos + 1], li, pos + 1]);
  }
  return out;
}

function mergeBySorting(lists: number[][]): number[] {
  const everything: number[] = [];
  for (const row of lists) everything.push(...row);
  everything.sort((a: number, b: number) => a - b);
  return everything;
}

const k = 50;
const per = 400;
const lists = makeLists(k, per);
const n = k * per;
const a = mergeByHeap(lists);
const b = mergeBySorting(lists);
const same = a.length === b.length && a.every((v: number, i: number) => v === b[i]);
const group = (x: number): string => String(x).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");
console.log(\`\${k} lists of \${per} = \${group(n)} values\`);
console.log("both produce the same merged order:", same ? "yes" : "no");
console.log();

const pad = (s: string | number, w: number): string => String(s).padStart(w);
console.log(\`\${pad("k", 6)} \${pad("n", 10)} \${pad("heap: n log2 k", 16)} \${pad("sort: n log2 n", 16)} \${pad("ratio", 7)}\`);
console.log("-".repeat(60));
for (const kk of [4, 50, 1000]) {
  const nn = kk * 10000;
  const heapWork = nn * Math.log2(kk);
  const sortWork = nn * Math.log2(nn);
  console.log(\`\${pad(kk, 6)} \${pad(group(nn), 10)} \${pad(group(Math.round(heapWork)), 16)} \${pad(group(Math.round(sortWork)), 16)} \${pad((sortWork / heapWork).toFixed(1), 6)}x\`);
}

console.log();
console.log("throwing away the existing order and re-sorting is n log n; the heap");
console.log("keeps it and pays only n log k. But the honest note is that a library");
console.log("sort on nearly-sorted runs is very fast — Timsort detects the runs and");
console.log("merges them, which is the same algorithm with better constants.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.PriorityQueue;

public class Main {
    record Cursor(int value, int list, int pos) {}

    static long seed = 7;

    static long nextRand() {
        seed = (seed * 16807) % 2147483647L;
        return seed;
    }

    static int[][] makeLists(int k, int per) {
        int[][] out = new int[k][per];
        for (int i = 0; i < k; i++) {
            for (int j = 0; j < per; j++) out[i][j] = (int) (nextRand() % 100_000);
            Arrays.sort(out[i]);
        }
        return out;
    }

    static List<Integer> mergeByHeap(int[][] lists) {
        PriorityQueue<Cursor> heap = new PriorityQueue<>(
                Comparator.comparingInt(Cursor::value).thenComparingInt(Cursor::list));
        for (int i = 0; i < lists.length; i++) {
            if (lists[i].length > 0) heap.add(new Cursor(lists[i][0], i, 0));
        }
        List<Integer> out = new ArrayList<>();
        while (!heap.isEmpty()) {
            Cursor c = heap.poll();
            out.add(c.value());
            if (c.pos() + 1 < lists[c.list()].length) {
                heap.add(new Cursor(lists[c.list()][c.pos() + 1], c.list(), c.pos() + 1));
            }
        }
        return out;
    }

    static List<Integer> mergeBySorting(int[][] lists) {
        List<Integer> everything = new ArrayList<>();
        for (int[] row : lists) for (int v : row) everything.add(v);
        everything.sort(null);
        return everything;
    }

    public static void main(String[] args) {
        int k = 50, per = 400;
        int[][] lists = makeLists(k, per);
        int n = k * per;
        List<Integer> a = mergeByHeap(lists);
        List<Integer> b = mergeBySorting(lists);
        System.out.printf("%d lists of %d = %,d values%n", k, per, n);
        System.out.println("both produce the same merged order: " + (a.equals(b) ? "yes" : "no"));
        System.out.println();

        System.out.printf("%6s %10s %16s %16s %7s%n", "k", "n", "heap: n log2 k", "sort: n log2 n", "ratio");
        System.out.println("-".repeat(60));
        for (int kk : new int[]{4, 50, 1_000}) {
            long nn = (long) kk * 10_000;
            double heapWork = nn * (Math.log(kk) / Math.log(2));
            double sortWork = nn * (Math.log(nn) / Math.log(2));
            System.out.printf("%6d %,10d %,16.0f %,16.0f %6.1fx%n", kk, nn, heapWork, sortWork, sortWork / heapWork);
        }

        System.out.println();
        System.out.println("throwing away the existing order and re-sorting is n log n; the heap");
        System.out.println("keeps it and pays only n log k. But the honest note is that a library");
        System.out.println("sort on nearly-sorted runs is very fast — Timsort detects the runs and");
        System.out.println("merges them, which is the same algorithm with better constants.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <cmath>
#include <functional>
#include <iomanip>
#include <iostream>
#include <queue>
#include <sstream>
#include <string>
#include <tuple>
#include <vector>

static long long seed = 7;

static long long next_rand() {
    seed = (seed * 16807) % 2147483647LL;
    return seed;
}

static std::vector<std::vector<int>> make_lists(int k, int per) {
    std::vector<std::vector<int>> out;
    for (int i = 0; i < k; ++i) {
        std::vector<int> row(per);
        for (auto& v : row) v = static_cast<int>(next_rand() % 100000);
        std::sort(row.begin(), row.end());
        out.push_back(row);
    }
    return out;
}

static std::vector<int> merge_by_heap(const std::vector<std::vector<int>>& lists) {
    using Cursor = std::tuple<int, int, int>;
    std::priority_queue<Cursor, std::vector<Cursor>, std::greater<Cursor>> heap;
    for (size_t i = 0; i < lists.size(); ++i) {
        if (!lists[i].empty()) heap.push({lists[i][0], static_cast<int>(i), 0});
    }
    std::vector<int> out;
    while (!heap.empty()) {
        auto [value, li, pos] = heap.top();
        heap.pop();
        out.push_back(value);
        if (pos + 1 < static_cast<int>(lists[li].size())) {
            heap.push({lists[li][pos + 1], li, pos + 1});
        }
    }
    return out;
}

static std::vector<int> merge_by_sorting(const std::vector<std::vector<int>>& lists) {
    std::vector<int> everything;
    for (const auto& row : lists) everything.insert(everything.end(), row.begin(), row.end());
    std::sort(everything.begin(), everything.end());
    return everything;
}

static std::string group(long long n) {
    std::string s = std::to_string(n), out;
    for (size_t i = 0; i < s.size(); ++i) {
        if (i > 0 && (s.size() - i) % 3 == 0) out += ',';
        out += s[i];
    }
    return out;
}

int main() {
    const int k = 50, per = 400;
    auto lists = make_lists(k, per);
    long long n = static_cast<long long>(k) * per;
    auto a = merge_by_heap(lists);
    auto b = merge_by_sorting(lists);
    std::cout << k << " lists of " << per << " = " << group(n) << " values\\n";
    std::cout << "both produce the same merged order: " << (a == b ? "yes" : "no") << "\\n\\n";

    std::cout << std::right << std::setw(6) << "k" << ' ' << std::setw(10) << "n" << ' '
              << std::setw(16) << "heap: n log2 k" << ' ' << std::setw(16) << "sort: n log2 n"
              << ' ' << std::setw(7) << "ratio" << '\\n';
    std::cout << std::string(60, '-') << '\\n';
    for (long long kk : {4LL, 50LL, 1000LL}) {
        long long nn = kk * 10000;
        double heap_work = static_cast<double>(nn) * std::log2(static_cast<double>(kk));
        double sort_work = static_cast<double>(nn) * std::log2(static_cast<double>(nn));
        std::ostringstream ratio;
        ratio << std::fixed << std::setprecision(1) << sort_work / heap_work;
        std::cout << std::setw(6) << kk << ' ' << std::setw(10) << group(nn) << ' '
                  << std::setw(16) << group(std::llround(heap_work)) << ' '
                  << std::setw(16) << group(std::llround(sort_work)) << ' '
                  << std::setw(6) << ratio.str() << "x" << '\\n';
    }

    std::cout << "\\nthrowing away the existing order and re-sorting is n log n; the heap\\n";
    std::cout << "keeps it and pays only n log k. But the honest note is that a library\\n";
    std::cout << "sort on nearly-sorted runs is very fast — Timsort detects the runs and\\n";
    std::cout << "merges them, which is the same algorithm with better constants.\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::cmp::Reverse;
use std::collections::BinaryHeap;

struct Lehmer {
    seed: i64,
}

impl Lehmer {
    fn next(&mut self) -> i64 {
        self.seed = (self.seed * 16807) % 2147483647;
        self.seed
    }
}

fn make_lists(rng: &mut Lehmer, k: usize, per: usize) -> Vec<Vec<i32>> {
    (0..k)
        .map(|_| {
            let mut row: Vec<i32> = (0..per).map(|_| (rng.next() % 100_000) as i32).collect();
            row.sort_unstable();
            row
        })
        .collect()
}

fn merge_by_heap(lists: &[Vec<i32>]) -> Vec<i32> {
    let mut heap: BinaryHeap<Reverse<(i32, usize, usize)>> = BinaryHeap::new();
    for (i, row) in lists.iter().enumerate() {
        if !row.is_empty() {
            heap.push(Reverse((row[0], i, 0)));
        }
    }
    let mut out = Vec::new();
    while let Some(Reverse((value, li, pos))) = heap.pop() {
        out.push(value);
        if pos + 1 < lists[li].len() {
            heap.push(Reverse((lists[li][pos + 1], li, pos + 1)));
        }
    }
    out
}

fn merge_by_sorting(lists: &[Vec<i32>]) -> Vec<i32> {
    let mut everything: Vec<i32> = lists.iter().flatten().copied().collect();
    everything.sort_unstable();
    everything
}

fn group(n: i64) -> String {
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
    let mut rng = Lehmer { seed: 7 };
    let (k, per) = (50usize, 400usize);
    let lists = make_lists(&mut rng, k, per);
    let n = (k * per) as i64;
    let a = merge_by_heap(&lists);
    let b = merge_by_sorting(&lists);
    println!("{} lists of {} = {} values", k, per, group(n));
    println!("both produce the same merged order: {}", if a == b { "yes" } else { "no" });
    println!();

    println!("{:>6} {:>10} {:>16} {:>16} {:>7}", "k", "n", "heap: n log2 k", "sort: n log2 n", "ratio");
    println!("{}", "-".repeat(60));
    for kk in [4i64, 50, 1_000] {
        let nn = kk * 10_000;
        let heap_work = nn as f64 * (kk as f64).log2();
        let sort_work = nn as f64 * (nn as f64).log2();
        println!("{:>6} {:>10} {:>16} {:>16} {:>6.1}x", kk, group(nn),
                 group(heap_work.round() as i64), group(sort_work.round() as i64),
                 sort_work / heap_work);
    }

    println!();
    println!("throwing away the existing order and re-sorting is n log n; the heap");
    println!("keeps it and pays only n log k. But the honest note is that a library");
    println!("sort on nearly-sorted runs is very fast — Timsort detects the runs and");
    println!("merges them, which is the same algorithm with better constants.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"container/heap"
	"fmt"
	"math"
	"sort"
	"strconv"
	"strings"
)

type cursor struct {
	value, list, pos int
}

type cursors []cursor

func (c cursors) Len() int { return len(c) }
func (c cursors) Less(i, j int) bool {
	if c[i].value != c[j].value {
		return c[i].value < c[j].value
	}
	return c[i].list < c[j].list
}
func (c cursors) Swap(i, j int)       { c[i], c[j] = c[j], c[i] }
func (c *cursors) Push(x interface{}) { *c = append(*c, x.(cursor)) }
func (c *cursors) Pop() interface{} {
	old := *c
	n := len(old)
	last := old[n-1]
	*c = old[:n-1]
	return last
}

var seed int64 = 7

func nextRand() int64 {
	seed = (seed * 16807) % 2147483647
	return seed
}

func makeLists(k, per int) [][]int {
	out := make([][]int, k)
	for i := range out {
		row := make([]int, per)
		for j := range row {
			row[j] = int(nextRand() % 100000)
		}
		sort.Ints(row)
		out[i] = row
	}
	return out
}

func mergeByHeap(lists [][]int) []int {
	h := &cursors{}
	heap.Init(h)
	for i, row := range lists {
		if len(row) > 0 {
			heap.Push(h, cursor{row[0], i, 0})
		}
	}
	var out []int
	for h.Len() > 0 {
		c := heap.Pop(h).(cursor)
		out = append(out, c.value)
		if c.pos+1 < len(lists[c.list]) {
			heap.Push(h, cursor{lists[c.list][c.pos+1], c.list, c.pos + 1})
		}
	}
	return out
}

func mergeBySorting(lists [][]int) []int {
	var everything []int
	for _, row := range lists {
		everything = append(everything, row...)
	}
	sort.Ints(everything)
	return everything
}

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
	k, per := 50, 400
	lists := makeLists(k, per)
	n := int64(k * per)
	a := mergeByHeap(lists)
	b := mergeBySorting(lists)
	same := "yes"
	for i := range a {
		if a[i] != b[i] {
			same = "no"
			break
		}
	}
	fmt.Printf("%d lists of %d = %s values\\n", k, per, group(n))
	fmt.Println("both produce the same merged order:", same)
	fmt.Println()

	fmt.Printf("%6s %10s %16s %16s %7s\\n", "k", "n", "heap: n log2 k", "sort: n log2 n", "ratio")
	fmt.Println(strings.Repeat("-", 60))
	for _, kk := range []int64{4, 50, 1000} {
		nn := kk * 10000
		heapWork := float64(nn) * math.Log2(float64(kk))
		sortWork := float64(nn) * math.Log2(float64(nn))
		fmt.Printf("%6d %10s %16s %16s %6.1fx\\n", kk, group(nn),
			group(int64(math.Round(heapWork))), group(int64(math.Round(sortWork))), sortWork/heapWork)
	}

	fmt.Println()
	fmt.Println("throwing away the existing order and re-sorting is n log n; the heap")
	fmt.Println("keeps it and pays only n log k. But the honest note is that a library")
	fmt.Println("sort on nearly-sorted runs is very fast — Timsort detects the runs and")
	fmt.Println("merges them, which is the same algorithm with better constants.")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "when-it-does-not-fit",
      heading: "The property that actually decides it",
      body: [
        "Concatenating requires every element to exist at once. The heap requires k.",
        "That single difference is why k-way merge is a named pattern rather than a curiosity. Merging sorted files larger than RAM, merging the per-shard results of a distributed query, merging sorted event streams that never end \u2014 none of them can materialise the concatenation, and all of them can hold k cursors.",
        "It is also the second half of **external merge sort**, the algorithm databases use to sort more data than memory: read as much as fits, sort it, write it out as a run, repeat \u2014 then k-way merge the runs with a heap. The first half is an ordinary sort; the second half is this lesson.",
        "The generalisation is the useful takeaway. *Merge k sorted things* and *the top k of a stream* and *the smallest pair sum across two arrays* are all the same shape: a small heap of frontier candidates, advanced one at a time, where taking one candidate reveals at most one more.",
      ],
      examples: [
        {
          id: "streaming-merge",
          title: "The reason the pattern exists",
          lang: "python",
          code: `import heapq


def stream(values):
    """Stands in for a file, a socket, or a shard — read once, forward only."""
    for v in values:
        yield v


streams = {
    "shard-a": stream([3, 11, 12, 40]),
    "shard-b": stream([1, 2, 30]),
    "shard-c": stream([5, 6, 7, 8]),
}

heap = []
for name, it in streams.items():
    first = next(it, None)
    if first is not None:
        heapq.heappush(heap, (first, name))

print("merging three streams, holding one value from each:")
peak = len(heap)
out = []
while heap:
    value, name = heapq.heappop(heap)
    out.append(value)
    nxt = next(streams[name], None)
    if nxt is not None:
        heapq.heappush(heap, (nxt, name))
    peak = max(peak, len(heap))
    print(f"  took {value:>3} from {name}, heap now holds {len(heap)}")

print()
print("merged:", out)
print(f"peak memory: {peak} values, for {len(out)} values of output.")
print()
print("this is why the heap version matters. Sorting needs every value at once;")
print("this needs one per stream, so the inputs can be larger than memory —")
print("which is exactly what an external merge sort does over disk-backed runs.")`,
          output: `merging three streams, holding one value from each:
  took   1 from shard-b, heap now holds 3
  took   2 from shard-b, heap now holds 3
  took   3 from shard-a, heap now holds 3
  took   5 from shard-c, heap now holds 3
  took   6 from shard-c, heap now holds 3
  took   7 from shard-c, heap now holds 3
  took   8 from shard-c, heap now holds 2
  took  11 from shard-a, heap now holds 2
  took  12 from shard-a, heap now holds 2
  took  30 from shard-b, heap now holds 1
  took  40 from shard-a, heap now holds 0

merged: [1, 2, 3, 5, 6, 7, 8, 11, 12, 30, 40]
peak memory: 3 values, for 11 values of output.

this is why the heap version matters. Sorting needs every value at once;
this needs one per stream, so the inputs can be larger than memory —
which is exactly what an external merge sort does over disk-backed runs.`,
          explanation:
            "Peak memory is k values regardless of how much data flows through, because nothing is ever held except one element per stream. That is what makes this the right answer when the inputs are files, shards, or network responses too large to load \u2014 and it is exactly the merge phase of an external merge sort, which splits input into memory-sized runs, sorts each, writes them out, and then k-way merges the runs back with a heap. The complexity argument in the previous example is a nicety; this is the property that decides the design.",
          alternates: [
            {
              lang: "javascript",
              code: `/** Stands in for a file, a socket, or a shard — read once, forward only. */
function* stream(values) {
  for (const v of values) yield v;
}

const streams = new Map([
  ["shard-a", stream([3, 11, 12, 40])],
  ["shard-b", stream([1, 2, 30])],
  ["shard-c", stream([5, 6, 7, 8])],
]);

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

for (const [name, it] of streams) {
  const first = it.next();
  if (!first.done) push([first.value, name]);
}

console.log("merging three streams, holding one value from each:");
let peak = heap.length;
const out = [];
while (heap.length > 0) {
  const [value, name] = pop();
  out.push(value);
  const nxt = streams.get(name).next();
  if (!nxt.done) push([nxt.value, name]);
  peak = Math.max(peak, heap.length);
  console.log(\`  took \${String(value).padStart(3)} from \${name}, heap now holds \${heap.length}\`);
}

console.log();
console.log("merged: [" + out.join(", ") + "]");
console.log(\`peak memory: \${peak} values, for \${out.length} values of output.\`);
console.log();
console.log("this is why the heap version matters. Sorting needs every value at once;");
console.log("this needs one per stream, so the inputs can be larger than memory —");
console.log("which is exactly what an external merge sort does over disk-backed runs.");`,
            },
            {
              lang: "typescript",
              code: `/** Stands in for a file, a socket, or a shard — read once, forward only. */
function* stream(values: number[]): Generator<number> {
  for (const v of values) yield v;
}

const streams = new Map([
  ["shard-a", stream([3, 11, 12, 40])],
  ["shard-b", stream([1, 2, 30])],
  ["shard-c", stream([5, 6, 7, 8])],
]);

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

for (const [name, it] of streams) {
  const first = it.next();
  if (!first.done) push([first.value, name]);
}

console.log("merging three streams, holding one value from each:");
let peak = heap.length;
const out: number[] = [];
while (heap.length > 0) {
  const [value, name] = pop();
  out.push(value);
  const nxt = streams.get(name)!.next();
  if (!nxt.done) push([nxt.value, name]);
  peak = Math.max(peak, heap.length);
  console.log(\`  took \${String(value).padStart(3)} from \${name}, heap now holds \${heap.length}\`);
}

console.log();
console.log("merged: [" + out.join(", ") + "]");
console.log(\`peak memory: \${peak} values, for \${out.length} values of output.\`);
console.log();
console.log("this is why the heap version matters. Sorting needs every value at once;");
console.log("this needs one per stream, so the inputs can be larger than memory —");
console.log("which is exactly what an external merge sort does over disk-backed runs.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;

public class Main {
    record Entry(int value, String name) {}

    public static void main(String[] args) {
        /* An Iterator stands in for a file, a socket, or a shard — read once,
           forward only. LinkedHashMap so the initial fill is in a fixed order. */
        Map<String, Iterator<Integer>> streams = new LinkedHashMap<>();
        streams.put("shard-a", Arrays.asList(3, 11, 12, 40).iterator());
        streams.put("shard-b", Arrays.asList(1, 2, 30).iterator());
        streams.put("shard-c", Arrays.asList(5, 6, 7, 8).iterator());

        PriorityQueue<Entry> heap = new PriorityQueue<>(
                Comparator.comparingInt(Entry::value).thenComparing(Entry::name));
        for (Map.Entry<String, Iterator<Integer>> s : streams.entrySet()) {
            if (s.getValue().hasNext()) heap.add(new Entry(s.getValue().next(), s.getKey()));
        }

        System.out.println("merging three streams, holding one value from each:");
        int peak = heap.size();
        List<Integer> out = new ArrayList<>();
        while (!heap.isEmpty()) {
            Entry e = heap.poll();
            out.add(e.value());
            Iterator<Integer> it = streams.get(e.name());
            if (it.hasNext()) heap.add(new Entry(it.next(), e.name()));
            peak = Math.max(peak, heap.size());
            System.out.printf("  took %3d from %s, heap now holds %d%n", e.value(), e.name(), heap.size());
        }

        System.out.println();
        System.out.println("merged: " + out);
        System.out.printf("peak memory: %d values, for %d values of output.%n", peak, out.size());
        System.out.println();
        System.out.println("this is why the heap version matters. Sorting needs every value at once;");
        System.out.println("this needs one per stream, so the inputs can be larger than memory —");
        System.out.println("which is exactly what an external merge sort does over disk-backed runs.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <functional>
#include <iomanip>
#include <iostream>
#include <queue>
#include <string>
#include <utility>
#include <vector>

/* A cursor over a vector stands in for a file, a socket, or a shard —
   read once, forward only. */
struct Stream {
    std::string name;
    std::vector<int> values;
    size_t at = 0;
    bool next(int& out) {
        if (at >= values.size()) return false;
        out = values[at++];
        return true;
    }
};

int main() {
    std::vector<Stream> streams = {
        {"shard-a", {3, 11, 12, 40}},
        {"shard-b", {1, 2, 30}},
        {"shard-c", {5, 6, 7, 8}},
    };

    using Entry = std::pair<int, std::string>;
    std::priority_queue<Entry, std::vector<Entry>, std::greater<Entry>> heap;
    for (auto& s : streams) {
        int v;
        if (s.next(v)) heap.push({v, s.name});
    }

    std::cout << "merging three streams, holding one value from each:\\n";
    size_t peak = heap.size();
    std::vector<int> out;
    while (!heap.empty()) {
        auto [value, name] = heap.top();
        heap.pop();
        out.push_back(value);
        for (auto& s : streams) {
            if (s.name == name) {
                int v;
                if (s.next(v)) heap.push({v, name});
                break;
            }
        }
        peak = std::max(peak, heap.size());
        std::cout << "  took " << std::setw(3) << value << " from " << name
                  << ", heap now holds " << heap.size() << '\\n';
    }

    std::string merged = "[";
    for (size_t i = 0; i < out.size(); ++i) {
        if (i) merged += ", ";
        merged += std::to_string(out[i]);
    }
    std::cout << "\\nmerged: " << merged << "]\\n";
    std::cout << "peak memory: " << peak << " values, for " << out.size() << " values of output.\\n\\n";
    std::cout << "this is why the heap version matters. Sorting needs every value at once;\\n";
    std::cout << "this needs one per stream, so the inputs can be larger than memory —\\n";
    std::cout << "which is exactly what an external merge sort does over disk-backed runs.\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::cmp::Reverse;
use std::collections::BinaryHeap;

/// A cursor over a vector stands in for a file, a socket, or a shard —
/// read once, forward only.
struct Stream {
    name: String,
    values: Vec<i32>,
    at: usize,
}

impl Stream {
    fn next(&mut self) -> Option<i32> {
        if self.at >= self.values.len() {
            return None;
        }
        let v = self.values[self.at];
        self.at += 1;
        Some(v)
    }
}

fn main() {
    let mut streams = vec![
        Stream { name: "shard-a".into(), values: vec![3, 11, 12, 40], at: 0 },
        Stream { name: "shard-b".into(), values: vec![1, 2, 30], at: 0 },
        Stream { name: "shard-c".into(), values: vec![5, 6, 7, 8], at: 0 },
    ];

    let mut heap: BinaryHeap<Reverse<(i32, String)>> = BinaryHeap::new();
    for s in streams.iter_mut() {
        if let Some(v) = s.next() {
            heap.push(Reverse((v, s.name.clone())));
        }
    }

    println!("merging three streams, holding one value from each:");
    let mut peak = heap.len();
    let mut out: Vec<i32> = Vec::new();
    while let Some(Reverse((value, name))) = heap.pop() {
        out.push(value);
        if let Some(s) = streams.iter_mut().find(|s| s.name == name) {
            if let Some(v) = s.next() {
                heap.push(Reverse((v, name.clone())));
            }
        }
        peak = peak.max(heap.len());
        println!("  took {:>3} from {}, heap now holds {}", value, name, heap.len());
    }

    let parts: Vec<String> = out.iter().map(|v| v.to_string()).collect();
    println!();
    println!("merged: [{}]", parts.join(", "));
    println!("peak memory: {} values, for {} values of output.", peak, out.len());
    println!();
    println!("this is why the heap version matters. Sorting needs every value at once;");
    println!("this needs one per stream, so the inputs can be larger than memory —");
    println!("which is exactly what an external merge sort does over disk-backed runs.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"container/heap"
	"fmt"
	"strconv"
	"strings"
)

// A cursor over a slice stands in for a file, a socket, or a shard —
// read once, forward only.
type stream struct {
	name   string
	values []int
	at     int
}

func (s *stream) next() (int, bool) {
	if s.at >= len(s.values) {
		return 0, false
	}
	v := s.values[s.at]
	s.at++
	return v, true
}

type entry struct {
	value int
	name  string
}

type entries []entry

func (e entries) Len() int { return len(e) }
func (e entries) Less(i, j int) bool {
	if e[i].value != e[j].value {
		return e[i].value < e[j].value
	}
	return e[i].name < e[j].name
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
	// A slice, not a map: Go randomises map iteration and the initial fill
	// has to happen in a fixed order.
	streams := []*stream{
		{name: "shard-a", values: []int{3, 11, 12, 40}},
		{name: "shard-b", values: []int{1, 2, 30}},
		{name: "shard-c", values: []int{5, 6, 7, 8}},
	}

	h := &entries{}
	heap.Init(h)
	for _, s := range streams {
		if v, ok := s.next(); ok {
			heap.Push(h, entry{v, s.name})
		}
	}

	fmt.Println("merging three streams, holding one value from each:")
	peak := h.Len()
	var out []int
	for h.Len() > 0 {
		e := heap.Pop(h).(entry)
		out = append(out, e.value)
		for _, s := range streams {
			if s.name == e.name {
				if v, ok := s.next(); ok {
					heap.Push(h, entry{v, e.name})
				}
				break
			}
		}
		if h.Len() > peak {
			peak = h.Len()
		}
		fmt.Printf("  took %3d from %s, heap now holds %d\\n", e.value, e.name, h.Len())
	}

	parts := make([]string, len(out))
	for i, v := range out {
		parts[i] = strconv.Itoa(v)
	}
	fmt.Println()
	fmt.Println("merged: [" + strings.Join(parts, ", ") + "]")
	fmt.Printf("peak memory: %d values, for %d values of output.\\n", peak, len(out))
	fmt.Println()
	fmt.Println("this is why the heap version matters. Sorting needs every value at once;")
	fmt.Println("this needs one per stream, so the inputs can be larger than memory —")
	fmt.Println("which is exactly what an external merge sort does over disk-backed runs.")
}`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Merge k sorted linked lists.",
      answer:
        "Put the head of each list into a min-heap keyed by value \u2014 k entries. Pop the smallest, append it to the output, and if that node has a next, push the next. Repeat until the heap is empty. Each of the n nodes is pushed and popped exactly once, so it is O(n log k) time and O(k) extra space. The reason one node per list suffices is that a list is sorted, so its second node cannot be the global minimum while its first is unclaimed.",
    },
    {
      question: "Why not just concatenate all k lists and sort?",
      answer:
        "It works and it is O(n log n), and if everything fits in memory it is often faster in practice because Timsort and its relatives detect the existing runs and merge them with better constants than a hand-rolled heap. The heap wins when the data does not fit: it holds k cursors regardless of how much flows through, so it can merge files or shards larger than memory. That is the merge phase of an external merge sort, and it is the case worth naming in an interview because it is the one the concatenation cannot answer.",
    },
    {
      question: "You are given k sorted arrays and asked for the smallest range that includes at least one number from each. How does this help?",
      answer:
        "It is a k-way merge with a window over it. Hold one cursor per array in a min-heap and also track the maximum value currently under any cursor. At each step the range from the heap's root to that maximum contains one element from every array, so record it if it is the smallest so far, then advance the cursor that produced the minimum \u2014 that is the only move that can shrink the range. It is O(n log k), and it works because advancing the minimum is the only advance that can help.",
    },
  ],
  takeaways: [
    "The heap holds one cursor per sequence, not the sequences \u2014 k entries, whatever n is.",
    "One cursor each is sufficient because a sorted list's later elements cannot be needed before its first.",
    "Each pop is followed by at most one push, so the heap stays at k and the total is O(n log k).",
    "Concatenate-and-sort is often faster in memory, because adaptive sorts already detect and merge existing runs.",
    "The heap's real advantage is O(k) memory: it merges inputs that do not fit, which is exactly external merge sort.",
    "Top-k, k-way merge and smallest-range are one pattern: a small heap of frontier candidates, where taking one reveals at most one more.",
  ],
  status: "available",
};
