import type { Lesson } from "@/content/types";

export const structuredBindingsLesson: Lesson = {
  id: "cpp-structured-bindings",
  slug: "structured-bindings-if-init-and-designated-initialisers",
  moduleSlug: "modern-cpp-idioms",
  title: "Structured Bindings, if-init & Designated Initialisers",
  summary:
    "Three small features that change how ordinary code reads. Unpacking a struct, pair or map entry into named variables, scoping a variable to the branch that tests it, and naming fields at the point of initialisation so a call site stops being a row of anonymous arguments.",
  estimatedMinutes: 30,
  objectives: [
    "Unpack structs, tuples and map entries with structured bindings",
    "Bind by reference to modify the original",
    "Use if-init and switch-init to limit a variable's scope",
    "Use designated initialisers and know their C++ restrictions",
    "Recognise the limitations of each feature",
  ],
  sections: [
    {
      id: "structured-bindings",
      heading: "Structured bindings",
      body: [
        "**`auto [a, b, c] = expr;` declares several names from one object.** It works on three kinds of thing: an array, a tuple-like type (`std::pair`, `std::tuple`, anything with `tuple_size` and `get`), and a plain struct or class whose non-static data members are all public and in one class.",
        "The number of names must match exactly — too few or too many is a compile error, which is a small but real safety property when a struct gains a field.",
        "**The declaration is not really three variables.** The compiler creates one hidden object and makes each name refer to a member of it, which is why you cannot apply `static`, add individual types, or capture a binding in a lambda before C++20.",
        "**The `auto` takes qualifiers as usual.** `auto [a, b]` copies, `auto& [a, b]` binds to the original so writes go through, and `const auto& [a, b]` is the read-only form you want in most range-based `for` loops.",
        "**The map case is the one everybody meets.** `for (const auto& [key, value] : myMap)` replaces `it->first` and `it->second`, and it is worth adopting for that alone — `first` and `second` carry no meaning and every use has to be decoded.",
      ],
      examples: [
        {
          id: "bindings",
          title: "All three sources, plus binding by reference",
          lang: "cpp",
          code: `#include <iostream>
#include <map>
#include <string>
#include <tuple>

struct Point { int x; int y; int z; };

std::tuple<bool, int, std::string> lookup(int id) {
    if (id == 1) return {true, 200, "ok"};
    return {false, 404, "not found"};
}

int main() {
    // 1. On a struct.
    Point p{1, 2, 3};
    auto [x, y, z] = p;
    std::cout << "struct  : " << x << ' ' << y << ' ' << z << '\\n';

    // Bind by reference to modify the original.
    auto& [rx, ry, rz] = p;
    rx = 100;
    std::cout << "after rx = 100, p.x = " << p.x << '\\n';

    // 2. On a tuple or pair.
    auto [ok, code, msg] = lookup(1);
    std::cout << "tuple   : " << ok << ' ' << code << ' ' << msg << '\\n';

    // 3. On a map -- the reason most people meet them.
    std::map<std::string, int> stock{{"apple", 3}, {"pear", 0}};
    for (const auto& [name, count] : stock)
        std::cout << "map     : " << name << " = " << count << '\\n';

    (void)ry; (void)rz;
}`,
          output: `struct  : 1 2 3
after rx = 100, p.x = 100
tuple   : 1 200 ok
map     : apple = 3
map     : pear = 0`,
          explanation:
            "**`auto& [rx, ry, rz]` wrote through to `p.x`**, which is the difference between binding and copying and matters in a `for` loop over a container you intend to modify. The map loop is the everyday win: `name` and `count` say what they are, where `it->first` and `it->second` do not. Note that binding a `std::map` element gives you `const` keys, because the key genuinely is `const` in the stored `pair<const K, V>`.",
        },
      ],
      pitfalls: [
        {
          title: "A structured binding of a temporary extends its lifetime — but a member of one does not",
          body: "`auto [a, b] = makeStruct();` is safe: the hidden object is a copy, and it lives as long as the bindings. But `auto& [a, b] = makeStruct().member;` is not, and neither is a range-based `for` over `makeMap().at(k)` — the usual temporary-lifetime rules apply to whatever you actually bound to. The other restriction worth knowing is that **a structured binding cannot be captured by a lambda before C++20**; GCC and Clang allowed it as an extension, and C++20 made it official, so older codebases sometimes copy a binding into a plain variable first for exactly this reason.",
        },
      ],
    },
    {
      id: "if-init",
      heading: "if-init and switch-init",
      body: [
        "**`if (init; condition)` declares a variable scoped to the `if` statement**, including its `else` branch, and nothing beyond. `switch` has the same form.",
        "It solves a nuisance that used to force one of two bad choices: either wrap the whole thing in an extra `{ }` block, or let a variable that is only meaningful inside the branch leak into the enclosing scope where it can be misused later.",
        "**The pattern is strongest with things that return an iterator or an optional** — `if (auto it = m.find(k); it != m.end())` — because those variables are meaningless once the test has been made, and are exactly the ones people accidentally reuse.",
        "**It composes with structured bindings.** `if (auto [pos, inserted] = m.insert(...); inserted)` unpacks and tests in one statement, which is far clearer than storing the pair and indexing `.second`.",
        "Two small notes: the initialiser can declare **multiple variables of the same type**, and C++17's `switch (init; expr)` is the same feature applied to `switch`.",
      ],
      examples: [
        {
          id: "if-init-demo",
          title: "Scoping the variable to the test that needs it",
          lang: "cpp",
          code: `#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, int> stock{{"apple", 3}, {"pear", 0}};

    // if-init: scope the variable to the branch.
    if (auto it = stock.find("apple"); it != stock.end())
        std::cout << "if-init : found " << it->first << '\\n';
    else
        std::cout << "if-init : not found\\n";

    // The variable does not leak into the enclosing scope.
    // std::cout << it->first;   // ERROR: 'it' was not declared

    // Combined with structured bindings, on insert's pair return.
    if (auto [pos, inserted] = stock.insert({"plum", 7}); inserted)
        std::cout << "inserted " << pos->first << '\\n';

    // switch supports init too.
    switch (int n = static_cast<int>(stock.size()); n) {
        case 3:  std::cout << "switch  : three items\\n"; break;
        default: std::cout << "switch  : " << n << " items\\n"; break;
    }
}`,
          output: `if-init : found apple
inserted plum
switch  : three items`,
          explanation:
            "**`it` exists only for the `if` and its `else`.** Without the init form you would either declare it in the enclosing scope — where a later line could use a now-meaningless iterator — or wrap the whole statement in braces purely for scoping. The `insert` line shows the combination that pays for itself: `insert` returns a `pair<iterator, bool>`, and `auto [pos, inserted]` names both halves in the same statement that tests one of them.",
        },
      ],
    },
    {
      id: "designated-initialisers",
      heading: "Designated initialisers",
      body: [
        "**`Options o{.verbose = true, .retries = 5};` names the members being set.** C++20 adopted this from C, where it has existed since C99.",
        "It fixes a real readability problem. `Widget w{true, false, 3, true}` tells a reader nothing, and swapping two same-typed arguments is a bug the compiler cannot see. Naming each one makes the call site self-documenting and the mistake impossible.",
        "**Members not mentioned get their default member initialiser**, or are value-initialised if there is none — which combines well with a struct that gives every field a sensible default, as the example does.",
        "**C++'s version is stricter than C's**, and the differences catch people. **The order must match the declaration order** — C allows any order, C++ does not. **You cannot skip and come back**; once you have named a later member you cannot name an earlier one. **There is no array-element designator**, so C's `int a[5] = {[2] = 7}` has no C++ equivalent. And **it only works on aggregates**: no user-declared constructors, no private non-static data members, no virtual functions.",
        "The practical effect is that designated initialisers pair naturally with plain configuration structs, and not with classes that maintain invariants — which is the right division anyway.",
      ],
      examples: [
        {
          id: "designated",
          title: "A configuration struct, initialised by name",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

// Designated initialisers (C++20) work on aggregates: no user-declared
// constructors, no private data, no virtual functions.
struct Options {
    bool        verbose  = false;
    int         retries  = 3;
    std::string endpoint = "localhost";
};

void run(const Options& o) {
    std::cout << "  verbose=" << o.verbose
              << " retries=" << o.retries
              << " endpoint=" << o.endpoint << '\\n';
}

int main() {
    // Only the fields you care about; the rest keep their defaults.
    Options a{.verbose = true};
    Options b{.retries = 5, .endpoint = "prod.example"};

    std::cout << "opts a  :"; run(a);
    std::cout << "opts b  :"; run(b);

    // At the call site, this is self-documenting:
    run({.verbose = true, .retries = 1});

    // Compare with the positional form, which says nothing:
    run({true, 1, "localhost"});

    // C++ restrictions the C version does not have:
    //   Options c{.retries = 5, .verbose = true};   // ERROR: wrong order
    //   int arr[3] = {[1] = 7};                     // ERROR: no array designators
    std::cout << "\\ndesignators must follow declaration order in C++.\\n";
}`,
          output: `opts a  :  verbose=1 retries=3 endpoint=localhost
opts b  :  verbose=0 retries=5 endpoint=prod.example
  verbose=1 retries=1 endpoint=localhost
  verbose=1 retries=1 endpoint=localhost

designators must follow declaration order in C++.`,
          explanation:
            "**The two `run(...)` calls in the middle produce identical output and read completely differently.** `run({.verbose = true, .retries = 1})` states what it means; `run({true, 1, \"localhost\"})` requires opening the struct definition to decode, and swapping the first argument with a later `bool` would be a silent bug. Note `Options a{.verbose = true}` left `retries` at 3 and `endpoint` at `\"localhost\"` — unmentioned members take their default member initialisers, which is what makes the feature worth pairing with defaulted config structs.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What can structured bindings be applied to?",
      answer:
        "Three things: an array, a tuple-like type implementing `tuple_size` and `get` (so `std::pair`, `std::tuple`, and user types that opt in), and a plain struct or class whose non-static data members are all public and declared in a single class. The number of names must match exactly, so a struct gaining a field breaks the binding at compile time. The declaration creates one hidden object with the names referring to its members, which is why you cannot give individual types or apply `static` to them.",
    },
    {
      question: "What is the difference between `auto [a, b]` and `auto& [a, b]`?",
      answer:
        "`auto [a, b]` copies the object being bound, so modifying `a` leaves the original untouched. `auto& [a, b]` binds to the original, so writes go through — which is what you want in a range-based `for` over a container you intend to modify. `const auto& [a, b]` is the read-only, no-copy form and the right default for iterating. The qualifiers apply to the hidden object as a whole, not to individual names, so you cannot make one binding a reference and another a copy.",
    },
    {
      question: "What does if-init give you?",
      answer:
        "`if (init; condition)` declares a variable scoped to the `if` and its `else`, and nowhere beyond. Without it you either declare the variable in the enclosing scope, where it remains visible and misusable after the branch that gave it meaning, or wrap the whole statement in extra braces purely for scoping. It is strongest with iterators and optionals — `if (auto it = m.find(k); it != m.end())` — since those are meaningless once tested. It also combines with structured bindings, as in `if (auto [pos, inserted] = m.insert(...); inserted)`, and `switch` has the same form.",
    },
    {
      question: "How do C++ designated initialisers differ from C's?",
      answer:
        "C++20's version is stricter. The designators must appear in declaration order, where C allows any order. You cannot skip a member and then name an earlier one. There are no array-element designators, so C's `int a[5] = {[2] = 7}` has no C++ equivalent. And it applies only to aggregates — no user-declared constructors, no private non-static data members, no virtual functions. Members not mentioned take their default member initialiser or are value-initialised. The practical effect is that they pair with plain configuration structs rather than classes maintaining invariants.",
    },
    {
      question: "Why are designated initialisers worth using?",
      answer:
        "Because a positional aggregate initialisation like `Widget w{true, false, 3, true}` communicates nothing at the call site and lets you transpose two same-typed arguments with no diagnostic. Naming each field makes the call self-documenting and that class of mistake impossible. Combined with default member initialisers, they let a caller specify only what differs from the defaults — `Options{.retries = 5}` — which scales much better than a constructor with eight defaulted parameters where you must supply everything up to the one you care about.",
    },
  ],
  takeaways: [
    "Structured bindings work on arrays, tuple-like types, and aggregates with all-public members",
    "The name count must match exactly, so a new struct field breaks the binding at compile time",
    "`auto&` binds to the original; `const auto&` is the right default when iterating",
    "`for (const auto& [key, value] : map)` replaces `it->first` / `it->second`",
    "A binding is not three variables — it is one hidden object with names for its members",
    "Capturing a structured binding in a lambda was only made legal in C++20",
    "`if (init; cond)` scopes a variable to the `if` and its `else`, and `switch` has the same form",
    "It composes with bindings: `if (auto [pos, ok] = m.insert(...); ok)`",
    "Designated initialisers name members at the point of initialisation",
    "In C++ they must follow declaration order, cannot skip backwards, and work only on aggregates",
    "Unmentioned members take their default member initialisers",
  ],
  status: "available",
};
