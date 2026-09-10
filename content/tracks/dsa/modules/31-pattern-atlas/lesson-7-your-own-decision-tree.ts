import type { Lesson } from "@/content/types";

export const decisionTreeLesson: Lesson = {
  id: "dsa-pattern-atlas-decision-tree",
  slug: "your-own-decision-tree",
  moduleSlug: "pattern-atlas-drills",
  title: "Building Your Own Decision Tree, and Pruning It",
  summary:
    "Somebody else's pattern flowchart does not work, and the reason is specific. How to grow one from your own misses, and why the useful version keeps getting smaller.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Say why a borrowed decision tree does not transfer",
    "Grow a tree from your own recorded misses rather than from a taxonomy",
    "Prune a branch once it has become automatic",
    "Keep the tree small enough to run in sixty seconds",
  ],
  sections: [
    {
      id: "why-borrowed-trees-fail",
      heading: "Why a borrowed tree fails",
      body: [
        "There is a well-known genre of diagram: a flowchart with \"Is it a tree?\" at the top, branching down through twenty patterns. People print them, and they do not work.",
        "The reason is not that the diagrams are wrong. It is that a decision tree is a compression of *someone else's* mistakes. Its branches are placed where its author kept going wrong, and those are not the places you keep going wrong. Reading it teaches you the taxonomy, which you already have by this point in the track, and not the discrimination, which is the thing you are missing.",
        "The other reason is size. A twenty-node flowchart cannot be run in sixty seconds from memory. Anything you have to look at is not doing the job \u2014 the job is to be the thing that fires while you are reading the statement.",
      ],
    },
    {
      id: "growing-one",
      heading: "Growing one from your own misses",
      body: [
        "The log from lesson one is the raw material. Every time you get a repetition wrong, you wrote down which of the four outputs you missed. Now go further: write the *pair* you confused.",
        "\"I said window, it was prefix map.\" \"I said DP, it was greedy.\" \"I said heap, it was a sort.\" \"I said BFS, it was Dijkstra.\" Each of those is one branch, and a branch is only worth adding once you have confused the same pair twice \u2014 once is noise.",
        "A branch has three parts and all three are needed. The **pair**, the **question that separates them**, and the **place the answer lives**. For lesson four's pair that is: window against prefix map; can the values be negative; the constraints. For lesson five: greedy against DP; does the decision need the answer to a smaller instance; the recurrence you can write in one line.",
        "Write the question in the form you would actually ask yourself, not in the form a textbook would state it. \"Can this go negative\" beats \"is the monotonicity precondition satisfied\", because the first one fires while you are reading and the second one does not.",
        "Six or eight branches is a working tree. That is enough to cover the confusions a single person actually has, and few enough to run without looking.",
      ],
      pitfalls: [
        {
          title: "Adding a branch after one miss",
          body: "One wrong answer is noise -- you were tired, or you misread. A pair earns a branch on the second confusion, and by then you will also be able to write a sharper separating question, because you have two examples of it rather than one.",
        },
        {
          title: "Writing the question in textbook language",
          body: "The branch has to fire while you are reading a statement under time pressure. \"Can these be negative\" fires. \"Does the problem satisfy the monotonicity precondition required for the two-pointer invariant\" does not, however correct it is.",
        },
        {
          title: "Growing the tree instead of using it",
          body: "The tree is a by-product of the drill, not a replacement for it. A beautifully organised twelve-branch tree built in an afternoon without any repetitions behind it is the borrowed flowchart again, with your handwriting on it.",
        },
      ],
    },
    {
      id: "pruning",
      heading: "Pruning, which is the point",
      body: [
        "A branch is finished when it stops firing consciously. Once \"can the values be negative\" is something you notice without asking, the branch has done its job and it can come out of the tree.",
        "This is the part people skip, and it matters because the tree's value is inversely proportional to its size. A tree you can run in five seconds gets run. A tree with fifteen branches gets consulted, which is a different and much slower thing.",
        "So the tree should be shrinking over time, not growing. Add a branch when a confusion repeats; remove one when it has become automatic. A tree that keeps getting bigger is a sign that nothing is becoming automatic, which is a signal about how you are practising rather than about the tree.",
        "The end state is a tree with nothing in it, which sounds like a joke and is the actual goal. The branches did not disappear; they moved from a list you consult into the reading itself. That transition \u2014 from a rule you apply to a thing you notice \u2014 is what recognition *is*, and it is the only reason to have written any of it down.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Do you use a pattern decision tree?",
      answer:
        "A short one, and one I built rather than one I found. Printed flowcharts are a compression of someone else's mistakes, and their branches sit where that person kept going wrong, which is not where I keep going wrong. Mine comes from a log of the pairs I have actually confused -- window against prefix map, greedy against DP -- and each branch is the pair, the question that separates them, and where the answer lives. Six or eight branches, small enough to run from memory in a few seconds. And I take branches out once the question stops needing to be asked, because a tree I have to consult is too slow to be useful.",
    },
  ],
  takeaways: [
    "A borrowed flowchart encodes someone else's confusions, not yours",
    "Build branches from a log of pairs you have actually mixed up",
    "A pair earns a branch on the second confusion, not the first",
    "A branch is the pair, the separating question, and where the answer lives",
    "Write the question the way you would ask it under time pressure",
    "Six or eight branches is a working tree; fifteen is a document",
    "Prune a branch once it fires without being asked — the tree should shrink",
    "The end state is an empty tree, because the branches moved into the reading",
  ],
};
