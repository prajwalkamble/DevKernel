import type { Lesson } from "@/content/types";

export const variablesAndValuesLesson: Lesson = {
  id: "dsa-intro-variables-and-values",
  slug: "variables-and-values",
  moduleSlug: "introduction-to-programming",
  title: "Variables, Values & What They Cost",
  summary:
    "What a variable really is, why Java makes you declare a type and Python does not, and the first place a fixed-size box will silently give you a wrong answer.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Explain what happens in memory when you assign a value to a name",
    "Declare variables in both languages and say what the type annotation is for",
    "Predict the result of integer division and integer overflow before running the code",
    "Recognise the two arithmetic traps that produce wrong answers with no error message",
  ],
  sections: [
    {
      id: "what-a-variable-is",
      heading: "A name for a box",
      body: [
        "In the first lesson memory was described as a long row of numbered boxes. A variable is a *name* you have attached to one of those boxes so you never have to think about its number.",
        "That is worth being precise about, because the word \"variable\" suggests the thing that varies is the name, and it is not. The name stays put. What changes is the value in the box it points at.",
        "Two operations exist and it is worth separating them in your head from the start. **Declaring** is bringing a variable into existence. **Assigning** is putting a value into it. Python does both at once and never mentions it. Java lets you do them separately, and that difference is the reason the two languages feel so unalike.",
      ],
      examples: [
        {
          id: "declare-assign",
          title: "Declaring and assigning",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int count;              // declared: a box exists, nothing in it yet
        count = 5;              // assigned: the value 5 goes in
        int total = 10;         // both at once, which is what you normally write

        count = count + 1;      // read the box, add one, put it back
        System.out.println(count);
        System.out.println(total);
    }
}`,
          output: `6
10`,
          explanation:
            "`count = count + 1` reads oddly as mathematics and is the line worth pausing on. It is not an equation claiming `count` equals `count` plus one — nothing would satisfy that. `=` means *put the value on the right into the box on the left*, so this reads the current value, adds one, and stores the result back. Once you read `=` as \"becomes\" rather than \"equals\", it stops looking strange.",
        },
      ],
    },
    {
      id: "types",
      heading: "Why Java asks you for a type",
      body: [
        "The word `int` in `int count` is a **type**: a promise about what kind of value this box will hold. Java requires one for every variable. Python requires none.",
        "The reason for the difference is not arbitrary. A box has to be a particular size, and the type is how Java knows what size to make it — a whole number and a piece of text need very different amounts of room. Java decides this before the program runs; Python works it out as it goes, which is why a Python variable can hold a number on one line and text on the next.",
        "That flexibility costs something, and it is worth seeing what.",
      ],
      examples: [
        {
          id: "python-dynamic",
          title: "Python: the name does not care what it holds",
          lang: "python",
          code: `value = 42
print(value, type(value))

value = "now I am text"
print(value, type(value))

value = [1, 2, 3]
print(value, type(value))`,
          output: `42 <class 'int'>
now I am text <class 'str'>
[1, 2, 3] <class 'list'>`,
          explanation:
            "One name, three completely different kinds of value, no complaint. This is convenient and occasionally disastrous: if a function is supposed to return a number and returns text under some condition, nothing notices until something tries to do arithmetic on it — possibly a long way from the mistake.",
        },
        {
          id: "java-static",
          title: "Java: the type is a promise the compiler enforces",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int value = 42;
        value = "now I am text";
        System.out.println(value);
    }
}`,
          output: `Main.java:4: error: incompatible types: String cannot be converted to int
        value = "now I am text";
                ^
1 error
error: compilation failed`,
          explanation:
            "Refused, before the program ran. In exchange for having to write `int`, you get a guarantee that this box holds a whole number for its entire life — so every later line that does arithmetic on it is safe by construction. That is the trade in one screen: Python trusts you and finds out late, Java checks you and finds out early.",
        },
      ],
      pitfalls: [
        {
          title: "Thinking Python has no types",
          body: "It does — `type(value)` above proves it. The difference is *when* the type is attached: in Python it belongs to the value and travels with it, in Java it belongs to the variable and is fixed at compile time. The jargon is dynamic against static typing, and \"Python is untyped\" is simply wrong.",
        },
      ],
    },
    {
      id: "the-types-you-need",
      heading: "The types you actually need",
      body: [
        "Java has a lot of types. For this entire track you need five, and you will use two of them ninety per cent of the time.",
        "**`int`** — a whole number. This is your default for everything countable: indices, counts, sums, array values.",
        "**`long`** — a bigger whole number, for when `int` is not enough. The next section is about exactly when that is.",
        "**`double`** — a number with a fractional part. Avoid it whenever you can; comparing them for equality is unreliable, for reasons covered in the data-types module.",
        "**`boolean`** — `true` or `false`. What every condition evaluates to.",
        "**`char`** — a single character, written in single quotes: `'a'`. Note that `\"a\"` with double quotes is a `String`, which is a different type entirely, and mixing them up is a common early error.",
        "Python's equivalents are `int`, `float`, `bool` and `str`, and it has no separate character type — a single character is just a string of length one. Python's `int` has no size limit at all, which removes a whole category of bug and is genuinely one of the strongest arguments for practising in it.",
      ],
    },
    {
      id: "integer-division",
      heading: "The first trap: integer division",
      body: [
        "Here is a result that surprises nearly everyone once, and it is better for it to be now than during a contest.",
        "When you divide one whole number by another in Java, the answer is a whole number. The fractional part is not rounded — it is discarded. `7 / 2` is 3, not 3.5 and not 4.",
        "Python splits this into two operators to keep it explicit: `/` always produces a fractional result, and `//` does the whole-number division. That is a genuinely better design, and it means the trap in Python is the opposite one — getting a `float` where you wanted an `int`.",
      ],
      examples: [
        {
          id: "int-division-java",
          title: "Java: division between whole numbers throws the remainder away",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        System.out.println(7 / 2);
        System.out.println(1 / 2);
        System.out.println(7 / 2.0);
        System.out.println((double) 7 / 2);

        int total = 7;
        int count = 2;
        System.out.println("average: " + total / count);
        System.out.println("average: " + (double) total / count);
    }
}`,
          output: `3
0
3.5
3.5
average: 3
average: 3.5`,
          explanation:
            "`1 / 2` giving 0 is the one that bites hardest — it looks so obviously like a half. The fix is to make one side fractional, either by writing `2.0` or by casting with `(double)`. Note that casting one side is enough: once either operand is a `double`, the whole expression becomes one.",
        },
        {
          id: "int-division-python",
          title: "Python: two operators, no ambiguity",
          lang: "python",
          code: `print(7 / 2)
print(7 // 2)
print(1 / 2)
print(1 // 2)
print(-7 // 2)`,
          output: `3.5
3
0.5
0
-4`,
          explanation:
            "The last line is the one to remember. Python's `//` rounds *down* — towards negative infinity — so `-7 // 2` is −4, not −3. Java rounds towards zero and gives −3 for the same division. Any problem involving negative numbers and division needs you to know which language you are in, and this is the exact line that decides it.",
        },
      ],
      pitfalls: [
        {
          title: "Computing a midpoint with `(lo + hi) / 2` and expecting a fraction",
          body: "In binary search you *want* the whole-number division — it is the correct behaviour there, not a bug. The trap is the reverse: computing an average of scores or a percentage with integer division and quietly getting a truncated answer. When you want the fraction, say so.",
        },
      ],
    },
    {
      id: "overflow",
      heading: "The second trap: the box is only so big",
      body: [
        "A Java `int` occupies 32 bits, which means it can hold values from −2,147,483,648 to 2,147,483,647. That upper bound is about 2.1 billion, and it is closer than it sounds.",
        "What happens when you exceed it is the important part. The value does not become \"too big\", there is no error, and nothing warns you. It **wraps around** to the most negative value and keeps counting up from there. Your program carries on confidently with a wrong number.",
        "This is not exotic. Multiply two numbers around 100,000 — entirely ordinary sizes in a problem — and you have exceeded it.",
      ],
      examples: [
        {
          id: "overflow-java",
          title: "Java: silently wrong",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int max = 2147483647;
        System.out.println("max int      : " + max);
        System.out.println("max + 1      : " + (max + 1));

        int a = 100000;
        int b = 100000;
        System.out.println("a * b as int : " + (a * b));
        System.out.println("a * b as long: " + ((long) a * b));
    }
}`,
          output: `max int      : 2147483647
max + 1      : -2147483648
a * b as int : 1410065408
a * b as long: 10000000000`,
          explanation:
            "100,000 × 100,000 is ten billion. The `int` calculation reports 1,410,065,408 — not an error, not a warning, just a wrong number that every subsequent line will trust. Note where the cast goes in the fix: `(long) a * b` converts `a` first so the multiplication itself happens in 64 bits. Writing `(long) (a * b)` would be useless, because the damage is done inside the brackets before the cast runs.",
        },
        {
          id: "overflow-python",
          title: "Python: the box grows",
          lang: "python",
          code: `a = 100000
b = 100000
print(a * b)

print(2 ** 200)`,
          output: `10000000000
1606938044258990275541962092341162602522202993782792835301376`,
          explanation:
            "Python integers have no fixed size — they grow to hold whatever you put in them, limited only by memory. Two raised to the power of 200 is printed exactly. This single behaviour removes an entire class of silent wrong answers, and it is the strongest practical argument for solving problems in Python.",
        },
      ],
      pitfalls: [
        {
          title: "Casting after the overflow instead of before",
          body: "`long result = a * b;` does not help when `a` and `b` are both `int`. The multiplication happens in `int`, overflows, and the already-wrong answer is then widened to `long`. You must promote an operand before the operation: `long result = (long) a * b;`.",
        },
        {
          title: "Assuming a sum is safe because each element is",
          body: "An array of 100,000 values each up to 100,000 sums to 10 billion. Every individual element fits in an `int` comfortably; the total does not. Sums, products and prefix sums are where this bites, and the habit worth building is to make the accumulator a `long` by default.",
        },
      ],
    },
    {
      id: "naming",
      heading: "Naming, briefly",
      body: [
        "One rule, because it pays off immediately and there is a whole lesson on it later: a variable's name should say what it holds.",
        "`n`, `i`, `j` and `k` are fine and idiomatic for a size and for loop counters — everybody reads them correctly and expanding them adds nothing. Beyond those, spell it out. `maxSoFar` costs eight extra characters and saves you re-deriving what `m` meant when you come back to the code in an hour.",
        "Java uses `camelCase` for variables; Python uses `snake_case`. Both languages have strong conventions here and following them costs nothing.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is integer overflow, and how do you avoid it?",
      answer:
        "A fixed-width integer type has a maximum value — 2,147,483,647 for a 32-bit `int` — and exceeding it wraps around to the most negative value rather than raising an error, so the program continues with a wrong number. You avoid it by using a 64-bit `long` for anything that accumulates or multiplies, and by promoting before the operation rather than after: `(long) a * b`, not `(long) (a * b)`. Python is immune because its integers grow arbitrarily.",
    },
    {
      question: "What does `7 / 2` evaluate to, and why does it matter?",
      answer:
        "In Java, 3 — dividing two `int`s gives an `int`, and the fractional part is discarded rather than rounded. In Python, `/` gives 3.5 and `//` gives 3. It matters because the truncation is silent: an average or a percentage computed with integer division is simply wrong with no error. It is also worth knowing that Java truncates toward zero while Python's `//` floors toward negative infinity, so `-7 / 2` is −3 in Java and `-7 // 2` is −4 in Python.",
    },
    {
      question: "What is the difference between static and dynamic typing?",
      answer:
        "With static typing the type belongs to the variable and is fixed and checked before the program runs, so a type mismatch is a compile error. With dynamic typing the type belongs to the value and travels with it, so a variable can hold anything and mismatches surface at run time when an operation is attempted. Java is statically typed, Python dynamically. The trade is when you find out: early and with more ceremony, or late and with less.",
    },
  ],
  takeaways: [
    "A variable is a name attached to a box in memory; `=` means \"becomes\", not \"equals\"",
    "Java's type annotation tells the compiler how big the box is and is checked before the program runs",
    "Python attaches types to values rather than to names, so a name can hold anything",
    "You need five Java types for this track: `int`, `long`, `double`, `boolean`, `char`",
    "Integer division discards the remainder: `7 / 2` is 3 in Java, and `1 / 2` is 0",
    "Java truncates toward zero, Python's `//` floors toward negative infinity — they differ on negatives",
    "An `int` overflows silently past 2.1 billion; use `long` for sums and products, and cast before the operation",
    "Python integers grow without limit, which removes that whole class of bug",
  ],
};
