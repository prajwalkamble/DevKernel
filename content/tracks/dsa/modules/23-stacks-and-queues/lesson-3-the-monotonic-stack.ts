import type { Lesson } from "@/content/types";

export const monotonicStackLesson: Lesson = {
  id: "dsa-sq-monotonic",
  slug: "the-monotonic-stack",
  moduleSlug: "stacks-and-queues",
  title: "The Monotonic Stack",
  summary:
    "A stack kept sorted by discarding anything the new element dominates. It answers \"the next element greater than this one\" for every index in a single pass — and the nested while loop is still linear.",
  estimatedMinutes: 35,
  objectives: [
    "Write next-greater-element in one pass",
    "Give the amortised argument for the nested loop",
    "Choose the four variants by direction and strictness",
    "Recognise the problems this pattern solves",
  ],
  sections: [
    {
      id: "the-idea",
      heading: "Keep only what can still win",
      body: [
        "The question is: for each element, what is the next element to its right that is larger?",
        "The brute force scans right from every index — O(n²). The insight that removes the inner scan is about **which elements are still waiting for an answer**.",
        "Walk left to right, keeping a stack of indices whose answer is still unknown. When a new element arrives, it is the answer for every waiting element smaller than it — so pop them and record it. Then push the new index.",
        "The elements left on the stack are always in decreasing order of value, because anything smaller than the incoming element was just removed. That property is the name: a **monotonic** stack.",
        "The reason it is one pass rather than n passes: an element that has been answered never needs looking at again, and an element still waiting is, by construction, larger than everything above it — so a single incoming value resolves a whole run at once.",
      ],
      examples: [
        {
          id: "next-greater",
          title: "Next greater element, and the same loop counting days",
          lang: "python",
          code: `def next_greater(nums):
    """For each index, the next element to its right that is larger."""
    out = [-1] * len(nums)
    stack = []                      # holds indices, values strictly decreasing
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            out[stack.pop()] = x
        stack.append(i)
    return out

print(next_greater([2, 1, 2, 4, 3]))
print(next_greater([5, 4, 3, 2]))
print(next_greater([1, 2, 3]))

def daily_temperatures(temps):
    out = [0] * len(temps)
    stack = []
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            j = stack.pop()
            out[j] = i - j
        stack.append(i)
    return out

print(daily_temperatures([73, 74, 75, 71, 69, 72, 76, 73]))`,
          output: `[4, 2, 4, -1, -1]
[-1, -1, -1, -1]
[2, 3, -1]
[1, 1, 4, 2, 1, 1, 0, 0]`,
          explanation:
            "The two functions are the **same loop**. The only difference is what gets recorded: the value that resolved the wait, or the distance to it — which is why the stack holds *indices* rather than values, since a value alone cannot tell you how far away it was. In the strictly decreasing input everything is still waiting at the end, so every answer is the default. Note that `[2,1,2,4,3]` gives index 0 the answer 4, not 2: with `<` in the condition, an equal value does not resolve the wait.",
        },
      ],
      visual: {
        id: "mono-stack-visual",
        kind: "stack",
        title: "Watch the stack stay ordered as elements are discarded",
      },
    },
    {
      id: "amortised",
      heading: "Why the nested loop is still O(n)",
      body: [
        "The code has a `while` inside a `for`, which reads as O(n²). It is O(n), and the argument is one sentence: **each index is pushed exactly once and popped at most once**, so the total number of pops across the whole run is at most n.",
        "The inner loop can run many times on one iteration — a large value arriving after a long descending run clears the lot — but that is work *paid for* by the pushes that put them there. The total is bounded by the total number of pushes, which is n.",
        "This is the same amortised argument as the two-stack queue, and it is worth having ready, because \"isn't that O(n²)?\" is the standard interview follow-up when you write this loop. Answering it crisply is most of the value of knowing the pattern.",
        "The general form: when a nested loop's iterations each consume something that was produced a bounded number of times, the total is linear regardless of how uneven the individual iterations are.",
      ],
      pitfalls: [
        {
          title: "Storing values instead of indices",
          body: "The stack should hold indices. Distances, widths and the positions to write answers into all need the index; the value can always be recovered from it, but not the reverse. Every variant that asks 'how far' rather than 'what' requires this.",
        },
        {
          title: "Getting < and <= backwards",
          body: "`<` treats an equal element as not resolving the wait, so ties are answered by a strictly greater element later. `<=` resolves on equality. Which is right depends on the problem, and duplicates are the only inputs that expose the difference — so the test that catches it is one with repeats.",
        },
        {
          title: "Forgetting the elements left on the stack",
          body: "At the end, whatever remains has no answer. Either pre-fill the output with the default, as here, or drain the stack afterwards. Pre-filling is less code and harder to get wrong.",
        },
        {
          title: "Assuming a second pass is needed for the previous-smaller variant",
          body: "The same loop with the comparison flipped gives previous-smaller, and it is available for free as `stack[-1]` at push time — the element below the one being pushed is its previous smaller. Many problems need both directions, and noticing that halves the work.",
        },
      ],
    },
    {
      id: "four-variants",
      heading: "The four variants",
      body: [
        "Two independent choices — **direction** and **which comparison** — give four templates, and every problem in this family is one of them.",
        "**Next greater** — iterate left to right, pop while the stacked value is smaller.",
        "**Next smaller** — left to right, pop while the stacked value is larger.",
        "**Previous greater** — either iterate right to left with the next-greater loop, or read `stack[-1]` before pushing.",
        "**Previous smaller** — the mirror.",
        "Two practical notes. **Circular arrays** — Next Greater Element II wraps around — are handled by iterating twice over the array modulo n, pushing only on the first pass. And **previous** variants are usually free: at the moment you push index `i`, whatever sits below it on the stack is exactly its previous smaller (or greater) element, so recording it costs one line and no extra pass.",
        "That second point is what makes Largest Rectangle in a Histogram work in a single pass, which is the next lesson.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Next greater element for every index in O(n) — how?",
      answer:
        "One pass with a stack of indices whose answer is still unknown, kept in decreasing order of value. Each new element resolves and pops every smaller waiting index, then is pushed itself. Indices still on the stack at the end have no greater element to their right.",
    },
    {
      question: "There's a while loop inside a for loop — isn't that O(n²)?",
      answer:
        "No. Each index is pushed once and popped at most once, so total pops are bounded by n. An individual iteration can pop many elements, but that work was paid for by the pushes that put them there. The whole pass is O(n).",
    },
    {
      question: "How do you handle the circular version?",
      answer:
        "Iterate 2n times using `i % n` for indexing, but only push during the first n iterations. The second pass resolves the indices still waiting by letting them see the elements that wrap around before them.",
    },
  ],
  takeaways: [
    "Discard anything the new element dominates — what remains is monotonic",
    "Each index is pushed once and popped once, so the pass is O(n)",
    "Store indices, not values — distances and widths need them",
    "< versus <= only shows up on duplicates; pick deliberately",
    "Pre-fill the output with the default for whatever is left on the stack",
    "The previous-smaller answer is free at push time, below the new index",
  ],
  status: "available",
};
