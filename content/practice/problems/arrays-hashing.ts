import type { Problem } from "../types";

export const arraysHashingProblems: Problem[] = [
  {
    id: "two-sum",
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "easy",
    topics: ["arrays", "hashing"],
    patterns: ["brute-force-enumeration", "hashing-for-lookup"],
    companies: ["Amazon", "Google", "Microsoft", "Apple", "Adobe", "Bloomberg", "Infosys"],
    prompt: "Find the two positions in an array whose values add up to a given target.",
    statement: [
      "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`.",
      "You may assume that each input has exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
    ],
    constraints: [
      "2 ≤ nums.length ≤ 10⁴",
      "−10⁹ ≤ nums[i] ≤ 10⁹",
      "−10⁹ ≤ target ≤ 10⁹",
      "Exactly one valid answer exists.",
    ],
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "2 + 7 = 9." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "2 + 4 = 6." },
      {
        input: "nums = [3,3], target = 6",
        output: "[0,1]",
        explanation:
          "The two 3s are different elements, so pairing them is allowed — pairing index 0 with itself would not be.",
      },
    ],
    signals: [
      "**Indices, not values.** Anything that reorders the array — sorting, for instance — loses the answer unless you carry the original positions along with it.",
      "**n up to 10⁴** makes n² about 10⁸. That is borderline-to-too-slow, and the fact that the limit is set right there rather than at 10⁵ is a hint that the quadratic answer is meant to be found and then improved on.",
      "**Not sorted.** So the two-pointer trick is unavailable until you sort, and sorting costs you the indices.",
      "**\"Two numbers that add up to target\"** is the canonical complement question: while looking at `x`, the only thing that can complete it is `target - x`. Turning a search into a lookup is what hash maps are for.",
    ],
    judge: {
      entry: "twoSum",
      params: [
        { name: "nums", type: "int[]" },
        { name: "target", type: "int" },
      ],
      returns: "int[]",
      cases: [
        { args: [[2, 7, 11, 15], 9], expected: [0, 1], visible: true },
        { args: [[3, 2, 4], 6], expected: [1, 2], visible: true },
        { args: [[3, 3], 6], expected: [0, 1], visible: true },
        {
          args: [[-3, 4, 3, 90], 0],
          expected: [0, 2],
          note: "Negative numbers, and the pair is not adjacent.",
        },
        {
          args: [[0, 4, 3, 0], 0],
          expected: [0, 3],
          note: "The pair is the two zeros — easy to miss if you skip falsy values.",
        },
        {
          args: [[1, 5, 3, 7, 9, 2], 11],
          expected: [4, 5],
          note: "The answer is the last two elements.",
        },
      ],
    },
    approaches: [
      {
        id: "brute",
        tier: "brute-force",
        title: "Check every pair",
        intuition: [
          "There are finitely many pairs and the answer is one of them, so look at all of them.",
          "The inner loop starts at `i + 1` rather than 0 for two reasons: it stops you pairing an element with itself, and it stops you examining the same pair twice in the two possible orders.",
        ],
        walkthrough: [
          "For each index `i` from 0 to n − 1.",
          "For each index `j` after `i`.",
          "If `nums[i] + nums[j] == target`, return `[i, j]`.",
        ],
        time: "O(n²) — about n²/2 pairs",
        space: "O(1)",
        java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] == target) {
                    return new int[] { i, j };
                }
            }
        }
        return new int[] { -1, -1 };
    }
}`,
        python: `class Solution:
    def two_sum(self, nums: list[int], target: int) -> list[int]:
        n = len(nums)
        for i in range(n):
            for j in range(i + 1, n):
                if nums[i] + nums[j] == target:
                    return [i, j]
        return [-1, -1]`,
        verdict:
          "Correct, and worth ten seconds of your time in an interview — say it, state its cost, then say you can do better. The reason to move on is that the inner loop is not really searching; it is asking one question, 'is `target - nums[i]` in here?', over and over.",
      },
      {
        id: "optimal",
        tier: "optimal",
        title: "One pass with a hash map",
        intuition: [
          "The inner loop only ever asks a membership question, and membership questions are what hash maps answer in constant time.",
          "So carry a map from value to the index it was seen at. At each element, ask whether its complement is already in the map — if it is, the pair is complete.",
          "Notice you never need a second pass. By the time you reach the later member of the answering pair, the earlier one is already recorded.",
          "The order matters: **check, then insert.** Insert first and `[3, 3]` with target 6 matches element 0 against itself and returns `[0, 0]`.",
        ],
        walkthrough: [
          "Create an empty map from value to index.",
          "Walk the array once. At index `i`, compute `need = target - nums[i]`.",
          "If `need` is already a key, the answer is `[map.get(need), i]`.",
          "Otherwise record `nums[i] -> i` and carry on.",
        ],
        time: "O(n) average — one pass, constant-time lookups",
        space: "O(n) for the map",
        java: `import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            Integer j = seen.get(target - nums[i]);
            if (j != null) {
                return new int[] { j, i };
            }
            seen.put(nums[i], i);
        }
        return new int[] { -1, -1 };
    }
}`,
        python: `class Solution:
    def two_sum(self, nums: list[int], target: int) -> list[int]:
        seen: dict[int, int] = {}
        for i, x in enumerate(nums):
            if target - x in seen:
                return [seen[target - x], i]
            seen[x] = i
        return [-1, -1]`,
        verdict:
          "Optimal for this statement. You have to read every element at least once to know it is not part of the answer, so O(n) is the floor — and the extra O(n) memory is the price of not sorting.",
      },
    ],
    followUps: [
      "What if the array were sorted? Then two pointers from both ends solves it in O(1) extra space — see Two Sum II.",
      "What if there could be many answers and you needed all distinct pairs? Sort first, then two pointers, skipping duplicates — that is exactly the inner loop of 3Sum.",
      "What if the array were too large to hold in memory? The map is the problem, not the scan; you would sort externally and two-pointer.",
    ],
    related: ["two-sum-ii-sorted", "three-sum", "contains-duplicate"],
  },
  {
    id: "contains-duplicate",
    slug: "contains-duplicate",
    title: "Contains Duplicate",
    difficulty: "easy",
    topics: ["arrays", "hashing", "sorting"],
    patterns: ["brute-force-enumeration", "sorting-as-preprocessing", "hashing-for-lookup"],
    companies: ["Amazon", "Apple", "Microsoft", "Adobe", "TCS", "Accenture"],
    prompt: "Say whether any value appears more than once.",
    statement: [
      "Given an integer array `nums`, return `true` if any value appears at least twice, and `false` if every element is distinct.",
    ],
    constraints: ["1 ≤ nums.length ≤ 10⁵", "−10⁹ ≤ nums[i] ≤ 10⁹"],
    examples: [
      { input: "nums = [1,2,3,1]", output: "true", explanation: "1 appears at indices 0 and 3." },
      { input: "nums = [1,2,3,4]", output: "false" },
      { input: "nums = [1,1,1,3,3,4,3,2,4,2]", output: "true" },
    ],
    signals: [
      "**n up to 10⁵** rules the quadratic solution out on its own: 10¹⁰ operations is minutes, not milliseconds.",
      "**The values span 2 × 10⁹** but there are only 10⁵ of them, so a counting array indexed by value is out of the question — the range, not the count, would size it.",
      "**Only a yes/no is wanted**, not which value or where. That means you can stop the instant you find one, and it means you never need to store counts — membership is enough.",
      "This is the smallest problem in which the three standard trades are all visible at once: time for nothing (brute force), time for order (sort), time for memory (hash set).",
    ],
    judge: {
      entry: "containsDuplicate",
      params: [
        { name: "nums", type: "int[]" },
      ],
      returns: "boolean",
      cases: [
        { args: [[1, 2, 3, 1]], expected: true, visible: true },
        { args: [[1, 2, 3, 4]], expected: false, visible: true },
        { args: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], expected: true, visible: true },
        { args: [[1]], expected: false, note: "A single element cannot repeat." },
        { args: [[-1, -1]], expected: true, note: "Negatives repeat too." },
        {
          args: [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]],
          expected: false,
          note: "Ten distinct values, so the answer is still false.",
        },
      ],
    },
    approaches: [
      {
        id: "brute",
        tier: "brute-force",
        title: "Compare every pair",
        intuition: [
          "A duplicate is a pair of equal elements, so look at every pair.",
          "This is the version to reach for when n is genuinely tiny, and the version to say out loud first regardless.",
        ],
        time: "O(n²)",
        space: "O(1)",
        java: `class Solution {
    public boolean containsDuplicate(int[] nums) {
        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[i] == nums[j]) {
                    return true;
                }
            }
        }
        return false;
    }
}`,
        python: `class Solution:
    def contains_duplicate(self, nums: list[int]) -> bool:
        n = len(nums)
        for i in range(n):
            for j in range(i + 1, n):
                if nums[i] == nums[j]:
                    return True
        return False`,
        verdict:
          "At n = 10⁵ this is roughly 5 × 10⁹ comparisons. It will time out. Move on.",
      },
      {
        id: "sorted",
        tier: "better",
        title: "Sort, then look at neighbours",
        intuition: [
          "Duplicates are hard to find because they can be anywhere. Sorting fixes that: equal values end up next to each other.",
          "So the global question 'is there a repeat anywhere?' becomes the local one 'is any element equal to the one before it?' — a single pass.",
          "This is the whole idea behind sorting-as-preprocessing, and it is worth naming as such rather than treating it as a trick.",
        ],
        time: "O(n log n)",
        space: "O(1) to O(n), depending on the sort — Java's `Arrays.sort(int[])` is in-place, Python's `sort` needs O(n) in the worst case",
        java: `import java.util.Arrays;

