import type { Lesson } from "@/content/types";

export const floatingPointLesson: Lesson = {
  id: "dsa-io-floating-point",
  slug: "floating-point",
  moduleSlug: "input-output-and-data-types",
  title: "Floating Point: Why 0.1 + 0.2 Is Not 0.3",
  summary:
    "What a double can and cannot represent, why comparing two of them with `==` is a bug, and the four situations where the right move is to avoid them entirely.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Explain why some decimal fractions cannot be stored exactly",
    "Compare floating-point values correctly, with an absolute or relative tolerance",
    "Identify the point at which a double stops representing every integer",
    "Restructure a computation to avoid floating point altogether",
  ],
  sections: [
    {
      id: "the-demonstration",
      heading: "The demonstration",
      body: [
        "Both languages give the same answer, because both implement the same standard — IEEE 754. This is not a bug in either.",
      ],
      examples: [
        {
          id: "the-classic",
          title: "The classic, with the digits shown",
          lang: "python",
          code: `print(0.1 + 0.2)
print(0.1 + 0.2 == 0.3)
print(f"{0.1 + 0.2:.20f}")
print(0.1 + 0.2 - 0.3)`,
          output: `0.30000000000000004
False
0.30000000000000004441
5.551115123125783e-17`,
          explanation:
            "The third line is the one that explains the other three: printed to twenty places, the stored value is visibly not 0.3. And the fourth line names the size of the problem — the leftover after subtracting 0.3 is about 5.6 × 10⁻¹⁷, not zero. That number is tiny, which is why a tolerance works, and it is *not* zero, which is why `==` does not.",
        },
      ],
    },
    {
      id: "why",
      heading: "Why this happens",
      body: [
        "A `double` stores a number in binary, as a sign, an exponent and a fixed number of significant bits — 53 of them. The question is which decimal fractions can be written exactly in that form.",
        "In base 10, one third cannot: 0.3333... never terminates. In base 2 the same problem applies to different fractions, and **one tenth is one of them**. `0.1` in binary is a repeating expansion, so storing it means cutting it off after 53 bits and keeping a value that is very slightly not one tenth.",
        "Add two slightly-wrong values and the errors do not cancel. Print the result to 20 decimal places, as above, and you can see exactly what was stored.",
        "The fractions that *are* exact are the ones whose denominator is a power of two: 0.5, 0.25, 0.75, 0.125. Everything else is an approximation, including every value you get from dividing by 3, 7 or 10.",
      ],
    },
    {
      id: "comparing",
      heading: "Comparing correctly",
      body: [
        "**Never use `==` on two computed floating-point values.** The rule has one narrow exception — comparing against a value you literally assigned and never did arithmetic on — and it is not worth the exception.",
        "Instead, compare the difference against a tolerance, usually called epsilon. Two forms are useful.",
        "**Absolute tolerance:** `abs(a - b) < 1e-9`. Correct when the values are of known, modest size. This is what competitive programming problems mean when they say \"answers within 10⁻⁶ are accepted\".",
        "**Relative tolerance:** `abs(a - b) <= 1e-9 * max(abs(a), abs(b))`. Correct when the values might be enormous, where an absolute difference of 10⁻⁹ is unachievable. Python's `math.isclose` does this for you, with a sensible default.",
      ],
      examples: [
        {
          id: "epsilon",
          title: "Three ways to compare, one of them wrong",
          lang: "python",
          code: `import math

a = 0.1 + 0.2
b = 0.3

print("equality  :", a == b)
print("absolute  :", abs(a - b) < 1e-9)
print("isclose   :", math.isclose(a, b))

big1 = 1e16
big2 = 1e16 + 1
print("big equal :", big1 == big2)
print("big abs   :", abs(big1 - big2) < 1e-9)
print("big close :", math.isclose(big1, big2))`,
          output: `equality  : False
absolute  : True
isclose   : True
big equal : True
big abs   : True
big close : True`,
          explanation:
            "The `big` block is the part that should worry you. `1e16` and `1e16 + 1` compare as *equal* — adding one to a double that large changes nothing at all, because the gap between representable values there is bigger than 1. That is not a comparison problem you can fix with a tolerance; it is a representation problem, and the answer is not to be using doubles for those values.",
        },
      ],
      pitfalls: [
        {
          title: "Using an absolute epsilon on large values",
          body: "`abs(a - b) < 1e-9` is meaningless once the values are around 10¹⁶, because consecutive representable doubles are further apart than that. It will report equal for genuinely different numbers, as above. Use a relative tolerance, or get out of floating point.",
        },
      ],
    },
    {
      id: "the-integer-limit",
      heading: "Where doubles stop counting",
      body: [
        "With 53 bits of significand, a `double` represents every integer exactly up to 2⁵³ — which is 9,007,199,254,740,992, about 9 × 10¹⁵. Past that, it can no longer represent consecutive integers, and it starts skipping.",
        "This is the single most important practical fact about doubles for problem solving, because constraints of 10¹⁸ are entirely normal, and a `long` handles them exactly while a `double` does not.",
      ],
      examples: [
        {
          id: "two-53",
          title: "The point where counting breaks",
          lang: "python",
          code: `limit = 2 ** 53
print(limit)
print(float(limit) == float(limit + 1))
print(float(limit + 1) == float(limit + 2))

print(int(float(10 ** 17)))
print(10 ** 17)`,
          output: `9007199254740992
True
False
100000000000000000
100000000000000000`,
          explanation:
            "At 2⁵³ the doubles for n and n + 1 are the same value — the type has run out of resolution and consecutive integers collide. Note the second comparison is `False`, because past this point doubles represent only even integers, so n + 1 and n + 2 land on different ones. Any computation that needs exactness above 9 × 10¹⁵ must use integers.",
        },
      ],
    },
    {
      id: "avoiding",
      heading: "Four times to avoid floating point entirely",
      body: [
        "The most reliable way to get floating point right is not to use it. Four situations come up constantly and all four have integer answers.",
        "**Money.** Never store currency in a double. Store the number of the smallest unit — paise, cents — as an integer, and format for display.",
        "**Comparing ratios.** Instead of `a / b > c / d`, cross-multiply to `a * d > c * b`. Exact, no division, no epsilon. Watch for overflow and for the sign of the denominators.",
        "**Averages, when you can defer the division.** \"Is the average above k?\" is `sum > k * n`, which is integer arithmetic. Divide only when a fractional answer is actually being printed.",
        "**Ceilings and midpoints.** As the previous module covered: `(a + b - 1) / b` rather than `Math.ceil((double) a / b)`.",
        "The pattern in all four is the same — the floating point was introduced by a division, and the division can usually be moved to the end or removed.",
      ],
      examples: [
        {
          id: "cross-multiply",
          title: "Cross-multiplying instead of dividing",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int a = 1, b = 3, c = 2, d = 6;

        System.out.println("as doubles : " + ((double) a / b > (double) c / d));
        System.out.println("equal?     : " + ((double) a / b == (double) c / d));
        System.out.println("cross      : " + ((long) a * d > (long) c * b));
        System.out.println("cross equal: " + ((long) a * d == (long) c * b));
    }
}`,
          output: `as doubles : false
equal?     : true
cross      : false
cross equal: true`,
          explanation:
            "One third and two sixths are the same number, and here the doubles happen to agree — but only because both divisions produce the same rounding error. Change the numbers and they will not. The cross-multiplied version compares `1 × 6` against `2 × 3` and is exactly right by construction, with no rounding anywhere. The casts to `long` are there because the products can overflow even when the inputs are small.",
        },
      ],
    },
    {
      id: "float-vs-double",
      heading: "`float` against `double`",
      body: [
        "Java has both. `float` is 32 bits with 24 significant bits — about 7 decimal digits — and `double` is 64 with 53, about 15 digits.",
        "**Use `double`. Always.** `float` saves four bytes you do not need and loses half your precision. Problems that specify a tolerance of 10⁻⁶ are already at the edge of what a `float` can express, so the saving buys you a wrong answer.",
        "Python has no `float` in the 32-bit sense — its `float` is a C double, so this distinction does not arise.",
      ],
      examples: [
        {
          id: "float-precision",
          title: "The precision you give up",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        System.out.println(0.1f + 0.2f);
        System.out.println(0.1 + 0.2);
        System.out.println(1.0f / 3);
        System.out.println(1.0 / 3);
    }
}`,
          output: `0.3
0.30000000000000004
0.33333334
0.3333333333333333`,
          explanation:
            "The first line looks *better* and is worse. `0.1f + 0.2f` prints `0.3` not because it is exact but because a `float` has so few digits that the error falls off the end of the printed representation — the error is still there, it is just larger and hidden. One third shows the truth: seven or eight digits against sixteen.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why is `0.1 + 0.2 == 0.3` false?",
      answer:
        "Because doubles store values in binary with a fixed 53 significant bits, and one tenth has no finite binary representation — like one third in decimal. Both `0.1` and `0.2` are stored as values very slightly off, and the errors do not cancel, so the sum is 0.30000000000000004 rather than 0.3. It is not a language bug; both Java and Python implement IEEE 754 and give the same result. The fix is to compare with a tolerance rather than for equality.",
    },
    {
      question: "How do you compare two floating-point numbers?",
      answer:
        "With a tolerance. For values of known modest size, `abs(a - b) < 1e-9`. For values that might be large, a relative tolerance — `abs(a - b) <= eps * max(abs(a), abs(b))` — because an absolute difference below 10⁻⁹ is unachievable once the values are around 10¹⁶, where consecutive representable doubles are further apart than that. Python's `math.isclose` implements the relative form with sensible defaults.",
    },
    {
      question: "When would you deliberately avoid floating point?",
      answer:
        "Money, which should be stored as an integer count of the smallest unit. Comparing ratios, where cross-multiplying — `a * d > c * b` instead of `a / b > c / d` — is exact. Threshold questions about an average, where `sum > k * n` avoids the division entirely. And ceilings, where `(a + b - 1) / b` beats `Math.ceil` on a cast. In each case the floating point was introduced by a division that can be deferred or removed.",
    },
  ],
  takeaways: [
    "Doubles store binary fractions; one tenth has no exact binary form, so 0.1 + 0.2 is 0.30000000000000004",
    "Only fractions with a power-of-two denominator are exact: 0.5, 0.25, 0.125",
    "Never compare computed doubles with `==`; use an absolute or relative tolerance",
    "An absolute epsilon is meaningless on huge values — `1e16` and `1e16 + 1` are the same double",
    "Doubles represent every integer exactly only up to 2⁵³, about 9 × 10¹⁵",
    "Avoid floating point for money, ratio comparisons, average thresholds and ceilings",
    "Cross-multiply instead of dividing: `a * d > c * b`, watching for overflow",
    "Use `double`, never `float` — `float` hides its larger error rather than avoiding it",
  ],
};
