import type { Lesson } from "@/content/types";

export const lowerBoundLesson: Lesson = {
  id: "dsa-sort-lower-bound",
  slug: "the-n-log-n-lower-bound",
  moduleSlug: "sorting",
  title: "The n log n Lower Bound",
  summary:
    "No comparison sort can beat O(n log n), and the proof is a counting argument you can reconstruct in an interview. The sorts that do beat it escape by not comparing at all.",
  estimatedMinutes: 25,
  objectives: [
    "Reconstruct the decision-tree argument for the Ω(n log n) bound",
    "State precisely which sorts the bound applies to",
    "Explain how counting and radix sort avoid it",
    "Say what those sorts pay in exchange",
  ],
  sections: [
    {
      id: "the-argument",
      heading: "Why comparisons cannot do better",
      body: [
        "Think of a comparison sort as walking down a decision tree. Each internal node is a comparison, each branch is an outcome, and each leaf is one final arrangement.",
        "There are **n! possible orderings** of n distinct elements, and the algorithm must be able to reach every one of them — otherwise there is some input it sorts wrongly. So the tree needs at least n! leaves.",
        "A binary tree of height h has at most 2^h leaves. So `2^h ≥ n!`, which gives `h ≥ log₂(n!)`.",
        "By Stirling's approximation `log₂(n!)` is `Θ(n log n)`. The height of the tree is the number of comparisons in the worst case, so **every comparison sort needs Ω(n log n) comparisons on some input**.",
        "The argument is worth being able to reproduce, because it is one of the few lower bounds in the syllabus and interviewers do ask for it. The one-line version: *there are n! answers, each comparison halves the possibilities, so you need log₂(n!) ≈ n log n of them*.",
      ],
    },
    {
      id: "what-it-covers",
      heading: "What the bound does and does not cover",
      body: [
        "It applies to algorithms whose **only** way of learning about the data is asking \"is a before b?\". Insertion, merge, quick, heap, shell, cocktail — all bound.",
        "It says nothing about algorithms that look *inside* a key. If you can use a key's value as an array index, you are not comparing, the decision tree does not model you, and the bound does not apply.",
        "That is the whole escape hatch, and both counting sort and radix sort go through it.",
        "It also assumes the elements are distinct, and it bounds the **worst case**. An adaptive sort can be O(n) on favourable input without contradicting anything — insertion sort on already-sorted data is not a counterexample, because the bound is a statement about some input, not every input.",
      ],
      examples: [
        {
          id: "counting-sort",
          title: "Sorting without a single comparison",
          lang: "python",
          code: `def counting_sort(a, k):
    counts = [0] * (k + 1)
    for x in a:
        counts[x] += 1
    print("counts:", counts)
    for i in range(1, k + 1):
        counts[i] += counts[i - 1]
    print("running:", counts)
    out = [0] * len(a)
    for x in reversed(a):          # reversed keeps equal keys in input order
        counts[x] -= 1
        out[counts[x]] = x
    return out

data = [3, 1, 4, 1, 5, 0, 2, 3]
print("input: ", data)
print("sorted:", counting_sort(data, 5))`,
          output: `input:  [3, 1, 4, 1, 5, 0, 2, 3]
counts: [1, 2, 1, 2, 1, 1]
running: [1, 3, 4, 6, 7, 8]
sorted: [0, 1, 1, 2, 3, 3, 4, 5]`,
          explanation:
            "Not one `<` between elements. The value **is** the index — `counts[x] += 1` uses the key to address memory directly. The running totals turn counts into final positions: after the prefix sum, `counts[x]` is one past where the last x belongs. Walking the input **backwards** and decrementing is what makes it stable, which lesson 3 shows is the property radix sort depends on entirely.",
        },
      ],
      visual: {
        id: "counting-visual",
        kind: "sorting",
        algorithm: "counting",
        lockAlgorithm: true,
        title: "Counting sort: tally, accumulate, place",
      },
    },
    {
      id: "the-price",
      heading: "What you pay to escape",
      body: [
        "Counting sort is O(n + k) for keys in the range 0..k. When k is comparable to n that is linear and unbeatable. When k is large it is a disaster: sorting eight 32-bit integers this way allocates four billion counters.",
        "So the bound is not really broken; it is traded. Comparison sorts are O(n log n) *for any comparable type*. Counting sort is O(n + k) *for small integer keys only*. You buy speed with a restriction on the input.",
        "Radix sort extends the range by sorting digit by digit, each pass a stable counting sort. d passes over n elements with base-b digits gives O(d · (n + b)). This is how you sort large integers or fixed-length strings in linear time — and the constant is high enough that for n in the thousands, quicksort usually still wins.",
        "The practical takeaway is a recognition rule: when a problem says the values are bounded — ages, scores 0–100, lowercase letters, a small range stated in the constraints — a comparison sort may not be the intended solution.",
      ],
      pitfalls: [
        {
          title: "Claiming a sort beats O(n log n) without saying how",
          body: "\"Radix sort is O(n)\" is the kind of statement that invites a follow-up you must be ready for. It is O(d·(n+b)), and d depends on the key width. For 32-bit keys with base-256 digits that is four passes — linear in n, with a constant of four plus the counting overhead.",
        },
        {
          title: "Reaching for counting sort when k is unbounded",
          body: "The array is sized by the key range, not the element count. Values up to 10⁹ make it unusable regardless of how few elements there are. Check the constraint on the *values*, not on n.",
        },
        {
          title: "Treating the bound as a statement about every input",
          body: "It bounds the worst case. Adaptive sorts are legitimately O(n) on favourable inputs, and that is not a contradiction — there is still some input on which they need n log n comparisons.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Prove that comparison sorting is Ω(n log n).",
      answer:
        "Model it as a decision tree: internal nodes are comparisons, leaves are orderings. There are n! orderings, all reachable, so the tree needs n! leaves. A binary tree of height h has at most 2^h leaves, so h ≥ log₂(n!) = Θ(n log n). Height is worst-case comparisons.",
    },
    {
      question: "How does counting sort get around it?",
      answer:
        "It never compares elements. It uses each key directly as an array index, which the decision-tree model does not describe. The price is a counter array sized by the key range, making it O(n + k) and unusable when k is large.",
    },
    {
      question: "When is radix sort actually the right choice?",
      answer:
        "Large n with fixed-width keys — integers, dates, fixed-length strings — where d passes of stable counting sort beat log n comparisons. For small n the constants dominate and quicksort wins, so it is a large-data technique rather than an interview default.",
    },
  ],
  takeaways: [
    "n! orderings and binary decisions give h ≥ log₂(n!) = Θ(n log n)",
    "The bound applies only to algorithms that learn by comparing",
    "Counting sort uses the key as an index, so the model does not apply",
    "O(n + k) is linear only while k stays near n",
    "Radix sort is repeated stable counting sort, digit by digit",
    "Bounded values in the constraints are the hint to consider these",
  ],
  status: "available",
};
