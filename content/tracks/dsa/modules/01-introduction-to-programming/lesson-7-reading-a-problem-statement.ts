import type { Lesson } from "@/content/types";

export const readingAProblemStatementLesson: Lesson = {
  id: "dsa-intro-reading-a-problem-statement",
  slug: "reading-a-problem-statement",
  moduleSlug: "introduction-to-programming",
  title: "Reading a Problem Statement",
  summary:
    "A problem statement has four parts and beginners read only one of them. What each part is for, the words that change everything, and how to extract the edge cases before you write a line.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Name the four parts of a problem statement and say what each is for",
    "Distinguish the pairs of words that most often cause a correct solution to the wrong problem",
    "Read a constraints block and extract what it is telling you",
    "Produce a list of edge cases from a statement, before writing any code",
  ],
  sections: [
    {
      id: "four-parts",
      heading: "The four parts",
      body: [
        "Every problem statement you will meet — on a judge, in an interview, in this track's sheet — has the same four parts. Reading only the first is the single most common way to waste twenty minutes.",
        "**The prose.** What is being asked, in English. Usually two or three sentences, sometimes wrapped in a story about a person delivering parcels. The story is decoration; strip it.",
        "**The constraints.** The ranges the inputs can take. `1 <= n <= 10^5`, `-10^9 <= nums[i] <= 10^9`. This is the most information-dense part of the statement and beginners skip it entirely.",
        "**The examples.** One or more inputs with their expected outputs, usually with a sentence of explanation. These exist to disambiguate the prose — when the words and the examples disagree, the examples are right.",
        "**The output specification.** Exactly what to return or print, and in what form. Often one line, often the source of a wrong answer on an otherwise correct solution.",
        "The order to read them in is not the order they are printed. Read the prose, then the examples, then the constraints, then the prose again. The second pass through the prose is where you catch what you misread the first time, and you will have misread something.",
      ],
    },
    {
      id: "words-that-matter",
      heading: "The words that change everything",
      body: [
        "A small number of word pairs account for a large share of solutions to the wrong problem. They look similar and mean entirely different things, and each one changes the algorithm.",
        "**Subarray against subsequence.** A subarray is contiguous — a slice. A subsequence keeps the order but may skip elements. `[1, 3]` is a subsequence of `[1, 2, 3]` but not a subarray. Sliding windows work on subarrays and are useless on subsequences.",
        "**Index against value.** \"Return the two numbers\" and \"return the indices of the two numbers\" are different problems, and the second forbids you from sorting without care, because sorting destroys the original positions.",
        "**Zero-indexed against one-indexed.** Most statements are zero-indexed. Some, notably Two Sum II, are not, and say so in one easily-skipped sentence. This is a wrong answer on a correct algorithm.",
        "**Distinct against unique.** \"All elements are distinct\" is a promise about the input that you may rely on. \"Return the unique elements\" is a requirement on your output. The same word, opposite directions.",
        "**Any against all against the smallest.** \"Return any valid answer\" means you need not think about ties. \"Return the lexicographically smallest\" means you must. Skipping this sentence produces a solution that is right and still fails.",
        "**Sorted.** If the input is sorted, that is not background information — it is the largest hint in the statement, and it usually rules out the approach you were about to take in favour of a faster one.",
      ],
      examples: [
        {
          id: "subarray-subsequence",
          title: "The same array, two different questions",
          lang: "python",
          code: `values = [5, -2, 3]

# Subarrays: contiguous slices only.
subarrays = []
for start in range(len(values)):
    for end in range(start + 1, len(values) + 1):
        subarrays.append(values[start:end])

# Subsequences: keep the order, skipping is allowed.
subsequences = [[]]
for value in values:
    subsequences += [existing + [value] for existing in subsequences]

print("subarrays   ", subarrays)
print("subsequences", sorted(subsequences, key=len))`,
          output: `subarrays    [[5], [5, -2], [5, -2, 3], [-2], [-2, 3], [3]]
subsequences [[], [5], [-2], [3], [5, -2], [5, 3], [-2, 3], [5, -2, 3]]`,
          explanation:
            "Six subarrays against eight subsequences for a three-element array — and the gap grows fast: there are n(n+1)/2 subarrays and 2ⁿ subsequences. `[5, 3]` appears in the second list and not the first, because it skips an element. That one word in the statement is the difference between a linear-time sliding window and an exponential search that needs dynamic programming.",
        },
      ],
      pitfalls: [
        {
          title: "Skimming the sentence after the examples",
          body: "The tie-breaking rule, the one-indexing note and the \"you may return the answer in any order\" permission all live in that easily-missed final sentence. It is often the only thing in the statement that decides between two implementations.",
        },
      ],
    },
    {
      id: "constraints",
      heading: "The constraints are the problem-setter talking to you",
      body: [
        "This is the part nobody tells beginners, and it is worth more than most of the rest of this lesson.",
        "The constraints are not administrative detail. They are the setter telling you what solution they intend, because they chose the limits to admit one approach and exclude another. Reading them backwards to a target complexity is the single highest-value habit in this whole track, and there is a full lesson on it in the Framework module.",
        "For now, the crude version is enough. Assume roughly 10⁸ simple operations per second.",
        "**n ≤ 20** — exponential is fine. They expect you to try every subset.",
        "**n ≤ 5,000** — O(n²) is fine. Nested loops are expected.",
        "**n ≤ 10⁵ or 10⁶** — you need O(n) or O(n log n). Nested loops will time out.",
        "**n ≤ 10⁹** — you cannot even look at every value. The answer is mathematical, or a binary search over the answer.",
        "Two more things hide in the constraints. The **value range** tells you whether an `int` will overflow — if values reach 10⁹ and you sum n of them, you need a `long`. And an explicit **space limit**, such as \"use only constant extra space\", is not an inconvenience; it is the setter banning the hash map to force a different technique.",
      ],
      examples: [
        {
          id: "constraints-reading",
          title: "The same problem at three sizes",
          lang: "bash",
          code: `"Find two numbers in the array that sum to the target."

  2 <= n <= 20          try every pair. n^2 = 400 operations. Done.
                        Do not be clever; clever costs you time and bugs.

  2 <= n <= 100000      n^2 = 10^10 operations. Far too slow.
                        You need one pass with a hash map, or sorting
                        plus two pointers.

  2 <= n <= 100000      the hash map is banned on purpose. Combined
  and O(1) extra space  with a sorted input, that leaves two pointers,
                        which is what they wanted all along.`,
          explanation:
            "The prose is identical in all three. Everything that decides the solution is in the constraints — and in the third case the space limit is not a restriction on a solution you had already chosen, it is the instruction that chooses it. Reading these two lines first would have saved the twenty minutes you were about to spend deciding.",
        },
      ],
    },
    {
      id: "edge-cases",
      heading: "Extracting the edge cases before you write anything",
      body: [
        "The constraints hand you your test cases directly, and this takes about thirty seconds once it is a habit.",
        "For every constraint of the form `a <= x <= b`, both ends are a test case. If `1 <= n <= 10⁵`, then n = 1 is a case and so is n = 10⁵. If values may be negative, an all-negative input is a case. If they may be equal, an all-identical input is a case.",
        "The standard list, which covers most of what breaks:",
        "**The smallest legal input.** Usually n = 1, sometimes n = 0. The most common crash there is.",
        "**Two elements.** Enough for the loop body to run once, which is where off-by-one errors surface.",
        "**All identical.** Breaks deduplication logic and anything assuming strict inequality.",
        "**All negative, or containing zero.** Breaks any accumulator initialised to 0 — exactly the bug in the previous lesson.",
        "**Already sorted, and reverse sorted.** Worst cases for a lot of algorithms.",
        "**The largest legal input.** Not for correctness but for speed, and for overflow.",
        "Write these down before coding. Doing so takes half a minute and finds bugs before they exist, which is much cheaper than finding them afterwards.",
      ],
      examples: [
        {
          id: "edge-case-derivation",
          title: "From constraints to a test list, mechanically",
          lang: "bash",
          code: `STATEMENT
  Return the largest sum of any non-empty contiguous subarray.
  1 <= n <= 10^5
  -10^4 <= nums[i] <= 10^4

WHAT EACH LINE HANDS YOU
  "non-empty"        the empty subarray is not an allowed answer,
                     so an all-negative input must return a negative
  "contiguous"       subarray, not subsequence - you may not skip
  n can be 1         [5] must work, and so must [-5]
  n can be 10^5      an O(n^2) solution will not finish
  values negative    an accumulator starting at 0 is wrong
  values to 10^4     10^5 * 10^4 = 10^9, which overflows a 32-bit int

TEST LIST, WRITTEN BEFORE ANY CODE
  [5]                       -> 5      smallest input
  [-5]                      -> -5     the all-negative trap
  [-3, -1, -2]              -> -1     the same trap, longer
  [1, 2, 3]                 -> 6      everything positive
  [5, -2, 3]                -> 6      crossing a negative is worth it
  [5, -20, 3]               -> 5      crossing this one is not
  100000 copies of 10^4     -> 10^9   overflow and timing together`,
          explanation:
            "Every line of that test list came from a line of the statement, mechanically — no cleverness and no experience required. This is the whole technique. Notice the last two rows in particular: `[5, -2, 3]` and `[5, -20, 3]` differ by one number and have different answers, which is precisely what a test is for.",
        },
      ],
    },
    {
      id: "restate",
      heading: "The one-sentence restatement",
      body: [
        "Finish by saying the problem back in your own words, in one sentence, using none of the statement's vocabulary.",
        "If you cannot, you have not understood it, and everything after that point is guessing. That is not a motivational claim — it is a genuinely reliable test, and it fails often enough to be worth doing every time.",
        "\"Given a list of numbers, find the biggest total you can make from a run of neighbours, where you have to take at least one.\" That is Maximum Subarray, with no jargon and every constraint that matters folded in. Somebody who can say that sentence can solve the problem; somebody who cannot, cannot, no matter how many algorithms they know.",
        "This is step one of the Framework module, which is where this thread is picked up properly. Everything in this lesson is the beginner-facing half of that method — and it is worth having now, because you can apply it to the very first problem you attempt.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between a subarray and a subsequence?",
      answer:
        "A subarray is contiguous — a slice of consecutive elements. A subsequence preserves relative order but may skip elements. For `[1, 2, 3]`, `[1, 3]` is a subsequence but not a subarray. It matters because the counts and the techniques differ completely: there are n(n+1)/2 subarrays and 2ⁿ subsequences, and sliding-window techniques apply only to the contiguous case. Misreading one for the other is the most common way to solve the wrong problem correctly.",
    },
    {
      question: "The constraints say n ≤ 10^5. What does that tell you?",
      answer:
        "That an O(n²) solution will not pass — 10¹⁰ operations is far beyond what runs in a second — so the intended answer is O(n) or O(n log n). It also hints at what is available: O(n log n) admits sorting, which suggests two pointers or a greedy after sorting; O(n) suggests a hash map or a single pass with a window. Reading the constraint first narrows the search before you have considered a single algorithm.",
    },
    {
      question: "How do you decide what to test before writing any code?",
      answer:
        "Take the boundaries directly from the constraints. Every `a <= x <= b` gives two test cases at the ends. If values may be negative, test an all-negative input; if they may repeat, test all-identical. Add the smallest legal input, a two-element input, and the largest legal input for timing and overflow. The list falls out of the statement mechanically, and writing it before coding means you design for those cases rather than discovering them after a failed submission.",
    },
  ],
  takeaways: [
    "A statement has four parts: prose, constraints, examples, output spec — and beginners read only the prose",
    "Read prose, then examples, then constraints, then the prose again; the second pass catches the misreading",
    "Subarray is contiguous, subsequence may skip — different counts, different techniques",
    "Indices against values, zero- against one-indexed, and tie-breaking rules are wrong answers on correct algorithms",
    "Constraints are the setter telling you the intended solution: n ≤ 20 exponential, n ≤ 5000 quadratic, n ≤ 10⁵ linear-ish",
    "A stated space limit is usually banning a structure on purpose, not adding an inconvenience",
    "Every `a <= x <= b` hands you two test cases; write the list before writing code",
    "If you cannot restate the problem in one sentence without its vocabulary, you have not understood it yet",
  ],
};
