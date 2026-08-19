import type { Lesson } from "@/content/types";

export const functionsLesson: Lesson = {
  id: "cpp-functions",
  slug: "declaring-functions",
  moduleSlug: "control-flow-functions",
  title: "Declaring & Defining Functions",
  summary:
    "How to write a function: the difference between declaring and defining one, why the compiler needs the declaration first, what `void` and `auto` return types mean, and why falling off the end of a non-void function crashes with an illegal instruction.",
  estimatedMinutes: 30,
  objectives: [
    "Write a function declaration and a definition, and explain why both exist",
    "Understand why declaration order matters in a single file",
    "Use `void`, deduced (`auto`) and trailing return types appropriately",
    "Explain what happens when a non-void function returns nothing",
    "Mark functions `constexpr`, `noexcept` and `[[nodiscard]]` where it pays",
  ],
  sections: [
    {
      id: "anatomy",
      heading: "Declaration against definition",
      body: [
        "A C++ function has two separate things you can write, and the split is fundamental to how the language is compiled.",
        "**A declaration** (also called a prototype) states the name, the return type and the parameter types, and ends with a semicolon: `double average(int a, int b);`. It tells the compiler that this function exists and how to call it.",
        "**A definition** additionally supplies the body. Every definition is also a declaration.",
        "Why have both? Because the compiler processes a file **top to bottom in a single pass**, and it must know a function's signature before it can compile a call to it — it needs to check the argument types and know how much space the return value occupies. A declaration provides that without the body, which is what lets one file call a function defined in another. That is exactly the mechanism headers use, covered in lesson 7.",
        "Within a single file you have a choice: define every function before its first use, or declare them all at the top and define them in whatever order reads best. The second scales better and is what most codebases do.",
      ],
      examples: [
        {
          id: "function-anatomy",
          title: "Declaration, definition, void, and a deduced return type",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

// Declaration (prototype): tells the compiler the signature.
double average(int a, int b);

// Definition: the body.
double average(int a, int b) {
    return (a + b) / 2.0;
}

// A function that returns nothing.
void greet(const std::string& name) {
    std::cout << "Hello, " << name << "!\\n";
    // no return needed
}

// auto return type deduction (C++14).
auto twice(int n) { return n * 2; }

int main() {
    std::cout << average(3, 4) << '\\n';
    greet("Ada");
    std::cout << twice(21) << '\\n';
}`,
          output: `3.5
Hello, Ada!
42`,
          explanation:
            "`average(3, 4)` returns 3.5, not 3 — because `2.0` is a `double`, the whole expression is computed in floating point. Writing `(a + b) / 2` would perform integer division first and return `3.0`. This is the integer-division trap from module 1 hiding inside a function, and it is a common real bug.",
        },
      ],
      pitfalls: [
        {
          title: "Parameter names in a declaration are documentation only",
          body: "`double average(int, int);` is a complete, legal declaration — names are optional there and the compiler ignores them. Include them anyway: `int find(const std::string& haystack, const std::string& needle)` tells a reader the argument order, and `int find(const std::string&, const std::string&)` does not. The names in the *definition* are what the body actually uses, and they need not match the declaration's, though making them differ is a good way to confuse everyone.",
        },
      ],
    },
    {
      id: "return-types",
      heading: "Return types: explicit, void, auto and trailing",
      body: [
        "**An explicit type** is the default and usually the right answer, because the signature is what a caller reads.",
        "**`void`** means the function returns nothing. A bare `return;` is legal inside one, to exit early.",
        "**`auto`** (C++14) deduces the return type from the `return` statements, which must all agree. This is genuinely useful for templates and for types that are painful to write, and a mild liability in ordinary code — a reader now has to find the body to learn what they get back. It also forces callers to have seen the definition, not merely a declaration, so it cannot be used for a function declared in a header and defined in a `.cpp` file.",
        "**A trailing return type** — `auto f(int x) -> double` — moves the type after the parameters. It exists because sometimes the return type depends on the parameters, most obviously in templates where you want `decltype(a + b)`. In ordinary code it is a style choice.",
        "**`[[nodiscard]]`** makes ignoring the return value a warning. Apply it whenever discarding the result is almost certainly a bug — a function whose only purpose is its return value, an error code, or a `reserve`-style call that returns whether it succeeded.",
      ],
      examples: [
        {
          id: "nodiscard",
          title: "[[nodiscard]] turns a silent mistake into a warning",
          lang: "cpp",
          code: `#include <iostream>
#include <vector>

// The only reason to call this is the value it returns.
[[nodiscard]] bool is_valid(int n) { return n > 0 && n < 100; }

// Trailing return type — equivalent to \`double scale(int, double)\`.
auto scale(int value, double factor) -> double { return value * factor; }

int main() {
    is_valid(5);                       // result thrown away: a bug
    std::cout << scale(10, 1.5) << '\\n';
}`,
          output: `warning: ignoring return value of 'bool is_valid(int)',
         declared with attribute 'nodiscard' [-Wunused-result]
   12 |     is_valid(5);                       // result thrown away: a bug
      |     ~~~~~~~~^~~

15`,
          explanation:
            "Without the attribute that line compiles silently and does nothing at all. The standard library marks a growing number of functions this way, which is why `std::vector::empty()` warns when discarded — a good thing, because people write `v.empty();` intending `v.clear();` surprisingly often.",
        },
      ],
    },
    {
      id: "missing-return",
      heading: "Falling off the end of a non-void function",
      body: [
        "This deserves its own section because the consequence is so much worse than people expect.",
        "**A non-void function that reaches its closing brace without a `return` is undefined behaviour.** Not \"returns zero\", not \"returns garbage\" — undefined.",
        "The most common way to write it is a chain of `if`s where one path was overlooked, and the risk is that the overlooked path is the rare one, so the function works in testing.",
        "`-Wreturn-type` — part of `-Wall` — catches it. Treat this warning as an error even if you do not use `-Werror`.",
      ],
      examples: [
        {
          id: "missing-return-demo",
          title: "What actually happens",
          lang: "cpp",
          code: `#include <iostream>

int forgot(int n) {
    if (n > 0) return n;
    // falls off the end when n <= 0
}

int main() { std::cout << forgot(-1) << '\\n'; }`,
          output: `warning: control reaches end of non-void function [-Wreturn-type]
    5 | }
      | ^

$ ./a.out
Illegal instruction (core dumped)

$ g++ -fsanitize=undefined missing.cpp -o a.out && ./a.out
missing.cpp:2:5: runtime error: execution reached the end of a
                 value-returning function without returning a value`,
          explanation:
            "**The program crashed with `Illegal instruction`.** GCC, knowing this path is undefined, emitted a trap instruction (`ud2`) rather than generating a return at all — the optimiser is entitled to assume the path is unreachable. That is a much better outcome than silently returning junk, but it is a crash in production either way. The sanitizer message names the exact function and line.",
        },
      ],
      pitfalls: [
        {
          title: "`main` is the one exception",
          body: "If control reaches the closing brace of `main` without a `return`, the compiler inserts `return 0;`. This is special-cased in the standard and applies to no other function. It is why the shortest legal C++ program is `int main() {}`.",
        },
      ],
    },
    {
      id: "recursion",
      heading: "Recursion and the stack",
      body: [
        "A function may call itself. Every call pushes a new **stack frame** holding its parameters, local variables and return address, and pops it on return.",
        "The stack is a fixed, fairly small region — typically 1 MB on Windows and 8 MB on Linux, per thread. Recursing too deep exhausts it, and the result is a **stack overflow**: a segmentation fault with no useful message. There is no exception to catch, because there is no room left to handle one.",
        "So: recursion is right when the problem is genuinely recursive and the depth is bounded by the shape of the data — a tree, a parser, divide and conquer. It is the wrong tool when the depth scales with input size, because an adversary (or an unusual input) can crash you.",
        "Some compilers convert *tail recursion* — a call in the final position — into a loop, which uses constant stack. **It is an optimisation, not a guarantee**, and it typically disappears at `-O0`, so never rely on it for correctness.",
      ],
      examples: [
        {
          id: "recursion-demo",
          title: "Bounded recursion, and the depth that kills",
          lang: "cpp",
          code: `#include <iostream>

// Fine: depth is log2(n), so about 64 frames at most.
int power(int base, int exp) {
    if (exp == 0) return 1;
    if (exp % 2 == 0) { int half = power(base, exp / 2); return half * half; }
    return base * power(base, exp - 1);
}

// Dangerous: depth equals n. Crashes for large n.
long long sum_to(long long n) {
    if (n <= 0) return 0;
    return n + sum_to(n - 1);
}

int main() {
    std::cout << power(2, 10) << '\\n';
    std::cout << sum_to(100) << '\\n';
    // sum_to(10'000'000) would exhaust the stack and segfault.
}`,
          output: `1024
5050`,
          explanation:
            "`power` recurses about 4 times for an exponent of 10 and would recurse 31 times for the largest `int` — the depth is logarithmic, so it is safe by construction. `sum_to` recurses once per unit of `n`, so its safety depends entirely on a caller you may not control. **The distinction to look for is whether the depth is bounded by the structure of the data or by a number the caller supplies.**",
        },
      ],
    },
    {
      id: "qualifiers",
      heading: "constexpr and noexcept",
      body: [
        "Two qualifiers worth applying deliberately rather than as decoration.",
        "**`constexpr`** on a function means it *may* be evaluated at compile time when its arguments are known then. It still works as a normal function otherwise. There is no downside beyond a restriction on what the body may do, so mark small pure functions `constexpr` freely — it costs nothing and occasionally moves real work out of runtime. `consteval` (C++20) is the stronger form: it *must* run at compile time, and a runtime call is an error.",
        "**`noexcept`** promises the function will not throw. This is not merely documentation: it changes what the standard library does. `std::vector`'s reallocation *moves* elements if their move constructor is `noexcept` and *copies* them otherwise, because copying is the only way to keep the strong exception guarantee if a move can fail. Module 10 covers that mechanism properly.",
        "The critical warning: **if a `noexcept` function does throw, the program calls `std::terminate` immediately.** No unwinding, no catch. So `noexcept` is a promise you must actually keep, not a hint. Apply it where you are certain — destructors, swaps, move operations, simple accessors — and leave it off otherwise.",
      ],
      examples: [
        {
          id: "constexpr-noexcept",
          title: "Compile-time evaluation and a kept promise",
          lang: "cpp",
          code: `#include <iostream>

constexpr int factorial(int n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}

// Cannot throw: no allocation, no calls that might.
constexpr int clamp(int value, int lo, int hi) noexcept {
    return value < lo ? lo : (value > hi ? hi : value);
}

int main() {
    // Computed by the compiler; there is no multiplication in the binary.
    static_assert(factorial(5) == 120);
    constexpr int table_size = factorial(5);

    int runtime_input = 7;
    std::cout << table_size << ' '
              << factorial(runtime_input) << ' '   // same function, at runtime
              << clamp(150, 0, 100) << '\\n';
}`,
          output: `120 5040 100`,
          explanation:
            "The same `factorial` was evaluated twice in completely different ways: at compile time for `static_assert` and `table_size`, and at runtime for `runtime_input`. That dual nature is the whole point of `constexpr` — you write one function and the compiler uses it wherever it can.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between declaring and defining a function, and why does C++ need both?",
      answer:
        "A declaration gives the name, return type and parameter types and ends with a semicolon; a definition adds the body. The compiler processes a translation unit top to bottom in one pass and must know a function's signature before compiling a call — to check argument types and know the size of the return value. A declaration supplies that without the body, which is what allows one file to call a function defined in another. That is exactly what headers provide.",
    },
    {
      question: "What happens if a non-void function reaches the end without returning?",
      answer:
        "Undefined behaviour. In practice GCC emits a trap instruction, so the program dies with `Illegal instruction` — the optimiser treats the path as unreachable and generates no return at all. Other compilers may return whatever happens to be in the return register. `-Wreturn-type`, part of `-Wall`, catches it, and `-fsanitize=undefined` reports it at runtime with the function and line. The only exception is `main`, where the compiler inserts `return 0;`.",
    },
    {
      question: "What does `noexcept` do, and what is the risk of using it?",
      answer:
        "It promises the function will not throw. That has real consequences: `std::vector` will move elements during reallocation only if their move constructor is `noexcept`, and copies them otherwise, because copying is the only way to preserve the strong exception guarantee. The risk is that if a `noexcept` function does throw, the program calls `std::terminate` immediately — no unwinding, nothing to catch. So it is a promise you must keep, and belongs on destructors, swaps, move operations and simple accessors rather than on everything.",
    },
    {
      question: "When is recursion the wrong choice in C++?",
      answer:
        "When the depth scales with input size rather than with the structure of the data. The stack is fixed and small — around 8 MB on Linux, 1 MB on Windows — and exhausting it is a segmentation fault with no exception to catch. Recursing over a balanced tree or a divide-and-conquer split is safe because the depth is logarithmic; recursing once per element of a caller-supplied list is a crash waiting for a large input. Tail-call optimisation exists but is not guaranteed and typically vanishes at `-O0`, so it cannot be relied on for correctness.",
    },
    {
      question: "What is `[[nodiscard]]` for?",
      answer:
        "It makes ignoring a function's return value produce a warning. It belongs on functions whose only purpose is the value they return — predicates, error codes, and factory functions — because discarding the result there is almost certainly a bug. The standard library marks a growing set this way; `std::vector::empty()` is the well-known one, because people write `v.empty();` when they meant `v.clear();`.",
    },
  ],
  takeaways: [
    "A declaration gives the signature and a definition adds the body; the compiler needs the signature before any call",
    "Parameter names in a declaration are ignored by the compiler and are for the reader — write them",
    "`(a + b) / 2` inside a function that returns `double` still does integer division first",
    "Falling off a non-void function is undefined behaviour; GCC emits a trap and the program dies with `Illegal instruction`",
    "`main` is the one function where the compiler inserts `return 0;` for you",
    "`[[nodiscard]]` turns a discarded return value into a warning; use it on predicates and error codes",
    "`constexpr` costs nothing and lets the same function serve compile time and runtime",
    "`noexcept` changes what the standard library does — but breaking the promise calls `std::terminate`",
  ],
  status: "available",
};
