import type { Lesson } from "@/content/types";

export const firstTwoMinutesLesson: Lesson = {
  id: "dsa-interview-technique-first-two-minutes",
  slug: "first-two-minutes",
  moduleSlug: "interview-technique",
  title: "The First Two Minutes: Clarifying Questions Worth Asking",
  summary:
    "Four questions that change what you build, three that waste the interviewer's time, and why silence in the first two minutes is the most expensive silence in the interview.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Distinguish a question that changes your solution from one that does not",
    "Ask the four that always matter",
    "Say why asking nothing reads worse than asking something obvious",
    "Handle an interviewer who deflects the question back to you",
  ],
  sections: [
    {
      id: "the-test",
      heading: "The test for a good question",
      body: [
        "**Would a different answer change what I build?** That is the whole filter, and it separates the questions worth asking from the ones that fill silence.",
        "\"Can the input be empty?\" passes: yes means a guard clause, no means none. \"Can values be negative?\" passes loudly \u2014 module 31 measured a technique that is right on non-negative values and wrong on 1,193 of 3,000 mixed ones. \"Is the array sorted?\" passes: it decides whether binary search is even available.",
        "\"What language should I use?\" fails; they will tell you or they do not care. \"How much time do we have?\" fails; you can see the clock. \"Is this a hard question?\" fails and costs you something besides the time.",
        "The filter is also what makes the questions sound competent rather than nervous, because a question that changes the build is one you can explain the consequence of: \"if the values can be negative I would use prefix sums rather than a window\" is a question and a demonstration in the same breath.",
      ],
    },
    {
      id: "the-four",
      heading: "The four that always matter",
      body: [
        "**How big can the input get?** The single most valuable question in the interview, for exactly the reasons module 31's second lesson measured. Sometimes the statement has it; if not, ask, and then say what you concluded \u2014 \"a hundred thousand, so I am looking for around `n log n`\" is thirty seconds that rules out most of the search space out loud.",
        "**What is in the input?** Negatives, zeroes, duplicates, empty, nulls, the value range, whether strings are ASCII. Ask for the ones that plausibly matter for the shapes you are considering, not all of them as a checklist.",
        "**What should happen when there is no answer?** Return `-1`, return empty, throw, or is it guaranteed to exist? Guaranteed-to-exist is a real answer and it often simplifies the code meaningfully.",
        "**Is there anything I can assume?** Sorted, distinct, connected, within a range. Module 31 made the point that these read like reassurance and are usually load-bearing, and asking directly is faster than inferring.",
        "Four questions, under a minute, and each one either changes the code or is answered with \"does not matter\" \u2014 which is itself information, because it tells you the interviewer has decided that dimension is not what they are testing.",
      ],
      pitfalls: [
        {
          title: "Asking nothing",
          body: "Silence reads as either not having noticed the ambiguities or not caring about them, and the ambiguities are usually deliberate. An interviewer who wrote \"an array of integers\" rather than \"an array of positive integers\" often did it on purpose.",
        },
        {
          title: "Asking a list of questions from memory",
          body: "Reciting eight questions including ones that obviously do not apply reads as a checklist rather than as thinking. Ask the ones whose answers would change what you are about to do, and say why they would.",
        },
        {
          title: "Asking and then not using the answer",
          body: "The worst version: asking whether values can be negative, being told yes, and then writing a sliding window. It is worse than not asking, because it demonstrates that the question was ritual.",
        },
      ],
    },
    {
      id: "when-they-deflect",
      heading: "When they deflect",
      body: [
        "A common and deliberate move: you ask whether the input can be empty and the interviewer says \"what do you think?\" or \"you decide\".",
        "That is not evasion, it is the actual question. They are testing whether you can make a defensible decision and state it, which is most of what senior engineering is. The move is to decide, say the decision and the reason, and continue.",
        "\"I will return zero for an empty input, since the problem is a sum and zero is the identity \u2014 flag it if you would rather it threw.\" That sentence takes eight seconds and does three things: it resolves the ambiguity, it explains the reasoning, and it leaves the door open without stalling.",
        "The failure mode is going back and forth \u2014 asking again, or hedging, or building something that handles every interpretation. Pick, say why, write it down as an assumption, move on. You can revisit at the end, and \"I assumed X; if it were Y, the change is this one line\" is a strong closing note.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What do you ask before you start solving?",
      answer:
        "Whatever would change what I build, and nothing else. Four things nearly always qualify: how big the input can get, because that decides the target complexity; what is actually in it -- negatives, duplicates, empty, the value range; what should happen when there is no answer; and whether there is anything I can assume, like sortedness or distinctness. I try to say the consequence in the same breath, so it is 'if the values can be negative I would use prefix sums rather than a sliding window' rather than just 'can they be negative'. What I skip is anything whose answer would not change the code -- that reads as filling silence.",
    },
    {
      question: "The interviewer answers your clarifying question with 'you decide'. What do you do?",
      answer:
        "Decide, out loud, with a reason, and move on. That deflection is usually the real question -- they want to see whether I can make a defensible call rather than stall on an ambiguity. So: 'I will return zero for an empty input, since this is a sum and zero is the identity; say if you would rather it threw.' That resolves it, shows the reasoning, and leaves the door open. What I would not do is ask again, or hedge, or write something that handles every interpretation -- and I would note it as an assumption so I can revisit it at the end.",
    },
  ],
  takeaways: [
    "The filter: would a different answer change what I build?",
    "Ask the size, the contents, the no-answer case, and the guarantees",
    "Say the consequence in the same breath as the question",
    "Asking nothing reads as not having noticed ambiguities that are usually deliberate",
    "Asking and then ignoring the answer is worse than not asking",
    "\"You decide\" is the real question — decide, justify in one sentence, continue",
    "Note your assumptions; revisiting one at the end is a strong close",
  ],
};
