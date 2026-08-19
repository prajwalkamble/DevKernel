import type { Lesson } from "@/content/types";

export const scopeLifetimeLesson: Lesson = {
  id: "cpp-scope-lifetime",
  slug: "scope-storage-lifetime",
  moduleSlug: "control-flow-functions",
  title: "Scope, Storage Duration & Lifetime",
  summary:
    "When an object comes into existence and when it stops — traced through a running program that announces every construction and destruction. The three storage durations, the static local, and the initialisation-order problem that has bitten every large C++ codebase.",
  estimatedMinutes: 30,
  objectives: [
    "Distinguish scope (where a name is visible) from lifetime (when an object exists)",
    "Name the storage durations and know when each one's objects are created and destroyed",
    "Use a `static` local variable, and explain why it is thread-safe since C++11",
    "Explain the static initialisation order fiasco and the standard fix",
    "Predict the exact order of destruction in a nested program",
  ],
  sections: [
    {
      id: "scope-vs-lifetime",
      heading: "Scope is not lifetime",
      body: [
        "These two are constantly confused and they are genuinely different questions.",
        "**Scope** is a compile-time property of a *name*: the region of source text where that identifier is visible. It is about what you can write.",
        "**Lifetime** is a runtime property of an *object*: the interval during which its storage is valid and it is safe to use. It is about what actually exists.",
        "Usually they coincide — a local variable is visible exactly while it exists — and that is what makes the distinction easy to miss. But they come apart in both directions. A `static` local has a tiny scope and a lifetime as long as the program's. An object created with `new` has no name at all after the pointer goes out of scope, but it very much still exists, which is precisely how a memory leak happens.",
        "**Nearly every serious C++ bug is a lifetime bug**: using something after it was destroyed, destroying something twice, or never destroying it at all. Module 3 confronts this directly. Getting the vocabulary straight now makes that module much easier.",
      ],
    },
    {
      id: "storage-durations",
      heading: "The three storage durations",
      body: [
        "**Automatic** — ordinary local variables. Created when control reaches the declaration, destroyed at the end of the enclosing block, in **reverse order of construction**. Storage comes from the stack, and it is essentially free: a function's locals are allocated by adjusting one register.",
        "**Static** — globals, namespace-scope variables, `static` locals, and `static` class members. They exist for the whole program. Non-local ones are initialised before `main` begins; `static` locals are initialised on the first call that reaches them. All are destroyed after `main` returns, in reverse order of initialisation.",
        "**Dynamic** — objects created with `new` (or by a container on your behalf). They live until explicitly destroyed with `delete`. This is the one that can go wrong, and the whole of module 3 plus RAII in module 4 exists to make it not go wrong.",
        "(There is a fourth, *thread storage duration*, for `thread_local` variables — one instance per thread. Module 11 covers it.)",
        "The reverse-order destruction rule matters more than it sounds. It means an object can safely use one declared before it in the same scope, because the earlier one is guaranteed to still be alive when the later one is destroyed. That is what makes patterns like a lock guard declared after the object it protects work correctly.",
      ],
      examples: [
        {
          id: "lifetime-trace",
          title: "Every construction and destruction, in order",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

struct Noisy {
    std::string name;
    Noisy(std::string n) : name(std::move(n)) { std::cout << "  + " << name << '\\n'; }
    ~Noisy()                                  { std::cout << "  - " << name << '\\n'; }
};

Noisy global{"global (static storage)"};

int counter() {
    static int calls = 0;      // initialised once, on first call
    return ++calls;
}

void demo() {
    std::cout << "enter demo\\n";
    Noisy a{"a (automatic)"};
    {
        Noisy b{"b (inner scope)"};
    }
    static Noisy s{"s (static local)"};   // constructed on first call only
    std::cout << "leave demo\\n";
}

int main() {
    std::cout << "enter main\\n";
    demo();
    demo();
    std::cout << "counter: " << counter() << counter() << counter() << '\\n';
    std::cout << "leave main\\n";
}`,
          output: `  + global (static storage)
enter main
enter demo
  + a (automatic)
  + b (inner scope)
  - b (inner scope)
  + s (static local)
leave demo
  - a (automatic)
enter demo
  + a (automatic)
  + b (inner scope)
  - b (inner scope)
leave demo
  - a (automatic)
counter: 123
leave main
  - s (static local)
  - global (static storage)`,
          explanation:
            "Read this output line by line — it contains almost everything in the lesson. **`global` is constructed before `enter main`.** **`b` is destroyed at its inner closing brace**, before `demo` finishes. **`s` is constructed on the first call only** — the second `demo()` does not construct it again. **`a` is destroyed at the end of each call.** And after `main` returns, the two static objects are destroyed in **reverse order of construction**: `s` first, then `global`. The `counter: 123` line relies on chained `<<` being left-to-right sequenced, which C++17 guarantees.",
        },
      ],
    },
    {
      id: "static-locals",
      heading: "The static local variable",
      body: [
        "A `static` variable inside a function is initialised **once**, on the first execution that reaches its declaration, and it retains its value between calls.",
        "Two properties make it more useful than it first appears.",
        "**Initialisation is lazy.** The object does not exist until the function is first called, so you pay nothing if it never is. That matters for expensive objects — a lookup table, a database connection.",
        "**Initialisation is thread-safe since C++11.** If two threads reach the declaration simultaneously, exactly one performs the initialisation and the other blocks until it finishes. The standard requires this, and compilers implement it with a guard variable. Before C++11 it was a genuine race, which is why older code has hand-rolled double-checked locking around singletons — code you should delete when you meet it.",
        "The classic use is the **Meyers singleton**, and it is the correct way to write one in C++ precisely because of those two properties.",
        "The caution: a `static` local is global mutable state wearing a small scope. It makes the function non-reentrant, makes tests order-dependent, and if you mutate it from several threads you need your own synchronisation — the thread-safety guarantee covers *initialisation*, not subsequent access.",
      ],
      examples: [
        {
          id: "meyers-singleton",
          title: "Lazy, thread-safe initialisation in three lines",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

class Config {
public:
    static Config& instance() {
        static Config the_one;    // lazy, and thread-safe since C++11
        return the_one;
    }
    const std::string& log_level() const { return level_; }
    void set_log_level(std::string l) { level_ = std::move(l); }

    Config(const Config&) = delete;             // no copies of a singleton
    Config& operator=(const Config&) = delete;

private:
    Config() { std::cout << "Config constructed (first use)\\n"; }
    std::string level_{"info"};
};

int main() {
    std::cout << "before first use\\n";
    Config::instance().set_log_level("debug");
    std::cout << Config::instance().log_level() << '\\n';
}`,
          output: `before first use
Config constructed (first use)
debug`,
          explanation:
            "\"Config constructed\" appears *after* \"before first use\" — construction happened on first call, not at program start. The `= delete` lines are how you forbid an operation the compiler would otherwise generate; module 5 covers them properly. **This pattern also sidesteps the initialisation-order problem below**, which is its main advantage over a namespace-scope global.",
        },
      ],
    },
    {
      id: "init-order",
      heading: "The static initialisation order fiasco",
      body: [
        "This has a name because it has caused so much trouble.",
        "Non-local objects with static storage duration are initialised before `main`. Within a **single** translation unit, they are initialised in the order they are defined. **Across translation units, the order is unspecified** — it depends on link order, and it can change when you reorder files in your build.",
        "So if a global in `a.cpp` uses a global in `b.cpp` during its own construction, it may run before that object exists. The result is reading a not-yet-constructed object: undefined behaviour, typically a crash at startup or a zero where a value should be, and it can appear or vanish when someone edits the build file.",
        "**The standard fix is to replace the global with a function returning a `static` local** — the construct-on-first-use idiom, which is exactly the singleton above. Initialisation then happens on first *use* rather than at some unspecified point before `main`, so the ordering problem disappears entirely.",
        "There is a symmetric problem at shutdown: static objects are destroyed after `main` in reverse order of construction, and across translation units that order is equally unspecified. An object whose destructor logs to a global logger may find the logger already destroyed. The same fix applies, and for genuinely program-long resources some codebases deliberately never destroy them — a leak that ends with the process is not a leak that matters.",
      ],
      examples: [
        {
          id: "init-order-fix",
          title: "The bug, and the idiom that removes it",
          lang: "cpp",
          code: `// --- BROKEN: order across translation units is unspecified ---

// registry.cpp
std::vector<std::string> names;          // global

// plugin.cpp
struct Registrar {
    Registrar() { names.push_back("plugin"); }   // may run FIRST
};
static Registrar r;


// --- FIXED: construct on first use ---

// registry.h
std::vector<std::string>& names();

// registry.cpp
std::vector<std::string>& names() {
    static std::vector<std::string> the_names;   // built on first call
    return the_names;
}

// plugin.cpp
struct Registrar {
    Registrar() { names().push_back("plugin"); } // always constructed by now
};
static Registrar r;`,
          explanation:
            "In the broken version, whether `names` exists when `Registrar`'s constructor runs depends on the order the linker happened to put the translation units in. **In the fixed version the question cannot arise**: calling `names()` constructs the vector if it does not yet exist. The change is mechanical — a global becomes a function returning a reference — and it is worth applying to every non-trivial global you own.",
        },
      ],
      pitfalls: [
        {
          title: "`static` at namespace scope means something different again",
          body: "C++ overloads this keyword three ways. On a *local* variable it means static storage duration. On a *class member* it means one shared instance rather than one per object. On a *namespace-scope* function or variable it means **internal linkage** — the symbol is private to that translation unit and invisible to the linker. That last meaning is the C way of making something file-private; in modern C++ an anonymous namespace is preferred, since it works for types too.",
        },
      ],
    },
    {
      id: "const-and-scope",
      heading: "Nested scopes and where to declare things",
      body: [
        "Two short rules that follow from everything above.",
        "**Declare at the narrowest scope that works, and as late as possible.** A variable that exists for three lines cannot be misused on line forty. It also means the compiler can reuse its stack slot, and — more importantly — you can usually make it `const`, because by the time you declare it you know its value.",
        "**Prefer a nested block to a comment.** When part of a function needs a temporary that the rest does not, wrap it in braces. The temporary is destroyed at the closing brace, which for anything holding a resource — a lock, a file, a buffer — means the release happens exactly where you want it rather than at the end of the function.",
      ],
      examples: [
        {
          id: "scoped-block",
          title: "A block that releases a resource early",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

struct Noisy {
    std::string name;
    explicit Noisy(std::string n) : name(std::move(n)) { std::cout << "  + " << name << '\\n'; }
    ~Noisy() { std::cout << "  - " << name << '\\n'; }
};

int main() {
    std::cout << "start\\n";
    {
        Noisy scratch{"scratch buffer"};
        std::cout << "  using " << scratch.name << '\\n';
    }   // released here, not at the end of main
    std::cout << "long tail of work that does not need it\\n";
    std::cout << "end\\n";
}`,
          output: `start
  + scratch buffer
  using scratch buffer
  - scratch buffer
long tail of work that does not need it
end`,
          explanation:
            "The buffer is gone before the long tail begins. Without the braces it would survive to the end of `main`, holding memory (or a lock, or a file handle) nobody needs. **This is RAII in miniature, and module 4 builds the whole idea on exactly this guarantee** — that the closing brace runs the destructor, deterministically, including when an exception is thrown.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between scope and lifetime?",
      answer:
        "Scope is a compile-time property of a name — the region of code where the identifier is visible. Lifetime is a runtime property of an object — the interval during which its storage is valid. They usually coincide for locals, which is why they get conflated, but they diverge in both directions: a `static` local has a tiny scope and program-long lifetime, while an object created with `new` outlives every name that referred to it, which is exactly what a leak is. Most serious C++ bugs are lifetime bugs.",
    },
    {
      question: "In what order are local objects destroyed?",
      answer:
        "Reverse order of construction, at the closing brace of their enclosing block. That guarantee matters: an object can safely depend on one declared earlier in the same scope, because the earlier one is still alive when the later one's destructor runs. Static objects follow the same rule after `main` returns — destroyed in reverse order of initialisation — though across translation units that order is unspecified.",
    },
    {
      question: "Is a `static` local variable thread-safe?",
      answer:
        "Its *initialisation* is, since C++11 — if several threads reach the declaration at once, exactly one initialises it and the others block until that completes, implemented with a guard variable. That is what makes the Meyers singleton correct without any explicit locking, and why hand-rolled double-checked locking around singletons in older code can be deleted. But the guarantee covers initialisation only: subsequent reads and writes need your own synchronisation like any other shared state.",
    },
    {
      question: "What is the static initialisation order fiasco, and how do you fix it?",
      answer:
        "Non-local static objects are initialised before `main`, in definition order within a translation unit but in **unspecified** order across them. So a global in one file that uses a global in another during construction may run first and read an object that does not yet exist — undefined behaviour that can appear or vanish when the build's link order changes. The fix is construct-on-first-use: replace the global with a function returning a reference to a `static` local, so initialisation is tied to first use rather than to program startup. The mirror problem exists at shutdown, and the same idiom addresses it.",
    },
    {
      question: "What are the three meanings of `static` in C++?",
      answer:
        "On a local variable it gives static storage duration — initialised once, retained between calls. On a class member it means one instance shared by all objects of that class rather than one per object. At namespace scope it means internal linkage — the name is private to that translation unit and invisible to the linker. The third is the C idiom for file-private symbols; modern C++ prefers an anonymous namespace, which achieves the same thing and also works for types.",
    },
  ],
  takeaways: [
    "Scope is where a name is visible; lifetime is when an object exists — and they are not the same question",
    "Automatic objects are destroyed at the closing brace, in reverse order of construction",
    "Static objects are destroyed after `main`, also in reverse order — but unspecified across translation units",
    "A `static` local is initialised lazily on first use, and that initialisation is thread-safe since C++11",
    "The Meyers singleton — a function returning a `static` local reference — is the correct C++ singleton",
    "The static initialisation order fiasco is fixed by construct-on-first-use, not by careful ordering",
    "`static` means storage duration on a local, one-per-class on a member, and internal linkage at namespace scope",
    "Wrap a short-lived resource in its own block so the destructor runs where you want it, not at the end of the function",
  ],
  status: "available",
};
