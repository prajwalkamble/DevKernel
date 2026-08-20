import type { Lesson } from "@/content/types";

export const windowOrPrefixLesson: Lesson = {
  id: "dsa-ps-vs-window",
  slug: "window-or-prefix",
  moduleSlug: "prefix-sums-and-range-queries",
  title: "Window or Prefix? The Problems That Look Alike",
  summary:
    "Both patterns answer questions about contiguous stretches, and half of the mistakes in either come from picking the wrong one. Two questions separate them reliably.",
  estimatedMinutes: 25,
  objectives: [
    "Apply the two-question test to choose between the patterns",
    "Explain why negatives rule out a window and not a prefix map",
    "Explain why \"longest\" often favours a window and \"count exactly\" favours a prefix map",
    "Work the near-identical problem pairs",
  ],
  sections: [
    {
      id: "two-questions",
      heading: "Two questions",
      body: [
        "**1. Are the values all non-negative?** If any can be negative, a sum-based window is invalid — extending the window no longer only increases the sum, and the shrink rule has no justification. A prefix map does not care, because it is algebra rather than a monotonicity argument.",
        "**2. Is the target an exact value, or a threshold?** \"Sums to exactly k\" pairs naturally with a hash map: you are looking up one specific complement. \"Sum at least k\" or \"at most k\" pairs with a window: you are moving a boundary until a condition flips.",
        "Those two questions resolve nearly every case.",
      ],
    },
    {
      id: "the-pairs",
      heading: "The near-identical pairs",
      body: [
        "**Minimum Size Subarray Sum** (sum ≥ target, positive values) — **window**. Threshold plus non-negative.",
        "**Subarray Sum Equals K** (sum = k, negatives allowed) — **prefix map**. Exact plus negatives; the window gives wrong answers here and the sliding-window module demonstrates it failing.",
        "**Longest Substring Without Repeating Characters** — **window**. The state is a frequency map, not a sum, and the condition is monotone.",
        "**Contiguous Array** (equal 0s and 1s) — **prefix map**, after mapping 0 to −1. It looks like a window problem and the negatives rule it out.",
        "**Subarrays with K Different Integers** (count, exactly k) — **window**, via the at-most-k subtraction. The exception to question 2: \"exactly\" here is about *distinct count*, not a sum, and at-most is monotone.",
        "**Binary Subarrays With Sum** (count, exact, values 0 and 1) — **either**. Non-negative and exact, so both the at-most subtraction and the prefix map work. Pick whichever you write faster.",
      ],
    },
    {
      id: "the-third-option",
      heading: "The third option people forget",
      body: [
        "Sometimes neither is right and the answer is a **one-line dynamic program**.",
        "**Maximum Subarray Sum** with negatives is Kadane's: `best_ending_here = max(x, best_ending_here + x)`. A window fails on the negatives and a prefix map answers the wrong question — it finds sums equal to a target, not the largest sum. The prefix framing does work if you phrase it as \"maximum of `prefix[j] - min(prefix[i] for i < j)`\", which is Kadane's in different clothes and a genuinely useful way to see it.",
        "**Maximum Product Subarray** needs a two-variable DP, because a large negative times another negative becomes a large positive — so you must track the minimum as well as the maximum.",
      ],
      pitfalls: [
        {
          title: "Assuming \"subarray\" means window",
          body: "Every technique in these two modules works on subarrays. The word narrows nothing. Ask the two questions instead.",
        },
        {
          title: "Not checking the constraints for the sign",
          body: "`0 <= nums[i]` or `1 <= nums[i]` in the constraints is the setter telling you a window is intended. An explicit negative lower bound is the setter telling you it is not. This is thirty seconds of reading that decides the whole approach.",
        },
      ],
    },
  ],
  takeaways: [
    "Question 1: any negatives? Then not a sum-based window",
    "Question 2: exact value or threshold? Exact suggests a prefix map, threshold a window",
    "\"Exactly k distinct\" is the exception — that is a window, via at-most subtraction",
    "Contiguous Array is a prefix-map problem disguised as a window one",
    "Kadane's is the third option, and is prefix sums seen from another angle",
    "Read the constraints for the sign before choosing",
  ],
  status: "available",
};
