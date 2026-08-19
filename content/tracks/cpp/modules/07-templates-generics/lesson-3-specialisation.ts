import type { Lesson } from "@/content/types";

export const specialisationLesson: Lesson = {
  id: "cpp-specialisation",
  slug: "full-and-partial-specialisation",
  moduleSlug: "templates-generics",
  title: "Full & Partial Specialisation",
  summary:
    "Giving one template a different implementation for particular arguments. Full specialisation, partial specialisation and why only classes get it, the type traits that are built entirely out of it — and the reason specialising a function template is almost always the wrong move.",
  estimatedMinutes: 35,
  objectives: [
    "Write a full specialisation of a class template",
    "Write a partial specialisation and explain how the most specialised match is chosen",
    "Explain why function templates have no partial specialisation, and overload instead",
    "Recognise the declaration-order trap in function template specialisation",
    "Build a small type trait out of specialisation",
  ],
  sections: [
    {
      id: "full-and-partial",
      heading: "Two kinds of specialisation",
      body: [
        "A template gives one implementation for all arguments. **Specialisation supplies a different implementation for some of them**, chosen automatically when the arguments match.",
        "**Full specialisation** pins down every parameter. The syntax is an empty `template <>` followed by the class name with concrete arguments: `template <> struct Formatter<bool> { ... };`. It is no longer a template at all — it is a concrete class that the compiler uses instead of the general pattern whenever you write `Formatter<bool>`.",
        "**Partial specialisation** narrows the arguments without fixing them all, so it remains a template. `template <typename T> struct Formatter<T*>` says \"for any pointer type\", leaving `T` free. You can also partially specialise on structure — `Formatter<std::vector<T>>`, `Formatter<T[N]>`, `Formatter<A, A>` — which is what makes it powerful.",
        "**When several match, the most specialised wins.** The compiler ranks candidates by which is more constrained: for `Formatter<int*>`, the `T*` partial specialisation is more specialised than the general template, so it is chosen. A full specialisation beats every partial one. If two partial specialisations match and neither is more specialised than the other, that is an ambiguity error.",
      ],
      examples: [
        {
          id: "formatter",
          title: "One template, two full and one partial specialisation",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

// The general template: works for anything std::to_string accepts.
template <typename T>
struct Formatter {
    static std::string format(const T& v) {
        return "<" + std::to_string(v) + ">";
    }
};

// FULL specialisation: every parameter is pinned down.
// Note the empty template<> and the <bool> after the name.
template <>
struct Formatter<bool> {
    static std::string format(const bool& v) {
        return v ? "<yes>" : "<no>";
    }
};

template <>
struct Formatter<std::string> {
    static std::string format(const std::string& v) {
        return "<\\"" + v + "\\">";
    }
};

// PARTIAL specialisation: still a template, but narrower.
// "any pointer to T" -- T remains a parameter.
template <typename T>
struct Formatter<T*> {
    static std::string format(T* p) {
        return p ? "-> " + Formatter<T>::format(*p) : "-> null";
    }
};

int main() {
    int  n = 42;
    bool b = true;
    std::string s = "hi";

    std::cout << Formatter<int>::format(n) << '\\n';
    std::cout << Formatter<bool>::format(b) << '\\n';
    std::cout << Formatter<std::string>::format(s) << '\\n';
    std::cout << Formatter<int*>::format(&n) << '\\n';
    std::cout << Formatter<int*>::format(nullptr) << '\\n';
    std::cout << Formatter<std::string*>::format(&s) << '\\n';
}`,
          output: `<42>
<yes>
<"hi">
-> <42>
-> null
-> <"hi">`,
          explanation:
            "**Four different implementations selected with no `if` anywhere.** `Formatter<bool>` would have compiled against the general template — `std::to_string(bool)` is valid — but printed `<1>`, so the specialisation exists to change behaviour rather than to fix an error. `Formatter<std::string>` exists because the general template would *not* compile. And the partial specialisation composes: `Formatter<std::string*>` matched `T*`, then delegated to `Formatter<std::string>`, picking up the full specialisation on the way.",
        },
      ],
    },
    {
      id: "traits",
      heading: "Type traits are specialisation",
      body: [
        "The `<type_traits>` header looks like compiler magic and is mostly not. **Most of it is ordinary partial specialisation**, and writing a few by hand is the fastest way to stop finding template metaprogramming mysterious.",
        "The pattern is always the same: a general template giving the default answer, and one or more partial specialisations giving the answer for structurally-matching types. The result is exposed as a `static constexpr` member called `value`, or a member typedef called `type`.",
        "`std::true_type` and `std::false_type` are just `std::integral_constant<bool, true>` and `<bool, false>`, and inheriting from them is how a trait gets its `value` member without writing it out.",
        "**A trait can also recurse**, because a specialisation may refer to the trait itself with a simpler argument — which is how something like array rank is computed by peeling one dimension at a time until the general case stops it.",
        "The `_v` and `_t` suffixes you see everywhere — `std::is_same_v<A, B>`, `std::remove_pointer_t<T>` — are variable templates and alias templates that save writing `::value` and `typename ...::type`. They are conveniences over exactly this machinery.",
      ],
      examples: [
        {
          id: "handmade-traits",
          title: "`is_same`, `remove_pointer` and a recursive rank, from scratch",
          lang: "cpp",
          code: `#include <iostream>
#include <type_traits>

// Type traits are built out of specialisation. Here is is_same, from scratch.
template <typename A, typename B>
struct IsSame : std::false_type {};          // general case: not the same

template <typename A>
struct IsSame<A, A> : std::true_type {};     // partial: both args identical

// remove_pointer, likewise.
template <typename T> struct RemovePointer           { using type = T; };
template <typename T> struct RemovePointer<T*>       { using type = T; };
template <typename T> struct RemovePointer<T* const> { using type = T; };

// A compile-time rank: how many array dimensions does this type have?
// The specialisation peels one dimension and recurses.
template <typename T>        struct Rank       { static constexpr int value = 0; };
template <typename T, int N> struct Rank<T[N]> { static constexpr int value = 1 + Rank<T>::value; };

int main() {
    std::cout << std::boolalpha;
    std::cout << "IsSame<int,int>       = " << IsSame<int, int>::value << '\\n';
    std::cout << "IsSame<int,double>    = " << IsSame<int, double>::value << '\\n';

    std::cout << "RemovePointer<int*>   = "
              << IsSame<RemovePointer<int*>::type, int>::value << '\\n';

    std::cout << "Rank<int>             = " << Rank<int>::value << '\\n';
    std::cout << "Rank<int[5]>          = " << Rank<int[5]>::value << '\\n';
    std::cout << "Rank<int[5][3]>       = " << Rank<int[5][3]>::value << '\\n';

    // These are all compile-time facts, usable in static_assert.
    static_assert(IsSame<int, int>::value);
    static_assert(Rank<int[2][2][2]>::value == 3);
}`,
          output: `IsSame<int,int>       = true
IsSame<int,double>    = false
RemovePointer<int*>   = true
Rank<int>             = 0
Rank<int[5]>          = 1
Rank<int[5][3]>       = 2`,
          explanation:
            "**`IsSame` is four lines and is genuinely how the standard one works.** The general template says false; the partial specialisation `IsSame<A, A>` only matches when both arguments are the same type, and being more specialised it wins when it applies. `RemovePointer` needs a separate specialisation for `T* const` because `const` is part of the type and `T*` does not match it — a good illustration of how literal the matching is. And `Rank` recurses: `int[5][3]` matches `T[N]` with `T = int[3]`, adds one, and asks again. The `static_assert`s passing is the proof that all of this happened at compile time.",
        },
      ],
    },
    {
      id: "function-templates",
      heading: "Why function templates are different",
      body: [
        "**Function templates cannot be partially specialised.** The language simply does not allow it. They *can* be fully specialised, and that is where the trouble starts.",
        "The reason the restriction exists is that function templates already have a mechanism for this: **overloading**. Two function templates with different parameter patterns are overloads, and ordinary overload resolution plus partial ordering picks the more specialised one — which covers what partial specialisation would have done, with rules that were already there.",
        "The trap is that full specialisation and overloading interact badly. **A specialisation does not participate in overload resolution.** Overload resolution runs first over the *primary* templates and picks a winner; only then is that winner checked for an applicable specialisation. So a specialisation attaches to one particular primary template, and which one depends on **what was declared at the point you wrote it**.",
        "The consequence is that moving a specialisation up or down in a header changes which function gets called, with no error and no warning. This is the Dimov/Abrahams example, and it is the reason the standing advice is blunt: **do not specialise function templates — overload them instead.**",
      ],
      examples: [
        {
          id: "dimov-abrahams",
          title: "The same specialisation, two positions, two answers",
          lang: "cpp",
          code: `#include <iostream>

// ---- Order A: the specialisation is declared AFTER the T* overload ----
namespace A {
    template <typename T> void f(T)  { std::cout << "  (1) f(T)\\n"; }
    template <typename T> void f(T*) { std::cout << "  (2) f(T*)\\n"; }
    template <> void f(int*)         { std::cout << "  (S) specialisation\\n"; }
    // With (2) visible, 'template<> void f(int*)' specialises (2).
}

// ---- Order B: the SAME specialisation declared BEFORE the T* overload ----
namespace B {
    template <typename T> void f(T)  { std::cout << "  (1) f(T)\\n"; }
    template <> void f(int*)         { std::cout << "  (S) specialisation\\n"; }
    template <typename T> void f(T*) { std::cout << "  (2) f(T*)\\n"; }
    // Here it specialises (1) -- but overload resolution picks (2) first,
    // so the specialisation is never called at all.
}

int main() {
    int  n = 0;
    int* p = &n;

    std::cout << "order A (specialisation after f(T*)):\\n";
    A::f(p);

    std::cout << "order B (specialisation before f(T*)):\\n";
    B::f(p);
}`,
          output: `order A (specialisation after f(T*)):
  (S) specialisation
order B (specialisation before f(T*)):
  (2) f(T*)`,
          explanation:
            "**Identical code in a different order, and a different function runs.** In order B the specialisation attached to `f(T)`, because that was the only primary template visible when it was written; overload resolution then preferred `f(T*)` for a pointer argument, and the specialisation — a specialisation of the *loser* — was never considered. No error, no warning, and the behaviour is decided by line order in a header. The fix is on the next tab: write a plain overload and the problem disappears entirely.",
        },
        {
          id: "overload-instead",
          title: "The fix: an ordinary overload",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

// Overloads, not specialisations. Order does not matter, and each one
// participates in overload resolution normally.
template <typename T> void describe(T)            { std::cout << "  generic\\n"; }
template <typename T> void describe(T*)           { std::cout << "  pointer\\n"; }
void                       describe(int)          { std::cout << "  int\\n"; }
void                       describe(const char*)  { std::cout << "  c-string\\n"; }

int main() {
    int         n = 1;
    double      d = 2.0;
    std::string s = "x";

    describe(n);        // non-template exact match wins
    describe(d);        // generic template
    describe(&d);       // pointer template
    describe("lit");    // const char* non-template
    describe(s);        // generic template
}`,
          output: `  int
  generic
  pointer
  c-string
  generic`,
          explanation:
            "**Every case resolved as you would expect, and reordering these four declarations changes nothing.** A non-template function beats a template when both match equally well, which is why `describe(1)` picks the `int` version — a useful rule in its own right. This is the whole reason function template specialisation is rarely needed: overloading already expresses \"handle this case differently\", it composes with the rest of the language, and it does not depend on declaration order.",
        },
      ],
      pitfalls: [
        {
          title: "The one time you must specialise rather than overload",
          body: "Specialising a *class* template in namespace `std` is permitted and sometimes necessary — `std::hash<MyType>` is the common case, and it is how you make your type usable as an `unordered_map` key. The rule is that you may add a specialisation of a standard template for a program-defined type, and you may not add overloads or anything else to `std`. Since C++20 there is often a better route: `std::formatter<MyType>` is specialised the same way, but for many customisation points the standard library has moved to *customisation point objects* found by ADL, which you support with an ordinary free function in your own namespace instead.",
        },
      ],
    },
    {
      id: "vector-bool",
      heading: "`std::vector<bool>`, and specialisation as a cautionary tale",
      body: [
        "The standard library contains a famous demonstration that a specialisation can be *too* different from the template it specialises.",
        "**`std::vector<bool>` is a partial specialisation that packs its elements into bits**, one per bit rather than one per byte. The memory saving is real. The cost is that it cannot return a `bool&` from `operator[]`, because there is no such thing as a reference to a bit — so it returns a **proxy object** that remembers which bit it refers to and writes through on assignment.",
        "That single difference breaks the container's contract in ways that surface in ordinary code. `auto b = v[0]` gives you a proxy, not a `bool`, so a later `b = false` modifies the vector rather than a copy. `bool& r = v[0]` does not compile. `&v[0]` does not give you a `bool*`. And `std::vector<bool>` does not satisfy the requirements the standard states for containers, which means generic code written against those requirements can silently misbehave for it.",
        "It is a permanent fixture — too widely used to change — and it is why the guidance is to reach for `std::vector<char>`, `std::deque<bool>`, `std::bitset<N>` when the size is fixed, or `std::vector<std::uint8_t>` whenever you want an actual container of booleans.",
        "**The lesson generalises.** A specialisation should change *how* something is done, not what it promises. If your specialisation has a different interface or different semantics from the primary template, generic code cannot use them interchangeably — which was the entire point of writing a template.",
      ],
      examples: [
        {
          id: "vector-bool-demo",
          title: "The proxy, and what `auto` does with it",
          lang: "cpp",
          code: `#include <iostream>
#include <vector>

int main() {
    std::cout << std::boolalpha;

    // vector<bool> is a specialisation in the standard library that packs
    // bits. It is not a container of bool, and it shows.
    std::vector<bool> vb{true, false, true};
    std::vector<char> vc{1, 0, 1};

    std::cout << "sizeof(vector<bool>) = " << sizeof(vb) << '\\n';

    // operator[] returns a PROXY object, not bool&.
    auto b = vb[0];          // deduces std::vector<bool>::reference, NOT bool
    auto c = vc[0];          // deduces char, a real copy

    b = false;               // writes THROUGH the proxy into the vector
    c = 0;                   // modifies the copy only

    std::cout << "after 'auto b = vb[0]; b = false;' vb[0] = " << vb[0] << '\\n';
    std::cout << "after 'auto c = vc[0]; c = 0;'     vc[0] = " << int(vc[0])
              << "  (the copy c = " << int(c) << ")\\n";

    // bool& simply does not exist here.
    // bool& r = vb[0];      // ERROR: cannot bind bool& to a proxy
    // bool* ptr = &vb[0];   // ERROR: no bool* to take

    std::cout << "vector<char> gives a real reference: ";
    char& cr = vc[1];
    cr = 9;
    std::cout << int(vc[1]) << '\\n';
}`,
          output: `sizeof(vector<bool>) = 40
after 'auto b = vb[0]; b = false;' vb[0] = false
after 'auto c = vc[0]; c = 0;'     vc[0] = 1  (the copy c = 0)
vector<char> gives a real reference: 9`,
          explanation:
            "**The two `auto` lines look identical and do opposite things.** `auto c = vc[0]` copied a `char`, so modifying `c` left the vector alone — the ordinary, expected behaviour. `auto b = vb[0]` copied a *proxy*, which still refers to the original bit, so `b = false` reached into the vector and changed it. This is the concrete reason `auto` and `vector<bool>` are a dangerous combination, and it is the standard illustration of why a specialisation that changes an interface's semantics is a design failure rather than an optimisation.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between full and partial specialisation?",
      answer:
        "Full specialisation pins down every template parameter, written with an empty `template <>` and concrete arguments — `template <> struct Formatter<bool>`. The result is no longer a template but a concrete class used whenever those exact arguments appear. Partial specialisation narrows the arguments without fixing them all, so it stays a template: `template <typename T> struct Formatter<T*>` matches any pointer while leaving `T` free. Partial specialisation can also match on structure, such as `Formatter<std::vector<T>>` or `Formatter<T[N]>`. When several candidates match, the most specialised wins, and a full specialisation beats every partial one.",
    },
    {
      question: "Why can't function templates be partially specialised?",
      answer:
        "Because overloading already does the job. Two function templates with different parameter patterns are overloads, and overload resolution plus partial ordering picks the more specialised one — which is exactly what partial specialisation would have provided, using rules that already existed for functions. Class templates have no overloading, so they needed partial specialisation as a separate mechanism. Function templates can still be *fully* specialised, but that is a feature best avoided.",
    },
    {
      question: "Why is specialising a function template considered bad practice?",
      answer:
        "Because specialisations do not participate in overload resolution. Resolution runs over the primary templates first and picks a winner; only then is that winner checked for a matching specialisation. A specialisation therefore attaches to one particular primary template — whichever was visible when you wrote it — so moving the declaration relative to other overloads changes which function is called, silently. In the Dimov/Abrahams example, declaring `template<> void f(int*)` before `f(T*)` attaches it to `f(T)`, and overload resolution then picks `f(T*)`, so the specialisation never runs at all. The fix is to write a plain overload, which is order-independent and behaves as expected.",
    },
    {
      question: "How is a type trait like `std::is_same` implemented?",
      answer:
        "With partial specialisation. A general template inheriting `std::false_type` gives the default answer, and a partial specialisation `IsSame<A, A>` inheriting `std::true_type` matches only when both arguments are the same type — being more specialised, it wins when it applies. Traits that transform types use a member typedef instead, so `RemovePointer<T*>` exposes `using type = T`. Traits can recurse, with a specialisation referring to the trait with a simpler argument, which is how array rank peels one dimension at a time. The `_v` and `_t` suffixes are variable templates and alias templates that save writing `::value` and `typename ...::type`.",
    },
    {
      question: "What is wrong with `std::vector<bool>`?",
      answer:
        "It is a specialisation that packs elements one per bit, so it cannot return a `bool&` from `operator[]` — there is no reference to a bit — and returns a proxy object instead. That breaks the container requirements: `auto b = v[0]` gives a proxy rather than a `bool`, so a later `b = false` modifies the vector instead of a copy; `bool& r = v[0]` does not compile; and `&v[0]` is not a `bool*`. Generic code written against the container requirements can therefore misbehave for it. It cannot be fixed without breaking existing code, so the practical advice is to use `vector<char>`, `deque<bool>`, `bitset<N>` for fixed sizes, or `vector<std::uint8_t>`. The general lesson is that a specialisation should change how something is done, never what it promises.",
    },
    {
      question: "Is it legal to specialise a template in namespace `std`?",
      answer:
        "For a class template and a program-defined type, yes — that is the sanctioned mechanism, and `std::hash<MyType>` is the standard example, which is what makes your type usable as an `unordered_map` key. `std::formatter<MyType>` works the same way. What you may not do is add overloads, new functions, or anything else to `std`, and you may not specialise for types you do not own. Note that newer parts of the library have moved away from this pattern towards customisation point objects found by ADL, which you support with an ordinary free function in your own namespace instead.",
    },
  ],
  takeaways: [
    "Full specialisation fixes every parameter and is written `template <> struct X<Concrete>`",
    "Partial specialisation narrows without fixing everything, and remains a template",
    "Partial specialisation can match structure — `T*`, `std::vector<T>`, `T[N]`, `X<A, A>`",
    "When several match, the most specialised wins; a full specialisation beats every partial one",
    "Matching is literal — `T*` does not match `T* const`, which needs its own specialisation",
    "Function templates cannot be partially specialised; overloading covers the same ground",
    "A function template specialisation does not take part in overload resolution",
    "Moving a function specialisation relative to other overloads silently changes which one runs",
    "Overload function templates; specialise class templates",
    "Type traits are ordinary partial specialisation plus `true_type`/`false_type`",
    "Specialising `std::hash<MyType>` is legal and expected; adding anything else to `std` is not",
    "`std::vector<bool>` returns a proxy, so `auto b = v[0]` aliases the vector instead of copying",
    "A specialisation should change how, never what — differing semantics defeat the point of a template",
  ],
  status: "available",
};
