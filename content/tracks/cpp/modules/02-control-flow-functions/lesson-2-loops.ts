import type { Lesson } from "@/content/types";

export const loopsLesson: Lesson = {
  id: "cpp-loops",
  slug: "loops",
  moduleSlug: "control-flow-functions",
  title: "Loops: while, for & the Range-Based for",
  summary:
    "The four loop forms, why the range-based `for` should be your default, `break` and `continue`, and the two index bugs — signed against unsigned, and counting down with an unsigned type — that the compiler will warn you about if you let it.",
  estimatedMinutes: 30,
  objectives: [
    "Choose between `while`, `do`-`while`, the classic `for` and the range-based `for`",
    "Use `const auto&` and `auto&` correctly in a range-based loop",
    "Use `break` and `continue`, and know how to leave a nested loop",
    "Recognise the signed/unsigned comparison warning and fix it properly",
    "Explain why a countdown loop with `std::size_t` never terminates",
  ],
  sections: [
    {
      id: "forms",
      heading: "Four ways to loop",
      body: [
        "**`while (condition)`** — test first, then run. The body may execute zero times. Use it when you do not know how many iterations there will be.",
        "**`do { … } while (condition);`** — run first, then test. The body always executes **at least once**. Note the mandatory semicolon after the closing parenthesis. Genuinely useful for input prompts and retry logic, and rare otherwise.",
        "**`for (init; condition; step)`** — the classic three-part loop. All three parts are optional; `for (;;)` is an infinite loop. Use it when you need an index, a step other than one, or several counters.",
        "**`for (declaration : range)`** — the range-based `for`, added in C++11. **This should be your default.** It works with any container, array or object exposing `begin()` and `end()`, it cannot go out of bounds, and it cannot get the termination condition wrong.",
      ],
      examples: [
        {
          id: "loop-forms",
          title: "All four, and the reference forms that matter",
          lang: "cpp",
          code: `#include <iostream>
#include <vector>
#include <string>

int main() {
    std::vector<std::string> names{"Ada", "Grace", "Alan"};

    // Range-based for: the default choice. const auto& avoids copying.
    for (const auto& n : names) std::cout << n << ' ';
    std::cout << '\\n';

    // With an index, when you genuinely need one.
    for (std::size_t i = 0; i < names.size(); ++i)
        std::cout << i << ':' << names[i] << ' ';
    std::cout << '\\n';

    // Modifying in place needs a non-const reference.
    for (auto& n : names) n += "!";
    for (const auto& n : names) std::cout << n << ' ';
    std::cout << '\\n';

    int countdown = 3;
    while (countdown > 0) { std::cout << countdown-- << ' '; }
    std::cout << '\\n';

    int attempts = 0;
    do { ++attempts; } while (attempts < 3);   // body runs at least once
    std::cout << "attempts: " << attempts << '\\n';
}`,
          output: `Ada Grace Alan
0:Ada 1:Grace 2:Alan
Ada! Grace! Alan!
3 2 1
attempts: 3`,
          explanation:
            "**The three range-based spellings are the thing to internalise.** `const auto&` reads without copying — the default. `auto&` is required to modify elements in place. Plain `auto` **copies each element**, which is correct only when you want a copy, and is a silent performance problem for anything larger than a machine word. Note that `for (auto n : names) n += \"!\"` would compile, run, and change nothing at all.",
        },
      ],
      pitfalls: [
        {
          title: "Do not modify a container while ranging over it",
          body: "Calling `push_back` on a `std::vector` inside a range-based `for` over that vector can reallocate its storage, which invalidates the iterators the loop is using — the loop then reads freed memory. The same applies to `erase`. If you must add or remove during iteration, use an index-based loop and re-check `size()` each time, or collect the changes and apply them after the loop. Module 8 covers invalidation rules per container.",
        },
      ],
    },
    {
      id: "break-continue",
      heading: "break and continue",
      body: [
        "**`break`** exits the innermost enclosing loop or `switch` immediately. **`continue`** skips the rest of the current iteration and moves to the next one — in a `for` loop, the step expression still runs.",
        "Both are worth using. An early `continue` to skip uninteresting items keeps the main body of a loop unindented, which is usually easier to read than wrapping the whole thing in an `if`.",
        "**There is no labelled break in C++.** To leave a nested loop you have three options: a flag tested in the outer condition, a `goto` to a label after the loops (legitimate here, and one of the very few defensible uses), or — usually best — **extract the loops into a function and `return`**.",
      ],
      examples: [
        {
          id: "break-continue-demo",
          title: "Skipping, stopping, and leaving a nested loop",
          lang: "cpp",
          code: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{1, 2, 3, 4, 5, 6};
    int total = 0;
    for (int x : v) {
        if (x % 2 == 0) continue;        // skip evens
        if (x > 4) break;                // stop entirely
        total += x;
    }
    std::cout << "total: " << total << '\\n';

    // Breaking out of nested loops: a flag, or a function with return.
    bool found = false;
    for (int i = 0; i < 3 && !found; ++i)
        for (int j = 0; j < 3; ++j)
            if (i * j == 4) {
                std::cout << i << ',' << j << '\\n';
                found = true;
                break;
            }
}`,
          output: `total: 4
2,2`,
          explanation:
            "Trace the first loop: 1 is odd and not > 4, so total = 1. 2 is skipped. 3 adds, total = 4. 4 is skipped. **5 is odd and > 4, so `break`** — total stays 4, and 6 is never seen. The nested search finds 2 × 2 = 4. The `&& !found` in the outer condition is what stops the outer loop; the inner `break` alone would only end the inner one.",
        },
      ],
    },
    {
      id: "index-bugs",
      heading: "The two index bugs, and the warnings that catch them",
      body: [
        "Container `size()` returns `std::size_t`, an **unsigned** 64-bit integer. That single fact causes both of the classic loop bugs, and both are caught by warnings you already have on.",
        "**Bug 1: comparing a signed index against an unsigned size.** `for (int i = 0; i < v.size(); ++i)` compares `int` with `std::size_t`, so `i` is converted to unsigned. It works fine for any container you will realistically have, and `-Wsign-compare` (part of `-Wextra`) flags it anyway because the conversion is the kind of thing that bites elsewhere.",
        "**Bug 2: counting down with an unsigned index.** `for (std::size_t i = v.size() - 1; i >= 0; --i)` never terminates correctly, because **an unsigned value is always `>= 0`**. When `i` is 0 and you decrement it, it wraps to the largest `std::size_t` rather than becoming −1, and the next iteration reads far out of bounds. GCC's `-Wtype-limits` says exactly this: *comparison of unsigned expression in `>= 0` is always true*.",
        "The fixes, in order of preference: **use a range-based `for`**, which removes the index entirely; use `std::ranges::reverse_view` (or `rbegin()`/`rend()`) to iterate backwards; use `std::ssize(v)` from C++20, which returns a **signed** size; or, if you must, restructure the countdown as `for (std::size_t i = v.size(); i-- > 0;)`, which is correct but earns its reputation for looking like a typo.",
      ],
      examples: [
        {
          id: "index-warnings",
          title: "Both bugs, both warnings, and what actually happens",
          lang: "cpp",
          code: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{1, 2, 3};

    // Signed/unsigned comparison — the classic warning.
    for (int i = 0; i < v.size(); ++i) std::cout << v[i];
    std::cout << '\\n';

    // Reverse loop with an unsigned index: never terminates correctly.
    for (std::size_t i = v.size() - 1; i >= 0; --i) {
        std::cout << v[i];
        if (i > 100) break;   // safety valve so this demo ends
    }
    std::cout << '\\n';
}`,
          output: `warning: comparison of integer expressions of different signedness:
         'int' and 'std::vector<int>::size_type' {aka 'long unsigned int'} [-Wsign-compare]
    8 |     for (int i = 0; i < v.size(); ++i) std::cout << v[i];
      |                     ~~^~~~~~~~~~

warning: comparison of unsigned expression in '>= 0' is always true [-Wtype-limits]
   12 |     for (std::size_t i = v.size() - 1; i >= 0; --i) {
      |                                        ~~^~~~

123
3210`,
          explanation:
            "The second loop printed **`3210`** — four characters from a three-element vector. It read indices 2, 1, 0, then `i` wrapped to 18446744073709551615 and `v[i]` read memory far outside the vector, which happened to contain a zero. Under AddressSanitizer the same program stops with `heap-buffer-overflow ... READ of size 4` and a stack trace pointing at that exact line. **This is the difference between a warning you ignored and a crash you can debug.**",
        },
      ],
      pitfalls: [
        {
          title: "`v.size() - 1` on an empty container is not −1",
          body: "It is the largest `std::size_t`. So `for (std::size_t i = 0; i <= v.size() - 1; ++i)` on an empty vector does not skip the loop — it iterates about 18 quintillion times, reading out of bounds on the first one. Always compare with `<` against `size()` rather than `<=` against `size() - 1`, or better, avoid the index.",
        },
      ],
    },
    {
      id: "structured-bindings",
      heading: "Ranging over pairs and maps",
      body: [
        "When the elements are pairs or structs — most obviously when iterating a `std::map` — **structured bindings** (C++17) let you name the parts directly instead of writing `.first` and `.second`.",
        "The same reference rules apply: `const auto& [k, v]` to read, `auto& [k, v]` to modify. For a `std::map` the key is `const` regardless, since changing it would break the ordering.",
      ],
      examples: [
        {
          id: "structured-binding-loop",
          title: "Naming the parts instead of .first and .second",
          lang: "cpp",
          code: `#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, int> scores{{"Ada", 95}, {"Grace", 88}, {"Alan", 91}};

    for (const auto& [name, score] : scores) {
        std::cout << name << ": " << score << '\\n';
    }

    // Modify the values in place.
    for (auto& [name, score] : scores) score += 1;

    std::cout << "Ada is now " << scores["Ada"] << '\\n';
}`,
          output: `Ada: 95
Alan: 91
Grace: 88
Ada is now 96`,
          explanation:
            "**The output is in alphabetical order, not insertion order** — `std::map` is a sorted container, which is one of the two things that distinguishes it from `std::unordered_map`. Without structured bindings the loop body would read `entry.second += 1`, which says nothing about what `second` means. Note the loop variable is `name` even though it is unused in the second loop; you can write `[[maybe_unused]]` or simply ignore the warning, since `-Wunused-variable` does not fire on structured bindings in GCC.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why prefer a range-based `for` to an indexed loop?",
      answer:
        "It removes the two things that go wrong: the bounds and the termination condition. You cannot run past the end, cannot get an off-by-one, and cannot write the signed/unsigned comparison bug. It also works uniformly across arrays, containers and anything with `begin()`/`end()`. Use an indexed loop when you genuinely need the position, a step other than one, or to iterate two containers in lockstep.",
    },
    {
      question: "What is the difference between `for (auto x : v)`, `for (auto& x : v)` and `for (const auto& x : v)`?",
      answer:
        "The first copies each element, so modifying `x` changes only the copy and large elements cost a copy per iteration. The second binds a reference, so modifications affect the container. The third binds a read-only reference, which is the default you should reach for — no copy, no accidental mutation. The failure mode worth remembering is `for (auto x : v) x += 1;`, which compiles, runs, and changes nothing.",
    },
    {
      question: "Why does `for (std::size_t i = v.size() - 1; i >= 0; --i)` fail?",
      answer:
        "`std::size_t` is unsigned, so `i >= 0` is always true — GCC's `-Wtype-limits` says exactly that. When `i` reaches 0 and is decremented it wraps to the maximum `std::size_t` rather than going negative, and the next iteration indexes far out of bounds. AddressSanitizer reports it as a heap-buffer-overflow read. Fix it with a reverse range, `rbegin()`/`rend()`, `std::ssize()` for a signed size, or the `for (std::size_t i = v.size(); i-- > 0;)` idiom.",
    },
    {
      question: "How do you break out of a nested loop in C++?",
      answer:
        "There is no labelled break. The options are a flag tested in the outer loop's condition, a `goto` to a label after both loops — one of the few genuinely defensible uses of `goto` — or extracting the loops into their own function and using `return`, which is usually the cleanest because it also gives the operation a name. Since C++20, `std::ranges` algorithms like `find_if` often remove the need entirely.",
    },
    {
      question: "When is `do`-`while` the right choice?",
      answer:
        "When the body must run at least once before the condition can be evaluated — typically prompting for input, then testing whether it was valid, or a retry loop where you must attempt the operation before you know whether to repeat. It is rare precisely because most loop conditions can be checked up front. Remember the semicolon after the closing `while (...)`, which is required and easy to forget.",
    },
  ],
  takeaways: [
    "Make the range-based `for` your default; it cannot go out of bounds or get the condition wrong",
    "`const auto&` to read, `auto&` to modify, plain `auto` copies — and `for (auto x : v) x += 1;` silently does nothing",
    "`do`-`while` runs at least once and needs a trailing semicolon",
    "`continue` skips to the next iteration and still runs a `for` loop's step expression",
    "There is no labelled break — use a flag, a `goto` past the loops, or extract to a function and `return`",
    "`size()` is unsigned: `i >= 0` is always true, and `size() - 1` on an empty container is enormous",
    "`std::ssize(v)` (C++20) gives a signed size when you really do need an index",
    "Structured bindings — `for (const auto& [k, v] : map)` — beat `.first` and `.second` for readability",
  ],
  status: "available",
};
