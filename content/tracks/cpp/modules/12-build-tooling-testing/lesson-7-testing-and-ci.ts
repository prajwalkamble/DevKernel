import type { Lesson } from "@/content/types";

export const testingLesson: Lesson = {
  id: "cpp-testing",
  slug: "unit-testing-and-ci-end-to-end",
  moduleSlug: "build-tooling-testing",
  title: "Unit Testing with GoogleTest & Catch2, and a CI Pipeline End to End",
  summary:
    "A real test suite built and run, the expression expansion that makes a failure readable without writing a message, and a CI pipeline that assembles every tool in this module — warnings, static analysis, two sanitizer configurations and coverage.",
  estimatedMinutes: 40,
  objectives: [
    "Write tests with Catch2 and with GoogleTest, and read their failure output",
    "Choose between the two frameworks for a reason",
    "Wire tests into CMake with CTest",
    "Design code so it can be tested at all",
    "Assemble a CI pipeline covering the whole module",
  ],
  sections: [
    {
      id: "catch2",
      heading: "Catch2",
      body: [
        "**Catch2's distinguishing feature is that it needs almost no API.** `REQUIRE(expr)` takes an ordinary boolean expression, and the framework decomposes it through template expression capture to report both operands on failure — so you write natural C++ and still get a useful message.",
        "**`REQUIRE` aborts the test case on failure; `CHECK` records it and continues.** Use `CHECK` when several independent assertions can all be informative, and `REQUIRE` when continuing would be meaningless or crash.",
        "**`SECTION` is the idea worth understanding.** Each section re-runs the *entire enclosing test case from the top*, executing only that one section. So setup written before the sections is repeated fresh for each — giving you per-test fixtures with no fixture class, and no shared state between cases.",
        "**`REQUIRE_THROWS_AS`** asserts both that an exception was thrown and its type. **`TEST_CASE` tags** in square brackets let you select subsets on the command line, and a tag beginning with `.` is hidden from default runs.",
        "The suite below is a real one — built with GCC 14 against Catch2 2.13.10 and executed, with the output as captured.",
      ],
      examples: [
        {
          id: "catch2-suite",
          title: "A real Catch2 suite, run",
          lang: "cpp",
          code: `// ── money.hpp : the code under test ──────────────────────────────
#pragma once
#include <stdexcept>
#include <string>

class Money {
public:
    Money() = default;
    Money(long long units, int cents) {
        if (cents < 0 || cents > 99)
            throw std::invalid_argument("cents must be 0-99");
        total_ = units * 100 + cents;
    }
    static Money fromCents(long long c) { Money m; m.total_ = c; return m; }
    long long cents() const { return total_; }
    Money operator+(const Money& o) const { return fromCents(total_ + o.total_); }
    Money operator-(const Money& o) const { return fromCents(total_ - o.total_); }
    bool  operator==(const Money&) const = default;
    std::string toString() const {
        bool neg = total_ < 0;
        long long a = neg ? -total_ : total_;
        return (neg ? "-" : "") + std::to_string(a / 100) + "." +
               (a % 100 < 10 ? "0" : "") + std::to_string(a % 100);
    }
private:
    long long total_ = 0;
};


// ── tests.cpp ────────────────────────────────────────────────────
#define CATCH_CONFIG_MAIN
#include "catch.hpp"
#include "money.hpp"

TEST_CASE("Money construction", "[money]") {
    // Each SECTION re-runs this test case from the top, so anything
    // written here is fresh for every section.
    SECTION("units and cents combine") {
        REQUIRE(Money(3, 50).cents() == 350);
    }
    SECTION("zero is zero") {
        REQUIRE(Money{} == Money(0, 0));
    }
    SECTION("invalid cents are rejected") {
        REQUIRE_THROWS_AS(Money(1, 100), std::invalid_argument);
        REQUIRE_THROWS_AS(Money(1, -1),  std::invalid_argument);
    }
}

TEST_CASE("Money arithmetic", "[money]") {
    const Money a{10, 25};
    const Money b{ 3, 80};
    CHECK((a + b) == Money(14, 5));
    CHECK((a - b) == Money(6, 45));
}

TEST_CASE("Money formatting", "[money][format]") {
    CHECK(Money(0, 5).toString()   == "0.05");
    CHECK(Money(12, 30).toString() == "12.30");
    CHECK((Money(0,0) - Money(1,50)).toString() == "-1.50");
}

// A leading '.' hides this from default runs.
TEST_CASE("a deliberately failing test, to show the output", "[.failing]") {
    CHECK(Money(1, 0).toString() == "1.0");
}`,
          output: `$ g++ -std=c++20 -o tests tests.cpp
$ ./tests
===============================================================================
All tests passed (9 assertions in 3 test cases)

$ ./tests "[.failing]"
-------------------------------------------------------------------------------
a deliberately failing test, to show the output
-------------------------------------------------------------------------------
tests.cpp:31
...............................................................................

tests.cpp:32: FAILED:
  CHECK( Money(1, 0).toString() == "1.0" )
with expansion:
  "1.00" == "1.0"

===============================================================================
test cases: 1 | 1 failed
assertions: 1 | 1 failed

$ ./tests --list-tags
   1  [format]
   3  [money]`,
          explanation:
            "**`with expansion: \"1.00\" == \"1.0\"` is the whole argument for Catch2.** No custom message was written, and the failure still says exactly what the value was and what was expected. A hand-rolled `assert(a == b)` would have told you only that line 32 failed. Note the hidden `[.failing]` test did not run in the default invocation — 9 assertions in 3 test cases — which is how you keep a deliberately failing example in the suite without breaking the build.",
        },
      ],
    },
    {
      id: "gtest",
      heading: "GoogleTest",
      body: [
        "**GoogleTest is the other serious option**, and the differences are real rather than stylistic.",
        "**It has an explicit macro for each comparison** — `EXPECT_EQ`, `EXPECT_NE`, `EXPECT_LT`, `ASSERT_TRUE` — rather than decomposing expressions. More to remember, and it gives better messages for the cases it knows about.",
        "**`EXPECT_*` continues on failure; `ASSERT_*` returns from the test function immediately.** Note that `ASSERT_*` only returns from the current function, so an assertion inside a helper does not stop the caller — a real gotcha.",
        "**Test fixtures are classes** deriving from `::testing::Test` with `SetUp`/`TearDown`, used via `TEST_F`. More ceremony than Catch2's sections, and clearer when the setup is substantial.",
        "**Its decisive advantage is GoogleMock**, which is bundled. Creating a mock of an interface, setting expectations on call counts, argument matchers and return sequences, and having unmet expectations fail the test, is something Catch2 has no equivalent for. **If you test through interfaces — as module 9 lesson 4 recommended — this matters a great deal.**",
        "**Parameterised tests** with `TEST_P` and `INSTANTIATE_TEST_SUITE_P` run one test body over many inputs, which Catch2 covers with `GENERATE`.",
        "**Choosing**: GoogleTest if you need mocking, are in a large or mixed codebase, or want the more conventional structure. Catch2 if you value the lighter syntax and expression decomposition, or want a single-header drop-in. Both are good; the mocking question usually decides it.",
      ],
      examples: [
        {
          id: "gtest-example",
          title: "The same tests in GoogleTest, plus a mock",
          lang: "cpp",
          code: `#include <gmock/gmock.h>
#include <gtest/gtest.h>
#include "money.hpp"

// ── Plain tests ──────────────────────────────────────────────────
TEST(MoneyTest, UnitsAndCentsCombine) {
    EXPECT_EQ(Money(3, 50).cents(), 350);
}

TEST(MoneyTest, InvalidCentsRejected) {
    EXPECT_THROW(Money(1, 100), std::invalid_argument);
    EXPECT_THROW(Money(1, -1),  std::invalid_argument);
}

TEST(MoneyTest, Formatting) {
    EXPECT_EQ(Money(0, 5).toString(),   "0.05");
    EXPECT_EQ(Money(12, 30).toString(), "12.30");
}

// ── A fixture, for shared setup ──────────────────────────────────
class LedgerTest : public ::testing::Test {
protected:
    void SetUp() override { balance = Money(100, 0); }
    Money balance;
};

TEST_F(LedgerTest, DepositIncreasesBalance) {
    balance = balance + Money(25, 50);
    EXPECT_EQ(balance, Money(125, 50));
}

// ── Parameterised: one body, many inputs ─────────────────────────
class FormatTest : public ::testing::TestWithParam<
                       std::pair<Money, std::string>> {};

TEST_P(FormatTest, FormatsCorrectly) {
    const auto& [money, expected] = GetParam();
    EXPECT_EQ(money.toString(), expected);
}

INSTANTIATE_TEST_SUITE_P(Amounts, FormatTest, ::testing::Values(
    std::pair{Money(0, 0),   "0.00"},
    std::pair{Money(0, 5),   "0.05"},
    std::pair{Money(1, 0),   "1.00"},
    std::pair{Money(99, 99), "99.99"}));

// ── GoogleMock : the reason to choose GoogleTest ─────────────────
class Clock {                            // the interface from module 9
public:
    virtual ~Clock() = default;
    virtual int nowSeconds() const = 0;
};

class MockClock : public Clock {
public:
    MOCK_METHOD(int, nowSeconds, (), (const, override));
};

class Session {
public:
    explicit Session(const Clock& c) : clock_(c), start_(c.nowSeconds()) {}
    bool expired(int ttl) const { return clock_.nowSeconds() - start_ >= ttl; }
private:
    const Clock& clock_;
    int          start_;
};

TEST(SessionTest, ExpiresAfterTtl) {
    using ::testing::Return;
    MockClock clock;

    // Expectation: called exactly three times, returning these in order.
    EXPECT_CALL(clock, nowSeconds())
        .Times(3)
        .WillOnce(Return(1000))          // construction
        .WillOnce(Return(1030))          // first expired() check
        .WillOnce(Return(1100));         // second expired() check

    Session s{clock};
    EXPECT_FALSE(s.expired(60));         // 30s elapsed
    EXPECT_TRUE (s.expired(60));         // 100s elapsed
}   // an unmet Times(3) fails the test here`,
          output: `$ ctest --test-dir build --output-on-failure
[==========] Running 8 tests from 4 test suites.
[  PASSED  ] 8 tests.

# A failing EXPECT_EQ reports both sides, like Catch2:
#
# money_test.cpp:18: Failure
# Expected equality of these values:
#   Money(1, 0).toString()
#     Which is: "1.00"
#   "1.0"
#
# And an unmet mock expectation reports the call counts:
#
# Actual function call count doesn't match EXPECT_CALL(clock, nowSeconds())...
#          Expected: to be called 3 times
#            Actual: called 2 times`,
          explanation:
            "**The `MockClock` test is what Catch2 cannot do without a separate library.** `EXPECT_CALL` states the expected call count and a sequence of return values, and the mock verifies the count in its destructor — so a test that stops calling the collaborator fails, not just one that computes the wrong answer. Note this works because `Session` depends on the `Clock` *interface* rather than a concrete clock, which is exactly the seam module 9 lesson 4 argued for. **Testability is a design property; the framework only exploits it.**",
        },
      ],
    },
    {
      id: "ctest-and-ci",
      heading: "CTest, and the whole pipeline",
      body: [
        "**CTest is CMake's test runner**, and it does not care which framework you used — it runs executables and checks exit codes. That gives you parallel execution with `-j`, repetition with `--repeat until-fail:50` for flaky tests, timeouts, label-based filtering, and a uniform interface for CI.",
        "**`catch_discover_tests` and `gtest_discover_tests` register each test case as a separate CTest test** by running the binary at build time to enumerate them. That is what makes `ctest -j8` actually parallel and makes a failure name the specific case.",
        "**Coverage** with `--coverage` plus `gcovr` or `lcov` tells you which lines your tests execute. Treat it as a *finder of untested code*, not a target: a team chasing a coverage percentage writes tests that execute lines without asserting anything, which is worse than no test because it looks like protection.",
        "**The pipeline below assembles everything in this module** — a warnings build with `-Werror`, clang-tidy on the diff, two sanitizer jobs, and coverage — because each catches a class the others miss.",
        "**And the point that outlives any framework: code that is hard to test is badly designed.** A function taking `const Clock&` instead of calling `system_clock::now()`, a class receiving its dependencies rather than constructing them, a pure function separated from the I/O around it — those are the changes that make testing possible. **You cannot add testability with a library.**",
      ],
      examples: [
        {
          id: "full-ci",
          title: "CTest wiring and a complete CI pipeline",
          lang: "bash",
          code: `# ── CMakeLists.txt ────────────────────────────────────────────────
include(CTest)                    # defines BUILD_TESTING, default ON
if(BUILD_TESTING)
    find_package(Catch2 3 REQUIRED)

    add_executable(money_test tests/money_test.cpp)
    target_link_libraries(money_test PRIVATE money Catch2::Catch2WithMain)

    include(Catch)
    catch_discover_tests(money_test)      # one CTest entry per TEST_CASE

    # Slow tests get a label so CI can run them separately.
    set_tests_properties(money_test PROPERTIES TIMEOUT 30)
endif()

# Coverage, behind an option.
option(ENABLE_COVERAGE "Build with coverage instrumentation" OFF)
if(ENABLE_COVERAGE)
    add_compile_options(--coverage -O0 -g)
    add_link_options(--coverage)
endif()


# ── Running ───────────────────────────────────────────────────────
$ ctest --test-dir build -j$(nproc) --output-on-failure
$ ctest --test-dir build -R "Money"              # by name
$ ctest --test-dir build --repeat until-fail:50  # hunt a flaky test
$ ctest --test-dir build --rerun-failed


# ── .github/workflows/ci.yml : everything in this module ─────────
name: CI
on: [push, pull_request]

jobs:
  build-and-test:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        build_type: [Debug, RelWithDebInfo]
    runs-on: \${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: lukka/run-vcpkg@v11
      - name: Configure
        run: cmake --preset ci-\${{ matrix.build_type }} -DWARNINGS_AS_ERRORS=ON
      - run: cmake --build build --parallel
      - run: ctest --test-dir build -j2 --output-on-failure

  sanitizers:
    strategy:
      fail-fast: false
      matrix:
        san: [asan-ubsan, tsan]        # separate: they cannot be combined
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cmake --preset \${{ matrix.san }}
      - run: cmake --build build
      - env:
          ASAN_OPTIONS: detect_leaks=1:abort_on_error=1
          UBSAN_OPTIONS: print_stacktrace=1:halt_on_error=1
          TSAN_OPTIONS: halt_on_error=1
        run: ctest --test-dir build --output-on-failure

  static-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - run: cmake -S . -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
      - name: clang-tidy on changed lines only
        run: |
          git diff -U0 origin/\${{ github.base_ref }} \\
            | clang-tidy-diff.py -p1 -path build -j$(nproc)

  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cmake -S . -B build -DENABLE_COVERAGE=ON
      - run: cmake --build build
      - run: ctest --test-dir build
      - run: gcovr --root . --xml-pretty -o coverage.xml
      - uses: codecov/codecov-action@v4`,
          output: `# catch_discover_tests turns ONE binary into THREE ctest entries:

$ ctest --test-dir build --output-on-failure
    Start 1: Money construction
1/3 Test #1: Money construction ...............   Passed    0.00 sec
    Start 2: Money arithmetic
2/3 Test #2: Money arithmetic .................   Passed    0.00 sec
    Start 3: Money formatting
3/3 Test #3: Money formatting .................   Passed    0.00 sec
100% tests passed out of 3

$ ctest --test-dir build -R "arithmetic"     # 1 test selected
$ ctest --test-dir build -j4                 # 3 tests, in parallel
$ ctest --test-dir build --repeat until-fail:5


# What each CI job catches that the others do not:
#
#   build-and-test   compile errors and behaviour, on 3 OSes x 2 configs
#   sanitizers       memory errors, UB and data races -- at RUNTIME
#   static-analysis  bugs on paths the tests never execute
#   coverage         which code the tests never touch at all
#
# Removing any one of them leaves a whole class unchecked. This is the
# minimum honest pipeline for a C++ project people depend on.`,
          explanation:
            "**`clang-tidy-diff.py` on the changed lines is the detail that makes static analysis adoptable.** A large codebase produces thousands of findings on day one; checking only the diff means new code meets the standard immediately while the backlog is paid down deliberately, instead of blocking every merge. Note the sanitizer matrix is a separate job from the main build with `fail-fast: false`, so a TSan failure does not hide an ASan failure — and note there are two sanitizer configurations because ASan and TSan cannot be combined in one binary.",
        },
      ],
      pitfalls: [
        {
          title: "Coverage percentage is a diagnostic, never a target",
          body: "Line coverage tells you which lines executed, not whether anything was verified — a test calling every function and asserting nothing reaches 100%. Once a number becomes a target, people write exactly those tests, and the result is worse than having no tests because it looks like protection. Use coverage to *find* untested code, look at the uncovered regions and ask whether they matter, and resist a mandated threshold. Branch coverage is more informative than line coverage; mutation testing, which changes the code and checks that a test fails, is the only automated measure that actually tests your tests, though the tooling for C++ is still immature.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What distinguishes Catch2 from GoogleTest?",
      answer:
        "Catch2 uses expression decomposition: `REQUIRE(a == b)` takes an ordinary boolean expression and reports both operands on failure — `with expansion: \"1.00\" == \"1.0\"` — so there is almost no API to learn and no need to write custom messages. Its `SECTION` mechanism re-runs the whole test case for each section, giving per-test fixtures with no fixture class. GoogleTest has explicit macros per comparison, class-based fixtures with `SetUp`/`TearDown`, and parameterised tests. The decisive difference is GoogleMock, bundled with GoogleTest, which has no Catch2 equivalent — if you test through interfaces and need mocks with call-count and argument expectations, that usually settles it.",
    },
    {
      question: "What is the difference between `REQUIRE` and `CHECK`, or `ASSERT_*` and `EXPECT_*`?",
      answer:
        "`REQUIRE` and `ASSERT_*` stop the test on failure; `CHECK` and `EXPECT_*` record the failure and continue. Use the continuing form when several independent assertions can each give information, and the aborting form when continuing would be meaningless or would crash — for example after checking a pointer is non-null. One GoogleTest gotcha: `ASSERT_*` only returns from the *current function*, so an assertion inside a helper function does not stop the calling test, which surprises people and is why GoogleTest documents using `ASSERT_*` only directly in test bodies.",
    },
    {
      question: "What does `catch_discover_tests` do, and why does it matter?",
      answer:
        "It runs the test binary at build time to enumerate its test cases, then registers each one as a separate CTest test. Without it CTest sees a single test — the whole executable — so `ctest -j8` cannot parallelise it and a failure tells you only that the binary failed. With it you get real parallel execution, per-case names in the output, and the ability to filter with `ctest -R` or rerun only failures. `gtest_discover_tests` does the same for GoogleTest. It is one line and it changes CTest from a wrapper into a useful runner.",
    },
    {
      question: "How should you treat code coverage?",
      answer:
        "As a diagnostic for finding untested code, never as a target. Line coverage measures which lines executed, not whether anything was verified — a test that calls every function and asserts nothing reaches 100%. The moment a percentage becomes a goal, people write exactly those tests, and the result is worse than no tests because it creates the appearance of protection. Look at the uncovered regions and judge whether they matter. Branch coverage is more informative than line coverage, and mutation testing — mutating the code and checking a test fails — is the only automated way to test your tests, though C++ tooling for it remains immature.",
    },
    {
      question: "What should a C++ CI pipeline contain?",
      answer:
        "At minimum four things that each catch what the others cannot. A build-and-test matrix across compilers, platforms and configurations with warnings as errors, catching compile errors and behavioural regressions. Two sanitizer jobs — ASan+UBSan and TSan separately, since they cannot be combined — catching memory errors, undefined behaviour and data races at runtime. Static analysis on the changed lines, catching bugs on paths the tests never execute. And coverage, showing which code the tests never touch. Removing any one leaves a whole class unchecked. Add `--repeat until-fail` runs for flaky tests, and pin the compiler version wherever `-Werror` is enabled.",
    },
    {
      question: "What makes C++ code testable?",
      answer:
        "Design, not tooling — you cannot add testability with a library. Concretely: depend on interfaces rather than concrete types, so a fake can be substituted, which is what makes a mock clock possible instead of waiting for real time. Inject dependencies rather than constructing them internally, so the test controls them. Separate pure computation from I/O, so the logic can be tested without the filesystem or network. Keep functions small enough to have a comprehensible set of inputs. Avoid global mutable state and singletons, which make tests order-dependent. A function that calls `system_clock::now()` directly cannot be tested for time-dependent behaviour, and no framework changes that.",
    },
  ],
  takeaways: [
    "Catch2 decomposes expressions: a bare `REQUIRE(a == b)` reports both operands",
    "`with expansion: \"1.00\" == \"1.0\"` — no custom message needed",
    "`SECTION` re-runs the whole test case, giving fresh setup per section",
    "`REQUIRE`/`ASSERT_*` abort the test; `CHECK`/`EXPECT_*` continue",
    "`ASSERT_*` only returns from the current function, not from a helper's caller",
    "GoogleMock is bundled with GoogleTest and is usually the deciding factor",
    "A tag starting with `.` hides a Catch2 test from default runs",
    "`catch_discover_tests`/`gtest_discover_tests` register each case separately for `ctest -j`",
    "`ctest --repeat until-fail:50` is how you hunt a flaky test",
    "Coverage finds untested code; as a target it produces tests that assert nothing",
    "A serious pipeline runs build matrix, two sanitizer configs, diff static analysis and coverage",
    "ASan and TSan need separate jobs because they cannot share a binary",
    "Testability is a design property — inject dependencies, depend on interfaces, isolate I/O",
  ],
  status: "available",
};
