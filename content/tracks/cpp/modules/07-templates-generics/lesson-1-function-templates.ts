import type { Lesson } from "@/content/types";

export const functionTemplatesLesson: Lesson = {
  id: "cpp-function-templates",
  slug: "function-templates-and-deduction",
  moduleSlug: "templates-generics",
  title: "Function Templates, Deduction & Instantiation",
  summary:
    "Writing a function once and letting the compiler generate a version per type. How arguments are deduced — including the decay that quietly loses `const` and turns arrays into pointers — and why a template is not code until something instantiates it.",
  estimatedMinutes: 35,
  objectives: [
    "Write a function template and call it with deduced and explicit arguments",
    "State what template argument deduction does for by-value, by-const-reference and forwarding parameters",
    "Explain decay and predict when `const` and array-ness survive",
    "Recognise and fix a conflicting-deduction error",
    "Explain when a template is compiled, and why template code lives in headers",
  ],
  sections: [
    {
      id: "the-basics",
      heading: "One definition, many functions",
      body: [
        "A function template is a *pattern* for functions. You write it once with a placeholder type, and the compiler writes a real function for each set of types you actually use.",
        "`template <typename T>` introduces the parameter. **`typename` and `class` are interchangeable here** — `template <class T>` means exactly the same thing, and you will see both. Prefer `typename`, since the parameter need not be a class.",
        "**Deduction is the default.** Call `maxOf(3, 7)` and the compiler works out `T = int` from the arguments; you almost never write the type. You *can* supply it explicitly as `maxOf<double>(...)`, and there are two reasons to: to force a conversion, and to supply a type that cannot be deduced from the arguments at all.",
        "Deduction is not conversion. Each argument is matched against the parameter pattern independently, and **if two arguments deduce different types for the same parameter, that is an error** — not a promotion to the wider type. `maxOf(3, 7.5)` fails; the compiler will not decide for you that you meant `double`.",
      ],
      examples: [
        {
          id: "basic-template",
          title: "The same function for four types",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

// One definition. The compiler writes a version per type you actually use.
template <typename T>
T maxOf(T a, T b) {
    return a > b ? a : b;
}

int main() {
    std::cout << maxOf(3, 7) << '\\n';               // T = int
    std::cout << maxOf(2.5, 1.5) << '\\n';           // T = double
    std::cout << maxOf<double>(3, 7.5) << '\\n';     // forced: both convert
    std::cout << maxOf(std::string{"apple"},
                       std::string{"banana"}) << '\\n';   // T = std::string

    // maxOf(3, 7.5);   // ERROR: deduces T=int from arg 1, T=double from arg 2
    std::cout << maxOf<double>(3, 7.5) << '\\n';     // fix 1: say what T is
    std::cout << maxOf(3.0, 7.5) << '\\n';           // fix 2: make them agree
}`,
          output: `7
2.5
7.5
banana
7.5
7.5`,
          explanation:
            "**`maxOf` works for `std::string` without knowing anything about strings** — it only requires that `>` is defined, which is the essence of generic programming. Note the commented-out line: mixing `int` and `double` is not a conversion opportunity, it is a contradiction, and the compiler reports it as one. Writing `maxOf<double>` makes `T` explicit, so both arguments convert to `double` on the way in.",
        },
      ],
      pitfalls: [
        {
          title: "The conflicting-deduction error, and how to read it",
          body: "`maxOf(3, 7.5)` produces:\n\n`error: no matching function for call to 'maxOf(int, double)'`\n`note: candidate: 'template<class T> T maxOf(T, T)'`\n`note:   template argument deduction/substitution failed:`\n`note:   deduced conflicting types for parameter 'T' ('int' and 'double')`\n\nThe last line is the one that matters, and GCC states it plainly. The fixes are to give `T` explicitly, to make the arguments the same type, or to give the template two parameters — `template <typename T, typename U>` — and work out the return type with `auto` or `std::common_type_t<T, U>`.",
        },
      ],
    },
    {
      id: "deduction-rules",
      heading: "How arguments are deduced",
      body: [
        "Deduction has a few rules that account for most of the surprises, and they depend entirely on **how the parameter is declared**.",
        "**By value — `f(T)`.** The argument *decays*: references are stripped, top-level `const` and `volatile` are stripped, arrays become pointers, and functions become function pointers. This is the same decay that happens when you copy-initialise anything, and it is why passing a `const int` by value deduces `T = int`.",
        "**By const reference — `f(const T&)`.** No decay. `T` is the bare type, arrays stay arrays with their bound intact, and nothing is copied.",
        "**By forwarding reference — `f(T&&)`.** The special case. If the argument is an lvalue, `T` deduces as an *lvalue reference* — `int&` — and reference collapsing makes the parameter `int&`. If it is an rvalue, `T` deduces as the plain type. **This is the only context where `T` itself can come out as a reference type**, and it is what makes perfect forwarding work.",
        "**`T&&` is only a forwarding reference when `T` is being deduced right there.** In `template <typename T> void f(std::vector<T>&& v)`, the `&&` is an ordinary rvalue reference, because `T` is deduced from the vector's element, not from the reference itself.",
      ],
      examples: [
        {
          id: "deduction-table",
          title: "The compiler printing back what it deduced",
          lang: "cpp",
          code: `#include <iostream>
#include <string_view>

// Prints the type the compiler actually deduced, by reading it back out of
// __PRETTY_FUNCTION__. A debugging trick worth knowing.
template <typename T>
constexpr std::string_view typeName() {
    std::string_view p = __PRETTY_FUNCTION__;
    auto start = p.find("T = ") + 4;
    auto end   = p.find(';', start);
    return p.substr(start, end - start);
}

template <typename T>
void byValue(T) {
    std::cout << "  by value      T = " << typeName<T>() << '\\n';
}

template <typename T>
void byConstRef(const T&) {
    std::cout << "  by const&     T = " << typeName<T>() << '\\n';
}

template <typename T>
void byFwdRef(T&&) {
    std::cout << "  by T&&        T = " << typeName<T>() << '\\n';
}

int main() {
    int       i  = 1;
    const int ci = 2;
    int       arr[5]{};

    std::cout << "int lvalue:\\n";
    byValue(i);    byConstRef(i);    byFwdRef(i);

    std::cout << "const int lvalue:\\n";
    byValue(ci);   byConstRef(ci);   byFwdRef(ci);

    std::cout << "rvalue 42:\\n";
    byValue(42);   byConstRef(42);   byFwdRef(42);

    std::cout << "int[5]:\\n";
    byValue(arr);        // decays to int*
    byConstRef(arr);     // stays int[5]

    std::cout << "string literal \\"hello\\":\\n";
    byValue("hello");    // decays to const char*
    byConstRef("hello"); // stays char[6]
}`,
          output: `int lvalue:
  by value      T = int
  by const&     T = int
  by T&&        T = int&
const int lvalue:
  by value      T = int
  by const&     T = int
  by T&&        T = const int&
rvalue 42:
  by value      T = int
  by const&     T = int
  by T&&        T = int
int[5]:
  by value      T = int*
  by const&     T = int [5]
string literal "hello":
  by value      T = const char*
  by const&     T = char [6]`,
          explanation:
            "**Three rows are worth memorising.** Passing a `const int` by value deduces `T = int` — the `const` is gone, because you got your own copy and it is yours to modify. Passing an lvalue to `T&&` deduces `T = int&`, a *reference type*, which happens nowhere else. And an array passed by value deduces `int*` while the same array by `const&` keeps `int [5]` — which is exactly how `std::size` and `std::begin` can know a raw array's length, and why a by-value template parameter cannot.",
        },
      ],
      pitfalls: [
        {
          title: "`typeName<T>()` is a genuinely useful debugging tool",
          body: "When deduction produces something you did not expect, the fastest way to find out what actually happened is to make the compiler tell you. The `__PRETTY_FUNCTION__` trick above works on GCC and Clang; MSVC has `__FUNCSIG__` with slightly different text to parse. The other approach needs no code at all: declare an incomplete class template like `template <typename> struct WhatIs;` and then write `WhatIs<T> x;` inside the function — the error message will name `T` exactly, and you delete the line once you have your answer.",
        },
      ],
    },
    {
      id: "instantiation",
      heading: "Instantiation: when the code actually exists",
      body: [
        "**A template is not code. It is instructions for producing code.** Until something uses it with concrete types, the compiler generates nothing.",
        "When you call `maxOf(1, 2)`, the compiler performs an *implicit instantiation*: it substitutes `int` for `T` and compiles the resulting function. Call it with `double` too, and you get a second, entirely separate function in the binary.",
        "This explains several things that otherwise look strange.",
        "**Errors appear late, and at the point of instantiation.** A template body that requires `operator>` compiles perfectly on its own; the error only appears when you instantiate it with a type lacking one. That is why template errors point at a line deep inside a library and then dump a chain of `required from here` notes tracing back to your call. Lesson 6's concepts exist largely to fix this.",
        "**Template definitions must be visible where they are instantiated**, which is why template code lives in headers rather than being split across a `.h` and a `.cpp` like ordinary functions. A declaration alone is not enough — the compiler needs the body to generate from.",
        "**The same instantiation in several translation units is not an ODR violation.** The compiler emits them as *weak* symbols and the linker discards the duplicates, which is what makes header-only template libraries work at all.",
      ],
      examples: [
        {
          id: "instantiation-symbols",
          title: "One template, three functions in the object file",
          lang: "bash",
          code: `// instantiate.cpp
#include <string>
template <typename T> T maxOf(T a, T b) { return a > b ? a : b; }
struct NoCompare { int x; };
int main() {
    maxOf(1, 2);
    maxOf(1.5, 2.5);
    maxOf(std::string{"a"}, std::string{"b"});
    // NoCompare has no operator> -- but this line is never written, so the
    // template is never instantiated for it and nothing goes wrong.
}

$ g++ -std=c++20 -c instantiate.cpp -o instantiate.o     # compiles clean
$ nm -C instantiate.o | grep -i maxof

W double maxOf<double>(double, double)
W int maxOf<int>(int, int)
W std::__cxx11::basic_string<...> maxOf<std::__cxx11::basic_string<...> >(...)`,
          output: `# and the error you get the moment you DO instantiate it badly:

$ g++ -std=c++20 -c lateerr.cpp
lateerr.cpp: In instantiation of 'T maxOf(T, T) [with T = NoCompare]':
lateerr.cpp:3:48:   required from here
    3 | int main() { NoCompare a{1}, b{2}; return maxOf(a, b).x; }
      |                                           ~~~~~^~~~~~
lateerr.cpp:1:52: error: no match for 'operator>'
   (operand types are 'NoCompare' and 'NoCompare')
    1 | template <typename T> T maxOf(T a, T b) { return a > b ? a : b; }
      |                                                  ~~^~~`,
          explanation:
            "**Three distinct functions from one definition, and `NoCompare` produced nothing at all** — the template was never instantiated for it, so its missing `operator>` was never a problem. The `W` in the `nm` output marks them *weak*, which is how identical instantiations across translation units get merged by the linker instead of colliding. The error below shows the two-part shape of every template diagnostic: `In instantiation of ... [with T = NoCompare]` says which substitution failed, `required from here` points at your code, and the actual error points inside the template. **Read these bottom-up for the cause and top-down for the caller.**",
        },
      ],
      pitfalls: [
        {
          title: "Explicit instantiation, when you want the compile time back",
          body: "Header-only templates are recompiled in every translation unit that uses them, which is a real cost in large projects. You can force one build by writing an *explicit instantiation definition* in a single `.cpp` — `template int maxOf<int>(int, int);` — and an *explicit instantiation declaration* in the header — `extern template int maxOf<int>(int, int);` — which tells every other translation unit not to bother. The standard library does this for common `std::basic_string` and `std::basic_ostream` instantiations. It only helps when you know the set of types in advance.",
        },
      ],
    },
    {
      id: "practical",
      heading: "Return types and multiple parameters",
      body: [
        "A template with one type parameter forces every argument to agree, which is often too strict. Two parameters relax it, and then the question is what the function returns.",
        "**`auto` return type** is the simplest answer and usually the right one: the compiler deduces it from the `return` statement. Since C++14 this works for ordinary function bodies with no extra syntax.",
        "**`std::common_type_t<T, U>`** names the type the two would convert to under the conditional operator — `int` and `double` give `double` — and is worth knowing because you will see it in library code and because it can appear in a declaration where `auto` cannot.",
        "**`decltype(auto)`** preserves references and value category exactly, where plain `auto` would strip them. Reach for it when writing a forwarding wrapper that must return exactly what the wrapped call returned.",
        "One caution: **`auto` strips `const` and references**, so a template returning `auto` from `container[i]` returns a *copy*, and a caller trying to write through it is assigning to a temporary. Whether you find out depends entirely on the element type — for a built-in type it is a compile error, and for a class type it compiles and does nothing at all. That asymmetry is exactly what `decltype(auto)` is for.",
      ],
      examples: [
        {
          id: "two-params",
          title: "Two parameters, three ways to say what comes back",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <type_traits>
#include <vector>

// 1. auto: deduced from the return statement. The usual choice.
template <typename T, typename U>
auto addAuto(T a, U b) { return a + b; }

// 2. common_type_t: names the type explicitly, usable in a declaration.
template <typename T, typename U>
std::common_type_t<T, U> addCommon(T a, U b) { return a + b; }

// 3. decltype(auto): preserves the reference that operator[] returned.
template <typename Container>
decltype(auto) firstOf(Container& c) { return c[0]; }

// plain auto: strips the reference and returns a COPY.
template <typename Container>
auto firstCopy(Container& c) { return c[0]; }

int main() {
    std::cout << addAuto(1, 2.5) << '\\n';        // int + double -> double
    std::cout << addCommon(1, 2.5) << '\\n';
    std::cout << std::boolalpha
              << std::is_same_v<decltype(addAuto(1, 2.5)), double> << '\\n';

    std::vector<int> v{10, 20, 30};
    firstOf(v) = 99;                  // int& -- writes through
    std::cout << "ints  after firstOf   = 99 : " << v[0] << '\\n';
    // firstCopy(v) = 77;             // ERROR: lvalue required as left operand

    // With a CLASS element type the same mistake compiles and does nothing.
    std::vector<std::string> s{"alpha", "beta"};
    firstOf(s) = "CHANGED";           // std::string& -- writes through
    std::cout << "class after firstOf   : " << s[0] << '\\n';
    firstCopy(s) = "LOST";            // assigns to a temporary. Silent no-op.
    std::cout << "class after firstCopy : " << s[0] << '\\n';
}`,
          output: `3.5
3.5
true
ints  after firstOf   = 99 : 99
class after firstOf   : CHANGED
class after firstCopy : CHANGED`,
          explanation:
            "**The same mistake is caught for `int` and silent for `std::string`.** `firstOf` returns `int&` and `std::string&` because `decltype(auto)` kept the reference `operator[]` handed back, so both writes landed. `firstCopy` returns a copy — and assigning to a returned `int` is a compile error, because you cannot assign to a built-in prvalue, while assigning to a returned `std::string` is perfectly legal, modifies a temporary, and vanishes. So `s[0]` is still `CHANGED`. **Whether this bug is a build failure or a silent wrong answer depends on the element type**, which is the best possible reason to know `decltype(auto)` exists.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is template argument deduction, and when does it fail?",
      answer:
        "It is the process by which the compiler works out the template parameters from the function arguments, so you can write `maxOf(3, 7)` instead of `maxOf<int>(3, 7)`. Each argument is matched against its parameter pattern independently, and deduction fails when two arguments deduce different types for the same parameter — `maxOf(3, 7.5)` gives `int` from one and `double` from the other, which is an error rather than a promotion, because deduction never applies conversions. It also fails for a parameter that does not appear in the function's parameter list at all, such as a return type, which must then be supplied explicitly. The fixes are an explicit argument, matching types, or separate parameters for each argument.",
    },
    {
      question: "What is decay, and how does it differ between by-value and by-const-reference parameters?",
      answer:
        "Decay is the transformation applied when deducing for a by-value parameter: references are stripped, top-level `const` and `volatile` are stripped, arrays become pointers, and functions become function pointers. So passing a `const int` to `f(T)` deduces `T = int`, and passing an `int[5]` deduces `int*`. A `const T&` parameter does not decay: `T` is the bare type and an array stays `int[5]` with its bound intact. That is exactly how `std::size` and `std::begin` recover a raw array's length — they take it by reference, because a by-value parameter would have lost it.",
    },
    {
      question: "What is a forwarding reference, and how does deduction treat it?",
      answer:
        "A parameter declared `T&&` where `T` is deduced in that same declaration. If the argument is an lvalue, `T` deduces as an lvalue reference — `int&` — and reference collapsing makes the parameter `int&`; if the argument is an rvalue, `T` deduces as the plain type and the parameter is `int&&`. It is the only context in which `T` itself can be deduced as a reference type, and it is what allows one function to accept both lvalues and rvalues while preserving the difference, which is the basis of perfect forwarding. Note `T&&` is only a forwarding reference when `T` is being deduced right there — `std::vector<T>&&` is an ordinary rvalue reference.",
    },
    {
      question: "Why must template definitions live in header files?",
      answer:
        "Because a template is not code until it is instantiated, and the compiler needs the full definition to generate from. A declaration alone tells it the signature but not the body, so it cannot produce the specialisation. Putting the definition in a `.cpp` means the instantiation can only happen in that one translation unit, and every other one gets an undefined reference at link time. Identical instantiations in multiple translation units are not an ODR violation — they are emitted as weak symbols and the linker merges them. The escape hatch when compile times matter is explicit instantiation: define the specialisations you need in one `.cpp` and declare them `extern template` in the header.",
    },
    {
      question: "Why do template error messages appear so far from the mistake?",
      answer:
        "Because errors in a template body are only detected when the template is instantiated with a concrete type. The body itself is checked only for things that do not depend on the parameters; anything dependent is deferred. So writing `a > b` in a template is fine until you instantiate it with a type having no `operator>`, at which point the error is reported inside the template — often deep in a library header — with a chain of `required from here` notes tracing back to your call. Read them bottom-up to find the cause and top-down to find which of your calls triggered it. Concepts largely fix this by making the constraint checkable at the call site.",
    },
    {
      question: "When would you use `decltype(auto)` instead of `auto` as a return type?",
      answer:
        "When the return value's reference-ness and value category must be preserved exactly. `auto` deduces by the same rules as by-value deduction, so it strips references and top-level `const` — a template returning `auto` from `c[0]` returns a copy, and a caller trying to write through it is assigning to a temporary. How that surfaces depends on the element type: for a built-in type it is a compile error, since you cannot assign to a prvalue `int`, but for a class type it compiles, modifies the temporary and is discarded, so the bug is completely silent. `decltype(auto)` deduces the exact declared type of the expression, returns `int&` or `std::string&`, and the write reaches the container. It is the right choice for forwarding wrappers that must return whatever the wrapped call returned, and the wrong choice when you genuinely want a copy.",
    },
  ],
  takeaways: [
    "A function template is a pattern; the compiler generates a separate function per set of types used",
    "`typename` and `class` are interchangeable in a template parameter list",
    "Deduction never converts — two arguments deducing different types for one parameter is an error",
    "By-value parameters decay: references and top-level `const` are stripped, arrays become pointers",
    "`const T&` does not decay, which is how a template can see an array's real bound",
    "`T&&` with a deduced `T` is a forwarding reference, the only place `T` itself becomes a reference type",
    "A template generates no code until it is instantiated",
    "Errors in a template body surface at instantiation, which is why they point deep into headers",
    "Read a template error bottom-up for the cause and top-down for the call that triggered it",
    "Template definitions belong in headers; instantiations are weak symbols the linker merges",
    "`auto` return strips references — use `decltype(auto)` when the caller must write through the result",
  ],
  status: "available",
};
