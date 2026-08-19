import type { Lesson } from "@/content/types";

export const hollowPatternsLesson: Lesson = {
  id: "dsa-pattern-hollow",
  slug: "hollow-patterns",
  moduleSlug: "pattern-printing-problems",
  title: "Hollow Patterns & Turning a Border Into a Condition",
  summary:
    "Frames, outlines and rings — and the shift from \"which loops draw this?\" to \"what is true at this position?\", which is how grid problems are actually solved.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Print a hollow rectangle, triangle and diamond",
    "Express a border as a condition on the row and column",
    "Print concentric rings using distance from the edge",
    "Explain why the condition form generalises where loop bounds do not",
  ],
  sections: [
    {
      id: "the-shift",
      heading: "The shift in thinking",
      body: [
        "Every pattern so far was built by *drawing segments*: this many spaces, then this many stars. Hollow shapes can be built that way too — indent, one star, gap, one star — and it gets unwieldy fast, because each row has four or five segments with their own bounds.",
        "The better move is to invert the question. Instead of asking *which loops draw this row?*, ask **for each position, is it part of the shape?**",
        "That turns every hollow pattern into one loop over all positions plus a boolean expression. And it is not merely tidier: it is the form that scales to shapes with no simple segment structure, and it is exactly how you write a grid traversal later.",
      ],
      examples: [
        {
          id: "hollow-rectangle",
          title: "A hollow rectangle, both ways",
          lang: "python",
          code: `rows, cols = 4, 8

print("by segments:")
for r in range(rows):
    if r == 0 or r == rows - 1:
        print("*" * cols)
    else:
        print("*" + " " * (cols - 2) + "*")

print("by condition:")
for r in range(rows):
    line = ""
    for c in range(cols):
        on_border = r == 0 or r == rows - 1 or c == 0 or c == cols - 1
        line += "*" if on_border else " "
    print(line)`,
          output: `by segments:
********
*      *
*      *
********
by condition:
********
*      *
*      *
********`,
          explanation:
            "For a rectangle the segment version is shorter, and that is honest — it is the right choice here. The condition version is worth having because it does not change shape as the pattern gets harder: the next three examples are all the same seven lines with a different boolean, while their segment versions would each need a fresh derivation.",
        },
      ],
    },
    {
      id: "hollow-triangle",
      heading: "Hollow triangles",
      body: [
        "A right triangle's border is its first column, its diagonal, and its bottom row. As a condition, for row `r` and column `c` where the row has `r + 1` positions:",
        "`c == 0` — the vertical edge. `c == r` — the diagonal. `r == n - 1` — the base.",
        "Three clauses, one `or`, and the whole shape is described. Compare that with working out where each segment starts and stops on each row.",
      ],
      examples: [
        {
          id: "hollow-triangles",
          title: "Right and centred, same structure",
          lang: "python",
          code: `n = 6

print("hollow right triangle:")
for r in range(n):
    line = ""
    for c in range(r + 1):
        on_border = c == 0 or c == r or r == n - 1
        line += "*" if on_border else " "
    print(line)

print("hollow pyramid:")
for r in range(n):
    line = " " * (n - r - 1)
    width = 2 * r + 1
    for c in range(width):
        on_border = c == 0 or c == width - 1 or r == n - 1
        line += "*" if on_border else " "
    print(line.rstrip())`,
          output: `hollow right triangle:
*
**
* *
*  *
*   *
******
hollow pyramid:
     *
    * *
   *   *
  *     *
 *       *
***********`,
          explanation:
            "Two shapes, one structure — only the row width and the space prefix differ. Note row 1 of the triangle prints `**` rather than `* *`: with two positions, `c == 0` and `c == r` are positions 0 and 1, which are adjacent, so there is no interior. That is correct behaviour falling out of the condition rather than needing a special case, which is the argument for this form.",
        },
      ],
    },
    {
      id: "rings",
      heading: "Concentric rings",
      body: [
        "Once the border is a condition, patterns that have no segment description at all become easy. Concentric rings are the standard example: each position's character depends on **how far it is from the nearest edge**.",
        "For a grid of size `n`, that distance is `min(r, c, n - 1 - r, n - 1 - c)` — the smallest of the four distances to the four sides. A ring is all the positions sharing one such distance.",
        "There is no way to write that as segment bounds without a great deal of arithmetic. As a condition it is one line, and it is the same `min` expression that appears in spiral-traversal and matrix-layer problems.",
      ],
      examples: [
        {
          id: "rings",
          title: "Distance from the nearest edge",
          lang: "python",
          code: `n = 7

for r in range(n):
    line = ""
    for c in range(n):
        depth = min(r, c, n - 1 - r, n - 1 - c)
        line += str(depth)
    print(line)

print("---")

for r in range(n):
    line = ""
    for c in range(n):
        depth = min(r, c, n - 1 - r, n - 1 - c)
        line += "*" if depth % 2 == 0 else " "
    print(line)`,
          output: `0000000
0111110
0122210
0123210
0122210
0111110
0000000
---
*******
*     *
* *** *
* * * *
* *** *
*     *
*******`,
          explanation:
            "The first grid prints the depth itself, which makes the structure visible — a plateau in the middle and rings around it. The second draws a ring wherever the depth is even. Neither has any loop-bound arithmetic at all: the shape is entirely in the expression, and changing `% 2 == 0` to `== 2` would draw a single ring instead.",
        },
      ],
    },
    {
      id: "java",
      heading: "In Java, and why this matters later",
      body: [
        "The Java version is the same idea with a `StringBuilder`. What is worth drawing out is the connection forward.",
        "**Every grid problem in Module 1 has this shape.** Iterate the cells, and for each one evaluate a condition — is it land, is it visited, is it inside the bounds. Number of Islands, flood fill, rotting oranges, matrix rotation: all of them are two nested loops over `r` and `c` with a decision per cell.",
        "So the habit built here is not about triangles. It is the habit of **iterating positions and deciding per position**, which is the default shape of two-dimensional problems.",
      ],
      examples: [
        {
          id: "java-rings",
          title: "The same rings in Java",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int n = 7;

        for (int r = 0; r < n; r++) {
            StringBuilder line = new StringBuilder();
            for (int c = 0; c < n; c++) {
                int depth = Math.min(Math.min(r, c), Math.min(n - 1 - r, n - 1 - c));
                line.append(depth % 2 == 0 ? '*' : ' ');
            }
            System.out.println(line);
        }
    }
}`,
          output: `*******
*     *
* *** *
* * * *
* *** *
*     *
*******`,
          explanation:
            "`Math.min` takes only two arguments, so four values need nesting — which is worth noticing because it is the kind of small friction that makes people reach for an `if` chain instead. The ternary inside `append` is exactly the case the ternary lesson called worthwhile: one value, one simple condition, inside an expression where a statement would not fit.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How would you print a hollow rectangle?",
      answer:
        "Either by segments — full rows top and bottom, and a star, gap, star for the middle rows — or by condition, iterating every position and drawing a star when `r == 0 || r == rows - 1 || c == 0 || c == cols - 1`. For a rectangle the segment version is shorter and perfectly fine. The condition version is worth knowing because it does not change shape as the pattern gets harder, and it is the same structure as every grid traversal.",
    },
    {
      question: "How do you draw concentric rings in a square grid?",
      answer:
        "By each cell's distance from the nearest edge: `min(r, c, n - 1 - r, n - 1 - c)`. All the cells sharing one such value form a ring, so drawing every even depth gives alternating rings and testing for one specific value gives a single ring. There is no reasonable way to express it as segment bounds, and the same `min` expression appears in spiral traversal and any problem that peels a matrix layer by layer.",
    },
    {
      question: "Why does the condition form matter beyond pattern printing?",
      answer:
        "Because it is the shape of every two-dimensional problem. Iterating rows and columns and deciding something per cell is exactly what flood fill, island counting, matrix rotation and grid BFS all do — the loops are identical and only the per-cell decision changes. Practising it on shapes, where a wrong condition is immediately visible, builds the habit before it has to be applied where the error would be invisible.",
    },
  ],
  takeaways: [
    "Ask \"is this position part of the shape?\" rather than \"which loops draw this row?\"",
    "A hollow rectangle's border is `r == 0 || r == rows-1 || c == 0 || c == cols-1`",
    "A hollow triangle's is `c == 0 || c == r || r == n-1` — three clauses, one or",
    "Adjacent edges collapse correctly with no special case, which is the argument for the condition form",
    "Distance from the nearest edge is `min(r, c, n-1-r, n-1-c)`, and rings share one value",
    "That `min` is the same expression used in spiral traversal and matrix layers",
    "`Math.min` takes two arguments, so four values need nesting",
    "Every grid problem in Module 1 is these two loops with a different per-cell decision",
  ],
};
