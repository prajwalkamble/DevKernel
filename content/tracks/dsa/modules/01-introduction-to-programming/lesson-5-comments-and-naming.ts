import type { Lesson } from "@/content/types";

export const commentsAndNamingLesson: Lesson = {
  id: "dsa-intro-comments-and-naming",
  slug: "comments-and-naming",
  moduleSlug: "introduction-to-programming",
  title: "Comments, Naming & Code You Can Read Tomorrow",
  summary:
    "Why most comments are worse than none, what to write instead, and the naming conventions that make most comments unnecessary.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Write comments in both languages, and know which of your comments are worth writing",
    "State the rule that separates a useful comment from a harmful one",
    "Follow the naming conventions each language expects",
    "Rewrite an unreadable fragment into a readable one without changing what it does",
  ],
  sections: [
    {
      id: "syntax",
      heading: "The syntax, quickly",
      body: [
        "Java uses `//` to the end of the line, and `/* ... */` across several lines. Python uses `#` to the end of the line, and has no block comment — for several lines you use several `#`s, which every editor will do for you with a keystroke.",
        "That is all the syntax there is. The rest of this lesson is about which comments to write, which is a much harder question and one nobody usually raises this early.",
      ],
      examples: [
        {
          id: "comment-syntax",
          title: "Both forms",
          lang: "python",
          code: `# This whole line is a comment.

total = 10  # so is this, from the hash onwards

# Several lines just means
# several hash marks. Editors
# will toggle a block for you.

print(total)`,
          output: `10`,
          explanation:
            "Comments are removed before anything runs — they cost nothing at run time, and there is no performance reason to leave one out. Whether to write one is entirely a question about the reader.",
        },
      ],
    },
    {
      id: "the-rule",
      heading: "The rule: comment the why, never the what",
      body: [
        "Here is the single principle, and it is worth more than any style guide.",
        "**The code already says what it does. A comment should say why it does it.**",
        "A comment that restates the code is not neutral — it is a liability. It takes up a line, it adds nothing on first reading, and it is a second thing that has to be kept true. When the code changes and the comment does not, you now have a file that contradicts itself, and the next reader has to work out which half to believe. That is strictly worse than no comment at all.",
        "So: no `// increment i by one` above `i++`. But `// skip the duplicate: the pair was already counted at the first occurrence` is worth its line forever, because nothing in the code says that.",
      ],
      examples: [
        {
          id: "bad-comments",
          title: "Comments that make the file worse",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        // set i to 0
        int i = 0;

        // add one to i
        i++;

        // print i
        System.out.println(i);
    }
}`,
          output: `1`,
          explanation:
            "Three comments, no information. Every one of them is a slightly longer restatement of the line beneath it. If `i++` later becomes `i += 2`, all three are still there and one of them is now a lie. This is the style people write when told \"comment your code\", and it is why that instruction on its own is bad advice.",
        },
        {
          id: "good-comments",
          title: "A comment that earns its line",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int[] values = { 3, 1, 4, 1, 5, 9, 2, 6 };
        int lo = 0;
        int hi = values.length - 1;

        // Midpoint written as lo + (hi - lo) / 2 rather than (lo + hi) / 2:
        // the obvious form overflows once lo and hi are both near Integer.MAX_VALUE,
        // and this is the standard fix. It is not a stylistic preference.
        int mid = lo + (hi - lo) / 2;

        System.out.println("mid index: " + mid);
        System.out.println("mid value: " + values[mid]);
    }
}`,
          output: `mid index: 3
mid value: 1`,
          explanation:
            "That comment could not be recovered from the code. A reader who has never met the overflow problem would otherwise \"simplify\" this line back to the broken form, and be sure they had improved it. The comment exists precisely to prevent a plausible wrong edit — which is the highest-value thing a comment ever does.",
        },
      ],
      pitfalls: [
        {
          title: "Commented-out code left in the file",
          body: "It is never clear whether it is a work in progress, a fallback, or something forgotten in 2019. Version control remembers what you deleted; the file does not need to. Delete it.",
        },
        {
          title: "A comment that has quietly become false",
          body: "The most dangerous comment there is, because readers trust comments more than code. When you change a line, look immediately above it. If your comment says \"returns -1 when not found\" and the code now returns null, you have actively misled the next person — and it may well be you.",
        },
      ],
    },
    {
      id: "naming",
      heading: "Naming is the comment you cannot forget to update",
      body: [
        "Most comments exist because a name failed. Fix the name and the comment becomes unnecessary — and unlike the comment, the name is read at every place the value is used, so a name that stops fitting gets noticed.",
        "Three guidelines cover nearly everything.",
        "**Say what it holds, not what type it is.** `count`, not `intValue`. `firstIndex`, not `idx1`.",
        "**Short names are fine where the scope is short.** `i`, `j`, `k` for loop counters and `n` for a size are universal and expanding them adds nothing — `for (int index = 0; ...)` is not clearer, just longer. The rule is that a name's length should scale with how far apart its declaration and its uses are.",
        "**Booleans read as questions.** `isEmpty`, `hasDuplicate`, `found`. Then `if (found)` reads as English, and you never have to work out what `flag` being true means.",
        "The conventions differ by language and both are strict enough to be worth following without argument. Java: `camelCase` for variables and methods, `PascalCase` for classes, `UPPER_SNAKE_CASE` for constants. Python: `snake_case` for variables and functions, `PascalCase` for classes, `UPPER_SNAKE_CASE` for constants.",
      ],
      examples: [
        {
          id: "renaming",
          title: "The same code, twice",
          lang: "python",
          code: `# Before: needs a comment because nothing has a name
d = [4, 8, 15, 16, 23, 42]
x = 0
for a in d:
    if a % 2 == 0:
        x += a
print(x)

# After: the comment is not needed, because the names say it
readings = [4, 8, 15, 16, 23, 42]
even_total = 0
for reading in readings:
    if reading % 2 == 0:
        even_total += reading
print(even_total)`,
          output: `70
70`,
          explanation:
            "Identical behaviour, identical speed. The second version answers \"what is this for?\" without a comment and without you having to hold `d`, `x` and `a` in your head while you read.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What makes a good comment?",
      answer:
        "One that says something the code cannot. The code already states what it does, so a comment restating it adds nothing and creates a second thing to keep true — and a comment that has drifted out of date is worse than none, because readers trust comments over code. Good comments explain why: why this approach over the obvious one, why this bound rather than that one, what invariant the loop maintains. If a comment is needed to explain what a variable is, the better fix is usually to rename the variable.",
    },
    {
      question: "When should you rename a variable instead of commenting it?",
      answer:
        "Whenever the comment would explain what the variable holds. `int d; // number of distinct values seen so far` is a name that failed — call it `distinctCount` and the comment has nothing left to say. The rename is better, because the name appears at every use, where a wrong one gets noticed, while a comment sits in one place and can silently become false. Keep comments for what no name can carry: why this approach, why this bound, what a loop maintains.",
    },
    {
      question: "Are single-letter variable names ever acceptable?",
      answer:
        "Yes, where the scope is small and the convention is universal: `i`, `j`, `k` for loop indices, `n` for a size, `lo`, `hi`, `mid` in a binary search. Everyone reads those correctly and expanding them adds nothing. The rule is that a name's length should scale with the distance between where it is declared and where it is used — a counter used across three lines needs one letter; a value used forty lines later needs a sentence.",
    },
  ],
  takeaways: [
    "Java comments with `//` and `/* */`; Python with `#` only",
    "Comment the why, never the what — the code already says what it does",
    "A comment that restates its line is a liability, because it can drift out of date and be believed",
    "Delete commented-out code; version control already remembers it",
    "Most comments exist because a name failed; fixing the name removes the need",
    "Short names are fine in short scopes — `i`, `j`, `n`, `lo`, `hi`, `mid` are universal",
    "Booleans should read as questions: `isEmpty`, `hasDuplicate`, `found`",
  ],
};
