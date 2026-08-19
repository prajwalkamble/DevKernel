import type { Lesson } from "@/content/types";

export const readingInputLesson: Lesson = {
  id: "dsa-io-reading-input",
  slug: "reading-input",
  moduleSlug: "input-output-and-data-types",
  title: "Reading Input Correctly",
  summary:
    "Getting numbers, arrays and lines out of standard input in the shapes problems actually use them — and the parsing mistakes that make correct code fail.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Read a single number, a line of numbers, and a grid, in both languages",
    "Handle the input shapes judges actually use, including a leading count",
    "Explain why a trailing newline or a stray space breaks a comparison",
    "Read until end of input when no count is given",
  ],
  sections: [
    {
      id: "shapes",
      heading: "The four input shapes",
      body: [
        "Nearly every problem's input is one of four shapes, and recognising which you are looking at is most of the work.",
        "**A single number.** One line, one value.",
        "**A count, then that many values.** The most common shape by far: a line containing n, then a line of n numbers — or n lines each with one.",
        "**A grid.** Rows and columns, then that many rows of text or numbers.",
        "**Until end of input.** No count at all; read until there is nothing left. Rarer, and the one people get stuck on.",
        "The rest of this lesson is those four, in both languages.",
      ],
    },
    {
      id: "python-reading",
      heading: "Python",
      body: [
        "`input()` returns one line as a string with the trailing newline already stripped. Everything else is parsing.",
        "The workhorse is `list(map(int, input().split()))` — split the line on whitespace, convert each piece to an integer. It is worth being able to type without thinking.",
      ],
      examples: [
        {
          id: "python-shapes",
          title: "All four shapes",
          lang: "python",
          code: `import io
import sys

sample = """5
3 1 4 1 5
2 3
1 2 3
4 5 6
"""
sys.stdin = io.StringIO(sample)

n = int(input())
print("n =", n)

values = list(map(int, input().split()))
print("values =", values)

rows, cols = map(int, input().split())
grid = [list(map(int, input().split())) for _ in range(rows)]
print("grid =", grid)

sys.stdin = io.StringIO("7\\n8\\n9\\n")
rest = [int(line) for line in sys.stdin]
print("until EOF =", rest)`,
          output: `n = 5
values = [3, 1, 4, 1, 5]
grid = [[1, 2, 3], [4, 5, 6]]
until EOF = [7, 8, 9]`,
          explanation:
            "Four lines of parsing for four shapes. `rows, cols = map(int, input().split())` unpacks two values from one line, which is the idiomatic way to read a pair. Iterating `sys.stdin` directly yields lines until end of input, which is the cleanest answer to the last shape — no sentinel, no try/except.",
        },
      ],
      pitfalls: [
        {
          title: "`int(input().split())`",
          body: "`split()` returns a list, and `int` cannot convert a list. You want `list(map(int, input().split()))` for many values, or `int(input())` for one. The error message names the type clearly, but the two forms look similar enough to be typed by accident under pressure.",
        },
      ],
    },
    {
      id: "java-reading",
      heading: "Java",
      body: [
        "`Scanner` is the one everybody learns first: `nextInt()` for a number, `next()` for a token, `nextLine()` for a whole line. It is fine below about 10⁴ tokens and slow above that, as the previous module covered.",
        "The important behaviour to understand is that `nextInt` and `next` read a *token* and leave everything after it — including the newline — in the buffer. `nextLine` reads to the end of the current line. Mixing them without knowing that is the single most-asked Java input question.",
      ],
      examples: [
        {
          id: "java-shapes",
          title: "Scanner, and the newline problem",
          lang: "java",
          code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        String sample = "5\\n3 1 4 1 5\\n2 3\\n1 2 3\\n4 5 6\\n";
        Scanner in = new Scanner(sample);

        int n = in.nextInt();
        System.out.println("n = " + n);

        int[] values = new int[5];
        for (int i = 0; i < 5; i++) values[i] = in.nextInt();
        System.out.println("values = " + Arrays.toString(values));

        int rows = in.nextInt(), cols = in.nextInt();
        int[][] grid = new int[rows][cols];
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                grid[r][c] = in.nextInt();
        System.out.println("grid = " + Arrays.deepToString(grid));

        Scanner mixed = new Scanner("42\\nhello world\\n");
        int number = mixed.nextInt();
        String immediatelyAfter = mixed.nextLine();
        String theRealLine = mixed.nextLine();
        System.out.println("number=" + number
                + " after=[" + immediatelyAfter + "]"
                + " line=[" + theRealLine + "]");
    }
}`,
          output: `n = 5
values = [3, 1, 4, 1, 5]
grid = [[1, 2, 3], [4, 5, 6]]
number=42 after=[] line=[hello world]`,
          explanation:
            "The last line is the lesson. After `nextInt()` reads 42, the newline after it is still waiting, so the very next `nextLine()` returns the empty string — shown here as `[]` — and only the second one gets `hello world`. Reading numbers with `nextInt` in a loop is unaffected, because it skips whitespace; the problem appears only when you mix token reads with line reads.",
        },
      ],
      pitfalls: [
        {
          title: "Reading a grid with `nextLine` after `nextInt`",
          body: "The classic version of the bug above: you read the row count with `nextInt`, then read rows with `nextLine`, and your first row is empty. Either add a throwaway `nextLine()` after the count, or read every row with `next()`, or use `BufferedReader` and never think about it again.",
        },
      ],
    },
    {
      id: "trailing-whitespace",
      heading: "The whitespace that costs you a wrong answer",
      body: [
        "A category of failure worth naming because the code looks right and the output looks right.",
        "`BufferedReader.readLine()` in Java strips the newline; `sys.stdin.readline()` in Python does **not**. So a Python comparison against a raw line fails unless you strip it, and the printed representation of the two strings looks identical in a terminal.",
        "Inputs also sometimes carry trailing spaces, and `split()` handles that gracefully in both languages — `\"1 2  3 \".split()` gives three tokens, not four or five — which is why splitting is safer than manual index arithmetic.",
      ],
      examples: [
        {
          id: "whitespace",
          title: "Where the newline hides",
          lang: "python",
          code: `import io
import sys

sys.stdin = io.StringIO("yes\\nno\\n")

raw = sys.stdin.readline()
print("raw repr     :", repr(raw))
print("equals 'yes' :", raw == "yes")
print("stripped     :", raw.strip() == "yes")

print("split handles messy spacing:", "1 2  3 ".split())`,
          output: `raw repr     : 'yes\\n'
equals 'yes' : False
stripped     : True
split handles messy spacing: ['1', '2', '3']`,
          explanation:
            "`repr` is the tool here: it shows the `\\n` that `print` would render invisibly. Whenever a string comparison fails on input that looks correct, print the `repr` before anything else. Note that `int()` and `.split()` both tolerate the newline, which is why this bug only ever appears on direct string comparisons — and therefore appears at the worst moment.",
        },
      ],
    },
    {
      id: "practice-note",
      heading: "A note on this track",
      body: [
        "Almost nothing in this track requires you to read input. The problem sheet hands your function its arguments, and interviews do the same. This lesson exists because judges do not, and because a solved problem that fails on input parsing is uniquely annoying.",
        "The one habit worth carrying everywhere: when something fails on input that looks correct, print the `repr` of what you actually read before you look at anything else. Nine times out of ten it is a newline, a space, or a value you thought was an `int` and is a string.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you read n integers on one line, in Python and Java?",
      answer:
        "In Python, `list(map(int, input().split()))` — split the line on whitespace and convert each token. In Java with `Scanner`, call `nextInt()` in a loop, since `nextInt` skips whitespace including newlines; with `BufferedReader`, read the line and split it with a `StringTokenizer` or `split(\"\\\\s+\")`. Splitting on whitespace handles multiple spaces and trailing spaces without extra work, which is why it is safer than index arithmetic.",
    },
    {
      question: "Why does `nextLine()` return an empty string after `nextInt()`?",
      answer:
        "`nextInt` consumes the number token but leaves the rest of the line — including the newline — in the buffer. The following `nextLine` reads to the end of that current line, finds nothing, and returns the empty string. Fixes are an extra throwaway `nextLine()`, using `next()` instead of `nextLine()` when tokens are all you need, or using `BufferedReader`, which reads whole lines and never has the problem.",
    },
    {
      question: "How do you read input when the number of lines is not given?",
      answer:
        "In Python, iterate `sys.stdin` directly — it yields lines until end of input — or call `sys.stdin.read().split()` to get every token at once. In Java, loop `while ((line = reader.readLine()) != null)`, since `readLine` returns null at end of stream, or `while (scanner.hasNextInt())`. Both are cleaner than catching an exception, which is a common but unnecessary approach.",
    },
  ],
  takeaways: [
    "Four input shapes: one number, a count then values, a grid, and read-until-EOF",
    "`list(map(int, input().split()))` is the Python workhorse; learn it as one unit",
    "`nextInt` leaves the newline behind, so the next `nextLine` returns an empty string",
    "`BufferedReader.readLine()` strips the newline; Python's `sys.stdin.readline()` does not",
    "`split()` handles multiple and trailing spaces in both languages",
    "Iterate `sys.stdin`, or loop on `readLine() != null`, to read until end of input",
    "When input that looks right compares wrong, print its `repr` first",
  ],
};
