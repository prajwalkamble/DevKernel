import type { Lesson } from "@/content/types";

export const numberPatternsLesson: Lesson = {
  id: "dsa-pattern-numbers",
  slug: "number-patterns",
  moduleSlug: "pattern-printing-problems",
  title: "Number Patterns, Floyd's & Pascal's Triangle",
  summary:
    "The same loops with a value that depends on position — and Pascal's triangle, which is the first pattern here that is genuinely a computation.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Print numbers that depend on the row, the column, or a running counter",
    "Build Floyd's triangle with a counter that survives across rows",
    "Compute Pascal's triangle from the previous row",
    "Handle alignment when the numbers have different widths",
  ],
  sections: [
    {
      id: "three-sources",
      heading: "Three places the number can come from",
      body: [
        "Everything in this lesson uses loops you already have. The only new question is the third one from lesson 1: **what goes at each position?**",
        "**From the column.** `1 2 3` on every row. The value is `c + 1`, and the row is irrelevant.",
        "**From the row.** `1 1 1`, then `2 2 2`. The value is `r + 1`, and the column is irrelevant.",
        "**From a running counter.** 1, 2, 3, 4… continuing across row boundaries. The counter lives *outside* the outer loop, which is the one structural difference in this lesson.",
        "Recognising which of the three a pattern uses is the whole exercise; the loops themselves are unchanged from the last two lessons.",
      ],
      examples: [
        {
          id: "three-sources",
          title: "All three, on the same triangle",
          lang: "python",
          code: `n = 4

print("from the column:")
for r in range(n):
    print(" ".join(str(c + 1) for c in range(r + 1)))

print("from the row:")
for r in range(n):
    print(" ".join(str(r + 1) for c in range(r + 1)))

print("from a running counter:")
counter = 1
for r in range(n):
    values = []
    for c in range(r + 1):
        values.append(str(counter))
        counter += 1
    print(" ".join(values))`,
          output: `from the column:
1
1 2
1 2 3
1 2 3 4
from the row:
1
2 2
3 3 3
4 4 4 4
from a running counter:
1
2 3
4 5 6
7 8 9 10`,
          explanation:
            "Three different shapes from one loop structure. The third is Floyd's triangle, and the thing to notice is where `counter` is declared: outside both loops, so it keeps its value across rows. Declaring it inside the outer loop restarts it every row and gives you the first pattern back.",
        },
      ],
      pitfalls: [
        {
          title: "Resetting the counter inside the outer loop",
          body: "The most common Floyd's triangle bug, and it produces the column-based pattern instead — which looks deliberate and is wrong. If a running-total pattern comes out repeating, check the scope of the accumulator before anything else.",
        },
      ],
    },
    {
      id: "alignment",
      heading: "Alignment, once the numbers reach two digits",
      body: [
        "Single digits line up for free. The moment a value reaches 10, joining with a single space makes the columns ragged, and the shape stops being readable.",
        "The fix is to pad each value to a fixed width — the width of the largest value you will print. `f\"{value:>3}\"` in Python, `String.format(\"%3d\", value)` in Java.",
        "Working out the largest value in advance is part of the derivation: for Floyd's triangle with `n` rows the last value is `n(n+1)/2`, so the width is the digit count of that.",
      ],
      examples: [
        {
          id: "alignment",
          title: "Ragged, then aligned",
          lang: "python",
          code: `n = 6

print("unaligned:")
counter = 1
for r in range(n):
    row = []
    for c in range(r + 1):
        row.append(str(counter))
        counter += 1
    print(" ".join(row))

last = n * (n + 1) // 2
width = len(str(last))
print(f"largest value is {last}, so width is {width}")

print("aligned:")
counter = 1
for r in range(n):
    row = []
    for c in range(r + 1):
        row.append(f"{counter:>{width}}")
        counter += 1
    print(" ".join(row))`,
          output: `unaligned:
1
2 3
4 5 6
7 8 9 10
11 12 13 14 15
16 17 18 19 20 21
largest value is 21, so width is 2
aligned:
 1
 2  3
 4  5  6
 7  8  9 10
11 12 13 14 15
16 17 18 19 20 21`,
          explanation:
            "Look at the fourth row of each. Unaligned, the `10` pushes everything after it out of column. Aligned, every value occupies two characters and the columns are straight. The width is computed rather than guessed — `n(n+1)/2` is the last value of Floyd's triangle, which is the same triangular number from the nested-loops lesson.",
        },
      ],
    },
    {
      id: "pascal",
      heading: "Pascal's triangle",
      body: [
        "This is the first pattern in the module that is a genuine computation rather than an arrangement, and it is the one worth actually understanding — the same numbers appear in combinatorics, in dynamic programming, and in binomial coefficients.",
        "The rule: **each value is the sum of the two above it.** The edges are 1, and everything inside is `previous[c - 1] + previous[c]`.",
        "Which means you do not compute each value from scratch — you build each row from the row before it. That is the same idea as dynamic programming, met here in its simplest possible form.",
      ],
      examples: [
        {
          id: "pascal",
          title: "Each row from the one above",
          lang: "python",
          code: `n = 6

rows = []
for r in range(n):
    row = [1] * (r + 1)
    for c in range(1, r):
        row[c] = rows[r - 1][c - 1] + rows[r - 1][c]
    rows.append(row)

width = len(str(max(rows[-1])))
for r, row in enumerate(rows):
    padding = " " * ((n - r - 1) * (width + 1) // 2)
    print(padding + " ".join(f"{v:>{width}}" for v in row))`,
          output: `        1
       1  1
     1  2  1
    1  3  3  1
  1  4  6  4  1
 1  5 10 10  5  1`,
          explanation:
            "The inner loop runs from 1 to `r - 1`, leaving the two ends as the 1s they were initialised to — which is why the row starts as `[1] * (r + 1)` rather than empty. Note the padding calculation centres each row over the widest one; that is presentational, and getting it slightly wrong is why the top rows here sit a fraction off centre. The numbers are what matter.",
        },
        {
          id: "pascal-java",
          title: "The same in Java",
          lang: "java",
          code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        int n = 6;
        List<int[]> rows = new ArrayList<>();

        for (int r = 0; r < n; r++) {
            int[] row = new int[r + 1];
            row[0] = 1;
            row[r] = 1;
            for (int c = 1; c < r; c++) {
                int[] previous = rows.get(r - 1);
                row[c] = previous[c - 1] + previous[c];
            }
            rows.add(row);
        }

        for (int[] row : rows) {
            StringBuilder line = new StringBuilder();
            for (int v : row) {
                line.append(String.format("%3d", v));
            }
            System.out.println(line);
        }
    }
}`,
          output: `  1
  1  1
  1  2  1
  1  3  3  1
  1  4  6  4  1
  1  5 10 10  5  1`,
          explanation:
            "Same computation, left-aligned rather than centred. `row[0] = 1; row[r] = 1;` sets both ends explicitly — note that for `r = 0` those are the same element, assigned twice, which is harmless and worth noticing as the kind of boundary case that usually is not. `%3d` pads to three characters, which handles values up to 999.",
        },
      ],
      pitfalls: [
        {
          title: "Reading the previous row while overwriting the current one",
          body: "If you build a row in place over the previous one, `row[c - 1]` has already been updated by the time you read it and the values come out wrong. Either keep the previous row separately, as here, or iterate right to left so the values you read are still the old ones — the same trick as in-place dynamic programming.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you print Floyd's triangle?",
      answer:
        "A counter declared outside both loops, incremented once per position, printed as you go — row `r` holding `r + 1` values. The structural point is the counter's scope: declaring it inside the outer loop restarts it each row and produces a column-based pattern instead, which looks deliberate and is wrong. For alignment, the largest value is `n(n+1)/2`, so pad each value to the digit count of that.",
    },
    {
      question: "How is Pascal's triangle computed?",
      answer:
        "Each interior value is the sum of the two directly above it, with 1s down both edges. So each row is built from the previous one rather than from scratch: initialise the row to all 1s of the right length and fill positions 1 to `r - 1` from `previous[c - 1] + previous[c]`. It is the simplest example of the dynamic-programming idea — reuse the answer you already computed instead of recomputing — and the values are the binomial coefficients.",
    },
    {
      question: "What goes wrong when you build Pascal's triangle in place?",
      answer:
        "Reading a value you have already overwritten. Filling left to right over the previous row means `row[c - 1]` has been updated before `row[c]` reads it, so the sums use new values instead of old ones. The fixes are to keep the previous row separately, or to iterate right to left so every value you read is still the old one — which is exactly the technique used for space-optimised DP tables.",
    },
  ],
  takeaways: [
    "The value at a position comes from the column, the row, or a running counter",
    "A running counter must live outside the outer loop, or it restarts each row",
    "Pad to a fixed width once values reach two digits, or the columns go ragged",
    "Compute the width from the largest value: Floyd's triangle ends at `n(n+1)/2`",
    "Pascal's triangle: 1s on the edges, and each interior value is the sum of the two above",
    "Build each row from the previous one — the simplest form of dynamic programming",
    "Building it in place left to right reads values you have already overwritten",
    "Iterating right to left, or keeping the previous row, both fix that",
  ],
};
