import type { Lesson } from "@/content/types";

export const mergingAndSortingLesson: Lesson = {
  id: "dsa-ll-merge",
  slug: "merging-partitioning-and-sorting",
  moduleSlug: "linked-lists",
  title: "Merging, Partitioning and Sorting",
  summary:
    "Merge sort is the natural sort for a linked list — no random access needed, no extra array, and the splitting step is the fast/slow pointer you already have.",
  estimatedMinutes: 30,
  objectives: [
    "Merge two sorted lists with a dummy head and a tail cursor",
    "Explain why merge sort suits lists and quicksort does not",
    "Split a list correctly, and say why the cut matters",
    "Partition a list around a value while preserving relative order",
  ],
  sections: [
    {
      id: "merging",
      heading: "Merging two sorted lists",
      body: [
        "Walk both lists, always taking the smaller head, and append it to a result built behind a dummy node. When one list runs out, attach the whole remainder of the other — no loop needed, because it is already sorted.",
        "This is where the dummy head and tail cursor pay off most visibly: without them, every append needs a check for \"is the result empty yet?\".",
        "Unlike an array merge, nothing is copied. The result is built entirely from the original nodes, rewired — so the extra space is O(1), not O(n). That is the structural advantage lists have over arrays for merge sort, and it is the reason merge sort is the right choice here.",
      ],
      examples: [
        {
          id: "merge-and-sort",
          title: "Merge, then merge sort",
          lang: "python",
          code: `class Node:
    def __init__(self, val, nxt=None):
        self.val, self.next = val, nxt

def build(vals):
    head = None
    for v in reversed(vals):
        head = Node(v, head)
    return head

def to_list(head):
    out = []
    while head:
        out.append(head.val); head = head.next
    return out

def merge(a, b):
    dummy = Node(0)
    tail = dummy
    while a and b:
        if a.val <= b.val:        # <= keeps equal elements in a's order: stable
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    tail.next = a or b            # one of them is already None
    return dummy.next

def sort_list(head):
    if head is None or head.next is None:
        return head
    slow, fast = head, head.next          # note the offset
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    right = slow.next
    slow.next = None                      # cut, or the recursion never ends
    return merge(sort_list(head), sort_list(right))

print(to_list(merge(build([1, 3, 5]), build([2, 4, 6]))))
print(to_list(merge(build([1, 2]), build([]))))
print(to_list(sort_list(build([4, 2, 1, 3]))))
print(to_list(sort_list(build([-1, 5, 3, 4, 0]))))`,
          output: `[1, 2, 3, 4, 5, 6]
[1, 2]
[1, 2, 3, 4]
[-1, 0, 3, 4, 5]`,
          explanation:
            "Two lines carry the weight. `fast = head.next` offsets the fast cursor so `slow` stops at the **first** of two middles — with `fast = head` a two-element list would put `slow` on the second node, `right` would be empty, and the recursion would split `[4, 2]` into `[4, 2]` and nothing forever. And `slow.next = None` performs the actual cut; without it both halves still run to the end of the original list and the recursion never shrinks.",
        },
      ],
    },
    {
      id: "why-merge-sort",
      heading: "Why merge sort and not quicksort",
      body: [
        "**Merge sort needs only sequential access.** Splitting is a traversal, merging is a traversal. Both are natural on a list.",
        "**Quicksort needs random access** to partition efficiently around a pivot, and choosing a good pivot means indexing into the middle — O(n) on a list. It can be done, and it is worse in every respect.",
        "**Merge sort on a list is O(1) extra space**, unlike on an array. There is no scratch buffer: the merge rewires existing nodes. Only the O(log n) recursion stack remains, and a bottom-up iterative version removes even that.",
        "**Stability comes free** from `<=` rather than `<` in the comparison, which keeps equal elements in the first list's order.",
        "So the usual trade-off between merge sort and quicksort inverts for lists: merge sort keeps its guaranteed O(n log n) and *loses* its space penalty. It is simply the better algorithm here, which is why `sort_list` is the standard answer to \"sort a linked list in O(n log n) and O(1) space\".",
      ],
      pitfalls: [
        {
          title: "Not cutting the list before recursing",
          body: "`slow.next = None` is mandatory. Without it the left half still runs through to the end of the whole list, the halves are not halves, and the recursion never terminates. It is the single most common bug in `sort_list`.",
        },
        {
          title: "Splitting at the wrong middle",
          body: "With `fast = head`, a two-node list leaves `right` empty and recurses forever. `fast = head.next` biases the split so both halves are non-empty for any list of two or more.",
        },
        {
          title: "Using < instead of <= in the merge",
          body: "`<` takes from the second list when values are equal, which reverses the relative order of equal elements and makes the sort unstable. It is one character and it is the difference between a stable sort and an unstable one.",
        },
        {
          title: "Copying into an array, sorting, and rebuilding",
          body: "It works, it is O(n) space, and it sidesteps the entire exercise. Worth mentioning as a baseline, but the question is nearly always asking for the in-place version.",
        },
      ],
    },
    {
      id: "partitioning",
      heading: "Partitioning, and the two-list trick",
      body: [
        "**Partition List** asks you to move all nodes less than x before all nodes greater than or equal to x, preserving relative order within each group.",
        "The clean solution is two dummy heads: build a `less` list and a `greater` list in one pass, then join them. Each node is appended to exactly one of the two, so relative order is automatically preserved.",
        "Two details finish it. Terminate the second list — `greater_tail.next = None` — or the last node still points back into the original chain and you have built a cycle. And join with `less_tail.next = greater_dummy.next`, which handles an empty greater list without a branch.",
        "The same two-list shape solves **Odd Even Linked List** (build the odd-indexed and even-indexed chains, then join) and the digit-grouping pass inside a radix sort on lists. Once you have written it once it is recognisable everywhere.",
        "**Merge k sorted lists** is the natural extension: either merge them pairwise in rounds, which is O(N log k), or keep a min-heap of the k current heads, which is the same complexity and usually the expected answer. Merging them one at a time into an accumulator is O(N·k) and is the trap.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Sort a linked list in O(n log n) — which algorithm and why?",
      answer:
        "Merge sort. It needs only sequential access, which is all a list offers, and unlike on an array it uses O(1) extra space because merging rewires existing nodes rather than copying into a buffer. Quicksort needs random access to pivot well and is worse on every axis here.",
    },
    {
      question: "What are the two easy-to-miss steps in list merge sort?",
      answer:
        "Cutting the list at the split point with `slow.next = None`, without which the halves overlap and the recursion never terminates; and offsetting the fast pointer to `head.next` so a two-node list actually splits into one and one.",
    },
    {
      question: "Merge k sorted lists — what is the complexity?",
      answer:
        "O(N log k) for N total nodes, either by merging pairwise in log k rounds or with a min-heap holding the k current heads. Merging them sequentially into one accumulator is O(N·k), because the accumulator is re-traversed on every merge.",
    },
  ],
  takeaways: [
    "Merge with a dummy head and tail cursor — no branch for the first append",
    "`tail.next = a or b` attaches the whole remainder in one line",
    "Merge sort suits lists: sequential access, O(1) extra space, stable",
    "`slow.next = None` is what makes the recursion terminate",
    "Offset fast to head.next so two-node lists split correctly",
    "Two dummy heads solve partition, odd-even, and radix grouping",
  ],
  status: "available",
};
