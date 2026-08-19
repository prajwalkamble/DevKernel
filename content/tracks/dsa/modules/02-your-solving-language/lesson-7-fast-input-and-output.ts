import type { Lesson } from "@/content/types";

export const fastInputOutputLesson: Lesson = {
  id: "dsa-lang-fast-io",
  slug: "fast-input-and-output",
  moduleSlug: "your-solving-language",
  title: "Fast Input & Output, and When It Matters",
  summary:
    "Reading a hundred thousand numbers without the reading being the slow part — and why none of this belongs in an interview.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Read integers, arrays and lines efficiently in both languages",
    "Explain why `Scanner` and `input()` become the bottleneck at scale",
    "Batch output instead of printing in a loop",
    "Recognise that none of this applies to interview problems, and why",
  ],
  sections: [
    {
      id: "two-worlds",
      heading: "Two different worlds",
      body: [
        "There are two contexts in which you write solutions, and they have opposite requirements for input handling.",
        "**Interviews and this track's sheet.** You are given a function signature and the arguments arrive as parameters. There is no reading at all. Everything in this lesson is irrelevant, and writing it anyway looks like noise.",
        "**Judges and contests.** Your program reads from standard input and writes to standard output, and the input can be enormous — 10⁵ or 10⁶ numbers. Here the naive way of reading is genuinely slow enough to fail a time limit on its own, with a perfectly good algorithm.",
        "Knowing which world you are in is the whole point of this lesson. The techniques below matter completely in the second and not at all in the first.",
      ],
    },
    {
      id: "python-input",
      heading: "Python: `input()` is the slow one",
      body: [
        "`input()` does more work than you would expect per call — it handles prompts and interactive terminals — and calling it 10⁵ times is noticeably slow.",
        "The fix is `sys.stdin`, which reads in large blocks. Two shapes cover almost everything: read the whole input at once and split it, or rebind `input` to `sys.stdin.readline` and keep the code you already wrote.",
      ],
      examples: [
        {
          id: "python-fast-in",
          title: "The three patterns worth knowing",
          lang: "python",
          code: `import sys

# Simulating stdin so the example runs standalone.
sample = "3\\n10 20 30\\nhello world\\n"
sys.stdin = __import__("io").StringIO(sample)

data = sys.stdin.read().split()
print("all tokens:", data)

# Pattern 1: read everything, walk it with an index.
pos = 0
n = int(data[pos]); pos += 1
values = [int(data[pos + i]) for i in range(n)]
pos += n
print("n =", n, "values =", values)

# Pattern 2: rebind input to readline, then use it as normal.
sys.stdin = __import__("io").StringIO(sample)
input = sys.stdin.readline
n = int(input())
values = list(map(int, input().split()))
print("again:", n, values)`,
          output: `all tokens: ['3', '10', '20', '30', 'hello', 'world']
n = 3 values = [10, 20, 30]
again: 3 [10, 20, 30]`,
          explanation:
            "`sys.stdin.read().split()` is the fastest and treats the whole input as one flat list of tokens, ignoring line boundaries entirely — which is usually what you want and occasionally not. `input = sys.stdin.readline` is the least invasive: one line at the top and the rest of your code is unchanged. Note that `readline` keeps the trailing newline, so `int()` is fine but comparing a raw string needs `.strip()`.",
        },
        {
          id: "python-fast-out",
          title: "Output: build once, print once",
          lang: "python",
          code: `import sys

results = [i * i for i in range(5)]

# Slow at scale: one write per line.
for r in results:
    print(r)

# Fast: one write for everything.
sys.stdout.write("\\n".join(map(str, results)) + "\\n")`,
          output: `0
1
4
9
16
0
1
4
9
16`,
          explanation:
            "Identical output, one system call instead of n. At 10⁵ lines the difference is large enough to fail a time limit on its own. `print(*results, sep=\"\\n\")` is a shorter version of the same idea and is worth knowing as the one-liner.",
        },
      ],
      pitfalls: [
        {
          title: "Forgetting `.strip()` after `readline`",
          body: "`sys.stdin.readline()` includes the trailing newline. `int(...)` and `.split()` tolerate it; a direct string comparison does not, so `line == \"yes\"` fails mysteriously on input that looks correct.",
        },
      ],
    },
    {
      id: "java-input",
      heading: "Java: `Scanner` is the slow one",
      body: [
        "`Scanner` is convenient and roughly an order of magnitude slower than the alternative, because it uses regular expressions to find token boundaries. On 10⁵ integers that is enough to matter; on 10⁶ it is decisive.",
        "`BufferedReader` with a `StringTokenizer` is the standard fast combination. It is more code, which is why you keep it as a template rather than deriving it each time — the last lesson of this module is exactly that template.",
      ],
      examples: [
        {
          id: "java-fast-io",
          title: "BufferedReader, StringTokenizer, StringBuilder",
          lang: "java",
          code: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        String sample = "3\\n10 20 30\\n";
        BufferedReader in = new BufferedReader(new StringReader(sample));

        int n = Integer.parseInt(in.readLine().trim());

        StringTokenizer tokens = new StringTokenizer(in.readLine());
        int[] values = new int[n];
        for (int i = 0; i < n; i++) {
            values[i] = Integer.parseInt(tokens.nextToken());
        }

        StringBuilder out = new StringBuilder();
        for (int value : values) {
            out.append(value * 2).append('\\n');
        }

        System.out.print(out);
    }
}`,
          output: `20
40
60`,
          explanation:
            "In a real submission `new StringReader(sample)` becomes `new InputStreamReader(System.in)` and nothing else changes. The three pieces are always the same: `BufferedReader` to read lines in blocks, `StringTokenizer` to split without regular expressions, and a `StringBuilder` for output so you make one write rather than n. Note `throws IOException` on `main` — reading can fail, and declaring it is shorter than a try-catch you do not want.",
        },
      ],
      pitfalls: [
        {
          title: "Mixing `Scanner.nextInt()` and `Scanner.nextLine()`",
          body: "`nextInt` consumes the number but leaves the newline in the buffer, so the following `nextLine` returns an empty string rather than the next line. This is one of the most-asked Java questions anywhere. It disappears entirely if you use `BufferedReader`, which is another reason to.",
        },
        {
          title: "`System.out.println` inside a large loop",
          body: "Every call can flush, meaning a system call per line. Build a `StringBuilder` and print once at the end. This is the same quadratic-adjacent trap as string concatenation, and it is the more common cause of a mysteriously slow Java submission.",
        },
      ],
    },
    {
      id: "not-in-interviews",
      heading: "Why none of this belongs in an interview",
      body: [
        "In an interview you are handed a function and its parameters. There is no standard input, so there is nothing to read fast.",
        "Writing a `BufferedReader` harness anyway is a small negative signal — it suggests contest habits applied without thinking about the setting, and it spends your first two minutes on something that is not the problem. The same applies to this track's practice console: you write the function body, and the harness supplies the arguments.",
        "The useful thing to carry across is the *idea* rather than the code: batching output is faster than repeated writes, and a library that is convenient is often doing more work than the one that is not. Those generalise. `StringTokenizer` does not.",
      ],
    },
    {
      id: "scale",
      heading: "Knowing when it matters",
      body: [
        "A crude threshold, which is all you need: **below about 10⁴ values, read them however you like.** Between 10⁴ and 10⁵, the fast path starts to be worth it in Python. Above 10⁵ it is worth it in both, and above 10⁶ it is mandatory.",
        "You can read that threshold straight off the constraints, which is the same skill the constraints lesson in the Framework module is built on. If n ≤ 1000, `Scanner` is fine and reaching for anything else is wasted effort. If n ≤ 10⁶, the reading is part of your complexity budget and needs to be treated as such.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why is Java's Scanner slow, and what do you use instead?",
      answer:
        "`Scanner` splits input using regular expressions and does a lot of per-token work, which makes it roughly an order of magnitude slower than the alternative — enough to fail a time limit on 10⁵ or more tokens with an otherwise correct algorithm. The standard replacement is `BufferedReader` for block reads plus `StringTokenizer` to split lines, with a `StringBuilder` accumulating output so the program writes once instead of once per line. It only matters on judges; interview problems pass arguments directly.",
    },
    {
      question: "How do you speed up input and output in Python for competitive programming?",
      answer:
        "Replace `input()` with `sys.stdin.readline`, or read everything at once with `sys.stdin.read().split()` and walk the resulting token list with an index. For output, build the whole answer and write it in one call — `sys.stdout.write(\"\\n\".join(map(str, results)))` or `print(*results, sep=\"\\n\")` — rather than calling `print` per line. Both changes replace n system calls with one, which at 10⁵ lines is frequently the difference between passing and timing out.",
    },
    {
      question: "Why does `nextLine()` return an empty string after `nextInt()`?",
      answer:
        "`nextInt` reads the integer token but leaves the newline that follows it in the buffer, so the next `nextLine` immediately finds that newline and returns the empty string before it. The usual fixes are an extra throwaway `nextLine()` after the number, or not using `Scanner` at all — `BufferedReader` reads whole lines and never has the problem.",
    },
  ],
  takeaways: [
    "Interviews and this track's sheet pass arguments to a function — there is nothing to read, and this lesson does not apply",
    "On judges, naive reading can fail a time limit on its own with a correct algorithm",
    "Python: `sys.stdin.read().split()` for everything at once, or `input = sys.stdin.readline` for a one-line change",
    "`readline` keeps the trailing newline; `int()` tolerates it, string comparison does not",
    "Java: `BufferedReader` plus `StringTokenizer`, never `Scanner` at scale",
    "Accumulate output in a `StringBuilder` or a joined string and write once, not once per line",
    "Mixing `nextInt()` and `nextLine()` returns an empty string; `BufferedReader` avoids it entirely",
    "Below 10⁴ values read them however you like; above 10⁶ the fast path is mandatory",
  ],
};
