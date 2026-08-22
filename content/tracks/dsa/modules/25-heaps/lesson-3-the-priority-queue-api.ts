import type { Lesson } from "@/content/types";

export const priorityQueueLesson: Lesson = {
  id: "dsa-heap-priority-queue",
  slug: "the-priority-queue-api",
  moduleSlug: "heaps-and-priority-queues",
  title: "The Priority Queue API, and the Comparator That Decides Everything",
  summary:
    "The heap machinery never changes. What you choose is the ordering — and composite keys, ties and the missing decrease-key are where the real decisions and the real bugs live.",
  estimatedMinutes: 35,
  objectives: [
    "Separate the priority queue as an abstract type from the heap that implements it",
    "Build a max-heap out of a min-heap, and say why no new code is needed",
    "Design a composite key that will not throw when two priorities tie",
    "Use lazy deletion in place of decrease-key, and state what it costs",
  ],
  sections: [
    {
      id: "adt-and-implementation",
      heading: "The queue is the promise; the heap is the machinery",
      body: [
        "A **priority queue** is an abstract type with three operations: add an item with a priority, look at the most important one, remove the most important one. Nothing in that description mentions trees or arrays.",
        "A **binary heap** is the usual way to build one, and it is the reason the operations cost what they do \u2014 O(1) to peek, O(log n) to add or remove. Other implementations exist and trade differently: a sorted list makes removal O(1) and insertion O(n), a Fibonacci heap improves the theory and loses on constants almost everywhere in practice.",
        "The distinction matters when reading a problem. Requirements are stated in terms of the queue \u2014 *always process the most urgent job next* \u2014 and the choice of heap is yours. It also matters when reading a language's library, because the two mainstream ones expose the same structure very differently: Python gives you functions that operate on a plain list, Java gives you a class that hides the array entirely.",
      ],
      examples: [
        {
          id: "min-and-max",
          title: "One heap, two orderings",
          lang: "python",
          code: `import heapq

jobs = [(3, "write tests"), (1, "fix the build"), (4, "refactor"),
        (1, "answer the pager"), (2, "review the PR")]

print("as a min-heap — smallest priority number first:")
h = []
for job in jobs:
    heapq.heappush(h, job)
while h:
    p, name = heapq.heappop(h)
    print(f"  {p}  {name}")

print()
print("as a max-heap — negate on the way in, negate on the way out:")
h = []
for p, name in jobs:
    heapq.heappush(h, (-p, name))
while h:
    p, name = heapq.heappop(h)
    print(f"  {-p}  {name}")

print()
print("the heap never knew which one it was doing. Only the key changed.")`,
          output: `as a min-heap — smallest priority number first:
  1  answer the pager
  1  fix the build
  2  review the PR
  3  write tests
  4  refactor

as a max-heap — negate on the way in, negate on the way out:
  4  refactor
  3  write tests
  2  review the PR
  1  answer the pager
  1  fix the build

the heap never knew which one it was doing. Only the key changed.`,
          explanation:
            "There is no max-heap in Python's standard library and there does not need to be. The heap compares whatever you hand it, so negating the key on the way in and again on the way out turns the same code into a max-heap. Java takes the other route \u2014 `PriorityQueue` accepts a `Comparator`, and `Comparator.reverseOrder()` does the same job without touching the data. Either way the structure is unchanged; only the ordering it is asked about moves.",
          alternates: [
            {
              lang: "javascript",
              code: `// JavaScript has no priority queue, so here is the whole of one. \`less\`
// is the only part that changes between the two halves of this example.
class Heap {
  constructor(less) {
    this.a = [];
    this.less = less;
  }
  push(v) {
    this.a.push(v);
    let i = this.a.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (!this.less(this.a[i], this.a[p])) break;
      [this.a[p], this.a[i]] = [this.a[i], this.a[p]];
      i = p;
    }
  }
  pop() {
    const top = this.a[0];
    const last = this.a.pop();
    if (this.a.length > 0) {
      this.a[0] = last;
      let i = 0;
      for (;;) {
        let m = i;
        for (const c of [2 * i + 1, 2 * i + 2]) {
          if (c < this.a.length && this.less(this.a[c], this.a[m])) m = c;
        }
        if (m === i) break;
        [this.a[i], this.a[m]] = [this.a[m], this.a[i]];
        i = m;
      }
    }
    return top;
  }
  get size() {
    return this.a.length;
  }
}

// Compares like a Python tuple: first field, then the second.
const byPair = (x, y) => (x[0] !== y[0] ? x[0] < y[0] : x[1] < y[1]);

const jobs = [[3, "write tests"], [1, "fix the build"], [4, "refactor"],
  [1, "answer the pager"], [2, "review the PR"]];

console.log("as a min-heap — smallest priority number first:");
let h = new Heap(byPair);
for (const job of jobs) h.push(job);
while (h.size > 0) {
  const [p, name] = h.pop();
  console.log(\`  \${p}  \${name}\`);
}

console.log();
console.log("as a max-heap — negate on the way in, negate on the way out:");
h = new Heap(byPair);
for (const [p, name] of jobs) h.push([-p, name]);
while (h.size > 0) {
  const [p, name] = h.pop();
  console.log(\`  \${-p}  \${name}\`);
}

console.log();
console.log("the heap never knew which one it was doing. Only the key changed.");`,
            },
            {
              lang: "typescript",
              code: `// JavaScript has no priority queue, so here is the whole of one. \`less\`
// is the only part that changes between the two halves of this example.
class Heap {
  a: [number, string][];
  less: (x: [number, string], y: [number, string]) => boolean;

  constructor(less: (x: [number, string], y: [number, string]) => boolean) {
    this.a = [] as [number, string][];
    this.less = less;
  }
  push(v: [number, string]): void {
    this.a.push(v);
    let i = this.a.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (!this.less(this.a[i], this.a[p])) break;
      [this.a[p], this.a[i]] = [this.a[i], this.a[p]];
      i = p;
    }
  }
  pop(): [number, string] {
    const top = this.a[0];
    const last = this.a.pop() as [number, string];
    if (this.a.length > 0) {
      this.a[0] = last;
      let i = 0;
      for (;;) {
        let m = i;
        for (const c of [2 * i + 1, 2 * i + 2]) {
          if (c < this.a.length && this.less(this.a[c], this.a[m])) m = c;
        }
        if (m === i) break;
        [this.a[i], this.a[m]] = [this.a[m], this.a[i]];
        i = m;
      }
    }
    return top;
  }
  get size(): number {
    return this.a.length;
  }
}

// Compares like a Python tuple: first field, then the second.
const byPair = (x: [number, string], y: [number, string]): boolean =>
  (x[0] !== y[0] ? x[0] < y[0] : x[1] < y[1]);

const jobs: [number, string][] = [[3, "write tests"], [1, "fix the build"], [4, "refactor"],
  [1, "answer the pager"], [2, "review the PR"]];

console.log("as a min-heap — smallest priority number first:");
let h = new Heap(byPair);
for (const job of jobs) h.push(job);
while (h.size > 0) {
  const [p, name] = h.pop();
  console.log(\`  \${p}  \${name}\`);
}

console.log();
console.log("as a max-heap — negate on the way in, negate on the way out:");
h = new Heap(byPair);
for (const [p, name] of jobs) h.push([-p, name]);
while (h.size > 0) {
  const [p, name] = h.pop();
  console.log(\`  \${-p}  \${name}\`);
}

console.log();
console.log("the heap never knew which one it was doing. Only the key changed.");`,
            },
            {
              lang: "java",
              code: `import java.util.Comparator;
import java.util.PriorityQueue;

public class Main {
    record Job(int priority, String name) {}

    /* Java's PriorityQueue takes a comparator rather than asking you to
       transform the key — the same choice Python makes you express by
       negating. Comparing name after priority reproduces the tuple ordering. */
    static final Comparator<Job> BY_PAIR =
            Comparator.comparingInt(Job::priority).thenComparing(Job::name);

    public static void main(String[] args) {
        Job[] jobs = {
            new Job(3, "write tests"), new Job(1, "fix the build"), new Job(4, "refactor"),
            new Job(1, "answer the pager"), new Job(2, "review the PR"),
        };

        System.out.println("as a min-heap — smallest priority number first:");
        PriorityQueue<Job> q = new PriorityQueue<>(BY_PAIR);
        for (Job job : jobs) q.add(job);
        while (!q.isEmpty()) {
            Job job = q.poll();
            System.out.printf("  %d  %s%n", job.priority(), job.name());
        }

        System.out.println();
        System.out.println("as a max-heap — negate on the way in, negate on the way out:");
        q = new PriorityQueue<>(BY_PAIR);
        for (Job job : jobs) q.add(new Job(-job.priority(), job.name()));
        while (!q.isEmpty()) {
            Job job = q.poll();
            System.out.printf("  %d  %s%n", -job.priority(), job.name());
        }

        System.out.println();
        System.out.println("the heap never knew which one it was doing. Only the key changed.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <iostream>
#include <queue>
#include <string>
#include <utility>
#include <vector>

// std::priority_queue is a *max*-heap by default, which is the opposite of
// Python's and Java's. \`std::greater\` on a pair gives the min-heap this needs,
// and a pair already compares first-then-second like a Python tuple.
using Job = std::pair<int, std::string>;
using MinHeap = std::priority_queue<Job, std::vector<Job>, std::greater<Job>>;

int main() {
    const std::vector<Job> jobs = {
        {3, "write tests"}, {1, "fix the build"}, {4, "refactor"},
        {1, "answer the pager"}, {2, "review the PR"},
    };

    std::cout << "as a min-heap — smallest priority number first:\\n";
    MinHeap q;
    for (const auto& job : jobs) q.push(job);
    while (!q.empty()) {
        auto [p, name] = q.top();
        q.pop();
        std::cout << "  " << p << "  " << name << '\\n';
    }

    std::cout << "\\nas a max-heap — negate on the way in, negate on the way out:\\n";
    MinHeap r;
    for (const auto& job : jobs) r.push({-job.first, job.second});
    while (!r.empty()) {
        auto [p, name] = r.top();
        r.pop();
        std::cout << "  " << -p << "  " << name << '\\n';
    }

    std::cout << "\\nthe heap never knew which one it was doing. Only the key changed.\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::cmp::Reverse;
use std::collections::BinaryHeap;

// Rust's BinaryHeap is a max-heap, so \`Reverse\` is how a min-heap is spelled.
// A tuple already orders first-then-second, exactly like Python's.
fn main() {
    let jobs: Vec<(i32, String)> = vec![
        (3, "write tests".to_string()),
        (1, "fix the build".to_string()),
        (4, "refactor".to_string()),
        (1, "answer the pager".to_string()),
        (2, "review the PR".to_string()),
    ];

    println!("as a min-heap — smallest priority number first:");
    let mut q: BinaryHeap<Reverse<(i32, String)>> = BinaryHeap::new();
    for job in &jobs {
        q.push(Reverse(job.clone()));
    }
    while let Some(Reverse((p, name))) = q.pop() {
        println!("  {}  {}", p, name);
    }

    println!();
    println!("as a max-heap — negate on the way in, negate on the way out:");
    let mut r: BinaryHeap<Reverse<(i32, String)>> = BinaryHeap::new();
    for (p, name) in &jobs {
        r.push(Reverse((-p, name.clone())));
    }
    while let Some(Reverse((p, name))) = r.pop() {
        println!("  {}  {}", -p, name);
    }

    println!();
    println!("the heap never knew which one it was doing. Only the key changed.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"container/heap"
	"fmt"
)

type job struct {
	priority int
	name     string
}

// container/heap is an interface, not a container: you supply the storage and
// the ordering, and it supplies the sift. Less compares the second field on a
// tie, which is what makes this match a Python tuple.
type jobs []job

func (j jobs) Len() int { return len(j) }
func (j jobs) Less(a, b int) bool {
	if j[a].priority != j[b].priority {
		return j[a].priority < j[b].priority
	}
	return j[a].name < j[b].name
}
func (j jobs) Swap(a, b int)       { j[a], j[b] = j[b], j[a] }
func (j *jobs) Push(x interface{}) { *j = append(*j, x.(job)) }
func (j *jobs) Pop() interface{} {
	old := *j
	n := len(old)
	last := old[n-1]
	*j = old[:n-1]
	return last
}

func main() {
	input := []job{
		{3, "write tests"}, {1, "fix the build"}, {4, "refactor"},
		{1, "answer the pager"}, {2, "review the PR"},
	}

	fmt.Println("as a min-heap — smallest priority number first:")
	q := &jobs{}
	heap.Init(q)
	for _, j := range input {
		heap.Push(q, j)
	}
	for q.Len() > 0 {
		j := heap.Pop(q).(job)
		fmt.Printf("  %d  %s\\n", j.priority, j.name)
	}

	fmt.Println()
	fmt.Println("as a max-heap — negate on the way in, negate on the way out:")
	r := &jobs{}
	heap.Init(r)
	for _, j := range input {
		heap.Push(r, job{-j.priority, j.name})
	}
	for r.Len() > 0 {
		j := heap.Pop(r).(job)
		fmt.Printf("  %d  %s\\n", -j.priority, j.name)
	}

	fmt.Println()
	fmt.Println("the heap never knew which one it was doing. Only the key changed.")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "the-comparator",
      heading: "The comparator is the whole design",
      body: [
        "Everything interesting about a priority queue is in what it compares. The heap machinery is fixed; the ordering is the part you choose, and choosing it badly is where the bugs are.",
        "Two mechanisms do the same job. **Transform the key** \u2014 negate it, or build a tuple \u2014 and let the default ordering do the work. Or **supply a comparator** and leave the data alone. Python's `heapq` only offers the first, Java's `PriorityQueue` offers the second, and C++'s `priority_queue` takes a comparator type that defaults to `less`, which makes it a *max*-heap by default and catches out everyone arriving from Python.",
        "Composite keys are where care is needed. `(priority, name)` sorts by priority and then breaks ties by name \u2014 which is fine until the tiebreaker is something that cannot be compared at all, and then the queue throws on the first collision rather than at the point where the mistake was made.",
        "And a priority queue is **not stable**. Two items of equal priority come out in an order the structure never promised, and which will change if the sift path changes. If insertion order matters among equals, it has to be part of the key.",
      ],
      examples: [
        {
          id: "tie-breaking",
          title: "What happens when priorities tie",
          lang: "python",
          code: `import heapq
import itertools


class Task:
    def __init__(self, name):
        self.name = name


print("a tie in the first field falls through to the second:")
h = []
for pair in [(1, "beta"), (1, "alpha"), (2, "gamma")]:
    heapq.heappush(h, pair)
out = [heapq.heappop(h) for _ in range(3)]
print("  ", " ".join(f"({p},{name})" for p, name in out))
print("   the names were compared. Nobody asked for that, and here it was harmless.")

print()
print("now the payload is an object with no ordering:")
h = []
try:
    heapq.heappush(h, (1, Task("beta")))
    heapq.heappush(h, (1, Task("alpha")))
except TypeError as e:
    print(f"   TypeError: {e}")
print("   the crash arrives only when two priorities actually tie, so it")
print("   survives every test whose priorities happen to be distinct.")

print()
print("the fix is a tiebreaker that is always comparable and never ties:")
counter = itertools.count()
h = []
for name in ("beta", "alpha", "gamma"):
    heapq.heappush(h, (1, next(counter), Task(name)))
order = [heapq.heappop(h)[2].name for _ in range(3)]
print("  ", " ".join(order))
print("   equal priorities now come out in insertion order, which is usually")
print("   what was wanted anyway — a priority queue is not otherwise stable.")`,
          output: `a tie in the first field falls through to the second:
   (1,alpha) (1,beta) (2,gamma)
   the names were compared. Nobody asked for that, and here it was harmless.

now the payload is an object with no ordering:
   TypeError: '<' not supported between instances of 'Task' and 'Task'
   the crash arrives only when two priorities actually tie, so it
   survives every test whose priorities happen to be distinct.

the fix is a tiebreaker that is always comparable and never ties:
   beta alpha gamma
   equal priorities now come out in insertion order, which is usually
   what was wanted anyway — a priority queue is not otherwise stable.`,
          explanation:
            "A tuple compares field by field, so a tie in the priority quietly promotes the *payload* to being the tiebreaker. When the payload is a string that is merely surprising. When it is an object with no ordering it is a `TypeError` \u2014 and one that appears only when two priorities actually collide, which is exactly the case a small test suite is least likely to contain. The monotonic counter fixes it for good: it is always comparable, it never ties, and it makes equal priorities come out in insertion order, which is almost always the behaviour that was silently assumed. The three variants are worth reading against each other, because this is one of the few places where the languages fail *differently* rather than identically. Java has no tuple key, so the same mistake is a missing comparator and a `ClassCastException` on the second `add` — a heap of one never compares anything, so a single-element test passes. JavaScript does not raise at all: `<` coerces both objects to `[object Object]`, every task ties with every other, and the wrong order arrives with no line number attached, which is worse. C++, Rust and Go are absent because there the mistake does not compile, and a variant that will not run is not a translation.",
          alternates: [
            {
              lang: "javascript",
              code: `class Task {
  constructor(name) {
    this.name = name;
  }
}

// A tuple key has no equivalent here: a JavaScript heap takes a comparator,
// so this file compares the way the Python one implicitly does.
const byPair = (x, y) => (x[0] !== y[0] ? x[0] < y[0] : x[1] < y[1]);

function drain(items, less) {
  const a = [...items];
  a.sort((x, y) => (less(x, y) ? -1 : less(y, x) ? 1 : 0));
  return a;
}

console.log("a tie in the first field falls through to the second:");
const pairs = drain([[1, "beta"], [1, "alpha"], [2, "gamma"]], byPair);
console.log("  ", pairs.map(([p, name]) => \`(\${p},\${name})\`).join(" "));
console.log("   the names were compared. Nobody asked for that, and here it was harmless.");

console.log();
console.log("now the payload is an object with no ordering:");
const a = new Task("beta");
const b = new Task("alpha");
console.log(\`   a < b is \${a < b}, a > b is \${a > b}, a === b is \${a === b}\`);
console.log("   no exception. Relational operators coerce both objects to the string");
console.log("   \\"[object Object]\\", which compares equal, so every task ties with every");
console.log("   other and the order is whatever the algorithm happened to produce.");

console.log();
console.log("the fix is to say what the order is, rather than hoping there is one:");
const tasks = [new Task("beta"), new Task("alpha"), new Task("gamma")];
tasks.sort((x, y) => (x.name < y.name ? -1 : x.name > y.name ? 1 : 0));
console.log("  ", tasks.map((t) => t.name).join(" "));
console.log("   Python raises on the first tie and JavaScript never raises at all —");
console.log("   which is worse, because a silent wrong order has no line number.");`,
              output: `a tie in the first field falls through to the second:
   (1,alpha) (1,beta) (2,gamma)
   the names were compared. Nobody asked for that, and here it was harmless.

now the payload is an object with no ordering:
   a < b is false, a > b is false, a === b is false
   no exception. Relational operators coerce both objects to the string
   "[object Object]", which compares equal, so every task ties with every
   other and the order is whatever the algorithm happened to produce.

the fix is to say what the order is, rather than hoping there is one:
   alpha beta gamma
   Python raises on the first tie and JavaScript never raises at all —
   which is worse, because a silent wrong order has no line number.`,
            },
            {
              lang: "typescript",
              code: `class Task {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

// A tuple key has no equivalent here: a JavaScript heap takes a comparator,
// so this file compares the way the Python one implicitly does.
const byPair = (x: [number, string], y: [number, string]): boolean =>
  (x[0] !== y[0] ? x[0] < y[0] : x[1] < y[1]);

function drain(items: [number, string][], less: (x: [number, string], y: [number, string]) => boolean): [number, string][] {
  const a = [...items];
  a.sort((x, y) => (less(x, y) ? -1 : less(y, x) ? 1 : 0));
  return a;
}

console.log("a tie in the first field falls through to the second:");
const pairs = drain([[1, "beta"], [1, "alpha"], [2, "gamma"]], byPair);
console.log("  ", pairs.map(([p, name]) => \`(\${p},\${name})\`).join(" "));
console.log("   the names were compared. Nobody asked for that, and here it was harmless.");

console.log();
console.log("now the payload is an object with no ordering:");
const a = new Task("beta");
const b = new Task("alpha");
// TypeScript refuses \`a < b\` on two objects outright, so the comparison is
// written through the coercion it would have performed.
const as = String(a);
const bs = String(b);
console.log(\`   a < b is \${as < bs}, a > b is \${as > bs}, a === b is \${(a as object) === (b as object)}\`);
console.log("   no exception. Relational operators coerce both objects to the string");
console.log("   \\"[object Object]\\", which compares equal, so every task ties with every");
console.log("   other and the order is whatever the algorithm happened to produce.");

console.log();
console.log("the fix is to say what the order is, rather than hoping there is one:");
const tasks = [new Task("beta"), new Task("alpha"), new Task("gamma")];
tasks.sort((x, y) => (x.name < y.name ? -1 : x.name > y.name ? 1 : 0));
console.log("  ", tasks.map((t) => t.name).join(" "));
console.log("   Python raises on the first tie and JavaScript never raises at all —");
console.log("   which is worse, because a silent wrong order has no line number.");`,
              output: `a tie in the first field falls through to the second:
   (1,alpha) (1,beta) (2,gamma)
   the names were compared. Nobody asked for that, and here it was harmless.

now the payload is an object with no ordering:
   a < b is false, a > b is false, a === b is false
   no exception. Relational operators coerce both objects to the string
   "[object Object]", which compares equal, so every task ties with every
   other and the order is whatever the algorithm happened to produce.

the fix is to say what the order is, rather than hoping there is one:
   alpha beta gamma
   Python raises on the first tie and JavaScript never raises at all —
   which is worse, because a silent wrong order has no line number.`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.PriorityQueue;

public class Main {
    static class Task {
        final String name;
        Task(String name) { this.name = name; }
    }

    record Pair(int priority, String name) {}

    public static void main(String[] args) {
        System.out.println("a tie in the first field falls through to the second:");
        PriorityQueue<Pair> pairs = new PriorityQueue<>(
                Comparator.comparingInt(Pair::priority).thenComparing(Pair::name));
        for (Pair p : new Pair[]{new Pair(1, "beta"), new Pair(1, "alpha"), new Pair(2, "gamma")}) {
            pairs.add(p);
        }
        StringBuilder shown = new StringBuilder();
        while (!pairs.isEmpty()) {
            Pair p = pairs.poll();
            shown.append(shown.length() > 0 ? " " : "").append("(").append(p.priority())
                 .append(",").append(p.name()).append(")");
        }
        System.out.println("   " + shown);
        System.out.println("   the names were compared. Nobody asked for that, and here it was harmless.");

        System.out.println();
        System.out.println("now the payload is an object with no ordering:");
        /* No comparator at all, so PriorityQueue falls back to the elements'
           natural ordering — and Task has none. The cast is what fails. */
        PriorityQueue<Task> tasks = new PriorityQueue<>();
        try {
            tasks.add(new Task("beta"));
            tasks.add(new Task("alpha"));
        } catch (ClassCastException e) {
            /* Only the first clause is printed. The rest of the message names
               the classloader, and that name has a hash of its address in it —
               so the full text differs between runs. */
            String message = e.getMessage();
            int tail = message.indexOf(" (");
            System.out.println("   ClassCastException: " + (tail < 0 ? message : message.substring(0, tail)));
        }
        System.out.println("   the crash arrives only on the second add, because a heap of one");
        System.out.println("   never compares anything. A test with a single task would pass.");

        System.out.println();
        System.out.println("the fix is to say what the order is, rather than hoping there is one:");
        PriorityQueue<Task> ordered = new PriorityQueue<>(Comparator.comparing(t -> t.name));
        List<String> out = new ArrayList<>();
        for (String name : new String[]{"beta", "alpha", "gamma"}) ordered.add(new Task(name));
        while (!ordered.isEmpty()) out.add(ordered.poll().name);
        System.out.println("   " + String.join(" ", out));
        System.out.println("   Java makes the comparator a constructor argument, so the mistake is");
        System.out.println("   forgetting to pass one — not, as in Python, writing a key that ties.");
    }
}`,
              output: `a tie in the first field falls through to the second:
   (1,alpha) (1,beta) (2,gamma)
   the names were compared. Nobody asked for that, and here it was harmless.

now the payload is an object with no ordering:
   ClassCastException: class Main$Task cannot be cast to class java.lang.Comparable
   the crash arrives only on the second add, because a heap of one
   never compares anything. A test with a single task would pass.

the fix is to say what the order is, rather than hoping there is one:
   alpha beta gamma
   Java makes the comparator a constructor argument, so the mistake is
   forgetting to pass one — not, as in Python, writing a key that ties.`,
            },
          ],
        },
      ],
    },
    {
      id: "what-it-will-not-do",
      heading: "No decrease-key, and what to do instead",
      body: [
        "Two operations that feel like they should exist do not: changing an item's priority, and removing an item that is not at the top. Both need to *find* the item first, and a heap has no way to do that short of scanning.",
        "The pattern that replaces them is **lazy deletion**. Never modify what is in the heap. Push a new entry with the new priority, keep a map recording the value you currently believe, and when an entry surfaces that disagrees with the map, discard it and pop again.",
        "It is correct because a stale entry can only ever have a *worse or equal* priority claim than the live one for the same item, so it can never be popped before the truth is. And the amortised cost stays O(log n) per operation, because each entry is pushed once and discarded at most once.",
        "The price is memory: the heap is bounded by the number of updates, not by the number of live items. For Dijkstra on a sparse graph that is fine and it is what most implementations do. For a scheduler reprioritising the same few thousand jobs in a tight loop it is not, and that is when an indexed heap \u2014 one that keeps a position map alongside the array \u2014 starts to earn its complexity.",
      ],
      examples: [
        {
          id: "lazy-deletion",
          title: "Changing your mind, without a decrease-key",
          lang: "python",
          code: `import heapq

# A heap has no way to find an arbitrary element, so it has no way to change
# one's priority or remove it. The standard answer is to leave the stale entry
# where it is and ignore it when it surfaces.
heap = []
pushed = 0
discarded = 0
current = {}          # task -> the priority we actually believe
REMOVED = object()


def set_priority(task, priority):
    global pushed
    current[task] = priority
    heapq.heappush(heap, (priority, task))     # the old entry stays behind
    pushed += 1


def remove(task):
    current[task] = REMOVED


def pop():
    global discarded
    while heap:
        priority, task = heapq.heappop(heap)
        if current.get(task) == priority:      # the entry still speaks for the task
            del current[task]
            return priority, task
        discarded += 1
    return None


for task, p in [("deploy", 5), ("build", 2), ("test", 3)]:
    set_priority(task, p)
print(f"queued 3 tasks, heap holds {len(heap)} entries")

set_priority("deploy", 1)                      # promoted
remove("test")                                 # cancelled
print(f"after one promotion and one cancellation, heap holds {len(heap)} entries")
print()

while True:
    got = pop()
    if got is None:
        break
    print(f"  popped {got[1]} at priority {got[0]}")

print()
print(f"{pushed} entries went in and {discarded} were discarded on the way out.")
print("the heap never shrank on cancellation — it grew. That is the trade:")
print("O(log n) updates, in exchange for a heap bounded by the number of")
print("updates rather than the number of live tasks.")`,
          output: `queued 3 tasks, heap holds 3 entries
after one promotion and one cancellation, heap holds 4 entries

  popped deploy at priority 1
  popped build at priority 2

4 entries went in and 2 were discarded on the way out.
the heap never shrank on cancellation — it grew. That is the trade:
O(log n) updates, in exchange for a heap bounded by the number of
updates rather than the number of live tasks.`,
          explanation:
            "Textbook priority queues offer `decrease-key`; the ones in standard libraries do not, because finding an arbitrary element in a heap is O(n) and the bookkeeping to make it O(log n) costs more than it saves for most callers. The working pattern is to never update in place: push a new entry, record what you now believe in a map, and drop entries that disagree when they surface. The cost is a heap that grows with the number of *updates* rather than the number of live items \u2014 worth knowing before using this in a loop that reprioritises constantly, and exactly what Dijkstra's implementations do.",
          alternates: [
            {
              lang: "javascript",
              code: `// A heap has no way to find an arbitrary element, so it has no way to change
// one's priority or remove it. The standard answer is to leave the stale entry
// where it is and ignore it when it surfaces.
const heap = [];
let pushed = 0;
let discarded = 0;
const current = new Map();          // task -> the priority we actually believe
const REMOVED = -1;                 // no real priority is negative

function less(x, y) {
  return x[0] !== y[0] ? x[0] < y[0] : x[1] < y[1];
}

function heapPush(v) {
  heap.push(v);
  let i = heap.length - 1;
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (!less(heap[i], heap[p])) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
}

function heapPop() {
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

function setPriority(task, priority) {
  current.set(task, priority);
  heapPush([priority, task]);        // the old entry stays behind
  pushed += 1;
}

function remove(task) {
  current.set(task, REMOVED);
}

function pop() {
  while (heap.length > 0) {
    const [priority, task] = heapPop();
    if (current.get(task) === priority) {   // the entry still speaks for the task
      current.delete(task);
      return [priority, task];
    }
    discarded += 1;
  }
  return null;
}

for (const [task, p] of [["deploy", 5], ["build", 2], ["test", 3]]) setPriority(task, p);
console.log(\`queued 3 tasks, heap holds \${heap.length} entries\`);

setPriority("deploy", 1);            // promoted
remove("test");                      // cancelled
console.log(\`after one promotion and one cancellation, heap holds \${heap.length} entries\`);
console.log();

for (;;) {
  const got = pop();
  if (got === null) break;
  console.log(\`  popped \${got[1]} at priority \${got[0]}\`);
}

console.log();
console.log(\`\${pushed} entries went in and \${discarded} were discarded on the way out.\`);
console.log("the heap never shrank on cancellation — it grew. That is the trade:");
console.log("O(log n) updates, in exchange for a heap bounded by the number of");
console.log("updates rather than the number of live tasks.");`,
            },
            {
              lang: "typescript",
              code: `// A heap has no way to find an arbitrary element, so it has no way to change
// one's priority or remove it. The standard answer is to leave the stale entry
// where it is and ignore it when it surfaces.
const heap: [number, string][] = [];
let pushed = 0;
let discarded = 0;
const current = new Map<string, number>();          // task -> the priority we actually believe
const REMOVED = -1;                 // no real priority is negative

function less(x: [number, string], y: [number, string]): boolean {
  return x[0] !== y[0] ? x[0] < y[0] : x[1] < y[1];
}

function heapPush(v: [number, string]): void {
  heap.push(v);
  let i = heap.length - 1;
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (!less(heap[i], heap[p])) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
}

function heapPop(): [number, string] {
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

function setPriority(task: string, priority: number): void {
  current.set(task, priority);
  heapPush([priority, task]);        // the old entry stays behind
  pushed += 1;
}

function remove(task: string): void {
  current.set(task, REMOVED);
}

function pop(): [number, string] | null {
  while (heap.length > 0) {
    const [priority, task] = heapPop();
    if (current.get(task) === priority) {   // the entry still speaks for the task
      current.delete(task);
      return [priority, task];
    }
    discarded += 1;
  }
  return null;
}

const queued: [string, number][] = [["deploy", 5], ["build", 2], ["test", 3]];
for (const [task, p] of queued) setPriority(task, p);
console.log(\`queued 3 tasks, heap holds \${heap.length} entries\`);

setPriority("deploy", 1);            // promoted
remove("test");                      // cancelled
console.log(\`after one promotion and one cancellation, heap holds \${heap.length} entries\`);
console.log();

for (;;) {
  const got = pop();
  if (got === null) break;
  console.log(\`  popped \${got[1]} at priority \${got[0]}\`);
}

console.log();
console.log(\`\${pushed} entries went in and \${discarded} were discarded on the way out.\`);
console.log("the heap never shrank on cancellation — it grew. That is the trade:");
console.log("O(log n) updates, in exchange for a heap bounded by the number of");
console.log("updates rather than the number of live tasks.");`,
            },
            {
              lang: "java",
              code: `import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import java.util.PriorityQueue;

public class Main {
    record Entry(int priority, String task) {}

    /* A heap has no way to find an arbitrary element, so it has no way to change
       one's priority or remove it. The standard answer is to leave the stale entry
       where it is and ignore it when it surfaces. */
    static final PriorityQueue<Entry> heap = new PriorityQueue<>(
            Comparator.comparingInt(Entry::priority).thenComparing(Entry::task));
    static final Map<String, Integer> current = new HashMap<>();   // task -> what we believe
    static final int REMOVED = -1;                                 // no real priority is negative
    static int pushed = 0;
    static int discarded = 0;

    static void setPriority(String task, int priority) {
        current.put(task, priority);
        heap.add(new Entry(priority, task));                       // the old entry stays behind
        pushed += 1;
    }

    static void remove(String task) {
        current.put(task, REMOVED);
    }

    static Entry pop() {
        while (!heap.isEmpty()) {
            Entry e = heap.poll();
            Integer believed = current.get(e.task());
            if (believed != null && believed == e.priority()) {    // still speaks for the task
                current.remove(e.task());
                return e;
            }
            discarded += 1;
        }
        return null;
    }

    public static void main(String[] args) {
        setPriority("deploy", 5);
        setPriority("build", 2);
        setPriority("test", 3);
        System.out.printf("queued 3 tasks, heap holds %d entries%n", heap.size());

        setPriority("deploy", 1);                                  // promoted
        remove("test");                                            // cancelled
        System.out.printf("after one promotion and one cancellation, heap holds %d entries%n", heap.size());
        System.out.println();

        while (true) {
            Entry got = pop();
            if (got == null) break;
            System.out.printf("  popped %s at priority %d%n", got.task(), got.priority());
        }

        System.out.println();
        System.out.printf("%d entries went in and %d were discarded on the way out.%n", pushed, discarded);
        System.out.println("the heap never shrank on cancellation — it grew. That is the trade:");
        System.out.println("O(log n) updates, in exchange for a heap bounded by the number of");
        System.out.println("updates rather than the number of live tasks.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <functional>
#include <iostream>
#include <map>
#include <queue>
#include <string>
#include <utility>
#include <vector>

/* A heap has no way to find an arbitrary element, so it has no way to change
   one's priority or remove it. The standard answer is to leave the stale entry
   where it is and ignore it when it surfaces. */
using Entry = std::pair<int, std::string>;
static std::priority_queue<Entry, std::vector<Entry>, std::greater<Entry>> heap;
static std::map<std::string, int> current;      // task -> what we believe
static const int REMOVED = -1;                  // no real priority is negative
static int pushed = 0;
static int discarded = 0;

static void set_priority(const std::string& task, int priority) {
    current[task] = priority;
    heap.push({priority, task});                // the old entry stays behind
    pushed += 1;
}

static void remove_task(const std::string& task) {
    current[task] = REMOVED;
}

static bool pop(Entry& out) {
    while (!heap.empty()) {
        Entry e = heap.top();
        heap.pop();
        auto it = current.find(e.second);
        if (it != current.end() && it->second == e.first) {   // still speaks for the task
            current.erase(it);
            out = e;
            return true;
        }
        discarded += 1;
    }
    return false;
}

int main() {
    set_priority("deploy", 5);
    set_priority("build", 2);
    set_priority("test", 3);
    std::cout << "queued 3 tasks, heap holds " << heap.size() << " entries\\n";

    set_priority("deploy", 1);                  // promoted
    remove_task("test");                        // cancelled
    std::cout << "after one promotion and one cancellation, heap holds "
              << heap.size() << " entries\\n\\n";

    Entry got;
    while (pop(got)) {
        std::cout << "  popped " << got.second << " at priority " << got.first << '\\n';
    }

    std::cout << '\\n' << pushed << " entries went in and " << discarded
              << " were discarded on the way out.\\n";
    std::cout << "the heap never shrank on cancellation — it grew. That is the trade:\\n";
    std::cout << "O(log n) updates, in exchange for a heap bounded by the number of\\n";
    std::cout << "updates rather than the number of live tasks.\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::cmp::Reverse;
use std::collections::{BinaryHeap, HashMap};

/// A heap has no way to find an arbitrary element, so it has no way to change
/// one's priority or remove it. The standard answer is to leave the stale entry
/// where it is and ignore it when it surfaces.
struct Scheduler {
    heap: BinaryHeap<Reverse<(i32, String)>>,
    current: HashMap<String, i32>, // task -> what we believe
    pushed: i32,
    discarded: i32,
}

const REMOVED: i32 = -1; // no real priority is negative

impl Scheduler {
    fn set_priority(&mut self, task: &str, priority: i32) {
        self.current.insert(task.to_string(), priority);
        self.heap.push(Reverse((priority, task.to_string()))); // the old entry stays behind
        self.pushed += 1;
    }

    fn remove(&mut self, task: &str) {
        self.current.insert(task.to_string(), REMOVED);
    }

    fn pop(&mut self) -> Option<(i32, String)> {
        while let Some(Reverse((priority, task))) = self.heap.pop() {
            if self.current.get(&task) == Some(&priority) {
                // still speaks for the task
                self.current.remove(&task);
                return Some((priority, task));
            }
            self.discarded += 1;
        }
        None
    }
}

fn main() {
    let mut s = Scheduler {
        heap: BinaryHeap::new(),
        current: HashMap::new(),
        pushed: 0,
        discarded: 0,
    };

    for (task, p) in [("deploy", 5), ("build", 2), ("test", 3)] {
        s.set_priority(task, p);
    }
    println!("queued 3 tasks, heap holds {} entries", s.heap.len());

    s.set_priority("deploy", 1); // promoted
    s.remove("test"); // cancelled
    println!("after one promotion and one cancellation, heap holds {} entries", s.heap.len());
    println!();

    while let Some((priority, task)) = s.pop() {
        println!("  popped {} at priority {}", task, priority);
    }

    println!();
    println!("{} entries went in and {} were discarded on the way out.", s.pushed, s.discarded);
    println!("the heap never shrank on cancellation — it grew. That is the trade:");
    println!("O(log n) updates, in exchange for a heap bounded by the number of");
    println!("updates rather than the number of live tasks.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"container/heap"
	"fmt"
)

type entry struct {
	priority int
	task     string
}

type entries []entry

func (e entries) Len() int { return len(e) }
func (e entries) Less(a, b int) bool {
	if e[a].priority != e[b].priority {
		return e[a].priority < e[b].priority
	}
	return e[a].task < e[b].task
}
func (e entries) Swap(a, b int)       { e[a], e[b] = e[b], e[a] }
func (e *entries) Push(x interface{}) { *e = append(*e, x.(entry)) }
func (e *entries) Pop() interface{} {
	old := *e
	n := len(old)
	last := old[n-1]
	*e = old[:n-1]
	return last
}

// A heap has no way to find an arbitrary element, so it has no way to change
// one's priority or remove it. The standard answer is to leave the stale entry
// where it is and ignore it when it surfaces.
var (
	h         = &entries{}
	current   = map[string]int{} // task -> what we believe
	pushed    = 0
	discarded = 0
)

const removed = -1 // no real priority is negative

func setPriority(task string, priority int) {
	current[task] = priority
	heap.Push(h, entry{priority, task}) // the old entry stays behind
	pushed++
}

func remove(task string) {
	current[task] = removed
}

func pop() (entry, bool) {
	for h.Len() > 0 {
		e := heap.Pop(h).(entry)
		if believed, ok := current[e.task]; ok && believed == e.priority {
			delete(current, e.task)
			return e, true
		}
		discarded++
	}
	return entry{}, false
}

func main() {
	heap.Init(h)
	for _, q := range []entry{{5, "deploy"}, {2, "build"}, {3, "test"}} {
		setPriority(q.task, q.priority)
	}
	fmt.Printf("queued 3 tasks, heap holds %d entries\\n", h.Len())

	setPriority("deploy", 1) // promoted
	remove("test")           // cancelled
	fmt.Printf("after one promotion and one cancellation, heap holds %d entries\\n", h.Len())
	fmt.Println()

	for {
		got, ok := pop()
		if !ok {
			break
		}
		fmt.Printf("  popped %s at priority %d\\n", got.task, got.priority)
	}

	fmt.Println()
	fmt.Printf("%d entries went in and %d were discarded on the way out.\\n", pushed, discarded)
	fmt.Println("the heap never shrank on cancellation — it grew. That is the trade:")
	fmt.Println("O(log n) updates, in exchange for a heap bounded by the number of")
	fmt.Println("updates rather than the number of live tasks.")
}`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Python has no max-heap. How do you get one?",
      answer:
        "Negate the key going in and coming out — push `-priority` and negate what you pop. The heap only ever asks whether one key is less than another, so reversing the sign reverses the ordering without changing a line of the structure. For values that cannot be negated, wrap them in a small class with `__lt__` defined backwards, or store `(-priority, tiebreaker, payload)`. The point worth making out loud is that a max-heap is not a different data structure, only a different comparison.",
    },
    {
      question: "You push `(priority, task)` tuples and it works in testing, then throws in production. What happened?",
      answer:
        "Two tasks arrived with the same priority. A tuple compares field by field, so the tie sent the comparison to the second field, and if the task object has no ordering that is a TypeError. It survives testing because tests usually use distinct priorities. The fix is a middle field that is always comparable and never ties — a monotonically increasing counter — which also has the useful side effect of making equal priorities come out in insertion order, since a priority queue gives no ordering among equals otherwise.",
    },
    {
      question: "How do you decrease a key in a heap that has no decrease-key?",
      answer:
        "You do not update in place, because finding the element is O(n). You push a second entry with the new priority and keep a map of what the current priority for each item actually is; when an entry is popped whose priority disagrees with the map, you throw it away and pop again. Each entry is pushed once and discarded at most once, so the amortised cost per operation is still O(log n). What it costs is memory — the heap is bounded by the number of updates rather than the number of live items — and that is the standard trade in a Dijkstra implementation.",
    },
  ],
  takeaways: [
    "A priority queue is the abstract type; a binary heap is one implementation of it, and the one the costs come from.",
    "A max-heap is a min-heap with the comparison reversed — by negating the key, or by supplying a comparator.",
    "C++'s `priority_queue` is a max-heap by default, which is the opposite of Python's and Java's.",
    "A tuple key breaks ties on its next field, so make that field a counter rather than whatever the payload happens to be.",
    "Priority queues are not stable: if insertion order matters among equals, put it in the key.",
    "Lazy deletion replaces decrease-key: push the new value, believe the map, discard entries that disagree.",
  ],
  status: "available",
};
