import type { Lesson } from "@/content/types";

export const realValuedLesson: Lesson = {
  id: "dsa-bs-real",
  slug: "real-valued-answers-and-precision",
  moduleSlug: "binary-search",
  title: "Real-Valued Answers & Precision",
  summary:
    "When the answer is a double rather than an integer, `lo < hi` never becomes false and the loop can spin forever. The fix is to stop asking whether you have converged and start counting iterations.",
  estimatedMinutes: 25,
  objectives: [
    "Binary search a continuous range",
    "Explain why a tolerance test can fail to terminate",
    "Choose a fixed iteration count from the required precision",
    "Avoid the equality and subtraction traps with floats",
  ],
  sections: [
    {
      id: "the-difference",
      heading: "Integers terminate for free; reals do not",
      body: [
        "With integers, `lo = mid + 1` guarantees progress and the window eventually empties. There is no `mid + 1` in the reals — `mid` is strictly between `lo` and `hi`, so the window shrinks but **never becomes empty**. `while lo < hi` would run until the two are adjacent floating-point values, and sometimes not even then.",
        "So the loop condition has to change. There are two options and only one of them is safe.",
      ],
      examples: [
        {
          id: "real-bisect",
          title: "Fixed iterations, and the tolerance loop that hangs",
          lang: "python",
          code: `# Binary search when the answer is a real number.

def sqrt_bisect(x, iterations=60):
    lo, hi = 0.0, max(1.0, x)
    for _ in range(iterations):
        mid = (lo + hi) / 2
        if mid * mid < x:
            lo = mid
        else:
            hi = mid
    return lo

for x in (2, 10, 0.25):
    print(f"sqrt({x}) = {sqrt_bisect(x):.10f}   (math: {x ** 0.5:.10f})")

# Why a fixed iteration count beats a tolerance test.
print("\\ninterval width after k halvings, starting from 10:")
for k in (10, 30, 50, 60, 100):
    print(f"  k={k:3}: 10 * 2^-{k} = {10 * 2.0 ** -k:.3e}")

# A tolerance loop can spin forever once the gap is below float resolution.
def dangerous(x, eps=1e-18, budget=200):
    lo, hi = 0.0, max(1.0, x)
    spins = 0
    while hi - lo > eps:
        spins += 1
        if spins > budget:
            return f"gave up after {budget} spins, gap still {hi - lo:.3e}"
        mid = (lo + hi) / 2
        if mid * mid < x:
            lo = mid
        else:
            hi = mid
    return f"converged in {spins} spins"

print("\\ntolerance 1e-18 on sqrt(2):", dangerous(2))
print("tolerance 1e-9  on sqrt(2):", dangerous(2, eps=1e-9))`,
          output: `sqrt(2) = 1.4142135624   (math: 1.4142135624)
sqrt(10) = 3.1622776602   (math: 3.1622776602)
sqrt(0.25) = 0.5000000000   (math: 0.5000000000)

interval width after k halvings, starting from 10:
  k= 10: 10 * 2^-10 = 9.766e-03
  k= 30: 10 * 2^-30 = 9.313e-09
  k= 50: 10 * 2^-50 = 8.882e-15
  k= 60: 10 * 2^-60 = 8.674e-18
  k=100: 10 * 2^-100 = 7.889e-30

tolerance 1e-18 on sqrt(2): gave up after 200 spins, gap still 2.220e-16
tolerance 1e-9  on sqrt(2): converged in 31 spins`,
          explanation:
            "The last two lines are the lesson. With a tolerance of `1e-18` the loop **never finishes**: the gap bottoms out at `2.22e-16`, which is the spacing between adjacent doubles near 1.4, and halving it again produces the same two numbers. Without the spin budget that program hangs. The same loop with a realistic `1e-9` converges in 31 iterations.\n\nThe table above it is how to pick the count instead. Each iteration halves the interval, so after k halvings the width is `(hi - lo) · 2^-k`. Solve for the precision you need and round up — 60 iterations takes a range of 10 down to `8.7e-18`, past double precision, which is why 100 is a common safe default and costs nothing.",
        },
      ],
    },
    {
      id: "practice",
      heading: "In practice",
      body: [
        "**Use a `for` loop with a fixed count.** 100 iterations is free — it is a hundred evaluations of the predicate, and it terminates unconditionally. This is what competitive programmers do, and the reason is exactly the failure above.",
        "**If you must use a tolerance, make it relative.** `hi - lo > eps * max(1.0, abs(lo))` scales with the magnitude, so it behaves for answers near 10⁹ as well as near zero. An absolute `1e-9` on an answer of a billion asks for sixteen significant digits, which a double does not have.",
        "**Do not test floats for equality.** There is no `a[mid] == target` branch in a real-valued search, and adding one is pointless — it will essentially never fire.",
      ],
      pitfalls: [
        {
          title: "`(lo + hi) / 2` is fine for floats and wrong for integers",
          body: "The overflow-safe form matters for ints. For doubles, `(lo + hi) / 2` is actually *more* accurate than `lo + (hi - lo) / 2` in the common case, and overflow only matters near 1e308. This is the one place the integer advice does not carry over.",
        },
        {
          title: "Read the required precision from the problem",
          body: "Statements say things like \"answers within 1e-6 of the expected value are accepted\". That is the number to aim at, and it tells you the iteration count directly. Aiming at 1e-15 when 1e-6 is accepted is harmless; aiming at 1e-6 when 1e-9 is required fails every test.",
        },
      ],
    },
  ],
  takeaways: [
    "A real-valued window shrinks forever but never empties",
    "Use a fixed iteration count, not a convergence test",
    "A tolerance below double epsilon makes the loop hang, not merely run long",
    "Each iteration halves the width: pick k from `(hi - lo) · 2^-k < precision`",
    "100 iterations is free and unconditionally safe",
    "Prefer a relative tolerance if you use one at all",
  ],
  status: "available",
};
