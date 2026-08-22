import type { Lesson } from "@/content/types";

export const prefixSumsAndHashMapsLesson: Lesson = {
  id: "dsa-hash-prefix",
  slug: "prefix-sums-meet-hash-maps",
  moduleSlug: "hashing",
  title: "Prefix Sums Meet Hash Maps",
  summary:
    "The combination that beats the sliding window. When values can be negative the window breaks, and a map of prefix sums seen so far answers the same question in one pass.",
  estimatedMinutes: 35,
  objectives: [
    "Derive the subarray-sum identity from prefix sums",
    "Explain why a sliding window fails on negative numbers",
    "Seed the map with prefix 0 and say what it represents",
    "Adapt the pattern to counts, longest length and divisibility",
  ],
  sections: [
    {
      id: "the-identity",
      heading: "One identity, everything follows",
      body: [
        "Let `P[i]` be the sum of the first `i` elements. Then the sum of the subarray from `j` to `i-1` is `P[i] - P[j]`.",
        "So asking *which subarrays sum to k* is asking: for each `i`, how many earlier `j` satisfy `P[j] = P[i] - k`?",
        "That is the complement pattern from lesson 3, applied to running sums rather than to elements. Keep a map of prefix sums seen so far and how often each occurred; at each step look up `running - k`.",
        "One pass, O(n) time and O(n) space, and — crucially — it does not care about sign.",
      ],
      examples: [
        {
          id: "subarray-sum-k",
          title: "Subarray Sum Equals K",
          lang: "python",
          code: `def subarrays_summing_to(nums, k):
    seen = {0: 1}
    running = 0
    total = 0
    for x in nums:
        running += x
        total += seen.get(running - k, 0)
        seen[running] = seen.get(running, 0) + 1
    return total

print(subarrays_summing_to([1, 1, 1], 2))
print(subarrays_summing_to([1, 2, 3], 3))
print(subarrays_summing_to([3, 4, 7, 2, -3, 1, 4, 2], 7))
print(subarrays_summing_to([1, -1, 0], 0))`,
          output: `2
2
4
3`,
          explanation:
            "The fourth case is the one to sit with: `[1, -1, 0]` with k=0 has three answers — `[1,-1]`, `[0]` and `[1,-1,0]`. A sliding window finds at most one of them. The third case has four: `[3,4]`, `[7]`, `[7,2,-3,1]` and `[1,4,2]` — note that two of them overlap, which is another thing a window cannot express.",
          alternates: [
            {
              lang: "javascript",
              code: `function subarraysSummingTo(nums, k) {
  const seen = new Map([[0, 1]]);
  let running = 0;
  let total = 0;
  for (const x of nums) {
    running += x;
    total += seen.get(running - k) ?? 0;
    seen.set(running, (seen.get(running) ?? 0) + 1);
  }
  return total;
}

console.log(subarraysSummingTo([1, 1, 1], 2));
console.log(subarraysSummingTo([1, 2, 3], 3));
console.log(subarraysSummingTo([3, 4, 7, 2, -3, 1, 4, 2], 7));
console.log(subarraysSummingTo([1, -1, 0], 0));`,
            },
            {
              lang: "typescript",
              code: `function subarraysSummingTo(nums: number[], k: number): number {
  const seen = new Map<number, number>([[0, 1]]);
  let running = 0;
  let total = 0;
  for (const x of nums) {
    running += x;
    total += seen.get(running - k) ?? 0;
    seen.set(running, (seen.get(running) ?? 0) + 1);
  }
  return total;
}

console.log(subarraysSummingTo([1, 1, 1], 2));
console.log(subarraysSummingTo([1, 2, 3], 3));
console.log(subarraysSummingTo([3, 4, 7, 2, -3, 1, 4, 2], 7));
console.log(subarraysSummingTo([1, -1, 0], 0));`,
            },
            {
              lang: "java",
              code: `import java.util.*;

public class Main {
    static int subarraysSummingTo(int[] nums, int k) {
        Map<Integer, Integer> seen = new HashMap<>();
        seen.put(0, 1);
        int running = 0, total = 0;
        for (int x : nums) {
            running += x;
            total += seen.getOrDefault(running - k, 0);
            seen.merge(running, 1, Integer::sum);
        }
        return total;
    }

    public static void main(String[] args) {
        System.out.println(subarraysSummingTo(new int[]{1, 1, 1}, 2));
        System.out.println(subarraysSummingTo(new int[]{1, 2, 3}, 3));
        System.out.println(subarraysSummingTo(new int[]{3, 4, 7, 2, -3, 1, 4, 2}, 7));
        System.out.println(subarraysSummingTo(new int[]{1, -1, 0}, 0));
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int subarraysSummingTo(const vector<int>& nums, int k) {
    unordered_map<int, int> seen{{0, 1}};
    int running = 0, total = 0;
    for (int x : nums) {
        running += x;
        auto it = seen.find(running - k);
        if (it != seen.end()) total += it->second;
        seen[running]++;
    }
    return total;
}

int main() {
    cout << subarraysSummingTo({1, 1, 1}, 2) << "\\n";
    cout << subarraysSummingTo({1, 2, 3}, 3) << "\\n";
    cout << subarraysSummingTo({3, 4, 7, 2, -3, 1, 4, 2}, 7) << "\\n";
    cout << subarraysSummingTo({1, -1, 0}, 0) << "\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::collections::HashMap;

fn subarrays_summing_to(nums: &[i32], k: i32) -> i32 {
    let mut seen: HashMap<i32, i32> = HashMap::new();
    seen.insert(0, 1);
    let (mut running, mut total) = (0, 0);
    for x in nums {
        running += x;
        total += seen.get(&(running - k)).copied().unwrap_or(0);
        *seen.entry(running).or_insert(0) += 1;
    }
    total
}

fn main() {
    println!("{}", subarrays_summing_to(&[1, 1, 1], 2));
    println!("{}", subarrays_summing_to(&[1, 2, 3], 3));
    println!("{}", subarrays_summing_to(&[3, 4, 7, 2, -3, 1, 4, 2], 7));
    println!("{}", subarrays_summing_to(&[1, -1, 0], 0));
}`,
            },
            {
              lang: "go",
              code: `package main

import "fmt"

func subarraysSummingTo(nums []int, k int) int {
	seen := map[int]int{0: 1}
	running, total := 0, 0
	for _, x := range nums {
		running += x
		total += seen[running-k]
		seen[running]++
	}
	return total
}

func main() {
	fmt.Println(subarraysSummingTo([]int{1, 1, 1}, 2))
	fmt.Println(subarraysSummingTo([]int{1, 2, 3}, 3))
	fmt.Println(subarraysSummingTo([]int{3, 4, 7, 2, -3, 1, 4, 2}, 7))
	fmt.Println(subarraysSummingTo([]int{1, -1, 0}, 0))
}`,
            },
          ],
        },
      ],
      visual: {
        id: "prefix-visual",
        kind: "pattern",
        algorithm: "prefix",
        lockAlgorithm: true,
        title: "Prefix sums accumulating, and the difference that answers a range",
      },
    },
    {
      id: "why-not-a-window",
      heading: "Why the window breaks",
      body: [
        "A sliding window works by shrinking from the left when the sum gets too large. That move is only valid if removing an element makes the sum *smaller* — which requires every value to be non-negative.",
        "Introduce a single negative number and the invariant dies. A window sum that is too large might become correct by *growing*, and the window has no way to know that. The algorithm is not slow on negative input; it is wrong.",
        "So the rule is sharp. **Non-negative values, contiguous subarray, target sum** → sliding window, O(1) space. **Values may be negative** → prefix sums plus a hash map, O(n) space.",
        "It is worth checking the constraints for exactly this. Problems often state `1 <= nums[i]` specifically to make the window valid, and the variant that allows negatives is a different problem with a different answer.",
      ],
      pitfalls: [
        {
          title: "Forgetting to seed the map with {0: 1}",
          body: "The entry for prefix sum 0 represents the empty prefix — the subarray that starts at index 0. Without it, any subarray beginning at the start is missed. It is the single most common bug in this pattern, and it passes tests where the answer never starts at index 0.",
        },
        {
          title: "Counting instead of recording an index, or the reverse",
          body: "\"How many subarrays\" needs a map from prefix sum to *count*. \"Longest subarray\" needs a map from prefix sum to its *earliest index*, and you must not overwrite it — the earliest occurrence gives the longest span. Deciding which before you write the loop saves a rewrite.",
        },
        {
          title: "Updating the map before the lookup",
          body: "Same ordering trap as Two Sum. Look up `running - k` first, then record `running`. Reversed, a zero-length subarray matches whenever k is 0.",
        },
        {
          title: "Assuming O(n) space is avoidable",
          body: "It is not, in general. The map can hold n distinct prefix sums. If the interviewer asks for O(1) space, they are telling you the values are non-negative and they want the window.",
        },
      ],
    },
    {
      id: "variants",
      heading: "The variants worth knowing",
      body: [
        "**Longest subarray with sum k.** Map prefix sum → earliest index; keep the best `i - seen[running - k]`. Store only on first sight.",
        "**Subarray sums divisible by k.** Key on `running % k` instead of `running`, because two prefixes with the same remainder bound a subarray divisible by k. Normalise negative remainders — `((r % k) + k) % k` — or the map splits one class into two.",
        "**Longest subarray with equal 0s and 1s.** Map 0 to −1 and 1 to +1; the question becomes a subarray summing to zero. This re-encoding trick appears constantly.",
        "**Contiguous subarray summing to a multiple of k, length at least two.** Same remainder idea, plus an index check on the span.",
        "**Path sum III on a binary tree.** Exactly this pattern along a root-to-node path, with the map updated on the way down and *undone* on the way back up. It is the clearest demonstration that the technique is about prefixes, not about arrays.",
        "The common thread: convert the condition into a statement about two prefix values being equal or differing by a constant, then let the map find the pairs.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does a sliding window fail when values can be negative?",
      answer:
        "The window relies on shrinking from the left to reduce the sum, which requires removing an element to make the sum smaller. With negatives that is false, so a too-large sum might be fixed by growing — the invariant the window depends on no longer holds, and the algorithm is wrong rather than slow.",
    },
    {
      question: "What does the initial {0: 1} entry represent?",
      answer:
        "The empty prefix. It lets a subarray that starts at index 0 be counted, because its prefix sum equals k exactly when `running - k` is 0. Omitting it silently loses every answer anchored at the start.",
    },
    {
      question: "How do you find subarrays whose sum is divisible by k?",
      answer:
        "Key the map on `running % k` rather than `running`: two prefixes sharing a remainder bound a divisible subarray. Normalise negative remainders with `((r % k) + k) % k`, or the same class is stored under two different keys.",
    },
  ],
  takeaways: [
    "Sum from j to i−1 is P[i] − P[j] — every variant follows from this",
    "It is the complement pattern applied to running sums",
    "Seed the map with {0: 1} for the empty prefix",
    "Look up before you record, exactly as in Two Sum",
    "Negative values rule out the window and require the map",
    "Count → map to counts; longest → map to earliest index",
  ],
  status: "available",
};
