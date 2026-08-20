import type { Lesson } from "@/content/types";

export const oppositeEndsLesson: Lesson = {
  id: "dsa-tp-opposite",
  slug: "opposite-ends-and-the-invariant",
  moduleSlug: "two-pointers",
  title: "Opposite Ends & the Invariant",
  summary:
    "Two indices walking towards each other turn an n² search into an n one. The mechanics take a minute; the reason it is allowed to skip what it skips is the part worth an hour.",
  estimatedMinutes: 30,
  objectives: [
    "Write the opposite-ends loop on a sorted array",
    "State the invariant it maintains",
    "Explain what each pointer move discards, and why none of it was needed",
    "Count the steps and derive the O(n) bound",
    "Recognise the precondition that makes it applicable",
  ],
  sections: [
    {
      id: "the-shape",
      heading: "The shape",
      body: [
        "A sorted array and a target sum. Put one index at each end. Look at the pair.",
        "If the sum is **too small**, the only way to increase it is to move the left pointer right — the right pointer is already on the largest available value. If the sum is **too big**, move the right pointer left. If it matches, you are done.",
        "Each step moves one pointer one place, and they only ever move towards each other, so the loop runs at most `n - 1` times. That is the whole algorithm.",
      ],
      examples: [
        {
          id: "two-sum-sorted",
          title: "Two Sum on a sorted array, traced",
          lang: "python",
          code: `def two_sum_sorted(a, target, trace=False):
    """Opposite ends. Each step discards a row or a column of the n^2 grid."""
    lo, hi = 0, len(a) - 1
    steps = 0
    while lo < hi:
        steps += 1
        s = a[lo] + a[hi]
        if trace:
            print(f"  a[{lo}]={a[lo]:3} + a[{hi}]={a[hi]:3} = {s:4}"
                  f"  {'too small' if s < target else 'too big' if s > target else 'FOUND'}")
        if s == target:
            return (lo, hi), steps
        if s < target:
            lo += 1
        else:
            hi -= 1
    return None, steps

a = [2, 5, 8, 12, 16, 23, 38, 56]
print("array:", a)
print("\\ntarget 39:")
pair, steps = two_sum_sorted(a, 39, trace=True)
print(f"  -> {pair} in {steps} steps")

print("\\ntarget 100 (absent):")
pair, steps = two_sum_sorted(a, 100, trace=True)
print(f"  -> {pair} in {steps} steps")

# the brute force, for the same input
def brute(a, target):
    checks = 0
    for i in range(len(a)):
        for j in range(i + 1, len(a)):
            checks += 1
            if a[i] + a[j] == target:
                return (i, j), checks
    return None, checks

print("\\ncomparison for target 39:")
print("  two pointers:", two_sum_sorted(a, 39)[1], "steps")
print("  brute force :", brute(a, 39)[1], "checks")
n = len(a)
print(f"  n={n}: at most {n - 1} steps vs {n * (n - 1) // 2} pairs")`,
          output: `array: [2, 5, 8, 12, 16, 23, 38, 56]

target 39:
  a[0]=  2 + a[7]= 56 =   58  too big
  a[0]=  2 + a[6]= 38 =   40  too big
  a[0]=  2 + a[5]= 23 =   25  too small
  a[1]=  5 + a[5]= 23 =   28  too small
  a[2]=  8 + a[5]= 23 =   31  too small
  a[3]= 12 + a[5]= 23 =   35  too small
  a[4]= 16 + a[5]= 23 =   39  FOUND
  -> (4, 5) in 7 steps

target 100 (absent):
  a[0]=  2 + a[7]= 56 =   58  too small
  a[1]=  5 + a[7]= 56 =   61  too small
  a[2]=  8 + a[7]= 56 =   64  too small
  a[3]= 12 + a[7]= 56 =   68  too small
  a[4]= 16 + a[7]= 56 =   72  too small
  a[5]= 23 + a[7]= 56 =   79  too small
  a[6]= 38 + a[7]= 56 =   94  too small
  -> None in 7 steps

comparison for target 39:
  two pointers: 7 steps
  brute force : 23 checks
  n=8: at most 7 steps vs 28 pairs`,
          explanation:
            "Seven steps against twenty-eight possible pairs, on an array of eight. At n = 1000 it is 999 steps against half a million. The gap is the whole point of the pattern, and it comes from never examining a pair at all — not from examining pairs faster.",
        },
      ],
    },
    {
      id: "the-invariant",
      heading: "The invariant, and what a move throws away",
      body: [
        "The loop maintains: **if a valid pair exists, both of its indices are inside `[lo, hi]`.** Every move must preserve that, and this is where the reasoning lives.",
        "Suppose `a[lo] + a[hi] < target` and we move `lo` rightwards. What did we discard? Every pair `(lo, j)` for `j <= hi`. Is that safe? `a[hi]` is the largest value still in the window, so `a[lo] + a[j] <= a[lo] + a[hi] < target` for every one of them. **Not one of the discarded pairs could have worked.** The move throws away a whole row of the pair grid, and every entry in it was already known to be too small.",
        "The symmetric argument covers moving `hi` when the sum is too big. That is the complete correctness proof, and it is short enough to say out loud in an interview — which is exactly what you will be asked to do.",
      ],
      pitfalls: [
        {
          title: "It needs sorted input, and sorting may not be free",
          body: "The argument above rests entirely on `a[hi]` being the largest remaining value. On unsorted input every step is unjustified. Sorting first costs O(n log n) — which is fine if the answer is the *values*, and wrong if the answer is the *original indices*, because sorting destroys them. LeetCode's Two Sum asks for indices and is a hash-map problem; Two Sum II hands you a sorted array and is this one.",
        },
        {
          title: "`while lo < hi`, not `<=`",
          body: "With `<=` the loop eventually considers the pair `(i, i)`, using one element twice. Almost every problem in this family forbids that.",
        },
      ],
      visual: {
        id: "two-pointers-visual",
        kind: "pattern",
        algorithm: "twopointers",
        lockAlgorithm: true,
        title: "The pointers converging, and what each move discards",
      },
    },
  ],
  takeaways: [
    "Two indices at opposite ends, moving towards each other, is O(n)",
    "The invariant: any valid pair still lies inside the window",
    "Moving `lo` on a too-small sum discards a row that was provably all too small",
    "The correctness argument is two sentences — be ready to say it",
    "Requires sorted input, so it needs values rather than original indices",
    "`while lo < hi` keeps an element from pairing with itself",
  ],
  status: "available",
};
