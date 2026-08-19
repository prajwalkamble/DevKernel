import type { Lesson } from "@/content/types";

export const uniquePtrLesson: Lesson = {
  id: "cpp-unique-ptr",
  slug: "unique-ptr-and-sole-ownership",
  moduleSlug: "modern-cpp-idioms",
  title: "unique_ptr & Expressing Sole Ownership in the Type",
  summary:
    "The smart pointer that costs nothing and makes a leak a compile error. Why moving is the only way to transfer it, how a custom deleter turns any C resource into an RAII type without writing a class, and why it is exactly the size of a raw pointer.",
  estimatedMinutes: 35,
  objectives: [
    "Explain what `unique_ptr` guarantees and what it costs",
    "Transfer ownership with `std::move` and say why copying is deleted",
    "Distinguish owning from borrowing in a function signature",
    "Use a custom deleter to wrap a C resource",
    "Use `release`, `reset` and `get` for the right reasons",
  ],
  sections: [
    {
      id: "ownership-in-the-type",
      heading: "Ownership as a compile-time fact",
      body: [
        "A raw `T*` says nothing about ownership. Given `void f(Widget* w)`, you cannot tell whether `f` deletes it, stores it, or merely reads it — and neither can the compiler, so getting it wrong is a leak or a double free that nothing catches.",
        "**`std::unique_ptr<T>` puts the answer in the type.** It owns exactly one object, deletes it in its destructor, and **cannot be copied** — the copy constructor and copy assignment are `= delete`d. The only way to transfer it is `std::move`, which is visible at the call site.",
        "That single restriction is the whole design. **Two `unique_ptr`s can never own the same object**, so a double free is not merely unlikely but unrepresentable. And because the destructor always runs — including during stack unwinding — an early return or a thrown exception cannot leak it.",
        "**It costs nothing.** `sizeof(std::unique_ptr<T>)` is `sizeof(T*)`, and with optimisation enabled the generated code matches hand-written `new`/`delete`. There is no reference count and no control block; that is `shared_ptr`, and it is the next lesson.",
        "**`std::make_unique<T>(args...)` is the way to create one.** It forwards the arguments to `T`'s constructor, never mentions `new`, and — historically — avoided an exception-safety hole in `f(std::unique_ptr<A>(new A), g())` where the evaluation order could leak. C++17 fixed that ordering, but `make_unique` remains the clearer form.",
      ],
      examples: [
        {
          id: "unique-basics",
          title: "Owning, borrowing, moving and releasing",
          lang: "cpp",
          code: `#include <iostream>
#include <memory>
#include <string>
#include <utility>
#include <vector>

struct Conn {
    std::string host;
    explicit Conn(std::string h) : host(std::move(h)) {
        std::cout << "    open  " << host << '\\n';
    }
    ~Conn() { std::cout << "    close " << host << '\\n'; }
    void ping() const { std::cout << "    ping  " << host << '\\n'; }
};

// Ownership is in the TYPE: this function takes over the object.
void consume(std::unique_ptr<Conn> c) {
    std::cout << "  consume() now owns it\\n";
    c->ping();
}   // destroyed here

// Borrowing: takes a reference, does not own, cannot delete.
void borrow(const Conn& c) { c.ping(); }

int main() {
    std::cout << "make_unique:\\n";
    auto a = std::make_unique<Conn>("db-1");
    a->ping();

    std::cout << "sizeof(unique_ptr<Conn>) = " << sizeof(a)
              << ", sizeof(Conn*) = " << sizeof(Conn*) << '\\n';

    std::cout << "borrowing does not transfer:\\n";
    borrow(*a);

    std::cout << "moving DOES transfer:\\n";
    consume(std::move(a));
    std::cout << "  after the move, a is " << (a ? "non-null" : "null") << '\\n';

    std::cout << "\\ncopying is a compile error:\\n";
    // auto b = a;                      // ERROR: use of deleted function
    std::cout << "  auto b = a;  // deleted copy constructor\\n";

    std::cout << "\\nin a container, each element owns its object:\\n";
    {
        std::vector<std::unique_ptr<Conn>> pool;
        pool.push_back(std::make_unique<Conn>("db-2"));
        pool.push_back(std::make_unique<Conn>("db-3"));
        std::cout << "  pool holds " << pool.size() << '\\n';
    }   // both closed here

    std::cout << "\\nrelease() hands the raw pointer back (you must delete it):\\n";
    auto c = std::make_unique<Conn>("db-4");
    Conn* raw = c.release();
    std::cout << "  unique_ptr is now " << (c ? "non-null" : "null") << '\\n';
    delete raw;

    std::cout << "\\nreset() replaces the managed object:\\n";
    auto d = std::make_unique<Conn>("db-5");
    d.reset(new Conn{"db-6"});      // db-5 closed after db-6 is built
    std::cout << "  done\\n";
}`,
          output: `make_unique:
    open  db-1
    ping  db-1
sizeof(unique_ptr<Conn>) = 8, sizeof(Conn*) = 8
borrowing does not transfer:
    ping  db-1
moving DOES transfer:
  consume() now owns it
    ping  db-1
    close db-1
  after the move, a is null

copying is a compile error:
  auto b = a;  // deleted copy constructor

in a container, each element owns its object:
    open  db-2
    open  db-3
  pool holds 2
    close db-2
    close db-3

release() hands the raw pointer back (you must delete it):
    open  db-4
  unique_ptr is now null
    close db-4

reset() replaces the managed object:
    open  db-5
    open  db-6
    close db-5
  done
    close db-6`,
          explanation:
            "**`sizeof` is 8 for both — the abstraction is free.** Notice the transfer: after `consume(std::move(a))`, `a` is null and `db-1` was closed inside `consume`, because ownership genuinely moved. `borrow` took a `const Conn&` and could not have deleted anything, which is exactly what a non-owning parameter should look like. And note the `reset` ordering at the end: `db-6` is constructed *before* `db-5` is closed, which is the same allocate-before-deallocate discipline from module 5.",
        },
      ],
      pitfalls: [
        {
          title: "`get()` and `release()` are not the same, and only one of them is usually right",
          body: "`get()` returns the raw pointer while the `unique_ptr` keeps ownership — use it to pass a non-owning pointer to a C API or legacy function, and never `delete` it. `release()` returns the raw pointer and *gives up* ownership, so you become responsible for deleting it; it is for handing an object to something that will take over, such as a C API that frees what you give it. Calling `delete p.get()` is a double free, and calling `release()` and forgetting the result is a leak. If you find yourself reaching for either, check first whether passing a reference, or the `unique_ptr` itself by value, says what you meant.",
        },
      ],
    },
    {
      id: "signatures",
      heading: "What a signature should say",
      body: [
        "Once ownership is expressible, the parameter type becomes documentation the compiler enforces. The Core Guidelines give a short vocabulary.",
        "**`void f(std::unique_ptr<T> p)`** — f takes ownership. Callers must `std::move` into it, so the transfer is visible at every call site.",
        "**`void f(std::unique_ptr<T>& p)`** — f may replace or reset the caller's pointer. Rare, and worth a comment when it appears.",
        "**`void f(T* p)` or `void f(T& p)`** — f borrows. It reads or mutates the object and has no say in its lifetime. **Prefer the reference** unless null is meaningful; `T*` says \"this may be absent\".",
        "**`std::unique_ptr<T> f()`** — f produces an object the caller owns. This is the standard way to return a polymorphic object, and it is what a factory should look like.",
        "**Never take `const std::unique_ptr<T>&`.** It is a strictly worse `const T&`: it forces the caller to have a `unique_ptr` specifically, rules out stack objects and `shared_ptr`s, and gains nothing — the function still cannot take ownership.",
        "The rule underneath all of them: **pass smart pointers only when the function participates in lifetime. Otherwise pass a reference.**",
      ],
      examples: [
        {
          id: "factory",
          title: "A factory returning a polymorphic object",
          lang: "cpp",
          code: `#include <iostream>
#include <memory>
#include <string>
#include <string_view>
#include <vector>

class Shape {
public:
    virtual ~Shape() = default;             // module 6: required here
    virtual double area() const = 0;
    virtual std::string name() const = 0;
};

class Circle : public Shape {
public:
    explicit Circle(double r) : r_(r) {}
    double area() const override { return 3.14159 * r_ * r_; }
    std::string name() const override { return "circle"; }
private:
    double r_;
};

class Square : public Shape {
public:
    explicit Square(double s) : s_(s) {}
    double area() const override { return s_ * s_; }
    std::string name() const override { return "square"; }
private:
    double s_;
};

// Returns ownership. The caller decides how long it lives.
std::unique_ptr<Shape> makeShape(std::string_view kind, double v) {
    if (kind == "circle") return std::make_unique<Circle>(v);
    if (kind == "square") return std::make_unique<Square>(v);
    return nullptr;
}

// Borrows. Says nothing about lifetime, works for any Shape anywhere.
void report(const Shape& s) {
    std::cout << "  " << s.name() << " area " << s.area() << '\\n';
}

// Takes ownership and stores it.
class Canvas {
public:
    void add(std::unique_ptr<Shape> s) { shapes_.push_back(std::move(s)); }
    double totalArea() const {
        double t = 0;
        for (const auto& s : shapes_) t += s->area();
        return t;
    }
private:
    std::vector<std::unique_ptr<Shape>> shapes_;
};

int main() {
    auto c = makeShape("circle", 2.0);
    report(*c);                       // borrow: dereference, pass a reference

    Canvas canvas;
    canvas.add(std::move(c));         // transfer: visible at the call site
    canvas.add(makeShape("square", 3.0));   // rvalue moves automatically

    std::cout << "  c is now " << (c ? "non-null" : "null") << '\\n';
    std::cout << "  total area " << canvas.totalArea() << '\\n';

    // A stack Shape works with report() too -- because it borrows.
    Square onStack{4.0};
    report(onStack);
}`,
          output: `  circle area 12.5664
  c is now null
  total area 21.5664
  square area 16`,
          explanation:
            "**`report` accepted both a heap object owned by a `unique_ptr` and a plain stack object**, because it borrows and therefore does not care. Had it taken `const std::unique_ptr<Shape>&`, the last line would not compile at all. `canvas.add(std::move(c))` makes the transfer explicit, and `makeShape(...)` passed directly needs no `move` because it is already an rvalue. This set of signatures is what most modern C++ ownership looks like.",
        },
      ],
    },
    {
      id: "deleters",
      heading: "Custom deleters",
      body: [
        "`unique_ptr`'s second template parameter is the **deleter** — the callable invoked on destruction. It defaults to `std::default_delete<T>`, which calls `delete`.",
        "Supplying your own turns **any** resource with a paired acquire/release API into an RAII type without writing a class: `FILE*` and `fclose`, a socket and `close`, a SQLite handle and `sqlite3_close`, an OpenSSL context and its free function.",
        "**A stateless deleter costs nothing.** Because it is an empty class type, the empty base optimisation applies and `sizeof` stays at one pointer. **A function-pointer deleter costs an extra pointer**, because the pointer has to be stored — the example below measures the difference. Prefer a small struct with `operator()` or a lambda type over a raw function pointer.",
        "**`unique_ptr<T[]>` is a separate specialisation** that calls `delete[]` and provides `operator[]` instead of `operator*` and `operator->`. It exists so array ownership is correct, though `std::vector` is usually the better answer.",
      ],
      examples: [
        {
          id: "custom-deleter",
          title: "Wrapping a C `FILE*`, and the size each deleter costs",
          lang: "cpp",
          code: `#include <cstdio>
#include <iostream>
#include <memory>

// A custom deleter turns any C resource into an RAII type with no class.
struct FileCloser {
    void operator()(std::FILE* f) const {
        if (f) { std::cout << "  fclose\\n"; std::fclose(f); }
    }
};
using FilePtr = std::unique_ptr<std::FILE, FileCloser>;

// A stateless deleter costs nothing; a function-pointer deleter costs a pointer.
using FilePtrFn = std::unique_ptr<std::FILE, int(*)(std::FILE*)>;

struct Widget { int x; };

int main() {
    std::cout << "sizeof comparisons:\\n";
    std::cout << "  unique_ptr<Widget>                    = "
              << sizeof(std::unique_ptr<Widget>) << '\\n';
    std::cout << "  unique_ptr<FILE, FileCloser> (empty)  = "
              << sizeof(FilePtr) << '\\n';
    std::cout << "  unique_ptr<FILE, fn ptr>              = "
              << sizeof(FilePtrFn) << '\\n';
    std::cout << "  shared_ptr<Widget>                    = "
              << sizeof(std::shared_ptr<Widget>) << '\\n';

    std::cout << "\\nRAII over a C FILE*:\\n";
    {
        FilePtr f{std::fopen("/tmp/demo.txt", "w")};
        if (f) {
            std::fputs("written through a unique_ptr\\n", f.get());
            std::cout << "  wrote\\n";
        }
    }   // fclose runs here, even on an early return or an exception

    std::cout << "\\nunique_ptr<T[]> for arrays:\\n";
    auto arr = std::make_unique<int[]>(5);
    arr[3] = 42;
    std::cout << "  arr[3] = " << arr[3] << "  (delete[] is used, not delete)\\n";
}`,
          output: `sizeof comparisons:
  unique_ptr<Widget>                    = 8
  unique_ptr<FILE, FileCloser> (empty)  = 8
  unique_ptr<FILE, fn ptr>              = 16
  shared_ptr<Widget>                    = 16

RAII over a C FILE*:
  wrote
  fclose

unique_ptr<T[]> for arrays:
  arr[3] = 42  (delete[] is used, not delete)`,
          explanation:
            "**The empty struct deleter is free and the function pointer doubles the size** — 8 bytes against 16, measured. That is the empty base optimisation at work, and it is why library wrappers use a struct with `operator()` rather than passing `&fclose`. Note `f.get()` handing the raw `FILE*` to a C function while retaining ownership, which is exactly what `get` is for. The `fclose` line appears at the closing brace with no cleanup code written anywhere.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does `std::unique_ptr` guarantee, and what does it cost?",
      answer:
        "It owns exactly one object and deletes it in its destructor, and it cannot be copied — both copy operations are deleted — so two `unique_ptr`s can never own the same object and a double free is unrepresentable rather than merely unlikely. Because the destructor runs on every exit path including stack unwinding, an early return or a thrown exception cannot leak. It costs nothing: `sizeof(unique_ptr<T>)` equals `sizeof(T*)` for a stateless deleter, and optimised code matches hand-written `new`/`delete`. There is no reference count and no control block.",
    },
    {
      question: "How do you transfer ownership of a `unique_ptr`, and why is it done that way?",
      answer:
        "With `std::move`, which invokes the move constructor or move assignment and leaves the source null. Copying is deleted deliberately: allowing it would mean two owners and therefore a double free. Requiring `std::move` makes every transfer visible at the call site, so reading the code tells you where ownership changes hands — which is the property a raw pointer cannot give you. Returning a `unique_ptr` from a function needs no `move`, since the result is already an rvalue.",
    },
    {
      question: "How should ownership appear in a function signature?",
      answer:
        "`unique_ptr<T>` by value means the function takes ownership, and callers must `std::move` into it. `unique_ptr<T>&` means it may replace the caller's pointer, which is rare. `T&` or `T*` means it borrows and has no say in the lifetime — prefer the reference unless null is meaningful. Returning `unique_ptr<T>` means the caller receives ownership, which is what a factory looks like. Never take `const unique_ptr<T>&`: it is a strictly worse `const T&`, since it forces the caller to have a `unique_ptr` specifically, rejects stack objects, and still cannot take ownership. The rule is to pass a smart pointer only when the function participates in the lifetime.",
    },
    {
      question: "What is the difference between `get()` and `release()`?",
      answer:
        "`get()` returns the raw pointer while the `unique_ptr` retains ownership — for passing a non-owning pointer to a C API or legacy function, and you must never `delete` the result. `release()` returns the raw pointer and relinquishes ownership, so the caller becomes responsible for deleting it — for handing an object to something that will take over. Confusing them gives you either a double free, from `delete p.get()`, or a leak, from ignoring what `release()` returned. Both are worth a second look when they appear, since a reference or passing the `unique_ptr` itself is often what was meant.",
    },
    {
      question: "What is a custom deleter and what does it cost?",
      answer:
        "The second template parameter of `unique_ptr`, a callable invoked on destruction, defaulting to `std::default_delete<T>` which calls `delete`. Supplying your own turns any acquire/release C API into an RAII type without writing a class — `FILE*` with `fclose`, a socket with `close`, a database handle with its close function. A stateless deleter, an empty struct with `operator()`, costs nothing because the empty base optimisation keeps `sizeof` at one pointer. A function-pointer deleter must be stored and doubles the size to 16 bytes, which is why library wrappers prefer the struct form.",
    },
    {
      question: "Why prefer `std::make_unique` to `new`?",
      answer:
        "It never mentions `new`, so ownership is established at the point of allocation and there is no window where a raw pointer exists unowned. Historically it also closed an exception-safety hole: in `f(std::unique_ptr<A>(new A), g())`, a compiler was allowed to evaluate `new A`, then `g()`, then the `unique_ptr` constructor — so a throw from `g()` leaked the `A`. C++17 tightened the evaluation order and removed that hazard, but `make_unique` remains shorter, states the type once, and keeps the codebase free of bare `new`. Its one limitation is that it cannot supply a custom deleter, so those are constructed directly.",
    },
  ],
  takeaways: [
    "A raw `T*` says nothing about ownership; `unique_ptr<T>` puts the answer in the type",
    "Copying is deleted, so two owners are unrepresentable and a double free cannot happen",
    "`sizeof(unique_ptr<T>) == sizeof(T*)` — the abstraction is free",
    "Transfer with `std::move`, which makes every handover visible at the call site",
    "Returning a `unique_ptr` needs no `move` — the result is already an rvalue",
    "Take `unique_ptr<T>` by value to take ownership, `T&` to borrow",
    "Never take `const unique_ptr<T>&` — it is a worse `const T&`",
    "`get()` keeps ownership; `release()` gives it up — confusing them leaks or double-frees",
    "A stateless deleter is free; a function-pointer deleter doubles the size to 16 bytes",
    "A custom deleter turns any C acquire/release pair into RAII with no class written",
    "`unique_ptr<T[]>` calls `delete[]` and offers `operator[]`, though `vector` is usually better",
  ],
  status: "available",
};
