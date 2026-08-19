import type { Lesson } from "@/content/types";

export const stdFunctionLesson: Lesson = {
  id: "cpp-std-function",
  slug: "std-function-and-type-erasure",
  moduleSlug: "modern-cpp-idioms",
  title: "std::function, Type Erasure & What It Costs",
  summary:
    "One type that stores any callable with a given signature, and the price of that flexibility. What type erasure is doing underneath, the small-object optimisation and where it stops, and a loop measured six times slower than the templated equivalent.",
  estimatedMinutes: 35,
  objectives: [
    "Explain what type erasure is and how `std::function` implements it",
    "Store function pointers, lambdas and functors behind one type",
    "Predict when `std::function` allocates",
    "Measure and explain the indirect-call cost",
    "Choose between a template parameter, `std::function` and `function_ref`",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "Every lambda has a different type",
      body: [
        "Lesson 3 established that each lambda gets its own unique closure type. That is what makes lambdas fast, and it is also a problem the moment you want to *store* one.",
        "You cannot declare a member of \"lambda type\", because the type has no name and every lambda's is different. `auto` works for a local but not for a class member, a function parameter that must accept several different lambdas, or a `std::vector` of callbacks.",
        "**`std::function<R(Args...)>` solves it by erasing the type.** It stores any callable that can be invoked with `Args...` and returns something convertible to `R` — function pointers, capturing and non-capturing lambdas, function objects, and the result of `std::bind` — all behind one type you can name.",
        "**The mechanism is the same one module 6 used for polymorphism**, generated automatically. Internally, `std::function` holds a pointer to a small abstract interface with a virtual `invoke`, and constructing it from a callable creates a derived object wrapping that specific type. Calling it is a virtual dispatch.",
        "**That is why it costs what it costs**: an indirect call that cannot be inlined, and — for callables too large to fit inline — a heap allocation.",
      ],
      examples: [
        {
          id: "function-basics",
          title: "Four different callables, one type",
          lang: "cpp",
          code: `#include <cstdlib>
#include <functional>
#include <iostream>

static int allocations = 0;
void* operator new(std::size_t n) { ++allocations; return std::malloc(n); }
void operator delete(void* p) noexcept { std::free(p); }
void operator delete(void* p, std::size_t) noexcept { std::free(p); }

int addRaw(int a, int b) { return a + b; }

int main() {
    std::cout << "sizeof(std::function<int(int,int)>) = "
              << sizeof(std::function<int(int,int)>) << '\\n';

    // std::function erases the type: all of these have the SAME type.
    std::function<int(int,int)> f;

    f = addRaw;                                   // function pointer
    std::cout << "function pointer : " << f(2, 3) << '\\n';

    f = [](int a, int b) { return a * b; };       // capture-less lambda
    std::cout << "lambda           : " << f(2, 3) << '\\n';

    int factor = 10;
    f = [factor](int a, int b) { return (a + b) * factor; };   // capturing
    std::cout << "capturing lambda : " << f(2, 3) << '\\n';

    struct Functor { int operator()(int a, int b) const { return a - b; } };
    f = Functor{};                                // function object
    std::cout << "functor          : " << f(2, 3) << '\\n';

    // Small-object optimisation: small callables may avoid allocating.
    std::cout << "\\nallocations when assigning:\\n";
    {
        allocations = 0;
        std::function<int(int,int)> g = addRaw;
        std::cout << "  function pointer      : " << allocations << '\\n';
    }
    {
        allocations = 0;
        std::function<int(int,int)> g = [](int a, int b) { return a + b; };
        std::cout << "  capture-less lambda   : " << allocations << '\\n';
    }
    {
        allocations = 0;
        int a1=1,a2=2,a3=3,a4=4,a5=5,a6=6,a7=7,a8=8;
        std::function<int(int,int)> g =
            [a1,a2,a3,a4,a5,a6,a7,a8](int x, int y) {
                return x + y + a1+a2+a3+a4+a5+a6+a7+a8;
            };
        std::cout << "  large capture (32 B)  : " << allocations << '\\n';
    }

    // An empty std::function throws if called.
    std::function<void()> empty;
    std::cout << "\\nempty function is " << (empty ? "callable" : "empty") << '\\n';
    try { empty(); }
    catch (const std::bad_function_call& e) {
        std::cout << "calling it threw: " << e.what() << '\\n';
    }
}`,
          output: `sizeof(std::function<int(int,int)>) = 32
function pointer : 5
lambda           : 6
capturing lambda : 50
functor          : -1

allocations when assigning:
  function pointer      : 0
  capture-less lambda   : 0
  large capture (32 B)  : 1

empty function is empty
calling it threw: bad_function_call`,
          explanation:
            "**The allocation block shows the small-object optimisation and exactly where it stops.** A function pointer and a capture-less lambda fit inside the `std::function`'s 32 bytes and cost nothing extra; eight captured `int`s do not, and the closure is heap-allocated. **The threshold is implementation-defined** — 16 usable bytes on libstdc++ here — so treat \"small captures are free\" as a plausible guess and not a guarantee. Note also that a default-constructed `std::function` is empty and calling it throws `std::bad_function_call` rather than crashing.",
        },
      ],
    },
    {
      id: "the-cost",
      heading: "What it costs",
      body: [
        "**The call cannot be inlined.** A template parameter gives the compiler the exact callable type at the call site, so the body can be folded in; `std::function` gives it a virtual dispatch through a pointer it cannot resolve. In a loop over millions of elements that is the difference between a two-instruction body and a function call per element.",
        "**Construction may allocate**, as measured above, and copying a `std::function` copies the stored callable — which may allocate again.",
        "**It is bigger.** 32 bytes on libstdc++, against 8 for a function pointer and 1 for a capture-less lambda.",
        "The measurement below is the honest version of \"`std::function` is slow\": a 2-million-element loop, twenty passes, identical work.",
        "**None of that means avoid it.** The overhead is per call, so it matters in a hot inner loop and is irrelevant for a callback invoked on a UI event or once per network request. The mistake is using it as a *parameter type* for a function that will be called in a loop, when a template parameter costs nothing.",
      ],
      examples: [
        {
          id: "function-cost",
          title: "Template parameter against `std::function`, measured",
          lang: "cpp",
          code: `#include <chrono>
#include <functional>
#include <iostream>
#include <vector>

template <typename F>
long long timeMs(F f) {
    auto t0 = std::chrono::steady_clock::now();
    f();
    auto t1 = std::chrono::steady_clock::now();
    return std::chrono::duration_cast<std::chrono::milliseconds>(t1 - t0).count();
}

// Templated on the callable: the type is known, so the call inlines.
template <typename F>
long long applyTemplate(const std::vector<int>& v, F f) {
    long long s = 0;
    for (int x : v) s += f(x);
    return s;
}

// Type-erased: the call must go through a virtual dispatch.
long long applyFunction(const std::vector<int>& v,
                        const std::function<int(int)>& f) {
    long long s = 0;
    for (int x : v) s += f(x);
    return s;
}

int main() {
    std::vector<int> v(2000000, 3);
    auto doubler = [](int x) { return x * 2; };
    volatile long long sink = 0;

    std::cout << "2M elements, 20 passes:\\n";
    std::cout << "  template parameter (inlines) : " << timeMs([&]{
        for (int i = 0; i < 20; ++i) sink = applyTemplate(v, doubler);
    }) << " ms\\n";
    std::cout << "  std::function (type-erased)  : " << timeMs([&]{
        for (int i = 0; i < 20; ++i) sink = applyFunction(v, doubler);
    }) << " ms\\n";
    (void)sink;
}`,
          output: `2M elements, 20 passes:
  template parameter (inlines) : 25 ms
  std::function (type-erased)  : 153 ms`,
          explanation:
            "**Six times slower for the same arithmetic.** The templated version knows `doubler` exactly, inlines `x * 2` into the loop and vectorises it; the `std::function` version makes 40 million indirect calls the optimiser cannot see through. This is why the standard algorithms take their callables as template parameters rather than `std::function` — and why you should too, unless you specifically need to *store* the callable. (One machine at `-O2`; the ratio is the point.)",
        },
      ],
      pitfalls: [
        {
          title: "`std::function` requires the callable to be copy-constructible",
          body: "A lambda that captures a `std::unique_ptr` by move is move-only, and storing it in a `std::function` does not compile — the error is a wall of template text about the copy constructor. It is a genuine limitation of the interface, since `std::function` is copyable and therefore its contents must be. The C++23 fix is `std::move_only_function`, which drops the copyability requirement and is also const-correct in a way `std::function` is not. Before C++23 the workarounds are to capture a `shared_ptr` instead, or to wrap the move-only state in a `shared_ptr` inside the lambda.",
        },
      ],
    },
    {
      id: "alternatives",
      heading: "Choosing the right callable parameter",
      body: [
        "**A template parameter — `template <typename F> void each(F f)`** — is the default. Zero overhead, inlines, accepts anything callable. The costs are that it must live in a header, it makes the function a template, and an unconstrained one gives poor error messages — constrain it with `std::invocable<F, int>` from module 7 lesson 6.",
        "**A function pointer — `void each(int (*f)(int))`** — when you genuinely need C compatibility, or want to guarantee no state. It rejects capturing lambdas entirely.",
        "**`std::function`** when you must *store* the callable: a member, a container of callbacks, an observer list, anything crossing an ABI boundary or into a `.cpp`. That is what it is for.",
        "**A non-owning `function_ref`** for a callable parameter you only call during the function — no allocation, no ownership, one indirect call. It is not in the standard until C++26 (`std::function_ref`), but it is a common utility in codebases and available in libraries like `tl::function_ref` and Abseil's `absl::FunctionRef`.",
        "**`std::move_only_function`** (C++23) when the callable owns something and cannot be copied.",
        "The decision rule is short: **if you only call it, take a template parameter. If you store it, use `std::function`.**",
      ],
      examples: [
        {
          id: "callback-registry",
          title: "Where `std::function` is the right answer",
          lang: "cpp",
          code: `#include <functional>
#include <iostream>
#include <string>
#include <vector>

// Storing callbacks REQUIRES type erasure -- the lambdas all differ in type,
// and a vector needs one element type.
class EventBus {
public:
    using Handler = std::function<void(const std::string&)>;

    void subscribe(std::string topic, Handler h) {
        handlers_.push_back({std::move(topic), std::move(h)});
    }

    void publish(const std::string& topic, const std::string& payload) const {
        for (const auto& [t, h] : handlers_)
            if (t == topic) h(payload);
    }

private:
    struct Entry { std::string topic; Handler handler; };
    std::vector<Entry> handlers_;
};

// By contrast: a function that only CALLS its argument takes a template.
template <typename F>
void forEachWord(const std::string& s, F f) {
    std::size_t start = 0;
    while (start < s.size()) {
        auto end = s.find(' ', start);
        if (end == std::string::npos) end = s.size();
        f(s.substr(start, end - start));
        start = end + 1;
    }
}

int main() {
    EventBus bus;
    int seen = 0;

    bus.subscribe("user", [](const std::string& p) {
        std::cout << "  [audit] " << p << '\\n';
    });
    bus.subscribe("user", [&seen](const std::string& p) {
        ++seen;
        std::cout << "  [count] " << p << " (" << seen << ")\\n";
    });
    bus.subscribe("system", [](const std::string& p) {
        std::cout << "  [sys]   " << p << '\\n';
    });

    bus.publish("user", "login");
    bus.publish("system", "restart");
    bus.publish("user", "logout");

    std::cout << "\\ntemplate parameter, no storage, no overhead:\\n";
    forEachWord("alpha beta gamma", [](const std::string& w) {
        std::cout << "  word: " << w << '\\n';
    });
}`,
          output: `  [audit] login
  [count] login (1)
  [sys]   restart
  [audit] logout
  [count] logout (2)

template parameter, no storage, no overhead:
  word: alpha
  word: beta
  word: gamma`,
          explanation:
            "**The `EventBus` genuinely needs `std::function`** — three lambdas with three different closure types, one of them capturing, all stored in one `std::vector`. No template parameter can do that, because the vector needs a single element type. `forEachWord` is the opposite case: it calls its argument and never stores it, so a template parameter gives the same flexibility with the call inlined and nothing allocated. **Storing is the dividing line.**",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is type erasure, and how does `std::function` use it?",
      answer:
        "Storing objects of different types behind one uniform interface, with the concrete type known only to the code that created the wrapper. `std::function<R(Args...)>` accepts any callable invocable with `Args...` returning something convertible to `R` — function pointers, lambdas with any captures, functors, `bind` results — and presents them all as one nameable type. Internally it holds a pointer to a small abstract interface with a virtual `invoke`, and constructing it from a callable creates a derived object wrapping that specific type. So calling it is a virtual dispatch, which is exactly why it cannot be inlined.",
    },
    {
      question: "Why do you need `std::function` at all — why not just use `auto`?",
      answer:
        "Because every lambda has a unique, unnamed closure type. `auto` works for a local variable, but you cannot declare a class member of \"lambda type\", cannot have a `std::vector` of differently-typed lambdas, and cannot write a non-template function parameter accepting several of them. Anywhere the callable must be *stored* — a member, a container of callbacks, an observer list, something crossing into a `.cpp` — you need a single named type, and that requires erasing the concrete one.",
    },
    {
      question: "What does `std::function` cost?",
      answer:
        "An indirect call that cannot be inlined, possibly a heap allocation, and 32 bytes on libstdc++ against 8 for a function pointer. Measured over a 2-million-element loop run twenty times, a `std::function` parameter took 153ms against 25ms for a template parameter — about six times slower, because the templated version inlines the body and vectorises while the erased one makes 40 million opaque indirect calls. It allocates when the callable does not fit in its inline buffer: a function pointer and a capture-less lambda cost nothing, eight captured `int`s allocate. The threshold is implementation-defined.",
    },
    {
      question: "When should you use `std::function` and when a template parameter?",
      answer:
        "If the function only *calls* the callable during its execution, take a template parameter — zero overhead, it inlines, and it accepts anything; constrain it with `std::invocable` for decent errors. If the function *stores* the callable, use `std::function`, because storage needs a single named type. That is the dividing line. This is why the standard algorithms take template parameters and why an event bus or callback registry uses `std::function`. Between the two sits a non-owning `function_ref` — no allocation, one indirect call — for parameters where you want a non-template signature without ownership.",
    },
    {
      question: "What happens if you call a default-constructed `std::function`?",
      answer:
        "It throws `std::bad_function_call`. A `std::function` can be empty — default-constructed, assigned `nullptr`, or moved-from — and converts to `false` in a boolean context, so `if (f) f();` is the guard. This is better than a null function pointer, where the call is undefined behaviour, but it means every stored callback is a potential throw site. Checking before calling, or establishing an invariant that the function is never empty, is the usual discipline.",
    },
    {
      question: "Why can't `std::function` hold a move-only lambda?",
      answer:
        "Because `std::function` is itself copyable, so whatever it stores must be copy-constructible. A lambda capturing a `unique_ptr` by move is move-only, and assigning it produces a long template error about the copy constructor. C++23 added `std::move_only_function`, which drops the copyability requirement and is additionally const-correct in a way `std::function` is not — `std::function`'s `operator()` is const but can invoke a non-const callable, which is a known wart. Before C++23 the workaround is to capture a `shared_ptr` instead of a `unique_ptr`.",
    },
  ],
  takeaways: [
    "Every lambda has a unique unnamed type, so storing one needs type erasure",
    "`std::function<R(Args...)>` holds any compatible callable behind one nameable type",
    "It is implemented with a virtual dispatch, which is why the call cannot be inlined",
    "32 bytes on libstdc++, against 8 for a function pointer",
    "Small callables fit inline and cost no allocation; the threshold is implementation-defined",
    "A capture of eight `int`s allocated; a function pointer and a capture-less lambda did not",
    "Measured 153ms against 25ms for a template parameter over the same 40M calls",
    "An empty `std::function` throws `std::bad_function_call` when called",
    "It cannot hold a move-only callable — that is C++23's `std::move_only_function`",
    "If you only call it, take a template parameter; if you store it, use `std::function`",
    "`function_ref` is the non-owning middle ground, standard only from C++26",
  ],
  status: "available",
};
