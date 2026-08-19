import type { Lesson } from "@/content/types";

export const branchingLesson: Lesson = {
  id: "cpp-branching",
  slug: "branching-if-switch",
  moduleSlug: "control-flow-functions",
  title: "Branching: if, switch & the Conditional Operator",
  summary:
    "Making decisions: `if` with an initialiser to keep variables scoped, `switch` and its deliberate fall-through, why a `switch` on an enum is safer than a chain of `if`s, and the conditional operator.",
  estimatedMinutes: 25,
  objectives: [
    "Write `if`/`else if`/`else` chains and know when to replace them",
    "Use C++17's `if` with an initialiser to scope a variable to its branch",
    "Write a `switch` correctly, including deliberate fall-through with `[[fallthrough]]`",
    "Let the compiler check that an enum switch is exhaustive",
    "Use the conditional operator without hurting readability",
  ],
  sections: [
    {
      id: "if",
      heading: "if, else if, else",
      body: [
        "The condition of an `if` must be contextually convertible to `bool`. Since every built-in type converts — zero is `false`, non-zero is `true` — `if (count)` and `if (ptr)` both compile and both mean \"not zero\".",
        "Braces are optional for a single statement and you should write them anyway. The cost of omitting them is a well-documented class of bug: someone adds a second line later, indents it to match, and it silently ends up outside the branch. Apple's \"goto fail\" TLS vulnerability in 2014 was exactly this.",
        "**C++17 added an initialiser to `if`**, which is a small feature with a real payoff: it lets you declare a variable, test it, and confine it to the branch, so it does not leak into the surrounding scope where it could be misused.",
      ],
      examples: [
        {
          id: "if-forms",
          title: "Chained conditions, scoped initialiser, and the ternary",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

std::string classify(int score) {
    if (score >= 90)      return "excellent";
    else if (score >= 70) return "good";
    else if (score >= 50) return "pass";
    else                  return "fail";
}

int main() {
    for (int s : {95, 75, 55, 20}) {
        std::cout << s << " -> " << classify(s) << '\\n';
    }

    // if with an initialiser (C++17): scope the variable to the branch.
    if (int doubled = 21 * 2; doubled > 40) {
        std::cout << "doubled is " << doubled << '\\n';
    }
    // \`doubled\` does not exist here.

    int n = 7;
    std::cout << (n % 2 == 0 ? "even" : "odd") << '\\n';
}`,
          output: `95 -> excellent
75 -> good
55 -> pass
20 -> fail
doubled is 42
odd`,
          explanation:
            "The ordering in `classify` matters: each test only runs if the previous ones failed, so `>= 70` implicitly means \"between 70 and 89\". Reverse the order and every score returns \"fail\". The `if`-with-initialiser form is most valuable with things like map lookups and function results you need to both test and use — the variable is in scope for the `else` branch too.",
        },
      ],
      pitfalls: [
        {
          title: "`if (x = 5)` assigns and is always true",
          body: "A single `=` where you meant `==` compiles, assigns 5 to `x`, and yields 5, which is truthy. This is one of the oldest bugs in C-family languages. `-Wall` catches it (`-Wparentheses` suggests writing `if ((x = 5))` to say you meant it), and comparing a constant on the left — `if (5 == x)` — makes it a compile error, though that style has fallen out of favour because modern warnings do the job without hurting readability.",
        },
      ],
    },
    {
      id: "switch",
      heading: "switch and fall-through",
      body: [
        "`switch` compares one integral or enum value against a list of constant cases. It exists for two reasons: it reads better than a long `else if` chain, and the compiler can often turn it into a jump table rather than a sequence of comparisons.",
        "**Cases fall through to the next one unless you `break`.** This is inherited from C and is the single most common source of `switch` bugs — but it is also occasionally exactly what you want, when two cases share behaviour.",
        "**C++17 added the `[[fallthrough]];` attribute**, which does nothing at runtime and tells both the compiler and the next reader that the fall-through was deliberate. Without it, `-Wextra` will warn — and that warning is valuable, so mark the intentional cases rather than turning it off.",
        "A `case` label needs a compile-time constant: a literal, a `constexpr` value, or an enumerator. You cannot switch on a `std::string`, which is the most common reason people fall back to `if` chains.",
      ],
      examples: [
        {
          id: "switch-fallthrough",
          title: "Deliberate fall-through, marked as such",
          lang: "cpp",
          code: `#include <iostream>

int main() {
    for (int code : {1, 2, 3, 9}) {
        switch (code) {
            case 1:
                std::cout << "one ";
                [[fallthrough]];        // deliberate: says so in the code
            case 2:
                std::cout << "two\\n";
                break;
            case 3:
                std::cout << "three\\n";
                break;
            default:
                std::cout << "unknown\\n";
                break;
        }
    }
}`,
          output: `one two
two
three
unknown`,
          explanation:
            "Code 1 printed **both** \"one\" and \"two\", because control fell from case 1 into case 2. That is what the attribute is announcing. Note that `default` is not required, but omitting it means an unmatched value does nothing at all — which is fine when that is genuinely correct and a silent bug when it is not.",
        },
      ],
      pitfalls: [
        {
          title: "Declaring a variable inside a case needs braces",
          body: "`case 1: int x = 5;` is an error, because the scope of a `switch` spans all its cases and jumping to `case 2` would skip the initialisation while `x` is still in scope. Wrap the case body in its own braces — `case 1: { int x = 5; ... break; }` — which gives the variable a scope that ends before the next label.",
        },
      ],
    },
    {
      id: "enum-switch",
      heading: "Switching on an enum makes the compiler check you",
      body: [
        "This is the strongest practical argument for `switch` over an `if` chain, and it is worth building the habit around.",
        "When you `switch` on an enumeration and omit a value, **GCC and Clang warn** under `-Wall`. That turns \"someone added a new enum value and forgot to handle it in four places\" from a runtime bug into a build-time list of exactly which four places.",
        "The warning only appears if there is no `default` label. A `default` tells the compiler every value is handled, so it stops checking — which means **adding `default` to an enum switch throws away the check you wanted**. When you genuinely need a catch-all, put it after the switch rather than inside it.",
        "Prefer `enum class` (a *scoped* enumeration) to the plain `enum` inherited from C. A scoped enum does not implicitly convert to `int`, and its enumerators are namespaced — `Colour::Red` rather than a bare `Red` polluting the surrounding scope.",
      ],
      examples: [
        {
          id: "enum-exhaustive",
          title: "The compiler finds the case you forgot",
          lang: "cpp",
          code: `#include <iostream>

enum class Colour { Red, Green, Blue };

const char* name(Colour c) {
    switch (c) {
        case Colour::Red:   return "red";
        case Colour::Green: return "green";
    }
    return "?";
}

int main() { std::cout << name(Colour::Blue) << '\\n'; }`,
          output: `warning: enumeration value 'Blue' not handled in switch [-Wswitch]
    4 |     switch (c) {
      |            ^`,
          explanation:
            "The program compiles and prints `?`, so nothing appears broken — but the warning named the exact enumerator that was missed. **Scale that to a real codebase**: add a new payment method to an enum, rebuild, and the compiler hands you every switch that needs updating. That is the check you are giving up when you add a `default` label out of habit.",
        },
      ],
    },
    {
      id: "ternary",
      heading: "The conditional operator",
      body: [
        "`condition ? a : b` is the only ternary operator in C++. It is an **expression**, which is its whole reason for existing — it produces a value, so it can initialise a `const` variable or appear in an argument list where an `if` statement cannot.",
        "That makes it genuinely valuable in one place in particular: initialising something you want to be `const`. Without it you would have to declare the variable non-`const`, assign in an `if`, and give up the guarantee.",
        "Both branches must have a common type, and the compiler will convert to find one — which occasionally produces a surprise, as when one branch is `int` and the other `double` and the whole expression becomes `double`.",
        "Keep them short. A nested ternary is legal and is almost always harder to read than the `if` it replaced.",
      ],
      examples: [
        {
          id: "ternary-const",
          title: "Where the ternary genuinely earns its place",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

int main() {
    int count = 1;

    // With the ternary: const, initialised once, correct by construction.
    const std::string label = (count == 1) ? "item" : "items";

    // Without it, you would need this — and \`label2\` cannot be const.
    std::string label2;
    if (count == 1) label2 = "item";
    else            label2 = "items";

    std::cout << count << ' ' << label << '\\n';

    // Both branches convert to a common type: this whole expression is double.
    std::cout << (true ? 1 : 2.5) << '\\n';
}`,
          output: `1 item
1`,
          explanation:
            "The last line prints `1`, not `1.0` — but its type genuinely is `double`, and the stream prints a whole-valued double without a decimal point by default. The `const` on `label` is the real win: it is impossible for anything later in the function to change it, and the compiler enforces that.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is `if` with an initialiser, and why is it useful?",
      answer:
        "C++17 allows `if (init; condition)`, so you can declare a variable, test it, and confine it to the `if` and `else` branches. It matters because the alternative leaks the variable into the enclosing scope, where it can be used after it is meaningful — a stale iterator or a result whose validity was only established inside the branch. It is the same idea as the initialiser in a `for` loop, and `switch` gained it too.",
    },
    {
      question: "Why do `switch` cases fall through, and how do you mark it as intentional?",
      answer:
        "It is inherited from C, where it enables several labels to share one body. Without a `break`, control continues into the next case. Since C++17 you write `[[fallthrough]];` before the next label to declare it deliberate — it generates no code and silences the `-Wimplicit-fallthrough` warning that `-Wextra` enables. The right response to that warning is to annotate the intentional cases rather than disable it, since accidental fall-through is a real and common bug.",
    },
    {
      question: "Why is a `switch` on an enum safer than an `if`/`else` chain?",
      answer:
        "Because the compiler checks exhaustiveness. If you omit an enumerator, `-Wswitch` names the one you missed, so adding a value to an enum produces a build-time list of every place that needs updating rather than a silent runtime fallthrough. The catch is that adding a `default` label disables the check — the compiler concludes everything is handled. When you need a catch-all, put it after the switch rather than inside it.",
    },
    {
      question: "What is the difference between `enum` and `enum class`?",
      answer:
        "A plain `enum` puts its enumerators in the enclosing scope, so two enums cannot both have a `Red`, and it implicitly converts to `int`, which allows nonsense like comparing a colour to a file mode. `enum class` is scoped — you write `Colour::Red` — and does not implicitly convert, so mixing enum types is a compile error. You can still convert explicitly with `static_cast` when you need the underlying value. Prefer `enum class` unless you are matching an existing C API.",
    },
    {
      question: "When is the conditional operator preferable to an `if`?",
      answer:
        "When you need an expression rather than a statement — most usefully to initialise a `const` variable in one step, which an `if` cannot do without giving up the `const`. It is also useful inside argument lists. Keep it to one level: nested ternaries are legal but consistently harder to read than the `if` they replace. Remember both branches are converted to a common type, so mixing `int` and `double` yields `double`.",
    },
  ],
  takeaways: [
    "Always brace an `if` body, even a one-liner — the unbraced form has a documented history of security bugs",
    "`if (init; cond)` scopes a variable to the branch instead of leaking it into the function",
    "`switch` cases fall through without `break`; mark the deliberate ones with `[[fallthrough]];`",
    "A `case` label needs a compile-time constant, which is why you cannot switch on a `std::string`",
    "Declaring a variable in a `case` requires its own braces, because the switch scope spans all labels",
    "Switching on an enum gets you an exhaustiveness check — and adding `default` silently gives it away",
    "Prefer `enum class`: scoped enumerators, no implicit conversion to `int`",
    "The ternary is an expression, which is what lets it initialise a `const` in one step",
  ],
  status: "available",
};
