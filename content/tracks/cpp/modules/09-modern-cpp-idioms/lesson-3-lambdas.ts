import type { Lesson } from "@/content/types";

export const lambdasLesson: Lesson = {
  id: "cpp-lambdas",
  slug: "lambdas-captures-and-closure-types",
  moduleSlug: "modern-cpp-idioms",
  title: "Lambdas, Capture Modes & the Closure Type the Compiler Writes",
  summary:
    "A lambda is a class the compiler writes for you, and its captures are its members. What each capture mode stores, the `sizeof` that proves it, init-capture for moving into a closure, and the two dangling bugs — a captured reference and an implicitly captured `this`.",
  estimatedMinutes: 35,
  objectives: [
    "Explain what closure type the compiler generates for a lambda",
    "Choose between `[=]`, `[&]` and named captures deliberately",
    "Use init-capture to move a resource into a closure",
    "Recognise a dangling capture, including the `this` case",
    "Write generic lambdas and know when a lambda beats a function",
  ],
  sections: [
    {
      id: "closure-type",
      heading: "A lambda is a class",
      body: [
        "**A lambda expression creates an object of a unique, unnamed class type** — the *closure type* — that the compiler writes. `operator()` is the body, and **each capture becomes a data member**.",
        "That is the whole model, and everything else follows from it. `[base](int x) { return base + x; }` generates roughly:",
        "```\nclass __lambda { int base; public: auto operator()(int x) const { return base + x; } };\n```",
        "**`operator()` is `const` by default**, which is why a by-value capture cannot be modified — the member is not const, but the call operator is. Adding **`mutable`** makes it non-const and lets the lambda modify its own copies.",
        "**Each capture costs its own size**, and the example below measures it: an empty lambda is 1 byte (the minimum object size), capturing an `int` is 4, capturing two is 8, capturing by reference is 8 (a pointer), and capturing a `std::string` is 32.",
        "**A capture-less lambda converts implicitly to a function pointer**, since it has no state to carry. That is how you pass one to a C API expecting a callback. A capturing lambda cannot, which is what `std::function` and type erasure are for — the next lesson.",
      ],
      examples: [
        {
          id: "captures",
          title: "Every capture mode, and what each costs",
          lang: "cpp",
          code: `#include <algorithm>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

int main() {
    int  counter = 0;
    int  base    = 100;
    std::string label = "sum";

    // [=] copies, [&] refers. Prefer naming what you capture.
    auto byValue = [base](int x) { return base + x; };
    auto byRef   = [&counter]() { ++counter; };

    std::cout << "byValue(5) = " << byValue(5) << '\\n';
    byRef(); byRef(); byRef();
    std::cout << "counter after 3 calls = " << counter << '\\n';

    // A by-value capture is a SNAPSHOT taken at construction.
    base = 999;
    std::cout << "after base = 999, byValue(5) = " << byValue(5)
              << "  <-- still uses the old copy\\n";

    // mutable lets a lambda modify its own copy.
    auto ticker = [n = 0]() mutable { return ++n; };
    std::cout << "ticker: " << ticker() << ' ' << ticker() << ' '
              << ticker() << '\\n';

    // Init-capture (C++14) can MOVE into the closure.
    auto owned  = std::make_unique<std::string>("moved in");
    auto holder = [p = std::move(owned)]() { return *p; };
    std::cout << "init-capture: " << holder() << '\\n';
    std::cout << "original is " << (owned ? "non-null" : "null") << '\\n';

    // A lambda is an object with a compiler-written type.
    std::cout << "\\nsizeof an empty lambda        = " << sizeof([]{}) << '\\n';
    std::cout << "sizeof capturing one int     = "
              << sizeof([base]{ return base; }) << '\\n';
    std::cout << "sizeof capturing two ints    = "
              << sizeof([base, counter]{ return base + counter; }) << '\\n';
    std::cout << "sizeof capturing by ref      = "
              << sizeof([&base]{ return base; }) << '\\n';
    std::cout << "sizeof capturing a string    = "
              << sizeof([label]{ return label.size(); }) << '\\n';

    // Generic lambda (C++14): auto parameters make operator() a template.
    auto twice = [](auto x) { return x + x; };
    std::cout << "\\ngeneric lambda: " << twice(21) << ' ' << twice(1.5)
              << ' ' << twice(std::string{"ab"}) << '\\n';

    // Immediately invoked, for complex const initialisation.
    const std::vector<int> sorted = []{
        std::vector<int> v{5, 2, 9, 1};
        std::sort(v.begin(), v.end());
        return v;
    }();
    std::cout << "IIFE-initialised const vector:";
    for (int x : sorted) std::cout << ' ' << x;
    std::cout << '\\n';
}`,
          output: `byValue(5) = 105
counter after 3 calls = 3
after base = 999, byValue(5) = 105  <-- still uses the old copy
ticker: 1 2 3
init-capture: moved in
original is null

sizeof an empty lambda        = 1
sizeof capturing one int     = 4
sizeof capturing two ints    = 8
sizeof capturing by ref      = 8
sizeof capturing a string    = 32

generic lambda: 42 3 abab
IIFE-initialised const vector: 1 2 5 9`,
          explanation:
            "**The `sizeof` block is the proof that captures are members** — 4 bytes for an `int`, 8 for two, 8 for a reference (a pointer), 32 for a `std::string`. The empty lambda is 1 byte only because C++ requires distinct objects to have distinct addresses. Two other things worth keeping: **`base = 999` did not change `byValue`**, because the copy was taken when the lambda was constructed; and **init-capture moved a `unique_ptr` into the closure**, which is the only way to get a move-only type in there and left the original null.",
        },
      ],
      pitfalls: [
        {
          title: "The immediately-invoked lambda is the idiom for complex `const` initialisation",
          body: "A `const` object that needs several statements to build normally forces you to drop the `const` or write a helper function. `const auto x = []{ /* build it */ return v; }();` keeps the `const`, keeps the construction next to the declaration, and lets the compiler apply return-value optimisation so nothing is copied. It is one of the most useful small uses of a lambda and turns up constantly in modern code — recognise the trailing `()`, which is what makes it a call rather than a stored lambda.",
        },
      ],
    },
    {
      id: "capture-defaults",
      heading: "Capture defaults, and why to avoid them",
      body: [
        "`[=]` captures everything used, by copy. `[&]` captures everything used, by reference. Both are convenient and both hide information the reader needs.",
        "**Prefer naming captures explicitly.** `[base, &counter]` states exactly what the closure holds and how, so its lifetime requirements are visible without reading the body. With `[&]` you have to read every line to know what the closure now depends on staying alive.",
        "**`[&]` is only safe when the lambda does not outlive the enclosing scope.** That covers most uses — a predicate passed to `std::sort`, a body passed to `for_each` — and none of the ones that matter: a callback stored in a member, a task queued to a thread pool, anything captured into a `std::function` that is returned.",
        "**`[=]` inside a member function is the dangerous one.** It does *not* copy the members. Members are accessed through `this`, so `[=]` captures **the `this` pointer**, and the closure dangles the moment the object dies — even though the syntax says \"by value\". **C++20 deprecated implicit `this` capture through `[=]`** for exactly this reason, and GCC warns.",
        "The fixes: **`[*this]`** (C++17) copies the whole object into the closure; **`[member = member]`** copies just what you need; and writing `[this]` explicitly at least makes the dependency visible.",
      ],
      examples: [
        {
          id: "dangling-captures",
          title: "The two dangling captures, one of which the compiler warns about",
          lang: "cpp",
          code: `#include <functional>
#include <iostream>
#include <string>

// A lambda capturing by reference, returned from a function. DANGLING.
std::function<int()> makeDangling() {
    int local = 42;
    return [&local] { return local; };    // local dies when we return
}

std::function<int()> makeSafe() {
    int local = 42;
    return [local] { return local; };     // copied into the closure
}

struct Widget {
    int value = 7;
    // [=] in a member function captures 'this', NOT the members.
    auto badCapture()  const { return [=]        { return value; }; }
    auto goodCapture() const { return [v = value]{ return v; }; }
};

int main() {
    auto safe = makeSafe();
    std::cout << "safe lambda returns " << safe() << '\\n';

    std::cout << "\\nthe dangling one is undefined behaviour when called.\\n";

    std::function<int()> f;
    {
        Widget w;
        f = w.goodCapture();      // captured the VALUE
    }
    std::cout << "goodCapture survives its Widget: " << f() << '\\n';

    std::cout << "[=] in a member function captures this -- not the members.\\n";
    std::cout << "C++20 deprecated implicit this capture via [=] for this reason.\\n";
}`,
          output: `$ g++ -std=c++20 -Wall -Wextra lambdas.cpp
warning: implicit capture of 'this' via '[=]' is deprecated in C++20
   [-Wdeprecated]
   20 |     auto badCapture()  const { return [=] { return value; }; }
      |                                       ^
note: add explicit 'this' or '*this' capture

$ ./a.out
safe lambda returns 42

the dangling one is undefined behaviour when called.
goodCapture survives its Widget: 7
[=] in a member function captures this -- not the members.
C++20 deprecated implicit this capture via [=] for this reason.`,
          explanation:
            "**GCC caught the `this` capture and said nothing about `makeDangling`.** That asymmetry is worth noticing: the `[=]` member case is now a warning because the committee deprecated it, while returning a lambda that captured a local by reference compiles silently and is equally undefined. `goodCapture` survived its `Widget` going out of scope because `[v = value]` copied the `int` into the closure rather than storing a pointer to the object.",
        },
      ],
    },
    {
      id: "where-lambdas-win",
      heading: "Where lambdas earn their place",
      body: [
        "**As algorithm arguments** — the original motivation. A predicate written inline next to the call is far easier to follow than a named function fifty lines away, and unlike a function pointer it can be *inlined*, because its type is unique and known at the call site.",
        "**As a scope-local helper.** A few lines used twice in one function are a lambda, not a private member function that pollutes the class.",
        "**For complex `const` initialisation**, via the immediately-invoked form above.",
        "**As a custom deleter or comparator**, where the closure type being unique means it costs nothing in `unique_ptr` or an ordered container.",
        "**Generic lambdas** with `auto` parameters make `operator()` a template, so one lambda works for every type — the compiler-written equivalent of a function template, usable inline.",
        "**A note on performance**: a lambda passed to `std::sort` is typically *faster* than a function pointer, because the closure type is distinct so the comparison inlines, whereas a function pointer usually forces an indirect call. That is the opposite of most people's intuition and is a genuine reason to prefer lambdas in hot code.",
      ],
      examples: [
        {
          id: "lambda-uses",
          title: "Four idiomatic uses in one program",
          lang: "cpp",
          code: `#include <algorithm>
#include <cstdio>
#include <iostream>
#include <memory>
#include <set>
#include <string>
#include <vector>

struct Task { std::string name; int priority; };

int main() {
    std::vector<Task> tasks{
        {"deploy", 1}, {"review", 3}, {"triage", 2}, {"lunch", 3},
    };

    // 1. Inline predicate -- reads next to the call, and inlines.
    std::sort(tasks.begin(), tasks.end(),
              [](const Task& a, const Task& b) { return a.priority < b.priority; });
    std::cout << "sorted:";
    for (const auto& t : tasks) std::cout << ' ' << t.name << '(' << t.priority << ')';
    std::cout << '\\n';

    // 2. Scope-local helper, used twice.
    auto describe = [](const Task& t) {
        return t.name + " [" + std::to_string(t.priority) + "]";
    };
    std::cout << "first: " << describe(tasks.front())
              << ", last: " << describe(tasks.back()) << '\\n';

    // 3. Comparator for a container -- the closure type is the template arg.
    auto byName = [](const Task& a, const Task& b) { return a.name < b.name; };
    std::set<Task, decltype(byName)> byNameSet(tasks.begin(), tasks.end(), byName);
    std::cout << "by name:";
    for (const auto& t : byNameSet) std::cout << ' ' << t.name;
    std::cout << '\\n';

    // 4. Custom deleter -- stateless closure, so no size cost.
    auto closer = [](std::FILE* f) { if (f) { std::fclose(f); } };
    std::unique_ptr<std::FILE, decltype(closer)> fp{
        std::fopen("/tmp/lambda_demo.txt", "w"), closer};
    if (fp) std::fputs("via a lambda deleter\\n", fp.get());
    std::cout << "sizeof that unique_ptr = " << sizeof(fp)
              << "  (stateless lambda costs nothing)\\n";
}`,
          output: `sorted: deploy(1) triage(2) review(3) lunch(3)
first: deploy [1], last: lunch [3]
by name: deploy lunch review triage
sizeof that unique_ptr = 8  (stateless lambda costs nothing)`,
          explanation:
            "**The `unique_ptr` with a lambda deleter is still 8 bytes** — the closure is stateless, so the empty base optimisation from lesson 1 applies and it costs nothing, unlike the function pointer that made it 16. Note `decltype(byName)` as a template argument: a lambda's type has no name, so `decltype` is how you refer to it. Since C++20 a capture-less lambda is also default-constructible, which is why this pattern got simpler.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does the compiler generate for a lambda expression?",
      answer:
        "An object of a unique, unnamed class type — the closure type — whose `operator()` is the lambda body and whose data members are the captures. `[base](int x){ return base + x; }` becomes roughly a class with an `int base` member and a `const` call operator. `operator()` is `const` by default, which is why a by-value capture cannot be modified without `mutable`. Because each closure type is distinct, the compiler knows exactly which function is being called and can inline it — which is why a lambda passed to `std::sort` typically outperforms a function pointer.",
    },
    {
      question: "What is the difference between `[=]` and `[&]`, and why avoid both?",
      answer:
        "`[=]` captures everything used by copy, `[&]` by reference. Both hide what the closure actually holds, so a reader must scan the body to learn its lifetime requirements. Naming captures — `[base, &counter]` — states it in the capture list. `[&]` is safe only when the lambda does not outlive the enclosing scope, which covers algorithm predicates but not stored callbacks, queued tasks or returned `std::function`s. `[=]` is the more dangerous default inside a member function, because it captures `this` rather than copying members.",
    },
    {
      question: "Why is `[=]` inside a member function dangerous?",
      answer:
        "Because it does not copy the members. Members are accessed through `this`, so `[=]` captures the `this` pointer, and the closure dangles as soon as the object is destroyed — despite syntax that reads as capture-by-value. It is a genuine trap, and C++20 deprecated implicit `this` capture via `[=]` specifically because of it; GCC warns with `-Wdeprecated`. The fixes are `[*this]`, which copies the entire object into the closure since C++17, `[member = member]` to copy only what you need, or writing `[this]` explicitly so the dependency is at least visible.",
    },
    {
      question: "What is init-capture and what problem does it solve?",
      answer:
        "C++14 syntax that declares a new closure member with an initialiser: `[p = std::move(owned)]`. It solves two things. It allows moving into a closure, which plain capture cannot — a `unique_ptr` or any move-only type can only get in this way. And it lets the member differ from anything in the enclosing scope, so you can capture a computed value, or a copy of a member under a different name to avoid capturing `this`. `[n = 0]` combined with `mutable` also gives a lambda its own mutable state.",
    },
    {
      question: "When does a lambda convert to a function pointer?",
      answer:
        "Only when it captures nothing, since a function pointer carries no state. A capture-less lambda has an implicit conversion to `R(*)(Args...)`, which is how you pass one to a C API expecting a callback. A capturing lambda has no such conversion — its closure holds data that a bare function pointer cannot represent. To store a capturing lambda behind a uniform type you need type erasure, which is what `std::function` provides, at the cost of an indirect call and possibly an allocation.",
    },
    {
      question: "Is a lambda slower than a function pointer?",
      answer:
        "Usually faster. Each lambda has a unique closure type, so the compiler knows statically which `operator()` a call refers to and can inline it — `std::sort` with a lambda comparator typically inlines the comparison entirely. A function pointer is a runtime value, so the call is usually indirect and cannot be inlined unless the optimiser can prove which function it points to. The intuition that a lambda is a heavier abstraction is backwards. What does cost is wrapping a lambda in `std::function`, which erases the type and reintroduces the indirect call.",
    },
  ],
  takeaways: [
    "A lambda is an object of a compiler-generated closure type; captures are its data members",
    "`sizeof` proves it: 4 bytes for an `int` capture, 8 for a reference, 32 for a `std::string`",
    "`operator()` is `const` by default — `mutable` is needed to modify a by-value capture",
    "A by-value capture is a snapshot taken when the lambda is constructed",
    "Prefer named captures to `[=]` and `[&]` — they document the closure's lifetime needs",
    "`[&]` is safe only while the lambda cannot outlive the enclosing scope",
    "`[=]` in a member function captures `this`, not the members — deprecated in C++20",
    "Fix with `[*this]`, `[member = member]`, or an explicit `[this]`",
    "Init-capture `[p = std::move(x)]` is the only way to move into a closure",
    "A capture-less lambda converts to a function pointer; a capturing one does not",
    "The immediately-invoked form is the idiom for complex `const` initialisation",
    "Lambdas usually inline where function pointers cannot, so they are typically faster",
  ],
  status: "available",
};
