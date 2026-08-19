import type { Lesson } from "@/content/types";

export const rectanglesTrianglesLesson: Lesson = {
  id: "dsa-pattern-rectangles",
  slug: "rectangles-and-right-triangles",
  moduleSlug: "pattern-printing-problems",
  title: "Rectangles & Right Triangles",
  summary:
    "The four orientations of a right triangle, derived rather than memorised — and the observation that all four are the same loop with a different bound.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Print a rectangle of any width and height",
    "Print all four orientations of a right triangle",
    "Derive the per-row count for each from the three questions",
    "Recognise that the orientation is decided entirely by one expression",
  ],
  sections: [
    {
      id: "rectangle",
      heading: "Rectangles, and separating rows from columns",
      body: [
        "A rectangle is the base case, and the only thing worth noticing is that **height and width are independent**. The outer loop counts rows and the inner loop counts columns, and neither should be written in terms of the other.",
        "Beginners frequently write one loop over `n` and try to make the shape come out of it. Two loops with two names is clearer and generalises immediately.",
      ],
      examples: [
        {
          id: "rectangle",
          title: "Independent height and width",
          lang: "python",
          code: `def rectangle(rows, cols, ch="*"):
    for r in range(rows):
        line = ""
        for c in range(cols):
            line += ch
        print(line)


rectangle(3, 6)
print("---")
rectangle(2, 2, "#")`,
          output: `******
******
******
---
##
##`,
          explanation:
            "Three rows of six, then two of two. The inner loop's bound never mentions `r`, which is exactly what makes this a rectangle — the moment it does, you have a triangle. That is the whole of the next section.",
        },
      ],
    },
    {
      id: "four-orientations",
      heading: "Four right triangles, one loop",
      body: [
        "A right triangle has a vertical edge, a horizontal edge and a diagonal. The four orientations are decided by which corner the right angle sits in, and each one is the same nested loop with a different inner bound.",
        "**Top-left.** Row `r` has `r + 1` characters. Grows downward.",
        "**Bottom-left.** Row `r` has `n - r` characters. Shrinks downward.",
        "**Top-right.** Row `r` has `n - r - 1` spaces then `r + 1` characters — the same growth, pushed right by a shrinking indent.",
        "**Bottom-right.** Row `r` has `r` spaces then `n - r` characters.",
        "That is the whole family. Notice the pattern in the counts: growing is `r + 1`, shrinking is `n - r`, and right-alignment is a leading-space count that does the opposite of the character count.",
      ],
      examples: [
        {
          id: "four-triangles",
          title: "All four, side by side",
          lang: "python",
          code: `n = 4

print("top-left:")
for r in range(n):
    print("*" * (r + 1))

print("bottom-left:")
for r in range(n):
    print("*" * (n - r))

print("top-right:")
for r in range(n):
    print(" " * (n - r - 1) + "*" * (r + 1))

print("bottom-right:")
for r in range(n):
    print(" " * r + "*" * (n - r))`,
          output: `top-left:
*
**
***
****
bottom-left:
****
***
**
*
top-right:
   *
  **
 ***
****
bottom-right:
****
 ***
  **
   *`,
          explanation:
            "Compare the two right-aligned shapes with their left-aligned counterparts: the character counts are identical, and the only addition is a leading-space count that is the complement. Spaces plus characters always total `n`, which is a useful check — if a row's two counts do not add to the width, the shape will be ragged.",
        },
      ],
      pitfalls: [
        {
          title: "Trailing spaces",
          body: "Padding the right-hand side as well as the left produces a rectangle of the correct shape with invisible trailing spaces, which looks identical in a terminal and fails a judge's exact comparison. Only pad on the left; a line should end at its last visible character.",
        },
      ],
    },
    {
      id: "java",
      heading: "In Java",
      body: [
        "Same derivation, more typing, and the inner loops must be explicit. The one thing worth watching is the bound: `c < r + 1` and `c <= r` are the same count, and mixing them across two loops in one program is how a shape ends up asymmetric.",
      ],
      examples: [
        {
          id: "java-four",
          title: "Two of the four, with explicit loops",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int n = 4;

        System.out.println("top-left:");
        for (int r = 0; r < n; r++) {
            StringBuilder line = new StringBuilder();
            for (int c = 0; c < r + 1; c++) {
                line.append('*');
            }
            System.out.println(line);
        }

        System.out.println("top-right:");
        for (int r = 0; r < n; r++) {
            StringBuilder line = new StringBuilder();
            for (int s = 0; s < n - r - 1; s++) {
                line.append(' ');
            }
            for (int c = 0; c < r + 1; c++) {
                line.append('*');
            }
            System.out.println(line);
        }
    }
}`,
          output: `top-left:
*
**
***
****
top-right:
   *
  **
 ***
****`,
          explanation:
            "Two inner loops for the right-aligned version, one for spaces and one for stars, in that order. Writing them as separate loops rather than one loop with an `if` is both clearer and easier to get right, because each loop has a single job and a single bound to check.",
        },
      ],
    },
    {
      id: "checking",
      heading: "Checking without counting characters",
      body: [
        "Three quick checks catch nearly every error in this family, and none requires counting stars.",
        "**Check the first row.** For a growing triangle it should have exactly one character; for a shrinking one, exactly `n`. An empty first row means the bound used `r` where it needed `r + 1`.",
        "**Check the last row.** The complement of the first. A missing last row means the outer loop bound is `n - 1`.",
        "**Check that spaces plus characters equal the width.** On a right-aligned shape, every row should total `n`. A row that is short leans; a row that is long pushes the shape out of alignment.",
        "That third check is the one that finds pyramid bugs instantly, and it becomes essential in the next lesson where the character count grows by two per row.",
      ],
      examples: [
        {
          id: "width-check",
          title: "The width check, made explicit",
          lang: "python",
          code: `n = 4

for r in range(n):
    spaces = n - r - 1
    stars = r + 1
    line = " " * spaces + "*" * stars
    print(f"{line:<6} spaces={spaces} stars={stars} total={spaces + stars}")`,
          output: `   *   spaces=3 stars=1 total=4
  **   spaces=2 stars=2 total=4
 ***   spaces=1 stars=3 total=4
****   spaces=0 stars=4 total=4`,
          explanation:
            "Every total is 4, which is the width — so the right edge is straight. Naming `spaces` and `stars` rather than inlining both expressions is what makes this checkable at all, and it is the same argument as naming intermediates in the precedence lesson: you cannot print what you did not name.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you print a right triangle that grows downward?",
      answer:
        "Outer loop over `n` rows; for row `r`, print `r + 1` characters. With zero-based rows the first has one character and the last has `n`. Reversing the direction is `n - r` instead. Right-aligning either version adds a leading-space count that is the complement, so spaces plus characters always total the width — which is the check that catches a ragged edge.",
    },
    {
      question: "Why write the spaces and the characters as two separate inner loops?",
      answer:
        "Because each then has one job and one bound to verify. A single loop with an `if` deciding between a space and a star requires reasoning about the boundary condition inside the loop, which is where the errors are. Two loops in sequence read as \"indent this much, then draw this much\", which is exactly the description you derived, and each bound can be checked independently.",
    },
    {
      question: "What is the fastest way to tell which bound is wrong in a broken pattern?",
      answer:
        "Read the shape. An empty first row means a growing count used `r` instead of `r + 1`. A missing final row means the outer bound is `n - 1` rather than `n`. A leaning right edge means the spaces and characters do not sum to the width on every row. A single long line means the newline is missing. Each symptom maps to one bound, which is precisely why this drill is worth doing with the shape visible.",
    },
  ],
  takeaways: [
    "Height and width are independent; the inner bound mentioning `r` is what makes a triangle",
    "Growing down is `r + 1` characters per row; shrinking is `n - r`",
    "Right-aligning adds a leading-space count that is the complement of the character count",
    "Spaces plus characters should total the width on every row — the check that catches a ragged edge",
    "Write spaces and characters as two sequential loops, not one loop with an `if`",
    "Only pad on the left; trailing spaces are invisible and fail an exact comparison",
    "`c < r + 1` and `c <= r` are the same count — pick one and use it consistently",
    "Name the counts so you can print them; you cannot check what you did not name",
  ],
};
