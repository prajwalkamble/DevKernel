import type { Lesson } from "@/content/types";

export const overloadingLesson: Lesson = {
  id: "cpp-overloading",
  slug: "overloading-and-defaults",
  moduleSlug: "control-flow-functions",
  title: "Overloading, Default Arguments & inline",
  summary:
    "Several functions with one name: how the compiler picks, what makes a call ambiguous, why default arguments belong in the declaration only, and what `inline` actually means (it is not about inlining).",
  estimatedMinutes: 30,
  objectives: [
    "Write overloaded functions and predict which one a call selects",
    "Explain why the return type does not participate in overload resolution",
    "Diagnose an ambiguous call from the compiler's candidate list",
    "Place default arguments correctly and know when they beat an overload",
    "Explain what `inline` really means and why it is required in headers",
  ],
  sections: [
    {
      id: "overloading",
      heading: "Several functions, one name",
      body: [
        "C++ allows multiple functions with the same name as long as their **parameter lists differ**. The compiler picks based on the argument types at the call site — a process called *overload resolution*.",
        "This is the mechanism behind a lot of the standard library's ergonomics: `std::max` works on any comparable type, `std::to_string` accepts every numeric type, and `<<` prints whatever you give it, all because of overloading.",
        "**The return type is not part of the signature for this purpose.** Two functions differing only in return type are a compile error, not an overload set. The reason is that C++ lets you discard a return value — given `int f(); double f();`, the statement `f();` would be genuinely undecidable.",
        "Overloads should do the *same thing* to different types. `print(int)` and `print(std::string)` are good overloads. `process(int)` that saves to disk and `process(std::string)` that sends an email are a trap, because a call site reads identically in both cases.",
      ],
      examples: [
        {
          id: "overload-basics",
          title: "Overloads and default arguments together",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

void print(int n)                { std::cout << "int: " << n << '\\n'; }
void print(double d)             { std::cout << "double: " << d << '\\n'; }
void print(const std::string& s) { std::cout << "string: " << s << '\\n'; }

// Default arguments: only on the declaration, and only trailing ones.
double area(double width, double height = 1.0, double scale = 1.0) {
    return width * height * scale;
}

int main() {
    print(42);
    print(3.14);
    print(std::string{"hi"});
    std::cout << area(3) << ' ' << area(3, 4) << ' ' << area(3, 4, 2) << '\\n';
}`,
          output: `int: 42
double: 3.14
string: hi
3 12 24`,
          explanation:
            "`area(3)` uses both defaults, `area(3, 4)` uses one, `area(3, 4, 2)` uses none — three call shapes from one function. Note that `print(\"hi\")` also selects the `std::string` overload here, because a `const char*` cannot convert to `int` or `double` at all, so the user-defined conversion to `std::string` is the only candidate. That is the *safe* configuration; the next example shows the one that is not.",
        },
        {
          id: "bool-trap",
          title: "The string-literal trap: a bool overload steals the call",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

void show(bool b)               { std::cout << "bool: " << b << '\\n'; }
void show(const std::string& s) { std::cout << "string: " << s << '\\n'; }

int main() { show("hi"); }`,
          output: `bool: 1`,
          explanation:
            "**It printed `bool: 1`.** A string literal is a `const char*`, and `const char*` to `bool` is a *standard* conversion (any non-null pointer is `true`), which outranks the *user-defined* conversion to `std::string`. No warning, no error — the call silently goes to the wrong overload. This is a genuine, well-known trap, and it is why APIs that have a `bool` overload alongside a string one add an explicit `const char*` overload that forwards to the string version.",
        },
      ],
    },
    {
      id: "resolution",
      heading: "How the compiler chooses",
      body: [
        "Overload resolution runs in three stages, and knowing the shape of it is enough to predict almost every outcome.",
        "**1. Find the candidates.** Every function with that name visible at the call site.",
        "**2. Discard the ones that cannot work.** Wrong number of arguments, or an argument with no conversion to the parameter type.",
        "**3. Rank the survivors** by how good the conversion for each argument is, and pick the best. If two tie, the call is **ambiguous** and it is a compile error.",
        "The ranking, best to worst: **exact match** (including adding `const`), then **promotion** (`char` to `int`, `float` to `double`), then **standard conversion** (`int` to `double`, anything to `bool`, a derived class pointer to a base one), then **user-defined conversion** (a converting constructor or conversion operator), and last **ellipsis** (`...`).",
        "A key consequence: **all standard conversions are equally ranked.** `long` to `int` and `long` to `double` are both \"standard conversion\", so a call with a `long` argument against `f(int)` and `f(double)` overloads is ambiguous, not a preference for the integer one.",
      ],
      examples: [
        {
          id: "ambiguous",
          title: "An ambiguous call, and the candidate list",
          lang: "cpp",
          code: `#include <iostream>

void f(int)    { std::cout << "int\\n"; }
void f(double) { std::cout << "double\\n"; }

int main() {
    f(5.0f);       // float: promotes to double, unambiguous
    f('a');        // char: promotes to int
    long x = 7;
    f(x);          // long -> int or double? ambiguous
}`,
          output: `error: call of overloaded 'f(long int&)' is ambiguous
    8 |     f(x);          // long -> int or double? ambiguous
      |     ~^~~
note: candidate: 'void f(int)'
note: candidate: 'void f(double)'`,
          explanation:
            "The first two calls resolve cleanly because *promotion* outranks *conversion*: `float` promotes to `double`, `char` promotes to `int`. The third has only conversions available on both sides, they rank equally, and the compiler refuses to guess. **The `note: candidate:` lines are how you read any overload error** — they list exactly what was considered. The fix is an explicit cast, or an overload taking `long`.",
        },
        {
          id: "value-vs-ref",
          title: "Value and const-reference overloads are always ambiguous",
          lang: "cpp",
          code: `#include <iostream>

void g(int n)        { std::cout << "value " << n << '\\n'; }
void g(const int& n) { std::cout << "ref " << n << '\\n'; }

int main() { g(5); }`,
          output: `error: call of overloaded 'g(int)' is ambiguous
note: candidate: 'void g(int)'
note: candidate: 'void g(const int&)'`,
          explanation:
            "Both are an exact match — binding a reference is not a conversion — so nothing distinguishes them and **every** call is ambiguous. This is worth knowing because it means you cannot overload on \"by value versus by const reference\"; pick one. (Overloading on `T&` versus `const T&` *is* legal and useful, since the constness of the argument decides.)",
        },
      ],
      pitfalls: [
        {
          title: "A derived-class member function hides all base overloads with that name",
          body: "If a base class has `f(int)` and `f(double)` and a derived class declares `f(std::string)`, then calling `d.f(42)` fails — the derived declaration hides the entire base overload set rather than adding to it. This is *name hiding*, and it surprises everyone once. The fix is `using Base::f;` in the derived class, which pulls the base overloads into the same scope. Module 6 covers it alongside inheritance.",
        },
      ],
    },
    {
      id: "default-arguments",
      heading: "Default arguments",
      body: [
        "A default argument lets a caller omit a trailing parameter. Two rules govern where they go, and both cause real errors.",
        "**Defaults must be trailing.** Once a parameter has a default, every parameter after it must too — otherwise a call could not tell which argument it was supplying.",
        "**Specify a default exactly once, in the declaration the caller sees.** If a function is declared in a header and defined in a `.cpp`, the default belongs in the header. Repeating it in the definition is an error, and putting it only in the definition means callers in other files never see it.",
        "**When to prefer a default over an overload:** when the behaviour is genuinely the same and only a value differs. **When to prefer an overload:** when the bodies would differ, or when the defaulted parameter would need to be computed.",
        "One sharp edge: **default arguments are evaluated at the call site, and they are not polymorphic.** A default argument on a `virtual` function is taken from the *static* type of the pointer you called through, while the function body comes from the dynamic type — so an overriding function with a different default produces a genuinely confusing mismatch. Do not put default arguments on virtual functions.",
      ],
      examples: [
        {
          id: "default-placement",
          title: "Where a default argument goes",
          lang: "cpp",
          code: `// --- log.h ---
#pragma once
#include <string>

enum class Level { Info, Warning, Error };

// The default lives HERE, where callers can see it.
void log(const std::string& message, Level level = Level::Info);

// --- log.cpp ---
#include "log.h"
#include <iostream>

// No default here — repeating it is a compile error.
void log(const std::string& message, Level level) {
    const char* prefix = level == Level::Error   ? "ERROR"
                       : level == Level::Warning ? "WARN"
                                                 : "INFO";
    std::cout << '[' << prefix << "] " << message << '\\n';
}

// --- main.cpp ---
#include "log.h"

int main() {
    log("starting up");                  // uses the default
    log("disk almost full", Level::Warning);
}`,
          output: `[INFO] starting up
[WARN] disk almost full`,
          explanation:
            "If the default were written in `log.cpp` instead, `main.cpp` would fail to compile — it only ever sees the header. And writing it in both places is the error `default argument given for parameter 2`. The rule is simple once stated: **the default belongs where the caller looks.**",
        },
      ],
    },
    {
      id: "inline",
      heading: "inline does not mean inline",
      body: [
        "This keyword's name is one of the language's more unfortunate accidents.",
        "**`inline` does not ask the compiler to inline anything.** It once was a hint, and compilers stopped listening decades ago — they decide based on function size, call frequency and optimisation level, and they inline plenty of functions never marked `inline` while ignoring the marker on large ones.",
        "**What `inline` actually means is: this function may be defined in more than one translation unit, and the linker should keep one copy.** It is an exemption from the one-definition rule.",
        "That is why it matters for headers. A header is textually pasted into every `.cpp` that includes it, so a function *defined* in a header appears in every one of those translation units. Without `inline`, the linker sees several definitions of the same symbol and reports `multiple definition of ...`. With it, the duplicates are expected and collapsed.",
        "Practical consequences: **functions defined inside a class body are implicitly `inline`**, which is why headers full of small member functions work. `constexpr` functions are implicitly `inline` too. And since C++17, `inline` applies to variables as well, which is how you put a global constant in a header without a `.cpp` file.",
      ],
      examples: [
        {
          id: "inline-odr",
          title: "The linker error inline exists to prevent",
          lang: "cpp",
          code: `// --- bad.h ---
#pragma once
double twice(double x) { return x * 2; }   // NOT inline: defined in every TU

// --- a.cpp ---
#include "bad.h"
double use_a() { return twice(1.0); }

// --- b.cpp ---
#include "bad.h"
int main() { return 0; }`,
          output: `$ g++ -std=c++20 a.cpp b.cpp -o app
/usr/bin/ld: b.cpp:(.text+0x0): multiple definition of 'twice(double)';
             a.cpp:(.text+0x0): first defined here
collect2: error: ld returned 1 exit status`,
          explanation:
            "Two translation units, two definitions of the same symbol, and the linker refuses. **Adding `inline` to the definition fixes it entirely** — nothing about the generated code changes, only the linker's willingness to accept duplicates. Note that `#pragma once` did not help: it prevents the header being included twice *in one* translation unit, not across several.",
        },
      ],
      pitfalls: [
        {
          title: "`inline` in a header is a promise the definitions are identical",
          body: "The one-definition rule says the multiple definitions must be *token-for-token identical*. If two translation units see different versions — because a macro was defined differently before the include, or two headers with the same guard name collided — the linker picks one arbitrarily and the program silently misbehaves. This is one of the nastiest bug classes in C++ because there is no diagnostic. It is a substantial part of why C++20 modules exist.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does the compiler choose between overloads?",
      answer:
        "It gathers every function with that name visible at the call site, discards those that cannot accept the arguments, then ranks the rest by conversion quality per argument and picks the best. The ranking is exact match, then promotion, then standard conversion, then user-defined conversion, then ellipsis. If two candidates tie the call is ambiguous and it fails to compile. Because all standard conversions rank equally, a `long` argument against `f(int)` and `f(double)` overloads is ambiguous rather than preferring the integer one.",
    },
    {
      question: "Why can't you overload on return type alone?",
      answer:
        "Because C++ allows a return value to be discarded, so a statement like `f();` would have no way to select between `int f()` and `double f()`. The return type is not part of the signature for overload resolution, and declaring two functions that differ only in it is a compile error — a redeclaration with a conflicting type. The same reasoning is why you can overload on `const` for member functions, since that is part of the implicit `this` parameter.",
    },
    {
      question: "What does `inline` actually do?",
      answer:
        "It exempts a function from the one-definition rule: the function may be defined in multiple translation units and the linker keeps a single copy. It has essentially nothing to do with inlining calls, which compilers decide themselves based on size and optimisation level regardless of the keyword. It matters for headers, because a function defined in a header appears in every translation unit that includes it, and without `inline` the linker reports `multiple definition`. Functions defined inside a class body and `constexpr` functions are implicitly `inline`, and since C++17 variables can be too.",
    },
    {
      question: "Where should a default argument be written, and why?",
      answer:
        "In the declaration the caller sees — the header — and exactly once. Repeating it in the definition is a compile error, and writing it only in the `.cpp` means callers in other translation units never see the default and cannot omit the argument. Defaults must also be trailing: once one parameter has a default, all later ones must too. And they should not appear on virtual functions, because the default is taken from the static type while the body comes from the dynamic type, which produces a genuinely confusing mismatch.",
    },
    {
      question: "What is name hiding?",
      answer:
        "When a derived class declares a function with the same name as one in the base, it hides the entire base overload set rather than adding to it. So if `Base` has `f(int)` and `f(double)` and `Derived` declares `f(std::string)`, then `d.f(42)` fails to compile — the base overloads are no longer visible through the derived type. The fix is a `using Base::f;` declaration in the derived class, which brings them into the same scope so overload resolution considers them all.",
    },
  ],
  takeaways: [
    "Overloads must differ in parameters; the return type does not participate, because a call can discard it",
    "Resolution ranks exact match, then promotion, then standard conversion, then user-defined, then ellipsis",
    "All standard conversions rank equally — `long` against `f(int)`/`f(double)` overloads is ambiguous",
    "`f(int)` and `f(const int&)` cannot be overloaded: every call is ambiguous",
    "Read the `note: candidate:` lines to diagnose any overload error",
    "Default arguments must be trailing and belong in the declaration the caller sees, exactly once",
    "Never put a default argument on a virtual function — it comes from the static type while the body comes from the dynamic one",
    "`inline` means \"may be defined in several translation units\", not \"please inline this\"",
  ],
  status: "available",
};
