import type { Lesson } from "@/content/types";

export const sixtySecondsLesson: Lesson = {
  id: "dsa-pattern-atlas-sixty-seconds",
  slug: "sixty-seconds",
  moduleSlug: "pattern-atlas-drills",
  title: "Sixty Seconds: Statement to Pattern",
  summary:
    "A drill with one rule: you are forbidden to write code. Read the statement, name the pattern, the structure and the target complexity, and stop. That is the step you are actually missing, and it is the only step this module practises.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Say why solving more problems has stopped improving your recognition",
    "Run the sixty-second drill on a statement and produce four named outputs",
    "Grade your own answer without writing any code",
    "Tell a recognition failure apart from an implementation failure",
  ],
  sections: [
    {
      id: "the-step-you-skip",
      heading: "The step you skip by solving",
      body: [
        "By this point in the track you can implement everything. Given \"use a monotonic stack\", you write one. Given \"this is a knapsack\", you fill the table. The implementations are not what is costing you problems.",
        "What costs you problems is the twenty seconds between reading the statement and knowing which of those to reach for \u2014 and solving more problems trains that step badly, because every time you solve one you also *implement* it, and implementation is slow, absorbing and satisfying. An hour of practice contains maybe four minutes of recognition and fifty-six minutes of typing. The ratio is upside down.",
        "This module fixes the ratio by banning the typing. You read a statement, you name four things, and you move on. Sixty seconds each. In an hour you get sixty repetitions of the thing you are bad at instead of four.",
      ],
    },
    {
      id: "the-four-outputs",
      heading: "The four outputs",
      body: [
        "Every repetition produces the same four things, in this order, and nothing else.",
        "**The restatement.** One sentence, in your own words, saying what is being asked. Not a paraphrase of the wording \u2014 a statement of the question. If you cannot produce this one, stop: nothing after it can be right, and the failure you just found is the most valuable one on the list.",
        "**The target complexity**, read off the constraints. The next lesson is entirely about this, because it is the most mechanical of the four and the most often skipped.",
        "**The structure.** What does the problem *do* most? Repeated membership tests, a hash set. Repeated \"smallest remaining\", a heap. Repeated \"most recent unresolved thing\", a stack. Repeated range sums, a prefix array. The dominant operation names the structure.",
        "**The pattern.** Two pointers, sliding window, binary search on the answer, DP over subsets, topological order, and so on. This comes *last*, and the order matters: deducing the pattern from the structure is reasoning; picking a remembered pattern and forcing the problem into it is guessing with extra steps.",
        "Say all four out loud or write them in four short lines. Then look at the answer, mark yourself, and go to the next one. No code. If you find yourself sketching an implementation, you have left the drill.",
      ],
      pitfalls: [
        {
          title: "Letting the drill turn into solving",
          body: "The moment you start working out the index arithmetic you are back to four repetitions an hour. The rule is not a suggestion: name the four things and move on, even when you can feel the whole solution arriving. Especially then -- that one was free, and the next one is the one you needed.",
        },
        {
          title: "Grading yourself on the pattern only",
          body: "Three of the four outputs are more diagnostic than the pattern. Getting the pattern right with the wrong complexity target usually means you recognised the problem rather than reading it, which will not transfer to the variant you have not seen.",
        },
      ],
    },
    {
      id: "what-the-failures-mean",
      heading: "What each failure tells you",
      body: [
        "The point of producing four separate outputs is that a miss on each one means something different, and the fixes are different.",
        "**Missed the restatement.** You do not know what the problem is asking. This is a reading failure, not an algorithms failure, and no amount of pattern study fixes it. The drill for it is the smallest-example habit: take the tiniest input the statement allows and work the answer by hand. If you cannot do that either, the problem is genuinely ambiguous and in an interview you would ask.",
        "**Missed the complexity.** You skipped the constraints, or you know the growth rates but not what they cost. Entirely mechanical, entirely fixable, and the subject of the next lesson.",
        "**Got the structure wrong.** You named the operation the problem does most, and picked a structure that does not make it cheap. This one is worth writing down each time it happens, because people are consistent about it \u2014 most stuck-but-experienced people have one structure they over-reach for and one they never think of.",
        "**Got the structure right and the pattern wrong.** The most interesting failure, and usually the most recoverable, because a right structure with a wrong pattern still lands you near the answer. Lessons four and five are two specific instances of it.",
        "Log which of the four you missed, not whether you got the problem. Over thirty repetitions the log is a diagnosis, and it is almost always narrower than \"I am bad at this\".",
      ],
    },
    {
      id: "how-to-run-a-session",
      heading: "How to run a session",
      body: [
        "Twenty statements, a timer, and a sheet with four columns. Sixty seconds a statement, no exceptions \u2014 the timer is not there to hurry you, it is there to stop you solving.",
        "Draw the statements from problems you have **not** solved. Recognition on a problem you remember is not recognition, it is recall, and it will flatter you. If you are working from a sheet you have partly done, use the part you have not.",
        "Mark immediately, one statement at a time, not at the end. Recognition is a fast loop and it wants fast feedback; twenty answers marked in a batch teaches much less than twenty answers marked one at a time.",
        "Expect to be bad at this at first, and expect it to move quickly. The skill is narrow, the feedback is immediate, and the repetitions are cheap \u2014 which is exactly the combination that improves fast. What does not improve fast is the same skill trained forty times more slowly, embedded inside the implementation work you already know how to do.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you approach a problem you have never seen?",
      answer:
        "In four steps, before writing anything. First I restate it in one sentence in my own words -- if I cannot, that is the real problem and I would ask a clarifying question. Then I read the constraints to get a target complexity, because n up to 20 and n up to a million are asking for different algorithms. Then I ask what operation the problem does most often, because that picks the data structure -- repeated membership is a hash set, repeated smallest-remaining is a heap. Only then do I name a pattern, because the pattern follows from the structure. Doing it in that order is deducing; naming a pattern first and fitting the problem to it is guessing.",
    },
    {
      question: "You have done hundreds of problems and still freeze on new ones. Why?",
      answer:
        "Because solving practises implementation and only incidentally practises recognition. An hour of solving is maybe four minutes of deciding what to do and fifty-six minutes of typing, so the ratio is wrong for the skill that is actually failing. The fix is to separate them: read statements and name the pattern, the structure and the target complexity without writing any code, sixty seconds each. Sixty repetitions an hour instead of four. It is uncomfortable because there is no implementation to hide in, which is the point.",
    },
  ],
  takeaways: [
    "Recognition and implementation are separate skills, and solving spends most of its time on the second",
    "The drill bans code: read, name four things, move on, sixty seconds",
    "The four outputs are the restatement, the target complexity, the structure and the pattern — in that order",
    "The pattern comes last because it is deduced from the structure, not chosen and then justified",
    "Miss the restatement and nothing after it can be right; that is the most valuable failure to find",
    "Log which of the four you missed rather than whether you solved it",
    "Draw statements from problems you have not solved — on ones you remember, this measures recall",
  ],
};
