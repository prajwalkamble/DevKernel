import type { Lesson } from "@/content/types";

export const linkedListSheetLesson: Lesson = {
  id: "dsa-ll-sheet",
  slug: "the-sheet-linked-lists",
  moduleSlug: "linked-lists",
  title: "The Sheet, and How to Not Get Lost",
  summary:
    "Every list problem in interviews is a composition of five moves. The sheet, plus the habit that stops pointer code from going wrong: draw it, and name what each variable points at before you write the loop.",
  estimatedMinutes: 30,
  objectives: [
    "Recall the five reusable moves and the problems built from them",
    "Adopt a routine that prevents pointer bugs",
    "Enumerate the edge cases every list solution must survive",
  ],
  sections: [
    {
      id: "five-moves",
      heading: "Five moves, and everything else is composition",
      body: [
        "**Dummy head.** Whenever the head might change or you are building a list.",
        "**Reverse.** Three pointers, save before overwriting.",
        "**Fast and slow.** Ratio for the middle, gap for the nth from the end, Floyd for cycles.",
        "**Merge.** Dummy plus tail cursor, take the smaller head.",
        "**Two lists.** Build two chains in one pass and join them.",
        "Reorder List is find-middle, reverse, interleave. Palindrome is find-middle, reverse, compare, restore. Sort List is find-middle, cut, recurse, merge. Group reversal is reverse plus bookkeeping. There is very little in this module that is not one of the five with a wrapper around it.",
        "That is a useful thing to notice when a list problem looks unfamiliar: ask which of the five it decomposes into, rather than trying to invent pointer choreography from scratch.",
      ],
    },
    {
      id: "the-sheet",
      heading: "The sheet",
      body: [
        "**Reverse Linked List** — the base case. Both forms, from memory.",
        "**Middle of the Linked List** — fast and slow, and know which middle you get.",
        "**Linked List Cycle** — Floyd's detection.",
        "**Linked List Cycle II** — and the start, with the a + b = k·c argument.",
        "**Remove Nth Node From End** — the gap form plus a dummy head.",
        "**Merge Two Sorted Lists** — dummy and tail.",
        "**Palindrome Linked List** — middle, reverse, compare, restore.",
        "**Intersection of Two Linked Lists** — the cursor-switching trick.",
        "**Remove Duplicates from Sorted List I and II** — the second needs a dummy head and is much fiddlier than the first; do both back to back.",
        "**Odd Even Linked List** — the two-chain build.",
        "**Partition List** — two dummies, and terminate the second chain.",
        "**Rotate List** — make it circular, then break at the right place.",
        "**Add Two Numbers** — the carry in the loop condition.",
        "**Reorder List** — three moves composed.",
        "**Sort List** — merge sort, with the cut.",
        "**Copy List with Random Pointer** — hash map first, then the interleaving.",
        "**Merge k Sorted Lists** — heap or pairwise, O(N log k).",
        "**Reverse Nodes in k-Group** — the hardest of the standard set.",
        "**LRU Cache** — map plus doubly linked list. Do this one last, and do it twice.",
      ],
    },
    {
      id: "the-habit",
      heading: "The habit that prevents the bugs",
      body: [
        "Pointer code goes wrong in a specific way: you overwrite a link you still needed, and the failure is a silent infinite loop rather than an error. Three habits stop nearly all of it.",
        "**Draw the list, with the pointers as arrows.** Four or five nodes is plenty. Then draw the state you want *after* the operation. The code is the difference between the two pictures, and writing it without drawing them is guessing.",
        "**Name what each variable points at, in words, before writing the loop.** \"`prev` is the last node of the reversed part; `cur` is the node being moved; `nxt` holds the rest.\" If you cannot state it, the loop will not be right, and the sentence usually reveals a missing variable.",
        "**Assign in dependency order.** Before any assignment, ask what still needs the value about to be overwritten. If something does, save it first. That single question is the entire content of \"save `next` before rewiring\".",
        "One more, for interviews specifically: **say the invariant out loud** as you write. \"After each iteration, everything before `cur` is reversed.\" Interviewers are largely assessing whether you reason about pointers or pattern-match on them, and stating the invariant is the clearest evidence of the former.",
      ],
      pitfalls: [
        {
          title: "The edge cases every list solution must survive",
          body: "Empty list. Single node. Two nodes — where fast/slow splits and group reversal both break. The target being the head. The target being the tail. All nodes matching. Run each mentally before saying you are done; between them they catch nearly every list bug.",
        },
        {
          title: "Testing only the happy path",
          body: "A list solution that works on [1,2,3,4,5] and has never been tried on [] or [1] is untested. Those two take five seconds each and are where the bugs are.",
        },
        {
          title: "Losing the head",
          body: "Advancing the head variable rather than a cursor. The list is still in memory and nothing points at its start any more.",
        },
        {
          title: "Building a cycle by accident",
          body: "Failing to terminate a list you constructed — leaving the final node pointing back into the source chain. The symptom is a print or a length check that never returns, which is at least easy to spot.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What edge cases do you check on every linked list problem?",
      answer:
        "Empty, single node, two nodes, target at the head, target at the tail, and all elements matching. Two nodes is the one that catches fast/slow splits and group reversal; the head case is what the dummy head exists for.",
    },
    {
      question: "How do you avoid losing a reference while rewiring?",
      answer:
        "Before every assignment, ask what still needs the value being overwritten, and save it first. Drawing the before and after states makes the dependency order obvious, and the code becomes the difference between the two pictures.",
    },
    {
      question: "Reverse Nodes in k-Group — how do you approach it?",
      answer:
        "Check that k nodes remain; if not, leave the tail as is. Reverse those k with the standard three-pointer loop, keep references to the node before the group and to the group's original head — which becomes its tail — then reconnect and recurse or iterate on the rest. A dummy head removes the first-group special case.",
    },
  ],
  takeaways: [
    "Five moves — dummy, reverse, fast/slow, merge, two chains — compose into everything",
    "Draw before and after; the code is the difference",
    "Name what each pointer refers to before writing the loop",
    "Save anything still needed before you overwrite it",
    "Check empty, one, two, head, tail and all-matching every time",
    "State the invariant out loud — it is what is being assessed",
  ],
  status: "available",
};
