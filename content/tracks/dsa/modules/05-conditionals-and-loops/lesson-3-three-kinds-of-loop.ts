import type { Lesson } from "@/content/types";

export const threeLoopsLesson: Lesson = {
  id: "dsa-flow-loops",
  slug: "three-kinds-of-loop",
  moduleSlug: "conditional-statements-and-loops",
  title: "while, do-while & for: One Loop, Three Spellings",
  summary:
    "The three loop forms, which to reach for when, and Python's `range` — including why its end is exclusive and why that is the right choice.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Write all three loop forms and convert between them",
    "Choose the right form from whether the count is known in advance",
    "Use `range` with one, two and three arguments, forwards and backwards",
    "Explain why a half-open interval avoids off-by-one errors",
  ],
  sections: [
    {
      id: "same-loop",
      heading: "Three forms of the same thing",
      body: [
        "Every loop has three parts: a **setup**, a **condition** checked before each pass, and an **advance** at the end of each pass. The three forms differ only in where those parts are written.",
        "**`while`** puts only the condition in the syntax; setup and advance are ordinary statements you place yourself.",
        "**`for`** collects all three into the header, which keeps them together where they cannot drift apart.",
        "**`do-while`** moves the check to the *bottom*, so the body always runs at least once. Java has it; Python does not.",
        "The choice is not stylistic. **Use `for` when the number of iterations is known before you start**, and `while` when it depends on something discovered inside the loop.",
      ],
      examples: [
        {
          id: "three-forms",
          title: "The same sum, three ways",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int n = 5;

        int total = 0;
        int i = 0;
        while (i < n) {
            total += i;
            i++;
        }
        System.out.println("while    : " + total);

        total = 0;
        for (int j = 0; j < n; j++) {
            total += j;
        }
        System.out.println("for      : " + total);

        total = 0;
        int k = 0;
        do {
            total += k;
            k++;
        } while (k < n);
        System.out.println("do-while : " + total);

        int never = 0;
        int runs = 0;
        do {
            runs++;
        } while (never > 0);
        System.out.println("body ran " + runs + " time even though the condition was false");
    }
}`,
          output: `while    : 10
for      : 10
do-while : 10
body ran 1 time even though the condition was false`,
          explanation:
            "The last block is the entire reason `do-while` exists: the body runs before the condition is examined. That is right for \"read input until the user types quit\" or \"retry until it succeeds\" — anything where you must attempt once to find out whether to continue. Python has no such form; the idiom there is `while True:` with a `break` at the bottom.",
        },
      ],
      pitfalls: [
        {
          title: "A `while` whose advance is inside an `if`",
          body: "`while (i < n) { if (something) { ... i++; } }` never terminates when the condition is false, because nothing advances `i`. This is the most common infinite loop there is, and it is why `for` is safer whenever the count is known: the advance lives in the header and cannot be skipped by a branch.",
        },
      ],
    },
    {
      id: "for-each",
      heading: "The for-each loop",
      body: [
        "Both languages have a form that iterates the elements directly, with no index at all. Java calls it the enhanced for loop; Python's ordinary `for` *is* this form.",
        "Use it whenever you do not need the index. It removes the three places an indexed loop can be wrong — the start, the bound and the advance — and it reads as what it means.",
      ],
      examples: [
        {
          id: "for-each",
          title: "With and without the index",
          lang: "java",
          code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        int[] values = { 4, 8, 15 };

        int total = 0;
        for (int value : values) {
            total += value;
        }
        System.out.println("sum: " + total);

        for (int i = 0; i < values.length; i++) {
            System.out.println(i + " -> " + values[i]);
        }

        List<String> names = List.of("a", "b");
        for (String name : names) {
            System.out.println(name);
        }
    }
}`,
          output: `sum: 27
0 -> 4
1 -> 8
2 -> 15
a
b`,
          explanation:
            "The enhanced form works on arrays and on anything iterable. Its limitation is that you cannot assign back into the array through it — `for (int v : values) v = 0;` changes the loop variable and not the array — so writing into a collection still needs the indexed form.",
        },
      ],
    },
    {
      id: "range",
      heading: "Python's `range`, and the half-open interval",
      body: [
        "`range(stop)` counts from 0 up to but **not including** `stop`. `range(start, stop)` and `range(start, stop, step)` add the other two parts.",
        "The end being exclusive looks arbitrary and is the single best design decision in the whole construct. It means `range(n)` has exactly `n` values; `range(a, b)` has exactly `b - a`; and two ranges `range(0, k)` and `range(k, n)` partition `range(0, n)` with no overlap and no gap.",
        "Compare with an inclusive end, where the count is `b - a + 1` and splitting requires remembering whether the boundary belongs to the left or the right half. Nearly every off-by-one error is that `+ 1` in the wrong place.",
      ],
      examples: [
        {
          id: "range",
          title: "Why exclusive ends make the arithmetic disappear",
          lang: "python",
          code: `print(list(range(5)))
print(list(range(2, 6)))
print(list(range(0, 10, 3)))
print(list(range(5, 0, -1)))
print(list(range(3, 3)))

n = 10
print(len(range(n)), len(range(2, 6)))

k = 4
left = list(range(0, k))
right = list(range(k, n))
print(left, right)
print("no overlap, no gap:", left + right == list(range(n)))`,
          output: `[0, 1, 2, 3, 4]
[2, 3, 4, 5]
[0, 3, 6, 9]
[5, 4, 3, 2, 1]
[]
10 4
[0, 1, 2, 3] [4, 5, 6, 7, 8, 9]
no overlap, no gap: True`,
          explanation:
            "`len(range(2, 6))` is 4, exactly `b - a`, with no adjustment. And the split at `k` works out with `k` appearing as the end of one range and the start of the other, which is why array-slicing conventions are the same shape. Note `range(3, 3)` is empty rather than an error — a loop over it simply does not run, which is usually the behaviour you want at a boundary.",
        },
      ],
      pitfalls: [
        {
          title: "Reversing with `range(n, 0, -1)`",
          body: "That yields `n` down to 1 and never reaches 0. To walk every index backwards you want `range(n - 1, -1, -1)` — start at the last index, stop *before* −1. Writing 0 as the middle argument is the classic error and silently skips the first element.",
        },
      ],
    },
    {
      id: "counted-vs-conditional",
      heading: "Choosing the form",
      body: [
        "One question decides it: **do you know how many passes there will be before the loop starts?**",
        "**Yes** → `for`. Iterating an array, repeating n times, walking a range. The bound is in the header where a reader can see it and where no branch can skip the advance.",
        "**No** → `while`. Binary search, two pointers converging, reading until a sentinel, repeating until convergence. The termination depends on what the body discovers.",
        "**No, and it must run at least once** → `do-while` in Java, `while True` with a `break` in Python.",
        "A useful corollary: if your `for` loop modifies its own counter inside the body, you probably wanted a `while`. The `for` header is a promise about the iteration pattern, and breaking that promise makes the loop hard to reason about.",
      ],
      examples: [
        {
          id: "which-form",
          title: "One of each, from real algorithms",
          lang: "python",
          code: `values = [1, 3, 5, 7, 9, 11]

total = 0
for v in values:
    total += v
print("counted:", total)

lo, hi = 0, len(values) - 1
target = 7
found = -1
while lo <= hi:
    mid = (lo + hi) // 2
    if values[mid] == target:
        found = mid
        break
    if values[mid] < target:
        lo = mid + 1
    else:
        hi = mid - 1
print("conditional:", found)

guess = 100.0
while True:
    better = (guess + 2 / guess) / 2
    if abs(better - guess) < 1e-12:
        break
    guess = better
print("run-at-least-once:", round(guess, 6))`,
          output: `counted: 36
conditional: 3
run-at-least-once: 1.414214`,
          explanation:
            "Three loops, three genuinely different shapes. The sum knows its length. The binary search does not — it depends on comparisons made inside. The square-root refinement must compute one improvement before it can tell whether to stop, which is the `do-while` shape written as `while True` plus `break`.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When would you use a `while` loop rather than a `for` loop?",
      answer:
        "When the number of iterations is not known before the loop starts — binary search, two pointers converging, iterating until convergence, reading until a sentinel. A `for` header states the iteration pattern up front and keeps the setup, condition and advance together where no branch can skip them, which makes it the safer choice whenever the count *is* known. If a `for` loop modifies its own counter in the body, that is a sign it should have been a `while`.",
    },
    {
      question: "Why is Python's `range` end exclusive?",
      answer:
        "Because it makes the arithmetic vanish. `range(n)` has exactly n values, `range(a, b)` has exactly `b - a`, and `range(0, k)` and `range(k, n)` partition `range(0, n)` with no overlap and no gap — the split point appears once as an end and once as a start. With an inclusive end every count needs a `+ 1` and every split needs a decision about which side owns the boundary, and misplacing that `+ 1` is what most off-by-one errors are.",
    },
    {
      question: "What is a do-while loop for, and how do you write one in Python?",
      answer:
        "For work that must happen at least once before you can tell whether to continue: retrying an operation, refining an estimate until it converges, reading until a terminator. The condition is checked at the bottom, so the body always runs once. Python has no such form; the idiom is `while True:` with the work at the top and an `if condition: break` at the bottom, which is the same shape spelled differently.",
    },
  ],
  takeaways: [
    "Every loop has a setup, a condition and an advance; the three forms differ in where those live",
    "`for` when the count is known in advance, `while` when it depends on what the body discovers",
    "`do-while` checks at the bottom, so the body always runs once; Python spells it `while True` plus `break`",
    "A `while` whose advance sits inside an `if` is the most common infinite loop",
    "For-each removes the three places an indexed loop can be wrong, but cannot assign back into an array",
    "`range` ends are exclusive, so `len(range(a, b))` is exactly `b - a` with no adjustment",
    "`range(0, k)` and `range(k, n)` partition cleanly — the split point is an end and a start",
    "Backwards over every index is `range(n - 1, -1, -1)`, not `range(n, 0, -1)`",
  ],
};
