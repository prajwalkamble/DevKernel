import type { Lesson } from "@/content/types";

export const expectedLesson: Lesson = {
  id: "cpp-expected",
  slug: "std-expected-returning-errors-as-values",
  moduleSlug: "error-handling",
  title: "std::expected & Returning Errors as Values",
  summary:
    "C++23's answer to the out-parameter: a return type holding either a value or a typed error, which the caller cannot unwrap without acknowledging the failure. Monadic chaining that keeps the happy path readable, and the trade against exceptions stated plainly.",
  estimatedMinutes: 35,
  objectives: [
    "Return `std::expected<T, E>` and consume it correctly",
    "Distinguish it from `optional`, error codes and exceptions",
    "Chain fallible operations with `and_then`, `transform` and `or_else`",
    "Say what it costs in space and on the failure path",
    "Choose between `expected` and exceptions for a given API",
  ],
  sections: [
    {
      id: "the-type",
      heading: "A value or an error, in one return",
      body: [
        "**`std::expected<T, E>` holds either a `T` (the success value) or an `E` (the error), never both and never neither.** It is C++23, and it is the standard version of a type that has existed in Boost, Abseil, and half the C++ codebases in the world under names like `Result`, `Outcome` and `StatusOr`.",
        "It fixes the two weaknesses the previous lesson named. **It cannot be ignored** — it is `[[nodiscard]]`, so discarding the result is a warning. And **there is no out-parameter to leave stale**, because the value and the error occupy the same storage.",
        "The interface mirrors `optional`. **`has_value()` and `operator bool`** ask which it holds. **`operator*` and `operator->`** access the value *unchecked*, so they are undefined behaviour on an error. **`value()`** is checked and throws `std::bad_expected_access<E>` — which carries the error. **`error()`** accesses the error, and is likewise undefined behaviour when a value is present. **`value_or(fallback)`** never fails.",
        "**Return an error with `std::unexpected{e}`**, which is a small wrapper that disambiguates the two cases when `T` and `E` could otherwise be confused.",
        "**It costs the larger of `T` and `E`, plus a discriminant.** `expected<int, ParseError>` is 8 bytes for a 4-byte `int` — the same shape as `optional<int>`, with the spare space carrying an error instead of nothing.",
      ],
      examples: [
        {
          id: "expected-basics",
          title: "A parser that returns its failures",
          lang: "cpp",
          code: `#include <expected>
#include <iostream>
#include <string_view>

enum class ParseError { empty, badDigit, outOfRange };

std::string_view describe(ParseError e) {
    switch (e) {
        case ParseError::empty:      return "empty input";
        case ParseError::badDigit:   return "invalid digit";
        case ParseError::outOfRange: return "out of range";
    }
    return "unknown";
}

// The return type states both outcomes.
std::expected<int, ParseError> parsePort(std::string_view s) {
    if (s.empty()) return std::unexpected{ParseError::empty};
    int value = 0;
    for (char c : s) {
        if (c < '0' || c > '9') return std::unexpected{ParseError::badDigit};
        value = value * 10 + (c - '0');
        if (value > 65535) return std::unexpected{ParseError::outOfRange};
    }
    return value;
}

// Errors compose: and_then chains only on success.
std::expected<int, ParseError> parsePrivilegedPort(std::string_view s) {
    return parsePort(s).and_then([](int p) -> std::expected<int, ParseError> {
        if (p >= 1024) return std::unexpected{ParseError::outOfRange};
        return p;
    });
}

int main() {
    std::cout << "sizeof(std::expected<int, ParseError>) = "
              << sizeof(std::expected<int, ParseError>) << '\\n';
    std::cout << "sizeof(int) = " << sizeof(int) << "\\n\\n";

    for (std::string_view s : {"8080", "", "80x", "99999"}) {
        auto r = parsePort(s);
        std::cout << "  parsePort(\\"" << s << "\\") -> ";
        if (r) std::cout << *r << '\\n';
        else   std::cout << "error: " << describe(r.error()) << '\\n';
    }

    std::cout << "\\nchained with and_then:\\n";
    for (std::string_view s : {"80", "8080"}) {
        auto r = parsePrivilegedPort(s);
        std::cout << "  parsePrivilegedPort(\\"" << s << "\\") -> ";
        if (r) std::cout << *r << '\\n';
        else   std::cout << "error: " << describe(r.error()) << '\\n';
    }

    std::cout << "\\nvalue_or           : "
              << parsePort("nope").value_or(-1) << '\\n';
    std::cout << "transform on success: "
              << parsePort("443").transform([](int p) { return p * 2; }).value_or(-1)
              << '\\n';

    try {
        (void)parsePort("").value();
    } catch (const std::bad_expected_access<ParseError>& e) {
        std::cout << "\\nvalue() on an error threw, error = "
                  << describe(e.error()) << '\\n';
    }
}`,
          output: `sizeof(std::expected<int, ParseError>) = 8
sizeof(int) = 4

  parsePort("8080") -> 8080
  parsePort("") -> error: empty input
  parsePort("80x") -> error: invalid digit
  parsePort("99999") -> error: out of range

chained with and_then:
  parsePrivilegedPort("80") -> 80
  parsePrivilegedPort("8080") -> error: out of range

value_or           : -1
transform on success: 886

value() on an error threw, error = empty input`,
          explanation:
            "**Eight bytes carry a four-byte `int` and a full error enumeration** — the same footprint as `optional<int>`, with the spare space doing useful work. Three failure modes are distinguished by *type*, not by a magic return value, so a caller can respond differently to bad input and to an out-of-range port. And note `bad_expected_access<E>` carries the error itself, so even the throwing accessor does not lose information.",
        },
      ],
      pitfalls: [
        {
          title: "`operator*` and `error()` are both unchecked",
          body: "`*result` on an error is undefined behaviour, and `result.error()` on a success is *also* undefined behaviour — the type has two unchecked accessors, one for each side, and both assume you have already tested. This differs from `optional`, where only one side exists. Always branch on `has_value()` or `operator bool` first, or use the checked `value()` and the monadic operations. It is the single most common way `expected` code goes wrong, and sanitizers will not always catch it because the storage is a valid object of the other type.",
        },
      ],
    },
    {
      id: "chaining",
      heading: "Chaining without pyramids",
      body: [
        "The historical objection to returning errors is that it clutters every call site: check, branch, propagate, repeat, and the actual logic disappears into a staircase of `if`s.",
        "**The monadic operations answer that.** Each one runs only on one side of the result and passes the other through untouched.",
        "**`and_then(f)`** — on success, calls `f(value)` which itself returns an `expected`; on error, passes the error through. This is the composition operator: chain fallible steps and the first failure short-circuits the rest.",
        "**`transform(f)`** — on success, applies `f` to the value and rewraps the plain result; on error, passes it through. Use it when `f` cannot fail.",
        "**`or_else(f)`** — the mirror image: runs only on error, for recovery or for translating one error type into another.",
        "**`transform_error(f)`** — maps the error to a different type while leaving a success untouched, which is how you convert a low-level error into your own domain error as it crosses a layer boundary.",
        "The result reads as a pipeline of the successful path, with failures handled once at the end — the same shape as `optional`'s C++23 monadic operations, and as `Result` in Rust.",
      ],
      examples: [
        {
          id: "pipeline",
          title: "A three-stage pipeline where the first failure wins",
          lang: "cpp",
          code: `#include <expected>
#include <iostream>
#include <string>
#include <string_view>

struct Config { std::string host; int port; };

enum class Error { missingColon, badPort, portOutOfRange, hostEmpty };

std::string_view describe(Error e) {
    switch (e) {
        case Error::missingColon:   return "expected host:port";
        case Error::badPort:        return "port is not a number";
        case Error::portOutOfRange: return "port must be 1-65535";
        case Error::hostEmpty:      return "host is empty";
    }
    return "unknown";
}

std::expected<std::pair<std::string, std::string>, Error>
split(std::string_view s) {
    auto colon = s.find(':');
    if (colon == std::string_view::npos) return std::unexpected{Error::missingColon};
    return std::pair{std::string{s.substr(0, colon)},
                     std::string{s.substr(colon + 1)}};
}

std::expected<Config, Error>
build(const std::pair<std::string, std::string>& parts) {
    if (parts.first.empty()) return std::unexpected{Error::hostEmpty};
    int port = 0;
    for (char c : parts.second) {
        if (c < '0' || c > '9') return std::unexpected{Error::badPort};
        port = port * 10 + (c - '0');
    }
    if (port < 1 || port > 65535) return std::unexpected{Error::portOutOfRange};
    return Config{parts.first, port};
}

// The whole pipeline, with no explicit error checks between stages.
std::expected<Config, Error> parseEndpoint(std::string_view s) {
    return split(s).and_then(build);
}

int main() {
    for (std::string_view s : {"example.com:8080", "example.com",
                               ":80", "example.com:http", "example.com:0"}) {
        auto r = parseEndpoint(s);
        std::cout << "  \\"" << s << "\\"\\n    -> ";
        if (r) std::cout << r->host << " on port " << r->port << '\\n';
        else   std::cout << "error: " << describe(r.error()) << '\\n';
    }

    // transform_error translates an error as it crosses a boundary.
    auto asMessage = parseEndpoint("nope")
        .transform_error([](Error e) { return std::string{describe(e)}; });
    std::cout << "\\ntranslated error type: " << asMessage.error() << '\\n';
}`,
          output: `  "example.com:8080"
    -> example.com on port 8080
  "example.com"
    -> error: expected host:port
  ":80"
    -> error: host is empty
  "example.com:http"
    -> error: port is not a number
  "example.com:0"
    -> error: port must be 1-65535

translated error type: expected host:port`,
          explanation:
            "**`split(s).and_then(build)` is the entire pipeline** — no `if` between the stages, and the first failure short-circuits the rest while carrying its own error out. Each stage states its failures in its return type, so the set of things that can go wrong is visible in the signatures rather than buried in the bodies. `transform_error` at the bottom shows the layer-boundary use: the internal `Error` enum becomes a `std::string` for a caller that should not know about it.",
        },
      ],
    },
    {
      id: "choosing",
      heading: "`expected` against the alternatives",
      body: [
        "**Against `optional`**: use `optional` when there is nothing useful to say about the absence — a lookup that missed, an unset field. Use `expected` when the caller needs to know *why*. `optional<T>` is `expected<T, monostate>` in spirit.",
        "**Against error codes**: `expected` is strictly better where it is available. It cannot be ignored, has no out-parameter, no stale value on failure, and the error type is yours rather than an `int`. The reasons to still use `error_code` are C++20 or earlier, an ABI or C boundary, and interoperating with an existing code-based API.",
        "**Against exceptions**: this is the real decision, and it is the same one as the previous lesson. `expected` makes failure **visible in the signature** and **local to the call**, which is what you want for expected failures. Exceptions propagate automatically through frames that cannot help, which is what you want for rare ones. The costs invert accordingly: `expected` costs a branch per call site on the success path; exceptions cost nothing on success and microseconds on failure.",
        "**`expected` cannot report failure from a constructor**, which has no return value. That is a genuine gap, and the workarounds are a static factory function returning `expected<T, E>` with a private constructor, or a two-phase initialisation you should generally avoid.",
        "**Do not convert an exception-based codebase wholesale.** Mixed models are worse than either consistently applied. Introduce `expected` at new API boundaries, where failure is routine and local.",
      ],
      examples: [
        {
          id: "factory",
          title: "The constructor problem, and the factory that solves it",
          lang: "cpp",
          code: `#include <expected>
#include <iostream>
#include <string>
#include <string_view>

enum class ConnError { badUrl, refused };

std::string_view describe(ConnError e) {
    return e == ConnError::badUrl ? "malformed url" : "connection refused";
}

class Connection {
public:
    // A constructor cannot return an error, so it is private and
    // the factory does the validating.
    static std::expected<Connection, ConnError> open(std::string_view url) {
        if (!url.starts_with("tcp://")) return std::unexpected{ConnError::badUrl};
        if (url.ends_with(":9")) return std::unexpected{ConnError::refused};
        return Connection{std::string{url}};
    }

    const std::string& url() const { return url_; }

private:
    explicit Connection(std::string u) : url_(std::move(u)) {}
    std::string url_;
};

int main() {
    for (std::string_view u : {"tcp://db:5432", "http://db:80", "tcp://db:9"}) {
        auto c = Connection::open(u);
        std::cout << "  open(\\"" << u << "\\") -> ";
        if (c) std::cout << "connected to " << c->url() << '\\n';
        else   std::cout << "error: " << describe(c.error()) << '\\n';
    }

    std::cout << "\\nthe type system now guarantees a Connection object\\n"
                 "cannot exist in a failed state.\\n";
}`,
          output: `  open("tcp://db:5432") -> connected to tcp://db:5432
  open("http://db:80") -> error: malformed url
  open("tcp://db:9") -> error: connection refused

the type system now guarantees a Connection object
cannot exist in a failed state.`,
          explanation:
            "**The private constructor is what makes the guarantee real.** Because the only way to obtain a `Connection` is through `open`, and `open` returns an `expected`, a `Connection` that exists is necessarily valid — there is no half-constructed or error state to check for later. That is a stronger invariant than a throwing constructor gives you and much stronger than an `isValid()` flag, and it is the standard pattern for fallible construction without exceptions.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is `std::expected<T, E>` and what problem does it solve?",
      answer:
        "A C++23 type holding either a success value of type `T` or an error of type `E`, never both. It fixes the two weaknesses of error codes: it is `[[nodiscard]]`, so ignoring it is a warning, and it has no out-parameter, so there is no separate variable left holding a stale value on failure. It costs the larger of `T` and `E` plus a discriminant — `expected<int, SomeEnum>` is 8 bytes, the same as `optional<int>`. It is the standardisation of a pattern that already existed everywhere as `Result`, `Outcome` or `StatusOr`.",
    },
    {
      question: "How do you access the value in an `expected`, and what are the hazards?",
      answer:
        "`operator bool` and `has_value()` test which side is present. `operator*` and `operator->` access the value unchecked, and `error()` accesses the error unchecked — **both** are undefined behaviour on the wrong side, which differs from `optional` where only one side exists. `value()` is checked and throws `std::bad_expected_access<E>`, which carries the error. `value_or(fallback)` never fails. The common bug is calling `error()` without checking, and sanitizers may not catch it because the storage holds a valid object of the other type.",
    },
    {
      question: "What do the monadic operations do?",
      answer:
        "They let you chain fallible steps without a staircase of `if`s. `and_then(f)` calls `f` on success where `f` itself returns an `expected`, and passes an error straight through — so the first failure short-circuits the rest of the chain. `transform(f)` applies `f` to the value and rewraps, for steps that cannot fail. `or_else(f)` runs only on the error side, for recovery. `transform_error(f)` maps the error to a different type, which is how you translate a low-level error into a domain error at a layer boundary. The result reads as the successful path with failures handled once.",
    },
    {
      question: "When would you use `expected` rather than exceptions?",
      answer:
        "When failure is an expected part of normal operation and the caller will handle it locally — parsing, validation, lookups, I/O that routinely misses. `expected` makes the failure visible in the signature and forces the caller to acknowledge it, and it costs a branch per call on the success path. Exceptions are better when failure is rare, when intermediate frames cannot do anything useful and the error should propagate to a boundary, and in constructors, which have no return value. Exceptions cost nothing on success and microseconds on failure, which is the opposite profile.",
    },
    {
      question: "How do you report a construction failure without exceptions?",
      answer:
        "With a static factory returning `std::expected<T, E>` and a private constructor. The factory validates, returns `std::unexpected{...}` on failure, and constructs the object only when everything is known good. Because the constructor is private, the factory is the only way to obtain an instance, so any object that exists is necessarily valid — a stronger invariant than a throwing constructor and far stronger than an `isValid()` flag. The alternative, two-phase initialisation with an `init()` method, leaves a window where the object exists in an unusable state and should generally be avoided.",
    },
    {
      question: "When is `optional` the right choice rather than `expected`?",
      answer:
        "When there is nothing useful to say about why the value is absent — a map lookup that missed, an optional configuration field, the first element of a possibly-empty range. Adding an error type there produces a single meaningless enumerator and forces callers to handle a distinction that does not exist. Use `expected` as soon as the caller might reasonably respond differently to different failures, which for anything parsing or validating external input is almost always. `optional<T>` is essentially `expected<T, monostate>`.",
    },
  ],
  takeaways: [
    "`std::expected<T, E>` (C++23) holds a value or a typed error, never both",
    "It is `[[nodiscard]]` and has no out-parameter, fixing both error-code weaknesses",
    "It costs the larger of `T` and `E` plus a discriminant — 8 bytes for `expected<int, enum>`",
    "Return failure with `std::unexpected{e}`",
    "`operator*` and `error()` are **both** unchecked — always test first",
    "`value()` throws `bad_expected_access<E>`, which carries the error",
    "`and_then` chains fallible steps and short-circuits on the first failure",
    "`transform` maps the value, `or_else` recovers, `transform_error` retypes the error",
    "Use `optional` when absence needs no explanation, `expected` when it does",
    "`expected` for expected, locally-handled failures; exceptions for rare ones crossing frames",
    "A constructor cannot return an `expected` — use a static factory with a private constructor",
    "Do not convert an exception-based codebase wholesale; introduce it at new boundaries",
  ],
  status: "available",
};
