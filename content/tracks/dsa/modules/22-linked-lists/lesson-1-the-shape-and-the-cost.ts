import type { Lesson } from "@/content/types";

export const shapeAndCostLesson: Lesson = {
  id: "dsa-ll-shape",
  slug: "the-shape-and-the-real-cost",
  moduleSlug: "linked-lists",
  title: "The Shape, and the Real Cost",
  summary:
    "O(1) insertion is the headline and it is conditional on already standing at the right node. That condition is why arrays beat linked lists nearly everywhere outside interviews.",
  estimatedMinutes: 30,
  objectives: [
    "State the cost of each operation on singly, doubly and circular lists",
    "Explain why O(1) insertion rarely helps in practice",
    "Describe why cache behaviour dominates the asymptotic comparison",
    "Choose a list over an array for the few cases where it wins",
  ],
  sections: [
    {
      id: "the-shape",
      heading: "Nodes and links",
      body: [
        "A linked list is a chain of nodes, each holding a value and a reference to the next. There is no contiguous block and no index arithmetic — to reach the fifth element you follow four references.",
        "**Singly linked** — one `next` per node. Insert and delete after a known node are O(1). You cannot walk backwards.",
        "**Doubly linked** — `next` and `prev`. Deletion of a *given* node becomes O(1) without needing its predecessor, which is the property an LRU cache is built on. Costs an extra reference per node and twice the pointer updates.",
        "**Circular** — the last node points back at the first. Useful for round-robin scheduling and ring buffers, and the reason every traversal needs a termination rule that is not `while node`.",
      ],
      examples: [
        {
          id: "insert-delete",
          title: "Insertion and deletion, once you are standing there",
          lang: "python",
          code: `class Node:
    def __init__(self, val, nxt=None):
        self.val = val
        self.next = nxt

def build(values):
    head = None
    for v in reversed(values):
        head = Node(v, head)
    return head

def show(head):
    out = []
    while head:
        out.append(head.val)
        head = head.next
    return " -> ".join(map(str, out)) + " -> None"

head = build([1, 2, 3, 4])
print(show(head))

# Insert 9 after the node holding 2 — O(1) once you are standing there.
node = head.next
node.next = Node(9, node.next)
print(show(head))

# Delete the node after 1 — also O(1), and also needs the *previous* node.
head.next = head.next.next
print(show(head))`,
          output: `1 -> 2 -> 3 -> 4 -> None
1 -> 2 -> 9 -> 3 -> 4 -> None
1 -> 9 -> 3 -> 4 -> None`,
          explanation:
            "Both operations are two reference assignments — genuinely O(1). Note what the deletion needed: the node *before* the one being removed. In a singly linked list you can never delete a node you are standing on without help, and that asymmetry is behind a whole family of interview questions. `build` walks the values in reverse because prepending is the only O(1) way to construct a list front-to-back.",
        },
      ],
      visual: {
        id: "ll-visual",
        kind: "linked-list",
        title: "Nodes, links, and what insertion actually rewires",
      },
    },
    {
      id: "the-catch",
      heading: "Why arrays win anyway",
      body: [
        "The comparison people memorise says insertion is O(1) for a list and O(n) for an array. Both halves are true and the conclusion drawn from them is usually wrong.",
        "**The O(1) is conditional.** It is O(1) *given a reference to the position*. Getting that reference costs O(n), because there is no index arithmetic. Inserting at a position you have to find first is O(n) either way — and the array's O(n) is a `memmove`, which modern hardware does at billions of bytes per second, while the list's O(n) is a pointer chase.",
        "**Cache behaviour dominates.** An array is contiguous, so walking it pulls in a cache line at a time and the prefetcher predicts the next one. List nodes are scattered across the heap, so each step is a potential cache miss — a hundred-odd cycles against roughly one. A linear scan of a list can be an order of magnitude slower than the same scan of an array holding the same data.",
        "**The overhead per element is real.** Each node carries a reference — eight bytes on a 64-bit machine, sixteen for a doubly linked list — plus allocator bookkeeping. Storing a million integers can cost several times what the array costs.",
        "This is why `std::list` is rare in production C++, why Java's `LinkedList` is a punchline, and why the honest answer to \"array or linked list?\" is nearly always the array. What the list retains is a genuinely O(1) splice given the node, and stable references that survive insertion — which is exactly what an LRU cache needs.",
      ],
      pitfalls: [
        {
          title: "Quoting O(1) insertion without the precondition",
          body: "It is O(1) given a reference to the position. Say the precondition out loud — an interviewer asking \"array or linked list\" is usually testing whether you know that the O(n) search dominates, not whether you can recite the table.",
        },
        {
          title: "Expecting indexed access",
          body: "`list.get(i)` on Java's `LinkedList` is O(i). A `for (int i = 0; i < list.size(); i++) list.get(i)` loop over a linked list is O(n²) and looks exactly like the O(n) array version. Iterate with an iterator or a node reference.",
        },
        {
          title: "Losing the head",
          body: "Advancing the variable that holds the head loses the list — nothing else refers to it. Walk with a separate cursor, and keep the head untouched unless you deliberately mean to move it.",
        },
        {
          title: "Assuming a circular list terminates",
          body: "`while node:` never ends on a circular list. Terminate on returning to the starting node, and be careful that the check happens after at least one step or the loop never runs at all.",
        },
      ],
    },
    {
      id: "when-to-use",
      heading: "When a list is genuinely right",
      body: [
        "**When you already hold the node.** An LRU cache holds a map from key to node, so moving a node to the front is O(1) with no search. This is the case that justifies the structure, and it is why the map is not optional.",
        "**When references must stay valid.** A vector reallocating invalidates every pointer into it; list nodes do not move. Intrusive lists in kernels and allocators rely on this.",
        "**When splicing whole ranges.** Moving a run of elements between lists is a constant number of pointer updates regardless of length.",
        "**When you are building another structure.** Hash table chains, adjacency lists, free lists in allocators and the queue behind a scheduler are all linked lists wearing another name.",
        "Outside these, reach for a dynamic array. In interviews, however, the list is everywhere — because pointer manipulation is where sloppy reasoning becomes visible immediately, which is the honest reason this module exists.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Array or linked list?",
      answer:
        "Array, nearly always. The list's O(1) insertion assumes you already have a reference to the position; finding it is O(n), and the array's O(n) shift is a memmove that hardware does far faster than a pointer chase. Arrays also win decisively on cache locality and per-element overhead. The list wins when you already hold the node, when references must stay valid across insertion, or when splicing ranges.",
    },
    {
      question: "Why is deleting a node from a singly linked list awkward?",
      answer:
        "Deletion rewires the *previous* node's `next`, and a singly linked node cannot reach its predecessor. You either track the previous node while traversing, use a dummy head so the first node has one, or — given only the node to delete and no access to the head — copy the next node's value into it and delete the next one instead.",
    },
    {
      question: "What does a doubly linked list buy for the extra pointer?",
      answer:
        "O(1) deletion of a node you hold, without needing its predecessor, and backward traversal. That first property is what makes it the right half of an LRU cache.",
    },
  ],
  takeaways: [
    "O(1) insertion is conditional on already holding the position",
    "Cache locality usually makes the array faster despite the worse bound",
    "A singly linked node cannot reach its predecessor",
    "Doubly linked buys O(1) deletion of a node you hold",
    "Lists win for splicing, stable references, and as building blocks",
    "list.get(i) in a loop is a quiet O(n²)",
  ],
  status: "available",
};
