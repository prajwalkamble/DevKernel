import type { Lesson } from "@/content/types";

export const differenceArraysLesson: Lesson = {
  id: "dsa-ps-diff",
  slug: "difference-arrays-and-range-updates",
  moduleSlug: "prefix-sums-and-range-queries",
  title: "Difference Arrays & Range Updates",
  summary:
    "Prefix sums answer range queries fast. Difference arrays are the mirror image — they make range *updates* fast, at the cost of not being able to read anything until you are done.",
  estimatedMinutes: 30,
  objectives: [
    "Apply a range update in O(1) with a difference array",
    "Rebuild the final array with one prefix pass",
    "State the trade: fast updates, no reads until the end",
    "Recognise the interval-counting problems this solves",
  ],
  sections: [
    {
      id: "the-mirror",
      heading: "The mirror image",
      body: [
        "Prefix sums: **O(n) to build, O(1) to query, O(n) to update** — because changing one element invalidates every prefix after it.",
        "Difference arrays: **O(1) to update a whole range, O(n) to read the result.** You record only the *changes* at the boundaries and reconstruct at the end.",
        "The two are inverses. A prefix sum of a difference array gives back the original, which is why the reconstruction is a single running total.",
      ],
      examples: [
        {
          id: "difference",
          title: "Range updates, and 2D prefix sums",
          lang: "python",
          code: `def range_update(n, updates):
    """Difference array: each range update is O(1), one final pass rebuilds."""
    diff = [0] * (n + 1)
    for lo, hi, delta in updates:          # inclusive lo..hi
        diff[lo] += delta
        diff[hi + 1] -= delta
    out = []
    run = 0
    for i in range(n):
        run += diff[i]
        out.append(run)
    return out, diff

n = 8
updates = [(1, 3, 5), (2, 5, -2), (0, 7, 1)]
result, diff = range_update(n, updates)
print("updates (lo, hi, delta):", updates)
print("diff array :", diff)
print("final array:", result)

def naive(n, updates):
    a = [0] * n
    ops = 0
    for lo, hi, delta in updates:
        for i in range(lo, hi + 1):
            a[i] += delta
            ops += 1
    return a, ops

check, ops = naive(n, updates)
print("naive result:", check, " matches:", check == result)
print(f"\\nfor n=10^6 and 10^5 updates each spanning the whole array:")
print(f"  naive: 10^5 * 10^6 = 10^11 operations")
print(f"  diff : 10^5 * 2 + 10^6 = {2 * 10**5 + 10**6:,} operations")

# 2D prefix sums
def build_2d(m):
    rows, cols = len(m), len(m[0])
    p = [[0] * (cols + 1) for _ in range(rows + 1)]
    for r in range(rows):
        for c in range(cols):
            p[r + 1][c + 1] = m[r][c] + p[r][c + 1] + p[r + 1][c] - p[r][c]
    return p

def submatrix_sum(p, r1, c1, r2, c2):
    """Inclusive corners. Inclusion-exclusion: whole - top - left + overlap."""
    return p[r2 + 1][c2 + 1] - p[r1][c2 + 1] - p[r2 + 1][c1] + p[r1][c1]

mat = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
p = build_2d(mat)
print("\\nmatrix:", mat)
for row in p:
    print("  prefix", row)
for (r1, c1, r2, c2) in ((0, 0, 1, 1), (1, 1, 2, 2), (0, 0, 2, 2), (2, 0, 2, 2)):
    got = submatrix_sum(p, r1, c1, r2, c2)
    want = sum(mat[r][c] for r in range(r1, r2 + 1) for c in range(c1, c2 + 1))
    print(f"  ({r1},{c1})..({r2},{c2}) = {got:2}  check {want:2}  {'ok' if got == want else 'BAD'}")`,
          output: `updates (lo, hi, delta): [(1, 3, 5), (2, 5, -2), (0, 7, 1)]
diff array : [1, 5, -2, 0, -5, 0, 2, 0, -1]
final array: [1, 6, 4, 4, -1, -1, 1, 1]
naive result: [1, 6, 4, 4, -1, -1, 1, 1]  matches: True

for n=10^6 and 10^5 updates each spanning the whole array:
  naive: 10^5 * 10^6 = 10^11 operations
  diff : 10^5 * 2 + 10^6 = 1,200,000 operations

matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
  prefix [0, 0, 0, 0]
  prefix [0, 1, 3, 6]
  prefix [0, 5, 12, 21]
  prefix [0, 12, 27, 45]
  (0,0)..(1,1) = 12  check 12  ok
  (1,1)..(2,2) = 28  check 28  ok
  (0,0)..(2,2) = 45  check 45  ok
  (2,0)..(2,2) = 24  check 24  ok`,
          explanation:
            "The difference array is `n + 1` long so that `diff[hi + 1]` is always writable, even when `hi` is the last index. Without that slot every update touching the end needs a bounds check.\n\nA hundred billion operations against 1.2 million — five orders of magnitude, from replacing a loop over a range with two array writes.\n\n**The 2D version** is inclusion-exclusion in both directions. Building: the rectangle up to `(r, c)` is the cell, plus the rectangle above, plus the one to the left, minus the one counted twice at the top-left. Querying reverses the same reasoning. Getting the four terms right is easier if you draw the rectangles once rather than memorising the signs.",
        },
      ],
    },
    {
      id: "the-family",
      heading: "The problems this is really for",
      body: [
        "Difference arrays rarely appear under that name. They appear as **interval counting**.",
        "**Corporate Flight Bookings** — a list of `(first, last, seats)` and a final per-flight total. Exactly the loop above.",
        "**Car Pooling** — passengers boarding and leaving at stops; add at pickup, subtract at drop-off, then sweep and check the running total never exceeds capacity.",
        "**Meeting Rooms II / maximum concurrent intervals** — the same sweep. `+1` at each start, `−1` at each end, and the answer is the maximum running value.",
        "**Range Addition** — the bare form, stated directly.",
        "The recognition cue is *many range updates followed by one read*, or *the maximum number of overlapping intervals*. If the reads are interleaved with the updates, this does not apply and you want a Fenwick tree — which the advanced-structures elective covers.",
      ],
      pitfalls: [
        {
          title: "Half-open versus inclusive at the boundary",
          body: "If the problem's ranges are inclusive, the subtraction goes at `hi + 1`. If they are half-open, it goes at `hi`. Choosing the wrong one shifts every value by one position at the edges, which small tests often survive.",
        },
        {
          title: "Reading the array before reconstructing",
          body: "The difference array is not the answer. Mid-loop it is meaningless — `diff[i]` is a delta, not a value. Do all updates first, then reconstruct once.",
        },
        {
          title: "Events at the same coordinate",
          body: "In interval-overlap problems, whether an interval ending at time t conflicts with one starting at t depends on the problem. Process the ends before the starts if touching intervals are allowed to share a room, and after if they are not. This decides several borderline test cases.",
        },
      ],
    },
  ],
  takeaways: [
    "Difference arrays make range updates O(1) and reads O(n) — the mirror of prefix sums",
    "`diff[lo] += delta` and `diff[hi + 1] -= delta`, then one running-total pass",
    "Size the array `n + 1` so the `hi + 1` write is always in bounds",
    "Do all updates before reconstructing; mid-loop the array is meaningless",
    "Interval counting and maximum-overlap problems are this technique",
    "Interleaved reads and updates need a Fenwick tree instead",
    "2D prefix sums are inclusion-exclusion — draw the rectangles rather than memorise",
  ],
  status: "available",
};
