import type { Lesson } from "@/content/types";

export const noexceptLesson: Lesson = {
  id: "cpp-noexcept",
  slug: "noexcept-and-vector-growth",
  moduleSlug: "error-handling",
  title: "noexcept, Move Operations & Why vector's Growth Depends On It",
  summary:
    "One keyword that changes a library's behaviour rather than just documenting yours. Two classes identical but for `noexcept` on the move constructor, and a vector reallocation that moves in one case and copies in the other.",
  estimatedMinutes: 35,
  objectives: [
    "Say what `noexcept` promises and what happens when it is violated",
    "Explain why `vector` inspects the element's move constructor",
    "Mark the right functions `noexcept` and leave the rest alone",
    "Use conditional `noexcept` and the `noexcept` operator",
    "Explain why adding `noexcept` to an API is a breaking change",
  ],
  sections: [
    {
      id: "what-it-means",
      heading: "What `noexcept` promises",
      body: [
        "`noexcept` declares that a function will not let an exception escape. **It is not checked at compile time.** If one escapes anyway, `std::terminate` is called immediately — no unwinding, no handlers, exactly like the throwing destructor from lesson 1.",
        "That is a deliberately harsh contract, and it buys two things.",
        "**Code generation.** The compiler need not emit unwinding tables or cleanup paths for a `noexcept` function, which can make it smaller and occasionally faster. This effect is real but modest and is *not* the main reason to use the keyword.",
        "**Library behaviour.** This is the important one. **Standard library components inspect `noexcept` and choose different algorithms based on the answer.** The most consequential case is `std::vector`'s reallocation, which is the rest of this lesson.",
        "Note that `throw()` was the old spelling, deprecated in C++11 and removed in C++20. And **since C++17 `noexcept` is part of the function type**, so a `void(*)() noexcept` is a distinct type from `void(*)()` and converts one way only.",
      ],
      examples: [
        {
          id: "vector-growth",
          title: "One keyword, two moves against two copies",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <type_traits>
#include <vector>

// IDENTICAL except for one keyword on the move constructor.
struct WithNoexcept {
    std::string data;
    explicit WithNoexcept(std::string d) : data(std::move(d)) {}
    WithNoexcept(const WithNoexcept& o) : data(o.data) {
        std::cout << "    COPY\\n";
    }
    WithNoexcept(WithNoexcept&& o) noexcept : data(std::move(o.data)) {
        std::cout << "    move\\n";
    }
};

struct WithoutNoexcept {
    std::string data;
    explicit WithoutNoexcept(std::string d) : data(std::move(d)) {}
    WithoutNoexcept(const WithoutNoexcept& o) : data(o.data) {
        std::cout << "    COPY\\n";
    }
    WithoutNoexcept(WithoutNoexcept&& o) : data(std::move(o.data)) {
        std::cout << "    move\\n";
    }
};

template <typename T>
void grow(const char* label) {
    std::cout << label << '\\n';
    std::cout << "  is_nothrow_move_constructible = "
              << std::is_nothrow_move_constructible_v<T> << '\\n';

    std::vector<T> v;
    v.reserve(2);
    v.emplace_back("one");
    v.emplace_back("two");
    std::cout << "  -- now forcing a reallocation:\\n";
    v.emplace_back("three");
    std::cout << '\\n';
}

int main() {
    std::cout << std::boolalpha;
    grow<WithNoexcept>("WITH noexcept on the move constructor:");
    grow<WithoutNoexcept>("WITHOUT noexcept on the move constructor:");
}`,
          output: `WITH noexcept on the move constructor:
  is_nothrow_move_constructible = true
  -- now forcing a reallocation:
    move
    move

WITHOUT noexcept on the move constructor:
  is_nothrow_move_constructible = false
  -- now forcing a reallocation:
    COPY
    COPY`,
          explanation:
            "**The two classes differ by one keyword and the reallocation behaviour is completely different.** With `noexcept`, `vector` moved the existing elements into the new buffer. Without it, `vector` *copied* them — for `std::string` members that means a fresh allocation and a memcpy per element, on every growth. On a vector of a hundred thousand strings that is a hundred thousand avoidable allocations, caused by a missing keyword nobody would think to look for.",
        },
      ],
    },
    {
      id: "why-vector-cares",
      heading: "Why `vector` has to do this",
      body: [
        "`vector::push_back` provides the **strong** guarantee: if it throws, the vector is exactly as it was. Reallocation is where that becomes difficult.",
        "Reallocation means allocating a bigger buffer and transferring every existing element into it. Consider what happens if a transfer fails partway.",
        "**If the elements are copied**, the originals are still intact in the old buffer. `vector` frees the new buffer, leaves the old one in place, and rethrows — the vector is unchanged, and the strong guarantee holds.",
        "**If the elements are moved**, the ones already transferred have been *emptied out of the old buffer*. There is no way back: moving them back could throw again, and the originals no longer hold their values. The strong guarantee is unrecoverable.",
        "So `vector` uses `std::move_if_noexcept`: **move when the element's move constructor is `noexcept`, copy otherwise.** The trade is stated exactly — it will give up performance to keep a correctness guarantee, unless you promise the move cannot fail.",
        "**Marking your move operations `noexcept` is therefore not a micro-optimisation but a requirement** for any type that goes in a container. A type with an implicitly generated move constructor gets `noexcept` automatically if all its members' moves are, which is another argument for the rule of zero.",
      ],
      examples: [
        {
          id: "what-to-mark",
          title: "Which functions to mark, and the conditional form",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <type_traits>
#include <utility>
#include <vector>

template <typename T>
class Wrapper {
public:
    explicit Wrapper(T v) : value_(std::move(v)) {}

    // CONDITIONAL noexcept: nothrow exactly when T's move is nothrow.
    // Hard-coding 'noexcept' here would be a lie for a throwing T.
    Wrapper(Wrapper&& o) noexcept(std::is_nothrow_move_constructible_v<T>)
        : value_(std::move(o.value_)) {}

    Wrapper& operator=(Wrapper&& o)
        noexcept(std::is_nothrow_move_assignable_v<T>) {
        value_ = std::move(o.value_);
        return *this;
    }

    // Always mark: swap, and simple observers that cannot fail.
    friend void swap(Wrapper& a, Wrapper& b) noexcept(std::is_nothrow_swappable_v<T>) {
        using std::swap;
        swap(a.value_, b.value_);
    }

    const T& get() const noexcept { return value_; }

private:
    T value_;
};

struct ThrowingMove {
    std::string s;
    ThrowingMove(ThrowingMove&&) { }        // NOT noexcept
};

int main() {
    std::cout << std::boolalpha;

    // The noexcept OPERATOR asks whether an expression can throw.
    std::cout << "noexcept(std::string{})            = "
              << noexcept(std::string{}) << '\\n';

    std::cout << "\\nconditional noexcept propagates correctly:\\n";
    std::cout << "  Wrapper<std::string>   nothrow move = "
              << std::is_nothrow_move_constructible_v<Wrapper<std::string>> << '\\n';
    std::cout << "  Wrapper<ThrowingMove>  nothrow move = "
              << std::is_nothrow_move_constructible_v<Wrapper<ThrowingMove>> << '\\n';

    std::cout << "\\nand the compiler-generated ones follow their members:\\n";
    struct AllStandard { std::string a; std::vector<int> b; };
    std::cout << "  struct of string+vector nothrow move = "
              << std::is_nothrow_move_constructible_v<AllStandard> << '\\n';
}`,
          output: `noexcept(std::string{})            = true

conditional noexcept propagates correctly:
  Wrapper<std::string>   nothrow move = true
  Wrapper<ThrowingMove>  nothrow move = false

and the compiler-generated ones follow their members:
  struct of string+vector nothrow move = true`,
          explanation:
            "**`Wrapper` gets the answer right for both element types without you deciding.** Hard-coding `noexcept` on the move constructor would be a lie when `T` throws, and omitting it would forfeit moves when `T` is fine — the conditional form `noexcept(std::is_nothrow_move_constructible_v<T>)` propagates the truth. The last line is the rule-of-zero payoff: a struct of a `string` and a `vector` gets a `noexcept` move constructor from the compiler with nothing written at all.",
        },
      ],
      pitfalls: [
        {
          title: "Do not mark a function `noexcept` just because it does not throw today",
          body: "`noexcept` is part of your interface, and removing it later breaks callers who relied on it — a container may have chosen to move rather than copy, and generic code may have selected a different algorithm. Worse, a function marked `noexcept` that later needs to report an error has no way to do so without terminating the process. Mark the operations the standard library and the language actually care about — destructors (implicit), move constructor, move assignment, `swap`, and simple accessors that genuinely cannot fail — and leave the rest unmarked. Anything that allocates should generally not be `noexcept`, since `std::bad_alloc` is always possible.",
        },
      ],
    },
    {
      id: "operator-and-checking",
      heading: "The `noexcept` operator, and checking your work",
      body: [
        "**`noexcept` is two things with the same spelling.** As a *specifier* it goes on a declaration and makes a promise. As an *operator*, `noexcept(expr)`, it asks at compile time whether `expr` is declared not to throw, and yields a `bool` — without evaluating the expression.",
        "That is what makes conditional `noexcept` possible: `noexcept(noexcept(f()))` reads awkwardly and means \"this function is `noexcept` exactly when calling `f()` is\".",
        "**The type traits are the readable alternative** and are usually better: `std::is_nothrow_move_constructible_v<T>`, `std::is_nothrow_move_assignable_v<T>`, `std::is_nothrow_swappable_v<T>`, `std::is_nothrow_destructible_v<T>`.",
        "**Check your types with `static_assert`.** A one-line assertion in a header — `static_assert(std::is_nothrow_move_constructible_v<MyType>);` — catches the day someone adds a member whose move can throw and silently costs you every container reallocation. That is a genuinely worthwhile assertion to have in a performance-sensitive codebase, because nothing else will tell you.",
      ],
      examples: [
        {
          id: "static-assert-check",
          title: "Catching the regression at build time",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <type_traits>
#include <vector>

struct Session {
    std::string      id;
    std::vector<int> events;
    // No user-declared special members: the compiler generates a
    // noexcept move constructor because both members have one.
};

// A guard against future regressions. If somebody adds a member whose
// move can throw, the BUILD fails instead of the performance quietly dying.
static_assert(std::is_nothrow_move_constructible_v<Session>,
              "Session's move must stay noexcept or vector will copy it");
static_assert(std::is_nothrow_move_assignable_v<Session>);

// This is what a regression looks like.
struct Legacy {
    std::string name;
    Legacy(Legacy&& o) : name(std::move(o.name)) {}   // forgot noexcept
    Legacy& operator=(Legacy&&) { return *this; }
    Legacy() = default;
};

int main() {
    std::cout << std::boolalpha;
    std::cout << "Session nothrow-move : "
              << std::is_nothrow_move_constructible_v<Session> << '\\n';
    std::cout << "Legacy  nothrow-move : "
              << std::is_nothrow_move_constructible_v<Legacy> << '\\n';

    // The noexcept OPERATOR, used directly.
    Session s;
    std::cout << "\\nnoexcept(Session{std::move(s)}) = "
              << noexcept(Session{std::move(s)}) << '\\n';

    std::cout << "\\nadding this line would fail the build:\\n"
                 "  static_assert(std::is_nothrow_move_constructible_v<Legacy>);\\n";
}`,
          output: `Session nothrow-move : true
Legacy  nothrow-move : false

noexcept(Session{std::move(s)}) = true

adding this line would fail the build:
  static_assert(std::is_nothrow_move_constructible_v<Legacy>);`,
          explanation:
            "**`Session` declares no special members at all and gets a `noexcept` move for free**, because `std::string` and `std::vector` both have one — the rule of zero paying off again. `Legacy` hand-wrote its move operations and forgot the keyword, so every `vector<Legacy>` reallocation copies. The `static_assert` pair at namespace scope is the cheap defence: it costs nothing at runtime and turns a silent performance regression into a build failure with a message explaining why.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does `noexcept` actually promise, and what happens if it is violated?",
      answer:
        "It declares that no exception will escape the function. It is not checked at compile time — if one escapes, `std::terminate` is called immediately, with no unwinding and no chance for a handler, exactly like a throwing destructor. In exchange the compiler may omit unwinding tables and cleanup paths, which is a modest code-size and speed benefit, and — far more importantly — standard library components inspect it and select different algorithms depending on the answer. Since C++17 it is part of the function type, so `void(*)() noexcept` and `void(*)()` are distinct types.",
    },
    {
      question: "Why does `std::vector` care whether your move constructor is `noexcept`?",
      answer:
        "Because `push_back` provides the strong exception guarantee, and reallocation is where that is hard. If a transfer into the new buffer throws partway: with *copies*, the originals are intact in the old buffer, so vector frees the new one and rethrows with nothing changed. With *moves*, the already-transferred elements have been emptied out of the old buffer and there is no way back — moving them back could throw again. So `vector` uses `std::move_if_noexcept`: it moves when the element's move constructor is `noexcept` and copies otherwise, trading performance for the guarantee unless you promise the move cannot fail.",
    },
    {
      question: "What is the practical cost of forgetting `noexcept` on a move constructor?",
      answer:
        "Every `vector` reallocation copies instead of moving. For a type holding a `std::string` or a `std::vector`, each copy is a fresh allocation plus a memcpy, so growing a vector of a hundred thousand such objects performs a hundred thousand avoidable allocations. Two classes identical except for that keyword produce visibly different reallocation behaviour — moves in one case, copies in the other. It is invisible in profiling unless you know to look, which is why a `static_assert(std::is_nothrow_move_constructible_v<T>)` is worth adding to performance-sensitive types.",
    },
    {
      question: "Which functions should be marked `noexcept`?",
      answer:
        "The ones the language and library care about: move constructor, move assignment, `swap`, and simple observers that genuinely cannot fail. Destructors are implicitly `noexcept` already. Leave everything else unmarked — in particular anything that allocates, since `std::bad_alloc` is always possible. The reason to be conservative is that `noexcept` is part of your interface: removing it later breaks callers who relied on it, and a `noexcept` function that later needs to report an error has no way to do so except terminating. Mark what matters, not everything that happens not to throw today.",
    },
    {
      question: "What is conditional `noexcept` and when do you need it?",
      answer:
        "`noexcept(condition)` makes the promise depend on a compile-time boolean, typically a type trait — `Wrapper(Wrapper&&) noexcept(std::is_nothrow_move_constructible_v<T>)`. It is essential in templates, where whether the operation can throw depends on the template argument: hard-coding `noexcept` would be a lie for a throwing `T`, and omitting it would forfeit moves for well-behaved ones. Note that `noexcept` is also an *operator*, `noexcept(expr)`, which asks at compile time whether an expression is declared not to throw without evaluating it — hence the doubled `noexcept(noexcept(f()))` form.",
    },
    {
      question: "How does a compiler-generated move constructor get its `noexcept` specification?",
      answer:
        "It is deduced: the implicitly generated move constructor is `noexcept` if and only if moving every base and member is. So a struct whose members are `std::string` and `std::vector` gets a `noexcept` move constructor with nothing written at all, since both of those have one. That is another concrete argument for the rule of zero — hand-writing move operations is where the keyword gets forgotten, and letting the compiler generate them gets the specification right automatically.",
    },
  ],
  takeaways: [
    "`noexcept` is a promise, not a check — violating it calls `std::terminate` with no unwinding",
    "Its main value is that library components inspect it and choose different algorithms",
    "`vector` reallocation moves only if the element's move constructor is `noexcept`, else it copies",
    "The reason is the strong guarantee: a failed move cannot be undone, a failed copy can",
    "Forgetting the keyword makes every reallocation copy — invisible unless you look",
    "Mark move constructor, move assignment, `swap` and infallible observers; leave the rest",
    "Do not mark anything that allocates — `bad_alloc` is always possible",
    "`noexcept` is part of the function type since C++17, and removing it is a breaking change",
    "Conditional `noexcept(trait)` is essential in templates so the promise matches the type",
    "`noexcept(expr)` is also an operator, asking whether an expression can throw",
    "A compiler-generated move is `noexcept` iff every base and member's move is",
    "`static_assert(std::is_nothrow_move_constructible_v<T>)` turns a silent regression into a build failure",
  ],
  status: "available",
};
