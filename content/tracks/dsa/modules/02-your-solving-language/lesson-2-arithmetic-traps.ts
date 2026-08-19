import type { Lesson } from "@/content/types";

export const arithmeticTrapsLesson: Lesson = {
  id: "dsa-lang-arithmetic-traps",
  slug: "overflow-division-and-ceilings",
  moduleSlug: "your-solving-language",
  title: "Overflow, Division & the Ceiling That Is Not a Ceiling",
  summary:
    "Four arithmetic behaviours that produce wrong answers with no error message: silent overflow, truncating division, `Math.ceil` on integers, and negative modulo.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Choose between `int` and `long` correctly, and cast in the right place",
    "Compute a ceiling division without floating point, in both languages",
    "Predict what `%` does with a negative operand in each language",
    "Recognise the three places overflow actually happens in practice",
  ],
  sections: [
    {
      id: "where-overflow-happens",
      heading: "Where overflow actually happens",
      body: [
        "You met overflow in the previous module: a Java `int` holds up to 2,147,483,647, and exceeding it wraps to a negative number silently. Knowing that is not the same as spotting it, so here are the three places it actually occurs in problem solving. Almost every real instance is one of these.",
        "**Sums over an array.** n up to 10⁵ with values up to 10⁹ gives a total up to 10¹⁴. Each element fits in an `int` comfortably; the sum does not, by five orders of magnitude.",
        "**Products of two values.** Two numbers around 10⁵ multiply to 10¹⁰. This is the one that catches people computing areas, or a count of pairs as `n * (n - 1) / 2`.",
        "**Midpoints in binary search.** `(lo + hi) / 2` overflows when both are near the maximum, which is exactly the case a stress test will find.",
        "The defence is a habit rather than vigilance: **make the accumulator a `long` by default**. It costs nothing and removes the need to estimate the maximum every time.",
      ],
      examples: [
        {
          id: "cast-placement",
          title: "Where the cast goes decides whether it works",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int a = 100000;
        int b = 100000;

        long wrong = a * b;              // multiplied as int, then widened
        long right = (long) a * b;       // promoted first, multiplied as long

        System.out.println("wrong: " + wrong);
        System.out.println("right: " + right);

        int lo = 2000000000;
        int hi = 2000000010;
        System.out.println("bad mid : " + ((lo + hi) / 2));
        System.out.println("good mid: " + (lo + (hi - lo) / 2));
    }
}`,
          output: `wrong: 1410065408
right: 10000000000
bad mid : -147483643
good mid: 2000000005`,
          explanation:
            "`long wrong = a * b;` does not help, because the multiplication happens in `int` and overflows before anything is widened — the damage is done on the right-hand side of the `=`. And the bad midpoint is not merely wrong, it is *negative*, which in a binary search means indexing an array at a negative position and crashing somewhere that looks unrelated to the arithmetic.",
        },
      ],
      pitfalls: [
        {
          title: "`(long) (a * b)`",
          body: "The brackets put the cast after the overflow. It converts an already-wrong `int` into an equally wrong `long`. The cast must touch an operand: `(long) a * b`.",
        },
      ],
    },
    {
      id: "truncating-division",
      heading: "Division truncates, and the two languages truncate differently",
      body: [
        "Dividing two integers gives an integer. Java discards the fractional part toward zero; Python's `//` rounds down toward negative infinity. For positive numbers they agree. For negative numbers they do not, and the disagreement is one apart.",
        "This matters more than it sounds, because index arithmetic on a shifted array, or bucketing values that can be negative, both run straight into it.",
      ],
      examples: [
        {
          id: "division-both",
          title: "The same divisions in both languages",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        System.out.println(7 / 2);
        System.out.println(-7 / 2);
        System.out.println(Math.floorDiv(-7, 2));
    }
}`,
          output: `3
-3
-4`,
          explanation:
            "Java's `/` truncates toward zero, so `-7 / 2` is −3. `Math.floorDiv` gives the Python behaviour when you want it. Knowing both exist means you can say which you need rather than discovering it from a failing test.",
        },
        {
          id: "division-python",
          title: "Python's two operators",
          lang: "python",
          code: `print(7 / 2)
print(7 // 2)
print(-7 // 2)
print(int(-7 / 2))`,
          output: `3.5
3
-4
-3`,
          explanation:
            "`//` floors, giving −4. If you want Java's truncate-toward-zero, `int(-7 / 2)` gives −3 — though it goes through a float on the way, which is unsafe for very large integers. The clean version is `-(-7 // 2)` for exact truncation of a negative, or simply deciding which rounding you actually want.",
        },
      ],
    },
    {
      id: "ceiling",
      heading: "The ceiling that is not a ceiling",
      body: [
        "You need `ceil(a / b)` constantly: how many buckets of size b hold a items, how many hours at speed b to eat a bananas, how many pages of n results at m per page. It is one of the most common small computations in problem solving.",
        "The obvious spelling is a bug.",
      ],
      examples: [
        {
          id: "ceil-trap",
          title: "`Math.ceil` on two integers does nothing",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int a = 7, b = 2;

        System.out.println(Math.ceil(a / b));
        System.out.println((int) Math.ceil((double) a / b));
        System.out.println((a + b - 1) / b);
    }
}`,
          output: `3.0
4
4`,
          explanation:
            "The first line is the trap and it is a good one: `a / b` is integer division and is already 3 before `Math.ceil` ever sees it, so the ceiling of 3 is 3. Nothing warns you — you get a plausible number that is one too small, in exactly the problems where being one too small means a wrong answer. The second line fixes it by forcing a real division first. The third is better still.",
        },
        {
          id: "ceil-integer",
          title: "Ceiling division without touching a float",
          lang: "python",
          code: `a, b = 7, 2
print((a + b - 1) // b)
print(-(-a // b))

# it must hold when the division is exact, too
a, b = 8, 2
print((a + b - 1) // b)
print(-(-a // b))`,
          output: `4
4
4
4`,
          explanation:
            "Two integer-only spellings, both correct. `(a + b - 1) // b` is the standard one and reads as \"round up by adding just under a whole bucket first\"; watch that `a + b - 1` for overflow in Java. `-(-a // b)` is the Python idiom — floor the negative, negate back — and cannot overflow. Note both give 4 for `8 / 2`, not 5: a correct ceiling must not round up a value that is already exact, which is the case a hand-written version usually gets wrong.",
        },
      ],
      pitfalls: [
        {
          title: "Using floating point for ceilings on large values",
          body: "`(double) a / b` is fine for ordinary sizes and stops being fine past 2⁵³, where a `double` can no longer represent every integer exactly. At that point the division is approximate and the ceiling can come out one too high or too low. Constraints reaching 10¹⁸ are common in binary-search-on-the-answer problems, so prefer the integer form as a habit.",
        },
      ],
    },
    {
      id: "modulo",
      heading: "Negative modulo, where the languages disagree outright",
      body: [
        "`%` on negatives is the difference that catches the most people, because both behaviours are defensible and the languages chose differently.",
        "**Java** takes the sign of the *dividend*: `-7 % 3` is −1.",
        "**Python** takes the sign of the *divisor*: `-7 % 3` is 2.",
        "Python's is what you almost always want, because a remainder used as an index or a bucket must be non-negative. Java's requires a correction, and forgetting it produces a negative array index.",
      ],
      examples: [
        {
          id: "modulo-java",
          title: "Java: the sign follows the dividend",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        System.out.println(-7 % 3);
        System.out.println(Math.floorMod(-7, 3));
        System.out.println(((-7 % 3) + 3) % 3);
    }
}`,
          output: `-1
2
2`,
          explanation:
            "`Math.floorMod` is the clean fix and most people do not know it exists. The third line is the manual idiom — add the modulus and take the remainder again — which you will see in a lot of code and should recognise. Both give 2, which is the value that is safe to use as an index.",
        },
        {
          id: "modulo-python",
          title: "Python: the sign follows the divisor",
          lang: "python",
          code: `print(-7 % 3)
print(7 % -3)
print([i % 3 for i in range(-4, 5)])`,
          output: `2
-2
[2, 0, 1, 2, 0, 1, 2, 0, 1]`,
          explanation:
            "The list is the useful part: every result is in 0..2 for a positive modulus, whatever the input sign, which is exactly the property that makes `%` safe for wrapping an index or hashing into buckets. Java gives you −1, −2 and 0 in that same range, and an array indexed with those crashes.",
        },
      ],
    },
    {
      id: "checklist",
      heading: "The checklist",
      body: [
        "Five habits. Adopt them once and this whole lesson stops being something you have to remember.",
        "**Accumulators are `long`.** Sums, products and counters, by default, in Java.",
        "**Cast before the operation.** `(long) a * b`, never `(long) (a * b)`.",
        "**Midpoints are `lo + (hi - lo) / 2`.** Always, even when you are sure the values are small.",
        "**Ceilings are `(a + b - 1) / b`.** Never `Math.ceil` on two integers.",
        "**Modulo on possibly-negative values gets `Math.floorMod` in Java**, and needs no thought in Python.",
        "None of these cost anything. Every one of them prevents a wrong answer that comes with no error message and no obvious place to look.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you compute the ceiling of a division without floating point?",
      answer:
        "`(a + b - 1) / b` for non-negative `a` and positive `b`. It adds just under one whole divisor before truncating, which rounds up unless the division was already exact. Using `Math.ceil(a / b)` on two integers does nothing, because integer division has already truncated before `ceil` is called; and `Math.ceil((double) a / b)` works but loses exactness beyond 2⁵³, which matters when constraints reach 10¹⁸. Watch `a + b - 1` for overflow in a fixed-width type.",
    },
    {
      question: "What does `-7 % 3` give, and why does it matter?",
      answer:
        "−1 in Java, 2 in Python. Java takes the sign of the dividend, Python the sign of the divisor. It matters whenever the remainder is used as an index or a bucket, because a negative index crashes: hashing a possibly-negative key into a table, or wrapping a circular buffer. In Java the fix is `Math.floorMod(a, b)`, or the idiom `((a % b) + b) % b`.",
    },
    {
      question: "Why is `(lo + hi) / 2` a bug in binary search?",
      answer:
        "Because `lo + hi` can overflow when both are large, wrapping to a negative value, and the search then indexes at a negative position. `lo + (hi - lo) / 2` computes the same midpoint without forming the large sum, since `hi - lo` is bounded by the array length. It is a real bug that sat in Java's own `Arrays.binarySearch` for nine years before being found, which is a good illustration of how invisible overflow is.",
    },
  ],
  takeaways: [
    "Overflow shows up in three places: sums over arrays, products of two values, and binary-search midpoints",
    "Make accumulators `long` by default rather than estimating the maximum each time",
    "`(long) a * b` promotes before multiplying; `(long) (a * b)` widens an already-wrong answer",
    "Java's `/` truncates toward zero, Python's `//` floors — they differ by one on negatives",
    "`Math.ceil(a / b)` on two integers does nothing; the division already truncated",
    "Ceiling division is `(a + b - 1) / b`, or `-(-a // b)` in Python, and both must leave exact divisions alone",
    "`-7 % 3` is −1 in Java and 2 in Python; use `Math.floorMod` when the result becomes an index",
  ],
};
