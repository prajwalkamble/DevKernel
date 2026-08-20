import type { Lesson } from "@/content/types";

export const fastAndSlowLesson: Lesson = {
  id: "dsa-ll-fast-slow",
  slug: "fast-and-slow-pointers",
  moduleSlug: "linked-lists",
  title: "Fast and Slow Pointers",
  summary:
    "Two cursors moving at different speeds turn three separate questions — the middle, the nth from the end, is there a cycle — into one pass with no extra memory.",
  estimatedMinutes: 30,
  objectives: [
    "Find the middle of a list in one pass",
    "Find the nth node from the end with a gap of n",
    "Detect a cycle with Floyd's algorithm",
    "Say which middle you get for an even-length list, and adjust it",
  ],
  sections: [
    {
      id: "the-idea",
      heading: "One pass instead of two",
      body: [
        "The obvious way to find the middle is to count the length, then walk half of it. Two passes, and it needs the length.",
        "Instead, run two cursors: `slow` moves one node per step, `fast` moves two. When `fast` runs off the end, `slow` is at the middle — because it has taken exactly half as many steps.",
        "The same idea with a fixed *gap* rather than a fixed ratio answers a different question. Advance `fast` n nodes first, then move both together; when `fast` hits the end, `slow` is n nodes from it. One pass, no length needed.",
        "And the same idea again detects cycles: if the list loops, the fast cursor eventually laps the slow one and they meet. If it does not, fast reaches the end. There is no third outcome.",
      ],
      examples: [
        {
          id: "middle-and-cycle",
          title: "The middle, and the start of a cycle",
          lang: "python",
          code: `class Node:
    def __init__(self, val, nxt=None):
        self.val, self.next = val, nxt

def build(vals):
    head = None
    for v in reversed(vals):
        head = Node(v, head)
    return head

def middle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow.val

def has_cycle_and_start(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:
            finder = head
            while finder is not slow:
                finder, slow = finder.next, slow.next
            return finder.val
    return None

print("middle of 1..5:", middle(build([1, 2, 3, 4, 5])))
print("middle of 1..6:", middle(build([1, 2, 3, 4, 5, 6])))

# Build 1 -> 2 -> 3 -> 4 -> 5 -> back to 3
head = build([1, 2, 3, 4, 5])
tail = head
while tail.next:
    tail = tail.next
tail.next = head.next.next
print("cycle starts at:", has_cycle_and_start(head))
print("no cycle:       ", has_cycle_and_start(build([1, 2, 3])))`,
          output: `middle of 1..5: 3
middle of 1..6: 4
cycle starts at: 3
no cycle:        None`,
          explanation:
            "For an even-length list this returns the **second** of the two middles — 4 out of 1..6, not 3. Which one you want depends on the problem: to split a list into halves for merge sort you usually want the *first* middle, and you get it by starting `fast = head.next` instead of `head`. Getting this backwards is why a merge sort on a two-element list can recurse forever. The `while fast and fast.next` condition covers both parities and the empty list at once.",
        },
      ],
      visual: {
        id: "cycle-visual",
        kind: "pattern",
        algorithm: "cycle",
        lockAlgorithm: true,
        title: "Floyd's tortoise and hare, meeting inside the loop",
      },
    },
    {
      id: "floyd",
      heading: "Why Floyd's cycle-start argument works",
      body: [
        "Detecting a cycle is easy to believe. Finding **where it starts** looks like magic, and the argument is short enough to reconstruct in an interview.",
        "Let the distance from the head to the cycle start be `a`, and let the meeting point be `b` nodes into the cycle, with the cycle of length `c`.",
        "When they meet, slow has travelled `a + b` and fast has travelled `a + b + k·c` for some whole number of extra laps k. Fast has gone exactly twice as far, so `2(a + b) = a + b + k·c`, which simplifies to **`a + b = k·c`**, and therefore `a = k·c − b`.",
        "Read that last equation as a distance: from the meeting point, walking `k·c − b` steps lands you exactly at the cycle start — you complete the current lap and then k−1 more. And `a` is the distance from the head to the cycle start.",
        "So a cursor from the head and a cursor from the meeting point, both moving one step at a time, **meet at the cycle start**. That is the second loop in the example, and the whole proof is one equation.",
        "The cycle's *length* comes for free too: keep one cursor at the meeting point, walk the other around until they meet again, and count.",
      ],
      pitfalls: [
        {
          title: "Checking fast and fast.next in the wrong order",
          body: "`while fast.next and fast` dereferences a possibly-null `fast` before testing it. The order matters because the conditions short-circuit left to right — `fast` must be checked first.",
        },
        {
          title: "Getting the wrong middle for even lengths",
          body: "Starting both cursors at `head` gives the second middle; starting `fast` at `head.next` gives the first. Merge sort needs the first, so that the list actually splits and the recursion terminates — with the second middle a two-element list splits into zero and two, and recurses forever.",
        },
        {
          title: "Comparing values instead of identity",
          body: "`slow == fast` compares values in languages where `==` is overloaded. Cycle detection needs *the same node*: `is` in Python, `==` on references in Java, pointer comparison in C++. Duplicate values otherwise report a cycle that is not there.",
        },
        {
          title: "Using a set when O(1) space is the point",
          body: "Recording visited nodes in a set detects cycles correctly in O(n) space and is a perfectly good first answer — but the reason this pattern is asked about is the O(1) space. Offer the set, then improve on it.",
        },
      ],
    },
    {
      id: "family",
      heading: "The family",
      body: [
        "**Middle of the list** — the ratio form. Also the first half of palindrome checking and of list merge sort.",
        "**Nth node from the end** — the gap form. With a dummy head, removing it needs no special case even when it is the head itself.",
        "**Linked List Cycle / Cycle II** — detection, then the start via the argument above.",
        "**Happy Number.** Not a list at all: repeatedly summing squared digits produces a sequence that either reaches 1 or cycles, and Floyd's algorithm detects the cycle without storing anything. The clearest demonstration that this pattern is about *any* deterministic successor function, not about nodes.",
        "**Find the Duplicate Number.** An array where `next(i) = nums[i]` forms exactly such a sequence, and the duplicate is the entry point of its cycle. O(1) space with no mutation, which is what makes it a hard problem rather than an easy one.",
        "**Reorder List, palindrome check** — find the middle, reverse the second half, then interleave or compare.",
        "The recognisable signature: a sequence with a deterministic next step, where you need a position defined relative to the end or need to know whether it repeats — and you are not allowed extra memory.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you find the middle of a linked list in one pass?",
      answer:
        "Two cursors from the head, one moving one step and one two. When the fast one runs off the end the slow one is at the middle. For even lengths this gives the second middle; start fast at `head.next` to get the first.",
    },
    {
      question: "Prove that Floyd's algorithm finds the cycle's start.",
      answer:
        "With `a` from head to cycle start, `b` into the cycle at the meeting point and cycle length `c`: slow travelled a+b, fast travelled twice that, so 2(a+b) = a+b+k·c, giving a+b = k·c and a = k·c−b. So walking a steps from the meeting point lands on the cycle start — which is why a cursor from the head and one from the meeting point, moving in lockstep, meet exactly there.",
    },
    {
      question: "Find the Duplicate Number without modifying the array — why fast/slow?",
      answer:
        "Treating `i -> nums[i]` as a successor function makes the array a sequence with a cycle, and the duplicate value is the node two indices point into — the cycle's entry. Floyd's algorithm finds it in O(n) time and O(1) space without writing to the array.",
    },
  ],
  takeaways: [
    "Ratio 2:1 finds the middle; a fixed gap finds the nth from the end",
    "`while fast and fast.next` handles both parities and the empty list",
    "Even length gives the second middle unless you offset fast by one",
    "a + b = k·c is the whole cycle-start proof",
    "Compare node identity, not values",
    "The pattern applies to any deterministic successor, not just lists",
  ],
  status: "available",
};
