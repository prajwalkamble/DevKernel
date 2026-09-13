import type { Lesson } from "@/content/types";

export const spacingPatternsLesson: Lesson = {
  id: "dsa-pattern-atlas-spacing-patterns",
  slug: "spacing-patterns",
  moduleSlug: "pattern-atlas-drills",
  title: "Spacing Patterns Rather Than Problems",
  summary:
    "Revisiting a problem you have solved tests recall of that problem. Revisiting a pattern tests the thing you need. What to put on the card, and how to space it.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Say why re-solving a solved problem measures the wrong thing",
    "Write a repetition card whose front is a statement you have not seen",
    "Space repetitions by whether the recognition was instant, slow or absent",
    "Retire a pattern from the rotation on evidence",
  ],
  sections: [
    {
      id: "the-wrong-unit",
      heading: "The wrong unit",
      body: [
        "The standard advice is to re-solve problems you have solved before, on a schedule. It is better than nothing and it measures the wrong thing.",
        "When you re-solve a problem you have seen, what you are exercising is memory of that problem. The recognition step \u2014 the one that costs you twenty seconds on something new \u2014 does not happen, because you already know the answer before you finish reading. You will feel fluent and the fluency will not transfer.",
        "The unit that transfers is the *pattern*, and a pattern is only tested by a statement you have not seen. So the card cannot be the problem you solved. It has to be a different problem with the same shape.",
      ],
    },
    {
      id: "what-goes-on-the-card",
      heading: "What goes on the card",
      body: [
        "**Front:** a statement you have never solved, in two or three lines, with its constraints. Nothing else \u2014 no title, no source, no tag. A tag on the front destroys the card, because the tag is the answer.",
        "**Back:** the four outputs from lesson one. The restatement, the target complexity, the structure, the pattern. Plus one line saying what the tell was.",
        "Grading is the four outputs, not the solution. You are not writing code on a card.",
        "Sourcing the fronts is the only fiddly part, and there are two easy ways. One: when you solve a problem, find two more with the same shape and put *those* on cards, unsolved. Two: keep the statements from drill sessions you got wrong \u2014 you have already established you cannot recognise them, which is precisely what makes them good cards.",
        "A pattern needs several cards, not one. One card per pattern turns into recall of that card within a week. Four or five statements per pattern, drawn from different settings, is enough that what you are recognising is the shape rather than the wording.",
      ],
      pitfalls: [
        {
          title: "Putting the pattern name on the front",
          body: "It reads like a helpful label and it turns the card into a definition quiz. The front is a statement and nothing else; if you need a reference to find the card again, put it on the back.",
        },
        {
          title: "One card per pattern",
          body: "Within a week you will be recognising the card rather than the pattern, and it will feel like success. Several statements per pattern, from different settings, is the only way the card keeps measuring what you want.",
        },
        {
          title: "Grading yourself on whether you could solve it",
          body: "The card is a recognition card. If you name the four outputs correctly, that is a pass, even if you would have needed twenty minutes to write the code. Implementation is a different skill with a different practice, and mixing them makes both slower.",
        },
      ],
    },
    {
      id: "the-spacing",
      heading: "The spacing, and when to stop",
      body: [
        "Space by *how the recognition felt*, in three buckets, which is the only distinction that turns out to matter.",
        "**Instant** \u2014 you knew before finishing the statement. Push it far out; the next repetition can be weeks away.",
        "**Slow but correct** \u2014 you got there in forty seconds with some hesitation. This is the interesting bucket and it wants a medium gap, a few days. The hesitation is the thing being trained.",
        "**Missed** \u2014 see it again soon, and while you are at it check whether the miss is one of the confusions from lesson seven that deserves a branch.",
        "Do not over-engineer the intervals. The gains here come from the material being right \u2014 unseen statements, four outputs, several per pattern \u2014 not from the schedule being finely tuned. Any spacing that pushes easy things away and brings back hard things will do.",
        "**Retiring a pattern** is the part worth being deliberate about. A pattern comes out of the rotation when you have hit *instant* on several different statements for it, in different settings, over at least a few weeks. That is evidence about the pattern. Hitting instant three times on the same card is evidence about the card.",
        "And when the rotation empties, that is not the end of the practice \u2014 it is the point at which the drill from lesson one is the practice again, on new statements, generating the next round of misses. The rotation is a queue of your current confusions, and it should keep turning over rather than keep growing.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you make sure a topic you learned stays learned?",
      answer:
        "By spacing repetitions over patterns rather than over problems. Re-solving a problem I have already solved mostly tests memory of that problem -- I know the answer before I finish reading, which feels fluent and does not transfer. So the card is a statement I have never solved, with its constraints and no tag on the front, and the back is the four things: the restatement, the target complexity, the structure and the pattern. I keep several statements per pattern, from different settings, because with one card I start recognising the card. Spacing is three buckets by how the recognition felt -- instant goes weeks out, slow-but-correct comes back in a few days, missed comes back soon. And a pattern only leaves the rotation after it has been instant on several different statements over a few weeks, which is evidence about the pattern rather than about the card.",
    },
  ],
  takeaways: [
    "Re-solving a solved problem tests recall of that problem, not the pattern",
    "The card's front is a statement you have not solved, with constraints and no tag",
    "The back is the four outputs, and grading is on those, not on code",
    "Several statements per pattern, from different settings — one card becomes recall of that card",
    "Space by how the recognition felt: instant, slow-but-correct, missed",
    "Do not tune the intervals; the material matters far more than the schedule",
    "Retire a pattern after several different statements have been instant over weeks",
    "An empty rotation means going back to the drill, not that the practice is over",
  ],
};
