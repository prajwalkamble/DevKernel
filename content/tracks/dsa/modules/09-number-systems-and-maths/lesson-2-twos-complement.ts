import type { Lesson } from "@/content/types";

export const twosComplementLesson: Lesson = {
  id: "dsa-math-twos-complement",
  slug: "twos-complement-and-integer-limits",
  moduleSlug: "number-systems-and-maths",
  title: "Two's Complement & Integer Limits",
  summary:
    "How a negative number is stored, why the range is lopsided, and the overflow bugs that follow — including the one in almost everyone's first binary search.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Explain how two's complement represents negative numbers",
    "State the range of a 32-bit and a 64-bit signed integer from memory",
    "Recognise overflow and write the midpoint formula that avoids it",
    "Know which of the two languages can overflow at all, and why",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "The problem two's complement solves",
      body: [
        "A fixed-width integer is just a bit pattern. Nothing in eight bits says whether `11111011` means 251 or −5; that is a decision about interpretation, and the machine has to pick one scheme.",
        "The obvious scheme — reserve the top bit for a sign — turns out badly. It gives two zeros (`00000000` and `10000000`), and addition needs to check the signs and branch, which means extra hardware for the most common operation there is.",
        "**Two's complement** is the scheme every modern machine actually uses. A negative number −x is stored as the pattern for 2ⁿ − x. The result is one zero, and — the real prize — **addition, subtraction and comparison work on the raw patterns with no sign handling at all.** The same adder circuit handles signed and unsigned.",
      ],
      examples: [
        {
          id: "patterns",
          title: "The eight-bit patterns",
          lang: "python",
          code: `def bits(n, width=8):
    return format(n & (2 ** width - 1), f"0{width}b")


print("  n   unsigned pattern (8 bits)")
for n in (0, 1, 5, 127, -1, -5, -128):
    print(f"{n:>5}   {bits(n)}")

print()
print("negation is invert-and-add-one:")
five = 0b00000101
inverted = ~five & 0xFF
print("   5 =", bits(five))
print("  ~5 =", bits(inverted), "(inverted)")
print("  +1 =", bits(inverted + 1), "= -5")
print("check:", (inverted + 1) - 256)`,
          output: `  n   unsigned pattern (8 bits)
    0   00000000
    1   00000001
    5   00000101
  127   01111111
   -1   11111111
   -5   11111011
 -128   10000000

negation is invert-and-add-one:
   5 = 00000101
  ~5 = 11111010 (inverted)
  +1 = 11111011 = -5
check: -5`,
          explanation:
            "The rule for negating is **invert every bit and add one**, and that is exactly how the hardware does it. Note −1 is all ones, which is worth memorising — it is why `~0` is −1 and why an all-ones mask is written as `-1` in some code. The `& 0xFF` in `bits` is needed because Python's integers have no width; the mask is what forces a fixed-width view.",
        },
      ],
    },
    {
      id: "the-lopsided-range",
      heading: "Why the range is lopsided",
      body: [
        "A 32-bit signed integer runs from **−2,147,483,648 to 2,147,483,647** — that is −2³¹ to 2³¹ − 1. There is one more negative value than positive, and the reason falls straight out of the representation.",
        "Thirty-two bits give 2³² patterns. One of them is zero. Zero counts as neither positive nor negative but it uses up a pattern from the non-negative half, so the positives get 2³¹ − 1 and the negatives get the full 2³¹.",
        "This is not trivia. It means **`Math.abs(Integer.MIN_VALUE)` is negative**, because there is no positive value to return. It is one of the few places where a total-looking function silently lies.",
      ],
      examples: [
        {
          id: "range",
          title: "The range, and the asymmetry",
          lang: "python",
          code: `INT_MAX = 2 ** 31 - 1
INT_MIN = -2 ** 31
print("int range:", INT_MIN, "to", INT_MAX)
print("that is", INT_MAX - INT_MIN + 1, "values, which is 2**32 =", 2 ** 32)
print("one more negative than positive:", -INT_MIN - INT_MAX)

lo, hi = 2_000_000_000, 2_100_000_000
print()
print("lo + hi     =", lo + hi, "which is above INT_MAX:", lo + hi > INT_MAX)
print("safe midpoint lo + (hi - lo) // 2 =", lo + (hi - lo) // 2)
print("both formulas agree mathematically:", (lo + hi) // 2 == lo + (hi - lo) // 2)`,
          output: `int range: -2147483648 to 2147483647
that is 4294967296 values, which is 2**32 = 4294967296
one more negative than positive: 1

lo + hi     = 4100000000 which is above INT_MAX: True
safe midpoint lo + (hi - lo) // 2 = 2050000000
both formulas agree mathematically: True`,
          explanation:
            "The two midpoint formulas are algebraically identical and computationally are not — the first computes an intermediate value above `INT_MAX` and the second never leaves the range. Python's arbitrary-precision integers make both correct here, which is precisely why this bug is invisible in Python and real in Java.",
        },
      ],
      pitfalls: [
        {
          title: "`Math.abs(Integer.MIN_VALUE)` is negative",
          body: "It returns `Integer.MIN_VALUE` itself, because the positive counterpart does not exist. So does `-Integer.MIN_VALUE`. Any code that takes an absolute value and assumes the result is non-negative has a hole at exactly one input, and that input shows up in problems about reversing integers and about the closest value to zero.",
        },
      ],
    },
    {
      id: "overflow",
      heading: "Overflow, and where it actually bites",
      body: [
        "When a Java `int` operation produces a result outside the range, it does not throw. It **wraps around**, silently, because the high bits are simply discarded. `Integer.MAX_VALUE + 1` is `Integer.MIN_VALUE`.",
        "Three places this shows up in real code.",
        "**Binary search midpoints.** `(lo + hi) / 2` overflows when both are large, and the negative midpoint indexes out of range. Joshua Bloch famously found this bug in the JDK's own binary search after nine years. The fix is `lo + (hi - lo) / 2`.",
        "**Sums and products.** Summing an array of large ints into an `int` overflows; the fix is a `long` accumulator. Multiplying two ints and assigning to a `long` still overflows — the multiplication happens in `int` first, so you must cast one operand: `(long) a * b`.",
        "**Factorials and powers.** These leave the `int` range at 13! and the `long` range at 21!, which is why the competitive-programming answer is always modular arithmetic.",
      ],
      examples: [
        {
          id: "java-overflow",
          title: "Java: wrapping, silently",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        System.out.println(Integer.MAX_VALUE);
        System.out.println(Integer.MIN_VALUE);
        System.out.println(Integer.MAX_VALUE + 1);
        System.out.println(Math.abs(Integer.MIN_VALUE));
        System.out.println(-Integer.MIN_VALUE);
        System.out.println(Long.MAX_VALUE);
        System.out.println(Integer.toBinaryString(Integer.MIN_VALUE));
        System.out.println(Integer.MIN_VALUE / -1 == Integer.MIN_VALUE);
    }
}`,
          output: `2147483647
-2147483648
-2147483648
-2147483648
-2147483648
9223372036854775807
10000000000000000000000000000000
true`,
          explanation:
            "No exception, no warning, no trace. `MAX_VALUE + 1` wraps to `MIN_VALUE` because incrementing `01111...1` carries into the sign bit. `MIN_VALUE` is a one followed by thirty-one zeros — the single pattern with no positive twin, which is why the three lines about it all print the same wrong-looking value.",
        },
        {
          id: "java-midpoint",
          title: "The binary search bug, live",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int lo = 2_000_000_000, hi = 2_100_000_000;
        System.out.println("(lo + hi) / 2      = " + (lo + hi) / 2);
        System.out.println("lo + (hi - lo) / 2 = " + (lo + (hi - lo) / 2));
        System.out.println("with long          = " + (int) (((long) lo + hi) / 2));
    }
}`,
          output: `(lo + hi) / 2      = -97483648
lo + (hi - lo) / 2 = 2050000000
with long          = 2050000000`,
          explanation:
            "A negative array index, produced by a formula that looks obviously correct. `hi - lo` is small, so adding it to `lo` never leaves the range — that is the whole reason the second form is safe. Widening to `long` also works and is clearer when several values are being combined. Write the subtraction form by reflex in every binary search you ever write.",
        },
      ],
      pitfalls: [
        {
          title: "`long total = a * b;` with int operands",
          body: "The multiplication is done in `int` and overflows *before* the widening to `long`. Cast an operand first: `long total = (long) a * b;`. The declared type of the destination never affects how the right-hand side is evaluated, in Java or in C.",
        },
      ],
    },
    {
      id: "python-difference",
      heading: "Python does not have this problem",
      body: [
        "Python's `int` is **arbitrary precision**. It grows as needed and there is no maximum, so nothing on this page can overflow.",
        "That is a real advantage for solving problems — no midpoint bug, no factorial overflow, no cast dance — and it has two costs. Arithmetic on large values is slower than a machine word, and, more insidiously, **a solution that works in Python may be wrong when translated to Java**, because the overflow was never exercised.",
        "Which is exactly why this lesson exists in a Python-friendly track: if you solve in Python and interview in Java, or read editorial code in either, you need the failure mode in your head even though your own runs never hit it.",
        "The other side: when a problem *asks* for 32-bit behaviour — \"reverse an integer, return 0 if it overflows\" — Python has to simulate the limit by hand, comparing against 2³¹ − 1 explicitly. Java gets that check for free from the type.",
      ],
      examples: [
        {
          id: "python-unbounded",
          title: "Unbounded, and simulating the limit anyway",
          lang: "python",
          code: `print(2 ** 100)
print(len(str(2 ** 1000)), "digits in 2**1000")

INT_MAX = 2 ** 31 - 1
INT_MIN = -2 ** 31


def reverse_int(x):
    """LeetCode 7: return 0 if the reversal leaves the 32-bit range."""
    sign = -1 if x < 0 else 1
    digits = str(abs(x))[::-1]
    result = sign * int(digits)
    if result < INT_MIN or result > INT_MAX:
        return 0
    return result


for value in (123, -123, 120, 1534236469, 0):
    print(f"{value:>12} -> {reverse_int(value)}")`,
          output: `1267650600228229401496703205376
302 digits in 2**1000
         123 -> 321
        -123 -> -321
         120 -> 21
  1534236469 -> 0
           0 -> 0`,
          explanation:
            "`1534236469` reverses to 9646324351, which is above `INT_MAX`, so the problem wants 0. Python computed that number happily and only the explicit check rejects it — in Java the multiplication would have wrapped and the check would need to happen *before* the overflow, not after. That difference is the classic follow-up question on this problem.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How are negative numbers stored?",
      answer:
        "In two's complement: −x is stored as the bit pattern for 2ⁿ − x, which in practice means invert every bit and add one. It is used because it gives a single representation of zero and because addition, subtraction and comparison then work on the raw patterns with no sign handling — the same adder serves signed and unsigned. The consequences are that −1 is all ones, and that the range is asymmetric.",
    },
    {
      question: "Why does a 32-bit int go from −2³¹ to 2³¹ − 1 rather than symmetrically?",
      answer:
        "There are 2³² patterns and zero consumes one of them from the non-negative half, so the positives get 2³¹ − 1 values while the negatives get all 2³¹. The practical consequence is that `Integer.MIN_VALUE` has no positive counterpart, so `Math.abs(Integer.MIN_VALUE)` returns itself — still negative. Any code assuming an absolute value is non-negative has a bug at exactly that input.",
    },
    {
      question: "What is wrong with `(lo + hi) / 2` in a binary search?",
      answer:
        "It overflows when `lo` and `hi` are both large, producing a negative midpoint and an out-of-range index — a bug that sat in the JDK's own binary search for nine years. Use `lo + (hi - lo) / 2`: the difference is small, so adding it to `lo` never leaves the range. It is algebraically identical and computationally safe. Python's unbounded integers hide the bug entirely, which is why it survives translation into Java.",
    },
  ],
  takeaways: [
    "Two's complement stores −x as 2ⁿ − x; negate by inverting the bits and adding one",
    "It is used because one zero and one adder circuit serve both signed and unsigned",
    "−1 is all ones; `MIN_VALUE` is a one followed by zeros",
    "32-bit int: −2,147,483,648 to 2,147,483,647; 64-bit long tops out near 9.22 × 10¹⁸",
    "The range is lopsided because zero takes a pattern from the non-negative half",
    "`Math.abs(Integer.MIN_VALUE)` is negative — there is no positive twin",
    "Overflow wraps silently in Java; write `lo + (hi - lo) / 2` in every binary search",
    "`(long) a * b`, not `long x = a * b` — the destination type does not widen the operands",
    "Python integers are unbounded, so overflow bugs appear only on translation to Java",
  ],
};
