import type { Lesson } from "@/content/types";

export const afterYouLookLesson: Lesson = {
  id: "dsa-the-sheet-after-you-look",
  slug: "after-you-look",
  moduleSlug: "the-sheet",
  title: "What to Do After You Look at the Solution",
  summary:
    "The step everybody skips, and the reason the same problem defeats you again three weeks later. Four things to do after reading a solution, none of which is reading it again.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Say why reading a solution and understanding it changes almost nothing",
    "Locate the exact observation you were missing",
    "Close the page and write it from nothing",
    "Turn the miss into a question you can ask next time",
  ],
  sections: [
    {
      id: "understanding-is-not-the-goal",
      heading: "Understanding it is not the goal",
      body: [
        "Here is the standard sequence: struggle, look, read, think \"ah, of course\", feel the click, tick the problem, move on. Three weeks later the same problem defeats you.",
        "The click is real and it is the problem. It is the feeling of being shown an answer and seeing why it works. That is a different operation from producing the answer from a statement, and the second one is what failed. The click tells you the reading worked; it says nothing about whether you could have got there.",
        "Worse, the click is *satisfying*, which makes it feel like the session paid off, which is exactly why the next step gets skipped. Understanding a solution is the beginning of the work on that problem, not the end of it.",
        "Four things, and they take about fifteen minutes.",
      ],
    },
    {
      id: "the-four-things",
      heading: "The four things",
      body: [
        "**One: find the single observation you were missing.** Not \"the solution uses a heap\" \u2014 the specific realisation the whole thing hinges on. *The array being sorted means the answer is monotone in the index.* *You never need to un-remove an element.* *The maximum over a window only changes at the ends.* Almost every solution has exactly one, and everything else is consequence. Write it in one sentence.",
        "This is the step that pays, and it is worth being stubborn about. If you cannot compress the solution to one observation plus consequences, you have not finished reading it \u2014 you have memorised it.",
        "**Two: work out where you would have found it.** Which of your steps should have produced it? Was it in the constraints you skimmed? Would working a smaller example by hand have shown it? Was it the twist in the condition that you did not notice? This converts a fact about one problem into a fact about your process.",
        "**Three: close everything and write it from nothing.** Not now-ish, *now*, and from an empty file. Not from memory of the code \u2014 from the observation. If you cannot, you did not have the observation, you had the code, and you are back to step one.",
        "**Four: write the recognition question.** One line: what could you have asked yourself that would have produced the observation? \"Does the window's answer only change at the ends?\" That line is a candidate branch for the decision tree in module 31's lesson seven, and it is the only part of this that helps you on a *different* problem.",
      ],
      pitfalls: [
        {
          title: "Re-reading the solution instead of rewriting it",
          body: "Reading it a second time is more recognition. The whole point of step three is to force retrieval, which is uncomfortable in exactly the way that means it is working.",
        },
        {
          title: "Copying the code and running it",
          body: "Typing someone else's solution feels like doing something and is the weakest possible version of step three. The test is writing it from the observation with the page closed, and it is not the same test if the code is on screen.",
        },
        {
          title: "Skipping step four because the problem is done",
          body: "Steps one to three help you with this problem. Step four is the only one that helps with a problem you have not seen, which is the one you are actually preparing for.",
        },
      ],
    },
    {
      id: "the-honest-version",
      heading: "The honest version of the ledger",
      body: [
        "A problem you looked up and then rewrote is not the same as a problem you solved, and the tracking lesson at the end of this module treats them differently. Marking it green is how it disappears and comes back.",
        "It is also worth being clear about the cost. The four steps take fifteen minutes on top of a problem you have already spent thirty on, which means fewer problems per session. That is the trade, and it is a good one: three problems fully processed beat eight ticked, and the difference shows up specifically on the problems you have not seen.",
        "There is one shortcut that is not a shortcut. If, after reading, you genuinely had the observation and were two lines from it, note that and move on quickly \u2014 you do not need the full ceremony on a near-miss. The four steps are for the ones where the observation was not on your list at all, which is where the learning is.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "You could not solve a problem and read the solution. What do you do next?",
      answer:
        "Four things, and none of them is reading it again. First I find the single observation the whole solution hinges on -- not 'it uses a heap' but the specific realisation, like 'the maximum over a window only changes at the ends'. If I cannot compress it to one observation plus consequences, I have memorised it rather than understood it. Second, I work out where I should have found that -- was it in the constraints I skimmed, would a small example by hand have shown it -- because that turns a fact about one problem into a fact about my process. Third, I close everything and write the solution from nothing, from the observation rather than from memory of the code. Fourth, I write down the question I could have asked myself that would have produced the observation, because that is the only part that transfers to a problem I have not seen.",
    },
    {
      question: "Why is understanding the solution not enough?",
      answer:
        "Because understanding a solution you are looking at and producing one from a statement are different operations -- one runs backwards from an answer, the other forwards from a statement -- and the click of 'ah, of course' is evidence about the first one only. It is also satisfying, which is precisely why the work after it gets skipped and why the same problem can defeat you again three weeks later. The test that it took is closing the page and writing it from nothing.",
    },
  ],
  takeaways: [
    "The click means you followed the answer — which was never the part that failed",
    "Understanding the solution is the start of the work on that problem",
    "Find the single observation the solution hinges on; everything else is consequence",
    "If you cannot compress it to one observation, you memorised it",
    "Work out where in your own process you should have found it",
    "Close everything and rewrite from the observation, not from memory of the code",
    "Write the recognition question — the only part that transfers to a new problem",
    "Fifteen minutes per problem, fewer problems per session, and a good trade",
  ],
};
