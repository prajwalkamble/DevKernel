import type { Lesson } from "@/content/types";

export const twoPatternsLesson: Lesson = {
  id: "dsa-pattern-atlas-two-patterns",
  slug: "two-patterns-both-apply",
  moduleSlug: "pattern-atlas-drills",
  title: "When Two Patterns Both Apply",
  summary:
    "Ending the drill with two candidates is the normal outcome. Four tie-breakers that resolve it without writing either one, and the cases where the right answer is that both are fine.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Treat a two-candidate shortlist as progress rather than as being stuck",
    "Apply the four tie-breakers in order",
    "Recognise when both patterns are genuinely acceptable",
    "Say why the cheaper-to-write one usually wins in an interview",
  ],
  sections: [
    {
      id: "two-is-the-normal-outcome",
      heading: "Two is the normal outcome",
      body: [
        "A drill repetition that ends with \"either a heap or sorting\" has not failed. It has taken a dozen candidate patterns down to two, which is most of the distance, and the remaining choice is usually decided by something small and checkable.",
        "The failure mode is treating the tie as a signal to start coding one and see. That converts a ten-second decision into a ten-minute one, and it is how people end up committed to the harder of two equivalent solutions.",
        "There are four tie-breakers, and they resolve almost everything in the order they are listed.",
      ],
    },
    {
      id: "the-four-tie-breakers",
      heading: "The four tie-breakers",
      body: [
        "**One: the complexity target.** Often only one candidate fits. Sorting is `n log n`; a counting pass over a small value range is `n`. If the constraint is `n <= 10^7` with values under 100, that is not a tie any more. This is why the complexity output comes before the pattern output in the drill.",
        "**Two: a property in the constraints.** This is lesson four's question generalised. Each candidate needs something to be true \u2014 non-negative values, sortedness, a bounded alphabet, acyclicity \u2014 and the constraints usually say which of those hold. A candidate whose precondition is not stated is not a candidate; it is a bet.",
        "**Three: what the problem does most.** If the input arrives all at once and is used once, sorting is natural. If items arrive over time and you repeatedly need the extreme, that is a heap \u2014 the same asymptotic cost, a different shape of use. Streaming, online, \"as each query arrives\" all push the same way.",
        "**Four: which is shorter to write correctly.** Genuinely a tie-breaker and not a cop-out. Two solutions with the same complexity and the same preconditions are not equally good if one is fifteen lines and the other is forty with three off-by-one risks. In an interview this is decisive, and saying so out loud \u2014 \"both are `n log n`; I will sort, because it is less to get wrong\" \u2014 is a good answer, not a weak one.",
      ],
      pitfalls: [
        {
          title: "Coding one to find out",
          body: "The tie-breakers cost seconds and the experiment costs minutes, and the experiment usually does not settle it anyway -- you end up with a working solution and no idea whether the other was better.",
        },
        {
          title: "Picking the more impressive one",
          body: "Nobody is scoring novelty. A segment tree where a prefix array would do is a longer, riskier answer to the same question, and in an interview it reads as not having noticed the simpler option rather than as knowing the harder one.",
        },
      ],
    },
    {
      id: "when-both-are-right",
      heading: "When both really are fine",
      body: [
        "Sometimes the tie-breakers do not separate them, and that is a real answer rather than a failure of the method. Some genuinely interchangeable pairs, given the right constraints:",
        "**A hash map against sorting**, when you need grouping and the input is not otherwise ordered. One is `O(n)` expected, the other `O(n log n)` guaranteed, and which you prefer depends on whether you care more about the average or the worst case.",
        "**Recursion with memoisation against a bottom-up table.** Identical recurrence, identical complexity. Top-down only visits the states it needs, which matters when the table is sparse; bottom-up has no recursion depth to worry about and is usually easier to shrink to a rolling row.",
        "**BFS against DFS**, when the question is only \"can I get there\". They differ when the question is *shortest*, and not before.",
        "**Two pointers against binary search** on a sorted array, for pair-sum questions. One is `O(n)`, the other `O(n log n)`, but if you already had to sort, the sort dominates both.",
        "When you land here, say so and pick. \"Either works; I will use the map because the input is unsorted and I do not need order in the output\" is exactly the sentence an interviewer wants to hear \u2014 it shows the tie was noticed and resolved, which is more than picking the right one by luck shows.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "You can see two ways to solve this. How do you choose?",
      answer:
        "Four checks, in order. Does the complexity target rule one out -- sorting is n log n and a counting pass is linear, so a tight constraint often decides it. Does either one need a property the constraints do not promise -- non-negative values, sortedness, a bounded alphabet. Does the shape of use favour one -- if items arrive over time and I keep needing the extreme, that is a heap even though sorting has the same asymptotic cost. And if all three tie, I take the one that is shorter to write correctly, and I say why. That last one is a real reason, not a cop-out: two solutions with the same complexity are not equally good if one has three more off-by-one risks.",
    },
    {
      question: "Is it a problem if you cannot narrow it to a single pattern?",
      answer:
        "No -- getting from a dozen candidates to two is most of the work, and the last step is usually decided by something small and checkable rather than by insight. What is a problem is resolving the tie by starting to code one, because that turns a ten-second decision into a ten-minute one and often still does not settle it. And some pairs genuinely do not separate -- memoised recursion against a bottom-up table is the same recurrence twice -- in which case saying 'either works, I will take this one because...' is the right answer.",
    },
  ],
  takeaways: [
    "Two candidates is most of the way, not stuck",
    "Tie-breaker one: does the complexity target rule one out?",
    "Tie-breaker two: does either need a property the constraints do not promise?",
    "Tie-breaker three: does the shape of use — batch or streaming — favour one?",
    "Tie-breaker four: which is shorter to write correctly, said out loud",
    "Resolving the tie by coding one costs minutes and usually does not resolve it",
    "Some pairs are genuinely interchangeable; naming that is a good answer",
  ],
};
