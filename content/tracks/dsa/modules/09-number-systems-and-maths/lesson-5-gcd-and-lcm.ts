import type { Lesson } from "@/content/types";

export const gcdAndLcmLesson: Lesson = {
  id: "dsa-math-gcd",
  slug: "gcd-lcm-and-euclid",
  moduleSlug: "number-systems-and-maths",
  title: "GCD, LCM & Euclid's Algorithm",
  summary:
    "The oldest algorithm still in use, why the modulo version is exponentially faster than the subtraction one, and the operation order that keeps LCM from overflowing.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Compute a GCD with Euclid's algorithm, iteratively and recursively",
    "Explain why replacing subtraction with modulo changes the complexity class",
    "Derive LCM from GCD and order the operations to avoid overflow",
    "Handle the zero and negative edge cases both languages define differently",
  ],
  sections: [
    {
      id: "euclid",
      heading: "Euclid's algorithm",
      body: [
        "The greatest common divisor of a and b is the largest number dividing both. The algorithm for it is from around 300 BC and is still the one everybody uses.",
        "**The insight:** any number dividing both a and b also divides a − b. So gcd(a, b) = gcd(a − b, b), and repeatedly subtracting the smaller from the larger eventually leaves two equal numbers, which is the answer.",
        "**The improvement:** repeatedly subtracting b from a is just computing a mod b the slow way. So gcd(a, b) = gcd(b, a mod b), and you recurse until the second argument is zero.",
        "That substitution is not a constant-factor tidy-up. It changes the number of steps from proportional to the *values* to proportional to their *number of digits*.",
      ],
      examples: [
        {
          id: "two-versions",
          title: "Subtraction against modulo, counted",
          lang: "python",
          code: `def gcd_subtract(a, b):
    steps = 0
    while a != b:
        steps += 1
        if a > b:
            a -= b
        else:
            b -= a
    return a, steps


def gcd_mod(a, b):
    steps = 0
    while b:
        steps += 1
        a, b = b, a % b
    return a, steps


for a, b in ((48, 18), (1071, 462), (1000000, 3)):
    s = gcd_subtract(a, b)
    m = gcd_mod(a, b)
    print(f"gcd({a}, {b}) = {m[0]}   subtraction: {s[1]} steps   modulo: {m[1]} steps")`,
          output: `gcd(48, 18) = 6   subtraction: 4 steps   modulo: 3 steps
gcd(1071, 462) = 21   subtraction: 11 steps   modulo: 3 steps
gcd(1000000, 3) = 1   subtraction: 333335 steps   modulo: 2 steps`,
          explanation:
            "The last row is the argument. When one number is far larger than the other, subtraction spends a third of a million steps grinding it down and modulo does it in one. The subtraction version is O(max(a, b)); the modulo version is O(log min(a, b)). Same idea, different complexity class — a good example of an algorithmic improvement that comes from noticing a loop is really an arithmetic operation.",
        },
        {
          id: "trace",
          title: "The three steps of gcd(1071, 462)",
          lang: "python",
          code: `def gcd(a, b):
    while b:
        print(f"  gcd({a}, {b})  ->  a % b = {a % b}")
        a, b = b, a % b
    return a


print("tracing gcd(1071, 462):")
print("result:", gcd(1071, 462))`,
          output: `tracing gcd(1071, 462):
  gcd(1071, 462)  ->  a % b = 147
  gcd(462, 147)  ->  a % b = 21
  gcd(147, 21)  ->  a % b = 0
result: 21`,
          explanation:
            "The second argument shrinks fast — 462, 147, 21 — and the answer is whatever `a` holds when `b` reaches zero. That is the base case people get backwards: **the result is `a`, not `b`.** The tuple assignment does the swap and the modulo in one statement; in Java you need a temporary, or the two-line recursion `return b == 0 ? a : gcd(b, a % b);`.",
        },
      ],
      pitfalls: [
        {
          title: "Returning `b` at the base case",
          body: "When the loop ends, `b` is zero and `a` is the answer. Writing `return b` returns zero for every input, which is a silent wrong answer rather than a crash — and it passes the test where the expected answer happens to be involved in a zero. Trace one small case by hand the first time you write it.",
        },
      ],
    },
    {
      id: "lcm",
      heading: "LCM, and the multiplication that overflows",
      body: [
        "The least common multiple has no separate algorithm. It comes straight from the GCD:",
        "**lcm(a, b) = a × b ÷ gcd(a, b)**",
        "The intuition: a × b counts every shared factor twice, and dividing by the GCD removes exactly one copy of the shared part.",
        "The practical detail is the **order of operations**. `a * b / g` computes the product first, which can overflow before the division brings it back into range. `a / g * b` divides first — and the division is exact, since g divides a — so the intermediate value never exceeds the answer.",
        "That is not a micro-optimisation. In Java it is the difference between a correct answer and a wrong one.",
      ],
      examples: [
        {
          id: "lcm-java",
          title: "Java: the same formula, two orders",
          lang: "java",
          code: `public class Main {
    static int gcd(int a, int b) {
        return b == 0 ? a : gcd(b, a % b);
    }

    public static void main(String[] args) {
        int a = 1_000_000, b = 800_000;
        int g = gcd(a, b);
        System.out.println("gcd = " + g);
        System.out.println("a * b / g = " + (a * b / g));
        System.out.println("a / g * b = " + (a / g * b));
        System.out.println("true lcm  = " + ((long) a / g * b));
    }
}`,
          output: `gcd = 200000
a * b / g = 5680
a / g * b = 4000000
true lcm  = 4000000`,
          explanation:
            "5,680 against 4,000,000, from the same formula written two ways. `a * b` is 800 billion, far past the `int` range, so it wraps and the subsequent division divides garbage. Dividing first keeps every intermediate at or below the final answer. Widening to `long` is the belt-and-braces version and is what you should write when the inputs are near the limits.",
        },
        {
          id: "lcm-python",
          title: "Python: the library, and the edge cases",
          lang: "python",
          code: `import math


def lcm(a, b):
    if a == 0 or b == 0:
        return 0
    return a // math.gcd(a, b) * b


for a, b in ((4, 6), (12, 18), (7, 13), (0, 5)):
    g = math.gcd(a, b)
    print(f"a={a:>3} b={b:>3}   gcd {g:>3}   lcm {lcm(a, b):>3}   a*b {a * b:>4}")

print()
print("edge cases:", math.gcd(0, 5), math.gcd(0, 0), math.gcd(-12, 18))
print("multi-argument:", math.gcd(12, 18, 24), math.lcm(4, 6, 10))`,
          output: `a=  4 b=  6   gcd   2   lcm  12   a*b   24
a= 12 b= 18   gcd   6   lcm  36   a*b  216
a=  7 b= 13   gcd   1   lcm  91   a*b   91
a=  0 b=  5   gcd   5   lcm   0   a*b    0

edge cases: 5 0 6
multi-argument: 6 60`,
          explanation:
            "Three conventions worth committing to memory. `gcd(0, n)` is n, because everything divides zero. `gcd(0, 0)` is 0 by definition, and it is the input that makes the LCM formula divide by zero, hence the explicit guard. And `math.gcd` returns a non-negative result for negative inputs. The coprime row — 7 and 13 — shows the check that the formula is sensible: when the GCD is 1 the LCM is the plain product.",
        },
      ],
      pitfalls: [
        {
          title: "`lcm(0, n)` divides by zero",
          body: "Only when both arguments are zero, since `math.gcd(0, 0)` is 0. Python's own `math.lcm` handles it and returns 0; a hand-written version needs the guard. Whenever a formula has a division, ask what makes the denominator zero and write the case out.",
        },
      ],
    },
    {
      id: "where-it-shows-up",
      heading: "Where GCD actually appears",
      body: [
        "It is far more common in problems than the topic name suggests, usually as a hidden subproblem.",
        "**Reducing fractions.** Divide numerator and denominator by their GCD. Any problem returning a ratio wants this.",
        "**Cycles and repetition.** How many steps before two rotating things realign is an LCM. How many distinct cycles a rotation by k splits n positions into is a GCD.",
        "**Collinear points and slopes.** Comparing slopes exactly means comparing reduced fractions — a GCD — because comparing them as floats fails on precision.",
        "**Array-wide GCD.** `gcd(gcd(gcd(a, b), c), d)` and so on, because GCD is associative. It short-circuits usefully: once the running GCD hits 1 you can stop.",
      ],
      examples: [
        {
          id: "applications",
          title: "Reducing fractions and folding across an array",
          lang: "python",
          code: `from functools import reduce
import math


def reduce_fraction(num, den):
    g = math.gcd(num, den)
    return num // g, den // g


for num, den in ((6, 8), (100, 75), (7, 13), (0, 5)):
    print(f"{num}/{den} -> {reduce_fraction(num, den)}")

print()
values = [12, 18, 24, 30]
print("gcd of the whole array:", reduce(math.gcd, values))
print("lcm of the whole array:", reduce(math.lcm, values))


def array_gcd_early_exit(values):
    g = 0
    for i, v in enumerate(values):
        g = math.gcd(g, v)
        if g == 1:
            return 1, i + 1
    return g, len(values)

print("with an early exit:", array_gcd_early_exit([12, 18, 24, 30]))
print("coprime pair stops early:", array_gcd_early_exit([12, 7, 24, 30]))`,
          output: `6/8 -> (3, 4)
100/75 -> (4, 3)
7/13 -> (7, 13)
0/5 -> (0, 1)

gcd of the whole array: 6
lcm of the whole array: 360
with an early exit: (6, 4)
coprime pair stops early: (1, 2)`,
          explanation:
            "Folding `gcd` across an array works because the operation is associative, and starting the accumulator at **0** rather than 1 is the trick that makes it clean — `gcd(0, x)` is x, so zero is the identity element. The early exit matters on long arrays: once the running GCD is 1 no later value can change it, and the coprime pair here stops after two elements instead of four.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does Euclid's algorithm work and why is the modulo version faster?",
      answer:
        "Any divisor of a and b also divides a − b, so gcd(a, b) = gcd(a − b, b); repeated subtraction reaches the answer. Replacing repeated subtraction with `a mod b` gives gcd(a, b) = gcd(b, a mod b), recursing until the second argument is zero, at which point the first holds the answer. The subtraction form is O(max(a, b)) and the modulo form is O(log min(a, b)) — for gcd(1000000, 3) that is 333,335 steps against 2.",
    },
    {
      question: "How do you compute an LCM, and what is the trap?",
      answer:
        "lcm(a, b) = a × b ÷ gcd(a, b), because the product double-counts the shared factors and dividing by the GCD removes one copy. The trap is operation order: `a * b / g` can overflow before the division rescues it, while `a / g * b` divides first — exactly, since g divides a — so no intermediate exceeds the answer. In Java with a = 1,000,000 and b = 800,000 the first form gives 5,680 and the second gives the correct 4,000,000. Guard the both-zero case, which makes the GCD zero.",
    },
    {
      question: "How do you compute the GCD of a whole array?",
      answer:
        "Fold it: GCD is associative, so a running accumulator over the elements works. Start the accumulator at 0, because gcd(0, x) is x, which makes 0 the identity element and removes any special case for the first element. Add an early exit when the running GCD reaches 1 — no later value can change it, so the rest of the array can be skipped.",
    },
  ],
  takeaways: [
    "gcd(a, b) = gcd(b, a mod b), recursing until b is zero; the answer is then `a`",
    "The modulo form is O(log min(a, b)); the subtraction form is O(max(a, b))",
    "lcm(a, b) = a ÷ gcd × b — divide first, or the product can overflow",
    "gcd(0, n) is n and gcd(0, 0) is 0, which is the input that breaks the LCM formula",
    "GCD is associative, so fold it across an array with 0 as the starting accumulator",
    "Stop early once a running GCD reaches 1",
    "Reduce fractions by their GCD whenever comparing ratios exactly",
    "Realignment questions are LCMs; cycle-count questions are GCDs",
  ],
};
