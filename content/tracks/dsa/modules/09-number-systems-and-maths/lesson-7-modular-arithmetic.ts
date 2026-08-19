import type { Lesson } from "@/content/types";

export const modularArithmeticLesson: Lesson = {
  id: "dsa-math-modular",
  slug: "modular-arithmetic",
  moduleSlug: "number-systems-and-maths",
  title: "Modular Arithmetic & 10⁹ + 7",
  summary:
    "Why every counting problem asks for the answer modulo a prime, which operations survive the reduction, and the negative-remainder bug that only appears in Java.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Explain why problems ask for an answer modulo 10⁹ + 7",
    "Reduce at every step so intermediates never overflow",
    "Know which operations distribute over the modulus and which do not",
    "Fix the negative-remainder difference between Python and Java",
  ],
  sections: [
    {
      id: "why-modulo",
      heading: "Why the answer is always modulo something",
      body: [
        "Counting problems — how many paths, how many arrangements, how many subsets — produce astronomically large answers. The number of paths across a 100×100 grid has 59 digits.",
        "The setter has two options: require big-integer arithmetic, which tests library knowledge rather than algorithms, or ask for the answer **modulo a fixed number**, which keeps every value inside a machine word while leaving the algorithm exactly as hard.",
        "They always take the second, and the number is nearly always **10⁹ + 7**.",
        "Three reasons for that specific value. It is **prime**, which makes modular division possible via inverses. It is **just under 2³⁰**, so a product of two reduced values fits comfortably in a 64-bit `long` — the largest such product is about 10¹⁸ against a `long` limit of 9.2 × 10¹⁸. And it is large enough that collisions are rare when it is used as a hashing modulus.",
      ],
      examples: [
        {
          id: "the-modulus",
          title: "The three properties of 10⁹ + 7",
          lang: "python",
          code: `MOD = 10 ** 9 + 7
LONG_MAX = 2 ** 63 - 1

print("MOD           =", MOD)
print("is prime      :", all(MOD % d for d in range(2, int(MOD ** 0.5) + 1)))
print("just under 2^30:", 2 ** 29 < MOD < 2 ** 30)

biggest = (MOD - 1) * (MOD - 1)
print()
print("largest product of two reduced values:", biggest)
print("long can hold                        :", LONG_MAX)
print("fits with room to spare               :", biggest < LONG_MAX)
print("headroom factor                       :", LONG_MAX // biggest)`,
          output: `MOD           = 1000000007
is prime      : True
just under 2^30: True

largest product of two reduced values: 1000000012000000036
long can hold                        : 9223372036854775807
fits with room to spare               : True
headroom factor                       : 9`,
          explanation:
            "That headroom is the whole design. Because two reduced values multiply to something nine times smaller than the `long` limit, you can multiply first and reduce afterwards without any risk — which is what makes the running-reduction pattern in the next section safe. A modulus near 2³² would not leave that room.",
        },
      ],
    },
    {
      id: "distribution",
      heading: "What survives the reduction",
      body: [
        "The rule that makes all of this work: **you may reduce at any point during addition, subtraction and multiplication.**",
        "(a + b) mod m = ((a mod m) + (b mod m)) mod m, and the same for − and ×.",
        "So instead of computing a huge value and reducing at the end, you reduce after every operation and the intermediates never grow. That is the entire technique.",
        "**Division does not distribute.** `(a / b) mod m` is not `((a mod m) / (b mod m)) mod m`, and the reason is that integer division throws away a remainder that the reduction has already scrambled. Dividing under a modulus needs a modular inverse, which is the last section.",
      ],
      examples: [
        {
          id: "distribution",
          title: "Three that work, one that does not",
          lang: "python",
          code: `MOD = 10 ** 9 + 7

a, b = 987654321, 123456789
print("addition      distributes:", (a + b) % MOD == ((a % MOD) + (b % MOD)) % MOD)
print("subtraction   distributes:", (a - b) % MOD == ((a % MOD) - (b % MOD)) % MOD)
print("multiplication distributes:", (a * b) % MOD == ((a % MOD) * (b % MOD)) % MOD)

p, q = 8_880_977_787_845, 129_944_532_029
print()
print("division does not:")
print("  (p // q) % MOD           =", (p // q) % MOD)
print("  ((p % MOD) // (q % MOD)) =", (p % MOD) // (q % MOD))`,
          output: `addition      distributes: True
subtraction   distributes: True
multiplication distributes: True

division does not:
  (p // q) % MOD           = 68
  ((p % MOD) // (q % MOD)) = 1`,
          explanation:
            "68 against 1 — not a rounding discrepancy, a completely different answer. This is why a solution that reduces everywhere and happens to contain one division is silently wrong, and why interview problems involving combinations always come with a note about modular inverses.",
        },
      ],
    },
    {
      id: "running-reduction",
      heading: "Reduce at every step",
      body: [
        "The pattern is one line, applied everywhere a value is updated:",
        "```\nresult = result * i % MOD\n```",
        "`result` is always below MOD before the multiplication, and `i` is too, so the product is at most (MOD − 1)² — inside a `long` with the nine-times headroom from the first section. Then the reduction brings it back below MOD, ready for the next step.",
        "The same shape works for sums (`total = (total + x) % MOD`), for dynamic-programming recurrences, and for the exponentiation-by-squaring loop from the last lesson, which is how you compute a huge power under a modulus.",
        "**Reduce as you go, never at the end.** Reducing only at the end means the intermediate has already overflowed, and the modulus of an overflowed value is garbage.",
      ],
      examples: [
        {
          id: "running",
          title: "Factorial and Fibonacci, reduced as they go",
          lang: "python",
          code: `import math

MOD = 10 ** 9 + 7


def factorial_mod(n):
    result = 1
    for i in range(2, n + 1):
        result = result * i % MOD
    return result


def fib_mod(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, (a + b) % MOD
    return a


for n in (10, 20, 30, 100, 1000):
    print(f"{n:>5}! mod 1e9+7 = {factorial_mod(n)}")

print()
for n in (10, 50, 90, 1000):
    print(f"fib({n:>4}) mod 1e9+7 = {fib_mod(n)}")

print()
print("30! checked against the exact value:", math.factorial(30) % MOD == factorial_mod(30))
print("fib(90) checked against 2880067194370816120:",
      2880067194370816120 % MOD == fib_mod(90))`,
          output: `   10! mod 1e9+7 = 3628800
   20! mod 1e9+7 = 146326063
   30! mod 1e9+7 = 109361473
  100! mod 1e9+7 = 437918130
 1000! mod 1e9+7 = 641419708

fib(  10) mod 1e9+7 = 55
fib(  50) mod 1e9+7 = 586268941
fib(  90) mod 1e9+7 = 210345902
fib(1000) mod 1e9+7 = 517691607

30! checked against the exact value: True
fib(90) checked against 2880067194370816120: True`,
          explanation:
            "1000! has 2,568 digits and this computes its residue in a thousand steps with nothing ever exceeding 10¹⁸. Note 10! comes out as 3,628,800 unchanged — small answers pass through the modulus untouched, which is what makes the reduced version safe to write even when you are not sure the answer is large.",
        },
      ],
      pitfalls: [
        {
          title: "Reducing only at the end",
          body: "`return factorial(n) % MOD` computes the full factorial first. In Python it is merely slow; in Java the value has already wrapped and the modulus of a wrapped value is meaningless. The reduction has to be inside the loop, on every update.",
        },
      ],
    },
    {
      id: "negatives",
      heading: "The negative remainder",
      body: [
        "This is the bug that catches everyone once, and it exists in Java and not in Python.",
        "**Java's `%` takes the sign of the dividend.** `(-3) % 7` is −3. **Python's `%` takes the sign of the divisor.** `(-3) % 7` is 4.",
        "Python's answer is the mathematically conventional one, always in `[0, m)`. Java's is not, so any subtraction under a modulus can produce a negative residue — and using that as an array index, or comparing it against an expected answer, fails.",
        "**The fix is `(x % m + m) % m`.** The first reduction brings it into (−m, m), adding m makes it positive, and the second reduction brings it back below m. Java also offers `Math.floorMod(x, m)`, which does exactly this and is clearer.",
      ],
      examples: [
        {
          id: "negatives-java",
          title: "Java: the sign, and the fix",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int m = 7;
        System.out.println((-3) % m);
        System.out.println(((-3) % m + m) % m);
        System.out.println(Math.floorMod(-3, m));

        long MOD = 1_000_000_007L;
        long a = 5, b = 9;
        System.out.println((a - b) % MOD);
        System.out.println(((a - b) % MOD + MOD) % MOD);
    }
}`,
          output: `-3
4
4
-4
1000000003`,
          explanation:
            "The last two lines are the realistic case: a subtraction in a dynamic-programming recurrence gives −4, where the correct residue is 1000000003. Python produces 1000000003 directly for the same expression. Write `(x % MOD + MOD) % MOD` after every subtraction in Java by reflex — it costs nothing when the value is already non-negative.",
        },
      ],
      pitfalls: [
        {
          title: "Using `%` to index an array in Java",
          body: "`arr[hash % arr.length]` throws `ArrayIndexOutOfBoundsException` for a negative hash, and hash codes are routinely negative. Use `Math.floorMod(hash, arr.length)`. This is the same bug as the modular one, in the place it does the most damage.",
        },
      ],
    },
    {
      id: "inverses",
      heading: "Dividing under a modulus",
      body: [
        "Since division does not distribute, dividing by b modulo m means **multiplying by the modular inverse of b** — the value b⁻¹ with b × b⁻¹ ≡ 1 (mod m).",
        "When m is prime and b is not a multiple of it, Fermat's little theorem gives the inverse directly: **b⁻¹ ≡ b^(m−2) (mod m)**, computed with the exponentiation-by-squaring loop from the last lesson. That is the reason the modulus is chosen prime.",
        "In Python it is one call: `pow(b, MOD - 2, MOD)`, or since 3.8 simply `pow(b, -1, MOD)`. The three-argument `pow` does the squaring loop internally and never builds the huge intermediate.",
        "This is what makes binomial coefficients computable under a modulus: `C(n, k) = n! × (k!)⁻¹ × ((n−k)!)⁻¹`, all reduced.",
      ],
      examples: [
        {
          id: "inverse",
          title: "Inverses, and a binomial coefficient",
          lang: "python",
          code: `import math

MOD = 10 ** 9 + 7

inv2 = pow(2, MOD - 2, MOD)
print("inverse of 2      :", inv2)
print("2 * inv2 % MOD    :", 2 * inv2 % MOD)
print("pow(2, -1, MOD)   :", pow(2, -1, MOD))
print("6 'divided by' 2  :", 6 * inv2 % MOD)


def binomial_mod(n, k):
    num = 1
    for i in range(n, n - k, -1):
        num = num * i % MOD
    den = 1
    for i in range(1, k + 1):
        den = den * i % MOD
    return num * pow(den, MOD - 2, MOD) % MOD


print()
for n, k in ((5, 2), (30, 15), (1000, 500)):
    print(f"C({n}, {k}) mod 1e9+7 = {binomial_mod(n, k)}")

print()
print("C(30, 15) checked exactly:", math.comb(30, 15) % MOD == binomial_mod(30, 15))
print("C(1000, 500) checked exactly:", math.comb(1000, 500) % MOD == binomial_mod(1000, 500))`,
          output: `inverse of 2      : 500000004
2 * inv2 % MOD    : 1
pow(2, -1, MOD)   : 500000004
6 'divided by' 2  : 3

C(5, 2) mod 1e9+7 = 10
C(30, 15) mod 1e9+7 = 155117520
C(1000, 500) mod 1e9+7 = 159835829

C(30, 15) checked exactly: True
C(1000, 500) checked exactly: True`,
          explanation:
            "500000004 is a strange-looking number that behaves exactly like ½: multiply it by 2 and you get 1, multiply it by 6 and you get 3. C(1000, 500) has 300 digits and the reduced computation never exceeds 10¹⁸. The exact checks with `math.comb` are the point — the residues are right, not merely plausible.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why do problems ask for the answer modulo 10⁹ + 7?",
      answer:
        "Because counting answers get astronomically large, and reducing them keeps every value in a machine word without making the algorithm any easier. That specific value is chosen because it is prime, which makes division possible via modular inverses under Fermat's little theorem; and because it is just under 2³⁰, so the product of two reduced values is about 10¹⁸ and fits in a 64-bit long with roughly nine times headroom — which is what makes multiply-then-reduce safe.",
    },
    {
      question: "Which operations can you reduce under, and which can't you?",
      answer:
        "Addition, subtraction and multiplication all distribute over the modulus, so you can reduce at any point and the answer is unchanged — that is what lets you reduce after every step and keep intermediates small. Division does not: `(a / b) % m` is generally nothing like `((a % m) / (b % m)) % m`, because integer division discards a remainder the reduction has already scrambled. Dividing means multiplying by the modular inverse, `pow(b, m - 2, m)` for prime m.",
    },
    {
      question: "What is the negative-remainder problem and how do you fix it?",
      answer:
        "Java's `%` takes the sign of the dividend, so `(-3) % 7` is −3 and any subtraction under a modulus can yield a negative residue — which breaks array indexing and comparisons. Python's `%` takes the sign of the divisor and returns 4, which is the mathematical convention. The fix in Java is `(x % m + m) % m`, or `Math.floorMod(x, m)`, applied after every subtraction. It costs nothing when the value is already non-negative.",
    },
  ],
  takeaways: [
    "10⁹ + 7 is prime and just under 2³⁰, so two reduced values multiply safely inside a long",
    "Addition, subtraction and multiplication distribute over the modulus; division does not",
    "Write `result = result * i % MOD` — reduce on every update, never only at the end",
    "Reducing at the end is meaningless in Java, because the value has already wrapped",
    "Java's `%` can return a negative; fix with `(x % m + m) % m` or `Math.floorMod`",
    "`Math.floorMod` is mandatory when a hash code is used as an array index",
    "Divide by multiplying by the inverse: `pow(b, MOD - 2, MOD)` for a prime modulus",
    "Binomial coefficients under a modulus are numerator × inverse-denominator, all reduced",
  ],
};
