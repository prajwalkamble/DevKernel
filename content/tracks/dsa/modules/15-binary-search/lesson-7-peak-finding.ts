import type { Lesson } from "@/content/types";

export const peakFindingLesson: Lesson = {
  id: "dsa-bs-peak",
  slug: "peak-finding-without-sorted-input",
  moduleSlug: "binary-search",
  title: "Peak Finding: Binary Search Without Sorted Input",
  summary:
    "The clearest proof that sortedness was never the requirement. An array in no order at all, and binary search still finds a peak in logarithmic time — because a local comparison is enough to rule out a whole side.",
  estimatedMinutes: 25,
  objectives: [
    "Find a peak in an unsorted array in O(log n)",
    "State the invariant that justifies discarding half",
    "Explain why a peak is guaranteed to exist",
    "Distinguish finding *a* peak from finding *the* maximum",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "A peak, and why one always exists",
      body: [
        "A **peak** is an index whose value is at least as large as both its neighbours, with out-of-range treated as negative infinity. So the first element is a peak if it beats the second, and the last is a peak if it beats the second-last.",
        "Every non-empty array has at least one. Walk from the left edge: either the sequence never rises, in which case index 0 is a peak, or it rises somewhere and — since the right edge is negative infinity — it must stop rising at some point, and that point is a peak.",
        "That argument is not decoration. It is what makes the algorithm correct, because it applies to *any* subarray whose edges you have compared.",
      ],
    },
    {
      id: "the-algorithm",
      heading: "Uphill is enough",
      body: [
        "Look at `mid` and `mid + 1`. If `a[mid] < a[mid + 1]`, the sequence is climbing at `mid + 1` — and by the argument above, the climb must stop somewhere to the right, so **a peak exists in `[mid + 1, hi]`**. Discard the left half. Otherwise the sequence is flat or falling at `mid`, so a peak exists in `[lo, mid]`. Discard the right.",
        "No sortedness anywhere. One local comparison rules out half the array.",
      ],
      examples: [
        {
          id: "peak",
          title: "Peak finding, traced",
          lang: "python",
          code: `# Peak finding: an unsorted array, and binary search still works.

def find_peak(a, trace=False):
    """An index whose value is >= both neighbours. Out-of-range counts as -inf."""
    lo, hi = 0, len(a) - 1
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if trace:
            print(f"  lo={lo} hi={hi} mid={mid} a[mid]={a[mid]} a[mid+1]={a[mid + 1]}")
        if a[mid] < a[mid + 1]:
            lo = mid + 1        # uphill to the right: a peak lies that way
        else:
            hi = mid            # flat or downhill: a peak lies at mid or left
    return lo

a = [1, 5, 3, 9, 2, 8, 4]
print("array:", a, "(not sorted)")
p = find_peak(a, trace=True)
print(f"peak at index {p}, value {a[p]}")

def is_peak(a, i):
    left = a[i - 1] if i > 0 else float("-inf")
    right = a[i + 1] if i + 1 < len(a) else float("-inf")
    return a[i] >= left and a[i] >= right

print("verified:", is_peak(a, p))

for case in ([1, 2, 3, 4], [4, 3, 2, 1], [7], [1, 2]):
    q = find_peak(case)
    print(f"  {str(case):12} -> index {q} value {case[q]}  peak? {is_peak(case, q)}")

# Why it is valid: the invariant is "a peak exists inside [lo, hi]".
print("\\nThe array is NOT sorted, yet half is discardable at every step:")
print("if a[mid] < a[mid+1], the right side must contain a peak, because the")
print("sequence rises at mid+1 and must eventually stop rising (the edge is -inf).")`,
          output: `array: [1, 5, 3, 9, 2, 8, 4] (not sorted)
  lo=0 hi=6 mid=3 a[mid]=9 a[mid+1]=2
  lo=0 hi=3 mid=1 a[mid]=5 a[mid+1]=3
  lo=0 hi=1 mid=0 a[mid]=1 a[mid+1]=5
peak at index 1, value 5
verified: True
  [1, 2, 3, 4] -> index 3 value 4  peak? True
  [4, 3, 2, 1] -> index 0 value 4  peak? True
  [7]          -> index 0 value 7  peak? True
  [1, 2]       -> index 1 value 2  peak? True

The array is NOT sorted, yet half is discardable at every step:
if a[mid] < a[mid+1], the right side must contain a peak, because the
sequence rises at mid+1 and must eventually stop rising (the edge is -inf).`,
          explanation:
            "It returns index 1, value 5 — and the array's actual maximum is 9, at index 3. **That is correct.** The problem asks for *a* peak, and 5 beats both 1 and 3. Finding the maximum genuinely requires looking at every element, and no logarithmic algorithm can do it; finding a peak does not.\n\nNote the loop uses `hi = len(a) - 1` and `lo < hi`, so `mid + 1` is always a valid index — `mid` is strictly less than `hi` whenever the loop body runs. Getting that wrong is the one way to break this, and it is why the closed convention is the natural fit here even though half-open was the default elsewhere.",
        },
      ],
    },
    {
      id: "generalising",
      heading: "What this tells you about the other variants",
      body: [
        "Every problem in this module is the same loop with a different rule for discarding.",
        "**Sorted array** — `a[mid]` against the target.",
        "**Rotated array** — which half is sorted, then a range test.",
        "**Binary search on the answer** — `feasible(mid)`.",
        "**Peak finding** — `a[mid]` against `a[mid + 1]`.",
        "The question to ask of a new problem is not \"is this sorted\" but **\"can I look at one point and rule out a side?\"** If yes, the cost is logarithmic and you should be looking for the rule.",
      ],
      pitfalls: [
        {
          title: "`a[mid + 1]` needs `hi = len - 1`",
          body: "With a half-open `hi = len`, `mid` can equal `len - 1` and `mid + 1` runs off the end. Either use the closed convention as above, or guard the comparison. This is the standard bug in this problem.",
        },
        {
          title: "A plateau breaks the guarantee",
          body: "The argument assumes you can always tell uphill from not-uphill. With equal adjacent values the algorithm still terminates and still returns a peak by the `>=` definition, but a *strict* peak — greater than both neighbours — may not exist at all in an array of equal values. Check which definition the problem uses.",
        },
      ],
    },
  ],
  takeaways: [
    "A peak is at least as large as both neighbours, with edges treated as -infinity",
    "One always exists, by a rise-must-stop argument",
    "`a[mid] < a[mid+1]` means a peak lies to the right; otherwise at mid or left",
    "The array need not be sorted in any way",
    "It finds *a* peak, not the maximum — the maximum needs O(n)",
    "Use `hi = len - 1` so `mid + 1` is always valid",
    "Ask \"can I rule out a side\", not \"is this sorted\"",
  ],
  status: "available",
};
