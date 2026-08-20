import type { Lesson } from "@/content/types";

export const exchangeArgumentLesson: Lesson = {
  id: "dsa-tp-exchange",
  slug: "proving-a-pointer-move-is-safe",
  moduleSlug: "two-pointers",
  title: "Proving a Pointer Move Is Safe",
  summary:
    "The argument interviewers actually ask for, and the one that separates a memorised solution from an understood one. Container With Most Water is the case where it is genuinely non-obvious.",
  estimatedMinutes: 30,
  objectives: [
    "State the general form of an exchange argument",
    "Prove the container move discards nothing optimal",
    "Recognise when a greedy pointer move is *not* justified",
    "Present the argument compactly under interview conditions",
  ],
  sections: [
    {
      id: "the-form",
      heading: "The general form",
      body: [
        "Every two-pointer proof has the same skeleton, and it is worth memorising as a shape rather than as a sentence about any one problem.",
        "*Suppose the optimal answer uses a pair we are about to discard. Show that some pair we keep is at least as good. Therefore discarding costs nothing.*",
        "That is an **exchange argument** — you exchange the hypothetical optimal solution for one inside your remaining search space, without making it worse. It is the same technique that proves greedy algorithms correct, which is why the greedy module later leans on this one.",
      ],
    },
    {
      id: "container",
      heading: "Container With Most Water: the non-obvious case",
      body: [
        "Given heights, pick two lines; the water held is `width × min(height)`. Maximise it.",
        "Start at the ends, so the width is maximal. Now move **the shorter side inward**. Why is that safe, and why is it right rather than arbitrary?",
        "Consider the shorter line, say the left one at index `lo`. Any pair using `lo` has area `(j - lo) × min(h[lo], h[j])`, which is at most `(hi - lo) × h[lo]` — because the width can only shrink as `j` comes in from `hi`, and the height can never exceed `h[lo]` since `lo` is the shorter of the two. But `(hi - lo) × h[lo]` is exactly the area we just measured. **So every remaining pair involving `lo` is no better than the one we already have.** Discarding all of them costs nothing, and `lo` can move.",
        "Moving the *taller* side would have no such argument, and would be wrong: it shrinks the width while the binding constraint — the short side — stays put.",
      ],
      examples: [
        {
          id: "container",
          title: "Container, rain water, and palindromes",
          lang: "python",
          code: `def max_area(h, trace=False):
    """Container with most water. Move the SHORTER side — that is the exchange
    argument, and it is the whole problem."""
    lo, hi = 0, len(h) - 1
    best = 0
    while lo < hi:
        area = (hi - lo) * min(h[lo], h[hi])
        if trace and area >= best:
            print(f"  lo={lo} hi={hi} width={hi - lo} height={min(h[lo], h[hi])} area={area}")
        best = max(best, area)
        if h[lo] < h[hi]:
            lo += 1
        else:
            hi -= 1
    return best

h = [1, 8, 6, 2, 5, 4, 8, 3, 7]
print("heights:", h)
print("improving states:")
print("max area:", max_area(h, trace=True))

def trap(h):
    """Trapping rain water. Water above i is min(maxLeft, maxRight) - h[i];
    two pointers track both maxima without precomputing either array."""
    if not h:
        return 0
    lo, hi = 0, len(h) - 1
    left_max, right_max = h[lo], h[hi]
    total = 0
    while lo < hi:
        if left_max <= right_max:
            lo += 1
            left_max = max(left_max, h[lo])
            total += left_max - h[lo]
        else:
            hi -= 1
            right_max = max(right_max, h[hi])
            total += right_max - h[hi]
    return total

for xs in ([0,1,0,2,1,0,1,3,2,1,2,1], [4,2,0,3,2,5], [3,3,3], []):
    print(f"trap({str(xs):26}) = {trap(xs)}")

def is_palindrome(s):
    lo, hi = 0, len(s) - 1
    while lo < hi:
        while lo < hi and not s[lo].isalnum():
            lo += 1
        while lo < hi and not s[hi].isalnum():
            hi -= 1
        if s[lo].lower() != s[hi].lower():
            return False
        lo += 1
        hi -= 1
    return True

for s in ("A man, a plan, a canal: Panama", "race a car", " ", "ab_a"):
    print(f'is_palindrome({s!r:34}) = {is_palindrome(s)}')`,
          output: `heights: [1, 8, 6, 2, 5, 4, 8, 3, 7]
improving states:
  lo=0 hi=8 width=8 height=1 area=8
  lo=1 hi=8 width=7 height=7 area=49
max area: 49
trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]) = 6
trap([4, 2, 0, 3, 2, 5]        ) = 9
trap([3, 3, 3]                 ) = 0
trap([]                        ) = 0
is_palindrome('A man, a plan, a canal: Panama'  ) = True
is_palindrome('race a car'                      ) = False
is_palindrome(' '                               ) = True
is_palindrome('ab_a'                            ) = True`,
          explanation:
            "The container's answer is found on the *second* state examined and never improved on — the loop still has to run to be sure, but the widest-first ordering means good candidates appear early.\n\n**Trapping rain water** is the same argument one level deeper. Water above index `i` is `min(maxLeft, maxRight) - h[i]`. The trick is that you do not need both maxima exactly: whichever side's running maximum is *smaller* is the binding one, so you can safely settle that index using only that side's maximum. Advancing from the smaller side keeps that true. It replaces two O(n) precomputed arrays with two variables.\n\n**The palindrome** shows the skip-junk variant: inner `while` loops advance past characters that do not participate, and both are guarded with `lo < hi` so a string of nothing but punctuation cannot run off either end.",
        },
      ],
    },
    {
      id: "when-not",
      heading: "When the argument does not exist",
      body: [
        "Not every problem with two ends admits this. If you cannot construct the exchange argument, the pattern does not apply — and the honest response is to notice that rather than to write the loop anyway and hope.",
        "The classic trap is **unsorted Two Sum**. With `[3, 1, 4, 1, 5]` and target 6, the ends give `3 + 5 = 8`, too big, so you would move `hi` inwards and lose the 5 — which is half of the actual answer `1 + 5`. There is no argument, because `a[hi]` being large tells you nothing about the values behind it.",
        "The second trap is a problem where **both** moves are sometimes right. If the sum being too big could be fixed by moving either pointer, you have a branch rather than a walk, and a branch is exponential. That is the signal to reach for a hash map or a sort.",
      ],
      pitfalls: [
        {
          title: "Ties: move either, but pick one and be consistent",
          body: "In the container problem, `h[lo] == h[hi]` means both moves are safe — the pair itself is already measured, and neither side can do better with the other end held fixed. Moving both at once is also correct here, but it is a different loop; the version above moves `hi`, which is the `else` branch.",
        },
        {
          title: "Rehearse the argument, not just the code",
          body: "\"Move the shorter side\" is a rule you can state in five seconds and defend in thirty. Interviewers ask *why* precisely because the rule is memorable and the reason is not, so the answer separates the two groups. Practise saying it: the shorter side caps every remaining pair it appears in, and the widest of those is the one you just measured.",
        },
      ],
    },
  ],
  takeaways: [
    "Exchange argument: if the optimum used a discarded pair, some kept pair is as good",
    "Container: the shorter side caps every pair it belongs to, and the widest was just measured",
    "Moving the taller side is unjustified — the binding constraint would not move",
    "Rain water: settle from whichever side's running maximum is smaller",
    "No exchange argument means the pattern does not apply",
    "Unsorted Two Sum is the canonical non-example",
    "Be ready to state the proof out loud in two sentences",
  ],
  status: "available",
};
