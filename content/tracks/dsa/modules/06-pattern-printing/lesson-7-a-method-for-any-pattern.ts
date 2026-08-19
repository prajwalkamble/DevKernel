import type { Lesson } from "@/content/types";

export const methodForAnyPatternLesson: Lesson = {
  id: "dsa-pattern-method",
  slug: "a-method-for-any-pattern",
  moduleSlug: "pattern-printing-problems",
  title: "A Method for Any Pattern",
  summary:
    "The full procedure, applied cold to a shape that appears nowhere else in this module — and the table you fill in before writing a line.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Apply the three questions to an unseen pattern without guessing",
    "Fill in a row table from the target output before writing code",
    "Derive a formula from the table rather than by trial and error",
    "Diagnose a broken pattern from its shape alone",
  ],
  sections: [
    {
      id: "the-procedure",
      heading: "The procedure, in full",
      body: [
        "Everything in this module has been one method. Here it is stated completely, because the point of the last lesson is to run it cold.",
        "**1. Write out the target, by hand, for a small n.** Four or five rows. Actually write it — the counts have to come from somewhere and guessing them from a description is where people go wrong.",
        "**2. Make a table.** One row per output row, with columns for the row index and for every count you can see: leading spaces, characters, values.",
        "**3. Find the formula for each column.** Look at how each count changes from row to row. Constant, `r`, `r + 1`, `n - r`, `2r + 1` — it is nearly always one of those five.",
        "**4. Check the table against the extremes.** Substitute `r = 0` and `r = n - 1` into each formula and confirm they give the first and last rows you wrote down.",
        "**5. Write the loops.** Outer over rows, one inner loop per column of the table, in left-to-right order.",
        "The work is in steps 1 to 4, and they take about two minutes with a pen. Step 5 is transcription.",
      ],
    },
    {
      id: "worked-example",
      heading: "Worked cold: a hollow inverted pyramid with a numbered border",
      body: [
        "This shape appears nowhere else in this module, which is the point. Here is the target for n = 5, and then the method applied to it.",
      ],
      examples: [
        {
          id: "target",
          title: "Step 1 — the target, written out by hand",
          lang: "bash",
          code: `n = 5, and the shape we want:

        123456789
         2     8
          3   7
           4 6
            5

Reading it off:

  row r   leading spaces   width   what is printed
  -----   --------------   -----   ------------------------------
    0            0            9    every digit 1..9
    1            1            7    first and last only: 2 and 8
    2            2            5    first and last only: 3 and 7
    3            3            3    first and last only: 4 and 6
    4            4            1    a single 5`,
          explanation:
            "The table is the whole exercise. Three columns of counts, read directly off the drawing, with no attempt yet to find formulas. Note the last row: with width 1 the first and last positions coincide, so only one character appears — a boundary case visible in the table before any code exists.",
        },
        {
          id: "formulas",
          title: "Steps 3 and 4 — formulas, checked at both ends",
          lang: "bash",
          code: `  column            values          formula        check r=0    check r=4
  ---------------   -------------   ------------   ----------   -----------
  leading spaces    0 1 2 3 4       r              0  correct    4  correct
  width             9 7 5 3 1       2(n-r)-1       9  correct    1  correct
  first value       1 2 3 4 5       r+1            1  correct    5  correct
  last value        9 8 7 6 5       2n-r-1         9  correct    5  correct
  value at col c    1..9 on row 0   r+1+c          -            -

  Border test: c == 0 or c == width - 1, or r == 0 (the top is solid).`,
          explanation:
            "Each formula is checked at both extremes rather than trusted. The width formula is the inverted pyramid's, `2(n - r) - 1`, which is the substitution trick from the pyramids lesson applied to `2r + 1`. The per-position value is `r + 1 + c`, which the top row confirms: at `r = 0` it runs 1 to 9. The last-value row is worth adding as a cross-check — it is what catches the drawing being wrong, which is exactly what happened the first time this example was written.",
        },
        {
          id: "the-code",
          title: "Step 5 — transcription",
          lang: "python",
          code: `n = 5

for r in range(n):
    line = " " * r
    width = 2 * (n - r) - 1
    for c in range(width):
        on_border = c == 0 or c == width - 1 or r == 0
        line += str(r + 1 + c) if on_border else " "
    print(line.rstrip())`,
          output: `123456789
 2     8
  3   7
   4 6
    5`,
          explanation:
            "Correct on the first run, because every decision was made before typing. Note there is no special case for the final row: with width 1, `c == 0` and `c == width - 1` are both position 0, the condition is true once, and a single character prints. The boundary the table exposed in step 1 handled itself.",
        },
      ],
    },
    {
      id: "diagnosing",
      heading: "Reading a broken shape",
      body: [
        "When it does come out wrong, the shape names the bug. This is the diagnostic table, and it is worth internalising because the same reasoning applies to any two-dimensional output.",
        "**Everything on one line** — no newline at the end of each row.",
        "**One row too few or too many** — the outer bound is `n - 1` or `n + 1`.",
        "**First row empty** — a count that should be `r + 1` is `r`.",
        "**Shape leans the wrong way** — the *space* count is inverted; swap `r` for `n - r - 1`.",
        "**Right edge ragged** — spaces plus characters do not total the width on every row.",
        "**Upside down** — the outer loop should count the other way, or `r` should be substituted.",
        "**Interior filled in** — the border condition is missing a clause, usually the base row.",
        "Each symptom maps to exactly one of the counts in your table, which is the practical reason to have written the table down.",
      ],
      examples: [
        {
          id: "diagnosing",
          title: "Four bugs, four visible symptoms",
          lang: "python",
          code: `n = 4

print("correct:")
for r in range(n):
    print(" " * (n - r - 1) + "*" * (2 * r + 1))

print("space count inverted:")
for r in range(n):
    print(" " * r + "*" * (2 * r + 1))

print("star count not odd:")
for r in range(n):
    print(" " * (n - r - 1) + "*" * (r + 1))

print("outer bound one short:")
for r in range(n - 1):
    print(" " * (n - r - 1) + "*" * (2 * r + 1))`,
          output: `correct:
   *
  ***
 *****
*******
space count inverted:
*
 ***
  *****
   *******
star count not odd:
   *
  **
 ***
****
outer bound one short:
   *
  ***
 *****`,
          explanation:
            "Four distinct symptoms. The inverted spaces produce a shape sliding right; the non-odd star count produces a right triangle wearing a pyramid's indent, with a ragged left edge; the short outer bound simply drops the base. None of these requires reading the code to identify — the shape says which count is wrong, and the table says which line to change.",
        },
      ],
    },
    {
      id: "moving-on",
      heading: "When to stop",
      body: [
        "There is a large supply of these exercises and diminishing returns after about a dozen. You are done when you can look at a shape and say the row count and the per-row counts before reaching for the keyboard — and when a broken shape tells you which count is wrong rather than sending you back to the start.",
        "That is the whole objective. Nested loop bounds should now be something you derive in a few seconds rather than something you adjust until the output looks right.",
        "The next module is functions, where the loops you have been writing get names and start being called from elsewhere.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you approach an unfamiliar pattern-printing problem?",
      answer:
        "Write out the target by hand for a small n, then tabulate one row per output row with a column for each visible count — leading spaces, characters, values. Find the formula for each column from how it changes down the table; it is nearly always constant, `r`, `r + 1`, `n - r` or `2r + 1`. Check each formula by substituting the first and last row. Only then write the loops, which at that point is transcription rather than problem solving.",
    },
    {
      question: "A pyramid comes out leaning to the right. What is wrong?",
      answer:
        "The leading-space count is inverted — it is growing when it should shrink. A centred pyramid needs `n - r - 1` spaces so the indent decreases as the rows widen; using `r` makes the shape slide rightwards. The general diagnostic is that the space count controls the lean and the character count controls the width, so a leaning shape points at one line and a ragged one at the other.",
    },
    {
      question: "Why is this drill worth doing at all?",
      answer:
        "Because it builds nested-loop-bound fluency with instant, unambiguous feedback. The same three decisions — how many rows, how many per row, what goes at each position — appear in every grid traversal, matrix problem and two-dimensional DP table, but there a wrong bound produces a wrong number with no clue where it came from. Here it produces a visibly crooked shape that names the faulty count. It is a drill, not a skill: do a dozen, then move on.",
    },
  ],
  takeaways: [
    "Write the target by hand first; the counts have to be read off something real",
    "Tabulate one row per output row, with a column for every visible count",
    "The formula is nearly always constant, `r`, `r + 1`, `n - r` or `2r + 1`",
    "Check each formula at `r = 0` and `r = n - 1` before writing any code",
    "The loops are transcription — one inner loop per column of the table",
    "Everything on one line means a missing newline; an empty first row means `r` should be `r + 1`",
    "The space count controls the lean; the character count controls the width",
    "You are done when you can state the counts before typing, and diagnose a break from the shape",
  ],
};
