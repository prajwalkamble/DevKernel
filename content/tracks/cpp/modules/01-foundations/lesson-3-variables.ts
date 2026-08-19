import type { Lesson } from "@/content/types";

export const variablesLesson: Lesson = {
  id: "cpp-variables",
  slug: "declaring-variables",
  moduleSlug: "foundations",
  title: "Declaring Variables: Initialisation, const & auto",
  summary:
    "How to declare a variable in C++, why the language gives you four different ways to initialise one, which to use, and the two rules — always initialise, prefer const — that prevent most of the bugs a beginner writes.",
  estimatedMinutes: 35,
  objectives: [
    "Declare variables with explicit types and with `auto`",
    "Distinguish copy-, direct- and list-initialisation, and choose deliberately",
    "Explain why an uninitialised read is undefined behaviour rather than a zero",
    "Use `const` by default, and know when `constexpr` is the stronger claim",
    "Recognise narrowing conversions and the most vexing parse",
    "Understand scope, shadowing and when a variable's storage is released",
  ],
  sections: [
    {
      id: "declaring",
      heading: "The shape of a declaration",
      body: [
        "A C++ declaration reads **type first, then name, then an initialiser**: `int answer = 42;`. Unlike Rust's `let` or JavaScript's `const`, there is no introducing keyword — the type *is* the announcement that you are declaring something.",
        "Every variable has a type fixed at compile time, and that type never changes. This is the single largest difference from Python or JavaScript, and it goes deeper than type-checking: the type determines **how many bytes are reserved and how those bytes are interpreted**. An `int` is four bytes read as a two's-complement integer; a `float` is four bytes read as an IEEE-754 number. The variable is a name for a piece of storage, and the type is the lens you look at that storage through.",
        "You may declare several variables in one statement, though it is a habit worth avoiding once pointers arrive in module 3 — the syntax there does not mean what most people expect.",
      ],
      examples: [
        {
          id: "declare-forms",
          title: "Declaring, several ways",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

int main() {
    int answer = 42;                 // copy-initialisation
    int height{180};                 // brace (list) initialisation
    int width(90);                   // direct-initialisation
    auto ratio = 0.75;               // deduced: double
    const int max_users = 100'000;   // cannot be reassigned
    std::string name{"Ada"};

    int uninitialised;               // NOT zero — reading it is undefined
    int zeroed{};                    // braces with nothing: value-initialised to 0

    std::cout << answer << ' ' << height << ' ' << width << ' '
              << ratio << ' ' << max_users << ' ' << name << ' '
              << zeroed << '\\n';
    (void)uninitialised;
}`,
          output: `42 180 90 0.75 100000 Ada 0`,
          explanation:
            "Two details worth noticing. `100'000` uses a **digit separator** — a single quote, legal anywhere inside a numeric literal since C++14, ignored entirely by the compiler and purely for your eyes. And `int zeroed{}` — empty braces — is *value-initialisation*, which for a built-in type means zero. That is the shortest correct way to get a zeroed variable, and it works uniformly for types that are not built in.",
        },
      ],
    },
    {
      id: "initialisation",
      heading: "Four ways to initialise, and which to use",
      body: [
        "C++ genuinely has several initialisation syntaxes, which is a historical accident nobody defends. What matters is that **they are not equivalent**, and one of them is safer than the others.",
        "**Copy-initialisation** — `int x = 5;`. The familiar form, inherited from C. Permits implicit conversions, including ones that lose data.",
        "**Direct-initialisation** — `int x(5);`. Calls a constructor directly. Also permits lossy conversions, and has a parsing trap covered below.",
        "**List-initialisation** — `int x{5};`. Introduced in C++11 and the one to prefer. It works uniformly across built-in types, class types and containers, and — the important part — **it refuses narrowing conversions**, turning a silent data loss into a compile error.",
        "**Value-initialisation** — `int x{};`. Empty braces. Zero for built-in types, the default constructor for class types. Use it whenever you have no meaningful starting value.",
        "The practical rule: **use braces unless you have a specific reason not to.** The one reason you will actually hit is `std::vector`, where braces and parentheses mean genuinely different things — `std::vector<int> v(5, 0)` is five zeros, `std::vector<int> v{5, 0}` is the two elements 5 and 0. That is a real wart, and worth remembering rather than fearing.",
      ],
      examples: [
        {
          id: "narrowing",
          title: "Braces catch what `=` lets through",
          lang: "cpp",
          code: `int main() {
    int narrowed = 3.9;    // silently truncates
    int caught{3.9};       // braces refuse
}`,
          output: `error: narrowing conversion of '3.8999999999999999e+0' from 'double' to 'int' [-Wnarrowing]
    4 |     int caught{3.9};       // braces refuse
      |                ^~~`,
          explanation:
            "The first line compiles without a murmur and stores `3`. In arithmetic code, that is exactly the sort of quietly-wrong behaviour that produces a bug report six months later. The second line will not build. **This is the single best argument for making braces your default** — you get the same code with one class of silent error removed.",
        },
      ],
      pitfalls: [
        {
          title: "The most vexing parse: `Timer t();` declares a function",
          body: "When you write `Timer t();` intending to default-construct a `Timer`, C++ reads it as a *declaration of a function* named `t` taking no arguments and returning `Timer`. The rule is that anything that can be parsed as a declaration will be. The constructor never runs, and the confusing symptom is that your object appears to do nothing. `Timer t{};` and `Timer t;` both do what you meant. GCC and Clang warn about it under `-Wall` — the lint is literally called `-Wvexing-parse` — which is one more reason to keep warnings on.",
        },
      ],
    },
    {
      id: "vexing",
      heading: "The most vexing parse, seen running",
      body: [
        "This one is worth watching happen, because the symptom is silence rather than an error.",
      ],
      examples: [
        {
          id: "vexing-parse",
          title: "One of these two lines constructs an object",
          lang: "cpp",
          code: `#include <iostream>

struct Timer {
    Timer() { std::cout << "Timer constructed\\n"; }
};

int main() {
    Timer t();     // declares a FUNCTION named t returning Timer
    Timer u{};     // constructs an object
    std::cout << "end of main\\n";
}`,
          output: `warning: empty parentheses were disambiguated as a function declaration [-Wvexing-parse]
    8 |     Timer t();     // declares a FUNCTION named t returning Timer
      |            ^~
note: or replace parentheses with braces to value-initialize a variable

Timer constructed
end of main`,
          explanation:
            "**\"Timer constructed\" prints once, not twice.** The `t` line built nothing at all — it declared a function that is never defined and never called. Note also that the compiler tells you exactly how to fix it, which is typical of modern GCC and Clang diagnostics and a habit worth developing: read past the error text to the notes underneath.",
        },
      ],
    },
    {
      id: "uninitialised",
      heading: "Uninitialised does not mean zero",
      body: [
        "This is the first genuinely dangerous thing in the language, and it follows directly from the zero-overhead principle in lesson 1. **A local variable with no initialiser has an indeterminate value.** The compiler does not zero it, because zeroing costs cycles and you might be about to overwrite it anyway.",
        "Reading it is **undefined behaviour** — not \"you get a random number\", but \"the standard places no constraints on what your program does\". In practice you get whatever bytes were left on the stack by whatever ran before. That might be zero. It might be part of a pointer from the last function call. It will very likely differ between a debug build and a release build, which is how you end up with a bug that vanishes when you try to investigate it.",
        "**The rule is simple and absolute: initialise every variable at the point you declare it.** If you have no meaningful value, use `{}`. There is no cost to this in optimised code when the value is genuinely overwritten — the compiler removes the redundant store.",
      ],
      examples: [
        {
          id: "uninit",
          title: "Why this bug is so hard to catch",
          lang: "cpp",
          code: `#include <iostream>

int main() {
    int x;                    // no initialiser
    std::cout << x << '\\n';   // reading it is undefined behaviour
}`,
          output: `warning: 'x' is used uninitialized [-Wuninitialized]
    4 |     std::cout << x << '\\n';
      |                       ^~~~
note: 'x' was declared here

0`,
          explanation:
            "**It printed `0`.** That is the trap in one line: this run looked completely fine. Change the optimisation level, add a function call before it, or run it on a different machine, and it prints something else. A test suite will not catch this reliably; the compiler warning and the sanitizer will. This is why `-Wall` is not optional — the diagnostic above is the only thing standing between you and a bug that reproduces once a week in production.",
        },
      ],
      pitfalls: [
        {
          title: "The warning is not guaranteed",
          body: "`-Wuninitialized` relies on the optimiser's flow analysis, and it misses cases — particularly when the variable is passed to another function, or initialised on some paths but not others. GCC often needs `-O1` or higher to see it at all. Do not treat a clean build as proof; treat *initialising everything* as the guarantee, and use `-fsanitize=memory` (Clang) or Valgrind when you need to hunt one down.",
        },
      ],
    },
    {
      id: "const",
      heading: "const by default",
      body: [
        "`const` marks a variable as unmodifiable after initialisation. Attempting to assign to it is a compile error, not a runtime one.",
        "The advice from essentially every experienced C++ programmer is the same: **make everything `const` that can be `const`**, and remove it only when you need to mutate. Three reasons, in increasing order of importance.",
        "**It documents intent.** A reader who sees `const` knows this value will not change without reading the next forty lines to check.",
        "**It prevents a real class of bug.** Accidental assignment — `=` where you meant `==`, or modifying a loop bound inside the loop — stops compiling.",
        "**It is required for correctness elsewhere.** `const` propagates: a `const` object can only have its `const` member functions called, and a function taking `const Widget&` promises not to modify what you passed. Module 3 covers *const correctness* as a discipline, and it only works if you start applying `const` from the beginning. Retrofitting it onto a large codebase is genuinely painful.",
      ],
      examples: [
        {
          id: "const-error",
          title: "The error, and it is a good error",
          lang: "cpp",
          code: `int main() {
    const int limit = 10;
    limit = 20;
}`,
          output: `error: assignment of read-only variable 'limit'
    3 |     limit = 20;
      |     ~~~~~~^~~~`,
          explanation:
            "A `const` variable must be initialised at its declaration, since there will be no later opportunity. That constraint is a feature: it means every `const` in your code is a value that was correct from the moment it existed.",
        },
      ],
    },
    {
      id: "constexpr",
      heading: "constexpr: known at compile time",
      body: [
        "`const` says *this will not change*. `constexpr` says something stronger: **this value is computable at compile time**, and the compiler will verify it.",
        "The difference matters because some places in C++ require a compile-time constant and will not accept a merely-`const` value — the size of a fixed array, a template argument, a `static_assert`.",
        "`constexpr` also applies to functions. A `constexpr` function *may* run at compile time when its arguments are known then, and runs normally otherwise. This lets you push real computation out of runtime entirely — a lookup table can be built by the compiler and end up as constant data in the binary.",
        "The rule of thumb: **`constexpr` for values genuinely fixed when you write the code** — buffer sizes, physical constants, configuration limits. **`const` for values fixed once the program computes them** — a command-line argument, a file size, a timestamp.",
      ],
      examples: [
        {
          id: "constexpr-use",
          title: "Where a compile-time constant is required",
          lang: "cpp",
          code: `#include <iostream>
#include <array>

constexpr int buffer_size = 256;      // known at compile time
const int runtime_limit = 100;        // const, but not necessarily compile-time

constexpr int square(int n) { return n * n; }

int main() {
    std::array<int, buffer_size> buf{};        // needs a compile-time value
    std::array<int, square(4)> small{};        // constexpr function, called at compile time
    static_assert(square(4) == 16);            // checked by the compiler, not at runtime

    std::cout << buf.size() << ' ' << small.size() << ' ' << runtime_limit << '\\n';
}`,
          output: `256 16 100`,
          explanation:
            "`square(4)` was evaluated by the compiler; there is no multiplication in the generated program. `static_assert` is checked entirely at compile time — if the condition were false the build would fail, and it costs nothing at runtime because there is no runtime component to it at all.",
        },
        {
          id: "const-not-constexpr",
          title: "Why `const` is not enough here",
          lang: "cpp",
          code: `#include <array>

int limit() { return 10; }

int main() {
    const int n = limit();      // const, but its value needs the program to run
    std::array<int, n> a{};
}`,
          output: `error: the value of 'n' is not usable in a constant expression
    5 |     std::array<int, n> a{};
      |                     ^
note: 'n' was not initialized with a constant expression`,
          explanation:
            "`n` will never change, so `const` is accurate — but the compiler cannot know its value without running `limit()`, and array sizes are baked into the type. Marking `limit()` as `constexpr` would fix this, because it would then be callable at compile time. The distinction is exactly \"cannot change\" against \"already known\".",
        },
      ],
    },
    {
      id: "auto",
      heading: "auto: letting the compiler write the type",
      body: [
        "`auto` asks the compiler to deduce the type from the initialiser. The variable is still statically typed — you simply have not written the type down. It is not `var` from a dynamic language, and nothing about it is decided at runtime.",
        "Use it when the type is obvious from the right-hand side, when the type is long and noisy (iterators, lambdas), or when the type is genuinely unnameable — a lambda's type has no name you can write.",
        "Write the type explicitly when it is the point of the line: when you are choosing a specific width, when the deduced type would surprise a reader, or when you want the compiler to enforce a conversion.",
      ],
      examples: [
        {
          id: "auto-deduction",
          title: "What auto actually deduces",
          lang: "cpp",
          code: `#include <iostream>
#include <vector>
#include <string>

int main() {
    auto count = 5;                // int
    auto rate = 5.0;               // double
    auto letter = 'x';             // char
    auto text = "hi";              // const char*, NOT std::string
    auto name = std::string{"hi"}; // std::string
    std::vector<int> v{1, 2, 3};
    auto n = v.size();             // std::size_t, not int

    std::cout << sizeof(count) << ' ' << sizeof(rate) << ' '
              << sizeof(letter) << ' ' << sizeof(text) << ' '
              << name.size() << ' ' << n << '\\n';
}`,
          output: `4 8 1 8 2 3`,
          explanation:
            "The two that catch people: `auto text = \"hi\"` gives you a `const char*`, a pointer to characters — **not** a `std::string`. And `v.size()` returns `std::size_t`, an *unsigned* 64-bit integer, which is why `sizeof` reports 8 for `n`. That unsignedness is the source of a genuine bug covered in the next lesson: a loop written `for (int i = 0; i < v.size(); ++i)` compares signed against unsigned, which `-Wextra` will warn about and which behaves surprisingly at the boundaries.",
        },
      ],
      pitfalls: [
        {
          title: "`auto` drops references and `const` unless you ask for them",
          body: "`auto x = some_vector[0];` makes a **copy**, even though `operator[]` returned a reference. For a large object in a loop that is a silent performance problem, and if you then modify `x` you are modifying the copy, not the container. `auto&` keeps the reference, and `const auto&` keeps it read-only. The habit worth building: in a range-based `for` over anything bigger than a machine word, write `const auto&` unless you specifically need a copy.",
        },
      ],
    },
    {
      id: "scope",
      heading: "Scope, lifetime and shadowing",
      body: [
        "A variable declared inside a `{ }` block exists from its declaration to the closing brace, and then it is gone — its storage is released and, for class types, its destructor runs at that exact moment. That determinism is the foundation of RAII in module 4.",
        "**Declare variables as late as you can and in the smallest scope that works.** In C you often declared everything at the top of a function; in C++ that is actively worse, because it separates a variable from its meaningful value and widens the window in which it can be misused.",
        "A variable in an inner scope may reuse an outer name; the inner one **shadows** the outer for the rest of that block. This is legal and occasionally useful, but it is far more often a mistake — you meant to assign to the outer variable and accidentally declared a new one. `-Wshadow` (not included in `-Wall` or `-Wextra`) warns about it, and many projects turn it on deliberately.",
      ],
      examples: [
        {
          id: "scope-example",
          title: "Scope, and what shadowing costs you",
          lang: "cpp",
          code: `#include <iostream>

int main() {
    int total = 0;

    {
        int total = 10;         // shadows the outer one
        total += 5;             // modifies the INNER total
        std::cout << "inner: " << total << '\\n';
    }                           // inner total's storage is released here

    std::cout << "outer: " << total << '\\n';

    // Prefer this: declare inside the loop, in the smallest useful scope.
    for (int i = 0; i < 3; ++i) {
        int doubled = i * 2;
        total += doubled;
    }
    // \`i\` and \`doubled\` do not exist here.

    std::cout << "total: " << total << '\\n';
}`,
          output: `inner: 15
outer: 0
total: 6`,
          explanation:
            "The outer `total` is untouched by the block — this is exactly the bug `-Wshadow` exists to catch, and in a longer function it is genuinely hard to spot by eye. Note that `i` and `doubled` cease to exist at the loop's closing brace, which is what makes it safe to reuse those names later.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between `int x = 5;`, `int x(5);` and `int x{5};`?",
      answer:
        "They are copy-, direct- and list-initialisation. The practically important difference is that list-initialisation with braces **refuses narrowing conversions** — `int x{3.9}` is a compile error while `int x = 3.9` silently stores 3. Braces also work uniformly across built-in types, class types and containers, which is why they are the recommended default. The exception to remember is `std::vector`, where `v(5, 0)` means five zeros and `v{5, 0}` means the two elements 5 and 0.",
    },
    {
      question: "What happens if you read an uninitialised local variable?",
      answer:
        "It is undefined behaviour. The variable holds whatever bytes were already on the stack, so it is not merely \"a random number\" — the compiler is entitled to assume it never happens and optimise accordingly. In practice the value often differs between debug and release builds, which makes these bugs intermittent and very hard to reproduce. `-Wuninitialized` catches many cases but not all, particularly across function boundaries, so the reliable answer is to initialise every variable at its declaration, using `{}` when there is no meaningful value.",
    },
    {
      question: "What is the difference between `const` and `constexpr`?",
      answer:
        "`const` means the value cannot be modified after initialisation; the value may still be computed at runtime. `constexpr` means the value is computable at compile time, and the compiler verifies it. That matters because array sizes, template arguments and `static_assert` require a genuine compile-time constant — a `const int n = some_function();` will not work there. `constexpr` also applies to functions, which may then be evaluated during compilation when their arguments are known.",
    },
    {
      question: "What is the most vexing parse?",
      answer:
        "`Timer t();` looks like default construction but is parsed as a declaration of a function named `t` that takes nothing and returns `Timer`. The language rule is that anything which can be parsed as a declaration is one. The symptom is silence — the constructor never runs and there is no error. `Timer t{};` or `Timer t;` express the intent unambiguously, and `-Wall` includes `-Wvexing-parse`, which catches it.",
    },
    {
      question: "When should you use `auto`, and what does it not deduce?",
      answer:
        "Use it when the type is obvious from the initialiser, unwieldy to write (iterators), or unnameable (lambdas). Two deductions surprise people: `auto s = \"hi\"` gives `const char*` rather than `std::string`, and container `.size()` gives an unsigned `std::size_t`. Crucially `auto` strips references and top-level `const`, so `auto x = v[0]` copies — use `auto&` or `const auto&` when you want to bind to the original, which matters both for correctness and to avoid silent copies in loops.",
    },
  ],
  takeaways: [
    "Declarations read type-then-name; the type fixes both the size of the storage and how its bytes are interpreted",
    "Prefer braces — `int x{5}` — because they reject narrowing conversions that `=` accepts silently",
    "`int x{}` is the shortest correct way to get a zeroed variable, and works for class types too",
    "An uninitialised local is undefined behaviour, not zero; it may look fine in testing and differ in release",
    "Make everything `const` that can be, and start from the beginning — retrofitting const correctness is painful",
    "`const` means cannot change; `constexpr` means already known at compile time, which is a stronger claim",
    "`auto` is statically typed deduction, and it drops references and `const` — use `const auto&` to avoid silent copies",
    "Declare variables in the smallest scope that works; storage and destructors are released at the closing brace",
  ],
  status: "available",
};
