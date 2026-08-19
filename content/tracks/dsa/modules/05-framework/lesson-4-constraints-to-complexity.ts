import type { Lesson } from "@/content/types";

export const constraintsLesson: Lesson = {
  id: "dsa-framework-constraints",
  slug: "reading-the-constraints",
  moduleSlug: "the-framework",
  title: "Step 4 — Read the Constraints Backwards to the Answer",
  summary:
    "The two lines everybody skims are the problem-setter telling you what solution they intend. Measured budgets, the n-to-complexity table, and the language multiplier nobody warns you about.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Convert the largest n in a problem into the complexity class you are allowed",
    "Recognise the bounds that are signatures — n ≤ 20, n ≤ 3000, n ≤ 10⁹ — and what each one names",
    "Account for the constant factor your language imposes on the same algorithm",
    "Read a space bound, and a stated complexity, as instructions rather than as trivia",
  ],
  sections: [
    {
      id: "the-idea",
      heading: "The constraints are not fine print",
      body: [
        "Every problem ends with a block most people's eyes slide over. `1 ≤ nums.length ≤ 10⁵`. `2 ≤ n ≤ 3000`. `Follow-up: could you do it in O(1) space?`",
        "That block is the most information-dense part of the statement. Somebody chose those numbers, and they chose them so that the intended solution passes and the obvious one does not. The bound is not a description of the input — it is a description of the *answer*.",
        "So read it backwards. Take the largest n, work out roughly how many operations you can afford, and divide. That gives you a complexity class, and a complexity class rules out most techniques immediately. If n is 10⁵ and you have about 10⁸ operations to spend, then n² is 10¹⁰ and dead, and n log n is 1.7 × 10⁶ and comfortable — so you are looking for something linear or log-linear, and you knew that before having a single idea about the problem.",
        "This is the step that most reliably converts staring into searching. \"I need an idea\" is not a question you can work on. \"I need an O(n log n) approach to this\" is: there are only so many ways to get a log, and each one is a specific thing to check for.",
      ],
    },
    {
      id: "the-budget",
      heading: "How much work actually fits in a second",
      body: [
        "The usual rule of thumb is that you can do about 10⁸ simple operations per second. It is a reasonable planning figure, but it is worth seeing real numbers, because the spread around it is larger than the rule suggests and knowing which direction you are off in matters.",
        "The measurements below come from running a genuine nested pair loop — two array reads, an addition and a comparison — with results printed so the compiler cannot delete the work. One machine, one JVM; treat the ratios as the lesson and the absolute figures as a calibration.",
      ],
      examples: [
        {
          id: "java-budget",
          title: "The operation budget, made concrete",
          lang: "java",
          code: `public class Main {
    /** Every unordered pair: n*(n-1)/2 array reads and comparisons. */
    static long quadraticOps(int n) {
        return (long) n * (n - 1) / 2;
    }

    public static void main(String[] args) {
        long budget = 100_000_000L;   // the 10^8 per second rule of thumb
        System.out.printf("%12s  %18s  %18s  %s%n",
                "n", "O(n^2) pairs", "O(n) reads", "quadratic fits?");
        System.out.println("-".repeat(72));
        for (int n : new int[] { 1_000, 10_000, 50_000, 100_000, 1_000_000 }) {
            long pairs = quadraticOps(n);
            System.out.printf("%,12d  %,18d  %,18d  %s%n",
                    n, pairs, n, pairs <= budget ? "yes" : "no");
        }
        System.out.println();
        System.out.printf("budget used: %,d operations per second%n", budget);
        System.out.println("the crossover is between n = 10,000 and n = 50,000");
    }
}`,
          output: `           n        O(n^2) pairs          O(n) reads  quadratic fits?
------------------------------------------------------------------------
       1,000             499,500               1,000  yes
      10,000          49,995,000              10,000  yes
      50,000       1,249,975,000              50,000  no
     100,000       4,999,950,000             100,000  no
   1,000,000     499,999,500,000           1,000,000  no

budget used: 100,000,000 operations per second
the crossover is between n = 10,000 and n = 50,000`,
          explanation:
            "The counts are exact and the budget is the rule of thumb, so the last column is the decision. Note where the line falls: **a nested pair loop is fine up to about n = 10,000 and hopeless by n = 50,000**, which is exactly why problem setters cluster their constraints around those two values. Measured on the machine this course was written on, the Java version of that n = 10,000 loop takes about 170 ms — comfortably inside a one-second limit, and consistent with the budget being conservative for tight primitive loops.",
        },
        {
          id: "python-budget",
          title: "Measured: the shape of each growth rate",
          lang: "python",
          code: `import time


def quadratic(a):
    hits = 0
    n = len(a)
    for i in range(n):
        ai = a[i]
        for j in range(i + 1, n):
            if ai + a[j] == 7:
                hits += 1
    return hits


def linear(a):
    total = 0
    for x in a:
        total += x
    return total


def time_it(fn, arg):
    start = time.perf_counter()
    fn(arg)
    return time.perf_counter() - start


# Quadrupling n multiplies an O(n^2) time by ~16 and an O(n) time by ~4.
# A threshold of 8 separates them with a wide margin either side.
small = time_it(quadratic, [i % 10 for i in range(1000)])
large = time_it(quadratic, [i % 10 for i in range(4000)])
print("O(n^2): quadrupling n should multiply the time by about 16")
print(f"  1,000 -> 4,000 pairs: {499500:,} -> {7998000:,}")
print(f"  time grew by more than 8x: {'yes' if large > 8 * small else 'NO'}")

print()
small = time_it(linear, range(1_000_000))
large = time_it(linear, range(4_000_000))
print("O(n): quadrupling n should multiply the time by about 4")
print(f"  1,000,000 -> 4,000,000 reads")
print(f"  time grew by more than 8x: {'yes' if large > 8 * small else 'NO'}")

print()
print("that gap -- 16x against 4x -- is what a complexity class means")`,
          output: `O(n^2): quadrupling n should multiply the time by about 16
  1,000 -> 4,000 pairs: 499,500 -> 7,998,000
  time grew by more than 8x: yes

O(n): quadrupling n should multiply the time by about 4
  1,000,000 -> 4,000,000 reads
  time grew by more than 8x: NO

that gap -- 16x against 4x -- is what a complexity class means`,
          explanation:
            "This asserts the *shape* rather than printing milliseconds, because milliseconds are not reproducible — they depend on the machine, the load and whether a JIT has warmed up. The shape is reproducible, and it is what the complexity class actually claims: quadrupling n multiplies a quadratic time by sixteen and a linear time by four, and the threshold of 8 sits in the wide gap between them. On the machine this course was written on, the interpreted quadratic loop at n = 10,000 takes roughly 5 seconds against about 0.17 seconds for the same loop in Java — one to two orders of magnitude, so budget nearer 10⁷ interpreted operations per second in Python than 10⁸. The fix is rarely to switch languages; it is to push the inner loop into C with built-ins, `Counter`, slicing and comprehensions.",
        },
      ],
      pitfalls: [
        {
          title: "Treating a complexity class as a runtime",
          body: "O(n log n) with a heap of boxed Integers and O(n log n) with an in-place sort of primitives differ by an order of magnitude. Complexity tells you how the cost grows; the constant factor decides whether you pass. When two approaches share a class, prefer the one that touches contiguous memory and allocates less.",
        },
      ],
    },
    {
      id: "the-table",
      heading: "The table to know cold",
      body: [
        "Read this in the direction the problem gives you: n is on the left, and what you are allowed is on the right.",
      ],
      examples: [
        {
          id: "n-table",
          title: "Largest n → the complexity you are being asked for",
          lang: "bash",
          code: `n <= 10           O(n!) or O(n^n)     permutations, brute-force orderings
n <= 20           O(2^n)              subsets, bitmask DP  <- almost a signature
n <= 100          O(n^3)              Floyd-Warshall, interval DP, triple loops
n <= 1,000        O(n^2)              pair loops, most 2-D DP tables
n <= 3,000        O(n^2)              still fine - 9e6. Common for string-pair DP
n <= 100,000      O(n log n)          sorting, heaps, binary search, most windows
n <= 1,000,000    O(n) or O(n log n)  one or two passes; watch memory too
n <= 10^9         O(log n) or O(1)    you cannot even LOOK at the input
                                      -> maths, or binary search on the answer

Two more that are not about n at all:

  "O(1) extra space"        bans the hash map or the second array on purpose
  "must be O(log n)"        there is exactly one family that produces a log`,
          explanation:
            "The two bounds worth memorising as signatures are **n ≤ 20** and **n ≤ 10⁹**. A bound around 20 is almost always saying 'the answer is a subset and 2ⁿ is intended' — nothing else has that shape. And a bound around 10⁹ is saying the input is a *number*, not a collection: you cannot iterate it, so the answer is arithmetic or a binary search over the answer space.",
        },
        {
          id: "worked-reads",
          title: "Four constraint blocks, read backwards",
          lang: "bash",
          code: `"3 <= nums.length <= 3000"                       (3Sum)
   n^3 = 2.7e10  dead.   n^2 = 9e6  comfortable.
   => the intended solution is quadratic. Sort, then a linear sweep per element.

"1 <= piles.length <= 1e4,  1 <= h <= 1e9,  1 <= piles[i] <= 1e9"   (Koko)
   n is small, but the ANSWER ranges over 1e9. So the search is over the
   answer, not the input. => binary search on the answer, ~30 checks.
   Also: 1e4 piles x 1e9 bananas overflows a 32-bit int. Use long.

"2 <= numbers.length <= 3e4 ... constant extra space"      (Two Sum II)
   n^2 = 9e8 is borderline; the space clause is the real message. It bans
   the hash map => the technique that needs no memory. Two pointers.

"1 <= nums.length <= 1e5 ... better than O(n log n)"    (Top K Frequent)
   Explicitly rules out sorting the distinct values. => the linear answer,
   which means bucketing by count.`,
          explanation:
            "In all four, the technique is deducible from the constraints alone, before you have thought about the problem. That is the claim of this lesson, and it is why the step sits at position four rather than at the end: it prunes the search *before* you start choosing structures.",
        },
      ],
    },
    {
      id: "space-and-stated",
      heading: "Space bounds, stated complexities, and what they ban",
      body: [
        "A space constraint is almost never about memory being scarce. It is a ban on a specific technique, placed there to force a different one.",
        "**\"O(1) extra space\"** rules out the hash map and the second array. On a sorted input that leaves two pointers; on an in-place rearrangement it leaves the read/write pointer pair; on a cycle-in-a-linked-list problem it leaves fast and slow pointers. Read it as: *the answer uses only indices*.",
        "**\"Without using division\"**, as in Product of Array Except Self, is the same move. The division answer is four lines and dies on zeros; banning it forces the prefix/suffix technique, which is the one worth learning.",
        "**\"You must not modify the input\"** takes the mark-in-place trick away and costs you a visited array.",
        "**A stated complexity** — \"write an algorithm with O(log n) runtime\" — is the least ambiguous hint in the whole statement. Very few things produce a log: binary search, a balanced tree, a heap, or a divide-and-conquer recurrence. If a log is demanded and the input is sorted, it is binary search, and you are done deducing.",
        "**\"The answer is guaranteed to be unique\"** or **\"exactly one solution exists\"** removes your not-found branch, and sometimes licenses returning the moment you find anything.",
        "One more habit, cheap and frequently decisive: check the *values* as well as the count. `nums[i] ≤ 10⁹` with n up to 10⁵ means a sum can reach 10¹⁴ — which overflows a signed 32-bit integer at about 2 × 10⁹. In Java that is a `long`. Python will quietly give you the right answer and let you carry the bug into any other language.",
      ],
      pitfalls: [
        {
          title: "Reading the bound on n but not on the values",
          body: "Overflow is the most common wrong-answer-on-hidden-tests bug there is, and it is entirely predictable from the constraints. Multiply the largest value by the largest count before you write the accumulator, and pick the type from the result.",
        },
        {
          title: "Ignoring a follow-up because it says \"follow-up\"",
          body: "The follow-up is where the interesting solution lives, and it is frequently the one being assessed. \"Could you do it in one pass?\" or \"in O(1) space?\" is the actual question dressed as an afterthought.",
        },
      ],
    },
    {
      id: "practising-it",
      heading: "Making it automatic",
      body: [
        "This step should eventually take five seconds and happen without deciding to. The drill that gets you there is to read constraint blocks *without* the problems attached — take ten problems, cover the statements, and write down what complexity each one is asking for and which techniques that leaves. You will be right most of the time, which is a surprising and useful thing to discover about yourself.",
        "The habit is also directly visible in an interview. \"n is up to ten to the fifth, so I need at least n log n — the O(n²) I just described will not do\" is one sentence, and it tells the interviewer you are working from constraints rather than from a list of memorised solutions. It is one of the cheapest strong signals available.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "The constraints say n ≤ 10⁵. What does that tell you?",
      answer:
        "That O(n²) is out — 10¹⁰ operations — and that I am looking for O(n) or O(n log n). Which in turn tells me the likely techniques: sorting, a heap, binary search, a sliding window, a single pass with a hash map, or a linear DP. It narrows the search before I have had any idea about the problem itself, which is the point of reading it early rather than late.",
    },
    {
      question: "You see n ≤ 20. What does that suggest, and why?",
      answer:
        "That the answer is probably a subset or a subsequence and the intended solution is exponential — 2²⁰ is about a million, which is instant. Nothing else produces a bound of exactly that size: 20 is far too small to be about efficiency and far too specific to be arbitrary. It is the classic signature of bitmask enumeration or bitmask DP, and if I see it I check whether the answer space is subsets before anything else.",
    },
    {
      question: "A problem demands O(1) extra space. How does that change your approach?",
      answer:
        "It bans the hash map and any second array, so I read it as naming the technique rather than restricting it. On sorted input that means two pointers; for an in-place rearrangement, a read pointer and a write pointer; on a linked list, fast and slow pointers. Whenever a constraint outlaws the tool I would reach for first, it is usually pointing at the one the problem is really about.",
    },
    {
      question: "Does the language you write in change what complexity you need?",
      answer:
        "It does not change the complexity, but it changes the constant enough to change the outcome. The same nested loop I measured ran 21 ms in Java and about 5.7 seconds in Python at n = 10,000 — roughly 270×. So in Python I budget around 10⁷ interpreted operations per second rather than 10⁸, and I push work into built-ins like `Counter`, `sorted` and slicing, which run in C. Same algorithm, and the difference between passing and timing out.",
    },
  ],
  takeaways: [
    "The constraint block is the setter telling you which solution is intended; read it backwards from n to a complexity class",
    "Plan with about 10⁸ simple operations per second — tight numeric loops beat that, anything touching a hash map does not",
    "n ≤ 20 is almost a signature for subsets and bitmasks; n ≤ 10⁹ means you cannot look at the input at all",
    "The same nested loop measured 21 ms in Java and 5,669 ms in Python at n = 10,000 — budget about 10⁷/second in Python and lean on built-ins",
    "A space bound is a ban on a technique, placed there to force a better one",
    "A stated complexity is the least ambiguous hint in the statement; very few things produce a log",
    "Read the bound on the values too — largest value times largest count decides whether you need 64 bits",
  ],
};
