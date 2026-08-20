import type { Lesson } from "@/content/types";

export const boundsLesson: Lesson = {
  id: "dsa-bs-bounds",
  slug: "lower-bound-and-upper-bound",
  moduleSlug: "binary-search",
  title: "Lower Bound, Upper Bound & Duplicates",
  summary:
    "Plain binary search returns *an* index. Almost every real problem wants the first, the last, or how many — and all three come from two functions that differ by a single character.",
  estimatedMinutes: 30,
  objectives: [
    "Write lower_bound and upper_bound and state precisely what each returns",
    "Find the first and last occurrence of a duplicated value",
    "Count occurrences in O(log n) without scanning",
    "Use the bounds as insertion points",
    "Stop writing the \"then walk left to find the start\" version",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "\"An index\" is rarely the question",
      body: [
        "Plain binary search on `[1, 2, 2, 2, 3]` searching for `2` may return index 1, 2 or 3 — whichever the halving happens to land on. That is fine for \"is it present\" and useless for almost everything else.",
        "The common follow-up is to find any occurrence and then walk outwards to the edges. **Do not.** With a million copies of the value that walk is O(n), which throws away the whole point of having searched.",
        "The right answer is two search variants that never test for equality at all.",
      ],
    },
    {
      id: "the-two",
      heading: "Two functions, one character apart",
      body: [
        "**`lower_bound(a, t)`** — the first index `i` with `a[i] >= t`. If every element is smaller, it returns `len(a)`.",
        "**`upper_bound(a, t)`** — the first index `i` with `a[i] > t`.",
        "Neither returns \"found\" or \"not found\". Both return a **position**, always valid as an insertion point, and every question you actually have is arithmetic on the pair.",
      ],
      examples: [
        {
          id: "bounds",
          title: "Both bounds, and everything derived from them",
          lang: "python",
          code: `def lower_bound(a, target):
    """First index with a[i] >= target. Equals len(a) when there is none."""
    lo, hi = 0, len(a)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo

def upper_bound(a, target):
    """First index with a[i] > target."""
    lo, hi = 0, len(a)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if a[mid] <= target:
            lo = mid + 1
        else:
            hi = mid
    return lo

a = [1, 2, 2, 2, 3, 5, 5, 8]
print("array:", a, "\\n")
for t in (2, 5, 4, 0, 9):
    lb, ub = lower_bound(a, t), upper_bound(a, t)
    print(f"target {t}:  lower={lb}  upper={ub}  count={ub - lb}"
          f"  first={lb if lb < len(a) and a[lb] == t else None}"
          f"  last={ub - 1 if ub > lb else None}")

# the two differ in exactly one character, and that is the whole trick
print("\\nlower_bound uses  a[mid] <  target")
print("upper_bound uses  a[mid] <= target")

# insertion point: lower_bound is where a new value goes to keep order
import bisect
print("\\nmatches the standard library:")
for t in (2, 4, 9):
    print(f"  t={t}: ours lower={lower_bound(a, t)} bisect_left={bisect.bisect_left(a, t)}"
          f"   ours upper={upper_bound(a, t)} bisect_right={bisect.bisect_right(a, t)}")`,
          output: `array: [1, 2, 2, 2, 3, 5, 5, 8] 

target 2:  lower=1  upper=4  count=3  first=1  last=3
target 5:  lower=5  upper=7  count=2  first=5  last=6
target 4:  lower=5  upper=5  count=0  first=None  last=None
target 0:  lower=0  upper=0  count=0  first=None  last=None
target 9:  lower=8  upper=8  count=0  first=None  last=None

lower_bound uses  a[mid] <  target
upper_bound uses  a[mid] <= target

matches the standard library:
  t=2: ours lower=1 bisect_left=1   ours upper=4 bisect_right=4
  t=4: ours lower=5 bisect_left=5   ours upper=5 bisect_right=5
  t=9: ours lower=8 bisect_left=8   ours upper=8 bisect_right=8`,
          explanation:
            "The whole difference is `<` against `<=`. With `<`, an element equal to the target fails the test and the window collapses towards it from the right, landing on the first equal element. With `<=`, an equal element passes and gets skipped, landing just past the last one.\n\nEverything else is arithmetic. **Count** is `upper - lower`, and it is zero exactly when the value is absent — which is also the presence test, so you never need a separate one. **First occurrence** is `lower`, valid only if `lower < len` and `a[lower] == t`. **Last occurrence** is `upper - 1`.",
        },
      ],
    },
    {
      id: "in-libraries",
      heading: "Your language already has these",
      body: [
        "Python: `bisect.bisect_left` is lower bound, `bisect.bisect_right` is upper bound. Both take optional `lo` and `hi` to search a slice without copying it.",
        "C++: `std::lower_bound` and `std::upper_bound`, returning iterators; subtract `begin()` for an index. `std::equal_range` returns both at once.",
        "Java: `Arrays.binarySearch` is neither — with duplicates it returns an unspecified one of them, so you have to write the bounds yourself. This is a real gap and the reason the Java version above is worth memorising.",
        "Go: `sort.SearchInts` is lower bound. The general `sort.Search` takes a predicate and returns the first index where it holds, which is lower bound generalised — and is the shape the next lesson builds on.",
      ],
      pitfalls: [
        {
          title: "`lower_bound` returning `len(a)` is a valid answer, not a failure",
          body: "When the target is larger than everything, the correct insertion point is the end. Indexing with it without checking is an out-of-range error, and it only happens on the largest input — write `if lb < len(a) and a[lb] == t` every time.",
        },
        {
          title: "`bisect_left` on a list of tuples compares whole tuples",
          body: "Searching a list of `(key, value)` pairs for a key means constructing a sentinel: `bisect_left(pairs, (key,))` finds the first pair with that key, because a one-element tuple sorts before every two-element tuple sharing its first element. Passing a bare key raises a type error in Python 3.",
        },
      ],
    },
  ],
  takeaways: [
    "`lower_bound` is the first index with `a[i] >= t`; `upper_bound` the first with `a[i] > t`",
    "They differ only in `<` against `<=`",
    "Count is `upper - lower`, and zero count is the presence test",
    "First occurrence is `lower`; last is `upper - 1`",
    "Never find one occurrence and walk outwards — that is O(n)",
    "`len(a)` is a legitimate return value; check before indexing",
    "Java has no built-in bounds; Python has bisect, C++ has both, Go has sort.Search",
  ],
  status: "available",
};
