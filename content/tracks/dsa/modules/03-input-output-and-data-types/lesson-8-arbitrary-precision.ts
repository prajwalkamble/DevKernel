import type { Lesson } from "@/content/types";

export const arbitraryPrecisionLesson: Lesson = {
  id: "dsa-io-arbitrary-precision",
  slug: "arbitrary-precision-integers",
  moduleSlug: "input-output-and-data-types",
  title: "Arbitrary Precision, and Java's BigInteger",
  summary:
    "Why Python's integers never overflow, what that costs, and the Java class that does the same job when you genuinely need it.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Explain how Python represents integers larger than a machine word",
    "Say what arbitrary precision costs in speed and when that matters",
    "Use `BigInteger` in Java for the cases that need it",
    "Recognise when modular arithmetic is the intended answer instead",
  ],
  sections: [
    {
      id: "how",
      heading: "How Python does it",
      body: [
        "A Java `int` is a machine word: 32 bits of hardware, added by a single instruction. That is why it is fast and why it has a ceiling.",
        "A Python integer is an object holding an array of digit-chunks — 30 bits each in CPython — plus a sign and a length. Adding two of them walks both arrays with carries, exactly like long addition on paper, allocating a longer result when needed.",
        "So there is no ceiling: the number of chunks grows with the value, bounded only by memory. And the cost is a memory allocation and a loop rather than a single instruction.",
      ],
      examples: [
        {
          id: "growing",
          title: "The size grows with the value",
          lang: "python",
          code: `import sys

for value in [0, 1, 2 ** 30, 2 ** 64, 2 ** 1000]:
    print(f"{value.bit_length():>5} bits   {sys.getsizeof(value):>4} bytes")

print(2 ** 200)
print(len(str(2 ** 1000)))`,
          output: `    0 bits     28 bytes
    1 bits     28 bytes
   31 bits     32 bytes
   65 bits     36 bytes
 1001 bits    160 bytes
1606938044258990275541962092341162602522202993782792835301376
302`,
          explanation:
            "The object is 28 bytes before it holds anything meaningful — that is the header every Python object carries — and then grows four bytes at a time as more chunks are needed. Two to the thousandth power is 160 bytes and 302 decimal digits, and Python prints it exactly. This is the mechanism behind every \"Python has no overflow\" claim.",
        },
      ],
    },
    {
      id: "the-cost",
      heading: "What it costs",
      body: [
        "Arithmetic on small Python integers is already slower than Java's, and that gap is a constant factor you pay everywhere — but it is a *constant*, and constants do not change complexity.",
        "The gap becomes asymptotic once the numbers are genuinely large. Adding two n-chunk integers is O(n); multiplying them is worse. So a program computing enormous factorials or powers is doing real work per operation, not the single instruction the code looks like.",
        "In practice, for this track: it never matters. Problem values fit in 64 bits, so Python is using one or two chunks and the overhead is the object header, not the arithmetic. The only place it shows up is deliberately big-number work — factorials of ten thousand, powers with huge exponents — and those problems usually want modular arithmetic anyway, which keeps everything small.",
      ],
    },
    {
      id: "modular",
      heading: "Why problems say \"modulo 10⁹ + 7\"",
      body: [
        "You will see this constantly: *return the answer modulo 1000000007*. It is not decoration and it is not about avoiding large output.",
        "It exists so the answer **fits in a machine word**. The true answer to a counting problem might have thousands of digits; reduced modulo a prime just under 2³¹, every intermediate value stays under 10⁹ and every operation stays in fixed-width arithmetic. That makes the problem solvable identically in Java and Python, at the same speed.",
        "The rule when you see it: **take the modulus at every step**, not at the end. Reducing only at the end means the intermediate values overflowed long before you got there.",
        "The prime is chosen so that it is just below 2³¹ — so two reduced values can be added in an `int` — and prime so that modular inverses exist, which matters once division enters.",
      ],
      examples: [
        {
          id: "modular-arithmetic",
          title: "Reducing as you go",
          lang: "python",
          code: `MOD = 10 ** 9 + 7

# Python could do this exactly, which lets us check the modular version.
exact = 1
for i in range(1, 31):
    exact *= i

reduced = 1
for i in range(1, 31):
    reduced = reduced * i % MOD

print("30! has", len(str(exact)), "digits")
print("exact % MOD:", exact % MOD)
print("reduced    :", reduced)
print("they agree :", exact % MOD == reduced)`,
          output: `30! has 33 digits
exact % MOD: 109361473
reduced    : 109361473
they agree : True`,
          explanation:
            "Thirty factorial has 33 digits and would overflow a `long` many times over, yet reducing at every step gives the same answer as computing it exactly and reducing once — because modular arithmetic commutes with multiplication. Every intermediate in the reduced version stays below 10⁹, so the identical loop works in Java with `long` and never overflows.",
        },
      ],
      pitfalls: [
        {
          title: "Reducing only at the end",
          body: "`result = result * i;` through the loop and `return result % MOD;` at the end overflows long before the return. The modulus must be applied inside the loop. In Java the accumulator must also be a `long`, because two values just under 10⁹ multiply to just under 10¹⁸ — which fits a `long` and not an `int`.",
        },
      ],
    },
    {
      id: "biginteger",
      heading: "Java's BigInteger",
      body: [
        "When Java genuinely needs unbounded integers, `java.math.BigInteger` provides them. It is the same idea as Python's integers, made explicit and considerably less pleasant to write, because Java has no operator overloading — every operation is a method call.",
        "It is immutable, so every operation allocates a new object, and it is substantially slower than `long`. Use it when the problem truly requires exact enormous values, and prefer modular arithmetic whenever the problem offers it.",
      ],
      examples: [
        {
          id: "biginteger",
          title: "The same factorial, in Java",
          lang: "java",
          code: `import java.math.BigInteger;

public class Main {
    public static void main(String[] args) {
        BigInteger factorial = BigInteger.ONE;
        for (int i = 1; i <= 30; i++) {
            factorial = factorial.multiply(BigInteger.valueOf(i));
        }
        System.out.println(factorial);
        System.out.println(factorial.toString().length() + " digits");

        BigInteger mod = BigInteger.valueOf(1_000_000_007L);
        System.out.println(factorial.mod(mod));

        System.out.println(BigInteger.TWO.pow(200));
    }
}`,
          output: `265252859812191058636308480000000
33 digits
109361473
1606938044258990275541962092341162602522202993782792835301376`,
          explanation:
            "Same 33-digit answer and the same 109361473 modulo 10⁹ + 7 as the Python version — which is a useful cross-check on both. Note the verbosity: `factorial.multiply(BigInteger.valueOf(i))` is what `factorial *= i` would be, and there is no shorter form. That verbosity is exactly why the modular version is preferable whenever the problem allows it.",
        },
      ],
      pitfalls: [
        {
          title: "Using `==` on BigInteger",
          body: "It compares references, not values, and will be false for two separately-computed equal numbers. Use `.equals()` for equality and `.compareTo()` for ordering. The same trap as boxed `Integer`, with no small-value cache to make it accidentally work.",
        },
      ],
    },
    {
      id: "closing",
      heading: "Closing the module",
      body: [
        "That is input, output and data types. The theme running through all eight lessons is the same: **fixed-width types are fast because they are small, and they lie when you exceed them.** Java exposes that directly and Python hides it for integers while keeping it for floats.",
        "Three things to carry forward. Read the constraints and estimate whether your answer fits before you choose a type. Never compare computed floating-point values with `==`. And when a problem says \"modulo 10⁹ + 7\", it is telling you the intended answer is counting something enormous — and handing you the tool that makes it fit.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does Python avoid integer overflow?",
      answer:
        "Its integers are not machine words but objects holding an array of fixed-size digit chunks, 30 bits each in CPython, with a sign and a length. Arithmetic walks those arrays with carries and allocates a longer result when needed, so the value grows to whatever size is required, limited only by memory. The cost is that each operation is a loop and an allocation rather than a single hardware instruction, which is a constant factor at ordinary sizes and becomes asymptotic once the numbers are genuinely huge.",
    },
    {
      question: "Why do problems ask for the answer modulo 10⁹ + 7?",
      answer:
        "So the answer fits in a machine word. Counting problems often have answers with thousands of digits; reducing modulo a prime just under 2³¹ keeps every intermediate below 10⁹, so fixed-width arithmetic suffices and the problem is equally solvable in any language. The modulus must be applied at every step rather than at the end, or the intermediates overflow first. It is prime so that modular inverses exist, which is needed as soon as division is involved.",
    },
    {
      question: "When would you use BigInteger in Java?",
      answer:
        "When the problem genuinely requires exact values beyond 64 bits and offers no modulus — cryptographic arithmetic, exact factorials, very large combinatorics. It is immutable, every operation is a method call rather than an operator, and it is markedly slower than `long`, so it is a last resort. If the statement mentions a modulus, that is the intended route and `long` arithmetic with reduction at every step will be both simpler and faster.",
    },
  ],
  takeaways: [
    "A Python integer is an object holding an array of 30-bit chunks; it grows rather than overflowing",
    "The cost is a loop and an allocation per operation instead of one instruction — a constant factor at normal sizes",
    "\"Modulo 10⁹ + 7\" exists so an enormous answer fits in a machine word",
    "Apply the modulus at every step, never only at the end, and use a `long` accumulator in Java",
    "The modulus is just under 2³¹ so two reduced values still add safely, and prime so inverses exist",
    "Java's `BigInteger` is unbounded, immutable, method-call-based and slow — a last resort",
    "Compare `BigInteger` with `.equals()`; `==` compares references",
    "Fixed-width types are fast because they are small, and they lie when you exceed them",
  ],
};
