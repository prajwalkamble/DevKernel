import type { Lesson } from "@/content/types";

export const conceptsLesson: Lesson = {
  id: "cpp-concepts",
  slug: "concepts-and-constrained-templates",
  moduleSlug: "templates-generics",
  title: "Concepts & Constrained Templates",
  summary:
    "Saying what a template requires of its types, and having the compiler check it at the call site. The error-message problem concepts were built to solve, the four ways to write a constraint, requires-expressions, and subsumption picking the most specific overload for free.",
  estimatedMinutes: 40,
  objectives: [
    "Explain why unconstrained template errors are reported in the wrong place",
    "Define a concept and use it in all four constraint syntaxes",
    "Write a requires-expression and read what each line requires",
    "Use subsumption to order overloads by specificity",
    "Reach for the right standard library concept instead of writing your own",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "The problem concepts solve",
      body: [
        "An unconstrained template promises nothing about its parameters, so the compiler cannot check a call — it can only substitute the type, compile the body, and report whatever goes wrong *inside*.",
        "The result is a diagnostic describing a symptom in someone else's code. Sorting a `std::list` fails because `std::sort` needs random access iterators, but the error you get names a missing `operator-` on line 1906 of `stl_algo.h`. Nothing in it says \"a list cannot be sorted by `std::sort`\", which is the fact you needed.",
        "**A concept is a named predicate on types, checked before the body is ever instantiated.** When a constrained template does not match, the compiler reports that the *constraint* failed and which one — at your call site, in your vocabulary.",
        "The comparison below is real GCC 14 output for the same mistake made two ways.",
      ],
      examples: [
        {
          id: "error-comparison",
          title: "The same mistake, unconstrained and constrained",
          lang: "bash",
          code: `// Both files do the same wrong thing: sort a std::list.
std::list<int> l{3, 1, 2};

// ---------- UNCONSTRAINED: std::sort ----------
std::sort(l.begin(), l.end());

/usr/include/c++/14/bits/stl_algo.h:1906:50: error: no match for 'operator-'
  (operand types are 'std::_List_iterator<int>' and 'std::_List_iterator<int>')

// The failure is a missing operator, reported inside a standard header,
// 1906 lines into a file you did not write. It never mentions your list.


// ---------- CONSTRAINED: std::ranges::sort ----------
std::ranges::sort(l);

error: no match for call to '(const std::ranges::__sort_fn) (std::list<int>&)'
note: constraints not satisfied
note:   required for the satisfaction of 'random_access_range<_Range>'
          [with _Range = std::__cxx11::list<int, std::allocator<int> >&]
note:   'std::random_access_iterator_tag' is not a base of
          'std::bidirectional_iterator_tag'`,
          output: `# The constrained version names the actual problem:
#   your range is bidirectional, and sort requires random access.`,
          explanation:
            "**Both errors are about the same length; only one of them is about your mistake.** The unconstrained version reports a missing `operator-` — a *consequence* of using a list, discovered halfway through instantiating the sort implementation. The constrained version says `constraints not satisfied`, names `random_access_range` as the requirement, and finishes with the precise reason: a bidirectional iterator tag is not a random access one. The second is something you can act on without opening a standard header.",
        },
      ],
    },
    {
      id: "writing-concepts",
      heading: "Defining and applying a concept",
      body: [
        "A concept is declared with `template <typename T> concept Name = <constant boolean expression>;`. The expression can be any compile-time predicate — a type trait, another concept, a combination with `&&` and `||`, or a `requires`-expression.",
        "**Concepts are ordinary compile-time booleans.** `Numeric<int>` is a value you can print, pass to `static_assert`, or use in `if constexpr`. There is no separate world for them, which makes them far easier to debug than the metaprogramming they replaced.",
        "There are **four ways to apply one**, and they mean the same thing. Choose by readability.",
        "**A `requires` clause after the template header** — `template <typename T> requires Numeric<T>` — the most explicit, and the only one that handles complex compound constraints comfortably.",
        "**The concept in place of `typename`** — `template <Numeric T>` — the most compact for a single constraint on a single parameter, and the most common in practice.",
        "**A trailing `requires` clause** — after the parameter list — which reads well when the constraint refers to the parameters.",
        "**An abbreviated function template** — `Numeric auto twice(Numeric auto v)` — with no template header at all. `auto` as a parameter type makes the function a template implicitly, and prefixing it with a concept constrains it.",
      ],
      examples: [
        {
          id: "four-syntaxes",
          title: "One concept, four spellings, plus a requires-expression",
          lang: "cpp",
          code: `#include <concepts>
#include <iostream>
#include <string>
#include <vector>

// A concept is a named, compile-time predicate on types.
template <typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

// A requires-expression lists the operations a type must support.
// Nothing in the body is EVALUATED -- it is only checked for validity.
template <typename T>
concept Container = requires(T c) {
    typename T::value_type;                              // must have this type
    { c.size() }  -> std::convertible_to<std::size_t>;   // and this call,
    { c.begin() } -> std::input_or_output_iterator;      // returning that
    { c.end() }   -> std::input_or_output_iterator;
};

// Four equivalent ways to constrain a template.

// 1. requires clause after the template header
template <typename T> requires Numeric<T>
T twice1(T v) { return v * 2; }

// 2. concept used directly in place of 'typename'
template <Numeric T>
T twice2(T v) { return v * 2; }

// 3. trailing requires clause
template <typename T>
T twice3(T v) requires Numeric<T> { return v * 2; }

// 4. abbreviated function template -- no template header at all
Numeric auto twice4(Numeric auto v) { return v * 2; }

template <Container C>
void report(const C& c) {
    std::cout << "  container of " << c.size() << " elements\\n";
}

int main() {
    std::cout << twice1(21) << ' ' << twice2(1.5) << ' '
              << twice3(4)  << ' ' << twice4(2.5) << '\\n';

    std::vector<int> v{1, 2, 3};
    std::string      s = "hello";
    report(v);
    report(s);

    // Concepts are ordinary compile-time booleans; you can test them.
    std::cout << std::boolalpha;
    std::cout << "Numeric<int>            = " << Numeric<int> << '\\n';
    std::cout << "Numeric<std::string>    = " << Numeric<std::string> << '\\n';
    std::cout << "Container<std::vector<int>> = "
              << Container<std::vector<int>> << '\\n';
    std::cout << "Container<int>          = " << Container<int> << '\\n';

    static_assert(Numeric<double>);
    static_assert(!Numeric<std::string>);
}`,
          output: `42 3 8 5
  container of 3 elements
  container of 5 elements
Numeric<int>            = true
Numeric<std::string>    = false
Container<std::vector<int>> = true
Container<int>          = false`,
          explanation:
            "**`Container` matched `std::vector<int>` and `std::string` without either type knowing the concept exists.** That is structural typing: the concept asks whether the operations are available, not whether the type inherits from anything. Inside the `requires`-expression, `typename T::value_type;` requires a nested type to exist, and `{ c.size() } -> std::convertible_to<std::size_t>;` requires the call to be valid *and* its result to satisfy a further concept. **Nothing in the body is executed** — `c` is a fictional parameter that exists only so operations can be named.",
        },
      ],
      pitfalls: [
        {
          title: "`requires requires` is not a typo",
          body: "You will meet `template <typename T> requires requires(T x) { x.foo(); }` and it is legal. The first `requires` introduces the *clause*; the second introduces an inline *expression*. It works but reads badly, and the fix is almost always to give the requires-expression a name by making it a concept, then use that name in the clause. Do it once and every call site and error message becomes more readable.",
        },
        {
          title: "A requires-expression is checked for validity, not truth",
          body: "`requires(T c) { c.size() == 0; }` requires that the expression `c.size() == 0` *compiles*, not that it evaluates to true — nothing is ever run. A concept whose body is a list of expressions is asking \"can I write this?\", which is why a type with a `size()` returning something nonsensical still satisfies it. Use the `{ expr } -> Concept;` form when you care about the result type, and remember that no concept can check semantics — that `operator<` is actually a strict weak ordering is a promise the type makes and the compiler cannot verify.",
        },
      ],
    },
    {
      id: "subsumption",
      heading: "Subsumption: the more constrained overload wins",
      body: [
        "The feature that makes concepts more than nicer error messages is **subsumption**. When several constrained overloads match, the compiler prefers the one with the *stronger* constraint — automatically, with no ordering tricks.",
        "It works by decomposing constraints into their atomic parts and asking whether one implies the other. If `Bidirectional` is defined as `Forward<I> && std::bidirectional_iterator<I>`, then `Bidirectional` subsumes `Forward`, so the bidirectional overload is more specialised and wins wherever both apply.",
        "**This is why concepts should be built out of one another rather than written flat.** If two concepts happen to require the same things but are written as unrelated expressions, the compiler cannot see the implication and the call is ambiguous. Layering them — each concept refining a weaker one — is what makes the ordering work.",
        "The pattern replaces tag dispatch entirely. The pre-C++20 way to select an algorithm by iterator category was to pass a tag object and overload on it; now you constrain the overloads and the compiler picks.",
      ],
      examples: [
        {
          id: "subsumption-demo",
          title: "Three overloads, three containers, no dispatch code",
          lang: "cpp",
          code: `#include <concepts>
#include <forward_list>
#include <iostream>
#include <list>
#include <vector>

// Subsumption: a more-constrained overload wins automatically.
// No tag dispatch, no enable_if, no ordering tricks.
// Note each concept is built FROM the previous one -- that is what lets
// the compiler see that one implies the other.

template <typename I>
concept Forward = std::forward_iterator<I>;

template <typename I>
concept Bidirectional = Forward<I> && std::bidirectional_iterator<I>;

template <typename I>
concept RandomAccess = Bidirectional<I> && std::random_access_iterator<I>;

template <Forward I>
void advanceBy(I&, int) { std::cout << "  forward: step one at a time\\n"; }

template <Bidirectional I>
void advanceBy(I&, int) { std::cout << "  bidirectional: can step backwards\\n"; }

template <RandomAccess I>
void advanceBy(I&, int) { std::cout << "  random access: single addition\\n"; }

int main() {
    std::forward_list<int> fl{1, 2, 3};
    std::list<int>         li{1, 2, 3};
    std::vector<int>       ve{1, 2, 3};

    auto a = fl.begin();
    auto b = li.begin();
    auto c = ve.begin();

    std::cout << "forward_list:\\n";  advanceBy(a, 1);
    std::cout << "list:\\n";          advanceBy(b, 1);
    std::cout << "vector:\\n";        advanceBy(c, 1);
}`,
          output: `forward_list:
  forward: step one at a time
list:
  bidirectional: can step backwards
vector:
  random access: single addition`,
          explanation:
            "**All three overloads match a `vector` iterator, and the compiler chose the most constrained without being told to.** A `std::vector` iterator satisfies `Forward`, `Bidirectional` and `RandomAccess`, and subsumption ranked them. The key detail is in the concept definitions: `RandomAccess` is written as `Bidirectional<I> && ...`, so the implication is visible to the compiler. Had the three been written as three unrelated expressions that happen to be equivalent, the call would have been ambiguous. This is the whole of what tag dispatch used to do, in a form you can read.",
        },
      ],
    },
    {
      id: "standard-concepts",
      heading: "The standard library's concepts",
      body: [
        "Most constraints you need already exist. Reaching for them gives better error messages, correct subsumption against library code, and saves you from getting the details subtly wrong.",
        "**From `<concepts>`** — the core vocabulary: `std::integral`, `std::floating_point`, `std::same_as`, `std::derived_from`, `std::convertible_to`, `std::constructible_from`, `std::assignable_from`, `std::destructible`, `std::equality_comparable`, `std::totally_ordered`, `std::movable`, `std::copyable`, `std::regular`, `std::invocable` and `std::predicate`.",
        "**From `<iterator>`** — the iterator hierarchy, which is properly layered and subsumes correctly: `std::input_iterator`, `std::output_iterator`, `std::forward_iterator`, `std::bidirectional_iterator`, `std::random_access_iterator`, `std::contiguous_iterator`, plus `std::sentinel_for` and `std::sortable`.",
        "**From `<ranges>`** — `std::ranges::range`, `sized_range`, `input_range`, `random_access_range`, `contiguous_range`, `view` and `borrowed_range`.",
        "Two worth singling out. **`std::regular<T>`** means default-constructible, copyable and equality-comparable — the behaviour of an `int`, and a good default requirement for a value type. **`std::invocable<F, Args...>`** constrains a callable parameter, which is the right way to say \"this takes a function\" instead of an unconstrained `typename F`.",
        "**Write your own concept when it names a domain idea in your codebase** — `Serializable`, `Drawable`, `Repository` — not to re-express something the standard already has.",
      ],
      examples: [
        {
          id: "user-concept-error",
          title: "The error a reader of your code actually gets",
          lang: "bash",
          code: `// The whole program:
template <typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

template <Numeric T> T twice(T v) { return v * 2; }

int main() { return twice(std::string{"no"}).size(); }


// The whole error:
error: no matching function for call to 'twice(std::string)'
    6 | int main() { return twice(std::string{"no"}).size(); }
      |                     ~~~~~^~~~~~~~~~~~~~~~~~~

note: candidate: 'template<class T>  requires  Numeric<T> T twice(T)'
note:   template argument deduction/substitution failed:
note: constraints not satisfied

note:   required for the satisfaction of 'Numeric<T>'
          [with T = std::__cxx11::basic_string<char, ...>]
note: no operand of the disjunction is satisfied
    4 | concept Numeric = std::integral<T> || std::floating_point<T>;`,
          output: `# Every line points at code the reader wrote, and the last line
# names exactly which part of the constraint failed and why.`,
          explanation:
            "**The error stays entirely inside the user's own file.** It names the function, shows the candidate with its constraint, states that constraints were not satisfied, and then — the line that matters — reports `no operand of the disjunction is satisfied` while pointing at the `||` in the concept definition. Compare that with the unconstrained case at the top of this lesson, where the message was about `operator-` inside `stl_algo.h`. **The constraint moved the error from the implementation to the interface**, which is the entire point.",
        },
      ],
      pitfalls: [
        {
          title: "Concepts constrain syntax, and can never constrain semantics",
          body: "`std::totally_ordered<T>` checks that `<`, `>`, `<=`, `>=` and `==` exist and return something boolean-testable. It cannot check that they define an actual total order, and a type whose `operator<` returns random values satisfies it perfectly. The standard describes these extra requirements as *semantic requirements*, which the type author must honour and the compiler cannot verify — exactly like the substitution rule for inheritance in module 6. When you define a concept, document the semantic promises alongside the syntactic ones, because only one of the two is enforced.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What problem do concepts solve?",
      answer:
        "Unconstrained templates promise nothing about their parameters, so the compiler cannot check a call — it substitutes the type, compiles the body, and reports whatever fails inside. That produces errors describing a symptom in someone else's code: sorting a `std::list` with `std::sort` reports a missing `operator-` deep inside `stl_algo.h` rather than saying a list is not randomly accessible. A concept is a named predicate checked before instantiation, so a failed call reports which constraint was not satisfied, at your call site. `std::ranges::sort` on a list says `constraints not satisfied`, names `random_access_range`, and explains that a bidirectional iterator tag is not a random access one.",
    },
    {
      question: "What are the four ways to constrain a template, and when would you use each?",
      answer:
        "A `requires` clause after the template header, `template <typename T> requires Numeric<T>` — most explicit and the only comfortable option for compound constraints. The concept in place of `typename`, `template <Numeric T>` — most compact and the usual choice for a single constraint. A trailing `requires` clause after the parameter list, which reads well when the constraint refers to the parameters. And an abbreviated function template, `Numeric auto f(Numeric auto v)`, with no template header at all — `auto` as a parameter type makes it a template implicitly. All four mean the same thing; pick for readability.",
    },
    {
      question: "What is a requires-expression, and what does it actually check?",
      answer:
        "A block listing operations a type must support: `requires(T c) { typename T::value_type; { c.size() } -> std::convertible_to<std::size_t>; }`. It checks *validity*, not truth — nothing in it is evaluated, and the parameter is fictional, existing only so operations can be named. A bare expression requires that it compiles; `typename T::X;` requires a nested type to exist; the compound form `{ expr } -> Concept;` requires the expression to be valid and its result to satisfy a further concept. Because it tests only whether operations exist, it is structural: a type satisfies a concept without ever mentioning it.",
    },
    {
      question: "What is subsumption, and why must concepts be layered for it to work?",
      answer:
        "When several constrained overloads match, the compiler prefers the one with the stronger constraint. It works by decomposing constraints into atomic parts and checking whether one implies another, so if `Bidirectional` is defined as `Forward<I> && std::bidirectional_iterator<I>`, it subsumes `Forward` and wins where both apply. This replaces tag dispatch entirely. It only works if the implication is visible in the constraint's structure — two concepts written as unrelated expressions that happen to be equivalent do not subsume each other, and the call is ambiguous. So build each concept out of the weaker one it refines rather than writing them flat.",
    },
    {
      question: "Can a concept check that a type behaves correctly?",
      answer:
        "No. Concepts constrain syntax only. `std::totally_ordered<T>` verifies that the comparison operators exist and return something boolean-testable; it cannot verify that they define an actual total order, and a type whose `operator<` returns random values satisfies it. The standard calls these *semantic requirements* — obligations on the type author that the compiler cannot check, exactly like the Liskov substitution rule for inheritance. When defining your own concept, document the semantic promises alongside the syntactic ones, since only one of the two is enforced.",
    },
    {
      question: "Which standard concepts should you know, and when do you write your own?",
      answer:
        "From `<concepts>`: `integral`, `floating_point`, `same_as`, `derived_from`, `convertible_to`, `constructible_from`, `equality_comparable`, `totally_ordered`, `movable`, `copyable`, `regular`, `invocable` and `predicate`. From `<iterator>`: the properly layered iterator hierarchy from `input_iterator` to `contiguous_iterator`, plus `sentinel_for` and `sortable`. From `<ranges>`: `range`, `sized_range`, `random_access_range`, `view`. Two are worth singling out — `std::regular<T>` describes a value type that behaves like an `int`, and `std::invocable<F, Args...>` is the right way to constrain a callable parameter. Write your own when naming a domain idea in your codebase, not to re-express something that already exists.",
    },
  ],
  takeaways: [
    "Unconstrained templates report errors inside the implementation, not at the call site",
    "A concept is a named compile-time predicate checked before the body is instantiated",
    "Concepts are ordinary booleans — printable, `static_assert`-able, usable in `if constexpr`",
    "Four equivalent syntaxes: `requires` clause, concept-for-`typename`, trailing `requires`, abbreviated `auto`",
    "A requires-expression checks that expressions are *valid*, never that they are true",
    "`{ expr } -> Concept;` constrains the result type; `typename T::X;` requires a nested type",
    "`requires requires` is legal — the fix is to name the expression as a concept",
    "Subsumption makes the more constrained overload win, replacing tag dispatch",
    "Subsumption only works when concepts are layered so the implication is structurally visible",
    "Prefer the standard concepts; write your own for domain ideas",
    "`std::regular` is the value-type default; `std::invocable` is how to constrain a callable",
    "Concepts constrain syntax and can never verify semantics — document those separately",
  ],
  status: "available",
};
