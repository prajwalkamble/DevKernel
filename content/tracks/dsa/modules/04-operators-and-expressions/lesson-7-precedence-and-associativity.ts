import type { Lesson } from "@/content/types";

export const precedenceLesson: Lesson = {
  id: "dsa-ops-precedence",
  slug: "precedence-and-associativity",
  moduleSlug: "operators-and-expressions",
  title: "Precedence, Associativity & When to Stop Memorising",
  summary:
    "The five precedence bands worth knowing, the two places the parse genuinely surprises people, and the rule that makes the rest unnecessary.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "State the five precedence bands from tightest to loosest",
    "Explain associativity and predict `10 - 4 - 3` and `a = b = c`",
    "Identify the two expressions whose parse is genuinely surprising",
    "Apply a rule that removes the need to memorise the full table",
  ],
  sections: [
    {
      id: "bands",
      heading: "Five bands, not thirty rules",
      body: [
        "Both languages have a precedence table of about fifteen levels. You do not need it. You need five bands, and after that you use brackets.",
        "**1 — unary.** `!`, `~`, unary `-`, and Java's `++`/`--`. Tightest.",
        "**2 — multiplicative.** `*`, `/`, `%`.",
        "**3 — additive.** `+`, `-`.",
        "**4 — shifts, then relational, then equality.** `<<` `>>`, then `<` `<=` `>` `>=`, then `==` `!=`.",
        "**5 — bitwise, then logical.** `&`, then `^`, then `|`, then `&&`, then `||`. Loosest.",
        "That is Java's ordering. Python agrees on everything except one thing: it places the bitwise operators *tighter* than comparison rather than looser, which is the subject of the next section and the only precedence difference between the two languages you will meet.",
      ],
    },
    {
      id: "associativity",
      heading: "Associativity: what happens on a tie",
      body: [
        "When two operators have equal precedence, associativity decides the grouping. Almost everything groups **left to right**, which is why `10 - 4 - 3` is `(10 - 4) - 3` and equals 3 rather than 9.",
        "The exceptions are assignment and Python's `**`, both of which group **right to left**. `a = b = 0` means `a = (b = 0)`, and `2 ** 3 ** 2` means `2 ** (3 ** 2)` — which is 512, not 64.",
      ],
      examples: [
        {
          id: "associativity",
          title: "Where the grouping shows",
          lang: "python",
          code: `print(10 - 4 - 3)
print(10 - (4 - 3))

print(2 ** 3 ** 2)
print((2 ** 3) ** 2)

print(100 / 10 / 2)
print(100 / (10 / 2))

a = b = 0
print(a, b)`,
          output: `3
9
512
64
5.0
20.0
0 0`,
          explanation:
            "Every pair differs, and in each case the first line is what the language does. `2 ** 3 ** 2` is the one that surprises: exponentiation is right-associative to match mathematical convention, so it is 2⁹ and not 8². Java has no `**` at all, so this particular surprise is Python-only.",
        },
      ],
    },
    {
      id: "surprise-one",
      heading: "Surprise one: `&` and `==`, where the languages disagree",
      body: [
        "The two languages put the bitwise operators on opposite sides of comparison, and this is the one precedence difference between them that produces real bugs.",
        "**Java** puts `==` *tighter* than `&`, inheriting the rule from C. So `x & 1 == 0` parses as `x & (1 == 0)` — and since you cannot AND an `int` with a `boolean`, it is a compile error. Java's type system rescues you from a mistake its precedence table created.",
        "**Python** puts `&` tighter than `==`. So `x & 1 == 0` parses as `(x & 1) == 0`, which is what you meant.",
        "So the expression is correct in Python and refuses to compile in Java. That is a genuinely awkward pair of behaviours to hold in your head, and the resolution is not to hold it: bracket, and the difference stops existing.",
      ],
      examples: [
        {
          id: "bitwise-precedence",
          title: "Python parses it the way you meant",
          lang: "python",
          code: `import dis

for x in (4, 5):
    unbracketed = x & 1 == 0
    bracketed = (x & 1) == 0
    print(f"x={x}  x & 1 == 0 -> {unbracketed}   (x & 1) == 0 -> {bracketed}")

print()
dis.dis(compile("x & 1 == 0", "<expr>", "eval"))`,
          output: `x=4  x & 1 == 0 -> True   (x & 1) == 0 -> True
x=5  x & 1 == 0 -> False   (x & 1) == 0 -> False

  0           RESUME                   0

  1           LOAD_NAME                0 (x)
              LOAD_CONST               0 (1)
              BINARY_OP                1 (&)
              LOAD_CONST               1 (0)
              COMPARE_OP              72 (==)
              RETURN_VALUE`,
          explanation:
            "The two columns agree, and the disassembly proves why: the `&` is performed first and its result compared, exactly as the bracketed form spells out. Python's precedence here is the one most people expect. The same source in Java does not compile at all — `bad operand types for binary operator '&'`, because it tried to AND an `int` with a `boolean`.",
        },
      ],
      pitfalls: [
        {
          title: "The rule for bitwise operators",
          body: "Bracket a bitwise operation that is being compared: `(x & mask) != 0`, `(x >> k) & 1`. It is required in Java, harmless in Python, and it means the same code reads correctly in both — which matters in a track that shows every algorithm twice.",
        },
      ],
    },
    {
      id: "surprise-two",
      heading: "Surprise two: `+` with a string, again",
      body: [
        "Java's `+` is left-associative and concatenates whenever either operand is a `String`. Combined, those two facts mean `\"total: \" + 1 + 2` is `total: 12`, as the first module showed.",
        "The general form of the surprise: once concatenation has started, everything to the right joins the string. Anything you wanted added must be bracketed.",
      ],
      examples: [
        {
          id: "string-plus",
          title: "Where the addition has to be forced",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int a = 1, b = 2;

        System.out.println("sum: " + a + b);
        System.out.println("sum: " + (a + b));
        System.out.println(a + b + " :sum");
        System.out.println(a + " and " + b + " make " + (a + b));
    }
}`,
          output: `sum: 12
sum: 3
3 :sum
1 and 2 make 3`,
          explanation:
            "The third line is the informative one: with the numbers on the *left*, `a + b` is evaluated as arithmetic before the string is reached, and it prints 3 without brackets. So the behaviour is not \"`+` near a string always concatenates\" — it is strictly left to right, and the first string operand switches every subsequent `+` into concatenation.",
        },
      ],
    },
    {
      id: "the-rule",
      heading: "The rule that replaces the table",
      body: [
        "**Know that `*` beats `+`. Bracket everything else.**",
        "That is the whole recommendation. Brackets cost nothing at run time, cost two characters in the source, and are never ambiguous to a reader. Memorising fifteen precedence levels buys you the ability to write expressions that a reviewer has to look up.",
        "The stronger version, for anything with more than two operators: **give the intermediate a name.** `int mid = lo + (hi - lo) / 2;` is clearer than the same expression inlined into an array access, and when it misbehaves you can print it.",
        "This is not a beginner's crutch. Experienced people bracket more, not less, because they have debugged more precedence bugs.",
      ],
      examples: [
        {
          id: "naming",
          title: "One dense line, and the same logic named",
          lang: "python",
          code: `values = [3, 8, 2, 9, 4]
lo, hi = 0, len(values) - 1

# Dense: correct, and you have to hold four things at once.
print(values[lo + (hi - lo) // 2] > values[hi] and lo < hi)

# Named: identical behaviour, each step visible.
mid = lo + (hi - lo) // 2
mid_beats_end = values[mid] > values[hi]
range_is_valid = lo < hi
print(mid_beats_end and range_is_valid)
print(f"mid={mid} values[mid]={values[mid]} values[hi]={values[hi]}")`,
          output: `False
False
mid=2 values[mid]=2 values[hi]=4`,
          explanation:
            "Same answer, and only the second version lets you see *why* — the last line prints the intermediates that the dense version threw away. When a binary search misbehaves, that print is the difference between five minutes and an hour, and you cannot write it without a name for `mid`.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does `x & 1 == 0` evaluate to, and why?",
      answer:
        "Not what it looks like. Comparison binds tighter than the bitwise operators, so it parses as `x & (1 == 0)`. In Java that is a compile error since you cannot AND an `int` with a `boolean`. In Python `1 == 0` is `False`, which is 0 numerically, so the whole expression is 0 for every input — silently wrong, and falsy, so an `if` on it never fires. The correct form is `(x & 1) == 0`, and bitwise operations being compared should always be bracketed.",
    },
    {
      question: "Why is `10 - 4 - 3` equal to 3 rather than 9?",
      answer:
        "Associativity. Operators of equal precedence group left to right in both languages, so it means `(10 - 4) - 3`. Getting 9 would require right-associative grouping, `10 - (4 - 3)`. Nearly everything is left-associative; the exceptions are assignment, which is right-associative so `a = b = 0` works, and Python's `**`, so `2 ** 3 ** 2` is 2⁹ = 512 rather than 8² = 64.",
    },
    {
      question: "In Java, what does `\"sum: \" + 1 + 2` print?",
      answer:
        "`sum: 12`. `+` is left-associative, so `\"sum: \" + 1` runs first and concatenates because one operand is a String, and then `+ 2` concatenates onto that. Once concatenation has begun, everything to the right joins the string. Writing the numbers first — `1 + 2 + \" :sum\"` — evaluates the addition as arithmetic and prints 3, so the rule is strictly positional rather than \"strings win\".",
    },
  ],
  takeaways: [
    "Five bands: unary, multiplicative, additive, shift/relational/equality, then bitwise and logical",
    "Almost everything is left-associative, which is why `10 - 4 - 3` is 3",
    "Assignment and Python's `**` are right-associative, so `2 ** 3 ** 2` is 512",
    "Java binds `==` tighter than `&`, so `x & 1 == 0` does not compile there",
    "Python binds `&` tighter, so the same line is correct there — bracket it and the difference disappears",
    "Java's `+` concatenates from the first String operand rightwards, so put arithmetic in brackets",
    "Know that `*` beats `+`, and bracket everything else",
    "For more than two operators, give the intermediate a name so you can print it",
  ],
};
