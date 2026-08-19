import type { Lesson } from "@/content/types";

export const operatorsLesson: Lesson = {
  id: "cpp-operators",
  slug: "operators-and-expressions",
  moduleSlug: "foundations",
  title: "Operators & Expressions",
  summary:
    "Arithmetic, comparison, logical and bitwise operators; the difference between `i++` and `++i`; short-circuit evaluation as a safety tool; the C++20 spaceship operator; and the precedence traps that make GCC and Clang produce different answers from the same source.",
  estimatedMinutes: 35,
  objectives: [
    "Use the arithmetic, comparison, logical and bitwise operators correctly",
    "Explain the difference between prefix and postfix increment, and which to prefer",
    "Rely on short-circuit evaluation deliberately, as a guard",
    "Read and write bit manipulation with masks and shifts",
    "Use `<=>` to generate all six comparisons from one line",
    "Recognise the precedence traps and the unspecified evaluation order of function arguments",
  ],
  sections: [
    {
      id: "arithmetic",
      heading: "Arithmetic and assignment",
      body: [
        "The arithmetic operators are `+ - * / %`, and they behave as you would expect with two exceptions already met in the previous lesson: **integer division truncates toward zero**, and `%` requires integer operands (use `std::fmod` for floating point).",
        "Each has a compound assignment form — `+=`, `-=`, `*=`, `/=`, `%=` — and these are not merely shorthand. `x += f()` evaluates `x` once; `x = x + f()` names it twice, which matters when `x` is a complicated expression like `data[compute_index()]`.",
        "**Increment and decrement come in two flavours, and the difference is the value of the expression, not the effect on the variable.** `i++` (postfix) yields the value *before* incrementing. `++i` (prefix) yields the value *after*. Both leave `i` one larger.",
      ],
      examples: [
        {
          id: "increment",
          title: "Prefix against postfix",
          lang: "cpp",
          code: `#include <iostream>

int main() {
    int i = 5;
    std::cout << "i++ yields " << i++ << ", i is now " << i << '\\n';

    int j = 5;
    std::cout << "++j yields " << ++j << ", j is now " << j << '\\n';

    int total = 10;
    total += 5;  total -= 3;  total *= 2;  total /= 4;  total %= 4;
    std::cout << "total: " << total << '\\n';
}`,
          output: `i++ yields 5, i is now 6
++j yields 6, j is now 6
total: 2`,
          explanation:
            "Trace the compound assignments: 10, +5 = 15, −3 = 12, ×2 = 24, ÷4 = 6, %4 = **2**. **Prefer `++i` to `i++` as a habit**, even when you discard the result. For an `int` they compile identically, but for a class type — an iterator, say — postfix has to copy the object to return its old value, and that copy is real work. Writing `++i` everywhere means you never pay it by accident.",
        },
      ],
    },
    {
      id: "comparison",
      heading: "Comparison and the spaceship operator",
      body: [
        "The comparison operators are `== != < > <= >=`, and each yields a `bool`.",
        "Historically, making your own type comparable meant writing all six by hand, keeping them consistent, and remembering that `a > b` should mean exactly `b < a`. That is six functions of boilerplate per type, and getting one of them subtly wrong is easy.",
        "**C++20 replaced this with the three-way comparison operator, `<=>`, universally called the spaceship operator.** It returns not a `bool` but an ordering — less, equal or greater — in one operation. Define it once and the compiler generates `< > <= >=` from it.",
        "Better still, you can default it. `auto operator<=>(const T&) const = default;` compares members in declaration order, exactly like a tuple, which is what you want the overwhelming majority of the time.",
      ],
      examples: [
        {
          id: "spaceship",
          title: "Six comparisons from one line",
          lang: "cpp",
          code: `#include <iostream>
#include <compare>

struct Version {
    int major, minor, patch;

    // Generates <, >, <=, >= by comparing members in declaration order.
    auto operator<=>(const Version&) const = default;
    bool operator==(const Version&) const = default;
};

int main() {
    Version a{1, 4, 0};
    Version b{1, 10, 0};

    std::cout << std::boolalpha
              << (a < b) << ' ' << (a == b) << ' ' << (a >= b) << '\\n';
}`,
          output: `true false false`,
          explanation:
            "`1.4.0 < 1.10.0` is `true` because the members are compared in order: `major` ties, then `4 < 10`. That is correct version ordering, and it came from two defaulted lines. Note that **`==` is declared separately** — this is deliberate, because equality can often be tested much faster than ordering (comparing two strings' lengths first, for instance), so the language keeps them independent.",
        },
      ],
    },
    {
      id: "logical",
      heading: "Logical operators and short-circuiting",
      body: [
        "`&&` (and), `||` (or) and `!` (not) operate on `bool`. Any built-in type converts to `bool` implicitly — zero is `false`, anything else is `true` — which is why `if (ptr)` works as a null check.",
        "**`&&` and `||` short-circuit: they evaluate the right operand only if the result is not already decided.** This is guaranteed by the standard, not an optimisation, and it makes them the standard tool for guarding an unsafe operation.",
        "The pattern `if (ptr != nullptr && ptr->ready())` is correct precisely *because* of this guarantee. If `ptr` is null the right side never runs, so there is no dereference of null. Reverse the order and you have a crash.",
        "One consequence worth holding onto: **anything with a side effect on the right of `&&` or `||` may not happen.** A function call there is conditional.",
      ],
      examples: [
        {
          id: "short-circuit",
          title: "Short-circuiting, and proving it",
          lang: "cpp",
          code: `#include <iostream>

bool expensive() { std::cout << "[expensive ran] "; return true; }

int main() {
    int* p = nullptr;

    // Short-circuit: the right side never runs, so no null dereference.
    if (p != nullptr && *p > 0) std::cout << "positive\\n";
    else std::cout << "guarded safely\\n";

    std::cout << std::boolalpha;
    std::cout << (false && expensive()) << '\\n';   // right side skipped
    std::cout << (true  || expensive()) << '\\n';   // right side skipped
    std::cout << (true  && expensive()) << '\\n';   // right side runs
}`,
          output: `guarded safely
false
true
[expensive ran] true`,
          explanation:
            "`[expensive ran]` appears exactly once, on the only line where the answer was not already determined. Put the cheap test first and the expensive one second and you get a free optimisation; put the null check first and you get safety.",
        },
      ],
      pitfalls: [
        {
          title: "`&` and `|` are not `&&` and `||`",
          body: "The single-character forms are bitwise operators. They work on `bool` — `true & false` is `false` — but they **do not short-circuit**, so both sides always evaluate. Writing `if (ptr != nullptr & ptr->ready())` compiles and crashes on a null pointer. Losing a character here is a real bug, and it is quiet because the result is correct whenever the guard was unnecessary.",
        },
      ],
    },
    {
      id: "bitwise",
      heading: "Bitwise operators",
      body: [
        "Six operators work on the individual bits of an integer: `&` (and), `|` (or), `^` (exclusive or), `~` (not), `<<` (left shift) and `>>` (right shift).",
        "These matter more in C++ than in higher-level languages because you meet them constantly in real work: hardware registers, network protocols, permission flags, compression, hashing, and any API that packs several booleans into one integer.",
        "The four idioms worth memorising, where `mask` has a single bit set: **set** a bit with `x |= mask`, **clear** it with `x &= ~mask`, **toggle** it with `x ^= mask`, and **test** it with `(x & mask) != 0`.",
        "Shifting left by `n` multiplies by 2 to the power of `n`; shifting right divides. **Never shift by more than the width of the type or by a negative amount** — that is undefined behaviour, not a zero.",
      ],
      examples: [
        {
          id: "bit-ops",
          title: "Every bitwise operator, shown in binary",
          lang: "cpp",
          code: `#include <iostream>
#include <bitset>

int main() {
    unsigned int flags = 0b1010;   // binary literal, C++14

    std::cout << "flags      " << std::bitset<8>(flags) << '\\n';
    std::cout << "flags | 1  " << std::bitset<8>(flags | 0b0001) << '\\n';
    std::cout << "flags & 2  " << std::bitset<8>(flags & 0b0010) << '\\n';
    std::cout << "flags ^ 15 " << std::bitset<8>(flags ^ 0b1111) << '\\n';
    std::cout << "flags << 2 " << std::bitset<8>(flags << 2) << '\\n';
    std::cout << "flags >> 1 " << std::bitset<8>(flags >> 1) << '\\n';
    std::cout << "as ints: " << flags << ' ' << (flags << 2) << '\\n';
}`,
          output: `flags      00001010
flags | 1  00001011
flags & 2  00000010
flags ^ 15 00000101
flags << 2 00101000
flags >> 1 00000101
as ints: 10 40`,
          explanation:
            "`std::bitset<8>` is a debugging tool worth knowing — it prints an integer's bits directly, which turns bit manipulation from guesswork into something you can see. Note that `flags << 2` turned 10 into 40, exactly multiplication by four. Binary literals (`0b1010`) arrived in C++14 and make masks far more readable than the hexadecimal they replaced.",
        },
      ],
      pitfalls: [
        {
          title: "Right-shifting a negative signed value is implementation-defined",
          body: "`-8 >> 1` may shift in copies of the sign bit (arithmetic shift, giving -4) or zeros (logical shift). Every mainstream compiler does the arithmetic one, and C++20 finally mandated it — but code targeting older standards should not rely on it. **Do bit manipulation on unsigned types.** That also sidesteps the fact that left-shifting a signed value into the sign bit is undefined behaviour.",
        },
      ],
    },
    {
      id: "precedence",
      heading: "Precedence, and the traps that survive",
      body: [
        "C++ has around 17 levels of operator precedence — too many to memorise, and you do not need to. What you need is to recognise the handful of combinations that genuinely trip people up, and to parenthesise them.",
        "**Bitwise operators bind more loosely than comparison.** `a & b == 0` parses as `a & (b == 0)`, which is almost never what anyone means. This is inherited from C and is widely regarded as a design mistake.",
        "**Shift binds more loosely than arithmetic.** `c >> 1 + 1` is `c >> 2`.",
        "**`<<` for streams has the same precedence as `<<` for shifting**, which is why `std::cout << a + b` works but `std::cout << a & b` does not.",
        "The practical rule: **if you have to think about it, add parentheses.** They cost nothing at runtime and the compiler will tell you when it thinks you need them — `-Wparentheses` is included in `-Wall`.",
      ],
      examples: [
        {
          id: "precedence-traps",
          title: "Three expressions that do not mean what they look like",
          lang: "cpp",
          code: `#include <iostream>

int main() {
    int a = 1, b = 2, c = 4;
    std::cout << std::boolalpha;
    std::cout << (a & b == 0) << '\\n';       // parses as a & (b == 0)
    std::cout << ((a & b) == 0) << '\\n';
    std::cout << (a + b << 1) << '\\n';       // (a+b) << 1
    std::cout << (c >> 1 + 1) << '\\n';       // c >> (1+1)
}`,
          output: `warning: suggest parentheses around comparison in operand of '&' [-Wparentheses]
    5 |     std::cout << (a & b == 0) << '\\n';
      |                       ~~^~~~

0
true
6
1`,
          explanation:
            "The first line prints `0` rather than `false` — a detail worth understanding. `a & (b == 0)` is `1 & false`, the `bool` converts to `0`, and the result is an **`int`**, so `std::boolalpha` does not apply. The second line is a genuine `bool` and prints `true`. Then `a + b << 1` is `3 << 1` = 6, and `c >> 1 + 1` is `4 >> 2` = 1. Every one of these produced a compiler warning telling you where the parentheses go.",
        },
      ],
    },
    {
      id: "evaluation-order",
      heading: "The order arguments are evaluated in is not specified",
      body: [
        "This one surprises people from almost every other language, and it is worth seeing rather than being told.",
        "**The order in which a function's arguments are evaluated is unspecified.** The compiler may evaluate them left to right, right to left, or interleaved. C++17 tightened the rules — each argument is now *indeterminately sequenced* rather than unsequenced, meaning one completes before another starts — but the *order* is still the compiler's choice.",
        "So if two arguments both modify the same variable, two conforming compilers can produce different output from identical source. Not a bug in either of them.",
        "Separately, **modifying a variable twice within one expression without an intervening sequence point is undefined behaviour**. `j = j++ + 1;` is the classic; so is `arr[i] = i++;`.",
        "The rule that keeps you safe is easy: **do not modify a variable and also read it elsewhere in the same expression.** Split it into two statements. The cost is one line and the benefit is a program that means the same thing everywhere.",
      ],
      examples: [
        {
          id: "unspecified-order",
          title: "The same source, two compilers, two answers",
          lang: "cpp",
          code: `#include <iostream>

void show(int a, int b) { std::cout << a << ' ' << b << '\\n'; }

int main() {
    int i = 0;
    show(i++, i++);          // order of evaluation is unspecified
    int j = 0;
    j = j++ + 1;             // undefined behaviour
    std::cout << j << '\\n';
}`,
          output: `$ g++ -std=c++20 -Wall order.cpp -o order && ./order
warning: operation on 'i' may be undefined [-Wsequence-point]
1 0

$ clang++ -std=c++20 -Wall order.cpp -o order && ./order
warning: multiple unsequenced modifications to 'i' [-Wunsequenced]
0 1`,
          explanation:
            "**GCC printed `1 0`. Clang printed `0 1`.** Same file, same standard, same machine — both correct, because the standard does not pick. If you ever needed a reason to keep expressions simple, this is it. Both compilers warned, under `-Wall`, with lints named `-Wsequence-point` and `-Wunsequenced`.",
        },
      ],
      pitfalls: [
        {
          title: "`std::cout << f() << g();` is safe about ordering, but only since C++17",
          body: "Chained stream insertion is left-to-right sequenced in C++17 and later, so `f()` is guaranteed to run before `g()`. Before C++17 it was unspecified, and the same expression could print in either order. If you maintain code targeting C++14 or earlier, treat any chain of calls with side effects as a bug waiting to be found.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between `i++` and `++i`, and which should you prefer?",
      answer:
        "Both increment the variable; they differ in what the expression yields — postfix yields the old value, prefix the new one. Prefer prefix as a default habit. For built-in types the compiler generates identical code, but for a class type like an iterator, postfix must construct and return a copy of the old state, which is real work. Writing `++i` means you never pay for a copy you were going to discard.",
    },
    {
      question: "What is short-circuit evaluation and why does it matter?",
      answer:
        "`&&` evaluates its right operand only if the left is true, and `||` only if the left is false. It is guaranteed by the standard rather than an optimisation, which is what makes `if (p != nullptr && p->ready())` safe — if `p` is null the dereference never happens. The corollary is that any side effect on the right side is conditional. Note that the bitwise `&` and `|` do not short-circuit even when applied to `bool`, so a single dropped character turns that safe guard into a crash.",
    },
    {
      question: "How do you set, clear, toggle and test a bit?",
      answer:
        "With a mask that has a single bit set: set with `x |= mask`, clear with `x &= ~mask`, toggle with `x ^= mask`, and test with `(x & mask) != 0`. Do this on unsigned types — right-shifting a negative signed value was implementation-defined before C++20, and left-shifting into the sign bit is undefined behaviour. `std::bitset` is useful for printing the bits while debugging.",
    },
    {
      question: "What does the spaceship operator do?",
      answer:
        "`<=>` is C++20's three-way comparison. It returns an ordering — less, equal or greater — rather than a `bool`, and from a single definition the compiler generates `<`, `>`, `<=` and `>=`. Defaulting it with `auto operator<=>(const T&) const = default;` compares members in declaration order like a tuple, which replaces six hand-written functions that had to be kept mutually consistent. `==` is declared separately on purpose, because equality can often be tested more cheaply than ordering.",
    },
    {
      question: "In what order are a function's arguments evaluated?",
      answer:
        "Unspecified. The compiler may choose any order, and C++17 only guaranteed that each argument completes before another begins, not which goes first. So `f(i++, i++)` genuinely produces different output on GCC and Clang — I have seen `1 0` from one and `0 1` from the other on the same file. Separately, modifying a variable twice in one expression, as in `j = j++ + 1`, is undefined behaviour. The safe rule is never to modify a variable and also read it elsewhere in the same expression.",
    },
  ],
  takeaways: [
    "`i++` yields the old value and `++i` the new one; prefer prefix so class types never copy needlessly",
    "`&&` and `||` short-circuit by guarantee, which is what makes a null check before a dereference safe",
    "`&` and `|` do not short-circuit, even on `bool` — a dropped character is a real crash",
    "Set with `|=`, clear with `&= ~`, toggle with `^=`, test with `&`, and do it all on unsigned types",
    "Bitwise operators bind more loosely than comparison: `a & b == 0` means `a & (b == 0)`",
    "`auto operator<=>(const T&) const = default;` generates all four ordering comparisons from one line",
    "Argument evaluation order is unspecified — GCC and Clang genuinely disagree on `f(i++, i++)`",
    "Never modify a variable and also read it elsewhere in the same expression",
  ],
  status: "available",
};
