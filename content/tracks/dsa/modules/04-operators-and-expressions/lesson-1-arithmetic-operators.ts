import type { Lesson } from "@/content/types";

export const arithmeticOperatorsLesson: Lesson = {
  id: "dsa-ops-arithmetic",
  slug: "arithmetic-operators",
  moduleSlug: "operators-and-expressions",
  title: "The Arithmetic Operators",
  summary:
    "The five arithmetic operators, exactly what each does to integers and to doubles, and the exponent operator that exists in one language and not the other.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Use all five arithmetic operators and predict their result type",
    "Say which way each language's division rounds, on both signs",
    "Raise a number to a power correctly in both languages",
    "Recognise when an arithmetic expression has silently changed type",
  ],
  sections: [
    {
      id: "the-five",
      heading: "Five operators",
      body: [
        "`+` add, `-` subtract, `*` multiply, `/` divide, `%` remainder. Both languages have all five, and Python adds two more: `//` for floor division and `**` for exponentiation.",
        "The rule that governs all of them in Java is simple and worth stating once: **the result type is the wider of the two operand types, and never narrower than `int`.** So `int` combined with `int` gives `int`; `int` with `double` gives `double`; and even `byte` with `byte` gives `int`, which surprises people.",
        "Python has no such promotion rules to learn, with one exception: `int` combined with `float` gives `float`, and `/` always gives a `float` even between two integers.",
      ],
      examples: [
        {
          id: "result-types",
          title: "What each combination produces",
          lang: "python",
          code: `print(7 + 2, type(7 + 2).__name__)
print(7 / 2, type(7 / 2).__name__)
print(7 // 2, type(7 // 2).__name__)
print(7 % 2, type(7 % 2).__name__)
print(7 ** 2, type(7 ** 2).__name__)
print(7 + 2.0, type(7 + 2.0).__name__)
print(7 // 2.0, type(7 // 2.0).__name__)`,
          output: `9 int
3.5 float
3 int
1 int
49 int
9.0 float
3.0 float`,
          explanation:
            "The last line is the one to notice: `//` is *floor* division, not *integer* division. Given a float operand it floors and returns a float — 3.0, not 3. The name people use for it is misleading, and the distinction matters the moment one operand comes from a division.",
        },
      ],
    },
    {
      id: "division-recap",
      heading: "Division, in one table",
      body: [
        "Module 2 covered this as an arithmetic trap. Here it is as reference, because it is the operator you will get wrong most often and the two languages genuinely disagree.",
        "**Java `/` on two integers** truncates toward zero: `7 / 2` is 3, `-7 / 2` is −3.",
        "**Java `/` with any double** gives a double: `7 / 2.0` is 3.5.",
        "**Python `/`** always gives a float, even between integers: `7 / 2` is 3.5.",
        "**Python `//`** floors toward negative infinity: `7 // 2` is 3, `-7 // 2` is −4.",
        "So Java's `/` and Python's `//` agree on positive numbers and differ by one on negatives. If your indices can go negative — and in circular-buffer and grid-wrapping problems they can — that difference is a bug.",
      ],
      examples: [
        {
          id: "division-table",
          title: "Both signs, both languages",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        System.out.println(" 7 /  2 = " + (7 / 2));
        System.out.println("-7 /  2 = " + (-7 / 2));
        System.out.println(" 7 / -2 = " + (7 / -2));
        System.out.println("-7 / -2 = " + (-7 / -2));
        System.out.println("floorDiv(-7, 2) = " + Math.floorDiv(-7, 2));
    }
}`,
          output: ` 7 /  2 = 3
-7 /  2 = -3
 7 / -2 = -3
-7 / -2 = 3
floorDiv(-7, 2) = -4`,
          explanation:
            "Java truncates toward zero in every case, so the sign of the operands never changes the magnitude — `-7 / 2` and `7 / -2` are both −3. `Math.floorDiv` is there when you want Python's behaviour, and knowing it exists means you can pick rather than discover.",
        },
      ],
      pitfalls: [
        {
          title: "Dividing by zero",
          body: "Integer division by zero throws — `ArithmeticException` in Java, `ZeroDivisionError` in Python. Floating-point division by zero does not: in both languages it gives infinity or NaN, silently. So `1 / 0` crashes and `1.0 / 0` gives `inf`, which then propagates through every subsequent calculation without complaint.",
        },
      ],
    },
    {
      id: "exponent",
      heading: "Raising to a power",
      body: [
        "Python has `**`. Java does not have an exponent operator at all, and this catches people out constantly.",
        "Java's `Math.pow(a, b)` takes and returns **doubles**, so using it for integer exponentiation means going through floating point — which is fine for small values and wrong past 2⁵³, exactly as the floating-point lesson described.",
        "For integer powers in Java, either multiply in a loop, use `1L << k` for powers of two, or write fast exponentiation. For problems asking for a power modulo something, fast modular exponentiation is the expected answer and `Math.pow` is never correct.",
      ],
      examples: [
        {
          id: "powers",
          title: "Powers, and where Math.pow stops being exact",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        System.out.println(Math.pow(2, 10));
        System.out.println((int) Math.pow(2, 10));
        System.out.println(1L << 10);

        long viaPow = (long) Math.pow(10, 17);
        long viaLoop = 1;
        for (int i = 0; i < 17; i++) viaLoop *= 10;
        System.out.println(viaPow + " " + viaLoop + " " + (viaPow == viaLoop));

        long viaPow2 = (long) Math.pow(3, 40);
        long viaLoop2 = 1;
        for (int i = 0; i < 40; i++) viaLoop2 *= 3;
        System.out.println(viaPow2 + " " + viaLoop2 + " " + (viaPow2 == viaLoop2));
    }
}`,
          output: `1024.0
1024
1024
100000000000000000 100000000000000000 true
9223372036854775807 -6289078614652622815 false`,
          explanation:
            "The last line shows two different wrong answers to the same question. 3⁴⁰ is about 1.2 × 10¹⁹, past `Long.MAX_VALUE`, so the loop overflows to a negative number — while casting `Math.pow`'s `double` result *saturates* at `Long.MAX_VALUE` instead of wrapping. Neither is 3⁴⁰, and they are not even wrong in the same direction. Python prints the exact value on the next example, which is worth comparing.",
        },
        {
          id: "powers-python",
          title: "Python: exact, and with a modulus built in",
          lang: "python",
          code: `print(2 ** 10)
print(3 ** 40)
print(2 ** 0.5)

print(pow(3, 40))
print(pow(3, 40, 1000000007))

print(pow(2, 1000) % 1000000007)`,
          output: `1024
12157665459056928801
1.4142135623730951
12157665459056928801
953271190
688423210`,
          explanation:
            "`3 ** 40` is exact, because Python integers are unbounded. The three-argument `pow(base, exponent, modulus)` is fast modular exponentiation built into the language — it never forms the huge intermediate at all, so it works for exponents in the millions. Java's equivalent is `BigInteger.modPow`, or you write the ten-line loop yourself, which is a standard interview question.",
        },
      ],
    },
    {
      id: "unary",
      heading: "Unary minus, and the one asymmetry",
      body: [
        "`-x` negates. That is all there is to it, with one exception worth knowing because it is genuinely strange.",
        "The range of an `int` is not symmetric: it runs from −2,147,483,648 to 2,147,483,647. There is one more negative value than positive. So **negating the most negative int gives back itself**, because the positive counterpart does not exist.",
      ],
      examples: [
        {
          id: "abs-overflow",
          title: "The value that cannot be made positive",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int min = Integer.MIN_VALUE;
        System.out.println(min);
        System.out.println(-min);
        System.out.println(Math.abs(min));
        System.out.println(Math.abs((long) min));
    }
}`,
          output: `-2147483648
-2147483648
-2147483648
2147483648`,
          explanation:
            "`Math.abs` of the minimum `int` returns a negative number. This is documented behaviour, not a bug, and it is the reason a sort comparator written as `Math.abs(a) - Math.abs(b)` can misbehave on extreme input. The fix, as ever, is to widen first — `Math.abs((long) min)` is correct.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you raise an integer to a power in Java?",
      answer:
        "Not with `Math.pow`, which takes and returns `double` and loses exactness past 2⁵³ — and casting the result back hides that. For powers of two use a shift, `1L << k`. Otherwise multiply in a loop, or use fast exponentiation by squaring, which is O(log n) and the expected answer when the exponent is large. If a modulus is involved, modular exponentiation is required, and `Math.pow` cannot express it at all.",
    },
    {
      question: "What does `Math.abs(Integer.MIN_VALUE)` return, and why?",
      answer:
        "`Integer.MIN_VALUE` — a negative number. The two's-complement range is asymmetric, running from −2³¹ to 2³¹ − 1, so the positive counterpart of the minimum does not exist and negating it overflows back to itself. It is documented behaviour. Any code that takes an absolute value of a possibly-extreme `int` should widen to `long` first.",
    },
    {
      question: "What happens when you divide by zero?",
      answer:
        "It depends on the type. Integer division by zero throws — `ArithmeticException` in Java, `ZeroDivisionError` in Python. Floating-point division by zero does not throw: it yields positive or negative infinity, or NaN for zero divided by zero, and those values then propagate silently through every later calculation. So an integer divide-by-zero is loud and a floating-point one is quiet, which makes the quiet one more dangerous.",
    },
  ],
  takeaways: [
    "Five operators, plus Python's `//` and `**`; Java has no exponent operator",
    "In Java the result type is the wider operand, never narrower than `int`",
    "Java's `/` truncates toward zero on both signs; Python's `//` floors",
    "`//` on a float operand returns a float — it is floor division, not integer division",
    "Integer division by zero throws; floating-point division by zero gives infinity silently",
    "`Math.pow` goes through `double` and is wrong for large integer powers",
    "Python's three-argument `pow(base, exp, mod)` is fast modular exponentiation built in",
    "`Math.abs(Integer.MIN_VALUE)` is negative, because the two's-complement range is asymmetric",
  ],
};
