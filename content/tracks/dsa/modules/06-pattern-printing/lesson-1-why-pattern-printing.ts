import type { Lesson } from "@/content/types";

export const whyPatternPrintingLesson: Lesson = {
  id: "dsa-pattern-why",
  slug: "why-pattern-printing",
  moduleSlug: "pattern-printing-problems",
  title: "Why This Drill, and the Method That Solves All of Them",
  summary:
    "Not algorithm patterns — the classic nested-loop exercise, and a three-question method that turns every one of them from a puzzle into a derivation.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Say why this drill is worth doing, and what skill it builds",
    "Apply the three questions that solve any pattern",
    "Print a rectangle and a triangle from the method rather than from memory",
    "Distinguish these from the algorithm patterns of Module 1",
  ],
  sections: [
    {
      id: "not-those-patterns",
      heading: "First: these are not *those* patterns",
      body: [
        "This track uses the word \"pattern\" in two completely different senses, and it is worth separating them before anything else.",
        "**Algorithm patterns**, in Module 1, are recognisable problem shapes: two pointers, sliding window, monotonic stack. They are the organising idea of the whole track.",
        "**Pattern printing**, this module, is the classic exercise of printing shapes made of characters — triangles, pyramids, diamonds, number grids. It has nothing to do with algorithms.",
        "The naming collision is unfortunate and universal, so it is better to name it than to pretend it does not exist.",
      ],
    },
    {
      id: "why-bother",
      heading: "Why it is worth an hour",
      body: [
        "Printing a pyramid is not a skill anyone needs. The drill is worth doing for one reason: **it is the fastest possible feedback loop for nested-loop fluency.**",
        "Every one of these exercises requires you to answer the same three questions correctly — how many rows, how many columns in *this* row, and what goes in each position. Those are the same three decisions in every grid traversal, every matrix problem, and every two-dimensional dynamic programming table you will write later.",
        "The difference is the feedback. When a DP table has a bad bound, you get a wrong number and no idea where it came from. When a pyramid has a bad bound, **it is visibly crooked**, and the shape tells you which bound is wrong and by how much. That instant, unambiguous error signal is what makes this a good drill and a bad exam question.",
        "Do these until the loop bounds come without thought, then never do them again.",
      ],
    },
    {
      id: "the-method",
      heading: "The method: three questions",
      body: [
        "Every pattern in this module — every pattern anywhere — is solved by answering three questions in order. Do not start typing before you have all three.",
        "**1. How many rows?** This gives the outer loop. Usually `n`, sometimes `2n - 1` for a shape with a mirrored half.",
        "**2. For row `r`, how many of each thing?** This gives the inner loops. Count the leading spaces and the visible characters *separately* — most pyramids are two inner loops, not one.",
        "**3. What character goes at each position?** Usually a constant, sometimes a counter, sometimes derived from the row and column.",
        "Then write it: outer loop over rows, inner loops over the counts, and a newline at the end of each row. That last part is the one people forget, and it produces a single long line instead of a shape.",
      ],
      examples: [
        {
          id: "rectangle",
          title: "The method on the simplest case",
          lang: "python",
          code: `n = 4

# 1. rows: n
# 2. per row: n stars, no spaces
# 3. character: always '*'
for r in range(n):
    print("*" * n)

print("---")

# The same thing with an explicit inner loop, which is what Java needs.
for r in range(n):
    line = ""
    for c in range(n):
        line += "*"
    print(line)`,
          output: `****
****
****
****
---
****
****
****
****`,
          explanation:
            "Python's `\"*\" * n` does the inner loop for you, which is convenient and hides the structure you are here to practise. Both forms are shown because the second is what the method actually describes, and it is what you must write in Java. Note the accumulate-then-print shape: building the line in a variable and printing once is both faster and easier to reason about than printing character by character.",
        },
        {
          id: "triangle",
          title: "The first pattern where the inner bound depends on the row",
          lang: "python",
          code: `n = 4

# 1. rows: n
# 2. per row r (0-based): r + 1 stars
# 3. character: '*'
for r in range(n):
    print("*" * (r + 1))

print("---")

# Inverted: row r has n - r stars.
for r in range(n):
    print("*" * (n - r))`,
          output: `*
**
***
****
---
****
***
**
*`,
          explanation:
            "The whole difficulty of this module is in question 2, and this is the first case where the answer involves `r`. With zero-based rows, row 0 needs one star, so the count is `r + 1`. Getting `r` instead of `r + 1` produces an empty first line — which you can see immediately, which is the point of the drill.",
        },
      ],
      pitfalls: [
        {
          title: "Working in one-based rows in your head and zero-based in the code",
          body: "\"Row 1 has 1 star\" is true for one-based rows, and the code's first row is row 0. Decide which you are using and write it in the comment. Nearly every wrong bound in this module is this mismatch, and it shows up as a shape that is right but shifted by one row.",
        },
      ],
    },
    {
      id: "java-version",
      heading: "The same thing in Java",
      body: [
        "Java has no string repetition operator before `String.repeat`, and building a line with `+=` in a loop is the quadratic trap from Module 2. Use a `StringBuilder`.",
        "The structure is otherwise identical, and being forced to write the inner loop explicitly is arguably better practice.",
      ],
      examples: [
        {
          id: "java-triangle",
          title: "Triangle, built properly",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int n = 4;

        for (int r = 0; r < n; r++) {
            StringBuilder line = new StringBuilder();
            for (int c = 0; c <= r; c++) {
                line.append('*');
            }
            System.out.println(line);
        }

        System.out.println("---");

        for (int r = 0; r < n; r++) {
            System.out.println("*".repeat(r + 1));
        }
    }
}`,
          output: `*
**
***
****
---
*
**
***
****`,
          explanation:
            "Note the inner bound: `c <= r` gives `r + 1` iterations, which is the same count as `c < r + 1`. Both are correct and the second is arguably clearer, because it states the count rather than requiring you to add one in your head. `String.repeat` is the modern shortcut and worth knowing, but the explicit loop is the version this drill is about.",
        },
      ],
    },
    {
      id: "what-to-do",
      heading: "How to work through this module",
      body: [
        "Seven more lessons, each a family of shapes. For every one:",
        "**Answer the three questions on paper first.** Write the row count and the per-row counts before touching the keyboard. If you cannot, the pattern is not yet understood and typing will be guessing.",
        "**Predict the output before running.** Say what the first two rows will look like. Running it to find out is how you end up adjusting bounds at random until it looks right, which teaches nothing.",
        "**When it is wrong, read the shape.** A pyramid leaning left means too few spaces; a triangle missing its top row means the inner bound is off by one; a single long line means a missing newline. The shape is a diagnostic, and reading it is the skill.",
        "Half an hour of this makes nested loop bounds automatic, and everything after this module assumes they are.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What skill do pattern-printing exercises actually build?",
      answer:
        "Fluency with nested loop bounds. Each one requires deciding how many rows, how many items in a given row, and what goes at each position — the same three decisions as any grid traversal, matrix problem or two-dimensional DP table. What makes it an efficient drill rather than a useful skill is the feedback: a wrong bound in a DP table produces a wrong number with no clue, while a wrong bound here produces a visibly crooked shape that says which bound is wrong.",
    },
    {
      question: "Why build each line in a variable rather than printing character by character?",
      answer:
        "One write instead of n. Printing per character means a system call per character, which on any real output is far slower than accumulating the line and printing once — the same argument as batching output on a judge. In Java it also matters which accumulator you use: `+=` on a String in a loop is quadratic, so it must be a `StringBuilder`.",
    },
    {
      question: "How do you approach a pattern you have not seen before?",
      answer:
        "Three questions, in order, before writing anything. How many rows — that is the outer loop. For row `r`, how many leading spaces and how many visible characters — those are the inner loops, counted separately. And what character goes at each position — a constant, a counter, or something derived from row and column. Nearly every mistake is in the second question, and nearly every one of those is a zero-based-versus-one-based mismatch.",
    },
  ],
  takeaways: [
    "These are not the algorithm patterns of Module 1 — the name collision is unfortunate and universal",
    "The drill exists because a wrong loop bound is *visible* here and invisible in a DP table",
    "Three questions: how many rows, how many of each thing per row, what character goes where",
    "Count leading spaces and visible characters separately — most pyramids need two inner loops",
    "With zero-based rows, row `r` of a triangle has `r + 1` characters",
    "Decide zero- or one-based and write it in the comment; the mismatch is the commonest bug",
    "Build the line then print it: one write, and in Java it must be a `StringBuilder`",
    "Predict the first two rows before running, and read the broken shape as a diagnostic",
  ],
};
