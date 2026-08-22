import type { Lesson } from "@/content/types";

export const twoHeapsLesson: Lesson = {
  id: "dsa-heap-two-heaps",
  slug: "the-two-heap-pattern",
  moduleSlug: "heaps-and-priority-queues",
  title: "Two Heaps, and the Running Median",
  summary:
    "Split the data in half and point a heap at each side. The two facing roots are the middle of the collection, which turns a statistic that seems to need sorting into two O(log n) operations.",
  estimatedMinutes: 35,
  objectives: [
    "Arrange a max-heap and a min-heap so their roots straddle the median",
    "State the two invariants separately, and maintain each one",
    "Read the median for both odd and even counts",
    "Say why a sorted list is O(n²) here despite an O(1) median",
  ],
  sections: [
    {
      id: "facing-roots",
      heading: "Two heaps, pointed at each other",
      body: [
        "The median is the middle of a collection, and the obvious way to find the middle is to sort \u2014 which is O(n log n) every time a value arrives, and hopeless for a running answer.",
        "The trick is to notice how little of the ordering the median actually needs. It needs the largest element of the bottom half and the smallest element of the top half, and nothing else. Every other relationship in the data is irrelevant.",
        "So keep the bottom half in a **max-heap** and the top half in a **min-heap**. Each root is exactly one of the two values the median is made of. The halves themselves stay unordered, which is precisely why maintaining them is cheap.",
        "With an odd count, let one heap hold the extra element and the median is that heap's root. With an even count the heaps are equal and the median is the average of the two roots.",
      ],
      examples: [
        {
          id: "two-heaps-trace",
          title: "Two halves, facing each other",
          lang: "python",
          code: `import heapq

low = []      # max-heap of the smaller half, negated
high = []     # min-heap of the larger half


def add(v):
    # Always enter through \`low\`, then push its top across. That single
    # ordering is what guarantees every value in \`low\` <= every value in \`high\`.
    heapq.heappush(low, -v)
    heapq.heappush(high, -heapq.heappop(low))
    # \`low\` is allowed to be one larger, and never smaller.
    if len(high) > len(low):
        heapq.heappush(low, -heapq.heappop(high))


def median():
    if len(low) > len(high):
        return float(-low[0])
    return (-low[0] + high[0]) / 2


print(f"{'add':>5}  {'low (max-heap)':<22} {'high (min-heap)':<18} {'median':>8}")
print("-" * 58)
for v in (6, 10, 2, 6, 5, 0, 6, 3):
    add(v)
    lo = sorted((-x for x in low), reverse=True)
    hi = sorted(high)
    print(f"{v:>5}  {str(lo):<22} {str(hi):<18} {median():>8}")

print()
print("neither half is sorted internally — only the two facing ends are known,")
print("and those two are the only values the median ever needs.")`,
          output: `  add  low (max-heap)         high (min-heap)      median
----------------------------------------------------------
    6  [6]                    []                      6.0
   10  [6]                    [10]                    8.0
    2  [6, 2]                 [10]                    6.0
    6  [6, 2]                 [6, 10]                 6.0
    5  [6, 5, 2]              [6, 10]                 6.0
    0  [5, 2, 0]              [6, 6, 10]              5.5
    6  [6, 5, 2, 0]           [6, 6, 10]              6.0
    3  [5, 3, 2, 0]           [6, 6, 6, 10]           5.5

neither half is sorted internally — only the two facing ends are known,
and those two are the only values the median ever needs.`,
          explanation:
            "The two heaps are turned back to back: the smaller half is a max-heap so its root is the *largest* of the small values, and the larger half is a min-heap so its root is the *smallest* of the large ones. Those two roots are the two elements adjacent to the middle, which is all a median ever needs. Watch the trace and notice what is not there \u2014 at no point is either half sorted, and at no point does anything look at an element that is not a root.",
          alternates: [
            {
              lang: "javascript",
              code: `// Two heaps over one comparator each. \`low\` is a max-heap, \`high\` a min-heap.
function makeHeap(less) {
  const a = [];
  return {
    a,
    push(v) {
      a.push(v);
      let i = a.length - 1;
      while (i > 0) {
        const p = Math.floor((i - 1) / 2);
        if (!less(a[i], a[p])) break;
        [a[p], a[i]] = [a[i], a[p]];
        i = p;
      }
    },
    pop() {
      const top = a[0];
      const last = a.pop();
      if (a.length > 0) {
        a[0] = last;
        let i = 0;
        for (;;) {
          let m = i;
          for (const c of [2 * i + 1, 2 * i + 2]) {
            if (c < a.length && less(a[c], a[m])) m = c;
          }
          if (m === i) break;
          [a[i], a[m]] = [a[m], a[i]];
          i = m;
        }
      }
      return top;
    },
    get top() { return a[0]; },
    get size() { return a.length; },
  };
}

const low = makeHeap((x, y) => x > y);    // max-heap of the smaller half
const high = makeHeap((x, y) => x < y);   // min-heap of the larger half

function add(v) {
  // Always enter through \`low\`, then push its top across. That single
  // ordering is what guarantees every value in \`low\` <= every value in \`high\`.
  low.push(v);
  high.push(low.pop());
  // \`low\` is allowed to be one larger, and never smaller.
  if (high.size > low.size) low.push(high.pop());
}

function median() {
  if (low.size > high.size) return low.top;
  return (low.top + high.top) / 2;
}

const padStart = (s, w) => String(s).padStart(w);
const padEnd = (s, w) => String(s).padEnd(w);

console.log(\`\${padStart("add", 5)}  \${padEnd("low (max-heap)", 22)} \${padEnd("high (min-heap)", 18)} \${padStart("median", 8)}\`);
console.log("-".repeat(58));
for (const v of [6, 10, 2, 6, 5, 0, 6, 3]) {
  add(v);
  const lo = "[" + [...low.a].sort((a, b) => b - a).join(", ") + "]";
  const hi = "[" + [...high.a].sort((a, b) => a - b).join(", ") + "]";
  console.log(\`\${padStart(v, 5)}  \${padEnd(lo, 22)} \${padEnd(hi, 18)} \${padStart(median().toFixed(1), 8)}\`);
}

console.log();
console.log("neither half is sorted internally — only the two facing ends are known,");
console.log("and those two are the only values the median ever needs.");`,
            },
            {
              lang: "typescript",
              code: `// Two heaps over one comparator each. \`low\` is a max-heap, \`high\` a min-heap.
type Less = (x: number, y: number) => boolean;

function makeHeap(less: Less) {
  const a: number[] = [];
  return {
    a,
    push(v: number): void {
      a.push(v);
      let i = a.length - 1;
      while (i > 0) {
        const p = Math.floor((i - 1) / 2);
        if (!less(a[i], a[p])) break;
        [a[p], a[i]] = [a[i], a[p]];
        i = p;
      }
    },
    pop(): number {
      const top = a[0];
      const last = a.pop() as number;
      if (a.length > 0) {
        a[0] = last;
        let i = 0;
        for (;;) {
          let m = i;
          for (const c of [2 * i + 1, 2 * i + 2]) {
            if (c < a.length && less(a[c], a[m])) m = c;
          }
          if (m === i) break;
          [a[i], a[m]] = [a[m], a[i]];
          i = m;
        }
      }
      return top;
    },
    get top(): number { return a[0]; },
    get size(): number { return a.length; },
  };
}

const low = makeHeap((x, y) => x > y);    // max-heap of the smaller half
const high = makeHeap((x, y) => x < y);   // min-heap of the larger half

function add(v: number): void {
  // Always enter through \`low\`, then push its top across. That single
  // ordering is what guarantees every value in \`low\` <= every value in \`high\`.
  low.push(v);
  high.push(low.pop());
  // \`low\` is allowed to be one larger, and never smaller.
  if (high.size > low.size) low.push(high.pop());
}

function median(): number {
  if (low.size > high.size) return low.top;
  return (low.top + high.top) / 2;
}

const padStart = (s: string | number, w: number): string => String(s).padStart(w);
const padEnd = (s: string | number, w: number): string => String(s).padEnd(w);

console.log(\`\${padStart("add", 5)}  \${padEnd("low (max-heap)", 22)} \${padEnd("high (min-heap)", 18)} \${padStart("median", 8)}\`);
console.log("-".repeat(58));
for (const v of [6, 10, 2, 6, 5, 0, 6, 3]) {
  add(v);
  const lo = "[" + [...low.a].sort((a: number, b: number) => b - a).join(", ") + "]";
  const hi = "[" + [...high.a].sort((a: number, b: number) => a - b).join(", ") + "]";
  console.log(\`\${padStart(v, 5)}  \${padEnd(lo, 22)} \${padEnd(hi, 18)} \${padStart(median().toFixed(1), 8)}\`);
}

console.log();
console.log("neither half is sorted internally — only the two facing ends are known,");
console.log("and those two are the only values the median ever needs.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.PriorityQueue;

public class Main {
    static final PriorityQueue<Integer> low = new PriorityQueue<>(Collections.reverseOrder());
    static final PriorityQueue<Integer> high = new PriorityQueue<>();

    static void add(int v) {
        /* Always enter through \`low\`, then push its top across. That single
           ordering is what guarantees every value in \`low\` <= every value in \`high\`. */
        low.add(v);
        high.add(low.poll());
        // \`low\` is allowed to be one larger, and never smaller.
        if (high.size() > low.size()) low.add(high.poll());
    }

    static double median() {
        if (low.size() > high.size()) return low.peek();
        return (low.peek() + high.peek()) / 2.0;
    }

    static String show(PriorityQueue<Integer> q, boolean descending) {
        List<Integer> v = new ArrayList<>(q);
        v.sort(descending ? Collections.reverseOrder() : null);
        return v.toString();
    }

    public static void main(String[] args) {
        System.out.printf("%5s  %-22s %-18s %8s%n", "add", "low (max-heap)", "high (min-heap)", "median");
        System.out.println("-".repeat(58));
        for (int v : new int[]{6, 10, 2, 6, 5, 0, 6, 3}) {
            add(v);
            System.out.printf("%5d  %-22s %-18s %8s%n", v, show(low, true), show(high, false),
                    String.format("%.1f", median()));
        }

        System.out.println();
        System.out.println("neither half is sorted internally — only the two facing ends are known,");
        System.out.println("and those two are the only values the median ever needs.");
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
#include <sstream>
#include <string>
#include <vector>

// \`low\` is a max-heap (the default) and \`high\` a min-heap.
static std::priority_queue<int> low;
static std::priority_queue<int, std::vector<int>, std::greater<int>> high;

static void add(int v) {
    /* Always enter through \`low\`, then push its top across. That single
       ordering is what guarantees every value in \`low\` <= every value in \`high\`. */
    low.push(v);
    high.push(low.top());
    low.pop();
    // \`low\` is allowed to be one larger, and never smaller.
    if (high.size() > low.size()) {
        low.push(high.top());
        high.pop();
    }
}

static double median() {
    if (low.size() > high.size()) return low.top();
    return (low.top() + high.top()) / 2.0;
}

template <typename Q>
static std::string show(Q q, bool descending) {
    std::vector<int> v;
    while (!q.empty()) {                     // a copy, so draining it is free
        v.push_back(q.top());
        q.pop();
    }
    if (descending) std::sort(v.begin(), v.end(), std::greater<int>());
    else std::sort(v.begin(), v.end());
    std::string out = "[";
    for (size_t i = 0; i < v.size(); ++i) {
        if (i) out += ", ";
        out += std::to_string(v[i]);
    }
    return out + "]";
}

int main() {
    std::cout << std::right << std::setw(5) << "add" << "  " << std::left << std::setw(22)
              << "low (max-heap)" << ' ' << std::setw(18) << "high (min-heap)" << ' '
              << std::right << std::setw(8) << "median" << '\\n';
    std::cout << std::string(58, '-') << '\\n';
    for (int v : {6, 10, 2, 6, 5, 0, 6, 3}) {
        add(v);
        std::ostringstream m;
        m << std::fixed << std::setprecision(1) << median();
        std::cout << std::right << std::setw(5) << v << "  " << std::left << std::setw(22)
                  << show(low, true) << ' ' << std::setw(18) << show(high, false) << ' '
                  << std::right << std::setw(8) << m.str() << '\\n';
    }

    std::cout << "\\nneither half is sorted internally — only the two facing ends are known,\\n";
    std::cout << "and those two are the only values the median ever needs.\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::cmp::Reverse;
use std::collections::BinaryHeap;

struct Median {
    low: BinaryHeap<i32>,          // max-heap of the smaller half
    high: BinaryHeap<Reverse<i32>>, // min-heap of the larger half
}

impl Median {
    fn add(&mut self, v: i32) {
        // Always enter through \`low\`, then push its top across. That single
        // ordering is what guarantees every value in \`low\` <= every value in \`high\`.
        self.low.push(v);
        let moved = self.low.pop().unwrap();
        self.high.push(Reverse(moved));
        // \`low\` is allowed to be one larger, and never smaller.
        if self.high.len() > self.low.len() {
            let Reverse(back) = self.high.pop().unwrap();
            self.low.push(back);
        }
    }

    fn median(&self) -> f64 {
        if self.low.len() > self.high.len() {
            *self.low.peek().unwrap() as f64
        } else {
            (*self.low.peek().unwrap() as f64 + self.high.peek().unwrap().0 as f64) / 2.0
        }
    }
}

fn show(mut v: Vec<i32>, descending: bool) -> String {
    if descending {
        v.sort_unstable_by(|a, b| b.cmp(a));
    } else {
        v.sort_unstable();
    }
    let parts: Vec<String> = v.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn main() {
    let mut m = Median { low: BinaryHeap::new(), high: BinaryHeap::new() };

    println!("{:>5}  {:<22} {:<18} {:>8}", "add", "low (max-heap)", "high (min-heap)", "median");
    println!("{}", "-".repeat(58));
    for v in [6, 10, 2, 6, 5, 0, 6, 3] {
        m.add(v);
        let lo = show(m.low.iter().copied().collect(), true);
        let hi = show(m.high.iter().map(|Reverse(x)| *x).collect(), false);
        println!("{:>5}  {:<22} {:<18} {:>8}", v, lo, hi, format!("{:.1}", m.median()));
    }

    println!();
    println!("neither half is sorted internally — only the two facing ends are known,");
    println!("and those two are the only values the median ever needs.");
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

type ints struct {
	a    []int
	less func(x, y int) bool
}

func (h ints) Len() int            { return len(h.a) }
func (h ints) Less(i, j int) bool  { return h.less(h.a[i], h.a[j]) }
func (h ints) Swap(i, j int)       { h.a[i], h.a[j] = h.a[j], h.a[i] }
func (h *ints) Push(x interface{}) { h.a = append(h.a, x.(int)) }
func (h *ints) Pop() interface{} {
	n := len(h.a)
	last := h.a[n-1]
	h.a = h.a[:n-1]
	return last
}

var (
	low  = &ints{less: func(x, y int) bool { return x > y }} // max-heap of the smaller half
	high = &ints{less: func(x, y int) bool { return x < y }} // min-heap of the larger half
)

func add(v int) {
	// Always enter through \`low\`, then push its top across. That single
	// ordering is what guarantees every value in low <= every value in high.
	heap.Push(low, v)
	heap.Push(high, heap.Pop(low))
	// low is allowed to be one larger, and never smaller.
	if high.Len() > low.Len() {
		heap.Push(low, heap.Pop(high))
	}
}

func median() float64 {
	if low.Len() > high.Len() {
		return float64(low.a[0])
	}
	return float64(low.a[0]+high.a[0]) / 2.0
}

func show(a []int, descending bool) string {
	v := append([]int(nil), a...)
	if descending {
		sort.Sort(sort.Reverse(sort.IntSlice(v)))
	} else {
		sort.Ints(v)
	}
	parts := make([]string, len(v))
	for i, x := range v {
		parts[i] = strconv.Itoa(x)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func main() {
	heap.Init(low)
	heap.Init(high)

	fmt.Printf("%5s  %-22s %-18s %8s\\n", "add", "low (max-heap)", "high (min-heap)", "median")
	fmt.Println(strings.Repeat("-", 58))
	for _, v := range []int{6, 10, 2, 6, 5, 0, 6, 3} {
		add(v)
		fmt.Printf("%5d  %-22s %-18s %8s\\n", v, show(low.a, true), show(high.a, false),
			strconv.FormatFloat(median(), 'f', 1, 64))
	}

	fmt.Println()
	fmt.Println("neither half is sorted internally — only the two facing ends are known,")
	fmt.Println("and those two are the only values the median ever needs.")
}`,
            },
          ],
        },
      ],
      visual: {
        id: "median-visual",
        kind: "heap",
        title: "The root of each half, facing the middle",
      },
    },
    {
      id: "the-invariants",
      heading: "Two invariants, and only one of them is obvious",
      body: [
        "Everything in `low` must be less than or equal to everything in `high`. And the two sizes must never differ by more than one.",
        "The first is maintained by *how a value enters*. The version that cannot go wrong pushes every arrival into `low` and immediately moves `low`'s root into `high` \u2014 no comparison, no branch, and the ordering falls out. The version that compares against `low`'s root first does two fewer heap operations and has to handle the empty-heap case, which is where the bug lives.",
        "The second is maintained by an explicit fix afterwards, and it is the one people leave out because nothing appears to break immediately. It does break: the halves drift, and the facing roots stop being the middle of anything. Choose a convention \u2014 `low` may hold the extra, never `high` \u2014 and write the fix in both directions.",
        "Deletion, if the problem needs it, is where this pattern gets expensive. Removing an arbitrary value from a heap is O(n), so a *sliding window* median needs lazy deletion on top of all this, plus the size bookkeeping to account for entries that are still in a heap but no longer in the window.",
      ],
      examples: [
        {
          id: "rebalance",
          title: "The rebalancing, and what happens without it",
          lang: "python",
          code: `import heapq

# The rebalance rule is easy to get subtly wrong. This is the version that
# tests the value against a boundary instead of routing everything through
# one heap -- both work, but only if the empty case is handled.
low, high = [], []


def add_by_comparison(v):
    if not low or v <= -low[0]:
        heapq.heappush(low, -v)
    else:
        heapq.heappush(high, v)
    # sizes can now be off by two, so fix in whichever direction is wrong
    if len(low) > len(high) + 1:
        heapq.heappush(high, -heapq.heappop(low))
    elif len(high) > len(low):
        heapq.heappush(low, -heapq.heappop(high))


def invariant_holds():
    return not low or not high or -low[0] <= high[0]


def sizes_ok():
    return len(low) - len(high) in (0, 1)


values = [6, 10, 2, 6, 5, 0, 6, 3, 9, 1]
for v in values:
    add_by_comparison(v)
    if not invariant_holds() or not sizes_ok():
        print(f"broken after adding {v}")
        break
else:
    print(f"invariant held for all {len(values)} insertions")

print(f"  low has {len(low)}, high has {len(high)}")
print(f"  largest of the small half: {-low[0]}")
print(f"  smallest of the large half: {high[0]}")
print()

print("what breaks if the size fix is skipped entirely:")
low2, high2 = [], []
for v in values:
    if not low2 or v <= -low2[0]:
        heapq.heappush(low2, -v)
    else:
        heapq.heappush(high2, v)
print(f"  low has {len(low2)}, high has {len(high2)} — the halves are not halves,")
print("  so the two facing roots are no longer the middle of anything.")`,
          output: `invariant held for all 10 insertions
  low has 5, high has 5
  largest of the small half: 5
  smallest of the large half: 6

what breaks if the size fix is skipped entirely:
  low has 8, high has 2 — the halves are not halves,
  so the two facing roots are no longer the middle of anything.`,
          explanation:
            "Two routings work. Pushing everything into `low` and immediately shifting its top into `high` needs no comparison and cannot get the ordering wrong; comparing against `low`'s root first saves a pair of operations but has to handle the empty heap, which is the case people forget. Either way the size fix is not optional: without it the two heaps drift apart, and once they are 8 and 2 their facing roots are the 8th and 9th smallest rather than the middle. The invariant is worth stating as two separate claims \u2014 every value in `low` is \u2264 every value in `high`, and the sizes differ by at most one \u2014 because the code that maintains each is different and only the second one is easy to skip.",
          alternates: [
            {
              lang: "javascript",
              code: `function makeHeap(less) {
  const a = [];
  return {
    a,
    push(v) {
      a.push(v);
      let i = a.length - 1;
      while (i > 0) {
        const p = Math.floor((i - 1) / 2);
        if (!less(a[i], a[p])) break;
        [a[p], a[i]] = [a[i], a[p]];
        i = p;
      }
    },
    pop() {
      const top = a[0];
      const last = a.pop();
      if (a.length > 0) {
        a[0] = last;
        let i = 0;
        for (;;) {
          let m = i;
          for (const c of [2 * i + 1, 2 * i + 2]) {
            if (c < a.length && less(a[c], a[m])) m = c;
          }
          if (m === i) break;
          [a[i], a[m]] = [a[m], a[i]];
          i = m;
        }
      }
      return top;
    },
    get top() { return a[0]; },
    get size() { return a.length; },
  };
}

const bigger = (x, y) => x > y;
const smaller = (x, y) => x < y;

// The rebalance rule is easy to get subtly wrong. This is the version that
// tests the value against a boundary instead of routing everything through
// one heap -- both work, but only if the empty case is handled.
const low = makeHeap(bigger);
const high = makeHeap(smaller);

function addByComparison(v) {
  if (low.size === 0 || v <= low.top) low.push(v);
  else high.push(v);
  // sizes can now be off by two, so fix in whichever direction is wrong
  if (low.size > high.size + 1) high.push(low.pop());
  else if (high.size > low.size) low.push(high.pop());
}

const invariantHolds = () => low.size === 0 || high.size === 0 || low.top <= high.top;
const sizesOk = () => low.size - high.size === 0 || low.size - high.size === 1;

const values = [6, 10, 2, 6, 5, 0, 6, 3, 9, 1];
let broke = false;
for (const v of values) {
  addByComparison(v);
  if (!invariantHolds() || !sizesOk()) {
    console.log(\`broken after adding \${v}\`);
    broke = true;
    break;
  }
}
if (!broke) console.log(\`invariant held for all \${values.length} insertions\`);

console.log(\`  low has \${low.size}, high has \${high.size}\`);
console.log(\`  largest of the small half: \${low.top}\`);
console.log(\`  smallest of the large half: \${high.top}\`);
console.log();

console.log("what breaks if the size fix is skipped entirely:");
const low2 = makeHeap(bigger);
const high2 = makeHeap(smaller);
for (const v of values) {
  if (low2.size === 0 || v <= low2.top) low2.push(v);
  else high2.push(v);
}
console.log(\`  low has \${low2.size}, high has \${high2.size} — the halves are not halves,\`);
console.log("  so the two facing roots are no longer the middle of anything.");`,
            },
            {
              lang: "typescript",
              code: `type Less = (x: number, y: number) => boolean;

function makeHeap(less: Less) {
  const a: number[] = [];
  return {
    a,
    push(v: number): void {
      a.push(v);
      let i = a.length - 1;
      while (i > 0) {
        const p = Math.floor((i - 1) / 2);
        if (!less(a[i], a[p])) break;
        [a[p], a[i]] = [a[i], a[p]];
        i = p;
      }
    },
    pop(): number {
      const top = a[0];
      const last = a.pop() as number;
      if (a.length > 0) {
        a[0] = last;
        let i = 0;
        for (;;) {
          let m = i;
          for (const c of [2 * i + 1, 2 * i + 2]) {
            if (c < a.length && less(a[c], a[m])) m = c;
          }
          if (m === i) break;
          [a[i], a[m]] = [a[m], a[i]];
          i = m;
        }
      }
      return top;
    },
    get top(): number { return a[0]; },
    get size(): number { return a.length; },
  };
}

const bigger: Less = (x, y) => x > y;
const smaller: Less = (x, y) => x < y;

// The rebalance rule is easy to get subtly wrong. This is the version that
// tests the value against a boundary instead of routing everything through
// one heap -- both work, but only if the empty case is handled.
const low = makeHeap(bigger);
const high = makeHeap(smaller);

function addByComparison(v: number): void {
  if (low.size === 0 || v <= low.top) low.push(v);
  else high.push(v);
  // sizes can now be off by two, so fix in whichever direction is wrong
  if (low.size > high.size + 1) high.push(low.pop());
  else if (high.size > low.size) low.push(high.pop());
}

const invariantHolds = (): boolean => low.size === 0 || high.size === 0 || low.top <= high.top;
const sizesOk = (): boolean => low.size - high.size === 0 || low.size - high.size === 1;

const values = [6, 10, 2, 6, 5, 0, 6, 3, 9, 1];
let broke = false;
for (const v of values) {
  addByComparison(v);
  if (!invariantHolds() || !sizesOk()) {
    console.log(\`broken after adding \${v}\`);
    broke = true;
    break;
  }
}
if (!broke) console.log(\`invariant held for all \${values.length} insertions\`);

console.log(\`  low has \${low.size}, high has \${high.size}\`);
console.log(\`  largest of the small half: \${low.top}\`);
console.log(\`  smallest of the large half: \${high.top}\`);
console.log();

console.log("what breaks if the size fix is skipped entirely:");
const low2 = makeHeap(bigger);
const high2 = makeHeap(smaller);
for (const v of values) {
  if (low2.size === 0 || v <= low2.top) low2.push(v);
  else high2.push(v);
}
console.log(\`  low has \${low2.size}, high has \${high2.size} — the halves are not halves,\`);
console.log("  so the two facing roots are no longer the middle of anything.");`,
            },
            {
              lang: "java",
              code: `import java.util.Collections;
import java.util.PriorityQueue;

public class Main {
    /* The rebalance rule is easy to get subtly wrong. This is the version that
       tests the value against a boundary instead of routing everything through
       one heap -- both work, but only if the empty case is handled. */
    static final PriorityQueue<Integer> low = new PriorityQueue<>(Collections.reverseOrder());
    static final PriorityQueue<Integer> high = new PriorityQueue<>();

    static void addByComparison(int v) {
        if (low.isEmpty() || v <= low.peek()) low.add(v);
        else high.add(v);
        // sizes can now be off by two, so fix in whichever direction is wrong
        if (low.size() > high.size() + 1) high.add(low.poll());
        else if (high.size() > low.size()) low.add(high.poll());
    }

    static boolean invariantHolds() {
        return low.isEmpty() || high.isEmpty() || low.peek() <= high.peek();
    }

    static boolean sizesOk() {
        int d = low.size() - high.size();
        return d == 0 || d == 1;
    }

    public static void main(String[] args) {
        int[] values = {6, 10, 2, 6, 5, 0, 6, 3, 9, 1};
        boolean broke = false;
        for (int v : values) {
            addByComparison(v);
            if (!invariantHolds() || !sizesOk()) {
                System.out.printf("broken after adding %d%n", v);
                broke = true;
                break;
            }
        }
        if (!broke) System.out.printf("invariant held for all %d insertions%n", values.length);

        System.out.printf("  low has %d, high has %d%n", low.size(), high.size());
        System.out.printf("  largest of the small half: %d%n", low.peek());
        System.out.printf("  smallest of the large half: %d%n", high.peek());
        System.out.println();

        System.out.println("what breaks if the size fix is skipped entirely:");
        PriorityQueue<Integer> low2 = new PriorityQueue<>(Collections.reverseOrder());
        PriorityQueue<Integer> high2 = new PriorityQueue<>();
        for (int v : values) {
            if (low2.isEmpty() || v <= low2.peek()) low2.add(v);
            else high2.add(v);
        }
        System.out.printf("  low has %d, high has %d — the halves are not halves,%n", low2.size(), high2.size());
        System.out.println("  so the two facing roots are no longer the middle of anything.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <functional>
#include <iostream>
#include <queue>
#include <vector>

/* The rebalance rule is easy to get subtly wrong. This is the version that
   tests the value against a boundary instead of routing everything through
   one heap -- both work, but only if the empty case is handled. */
static std::priority_queue<int> low;
static std::priority_queue<int, std::vector<int>, std::greater<int>> high;

static void add_by_comparison(int v) {
    if (low.empty() || v <= low.top()) low.push(v);
    else high.push(v);
    // sizes can now be off by two, so fix in whichever direction is wrong
    if (low.size() > high.size() + 1) {
        high.push(low.top());
        low.pop();
    } else if (high.size() > low.size()) {
        low.push(high.top());
        high.pop();
    }
}

static bool invariant_holds() {
    return low.empty() || high.empty() || low.top() <= high.top();
}

static bool sizes_ok() {
    long d = static_cast<long>(low.size()) - static_cast<long>(high.size());
    return d == 0 || d == 1;
}

int main() {
    const std::vector<int> values = {6, 10, 2, 6, 5, 0, 6, 3, 9, 1};
    bool broke = false;
    for (int v : values) {
        add_by_comparison(v);
        if (!invariant_holds() || !sizes_ok()) {
            std::cout << "broken after adding " << v << '\\n';
            broke = true;
            break;
        }
    }
    if (!broke) std::cout << "invariant held for all " << values.size() << " insertions\\n";

    std::cout << "  low has " << low.size() << ", high has " << high.size() << '\\n';
    std::cout << "  largest of the small half: " << low.top() << '\\n';
    std::cout << "  smallest of the large half: " << high.top() << "\\n\\n";

    std::cout << "what breaks if the size fix is skipped entirely:\\n";
    std::priority_queue<int> low2;
    std::priority_queue<int, std::vector<int>, std::greater<int>> high2;
    for (int v : values) {
        if (low2.empty() || v <= low2.top()) low2.push(v);
        else high2.push(v);
    }
    std::cout << "  low has " << low2.size() << ", high has " << high2.size()
              << " — the halves are not halves,\\n";
    std::cout << "  so the two facing roots are no longer the middle of anything.\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::cmp::Reverse;
use std::collections::BinaryHeap;

/// The rebalance rule is easy to get subtly wrong. This is the version that
/// tests the value against a boundary instead of routing everything through
/// one heap -- both work, but only if the empty case is handled.
struct Halves {
    low: BinaryHeap<i32>,
    high: BinaryHeap<Reverse<i32>>,
}

impl Halves {
    fn new() -> Self {
        Halves { low: BinaryHeap::new(), high: BinaryHeap::new() }
    }

    fn add_by_comparison(&mut self, v: i32) {
        if self.low.is_empty() || v <= *self.low.peek().unwrap() {
            self.low.push(v);
        } else {
            self.high.push(Reverse(v));
        }
        // sizes can now be off by two, so fix in whichever direction is wrong
        if self.low.len() > self.high.len() + 1 {
            let moved = self.low.pop().unwrap();
            self.high.push(Reverse(moved));
        } else if self.high.len() > self.low.len() {
            let Reverse(back) = self.high.pop().unwrap();
            self.low.push(back);
        }
    }

    fn invariant_holds(&self) -> bool {
        self.low.is_empty() || self.high.is_empty()
            || *self.low.peek().unwrap() <= self.high.peek().unwrap().0
    }

    fn sizes_ok(&self) -> bool {
        let d = self.low.len() as i64 - self.high.len() as i64;
        d == 0 || d == 1
    }
}

fn main() {
    let values = [6, 10, 2, 6, 5, 0, 6, 3, 9, 1];
    let mut h = Halves::new();
    let mut broke = false;
    for v in values {
        h.add_by_comparison(v);
        if !h.invariant_holds() || !h.sizes_ok() {
            println!("broken after adding {}", v);
            broke = true;
            break;
        }
    }
    if !broke {
        println!("invariant held for all {} insertions", values.len());
    }

    println!("  low has {}, high has {}", h.low.len(), h.high.len());
    println!("  largest of the small half: {}", h.low.peek().unwrap());
    println!("  smallest of the large half: {}", h.high.peek().unwrap().0);
    println!();

    println!("what breaks if the size fix is skipped entirely:");
    let mut g = Halves::new();
    for v in values {
        if g.low.is_empty() || v <= *g.low.peek().unwrap() {
            g.low.push(v);
        } else {
            g.high.push(Reverse(v));
        }
    }
    println!("  low has {}, high has {} — the halves are not halves,", g.low.len(), g.high.len());
    println!("  so the two facing roots are no longer the middle of anything.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"container/heap"
	"fmt"
)

type ints struct {
	a    []int
	less func(x, y int) bool
}

func (h ints) Len() int            { return len(h.a) }
func (h ints) Less(i, j int) bool  { return h.less(h.a[i], h.a[j]) }
func (h ints) Swap(i, j int)       { h.a[i], h.a[j] = h.a[j], h.a[i] }
func (h *ints) Push(x interface{}) { h.a = append(h.a, x.(int)) }
func (h *ints) Pop() interface{} {
	n := len(h.a)
	last := h.a[n-1]
	h.a = h.a[:n-1]
	return last
}

func maxHeap() *ints { return &ints{less: func(x, y int) bool { return x > y }} }
func minHeap() *ints { return &ints{less: func(x, y int) bool { return x < y }} }

/* The rebalance rule is easy to get subtly wrong. This is the version that
   tests the value against a boundary instead of routing everything through
   one heap -- both work, but only if the empty case is handled. */
var low, high = maxHeap(), minHeap()

func addByComparison(v int) {
	if low.Len() == 0 || v <= low.a[0] {
		heap.Push(low, v)
	} else {
		heap.Push(high, v)
	}
	// sizes can now be off by two, so fix in whichever direction is wrong
	if low.Len() > high.Len()+1 {
		heap.Push(high, heap.Pop(low))
	} else if high.Len() > low.Len() {
		heap.Push(low, heap.Pop(high))
	}
}

func invariantHolds() bool {
	return low.Len() == 0 || high.Len() == 0 || low.a[0] <= high.a[0]
}

func sizesOk() bool {
	d := low.Len() - high.Len()
	return d == 0 || d == 1
}

func main() {
	heap.Init(low)
	heap.Init(high)

	values := []int{6, 10, 2, 6, 5, 0, 6, 3, 9, 1}
	broke := false
	for _, v := range values {
		addByComparison(v)
		if !invariantHolds() || !sizesOk() {
			fmt.Printf("broken after adding %d\\n", v)
			broke = true
			break
		}
	}
	if !broke {
		fmt.Printf("invariant held for all %d insertions\\n", len(values))
	}

	fmt.Printf("  low has %d, high has %d\\n", low.Len(), high.Len())
	fmt.Printf("  largest of the small half: %d\\n", low.a[0])
	fmt.Printf("  smallest of the large half: %d\\n", high.a[0])
	fmt.Println()

	fmt.Println("what breaks if the size fix is skipped entirely:")
	low2, high2 := maxHeap(), minHeap()
	heap.Init(low2)
	heap.Init(high2)
	for _, v := range values {
		if low2.Len() == 0 || v <= low2.a[0] {
			heap.Push(low2, v)
		} else {
			heap.Push(high2, v)
		}
	}
	fmt.Printf("  low has %d, high has %d — the halves are not halves,\\n", low2.Len(), high2.Len())
	fmt.Println("  so the two facing roots are no longer the middle of anything.")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "the-alternative",
      heading: "Why not just keep it sorted?",
      body: [
        "A sorted list answers the median in O(1) \u2014 better than the heaps, which need two root reads and a branch. The cost is on the way in.",
        "Finding where a new value belongs is a binary search, O(log n). Putting it there is not: every element after the insertion point shifts up one place, which is O(n) of memory movement. Over n insertions that is O(n\u00b2), and the O(log n) search that people quote is the cheap half of an expensive operation.",
        "This is the general shape of the two-heap pattern's argument, and it recurs: **when a problem asks for a running statistic, ask which comparisons the statistic actually depends on.** If it is only a boundary between two groups, two heaps will maintain that boundary for O(log n) per update, and everything else can stay unordered.",
      ],
      examples: [
        {
          id: "against-sorting",
          title: "Against keeping one sorted list",
          lang: "python",
          code: `import bisect
import heapq
import math

seed = 7


def next_rand():
    global seed
    seed = (seed * 16807) % 2147483647
    return seed


def by_two_heaps(values):
    low, high = [], []
    out = []
    for v in values:
        heapq.heappush(low, -v)
        heapq.heappush(high, -heapq.heappop(low))
        if len(high) > len(low):
            heapq.heappush(low, -heapq.heappop(high))
        out.append(float(-low[0]) if len(low) > len(high) else (-low[0] + high[0]) / 2)
    return out


def by_sorted_list(values):
    """Keep one sorted list. The search is O(log n); the insert is O(n)."""
    seen = []
    out = []
    for v in values:
        bisect.insort(seen, v)
        n = len(seen)
        out.append(float(seen[n // 2]) if n % 2 else (seen[n // 2 - 1] + seen[n // 2]) / 2)
    return out


data = [next_rand() % 1000 for _ in range(5_000)]
a = by_two_heaps(data)
b = by_sorted_list(data)
print("both agree on all 5,000 running medians:", "yes" if a == b else "no")
print("first ten:", " ".join(f"{m:.1f}" for m in a[:10]))
print()

print(f"{'n':>9} {'two heaps: n log n':>20} {'sorted list: n^2/2':>20}")
print("-" * 52)
for n in (1_000, 100_000, 1_000_000):
    print(f"{n:>9} {n * math.log2(n):>20,.0f} {n * n / 2:>20,.0f}")

print()
print("the sorted list finds the position in O(log n) and then moves memory")
print("to make room, which is the O(n) nobody counts. It wins at small n on")
print("constants alone, and loses to the heaps well before n is interesting.")`,
          output: `both agree on all 5,000 running medians: yes
first ten: 649.0 696.0 649.0 657.0 649.0 609.0 649.0 609.0 649.0 609.0

        n   two heaps: n log n   sorted list: n^2/2
----------------------------------------------------
     1000                9,966              500,000
   100000            1,660,964        5,000,000,000
  1000000           19,931,569      500,000,000,000

the sorted list finds the position in O(log n) and then moves memory
to make room, which is the O(n) nobody counts. It wins at small n on
constants alone, and loses to the heaps well before n is interesting.`,
          explanation:
            "A sorted list gives the median in O(1) and is the obvious alternative, so it is worth being precise about why it loses. `bisect` finds the insertion point in O(log n), and then the insert itself shifts every element after it \u2014 O(n) of memcpy that the complexity of the search hides. That makes the whole run O(n\u00b2), against O(n log n) for the heaps. For a few thousand elements the sorted list often wins anyway, because moving contiguous memory is fast and heap operations jump around; the crossover arrives earlier than most people guess, and the asymptotic answer is the one to give in an interview.",
          alternates: [
            {
              lang: "javascript",
              code: `let seed = 7;
function nextRand() {
  seed = (seed * 16807) % 2147483647;
  return seed;
}

function makeHeap(less) {
  const a = [];
  return {
    a,
    push(v) {
      a.push(v);
      let i = a.length - 1;
      while (i > 0) {
        const p = Math.floor((i - 1) / 2);
        if (!less(a[i], a[p])) break;
        [a[p], a[i]] = [a[i], a[p]];
        i = p;
      }
    },
    pop() {
      const top = a[0];
      const last = a.pop();
      if (a.length > 0) {
        a[0] = last;
        let i = 0;
        for (;;) {
          let m = i;
          for (const c of [2 * i + 1, 2 * i + 2]) {
            if (c < a.length && less(a[c], a[m])) m = c;
          }
          if (m === i) break;
          [a[i], a[m]] = [a[m], a[i]];
          i = m;
        }
      }
      return top;
    },
    get top() { return a[0]; },
    get size() { return a.length; },
  };
}

function byTwoHeaps(values) {
  const low = makeHeap((x, y) => x > y);
  const high = makeHeap((x, y) => x < y);
  const out = [];
  for (const v of values) {
    low.push(v);
    high.push(low.pop());
    if (high.size > low.size) low.push(high.pop());
    out.push(low.size > high.size ? low.top : (low.top + high.top) / 2);
  }
  return out;
}

/** Keep one sorted list. The search is O(log n); the insert is O(n). */
function bySortedList(values) {
  const seen = [];
  const out = [];
  for (const v of values) {
    let lo = 0;
    let hi = seen.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (seen[mid] <= v) lo = mid + 1;
      else hi = mid;
    }
    seen.splice(lo, 0, v);            // this is the O(n) nobody counts
    const n = seen.length;
    out.push(n % 2 ? seen[Math.floor(n / 2)] : (seen[n / 2 - 1] + seen[n / 2]) / 2);
  }
  return out;
}

const data = Array.from({ length: 5000 }, () => nextRand() % 1000);
const a = byTwoHeaps(data);
const b = bySortedList(data);
const same = a.length === b.length && a.every((v, i) => v === b[i]);
console.log("both agree on all 5,000 running medians:", same ? "yes" : "no");
console.log("first ten:", a.slice(0, 10).map((m) => m.toFixed(1)).join(" "));
console.log();

const pad = (s, w) => String(s).padStart(w);
const group = (n) => String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");
console.log(\`\${pad("n", 9)} \${pad("two heaps: n log n", 20)} \${pad("sorted list: n^2/2", 20)}\`);
console.log("-".repeat(52));
for (const n of [1000, 100000, 1000000]) {
  console.log(\`\${pad(n, 9)} \${pad(group(Math.round(n * Math.log2(n))), 20)} \${pad(group((n * n) / 2), 20)}\`);
}

console.log();
console.log("the sorted list finds the position in O(log n) and then moves memory");
console.log("to make room, which is the O(n) nobody counts. It wins at small n on");
console.log("constants alone, and loses to the heaps well before n is interesting.");`,
            },
            {
              lang: "typescript",
              code: `let seed = 7;
function nextRand(): number {
  seed = (seed * 16807) % 2147483647;
  return seed;
}

type Less = (x: number, y: number) => boolean;

function makeHeap(less: Less) {
  const a: number[] = [];
  return {
    a,
    push(v: number): void {
      a.push(v);
      let i = a.length - 1;
      while (i > 0) {
        const p = Math.floor((i - 1) / 2);
        if (!less(a[i], a[p])) break;
        [a[p], a[i]] = [a[i], a[p]];
        i = p;
      }
    },
    pop(): number {
      const top = a[0];
      const last = a.pop() as number;
      if (a.length > 0) {
        a[0] = last;
        let i = 0;
        for (;;) {
          let m = i;
          for (const c of [2 * i + 1, 2 * i + 2]) {
            if (c < a.length && less(a[c], a[m])) m = c;
          }
          if (m === i) break;
          [a[i], a[m]] = [a[m], a[i]];
          i = m;
        }
      }
      return top;
    },
    get top(): number { return a[0]; },
    get size(): number { return a.length; },
  };
}

function byTwoHeaps(values: number[]): number[] {
  const low = makeHeap((x, y) => x > y);
  const high = makeHeap((x, y) => x < y);
  const out: number[] = [];
  for (const v of values) {
    low.push(v);
    high.push(low.pop());
    if (high.size > low.size) low.push(high.pop());
    out.push(low.size > high.size ? low.top : (low.top + high.top) / 2);
  }
  return out;
}

/** Keep one sorted list. The search is O(log n); the insert is O(n). */
function bySortedList(values: number[]): number[] {
  const seen: number[] = [];
  const out: number[] = [];
  for (const v of values) {
    let lo = 0;
    let hi = seen.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (seen[mid] <= v) lo = mid + 1;
      else hi = mid;
    }
    seen.splice(lo, 0, v);            // this is the O(n) nobody counts
    const n = seen.length;
    out.push(n % 2 ? seen[Math.floor(n / 2)] : (seen[n / 2 - 1] + seen[n / 2]) / 2);
  }
  return out;
}

const data = Array.from({ length: 5000 }, () => nextRand() % 1000);
const a = byTwoHeaps(data);
const b = bySortedList(data);
const same = a.length === b.length && a.every((v: number, i: number) => v === b[i]);
console.log("both agree on all 5,000 running medians:", same ? "yes" : "no");
console.log("first ten:", a.slice(0, 10).map((m: number) => m.toFixed(1)).join(" "));
console.log();

const pad = (s: string | number, w: number): string => String(s).padStart(w);
const group = (n: number): string => String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");
console.log(\`\${pad("n", 9)} \${pad("two heaps: n log n", 20)} \${pad("sorted list: n^2/2", 20)}\`);
console.log("-".repeat(52));
for (const n of [1000, 100000, 1000000]) {
  console.log(\`\${pad(n, 9)} \${pad(group(Math.round(n * Math.log2(n))), 20)} \${pad(group((n * n) / 2), 20)}\`);
}

console.log();
console.log("the sorted list finds the position in O(log n) and then moves memory");
console.log("to make room, which is the O(n) nobody counts. It wins at small n on");
console.log("constants alone, and loses to the heaps well before n is interesting.");`,
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

    static double[] byTwoHeaps(int[] values) {
        PriorityQueue<Integer> low = new PriorityQueue<>(Collections.reverseOrder());
        PriorityQueue<Integer> high = new PriorityQueue<>();
        double[] out = new double[values.length];
        for (int i = 0; i < values.length; i++) {
            low.add(values[i]);
            high.add(low.poll());
            if (high.size() > low.size()) low.add(high.poll());
            out[i] = low.size() > high.size() ? low.peek() : (low.peek() + high.peek()) / 2.0;
        }
        return out;
    }

    /** Keep one sorted list. The search is O(log n); the insert is O(n). */
    static double[] bySortedList(int[] values) {
        List<Integer> seen = new ArrayList<>();
        double[] out = new double[values.length];
        for (int i = 0; i < values.length; i++) {
            int v = values[i];
            int lo = 0, hi = seen.size();
            while (lo < hi) {
                int mid = (lo + hi) >>> 1;
                if (seen.get(mid) <= v) lo = mid + 1;
                else hi = mid;
            }
            seen.add(lo, v);                       // this is the O(n) nobody counts
            int n = seen.size();
            out[i] = n % 2 == 1 ? seen.get(n / 2) : (seen.get(n / 2 - 1) + seen.get(n / 2)) / 2.0;
        }
        return out;
    }

    public static void main(String[] args) {
        int[] data = new int[5000];
        for (int i = 0; i < data.length; i++) data[i] = (int) (nextRand() % 1000);
        double[] a = byTwoHeaps(data);
        double[] b = bySortedList(data);
        boolean same = true;
        for (int i = 0; i < a.length; i++) if (a[i] != b[i]) { same = false; break; }
        System.out.println("both agree on all 5,000 running medians: " + (same ? "yes" : "no"));
        StringBuilder first = new StringBuilder();
        for (int i = 0; i < 10; i++) first.append(i > 0 ? " " : "").append(String.format("%.1f", a[i]));
        System.out.println("first ten: " + first);
        System.out.println();

        System.out.printf("%9s %20s %20s%n", "n", "two heaps: n log n", "sorted list: n^2/2");
        System.out.println("-".repeat(52));
        for (long n : new long[]{1_000, 100_000, 1_000_000}) {
            System.out.printf("%9d %,20d %,20d%n", n,
                    Math.round(n * (Math.log(n) / Math.log(2))), n * n / 2);
        }

        System.out.println();
        System.out.println("the sorted list finds the position in O(log n) and then moves memory");
        System.out.println("to make room, which is the O(n) nobody counts. It wins at small n on");
        System.out.println("constants alone, and loses to the heaps well before n is interesting.");
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

static std::vector<double> by_two_heaps(const std::vector<int>& values) {
    std::priority_queue<int> low;
    std::priority_queue<int, std::vector<int>, std::greater<int>> high;
    std::vector<double> out;
    for (int v : values) {
        low.push(v);
        high.push(low.top());
        low.pop();
        if (high.size() > low.size()) {
            low.push(high.top());
            high.pop();
        }
        out.push_back(low.size() > high.size() ? low.top() : (low.top() + high.top()) / 2.0);
    }
    return out;
}

// Keep one sorted list. The search is O(log n); the insert is O(n).
static std::vector<double> by_sorted_list(const std::vector<int>& values) {
    std::vector<int> seen;
    std::vector<double> out;
    for (int v : values) {
        auto at = std::upper_bound(seen.begin(), seen.end(), v);
        seen.insert(at, v);                   // this is the O(n) nobody counts
        size_t n = seen.size();
        out.push_back(n % 2 ? static_cast<double>(seen[n / 2])
                            : (seen[n / 2 - 1] + seen[n / 2]) / 2.0);
    }
    return out;
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
    std::vector<int> data(5000);
    for (auto& v : data) v = static_cast<int>(next_rand() % 1000);
    std::vector<double> a = by_two_heaps(data);
    std::vector<double> b = by_sorted_list(data);
    std::cout << "both agree on all 5,000 running medians: " << (a == b ? "yes" : "no") << '\\n';
    std::ostringstream first;
    first << std::fixed << std::setprecision(1);
    for (size_t i = 0; i < 10; ++i) {
        if (i) first << ' ';
        first << a[i];
    }
    std::cout << "first ten: " << first.str() << "\\n\\n";

    std::cout << std::right << std::setw(9) << "n" << ' ' << std::setw(20) << "two heaps: n log n"
              << ' ' << std::setw(20) << "sorted list: n^2/2" << '\\n';
    std::cout << std::string(52, '-') << '\\n';
    for (long long n : {1000LL, 100000LL, 1000000LL}) {
        std::cout << std::setw(9) << n << ' '
                  << std::setw(20) << group(std::llround(static_cast<double>(n) * std::log2(static_cast<double>(n))))
                  << ' ' << std::setw(20) << group(n * n / 2) << '\\n';
    }

    std::cout << "\\nthe sorted list finds the position in O(log n) and then moves memory\\n";
    std::cout << "to make room, which is the O(n) nobody counts. It wins at small n on\\n";
    std::cout << "constants alone, and loses to the heaps well before n is interesting.\\n";
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

fn by_two_heaps(values: &[i32]) -> Vec<f64> {
    let mut low: BinaryHeap<i32> = BinaryHeap::new();
    let mut high: BinaryHeap<Reverse<i32>> = BinaryHeap::new();
    let mut out = Vec::with_capacity(values.len());
    for &v in values {
        low.push(v);
        let moved = low.pop().unwrap();
        high.push(Reverse(moved));
        if high.len() > low.len() {
            let Reverse(back) = high.pop().unwrap();
            low.push(back);
        }
        out.push(if low.len() > high.len() {
            *low.peek().unwrap() as f64
        } else {
            (*low.peek().unwrap() as f64 + high.peek().unwrap().0 as f64) / 2.0
        });
    }
    out
}

/// Keep one sorted list. The search is O(log n); the insert is O(n).
fn by_sorted_list(values: &[i32]) -> Vec<f64> {
    let mut seen: Vec<i32> = Vec::new();
    let mut out = Vec::with_capacity(values.len());
    for &v in values {
        let at = seen.partition_point(|&x| x <= v);
        seen.insert(at, v); // this is the O(n) nobody counts
        let n = seen.len();
        out.push(if n % 2 == 1 {
            seen[n / 2] as f64
        } else {
            (seen[n / 2 - 1] as f64 + seen[n / 2] as f64) / 2.0
        });
    }
    out
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
    let data: Vec<i32> = (0..5000).map(|_| (rng.next() % 1000) as i32).collect();
    let a = by_two_heaps(&data);
    let b = by_sorted_list(&data);
    println!("both agree on all 5,000 running medians: {}", if a == b { "yes" } else { "no" });
    let first: Vec<String> = a[..10].iter().map(|m| format!("{:.1}", m)).collect();
    println!("first ten: {}", first.join(" "));
    println!();

    println!("{:>9} {:>20} {:>20}", "n", "two heaps: n log n", "sorted list: n^2/2");
    println!("{}", "-".repeat(52));
    for n in [1_000i64, 100_000, 1_000_000] {
        println!("{:>9} {:>20} {:>20}", n,
                 group((n as f64 * (n as f64).log2()).round() as i64),
                 group(n * n / 2));
    }

    println!();
    println!("the sorted list finds the position in O(log n) and then moves memory");
    println!("to make room, which is the O(n) nobody counts. It wins at small n on");
    println!("constants alone, and loses to the heaps well before n is interesting.");
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

type ints struct {
	a    []int
	less func(x, y int) bool
}

func (h ints) Len() int            { return len(h.a) }
func (h ints) Less(i, j int) bool  { return h.less(h.a[i], h.a[j]) }
func (h ints) Swap(i, j int)       { h.a[i], h.a[j] = h.a[j], h.a[i] }
func (h *ints) Push(x interface{}) { h.a = append(h.a, x.(int)) }
func (h *ints) Pop() interface{} {
	n := len(h.a)
	last := h.a[n-1]
	h.a = h.a[:n-1]
	return last
}

var seed int64 = 7

func nextRand() int64 {
	seed = (seed * 16807) % 2147483647
	return seed
}

func byTwoHeaps(values []int) []float64 {
	low := &ints{less: func(x, y int) bool { return x > y }}
	high := &ints{less: func(x, y int) bool { return x < y }}
	heap.Init(low)
	heap.Init(high)
	out := make([]float64, 0, len(values))
	for _, v := range values {
		heap.Push(low, v)
		heap.Push(high, heap.Pop(low))
		if high.Len() > low.Len() {
			heap.Push(low, heap.Pop(high))
		}
		if low.Len() > high.Len() {
			out = append(out, float64(low.a[0]))
		} else {
			out = append(out, float64(low.a[0]+high.a[0])/2.0)
		}
	}
	return out
}

// bySortedList keeps one sorted list. The search is O(log n); the insert is O(n).
func bySortedList(values []int) []float64 {
	var seen []int
	out := make([]float64, 0, len(values))
	for _, v := range values {
		at := sort.SearchInts(seen, v+1)
		seen = append(seen, 0)
		copy(seen[at+1:], seen[at:]) // this is the O(n) nobody counts
		seen[at] = v
		n := len(seen)
		if n%2 == 1 {
			out = append(out, float64(seen[n/2]))
		} else {
			out = append(out, float64(seen[n/2-1]+seen[n/2])/2.0)
		}
	}
	return out
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
	data := make([]int, 5000)
	for i := range data {
		data[i] = int(nextRand() % 1000)
	}
	a := byTwoHeaps(data)
	b := bySortedList(data)
	same := "yes"
	for i := range a {
		if a[i] != b[i] {
			same = "no"
			break
		}
	}
	fmt.Println("both agree on all 5,000 running medians:", same)
	first := make([]string, 10)
	for i := 0; i < 10; i++ {
		first[i] = strconv.FormatFloat(a[i], 'f', 1, 64)
	}
	fmt.Println("first ten:", strings.Join(first, " "))
	fmt.Println()

	fmt.Printf("%9s %20s %20s\\n", "n", "two heaps: n log n", "sorted list: n^2/2")
	fmt.Println(strings.Repeat("-", 52))
	for _, n := range []int64{1000, 100000, 1000000} {
		fmt.Printf("%9d %20s %20s\\n", n,
			group(int64(math.Round(float64(n)*math.Log2(float64(n))))),
			group(n*n/2))
	}

	fmt.Println()
	fmt.Println("the sorted list finds the position in O(log n) and then moves memory")
	fmt.Println("to make room, which is the O(n) nobody counts. It wins at small n on")
	fmt.Println("constants alone, and loses to the heaps well before n is interesting.")
}`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Design a data structure that returns the median of a growing stream.",
      answer:
        "Two heaps: a max-heap for the smaller half and a min-heap for the larger, with the invariant that everything in the first is \u2264 everything in the second, and the sizes differ by at most one. To add, push into the max-heap, pop its root into the min-heap, and if the min-heap is now the larger, pop its root back. To read, take the root of the larger heap for an odd count, or average the two roots for an even one. Insertion is O(log n), the median is O(1), and neither half is ever sorted.",
    },
    {
      question: "Why a max-heap for the small half rather than a min-heap?",
      answer:
        "Because the median depends on the *largest* element of the small half, and a heap only ever surfaces one element cheaply \u2014 its root. A min-heap of the small half would surface the smallest value in the collection, which the median never needs, and finding the largest would cost O(n). The two heaps are deliberately pointed at each other so that the two elements adjacent to the middle are the two roots.",
    },
    {
      question: "Now the median is over a sliding window of the last k values. What changes?",
      answer:
        "Values now leave as well as arrive, and a heap cannot remove an arbitrary element in better than O(n). The standard fix is lazy deletion: keep a map of values that have expired, discard them when they surface at a root, and track the *effective* sizes separately from the actual heap sizes so the rebalancing still works. The alternative in languages that have one is an ordered multiset with an iterator held at the middle, which makes the removal O(log k) directly.",
    },
  ],
  takeaways: [
    "The median needs two elements: the largest below it and the smallest above. A heap surfaces exactly one element cheaply, so use two.",
    "Max-heap for the small half, min-heap for the large half \u2014 the roots face each other across the middle.",
    "Two invariants, maintained separately: the ordering between halves, and the sizes differing by at most one.",
    "Route every arrival through one heap and shift across; it costs two extra operations and removes the empty-heap branch.",
    "A sorted list gives an O(1) median and an O(n) insert, which is O(n\u00b2) overall \u2014 the binary search is the cheap half.",
    "Sliding-window medians need lazy deletion on top, because removing an arbitrary value from a heap is O(n).",
  ],
  status: "available",
};
