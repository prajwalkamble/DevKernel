import type { Lesson } from "@/content/types";

export const perfectForwardingLesson: Lesson = {
  id: "cpp-perfect-forwarding",
  slug: "forwarding-references-and-perfect-forwarding",
  moduleSlug: "modern-cpp-idioms",
  title: "Forwarding References, Perfect Forwarding & std::forward",
  summary:
    "How one function template accepts lvalues and rvalues and passes each on unchanged. Reference collapsing, the difference between `std::move` and `std::forward`, and a relay function measured losing a move because it forgot one call.",
  estimatedMinutes: 35,
  objectives: [
    "Distinguish a forwarding reference from an rvalue reference",
    "State the reference collapsing rules and why they exist",
    "Explain what `std::forward` does and how it differs from `std::move`",
    "Write a correct forwarding wrapper",
    "Recognise when forwarding is the wrong tool",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "The problem forwarding solves",
      body: [
        "Write a wrapper that passes its argument to another function, and you immediately hit a wall. Take it by `const T&` and you can never move out of it. Take it by value and you copy. Take it by `T&&` and lvalues will not bind. **Overloading on every combination means 2ⁿ functions for n parameters.**",
        "**A forwarding reference solves it with one signature.** `template <typename T> void relay(T&& x)` binds to anything — lvalues, rvalues, const, non-const — and, thanks to the deduction rule from module 7, **`T` records which it was**: an lvalue argument deduces `T = U&`, an rvalue deduces `T = U`.",
        "But binding is only half. **Inside the function, `x` is a named variable, and a named variable is an lvalue** regardless of what was passed. So `relay` that simply calls `target(x)` always passes an lvalue, and the caller's rvalue-ness is lost.",
        "**`std::forward<T>(x)` restores it.** It is a conditional cast: if `T` deduced as an lvalue reference it does nothing, and if `T` deduced as a plain type it casts to an rvalue. That is the whole mechanism, and the example below shows the one-line difference it makes.",
      ],
      examples: [
        {
          id: "forward-vs-not",
          title: "The same relay, with and without the cast",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <utility>

struct Probe {
    std::string tag;
    explicit Probe(std::string t) : tag(std::move(t)) {}
    Probe(const Probe& o) : tag(o.tag) { std::cout << "    COPY\\n"; }
    Probe(Probe&& o) noexcept : tag(std::move(o.tag)) { std::cout << "    MOVE\\n"; }
};

void sink(Probe) { std::cout << "  sink(Probe)  [by value]\\n"; }

// Overloads distinguish lvalue from rvalue.
void target(Probe&)       { std::cout << "  target(Probe&)       [lvalue]\\n"; }
void target(const Probe&) { std::cout << "  target(const Probe&) [const lvalue]\\n"; }
void target(Probe&&)      { std::cout << "  target(Probe&&)      [rvalue]\\n"; }

// WITHOUT forwarding: x is a named variable, so it is an lvalue.
template <typename T>
void relayBad(T&& x) { target(x); }

// WITH forwarding: the value category is restored.
template <typename T>
void relayGood(T&& x) { target(std::forward<T>(x)); }

int main() {
    Probe lv{"lvalue"};
    const Probe clv{"const lvalue"};

    std::cout << "relayBad:\\n";
    std::cout << " from lvalue:       "; relayBad(lv);
    std::cout << " from const lvalue: "; relayBad(clv);
    std::cout << " from rvalue:       "; relayBad(Probe{"rv"});

    std::cout << "\\nrelayGood:\\n";
    std::cout << " from lvalue:       "; relayGood(lv);
    std::cout << " from const lvalue: "; relayGood(clv);
    std::cout << " from rvalue:       "; relayGood(Probe{"rv"});

    std::cout << "\\nwhat move actually changes:\\n";
    Probe a{"a"};
    std::cout << "  sink(a)            -> "; sink(a);
    std::cout << "  sink(std::move(a)) -> "; sink(std::move(a));
}`,
          output: `relayBad:
 from lvalue:         target(Probe&)       [lvalue]
 from const lvalue:   target(const Probe&) [const lvalue]
 from rvalue:         target(Probe&)       [lvalue]

relayGood:
 from lvalue:         target(Probe&)       [lvalue]
 from const lvalue:   target(const Probe&) [const lvalue]
 from rvalue:         target(Probe&&)      [rvalue]

what move actually changes:
  sink(a)            ->     COPY
  sink(Probe)  [by value]
  sink(std::move(a)) ->     MOVE
  sink(Probe)  [by value]`,
          explanation:
            "**One line differs between the two relays, and one row differs in the output.** `relayBad(Probe{\"rv\"})` selected `target(Probe&)` — the rvalue was passed in, bound to the forwarding reference correctly, and then *demoted to an lvalue* because `x` is a named variable inside the function. For a real type that means a copy where a move was available. `relayGood` restored it, and only the rvalue row changed, which is exactly the point: forwarding is a no-op for lvalues and matters only when something movable was passed.",
        },
      ],
    },
    {
      id: "collapsing",
      heading: "Reference collapsing",
      body: [
        "You cannot write a reference to a reference in C++, but template substitution can produce one. **Reference collapsing is the rule that resolves it**, and it is what makes `T&&` work at all.",
        "**An lvalue reference anywhere wins.** `T& &`, `T& &&` and `T&& &` all collapse to `T&`. Only `T&& &&` gives `T&&`.",
        "Follow it through for `template <typename T> void f(T&& x)`:",
        "**Passed an lvalue `int`**: `T` deduces as `int&`, the parameter is `int& &&`, which collapses to `int&`. So `x` is an lvalue reference.",
        "**Passed an rvalue `int`**: `T` deduces as `int`, the parameter is `int&&`. So `x` is an rvalue reference.",
        "**`std::forward<T>(x)` is then just `static_cast<T&&>(x)`.** With `T = int&` that is `static_cast<int& &&>` = `static_cast<int&>` — an lvalue, no change. With `T = int` it is `static_cast<int&&>` — an rvalue. One cast, two behaviours, decided entirely by what `T` deduced as.",
        "**This is why `std::forward` always needs its explicit template argument.** `std::forward(x)` cannot work: the information about the original value category lives in `T`, not in `x`, so it must be spelled out. `std::move(x)` needs no argument because it casts unconditionally.",
      ],
      examples: [
        {
          id: "collapsing-rules",
          title: "The collapsing rules, and the two hazards of `std::move`",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <type_traits>
#include <utility>

int main() {
    std::cout << std::boolalpha;
    using L = int&;
    using R = int&&;

    std::cout << "int&  &&  is int&  : " << std::is_same_v<L&&, int&>  << '\\n';
    std::cout << "int&& &&  is int&& : " << std::is_same_v<R&&, int&&> << '\\n';
    std::cout << "int&& &   is int&  : " << std::is_same_v<R&,  int&>  << '\\n';

    std::cout << "\\nstd::move always casts to rvalue;\\n"
                 "std::forward casts to rvalue ONLY IF T deduced as non-reference.\\n";

    // Hazard 1: using a moved-from value.
    std::string s = "some reasonably long string that will not fit in SSO";
    std::string t = std::move(s);
    std::cout << "\\nafter std::move, source size = " << s.size()
              << " (valid but unspecified -- do not rely on it)\\n";
    std::cout << "destination = " << t.substr(0, 20) << "...\\n";

    // Hazard 2: std::move on a const object silently COPIES.
    const std::string c = "const string, long enough to matter for allocation";
    std::string d = std::move(c);      // binds to const&, so this copies
    std::cout << "\\nmoving a const object copies instead: source size still "
              << c.size() << '\\n';
}`,
          output: `int&  &&  is int&  : true
int&& &&  is int&& : true
int&& &   is int&  : true

std::move always casts to rvalue;
std::forward casts to rvalue ONLY IF T deduced as non-reference.

after std::move, source size = 0 (valid but unspecified -- do not rely on it)
destination = some reasonably long...

moving a const object copies instead: source size still 50`,
          explanation:
            "**The last block is the quietest bug in this lesson.** `std::move(c)` on a `const std::string` produces a `const std::string&&`, which cannot bind to the move constructor's `std::string&&` parameter — so overload resolution falls back to the copy constructor and you get a silent copy. No warning, no error, just the performance you were trying to avoid. **Never make a member or a local `const` if you intend to move out of it.** The moved-from `s` reporting size 0 is libstdc++'s behaviour, not a guarantee: the standard says only *valid but unspecified*.",
        },
      ],
      pitfalls: [
        {
          title: "`T&&` is only a forwarding reference when `T` is deduced right there",
          body: "`template <typename T> void f(T&& x)` is a forwarding reference. `template <typename T> void f(std::vector<T>&& v)` is **not** — `T` is deduced from the element type, not from the reference, so this is a plain rvalue reference that rejects lvalues. Nor is `void f(Widget&& w)` in a non-template. And inside a class template, `template <typename T> class C { void f(T&& x); }` is not one either, because `T` was fixed when the class was instantiated, not deduced at the call. The rule is precise: the form must be exactly `T&&` where that same `T` is being deduced from this parameter.",
        },
      ],
    },
    {
      id: "using-it",
      heading: "Writing a forwarding wrapper",
      body: [
        "The complete pattern, as used by `make_unique`, `emplace_back` and every factory in the standard library:",
        "**Take `Args&&... args`**, forward with **`std::forward<Args>(args)...`**, and return **`decltype(auto)`** if the wrapped call's return type must be preserved exactly.",
        "**Forward each argument exactly once.** `std::forward` may leave the object moved-from, so using it twice means the second use sees a hollowed-out object. If you need a value twice, forward on the last use only.",
        "**`std::forward` belongs only in a function taking a forwarding reference.** Using it on an ordinary parameter is meaningless at best. Conversely **use `std::move`, not `std::forward`, on an rvalue reference parameter** — `void f(Widget&& w)` should call `std::move(w)`, since there is no deduced `T` and nothing conditional about it.",
        "**Constrain greedy forwarding constructors.** A class with `template <typename... Ts> C(Ts&&...)` has a constructor matching anything, including a non-const `C&`, so it beats the copy constructor for non-const lvalues. Constrain it with a concept — `requires (!std::same_as<std::remove_cvref_t<T>, C>)` — as module 7 lesson 4 warned.",
      ],
      examples: [
        {
          id: "wrapper-run",
          title: "Forwarding into a container, and preserving a returned reference",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <utility>
#include <vector>

struct Payload {
    std::string data;
    explicit Payload(std::string d) : data(std::move(d)) {}
    Payload(const Payload& o) : data(o.data) { std::cout << "    COPY\\n"; }
    Payload(Payload&& o) noexcept : data(std::move(o.data)) {
        std::cout << "    MOVE\\n";
    }
};

class Queue {
public:
    Queue() { items_.reserve(8); }        // avoid reallocation noise

    // Perfect forwarding into the container: constructed in place.
    template <typename... Args>
    void emplace(Args&&... args) {
        items_.emplace_back(std::forward<Args>(args)...);
    }
    std::size_t size() const { return items_.size(); }

private:
    std::vector<Payload> items_;
};

// A wrapper preserving the exact return type and value category.
template <typename F, typename... Args>
decltype(auto) timed(F&& f, Args&&... args) {
    std::cout << "  [before]\\n";
    return std::forward<F>(f)(std::forward<Args>(args)...);
}

int main() {
    Queue q;

    std::cout << "emplace from constructor args (no Payload exists yet):\\n";
    q.emplace(std::string{"built in place"});

    std::cout << "emplace from an lvalue Payload (must copy):\\n";
    Payload p{"existing"};
    q.emplace(p);

    std::cout << "emplace from an rvalue Payload (moves):\\n";
    q.emplace(std::move(p));

    std::cout << "queue size = " << q.size() << '\\n';

    std::cout << "\\ndecltype(auto) preserves a returned reference:\\n";
    std::vector<int> v{1, 2, 3};
    auto& first = timed([](std::vector<int>& c) -> int& { return c[0]; }, v);
    first = 99;
    std::cout << "  v[0] after writing through the result = " << v[0] << '\\n';
}`,
          output: `emplace from constructor args (no Payload exists yet):
emplace from an lvalue Payload (must copy):
    COPY
emplace from an rvalue Payload (moves):
    MOVE
queue size = 3

decltype(auto) preserves a returned reference:
  [before]
  v[0] after writing through the result = 99`,
          explanation:
            "**The first `emplace` printed nothing at all** — no copy, no move — because the `Payload` was constructed directly in the vector's storage from a `std::string`, which is the whole point of forwarding constructor arguments rather than objects. The lvalue copied and the rvalue moved, each exactly once. And `decltype(auto)` on `timed` preserved the `int&` the lambda returned, so writing through the result reached the vector — with plain `auto` that assignment would have modified a discarded temporary.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a forwarding reference and how does it differ from an rvalue reference?",
      answer:
        "A parameter of the exact form `T&&` where `T` is a template parameter deduced from that same parameter. It binds to anything — lvalues, rvalues, const and non-const — and `T` records which: an lvalue argument deduces `T = U&`, an rvalue deduces `T = U`. An rvalue reference is `Widget&&` in a non-template, or `std::vector<T>&&` in a template where `T` comes from the element type, or `T&&` in a class template where `T` was fixed at instantiation — all of those bind only to rvalues. The distinction matters because only a genuine forwarding reference should be passed to `std::forward`.",
    },
    {
      question: "What are the reference collapsing rules and why do they exist?",
      answer:
        "You cannot write a reference to a reference directly, but template substitution can produce one, so the language defines how to resolve it: an lvalue reference anywhere wins. `T& &`, `T& &&` and `T&& &` all collapse to `T&`; only `T&& &&` gives `T&&`. That is what makes forwarding references work — passing an lvalue deduces `T = int&`, making the parameter `int& &&` which collapses to `int&`, while passing an rvalue deduces `T = int` and the parameter stays `int&&`. The same rule makes `std::forward<T>(x)`, which is just `static_cast<T&&>(x)`, a no-op for lvalues and a cast to rvalue otherwise.",
    },
    {
      question: "What is the difference between `std::move` and `std::forward`?",
      answer:
        "`std::move` is an unconditional cast to an rvalue — it always says \"treat this as movable\" and needs no template argument. `std::forward<T>` is a conditional cast that depends on what `T` deduced as: it yields an lvalue if `T` is an lvalue reference and an rvalue otherwise, and it requires the explicit `<T>` because the value-category information lives in `T`, not in the object. Use `std::move` on an ordinary rvalue reference parameter or when you are done with a local; use `std::forward` only in a function taking a genuine forwarding reference. Neither moves anything — both are casts, and the actual move happens in whatever constructor or assignment they select.",
    },
    {
      question: "Why does a wrapper need `std::forward` at all, if the parameter is already `T&&`?",
      answer:
        "Because inside the function the parameter is a *named variable*, and a named variable is an lvalue regardless of what was passed. So a relay that calls `target(x)` always passes an lvalue, and the caller's rvalue-ness is lost — a movable argument gets copied. Binding correctly and passing on correctly are two separate problems, and `T&&` solves only the first. `std::forward<T>(x)` restores the original category. Measurably, `relayBad(Probe{})` selects the `Probe&` overload while `relayGood(Probe{})` selects `Probe&&`.",
    },
    {
      question: "What happens if you call `std::move` on a `const` object?",
      answer:
        "It compiles and silently copies. `std::move(c)` on a `const std::string` produces a `const std::string&&`, which cannot bind to the move constructor's non-const `std::string&&` parameter, so overload resolution falls back to the copy constructor taking `const std::string&`. There is no warning and no error — just the copy you were trying to avoid. The lesson is not to declare members or locals `const` if you intend to move out of them, and to be suspicious of `std::move` on anything whose constness you have not checked.",
    },
    {
      question: "Why must you forward each argument only once?",
      answer:
        "Because forwarding may result in a move, leaving the source object valid but unspecified. Forwarding the same parameter twice means the second use operates on a hollowed-out object — typically an empty string or a null pointer. If a value is genuinely needed more than once, use it normally for the earlier uses and forward only on the last. The same discipline applies to `std::move`. It is the reason a forwarding wrapper should pass its pack through in exactly one call rather than fanning it out to several.",
    },
  ],
  takeaways: [
    "`T&&` with a deduced `T` is a forwarding reference and binds to anything",
    "`std::vector<T>&&`, `Widget&&` in a non-template, and `T&&` in a class template are not",
    "Reference collapsing: an lvalue reference anywhere wins; only `T&& &&` stays `T&&`",
    "Inside the function the parameter is a named variable, hence an lvalue — binding is not enough",
    "`std::forward<T>(x)` is `static_cast<T&&>(x)`: a no-op for lvalues, a cast to rvalue otherwise",
    "`std::forward` needs its explicit `<T>` because the category lives in `T`, not in `x`",
    "`std::move` is unconditional; use it on rvalue reference parameters, not `std::forward`",
    "Forward each argument exactly once — a forwarded object may be left moved-from",
    "`std::move` on a `const` object silently copies, because `const T&&` cannot bind to `T&&`",
    "A moved-from object is valid but unspecified — never rely on the observed state",
    "Use `decltype(auto)` on a wrapper so a returned reference stays a reference",
    "Constrain greedy forwarding constructors or they outcompete the copy constructor",
  ],
  status: "available",
};
