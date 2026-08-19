import type { Lesson } from "@/content/types";

export const moduloLesson: Lesson = {
  id: "dsa-ops-modulo",
  slug: "the-modulo-operator",
  moduleSlug: "operators-and-expressions",
  title: "Modulo, and What It Is Actually For",
  summary:
    "The remainder operator, the four jobs it does in problem solving, and the negative-operand disagreement that turns it into a crash.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "State what `%` returns for every combination of signs, in both languages",
    "Use modulo for wrapping, digit extraction, parity and bucketing",
    "Write a safe modulo in Java when the operand may be negative",
    "Explain why counting problems ask for the answer modulo a large prime",
  ],
  sections: [
    {
      id: "what-it-is",
      heading: "The remainder, precisely",
      body: [
        "`a % b` is what is left of `a` after taking away as many whole `b`s as possible. `17 % 5` is 2, because 17 is three fives and two left over.",
        "The definition that makes the negative cases predictable is that `%` is tied to `/`: both languages guarantee that `(a / b) * b + (a % b) == a`. Since the two languages round division differently, they must give different remainders to keep that identity true. That is the whole explanation for the disagreement.",
      ],
      examples: [
        {
          id: "sign-table",
          title: "Every combination of signs",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        System.out.println(" 7 %  3 = " + (7 % 3));
        System.out.println("-7 %  3 = " + (-7 % 3));
        System.out.println(" 7 % -3 = " + (7 % -3));
        System.out.println("-7 % -3 = " + (-7 % -3));
        System.out.println("floorMod(-7, 3) = " + Math.floorMod(-7, 3));
        System.out.println("identity holds : " + ((-7 / 3) * 3 + (-7 % 3) == -7));
    }
}`,
          output: ` 7 %  3 = 1
-7 %  3 = -1
 7 % -3 = 1
-7 % -3 = -1
floorMod(-7, 3) = 2
identity holds : true`,
          explanation:
            "In Java the result takes the sign of the *left* operand, always. The last line confirms the identity that forces it: `-7 / 3` is −2, and −2 × 3 + (−1) is −7. `Math.floorMod` gives the mathematician's answer, 2, which is the one you want whenever the result becomes an index.",
        },
        {
          id: "sign-table-python",
          title: "Python takes the sign of the right operand",
          lang: "python",
          code: `print(" 7 %  3 =", 7 % 3)
print("-7 %  3 =", -7 % 3)
print(" 7 % -3 =", 7 % -3)
print("-7 % -3 =", -7 % -3)
print("identity holds:", (-7 // 3) * 3 + (-7 % 3) == -7)
print([i % 3 for i in range(-4, 5)])`,
          output: ` 7 %  3 = 1
-7 %  3 = 2
 7 % -3 = -2
-7 % -3 = -1
identity holds: True
[2, 0, 1, 2, 0, 1, 2, 0, 1]`,
          explanation:
            "The last line is the property that makes Python's choice the more useful one: for a positive modulus, every result is in 0..n−1 regardless of the input's sign. That range is exactly what an array index needs, so Python's `%` is always safe for wrapping and Java's is not.",
        },
      ],
    },
    {
      id: "four-jobs",
      heading: "The four jobs modulo does",
      body: [
        "In problem solving, `%` shows up doing one of four things. Recognising which one you need is usually the whole trick.",
        "**Wrapping.** Moving around a circular structure: `next = (i + 1) % n`. Clock arithmetic, circular buffers, round-robin turn order, moving on a ring of houses.",
        "**Digit extraction.** `n % 10` is the last digit and `n / 10` removes it. Together they walk a number's digits from the right.",
        "**Parity and divisibility.** `n % 2 == 0` for even. `n % k == 0` for divisible by k.",
        "**Bucketing.** Mapping a large key into a small table — which is what a hash map does internally, and what you do by hand when you build a frequency array over a limited range.",
      ],
      examples: [
        {
          id: "four-jobs",
          title: "All four",
          lang: "python",
          code: `n = 5
for step in range(7):
    print(step % n, end=" ")
print()

number = 4071
digits = []
while number > 0:
    digits.append(number % 10)
    number //= 10
print(digits, sum(digits))

print([v for v in range(10) if v % 3 == 0])

buckets = [0] * 4
for value in [10, 21, 33, 42, 55]:
    buckets[value % 4] += 1
print(buckets)`,
          output: `0 1 2 3 4 0 1
[1, 7, 0, 4] 12
[0, 3, 6, 9]
[0, 2, 2, 1]`,
          explanation:
            "Digit extraction gives the digits in reverse — `4071` produces `[1, 7, 0, 4]` — which matters when the order is part of the answer, as in a palindrome check. Note the loop condition `while number > 0`: for input 0 the loop body never runs and you get an empty list, which is the edge case worth handling deliberately.",
        },
      ],
      pitfalls: [
        {
          title: "Wrapping backwards in Java",
          body: "`previous = (i - 1) % n` is correct in Python and broken in Java: at `i = 0` it gives −1 and indexes out of bounds. Either use `Math.floorMod(i - 1, n)` or the idiom `(i - 1 + n) % n`, which adds one full turn before reducing.",
        },
      ],
    },
    {
      id: "safe-modulo",
      heading: "Safe modulo in Java",
      body: [
        "Because Java's `%` can return a negative, any use of it as an index needs correcting. Two forms are standard and you should recognise both.",
        "`Math.floorMod(a, n)` — clear, correct, and the one to write.",
        "`((a % n) + n) % n` — the manual idiom, which you will see everywhere. It reduces first, adds one modulus to lift a negative into range, and reduces again to handle the case where it was already positive.",
      ],
      examples: [
        {
          id: "safe-modulo",
          title: "Both forms, on a wrap-backwards",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int n = 5;

        System.out.print("naive     :");
        for (int i = 0; i < 3; i++) System.out.print(" " + ((i - 1) % n));
        System.out.println();

        System.out.print("floorMod  :");
        for (int i = 0; i < 3; i++) System.out.print(" " + Math.floorMod(i - 1, n));
        System.out.println();

        System.out.print("plus n    :");
        for (int i = 0; i < 3; i++) System.out.print(" " + ((i - 1 + n) % n));
        System.out.println();
    }
}`,
          output: `naive     : -1 0 1
floorMod  : 4 0 1
plus n    : 4 0 1`,
          explanation:
            "The naive version's first value is −1, which as an array index throws immediately. Both fixes give 4 — the last position, which is what wrapping backwards from position 0 should mean. Note that `(i - 1 + n) % n` only works when the value cannot be more than one modulus below zero; `floorMod` works for any input, which is why it is the better default.",
        },
      ],
    },
    {
      id: "modular-arithmetic",
      heading: "Modulo as the answer, not the tool",
      body: [
        "Counting problems routinely ask for the answer *modulo 10⁹ + 7*, which the previous module explained: it keeps an astronomically large count inside a machine word.",
        "Two rules make it work.",
        "**Reduce at every step.** Multiplication and addition both commute with the modulus, so `(a * b) % m` equals `((a % m) * (b % m)) % m`. Reducing only at the end means the intermediates overflowed first.",
        "**Use a wide enough accumulator.** Two values just under 10⁹ multiply to just under 10¹⁸ — which fits in a `long` and not in an `int`. In Java the accumulator must be `long` even though every stored value is small.",
        "Subtraction needs care too: `(a - b) % m` can be negative, so the safe form is `((a - b) % m + m) % m`.",
      ],
      examples: [
        {
          id: "modular-fib",
          title: "A count that would not otherwise fit",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        final int MOD = 1_000_000_007;

        long a = 1, b = 1;
        for (int i = 2; i < 90; i++) {
            long next = (a + b) % MOD;
            a = b;
            b = next;
        }
        System.out.println("fib(90) mod 1e9+7 = " + b);

        long product = 1;
        for (int i = 1; i <= 30; i++) {
            product = product * i % MOD;
        }
        System.out.println("30! mod 1e9+7     = " + product);
    }
}`,
          output: `fib(90) mod 1e9+7 = 210345902
30! mod 1e9+7     = 109361473`,
          explanation:
            "The 90th Fibonacci number is about 2.9 × 10¹⁸ and 30! has 33 digits — neither fits an `int`, and the factorial does not fit a `long` either. Reducing at every step keeps both under 10⁹ throughout. Note `product * i % MOD` relies on precedence: `*` and `%` have equal precedence and group left to right, so it means `(product * i) % MOD`, which is what we want. That is a case where knowing the precedence rule saves a pair of brackets and where adding them anyway would be perfectly reasonable.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does `-7 % 3` give in Java and in Python, and why the difference?",
      answer:
        "−1 in Java, 2 in Python. Both languages guarantee `(a / b) * b + (a % b) == a`, and they round division differently — Java truncates toward zero, Python floors — so the remainders must differ to keep that identity. The practical consequence is that Java's result takes the sign of the dividend and can be negative, while Python's takes the sign of the divisor and is always in 0..n−1 for a positive modulus, which is what an array index needs.",
    },
    {
      question: "How do you wrap an index backwards around a circular array?",
      answer:
        "In Python, `(i - 1) % n` works directly, because the result is never negative for a positive modulus. In Java that gives −1 at `i = 0` and throws, so you need `Math.floorMod(i - 1, n)` or the idiom `(i - 1 + n) % n`, which adds one full turn before reducing. `floorMod` is preferable because it is correct for any offset, while adding `n` once only fixes values that are at most one modulus below zero.",
    },
    {
      question: "Why must you take the modulus at every step rather than at the end?",
      answer:
        "Because the intermediate values overflow long before the end. Modular arithmetic commutes with addition and multiplication, so reducing as you go gives the same answer as reducing once at the end — but only the reduced version stays inside a machine word. In Java the accumulator must still be a `long`: two reduced values just under 10⁹ multiply to just under 10¹⁸, which overflows an `int` even though both inputs are small.",
    },
  ],
  takeaways: [
    "`%` is tied to `/` by `(a / b) * b + (a % b) == a`, which is why the languages differ on negatives",
    "Java's remainder takes the sign of the dividend; Python's takes the sign of the divisor",
    "Python's `%` is always in 0..n−1 for a positive modulus, so it is safe as an index",
    "Four jobs: wrapping, digit extraction, parity and divisibility, and bucketing",
    "`n % 10` is the last digit and `n // 10` removes it — digits come out in reverse",
    "In Java use `Math.floorMod`, or `(a + n) % n`, whenever the value can be negative",
    "Reduce at every step in modular arithmetic, and keep the accumulator a `long`",
    "`(a - b) % m` can be negative; the safe form is `((a - b) % m + m) % m`",
  ],
};
