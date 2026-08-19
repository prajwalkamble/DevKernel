import type { Lesson } from "@/content/types";

export const exceptionsLesson: Lesson = {
  id: "cpp-exceptions",
  slug: "throw-catch-and-stack-unwinding",
  moduleSlug: "error-handling",
  title: "Exceptions: throw, catch & Stack Unwinding",
  summary:
    "What actually happens between a `throw` and the matching `catch`. Stack unwinding running every destructor on the way out — which is what makes RAII work — plus catch ordering, why you catch by `const&`, and the destructor throw that calls `std::terminate`.",
  estimatedMinutes: 35,
  objectives: [
    "Describe stack unwinding and what it guarantees",
    "Order catch handlers correctly and say why",
    "Explain why exceptions are caught by `const&` and thrown by value",
    "Rethrow without losing the original exception type",
    "Say what happens when a destructor throws during unwinding",
  ],
  sections: [
    {
      id: "unwinding",
      heading: "Stack unwinding",
      body: [
        "`throw` does not simply jump. It **unwinds the stack**: for every scope between the throw and the handler, it destroys the automatic objects in reverse order of construction, then moves outward to the next scope, until it finds a matching `catch`.",
        "**That is the mechanism RAII depends on.** Every `unique_ptr`, `lock_guard`, file handle and vector on the abandoned frames has its destructor run, so resources are released on the error path exactly as on the success path — without a single line of cleanup code.",
        "It is also why C++ does not need `finally`. A `finally` block is a place to put cleanup; in C++ the cleanup lives in the destructor of the type that owns the resource, so it is written once in the class rather than at every call site that might fail.",
        "**If no handler matches anywhere, `std::terminate` is called** — and note the stack may not be unwound at all in that case, which is why an uncaught exception can leave temporary files behind. The standard permits an implementation to terminate immediately without unwinding.",
        "`throw` with no operand inside a `catch` block **rethrows the current exception**, preserving its dynamic type. Writing `throw e;` instead throws a *copy* of the static type, which slices a derived exception down to its base — a real bug in logging-and-rethrowing code.",
      ],
      examples: [
        {
          id: "unwinding-demo",
          title: "Every local destroyed on the way out",
          lang: "cpp",
          code: `#include <iostream>
#include <stdexcept>
#include <string>

struct Tracer {
    std::string name;
    explicit Tracer(std::string n) : name(std::move(n)) {
        std::cout << "    + " << name << '\\n';
    }
    ~Tracer() { std::cout << "    - " << name << '\\n'; }
};

void level3() {
    Tracer t{"level3"};
    std::cout << "    throwing...\\n";
    throw std::runtime_error("something broke");
    std::cout << "    NEVER REACHED\\n";
}

void level2() { Tracer t{"level2"}; level3(); }
void level1() { Tracer t{"level1"}; level2(); }

int main() {
    std::cout << "stack unwinding destroys every local on the way out:\\n";
    try {
        level1();
    } catch (const std::runtime_error& e) {
        std::cout << "  caught: " << e.what() << '\\n';
    }

    std::cout << "\\ncatch order matters -- most derived FIRST:\\n";
    try {
        throw std::out_of_range("index 7");
    } catch (const std::out_of_range& e) {
        std::cout << "  out_of_range: " << e.what() << '\\n';
    } catch (const std::logic_error&) {
        std::cout << "  logic_error (would shadow out_of_range if first)\\n";
    } catch (const std::exception&) {
        std::cout << "  exception\\n";
    }

    std::cout << "\\nrethrow preserves the original exception:\\n";
    try {
        try {
            throw std::runtime_error("inner");
        } catch (const std::exception& e) {
            std::cout << "  logging: " << e.what() << '\\n';
            throw;                      // bare throw = rethrow, not a copy
        }
    } catch (const std::runtime_error& e) {
        std::cout << "  outer still sees runtime_error: " << e.what() << '\\n';
    }

    std::cout << "\\ncatch by const& -- catching by value SLICES:\\n";
    try {
        throw std::out_of_range("sliced?");
    } catch (const std::exception& e) {
        std::cout << "  dynamic type survived: " << e.what() << '\\n';
    }
}`,
          output: `stack unwinding destroys every local on the way out:
    + level1
    + level2
    + level3
    throwing...
    - level3
    - level2
    - level1
  caught: something broke

catch order matters -- most derived FIRST:
  out_of_range: index 7

rethrow preserves the original exception:
  logging: inner
  outer still sees runtime_error: inner

catch by const& -- catching by value SLICES:
  dynamic type survived: sliced?`,
          explanation:
            "**Three destructors ran, in reverse order, with no cleanup code written anywhere.** That is the entire argument for RAII and the reason `try`/`finally` is absent from the language. The rethrow block shows the important detail: `throw;` with no operand preserved the `runtime_error` type through a handler that caught it as `std::exception&`. Writing `throw e;` there would have thrown a `std::exception` copy and the outer `catch (const std::runtime_error&)` would not have matched.",
        },
      ],
    },
    {
      id: "rules",
      heading: "Throw by value, catch by reference",
      body: [
        "**Throw by value.** `throw MyError{...};` — the exception object is copied into an implementation-managed area, so throwing a pointer to a local is a dangling reference and throwing `new MyError` leaks unless every handler remembers to delete it.",
        "**Catch by `const&`.** Catching by value **slices** a derived exception to the base type, losing exactly the information you needed, and copies an object for no reason. Catching by non-const reference is legal but rarely what you want.",
        "**Order handlers most-derived first.** Matching is top-to-bottom and stops at the first handler that can accept the exception — there is no best-match selection as in overload resolution. A `catch (const std::exception&)` placed above a `catch (const std::out_of_range&)` makes the second one unreachable, and compilers will warn.",
        "**Derive from `std::exception`**, usually via `std::runtime_error` or `std::logic_error`, so generic handlers and top-level loggers can call `what()`. The rough division: `logic_error` for programming mistakes the caller could have prevented, `runtime_error` for conditions only detectable at run time.",
        "**`catch (...)`** catches everything, including non-`std::exception` types. It is right at a thread boundary or `main`, where letting anything escape means `terminate`, and wrong as a general habit because it discards information — pair it with `throw;` or `std::current_exception()` if you are not the final handler.",
      ],
      examples: [
        {
          id: "exception-hierarchy",
          title: "A custom exception carrying context",
          lang: "cpp",
          code: `#include <exception>
#include <iostream>
#include <stdexcept>
#include <string>

// Derive from the standard hierarchy so generic handlers still work.
class ConfigError : public std::runtime_error {
public:
    ConfigError(std::string key, std::string detail)
        : std::runtime_error("config error for '" + key + "': " + detail),
          key_(std::move(key)) {}

    const std::string& key() const noexcept { return key_; }

private:
    std::string key_;
};

void loadSetting(const std::string& key) {
    if (key == "port") throw ConfigError{key, "expected an integer"};
    if (key == "mode") throw std::invalid_argument{"unknown mode"};
    std::cout << "  loaded " << key << '\\n';
}

int main() {
    for (const std::string k : {"host", "port", "mode"}) {
        try {
            loadSetting(k);
        }
        // Most derived first: ConfigError before runtime_error before exception.
        catch (const ConfigError& e) {
            std::cout << "  ConfigError on key '" << e.key()
                      << "': " << e.what() << '\\n';
        }
        catch (const std::runtime_error& e) {
            std::cout << "  runtime_error: " << e.what() << '\\n';
        }
        catch (const std::exception& e) {
            std::cout << "  exception: " << e.what() << '\\n';
        }
    }

    // catch(...) at a boundary, converting to something reportable.
    std::cout << "\\nboundary handler:\\n";
    try {
        try { throw 42; }               // not derived from std::exception
        catch (...) {
            std::cout << "  caught something non-standard, rethrowing\\n";
            throw;
        }
    } catch (...) {
        std::cout << "  outer boundary swallowed it\\n";
    }
}`,
          output: `  loaded host
  ConfigError on key 'port': config error for 'port': expected an integer
  exception: unknown mode

boundary handler:
  caught something non-standard, rethrowing
  outer boundary swallowed it`,
          explanation:
            "**`ConfigError` carries structured data — the key — alongside the message**, which is the main reason to define your own exception type rather than throwing `std::runtime_error` with a formatted string. Note that `std::invalid_argument` was caught by the `std::exception` handler and not the `runtime_error` one: it derives from `logic_error`, which is a sibling of `runtime_error`, not a child. That hierarchy is worth knowing before you rely on it.",
        },
      ],
      pitfalls: [
        {
          title: "The standard hierarchy is not organised the way you would guess",
          body: "`std::exception` has two main children: `std::logic_error` (with `invalid_argument`, `domain_error`, `length_error`, `out_of_range`) and `std::runtime_error` (with `range_error`, `overflow_error`, `underflow_error`, and since C++11 `system_error`). Note that `out_of_range` — thrown by `vector::at` and `map::at` — is a *logic* error, on the theory that indexing out of bounds is a programming mistake. `std::bad_alloc`, `std::bad_cast` and `std::bad_optional_access` derive directly from `std::exception` and from neither branch, so a handler catching only `runtime_error` will miss all of them.",
        },
      ],
    },
    {
      id: "destructors",
      heading: "Destructors must not throw",
      body: [
        "**Since C++11 every destructor is implicitly `noexcept`.** Letting an exception escape one calls `std::terminate` immediately — no unwinding, no handlers, no cleanup.",
        "The reason is a genuine ambiguity rather than an implementation limitation. **During unwinding, a destructor that throws would mean two exceptions in flight at once**, and the language has no way to represent or propagate both. So the rule is to terminate.",
        "That makes destructors a place where failure has to be handled or accepted, never propagated. The consequences for design:",
        "**If cleanup can fail, expose an explicit method** — `close()`, `commit()`, `flush()` — that callers may invoke and check. The destructor then becomes a safety net that performs the same cleanup and *swallows* any failure, typically logging it.",
        "**Wrap anything throwing in a try/catch inside the destructor** if you must call it. `catch (...) {}` in a destructor is one of the few places an empty handler is defensible.",
        "**You can override with `noexcept(false)`**, and you almost never should — the example below shows what it buys you, which is an abort.",
      ],
      examples: [
        {
          id: "destructor-throw",
          title: "What a throwing destructor actually does",
          lang: "cpp",
          code: `#include <iostream>
#include <stdexcept>

// Explicitly opting OUT of the implicit noexcept. Almost never correct.
struct Bad {
    ~Bad() noexcept(false) { throw std::runtime_error("from destructor"); }
};

int main() {
    try {
        Bad b;
        throw std::runtime_error("original");   // unwinding begins...
    } catch (...) {
        std::cout << "never reached\\n";
    }
}`,
          output: `terminate called after throwing an instance of 'std::runtime_error'
  what():  from destructor
Aborted                          # exit status 134`,
          explanation:
            "**The `catch (...)` never ran.** The first exception started unwinding, `~Bad` threw a second one during that unwinding, and with two exceptions in flight the runtime called `std::terminate`. Note that a `catch (...)` — which catches literally everything — was powerless, because termination is not an exception being propagated. The program aborted with status 134, the same signature as the double free in module 5.",
        },
        {
          id: "safe-cleanup",
          title: "The pattern for cleanup that can fail",
          lang: "cpp",
          code: `#include <iostream>
#include <stdexcept>
#include <string>

class Transaction {
public:
    explicit Transaction(std::string name) : name_(std::move(name)) {
        std::cout << "  begin " << name_ << '\\n';
    }

    // Explicit, checkable, may throw. Callers who care use this.
    void commit() {
        if (name_ == "doomed") throw std::runtime_error("commit failed");
        std::cout << "  commit " << name_ << '\\n';
        done_ = true;
    }

    // Safety net. Must not throw, so it swallows and reports.
    ~Transaction() {
        if (done_) return;
        try {
            std::cout << "  rollback " << name_ << '\\n';
            if (name_ == "cursed") throw std::runtime_error("rollback failed");
        } catch (const std::exception& e) {
            // Swallow: we are in a destructor and may be unwinding.
            std::cerr << "  [error] rollback of " << name_
                      << " failed: " << e.what() << '\\n';
        }
    }

private:
    std::string name_;
    bool        done_ = false;
};

int main() {
    { Transaction t{"normal"}; t.commit(); }

    std::cout << "\\nfailing commit, caught by the caller:\\n";
    try {
        Transaction t{"doomed"};
        t.commit();
    } catch (const std::exception& e) {
        std::cout << "  caught: " << e.what() << '\\n';
    }

    std::cout << "\\nfailing rollback, contained inside the destructor:\\n";
    { Transaction t{"cursed"}; }

    std::cout << "\\nstill running -- nothing terminated.\\n";
}`,
          output: `  begin normal
  commit normal

failing commit, caught by the caller:
  begin doomed
  rollback doomed
  caught: commit failed

failing rollback, contained inside the destructor:
  begin cursed
  rollback cursed
  [error] rollback of cursed failed: rollback failed

still running -- nothing terminated.`,
          explanation:
            "**Two failures, and neither killed the process.** The failing `commit` threw where the caller could catch it, and the destructor then ran the rollback during unwinding — exactly the RAII guarantee. The failing *rollback* was caught inside the destructor and reported to `std::cerr` rather than propagated. Note `std::cerr` and not `std::cout`: it is unbuffered, so the message survives even if the program subsequently dies, which is the same lesson module 5 taught with the lost `cout` output.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is stack unwinding?",
      answer:
        "The process a `throw` performs while searching for a handler: for every scope between the throw point and the matching `catch`, it destroys the automatic objects in reverse order of construction before moving outward. That is what makes RAII work — every `unique_ptr`, `lock_guard` and container on the abandoned frames releases its resource without any cleanup code being written. It is also why C++ has no `finally`: cleanup lives in the destructor of the owning type, written once, rather than at every call site that might fail. If no handler matches anywhere, `std::terminate` is called, and the standard permits the implementation to skip unwinding entirely in that case.",
    },
    {
      question: "Why throw by value and catch by const reference?",
      answer:
        "Throwing by value lets the implementation copy the exception object into its own storage, so it survives unwinding; throwing a pointer to a local dangles, and throwing `new X` leaks unless every handler deletes it. Catching by `const&` avoids a copy and — more importantly — avoids slicing: catching by value truncates a derived exception to the base type and discards exactly the information you needed. Catching by non-const reference is legal but rarely useful, since handlers normally only inspect.",
    },
    {
      question: "Does catch handler order matter?",
      answer:
        "Yes. Matching is strictly top-to-bottom and stops at the first handler that can accept the exception — there is no best-match selection as in overload resolution. So handlers must be ordered most-derived first: a `catch (const std::exception&)` above a `catch (const std::out_of_range&)` makes the second unreachable, and compilers warn about it. It is the opposite of overload resolution, and it is the main way exception handling surprises people coming from other languages.",
    },
    {
      question: "What is the difference between `throw;` and `throw e;` inside a catch block?",
      answer:
        "`throw;` with no operand rethrows the *current* exception, preserving its dynamic type and the original object. `throw e;` throws a copy of `e` using its static type, so an exception caught as `std::exception&` and rethrown that way is sliced down to `std::exception` and outer handlers for the derived type will no longer match. Since logging-then-rethrowing is a common pattern, and the handler there usually catches a base type, this is a real bug — always use the bare `throw;`.",
    },
    {
      question: "What happens if a destructor throws?",
      answer:
        "Destructors are implicitly `noexcept` since C++11, so an escaping exception calls `std::terminate` immediately — no unwinding, no handlers, and even a `catch (...)` is powerless. The rule exists because a destructor running during unwinding that throws would put two exceptions in flight, which the language cannot represent. The design consequence is that cleanup which can fail should be exposed as an explicit `close()` or `commit()` that callers can check, with the destructor as a safety net that performs the same work and swallows failures — logging to `std::cerr` rather than propagating. `noexcept(false)` can override the default and essentially never should.",
    },
    {
      question: "How is the standard exception hierarchy organised?",
      answer:
        "`std::exception` is the root with `what()`. Its two main children are `std::logic_error` — errors a caller could have prevented, including `invalid_argument`, `domain_error`, `length_error` and `out_of_range` — and `std::runtime_error`, for conditions only detectable at run time, including `range_error`, `overflow_error` and `system_error`. Two details catch people: `out_of_range`, thrown by `vector::at` and `map::at`, is a *logic* error rather than a runtime one; and `bad_alloc`, `bad_cast` and `bad_optional_access` derive directly from `std::exception` and from neither branch, so a handler catching only `runtime_error` misses them all.",
    },
  ],
  takeaways: [
    "`throw` unwinds the stack, destroying automatic objects in reverse order of construction",
    "That guarantee is what makes RAII work and why C++ needs no `finally`",
    "If no handler matches, `std::terminate` runs — possibly without unwinding at all",
    "Throw by value; a thrown pointer to a local dangles and a thrown `new` leaks",
    "Catch by `const&`; catching by value slices the exception to its base type",
    "Handlers match top-to-bottom with no best-match rule — order most-derived first",
    "`throw;` rethrows the original; `throw e;` throws a sliced copy",
    "Derive custom exceptions from `runtime_error` or `logic_error` so `what()` works generically",
    "`out_of_range` is a `logic_error`; `bad_alloc` derives from neither branch",
    "Destructors are implicitly `noexcept` — throwing from one calls `std::terminate`",
    "Two exceptions cannot be in flight at once, which is why the rule exists",
    "For fallible cleanup, expose an explicit `commit()`/`close()` and make the destructor a swallowing safety net",
    "Report destructor failures on unbuffered `std::cerr`, never `std::cout`",
  ],
  status: "available",
};
