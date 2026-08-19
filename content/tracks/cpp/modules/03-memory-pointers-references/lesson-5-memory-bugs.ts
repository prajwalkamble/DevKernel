import type { Lesson } from "@/content/types";

export const memoryBugsLesson: Lesson = {
  id: "cpp-memory-bugs",
  slug: "memory-bugs-and-sanitizers",
  moduleSlug: "memory-pointers-references",
  title: "The Five Memory Bugs & the Sanitizers That Find Them",
  summary:
    "Use-after-free, double free, leak, buffer overrun and allocator mismatch — each one written deliberately, run, and caught by AddressSanitizer with a file, a line and a stack trace. The most valuable half hour in this track.",
  estimatedMinutes: 35,
  objectives: [
    "Recognise all five memory bug classes by their symptom",
    "Explain why these bugs so often appear to work",
    "Build with AddressSanitizer and UndefinedBehaviorSanitizer and read their reports",
    "Know what each sanitizer catches and what it does not",
    "Make sanitized builds part of your normal workflow, not a last resort",
  ],
  sections: [
    {
      id: "why-hard",
      heading: "Why memory bugs are the hardest kind",
      body: [
        "In a managed language, an out-of-range index raises an exception at the moment of the mistake, with a stack trace pointing at the line responsible. That is the normal experience of debugging, and C++ does not give it to you by default.",
        "The reason is the zero-overhead principle from lesson 1: checking every access costs cycles on every access, including the overwhelming majority that are correct. So C++ does not check, and an incorrect access simply reads or writes whatever is at that address.",
        "Three properties follow, and together they are what make these bugs expensive.",
        "**They are silent.** Nothing reports the mistake at the moment it happens.",
        "**They are delayed.** Corrupting memory here causes a crash *there*, possibly minutes later in unrelated code, with a stack trace pointing at the innocent victim.",
        "**They are inconsistent.** Whether a use-after-free returns the old value or garbage depends on what the allocator did in between, so the bug appears and disappears with unrelated changes, optimisation levels, and machines.",
        "**The sanitizers solve this completely enough that not using them is negligence.** They restore the managed-language experience — an error at the moment of the mistake, with file, line and stack trace — at the cost of roughly 2x runtime and 3x memory in your debug build.",
      ],
    },
    {
      id: "the-five",
      heading: "The five bugs, each one caught",
      body: [
        "Every example below was compiled with `-fsanitize=address -g` and run. The output is what the sanitizer actually printed.",
      ],
      examples: [
        {
          id: "use-after-free",
          title: "1. Use after free",
          lang: "cpp",
          code: `#include <iostream>

int main() {
    int* p = new int(42);
    delete p;
    std::cout << *p << '\\n';     // use-after-free
}`,
          output: `==58230==ERROR: AddressSanitizer: heap-use-after-free on address 0x502000000010
READ of size 4 at 0x502000000010 thread T0
    #0 0x558d5241827e in main bug1.cpp:5
    #1 0x7fc6e9635ca7 in __libc_start_call_main
    #2 0x558d52418100 in _start`,
          explanation:
            "**Without the sanitizer this program very often prints `42`**, because freeing memory does not erase it — the allocator just marks the block available. That is exactly what makes the bug so dangerous: it works in testing and fails when something else happens to reuse the block. The sanitizer names the file, the line, the size of the read, and would also report where the memory was allocated and freed.",
        },
        {
          id: "double-free",
          title: "2. Double free",
          lang: "cpp",
          code: `#include <iostream>

int main() {
    int* p = new int(42);
    delete p;
    delete p;                    // double free
}`,
          output: `==58237==ERROR: AddressSanitizer: attempting double-free on 0x502000000010 in thread T0:
    #0 operator delete(void*, unsigned long)
    #1 0x55d7baa9322d in main bug2.cpp:5`,
          explanation:
            "Freeing twice corrupts the allocator's own bookkeeping, which is why the eventual crash is usually inside `malloc` in a completely unrelated part of the program. **Setting a pointer to `nullptr` after deleting it prevents this** — since `delete nullptr` is a no-op — but that is a workaround for a design problem. The real fix is that the pointer should not have been deletable twice, which is what `unique_ptr` guarantees structurally.",
        },
        {
          id: "leak",
          title: "3. Memory leak",
          lang: "cpp",
          code: `#include <iostream>

int main() {
    int* p = new int[100];
    p[0] = 1;
    std::cout << p[0] << '\\n';   // leaked: never deleted
}`,
          output: `1

=================================================================
==58250==ERROR: LeakSanitizer: detected memory leaks

Direct leak of 400 byte(s) in 1 object(s) allocated from:
    #0 operator new[](unsigned long)
    #1 0x5605b84f11ba in main bug3.cpp:3`,
          explanation:
            "**The program ran correctly and printed `1`** — a leak has no effect on output. LeakSanitizer runs at exit and reports the size, the count, and the exact allocation site. Note the distinction it draws: a *direct* leak is memory nothing points to any more, while an *indirect* leak is memory reachable only from something already leaked. Fixing the direct one usually resolves both.",
        },
        {
          id: "buffer-overrun",
          title: "4. Buffer overrun",
          lang: "cpp",
          code: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{1, 2, 3};
    // Unsigned countdown: i wraps past zero instead of going negative.
    for (std::size_t i = v.size() - 1; i >= 0; --i) {
        std::cout << v[i];
        if (i > 100) break;
    }
    std::cout << '\\n';
}`,
          output: `==23959==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x50200000000c
READ of size 4 at 0x50200000000c thread T0
    #0 0x55f2df92c475 in main loop.cpp:10`,
          explanation:
            "This is the unsigned countdown bug from module 2, now seen from the memory side. **Without the sanitizer it printed `3210`** — four values from a three-element vector, the last one being whatever happened to sit past the end. With it, the program stops at the exact line. Note that `v[i]` is *not* bounds-checked; `v.at(i)` is, and throws `std::out_of_range`, which is a reasonable choice where the index comes from outside your program.",
        },
        {
          id: "alloc-mismatch",
          title: "5. Allocator mismatch",
          lang: "cpp",
          code: `int main() {
    int* p = new int[10];
    delete p;                    // WRONG: allocated with new[], freed with delete
}`,
          output: `==58258==ERROR: AddressSanitizer: alloc-dealloc-mismatch
              (operator new [] vs operator delete) on 0x504000000010
    #0 operator delete(void*, unsigned long)
    #1 0x55d3879491b4 in main bug4.cpp:4`,
          explanation:
            "For `int` this frequently appears to work, because there are no destructors to skip — which is precisely how it survives code review. Change the element type to something with a destructor and you leak every element but the first, silently. **The sanitizer names both operators involved**, which makes the fix obvious.",
        },
      ],
    },
    {
      id: "using-sanitizers",
      heading: "Using the sanitizers",
      body: [
        "Two flags, and they cover different ground.",
        "**`-fsanitize=address`** — AddressSanitizer, or ASan. Catches use-after-free, double free, buffer overruns on heap, stack and globals, use-after-return, allocator mismatches, and (via the bundled LeakSanitizer) memory leaks at exit. Costs about 2x runtime and 3x memory.",
        "**`-fsanitize=undefined`** — UBSan. Catches signed integer overflow, invalid shifts, misaligned or null pointer use, out-of-range enum and bool values, and reaching the end of a value-returning function. Costs about 20% runtime.",
        "They compose: `-fsanitize=address,undefined` is the standard debug combination. **ThreadSanitizer (`-fsanitize=thread`) catches data races** and is covered in module 11 — it is *not* compatible with ASan and must be a separate build.",
        "Always add **`-g`** so the reports carry file names and line numbers instead of raw addresses, and **`-fno-omit-frame-pointer`** for more reliable stack traces.",
        "The most important thing about sanitizers: **they only report bugs on code paths you actually execute.** They are dynamic analysis, not proof. That means their value is proportional to your test coverage, and the highest-leverage setup is running your test suite under them in CI.",
      ],
      examples: [
        {
          id: "sanitizer-workflow",
          title: "The build commands worth memorising",
          lang: "bash",
          code: `# Development build — this should be your default while writing code.
$ g++ -std=c++20 -Wall -Wextra -g -O1 \\
      -fsanitize=address,undefined -fno-omit-frame-pointer \\
      main.cpp -o app-debug

# Make UBSan stop at the first error with a stack trace, rather than
# printing and continuing.
$ export UBSAN_OPTIONS=print_stacktrace=1:halt_on_error=1

# ASan: keep going after the first error, and check for leaks.
$ export ASAN_OPTIONS=detect_leaks=1:abort_on_error=0

# Data races need a separate build — ASan and TSan cannot be combined.
$ g++ -std=c++20 -g -fsanitize=thread main.cpp -o app-tsan

# Release build — no sanitizers.
$ g++ -std=c++20 -Wall -Wextra -O2 -DNDEBUG main.cpp -o app`,
          explanation:
            "**`-O1` rather than `-O0` for the sanitized build** is a deliberate choice: it is roughly twice as fast to run and the diagnostics stay accurate, because the sanitizers integrate with the optimiser. On macOS, LeakSanitizer is not enabled by default and needs `ASAN_OPTIONS=detect_leaks=1`. MSVC supports `/fsanitize=address` on Windows.",
        },
      ],
      pitfalls: [
        {
          title: "Sanitizers do not catch everything",
          body: "ASan does not detect uninitialised reads — that is MemorySanitizer (`-fsanitize=memory`), which is Clang-only and requires every library including the standard library to be instrumented, so it is much harder to adopt. Valgrind's `memcheck` catches uninitialised reads without recompiling, at roughly 20x slowdown. Neither ASan nor UBSan detects logic errors, iterator invalidation in all cases, or races (that is TSan). And none of them see a path your tests never run.",
        },
      ],
    },
    {
      id: "prevention",
      heading: "Prevention beats detection",
      body: [
        "Sanitizers find bugs. Not writing them is better, and modern C++ makes that mostly achievable.",
        "**Use containers instead of raw arrays.** `std::vector` and `std::string` cannot leak and know their own size.",
        "**Use smart pointers instead of owning raw pointers.** `unique_ptr` cannot double-free and cannot forget to free.",
        "**Use `.at()` when the index comes from outside your program** — user input, a file, a network message. It costs a comparison and throws `std::out_of_range` instead of corrupting memory.",
        "**Use `std::span` instead of a pointer and a length**, so the two cannot become inconsistent.",
        "**Use range-based `for`** instead of index arithmetic wherever possible.",
        "Do all of that and the remaining surface for memory bugs is small: the code that implements resource-owning types, and the boundary with C libraries. **Both are exactly where you should concentrate your review and your sanitizer runs.**",
      ],
      examples: [
        {
          id: "at-vs-brackets",
          title: "Bounds checking where the index is untrusted",
          lang: "cpp",
          code: `#include <iostream>
#include <stdexcept>
#include <vector>

int main() {
    std::vector<int> v{1, 2, 3};

    std::cout << v[1] << '\\n';        // no check — fast, and your responsibility

    try {
        std::cout << v.at(10) << '\\n'; // checked — throws
    } catch (const std::out_of_range& e) {
        std::cout << "out_of_range: " << e.what() << '\\n';
    }
}`,
          output: `2
out_of_range: vector::_M_range_check: __n (which is 10) >= this->size() (which is 3)`,
          explanation:
            "**The message names both the offending index and the actual size**, which is far more useful than a segfault. The choice between `[]` and `.at()` is a genuine trade-off rather than a rule: use `[]` in a loop whose bounds you just derived from `size()`, and `.at()` when the index came from a user, a file or a network packet. Note that GCC and MSVC both offer a debug mode (`-D_GLIBCXX_ASSERTIONS`, `/D_ITERATOR_DEBUG_LEVEL=1`) that adds checks to `[]` as well, which is worth enabling in debug builds.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why are memory bugs harder to debug than exceptions in a managed language?",
      answer:
        "Because nothing reports them when they happen. C++ does not bounds-check or validate pointers, following the zero-overhead principle, so an incorrect access simply reads or writes whatever is at that address. The result is silent, delayed and inconsistent: corrupting memory in one place causes a crash somewhere unrelated later, and whether it manifests depends on allocator behaviour, optimisation level and machine. AddressSanitizer restores the immediate-error experience with a file, line and stack trace at about 2x runtime cost.",
    },
    {
      question: "What is a use-after-free and why is it dangerous?",
      answer:
        "Dereferencing a pointer to memory that has been freed. It is dangerous because freeing does not erase the contents — the allocator merely marks the block available — so the read frequently returns the old, correct-looking value and the program appears to work. It fails only once something else reuses that block, which makes it intermittent and environment-dependent. It is also a major security vulnerability class, since an attacker who controls what gets allocated into the freed block can control what the stale pointer sees.",
    },
    {
      question: "What does AddressSanitizer catch, and what does it miss?",
      answer:
        "It catches use-after-free, double free, heap, stack and global buffer overflows, use-after-return, allocator mismatches, and, through the bundled LeakSanitizer, leaks at exit. It does **not** catch uninitialised reads — that is MemorySanitizer, which is Clang-only and needs the whole stack instrumented — nor data races, which need ThreadSanitizer in a separate build since the two are incompatible. Most importantly it is dynamic analysis, so it only sees code paths that actually execute; its value is proportional to test coverage, which is why running the test suite under it in CI is the high-leverage setup.",
    },
    {
      question: "When should you use `v.at(i)` rather than `v[i]`?",
      answer:
        "When the index comes from outside your program — user input, a file, a network message — because `.at()` throws `std::out_of_range` naming both the index and the size, whereas `[]` is unchecked and silently reads out of bounds. Use `[]` in loops whose bounds you just derived from `size()`, where the check is provably redundant and would cost a comparison per iteration. Both GCC and MSVC also offer debug modes that add checks to `[]`, which is worth enabling in development builds.",
    },
    {
      question: "How do you prevent memory bugs rather than detect them?",
      answer:
        "Move ownership into the type system and stop hand-managing memory. Containers instead of raw arrays, so nothing can leak or lose its length; `unique_ptr` and `shared_ptr` instead of owning raw pointers, so nothing can double-free or be forgotten; `std::span` instead of a pointer plus a length, so the two cannot diverge; range-based `for` instead of index arithmetic; and `.at()` for untrusted indices. What remains is the code implementing resource-owning types and the boundary with C libraries — which is where review and sanitizer runs should concentrate.",
    },
  ],
  takeaways: [
    "Memory bugs are silent, delayed and inconsistent — the crash is rarely where the mistake is",
    "Freeing does not erase memory, which is why use-after-free so often returns the right answer in testing",
    "`-fsanitize=address,undefined -g` restores immediate, precise errors for about 2x runtime",
    "ASan finds use-after-free, double free, overruns, leaks and allocator mismatches — not uninitialised reads or races",
    "ThreadSanitizer needs its own build; it cannot be combined with ASan",
    "Sanitizers only see paths you execute, so run your test suite under them in CI",
    "`v[i]` is unchecked and `v.at(i)` throws `std::out_of_range` naming the index and the size",
    "Prevention is containers, smart pointers, `std::span` and range-based `for` — detection is the backstop",
  ],
  status: "available",
};
