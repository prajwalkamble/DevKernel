import type { Lesson } from "@/content/types";

export const assignmentIncrementLesson: Lesson = {
  id: "dsa-ops-assignment",
  slug: "assignment-and-increment",
  moduleSlug: "operators-and-expressions",
  title: "Assignment, Compound Assignment & Increment",
  summary:
    "The shorthands, the hidden cast inside `+=`, the swap that needs no temporary, and why `i++` inside an expression is a habit worth not forming.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Use compound assignment operators and know what they silently do",
    "Swap two variables in both languages",
    "Explain the difference between `i++` and `++i` and when it can be observed",
    "Recognise multiple assignment and unpacking in Python",
  ],
  sections: [
    {
      id: "compound",
      heading: "Compound assignment",
      body: [
        "`x += 3` means `x = x + 3`, and the same shorthand exists for `-=`, `*=`, `/=`, `%=` and the bitwise operators. It is shorter to read and does not change what the machine does.",
        "There is one thing it does that the long form does not, and it is genuinely surprising: **Java's compound assignment includes an implicit cast back to the variable's type.**",
        "So `byte b = 10; b += 300;` compiles, while `b = b + 300;` does not. The first silently truncates; the second is rejected as a possible loss of precision. The shorthand is not merely shorter — it is quieter.",
      ],
      examples: [
        {
          id: "hidden-cast",
          title: "The cast hiding in `+=`",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int count = 5;
        count += 3;
        count *= 2;
        count -= 1;
        System.out.println(count);

        byte small = 10;
        small += 300;
        System.out.println("byte after += 300: " + small);

        int truncated = 7;
        truncated += 0.9;
        System.out.println("int after += 0.9 : " + truncated);
    }
}`,
          output: `15
byte after += 300: 54
int after += 0.9 : 7`,
          explanation:
            "Both surprises are the same mechanism. `small += 300` computes 310 and casts it back to `byte`, keeping the low 8 bits: 54. `truncated += 0.9` computes 7.9 and casts back to `int`, truncating to 7 — so a line that looks like it adds something adds nothing. Writing the long form in either case would have been a compile error, which is the outcome you would have wanted.",
        },
      ],
      pitfalls: [
        {
          title: "`+=` on a `long` accumulating an `int` product",
          body: "`total += a * b;` where `total` is `long` and `a`, `b` are `int` still computes `a * b` in `int` and overflows before the addition. Making the accumulator wide does not widen the expression — `total += (long) a * b;` does.",
        },
      ],
    },
    {
      id: "increment",
      heading: "`++` and `--`",
      body: [
        "Java has `x++` and `x--`. Python deliberately does not, which is why `i += 1` is the Python idiom and `i++` is a syntax error there.",
        "As a standalone statement, `x++` and `++x` are identical. The difference only appears when the increment is part of a larger expression: `x++` yields the value *before* incrementing, `++x` the value after.",
        "The advice is not to memorise which is which. It is to **only ever use `x++` as a whole statement**, so the distinction cannot matter. Code that depends on it is code that gets misread, including by the person who wrote it.",
      ],
      examples: [
        {
          id: "increment-in-expression",
          title: "Where the difference becomes visible",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int a = 5;
        System.out.println(a++);
        System.out.println(a);

        int b = 5;
        System.out.println(++b);
        System.out.println(b);

        int[] values = new int[3];
        int i = 0;
        values[i++] = 10;
        values[i++] = 20;
        System.out.println(java.util.Arrays.toString(values) + " i=" + i);
    }
}`,
          output: `5
6
6
6
[10, 20, 0] i=2`,
          explanation:
            "The array block is the one legitimate idiom: `values[i++] = 10` stores at the current position and then advances, which is the classic write-pointer pattern you will meet again in in-place array problems. It is worth recognising when reading. It is still worth writing as two lines when you are the author.",
        },
      ],
    },
    {
      id: "swapping",
      heading: "Swapping",
      body: [
        "Swapping two variables comes up constantly — reversing an array, partitioning, sorting by hand.",
        "Python has tuple unpacking, which does it in one line with no temporary and no thought. Java needs the temporary, and that is fine.",
        "You may have seen the XOR swap or the arithmetic swap presented as clever. They are not worth using: they are slower on modern processors, they break when both names refer to the same variable, and they obscure the intent. Use a temporary.",
      ],
      examples: [
        {
          id: "swap",
          title: "Both languages, and the clever version that is wrong",
          lang: "python",
          code: `a, b = 1, 2
a, b = b, a
print(a, b)

values = [1, 2, 3, 4]
i, j = 0, len(values) - 1
while i < j:
    values[i], values[j] = values[j], values[i]
    i += 1
    j -= 1
print(values)

# The "clever" XOR swap, applied to one variable twice.
x = 5
x = x ^ x
print("xor-swapped with itself:", x)`,
          output: `2 1
[4, 3, 2, 1]
xor-swapped with itself: 0`,
          explanation:
            "The middle block is an in-place reversal in four lines and is the pattern to keep. The last block shows why the XOR swap is a trap: when both operands are the same variable — which happens in a loop the moment `i == j` — it zeroes the value instead of leaving it alone. A temporary variable has no such failure mode.",
        },
      ],
    },
    {
      id: "multiple-assignment",
      heading: "Multiple assignment and unpacking",
      body: [
        "Python's `a, b = b, a` generalises. The right-hand side is built as a tuple first and then distributed, which is why the swap works — nothing is overwritten mid-way.",
        "The same syntax unpacks any sequence, which is how you read a pair from a line of input, iterate pairs, or return several values from a function.",
        "Java has none of this. Returning two values means an array, a small class, or a `record` — and `record` is the modern answer, being one line to declare.",
      ],
      examples: [
        {
          id: "unpacking",
          title: "Unpacking, and returning two things",
          lang: "python",
          code: `rows, cols = 3, 4
print(rows, cols)

first, *rest = [1, 2, 3, 4]
print(first, rest)

pairs = [(1, "a"), (2, "b")]
for number, letter in pairs:
    print(number, letter)


def divide(a, b):
    return a // b, a % b


quotient, remainder = divide(17, 5)
print(quotient, remainder)`,
          output: `3 4
1 [2, 3, 4]
1 a
2 b
3 2`,
          explanation:
            "`first, *rest = values` splits head from tail in one line and is idiomatic. Returning a tuple and unpacking it at the call site — `quotient, remainder = divide(...)` — is how Python returns several values, and it is why Python functions rarely need an output parameter or a wrapper class. Java's equivalent is `record Result(int quotient, int remainder) {}`.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between `i++` and `++i`?",
      answer:
        "Both increment by one; they differ in the value the expression itself yields. `i++` evaluates to the value before the increment, `++i` to the value after. As a standalone statement they are interchangeable and the difference is unobservable. Inside a larger expression it is real — `values[i++] = x` writes then advances — but code that depends on it is easy to misread, so the safe habit is to use `i++` only as a whole statement.",
    },
    {
      question: "Why does `byte b = 10; b += 300;` compile when `b = b + 300;` does not?",
      answer:
        "Because Java's compound assignment operators include an implicit narrowing cast back to the variable's type. `b + 300` is an `int` expression and assigning it to a `byte` is rejected as a possible loss of precision, but `b += 300` silently casts the result back, keeping the low eight bits and giving 54. The same mechanism makes `int x = 7; x += 0.9;` leave `x` at 7 — the shorthand is quieter, not just shorter.",
    },
    {
      question: "How do you swap two variables, and is the XOR trick worth using?",
      answer:
        "In Python, `a, b = b, a`. In Java, a temporary variable. The XOR and arithmetic swaps are not worth using: they are no faster on any modern processor, they obscure intent, and critically they fail when both operands are the same variable — `x ^= x` zeroes it — which happens naturally in a reversal loop when the two indices meet. A temporary has no such failure mode.",
    },
  ],
  takeaways: [
    "`x += 3` is `x = x + 3`, plus an implicit cast back to the variable's type in Java",
    "That cast makes `byte b; b += 300;` compile and truncate, and `int x; x += 0.9;` do nothing",
    "A wide accumulator does not widen the expression: `total += (long) a * b;`",
    "Java has `++`; Python deliberately does not, so `i += 1` is the idiom",
    "`i++` yields the old value, `++i` the new one — use either only as a whole statement",
    "`values[i++] = x` is the write-pointer idiom, worth recognising when reading",
    "`a, b = b, a` swaps in Python; Java uses a temporary, and the XOR trick fails when the operands coincide",
    "Python unpacking returns several values naturally; Java's modern equivalent is a `record`",
  ],
};
