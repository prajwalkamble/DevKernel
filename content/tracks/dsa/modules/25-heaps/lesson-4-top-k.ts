import type { Lesson } from "@/content/types";

export const topKLesson: Lesson = {
  id: "dsa-heap-top-k",
  slug: "top-k-and-the-heap-that-is-backwards",
  moduleSlug: "heaps-and-priority-queues",
  title: "Top-K, and Why the Heap Points the Wrong Way",
  summary:
    "For the k largest you want a min-heap, which feels backwards until you notice what the root is for: it is the weakest thing you have kept, and therefore the bar every newcomer has to clear.",
  estimatedMinutes: 30,
  objectives: [
    "Explain why the k largest need a min-heap and the k smallest need a max-heap",
    "Keep the heap capped at k, and say what that buys over heapifying everything",
    "Compare O(n log k) against O(n log n) and locate where the win disappears",
    "Answer the streaming follow-up without changing the algorithm",
  ],
  sections: [
    {
      id: "the-inversion",
      heading: "The heap points the other way",
      body: [
        "The instinct for *give me the three largest* is a max-heap, and the instinct is wrong. Think about what the algorithm actually needs to ask at each step.",
        "You are carrying a set of candidates. A new value arrives. The only question is whether it belongs in the set \u2014 and it belongs if and only if it beats the **worst** thing currently there. So the element you need instant access to is the smallest of the ones you kept, which means a min-heap.",
        "A max-heap would put the largest kept value at the root, and the largest kept value is the one element the algorithm never has to consult. Every arrival would need a scan to find the weakest candidate, which is O(k) per element and throws the whole benefit away.",
        "The rule generalises and is worth memorising in this form: **the heap holds the answer, and its root is the thing most likely to be evicted from it.** For the k largest that is a min-heap; for the k smallest, a max-heap; for the k closest to a point, a max-heap of distances.",
      ],
      examples: [
        {
          id: "top-k-trace",
          title: "A min-heap of size k, and what the root is for",
          lang: "python",
          code: `import heapq

values = [7, 2, 9, 4, 1, 8, 3, 6, 5]
k = 3

heap = []
print(f"keeping the {k} largest, in a min-heap of size {k}")
print(f"{'value':>6}  {'action':<28} {'heap':<14} {'smallest kept':>14}")
print("-" * 68)
for v in values:
    if len(heap) < k:
        heapq.heappush(heap, v)
        action = "room left — keep it"
    elif v > heap[0]:
        evicted = heapq.heappushpop(heap, v)
        action = f"beats {evicted} — evict it"
    else:
        action = f"loses to {heap[0]} — drop it"
    print(f"{v:>6}  {action:<28} {str(sorted(heap)):<14} {heap[0]:>14}")

print()
print("the k largest:", sorted(heap, reverse=True))
print()
print("the heap holds the k largest, and its root is the *smallest* of them —")
print("which is exactly the value a new arrival has to beat to get in.")
print("a max-heap of size k would put the largest on top, and the largest is")
print("the one element you never need to look at.")`,
          output: `keeping the 3 largest, in a min-heap of size 3
 value  action                       heap            smallest kept
--------------------------------------------------------------------
     7  room left — keep it          [7]                         7
     2  room left — keep it          [2, 7]                      2
     9  room left — keep it          [2, 7, 9]                   2
     4  beats 2 — evict it           [4, 7, 9]                   4
     1  loses to 4 — drop it         [4, 7, 9]                   4
     8  beats 4 — evict it           [7, 8, 9]                   7
     3  loses to 7 — drop it         [7, 8, 9]                   7
     6  loses to 7 — drop it         [7, 8, 9]                   7
     5  loses to 7 — drop it         [7, 8, 9]                   7

the k largest: [9, 8, 7]

the heap holds the k largest, and its root is the *smallest* of them —
which is exactly the value a new arrival has to beat to get in.
a max-heap of size k would put the largest on top, and the largest is
the one element you never need to look at.`,
          explanation:
            "The root of the heap is the *weakest thing currently in the answer*, which makes the admission test a single O(1) comparison: anything that does not beat it cannot belong. That is the whole reason the heap is a min-heap when the question asks for the largest. The heap never grows past k, so each of the n arrivals costs O(log k) at worst and most cost nothing at all \u2014 on this input, four of the nine were rejected without a single swap.",
          alternates: [
            {
              lang: "javascript",
              code: `// A min-heap of numbers, written out because JavaScript has none.
const heap = [];
function push(v) {
  heap.push(v);
  let i = heap.length - 1;
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (heap[p] <= heap[i]) break;
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
        if (c < heap.length && heap[c] < heap[m]) m = c;
      }
      if (m === i) break;
      [heap[i], heap[m]] = [heap[m], heap[i]];
      i = m;
    }
  }
  return top;
}

const values = [7, 2, 9, 4, 1, 8, 3, 6, 5];
const k = 3;
const padStart = (s, w) => String(s).padStart(w);
const padEnd = (s, w) => String(s).padEnd(w);
const show = (a) => "[" + [...a].sort((x, y) => x - y).join(", ") + "]";

console.log(\`keeping the \${k} largest, in a min-heap of size \${k}\`);
console.log(\`\${padStart("value", 6)}  \${padEnd("action", 28)} \${padEnd("heap", 14)} \${padStart("smallest kept", 14)}\`);
console.log("-".repeat(68));
for (const v of values) {
  let action;
  if (heap.length < k) {
    push(v);
    action = "room left — keep it";
  } else if (v > heap[0]) {
    const evicted = pop();               // push-then-pop, the same as heappushpop
    push(v);
    action = \`beats \${evicted} — evict it\`;
  } else {
    action = \`loses to \${heap[0]} — drop it\`;
  }
  console.log(\`\${padStart(v, 6)}  \${padEnd(action, 28)} \${padEnd(show(heap), 14)} \${padStart(heap[0], 14)}\`);
}

console.log();
console.log("the k largest: [" + [...heap].sort((a, b) => b - a).join(", ") + "]");
console.log();
console.log("the heap holds the k largest, and its root is the *smallest* of them —");
console.log("which is exactly the value a new arrival has to beat to get in.");
console.log("a max-heap of size k would put the largest on top, and the largest is");
console.log("the one element you never need to look at.");`,
            },
            {
              lang: "typescript",
              code: `// A min-heap of numbers, written out because JavaScript has none.
const heap: number[] = [];
function push(v: number): void {
  heap.push(v);
  let i = heap.length - 1;
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (heap[p] <= heap[i]) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
}
function pop(): number {
  const top = heap[0];
  const last = heap.pop() as number;
  if (heap.length > 0) {
    heap[0] = last;
    let i = 0;
    for (;;) {
      let m = i;
      for (const c of [2 * i + 1, 2 * i + 2]) {
        if (c < heap.length && heap[c] < heap[m]) m = c;
      }
      if (m === i) break;
      [heap[i], heap[m]] = [heap[m], heap[i]];
      i = m;
    }
  }
  return top;
}

const values = [7, 2, 9, 4, 1, 8, 3, 6, 5];
const k = 3;
const padStart = (s: string | number, w: number): string => String(s).padStart(w);
const padEnd = (s: string | number, w: number): string => String(s).padEnd(w);
const show = (a: number[]): string => "[" + [...a].sort((x: number, y: number) => x - y).join(", ") + "]";

console.log(\`keeping the \${k} largest, in a min-heap of size \${k}\`);
console.log(\`\${padStart("value", 6)}  \${padEnd("action", 28)} \${padEnd("heap", 14)} \${padStart("smallest kept", 14)}\`);
console.log("-".repeat(68));
for (const v of values) {
  let action: string;
  if (heap.length < k) {
    push(v);
    action = "room left — keep it";
  } else if (v > heap[0]) {
    const evicted = pop();               // push-then-pop, the same as heappushpop
    push(v);
    action = \`beats \${evicted} — evict it\`;
  } else {
    action = \`loses to \${heap[0]} — drop it\`;
  }
  console.log(\`\${padStart(v, 6)}  \${padEnd(action, 28)} \${padEnd(show(heap), 14)} \${padStart(heap[0], 14)}\`);
}

console.log();
console.log("the k largest: [" + [...heap].sort((a: number, b: number) => b - a).join(", ") + "]");
console.log();
console.log("the heap holds the k largest, and its root is the *smallest* of them —");
console.log("which is exactly the value a new arrival has to beat to get in.");
console.log("a max-heap of size k would put the largest on top, and the largest is");
console.log("the one element you never need to look at.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.PriorityQueue;

public class Main {
    public static void main(String[] args) {
        int[] values = {7, 2, 9, 4, 1, 8, 3, 6, 5};
        int k = 3;
        PriorityQueue<Integer> heap = new PriorityQueue<>();   // a min-heap by default

        System.out.printf("keeping the %d largest, in a min-heap of size %d%n", k, k);
        System.out.printf("%6s  %-28s %-14s %14s%n", "value", "action", "heap", "smallest kept");
        System.out.println("-".repeat(68));
        for (int v : values) {
            String action;
            if (heap.size() < k) {
                heap.add(v);
                action = "room left — keep it";
            } else if (v > heap.peek()) {
                int evicted = heap.poll();
                heap.add(v);
                action = "beats " + evicted + " — evict it";
            } else {
                action = "loses to " + heap.peek() + " — drop it";
            }
            List<Integer> shown = new ArrayList<>(heap);
            Collections.sort(shown);
            System.out.printf("%6d  %-28s %-14s %14d%n", v, action, shown, heap.peek());
        }

        List<Integer> largest = new ArrayList<>(heap);
        largest.sort(Collections.reverseOrder());
        System.out.println();
        System.out.println("the k largest: " + largest);
        System.out.println();
        System.out.println("the heap holds the k largest, and its root is the *smallest* of them —");
        System.out.println("which is exactly the value a new arrival has to beat to get in.");
        System.out.println("a max-heap of size k would put the largest on top, and the largest is");
        System.out.println("the one element you never need to look at.");
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
#include <vector>

/* \`std::setw\` counts bytes, and the em-dash in these action strings is three
   of them — so setw(28) would leave the column two characters short. Python's
   \`{:<28}\` counts characters, so the padding has to be done by hand. */
static size_t char_len(const std::string& s) {
    size_t n = 0;
    for (unsigned char c : s) {
        if ((c & 0xC0) != 0x80) ++n;   // count anything that is not a continuation byte
    }
    return n;
}

static std::string pad_right(const std::string& s, size_t w) {
    size_t n = char_len(s);
    return n >= w ? s : s + std::string(w - n, ' ');
}

static std::string show(std::vector<int> a) {
    std::sort(a.begin(), a.end());
    std::string out = "[";
    for (size_t i = 0; i < a.size(); ++i) {
        if (i) out += ", ";
        out += std::to_string(a[i]);
    }
    return out + "]";
}

int main() {
    const std::vector<int> values = {7, 2, 9, 4, 1, 8, 3, 6, 5};
    const int k = 3;
    // std::priority_queue is a max-heap by default; \`greater\` makes it the
    // min-heap this needs.
    std::priority_queue<int, std::vector<int>, std::greater<int>> heap;
    std::vector<int> mirror;                 // only so the contents can be printed

    std::cout << "keeping the " << k << " largest, in a min-heap of size " << k << '\\n';
    std::cout << std::right << std::setw(6) << "value" << "  " << std::left << std::setw(28)
              << "action" << ' ' << std::setw(14) << "heap" << ' '
              << std::right << std::setw(14) << "smallest kept" << '\\n';
    std::cout << std::string(68, '-') << '\\n';
    for (int v : values) {
        std::string action;
        if (static_cast<int>(heap.size()) < k) {
            heap.push(v);
            mirror.push_back(v);
            action = "room left — keep it";
        } else if (v > heap.top()) {
            int evicted = heap.top();
            heap.pop();
            heap.push(v);
            mirror.erase(std::find(mirror.begin(), mirror.end(), evicted));
            mirror.push_back(v);
            action = "beats " + std::to_string(evicted) + " — evict it";
        } else {
            action = "loses to " + std::to_string(heap.top()) + " — drop it";
        }
        std::cout << std::right << std::setw(6) << v << "  " << pad_right(action, 28)
                  << ' ' << std::left << std::setw(14) << show(mirror) << ' '
                  << std::right << std::setw(14) << heap.top() << '\\n';
    }

    std::sort(mirror.begin(), mirror.end(), std::greater<int>());
    std::string largest = "[";
    for (size_t i = 0; i < mirror.size(); ++i) {
        if (i) largest += ", ";
        largest += std::to_string(mirror[i]);
    }
    std::cout << "\\nthe k largest: " << largest << "]\\n\\n";
    std::cout << "the heap holds the k largest, and its root is the *smallest* of them —\\n";
    std::cout << "which is exactly the value a new arrival has to beat to get in.\\n";
    std::cout << "a max-heap of size k would put the largest on top, and the largest is\\n";
    std::cout << "the one element you never need to look at.\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::cmp::Reverse;
use std::collections::BinaryHeap;

fn show(heap: &BinaryHeap<Reverse<i32>>) -> String {
    let mut v: Vec<i32> = heap.iter().map(|Reverse(x)| *x).collect();
    v.sort_unstable();
    let parts: Vec<String> = v.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn main() {
    let values = [7, 2, 9, 4, 1, 8, 3, 6, 5];
    let k = 3usize;
    // BinaryHeap is a max-heap, so Reverse turns it into the min-heap this needs.
    let mut heap: BinaryHeap<Reverse<i32>> = BinaryHeap::new();

    println!("keeping the {} largest, in a min-heap of size {}", k, k);
    println!("{:>6}  {:<28} {:<14} {:>14}", "value", "action", "heap", "smallest kept");
    println!("{}", "-".repeat(68));
    for v in values {
        let action = if heap.len() < k {
            heap.push(Reverse(v));
            "room left — keep it".to_string()
        } else if v > heap.peek().unwrap().0 {
            let Reverse(evicted) = heap.pop().unwrap();
            heap.push(Reverse(v));
            format!("beats {} — evict it", evicted)
        } else {
            format!("loses to {} — drop it", heap.peek().unwrap().0)
        };
        println!("{:>6}  {:<28} {:<14} {:>14}", v, action, show(&heap), heap.peek().unwrap().0);
    }

    let mut largest: Vec<i32> = heap.iter().map(|Reverse(x)| *x).collect();
    largest.sort_unstable_by(|a, b| b.cmp(a));
    let parts: Vec<String> = largest.iter().map(|x| x.to_string()).collect();
    println!();
    println!("the k largest: [{}]", parts.join(", "));
    println!();
    println!("the heap holds the k largest, and its root is the *smallest* of them —");
    println!("which is exactly the value a new arrival has to beat to get in.");
    println!("a max-heap of size k would put the largest on top, and the largest is");
    println!("the one element you never need to look at.");
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

type minHeap []int

func (h minHeap) Len() int            { return len(h) }
func (h minHeap) Less(a, b int) bool  { return h[a] < h[b] }
func (h minHeap) Swap(a, b int)       { h[a], h[b] = h[b], h[a] }
func (h *minHeap) Push(x interface{}) { *h = append(*h, x.(int)) }
func (h *minHeap) Pop() interface{} {
	old := *h
	n := len(old)
	last := old[n-1]
	*h = old[:n-1]
	return last
}

func show(h minHeap) string {
	v := append([]int(nil), h...)
	sort.Ints(v)
	parts := make([]string, len(v))
	for i, x := range v {
		parts[i] = strconv.Itoa(x)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func main() {
	values := []int{7, 2, 9, 4, 1, 8, 3, 6, 5}
	k := 3
	h := &minHeap{}
	heap.Init(h)

	fmt.Printf("keeping the %d largest, in a min-heap of size %d\\n", k, k)
	fmt.Printf("%6s  %-28s %-14s %14s\\n", "value", "action", "heap", "smallest kept")
	fmt.Println(strings.Repeat("-", 68))
	for _, v := range values {
		var action string
		switch {
		case h.Len() < k:
			heap.Push(h, v)
			action = "room left — keep it"
		case v > (*h)[0]:
			evicted := heap.Pop(h).(int)
			heap.Push(h, v)
			action = fmt.Sprintf("beats %d — evict it", evicted)
		default:
			action = fmt.Sprintf("loses to %d — drop it", (*h)[0])
		}
		fmt.Printf("%6d  %-28s %-14s %14d\\n", v, action, show(*h), (*h)[0])
	}

	largest := append([]int(nil), (*h)...)
	sort.Sort(sort.Reverse(sort.IntSlice(largest)))
	parts := make([]string, len(largest))
	for i, x := range largest {
		parts[i] = strconv.Itoa(x)
	}
	fmt.Println()
	fmt.Println("the k largest: [" + strings.Join(parts, ", ") + "]")
	fmt.Println()
	fmt.Println("the heap holds the k largest, and its root is the *smallest* of them —")
	fmt.Println("which is exactly the value a new arrival has to beat to get in.")
	fmt.Println("a max-heap of size k would put the largest on top, and the largest is")
	fmt.Println("the one element you never need to look at.")
}`,
            },
          ],
        },
      ],
      visual: {
        id: "topk-visual",
        kind: "heap",
        title: "The root as the bar to clear",
      },
    },
    {
      id: "what-it-buys",
      heading: "n log k, and where that stops mattering",
      body: [
        "Sorting everything and slicing the front is O(n log n), correct, one line, and frequently the right answer. The heap is O(n log k), and the case for it has to be made rather than assumed.",
        "The saving is genuine when k is small and n is large \u2014 a sixth of the work at n = 10\u2076 and k = 10. It shrinks as k grows, and at k = n the heap approach is a sort with worse constants than the one in the standard library.",
        "There is also a third option worth naming: **quickselect** partitions around a pivot and finds the k-th largest in O(n) expected time, then the k largest fall out of the partition for free. It beats both when all the data is in memory and you do not need the result ordered. It is O(n\u00b2) in the worst case, needs random pivots to avoid that in practice, and it reorders the input.",
        "The honest summary: sort for clarity, heap for streams and small k, quickselect when n is huge, memory-resident, and the constant factor is worth the extra code.",
      ],
      examples: [
        {
          id: "top-k-cost",
          title: "Against sorting, and where the win ends",
          lang: "python",
          code: `import heapq
import math

seed = 7


def next_rand():
    global seed
    seed = (seed * 16807) % 2147483647
    return seed


def top_k_by_heap(values, k):
    """A heap of size k: O(n log k)."""
    heap = []
    for v in values:
        if len(heap) < k:
            heapq.heappush(heap, v)
        elif v > heap[0]:
            heapq.heappushpop(heap, v)
    return sorted(heap, reverse=True)


def top_k_by_sorting(values, k):
    """Sort everything, take k: O(n log n)."""
    return sorted(values, reverse=True)[:k]


print(f"{'n':>9} {'k':>5} {'n log2 k':>12} {'n log2 n':>12} {'sort/heap':>10}")
print("-" * 54)
for n in (1_000, 100_000, 1_000_000):
    for k in (10, 1_000):
        heap_work = n * math.log2(k)
        sort_work = n * math.log2(n)
        print(f"{n:>9} {k:>5} {heap_work:>12,.0f} {sort_work:>12,.0f} {sort_work / heap_work:>9.1f}x")

print()
data = [next_rand() % 100_000 for _ in range(20_000)]
by_heap = top_k_by_heap(data, 10)
by_sort = top_k_by_sorting(data, 10)
print("same answer on 20,000 values:", "yes" if by_heap == by_sort else "no")
print("top 10:", by_heap)
print()
print("the win is real but bounded: k has to stay small for log k to beat log n.")
print("at k = n the heap approach *is* a sort, and a slower one than the library's.")`,
          output: `        n     k     n log2 k     n log2 n  sort/heap
------------------------------------------------------
     1000    10        3,322        9,966       3.0x
     1000  1000        9,966        9,966       1.0x
   100000    10      332,193    1,660,964       5.0x
   100000  1000      996,578    1,660,964       1.7x
  1000000    10    3,321,928   19,931,569       6.0x
  1000000  1000    9,965,784   19,931,569       2.0x

same answer on 20,000 values: yes
top 10: [99998, 99998, 99993, 99992, 99987, 99986, 99982, 99981, 99955, 99952]

the win is real but bounded: k has to stay small for log k to beat log n.
at k = n the heap approach *is* a sort, and a slower one than the library's.`,
          explanation:
            "n log k against n log n is a real saving but a bounded one, and the table is worth reading before reaching for the heap reflexively. At k = 10 the heap does a sixth of the work at a million elements; at k = 1000 it does half; at k = n it does the same work as a sort while being a worse sort. The other thing the table does not show is constants \u2014 a library sort is a tuned, cache-friendly, branch-predictable routine, and a heap is a pointer-jumping walk over a tree, so for small n the sort frequently wins outright despite the asymptotics.",
          alternates: [
            {
              lang: "javascript",
              code: `let seed = 7;
function nextRand() {
  seed = (seed * 16807) % 2147483647;
  return seed;
}

const heap = [];
function push(v) {
  heap.push(v);
  let i = heap.length - 1;
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (heap[p] <= heap[i]) break;
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
        if (c < heap.length && heap[c] < heap[m]) m = c;
      }
      if (m === i) break;
      [heap[i], heap[m]] = [heap[m], heap[i]];
      i = m;
    }
  }
  return top;
}

/** A heap of size k: O(n log k). */
function topKByHeap(values, k) {
  heap.length = 0;
  for (const v of values) {
    if (heap.length < k) push(v);
    else if (v > heap[0]) {
      pop();
      push(v);
    }
  }
  return [...heap].sort((a, b) => b - a);
}

/** Sort everything, take k: O(n log n). */
function topKBySorting(values, k) {
  return [...values].sort((a, b) => b - a).slice(0, k);
}

const pad = (s, w) => String(s).padStart(w);
const group = (n) => String(Math.round(n)).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");

console.log(\`\${pad("n", 9)} \${pad("k", 5)} \${pad("n log2 k", 12)} \${pad("n log2 n", 12)} \${pad("sort/heap", 10)}\`);
console.log("-".repeat(54));
for (const n of [1000, 100000, 1000000]) {
  for (const k of [10, 1000]) {
    const heapWork = n * Math.log2(k);
    const sortWork = n * Math.log2(n);
    console.log(\`\${pad(n, 9)} \${pad(k, 5)} \${pad(group(heapWork), 12)} \${pad(group(sortWork), 12)} \${pad((sortWork / heapWork).toFixed(1), 9)}x\`);
  }
}

console.log();
const data = Array.from({ length: 20000 }, () => nextRand() % 100000);
const byHeap = topKByHeap(data, 10);
const bySort = topKBySorting(data, 10);
const same = byHeap.length === bySort.length && byHeap.every((v, i) => v === bySort[i]);
console.log("same answer on 20,000 values:", same ? "yes" : "no");
console.log("top 10: [" + byHeap.join(", ") + "]");
console.log();
console.log("the win is real but bounded: k has to stay small for log k to beat log n.");
console.log("at k = n the heap approach *is* a sort, and a slower one than the library's.");`,
            },
            {
              lang: "typescript",
              code: `let seed = 7;
function nextRand(): number {
  seed = (seed * 16807) % 2147483647;
  return seed;
}

const heap: number[] = [];
function push(v: number): void {
  heap.push(v);
  let i = heap.length - 1;
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (heap[p] <= heap[i]) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
}
function pop(): number {
  const top = heap[0];
  const last = heap.pop() as number;
  if (heap.length > 0) {
    heap[0] = last;
    let i = 0;
    for (;;) {
      let m = i;
      for (const c of [2 * i + 1, 2 * i + 2]) {
        if (c < heap.length && heap[c] < heap[m]) m = c;
      }
      if (m === i) break;
      [heap[i], heap[m]] = [heap[m], heap[i]];
      i = m;
    }
  }
  return top;
}

/** A heap of size k: O(n log k). */
function topKByHeap(values: number[], k: number): number[] {
  heap.length = 0;
  for (const v of values) {
    if (heap.length < k) push(v);
    else if (v > heap[0]) {
      pop();
      push(v);
    }
  }
  return [...heap].sort((a: number, b: number) => b - a);
}

/** Sort everything, take k: O(n log n). */
function topKBySorting(values: number[], k: number): number[] {
  return [...values].sort((a: number, b: number) => b - a).slice(0, k);
}

const pad = (s: string | number, w: number): string => String(s).padStart(w);
const group = (n: number): string => String(Math.round(n)).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");

console.log(\`\${pad("n", 9)} \${pad("k", 5)} \${pad("n log2 k", 12)} \${pad("n log2 n", 12)} \${pad("sort/heap", 10)}\`);
console.log("-".repeat(54));
for (const n of [1000, 100000, 1000000]) {
  for (const k of [10, 1000]) {
    const heapWork = n * Math.log2(k);
    const sortWork = n * Math.log2(n);
    console.log(\`\${pad(n, 9)} \${pad(k, 5)} \${pad(group(heapWork), 12)} \${pad(group(sortWork), 12)} \${pad((sortWork / heapWork).toFixed(1), 9)}x\`);
  }
}

console.log();
const data = Array.from({ length: 20000 }, () => nextRand() % 100000);
const byHeap = topKByHeap(data, 10);
const bySort = topKBySorting(data, 10);
const same = byHeap.length === bySort.length && byHeap.every((v: number, i: number) => v === bySort[i]);
console.log("same answer on 20,000 values:", same ? "yes" : "no");
console.log("top 10: [" + byHeap.join(", ") + "]");
console.log();
console.log("the win is real but bounded: k has to stay small for log k to beat log n.");
console.log("at k = n the heap approach *is* a sort, and a slower one than the library's.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.PriorityQueue;

public class Main {
    static long seed = 7;

    static long nextRand() {
        seed = (seed * 16807) % 2147483647L;
        return seed;
    }

    /** A heap of size k: O(n log k). */
    static List<Integer> topKByHeap(int[] values, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int v : values) {
            if (heap.size() < k) heap.add(v);
            else if (v > heap.peek()) {
                heap.poll();
                heap.add(v);
            }
        }
        List<Integer> out = new ArrayList<>(heap);
        out.sort(Collections.reverseOrder());
        return out;
    }

    /** Sort everything, take k: O(n log n). */
    static List<Integer> topKBySorting(int[] values, int k) {
        List<Integer> all = new ArrayList<>();
        for (int v : values) all.add(v);
        all.sort(Collections.reverseOrder());
        return all.subList(0, k);
    }

    public static void main(String[] args) {
        System.out.printf("%9s %5s %12s %12s %10s%n", "n", "k", "n log2 k", "n log2 n", "sort/heap");
        System.out.println("-".repeat(54));
        for (int n : new int[]{1_000, 100_000, 1_000_000}) {
            for (int k : new int[]{10, 1_000}) {
                double heapWork = n * (Math.log(k) / Math.log(2));
                double sortWork = n * (Math.log(n) / Math.log(2));
                System.out.printf("%9d %5d %,12.0f %,12.0f %9.1fx%n", n, k, heapWork, sortWork, sortWork / heapWork);
            }
        }

        System.out.println();
        int[] data = new int[20_000];
        for (int i = 0; i < data.length; i++) data[i] = (int) (nextRand() % 100_000);
        List<Integer> byHeap = topKByHeap(data, 10);
        List<Integer> bySort = topKBySorting(data, 10);
        System.out.println("same answer on 20,000 values: " + (byHeap.equals(bySort) ? "yes" : "no"));
        System.out.println("top 10: " + byHeap);
        System.out.println();
        System.out.println("the win is real but bounded: k has to stay small for log k to beat log n.");
        System.out.println("at k = n the heap approach *is* a sort, and a slower one than the library's.");
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
#include <vector>

static long long seed = 7;

static long long next_rand() {
    seed = (seed * 16807) % 2147483647LL;
    return seed;
}

// A heap of size k: O(n log k).
static std::vector<int> top_k_by_heap(const std::vector<int>& values, int k) {
    std::priority_queue<int, std::vector<int>, std::greater<int>> heap;
    for (int v : values) {
        if (static_cast<int>(heap.size()) < k) heap.push(v);
        else if (v > heap.top()) {
            heap.pop();
            heap.push(v);
        }
    }
    std::vector<int> out;
    while (!heap.empty()) {
        out.push_back(heap.top());
        heap.pop();
    }
    std::sort(out.begin(), out.end(), std::greater<int>());
    return out;
}

// Sort everything, take k: O(n log n).
static std::vector<int> top_k_by_sorting(std::vector<int> values, int k) {
    std::sort(values.begin(), values.end(), std::greater<int>());
    values.resize(static_cast<size_t>(k));
    return values;
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
    std::cout << std::right << std::setw(9) << "n" << ' ' << std::setw(5) << "k" << ' '
              << std::setw(12) << "n log2 k" << ' ' << std::setw(12) << "n log2 n" << ' '
              << std::setw(10) << "sort/heap" << '\\n';
    std::cout << std::string(54, '-') << '\\n';
    for (long long n : {1000LL, 100000LL, 1000000LL}) {
        for (long long k : {10LL, 1000LL}) {
            double heap_work = static_cast<double>(n) * std::log2(static_cast<double>(k));
            double sort_work = static_cast<double>(n) * std::log2(static_cast<double>(n));
            std::ostringstream ratio;
            ratio << std::fixed << std::setprecision(1) << sort_work / heap_work;
            std::cout << std::setw(9) << n << ' ' << std::setw(5) << k << ' '
                      << std::setw(12) << group(std::llround(heap_work)) << ' '
                      << std::setw(12) << group(std::llround(sort_work)) << ' '
                      << std::setw(9) << ratio.str() << "x" << '\\n';
        }
    }

    std::cout << '\\n';
    std::vector<int> data(20000);
    for (auto& v : data) v = static_cast<int>(next_rand() % 100000);
    std::vector<int> by_heap = top_k_by_heap(data, 10);
    std::vector<int> by_sort = top_k_by_sorting(data, 10);
    std::cout << "same answer on 20,000 values: " << (by_heap == by_sort ? "yes" : "no") << '\\n';
    std::string top = "[";
    for (size_t i = 0; i < by_heap.size(); ++i) {
        if (i) top += ", ";
        top += std::to_string(by_heap[i]);
    }
    std::cout << "top 10: " << top << "]\\n\\n";
    std::cout << "the win is real but bounded: k has to stay small for log k to beat log n.\\n";
    std::cout << "at k = n the heap approach *is* a sort, and a slower one than the library's.\\n";
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

/// A heap of size k: O(n log k).
fn top_k_by_heap(values: &[i32], k: usize) -> Vec<i32> {
    let mut heap: BinaryHeap<Reverse<i32>> = BinaryHeap::new();
    for &v in values {
        if heap.len() < k {
            heap.push(Reverse(v));
        } else if v > heap.peek().unwrap().0 {
            heap.pop();
            heap.push(Reverse(v));
        }
    }
    let mut out: Vec<i32> = heap.into_iter().map(|Reverse(x)| x).collect();
    out.sort_unstable_by(|a, b| b.cmp(a));
    out
}

/// Sort everything, take k: O(n log n).
fn top_k_by_sorting(values: &[i32], k: usize) -> Vec<i32> {
    let mut all = values.to_vec();
    all.sort_unstable_by(|a, b| b.cmp(a));
    all.truncate(k);
    all
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
    println!("{:>9} {:>5} {:>12} {:>12} {:>10}", "n", "k", "n log2 k", "n log2 n", "sort/heap");
    println!("{}", "-".repeat(54));
    for n in [1_000i64, 100_000, 1_000_000] {
        for k in [10i64, 1_000] {
            let heap_work = n as f64 * (k as f64).log2();
            let sort_work = n as f64 * (n as f64).log2();
            println!("{:>9} {:>5} {:>12} {:>12} {:>9.1}x", n, k,
                     group(heap_work.round() as i64), group(sort_work.round() as i64),
                     sort_work / heap_work);
        }
    }

    println!();
    let mut rng = Lehmer { seed: 7 };
    let data: Vec<i32> = (0..20_000).map(|_| (rng.next() % 100_000) as i32).collect();
    let by_heap = top_k_by_heap(&data, 10);
    let by_sort = top_k_by_sorting(&data, 10);
    println!("same answer on 20,000 values: {}", if by_heap == by_sort { "yes" } else { "no" });
    let parts: Vec<String> = by_heap.iter().map(|v| v.to_string()).collect();
    println!("top 10: [{}]", parts.join(", "));
    println!();
    println!("the win is real but bounded: k has to stay small for log k to beat log n.");
    println!("at k = n the heap approach *is* a sort, and a slower one than the library's.");
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

type minHeap []int

func (h minHeap) Len() int            { return len(h) }
func (h minHeap) Less(a, b int) bool  { return h[a] < h[b] }
func (h minHeap) Swap(a, b int)       { h[a], h[b] = h[b], h[a] }
func (h *minHeap) Push(x interface{}) { *h = append(*h, x.(int)) }
func (h *minHeap) Pop() interface{} {
	old := *h
	n := len(old)
	last := old[n-1]
	*h = old[:n-1]
	return last
}

var seed int64 = 7

func nextRand() int64 {
	seed = (seed * 16807) % 2147483647
	return seed
}

// topKByHeap keeps a heap of size k: O(n log k).
func topKByHeap(values []int, k int) []int {
	h := &minHeap{}
	heap.Init(h)
	for _, v := range values {
		if h.Len() < k {
			heap.Push(h, v)
		} else if v > (*h)[0] {
			heap.Pop(h)
			heap.Push(h, v)
		}
	}
	out := append([]int(nil), (*h)...)
	sort.Sort(sort.Reverse(sort.IntSlice(out)))
	return out
}

// topKBySorting sorts everything and takes k: O(n log n).
func topKBySorting(values []int, k int) []int {
	all := append([]int(nil), values...)
	sort.Sort(sort.Reverse(sort.IntSlice(all)))
	return all[:k]
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
	fmt.Printf("%9s %5s %12s %12s %10s\\n", "n", "k", "n log2 k", "n log2 n", "sort/heap")
	fmt.Println(strings.Repeat("-", 54))
	for _, n := range []int64{1000, 100000, 1000000} {
		for _, k := range []int64{10, 1000} {
			heapWork := float64(n) * math.Log2(float64(k))
			sortWork := float64(n) * math.Log2(float64(n))
			fmt.Printf("%9d %5d %12s %12s %9.1fx\\n", n, k,
				group(int64(math.Round(heapWork))), group(int64(math.Round(sortWork))),
				sortWork/heapWork)
		}
	}

	fmt.Println()
	data := make([]int, 20000)
	for i := range data {
		data[i] = int(nextRand() % 100000)
	}
	byHeap := topKByHeap(data, 10)
	bySort := topKBySorting(data, 10)
	same := "yes"
	for i := range byHeap {
		if byHeap[i] != bySort[i] {
			same = "no"
			break
		}
	}
	fmt.Println("same answer on 20,000 values:", same)
	parts := make([]string, len(byHeap))
	for i, v := range byHeap {
		parts[i] = strconv.Itoa(v)
	}
	fmt.Println("top 10: [" + strings.Join(parts, ", ") + "]")
	fmt.Println()
	fmt.Println("the win is real but bounded: k has to stay small for log k to beat log n.")
	fmt.Println("at k = n the heap approach *is* a sort, and a slower one than the library's.")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "the-follow-up",
      heading: "The question behind the question",
      body: [
        "Top-K is asked so often not because the answer is hard but because the follow-up separates people, and the follow-up is always about scale.",
        "*What if there are a billion records?* The capped heap already handles it \u2014 it holds k, not n. *What if it is a stream with no end?* Same code; the heap is the running answer and can be read at any moment. *What if the data is spread over a hundred machines?* Each machine keeps its own top k, the coordinator merges a hundred heaps of k, which is the same algorithm one level up.",
        "None of those need a new idea, which is the point. Choosing the capped min-heap at the start is what makes all three answers immediate, and choosing the heapify-everything version means starting over.",
      ],
      examples: [
        {
          id: "wrong-heap",
          title: "The version that does not survive the follow-up",
          lang: "python",
          code: `import heapq

values = [7, 2, 9, 4, 1, 8, 3, 6, 5]
k = 3

# The tempting version: a max-heap of everything, popped k times.
max_heap = [-v for v in values]
heapq.heapify(max_heap)
answer = [-heapq.heappop(max_heap) for _ in range(k)]
print("max-heap of all n, popped k times:", answer)
print(f"  correct, but the heap held all {len(values)} values")
print(f"  O(n) to build + O(k log n) to pop — fine when n fits in memory")
print()

# The version that scales: a min-heap of only k.
min_heap = []
for v in values:
    heapq.heappush(min_heap, v)
    if len(min_heap) > k:
        heapq.heappop(min_heap)          # evict the smallest kept
print("min-heap capped at k:            ", sorted(min_heap, reverse=True))
print(f"  the heap never held more than {k} values")
print("  O(n log k), and it works on a stream that does not fit in memory")
print()
print("both are correct. The second is the one that survives the follow-up")
print("question, which is always some version of \\"now n does not fit\\".")`,
          output: `max-heap of all n, popped k times: [9, 8, 7]
  correct, but the heap held all 9 values
  O(n) to build + O(k log n) to pop — fine when n fits in memory

min-heap capped at k:             [9, 8, 7]
  the heap never held more than 3 values
  O(n log k), and it works on a stream that does not fit in memory

both are correct. The second is the one that survives the follow-up
question, which is always some version of "now n does not fit".`,
          explanation:
            "Both produce the right answer, and in an interview the difference between them is the entire point of the question. Heapifying all of n and popping k times is O(n + k log n) and needs every element in memory at once. Capping a min-heap at k is O(n log k) and needs k. When the follow-up arrives \u2014 and it always does, phrased as *now imagine a billion records* or *now it is a stream* \u2014 the first approach has nowhere to go and the second is already the answer.",
          alternates: [
            {
              lang: "javascript",
              code: `function siftUp(a, i, less) {
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (!less(a[i], a[p])) break;
    [a[p], a[i]] = [a[i], a[p]];
    i = p;
  }
}
function siftDown(a, i, less) {
  for (;;) {
    let m = i;
    for (const c of [2 * i + 1, 2 * i + 2]) {
      if (c < a.length && less(a[c], a[m])) m = c;
    }
    if (m === i) return;
    [a[i], a[m]] = [a[m], a[i]];
    i = m;
  }
}
function push(a, v, less) {
  a.push(v);
  siftUp(a, a.length - 1, less);
}
function pop(a, less) {
  const top = a[0];
  const last = a.pop();
  if (a.length > 0) {
    a[0] = last;
    siftDown(a, 0, less);
  }
  return top;
}

const values = [7, 2, 9, 4, 1, 8, 3, 6, 5];
const k = 3;

// The tempting version: a max-heap of everything, popped k times.
const bigger = (x, y) => x > y;
const maxHeap = [];
for (const v of values) push(maxHeap, v, bigger);
const answer = [];
for (let i = 0; i < k; i++) answer.push(pop(maxHeap, bigger));
console.log("max-heap of all n, popped k times: [" + answer.join(", ") + "]");
console.log(\`  correct, but the heap held all \${values.length} values\`);
console.log("  O(n) to build + O(k log n) to pop — fine when n fits in memory");
console.log();

// The version that scales: a min-heap of only k.
const smaller = (x, y) => x < y;
const minHeap = [];
for (const v of values) {
  push(minHeap, v, smaller);
  if (minHeap.length > k) pop(minHeap, smaller);   // evict the smallest kept
}
console.log("min-heap capped at k:             [" + [...minHeap].sort((a, b) => b - a).join(", ") + "]");
console.log(\`  the heap never held more than \${k} values\`);
console.log("  O(n log k), and it works on a stream that does not fit in memory");
console.log();
console.log("both are correct. The second is the one that survives the follow-up");
console.log("question, which is always some version of \\"now n does not fit\\".");`,
            },
            {
              lang: "typescript",
              code: `type Less = (x: number, y: number) => boolean;

function siftUp(a: number[], i: number, less: Less): void {
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (!less(a[i], a[p])) break;
    [a[p], a[i]] = [a[i], a[p]];
    i = p;
  }
}
function siftDown(a: number[], i: number, less: Less): void {
  for (;;) {
    let m = i;
    for (const c of [2 * i + 1, 2 * i + 2]) {
      if (c < a.length && less(a[c], a[m])) m = c;
    }
    if (m === i) return;
    [a[i], a[m]] = [a[m], a[i]];
    i = m;
  }
}
function push(a: number[], v: number, less: Less): void {
  a.push(v);
  siftUp(a, a.length - 1, less);
}
function pop(a: number[], less: Less): number {
  const top = a[0];
  const last = a.pop() as number;
  if (a.length > 0) {
    a[0] = last;
    siftDown(a, 0, less);
  }
  return top;
}

const values = [7, 2, 9, 4, 1, 8, 3, 6, 5];
const k = 3;

// The tempting version: a max-heap of everything, popped k times.
const bigger: Less = (x, y) => x > y;
const maxHeap: number[] = [];
for (const v of values) push(maxHeap, v, bigger);
const answer: number[] = [];
for (let i = 0; i < k; i++) answer.push(pop(maxHeap, bigger));
console.log("max-heap of all n, popped k times: [" + answer.join(", ") + "]");
console.log(\`  correct, but the heap held all \${values.length} values\`);
console.log("  O(n) to build + O(k log n) to pop — fine when n fits in memory");
console.log();

// The version that scales: a min-heap of only k.
const smaller: Less = (x, y) => x < y;
const minHeap: number[] = [];
for (const v of values) {
  push(minHeap, v, smaller);
  if (minHeap.length > k) pop(minHeap, smaller);   // evict the smallest kept
}
console.log("min-heap capped at k:             [" + [...minHeap].sort((a: number, b: number) => b - a).join(", ") + "]");
console.log(\`  the heap never held more than \${k} values\`);
console.log("  O(n log k), and it works on a stream that does not fit in memory");
console.log();
console.log("both are correct. The second is the one that survives the follow-up");
console.log("question, which is always some version of \\"now n does not fit\\".");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.PriorityQueue;

public class Main {
    public static void main(String[] args) {
        int[] values = {7, 2, 9, 4, 1, 8, 3, 6, 5};
        int k = 3;

        // The tempting version: a max-heap of everything, popped k times.
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
        for (int v : values) maxHeap.add(v);
        List<Integer> answer = new ArrayList<>();
        for (int i = 0; i < k; i++) answer.add(maxHeap.poll());
        System.out.println("max-heap of all n, popped k times: " + answer);
        System.out.printf("  correct, but the heap held all %d values%n", values.length);
        System.out.println("  O(n) to build + O(k log n) to pop — fine when n fits in memory");
        System.out.println();

        // The version that scales: a min-heap of only k.
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        for (int v : values) {
            minHeap.add(v);
            if (minHeap.size() > k) minHeap.poll();     // evict the smallest kept
        }
        List<Integer> capped = new ArrayList<>(minHeap);
        capped.sort(Collections.reverseOrder());
        System.out.println("min-heap capped at k:             " + capped);
        System.out.printf("  the heap never held more than %d values%n", k);
        System.out.println("  O(n log k), and it works on a stream that does not fit in memory");
        System.out.println();
        System.out.println("both are correct. The second is the one that survives the follow-up");
        System.out.println("question, which is always some version of \\"now n does not fit\\".");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <functional>
#include <iostream>
#include <queue>
#include <string>
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
    const std::vector<int> values = {7, 2, 9, 4, 1, 8, 3, 6, 5};
    const int k = 3;

    // The tempting version: a max-heap of everything, popped k times.
    // std::priority_queue is already a max-heap, so this is the default.
    std::priority_queue<int> max_heap(values.begin(), values.end());
    std::vector<int> answer;
    for (int i = 0; i < k; ++i) {
        answer.push_back(max_heap.top());
        max_heap.pop();
    }
    std::cout << "max-heap of all n, popped k times: " << show(answer) << '\\n';
    std::cout << "  correct, but the heap held all " << values.size() << " values\\n";
    std::cout << "  O(n) to build + O(k log n) to pop — fine when n fits in memory\\n\\n";

    // The version that scales: a min-heap of only k.
    std::priority_queue<int, std::vector<int>, std::greater<int>> min_heap;
    std::vector<int> mirror;
    for (int v : values) {
        min_heap.push(v);
        mirror.push_back(v);
        if (static_cast<int>(min_heap.size()) > k) {
            int evicted = min_heap.top();
            min_heap.pop();
            mirror.erase(std::find(mirror.begin(), mirror.end(), evicted));
        }
    }
    std::sort(mirror.begin(), mirror.end(), std::greater<int>());
    std::cout << "min-heap capped at k:             " << show(mirror) << '\\n';
    std::cout << "  the heap never held more than " << k << " values\\n";
    std::cout << "  O(n log k), and it works on a stream that does not fit in memory\\n\\n";
    std::cout << "both are correct. The second is the one that survives the follow-up\\n";
    std::cout << "question, which is always some version of \\"now n does not fit\\".\\n";
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
    let values = [7, 2, 9, 4, 1, 8, 3, 6, 5];
    let k = 3usize;

    // The tempting version: a max-heap of everything, popped k times.
    // BinaryHeap is already a max-heap, so this needs no wrapper.
    let mut max_heap: BinaryHeap<i32> = values.iter().copied().collect();
    let mut answer = Vec::new();
    for _ in 0..k {
        answer.push(max_heap.pop().unwrap());
    }
    println!("max-heap of all n, popped k times: {}", show(&answer));
    println!("  correct, but the heap held all {} values", values.len());
    println!("  O(n) to build + O(k log n) to pop — fine when n fits in memory");
    println!();

    // The version that scales: a min-heap of only k.
    let mut min_heap: BinaryHeap<Reverse<i32>> = BinaryHeap::new();
    for v in values {
        min_heap.push(Reverse(v));
        if min_heap.len() > k {
            min_heap.pop(); // evict the smallest kept
        }
    }
    let mut capped: Vec<i32> = min_heap.into_iter().map(|Reverse(x)| x).collect();
    capped.sort_unstable_by(|a, b| b.cmp(a));
    println!("min-heap capped at k:             {}", show(&capped));
    println!("  the heap never held more than {} values", k);
    println!("  O(n log k), and it works on a stream that does not fit in memory");
    println!();
    println!("both are correct. The second is the one that survives the follow-up");
    println!("question, which is always some version of \\"now n does not fit\\".");
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

type intHeap struct {
	a    []int
	less func(x, y int) bool
}

func (h intHeap) Len() int            { return len(h.a) }
func (h intHeap) Less(i, j int) bool  { return h.less(h.a[i], h.a[j]) }
func (h intHeap) Swap(i, j int)       { h.a[i], h.a[j] = h.a[j], h.a[i] }
func (h *intHeap) Push(x interface{}) { h.a = append(h.a, x.(int)) }
func (h *intHeap) Pop() interface{} {
	n := len(h.a)
	last := h.a[n-1]
	h.a = h.a[:n-1]
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
	values := []int{7, 2, 9, 4, 1, 8, 3, 6, 5}
	k := 3

	// The tempting version: a max-heap of everything, popped k times.
	maxHeap := &intHeap{less: func(x, y int) bool { return x > y }}
	heap.Init(maxHeap)
	for _, v := range values {
		heap.Push(maxHeap, v)
	}
	var answer []int
	for i := 0; i < k; i++ {
		answer = append(answer, heap.Pop(maxHeap).(int))
	}
	fmt.Println("max-heap of all n, popped k times: " + show(answer))
	fmt.Printf("  correct, but the heap held all %d values\\n", len(values))
	fmt.Println("  O(n) to build + O(k log n) to pop — fine when n fits in memory")
	fmt.Println()

	// The version that scales: a min-heap of only k.
	minHeap := &intHeap{less: func(x, y int) bool { return x < y }}
	heap.Init(minHeap)
	for _, v := range values {
		heap.Push(minHeap, v)
		if minHeap.Len() > k {
			heap.Pop(minHeap) // evict the smallest kept
		}
	}
	capped := append([]int(nil), minHeap.a...)
	sort.Sort(sort.Reverse(sort.IntSlice(capped)))
	fmt.Println("min-heap capped at k:             " + show(capped))
	fmt.Printf("  the heap never held more than %d values\\n", k)
	fmt.Println("  O(n log k), and it works on a stream that does not fit in memory")
	fmt.Println()
	fmt.Println("both are correct. The second is the one that survives the follow-up")
	fmt.Println("question, which is always some version of \\"now n does not fit\\".")
}`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why is a min-heap the right structure for finding the k largest elements?",
      answer:
        "Because the operation the algorithm repeats is *decide whether this new value belongs in the answer*, and it belongs exactly when it beats the weakest value currently kept. A min-heap puts that weakest value at the root, so the test is one comparison and the eviction is one pop. A max-heap would surface the largest kept value, which is the one element the decision never involves, and finding the weakest would cost O(k) per arrival.",
    },
    {
      question: "What is the complexity, and when would you just sort instead?",
      answer:
        "O(n log k): each of n elements costs at most one push and one pop on a heap that never exceeds k. Sorting is O(n log n), which is worse asymptotically but has far better constants \u2014 a library sort is cache-friendly and branch-predictable where a heap jumps around an array. So for small n, or when k is close to n, sorting is faster in wall-clock terms as well as simpler. The heap earns its place when k is small and n is large, and it becomes the only option when n does not fit in memory.",
    },
    {
      question: "The interviewer says the input is now an unbounded stream. What changes?",
      answer:
        "Nothing, if the heap was capped at k from the start \u2014 it holds the k largest seen so far, it never grows, and it can be read at any point. That is the reason to prefer it over heapifying the whole array and popping k times, which needs every element present at once. If the data is also distributed, the same algorithm composes: each shard keeps its own top k and a coordinator merges those, which is a k-way merge over a handful of small heaps.",
    },
  ],
  takeaways: [
    "For the k largest, use a min-heap; for the k smallest, a max-heap. The root is what gets evicted next.",
    "Cap the heap at k. A heap holding all of n answers the same question and fails the streaming follow-up.",
    "O(n log k) beats O(n log n) only while k stays small \u2014 at k = n it is a sort with worse constants.",
    "Quickselect is O(n) expected and beats both in memory, at the cost of reordering the input and an O(n\u00b2) worst case.",
    "The streaming, unbounded and distributed versions all reduce to the same capped heap, which is why the question gets asked.",
  ],
  status: "available",
};
