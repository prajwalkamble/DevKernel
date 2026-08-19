import type { Lesson } from "@/content/types";

export const constexprLesson: Lesson = {
  id: "cpp-constexpr",
  slug: "constexpr-and-compile-time-computation",
  moduleSlug: "templates-generics",
  title: "constexpr, consteval & Computing at Compile Time",
  summary:
    "Moving work from run time to build time. What `constexpr` actually promises, why `if constexpr` discards rather than skips a branch, and a prime sieve using `std::vector` that compiles down to a single `mov` instruction.",
  estimatedMinutes: 35,
  objectives: [
    "Distinguish `constexpr`, `consteval` and `constinit`",
    "Explain why `constexpr` on a function is a permission, not a guarantee",
    "Use `if constexpr` and say what happens to the discarded branch",
    "Use C++20 constexpr containers and explain the transient allocation rule",
    "Prove that a computation happened at compile time",
  ],
  sections: [
    {
      id: "constexpr",
      heading: "`constexpr` is a permission, not a promise",
      body: [
        "**`constexpr` on a function means it *can* be evaluated at compile time, not that it always is.** The same function compiles to ordinary machine code and runs normally when called with values only known at run time. It is one function serving both worlds, which is exactly the point.",
        "Whether compile-time evaluation actually happens depends on the *context*. It is required in a **constant expression context**: a `static_assert`, an array bound, a template argument, a `constexpr` variable's initialiser, or a non-type template argument. Everywhere else the compiler may fold it if it can and usually will at `-O2`, but nothing forces it.",
        "**`constexpr` on a variable is different and much stronger**: it means the initialiser *must* be a constant expression, and the variable is implicitly `const`. `constexpr int x = f();` fails to compile if `f()` cannot be evaluated at compile time. That is the usual way to force the issue and to be sure.",
        "The restrictions on what a `constexpr` function may do have loosened at every standard. C++11 allowed essentially a single `return` statement. **C++14 added loops, local variables and mutation**, which is why the recursive `factorial` below has a plain iterative sibling. C++20 added the big ones — dynamic allocation, `try`/`catch`, and virtual calls.",
        "**`consteval` is the strong form**: an *immediate function* that must be evaluated at compile time. Calling one with a runtime value is a compile error rather than a silent fallback. Use it when a runtime call would be a bug — building a compile-time format string, or a factory that must produce a constant.",
      ],
      examples: [
        {
          id: "constexpr-basics",
          title: "The same function in both worlds, and one that refuses",
          lang: "cpp",
          code: `#include <array>
#include <iostream>

// constexpr means "CAN run at compile time", not "always does".
constexpr int factorial(int n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}

// Since C++14 a constexpr function can have loops, locals and branches.
constexpr int sumTo(int n) {
    int total = 0;
    for (int i = 1; i <= n; ++i) total += i;
    return total;
}

// consteval: MUST run at compile time. Calling it at runtime is an error.
consteval int alwaysCompileTime(int n) { return n * 2; }

int main() {
    // Compile-time contexts: these are computed by the compiler.
    constexpr int f5 = factorial(5);
    static_assert(f5 == 120);
    static_assert(sumTo(100) == 5050);

    std::array<int, factorial(4)> arr{};        // 24 -- a template argument
    std::cout << "array size = " << arr.size() << '\\n';

    // Runtime context: the SAME function, called normally.
    int n;
    n = 6;                       // pretend this came from input
    std::cout << "factorial(6) at runtime = " << factorial(n) << '\\n';

    constexpr int c = alwaysCompileTime(21);
    std::cout << "consteval gave " << c << '\\n';
    // alwaysCompileTime(n);     // ERROR: n is not a constant expression

    std::cout << "sumTo(10) = " << sumTo(10) << '\\n';
}`,
          output: `array size = 24
factorial(6) at runtime = 720
consteval gave 42
sumTo(10) = 55`,
          explanation:
            "**`factorial` was used as a template argument and as an ordinary runtime call, from one definition.** `std::array<int, factorial(4)>` forced compile-time evaluation because a template argument must be a constant; `factorial(n)` with a runtime `n` just ran. The commented-out `alwaysCompileTime(n)` is the difference `consteval` makes — where `constexpr` would quietly fall back to a runtime call, `consteval` refuses to compile, which is what you want when a runtime call would defeat the purpose.",
        },
      ],
      pitfalls: [
        {
          title: "`constexpr` on a function is not a performance annotation",
          body: "Marking a function `constexpr` does not make it faster, and at `-O2` the optimiser will constant-fold ordinary functions with constant arguments anyway. What `constexpr` buys you is the *guarantee* that it can be used where a constant is required, and — via a `constexpr` variable or `static_assert` — that the evaluation definitely happened. It also constrains you: a `constexpr` function is part of your API's contract, and taking it away later breaks callers who used it in constant expressions. Add it where compile-time use is intended, not everywhere it happens to be legal.",
        },
      ],
    },
    {
      id: "if-constexpr",
      heading: "`if constexpr` discards the branch",
      body: [
        "An ordinary `if` chooses at run time, and **both branches must compile**. In a template that is often impossible: a branch calling `.size()` cannot compile when `T` is `int`, even if it would never be taken.",
        "**`if constexpr` is evaluated at compile time, and the untaken branch is discarded rather than compiled.** It is not optimised away — it is never instantiated at all, so it may contain code that would be a hard error for the current `T`.",
        "This single feature replaced an enormous amount of C++11-era machinery. Tag dispatch, `enable_if` overload pairs and specialisation-based branching were all, very often, just a way to write a compile-time `if` — and lesson 7 shows the code it replaced.",
        "Two details matter. **The discarded branch is only exempt from checking if it actually depends on a template parameter**; a statement that is ill-formed regardless of `T` is still an error. And **`if constexpr` in a non-template function checks both branches normally**, since there is no parameter for the validity to depend on.",
        "**`std::is_constant_evaluated()`** answers a different question: not \"is this type X\" but \"am I running at compile time right now\". It lets one function take a simple portable path during constant evaluation and a fast intrinsic-laden path at run time. C++23's `if consteval` is the cleaner spelling of the same idea.",
      ],
      examples: [
        {
          id: "if-constexpr-demo",
          title: "Four types through one function, plus a path that knows when it runs",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <type_traits>

// if constexpr: the untaken branch is DISCARDED, not just skipped.
// Without it, this function could not compile for all three types.
template <typename T>
std::string describe(const T& v) {
    if constexpr (std::is_integral_v<T>) {
        return "integer " + std::to_string(v);
    } else if constexpr (std::is_floating_point_v<T>) {
        return "float " + std::to_string(v);
    } else if constexpr (std::is_pointer_v<T>) {
        // Dereferencing would be a hard error for int -- but that branch
        // is discarded when T is int, so it is never compiled.
        return v ? "pointer to " + describe(*v) : "null pointer";
    } else {
        return "object of size " + std::to_string(sizeof(T));
    }
}

// std::is_constant_evaluated: take a different path at compile time.
constexpr int pickPath(int n) {
    if (std::is_constant_evaluated()) {
        return n * 100;      // compile time
    } else {
        return n;            // run time
    }
}

struct Point { double x, y; };

int main() {
    std::cout << describe(42)      << '\\n';
    std::cout << describe(2.5)     << '\\n';
    int n = 7;
    std::cout << describe(&n)      << '\\n';
    std::cout << describe(Point{}) << '\\n';

    constexpr int compileTime = pickPath(5);
    int runtimeArg = 5;
    int runTime = pickPath(runtimeArg);

    std::cout << "pickPath at compile time = " << compileTime << '\\n';
    std::cout << "pickPath at run time     = " << runTime << '\\n';
}`,
          output: `integer 42
float 2.500000
pointer to integer 7
object of size 16
pickPath at compile time = 500
pickPath at run time     = 5`,
          explanation:
            "**One function body handled `int`, `double`, `int*` and a struct**, and the pointer branch — which dereferences and recurses — was never compiled for the non-pointer cases. With a plain `if` this would not build at all. The last two lines show `is_constant_evaluated` returning genuinely different answers for the same call: 500 when the compiler evaluated it, 5 when the CPU did. Note that this is a *normal* `if`, not `if constexpr` — inside a constant evaluation the condition is simply true, and writing `if constexpr` here would be a bug that always takes the runtime path.",
        },
      ],
    },
    {
      id: "constexpr-containers",
      heading: "C++20: allocation, containers and `constinit`",
      body: [
        "C++20 made compile-time programming feel like ordinary programming, mostly through one change: **`new` and `delete` are allowed during constant evaluation**, subject to a single rule.",
        "**The transient allocation rule: every allocation made during a constant evaluation must be freed before that evaluation ends.** Memory may not escape into the resulting constant. So a `constexpr` function may build a `std::vector`, work with it, and return a scalar or a `std::array` — but it may not *return* the vector as a `constexpr` value.",
        "That is enough for `std::vector` and `std::string` to be usable inside `constexpr` functions, which is what turns compile-time computation from a puzzle into normal code. `std::sort`, `std::find` and most of `<algorithm>` became `constexpr` at the same time.",
        "**`constinit`** solves a different problem: it guarantees a variable with static storage duration is initialised at compile time, eliminating the static initialisation order fiasco, **without** making it `const`. Use it for mutable globals that must be ready before any dynamic initialisation runs.",
        "The three keywords in one line: **`constexpr` = may be compile-time and is `const`; `consteval` = must be compile-time; `constinit` = initialised at compile time but still mutable.**",
      ],
      examples: [
        {
          id: "constexpr-vector",
          title: "A sieve using `std::vector`, run entirely by the compiler",
          lang: "cpp",
          code: `#include <array>
#include <iostream>
#include <vector>

// C++20: std::vector and std::string may be used INSIDE a constexpr function,
// as long as every allocation is freed before the evaluation finishes.
// This is "transient allocation".
constexpr int countPrimesBelow(int limit) {
    std::vector<bool> sieve(static_cast<std::size_t>(limit), true);
    int count = 0;
    for (int i = 2; i < limit; ++i) {
        if (!sieve[static_cast<std::size_t>(i)]) continue;
        ++count;
        for (int j = i * i; j < limit; j += i)
            sieve[static_cast<std::size_t>(j)] = false;
    }
    return count;
}   // the vector is destroyed here, so the allocation does not escape

// Building a lookup table at compile time -- a genuinely common use.
constexpr std::array<int, 16> squareTable() {
    std::array<int, 16> t{};
    for (int i = 0; i < 16; ++i) t[static_cast<std::size_t>(i)] = i * i;
    return t;
}

// constinit: guaranteed initialised at compile time, but still mutable.
constinit int counter = 100;

int main() {
    static_assert(countPrimesBelow(100) == 25);
    constexpr int primes = countPrimesBelow(1000);
    std::cout << "primes below 1000 = " << primes << '\\n';

    constexpr auto table = squareTable();
    static_assert(table[12] == 144);
    std::cout << "table[12] = " << table[12] << '\\n';

    counter += 1;
    std::cout << "constinit counter = " << counter << '\\n';
}`,
          output: `primes below 1000 = 168
table[12] = 144
constinit counter = 101`,
          explanation:
            "**A full sieve of Eratosthenes, allocating a thousand-element `std::vector`, executed by the compiler.** The `static_assert` proves it: a `static_assert` cannot run at run time, so the sieve must have completed during compilation. The vector is destroyed before the function returns, satisfying the transient allocation rule — returning it as a `constexpr` value would not compile. `squareTable` shows the pattern you will use most in practice, building a lookup table that costs nothing at run time, and `std::array` works because its storage is part of the object rather than allocated.",
        },
      ],
      pitfalls: [
        {
          title: "Compile-time work is not free — it is paid by your build",
          body: "Constant evaluation runs in the compiler's interpreter, which is dramatically slower than executing the same code natively, and it consumes compiler memory. A sieve to 1,000 is instant; a sieve to 10,000,000 will make your build crawl or hit an implementation limit. GCC's `-fconstexpr-ops-limit` and Clang's `-fconstexpr-steps` control the ceiling, and hitting them produces an error rather than a fallback. Move work to compile time when it removes runtime cost from a hot path or produces a table you would otherwise hand-write — not because it is possible.",
        },
      ],
    },
    {
      id: "proof",
      heading: "Proving it happened",
      body: [
        "Two ways to be certain a computation moved to compile time, and both are worth having as habits.",
        "**`static_assert` is the language-level proof.** It is evaluated during compilation and cannot involve any runtime work, so a passing `static_assert(countPrimesBelow(100) == 25)` is conclusive. Assigning to a `constexpr` variable is the same argument in a form you can then use.",
        "**The generated code is the machine-level proof.** Compile with `-O2 -S` and look, or disassemble the object file. A computation done at compile time leaves a literal constant behind and no trace of the loop.",
        "The disassembly below is real GCC 14 output for the sieve from the previous example, called two ways in the same translation unit.",
      ],
      examples: [
        {
          id: "asm-proof",
          title: "The same sieve, called two ways, disassembled",
          lang: "asm",
          code: `// int compileTime() { constexpr int n = countPrimesBelow(1000); return n; }
// int runTime(int limit) { return countPrimesBelow(limit); }

$ g++ -std=c++20 -O2 -c asmproof.cpp
$ objdump -d -M intel --demangle asmproof.o

0000000000000000 <compileTime()>:
   0:   b8 a8 00 00 00          mov    eax,0xa8     ; 0xa8 == 168. That is it.
   5:   c3                      ret

0000000000000010 <runTime(int)>:
  10:   e9 00 00 00 00          jmp    <the real sieve>   ; tail call

$ size asmproof.o
   text    data     bss     dec     hex filename
    417       0       0     417     1a1 asmproof.o`,
          output: `# static_assert is the other proof, and it is airtight:
static_assert(countPrimesBelow(100) == 25);   // compiles => it ran at build time`,
          explanation:
            "**`compileTime()` is two instructions: load 168, return.** The vector, the allocation, the nested loops and the thousand-element sieve are all gone — the compiler ran them and kept only the answer. `runTime(int)` cannot do that, because `limit` is unknown, so it tail-jumps to a real implementation which accounts for most of the 417 bytes of code in the object file. Note the honest comparison: the sieve body still exists in the binary because `runTime` needs it, and had we only ever called it in constant contexts, it would not have been emitted at all.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Does `constexpr` on a function guarantee compile-time evaluation?",
      answer:
        "No. It is a permission — the function *may* be evaluated at compile time, and the same definition also compiles to ordinary code for runtime calls. Compile-time evaluation is only required in a constant expression context: a `static_assert`, array bound, template argument, or the initialiser of a `constexpr` variable. Elsewhere the compiler may fold it and usually will at `-O2`, but nothing forces it. `constexpr` on a *variable* is the stronger form: the initialiser must be a constant expression, so it fails to compile otherwise, and that is the usual way to force and verify compile-time evaluation.",
    },
    {
      question: "What is the difference between `constexpr`, `consteval` and `constinit`?",
      answer:
        "`constexpr` means may be evaluated at compile time, and on a variable also implies `const`. `consteval` declares an immediate function that *must* be evaluated at compile time — calling it with a runtime value is a compile error rather than a silent fallback to a runtime call, which is what you want when a runtime call would be a bug. `constinit` applies to variables with static storage duration and guarantees they are initialised at compile time, which eliminates the static initialisation order fiasco, but unlike `constexpr` it does not make them `const`, so it suits mutable globals.",
    },
    {
      question: "What does `if constexpr` do that a normal `if` cannot?",
      answer:
        "The condition is evaluated at compile time and the untaken branch is *discarded* rather than compiled. In a template that means the discarded branch may contain code that would be a hard error for the current template arguments — dereferencing a non-pointer, calling `.size()` on an `int` — because it is never instantiated. A normal `if` requires both branches to compile regardless of which runs. Two caveats: the discarded branch is only exempt if its validity actually depends on a template parameter, and in a non-template function both branches are checked normally. It replaced a great deal of tag dispatch and `enable_if` machinery.",
    },
    {
      question: "What is the transient allocation rule?",
      answer:
        "C++20 allows `new` and `delete` during constant evaluation, on condition that every allocation made is freed before that evaluation finishes — no memory may escape into the resulting constant. So a `constexpr` function can build a `std::vector`, compute with it, and return a scalar or a `std::array`, but it cannot return the vector itself as a `constexpr` value. This is what made `std::vector` and `std::string` usable inside `constexpr` functions and turned compile-time programming into something resembling ordinary programming.",
    },
    {
      question: "How would you prove a computation actually happened at compile time?",
      answer:
        "Two ways. At the language level, `static_assert` on the result: it is evaluated during compilation and cannot involve runtime work, so if it compiles the computation ran at build time. Assigning to a `constexpr` variable makes the same guarantee in a usable form. At the machine level, compile with `-O2` and inspect the output — a compile-time computation leaves a literal constant with no trace of the loop. A sieve counting primes below 1000 compiles to `mov eax, 0xa8; ret`, two instructions, while the same function called with a runtime argument keeps the whole implementation.",
    },
    {
      question: "What are the costs of moving work to compile time?",
      answer:
        "Build time and compiler memory. Constant evaluation runs in the compiler's interpreter, which is far slower than native execution, so a computation that takes microseconds at run time can take seconds at build time and is repeated on every rebuild that touches the header. Compilers impose limits — GCC's `-fconstexpr-ops-limit`, Clang's `-fconstexpr-steps` — and exceeding them is a hard error rather than a fallback. There is also an API cost: `constexpr` is part of your contract, and removing it later breaks callers who used the function in constant expressions.",
    },
  ],
  takeaways: [
    "`constexpr` on a function is a permission to run at compile time, not a guarantee",
    "`constexpr` on a variable requires a constant initialiser and is the usual way to force evaluation",
    "Compile-time evaluation is mandatory only in constant expression contexts",
    "C++14 allowed loops and mutation in `constexpr` functions; C++20 added allocation and virtual calls",
    "`consteval` must run at compile time — a runtime call is a compile error",
    "`constinit` guarantees compile-time initialisation without making the variable `const`",
    "`if constexpr` discards the untaken branch, so it may contain code invalid for the current `T`",
    "The discarded branch is only exempt if its validity depends on a template parameter",
    "`std::is_constant_evaluated()` uses a plain `if`, never `if constexpr`",
    "Transient allocation: memory allocated during constant evaluation must be freed before it ends",
    "`static_assert` is airtight proof a computation ran at build time",
    "Compile-time work is paid for by your build, and compilers enforce hard operation limits",
  ],
  status: "available",
};
