import type { Lesson } from "@/content/types";

export const invertibleAggregatesLesson: Lesson = {
  id: "dsa-ps-invertible",
  slug: "which-aggregates-prefix",
  moduleSlug: "prefix-sums-and-range-queries",
  title: "Which Aggregates Prefix, and Which Do Not",
  summary:
    "Prefix sums work because subtraction undoes addition. State the requirement that way and it becomes obvious which other aggregates work — XOR does, minimum does not, and knowing why saves you writing the wrong one.",
  estimatedMinutes: 25,
  objectives: [
    "State the invertibility requirement",
    "Use prefix XOR for range-XOR queries",
    "Explain why prefix minimum and maximum do not work",
    "Name the structure that answers non-invertible range queries",
  ],
  sections: [
    {
      id: "the-requirement",
      heading: "The requirement is an inverse",
      body: [
        "`sum(a[lo:hi]) = prefix[hi] - prefix[lo]` works because subtraction **undoes** addition: the elements before `lo` were added into both prefixes, and subtracting removes them exactly.",
        "So the technique applies to any operation with an inverse — formally, any *group* operation. Addition has subtraction. XOR is its own inverse. Multiplication has division, with the caveats already covered.",
        "Minimum and maximum have no inverse. Once the minimum of a prefix is 3, nothing tells you what the minimum would have been without the first few elements. That is not a limitation of the implementation; it is the operation.",
      ],
      examples: [
        {
          id: "xor-prefix",
          title: "Prefix XOR, and why maximum fails",
          lang: "python",
          code: `from collections import defaultdict

# Prefix XOR: XOR is its own inverse, so it prefixes exactly like a sum.
def prefix_xor(a):
    p = [0] * (len(a) + 1)
    for i, v in enumerate(a):
        p[i + 1] = p[i] ^ v
    return p

a = [4, 2, 2, 6, 4]
p = prefix_xor(a)
print("array     :", a)
print("prefix xor:", p)
for lo, hi in ((0, 3), (1, 4), (2, 3)):
    got = p[hi] ^ p[lo]
    want = 0
    for v in a[lo:hi]:
        want ^= v
    print(f"  xor of a[{lo}:{hi}] = {got}  check {want}")

def count_xor_subarrays(nums, k):
    seen = defaultdict(int)
    seen[0] = 1
    run = 0
    total = 0
    for v in nums:
        run ^= v
        total += seen[run ^ k]
        seen[run] += 1
    return total

print("\\nsubarrays with xor = 6:", count_xor_subarrays([4, 2, 2, 6, 4], 6))

def brute_xor(nums, k):
    n = 0
    for i in range(len(nums)):
        x = 0
        for j in range(i, len(nums)):
            x ^= nums[j]
            if x == k:
                n += 1
    return n
print("brute force            :", brute_xor([4, 2, 2, 6, 4], 6))

# Which aggregates prefix, and which do not.
print("\\nwhich aggregates work:")
print("  sum      yes  — subtraction inverts addition")
print("  xor      yes  — xor is its own inverse")
print("  product  only with no zeros, and only for exact division")
print("  min/max  NO   — there is no inverse; removing the min tells you nothing")
print("  count    yes  — it is a sum of ones")

# demonstrating that max does not prefix
b = [3, 9, 1, 7]
pm = [float("-inf")]
for v in b:
    pm.append(max(pm[-1], v))
print(f"\\nprefix max of {b}: {pm[1:]}")
print("  max of b[1:3] is", max(b[1:3]), "but there is no arithmetic on")
print("  prefix maxima that recovers it — 9 is in both prefixes.")`,
          output: `array     : [4, 2, 2, 6, 4]
prefix xor: [0, 4, 6, 4, 2, 6]
  xor of a[0:3] = 4  check 4
  xor of a[1:4] = 6  check 6
  xor of a[2:3] = 2  check 2

subarrays with xor = 6: 4
brute force            : 4

which aggregates work:
  sum      yes  — subtraction inverts addition
  xor      yes  — xor is its own inverse
  product  only with no zeros, and only for exact division
  min/max  NO   — there is no inverse; removing the min tells you nothing
  count    yes  — it is a sum of ones

prefix max of [3, 9, 1, 7]: [3, 9, 9, 9]
  max of b[1:3] is 9 but there is no arithmetic on
  prefix maxima that recovers it — 9 is in both prefixes.`,
          explanation:
            "**Prefix XOR** substitutes directly into everything from lesson 2. The complement lookup becomes `run ^ k` instead of `run - k`, because XOR is its own inverse — `x ^ k ^ k == x`. That one substitution turns \"count subarrays summing to k\" into \"count subarrays XOR-ing to k\", which is a common problem in its own right.\n\nThe prefix-maximum output shows the failure concretely. `9` appears in the prefix maximum at every position from index 1 onwards, so both `pm[1]` and `pm[3]` are 9, and no operation on those two numbers recovers the maximum of the range between them.",
        },
      ],
    },
    {
      id: "non-invertible",
      heading: "What to use instead",
      body: [
        "Range minimum, range maximum, and range GCD are all **idempotent** — `min(x, x) == x` — which fails the group requirement but enables a different structure.",
        "**Sparse table.** O(n log n) to build, O(1) per query, and the array must not change. It works by precomputing the answer for every power-of-two-length range and covering any query with two overlapping ones — overlapping is fine precisely *because* the operation is idempotent.",
        "**Segment tree.** O(n) to build, O(log n) per query, and it supports updates. The general answer for any associative operation.",
        "**Fenwick tree.** O(log n) for both, smaller and faster than a segment tree, but it needs an invertible operation — so it does sums and not minima.",
        "All three live in the advanced-structures elective. Knowing *which* one a problem needs is the part that matters here, and it follows directly from whether the operation has an inverse and whether the array changes.",
      ],
      pitfalls: [
        {
          title: "Prefix GCD looks like it works, and does not",
          body: "GCD has no inverse: `gcd(a[0:5])` and `gcd(a[0:2])` do not determine `gcd(a[2:5])`. It is a common near-miss because prefix GCD *arrays* are still useful for other purposes — just not for range queries.",
        },
        {
          title: "Using a sparse table on a mutable array",
          body: "It has no update operation. One element changing invalidates O(n log n) precomputed entries. If the array changes at all, it is a segment tree.",
        },
      ],
    },
  ],
  takeaways: [
    "Prefix queries need an operation with an inverse",
    "Sum, XOR and count work; minimum, maximum and GCD do not",
    "Prefix XOR substitutes into every technique from the hash-map lesson via `run ^ k`",
    "Products work only with no zeros and exact division",
    "Range min/max on a static array: sparse table, O(1) queries",
    "Anything mutable: segment tree, O(log n)",
    "Fenwick trees are smaller but still need invertibility",
  ],
  status: "available",
};
