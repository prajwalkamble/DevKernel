import type { Lesson } from "@/content/types";

export const ifElseLesson: Lesson = {
  id: "dsa-flow-if-else",
  slug: "if-else-and-overlapping-conditions",
  moduleSlug: "conditional-statements-and-loops",
  title: "if, else if, else — and Conditions That Overlap",
  summary:
    "Why the order of an else-if chain is part of its meaning, what happens when two branches could both match, and the guard clause that removes most nesting.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Explain why an else-if chain is order-dependent and a set of separate ifs is not",
    "Spot a chain whose branches overlap, and fix it by ordering or by tightening",
    "Rewrite nested conditionals as guard clauses",
    "Say what happens when a condition is exhaustive in your head but not in the code",
  ],
  sections: [
    {
      id: "chain-is-ordered",
      heading: "An else-if chain is ordered, and that is the whole point",
      body: [
        "`if` / `else if` / `else` evaluates its conditions top to bottom and **stops at the first one that is true**. Everything below it is skipped, whether or not it would also have matched.",
        "That makes the order part of the meaning. Two chains with identical conditions in a different sequence are different programs.",
        "The bug this produces is subtle because both versions look correct in isolation: each condition is true of the value, so nothing reads as wrong. Only the *first* one runs.",
      ],
      examples: [
        {
          id: "overlap",
          title: "The same conditions, two orders",
          lang: "python",
          code: `score = 85

if score >= 60:
    print("D+")
elif score >= 80:
    print("B")

print("---")

if score >= 90:
    print("A")
elif score >= 80:
    print("B")
elif score >= 60:
    print("D")`,
          output: `D+
---
B`,
          explanation:
            "A score of 85 satisfies both `>= 60` and `>= 80`. The first chain checks the loosest condition first, so it always wins and the `>= 80` branch is unreachable for every passing score. The second chain checks from strictest to loosest and is correct. The rule for threshold chains: **order from most specific to least**, and if you cannot say which is which, the conditions probably need rewriting rather than reordering.",
        },
      ],
      pitfalls: [
        {
          title: "Separate `if`s where you meant a chain",
          body: "Four consecutive `if` statements are not an else-if chain — every one is evaluated, so several branches can run. That is sometimes what you want, and when it is not, the symptom is two lines of output where you expected one. If exactly one branch should run, say so with `elif`.",
        },
      ],
    },
    {
      id: "exhaustive",
      heading: "Chains that are exhaustive in your head",
      body: [
        "A chain ending in `else if` rather than `else` has a silent fall-through case: when no condition matches, nothing happens.",
        "That is fine when it is deliberate and a bug when you believed the conditions covered everything. The common version is a chain over `> 0` and `< 0` that forgets zero, or over a set of known values that meets an unexpected one.",
        "The defence is cheap: **end with `else`**, even if the body is only a comment or a thrown error. It converts a silent no-op into either a documented decision or a loud failure.",
      ],
      examples: [
        {
          id: "missing-else",
          title: "The gap at zero",
          lang: "java",
          code: `public class Main {
    static String describeIncomplete(int n) {
        String result = "unset";
        if (n > 0) {
            result = "positive";
        } else if (n < 0) {
            result = "negative";
        }
        return result;
    }

    static String describeComplete(int n) {
        if (n > 0) {
            return "positive";
        } else if (n < 0) {
            return "negative";
        } else {
            return "zero";
        }
    }

    public static void main(String[] args) {
        for (int n : new int[] { 5, -5, 0 }) {
            System.out.println(n + ": " + describeIncomplete(n) + " / " + describeComplete(n));
        }
    }
}`,
          output: `5: positive / positive
-5: negative / negative
0: unset / zero`,
          explanation:
            "The incomplete version returns `unset` for zero — the initial value, leaking out because no branch ran. In real code that initial value is usually `null` or `0`, which is far harder to spot than the word `unset`. Ending with `else` makes the third case a decision rather than an omission.",
        },
      ],
    },
    {
      id: "guard-clauses",
      heading: "Guard clauses: returning early instead of nesting",
      body: [
        "Nested conditionals grow to the right and become hard to follow after two levels. The fix is to **handle the exceptional cases first and return**, leaving the main path unindented at the bottom.",
        "This is the single highest-value readability habit in this module. It also matches how you would explain the function aloud: \"if there's nothing to do, stop; if the input is bad, stop; otherwise, here's the work.\"",
      ],
      examples: [
        {
          id: "guards",
          title: "Three levels of nesting, removed",
          lang: "python",
          code: `def nested(values, target):
    if values is not None:
        if len(values) > 0:
            if target is not None:
                for i, v in enumerate(values):
                    if v == target:
                        return i
                return -1
            else:
                return -1
        else:
            return -1
    else:
        return -1


def guarded(values, target):
    if values is None or target is None:
        return -1
    if len(values) == 0:
        return -1

    for i, v in enumerate(values):
        if v == target:
            return i
    return -1


cases = [([1, 2, 3], 2), ([], 1), (None, 1), ([1, 2], None)]
print([nested(v, t) for v, t in cases])
print([guarded(v, t) for v, t in cases])`,
          output: `[1, -1, -1, -1]
[1, -1, -1, -1]`,
          explanation:
            "Identical behaviour. The second version has one level of indentation for the actual work instead of four, and the reader can see the preconditions as a list before reaching any logic. Note the guards are ordered by cheapness — the null checks precede the length check, because `len(None)` would throw.",
        },
      ],
      pitfalls: [
        {
          title: "Guards in the wrong order",
          body: "`if len(values) == 0` before `if values is None` throws on a null input, for the same short-circuit reason as the previous module. Guards must be ordered so each one is safe to evaluate given that the ones above it passed.",
        },
      ],
    },
    {
      id: "boolean-returns",
      heading: "The `if` that should not exist",
      body: [
        "One pattern is worth naming because it appears in almost every beginner's code and disappears from every experienced one.",
        "`if (condition) return true; else return false;` is just `return condition;`. The `if` computes a boolean and then converts it to the same boolean.",
        "The same applies to assignment: `if (x > 0) { flag = true; } else { flag = false; }` is `flag = x > 0;`.",
      ],
      examples: [
        {
          id: "boolean-return",
          title: "Three versions, one of them worth writing",
          lang: "python",
          code: `def has_duplicate_verbose(values):
    seen = set()
    for v in values:
        if v in seen:
            return True
        else:
            seen.add(v)
    return False


def has_duplicate_clean(values):
    return len(set(values)) != len(values)


def is_even_verbose(n):
    if n % 2 == 0:
        return True
    else:
        return False


def is_even_clean(n):
    return n % 2 == 0


print(has_duplicate_verbose([1, 2, 1]), has_duplicate_clean([1, 2, 1]))
print(has_duplicate_verbose([1, 2, 3]), has_duplicate_clean([1, 2, 3]))
print(is_even_verbose(4), is_even_clean(4))`,
          output: `True True
False False
True True`,
          explanation:
            "`is_even_clean` is the point: the condition already *is* the answer, so wrapping it in an `if` adds four lines and no information. Note the duplicate example is different — there the loop version returns early and the clean version does not, so they differ in work done on a huge list even though they agree on the answer. Shorter is not automatically better; shorter *for the same work* is.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between a chain of `else if`s and several separate `if`s?",
      answer:
        "A chain evaluates conditions in order and stops at the first true one, so exactly one branch can run and the order is part of the meaning. Separate `if` statements each evaluate independently, so several bodies can run. The bug is using separate `if`s where exactly one branch should fire, or ordering a chain from loosest to strictest so that later branches become unreachable — a score of 85 hitting `>= 60` before `>= 80` never reaches the second.",
    },
    {
      question: "What is a guard clause and why prefer it?",
      answer:
        "Handling the exceptional or trivial cases first and returning immediately, so the main logic sits at the bottom with no nesting. It replaces a pyramid of nested `if`s with a flat list of preconditions, which is both easier to read and closer to how you would describe the function aloud. Guards must be ordered so each is safe given the ones above passed — the null check before the length check, not after.",
    },
    {
      question: "Why should an if/else-if chain usually end with `else`?",
      answer:
        "Because a chain without one silently does nothing when no condition matches, and \"nothing\" is indistinguishable from a case you forgot. A chain over positive and negative that omits zero leaves a variable at whatever it was initialised to, typically null or 0, and that value then propagates. Ending with `else` forces the final case to be a decision — either a documented default or a thrown error — rather than an omission.",
    },
  ],
  takeaways: [
    "An else-if chain stops at the first true condition, so its order is part of its meaning",
    "Order threshold chains from most specific to least; `>= 60` before `>= 80` makes the second unreachable",
    "Separate `if`s all run; use `elif` when exactly one branch should",
    "End chains with `else` so a missed case is a decision rather than a silent no-op",
    "Guard clauses replace nesting: handle the exceptional cases first and return",
    "Order guards so each is safe given the ones above passed",
    "`if (c) return true; else return false;` is `return c;`",
    "Shorter is not automatically better — shorter for the same work is",
  ],
};
