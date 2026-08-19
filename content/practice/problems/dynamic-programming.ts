import type { Problem } from "../types";

export const dynamicProgrammingProblems: Problem[] = [
  {
    id: "climbing-stairs",
    slug: "climbing-stairs",
    title: "Climbing Stairs",
    difficulty: "easy",
    topics: ["dynamic-programming", "recursion"],
    patterns: ["brute-force-enumeration", "dp-one-dimension"],
    companies: ["Amazon", "Adobe", "Apple", "Microsoft", "Infosys", "TCS"],
    prompt: "Count the ways to climb n stairs taking one or two at a time.",
    statement: [
      "You are climbing a staircase that takes `n` steps to reach the top. Each time you can climb either 1 or 2 steps.",
      "In how many distinct ways can you climb to the top?",
    ],
    constraints: ["1 ≤ n ≤ 45"],
    examples: [
      { input: "n = 2", output: "2", explanation: "1+1, or 2." },
      { input: "n = 3", output: "3", explanation: "1+1+1, 1+2, or 2+1. Order matters — 1+2 and 2+1 are different climbs." },
      { input: "n = 5", output: "8" },
      { input: "n = 35", output: "14930352", explanation: "Large enough that the plain recursion takes seconds. That is the point of the constraint." },
    ],
    signals: [
      "**\"In how many distinct ways\"** is a counting question over a sequence of choices — the standard opening of a DP problem.",
      "**The last step was either a 1 or a 2.** So the ways to reach step n split cleanly into two disjoint groups: the ways to reach n−1 then step once, plus the ways to reach n−2 then step twice. Disjoint and exhaustive means you add them, and you have a recurrence.",
      "**n ≤ 45 is suspiciously small.** 2⁴⁵ is about 3.5 × 10¹³ — deliberately just large enough that the naive recursion is unbearable and just small enough that the answer fits in a 32-bit int. The constraint is telling you the intended solution is linear and that the exponential one is meant to be found first.",
      "This is the smallest problem in which the whole DP progression is visible: exponential recursion, memoise it, invert it, then throw the table away.",
    ],
    judge: {
      entry: "climbStairs",
      params: [
        { name: "n", type: "int" },
      ],
      returns: "int",
      cases: [
        { args: [2], expected: 2, visible: true },
        { args: [3], expected: 3, visible: true },
        { args: [5], expected: 8, visible: true },
        { args: [35], expected: 14930352, visible: true },
        { args: [1], expected: 1, note: "One step, one way." },
        {
          args: [10],
          expected: 89,
          note: "Small enough to check by hand if you doubt the recurrence.",
        },
        {
          args: [20],
          expected: 10946,
          note: "Well past the point where the recursion tree stops fitting in your head.",
        },
      ],
    },
    approaches: [
      {
        id: "brute",
        tier: "brute-force",
        title: "Plain recursion from the recurrence",
        intuition: [
          "Write the recurrence exactly as you reasoned it: `ways(n) = ways(n-1) + ways(n-2)`.",
          "Base cases: one step has one way, two steps have two. It is worth checking these by hand — almost every wrong DP is a correct recurrence with wrong base cases.",
          "This is Fibonacci, arriving from a completely different direction. The recognition is worth having; a lot of DP is noticing you have met the recurrence before.",
        ],
        time: "O(2ⁿ) — the recursion tree branches twice at every level",
        space: "O(n) for the call stack",
        java: `class Solution {
    public int climbStairs(int n) {
        if (n <= 2) {
            return n;
        }
        return climbStairs(n - 1) + climbStairs(n - 2);
    }
}`,
        python: `class Solution:
    def climb_stairs(self, n: int) -> int:
        if n <= 2:
            return n
        return self.climb_stairs(n - 1) + self.climb_stairs(n - 2)`,
        verdict:
          "Correct and exponential. Sketch the tree for n = 5 and the reason jumps out: `climbStairs(3)` is computed twice, `climbStairs(2)` three times. Nothing about the answer for a given n ever changes — it is the same value recomputed, which is precisely the overlapping-subproblems condition.",
      },
      {
        id: "memo",
        tier: "better",
        title: "Memoise — write down each answer once",
        intuition: [
          "The recursion is correct; only the repetition is wrong. So keep a table and consult it before recursing.",
          "Now each value of n is computed once and looked up thereafter. The tree collapses to a path: n distinct subproblems, O(1) work each.",
          "This is the step to make in an interview, and to make in this order. Going straight to a bottom-up table means inventing the fill order from scratch; memoising means keeping a recursion you already believe and adding four lines.",
        ],
        time: "O(n)",
        space: "O(n) for the table plus O(n) for the stack",
        java: `import java.util.HashMap;
import java.util.Map;

class Solution {
    private final Map<Integer, Integer> memo = new HashMap<>();

    public int climbStairs(int n) {
        if (n <= 2) {
            return n;
        }
        Integer cached = memo.get(n);
        if (cached != null) {
            return cached;
        }
        int ways = climbStairs(n - 1) + climbStairs(n - 2);
        memo.put(n, ways);
        return ways;
    }
}`,
        python: `from functools import cache


class Solution:
    def climb_stairs(self, n: int) -> int:
        @cache
        def ways(step: int) -> int:
            if step <= 2:
                return step
            return ways(step - 1) + ways(step - 2)

        return ways(n)`,
        verdict:
          "Linear, and it will pass. Two costs remain: the recursion stack, which overflows at large n in Java, and the table, which holds n entries when the recurrence only ever reads the last two. In Python, `@cache` on a nested function is the clean idiom — putting it on a method instead caches `self` too, which leaks across instances.",
      },
      {
        id: "optimal",
        tier: "optimal",
        title: "Bottom-up with two variables",
        intuition: [
          "Turn the recursion around. Instead of asking for n and recursing down, start at 1 and build upwards — same recurrence, opposite direction, no stack.",
          "Then notice `dp[i]` reads only `dp[i-1]` and `dp[i-2]`. The rest of the table is never touched again, so there is no reason to keep it: two variables suffice.",
          "This 'drop a dimension you never read' move is the standard final step in DP, and it applies far beyond this problem — the same reduction turns a 2D knapsack table into a single row.",
        ],
        walkthrough: [
          "n ≤ 2: return n.",
          "`twoBack = 1`, `oneBack = 2`.",
          "For each step from 3 to n: the new value is `oneBack + twoBack`; shift both along.",
          "Return `oneBack`.",
        ],
        time: "O(n)",
        space: "O(1)",
        java: `class Solution {
    public int climbStairs(int n) {
        if (n <= 2) {
            return n;
        }
        int twoBack = 1;
        int oneBack = 2;
        for (int step = 3; step <= n; step++) {
            int current = oneBack + twoBack;
            twoBack = oneBack;
            oneBack = current;
        }
        return oneBack;
    }
}`,
        python: `class Solution:
    def climb_stairs(self, n: int) -> int:
        if n <= 2:
            return n
        two_back, one_back = 1, 2
        for _ in range(3, n + 1):
            two_back, one_back = one_back, one_back + two_back
        return one_back`,
        verdict:
          "Optimal in space and time, no recursion. The Python tuple assignment computes both right-hand sides before assigning either, which is why it needs no temporary — the Java version needs `current` because its assignments happen one after another.",
      },
    ],
    followUps: [
      "What if you could take 1, 2 or 3 steps? `dp[i] = dp[i-1] + dp[i-2] + dp[i-3]`, and you keep three variables. Any fixed step set works the same way.",
      "What if each step had a cost and you wanted the cheapest climb? Swap the `+` for a `min` and add the cost — Min Cost Climbing Stairs. The state and the shape are identical, which is the point.",
      "What about n = 10⁶? The answer overflows long before that; you would work modulo 10⁹+7. And for truly enormous n, matrix exponentiation gives O(log n).",
    ],
    related: ["maximum-subarray", "best-time-to-buy-and-sell-stock"],
  },
  {
    id: "maximum-subarray",
    slug: "maximum-subarray",
    title: "Maximum Subarray",
    difficulty: "medium",
    topics: ["arrays", "dynamic-programming"],
    patterns: ["brute-force-enumeration", "dp-one-dimension"],
    companies: ["Amazon", "Microsoft", "Meta", "Apple", "Bloomberg", "Goldman Sachs", "PayPal"],
    prompt: "Find the contiguous subarray with the largest sum.",
    statement: [
      "Given an integer array `nums`, find the contiguous subarray containing at least one number which has the largest sum, and return that sum.",
    ],
    constraints: ["1 ≤ nums.length ≤ 10⁵", "−10⁴ ≤ nums[i] ≤ 10⁴"],
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "[4,-1,2,1] sums to 6. Note it includes a negative — dropping the −1 would break contiguity and lose the 2 and 1 that follow." },
      { input: "nums = [1]", output: "1" },
      { input: "nums = [5,4,-1,7,8]", output: "23", explanation: "The whole array." },
      {
        input: "nums = [-3,-1,-2]",
        output: "-1",
        explanation:
          "All negative, so the best subarray is the single least-bad element. This is why `best` cannot start at 0 — 'at least one number' means the empty subarray is not an option.",
      },
    ],
    signals: [
      "**\"Contiguous\"** rules out picking and choosing. If it said subsequence the answer would be trivially the sum of the positives.",
      "**\"At least one number\"** is the constraint that decides your initialisation. Start `best` at 0 and the all-negative case returns 0, which is wrong.",
      "**Negative numbers are allowed**, so no sliding window applies — the condition is not monotone, and extending a window can help or hurt unpredictably.",
      "**n up to 10⁵** rules out the quadratic scan.",
      "The DP reading: ask not 'what is the best subarray?' but 'what is the best subarray **ending at i**?'. Constraining the state to end at a specific index is the move that makes the recurrence appear, and it is the single most transferable idea in this problem.",
    ],
    judge: {
      entry: "maxSubArray",
      params: [
        { name: "nums", type: "int[]" },
      ],
      returns: "int",
      cases: [
        { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6, visible: true },
        { args: [[1]], expected: 1, visible: true },
        { args: [[5, 4, -1, 7, 8]], expected: 23, visible: true },
        { args: [[-3, -1, -2]], expected: -1, visible: true },
        {
          args: [[-1]],
          expected: -1,
          note: "A single negative, where a `best` starting at 0 gives the wrong answer.",
        },
        {
          args: [[8, -19, 5, -4, 20]],
          expected: 21,
          note: "The best run skips a large negative rather than crossing it.",
        },
        { args: [[-2, -1]], expected: -1, note: "Two negatives — take the less bad one." },
      ],
    },
    approaches: [
      {
        id: "brute",
        tier: "brute-force",
        title: "Every subarray, summed as you extend",
        intuition: [
          "There are n(n+1)/2 subarrays. Fix the start, extend the end, and keep a running sum so each extension costs O(1) rather than re-adding the whole range.",
          "That already beats the truly naive O(n³) version, and the improvement is instructive: it comes from reusing the previous sum instead of recomputing it. The linear solution comes from doing the same thing one level up.",
        ],
        time: "O(n²)",
        space: "O(1)",
        java: `class Solution {
    public int maxSubArray(int[] nums) {
        int best = Integer.MIN_VALUE;
        for (int i = 0; i < nums.length; i++) {
            int sum = 0;
            for (int j = i; j < nums.length; j++) {
                sum += nums[j];
                best = Math.max(best, sum);
            }
        }
        return best;
    }
}`,
        python: `class Solution:
    def max_sub_array(self, nums: list[int]) -> int:
        best = float("-inf")
        for i in range(len(nums)):
            total = 0
            for j in range(i, len(nums)):
                total += nums[j]
                best = max(best, total)
        return int(best)`,
        verdict:
          "5 × 10⁹ operations at the limit. Note `best` starting at negative infinity, not 0 — the all-negative case demands it, in this version as much as in the fast one.",
      },
      {
        id: "optimal",
        tier: "optimal",
        title: "Kadane's algorithm",
        intuition: [
          "Define the state precisely: `endingHere` is the largest sum of any subarray that **ends at the current index**. Being able to state that in one sentence is the whole problem; everything else follows.",
          "At each element there are exactly two possibilities. Either you extend the best subarray that ended just before you — worth `endingHere + x` — or you start fresh at `x`. Take the larger.",
          "That is the recurrence: `endingHere = max(x, endingHere + x)`. And notice what it means: you abandon the past exactly when the running total has gone negative, because a negative prefix can only drag down whatever follows it.",
          "`endingHere` is not the answer. It is the best subarray ending *here*; the answer is the best over all positions, so keep a separate `best` and update it each step. Conflating the two is the classic bug in this problem, and it is the same bug as returning the height instead of recording the diameter in tree problems.",
          "Both variables start at `nums[0]` rather than 0, which handles the all-negative case without a special branch.",
        ],
        walkthrough: [
          "`best = endingHere = nums[0]`.",
          "For each later element `x`: `endingHere = max(x, endingHere + x)`.",
          "`best = max(best, endingHere)`.",
          "Return `best`.",
        ],
        time: "O(n) — one pass",
        space: "O(1)",
        java: `class Solution {
    public int maxSubArray(int[] nums) {
        int best = nums[0];
        int endingHere = nums[0];
        for (int i = 1; i < nums.length; i++) {
            endingHere = Math.max(nums[i], endingHere + nums[i]);
            best = Math.max(best, endingHere);
        }
        return best;
    }
}`,
        python: `class Solution:
    def max_sub_array(self, nums: list[int]) -> int:
        best = ending_here = nums[0]
        for x in nums[1:]:
            ending_here = max(x, ending_here + x)
            best = max(best, ending_here)
        return best`,
        verdict:
          "Optimal, and one of the genuinely beautiful algorithms — a two-variable loop that is really a DP with the table thrown away. It is worth being able to present it both ways: as `dp[i] = max(nums[i], dp[i-1] + nums[i])` with the table collapsed, because that framing is what lets you adapt it.",
      },
    ],
    followUps: [
      "What if you had to return the subarray's bounds? Record the start whenever you choose to start fresh, and capture both ends whenever `best` improves.",
      "What if the array were circular? The answer is either a normal Kadane result or the total minus the *minimum* subarray — with a special case for all-negative input, where the second formula wrongly returns the empty subarray.",
      "What about the divide-and-conquer solution in O(n log n)? It exists, it is what the problem's follow-up asks for, and it is strictly worse here — but it is the one that generalises to a segment tree when the array can be updated.",
    ],
    related: ["best-time-to-buy-and-sell-stock", "climbing-stairs", "product-of-array-except-self"],
  },
];
