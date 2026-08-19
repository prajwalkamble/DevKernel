import type { Lesson } from "@/content/types";

export const breakContinueLesson: Lesson = {
  id: "dsa-flow-break-continue",
  slug: "break-continue-and-nested-exits",
  moduleSlug: "conditional-statements-and-loops",
  title: "break, continue & Getting Out of Nested Loops",
  summary:
    "Leaving a loop early, skipping one pass, escaping two loops at once — and the `for`/`else` that almost nobody knows Python has.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Use `break` and `continue`, and say which loop each affects",
    "Escape a nested loop cleanly in both languages",
    "Use Python's `for`/`else` for the found-or-not-found pattern",
    "Recognise when an early exit has skipped the advance in a `while`",
  ],
  sections: [
    {
      id: "the-two",
      heading: "Two ways to leave a pass",
      body: [
        "**`break`** ends the loop entirely; execution continues after it.",
        "**`continue`** ends the current pass and goes straight to the next one.",
        "Both affect only the **innermost** loop containing them, which is the fact behind nearly every confusion about them.",
        "`break` is what turns a search into an early exit — the moment you have found the answer, there is no reason to keep looking. `continue` is what removes a level of nesting: instead of wrapping the body in `if (interesting) { ... }`, you write `if (!interesting) continue;` and leave the body flat.",
      ],
      examples: [
        {
          id: "break-continue",
          title: "Both, and the nesting continue removes",
          lang: "python",
          code: `values = [3, 8, 2, 9, 4]

for i, v in enumerate(values):
    if v == 9:
        print("found 9 at index", i)
        break
    print("checked", v)

print("---")

for v in values:
    if v % 2 != 0:
        continue
    print("even:", v)

print("---")

for v in values:
    if v % 2 == 0:
        print("even (nested):", v)`,
          output: `checked 3
checked 8
checked 2
found 9 at index 3
---
even: 8
even: 2
even: 4
---
even (nested): 8
even (nested): 2
even (nested): 4`,
          explanation:
            "The search stops at index 3 without examining the 4 after it — that is the point of `break`, and on a large array it is the difference between scanning everything and stopping halfway. The last two blocks are identical in behaviour; `continue` is worth preferring when the body is long, because the reader is not holding an open `if` in their head while reading twenty lines.",
        },
      ],
      pitfalls: [
        {
          title: "`continue` in a `while` that skips the advance",
          body: "`while (i < n) { if (skip) continue; ...; i++; }` jumps back to the condition without ever reaching `i++`, so it loops forever. This is the most common infinite loop after the missing advance itself. A `for` loop is immune, because the advance is in the header and runs even when the body continues.",
        },
      ],
    },
    {
      id: "nested",
      heading: "Escaping two loops",
      body: [
        "`break` leaves one loop. Escaping two — searching a grid, finding a pair — needs more, and the languages differ.",
        "**Java has labelled break.** Put a label before the outer loop and write `break outer;`. This is the one place a label is genuinely idiomatic in Java.",
        "**Python has no labels.** The three options are a flag checked after the inner loop, raising an exception, or — usually best — **extracting the search into a function and returning**, which leaves both loops at once and gives the search a name.",
      ],
      examples: [
        {
          id: "nested-break-java",
          title: "Java: a labelled break",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int[][] grid = {
            { 1, 2, 3 },
            { 4, 5, 6 },
            { 7, 8, 9 },
        };
        int target = 5;

        int foundRow = -1, foundCol = -1;

        outer:
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[r].length; c++) {
                System.out.println("looking at " + r + "," + c);
                if (grid[r][c] == target) {
                    foundRow = r;
                    foundCol = c;
                    break outer;
                }
            }
        }

        System.out.println("found at " + foundRow + "," + foundCol);
    }
}`,
          output: `looking at 0,0
looking at 0,1
looking at 0,2
looking at 1,0
looking at 1,1
found at 1,1`,
          explanation:
            "`break outer;` leaves both loops in one statement, and the trace shows it stopped immediately rather than finishing the row. Without the label you would need a flag and a second check in the outer loop's condition, which is three extra lines and one extra thing to get wrong.",
        },
        {
          id: "nested-break-python",
          title: "Python: extract a function and return",
          lang: "python",
          code: `grid = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]


def find_with_flag(grid, target):
    found = None
    for r, row in enumerate(grid):
        for c, value in enumerate(row):
            if value == target:
                found = (r, c)
                break
        if found:
            break
    return found


def find_by_returning(grid, target):
    for r, row in enumerate(grid):
        for c, value in enumerate(row):
            if value == target:
                return r, c
    return None


print(find_with_flag(grid, 5))
print(find_by_returning(grid, 5))
print(find_by_returning(grid, 99))`,
          output: `(1, 1)
