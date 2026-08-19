import type { Lesson } from "@/content/types";

export const integerTypesLesson: Lesson = {
  id: "dsa-io-integer-types",
  slug: "integer-types-and-ranges",
  moduleSlug: "input-output-and-data-types",
  title: "Integer Types, Ranges & Silent Wrapping",
  summary:
    "The four Java integer types and their exact limits, how to estimate whether your answer fits, and the method that turns overflow from silent into loud.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "State the range of each Java integer type and pick the right one",
    "Estimate the maximum value an expression can reach from the constraints",
    "Use `Math.addExact` and friends to make overflow throw instead of wrap",
    "Explain what happens when a wider value is cast down to a narrower one",
  ],
  sections: [
    {
      id: "the-four",
      heading: "Four types, and only two you will use",
      body: [
        "Java has four signed integer types. Their sizes are fixed by the language, not by your machine, which is worth knowing because it is not true of C.",
        "**`byte`** — 8 bits, −128 to 127.",
        "**`short`** — 16 bits, −32,768 to 32,767.",
        "**`int`** — 32 bits, −2,147,483,648 to 2,147,483,647.",
        "**`long`** — 64 bits, −9,223,372,036,854,775,808 to 9,223,372,036,854,775,807.",
        "In practice you use `int` and `long` and nothing else. `byte` and `short` save memory that you are not short of, and arithmetic on them is promoted to `int` anyway, so they mostly add casts without buying anything. The exception is a very large array where the memory genuinely matters.",
        "The two numbers actually worth memorising: **`int` tops out just above 2 × 10⁹**, and **`long` just above 9 × 10¹⁸**.",
      ],
      examples: [
        {
          id: "ranges",
          title: "The limits, and what is one past them",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        System.out.println(Byte.MAX_VALUE + " " + Short.MAX_VALUE);
        System.out.println(Integer.MAX_VALUE + " " + Long.MAX_VALUE);

        System.out.println(Integer.MAX_VALUE + 1);
        System.out.println(Long.MAX_VALUE + 1);

        System.out.println(1_000_000_000);
    }
}`,
          output: `127 32767
2147483647 9223372036854775807
-2147483648
-9223372036854775808
1000000000`,
          explanation:
            "Adding one to the maximum gives the minimum — the value wraps around, in both types. `long` is not immune, it is just far enough away that you have to try. And note the underscores in `1_000_000_000`: Java permits them in numeric literals purely for readability, and using them makes it much harder to write 10⁸ when you meant 10⁹.",
        },
      ],
    },
    {
      id: "estimating",
      heading: "Estimating from the constraints",
      body: [
        "The question is never \"could this overflow in principle\" — it is \"can it overflow given these constraints\", and the constraints tell you directly. The estimate takes ten seconds.",
        "**A sum:** n × maximum element. With n ≤ 10⁵ and values ≤ 10⁹, that is 10¹⁴ — comfortably past `int`, comfortably inside `long`.",
        "**A product of two elements:** maximum × maximum. With values ≤ 10⁹ that is 10¹⁸, which fits `long` with very little room. Three of them would not.",
        "**A count of pairs:** n²/2. With n ≤ 10⁵ that is 5 × 10⁹ — past `int` again, and this one surprises people because n itself is small.",
        "The rule of thumb: **anything above about 2 × 10⁹ needs `long`.** If your estimate is anywhere near it, use `long` and stop thinking about it, because `long` costs nothing you have.",
      ],
    },
    {
      id: "making-it-loud",
      heading: "Turning silence into an exception",
      body: [
        "The worst property of overflow is that it is silent. Java has a family of methods that make it loud instead, and almost nobody knows they exist.",
        "`Math.addExact`, `Math.subtractExact`, `Math.multiplyExact` and `Math.toIntExact` do the operation and throw `ArithmeticException` if the result does not fit.",
        "They are not for production hot loops, but they are excellent while debugging: wrap the suspect arithmetic, run the failing case, and you get a stack trace pointing at the exact line instead of a wrong number fifty lines later.",
      ],
      examples: [
        {
          id: "exact-methods",
          title: "Overflow that announces itself",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        System.out.println(Math.addExact(1, 2));

        try {
            Math.addExact(Integer.MAX_VALUE, 1);
        } catch (ArithmeticException e) {
            System.out.println("addExact threw: " + e.getMessage());
        }

        System.out.println((int) 3000000000L);
    }
}`,
          output: `3
addExact threw: integer overflow
-1294967296
`,
          explanation:
            "The last line is the other half of the problem. Casting a `long` down to an `int` keeps only the low 32 bits and does so silently — 3,000,000,000 becomes −1,294,967,296 with no complaint. `Math.toIntExact(value)` does the same conversion but throws when it will not fit, and it is the right thing to use whenever you narrow a value you are not certain about.",
        },
      ],
      pitfalls: [
        {
          title: "A `long` literal without the `L`",
          body: "`long big = 3000000000;` does not compile, because the literal itself is an `int` before assignment. You need `3000000000L`. More dangerously, `long ms = 24 * 60 * 60 * 1000 * 1000;` compiles and overflows, because the whole expression is computed in `int` — one operand needs to be `24L`.",
        },
      ],
    },
    {
      id: "python-side",
      heading: "Python: no ranges at all",
      body: [
        "Python's `int` has no maximum. It grows to whatever size is needed, limited only by memory, so none of this lesson applies.",
        "That is a genuine advantage and it comes with two small consequences worth knowing.",
        "**Arithmetic on very large integers is slower**, because they are not machine words. This never matters at the scale problems use, but it is why a factorial of 10,000 takes noticeable time.",
        "**Converting through a float loses it.** `int(1e19)` does not give 10¹⁹ exactly, because `1e19` is a float and floats stop representing every integer beyond 2⁵³. Stay in integers and it never comes up.",
      ],
      examples: [
        {
          id: "python-unbounded",
          title: "No limit, and the one way to lose it",
          lang: "python",
          code: `import sys

print(2 ** 100)
print(10 ** 30 + 1)

print(sys.maxsize)
print(sys.maxsize + 1)

print(int(1e19))
print(10 ** 19)
print(int(1e19) == 10 ** 19)`,
          output: `1267650600228229401496703205376
1000000000000000000000000000001
9223372036854775807
9223372036854775808
10000000000000000000
10000000000000000000
True`,
          explanation:
            "`sys.maxsize` is not a maximum for integers — it is the largest value a container index can take — and adding one to it works fine, which proves the point. The `1e19` conversion happens to be exact here; at `1e23` it is not, which is the kind of boundary you should not be exploring. The habit is simply never to write a large integer in scientific notation: `10 ** 19` is an integer throughout, and `1e19` is a float pretending.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When would you use `long` instead of `int`?",
      answer:
        "Whenever the value can exceed about 2.1 billion. The three common cases are sums over an array — n up to 10⁵ times values up to 10⁹ gives 10¹⁴ — products of two large values, and counts of pairs, which is n²/2 and passes `int` at n around 65,000. The estimate takes seconds and comes straight from the constraints, and since `long` costs nothing meaningful, the right default for any accumulator is `long`.",
    },
    {
      question: "What happens when you cast a `long` to an `int` in Java?",
      answer:
        "The low 32 bits are kept and the rest are discarded, silently — 3,000,000,000 becomes −1,294,967,296. No exception, no warning. `Math.toIntExact(value)` performs the same narrowing but throws `ArithmeticException` when the value does not fit, which is what you want anywhere the value is not provably in range.",
    },
    {
      question: "Why does `long ms = 24 * 60 * 60 * 1000 * 1000;` give the wrong answer?",
      answer:
        "Because the right-hand side is evaluated entirely in `int` arithmetic before being assigned. All the literals are `int`, so the multiplications overflow, and the already-wrong result is then widened to `long`. The fix is to make one operand a `long` so the whole expression is promoted: `24L * 60 * 60 * 1000 * 1000`. It is the same rule as `(long) a * b` — promote before the operation, not after.",
    },
  ],
  takeaways: [
    "Java has four integer types, and you will use `int` and `long`",
    "`int` tops out just above 2 × 10⁹; `long` just above 9 × 10¹⁸",
    "Adding one to the maximum wraps to the minimum, in both types",
    "Estimate from the constraints: sums are n × max, pair counts are n²/2",
    "Anything near 2 × 10⁹ gets a `long`; it costs nothing you have",
    "`Math.addExact` and `Math.toIntExact` turn silent overflow into an exception while debugging",
    "A `long` literal needs the `L`, and one operand must be `long` or the whole expression stays `int`",
    "Python integers are unbounded; never write large ones as `1e19`, which is a float",
  ],
};
