import type { Lesson } from "@/content/types";

export const gettingUnstuckInPublicLesson: Lesson = {
  id: "dsa-interview-technique-getting-unstuck-in-public",
  slug: "getting-unstuck-in-public",
  moduleSlug: "interview-technique",
  title: "Getting Unstuck in Public, and What a Hint Tells You",
  summary:
    "Being stuck is normal and expected. Being stuck silently is the failure. Four moves that produce progress from nothing, and how to read the hint you are given.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Say what you are stuck on precisely enough that it becomes a question",
    "Apply four unsticking moves that work when nothing is coming",
    "Read a hint for what it says about how far off you were",
    "Recover after a hint without either over-apologising or ignoring it",
  ],
  sections: [
    {
      id: "silence",
      heading: "The only failure is silence",
      body: [
        "Interviewers expect candidates to get stuck. The question was calibrated to be hard, and being stuck for three minutes in the middle is unremarkable.",
        "Three minutes of *silence* is a different thing, because it gives the interviewer nothing to assess and nothing to help with. They cannot tell whether you are thinking productively, have misunderstood the problem, or have gone completely blank \u2014 and their only option is to wait or to give a hint they cannot aim.",
        "Narrating while stuck costs nothing and changes both of those. \"I am trying to work out whether the window can ever need to shrink by more than one\" tells them exactly where you are, and if that is the wrong question they can redirect you in one sentence instead of watching you spend five minutes on it.",
        "It also usually unsticks you on its own. Saying the difficulty out loud forces it into a precise form, and a precisely stated difficulty is frequently its own answer \u2014 which is the same mechanism as the restatement in lesson two, applied mid-problem.",
      ],
    },
    {
      id: "four-moves",
      heading: "Four moves when nothing is coming",
      body: [
        "**Say what you have and what you need.** \"I have a way to check whether a given length works, and I need to find the largest length that does.\" Stated like that, the gap is often obviously a binary search. This is the most productive of the four because it converts a vague stuck into a specific missing piece.",
        "**Shrink the problem.** Solve it for `n = 1`, then `n = 2`, then `n = 3`, out loud. Either you find the recurrence, or you find that you cannot solve `n = 3`, which means you misunderstood something and that is worth knowing now. Small cases are also where the pattern usually becomes visible.",
        "**Go back to the brute force and hunt the waste.** If you have a correct slow version, the optimisation is somewhere in it \u2014 the previous lesson's sentence applies: what is being recomputed. If you never wrote one, write it now; being stuck at `O(n^2)` is a much better position than being stuck at nothing.",
        "**Change the representation.** Sort it. Index it by value instead of by position. Think of it as a graph. Process it backwards. Reversing the direction of a scan and reading the input as a graph are the two that most often break a jam, and both take one sentence to try.",
        "Pick one, say which one you are trying, and do it out loud. Even if it does not work, the interviewer sees a method rather than a stall.",
      ],
      pitfalls: [
        {
          title: "Restarting from scratch repeatedly",
          body: "Wiping the editor and beginning again is almost always a mistake -- it discards the correct parts along with the stuck part, and it reads as panic. Fix the specific thing that is wrong.",
        },
        {
          title: "Saying \"I do not know\" and stopping",
          body: "It is honest and it ends the assessment. \"I do not know how to do the last step, but here is what I have and here is what is missing\" is equally honest and is a completely different data point.",
        },
        {
          title: "Pretending to think when you have gone blank",
          body: "Silence with a thoughtful expression is still silence. If you have gone blank, say so and take one of the four moves -- shrinking to n=1 works from a standing start.",
        },
      ],
    },
    {
      id: "reading-the-hint",
      heading: "What a hint tells you",
      body: [
        "Hints are not all the same and the difference is informative. Roughly, they come in three strengths.",
        "**A nudge.** \"What if the array were sorted?\" or \"is there anything you are recomputing?\" This is close to free \u2014 you were on the right track and needed a small push. Take it and keep going; do not treat it as a failure.",
        "**A redirect.** \"Have you considered a different data structure here?\" or \"what if we approached this from the end?\" You were heading somewhere that does not work. The cost is mostly the time already spent, and the recovery is to change direction visibly and quickly.",
        "**A handout.** \"Try using a stack.\" This one does cost you, because the interviewer has supplied the insight the question was testing. It is not fatal \u2014 what you do with a stack from there is still yours to demonstrate, and demonstrating it well recovers a real amount.",
        "In every case the response is the same shape: take the hint immediately, say what it unlocked, and continue. \"A stack \u2014 right, because I need the most recent unmatched opening bracket, and that is exactly last-in-first-out.\" That sentence shows you understood *why* rather than just doing as told, which is the part that is still being assessed.",
      ],
    },
    {
      id: "after-the-hint",
      heading: "After the hint",
      body: [
        "Two failure modes here, and they are opposite.",
        "**Over-apologising.** \"Sorry, I should have seen that, that was stupid of me.\" It costs time, it makes the room awkward, and it draws attention to the hint you would rather move past. One acknowledgement \u2014 \"ah, yes\" \u2014 and then work.",
        "**Ignoring it.** Being given a hint, saying \"right, thanks\", and continuing down the original path. This is much worse than the first, and interviewers notice it immediately. If you genuinely think your approach still works, say why: \"I think I can still do it with a queue because the order I need is oldest-first \u2014 but tell me if I am missing something.\" That is not ignoring a hint, that is a technical disagreement, and a well-argued one is fine.",
        "The best recovery is fast and specific: take it, say what it unlocked in one sentence, and be visibly further along thirty seconds later. Nobody expects a hint-free interview; what they are reading is what you did with the hint.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What do you do when you get stuck?",
      answer:
        "Say what I am stuck on, precisely, because silence is the only real failure -- being stuck is expected, but three silent minutes give the interviewer nothing to assess and nothing to aim a hint at. Stating the difficulty precisely also frequently solves it. Then I take one of four moves and say which: state what I have and what I need, which often turns the gap into an obvious binary search; shrink to n equals one, two, three out loud; go back to the brute force and hunt for the recomputation; or change the representation -- sort it, index by value, read it as a graph, process it backwards. What I would not do is restart from scratch, which throws away the correct parts and reads as panic.",
    },
    {
      question: "The interviewer gives you a hint. How do you handle it?",
      answer:
        "Take it immediately and say what it unlocked, in one sentence: 'a stack -- right, because I need the most recent unmatched opening bracket, and that is last-in-first-out'. That shows I understood why rather than just doing as told, which is the part still being assessed. I would not over-apologise, which wastes time and draws attention to it, and I definitely would not thank them and keep going down my original path -- that is the one interviewers notice instantly. If I genuinely think my approach still works I would say why and invite the correction, which is a technical disagreement rather than ignoring the hint.",
    },
  ],
  takeaways: [
    "Being stuck is expected; being stuck silently is the failure",
    "A precisely stated difficulty is frequently its own answer",
    "Four moves: what I have vs what I need, shrink to n=1, hunt the waste, change the representation",
    "Say which move you are trying — the interviewer sees a method, not a stall",
    "Never restart from scratch; fix the specific thing that is wrong",
    "Nudge, redirect, handout — they cost different amounts, and all are recoverable",
    "Take the hint, say what it unlocked, be visibly further along in thirty seconds",
  ],
};
