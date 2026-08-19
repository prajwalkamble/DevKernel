import type { Lesson } from "@/content/types";

export const powersAndFactorialsLesson: Lesson = {
  id: "dsa-math-powers",
  slug: "powers-factorials-and-overflow",
  moduleSlug: "number-systems-and-maths",
  title: "Powers, Factorials & Where They Overflow",
  summary:
    "Fast exponentiation by squaring in ten lines, the exact points where factorials leave an int and a long, and why `Math.pow` is the wrong tool for integers.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Compute a power in O(log n) multiplications instead of O(n)",
    "Explain how the binary form of the exponent drives the algorithm",
    "State from memory where factorials leave the int and long ranges",
    "Avoid `Math.pow` for integer work, and know what to use instead",
  ],
  sections: [
    {
      id: "fast-power",
      heading: "Exponentiation by squaring",
      body: [
        "Computing bᵉ by multiplying b into a total e times is O(e). There is an O(log e) method and it is short enough to memorise.",
        "**The identity:** b²ᵏ = (b²)ᵏ. So halving the exponent while squaring the base leaves the answer unchanged — and when the exponent is odd you peel off one factor of b first.",
        "```\nresult = 1\nwhile exp > 0:\n    if exp is odd: result *= base\n    base *= base\n    exp //= 2\n```",
        "The exponent halves every iteration, so the loop runs ⌊log₂ e⌋ + 1 times. For e = 1000 that is ten multiplications instead of a thousand.",
      ],
      examples: [
        {
          id: "fast-power",
          title: "Counted against the naive loop",
          lang: "python",
          code: `def power_naive(base, exp):
    result, steps = 1, 0
    for _ in range(exp):
        result *= base
        steps += 1
    return result, steps


def power_fast(base, exp):
    result, steps = 1, 0
    while exp > 0:
        if exp & 1:
            result *= base
        base *= base
        exp >>= 1
        steps += 1
    return result, steps


for b, e in ((2, 10), (3, 20), (2, 1000)):
    n = power_naive(b, e)
    f = power_fast(b, e)
    print(f"{b}^{e:<5} naive {n[1]:>4} multiplications, fast {f[1]:>3}   agree: {n[0] == f[0]}")

print()
print("2^1000 has", len(str(power_fast(2, 1000)[0])), "digits")`,
          output: `2^10    naive   10 multiplications, fast   4   agree: True
3^20    naive   20 multiplications, fast   5   agree: True
2^1000  naive 1000 multiplications, fast  10   agree: True

2^1000 has 302 digits`,
          explanation:
            "A thousand multiplications against ten, with identical answers. `exp & 1` tests the low bit — the odd/even check from the operators lesson — and `exp >>= 1` halves it. Those two lines are the same as `exp % 2` and `exp //= 2` and are the conventional spelling here.",
        },
      ],
    },
    {
      id: "why-it-works",
      heading: "Why it works: the exponent in binary",
      body: [
        "The algorithm is easier to trust once you see that it is reading the exponent's binary representation.",
        "b¹³ is b⁸ × b⁴ × b¹, because 13 is `1101` in binary. The loop generates b¹, b², b⁴, b⁸ by repeated squaring, and multiplies into the result exactly those whose bit is set.",
        "So the number of squarings is the number of bits, and the number of extra multiplications is the number of set bits. Both are O(log e).",
        "This is also why the technique generalises. Anything **associative** can be exponentiated this way — matrices, for instance, which is how the O(log n) Fibonacci algorithm works, and modular multiplication, which is the next lesson.",
      ],
      examples: [
        {
          id: "trace",
          title: "Tracing 3¹³",
          lang: "python",
          code: `exp = 13
print("13 in binary:", format(exp, "b"))
print("so 3^13 = 3^8 * 3^4 * 3^1")
print()

base, result = 3, 1
while exp > 0:
    print(f"  exp={exp:>3} ({format(exp, 'b'):>4})  bit={exp & 1}  base={base:<9} result={result}")
    if exp & 1:
        result *= base
    base *= base
    exp >>= 1

print()
print("result", result, "== 3**13 ==", 3 ** 13)`,
          output: `13 in binary: 1101
so 3^13 = 3^8 * 3^4 * 3^1

  exp= 13 (1101)  bit=1  base=3         result=1
  exp=  6 ( 110)  bit=0  base=9         result=3
  exp=  3 (  11)  bit=1  base=81        result=3
  exp=  1 (   1)  bit=1  base=6561      result=243

result 1594323 == 3**13 == 1594323`,
          explanation:
            "Four iterations for a four-bit exponent. The bit column reads 1, 0, 1, 1 — the binary of 13 from the bottom up — and the result only changes on the iterations where the bit is set. The base column meanwhile climbs 3, 9, 81, 6561, which are 3¹, 3², 3⁴, 3⁸.",
        },
      ],
    },
    {
      id: "factorials",
      heading: "Where factorials stop fitting",
      body: [
        "Factorials grow faster than anything else you will meet in this course, and the exact break points are worth memorising because they decide your data type.",
        "**12! fits in a 32-bit int. 13! does not.**",
        "**20! fits in a 64-bit long. 21! does not.**",
        "So any problem involving a factorial of an input larger than 20 is not asking you to compute the factorial. It is asking for the answer **modulo something** — almost always 10⁹ + 7 — or for a count that cancels most of the factorial away, like a binomial coefficient.",
        "Recognising that immediately is the difference between reaching for `BigInteger` and reaching for the right algorithm.",
      ],
      examples: [
        {
          id: "factorial-limits",
          title: "The exact break points",
          lang: "python",
          code: `import math

INT_MAX = 2 ** 31 - 1
LONG_MAX = 2 ** 63 - 1

print(f"{'n':>3}  {'n!':>25}  {'fits int':<8}  fits long")
for n in (11, 12, 13, 14, 20, 21, 25):
    f = math.factorial(n)
    print(f"{n:>3}  {f:>25}  {str(f <= INT_MAX):<8}  {f <= LONG_MAX}")

print()
print("largest n with n! in an int :", max(n for n in range(1, 30) if math.factorial(n) <= INT_MAX))
print("largest n with n! in a long :", max(n for n in range(1, 40) if math.factorial(n) <= LONG_MAX))
print("100! has", len(str(math.factorial(100))), "digits")`,
          output: `  n                         n!  fits int  fits long
 11                   39916800  True      True
 12                  479001600  True      True
 13                 6227020800  False     True
 14                87178291200  False     True
 20        2432902008176640000  False     True
 21       51090942171709440000  False     False
 25  15511210043330985984000000  False     False

largest n with n! in an int : 12
largest n with n! in a long : 20
100! has 158 digits`,
          explanation:
            "Twelve and twenty. Those two numbers are worth knowing cold, because they let you answer \"what type do I need\" in an interview without doing arithmetic. Note how sharp the cliff is: 12! is under half a billion and 21! is past nine quintillion, nine steps later.",
        },
      ],
      pitfalls: [
        {
          title: "Computing a binomial coefficient as `n! / (k! * (n-k)!)`",
          body: "The formula is correct and the implementation overflows for any n past 20, even when the answer itself is small — C(30, 2) is 435 but 30! is astronomically out of range. Multiply and divide alternately instead: `result = result * (n - i) / (i + 1)` stays near the answer throughout, and each division is exact.",
        },
      ],
    },
    {
      id: "math-pow",
      heading: "Why not `Math.pow`",
      body: [
        "Java's `Math.pow` takes two doubles and returns a double. Using it for integer work introduces floating-point error into an exact computation, and the failures are subtle rather than loud.",
        "`(int) Math.pow(10, 2)` can be 99 rather than 100 on some platforms, because the double result is 99.999999… and the cast truncates. Whether it bites depends on the runtime, which is worse than always failing.",
        "It also has no chance past 2⁵³, where a double stops representing consecutive integers — so `Math.pow(2, 60)` returns something that looks right and is not exactly right.",
        "**Use integer multiplication.** A `long` loop, exponentiation by squaring, or `Math.multiplyExact` if you want overflow to throw. In Python, `pow` and `**` on integers are exact and unbounded, so the issue only arises if you introduce a float yourself.",
      ],
      examples: [
        {
          id: "pow-java",
          title: "Java: the float path against the integer path",
          lang: "java",
          code: `public class Main {
    static long powInt(long base, int exp) {
        long result = 1;
        while (exp > 0) {
            if ((exp & 1) == 1) {
                result *= base;
            }
            base *= base;
            exp >>= 1;
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(Math.pow(2, 10));
        System.out.println((long) Math.pow(2, 10));
        System.out.println(powInt(2, 10));

        System.out.println(Math.pow(2, 60));
        System.out.println((long) Math.pow(2, 60));
        System.out.println(powInt(2, 60));
        System.out.println(1L << 60);

        System.out.println(Math.pow(3, 40));
        System.out.println((long) Math.pow(3, 40));
        System.out.println(powInt(3, 40));
    }
}`,
          output: `1024.0
1024
1024
1.152921504606847E18
1152921504606846976
1152921504606846976
1152921504606846976
1.2157665459056929E19
9223372036854775807
-6289078614652622815`,
          explanation:
            "Three different behaviours in one program. Small powers agree. At 2⁶⁰ the double happens to be exact — because 2⁶⁰ is a power of two, which doubles represent perfectly — so this is a case that passes testing and teaches the wrong lesson. At 3⁴⁰ everything breaks: the double is approximate, the cast **saturates** at `Long.MAX_VALUE` rather than wrapping, and the exact integer version overflows and wraps to a negative. Neither result is usable, which is the real message — 3⁴⁰ needs modular arithmetic or `BigInteger`.",
        },
      ],
      pitfalls: [
        {
          title: "Casting a double to a long saturates, but casting a long to an int wraps",
          body: "Two different rules in the same language. `(long) 1e30` gives `Long.MAX_VALUE`, while `(int) 5_000_000_000L` gives 705032704 by discarding the high bits. So a value that came through a double clamps and a value that stayed integral wraps — and neither warns. Keep integer work in integer types end to end.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you compute bᵉ in O(log e)?",
      answer:
        "Exponentiation by squaring. Square the base and halve the exponent each iteration, multiplying the base into the result whenever the exponent is odd. It works because b²ᵏ = (b²)ᵏ, and the odd case peels off one factor. Equivalently it reads the exponent in binary: b¹³ = b⁸ × b⁴ × b¹ because 13 is 1101. The exponent halves every step, so the loop runs about log₂ e times — ten multiplications for e = 1000 rather than a thousand.",
    },
    {
      question: "At what point does a factorial stop fitting in standard integer types?",
      answer:
        "12! is the largest that fits in a 32-bit int and 20! is the largest that fits in a 64-bit long. Those are worth memorising because they tell you instantly what a problem is really asking: if the input can exceed 20, the problem does not want the factorial itself — it wants the answer modulo something, typically 10⁹ + 7, or it wants a quantity like a binomial coefficient where most of the factorial cancels.",
    },
    {
      question: "Why shouldn't you use `Math.pow` for integer exponentiation?",
      answer:
        "It works in doubles, so it introduces rounding into an exact computation — `(int) Math.pow(10, 2)` can come out as 99 because the double is 99.999… and the cast truncates. Past 2⁵³ a double cannot represent consecutive integers at all, so the answer is approximate even when it looks right. Use integer multiplication, ideally exponentiation by squaring on a `long`, or `Math.multiplyExact` if you want overflow to throw rather than wrap.",
    },
  ],
  takeaways: [
    "Exponentiation by squaring: square the base, halve the exponent, multiply in when odd",
    "It runs in O(log e) — ten multiplications for e = 1000",
    "It works by reading the exponent in binary, so it generalises to anything associative",
    "12! is the largest factorial in an int; 20! is the largest in a long",
    "An input above 20 in a factorial problem means modular arithmetic, not BigInteger",
    "Compute binomials by alternating multiply and divide, never as a ratio of factorials",
    "`Math.pow` returns a double — rounding, and no exactness past 2⁵³",
    "Casting double to long saturates; casting long to int wraps",
  ],
};
