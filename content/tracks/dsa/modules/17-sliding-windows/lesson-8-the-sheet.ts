import type { Lesson } from "@/content/types";

export const windowSheetLesson: Lesson = {
  id: "dsa-sw-sheet",
  slug: "the-sliding-window-sheet",
  moduleSlug: "sliding-windows",
  title: "The Sheet: Recognising a Window",
  summary:
    "The signal is narrower than people think, and half of learning this pattern is learning when *not* to reach for it. Three questions, then twelve problems in the order that builds.",
  estimatedMinutes: 25,
  objectives: [
    "Name the three-part signal for a sliding window",
    "Rule the pattern out quickly when it does not apply",
    "Work the sheet in an order where each problem earns the next",
    "State the complexity before writing code",
  ],
  sections: [
    {
      id: "the-signal",
      heading: "The three-part signal",
      body: [
        "All three parts must be present. Two out of three is a different pattern.",
        "**1. Contiguous.** The answer is a *subarray* or a *substring*, not a subsequence and not a subset. If elements may be skipped, this is not a window.",
        "**2. Longest, shortest, or count.** The question is about the extent of a stretch, or how many stretches qualify — not about the elements themselves.",
        "**3. A condition that is monotone under growth.** Adding an element pushes the condition one way; removing pushes it back. Lesson 3 is entirely about checking this.",
        "The words that most often mark it: *longest*, *shortest*, *maximum length*, *minimum length*, *at most*, *contains all*, *without repeating*.",
      ],
    },
    {
      id: "ruling-out",
      heading: "Ruling it out fast",
      body: [
        "**\"Subsequence\"** — not contiguous, so not a window. Usually DP or greedy.",
        "**Negative numbers with a sum condition** — not monotone. Prefix sums with a hash map.",
        "**\"Exactly k\"** in a counting problem — not monotone directly, but try `atMost(k) - atMost(k-1)`.",
        "**A maximum or median as the window state** — needs a monotonic deque or two heaps, not a plain window.",
        "**The window size is fixed and the state is a comparison against a target map** — still a window, and the simplest kind; do not over-engineer it.",
      ],
    },
    {
      id: "the-sheet",
      heading: "The sheet, in order",
      body: [
        "**Fixed size, to get the mechanics.** *Maximum Average Subarray I* (643). *Find All Anagrams in a String* (438). *Permutation in String* (567) — the same problem as 438 with a different return.",
        "**Variable, longest.** *Longest Substring Without Repeating Characters* (3), which is the canonical one. *Max Consecutive Ones III* (1004), where the state is a count of flips used. *Longest Repeating Character Replacement* (424) — harder than it looks; the state is the window length minus the most frequent character's count.",
        "**Variable, shortest.** *Minimum Size Subarray Sum* (209). *Minimum Window Substring* (76), the hardest in the module — give it a full sitting.",
        "**Counting.** *Subarrays with K Different Integers* (992), which is the at-most-k subtraction. *Count Number of Nice Subarrays* (1248), the same trick on parity. *Binary Subarrays With Sum* (930).",
        "**Beyond the plain window.** *Sliding Window Maximum* (239). *Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit* (1438), which needs two deques.",
      ],
    },
    {
      id: "before-coding",
      heading: "Before you type",
      body: [
        "**What is the state, and is removal O(1)?** If removal is expensive, decide now whether you need a deque.",
        "**Longest or shortest?** That fixes whether the shrink runs while invalid or while valid, and where the answer is recorded.",
        "**Is the condition monotone?** Say the reason. If you cannot, stop and reconsider the pattern.",
        "Then state the complexity — O(n) for almost everything here, O(n log n) if you took the heap route for a maximum — and write it.",
      ],
      pitfalls: [
        {
          title: "Using a window because the problem mentions subarrays",
          body: "\"Maximum subarray sum\" mentions subarrays and is Kadane's, not a window, because negatives break monotonicity. \"Subarray sum equals k\" mentions subarrays and is prefix sums plus a hash map. The word *subarray* is necessary for a window and nowhere near sufficient.",
        },
        {
          title: "Not revisiting",
          body: "The loop shape is small enough to feel learned after two problems and is not. Re-solve one variable-size problem from a blank editor a day after finishing this module — specifically a *shortest* one, since the record-inside-the-shrink placement is the detail that fades first.",
        },
      ],
    },
  ],
  takeaways: [
    "Three-part signal: contiguous, an extent-or-count question, and a monotone condition",
    "\"Subsequence\" rules it out immediately",
    "Negatives with a sum condition means prefix sums instead",
    "\"Exactly k\" counting means try the at-most subtraction",
    "Decide longest or shortest first — it fixes the shrink and the recording",
    "\"Subarray\" in the statement is necessary but nowhere near sufficient",
    "Revisit a shortest-window problem a day later; that placement fades first",
  ],
  status: "available",
};
