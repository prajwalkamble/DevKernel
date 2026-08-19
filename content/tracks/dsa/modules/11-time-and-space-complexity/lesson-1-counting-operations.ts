import type { Lesson } from "@/content/types";

export const countingOperationsLesson: Lesson = {
  id: "dsa-cx-counting",
  slug: "counting-operations",
  moduleSlug: "time-and-space-complexity",
  title: "Counting Operations",
  summary:
    "Why we count steps instead of measuring seconds, what counts as a step, and how the count becomes a growth rate.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Explain why runtime is measured in operations rather than time",
    "Count the operations a piece of code performs",
    "Extract the growth rate from an operation count",
    "Say why constants and lower-order terms get dropped",
  ],
  sections: [
    {
      id: "why-not-seconds",
      heading: "Why not seconds",
      body: [
        "Timing a program gives a number that depends on the machine, the language, the compiler, what else is running, and the input you happened to pick. Run it on a different laptop and you get a different answer, so it says nothing transferable about the algorithm.",
        "So we count **operations** instead — how many basic steps the algorithm performs as a function of the input size. That number is a property of the algorithm and nothing else.",
        "A \"basic step\" is anything that takes constant time regardless of input size: an arithmetic operation, a comparison, an assignment, an array index. We do not care that multiplication is slower than addition, because that is a constant factor and constant factors are exactly what this measure is designed to ignore.",
        "What we keep is the **shape of the growth**: as the input gets ten times bigger, does the work get ten times bigger, a hundred times bigger, or barely bigger at all? That question has the same answer on every machine.",
      ],
      examples: [
        {
          id: "counting",
          title: "Counting, and what the count converges to",
          lang: "python",
          code: `def count_ops_sum(values):
    ops = 0
    total = 0
    ops += 1
    for v in values:
        total += v
        ops += 1
    return total, ops


for n in (10, 100, 1000):
    _, ops = count_ops_sum(list(range(n)))
    print(f"n = {n:>5}  operations = {ops:>6}  ops/n = {ops / n:.3f}")

print()


def count_ops_pairs(values):
    ops = 0
    for i in range(len(values)):
        for j in range(i + 1, len(values)):
            ops += 1
    return ops


for n in (10, 100, 1000):
    ops = count_ops_pairs(list(range(n)))
    print(f"n = {n:>5}  operations = {ops:>9,}  ops/n^2 = {ops / n ** 2:.3f}")`,
          output: `n =    10  operations =     11  ops/n = 1.100
n =   100  operations =    101  ops/n = 1.010
n =  1000  operations =   1001  ops/n = 1.001

n =    10  operations =        45  ops/n^2 = 0.450
n =   100  operations =     4,950  ops/n^2 = 0.495
n =  1000  operations =   499,500  ops/n^2 = 0.499`,
          explanation:
            "The ratios are the point. Dividing the first count by n gives something converging to 1, so the work is proportional to n. Dividing the second by n² gives something converging to 0.5, so the work is proportional to n² — the constant ½ is real and is not what distinguishes these two algorithms.",
        },
      ],
    },
    {
      id: "dropping",
      heading: "What we drop, and why",
      body: [
        "Take an exact count like **3n² + 5n + 17**. Two things get thrown away.",
        "**Lower-order terms.** As n grows, 3n² swamps 5n + 17 completely. At n = 1000 the quadratic term is three million and the rest is around five thousand — a rounding error. Keeping them adds noise, not information.",
        "**The constant factor.** The 3 depends on how you count and on the machine. An algorithm that is 3n² on one machine is 7n² on another, and the useful claim — that doubling n quadruples the work — holds for both.",
        "So 3n² + 5n + 17 becomes **O(n²)**, read as \"order n squared\". What survives is the one thing that transfers.",
        "**The honest caveat:** constants are dropped from the *analysis*, not from reality. An O(n log n) algorithm with a huge constant can lose to an O(n²) one on small inputs, which is why real sorting implementations switch to insertion sort below about sixteen elements. Complexity tells you what happens as n grows; it does not promise anything at n = 10.",
      ],
    },
    {
      id: "growth-rates",
      heading: "What the growth rates actually mean",
      body: [
        "The abstraction only pays off once you have a feel for the numbers. This table is the payoff.",
        "Read across a row to see how badly an algorithm degrades, and down a column to see which classes are usable at that size.",
      ],
      examples: [
        {
          id: "growth-table",
          title: "The classes at four input sizes",
          lang: "python",
          code: `import math


def value(name, n):
    if name == "O(1)":
        return 1
    if name == "O(log n)":
        return math.log2(n)
    if name == "O(n)":
        return n
    if name == "O(n log n)":
        return n * math.log2(n)
    if name == "O(n^2)":
        return n * n
    if name == "O(2^n)":
        return 2.0 ** n
    return math.factorial(n)


names = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n^2)", "O(2^n)", "O(n!)"]
sizes = [10, 100, 1000, 1_000_000]


def fmt(x):
    return f"{x:,.0f}" if x < 1e6 else f"{x:.1e}"


print(f"{'':<12}" + "".join(f"{('n=' + f'{s:,}'):>16}" for s in sizes))
for name in names:
    row = f"{name:<12}"
    for s in sizes:
        if name in ("O(2^n)", "O(n!)") and s > 100:
            row += f"{'astronomical':>16}"
        else:
            row += f"{fmt(value(name, s)):>16}"
    print(row)`,
          output: `                        n=10           n=100         n=1,000     n=1,000,000
O(1)                       1               1               1               1
O(log n)                   3               7              10              20
O(n)                      10             100           1,000         1.0e+06
O(n log n)                33             664           9,966         2.0e+07
O(n^2)                   100          10,000         1.0e+06         1.0e+12
O(2^n)                 1,024         1.3e+30    astronomical    astronomical
O(n!)                3.6e+06        9.3e+157    astronomical    astronomical`,
          explanation:
            "Three observations worth carrying. **O(log n) barely moves** — twenty steps for a million items, which is why binary search and balanced trees are everywhere. **O(n log n) is close to O(n)** at realistic sizes; 2 × 10⁷ against 10⁶ is a factor of twenty, not a different world, which is why sorting is usually an acceptable first move. And **O(n²) at a million is 10¹², which no computer will finish** — that gap is why the difference between a nested loop and a hash map decides whether a solution passes.",
        },
      ],
      pitfalls: [
        {
          title: "Assuming a lower complexity class always wins",
          body: "O(n log n) beats O(n²) *eventually*, and the crossover point depends on the constants. Java's `Arrays.sort` uses insertion sort — a quadratic algorithm — for runs under 32 elements, because for tiny inputs its tiny constant beats merge sort's overhead. Big-O is a statement about growth, and \"eventually\" is doing real work in it.",
        },
      ],
    },
    {
      id: "practical-budget",
      heading: "The practical budget",
      body: [
        "A rule of thumb that turns the table into a decision: **a typical judge allows roughly 10⁸ simple operations per second.** Python is nearer 10⁷ for interpreted loops, Java nearer 10⁹ for tight primitive ones.",
        "So with a one-second limit, and taking 10⁸ as the budget:",
        "**n ≤ 10** — O(n!) or O(2ⁿ) is fine. Permutations and full subset enumeration.",
        "**n ≤ 20** — O(2ⁿ). This is the bitmask-DP range.",
        "**n ≤ 500** — O(n³). Floyd–Warshall, most interval DP.",
        "**n ≤ 5,000** — O(n²). A nested loop is acceptable.",
        "**n ≤ 10⁶** — O(n log n). Sorting, heaps, binary search over the answer.",
        "**n ≥ 10⁷** — O(n) or better. One pass, and be careful about what is inside it.",
        "Read those backwards and the constraint tells you the intended complexity before you have had any ideas — which is the single most useful trick in competitive programming, and the subject of the last lesson in this module.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why do we count operations instead of measuring time?",
      answer:
        "Because measured time depends on the machine, language, compiler, system load and the particular input, so it says nothing transferable about the algorithm. An operation count is a property of the algorithm alone. What we actually keep from that count is its growth rate — how the work scales as the input grows — because that is the part that holds on every machine, and it is what decides whether a solution finishes at all on a large input.",
    },
    {
      question: "Why do we drop constants and lower-order terms?",
      answer:
        "Lower-order terms become negligible as n grows: in 3n² + 5n + 17 at n = 1000, the quadratic term is three million and the rest is around five thousand. The constant factor depends on how you count and on the hardware, so it is not a property of the algorithm. Dropping both leaves O(n²), the part that transfers. The caveat is that constants are dropped from the analysis and not from reality — which is why real sort implementations switch to insertion sort for very small inputs.",
    },
    {
      question: "Roughly how large an input can each complexity class handle in a second?",
      answer:
        "Taking about 10⁸ operations per second as the budget: O(n!) or O(2ⁿ) up to n ≈ 10 and 20 respectively, O(n³) to about 500, O(n²) to about 5,000, O(n log n) to about 10⁶, and O(n) or better beyond 10⁷. Python is nearer 10⁷ per second for interpreted loops and Java nearer 10⁹ for tight primitive ones. Reading that table backwards from the stated constraint tells you the intended complexity before you have had any ideas.",
    },
  ],
  takeaways: [
    "Count operations, not seconds — the count is a property of the algorithm alone",
    "A basic step is anything constant-time: arithmetic, comparison, assignment, indexing",
    "3n² + 5n + 17 becomes O(n²); lower terms vanish and the constant is machine-dependent",
    "Dividing the count by a candidate growth rate should converge to a constant",
    "O(log n) is 20 steps at a million; O(n²) is 10¹², which never finishes",
    "O(n log n) is only about twenty times O(n) at realistic sizes",
    "Budget roughly 10⁸ operations per second — 10⁷ for interpreted Python loops",
    "Constants are dropped from the analysis, not from reality",
  ],
};
