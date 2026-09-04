import type { Lesson } from "@/content/types";

export const assertionsLesson: Lesson = {
  id: "cpp-assertions",
  slug: "assertions-invariants-and-failing-fast",
  moduleSlug: "error-handling",
  title: "Assertions, Invariants & Failing Fast in the Right Place",
  summary:
    "The distinction that decides which error mechanism to use: a bug in your own code is not the same thing as bad input from outside. Assertions for the first, exceptions or `expected` for the second — and the class invariant that makes both easier to state.",
  estimatedMinutes: 30,
  objectives: [
    "Distinguish a programming error from a runtime error and handle each correctly",
    "Use `assert` and `static_assert` for the right things",
    "Write a class invariant and check it at the right points",
    "Explain what `NDEBUG` does and the trap it creates",
    "Choose deliberately among the four error mechanisms this module covered",
  ],
  sections: [
    {
      id: "two-kinds",
      heading: "Two kinds of wrong",
      body: [
        "Most confusion about error handling comes from treating one question as two different ones. The distinction that resolves it:",
        "**A programming error is a bug in your code.** An index out of range, a null pointer where the contract said non-null, a violated invariant, a state machine reaching an impossible state. **The code is wrong and must be fixed.** Handling it at runtime is meaningless — you cannot recover from a bug you have not diagnosed, and continuing usually makes the eventual failure harder to locate.",
        "**A runtime error is something the world did.** A file that does not exist, malformed input, a refused connection, a disk that filled. **The code is correct and the situation is not.** These must be handled, because they will happen no matter how good the code is.",
        "**Assertions are for the first; exceptions and `expected` are for the second.**",
        "The test is: *could a user cause this by doing something unusual?* If yes it is a runtime error and needs real handling. If it can only happen because the program is internally inconsistent, it is a bug and should fail loudly and immediately.",
        "**The boundary of your system is where one becomes the other.** Data arriving from a user, a file, a socket or another process is untrusted and gets validated with a real error mechanism. Once past that boundary and validated, internal functions may *assert* their preconditions, because a violation now means an earlier part of your own code was wrong.",
      ],
      examples: [
        {
          id: "both-kinds",
          title: "The same class validating input and asserting internals",
          lang: "cpp",
          code: `#include <cassert>
#include <iostream>
#include <stdexcept>
#include <string>
#include <type_traits>

// static_assert: checked at COMPILE time, costs nothing at run time.
static_assert(sizeof(void*) == 8, "this code assumes a 64-bit pointer");
static_assert(std::is_nothrow_move_constructible_v<std::string>);

class Percentage {
public:
    // PRECONDITION on external input -> throw. The caller may legitimately
    // be passing through something a user typed.
    explicit Percentage(int v) : value_(v) {
        if (v < 0 || v > 100)
            throw std::out_of_range("percentage must be 0-100, got "
                                    + std::to_string(v));
        assert(invariant());
    }

    // PRECONDITION on internal use -> assert. A violation here is OUR bug.
    void addTo(int& total) const {
        assert(invariant());
        total += value_;
    }

    int value() const { return value_; }

private:
    // The class invariant, in one place, checkable from anywhere.
    bool invariant() const { return value_ >= 0 && value_ <= 100; }

    int value_;
};

int main() {
    std::cout << "assertions are "
#ifdef NDEBUG
              << "DISABLED (NDEBUG defined)\\n";
#else
              << "ENABLED\\n";
#endif

    Percentage p{42};
    int total = 0;
    p.addTo(total);
    std::cout << "  p = " << p.value() << ", total = " << total << '\\n';

    // External input is validated with an exception, not an assert.
    for (int v : {50, 150}) {
        try {
            Percentage q{v};
            std::cout << "  accepted " << q.value() << '\\n';
        } catch (const std::out_of_range& e) {
            std::cout << "  rejected: " << e.what() << '\\n';
        }
    }

    std::cout << "\\nstatic_assert already passed at compile time.\\n";
}`,
          output: `$ g++ -std=c++20 && ./a.out
assertions are ENABLED
  p = 42, total = 42
  accepted 50
  rejected: percentage must be 0-100, got 150

static_assert already passed at compile time.

$ g++ -std=c++20 -O2 -DNDEBUG && ./a.out
assertions are DISABLED (NDEBUG defined)
  p = 42, total = 42
  accepted 50
  rejected: percentage must be 0-100, got 150

static_assert already passed at compile time.`,
          explanation:
            "**The two builds behave identically for the user-visible behaviour and differently for the internal checks.** The out-of-range value was rejected with an exception in both, because that is a runtime error and must be handled in production. The `assert(invariant())` calls vanished in the release build, because a violated invariant is a bug that should have been caught in testing. That is the whole division: **validation survives to production, assertions do not.**",
        },
      ],
    },
    {
      id: "assert-mechanics",
      heading: "How `assert` behaves",
      body: [
        "`assert(expr)` from `<cassert>` evaluates the expression and, if it is false, prints the expression, file and line to `stderr` and calls `std::abort`.",
        "**Defining `NDEBUG` removes it entirely** — the macro expands to nothing, so the expression is not even evaluated. Release builds typically define it, which is what makes assertions free in production.",
        "**That creates the classic trap: never put anything with side effects inside an `assert`.** `assert(list.remove(x))` works in debug and silently does nothing in release, and the resulting bug appears only in production. If you need the operation, do it outside and assert on the result.",
        "**The `&& \"message\"` trick** attaches an explanation: `assert(b != 0 && \"divisor must not be zero\")`. The string is always truthy so it does not change the condition, and it appears in the failure output — which turns an unreadable expression dump into something diagnostic.",
        "**`static_assert(cond, \"message\")`** is the compile-time form and is strictly better where it applies: it costs nothing, cannot be disabled, and fails the build rather than the program. Use it for anything decidable at compile time — type properties, sizes, template constraints. Since C++17 the message is optional.",
        "**C++26 adds contracts** — `pre`, `post` and `contract_assert` — which formalise this with configurable enforcement rather than a preprocessor macro. Until then, `assert` plus discipline is the tool.",
      ],
      examples: [
        {
          id: "assert-failure",
          title: "What a failing assertion prints",
          lang: "cpp",
          code: `#include <cassert>
#include <iostream>

int divide(int a, int b) {
    // The && "message" trick: always truthy, and it shows in the output.
    assert(b != 0 && "divisor must not be zero");
    return a / b;
}

int main() {
    std::cout << divide(10, 2) << '\\n';
    std::cout << divide(1, 0) << '\\n';     // fails here
}`,
          output: `5
a.out: div.cpp:6: int divide(int, int): Assertion \`b != 0 && "divisor must not be zero"' failed.
Aborted                          # exit status 134

# and with -DNDEBUG the assert vanishes entirely, so this becomes
# an integer division by zero -- undefined behaviour, not a clean abort.`,
          explanation:
            "**The message appears in the diagnostic**, which is the entire reason for the `&&` idiom — an assertion naming only `b != 0` tells you far less. Note the comment at the bottom: with `NDEBUG` the check is gone and `1 / 0` is undefined behaviour rather than a clean failure. **An assertion is a debugging aid, not a safety net**, and anything that must hold in production needs a real check.",
        },
      ],
      pitfalls: [
        {
          title: "`assert(v.erase(it) != v.end())` is the bug this creates",
          body: "Anything with a side effect inside an `assert` disappears when `NDEBUG` is defined, so the erase never happens in release. The same applies to `assert(mutex.try_lock())`, `assert(++count < limit)` and `assert(file.write(data))`. Perform the operation on its own line, store the result, and assert on the stored value — then the operation happens in every build and only the check is conditional. This is one of the few C++ bugs that reliably reaches production, precisely because it cannot occur in the build you tested.",
        },
      ],
    },
    {
      id: "invariants",
      heading: "Invariants",
      body: [
        "**A class invariant is a condition that is true of every object of the class whenever a member function is not executing.** `Percentage::value_` is always between 0 and 100. A sorted container is always sorted. A non-empty stack's top always points at a real element.",
        "Writing the invariant down as a `private bool invariant() const` and asserting it is worth the small effort, because it gives you one place where the class's rules live and a single call that checks all of them.",
        "**Where to check.** At the end of every constructor, so no object is born broken. At the start and end of every non-const public member function, since those are the operations that could break it. Not in `const` members, which cannot break anything, and not internally in the middle of an operation that temporarily suspends it.",
        "**The point is the design pressure, not the check.** A class whose invariant is hard to state has too many independently-mutable pieces, and writing it down is often what reveals that. A class with no invariant at all — a plain bundle of unrelated fields — should be a `struct` with public members, not a class with getters and setters that enforce nothing.",
        "**Constructors are where invariants are established**, which is why fallible construction matters: an object that can exist in an invalid state has no invariant. That is the argument for throwing from a constructor, or for the `expected`-returning factory from the previous lesson.",
      ],
      examples: [
        {
          id: "invariant-class",
          title: "An invariant that catches a bug the type system cannot",
          lang: "cpp",
          code: `#include <algorithm>
#include <cassert>
#include <iostream>
#include <stdexcept>
#include <vector>

// Invariant: elements_ is always sorted, and never contains duplicates.
class SortedSet {
public:
    void insert(int v) {
        assert(invariant());                       // entry
        auto pos = std::lower_bound(elements_.begin(), elements_.end(), v);
        if (pos == elements_.end() || *pos != v)
            elements_.insert(pos, v);
        assert(invariant());                       // exit
    }

    bool contains(int v) const {
        // const member: cannot break the invariant, so no exit check needed.
        return std::binary_search(elements_.begin(), elements_.end(), v);
    }

    // A method that would BREAK the invariant, to show the assert firing.
    void appendUnchecked(int v) {
        elements_.push_back(v);
        // assert(invariant());   // <-- would abort for an out-of-order value
    }

    std::size_t size() const { return elements_.size(); }
    bool        checkInvariant() const { return invariant(); }

private:
    bool invariant() const {
        return std::is_sorted(elements_.begin(), elements_.end())
            && std::adjacent_find(elements_.begin(), elements_.end())
                   == elements_.end();
    }

    std::vector<int> elements_;
};

int main() {
    SortedSet s;
    for (int v : {5, 1, 9, 1, 3}) s.insert(v);

    std::cout << "size = " << s.size()
              << " (duplicate 1 rejected)\\n";
    std::cout << "contains(9) = " << s.contains(9)
              << ", contains(7) = " << s.contains(7) << '\\n';
    std::cout << "invariant holds: " << s.checkInvariant() << '\\n';

    s.appendUnchecked(2);     // out of order -- breaks the invariant
    std::cout << "\\nafter appendUnchecked(2):\\n";
    std::cout << "  invariant holds: " << s.checkInvariant() << '\\n';
    std::cout << "  contains(2) = " << s.contains(2)
              << "   <-- binary_search on unsorted data is now wrong\\n";
}`,
          output: `size = 4 (duplicate 1 rejected)
contains(9) = 1, contains(7) = 0
invariant holds: 1

after appendUnchecked(2):
  invariant holds: 0
  contains(2) = 0   <-- binary_search on unsorted data is now wrong`,
          explanation:
            "**`contains(2)` returned false for an element that is in the container.** Breaking the invariant did not crash anything — it made a correct-looking function silently wrong, which is exactly the class of bug assertions exist to catch. The invariant check found it immediately; without one, this would surface much later as a mysteriously missing element. Note that `contains` is `const` and needs no exit assertion, because a `const` member cannot break anything.",
        },
      ],
    },
    {
      id: "choosing",
      heading: "Choosing among the four",
      body: [
        "This module has covered four mechanisms. The choice is not a matter of taste, and the decision procedure is short.",
        "**`static_assert`** — the condition is decidable at compile time. Free, undisableable, fails the build. Always prefer it where it applies.",
        "**`assert`** — the condition can only be false if your own code is wrong. Internal preconditions, postconditions, invariants, unreachable branches. Removed in release, so never for anything that must hold in production and never with side effects.",
        "**`std::expected` (or an error code)** — failure is an expected part of normal operation and the immediate caller will handle it. Parsing, validation, lookups, I/O. Visible in the signature, checked by the caller, cheap.",
        "**Exceptions** — failure is rare, the immediate caller usually cannot help, and the error should travel to a boundary. Also the only option in constructors, and the right choice when silently ignoring the failure would be catastrophic.",
        "**And one non-mechanism that beats all of them: make the invalid state unrepresentable.** A `Percentage` type cannot hold 150. An `enum class` cannot hold an undefined value. A `variant` cannot be in an alternative you failed to handle. A factory returning `expected` cannot produce an invalid object. **Every error you make impossible is one you never have to handle**, and that is the through-line of this whole module.",
      ],
      examples: [
        {
          id: "decision",
          title: "The four, side by side",
          lang: "cpp",
          code: `// ── static_assert ──────────────────────────────────────────────
//    Decidable at compile time. Free. Cannot be disabled.
static_assert(sizeof(int) >= 4, "needs at least 32-bit int");
static_assert(std::is_nothrow_move_constructible_v<Session>);

// ── assert ─────────────────────────────────────────────────────
//    Only false if OUR code is wrong. Vanishes under NDEBUG.
void consume(const Buffer& b, std::size_t i) {
    assert(i < b.size() && "caller must bounds-check first");
    // ... internal, already-validated path
}

// ── expected / error_code ──────────────────────────────────────
//    Expected failure, handled by the immediate caller.
std::expected<Config, ParseError> parseConfig(std::string_view text);
std::size_t file_size(const std::filesystem::path&, std::error_code&);

// ── exceptions ─────────────────────────────────────────────────
//    Rare failure, propagates past frames that cannot help.
//    The only option from a constructor.
class Connection {
public:
    explicit Connection(std::string url);   // throws on a bad url
};

// ── best of all: unrepresentable ───────────────────────────────
//    No check needed, because the state cannot occur.
class Percentage {           // cannot hold 150
public:
    explicit Percentage(int v);
private:
    int value_;
};

enum class Mode { read, write, append };   // cannot hold 47

std::variant<Idle, Running, Failed> state;  // visit must be exhaustive`,
          output: `# The decision procedure, in order:
#   1. Can I make the bad state impossible?        -> do that
#   2. Is it decidable at compile time?            -> static_assert
#   3. Can it only happen if my code is buggy?     -> assert
#   4. Will the immediate caller handle it?        -> expected / error_code
#   5. Otherwise                                   -> exception`,
          explanation:
            "**Work down the list and stop at the first that applies.** Most real codebases skip step one entirely and end up writing checks for states their types could simply have excluded — a `std::string` for something that is always one of four values, an `int` for something always in a range, a pair of booleans encoding three valid combinations out of four. Module 9's `variant` and this module's factory-returning-`expected` are both tools for step one, and it is by far the cheapest step.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between a programming error and a runtime error?",
      answer:
        "A programming error is a bug in your own code — an out-of-range index, a violated invariant, an impossible state — where the code is wrong and must be fixed; handling it at runtime is meaningless because you cannot recover from a bug you have not diagnosed. A runtime error is something the world did — a missing file, malformed input, a refused connection — where the code is correct and the situation is not, so it must be handled. Assertions are for the first, exceptions and `expected` for the second. The test is whether a user could cause it by doing something unusual.",
    },
    {
      question: "What does `NDEBUG` do, and what trap does it create?",
      answer:
        "Defining it makes `assert` expand to nothing, so the expression is not even evaluated — which is what makes assertions free in release builds. The trap is that any side effect inside an assertion disappears with it: `assert(v.erase(it) != v.end())` performs the erase in debug and silently skips it in release, so the bug exists only in the build you did not test. The same applies to `assert(mutex.try_lock())` and `assert(++count < n)`. Perform the operation on its own line and assert on the stored result.",
    },
    {
      question: "When should you use `static_assert` rather than `assert`?",
      answer:
        "Whenever the condition is decidable at compile time — type properties, sizes, template constraints, platform assumptions. It is strictly better where it applies: it costs nothing at runtime, cannot be disabled by `NDEBUG`, and fails the build rather than the program, so the error reaches the developer rather than the user. A `static_assert(std::is_nothrow_move_constructible_v<T>)` in a performance-sensitive header is a good example, catching the day someone adds a member whose move can throw. Since C++17 the message argument is optional.",
    },
    {
      question: "What is a class invariant and where should it be checked?",
      answer:
        "A condition true of every object whenever a member function is not executing — a percentage always between 0 and 100, a sorted container always sorted. Write it as a private `bool invariant() const` so the rules live in one place, and assert it at the end of every constructor, and at entry and exit of every non-const public member. `const` members cannot break it so need no exit check. The real value is design pressure: a class whose invariant is hard to state has too many independently mutable parts, and a class with no invariant at all should be a `struct` with public members rather than a class with getters that enforce nothing.",
    },
    {
      question: "How do you choose among assertions, error codes, `expected` and exceptions?",
      answer:
        "In order: first ask whether the bad state can be made unrepresentable — a `Percentage` type, an `enum class`, a `variant`, a factory returning `expected` — since an error you have made impossible needs no handling at all. Then, if the condition is decidable at compile time, `static_assert`. If it can only be false when your own code is buggy, `assert`. If failure is expected and the immediate caller will handle it, `expected` or an error code. Otherwise an exception, which is also the only option from a constructor and the right choice when silently ignoring the failure would be catastrophic.",
    },
  ],
  takeaways: [
    "A programming error means the code is wrong; a runtime error means the world is",
    "Assertions are for bugs; exceptions and `expected` are for situations",
    "The system boundary is where untrusted input becomes validated internal state",
    "Validate external input with a real mechanism; assert internal preconditions",
    "`assert` prints and calls `abort`; `NDEBUG` removes it without evaluating the expression",
    "Never put a side effect inside an `assert` — it vanishes in the build you ship",
    "`assert(cond && \"message\")` puts an explanation in the failure output",
    "`static_assert` is free, undisableable and fails the build — prefer it where it applies",
    "A class invariant belongs in one private predicate, asserted at constructor and mutator boundaries",
    "A class with no statable invariant should be a `struct` with public members",
    "Breaking an invariant rarely crashes — it makes correct-looking code silently wrong",
    "Best of all: make the invalid state unrepresentable, and handle nothing",
  ],
  status: "available",
};
