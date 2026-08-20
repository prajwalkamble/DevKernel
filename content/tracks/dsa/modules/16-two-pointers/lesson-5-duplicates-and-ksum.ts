import type { Lesson } from "@/content/types";

export const duplicatesAndKsumLesson: Lesson = {
  id: "dsa-tp-ksum",
  slug: "duplicates-and-k-sum",
  moduleSlug: "two-pointers",
  title: "Duplicates & k-Sum",
  summary:
    "3Sum is Two Sum with an outer loop, and almost all of its difficulty is duplicate handling. The skip-while idiom does it without a set — and then the same construction shows you exactly where k-Sum stops being worth it.",
  estimatedMinutes: 35,
  objectives: [
    "Write 3Sum with two pointers inside a loop",
    "Skip duplicates at all three positions correctly",
    "Explain why the skip beats deduplicating with a set",
    "Derive the O(n^(k-1)) cost of k-Sum and say when to stop",
  ],
  sections: [
    {
      id: "the-construction",
      heading: "Fix one, two-point the rest",
      body: [
        "3Sum: find all distinct triples summing to zero. Sort the array, then for each index `i`, look for a **pair** in the remainder summing to `-nums[i]` — which is the previous lesson's problem exactly.",
        "The outer loop is O(n) and the inner walk is O(n), so 3Sum is **O(n²)** after an O(n log n) sort. That is the expected answer, and the brute force it replaces is O(n³).",
      ],
      examples: [
        {
          id: "three-sum",
          title: "3Sum, with duplicates handled by skipping",
          lang: "python",
          code: `def three_sum(nums):
    """Sort, fix one, two-point the rest. Duplicates skipped without a set."""
    nums = sorted(nums)
    out = []
    n = len(nums)
    for i in range(n - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue                       # same anchor as last time
        if nums[i] > 0:
            break                          # sorted: no way back to zero
        lo, hi = i + 1, n - 1
        while lo < hi:
            s = nums[i] + nums[lo] + nums[hi]
            if s < 0:
                lo += 1
            elif s > 0:
                hi -= 1
            else:
                out.append([nums[i], nums[lo], nums[hi]])
                lo += 1
                hi -= 1
                while lo < hi and nums[lo] == nums[lo - 1]:
                    lo += 1                # skip duplicate seconds
                while lo < hi and nums[hi] == nums[hi + 1]:
                    hi -= 1                # skip duplicate thirds
    return out

for xs in ([-1, 0, 1, 2, -1, -4], [0, 0, 0, 0], [1, 2, 3], [-2, 0, 1, 1, 2]):
    print(f"{str(xs):22} -> {three_sum(xs)}")

# the duplicate-skip is what makes a set unnecessary
def three_sum_with_set(nums):
    nums = sorted(nums)
    seen = set()
    n = len(nums)
    for i in range(n - 2):
        lo, hi = i + 1, n - 1
        while lo < hi:
            s = nums[i] + nums[lo] + nums[hi]
            if s < 0:
                lo += 1
            elif s > 0:
                hi -= 1
            else:
                seen.add((nums[i], nums[lo], nums[hi]))
                lo += 1
                hi -= 1
    return [list(t) for t in sorted(seen)]

xs = [-1, 0, 1, 2, -1, -4]
print("\\nsame answer, set version:", three_sum_with_set(xs))
print("skip version            :", three_sum(xs))`,
          output: `[-1, 0, 1, 2, -1, -4]  -> [[-1, -1, 2], [-1, 0, 1]]
[0, 0, 0, 0]           -> [[0, 0, 0]]
[1, 2, 3]              -> []
[-2, 0, 1, 1, 2]       -> [[-2, 0, 2], [-2, 1, 1]]

same answer, set version: [[-1, -1, 2], [-1, 0, 1]]
skip version            : [[-1, -1, 2], [-1, 0, 1]]`,
          explanation:
            "There are **three** duplicate skips and all three are necessary. The outer `if i > 0 and nums[i] == nums[i-1]: continue` stops the same anchor being used twice. The two inner `while` loops, which run only *after* a triple is recorded, stop the same second and third elements being reused with that anchor.\n\n`[0, 0, 0, 0]` is the test that catches a missing skip: it should give exactly one triple, and a version without the inner skips gives three. It is the case worth running by hand.\n\nThe `if nums[i] > 0: break` is a genuine optimisation, not decoration — once the smallest of the three is positive, no triple from a sorted array can reach zero, and on an input of large positives it turns the whole run into a single iteration.",
        },
      ],
    },
    {
      id: "skip-vs-set",
      heading: "Why skip rather than deduplicate",
      body: [
        "The set version works and is shorter to write, and the comparison above shows they agree. Three reasons the skip is still the answer you want to give.",
        "**Space.** The set holds every triple found, which can be O(n²) of them. The skip version holds nothing.",
        "**Time.** Hashing a tuple costs more than comparing two integers, and the set version does it once per found triple rather than once per distinct one.",
        "**It generalises.** The skip idiom is the same at every level of k-Sum. A set of k-tuples gets slower and heavier as k grows.",
        "There is a fourth, softer reason: the skip demonstrates that you understand *where* duplicates come from, and the set demonstrates that you know they exist. Interviewers can tell the difference.",
      ],
    },
    {
      id: "k-sum",
      heading: "k-Sum, and where to stop",
      body: [
        "The construction recurses. **4Sum** is two nested loops around a two-pointer walk: O(n³). **k-Sum** is `k - 2` nested loops around one walk: **O(n^(k-1))**.",
        "So 3Sum at n = 3000 is nine million operations — fine. 4Sum at n = 200 is eight million — fine. 4Sum at n = 3000 is 2.7 × 10¹⁰, and it is not fine. The constraints tell you which k the intended solution uses.",
        "**Past k = 4, stop.** The better route is meet-in-the-middle: build a hash map of all pair sums, which is O(n²) space and time, then look up complements. That solves 4Sum in O(n²) and is the intended answer whenever n is large enough that O(n³) fails.",
      ],
      pitfalls: [
        {
          title: "Skipping *before* recording rather than after",
          body: "The inner skips must come after appending the triple and after advancing both pointers. Skipping first drops legitimate triples that happen to share a value with a previous one at a different position. `[-2, 0, 1, 1, 2]` — which should give both `[-2, 0, 2]` and `[-2, 1, 1]` — is the case that catches it.",
        },
        {
          title: "`while lo < hi` inside the skips",
          body: "Both inner skip loops must re-test `lo < hi` or they can cross, and the next comparison reads a nonsensical pair. On an all-equal input such as `[0, 0, 0, 0]` this is not hypothetical.",
        },
      ],
    },
  ],
  takeaways: [
    "3Sum = sort, fix one element, two-point the rest — O(n²) after the sort",
    "Three duplicate skips: one on the anchor, two after recording a triple",
    "Skip after appending and advancing, never before",
    "Guard the inner skips with `lo < hi`",
    "`[0, 0, 0, 0]` is the test that catches a missing skip",
    "Skipping beats a set on space, time, and generalisation",
    "k-Sum is O(n^(k-1)); past k=4 use meet-in-the-middle on pair sums",
  ],
  status: "available",
};
