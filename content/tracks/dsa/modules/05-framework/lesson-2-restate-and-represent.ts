import type { Lesson } from "@/content/types";

export const restateAndRepresentLesson: Lesson = {
  id: "dsa-framework-restate",
  slug: "restate-and-represent",
  moduleSlug: "the-framework",
  title: "Steps 1 & 2 — Restate It, Then Work It By Hand",
  summary:
    "The two minutes that decide whether you solve the problem in front of you or a slightly different one — and the specific words in a statement that change the entire answer.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Restate a problem in one sentence using none of its own vocabulary",
    "Name the exact input and output types, including indexing base and mutability",
    "Work the smallest interesting example by hand before writing anything",
    "Spot the handful of words — contiguous, distinct, sorted, in place — that silently change the problem",
  ],
  sections: [
    {
      id: "restate",
      heading: "Step 1 — say it in your own words",
      body: [
        "Problem statements are written to be unambiguous, not to be understood. They are dense, they use their own vocabulary, and they hide the actual question inside two paragraphs of setup about Koko and her bananas. The first job is to throw all of that away and produce one sentence.",
        "The rule that makes this work: **use none of the statement's own words**. If you find yourself saying \"return the maximum length of a substring such that…\", you have paraphrased rather than understood — you have copied the sentence with the nouns moved around. The test is whether you could say your sentence to somebody who has not read the problem and have them understand what is wanted.",
        "This takes thirty seconds and it catches the single most expensive class of error there is: solving the adjacent problem. You can write a correct, efficient, well-tested solution to a question nobody asked, and in an interview you will find out at minute twenty.",
        "If you cannot produce the sentence, stop. That is not a signal to push on and hope it clarifies — it is the finding. Re-read, work an example, and come back. Everything downstream consumes this sentence.",
      ],
      examples: [
        {
          id: "restatements",
          title: "Statements, and the sentence underneath them",
          lang: "bash",
          code: `STATEMENT   "Given an array of integers nums and an integer target, return
             indices of the two numbers such that they add up to target."
RESTATED    Find where two of these numbers add up to a given total.

STATEMENT   "Return the length of the longest substring without repeating
             characters."
RESTATED    How long a run can I take from this text before a letter comes back?

STATEMENT   "Koko loves to eat bananas. There are n piles... return the minimum
             integer k such that she can eat all the bananas within h hours."
RESTATED    How slowly can I work and still finish on time?

STATEMENT   "Return all the triplets [nums[i], nums[j], nums[k]] such that
             i != j, i != k, j != k, and nums[i] + nums[j] + nums[k] == 0."
RESTATED    Find every group of three of these numbers that cancel out. Groups
            of the same three values count once, however many ways I can pick them.`,
          explanation:
            "The Koko restatement is the one worth studying. Once it is 'how slowly can I work and still finish on time', the bananas are gone and what is left is a shape: **the smallest input to a process that still meets a deadline**. That shape has a standard answer — binary search on the answer — which you cannot see while the problem is still about a monkey.",
        },
      ],
      pitfalls: [
        {
          title: "Paraphrasing instead of restating",
          body: "\"Return the max length of a substring with no repeats\" is the statement with shorter words. The test is not brevity, it is independence: could someone who has not read the original follow your sentence? If your sentence still contains the statement's technical nouns, you have not translated it, you have compressed it.",
        },
        {
          title: "Restating from the solution",
          body: "If you half-recognise a problem, it is tempting to restate it as the technique you think it wants — \"this is a sliding window problem\". That is not a restatement, it is a guess wearing one, and it will lock you into the wrong pattern before you have any evidence. Describe what is wanted, never how to get it.",
        },
      ],
    },
    {
      id: "the-words",
      heading: "The words that change everything",
      body: [
        "A small number of words carry enormous weight, and every one of them is easy to read past. When you restate, check each of these explicitly.",
        "**Contiguous / substring / subarray** against **subsequence.** A subarray is a slice; a subsequence can skip. This one word decides whether a sliding window is available at all — a window is contiguous by construction, so if the problem says subsequence, no window will ever work. It is the difference between an O(n) problem and a DP problem.",
        "**Distinct** against **unique.** \"Return all distinct triplets\" means de-duplicate the *output*; \"the array has distinct values\" is a promise about the *input*. They look similar and demand opposite work.",
        "**Sorted.** If the input is sorted, that is not decoration — it is a permission slip. It licenses binary search and two pointers, and it usually means the hash-map answer, though correct, is not the intended one.",
        "**In place** / **O(1) extra space.** An explicit ban on the obvious structure. Read it as the setter pointing at the technique that does not need one.",
        "**Indices** against **values.** If indices are wanted, sorting destroys the answer unless you carry positions along. This is the whole difference between Two Sum and Two Sum II.",
        "**Exactly one solution exists** / **the answer is guaranteed unique.** A promise that removes your not-found case, and sometimes an invitation to return early.",
        "**At most k** against **exactly k.** \"At most\" is monotone and window-friendly; \"exactly\" usually is not, and is computed as *at most k* minus *at most k−1*.",
      ],
      examples: [
        {
          id: "one-word",
          title: "One word, two different problems",
          lang: "bash",
          code: `"the longest SUBARRAY with at most 2 distinct values"
    contiguous  -> sliding window, O(n), about eight lines

"the longest SUBSEQUENCE with at most 2 distinct values"
    may skip    -> not a window at all. Count occurrences of each pair of
                   values; the answer is the best pair total. Different
                   algorithm, different complexity, different structure.

"return the INDICES of the two numbers that sum to target"
    positions   -> sorting loses the answer; hash map from value to index

"return the two NUMBERS that sum to target"
    values      -> sorting is free; two pointers, O(1) space`,
          explanation:
            "In both pairs, one word is the entire difference. Nothing else in the statement changed. This is why the restatement has to be a translation rather than a paraphrase — a paraphrase preserves the words you skimmed, and a translation forces you to have understood them.",
        },
      ],
    },
    {
      id: "represent",
      heading: "Step 2 — types in, types out, and one example by hand",
      body: [
        "Now pin down the shape of the thing. Two parts, both mechanical, both quick.",
        "**Write the signature.** What exactly goes in, and what exactly comes out? An array of what? Can it be empty? Is the output an index, a count, a boolean, a list of lists? Is the indexing 0-based or 1-based? May you modify the input? Half of these are answered by the constraints and the other half by the examples; if one is genuinely unanswered, that is a clarifying question worth asking out loud in an interview.",
        "**Work the smallest interesting example by hand.** Not the one in the statement — the statement's examples are chosen to be illustrative, not to be revealing. Take something with three or four elements, and compute the answer on paper.",
        "That second part is doing more than it looks. When you compute an answer by hand you are forced to invent a procedure, because your hand has no memory of a solution. Whatever you did with the pencil — scanning for the smallest, keeping a running total, crossing out pairs — is a first algorithm. It is usually the brute force, which is step 3, and it arrived without you having to think of anything.",
        "It is also where the misreadings surface. If your hand-worked answer disagrees with the statement's example, you have misunderstood the problem, and you have found out in twenty seconds instead of after twenty minutes of coding.",
      ],
      examples: [
        {
          id: "by-hand",
          title: "Working it by hand invents the algorithm for you",
          lang: "bash",
          code: `Problem: largest sum of any contiguous stretch.  nums = [-2, 1, -3, 4, -1, 2]

By hand, with a pencil:

  start at -2   running total -2   ... that is worse than starting fresh at 1
  start at  1   running total  1   then 1 + -3 = -2, worse than starting at -3
  start at  4   running total  4   4 + -1 = 3, 3 + 2 = 5   <- best so far
  answer 5

What did the pencil do?

  It kept a running total, and every time the total went NEGATIVE it
  abandoned it and started fresh at the current element.

That is Kadane's algorithm. It was not recalled - it fell out of doing
the arithmetic by hand on six numbers.`,
          explanation:
            "This is why step 2 is not busywork. Working the example forces you to be a procedure, and the procedure you improvise is nearly always the seed of the real algorithm. People who skip this step are trying to remember an algorithm; people who do it are watching one appear.",
        },
      ],
      pitfalls: [
        {
          title: "Only using the statement's examples",
          body: "Provided examples are chosen to illustrate the happy path, and they frequently hide the case that breaks you. The `[3, 3]` case in Two Sum, the `\"abba\"` case in longest-substring, the all-negative case in maximum-subarray — none of those appear in the original statements. Invent your own small cases, particularly ones with duplicates, ties, and everything the same.",
        },
        {
          title: "Skipping the by-hand pass because the problem \"looks easy\"",
          body: "The problems that look easy are exactly the ones where you will get an edge case wrong, because you never slowed down enough to meet it. Two minutes with a pencil on a four-element input is the cheapest bug-finding you will ever do.",
        },
      ],
    },
    {
      id: "edge-cases",
      heading: "Harvesting the edge cases while they are cheap",
      body: [
        "While the problem is still in your head rather than in your editor, write down the inputs that are likely to break whatever you end up writing. It costs a minute now and saves a debugging session later — and in an interview, naming them unprompted is one of the strongest signals you can send.",
        "The list is nearly always the same, which is what makes it a habit rather than an act of insight: the empty input; a single element; two elements; everything the same; already sorted, and sorted backwards; all negative; the maximum and minimum allowed values; and — the one people miss — the case where the answer does not exist.",
        "Check each against the constraints as you go. Half of them will be ruled out (`2 ≤ n` means no empty input, and no one-element input either), and knowing which ones are impossible is as useful as knowing which are dangerous, because it tells you which guards you do not have to write.",
      ],
      examples: [
        {
          id: "edge-harvest",
          title: "Two minutes of edge cases, before any code",
          lang: "bash",
          code: `Problem: maximum subarray sum.  Constraints: 1 <= n <= 1e5, -1e4 <= nums[i] <= 1e4

  []             ruled out by the constraints - n >= 1. No guard needed.
  [5]            answer 5. Must return the element, not 0.
  [-3]           answer -3. If my code returns 0 here it is wrong.
  [-3, -1, -2]   answer -1. ALL NEGATIVE - the killer case.
  [1, 2, 3]      answer 6, the whole array.
  [5, -1, 5]     answer 9 - keeps a negative because what follows pays for it.

The two that matter: all-negative, and the single element. Both say the
same thing - the running best cannot start at 0, because "take nothing"
is not a legal answer here.

That is a decision made before writing a line, rather than a bug found
after submitting.`,
          explanation:
            "Notice the harvest produced a **design decision**, not just a test list: `best` must be initialised to `nums[0]`, never to 0. That decision is the difference between a solution that passes and one that fails on a single hidden test — and it came from two minutes of listing inputs, not from cleverness.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the first thing you do when given a problem in an interview?",
      answer:
        "Read it, then say back what I think is being asked in one sentence in my own words, and confirm it. Then pin the signature down — types in, type out, what the input can contain, whether I may modify it — and ask about anything the statement leaves open. Then work a small example by hand out loud. It takes about two minutes, it catches misunderstandings while they are free, and it shows the interviewer I solve the problem in front of me rather than the one I assume.",
    },
    {
      question: "How would you tell a subarray problem from a subsequence problem, and why does it matter?",
      answer:
        "A subarray is contiguous, a subsequence may skip elements. It matters because contiguity is what makes a sliding window possible: a window is a contiguous range by construction, so if elements can be skipped, no window applies and it is almost certainly dynamic programming instead. The words to watch are 'substring' and 'subarray' for contiguous, 'subsequence' for skippable — and it is worth confirming out loud, because they are one word apart and a different algorithm.",
    },
    {
      question: "Which edge cases do you check without being asked?",
      answer:
        "Empty input, one element, two elements, all elements identical, all negative, already sorted and reverse sorted, the extreme values the constraints allow, and the case where no answer exists. I check each against the constraints first, because half are usually ruled out and that tells me which guards I do not need. The all-negative and single-element cases in particular tend to force a decision about initialisation rather than just producing a test.",
    },
  ],
  takeaways: [
    "Restate the problem in one sentence using none of its own vocabulary; if you cannot, that is the work, not a reason to push on",
    "Contiguous, distinct, sorted, in place, indices, exactly-k — each of these words alone can change the algorithm entirely",
    "Write the signature: types in, type out, indexing base, and whether the input may be modified",
    "Work a small example by hand, because being the procedure yourself invents the brute force without you recalling anything",
    "Invent your own examples — the provided ones illustrate the happy path and hide the case that breaks you",
    "Harvest edge cases before coding; they frequently produce design decisions, not just tests",
  ],
};
