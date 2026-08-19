import type { Lesson } from "@/content/types";

export const bigOThetaOmegaLesson: Lesson = {
  id: "dsa-cx-notation",
  slug: "big-o-theta-and-omega",
  moduleSlug: "time-and-space-complexity",
  title: "Big-O, Θ and Ω",
  summary:
    "The three notations, what each one actually claims, and why everybody says Big-O when they mean Theta.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "State the formal definition of Big-O and read it correctly",
    "Distinguish O, Θ and Ω and say which one a claim needs",
    "Explain why O is an upper bound and therefore not tight by itself",
    "Use the notation the way interviewers actually use it",
  ],
  sections: [
    {
      id: "the-definition",
      heading: "The definition, and what it says",
      body: [
        "**f(n) = O(g(n))** means: there exist a constant c > 0 and a size n₀ such that **f(n) ≤ c × g(n) for every n ≥ n₀.**",
        "Three things are being said. There is a multiple of g that sits above f — that is the c. It only has to hold for large enough inputs — that is the n₀, and it is what lets the definition ignore small-input weirdness. And it is an **upper bound**: f grows no faster than g.",
        "So the formal claim is \"eventually, some constant multiple of g dominates f\". Every part of the intuition from the last lesson — dropping constants, ignoring lower terms, only caring about large n — is encoded there.",
      ],
      examples: [
        {
          id: "definition",
          title: "Finding c and n₀ for a concrete function",
          lang: "python",
          code: `def f(n):
    return 3 * n * n + 5 * n + 17


print(f"{'n':>7}  {'3n^2+5n+17':>12}  {'4n^2':>12}  {'f(n) <= 4n^2?':>14}")
for n in (1, 2, 5, 7, 8, 10, 100):
    print(f"{n:>7}  {f(n):>12,}  {4 * n * n:>12,}  {str(f(n) <= 4 * n * n):>14}")

print()
print("with c = 4 and n0 = 8, f(n) <= c * n^2 for every n >= n0")
print("that is exactly the definition of f(n) = O(n^2)")`,
          output: `      n    3n^2+5n+17          4n^2   f(n) <= 4n^2?
      1            25             4           False
      2            39            16           False
      5           117           100           False
      7           199           196           False
      8           249           256            True
     10           367           400            True
    100        30,517        40,000            True

with c = 4 and n0 = 8, f(n) <= c * n^2 for every n >= n0
that is exactly the definition of f(n) = O(n^2)`,
          explanation:
            "The bound fails for the first seven values and holds forever after, which is precisely why the definition has an n₀ at all. Any larger c would work with a smaller n₀ — with c = 25 the bound holds from n = 1 — and the choice does not matter. **The existence of some pair is the whole claim.**",
        },
      ],
    },
    {
      id: "three-notations",
      heading: "The three notations",
      body: [
        "**O — upper bound.** f grows no faster than g. \"At most.\"",
        "**Ω (omega) — lower bound.** f grows at least as fast as g. \"At least.\"",
        "**Θ (theta) — tight bound.** Both at once: f grows exactly as fast as g, up to constants. \"Exactly.\"",
        "The consequence people find surprising: **O is not tight.** Since it is only an upper bound, an O(n) algorithm is also O(n²), and O(n¹⁰⁰), and O(2ⁿ). All those statements are true and all but the first are useless.",
        "So the precise way to describe a linear scan is **Θ(n)** — it is both at most and at least linear. Saying O(n) is technically weaker but universally understood to mean the tight bound, and that is how the rest of this course uses it.",
        "**When the distinction matters:** in a lower-bound argument. \"Comparison sorting is Ω(n log n)\" says no comparison sort can beat it, which is a claim about the *problem* rather than about any algorithm — and it cannot be expressed with O at all.",
      ],
    },
    {
      id: "case-analysis",
      heading: "Notation and case are different questions",
      body: [
        "This is the most common confusion in the topic and it is worth being precise about.",
        "**O, Ω and Θ are about bounds on a function.** **Best, average and worst case are about which input you are analysing.** They are independent axes, and you can combine them freely.",
        "Linear search: best case Θ(1) — it is the first element. Worst case Θ(n) — it is last or absent. Average case Θ(n) — about n/2 comparisons, and half of n is still linear.",
        "Saying \"the worst case is O(n)\" is a claim about the worst case, not a claim that the algorithm is sometimes faster. The two ideas are orthogonal, and interviewers do notice when they get merged.",
        "**Default convention:** an unqualified complexity means the **worst case**, because that is the guarantee. The exceptions are always stated explicitly — a hash map is \"average O(1)\" and quicksort is \"average O(n log n)\", precisely because their worst cases are worse and everybody knows it.",
      ],
      examples: [
        {
          id: "cases",
          title: "Three cases of one algorithm",
          lang: "python",
          code: `def linear_search(values, target):
    """Best O(1), worst O(n), average O(n)."""
    for i, v in enumerate(values):
        if v == target:
            return i, i + 1
    return -1, len(values)


values = list(range(100))
print("target at the front:", linear_search(values, 0))
print("target at the end  :", linear_search(values, 99))
print("target absent      :", linear_search(values, -1))

print()
total = sum(linear_search(values, t)[1] for t in values)
print(f"average comparisons over all present targets: {total / len(values):.1f}")
print(f"which is about n/2 = {len(values) / 2}")
print("so the average is O(n) too -- half of n is still linear")`,
          output: `target at the front: (0, 1)
target at the end  : (99, 100)
target absent      : (-1, 100)

average comparisons over all present targets: 50.5
which is about n/2 = 50.0
so the average is O(n) too -- half of n is still linear`,
          explanation:
            "The average is 50.5 comparisons for n = 100 — genuinely half the worst case, and genuinely still O(n), because the constant ½ is exactly what the notation discards. That is a useful sanity check on the whole framework: an optimisation that halves the work does not change the complexity class, and if your improvement only halves the work, say so honestly rather than claiming a better complexity.",
        },
      ],
      pitfalls: [
        {
          title: "Saying \"the best case is O(1)\" as if it were reassuring",
          body: "Best case is almost never the useful number, because it usually describes an input you cannot rely on getting. Quicksort's best case is O(n log n) and its worst is O(n²); bubble sort's best case on already-sorted input is O(n) and it is still a bad algorithm. Quote the worst case unless there is a specific reason not to, and say which case you mean.",
        },
      ],
    },
    {
      id: "how-to-say-it",
      heading: "How to say it in an interview",
      body: [
        "Some practical phrasing, since this is a place where being sloppy reads as not knowing.",
        "**Give both time and space, unprompted.** \"This is O(n) time and O(1) space.\" Volunteering the second half is a small signal that you think about both.",
        "**Name what n is** when there is more than one input. \"O(n × m) where n is the number of rows and m the number of columns\" is unambiguous; \"O(n²)\" for a rectangular grid is wrong.",
        "**State the case when it is not the worst.** \"O(1) average for the hash map lookups, O(n) worst case if they all collide.\"",
        "**Do not claim tightness you have not checked.** If you are unsure whether the bound is achievable, \"at most O(n log n)\" is honest and \"Θ(n log n)\" may not be.",
        "**Say \"log n\" not \"log base 2 of n\".** The base is a constant factor and gets dropped — log₂ n and log₁₀ n differ by a fixed multiple — so the base is never written.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does f(n) = O(g(n)) formally mean?",
      answer:
        "That there exist a constant c > 0 and a threshold n₀ such that f(n) ≤ c × g(n) for every n ≥ n₀. It is an upper bound holding for large enough inputs, which is what licenses dropping constants and lower-order terms. For 3n² + 5n + 17 against n², taking c = 4 works from n = 8 onward; a larger c works from a smaller n₀, and which pair you pick does not matter — only that some pair exists.",
    },
    {
      question: "What is the difference between O, Ω and Θ?",
      answer:
        "O is an upper bound — grows no faster than. Ω is a lower bound — grows at least as fast as. Θ is both, so it is a tight bound. Because O is only an upper bound, an O(n) algorithm is also truthfully O(n²) and O(2ⁿ), which is why Θ(n) is the precise description of a linear scan. Everyday usage says O when it means Θ, and that is fine — but Ω is genuinely needed for statements about problems rather than algorithms, such as comparison sorting being Ω(n log n).",
    },
    {
      question: "Is best/average/worst case the same as O/Ω/Θ?",
      answer:
        "No — they are independent axes. O, Ω and Θ bound a function; best, average and worst pick which input you are bounding. You can have a tight bound on the best case: linear search is Θ(1) at best, Θ(n) at worst and Θ(n) on average. By convention an unqualified complexity means the worst case, since that is the guarantee, and the exceptions are stated aloud — a hash map is average O(1) and quicksort is average O(n log n) precisely because their worst cases are worse.",
    },
  ],
  takeaways: [
    "f(n) = O(g(n)) means f(n) ≤ c·g(n) for some c and all n beyond some n₀",
    "The n₀ is what lets the definition ignore small-input behaviour",
    "O is an upper bound, Ω a lower bound, Θ both — so O(n) is also truthfully O(n²)",
    "Θ is the precise notation; everybody says O and means Θ",
    "Ω is needed for claims about problems, like comparison sorting being Ω(n log n)",
    "Notation and case are independent — you can state a tight bound on the best case",
    "An unqualified complexity means the worst case unless stated otherwise",
    "Halving the work does not change the class; say so honestly rather than claiming better",
  ],
};
