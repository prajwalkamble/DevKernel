import type { Lesson } from "@/content/types";

export const leapOfFaithLesson: Lesson = {
  id: "dsa-rec-faith",
  slug: "the-base-case-and-the-leap-of-faith",
  moduleSlug: "recursion-and-backtracking",
  title: "The Base Case & the Leap of Faith",
  summary:
    "Most people can read recursion and cannot write it, and the reason is a habit: they try to trace the calls. The habit that works is the opposite — assume the recursive call is already correct, and write only the step in front of you.",
  estimatedMinutes: 30,
  objectives: [
    "Write a recursive function from its two cases without tracing",
    "State the three obligations every recursive function has",
    "Read the unwinding order off a trace",
    "Diagnose the two ways a recursion fails to terminate",
  ],
  sections: [
    {
      id: "the-habit",
      heading: "Stop tracing",
      body: [
        "The instinct when writing a recursive function is to follow it down: this calls that, which calls that, and then what happens. Two levels in, you are holding four things in your head and have lost the thread. Three levels in it is hopeless.",
        "The working habit is to refuse to do that. **Assume the recursive call already works.** `factorial(n - 1)` returns the factorial of `n - 1` — not because you have checked, but because that is what you are in the middle of promising. Your only job is the one step: multiply it by `n`.",
        "This is not hand-waving. It is induction, which is a proof technique: establish the base case, then show that correctness at `n - 1` implies correctness at `n`. The leap of faith *is* the inductive hypothesis, and it is legitimate.",
      ],
    },
    {
      id: "three-obligations",
      heading: "The three obligations",
      body: [
        "**1. A base case that returns without recursing.** Something must stop.",
        "**2. Progress towards it.** Every recursive call must be on a strictly smaller problem — smaller n, a shorter list, a subtree. \"Smaller\" must be measured in whatever the base case tests.",
        "**3. The recursive case must be correct *given* the assumption.** This is the only part that takes thought, and it is one step long.",
        "Nearly every broken recursion fails one of the first two, and the failure is loud: infinite recursion means either there is no base case for the input you reached, or the calls are not getting closer to it.",
      ],
      examples: [
        {
          id: "trace",
          title: "The stack unwinding, and what a branching tree costs",
          lang: "python",
          code: `def factorial(n, depth=0):
    pad = "  " * depth
    print(f"{pad}factorial({n}) called")
    if n <= 1:
        print(f"{pad}factorial({n}) = 1  (base case)")
        return 1
    result = n * factorial(n - 1, depth + 1)
    print(f"{pad}factorial({n}) = {n} * {result // n} = {result}")
    return result

print("=== the stack unwinding ===")
factorial(4)

def fib(n, depth=0, calls=None):
    if calls is not None:
        calls[0] += 1
    if n < 2:
        return n
    return fib(n - 1, depth + 1, calls) + fib(n - 2, depth + 1, calls)

print("\\n=== the recursion tree's cost ===")
for n in (10, 20, 25, 30):
    calls = [0]
    value = fib(n, calls=calls)
    print(f"  fib({n:2}) = {value:7}  calls = {calls[0]:9,}")

print("\\ncalls roughly double for each +1 in n — that is the 2^n shape.")
print("The tree has depth n and branches twice at every node.")`,
          output: `=== the stack unwinding ===
factorial(4) called
  factorial(3) called
    factorial(2) called
      factorial(1) called
      factorial(1) = 1  (base case)
    factorial(2) = 2 * 1 = 2
  factorial(3) = 3 * 2 = 6
factorial(4) = 4 * 6 = 24

=== the recursion tree's cost ===
  fib(10) =      55  calls =       177
  fib(20) =    6765  calls =    21,891
  fib(25) =   75025  calls =   242,785
  fib(30) =  832040  calls = 2,692,537

calls roughly double for each +1 in n — that is the 2^n shape.
The tree has depth n and branches twice at every node.`,
          explanation:
            "Read the trace's shape: every call goes all the way down before any of them come back up. The `= 24` line prints **last**, not first. Work that happens *before* the recursive call runs top-down; work *after* it runs bottom-up — and choosing which side to put your work on is most of what tree traversals are about.\n\nThe Fibonacci counts show the other thing worth reading off a trace. `fib(30)` makes 2.7 million calls to compute a number you could reach in thirty additions, because the tree recomputes the same subproblems endlessly. That waste is exactly what memoisation removes, and it is why the DP module starts here.",
        },
      ],
      visual: {
        id: "quick-visual",
        kind: "sorting",
        algorithm: "quick",
        title: "Quicksort, recursing on both sides of each pivot",
      },
    },
    {
      id: "the-two-failures",
      heading: "The two ways it fails to stop",
      body: [
        "**No base case for the input you actually reach.** `factorial(n)` with `if n == 1` handles positive integers and recurses forever on 0 or a negative. Using `n <= 1` rather than `n == 1` is not defensive coding — it is covering the inputs the function will really see.",
        "**Calls that do not shrink.** `f(n)` calling `f(n)`, or `helper(lo, hi)` calling `helper(lo, hi)` on a branch where neither bound moved. This is the same failure as the `lo = mid` bug from binary search, and it has the same fix: identify the quantity that must decrease and check that every path decreases it.",
        "When a recursion hangs, ask those two questions in that order. It is nearly always one of them.",
      ],
      pitfalls: [
        {
          title: "Base case placed after the recursive call",
          body: "The base case must be checked *before* recursing. Written the other way round the function recurses first and the guard is never reached, which is an immediate stack overflow rather than a subtle bug — so at least it is loud.",
        },
        {
          title: "Returning nothing on one path",
          body: "Every branch must return. A missing `return` before a recursive call is the classic silent bug: the work happens, the result is discarded, and the function returns `None` or `0`. Python will not warn you.",
        },
      ],
    },
  ],
  takeaways: [
    "Assume the recursive call is correct — that is the inductive hypothesis, not a shortcut",
    "Three obligations: a base case, progress towards it, and one correct step",
    "Work before the recursive call runs top-down; work after it runs bottom-up",
    "Infinite recursion means no reachable base case, or calls that do not shrink",
    "`fib(30)` makes 2.7 million calls — the waste memoisation exists to remove",
    "Every branch must return, and the base case must come first",
  ],
  status: "available",
};
