import type { Lesson } from "@/content/types";

export const stacksQueuesDequesLesson: Lesson = {
  id: "dsa-ds-stacks-queues",
  slug: "stacks-queues-and-deques",
  moduleSlug: "introduction-to-data-structures",
  title: "Stacks, Queues & Deques",
  summary:
    "Three structures defined by what they refuse to do, the problems each one signals, and the quadratic mistake of using a list as a queue.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Use a stack and a queue with the right built-in in both languages",
    "Recognise the problem shapes that call for each",
    "Explain why `list.pop(0)` makes a queue quadratic",
    "Use a deque for both roles, and know the bounded and rotating tricks",
  ],
  sections: [
    {
      id: "restriction",
      heading: "Defined by their restrictions",
      body: [
        "A stack and a queue are both just a sequence. What makes them useful is what they **refuse** to do: you cannot reach into the middle.",
        "**Stack — last in, first out.** Push and pop at the same end. The most recently added item is the only one you can see.",
        "**Queue — first in, first out.** Add at one end, remove from the other. Items are served in arrival order.",
        "**Deque — both ends.** Add and remove at either end, in O(1). It is a superset of both, which is why one type can implement both roles.",
        "The restriction is not a limitation to work around. It is what makes the structure a match for a specific problem shape — and recognising the shape is how you know which to reach for.",
      ],
      examples: [
        {
          id: "stack-basics",
          title: "A stack, and the problem it was made for",
          lang: "python",
          code: `stack = []
for ch in "abc":
    stack.append(ch)
    print(f"  push {ch}: {stack}")
while stack:
    print(f"  pop {stack.pop()}: {stack}")

print()


def is_balanced(text):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in text:
        if ch in "([{":
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
    return not stack


for t in ["([]{})", "([)]", "(", "", "))"]:
    print(f"  {t!r:<10} balanced: {is_balanced(t)}")`,
          output: `  push a: ['a']
  push b: ['a', 'b']
  push c: ['a', 'b', 'c']
  pop c: ['a', 'b']
  pop b: ['a']
  pop a: []

  '([]{})'   balanced: True
  '([)]'     balanced: False
  '('        balanced: False
  ''         balanced: True
  '))'       balanced: False`,
          explanation:
            "Bracket matching is the canonical stack problem because the requirement *is* the stack's semantics: the bracket that must close next is always the most recent unclosed one. Note the three failure modes are all handled and each needs a different check — wrong type on `([)]`, leftovers on `(`, and an empty stack on `))`. Forgetting the last one is the standard bug, and it crashes rather than returning false.",
        },
      ],
    },
    {
      id: "recognising",
      heading: "Recognising which one",
      body: [
        "**Reach for a stack when** the problem involves nesting, matching, undo, or the phrase \"the most recent…\". Bracket validation, expression evaluation, iterative tree traversal, the next-greater-element family, and monotonic-stack problems all live here. **Recursion is a stack** — every recursive algorithm can be rewritten with an explicit one, and that is how you avoid stack overflow on deep inputs.",
        "**Reach for a queue when** items are processed in arrival order or when exploring level by level. Breadth-first search is the big one: BFS finds shortest paths in an unweighted graph precisely because the queue guarantees you finish everything at distance k before starting distance k + 1.",
        "**Reach for a deque when** you need both ends. The sliding-window maximum is the classic — a monotonic deque that pushes at the back and pops from both ends, giving O(n) for a problem that looks like it needs O(n × k).",
      ],
    },
    {
      id: "the-quadratic-queue",
      heading: "The quadratic queue",
      body: [
        "The single most common performance mistake in this topic: **using a list as a queue.**",
        "`queue.append(x)` and `queue.pop(0)` implement a queue correctly. But `pop(0)` removes from the front, which shifts every remaining element down one — O(n). Doing that n times is **O(n²)**.",
        "A `deque` stores its data in linked blocks, so both ends are O(1) and no shifting happens at all. In Java, `ArrayDeque` uses a circular buffer with head and tail indices, which achieves the same thing.",
        "The fix is one import and costs nothing: `from collections import deque`. Write it by reflex in every BFS.",
      ],
      examples: [
        {
          id: "deque",
          title: "The cost, and the deque's extra tricks",
          lang: "python",
          code: `from collections import deque


def shifts_for_list_popleft(n):
    """Removing from the front of a list shifts everything after it."""
    return sum(range(1, n))


print(f"{'n':>7}  {'list pop(0) shifts':>19}  {'deque popleft shifts':>21}")
for n in (100, 1_000, 10_000):
    print(f"{n:>7}  {shifts_for_list_popleft(n):>19,}  {0:>21}")

print()
d = deque([1, 2, 3])
d.append(4)
d.appendleft(0)
print("after appends both ends:", list(d))
print("popleft:", d.popleft(), " pop:", d.pop(), " ->", list(d))
d.rotate(1)
print("rotate(1):", list(d))

bounded = deque(maxlen=3)
for x in range(6):
    bounded.append(x)
print("maxlen=3 keeps the last three:", list(bounded))`,
          output: `      n   list pop(0) shifts   deque popleft shifts
    100                4,950                      0
   1000              499,500                      0
  10000           49,995,000                      0

after appends both ends: [0, 1, 2, 3, 4]
popleft: 0  pop: 4  -> [1, 2, 3]
rotate(1): [3, 1, 2]
maxlen=3 keeps the last three: [3, 4, 5]`,
          explanation:
            "Fifty million element shifts to drain a ten-thousand-item queue, against none. Two extras worth knowing: `rotate` shifts every element around in O(k), which is a cleaner rotation than the three-reversal trick when a deque is already in hand, and `maxlen` makes a **bounded** deque that discards from the other end automatically — a sliding window of the last k items with no bookkeeping.",
        },
      ],
      pitfalls: [
        {
          title: "Indexing into the middle of a deque",
          body: "`d[0]` and `d[-1]` are O(1), but `d[n // 2]` is O(n), because a deque is a chain of blocks rather than one array. It is the mirror image of the list's problem. If you need both fast middle access and fast front removal, you need a different structure — usually two stacks, or an index into a list you never actually shrink.",
        },
      ],
    },
    {
      id: "java-side",
      heading: "In Java",
      body: [
        "`ArrayDeque` is the answer for both roles, and the method names differ by which role you are playing.",
        "**As a stack:** `push`, `pop`, `peek` — all operating on the head.",
        "**As a queue:** `offer`, `poll`, `peek` — adding at the tail and removing from the head.",
        "**As a deque:** `addFirst`, `addLast`, `pollFirst`, `pollLast`.",
        "Every operation has two forms: one that returns a sentinel on an empty collection (`poll`, `peek` return null) and one that throws (`remove`, `element`). Prefer the null-returning ones in loop conditions and the throwing ones when empty means a bug.",
      ],
      examples: [
        {
          id: "java-deque",
          title: "One class, three roles",
          lang: "java",
          code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(1); stack.push(2); stack.push(3);
        System.out.println("stack top: " + stack.peek() + " " + stack);
        System.out.println("pop: " + stack.pop() + " -> " + stack);

        Deque<Integer> queue = new ArrayDeque<>();
        queue.offer(1); queue.offer(2); queue.offer(3);
        System.out.println("queue head: " + queue.peek() + " " + queue);
        System.out.println("poll: " + queue.poll() + " -> " + queue);

        Deque<Integer> d = new ArrayDeque<>(List.of(1, 2, 3));
        d.addFirst(0); d.addLast(4);
        System.out.println("deque: " + d);
        System.out.println("both ends: " + d.pollFirst() + " " + d.pollLast() + " -> " + d);

        Queue<Integer> empty = new ArrayDeque<>();
        System.out.println("poll on empty: " + empty.poll());
        try {
            empty.remove();
        } catch (NoSuchElementException e) {
            System.out.println("remove on empty throws: " + e.getClass().getSimpleName());
        }
    }
}`,
          output: `stack top: 3 [3, 2, 1]
pop: 3 -> [2, 1]
queue head: 1 [1, 2, 3]
poll: 1 -> [2, 3]
deque: [0, 1, 2, 3, 4]
both ends: 0 4 -> [1, 2, 3]
poll on empty: null
remove on empty throws: NoSuchElementException`,
          explanation:
            "The stack prints as `[3, 2, 1]` because `push` adds at the *head* and iteration goes head-first — top of stack first, which is the sensible order and the opposite of the legacy `Stack` class. That difference alone breaks code ported between the two. One restriction to remember: **`ArrayDeque` rejects null elements**, so it cannot be used where null is a meaningful value; `LinkedList` allows them, at the cost of everything else.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When would you use a stack rather than a queue?",
      answer:
        "When the problem is about nesting, matching, undo, or \"the most recent unresolved thing\" — bracket validation, expression evaluation, iterative tree traversal, next-greater-element. A queue is for arrival order and level-by-level exploration: breadth-first search finds shortest paths in an unweighted graph precisely because the queue guarantees everything at distance k is processed before anything at distance k + 1. Recursion is itself a stack, which is how you convert a deep recursion into an iterative loop.",
    },
    {
      question: "Why shouldn't you use a list as a queue?",
      answer:
        "Because removing from the front shifts every remaining element down one, so `pop(0)` is O(n) and n of them are O(n²) — draining a 10,000-item queue costs about fifty million element moves. A `deque` stores data in linked blocks so both ends are O(1), and Java's `ArrayDeque` uses a circular buffer with head and tail indices for the same effect. The cost of the fix is one import, so write `deque` by reflex in every BFS.",
    },
    {
      question: "What is a deque and when do you need one?",
      answer:
        "A double-ended queue: insert and remove at either end in O(1). It subsumes both a stack and a queue, which is why `ArrayDeque` implements both in Java. You need one specifically when an algorithm touches both ends — the classic is sliding-window maximum, where a monotonic deque pushes at the back and pops from both ends to give O(n) for a problem that looks like O(n × k). The trade is that indexing into the middle is O(n).",
    },
  ],
  takeaways: [
    "A stack and a queue are sequences defined by what they refuse — no access to the middle",
    "Stack for nesting, matching, undo, \"most recent\"; queue for arrival order and BFS",
    "Bracket matching needs three checks: wrong type, leftovers, and an empty stack on a closer",
    "`list.pop(0)` is O(n), making a list-backed queue O(n²) overall",
    "`collections.deque` and `ArrayDeque` give O(1) at both ends",
    "`deque(maxlen=k)` is a self-trimming sliding window; `rotate` shifts in O(k)",
    "Indexing the middle of a deque is O(n) — the mirror of the list's weakness",
    "Java: `push`/`pop` for stacks, `offer`/`poll` for queues; `ArrayDeque` rejects nulls",
  ],
};
