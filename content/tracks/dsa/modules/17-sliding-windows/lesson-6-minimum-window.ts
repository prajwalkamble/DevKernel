import type { Lesson } from "@/content/types";

export const minimumWindowLesson: Lesson = {
  id: "dsa-sw-minwindow",
  slug: "minimum-window-substring",
  moduleSlug: "sliding-windows",
  title: "Minimum Window Substring",
  summary:
    "The hardest window problem people are routinely asked, worked slowly. Its difficulty is not the loop — it is designing a state that answers \"does the window contain everything?\" without comparing two maps on every step.",
  estimatedMinutes: 35,
  objectives: [
    "State the problem's exact requirement, including multiplicity",
    "Design the need-map plus counter state",
    "Explain why counts are allowed to go negative",
    "Place the answer recording correctly for a shortest-window problem",
    "Handle the no-valid-window case",
  ],
  sections: [
    {
      id: "the-requirement",
      heading: "Read the requirement carefully",
      body: [
        "Find the smallest substring of `s` containing every character of `t` **including duplicates**. If `t` is `\"aab\"`, a window with one `a` does not qualify.",
        "That word *including duplicates* is the whole design constraint. A set of required characters cannot express it; you need counts.",
      ],
    },
    {
      id: "the-state",
      heading: "The state: a map that goes negative, and one integer",
      body: [
        "Start `need` as the character counts of `t`. Every character of `t` is required, so `missing` starts at `len(t)` — counting *characters*, not distinct ones.",
        "**On entering** a character `ch`: if `need[ch] > 0`, this character was genuinely still required, so decrement `missing`. Then decrement `need[ch]` **unconditionally**.",
        "That unconditional decrement is what lets counts go negative, and the negatives are meaningful: `need['A'] == -3` says the window holds three more `A`s than it needs. Surplus characters are exactly what the shrink step will remove for free.",
        "**On leaving**: increment `need[s[left]]` first, then check whether it has become positive. If it has, the character we just dropped was needed, so `missing` goes back up and the window is no longer valid.",
        "The order matters in both directions — test before the decrement, test after the increment — and getting it backwards is the classic bug.",
      ],
    },
    {
      id: "the-loop",
      heading: "The loop, and where the answer is recorded",
      body: [
        "This is a **shortest**-window problem, so the rule from lesson 2 applies: shrink while the window is *still valid*, and record inside that inner loop before removing.",
        "The full trace is in the at-most-k lesson's example, which runs this function on `\"ADOBECODEBANC\"` and finds `\"BANC\"`. Follow it once with the state written out by hand — that is worth more than reading the code twice.",
        "Complexity is O(|s| + |t|). Every index enters and leaves the window at most once, and every update is O(1) because of the `missing` counter. A version that compares `need` against a window map on each step is O(|s| · alphabet) and is the common near-miss.",
      ],
      pitfalls: [
        {
          title: "Testing `need[ch] > 0` after decrementing instead of before",
          body: "Before the decrement, a positive count means the character is still required. After it, the same test means something different, and the `missing` counter drifts. The two lines are one line apart and the bug only shows on inputs where `t` has duplicates.",
        },
        {
          title: "Using a set for `need`",
          body: "It cannot express `t = \"aab\"`, and it will report a window containing a single `a` as valid. Every test with distinct characters in `t` passes.",
        },
        {
          title: "Returning the length rather than the substring, or losing the indices",
          body: "Track `(length, left, right)` together as the best triple. Keeping only the length means you cannot produce the substring at the end, and recomputing it needs another pass.",
        },
        {
          title: "The empty answer",
          body: "When no window ever qualifies, the result is the empty string, not an exception. Initialise the best length to infinity and test for it at the end — `min_window(\"a\", \"aa\")` returning `''` is the case that checks this.",
        },
      ],
    },
    {
      id: "variants",
      heading: "The variants worth recognising",
      body: [
        "**Permutation in String** and **Find All Anagrams in a String** are the *fixed*-size cousins: the window is exactly `len(p)` wide, so there is no shrink loop, only a one-in-one-out step.",
        "**Longest Substring with At Most K Distinct Characters** is the longest-direction version with a simpler state.",
        "**Substring with Concatenation of All Words** is the same idea with words instead of characters, and needs a separate window per starting offset within a word length.",
        "Meeting minimum-window-substring first makes all three read as simplifications, which is the reason it is worth the effort even though it is the hardest.",
      ],
    },
  ],
  takeaways: [
    "The requirement includes duplicates, so the state must be counts, not a set",
    "`missing` counts required *characters*, initialised to `len(t)`",
    "Test `need[ch] > 0` before decrementing, and after incrementing",
    "Negative counts mean surplus, and that is intentional",
    "Shortest window: shrink while valid, record inside the inner loop",
    "Track `(length, left, right)` so the substring survives",
    "No valid window means the empty string — initialise to infinity",
  ],
  status: "available",
};
