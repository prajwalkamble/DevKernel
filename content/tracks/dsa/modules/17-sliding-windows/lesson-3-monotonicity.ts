import type { Lesson } from "@/content/types";

export const monotonicityLesson: Lesson = {
  id: "dsa-sw-monotone",
  slug: "the-monotonicity-condition",
  moduleSlug: "sliding-windows",
  title: "The Condition That Decides Whether It Applies",
  summary:
    "A sliding window is only valid when extending the window can push the condition in one direction and shrinking it can push it back. One negative number destroys that — and the code still runs, still returns a number, and is wrong.",
  estimatedMinutes: 30,
  objectives: [
    "State the monotonicity requirement precisely",
    "Check it before committing to a window",
    "Explain why negative numbers break the sum-based window",
    "Name the replacement technique when the window does not apply",
  ],
  sections: [
    {
      id: "the-requirement",
      heading: "The requirement",
      body: [
        "The shrink step assumes something specific: **once the window is invalid, making it wider cannot fix it — only making it narrower can.**",
        "For \"sum at least 7 with all-positive values\", that holds. Adding an element only increases the sum, so if the window is already too big, growing it further will not help; removing from the left is the only move.",
        "That is the condition. Written as a property: as the window grows, the quantity you are testing must move in one direction only, and as it shrinks, back the other way. If it can move both ways under the same operation, the pointers have no rule to follow.",
      ],
    },
    {
      id: "the-failure",
      heading: "One negative number",
      body: [
        "Introduce a single negative value and the property is gone: extending the window can now *decrease* the sum. So a window that is currently too large might become valid by growing — and the algorithm, which only ever shrinks in that situation, never finds out.",
      ],
      examples: [
        {
          id: "monotone",
          title: "The same code, correct then wrong",
          lang: "python",
          code: `# The monotonicity condition, and where it fails.

def min_len_positive(target, nums):
    left, total, best = 0, 0, None
    for right, v in enumerate(nums):
        total += v
        while total >= target:
            span = right - left + 1
            best = span if best is None else min(best, span)
            total -= nums[left]
            left += 1
    return best or 0

pos = [2, 3, 1, 2, 4, 3]
print("all positive:", pos, " target 7 ->", min_len_positive(7, pos))

# With a negative in the array the shrink rule is unjustified.
neg = [2, -1, 2, 3, -4, 5]
print("\\nwith negatives:", neg, " target 5")
print("  window answer :", min_len_positive(5, neg))

def brute_min_len(target, nums):
    best = None
    for i in range(len(nums)):
        s = 0
        for j in range(i, len(nums)):
            s += nums[j]
            if s >= target:
                span = j - i + 1
                best = span if best is None else min(best, span)
                break
    return best or 0

print("  brute force   :", brute_min_len(5, neg))
print("  they disagree :", min_len_positive(5, neg) != brute_min_len(5, neg))

# why: extending a window no longer only increases the sum
print("\\nprefix sums of", neg)
run = 0
for i, v in enumerate(neg):
    run += v
    print(f"  after index {i}: running sum {run:3}")
print("\\nThe running sum falls at index 1 and index 4. A window's sum is not a")
print("monotone function of its right edge, so 'shrink while valid' is invalid.")`,
          output: `all positive: [2, 3, 1, 2, 4, 3]  target 7 -> 2

with negatives: [2, -1, 2, 3, -4, 5]  target 5
  window answer : 4
  brute force   : 1
  they disagree : True

prefix sums of [2, -1, 2, 3, -4, 5]
  after index 0: running sum   2
  after index 1: running sum   1
  after index 2: running sum   3
  after index 3: running sum   6
  after index 4: running sum   2
  after index 5: running sum   7

The running sum falls at index 1 and index 4. A window's sum is not a
monotone function of its right edge, so 'shrink while valid' is invalid.`,
          explanation:
            "The window says 4; the answer is **1** — the single element `5` at the end. The window never considers it because by the time `right` reaches it, `left` has already been dragged forward past everything, and the algorithm has no mechanism to reconsider a window it discarded.\n\nNote what did *not* happen: no exception, no obviously silly output. `4` is a perfectly plausible length. This is why the condition has to be checked deliberately rather than noticed in testing.",
        },
      ],
    },
    {
      id: "checking",
      heading: "How to check before committing",
      body: [
        "Ask two questions, in this order.",
        "**Does adding an element move the quantity one way only?** For a sum with positive values, yes — up. For a count of distinct characters, yes — up or level, never down. For a sum with any negative values, no.",
        "**Does removing from the left move it back?** For a sum, yes. For \"contains at least one vowel\", no — removing a non-vowel changes nothing, which is fine, but the condition is not a simple threshold and needs care.",
        "If either answer is no, the window does not apply as stated. Sometimes a reformulation rescues it — see the at-most-k lesson — and sometimes it does not.",
      ],
    },
    {
      id: "replacements",
      heading: "What replaces it",
      body: [
        "**Prefix sums with a hash map.** For \"subarray sums to exactly k\" with negatives allowed, store each prefix sum in a map and look for `prefix - k`. O(n), no window, and it does not care about signs. The prefix-sums module is next and is largely about this.",
        "**Kadane's algorithm.** For \"maximum subarray sum\" with negatives, the answer is a one-line DP rather than a window.",
        "**A monotonic deque.** When the state is a window maximum or minimum, the removal is not O(1) and the plain window is not enough.",
        "**Binary search on the answer.** For \"longest window such that…\" where the condition is monotone in the *window length* rather than in its contents.",
      ],
      pitfalls: [
        {
          title: "\"All values are positive\" is a constraint, not a coincidence",
          body: "When a problem statement says `1 <= nums[i]`, that clause is there to make a window legal. Read the constraints looking for it. Its absence, especially an explicit `-10^4 <= nums[i]`, is the setter telling you a window will not work.",
        },
        {
          title: "Zero is usually fine, but check",
          body: "A zero does not break monotonicity for a sum — it just fails to increase it. It does break the *strict* version of some shrink conditions, and it makes \"product of the window\" collapse. For product problems, a zero is a special case that must be handled separately.",
        },
      ],
    },
  ],
  takeaways: [
    "The window needs the tested quantity to move one way on growth and back on shrink",
    "One negative value destroys that for a sum, silently",
    "Check the constraints for `1 <= nums[i]` — it is there on purpose",
    "A wrong window returns a plausible number, not an error",
    "Replacements: prefix sums with a map, Kadane, a monotonic deque, or binary search",
    "Zeros are usually harmless for sums and fatal for products",
  ],
  status: "available",
};
