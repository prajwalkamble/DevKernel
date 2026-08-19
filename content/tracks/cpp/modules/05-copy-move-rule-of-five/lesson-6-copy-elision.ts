import type { Lesson } from "@/content/types";

export const copyElisionLesson: Lesson = {
  id: "cpp-copy-elision",
  slug: "copy-elision-and-rvo",
  moduleSlug: "copy-move-rule-of-five",
  title: "Copy Elision, RVO & the Copies You Never Pay For",
  summary:
    "The compiler removes copies and moves you assumed you were paying for — and since C++17, some of that removal is a language guarantee rather than an optimisation. How to tell the two apart, proved with a flag that can disable one and not the other.",
  estimatedMinutes: 30,
  objectives: [
    "Distinguish guaranteed elision from NRVO",
    "Explain why returning by value is not expensive",
    "Predict when NRVO can and cannot apply",
    "Prove the difference with `-fno-elide-constructors`",
    "Write functions that give the compiler the best chance to elide",
  ],
  sections: [
    {
      id: "the-idea",
      heading: "The copy that never happens",
      body: [
        "Returning a large object by value looks expensive. `std::vector<int> build()` appears to construct a vector inside the function, copy it out to the caller, and destroy the original.",
        "**It does not.** The compiler is permitted — and in some cases required — to construct the returned object *directly in the caller's storage*, so no copy or move occurs at all. This is **copy elision**.",
        "It is unusual among optimisations in that it is allowed to change observable behaviour: constructors and destructors with side effects simply do not run. Every other optimisation must preserve the as-if rule; elision is explicitly carved out from it.",
        "There are two distinct mechanisms, and confusing them is the main source of misunderstanding.",
        "**Guaranteed elision (C++17)** applies when a *prvalue* initialises an object of the same type — returning a temporary, or constructing from a function call. It is a **language rule**, not an optimisation: the copy or move constructor need not even exist, and no compiler flag can disable it.",
        "**NRVO — named return value optimisation** — applies when you return a *named local*. It is a genuine optimisation, permitted but never required, and it can be disabled.",
      ],
      examples: [
        {
          id: "elision-proof",
          title: "Three return shapes, with elision on and off",
          lang: "cpp",
          code: `#include <iostream>

struct Tracer {
    int id;
    explicit Tracer(int i) : id(i) { std::cout << "  ctor " << id << '\\n'; }
    Tracer(const Tracer& o) : id(o.id) { std::cout << "  COPY " << id << '\\n'; }
    Tracer(Tracer&& o) noexcept : id(o.id) { std::cout << "  MOVE " << id << '\\n'; }
    ~Tracer() { std::cout << "  dtor " << id << '\\n'; }
};

// Returns a prvalue: guaranteed elision since C++17. No copy, no move.
Tracer make_prvalue() { return Tracer{1}; }

// Named return value: NRVO is an optimisation, not a guarantee.
Tracer make_named() {
    Tracer local{2};
    return local;
}

// Two return paths: NRVO usually cannot apply, so this falls back to a move.
Tracer make_branching(bool flag) {
    Tracer a{3};
    Tracer b{4};
    if (flag) return a;
    return b;
}

int main() {
    std::cout << "prvalue return:\\n";   { Tracer t = make_prvalue(); }
    std::cout << "named return:\\n";     { Tracer t = make_named(); }
    std::cout << "branching return:\\n"; { Tracer t = make_branching(true); }
}`,
          output: `$ g++ -std=c++20 elision.cpp -o el && ./el
prvalue return:
  ctor 1
  dtor 1
named return:
  ctor 2
  dtor 2
branching return:
  ctor 3
  ctor 4
  MOVE 3
  dtor 4
  dtor 3
  dtor 3

$ g++ -std=c++20 -fno-elide-constructors elision.cpp -o el && ./el
prvalue return:
  ctor 1
  dtor 1
named return:
  ctor 2
  MOVE 2
  dtor 2
  dtor 2
branching return:
  ctor 3
  ctor 4
  MOVE 3
  dtor 4
  dtor 3
  dtor 3`,
          explanation:
            "**Compare the two columns.** The prvalue case is *identical* with elision disabled — because C++17 guaranteed elision is a language rule and `-fno-elide-constructors` cannot switch it off. The named case gains a `MOVE` when the flag is passed, proving NRVO was an optimisation that had been applied. And the branching case shows a `MOVE` in **both** columns: NRVO could not apply, so the compiler fell back to treating the local as an rvalue and moving it.",
        },
      ],
    },
    {
      id: "guaranteed",
      heading: "Guaranteed elision, and what it enables",
      body: [
        "Since C++17, a prvalue does not produce a temporary that is then copied. The prvalue *is* the initialiser for the destination object — the standard describes it as deferred materialisation.",
        "Two practical consequences follow, and the second one is genuinely new capability rather than just speed.",
        "**`T t = f();` where `f` returns `T` by value costs exactly one construction.** Not a construction plus a move. This is why returning by value is the right default and out-parameters are not needed for performance.",
        "**You can return a type that is neither copyable nor movable.** Before C++17 this was impossible, because the return statement conceptually required one of those operations to exist even if it was elided. Now it does not, so factory functions can return immovable types — which matters for types containing a `std::mutex` or `std::atomic`.",
      ],
      examples: [
        {
          id: "immovable-return",
          title: "Returning something that cannot be copied or moved",
          lang: "cpp",
          code: `#include <iostream>
#include <mutex>
#include <string>

// Contains a mutex, so it is neither copyable nor movable.
class Registry {
public:
    explicit Registry(std::string name) : name_(std::move(name)) {}

    Registry(const Registry&)            = delete;
    Registry& operator=(const Registry&) = delete;
    Registry(Registry&&)                 = delete;
    Registry& operator=(Registry&&)      = delete;

    const std::string& name() const { return name_; }

private:
    std::string name_;
    std::mutex  lock_;
};

// Legal since C++17 only: the prvalue is constructed directly in the caller.
Registry make_registry(std::string name) {
    return Registry{std::move(name)};
}

int main() {
    Registry r = make_registry("global");
    std::cout << "built: " << r.name() << '\\n';

    // Registry copy = r;                   // ERROR: deleted
    // Registry moved = std::move(r);       // ERROR: deleted
}`,
          output: `built: global`,
          explanation:
            "**All five special members are deleted or unavailable, and the function still returns by value.** Compiled as C++14 the same code fails with `use of deleted function 'Registry::Registry(Registry&&)'`, because the older rules needed a move constructor to exist even though it would have been elided. This is the clearest evidence that guaranteed elision is a language change rather than an optimisation.",
        },
      ],
    },
    {
      id: "nrvo",
      heading: "NRVO, and when it cannot apply",
      body: [
        "NRVO applies when you return a named local variable. It is optional for the compiler, and all mainstream ones implement it — but there are shapes where it is impossible, and knowing them tells you how to write functions that elide.",
        "**Two or more different locals returned on different paths.** The compiler must choose one storage location at the point the object is created, and with two candidates it cannot. Seen in the example above.",
        "**Returning a function parameter.** Parameters live in storage the caller controls, so the return value cannot be constructed there.",
        "**Returning a member of a local**, or anything that is not the whole named object.",
        "**Returning a `static` or global**, whose storage is fixed elsewhere.",
        "In every one of these, the fallback is not a copy: **when returning a local by value, the compiler treats the local as an rvalue automatically**, so you get a move if the type has one. That implicit-move rule is why `return local;` is correct even when NRVO cannot apply — and why writing `return std::move(local);` only ever hurts, as lesson 4 showed.",
      ],
      examples: [
        {
          id: "nrvo-friendly",
          title: "Rewriting a function so elision can apply",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

struct Tracer {
    std::string tag;
    explicit Tracer(std::string t) : tag(std::move(t)) { std::cout << "  ctor " << tag << '\\n'; }
    Tracer(const Tracer& o) : tag(o.tag) { std::cout << "  COPY " << tag << '\\n'; }
    Tracer(Tracer&& o) noexcept : tag(std::move(o.tag)) { std::cout << "  MOVE\\n"; }
};

// NRVO cannot apply: two different named locals.
Tracer two_locals(bool flag) {
    Tracer a{"a"};
    Tracer b{"b"};
    return flag ? std::move(a) : std::move(b);
}

// NRVO applies: one named local on every path.
Tracer one_local(bool flag) {
    Tracer result{flag ? "a" : "b"};
    return result;
}

// Guaranteed elision: prvalue on every path.
Tracer prvalue_paths(bool flag) {
    if (flag) return Tracer{"a"};
    return Tracer{"b"};
}

int main() {
    std::cout << "two locals:\\n";     { Tracer t = two_locals(true); }
    std::cout << "one local:\\n";      { Tracer t = one_local(true); }
    std::cout << "prvalue paths:\\n";  { Tracer t = prvalue_paths(true); }
}`,
          output: `two locals:
  ctor a
  ctor b
  MOVE
one local:
  ctor a
prvalue paths:
  ctor a`,
          explanation:
            "**Three versions of the same function: two constructions plus a move, one construction, one construction.** The second and third are free. Note the third also avoids constructing the object that is not returned — `two_locals` built both `a` and `b` before choosing. **The general shape to aim for: compute what you need, then construct the result once, in one place.**",
        },
      ],
      pitfalls: [
        {
          title: "Do not restructure working code chasing elision",
          body: "The saving is one move, and lesson 3 measured a move of a 1000-element vector at around 226ns. That is worth having when it is free — writing `return result;` instead of `return std::move(result);` costs nothing — and it is not worth contorting a function's logic for. Write the clearest version; the compiler elides where it can, moves where it cannot, and the difference only matters in a loop you have profiled.",
        },
      ],
    },
    {
      id: "practical",
      heading: "What to do with this",
      body: [
        "Four rules, all of which make code simpler rather than more complex.",
        "**Return by value.** It is the clear, safe default, and it is not the cost people assume. Out-parameters exist for other reasons, not performance.",
        "**Write `return local;`, never `return std::move(local);`.** The move is implicit when needed, and the explicit form disables NRVO.",
        "**Prefer constructing the result once.** One named local returned on every path, or a prvalue on every path, both elide. Two locals cannot.",
        "**Do not rely on elision for side effects.** Because elision may remove constructor and destructor calls, a class whose constructor logs or counts instances will produce different output depending on whether elision applied. That is legal. If you need exact instance counts — usually in a test — either accept the elision or add `-fno-elide-constructors` to that specific build.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is copy elision, and how does it differ from other optimisations?",
      answer:
        "It is the compiler constructing a returned or passed object directly in its destination, so no copy or move occurs. It is unusual in being explicitly allowed to change observable behaviour: constructors and destructors with side effects simply do not run, which every other optimisation is forbidden from doing by the as-if rule. Since C++17 part of it is not an optimisation at all but a language rule — a prvalue initialising an object of the same type never materialises a temporary.",
    },
    {
      question: "What is the difference between guaranteed elision and NRVO?",
      answer:
        "Guaranteed elision applies when a prvalue initialises an object of the same type — returning a temporary, or constructing from a function call. It is required by C++17, the copy and move constructors need not even exist, and no flag can disable it. NRVO applies when returning a *named* local; it is permitted but never required, and `-fno-elide-constructors` disables it. You can see the distinction directly: with that flag, a prvalue return is unchanged while a named return gains a move.",
    },
    {
      question: "When can NRVO not apply, and what happens then?",
      answer:
        "When different locals are returned on different paths, when returning a function parameter, when returning a member of a local rather than the whole object, and when returning a static or global — in each case the storage location cannot be chosen at construction time. The fallback is not a copy: the language requires the compiler to treat a returned local as an rvalue, so a move constructor is used if one exists. That implicit-move rule is why `return local;` is always correct and `return std::move(local);` only ever prevents elision.",
    },
    {
      question: "Why can C++17 return a type that is neither copyable nor movable?",
      answer:
        "Because guaranteed elision removed the requirement that the operation exist. Before C++17, `return T{...};` conceptually required an accessible copy or move constructor even when it was elided, so a class containing a `std::mutex` or `std::atomic` could not be returned by value. Now the prvalue directly initialises the caller's object, and a factory function can return an immovable type. Compiling the same code as C++14 gives `use of deleted function 'T::T(T&&)'`, which is a clean demonstration that this is a language change.",
    },
    {
      question: "Is returning a large object by value expensive?",
      answer:
        "No. `T t = f();` where `f` returns `T` costs exactly one construction — the object is built directly in the caller's storage. Even where elision cannot apply, the local is implicitly treated as an rvalue and moved, which for a container is a handful of pointer assignments. Out-parameters are not needed for performance, and returning a struct with named fields is clearer at the call site. The only caution is not to restructure working logic chasing an elision that saves a single move.",
    },
  ],
  takeaways: [
    "Copy elision constructs the result directly in its destination — no copy, no move",
    "It may legally remove constructor and destructor side effects, unlike every other optimisation",
    "Guaranteed elision (C++17) applies to prvalues, is a language rule, and `-fno-elide-constructors` cannot disable it",
    "NRVO applies to named locals, is optional, and the flag does disable it — which is how you can tell them apart",
    "Since C++17 you can return a type with no copy or move constructor at all",
    "NRVO fails with two returned locals, a returned parameter, a member, or a static — and then the local is moved implicitly",
    "`return local;` is always right; `return std::move(local);` only ever prevents elision",
    "Aim to construct the result once, on every path, and let the compiler do the rest",
  ],
  status: "available",
};
