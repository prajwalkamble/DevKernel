import type { Lesson } from "@/content/types";

export const pyramidsLesson: Lesson = {
  id: "dsa-pattern-pyramids",
  slug: "pyramids-and-diamonds",
  moduleSlug: "pattern-printing-problems",
  title: "Pyramids & Diamonds",
  summary:
    "The centred shapes, where the character count grows by two per row and the leading-space count is what keeps the apex above the middle.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Derive the space and character counts for a centred pyramid",
    "Explain why the width is `2n - 1` rather than `n`",
    "Build a diamond from two pyramids without duplicating the middle row",
    "Print a hollow pyramid using a position test rather than a third loop",
  ],
  sections: [
    {
      id: "the-two-counts",
      heading: "Two counts that move in opposite directions",
      body: [
        "A centred pyramid is the first shape where both inner loops matter, and the derivation is worth doing slowly once.",
        "Row `r`, zero-based, has **`n - r - 1` leading spaces** and **`2r + 1` characters**. The apex row has `n - 1` spaces and one character; the base has none and `2n - 1`.",
        "The `2r + 1` is the part people guess wrong. It is odd on every row, because a centred shape has one character in the middle and an equal number either side — that is what centring *means*, and it is why the total width is `2n - 1` and not `n`.",
        "Check: spaces plus characters is `(n - r - 1) + (2r + 1)` = `n + r`. That grows, which is correct — the right edge of a pyramid slopes outward.",
      ],
      examples: [
        {
          id: "pyramid",
          title: "The counts, printed alongside the shape",
          lang: "python",
          code: `n = 5

for r in range(n):
    spaces = n - r - 1
    stars = 2 * r + 1
    print(f"{' ' * spaces}{'*' * stars:<{2 * n - 1}}  r={r} spaces={spaces} stars={stars}")`,
          output: `    *          r=0 spaces=4 stars=1
   ***        r=1 spaces=3 stars=3
  *****      r=2 spaces=2 stars=5
 *******    r=3 spaces=1 stars=7
*********  r=4 spaces=0 stars=9`,
          explanation:
            "Five rows, widths 1, 3, 5, 7, 9 — every one odd, and the last is `2n - 1` = 9. The leading spaces count down from `n - 1` to 0 as the stars count up. Those two sequences moving in opposite step is the entire structure of every centred pattern in this lesson.",
        },
      ],
      pitfalls: [
        {
          title: "Using `r` spaces instead of `n - r - 1`",
          body: "That inverts the shape into an upside-down funnel — the apex ends up at the bottom-left. If a pyramid comes out leaning the wrong way, the space count is the thing to look at, not the star count.",
        },
      ],
    },
    {
      id: "inverted",
      heading: "The inverted pyramid",
      body: [
        "Flipping a pyramid means swapping which way each count moves. Row `r` gets **`r` spaces** and **`2(n - r) - 1` characters**.",
        "Rather than deriving it fresh, the reliable trick is to substitute: an inverted pyramid is the upright one with `r` replaced by `n - r - 1` everywhere. That substitution reverses any pattern in this module and is worth knowing as a general move.",
      ],
      examples: [
        {
          id: "inverted",
          title: "Derived by substitution",
          lang: "python",
          code: `n = 5

print("upright:")
for r in range(n):
    print(" " * (n - r - 1) + "*" * (2 * r + 1))

print("inverted, by substituting n - r - 1 for r:")
for r in range(n):
    k = n - r - 1
    print(" " * (n - k - 1) + "*" * (2 * k + 1))

print("inverted, simplified:")
for r in range(n):
    print(" " * r + "*" * (2 * (n - r) - 1))`,
          output: `upright:
    *
   ***
  *****
 *******
*********
inverted, by substituting n - r - 1 for r:
*********
 *******
  *****
   ***
    *
inverted, simplified:
*********
 *******
  *****
   ***
    *`,
          explanation:
            "The middle block does the substitution mechanically and the third simplifies it by hand; they produce identical output, which is the check that the algebra was done correctly. When a reversed shape is not obvious, do the substitution rather than re-deriving — it cannot go wrong, and simplifying afterwards is optional.",
        },
      ],
    },
    {
      id: "diamond",
      heading: "The diamond, and the row you must not print twice",
      body: [
        "A diamond is a pyramid with an inverted pyramid below it. The only real decision is what happens at the join.",
        "The widest row belongs to both halves, so printing both loops in full duplicates it and gives a shape with a flat middle. The fix is to have the second loop start one row in — `range(n - 2, -1, -1)` — so the join row is printed exactly once.",
        "Total rows are therefore `2n - 1`, the same odd number as the width, which is a useful sanity check: a diamond of width 9 has 9 rows.",
      ],
      examples: [
        {
          id: "diamond",
          title: "With and without the duplicated join",
          lang: "python",
          code: `n = 4

print("wrong — middle row twice:")
rows = 0
for r in range(n):
    print(" " * (n - r - 1) + "*" * (2 * r + 1))
    rows += 1
for r in range(n - 1, -1, -1):
    print(" " * (n - r - 1) + "*" * (2 * r + 1))
    rows += 1
print("rows:", rows)

print("right:")
rows = 0
for r in range(n):
    print(" " * (n - r - 1) + "*" * (2 * r + 1))
    rows += 1
for r in range(n - 2, -1, -1):
    print(" " * (n - r - 1) + "*" * (2 * r + 1))
    rows += 1
print("rows:", rows, "which is 2n - 1 =", 2 * n - 1)`,
          output: `wrong — middle row twice:
   *
  ***
 *****
*******
*******
 *****
  ***
   *
rows: 8
right:
   *
  ***
 *****
*******
 *****
  ***
   *
rows: 7 which is 2n - 1 = 7`,
          explanation:
            "The wrong version has eight rows and a two-row-thick waist; the right one has seven and a point. `range(n - 2, -1, -1)` starts at the second-widest row and counts down to 0. The row count is the fastest check — if a diamond has an even number of rows, the join is duplicated.",
        },
      ],
    },
    {
      id: "hollow",
      heading: "Hollow shapes: a test, not a third loop",
      body: [
        "A hollow pyramid has characters only on its border. The instinct is to add more loops; the better move is to keep one loop over the row's positions and **decide per position** whether it is border.",
        "For a pyramid row `r` with `2r + 1` positions, the border positions are the first, the last, and — on the base row — all of them. That is one condition, and expressing it as a condition rather than as loop bounds is what keeps the code short.",
        "This generalises: whenever a shape has interior structure, the answer is usually one loop over all positions and a test, not several loops over segments.",
      ],
      examples: [
        {
          id: "hollow",
          title: "One loop, one condition",
          lang: "python",
          code: `n = 5

for r in range(n):
    line = " " * (n - r - 1)
    width = 2 * r + 1
    for c in range(width):
        on_edge = c == 0 or c == width - 1
        on_base = r == n - 1
        line += "*" if on_edge or on_base else " "
    print(line.rstrip())`,
          output: `    *
   * *
  *   *
 *     *
*********`,
          explanation:
            "One inner loop over every position in the row, and a two-part condition deciding what goes there. The `rstrip()` matters: without it the interior spaces run to the end of each row and produce trailing whitespace, which is invisible here and wrong on a judge. Compare the effort to writing this with four separate loops for indent, left edge, gap and right edge.",
        },
      ],
      pitfalls: [
        {
          title: "Forgetting the base row",
          body: "A hollow pyramid without the `on_base` term prints two diverging lines and no floor. It is the classic omission, and it is visible immediately — which is the whole reason this drill uses shapes.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does a centred pyramid have `2r + 1` characters per row?",
      answer:
        "Because centring means one character in the middle with an equal count either side, which is always odd. Row `r` has `r` characters on each side of the centre plus the centre itself. That makes the widest row `2n - 1`, so a pyramid of `n` rows is `2n - 1` wide rather than `n` — the most common wrong assumption about these shapes.",
      },
    {
      question: "How do you avoid printing the middle row twice in a diamond?",
      answer:
        "Start the second loop one row in. The widest row belongs to both halves, so running both loops over the full range prints it twice and gives a flat waist. `range(n - 2, -1, -1)` begins at the second-widest row. The check is the row count: a diamond should have `2n - 1` rows, an odd number, so an even count means the join is duplicated.",
    },
    {
      question: "How would you print a hollow shape?",
      answer:
        "One loop over every position in the row, with a condition deciding whether that position is on the border, rather than several loops over the segments. For a hollow pyramid the condition is first position, last position, or bottom row. Keeping it as a test rather than as loop bounds makes the code much shorter and puts the shape's definition in one readable expression — and the same approach handles hollow rectangles, borders and frames.",
    },
  ],
  takeaways: [
    "A centred pyramid row has `n - r - 1` spaces and `2r + 1` characters",
    "The character count is always odd, which is what centring means; the width is `2n - 1`",
    "Getting the space count wrong inverts the lean; getting the star count wrong makes it ragged",
    "Reverse any pattern by substituting `n - r - 1` for `r` — mechanical and cannot go wrong",
    "A diamond's second loop starts at `n - 2` so the widest row is printed once",
    "A diamond has `2n - 1` rows; an even row count means the join is duplicated",
    "Hollow shapes are one loop over positions plus a border test, not several loops over segments",
    "`rstrip()` the line, or interior spaces become trailing whitespace",
  ],
};
