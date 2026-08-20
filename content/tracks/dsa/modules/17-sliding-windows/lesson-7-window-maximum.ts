import type { Lesson } from "@/content/types";

export const windowMaximumLesson: Lesson = {
  id: "dsa-sw-max",
  slug: "when-the-state-needs-more-than-a-counter",
  moduleSlug: "sliding-windows",
  title: "When the State Needs More Than a Counter",
  summary:
    "Sliding window maximum is the problem that shows the pattern's limit. Removal is not O(1), a heap is not enough either, and the fix — a deque that throws away elements it can prove will never be the answer — is worth meeting here.",
  estimatedMinutes: 30,
  objectives: [
    "Say why a maximum cannot be maintained by add-and-remove",
    "Explain why a plain heap does not fix it",
    "Describe the monotonic deque and its invariant",
    "Justify the amortised O(n) bound",
  ],
  sections: [
    {
      id: "the-obstacle",
      heading: "Why the maximum resists",
      body: [
        "A sum survives removal because subtraction undoes addition. A maximum does not: if the element leaving *is* the maximum, the new maximum could be any of the remaining `k - 1` values, and nothing you kept tells you which.",
        "Rescanning the window is O(k) per step, so the whole algorithm is O(n·k) — precisely the cost the pattern exists to avoid.",
      ],
    },
    {
      id: "heap-not-enough",
      heading: "Why a heap is not the answer",
      body: [
        "The instinct is a max-heap. It gives the maximum in O(1) and insertion in O(log k) — but **deleting an arbitrary element**, which is what a window needs, is O(k) in a binary heap because you must first find it.",
        "The usual workaround is *lazy deletion*: push `(value, index)` and, when reading the top, discard entries whose index has fallen out of the window. That works and is O(n log n), which is a perfectly good answer and often accepted. It is not optimal.",
      ],
    },
    {
      id: "deque",
      heading: "The monotonic deque",
      body: [
        "Keep a deque of **indices** whose values are in decreasing order. Two rules maintain it:",
        "**Before pushing index `i`**, pop from the back while the value there is `<= a[i]`. Those elements can never be the maximum again — `a[i]` is both larger and stays in the window longer, so it dominates them on both counts. This is an exchange argument, the same shape as the two-pointer proofs.",
        "**Before reading the front**, pop it if its index has fallen out of the window.",
        "The front is then always the window's maximum, in O(1).",
        "**Why it is O(n):** every index is pushed exactly once and popped at most once, so the total work across the whole run is at most `2n` deque operations — the same amortised argument as the variable window's `left` pointer. The inner `while` looks alarming and costs nothing overall.",
      ],
      pitfalls: [
        {
          title: "Storing values instead of indices",
          body: "You need the index to know when an element leaves the window. Storing bare values makes the expiry check impossible, and it is the first thing people write.",
        },
        {
          title: "`<=` against `<` when popping the back",
          body: "With `<=`, equal values are evicted, so the deque holds one entry per distinct value and stays smaller. With `<`, duplicates are kept, which is also correct — both give the right maximum. The difference matters only for the *minimum*-tracking variant used in \"longest subarray with bounded difference\", where keeping duplicates is what makes the two deques agree on when to shrink.",
        },
      ],
    },
    {
      id: "other-states",
      heading: "The other heavy states",
      body: [
        "**Median of a sliding window** — two heaps, a max-heap for the lower half and a min-heap for the upper, kept balanced, with lazy deletion for elements leaving. O(n log k).",
        "**Window maximum *and* minimum together** — two monotonic deques, one decreasing and one increasing. This solves \"longest subarray where max minus min is at most limit\" in O(n), which is otherwise a hard problem.",
        "**k-th largest in the window** — an order-statistic tree or a balanced BST; in C++ a policy-based tree, in Java a `TreeMap` with counts.",
        "The recognition rule: if the quantity you need is an *order statistic* of the window rather than an aggregate of it, the plain window is not enough.",
      ],
    },
  ],
  takeaways: [
    "A maximum cannot be maintained by add-and-remove — removal loses information",
    "A heap gives O(n log n) with lazy deletion, which is good but not optimal",
    "A monotonic deque of indices, decreasing in value, gives O(1) queries",
    "Pop the back while it is dominated: smaller *and* expiring sooner",
    "Every index is pushed and popped once, so it is O(n) amortised",
    "Store indices, not values, so expiry is checkable",
    "Order statistics of a window need a heavier structure than an aggregate does",
  ],
  status: "available",
};
