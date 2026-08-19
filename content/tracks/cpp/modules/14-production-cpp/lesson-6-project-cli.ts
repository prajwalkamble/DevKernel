import type { Lesson } from "@/content/types";

export const projectCliLesson: Lesson = {
  id: "cpp-project-cli",
  slug: "project-a-production-command-line-tool",
  moduleSlug: "production-cpp",
  title: "Project: A Production-Grade Command-Line Tool, from Empty Directory to Release",
  summary:
    "Everything in this track, applied to one small program. A `wc` clone built from an empty directory — layered so the logic is testable, verified against the system `wc`, with correct exit codes and a CI pipeline — because the discipline is the point, not the word count.",
  estimatedMinutes: 45,
  objectives: [
    "Structure a small program so its logic is testable",
    "Parse arguments as a pure function of `argv`",
    "Follow command-line conventions for streams and exit codes",
    "Wire tests, sanitizers and CI from the start",
    "Verify a tool against a reference implementation",
  ],
  sections: [
    {
      id: "structure",
      heading: "Layout and layering",
      body: [
        "**The single most important decision is that `main` contains almost nothing.** Logic in `main` cannot be tested, cannot be reused, and forces every test to go through the filesystem and the process boundary.",
        "So the layout is the one from lesson 2, scaled down: **a library holding the logic, and a thin executable that parses arguments and calls it.** The tests link the library, never the executable.",
        "**Make the core a pure function over a stream.** `Counts count(std::istream&)` has no filesystem, no globals, no output — so a test constructs an `istringstream` and checks the result, with no temporary files and nothing to clean up.",
        "**Argument parsing is also a pure function.** `Options parse(std::span<char*>)` takes what `main` received and returns a struct; it touches nothing global, so its edge cases are unit-testable too.",
        "That leaves `main` doing only what genuinely requires the process: reading `argv`, opening files, writing to `stdout`/`stderr`, and choosing an exit code.",
      ],
      examples: [
        {
          id: "core",
          title: "The testable core, and the CMake that layers it",
          lang: "cpp",
          code: `// ═══ src/counter.h ══════════════════════════════════════════════
#pragma once
#include <cstdint>
#include <istream>
#include <string>
#include <string_view>

namespace wc {

struct Counts {
    std::uint64_t lines = 0, words = 0, bytes = 0;
    Counts& operator+=(const Counts& o) {
        lines += o.lines; words += o.words; bytes += o.bytes; return *this;
    }
    bool operator==(const Counts&) const = default;   // free comparison
};

// Pure: no filesystem, no globals, no output. Trivially testable.
Counts count(std::istream& in);
Counts countText(std::string_view text);

}  // namespace wc


// ═══ src/counter.cpp ════════════════════════════════════════════
#include "counter.h"
#include <cctype>
#include <sstream>

namespace wc {

Counts count(std::istream& in) {
    Counts c;
    char ch;
    bool inWord = false;
    while (in.get(ch)) {
        ++c.bytes;
        if (ch == '\\n') ++c.lines;
        if (std::isspace(static_cast<unsigned char>(ch))) inWord = false;
        else if (!inWord) { inWord = true; ++c.words; }
    }
    return c;
}

Counts countText(std::string_view text) {
    std::istringstream is{std::string{text}};
    return count(is);
}

}  // namespace wc


// ═══ CMakeLists.txt ═════════════════════════════════════════════
cmake_minimum_required(VERSION 3.24)
project(wc VERSION 1.0.0 LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)      # clangd and clang-tidy need it

# The LOGIC lives here, and the tests link this.
add_library(wc_core src/counter.cpp)
target_include_directories(wc_core PUBLIC \${CMAKE_CURRENT_SOURCE_DIR}/src)
target_compile_options(wc_core PRIVATE -Wall -Wextra -Wpedantic)

# The executable is thin.
add_executable(wc src/main.cpp)
target_link_libraries(wc PRIVATE wc_core)

include(CTest)
if(BUILD_TESTING)
  include(FetchContent)
  FetchContent_Declare(Catch2
    GIT_REPOSITORY https://github.com/catchorg/Catch2.git
    GIT_TAG v3.5.2 GIT_SHALLOW TRUE)
  FetchContent_MakeAvailable(Catch2)

  add_executable(wc_test tests/counter_test.cpp)
  target_link_libraries(wc_test PRIVATE wc_core Catch2::Catch2WithMain)

  list(APPEND CMAKE_MODULE_PATH \${catch2_SOURCE_DIR}/extras)
  include(Catch)
  catch_discover_tests(wc_test)            # one ctest entry per TEST_CASE
endif()`,
          output: `$ cmake -S . -B build -G Ninja && cmake --build build
$ ctest --test-dir build --output-on-failure

    Start 4: repeated whitespace is one separator
4/5 Test #4: repeated whitespace is one separator ...   Passed    0.00 sec
    Start 5: counts accumulate
5/5 Test #5: counts accumulate ......................   Passed    0.00 sec

100% tests passed out of 5`,
          explanation:
            "**`wc_core` is a library so the tests can link it**, and that one decision is what makes the whole thing testable — a test constructs an `istringstream` and checks a `Counts`, with no files, no subprocess and nothing to clean up. Note `operator==` defaulted on `Counts`, which lesson 1 argued for: one line, and now `CHECK(a == b)` works and Catch2 prints both sides on failure. The five tests appear as five separate CTest entries because of `catch_discover_tests`.",
        },
      ],
    },
    {
      id: "cli-conventions",
      heading: "Command-line conventions",
      body: [
        "A tool that ignores the conventions cannot be used in a pipeline, and being usable in a pipeline is most of the value of a command-line tool.",
        "**`stdout` is for output; `stderr` is for diagnostics.** Anything a user might pipe into another program goes to `stdout`, and everything else — errors, progress, warnings — goes to `stderr`. Getting this backwards means `tool | grep x` picks up your error messages.",
        "**Exit 0 on success, non-zero on failure.** Shell scripts and CI depend on it. Distinct codes for distinct failures are better still.",
        "**Read `stdin` when given no file arguments**, and treat `-` as meaning `stdin`. That is what makes a tool composable.",
        "**Support `--` to end option parsing**, so a file genuinely named `-l` can be processed.",
        "**Keep going after a per-file failure.** A tool given ten files, one of which is unreadable, should process the other nine, report the failure on `stderr`, and exit non-zero — not abort on the first problem.",
        "**Do not colour output unless `stdout` is a terminal**, and honour `NO_COLOR`. Escape codes in a redirected file are noise.",
      ],
      examples: [
        {
          id: "main",
          title: "A thin `main` that follows the conventions",
          lang: "cpp",
          code: `#include "counter.h"
#include <cstdio>
#include <fstream>
#include <iostream>
#include <span>
#include <string>
#include <string_view>
#include <vector>

namespace {

struct Options {
    bool lines = false, words = false, bytes = false, help = false;
    std::vector<std::string> paths;
    bool any() const { return lines || words || bytes; }
};

void usage(std::ostream& os, const char* prog) {
    os << "usage: " << prog << " [-l] [-w] [-c] [--] [FILE...]\\n"
       << "  -l  lines\\n  -w  words\\n  -c  bytes\\n"
       << "  with no flags, all three are shown; with no FILE, reads stdin\\n";
}

// A pure function of argv: no globals, so its edge cases are unit-testable.
Options parse(std::span<char*> args) {
    Options o;
    bool noMoreFlags = false;
    for (std::size_t i = 1; i < args.size(); ++i) {
        std::string_view a{args[i]};
        if (!noMoreFlags && a == "--")     { noMoreFlags = true; continue; }
        if (!noMoreFlags && a == "--help") { o.help = true;       continue; }
        if (!noMoreFlags && a.size() > 1 && a[0] == '-') {
            for (char c : a.substr(1)) {            // -lw is -l -w
                switch (c) {
                    case 'l': o.lines = true; break;
                    case 'w': o.words = true; break;
                    case 'c': o.bytes = true; break;
                    default:  o.help  = true; break;
                }
            }
            continue;
        }
        o.paths.emplace_back(a);
    }
    if (!o.any()) o.lines = o.words = o.bytes = true;   // default: all three
    return o;
}

void report(const Options& o, const wc::Counts& c, std::string_view label) {
    if (o.lines) std::printf("%8llu ", static_cast<unsigned long long>(c.lines));
    if (o.words) std::printf("%8llu ", static_cast<unsigned long long>(c.words));
    if (o.bytes) std::printf("%8llu ", static_cast<unsigned long long>(c.bytes));
    std::printf("%.*s\\n", static_cast<int>(label.size()), label.data());
}

}  // namespace

int main(int argc, char** argv) {
    const Options o = parse({argv, static_cast<std::size_t>(argc)});
    if (o.help) { usage(std::cout, argv[0]); return 0; }

    if (o.paths.empty()) {                    // no files: read stdin
        report(o, wc::count(std::cin), "-");
        return 0;
    }

    wc::Counts total;
    int status = 0;
    for (const auto& p : o.paths) {
        std::ifstream in{p, std::ios::binary};
        if (!in) {                            // attempt, then handle -- no TOCTOU
            std::cerr << argv[0] << ": " << p << ": cannot open\\n";
            status = 1;                       // keep going; report at the end
            continue;
        }
        wc::Counts c = wc::count(in);
        report(o, c, p);
        total += c;
    }
    if (o.paths.size() > 1) report(o, total, "total");
    return status;
}`,
          output: `$ ./build/wc a.txt b.txt
       2        3       17 a.txt
       1        1        4 b.txt
       3        4       21 total

$ /usr/bin/wc a.txt b.txt            # the reference implementation
 2  3 17 a.txt
 1  1  4 b.txt
 3  4 21 total
                                     # identical counts

$ ./build/wc -l a.txt
       2 a.txt

$ printf 'x y z\\n' | ./build/wc -w   # stdin when given no files
       3 -

$ ./build/wc missing.txt
./build/wc: missing.txt: cannot open
exit=1                               # non-zero, and the message went to stderr`,
          explanation:
            "**Verified against the system `wc` — the counts match exactly**, which is the cheapest possible correctness check for a tool with a reference implementation. Three conventions are visible in the output: the error went to `stderr` and the exit code was 1, so a script can detect it; `stdin` was read when no file was given; and a single unreadable file among several would still have let the others be processed. Note `std::ifstream in{p}; if (!in)` rather than checking `fs::exists` first — that is lesson 4's TOCTOU rule applied.",
        },
      ],
      pitfalls: [
        {
          title: "Locale, `isspace`, and the `char` sign trap",
          body: "`std::isspace(ch)` where `ch` is a `char` is undefined behaviour for negative values, and plain `char` is signed on x86 — so any byte above 0x7F, which is every byte of UTF-8 multi-byte text, passes a negative value and can index out of the classification table. The cast to `unsigned char` in `count` is not decoration. Separately, `isspace` is locale-dependent, so the same program can count differently under different `LC_ALL` settings; for byte-oriented tools the fix is an explicit check against the specific characters you mean. And this tool counts *bytes*, not characters — a UTF-8 aware `wc -m` would need to decode, which is a different program.",
        },
      ],
    },
    {
      id: "shipping",
      heading: "Testing, sanitizers and release",
      body: [
        "**Test the pure core exhaustively and the process boundary lightly.** Unit tests on `count` and `parse` cover the interesting cases cheaply; one or two end-to-end tests confirm the wiring. Inverting that ratio gives a slow suite that is hard to debug.",
        "**Test the edges you would otherwise get wrong**: empty input, no trailing newline, only whitespace, repeated separators, a single character. Those are where an off-by-one lives, and they cost one line each.",
        "**Compare against a reference implementation where one exists.** For this tool, `/usr/bin/wc` settles every disagreement about what the right answer is, and differential testing against it over random inputs finds things unit tests do not.",
        "**Run the suite under sanitizers in CI**, as module 12 established — ASan+UBSan and TSan as separate jobs, since they cannot share a binary.",
        "**For release, static-link or document the runtime dependency.** A binary built against a newer libstdc++ than the target has fails at startup with a symbol version error, which is a bad first impression. `-static-libstdc++ -static-libgcc` covers most of it.",
        "**Ship with `--version`, a man page or `--help` that is genuinely usable, and stripped release binaries** — `-s` at link time, or `strip`, which typically removes most of the file size.",
      ],
      examples: [
        {
          id: "tests-and-ci",
          title: "The test suite, and the pipeline",
          lang: "cpp",
          code: `// ═══ tests/counter_test.cpp ═════════════════════════════════════
#include <catch2/catch_test_macros.hpp>
#include "counter.h"

using wc::countText;

TEST_CASE("empty input", "[count]") {
    auto c = countText("");
    CHECK(c.lines == 0); CHECK(c.words == 0); CHECK(c.bytes == 0);
}

TEST_CASE("single line without trailing newline", "[count]") {
    auto c = countText("hello world");
    CHECK(c.lines == 0);              // no '\\n', so no completed line
    CHECK(c.words == 2);
    CHECK(c.bytes == 11);
}

TEST_CASE("trailing newline counts a line", "[count]") {
    auto c = countText("hello world\\n");
    CHECK(c.lines == 1); CHECK(c.words == 2); CHECK(c.bytes == 12);
}

TEST_CASE("repeated whitespace is one separator", "[count]") {
    auto c = countText("  a \\t\\t b  \\n\\n c ");
    CHECK(c.words == 3); CHECK(c.lines == 2);
}

TEST_CASE("counts accumulate", "[count]") {
    wc::Counts a = countText("one two\\n"), b = countText("three\\n");
    a += b;
    CHECK(a.lines == 2); CHECK(a.words == 3);
}


// ═══ .github/workflows/ci.yml ═══════════════════════════════════
// name: CI
// on: [push, pull_request]
// jobs:
//   test:
//     strategy:
//       matrix: { os: [ubuntu-latest, macos-latest], build: [Debug, Release] }
//     runs-on: \${{ matrix.os }}
//     steps:
//       - uses: actions/checkout@v4
//       - run: cmake -S . -B build -G Ninja
//              -DCMAKE_BUILD_TYPE=\${{ matrix.build }}
//       - run: cmake --build build
//       - run: ctest --test-dir build --output-on-failure
//       - name: differential test against the system wc
//         run: |
//           for f in $(git ls-files '*.cpp' '*.h'); do
//             diff <(./build/wc "$f") <(wc "$f" | tr -s ' ') || exit 1
//           done
//
//   sanitizers:
//     strategy: { matrix: { san: [address,undefined, thread] } }
//     runs-on: ubuntu-latest
//     steps:
//       - uses: actions/checkout@v4
//       - run: cmake -S . -B build -G Ninja
//              -DCMAKE_CXX_FLAGS="-fsanitize=\${{ matrix.san }} -g -O1
//                                 -fno-omit-frame-pointer
//                                 -fno-sanitize-recover=all"
//       - run: cmake --build build
//       - run: ctest --test-dir build --output-on-failure`,
          output: `$ ctest --test-dir build --output-on-failure
100% tests passed out of 5

# The edge cases that matter, and what each pins down:
#
#   ""                  -> nothing is counted, and nothing crashes
#   "hello world"       -> lines == 0: a line needs its newline
#   "hello world\\n"     -> lines == 1
#   "  a \\t\\t b  \\n\\n c " -> runs of whitespace are ONE separator
#   a += b              -> accumulation, which the 'total' row uses
#
# Five tests, five ways the naive implementation is wrong.`,
          explanation:
            "**The \"no trailing newline\" case is the one every naive implementation gets wrong**, and it costs one test to pin down: `\"hello world\"` has two words and *zero* lines, because a line is terminated by a newline. The differential CI step is the cheap insight — running both this tool and the system `wc` over every file in the repository and diffing gives thousands of assertions for four lines of YAML, and it catches disagreements no hand-written test would think of.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why should `main` contain almost no logic?",
      answer:
        "Because logic in `main` cannot be unit-tested, cannot be reused, and forces every test through the filesystem and process boundary — making the suite slow and failures hard to localise. The structure that works is a library holding the logic and a thin executable that parses arguments and calls it, with tests linking the library directly. Making the core a pure function over a stream — `Counts count(std::istream&)` — means a test constructs an `istringstream` and checks the result, with no temporary files and nothing to clean up. Argument parsing should be a pure function of `argv` for the same reason.",
    },
    {
      question: "What command-line conventions matter and why?",
      answer:
        "`stdout` for output and `stderr` for diagnostics, or `tool | grep x` picks up your error messages. Exit 0 on success and non-zero on failure, because scripts and CI depend on it. Read `stdin` when given no file arguments and treat `-` as `stdin`, which is what makes a tool composable in a pipeline. Support `--` to end option parsing so a file named `-l` can be handled. Continue after a per-file failure — process the other nine files, report on `stderr`, exit non-zero. And do not emit colour unless `stdout` is a terminal, honouring `NO_COLOR`.",
    },
    {
      question: "What is differential testing and why is it valuable here?",
      answer:
        "Running your implementation and a trusted reference over the same inputs and comparing outputs. For a `wc` clone, `/usr/bin/wc` settles every question about correct behaviour, so a four-line CI step running both over every file in the repository yields thousands of assertions and finds disagreements no hand-written test would anticipate — particularly around edge cases like missing trailing newlines and unusual whitespace. It generalises: any time a reference implementation exists, differential testing gives far more coverage per line of test code than enumerating cases by hand.",
    },
    {
      question: "Why is `std::isspace(ch)` with a `char` argument a bug?",
      answer:
        "Because the `<cctype>` functions take an `int` that must be representable as `unsigned char` or equal `EOF`, and plain `char` is signed on x86 — so any byte above 0x7F, which includes every continuation byte of UTF-8 text, passes a negative value. That is undefined behaviour and can index outside the classification table. The fix is casting to `unsigned char` first. Separately these functions are locale-dependent, so the same program can classify differently under different `LC_ALL` settings; for byte-oriented tools an explicit check against the characters you actually mean is more predictable.",
    },
    {
      question: "What should be true of a tool before you call it releasable?",
      answer:
        "Tests on the pure core covering the edge cases — empty input, missing trailing newline, only whitespace, repeated separators — plus a light end-to-end check of the wiring. The suite running under ASan+UBSan and TSan in CI, as separate jobs since they cannot share a binary. Correct stream usage and exit codes so it composes. A `--help` that is genuinely usable and a `--version`. And for distribution, either static linking of the C++ runtime or a documented dependency, because a binary built against a newer libstdc++ than the target has fails at startup with a symbol version error.",
    },
  ],
  takeaways: [
    "`main` should parse arguments, open files, write output and choose an exit code — nothing else",
    "Put the logic in a library so tests can link it without a subprocess",
    "Make the core a pure function over a stream: no filesystem, no globals, no output",
    "Parse `argv` in a pure function so its edge cases are unit-testable",
    "`stdout` for output, `stderr` for diagnostics — or pipelines pick up your errors",
    "Exit 0 on success, non-zero on failure; scripts depend on it",
    "Read `stdin` with no file arguments, treat `-` as stdin, support `--`",
    "Continue after a per-file failure and report the status at the end",
    "Open and check the stream rather than testing `exists` first — that is a TOCTOU race",
    "Cast to `unsigned char` before any `<cctype>` function or it is undefined behaviour",
    "Test empty input, missing trailing newline, and runs of whitespace",
    "Differential-test against a reference implementation where one exists",
    "Run the suite under sanitizers in CI, as separate ASan and TSan jobs",
    "Static-link the C++ runtime or document the dependency before distributing",
  ],
  status: "available",
};