class Solution {
    public boolean containsDuplicate(int[] nums) {
        Arrays.sort(nums);
        for (int i = 1; i < nums.length; i++) {
            if (nums[i] == nums[i - 1]) {
                return true;
            }
        }
        return false;
    }
}`,
        python: `class Solution:
    def contains_duplicate(self, nums: list[int]) -> bool:
        nums.sort()
        for i in range(1, len(nums)):
            if nums[i] == nums[i - 1]:
                return True
        return False`,
        verdict:
          "Fast enough to pass, and the right answer if memory is the binding constraint. Two things to flag out loud: it mutates the caller's array, which is rude and occasionally forbidden, and it does more work than asked — it produces a total ordering when you only wanted a yes or no.",
      },
      {
        id: "optimal",
        tier: "optimal",
        title: "A hash set, and stop early",
        intuition: [
          "You do not need the elements ordered. You need to know whether you have seen this one before — which is a membership question.",
          "Walk once, adding as you go. If an insert reports that the value was already present, you are done.",
          "In Java, `Set.add` returns `false` when the element was already there, so the check and the insert are one operation rather than two lookups.",
        ],
        time: "O(n) average",
        space: "O(n)",
        java: `import java.util.HashSet;
import java.util.Set;

class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> seen = new HashSet<>();
        for (int x : nums) {
            if (!seen.add(x)) {
                return true;
            }
        }
        return false;
    }
}`,
        python: `class Solution:
    def contains_duplicate(self, nums: list[int]) -> bool:
        seen: set[int] = set()
        for x in nums:
            if x in seen:
                return True
            seen.add(x)
        return False`,
        verdict:
          "Optimal in time, and it returns the moment it knows — on an input that is all one value, it stops after two elements. `len(set(nums)) != len(nums)` is the same idea in one line, but it always builds the whole set, so it gives up the early exit.",
      },
    ],
    followUps: [
      "What if you had to report the duplicated value, or its two positions? The set becomes a map from value to index — the same shape as Two Sum.",
      "What if the array were nearly sorted, or the values were bounded by n? Cyclic sort finds the duplicate in O(n) time and O(1) space.",
      "What if the array were a read-only stream too big for memory? Then no exact answer is possible in one pass; a Bloom filter gives you a probabilistic one.",
    ],
    related: ["two-sum", "valid-anagram", "top-k-frequent-elements"],
  },
  {
    id: "valid-anagram",
    slug: "valid-anagram",
    title: "Valid Anagram",
    difficulty: "easy",
    topics: ["strings", "hashing", "sorting"],
    patterns: ["sorting-as-preprocessing", "frequency-counting"],
    companies: ["Amazon", "Google", "Microsoft", "Meta", "Uber", "Zoho"],
    prompt: "Say whether one string is a rearrangement of another.",
    statement: [
      "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s` — that is, if `t` uses exactly the same letters as `s`, each the same number of times, in any order.",
    ],
    constraints: [
      "1 ≤ s.length, t.length ≤ 5 × 10⁴",
      "`s` and `t` consist of lowercase English letters",
    ],
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: "true" },
      { input: 's = "rat", t = "car"', output: "false" },
      {
        input: 's = "a", t = "ab"',
        output: "false",
        explanation: "Different lengths, so no rearrangement can match. This is the cheapest test there is — do it first.",
      },
    ],
    signals: [
      "**Order does not matter** — only which letters and how many. That is the definition of a multiset, and the definition of frequency counting.",
      "**Lowercase English letters** is doing real work in the statement. A 26-element array beats a hash map on both constant factor and memory, and it is the difference between an answer and a good answer.",
      "**Different lengths cannot be anagrams.** One comparison rules out a whole class of inputs before any counting starts.",
      "n up to 5 × 10⁴ means O(n log n) sorting is comfortably fast enough, so this is not a problem where you are *forced* to find the linear answer — which is precisely why finding it anyway is what distinguishes the answer.",
    ],
    judge: {
      entry: "isAnagram",
      params: [
        { name: "s", type: "string" },
        { name: "t", type: "string" },
      ],
      returns: "boolean",
      cases: [
        { args: ["anagram", "nagaram"], expected: true, visible: true },
        { args: ["rat", "car"], expected: false, visible: true },
        { args: ["a", "ab"], expected: false, visible: true },
        {
          args: ["aacc", "ccac"],
          expected: false,
          note: "Same letters, different counts — the case a set comparison gets wrong.",
        },
        { args: ["ab", "ba"], expected: true, note: "The smallest true case." },
        {
          args: ["aabbcc", "abcabc"],
          expected: true,
          note: "Repeats interleaved rather than grouped.",
        },
      ],
    },
    approaches: [
      {
        id: "sort",
        tier: "brute-force",
        title: "Sort both and compare",
        intuition: [
          "Two strings are anagrams exactly when their sorted forms are identical — sorting is a canonical form for a multiset.",
          "It is a two-line answer, which is why it is worth having: you can state it before you have finished reading the constraints.",
        ],
        time: "O(n log n)",
        space: "O(n) for the character arrays",
        java: `import java.util.Arrays;

class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) {
            return false;
        }
        char[] a = s.toCharArray();
        char[] b = t.toCharArray();
        Arrays.sort(a);
        Arrays.sort(b);
        return Arrays.equals(a, b);
    }
}`,
        python: `class Solution:
    def is_anagram(self, s: str, t: str) -> bool:
        return len(s) == len(t) and sorted(s) == sorted(t)`,
        verdict:
          "Correct and it passes. But sorting produces a total ordering when all you needed was a tally, and the constraint about lowercase letters is sitting there unused. Both are signs there is a better answer.",
      },
      {
        id: "count",
        tier: "optimal",
        title: "One array of 26 counts",
        intuition: [
          "You do not need the letters in order — you need to know how many of each there are.",
          "The neat version does not build two tables and compare them. It builds one: add for every character of `s`, subtract for every character of `t`.",
          "Then the question 'are the multisets equal?' becomes 'is every entry back at zero?'. Because the lengths already match, a single non-zero entry proves a mismatch.",
          "Both strings can be walked in the same loop, since they are the same length.",
        ],
        walkthrough: [
          "If the lengths differ, return false immediately.",
          "Make `int[26]`, all zero.",
          "For each position `i`: increment for `s[i]`, decrement for `t[i]`.",
          "If any entry is non-zero, return false. Otherwise return true.",
        ],
        time: "O(n)",
        space: "O(1) — 26 integers, whatever n is",
        java: `class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) {
            return false;
        }
        int[] count = new int[26];
        for (int i = 0; i < s.length(); i++) {
            count[s.charAt(i) - 'a']++;
            count[t.charAt(i) - 'a']--;
        }
        for (int c : count) {
            if (c != 0) {
                return false;
            }
        }
        return true;
    }
}`,
        python: `from collections import Counter


class Solution:
    def is_anagram(self, s: str, t: str) -> bool:
        return len(s) == len(t) and Counter(s) == Counter(t)`,
        verdict:
          "Optimal: linear time and genuinely constant space. Note the two languages part company here — the Java version exploits the fixed alphabet with a raw array, while `Counter` is the idiomatic Python and handles Unicode for free at the cost of a hash map. Say which trade you are making.",
      },
    ],
    followUps: [
      "What if the strings contained Unicode? `c - 'a'` breaks; you need a hash map, and the space becomes O(k) for k distinct characters.",
      "What if you had to group a whole list of words into anagram classes? Use the canonical form — sorted string, or the 26-count tuple — as a hash-map key. That is Group Anagrams.",
      "Could you do it with a product of primes, one per letter? Yes, and it is a lovely idea that overflows a 64-bit integer at about 20 characters. Worth knowing as a cautionary tale.",
    ],
    related: ["contains-duplicate", "top-k-frequent-elements"],
  },
  {
    id: "top-k-frequent-elements",
    slug: "top-k-frequent-elements",
    title: "Top K Frequent Elements",
    difficulty: "medium",
    topics: ["arrays", "hashing", "heaps", "sorting"],
    patterns: ["frequency-counting", "top-k-heap", "sorting-as-preprocessing"],
    companies: ["Amazon", "Meta", "Uber", "Bloomberg", "Salesforce", "Flipkart"],
    prompt: "Return the k values that appear most often.",
    statement: [
      "Given an integer array `nums` and an integer `k`, return the `k` most frequent elements. You may return the answer in any order.",
      "The answer is guaranteed to be unique.",
    ],
    constraints: [
      "1 ≤ nums.length ≤ 10⁵",
      "−10⁴ ≤ nums[i] ≤ 10⁴",
      "k is in the range [1, the number of distinct elements]",
      "Your algorithm's time complexity must be better than O(n log n).",
    ],
    examples: [
      { input: "nums = [1,1,1,2,2,3], k = 2", output: "[1,2]", explanation: "1 appears 3 times, 2 appears twice, 3 once." },
      { input: "nums = [1], k = 1", output: "[1]" },
      { input: "nums = [4,1,-1,2,-1,2,3], k = 2", output: "[-1,2]", explanation: "−1 and 2 each appear twice; everything else appears once." },
    ],
    signals: [
      "**\"Better than O(n log n)\" is written into the constraints.** That is not a hint, it is an instruction: it rules out sorting the distinct values, which is the obvious answer. Read constraints like this one before you start coding, not after your first solution is rejected.",
      "**\"Most frequent\"** means you are counting first, whatever comes next. Frequency counting is step one of every approach here.",
      "**\"The k most\"** is the top-K signature. The two standard answers are a size-k heap and a bucket sort, and which one is right depends on the next signal.",
      "**A count can never exceed n.** That single observation is what unlocks the linear answer: frequencies are bounded by the array's own length, so they can index an array of buckets.",
    ],
    judge: {
      entry: "topKFrequent",
      params: [
        { name: "nums", type: "int[]" },
        { name: "k", type: "int" },
      ],
      returns: "int[]",
      compare: "unordered",
      cases: [
        { args: [[1, 1, 1, 2, 2, 3], 2], expected: [1, 2], visible: true },
        { args: [[1], 1], expected: [1], visible: true },
        { args: [[4, 1, -1, 2, -1, 2, 3], 2], expected: [-1, 2], visible: true },
        {
          args: [[1, 2], 2],
          expected: [1, 2],
          note: "k equals the number of distinct values, so everything qualifies.",
        },
        { args: [[3, 0, 1, 0], 1], expected: [0], note: "Zero is the most frequent value." },
        {
          args: [[1, 1, 2, 2, 3, 3, 4], 3],
          expected: [1, 2, 3],
          note: "Three values tie for the top and the fourth does not.",
        },
        { args: [[-1, -1, -1, -2, -2, -3], 2], expected: [-1, -2], note: "All negative." },
      ],
    },
    approaches: [
      {
        id: "sort",
        tier: "brute-force",
        title: "Count, then sort the distinct values by count",
        intuition: [
          "Count every value, list the distinct ones, sort that list by count descending, take the first k.",
          "The counting is linear; the sort is the expensive part, and it is over the *distinct* values, which may be far fewer than n.",
        ],
        time: "O(n + d log d), where d is the number of distinct values — O(n log n) in the worst case",
        space: "O(d)",
        java: `import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> counts = new HashMap<>();
        for (int x : nums) {
            counts.merge(x, 1, Integer::sum);
        }
        List<Integer> distinct = new ArrayList<>(counts.keySet());
        distinct.sort((a, b) -> counts.get(b) - counts.get(a));

        int[] answer = new int[k];
        for (int i = 0; i < k; i++) {
            answer[i] = distinct.get(i);
        }
        return answer;
    }
}`,
        python: `from collections import Counter


class Solution:
    def top_k_frequent(self, nums: list[int], k: int) -> list[int]:
        counts = Counter(nums)
        ordered = sorted(counts, key=lambda x: counts[x], reverse=True)
        return ordered[:k]`,
        verdict:
          "Correct, and explicitly excluded by the constraint when every element is distinct. It also does far more work than asked: it puts all d values in order when you only wanted the leading k.",
      },
      {
        id: "heap",
        tier: "better",
        title: "A min-heap of size k",
        intuition: [
          "You do not need the values ordered. You need the top k, and the rest can stay in a heap.",
          "Keep a heap capped at k. Push each distinct value; the moment the heap holds k + 1, drop its smallest.",
          "It has to be a **min**-heap even though you want the largest counts — because the element you want to throw away is the weakest of the survivors, and a min-heap is what puts that one at the root. Getting this backwards is the classic mistake in the pattern.",
        ],
        time: "O(n + d log k)",
        space: "O(d + k)",
        java: `import java.util.HashMap;
import java.util.Map;
import java.util.PriorityQueue;

class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> counts = new HashMap<>();
        for (int x : nums) {
            counts.merge(x, 1, Integer::sum);
        }

        PriorityQueue<Integer> heap =
                new PriorityQueue<>((a, b) -> counts.get(a) - counts.get(b));
        for (int value : counts.keySet()) {
            heap.offer(value);
            if (heap.size() > k) {
                heap.poll();
            }
        }

        int[] answer = new int[k];
        for (int i = k - 1; i >= 0; i--) {
            answer[i] = heap.poll();
        }
        return answer;
    }
}`,
        python: `import heapq
from collections import Counter


class Solution:
    def top_k_frequent(self, nums: list[int], k: int) -> list[int]:
        counts = Counter(nums)
        heap: list[tuple[int, int]] = []
        for value, count in counts.items():
            heapq.heappush(heap, (count, value))
            if len(heap) > k:
                heapq.heappop(heap)
        return [value for _, value in sorted(heap, reverse=True)]`,
        verdict:
          "This satisfies the constraint — log k is not log n — and it is the answer to give if the input were a stream, since the heap never holds more than k. But there is still a log in it, and one more observation removes it.",
      },
      {
        id: "buckets",
        tier: "optimal",
        title: "Bucket by count",
        intuition: [
          "Here is the observation that finishes the problem: a count is at most n. Frequencies are not arbitrary numbers — they live in a small, known range.",
          "Anything in a small known range can be an array index. So make `n + 1` buckets, and put each value into the bucket numbered by its count.",
          "Now the values are sorted by frequency without a sort ever having run — the bucket index *is* the order. Walk the buckets from n downwards and take the first k values you meet.",
          "This is counting sort, arriving in disguise. It is worth recognising the disguise, because the same move — 'the key is bounded, so index by it' — solves a whole family of problems.",
        ],
        walkthrough: [
          "Count every value into a map.",
          "Allocate `buckets[0..n]`, each an empty list.",
          "For every (value, count) pair, append `value` to `buckets[count]`.",
          "Walk `count` from n down to 1, emitting values, and stop as soon as you have k.",
        ],
        time: "O(n)",
        space: "O(n)",
        java: `import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> counts = new HashMap<>();
        for (int x : nums) {
            counts.merge(x, 1, Integer::sum);
        }

        // buckets[c] holds every value that appeared exactly c times. No count
        // can exceed nums.length, so this many buckets is always enough.
        List<List<Integer>> buckets = new ArrayList<>();
        for (int i = 0; i <= nums.length; i++) {
            buckets.add(new ArrayList<>());
        }
        for (Map.Entry<Integer, Integer> entry : counts.entrySet()) {
            buckets.get(entry.getValue()).add(entry.getKey());
        }

        int[] answer = new int[k];
        int filled = 0;
        for (int count = nums.length; count >= 1 && filled < k; count--) {
            for (int value : buckets.get(count)) {
                answer[filled++] = value;
                if (filled == k) {
                    break;
                }
            }
        }
        return answer;
    }
}`,
        python: `from collections import Counter


class Solution:
    def top_k_frequent(self, nums: list[int], k: int) -> list[int]:
        counts = Counter(nums)
        buckets: list[list[int]] = [[] for _ in range(len(nums) + 1)]
        for value, count in counts.items():
            buckets[count].append(value)

        answer: list[int] = []
        for count in range(len(nums), 0, -1):
            for value in buckets[count]:
                answer.append(value)
                if len(answer) == k:
                    return answer
        return answer`,
        verdict:
          "Linear time, and the strongest answer to give. The cost is O(n) buckets, most of them empty — a real trade, and one you should name rather than hide. `Counter(nums).most_common(k)` is the one-liner, and it is a heap underneath; know what it is doing before you use it.",
      },
    ],
    followUps: [
      "What if the array were a stream you could not store? The bucket array needs n up front, so the heap wins — it is the streaming answer.",
      "What if k were close to n? Then the heap's log k is no better than log n, and bucketing wins by more.",
      "What if you needed the top k by frequency *and* ties broken by value? Buckets lose the ordering within a bucket; sort each bucket, or go back to the heap with a compound comparator.",
    ],
    related: ["valid-anagram", "contains-duplicate"],
  },
  {
    id: "product-of-array-except-self",
    slug: "product-of-array-except-self",
    title: "Product of Array Except Self",
    difficulty: "medium",
    topics: ["arrays"],
    patterns: ["brute-force-enumeration", "prefix-sum"],
    companies: ["Amazon", "Meta", "Microsoft", "Apple", "Bloomberg", "Walmart"],
    prompt: "For each position, return the product of everything else — without dividing.",
    statement: [
      "Given an integer array `nums`, return an array `answer` where `answer[i]` is the product of all the elements of `nums` except `nums[i]`.",
      "You must write an algorithm that runs in O(n) time and **without using the division operation**. The product of any prefix or suffix is guaranteed to fit in a 32-bit integer.",
    ],
    constraints: [
      "2 ≤ nums.length ≤ 10⁵",
      "−30 ≤ nums[i] ≤ 30",
      "Division is not allowed",
      "Follow-up: O(1) extra space, not counting the output array",
    ],
    examples: [
      { input: "nums = [1,2,3,4]", output: "[24,12,8,6]", explanation: "24 = 2·3·4, 12 = 1·3·4, 8 = 1·2·4, 6 = 1·2·3." },
      {
        input: "nums = [-1,1,0,-3,3]",
        output: "[0,0,9,0,0]",
        explanation:
          "Every position except index 2 has the zero in its product. Index 2 gets (−1)·1·(−3)·3 = 9. This example exists to punish the division solution.",
      },
      { input: "nums = [2,3]", output: "[3,2]" },
    ],
    signals: [
      "**\"Without division\"** is the whole problem. Total product divided by `nums[i]` is O(n) and takes four lines — and it dies on a single zero, and dies differently on two zeros. The ban is there to force the real technique.",
      "**\"Everything except me\"** decomposes: everything before me, times everything after me. Once you see the split, the answer is two passes.",
      "**The follow-up asks for O(1) extra space.** That tells you the two arrays of the natural solution can be collapsed — one of them into the output, the other into a single variable.",
      "This is a prefix/suffix problem wearing a multiplication hat. The same shape solves running sums, running maxima, and 'trapping rain water'.",
    ],
    judge: {
      entry: "productExceptSelf",
      params: [
        { name: "nums", type: "int[]" },
      ],
      returns: "int[]",
      cases: [
        { args: [[1, 2, 3, 4]], expected: [24, 12, 8, 6], visible: true },
        { args: [[-1, 1, 0, -3, 3]], expected: [0, 0, 9, 0, 0], visible: true },
        { args: [[2, 3]], expected: [3, 2], visible: true },
        { args: [[0, 0]], expected: [0, 0], note: "Two zeros, so every product is zero." },
        {
          args: [[1, 0]],
          expected: [0, 1],
          note: "Exactly one zero: only its own position survives.",
        },
        {
          args: [[-1, -2, -3, -4]],
          expected: [-24, -12, -8, -6],
          note: "All negative, so the signs have to work out.",
        },
      ],
    },
    approaches: [
      {
        id: "brute",
        tier: "brute-force",
        title: "Multiply everything else, for each position",
        intuition: [
          "The definition is directly executable: for each `i`, loop over the array and multiply everything with a different index.",
          "It reads exactly like the problem statement, which makes it the right thing to write down first.",
        ],
        time: "O(n²)",
        space: "O(1) beyond the output",
        java: `class Solution {
    public int[] productExceptSelf(int[] nums) {
        int n = nums.length;
        int[] answer = new int[n];
        for (int i = 0; i < n; i++) {
            int product = 1;
            for (int j = 0; j < n; j++) {
                if (j != i) {
                    product *= nums[j];
                }
            }
            answer[i] = product;
        }
        return answer;
    }
}`,
        python: `class Solution:
    def product_except_self(self, nums: list[int]) -> list[int]:
        n = len(nums)
        answer = []
        for i in range(n):
            product = 1
            for j in range(n):
                if j != i:
                    product *= nums[j]
            answer.append(product)
        return answer`,
        verdict:
          "10¹⁰ operations at the top of the constraints. But look at what it repeats: computing `answer[i]` and `answer[i+1]` re-multiplies almost exactly the same numbers. Repeated work between adjacent answers is the signature of a prefix problem.",
      },
      {
        id: "optimal",
        tier: "optimal",
        title: "Prefix pass, then suffix pass, in place",
        intuition: [
          "Split the definition: the product of everything except `i` is (everything to the left of `i`) × (everything to the right of `i`).",
          "Both halves are running products, so each can be built in one pass.",
          "The space trick: do the left pass straight into the output array, so `answer[i]` temporarily holds only the left product. Then walk backwards, carrying the right product in a single variable and multiplying it in.",
          "Watch the ordering inside each loop. You write `answer[i]` *before* folding `nums[i]` into the running product — that is what makes the product exclude position `i` rather than include it.",
          "Nothing here special-cases zero, and that is the point: the zero simply participates in the products it belongs to. The division solution needs to count zeros and branch three ways.",
        ],
        walkthrough: [
          "Left to right: keep `prefix = 1`. Set `answer[i] = prefix`, then `prefix *= nums[i]`.",
          "Right to left: keep `suffix = 1`. Set `answer[i] *= suffix`, then `suffix *= nums[i]`.",
          "Return `answer`.",
        ],
        time: "O(n) — two passes",
        space: "O(1) extra, since the output array does not count",
        java: `class Solution {
    public int[] productExceptSelf(int[] nums) {
        int n = nums.length;
        int[] answer = new int[n];

        int prefix = 1;
        for (int i = 0; i < n; i++) {
            answer[i] = prefix;
            prefix *= nums[i];
        }

        int suffix = 1;
        for (int i = n - 1; i >= 0; i--) {
            answer[i] *= suffix;
            suffix *= nums[i];
        }
        return answer;
    }
}`,
        python: `class Solution:
    def product_except_self(self, nums: list[int]) -> list[int]:
        n = len(nums)
        answer = [1] * n

        prefix = 1
        for i in range(n):
            answer[i] = prefix
            prefix *= nums[i]

        suffix = 1
        for i in range(n - 1, -1, -1):
            answer[i] *= suffix
            suffix *= nums[i]
        return answer`,
        verdict:
          "Optimal, and it meets the follow-up too. The version with two separate `left[]` and `right[]` arrays is easier to explain and worth sketching on the whiteboard first — then collapse it, saying what you are doing and why it is safe.",
      },
    ],
    followUps: [
      "What if division were allowed? Track the total product and the count of zeros: no zeros means total/nums[i]; one zero means only its own position is non-zero; two or more means all zeros. Three branches, and now you see what the ban bought you.",
      "What if the array could be updated between queries? Prefix products go stale on any write — that is a segment tree.",
      "What if the products overflowed? The constraint promises they do not. Without that promise you would work modulo something, and modular division would need a modular inverse, which does not exist when the divisor shares a factor with the modulus.",
    ],
    related: ["maximum-subarray"],
  },
];
