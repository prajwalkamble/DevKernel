import type { Lesson } from "@/content/types";

export const writingTheCodeLesson: Lesson = {
  id: "dsa-framework-write",
  slug: "only-now-write-the-code",
  moduleSlug: "the-framework",
  title: "Step 7 — Only Now, Write the Code",
  summary:
    "State the invariant first and the loop writes itself. The three tests to run every time, and the failures that come from typing before deciding.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Write the invariant as a comment before the loop, and derive the loop body from it",
    "Name variables after their meaning so the code documents the decisions already made",
    "Run the same three tests on every solution, in the same order",
    "Recognise the bug classes that come from coding before deciding",
  ],
  sections: [
    {
      id: "invariant-first",
      heading: "Write the invariant before the loop",
      body: [
        "You have the structure and the pattern. The temptation is now to type the template from memory and adjust it until the examples pass. That works often enough to feel fine and it is how people end up with solutions they cannot explain — and cannot fix when a hidden test fails.",
        "The alternative costs one line. **Before the loop, write down what will be true every time it goes round.** Not what the loop does — what it *keeps true*.",
        "\"The window between left and right never contains a repeat.\" \"The stack holds the indices whose answer is not yet known, in decreasing order of value.\" \"prefix[i] is the sum of the first i elements.\" \"Every pair not yet ruled out lies between lo and hi.\"",
        "Once that sentence exists, the loop body is not a creative act. It has exactly two jobs: do the step, and restore the invariant if the step broke it. In a sliding window that is precisely `include the new element` followed by `while the window is invalid, shrink it`. The `while` is there because one removal may not be enough — and you know that from the invariant, not from a test failing.",
        "The invariant also tells you what to return and when the answer is valid. If the window is always valid, then its width is always a candidate, so `best = max(best, width)` belongs at the end of every iteration and needs no guard. That is a decision derived rather than debugged.",
        "And it is the sentence the interviewer wants. \"The window is always repeat-free, so its width is always a candidate\" demonstrates understanding in a way that correctly-typed code does not.",
      ],
      examples: [
        {
          id: "invariant-driven",
          title: "The invariant, then the loop it implies",
          lang: "java",
          code: `// INVARIANT: the window [left, right] never contains a repeated character.
//            So its width is always a legal candidate for the answer.
Map<Character, Integer> lastSeen = new HashMap<>();
int best = 0;
int left = 0;

for (int right = 0; right < s.length(); right++) {
    char c = s.charAt(right);

    // The step: extend right. This may break the invariant.
    Integer prev = lastSeen.get(c);

    // Restore it: if c is inside the window, move left past its last position.
    // "prev >= left" is the check that prev is INSIDE the window and not a
    // stale index from before it - which is what the invariant demands.
    if (prev != null && prev >= left) {
        left = prev + 1;
    }
    lastSeen.put(c, right);

    // Invariant holds again, so the width is a candidate. No guard needed.
    best = Math.max(best, right - left + 1);
}
return best;`,
          explanation:
            "Every line is justified by the comment above it. In particular `prev >= left` — the guard people leave out and then cannot explain — is *forced* by the invariant: the invariant is about the window, so an index outside the window is irrelevant and must be ignored. Written this way it is a consequence. Written from memory it is a mystery you either recall or do not.",
        },
      ],
      pitfalls: [
        {
          title: "Typing a template and adjusting until the examples pass",
          body: "This produces code that passes the given examples and fails the hidden ones, and leaves you unable to say why either happened. If you cannot state the invariant, you do not yet understand the solution — you have memorised its shape.",
        },
      ],
    },
    {
      id: "naming",
      heading: "Name things after what they mean",
      body: [
        "In a solution that will live for twenty minutes, naming still matters — because the names are where the decisions from steps 1 to 6 are recorded, and because you will be reading this code aloud.",
        "`i`, `j`, `k` are fine as pure indices in a nested enumeration. Everything else should say what it holds. `left` and `right` for window edges. `lo` and `hi` for a binary search range. `cheapest`, `endingHere`, `mostCommon`, `lastSeen`, `unresolved` — each of those names is a fact about the algorithm, and a wrong one is immediately visible.",
        "The best example is Kadane's two variables. Call them `a` and `b` and the classic bug — returning the running value instead of the best-ever value — is invisible. Call them `endingHere` and `best` and `return endingHere` looks wrong on sight, because the names say they are different things.",
        "Two more habits worth keeping. Extract the feasibility check in a binary-search-on-the-answer into a named method — `hoursNeeded`, `canShipInDays` — so the search and the check can be verified separately. And keep the direction offsets for a grid in one array rather than four copy-pasted blocks, so a sign error has one place to hide instead of four.",
      ],
    },
    {
      id: "three-tests",
      heading: "The three tests, in this order, every time",
      body: [
        "Do not submit and see. Run these three, in order, before anything else touches the code.",
        "**1 · The example you worked by hand in step 2.** You already know the answer, and you derived it yourself rather than reading it. If this fails, the misunderstanding is in the algorithm, not the code.",
        "**2 · The edge cases you harvested.** Empty, one element, all identical, all negative, the extremes the constraints allow. You listed these before coding precisely so that you would not have to think of them now, when you are attached to the code being right.",
        "**3 · The brute force, on random inputs.** The differential test from step 3. Tiny inputs, small alphabet, seeded generator, a few thousand trials. This is the one that finds the bug you did not think of — and it is worth remembering that in the demonstration earlier in this module, the buggy sliding window passed every example the problem statement itself provides, and fell on the ninth random five-character string.",
        "In an interview you will not run all three, but you should *narrate* all three. Trace the small example out loud, name the edge cases and say what the code does on each, and say \"and I'd verify this against the brute force on random inputs\". That sequence is a large fraction of what is being assessed, and it costs about ninety seconds.",
      ],
    },
    {
      id: "bug-classes",
      heading: "The bugs that come from typing before deciding",
      body: [
        "Almost every bug in this kind of code falls into one of six classes, and each of them is a step you skipped rather than a mistake you made.",
        "**Off-by-one at the boundary.** `lo <= hi` against `lo < hi`, `n - 1` against `n`, a window width of `right - left` instead of `right - left + 1`. The fix is to test the one-element case, which is why it is on the edge-case list. The deeper fix is to pick one binary-search convention and never mix it with the other.",
        "**Overflow.** `(lo + hi) / 2` on large indices; a sum of 10⁵ values of 10⁹ in a 32-bit `int`. Predictable entirely from the constraints — multiply the largest value by the largest count before choosing the accumulator type. Python will not warn you, which makes it a habit worth having anyway.",
        "**Wrong initial value.** `best = 0` when the answer can be negative; `cheapest = 0` when it should be `+∞`. This comes from skipping the edge-case harvest, where the all-negative case would have forced the decision.",
        "**Mutating while iterating.** Removing from a collection inside a `for` over it. Java throws `ConcurrentModificationException`, which is a gift; Python silently skips elements, which is not.",
        "**Aliasing.** `List<List<Integer>> grid = new ArrayList<>(Collections.nCopies(n, row))` gives you the same row n times. In Python, `[[0] * m] * n` is the same trap and catches people constantly. Build with a comprehension or a loop.",
        "**Returning the running value instead of the best value.** Kadane returning `endingHere`; a tree diameter returning the height instead of recording the diameter. This is a naming failure as much as a logic one — the invariant distinguishes the two, and good names make the confusion visible.",
      ],
      examples: [
        {
          id: "aliasing",
          title: "The aliasing trap, in both languages",
          lang: "python",
          code: `# WRONG: one row, referenced three times
grid = [[0] * 3] * 3
grid[0][0] = 1
print(grid)          # [[1, 0, 0], [1, 0, 0], [1, 0, 0]]

# RIGHT: three independent rows
grid = [[0] * 3 for _ in range(3)]
grid[0][0] = 1
print(grid)          # [[1, 0, 0], [0, 0, 0], [0, 0, 0]]`,
          output: `[[1, 0, 0], [1, 0, 0], [1, 0, 0]]
[[1, 0, 0], [0, 0, 0], [0, 0, 0]]`,
          explanation:
            "`* 3` on a list of lists copies the *reference* three times, not the list. It is the single most common Python bug in DP problems, where a 2D table is the first thing you build — and the symptom is a table where every row is identical, which looks like a recurrence bug and is not. Java's `new int[n][m]` allocates properly, so this particular trap is Python-specific; Java's version is `Collections.nCopies` and `Arrays.fill` with an object.",
        },
      ],
    },
    {
      id: "after",
      heading: "After it works",
      body: [
        "Two minutes at the end, and they are the ones that make the next problem easier.",
        "**Say the complexity out loud, both of them.** Time and space, with the variables named — \"O(n) time, O(k) space where k is the alphabet size\". If you cannot say it, you do not fully understand what you wrote. In an interview, volunteering it is expected; being asked for it is a small mark against you.",
        "**Write down the one sentence that unlocked it.** Not the solution — the realisation. \"Counts are bounded by n, so they can be array indices.\" \"The shorter line is finished, because every other pair using it is narrower and no taller.\" \"A stale last-seen index is behind the window and must be ignored.\"",
        "That sentence is what transfers. You will not remember this problem's code in a month, and it does not matter; you will remember that counts can be indices, and that will solve a different problem. Collecting those sentences is what turns a pile of solved problems into a working method — and it is the difference between having done four hundred problems and having learned from them.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Walk me through how you'd verify your solution before saying you're done.",
      answer:
        "Three passes. First the small example I worked by hand at the start, traced through the code out loud. Then the edge cases I listed before coding — empty, single element, all identical, all negative, the extremes the constraints allow — saying what the code does on each. Then, if I had a machine, a differential test against the brute force on a few thousand tiny random inputs, because that is what finds the case I did not think of. Then I state the time and space complexity unprompted.",
    },
    {
      question: "What is a loop invariant and why would you write one down?",
      answer:
        "It is the property the loop keeps true on every iteration — the window is always repeat-free, the stack always holds unresolved indices in decreasing order, the target is always inside [lo, hi]. Writing it before the loop turns the body into two mechanical jobs: take the step, then restore the invariant if the step broke it. It also tells me where the answer may be recorded, because a candidate answer is only legal at a point where the invariant holds. And it is what I say out loud to explain the solution, because it is the reason the algorithm is correct rather than a description of what it does.",
    },
    {
      question: "What is the most common bug in the code you write for these problems?",
      answer:
        "Boundaries and initial values. Off-by-one at the loop condition, and starting an accumulator at zero when the answer can be negative — maximum-subarray on an all-negative array is the standard case. Both are caught by the same discipline: list the edge cases before writing code, so the initialisation is a decision I made rather than a default I inherited. After that it is overflow, which is entirely predictable from the constraints if I multiply the largest value by the largest count before choosing the type.",
    },
  ],
  takeaways: [
    "Write the invariant before the loop; the body then has only two jobs — take the step, restore the invariant",
    "The invariant also tells you where a candidate answer is legal, which removes guards you would otherwise debug into place",
    "Name variables after their meaning: `endingHere` and `best` make Kadane's classic bug visible, `a` and `b` hide it",
    "Run the same three tests every time — your hand-worked example, the harvested edge cases, then the brute force on tiny random inputs",
    "Six bug classes cover almost everything: boundary, overflow, wrong initial value, mutation while iterating, aliasing, and returning the running value instead of the best",
    "State both complexities out loud when you finish",
    "Write down the one sentence that unlocked the problem — that sentence transfers, the code does not",
  ],
};
