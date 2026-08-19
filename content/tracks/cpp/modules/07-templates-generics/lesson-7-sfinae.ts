import type { Lesson } from "@/content/types";

export const sfinaeLesson: Lesson = {
  id: "cpp-sfinae",
  slug: "sfinae-enable-if-and-older-generic-code",
  moduleSlug: "templates-generics",
  title: "SFINAE, enable_if & the Code You Will Still Have to Read",
  summary:
    "How templates were constrained before concepts, and why every codebase older than C++20 is full of it. Substitution failure as a selection mechanism, `enable_if` in its three positions, the `void_t` detection idiom and tag dispatch — each shown beside the two-line modern version that replaced it.",
  estimatedMinutes: 40,
  objectives: [
    "State what SFINAE is and which failures it applies to",
    "Read `enable_if` in the return type, a template parameter and a function parameter",
    "Read and write the `void_t` detection idiom",
    "Recognise tag dispatch and say what it was for",
    "Translate each pattern into its C++20 equivalent",
  ],
  sections: [
    {
      id: "what-sfinae-is",
      heading: "Substitution Failure Is Not An Error",
      body: [
        "When the compiler considers a function template as a candidate, it substitutes the deduced types into the *signature*. **If that substitution produces something invalid, the candidate is silently removed from the overload set** rather than causing an error. Only if every candidate is removed do you get a diagnostic.",
        "That is SFINAE. It was discovered as a consequence of the overload rules rather than designed, and for twenty years it was the only way to say \"this template applies only to certain types\".",
        "**The rule is narrow, and the narrowness is the whole difficulty.** Only failures in the *immediate context* of the substitution — the signature: template parameters, the return type, the function parameter types — are soft. An error inside the function *body* is a hard error that stops the compilation, because bodies are not instantiated until after a candidate is chosen.",
        "So constraining a template with SFINAE means encoding the condition into the signature somehow, which is why the resulting code is so indirect: the condition has to be smuggled into a return type or a defaulted parameter, since those are the only places the compiler is looking.",
      ],
      examples: [
        {
          id: "enable-if-positions",
          title: "`enable_if` in all three positions",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <type_traits>

// SFINAE: "Substitution Failure Is Not An Error".
// If substituting the deduced types produces an invalid SIGNATURE, that
// candidate is silently removed from the overload set instead of being a
// hard error. Only if NO candidate survives do you get a diagnostic.

// 1. In the return type -- the most common in older code.
template <typename T>
typename std::enable_if<std::is_integral<T>::value, std::string>::type
describeRet(T v) { return "integral " + std::to_string(v); }

template <typename T>
typename std::enable_if<std::is_floating_point<T>::value, std::string>::type
describeRet(T v) { return "floating " + std::to_string(v); }

// 2. As a defaulted template parameter -- keeps the return type readable.
template <typename T, std::enable_if_t<std::is_integral_v<T>, int> = 0>
std::string describeParam(T v) { return "integral " + std::to_string(v); }

template <typename T, std::enable_if_t<std::is_floating_point_v<T>, int> = 0>
std::string describeParam(T v) { return "floating " + std::to_string(v); }

// 3. As a defaulted function parameter -- rare, and breaks variadics.
template <typename T>
std::string describeArg(T v, std::enable_if_t<std::is_integral_v<T>, int> = 0) {
    return "integral " + std::to_string(v);
}

int main() {
    std::cout << describeRet(42)     << '\\n';
    std::cout << describeRet(2.5)    << '\\n';
    std::cout << describeParam(42)   << '\\n';
    std::cout << describeParam(2.5)  << '\\n';
    std::cout << describeArg(7)      << '\\n';

    // describeRet(std::string{"x"});   // ERROR: no matching function
    // -- both candidates removed by SFINAE, so nothing is left.
}`,
          output: `integral 42
floating 2.500000
integral 42
floating 2.500000
integral 7`,
          explanation:
            "**`std::enable_if<Cond, T>` has a member `type` equal to `T` when `Cond` is true, and no member `type` at all when it is false.** That absence is the trick: writing `typename std::enable_if<false, ...>::type` is an invalid type, so the candidate quietly disappears. The three positions differ in practical cost — the return type version makes the signature nearly unreadable, the defaulted template parameter keeps the return type clean and is the best of the three, and the defaulted function parameter changes the function's arity and cannot be used before a parameter pack. **Position 2 is the one to prefer when you must write this at all.**",
        },
      ],
      pitfalls: [
        {
          title: "Two `enable_if` overloads must have mutually exclusive conditions",
          body: "SFINAE removes candidates; it does not rank them. If two overloads' conditions are both true for some type, both survive substitution and the call is ambiguous — there is no notion of one being \"more constrained\", which is precisely what C++20 subsumption added. So overload sets built this way need conditions that partition the type space exactly, and adding a third overload later means revisiting the other two to exclude the new case. That maintenance burden is the practical reason concepts were worth waiting for.",
        },
      ],
    },
    {
      id: "detection",
      heading: "The detection idiom",
      body: [
        "The other major use of SFINAE is asking whether a type supports an operation at all — \"does `T` have a `size()` member?\" — which the language offers no direct way to ask.",
        "**`std::void_t`** makes it possible. It is an alias template that maps any number of *valid* types to `void`. If any of the types passed to it is invalid, substitution fails, and a partial specialisation using it is discarded — falling back to the primary template.",
        "The pattern is always the same shape: a primary template inheriting `false_type` with a defaulted second parameter, and a partial specialisation inheriting `true_type` whose second argument is a `void_t` wrapping the expression you are testing.",
        "**`std::declval<T>()`** appears alongside it constantly. It produces a value of type `T` in an unevaluated context without requiring a constructor, so you can write `declval<T>().size()` to name the expression without ever constructing a `T`. It has no definition and may only appear where nothing is evaluated — inside `decltype`, `sizeof`, or a requires-expression.",
        "**The C++20 version of all of this is one `requires` expression**, and the comparison below is the clearest single argument for concepts in this module.",
      ],
      examples: [
        {
          id: "void-t",
          title: "Five lines of `void_t`, then the two-line replacement",
          lang: "cpp",
          code: `#include <iostream>
#include <list>
#include <string>
#include <type_traits>
#include <vector>

// The void_t detection idiom: ask whether an expression is well-formed.
// std::void_t<...> maps any valid types to void; if any is invalid,
// substitution fails and the primary template is used instead.

template <typename, typename = std::void_t<>>
struct has_size : std::false_type {};

template <typename T>
struct has_size<T, std::void_t<decltype(std::declval<T>().size())>>
    : std::true_type {};

template <typename, typename = std::void_t<>>
struct has_push_back : std::false_type {};

template <typename T>
struct has_push_back<T, std::void_t<decltype(std::declval<T>().push_back(
                                    std::declval<typename T::value_type>()))>>
    : std::true_type {};

// The C++20 equivalent, in two lines instead of five.
template <typename T>
concept HasSize = requires(T t) { t.size(); };

struct Plain { int x; };

int main() {
    std::cout << std::boolalpha;
    std::cout << "has_size<std::vector<int>> = "
              << has_size<std::vector<int>>::value << '\\n';
    std::cout << "has_size<std::string>      = "
              << has_size<std::string>::value      << '\\n';
    std::cout << "has_size<Plain>            = "
              << has_size<Plain>::value            << '\\n';
    std::cout << "has_size<int>              = "
              << has_size<int>::value              << '\\n';

    std::cout << "has_push_back<std::vector<int>> = "
              << has_push_back<std::vector<int>>::value << '\\n';
    std::cout << "has_push_back<std::list<int>>   = "
              << has_push_back<std::list<int>>::value   << '\\n';

    std::cout << "HasSize<std::vector<int>>  = " << HasSize<std::vector<int>> << '\\n';
    std::cout << "HasSize<Plain>             = " << HasSize<Plain>            << '\\n';

    static_assert(has_size<std::vector<int>>::value);
    static_assert(!has_size<Plain>::value);
}`,
          output: `has_size<std::vector<int>> = true
has_size<std::string>      = true
has_size<Plain>            = false
has_size<int>              = false
has_push_back<std::vector<int>> = true
has_push_back<std::list<int>>   = true
HasSize<std::vector<int>>  = true
HasSize<Plain>             = false`,
          explanation:
            "**`has_size` and `HasSize` compute exactly the same answers, in five lines and in two.** Read the `void_t` version from the inside out: `declval<T>()` conjures a `T`, `.size()` names the call, `decltype` gets its type, `void_t` turns that into `void` if it was valid — and if it was not, the specialisation is discarded and the `false_type` primary wins. The `requires` version says the same thing in the order you would say it aloud. Note that both are structural and neither requires the tested type to cooperate in any way.",
        },
      ],
    },
    {
      id: "tag-dispatch",
      heading: "Tag dispatch",
      body: [
        "The third pattern predates `enable_if` and is still all over the standard library's internals.",
        "**Instead of constraining one function, you overload on an empty tag type and pass the right tag as an extra argument.** Overload resolution then does the selection. The iterator category tags — `std::random_access_iterator_tag` and friends — exist for exactly this, and their inheritance relationships give the ordering: a random access tag *is a* bidirectional tag, so the more specific overload wins by ordinary conversion ranking.",
        "It is more readable than `enable_if` and it composes with inheritance, which is why it survived so long. What it costs is a helper function per case, a dispatcher, and a tag type hierarchy that has to exist.",
        "**`if constexpr` replaced it almost entirely**, and the version below shows why: the same selection, in one function, with the branch structure visible.",
        "Reach for tag dispatch today only when you need to *add* cases from outside — the tag types provide an extension point that a fixed `if constexpr` chain does not. In new code, prefer constrained overloads, which give you that extensibility with subsumption doing the ordering.",
      ],
      examples: [
        {
          id: "tag-vs-if-constexpr",
          title: "The same algorithm selection, old and new",
          lang: "cpp",
          code: `#include <forward_list>
#include <iostream>
#include <iterator>
#include <vector>

// ---------- THE OLD WAY: tag dispatch ----------
// Overload on a tag TYPE, and let the iterator's category pick.
namespace old_way {
    template <typename It>
    void advanceImpl(It& it, int n, std::random_access_iterator_tag) {
        std::cout << "  [tag] random access: it += n\\n";
        it += n;
    }

    template <typename It>
    void advanceImpl(It& it, int n, std::forward_iterator_tag) {
        std::cout << "  [tag] forward: loop n times\\n";
        while (n-- > 0) ++it;
    }

    template <typename It>
    void advance(It& it, int n) {
        advanceImpl(it, n,
            typename std::iterator_traits<It>::iterator_category{});
    }
}

// ---------- THE NEW WAY: if constexpr ----------
namespace new_way {
    template <typename It>
    void advance(It& it, int n) {
        if constexpr (std::random_access_iterator<It>) {
            std::cout << "  [if constexpr] random access: it += n\\n";
            it += n;
        } else {
            std::cout << "  [if constexpr] forward: loop n times\\n";
            while (n-- > 0) ++it;
        }
    }
}

int main() {
    std::vector<int>       v{1, 2, 3, 4, 5};
    std::forward_list<int> f{1, 2, 3, 4, 5};

    auto a = v.begin();
    auto b = f.begin();
    old_way::advance(a, 3);   std::cout << "  -> " << *a << '\\n';
    old_way::advance(b, 3);   std::cout << "  -> " << *b << '\\n';

    auto c = v.begin();
    auto d = f.begin();
    new_way::advance(c, 3);   std::cout << "  -> " << *c << '\\n';
    new_way::advance(d, 3);   std::cout << "  -> " << *d << '\\n';
}`,
          output: `  [tag] random access: it += n
  -> 4
  [tag] forward: loop n times
  -> 4
  [if constexpr] random access: it += n
  -> 4
  [if constexpr] forward: loop n times
  -> 4`,
          explanation:
            "**Identical results, and the second version is one function instead of three.** The tag version works because `random_access_iterator_tag` derives from `bidirectional_iterator_tag` which derives from `forward_iterator_tag`, so passing a random access tag matches the random access overload exactly and the forward one only by derived-to-base conversion — the exact match wins. That inheritance chain is doing the job C++20 subsumption does automatically. The `if constexpr` version needs no tags, no traits lookup and no helper functions, and you can see both branches at once.",
        },
      ],
    },
    {
      id: "translating",
      heading: "Translating forward",
      body: [
        "You will meet all three patterns in any codebase with history, and the standard library's own headers are written in them for backward compatibility. The useful skill is recognising each on sight and knowing what it was trying to say.",
        "**`enable_if` on the return type or a defaulted template parameter** → a `requires` clause or a constrained parameter. The condition is usually already a type trait, so the translation is mechanical: `std::enable_if_t<std::is_integral_v<T>, int> = 0` becomes `requires std::integral<T>`.",
        "**Two `enable_if` overloads with complementary conditions** → often a single function with `if constexpr`, if the two bodies share a caller. If they are genuinely separate operations, keep two overloads and constrain them, letting subsumption order them instead of hand-partitioning the conditions.",
        "**`void_t` detection traits** → a concept with a `requires` expression, almost always shorter.",
        "**Tag dispatch** → `if constexpr` for a closed set of cases, or constrained overloads when the set must stay open.",
        "The error messages are the reason to bother. Compare the two failures below: both reject a `std::string`, and only one of them explains itself.",
      ],
      examples: [
        {
          id: "error-comparison",
          title: "How each one fails",
          lang: "bash",
          code: `// ---------- enable_if ----------
template <typename T>
typename std::enable_if<std::is_integral<T>::value, std::string>::type
describe(T v) { return "integral " + std::to_string(v); }

describe(std::string{"no"});

error: no matching function for call to 'describe(std::string)'
note: candidate: 'template<class T> typename std::enable_if<
        std::is_integral<_Tp>::value, std::basic_string<char> >::type describe(T)'
note:   template argument deduction/substitution failed:
error: no type named 'type' in
        'struct std::enable_if<false, std::__cxx11::basic_string<char> >'

// ^ The last line describes the MECHANISM, not your mistake. "No type named
//   'type'" is an implementation detail of enable_if leaking into the error.


// ---------- concept ----------
template <typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

template <Numeric T> T twice(T v) { return v * 2; }

twice(std::string{"no"});

error: no matching function for call to 'twice(std::string)'
note: candidate: 'template<class T>  requires  Numeric<T> T twice(T)'
note: constraints not satisfied
note:   required for the satisfaction of 'Numeric<T>'
note: no operand of the disjunction is satisfied
    4 | concept Numeric = std::integral<T> || std::floating_point<T>;`,
          output: `# Same rejection. One reports a missing member of a helper struct;
# the other names your concept and says which part of it failed.`,
          explanation:
            "**\"No type named `type` in `struct std::enable_if<false, ...>`\" is the SFINAE machinery showing through.** It is accurate and it is useless to anyone who does not already know how `enable_if` is implemented — the reader has to work backwards from a missing member typedef to the fact that their type is not integral. The concept version names the constraint, says it was not satisfied, and points at the `||` in the definition. **That difference, repeated across every generic function in a codebase, is what concepts bought.**",
        },
      ],
      pitfalls: [
        {
          title: "You cannot always delete the old code",
          body: "Library headers that must compile as C++11 or C++14 cannot use concepts, and neither can code you do not own. When maintaining such a header, the realistic options are to keep the existing idiom for consistency, or to guard both with `#if __cpp_concepts >= 201907L` and maintain two paths — which is what several standard library implementations do internally. Do not half-convert a header: a file mixing `enable_if` overloads with constrained ones is harder to reason about than either style alone, because the two mechanisms interact through overload resolution in ways that are easy to get wrong.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is SFINAE, and which failures does it cover?",
      answer:
        "Substitution Failure Is Not An Error: when the compiler substitutes deduced types into a function template's signature and the result is invalid, the candidate is removed from the overload set instead of causing an error. Only if no candidate survives do you get a diagnostic. Crucially it applies only to failures in the *immediate context* — the template parameters, return type and function parameter types. An error inside the function body is a hard error, because bodies are not instantiated until a candidate has been selected. That narrowness is why SFINAE-based constraints look so indirect: the condition has to be encoded into the signature, since that is the only place the compiler is checking.",
    },
    {
      question: "How does `std::enable_if` work, and what are its three positions?",
      answer:
        "`std::enable_if<Cond, T>` has a member typedef `type` equal to `T` when `Cond` is true and *no member at all* when false, so naming `typename enable_if<false, T>::type` is invalid and the candidate is silently discarded. It can go in the return type, which is common in older code but makes signatures nearly unreadable; as a defaulted template parameter, `std::enable_if_t<Cond, int> = 0`, which keeps the return type clean and is the best of the three; or as a defaulted function parameter, which is rare because it changes the function's arity and cannot precede a parameter pack.",
    },
    {
      question: "Why must two `enable_if` overloads have mutually exclusive conditions?",
      answer:
        "Because SFINAE only removes candidates, it never ranks them. If both conditions are true for a given type, both overloads survive substitution and the call is ambiguous — there is no notion of one being more constrained than the other. So the conditions have to partition the type space exactly, and adding a third overload means going back and excluding the new case from the existing two. C++20 subsumption fixed this: constrained overloads are ordered automatically by which constraint is stronger, so you can add a more specific overload without touching the others.",
    },
    {
      question: "Explain the `void_t` detection idiom.",
      answer:
        "`std::void_t<...>` is an alias that maps any number of valid types to `void`. You write a primary template inheriting `false_type` with a defaulted second parameter, and a partial specialisation inheriting `true_type` whose second argument is `void_t<decltype(expression)>`. If the expression is valid, the specialisation matches and you get `true`; if not, substitution fails, the specialisation is discarded, and the primary gives `false`. `std::declval<T>()` usually appears inside it, producing a value of type `T` in an unevaluated context without needing a constructor. The C++20 replacement is a concept with a requires-expression, which does the same job in about two lines instead of five.",
    },
    {
      question: "What is tag dispatch, and what replaced it?",
      answer:
        "Instead of constraining one function, you write overloads taking an extra empty tag-type parameter and a dispatcher that passes the appropriate tag, letting ordinary overload resolution select. The iterator category tags exist for this, and their inheritance provides the ordering — a random access tag matches the random access overload exactly and a forward overload only by derived-to-base conversion, so the specific one wins. It is more readable than `enable_if` and composes with inheritance, which is why the standard library still uses it. `if constexpr` replaced it for closed sets of cases, and constrained overloads replaced it where the set must stay open to extension.",
    },
    {
      question: "Why are concept error messages better than `enable_if` error messages?",
      answer:
        "Because the constraint is a named, first-class thing the compiler can talk about. A failed `enable_if` ends with `no type named 'type' in 'struct std::enable_if<false, ...>'` — a description of the mechanism, requiring the reader to work backwards from a missing member typedef to the fact that their type was not integral. A failed concept says `constraints not satisfied`, names the concept, and reports which part of it failed, such as `no operand of the disjunction is satisfied` pointing at the `||` in the definition. Both reject the same call; only one explains itself in the vocabulary the author used.",
    },
  ],
  takeaways: [
    "SFINAE removes a candidate whose *signature* becomes invalid, instead of erroring",
    "Only the immediate context is soft — an error in the function body is always hard",
    "`enable_if<Cond, T>` has a member `type` only when `Cond` is true; its absence discards the candidate",
    "Of the three positions, a defaulted template parameter is the least damaging",
    "SFINAE removes candidates but never ranks them, so conditions must be mutually exclusive",
    "`void_t` maps valid types to `void`, so an invalid one discards a partial specialisation",
    "`declval<T>()` names a value of type `T` in unevaluated contexts, with no constructor needed",
    "Tag dispatch overloads on empty tag types and uses tag inheritance for ordering",
    "`if constexpr` replaces tag dispatch for closed sets; constrained overloads for open ones",
    "`enable_if` failures report a missing member typedef; concept failures name the constraint",
    "Do not half-convert a header — mixing `enable_if` and constrained overloads is worse than either",
  ],
  status: "available",
};
