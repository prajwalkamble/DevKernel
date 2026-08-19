import type { Lesson } from "@/content/types";

export const stdMoveLesson: Lesson = {
  id: "cpp-std-move",
  slug: "std-move-and-moved-from",
  moduleSlug: "copy-move-rule-of-five",
  title: "std::move & What a Moved-From Object Is",
  summary:
    "`std::move` does not move anything — it is a cast, and understanding that explains every surprising thing about it. What you are allowed to do with a moved-from object, why `std::move` on a `const` silently copies, and the sink-parameter idiom.",
  estimatedMinutes: 30,
  objectives: [
    "Explain what `std::move` actually compiles to",
    "State precisely what is guaranteed about a moved-from object",
    "Explain why `std::move` on a `const` object silently produces a copy",
    "Use the sink-parameter idiom instead of duplicate overloads",
    "Avoid moving in a `return` statement, and say why",
  ],
  sections: [
    {
      id: "a-cast",
      heading: "std::move is a cast",
      body: [
        "The name is the worst in the standard library. **`std::move` moves nothing.** It generates no code at all.",
        "It is a cast to an rvalue reference. `std::move(x)` takes any expression and produces an **xvalue** referring to the same object — which, by lesson 2, is the category that `T&&` binds to.",
        "So `std::move` is a *request*, not an action: it changes which overload gets selected. The actual transfer happens inside whichever move constructor or move assignment operator receives the result. If no move operation exists, overload resolution falls back to the copy, and you get a copy — silently.",
        "Reading it as **\"I am finished with this, you may take its contents\"** is much more accurate than reading it as a verb.",
      ],
      examples: [
        {
          id: "move-is-a-cast",
          title: "Writing it yourself",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <type_traits>
#include <utility>

// This is essentially all std::move is.
template <typename T>
constexpr std::remove_reference_t<T>&& my_move(T&& value) noexcept {
    return static_cast<std::remove_reference_t<T>&&>(value);
}

void sink(std::string&&) { std::cout << "  bound to T&&\\n"; }

int main() {
    std::string s = "hi";
    std::cout << "my_move:  "; sink(my_move(s));
    std::cout << "std::move:"; sink(std::move(s));
}`,
          output: `my_move:    bound to T&&
std::move:  bound to T&&`,
          explanation:
            "Six lines, one `static_cast`, no runtime cost. `std::remove_reference_t<T>` strips any reference from the deduced type so the result is always `T&&` and never `T& &&`. **The `T&&` parameter here is a forwarding reference, not an rvalue reference** — that distinction is what lets it accept anything, and module 9 covers it alongside `std::forward`.",
        },
      ],
    },
    {
      id: "consequences",
      heading: "Five consequences of it being a cast",
      body: [
        "Every surprising thing about `std::move` follows from this one fact.",
        "**A bare `std::move(x);` statement does nothing.** No constructor or assignment receives the result, so no transfer occurs. GCC's `[[nodiscard]]` on `std::move` warns about exactly this.",
        "**`std::move` on a `const` object silently copies.** The cast produces `const T&&`, which will not bind to `T&&` (that would let you modify a const object) but *will* bind to `const T&`. Overload resolution therefore selects the copy constructor, and nothing tells you.",
        "**`std::move` on a type with no move operations copies.** Same mechanism: the fallback is the copy.",
        "**A named `T&&` parameter is an lvalue in the body**, from lesson 2, so passing it on copies unless you write `std::move` again.",
        "**Moving from a small type is not an optimisation**, as measured in lesson 3.",
      ],
      examples: [
        {
          id: "move-consequences",
          title: "All five, run",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <utility>
#include <vector>

int main() {
    // 1. std::move alone does nothing at all.
    std::string a = "unchanged";
    (void)std::move(a);   // no constructor or assignment receives it
    std::cout << "1. after bare std::move(a): '" << a << "'\\n";

    // 2. The transfer happens in the constructor that receives the rvalue.
    std::string b = "stolen";
    std::string c = std::move(b);
    std::cout << "2. c='" << c << "'  b='" << b << "' (valid but unspecified)\\n";

    // 3. std::move on a const object silently copies.
    const std::string frozen = "frozen";
    std::string d = std::move(frozen);   // const string&& -> binds to const string&
    std::cout << "3. d='" << d << "'  frozen='" << frozen << "' (still intact)\\n";

    // 4. A moved-from object is safe to assign to and reuse.
    b = "reused";
    std::cout << "4. b reassigned: '" << b << "'\\n";

    // 5. Moving a vector empties it.
    std::vector<int> v{1, 2, 3};
    std::vector<int> w = std::move(v);
    std::cout << "5. w.size()=" << w.size() << "  v.size()=" << v.size() << '\\n';
}`,
          output: `1. after bare std::move(a): 'unchanged'
2. c='stolen'  b='' (valid but unspecified)
3. d='frozen'  frozen='frozen' (still intact)
4. b reassigned: 'reused'
5. w.size()=3  v.size()=0`,
          explanation:
            "**Line 3 is the dangerous one.** `frozen` is still `\"frozen\"` — the move you asked for silently became a copy, with no warning at any optimisation level. Marking things `const` is normally an unambiguous good; this is the one place where it quietly costs you performance. If you intend to move out of something, do not make it `const`. Note the `(void)` on line 1: without it, GCC warns `ignoring return value of 'std::move' ... declared with attribute 'nodiscard'`, which is a helpful catch.",
        },
      ],
    },
    {
      id: "moved-from",
      heading: "What you may do with a moved-from object",
      body: [
        "The standard's rule for library types is precise and worth quoting accurately: a moved-from object is left in a **valid but unspecified state**.",
        "**Valid** means the object's invariants still hold. You may destroy it, and you may assign a new value to it. Those two operations are always safe.",
        "**Unspecified** means you may not assume anything about its *value*. In practice a moved-from `std::string` is usually empty and a moved-from `std::vector` always ends up empty, but neither is guaranteed by the standard, and relying on it is relying on your implementation.",
        "So the rule for using one: **assign to it, or destroy it. Anything else requires first asking what its state is.**",
        "Calling `size()` or `empty()` is allowed — those have no preconditions — but the answer is unspecified, so branching on it is a bug waiting for a different standard library. Calling `front()` on a moved-from vector is undefined behaviour, because `front()` has a precondition the object may no longer meet.",
        "**For your own types, aim for a specific documented state rather than merely a valid one.** \"Empty\" is a good choice: it is easy to implement, easy to test, and callers can rely on it.",
      ],
      examples: [
        {
          id: "moved-from-state",
          title: "Safe, allowed-but-unwise, and undefined",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <utility>
#include <vector>

int main() {
    std::vector<int> v{1, 2, 3};
    std::vector<int> stolen = std::move(v);

    // ALWAYS SAFE: assign a new value.
    v = {7, 8};
    std::cout << "reassigned: " << v.size() << '\\n';

    std::string s = "some text";
    std::string taken = std::move(s);

    // ALLOWED but the answer is unspecified — do not branch on it.
    std::cout << "moved-from string size: " << s.size()
              << " (unspecified, happens to be 0)\\n";

    // ALWAYS SAFE: clear() has no precondition, and puts it in a known state.
    s.clear();
    s = "definitely known now";
    std::cout << "after clear + assign: '" << s << "'\\n";

    // UNDEFINED: front() requires a non-empty container.
    std::vector<int> empty_after_move{1, 2};
    std::vector<int> sink2 = std::move(empty_after_move);
    // std::cout << empty_after_move.front();   // UB: precondition violated
    std::cout << "sink2.size()=" << sink2.size() << '\\n';
}`,
          output: `reassigned: 2
moved-from string size: 0 (unspecified, happens to be 0)
after clear + assign: 'definitely known now'
sink2.size()=2`,
          explanation:
            "**\"happens to be 0\" is doing real work in that message.** On libstdc++ a moved-from `std::string` is empty; the standard does not promise it, and code that assumes it is portable only by luck. **`clear()` is the escape hatch** — it has no preconditions and puts the object into a state you can rely on, which is what to reach for when you genuinely need to reuse a moved-from object rather than just reassign it.",
        },
      ],
      pitfalls: [
        {
          title: "Moving twice from the same object is a logic bug, not a crash",
          body: "`sink(std::move(x)); sink(std::move(x));` compiles and runs. The second call moves from an already-gutted object, so it silently receives an empty one. There is no diagnostic, because the operation is well defined — the object is valid, just not what you meant. This is the strongest argument for keeping `std::move` calls close to where the variable goes out of scope: the further apart the move and the last use are, the easier it is for someone to add a use in between. Clang's `-Wconsumed` and clang-tidy's `bugprone-use-after-move` catch many cases.",
        },
      ],
    },
    {
      id: "sink-parameter",
      heading: "The sink parameter",
      body: [
        "Lesson 2 showed overloading a setter on `const T&` and `T&&` to avoid a copy for callers passing temporaries. That works, and it does not scale: two parameters need four overloads, three need eight.",
        "**The sink-parameter idiom collapses them into one: take the argument by value, then move from it.**",
        "The reasoning is that you were going to end up with your own copy either way. Taking by value means the *caller's* choice of lvalue or rvalue decides how that parameter is initialised — copied from an lvalue, moved from an rvalue — and then you move it into place. So an lvalue caller pays copy + move, and an rvalue caller pays move + move.",
        "That is one extra move compared to the two-overload version. For any type where moving is cheap it is an excellent trade: one function instead of 2^N, and the caller never pays a needless copy.",
        "**When not to use it:** when moves are not cheap for the type, when the function might not store the value at all (you have then forced a copy for nothing), and when you need to assign into an existing buffer that could be reused — `operator=` on a container can often avoid an allocation by copying into existing capacity, which taking by value throws away.",
      ],
      examples: [
        {
          id: "sink-idiom",
          title: "Two overloads, or one by-value parameter",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <utility>

struct Tracked {
    std::string data;
    Tracked(const char* d) : data(d) {}
    Tracked(const Tracked& o) : data(o.data) { std::cout << "C"; }
    Tracked(Tracked&& o) noexcept : data(std::move(o.data)) { std::cout << "M"; }
    Tracked& operator=(const Tracked& o) { data = o.data; std::cout << "c"; return *this; }
    Tracked& operator=(Tracked&& o) noexcept {
        data = std::move(o.data); std::cout << "m"; return *this;
    }
};

class TwoOverloads {
public:
    void set(const Tracked& v) { value_ = v; }
    void set(Tracked&& v)      { value_ = std::move(v); }
private:
    Tracked value_{""};
};

class SinkParameter {
public:
    void set(Tracked v) { value_ = std::move(v); }   // one function
private:
    Tracked value_{""};
};

int main() {
    Tracked lvalue{"keep me"};

    std::cout << "two overloads, lvalue: "; { TwoOverloads t; t.set(lvalue); }         std::cout << '\\n';
    std::cout << "two overloads, rvalue: "; { TwoOverloads t; t.set(Tracked{"tmp"}); } std::cout << '\\n';
    std::cout << "sink param,   lvalue:  "; { SinkParameter s; s.set(lvalue); }        std::cout << '\\n';
    std::cout << "sink param,   rvalue:  "; { SinkParameter s; s.set(Tracked{"tmp"}); }std::cout << '\\n';
    std::cout << "C/M = copy/move construct,  c/m = copy/move assign\\n";
}`,
          output: `two overloads, lvalue: c
two overloads, rvalue: m
sink param,   lvalue:  Cm
sink param,   rvalue:  m
C/M = copy/move construct,  c/m = copy/move assign`,
          explanation:
            "**The rvalue cases are identical — one move-assign each.** The lvalue case costs the sink version one extra operation: `Cm` (copy into the parameter, then move it into place) against a single `c`. That is the price of collapsing the overloads. Note the rvalue sink case shows only `m`, with no construction at all: the temporary was constructed **directly into the parameter** by guaranteed elision, so nothing was moved into it. **That elision is why the idiom is as cheap as it is**, and it is the subject of the next lesson.",
        },
      ],
    },
    {
      id: "return",
      heading: "Do not move in a return statement",
      body: [
        "A common instinct after learning about moves is to write `return std::move(local);`. **This is almost always wrong and makes things slower.**",
        "Returning a local by value is already handled: the compiler either constructs the value directly in the caller's storage (elision, next lesson) or, failing that, treats the local as an rvalue automatically and moves it. Both are at least as good as an explicit move.",
        "Writing `std::move` explicitly **defeats the first option**. The returned expression is now an xvalue rather than a name, so NRVO cannot apply, and you have forced a move where zero operations were possible.",
        "GCC and Clang warn about this under `-Wpessimizing-move`, part of `-Wall`, with the message *moving a local object in a return statement prevents copy elision*.",
        "The rule: **`return local;`** — never `return std::move(local);`. The one exception is returning a *member* of a local, or returning a parameter, where elision does not apply anyway.",
      ],
      examples: [
        {
          id: "pessimizing-move",
          title: "The warning, and what it costs",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <utility>

struct Tracer {
    Tracer() { std::cout << "  ctor\\n"; }
    Tracer(const Tracer&) { std::cout << "  COPY\\n"; }
    Tracer(Tracer&&) noexcept { std::cout << "  MOVE\\n"; }
};

Tracer good() {
    Tracer t;
    return t;                  // NRVO: constructed directly in the caller
}

Tracer bad() {
    Tracer t;
    return std::move(t);       // forces a move, defeats NRVO
}

int main() {
    std::cout << "return t:\\n";            { Tracer a = good(); }
    std::cout << "return std::move(t):\\n"; { Tracer b = bad(); }
}`,
          output: `warning: moving a local object in a return statement prevents copy elision
         [-Wpessimizing-move]
   17 |     return std::move(t);       // forces a move, defeats NRVO
      |            ^~~~~~~~~~~~
note: remove 'std::move' call

return t:
  ctor
return std::move(t):
  ctor
  MOVE`,
          explanation:
            "**`good()` performed one construction. `bad()` performed a construction and a move.** The \"optimisation\" made it strictly worse, and the compiler said so by name. This is one of the clearest cases in C++ where writing less code produces faster code — and the warning is on by default under `-Wall`, so you will be told.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does `std::move` actually do?",
      answer:
        "Nothing at runtime — it is a `static_cast` to an rvalue reference, producing an xvalue that refers to the same object. It generates no code. Its only effect is on overload resolution: it makes the expression bind to a `T&&` parameter, so a move constructor or move assignment operator is selected instead of the copy. The transfer is performed by that operation, not by `std::move`. Reading it as \"I am finished with this, you may take its contents\" is more accurate than reading it as a verb.",
    },
    {
      question: "What is guaranteed about a moved-from object?",
      answer:
        "For standard library types, it is left in a *valid but unspecified* state. Valid means its invariants hold, so it can always be destroyed and always be assigned a new value. Unspecified means you may not assume anything about its value — a moved-from `std::string` is empty on libstdc++, but that is not required by the standard. So: assign to it or destroy it. Calling `size()` is allowed but the answer is unspecified; calling `front()` on a moved-from vector is undefined behaviour, because `front()` has a precondition the object may no longer satisfy.",
    },
    {
      question: "Why does `std::move` on a `const` object silently copy?",
      answer:
        "The cast produces `const T&&`. That cannot bind to a `T&&` parameter, since that would permit modifying a const object, but it binds happily to `const T&` — so overload resolution selects the copy constructor. There is no warning at any optimisation level. It is the one situation where marking something `const` quietly costs performance, so if you intend to move out of a variable, do not declare it `const`.",
    },
    {
      question: "What is the sink-parameter idiom and what does it cost?",
      answer:
        "Taking a parameter by value and then `std::move`-ing it into place, instead of writing separate `const T&` and `T&&` overloads. An lvalue caller pays a copy into the parameter plus a move out of it; an rvalue caller pays only moves. That is one extra move compared with the two-overload version, in exchange for one function instead of 2^N as parameters multiply. Avoid it when moves are not cheap for the type, when the function might not store the value, and in `operator=` where assigning into existing capacity could have avoided an allocation entirely.",
    },
    {
      question: "Why should you not write `return std::move(local);`?",
      answer:
        "Because it makes the code slower. Returning a local by value already gets elision where possible, and where it is not the compiler treats the local as an rvalue and moves automatically. Writing `std::move` turns the returned expression into an xvalue rather than a name, which disqualifies NRVO — so you force a move where zero operations were possible. GCC and Clang warn under `-Wpessimizing-move`, part of `-Wall`: *moving a local object in a return statement prevents copy elision*. Write `return local;`.",
    },
  ],
  takeaways: [
    "`std::move` is a `static_cast` to `T&&` — it moves nothing and generates no code",
    "The transfer happens in the move constructor or assignment that receives the result",
    "A bare `std::move(x);` statement does nothing; `std::move` is `[[nodiscard]]` so GCC warns",
    "`std::move` on a `const` object binds to `const T&` and silently copies — no warning",
    "A moved-from object is valid but unspecified: always safe to destroy or assign to, nothing else",
    "Moving twice from the same object compiles, runs, and silently gives you an empty one",
    "The sink idiom — by value then `std::move` — replaces 2^N overloads for one extra move",
    "Never `return std::move(local);` — it defeats NRVO, and `-Wpessimizing-move` says so",
  ],
  status: "available",
};
