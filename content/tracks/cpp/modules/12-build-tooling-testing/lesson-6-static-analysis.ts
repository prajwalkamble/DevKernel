import type { Lesson } from "@/content/types";

export const staticAnalysisLesson: Lesson = {
  id: "cpp-static-analysis",
  slug: "static-analysis-and-warnings-worth-enforcing",
  moduleSlug: "build-tooling-testing",
  title: "Static Analysis, and the Warnings Worth Turning On and Enforcing",
  summary:
    "Bugs found without running anything. The warning set that pays for itself, nine real diagnostics catching mistakes from earlier modules, and GCC's path-sensitive analyzer finding a leak, a use-after-free and a double free with CWE identifiers attached.",
  estimatedMinutes: 35,
  objectives: [
    "Enable a warning set that catches real bugs",
    "Decide whether `-Werror` belongs in your build",
    "Use GCC's `-fanalyzer` and know what it can prove",
    "Choose between clang-tidy, cppcheck and the compiler's own analysis",
    "Introduce analysis into an existing codebase without drowning",
  ],
  sections: [
    {
      id: "warnings",
      heading: "The warnings worth enabling",
      body: [
        "**The compiler is the static analyser you already have**, and its default settings find almost nothing. `-Wall` is not \"all warnings\" — it is a historical subset — and `-Wall -Wextra` together still leave several bug-catching warnings off.",
        "The set worth adding, and what each one catches:",
        "**`-Wshadow`** — a local hiding an outer name, which is how a variable gets updated and the update goes nowhere. **`-Wconversion`** and **`-Wsign-conversion`** — implicit narrowing and signedness changes, which is where silent data loss lives. **`-Wnon-virtual-dtor`** — module 6's undefined behaviour, caught at compile time. **`-Woverloaded-virtual`** — a derived function hiding a base virtual instead of overriding it, module 6 again. **`-Wold-style-cast`** — C casts, which hide `const_cast` and `reinterpret_cast` behind innocuous syntax. **`-Wcast-align`**, **`-Wdouble-promotion`**, **`-Wformat=2`**, **`-Wnull-dereference`**, **`-Wuseless-cast`**.",
        "**`-Wpedantic`** rejects non-standard extensions, which matters if you will ever change compiler.",
        "**The example below turns nine real diagnostics out of one small file**, several of them bugs this track has spent whole lessons on.",
      ],
      examples: [
        {
          id: "warnings-output",
          title: "Nine warnings from one file",
          lang: "bash",
          code: `// warn.cpp -- every one of these is a real bug
#include <cstdio>
#include <vector>

int shadowAndSign(const std::vector<int>& v) {
    int total = 0;
    for (int i = 0; i < v.size(); ++i) {      // signed/unsigned comparison
        int total = v[i];                     // shadows the outer 'total'
        (void)total;
    }
    return total;                             // always 0 -- the bug
}

class Base {
public:
    virtual void draw() const {}
    ~Base() {}                                 // non-virtual dtor
};
class Derived : public Base {
public:
    void draw() { }                            // hides, does not override
};

int uninitialised() {
    int x;
    return x;                                  // used uninitialised
}

int main() {
    std::vector<int> v{1,2,3};
    std::printf("%d\\n", shadowAndSign(v));
    std::printf("%s\\n", 42);                   // wrong printf format
    Base* b = new Derived;
    delete b;                                  // delete via non-virtual dtor
    return uninitialised();
}

$ g++ -std=c++20 -Wall -Wextra -Wshadow -Wconversion \\
      -Wnon-virtual-dtor -Wold-style-cast -Woverloaded-virtual -c warn.cpp`,
          output: `7:23:  warning: comparison of integer expressions of different signedness:
       'int' and 'std::vector<int>::size_type' [-Wsign-compare]
8:13:  warning: declaration of 'total' shadows a previous local [-Wshadow]
14:7:  warning: 'class Base' has virtual functions and accessible
       non-virtual destructor [-Wnon-virtual-dtor]
19:7:  warning: base class 'class Base' has accessible non-virtual
       destructor [-Wnon-virtual-dtor]
19:7:  warning: 'class Derived' has virtual functions and accessible
       non-virtual destructor [-Wnon-virtual-dtor]
16:18: warning: 'virtual void Base::draw() const' was hidden
       [-Woverloaded-virtual=]
32:19: warning: format '%s' expects argument of type 'char*',
       but argument 2 has type 'int' [-Wformat=]
34:5:  warning: deleting object of polymorphic class type 'Base' which has
       non-virtual destructor might cause undefined behavior
       [-Wdelete-non-virtual-dtor]
26:12: warning: 'x' is used uninitialized [-Wuninitialized]`,
          explanation:
            "**Nine diagnostics, and at least four are bugs this track devoted lessons to.** The `-Wnon-virtual-dtor` and `-Wdelete-non-virtual-dtor` pair is module 6 lesson 5's undefined behaviour caught before the program runs. `-Woverloaded-virtual` is module 6 lesson 6's silent non-override. `-Wshadow` caught a function that always returns 0. **Every one of these is free** — they cost nothing at runtime and a few seconds of compile time, and the only reason they are off by default is backward compatibility with code written decades ago.",
        },
      ],
      pitfalls: [
        {
          title: "`-Werror` belongs in CI, not in the default developer build",
          body: "Making warnings errors is the only way to stop them accumulating, and putting it in the default build is still usually wrong: a new compiler version adds warnings, and suddenly nobody can build the project until someone fixes them all — including people trying to ship an unrelated hotfix. The workable arrangement is warnings-as-errors in CI, where a *specific pinned* compiler version is used, and warnings-as-warnings locally. In CMake, `-Werror` behind an option defaulting to OFF and turned on by the CI preset. Also apply your warning flags `PRIVATE`, so consumers of your library are not forced into your policy, and mark third-party includes as `SYSTEM` so their headers do not produce warnings you cannot fix.",
        },
      ],
    },
    {
      id: "fanalyzer",
      heading: "GCC's `-fanalyzer`",
      body: [
        "Ordinary warnings are mostly local and syntactic. **`-fanalyzer`, added in GCC 10, is a path-sensitive symbolic execution engine**: it explores execution paths through the function and tracks the state of each value along them.",
        "That lets it prove things a warning cannot — that on *this particular path* a pointer is freed and then dereferenced, or allocated and then leaked on an early return.",
        "**It reports with CWE identifiers**, which is what security tooling consumes, and it prints the *path* of events leading to the bug rather than just the final line.",
        "**Its main limitation is that C++ support is much weaker than C support.** The GCC documentation is explicit that the analyzer is aimed at C; it works on C++ but misses a great deal, and the memory-management checks assume `malloc`/`free` rather than `new`/`delete` or RAII. The example below is deliberately in C for that reason.",
        "**It is slow** — several times normal compile time on large functions — so it belongs in a nightly or pre-merge job rather than every incremental build. It also has false positives on complex code, which is the usual price of path-sensitive analysis.",
      ],
      examples: [
        {
          id: "analyzer",
          title: "Four memory bugs found without running anything",
          lang: "bash",
          code: `/* an.c -- four classic memory bugs */
#include <stdlib.h>

int leaky(int n) {
    int* p = malloc(sizeof(int) * (size_t)n);
    if (n < 0) return -1;              /* leaks p */
    p[0] = 1;
    int v = p[0];
    free(p);
    return v;
}

int useAfterFree(void) {
    int* p = malloc(sizeof(int));
    free(p);
    return *p;                          /* use after free */
}

int doubleFree(void) {
    int* p = malloc(sizeof(int));
    free(p);
    free(p);                            /* double free */
    return 0;
}

int nullDeref(int flag) {
    int* p = flag ? malloc(sizeof(int)) : NULL;
    return *p;                          /* p may be NULL */
}

$ gcc -fanalyzer -c an.c`,
          output: `6:23:  warning: leak of 'p' [CWE-401] [-Wanalyzer-malloc-leak]
7:10:  warning: dereference of possibly-NULL 'p' [CWE-690]
       [-Wanalyzer-possible-null-dereference]
16:12: warning: use after 'free' of 'p' [CWE-416] [-Wanalyzer-use-after-free]
22:5:  warning: double-'free' of 'p' [CWE-415] [-Wanalyzer-double-free]
28:12: warning: dereference of NULL 'p' [CWE-476] [-Wanalyzer-null-dereference]
28:12: warning: use of uninitialized value '*p' [CWE-457]
       [-Wanalyzer-use-of-uninitialized-value]
28:12: warning: dereference of possibly-NULL 'p' [CWE-690]
       [-Wanalyzer-possible-null-dereference]

# All seven found at COMPILE time. Nothing was executed, no test was
# written, and no input had to reach the buggy path.`,
          explanation:
            "**The leak on line 6 is the one that shows what path-sensitivity buys.** The allocation succeeds, then an early return on `n < 0` skips the `free` — a warning that only looked at statements could never see that, because every individual line is fine. Note also that the analyzer found `malloc` may return NULL and flagged the unchecked dereference, which is a real bug the code as written has. The CWE identifiers are what security scanners and compliance tooling consume.",
        },
      ],
    },
    {
      id: "tools",
      heading: "clang-tidy, cppcheck and the rest",
      body: [
        "**clang-tidy** is the most valuable of the dedicated tools. It uses Clang's real parser, so it understands templates and overload resolution properly, and it has hundreds of checks organised into families: `bugprone-*`, `cert-*`, `cppcoreguidelines-*`, `modernize-*`, `performance-*`, `readability-*`, `clang-analyzer-*`. **Many checks can apply their own fixes** with `--fix`, which makes `modernize-*` a practical way to bring a codebase forward.",
        "**cppcheck** is independent of any compiler, so it catches genuinely different things. That is not a slogan: on the same file below, clang-tidy produced fourteen findings and **missed the `new int[10]` freed with plain `delete`** entirely, while cppcheck caught it as `mismatchAllocDealloc` — and also flagged a by-value `std::string` parameter that clang-tidy did not. It has a low false-positive rate, is fast, and `--error-exitcode=1` makes it usable in CI.",
        "**Commercial tools** — Coverity, PVS-Studio, SonarQube — go deeper with whole-program analysis and are worth it in regulated or safety-critical contexts.",
        "**All of them need `compile_commands.json`**, which is why `CMAKE_EXPORT_COMPILE_COMMANDS ON` from lesson 1 matters. Without it, a tool has to guess your include paths and defines, and guesses badly.",
        "**Introducing analysis into an existing codebase is the hard part**, and the failure mode is generating 4,000 findings that nobody triages and everyone learns to ignore. The approach that works: enable a *small* set of high-value checks, fix those, ratchet up. Run analysis **only on the diff** in pull requests — `clang-tidy-diff.py` does this — so new code is held to the standard without requiring the backlog to be fixed first. Use `NOLINTNEXTLINE` with a *reason* for genuine false positives.",
      ],
      examples: [
        {
          id: "clang-tidy",
          title: "A `.clang-tidy` that will not drown you, and CI wiring",
          lang: "bash",
          code: `# ── .clang-tidy : start narrow, ratchet up ───────────────────────
Checks: >
  -*,
  bugprone-*,
  -bugprone-easily-swappable-parameters,
  cert-*,
  -cert-err58-cpp,
  cppcoreguidelines-*,
  -cppcoreguidelines-avoid-magic-numbers,
  -cppcoreguidelines-pro-bounds-pointer-arithmetic,
  performance-*,
  modernize-*,
  -modernize-use-trailing-return-type,
  readability-*,
  -readability-magic-numbers,
  -readability-identifier-length

WarningsAsErrors: 'bugprone-*,cert-*'    # only the serious ones fail CI

HeaderFilterRegex: '^(src|include)/'     # OUR headers only, not /usr/include

FormatStyle: file


# ── CMake integration ────────────────────────────────────────────
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)     # required by every tool

option(ENABLE_CLANG_TIDY "Run clang-tidy during the build" OFF)
if(ENABLE_CLANG_TIDY)
    find_program(CLANG_TIDY clang-tidy REQUIRED)
    set(CMAKE_CXX_CLANG_TIDY \${CLANG_TIDY})
endif()


# ── Running it ───────────────────────────────────────────────────
# Whole project (slow -- nightly):
$ run-clang-tidy -p build -j $(nproc)

# Only the changed lines (fast -- every pull request):
$ git diff -U0 origin/main | clang-tidy-diff.py -p1 -path build -j $(nproc)

# Apply the automatic fixes:
$ run-clang-tidy -p build -fix -checks='-*,modernize-use-nullptr,modernize-use-override'

# cppcheck, which catches a different set -- run on the SAME file that
# gave clang-tidy 14 findings:
$ cppcheck --project=build/compile_commands.json \\
           --enable=warning,performance,portability \\
           --inline-suppr --error-exitcode=1

src/bad.cpp:20:12: error: Mismatching allocation and deallocation: p
                   [mismatchAllocDealloc]        <- clang-tidy MISSED this
src/bad.cpp:23:33: performance: Function parameter 's' should be passed by
                   const reference. [passedByValue]
src/bad.cpp:20:12: error: Memory is allocated but not initialized: p
[exit 1]


# ── Suppressing a genuine false positive ─────────────────────────
# Always with a reason. A bare NOLINT is unreviewable.
// NOLINTNEXTLINE(cppcoreguidelines-pro-type-reinterpret-cast)
//   required: the driver ABI hands us a void* we must reinterpret
auto* regs = reinterpret_cast<DeviceRegisters*>(mapped);`,
          output: `# That config, run on a small file of deliberate mistakes (clang-tidy 22):

5:7:   class 'Shape' defines a non-default destructor but does not define a
       copy constructor, ... [cppcoreguidelines-special-member-functions]
5:7:   destructor of 'Shape' is public and non-virtual
       [cppcoreguidelines-virtual-class-destructor]
8:5:   use '= default' to define a trivial destructor
       [modernize-use-equals-default]
13:5:  use range-based for loop instead [modernize-loop-convert]
13:25: C-style casts are discouraged; use static_cast
       [modernize-avoid-c-style-cast]
19:5:  initializing non-owner 'int *' with a newly created 'gsl::owner<>'
       [cppcoreguidelines-owning-memory]
28:9:  the 'empty' method should be used to check for emptiness instead of
       'size' [readability-container-size-empty]
29:5:  use auto when initializing with new [modernize-use-auto]
                                              ... 14 findings in total

# And --fix really rewrites the source:
$ clang-tidy -p build --checks='-*,modernize-use-auto,modernize-use-equals-default' --fix src/bad.cpp
  ~Shape() {}          ->  ~Shape() = default;
  Shape* s = new Shape ->  auto* s = new Shape`,
          explanation:
            "**The `-*` at the start of the `Checks` list is the important character**: it disables everything, so the list that follows is exactly what runs. Without it you inherit the defaults plus your additions, which is how people end up with thousands of findings. `WarningsAsErrors` is deliberately narrower than `Checks` — `bugprone-*` and `cert-*` fail the build, while `readability-*` and `modernize-*` are advice that does not block a merge. That split is what makes the tool sustainable. **`--fix` genuinely rewrites your files**, so run it on a clean working tree and review the diff.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Which warnings should you enable beyond `-Wall -Wextra`?",
      answer:
        "`-Wall` is a historical subset rather than everything, and `-Wall -Wextra` still leaves real bug-catchers off. Worth adding: `-Wshadow` for locals hiding outer names; `-Wconversion` and `-Wsign-conversion` for silent narrowing and signedness changes; `-Wnon-virtual-dtor` and `-Wdelete-non-virtual-dtor`, which catch the undefined behaviour from deleting through a base pointer; `-Woverloaded-virtual`, which catches a derived function hiding rather than overriding; `-Wold-style-cast`, since C casts hide `const_cast` and `reinterpret_cast`; plus `-Wformat=2`, `-Wnull-dereference`, `-Wdouble-promotion` and `-Wcast-align`. They cost nothing at runtime and are only off by default for backward compatibility.",
    },
    {
      question: "Should you use `-Werror`?",
      answer:
        "In CI with a pinned compiler version, yes — it is the only way to stop warnings accumulating until nobody reads them. In the default developer build, usually not: a compiler upgrade introduces new warnings and suddenly nobody can build the project, including someone trying to ship an unrelated hotfix. The workable split is warnings-as-errors in CI, warnings-as-warnings locally, controlled by a CMake option that the CI preset turns on. Two related points: apply warning flags `PRIVATE` so consumers of your library are not forced into your policy, and mark third-party includes `SYSTEM` so their headers do not generate warnings you cannot fix.",
    },
    {
      question: "What does `-fanalyzer` do that ordinary warnings cannot?",
      answer:
        "It is path-sensitive symbolic execution rather than local pattern matching: it explores execution paths through a function and tracks each value's state along them, so it can prove that on one particular path a pointer is freed and then dereferenced, or allocated and leaked on an early return. A statement-local warning cannot see that, because every individual line is fine. It reports with CWE identifiers and prints the path of events leading to the bug. Its limitations are that C++ support is much weaker than C — the checks assume `malloc`/`free` rather than `new`/`delete` or RAII — it is several times slower than normal compilation, and it has false positives on complex code.",
    },
    {
      question: "How do static analysis and sanitizers complement each other?",
      answer:
        "Static analysis reasons about paths without executing them, so it can find a bug on a branch no test reaches — but it must approximate, so it has false positives and cannot see everything. Sanitizers observe actual execution, so they have essentially no false positives and every report is real — but they only cover code that ran, so a clean run is evidence rather than proof. Neither subsumes the other: static analysis gives breadth without tests, sanitizers give certainty on the paths you exercise. A serious project runs both, plus a test suite good enough to make the sanitizers' coverage meaningful.",
    },
    {
      question: "How do you introduce static analysis into a large existing codebase?",
      answer:
        "Not by enabling everything, which produces thousands of findings that nobody triages and teaches the team to ignore the tool. Start with a narrow, high-value set — `bugprone-*` and `cert-*` — fix those, then ratchet up. Run analysis only on the diff in pull requests, using `clang-tidy-diff.py`, so new code meets the standard immediately while the backlog is paid down deliberately rather than blocking all work. Make only the serious families `WarningsAsErrors` and leave stylistic ones as advice. Set `HeaderFilterRegex` to your own headers, or you get findings from every system header. And require a stated reason on every `NOLINT`.",
    },
    {
      question: "Why do static analysis tools need `compile_commands.json`?",
      answer:
        "Because a tool has to parse your code the same way your compiler does, and that requires knowing the exact include paths, preprocessor definitions, standard version and flags for each file — all of which live in the build system, not the source. `compile_commands.json` is the compilation database recording the precise command for every translation unit. Without it, a tool guesses, and typically fails to find headers or evaluates the wrong `#if` branches, producing nonsense. CMake generates it with `CMAKE_EXPORT_COMPILE_COMMANDS ON`, which is worth enabling unconditionally since clangd and every editor's C++ support consume it too.",
    },
  ],
  takeaways: [
    "The compiler is the static analyser you already have, and its defaults find almost nothing",
    "`-Wall` is a historical subset; `-Wall -Wextra` still misses real bug-catchers",
    "Add `-Wshadow`, `-Wconversion`, `-Wnon-virtual-dtor`, `-Woverloaded-virtual`, `-Wold-style-cast`",
    "One small file produced nine warnings, several of them bugs from earlier modules",
    "`-Werror` in CI with a pinned compiler; not in the default local build",
    "Apply warning flags `PRIVATE`, and mark third-party includes `SYSTEM`",
    "`-fanalyzer` is path-sensitive: it found a leak on an early-return path with CWE ids",
    "Its C++ support is much weaker than its C support, and it is slow",
    "clang-tidy uses Clang's real parser and `--fix` genuinely rewrites your source",
    "Run cppcheck too — it caught a `new[]`/`delete` mismatch clang-tidy missed on the same file",
    "Every tool needs `compile_commands.json` — enable `CMAKE_EXPORT_COMPILE_COMMANDS`",
    "Start `.clang-tidy` with `-*` so the list you write is exactly what runs",
    "Set `HeaderFilterRegex` or you get findings from every system header",
    "Check only the diff in pull requests so a backlog does not block all work",
    "Static analysis gives breadth without tests; sanitizers give certainty on paths that ran",
  ],
  status: "available",
};
