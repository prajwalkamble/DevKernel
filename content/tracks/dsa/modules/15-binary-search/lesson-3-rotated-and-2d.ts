import type { Lesson } from "@/content/types";

export const rotatedAnd2dLesson: Lesson = {
  id: "dsa-bs-rotated",
  slug: "rotated-arrays-matrices-and-unbounded-input",
  moduleSlug: "binary-search",
  title: "Rotated Arrays, Matrices & Unbounded Input",
  summary:
    "Three variants that look like different problems and are the same one. What binary search actually needs is not a sorted array — it is a way to discard half.",
  estimatedMinutes: 35,
  objectives: [
    "Search a rotated sorted array in one pass",
    "Find the rotation pivot without finding the target first",
    "Search a row-major sorted matrix by index arithmetic",
    "Handle an unbounded or streamed input by doubling first",
    "State the real precondition for binary search",
  ],
  sections: [
    {
      id: "real-precondition",
      heading: "What binary search actually requires",
      body: [
        "The usual statement — \"the array must be sorted\" — is sufficient but not necessary, and believing it is what makes the variants below look like separate tricks.",
        "The real requirement is weaker: **at every step you must be able to look at the middle and rule out one side entirely.** Sorted order is the most common way to earn that, not the only one.",
        "Once you hold it that way, a rotated array is obviously searchable — one half is always sorted, so you can always rule out a side — and \"binary search on the answer\" in the next lesson stops looking like a different technique.",
      ],
    },
    {
      id: "rotated",
      heading: "Rotated sorted arrays",
      body: [
        "A sorted array rotated at some unknown pivot: `[12, 16, 23, 38, 56, 2, 5, 8]`. Cut it anywhere and **at least one half is still sorted** — the pivot can only be in one of them. Work out which half is sorted, check whether the target falls in its range, and go there or to the other side.",
      ],
      examples: [
        {
          id: "rotated",
          title: "Rotated search, the pivot, and a matrix",
          lang: "python",
          code: `def search_rotated(a, target):
    """One half of a rotated sorted array is always sorted. Decide which, then
    ask whether the target lies inside it."""
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if a[mid] == target:
            return mid
        if a[lo] <= a[mid]:                 # left half is sorted
            if a[lo] <= target < a[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:                                # right half is sorted
            if a[mid] < target <= a[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1

r = [12, 16, 23, 38, 56, 2, 5, 8]
print("rotated:", r)
for t in (56, 2, 12, 8, 99):
    print(f"  search {t:2} -> {search_rotated(r, t)}")

def find_min_rotated(a):
    """The pivot: the only element smaller than its predecessor."""
    lo, hi = 0, len(a) - 1
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if a[mid] > a[hi]:
            lo = mid + 1
        else:
            hi = mid
    return lo

print("\\npivot index:", find_min_rotated(r), "value:", r[find_min_rotated(r)])
print("unrotated  :", find_min_rotated([1, 2, 3, 4]), "(already sorted)")

def search_matrix(m, target):
    """A row-major sorted matrix is one sorted array with index arithmetic."""
    if not m or not m[0]:
        return False
    rows, cols = len(m), len(m[0])
    lo, hi = 0, rows * cols
    while lo < hi:
        mid = lo + (hi - lo) // 2
        v = m[mid // cols][mid % cols]
        if v == target:
            return True
        if v < target:
            lo = mid + 1
        else:
            hi = mid
    return False

mat = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]]
print("\\nmatrix:", mat)
for t in (3, 16, 60, 13):
    print(f"  contains {t:2}: {search_matrix(mat, t)}")`,
          output: `rotated: [12, 16, 23, 38, 56, 2, 5, 8]
  search 56 -> 4
  search  2 -> 5
  search 12 -> 0
  search  8 -> 7
  search 99 -> -1

pivot index: 5 value: 2
unrotated  : 0 (already sorted)

matrix: [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]]
  contains  3: True
  contains 16: True
  contains 60: True
  contains 13: False`,
          explanation:
            "Three details earn their place. `a[lo] <= a[mid]` uses `<=` rather than `<` so that a two-element window, where `lo == mid`, is read as sorted-left rather than falling into the wrong branch.\n\nThe **pivot search compares against `a[hi]`, not `a[lo]`**. Comparing against `a[lo]` cannot distinguish an unrotated array from a fully rotated one; comparing against the right end works in both cases, which is why `find_min_rotated([1,2,3,4])` correctly returns 0 with no special case.\n\nThe **matrix** is not a 2D problem at all. `m` rows of `n` columns sorted row-major is one sorted sequence of `m*n` elements, and `mid // cols` with `mid % cols` converts a flat index back. Same loop, different accessor.",
        },
      ],
      pitfalls: [
        {
          title: "Duplicates break the rotated search",
          body: "With `[3, 1, 3, 3, 3]`, `a[lo] == a[mid] == a[hi]` and you cannot tell which half is sorted. The standard fix is to shrink both ends by one when they are equal — which degrades the worst case to O(n), and provably so: no algorithm can do better, because the duplicates hide the pivot.",
        },
        {
          title: "A matrix sorted by row *and* column is a different problem",
          body: "If each row is sorted and each column is sorted, but rows do not continue from one another, the flat-index trick is wrong. That variant is solved by starting at the top-right corner and stepping left or down — O(m + n), not O(log mn).",
        },
      ],
    },
    {
      id: "unbounded",
      heading: "Unbounded input: find a ceiling first",
      body: [
        "Sometimes there is no `len` — an infinite stream, an API you can only index, or a monotone function you can evaluate but not enumerate. Binary search needs an upper bound, so **manufacture one by doubling**: probe index 1, 2, 4, 8, 16 until the value exceeds the target, then binary search between the last two probes.",
        "The doubling costs O(log p) probes to bracket a target at position p, and the search costs another O(log p). Total is still logarithmic — and this is the same idea that makes a dynamic array's amortised append O(1).",
      ],
    },
  ],
  takeaways: [
    "The requirement is being able to discard half, not sortedness as such",
    "In a rotated array one half is always sorted — find it, then test the range",
    "Use `a[lo] <= a[mid]` so a two-element window behaves",
    "Find the pivot by comparing against `a[hi]`, which handles the unrotated case free",
    "A row-major sorted matrix is one array; convert with `mid // cols` and `mid % cols`",
    "Row-and-column sorted is a different problem — walk from the top-right corner",
    "With no upper bound, double until you overshoot, then search the last bracket",
  ],
  status: "available",
};
