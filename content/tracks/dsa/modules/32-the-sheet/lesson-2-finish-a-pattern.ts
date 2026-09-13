import type { Lesson } from "@/content/types";

export const finishAPatternLesson: Lesson = {
  id: "dsa-the-sheet-finish-a-pattern",
  slug: "finish-a-pattern",
  moduleSlug: "the-sheet",
  title: "Topic-Wise Sheets: Finishing a Pattern Before Moving On",
  summary:
    "What \"finished with a pattern\" means precisely enough to check, why partial coverage of ten patterns is worse than full coverage of four, and the four variants that make a pattern actually stick.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "State a checkable definition of having finished a pattern",
    "Say why breadth-first across patterns produces the freezing you already have",
    "Name the four variants that constitute coverage of a pattern",
    "Decide when to move on, on evidence",
  ],
  sections: [
    {
      id: "half-of-ten",
      heading: "Half of ten patterns",
      body: [
        "The default way people work a sheet is breadth-first: a few from arrays, a few from strings, a few from trees, keep the variety up, keep it interesting. It produces partial coverage of many patterns, and partial coverage of a pattern is close to worthless.",
        "The reason is the recognition step from the previous module. Recognising a pattern means recognising it in a statement you have not seen, and that requires having seen the pattern in *several different disguises*. Two problems is not several. Two problems teaches you those two problems.",
        "Full coverage of four patterns beats partial coverage of ten, and the exchange rate is not close. Four patterns you can recognise anywhere are four patterns; ten you half-know are zero, plus a persistent feeling of having covered a lot of ground.",
      ],
    },
    {
      id: "what-finished-means",
      heading: "What \"finished\" means",
      body: [
        "It needs to be checkable, or it collapses into a feeling. Four things, and all four:",
        "**One: you can state the pattern's precondition.** What has to be true for it to apply \u2014 non-negative values, sortedness, no cycles. Module 31's lesson four was one instance of this and it is the difference between knowing a technique and knowing when it is allowed.",
        "**Two: you can write the skeleton from memory.** Not a specific solution \u2014 the shape. The two-pointer loop with its shrink condition, the DP table with its base case and its fill order. If you have to look this up, you have not finished.",
        "**Three: you have solved the four variants.** The next section.",
        "**Four: you recognised it cold.** On a statement you had not seen, without being told the topic. This is the one that actually matters and it is the one a topic-grouped sheet cannot test, because the heading told you the answer. It needs the drill from module 31, on statements from outside the section you are working.",
        "Miss any of the four and you are not finished, however many problems from that section you have ticked.",
      ],
      pitfalls: [
        {
          title: "Counting problems as coverage",
          body: "Six problems from one section can be six instances of the same variant, which is one problem solved six times. Coverage is about the variants, and the count is a proxy that is easy to satisfy without satisfying the thing.",
        },
        {
          title: "Testing recognition inside the section",
          body: "A problem read under the heading \"Sliding Window\" cannot test whether you would have recognised a sliding window. Every topic-grouped sheet has this hole and the only patch is drilling statements from outside the section.",
        },
      ],
    },
    {
      id: "the-four-variants",
      heading: "The four variants",
      body: [
        "Most patterns have the same four shapes, and having done all four is what makes the pattern portable rather than memorised.",
        "**The plain one.** The pattern in its textbook form, with nothing else going on. This is the one everybody does.",
        "**The one with a twist in the condition.** Same machinery, different predicate \u2014 longest instead of shortest, at most `k` distinct instead of exactly, count instead of find. The machinery does not change and the bookkeeping does, and that is where the bugs live.",
        "**The one where it is not obvious the pattern applies.** The statement is about scheduling meetings, or assigning workers, and it is the same pattern underneath. This is the variant that builds recognition, and it is the one most sheets are short of.",
        "**The one where the pattern nearly applies and does not.** The negative case. Module 31 measured two of these \u2014 a window on values that can be negative, a greedy rule on weighted intervals \u2014 and they are worth more than three more successes, because they are what stops you from over-applying a technique you have just learned.",
        "If a sheet's section has six problems and they are all the first variant, the section is one problem long. Go and find the other three yourself; it is a better use of an hour than the next section.",
      ],
    },
    {
      id: "when-to-move-on",
      heading: "When to move on",
      body: [
        "On evidence, and the evidence is the four checks above rather than a count or a feeling of readiness. Feeling ready is unreliable in a specific direction here: the pattern is fresh, so recognition is currently free, and it will not be in a week.",
        "The strongest single signal is the fourth check \u2014 recognising the pattern cold in a statement from outside the section. If you can do that twice, on two different disguises, you are done. If you cannot, more problems from inside the section will not fix it, because they all come with the answer written at the top of the page.",
        "There is one legitimate reason to move on before finishing: the pattern is blocked on a prerequisite you have not covered. That is the previous lesson's graph talking, and the right response is to go and get the prerequisite, not to push harder.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Do you work through problems by topic or mixed?",
      answer:
        "By topic to learn a pattern, mixed to test it, and the second half is the part people skip. Working a topic section is how you get coverage -- the plain form, the form with a twisted condition, the form where it is not obvious the pattern applies, and the form where it nearly applies and does not. But no problem read under a heading can tell you whether you would have recognised the pattern, because the heading is the answer. So the test has to be statements from outside the section, without the topic named. My rule for having finished a pattern is four things: I can state its precondition, write the skeleton from memory, I have done the four variants, and I have recognised it cold twice.",
    },
    {
      question: "Is it better to do a hundred problems across many topics or forty in a few?",
      answer:
        "Forty in a few, and the exchange rate is not close. Recognition needs to have seen a pattern in several different disguises, so two problems from a topic teaches you those two problems. Partial coverage of ten patterns is close to zero patterns plus a feeling of having covered ground -- which is, I think, the usual reason people say they have done hundreds of problems and still freeze. The one legitimate reason to leave a pattern unfinished is that it is blocked on a prerequisite, and then the fix is to go and get the prerequisite rather than push harder.",
    },
  ],
  takeaways: [
    "Partial coverage of ten patterns is worth less than full coverage of four",
    "Finished means: state the precondition, write the skeleton, do the four variants, recognise it cold",
    "The four variants: plain, twisted condition, disguised, and nearly-applies-but-does-not",
    "The negative variant is worth more than three more successes",
    "A section whose six problems are all the plain form is one problem long",
    "A topic heading is the answer, so a topic sheet cannot test recognition",
    "Move on when you have recognised it cold twice, not when it feels easy",
    "The one good reason to leave a pattern early is a missing prerequisite",
  ],
};
