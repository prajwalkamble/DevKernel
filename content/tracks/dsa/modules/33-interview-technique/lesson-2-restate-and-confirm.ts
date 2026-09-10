import type { Lesson } from "@/content/types";

export const restateAndConfirmLesson: Lesson = {
  id: "dsa-interview-technique-restate-and-confirm",
  slug: "restate-and-confirm",
  moduleSlug: "interview-technique",
  title: "Restating the Problem, and Confirming It Before You Solve It",
  summary:
    "Thirty seconds that prevent the most expensive failure in an interview: a correct, well-explained solution to a question nobody asked.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Restate a problem in your own words rather than paraphrasing the wording",
    "Work the smallest example by hand and confirm the answer",
    "Say why this is cheap insurance against the worst outcome",
    "Recognise when the restatement itself reveals the solution",
  ],
  sections: [
    {
      id: "the-worst-outcome",
      heading: "The worst outcome",
      body: [
        "There are several ways an interview can go badly and they are not equally bad. Not finishing is recoverable. A bug you find and fix is close to neutral. Getting stuck and being unstuck by a hint is normal.",
        "The one that is unrecoverable is solving a different problem. You write forty lines, explain them clearly, state the complexity correctly, and it answers a question that was not asked. There is no partial credit, and worse, the twenty-five minutes are gone.",
        "It happens more than people expect because problem statements are compressed and often deliberately slightly ambiguous \u2014 subarray against subsequence, at most against exactly, distinct against total, return the value against return the index.",
        "The insurance is thirty seconds long and it is the same move the framework module opens with. Say the problem back, in your own words, and get a yes.",
      ],
    },
    {
      id: "how-to-restate",
      heading: "How to restate",
      body: [
        "**In your own words, not theirs.** Repeating the statement back verbatim proves nothing except that you can read. Changing the wording is what tests whether you built a model \u2014 and if you find yourself unable to say it differently, that is the signal that you have not understood it yet.",
        "**Name the input and the output precisely.** \"I am given an array of integers and a number `k`, and I return the *count* of contiguous subarrays that sum to exactly `k` \u2014 not the subarrays themselves.\" The precision is doing the work; \"find subarrays that sum to k\" would have been the same sentence with the ambiguity intact.",
        "**Then work the smallest interesting example by hand** and say the answer you get. Not the example from the statement \u2014 a smaller one you make up. This is where the remaining ambiguity surfaces, because the statement can be vague and a worked example cannot.",
        "\"So for `[1, 1, 1]` with `k = 2`, I count two: positions zero-to-one and one-to-two. Is that right?\" If the answer is \"no, they cannot overlap\", you have just saved the entire interview for the price of one sentence.",
        "**Get an explicit yes** before continuing. Not a nod you inferred \u2014 an actual confirmation. Then start solving.",
      ],
      pitfalls: [
        {
          title: "Paraphrasing rather than restating",
          body: "Swapping a few words for synonyms tests nothing. The test is whether you can express the same requirement in a structure you chose, and if you cannot, the model is not there yet.",
        },
        {
          title: "Using the statement's own example",
          body: "It was chosen to illustrate, which usually means it was chosen to be unambiguous. Your own smaller example is more likely to land on the case the statement was vague about, which is the whole point.",
        },
        {
          title: "Restating and then not waiting",
          body: "Saying it and immediately continuing gets you the appearance of confirming without the confirmation. A two-second pause and an explicit yes is the entire mechanism.",
        },
      ],
    },
    {
      id: "when-it-solves-the-problem",
      heading: "When the restatement solves the problem",
      body: [
        "Often enough that it is worth expecting. A restatement in your own words is a re-encoding, and a re-encoding sometimes lands directly on the structure.",
        "\"Find whether any two numbers sum to the target\" becomes \"for each number, has its complement already appeared\" \u2014 and the second phrasing is a hash set, stated. Nothing was solved; it was only said differently, and the different saying named the answer.",
        "\"Find the minimum number of moves\" becomes \"find the shortest path in the graph where a state is a node and a move is an edge\" \u2014 and now it is BFS, and the only remaining work is deciding what a state is.",
        "This is why the restatement comes before the brute force rather than after. It is cheap, it protects against the worst outcome, and a meaningful fraction of the time it is also the solution. Very few thirty-second investments have that profile.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the first thing you do after reading a problem?",
      answer:
        "Say it back in my own words and get an explicit yes. Not a paraphrase of their wording -- a restatement that names the input and the output precisely, like 'I am given an array and a number k and I return the count of contiguous subarrays summing to exactly k, not the subarrays themselves'. Then I work a small example I made up, not the one from the statement, and say the answer I get: 'so for one-one-one with k of two, I count two, is that right?'. That takes thirty seconds and it protects against the only unrecoverable failure in an interview, which is solving a different problem correctly. And often enough the restatement is the solution -- 'has this number's complement already appeared' is a hash set, stated.",
    },
    {
      question: "Why not just start coding if the problem seems clear?",
      answer:
        "Because the statements that seem clear are exactly the ones where the ambiguity is invisible -- subarray against subsequence, at most against exactly, return the value against return the index. If I have misread it, I find out after twenty-five minutes with forty lines written, and there is no partial credit for a correct solution to a question nobody asked. The restatement costs thirty seconds and it is the cheapest insurance in the interview. The worked example is the part that actually catches things, because a statement can be vague and a concrete answer cannot.",
    },
  ],
  takeaways: [
    "The one unrecoverable failure is solving a different problem correctly",
    "Restate in your own words — paraphrasing the wording tests nothing",
    "Name input and output precisely: the count, not the subarrays",
    "Work your own small example, not the statement's, and say the answer",
    "Wait for an explicit yes before you start solving",
    "A restatement is a re-encoding, and re-encodings sometimes name the structure",
    "\"Has the complement already appeared\" is a hash set, said out loud",
  ],
};
