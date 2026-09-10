import type { Lesson } from "@/content/types";

export const reSolvingLesson: Lesson = {
  id: "dsa-the-sheet-re-solving",
  slug: "re-solving",
  moduleSlug: "the-sheet",
  title: "Re-Solving From Scratch, and the Spacing That Makes It Stick",
  summary:
    "Which problems are worth revisiting, what \"from scratch\" has to mean for the revisit to measure anything, and how this differs from the pattern-level spacing in the previous module.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Choose which problems earn a revisit",
    "Define \"from scratch\" strictly enough that the revisit is a test",
    "Space revisits by what the first attempt cost",
    "Say what problem-level revisiting adds over pattern-level spacing",
  ],
  sections: [
    {
      id: "what-earns-a-revisit",
      heading: "What earns a revisit",
      body: [
        "Not everything. A sheet of a hundred problems revisited on a schedule is a second sheet of a hundred problems, and the point of revisiting is to be cheaper than that.",
        "**Worth revisiting:** anything you looked up. The whole of the previous lesson was about a problem you did not solve, and the revisit is where you find out whether the four steps took.",
        "**Worth revisiting:** anything you solved slowly or messily. Getting there in fifty minutes with three false starts means the pattern is not automatic, and it will not be automatic in three weeks either.",
        "**Worth revisiting:** anything whose observation surprised you, even if you got it. Surprise means it was not on your list, and a thing that is not on your list is a thing you will miss next time in a different disguise.",
        "**Not worth revisiting:** anything you solved cleanly and quickly. It is done. Re-solving it is a pleasant way to feel productive and it teaches nothing, and it is where most people's revision time goes.",
        "That triage typically leaves a third of the sheet, which is the difference between revision being affordable and being abandoned.",
      ],
    },
    {
      id: "from-scratch-means-from-scratch",
      heading: "From scratch means from scratch",
      body: [
        "Empty file. No looking at your old solution first, not even for a second, and no looking at the statement's tag or section.",
        "That last one matters more than it sounds. Re-solving a problem from inside the section you first met it in tells you the pattern before you start, which removes the only part that was failing. If you can, meet it again out of context \u2014 in a mixed list, without the heading.",
        "\"From scratch\" also has to include the *decision*. Say the four outputs from module 31 out loud before writing anything: restatement, target, structure, pattern. If those arrive instantly, the revisit has passed and you can stop there without writing the code at all. The code was never the part in question.",
        "That is worth saying plainly, because it makes revisiting much cheaper than it is usually described. Most revisits should take two minutes, not thirty: name the four things, confirm they came instantly, move on. Only the ones where they do not come get the full re-solve.",
      ],
      pitfalls: [
        {
          title: "Glancing at your old solution to \"remind yourself\"",
          body: "That converts the test into a reading exercise, and you will pass it. If you need the reminder, that is the result of the test -- write it down and re-solve properly.",
        },
        {
          title: "Re-solving inside the original section",
          body: "The heading is the answer to the only question that was hard. If the revisit is going to measure recognition, it has to arrive without the topic attached.",
        },
        {
          title: "Writing the whole thing every time",
          body: "If the four outputs arrive instantly the revisit has already passed. Typing the implementation again mostly measures typing, and it is why people abandon revision as too slow.",
        },
      ],
    },
    {
      id: "spacing-and-what-this-adds",
      heading: "Spacing, and what this adds",
      body: [
        "Space by what the first attempt cost. Looked it up: see it again in a few days. Solved it slowly: a week or two. Surprised you but you got it: a couple of weeks. That is the whole schedule, and as with the previous module it is not worth tuning \u2014 the material matters more than the intervals.",
        "The natural question is what this adds over module 31's pattern-level spacing, given that lesson argued re-solving a solved problem mostly measures memory of the problem. Both are true and they measure different things.",
        "**Pattern spacing** uses statements you have never seen, and it tests recognition. That is the primary practice and it is the one that transfers.",
        "**Problem revisiting** uses problems you failed, and it tests whether the specific repair took. It is narrower and it is the only way to find out whether the four steps in the previous lesson did anything \u2014 because the thing being checked is exactly the problem they were applied to.",
        "So they are not competitors. One asks \"can I recognise this pattern in the wild\", the other asks \"did that particular hole get filled\". Both are cheap if you triage properly, and both collapse into busywork if you do not.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Do you re-solve problems you have already done?",
      answer:
        "Some of them, and I triage hard. Anything I looked up gets revisited, because that is the only way to find out whether the repair took. Anything I solved slowly or messily, because that means the pattern is not automatic. And anything whose key observation surprised me, even if I got it, because surprise means it was not on my list. What I do not revisit is anything I solved cleanly and quickly -- it is done, and re-solving it is a pleasant way to feel productive. That triage usually leaves about a third of a sheet, which is the difference between revision being affordable and being abandoned.",
    },
    {
      question: "What does re-solving from scratch actually involve?",
      answer:
        "Empty file, no glance at the old solution, and ideally the problem met out of context so the section heading does not tell me the pattern. But the important part is that it starts with the decision, not the code: I say the restatement, the target complexity, the structure and the pattern out loud, and if those arrive instantly the revisit has passed and I stop -- the implementation was never the part in question. That makes most revisits two minutes rather than thirty, and only the ones where the four things do not come get a full re-solve.",
    },
  ],
  takeaways: [
    "Revisit what you looked up, solved slowly, or were surprised by — not what went cleanly",
    "That triage leaves about a third of a sheet, which is what makes revision affordable",
    "From scratch means empty file, no glance at the old solution, and no section heading",
    "The revisit starts with the four outputs; if they come instantly it has already passed",
    "Most revisits should take two minutes, not thirty",
    "Space by what the first attempt cost: looked up, days; slow, a week or two",
    "Pattern spacing tests recognition on unseen statements — the primary practice",
    "Problem revisiting tests whether one specific repair took — narrower, and the only way to know",
  ],
};
