import type { Lesson } from "@/content/types";

export const errorsLesson: Lesson = {
  id: "dsa-intro-errors",
  slug: "errors-and-how-they-announce-themselves",
  moduleSlug: "introduction-to-programming",
  title: "Errors: Compile-Time, Runtime & the Silent One",
  summary:
    "Three kinds of wrong, in increasing order of how much trouble they cause — and how to read the message each one gives you, including the one that gives you none.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Classify a failure as compile-time, runtime or logical, and know what that tells you",
    "Read a Java compiler error and a Python traceback down to the exact line",
    "Recognise the four runtime errors that account for most crashes in this track",
    "Explain why the logical error is the expensive one, and what defends against it",
  ],
  sections: [
    {
      id: "three-kinds",
      heading: "Three kinds of wrong",
      body: [
        "Not all errors are equal, and the useful thing about the categories is that each one tells you where to look.",
        "**Compile-time errors** — the text is not a valid program. A missing bracket, a misspelled name, a type mismatch. Java finds all of these before running anything; Python finds only the grammatical ones before running, and treats a misspelled name as a runtime problem.",
        "**Runtime errors** — the program is valid and starts running, then hits something it cannot do: index past the end of an array, divide by zero, follow a reference to nothing. It stops, and it tells you where.",
        "**Logical errors** — the program runs to completion and produces the wrong answer. Nothing complains. This is the expensive category, and most of this track's later advice about testing exists because of it.",
        "The ordering is deliberate. A compile error costs you a minute. A runtime error costs you a few minutes and points at itself. A logical error can cost you an afternoon, or a contest, or an interview — because you do not know it is there.",
      ],
    },
    {
      id: "reading-compile-errors",
      heading: "Reading a compiler error",
      body: [
        "Java's messages are more informative than their reputation. They name the file, the line, the column with a caret, and what it expected.",
        "The one habit that matters: **fix the first error and recompile**. Errors cascade — one missing brace can generate a dozen complaints about lines that are perfectly fine. The last eleven are usually noise produced by the first.",
      ],
      examples: [
        {
          id: "cascade",
          title: "One mistake, several complaints",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int total = 0
        total = total + 5;
        System.out.println(total);
    }
}`,
          output: `Main.java:3: error: ';' expected
        int total = 0
                     ^
1 error
error: compilation failed`,
          explanation:
            "One missing semicolon, one clean message, pointing at the exact column after the `0`. Note the line number is 3 — where the statement should have ended — and not line 4, where a human might first notice something is off. When an error points at a line that looks fine, look at the line above it.",
        },
        {
          id: "type-error",
          title: "A type mismatch, caught before anything runs",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int count = "5";
        System.out.println(count);
    }
}`,
          output: `Main.java:3: error: incompatible types: String cannot be converted to int
        int count = "5";
                    ^
1 error
error: compilation failed`,
          explanation:
            "`\"5\"` is text that happens to look like a number, and Java will not silently convert it. This is exactly the check Python does not do — there, `count = \"5\"` is fine and the failure arrives later, wherever you first try to do arithmetic on it. Converting deliberately is `Integer.parseInt(\"5\")` in Java and `int(\"5\")` in Python.",
        },
      ],
    },
    {
      id: "reading-tracebacks",
      heading: "Reading a Python traceback",
      body: [
        "Python's runtime errors come with a **traceback**: the chain of calls that led to the failure, printed innermost-last.",
        "Read it from the bottom. The last line is the error type and message. The lines directly above it are where it happened. The lines further up are how execution got there, which matters once you have functions calling functions.",
      ],
      examples: [
        {
          id: "traceback",
          title: "A traceback through two calls",
          lang: "python",
          code: `def average(values):
    return sum(values) / len(values)

def report(values):
    print("average is", average(values))

report([1, 2, 3])
report([])`,
          output: `average is 2.0
Traceback (most recent call last):
  File "main.py", line 8, in <module>
    report([])
    ~~~~~~^^^^
  File "main.py", line 5, in report
    print("average is", average(values))
                        ~~~~~~~^^^^^^^^
  File "main.py", line 2, in average
    return sum(values) / len(values)
           ~~~~~~~~~~~~^~~~~~~~~~~~~
ZeroDivisionError: division by zero
`,
          explanation:
            "Read bottom-up: the error is a division by zero, on line 2, inside `average`. Then the frames above tell you the story — `average` was called from `report` on line 5, which was called from line 8 with an empty list. The bug is not really on line 2; it is that `report([])` was allowed. Tracebacks point at where the failure surfaced, and the cause is usually a frame or two up.",
        },
      ],
      pitfalls: [
        {
          title: "Reading the traceback from the top",
          body: "The top frame is the outermost call — usually your program's entry point, which is almost never where the problem is. The bottom is the actual failure. Read the last line first, then walk upwards until you reach a line you wrote.",
        },
      ],
    },
    {
      id: "the-four",
      heading: "The four runtime errors you will actually hit",
      body: [
        "In this track, four account for the overwhelming majority of crashes. Each has a single most-likely cause, which is worth knowing because it turns a crash into a two-second fix.",
        "**Index out of bounds.** `ArrayIndexOutOfBoundsException` in Java, `IndexError` in Python. Almost always a loop running to `<= length` instead of `< length`, or an empty collection you did not check for.",
        "**Divide by zero.** `ArithmeticException` in Java for integers, `ZeroDivisionError` in Python. Almost always a count that turned out to be zero — an average over an empty list, as above.",
        "**Null.** `NullPointerException` in Java, `AttributeError: 'NoneType' object has no attribute...` in Python. Almost always a lookup that found nothing and returned `null`/`None`, used without checking.",
        "**Stack overflow.** `StackOverflowError` in Java, `RecursionError` in Python. Always a recursion whose base case is missing or never reached.",
      ],
      examples: [
        {
          id: "off-by-one",
          title: "The most common one, in full",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int[] values = { 10, 20, 30 };

        for (int i = 0; i <= values.length; i++) {
            System.out.println("i=" + i + " value=" + values[i]);
        }
    }
}`,
          output: `i=0 value=10
i=1 value=20
i=2 value=30
Exception in thread "main" java.lang.ArrayIndexOutOfBoundsException: Index 3 out of bounds for length 3
	at Main.main(Main.java:6)`,
          explanation:
            "Three lines of correct output, then the crash — which is what makes this one confusing the first time: the loop *worked*, right up until it did not. Valid indices for a length-3 array are 0, 1 and 2; `<=` lets `i` reach 3. The message says exactly that: index 3, length 3. Read `<=` in a loop over a collection as a bug until proven otherwise.",
        },
      ],
    },
    {
      id: "the-silent-one",
      heading: "The one that does not announce itself",
      body: [
        "Here is a program with no error message and a wrong answer. It compiles, it runs, it prints something plausible.",
        "This is the category that matters, and it is why the last lesson of this module is about testing. A crash tells you where to look. A wrong number tells you nothing at all — you have to already suspect it.",
      ],
      examples: [
        {
          id: "logical-error",
          title: "No error, wrong answer",
          lang: "python",
          code: `def largest(values):
    biggest = 0
    for value in values:
        if value > biggest:
            biggest = value
    return biggest

print(largest([3, 9, 4]))
print(largest([-3, -9, -4]))`,
          output: `9
0`,
          explanation:
            "The second call is wrong: the largest value in that list is −3, and 0 is not even in the list. The bug is `biggest = 0` — starting from zero assumes some value will exceed it, which is false when everything is negative. The fix is to start from the first element, `biggest = values[0]`, and handle the empty case separately. Nothing in the output announces this; you have to have tested with a negative input, which is exactly the habit the next lessons build.",
        },
      ],
      pitfalls: [
        {
          title: "Testing only with the example in the problem statement",
          body: "Statement examples are chosen to illustrate, not to break. They are almost always small, positive and well-behaved. The inputs that find logical errors are the empty one, the single-element one, the all-negative one, the all-identical one, and the largest one the constraints allow.",
        },
        {
          title: "Assuming no crash means correct",
          body: "The most expensive false confidence in programming. A program that runs to completion has demonstrated that it does not violate any rule the language enforces. That is a much weaker claim than being right, and the gap between the two is where every wrong-answer verdict lives.",
        },
      ],
    },
    {
      id: "what-to-do",
      heading: "What to actually do when something fails",
      body: [
        "A procedure, because \"debug it\" is not advice.",
        "**Read the message.** All of it, including the line number. This solves a surprising share of problems outright and takes ten seconds.",
        "**Go to that line, then look at the line above it.** Missing brackets and semicolons are reported where the confusion becomes undeniable, not where it began.",
        "**Ask what you expected the state to be at that point, then print it.** Not the whole program — the two or three values in the failing line. This is the entire technique behind print debugging, and it remains the most-used debugging tool in the world for good reason.",
        "**If nothing crashed but the answer is wrong, find the smallest input that reproduces it.** A three-element array you can trace by hand beats a thousand-element one you cannot. Halve the input until it stops being wrong; the boundary tells you what the bug depends on.",
        "That last step is worth more than the rest combined, and it is what the final lesson of this module is entirely about.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between a compile-time error and a runtime error?",
      answer:
        "A compile-time error means the source is not a valid program — a syntax mistake, an unknown name, a type mismatch — and it is caught before any code executes, so nothing runs. A runtime error means the program was valid and started running, then attempted something impossible: indexing past an array, dividing by zero, dereferencing null. The distinction matters because it localises the problem: compile errors are about the text, runtime errors are about the state at a particular moment.",
    },
    {
      question: "What causes a NullPointerException, and how would you avoid one?",
      answer:
        "Using a reference that points at nothing — calling a method on it or reading a field. Typically it comes from a lookup that found nothing and returned null, or an object that was never initialised. You avoid it by checking before use, by preferring APIs that return an empty collection rather than null, and in modern Java by using `Optional` at the boundaries where absence is a real possibility. In an interview, the useful move is to say out loud what happens when the input is empty, before writing the line that would crash.",
    },
    {
      question: "Why are logical errors considered the most dangerous?",
      answer:
        "Because nothing reports them. A compile error stops the build and a runtime error prints a stack trace pointing at a line; both tell you that something is wrong and roughly where. A logical error produces a complete, plausible, wrong answer — so it is found only by someone deliberately checking the output against what it should be. That is why testing with edge cases, and having a slow brute-force implementation to compare against, is worth the time it costs.",
    },
  ],
  takeaways: [
    "Three kinds of wrong: compile-time (invalid text), runtime (valid but impossible), logical (valid, runs, wrong)",
    "Fix the first compiler error and recompile — the rest are usually cascade noise",
    "When an error points at a line that looks fine, look at the line above it",
    "Read a Python traceback from the bottom: last line is the error, the frames above are how you got there",
    "Four runtime errors cover most crashes: out of bounds, divide by zero, null, stack overflow",
    "`<=` in a loop over a collection is a bug until proven otherwise",
    "A logical error announces nothing; `biggest = 0` is wrong the moment every value is negative",
    "No crash does not mean correct — it means you violated no rule the language enforces",
  ],
};
