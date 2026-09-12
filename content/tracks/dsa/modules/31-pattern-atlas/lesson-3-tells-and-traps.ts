import type { Lesson } from "@/content/types";

export const tellsAndTrapsLesson: Lesson = {
  id: "dsa-pattern-atlas-tells-and-traps",
  slug: "tells-and-traps",
  moduleSlug: "pattern-atlas-drills",
  title: "The Phrases That Give a Pattern Away, and the Ones That Mislead",
  summary:
    "A working vocabulary of statement phrasing: which words genuinely narrow the search, which ones people treat as tells and should not, and why the reliable ones are reliable.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "List the phrases that reliably narrow the pattern, and say what each rules in",
    "Name the common false tells and what they actually indicate",
    "Explain why a tell works, rather than memorising the association",
    "Use a tell as a hypothesis to check rather than a conclusion",
  ],
  sections: [
    {
      id: "why-tells-work-at-all",
      heading: "Why a tell works at all",
      body: [
        "A tell is not magic and it is not pattern-matching on vocabulary. It works when the phrase names a *property* that a particular technique requires.",
        "\"Sorted array\" is a real tell because sortedness is exactly the precondition for binary search and for the opposite-ends two-pointer sweep. The phrase is not associated with the technique by convention; it states the thing the technique needs.",
        "\"Contiguous\" is a real tell for the same reason. A subarray is defined by two indices, which is what makes a window or a prefix-sum difference able to describe it. A subsequence is not, and the techniques that work on subarrays mostly do not transfer.",
        "That is the test for whether something is a tell worth learning: can you say, in one sentence, what property the phrase asserts and which technique needs that property? If you can, it will generalise to statements you have not seen. If you cannot, you have memorised a coincidence.",
      ],
    },
    {
      id: "the-reliable-ones",
      heading: "The reliable ones",
      body: [
        "**\"Sorted\"** \u2014 binary search, or two pointers from opposite ends. The property is order, and both techniques are ways of discarding half the remaining candidates using it.",
        "**\"Contiguous\" / \"subarray\" / \"substring\"** \u2014 sliding window or prefix sums. The property is that the answer is described by two indices. Which of the two you want is the subject of the next lesson.",
        "**\"Subsequence\" (order kept, gaps allowed)** \u2014 usually dynamic programming, though \"is s a subsequence of t\" is two pointers and \"smallest subsequence\" is a monotonic stack. The property is that each element has an independent take-or-leave decision, which is `2^n` choices with overlapping subproblems.",
        "**\"Subset\" / \"any order\"** with a small `n` \u2014 bitmask enumeration or bitmask DP. Order not mattering plus `n <= 20` is the pair that names it.",
        "**\"Kth largest\" / \"top k\" / \"median so far\"** \u2014 a heap, or two heaps. The property is that you need one end of an ordering repeatedly and do not need the rest sorted.",
        "**\"Next greater\" / \"nearest smaller\" / \"how long until\"** \u2014 a monotonic stack. The property is that an element resolves an unknown number of earlier pending elements, and once resolved they never come back.",
        "**\"Minimum number of steps\" on an unweighted graph or grid** \u2014 breadth-first search. The property is that every move costs the same, which is exactly when layer order equals distance order.",
        "**\"Can we achieve X with cost at most C\"**, or \"maximise the minimum\" / \"minimise the maximum\" \u2014 binary search on the answer. The property is monotonicity in the answer: if `C` works then every larger `C` works, so the feasible set is a prefix and you can bisect it.",
        "**\"Prerequisites\" / \"dependencies\" / \"must come before\"** \u2014 topological order. The property is a directed acyclic relation, and the give-away is that the statement is describing edges.",
        "**\"Merge these groups\" / \"are these two connected\"** with the groups only ever growing \u2014 union-find.",
      ],
    },
    {
      id: "the-false-ones",
      heading: "The ones that mislead",
      body: [
        "**\"Maximum\" or \"minimum\"** tells you almost nothing. It appears in greedy problems, DP problems, binary-search-on-the-answer problems, shortest-path problems and sorting problems. Treating it as a DP signal is one of the most common recognition errors, and lesson five is about the specific version of it.",
        "**\"Optimal\"** is worse, because it sounds more technical. It is the same word as \"maximum\" with a suit on.",
        "**\"Tree\"** is ambiguous in a way that matters. It might mean a rooted binary tree with children, a general tree given as edges, or a graph that happens to be acyclic. The techniques differ, and the statement usually says which within a line or two.",
        "**\"Efficient\"** is not a constraint. The constraints are the constraint. A statement asking for an efficient solution and permitting `n <= 500` is satisfied by `O(n^2)`, and in a compiled language by `O(n^3)`.",
        "**\"Count the ways\"** is a weak DP signal at best. Counting is often combinatorics with a closed form, and often a single pass with a hash map. It becomes a real DP signal when combined with \"and each step depends on the previous choice\".",
        "**\"Array\"** narrows nothing at all, and neither does \"string\" \u2014 a string problem is an array problem with a small alphabet, which is itself sometimes the tell (26 buckets).",
        "**A story about robots, or cars, or a warehouse.** The setting is decoration. Strip it, and the same statement is usually one of a dozen shapes. The habit of restating in your own words exists partly to strip it.",
      ],
      pitfalls: [
        {
          title: "Treating a tell as a conclusion",
          body: "A tell is a hypothesis with a good prior, not an answer. \"Contiguous\" narrows you to two candidate patterns, and picking between them needs the rest of the statement. The failure mode is committing to the first pattern the vocabulary suggests and then spending the next twenty minutes defending it.",
        },
        {
          title: "Learning tells you cannot justify",
          body: "If you cannot say which property the phrase asserts and which technique needs it, the association will not transfer -- it will fire on a statement that shares the word and not the property, which is exactly when it costs you the most.",
        },
        {
          title: "Ignoring the tell that is a negation",
          body: "\"The values may be negative\", \"the graph may have cycles\", \"the intervals may overlap\" are tells too, and they work by removing a technique rather than suggesting one. They are easy to skim past because they sound like edge-case housekeeping.",
        },
      ],
    },
    {
      id: "using-them-in-the-drill",
      heading: "Using them in the drill",
      body: [
        "In the sixty-second drill, the tells do their work between the restatement and the structure. Read, restate, then scan for phrases \u2014 and write down every candidate the phrasing suggests, not just the first.",
        "Two or three candidates is a normal and healthy result. \"Contiguous\" and \"sum\" gives you window and prefix map. \"Maximum\" and \"choices\" gives you greedy and DP. Having two is not being stuck; it is having narrowed a dozen patterns to two, which is most of the work. The next two lessons are each about resolving one of those pairs, and lesson six is about the general case.",
        "The other use is diagnostic. When you get one wrong, ask which phrase you fired on and whether it was one of the reliable ones. A wrong answer that came from \"maximum, so DP\" is a different error from a wrong answer that came from \"sorted, so binary search\" \u2014 the first is a bad rule and the second is a good rule applied to a statement where a second property mattered more.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What in a problem statement makes you reach for binary search?",
      answer:
        "Two different things. The obvious one is a sorted input, because order is exactly the property that lets you discard half the candidates. The less obvious and more useful one is a question of the form 'can this be done with cost at most C', or 'maximise the minimum', or 'minimise the maximum' -- because those are monotone in the answer. If C works then every larger C works, so the feasible values form a prefix and you can bisect over the answer rather than over the input. That second form is the one people miss, and the tell is the monotonicity, not the word 'search'.",
    },
    {
      question: "Is 'find the maximum' a signal for dynamic programming?",
      answer:
        "No, and treating it as one is a common way to go wrong. Maximum and minimum appear in greedy problems, sorting problems, shortest-path problems and binary-search-on-the-answer problems just as often. The real DP tell is that a decision depends on the answer to a smaller version of the same question -- something like 'to take this item I need the best result over everything before it'. If each choice can be made from local information alone, it is probably greedy. The word 'maximum' does not distinguish those two at all.",
    },
    {
      question: "How do you use a keyword tell without being misled by it?",
      answer:
        "By requiring a justification. A tell is only worth keeping if I can say in one sentence which property the phrase asserts and which technique needs that property -- 'sorted' asserts order and binary search needs order; 'contiguous' asserts the answer is two indices and a window needs that. If I can say it, the tell transfers to statements I have not seen. If I cannot, I have memorised a coincidence that will fire on the wrong problem. And I treat the result as a shortlist, not an answer -- two candidates is a normal outcome and the rest of the statement picks between them.",
    },
  ],
  takeaways: [
    "A tell works when the phrase names the property a technique requires — otherwise it is a coincidence",
    "\"Sorted\" means order, which is what binary search and opposite-end two pointers need",
    "\"Contiguous\" means the answer is two indices, which is what a window or a prefix difference describes",
    "\"Maximise the minimum\" and \"can it be done with cost at most C\" mean binary search on the answer",
    "\"Maximum\", \"optimal\" and \"efficient\" narrow nothing; the constraints do the narrowing",
    "Negations are tells too: values may be negative, the graph may have cycles",
    "The story about robots is decoration — restating in your own words strips it",
    "Ending with two candidate patterns is a good outcome, not a stuck one",
  ],
};