(1, 1)
None`,
          explanation:
            "Both work; the second is shorter, has no flag to forget to check, and gives the operation a name you can call from elsewhere. The general lesson is broader than loops: **when control flow gets awkward, the shape you want is usually a function.** A `return` escapes any depth of nesting in one word.",
        },
      ],
    },
    {
      id: "for-else",
      heading: "Python's `for`/`else`",
      body: [
        "Python lets a loop have an `else` clause, and it runs **only if the loop finished without breaking**.",
        "The name is unfortunate — `nobreak` would have been clearer — but the pattern it expresses is genuinely common: search for something, and do one thing if found and another if the search completed without finding it.",
        "It replaces the flag variable entirely, and it is worth knowing both to write and to read, since it appears in a lot of Python and confuses people who have not met it.",
      ],
      examples: [
        {
          id: "for-else",
          title: "Search, with and without the flag",
          lang: "python",
          code: `def is_prime_with_flag(n):
    if n < 2:
        return False
    found_divisor = False
    for d in range(2, int(n ** 0.5) + 1):
        if n % d == 0:
            found_divisor = True
            break
    if not found_divisor:
        return True
    return False


def is_prime_for_else(n):
    if n < 2:
        return False
    for d in range(2, int(n ** 0.5) + 1):
        if n % d == 0:
            return False
    else:
        return True


for n in (1, 2, 9, 13, 25):
    print(n, is_prime_with_flag(n), is_prime_for_else(n))`,
          output: `1 False False
2 True True
9 False False
13 True True
25 False False`,
          explanation:
            "Note that in the second function the `else` is attached to the `for`, not to an `if` — it runs when the loop completed without hitting the `return`. In this particular case the `else` is redundant, since falling off the end of the loop would reach the same `return True`; it earns its place when the not-found branch does something other than return, and when the alternative would be a flag.",
        },
      ],
      pitfalls: [
        {
          title: "Reading `for`/`else` as \"otherwise\"",
          body: "It does not mean \"if the loop body never ran\" and it does not mean \"otherwise\". It means \"if no `break` happened\", so an empty sequence runs the `else` too — the loop completed, trivially, without breaking. That is usually the right behaviour for a search and surprising if you expected the opposite.",
        },
      ],
    },
    {
      id: "when-not-to",
      heading: "When an early exit is hiding a better structure",
      body: [
        "`break` and `continue` are good tools and they can also be a symptom. Three signs the loop wants restructuring:",
        "**More than one or two `break`s.** A loop with four exits has four things to reason about at once, and its invariant is nearly impossible to state.",
        "**A `break` deep inside nested conditionals.** If you need three levels of `if` to reach the exit, the condition for leaving is complicated enough to deserve a name — extract it, or extract the whole search into a function.",
        "**`continue` as the first statement of a long body.** That is fine and idiomatic. Several `continue`s scattered through a long body is a filter that should have happened before the loop.",
        "The general move is the same one as the guard-clause lesson: when control flow is hard to follow, give part of it a name.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you break out of two nested loops?",
      answer:
        "In Java, a labelled break: put a label before the outer loop and write `break outer;`, which leaves both in one statement. Python has no labels, so the options are a flag checked after the inner loop, an exception, or — usually best — extracting the search into a function and returning, since `return` escapes any depth at once and gives the operation a name. The general principle is that awkward control flow is usually asking to become a function.",
    },
    {
      question: "What does Python's `for`/`else` do?",
      answer:
        "The `else` block runs when the loop finishes *without* executing a `break`. It expresses the search pattern — do one thing if you found it, another if you exhausted the sequence — without a flag variable. The name is misleading; `nobreak` would describe it better. Note that an empty sequence runs the `else`, because the loop did complete without breaking, which is normally the correct behaviour for a search.",
    },
    {
      question: "Why can `continue` cause an infinite loop in a `while` but not a `for`?",
      answer:
        "Because `continue` jumps back to the condition, skipping the rest of the body — and in a `while` loop the advance is part of the body. If `i++` sits below the `continue`, it never runs and the condition never changes. A `for` loop puts the advance in its header, which executes even when the body continues, so the loop still progresses. It is one more reason to prefer `for` whenever the iteration count is known.",
    },
  ],
  takeaways: [
    "`break` leaves the loop; `continue` skips to the next pass; both affect only the innermost loop",
    "`break` turns a scan into an early exit, which on a large input is most of the saving",
    "`continue` at the top of a long body removes a level of nesting",
    "`continue` in a `while` skips the advance and loops forever; a `for` is immune",
    "Java escapes nested loops with a labelled break — the one idiomatic use of labels",
    "Python has no labels; extract the search into a function and `return`",
    "`for`/`else` runs the `else` when no `break` happened, including for an empty sequence",
    "Several breaks, or a break under three levels of `if`, means the loop wants to be a function",
  ],
};
