import type { Lesson } from "@/content/types";

export const schedulingLesson: Lesson = {
  id: "dsa-heap-scheduling",
  slug: "scheduling-intervals-and-the-heap-sheet",
  moduleSlug: "heaps-and-priority-queues",
  title: "Scheduling, Intervals, and the Heap Sheet",
  summary:
    "Where the heap meets greedy. Sorting decides the order things are considered in; the heap answers, in one comparison, what is available right now — and the module closes on the two questions that pick the shape.",
  estimatedMinutes: 35,
  objectives: [
    "Solve interval-overlap problems with a sorted pass and a heap of end times",
    "Separate the greedy choice from the structure that makes it cheap",
    "Recognise Huffman's argument in problems that do not mention encoding",
    "Pick a heap shape from what the root must be and what may be in it at once",
  ],
  sections: [
    {
      id: "sort-then-heap",
      heading: "Sort for the order, heap for the availability",
      body: [
        "A large family of scheduling problems has the same two-part answer, and it is worth seeing the parts as doing different jobs.",
        "**The sort fixes the order of consideration.** Rooms free up as time moves forward, so meetings must be examined in start order or the question *is anything free* has no meaning yet. The sort is a precondition, not the algorithm.",
        "**The heap answers availability in one comparison.** It holds one entry per resource in use, keyed so that the root is the one that becomes available first. A new arrival only ever needs to ask about that one \u2014 if the soonest-free room is not free yet, none of them are.",
        "Meeting Rooms II is the canonical instance, and the answer is not a count you maintain but the *size of the heap*, which is the number of resources simultaneously in use. The same shape solves minimum platforms, CPU-with-k-cores, and most of the problems that ask how many of something you need at once.",
      ],
      examples: [
        {
          id: "meeting-rooms",
          title: "One end time per room in use",
          lang: "python",
          code: `import heapq

meetings = [(0, 30), (5, 10), (15, 20), (25, 45), (35, 40)]

# Sort by start: rooms can only be reused in time order.
meetings.sort()
rooms = []          # min-heap of the times each busy room frees up

print(f"{'meeting':>12}  {'action':<34} {'rooms in use'}")
print("-" * 62)
for start, end in meetings:
    if rooms and rooms[0] <= start:
        freed = heapq.heappop(rooms)
        action = f"room freed at {freed} — reuse it"
    else:
        action = "nothing free — open another"
    heapq.heappush(rooms, end)
    print(f"{f'[{start},{end})':>12}  {action:<34} {len(rooms)}")

print()
print(f"rooms needed: {len(rooms)}")
print()
print("the heap holds one end time per room in use, and its root is the room")
print("that frees up soonest — the only room a new meeting could possibly take.")
print("that is the same shape as top-k: the root is the candidate for eviction.")`,
          output: `     meeting  action                             rooms in use
--------------------------------------------------------------
      [0,30)  nothing free — open another        1
      [5,10)  nothing free — open another        2
     [15,20)  room freed at 10 — reuse it        2
     [25,45)  room freed at 20 — reuse it        2
     [35,40)  room freed at 30 — reuse it        2

rooms needed: 2

the heap holds one end time per room in use, and its root is the room
that frees up soonest — the only room a new meeting could possibly take.
that is the same shape as top-k: the root is the candidate for eviction.`,
          explanation:
            "Sorting by start time is not the algorithm, it is the precondition: rooms free up in time order, so meetings have to be considered in that order for the question *is anything free yet* to be answerable at all. The heap then holds one end time per occupied room, and its root is the room that frees soonest \u2014 the only room a new meeting could possibly take, which is why one comparison settles it. The answer is the heap's size, and the shape is the same one as top-k: the root is whatever is next to be evicted.",
          alternates: [
            {
              lang: "javascript",
              code: `const meetings = [[0, 30], [5, 10], [15, 20], [25, 45], [35, 40]];

// Sort by start: rooms can only be reused in time order.
meetings.sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]));

// A min-heap of the times each busy room frees up.
const rooms = [];
function push(v) {
  rooms.push(v);
  let i = rooms.length - 1;
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (rooms[p] <= rooms[i]) break;
    [rooms[p], rooms[i]] = [rooms[i], rooms[p]];
    i = p;
  }
}
function pop() {
  const top = rooms[0];
  const last = rooms.pop();
  if (rooms.length > 0) {
    rooms[0] = last;
    let i = 0;
    for (;;) {
      let m = i;
      for (const c of [2 * i + 1, 2 * i + 2]) {
        if (c < rooms.length && rooms[c] < rooms[m]) m = c;
      }
      if (m === i) break;
      [rooms[i], rooms[m]] = [rooms[m], rooms[i]];
      i = m;
    }
  }
  return top;
}

const padStart = (s, w) => String(s).padStart(w);
const padEnd = (s, w) => String(s).padEnd(w);

console.log(\`\${padStart("meeting", 12)}  \${padEnd("action", 34)} rooms in use\`);
console.log("-".repeat(62));
for (const [start, end] of meetings) {
  let action;
  if (rooms.length > 0 && rooms[0] <= start) {
    const freed = pop();
    action = \`room freed at \${freed} — reuse it\`;
  } else {
    action = "nothing free — open another";
  }
  push(end);
  console.log(\`\${padStart(\`[\${start},\${end})\`, 12)}  \${padEnd(action, 34)} \${rooms.length}\`);
}

console.log();
console.log(\`rooms needed: \${rooms.length}\`);
console.log();
console.log("the heap holds one end time per room in use, and its root is the room");
console.log("that frees up soonest — the only room a new meeting could possibly take.");
console.log("that is the same shape as top-k: the root is the candidate for eviction.");`,
            },
            {
              lang: "typescript",
              code: `const meetings: [number, number][] = [[0, 30], [5, 10], [15, 20], [25, 45], [35, 40]];

// Sort by start: rooms can only be reused in time order.
meetings.sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]));

// A min-heap of the times each busy room frees up.
const rooms: number[] = [];
function push(v: number): void {
  rooms.push(v);
  let i = rooms.length - 1;
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (rooms[p] <= rooms[i]) break;
    [rooms[p], rooms[i]] = [rooms[i], rooms[p]];
    i = p;
  }
}
function pop(): number {
  const top = rooms[0];
  const last = rooms.pop() as number;
  if (rooms.length > 0) {
    rooms[0] = last;
    let i = 0;
    for (;;) {
      let m = i;
      for (const c of [2 * i + 1, 2 * i + 2]) {
        if (c < rooms.length && rooms[c] < rooms[m]) m = c;
      }
      if (m === i) break;
      [rooms[i], rooms[m]] = [rooms[m], rooms[i]];
      i = m;
    }
  }
  return top;
}

const padStart = (s: string | number, w: number): string => String(s).padStart(w);
const padEnd = (s: string | number, w: number): string => String(s).padEnd(w);

console.log(\`\${padStart("meeting", 12)}  \${padEnd("action", 34)} rooms in use\`);
console.log("-".repeat(62));
for (const [start, end] of meetings) {
  let action: string;
  if (rooms.length > 0 && rooms[0] <= start) {
    const freed = pop();
    action = \`room freed at \${freed} — reuse it\`;
  } else {
    action = "nothing free — open another";
  }
  push(end);
  console.log(\`\${padStart(\`[\${start},\${end})\`, 12)}  \${padEnd(action, 34)} \${rooms.length}\`);
}

console.log();
console.log(\`rooms needed: \${rooms.length}\`);
console.log();
console.log("the heap holds one end time per room in use, and its root is the room");
console.log("that frees up soonest — the only room a new meeting could possibly take.");
console.log("that is the same shape as top-k: the root is the candidate for eviction.");`,
            },
            {
              lang: "java",
              code: `import java.util.Arrays;
import java.util.PriorityQueue;

public class Main {
    public static void main(String[] args) {
        int[][] meetings = {{0, 30}, {5, 10}, {15, 20}, {25, 45}, {35, 40}};

        // Sort by start: rooms can only be reused in time order.
        Arrays.sort(meetings, (a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]);

        PriorityQueue<Integer> rooms = new PriorityQueue<>();  // when each busy room frees up

        System.out.printf("%12s  %-34s rooms in use%n", "meeting", "action");
        System.out.println("-".repeat(62));
        for (int[] m : meetings) {
            String action;
            if (!rooms.isEmpty() && rooms.peek() <= m[0]) {
                int freed = rooms.poll();
                action = "room freed at " + freed + " — reuse it";
            } else {
                action = "nothing free — open another";
            }
            rooms.add(m[1]);
            System.out.printf("%12s  %-34s %d%n", "[" + m[0] + "," + m[1] + ")", action, rooms.size());
        }

        System.out.println();
        System.out.println("rooms needed: " + rooms.size());
        System.out.println();
        System.out.println("the heap holds one end time per room in use, and its root is the room");
        System.out.println("that frees up soonest — the only room a new meeting could possibly take.");
        System.out.println("that is the same shape as top-k: the root is the candidate for eviction.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <array>
#include <functional>
#include <iomanip>
#include <iostream>
#include <queue>
#include <string>
#include <vector>

/* \`std::setw\` counts bytes, and the em-dash in these action strings is three
   of them, so the column would come out two characters short of Python's
   \`{:<34}\`. Count characters instead. */
static size_t char_len(const std::string& s) {
    size_t n = 0;
    for (unsigned char c : s) {
        if ((c & 0xC0) != 0x80) ++n;
    }
    return n;
}

static std::string pad_right(const std::string& s, size_t w) {
    size_t n = char_len(s);
    return n >= w ? s : s + std::string(w - n, ' ');
}

int main() {
    std::vector<std::array<int, 2>> meetings = {{0, 30}, {5, 10}, {15, 20}, {25, 45}, {35, 40}};

    // Sort by start: rooms can only be reused in time order.
    std::sort(meetings.begin(), meetings.end());

    // A min-heap of the times each busy room frees up.
    std::priority_queue<int, std::vector<int>, std::greater<int>> rooms;

    std::cout << std::right << std::setw(12) << "meeting" << "  "
              << pad_right("action", 34) << " rooms in use\\n";
    std::cout << std::string(62, '-') << '\\n';
    for (const auto& m : meetings) {
        std::string action;
        if (!rooms.empty() && rooms.top() <= m[0]) {
            int freed = rooms.top();
            rooms.pop();
            action = "room freed at " + std::to_string(freed) + " — reuse it";
        } else {
            action = "nothing free — open another";
        }
        rooms.push(m[1]);
        std::string label = "[" + std::to_string(m[0]) + "," + std::to_string(m[1]) + ")";
        std::cout << std::right << std::setw(12) << label << "  "
                  << pad_right(action, 34) << ' ' << rooms.size() << '\\n';
    }

    std::cout << "\\nrooms needed: " << rooms.size() << "\\n\\n";
    std::cout << "the heap holds one end time per room in use, and its root is the room\\n";
    std::cout << "that frees up soonest — the only room a new meeting could possibly take.\\n";
    std::cout << "that is the same shape as top-k: the root is the candidate for eviction.\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::cmp::Reverse;
use std::collections::BinaryHeap;

fn main() {
    let mut meetings = [[0, 30], [5, 10], [15, 20], [25, 45], [35, 40]];

    // Sort by start: rooms can only be reused in time order.
    meetings.sort_unstable();

    // A min-heap of the times each busy room frees up.
    let mut rooms: BinaryHeap<Reverse<i32>> = BinaryHeap::new();

    println!("{:>12}  {:<34} rooms in use", "meeting", "action");
    println!("{}", "-".repeat(62));
    for m in meetings {
        let action = if rooms.peek().is_some_and(|r| r.0 <= m[0]) {
            let Reverse(freed) = rooms.pop().unwrap();
            format!("room freed at {} — reuse it", freed)
        } else {
            "nothing free — open another".to_string()
        };
        rooms.push(Reverse(m[1]));
        println!("{:>12}  {:<34} {}", format!("[{},{})", m[0], m[1]), action, rooms.len());
    }

    println!();
    println!("rooms needed: {}", rooms.len());
    println!();
    println!("the heap holds one end time per room in use, and its root is the room");
    println!("that frees up soonest — the only room a new meeting could possibly take.");
    println!("that is the same shape as top-k: the root is the candidate for eviction.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"container/heap"
	"fmt"
	"sort"
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

func main() {
	meetings := [][2]int{{0, 30}, {5, 10}, {15, 20}, {25, 45}, {35, 40}}

	// Sort by start: rooms can only be reused in time order.
	sort.Slice(meetings, func(i, j int) bool {
		if meetings[i][0] != meetings[j][0] {
			return meetings[i][0] < meetings[j][0]
		}
		return meetings[i][1] < meetings[j][1]
	})

	// A min-heap of the times each busy room frees up.
	rooms := &minHeap{}
	heap.Init(rooms)

	fmt.Printf("%12s  %-34s rooms in use\\n", "meeting", "action")
	fmt.Println(strings.Repeat("-", 62))
	for _, m := range meetings {
		var action string
		if rooms.Len() > 0 && (*rooms)[0] <= m[0] {
			freed := heap.Pop(rooms).(int)
			action = fmt.Sprintf("room freed at %d — reuse it", freed)
		} else {
			action = "nothing free — open another"
		}
		heap.Push(rooms, m[1])
		fmt.Printf("%12s  %-34s %d\\n", fmt.Sprintf("[%d,%d)", m[0], m[1]), action, rooms.Len())
	}

	fmt.Println()
	fmt.Printf("rooms needed: %d\\n", rooms.Len())
	fmt.Println()
	fmt.Println("the heap holds one end time per room in use, and its root is the room")
	fmt.Println("that frees up soonest — the only room a new meeting could possibly take.")
	fmt.Println("that is the same shape as top-k: the root is the candidate for eviction.")
}`,
            },
          ],
        },
      ],
      visual: {
        id: "scheduling-visual",
        kind: "heap",
        title: "The soonest-free resource on top",
      },
    },
    {
      id: "greedy-and-the-heap",
      heading: "The heap is not the insight",
      body: [
        "It is worth being careful about which part of these solutions is the clever bit, because interviewers ask about the other part.",
        "In *connect sticks*, the insight is that joining two sticks makes a stick that gets joined again, so an early join is paid for in every later one \u2014 and therefore the cheapest strategy joins the two shortest available. That is a greedy choice, and it needs an exchange argument to be believed.",
        "The heap contributes nothing to that argument. Its entire job is to make *the two shortest* cost O(log n) instead of O(n), and the same solution written with a sorted list and a linear scan would be equally correct and slower.",
        "This is Huffman coding, incidentally \u2014 the same algorithm, where the sticks are symbol frequencies and the total cost is the encoded length. Recognising the shape is worth more than recognising the name: whenever combining two items produces an item that will be combined again, and the cost is the sum, the answer is a min-heap and repeatedly taking two.",
      ],
      examples: [
        {
          id: "connect-sticks",
          title: "Why the two smallest, every time",
          lang: "python",
          code: `import heapq

sticks = [8, 4, 6, 12]

# Joining two sticks costs their combined length, and that combined stick
# is joined again later — so early joins are paid for repeatedly.
heap = list(sticks)
heapq.heapify(heap)
total = 0
print("sticks:", sticks)
while len(heap) > 1:
    a = heapq.heappop(heap)
    b = heapq.heappop(heap)
    total += a + b
    heapq.heappush(heap, a + b)
    print(f"  join {a} + {b} = {a + b}   running cost {total}")
print(f"cheapest total: {total}")

print()
worst = 0
h2 = [-x for x in sticks]
heapq.heapify(h2)
while len(h2) > 1:
    a = -heapq.heappop(h2)
    b = -heapq.heappop(h2)
    worst += a + b
    heapq.heappush(h2, -(a + b))
print(f"joining the two largest each time instead: {worst}")
print()
print("same sticks, same number of joins, different total — because a stick")
print("joined early is carried inside every later join. Taking the two")
print("smallest keeps the repeatedly-counted lengths as small as possible,")
print("and the heap is what makes 'the two smallest' cost O(log n) each time.")`,
          output: `sticks: [8, 4, 6, 12]
  join 4 + 6 = 10   running cost 10
  join 8 + 10 = 18   running cost 28
  join 12 + 18 = 30   running cost 58
cheapest total: 58

joining the two largest each time instead: 76

same sticks, same number of joins, different total — because a stick
joined early is carried inside every later join. Taking the two
smallest keeps the repeatedly-counted lengths as small as possible,
and the heap is what makes 'the two smallest' cost O(log n) each time.`,
          explanation:
            "This is Huffman coding wearing different clothes, and the argument is the same. A stick joined early is contained in every later join, so its length is counted once per remaining round \u2014 which makes early joins expensive in proportion to how much longer the process runs. Joining the two smallest keeps the repeatedly-counted lengths as small as possible, and the 58-against-76 gap on four sticks is that effect at the smallest scale worth printing. The heap is not the insight; the greedy choice is. The heap is what makes *the two smallest* cost O(log n) rather than O(n).",
          alternates: [
            {
              lang: "javascript",
              code: `const sticks = [8, 4, 6, 12];

// A heap over a comparator, so the same code can run both directions.
function makeHeap(values, less) {
  const a = [...values];
  const sift = (i) => {
    for (;;) {
      let m = i;
      for (const c of [2 * i + 1, 2 * i + 2]) {
        if (c < a.length && less(a[c], a[m])) m = c;
      }
      if (m === i) return;
      [a[i], a[m]] = [a[m], a[i]];
      i = m;
    }
  };
  for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) sift(i);
  return {
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
        sift(0);
      }
      return top;
    },
    get size() { return a.length; },
  };
}

// Joining two sticks costs their combined length, and that combined stick
// is joined again later — so early joins are paid for repeatedly.
const heap = makeHeap(sticks, (x, y) => x < y);
let total = 0;
console.log("sticks: [" + sticks.join(", ") + "]");
while (heap.size > 1) {
  const a = heap.pop();
  const b = heap.pop();
  total += a + b;
  heap.push(a + b);
  console.log(\`  join \${a} + \${b} = \${a + b}   running cost \${total}\`);
}
console.log(\`cheapest total: \${total}\`);

console.log();
let worst = 0;
const h2 = makeHeap(sticks, (x, y) => x > y);
while (h2.size > 1) {
  const a = h2.pop();
  const b = h2.pop();
  worst += a + b;
  h2.push(a + b);
}
console.log(\`joining the two largest each time instead: \${worst}\`);
console.log();
console.log("same sticks, same number of joins, different total — because a stick");
console.log("joined early is carried inside every later join. Taking the two");
console.log("smallest keeps the repeatedly-counted lengths as small as possible,");
console.log("and the heap is what makes 'the two smallest' cost O(log n) each time.");`,
            },
            {
              lang: "typescript",
              code: `const sticks: number[] = [8, 4, 6, 12];

// A heap over a comparator, so the same code can run both directions.
type Less = (x: number, y: number) => boolean;

function makeHeap(values: number[], less: Less) {
  const a = [...values];
  const sift = (i: number): void => {
    for (;;) {
      let m = i;
      for (const c of [2 * i + 1, 2 * i + 2]) {
        if (c < a.length && less(a[c], a[m])) m = c;
      }
      if (m === i) return;
      [a[i], a[m]] = [a[m], a[i]];
      i = m;
    }
  };
  for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) sift(i);
  return {
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
        sift(0);
      }
      return top;
    },
    get size(): number { return a.length; },
  };
}

// Joining two sticks costs their combined length, and that combined stick
// is joined again later — so early joins are paid for repeatedly.
const heap = makeHeap(sticks, (x, y) => x < y);
let total = 0;
console.log("sticks: [" + sticks.join(", ") + "]");
while (heap.size > 1) {
  const a = heap.pop();
  const b = heap.pop();
  total += a + b;
  heap.push(a + b);
  console.log(\`  join \${a} + \${b} = \${a + b}   running cost \${total}\`);
}
console.log(\`cheapest total: \${total}\`);

console.log();
let worst = 0;
const h2 = makeHeap(sticks, (x, y) => x > y);
while (h2.size > 1) {
  const a = h2.pop();
  const b = h2.pop();
  worst += a + b;
  h2.push(a + b);
}
console.log(\`joining the two largest each time instead: \${worst}\`);
console.log();
console.log("same sticks, same number of joins, different total — because a stick");
console.log("joined early is carried inside every later join. Taking the two");
console.log("smallest keeps the repeatedly-counted lengths as small as possible,");
console.log("and the heap is what makes 'the two smallest' cost O(log n) each time.");`,
            },
            {
              lang: "java",
              code: `import java.util.Collections;
import java.util.PriorityQueue;

public class Main {
    public static void main(String[] args) {
        int[] sticks = {8, 4, 6, 12};

        /* Joining two sticks costs their combined length, and that combined stick
           is joined again later — so early joins are paid for repeatedly. */
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int s : sticks) heap.add(s);
        int total = 0;
        StringBuilder shown = new StringBuilder("[");
        for (int i = 0; i < sticks.length; i++) shown.append(i > 0 ? ", " : "").append(sticks[i]);
        System.out.println("sticks: " + shown + "]");
        while (heap.size() > 1) {
            int a = heap.poll();
            int b = heap.poll();
            total += a + b;
            heap.add(a + b);
            System.out.printf("  join %d + %d = %d   running cost %d%n", a, b, a + b, total);
        }
        System.out.printf("cheapest total: %d%n", total);

        System.out.println();
        int worst = 0;
        PriorityQueue<Integer> h2 = new PriorityQueue<>(Collections.reverseOrder());
        for (int s : sticks) h2.add(s);
        while (h2.size() > 1) {
            int a = h2.poll();
            int b = h2.poll();
            worst += a + b;
            h2.add(a + b);
        }
        System.out.printf("joining the two largest each time instead: %d%n", worst);
        System.out.println();
        System.out.println("same sticks, same number of joins, different total — because a stick");
        System.out.println("joined early is carried inside every later join. Taking the two");
        System.out.println("smallest keeps the repeatedly-counted lengths as small as possible,");
        System.out.println("and the heap is what makes 'the two smallest' cost O(log n) each time.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <functional>
#include <iostream>
#include <queue>
#include <string>
#include <vector>

int main() {
    const std::vector<int> sticks = {8, 4, 6, 12};

    /* Joining two sticks costs their combined length, and that combined stick
       is joined again later — so early joins are paid for repeatedly. */
    std::priority_queue<int, std::vector<int>, std::greater<int>> heap(sticks.begin(), sticks.end());
    long long total = 0;
    std::string shown = "[";
    for (size_t i = 0; i < sticks.size(); ++i) {
        if (i) shown += ", ";
        shown += std::to_string(sticks[i]);
    }
    std::cout << "sticks: " << shown << "]\\n";
    while (heap.size() > 1) {
        int a = heap.top();
        heap.pop();
        int b = heap.top();
        heap.pop();
        total += a + b;
        heap.push(a + b);
        std::cout << "  join " << a << " + " << b << " = " << a + b
                  << "   running cost " << total << '\\n';
    }
    std::cout << "cheapest total: " << total << "\\n\\n";

    long long worst = 0;
    std::priority_queue<int> h2(sticks.begin(), sticks.end());
    while (h2.size() > 1) {
        int a = h2.top();
        h2.pop();
        int b = h2.top();
        h2.pop();
        worst += a + b;
        h2.push(a + b);
    }
    std::cout << "joining the two largest each time instead: " << worst << "\\n\\n";
    std::cout << "same sticks, same number of joins, different total — because a stick\\n";
    std::cout << "joined early is carried inside every later join. Taking the two\\n";
    std::cout << "smallest keeps the repeatedly-counted lengths as small as possible,\\n";
    std::cout << "and the heap is what makes 'the two smallest' cost O(log n) each time.\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::cmp::Reverse;
use std::collections::BinaryHeap;

fn main() {
    let sticks = [8, 4, 6, 12];

    // Joining two sticks costs their combined length, and that combined stick
    // is joined again later — so early joins are paid for repeatedly.
    let mut heap: BinaryHeap<Reverse<i64>> = sticks.iter().map(|&s| Reverse(s as i64)).collect();
    let mut total: i64 = 0;
    let parts: Vec<String> = sticks.iter().map(|s| s.to_string()).collect();
    println!("sticks: [{}]", parts.join(", "));
    while heap.len() > 1 {
        let Reverse(a) = heap.pop().unwrap();
        let Reverse(b) = heap.pop().unwrap();
        total += a + b;
        heap.push(Reverse(a + b));
        println!("  join {} + {} = {}   running cost {}", a, b, a + b, total);
    }
    println!("cheapest total: {}", total);

    println!();
    let mut worst: i64 = 0;
    let mut h2: BinaryHeap<i64> = sticks.iter().map(|&s| s as i64).collect();
    while h2.len() > 1 {
        let a = h2.pop().unwrap();
        let b = h2.pop().unwrap();
        worst += a + b;
        h2.push(a + b);
    }
    println!("joining the two largest each time instead: {}", worst);
    println!();
    println!("same sticks, same number of joins, different total — because a stick");
    println!("joined early is carried inside every later join. Taking the two");
    println!("smallest keeps the repeatedly-counted lengths as small as possible,");
    println!("and the heap is what makes 'the two smallest' cost O(log n) each time.");
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

func main() {
	sticks := []int{8, 4, 6, 12}

	// Joining two sticks costs their combined length, and that combined stick
	// is joined again later — so early joins are paid for repeatedly.
	h := &ints{a: append([]int(nil), sticks...), less: func(x, y int) bool { return x < y }}
	heap.Init(h)
	total := 0
	parts := make([]string, len(sticks))
	for i, s := range sticks {
		parts[i] = strconv.Itoa(s)
	}
	fmt.Println("sticks: [" + strings.Join(parts, ", ") + "]")
	for h.Len() > 1 {
		a := heap.Pop(h).(int)
		b := heap.Pop(h).(int)
		total += a + b
		heap.Push(h, a+b)
		fmt.Printf("  join %d + %d = %d   running cost %d\\n", a, b, a+b, total)
	}
	fmt.Printf("cheapest total: %d\\n", total)

	fmt.Println()
	worst := 0
	h2 := &ints{a: append([]int(nil), sticks...), less: func(x, y int) bool { return x > y }}
	heap.Init(h2)
	for h2.Len() > 1 {
		a := heap.Pop(h2).(int)
		b := heap.Pop(h2).(int)
		worst += a + b
		heap.Push(h2, a+b)
	}
	fmt.Printf("joining the two largest each time instead: %d\\n", worst)
	fmt.Println()
	fmt.Println("same sticks, same number of joins, different total — because a stick")
	fmt.Println("joined early is carried inside every later join. Taking the two")
	fmt.Println("smallest keeps the repeatedly-counted lengths as small as possible,")
	fmt.Println("and the heap is what makes 'the two smallest' cost O(log n) each time.")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "the-sheet",
      heading: "Closing the module",
      body: [
        "Every problem in this module resolved into the same two decisions, and they are the two worth carrying out of it.",
        "**What does the root need to be?** The root is the only element a heap makes cheap, so the question is which single element the algorithm repeatedly asks about. For the k largest it is the smallest thing kept, for meeting rooms the earliest end time, for connect-sticks the shortest stick. Answer this and the min-or-max question answers itself.",
        "**What is allowed in the heap at once?** This fixes both the memory and the log in the bound. k for top-k, one cursor per list for a merge, one entry per busy resource for scheduling, half the data for a running median.",
        "And one check that comes before both: if the thing being ranked is a bounded non-negative integer, the answer is probably an array of buckets and there is no heap in it at all.",
      ],
      examples: [
        {
          id: "the-sheet",
          title: "The shapes, and the two questions that pick between them",
          lang: "python",
          code: `rows = [
    ("kth largest / smallest", "heap of size k, ordered backwards", "O(n log k)"),
    ("top k frequent", "count, then buckets by count", "O(n)"),
    ("running median", "two heaps facing each other", "O(log n) per add"),
    ("merge k sorted lists", "heap of one cursor per list", "O(n log k)"),
    ("meeting rooms II", "min-heap of end times", "O(n log n)"),
    ("connect sticks / Huffman", "min-heap, join the two smallest", "O(n log n)"),
    ("task scheduler by deadline", "max-heap of value, drop when late", "O(n log n)"),
    ("sliding window median", "two heaps plus lazy deletion", "O(n log n)"),
    ("kth smallest in a sorted matrix", "heap of row cursors, or binary search", "O(k log n)"),
    ("smallest range across k lists", "k-way merge, track the max", "O(n log k)"),
]

print(f"{'problem':<32} {'shape':<38} {'cost'}")
print("-" * 88)
for problem, shape, cost in rows:
    print(f"{problem:<32} {shape:<38} {cost}")

print()
print("two questions decide almost all of these:")
print("  1. what does the root need to be? — that fixes min-heap or max-heap")
print("  2. what is allowed in the heap at once? — that fixes the size, and the bound")
print()
print("and one check before any of it: if the ranking key is a small integer,")
print("the answer is probably an array, and there is no heap in it at all.")`,
          output: `problem                          shape                                  cost
----------------------------------------------------------------------------------------
kth largest / smallest           heap of size k, ordered backwards      O(n log k)
top k frequent                   count, then buckets by count           O(n)
running median                   two heaps facing each other            O(log n) per add
merge k sorted lists             heap of one cursor per list            O(n log k)
meeting rooms II                 min-heap of end times                  O(n log n)
connect sticks / Huffman         min-heap, join the two smallest        O(n log n)
task scheduler by deadline       max-heap of value, drop when late      O(n log n)
sliding window median            two heaps plus lazy deletion           O(n log n)
kth smallest in a sorted matrix  heap of row cursors, or binary search  O(k log n)
smallest range across k lists    k-way merge, track the max             O(n log k)

two questions decide almost all of these:
  1. what does the root need to be? — that fixes min-heap or max-heap
  2. what is allowed in the heap at once? — that fixes the size, and the bound

and one check before any of it: if the ranking key is a small integer,
the answer is probably an array, and there is no heap in it at all.`,
          explanation:
            "The table is worth reading as a set of answers to the two questions under it rather than as ten things to memorise. *What does the root need to be* settles the direction \u2014 for the k largest it is the smallest kept, for meeting rooms it is the earliest end, for connect-sticks it is the shortest stick. *What is allowed in the heap at once* settles the bound \u2014 k for top-k, one per list for a merge, one per busy room for scheduling. Nearly every heap problem is those two decisions and then twenty lines of standard library.",
          alternates: [
            {
              lang: "javascript",
              code: `const rows = [
  ["kth largest / smallest", "heap of size k, ordered backwards", "O(n log k)"],
  ["top k frequent", "count, then buckets by count", "O(n)"],
  ["running median", "two heaps facing each other", "O(log n) per add"],
  ["merge k sorted lists", "heap of one cursor per list", "O(n log k)"],
  ["meeting rooms II", "min-heap of end times", "O(n log n)"],
  ["connect sticks / Huffman", "min-heap, join the two smallest", "O(n log n)"],
  ["task scheduler by deadline", "max-heap of value, drop when late", "O(n log n)"],
  ["sliding window median", "two heaps plus lazy deletion", "O(n log n)"],
  ["kth smallest in a sorted matrix", "heap of row cursors, or binary search", "O(k log n)"],
  ["smallest range across k lists", "k-way merge, track the max", "O(n log k)"],
];

const padEnd = (s, w) => String(s).padEnd(w);
console.log(\`\${padEnd("problem", 32)} \${padEnd("shape", 38)} cost\`);
console.log("-".repeat(88));
for (const [problem, shape, cost] of rows) {
  console.log(\`\${padEnd(problem, 32)} \${padEnd(shape, 38)} \${cost}\`);
}

console.log();
console.log("two questions decide almost all of these:");
console.log("  1. what does the root need to be? — that fixes min-heap or max-heap");
console.log("  2. what is allowed in the heap at once? — that fixes the size, and the bound");
console.log();
console.log("and one check before any of it: if the ranking key is a small integer,");
console.log("the answer is probably an array, and there is no heap in it at all.");`,
            },
            {
              lang: "typescript",
              code: `const rows: [string, string, string][] = [
  ["kth largest / smallest", "heap of size k, ordered backwards", "O(n log k)"],
  ["top k frequent", "count, then buckets by count", "O(n)"],
  ["running median", "two heaps facing each other", "O(log n) per add"],
  ["merge k sorted lists", "heap of one cursor per list", "O(n log k)"],
  ["meeting rooms II", "min-heap of end times", "O(n log n)"],
  ["connect sticks / Huffman", "min-heap, join the two smallest", "O(n log n)"],
  ["task scheduler by deadline", "max-heap of value, drop when late", "O(n log n)"],
  ["sliding window median", "two heaps plus lazy deletion", "O(n log n)"],
  ["kth smallest in a sorted matrix", "heap of row cursors, or binary search", "O(k log n)"],
  ["smallest range across k lists", "k-way merge, track the max", "O(n log k)"],
];

const padEnd = (s: string, w: number): string => String(s).padEnd(w);
console.log(\`\${padEnd("problem", 32)} \${padEnd("shape", 38)} cost\`);
console.log("-".repeat(88));
for (const [problem, shape, cost] of rows) {
  console.log(\`\${padEnd(problem, 32)} \${padEnd(shape, 38)} \${cost}\`);
}

console.log();
console.log("two questions decide almost all of these:");
console.log("  1. what does the root need to be? — that fixes min-heap or max-heap");
console.log("  2. what is allowed in the heap at once? — that fixes the size, and the bound");
console.log();
console.log("and one check before any of it: if the ranking key is a small integer,");
console.log("the answer is probably an array, and there is no heap in it at all.");`,
            },
            {
              lang: "java",
              code: `public class Main {
    public static void main(String[] args) {
        String[][] rows = {
            {"kth largest / smallest", "heap of size k, ordered backwards", "O(n log k)"},
            {"top k frequent", "count, then buckets by count", "O(n)"},
            {"running median", "two heaps facing each other", "O(log n) per add"},
            {"merge k sorted lists", "heap of one cursor per list", "O(n log k)"},
            {"meeting rooms II", "min-heap of end times", "O(n log n)"},
            {"connect sticks / Huffman", "min-heap, join the two smallest", "O(n log n)"},
            {"task scheduler by deadline", "max-heap of value, drop when late", "O(n log n)"},
            {"sliding window median", "two heaps plus lazy deletion", "O(n log n)"},
            {"kth smallest in a sorted matrix", "heap of row cursors, or binary search", "O(k log n)"},
            {"smallest range across k lists", "k-way merge, track the max", "O(n log k)"},
        };

        System.out.printf("%-32s %-38s %s%n", "problem", "shape", "cost");
        System.out.println("-".repeat(88));
        for (String[] r : rows) System.out.printf("%-32s %-38s %s%n", r[0], r[1], r[2]);

        System.out.println();
        System.out.println("two questions decide almost all of these:");
        System.out.println("  1. what does the root need to be? — that fixes min-heap or max-heap");
        System.out.println("  2. what is allowed in the heap at once? — that fixes the size, and the bound");
        System.out.println();
        System.out.println("and one check before any of it: if the ranking key is a small integer,");
        System.out.println("the answer is probably an array, and there is no heap in it at all.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <array>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

int main() {
    const std::vector<std::array<std::string, 3>> rows = {
        {"kth largest / smallest", "heap of size k, ordered backwards", "O(n log k)"},
        {"top k frequent", "count, then buckets by count", "O(n)"},
        {"running median", "two heaps facing each other", "O(log n) per add"},
        {"merge k sorted lists", "heap of one cursor per list", "O(n log k)"},
        {"meeting rooms II", "min-heap of end times", "O(n log n)"},
        {"connect sticks / Huffman", "min-heap, join the two smallest", "O(n log n)"},
        {"task scheduler by deadline", "max-heap of value, drop when late", "O(n log n)"},
        {"sliding window median", "two heaps plus lazy deletion", "O(n log n)"},
        {"kth smallest in a sorted matrix", "heap of row cursors, or binary search", "O(k log n)"},
        {"smallest range across k lists", "k-way merge, track the max", "O(n log k)"},
    };

    std::cout << std::left << std::setw(32) << "problem" << ' ' << std::setw(38) << "shape" << " cost\\n";
    std::cout << std::string(88, '-') << '\\n';
    for (const auto& r : rows) {
        std::cout << std::left << std::setw(32) << r[0] << ' ' << std::setw(38) << r[1] << ' ' << r[2] << '\\n';
    }

    std::cout << "\\ntwo questions decide almost all of these:\\n";
    std::cout << "  1. what does the root need to be? — that fixes min-heap or max-heap\\n";
    std::cout << "  2. what is allowed in the heap at once? — that fixes the size, and the bound\\n\\n";
    std::cout << "and one check before any of it: if the ranking key is a small integer,\\n";
    std::cout << "the answer is probably an array, and there is no heap in it at all.\\n";
}`,
            },
            {
              lang: "rust",
              code: `fn main() {
    let rows: [[&str; 3]; 10] = [
        ["kth largest / smallest", "heap of size k, ordered backwards", "O(n log k)"],
        ["top k frequent", "count, then buckets by count", "O(n)"],
        ["running median", "two heaps facing each other", "O(log n) per add"],
        ["merge k sorted lists", "heap of one cursor per list", "O(n log k)"],
        ["meeting rooms II", "min-heap of end times", "O(n log n)"],
        ["connect sticks / Huffman", "min-heap, join the two smallest", "O(n log n)"],
        ["task scheduler by deadline", "max-heap of value, drop when late", "O(n log n)"],
        ["sliding window median", "two heaps plus lazy deletion", "O(n log n)"],
        ["kth smallest in a sorted matrix", "heap of row cursors, or binary search", "O(k log n)"],
        ["smallest range across k lists", "k-way merge, track the max", "O(n log k)"],
    ];

    println!("{:<32} {:<38} cost", "problem", "shape");
    println!("{}", "-".repeat(88));
    for r in rows {
        println!("{:<32} {:<38} {}", r[0], r[1], r[2]);
    }

    println!();
    println!("two questions decide almost all of these:");
    println!("  1. what does the root need to be? — that fixes min-heap or max-heap");
    println!("  2. what is allowed in the heap at once? — that fixes the size, and the bound");
    println!();
    println!("and one check before any of it: if the ranking key is a small integer,");
    println!("the answer is probably an array, and there is no heap in it at all.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"strings"
)

func main() {
	rows := [][3]string{
		{"kth largest / smallest", "heap of size k, ordered backwards", "O(n log k)"},
		{"top k frequent", "count, then buckets by count", "O(n)"},
		{"running median", "two heaps facing each other", "O(log n) per add"},
		{"merge k sorted lists", "heap of one cursor per list", "O(n log k)"},
		{"meeting rooms II", "min-heap of end times", "O(n log n)"},
		{"connect sticks / Huffman", "min-heap, join the two smallest", "O(n log n)"},
		{"task scheduler by deadline", "max-heap of value, drop when late", "O(n log n)"},
		{"sliding window median", "two heaps plus lazy deletion", "O(n log n)"},
		{"kth smallest in a sorted matrix", "heap of row cursors, or binary search", "O(k log n)"},
		{"smallest range across k lists", "k-way merge, track the max", "O(n log k)"},
	}

	fmt.Printf("%-32s %-38s %s\\n", "problem", "shape", "cost")
	fmt.Println(strings.Repeat("-", 88))
	for _, r := range rows {
		fmt.Printf("%-32s %-38s %s\\n", r[0], r[1], r[2])
	}

	fmt.Println()
	fmt.Println("two questions decide almost all of these:")
	fmt.Println("  1. what does the root need to be? — that fixes min-heap or max-heap")
	fmt.Println("  2. what is allowed in the heap at once? — that fixes the size, and the bound")
	fmt.Println()
	fmt.Println("and one check before any of it: if the ranking key is a small integer,")
	fmt.Println("the answer is probably an array, and there is no heap in it at all.")
}`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Given a list of meeting intervals, find the minimum number of rooms required.",
      answer:
        "Sort the meetings by start time, then keep a min-heap of the end times of the meetings currently running. For each meeting, if the heap's root is less than or equal to the new start time, that room has freed up \u2014 pop it. Then push the new end time either way. The answer is the maximum size the heap reaches, which since nothing is ever popped without a push is just its final size. O(n log n) for the sort and the heap operations. The root is the only room worth checking, because if the soonest-free room is not free, none are.",
    },
    {
      question: "You must join n ropes into one; joining two costs the sum of their lengths. Minimise the cost.",
      answer:
        "Repeatedly join the two shortest ropes, using a min-heap to find them. The reason is that a joined rope is joined again, so its length is charged once for every remaining round \u2014 early joins are the expensive ones, and keeping them short is what minimises the total. It is Huffman's algorithm: O(n log n), dominated by n pops and pushes. The heap is not where the insight is; the greedy choice is, and it needs an exchange argument.",
    },
    {
      question: "How do you decide between a min-heap and a max-heap for a problem you have not seen before?",
      answer:
        "Ask what single element the algorithm keeps needing. A heap makes exactly one element cheap \u2014 its root \u2014 so whichever value the loop consults on every iteration has to be the root, and that fixes the direction. For the k largest, the value consulted is the smallest one currently kept, so it is a min-heap even though the question says largest. For meeting rooms it is the earliest end time. Getting this backwards is the usual bug, and it shows up as an O(k) scan appearing inside the loop to find the value the heap should have been surfacing.",
    },
  ],
  takeaways: [
    "Sort to fix the order of consideration; use the heap to answer availability in one comparison.",
    "In interval problems the answer is usually the heap's size \u2014 the number of resources in use at once.",
    "The greedy choice is the insight; the heap only makes that choice cheap to execute.",
    "Combining two items into one that will be combined again is Huffman's shape: min-heap, take two, repeat.",
    "Pick the direction by asking what the root must be, and the bound by asking what may be in the heap at once.",
    "Check first whether the ranking key is a small integer \u2014 if it is, the answer is buckets and not a heap at all.",
  ],
  status: "available",
};
