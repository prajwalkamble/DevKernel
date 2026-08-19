import type { Lesson } from "@/content/types";

export const overflowLesson: Lesson = {
  id: "dsa-math-overflow",
  slug: "overflow-and-pythons-integers",
  moduleSlug: "bit-manipulation-and-math",
  title: "Overflow, and Python's Integers Against Everyone Else's",
  summary:
    "The one difference between Python and the rest that turns a correct solution into a wrong one on translation — and the four places overflow actually bites, including a binary search bug that shipped in the JDK for nine years.",
  estimatedMinutes: 25,
  objectives: [
    "State what Python's integers do that fixed-width ones cannot",
    "Identify the four common overflow sites in interview code",
    "Write an overflow-safe midpoint and explain why it works",
    "Detect overflow rather than hoping, using the exact-arithmetic helpers",
    "Know what unbounded integers cost in time",
  ],
  sections: [
    {
      id: "the-difference",
      heading: "One difference, many consequences",
      body: [
        "A Python `int` has no maximum. It grows to fit, allocating more memory as needed. A Java `int` is exactly 32 bits, a `long` exactly 64, and exceeding either wraps around silently — defined behaviour, and almost never what you meant.",
        "This is why a solution written in Python and translated to Java can fail with no visible cause. Nothing throws. There is no error message. The answer is simply wrong, and it is wrong only on the large tests.",
      ],
      examples: [
        {
          id: "python-ints",
          title: "What unbounded actually means",
          lang: "python",
          code: `import time

# Python integers do not overflow. They grow.
n = 2 ** 200
print("2**200 =", n)
print("digits :", len(str(n)))
print("bits   :", n.bit_length())

f = 1
for i in range(1, 31):
    f *= i
print("\\n30! =", f)
print("fits in 64 bits?", f < 2 ** 63)

# But arithmetic on huge integers is not free. Assert the *shape* of the cost
# with a wide margin rather than printing a timing that varies per machine.
def timed(value, rounds=200):
    start = time.perf_counter()
    for _ in range(rounds):
        value * value
    return time.perf_counter() - start

small = timed(12345)
huge = timed(2 ** 100000)
print("\\nmultiplying a 100k-bit integer costs more than a machine word:",
      huge > small * 10)

# The mid-point overflow that is real in fixed-width languages.
lo, hi = 2_000_000_000, 2_100_000_000
print("\\n(lo+hi)//2      =", (lo + hi) // 2, " correct in Python")
print("lo + (hi-lo)//2 =", lo + (hi - lo) // 2, " correct everywhere")`,
          output: `2**200 = 1606938044258990275541962092341162602522202993782792835301376
digits : 61
bits   : 201

30! = 265252859812191058636308480000000
fits in 64 bits? False

multiplying a 100k-bit integer costs more than a machine word: True

(lo+hi)//2      = 2050000000  correct in Python
lo + (hi-lo)//2 = 2050000000  correct everywhere`,
          explanation:
            "Unbounded is not free. Arithmetic on a machine-word integer is one instruction; arithmetic on a hundred-thousand-bit integer is a loop over limbs. The example asserts the *shape* of that difference rather than printing a timing, because an exact microsecond figure would depend on the machine, the load and the interpreter version — and a lesson that prints a number nobody can reproduce is worse than one that prints a claim anybody can check.",
        },
      ],
    },
    {
      id: "four-places",
      heading: "The four places it actually bites",
      body: [
        "In interview and contest code, overflow shows up in the same four spots.",
        "**The binary-search midpoint.** `(lo + hi) / 2` overflows when both are large. This exact bug was in `java.util.Arrays.binarySearch` for nine years and was found in 2006 — it is not a beginner's mistake.",
        "**Multiplying two values that each fit.** Two residues under `10^9 + 7` each fit an `int` and their product does not, by a factor of a billion.",
        "**Accumulating a sum.** A hundred thousand values of a billion each sum to `10^14`, which needs a `long`.",
        "**Factorials and powers.** `21!` already exceeds a 64-bit integer, so anything counting arrangements needs a modulus or a big integer.",
      ],
      examples: [
        {
          id: "overflow-java",
          title: "All four, and how to detect them",
          lang: "java",
          code: `import java.util.*;
import java.math.BigInteger;

public class Main {
    public static void main(String[] args) {
        // Silent wraparound, defined but almost never wanted.
        System.out.println("Integer.MAX_VALUE     = " + Integer.MAX_VALUE);
        System.out.println("Integer.MAX_VALUE + 1 = " + (Integer.MAX_VALUE + 1));

        // The classic binary-search bug: the midpoint overflows before it is used.
        int lo = 2_000_000_000, hi = 2_100_000_000;
        System.out.println("\\n(lo + hi) / 2       = " + ((lo + hi) / 2) + "   <- negative");
        System.out.println("lo + (hi - lo) / 2  = " + (lo + (hi - lo) / 2));

        // Multiplication overflows long before you expect it to.
        int million = 1_000_000;
        System.out.println("\\nint  1e6 * 1e6 = " + (million * million) + "   <- wrong");
        System.out.println("long 1e6 * 1e6 = " + ((long) million * million));

        // Detecting it rather than hoping.
        try {
            Math.multiplyExact(million, million);
        } catch (ArithmeticException e) {
            System.out.println("multiplyExact says: " + e.getMessage());
        }

        // 30! needs BigInteger.
        BigInteger f = BigInteger.ONE;
        for (int i = 1; i <= 30; i++) f = f.multiply(BigInteger.valueOf(i));
        System.out.println("\\n30! = " + f);
        System.out.println("bit length = " + f.bitLength());
    }
}`,
          output: `Integer.MAX_VALUE     = 2147483647
Integer.MAX_VALUE + 1 = -2147483648

(lo + hi) / 2       = -97483648   <- negative
lo + (hi - lo) / 2  = 2050000000

int  1e6 * 1e6 = -727379968   <- wrong
long 1e6 * 1e6 = 1000000000000
multiplyExact says: integer overflow

30! = 265252859812191058636308480000000
bit length = 108`,
          explanation:
            "`lo + (hi - lo) / 2` is the fix, and it works because `hi - lo` is a *difference* between two values in range, which is itself in range — so nothing overflows on the way. It is exactly equal to `(lo + hi) / 2` whenever that expression is correct, and correct when it is not.\n\n`Math.multiplyExact` and its siblings `addExact` and `subtractExact` throw rather than wrapping. They are the right choice whenever a silent wrong answer would be worse than a crash, which in an interview is always.",
        },
      ],
      pitfalls: [
        {
          title: "The cast has to come before the multiplication",
          body: "`long result = a * b;` where both are `int` overflows *first* and then widens the already-wrong value. The cast must be on an operand: `long result = (long) a * b;`. This reads as a subtle detail and is the single most common overflow bug in Java.",
        },
        {
          title: "Python is not immune to every version of this",
          body: "Unbounded integers remove overflow, not every numeric problem. `float` in Python is still a 64-bit double, so `10**17 + 1.0` loses the one, and `//` on floats is still floating-point. Keep integer arithmetic in `int`.",
        },
      ],
    },
    {
      id: "habit",
      heading: "The habit worth forming",
      body: [
        "Before writing a line that multiplies or sums, ask what the largest value each side can hold is, and multiply those bounds in your head. If the answer is anywhere near `2 · 10^9`, you need a `long`; if it is near `9 · 10^18`, you need a modulus or a big integer.",
        "That estimate takes two seconds and catches every one of the four cases above. It is the same estimate the complexity module asked you to make about *time* — this one is about *width*, and it is the reason a problem's constraints tell you the type before they tell you the algorithm.",
      ],
    },
  ],
  takeaways: [
    "Python integers grow; Java, C++ and Go wrap silently at 32 or 64 bits",
    "A translated solution fails with no error message and only on large inputs",
    "`lo + (hi - lo) / 2` is the overflow-safe midpoint",
    "Cast an operand before multiplying, not the result",
    "`Math.multiplyExact` throws instead of wrapping — prefer it when wrong is worse than loud",
    "21! already exceeds 64 bits, so counting problems need a modulus",
    "Read the constraints for the *width* they imply, not only the complexity",
  ],
  status: "available",
};
