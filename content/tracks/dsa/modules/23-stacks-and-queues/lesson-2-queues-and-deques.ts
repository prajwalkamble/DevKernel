import type { Lesson } from "@/content/types";

export const queuesAndDequesLesson: Lesson = {
  id: "dsa-sq-queues",
  slug: "queues-deques-and-ring-buffers",
  moduleSlug: "stacks-and-queues",
  title: "Queues, Deques and Ring Buffers",
  summary:
    "First in, first out — and the implementation detail that decides whether your queue is O(1) or quietly O(n). The deque generalises both ends, and the ring buffer is how a queue is actually built.",
  estimatedMinutes: 30,
  objectives: [
    "Explain why a queue on a plain array is O(n) per dequeue",
    "Describe a ring buffer and its full-versus-empty ambiguity",
    "Use a deque as a stack, a queue, or both at once",
    "Build a queue from two stacks and give the amortised argument",
  ],
  sections: [
    {
      id: "fifo",
      heading: "First in, first out — and the naive trap",
      body: [
        "A queue adds at the back and removes from the front. The obvious implementation — an array with `append` and `remove(0)` — is a trap: removing the first element shifts every other element down, making dequeue **O(n)** and a loop of dequeues O(n²).",
        "Python's `list.pop(0)` and Java's `ArrayList.remove(0)` both do exactly this. The fix is `collections.deque` in Python and `ArrayDeque` in Java, both of which are ring buffers underneath.",
        "This is the most common accidental quadratic in BFS code, and it is invisible: the algorithm is right, the complexity analysis on the whiteboard is right, and the submission times out.",
      ],
      visual: {
        id: "queue-visual",
        kind: "queue",
        title: "Enqueue at the back, dequeue from the front",
      },
    },
    {
      id: "ring-buffer",
      heading: "The ring buffer",
      body: [
        "Keep a fixed array plus two indices, `head` and `tail`. Enqueue writes at `tail` and advances it modulo the capacity; dequeue reads at `head` and advances that. Nothing shifts, so both are genuinely O(1).",
        "The subtlety is that `head == tail` means both **empty and full**, and the two cases need different behaviour. Three standard resolutions: keep a separate `size` counter, waste one slot so full is `(tail + 1) % capacity == head`, or track a monotonically increasing count and take the modulo only when indexing.",
        "The size counter is usually clearest, and it is the one to describe in an interview unless asked to avoid extra state.",
        "Ring buffers are everywhere below the application layer — audio and network buffers, log rings, lock-free producer/consumer queues — precisely because the memory is fixed, contiguous and allocation-free once created.",
      ],
      visual: {
        id: "ring-visual",
        kind: "circular-buffer",
        title: "head and tail wrapping around a fixed array",
      },
    },
    {
      id: "deque",
      heading: "The deque",
      body: [
        "A double-ended queue supports push and pop at **both** ends, all O(1). It subsumes both structures: use one end and it is a stack, use opposite ends and it is a queue.",
        "In practice this means you rarely need a dedicated stack or queue type. `collections.deque`, `ArrayDeque`, `std::deque` and `VecDeque` each serve all three roles, and Java's documentation explicitly recommends `ArrayDeque` over the legacy `Stack` class, which is synchronised and slower for no benefit.",
        "The deque earns its own name in one place: the **monotonic deque**, where elements are appended at one end and discarded from *both* — expired ones from the front, dominated ones from the back. That is lesson 5, and it is the only common algorithm that genuinely needs both ends.",
      ],
      examples: [
        {
          id: "two-stacks",
          title: "A queue from two stacks",
          lang: "java",
          code: `import java.util.*;

public class Main {
    /** A queue built from two stacks: amortised O(1) per operation. */
    static class QueueFromStacks {
        private final Deque<Integer> inBox = new ArrayDeque<>();
        private final Deque<Integer> outBox = new ArrayDeque<>();

        void offer(int x) { inBox.push(x); }

        int poll() {
            shift();
            return outBox.pop();
        }

        int peek() {
            shift();
            return outBox.peek();
        }

        /** Only refills when out is empty, which is what makes it amortised O(1). */
        private void shift() {
            if (outBox.isEmpty()) {
                while (!inBox.isEmpty()) outBox.push(inBox.pop());
            }
        }
    }

    public static void main(String[] args) {
        QueueFromStacks q = new QueueFromStacks();
        q.offer(1); q.offer(2); q.offer(3);
        System.out.println("poll: " + q.poll());
        System.out.println("peek: " + q.peek());
        q.offer(4);
        System.out.println("poll: " + q.poll());
        System.out.println("poll: " + q.poll());
        System.out.println("poll: " + q.poll());
    }
}`,
          output: `poll: 1
peek: 2
poll: 2
poll: 3
poll: 4`,
          explanation:
            "Reversing a stack into another stack restores arrival order. The `if (outBox.isEmpty())` guard is the entire algorithm: transferring on **every** poll would be O(n) each time, but transferring only when the out box runs dry means each element moves between the stacks exactly once in its lifetime. Note that offering 4 after polling twice does not disturb the elements already waiting in the out box — which is why arrival order survives the interleaving.",
          alternates: [
            {
              lang: "python",
              code: `class QueueFromStacks:
    """A queue built from two stacks: amortised O(1) per operation."""

    def __init__(self):
        self.in_box = []
        self.out_box = []

    def offer(self, x):
        self.in_box.append(x)

    def poll(self):
        self._shift()
        return self.out_box.pop()

    def peek(self):
        self._shift()
        return self.out_box[-1]

    def _shift(self):
        """Only refills when out is empty, which is what makes it amortised O(1)."""
        if not self.out_box:
            while self.in_box:
                self.out_box.append(self.in_box.pop())


q = QueueFromStacks()
q.offer(1); q.offer(2); q.offer(3)
print("poll:", q.poll())
print("peek:", q.peek())
q.offer(4)
print("poll:", q.poll())
print("poll:", q.poll())
print("poll:", q.poll())`,
            },
            {
              lang: "javascript",
              code: `// A queue built from two stacks: amortised O(1) per operation.
class QueueFromStacks {
  constructor() {
    this.inBox = [];
    this.outBox = [];
  }

  offer(x) {
    this.inBox.push(x);
  }

  poll() {
    this.shift();
    return this.outBox.pop();
  }

  peek() {
    this.shift();
    return this.outBox[this.outBox.length - 1];
  }

  // Only refills when out is empty, which is what makes it amortised O(1).
  shift() {
    if (this.outBox.length === 0) {
      while (this.inBox.length) this.outBox.push(this.inBox.pop());
    }
  }
}

const q = new QueueFromStacks();
q.offer(1);
q.offer(2);
q.offer(3);
console.log("poll:", q.poll());
console.log("peek:", q.peek());
q.offer(4);
console.log("poll:", q.poll());
console.log("poll:", q.poll());
console.log("poll:", q.poll());`,
            },
            {
              lang: "typescript",
              code: `// A queue built from two stacks: amortised O(1) per operation.
class QueueFromStacks {
  inBox: number[];
  outBox: number[];

  constructor() {
    this.inBox = [];
    this.outBox = [];
  }

  offer(x: number): void {
    this.inBox.push(x);
  }

  poll(): number {
    this.shift();
    return this.outBox.pop()!;
  }

  peek(): number {
    this.shift();
    return this.outBox[this.outBox.length - 1];
  }

  // Only refills when out is empty, which is what makes it amortised O(1).
  shift(): void {
    if (this.outBox.length === 0) {
      while (this.inBox.length) this.outBox.push(this.inBox.pop());
    }
  }
}

const q = new QueueFromStacks();
q.offer(1);
q.offer(2);
q.offer(3);
console.log("poll:", q.poll());
console.log("peek:", q.peek());
q.offer(4);
console.log("poll:", q.poll());
console.log("poll:", q.poll());
console.log("poll:", q.poll());`,
            },
            {
              lang: "cpp",
              code: `// A queue built from two stacks: amortised O(1) per operation.
#include <iostream>
#include <stack>
using namespace std;

class QueueFromStacks {
    stack<int> inBox, outBox;

    // Only refills when out is empty, which is what makes it amortised O(1).
    void shift() {
        if (outBox.empty()) {
            while (!inBox.empty()) {
                outBox.push(inBox.top());
                inBox.pop();
            }
        }
    }

public:
    void offer(int x) { inBox.push(x); }

    int poll() {
        shift();
        int v = outBox.top();
        outBox.pop();
        return v;
    }

    int peek() {
        shift();
        return outBox.top();
    }
};

int main() {
    QueueFromStacks q;
    q.offer(1);
    q.offer(2);
    q.offer(3);
    cout << "poll: " << q.poll() << "\\n";
    cout << "peek: " << q.peek() << "\\n";
    q.offer(4);
    cout << "poll: " << q.poll() << "\\n";
    cout << "poll: " << q.poll() << "\\n";
    cout << "poll: " << q.poll() << "\\n";
}`,
            },
            {
              lang: "rust",
              code: `/// A queue built from two stacks: amortised O(1) per operation.
struct QueueFromStacks {
    in_box: Vec<i32>,
    out_box: Vec<i32>,
}

impl QueueFromStacks {
    fn new() -> Self {
        QueueFromStacks { in_box: Vec::new(), out_box: Vec::new() }
    }

    fn offer(&mut self, x: i32) {
        self.in_box.push(x);
    }

    fn poll(&mut self) -> i32 {
        self.shift();
        self.out_box.pop().unwrap()
    }

    fn peek(&mut self) -> i32 {
        self.shift();
        *self.out_box.last().unwrap()
    }

    /// Only refills when out is empty, which is what makes it amortised O(1).
    fn shift(&mut self) {
        if self.out_box.is_empty() {
            while let Some(x) = self.in_box.pop() {
                self.out_box.push(x);
            }
        }
    }
}

fn main() {
    let mut q = QueueFromStacks::new();
    q.offer(1);
    q.offer(2);
    q.offer(3);
    println!("poll: {}", q.poll());
    println!("peek: {}", q.peek());
    q.offer(4);
    println!("poll: {}", q.poll());
    println!("poll: {}", q.poll());
    println!("poll: {}", q.poll());
}`,
            },
            {
              lang: "go",
              code: `package main

import "fmt"

// A queue built from two stacks: amortised O(1) per operation.
type QueueFromStacks struct {
	inBox, outBox []int
}

func (q *QueueFromStacks) Offer(x int) { q.inBox = append(q.inBox, x) }

func (q *QueueFromStacks) Poll() int {
	q.shift()
	v := q.outBox[len(q.outBox)-1]
	q.outBox = q.outBox[:len(q.outBox)-1]
	return v
}

func (q *QueueFromStacks) Peek() int {
	q.shift()
	return q.outBox[len(q.outBox)-1]
}

// Only refills when out is empty, which is what makes it amortised O(1).
func (q *QueueFromStacks) shift() {
	if len(q.outBox) == 0 {
		for len(q.inBox) > 0 {
			v := q.inBox[len(q.inBox)-1]
			q.inBox = q.inBox[:len(q.inBox)-1]
			q.outBox = append(q.outBox, v)
		}
	}
}

func main() {
	q := &QueueFromStacks{}
	q.Offer(1)
	q.Offer(2)
	q.Offer(3)
	fmt.Println("poll:", q.Poll())
	fmt.Println("peek:", q.Peek())
	q.Offer(4)
	fmt.Println("poll:", q.Poll())
	fmt.Println("poll:", q.Poll())
	fmt.Println("poll:", q.Poll())
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "list.pop(0) and ArrayList.remove(0)",
          body: "Both shift every remaining element — O(n) per dequeue, O(n²) over a BFS. Use `collections.deque` or `ArrayDeque`. This is the single most common performance bug in otherwise-correct graph code.",
        },
        {
          title: "Java's Stack class",
          body: "`java.util.Stack` extends `Vector`, is synchronised, and iterates bottom-to-top — the opposite of what you expect from a stack. Use `ArrayDeque` with push/pop/peek instead.",
        },
        {
          title: "Transferring on every operation in the two-stack queue",
          body: "Shifting whenever the in box is non-empty makes each poll O(n) and destroys the amortised argument. Shift only when the out box is empty.",
        },
        {
          title: "The full-versus-empty ambiguity",
          body: "`head == tail` describes both states in a ring buffer. Pick one resolution — size counter, wasted slot, or absolute counts — and apply it consistently, because mixing two of them produces a buffer that silently drops or duplicates elements when it wraps.",
        },
      ],
    },
    {
      id: "amortised",
      heading: "The amortised argument",
      body: [
        "The two-stack queue is the cleanest small example of amortised analysis, and it is worth being able to state precisely.",
        "A single `poll` can be O(n), when it triggers a transfer of the whole in box. But **each element is pushed to the in box once, moved to the out box once, and popped once** — three constant-time operations over its entire lifetime, no matter how the calls interleave.",
        "So n operations cost O(n) in total, and the average per operation is O(1). That is the amortised bound, and the crucial word is *average over the sequence*, not *average over random input* — it holds for every possible sequence, which is what distinguishes amortised from average-case.",
        "The same argument justifies the dynamic array's doubling, and — importantly for the next lesson — the monotonic stack's nested `while` loop. Recognising it is what stops you from mis-analysing an O(n) algorithm as O(n²).",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why is a queue built on a plain array O(n) per dequeue?",
      answer:
        "Removing the front element shifts everything after it down by one. Over n dequeues that is O(n²). A ring buffer with head and tail indices avoids the shifting entirely, which is what `ArrayDeque` and `collections.deque` do.",
    },
    {
      question: "Implement a queue with two stacks — what is the complexity?",
      answer:
        "Push onto an in box; to poll, if the out box is empty pour the in box into it, then pop. Amortised O(1): each element is pushed, transferred and popped exactly once in its lifetime, so n operations cost O(n) total, even though one individual poll can be O(n).",
    },
    {
      question: "How do you distinguish full from empty in a ring buffer?",
      answer:
        "`head == tail` means both, so you need extra information: a size counter, a deliberately wasted slot so full is `(tail+1) % capacity == head`, or monotonically increasing absolute counts with the modulo applied only at indexing time.",
    },
  ],
  takeaways: [
    "Removing from the front of an array is O(n) — use a deque",
    "A ring buffer makes both ends O(1) with no shifting",
    "head == tail is ambiguous; resolve it with a size counter",
    "A deque is a stack and a queue, so it is usually the only type you need",
    "Java's legacy Stack class is worse than ArrayDeque in every way",
    "Amortised means averaged over the sequence, for every sequence",
  ],
  status: "available",
};
