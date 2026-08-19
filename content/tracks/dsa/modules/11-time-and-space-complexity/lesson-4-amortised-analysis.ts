import type { Lesson } from "@/content/types";

export const amortisedAnalysisLesson: Lesson = {
  id: "dsa-cx-amortised",
  slug: "amortised-analysis",
  moduleSlug: "time-and-space-complexity",
  title: "Amortised Analysis",
  summary:
    "Why an operation whose worst case is O(n) can honestly be called O(1), and how to tell that claim apart from an average-case one.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Define amortised cost and distinguish it from average-case cost",
    "Prove appending to a dynamic array is amortised O(1)",
    "Recognise the other amortised structures you will meet",
    "Say when an amortised guarantee is not good enough",
  ],
  sections: [
    {
      id: "the-idea",
      heading: "The idea",
      body: [
        "Appending to a dynamic array is usually O(1) and occasionally O(n), when the array is full and everything gets copied. Quoting the worst case — O(n) — would be technically true and badly misleading, because that expensive append pays for the n cheap ones that follow.",
        "**Amortised cost is the total cost of a sequence of operations, divided by the number of operations.** If n appends cost O(n) in total, each one is amortised O(1), even though no individual append is guaranteed to be cheap.",
        "This is not a probabilistic claim. It is a **worst-case guarantee over a sequence**: any n appends, from any starting state, cost O(n) total. Nothing is being averaged over inputs, and there is no assumption about what the data looks like.",
        "That distinction is what separates it from average case, and it is the thing interviewers check.",
      ],
      examples: [
        {
          id: "append-costs",
          title: "The cost of each append, and what they average to",
          lang: "python",
          code: `def append_costs(n):
    """Cost of each append with a doubling array: 1, plus a copy when full."""
    costs = []
    capacity, size = 1, 0
    for _ in range(n):
        if size == capacity:
            costs.append(size + 1)      # copy everything, then write
            capacity *= 2
        else:
            costs.append(1)
        size += 1
    return costs


costs = append_costs(20)
print("cost of each of the first 20 appends:")
print(" ", costs)
print()
print("worst single append:", max(costs))
print("total cost         :", sum(costs))
print("average per append :", sum(costs) / len(costs))

print()
for n in (100, 10_000, 1_000_000):
    c = append_costs(n)
    print(f"n = {n:>9,}   total {sum(c):>10,}   average {sum(c) / n:.3f}   worst {max(c):>9,}")`,
          output: `cost of each of the first 20 appends:
  [1, 2, 3, 1, 5, 1, 1, 1, 9, 1, 1, 1, 1, 1, 1, 1, 17, 1, 1, 1]

worst single append: 17
total cost         : 51
average per append : 2.55

n =       100   total        227   average 2.270   worst        65
n =    10,000   total     26,383   average 2.638   worst     8,193
n = 1,000,000   total  2,048,575   average 2.049   worst   524,289
`,
          explanation:
            "Two columns tell the whole story. The **worst** column grows without bound — half a million operations for a single append at n = 10⁶ — while the **average** column stays near 2 regardless of n. A bounded average with an unbounded worst case is exactly what amortised O(1) means, and the table is the proof rather than an illustration of it.",
        },
      ],
    },
    {
      id: "why-doubling",
      heading: "Why doubling is what makes it work",
      body: [
        "The doubling is not incidental. Run the argument and it becomes clear why nothing else would do.",
        "With doubling, the copies happen at sizes 1, 2, 4, 8, …, n. Their total is 1 + 2 + 4 + … + n, and **a geometric series sums to less than twice its largest term** — so the total copying is under 2n. Spread over n appends, that is under 2 copies each: a constant.",
        "The table above confirms it — a million appends cost 2,048,575 copy-and-write operations, just over 2n.",
        "**Growing by a fixed amount instead breaks it.** Adding ten slots at a time means reallocating every ten elements, and the copies are 10 + 20 + 30 + … which is an arithmetic series summing to O(n²). Amortised over n appends that is O(n) each, not O(1).",
        "The moral generalises: *geometric growth gives amortised constant cost, arithmetic growth does not.*",
      ],
      examples: [
        {
          id: "not-amortised",
          title: "What a non-amortised operation looks like",
          lang: "python",
          code: `def sorted_insert_costs(n):
    """Inserting into a sorted array shifts, every single time."""
    return [i for i in range(n)]


costs = sorted_insert_costs(1000)
print("total", f"{sum(costs):,}", "average", f"{sum(costs) / len(costs):.1f}")
print("the average GROWS with n, so this is not amortised O(1) -- it is O(n)")

print()
for n in (100, 1000, 10000):
    c = sorted_insert_costs(n)
    print(f"n = {n:>6,}  average cost per insert = {sum(c) / n:>8.1f}")`,
          output: `total 499,500 average 499.5
the average GROWS with n, so this is not amortised O(1) -- it is O(n)

n =    100  average cost per insert =     49.5
n =  1,000  average cost per insert =    499.5
n = 10,000  average cost per insert =   4999.5
`,
          explanation:
            "The contrast is the test you should apply. Here the average cost is n/2 and **grows tenfold as n grows tenfold**, so there is nothing to amortise — it is genuinely O(n) per operation. Compare with the append table, where the average stayed near 2 across four orders of magnitude. If the average grows with n, the operation is not amortised anything cheaper.",
        },
      ],
    },
    {
      id: "amortised-vs-average",
      heading: "Amortised is not average",
      body: [
        "The two get conflated constantly and mean different things.",
        "**Amortised** is a guarantee over a *sequence of operations*, holding for every input. Any n appends cost O(n), full stop.",
        "**Average case** is an expectation over a *distribution of inputs*. A hash map is average O(1) because with typical keys the buckets are short — but a hostile input can make every lookup O(n), and no sequence guarantee prevents it.",
        "**The practical difference:** an adversary can defeat an average-case bound and cannot defeat an amortised one. That is why hash-flooding attacks are real and why nobody attacks an ArrayList.",
        "The phrasing that keeps them straight: *amortised* means \"expensive operations are rare and paid for by cheap ones\"; *average* means \"expensive inputs are unlikely\".",
      ],
      pitfalls: [
        {
          title: "Calling a hash map \"amortised O(1)\"",
          body: "It is average O(1) for lookup — the constant depends on the input's hash distribution, not on a sequence argument. The *resizing* of a hash map genuinely is amortised, by the same doubling argument as the array. So a hash map is average O(1) for lookup and amortised O(1) for insertion, and being able to say which is which is a small but real signal of understanding.",
        },
      ],
    },
    {
      id: "where",
      heading: "Where you will meet it",
      body: [
        "**Dynamic arrays** — append and pop at the end, by doubling. `list.append`, `ArrayList.add`.",
        "**Hash map resizing** — the rehash on growth, by the same argument.",
        "**StringBuilder** — the same growable buffer, which is why building a string with one is O(n) overall.",
        "**Union-find with path compression** — amortised near-constant, technically the inverse Ackermann function, which is under 5 for any input that exists.",
        "**The two-pointer and monotonic-stack patterns** — each element is pushed and popped at most once across the whole run, so an inner loop that looks nested is O(n) overall. This is amortised reasoning applied to an *algorithm* rather than a structure, and it is why sliding-window solutions are linear despite the inner `while`.",
        "**When it is not good enough:** real-time systems, where a single 500,000-step pause matters even if the average is 2. That is why some systems use incrementally-resizing structures that never have a single expensive operation, trading a worse average for a bounded worst case.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does amortised O(1) mean?",
      answer:
        "That any sequence of n operations costs O(n) in total, so the per-operation cost is constant on average — even though an individual operation can be O(n). For a dynamic array, appends cost 1 each except when the array is full, and the copies at sizes 1, 2, 4, …, n form a geometric series summing to under 2n. A million appends cost about two million operations, so just over 2 each. Crucially it is a worst-case guarantee over the sequence, not a claim about typical inputs.",
    },
    {
      question: "What is the difference between amortised and average case?",
      answer:
        "Amortised is a guarantee over a sequence of operations that holds for every input — expensive operations are rare and paid for by the cheap ones. Average case is an expectation over a distribution of inputs — expensive inputs are unlikely. The practical difference is that an adversary can defeat an average-case bound but not an amortised one, which is why hash-flooding attacks exist and nobody attacks an ArrayList. A hash map is average O(1) for lookup and amortised O(1) for insertion.",
    },
    {
      question: "Why does a dynamic array double rather than grow by a fixed amount?",
      answer:
        "Because geometric growth gives amortised constant cost and arithmetic growth does not. Doubling makes the copies a geometric series, 1 + 2 + 4 + … + n, which sums to under 2n — a constant per append. Growing by a fixed ten slots reallocates every ten elements, making the copies an arithmetic series that sums to O(n²), which is O(n) amortised per append. The growth factor's exact value doesn't matter; that it is a factor rather than an increment does.",
    },
  ],
  takeaways: [
    "Amortised cost is the total for a sequence divided by the number of operations",
    "It is a worst-case guarantee over the sequence, not an assumption about inputs",
    "A million appends cost about 2n operations — average near 2, worst case half a million",
    "The test: if the average grows with n, nothing is being amortised",
    "Geometric growth gives amortised O(1); arithmetic growth gives O(n)",
    "Amortised means expensive operations are rare; average means expensive inputs are unlikely",
    "An adversary can defeat an average-case bound and cannot defeat an amortised one",
    "Sliding-window and monotonic-stack loops are linear by the same argument",
  ],
};
