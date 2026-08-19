import type { Problem } from "../types";

export const twoPointerProblems: Problem[] = [
  {
    id: "two-sum-ii-sorted",
    slug: "two-sum-ii-sorted",
    title: "Two Sum II — Input Array Is Sorted",
    difficulty: "medium",
    topics: ["arrays", "binary-search"],
    patterns: ["brute-force-enumeration", "binary-search-on-index", "two-pointers-opposite"],
    companies: ["Amazon", "Microsoft", "Adobe", "Bloomberg", "Infosys"],
    prompt: "Two Sum again — but the array is sorted, and you may not allocate.",
    statement: [
      "Given a **1-indexed** array of integers `numbers` that is already sorted in non-decreasing order, find two numbers that add up to `target`.",
      "Return their indices as `[index1, index2]`, where `1 ≤ index1 < index2 ≤ numbers.length`. There is exactly one solution, you may not use the same element twice, and your solution must use only constant extra space.",
    ],
    constraints: [
      "2 ≤ numbers.length ≤ 3 × 10⁴",
      "−1000 ≤ numbers[i] ≤ 1000",
      "`numbers` is sorted in non-decreasing order",
      "Exactly one solution exists",
      "Constant extra space is required",
    ],
    examples: [
      { input: "numbers = [2,7,11,15], target = 9", output: "[1,2]", explanation: "2 + 7 = 9. The answer is 1-indexed." },
      { input: "numbers = [2,3,4], target = 6", output: "[1,3]" },
      { input: "numbers = [-1,0], target = -1", output: "[1,2]" },
    ],
    signals: [
      "**\"Sorted\"** is the entire difference from Two Sum, and it is stated in the title in case you miss it. Sorted input means comparisons carry information about everything you have not looked at.",
      "**\"Constant extra space\"** explicitly bans the hash map that solved the unsorted version. When a constraint outlaws the technique you already know, it is naming the technique you are meant to use instead.",
      "**1-indexed** is a gift-wrapped off-by-one. Read it twice, and add the `+ 1`s where the answer is built rather than sprinkling them through the loop.",
      "Sorted plus a target-sum plus constant space is the two-pointers-from-both-ends signature almost verbatim.",
    ],
    judge: {
      entry: "twoSum",
      params: [
        { name: "numbers", type: "int[]" },
        { name: "target", type: "int" },
      ],
      returns: "int[]",
      cases: [
        { args: [[2, 7, 11, 15], 9], expected: [1, 2], visible: true },
        { args: [[2, 3, 4], 6], expected: [1, 3], visible: true },
        { args: [[-1, 0], -1], expected: [1, 2], visible: true },
        {
          args: [[1, 2, 3, 4, 4, 9, 56, 90], 8],
          expected: [4, 5],
          note: "The pair is two equal values sitting next to each other.",
        },
        {
          args: [[-10, -8, -2, 1, 3, 5], -12],
          expected: [1, 3],
          note: "All-negative pair, and the answer is in the middle.",
        },
        {
          args: [[0, 0, 3, 4], 0],
          expected: [1, 2],
          note: "Two zeros — remember the answer is 1-indexed.",
        },
      ],
    },
    approaches: [
      {
        id: "brute",
        tier: "brute-force",
        title: "Every pair, ignoring the ordering",
        intuition: [
          "The same double loop as Two Sum, adjusted for 1-indexing.",
          "Worth writing down mainly so you can see what it wastes: at each `i` it scans forward through values it *knows* are increasing, and keeps scanning after they have already overshot the target.",
        ],
        time: "O(n²)",
        space: "O(1)",
        java: `class Solution {
    public int[] twoSum(int[] numbers, int target) {
        for (int i = 0; i < numbers.length; i++) {
            for (int j = i + 1; j < numbers.length; j++) {
                if (numbers[i] + numbers[j] == target) {
                    return new int[] { i + 1, j + 1 };
                }
            }
        }
        return new int[] { -1, -1 };
    }
}`,
        python: `class Solution:
    def two_sum(self, numbers: list[int], target: int) -> list[int]:
        n = len(numbers)
        for i in range(n):
            for j in range(i + 1, n):
                if numbers[i] + numbers[j] == target:
                    return [i + 1, j + 1]
        return [-1, -1]`,
        verdict:
          "Correct and space-legal, but it uses none of what it was told. Any time a solution ignores a stated property of the input, there is a better one.",
      },
      {
        id: "binary",
        tier: "better",
        title: "Binary search for each complement",
        intuition: [
          "The array is sorted, so 'is `target - numbers[i]` present?' is a binary search rather than a scan.",
          "Search only the suffix after `i`, which both avoids pairing an element with itself and halves the average work.",
          "This is the direct application of sortedness — and it is a genuinely good answer, worth saying before the better one.",
        ],
        time: "O(n log n)",
        space: "O(1)",
        java: `class Solution {
    public int[] twoSum(int[] numbers, int target) {
        for (int i = 0; i < numbers.length; i++) {
            int need = target - numbers[i];
            int lo = i + 1;
            int hi = numbers.length - 1;
            while (lo <= hi) {
                int mid = lo + (hi - lo) / 2;
                if (numbers[mid] == need) {
                    return new int[] { i + 1, mid + 1 };
                }
                if (numbers[mid] < need) {
                    lo = mid + 1;
                } else {
                    hi = mid - 1;
                }
            }
        }
        return new int[] { -1, -1 };
    }
}`,
        python: `class Solution:
    def two_sum(self, numbers: list[int], target: int) -> list[int]:
        for i, x in enumerate(numbers):
            need = target - x
            lo, hi = i + 1, len(numbers) - 1
            while lo <= hi:
                mid = (lo + hi) // 2
                if numbers[mid] == need:
                    return [i + 1, mid + 1]
                if numbers[mid] < need:
                    lo = mid + 1
                else:
                    hi = mid - 1
        return [-1, -1]`,
        verdict:
          "A real improvement, and it will pass. But it restarts a fresh search for every `i`, throwing away everything the previous search learned. That is the hint that one coordinated pass can do it.",
      },
      {
        id: "optimal",
        tier: "optimal",
        title: "Two pointers, walking inwards",
        intuition: [
          "Put one pointer at the smallest value and one at the largest, and look at their sum.",
          "If the sum is too small, the only way to increase it is to raise the low pointer — because the high one is already at the largest value available, so no pair using the current low value and any *smaller* high value can reach the target. That whole row of pairs is dead, and you eliminate it in one move.",
          "If the sum is too big, the mirror argument eliminates a column.",
          "So each step discards a whole row or column of the n² pairs, and the two pointers meet after at most n steps.",
          "This is the argument to say out loud. 'Two pointers, move the smaller one' is a memorised template; 'moving `lo` is safe because every pair I am discarding was already too small' is understanding, and it is what lets you adapt the pattern to a problem you have not seen.",
        ],
        walkthrough: [
          "`lo = 0`, `hi = n - 1`.",
          "While `lo < hi`: compute the sum.",
          "Equal to target — return `[lo + 1, hi + 1]`.",
          "Less than target — `lo++`.",
          "Greater than target — `hi--`.",
        ],
        time: "O(n) — the pointers move n steps between them",
        space: "O(1)",
        java: `class Solution {
    public int[] twoSum(int[] numbers, int target) {
        int lo = 0;
        int hi = numbers.length - 1;
        while (lo < hi) {
            int sum = numbers[lo] + numbers[hi];
            if (sum == target) {
                return new int[] { lo + 1, hi + 1 };
            }
            if (sum < target) {
                lo++;
            } else {
                hi--;
            }
        }
        return new int[] { -1, -1 };
    }
}`,
        python: `class Solution:
    def two_sum(self, numbers: list[int], target: int) -> list[int]:
        lo, hi = 0, len(numbers) - 1
        while lo < hi:
            total = numbers[lo] + numbers[hi]
            if total == target:
                return [lo + 1, hi + 1]
            if total < target:
                lo += 1
            else:
                hi -= 1
        return [-1, -1]`,
        verdict:
          "Optimal on both axes: linear time and constant space, meeting every constraint including the one that ruled out the hash map. Note `lo < hi` rather than `lo <= hi` — the strict inequality is what forbids pairing an element with itself.",
      },
    ],
    followUps: [
      "What if the array were not sorted? Sort it first — but then the indices you must return are the pre-sort ones, so you would sort (value, index) pairs, or go back to the hash map.",
      "What if you needed every pair rather than one? Keep going after a hit, advancing both pointers and skipping duplicates. That is 3Sum's inner loop exactly.",
      "What if it were three numbers? Fix the first, two-pointer the rest. Four? Fix two. Each extra number costs one more nested loop.",
    ],
    related: ["two-sum", "three-sum", "container-with-most-water"],
  },
  {
    id: "container-with-most-water",
    slug: "container-with-most-water",
    title: "Container With Most Water",
    difficulty: "medium",
    topics: ["arrays"],
    patterns: ["brute-force-enumeration", "two-pointers-opposite", "greedy-exchange"],
    companies: ["Amazon", "Google", "Meta", "Bloomberg", "Adobe", "Goldman Sachs"],
    prompt: "Pick two vertical lines that, with the x-axis, hold the most water.",
    statement: [
      "You are given an integer array `height` of length n. There are n vertical lines, where the i-th line runs from `(i, 0)` to `(i, height[i])`.",
      "Find two lines that together with the x-axis form a container holding the most water, and return that maximum amount. You may not slant the container.",
    ],
    constraints: ["n == height.length", "2 ≤ n ≤ 10⁵", "0 ≤ height[i] ≤ 10⁴"],
    examples: [
      {
        input: "height = [1,8,6,2,5,4,8,3,7]",
        output: "49",
        explanation: "The lines at indices 1 and 8, of heights 8 and 7: width 7, limited by the shorter line at 7, so 7 × 7 = 49.",
      },
      { input: "height = [1,1]", output: "1", explanation: "Width 1, height 1." },
      { input: "height = [2,3,4,5,18,17,6]", output: "17", explanation: "Indices 4 and 5: width 1, height 17." },
    ],
    signals: [
      "**n up to 10⁵** kills the quadratic solution — 10¹⁰ pair evaluations. Whatever the answer is, it looks at each index a constant number of times.",
      "**The area is `width × min(left, right)`.** Two quantities, moving in opposite directions: pull the lines apart and width grows but the shorter line can only get shorter or stay. That tension is what makes a greedy sweep possible.",
      "**The shorter line is the binding constraint**, always. The taller one is not limiting anything, which is what makes it safe to keep and the short one safe to abandon.",
      "This is not a sorting problem, and it is not a hashing problem — the answer depends on positions, so anything that reorders the array destroys it.",
    ],
    judge: {
      entry: "maxArea",
      params: [
        { name: "height", type: "int[]" },
      ],
      returns: "int",
      cases: [
        { args: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected: 49, visible: true },
        { args: [[1, 1]], expected: 1, visible: true },
        { args: [[2, 3, 4, 5, 18, 17, 6]], expected: 17, visible: true },
        { args: [[1, 2, 1]], expected: 2, note: "The widest pair beats the tallest." },
        {
          args: [[4, 3, 2, 1, 4]],
          expected: 16,
          note: "Equal ends, so the answer uses the full width.",
        },
        {
          args: [[1, 2, 4, 3]],
          expected: 4,
          note: "The best pair is neither the widest nor the tallest.",
        },
      ],
    },
    approaches: [
      {
        id: "brute",
        tier: "brute-force",
        title: "Try every pair of lines",
        intuition: [
          "The answer is one of the n(n−1)/2 pairs. Compute the area of each and keep the largest.",
          "Getting this on the board matters more than it looks: it forces you to write `(j - i) * min(height[i], height[j])`, and having the area formula in front of you is what makes the greedy argument visible.",
        ],
        time: "O(n²)",
        space: "O(1)",
        java: `class Solution {
    public int maxArea(int[] height) {
        int best = 0;
        for (int i = 0; i < height.length; i++) {
            for (int j = i + 1; j < height.length; j++) {
                int area = (j - i) * Math.min(height[i], height[j]);
                best = Math.max(best, area);
            }
        }
        return best;
    }
}`,
        python: `class Solution:
    def max_area(self, height: list[int]) -> int:
        best = 0
        n = len(height)
        for i in range(n):
            for j in range(i + 1, n):
                best = max(best, (j - i) * min(height[i], height[j]))
        return best`,
        verdict: "Too slow by four orders of magnitude at the top of the constraints — but it is where the formula comes from.",
      },
      {
        id: "optimal",
        tier: "optimal",
        title: "Two pointers, discarding the shorter line",
        intuition: [
          "Start with the widest possible container: the first line and the last. No pair will ever be wider than this one.",
          "Now the key argument. The container is limited by its shorter line. Consider every other pair that still uses that shorter line: each is *narrower*, and none can be *taller* than the shorter line, since that line caps them all. So every one of them has area ≤ the one you just measured.",
          "That means the shorter line is finished. It cannot appear in a better answer than the one already recorded, so move past it — and in one step you have eliminated an entire row of pairs.",
          "Repeat until the pointers meet. Every pair that could beat the current best is still between them, which is the invariant that makes this correct rather than merely plausible.",
          "This is a genuine exchange argument, and being able to give it is the difference between a passing answer and a strong one. Interviewers ask 'why is it safe to move the shorter one?' precisely because the template alone does not tell you.",
        ],
        walkthrough: [
          "`lo = 0`, `hi = n - 1`, `best = 0`.",
          "While `lo < hi`: record `(hi - lo) * min(height[lo], height[hi])`.",
          "Move whichever pointer sits on the shorter line inwards.",
          "When they meet, `best` is the answer.",
        ],
        time: "O(n)",
        space: "O(1)",
        java: `class Solution {
    public int maxArea(int[] height) {
        int lo = 0;
        int hi = height.length - 1;
        int best = 0;
        while (lo < hi) {
            best = Math.max(best, (hi - lo) * Math.min(height[lo], height[hi]));
            if (height[lo] < height[hi]) {
                lo++;
            } else {
                hi--;
            }
        }
        return best;
    }
}`,
        python: `class Solution:
    def max_area(self, height: list[int]) -> int:
        lo, hi = 0, len(height) - 1
        best = 0
        while lo < hi:
            best = max(best, (hi - lo) * min(height[lo], height[hi]))
            if height[lo] < height[hi]:
                lo += 1
            else:
                hi -= 1
        return best`,
        verdict:
          "Optimal. When the two lines are equal in height either pointer may move — both are limited by the same value, so both are finished, and moving either one is safe.",
      },
    ],
    followUps: [
      "What if the container could be slanted? The area is no longer `width × min`, the exchange argument collapses, and this becomes a computational-geometry problem.",
      "What if you needed the indices rather than the area? Record them alongside `best`; the algorithm does not change.",
      "How does this differ from Trapping Rain Water, which looks identical? There you sum water over *every* index and the limit is `min(maxLeft, maxRight)` — running maxima rather than the current pair. Same two-pointer skeleton, different invariant. Confusing the two is the standard mistake.",
    ],
    related: ["two-sum-ii-sorted", "three-sum"],
  },
  {
    id: "three-sum",
    slug: "three-sum",
    title: "3Sum",
    difficulty: "medium",
    topics: ["arrays", "sorting"],
    patterns: ["brute-force-enumeration", "sorting-as-preprocessing", "two-pointers-opposite"],
    companies: ["Amazon", "Meta", "Google", "Microsoft", "Adobe", "Uber", "Flipkart"],
    prompt: "Find every distinct triple that sums to zero.",
    statement: [
      "Given an integer array `nums`, return all the triples `[nums[i], nums[j], nums[k]]` such that `i`, `j` and `k` are distinct and `nums[i] + nums[j] + nums[k] == 0`.",
      "The solution set must not contain duplicate triples. The triples and the set may be returned in any order.",
    ],
    constraints: ["3 ≤ nums.length ≤ 3000", "−10⁵ ≤ nums[i] ≤ 10⁵"],
    examples: [
      {
        input: "nums = [-1,0,1,2,-1,-4]",
        output: "[[-1,-1,2],[-1,0,1]]",
        explanation:
          "There are two distinct triples. Note that (−1, 0, 1) can be formed using either of the two −1s — that is one triple, not two, which is where the duplicate handling comes in.",
      },
      { input: "nums = [0,1,1]", output: "[]", explanation: "No triple sums to zero." },
      { input: "nums = [0,0,0]", output: "[[0,0,0]]", explanation: "Three distinct indices, all holding 0." },
    ],
    signals: [
      "**n ≤ 3000** is chosen with care. n³ is 2.7 × 10¹⁰ — far too slow. n² is 9 × 10⁶ — comfortable. The constraint is telling you the intended solution is quadratic, and reading that off the constraints before writing anything is the single most useful habit in this whole track.",
      "**\"No duplicate triples\"** is where most attempts fail, and it is a harder requirement than the sum itself. Note it asks about duplicate *triples*, not duplicate indices — the same values appearing at different positions still count once.",
      "**It asks for values, not indices.** That is permission to sort, and sorting is what makes both the two-pointer sweep and the duplicate handling possible.",
      "**Sum to zero** means once you fix one element, you are looking for a pair summing to its negation — Two Sum II, on the remaining suffix. A problem you already know is hiding inside this one.",
    ],
    judge: {
      entry: "threeSum",
      params: [
        { name: "nums", type: "int[]" },
      ],
      returns: "List<List<int>>",
      compare: "unordered-nested",
      cases: [
        { args: [[-1, 0, 1, 2, -1, -4]], expected: [[-1, -1, 2], [-1, 0, 1]], visible: true },
        { args: [[0, 1, 1]], expected: [], visible: true },
        { args: [[0, 0, 0]], expected: [[0, 0, 0]], visible: true },
        {
          args: [[-2, 0, 1, 1, 2]],
          expected: [[-2, 0, 2], [-2, 1, 1]],
          note: "Two triples, one of which uses a repeated value.",
        },
        {
          args: [[0, 0, 0, 0]],
          expected: [[0, 0, 0]],
          note: "Four zeros must still produce exactly one triple.",
        },
        {
          args: [[-4, -2, -2, -2, 0, 1, 2, 2, 2, 3, 3, 4, 4, 6, 6]],
          expected: [[-4, -2, 6], [-4, 0, 4], [-4, 1, 3], [-4, 2, 2], [-2, -2, 4], [-2, 0, 2]],
          note: "Heavy duplication on both sides of zero.",
        },
      ],
    },
    approaches: [
      {
        id: "brute",
        tier: "brute-force",
        title: "Every triple, de-duplicated with a set",
        intuition: [
          "Three nested loops generate every triple exactly once.",
          "The duplicate problem shows up immediately: `[-1, 0, 1]` and `[0, 1, -1]` are the same triple in different orders. Sorting each triple before storing it gives a canonical form, and a set does the rest.",
          "That fix works and is expensive — but it makes the requirement concrete, which is what you want before optimising.",
        ],
        time: "O(n³)",
        space: "O(number of triples found)",
        java: `import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Set<List<Integer>> found = new LinkedHashSet<>();
        int n = nums.length;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                for (int k = j + 1; k < n; k++) {
                    if (nums[i] + nums[j] + nums[k] == 0) {
                        int[] triple = { nums[i], nums[j], nums[k] };
                        Arrays.sort(triple);
                        found.add(List.of(triple[0], triple[1], triple[2]));
                    }
                }
            }
        }
        return new ArrayList<>(found);
    }
}`,
        python: `class Solution:
    def three_sum(self, nums: list[int]) -> list[list[int]]:
        found: set[tuple[int, int, int]] = set()
        n = len(nums)
        for i in range(n):
            for j in range(i + 1, n):
                for k in range(j + 1, n):
                    if nums[i] + nums[j] + nums[k] == 0:
                        a, b, c = sorted((nums[i], nums[j], nums[k]))
                        found.add((a, b, c))
        return [list(t) for t in found]`,
        verdict:
          "Correct, and roughly 4 × 10⁹ iterations at n = 3000. Sorting each triple to canonicalise it is the tell: if sorting three numbers helps, sorting all n of them will help more.",
      },
      {
        id: "optimal",
        tier: "optimal",
        title: "Sort, fix one, then two pointers",
        intuition: [
          "Sort the array once. That buys three separate things, and it is worth naming all three because each solves a different part of the problem.",
          "**One:** with the array in order, fixing `nums[i]` reduces the rest to 'find a pair in this sorted suffix summing to `-nums[i]`' — which is Two Sum II, solved by two pointers in linear time. n fixed elements × O(n) each = O(n²).",
          "**Two:** equal values are now adjacent, so skipping duplicates is a comparison with the neighbour rather than a set membership test. Skip a repeated `nums[i]` before starting its sweep, and skip repeated `nums[lo]` after recording a hit.",
          "**Three:** once `nums[i] > 0`, every remaining element is positive too, so no triple from here on can sum to zero. Break — not `continue`.",
          "The duplicate skipping has a subtlety worth stating: `i > 0 && nums[i] == nums[i-1]` skips a repeated *first* element, but you must not skip the pair `(i, i+1)` when both hold the same value, because a triple like `[-1,-1,2]` legitimately uses two of them. Comparing backwards rather than forwards is what gets that right.",
        ],
        walkthrough: [
          "Sort `nums`.",
          "For each `i` from 0 to n − 3: if `nums[i] > 0`, break. If `i > 0` and `nums[i] == nums[i-1]`, continue.",
          "Set `lo = i + 1`, `hi = n - 1`, and sweep for a sum of zero.",
          "On a hit, record the triple, advance `lo`, then keep advancing it past any value equal to the one just used.",
        ],
        time: "O(n²) — O(n log n) to sort, then n sweeps of O(n)",
        space: "O(1) beyond the output, ignoring the sort's own space",
        java: `import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> out = new ArrayList<>();
        for (int i = 0; i < nums.length - 2; i++) {
            if (nums[i] > 0) {
                break;
            }
            if (i > 0 && nums[i] == nums[i - 1]) {
                continue;
            }
            int lo = i + 1;
            int hi = nums.length - 1;
            while (lo < hi) {
                int sum = nums[i] + nums[lo] + nums[hi];
                if (sum < 0) {
                    lo++;
                } else if (sum > 0) {
                    hi--;
                } else {
                    out.add(List.of(nums[i], nums[lo], nums[hi]));
                    lo++;
                    while (lo < hi && nums[lo] == nums[lo - 1]) {
                        lo++;
                    }
                }
            }
        }
        return out;
    }
}`,
        python: `class Solution:
    def three_sum(self, nums: list[int]) -> list[list[int]]:
        nums.sort()
        out: list[list[int]] = []
        for i in range(len(nums) - 2):
            if nums[i] > 0:
                break
            if i > 0 and nums[i] == nums[i - 1]:
                continue
            lo, hi = i + 1, len(nums) - 1
            while lo < hi:
                total = nums[i] + nums[lo] + nums[hi]
                if total < 0:
                    lo += 1
                elif total > 0:
                    hi -= 1
                else:
                    out.append([nums[i], nums[lo], nums[hi]])
                    lo += 1
                    while lo < hi and nums[lo] == nums[lo - 1]:
                        lo += 1
        return out`,
        verdict:
          "Optimal for this problem — O(n²) is conjectured to be the best possible, since 3Sum is one of the standard hardness assumptions in fine-grained complexity. The output is naturally de-duplicated, so no set is needed at all.",
      },
    ],
    followUps: [
      "4Sum? Two nested fixed elements and the same two-pointer sweep inside: O(n³). The general k-Sum is O(n^(k−1)), fixing k − 2 elements.",
      "3Sum Closest, where you want the triple nearest to a target? Same skeleton, but you never return early — track the best difference and sweep all the way.",
      "Why is the `nums[i] > 0` break correct? Because the array is sorted, so everything from `i` onwards is ≥ 0, and three non-negative numbers can only sum to zero if all three are zero — a case already found earlier in the sweep.",
    ],
    related: ["two-sum-ii-sorted", "two-sum", "container-with-most-water"],
  },
];
