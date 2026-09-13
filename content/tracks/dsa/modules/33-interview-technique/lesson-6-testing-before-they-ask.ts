import type { Lesson } from "@/content/types";

export const testingBeforeTheyAskLesson: Lesson = {
  id: "dsa-interview-technique-testing-before-they-ask",
  slug: "testing-before-they-ask",
  moduleSlug: "interview-technique",
  title: "Testing Before They Ask, and Which Cases to Pick",
  summary:
    "Tracing your own code before the interviewer asks you to changes who found the bug. A short generative list of edge cases that beats trying to remember one.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Trace a non-trivial example line by line without skipping ahead",
    "Generate edge cases from the code rather than recalling a list",
    "Say why finding your own bug is close to neutral and having it found is not",
    "Keep the trace short enough to fit in the time you have",
  ],
  sections: [
    {
      id: "who-found-it",
      heading: "Who found the bug",
      body: [
        "The same bug, in the same code, produces two very different assessments depending on who noticed it.",
        "You trace your code, spot that the last interval never gets appended, and fix it. That is roughly neutral, and arguably positive: it demonstrates that you verify your own work, which is the single most useful habit a colleague can have.",
        "The interviewer traces your code, spots it, and asks \"what happens on `[1-3]`?\". That is a real mark against you, and not because of the bug. It is because you declared the code finished and it was not, which means your \"this is done\" carries no information.",
        "That asymmetry is the entire argument for tracing before you announce you are finished. The bug is the same; the signal is opposite.",
      ],
    },
    {
      id: "how-to-trace",
      heading: "How to trace so it actually catches things",
      body: [
        "**Pick an input that exercises the interesting branch.** Not the empty array, and not the example from the statement, which you have already been reasoning about for twenty minutes and will read what you expect into. Something small with the case you were least sure of.",
        "**Read what the code says, not what you meant.** This is the entire difficulty. When you trace your own code your eyes autocomplete, and you read `>=` where you wrote `>`. The counter is to say the values out loud: \"`i` is 2, `arr[2]` is 9, `end` is 9, is 9 greater than 9 \u2014 no.\" Reading the actual numbers is slower and it is the only version that works.",
        "**Track state explicitly.** Write the variables down beside the code and update them as you go. Holding four variables in your head across a fifteen-line loop is where traces silently become guesses.",
        "**Go through the loop at least twice, plus the exit.** Most loop bugs are on the boundary \u2014 the first iteration, the last one, or what happens after. Iterating once and saying \"and so on\" skips exactly the part where the bug is.",
        "Two minutes, on one well-chosen input, done honestly. That is the whole practice, and it is worth more than five minutes on three inputs traced sloppily.",
      ],
      pitfalls: [
        {
          title: "Tracing the example you have been staring at",
          body: "You already know the answer, so you will produce it regardless of what the code does. Use a different small input.",
        },
        {
          title: "Saying \"and so on\" after one iteration",
          body: "The bugs are on the boundaries: the first pass, the last pass, and the state after the loop exits. Skipping to the end skips the bug.",
        },
        {
          title: "Announcing you are done before tracing",
          body: "This is what makes the difference between the two assessments. Trace, then say you are done -- in that order, because the order is the entire signal.",
        },
      ],
    },
    {
      id: "which-cases",
      heading: "Generating the edge cases instead of recalling them",
      body: [
        "Memorised checklists of edge cases go stale and are hard to recall under pressure. It is more reliable to generate them from what is in front of you. Four sources cover almost everything.",
        "**From the input type.** Empty, one element, two elements, all identical, already sorted, reverse sorted, and \u2014 the one people miss \u2014 the extremes of the value range, especially negatives and zero.",
        "**From the code.** Every branch you wrote is a claim that both sides can happen, so find an input for each side. Every `while` is a claim it can run zero times. Every index arithmetic like `i - 1` or `i + 1` is a claim about the ends. Reading your own code for these takes thirty seconds and is far more targeted than a generic list.",
        "**From the problem statement.** Whatever it said could happen: duplicates allowed, values may be negative, the answer may not exist, `k` may exceed `n`. Anything the statement went out of its way to permit was permitted deliberately.",
        "**From your assumptions.** Every clarifying question you asked and every decision you made when the interviewer said \"you decide\" is an edge case with your name on it. \"I assumed empty returns zero \u2014 let me check that path actually does.\"",
        "The best of these is the second, because it is derived from what you actually wrote rather than from what the problem is about. Three of the four hand-picked tests measured in the brute-force lesson came from the input type and the fourth from the statement, and they caught one bug in four.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you test your solution in an interview?",
      answer:
        "I trace before I say I am finished, because the same bug scores completely differently depending on who found it -- me spotting it is roughly neutral and shows I verify my work, the interviewer spotting it means my 'this is done' carries no information. The trace has to be honest: a small input I have not been staring at, saying the actual values out loud rather than what I meant, variables written down beside the code, and at least two passes through the loop plus the exit. Two minutes on one well-chosen input beats five minutes skimming three.",
    },
    {
      question: "Which edge cases do you check?",
      answer:
        "I generate them rather than recall a list. Four sources: the input type gives me empty, one element, duplicates, sorted and reverse sorted, and the value extremes including negatives and zero. The code itself gives me the most targeted ones -- every branch claims both sides can happen, every while claims it can run zero times, every i-minus-one claims something about the ends. The statement gives me whatever it went out of its way to permit. And my own assumptions give me the rest: anything I decided when the interviewer said 'you decide' is an edge case with my name on it. The code-derived ones are the best, because the generic list only covers cases I already had in mind.",
    },
  ],
  takeaways: [
    "The same bug scores opposite ways depending on who found it",
    "Trace, then announce you are done — the order is the signal",
    "Use an input you have not been staring at",
    "Say the actual values out loud; your eyes autocomplete your own code",
    "Two passes through the loop plus the exit — the bugs are on the boundaries",
    "Generate edge cases from the input type, the code, the statement, and your assumptions",
    "Code-derived cases are the most targeted: every branch and every i-1 is a claim",
  ],
};
