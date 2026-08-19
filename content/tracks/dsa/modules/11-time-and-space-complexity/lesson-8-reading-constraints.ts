import type { Lesson } from "@/content/types";

export const readingConstraintsLesson: Lesson = {
  id: "dsa-cx-constraints",
  slug: "reading-constraints-backwards",
  moduleSlug: "time-and-space-complexity",
  title: "Reading Constraints Backwards",
  summary:
    "The constraint tells you the intended complexity before you have had a single idea — how to read it, and what to do with the answer.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Infer the intended complexity from a stated input bound",
    "Use the mapping in both directions to check a solution before writing it",
    "Notice the secondary constraints that carry as much information",
    "Close the module and the Module 0 track",
  ],
  sections: [
    {
      id: "the-trick",
      heading: "The trick",
      body: [
        "Every well-posed problem states a bound on its input, and that bound is not decoration. **The setter chose it so that the intended solution fits and the obvious slower one does not.**",
        "So the constraint is a hint you get for free, before reading the problem carefully and before having any ideas. Combine the per-second operation budget with the stated n and the intended complexity falls out.",
        "This is the most practically useful thing in the module. It tells you whether to spend your time looking for a clever insight or to just write the nested loop — and getting that decision wrong is what wastes interview time.",
      ],
      examples: [
        {
          id: "constraints",
          title: "The mapping, both directions",
          lang: "python",
          code: `budget = 10 ** 8

table = [
    ("n <= 10", "O(n!)", "3,628,800", "permutations, brute-force TSP"),
    ("n <= 20", "O(2^n)", "1,048,576", "subsets, bitmask DP"),
    ("n <= 100", "O(n^4)", "100,000,000", "rare, but it fits"),
    ("n <= 500", "O(n^3)", "125,000,000", "Floyd-Warshall, interval DP"),
    ("n <= 5,000", "O(n^2)", "25,000,000", "nested loops, most DP tables"),
    ("n <= 100,000", "O(n log n)", "1,700,000", "sorting, heaps, binary search"),
    ("n <= 1,000,000", "O(n log n)", "20,000,000", "still comfortable"),
    ("n <= 10,000,000", "O(n)", "10,000,000", "one pass, careful I/O"),
    ("n > 10,000,000", "O(log n) or O(1)", "~23", "maths, or the input is streamed"),
]

w1 = max(len(r[0]) for r in table)
w2 = max(len(r[1]) for r in table)
w3 = max(len(r[2]) for r in table)
print(f"{'constraint':<{w1}}  {'expect':<{w2}}  {'operations':>{w3}}  typical")
print("-" * 84)
for r in table:
    print(f"{r[0]:<{w1}}  {r[1]:<{w2}}  {r[2]:>{w3}}  {r[3]}")

print()
print(f"budget: about {budget:,} simple operations per second")`,
          output: `constraint       expect             operations  typical
------------------------------------------------------------------------------------
n <= 10          O(n!)               3,628,800  permutations, brute-force TSP
n <= 20          O(2^n)              1,048,576  subsets, bitmask DP
n <= 100         O(n^4)            100,000,000  rare, but it fits
n <= 500         O(n^3)            125,000,000  Floyd-Warshall, interval DP
n <= 5,000       O(n^2)             25,000,000  nested loops, most DP tables
n <= 100,000     O(n log n)          1,700,000  sorting, heaps, binary search
n <= 1,000,000   O(n log n)         20,000,000  still comfortable
n <= 10,000,000  O(n)               10,000,000  one pass, careful I/O
n > 10,000,000   O(log n) or O(1)          ~23  maths, or the input is streamed

budget: about 100,000,000 simple operations per second`,
          explanation:
            "Two entries carry the most information. **n ≤ 20 means subsets** — there is no other reason to pick that bound, and it is a direct instruction to think about bitmask enumeration. **n ≤ 10⁶ with a log factor still only costs 2 × 10⁷**, which is why sorting is almost never the thing that makes a solution too slow. Note the gap between n ≤ 5,000 and n ≤ 100,000: nothing sits there, because that is precisely the jump from quadratic to n log n.",
        },
      ],
    },
    {
      id: "the-signals",
      heading: "The signals worth knowing by name",
      body: [
        "**n ≤ 10 or 12** — permutations. Try every ordering.",
        "**n ≤ 20 or 25** — subsets, bitmask DP, or meet-in-the-middle. The number 20 is nearly a signature.",
        "**n ≤ 100 or 500** — a cubic algorithm is fine. Floyd–Warshall, interval DP, or a triple loop.",
        "**n ≤ 1,000 or 5,000** — quadratic. Most two-dimensional DP tables, all-pairs comparisons.",
        "**n ≤ 10⁵ or 10⁶** — n log n or n. Sort, use a heap, or binary search over the answer.",
        "**n ≤ 10⁹, or the input is a single number** — you cannot even iterate to n. This means a mathematical formula, binary search on the answer, or digit DP.",
        "**Values up to 10⁹ but n only 10⁵** — the *values* are large and the *count* is small, so coordinate compression or a hash map is being suggested rather than an array indexed by value.",
      ],
    },
    {
      id: "secondary",
      heading: "The other constraints",
      body: [
        "The bound on n is the loudest signal and not the only one.",
        "**\"Answer modulo 10⁹ + 7\"** — the answer is a count, it is astronomically large, and this is a counting or DP problem. It also tells you not to worry about the answer's magnitude.",
        "**\"All values are distinct\"** or **\"values are in the range 1 to n\"** — the second is a strong hint. Values in 1…n mean an array can be indexed by value, which enables cyclic-sort and index-marking tricks that solve several problems in O(1) space.",
        "**\"The array is sorted\"** — binary search or two pointers. If a problem sorts its input for you, it wants you to use that.",
        "**\"Solve in O(1) space\"** or **\"modify in place\"** — the setter is explicitly ruling out the easy answer. Expect two pointers, index marking, or an in-place transformation.",
        "**A tight memory limit** — the O(n) hash map is being excluded. Look for a sorting or two-pointer solution instead.",
        "**\"Do not use division\"**, **\"do not use extra space\"**, **\"single pass\"** — each rules out one specific approach, which is usually enough to identify the intended one by elimination.",
      ],
      pitfalls: [
        {
          title: "Reading the constraint as permission to stop thinking",
          body: "A bound of n ≤ 1000 permits a quadratic solution; it does not mean the quadratic one is intended. If a linear solution is natural, write it. The mapping tells you what is *sufficient*, which is most useful for ruling approaches out — knowing that an exponential search will not fit is worth more than knowing that a quadratic one will.",
        },
      ],
    },
    {
      id: "using-it",
      heading: "Using it in practice",
      body: [
        "The routine, in order.",
        "**1. Read the constraints before the problem statement.** Thirty seconds, and it frames everything after.",
        "**2. Name the target complexity out loud.** \"n is up to 10⁵, so I am looking for O(n log n) or better.\" This is genuinely worth saying in an interview — it shows you are working from evidence.",
        "**3. Check your idea against the target before writing it.** Realising a solution is too slow while thinking costs seconds; realising it after implementing costs the interview.",
        "**4. If the brute force fits, write the brute force.** A correct O(n²) solution under a bound of 1000 is a complete answer, and there are no points for unnecessary cleverness.",
        "**5. If nothing you have fits, the gap tells you what to look for.** Needing to get from O(n²) to O(n log n) points at sorting; from O(n²) to O(n) points at hashing or two pointers. The required improvement narrows the search.",
      ],
    },
    {
      id: "module-close",
      heading: "Closing the module — and Module 0",
      body: [
        "That completes complexity analysis, and with it the whole of Module 0.",
        "**What you have now.** The language constructs — variables, types, operators, control flow, functions, recursion. Arrays and strings and the loops that go over them. The numeric foundations, including the two representations that lie. A survey of every data structure and what each costs. And the vocabulary to say what any of it costs and why.",
        "**The three habits worth carrying into Module 1.** Ask what each operation inside a loop costs before you write the loop. Read the constraints before the statement. State the brute force, then climb the ladder.",
        "**What changes next.** Module 0 explained the tools; Module 1 uses them. The structures get implemented rather than surveyed, the patterns get named and practised, and the problems stop being illustrations and start being the point.",
        "The last thing to say about complexity is that it is not an academic exercise appended to programming. It is the only reason to prefer one correct program over another, and every choice in the rest of this course is made on the grounds you now have the vocabulary to state.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does a constraint of n ≤ 20 tell you?",
      answer:
        "That an exponential solution is intended — 2²⁰ is about a million operations, comfortably within budget, while 2³⁰ would not be. It is nearly a signature for subset enumeration, bitmask dynamic programming or meet-in-the-middle. The bound was chosen by the setter precisely so the exponential approach fits, which means you should stop looking for a polynomial one and start thinking about how to enumerate subsets.",
    },
    {
      question: "How do you use constraints to guide your approach?",
      answer:
        "Read them before the problem statement and convert them to a target complexity using the operation budget of roughly 10⁸ per second: n ≤ 10 means permutations, n ≤ 20 means subsets, n ≤ 5,000 means quadratic, n ≤ 10⁶ means n log n or better. Then check every idea against that target before implementing it. It is most valuable for ruling approaches out — and when nothing you have fits, the size of the required improvement points at the technique, since n² to n log n suggests sorting and n² to n suggests hashing.",
    },
    {
      question: "What do secondary constraints tell you?",
      answer:
        "\"Modulo 10⁹ + 7\" means a counting or DP problem with an astronomically large answer. \"Values in the range 1 to n\" means an array can be indexed by value, enabling cyclic sort and index-marking tricks in O(1) space. \"Sorted input\" means binary search or two pointers. \"O(1) space\" or \"in place\" is the setter explicitly ruling out the easy solution to force the interesting one. Each restriction eliminates an approach, and eliminating enough of them identifies the intended one.",
    },
  ],
  takeaways: [
    "The constraint is chosen so the intended solution fits and the obvious one does not",
    "n ≤ 10 permutations, n ≤ 20 subsets, n ≤ 500 cubic, n ≤ 5,000 quadratic, n ≤ 10⁶ n log n",
    "n ≤ 20 is nearly a signature for bitmask DP",
    "At n = 10⁶ the log factor costs only 2 × 10⁷ — sorting is rarely what makes you too slow",
    "\"Modulo 10⁹ + 7\" means counting; \"values in 1…n\" means index by value",
    "\"O(1) space\" is the setter ruling out the easy answer on purpose",
    "Read constraints first, name the target aloud, check the idea before writing it",
    "If the brute force fits, write the brute force — there are no points for cleverness",
  ],
};
