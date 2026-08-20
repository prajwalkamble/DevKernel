import type { Lesson } from "@/content/types";

export const twoDimensionalLesson: Lesson = {
  id: "dsa-ps-2d",
  slug: "two-dimensional-prefix-sums",
  moduleSlug: "prefix-sums-and-range-queries",
  title: "Two-Dimensional Prefix Sums",
  summary:
    "Submatrix sums in O(1) after an O(mn) build. Four terms rather than two, and the signs come from inclusion-exclusion — which is worth deriving once with a drawing rather than memorising.",
  estimatedMinutes: 30,
  objectives: [
    "Build a 2D prefix table with the leading row and column",
    "Query any submatrix sum with four lookups",
    "Derive the four signs from inclusion-exclusion",
    "Reduce a 2D problem to a 1D one by fixing a row pair",
  ],
  sections: [
    {
      id: "the-build",
      heading: "Building",
      body: [
        "`p[r][c]` is the sum of the rectangle from `(0, 0)` to `(r - 1, c - 1)` — again one larger in each dimension, and again so that no query needs a boundary check.",
        "**`p[r+1][c+1] = m[r][c] + p[r][c+1] + p[r+1][c] - p[r][c]`**",
        "Read it as: this cell, plus everything above it, plus everything to its left, minus the block that both of those included. That last subtraction is the only interesting part, and it is there because the top-left region was counted twice.",
      ],
    },
    {
      id: "the-query",
      heading: "Querying",
      body: [
        "For the inclusive rectangle from `(r1, c1)` to `(r2, c2)`:",
        "**`p[r2+1][c2+1] - p[r1][c2+1] - p[r2+1][c1] + p[r1][c1]`**",
        "Big rectangle, minus the strip above, minus the strip to the left, plus the top-left corner that was subtracted twice. The worked example is in the difference-arrays lesson, which runs all four corner cases against a brute-force check.",
        "**Draw it once.** Four rectangles, on paper, with the overlap shaded. Two minutes spent there is worth more than any mnemonic, because the same reasoning reappears in 2D difference arrays, in counting problems with inclusion-exclusion, and in the combinatorics module.",
      ],
    },
    {
      id: "reduction",
      heading: "The reduction that solves the hard ones",
      body: [
        "The most valuable 2D technique is not the prefix table itself — it is using it to turn a 2D problem into a 1D one you already know.",
        "**Maximum sum submatrix.** Fix a *pair* of rows `(top, bottom)`. Collapse every column between them into a single number — the sum of that column within those rows, which a prefix table gives in O(1). Now you have a 1D array, and \"maximum sum submatrix\" has become \"maximum sum subarray\", which is Kadane's. Total cost: O(rows² · cols).",
        "**Count submatrices summing to target.** Same collapse, then the hash-map technique from lesson 2 on each collapsed array. O(rows² · cols) again.",
        "This *fix two boundaries and collapse* move is the general answer to 2D versions of 1D problems, and recognising it is worth more than the table.",
      ],
      pitfalls: [
        {
          title: "Off-by-one between the padded table and the problem's indices",
          body: "The table is 1-indexed relative to the matrix. Every query needs `+1` on the bottom-right and the raw index on the top-left. Write the query as a named function once and never inline it — inlining is where the signs get mixed up.",
        },
        {
          title: "Building row-major then querying column-major",
          body: "Both the build and the query must agree on which index is the row. It sounds obvious and is the most common source of a table that is transposed relative to the queries, which gives correct answers only on square symmetric inputs.",
        },
        {
          title: "Memory on large grids",
          body: "A 2000 × 2000 table of 64-bit integers is 32 MB. That is fine in most judges and not in all of them. If the values are small and the grid is huge, consider whether a per-row 1D prefix is enough — for many problems it is, and it is O(rows) memory.",
        },
      ],
    },
  ],
  takeaways: [
    "`p` is one row and one column larger, so queries need no boundary checks",
    "Build: cell + above + left − the doubly-counted top-left block",
    "Query: big − top strip − left strip + top-left corner",
    "Derive the signs by drawing the rectangles, not by memorising",
    "Fix a row pair and collapse the columns to reduce 2D to 1D",
    "That reduction turns max-sum-submatrix into Kadane's, in O(rows² · cols)",
    "Write the query as a named function; never inline the four terms",
  ],
  status: "available",
};
