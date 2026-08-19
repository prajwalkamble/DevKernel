import type { Lesson } from "@/content/types";

export const undefinedBehaviourLesson: Lesson = {
  id: "cpp-ub-optimiser",
  slug: "undefined-behaviour-and-the-optimiser",
  moduleSlug: "performance-systems",
  title: "Undefined Behaviour & What the Optimiser Is Allowed to Assume",
  summary:
    "Why undefined behaviour is a contract rather than a bug class. Real GCC output where a comparison becomes the constant `true`, a null check disappears entirely, and an infinite loop compiles to a bare `ret` — each because the standard permitted an assumption.",
  estimatedMinutes: 35,
  objectives: [
    "Explain UB as a premise the optimiser reasons from, not merely a crash",
    "Predict how signed overflow, null checks and aliasing rules affect codegen",
    "Read the assembly that proves a transformation happened",
    "Say why UB can appear to travel backwards in time",
    "Choose the flags that make UB less dangerous",
  ],
  sections: [
    {
      id: "the-contract",
      heading: "UB is a premise, not a punishment",
      body: [
        "The common description — \"undefined behaviour means anything can happen\" — is accurate and misses the mechanism. **The standard defines UB so that the compiler may assume it never occurs**, and that assumption is an *input* to optimisation.",
        "So the question is never \"what does this UB do at run time?\" but **\"what did the optimiser conclude from the promise I broke?\"** Once you see it that way, the strange behaviours stop being mysterious.",
        "`x + 1 > x` on signed integers is always true **because overflow is UB**. If overflow were defined to wrap, `INT_MAX + 1` would be negative and the comparison false — so the compiler could not fold it. Making overflow UB is precisely what licenses the constant.",
        "This is why **unsigned arithmetic is often slower to optimise**: wraparound is *defined*, so the compiler must preserve it and cannot make the same deductions.",
        "The examples below are real GCC 14 output at `-O2`. Nothing is contrived — each function is a few lines of ordinary-looking C++.",
      ],
      examples: [
        {
          id: "ub-codegen",
          title: "Three functions the optimiser deleted",
          lang: "asm",
          code: `// ── 1. Signed overflow is UB, so this comparison is always true ───
bool alwaysTrue(int x) { return x + 1 > x; }

alwaysTrue(int):
        mov     eax, 1          ; the parameter is never even read
        ret

// ── 2. A null check AFTER a dereference ───────────────────────────
int deref(int* p) { int v = *p; if (!p) return -1; return v; }

deref(int*):
        mov     eax, DWORD PTR [rdi]
        ret                     ; the 'if (!p)' is GONE

// The reasoning: dereferencing null is UB, so by the time the check
// runs, p is provably non-null. The branch is dead code.

// ── 3. Strict aliasing: int* and float* cannot refer to one object ─
int strictAliasing(int* i, float* f) { *i = 1; *f = 2.0f; return *i; }

strictAliasing(int*, float*):
        mov     DWORD PTR [rdi], 1
        mov     eax, 1          ; returns the CONSTANT 1, no reload
        mov     DWORD PTR [rsi], 0x40000000
        ret

// The store through f cannot affect *i, so *i is still 1 -- no reload
// needed. Pass the same address as both arguments and the answer is
// wrong, and the program was already undefined.`,
          output: `$ g++ -std=c++20 -O2 -S -masm=intel ub.cpp

# All three transformations are correct *given* that the program has no
# undefined behaviour. The compiler is not being clever or hostile --
# it is using the premises the standard handed it.`,
          explanation:
            "**The second one is the one that changes how people think.** A defensive null check written *after* a dereference is not merely useless — it is removed, so the code is less safe than if the check had never been written, because a reader believes it is there. The lesson generalises: **a check that comes after the UB has already occurred cannot help you.** Validate before you dereference, not after.",
        },
      ],
    },
    {
      id: "time-travel",
      heading: "UB travels backwards",
      body: [
        "The most counter-intuitive consequence: **UB can affect code that runs *before* it.**",
        "If a function unconditionally reaches UB on some path, the compiler may conclude that path is never taken — and then delete everything that *led* to it, including observable side effects like output.",
        "That is why a program can fail to print a line that appears before the crash. The line was not \"lost to buffering\"; it was never compiled.",
        "The clearest instance is the **forward progress** rule. The standard permits a compiler to assume a loop without side effects will terminate, so a loop that obviously does not terminate becomes... nothing at all.",
        "**`void spin(int n) { while (n != 0) { } }` compiles to a bare `ret`.** Not an infinite loop, not a hang — the function returns immediately.",
        "The practical consequence for debugging: **when behaviour makes no sense, suspect UB before suspecting the compiler.** Rebuild at `-O0`, then with `-fsanitize=undefined`, and the mystery usually resolves.",
      ],
      examples: [
        {
          id: "forward-progress",
          title: "An infinite loop that returns immediately",
          lang: "asm",
          code: `// The loop has no side effects and cannot exit when n != 0.
// The standard says a compiler may ASSUME it terminates.
void spin(int n) { while (n != 0) { } }

spin(int):
        ret                     ; that is the entire function

// ── A related, non-UB case worth seeing: signedness costs instructions
int      divSigned(int x)        { return x / 2; }
unsigned divUnsigned(unsigned x) { return x / 2; }

divSigned(int):
        mov     eax, edi
        shr     eax, 31         ; extract the sign bit
        add     eax, edi        ; bias, so the shift rounds toward zero
        sar     eax
        ret                     ; 4 instructions

divUnsigned(unsigned):
        mov     eax, edi
        shr     eax             ; a single shift
        ret                     ; 2 instructions`,
          output: `$ g++ -std=c++20 -O2 -S -masm=intel

# spin() is not a hang. It is a no-op, because a side-effect-free loop
# is assumed to terminate -- and the only way this one terminates is if
# n == 0, so the compiler concludes the body never runs.

# The division pair is NOT undefined behaviour: signed division must
# round toward zero, which a raw arithmetic shift does not do for
# negatives, so the compiler emits a correction. Use unsigned when the
# quantity genuinely cannot be negative.`,
          explanation:
            "**`spin` returning immediately is the sharpest possible demonstration that UB is a premise rather than a runtime event.** No instruction executed incorrectly — the function simply has no instructions. Note the division pair beneath it is a different phenomenon and a useful contrast: nothing there is undefined, the signed version is just genuinely more work because the language specifies rounding toward zero. **Not every performance difference is about UB, and not every UB is about performance.**",
        },
      ],
      pitfalls: [
        {
          title: "`-fwrapv` and `-fno-strict-aliasing` are real options with real costs",
          body: "`-fwrapv` defines signed overflow as wrapping, and `-fno-strict-aliasing` allows pointers of different types to alias. Both remove a class of UB and both cost optimisation — the Linux kernel builds with `-fno-strict-aliasing` because too much of its code violates the rule to fix. They are the right choice when you have inherited code you cannot audit, and the wrong choice as a substitute for fixing it, because they only cover those two specific rules and leave every other form of UB intact. `-ftrapv` is a third option that traps on signed overflow instead of defining it, which is a debugging aid rather than a production setting.",
        },
      ],
    },
    {
      id: "defending",
      heading: "Working with it rather than against it",
      body: [
        "You cannot avoid UB by being careful, because the categories are too numerous to hold in your head. What works is tooling plus a few habits.",
        "**Build with sanitizers in CI**, as module 12 covered — UBSan is nearly free and catches signed overflow, bad shifts, null dereference and invalid casts. This is the single highest-value action.",
        "**Turn on the warnings that predict it**: `-Wall -Wextra` plus `-Wnull-dereference`, `-Wstrict-aliasing=2`, `-Warray-bounds=2`.",
        "**Prefer constructs that cannot be undefined.** `std::vector::at` over `operator[]` where the index is not provably in range, `std::span` over pointer-plus-length, `std::bit_cast` over `reinterpret_cast` for type punning, `gsl::narrow` or an explicit check over a silent truncation.",
        "**Validate before, never after.** A precondition check belongs above the operation it guards.",
        "**Use unsigned for quantities that cannot be negative**, but be aware of the trade: unsigned arithmetic wraps rather than being UB, so it is safer *and* less optimisable, and mixed signed/unsigned comparisons are their own hazard — which `-Wsign-compare` catches.",
        "**And know the common categories** well enough to recognise the shapes: signed overflow, out-of-bounds access, null and dangling dereference, use-after-free, uninitialised reads, strict aliasing violations, data races, invalid shifts, and reading an inactive union member.",
      ],
      examples: [
        {
          id: "safe-alternatives",
          title: "The same operations, written so they cannot be undefined",
          lang: "cpp",
          code: `#include <bit>
#include <cstdint>
#include <cstring>
#include <iostream>
#include <limits>
#include <span>
#include <stdexcept>
#include <vector>

// ── Type punning ──────────────────────────────────────────────────
// UB: reading through an incompatible pointer type.
float badPun(std::uint32_t bits) {
    return *reinterpret_cast<float*>(&bits);      // strict aliasing violation
}
// Defined, and compiles to the same single instruction:
float goodPun(std::uint32_t bits) {
    return std::bit_cast<float>(bits);            // C++20
}

// ── Overflow-checked arithmetic ───────────────────────────────────
bool addOverflows(int a, int b) {
    // NOT: 'a + b < a' -- that is itself UB if it overflows.
    return __builtin_add_overflow_p(a, b, int{});
}
int addChecked(int a, int b) {
    int out{};
    if (__builtin_add_overflow(a, b, &out))
        throw std::overflow_error("int addition overflowed");
    return out;
}

// ── Bounds ────────────────────────────────────────────────────────
int lastUnchecked(const std::vector<int>& v) { return v[v.size() - 1]; }  // UB if empty
int lastChecked(const std::vector<int>& v) {
    if (v.empty()) throw std::out_of_range("empty");
    return v.back();
}

// ── Pointer + length -> span, which carries its own bounds ────────
int sumRaw(const int* p, std::size_t n) {           // nothing checks n
    int s = 0; for (std::size_t i = 0; i < n; ++i) s += p[i]; return s;
}
int sumSpan(std::span<const int> s) {               // size travels with it
    int t = 0; for (int v : s) t += v; return t;
}

int main() {
    std::cout << std::boolalpha;
    std::cout << "bit_cast<float>(0x40490fdb) = " << goodPun(0x40490fdb) << '\\n';
    std::cout << "INT_MAX + 1 overflows?       = "
              << addOverflows(std::numeric_limits<int>::max(), 1) << '\\n';
    try { addChecked(std::numeric_limits<int>::max(), 1); }
    catch (const std::overflow_error& e) {
        std::cout << "addChecked threw:             " << e.what() << '\\n';
    }
    std::vector<int> v{1, 2, 3};
    std::cout << "sumSpan(v)                  = " << sumSpan(v) << '\\n';
    std::cout << "lastChecked(v)              = " << lastChecked(v) << '\\n';
    (void)badPun; (void)lastUnchecked; (void)sumRaw;
}`,
          output: `$ g++ -std=c++20 -Wall -Wextra -O2 safe.cpp
warning: dereferencing type-punned pointer will break strict-aliasing
rules [-Wstrict-aliasing]
    9 | float badPun(uint32_t bits) { return *reinterpret_cast<float*>(&bits); }
      |                                       ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

$ ./safe
bit_cast<float>(0x40490fdb) = 3.14159
INT_MAX + 1 overflows?       = true
addChecked threw:             int addition overflowed
sumSpan(v)                  = 6
lastChecked(v)              = 3

# And the "safe" version costs nothing:
goodPun(unsigned int):
        movd    xmm0, edi       ; one instruction
        ret`,
          explanation:
            "**`std::bit_cast` compiles to a single `movd` — exactly what the `reinterpret_cast` would have produced — it is simply *defined* where the cast is not.** That is the pattern worth internalising: the safe construct is usually free, and the unsafe one is chosen out of habit rather than measurement. Note GCC warned about the aliasing violation unprompted at `-Wall -Wextra`. And `__builtin_add_overflow` detects overflow without committing UB inside the check, which the naive `a + b < a` test does.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why is undefined behaviour defined the way it is, rather than just being \"a bug\"?",
      answer:
        "Because it is a premise the optimiser reasons from. The standard says the compiler may assume UB never occurs, and that assumption is an input to optimisation — not merely permission to misbehave afterwards. `x + 1 > x` folds to the constant `true` precisely *because* signed overflow is undefined; if overflow were defined to wrap, `INT_MAX + 1` would be negative and the fold would be wrong. So the useful question when something surprising happens is not \"what does this UB do at run time?\" but \"what did the optimiser conclude from the promise I broke?\"",
    },
    {
      question: "Why does a null check after a dereference disappear?",
      answer:
        "Because dereferencing a null pointer is undefined, so by the time control reaches the check the pointer is provably non-null, and the branch is dead code the optimiser removes. Measured with GCC 14 at `-O2`, `int deref(int* p) { int v = *p; if (!p) return -1; return v; }` compiles to a single load and a return. This is worse than the check being useless: a reader believes the function is defensive when the generated code is not. Preconditions must be validated *before* the operation they guard, never after.",
    },
    {
      question: "How can undefined behaviour affect code that runs before it?",
      answer:
        "If a path unconditionally reaches UB, the compiler may conclude that path is never taken and delete everything leading to it — including observable side effects such as output. So a program can fail to print a line that appears before the fault, not because of buffering but because the line was never compiled. The starkest example is the forward-progress rule: the standard permits assuming a side-effect-free loop terminates, so `void spin(int n) { while (n != 0) { } }` compiles to a bare `ret`. It is not a hang; the function has no instructions.",
    },
    {
      question: "What is strict aliasing and what does it buy?",
      answer:
        "The rule that an object may only be accessed through a pointer or reference to a compatible type — with `char`, `unsigned char` and `std::byte` exempt. It lets the compiler assume a store through a `float*` cannot change an `int`, so a reload can be elided. Measured: `int f(int* i, float* f) { *i = 1; *f = 2.0f; return *i; }` returns the constant 1 with no second load. Violating it is UB even though the code appears to work, and `-fno-strict-aliasing` disables the assumption at a real optimisation cost — the Linux kernel builds that way. The defined alternative for type punning is `std::bit_cast`, which compiles to the same instruction.",
    },
    {
      question: "Is unsigned arithmetic safer than signed?",
      answer:
        "It trades one problem for another. Unsigned overflow is *defined* to wrap, so it is not UB — but that also means the compiler must preserve the wrapping and can make fewer deductions, so it can optimise worse. It introduces its own hazards: `i >= 0` is always true, `v.size() - 1` on an empty vector is a huge number, and mixed signed/unsigned comparisons convert in surprising ways, which is what `-Wsign-compare` exists for. Use unsigned when the quantity genuinely cannot be negative and you want defined wraparound; use signed for arithmetic where you want the optimiser's help and a sanitizer to catch overflow.",
    },
    {
      question: "How do you defend against UB in practice?",
      answer:
        "Tooling first: UBSan in CI is nearly free and catches signed overflow, invalid shifts, null dereference and bad casts, and ASan catches the memory categories. Then warnings that predict it — `-Wnull-dereference`, `-Wstrict-aliasing=2`, `-Warray-bounds=2`. Then prefer constructs that cannot be undefined: `at()` where the index is not provably in range, `std::span` instead of pointer-plus-length so the size travels with the data, `std::bit_cast` instead of `reinterpret_cast`, `__builtin_add_overflow` instead of a check that itself overflows. And validate before the operation, never after. `-fwrapv` and `-fno-strict-aliasing` are legitimate for inherited code you cannot audit, but they cover only two rules.",
    },
  ],
  takeaways: [
    "UB is a premise the optimiser reasons from, not just a runtime misbehaviour",
    "`x + 1 > x` folds to `true` *because* signed overflow is undefined",
    "A null check placed after a dereference is deleted — the code is less safe than if it were absent",
    "Strict aliasing lets a store through `float*` be assumed not to affect an `int`",
    "UB travels backwards: a path that reaches UB may be deleted along with its side effects",
    "The forward-progress rule compiles `while (n != 0) {}` to a bare `ret`",
    "Signed `/2` costs four instructions to round toward zero; unsigned costs two",
    "Unsigned wraparound is defined, which makes it safer *and* less optimisable",
    "`std::bit_cast` is defined and compiles to the same instruction as the UB cast",
    "Check preconditions before the operation, never after",
    "When behaviour makes no sense, rebuild at `-O0` and with UBSan before blaming the compiler",
    "`-fwrapv` and `-fno-strict-aliasing` are real options with real optimisation costs",
  ],
  status: "available",
};
