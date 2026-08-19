import type { Lesson } from "@/content/types";

export const whyYouFreezeLesson: Lesson = {
  id: "dsa-framework-why-you-freeze",
  slug: "why-you-freeze",
  moduleSlug: "the-framework",
  title: "Why You Freeze, and What to Do Instead",
  summary:
    "The specific reason a problem you could follow the solution to is a problem you cannot solve — and the seven-step method that replaces staring with working.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Name the difference between recognising a solution and finding one, and why studying more solutions does not close it",
    "Describe what your attention is actually doing during the minutes you spend staring at a problem",
    "State the seven steps of the framework in order, and say what each one produces",
    "Explain why the order is fixed, and what goes wrong when a step is skipped",
  ],
  sections: [
    {
      id: "the-gap",
      heading: "The gap nobody names",
      body: [
        "You have almost certainly had this experience. You open a problem. You read it. Nothing comes. You read it again, more slowly, as though the answer were hidden in the wording. Ten minutes pass. Twenty. Eventually you open the solution, and it is not even complicated — it is a hash map, or two pointers, something you have used a dozen times. You read it and think: *of course*. And then the next problem happens exactly the same way.",
        "The instinct at that point is to conclude you need to learn more algorithms. That instinct is wrong, and acting on it is why people take three courses and still freeze. You did not fail to solve that problem because you did not know what a hash map was. You knew. You failed because nothing in the problem told you — or rather, nothing told you *that you were listening to*.",
        "There are two distinct skills here and almost all teaching material builds only the first one.",
        "**Recognition** is being shown a solution and understanding why it works. It feels like learning, it is pleasant, and it is what watching a solution video or reading an editorial gives you. It is also almost worthless on its own, because in an interview or a contest nobody shows you the solution.",
        "**Retrieval** is being shown a *problem* and producing the solution. It is uncomfortable, it is slow, and it is the entire job. And the reason it does not develop from doing more of the first thing is that they are different operations: recognition runs backwards from an answer, retrieval runs forwards from a statement.",
        "This module is about the forwards direction. Not more algorithms — a procedure for getting from a statement you have never seen to the point where writing code is obvious.",
      ],
    },
    {
      id: "what-staring-is",
      heading: "What is actually happening while you stare",
      body: [
        "It is worth being precise about the failure, because the fix follows directly from it.",
        "When you stare at a problem, you are running an unstructured search of your memory for a matching solution. You are, in effect, asking yourself *what is the answer?* — a question with no partial credit. Either the whole answer arrives or nothing does, and there is no way to make progress on it. That is why the time passes without anything happening: you are not stuck on a step, you are stuck on a question that has no steps.",
        "Everyone who is good at this asks a different question, and asks several of them in sequence. Not *what is the answer?* but: what is this problem actually asking? What is the stupidest thing that would work? How big can the input get, and what does that permit? What operation does this do most? Which of the shapes I know has that operation at its centre?",
        "Every one of those questions is answerable in under a minute, and every answer narrows the search. That is the whole difference. Not a better memory — a better sequence of questions.",
        "Notice something else about that list: none of those questions is *what is the answer?*. You never ask it. The answer arrives as a consequence of the last two, or it does not arrive and you know precisely which question you got stuck on — which is diagnosable, unlike staring.",
      ],
      pitfalls: [
        {
          title: "\"I'll just do more problems\"",
          body: "Volume without method makes you faster at problems you have already seen and no better at problems you have not. If you have solved 200 problems and a fresh medium still produces a blank page, the constraint is not the count. Twenty problems worked through this framework deliberately will move you further than two hundred looked up.",
        },
        {
          title: "Reading the solution the moment you feel stuck",
          body: "Feeling stuck is not information about whether you are stuck — it is information about your comfort. The framework gives you something to do at every point, so \"stuck\" becomes a specific claim: I cannot restate it, or I cannot see the brute force, or I have the brute force and cannot see what to exploit. Each of those has a different remedy, and only the last one is ever a reason to look at a solution.",
        },
      ],
    },
    {
      id: "the-seven-steps",
      heading: "The seven steps",
      body: [
        "Here is the whole framework. Each step produces something concrete — a sentence, a number, a name — and you do not move on until you have it.",
        "**1 · Restate.** Say what the problem wants in one sentence, in your own words, using no vocabulary from the statement. If you cannot, you have not understood it yet, and everything after this would be guessing.",
        "**2 · Represent.** Work the smallest interesting example by hand, on paper, and write down exactly what type goes in and what type comes out. This is where you catch the misreadings — subarray against subsequence, indices against values, one-indexed against zero-indexed.",
        "**3 · Brute force.** State the solution that tries everything, and its complexity. Always. Even when you can already see the fast answer. This proves you understood the question, it gives you something correct to compare against later, and it is very often the thing you optimise rather than replace.",
        "**4 · Read the constraints.** Look at the largest n and work backwards to the complexity you are allowed. This is the single highest-value habit in the whole track, and it is almost never taught: the constraints are the problem-setter telling you what the intended solution is.",
        "**5 · Choose the structure.** Ask which operation the problem performs most, and pick the structure that makes that operation cheap. Not the structure you like — the one the dominant operation names.",
        "**6 · Choose the pattern.** Match the shape of the problem against the shapes you know. By this point you have a target complexity and a structure, and there are usually only two candidates left.",
        "**7 · Write it.** State the invariant, then write the loop that maintains it, then test it — the small example from step 2, the edge cases, and the brute force from step 3 as an oracle.",
        "Six of those seven steps happen before you touch the keyboard. That is not discipline for its own sake; it is where the leverage is. Code written after steps 1–6 tends to be right the first time, because every decision it encodes has already been made deliberately.",
      ],
      examples: [
        {
          id: "two-monologues",
          title: "The same problem, two internal monologues",
          lang: "bash",
          code: `Problem: given a sorted array and a target, return the indices of the two
numbers that add to it. Constant extra space. 2 <= n <= 30000.

WITHOUT the framework
  "OK... two numbers... adding to a target... I've seen this...
   was it a hash map? I think it was a hash map. But it says constant
   space. Hmm. Maybe... sort it? It's already sorted. Hmm."
  [ elapsed: 12 minutes, written: 0 lines ]

WITH the framework
  1 Restate    find the one pair that sums to the target; return where they are
  2 Represent  int[] + int in, int[2] of 1-based indices out. n>=2, exactly one answer
  3 Brute      every pair, O(n^2). Correct. Too slow at 30000? 4.5e8 pairs - borderline
  4 Constraints n <= 3e4 and O(1) space demanded => the hash map is banned on purpose
  5 Structure  no structure allowed at all. So the answer uses only indices
  6 Pattern    sorted + pair + O(1) space => two pointers from both ends
  7 Write      invariant: every untried pair lies between lo and hi
  [ elapsed: 90 seconds, and step 6 was forced rather than guessed ]`,
          explanation:
            "Look at step 4 in the second column. The constant-space requirement is not an inconvenience — it is the problem-setter pointing directly at the technique, by outlawing the other one. The first monologue treats it as an obstacle to work around; the second reads it as an instruction. That is the same information producing a blank page or a solution, depending only on whether you were asking a question it could answer.",
        },
      ],
    },
    {
      id: "order-matters",
      heading: "Why the order is fixed",
      body: [
        "The steps are not a checklist you can shuffle. Each one supplies something the next one consumes, and skipping one does not save time — it just moves the failure later, where it is more expensive.",
        "**Skipping the restatement** means you solve a problem adjacent to the one asked. This is the most common failure in interviews and the most embarrassing, because you can write a beautiful correct solution to the wrong question and not find out for twenty minutes.",
        "**Skipping the brute force** costs you your only reference for correctness, and it removes the thing you were going to optimise. Almost every fast algorithm is a brute force with one specific waste eliminated. If you never wrote the brute force, you never saw the waste, and you are left trying to invent the answer from nothing — which is the staring you were trying to escape.",
        "**Skipping the constraints** means you have no target. You will either build something too slow and discover it at submission time, or spend twenty minutes finding an O(n log n) solution to a problem where n ≤ 100 and the brute force was the intended answer. Both are avoidable by reading two lines.",
        "**Choosing the pattern before the structure** is backwards, and it is the mistake experienced-but-stuck people make: they reach for a remembered pattern and then try to force the problem into it. The structure follows from what the problem *does* most, and the pattern follows from the structure. In that order you are deducing; in the other order you are guessing and then defending the guess.",
      ],
      pitfalls: [
        {
          title: "Treating the framework as ceremony",
          body: "On an easy problem steps 1 to 6 take forty seconds and mostly happen in your head. That is fine and correct — the point is that they happen, not that they are written out. The discipline of writing them down is for practice and for hard problems, exactly like a musician practising slowly to play fast.",
        },
        {
          title: "Expecting it to produce the answer",
          body: "It will not, and nothing will. What it produces is a sequence of positions from which the answer is a short step, and a clear statement of which step you are stuck on when it is not. \"I have the brute force and the target complexity and I cannot see what to exploit\" is a solvable state; \"I don't know\" is not.",
        },
      ],
    },
    {
      id: "what-this-buys",
      heading: "What this actually buys you",
      body: [
        "Three things, and it is worth being concrete about them because they are the reason to spend a module on process rather than on algorithms.",
        "**You always have something to do.** There is no state in which the correct action is to stare. Every step has an output; if you do not have it, that is the work.",
        "**Your stuck-ness becomes diagnosable.** Over ten problems you will notice you are always fine until step 6, or that you always skip step 4 and pay for it. That is a specific weakness with a specific fix, which is worth more than a vague sense that you are bad at DP.",
        "**You get an interview transcript for free.** Steps 1 to 6 are, almost word for word, what a strong candidate says out loud. Interviewers are not primarily assessing whether you produce the optimal solution — they are assessing whether your reasoning is legible. A candidate who restates the problem, gives the brute force, reads the complexity target off the constraints, and *then* reaches for the right structure has already demonstrated most of what is being measured, even if the final code has a bug in it.",
        "The rest of this module takes the seven steps one at a time. The last lesson runs all of them, from cold, on a problem that appears nowhere else in this track.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "You are given a problem and you have no idea how to start. What do you actually do?",
      answer:
        "Say what it asks in one sentence in your own words, then work the smallest example by hand. If that produces nothing, describe the brute force — trying every candidate answer — and state its complexity. Between them those two steps make almost every problem tractable, because they force you to name the answer space, and every faster technique is a way of not searching all of it. Saying this out loud is also exactly what an interviewer wants to hear, because it shows you have a method rather than a memory.",
    },
    {
      question: "Why write a brute-force solution when you already know the optimal one?",
      answer:
        "Three reasons. It proves you have understood the question before you commit to a clever answer to a different one. It gives you an oracle — an obviously-correct implementation you can test the fast version against on random inputs, which finds bugs no hand-picked example will. And in an interview it buys you a correct answer on the board early, so you are optimising from a working solution rather than gambling everything on getting the fast one right first time.",
    },
    {
      question: "How do you decide which data structure to use?",
      answer:
        "By asking which operation the problem performs most, and picking the structure that makes it cheap. Repeated membership tests point at a hash set; repeated 'the smallest remaining' at a heap; repeated 'the most recent unresolved thing' at a stack; repeated range sums at a prefix array. The mistake is to start from the structure you are comfortable with and look for a way to use it — the operation names the structure, not your preference.",
    },
  ],
  takeaways: [
    "Recognising a solution and retrieving one are different skills; only the second is tested, and studying solutions builds only the first",
    "Staring is what happens when you ask \"what is the answer?\", a question with no partial credit and no next step",
    "The framework replaces that with seven questions that each have an answer in under a minute",
    "Restate, represent, brute force, read the constraints, choose the structure, choose the pattern, then write",
    "Six of the seven steps happen before you type anything, and that is where the leverage is",
    "Skipping a step does not save time; it moves the failure later, where it costs more",
    "The framework does not produce answers — it produces positions from which the answer is short, and a name for where you are stuck when it is not",
  ],
};
