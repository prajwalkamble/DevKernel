import type { Lesson } from "@/content/types";

export const switchMatchLesson: Lesson = {
  id: "dsa-flow-switch",
  slug: "switch-and-match",
  moduleSlug: "conditional-statements-and-loops",
  title: "switch, match & the Fall-Through",
  summary:
    "The multi-way branch, the missing `break` that makes it run two branches at once, and the arrow form that removed the problem entirely.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Write a classic switch and explain what fall-through does",
    "Use Java's arrow-form switch expression",
    "Use Python's `match` statement for the same job",
    "Decide when a switch beats an else-if chain, and when a map beats both",
  ],
  sections: [
    {
      id: "classic-switch",
      heading: "The classic switch, and its trap",
      body: [
        "Java's original `switch` compares one value against a list of cases and jumps to the matching one. The trap is what happens next: **execution continues into the following cases** until it hits a `break`.",
        "That is called fall-through, it is deliberate, and it is almost never what you want. Omitting a `break` is one of the classic bugs of the C family.",
      ],
      examples: [
        {
          id: "fallthrough",
          title: "One missing break, two branches run",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        for (int day = 1; day <= 3; day++) {
            System.out.print("day " + day + ": ");
            switch (day) {
                case 1:
                    System.out.print("one ");
                case 2:
                    System.out.print("two ");
                    break;
                case 3:
                    System.out.print("three ");
            }
            System.out.println();
        }
    }
}`,
          output: `day 1: one two
day 2: two
day 3: three`,
          explanation:
            "Day 1 prints *both* `one` and `two`, because case 1 has no `break` and execution falls into case 2. Day 2 prints only `two` because that case does break. This is legal, compiles without warning, and is the reason many style guides required a comment on any deliberate fall-through.",
        },
      ],
      pitfalls: [
        {
          title: "Declaring a variable inside a case",
          body: "All the cases of a classic switch share one scope, so `case 1: int x = 5; ... case 2: int x = 7;` is a duplicate-variable error, and a variable declared in one case is visible but possibly unassigned in another. Wrap a case body in braces when it needs its own locals.",
        },
      ],
    },
    {
      id: "arrow-switch",
      heading: "The arrow form, which has no fall-through",
      body: [
        "Modern Java added a `switch` with arrows. Each case runs only its own body, so there is no fall-through and no `break` to forget. It can also be an **expression**, producing a value directly.",
        "Several labels can share one arm by listing them with commas, which covers the one legitimate use of the old fall-through.",
        "Use this form. The classic one exists for compatibility and there is no reason to write new code with it.",
      ],
      examples: [
        {
          id: "arrow-switch",
          title: "As an expression, with grouped labels",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        for (int day = 1; day <= 8; day++) {
            String name = switch (day) {
                case 1 -> "Monday";
                case 2, 3, 4 -> "midweek";
                case 5 -> "Friday";
                case 6, 7 -> "weekend";
                default -> "not a day";
            };
            System.out.println(day + " -> " + name);
        }
    }
}`,
          output: `1 -> Monday
2 -> midweek
3 -> midweek
4 -> midweek
5 -> Friday
6 -> weekend
7 -> weekend
8 -> not a day`,
          explanation:
            "One value assigned in one statement, with no temporary and no `break`. A switch *expression* must be exhaustive, so the compiler requires the `default` — which turns the missing-case problem from a silent no-op into an error at build time. That is the same argument as ending an if-chain with `else`, enforced rather than remembered.",
        },
      ],
    },
    {
      id: "python-match",
      heading: "Python's `match`",
      body: [
        "Python has no switch. It has `match`, which is newer and considerably more powerful — it destructures as well as compares.",
        "For the simple job, `case 1:` matches a value and `case 1 | 2:` matches either. `case _:` is the default. There is no fall-through: exactly one case runs.",
        "For everyday branching on a value, an `if`/`elif` chain or a dictionary is usually clearer, and `match` earns its keep when you are taking a structure apart.",
      ],
      examples: [
        {
          id: "python-match",
          title: "Values, alternatives, and destructuring",
          lang: "python",
          code: `for day in (1, 3, 8):
    match day:
        case 1:
            print(day, "Monday")
        case 2 | 3 | 4:
            print(day, "midweek")
        case _:
            print(day, "something else")

print("---")

for point in [(0, 0), (3, 0), (0, 4), (2, 5)]:
    match point:
        case (0, 0):
            print(point, "origin")
        case (x, 0):
            print(point, f"on the x-axis at {x}")
        case (0, y):
            print(point, f"on the y-axis at {y}")
        case (x, y):
            print(point, f"at {x},{y}")`,
          output: `1 Monday
3 midweek
8 something else
---
(0, 0) origin
(3, 0) on the x-axis at 3
(0, 4) on the y-axis at 4
(2, 5) at 2,5`,
          explanation:
            "The second block is what `match` is actually for: each case both *tests a shape* and *binds the parts* in one line. `case (x, 0)` matches any pair whose second element is zero and names the first `x`. Writing that as an if-chain means testing the length, then the element, then unpacking — three steps that `match` does as one.",
        },
      ],
      pitfalls: [
        {
          title: "A bare name in a Python `case` captures, it does not compare",
          body: "`case ORIGIN:` where `ORIGIN` is a constant you defined does *not* compare against it — it matches anything and rebinds the name. To compare against a constant you must qualify it, as `case Point.ORIGIN:` or `case (0, 0):`. This is the single most confusing rule in `match` and it fails silently by matching everything.",
        },
      ],
    },
    {
      id: "when-to-use",
      heading: "switch, chain, or map?",
      body: [
        "Three tools for multi-way branching, and the choice is usually clear once stated.",
        "**An if/elif chain** when the conditions are *ranges or expressions* — `score >= 90`. A switch cannot express those.",
        "**A switch or match** when you are comparing one value against a fixed set of constants, and each case does something different.",
        "**A map** when each case just *produces a value*. `Map<String, Integer> priority = ...; priority.get(key)` beats a twelve-case switch that only returns numbers, because adding a case becomes adding data rather than editing control flow.",
        "That last one is worth taking seriously. A long switch that returns a constant per case is a lookup table written as code, and converting it to an actual table usually shortens the function and makes it extensible.",
      ],
      examples: [
        {
          id: "map-instead",
          title: "The switch that wanted to be a dictionary",
          lang: "python",
          code: `def value_of_switch(card):
    if card in ("J", "Q", "K"):
        return 10
    elif card == "A":
        return 11
    elif card == "2":
        return 2
    elif card == "3":
        return 3
    else:
        return 0


VALUES = {"J": 10, "Q": 10, "K": 10, "A": 11, "2": 2, "3": 3}


def value_of_map(card):
    return VALUES.get(card, 0)


hand = ["A", "K", "3", "7"]
print([value_of_switch(c) for c in hand])
print([value_of_map(c) for c in hand])`,
          output: `[11, 10, 3, 0]
[11, 10, 3, 0]`,
          explanation:
            "Same answers. The map version puts the knowledge in a data structure, so supporting the rest of the deck means adding entries rather than editing branches — and the table can be printed, tested and loaded from a file. The `get(card, 0)` default replaces the `else` and cannot be forgotten.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is fall-through in a switch statement?",
      answer:
        "After a matching case runs, execution continues into the following cases until it reaches a `break` or the end of the switch. It is deliberate C-family behaviour and almost never what you want, so a missing `break` silently runs two branches. Java's arrow-form switch removed the problem: each arm runs only its own body, several labels can share an arm with commas, and as an expression it must be exhaustive so the compiler catches a missing default.",
    },
    {
      question: "When would you use a map instead of a switch?",
      answer:
        "When every case just produces a value. A long switch returning a constant per case is a lookup table written as control flow — converting it to an actual map makes adding a case a data change rather than a code change, lets the table be tested and loaded externally, and replaces the forgettable `default` with `getOrDefault`. A switch earns its place when the cases *do* different things rather than returning different values.",
    },
    {
      question: "What does Python's `match` offer over an if-chain?",
      answer:
        "Structural pattern matching: each case tests a shape and binds its parts at once. `case (x, 0):` matches any two-element sequence whose second element is zero and names the first `x`, which as an if-chain would be a length test, an element test and an unpack. For plain value comparison an if-chain or a dict is usually clearer. The rule to watch is that a bare name in a case *captures* rather than compares, so matching against a named constant requires qualifying it.",
    },
  ],
  takeaways: [
    "A classic Java switch falls through to the next case unless you `break`",
    "Cases share one scope, so a variable declared in one is visible in the others",
    "The arrow form has no fall-through, groups labels with commas, and can be an expression",
    "A switch expression must be exhaustive, so the compiler enforces the default",
    "Python has `match`, with no fall-through and `case _` as the default",
    "`match` earns its keep by destructuring — `case (x, 0)` tests and binds together",
    "A bare name in a Python `case` captures rather than compares, and matches everything",
    "Use a chain for ranges, a switch for constants that do different things, a map for constants that return values",
  ],
};
