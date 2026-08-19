import type { Lesson } from "@/content/types";

export const destructorsLesson: Lesson = {
  id: "cpp-destructors",
  slug: "destructors-and-raii",
  moduleSlug: "classes-constructors-destructors",
  title: "Destructors & Writing Your Own RAII Types",
  summary:
    "The function that runs when an object dies, and the discipline built on it. When exactly a destructor runs, why one must never throw, and how to write a resource-owning class of your own — including the two lines that stop it being copied incorrectly.",
  estimatedMinutes: 35,
  objectives: [
    "Write a destructor and say precisely when it runs",
    "Explain why a destructor must not throw",
    "Write an RAII wrapper around a resource",
    "Use `= delete` on copy operations until module 5 covers doing it properly",
    "Recognise the standard RAII types you already use",
  ],
  sections: [
    {
      id: "when",
      heading: "When a destructor runs",
      body: [
        "A destructor is named `~ClassName`, takes no parameters, returns nothing, and cannot be overloaded — there is exactly one per class.",
        "It runs at four moments, and all four are deterministic.",
        "**When an automatic object leaves its scope**, at the closing brace, in reverse order of construction.",
        "**When `delete` is called** on a pointer to a dynamically allocated object.",
        "**When a containing object is destroyed** — members are destroyed after the enclosing object's own destructor body, in reverse declaration order.",
        "**During stack unwinding**, when an exception propagates out of a scope. This is the case that makes RAII reliable rather than merely convenient.",
        "The compiler generates a destructor if you do not write one; it destroys each member and does nothing else. **That is usually correct** — if all your members are RAII types, they clean up after themselves and you need no destructor at all. Writing one you do not need is actively harmful, because declaring a destructor suppresses the compiler-generated move operations, which module 5 covers.",
      ],
      examples: [
        {
          id: "destructor-timing",
          title: "All four moments, including the exception path",
          lang: "cpp",
          code: `#include <iostream>
#include <stdexcept>
#include <string>

class ScopedTimer {
public:
    explicit ScopedTimer(std::string label) : label_(std::move(label)) {
        std::cout << "[start " << label_ << "]\\n";
    }
    ~ScopedTimer() { std::cout << "[end   " << label_ << "]\\n"; }

    ScopedTimer(const ScopedTimer&)            = delete;
    ScopedTimer& operator=(const ScopedTimer&) = delete;

private:
    std::string label_;
};

void work(bool fail) {
    ScopedTimer t{fail ? "failing work" : "normal work"};
    if (fail) throw std::runtime_error("something broke");
    std::cout << "  did the work\\n";
}

int main() {
    work(false);

    try { work(true); }
    catch (const std::exception& e) { std::cout << "caught: " << e.what() << '\\n'; }

    {
        ScopedTimer outer{"outer"};
        ScopedTimer inner{"inner"};
    }   // destroyed in reverse order
}`,
          output: `[start normal work]
  did the work
[end   normal work]
[start failing work]
[end   failing work]
caught: something broke
[start outer]
[start inner]
[end   inner]
[end   outer]`,
          explanation:
            "**`[end failing work]` printed before `caught`** — the destructor ran during unwinding, on the way out of `work`, before the handler was entered. That is the guarantee: **cleanup happens on the exception path without anyone writing cleanup code for it.** And the last pair shows reverse-order destruction: `inner` dies before `outer`, so an object may safely depend on one declared before it.",
        },
      ],
    },
    {
      id: "never-throw",
      heading: "A destructor must never throw",
      body: [
        "This is close to an absolute rule, and the reason is specific.",
        "During stack unwinding, destructors are being called *because* an exception is already propagating. If one of them throws a second exception while the first is still in flight, the runtime has two exceptions and no way to choose — so **it calls `std::terminate` and the program dies immediately.** No handler runs, no further cleanup happens.",
        "**Since C++11 destructors are implicitly `noexcept`**, which means an exception escaping one calls `std::terminate` whether or not unwinding is in progress. You can opt out with `~T() noexcept(false)`, and you almost certainly should not.",
        "So what do you do when cleanup can genuinely fail — closing a file whose final flush fails, committing a transaction, releasing a network resource?",
        "**Provide an explicit `close()` or `commit()` that reports errors**, and make the destructor a safety net that swallows them. Callers who care call the explicit method and handle the failure; callers who do not still get the resource released. This is exactly what `std::ofstream` does: its destructor closes the file and silently discards any error, and `close()` is there if you need to know.",
        "If the destructor must do something that can throw, wrap it in `try`/`catch` and log — never let it escape.",
      ],
      examples: [
        {
          id: "destructor-error-handling",
          title: "The explicit-close pattern",
          lang: "cpp",
          code: `#include <iostream>
#include <stdexcept>
#include <string>

class Transaction {
public:
    explicit Transaction(std::string name) : name_(std::move(name)) {
        std::cout << "  begin " << name_ << '\\n';
    }

    // Explicit commit: errors are reported to a caller who asked for them.
    void commit() {
        if (name_ == "doomed") throw std::runtime_error("commit failed");
        std::cout << "  commit " << name_ << '\\n';
        done_ = true;
    }

    // Destructor: safety net. Rolls back, and never throws.
    ~Transaction() {
        if (!done_) {
            try {
                std::cout << "  rollback " << name_ << '\\n';
            } catch (...) {
                // Swallow: a destructor must not propagate.
            }
        }
    }

    Transaction(const Transaction&)            = delete;
    Transaction& operator=(const Transaction&) = delete;

private:
    std::string name_;
    bool        done_ = false;
};

int main() {
    { Transaction t{"orders"}; t.commit(); }

    try {
        Transaction t{"doomed"};
        t.commit();                       // throws
    } catch (const std::exception& e) {
        std::cout << "caught: " << e.what() << '\\n';
    }

    { Transaction t{"abandoned"}; }       // never committed
}`,
          output: `  begin orders
  commit orders
  begin doomed
  rollback doomed
caught: commit failed
  begin abandoned
  rollback abandoned`,
          explanation:
            "**Three different endings, all correct.** The committed transaction does not roll back. The failed one rolls back during unwinding and the caller still sees the exception. The abandoned one rolls back at its closing brace. **The failure was reported by `commit()`, not by the destructor** — which is the whole pattern: errors go through the explicit call, and the destructor guarantees the resource is not left dangling.",
        },
      ],
    },
    {
      id: "writing-raii",
      heading: "Writing your own RAII type",
      body: [
        "Most of the time you should not need to — `std::vector`, `std::string`, `std::unique_ptr`, `std::lock_guard` and `std::fstream` already cover memory, text, ownership, locks and files. But you will meet C APIs that hand you a resource and expect a matching release call, and wrapping one is the standard job.",
        "The recipe is four parts.",
        "**Acquire in the constructor.** If acquisition fails, throw — so no object exists in a broken state.",
        "**Release in the destructor.** Unconditionally, and without throwing.",
        "**Decide what copying means.** For a unique resource — a file handle, a lock, a socket — copying is wrong, and the honest answer is `= delete` on both copy operations. Otherwise the compiler generates a copy that duplicates the handle, and you get a double release. **Module 5 covers doing this properly with move operations**; until then, deleting is the correct, safe placeholder.",
        "**Provide access to the underlying resource** if callers need it, usually a `get()` returning the raw handle.",
      ],
      examples: [
        {
          id: "raii-buffer",
          title: "An owning buffer, complete",
          lang: "cpp",
          code: `#include <iostream>
#include <cstddef>

// A minimal owning buffer: acquire in the ctor, release in the dtor.
class Buffer {
public:
    explicit Buffer(std::size_t n) : size_(n), data_(new int[n]{}) {
        std::cout << "  acquired " << size_ << " ints\\n";
    }
    ~Buffer() {
        delete[] data_;
        std::cout << "  released " << size_ << " ints\\n";
    }

    // Rule of three/five: covered in module 5. For now, forbid copying —
    // the generated copy would duplicate the pointer and double-free.
    Buffer(const Buffer&)            = delete;
    Buffer& operator=(const Buffer&) = delete;

    int&       operator[](std::size_t i)       { return data_[i]; }
    const int& operator[](std::size_t i) const { return data_[i]; }
    std::size_t size() const { return size_; }

private:
    std::size_t size_;
    int*        data_;
};

int main() {
    Buffer b{4};
    b[0] = 10; b[3] = 40;
    std::cout << "  b[0]=" << b[0] << " b[3]=" << b[3]
              << " size=" << b.size() << '\\n';
}`,
          output: `  acquired 4 ints
  b[0]=10 b[3]=40 size=4
  released 4 ints`,
          explanation:
            "Built with `-fsanitize=address` this program reports **no leaks and no errors** — the destructor runs on every path including exceptions. Note the two deleted copy operations: without them, `Buffer copy = b;` would copy the *pointer*, both objects would delete the same array, and you would have the double-free from module 3. **Deleting them turns a runtime crash into a compile error**, which is always the better trade.",
        },
      ],
      pitfalls: [
        {
          title: "Members are destroyed after the destructor body, not before",
          body: "The destructor body runs first, then members are destroyed in reverse declaration order, then base classes. So a destructor body can still safely use every member — they are all alive. What it must not do is assume anything about objects it does not own that may already have gone, which is the shutdown half of the static initialisation order problem from module 2.",
        },
      ],
    },
    {
      id: "standard-raii",
      heading: "The RAII types you are already using",
      body: [
        "It is worth naming these, because recognising the pattern in the standard library is what makes it feel natural in your own code.",
        "**`std::vector`, `std::string`, `std::map`** — own heap memory, free it in the destructor.",
        "**`std::unique_ptr`, `std::shared_ptr`** — own a single object.",
        "**`std::lock_guard`, `std::scoped_lock`, `std::unique_lock`** — own a mutex lock, release at the closing brace.",
        "**`std::ifstream`, `std::ofstream`** — own a file handle, close it in the destructor.",
        "**`std::jthread`** (C++20) — owns a thread and joins it in the destructor, which is why it exists alongside `std::thread`, whose destructor calls `std::terminate` if the thread was never joined.",
        "The question to ask of any type that acquires something: **does its destructor release it?** In the standard library the answer is always yes, and in your own code it should be.",
      ],
      examples: [
        {
          id: "unique-ptr-custom-deleter",
          title: "Wrapping a C API without writing a class at all",
          lang: "cpp",
          code: `#include <cstdio>
#include <fstream>
#include <iostream>
#include <memory>
#include <string>

int main() {
    // std::fopen returns a FILE* that must be released with std::fclose.
    // A unique_ptr with a custom deleter is RAII with no class to write.
    auto closer = [](std::FILE* f) { if (f) { std::fclose(f); std::cout << "  closed\\n"; } };

    {
        std::unique_ptr<std::FILE, decltype(closer)> file{
            std::fopen("/tmp/raii-c-api.txt", "w"), closer};

        if (!file) { std::cerr << "could not open\\n"; return 1; }

        std::fputs("written through a C API\\n", file.get());
        std::cout << "  wrote the line\\n";
    }   // fclose happens here, including on an early return or a throw

    std::ifstream check{"/tmp/raii-c-api.txt"};
    std::string line;
    std::getline(check, line);
    std::cout << "read back: " << line << '\\n';
}`,
          output: `  wrote the line
  closed
read back: written through a C API`,
          explanation:
            "**No custom class, no destructor written, and the file is closed on every path.** `std::unique_ptr` takes a second template parameter for the deleter, and `file.get()` hands the raw `FILE*` to the C function. This is the standard way to wrap any C resource — SQLite handles, OpenSSL contexts, SDL windows — and it is usually better than writing your own wrapper, because you inherit correct move semantics for free.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When does a destructor run?",
      answer:
        "At four deterministic moments: when an automatic object leaves scope, at the closing brace and in reverse order of construction; when `delete` is called on a dynamically allocated object; when a containing object is destroyed, after its own destructor body and in reverse declaration order; and during stack unwinding when an exception propagates out of the scope. That last case is what makes RAII reliable — cleanup happens on paths nobody wrote cleanup code for.",
    },
    {
      question: "Why must a destructor never throw?",
      answer:
        "Because destructors run during stack unwinding, when an exception is already propagating. A second exception thrown then leaves the runtime with two in flight and no way to choose, so it calls `std::terminate` and the program dies with no handler running. Since C++11 destructors are implicitly `noexcept`, so an escaping exception terminates even outside unwinding. When cleanup can genuinely fail, provide an explicit `close()` or `commit()` that reports the error and let the destructor be a silent safety net — which is exactly what `std::ofstream` does.",
    },
    {
      question: "How would you write an RAII wrapper for a C API resource?",
      answer:
        "Acquire in the constructor and throw if acquisition fails, so no broken object exists. Release in the destructor, unconditionally and without throwing. Decide what copying means — for a unique handle it is wrong, so `= delete` both copy operations, or implement move operations to transfer ownership. Expose a `get()` for the raw handle where callers need it. Often you can skip the class entirely: `std::unique_ptr<FILE, decltype(deleter)>` with a custom deleter gives you the same guarantees and correct move semantics for free.",
    },
    {
      question: "Should you always write a destructor?",
      answer:
        "No — writing one you do not need is actively harmful. The compiler-generated destructor destroys each member, and if all your members are RAII types that is exactly right. Declaring a destructor also suppresses the compiler-generated move constructor and move assignment operator, so a class that would have moved efficiently silently starts copying instead. Write a destructor only when the class owns a resource the members do not manage themselves.",
    },
    {
      question: "In what order are a destructor's body and its members' destructors run?",
      answer:
        "The destructor body runs first, then members are destroyed in reverse declaration order, then base classes. So the body can safely use every member, because they are all still alive. Construction is the exact mirror: base classes first, then members in declaration order, then the constructor body. That symmetry is what guarantees an object can depend on anything constructed before it.",
    },
  ],
  takeaways: [
    "`~ClassName` takes no parameters, cannot be overloaded, and runs at scope exit, on `delete`, with the enclosing object, and during unwinding",
    "Destructors are implicitly `noexcept` since C++11 — one that throws calls `std::terminate`",
    "When cleanup can fail, expose an explicit `close()`/`commit()` and make the destructor a silent safety net",
    "The destructor body runs before the members are destroyed, so it can use them freely",
    "Write your own destructor only when the class owns something its members do not manage",
    "Declaring a destructor suppresses the generated move operations — a real performance trap",
    "Until module 5, `= delete` the copy operations on a resource-owning class; that turns a double free into a compile error",
    "`std::unique_ptr` with a custom deleter wraps a C resource without writing a class at all",
  ],
  status: "available",
};
