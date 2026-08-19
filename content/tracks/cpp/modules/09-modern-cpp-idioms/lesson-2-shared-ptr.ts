import type { Lesson } from "@/content/types";

export const sharedPtrLesson: Lesson = {
  id: "cpp-shared-ptr",
  slug: "shared-ptr-weak-ptr-and-control-blocks",
  moduleSlug: "modern-cpp-idioms",
  title: "shared_ptr, weak_ptr, Control Blocks & Reference Cycles",
  summary:
    "Shared ownership, what it costs, and the cycle that leaks despite it. The control block and its two counts, why `make_shared` allocates once instead of twice, and a parent/child pair that LeakSanitizer catches leaking 160 bytes until one pointer is made weak.",
  estimatedMinutes: 40,
  objectives: [
    "Describe the control block and both reference counts",
    "State what `shared_ptr` costs in space and time against `unique_ptr`",
    "Explain what `make_shared` optimises and when not to use it",
    "Diagnose a reference cycle and break it with `weak_ptr`",
    "Use `lock()` correctly, and know when `enable_shared_from_this` is needed",
  ],
  sections: [
    {
      id: "control-block",
      heading: "The control block",
      body: [
        "A `shared_ptr<T>` is **two pointers**: one to the object, one to a heap-allocated *control block*. That is why it is 16 bytes where `unique_ptr` is 8.",
        "The control block holds **two separate counts** and the deleter.",
        "**The strong count** is how many `shared_ptr`s own the object. When it reaches zero, **the object is destroyed** — its destructor runs and its storage is released if it was separately allocated.",
        "**The weak count** is how many `weak_ptr`s refer to it. When *both* counts reach zero, **the control block itself is freed.** That is why a `weak_ptr` can safely ask whether the object still exists: the block it reads from outlives the object.",
        "**The counts are atomic**, because a `shared_ptr` may be copied on any thread. That makes copying a `shared_ptr` meaningfully more expensive than copying a raw or unique pointer — an atomic increment, and an atomic decrement plus a branch on destruction. In a hot loop passing `shared_ptr` by value rather than by `const&` is a measurable cost, and it is the most common `shared_ptr` performance mistake.",
        "**Thread-safety is only for the count.** Two threads may copy and destroy `shared_ptr`s to the same object freely; two threads writing to the *object* still need a mutex. The pointer is thread-safe, the pointee is not.",
      ],
      examples: [
        {
          id: "counts",
          title: "Both counts, watched",
          lang: "cpp",
          code: `#include <iostream>
#include <memory>
#include <string>

struct Res {
    std::string tag;
    explicit Res(std::string t) : tag(std::move(t)) {
        std::cout << "    ctor " << tag << '\\n';
    }
    ~Res() { std::cout << "    dtor " << tag << '\\n'; }
};

int main() {
    std::cout << "sizeof(unique_ptr) = " << sizeof(std::unique_ptr<Res>)
              << ", sizeof(shared_ptr) = " << sizeof(std::shared_ptr<Res>)
              << ", sizeof(weak_ptr) = " << sizeof(std::weak_ptr<Res>) << '\\n';

    std::cout << "\\nreference counting:\\n";
    auto a = std::make_shared<Res>("A");
    std::cout << "  use_count after make_shared: " << a.use_count() << '\\n';
    {
        auto b = a;                      // COPY -> count goes up
        std::cout << "  after copying:            " << a.use_count() << '\\n';
        auto c = a;
        std::cout << "  after another copy:       " << a.use_count() << '\\n';
    }   // b and c die -> count comes back down
    std::cout << "  after they go out of scope: " << a.use_count() << '\\n';

    std::cout << "\\nweak_ptr does NOT keep the object alive:\\n";
    std::weak_ptr<Res> w;
    {
        auto strong = std::make_shared<Res>("B");
        w = strong;
        std::cout << "  use_count = " << strong.use_count()
                  << ", weak expired? " << w.expired() << '\\n';
        if (auto locked = w.lock())
            std::cout << "  lock() succeeded, count now "
                      << locked.use_count() << '\\n';
    }   // strong dies -> B is destroyed even though w still exists
    std::cout << "  after scope, weak expired? " << w.expired() << '\\n';
    std::cout << "  lock() gives " << (w.lock() ? "a pointer" : "nullptr") << '\\n';
}`,
          output: `sizeof(unique_ptr) = 8, sizeof(shared_ptr) = 16, sizeof(weak_ptr) = 16

reference counting:
    ctor A
  use_count after make_shared: 1
  after copying:            2
  after another copy:       3
  after they go out of scope: 1

weak_ptr does NOT keep the object alive:
    ctor B
  use_count = 1, weak expired? 0
  lock() succeeded, count now 2
    dtor B
  after scope, weak expired? 1
  lock() gives nullptr
    dtor A`,
          explanation:
            "**`B` was destroyed at the end of its scope even though `w` still referred to it**, because `weak_ptr` does not contribute to the strong count — that is exactly its purpose. `lock()` is the only way to use a `weak_ptr`: it atomically checks the strong count and, if non-zero, returns a `shared_ptr` that keeps the object alive for as long as you hold it. Note `use_count` rising to 2 inside the `if` — the lock is a real owner. After the object dies, `lock()` returns null rather than a dangling pointer, which is the guarantee a raw back-pointer cannot give you.",
        },
      ],
      pitfalls: [
        {
          title: "`use_count()` is for debugging only",
          body: "It is racy by construction: in multithreaded code the value can change between the read and your use of it, so `if (p.use_count() == 1) { /* I am the only owner */ }` is a data race waiting to happen. It is also not a reliable ownership test even single-threaded, since a `weak_ptr` locking elsewhere changes it. Use it in a debugger or a diagnostic print and never in a branch that affects behaviour. If you need to know whether you are the sole owner, restructure so the answer is a static property of the design.",
        },
      ],
    },
    {
      id: "make-shared",
      heading: "`make_shared` and the two allocations",
      body: [
        "`std::shared_ptr<T> p(new T)` performs **two** allocations: one for the object, one for the control block. `std::make_shared<T>()` performs **one**, placing both in a single block.",
        "That is the headline benefit — fewer allocations, and the object and its counts on the same cache line. `make_shared` also closes the same exception-safety window `make_unique` does.",
        "**There are two reasons not to use it**, and they are worth knowing because they are real.",
        "**A `weak_ptr` keeps the whole block alive.** With `make_shared` the object's *storage* is part of the control block, so although the destructor runs when the strong count hits zero, **the memory is not released until the last `weak_ptr` also goes**. For a large object with long-lived weak observers, that is a retention problem the two-allocation form does not have.",
        "**Custom deleters are not supported**, since `make_shared` decides how to destroy the object itself. Use the constructor for those.",
        "**`shared_ptr` also supports aliasing**: a `shared_ptr` that keeps one object alive while pointing at a *member* of it. That is how you hand out a pointer to a sub-object without the owner being destroyed underneath it.",
      ],
      examples: [
        {
          id: "make-shared-allocs",
          title: "Counting the allocations each form makes",
          lang: "cpp",
          code: `#include <cstdlib>
#include <iostream>
#include <memory>

static int allocations = 0;
void* operator new(std::size_t n) { ++allocations; return std::malloc(n); }
void operator delete(void* p) noexcept { std::free(p); }
void operator delete(void* p, std::size_t) noexcept { std::free(p); }

struct Big { char data[512]; };

int main() {
    allocations = 0;
    { std::shared_ptr<Big> p(new Big); }
    std::cout << "shared_ptr<Big>(new Big) : " << allocations << " allocations\\n";

    allocations = 0;
    { auto p = std::make_shared<Big>(); }
    std::cout << "make_shared<Big>()       : " << allocations << " allocation\\n";

    allocations = 0;
    { auto p = std::make_unique<Big>(); }
    std::cout << "make_unique<Big>()       : " << allocations << " allocation\\n";

    // Aliasing: keep the parent alive, point at a member.
    struct Holder { int a; int b; };
    auto holder = std::make_shared<Holder>(Holder{1, 2});
    std::shared_ptr<int> justB{holder, &holder->b};   // aliasing constructor
    std::cout << "\\naliasing: *justB = " << *justB
              << ", holder use_count = " << holder.use_count() << '\\n';
    holder.reset();
    std::cout << "after holder.reset(), *justB is still valid = " << *justB
              << "  (the Holder is kept alive by justB)\\n";
}`,
          output: `shared_ptr<Big>(new Big) : 2 allocations
make_shared<Big>()       : 1 allocation
make_unique<Big>()       : 1 allocation

aliasing: *justB = 2, holder use_count = 2
after holder.reset(), *justB is still valid = 2  (the Holder is kept alive by justB)`,
          explanation:
            "**Two allocations against one, measured.** The aliasing constructor at the bottom is the less-known feature: `justB` points at `holder->b` but shares ownership of the whole `Holder`, so resetting `holder` does not destroy anything — `justB` is still an owner. That is how you safely hand out a pointer to a sub-object, and it is what `shared_ptr` can do that no other ownership model expresses cleanly.",
        },
      ],
    },
    {
      id: "cycles",
      heading: "Reference cycles",
      body: [
        "**Reference counting cannot collect cycles.** If A holds a `shared_ptr` to B and B holds one back to A, each keeps the other's count at one, both counts never reach zero, and neither destructor ever runs. The memory is leaked as surely as a forgotten `new`.",
        "This is the fundamental limitation of `shared_ptr` against a tracing garbage collector, and it appears in exactly the shapes you would expect: parent/child trees with back-pointers, doubly linked structures, observer registrations where the subject holds the observers and the observers hold the subject, and any callback that captures a `shared_ptr` to the object owning the callback.",
        "**The fix is to decide which direction owns.** The owning direction stays `shared_ptr`; the other becomes `weak_ptr`. A parent owns its children; children observe their parent. A subject owns its subscriptions; subscribers observe the subject.",
        "**`weak_ptr` cannot be dereferenced directly** — you must call `lock()`, which returns a `shared_ptr` that is null if the object is gone. That is the whole point: the check and the acquisition are one atomic step, so there is no window in which the object dies between testing and using it.",
      ],
      examples: [
        {
          id: "cycle",
          title: "The leak, and the one word that fixes it",
          lang: "cpp",
          code: `#include <iostream>
#include <memory>
#include <string>

// THE CYCLE: parent and child both hold shared_ptr to each other.
struct BadNode {
    std::string name;
    std::shared_ptr<BadNode> child;
    std::shared_ptr<BadNode> parent;      // <-- this is the leak
    explicit BadNode(std::string n) : name(std::move(n)) {
        std::cout << "    ctor " << name << '\\n';
    }
    ~BadNode() { std::cout << "    dtor " << name << '\\n'; }
};

// THE FIX: the back-pointer is weak, so it does not count.
struct GoodNode {
    std::string name;
    std::shared_ptr<GoodNode> child;
    std::weak_ptr<GoodNode>   parent;     // <-- non-owning
    explicit GoodNode(std::string n) : name(std::move(n)) {
        std::cout << "    ctor " << name << '\\n';
    }
    ~GoodNode() { std::cout << "    dtor " << name << '\\n'; }
};

int main() {
    std::cout << "cycle with two shared_ptrs:\\n";
    {
        auto p = std::make_shared<BadNode>("parent");
        auto c = std::make_shared<BadNode>("child");
        p->child  = c;
        c->parent = p;
        std::cout << "    parent use_count = " << p.use_count()
                  << ", child use_count = " << c.use_count() << '\\n';
    }
    std::cout << "  ^^ NO destructors ran. Both objects leaked.\\n";

    std::cout << "\\nsame shape with a weak back-pointer:\\n";
    {
        auto p = std::make_shared<GoodNode>("parent");
        auto c = std::make_shared<GoodNode>("child");
        p->child  = c;
        c->parent = p;                    // weak: does not raise the count
        std::cout << "    parent use_count = " << p.use_count()
                  << ", child use_count = " << c.use_count() << '\\n';

        if (auto up = c->parent.lock())
            std::cout << "    child can still reach its parent: "
                      << up->name << '\\n';
    }
    std::cout << "  ^^ both destroyed correctly.\\n";
}`,
          output: `cycle with two shared_ptrs:
    ctor parent
    ctor child
    parent use_count = 2, child use_count = 2
  ^^ NO destructors ran. Both objects leaked.

same shape with a weak back-pointer:
    ctor parent
    ctor child
    parent use_count = 1, child use_count = 2
    child can still reach its parent: parent
    dtor parent
    dtor child
  ^^ both destroyed correctly.

$ g++ -fsanitize=address ... && ./cycle
ERROR: LeakSanitizer: detected memory leaks
Indirect leak of 80 byte(s) in 1 object(s)
Indirect leak of 80 byte(s) in 1 object(s)
SUMMARY: AddressSanitizer: 160 byte(s) leaked in 2 allocations.`,
          explanation:
            "**No `dtor` lines at all in the first block, and LeakSanitizer confirms 160 bytes gone.** The counts tell the story: both reached 2 when the cross-links were made, and when `p` and `c` went out of scope both dropped only to 1. In the fixed version the parent's count stayed at 1 because the child's back-pointer is weak, so leaving the scope dropped it to zero and the cascade ran. **One keyword changed a leak into correct cleanup**, and the child could still reach its parent through `lock()`.",
        },
      ],
      pitfalls: [
        {
          title: "`shared_from_this` is how a class hands out a `shared_ptr` to itself",
          body: "Writing `std::shared_ptr<T>(this)` inside a member function creates a *second, independent* control block for an object that already has one — two owners that know nothing about each other, and a guaranteed double free. The correct mechanism is to derive from `std::enable_shared_from_this<T>` and call `shared_from_this()`, which reuses the existing control block. It only works if the object is already owned by a `shared_ptr`; calling it on a stack object or inside the constructor throws `std::bad_weak_ptr`. C++17 made that a defined throw rather than undefined behaviour.",
        },
      ],
    },
    {
      id: "choosing",
      heading: "Choosing an ownership model",
      body: [
        "**Default to `unique_ptr`.** Most objects have one owner, and expressing that is cheaper and clearer. A `unique_ptr` converts implicitly to a `shared_ptr` if requirements change later, so starting unique costs nothing.",
        "**Use `shared_ptr` when the lifetime genuinely is shared** and no single owner can be identified — a cache handing out objects, a graph with several parents, an object captured by asynchronous callbacks that may outlive their creator.",
        "**Use `weak_ptr` for observers and back-pointers** — anything that needs to reach an object without keeping it alive, and needs to know when it is gone.",
        "**Use a raw pointer or reference for non-owning parameters.** A function that only reads should take `const T&`, not a smart pointer of any kind. This is the most commonly ignored guideline and the biggest single source of unnecessary atomic traffic.",
        "**`shared_ptr` is not a substitute for thinking about lifetime.** Reaching for it because ownership is unclear tends to produce cycles, surprising destruction order, and objects living far longer than intended. It is a tool for genuinely shared lifetime, not a way to avoid the question.",
      ],
      examples: [
        {
          id: "passing",
          title: "Passing a `shared_ptr`, measured",
          lang: "cpp",
          code: `#include <chrono>
#include <iostream>
#include <memory>

struct Data { int value; };

// Copies the shared_ptr: two atomic operations per call.
long long byValue(std::shared_ptr<Data> p) { return p->value; }

// No refcount traffic at all.
long long byConstRef(const std::shared_ptr<Data>& p) { return p->value; }

// Best: says "I do not participate in ownership".
long long byRef(const Data& d) { return d.value; }

template <typename F>
long long timeMs(F f) {
    auto t0 = std::chrono::steady_clock::now();
    f();
    auto t1 = std::chrono::steady_clock::now();
    return std::chrono::duration_cast<std::chrono::milliseconds>(t1 - t0).count();
}

int main() {
    auto p = std::make_shared<Data>(Data{7});
    constexpr int N = 20000000;
    volatile long long sink = 0;

    std::cout << "20M calls:\\n";
    std::cout << "  by value (shared_ptr copy) : " << timeMs([&]{
        long long s = 0; for (int i = 0; i < N; ++i) s += byValue(p); sink = s;
    }) << " ms\\n";
    std::cout << "  by const shared_ptr&       : " << timeMs([&]{
        long long s = 0; for (int i = 0; i < N; ++i) s += byConstRef(p); sink = s;
    }) << " ms\\n";
    std::cout << "  by const Data&             : " << timeMs([&]{
        long long s = 0; for (int i = 0; i < N; ++i) s += byRef(*p); sink = s;
    }) << " ms\\n";
    (void)sink;
}`,
          output: `20M calls:
  by value (shared_ptr copy) : 210 ms
  by const shared_ptr&       : 0 ms
  by const Data&             : 0 ms`,
          explanation:
            "**The two `0 ms` rows are not measurement error — the optimiser deleted those loops entirely.** Reading a field through a reference has no observable effect, so at `-O2` GCC removed the work altogether. The by-value loop could not be removed, because **an atomic increment and decrement are observable side effects the compiler is not allowed to elide**, so all 40 million atomic operations really executed. That is the sharpest possible statement of the cost: the version that only reads optimises to nothing, and the version that copies a `shared_ptr` cannot. Take `shared_ptr` by value only when the function actually stores it. (One machine, `-O2`; the contrast is the point, not the absolute figure.)",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is in a `shared_ptr`'s control block?",
      answer:
        "The strong count, the weak count, and the deleter (plus the allocator). A `shared_ptr` is two pointers — one to the object, one to the control block — which is why it is 16 bytes against `unique_ptr`'s 8. When the strong count reaches zero the object is destroyed; when *both* counts reach zero the control block itself is freed. That separation is what lets a `weak_ptr` safely ask whether the object still exists: the block it reads outlives the object. Both counts are atomic, since a `shared_ptr` may be copied from any thread.",
    },
    {
      question: "What does `shared_ptr` cost compared to `unique_ptr`?",
      answer:
        "Twice the size — 16 bytes against 8 — plus a separately allocated control block unless you use `make_shared`. More importantly, copying it performs an atomic increment and destroying it an atomic decrement plus a branch, and atomics are expensive because they cannot be reordered or optimised away. Measured over 20 million calls at `-O2`, passing by value took 210ms while both `const shared_ptr&` and `const T&` took 0ms — the optimiser deleted those loops entirely, because reading a field has no observable effect, whereas the atomic refcount operations are side effects it is not permitted to remove. Pass by value only when the function actually stores the pointer.",
    },
    {
      question: "What does `make_shared` optimise, and when should you not use it?",
      answer:
        "It performs one allocation instead of two by placing the object and the control block in a single block, which also puts them on the same cache line, and it closes the same exception-safety window as `make_unique`. Two reasons to avoid it: it cannot take a custom deleter, since it decides how to destroy the object; and because the object's storage is part of the control block, that storage is not released until the last `weak_ptr` goes, even though the destructor runs when the strong count hits zero. For a large object with long-lived weak observers, the two-allocation form releases memory sooner.",
    },
    {
      question: "What is a reference cycle and how do you break it?",
      answer:
        "If A holds a `shared_ptr` to B and B holds one back to A, each keeps the other's strong count at one, neither reaches zero, and neither destructor runs — the memory leaks exactly as if `delete` had been forgotten. Reference counting cannot collect cycles; that is its fundamental limitation against tracing garbage collection. The fix is to decide which direction owns: the owning direction stays `shared_ptr`, the other becomes `weak_ptr`. A parent owns its children and children observe their parent. It shows up in trees with back-pointers, doubly linked structures, observer patterns, and callbacks capturing the object that owns them.",
    },
    {
      question: "Why must you call `lock()` on a `weak_ptr`?",
      answer:
        "Because a `weak_ptr` does not keep the object alive, so it may already be destroyed, and there must be no window between checking and using it. `lock()` atomically tests the strong count and, if non-zero, returns a `shared_ptr` that owns the object for as long as you hold it — so the object cannot die between the check and the use. If the object is gone it returns null rather than a dangling pointer. `expired()` exists but is only a hint, since the answer can change immediately afterwards; the correct idiom is `if (auto p = w.lock()) { ... }`.",
    },
    {
      question: "How does a class hand out a `shared_ptr` to itself?",
      answer:
        "By deriving from `std::enable_shared_from_this<T>` and calling `shared_from_this()`, which reuses the existing control block. Constructing `std::shared_ptr<T>(this)` inside a member function instead creates a *second, independent* control block for an object that already has one — two sets of counts that know nothing about each other, and a guaranteed double free when both reach zero. `shared_from_this()` only works if the object is already owned by a `shared_ptr`; calling it on a stack object or from the constructor throws `std::bad_weak_ptr`, which C++17 made a defined throw rather than undefined behaviour.",
    },
  ],
  takeaways: [
    "`shared_ptr` is two pointers — object and control block — so 16 bytes against `unique_ptr`'s 8",
    "The control block holds a strong count, a weak count and the deleter",
    "Strong count zero destroys the object; both counts zero frees the control block",
    "The counts are atomic, so copying a `shared_ptr` is genuinely expensive",
    "Over 20M calls, by-value cost 210ms while `const&` optimised away to nothing",
    "The counts are thread-safe; the pointed-to object is not",
    "`make_shared` does one allocation instead of two and closes an exception-safety window",
    "But it cannot take a custom deleter, and a `weak_ptr` then retains the object's storage",
    "The aliasing constructor points at a member while owning the whole parent",
    "Reference counting cannot collect cycles — two mutual `shared_ptr`s leak both objects",
    "Break a cycle by making the non-owning direction a `weak_ptr`",
    "`lock()` is the only way to use a `weak_ptr`, and it is atomic by design",
    "`use_count()` is racy — for debugging only, never for a branch",
    "Use `enable_shared_from_this`, never `shared_ptr<T>(this)`",
    "Default to `unique_ptr`; it converts to `shared_ptr` if requirements change",
  ],
  status: "available",
};
