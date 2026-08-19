import type { Lesson } from "@/content/types";

export const printingAndFormattingLesson: Lesson = {
  id: "dsa-io-printing",
  slug: "printing-and-formatting",
  moduleSlug: "input-output-and-data-types",
  title: "Printing & Formatting",
  summary:
    "Decimal places, padding, separators and the exact output a judge is comparing against — including the trailing newline that decides whether you pass.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Format numbers to a given number of decimal places in both languages",
    "Pad and align values, and print with a chosen separator",
    "Print a list on one line without a loop",
    "Explain what an output-comparison judge is and is not fussy about",
  ],
  sections: [
    {
      id: "why-formatting",
      heading: "Why this gets its own lesson",
      body: [
        "Because output is compared character by character. A problem that asks for an answer to two decimal places and receives `3.141592653589793` is wrong, with a correct algorithm behind it. So is one that prints `[1, 2, 3]` where `1 2 3` was wanted.",
        "This is the least intellectually interesting way to fail, and it is common enough to be worth twenty minutes.",
      ],
    },
    {
      id: "python-formatting",
      heading: "Python: f-strings",
      body: [
        "The f-string is the only formatting mechanism you need. Put an expression in braces, and an optional format specification after a colon.",
        "The specification you will use most is `.Nf` for N decimal places. After that: `Nd` to pad a number to width N, `>N` and `<N` to align, `,` for thousands separators.",
      ],
      examples: [
        {
          id: "python-fstrings",
          title: "The specifications worth knowing",
          lang: "python",
          code: `value = 3.14159
n = 42
name = "hi"

print(f"{value:.2f} {n:5d} {name:>6}|")
print(f"{n:05d} {n:b} {n:x}")
print(f"{1234567:,}")
print(f"{0.5:.0%}")
print(f"{value=}")

results = [1, 2, 3]
print(*results)
print(*results, sep=", ")
print("no newline", end="")
print("|")`,
          output: `3.14    42     hi|
00042 101010 2a
1,234,567
50%
value=3.14159
1 2 3
1, 2, 3
no newline|`,
          explanation:
            "`{value=}` prints the expression *and* its value — `value=3.14159` — which is the fastest debug print there is and should replace most of your `print(\"value\", value)` calls. `print(*results)` unpacks a list into separate arguments, so it prints space-separated with no loop and no `join`; `sep=` changes the separator and `end=` changes what goes after the last item.",
        },
      ],
      pitfalls: [
        {
          title: "Printing a list when the judge wants numbers",
          body: "`print(results)` gives `[1, 2, 3]`, brackets and commas included. Almost no judge wants that. `print(*results)` gives `1 2 3`, and `print(\" \".join(map(str, results)))` is the explicit version.",
        },
      ],
    },
    {
      id: "java-formatting",
      heading: "Java: printf and String.format",
      body: [
        "Java uses C-style format specifiers. `%d` for an integer, `%s` for a string, `%f` for a floating-point value, `%n` for a newline.",
        "`printf` writes directly; `String.format` returns the string, which is what you want when you are building output in a `StringBuilder`.",
        "The one to remember is `%.2f` — a precision of two — and the one to be careful with is `%n` against `\\n`.",
      ],
      examples: [
        {
          id: "java-printf",
          title: "The same formats",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        double value = 3.14159;
        int n = 42;
        String name = "hi";

        System.out.printf("%.2f %5d %6s|%n", value, n, name);
        System.out.printf("%05d %s %x%n", n, Integer.toBinaryString(n), n);
        System.out.printf("%,d%n", 1234567);
        System.out.println(String.format("%.2f", value));
        System.out.println(String.join(" ", "1", "2", "3"));
    }
}`,
          output: `3.14    42     hi|
00042 101010 2a
1,234,567
3.14
1 2 3`,
          explanation:
            "`%5d` pads to width 5 with spaces and `%05d` pads with zeros; `%6s` right-aligns a string in six columns. `%n` emits the platform's line separator while `\\n` is always a line feed — for judges either works, but `%n` is the correct one inside `printf` and mixing them is a common inconsistency.",
        },
      ],
      pitfalls: [
        {
          title: "`%d` with a `double`",
          body: "Java throws `IllegalFormatConversionException` at run time rather than converting. The format string is not type-checked at compile time, so this is a runtime crash on a line that looks harmless — and it usually happens in the branch that only runs on the large input.",
        },
      ],
    },
    {
      id: "rounding",
      heading: "Rounding, and the surprise in it",
      body: [
        "Formatting to N decimal places rounds, and the rounding is not always what you expect — both languages use the underlying binary representation, so a value that looks like an exact half may not be one.",
        "For problems that specify a tolerance — \"answers within 10⁻⁶ are accepted\" — this never matters. For problems that want an exact decimal answer, print more digits than you think you need and let the checker decide.",
      ],
      examples: [
        {
          id: "rounding-surprise",
          title: "Rounding a half",
          lang: "python",
          code: `print(f"{2.675:.2f}")
print(f"{0.5:.0f}")
print(f"{1.5:.0f}")
print(f"{2.5:.0f}")
print(round(0.5), round(1.5), round(2.5))`,
          output: `2.67
0
2
2
0 2 2`,
          explanation:
            "Two surprises. `2.675` formats to `2.67` rather than `2.68`, because the stored value is very slightly below 2.675 — a floating-point issue covered properly two lessons from here. And halves round to the nearest *even* number, which is why 0.5 and 2.5 both give 2's neighbours rather than always rounding up. This is deliberate and standard, and it is not what school taught.",
        },
      ],
    },
    {
      id: "judges",
      heading: "What a judge actually compares",
      body: [
        "Most judges compare your output to the expected output after normalising whitespace at the end of lines and at the end of the file. In practice that means:",
        "**A trailing newline is fine.** Both `print` and `println` add one, and judges accept it.",
        "**Trailing spaces are usually fine** but not always, and there is no reason to emit them. Building output with `join` avoids the problem entirely; printing in a loop with a trailing separator creates it.",
        "**Line ordering and internal spacing are not negotiable.** One space where two were expected is a wrong answer.",
        "**Case matters.** `YES` is not `Yes`. Read the output specification rather than assuming.",
        "The reliable habit: build the whole answer with `join` or a `StringBuilder`, then write it once. It is faster, as the previous module showed, and it makes stray separators structurally impossible.",
      ],
      examples: [
        {
          id: "join-not-loop",
          title: "The trailing-separator bug, and the fix",
          lang: "python",
          code: `results = [1, 2, 3]

line = ""
for r in results:
    line += str(r) + " "
print("[" + line + "]")

print("[" + " ".join(map(str, results)) + "]")`,
          output: `[1 2 3 ]
[1 2 3]`,
          explanation:
            "The brackets are there to make the difference visible; the trailing space in the first version is invisible in normal output and is exactly the kind of thing that produces a wrong answer you cannot see. `join` puts separators *between* items and cannot produce a trailing one, which is the real argument for it.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you print a number to two decimal places?",
      answer:
        "`f\"{value:.2f}\"` in Python, `System.out.printf(\"%.2f%n\", value)` or `String.format(\"%.2f\", value)` in Java. Both round rather than truncate. Note that rounding a value that appears to be an exact half may not go the way you expect, because the stored binary value is usually slightly above or below the decimal you wrote, and because ties round to even.",
    },
    {
      question: "What is the difference between `%n` and `\\n` in Java's printf?",
      answer:
        "`%n` emits the platform-specific line separator — a line feed on Unix, a carriage return plus line feed on Windows — while `\\n` is always a single line feed. Inside a format string `%n` is the correct choice; for output compared by a judge either is accepted, since judges normalise line endings. The practical rule is to be consistent, because mixing them in one program is how a stray carriage return ends up in the middle of your output.",
    },
    {
      question: "Why might a correct algorithm still get a wrong-answer verdict?",
      answer:
        "Output formatting. Printing a list with its brackets when space-separated values were wanted, wrong decimal places, wrong case on a `YES`/`NO`, an extra blank line, or a trailing separator from building a line by appending in a loop. The defence is to read the output specification as carefully as the input one, and to build output with `join` or a `StringBuilder` so separators land between items and never after the last one.",
    },
  ],
  takeaways: [
    "Output is compared character by character; formatting is a real source of wrong answers",
    "Python: f-strings with `:.2f`, `:05d`, `:>6`, `:,` cover nearly everything",
    "`f\"{value=}\"` prints the expression and its value — the best debug print available",
    "`print(*results)` prints a list space-separated with no loop; `print(results)` prints the brackets",
    "Java: `%.2f`, `%05d`, `%6s`, and `%n` rather than `\\n` inside a format string",
    "`%d` given a `double` throws at run time, not compile time",
    "Halves round to even, and `2.675` formats as `2.67` — both are floating point, not a bug",
    "Build output with `join` so a trailing separator is structurally impossible",
  ],
};
