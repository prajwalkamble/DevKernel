import type { Lesson } from "@/content/types";

export const logicalOperatorsLesson: Lesson = {
  id: "dsa-ops-logical",
  slug: "logical-operators",
  moduleSlug: "operators-and-expressions",
  title: "Logical Operators & Short-Circuiting",
  summary:
    "Why the order of your conditions is a correctness decision rather than a style one, and how to negate a compound condition without getting it backwards.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Use `&&`, `||` and `!` and their Python equivalents",
    "Order conditions so that a guard protects the check after it",
    "Negate a compound condition correctly using De Morgan's laws",
    "Explain what Python's `and` and `or` return, and why it is not a boolean",
  ],
  sections: [
    {
      id: "the-three",
      heading: "Three operators",
      body: [
        "`&&` is and, `||` is or, `!` is not. Python spells them `and`, `or`, `not`, which is the only difference worth noting.",
        "Both languages **short-circuit**: `&&` stops as soon as it finds a false operand, `||` as soon as it finds a true one. The remaining operands are never evaluated.",
      ],
    },
    {
      id: "guarding",
      heading: "Short-circuiting as a guard",
      body: [
        "This is the point of the lesson. Short-circuiting is not a performance detail — it is what lets one condition protect the next from crashing, and it makes the *order* of your conditions a correctness decision.",
        "`i < values.length && values[i] == target` is safe. The same two conditions swapped is a crash. Nothing about the code says so except the order.",
        "The pattern is everywhere: check non-null before dereferencing, check non-empty before indexing, check the divisor before dividing, check bounds before accessing a grid.",
      ],
      examples: [
        {
          id: "guarding",
          title: "The same conditions, two orders",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int[] values = { 10, 20, 30 };
        int i = 5;

        System.out.println("guarded: " + (i < values.length && values[i] == 20));

        try {
            System.out.println(values[i] == 20 && i < values.length);
        } catch (ArrayIndexOutOfBoundsException e) {
            System.out.println("unguarded: threw " + e.getClass().getSimpleName());
        }

        String s = null;
        System.out.println("null-safe: " + (s != null && s.length() > 0));
    }
}`,
          output: `guarded: false
unguarded: threw ArrayIndexOutOfBoundsException
null-safe: false`,
          explanation:
            "Identical conditions, opposite outcomes. The guarded version never evaluates `values[i]` because `i < values.length` was already false. The null-safe line is the same shape and is the single most common use of `&&` in Java — and note it must be `!=  null` on the left, because the whole point is that the right side cannot be evaluated safely.",
        },
      ],
      pitfalls: [
        {
          title: "Java's `&` and `|` on booleans",
          body: "They compute the same logic and do *not* short-circuit — both sides are always evaluated. `if (arr != null & arr.length > 0)` throws on a null array. There is essentially never a reason to use them on booleans, so treat a single `&` between two conditions as a typo.",
        },
      ],
    },
    {
      id: "de-morgan",
      heading: "Negating a compound condition",
      body: [
        "Getting the negation of `a && b` wrong is one of the most common logic errors there is. The rule is De Morgan's law and it is worth memorising in words:",
        "**not (a and b)** is **(not a) or (not b)**.",
        "**not (a or b)** is **(not a) and (not b)**.",
        "The operator flips. That is the part people forget — they negate both conditions and leave the `&&` alone, which produces a condition that is not the opposite of anything they intended.",
        "The practical advice: when a condition needs negating and you are not certain, do not transform it. Write `!(original)` and leave it. It is correct by construction, and a reader can see what it means.",
      ],
      examples: [
        {
          id: "de-morgan",
          title: "The transformation, checked exhaustively",
          lang: "python",
          code: `for a in (False, True):
    for b in (False, True):
        naive = (not a) and (not b)
        correct = (not a) or (not b)
        original = not (a and b)
        print(f"a={str(a):<5} b={str(b):<5}  not(a and b)={str(original):<5}"
              f"  correct={str(correct):<5}  naive={str(naive):<5}  matches={naive == original}")`,
          output: `a=False b=False  not(a and b)=True   correct=True   naive=True   matches=True
a=False b=True   not(a and b)=True   correct=True   naive=False  matches=False
a=True  b=False  not(a and b)=True   correct=True   naive=False  matches=False
a=True  b=True   not(a and b)=False  correct=False  naive=False  matches=True`,
          explanation:
            "The naive transformation — negate both, keep the `and` — agrees on two of the four rows and disagrees on the other two. That is the worst possible failure profile: it works often enough to pass a casual test and fails on exactly the mixed cases. Flipping the operator, as the `correct` column does, matches on all four.",
        },
      ],
    },
    {
      id: "python-returns",
      heading: "What Python's `and` and `or` actually return",
      body: [
        "Python's `and` and `or` do not return `True` or `False`. They return **one of the operands**.",
        "`a or b` returns `a` if `a` is truthy, otherwise `b`. `a and b` returns `a` if `a` is falsy, otherwise `b`. Used in a condition this behaves exactly like boolean logic, because the returned value is then tested for truthiness anyway.",
        "The reason to know it is the `value or default` idiom, which is idiomatic Python — and the reason to be careful with it is that it substitutes the default for *any* falsy value, including 0 and the empty string.",
      ],
      examples: [
        {
          id: "or-default",
          title: "The default idiom, and where it bites",
          lang: "python",
          code: `print("hi" or "default")
print(None or "default")
print(0 or "default")
print("" or "default")

print(0 and "never reached")
print(1 and "reached")

count = 0
print("or   :", count or 10)
print("if   :", count if count is not None else 10)`,
          output: `hi
default
default
default
0
reached
or   : 10
if   : 0`,
          explanation:
            "The third line is the trap: a genuine count of zero is replaced by the default, because zero is falsy. When the value can legitimately be zero or empty, the `or` idiom is wrong and you need an explicit `is None` test — which is what the last pair contrasts — and note the explicit form keeps the 0 while the `or` form silently replaced it with 10. Note also that `and` and `or` return the operand itself, which is why `0 and \"never reached\"` prints `0` rather than `False`.",
        },
      ],
    },
    {
      id: "readability",
      heading: "Conditions you can read",
      body: [
        "Two habits, both cheap.",
        "**Name a compound condition.** `boolean inBounds = r >= 0 && r < rows && c >= 0 && c < cols;` then `if (inBounds)`. The name is documentation that cannot go stale, and the condition becomes reusable in the same function.",
        "**Prefer positive conditions.** `if (isValid)` reads better than `if (!isInvalid)`, and double negatives — `if (!notFound)` — are where reasoning errors live.",
        "Both matter more in an interview than at your desk, because the interviewer is reading your logic in real time and a four-clause condition on one line is where they lose the thread.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is short-circuit evaluation and why does it matter for correctness?",
      answer:
        "`&&` stops evaluating as soon as an operand is false, and `||` as soon as one is true, so the remaining operands never run. That makes the order of conditions a correctness decision rather than a stylistic one: `i < n && values[i] == x` is safe while the reverse order throws, and `s != null && s.length() > 0` depends entirely on the null check coming first. Java's `&` and `|` do not short-circuit, which is why using them between two conditions is almost always a bug.",
    },
    {
      question: "What is the negation of `a && b`?",
      answer:
        "`!a || !b` — the operator flips as well as the operands. That is De Morgan's law, and the common error is negating both conditions while leaving the `&&` in place, which produces a condition that agrees with the correct one on two of four input combinations and disagrees on the mixed ones. When in doubt, write `!(a && b)` and do not transform it at all.",
    },
    {
      question: "What does `x or default` return in Python?",
      answer:
        "`x` when `x` is truthy, otherwise `default` — and it returns the operand itself rather than a boolean. It is idiomatic for supplying a fallback, but it substitutes for every falsy value, so a legitimate 0, empty string or empty list is replaced too. When zero or empty is a valid value, use an explicit `if x is None` instead; the `or` idiom is only safe when falsy and missing genuinely mean the same thing.",
    },
  ],
  takeaways: [
    "`&&`, `||`, `!` in Java; `and`, `or`, `not` in Python — both short-circuit",
    "Short-circuiting makes condition order a correctness decision, not a style one",
    "`s != null && s.length() > 0` works only in that order",
    "Java's `&` and `|` on booleans evaluate both sides; treat a single `&` between conditions as a typo",
    "`not (a and b)` is `(not a) or (not b)` — the operator flips too",
    "The naive negation agrees on two of four cases, which is the worst kind of wrong",
    "Python's `and`/`or` return an operand, not a boolean — which is what makes `x or default` work",
    "`x or default` replaces 0 and empty as well as None; use `is None` when zero is legitimate",
  ],
};
