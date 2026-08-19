import type { Problem } from "../types";

export const binarySearchProblems: Problem[] = [
  {
    id: "binary-search",
    slug: "binary-search",
    title: "Binary Search",
    difficulty: "easy",
    topics: ["arrays", "binary-search"],
    patterns: ["brute-force-enumeration", "binary-search-on-index"],
    companies: ["Amazon", "Microsoft", "Google", "TCS", "Infosys", "Accenture"],
    prompt: "Find a target in a sorted array in logarithmic time.",
    statement: [
      "Given a sorted array of distinct integers `nums` and an integer `target`, return the index of `target`, or −1 if it is not present.",
      "You must write an algorithm with O(log n) runtime complexity.",
    ],
    constraints: [
      "1 ≤ nums.length ≤ 10⁴",
      "−10⁴ < nums[i], target < 10⁴",
      "All values in `nums` are distinct and sorted in ascending order",
    ],
    examples: [
      { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4" },
      { input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1", explanation: "2 is not in the array." },
      { input: "nums = [5], target = 5", output: "0", explanation: "The one-element case, where `lo == hi` and the loop must still run once." },
      { input: "nums = [2,5], target = 5", output: "1", explanation: "Two elements: `mid` rounds down to 0, so the answer is only found after `lo` advances." },
    ],
    signals: [
      "**\"O(log n) runtime\"** is written into the problem. There is exactly one technique that produces a log, and this is it.",
      "**\"Sorted\"** is the precondition. Binary search on unsorted data is not slow, it is wrong.",
      "**\"Distinct\"** removes the hardest part of the family — with duplicates you would have to decide whether you want the first or the last occurrence, which changes the loop.",
      "This is the problem to get right *cold*, because it is a subroutine inside a dozen harder ones. Most people can describe binary search and cannot write it without an off-by-one; that gap is the entire point of the exercise.",
    ],
    judge: {
      entry: "search",
      params: [
        { name: "nums", type: "int[]" },
        { name: "target", type: "int" },
      ],
      returns: "int",
      cases: [
        { args: [[-1, 0, 3, 5, 9, 12], 9], expected: 4, visible: true },
        { args: [[-1, 0, 3, 5, 9, 12], 2], expected: -1, visible: true },
        { args: [[5], 5], expected: 0, visible: true },
        { args: [[2, 5], 5], expected: 1, visible: true },
        { args: [[5], -5], expected: -1, note: "One element, and it is not the target." },
        {
          args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 1],
          expected: 0,
          note: "The very first element.",
        },
        {
          args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10],
          expected: 9,
          note: "The very last element.",
        },
      ],
    },
    approaches: [
      {
        id: "brute",
        tier: "brute-force",
        title: "Scan from the front",
        intuition: [
          "Look at each element until you find the target.",
          "It is here as the baseline the constraint explicitly forbids — and as a reminder that the linear scan is genuinely faster for small n, where the branch mispredictions of binary search cost more than the extra comparisons.",
        ],
        time: "O(n)",
        space: "O(1)",
        java: `class Solution {
    public int search(int[] nums, int target) {
        for (int i = 0; i < nums.length; i++) {
            if (nums[i] == target) {
                return i;
            }
        }
        return -1;
    }
}`,
        python: `class Solution:
    def search(self, nums: list[int], target: int) -> int:
        for i, x in enumerate(nums):
            if x == target:
                return i
        return -1`,
        verdict: "Correct, and explicitly ruled out by the stated complexity requirement. It also ignores that the array is sorted.",
      },
      {
        id: "optimal",
        tier: "optimal",
        title: "Halve the interval",
        intuition: [
          "Hold an interval `[lo, hi]` with the promise: *if the target is anywhere, it is in here.* That promise is the invariant, and every line either preserves it or terminates.",
          "Look at the middle. If it is the target, done. If it is too small, everything at or left of `mid` is too small, so the new interval is `[mid + 1, hi]`. If it is too big, `[lo, mid - 1]`.",
          "The `+ 1` and `− 1` are not cosmetic. They are what guarantees the interval strictly shrinks — write `lo = mid` and on a two-element interval `mid` stays put and the loop spins forever.",
          "`while (lo <= hi)`, not `<`. When `lo == hi` the interval still holds one unexamined element, and stopping there misses it. Test with a one-element array; that is what the third example is for.",
          "`lo + (hi - lo) / 2` rather than `(lo + hi) / 2`. The latter overflows a 32-bit int once the indices get large — a bug that sat in the JDK's own binary search for nine years. Python's integers do not overflow, but the habit is worth keeping.",
        ],
        walkthrough: [
          "`lo = 0`, `hi = n - 1`.",
          "While `lo <= hi`: `mid = lo + (hi - lo) / 2`.",
          "`nums[mid] == target` — return `mid`.",
          "`nums[mid] < target` — `lo = mid + 1`. Otherwise `hi = mid - 1`.",
          "Fall out of the loop — return −1.",
        ],
        time: "O(log n)",
        space: "O(1)",
        java: `class Solution {
    public int search(int[] nums, int target) {
        int lo = 0;
        int hi = nums.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) {
                return mid;
            }
            if (nums[mid] < target) {
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        return -1;
    }
}`,
        python: `class Solution:
    def search(self, nums: list[int], target: int) -> int:
        lo, hi = 0, len(nums) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if nums[mid] == target:
                return mid
            if nums[mid] < target:
                lo = mid + 1
            else:
                hi = mid - 1
        return -1`,
        verdict:
          "Optimal, and the version to burn into memory. Learn this exact form — `lo <= hi` paired with `mid ± 1` — and do not mix it with the other convention, `lo < hi` paired with `hi = mid`. Both are correct; hybrids of the two are infinite loops.",
      },
    ],
    followUps: [
      "What if there were duplicates and you wanted the first occurrence? Do not return on a match — record it and keep searching left. That is `bisect_left`, and it is the version most other problems actually need.",
      "What if the array were rotated? Each step, one half is still sorted; work out which, then decide whether the target lies in it. Same skeleton, one extra branch.",
      "What if the array were unbounded — a stream you can index but whose length you do not know? Double an index until you overshoot, then binary search the range you found. That is exponential search, in O(log n) still.",
    ],
    related: ["koko-eating-bananas", "two-sum-ii-sorted"],
  },
  {
    id: "koko-eating-bananas",
    slug: "koko-eating-bananas",
    title: "Koko Eating Bananas",
    difficulty: "medium",
    topics: ["arrays", "binary-search"],
    patterns: ["brute-force-enumeration", "binary-search-on-answer"],
    companies: ["Amazon", "Google", "Meta", "Uber", "Salesforce"],
    prompt: "Find the slowest eating speed that still finishes in time.",
    statement: [
      "Koko has `piles` of bananas and the guards return in `h` hours. Each hour she chooses a pile and eats `k` bananas from it; if the pile has fewer than `k` left, she finishes it and eats no more that hour.",
      "Return the **minimum** integer `k` such that she can eat all the bananas within `h` hours.",
    ],
    constraints: [
      "1 ≤ piles.length ≤ 10⁴",
      "piles.length ≤ h ≤ 10⁹",
      "1 ≤ piles[i] ≤ 10⁹",
    ],
    examples: [
      { input: "piles = [3,6,7,11], h = 8", output: "4", explanation: "At speed 4: 1 + 2 + 2 + 3 = 8 hours. At speed 3 it would take 1 + 2 + 3 + 4 = 10." },
      { input: "piles = [30,11,23,4,20], h = 5", output: "30", explanation: "Five piles and five hours means one pile per hour, so the speed must cover the largest pile." },
      { input: "piles = [30,11,23,4,20], h = 6", output: "23" },
      { input: "piles = [312884470], h = 968709470", output: "1", explanation: "Vastly more hours than bananas, so the slowest legal speed works. This is the case that tells you the lower bound is 1, not something cleverer." },
    ],
    signals: [
      "**\"Return the minimum k such that …\"** is the binary-search-on-the-answer signature. You are not searching the input, you are searching the space of possible answers.",
      "**Checking a candidate is easy.** Given a speed, the hours needed is one pass of ceiling divisions. Easy to verify, hard to find directly — that is exactly when you binary search the answer.",
      "**Feasibility is monotone.** If speed 5 finishes in time, so does 6, and 7, and every speed above. If 5 is too slow, so is 4. One clean true/false boundary, and binary search hunts boundaries.",
      "**`piles[i]` up to 10⁹ and h up to 10⁹** means the hour total can exceed a 32-bit int. In Java that sum must be a `long`. Python will silently be correct here and let you ship a bug to a C++ or Java rewrite.",
      "**The bounds fall out of the statement**: speed 1 is the slowest legal speed, and the largest pile is a speed that certainly works, since h ≥ piles.length guarantees one hour per pile is enough.",
    ],
    judge: {
      entry: "minEatingSpeed",
      params: [
        { name: "piles", type: "int[]" },
        { name: "h", type: "int" },
      ],
      returns: "int",
      cases: [
        { args: [[3, 6, 7, 11], 8], expected: 4, visible: true },
        { args: [[30, 11, 23, 4, 20], 5], expected: 30, visible: true },
        { args: [[30, 11, 23, 4, 20], 6], expected: 23, visible: true },
        { args: [[312884470], 968709470], expected: 1, visible: true },
        { args: [[1], 1], expected: 1, note: "One banana, one hour." },
        {
          args: [[1000000], 2],
          expected: 500000,
          note: "One big pile and two hours: the search space, not the array, is what is large.",
        },
        {
          args: [[4, 4, 4, 4], 4],
          expected: 4,
          note: "Exactly one hour per pile, so the speed is the pile size.",
        },
      ],
    },
    approaches: [
      {
        id: "brute",
        tier: "brute-force",
        title: "Try every speed from 1 upwards",
        intuition: [
          "Speeds are integers from 1 to the largest pile. Try each in turn and return the first that fits in `h` hours.",
          "Writing this is what makes the structure visible: the feasibility check is already a clean helper function, and the results it returns are false, false, …, false, true, true, true. A sorted array of booleans is a thing you binary search.",
        ],
        time: "O(n · max(piles)) — up to 10¹³ operations",
        space: "O(1)",
        java: `class Solution {
    public int minEatingSpeed(int[] piles, int h) {
        int max = 0;
        for (int pile : piles) {
            max = Math.max(max, pile);
        }
        for (int speed = 1; speed <= max; speed++) {
            if (hoursNeeded(piles, speed) <= h) {
                return speed;
            }
        }
        return max;
    }

    private long hoursNeeded(int[] piles, int speed) {
        long hours = 0;
        for (int pile : piles) {
            hours += (pile + speed - 1) / speed;
        }
        return hours;
    }
}`,
        python: `import math


class Solution:
    def min_eating_speed(self, piles: list[int], h: int) -> int:
        for speed in range(1, max(piles) + 1):
            if sum(math.ceil(pile / speed) for pile in piles) <= h:
                return speed
        return max(piles)`,
        verdict:
          "Hopeless at the constraints — a single pile of 10⁹ bananas means up to a billion iterations of a scan. But it contains the whole solution: the check is right, and the search over it is the only thing that needs replacing.",
      },
      {
        id: "optimal",
        tier: "optimal",
        title: "Binary search the speed",
        intuition: [
          "The candidate answers are the integers in `[1, max(piles)]`, and `isFeasible` is false on a prefix of that range and true on the rest. Find the boundary.",
          "Use the `lo < hi` / `hi = mid` convention here, not the `lo <= hi` one. You are not looking for an exact match — you are looking for the *smallest* value that satisfies a predicate, and a feasible `mid` might itself be the answer, so it must stay in the range.",
          "When the loop ends, `lo == hi` and that is the boundary. No final check is needed, because the invariant guaranteed the answer was always inside `[lo, hi]`.",
          "The ceiling division is `(pile + speed - 1) / speed` in integer arithmetic. Writing `Math.ceil(pile / speed)` in Java is a classic bug — the division happens in integers first and the ceiling is applied to an already-truncated result.",
          "Accumulate the hours in a `long`. 10⁴ piles at 10⁹ bananas with speed 1 gives 10¹³ hours, which is about 2300 times what a signed 32-bit int can hold.",
        ],
        walkthrough: [
          "`lo = 1`, `hi = max(piles)`.",
          "While `lo < hi`: `mid = lo + (hi - lo) / 2`.",
          "If `hoursNeeded(mid) <= h`, then `mid` works — `hi = mid`.",
          "Otherwise `mid` is too slow — `lo = mid + 1`.",
          "Return `lo`.",
        ],
        time: "O(n log(max pile)) — about 30 checks of a 10⁴ pass",
        space: "O(1)",
        java: `class Solution {
    public int minEatingSpeed(int[] piles, int h) {
        int lo = 1;
        int hi = 0;
        for (int pile : piles) {
            hi = Math.max(hi, pile);
        }
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (hoursNeeded(piles, mid) <= h) {
                hi = mid;
            } else {
                lo = mid + 1;
            }
        }
        return lo;
    }

    private long hoursNeeded(int[] piles, int speed) {
        long hours = 0;
        for (int pile : piles) {
            hours += (pile + speed - 1) / speed;
        }
        return hours;
    }
}`,
        python: `import math


class Solution:
    def min_eating_speed(self, piles: list[int], h: int) -> int:
        lo, hi = 1, max(piles)
        while lo < hi:
            mid = (lo + hi) // 2
            if sum(math.ceil(pile / mid) for pile in piles) <= h:
                hi = mid
            else:
                lo = mid + 1
        return lo`,
        verdict:
          "Optimal, and the template for a large family: 'minimum capacity to ship packages in D days', 'split an array into k subarrays minimising the largest sum', 'the smallest divisor given a threshold'. All the same shape — only `isFeasible` changes.",
      },
    ],
    followUps: [
      "How do you know the answer is never above `max(piles)`? Because `h ≥ piles.length`, so one pile per hour is always affordable, and a speed equal to the largest pile finishes any pile in one hour.",
      "What if `h` were smaller than the number of piles? Then no speed suffices — she cannot finish two piles in one hour at any speed — and you would return −1. Notice the constraint quietly rules this out.",
      "What if speeds could be fractional? Binary search on doubles, iterating a fixed ~100 times rather than to convergence, since floating point equality does not terminate reliably.",
    ],
    related: ["binary-search"],
  },
];
