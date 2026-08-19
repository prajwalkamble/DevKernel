import type { Lesson } from "@/content/types";

export const fundamentalTypesLesson: Lesson = {
  id: "cpp-fundamental-types",
  slug: "fundamental-types",
  moduleSlug: "foundations",
  title: "The Fundamental Types & Their Traps",
  summary:
    "Integers, floating-point numbers, characters and booleans: how big each one actually is, why that is not fixed by the standard, and the three traps — signed overflow, unsigned wraparound and floating-point equality — that produce real bugs.",
  estimatedMinutes: 35,
  objectives: [
    "Name the built-in types and measure their sizes on your own machine",
    "Explain why `int` has no guaranteed width, and when to use the fixed-width types",
    "Distinguish signed overflow (undefined) from unsigned wraparound (defined)",
    "Explain why `0.1 + 0.2 != 0.3` and compare floating-point values correctly",
    "Choose a sensible default type for a counter, an index and a measurement",
  ],
  sections: [
    {
      id: "the-types",
      heading: "What the language gives you",
      body: [
        "C++'s built-in types fall into four families, and the whole standard library is built on top of them.",
        "**Integers** — `short`, `int`, `long`, `long long`, each optionally `unsigned`. Whole numbers, exact, fixed width.",
        "**Floating point** — `float`, `double`, `long double`. Approximate real numbers, IEEE-754 on every machine you will realistically meet.",
        "**Characters** — `char`, plus `wchar_t`, `char8_t`, `char16_t` and `char32_t` for wider encodings. A `char` is one byte and doubles as the smallest integer type.",
        "**Boolean** — `bool`, holding exactly `true` or `false`. It occupies one byte, not one bit, because a byte is the smallest individually addressable unit of memory.",
        "There is also `void`, which is not a type you can have a variable of — it means \"nothing\" as a function's return type, and had a second life as `void*` before templates existed.",
      ],
      examples: [
        {
          id: "sizes",
          title: "Measuring them yourself",
          lang: "cpp",
          code: `#include <iostream>
#include <climits>
#include <cstdint>

int main() {
    std::cout << "char        " << sizeof(char)        << " byte(s)\\n";
    std::cout << "short       " << sizeof(short)       << '\\n';
    std::cout << "int         " << sizeof(int)         << '\\n';
    std::cout << "long        " << sizeof(long)        << '\\n';
    std::cout << "long long   " << sizeof(long long)   << '\\n';
    std::cout << "float       " << sizeof(float)       << '\\n';
    std::cout << "double      " << sizeof(double)      << '\\n';
    std::cout << "bool        " << sizeof(bool)        << '\\n';
    std::cout << "pointer     " << sizeof(void*)       << '\\n';
    std::cout << "\\nint range   " << INT_MIN << " .. " << INT_MAX << '\\n';
    std::cout << "int32_t     " << sizeof(std::int32_t) << " (always)\\n";
}`,
          output: `char        1 byte(s)
short       2
int         4
long        8
long long   8
float       4
double      8
bool        1
pointer     8

int range   -2147483648 .. 2147483647
int32_t     4 (always)`,
          explanation:
            "That is the output on 64-bit Linux with GCC. **Run it yourself — on 64-bit Windows with MSVC, `long` is 4 bytes, not 8.** `sizeof` yields the size in bytes as a `std::size_t`, and it is evaluated entirely at compile time.",
        },
      ],
    },
    {
      id: "no-fixed-sizes",
      heading: "Why the sizes are not fixed",
      body: [
        "This surprises people arriving from Java or Rust, where `int` is 32 bits everywhere by definition. The C++ standard only guarantees **minimum** widths and an ordering: `char` is at least 8 bits, `short` and `int` at least 16, `long` at least 32, `long long` at least 64, and each is at least as large as the one before.",
        "The reason is portability in the older, broader sense. C++ targets everything from 8-bit microcontrollers to 64-bit servers, and the intent was that `int` should be the processor's natural word size — whatever is fastest on the machine you are compiling for.",
        "The practical consequence is that `long` is 64-bit on Linux and macOS and 32-bit on Windows, which has caused an enormous amount of real-world breakage. **When the exact width matters — a file format, a network protocol, a hardware register — use the fixed-width types from `<cstdint>`.**",
        "The fixed-width family: `std::int8_t`, `int16_t`, `int32_t`, `int64_t` and their `uint` counterparts. These are exact or they do not exist on that platform, which is what you want. There is also `std::size_t` for sizes and indices, and `std::ptrdiff_t` for the signed difference between two pointers.",
      ],
      pitfalls: [
        {
          title: "`int` is still the right default for ordinary arithmetic",
          body: "Having just met the fixed-width types, it is tempting to write `std::int32_t` everywhere. Do not. For loop counters and ordinary arithmetic, plain `int` is idiomatic, it is at least as fast, and it reads better. Reach for the fixed-width types when the width is part of a contract with something outside your program — serialisation, a wire protocol, a memory-mapped device. Inside your own code, `int` for numbers and `std::size_t` for sizes covers almost everything.",
        },
      ],
    },
    {
      id: "overflow",
      heading: "Signed overflow is undefined; unsigned wraps",
      body: [
        "These two behave completely differently, and the difference is one of the most consequential facts in the language.",
        "**Unsigned overflow is defined: it wraps around**, modulo 2 to the power of the number of bits. `0u - 1` is not negative and it is not an error; it is the largest representable `unsigned int`. This is guaranteed by the standard and is occasionally useful — hash functions rely on it.",
        "**Signed overflow is undefined behaviour.** Not \"it wraps\", not \"it saturates\" — undefined. The compiler is entitled to assume it never happens, and it uses that assumption to optimise. A loop written `for (int i = 0; i >= 0; ++i)` can legally be compiled to an infinite loop, because the only way `i` becomes negative is via overflow, which the compiler assumes cannot occur.",
        "You will often observe wraparound anyway, because the underlying hardware wraps. That observation is a trap: the behaviour can change when you raise the optimisation level, and the bug then appears only in release builds.",
      ],
      examples: [
        {
          id: "wraparound",
          title: "Both kinds, plus the floating-point classic",
          lang: "cpp",
          code: `#include <iostream>
#include <limits>

int main() {
    int big = std::numeric_limits<int>::max();
    std::cout << "max int:  " << big << '\\n';

    unsigned int u = 0;
    u -= 1;                       // defined: wraps
    std::cout << "0u - 1:   " << u << '\\n';

    std::cout << std::boolalpha;
    std::cout << "0.1+0.2==0.3? " << (0.1 + 0.2 == 0.3) << '\\n';
    std::cout.precision(17);
    std::cout << "0.1+0.2 =     " << 0.1 + 0.2 << '\\n';
}`,
          output: `max int:  2147483647
0u - 1:   4294967295
0.1+0.2==0.3? false
0.1+0.2 =     0.30000000000000004`,
          explanation:
            "`std::boolalpha` makes streams print `true`/`false` rather than `1`/`0`, which is worth knowing purely for debugging output. `std::numeric_limits<T>` is the type-safe modern replacement for the `INT_MAX` macros, and it works for any arithmetic type including ones you did not write.",
        },
        {
          id: "signed-overflow-ub",
          title: "Catching signed overflow with a sanitizer",
          lang: "cpp",
          code: `#include <iostream>
#include <limits>

int main() {
    int x = std::numeric_limits<int>::max();
    std::cout << x + 1 << '\\n';   // signed overflow: undefined behaviour
}`,
          output: `$ g++ -std=c++20 -O0 ub.cpp -o ub && ./ub
-2147483648

$ g++ -std=c++20 -fsanitize=undefined ub.cpp -o ub && ./ub
ub.cpp:5:27: runtime error: signed integer overflow: 2147483647 + 1
              cannot be represented in type 'int'
-2147483648`,
          explanation:
            "The plain build printed the wrapped value and looked correct. **The undefined-behaviour sanitizer named the file, the line and the exact operation** — and it costs one flag. This is the pattern for the whole language: undefined behaviour frequently produces the answer you expected right up until the day it does not, and the tooling is what turns it back into an error message.",
        },
      ],
      pitfalls: [
        {
          title: "Mixing signed and unsigned converts the signed one",
          body: "When you compare or combine a signed and an unsigned integer of the same rank, **the signed value is converted to unsigned**. So `-1 < 1u` evaluates to `false`, because `-1` becomes 4294967295. This is why `for (int i = 0; i < v.size(); ++i)` is a warning — `size()` returns unsigned — and why the range-based `for` loop, or `std::ssize(v)` in C++20, is the better habit. `-Wextra` includes `-Wsign-compare`, which catches it.",
        },
      ],
    },
    {
      id: "conversions",
      heading: "Integer promotion and the comparison trap",
      body: [
        "Before almost any arithmetic, C++ applies **integral promotion**: types narrower than `int` — `char`, `short`, `bool` — are promoted to `int`. Then, if the two operands still differ, the **usual arithmetic conversions** bring them to a common type, and that is where signedness bites.",
        "This is inherited from C and it is why `'A' + 1` produces the integer 66 rather than the character `'B'`.",
      ],
      examples: [
        {
          id: "conversion-traps",
          title: "Three conversions worth internalising",
          lang: "cpp",
          code: `#include <iostream>

int main() {
    int a = -1;
    unsigned int b = 1;
    // a is converted to unsigned before the comparison.
    std::cout << std::boolalpha << (a < b) << '\\n';

    std::cout << 7 / 2 << ' ' << 7 % 2 << ' ' << 7.0 / 2 << '\\n';
    std::cout << -7 / 2 << ' ' << -7 % 2 << '\\n';

    char c = 'A';
    std::cout << c << ' ' << c + 1 << ' ' << char(c + 1) << '\\n';
}`,
          output: `false
3 1 3.5
-3 -1
A 66 B`,
          explanation:
            "**`-1 < 1u` is `false`** — the classic. **`7 / 2` is `3`**, because integer division truncates toward zero; you need at least one operand to be floating point to get `3.5`. **`-7 / 2` is `-3` and `-7 % 2` is `-1`** — C++ truncates toward zero rather than flooring, so the remainder takes the sign of the dividend (Python gives `-4` and `1` here). And `c + 1` promoted the `char` to `int`, printing 66; the cast brings it back.",
        },
      ],
    },
    {
      id: "floats",
      heading: "Floating point, and why equality does not work",
      body: [
        "`float` and `double` store numbers in binary scientific notation: a sign, a mantissa and an exponent. The consequence is that **any value that is not a sum of powers of two cannot be represented exactly**, in exactly the way that one third cannot be written exactly in decimal.",
        "`0.1` in binary is a repeating fraction. The stored value is the nearest representable `double`, which is very slightly more than a tenth. Add two such approximations and the tiny errors accumulate — which is why `0.1 + 0.2` produces `0.30000000000000004` and not `0.3`.",
        "**Never compare floating-point values with `==`.** Compare their difference against a tolerance. The naive version — a fixed epsilon like `1e-9` — is fine for values near 1, and wrong for values near a million, where the gap between adjacent representable doubles is already larger than that. The robust version scales the tolerance with the magnitude of the operands.",
        "`double` should be your default. `float` halves the memory and can be genuinely faster in bulk, but it carries only about 7 significant decimal digits against `double`'s 15, and that runs out faster than people expect.",
        "**Never use floating point for money.** Use an integer count of the smallest unit — cents, or hundredths of a cent — or a decimal library. This is not pedantry; it is one of the most common sources of real financial bugs.",
      ],
      examples: [
        {
          id: "float-compare",
          title: "Comparing correctly",
          lang: "cpp",
          code: `#include <cmath>
#include <iostream>
#include <algorithm>

bool nearly_equal(double a, double b, double relative = 1e-9) {
    double diff = std::fabs(a - b);
    if (diff <= relative) return true;                 // handles values near zero
    return diff <= relative * std::max(std::fabs(a), std::fabs(b));
}

int main() {
    std::cout << std::boolalpha;
    std::cout << (0.1 + 0.2 == 0.3) << '\\n';
    std::cout << nearly_equal(0.1 + 0.2, 0.3) << '\\n';

    double big_a = 1e16;
    double big_b = 1e16 + 1.0;              // too small a change to represent
    std::cout << (big_a == big_b) << '\\n';
}`,
          output: `false
true
true`,
          explanation:
            "The third line is the one that teaches the most. **Adding 1 to 10^16 changed nothing at all**, because at that magnitude the gap between neighbouring doubles is larger than 1. This is why a fixed epsilon fails: \"close enough\" has to be relative to how big the numbers are. The absolute check first is not redundant either — it is what makes the function behave sensibly when both values are near zero.",
        },
      ],
      pitfalls: [
        {
          title: "`float` runs out of precision earlier than you think",
          body: "A `float` has about 7 significant decimal digits. That means it cannot represent every integer past 16,777,216 — incrementing a `float` counter beyond that silently stops changing it. Timestamps in seconds, currency in pence, and IDs are all values that quietly exceed it. Use `double` unless you have measured a reason not to, and use an integer type when the value is genuinely an integer.",
        },
      ],
    },
    {
      id: "choosing",
      heading: "Choosing a type, in practice",
      body: [
        "A short set of defaults that will serve you well and are what most modern codebases converge on.",
        "**Whole numbers, ordinary arithmetic:** `int`. Loop counters, small counts, arithmetic. Move to `long long` or `std::int64_t` when the value can plausibly exceed about two billion.",
        "**Sizes and indices into containers:** `std::size_t`, because that is what `.size()` returns and mixing it with `int` produces the sign-comparison warning. Better still, avoid the index entirely with a range-based `for`.",
        "**Real numbers:** `double`. Use `float` only for large arrays where memory bandwidth is the bottleneck, or on hardware where it is genuinely faster.",
        "**Text:** `std::string`, never `char*`. A single character is a `char`.",
        "**True/false:** `bool`. Do not use `int` for flags, and do not compare against `true` — `if (ready)` rather than `if (ready == true)`.",
        "**A fixed-width value crossing a boundary:** `std::int32_t` and friends, for file formats, network protocols and hardware.",
        "One more habit, cheap and valuable: **do not use unsigned types merely because a value cannot be negative.** It is tempting — an age, a count — but it buys you nothing and hands you wraparound at zero, where subtraction of one produces four billion instead of minus one. The standard library uses unsigned for sizes and many people consider that a historical mistake; Google's style guide and Bjarne Stroustrup himself both recommend signed integers for arithmetic. Use unsigned when you want the modular arithmetic or you are manipulating bits.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How big is an `int` in C++?",
      answer:
        "The standard does not say. It guarantees minimum widths — `char` at least 8 bits, `short` and `int` at least 16, `long` at least 32, `long long` at least 64 — and that each is at least as wide as the previous. In practice `int` is 32 bits nearly everywhere, but `long` is 64-bit on Linux and macOS and 32-bit on 64-bit Windows, which has caused a lot of real portability bugs. When the width is part of a contract — file formats, network protocols, hardware registers — use the fixed-width types in `<cstdint>`.",
    },
    {
      question: "What is the difference between signed and unsigned overflow?",
      answer:
        "Unsigned overflow is well defined: it wraps modulo 2^N, so `0u - 1` is the maximum unsigned value. Signed overflow is undefined behaviour, and the compiler optimises on the assumption it cannot happen — which is why `for (int i = 0; i >= 0; ++i)` can legally become an infinite loop. You will often observe wrapping anyway because the hardware wraps, but that behaviour can change with optimisation level, so it is exactly the kind of bug that only appears in release builds. `-fsanitize=undefined` reports it with a file and line.",
    },
    {
      question: "Why is `0.1 + 0.2 == 0.3` false, and how should you compare floating-point numbers?",
      answer:
        "Doubles are binary scientific notation, so any value that is not a sum of powers of two is stored as the nearest representable approximation. `0.1` and `0.2` are both slightly off, and the errors accumulate — the sum is `0.30000000000000004`. Compare with a tolerance instead, and make it relative to the magnitude of the operands rather than a fixed epsilon, because near 10^16 the gap between adjacent doubles already exceeds 1. A good implementation does an absolute check first so it still behaves sensibly near zero.",
    },
    {
      question: "Why does `-1 < 1u` evaluate to false?",
      answer:
        "Because of the usual arithmetic conversions. When a signed and an unsigned operand of the same rank meet, the signed one is converted to unsigned, so `-1` becomes 4294967295 and the comparison is false. This is the mechanism behind the common warning on `for (int i = 0; i < v.size(); ++i)`, since `size()` returns an unsigned `std::size_t`. Fix it with a range-based `for`, `std::size_t` for the index, or `std::ssize(v)` in C++20 — and keep `-Wextra` on, which enables `-Wsign-compare`.",
    },
    {
      question: "Should you use unsigned types for values that cannot be negative?",
      answer:
        "Generally no. It sounds like documentation but it buys no checking — nothing stops you assigning a negative value, it just wraps — and it introduces a cliff at zero where subtracting one yields a huge positive number rather than a negative one. It also drags in the signed/unsigned comparison problem wherever the value meets ordinary arithmetic. Use unsigned when you want modular arithmetic or are doing bit manipulation. The standard library's use of unsigned for sizes is widely regarded as a historical mistake.",
    },
  ],
  takeaways: [
    "The standard fixes only minimum widths, not exact ones; `long` is 64-bit on Linux and 32-bit on Windows",
    "Use `<cstdint>` fixed-width types where the width is a contract, and plain `int` for ordinary arithmetic",
    "Unsigned overflow wraps and is defined; signed overflow is undefined and the optimiser assumes it cannot happen",
    "Mixing signed and unsigned converts the signed operand, which is why `-1 < 1u` is false",
    "Integer division truncates toward zero: `7 / 2` is 3, and `-7 % 2` is -1",
    "Never compare floats with `==`; use a tolerance that scales with magnitude, with an absolute check for values near zero",
    "Default to `double` for real numbers, `int` for arithmetic, `std::size_t` for sizes, and never floating point for money",
  ],
  status: "available",
};
