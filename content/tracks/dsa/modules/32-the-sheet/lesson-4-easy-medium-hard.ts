import type { Lesson } from "@/content/types";

export const easyMediumHardLesson: Lesson = {
  id: "dsa-the-sheet-easy-medium-hard",
  slug: "easy-medium-hard",
  moduleSlug: "the-sheet",
  title: "The Easy–Medium–Hard Progression Within a Pattern",
  summary:
    "Difficulty labels are a property of the problem, not of the pattern, and sorting a sheet by them cuts across the thing you are trying to learn. What the progression inside a single pattern should be instead.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Say what a difficulty label is actually measuring",
    "Explain why sorting a whole sheet by difficulty is the wrong axis",
    "Sequence a single pattern from plain to composed",
    "Recognise a hard problem that is hard for a reason you should skip",
  ],
  sections: [
    {
      id: "what-the-label-measures",
      heading: "What the label measures",
      body: [
        "A difficulty label on a problem is a blend of at least four different things, and they pull apart.",
        "**How obscure the pattern is.** A problem can be labelled hard purely because it needs a technique most people have not met.",
        "**How many patterns are composed.** Binary search on the answer, where the feasibility check is itself a greedy sweep, is two patterns and is labelled hard for that reason alone. Each individual piece is medium.",
        "**How fiddly the implementation is.** Some problems are conceptually two lines and take forty lines to write, with three off-by-one opportunities. That is real difficulty and it is a different skill.",
        "**How well hidden the reduction is.** \"This is secretly a graph\" is a hard problem where every component is easy.",
        "Those are four different difficulties with four different fixes, and one label averages them. That is why the label is nearly useless for deciding what to work on next \u2014 and why sorting an entire sheet by it cuts straight across the pattern grouping you actually need.",
      ],
    },
    {
      id: "the-right-axis",
      heading: "The progression that does work",
      body: [
        "The useful progression is *within* a pattern, and it is by how much else is going on, not by the label.",
        "**Stage one: the pattern alone.** Nothing else in the problem. The point is the skeleton, and you should be able to write it without thinking by the end of this stage.",
        "**Stage two: the pattern with a twisted condition.** Same machinery, different predicate. The point is that the skeleton survives the change, and that the bookkeeping is where the bugs are.",
        "**Stage three: the pattern in disguise.** A statement that does not announce it. The point is recognition, and this is the stage most sections are short of.",
        "**Stage four: the pattern composed with one other.** Binary search whose check is a sweep; DP whose transition needs a heap. The point is that composition is its own skill and it does not arrive for free from knowing both pieces.",
        "Notice that stage four problems will mostly be labelled hard and stage one problems mostly easy \u2014 so the label correlates with the progression without being it. Following the label gets you roughly the right order inside a pattern and completely the wrong order across patterns.",
      ],
      pitfalls: [
        {
          title: "Doing all the easies first, across every pattern",
          body: "This is the most common way to organise a sheet and it is the previous lessons' mistake twice over: it breaks dependency order and it guarantees partial coverage of everything. It also feels excellent, because the completion rate is high.",
        },
        {
          title: "Skipping stage one because it is beneath you",
          body: "Stage one is where the skeleton becomes automatic, and automatic is what frees attention for the twist in stage two. Doing one plain problem badly-remembered and then three twisted ones is how you end up debugging the skeleton in every single problem.",
        },
        {
          title: "Treating a fiddly problem as a conceptual gap",
          body: "Forty lines with three off-by-one risks is an implementation difficulty, not a recognition one. It is worth practising and it is a different session -- do not conclude you do not understand the pattern.",
        },
      ],
    },
    {
      id: "hard-for-the-wrong-reason",
      heading: "Hard for a reason you should skip",
      body: [
        "Some hard problems are hard in ways that will not transfer, and being willing to skip them is a real skill.",
        "**Hard because of an obscure named algorithm.** If a problem needs a technique that appears in one problem in five hundred, learning it is a poor trade against another pass over something common. Note it, skip it, move on.",
        "**Hard because of a mathematical identity.** Some problems reduce to a combinatorial or number-theoretic fact you either know or do not. The DSA content in them is thin.",
        "**Hard because of an enormous case analysis.** Fifteen cases, each easy. That is a patience exercise and it is worth doing occasionally, but it teaches almost nothing per hour.",
        "**Hard because the statement is badly written.** These exist. Reading them carefully is a genuine skill, and you will get more of it from ten clear statements than from one bad one.",
        "The ones to persist with are the opposite: hard because the reduction is hidden, or because two patterns are composed. Both of those transfer directly, and both are what interview problems actually are.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you decide whether to attempt a hard problem?",
      answer:
        "By asking what makes it hard, because the label averages four different things. If it is hard because the reduction is hidden -- it is secretly a graph, or secretly binary search on the answer -- or because two patterns are composed, I will spend the time, because both of those transfer and both are what interview problems actually are. If it is hard because it needs an obscure named algorithm, or a number-theoretic identity, or a fifteen-case analysis, I will note it and skip it: the return per hour is poor against another pass over something common. And if it is hard because it is forty fiddly lines, that is real but it is an implementation session, not a sign that I have not understood the pattern.",
    },
    {
      question: "Should you work through all the easy problems first?",
      answer:
        "No -- that sorts on the wrong axis twice. It breaks dependency order, because easy problems come from every pattern including ones whose prerequisites you have not covered, and it guarantees partial coverage of everything, which is worth less than full coverage of a few. The progression that works is within a pattern: the pattern alone, then with a twisted condition, then disguised in a statement that does not announce it, then composed with one other pattern. That correlates with the difficulty label without being it -- so following the label gets you roughly the right order inside a pattern and completely the wrong order across them.",
    },
  ],
  takeaways: [
    "A difficulty label averages obscurity, composition, fiddliness and hidden reduction",
    "Those are four different difficulties with four different fixes",
    "The progression that works is within a pattern, by how much else is going on",
    "Plain, then twisted condition, then disguised, then composed with one other",
    "Stage three — disguised — is where recognition is built and where sheets are thinnest",
    "All-the-easies-first breaks dependency order and guarantees partial coverage",
    "Skip hard-because-obscure and hard-because-identity; persist with hard-because-hidden",
    "Fiddly is a real difficulty and a different session",
  ],
};
