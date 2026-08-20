import type { Lesson } from "@/content/types";

export const augmentingLesson: Lesson = {
  id: "dsa-sq-augment",
  slug: "min-stack-and-augmenting",
  moduleSlug: "stacks-and-queues",
  title: "Min-Stack, and Augmenting a Structure",
  summary:
    "Make a structure answer a question it was not built for by storing the answer alongside the data. The min-stack is the smallest example of a technique that reappears in every advanced structure in this track.",
  estimatedMinutes: 30,
  objectives: [
    "Implement a stack with O(1) minimum",
    "State the general principle behind augmentation",
    "Explain why the same trick is harder for a queue",
    "Recognise augmentation in structures you already know",
  ],
  sections: [
    {
      id: "min-stack",
      heading: "A stack that knows its minimum",
      body: [
        "Push, pop, top and `getMin`, all O(1). Scanning for the minimum would be O(n), and keeping a single `min` variable fails on pop — when the minimum is removed you have no idea what the new one is.",
        "The fix is to notice that the minimum is a property of *a stack state*, and stack states nest exactly like the stack itself. So store, with every element, the minimum of everything at and below it. Pushing computes `min(x, current_min)`; popping discards the pair and the previous element's stored minimum becomes current again — automatically, because it was never overwritten.",
        "The old value is not recomputed. It was already there, waiting, which is what makes the pop O(1).",
      ],
      examples: [
        {
          id: "min-stack",
          title: "Every entry remembers its own minimum",
          lang: "python",
          code: `class MinStack:
    """Every entry remembers the minimum of the stack at and below it."""
    def __init__(self):
        self.stack = []              # (value, min_so_far)

    def push(self, x):
        current = x if not self.stack else min(x, self.stack[-1][1])
        self.stack.append((x, current))

    def pop(self):
        return self.stack.pop()[0]

    def top(self):
        return self.stack[-1][0]

    def get_min(self):
        return self.stack[-1][1]

s = MinStack()
for v in [5, 3, 7, 3, 8]:
    s.push(v)
    print(f"push {v} -> top={s.top()} min={s.get_min()}")
while s.stack:
    v = s.pop()
    rest = s.get_min() if s.stack else None
    print(f"pop  {v} -> min now {rest}")`,
          output: `push 5 -> top=5 min=5
push 3 -> top=3 min=3
push 7 -> top=7 min=3
push 3 -> top=3 min=3
push 8 -> top=8 min=3
pop  8 -> min now 3
pop  3 -> min now 3
pop  7 -> min now 3
pop  3 -> min now 5
pop  5 -> min now None`,
          explanation:
            "Follow the duplicate 3s. After popping the second 3 the minimum is still 3, because the first one is still below — no special handling needed, since each entry carries its own answer. The alternative implementation keeps a separate stack of minima and pushes only when `x <= current_min`; the `<=` there is essential, and using `<` breaks on exactly this duplicate case. Storing the pair avoids that trap entirely at the cost of one extra value per element.",
        },
      ],
    },
    {
      id: "the-principle",
      heading: "The principle",
      body: [
        "The general move: **store, with each element, the answer to the query as of that element**, so the query becomes a read rather than a computation.",
        "It works when the stored answer can be maintained in O(1) on insertion and does not need recomputing on removal. A stack satisfies both, because removals only ever happen at the end — the state you return to is a state that existed before, and its answer was never discarded.",
        "The cost is memory: one extra value per element, so O(n) additional space. That trade — space for query time — is the same one a prefix-sum array, a hash index and a Fenwick tree all make.",
        "The variant worth knowing is storing the minimum only when it *changes*, on a second stack with `<=`. Less memory when minima are rare, one more invariant to keep straight. In an interview, describe the pair version first; it is obviously correct, and obvious correctness is worth more than a constant factor of memory.",
      ],
      pitfalls: [
        {
          title: "A single min variable",
          body: "Works until the minimum is popped, at which point the new minimum is unrecoverable without a scan. The failure needs a specific sequence to show up, so it often passes a first test.",
        },
        {
          title: "Using < instead of <= in the two-stack variant",
          body: "With duplicate minima, `<` pushes the minimum only once but pops it on the first matching removal — leaving a stack that reports a minimum smaller than anything actually present. The duplicate-3 sequence above is exactly the test that exposes it.",
        },
        {
          title: "Assuming the same trick gives a min-queue",
          body: "It does not. A queue removes from the front, so the state you return to is not one that previously existed — the stored answers were computed with elements that are still present. A min-queue needs either two stacks with their own minima, or a monotonic deque.",
        },
        {
          title: "Augmenting with something that cannot be maintained",
          body: "The median, for instance, cannot be kept per element in O(1) — it changes non-locally as elements arrive. That is why a running median needs two heaps rather than an augmented stack. Check that the property is maintainable before designing around it.",
        },
      ],
    },
    {
      id: "elsewhere",
      heading: "The same idea, elsewhere",
      body: [
        "**Prefix sums.** Each index stores the sum of everything before it, turning a range sum from a loop into a subtraction. Augmentation on an array.",
        "**Order-statistic trees.** Each node stores the size of its subtree, which turns \"the k-th smallest\" from a traversal into a descent.",
        "**Segment and Fenwick trees.** Each node stores an aggregate of a range, so a range query reads a few nodes instead of scanning.",
        "**Balanced BSTs.** Each node stores its height or colour so rebalancing is decidable locally rather than by measuring.",
        "**The LRU cache.** The map stores where each key lives in the list — an index augmenting a structure that has no lookup of its own.",
        "**Union-Find with union by size.** Each root stores its component's size, making the merge decision O(1).",
        "Seeing these as one technique rather than six is useful, because the design question generalises: *what would I need to have already computed for this query to be a read?* Most of the advanced structures later in this track are answers to that question.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Design a stack with O(1) getMin.",
      answer:
        "Store with each element the minimum of the stack at and below it — either as a pair, or on a parallel stack of minima. Push computes `min(x, currentMin)`; pop discards the entry and the previous element's stored minimum is current again with no recomputation.",
    },
    {
      question: "Why doesn't the same approach give an O(1) min-queue?",
      answer:
        "A stack pops from the end, so it returns to a state that previously existed and whose answer is still stored. A queue removes from the front, so the remaining elements' stored minima were computed with elements that are still present and are therefore stale. A min-queue needs two stacks each tracking their own minimum, or a monotonic deque.",
    },
    {
      question: "What is the general principle here?",
      answer:
        "Store the answer to the query alongside the data so the query is a read rather than a computation, provided it can be maintained in O(1) on insertion and does not need recomputing on removal. It costs O(n) extra space, and it is the idea behind prefix sums, segment trees, order-statistic trees and union by size.",
    },
  ],
  takeaways: [
    "Store each element's answer with it; the query becomes a read",
    "Popping restores a previous state whose answer was never discarded",
    "Use <= in the two-stack variant, or duplicates break it",
    "A min-queue is genuinely harder — front removal invalidates stored answers",
    "The trade is O(n) space for O(1) queries",
    "Prefix sums, segment trees and union-by-size are the same idea",
  ],
  status: "available",
};
