import type { Lesson } from "@/content/types";

export const moveOperationsLesson: Lesson = {
  id: "cpp-move-operations",
  slug: "move-constructor-and-assignment",
  moduleSlug: "copy-move-rule-of-five",
  title: "The Move Constructor & Move Assignment",
  summary:
    "Stealing instead of copying. How to write both move operations, why the source must be left valid rather than merely abandoned, and the one-word difference that decides whether `std::vector` moves your objects or copies them.",
  estimatedMinutes: 35,
  objectives: [
    "Write a move constructor and move assignment operator",
    "Explain why the moved-from object must be left in a valid state",
    "Use `std::exchange` to write both in a single line each",
    "Explain why `noexcept` on a move constructor changes `std::vector`'s behaviour",
    "Recognise when a move is genuinely cheaper than a copy, and when it is not",
  ],
  sections: [
    {
      id: "the-idea",
      heading: "Stealing rather than duplicating",
      body: [
        "Copying a `std::vector` of a million elements allocates a second million-element buffer and copies every element. If the source is a temporary about to be destroyed, all of that work is thrown away a moment later.",
        "**A move takes the source's internal pointer instead of duplicating what it points at.** For a vector, string, or any type holding a heap buffer, the whole operation is a handful of pointer assignments regardless of how much data there is.",
        "Two functions implement it, mirroring the copy operations.",
        "**The move constructor** — `T(T&& other) noexcept` — builds a new object by taking `other`'s resources.",
        "**Move assignment** — `T& operator=(T&& other) noexcept` — releases what this object currently holds, then takes `other`'s.",
        "Both take `T&&`, which by the previous lesson binds only to rvalues — a temporary, or something the caller explicitly marked with `std::move`. That is the language's guarantee that stealing is safe.",
        "**The source must be left valid.** Not \"correct\", not \"unchanged\" — *valid*: its destructor must run without harm, and assigning a new value to it must work. Setting stolen pointers to `nullptr` and sizes to zero is the usual way.",
      ],
      examples: [
        {
          id: "move-ops",
          title: "Both operations, and which one runs when",
          lang: "cpp",
          code: `#include <cstring>
#include <iostream>
#include <utility>

class Buffer {
public:
    explicit Buffer(std::size_t n) : size_(n), data_(new int[n]{}) {
        std::cout << "  ctor(" << size_ << ")\\n";
    }
    Buffer(const Buffer& o) : size_(o.size_), data_(new int[o.size_]) {
        std::memcpy(data_, o.data_, size_ * sizeof(int));
        std::cout << "  COPY(" << size_ << ") -- allocated\\n";
    }
    // Move: steal the pointer, leave the source empty but valid.
    Buffer(Buffer&& o) noexcept : size_(o.size_), data_(o.data_) {
        o.size_ = 0;
        o.data_ = nullptr;
        std::cout << "  MOVE(" << size_ << ") -- no allocation\\n";
    }
    Buffer& operator=(const Buffer& o) {
        if (this == &o) return *this;
        int* fresh = new int[o.size_];
        std::memcpy(fresh, o.data_, o.size_ * sizeof(int));
        delete[] data_;
        data_ = fresh; size_ = o.size_;
        std::cout << "  copy-assign(" << size_ << ")\\n";
        return *this;
    }
    Buffer& operator=(Buffer&& o) noexcept {
        if (this == &o) return *this;
        delete[] data_;                 // release what we hold
        data_ = o.data_; size_ = o.size_;
        o.data_ = nullptr; o.size_ = 0; // leave the source valid
        std::cout << "  move-assign(" << size_ << ")\\n";
        return *this;
    }
    ~Buffer() { delete[] data_; std::cout << "  dtor(" << size_ << ")\\n"; }

    std::size_t size() const { return size_; }
private:
    std::size_t size_;
    int*        data_;
};

Buffer make(std::size_t n) { return Buffer{n}; }

int main() {
    std::cout << "-- copy from an lvalue --\\n";
    Buffer a{3};
    Buffer b = a;

    std::cout << "-- move from an rvalue --\\n";
    Buffer c = make(5);

    std::cout << "-- move from a named object with std::move --\\n";
    Buffer d = std::move(a);
    std::cout << "  a.size() after move = " << a.size() << '\\n';

    std::cout << "-- move assignment --\\n";
    b = std::move(c);

    std::cout << "-- end of main --\\n";
}`,
          output: `-- copy from an lvalue --
  ctor(3)
  COPY(3) -- allocated
-- move from an rvalue --
  ctor(5)
-- move from a named object with std::move --
  MOVE(3) -- no allocation
  a.size() after move = 0
-- move assignment --
  move-assign(5)
-- end of main --
  dtor(3)
  dtor(0)
  dtor(5)
  dtor(0)`,
          explanation:
            "**`Buffer c = make(5);` printed only `ctor(5)` — no move at all.** The compiler constructed the return value directly in `c`'s storage, so there was nothing to move. That is guaranteed copy elision, and lesson 6 covers it; it is worth noticing now because it means many moves you expect never happen. Also note the four destructors at the end: two report size 0, which are the moved-from `a` and `c` being destroyed harmlessly — exactly what \"left valid\" buys you.",
        },
      ],
    },
    {
      id: "exchange",
      heading: "std::exchange makes both operations one line each",
      body: [
        "`std::exchange(obj, new_value)` sets `obj` to `new_value` and returns its **old** value. It is from `<utility>` and it exists almost entirely for this purpose.",
        "That is precisely the \"take it and reset it\" shape a move needs, so a move constructor's initialiser list can do the whole job with no body at all.",
        "The idiom is worth adopting because the manual version has a specific failure mode: it is easy to copy the pointer and forget to null the source, which produces two objects owning the same buffer and a double free at scope exit. `std::exchange` makes forgetting impossible, because the reset is part of the same expression as the read.",
      ],
      examples: [
        {
          id: "exchange-idiom",
          title: "The same class, written the idiomatic way",
          lang: "cpp",
          code: `#include <iostream>
#include <utility>

class Buffer {
public:
    explicit Buffer(std::size_t n) : size_(n), data_(n ? new int[n]{} : nullptr) {}

    // Take, and reset the source, in one expression each.
    Buffer(Buffer&& o) noexcept
        : size_(std::exchange(o.size_, 0)),
          data_(std::exchange(o.data_, nullptr)) {}

    Buffer& operator=(Buffer&& o) noexcept {
        if (this == &o) return *this;
        delete[] data_;
        size_ = std::exchange(o.size_, 0);
        data_ = std::exchange(o.data_, nullptr);
        return *this;
    }

    ~Buffer() { delete[] data_; }

    std::size_t size() const { return size_; }

private:
    std::size_t size_;
    int*        data_;
};

int main() {
    Buffer a{4};
    Buffer b = std::move(a);
    std::cout << "b.size()=" << b.size() << "  a.size()=" << a.size() << '\\n';

    Buffer c{2};
    c = std::move(b);
    std::cout << "c.size()=" << c.size() << "  b.size()=" << b.size() << '\\n';
}`,
          output: `b.size()=4  a.size()=0
c.size()=4  b.size()=0`,
          explanation:
            "Both operations transferred the size *and* the buffer and left the source at zero, and the program is clean under AddressSanitizer. **The whole move constructor is two initialisers and an empty body.** Note the ordering requirement from module 4 still applies: `size_` is declared before `data_`, so it is initialised first — and because each `exchange` touches a different member, the order does not matter here. If one initialiser depended on another, it would.",
        },
      ],
    },
    {
      id: "noexcept",
      heading: "Why noexcept on a move constructor is not optional",
      body: [
        "This is the most consequential single keyword in the module.",
        "When `std::vector` grows, it allocates a larger buffer and transfers the existing elements. It would prefer to move them — that is the whole point of move semantics.",
        "But consider what happens if a move throws halfway through. Some elements are in the new buffer, some are gutted in the old one, and there is no way back: the originals have already been stolen from. The vector would be left corrupted by an operation that is supposed to either succeed or leave things as they were.",
        "So the library makes a decision: **`std::vector` moves the elements only if their move constructor is `noexcept`. Otherwise it copies them**, because a failed copy leaves the originals intact and the operation can be safely abandoned.",
        "The mechanism is `std::move_if_noexcept`, and the consequence is blunt: **a move constructor without `noexcept` is frequently never used at all.** You wrote it, it compiles, and every vector reallocation copies instead.",
        "Move operations that only shuffle pointers and integers genuinely cannot throw, so marking them `noexcept` is honest as well as necessary. Mark both the move constructor and move assignment, and mark `swap` too.",
      ],
      examples: [
        {
          id: "noexcept-vector",
          title: "One keyword, measured",
          lang: "cpp",
          code: `#include <iostream>
#include <vector>

template <bool NoexceptMove>
struct Widget {
    int id;
    explicit Widget(int i) : id(i) {}
    Widget(const Widget& o) : id(o.id) { std::cout << "C"; }
    Widget(Widget&& o) noexcept(NoexceptMove) : id(o.id) { std::cout << "M"; }
};

template <bool NoexceptMove>
void grow(const char* label) {
    std::cout << label << ": ";
    std::vector<Widget<NoexceptMove>> v;
    v.reserve(2);
    v.emplace_back(1);
    v.emplace_back(2);
    std::cout << "[reallocating] ";
    v.emplace_back(3);          // forces a reallocation of the existing 2
    std::cout << '\\n';
}

int main() {
    grow<true>("move is noexcept    ");
    grow<false>("move is NOT noexcept");
    std::cout << "C = copy, M = move\\n";
}`,
          output: `move is noexcept    : [reallocating] MM
move is NOT noexcept: [reallocating] CC
C = copy, M = move`,
          explanation:
            "**`MM` against `CC`.** The two classes are identical apart from one keyword, and the reallocation moved in one case and copied in the other. For `Widget` that is trivial; for a vector of vectors, or strings, or anything owning a buffer, it is the difference between a pointer shuffle and copying every byte. **If you write a move constructor, mark it `noexcept`** — and if you cannot honestly do so, expect it to be ignored.",
        },
      ],
      pitfalls: [
        {
          title: "`noexcept` is a promise: breaking it calls `std::terminate`",
          body: "It is not a hint or a hope. If an exception escapes a `noexcept` function, the program terminates immediately — no unwinding, no handler. So do not mark a move `noexcept` if it allocates, or calls something that might throw. The good news is that a correct move should not need to: it takes pointers and resets the source, and neither operation can fail. If your move *does* need to allocate, that is a signal the design should change, not that the promise should be made anyway.",
        },
      ],
    },
    {
      id: "when-cheap",
      heading: "When a move is actually cheaper",
      body: [
        "Moving is not free, and it is not always faster. It helps exactly when the object owns something expensive to duplicate.",
        "**Big wins:** `std::vector`, `std::string` beyond the small-string optimisation, `std::map`, `std::unique_ptr`, and any class of yours holding a heap buffer. Cost goes from proportional to the data to constant.",
        "**No difference:** `int`, `double`, a pointer, a small struct of those. There is nothing to steal, so a move is a copy. Moving an `int` is exactly as expensive as copying one.",
        "**No difference:** `std::array<int, 100>`, which stores its elements inline. There is no pointer to swap, so a move copies all 100 integers.",
        "**Actively slower:** a short `std::string` under the small-string optimisation, where the characters live inside the object. Measured below, moving a five-character string costs about **twice** what copying it does, because the move does everything the copy does and then resets the source.",
        "**Which is why `std::move` on a small type is not an optimisation** — it is noise at best. Reserve it for objects that own something.",
      ],
      examples: [
        {
          id: "move-cost",
          title: "Where the saving actually is",
          lang: "cpp",
          code: `#include <array>
#include <chrono>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

// Stops the optimiser deleting work whose result is unused.
template <typename T>
inline void keep(T&& value) {
    asm volatile("" : : "g"(&value) : "memory");
}

template <typename T, typename Make>
void compare(const char* label, Make make) {
    using clock = std::chrono::steady_clock;
    constexpr int kRuns = 1'000'000;

    auto t0 = clock::now();
    for (int i = 0; i < kRuns; ++i) { T src = make(); keep(src); T dst = src;            keep(dst); }
    auto t1 = clock::now();
    for (int i = 0; i < kRuns; ++i) { T src = make(); keep(src); T dst = std::move(src); keep(dst); }
    auto t2 = clock::now();

    auto ns = [&](auto d) {
        return std::chrono::duration<double, std::nano>(d).count() / kRuns;
    };
    std::cout << label << "  copy " << ns(t1 - t0) << " ns/op"
              << "   move " << ns(t2 - t1) << " ns/op\\n";
}

int main() {
    compare<std::vector<int>>("vector<int>(1000) ", [] { return std::vector<int>(1000, 7); });
    compare<std::string>     ("string(1000 chars)", [] { return std::string(1000, 'x'); });
    compare<std::string>     ("string(5 chars)   ", [] { return std::string(5, 'x'); });
    compare<std::array<int,256>>("array<int,256>    ", [] { return std::array<int,256>{}; });
    compare<int>             ("int               ", [] { return 42; });
}`,
          output: `$ g++ -std=c++20 -O2 bench.cpp -o bench && ./bench
vector<int>(1000)   copy 408.666 ns/op   move 226.432 ns/op
string(1000 chars)  copy 133.851 ns/op   move 79.923 ns/op
string(5 chars)     copy 12.8748 ns/op   move 24.0249 ns/op
array<int,256>      copy 107.237 ns/op   move 108.537 ns/op
int                 copy 1.28575 ns/op   move 1.18624 ns/op`,
          explanation:
            "**The five-character string moves roughly twice as slowly as it copies** — 24ns against 13ns. Small-string optimisation stores the characters inside the object, so there is no buffer to steal and the move does everything the copy does *plus* reset the source. The vector and long string move in a little over half the time; `std::array` and `int` show no difference at all. **The `keep()` barrier is essential**: without it, `-O2` deleted the small-type loops entirely and reported 0.00005ms for 200,000 iterations, which is physically impossible. That is the microbenchmark trap from module 13 in miniature — always check that your numbers are possible.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does a move constructor do, and what must it leave behind?",
      answer:
        "It builds a new object by taking the source's resources — typically copying an internal pointer and size — instead of duplicating what they point at, so the cost is constant rather than proportional to the data. It must leave the source in a **valid** state: its destructor must run harmlessly and assigning a new value to it must work. Setting stolen pointers to `nullptr` and sizes to zero is the standard approach. \"Valid\" does not mean unchanged or meaningful — only that the object can still be destroyed and reassigned.",
    },
    {
      question: "Why must a move constructor be marked `noexcept`?",
      answer:
        "Because `std::vector` will only move elements during reallocation if their move constructor is `noexcept`; otherwise it copies them. The reason is the strong exception guarantee: if a move threw halfway through a reallocation, some elements would be in the new buffer and the originals already gutted, with no way to recover. A failed *copy* leaves the originals intact, so it can be abandoned safely. The consequence is that an unmarked move constructor is frequently never called at all — you wrote it, and every reallocation copies.",
    },
    {
      question: "What is `std::exchange` and why is it used in move operations?",
      answer:
        "It assigns a new value to an object and returns the old one, so `data_(std::exchange(o.data_, nullptr))` takes the source's pointer and nulls it in a single expression. That is exactly the shape a move needs. It matters because the manual version has a specific failure mode — copying the pointer and forgetting to reset the source, producing two owners and a double free — and `std::exchange` makes that impossible by fusing the read and the reset.",
    },
    {
      question: "Is moving always faster than copying?",
      answer:
        "No. It helps when the object owns something expensive to duplicate — a vector, a long string, a map, a `unique_ptr` — where the cost drops from proportional to the data to constant. It makes no difference for `int` or `std::array`, which store their data inline. And for a short `std::string` under the small-string optimisation it is measurably *slower*: I benchmarked a five-character string at about 13ns to copy and 24ns to move, because the characters live inside the object so the move does everything the copy does and then resets the source. So `std::move` on a small type is not an optimisation.",
    },
    {
      question: "Why does move assignment need a self-assignment check when the move constructor does not?",
      answer:
        "Because the constructor is building a new object, so `this` cannot be the same object as the source. Move assignment operates on an existing object, and `a = std::move(a)` is reachable through references and aliases. Without a guard, the usual implementation frees its own buffer and then takes a pointer from the source — which is the same, now-freed, pointer. The copy-and-swap idiom in lesson 7 avoids needing the check at all, since swapping with yourself is harmless.",
    },
  ],
  takeaways: [
    "A move steals the source's internal pointers instead of duplicating what they point at",
    "`T&&` binds only to rvalues, which is the language's guarantee that stealing is safe",
    "The moved-from object must be left **valid**: destructible and assignable, not necessarily meaningful",
    "`std::exchange(o.ptr, nullptr)` fuses the take and the reset, so you cannot forget one",
    "**Mark both move operations `noexcept`** — without it `std::vector` copies instead of moving",
    "`noexcept` is a promise; an escaping exception calls `std::terminate`",
    "Move assignment needs a self-assignment guard; the move constructor does not",
    "Moving helps only for objects owning heap data — for `int` and `std::array` it is no gain, and for a short string it is measurably slower",
  ],
  status: "available",
};
