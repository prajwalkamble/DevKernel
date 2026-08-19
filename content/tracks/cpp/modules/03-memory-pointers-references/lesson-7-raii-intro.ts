import type { Lesson } from "@/content/types";

export const raiiIntroLesson: Lesson = {
  id: "cpp-raii-intro",
  slug: "ownership-and-raii",
  moduleSlug: "memory-pointers-references",
  title: "From Raw Pointers to Ownership: RAII & unique_ptr",
  summary:
    "The idea that makes C++ safe without a garbage collector, demonstrated against the raw-pointer version it replaces: same program, but one leaks on an early return and on an exception, and the other does not.",
  estimatedMinutes: 30,
  objectives: [
    "State the RAII idea and why deterministic destruction makes it work",
    "Show that manual cleanup fails on early returns and exceptions",
    "Use `std::unique_ptr` and `std::make_unique`",
    "Move ownership explicitly with `std::move`, and explain why copying is forbidden",
    "Express ownership in a function signature so no comment is needed",
  ],
  sections: [
    {
      id: "the-idea",
      heading: "Resource Acquisition Is Initialisation",
      body: [
        "The name is famously bad. The idea is simple and is arguably the most important one in the language.",
        "**Tie a resource's lifetime to an object's lifetime.** Acquire the resource in a constructor; release it in the destructor. Then the resource is released exactly when the object is destroyed — and you already know precisely when that is, because module 2 established it: at the closing brace of its scope, in reverse order of construction.",
        "The property that makes this work, and that garbage-collected languages cannot offer, is **deterministic destruction**. A destructor runs at a known point, not whenever a collector next decides to run. That is why C++ can use the same mechanism for memory, files, locks, sockets and database transactions, while a GC language needs `try`/`finally`, `using`, or `defer` for everything that is not memory.",
        "The property that makes it *reliable* is that **destructors run during stack unwinding**. When an exception propagates, every fully constructed automatic object between the throw and the catch has its destructor called. So cleanup happens on paths you did not write and cannot foresee — which is exactly where manual cleanup fails.",
      ],
      examples: [
        {
          id: "raii-vs-manual",
          title: "The same program, one leaking and one not",
          lang: "cpp",
          code: `#include <iostream>
#include <memory>
#include <stdexcept>
#include <string>

struct Connection {
    std::string name;
    explicit Connection(std::string n) : name(std::move(n)) {
        std::cout << "  open  " << name << '\\n';
    }
    ~Connection() { std::cout << "  close " << name << '\\n'; }
};

void raw_pointer_version(bool fail) {
    Connection* c = new Connection("raw");
    if (fail) {
        std::cout << "  early return -- LEAKED\\n";
        return;                       // delete never runs
    }
    delete c;
}

void unique_ptr_version(bool fail) {
    auto c = std::make_unique<Connection>("unique_ptr");
    if (fail) {
        std::cout << "  early return -- still closed\\n";
        return;                       // destructor runs anyway
    }
}

void throwing_version() {
    auto c = std::make_unique<Connection>("during exception");
    throw std::runtime_error("boom");
}

int main() {
    std::cout << "raw, success path:\\n";   raw_pointer_version(false);
    std::cout << "raw, failure path:\\n";   raw_pointer_version(true);
    std::cout << "unique_ptr, failure:\\n"; unique_ptr_version(true);
    std::cout << "exception thrown:\\n";
    try { throwing_version(); } catch (const std::exception& e) {
        std::cout << "  caught: " << e.what() << '\\n';
    }
}`,
          output: `raw, success path:
  open  raw
  close raw
raw, failure path:
  open  raw
  early return -- LEAKED
unique_ptr, failure:
  open  unique_ptr
  early return -- still closed
  close unique_ptr
exception thrown:
  open  during exception
  close during exception
  caught: boom`,
          explanation:
            "**Count the `close` lines.** The raw version closed on the success path and leaked on the failure path — one `open` with no matching `close`. The `unique_ptr` version closed on both. And in the exception case, **`close` printed *before* `caught`**: the destructor ran during unwinding, on the way out, before the handler was entered. Built with `-fsanitize=address` this program reports `Direct leak of 32 byte(s) ... in raw_pointer_version(bool)`, naming the exact allocation.",
        },
      ],
    },
    {
      id: "why-manual-fails",
      heading: "Why manual cleanup cannot be made correct",
      body: [
        "The obvious objection to the example above is \"just remember to delete before the early return\". It is worth being precise about why that does not scale.",
        "**Every exit path must free.** A function with four `return` statements needs four `delete` calls, and someone adding a fifth return next year must know to add a fifth.",
        "**Exceptions create exit paths you did not write.** Any function call between the `new` and the `delete` might throw — including `std::string` construction, any container operation that allocates, and `operator new` itself. You cannot enumerate them.",
        "**Multiple resources multiply the problem.** Two allocations where the second might fail requires freeing the first on that path. Three is worse. The C answer is a chain of `goto cleanup` labels; the C++ answer is to stop having the problem.",
        "**Correctness is not local.** A reviewer must read the whole function to check that every path frees, and re-check after every edit.",
        "RAII collapses all of that: **the destructor runs on every exit path, including ones nobody wrote, and the compiler generates the calls.** Correctness becomes a property of the type rather than a property of every function that uses it.",
      ],
    },
    {
      id: "unique-ptr",
      heading: "std::unique_ptr",
      body: [
        "`std::unique_ptr<T>` is RAII for a heap allocation: it holds a pointer and deletes it in its destructor. It expresses **sole ownership** — exactly one `unique_ptr` owns the object at any time.",
        "It is a **zero-overhead** abstraction in the real sense: a `unique_ptr` with the default deleter is the same size as a raw pointer, and dereferencing it compiles to the same instruction. You are not paying for the safety.",
        "**Create one with `std::make_unique<T>(args)`**, which forwards its arguments to `T`'s constructor. Prefer it to `std::unique_ptr<T>(new T(args))` — it is shorter, mentions `T` once instead of twice, and (for the historical reason covered in module 9) is exception-safe in argument lists where the explicit form was not.",
        "It behaves like a pointer: `*p` and `p->member` work, and it converts to `bool` so `if (p)` tests whether it holds anything.",
        "**It cannot be copied.** Copying would mean two owners and therefore a double free, so the copy constructor is deleted. It can be **moved**, which transfers ownership and leaves the source empty.",
      ],
      examples: [
        {
          id: "unique-ptr-ops",
          title: "Every operation, including the one that fails",
          lang: "cpp",
          code: `#include <iostream>
#include <memory>
#include <string>

struct Widget {
    std::string name;
    explicit Widget(std::string n) : name(std::move(n)) {}
    ~Widget() { std::cout << "  ~" << name << '\\n'; }
};

std::unique_ptr<Widget> make(std::string name) {
    return std::make_unique<Widget>(std::move(name));   // caller owns it
}

void consume(std::unique_ptr<Widget> w) {               // takes ownership
    std::cout << "  consumed " << w->name << '\\n';
}                                                       // destroyed here

void observe(const Widget& w) {                         // borrows only
    std::cout << "  observed " << w.name << '\\n';
}

int main() {
    auto a = make("alpha");
    std::cout << "a holds: " << a->name << ", bool: "
              << std::boolalpha << static_cast<bool>(a) << '\\n';

    observe(*a);                      // still owned by a

    // auto b = a;                    // ERROR: copy is deleted
    auto b = std::move(a);            // ownership transferred
    std::cout << "after move, a is " << (a ? "set" : "empty") << '\\n';

    consume(std::move(b));            // ownership handed to consume
    std::cout << "after consume, b is " << (b ? "set" : "empty") << '\\n';
    std::cout << "end of main\\n";
}`,
          output: `a holds: alpha, bool: true
  observed alpha
after move, a is empty
  consumed alpha
  ~alpha
after consume, b is empty
end of main`,
          explanation:
            "**`~alpha` printed inside `consume`, not at the end of `main`** — ownership genuinely moved, and the object died where its last owner did. Note that after `std::move`, `a` is *empty*, not dangling: a moved-from `unique_ptr` is guaranteed to be null, which is safe to test and safe to destroy. Uncommenting `auto b = a;` gives `error: use of deleted function 'std::unique_ptr<...>::unique_ptr(const std::unique_ptr<...>&)'` — **the double-free was prevented at compile time.**",
        },
      ],
      pitfalls: [
        {
          title: "`std::move` does not move anything",
          body: "It is a cast. `std::move(x)` produces an rvalue reference to `x`, which is a signal that says \"you may steal from this\". The actual transfer is performed by whatever constructor or assignment operator receives it. That is why `std::move` on a `const` object silently does nothing useful — a const object cannot be stolen from, so a copy happens instead. Module 5 covers the whole mechanism; for now, read `std::move` as \"I am done with this, take it\".",
        },
      ],
    },
    {
      id: "signatures",
      heading: "Ownership in the signature",
      body: [
        "The practical payoff of all this is that a function signature becomes self-documenting about ownership. Four shapes cover essentially everything.",
        "**`std::unique_ptr<T> f()`** — the caller receives ownership. No comment needed.",
        "**`void f(std::unique_ptr<T> p)`** — the function takes ownership. The caller must `std::move` into it, which makes the transfer visible at the call site.",
        "**`void f(T* p)`** — observing, and the argument may be null. The function must check.",
        "**`void f(const T& p)` or `void f(T& p)`** — observing, and the argument definitely exists. Prefer this whenever null is not meaningful.",
        "Adopt these and a reader can answer \"who frees this?\" from the signature alone. That is the difference between a codebase where memory management is a constant low-level worry and one where it simply does not come up.",
      ],
      examples: [
        {
          id: "raii-beyond-memory",
          title: "RAII is not only about memory",
          lang: "cpp",
          code: `#include <fstream>
#include <iostream>
#include <mutex>
#include <string>

std::mutex log_mutex;

void write_report(const std::string& path) {
    std::ofstream out{path};          // file opened here
    if (!out) { std::cout << "could not open\\n"; return; }

    {
        std::lock_guard<std::mutex> guard{log_mutex};   // locked here
        std::cout << "writing " << path << '\\n';
    }                                                   // unlocked here

    out << "report contents\\n";
}                                     // file flushed and closed here

int main() {
    write_report("/tmp/raii-demo.txt");

    std::ifstream in{"/tmp/raii-demo.txt"};
    std::string line;
    std::getline(in, line);
    std::cout << "read back: " << line << '\\n';
}`,
          output: `writing /tmp/raii-demo.txt
read back: report contents`,
          explanation:
            "**Three resources, no cleanup code.** `std::ofstream` closes the file in its destructor — including on the early `return` and including if `out <<` throws. `std::lock_guard` unlocks at its closing brace, which is why the block exists: the lock is held for exactly the two lines that need it. **This is the pattern to look for in every API you use**: if a type acquires something, check whether it releases it in its destructor, because in modern C++ it almost always does.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is RAII and why does it work in C++ but not in Java?",
      answer:
        "Resource Acquisition Is Initialisation: tie a resource's lifetime to an object's, acquiring in the constructor and releasing in the destructor. It works because C++ has deterministic destruction — an object's destructor runs at a known point, the closing brace of its scope, in reverse order of construction. A garbage-collected language destroys objects whenever the collector decides, so it cannot use the same mechanism for files, locks or sockets and needs `try`/`finally` or `using` instead. The other half is that destructors run during stack unwinding, so cleanup happens on exception paths nobody wrote.",
    },
    {
      question: "Why can't manual `new`/`delete` be made correct with enough care?",
      answer:
        "Because correctness has to hold on every exit path, including ones you did not write. Any call between the `new` and the `delete` may throw — string construction, container growth, `operator new` itself — and the exception unwinds straight past the cleanup. Add a second resource and you must free the first on the path where the second fails; add a fifth `return` next year and someone must remember. RAII collapses all of it: the destructor runs on every path and the compiler emits the calls, so correctness becomes a property of the type rather than of every function using it.",
    },
    {
      question: "What does `std::unique_ptr` guarantee, and what does it cost?",
      answer:
        "It guarantees sole ownership and automatic deletion: exactly one `unique_ptr` owns the object, and the destructor deletes it on every exit path. It costs nothing — with the default deleter it is the same size as a raw pointer and dereferencing compiles to the same instruction. Copying is a deleted function, because two owners would mean a double free, so the mistake is caught at compile time. Moving transfers ownership and leaves the source guaranteed null, which is safe to test and safe to destroy.",
    },
    {
      question: "What does `std::move` actually do?",
      answer:
        "Nothing at runtime — it is a cast to an rvalue reference, which signals that the object may be stolen from. The actual transfer is performed by the move constructor or move assignment operator that receives the result. That is why `std::move` on a `const` object silently produces a copy: a const object cannot be stolen from, so overload resolution selects the copy operation instead. Read it as \"I am finished with this, take its contents.\"",
    },
    {
      question: "How do you express ownership in a function signature?",
      answer:
        "Returning `std::unique_ptr<T>` means the caller receives ownership. Taking `std::unique_ptr<T>` by value means the function takes ownership, and the caller must `std::move` into it, so the transfer is visible at the call site. A raw `T*` parameter means observing and possibly null, so the function must check. A `T&` or `const T&` means observing and definitely present. With those four conventions, \"who frees this?\" is answerable from the signature alone, with no comment.",
    },
  ],
  takeaways: [
    "RAII: acquire in the constructor, release in the destructor — then cleanup follows the object's lifetime",
    "It works because destruction is deterministic and destructors run during stack unwinding",
    "Manual cleanup fails on early returns and on exception paths you did not write and cannot enumerate",
    "`std::unique_ptr` is sole ownership at zero overhead — same size as a raw pointer, same dereference",
    "Prefer `std::make_unique<T>(args)`; it names `T` once and is exception-safe in argument lists",
    "Copying a `unique_ptr` is a compile error, which is a double free prevented at build time",
    "A moved-from `unique_ptr` is guaranteed null — safe to test, safe to destroy",
    "RAII covers files, locks, sockets and transactions, not just memory — `ofstream` and `lock_guard` are the everyday examples",
  ],
  status: "available",
};
