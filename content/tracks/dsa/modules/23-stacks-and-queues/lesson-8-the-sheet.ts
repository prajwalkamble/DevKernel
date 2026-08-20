import type { Lesson } from "@/content/types";

export const stacksQueuesSheetLesson: Lesson = {
  id: "dsa-sq-sheet",
  slug: "the-sheet-stacks-and-queues",
  moduleSlug: "stacks-and-queues",
  title: "The Sheet",
  summary:
    "The problems, ordered so each one adds a single idea to the one before — and the recognition rules that tell you which of the four patterns you are looking at.",
  estimatedMinutes: 25,
  objectives: [
    "Recall the standard problems in a sensible order",
    "Apply the recognition rules for each pattern",
    "Know which problems are worth repeating",
  ],
  sections: [
    {
      id: "recognition",
      heading: "Four recognition rules",
      body: [
        "**Things that open and close** → a stack. Brackets, tags, parentheses in expressions, nested encodings. The inner one must close first, which is exactly LIFO.",
        "**\"For each element, the next/previous one that is bigger/smaller\"** → a monotonic stack. Also anything phrased as *how far until*, *how many days until*, *span*, or *visible from*.",
        "**\"The maximum/minimum of every window\"** → a monotonic deque. Two discards, both ends, O(n).",
        "**A query the structure cannot answer in O(1)** → augment it. Store the answer alongside each element and check it can be maintained on insertion without recomputation on removal.",
        "One more signal worth naming: **an expression to parse or a string to decode**, where the encoding nests — `3[a2[c]]` and its relatives. Those are stack problems that do not look like stack problems, because the word *nesting* never appears.",
      ],
    },
    {
      id: "the-sheet",
      heading: "The sheet",
      body: [
        "**Valid Parentheses** — the base case. Both failure modes.",
        "**Min Stack** — augmentation, and the duplicate-minimum trap.",
        "**Implement Queue using Stacks** — the amortised argument.",
        "**Implement Stack using Queues** — the mirror; less useful, but it is asked.",
        "**Baseball Game / Remove All Adjacent Duplicates** — warm-ups that make the LIFO shape obvious.",
        "**Decode String** — `3[a2[c]]`. Two stacks, one for counts and one for partial strings. The first problem where the nesting is not made of brackets in the obvious sense.",
        "**Basic Calculator II** then **Basic Calculator** — precedence, then parentheses. Do them in that order; the second is much harder and builds directly on the first.",
        "**Next Greater Element I and II** — the monotonic stack, then its circular form.",
        "**Daily Temperatures** — the same loop measuring distance rather than value. The clearest single demonstration of why the stack holds indices.",
        "**Online Stock Span** — previous-greater, answered as elements arrive.",
        "**Largest Rectangle in Histogram** — the hard one. Trace it on paper.",
        "**Maximal Rectangle** — the histogram once per row.",
        "**Trapping Rain Water** — stack version and two-pointer version; know both and prefer the pointers.",
        "**Sum of Subarray Minimums** — previous-smaller and next-smaller with asymmetric strictness. The strictness is the whole problem.",
        "**Sliding Window Maximum** — the monotonic deque.",
        "**Shortest Subarray with Sum at Least K** — prefix sums plus deque, negatives allowed. The hardest in the module.",
        "**Binary Tree Iterator** — the explicit stack, and the bridge to the trees module.",
        "**Remove K Digits** — a monotonic stack used to build rather than to measure.",
      ],
    },
    {
      id: "what-to-repeat",
      heading: "What to repeat, and what to just read",
      body: [
        "Three are worth doing more than once, because everything else in the module is assembled from them.",
        "**Daily Temperatures**, until the monotonic stack loop is automatic and you can give the amortised argument without pausing.",
        "**Largest Rectangle**, until the width calculation is something you derive rather than recall. It is the only index arithmetic here that genuinely needs tracing.",
        "**Sliding Window Maximum**, until the two discard rules are separate in your head — back for domination, front for expiry.",
        "The rest are recognition. Once you can name the pattern, the implementation is a template you already have, and a second attempt teaches little.",
        "One habit for interviews: when you reach for a monotonic structure, **say what invariant the stack maintains before writing the loop**. \"The stack holds indices whose next-greater is still unknown, in decreasing order of value.\" That sentence is the design, and stating it turns the code into transcription — as well as pre-empting the \"isn't that quadratic?\" question, which you can answer with the pushed-once, popped-once argument.",
      ],
      pitfalls: [
        {
          title: "Learning the templates without the invariants",
          body: "The four monotonic variants look nearly identical and differ by a comparison operator and a direction. Memorised as code they are easy to confuse; derived from the invariant — what is the stack holding, and why — the right one falls out.",
        },
        {
          title: "Not checking the empty and single-element cases",
          body: "Monotonic loops read `stack[-1]` and deque fronts constantly. Empty input, one element, and all-equal elements are the three inputs that catch missing guards.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you recognise a monotonic stack problem?",
      answer:
        "The question asks, for every element, about the next or previous element that is larger or smaller — including its disguises: how many days until, span, how far until, which bars are visible. The answer is needed for every index rather than for one, which is what rules out a single scan.",
    },
    {
      question: "Decode String — why two stacks?",
      answer:
        "The encoding nests, so on entering a bracket you must set aside both the repeat count and the string built so far. One stack holds counts, the other partial strings; a closing bracket pops both and combines them. It is bracket matching with state attached to each level.",
    },
    {
      question: "What invariant does your monotonic stack maintain?",
      answer:
        "It holds indices whose answer is still unknown, in decreasing order of value for the next-greater variant. Anything smaller than an incoming element has just been answered and is removed, which is what keeps the order and makes the pass linear.",
    },
  ],
  takeaways: [
    "Open-and-close means a stack, even when brackets are never mentioned",
    "\"For each element, the next bigger\" means a monotonic stack",
    "\"Extreme of every window\" means a monotonic deque",
    "A query the structure cannot answer means augment it",
    "Repeat Daily Temperatures, Largest Rectangle and Window Maximum",
    "State the stack's invariant before writing the loop",
  ],
  status: "available",
};
