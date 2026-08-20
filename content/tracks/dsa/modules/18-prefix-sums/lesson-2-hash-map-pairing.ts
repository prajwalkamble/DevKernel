import type { Lesson } from "@/content/types";

export const hashMapPairingLesson: Lesson = {
  id: "dsa-ps-hashmap",
  slug: "prefix-sums-with-a-hash-map",
  moduleSlug: "prefix-sums-and-range-queries",
  title: "Prefix Sums with a Hash Map",
  summary:
    "The single most valuable idea in this module. It finds subarrays summing to k in one pass with negatives allowed — exactly the case where the sliding window silently returns the wrong answer.",
  estimatedMinutes: 35,
  objectives: [
    "Derive the complement identity from the prefix definition",
    "Count subarrays summing to k in O(n)",
    "Explain why the map starts with `{0: 1}`",
    "Say why this works where a window does not",
    "Adapt it to \"longest\" rather than \"count\"",
  ],
  sections: [
    {
      id: "the-identity",
      heading: "One line of algebra",
      body: [
        "The sum of `a[i:j]` is `prefix[j] - prefix[i]`. Set that equal to k and rearrange:",
        "**`prefix[i] = prefix[j] - k`**",
        "So while walking the array with a running sum, at each position `j` the question \"how many subarrays ending here sum to k?\" becomes \"how many earlier prefixes equalled `running - k`?\" — which a hash map answers in O(1).",
        "That is the entire technique. One running total, one map from prefix value to how many times it has been seen, one lookup per element.",
      ],
      examples: [
        {
          id: "subarray-k",
          title: "Counting subarrays that sum to k",
          lang: "python",
          code: `from collections import defaultdict

def subarray_sum_equals_k(nums, k, trace=False):
    """Count subarrays summing to exactly k. Works with negatives."""
    seen = defaultdict(int)
    seen[0] = 1                      # the empty prefix
    running = 0
    total = 0
    for i, v in enumerate(nums):
        running += v
        found = seen[running - k]
        total += found
        if trace:
            print(f"  i={i} v={v:3} running={running:3}"
                  f"  looking for {running - k:3} -> found {found}"
                  f"  total={total}")
        seen[running] += 1
    return total

nums = [1, 2, 3, -3, 1, 1, 1]
print("array:", nums, " k=3")
print(subarray_sum_equals_k(nums, 3, trace=True))

def brute(nums, k):
    n = 0
    for i in range(len(nums)):
        s = 0
        for j in range(i, len(nums)):
            s += nums[j]
            if s == k:
                n += 1
    return n

print("\\nchecked against brute force:")
for xs, k in (([1,2,3,-3,1,1,1], 3), ([1,1,1], 2), ([-1,-1,1], 0), ([3,4,7,2,-3,1,4,2], 7)):
    a, b = subarray_sum_equals_k(xs, k), brute(xs, k)
    print(f"  {str(xs):26} k={k:2}: prefix {a:2}  brute {b:2}  {'ok' if a == b else 'MISMATCH'}")

print("\\nwhy seen[0] = 1 matters:")
print("  without it, a subarray starting at index 0 is never counted —")
print("  its prefix difference is running - 0, and 0 must already be in the map.")`,
          output: `array: [1, 2, 3, -3, 1, 1, 1]  k=3
  i=0 v=  1 running=  1  looking for  -2 -> found 0  total=0
  i=1 v=  2 running=  3  looking for   0 -> found 1  total=1
  i=2 v=  3 running=  6  looking for   3 -> found 1  total=2
  i=3 v= -3 running=  3  looking for   0 -> found 1  total=3
  i=4 v=  1 running=  4  looking for   1 -> found 1  total=4
  i=5 v=  1 running=  5  looking for   2 -> found 0  total=4
  i=6 v=  1 running=  6  looking for   3 -> found 2  total=6
6

checked against brute force:
  [1, 2, 3, -3, 1, 1, 1]     k= 3: prefix  6  brute  6  ok
  [1, 1, 1]                  k= 2: prefix  2  brute  2  ok
  [-1, -1, 1]                k= 0: prefix  1  brute  1  ok
  [3, 4, 7, 2, -3, 1, 4, 2]  k= 7: prefix  4  brute  4  ok

why seen[0] = 1 matters:
  without it, a subarray starting at index 0 is never counted —
  its prefix difference is running - 0, and 0 must already be in the map.`,
          explanation:
            "Follow `i=1`: the running sum is 3, we look for `3 - 3 = 0`, and find it once — the empty prefix — which correctly counts the subarray `[1, 2]` starting at index 0.\n\nThe input has a negative in it. Compare this against the sliding-window module's demonstration, where a single negative made the window return 4 instead of 1. **Nothing here cares about sign.** The identity `prefix[i] = prefix[j] - k` is algebra, not an argument about monotonicity, so it holds for any values at all.\n\nAt `i=6` the map already holds the prefix value 3 twice — from indices 1 and 3 — so one step counts two subarrays. That is why the map stores *counts* rather than a set of seen values.",
        },
      ],
    },
    {
      id: "the-zero-entry",
      heading: "`seen[0] = 1`",
      body: [
        "This one line is the most commonly forgotten part, and its absence produces an answer that is *nearly* right, which makes it worse.",
        "The empty prefix — the sum of the first zero elements — is 0, and it has been \"seen\" once before the loop starts. Without it, a subarray that begins at index 0 has `running - k == 0`, finds nothing, and goes uncounted.",
        "Test it on `[3]` with `k = 3`: the correct answer is 1, and without the initialisation it is 0. That is the smallest case that catches it, and it is worth running whenever this technique appears.",
      ],
    },
    {
      id: "variants",
      heading: "The variants",
      body: [
        "**Longest subarray summing to k.** Store the *first* index at which each prefix value appeared, and never overwrite — an earlier start gives a longer subarray. Then the answer is `j - first[running - k]`.",
        "**Shortest subarray summing to k.** Store the *most recent* index and always overwrite.",
        "**Subarray sum divisible by k.** Key the map on `running % k` instead of `running`, because two prefixes with the same remainder differ by a multiple of k. Remember to normalise a negative remainder — `((r % k) + k) % k` — in every language except Python.",
        "**Contiguous array with equal 0s and 1s.** Map every 0 to −1, then look for a subarray summing to 0. A reframing rather than a new technique.",
        "**Binary subarrays with sum k**, and **count of nice subarrays** — both are this, though both also yield to the at-most-k window trick.",
      ],
      pitfalls: [
        {
          title: "Recording the current prefix before doing the lookup",
          body: "The `seen[running] += 1` must come *after* the lookup, or an element equal to k counts itself twice through a zero-length subarray. In the loop above the order is: update running, look up, then record.",
        },
        {
          title: "Using a set instead of a count map",
          body: "For \"does such a subarray exist\" a set is enough. For \"how many\", the same prefix value can occur many times and each occurrence is a separate subarray — the trace above counts two at once. A set gives an undercount that only appears on inputs with repeated prefix values.",
        },
        {
          title: "Storing every index in a list \"just in case\"",
          body: "For the counting variant you need only the count; for longest, only the earliest index. Keeping lists of indices turns O(n) space into O(n) space with a much larger constant and tempts an O(n²) scan at query time.",
        },
      ],
    },
  ],
  takeaways: [
    "`prefix[i] = prefix[j] - k` is the whole technique",
    "Walk once with a running sum and a map from prefix value to count",
    "Initialise `seen[0] = 1` for the empty prefix, or subarrays from index 0 are lost",
    "Sign does not matter — this is algebra, not a monotonicity argument",
    "Look up *before* recording the current prefix",
    "Longest wants the earliest index; shortest wants the latest",
    "Divisible-by-k keys on the remainder, normalised to be non-negative",
  ],
  status: "available",
};
