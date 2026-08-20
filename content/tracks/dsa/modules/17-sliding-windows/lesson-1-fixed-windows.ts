import type { Lesson } from "@/content/types";

export const fixedWindowsLesson: Lesson = {
  id: "dsa-sw-fixed",
  slug: "fixed-size-windows",
  moduleSlug: "sliding-windows",
  title: "Fixed-Size Windows: One In, One Out",
  summary:
    "The simplest version of the pattern, and the one that makes the idea obvious: when the window is a fixed width, moving it is two arithmetic operations rather than a recomputation.",
  estimatedMinutes: 25,
  objectives: [
    "Write the fixed-window loop with an incremental update",
    "Compare the operation count against recomputing each window",
    "Identify what \"window state\" means for a given problem",
    "Handle the first window separately and say why",
  ],
  sections: [
    {
      id: "the-idea",
      heading: "The redundancy the pattern removes",
      body: [
        "Maximum sum of any three consecutive elements. The obvious solution slides a window and adds up its contents each time — and almost all of that addition is repeated work. Two adjacent windows of width three share **two** of their three elements.",
        "The fix is the whole pattern: **maintain the state incrementally.** When the window moves one place right, one element enters and one leaves. Add the entering value, subtract the leaving one, and the sum is up to date in two operations regardless of how wide the window is.",
      ],
      examples: [
        {
          id: "fixed",
          title: "One in, one out",
          lang: "python",
          code: `def max_sum_fixed(a, k, trace=False):
    """Fixed window: add the entering element, drop the leaving one."""
    if len(a) < k:
        return None
    total = sum(a[:k])
    best = total
    if trace:
        print(f"  window {a[:k]} sum={total}")
    for right in range(k, len(a)):
        total += a[right] - a[right - k]
        if trace:
            print(f"  +{a[right]:3} -{a[right - k]:3} -> {a[right - k + 1:right + 1]} sum={total}")
        best = max(best, total)
    return best

a = [2, 1, 5, 1, 3, 2, 7, 1]
print("array:", a, " k=3")
print("max sum:", max_sum_fixed(a, 3, trace=True))

# the recompute-every-window version, for the cost comparison
def max_sum_naive(a, k):
    ops = 0
    best = None
    for i in range(len(a) - k + 1):
        s = 0
        for j in range(i, i + k):
            s += a[j]
            ops += 1
        best = s if best is None else max(best, s)
    return best, ops

def max_sum_ops(a, k):
    total = sum(a[:k])
    ops = k
    best = total
    for right in range(k, len(a)):
        total += a[right] - a[right - k]
        ops += 2
        best = max(best, total)
    return best, ops

n, k = 10_000, 500
big = [i % 17 for i in range(n)]
print(f"\\nn={n}, k={k}")
print("  sliding:", max_sum_ops(big, k)[1], "operations")
print("  naive  :", max_sum_naive(big, k)[1], "operations")`,
          output: `array: [2, 1, 5, 1, 3, 2, 7, 1]  k=3
  window [2, 1, 5] sum=8
  +  1 -  2 -> [1, 5, 1] sum=7
  +  3 -  1 -> [5, 1, 3] sum=9
  +  2 -  5 -> [1, 3, 2] sum=6
  +  7 -  1 -> [3, 2, 7] sum=12
  +  1 -  3 -> [2, 7, 1] sum=10
max sum: 12

n=10000, k=500
  sliding: 19500 operations
  naive  : 4750500 operations`,
          explanation:
            "Nineteen thousand operations against four and three-quarter million — a factor of 244, which is roughly `k / 2` as the arithmetic predicts. The naive version is O(n·k); the sliding one is O(n) **regardless of k**, and that independence from the window width is the property worth remembering.",
        },
      ],
    },
    {
      id: "window-state",
      heading: "What \"state\" means",
      body: [
        "The sum is the easy case. The pattern generalises to any summary of the window that can be updated in O(1) when one element enters and one leaves.",
        "**A sum** — add and subtract. **A frequency map** — increment the entering key, decrement the leaving one, and delete it at zero. **A count of distinct values** — the size of that map. **An average** — the sum divided by k. **A maximum** — this one is *not* O(1), because removing the current maximum forces you to find the next one; it needs a monotonic deque, which the stacks-and-queues module covers.",
        "Before writing a window, ask what the state is and whether both the entering and the leaving update are cheap. If removal is expensive, the plain window is not enough.",
      ],
      pitfalls: [
        {
          title: "Building the first window inside the loop",
          body: "The incremental update needs an element to leave, and for the first window there is none. Either fill the first window before the loop, as above, or guard with `if right >= k`. Trying to do both in one loop without a guard reads `a[-1]` in Python — the *last* element — which is a wrong answer rather than an error.",
        },
        {
          title: "Forgetting the `len(a) < k` case",
          body: "A window wider than the array has no valid position. Returning `sum(a[:k])` silently gives the sum of the whole array, which passes small tests and fails the edge case the grader always includes.",
        },
      ],
    },
  ],
  takeaways: [
    "Adjacent windows share all but two elements; the pattern stops recomputing them",
    "Add the entering element, subtract the leaving one — two operations",
    "Cost is O(n) regardless of the window width",
    "State can be a sum, a frequency map, or a distinct count",
    "A window *maximum* is not O(1) to maintain — that needs a monotonic deque",
    "Build the first window before the loop, and handle `len(a) < k`",
  ],
  status: "available",
};
