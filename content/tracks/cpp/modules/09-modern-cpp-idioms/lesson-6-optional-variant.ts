import type { Lesson } from "@/content/types";

export const optionalVariantLesson: Lesson = {
  id: "cpp-optional-variant",
  slug: "optional-and-variant",
  moduleSlug: "modern-cpp-idioms",
  title: "optional & variant — Absence and Choice, Honestly",
  summary:
    "Two vocabulary types that put facts in the type system. A return type that can say nothing without a sentinel value or an out-parameter, and a checked tagged union whose visitor the compiler forces you to complete.",
  estimatedMinutes: 40,
  objectives: [
    "Return `std::optional` instead of a sentinel, a bool flag or an out-parameter",
    "Distinguish `value()`, `operator*` and `value_or`",
    "Use `std::variant` for a closed set of alternatives",
    "Write a visitor with the overloaded idiom and know why it must be exhaustive",
    "Say when a variant beats an inheritance hierarchy",
  ],
  sections: [
    {
      id: "optional",
      heading: "`std::optional` — a value, or nothing",
      body: [
        "A function that may fail to produce a value has historically had bad options. **Return a sentinel** — `-1`, `nullptr`, `npos` — which requires a value that cannot legitimately occur and which callers forget to check. **Return a bool and take an out-parameter**, which forces a default-constructed variable at every call site and reads badly. **Throw**, which is wrong when absence is ordinary rather than exceptional.",
        "**`std::optional<T>` says it in the type**: this either holds a `T` or holds nothing. The caller cannot get at the value without acknowledging the possibility.",
        "It is a value type — `sizeof(std::optional<int>)` is 8, an `int` plus a bool plus padding — with no allocation. The contained object is stored inline.",
        "**Three ways to get the value out, with different failure behaviour.** `value()` throws `std::bad_optional_access` if empty. `operator*` and `operator->` do **not check** — using them on an empty optional is undefined behaviour, exactly like dereferencing a null pointer. `value_or(default)` returns a fallback and never fails.",
        "**Use it for ordinary absence, not for errors.** A lookup that finds nothing, a parse of optional input, a configuration field that may be unset. When the caller needs to know *why* something failed, `std::expected` from module 10 is the right type.",
      ],
      examples: [
        {
          id: "optional-basics",
          title: "Parsing and lookup that can honestly return nothing",
          lang: "cpp",
          code: `#include <iostream>
#include <optional>
#include <string>
#include <vector>

// optional: a return type that can honestly say "nothing".
std::optional<int> parseInt(const std::string& s) {
    try {
        std::size_t pos = 0;
        int v = std::stoi(s, &pos);
        if (pos != s.size()) return std::nullopt;   // trailing junk
        return v;
    } catch (...) {
        return std::nullopt;
    }
}

struct Config { std::string host; int port; };

std::optional<Config> findConfig(const std::vector<Config>& all,
                                 const std::string& host) {
    for (const auto& c : all)
        if (c.host == host) return c;
    return std::nullopt;
}

int main() {
    std::cout << "sizeof(int)                = " << sizeof(int) << '\\n';
    std::cout << "sizeof(std::optional<int>) = "
              << sizeof(std::optional<int>) << '\\n';

    for (const std::string s : {"42", "-7", "abc", "12x", ""}) {
        auto v = parseInt(s);
        std::cout << "  parseInt(\\"" << s << "\\") = ";
        if (v) std::cout << *v << '\\n';
        else   std::cout << "(nothing)\\n";
    }

    std::vector<Config> configs{{"a.test", 80}, {"b.test", 443}};

    auto found   = findConfig(configs, "b.test");
    auto missing = findConfig(configs, "z.test");
    std::cout << "\\nport of b.test  = " << (found   ? found->port   : -1) << '\\n';
    std::cout << "port of z.test  = " << (missing ? missing->port : -1)
              << "  (default)\\n";

    // if-init keeps the optional scoped to the branch that uses it.
    if (auto c = findConfig(configs, "a.test"); c) {
        std::cout << "found " << c->host << ':' << c->port << '\\n';
    }

    // value() throws; operator* does not check.
    std::optional<int> empty;
    try { (void)empty.value(); }
    catch (const std::bad_optional_access& e) {
        std::cout << "\\nvalue() on an empty optional threw: " << e.what() << '\\n';
    }
    std::cout << "operator* on an empty optional is UNDEFINED BEHAVIOUR.\\n";
}`,
          output: `sizeof(int)                = 4
sizeof(std::optional<int>) = 8
  parseInt("42") = 42
  parseInt("-7") = -7
  parseInt("abc") = (nothing)
  parseInt("12x") = (nothing)
  parseInt("") = (nothing)

port of b.test  = 443
port of z.test  = -1  (default)
found a.test:80

value() on an empty optional threw: bad optional access
operator* on an empty optional is UNDEFINED BEHAVIOUR.`,
          explanation:
            "**`parseInt(\"12x\")` returns nothing rather than 12**, which a sentinel-based API usually gets wrong — `std::stoi` alone would happily return 12 and discard the `x`. Note the contrast at the bottom: `value()` is checked and throws, while `operator*` is unchecked and is the same hazard as a null pointer dereference. Use `*` only after you have tested, which the `if (v)` and `if-init` forms make natural.",
        },
      ],
      pitfalls: [
        {
          title: "`std::optional<T&>` does not exist, and `optional<bool>` is a trap",
          body: "There is no `optional` of a reference — it was left out of C++17 because the assignment semantics were contentious (should assigning rebind or assign through?). Use a pointer, which already has a null state, or `std::reference_wrapper<T>`. Separately, `std::optional<bool>` has three states — empty, `true`, `false` — and `if (opt)` tests *emptiness*, not the contained value, so an optional holding `false` is truthy. That is a genuinely confusing combination; prefer an enum with three named states.",
        },
      ],
    },
    {
      id: "variant",
      heading: "`std::variant` — one of a fixed set",
      body: [
        "**`std::variant<A, B, C>` holds exactly one of its alternatives at a time**, and knows which. It is a *type-safe* tagged union: the discriminant is maintained for you, and reading the wrong alternative is caught rather than reinterpreting bytes.",
        "That is the difference from a C `union`, where reading a member you did not write is undefined behaviour with no diagnostic.",
        "**It costs the size of its largest alternative plus a tag**, rounded for alignment — 40 bytes for `variant<int, double, std::string, bool>` where `std::string` is 32. **No allocation**: the value lives inside the variant.",
        "Accessing it: **`std::get<T>` or `std::get<I>`** throws `std::bad_variant_access` if that alternative is not active. **`std::get_if<T>`** takes a pointer and returns null instead of throwing — the checked, non-throwing form. **`holds_alternative<T>`** is a simple boolean test. **`index()`** gives the active alternative's position.",
        "**`std::visit` is the important one.** It calls a callable with whichever alternative is active, and **the callable must handle every alternative or the code does not compile.** That exhaustiveness check is the main reason to prefer a variant to a hand-rolled tag-and-union: adding a fourth alternative breaks every visitor that has not been updated, at compile time.",
      ],
      examples: [
        {
          id: "variant-visit",
          title: "A visitor built from lambdas, and the checked accessors",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <variant>
#include <vector>

// A closed set of types, checked at compile time.
using Value = std::variant<int, double, std::string, bool>;

// The overloaded idiom: build a visitor from several lambdas.
template <class... Ts> struct overloaded : Ts... { using Ts::operator()...; };
template <class... Ts> overloaded(Ts...) -> overloaded<Ts...>;

std::string describe(const Value& v) {
    return std::visit(overloaded{
        [](int i)                { return "int "    + std::to_string(i); },
        [](double d)             { return "double " + std::to_string(d); },
        [](const std::string& s) { return "string \\"" + s + "\\""; },
        [](bool b)               { return std::string{"bool "}
                                          + (b ? "true" : "false"); },
    }, v);
}

int main() {
    std::cout << "sizeof(std::variant<int,double,std::string,bool>) = "
              << sizeof(Value) << '\\n';
    std::cout << "sizeof(std::string) = " << sizeof(std::string) << "  "
              << "(variant = largest member + a tag, rounded for alignment)\\n\\n";

    std::vector<Value> values{42, 3.5, std::string{"hello"}, true};

    for (const auto& v : values)
        std::cout << "  index " << v.index() << " : " << describe(v) << '\\n';

    // get_if is the checked, non-throwing accessor.
    std::cout << "\\nget_if:\\n";
    for (const auto& v : values)
        if (const auto* s = std::get_if<std::string>(&v))
            std::cout << "  found a string: " << *s << '\\n';

    // get throws if the alternative is not active.
    Value v = 7;
    try { (void)std::get<std::string>(v); }
    catch (const std::bad_variant_access& e) {
        std::cout << "\\nget<wrong type> threw: " << e.what() << '\\n';
    }

    std::cout << "holds_alternative<int>(v) = "
              << std::holds_alternative<int>(v) << '\\n';
}`,
          output: `sizeof(std::variant<int,double,std::string,bool>) = 40
sizeof(std::string) = 32  (variant = largest member + a tag, rounded for alignment)

  index 0 : int 42
  index 1 : double 3.500000
  index 2 : string "hello"
  index 3 : bool true

get_if:
  found a string: hello

get<wrong type> threw: std::get: wrong index for variant
holds_alternative<int>(v) = 1`,
          explanation:
            "**The `overloaded` idiom is three lines and worth memorising.** It inherits from every lambda and pulls all their `operator()`s into one overload set with `using Ts::operator()...;`, so `std::visit` sees a single callable that handles every alternative. The deduction guide below it lets you write `overloaded{...}` without naming types. **Remove one of those four lambdas and the program stops compiling** — that exhaustiveness is the feature.",
        },
      ],
    },
    {
      id: "variant-vs-inheritance",
      heading: "Variant against an inheritance hierarchy",
      body: [
        "Module 6 solved \"one of several kinds of thing\" with a base class and virtual functions. A variant solves the same problem differently, and the trade is worth stating precisely.",
        "**A variant is a closed set; a hierarchy is open.** New alternatives to a variant require editing its declaration and every visitor — the compiler finds them all. New classes in a hierarchy require editing nothing, and can be added by other people in other libraries.",
        "**So: closed set → variant, open set → hierarchy.** A JSON value, a parser token, a state machine's states and a result-or-error are closed and known; a plugin interface, a set of drivers and anything loaded from configuration is open.",
        "**The variant's advantages** are no allocation, no vtable, no virtual destructor question, value semantics that copy and compare properly, and — the big one — **exhaustiveness checking at compile time**. Adding a state to a state machine and having every `switch` fail to build is a genuine safety property that virtual dispatch cannot offer.",
        "**The hierarchy's advantages** are extensibility without touching existing code, and that adding a *behaviour* is easy: one new virtual function, implemented per class. With a variant, adding an operation means writing a new visitor, which is easy; adding a *type* means touching every visitor. **That is the expression problem, and the two designs sit on opposite sides of it.**",
        "**Watch the size.** A variant is as large as its largest alternative, so `variant<char, HugeStruct>` costs `sizeof(HugeStruct)` even when holding a `char`. If the alternatives differ wildly in size, hold the large ones by `unique_ptr` or use a hierarchy.",
      ],
      examples: [
        {
          id: "state-machine",
          title: "A state machine where adding a state breaks the build",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <variant>

template <class... Ts> struct overloaded : Ts... { using Ts::operator()...; };
template <class... Ts> overloaded(Ts...) -> overloaded<Ts...>;

// Each state carries exactly the data that state needs -- which an enum
// plus a struct of every possible field cannot express.
struct Idle      {};
struct Connecting{ int attempt; };
struct Connected { std::string sessionId; };
struct Failed    { std::string reason; };

using State = std::variant<Idle, Connecting, Connected, Failed>;

std::string render(const State& s) {
    return std::visit(overloaded{
        [](Idle)                  { return std::string{"idle"}; },
        [](const Connecting& c)   { return "connecting (attempt "
                                           + std::to_string(c.attempt) + ")"; },
        [](const Connected& c)    { return "connected as " + c.sessionId; },
        [](const Failed& f)       { return "failed: " + f.reason; },
    }, s);
}

// Transitions are total functions from state to state.
State advance(const State& s) {
    return std::visit(overloaded{
        [](Idle)                -> State { return Connecting{1}; },
        [](const Connecting& c) -> State {
            return c.attempt < 3 ? State{Connecting{c.attempt + 1}}
                                 : State{Failed{"too many attempts"}};
        },
        [](const Connected& c)  -> State { return c; },
        [](const Failed& f)     -> State { return f; },
    }, s);
}

int main() {
    State s = Idle{};
    for (int i = 0; i < 5; ++i) {
        std::cout << "  " << render(s) << '\\n';
        s = advance(s);
    }

    std::cout << "\\nsizeof(State) = " << sizeof(State) << '\\n';
    std::cout << "adding a fifth state makes BOTH visitors fail to compile,\\n"
                 "which is exactly what you want.\\n";
}`,
          output: `  idle
  connecting (attempt 1)
  connecting (attempt 2)
  connecting (attempt 3)
  failed: too many attempts

sizeof(State) = 40
adding a fifth state makes BOTH visitors fail to compile,
which is exactly what you want.`,
          explanation:
            "**Each state carries only its own data** — `Connecting` has an attempt count, `Connected` a session id, `Idle` nothing — which an enum plus a struct containing every possible field cannot express without invalid combinations. `advance` is a total function: every state maps to a next state, and the compiler checks that all four are handled. Add a `Reconnecting` state and both `render` and `advance` fail to build until you say what they should do, which is the property that makes variants good for state machines.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What problem does `std::optional` solve?",
      answer:
        "Expressing that a value may be absent, without the historical workarounds: a sentinel like `-1` or `nullptr` that requires an impossible-in-practice value and that callers forget to check; a bool return plus an out-parameter, which forces a default-constructed variable at every call site; or throwing, which is wrong when absence is ordinary. `optional<T>` puts the fact in the type so the caller cannot reach the value without acknowledging it might not be there. It is a value type with no allocation — `sizeof(optional<int>)` is 8 — storing the object inline alongside a flag.",
    },
    {
      question: "What is the difference between `value()`, `operator*` and `value_or`?",
      answer:
        "`value()` is checked and throws `std::bad_optional_access` when empty. `operator*` and `operator->` are unchecked — using them on an empty optional is undefined behaviour, the same hazard as dereferencing a null pointer — so they are correct only after you have tested. `value_or(fallback)` returns the contained value or the fallback and never fails, though note the fallback is always evaluated, so it should be cheap. The usual style is `if (opt)` or an if-init statement followed by `*opt`, reserving `value()` for cases where a throw is genuinely the right response.",
    },
    {
      question: "How does `std::variant` differ from a C union?",
      answer:
        "It tracks which alternative is active and enforces it. Reading a C union member you did not write is undefined behaviour with no diagnostic; `std::get<T>` on an inactive alternative throws `std::bad_variant_access`, and `std::get_if<T>` returns null. It also constructs and destroys non-trivial members correctly, which a raw union cannot do without manual placement new and explicit destructor calls. It costs the size of the largest alternative plus a tag, rounded for alignment, with no allocation.",
    },
    {
      question: "What does `std::visit` give you that `get_if` does not?",
      answer:
        "Exhaustiveness checking. `visit` calls the visitor with whichever alternative is active, and the visitor must handle every alternative or the program does not compile. So adding a fifth alternative to a variant breaks every visitor that has not been updated, at compile time — which is the main reason to prefer a variant to a hand-rolled tag-and-union. A chain of `get_if` tests compiles fine when a new alternative is added and silently falls through at runtime. The usual way to write a visitor is the overloaded idiom: a struct inheriting from several lambdas with `using Ts::operator()...;`.",
    },
    {
      question: "When would you choose `std::variant` over an inheritance hierarchy?",
      answer:
        "When the set of alternatives is closed and known at compile time — a JSON value, a parser token, the states of a state machine, a result-or-error. You get no allocation, no vtable, no virtual destructor concerns, proper value semantics, and compile-time exhaustiveness. Choose a hierarchy when the set is open and must be extensible by code you do not control — plugins, drivers, anything chosen by configuration. It is the expression problem: a variant makes adding *operations* easy and adding *types* invasive; a hierarchy is the reverse. Also watch the size, since a variant is as large as its largest alternative.",
    },
    {
      question: "Why is `std::optional<bool>` considered a trap?",
      answer:
        "Because it has three states — empty, holding `true`, holding `false` — and `if (opt)` tests whether it is *engaged*, not what it contains. So an optional holding `false` is truthy, which reads exactly backwards. Anyone skimming the code will misread it. A three-state enum with named values is clearer. Relatedly, `std::optional<T&>` does not exist at all: references were left out of C++17 because the assignment semantics were contentious, and the substitutes are a raw pointer, which already has a null state, or `std::reference_wrapper`.",
    },
  ],
  takeaways: [
    "`optional<T>` replaces sentinels, bool-plus-out-parameter, and throwing for ordinary absence",
    "It stores the value inline — `sizeof(optional<int>)` is 8, with no allocation",
    "`value()` throws; `operator*` is unchecked and is a null-dereference hazard",
    "`value_or` never fails, but always evaluates its fallback",
    "`optional<T&>` does not exist; `optional<bool>` is confusing because `if` tests emptiness",
    "Use `optional` for absence and `expected` when the caller needs a reason",
    "`variant` is a checked tagged union — the wrong alternative throws instead of reinterpreting bytes",
    "It costs the largest alternative plus a tag, with no allocation",
    "`get` throws, `get_if` returns null, `holds_alternative` tests, `index()` reports position",
    "`std::visit` requires the visitor to be exhaustive, checked at compile time",
    "The overloaded idiom builds a visitor from lambdas in three lines",
    "Closed set of types → variant; open and extensible → inheritance hierarchy",
    "Variants make adding operations easy and adding types invasive — the expression problem",
  ],
  status: "available",
};
