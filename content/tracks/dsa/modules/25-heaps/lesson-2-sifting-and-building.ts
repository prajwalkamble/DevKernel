import type { Lesson } from "@/content/types";

export const siftingLesson: Lesson = {
  id: "dsa-heap-sifting",
  slug: "sifting-and-building",
  moduleSlug: "heaps-and-priority-queues",
  title: "Sift Up, Sift Down, and the O(n) Build",
  summary:
    "Two operations, both of which move one value along one path. Then the result that catches people out: turning an arbitrary array into a heap is linear, not n log n, and the reason is where the work sits.",
  estimatedMinutes: 35,
  objectives: [
    "Write sift up and sift down, and say what each one's stopping condition means",
    "Explain why pop promotes the last element rather than a child",
    "Build a heap in place, and justify the O(n) with the shape of the work",
    "Choose between building in place and pushing one at a time",
  ],
  sections: [
    {
      id: "one-path",
      heading: "Every repair is one path",
      body: [
        "The heap property can only be broken in one place at a time, and that is what makes it cheap to maintain. Add a value at the end and the only thing that can be wrong is the relationship between it and its parent. Take the root away and the only thing that can be wrong is the relationship between the replacement and its children.",
        "So the two operations are one idea in two directions. **Sift up** walks a value toward the root while its parent is larger. **Sift down** walks a value toward the leaves while a child is smaller. Both stop as soon as the local relationship holds, because everything beyond that point was already correct.",
        "Neither touches anything off that path. In a complete tree the longest path is \u230alog\u2082 n\u230b edges, so both are O(log n) \u2014 and unlike a balanced search tree there is no rotation, no colour, no rebalancing pass. The structure repairs itself by moving one value.",
      ],
      examples: [
        {
          id: "sift-up",
          title: "Push: append, then climb",
          lang: "python",
          code: `import math


def sift_up(heap, i):
    """Walk one value toward the root until its parent is no larger."""
    while i > 0:
        p = (i - 1) // 2
        if heap[p] <= heap[i]:
            break
        print(f"    heap[{p}]={heap[p]} > heap[{i}]={heap[i]}  -> swap")
        heap[p], heap[i] = heap[i], heap[p]
        i = p
    return i


def push(heap, v):
    print(f"push {v}: append, then sift up from index {len(heap)}")
    heap.append(v)
    end = sift_up(heap, len(heap) - 1)
    print(f"    settled at index {end}: {heap}")


heap = [1, 3, 6, 5, 9, 8]
print("start:", heap)
push(heap, 4)
push(heap, 0)
print()
print("each push touched one root-to-leaf path and nothing else.")
height = math.floor(math.log2(len(heap)))
print(f"a heap of {len(heap)} has height {height}, so that path is at most {height} swaps.")`,
          output: `start: [1, 3, 6, 5, 9, 8]
push 4: append, then sift up from index 6
    heap[2]=6 > heap[6]=4  -> swap
    settled at index 2: [1, 3, 4, 5, 9, 8, 6]
push 0: append, then sift up from index 7
    heap[3]=5 > heap[7]=0  -> swap
    heap[1]=3 > heap[3]=0  -> swap
    heap[0]=1 > heap[1]=0  -> swap
    settled at index 0: [0, 1, 4, 3, 9, 8, 6, 5]

each push touched one root-to-leaf path and nothing else.
a heap of 8 has height 3, so that path is at most 3 swaps.`,
          explanation:
            "Appending keeps the tree complete, and then exactly one thing can be wrong \u2014 the new value may be smaller than its parent. Fixing that may break the same property one level up, so the repair walks upward until it stops, which is at most the height of the tree. Note the loop condition: it stops the moment the parent is no larger, because everything above that point was already correct and nothing the new value did could have changed it.",
          alternates: [
            {
              lang: "javascript",
              code: `const show = (a) => "[" + a.join(", ") + "]";

/** Walk one value toward the root until its parent is no larger. */
function siftUp(heap, i) {
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (heap[p] <= heap[i]) break;
    console.log(\`    heap[\${p}]=\${heap[p]} > heap[\${i}]=\${heap[i]}  -> swap\`);
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
  return i;
}

function push(heap, v) {
  console.log(\`push \${v}: append, then sift up from index \${heap.length}\`);
  heap.push(v);
  const end = siftUp(heap, heap.length - 1);
  console.log(\`    settled at index \${end}: \${show(heap)}\`);
}

const heap = [1, 3, 6, 5, 9, 8];
console.log("start:", show(heap));
push(heap, 4);
push(heap, 0);
console.log();
console.log("each push touched one root-to-leaf path and nothing else.");
const height = Math.floor(Math.log2(heap.length));
console.log(\`a heap of \${heap.length} has height \${height}, so that path is at most \${height} swaps.\`);`,
            },
            {
              lang: "typescript",
              code: `const show = (a: number[]): string => "[" + a.join(", ") + "]";

/** Walk one value toward the root until its parent is no larger. */
function siftUp(heap: number[], i: number): number {
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (heap[p] <= heap[i]) break;
    console.log(\`    heap[\${p}]=\${heap[p]} > heap[\${i}]=\${heap[i]}  -> swap\`);
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
  return i;
}

function push(heap: number[], v: number): void {
  console.log(\`push \${v}: append, then sift up from index \${heap.length}\`);
  heap.push(v);
  const end = siftUp(heap, heap.length - 1);
  console.log(\`    settled at index \${end}: \${show(heap)}\`);
}

const heap = [1, 3, 6, 5, 9, 8];
console.log("start:", show(heap));
push(heap, 4);
push(heap, 0);
console.log();
console.log("each push touched one root-to-leaf path and nothing else.");
const height = Math.floor(Math.log2(heap.length));
console.log(\`a heap of \${heap.length} has height \${height}, so that path is at most \${height} swaps.\`);`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.List;

public class Main {
    /** Walk one value toward the root until its parent is no larger. */
    static int siftUp(List<Integer> heap, int i) {
        while (i > 0) {
            int p = (i - 1) / 2;
            if (heap.get(p) <= heap.get(i)) break;
            System.out.printf("    heap[%d]=%d > heap[%d]=%d  -> swap%n", p, heap.get(p), i, heap.get(i));
            int t = heap.get(p);
            heap.set(p, heap.get(i));
            heap.set(i, t);
            i = p;
        }
        return i;
    }

    static void push(List<Integer> heap, int v) {
        System.out.printf("push %d: append, then sift up from index %d%n", v, heap.size());
        heap.add(v);
        int end = siftUp(heap, heap.size() - 1);
        System.out.printf("    settled at index %d: %s%n", end, heap);
    }

    public static void main(String[] args) {
        List<Integer> heap = new ArrayList<>(List.of(1, 3, 6, 5, 9, 8));
        System.out.println("start: " + heap);
        push(heap, 4);
        push(heap, 0);
        System.out.println();
        System.out.println("each push touched one root-to-leaf path and nothing else.");
        int height = (int) Math.floor(Math.log(heap.size()) / Math.log(2));
        System.out.printf("a heap of %d has height %d, so that path is at most %d swaps.%n",
                heap.size(), height, height);
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <cmath>
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

// Walk one value toward the root until its parent is no larger.
static size_t sift_up(std::vector<int>& heap, size_t i) {
    while (i > 0) {
        size_t p = (i - 1) / 2;
        if (heap[p] <= heap[i]) break;
        std::cout << "    heap[" << p << "]=" << heap[p] << " > heap[" << i << "]="
                  << heap[i] << "  -> swap\\n";
        std::swap(heap[p], heap[i]);
        i = p;
    }
    return i;
}

static void push(std::vector<int>& heap, int v) {
    std::cout << "push " << v << ": append, then sift up from index " << heap.size() << '\\n';
    heap.push_back(v);
    size_t end = sift_up(heap, heap.size() - 1);
    std::cout << "    settled at index " << end << ": " << show(heap) << '\\n';
}

int main() {
    std::vector<int> heap = {1, 3, 6, 5, 9, 8};
    std::cout << "start: " << show(heap) << '\\n';
    push(heap, 4);
    push(heap, 0);
    std::cout << "\\neach push touched one root-to-leaf path and nothing else.\\n";
    int height = static_cast<int>(std::floor(std::log2(static_cast<double>(heap.size()))));
    std::cout << "a heap of " << heap.size() << " has height " << height
              << ", so that path is at most " << height << " swaps.\\n";
}`,
            },
            {
              lang: "rust",
              code: `fn show(a: &[i32]) -> String {
    let parts: Vec<String> = a.iter().map(|v| v.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

/// Walk one value toward the root until its parent is no larger.
fn sift_up(heap: &mut Vec<i32>, mut i: usize) -> usize {
    while i > 0 {
        let p = (i - 1) / 2;
        if heap[p] <= heap[i] {
            break;
        }
        println!("    heap[{}]={} > heap[{}]={}  -> swap", p, heap[p], i, heap[i]);
        heap.swap(p, i);
        i = p;
    }
    i
}

fn push(heap: &mut Vec<i32>, v: i32) {
    println!("push {}: append, then sift up from index {}", v, heap.len());
    heap.push(v);
    let end = sift_up(heap, heap.len() - 1);
    println!("    settled at index {}: {}", end, show(heap));
}

fn main() {
    let mut heap = vec![1, 3, 6, 5, 9, 8];
    println!("start: {}", show(&heap));
    push(&mut heap, 4);
    push(&mut heap, 0);
    println!();
    println!("each push touched one root-to-leaf path and nothing else.");
    let height = (heap.len() as f64).log2().floor() as i32;
    println!("a heap of {} has height {}, so that path is at most {} swaps.", heap.len(), height, height);
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

func show(a []int) string {
	parts := make([]string, len(a))
	for i, v := range a {
		parts[i] = strconv.Itoa(v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

// siftUp walks one value toward the root until its parent is no larger.
func siftUp(heap []int, i int) int {
	for i > 0 {
		p := (i - 1) / 2
		if heap[p] <= heap[i] {
			break
		}
		fmt.Printf("    heap[%d]=%d > heap[%d]=%d  -> swap\\n", p, heap[p], i, heap[i])
		heap[p], heap[i] = heap[i], heap[p]
		i = p
	}
	return i
}

func push(heap []int, v int) []int {
	fmt.Printf("push %d: append, then sift up from index %d\\n", v, len(heap))
	heap = append(heap, v)
	end := siftUp(heap, len(heap)-1)
	fmt.Printf("    settled at index %d: %s\\n", end, show(heap))
	return heap
}

func main() {
	heap := []int{1, 3, 6, 5, 9, 8}
	fmt.Println("start:", show(heap))
	heap = push(heap, 4)
	heap = push(heap, 0)
	fmt.Println()
	fmt.Println("each push touched one root-to-leaf path and nothing else.")
	height := int(math.Floor(math.Log2(float64(len(heap)))))
	fmt.Printf("a heap of %d has height %d, so that path is at most %d swaps.\\n", len(heap), height, height)
}`,
            },
          ],
        },
      ],
      visual: {
        id: "sift-visual",
        kind: "heap",
        title: "One value, one path",
      },
    },
    {
      id: "the-hole",
      heading: "Why pop takes from the end",
      body: [
        "Removing the root leaves a hole, and how you fill it decides whether the array stays dense.",
        "The tempting move is to promote the smaller of the two children, then fill *its* hole the same way. That produces a correct heap by ordering \u2014 and a tree with a gap somewhere in the last level, which destroys completeness and with it the index arithmetic that the whole structure rests on.",
        "So the last element moves to the root instead. It is the only element that can be removed without opening a hole. It is also, almost certainly, one of the largest things in the heap, so it immediately falls most of the way back down \u2014 which looks wasteful and is not: the path it falls is the same O(log n) the alternative would have cost, and the array stays contiguous.",
      ],
      examples: [
        {
          id: "sift-down",
          title: "Pop: take the last, then fall",
          lang: "python",
          code: `def sift_down(heap, i, n):
    """Walk one value toward the leaves until both children are no smaller."""
    while True:
        smallest = i
        for c in (2 * i + 1, 2 * i + 2):
            if c < n and heap[c] < heap[smallest]:
                smallest = c
        if smallest == i:
            return i
        print(f"    heap[{i}]={heap[i]} > heap[{smallest}]={heap[smallest]}  -> swap")
        heap[i], heap[smallest] = heap[smallest], heap[i]
        i = smallest


def pop(heap):
    smallest = heap[0]
    last = heap.pop()
    print(f"pop {smallest}: move {last} from the end to the root, then sift down")
    if heap:
        heap[0] = last
        end = sift_down(heap, 0, len(heap))
        print(f"    settled at index {end}: {heap}")
    return smallest


heap = [0, 1, 4, 3, 9, 8, 6, 5]
print("start:", heap)
pop(heap)
pop(heap)
print()
print("the last element is the only one that can leave without opening a hole,")
print("which is why it — and not a child — is what replaces the root.")
print()
print("note the comparison count: two children per level, so sift-down does")
print("two comparisons per step where sift-up does one. Same O(log n), twice the constant.")`,
          output: `start: [0, 1, 4, 3, 9, 8, 6, 5]
pop 0: move 5 from the end to the root, then sift down
    heap[0]=5 > heap[1]=1  -> swap
    heap[1]=5 > heap[3]=3  -> swap
    settled at index 3: [1, 3, 4, 5, 9, 8, 6]
pop 1: move 6 from the end to the root, then sift down
    heap[0]=6 > heap[1]=3  -> swap
    heap[1]=6 > heap[3]=5  -> swap
    settled at index 3: [3, 5, 4, 6, 9, 8]

the last element is the only one that can leave without opening a hole,
which is why it — and not a child — is what replaces the root.

note the comparison count: two children per level, so sift-down does
two comparisons per step where sift-up does one. Same O(log n), twice the constant.`,
          explanation:
            "The obvious move \u2014 promote the smaller child into the hole and repeat \u2014 leaves a hole at a leaf and breaks completeness. Taking the *last* element instead keeps the array dense, at the cost of putting an almost-certainly-wrong value at the root, which then falls. The asymmetry with sift-up is worth noticing: climbing compares against one parent, falling compares against two children, so pop does roughly twice the comparisons of push at the same height.",
          alternates: [
            {
              lang: "javascript",
              code: `const show = (a) => "[" + a.join(", ") + "]";

/** Walk one value toward the leaves until both children are no smaller. */
function siftDown(heap, i, n) {
  for (;;) {
    let smallest = i;
    for (const c of [2 * i + 1, 2 * i + 2]) {
      if (c < n && heap[c] < heap[smallest]) smallest = c;
    }
    if (smallest === i) return i;
    console.log(\`    heap[\${i}]=\${heap[i]} > heap[\${smallest}]=\${heap[smallest]}  -> swap\`);
    [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
    i = smallest;
  }
}

function pop(heap) {
  const smallest = heap[0];
  const last = heap.pop();
  console.log(\`pop \${smallest}: move \${last} from the end to the root, then sift down\`);
  if (heap.length > 0) {
    heap[0] = last;
    const end = siftDown(heap, 0, heap.length);
    console.log(\`    settled at index \${end}: \${show(heap)}\`);
  }
  return smallest;
}

const heap = [0, 1, 4, 3, 9, 8, 6, 5];
console.log("start:", show(heap));
pop(heap);
pop(heap);
console.log();
console.log("the last element is the only one that can leave without opening a hole,");
console.log("which is why it — and not a child — is what replaces the root.");
console.log();
console.log("note the comparison count: two children per level, so sift-down does");
console.log("two comparisons per step where sift-up does one. Same O(log n), twice the constant.");`,
            },
            {
              lang: "typescript",
              code: `const show = (a: number[]): string => "[" + a.join(", ") + "]";

/** Walk one value toward the leaves until both children are no smaller. */
function siftDown(heap: number[], i: number, n: number): number {
  for (;;) {
    let smallest = i;
    for (const c of [2 * i + 1, 2 * i + 2]) {
      if (c < n && heap[c] < heap[smallest]) smallest = c;
    }
    if (smallest === i) return i;
    console.log(\`    heap[\${i}]=\${heap[i]} > heap[\${smallest}]=\${heap[smallest]}  -> swap\`);
    [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
    i = smallest;
  }
}

function pop(heap: number[]): number {
  const smallest = heap[0];
  const last = heap.pop() as number;
  console.log(\`pop \${smallest}: move \${last} from the end to the root, then sift down\`);
  if (heap.length > 0) {
    heap[0] = last;
    const end = siftDown(heap, 0, heap.length);
    console.log(\`    settled at index \${end}: \${show(heap)}\`);
  }
  return smallest;
}

const heap = [0, 1, 4, 3, 9, 8, 6, 5];
console.log("start:", show(heap));
pop(heap);
pop(heap);
console.log();
console.log("the last element is the only one that can leave without opening a hole,");
console.log("which is why it — and not a child — is what replaces the root.");
console.log();
console.log("note the comparison count: two children per level, so sift-down does");
console.log("two comparisons per step where sift-up does one. Same O(log n), twice the constant.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.List;

public class Main {
    /** Walk one value toward the leaves until both children are no smaller. */
    static int siftDown(List<Integer> heap, int i, int n) {
        while (true) {
            int smallest = i;
            for (int c : new int[]{2 * i + 1, 2 * i + 2}) {
                if (c < n && heap.get(c) < heap.get(smallest)) smallest = c;
            }
            if (smallest == i) return i;
            System.out.printf("    heap[%d]=%d > heap[%d]=%d  -> swap%n",
                    i, heap.get(i), smallest, heap.get(smallest));
            int t = heap.get(i);
            heap.set(i, heap.get(smallest));
            heap.set(smallest, t);
            i = smallest;
        }
    }

    static int pop(List<Integer> heap) {
        int smallest = heap.get(0);
        int last = heap.remove(heap.size() - 1);
        System.out.printf("pop %d: move %d from the end to the root, then sift down%n", smallest, last);
        if (!heap.isEmpty()) {
            heap.set(0, last);
            int end = siftDown(heap, 0, heap.size());
            System.out.printf("    settled at index %d: %s%n", end, heap);
        }
        return smallest;
    }

    public static void main(String[] args) {
        List<Integer> heap = new ArrayList<>(List.of(0, 1, 4, 3, 9, 8, 6, 5));
        System.out.println("start: " + heap);
        pop(heap);
        pop(heap);
        System.out.println();
        System.out.println("the last element is the only one that can leave without opening a hole,");
        System.out.println("which is why it — and not a child — is what replaces the root.");
        System.out.println();
        System.out.println("note the comparison count: two children per level, so sift-down does");
        System.out.println("two comparisons per step where sift-up does one. Same O(log n), twice the constant.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <iostream>
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

// Walk one value toward the leaves until both children are no smaller.
static size_t sift_down(std::vector<int>& heap, size_t i, size_t n) {
    for (;;) {
        size_t smallest = i;
        for (size_t c : {2 * i + 1, 2 * i + 2}) {
            if (c < n && heap[c] < heap[smallest]) smallest = c;
        }
        if (smallest == i) return i;
        std::cout << "    heap[" << i << "]=" << heap[i] << " > heap[" << smallest
                  << "]=" << heap[smallest] << "  -> swap\\n";
        std::swap(heap[i], heap[smallest]);
        i = smallest;
    }
}

static int pop(std::vector<int>& heap) {
    int smallest = heap[0];
    int last = heap.back();
    heap.pop_back();
    std::cout << "pop " << smallest << ": move " << last
              << " from the end to the root, then sift down\\n";
    if (!heap.empty()) {
        heap[0] = last;
        size_t end = sift_down(heap, 0, heap.size());
        std::cout << "    settled at index " << end << ": " << show(heap) << '\\n';
    }
    return smallest;
}

int main() {
    std::vector<int> heap = {0, 1, 4, 3, 9, 8, 6, 5};
    std::cout << "start: " << show(heap) << '\\n';
    pop(heap);
    pop(heap);
    std::cout << "\\nthe last element is the only one that can leave without opening a hole,\\n";
    std::cout << "which is why it — and not a child — is what replaces the root.\\n\\n";
    std::cout << "note the comparison count: two children per level, so sift-down does\\n";
    std::cout << "two comparisons per step where sift-up does one. Same O(log n), twice the constant.\\n";
}`,
            },
            {
              lang: "rust",
              code: `fn show(a: &[i32]) -> String {
    let parts: Vec<String> = a.iter().map(|v| v.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

/// Walk one value toward the leaves until both children are no smaller.
fn sift_down(heap: &mut [i32], mut i: usize, n: usize) -> usize {
    loop {
        let mut smallest = i;
        for c in [2 * i + 1, 2 * i + 2] {
            if c < n && heap[c] < heap[smallest] {
                smallest = c;
            }
        }
        if smallest == i {
            return i;
        }
        println!("    heap[{}]={} > heap[{}]={}  -> swap", i, heap[i], smallest, heap[smallest]);
        heap.swap(i, smallest);
        i = smallest;
    }
}

fn pop(heap: &mut Vec<i32>) -> i32 {
    let smallest = heap[0];
    let last = heap.pop().unwrap();
    println!("pop {}: move {} from the end to the root, then sift down", smallest, last);
    if !heap.is_empty() {
        heap[0] = last;
        let n = heap.len();
        let end = sift_down(heap, 0, n);
        println!("    settled at index {}: {}", end, show(heap));
    }
    smallest
}

fn main() {
    let mut heap = vec![0, 1, 4, 3, 9, 8, 6, 5];
    println!("start: {}", show(&heap));
    pop(&mut heap);
    pop(&mut heap);
    println!();
    println!("the last element is the only one that can leave without opening a hole,");
    println!("which is why it — and not a child — is what replaces the root.");
    println!();
    println!("note the comparison count: two children per level, so sift-down does");
    println!("two comparisons per step where sift-up does one. Same O(log n), twice the constant.");
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

func show(a []int) string {
	parts := make([]string, len(a))
	for i, v := range a {
		parts[i] = strconv.Itoa(v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

// siftDown walks one value toward the leaves until both children are no smaller.
func siftDown(heap []int, i, n int) int {
	for {
		smallest := i
		for _, c := range []int{2*i + 1, 2*i + 2} {
			if c < n && heap[c] < heap[smallest] {
				smallest = c
			}
		}
		if smallest == i {
			return i
		}
		fmt.Printf("    heap[%d]=%d > heap[%d]=%d  -> swap\\n", i, heap[i], smallest, heap[smallest])
		heap[i], heap[smallest] = heap[smallest], heap[i]
		i = smallest
	}
}

func pop(heap []int) ([]int, int) {
	smallest := heap[0]
	last := heap[len(heap)-1]
	heap = heap[:len(heap)-1]
	fmt.Printf("pop %d: move %d from the end to the root, then sift down\\n", smallest, last)
	if len(heap) > 0 {
		heap[0] = last
		end := siftDown(heap, 0, len(heap))
		fmt.Printf("    settled at index %d: %s\\n", end, show(heap))
	}
	return heap, smallest
}

func main() {
	heap := []int{0, 1, 4, 3, 9, 8, 6, 5}
	fmt.Println("start:", show(heap))
	heap, _ = pop(heap)
	heap, _ = pop(heap)
	fmt.Println()
	fmt.Println("the last element is the only one that can leave without opening a hole,")
	fmt.Println("which is why it — and not a child — is what replaces the root.")
	fmt.Println()
	fmt.Println("note the comparison count: two children per level, so sift-down does")
	fmt.Println("two comparisons per step where sift-up does one. Same O(log n), twice the constant.")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "build",
      heading: "Building a heap from a pile",
      body: [
        "Given n values already in hand, there are two ways to make them a heap, and they do not cost the same.",
        "Push them one at a time and you do n sift-ups. Each one starts at a leaf, which is where most of the array lives, so in the worst case each climbs the full height: O(n log n).",
        "Or drop the whole array in as it stands and sift *down* from the last internal node backwards. Every leaf is already a valid one-element heap, so half the array needs no work at all; the level above moves at most one step, the level above that at most two. The work is dominated by the many cheap nodes rather than the few expensive ones, and the total is O(n) \u2014 a genuinely surprising result the first time you meet it, and one of the few places where a tighter analysis changes the complexity rather than just the constant.",
        "The practical rule: if you already have the data, build in place. If it arrives over time, you have no choice but to push.",
      ],
      examples: [
        {
          id: "build-heap",
          title: "Building in place, and the O(n) that surprises people",
          lang: "python",
          code: `swaps = 0


def sift_down(heap, i, n):
    global swaps
    while True:
        smallest = i
        for c in (2 * i + 1, 2 * i + 2):
            if c < n and heap[c] < heap[smallest]:
                smallest = c
        if smallest == i:
            return
        heap[i], heap[smallest] = heap[smallest], heap[i]
        swaps += 1
        i = smallest


def sift_up(heap, i):
    global swaps
    while i > 0:
        p = (i - 1) // 2
        if heap[p] <= heap[i]:
            return
        heap[p], heap[i] = heap[i], heap[p]
        swaps += 1
        i = p


def build_by_pushing(values):
    global swaps
    swaps = 0
    heap = []
    for v in values:
        heap.append(v)
        sift_up(heap, len(heap) - 1)
    return heap, swaps


def build_in_place(values):
    """Sift down from the last internal node backwards. The leaves are already heaps."""
    global swaps
    swaps = 0
    heap = list(values)
    for i in range(len(heap) // 2 - 1, -1, -1):
        sift_down(heap, i, len(heap))
    return heap, swaps


seed = 7


def next_rand():
    global seed
    seed = (seed * 16807) % 2147483647
    return seed


def report(name, make):
    print(f"{name}")
    print(f"{'n':>8} {'by pushing':>12} {'in place':>10} {'ratio':>7}")
    print("-" * 40)
    for n in (8, 64, 1_000, 100_000):
        data = make(n)
        a, pushes = build_by_pushing(data)
        b, inplace = build_in_place(data)
        assert a[0] == b[0] == min(data)
        print(f"{n:>8} {pushes:>12,} {inplace:>10,} {pushes / max(inplace, 1):>6.2f}x")
    print()


report("random input", lambda n: [next_rand() % 1000 for _ in range(n)])
report("descending input — the worst case for pushing", lambda n: list(range(n, 0, -1)))

print("the asymptotic claim is about the second table, not the first.")
print("on random data almost every pushed value stops within a step or two of")
print("where it landed, so both builds are linear and the gap is a constant.")
print("feed it descending values and every single push travels to the root:")
print("that is the O(n log n) the textbook means, and in-place stays O(n).")`,
          output: `random input
       n   by pushing   in place   ratio
----------------------------------------
       8            7          6   1.17x
      64           64         40   1.60x
    1000        1,325        764   1.73x
  100000      127,062     74,200   1.71x

descending input — the worst case for pushing
       n   by pushing   in place   ratio
----------------------------------------
       8           13          6   2.17x
      64          264         59   4.47x
    1000        7,987        992   8.05x
  100000    1,468,946     99,990  14.69x

the asymptotic claim is about the second table, not the first.
on random data almost every pushed value stops within a step or two of
where it landed, so both builds are linear and the gap is a constant.
feed it descending values and every single push travels to the root:
that is the O(n log n) the textbook means, and in-place stays O(n).`,
          explanation:
            "The counting is the argument. Sifting *down* from the middle backwards does most of its work near the leaves, where there is almost nowhere to fall: half the elements are leaves and move zero steps, a quarter move at most one, and the sum \u2211 n/2^k \u00b7 k converges to 2n. Sifting *up* has the opposite profile \u2014 most elements are near the leaves, and from there the path to the root is the full height. The second table is where that shows: with values arriving in descending order every push climbs the whole way, and the ratio grows with n exactly as O(n log n) against O(n) predicts. The first table is the honest caveat \u2014 on random input both are linear in practice and the difference is a constant.",
          alternates: [
            {
              lang: "javascript",
              code: `let swaps = 0;

function siftDown(heap, i, n) {
  for (;;) {
    let smallest = i;
    for (const c of [2 * i + 1, 2 * i + 2]) {
      if (c < n && heap[c] < heap[smallest]) smallest = c;
    }
    if (smallest === i) return;
    [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
    swaps += 1;
    i = smallest;
  }
}

function siftUp(heap, i) {
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (heap[p] <= heap[i]) return;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    swaps += 1;
    i = p;
  }
}

function buildByPushing(values) {
  swaps = 0;
  const heap = [];
  for (const v of values) {
    heap.push(v);
    siftUp(heap, heap.length - 1);
  }
  return [heap, swaps];
}

/** Sift down from the last internal node backwards. The leaves are already heaps. */
function buildInPlace(values) {
  swaps = 0;
  const heap = [...values];
  for (let i = Math.floor(heap.length / 2) - 1; i >= 0; i--) siftDown(heap, i, heap.length);
  return [heap, swaps];
}

let seed = 7;
function nextRand() {
  seed = (seed * 16807) % 2147483647;
  return seed;
}

const group = (n) => String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");
const pad = (s, w) => String(s).padStart(w);

function report(name, make) {
  console.log(name);
  console.log(\`\${pad("n", 8)} \${pad("by pushing", 12)} \${pad("in place", 10)} \${pad("ratio", 7)}\`);
  console.log("-".repeat(40));
  for (const n of [8, 64, 1000, 100000]) {
    const data = make(n);
    const [a, pushes] = buildByPushing(data);
    const [b, inplace] = buildInPlace(data);
    const smallest = Math.min(...data);
    if (a[0] !== smallest || b[0] !== smallest) throw new Error("not a heap");
    console.log(\`\${pad(n, 8)} \${pad(group(pushes), 12)} \${pad(group(inplace), 10)} \${pad((pushes / Math.max(inplace, 1)).toFixed(2), 6)}x\`);
  }
  console.log();
}

report("random input", (n) => Array.from({ length: n }, () => nextRand() % 1000));
report("descending input — the worst case for pushing", (n) => Array.from({ length: n }, (_, i) => n - i));

console.log("the asymptotic claim is about the second table, not the first.");
console.log("on random data almost every pushed value stops within a step or two of");
console.log("where it landed, so both builds are linear and the gap is a constant.");
console.log("feed it descending values and every single push travels to the root:");
console.log("that is the O(n log n) the textbook means, and in-place stays O(n).");`,
            },
            {
              lang: "typescript",
              code: `let swaps = 0;

function siftDown(heap: number[], i: number, n: number): void {
  for (;;) {
    let smallest = i;
    for (const c of [2 * i + 1, 2 * i + 2]) {
      if (c < n && heap[c] < heap[smallest]) smallest = c;
    }
    if (smallest === i) return;
    [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
    swaps += 1;
    i = smallest;
  }
}

function siftUp(heap: number[], i: number): void {
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (heap[p] <= heap[i]) return;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    swaps += 1;
    i = p;
  }
}

function buildByPushing(values: number[]): [number[], number] {
  swaps = 0;
  const heap: number[] = [];
  for (const v of values) {
    heap.push(v);
    siftUp(heap, heap.length - 1);
  }
  return [heap, swaps];
}

/** Sift down from the last internal node backwards. The leaves are already heaps. */
function buildInPlace(values: number[]): [number[], number] {
  swaps = 0;
  const heap = [...values];
  for (let i = Math.floor(heap.length / 2) - 1; i >= 0; i--) siftDown(heap, i, heap.length);
  return [heap, swaps];
}

let seed = 7;
function nextRand(): number {
  seed = (seed * 16807) % 2147483647;
  return seed;
}

const group = (n: number): string => String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");
const pad = (s: string | number, w: number): string => String(s).padStart(w);

function report(name: string, make: (n: number) => number[]): void {
  console.log(name);
  console.log(\`\${pad("n", 8)} \${pad("by pushing", 12)} \${pad("in place", 10)} \${pad("ratio", 7)}\`);
  console.log("-".repeat(40));
  for (const n of [8, 64, 1000, 100000]) {
    const data = make(n);
    const [a, pushes] = buildByPushing(data);
    const [b, inplace] = buildInPlace(data);
    const smallest = Math.min(...data);
    if (a[0] !== smallest || b[0] !== smallest) throw new Error("not a heap");
    console.log(\`\${pad(n, 8)} \${pad(group(pushes), 12)} \${pad(group(inplace), 10)} \${pad((pushes / Math.max(inplace, 1)).toFixed(2), 6)}x\`);
  }
  console.log();
}

report("random input", (n) => Array.from({ length: n }, () => nextRand() % 1000));
report("descending input — the worst case for pushing", (n) => Array.from({ length: n }, (_, i) => n - i));

console.log("the asymptotic claim is about the second table, not the first.");
console.log("on random data almost every pushed value stops within a step or two of");
console.log("where it landed, so both builds are linear and the gap is a constant.");
console.log("feed it descending values and every single push travels to the root:");
console.log("that is the O(n log n) the textbook means, and in-place stays O(n).");`,
            },
            {
              lang: "java",
              code: `import java.util.function.IntFunction;

public class Main {
    static long swaps = 0;

    static void siftDown(int[] heap, int i, int n) {
        while (true) {
            int smallest = i;
            for (int c : new int[]{2 * i + 1, 2 * i + 2}) {
                if (c < n && heap[c] < heap[smallest]) smallest = c;
            }
            if (smallest == i) return;
            int t = heap[i]; heap[i] = heap[smallest]; heap[smallest] = t;
            swaps += 1;
            i = smallest;
        }
    }

    static void siftUp(int[] heap, int i) {
        while (i > 0) {
            int p = (i - 1) / 2;
            if (heap[p] <= heap[i]) return;
            int t = heap[p]; heap[p] = heap[i]; heap[i] = t;
            swaps += 1;
            i = p;
        }
    }

    static int[] buildByPushing(int[] values) {
        swaps = 0;
        int[] heap = new int[values.length];
        int size = 0;
        for (int v : values) {
            heap[size] = v;
            size += 1;
            siftUp(heap, size - 1);
        }
        return heap;
    }

    /** Sift down from the last internal node backwards. The leaves are already heaps. */
    static int[] buildInPlace(int[] values) {
        swaps = 0;
        int[] heap = values.clone();
        for (int i = heap.length / 2 - 1; i >= 0; i--) siftDown(heap, i, heap.length);
        return heap;
    }

    static long seed = 7;

    static long nextRand() {
        seed = (seed * 16807) % 2147483647L;
        return seed;
    }

    static void report(String name, IntFunction<int[]> make) {
        System.out.println(name);
        System.out.printf("%8s %12s %10s %7s%n", "n", "by pushing", "in place", "ratio");
        System.out.println("-".repeat(40));
        for (int n : new int[]{8, 64, 1_000, 100_000}) {
            int[] data = make.apply(n);
            int[] a = buildByPushing(data);
            long pushes = swaps;
            int[] b = buildInPlace(data);
            long inplace = swaps;
            int smallest = Integer.MAX_VALUE;
            for (int v : data) smallest = Math.min(smallest, v);
            if (a[0] != smallest || b[0] != smallest) throw new AssertionError("not a heap");
            System.out.printf("%8d %,12d %,10d %6.2fx%n", n, pushes, inplace,
                    (double) pushes / Math.max(inplace, 1));
        }
        System.out.println();
    }

    public static void main(String[] args) {
        report("random input", n -> {
            int[] out = new int[n];
            for (int i = 0; i < n; i++) out[i] = (int) (nextRand() % 1000);
            return out;
        });
        report("descending input — the worst case for pushing", n -> {
            int[] out = new int[n];
            for (int i = 0; i < n; i++) out[i] = n - i;
            return out;
        });

        System.out.println("the asymptotic claim is about the second table, not the first.");
        System.out.println("on random data almost every pushed value stops within a step or two of");
        System.out.println("where it landed, so both builds are linear and the gap is a constant.");
        System.out.println("feed it descending values and every single push travels to the root:");
        System.out.println("that is the O(n log n) the textbook means, and in-place stays O(n).");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <functional>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

static long long swaps = 0;

static void sift_down(std::vector<int>& heap, size_t i, size_t n) {
    for (;;) {
        size_t smallest = i;
        for (size_t c : {2 * i + 1, 2 * i + 2}) {
            if (c < n && heap[c] < heap[smallest]) smallest = c;
        }
        if (smallest == i) return;
        std::swap(heap[i], heap[smallest]);
        swaps += 1;
        i = smallest;
    }
}

static void sift_up(std::vector<int>& heap, size_t i) {
    while (i > 0) {
        size_t p = (i - 1) / 2;
        if (heap[p] <= heap[i]) return;
        std::swap(heap[p], heap[i]);
        swaps += 1;
        i = p;
    }
}

static std::vector<int> build_by_pushing(const std::vector<int>& values) {
    swaps = 0;
    std::vector<int> heap;
    for (int v : values) {
        heap.push_back(v);
        sift_up(heap, heap.size() - 1);
    }
    return heap;
}

// Sift down from the last internal node backwards. The leaves are already heaps.
static std::vector<int> build_in_place(const std::vector<int>& values) {
    swaps = 0;
    std::vector<int> heap = values;
    for (int i = static_cast<int>(heap.size()) / 2 - 1; i >= 0; --i) {
        sift_down(heap, static_cast<size_t>(i), heap.size());
    }
    return heap;
}

static long long seed = 7;

static long long next_rand() {
    seed = (seed * 16807) % 2147483647LL;
    return seed;
}

static std::string group(long long n) {
    std::string s = std::to_string(n), out;
    for (size_t i = 0; i < s.size(); ++i) {
        if (i > 0 && (s.size() - i) % 3 == 0) out += ',';
        out += s[i];
    }
    return out;
}

static void report(const std::string& name, const std::function<std::vector<int>(int)>& make) {
    std::cout << name << '\\n';
    std::cout << std::right << std::setw(8) << "n" << ' ' << std::setw(12) << "by pushing"
              << ' ' << std::setw(10) << "in place" << ' ' << std::setw(7) << "ratio" << '\\n';
    std::cout << std::string(40, '-') << '\\n';
    for (int n : {8, 64, 1000, 100000}) {
        std::vector<int> data = make(n);
        std::vector<int> a = build_by_pushing(data);
        long long pushes = swaps;
        std::vector<int> b = build_in_place(data);
        long long inplace = swaps;
        int smallest = *std::min_element(data.begin(), data.end());
        if (a[0] != smallest || b[0] != smallest) { std::cerr << "not a heap\\n"; std::exit(1); }
        std::ostringstream ratio;
        ratio << std::fixed << std::setprecision(2)
              << static_cast<double>(pushes) / std::max<long long>(inplace, 1);
        std::cout << std::setw(8) << n << ' ' << std::setw(12) << group(pushes)
                  << ' ' << std::setw(10) << group(inplace)
                  << ' ' << std::setw(6) << ratio.str() << "x" << '\\n';
    }
    std::cout << '\\n';
}

int main() {
    report("random input", [](int n) {
        std::vector<int> out(n);
        for (int i = 0; i < n; ++i) out[i] = static_cast<int>(next_rand() % 1000);
        return out;
    });
    report("descending input — the worst case for pushing", [](int n) {
        std::vector<int> out(n);
        for (int i = 0; i < n; ++i) out[i] = n - i;
        return out;
    });

    std::cout << "the asymptotic claim is about the second table, not the first.\\n";
    std::cout << "on random data almost every pushed value stops within a step or two of\\n";
    std::cout << "where it landed, so both builds are linear and the gap is a constant.\\n";
    std::cout << "feed it descending values and every single push travels to the root:\\n";
    std::cout << "that is the O(n log n) the textbook means, and in-place stays O(n).\\n";
}`,
            },
            {
              lang: "rust",
              code: `struct Counter {
    swaps: i64,
}

fn sift_down(heap: &mut [i32], mut i: usize, n: usize, c: &mut Counter) {
    loop {
        let mut smallest = i;
        for child in [2 * i + 1, 2 * i + 2] {
            if child < n && heap[child] < heap[smallest] {
                smallest = child;
            }
        }
        if smallest == i {
            return;
        }
        heap.swap(i, smallest);
        c.swaps += 1;
        i = smallest;
    }
}

fn sift_up(heap: &mut [i32], mut i: usize, c: &mut Counter) {
    while i > 0 {
        let p = (i - 1) / 2;
        if heap[p] <= heap[i] {
            return;
        }
        heap.swap(p, i);
        c.swaps += 1;
        i = p;
    }
}

fn build_by_pushing(values: &[i32], c: &mut Counter) -> Vec<i32> {
    c.swaps = 0;
    let mut heap: Vec<i32> = Vec::new();
    for &v in values {
        heap.push(v);
        let last = heap.len() - 1;
        sift_up(&mut heap, last, c);
    }
    heap
}

/// Sift down from the last internal node backwards. The leaves are already heaps.
fn build_in_place(values: &[i32], c: &mut Counter) -> Vec<i32> {
    c.swaps = 0;
    let mut heap = values.to_vec();
    let n = heap.len();
    for i in (0..n / 2).rev() {
        sift_down(&mut heap, i, n, c);
    }
    heap
}

struct Lehmer {
    seed: i64,
}

impl Lehmer {
    fn next(&mut self) -> i64 {
        self.seed = (self.seed * 16807) % 2147483647;
        self.seed
    }
}

fn group(n: i64) -> String {
    let s = n.to_string();
    let mut out = String::new();
    for (i, ch) in s.chars().enumerate() {
        if i > 0 && (s.len() - i) % 3 == 0 {
            out.push(',');
        }
        out.push(ch);
    }
    out
}

fn report(name: &str, mut make: impl FnMut(usize) -> Vec<i32>) {
    println!("{}", name);
    println!("{:>8} {:>12} {:>10} {:>7}", "n", "by pushing", "in place", "ratio");
    println!("{}", "-".repeat(40));
    let mut c = Counter { swaps: 0 };
    for n in [8usize, 64, 1_000, 100_000] {
        let data = make(n);
        let a = build_by_pushing(&data, &mut c);
        let pushes = c.swaps;
        let b = build_in_place(&data, &mut c);
        let inplace = c.swaps;
        let smallest = *data.iter().min().unwrap();
        assert!(a[0] == smallest && b[0] == smallest, "not a heap");
        let ratio = format!("{:.2}", pushes as f64 / inplace.max(1) as f64);
        println!("{:>8} {:>12} {:>10} {:>6}x", n, group(pushes), group(inplace), ratio);
    }
    println!();
}

fn main() {
    let mut rng = Lehmer { seed: 7 };
    report("random input", |n| (0..n).map(|_| (rng.next() % 1000) as i32).collect());
    report("descending input — the worst case for pushing",
           |n| (0..n).map(|i| (n - i) as i32).collect());

    println!("the asymptotic claim is about the second table, not the first.");
    println!("on random data almost every pushed value stops within a step or two of");
    println!("where it landed, so both builds are linear and the gap is a constant.");
    println!("feed it descending values and every single push travels to the root:");
    println!("that is the O(n log n) the textbook means, and in-place stays O(n).");
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

var swaps int64

func siftDown(heap []int, i, n int) {
	for {
		smallest := i
		for _, c := range []int{2*i + 1, 2*i + 2} {
			if c < n && heap[c] < heap[smallest] {
				smallest = c
			}
		}
		if smallest == i {
			return
		}
		heap[i], heap[smallest] = heap[smallest], heap[i]
		swaps++
		i = smallest
	}
}

func siftUp(heap []int, i int) {
	for i > 0 {
		p := (i - 1) / 2
		if heap[p] <= heap[i] {
			return
		}
		heap[p], heap[i] = heap[i], heap[p]
		swaps++
		i = p
	}
}

func buildByPushing(values []int) []int {
	swaps = 0
	heap := make([]int, 0, len(values))
	for _, v := range values {
		heap = append(heap, v)
		siftUp(heap, len(heap)-1)
	}
	return heap
}

// buildInPlace sifts down from the last internal node backwards. The leaves are already heaps.
func buildInPlace(values []int) []int {
	swaps = 0
	heap := append([]int(nil), values...)
	for i := len(heap)/2 - 1; i >= 0; i-- {
		siftDown(heap, i, len(heap))
	}
	return heap
}

var seed int64 = 7

func nextRand() int64 {
	seed = (seed * 16807) % 2147483647
	return seed
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

func report(name string, make func(int) []int) {
	fmt.Println(name)
	fmt.Printf("%8s %12s %10s %7s\\n", "n", "by pushing", "in place", "ratio")
	fmt.Println(strings.Repeat("-", 40))
	for _, n := range []int{8, 64, 1000, 100000} {
		data := make(n)
		a := buildByPushing(data)
		pushes := swaps
		b := buildInPlace(data)
		inplace := swaps
		smallest := data[0]
		for _, v := range data {
			if v < smallest {
				smallest = v
			}
		}
		if a[0] != smallest || b[0] != smallest {
			panic("not a heap")
		}
		d := inplace
		if d < 1 {
			d = 1
		}
		fmt.Printf("%8d %12s %10s %6.2fx\\n", n, group(pushes), group(inplace), float64(pushes)/float64(d))
	}
	fmt.Println()
}

func main() {
	report("random input", func(n int) []int {
		out := make([]int, n)
		for i := range out {
			out[i] = int(nextRand() % 1000)
		}
		return out
	})
	report("descending input — the worst case for pushing", func(n int) []int {
		out := make([]int, n)
		for i := range out {
			out[i] = n - i
		}
		return out
	})

	fmt.Println("the asymptotic claim is about the second table, not the first.")
	fmt.Println("on random data almost every pushed value stops within a step or two of")
	fmt.Println("where it landed, so both builds are linear and the gap is a constant.")
	fmt.Println("feed it descending values and every single push travels to the root:")
	fmt.Println("that is the O(n log n) the textbook means, and in-place stays O(n).")
}`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Walk me through popping the minimum from a binary heap.",
      answer:
        "Save the root, move the last element into the root, shrink the array by one, then sift down: compare the value against both children, swap with the smaller if it is smaller than the value, and repeat until neither child is smaller or a leaf is reached. The last element is used because it is the only removal that keeps the tree complete — promoting a child would leave a gap in the last level and break the index arithmetic. Cost is O(log n), with two comparisons per level rather than the one that sift up needs.",
    },
    {
      question: "Building a heap from n elements is O(n). Where does the log go?",
      answer:
        "It goes into nodes that mostly cannot move. Sifting down from the last internal node backwards, the leaves — half the array — do no work at all, the level above moves at most one step, the one above that at most two. The total is the sum over levels of (nodes at that level) × (height above the leaves), which is ∑ n/2^(k+1) · k, and that converges to n rather than growing with log n. Doing it the other way, by pushing, inverts the profile: most elements start at the leaves and can climb the full height, which is where the O(n log n) comes from.",
    },
    {
      question: "Does sift down do anything different from sift up beyond direction?",
      answer:
        "It has to pick a child, and picking the wrong one silently breaks the heap. The swap must go to the *smaller* of the two children in a min-heap: swapping with the larger one can leave that larger value as the parent of a smaller sibling. It also costs twice as many comparisons per level, since each step compares against two children instead of one parent — same O(log n), noticeably different constant, which is why heapsort loses to quicksort in practice despite the better worst case.",
    },
  ],
  takeaways: [
    "Sift up and sift down are the same idea in two directions, and both touch exactly one root-to-leaf path.",
    "Both stop as soon as the local relation holds, because everything past that point was already correct.",
    "Pop promotes the last element, not a child: it is the only removal that keeps the tree complete.",
    "Sift down compares against two children, so pop costs about twice what push does at the same height.",
    "Building in place is O(n) because the work concentrates where there is nowhere to fall; pushing n times is O(n log n) in the worst case.",
  ],
  status: "available",
};
