import type { Lesson } from "@/content/types";

export const sortingSheetLesson: Lesson = {
  id: "dsa-sort-sheet",
  slug: "the-sheet-sorting",
  moduleSlug: "sorting",
  title: "The Sheet: Where Sorting Is the Whole Idea",
  summary:
    "The problems where the entire solution is choosing what to sort by. Each one drills a specific decision — which key, which direction, and whether to sort at all.",
  estimatedMinutes: 30,
  objectives: [
    "Recall the standard sorting-led problems and the move each drills",
    "Decide quickly whether a problem wants a sort",
    "Recognise the problems where sorting is the trap",
  ],
  sections: [
    {
      id: "warm-up",
      heading: "Where the sort is the answer",
      body: [
        "**Merge Intervals** — sort by start, sweep, and remember `max` on the end. The template for everything interval-shaped.",
        "**Insert Interval** — the same sweep without the sort, since the input is already ordered. Worth doing right after Merge Intervals to see what the sort was doing.",
        "**Non-overlapping Intervals** — sort by **end** and take greedily. The pair to Merge Intervals, and the one that teaches why the key choice is the algorithm.",
        "**Meeting Rooms II** — sort starts and ends separately and sweep with two pointers, or use a heap of end times. Two correct solutions with different shapes, which makes it a good one to discuss out loud.",
        "**Largest Number** — the comparator *is* the problem: order by which concatenation is larger. Prove to yourself it is transitive.",
        "**H-Index** — sort descending and find where the citation count meets the position. The counting-sort variant is the O(n) follow-up.",
        "**Sort Colors** — the Dutch National Flag. Counting sort's idea as a single in-place pass with three pointers.",
        "**Wiggle Sort** — sort, then interleave the halves. The one where the sort is followed by a non-obvious rearrangement.",
      ],
    },
    {
      id: "sort-plus",
      heading: "Where the sort enables something else",
      body: [
        "**3Sum** and **3Sum Closest** — sort, fix one element, two pointers on the rest. The sort is what makes the two-pointer sweep valid, and skipping duplicates is the fiddly part.",
        "**4Sum** — the same shape one level deeper.",
        "**Two Sum II** — already sorted, so two pointers at O(1) space. The contrast with Two Sum is the whole lesson: same question, different structure available.",
        "**Minimum Absolute Difference** — sort and scan adjacent pairs. Adjacency is exactly what the sort bought.",
        "**Longest Consecutive Sequence** — the trap. Sorting gives O(n log n) and works; the question wants O(n) and a set. Do it both ways.",
        "**Top K Frequent Elements** — count, then bucket by frequency for O(n). Sorting the counts is the answer to beat.",
        "**Kth Largest Element** — quickselect for O(n) average, or a size-k heap. Sorting is O(n log n) for one element, which is the point being made.",
        "**Group Anagrams** — sorting *within* each word to build the key, not sorting the collection. A useful reminder that the sort can be at a different level than you expect.",
      ],
    },
    {
      id: "how-to-decide",
      heading: "Deciding quickly",
      body: [
        "Three questions, in order.",
        "**Does the answer involve positions?** If yes, sorting costs you them — carry indices or find another way.",
        "**Is there an O(n) requirement, stated or implied by the constraints?** n up to 10⁶ with a tight limit usually rules out the log factor. n up to 10⁵ almost never does.",
        "**What property would order give me?** Adjacency, monotonicity, or a greedy order. If you can name it, sort. If you cannot, the sort is probably a reflex rather than a plan.",
        "And one habit worth building: when you do sort, say what you are sorting **by** and why, before writing the comparator. In interval problems especially, start-versus-end is the entire decision, and articulating it is what separates a solution from a guess.",
      ],
      pitfalls: [
        {
          title: "Sorting because it feels productive",
          body: "Sorting is a satisfying first move and often does nothing. If the subsequent code never relies on adjacency, monotonicity or a greedy order, the sort is a log factor spent on nothing.",
        },
        {
          title: "Not checking whether the input is already sorted",
          body: "Problem statements say so, and it changes the available solutions — Two Sum II versus Two Sum is exactly this distinction. Re-sorting sorted input is harmless but signals you did not read the constraints.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Merge Intervals versus Non-overlapping Intervals — why different sort keys?",
      answer:
        "Merging needs intervals in start order so each can only overlap the previous one. Greedy selection needs end order, because keeping the earliest-ending interval leaves the most room for the rest — that is the exchange argument the proof depends on.",
    },
    {
      question: "Longest Consecutive Sequence — why is sorting the wrong answer?",
      answer:
        "It works and is O(n log n), but the problem asks for O(n). Put everything in a set and only start counting from values whose predecessor is absent; each run is then walked once, giving O(n).",
    },
    {
      question: "How do you decide whether to sort?",
      answer:
        "Ask whether the answer needs positions, whether the constraints forbid the log factor, and what property order would buy — adjacency, monotonicity or a greedy order. If none of the three applies, the sort is not doing anything.",
    },
  ],
  takeaways: [
    "Sort by start to merge, by end to select greedily",
    "Sorting to find one element is a complexity class too slow",
    "Longest Consecutive is the trap where the sort is the wrong answer",
    "Two Sum II shows what already-sorted input makes available",
    "In Group Anagrams the sort is inside the key, not over the collection",
    "Name the property order buys before you pay for it",
  ],
  status: "available",
};
