import type { Lesson } from "@/content/types";

export const twoPointerSheetLesson: Lesson = {
  id: "dsa-tp-sheet",
  slug: "the-two-pointer-sheet",
  moduleSlug: "two-pointers",
  title: "The Sheet: Which Pointer Shape",
  summary:
    "Four shapes, the signal that identifies each, and the order to work them in. Plus the question to ask before writing any of them: what does moving a pointer throw away, and why is that safe?",
  estimatedMinutes: 25,
  objectives: [
    "Classify a problem into one of the four pointer shapes",
    "Name the signal for each",
    "State the safety argument before writing the loop",
    "Know when two pointers is the wrong tool",
  ],
  sections: [
    {
      id: "four-shapes",
      heading: "The four shapes",
      body: [
        "**1. Opposite ends, converging.** Signal: a **sorted** array and a question about a *pair* — a sum, a difference, a product. Also the container and rain-water family, where the two ends define a region.",
        "**2. Same direction, read/write.** Signal: \"in place\", \"return the new length\", \"O(1) extra space\", or any filtering, compaction or partitioning.",
        "**3. Same direction, fixed lag or different speeds.** Signal: linked lists, \"nth from the end\", \"the middle\", \"is there a cycle\".",
        "**4. Two sequences, one pointer each.** Signal: merging two sorted inputs, subsequence checks, or comparing two strings.",
      ],
    },
    {
      id: "the-sheet",
      heading: "The sheet, in order",
      body: [
        "**Shape 1.** *Two Sum II — Input Array Is Sorted* (167) for the base loop. *Valid Palindrome* (125) for the skip-junk variant. *3Sum* (15) — the important one; do not move on until the duplicate skips are automatic. *Container With Most Water* (11) for the exchange argument. *Trapping Rain Water* (42), which is the hardest in this shape and worth a full sitting. *4Sum* (18) only if 3Sum is solid.",
        "**Shape 2.** *Remove Duplicates from Sorted Array* (26). *Move Zeroes* (283). *Sort Colors* (75) for the three-way partition. *Remove Element* (27).",
        "**Shape 3.** *Middle of the Linked List* (876). *Linked List Cycle* (141), then *Linked List Cycle II* (142) for the entrance. *Remove Nth Node From End of List* (19). These sit better after the linked-lists module, so treat them as a revisit.",
        "**Shape 4.** *Merge Sorted Array* (88) — note it merges *backwards*, which is the trick. *Is Subsequence* (392). *Backspace String Compare* (844), which is shape 1 and 4 at once and is a good final check.",
      ],
    },
    {
      id: "before-coding",
      heading: "The question to ask first",
      body: [
        "Before writing the loop, answer this: **when I move a pointer, what set of candidates am I discarding, and why is none of them the answer?**",
        "If you can answer it in a sentence, write the loop. If you cannot, one of three things is true: the input needs sorting first, the problem needs a hash map instead, or it is a sliding window and you should be maintaining a summary of the region between the pointers rather than just walking them.",
        "That question is also, almost word for word, what a good interviewer will ask you after you finish. Answering it unprompted is worth more than finishing thirty seconds sooner.",
      ],
      pitfalls: [
        {
          title: "Reaching for two pointers on unsorted input",
          body: "The single most common misapplication. Without order there is no argument that the discarded candidates were unusable, and the code returns a confident wrong answer on inputs the samples do not cover.",
        },
        {
          title: "Writing a window and calling it two pointers",
          body: "If you are maintaining a running sum, count or frequency map of what lies between the pointers, that is a sliding window. The next module gives it a structure — grow, then shrink while a condition holds — that is easier to get right than improvising.",
        },
      ],
    },
  ],
  takeaways: [
    "Four shapes: converging, read/write, lag or speed, and one pointer per sequence",
    "Sorted plus a pair question means shape 1; \"in place\" means shape 2",
    "Do 3Sum until the three duplicate skips are automatic",
    "Merge Sorted Array merges backwards — that is the whole trick",
    "Before the loop: what am I discarding, and why is none of it the answer?",
    "No answer means sort first, use a hash map, or write a window instead",
  ],
  status: "available",
};
