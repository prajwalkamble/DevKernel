import type { Lesson } from "@/content/types";

export const atMostKLesson: Lesson = {
  id: "dsa-sw-atmostk",
  slug: "at-most-k-and-the-exactly-k-trick",
  moduleSlug: "sliding-windows",
  title: "At Most K, and the Exactly-K Trick",
  summary:
    "\"Exactly k distinct\" is not windowable and \"at most k distinct\" is. The reframing that connects them is one subtraction, and it is the most reusable trick in this module.",
  estimatedMinutes: 30,
  objectives: [
    "Count subarrays with at most k distinct values",
    "Explain why `right - left + 1` counts windows rather than one",
    "Derive exactly-k from at-most-k",
    "Recognise other problems the same subtraction unlocks",
  ],
  sections: [
    {
      id: "why-exactly-fails",
      heading: "Why \"exactly\" resists a window",
      body: [
        "Apply the previous lesson's test to \"count subarrays with exactly 2 distinct values\". Adding an element can take the distinct count from 2 to 3 — invalid — and removing from the left can take it from 2 to 1 — also invalid. **The condition can break in both directions**, so there is no rule for which pointer to move.",
        "\"At most 2\", by contrast, only breaks upwards. Adding can push you over; removing brings you back. That is monotone, and a window handles it.",
      ],
    },
    {
      id: "counting",
      heading: "Counting windows, not finding one",
      body: [
        "There is a second idea here worth isolating, because it appears whenever a problem says *count the subarrays* rather than *find the best one*.",
        "When the window `[left, right]` is valid and `left` is as small as it can be, **every** window ending at `right` and starting anywhere from `left` to `right` is also valid — because shrinking a valid window keeps it valid under an at-most condition. There are `right - left + 1` of them, and adding that to a running total counts every valid subarray exactly once, grouped by its right endpoint.",
      ],
      examples: [
        {
          id: "at-most-k",
          title: "At most k, exactly k, and minimum window substring",
          lang: "python",
          code: `from collections import Counter, defaultdict

def at_most_k_distinct(nums, k):
    """Count subarrays with AT MOST k distinct values. This is windowable."""
    count = defaultdict(int)
    left = 0
    total = 0
    for right, v in enumerate(nums):
        count[v] += 1
        while len(count) > k:
            count[nums[left]] -= 1
            if count[nums[left]] == 0:
                del count[nums[left]]
            left += 1
        # every window ending at \`right\` and starting at >= left is valid
        total += right - left + 1
    return total

def exactly_k_distinct(nums, k):
    """exactly(k) = atMost(k) - atMost(k-1). The subtraction is the trick."""
    return at_most_k_distinct(nums, k) - at_most_k_distinct(nums, k - 1)

xs = [1, 2, 1, 2, 3]
print("array:", xs)
for k in (1, 2, 3):
    print(f"  at most {k}: {at_most_k_distinct(xs, k):2}   exactly {k}: {exactly_k_distinct(xs, k):2}")

def brute_exactly(nums, k):
    n = 0
    for i in range(len(nums)):
        for j in range(i, len(nums)):
            if len(set(nums[i:j + 1])) == k:
                n += 1
    return n

print("\\nchecked against brute force:")
for k in (1, 2, 3):
    print(f"  k={k}: window {exactly_k_distinct(xs, k)}  brute {brute_exactly(xs, k)}"
          f"  {'ok' if exactly_k_distinct(xs, k) == brute_exactly(xs, k) else 'MISMATCH'}")

def min_window(s, t):
    """Smallest substring of s containing every character of t, with multiplicity."""
    if not t or not s:
        return ""
    need = Counter(t)
    missing = len(t)
    left = 0
    best = (float("inf"), 0, 0)
    for right, ch in enumerate(s):
        if need[ch] > 0:
            missing -= 1
        need[ch] -= 1
        while missing == 0:
            if right - left + 1 < best[0]:
                best = (right - left + 1, left, right)
            need[s[left]] += 1
            if need[s[left]] > 0:
                missing += 1
            left += 1
    return "" if best[0] == float("inf") else s[best[1]:best[2] + 1]

for s, t in (("ADOBECODEBANC", "ABC"), ("a", "a"), ("a", "aa"), ("aa", "aa")):
    print(f"min_window({s!r:15}, {t!r:5}) = {min_window(s, t)!r}")`,
          output: `array: [1, 2, 1, 2, 3]
  at most 1:  5   exactly 1:  5
  at most 2: 12   exactly 2:  7
  at most 3: 15   exactly 3:  3

checked against brute force:
  k=1: window 5  brute 5  ok
  k=2: window 7  brute 7  ok
  k=3: window 3  brute 3  ok
min_window('ADOBECODEBANC', 'ABC') = 'BANC'
min_window('a'            , 'a'  ) = 'a'
min_window('a'            , 'aa' ) = ''
min_window('aa'           , 'aa' ) = 'aa'`,
          explanation:
            "`exactly(2) = atMost(2) - atMost(1) = 12 - 5 = 7`, confirmed against brute force. The subtraction works because every subarray with at most 2 distinct values has either exactly 2 or exactly 1, so removing the at-most-1 count leaves precisely the exactly-2 ones.\n\n**Minimum window substring** is a different shape worth studying next to it. The state is a `need` map that goes *negative* for surplus characters, plus a single `missing` counter. `need[ch] > 0` before the decrement means this character was still required, so `missing` drops; after `left` moves, `need[s[left]] > 0` means we have just given up a character we needed. Tracking one integer rather than comparing two maps each step is what keeps it O(n) instead of O(n · alphabet).",
        },
      ],
    },
    {
      id: "the-family",
      heading: "Where else the subtraction works",
      body: [
        "The trick is not about distinct values. It applies whenever \"exactly k\" is not monotone but \"at most k\" is.",
        "**Subarrays with exactly k odd numbers** — count odds instead of distinct values, same subtraction. This is LeetCode's \"Count Number of Nice Subarrays\".",
        "**Subarrays with sum exactly k, all values non-negative** — `atMost(k) - atMost(k - 1)`.",
        "**Binary subarrays with sum exactly k** — the same.",
        "The recognition cue is the word **exactly** in a *counting* problem. Ask whether the at-most version is windowable; if it is, write that function once and call it twice.",
      ],
      pitfalls: [
        {
          title: "`atMost(k - 1)` when k is 0",
          body: "The subtraction calls the helper with `k - 1`, which is `-1` when `k` is zero. The helper must return 0 rather than misbehaving — with the `while len(count) > k` form it does, because the window immediately empties. Check it rather than assume it.",
        },
        {
          title: "Deleting the key at zero, not just decrementing",
          body: "`len(count)` is the distinct count, so a key sitting at zero still inflates it. The `del` is load-bearing. Using a plain integer `distinct` counter that you decrement when a count hits zero is equivalent and slightly faster.",
        },
        {
          title: "Counting `right - left + 1` before the shrink",
          body: "The count must be added *after* the inner while restores validity, or you are counting invalid windows. It is one line in the wrong place and the answer is silently too large.",
        },
      ],
    },
  ],
  takeaways: [
    "\"Exactly k\" breaks in both directions and is not windowable; \"at most k\" is",
    "`exactly(k) = atMost(k) - atMost(k - 1)`",
    "For counting problems, add `right - left + 1` after restoring validity",
    "That counts every valid subarray once, grouped by right endpoint",
    "Delete a frequency key at zero or the distinct count is wrong",
    "Minimum window substring tracks one `missing` integer, not a map comparison",
    "The cue is the word \"exactly\" in a counting problem",
  ],
  status: "available",
};
