import type { Lesson } from "@/content/types";

export const floatingPointLesson: Lesson = {
  id: "dsa-math-floats",
  slug: "floating-point-and-epsilon",
  moduleSlug: "number-systems-and-maths",
  title: "Floating Point, Epsilon & When Not to Use Doubles",
  summary:
    "Why 0.1 + 0.2 is not 0.3, how to compare floats correctly, and the three techniques that let you avoid them entirely.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Explain why some decimals cannot be represented in binary floating point",
    "Compare floating-point values with an epsilon, absolute and relative",
    "Recognise the 2⁵³ boundary where doubles stop counting integers",
    "Restructure a computation to avoid floating point altogether",
  ],
  sections: [
    {
      id: "why-inexact",
      heading: "Why 0.1 + 0.2 is not 0.3",
      body: [
        "A `double` stores a number as a sign, a base-2 exponent and a 52-bit binary fraction. Everything it holds is therefore a sum of powers of two.",
        "0.5, 0.25 and 0.75 are exact, because they are ½, ¼ and ½ + ¼. **0.1 is not**, because 1/10 in binary is a repeating fraction — the same way 1/3 in decimal is 0.333… and never terminates.",
        "So the stored value is the nearest representable one, slightly off, and the errors accumulate. `0.1 + 0.2` lands one ulp above 0.3, and the equality test fails.",
        "This is not a bug in any language. It is the IEEE 754 standard doing what it was designed to do, and it behaves identically in Python, Java, C and JavaScript.",
      ],
      examples: [
        {
          id: "inexact",
          title: "The stored values, printed to twenty places",
          lang: "python",
          code: `print(0.1 + 0.2)
print(0.1 + 0.2 == 0.3)
print(f"{0.1:.20f}")
print(f"{0.1 + 0.2:.20f}")
print(0.1 + 0.2 - 0.3)

print()
total = 0.0
for _ in range(10):
    total += 0.1
print("ten tenths:", total, total == 1.0)

print()
print("exactly representable:", 0.5 + 0.25 == 0.75)
print("2**53 boundary:", 2.0 ** 53, 2.0 ** 53 + 1 == 2.0 ** 53)
print("large integers collapse:", float(2 ** 53 + 1) == float(2 ** 53))`,
          output: `0.30000000000000004
False
0.10000000000000000555
0.30000000000000004441
5.551115123125783e-17

ten tenths: 0.9999999999999999 False

exactly representable: True
2**53 boundary: 9007199254740992.0 True
large integers collapse: True`,
          explanation:
            "0.1 is really 0.100000000000000005551…, and the error compounds: ten of them add up to 0.9999999999999999, not 1. Meanwhile 0.5 + 0.25 is exact, which is the tell — powers of two work perfectly and tenths do not. The last two lines are the other boundary, covered below.",
        },
      ],
    },
    {
      id: "the-53-bit-boundary",
      heading: "The 2⁵³ boundary",
      body: [
        "A double has 52 stored fraction bits plus an implied leading 1, giving 53 bits of precision. So it represents **every integer up to 2⁵³ exactly, and not all of them past that.**",
        "2⁵³ is 9,007,199,254,740,992 — about 9 × 10¹⁵. Past it, `x + 1 == x` becomes true, because the gap between representable values is now 2.",
        "This matters more than it sounds. A `long` holds integers up to 9.2 × 10¹⁸, a thousand times further. So **converting a long to a double silently loses precision** for large values, which is how a running total in a double ends up wrong when the same total in a long would have been exact.",
        "It is also why `Math.pow` failed in the last lesson, and why JavaScript — which has only doubles — added `BigInt`.",
      ],
      examples: [
        {
          id: "java-floats",
          title: "Java: the same behaviour, plus infinities and NaN",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        System.out.println(0.1 + 0.2);
        System.out.println(0.1 + 0.2 == 0.3);
        System.out.println(0.1f + 0.2f);

        System.out.println(1.0 / 0);
        System.out.println(-1.0 / 0);
        System.out.println(0.0 / 0);
        System.out.println(Double.NaN == Double.NaN);
        System.out.println(Double.isNaN(0.0 / 0));

        System.out.println((int) 2.99);
        System.out.println(Math.round(2.5) + " " + Math.round(-2.5) + " " + Math.round(3.5));
    }
}`,
          output: `0.30000000000000004
false
0.3
Infinity
-Infinity
NaN
false
true
2
3 -2 4`,
          explanation:
            "Four things worth noting. `float` prints 0.3 only because it has too few digits to show the error — the error is still there. Dividing a double by zero gives Infinity rather than throwing, unlike integer division. **`NaN` is not equal to itself**, so you must test with `isNaN`; an `==` check silently answers false forever. And casting truncates toward zero while `Math.round` rounds half up, which is why 2.99 becomes 2.",
        },
        {
          id: "rounding-differs",
          title: "The two languages round differently",
          lang: "python",
          code: `print("Python's round:", round(2.5), round(-2.5), round(3.5), round(0.5))
print("truncation    :", int(2.99), int(-2.99))
print()
print("Python uses banker's rounding: halves go to the nearest EVEN number")
print("  2.5 -> 2 (2 is even), 3.5 -> 4 (4 is even)")
print("Java's Math.round uses half-up: 2.5 -> 3, 3.5 -> 4, -2.5 -> -2")`,
          output: `Python's round: 2 -2 4 0
truncation    : 2 -2

Python uses banker's rounding: halves go to the nearest EVEN number
  2.5 -> 2 (2 is even), 3.5 -> 4 (4 is even)
Java's Math.round uses half-up: 2.5 -> 3, 3.5 -> 4, -2.5 -> -2`,
          explanation:
            "`round(2.5)` is 2 in Python and 3 in Java. Python uses banker's rounding, which sends exact halves to the nearest even number so that rounding a large set of values does not drift upward; Java's `Math.round` adds 0.5 and takes the floor. A solution ported between the two can differ by one on exactly the boundary values a test case will choose.",
        },
      ],
      pitfalls: [
        {
          title: "`NaN` breaks sorting and equality",
          body: "`NaN` compares false against everything including itself, so a list containing one can produce a sort order that is not a valid ordering — and in Java, `Arrays.sort` on doubles has special handling while a custom comparator returning inconsistent results can throw \"Comparison method violates its general contract\". If a computation can produce NaN, filter it before comparing anything.",
        },
      ],
    },
    {
      id: "epsilon",
      heading: "Comparing correctly",
      body: [
        "Never compare floats with `==`. Compare the **magnitude of their difference against a tolerance**.",
        "**Absolute epsilon:** `abs(a - b) <= 1e-9`. Simple, and right when the values are known to be near a modest scale.",
        "**Relative epsilon:** `abs(a - b) <= eps * max(abs(a), abs(b))`. Right when the scale varies, because an absolute tolerance of 1e-9 is meaningless next to values of 10¹⁶, where the smallest possible gap is already 2.",
        "Python's `math.isclose` does both at once — relative by default with an absolute floor — and is what you should reach for. Java has no equivalent in the standard library, so you write it.",
        "Interview problems that involve floats usually state a tolerance, typically 10⁻⁵ or 10⁻⁶. Read it; it tells you which comparison they expect.",
      ],
      examples: [
        {
          id: "epsilon",
          title: "Absolute against relative",
          lang: "python",
          code: `import math


def close(a, b, eps=1e-9):
    return abs(a - b) <= eps


print("naive  :", 0.1 + 0.2 == 0.3)
print("epsilon:", close(0.1 + 0.2, 0.3))
print("isclose:", math.isclose(0.1 + 0.2, 0.3))

print()
print("absolute epsilon fails on large values:")
a, b = 1e16, 1e16 + 2.0
print("  a =", a, " b =", b, " differ by", b - a)
print("  close(a, b) with 1e-9:", close(a, b))
print("  math.isclose(a, b)   :", math.isclose(a, b))
print("  relative difference  :", abs(a - b) / abs(b))`,
          output: `naive  : False
epsilon: True
isclose: True

absolute epsilon fails on large values:
  a = 1e+16  b = 1.0000000000000002e+16  differ by 2.0
  close(a, b) with 1e-9: False
  math.isclose(a, b)   : True
  relative difference  : 1.9999999999999997e-16
`,
          explanation:
            "At 10¹⁶ the two values are **adjacent representable doubles** — there is nothing between them — and yet the absolute test calls them different because they differ by 2, which is far more than 1e-9. The relative difference is 2 × 10⁻¹⁶, which is the correct measure of \"as close as a double can get\". This is why a fixed absolute epsilon is not a general answer.",
        },
      ],
    },
    {
      id: "avoiding",
      heading: "Avoiding floats entirely",
      body: [
        "The best fix is usually to not use them. Three techniques cover nearly every case in interview problems.",
        "**Scale to integers.** Money in cents rather than pounds; times in milliseconds rather than seconds. All arithmetic becomes exact, and you divide only for display.",
        "**Cross-multiply instead of dividing.** To compare a/b against c/d, compare a×d against c×b. No division, no rounding, exactly correct — and this is how you compare slopes, averages and ratios in a problem. Watch the sign of the denominators, since multiplying an inequality by a negative flips it.",
        "**Use a decimal type when the decimals are the point.** `Decimal` in Python, `BigDecimal` in Java. They store base-10 digits, so 0.1 is exact. They are slower and are the correct answer for money.",
        "The habit worth building: when a float appears in a solution, ask whether the problem actually requires one. Very often the answer is no, and removing it removes an entire class of bug.",
      ],
      examples: [
        {
          id: "avoiding",
          title: "Scaling, cross-multiplying, and Decimal",
          lang: "python",
          code: `from decimal import Decimal

print("float  :", 0.1 + 0.2)
print("Decimal:", Decimal("0.1") + Decimal("0.2"))
print("cents  :", 10 + 20, "cents, divided only for display:", (10 + 20) / 100)

print()
print("comparing two averages without dividing:")
a_sum, a_count = 7, 3
b_sum, b_count = 5, 2
print("  as floats     :", a_sum / a_count, "<", b_sum / b_count, "->",
      a_sum / a_count < b_sum / b_count)
print("  cross-multiply:", a_sum * b_count, "<", b_sum * a_count, "->",
      a_sum * b_count < b_sum * a_count)

print()
print("comparing slopes exactly (collinearity):")
points = [(0, 0), (2, 4), (3, 6)]
(x1, y1), (x2, y2), (x3, y3) = points
print("  cross product:", (y2 - y1) * (x3 - x1) - (y3 - y1) * (x2 - x1))
print("  collinear    :", (y2 - y1) * (x3 - x1) == (y3 - y1) * (x2 - x1))`,
          output: `float  : 0.30000000000000004
Decimal: 0.3
cents  : 30 cents, divided only for display: 0.3

comparing two averages without dividing:
  as floats     : 2.3333333333333335 < 2.5 -> True
  cross-multiply: 14 < 15 -> True

comparing slopes exactly (collinearity):
  cross product: 0
  collinear    : True`,
          explanation:
            "All three techniques in one place. The collinearity check is the one worth memorising — comparing slopes as `(y2-y1)/(x2-x1)` fails on precision *and* divides by zero for a vertical line, while the cross-product form is exact in integers and has no special cases at all. That is the general pattern: **rearrange the division away and the problem gets simpler, not harder.**",
        },
      ],
      pitfalls: [
        {
          title: "`Decimal(0.1)` against `Decimal(\"0.1\")`",
          body: "Passing a float constructs the Decimal from the already-inexact binary value, so `Decimal(0.1)` is 0.1000000000000000055511151231257827021181583404541015625. Passing a string parses the decimal digits directly and is exact. Always construct decimals from strings — the same trap exists with Java's `new BigDecimal(0.1)` against `BigDecimal.valueOf(0.1)`.",
        },
      ],
    },
    {
      id: "module-close",
      heading: "Closing the module",
      body: [
        "That is the numeric toolkit. Bases and two's complement explain how values are stored; digits, divisors, GCD, powers and modular arithmetic are the operations that appear inside problems; and this lesson is the standing warning about the one representation that lies.",
        "**The through-line:** integers are exact and bounded, floats are inexact and vast. Every technique in this module — the √n bound, running modular reduction, cross-multiplication, exponentiation by squaring — exists to keep exact integer arithmetic inside its bounds rather than escaping to floats.",
        "Two modules remain in this track. Next is a tour of the data structures themselves, and then complexity analysis, which is the vocabulary for everything after.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why is 0.1 + 0.2 not equal to 0.3?",
      answer:
        "A double stores a binary fraction, so it can represent only sums of powers of two exactly. 1/10 in binary repeats forever, exactly as 1/3 does in decimal, so 0.1 is stored as the nearest representable value — about 0.10000000000000000555 — and the errors compound. The sum lands one step above 0.3 and the equality fails. It is IEEE 754 behaving as specified, identical in Python, Java, C and JavaScript, so the fix is to compare with a tolerance rather than to switch languages.",
    },
    {
      question: "How should you compare two floating-point values?",
      answer:
        "By the magnitude of their difference against a tolerance, never with `==`. An absolute epsilon — `abs(a - b) <= 1e-9` — is fine when the values are near a known modest scale. A relative one — scaling the tolerance by the larger magnitude — is needed when the scale varies, because at 10¹⁶ two *adjacent* doubles differ by 2, so any absolute tolerance below that calls them unequal. `math.isclose` does both; in Java you write it yourself. And remember NaN compares false against everything including itself.",
    },
    {
      question: "How would you compare two fractions without floating point?",
      answer:
        "Cross-multiply: a/b against c/d becomes a×d against c×b, which is exact in integers, has no rounding, and no division-by-zero case. The same idea gives the collinearity test — compare `(y2-y1)*(x3-x1)` with `(y3-y1)*(x2-x1)` rather than two slopes, which additionally handles vertical lines for free. Watch the signs, since multiplying an inequality through by a negative denominator flips it.",
    },
  ],
  takeaways: [
    "A double holds sums of powers of two, so 0.1 is stored inexactly and errors compound",
    "Doubles are exact for integers only up to 2⁵³ ≈ 9 × 10¹⁵ — a long reaches a thousand times further",
    "Dividing a double by zero gives Infinity; `NaN` is not equal to itself, so test with `isNaN`",
    "Casting truncates toward zero; Python rounds halves to even and Java rounds them up",
    "Compare with a tolerance — relative when the scale varies, since adjacent doubles at 10¹⁶ differ by 2",
    "Scale money and times to integers and divide only for display",
    "Cross-multiply instead of dividing: exact, and it removes the divide-by-zero case",
    "Construct decimals from strings — `Decimal(0.1)` inherits the float's error",
  ],
};
