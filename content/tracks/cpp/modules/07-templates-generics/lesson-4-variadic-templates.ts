import type { Lesson } from "@/content/types";

export const variadicTemplatesLesson: Lesson = {
  id: "cpp-variadic-templates",
  slug: "variadic-templates-and-folds",
  moduleSlug: "templates-generics",
  title: "Variadic Templates, Parameter Packs & Fold Expressions",
  summary:
    "Templates taking any number of arguments of any types. Parameter packs and how they expand, the recursive style you will still read and the fold expressions that replaced it, the four fold forms and their associativity — and forwarding a pack without losing a move.",
  estimatedMinutes: 40,
  objectives: [
    "Declare a parameter pack and expand it",
    "Use `sizeof...` and distinguish it from `sizeof`",
    "Write the recursive form and the fold form of the same operation",
    "Choose between the four fold forms and predict their associativity",
    "Explain which folds work on an empty pack and why",
    "Perfectly forward a parameter pack",
  ],
  sections: [
    {
      id: "packs",
      heading: "Parameter packs",
      body: [
        "A **parameter pack** holds zero or more template arguments. `template <typename... Ts>` declares a type pack; `Ts... args` in the function parameter list declares a matching function parameter pack.",
        "The `...` means different things in different positions, and keeping them straight is most of the syntax.",
        "**In a declaration, `...` introduces a pack**: `typename... Ts`, `Ts... args`.",
        "**After an expression, `...` expands it**: `args...` becomes `arg1, arg2, arg3`. The pattern to the left of `...` is repeated once per element, so `std::forward<Ts>(args)...` expands to `std::forward<T1>(arg1), std::forward<T2>(arg2), ...` — the whole pattern is repeated, not just the pack name.",
        "**`sizeof...(args)`** gives the number of elements as a compile-time constant. It is unrelated to `sizeof` and gives a count, not a size in bytes.",
        "A pack can only be expanded in contexts that accept a comma-separated list — function arguments, initialiser lists, base class lists, template argument lists. **You cannot index a pack directly**, which is why the recursive style below existed for so long.",
      ],
      examples: [
        {
          id: "recursive-vs-fold",
          title: "The same function, before and after C++17",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

// Pre-C++17 style: peel one argument, recurse on the rest.
// Needs a base case to stop.
void printRecursive() { std::cout << '\\n'; }          // base case

template <typename First, typename... Rest>
void printRecursive(const First& first, const Rest&... rest) {
    std::cout << first;
    if constexpr (sizeof...(rest) > 0) std::cout << ", ";
    printRecursive(rest...);                          // pack EXPANSION
}

// C++17 fold expression: no recursion, no base case, one line.
template <typename... Ts>
void printFold(const Ts&... args) {
    std::cout << "  n=" << sizeof...(args) << " : ";
    ((std::cout << args << ' '), ...);                // comma fold
    std::cout << '\\n';
}

int main() {
    std::cout << "recursive: ";
    printRecursive(1, 2.5, "three", std::string{"four"});

    printFold(1, 2.5, "three");
    printFold();                        // an empty pack is fine
    printFold('x');
}`,
          output: `recursive: 1, 2.5, three, four
  n=3 : 1 2.5 three
  n=0 :
  n=1 : x `,
          explanation:
            "**The recursive version needs two functions and a base case; the fold needs one line.** The recursive form peels `first` off and calls itself with the rest, terminating at the zero-argument overload — you will meet this shape constantly in pre-C++17 code and in library internals, so it is worth being able to read. The fold `((std::cout << args << ' '), ...)` uses the comma operator to sequence one output statement per element. Note `printFold()` with no arguments works and prints nothing, which the recursive version handles only because a separate base case was written for it.",
        },
      ],
      pitfalls: [
        {
          title: "The expansion pattern is everything to the left of `...`",
          body: "`f(args)...` expands to `f(arg1), f(arg2), f(arg3)` — the call is repeated. `f(args...)` expands to a single call `f(arg1, arg2, arg3)` — the pack goes inside. Those two lines look nearly identical and mean completely different things, and mixing them up is the most common variadic bug. A useful mental rule: the `...` goes *after* the complete pattern you want repeated, so if the pack name is inside parentheses that should repeat, the dots go outside them.",
        },
      ],
    },
    {
      id: "folds",
      heading: "The four fold expressions",
      body: [
        "A fold applies a binary operator across a pack. There are four forms, and the parentheses are part of the syntax — they are always required.",
        "**Unary right fold — `(E op ...)`** — expands to `e1 op (e2 op (e3 op e4))`. Right-associative.",
        "**Unary left fold — `(... op E)`** — expands to `((e1 op e2) op e3) op e4`. Left-associative.",
        "**Binary right fold — `(E op ... op init)`** — expands to `e1 op (e2 op (e3 op init))`.",
        "**Binary left fold — `(init op ... op E)`** — expands to `((init op e1) op e2) op e3`.",
        "The position of the `...` relative to the pack tells you the associativity: **dots on the left means fold from the left.**",
        "For `+` on numbers the associativity rarely matters, but for `-`, `/`, and for building strings or composing function objects, it decides the answer entirely. **Prefer left folds by default**, since they match the order people read and the order most operators naturally associate.",
        "**Empty packs are the reason binary folds exist.** A unary fold over an empty pack is only valid for three operators, which have defined identities: `&&` yields `true`, `||` yields `false`, and `,` yields `void()`. Every other operator is a compile error on an empty pack. A binary fold supplies the identity explicitly, so `(0 + ... + vs)` works for any number of arguments including none.",
      ],
      examples: [
        {
          id: "fold-forms",
          title: "Associativity and identities, measured",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <vector>

// The four fold forms. E is the pack, op is the operator.
//   unary right: (E op ...)          -> e1 op (e2 op (e3 op e4))
//   unary left:  (... op E)          -> ((e1 op e2) op e3) op e4
//   binary right:(E op ... op init)  -> e1 op (e2 op (e3 op init))
//   binary left: (init op ... op E)  -> ((init op e1) op e2) op e3

template <typename... Ts> auto sumRight(Ts... vs) { return (vs + ...); }
template <typename... Ts> auto sumLeft (Ts... vs) { return (... + vs); }

// Binary folds supply an identity, so the EMPTY pack works.
template <typename... Ts> auto sumSafe(Ts... vs) { return (0 + ... + vs); }

// Subtraction shows the associativity difference clearly.
template <typename... Ts> auto subRight(Ts... vs) { return (vs - ...); }
template <typename... Ts> auto subLeft (Ts... vs) { return (... - vs); }

// Logical folds short-circuit, and have identities for the empty pack.
template <typename... Ts> bool allTrue(Ts... vs) { return (vs && ...); }
template <typename... Ts> bool anyTrue(Ts... vs) { return (vs || ...); }

// A pack expansion can apply a function to each element.
template <typename... Ts>
std::vector<std::string> allToString(Ts... vs) {
    return { std::to_string(vs)... };   // to_string(v1), to_string(v2), ...
}

int main() {
    std::cout << "sumRight(1,2,3,4) = " << sumRight(1,2,3,4) << '\\n';
    std::cout << "sumLeft (1,2,3,4) = " << sumLeft(1,2,3,4)  << '\\n';

    std::cout << "subRight(1,2,3,4) = " << subRight(1,2,3,4) << "   // 1-(2-(3-4))\\n";
    std::cout << "subLeft (1,2,3,4) = " << subLeft(1,2,3,4)  << "   // ((1-2)-3)-4\\n";

    std::cout << "sumSafe()         = " << sumSafe()
              << "   // empty pack, binary fold\\n";
    // std::cout << sumRight();   // ERROR: unary fold over + has no identity

    std::cout << std::boolalpha;
    std::cout << "allTrue(true,true,false) = " << allTrue(true,true,false) << '\\n';
    std::cout << "anyTrue(false,false,true)= " << anyTrue(false,false,true)<< '\\n';
    std::cout << "allTrue() [identity]     = " << allTrue()  << '\\n';
    std::cout << "anyTrue() [identity]     = " << anyTrue()  << '\\n';

    std::cout << "allToString(1,2,3):";
    for (const auto& s : allToString(1,2,3)) std::cout << ' ' << s;
    std::cout << '\\n';
}`,
          output: `sumRight(1,2,3,4) = 10
sumLeft (1,2,3,4) = 10
subRight(1,2,3,4) = -2   // 1-(2-(3-4))
subLeft (1,2,3,4) = -8   // ((1-2)-3)-4
sumSafe()         = 0   // empty pack, binary fold
allTrue(true,true,false) = false
anyTrue(false,false,true)= true
allTrue() [identity]     = true
anyTrue() [identity]     = false
allToString(1,2,3): 1 2 3`,
          explanation:
            "**`-2` against `-8` from the same four arguments** is the clearest possible demonstration that fold direction is not a stylistic detail. Addition hid the difference entirely, which is exactly why the bug is easy to ship. The empty-pack rows show the other half: `allTrue()` is `true` and `anyTrue()` is `false` because `&&` and `||` have defined identities, while `sumRight()` would not compile at all — `sumSafe` works only because the binary form supplies `0` explicitly. **When a fold might see an empty pack, use the binary form.**",
        },
      ],
    },
    {
      id: "forwarding",
      heading: "Forwarding a pack",
      body: [
        "The most common real use of a variadic template is a **factory or wrapper that passes its arguments through to something else**. `std::make_unique`, `std::make_shared`, `emplace_back` and `std::thread`'s constructor are all this shape.",
        "The requirement is that arguments arrive at the destination exactly as they were passed — an rvalue must stay movable, an lvalue must stay an lvalue, and `const` must be preserved. That is **perfect forwarding**, and for a pack it is written `Ts&&... args` in the parameter list and `std::forward<Ts>(args)...` at the call.",
        "The mechanics come straight from lesson 1: `Ts&&` is a pack of forwarding references, so each `T` deduces as an lvalue reference for lvalue arguments and a plain type for rvalues. `std::forward<Ts>(args)...` then expands the *whole pattern*, casting each argument back to its original value category.",
        "**Taking the pack by value instead silently costs you a copy per argument.** The pack members are ordinary local objects, so passing them on produces lvalues, and a movable argument gets copied where it should have moved.",
      ],
      examples: [
        {
          id: "forwarding-pack",
          title: "`make_unique`, written out, against the version that copies",
          lang: "cpp",
          code: `#include <iostream>
#include <memory>
#include <string>
#include <utility>

struct Widget {
    std::string name;
    int         weight;
    Widget(std::string n, int w) : name(std::move(n)), weight(w) {
        std::cout << "  Widget(" << name << ", " << weight << ")\\n";
    }
};

// A tracer that reports whether it was copied or moved into place.
struct Tracer {
    std::string tag;
    explicit Tracer(std::string t) : tag(std::move(t)) {}
    Tracer(const Tracer& o) : tag(o.tag) {
        std::cout << "  COPY " << tag << '\\n';
    }
    Tracer(Tracer&& o) noexcept : tag(std::move(o.tag)) {
        std::cout << "  MOVE " << tag << '\\n';
    }
};

struct Holder {
    Tracer t;
    explicit Holder(Tracer tr) : t(std::move(tr)) {}
};

// This is essentially std::make_unique: a variadic pack, perfectly forwarded.
template <typename T, typename... Ts>
std::unique_ptr<T> makeThing(Ts&&... args) {
    return std::unique_ptr<T>(new T(std::forward<Ts>(args)...));
}

// WRONG: takes by value, so the value category is lost -- everything copies.
template <typename T, typename... Ts>
std::unique_ptr<T> makeThingByValue(Ts... args) {
    return std::unique_ptr<T>(new T(args...));
}

int main() {
    auto w = makeThing<Widget>(std::string{"bolt"}, 3);
    std::cout << "  -> " << w->name << ' ' << w->weight << '\\n';

    std::cout << "perfect forwarding an rvalue:\\n";
    auto h1 = makeThing<Holder>(Tracer{"rvalue"});

    std::cout << "perfect forwarding an lvalue:\\n";
    Tracer lv{"lvalue"};
    auto h2 = makeThing<Holder>(lv);

    std::cout << "by-value version, same rvalue:\\n";
    auto h3 = makeThingByValue<Holder>(Tracer{"rvalue"});

    (void)h1; (void)h2; (void)h3;
}`,
          output: `  Widget(bolt, 3)
  -> bolt 3
perfect forwarding an rvalue:
  MOVE rvalue
  MOVE rvalue
perfect forwarding an lvalue:
  COPY lvalue
  MOVE lvalue
by-value version, same rvalue:
  COPY rvalue
  MOVE rvalue`,
          explanation:
            "**Compare the first and third cases: the same rvalue argument, and only the forwarding version keeps it a move.** With `Ts&&...` the `Tracer` temporary was moved into `Holder`'s parameter; with `Ts...` it was bound to a by-value pack member, which is an lvalue, so passing it on copied it. The lvalue case correctly copies in both — that is what the caller asked for by passing a named object. Note the two operations per line: one into `Holder`'s parameter, one from there into the member, which is the ordinary cost of a by-value constructor parameter.",
        },
      ],
      pitfalls: [
        {
          title: "A forwarding-reference constructor will hijack your copy constructor",
          body: "A class with `template <typename... Ts> explicit Holder(Ts&&... args)` has a constructor that matches *anything*, including a non-const `Holder&`. Copy-constructing from a non-const lvalue then prefers the template — it is an exact match, while the copy constructor requires adding `const` — and you get a confusing error from inside the template instead of a copy. The fixes are to constrain the template with a concept (lesson 6) or `enable_if` (lesson 7) so it excludes `Holder` itself. This is the single most common way a well-meaning perfect-forwarding constructor breaks a class.",
        },
      ],
    },
    {
      id: "variadic-classes",
      heading: "Variadic class templates",
      body: [
        "Class templates take packs too, which is how `std::tuple`, `std::variant` and `std::function` are declared.",
        "Since a pack cannot be indexed directly, the classic implementation technique is **recursive inheritance**: a class template that peels the head off the pack, stores it, and inherits from itself instantiated with the tail. The recursion terminates in a partial specialisation for the empty pack.",
        "That is worth writing once — it makes `std::tuple` stop being mysterious — but modern implementations do not do it this way, because deep inheritance chains are slow to compile and hard to debug.",
        "**In real code, reach for `std::tuple` rather than building your own.** The useful things to know are `std::get<I>` and `std::get<T>` for access, `std::tuple_size_v` for the count, structured bindings for unpacking, and `std::apply` for calling a function with a tuple's contents spread out as arguments.",
      ],
      examples: [
        {
          id: "tuple-basics",
          title: "A recursive tuple, then the one you should actually use",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <tuple>

// A minimal tuple by recursive inheritance -- the classic technique.
template <typename... Ts> struct MyTuple {};            // empty case

template <typename Head, typename... Tail>
struct MyTuple<Head, Tail...> : MyTuple<Tail...> {
    Head value;
    MyTuple(Head h, Tail... t) : MyTuple<Tail...>(t...), value(std::move(h)) {}
};

// Access needs a helper, because you cannot index a pack.
template <std::size_t I, typename Head, typename... Tail>
auto& getAt(MyTuple<Head, Tail...>& t) {
    if constexpr (I == 0) return t.value;
    else                  return getAt<I - 1>(static_cast<MyTuple<Tail...>&>(t));
}

int main() {
    MyTuple<int, double, std::string> mine{1, 2.5, "three"};
    std::cout << "mine: " << getAt<0>(mine) << ' '
                          << getAt<1>(mine) << ' '
                          << getAt<2>(mine) << '\\n';

    // The real thing, with the tools worth remembering.
    std::tuple t{1, 2.5, std::string{"three"}};

    std::cout << "size = " << std::tuple_size_v<decltype(t)> << '\\n';
    std::cout << "get<1> = " << std::get<1>(t) << '\\n';
    std::cout << "get<std::string> = " << std::get<std::string>(t) << '\\n';

    auto [i, d, s] = t;                     // structured bindings
    std::cout << "unpacked: " << i << ' ' << d << ' ' << s << '\\n';

    // std::apply spreads a tuple into a function call.
    auto sum3 = [](int a, double b, const std::string& c) {
        return std::to_string(a + b) + c;
    };
    std::cout << "apply: " << std::apply(sum3, t) << '\\n';
}`,
          output: `mine: 1 2.5 three
size = 3
get<1> = 2.5
get<std::string> = three
unpacked: 1 2.5 three
apply: 3.500000three`,
          explanation:
            "**`MyTuple<int, double, std::string>` is really three nested classes**, each holding one member and inheriting the rest — which is why `getAt` walks the chain with a `static_cast` to the base rather than indexing anything. Writing it once demystifies tuples permanently. Then use `std::tuple`: `std::get<T>` by type is often clearer than by index, structured bindings unpack in one line, and `std::apply` is the tool for turning stored arguments back into a call, which is exactly what a deferred-invocation type like `std::thread` or a task queue needs.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a parameter pack, and what do the three uses of `...` mean?",
      answer:
        "A parameter pack holds zero or more template arguments, declared `template <typename... Ts>` with a matching function parameter pack `Ts... args`. In a declaration, `...` introduces the pack. After an expression, `...` expands it, repeating the entire pattern to its left once per element — so `std::forward<Ts>(args)...` expands the whole `forward` call, not just the pack name. And `sizeof...(args)` yields the element count as a compile-time constant, which is unrelated to `sizeof`. A pack can only be expanded where a comma-separated list is valid, and it cannot be indexed directly.",
    },
    {
      question: "What is the difference between `f(args)...` and `f(args...)`?",
      answer:
        "`f(args)...` repeats the whole call once per element, expanding to `f(arg1), f(arg2), f(arg3)`. `f(args...)` makes a single call with the pack expanded inside it, `f(arg1, arg2, arg3)`. The rule is that the `...` follows the complete pattern to be repeated, so whether the dots sit inside or outside the parentheses decides whether you get many calls or one. They look nearly identical and are the most common source of variadic bugs.",
    },
    {
      question: "Name the four fold expressions and their associativity.",
      answer:
        "Unary right `(E op ...)` gives `e1 op (e2 op e3)`, right-associative. Unary left `(... op E)` gives `(e1 op e2) op e3`, left-associative. Binary right `(E op ... op init)` folds right with an initial value on the right. Binary left `(init op ... op E)` folds left with an initial value on the left. The position of the dots relative to the pack indicates the direction — dots on the left means fold from the left. It matters for any non-associative operator: `(vs - ...)` on 1,2,3,4 gives −2 while `(... - vs)` gives −8. Prefer left folds, since they match reading order.",
    },
    {
      question: "Which folds work on an empty pack?",
      answer:
        "A unary fold over an empty pack is only valid for three operators with defined identities: `&&` yields `true`, `||` yields `false`, and the comma operator yields `void()`. Every other operator is a compile error — `(vs + ...)` with no arguments will not build, because there is no value to produce. A binary fold supplies the identity explicitly, so `(0 + ... + vs)` works for any number of arguments including zero. The practical rule is that if a fold can ever see an empty pack, use the binary form.",
    },
    {
      question: "How do you perfectly forward a parameter pack, and what goes wrong if you take it by value?",
      answer:
        "Declare the parameters as `Ts&&... args`, a pack of forwarding references, and pass them on as `std::forward<Ts>(args)...`, which expands the whole pattern and casts each argument back to its original value category. That is how `make_unique`, `make_shared` and `emplace_back` pass arguments through untouched. Taking the pack by value as `Ts... args` makes each element an ordinary local object, so passing it on yields an lvalue — a movable argument that should have been moved is copied instead, once per argument. Perfect forwarding preserves both rvalue-ness and constness; by-value loses both.",
    },
    {
      question: "Why can a perfect-forwarding constructor break a class's copy constructor?",
      answer:
        "Because `template <typename... Ts> Holder(Ts&&... args)` matches literally anything, including a non-const `Holder&`. Copy-constructing from a non-const lvalue then prefers the template, since it is an exact match while the real copy constructor requires adding `const` — so instead of a copy you get an error from deep inside the template body. The fix is to constrain the template so it excludes the class itself, with a concept in C++20 or `enable_if` before that. It is the standard hazard of greedy forwarding constructors.",
    },
    {
      question: "How is `std::tuple` implemented, and what tools does it give you?",
      answer:
        "Classically by recursive inheritance: a partial specialisation peels the head type off the pack, stores it as a member, and inherits from itself instantiated with the tail, terminating in a specialisation for the empty pack. Access walks the chain rather than indexing, since packs cannot be indexed. Real implementations avoid the deep inheritance because it compiles slowly, but the recursive version is worth writing once to demystify it. In practice use `std::get<I>` or `std::get<T>`, `std::tuple_size_v` for the count, structured bindings to unpack, and `std::apply` to call a function with the tuple's elements spread as arguments.",
    },
  ],
  takeaways: [
    "`typename... Ts` declares a pack; `args...` expands it; `sizeof...(args)` counts it",
    "Expansion repeats the entire pattern left of the `...`, not just the pack name",
    "`f(args)...` makes many calls; `f(args...)` makes one — the commonest variadic bug",
    "A pack cannot be indexed, which is why the recursive peel-and-recurse style exists",
    "Fold expressions replaced most recursion in C++17 and always need their parentheses",
    "Dots on the left of the pack means fold from the left",
    "Associativity is invisible for `+` and decisive for `-`, `/` and string building",
    "Only `&&`, `||` and `,` have identities for an empty unary fold; use a binary fold otherwise",
    "Forward a pack with `Ts&&... args` and `std::forward<Ts>(args)...`",
    "Taking a pack by value costs a copy per argument that should have moved",
    "A greedy forwarding constructor outcompetes the copy constructor for non-const lvalues",
    "Use `std::tuple` with `std::get`, structured bindings and `std::apply` rather than rolling your own",
  ],
  status: "available",
};
