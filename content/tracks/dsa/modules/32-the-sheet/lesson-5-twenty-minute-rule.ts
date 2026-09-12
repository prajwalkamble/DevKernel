import type { Lesson } from "@/content/types";

export const twentyMinuteRuleLesson: Lesson = {
  id: "dsa-the-sheet-twenty-minute-rule",
  slug: "twenty-minute-rule",
  moduleSlug: "the-sheet",
  title: "How Long to Stare Before Looking",
  summary:
    "Both failure modes are expensive: looking after four minutes teaches nothing, and staring for ninety teaches nothing either. What the timer should actually be measuring, and the version of the rule that works.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "State the two failure modes and why both waste the session",
    "Replace a clock rule with a progress rule",
    "Say what counts as progress and what only feels like it",
    "Use a hint deliberately instead of opening the solution",
  ],
  sections: [
    {
      id: "both-ends-are-bad",
      heading: "Both ends are bad",
      body: [
        "**Looking too early** is the obvious failure. You read the solution, it makes sense, you feel you have learned something, and you have learned it by reading an answer, which is a different operation from producing one from a statement \u2014 and producing it is the part that failed. Four minutes of struggle followed by an editorial is a very expensive way to read an editorial.",
        "**Staring too long** is the less obvious one and it is at least as common among people who have been told not to look. Ninety minutes on a problem you were never going to get produces one data point and a bad mood, and the same ninety minutes would have covered four problems with the hint used properly.",
        "The advice that circulates \u2014 twenty minutes, or thirty, or an hour depending on who you ask \u2014 is trying to split the difference with a clock. A clock is the wrong instrument, because the relevant question is not how long you have been sitting there.",
      ],
    },
    {
      id: "progress-not-time",
      heading: "Progress, not time",
      body: [
        "The right rule is: **keep going while you are still producing outputs, stop when you are not.**",
        "The framework in module 12 gives seven steps, each with an output. Module 31's drill gives four. While you are still generating them \u2014 a restatement, a worked small example, a brute force, a target complexity, a candidate structure \u2014 you are working. Stop the clock and keep going.",
        "The moment you notice you have produced nothing new for a few minutes, you are staring, and that is the signal. It usually arrives well before twenty minutes on a problem that is genuinely beyond you, and well after twenty on one that is not.",
        "So the twenty minutes is real but it is a *symptom* rather than a rule. Twenty minutes is roughly how long it takes most people to exhaust the outputs on a problem they cannot get. If you are exhausted at eight, look at eight. If you are still producing at forty, keep going.",
        "The one thing to do before looking, always: **write down where you stopped.** Which output you could not produce. \"I have the brute force and the target and I cannot see what to exploit\" is a specific, diagnosable state, and it changes what you should read next \u2014 you want the step you are missing, not the whole solution.",
      ],
      pitfalls: [
        {
          title: "Counting re-reading as progress",
          body: "Reading the statement for the fifth time produces nothing. Neither does trying the same idea slightly harder. Progress means a new output -- a smaller example worked, a different brute force, a complexity target -- and if you cannot name what you produced in the last five minutes, you did not.",
        },
        {
          title: "Treating the timer as permission",
          body: "\"Twenty minutes are up\" is not a reason to look if you produced two new observations in the last five. The clock exists to catch staring, not to cap thinking.",
        },
        {
          title: "Not writing down where you stopped",
          body: "Opening a solution without knowing which step defeated you converts a diagnosable failure into a general one. Ten seconds of writing turns \"I could not do it\" into \"I could not see the invariant\", which is the difference between a data point and a lesson.",
        },
      ],
    },
    {
      id: "the-graded-hint",
      heading: "The graded hint",
      body: [
        "Opening the full solution is the largest possible hint and it is almost never the right size. There is a ladder, and each rung preserves most of the work.",
        "**The topic tag.** The smallest hint there is, and often sufficient. Knowing it is a heap problem leaves you the entire actual problem.",
        "**The target complexity**, if the constraints did not make it obvious. Sometimes the whole difficulty is that you were looking for the wrong shape of answer.",
        "**The first line of the editorial**, and then close it. Usually a sentence naming the observation. Take it and go back.",
        "**The recurrence, or the invariant**, without the implementation. This is the biggest hint that still leaves you something to do.",
        "**The whole solution.** The last resort, and the point at which the next lesson's work becomes mandatory.",
        "Take the smallest rung that unsticks you, and take it deliberately \u2014 decide which rung, take that one, close the page. Scrolling until something helps means you have taken all of them.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How long do you spend on a problem before looking at the solution?",
      answer:
        "I do not time it, I watch whether I am still producing outputs. While I am generating things -- a restatement, a small example worked by hand, a brute force, a target complexity, a candidate structure -- I keep going. When I notice I have produced nothing new for a few minutes, I am staring, and that is the signal rather than the clock. In practice that lands around twenty minutes on a problem I am not going to get, which is where the usual advice comes from, but it is a symptom rather than the rule -- sometimes it is eight minutes and sometimes I am still making progress at forty. The part I never skip is writing down which output I could not produce before I look, because 'I have the brute force and the target and cannot see what to exploit' is diagnosable and 'I could not do it' is not.",
    },
    {
      question: "Is it bad to look at the solution?",
      answer:
        "Only if you look at all of it, and only if you stop there. There is a ladder of hints and the full solution is the largest rung: the topic tag, the target complexity, the first sentence of the editorial, the recurrence without the implementation, and then the whole thing. The smallest rung that unsticks you preserves most of the work you have already done. What makes looking genuinely costly is scrolling until something helps, which means taking every rung at once, and then not doing the work afterwards -- reading a solution teaches you to follow an answer, which is not the same as producing one.",
    },
  ],
  takeaways: [
    "Looking too early teaches you to follow an answer, not to produce one",
    "Staring too long buys one data point for the price of four problems",
    "The rule is progress, not time: keep going while outputs are still appearing",
    "Twenty minutes is roughly when outputs run out — a symptom, not a rule",
    "Re-reading and trying the same idea harder are not outputs",
    "Always write down which output you could not produce, before you look",
    "The hint ladder: topic tag, complexity, first sentence, recurrence, whole solution",
    "Take the smallest rung deliberately; scrolling means taking all of them",
  ],
};
