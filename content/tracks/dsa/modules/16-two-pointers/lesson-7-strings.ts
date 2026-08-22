import type { Lesson } from "@/content/types";

export const stringsLesson: Lesson = {
  id: "dsa-tp-strings",
  slug: "two-pointers-on-strings",
  moduleSlug: "two-pointers",
  title: "Two Pointers on Strings",
  summary:
    "Palindromes, subsequence checks and the expand-from-centre technique — where the pointers start in the middle and walk outwards, which is a shape the array problems never need.",
  estimatedMinutes: 30,
  objectives: [
    "Check palindromes while skipping characters that do not participate",
    "Check whether one string is a subsequence of another in O(n)",
    "Expand from a centre to find the longest palindromic substring",
    "Count the 2n - 1 centres and say why odd and even both matter",
  ],
  sections: [
    {
      id: "inward",
      heading: "Walking inward: palindromes",
      body: [
        "The palindrome check is the opposite-ends walk with two refinements: characters that do not participate get skipped, and the comparison is case-insensitive. The version in lesson 2 does both.",
        "The detail worth repeating is that **both inner skip loops need their own `lo < hi` guard**. A string of nothing but punctuation would otherwise run one pointer off the end while the other is still hunting.",
        "The variant \"valid palindrome after deleting at most one character\" is the same walk with a single branch: on the first mismatch, check whether skipping the left character *or* skipping the right one leaves a palindrome. Two ordinary checks, so still O(n) — the branch does not recurse.",
      ],
    },
    {
      id: "subsequence",
      heading: "Two strings, two pointers",
      body: [
        "**Is `s` a subsequence of `t`?** One pointer per string. Advance the `t` pointer always; advance the `s` pointer only on a match. If the `s` pointer reaches the end, every character was found in order. O(|s| + |t|), one pass, no extra memory.",
        "The greedy step needs the same justification as everything else in this module: matching a character of `s` at the *earliest* possible position in `t` is never worse, because it leaves the longest possible remainder of `t` for the rest of `s`. That is an exchange argument, and it is why you never need to backtrack.",
        "The follow-up — \"now answer this for a billion different `s` against one fixed `t`\" — breaks the pattern deliberately. The answer is to preprocess `t` into, for each position and each letter, the next occurrence of that letter; then each query is O(|s|) lookups with no scan of `t` at all.",
      ],
    },
    {
      id: "outward",
      heading: "Walking outward: expand from centre",
      body: [
        "Longest palindromic substring. For each possible **centre**, push two pointers outwards while the characters match, and record the longest run.",
        "There are `2n - 1` centres, not `n`: every character is the centre of an odd-length palindrome, and every *gap between* adjacent characters is the centre of an even-length one. Forgetting the even centres means `\"abba\"` reports a best of 1, and it is the classic bug here.",
        "Each expansion is O(n) in the worst case and there are O(n) centres, so this is **O(n²) time with O(1) space**. That is the expected interview answer. Manacher's algorithm does it in O(n), is rarely asked for, and is in the advanced-algorithms elective.",
      ],
      pitfalls: [
        {
          title: "Only checking odd-length centres",
          body: "Loop over `2n - 1` centres, or call the expansion twice per index — once with `(i, i)` and once with `(i, i + 1)`. The second call handles even lengths and immediately does nothing when the two characters differ, so it costs almost nothing.",
        },
        {
          title: "Confusing subsequence with substring",
          body: "A **substring** is contiguous; a **subsequence** is not. Two pointers solves the subsequence check in linear time; the substring version is a different problem entirely and usually wants a sliding window or a string-matching algorithm.",
        },
      ],
    },
  ],
  takeaways: [
    "Palindrome checks walk inward, skipping non-participating characters",
    "Guard every inner skip loop with `lo < hi`",
    "\"Delete at most one\" is one branch into two ordinary checks — still O(n)",
    "Subsequence: advance `t` always, advance `s` on a match; greedy is provably safe",
    "Expand-from-centre has `2n - 1` centres, odd and even",
    "Expand-from-centre is O(n²) time and O(1) space, and is the expected answer",
    "Substring is contiguous; subsequence is not",
  ],
  status: "available",
};
