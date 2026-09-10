import type { Lesson } from "@/content/types";

export const narratingTheOptimisationLesson: Lesson = {
  id: "dsa-interview-technique-narrating-the-optimisation",
  slug: "narrating-the-optimisation",
  moduleSlug: "interview-technique",
  title: "Narrating the Optimisation: Naming the Waste",
  summary:
    "The path from brute force to fast solution is not a leap, and the interviewer is assessing the path more than the destination. Every optimisation is the same sentence: here is the work being repeated, and here is what I store to avoid repeating it.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "State the waste in the brute force before naming the technique",
    "Use the standard sentence: what is recomputed, and what to store instead",
    "Explain a technique you have memorised as though you derived it",
    "Avoid the two failure modes: silent leaps and unmotivated pattern names",
  ],
  sections: [
    {
      id: "the-leap",
      heading: "The leap that reads badly",
      body: [
        "A candidate states the brute force, pauses for eight seconds, and says \"actually we can use a hash map here, that makes it `O(n)`\". The code is correct and the complexity is right.",
        "It still reads worse than a slower path, and the reason is that nothing was demonstrated except recall. The interviewer cannot distinguish this from \"I have seen this problem\", which is the one thing they are actively trying to distinguish it from.",
        "The problem is not that you recognised it. Recognition is the skill the pattern atlas module is built around, and you should recognise it. The problem is presenting recognition as though it were the reasoning, when the reasoning is what is being assessed.",
        "The fix costs one sentence, and it works whether you derived the answer or remembered it.",
      ],
    },
    {
      id: "the-sentence",
      heading: "The sentence",
      body: [
        "**\"The brute force recomputes X. If I store Y, I do not have to.\"**",
        "That is the shape of essentially every optimisation in this track, and saying it converts a leap into a derivation.",
        "*Two sum.* \"The brute force rescans the whole prefix looking for the complement of each number. If I store every number I have seen in a set, the rescan becomes one lookup.\"",
        "*Sliding window.* \"The brute force recomputes the sum of every window from scratch, and consecutive windows share all but two elements. If I keep the running sum, each step is one add and one subtract.\"",
        "*Memoised recursion.* \"The brute force recomputes `fib(30)` thousands of times. If I store each result the first time, each argument is computed once.\"",
        "*Dijkstra.* \"Scanning for the nearest unsettled node is a linear pass every time. If I keep them in a heap, it is a `log n` pop.\"",
        "In each case the second half names the data structure, but only after the first half has said what problem the data structure solves. That ordering is the whole technique \u2014 the structure arrives as a consequence rather than as a rabbit out of a hat.",
      ],
      pitfalls: [
        {
          title: "Naming the pattern instead of the waste",
          body: "\"This is a sliding window problem\" is a label. \"Consecutive windows share all but two elements, so recomputing the sum is waste\" is a reason, and the label follows from it for free.",
        },
        {
          title: "Long silences during the derivation",
          body: "Eight seconds of silence followed by the right answer is worse than thirty seconds of audible reasoning. If you are thinking, say what you are thinking about -- \"I am trying to work out whether the window can shrink and grow, or only grow\" is useful to the interviewer and costs you nothing.",
        },
        {
          title: "Deriving something you obviously recognised",
          body: "There is a dishonest version of this where you pretend to discover a technique you knew instantly, and it usually sounds like it. The honest version is fine and reads better: \"this is the two-sum shape -- the waste is rescanning the prefix for the complement, so a set of what I have seen removes it\". Recognition and reasoning in one sentence.",
        },
      ],
    },
    {
      id: "when-you-are-stuck-on-the-step",
      heading: "When you cannot find the waste",
      body: [
        "Sometimes there is no repeated computation to remove, and the optimisation is a different kind. It is worth having names for the other two.",
        "**The order is wrong.** Nothing is recomputed, but the work is being done in an order that makes it hard. Sorting first, or processing in topological order, or sweeping by coordinate. \"I do not think anything is being recomputed here \u2014 but if I sort by start time, each item only ever interacts with the previous one.\"",
        "**The search space is too big.** Nothing is repeated and the order is fine; there are simply too many candidates. Binary search on the answer, pruning, or a greedy argument that most candidates cannot be optimal. \"There are `n^2` pairs to consider, but if the array is sorted then for a fixed left index the valid rights are a contiguous range.\"",
        "Three named shapes \u2014 remove recomputation, change the order, shrink the search space \u2014 cover nearly everything, and saying which one you are looking for is itself progress the interviewer can see. \"I do not see any repeated work here, so I think this is an ordering problem rather than a caching one\" is a real contribution even if the next sentence takes you two minutes.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "You immediately recognise the optimal solution. Do you still explain the brute force?",
      answer:
        "Yes, and mostly for one sentence's worth of it, because the interviewer cannot tell recognition from reasoning unless I show the reasoning. The sentence I use is 'the brute force recomputes X, so if I store Y I do not have to' -- for two sum that is 'it rescans the prefix looking for each complement, so a set of what I have seen turns the rescan into a lookup'. That takes ten seconds and it makes the hash set arrive as a consequence rather than as a rabbit out of a hat. I would not pretend to discover something I recognised; saying 'this is the two-sum shape, and the waste it removes is the rescan' is honest and reads better than either half alone.",
    },
    {
      question: "You cannot see the optimisation. What do you say?",
      answer:
        "I name which kind I am looking for, because there are only about three and saying which one is real progress. Either something is being recomputed and I should store it; or nothing is recomputed but the order is wrong, which is sorting, sweeping, or topological order; or the order is fine and the search space is just too big, which is binary search on the answer, pruning, or a greedy argument. So I would say 'I do not see repeated work here, so I think this is an ordering problem rather than a caching one' and then start looking at what sorting would buy me. That is audible progress even when the next step takes two minutes.",
    },
  ],
  takeaways: [
    "The interviewer assesses the path more than the destination",
    "The sentence: the brute force recomputes X, so if I store Y I do not have to",
    "Name the waste before the structure — then the structure is a consequence",
    "\"This is a sliding window problem\" is a label; the shared elements are the reason",
    "Three shapes of optimisation: remove recomputation, change the order, shrink the search space",
    "Saying which shape you are hunting for is visible progress on its own",
    "Recognition is fine — present it alongside the reasoning, not instead of it",
  ],
};
