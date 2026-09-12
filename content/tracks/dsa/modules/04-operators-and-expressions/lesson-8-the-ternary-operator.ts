import type { Lesson } from "@/content/types";

export const ternaryLesson: Lesson = {
  id: "dsa-ops-ternary",
  slug: "the-ternary-operator",
  moduleSlug: "operators-and-expressions",
  title: "The Ternary Operator, and Where It Helps",
  summary:
    "A conditional that is an expression rather than a statement — what that buys you, and the exact point at which it stops being clearer than an `if`.",
  estimatedMinutes: 15,
  status: "available",
  objectives: [
    "Write a conditional expression in both languages",
    "Say what a ternary can do that an `if` statement cannot",
    "Recognise when nesting has made one unreadable",
  ],
  sections: [
    {
      id: "an-expression",
      heading: "A conditional that has a value",
      body: [
        "Java writes it `condition ? whenTrue : whenFalse`. Python writes it `whenTrue if condition else whenFalse`, putting the condition in the middle — which reads more like English and less like every other language.",
        "The important thing is not the brevity. It is that this is an **expression**: it has a value, so it can go anywhere a value goes. An `if` statement cannot.",
        "That is what it is for. Initialising a variable in one step, passing a conditional argument, returning one of two values, building a string — all places where a statement would force you to declare something first and assign to it afterwards.",
      ],
      examples: [
        {
          id: "ternary-basics",
          title: "The three places it earns its keep",
          lang: "python",
          code: `n = -4

sign = "negative" if n < 0 else "non-negative"
print(sign)

values = [3, 1, 4]
print(max(values) if values else None)
print(max([]) if [] else None)

count = 1
print(f"{count} item{'s' if count != 1 else ''}")
count = 3
print(f"{count} item{'s' if count != 1 else ''}")

print([("even" if v % 2 == 0 else "odd") for v in range(4)])`,
          output: `negative
4
None
1 item
3 items
['even', 'odd', 'even', 'odd']`,
          explanation:
            "The second block is the pattern worth stealing: `max(values) if values else None` guards an operation that would throw on an empty sequence, in one expression, with no temporary variable. The pluralisation line is the other classic — an `if` statement cannot go inside an f-string, and a ternary can.",
        },
        {
          id: "ternary-java",
          title: "Java, including a `final` given its value in one line",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int n = -4;

        String sign = n < 0 ? "negative" : "non-negative";
        System.out.println(sign);

        final int limit = args.length > 0 ? 100 : 10;
        System.out.println(limit);

        int[] values = { 3, 1, 4 };
        System.out.println("first: " + (values.length > 0 ? values[0] : -1));

        System.out.println(n > 0 ? "positive" : n < 0 ? "negative" : "zero");
    }
}`,
          output: `negative
10
first: 3
negative`,
          explanation:
            "The `final` line shows a ternary giving a `final` its value in the declaration itself. An `if`/`else` could also do it — Java accepts a blank `final` assigned exactly once on each branch — but only by splitting the declaration from its value. The last line chains two ternaries for a three-way result, which is the one nesting that stays readable — and the next section is about the point where it stops.",
        },
      ],
    },
    {
      id: "where-it-stops",
      heading: "Where it stops helping",
      body: [
        "A ternary is clearer than an `if` when it produces **one value from one simple condition**. It stops being clearer at three specific points, and recognising them is the whole skill.",
        "**When it nests more than once.** `a ? b : c ? d : e ? f : g` is a decision table written as a sentence. Two levels for a three-way result is the practical limit; beyond that use `if`/`else if`, or a lookup.",
        "**When the branches do something rather than produce something.** If either side has a side effect — printing, mutating, appending — you wanted a statement. A ternary evaluated for its effects is a misuse.",
        "**When the line no longer fits.** If the condition and both results do not comfortably fit on one line, the `if` version is easier to read and much easier to debug, because you can set a breakpoint or add a print inside a branch.",
      ],
      examples: [
        {
          id: "too-far",
          title: "The same logic, three ways",
          lang: "python",
          code: `def grade_ternary(score):
    return "A" if score >= 90 else "B" if score >= 80 else "C" if score >= 70 else "D" if score >= 60 else "F"


def grade_if(score):
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"


def grade_table(score):
    for threshold, letter in ((90, "A"), (80, "B"), (70, "C"), (60, "D")):
        if score >= threshold:
            return letter
    return "F"


scores = [95, 85, 75, 65, 55]
print([grade_ternary(s) for s in scores])
print([grade_if(s) for s in scores])
print([grade_table(s) for s in scores])`,
          output: `['A', 'B', 'C', 'D', 'F']
['A', 'B', 'C', 'D', 'F']
['A', 'B', 'C', 'D', 'F']`,
          explanation:
            "Identical behaviour. The first version fits on one line and nobody can check it by eye. The second is obviously right. The third separates the *data* — the thresholds — from the logic, so adding a grade band is a change to a tuple rather than to control flow, and it is the version that survives a requirement change. The ternary's brevity bought nothing here.",
        },
      ],
      pitfalls: [
        {
          title: "Reading Python's ternary as a condition-first form",
          body: "`a if cond else b` puts the *result* first. Skimming code written by someone who mixes both languages, it is easy to read `x if y else z` as though `x` were the condition. Keeping ternaries short is most of the defence.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What can a ternary do that an `if` statement cannot?",
      answer:
        "Produce a value in a position where only an expression is allowed. That includes the initialiser in a declaration, where an `if` cannot appear — a blank `final` assigned in both branches of an `if` also compiles, but takes several lines; passing a conditional argument to a call; and appearing inside a string interpolation or a comprehension. The brevity is secondary — the real distinction is expression against statement.",
    },
    {
      question: "When should you not use a ternary?",
      answer:
        "When it nests more than once, when either branch has side effects rather than producing a value, or when the whole thing no longer fits on a line. A chain of four ternaries is a decision table written as a sentence and cannot be checked by eye; an `if`/`else if` chain, or better a table of thresholds iterated in a loop, is both clearer and easier to change. Ternaries are also harder to debug, since you cannot put a print inside one branch.",
    },
    {
      question: "How does Python's conditional expression differ from Java's?",
      answer:
        "Word order. Java is `condition ? whenTrue : whenFalse`, and Python is `whenTrue if condition else whenFalse` — the result comes first and the condition sits in the middle. They behave identically otherwise, including short-circuiting so that only the taken branch is evaluated. The Python form reads more naturally in a sentence and is more easily misread when skimming, which is another reason to keep them short.",
    },
  ],
  takeaways: [
    "A ternary is an expression, so it goes where a value goes and an `if` cannot",
    "Java: `cond ? a : b`. Python: `a if cond else b`, with the condition in the middle",
    "It gives a `final` its value in the declaration itself; a blank `final` assigned in each branch of an `if` also compiles",
    "It is the only way to branch inside an f-string or a comprehension",
    "Two levels is the practical nesting limit; past that use `if`/`else if` or a lookup table",
    "A ternary whose branches have side effects is a misused statement",
    "Separating threshold data from logic survives requirement changes better than either form",
  ],
};
