import type { Lesson } from "@/content/types";

export const recurrencesLesson: Lesson = {
  id: "dsa-cx-recurrences",
  slug: "recursion-and-recurrences",
  moduleSlug: "time-and-space-complexity",
  title: "Recursion & Recurrences",
  summary:
    "Analysing recursive code by counting levels, the Master theorem in one table, and why naive Fibonacci is exponential.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Write a recurrence relation from recursive code",
    "Solve one by drawing the recursion tree and summing per level",
    "Apply the Master theorem to divide-and-conquer recurrences",
    "Explain why some recursions are exponential and what fixes them",
  ],
  sections: [
    {
      id: "writing-recurrences",
      heading: "Writing the recurrence",
      body: [
        "A recursive function's cost is defined in terms of itself, so the analysis starts by writing that down. **T(n) = (cost of the recursive calls) + (work done outside them).**",
        "Merge sort makes two calls on half the data and does a linear merge, so **T(n) = 2T(n/2) + O(n)**.",
        "Binary search makes one call on half the data and does constant work, so **T(n) = T(n/2) + O(1)**.",
        "Naive Fibonacci makes two calls on n−1 and n−2 with constant work, so **T(n) = T(n−1) + T(n−2) + O(1)**.",
        "Notice the shape difference in the third: the argument shrinks by **subtraction** rather than **division**. That single distinction is what separates the polynomial recursions from the exponential ones, and it is the most useful thing to look for.",
      ],
    },
    {
      id: "recursion-tree",
      heading: "Solving by drawing the tree",
      body: [
        "The reliable method needs no formula. Sketch the recursion tree, work out **how much work happens at each level**, and **how many levels there are**, then add.",
        "For merge sort: level 0 is one problem of size n, doing n work. Level 1 is two problems of size n/2, doing n/2 each — **n work again**. Level 2 is four of size n/4, again n. Every level does n total, and the sizes halve, so there are log n + 1 levels.",
        "**n work per level × log n levels = O(n log n).** That is the entire derivation, and it explains why merge sort is n log n rather than merely asserting it.",
        "The same method handles binary search: constant work per level, log n levels, O(log n). And it handles anything the Master theorem cannot.",
      ],
      examples: [
        {
          id: "tree",
          title: "Merge sort's recursion tree, level by level",
          lang: "python",
          code: `def merge_sort_work(n):
    """T(n) = 2T(n/2) + n. Count the work at each level."""
    level, size, total = 0, n, 0
    print(f"{'level':>6}  {'subproblems':>12}  {'each size':>10}  {'work':>8}")
    while size >= 1:
        subproblems = n // size
        work = subproblems * size
        total += work
        print(f"{level:>6}  {subproblems:>12}  {size:>10}  {work:>8}")
        size //= 2
        level += 1
    print()
    print(f"levels = {level} = log2({n}) + 1")
    print(f"work per level = {n}, so total = {n} * {level} = {total} = O(n log n)")


merge_sort_work(16)`,
          output: ` level   subproblems   each size      work
     0             1          16        16
     1             2           8        16
     2             4           4        16
     3             8           2        16
     4            16           1        16

levels = 5 = log2(16) + 1
work per level = 16, so total = 16 * 5 = 80 = O(n log n)
`,
          explanation:
            "The work column is constant all the way down — that is the signature of a balanced divide-and-conquer, and it is why the answer is (work per level) × (number of levels). If the work per level had *grown* going down, the bottom level would dominate; if it had shrunk, the root would. Both of those cases are exactly what the Master theorem formalises.",
        },
      ],
    },
    {
      id: "master-theorem",
      heading: "The Master theorem",
      body: [
        "For recurrences of the form **T(n) = a·T(n/b) + O(n^c)** — a subproblems, each 1/b the size, plus n^c work to combine — the answer depends on comparing **log_b(a) against c**.",
        "**log_b(a) > c** — the leaves dominate. T(n) = O(n^log_b(a)).",
        "**log_b(a) = c** — every level does equal work. T(n) = O(n^c · log n).",
        "**log_b(a) < c** — the root dominates. T(n) = O(n^c).",
        "The intuition is exactly the tree from the last section: log_b(a) measures how fast the number of subproblems grows going down, and c measures how fast the per-problem work shrinks. Whichever wins decides.",
        "**It does not apply** when the subproblems have different sizes, when the argument shrinks by subtraction, or when the combining work is not a clean power of n. Fall back to the tree.",
      ],
      examples: [
        {
          id: "master",
          title: "Five recurrences through the theorem",
          lang: "python",
          code: `import math

cases = [
    ("binary search", 1, 2, 0, "T(n) = T(n/2) + O(1)"),
    ("merge sort", 2, 2, 1, "T(n) = 2T(n/2) + O(n)"),
    ("binary tree walk", 2, 2, 0, "T(n) = 2T(n/2) + O(1)"),
    ("Karatsuba", 3, 2, 1, "T(n) = 3T(n/2) + O(n)"),
    ("Strassen", 7, 2, 2, "T(n) = 7T(n/2) + O(n^2)"),
]


def power(c):
    if c == 0:
        return ""
    return "n " if c == 1 else f"n^{c} "


print(f"{'algorithm':<17} {'recurrence':<24} {'log_b(a)':>8}  {'c':>2}  result")
for name, a, b, c, rec in cases:
    lba = math.log(a, b)
    if abs(lba - c) < 1e-9:
        result = f"O({power(c)}log n)"
    elif lba > c:
        result = f"O(n^{lba:.3f})".replace("^1.000", "").replace("^0.000", "^0")
    else:
        result = f"O(n^{c})" if c != 1 else "O(n)"
    print(f"{name:<17} {rec:<24} {lba:>8.3f}  {c:>2}  {result}")`,
          output: `algorithm         recurrence               log_b(a)   c  result
binary search     T(n) = T(n/2) + O(1)        0.000   0  O(log n)
merge sort        T(n) = 2T(n/2) + O(n)       1.000   1  O(n log n)
binary tree walk  T(n) = 2T(n/2) + O(1)       1.000   0  O(n)
Karatsuba         T(n) = 3T(n/2) + O(n)       1.585   1  O(n^1.585)
Strassen          T(n) = 7T(n/2) + O(n^2)     2.807   2  O(n^2.807)
`,
          explanation:
            "Rows two and three differ only in the combining work and land in different cases — merge sort's linear merge ties with the branching and gives the log factor, while a tree walk's constant work loses to it and gives plain O(n). The last two are the famous ones: Karatsuba multiplies large numbers in n^1.585 by turning four multiplications into three, and Strassen multiplies matrices in n^2.807 by turning eight into seven. **Both are entirely the result of shrinking `a` by one.**",
        },
      ],
    },
    {
      id: "exponential",
      heading: "Why naive Fibonacci is exponential",
      body: [
        "T(n) = T(n−1) + T(n−2) + O(1) shrinks by subtraction, so the tree has **depth n** with branching factor 2 — roughly 2ⁿ nodes, and more precisely φⁿ where φ ≈ 1.618 is the golden ratio.",
        "The reason is pure waste: the same subproblems are recomputed over and over. `fib(30)` computes `fib(10)` thousands of times.",
        "**The fix is memoisation** — cache each result the first time. Every distinct subproblem is then computed once, so the cost collapses to the number of distinct subproblems, which is n. From 2.7 million calls to 59.",
        "That transformation is the whole of dynamic programming in one move, and this recurrence is where it is easiest to see. Whenever a recursion's argument shrinks by subtraction and branches, ask whether the branches overlap; if they do, memoise.",
      ],
      examples: [
        {
          id: "fib",
          title: "Counting the calls, and the collapse",
          lang: "python",
          code: `calls = 0


def fib_naive(n):
    global calls
    calls += 1
    if n < 2:
        return n
    return fib_naive(n - 1) + fib_naive(n - 2)


print(f"{'n':>4}  {'fib(n)':>9}  {'calls':>11}  {'calls(n)/calls(n-5)':>20}")
prev = None
for n in (15, 20, 25, 30):
    calls = 0
    v = fib_naive(n)
    ratio = f"{calls / prev:.2f}" if prev else "-"
    print(f"{n:>4}  {v:>9,}  {calls:>11,}  {ratio:>20}")
    prev = calls

print()
print("each +5 in n multiplies the calls by about 11 = golden ratio^5")
print("that is exponential growth: T(n) = T(n-1) + T(n-2) + O(1) = O(1.618^n)")

memo_calls = 0


def fib_memo(n, memo):
    global memo_calls
    memo_calls += 1
    if n < 2:
        return n
    if n not in memo:
        memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)
    return memo[n]


print()
print("fib(30) memoised:", fib_memo(30, {}), "in", memo_calls, "calls")`,
          output: `   n     fib(n)        calls   calls(n)/calls(n-5)
  15        610        1,973                     -
  20      6,765       21,891                 11.10
  25     75,025      242,785                 11.09
  30    832,040    2,692,537                 11.09

each +5 in n multiplies the calls by about 11 = golden ratio^5
that is exponential growth: T(n) = T(n-1) + T(n-2) + O(1) = O(1.618^n)

fib(30) memoised: 832040 in 59 calls`,
          explanation:
            "The constant ratio of 11.09 is the proof of exponential growth — a polynomial would give a ratio that changes with n, while an exponential gives a fixed multiplier per fixed increment. And 2,692,537 calls against 59 for the same answer is the strongest argument for memoisation you will see. Note the memo is passed explicitly rather than as a default argument, which avoids the mutable-default trap from the functions module.",
        },
      ],
      pitfalls: [
        {
          title: "Assuming every recursion is O(2ⁿ) because it branches twice",
          body: "Binary tree traversal also makes two calls per node and is O(n), because the two calls split the data rather than each seeing almost all of it. What matters is the total size across the recursive calls: if it stays n, you get a polynomial; if it stays near 2n, you get an exponential. Look at the arguments, not the branch count.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you analyse a recursive function's complexity?",
      answer:
        "Write the recurrence — the cost of the recursive calls plus the work outside them — then solve it, usually by drawing the recursion tree. Work out how much work happens at each level and how many levels there are. Merge sort does n work at every level because two subproblems of size n/2 total n, and the sizes halve so there are log n levels, giving O(n log n). The tree method is reliable and works on recurrences the Master theorem does not cover.",
    },
    {
      question: "What is the Master theorem?",
      answer:
        "For T(n) = a·T(n/b) + O(n^c), compare log_b(a) with c. If log_b(a) > c the leaves dominate and the answer is O(n^log_b(a)); if they are equal every level does the same work and it is O(n^c log n); if log_b(a) < c the root dominates and it is O(n^c). Merge sort is the equal case, giving O(n log n). It does not apply when subproblems have unequal sizes, when the argument shrinks by subtraction, or when the combining work is not a clean power of n.",
    },
    {
      question: "Why is naive Fibonacci exponential, and why isn't tree traversal?",
      answer:
        "Because its argument shrinks by *subtraction* while branching twice, so the tree has depth n and about φⁿ nodes — the same subproblems get recomputed constantly, and fib(30) takes 2.7 million calls. Tree traversal also branches twice but *divides* the data, so the total size across the calls stays n and it is O(n). Look at the arguments rather than the branch count. Memoising Fibonacci computes each distinct subproblem once and drops it to 59 calls, which is dynamic programming in a single move.",
    },
  ],
  takeaways: [
    "T(n) = cost of the recursive calls + work outside them",
    "Solve by the tree: work per level × number of levels",
    "Merge sort does n work at each of log n levels, giving O(n log n)",
    "Master theorem: compare log_b(a) with c — leaves win, tie, or root wins",
    "Karatsuba and Strassen are famous purely for shrinking `a` by one",
    "Subtraction in the argument suggests exponential; division suggests polynomial",
    "Naive Fibonacci is O(φⁿ) — 2.7 million calls for n = 30, or 59 memoised",
    "Branch count is not the test; the total size across the recursive calls is",
  ],
};
