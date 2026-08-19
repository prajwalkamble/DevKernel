import type { Lesson } from "@/content/types";

export const typeConversionLesson: Lesson = {
  id: "dsa-io-type-conversion",
  slug: "type-conversion",
  moduleSlug: "input-output-and-data-types",
  title: "Type Conversion: Widening, Casting & Parsing",
  summary:
    "Which conversions happen without asking, which need a cast, which lose information silently, and how to parse a string into a number without your program dying on bad input.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Predict which Java conversions are automatic and which need a cast",
    "Say what a narrowing cast does to a value that will not fit",
    "Parse strings to numbers in both languages, and handle failure",
    "Recognise the integer-division-before-conversion mistake",
  ],
  sections: [
    {
      id: "widening",
      heading: "Widening: the conversions Java does for you",
      body: [
        "Moving a value into a type that can hold everything the original could is a **widening** conversion, and Java performs it automatically because nothing can be lost.",
        "The chain is `byte` → `short` → `int` → `long` → `float` → `double`. Anything left to right is silent and safe.",
        "The consequence you meet daily: in a mixed expression, the narrower operand is promoted. `1 / 2` is 0, but `1 / 2.0` is 0.5, because the `1` becomes a `double` first.",
      ],
      examples: [
        {
          id: "widening",
          title: "Automatic promotion, and the one place it arrives too late",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int i = 5;
        long l = i;
        double d = i;
        System.out.println(l + " " + d);

        System.out.println(1 / 2);
        System.out.println(1 / 2.0);

        int a = 7, b = 2;
        double wrong = a / b;
        double right = (double) a / b;
        System.out.println(wrong + " " + right);
    }
}`,
          output: `5 5.0
0
0.5
3.0 3.5`,
          explanation:
            "The last pair is the mistake worth naming. `double wrong = a / b;` widens *after* the damage: `a / b` is integer division giving 3, and 3 is then converted to 3.0. The widening happened, it just happened one step too late. Exactly the same shape as `long x = a * b` overflowing — the type of the expression is decided by its operands, not by where you are putting the result.",
        },
      ],
    },
    {
      id: "narrowing",
      heading: "Narrowing: the conversions you must ask for",
      body: [
        "Going the other way can lose information, so Java refuses to do it implicitly. You write a cast, and the cast is you taking responsibility.",
        "Two different things get lost depending on direction. Casting `double` to `int` **truncates toward zero** — it does not round. Casting `long` to `int` **keeps the low 32 bits**, which can produce a completely unrelated number.",
      ],
      examples: [
        {
          id: "narrowing",
          title: "What each narrowing cast discards",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        System.out.println((int) 3.99);
        System.out.println((int) -3.99);
        System.out.println(Math.round(3.99));
        System.out.println((int) 3000000000L);
        System.out.println((byte) 200);
    }
}`,
          output: `3
-3
4
-1294967296
-56`,
          explanation:
            "`(int) 3.99` gives 3 and `(int) -3.99` gives −3 — truncation toward zero, not rounding, and not flooring either. `Math.round` is what you want when you mean rounding. The last two show bit truncation: 3,000,000,000 does not fit in an `int` and becomes an unrelated negative number, and 200 does not fit in a `byte` and becomes −56. All silent.",
        },
      ],
      pitfalls: [
        {
          title: "Casting when you meant rounding",
          body: "`(int) (x + 0.5)` is the old trick for rounding and it is wrong for negative numbers — `(int) (-2.5 + 0.5)` is −2, not −3. Use `Math.round`, which handles both signs, and remember it returns a `long` for a `double` input.",
        },
      ],
    },
    {
      id: "parsing",
      heading: "Parsing strings into numbers",
      body: [
        "Input arrives as text. Turning it into a number is a *parse*, not a cast, and it can fail — which is the part people forget until it fails.",
        "Java: `Integer.parseInt`, `Long.parseLong`, `Double.parseDouble`. They throw `NumberFormatException` on anything unparseable.",
        "Python: `int()`, `float()`. They raise `ValueError`.",
        "Both are strict about whitespace in different ways, and both are strict about a decimal point in an integer parse, which is the failure people actually hit.",
      ],
      examples: [
        {
          id: "parsing-python",
          title: "Python: what parses and what does not",
          lang: "python",
          code: `print(int("42"), int("-42"), int("  42  "))
print(float("3.5"), float("1e3"))
print(int("1010", 2), int("ff", 16))

for text in ["abc", "3.5", ""]:
    try:
        int(text)
    except ValueError as e:
        print(f"int({text!r}) failed: {e}")`,
          output: `42 -42 42
3.5 1000.0
10 255
int('abc') failed: invalid literal for int() with base 10: 'abc'
int('3.5') failed: invalid literal for int() with base 10: '3.5'
int('') failed: invalid literal for int() with base 10: ''`,
          explanation:
            "`int` tolerates surrounding whitespace, which is why reading a line and converting usually works without stripping. It does *not* tolerate a decimal point: `int(\"3.5\")` raises rather than truncating, and the fix is `int(float(\"3.5\"))` if truncation is what you want. The two-argument form parsing binary and hexadecimal is worth knowing for bit-manipulation problems.",
        },
        {
          id: "parsing-java",
          title: "Java: the same, with a checked failure",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        System.out.println(Integer.parseInt("42") + 1);
        System.out.println(Integer.parseInt("-42"));
        System.out.println(Integer.parseInt("1010", 2));

        System.out.println("42" + 1);
        System.out.println(String.valueOf(42) + 1);

        for (String text : new String[] { "abc", "3.5", " 42" }) {
            try {
                Integer.parseInt(text);
                System.out.println("parsed " + text);
            } catch (NumberFormatException e) {
                System.out.println("failed on [" + text + "]");
            }
        }
    }
}`,
          output: `43
-42
10
421
421
failed on [abc]
failed on [3.5]
failed on [ 42]`,
          explanation:
            "Two things. `\"42\" + 1` gives `421`, because `+` with a string concatenates — the difference between parsing and concatenating is the difference between 43 and 421, and it is a very easy typo. And unlike Python, Java's `parseInt` rejects leading whitespace, so `\" 42\"` fails; use `.trim()` when the input might carry any.",
        },
      ],
    },
    {
      id: "python-conversion",
      heading: "Python's conversions",
      body: [
        "Python has no widening or narrowing in the Java sense, because names have no declared types. What it has is explicit conversion functions, and one implicit promotion.",
        "**`int` to `float` happens automatically** in mixed arithmetic, exactly as in Java. `1 + 2.0` is 3.0.",
        "**Everything else is a function call.** `int(x)`, `float(x)`, `str(x)`, `list(x)`, `bool(x)`. Nothing converts implicitly between text and numbers, which is why `\"1\" + 1` is an error rather than a surprise.",
        "The one that behaves like a narrowing cast is `int()` on a float: it **truncates toward zero**, exactly like Java's cast — not `floor`, which differs on negatives.",
      ],
      examples: [
        {
          id: "python-truncation",
          title: "`int` truncates, `//` floors",
          lang: "python",
          code: `import math

print(int(3.99), int(-3.99))
print(math.floor(3.99), math.floor(-3.99))
print(round(3.99), round(-3.99))

print(7 // 2, -7 // 2)
print(int(7 / 2), int(-7 / 2))`,
          output: `3 -3
3 -4
4 -4
3 -4
3 -3`,
          explanation:
            "Three different roundings, all reasonable, all different on negatives. `int()` truncates toward zero giving −3; `math.floor` goes down giving −4; `round` goes to nearest giving −4. And the last two lines show `//` matching `floor` while `int(a / b)` matches truncation — which is precisely why the previous module warned that Java's `/` and Python's `//` disagree on negative operands.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between widening and narrowing conversion in Java?",
      answer:
        "Widening moves a value into a type that can represent everything the original could — `int` to `long`, `int` to `double` — and happens automatically because nothing is lost. Narrowing goes the other way and can lose information, so it requires an explicit cast. A `double` to `int` cast truncates toward zero; a `long` to `int` cast keeps only the low 32 bits and can produce a completely unrelated value. Both are silent, which is why the cast is the programmer accepting responsibility.",
    },
    {
      question: "Why does `double average = total / count;` give a whole number?",
      answer:
        "Because `total` and `count` are both `int`, so the division is integer division and truncates before anything is assigned. The widening to `double` happens afterwards, on an already-truncated value. The fix is to promote an operand first: `(double) total / count`. It is the same shape as `long x = a * b` overflowing — an expression's type is decided by its operands, not by the variable it is being stored in.",
    },
    {
      question: "How do you safely convert a string to an integer?",
      answer:
        "`Integer.parseInt` in Java, `int()` in Python, both wrapped in a try/catch or try/except — `NumberFormatException` and `ValueError` respectively. Neither accepts a decimal point in an integer parse, so `\"3.5\"` fails rather than truncating; parse as a float first if truncation is intended. Java also rejects surrounding whitespace where Python tolerates it, so `.trim()` is worth adding when the input comes from a line read.",
    },
  ],
  takeaways: [
    "Widening (`byte`→`short`→`int`→`long`→`float`→`double`) is automatic; narrowing needs a cast",
    "In mixed arithmetic the narrower operand is promoted, so `1 / 2.0` is 0.5",
    "`double wrong = a / b;` widens too late — the division already truncated",
    "`(int)` on a double truncates toward zero; `Math.round` rounds; `math.floor` floors",
    "`(int)` on a long keeps the low 32 bits and can produce an unrelated number",
    "Parsing can fail: `NumberFormatException` in Java, `ValueError` in Python",
    "Neither `parseInt` nor `int()` accepts a decimal point; parse as a float first if you want truncation",
    "Java's `parseInt` rejects surrounding whitespace, Python's `int()` tolerates it",
  ],
};
