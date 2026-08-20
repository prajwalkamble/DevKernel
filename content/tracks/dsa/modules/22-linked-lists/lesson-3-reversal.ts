import type { Lesson } from "@/content/types";

export const reversalLesson: Lesson = {
  id: "dsa-ll-reversal",
  slug: "reversal-iteratively-and-recursively",
  moduleSlug: "linked-lists",
  title: "Reversal",
  summary:
    "Three pointers and a loop. It is the most-asked linked list question, it is a component of half the others, and the only thing to get right is saving the next reference before you overwrite it.",
  estimatedMinutes: 30,
  objectives: [
    "Write the iterative reversal from memory",
    "Explain why `nxt` must be saved before rewiring",
    "Write and reason about the recursive form",
    "Reverse a sublist between two positions",
  ],
  sections: [
    {
      id: "iterative",
      heading: "The iterative form",
      body: [
        "Walk the list, and as you pass each node, point it back at the one before. Three variables: `prev` (the reversed part behind you), `head` (where you are), and `nxt` (saved, because you are about to destroy the link that would have taken you there).",
        "That save is the entire difficulty. `head.next = prev` overwrites the only reference to the rest of the list, so if you have not stored it first, the remainder is unreachable — the loop terminates immediately and returns a one-element list.",
        "At the end `head` is null and `prev` is the new head. Returning `head` gives you null, which is the other classic slip.",
      ],
      examples: [
        {
          id: "both-forms",
          title: "Both forms, and the edge cases",
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

def reverse_iterative(head):
    prev = None
    while head:
        nxt = head.next        # save it before you destroy it
        head.next = prev
        prev = head
        head = nxt
    return prev

def reverse_recursive(head):
    if head is None or head.next is None:
        return head
    new_head = reverse_recursive(head.next)
    head.next.next = head      # the node after me should point back at me
    head.next = None
    return new_head

print(to_list(reverse_iterative(build([1, 2, 3, 4, 5]))))
print(to_list(reverse_recursive(build([1, 2, 3, 4, 5]))))
print(to_list(reverse_iterative(build([1]))))
print(to_list(reverse_iterative(build([]))))`,
          output: `[5, 4, 3, 2, 1]
[5, 4, 3, 2, 1]
[1]
[]`,
          explanation:
            "The iterative version handles the empty list without a special case: `prev` starts as None and the loop never runs, so None comes back. The recursive version's base case covers both empty and single-node. The line worth staring at is `head.next.next = head` — at that point `head.next` is the node that *used to* follow, and after the recursive call it is the **tail** of the reversed remainder, so pointing its `next` at `head` appends `head` to the end. Setting `head.next = None` immediately after is what stops the list from containing a two-node cycle.",
        },
      ],
      visual: {
        id: "ll-reverse-visual",
        kind: "linked-list",
        title: "Follow the links as they flip, one node at a time",
      },
    },
    {
      id: "recursive",
      heading: "The recursive form, and its cost",
      body: [
        "The recursive version is shorter and much easier to get subtly wrong. Its logic: reverse everything after me, then make the node that used to follow me point back at me.",
        "It is O(n) time and **O(n) stack**, which matters — a list of a million nodes overflows. The iterative version is O(1) space and is what you should write unless asked for the recursion specifically.",
        "It is worth being able to write both, because \"now do it recursively\" is a standard follow-up and because the recursive shape generalises to problems the iterative one does not — reversing in groups of k, for instance, reads much more naturally as a recursion.",
        "The mental model that makes it click: trust the recursive call completely. After `reverse_recursive(head.next)` returns, everything after `head` is already reversed and `head.next` is now pointing at the **last** node of that reversed section. Two assignments finish the job.",
      ],
      pitfalls: [
        {
          title: "Overwriting next before saving it",
          body: "`head.next = prev` first, then trying to advance with `head = head.next` — which now walks backwards into the part you already reversed, usually producing an infinite loop or a one-element list. Save first, always.",
        },
        {
          title: "Returning head instead of prev",
          body: "The loop ends when `head` is null. `prev` holds the new head. Returning `head` returns null, and the test reports an empty list for every input.",
        },
        {
          title: "Forgetting head.next = None in the recursion",
          body: "Without it the original head still points forward at the node now pointing back at it — a two-node cycle. `to_list` then never terminates, which is a memorable way to discover the bug.",
        },
        {
          title: "Reversing when you only needed to read backwards",
          body: "If the goal is to compare a list with its reverse — palindrome checking — you can reverse only the second half, compare, and restore. Reversing the whole list mutates the caller's data, which some problems explicitly forbid.",
        },
      ],
    },
    {
      id: "variants",
      heading: "The variants",
      body: [
        "**Reverse a sublist** between positions m and n. Use a dummy head, walk to the node before m, then do a standard reversal for n − m steps and reconnect the three pieces. The reconnection is the fiddly part: keep a reference to the node before m and to the node that was at m, because that one becomes the tail of the reversed section.",
        "**Reverse in groups of k.** Check that k nodes remain, reverse them, recurse on the rest and attach. If fewer than k remain, most versions of the problem leave them alone — read the statement, both variants exist.",
        "**Swap pairs.** Reversal in groups of two, and usually cleaner written directly with a dummy head.",
        "**Palindrome list.** Find the middle with fast/slow, reverse the second half, compare, then restore. O(1) space, and the restore step is what distinguishes a careful answer.",
        "**Add two numbers, reversed.** When digits are stored least significant first, no reversal is needed at all — recognising that is the whole trick.",
        "In every one of these, the reversal itself is the four lines you already know. The problem is the bookkeeping around it, which is why a dummy head shows up in nearly all of them.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Reverse a linked list — what is the core of it?",
      answer:
        "Three pointers. Save `next`, point the current node at `prev`, then advance both. Return `prev`, which holds the new head when the walk ends. O(n) time, O(1) space.",
    },
    {
      question: "What is the recursive version's drawback?",
      answer:
        "O(n) stack depth, so it overflows on long lists. It is more elegant and generalises better to group reversal, but the iterative form is the one to write by default.",
    },
    {
      question: "How do you check whether a list is a palindrome in O(1) space?",
      answer:
        "Fast/slow pointers to find the middle, reverse the second half in place, compare the halves node by node, then reverse the second half back so the caller's list is unchanged. Restoring is the step that distinguishes a careful implementation.",
    },
  ],
  takeaways: [
    "Save next before overwriting it — that is the whole difficulty",
    "Return prev, not head",
    "Iterative is O(1) space; recursive is O(n) stack",
    "head.next.next = head appends the current node to the reversed tail",
    "Forgetting head.next = None leaves a two-node cycle",
    "Sublist and group reversal are the same four lines plus bookkeeping",
  ],
  status: "available",
};
