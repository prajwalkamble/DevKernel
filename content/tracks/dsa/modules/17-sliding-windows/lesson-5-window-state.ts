import type { Lesson } from "@/content/types";

export const windowStateLesson: Lesson = {
  id: "dsa-sw-state",
  slug: "choosing-the-window-state",
  moduleSlug: "sliding-windows",
  title: "Choosing the Window State",
  summary:
    "The loop is always the same. What changes between problems is what you carry, and whether removing an element from it is cheap — which is the question that decides whether a plain window is enough.",
  estimatedMinutes: 25,
  objectives: [
    "Pick the smallest state that answers the question",
    "Say whether both the add and the remove are O(1)",
    "Use a fixed-size array instead of a hash map when the alphabet is small",
    "Recognise the states that need a heavier structure",
  ],
  sections: [
    {
      id: "the-question",
      heading: "The question to ask of any state",
      body: [
        "**Can I update it in O(1) when one element enters, and in O(1) when one leaves?** Entering is nearly always easy. Leaving is where the pattern succeeds or fails.",
        "A **sum** removes by subtraction. A **frequency map** removes by decrementing a key. A **distinct count** removes when a key hits zero. All fine.",
        "A **maximum** does not. Removing the current maximum tells you nothing about the next one, so you would rescan the window — O(k) per step, which puts you back at O(n·k). That needs a monotonic deque.",
        "A **median** does not either. It needs two heaps, or an order-statistic structure.",
      ],
    },
    {
      id: "small-alphabet",
      heading: "When the alphabet is small, use an array",
      body: [
        "For lowercase English letters, `int[26]` beats a `HashMap<Character, Integer>` — no hashing, no boxing, contiguous memory, and comparing two windows is a 26-element loop rather than a map equality check. On a hot inner loop this is a several-fold difference, and interviewers notice.",
        "The pattern is `count[ch - 'a']++`. Keep a separate `distinct` integer if you need the count of nonzero entries, since an array has no `size()`.",
        "Reach for a hash map when the alphabet is genuinely large or unknown — arbitrary integers, Unicode, or strings as keys.",
      ],
    },
    {
      id: "anagram",
      heading: "The comparison trick for anagram windows",
      body: [
        "\"Find all anagrams of `p` in `s`\" is a fixed-size window over `s` where the state is a letter count, and the test is whether it equals `p`'s letter count.",
        "Comparing two 26-element arrays each step is O(26) — technically constant, and fine. But there is a neater way: keep a single integer `matches` counting how many of the 26 letters currently have the right count. Update it when a letter enters and when one leaves, and the window is an anagram exactly when `matches == 26`. That is O(1) per step and it is the same idea as `missing` in minimum-window-substring.",
        "Both are acceptable answers. Knowing the second one is what turns \"correct\" into \"optimal\", and the reasoning transfers to every problem where you are testing one map against another.",
      ],
      pitfalls: [
        {
          title: "Keeping a `set` for distinct values instead of a count map",
          body: "A set cannot tell you *when* to remove: the leaving character may still appear elsewhere in the window. You need multiplicities, so a count map with deletion at zero is the right structure and a set is a bug waiting for a repeated character.",
        },
        {
          title: "Rebuilding the state instead of updating it",
          body: "`Counter(s[left:right+1])` inside the loop is O(k) and turns the whole algorithm quadratic. It is the most common accidental way to lose the pattern's advantage, and it looks perfectly idiomatic.",
        },
      ],
    },
  ],
  takeaways: [
    "The deciding question is whether *removal* is O(1)",
    "Sums, frequency maps and distinct counts are fine; maxima and medians are not",
    "A window maximum needs a monotonic deque; a median needs two heaps",
    "For a small fixed alphabet use `int[26]`, not a hash map",
    "Track a single `matches` or `missing` integer instead of comparing maps",
    "Never rebuild the state from a slice inside the loop",
  ],
  status: "available",
};
