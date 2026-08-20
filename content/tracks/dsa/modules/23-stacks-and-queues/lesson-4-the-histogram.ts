import type { Lesson } from "@/content/types";

export const histogramLesson: Lesson = {
  id: "dsa-sq-histogram",
  slug: "largest-rectangle-and-its-family",
  moduleSlug: "stacks-and-queues",
  title: "Largest Rectangle, and Its Family",
  summary:
    "The hardest standard monotonic-stack problem, and the one that pays off most — because Maximal Rectangle, Trapping Rain Water and several others are it in disguise.",
  estimatedMinutes: 35,
  objectives: [
    "Derive the histogram solution from the previous/next smaller idea",
    "Explain what the sentinel is for",
    "Compute the width correctly after popping",
    "Recognise the problems that reduce to this one",
  ],
  sections: [
    {
      id: "the-reframe",
      heading: "Reframing the question",
      body: [
        "Given bar heights, find the largest axis-aligned rectangle that fits inside the histogram.",
        "The reframe that makes it tractable: **every maximal rectangle has a height equal to some bar**. So instead of searching over rectangles, consider each bar in turn and ask how far the rectangle *of exactly that height* can extend.",
        "That distance is bounded on each side by the first strictly shorter bar. So the answer for bar `i` is `height[i] × (nextSmaller(i) − prevSmaller(i) − 1)`.",
        "Both of those are monotonic-stack queries, and the previous lesson noted that previous-smaller is available for free at push time. So the whole thing is one pass.",
      ],
      examples: [
        {
          id: "histogram",
          title: "One pass, with a sentinel",
          lang: "python",
          code: `def largest_rectangle(heights):
    stack = []                       # indices, heights strictly increasing
    best = 0
    for i, h in enumerate(heights + [0]):     # sentinel flushes the stack
        while stack and heights[stack[-1]] >= h:
            height = heights[stack.pop()]
            left = stack[-1] + 1 if stack else 0
            best = max(best, height * (i - left))
        stack.append(i)
    return best

print(largest_rectangle([2, 1, 5, 6, 2, 3]))
print(largest_rectangle([2, 4]))
print(largest_rectangle([5]))
print(largest_rectangle([3, 3, 3]))`,
          output: `10
4
5
9`,
          explanation:
            "For `[2,1,5,6,2,3]` the answer is 10 — bars 5 and 6 giving height 5 across width 2. The width line is the one to understand: after popping, **the new top of the stack is the previous shorter bar**, so the rectangle starts at `stack[-1] + 1`, and when the stack is empty the bar extends all the way to index 0. The `i` at that moment is the first shorter bar on the right, so `i - left` is the full span. Appending a zero sentinel guarantees every remaining bar gets popped and measured; without it, an increasing histogram like `[2,4]` never flushes and returns 0.",
        },
      ],
      visual: {
        id: "histogram-visual",
        kind: "stack",
        title: "The stack of increasing bars, and what each pop measures",
      },
    },
    {
      id: "the-details",
      heading: "The three details that decide correctness",
      body: [
        "**The sentinel.** Without a trailing zero, bars still on the stack when the loop ends are never measured. Either append the sentinel, as above, or drain the stack afterwards with `i = len(heights)`. The sentinel is fewer lines and one less thing to forget.",
        "**The width after popping.** This is where most implementations go wrong. It is tempting to use the popped index as the left edge, but the rectangle extends left past every taller bar already popped. The correct left edge is `stack[-1] + 1` **after** the pop — the position just right of the nearest shorter bar — and `0` when the stack is empty.",
        "**`>=` versus `>`.** With `>=`, equal heights pop each other, so an equal-height run is measured only by its last member — which still yields the correct maximum, because that last one spans the whole run. With `>`, equal bars stay stacked and the widths still work out. Both are correct here; `>=` keeps the stack smaller. `[3,3,3]` returning 9 is the case that confirms whichever you chose is working.",
        "It is worth writing this one out on paper for `[2,1,5,6,2,3]` once. It is the only problem in this module where the index arithmetic genuinely needs to be traced rather than reasoned about abstractly.",
      ],
      pitfalls: [
        {
          title: "Using the popped index as the left edge",
          body: "Gives a width of 1 for every bar and returns the tallest bar rather than the largest rectangle. The left edge is the index after the *new* stack top, because everything popped before was taller and is therefore inside the rectangle.",
        },
        {
          title: "Omitting the sentinel",
          body: "A non-decreasing histogram never triggers the inner loop, so nothing is ever measured and the answer is 0. `[2,4]` is the two-element case that catches it.",
        },
        {
          title: "Mutating the input to append the sentinel",
          body: "`heights + [0]` builds a new list; `heights.append(0)` modifies the caller's array. In an interview the second is a small correctness smell, and in Maximal Rectangle — where the function is called once per row — it corrupts the data for every subsequent row.",
        },
        {
          title: "Overflow in other languages",
          body: "`height * width` with heights up to 10⁹ and widths up to 10⁵ overflows 32-bit integers. Use `long` in Java and C++. Python is immune, which is exactly why it is easy to forget when translating.",
        },
      ],
    },
    {
      id: "the-family",
      heading: "The family",
      body: [
        "**Maximal Rectangle.** A binary matrix; find the largest all-ones rectangle. Treat each row as the base of a histogram whose bar heights are the counts of consecutive ones ending at that row, then run the histogram solution per row. O(rows × cols), and it is entirely the previous problem plus a running height array.",
        "**Trapping Rain Water.** Solvable with a monotonic stack — each pop identifies a basin bounded by the new bar and the new stack top. The two-pointer solution is simpler and O(1) space, so know both and prefer the pointers; the stack version's value is seeing that the same machinery applies.",
        "**Sum of Subarray Minimums.** For each element, count the subarrays in which it is the minimum — which is `(i − prevSmaller) × (nextSmaller − i)`, the same two queries as the histogram. Strictness must differ between the two sides or subarrays with duplicate minima are counted twice; that asymmetry is the whole difficulty.",
        "**Remove K Digits** and **Create Maximum Number.** Build the smallest or largest result by popping worse choices while budget remains. Monotonic stacks used for construction rather than measurement.",
        "**Online Stock Span.** Previous-greater, answered as the elements arrive rather than in a batch.",
        "Once the histogram is solid, the rest of this list is recognition rather than new technique — which is why it is worth spending the extra time on this one.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Largest rectangle in a histogram — what is the key insight?",
      answer:
        "Every maximal rectangle's height equals some bar's height, so consider each bar as the limiting height and find how far it extends: bounded on each side by the first strictly shorter bar. Both bounds come from a monotonic stack, giving one O(n) pass.",
    },
    {
      question: "After popping a bar, how do you compute the rectangle's width?",
      answer:
        "The left edge is the index just after the new stack top — everything popped earlier was taller and lies inside the rectangle — or index 0 if the stack is empty. The right edge is the current index, the first shorter bar on the right. So the width is `i - (stack.top + 1)`.",
    },
    {
      question: "How does Maximal Rectangle reduce to this?",
      answer:
        "Maintain, for each column, the number of consecutive ones ending at the current row. That array is a histogram, so run the histogram solution once per row and take the maximum. O(rows × cols) with no new algorithm.",
    },
  ],
  takeaways: [
    "Every maximal rectangle's height is some bar's height",
    "Width is bounded by the first strictly shorter bar on each side",
    "The left edge is stack top + 1 after the pop, not the popped index",
    "A trailing sentinel flushes the stack and measures the leftovers",
    "Maximal Rectangle is this run once per row",
    "height × width overflows 32-bit integers in Java and C++",
  ],
  status: "available",
};
