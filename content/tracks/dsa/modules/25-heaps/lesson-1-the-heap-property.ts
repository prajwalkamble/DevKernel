import type { Lesson } from "@/content/types";

export const heapPropertyLesson: Lesson = {
  id: "dsa-heap-property",
  slug: "the-heap-property-and-the-array",
  moduleSlug: "heaps-and-priority-queues",
  title: "The Heap Property, and Why an Array Is the Right Home",
  summary:
    "A heap promises much less than a search tree — only that a parent beats its children — and gets a far cheaper repair in exchange. The array is not an optimisation of the tree; it is the tree.",
  estimatedMinutes: 30,
  objectives: [
    "State the heap property, and say what it deliberately does not order",
    "Move between an index and its parent and children without drawing anything",
    "Explain why completeness is what licenses the index arithmetic",
    "Say what a heap cannot answer, and reach for something else when asked",
  ],
  sections: [
    {
      id: "the-weakest-invariant",
      heading: "The weakest invariant that still works",
      body: [
        "A binary search tree orders everything: for any node, the whole left subtree is smaller and the whole right subtree is larger. That is a strong promise, and keeping it is why insertion has to find the one correct position and why the tree needs balancing to stay useful.",
        "A heap promises far less. Every node is smaller than its children \u2014 and that is all. Siblings are unordered. Cousins are unordered. A value three levels down may be smaller than a value one level down in another subtree. The only thing the structure guarantees is that the smallest element in the whole collection is sitting at the root.",
        "That weakness is the feature. Because the promise is local, repairing it after a change is local too: a value moves along one root-to-leaf path and nothing else in the tree has to be touched. One path in a complete tree is \u230alog\u2082 n\u230b steps, so insertion and removal are O(log n) with a small constant and no rebalancing machinery at all.",
        "So the question a heap answers is narrow and the answer is instant: **what is the smallest thing here?** If that is the question your problem keeps asking, this is the structure. If you find yourself wanting anything else from it, you have probably picked the wrong one.",
      ],
      examples: [
        {
          id: "array-and-tree",
          title: "One array, read two ways",
          lang: "python",
          code: `def parent(i):
    return (i - 1) // 2


def left(i):
    return 2 * i + 1


def right(i):
    return 2 * i + 2


heap = [1, 3, 6, 5, 9, 8]
print("array:", heap)
print()

print("the same array read as levels of a tree:")
level, start = 0, 0
while start < len(heap):
    row = heap[start:start + 2 ** level]
    print(f"  level {level}: {' '.join(str(v) for v in row)}")
    start += 2 ** level
    level += 1

print()
print(f"{'i':>3} {'value':>6} {'parent':>8} {'left':>6} {'right':>7}")
print("-" * 34)
for i, v in enumerate(heap):
    p = "-" if i == 0 else f"{heap[parent(i)]}@{parent(i)}"
    l = f"{heap[left(i)]}@{left(i)}" if left(i) < len(heap) else "-"
    r = f"{heap[right(i)]}@{right(i)}" if right(i) < len(heap) else "-"
    print(f"{i:>3} {v:>6} {p:>8} {l:>6} {r:>7}")

print()
print("the invariant is only ever parent <= child:")
for i in range(1, len(heap)):
    print(f"  heap[{parent(i)}]={heap[parent(i)]} <= heap[{i}]={heap[i]}")
print("no rule relates 3 and 6, or 5 and 8 — siblings are unordered")`,
          output: `array: [1, 3, 6, 5, 9, 8]

the same array read as levels of a tree:
  level 0: 1
  level 1: 3 6
  level 2: 5 9 8

  i  value   parent   left   right
----------------------------------
  0      1        -    3@1     6@2
  1      3      1@0    5@3     9@4
  2      6      1@0    8@5       -
  3      5      3@1      -       -
  4      9      3@1      -       -
  5      8      6@2      -       -

the invariant is only ever parent <= child:
  heap[0]=1 <= heap[1]=3
  heap[0]=1 <= heap[2]=6
  heap[1]=3 <= heap[3]=5
  heap[1]=3 <= heap[4]=9
  heap[2]=6 <= heap[5]=8
no rule relates 3 and 6, or 5 and 8 — siblings are unordered`,
          explanation:
            "The tree is a way of reading the array, not a thing that exists alongside it. `2i + 1`, `2i + 2` and `(i - 1) // 2` are the whole data structure \u2014 there is no node object, no left pointer, no allocation per element. The last block is the point of the lesson: the invariant relates a node to its *children only*. `3` and `6` are siblings and the heap says nothing about which is larger, which is exactly why maintaining it is cheap.",
          alternates: [
            {
              lang: "javascript",
              code: `const parent = (i) => Math.floor((i - 1) / 2);
const left = (i) => 2 * i + 1;
const right = (i) => 2 * i + 2;

const heap = [1, 3, 6, 5, 9, 8];
console.log("array: [" + heap.join(", ") + "]");
console.log();

console.log("the same array read as levels of a tree:");
let level = 0;
let start = 0;
while (start < heap.length) {
  const row = heap.slice(start, start + 2 ** level);
  console.log(\`  level \${level}: \${row.join(" ")}\`);
  start += 2 ** level;
  level += 1;
}

const pad = (s, w) => String(s).padStart(w);
console.log();
console.log(\`\${pad("i", 3)} \${pad("value", 6)} \${pad("parent", 8)} \${pad("left", 6)} \${pad("right", 7)}\`);
console.log("-".repeat(34));
heap.forEach((v, i) => {
  const p = i === 0 ? "-" : \`\${heap[parent(i)]}@\${parent(i)}\`;
  const l = left(i) < heap.length ? \`\${heap[left(i)]}@\${left(i)}\` : "-";
  const r = right(i) < heap.length ? \`\${heap[right(i)]}@\${right(i)}\` : "-";
  console.log(\`\${pad(i, 3)} \${pad(v, 6)} \${pad(p, 8)} \${pad(l, 6)} \${pad(r, 7)}\`);
});

console.log();
console.log("the invariant is only ever parent <= child:");
for (let i = 1; i < heap.length; i++) {
  console.log(\`  heap[\${parent(i)}]=\${heap[parent(i)]} <= heap[\${i}]=\${heap[i]}\`);
}
console.log("no rule relates 3 and 6, or 5 and 8 — siblings are unordered");`,
            },
            {
              lang: "typescript",
              code: `const parent = (i: number): number => Math.floor((i - 1) / 2);
const left = (i: number): number => 2 * i + 1;
const right = (i: number): number => 2 * i + 2;

const heap = [1, 3, 6, 5, 9, 8];
console.log("array: [" + heap.join(", ") + "]");
console.log();

console.log("the same array read as levels of a tree:");
let level = 0;
let start = 0;
while (start < heap.length) {
  const row = heap.slice(start, start + 2 ** level);
  console.log(\`  level \${level}: \${row.join(" ")}\`);
  start += 2 ** level;
  level += 1;
}

const pad = (s: string | number, w: number): string => String(s).padStart(w);
console.log();
console.log(\`\${pad("i", 3)} \${pad("value", 6)} \${pad("parent", 8)} \${pad("left", 6)} \${pad("right", 7)}\`);
console.log("-".repeat(34));
heap.forEach((v: number, i: number) => {
  const p = i === 0 ? "-" : \`\${heap[parent(i)]}@\${parent(i)}\`;
  const l = left(i) < heap.length ? \`\${heap[left(i)]}@\${left(i)}\` : "-";
  const r = right(i) < heap.length ? \`\${heap[right(i)]}@\${right(i)}\` : "-";
  console.log(\`\${pad(i, 3)} \${pad(v, 6)} \${pad(p, 8)} \${pad(l, 6)} \${pad(r, 7)}\`);
});

console.log();
console.log("the invariant is only ever parent <= child:");
for (let i = 1; i < heap.length; i++) {
  console.log(\`  heap[\${parent(i)}]=\${heap[parent(i)]} <= heap[\${i}]=\${heap[i]}\`);
}
console.log("no rule relates 3 and 6, or 5 and 8 — siblings are unordered");`,
            },
            {
              lang: "java",
              code: `public class Main {
    static int parent(int i) { return (i - 1) / 2; }
    static int left(int i) { return 2 * i + 1; }
    static int right(int i) { return 2 * i + 2; }

    public static void main(String[] args) {
        int[] heap = {1, 3, 6, 5, 9, 8};
        StringBuilder arr = new StringBuilder("array: [");
        for (int i = 0; i < heap.length; i++) arr.append(i > 0 ? ", " : "").append(heap[i]);
        System.out.println(arr.append("]"));
        System.out.println();

        System.out.println("the same array read as levels of a tree:");
        int level = 0, start = 0;
        while (start < heap.length) {
            StringBuilder row = new StringBuilder();
            for (int i = start; i < Math.min(start + (1 << level), heap.length); i++) {
                row.append(i > start ? " " : "").append(heap[i]);
            }
            System.out.printf("  level %d: %s%n", level, row);
            start += 1 << level;
            level += 1;
        }

        System.out.println();
        System.out.printf("%3s %6s %8s %6s %7s%n", "i", "value", "parent", "left", "right");
        System.out.println("-".repeat(34));
        for (int i = 0; i < heap.length; i++) {
            String p = i == 0 ? "-" : heap[parent(i)] + "@" + parent(i);
            String l = left(i) < heap.length ? heap[left(i)] + "@" + left(i) : "-";
            String r = right(i) < heap.length ? heap[right(i)] + "@" + right(i) : "-";
            System.out.printf("%3d %6d %8s %6s %7s%n", i, heap[i], p, l, r);
        }

        System.out.println();
        System.out.println("the invariant is only ever parent <= child:");
        for (int i = 1; i < heap.length; i++) {
            System.out.printf("  heap[%d]=%d <= heap[%d]=%d%n", parent(i), heap[parent(i)], i, heap[i]);
        }
        System.out.println("no rule relates 3 and 6, or 5 and 8 — siblings are unordered");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

static int parent(int i) { return (i - 1) / 2; }
static int left(int i) { return 2 * i + 1; }
static int right_(int i) { return 2 * i + 2; }

int main() {
    const std::vector<int> heap = {1, 3, 6, 5, 9, 8};
    std::string arr = "array: [";
    for (size_t i = 0; i < heap.size(); ++i) {
        if (i) arr += ", ";
        arr += std::to_string(heap[i]);
    }
    std::cout << arr << "]\\n\\n";

    std::cout << "the same array read as levels of a tree:\\n";
    int level = 0;
    size_t start = 0;
    while (start < heap.size()) {
        std::string row;
        for (size_t i = start; i < std::min(start + (size_t{1} << level), heap.size()); ++i) {
            if (i > start) row += " ";
            row += std::to_string(heap[i]);
        }
        std::cout << "  level " << level << ": " << row << "\\n";
        start += size_t{1} << level;
        level += 1;
    }

    std::cout << "\\n" << std::right << std::setw(3) << "i" << ' ' << std::setw(6) << "value"
              << ' ' << std::setw(8) << "parent" << ' ' << std::setw(6) << "left"
              << ' ' << std::setw(7) << "right" << '\\n';
    std::cout << std::string(34, '-') << '\\n';
    for (int i = 0; i < static_cast<int>(heap.size()); ++i) {
        std::string p = i == 0 ? "-" : std::to_string(heap[parent(i)]) + "@" + std::to_string(parent(i));
        std::string l = left(i) < static_cast<int>(heap.size())
            ? std::to_string(heap[left(i)]) + "@" + std::to_string(left(i)) : "-";
        std::string r = right_(i) < static_cast<int>(heap.size())
            ? std::to_string(heap[right_(i)]) + "@" + std::to_string(right_(i)) : "-";
        std::cout << std::setw(3) << i << ' ' << std::setw(6) << heap[i] << ' '
                  << std::setw(8) << p << ' ' << std::setw(6) << l << ' ' << std::setw(7) << r << '\\n';
    }

    std::cout << "\\nthe invariant is only ever parent <= child:\\n";
    for (size_t i = 1; i < heap.size(); ++i) {
        int pi = parent(static_cast<int>(i));
        std::cout << "  heap[" << pi << "]=" << heap[pi] << " <= heap[" << i << "]=" << heap[i] << '\\n';
    }
    std::cout << "no rule relates 3 and 6, or 5 and 8 — siblings are unordered\\n";
}`,
            },
            {
              lang: "rust",
              code: `fn parent(i: usize) -> usize { (i - 1) / 2 }
fn left(i: usize) -> usize { 2 * i + 1 }
fn right(i: usize) -> usize { 2 * i + 2 }

fn main() {
    let heap = [1, 3, 6, 5, 9, 8];
    let parts: Vec<String> = heap.iter().map(|v| v.to_string()).collect();
    println!("array: [{}]", parts.join(", "));
    println!();

    println!("the same array read as levels of a tree:");
    let mut level = 0u32;
    let mut start = 0usize;
    while start < heap.len() {
        let end = (start + (1usize << level)).min(heap.len());
        let row: Vec<String> = heap[start..end].iter().map(|v| v.to_string()).collect();
        println!("  level {}: {}", level, row.join(" "));
        start += 1usize << level;
        level += 1;
    }

    println!();
    println!("{:>3} {:>6} {:>8} {:>6} {:>7}", "i", "value", "parent", "left", "right");
    println!("{}", "-".repeat(34));
    for (i, v) in heap.iter().enumerate() {
        // \`parent(0)\` would underflow a usize, so index 0 never asks for it.
        let p = if i == 0 { "-".to_string() } else { format!("{}@{}", heap[parent(i)], parent(i)) };
        let l = if left(i) < heap.len() { format!("{}@{}", heap[left(i)], left(i)) } else { "-".to_string() };
        let r = if right(i) < heap.len() { format!("{}@{}", heap[right(i)], right(i)) } else { "-".to_string() };
        println!("{:>3} {:>6} {:>8} {:>6} {:>7}", i, v, p, l, r);
    }

    println!();
    println!("the invariant is only ever parent <= child:");
    for i in 1..heap.len() {
        println!("  heap[{}]={} <= heap[{}]={}", parent(i), heap[parent(i)], i, heap[i]);
    }
    println!("no rule relates 3 and 6, or 5 and 8 — siblings are unordered");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"strconv"
	"strings"
)

func parent(i int) int { return (i - 1) / 2 }
func left(i int) int   { return 2*i + 1 }
func right(i int) int  { return 2*i + 2 }

func main() {
	heap := []int{1, 3, 6, 5, 9, 8}
	parts := make([]string, len(heap))
	for i, v := range heap {
		parts[i] = strconv.Itoa(v)
	}
	fmt.Println("array: [" + strings.Join(parts, ", ") + "]")
	fmt.Println()

	fmt.Println("the same array read as levels of a tree:")
	level, start := 0, 0
	for start < len(heap) {
		end := start + (1 << level)
		if end > len(heap) {
			end = len(heap)
		}
		fmt.Printf("  level %d: %s\\n", level, strings.Join(parts[start:end], " "))
		start += 1 << level
		level++
	}

	fmt.Println()
	fmt.Printf("%3s %6s %8s %6s %7s\\n", "i", "value", "parent", "left", "right")
	fmt.Println(strings.Repeat("-", 34))
	for i, v := range heap {
		p := "-"
		if i != 0 {
			p = fmt.Sprintf("%d@%d", heap[parent(i)], parent(i))
		}
		l := "-"
		if left(i) < len(heap) {
			l = fmt.Sprintf("%d@%d", heap[left(i)], left(i))
		}
		r := "-"
		if right(i) < len(heap) {
			r = fmt.Sprintf("%d@%d", heap[right(i)], right(i))
		}
		fmt.Printf("%3d %6d %8s %6s %7s\\n", i, v, p, l, r)
	}

	fmt.Println()
	fmt.Println("the invariant is only ever parent <= child:")
	for i := 1; i < len(heap); i++ {
		fmt.Printf("  heap[%d]=%d <= heap[%d]=%d\\n", parent(i), heap[parent(i)], i, heap[i])
	}
	fmt.Println("no rule relates 3 and 6, or 5 and 8 — siblings are unordered")
}`,
            },
          ],
        },
      ],
      visual: {
        id: "heap-shape-visual",
        kind: "heap",
        title: "Sift up, and the one path it touches",
      },
    },
    {
      id: "the-array",
      heading: "The array is the structure, not a representation of it",
      body: [
        "Drawn on a whiteboard a heap is a tree, and that picture is worth keeping \u2014 but there is no tree in memory. There is one flat array, and three index formulas that let you read it as a tree.",
        "Children of `i` live at `2i + 1` and `2i + 2`; the parent of `i` lives at `(i - 1) // 2`. Nothing is stored to make that true. It is arithmetic, so it costs nothing to compute and nothing to keep.",
        "This is why a heap outruns a pointer-based tree by more than the complexity suggests. There is no node allocation, no pointer chasing, and the whole structure is contiguous \u2014 so walking a parent-to-child path reads memory the cache has usually already fetched. The constant factor is small in a way that O(log n) does not capture.",
      ],
      examples: [
        {
          id: "completeness",
          title: "Why the array never has a hole",
          lang: "python",
          code: `import heapq

heap = []
print(f"{'push':>6}  {'array after':<28} {'levels':<18} min")
print("-" * 62)
for v in (5, 3, 8, 1, 9, 2):
    heapq.heappush(heap, v)
    levels, level, start = [], 0, 0
    while start < len(heap):
        levels.append("".join(str(x) for x in heap[start:start + 2 ** level]))
        start += 2 ** level
        level += 1
    print(f"{v:>6}  {str(heap):<28} {'|'.join(levels):<18} {heap[0]}")

print()
print("the array never has a hole in it, because the tree is always complete:")
print("every level is full except the last, and the last fills left to right.")
print()
print("that is what makes 2i+1 and 2i+2 valid. A tree with a gap would need")
print("real pointers, and the whole reason a heap is fast would be gone.")`,
          output: `  push  array after                  levels             min
--------------------------------------------------------------
     5  [5]                          5                  5
     3  [3, 5]                       3|5                3
     8  [3, 5, 8]                    3|58               3
     1  [1, 3, 8, 5]                 1|38|5             1
     9  [1, 3, 8, 5, 9]              1|38|59            1
     2  [1, 3, 2, 5, 9, 8]           1|32|598           1

the array never has a hole in it, because the tree is always complete:
every level is full except the last, and the last fills left to right.

that is what makes 2i+1 and 2i+2 valid. A tree with a gap would need
real pointers, and the whole reason a heap is fast would be gone.`,
          explanation:
            "A binary heap is always a **complete** tree: every level full except the last, and the last filled left to right. That is not a coincidence to be maintained with care \u2014 it falls out of always appending at the end and always removing from the end. Completeness is what licenses the index arithmetic, and the index arithmetic is what makes the structure fast, so the shape rule and the speed are the same fact.",
          alternates: [
            {
              lang: "javascript",
              code: `// Python's heappush appends and walks the new value up; written out here
// because the array after each push is the thing being looked at.
function push(heap, v) {
  heap.push(v);
  let i = heap.length - 1;
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (heap[p] <= heap[i]) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
}

const heap = [];
const padStart = (s, w) => String(s).padStart(w);
const padEnd = (s, w) => String(s).padEnd(w);

console.log(\`\${padStart("push", 6)}  \${padEnd("array after", 28)} \${padEnd("levels", 18)} min\`);
console.log("-".repeat(62));
for (const v of [5, 3, 8, 1, 9, 2]) {
  push(heap, v);
  const levels = [];
  let level = 0;
  let start = 0;
  while (start < heap.length) {
    levels.push(heap.slice(start, start + 2 ** level).join(""));
    start += 2 ** level;
    level += 1;
  }
  const arr = "[" + heap.join(", ") + "]";
  console.log(\`\${padStart(v, 6)}  \${padEnd(arr, 28)} \${padEnd(levels.join("|"), 18)} \${heap[0]}\`);
}

console.log();
console.log("the array never has a hole in it, because the tree is always complete:");
console.log("every level is full except the last, and the last fills left to right.");
console.log();
console.log("that is what makes 2i+1 and 2i+2 valid. A tree with a gap would need");
console.log("real pointers, and the whole reason a heap is fast would be gone.");`,
            },
            {
              lang: "typescript",
              code: `// Python's heappush appends and walks the new value up; written out here
// because the array after each push is the thing being looked at.
function push(heap: number[], v: number): void {
  heap.push(v);
  let i = heap.length - 1;
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (heap[p] <= heap[i]) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
}

const heap: number[] = [];
const padStart = (s: string | number, w: number): string => String(s).padStart(w);
const padEnd = (s: string | number, w: number): string => String(s).padEnd(w);

console.log(\`\${padStart("push", 6)}  \${padEnd("array after", 28)} \${padEnd("levels", 18)} min\`);
console.log("-".repeat(62));
for (const v of [5, 3, 8, 1, 9, 2]) {
  push(heap, v);
  const levels: string[] = [];
  let level = 0;
  let start = 0;
  while (start < heap.length) {
    levels.push(heap.slice(start, start + 2 ** level).join(""));
    start += 2 ** level;
    level += 1;
  }
  const arr = "[" + heap.join(", ") + "]";
  console.log(\`\${padStart(v, 6)}  \${padEnd(arr, 28)} \${padEnd(levels.join("|"), 18)} \${heap[0]}\`);
}

console.log();
console.log("the array never has a hole in it, because the tree is always complete:");
console.log("every level is full except the last, and the last fills left to right.");
console.log();
console.log("that is what makes 2i+1 and 2i+2 valid. A tree with a gap would need");
console.log("real pointers, and the whole reason a heap is fast would be gone.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.List;

public class Main {
    /* Python's heappush appends and walks the new value up; written out here
       because the array after each push is the thing being looked at. */
    static void push(List<Integer> heap, int v) {
        heap.add(v);
        int i = heap.size() - 1;
        while (i > 0) {
            int p = (i - 1) / 2;
            if (heap.get(p) <= heap.get(i)) break;
            int t = heap.get(p);
            heap.set(p, heap.get(i));
            heap.set(i, t);
            i = p;
        }
    }

    public static void main(String[] args) {
        List<Integer> heap = new ArrayList<>();
        System.out.printf("%6s  %-28s %-18s min%n", "push", "array after", "levels");
        System.out.println("-".repeat(62));
        for (int v : new int[]{5, 3, 8, 1, 9, 2}) {
            push(heap, v);
            StringBuilder levels = new StringBuilder();
            int level = 0, start = 0;
            while (start < heap.size()) {
                if (start > 0) levels.append("|");
                for (int i = start; i < Math.min(start + (1 << level), heap.size()); i++) {
                    levels.append(heap.get(i));
                }
                start += 1 << level;
                level += 1;
            }
            System.out.printf("%6d  %-28s %-18s %d%n", v, heap.toString(), levels, heap.get(0));
        }

        System.out.println();
        System.out.println("the array never has a hole in it, because the tree is always complete:");
        System.out.println("every level is full except the last, and the last fills left to right.");
        System.out.println();
        System.out.println("that is what makes 2i+1 and 2i+2 valid. A tree with a gap would need");
        System.out.println("real pointers, and the whole reason a heap is fast would be gone.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

// Python's heappush appends and walks the new value up; written out here
// because the array after each push is the thing being looked at.
static void push(std::vector<int>& heap, int v) {
    heap.push_back(v);
    size_t i = heap.size() - 1;
    while (i > 0) {
        size_t p = (i - 1) / 2;
        if (heap[p] <= heap[i]) break;
        std::swap(heap[p], heap[i]);
        i = p;
    }
}

int main() {
    std::vector<int> heap;
    std::cout << std::right << std::setw(6) << "push" << "  " << std::left << std::setw(28)
              << "array after" << ' ' << std::setw(18) << "levels" << " min\\n";
    std::cout << std::string(62, '-') << '\\n';
    for (int v : {5, 3, 8, 1, 9, 2}) {
        push(heap, v);
        std::string levels;
        int level = 0;
        size_t start = 0;
        while (start < heap.size()) {
            if (start > 0) levels += "|";
            for (size_t i = start; i < std::min(start + (size_t{1} << level), heap.size()); ++i) {
                levels += std::to_string(heap[i]);
            }
            start += size_t{1} << level;
            level += 1;
        }
        std::string arr = "[";
        for (size_t i = 0; i < heap.size(); ++i) {
            if (i) arr += ", ";
            arr += std::to_string(heap[i]);
        }
        arr += "]";
        std::cout << std::right << std::setw(6) << v << "  " << std::left << std::setw(28)
                  << arr << ' ' << std::setw(18) << levels << ' ' << heap[0] << '\\n';
    }

    std::cout << "\\nthe array never has a hole in it, because the tree is always complete:\\n";
    std::cout << "every level is full except the last, and the last fills left to right.\\n\\n";
    std::cout << "that is what makes 2i+1 and 2i+2 valid. A tree with a gap would need\\n";
    std::cout << "real pointers, and the whole reason a heap is fast would be gone.\\n";
}`,
            },
            {
              lang: "rust",
              code: `/// Python's heappush appends and walks the new value up; written out here
/// because the array after each push is the thing being looked at.
fn push(heap: &mut Vec<i32>, v: i32) {
    heap.push(v);
    let mut i = heap.len() - 1;
    while i > 0 {
        let p = (i - 1) / 2;
        if heap[p] <= heap[i] {
            break;
        }
        heap.swap(p, i);
        i = p;
    }
}

fn main() {
    let mut heap: Vec<i32> = Vec::new();
    println!("{:>6}  {:<28} {:<18} min", "push", "array after", "levels");
    println!("{}", "-".repeat(62));
    for v in [5, 3, 8, 1, 9, 2] {
        push(&mut heap, v);
        let mut levels = String::new();
        let mut level = 0u32;
        let mut start = 0usize;
        while start < heap.len() {
            if start > 0 {
                levels.push('|');
            }
            let end = (start + (1usize << level)).min(heap.len());
            for x in &heap[start..end] {
                levels.push_str(&x.to_string());
            }
            start += 1usize << level;
            level += 1;
        }
        let parts: Vec<String> = heap.iter().map(|x| x.to_string()).collect();
        let arr = format!("[{}]", parts.join(", "));
        println!("{:>6}  {:<28} {:<18} {}", v, arr, levels, heap[0]);
    }

    println!();
    println!("the array never has a hole in it, because the tree is always complete:");
    println!("every level is full except the last, and the last fills left to right.");
    println!();
    println!("that is what makes 2i+1 and 2i+2 valid. A tree with a gap would need");
    println!("real pointers, and the whole reason a heap is fast would be gone.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"strconv"
	"strings"
)

// push appends and walks the new value up, the way Python's heappush does;
// written out here because the array after each push is the thing being looked at.
func push(heap []int, v int) []int {
	heap = append(heap, v)
	i := len(heap) - 1
	for i > 0 {
		p := (i - 1) / 2
		if heap[p] <= heap[i] {
			break
		}
		heap[p], heap[i] = heap[i], heap[p]
		i = p
	}
	return heap
}

func main() {
	var heap []int
	fmt.Printf("%6s  %-28s %-18s min\\n", "push", "array after", "levels")
	fmt.Println(strings.Repeat("-", 62))
	for _, v := range []int{5, 3, 8, 1, 9, 2} {
		heap = push(heap, v)
		var levels strings.Builder
		level, start := 0, 0
		for start < len(heap) {
			if start > 0 {
				levels.WriteByte('|')
			}
			end := start + (1 << level)
			if end > len(heap) {
				end = len(heap)
			}
			for _, x := range heap[start:end] {
				levels.WriteString(strconv.Itoa(x))
			}
			start += 1 << level
			level++
		}
		parts := make([]string, len(heap))
		for i, x := range heap {
			parts[i] = strconv.Itoa(x)
		}
		arr := "[" + strings.Join(parts, ", ") + "]"
		fmt.Printf("%6d  %-28s %-18s %d\\n", v, arr, levels.String(), heap[0])
	}

	fmt.Println()
	fmt.Println("the array never has a hole in it, because the tree is always complete:")
	fmt.Println("every level is full except the last, and the last fills left to right.")
	fmt.Println()
	fmt.Println("that is what makes 2i+1 and 2i+2 valid. A tree with a gap would need")
	fmt.Println("real pointers, and the whole reason a heap is fast would be gone.")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "the-trade",
      heading: "What you gave up to get it",
      body: [
        "It is worth being explicit about what is now impossible, because the failure mode is reaching for a heap and then discovering halfway through that it cannot answer the question you actually have.",
        "**Searching is O(n).** There is no ordering to steer a search by, so finding an arbitrary value means scanning every element. A heap is not a set.",
        "**There is no k-th smallest.** The root is the minimum and the rest is unordered, so the second-smallest is *one of two* candidates, the third is one of a larger set, and past that the structure tells you nothing without dismantling it.",
        "**Iteration is not sorted.** Walking the array visits elements in level order, which is not sorted order and is not any order a problem is likely to want. Repeatedly popping *does* give sorted order \u2014 that is heapsort \u2014 but it destroys the heap and costs O(n log n).",
        "Against that, the two things it does give are worth a great deal: the minimum in O(1), and insertion in O(log n) with no rebalancing. Whole families of problems are exactly that shape.",
      ],
      examples: [
        {
          id: "not-sorted",
          title: "What it answers, and what it refuses",
          lang: "python",
          code: `import math

heap = [1, 3, 6, 5, 9, 8]

print("heap:  ", heap)
print("sorted:", sorted(heap))
print("a heap is not a sorted array, and never claims to be")
print()

print("what it answers in O(1):")
print(f"  smallest = heap[0] = {heap[0]}")
print()

print("what it will not answer without a full scan:")
for target in (8, 4):
    steps = 0
    found = False
    for v in heap:                       # no ordering to steer a search by
        steps += 1
        if v == target:
            found = True
            break
    print(f"  is {target} present? {'yes' if found else 'no':3}  after {steps} comparisons of {len(heap)}")

print()
print("contrast a sorted array, where the same question is a binary search:")
print(f"  ~log2({len(heap)}) = {math.ceil(math.log2(len(heap)))} comparisons, and it also answers 'what is the 3rd smallest'")
print()
print("the heap gives up both to make insertion O(log n) instead of O(n)")`,
          output: `heap:   [1, 3, 6, 5, 9, 8]
sorted: [1, 3, 5, 6, 8, 9]
a heap is not a sorted array, and never claims to be

what it answers in O(1):
  smallest = heap[0] = 1

what it will not answer without a full scan:
  is 8 present? yes  after 6 comparisons of 6
  is 4 present? no   after 6 comparisons of 6

contrast a sorted array, where the same question is a binary search:
  ~log2(6) = 3 comparisons, and it also answers 'what is the 3rd smallest'

the heap gives up both to make insertion O(log n) instead of O(n)`,
          explanation:
            "Every structure is a trade, and this is the heap's. A sorted array answers *is x present*, *what is the k-th smallest* and *what is in this range*, all in O(log n) or better \u2014 and pays O(n) for every insertion. The heap answers exactly one question, *what is the smallest*, and pays O(log n) to insert. Reaching for a heap when the question is membership is a common and expensive mistake.",
          alternates: [
            {
              lang: "javascript",
              code: `const heap = [1, 3, 6, 5, 9, 8];
const show = (a) => "[" + a.join(", ") + "]";

console.log("heap:  ", show(heap));
console.log("sorted:", show([...heap].sort((a, b) => a - b)));
console.log("a heap is not a sorted array, and never claims to be");
console.log();

console.log("what it answers in O(1):");
console.log(\`  smallest = heap[0] = \${heap[0]}\`);
console.log();

console.log("what it will not answer without a full scan:");
for (const target of [8, 4]) {
  let steps = 0;
  let found = false;
  for (const v of heap) {            // no ordering to steer a search by
    steps += 1;
    if (v === target) {
      found = true;
      break;
    }
  }
  const label = (found ? "yes" : "no").padEnd(3);
  console.log(\`  is \${target} present? \${label}  after \${steps} comparisons of \${heap.length}\`);
}

console.log();
console.log("contrast a sorted array, where the same question is a binary search:");
console.log(\`  ~log2(\${heap.length}) = \${Math.ceil(Math.log2(heap.length))} comparisons, and it also answers 'what is the 3rd smallest'\`);
console.log();
console.log("the heap gives up both to make insertion O(log n) instead of O(n)");`,
            },
            {
              lang: "typescript",
              code: `const heap = [1, 3, 6, 5, 9, 8];
const show = (a: number[]): string => "[" + a.join(", ") + "]";

console.log("heap:  ", show(heap));
console.log("sorted:", show([...heap].sort((a: number, b: number) => a - b)));
console.log("a heap is not a sorted array, and never claims to be");
console.log();

console.log("what it answers in O(1):");
console.log(\`  smallest = heap[0] = \${heap[0]}\`);
console.log();

console.log("what it will not answer without a full scan:");
for (const target of [8, 4]) {
  let steps = 0;
  let found = false;
  for (const v of heap) {            // no ordering to steer a search by
    steps += 1;
    if (v === target) {
      found = true;
      break;
    }
  }
  const label = (found ? "yes" : "no").padEnd(3);
  console.log(\`  is \${target} present? \${label}  after \${steps} comparisons of \${heap.length}\`);
}

console.log();
console.log("contrast a sorted array, where the same question is a binary search:");
console.log(\`  ~log2(\${heap.length}) = \${Math.ceil(Math.log2(heap.length))} comparisons, and it also answers 'what is the 3rd smallest'\`);
console.log();
console.log("the heap gives up both to make insertion O(log n) instead of O(n)");`,
            },
            {
              lang: "java",
              code: `import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int[] heap = {1, 3, 6, 5, 9, 8};
        int[] ordered = heap.clone();
        Arrays.sort(ordered);

        System.out.println("heap:   " + Arrays.toString(heap));
        System.out.println("sorted: " + Arrays.toString(ordered));
        System.out.println("a heap is not a sorted array, and never claims to be");
        System.out.println();

        System.out.println("what it answers in O(1):");
        System.out.println("  smallest = heap[0] = " + heap[0]);
        System.out.println();

        System.out.println("what it will not answer without a full scan:");
        for (int target : new int[]{8, 4}) {
            int steps = 0;
            boolean found = false;
            for (int v : heap) {                 // no ordering to steer a search by
                steps += 1;
                if (v == target) {
                    found = true;
                    break;
                }
            }
            System.out.printf("  is %d present? %-3s  after %d comparisons of %d%n",
                    target, found ? "yes" : "no", steps, heap.length);
        }

        System.out.println();
        System.out.println("contrast a sorted array, where the same question is a binary search:");
        int bits = (int) Math.ceil(Math.log(heap.length) / Math.log(2));
        System.out.printf("  ~log2(%d) = %d comparisons, and it also answers 'what is the 3rd smallest'%n",
                heap.length, bits);
        System.out.println();
        System.out.println("the heap gives up both to make insertion O(log n) instead of O(n)");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <cmath>
#include <iomanip>
#include <iostream>
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
    const std::vector<int> heap = {1, 3, 6, 5, 9, 8};
    std::vector<int> ordered = heap;
    std::sort(ordered.begin(), ordered.end());

    std::cout << "heap:   " << show(heap) << '\\n';
    std::cout << "sorted: " << show(ordered) << '\\n';
    std::cout << "a heap is not a sorted array, and never claims to be\\n\\n";

    std::cout << "what it answers in O(1):\\n";
    std::cout << "  smallest = heap[0] = " << heap[0] << "\\n\\n";

    std::cout << "what it will not answer without a full scan:\\n";
    for (int target : {8, 4}) {
        int steps = 0;
        bool found = false;
        for (int v : heap) {                     // no ordering to steer a search by
            steps += 1;
            if (v == target) { found = true; break; }
        }
        std::cout << "  is " << target << " present? " << std::left << std::setw(3)
                  << (found ? "yes" : "no") << "  after " << steps
                  << " comparisons of " << heap.size() << '\\n';
    }

    std::cout << "\\ncontrast a sorted array, where the same question is a binary search:\\n";
    int bits = static_cast<int>(std::ceil(std::log2(static_cast<double>(heap.size()))));
    std::cout << "  ~log2(" << heap.size() << ") = " << bits
              << " comparisons, and it also answers 'what is the 3rd smallest'\\n\\n";
    std::cout << "the heap gives up both to make insertion O(log n) instead of O(n)\\n";
}`,
            },
            {
              lang: "rust",
              code: `fn show(a: &[i32]) -> String {
    let parts: Vec<String> = a.iter().map(|v| v.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn main() {
    let heap = [1, 3, 6, 5, 9, 8];
    let mut ordered = heap;
    ordered.sort_unstable();

    println!("heap:   {}", show(&heap));
    println!("sorted: {}", show(&ordered));
    println!("a heap is not a sorted array, and never claims to be");
    println!();

    println!("what it answers in O(1):");
    println!("  smallest = heap[0] = {}", heap[0]);
    println!();

    println!("what it will not answer without a full scan:");
    for target in [8, 4] {
        let mut steps = 0;
        let mut found = false;
        for &v in heap.iter() {
            // no ordering to steer a search by
            steps += 1;
            if v == target {
                found = true;
                break;
            }
        }
        println!("  is {} present? {:<3}  after {} comparisons of {}",
                 target, if found { "yes" } else { "no" }, steps, heap.len());
    }

    println!();
    println!("contrast a sorted array, where the same question is a binary search:");
    let bits = (heap.len() as f64).log2().ceil() as i32;
    println!("  ~log2({}) = {} comparisons, and it also answers 'what is the 3rd smallest'", heap.len(), bits);
    println!();
    println!("the heap gives up both to make insertion O(log n) instead of O(n)");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"math"
	"sort"
	"strconv"
	"strings"
)

func show(a []int) string {
	parts := make([]string, len(a))
	for i, v := range a {
		parts[i] = strconv.Itoa(v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func main() {
	heap := []int{1, 3, 6, 5, 9, 8}
	ordered := append([]int(nil), heap...)
	sort.Ints(ordered)

	fmt.Println("heap:  ", show(heap))
	fmt.Println("sorted:", show(ordered))
	fmt.Println("a heap is not a sorted array, and never claims to be")
	fmt.Println()

	fmt.Println("what it answers in O(1):")
	fmt.Printf("  smallest = heap[0] = %d\\n", heap[0])
	fmt.Println()

	fmt.Println("what it will not answer without a full scan:")
	for _, target := range []int{8, 4} {
		steps := 0
		found := false
		for _, v := range heap { // no ordering to steer a search by
			steps++
			if v == target {
				found = true
				break
			}
		}
		label := "no"
		if found {
			label = "yes"
		}
		fmt.Printf("  is %d present? %-3s  after %d comparisons of %d\\n", target, label, steps, len(heap))
	}

	fmt.Println()
	fmt.Println("contrast a sorted array, where the same question is a binary search:")
	bits := int(math.Ceil(math.Log2(float64(len(heap)))))
	fmt.Printf("  ~log2(%d) = %d comparisons, and it also answers 'what is the 3rd smallest'\\n", len(heap), bits)
	fmt.Println()
	fmt.Println("the heap gives up both to make insertion O(log n) instead of O(n)")
}`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why is a binary heap stored in an array rather than with node objects?",
      answer:
        "Because a heap is always a complete tree, so the positions are known in advance and the parent-child relationships are arithmetic: children of i at 2i+1 and 2i+2, parent at (i-1)//2. Nothing needs to be stored to make that true. The result is one contiguous allocation instead of one per node, no pointer chasing, and cache behaviour that a linked tree cannot match. A tree with gaps could not do this, which is why completeness and speed are the same property here.",
    },
    {
      question: "A heap gives you the minimum in O(1). Why not use it to find the k-th smallest?",
      answer:
        "The heap orders a node against its children and nothing else, so below the root there is no ranking to read off. The second-smallest is one of the root's two children; the third is one of a larger frontier; past that the structure says nothing. You can get the k-th smallest by popping k times, which is O(k log n) and destroys the heap, or by keeping a size-k heap as you scan — but reading it out of the array directly is not possible, and an answer that claims otherwise is the tell that the invariant has not landed.",
    },
    {
      question: "When is a sorted array the better choice?",
      answer:
        "When the collection is built once and queried many times. A sorted array answers membership, k-th smallest and range queries in O(log n) or better, all of which a heap refuses. The heap wins when elements keep arriving: insertion is O(log n) against the sorted array's O(n), and if the only question ever asked is what the smallest element is, the sorted array's extra ordering is work nobody needed.",
    },
  ],
  takeaways: [
    "The heap property relates a node to its children only — siblings and cousins are deliberately unordered.",
    "A weaker invariant is a cheaper invariant: one root-to-leaf path repairs it, which is why there is no rebalancing.",
    "`2i + 1`, `2i + 2` and `(i - 1) // 2` are the entire structure. There are no nodes and no pointers.",
    "The array is dense because the tree is complete, and the tree is complete because insertion appends and removal takes from the end.",
    "A heap is not a set and not a sorted array: search is O(n) and there is no k-th smallest.",
  ],
  status: "available",
};
