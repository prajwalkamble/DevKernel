import type { Lesson } from "@/content/types";

export const designingClassLesson: Lesson = {
  id: "cpp-designing-a-class",
  slug: "designing-a-class-interfaces-and-invariants",
  moduleSlug: "production-cpp",
  title: "Designing a Class: Interfaces, Invariants & API Ergonomics",
  summary:
    "The consolidation pass. What a class is *for*, how to choose its invariant, and the rule that outranks every other piece of advice in this track — make invalid states unrepresentable, and the checks you were going to write become unnecessary.",
  estimatedMinutes: 40,
  objectives: [
    "State a class's invariant and design the interface around it",
    "Make invalid states unrepresentable rather than validated",
    "Choose between a class, a struct, and a free function",
    "Apply the rule of zero and design for value semantics",
    "Judge an API by how easy it is to misuse",
  ],
  sections: [
    {
      id: "invariants",
      heading: "A class exists to maintain an invariant",
      body: [
        "**If a type has no invariant, it should not be a class.** A bundle of independently valid fields is a `struct` with public members — adding private data and getters that return it unchanged is ceremony, not encapsulation.",
        "**The invariant is the reason for the private section.** `Money` keeps `cents_` an integer so no rounding error can accumulate. `SortedSet` keeps its vector sorted so `binary_search` is valid. `Connection` keeps its handle either valid or null so the destructor is always safe.",
        "Once the invariant is written down — module 10 lesson 7 argued for it as a `private bool invariant() const` — the interface follows almost mechanically. **Every public mutator must take the object from a valid state to a valid state**, and anything that cannot promise that does not belong in the interface.",
        "This is also the test for whether an operation should be a member at all. **A function that needs no access to the private state should be a free function**, because it cannot break the invariant and does not need the privilege. Scott Meyers' argument still holds: free non-member functions increase encapsulation, since fewer functions can touch the representation.",
        "**The strongest version of this is to remove the invalid states from the type.** A `Percentage` that cannot hold 150 needs no range check anywhere. An `enum class` cannot hold an undefined value. A `variant` cannot be in an alternative you failed to handle. Every state you make unrepresentable is a check you never write, a test you never need, and a bug that cannot occur.",
      ],
      examples: [
        {
          id: "unrepresentable",
          title: "A type with no invalid state, and types that cannot be confused",
          lang: "cpp",
          code: `#include <iostream>
#include <optional>
#include <string>
#include <string_view>

// No public constructor, so an invalid EmailAddress cannot exist.
// Every function taking one can therefore skip validation entirely.
class EmailAddress {
public:
    static std::optional<EmailAddress> parse(std::string_view text) {
        auto at = text.find('@');
        if (at == std::string_view::npos || at == 0) return std::nullopt;
        auto dot = text.find('.', at);
        if (dot == std::string_view::npos || dot + 1 >= text.size())
            return std::nullopt;
        return EmailAddress{std::string{text}};
    }

    std::string_view value() const noexcept { return value_; }
    std::string_view domain() const noexcept {
        return std::string_view{value_}.substr(value_.find('@') + 1);
    }
    bool operator==(const EmailAddress&) const = default;

private:
    explicit EmailAddress(std::string v) : value_(std::move(v)) {}
    std::string value_;
};

// A strong typedef. Seconds and Minutes are unrelated types, so the
// units cannot be transposed at a call site.
template <typename Tag>
class Duration {
public:
    constexpr explicit Duration(long long n) : n_(n) {}
    constexpr long long count() const { return n_; }
    constexpr Duration operator+(Duration o) const { return Duration{n_ + o.n_}; }
private:
    long long n_;
};
struct SecondsTag {}; struct MinutesTag {};
using Seconds = Duration<SecondsTag>;
using Minutes = Duration<MinutesTag>;

void sleepFor(Seconds s) { std::cout << "  sleeping " << s.count() << "s\\n"; }

int main() {
    for (std::string_view s : {"ada@example.com", "nope", "@example.com", "a@b"}) {
        auto e = EmailAddress::parse(s);
        std::cout << "  parse(\\"" << s << "\\") -> ";
        if (e) std::cout << e->value() << "  (domain " << e->domain() << ")\\n";
        else   std::cout << "rejected\\n";
    }

    std::cout << "\\nstrong types:\\n";
    sleepFor(Seconds{30});
    // sleepFor(Minutes{30});   // ERROR: no conversion -- that is the point
    // sleepFor(30);            // ERROR: the constructor is explicit
    std::cout << "  sleepFor(Minutes{30}) does not compile\\n";
}`,
          output: `  parse("ada@example.com") -> ada@example.com  (domain example.com)
  parse("nope") -> rejected
  parse("@example.com") -> rejected
  parse("a@b") -> rejected

strong types:
  sleeping 30s
  sleepFor(Minutes{30}) does not compile`,
          explanation:
            "**Once `EmailAddress` exists, no function taking one needs to validate it** — the private constructor plus the `optional`-returning factory means an invalid instance cannot be constructed. That is module 10's factory pattern used as a *design* tool rather than an error-handling one. The `Duration` pair is the other half: `Seconds` and `Minutes` share an implementation and are different types, so the Mars Climate Orbiter class of bug becomes a compile error. **Both are the same move — push the checking into the type system and delete the runtime checks.**",
        },
      ],
      pitfalls: [
        {
          title: "Getters and setters for every field are not encapsulation",
          body: "A class whose interface is `getX`/`setX` for each member has exactly the same invariants as a `struct` with public members — namely none — while being longer to write and read. The question to ask is not \"should this be private?\" but \"what is true of this object that the caller must not be able to break?\" If the answer is nothing, make it a `struct`, make the members public, and move on. If the answer is something, the interface should expose *operations* that preserve it — `deposit(amount)` rather than `setBalance(x)` — because only then does the private section mean anything.",
        },
      ],
    },
    {
      id: "ergonomics",
      heading: "Designing for the caller",
      body: [
        "**\"Easy to use correctly and hard to use incorrectly\"** is the standard formulation, and it is worth making concrete.",
        "**The right default is the safe one.** A constructor that must be called with a lock held, a method that must be called after `init()`, a pointer parameter that must not be null — each is a rule the caller has to remember, and each is better expressed as a type or a structure that removes the choice.",
        "**Same-typed adjacent parameters are a defect.** `resize(int width, int height)` will be called with the arguments swapped, and nothing will catch it. Strong types fix it; so does a small struct with designated initialisers, which module 9 lesson 7 measured making the call site self-documenting.",
        "**Return values beat out-parameters.** They compose, they cannot be forgotten, they work with `const`, and copy elision means they cost nothing. `std::optional` and `std::expected` cover the fallible cases.",
        "**Prefer the narrowest parameter type that works** — `std::span<const T>` over a pointer and length, `std::string_view` over `const std::string&` for read-only text, a concept-constrained template over an unconstrained one.",
        "**Name things for what they mean, not how they work.** `retryAfter` beats `timeout2`, and a `[[nodiscard]]` on anything whose result must not be ignored turns a documentation comment into a compiler warning.",
        "**And make the common case short.** If every caller writes the same three lines to set up your type, those three lines belong inside it.",
      ],
      examples: [
        {
          id: "ergonomics-example",
          title: "The same API, before and after",
          lang: "cpp",
          code: `#include <chrono>
#include <cstdint>
#include <expected>
#include <iostream>
#include <span>
#include <string>
#include <string_view>
#include <vector>

// ─────────────────────────── BEFORE ────────────────────────────────
// - three same-typed parameters that can be transposed
// - a bool whose meaning is invisible at the call site
// - an out-parameter and a status code
// - a raw pointer + length pair
namespace before {
int sendRequest(const char* host, int port, int timeoutMs, int retries,
                bool useTls, const uint8_t* body, size_t bodyLen,
                std::string* responseOut);
// call site: what are these numbers?
//   sendRequest("api.test", 443, 5000, 3, true, data, len, &resp);
}

// ─────────────────────────── AFTER ─────────────────────────────────
namespace after {

enum class Tls : bool { Off = false, On = true };

struct Timeout { std::chrono::milliseconds value; };
struct Retries { int value; };

struct RequestOptions {                     // designated initialisers
    Timeout timeout{std::chrono::milliseconds{5000}};
    Retries retries{3};
    Tls     tls = Tls::On;
};

enum class Error { Dns, Refused, TimedOut, BadStatus };

std::string_view describe(Error e) {
    switch (e) {
        case Error::Dns:       return "dns lookup failed";
        case Error::Refused:   return "connection refused";
        case Error::TimedOut:  return "timed out";
        case Error::BadStatus: return "bad status";
    }
    return "unknown";
}

// One required argument, everything else defaulted and named.
// The body is a span, so its length cannot be wrong.
[[nodiscard]] std::expected<std::string, Error>
sendRequest(std::string_view url,
            std::span<const std::byte> body = {},
            RequestOptions opts = {});

}   // namespace after

// A stub so the example runs.
namespace after {
std::expected<std::string, Error>
sendRequest(std::string_view url, std::span<const std::byte> body,
            RequestOptions opts) {
    if (url.find("://") == std::string_view::npos) return std::unexpected{Error::Dns};
    return "200 OK from " + std::string{url}
         + " (" + std::to_string(opts.timeout.value.count()) + "ms, "
         + std::to_string(opts.retries.value) + " retries, "
         + (opts.tls == Tls::On ? "tls" : "plain") + ", "
         + std::to_string(body.size()) + "B body)";
}
}

int main() {
    using namespace after;

    // The common case is one line.
    if (auto r = sendRequest("https://api.test/v1")) std::cout << "  " << *r << '\\n';

    // Anything unusual is NAMED at the call site.
    auto r2 = sendRequest("https://api.test/v1", {},
                          {.timeout = Timeout{std::chrono::milliseconds{500}},
                           .retries = Retries{1},
                           .tls     = Tls::Off});
    if (r2) std::cout << "  " << *r2 << '\\n';

    // Failure is in the type, and [[nodiscard]] stops it being ignored.
    if (auto bad = sendRequest("api.test/no-scheme"); !bad)
        std::cout << "  failed: " << describe(bad.error()) << '\\n';
}`,
          output: `$ g++ -std=c++23 ...        # std::expected is C++23; in C++20 use
                            # std::optional plus a separate error, or
                            # tl::expected
  200 OK from https://api.test/v1 (5000ms, 3 retries, tls, 0B body)
  200 OK from https://api.test/v1 (500ms, 1 retries, plain, 0B body)
  failed: dns lookup failed`,
          explanation:
            "**The `before` signature has four adjacent parameters that are all `int` or `bool`.** Nothing prevents transposing the timeout and the retry count, and `true` at a call site conveys nothing. The `after` version makes the common case one argument, names every option at the call site through designated initialisers, replaces the `bool` with a two-valued `enum class`, replaces the pointer-and-length with a `span`, and returns `std::expected` so failure cannot be silently dropped — with `[[nodiscard]]` enforcing that. **Every one of those changes removes a way to misuse the function.**",
        },
      ],
    },
    {
      id: "value-semantics",
      heading: "Value semantics and the rule of zero",
      body: [
        "**Design for value semantics unless you have a reason not to.** A type that copies, moves, compares and prints like an `int` composes with everything: it goes in containers, it works with algorithms, it can be a map key, and callers do not have to think about lifetime.",
        "**The rule of zero is the target.** If every member manages itself — `std::string`, `std::vector`, `std::unique_ptr` — the compiler generates correct copy, move, assignment and destruction, and you write none of it. Module 5 established this; the production consequence is that **a class declaring any of the five special members is a class to look at twice.**",
        "**When you must declare one, declare all five or `= default` them.** Declaring a destructor suppresses the move operations, which silently turns moves into copies — module 10 measured that costing a `vector` reallocation every element.",
        "**Prefer `= default` to hand-written bodies.** A defaulted copy constructor is `noexcept` when it can be, is trivially copyable when it can be, and stays correct when someone adds a member.",
        "**Give types the operations they should have.** `operator==` as `= default` since C++20, `operator<=>` for ordering, a `std::hash` specialisation if it will be a key, and a `std::formatter` or `operator<<` so it can be logged. Each is a few lines and each removes friction everywhere the type is used.",
        "**Make the type `const`-correct and `noexcept`-correct**: accessors `const`, move operations and `swap` `noexcept`, and nothing else marked `noexcept` unless it genuinely cannot fail.",
      ],
      examples: [
        {
          id: "value-type",
          title: "A complete value type, mostly written by the compiler",
          lang: "cpp",
          code: `#include <compare>
#include <cstdint>
#include <format>
#include <iostream>
#include <set>
#include <string>
#include <unordered_set>
#include <vector>

// Rule of zero: every member manages itself, so the compiler writes
// copy, move, assignment and destruction -- all correct, all noexcept
// where possible.
class Version {
public:
    constexpr Version(int major, int minor, int patch) noexcept
        : major_{major}, minor_{minor}, patch_{patch} {}

    constexpr int major() const noexcept { return major_; }
    constexpr int minor() const noexcept { return minor_; }
    constexpr int patch() const noexcept { return patch_; }

    // One line gives ==, !=, <, <=, >, >= with the right semantics.
    constexpr auto operator<=>(const Version&) const noexcept = default;
    constexpr bool operator==(const Version&) const noexcept = default;

    std::string toString() const {
        return std::format("{}.{}.{}", major_, minor_, patch_);
    }

private:
    int major_, minor_, patch_;
};

std::ostream& operator<<(std::ostream& os, const Version& v) {
    return os << v.toString();
}

// A hash specialisation, so it can be an unordered_set key.
template <> struct std::hash<Version> {
    std::size_t operator()(const Version& v) const noexcept {
        return std::hash<std::int64_t>{}(
            (std::int64_t{v.major()} << 40) ^
            (std::int64_t{v.minor()} << 20) ^  std::int64_t{v.patch()});
    }
};

int main() {
    std::vector<Version> vs{{1,2,3}, {1,10,0}, {0,9,9}, {1,2,3}};

    std::cout << "sorted (via <=>): ";
    std::set<Version> ordered{vs.begin(), vs.end()};
    for (const auto& v : ordered) std::cout << v << ' ';
    std::cout << "\\n";

    std::cout << "deduplicated (via hash + ==): ";
    std::unordered_set<Version> unique{vs.begin(), vs.end()};
    std::cout << unique.size() << " distinct\\n";

    std::cout << "comparison: 1.2.3 < 1.10.0 is "
              << std::boolalpha << (Version{1,2,3} < Version{1,10,0}) << '\\n';

    // constexpr: usable at compile time because nothing allocates.
    static_assert(Version{2,0,0} > Version{1,9,9});
    std::cout << "static_assert(2.0.0 > 1.9.9) passed at compile time\\n";
}`,
          output: `sorted (via <=>): 0.9.9 1.2.3 1.10.0
deduplicated (via hash + ==): 3 distinct
comparison: 1.2.3 < 1.10.0 is true
static_assert(2.0.0 > 1.9.9) passed at compile time`,
          explanation:
            "**Two defaulted lines gave `Version` all six comparison operators with correct member-wise semantics**, which is what makes it usable in a `std::set` with no comparator. Note `1.2.3 < 1.10.0` is `true` — member-wise comparison compares `minor` as an integer, which is the right answer and the one string comparison famously gets wrong. The class declares no destructor, no copy and no move, so the compiler generated all of them; and because nothing allocates, the whole type is `constexpr` and the `static_assert` runs at build time.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When should something be a class rather than a struct?",
      answer:
        "When it has an invariant — something that must be true of every instance and that callers must not be able to break. `Money` keeping cents as an integer, a sorted container staying sorted, a handle being valid or null. If there is no invariant, the private section protects nothing, and a `struct` with public members is shorter to write and read than the same fields behind getters and setters. The follow-on test is which operations should be members: a function needing no access to the private state should be a free function, because it cannot break the invariant and does not need the privilege, and fewer functions touching the representation is better encapsulation.",
    },
    {
      question: "What does \"make invalid states unrepresentable\" mean in practice?",
      answer:
        "Pushing validation into the type so the checks become unnecessary rather than merely centralised. An `EmailAddress` with a private constructor and a static `parse` returning `std::optional` cannot exist in an invalid state, so no function taking one needs to validate it. A `Percentage` that cannot hold 150 needs no range check anywhere. An `enum class` cannot hold an undefined value; a `std::variant` cannot be in an alternative a visitor failed to handle. Every state made unrepresentable is a check you never write, a test you never need, and a bug that cannot occur — which is why it outranks every other error-handling technique.",
    },
    {
      question: "What is wrong with adjacent same-typed parameters?",
      answer:
        "They will eventually be transposed and nothing will catch it. `resize(int width, int height)` and `sendRequest(host, port, timeoutMs, retries, useTls, ...)` both invite silent misuse, and a `bool` at a call site conveys nothing at all. The fixes are strong types — a `Seconds` and a `Minutes` that share an implementation but do not convert, so a units mix-up is a compile error — a small options struct with designated initialisers so every argument is named at the call site, and a two-valued `enum class` in place of any `bool` parameter. Each removes a way to call the function incorrectly.",
    },
    {
      question: "What is the rule of zero and what does violating it cost?",
      answer:
        "If every member manages its own resource — `std::string`, `std::vector`, `std::unique_ptr` — the compiler generates correct copy, move, assignment and destruction, and you write none of them. So a class declaring any of the five special members deserves a second look. The concrete cost of getting it wrong: declaring a destructor suppresses the implicitly generated move operations, so moves silently become copies, and module 10 measured that turning every element of a `vector` reallocation from a move into a copy. If you must declare one, declare or `= default` all five, and prefer `= default` to a hand-written body since the defaulted version stays correct when someone adds a member.",
    },
    {
      question: "What operations should a value type provide?",
      answer:
        "Enough that it composes with the standard library. `operator<=>` defaulted, which in one line yields all six comparisons with member-wise semantics and makes the type usable as a `std::set` key. A defaulted `operator==`. A `std::hash` specialisation if it will be an `unordered` key. A `std::formatter` or `operator<<` so it can be logged. Accessors marked `const`, move operations and `swap` marked `noexcept`. And `constexpr` where nothing allocates, which lets values be computed and asserted at build time. Each is a few lines and each removes friction at every use site.",
    },
    {
      question: "Why prefer return values to out-parameters?",
      answer:
        "They compose — a returned value can be passed straight into another call, where an out-parameter forces a named temporary. They cannot be forgotten, since there is no second thing to check. They work with `const`, where an out-parameter requires a mutable variable declared before the call and left holding a stale value if the call fails. And they cost nothing, because copy elision means the result is constructed directly in the caller's storage. `std::optional` covers the may-be-absent case and `std::expected` the may-fail case, both of which are `[[nodiscard]]`-friendly so ignoring them is a warning.",
    },
  ],
  takeaways: [
    "A type with no invariant should be a `struct` with public members, not a class with getters",
    "The invariant is the reason for the private section — write it down as a predicate",
    "A function needing no private access should be a free function; it improves encapsulation",
    "Make invalid states unrepresentable and the validation disappears rather than centralising",
    "A private constructor plus a factory returning `optional`/`expected` enforces validity by construction",
    "Strong types make a units mix-up a compile error rather than a runtime disaster",
    "Adjacent same-typed parameters will be transposed — use strong types or a named options struct",
    "Replace every `bool` parameter with a two-valued `enum class`",
    "Return values beat out-parameters: they compose, cannot be forgotten, and cost nothing",
    "Aim for the rule of zero; a class declaring a special member deserves a second look",
    "Declaring a destructor suppresses the moves, silently turning them into copies",
    "Defaulted `operator<=>` gives all six comparisons in one line",
    "Add `hash` and a formatter so the type composes with containers and logging",
  ],
  status: "available",
};
