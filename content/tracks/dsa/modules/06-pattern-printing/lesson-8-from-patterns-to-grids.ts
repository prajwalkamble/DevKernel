import type { Lesson } from "@/content/types";

export const patternsToGridsLesson: Lesson = {
  id: "dsa-pattern-grids",
  slug: "from-patterns-to-grids",
  moduleSlug: "pattern-printing-problems",
  title: "From Patterns to Grids",
  summary:
    "Cashing the drill in: the same two loops applied to a real two-dimensional array, and the four traversals every matrix problem is built from.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Declare and traverse a two-dimensional array in both languages",
    "Walk a grid by row, by column, and along both diagonals",
    "Write a bounds check that guards a neighbour lookup",
    "See that a matrix problem is the pattern loops with a different per-cell decision",
  ],
  sections: [
    {
      id: "the-payoff",
      heading: "The payoff",
      body: [
        "Seven lessons of shapes were practice for this. A grid problem is the same two nested loops, over a real array instead of a line of output, with a decision per cell instead of a character.",
        "The rest of this lesson is the four traversals and the one guard that between them cover nearly every grid problem in Module 1.",
      ],
      examples: [
        {
          id: "declaring",
          title: "Declaring and walking a grid",
          lang: "python",
          code: `grid = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]

rows = len(grid)
cols = len(grid[0])

print("by row:")
for r in range(rows):
    print(" ".join(str(grid[r][c]) for c in range(cols)))

print("row sums:", [sum(row) for row in grid])
print("total:", sum(sum(row) for row in grid))`,
          output: `by row:
1 2 3
4 5 6
7 8 9
row sums: [6, 15, 24]
total: 45`,
          explanation:
            "`len(grid)` is the number of rows and `len(grid[0])` the number of columns — note that it is `grid[0]`, not `grid`, and that it assumes a non-empty grid. Naming both before the loops is worth the two lines, because `grid[r][c]` with the indices the wrong way round is a bug that only shows up on a non-square grid.",
        },
      ],
      pitfalls: [
        {
          title: "Creating a grid with `[[0] * cols] * rows` in Python",
          body: "That makes `rows` references to the *same* list, so writing to `grid[0][0]` changes every row. Use `[[0] * cols for _ in range(rows)]`, which builds a fresh list per row. This is the aliasing problem from the very first lesson, in the form people actually meet it.",
        },
      ],
    },
    {
      id: "aliasing-demo",
      heading: "The grid-creation trap, demonstrated",
      body: [
        "This deserves seeing rather than being warned about, because the symptom is bizarre and the cause is invisible.",
      ],
      examples: [
        {
          id: "aliasing",
          title: "One write, every row changes",
          lang: "python",
          code: `broken = [[0] * 3] * 3
broken[0][0] = 9
print("broken:", broken)

fixed = [[0] * 3 for _ in range(3)]
fixed[0][0] = 9
print("fixed :", fixed)

print("broken rows share one object:", broken[0] is broken[1])
print("fixed rows share one object :", fixed[0] is fixed[1])`,
          output: `broken: [[9, 0, 0], [9, 0, 0], [9, 0, 0]]
fixed : [[9, 0, 0], [0, 0, 0], [0, 0, 0]]
broken rows share one object: True
fixed rows share one object : False`,
          explanation:
            "One assignment, three rows changed — because `* 3` copied the *reference* three times, not the list. The `is` check confirms it directly. Java's `new int[3][3]` does the right thing and allocates each row separately, so this trap is Python-specific and it catches nearly everybody once.",
        },
      ],
    },
    {
      id: "four-traversals",
      heading: "Four traversals",
      body: [
        "**By row** — the default, `for r` then `for c`. Cache-friendly, and what almost everything uses.",
        "**By column** — `for c` then `for r`. Same cells, different order; needed whenever the problem is about columns.",
        "**The main diagonal** — cells where `r == c`. One loop, not two.",
        "**The anti-diagonal** — cells where `r + c == n - 1`. Also one loop.",
        "The two diagonal conditions are worth memorising: `r == c` and `r + c == n - 1`. They come up in matrix rotation, in board games, and in any problem about diagonal lines.",
      ],
      examples: [
        {
          id: "traversals",
          title: "All four on one grid",
          lang: "python",
          code: `grid = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]
n = len(grid)

print("by row   :", [grid[r][c] for r in range(n) for c in range(n)])
print("by column:", [grid[r][c] for c in range(n) for r in range(n)])
print("diagonal :", [grid[i][i] for i in range(n)])
print("anti     :", [grid[i][n - 1 - i] for i in range(n)])

print("diagonal sum:", sum(grid[i][i] for i in range(n)))
print("anti sum    :", sum(grid[i][n - 1 - i] for i in range(n)))`,
          output: `by row   : [1, 2, 3, 4, 5, 6, 7, 8, 9]
by column: [1, 4, 7, 2, 5, 8, 3, 6, 9]
diagonal : [1, 5, 9]
anti     : [3, 5, 7]
diagonal sum: 15
anti sum    : 15`,
          explanation:
            "The main diagonal runs top-left to bottom-right and the anti-diagonal the other way, so they share only the centre cell. Both need one loop, because fixing `r` determines `c` — writing two nested loops with an `if r == c` inside gives the right answer while doing n² work to visit n cells. That the two sums are equal here is a property of this particular grid, not a general rule.",
        },
      ],
    },
    {
      id: "bounds",
      heading: "The neighbour guard",
      body: [
        "Almost every grid algorithm asks about a cell's neighbours, and every one of those lookups can fall off the edge. The guard is the same every time, and it is worth having as a named function.",
        "`0 <= r < rows and 0 <= c < cols` — which in Python is the chained comparison from the operators module, and in Java is four clauses joined by `&&`.",
        "The direction list is the other half: `[(-1, 0), (1, 0), (0, -1), (0, 1)]` for the four orthogonal neighbours, plus the four diagonals when a problem counts those. Writing the directions as data rather than as four copy-pasted blocks is what keeps flood fill and BFS short.",
      ],
      examples: [
        {
          id: "neighbours",
          title: "Directions as data, bounds as a function",
          lang: "python",
          code: `grid = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]
rows, cols = len(grid), len(grid[0])
DIRECTIONS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def in_bounds(r, c):
    return 0 <= r < rows and 0 <= c < cols


for r, c in [(1, 1), (0, 0)]:
    neighbours = []
    for dr, dc in DIRECTIONS:
        nr, nc = r + dr, c + dc
        if in_bounds(nr, nc):
            neighbours.append(grid[nr][nc])
    print(f"cell ({r},{c}) = {grid[r][c]}, neighbours {neighbours}")`,
          output: `cell (1,1) = 5, neighbours [2, 8, 4, 6]
cell (0,0) = 1, neighbours [4, 2]`,
          explanation:
            "The centre cell has four neighbours and the corner has two — the guard handles both with no special case for edges or corners, which is the entire reason to write it. This exact shape, a direction list plus a bounds check, is the skeleton of Number of Islands, flood fill, rotting oranges and every grid BFS in Module 1.",
        },
      ],
    },
    {
      id: "closing",
      heading: "Closing the module",
      body: [
        "Eight lessons of shapes, cashed in. What you should have now is that two nested loops over rows and columns, with a decision per position, is *automatic* — not something you derive each time.",
        "That is the whole objective, and it is the reason this module exists in a DSA track at all. Every matrix problem in Module 1 is these loops. Every dynamic-programming table is these loops. The difference is only what the decision at each cell is.",
        "One honest caveat: **pattern printing itself is not an interview topic.** Nobody will ask you to print a diamond. The bounds fluency transfers; the shapes do not. Do a dozen, get fast, and move on.",
        "Next is functions and the call stack, where these loops start getting names.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you check whether a grid coordinate is in bounds?",
      answer:
        "`0 <= r < rows && 0 <= c < cols` — in Python that chains directly, in Java it is four clauses joined by `&&`. It is worth extracting as a named function because every neighbour lookup needs it, and having it in one place means edges and corners need no special cases: the guard simply rejects the neighbours that do not exist. Paired with a direction list, it is the skeleton of every flood fill and grid BFS.",
    },
    {
      question: "Why is `[[0] * cols] * rows` wrong in Python?",
      answer:
        "It creates one row and then `rows` references to that same list, so assigning to `grid[0][0]` appears to change every row. The correct form is `[[0] * cols for _ in range(rows)]`, which evaluates the inner expression once per row and produces distinct lists. Java's `new int[rows][cols]` allocates each row separately and has no equivalent trap. It is the aliasing problem — a name is not the value — in the form people actually meet it.",
    },
    {
      question: "How do you iterate the diagonals of a square matrix?",
      answer:
        "The main diagonal is the cells where `r == c`, so one loop over `i` reading `grid[i][i]`. The anti-diagonal is where `r + c == n - 1`, so `grid[i][n - 1 - i]`. Both need a single loop, because fixing the row determines the column — using two nested loops with an `if r == c` inside gives the right answer while doing n² work to visit n cells.",
    },
  ],
  takeaways: [
    "A grid problem is the pattern loops with a decision per cell instead of a character",
    "`len(grid)` is rows and `len(grid[0])` is columns; name both before looping",
    "`[[0] * cols] * rows` aliases one row `rows` times — use a comprehension",
    "Four traversals: by row, by column, main diagonal `r == c`, anti-diagonal `r + c == n - 1`",
    "Both diagonals need one loop, not two with a condition",
    "`0 <= r < rows and 0 <= c < cols` as a named function removes every edge and corner special case",
    "A direction list as data keeps flood fill and BFS short",
    "Pattern printing is not an interview topic; the bounds fluency is what transfers",
  ],
};
