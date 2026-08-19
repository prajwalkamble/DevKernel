import type { Lesson } from "@/content/types";

export const infiniteLoopsLesson: Lesson = {
  id: "dsa-flow-infinite",
  slug: "infinite-loops",
  moduleSlug: "conditional-statements-and-loops",
  title: "Infinite Loops: On Purpose, and by Accident",
  summary:
    "The four ways a loop fails to terminate, how to prove yours does, and the one case where you write an endless loop deliberately.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Name the four causes of a loop that does not terminate",
    "State a decreasing quantity that proves a loop ends",
    "Recognise the binary-search infinite loop, which is the subtlest one",
    "Write a deliberate `while (true)` and know when it is the right shape",
  ],
  sections: [
    {
      id: "four-causes",
      heading: "Four ways a loop fails to end",
      body: [
        "**Nothing advances.** The counter is never incremented, or the increment is inside a branch that does not always run. The most common cause by a wide margin.",
        "**The advance is skipped.** A `continue` jumps over the `i++` at the bottom of a `while` body — covered in the break-and-continue lesson, and the reason `for` is safer.",
        "**The condition can never become false.** `while (i != n)` with `i` advancing by 2 from an odd start steps straight past `n` and never equals it. `!=` in a loop condition deserves suspicion; `<` does not have this failure.",
        "**Progress is not guaranteed.** The loop does advance, but not always — a binary search where a branch leaves the range unchanged, or a two-pointer loop where neither pointer moves on some input. This is the subtle one and it is the subject of its own section below.",
      ],
      examples: [
        {
          id: "never-equal",
          title: "The condition that steps over its target",
          lang: "python",
          code: `def counts_safely(start, stop, step):
    i = start
    passes = 0
    while i < stop:
        i += step
        passes += 1
        if passes > 20:
            return "gave up"
    return passes


def counts_dangerously(start, stop, step):
    i = start
    passes = 0
    while i != stop:
        i += step
        passes += 1
        if passes > 20:
            return "would never stop"
    return passes


print("less-than, even step :", counts_safely(0, 10, 2))
print("not-equal, even step :", counts_dangerously(0, 10, 2))
print("less-than, odd start :", counts_safely(1, 10, 2))
print("not-equal, odd start :", counts_dangerously(1, 10, 2))`,
          output: `less-than, even step : 5
not-equal, even step : 5
less-than, odd start : 5
not-equal, odd start : would never stop`,
          explanation:
            "The last row is the failure. Starting at 1 and stepping by 2 gives 1, 3, 5, 7, 9, 11 — it never *equals* 10, so `!=` never becomes false while `<` does. The first three rows agree, which is exactly what makes this bug survive testing: `!=` works for the inputs you tried. Prefer `<` in a numeric loop condition unless you have a specific reason.",
        },
      ],
    },
    {
      id: "proving-termination",
      heading: "Proving a loop ends",
      body: [
        "There is a one-sentence check, and it is the counterpart to the loop invariant.",
        "**Name a non-negative quantity that strictly decreases on every pass.** If one exists, the loop must end, because a non-negative integer cannot decrease forever.",
        "For `for (int i = 0; i < n; i++)`, the quantity is `n - i`. It starts positive and drops by exactly one each pass.",
        "For binary search it is `hi - lo`, the size of the remaining range. For two pointers converging it is `hi - lo` again. For a `while` reading input it is the number of items left.",
        "If you cannot name the decreasing quantity, that is not a formality you skipped — it is a warning that the loop may not terminate on some input you have not tried.",
      ],
      examples: [
        {
          id: "decreasing",
          title: "The quantity, printed each pass",
          lang: "python",
          code: `def gcd(a, b):
    while b != 0:
        print(f"  a={a:>4} b={b:>4}  remaining measure b={b}")
        a, b = b, a % b
    return a


print("gcd(48, 18) =", gcd(48, 18))
print("gcd(17, 5)  =", gcd(17, 5))`,
          output: `  a=  48 b=  18  remaining measure b=18
  a=  18 b=  12  remaining measure b=12
  a=  12 b=   6  remaining measure b=6
gcd(48, 18) = 6
  a=  17 b=   5  remaining measure b=5
  a=   5 b=   2  remaining measure b=2
  a=   2 b=   1  remaining measure b=1
gcd(17, 5)  = 1
`,
          explanation:
            "The decreasing quantity is `b`, and it is not obvious that it decreases — it does because `a % b` is always strictly less than `b`. That is the whole termination argument for the Euclidean algorithm, and note the loop condition is `b != 0` rather than `b < something`, which is safe here precisely *because* the quantity decreases by at least one each time and cannot step over zero.",
        },
      ],
    },
    {
      id: "binary-search-hang",
      heading: "The binary search that hangs",
      body: [
        "This deserves its own section because it is the infinite loop most people meet in a real problem, and because the code looks correct.",
        "Written with an exclusive `hi` and `while (lo < hi)`, the update `hi = mid` is right and `lo = mid` is a hang. When `lo` and `hi` are adjacent, `mid` computes to `lo`, so `lo = mid` leaves everything unchanged and the loop spins forever.",
        "The termination measure names the bug immediately: `hi - lo` must strictly decrease. `lo = mid + 1` guarantees it. `lo = mid` does not.",
      ],
      examples: [
        {
          id: "binary-hang",
          title: "The one-character difference",
          lang: "python",
          code: `def first_at_least(values, target, plus_one):
    lo, hi = 0, len(values)
    passes = 0

    while lo < hi:
        passes += 1
        if passes > 20:
            return "hung", passes
        mid = lo + (hi - lo) // 2
        if values[mid] < target:
            lo = mid + 1 if plus_one else mid
        else:
            hi = mid

    return lo, passes


data = [1, 3, 5, 7, 9]
print("with mid + 1:", first_at_least(data, 6, True))
print("with mid    :", first_at_least(data, 6, False))`,
          output: `with mid + 1: (3, 3)
with mid    : ('hung', 21)`,
          explanation:
            "One character. With `mid + 1` the search finishes in three passes and returns index 3, the first value at least 6. With `mid` the range stops shrinking once `lo` and `hi` are one apart and the loop never ends — the guard is the only reason this example terminates at all. The reasoning that catches it before running is the measure: does `hi - lo` strictly decrease on *both* branches?",
        },
      ],
      pitfalls: [
        {
          title: "Testing binary search only on values that are present",
          body: "The hang above needs a target that is absent, or one that lands between elements — the branches that shrink by zero are the ones a present target never exercises. Any binary search should be tested with a target below everything, above everything, and between two elements.",
        },
      ],
    },
    {
      id: "on-purpose",
      heading: "The deliberate endless loop",
      body: [
        "`while (true)` is not a mistake when the exit condition cannot be evaluated at the top.",
        "The pattern is: do some work, then decide whether to continue. That is the `do-while` shape, and in Python — which has no `do-while` — `while True` with a `break` at the bottom is the idiomatic spelling.",
        "Legitimate uses: refining an estimate until it converges, retrying until success, reading until a sentinel value, and any loop whose exit depends on something computed inside the body.",
        "The rule that keeps it safe: **a `while True` must contain a `break`, and you should be able to point at it.** If the exit is buried three levels deep in conditionals, extract the loop into a function and `return` instead.",
      ],
      examples: [
        {
          id: "deliberate",
          title: "Converging on a square root",
          lang: "python",
          code: `def sqrt_newton(x):
    guess = x / 2
    passes = 0

    while True:
        passes += 1
        better = (guess + x / guess) / 2
        if abs(better - guess) < 1e-12:
            break
        guess = better

    return round(better, 6), passes


for x in (2, 16, 1000):
    value, passes = sqrt_newton(x)
    print(f"sqrt({x:>4}) = {value:<10} in {passes} passes")`,
          output: `sqrt(   2) = 1.414214   in 6 passes
sqrt(  16) = 4.0        in 6 passes
sqrt(1000) = 31.622777  in 9 passes
`,
          explanation:
            "The exit condition needs `better`, which does not exist until the body has run once — so it cannot be tested at the top and `while True` is the honest shape. Note the termination argument is different in kind here: it is not a decreasing integer but a converging sequence, which is why a safety counter is a reasonable addition in production code even when the mathematics says it converges.",
        },
      ],
    },
    {
      id: "module-close",
      heading: "Closing the control-flow module",
      body: [
        "Eight lessons on branching and repetition, which between them are most of what a program does.",
        "The through-line worth keeping: **a loop is only as trustworthy as the two sentences you can say about it.** The invariant says what it knows so far; the termination measure says why it stops. A loop with both is one you can defend on a whiteboard; a loop with neither is one you adjusted until the tests passed.",
        "Next is pattern printing, which is nothing but nested loops with immediate visual feedback — the fastest way to make everything in this module automatic.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you prove a loop terminates?",
      answer:
        "Name a non-negative integer quantity that strictly decreases on every pass. Since it cannot decrease forever, the loop must end. For a counted loop it is `n - i`; for binary search and two pointers it is `hi - lo`; for the Euclidean algorithm it is `b`, which decreases because `a % b` is always less than `b`. If you cannot name such a quantity, that is a warning rather than a formality — it usually means some branch makes no progress.",
    },
    {
      question: "Why does a binary search sometimes loop forever?",
      answer:
        "Because a branch fails to shrink the range. With an exclusive `hi` and `while lo < hi`, writing `lo = mid` instead of `lo = mid + 1` hangs: when `lo` and `hi` are adjacent, `mid` equals `lo`, so the assignment changes nothing and the measure `hi - lo` does not decrease. It only shows up for targets that are absent or between elements, which is why binary search must be tested with a target below everything, above everything, and in a gap.",
    },
    {
      question: "When is `while (true)` the right thing to write?",
      answer:
        "When the exit condition cannot be evaluated before the body has run — refining an estimate until it converges, retrying until success, reading until a sentinel. It is the `do-while` shape, and in Python, which has no `do-while`, it is the idiom. The discipline is that the loop must contain a `break` you can point at; if the exit is buried in nested conditionals, the loop should become a function that returns instead.",
    },
  ],
  takeaways: [
    "Four causes: nothing advances, the advance is skipped, the condition can never be false, progress is not guaranteed",
    "`while (i != n)` steps over its target when the stride does not divide the gap; prefer `<`",
    "Prove termination by naming a non-negative quantity that strictly decreases each pass",
    "For binary search and two pointers that quantity is `hi - lo`",
    "`lo = mid` instead of `lo = mid + 1` hangs once `lo` and `hi` are adjacent",
    "Test binary search with a target below, above, and between the elements",
    "`while True` is right when the exit depends on work done inside the body",
    "A loop is as trustworthy as its invariant and its termination measure",
  ],
};
