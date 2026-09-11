import type { Lesson } from "@/content/types";

export const theLastFiveMinutesLesson: Lesson = {
  id: "dsa-interview-technique-the-last-five-minutes",
  slug: "the-last-five-minutes",
  moduleSlug: "interview-technique",
  title: "The Last Five Minutes: Closing, Behavioural Framing, and What to Ask",
  summary:
    "How to end a coding round on purpose rather than because time ran out, the one structure that makes behavioural answers concrete, and questions that are worth asking because you want the answer.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Close a coding round deliberately, whether or not it is finished",
    "Frame a behavioural answer around a decision rather than a narrative",
    "Ask questions whose answers would change your decision",
    "Handle the unfinished-solution ending without either panic or excuses",
  ],
  sections: [
    {
      id: "closing",
      heading: "Closing the coding round",
      body: [
        "With five minutes left, stop writing and close. This is a decision, and making it deliberately is much better than being interrupted by the clock mid-line.",
        "**If it works:** state the complexity, both halves, unprompted. Name your assumptions: \"I assumed the input fits in memory and that empty returns zero.\" Then name one improvement you did not make and why. \"With the values bounded I could use a counting array and drop the sort, but the sort keeps it simpler and the constraint was not stated.\" That last sentence is a surprisingly strong close, because it shows the solution was chosen rather than merely arrived at.",
        "**If it does not work yet:** say exactly what is left. \"The main loop is right; I have not handled the case where the list is empty, which is a guard at the top, and I have not verified the last-element case.\" Precision here is the whole thing \u2014 it converts *unfinished* into *scoped*, and it shows you know the state of your own code, which is most of what remains to be demonstrated.",
        "**If you are badly stuck:** describe the approach that would work even though you did not get there. \"I am confident this is a topological sort followed by dynamic programming along the order; I could not work out the state in time.\" A correct plan you could not implement is worth considerably more than nothing, and it is worth nothing at all if you do not say it before time runs out.",
        "What not to do is keep typing until they stop you. It leaves the last impression as a half-written line, and it forfeits the two minutes where you could have said the complexity, the assumptions, and the improvement.",
      ],
      pitfalls: [
        {
          title: "Making excuses",
          body: "\"I would have got it if I had more time\" or \"I have not seen this pattern before\" both read badly and neither is information. State the position factually and let it stand.",
        },
        {
          title: "Going quiet when it is not finished",
          body: "Unfinished and silent looks like unfinished and unaware. Unfinished with a precise account of what is left looks like an engineer giving a status update, which is a thing you will actually do at work.",
        },
        {
          title: "Announcing it is finished without a final check",
          body: "The last five minutes are exactly when the untraced edge case surfaces. Close by tracing one input, then declare it done.",
        },
      ],
    },
    {
      id: "behavioural",
      heading: "Behavioural answers, framed around a decision",
      body: [
        "Most rounds include some behavioural time, and the common failure is not a lack of stories \u2014 it is telling them as narratives, which are long, hard to follow, and end without a point.",
        "The fix is to organise the answer around a **decision** rather than around events. Situation in one sentence, the decision you faced with its real trade-off, what you chose and why, what happened, and what you would do differently. Ninety seconds, and every part is load-bearing.",
        "The trade-off is the part that carries the answer. \"We had two weeks and two options: ship the version that handled the common case, or spend the time on the general one and miss the date. I chose the first because the general case was under two percent of traffic and we could revisit \u2014 we shipped, and it turned out the two percent mattered more than the number suggested because it was our largest customer. I would ask who the edge case belongs to before deciding, not just how big it is.\"",
        "That answer contains a real cost, a real reason, an honest outcome, and something learned. The narrative version of the same events would have taken four minutes and demonstrated none of it.",
        "**Prepare four, not twenty.** A conflict with a colleague, a mistake you made, something you shipped that mattered, and something you had to learn quickly. Nearly every behavioural question maps onto one of those four, and knowing them well beats a long list you half-remember.",
      ],
    },
    {
      id: "your-questions",
      heading: "The questions at the end",
      body: [
        "\"Do you have any questions for me?\" is not a formality, and it is also not primarily a test \u2014 it is the part of the interview that is genuinely for you. Use it that way and it takes care of the assessment side by itself.",
        "The filter is the same one from lesson one: **would the answer change anything for me?** Questions that pass are specific and often slightly awkward: what does the code review process look like in practice; what has the on-call load been in the last month; what is the thing about this team that most surprises new joiners; what did the last person in this role find hardest.",
        "Questions that fail are the ones whose answers you could predict or find on the site \u2014 what technologies do you use, what is the culture like, tell me about the company. They are not damaging, but they consume the one part of the interview designed for you to gather information and return nothing.",
        "**Ask your interviewer about their work.** People answer this well and honestly, and the answer tells you more about the day-to-day than any process question. What are you working on this quarter, and what is the annoying part of it.",
        "**Ask about next steps and timeline** if nobody has said. It is practical, it is expected, and not knowing costs you real decision-making ability later.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "You have five minutes left and the solution is not finished. What do you do?",
      answer:
        "Stop writing and close deliberately, rather than being interrupted mid-line. I say exactly what is left: 'the main loop is right, I have not added the empty-input guard, and I have not verified the last element'. That converts unfinished into scoped and shows I know the state of my own code. If I am badly stuck rather than nearly done, I describe the approach that would have worked -- 'I am confident this is a topological sort then DP along the order, I could not work out the state in time' -- because a correct plan is worth a lot and worth nothing if I never say it. What I avoid is excuses and typing until they stop me, which forfeits the two minutes where I could state the complexity and the assumptions.",
    },
    {
      question: "Do you have any questions for me?",
      answer:
        "Yes, and I pick them by the same filter I use for clarifying questions: would the answer change anything for me. So I ask things like what code review looks like in practice, what the on-call load has actually been in the last month, and what the last person in this role found hardest. I also ask the interviewer what they are working on and what the annoying part of it is, because people answer that honestly and it tells me more about the day-to-day than any process question. And next steps and timeline if nobody has mentioned them. What I skip is anything I could have read on the site, because that spends the one part of the interview meant for me to gather information and returns nothing.",
    },
  ],
  takeaways: [
    "Close on purpose at five minutes; do not type until they stop you",
    "Working: complexity both halves, assumptions, and one improvement you chose not to make",
    "Not working: say precisely what is left — that converts unfinished into scoped",
    "Badly stuck: state the approach that would work, before the clock runs out",
    "Behavioural answers are organised around a decision and its trade-off, not events",
    "Prepare four stories: a conflict, a mistake, something shipped, something learned fast",
    "Ask questions whose answers would change your decision — and ask about their work",
  ],
};
