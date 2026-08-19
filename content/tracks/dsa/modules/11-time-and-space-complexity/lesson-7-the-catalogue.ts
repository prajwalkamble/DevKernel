import type { Lesson } from "@/content/types";

export const theCatalogueLesson: Lesson = {
  id: "dsa-cx-catalogue",
  slug: "the-complexities-worth-memorising",
  moduleSlug: "time-and-space-complexity",
  title: "The Complexities Worth Memorising",
  summary:
    "One table of every technique's cost, and one problem solved three ways to show what the differences are actually worth.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Recall the cost of every standard technique without deriving it",
    "Recognise the improvement ladder that most problems follow",
    "Quote the standard library and structure costs from memory",
    "Measure what a complexity improvement is actually worth",
  ],
  sections: [
    {
      id: "the-table",
      heading: "The table",
      body: [
        "These are the numbers you should be able to state without thinking. Every one has been derived somewhere in this course; this is the reference card.",
      ],
      examples: [
        {
          id: "catalogue",
          title: "Every technique, with its cost",
          lang: "python",
          code: `rows = [
    ("linear scan", "O(n)", "O(1)", "sum, max, count, membership in a list"),
    ("binary search", "O(log n)", "O(1)", "sorted array only"),
    ("sorting", "O(n log n)", "O(n) / O(1)", "the usual first move"),
    ("hash lookup", "O(1) avg", "O(n)", "the usual second move"),
    ("two pointers", "O(n)", "O(1)", "sorted array, palindromes, pairs"),
    ("sliding window", "O(n)", "O(k)", "subarrays and substrings"),
    ("prefix sums", "O(n) build", "O(n)", "then O(1) per range query"),
    ("BFS / DFS", "O(V + E)", "O(V)", "graphs and grids"),
    ("heap top-k", "O(n log k)", "O(k)", "k largest, k closest"),
    ("all pairs", "O(n^2)", "O(1)", "when n is small"),
    ("all subsets", "O(2^n)", "O(n)", "n <= 20"),
    ("all permutations", "O(n!)", "O(n)", "n <= 10"),
]

w = max(len(r[0]) for r in rows)
print(f"{'technique':<{w}}  {'time':<12} {'space':<12} typical use")
print("-" * 78)
for r in rows:
    print(f"{r[0]:<{w}}  {r[1]:<12} {r[2]:<12} {r[3]}")`,
          output: `technique         time         space        typical use
------------------------------------------------------------------------------
linear scan       O(n)         O(1)         sum, max, count, membership in a list
binary search     O(log n)     O(1)         sorted array only
sorting           O(n log n)   O(n) / O(1)  the usual first move
hash lookup       O(1) avg     O(n)         the usual second move
two pointers      O(n)         O(1)         sorted array, palindromes, pairs
sliding window    O(n)         O(k)         subarrays and substrings
prefix sums       O(n) build   O(n)         then O(1) per range query
BFS / DFS         O(V + E)     O(V)         graphs and grids
heap top-k        O(n log k)   O(k)         k largest, k closest
all pairs         O(n^2)       O(1)         when n is small
all subsets       O(2^n)       O(n)         n <= 20
all permutations  O(n!)        O(n)         n <= 10`,
          explanation:
            "Note `O(V + E)` for graph traversal rather than O(n²) — a graph has two size parameters and collapsing them is wrong for sparse graphs, where E is closer to V than to V². The bottom three rows are the exponential techniques, and the n limits beside them are the real practical bounds from the operation-budget rule.",
        },
      ],
    },
    {
      id: "the-ladder",
      heading: "The improvement ladder",
      body: [
        "Most problems have the same progression, and knowing it means you always have a next move.",
        "**O(n!) or O(2ⁿ)** — try every arrangement or every subset. Always correct, almost always too slow. It is a fine thing to state as the baseline.",
        "**O(n²)** — try every pair. Usually the obvious solution.",
        "**O(n log n)** — sort first. Sorting frequently exposes structure that makes the rest linear, so \"what if it were sorted?\" is the single most productive question to ask.",
        "**O(n)** — one pass, usually with a hash map, two pointers or a sliding window.",
        "**O(log n) or O(1)** — a mathematical insight or a precomputed structure.",
        "The practical technique: **state the brute force out loud, then climb.** It shows the interviewer you have a correct baseline, and each rung suggests the next.",
      ],
      examples: [
        {
          id: "three-ways",
          title: "One problem, three rungs, measured",
          lang: "python",
          code: `def has_pair_bruteforce(values, target):
    ops = 0
    for i in range(len(values)):
        for j in range(i + 1, len(values)):
            ops += 1
            if values[i] + values[j] == target:
                return True, ops
    return False, ops


def has_pair_sorted(values, target):
    ops = 0
    s = sorted(values)
    ops += len(values)          # charge the sort roughly
    lo, hi = 0, len(s) - 1
    while lo < hi:
        ops += 1
        total = s[lo] + s[hi]
        if total == target:
            return True, ops
        if total < target:
            lo += 1
        else:
            hi -= 1
    return False, ops


def has_pair_hash(values, target):
    ops = 0
    seen = set()
    for v in values:
        ops += 1
        if target - v in seen:
            return True, ops
        seen.add(v)
    return False, ops


values = list(range(1000))
target = 1997          # 998 + 999, the very last pair

for name, fn in [("brute force O(n^2)", has_pair_bruteforce),
                 ("two pointers O(n log n)", has_pair_sorted),
                 ("hash set O(n)", has_pair_hash)]:
    found, ops = fn(values, target)
    print(f"{name:<26} found={found}  operations={ops:>9,}")`,
          output: `brute force O(n^2)         found=True  operations=  499,500
two pointers O(n log n)    found=True  operations=    1,999
hash set O(n)              found=True  operations=    1,000
`,
          explanation:
            "Half a million operations against a thousand, for the same answer — a **500× difference at n = 1000 alone**, and it widens with n. The middle solution is worth keeping in mind even though it is slower: it uses O(1) extra space where the hash version uses O(n), so it is the right answer when memory is the constraint or when the array is already sorted.",
        },
      ],
    },
    {
      id: "library-costs",
      heading: "Library and structure costs",
      body: [
        "The other half of the memorisation, since a wrong assumption here silently changes your algorithm's complexity.",
        "**Python.** `list` index O(1), append amortised O(1), `insert(0)`/`pop(0)` O(n), `in` O(n), `sort` O(n log n), slicing O(k). `dict`/`set` insert, lookup and delete O(1) average, `in` O(1). `deque` both ends O(1), indexing the middle O(n). `heapq` push/pop O(log n), `heapify` O(n).",
        "**Java.** `ArrayList` get O(1), add amortised O(1), `add(0, x)`/`remove(0)` O(n), `contains` O(n). `HashMap`/`HashSet` O(1) average. `TreeMap`/`TreeSet` O(log n) for everything, including floor and ceiling. `ArrayDeque` both ends O(1). `PriorityQueue` offer/poll O(log n), peek O(1), and **`contains` and `remove(Object)` are O(n)**.",
        "**String operations in both.** Length and index O(1); substring, concatenation, case conversion and split all O(n) and allocating.",
        "The two that catch people most often: **`list.contains` / `x in list` is O(n)**, and **`PriorityQueue.remove(Object)` is O(n)** despite everything else on a heap being logarithmic.",
      ],
      pitfalls: [
        {
          title: "Assuming `LinkedList.get(i)` is O(1)",
          body: "It is O(i) — the list walks from the nearest end. Since the syntax is identical to `ArrayList.get`, a `for (int i = 0; i < list.size(); i++) list.get(i)` loop over a `LinkedList` is quadratic while the same loop over an `ArrayList` is linear. Use an iterator or a for-each loop, which is O(1) per step for both.",
        },
      ],
    },
    {
      id: "what-improvements-buy",
      heading: "What an improvement is actually worth",
      body: [
        "Some perspective, so effort goes where it pays.",
        "**O(n²) → O(n log n)** is usually the difference between failing and passing. At n = 10⁶ it is 10¹² operations against 2 × 10⁷ — six orders of magnitude.",
        "**O(n log n) → O(n)** is a factor of about 20 at a million. Real, and rarely the difference between accepted and rejected. Worth doing when it falls out naturally; not worth contorting the code for.",
        "**O(n) → O(log n)** is enormous when it is possible, and it usually requires the data to be sorted or preprocessed — so it is really a trade against setup cost.",
        "**Halving a constant factor** changes no complexity class and can still matter in practice. Say what it is honestly: \"this is still O(n), about twice as fast\" is a better answer than claiming an improvement you did not make.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the usual progression when improving a solution?",
      answer:
        "From exponential — every subset or arrangement — to O(n²) by trying every pair, to O(n log n) by sorting, to O(n) with a hash map, two pointers or a sliding window, and occasionally to O(log n) with a mathematical insight or precomputation. The productive habit is to state the brute force out loud first, which establishes a correct baseline, and then climb. \"What if it were sorted?\" is the single most useful question, because sorting often exposes structure that makes everything after it linear.",
    },
    {
      question: "How much is an improvement from O(n²) to O(n) actually worth?",
      answer:
        "At n = 1000, measurably about 500× — half a million operations against a thousand for the same pair-sum answer — and the gap widens with n. The bigger step is O(n²) to O(n log n), which at a million is 10¹² against 2 × 10⁷ and is usually the difference between finishing and not. Going from O(n log n) to O(n) is only about 20× at a million, so it is worth taking when it falls out naturally and rarely worth contorting the code for.",
    },
    {
      question: "Which library operations have surprising complexities?",
      answer:
        "`x in list` and `list.contains` are O(n) while the set and map versions are O(1) — the most common source of an accidental quadratic. `LinkedList.get(i)` is O(i) despite looking identical to `ArrayList.get`, so an indexed loop over one is quadratic. `PriorityQueue.remove(Object)` and `contains` are O(n) even though push and pop are logarithmic. And every string operation that appears to modify — substring, concatenation, case conversion, split — is O(n) and allocates.",
    },
  ],
  takeaways: [
    "Sorting O(n log n), hash lookup O(1), two pointers and sliding window O(n)",
    "Graph traversal is O(V + E), not O(n²) — a graph has two size parameters",
    "Subsets are O(2ⁿ) with n ≤ 20; permutations are O(n!) with n ≤ 10",
    "The ladder: exponential → n² → n log n → n → log n; state the brute force, then climb",
    "\"What if it were sorted?\" is the most productive single question",
    "Pair-sum at n = 1000: 499,500 operations brute force against 1,000 with a hash set",
    "`x in list` is O(n); `PriorityQueue.remove(Object)` is O(n); `LinkedList.get(i)` is O(i)",
    "O(n²) → O(n log n) decides pass or fail; O(n log n) → O(n) is about 20× at a million",
  ],
};
