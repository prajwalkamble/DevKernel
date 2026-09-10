import type { Lesson } from "@/content/types";

export const trackingLesson: Lesson = {
  id: "dsa-the-sheet-tracking",
  slug: "tracking",
  moduleSlug: "the-sheet",
  title: "Tracking: What to Log So a Solved Problem Stays Solved",
  summary:
    "A tick in a spreadsheet records that time passed. Six fields that record something you can act on, and the two numbers worth looking at when you review.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Say what a solved/unsolved tick fails to capture",
    "Log the six fields that make a problem re-findable and diagnosable",
    "Read a log for patterns rather than for totals",
    "Keep the log small enough that it survives contact with a bad week",
  ],
  sections: [
    {
      id: "what-a-tick-loses",
      heading: "What a tick loses",
      body: [
        "The standard tracker has a column of ticks. It answers one question \u2014 how many \u2014 and that is the question with the least information in it.",
        "It cannot tell you whether you solved it or read it. Whether it took eight minutes or fifty. Which step you were stuck on. What the observation was. Whether the same observation has now defeated you three times in different clothes.",
        "That last one is the whole game. Almost everybody's misses cluster, and the cluster is narrower than the feeling of being generally bad. You cannot see a cluster in a column of ticks.",
        "The fix is six fields, and they take under a minute per problem to fill in.",
      ],
    },
    {
      id: "the-six-fields",
      heading: "The six fields",
      body: [
        "**Pattern.** Which pattern it turned out to be \u2014 not which section it was in. On a problem you got wrong these will differ, and the difference is the interesting part.",
        "**Outcome**, in four values rather than two: *solved clean*, *solved slow*, *solved after a hint*, *looked it up*. Two values throw away most of the signal, and the middle two are where the actionable problems live.",
        "**Where you stopped**, if you did \u2014 which of the framework's outputs you could not produce. \"Had the brute force, could not see what to exploit\" rather than \"stuck\".",
        "**The observation.** The one-sentence hinge from lesson six. This is the field that makes the log worth keeping, because reading twenty of these back is the fastest revision there is.",
        "**The recognition question.** The line you wrote in step four \u2014 what you could have asked that would have produced the observation.",
        "**Date.** For the spacing in the previous lesson, and nothing else.",
        "Six fields, under a minute, and the log becomes a document you can read rather than a count you can watch.",
      ],
      pitfalls: [
        {
          title: "A binary solved/unsolved column",
          body: "It cannot distinguish a clean solve from one that took fifty minutes and two hints, and the difference between those is the entire content of the next session. Four outcome values costs nothing and keeps the signal.",
        },
        {
          title: "Logging the section instead of the pattern",
          body: "On the problems that matter -- the ones you got wrong -- the section you found it in and the pattern it turned out to need are different, and only the second one is worth counting.",
        },
        {
          title: "Building a tracker instead of using one",
          body: "A spreadsheet with six columns takes two minutes to make. An hour spent on formulas and a dashboard is an hour not spent on problems, and the elaborate version is the one that gets abandoned first.",
        },
      ],
    },
    {
      id: "reading-it",
      heading: "Reading it back",
      body: [
        "Once every couple of weeks, and there are exactly two things to look at.",
        "**Which pattern column is full of bad outcomes.** Not which pattern you have done least of \u2014 which one you keep failing. Those are different, and the second is where the next week goes. Usually it is one or two patterns, which is a much better thing to know than \"I am bad at DP\".",
        "**Which *where-you-stopped* value repeats.** If half your misses say \"could not get from the brute force to the optimisation\", that is not twelve problems, it is one weakness with twelve instances, and it has a specific fix. If half of them say \"could not restate the problem\", that is a different weakness entirely and no amount of algorithm practice touches it.",
        "Then read the observation column. Twenty one-line observations, read straight through, is ten minutes and it is the highest-density revision available \u2014 it is your own misses, compressed, in your own words.",
        "What not to look at: the total. The number of problems solved is the number that feels best and moves regardless of whether anything improved, which is a bad combination for a metric you check often.",
      ],
    },
    {
      id: "keeping-it-alive",
      heading: "Keeping it alive",
      body: [
        "Every tracking system dies the same way: it grows fields until filling it in costs more than it returns, and then one bad week kills it.",
        "So the sizing rule is that the log must be fillable in under a minute while tired. Six fields, short answers, no formatting. If you find yourself skipping it, cut a field rather than resolving to try harder \u2014 the log that gets filled in badly is worth much more than the one that does not get filled in.",
        "And it is worth remembering what the log is for. It is not a record of work done, which is what a tick column is; it is an input to the next three decisions \u2014 which pattern to work on, which problems to revisit, and which branch to add to the decision tree. If a field is not feeding one of those, delete it.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you track your practice?",
      answer:
        "Six fields per problem, under a minute to fill in. The pattern it turned out to need -- not the section it was in, because on the ones I got wrong those differ. The outcome in four values rather than two: solved clean, solved slow, solved after a hint, looked it up. Where I stopped, if I did, in terms of which step failed. The one-sentence observation the solution hinged on. The recognition question I could have asked to get there. And the date, for spacing. What I do not track is a solved count, because it moves whether or not anything improved. When I read it back I look at two things: which pattern keeps producing bad outcomes, and which 'where I stopped' value repeats -- half my misses saying 'could not get from brute force to optimisation' is one weakness with twelve instances, not twelve problems.",
    },
    {
      question: "What is the most useful thing in a practice log?",
      answer:
        "The one-sentence observation for each problem -- the realisation the solution hinged on. Reading twenty of those straight through takes ten minutes and is the densest revision available, because it is my own misses compressed in my own words. The second most useful is the record of which step I stopped at, because those cluster, and the cluster is always narrower than the feeling of being generally bad at something.",
    },
  ],
  takeaways: [
    "A tick answers \"how many\", which is the least informative question available",
    "Six fields: pattern, outcome, where you stopped, the observation, the recognition question, the date",
    "Four outcome values, not two — the middle two are where the actionable problems are",
    "Log the pattern it needed, not the section it was in; on the misses those differ",
    "Read for two things: which pattern keeps failing, and which stopping point repeats",
    "Twelve misses with the same stopping point is one weakness, not twelve problems",
    "The observation column read back is the densest revision available",
    "If it cannot be filled in under a minute while tired, cut a field",
  ],
};
