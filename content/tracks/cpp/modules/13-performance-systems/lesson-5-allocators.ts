import type { Lesson } from "@/content/types";

export const allocatorsLesson: Lesson = {
  id: "cpp-allocators",
  slug: "allocators-arenas-and-small-buffer-optimisation",
  moduleSlug: "performance-systems",
  title: "Custom Allocators, Arenas & Small-Buffer Optimisation",
  summary:
    "Why allocation is often the hidden cost, and the three ways to remove it. A monotonic arena taking 200,019 allocations down to 7 and cutting the time nearly in half, plus the small-buffer trick the standard library already uses on your behalf.",
  estimatedMinutes: 35,
  objectives: [
    "Explain what a general-purpose allocator actually does and why it costs",
    "Use `std::pmr` allocators without templating your types",
    "Choose between monotonic, pool and synchronised resources",
    "Explain the small-buffer optimisation and where it already applies",
    "Reduce allocations before reaching for a custom allocator",
  ],
  sections: [
    {
      id: "the-cost",
      heading: "What allocation costs",
      body: [
        "**`new` is not one operation.** A general-purpose allocator must find a free block of a suitable size, split or coalesce blocks to limit fragmentation, update its bookkeeping, and — in a multithreaded program — do all of that safely, which usually means a lock or a per-thread cache with a slow path to a shared arena.",
        "That is tens to hundreds of nanoseconds per call, and it comes with three costs beyond the time.",
        "**Cache pressure**: the allocator's own metadata is memory traffic competing with your data.",
        "**Fragmentation**: over a long-running process, allocations of mixed sizes leave gaps that cannot be reused, so memory grows even when live data does not.",
        "**Locality**: consecutively allocated objects need not be adjacent, so a container of pointers to individually allocated nodes has exactly the traversal problem lesson 2 measured.",
        "**The first move is always to allocate less**, not to allocate faster. `reserve` on a vector you will fill, `emplace_back` instead of `push_back`, passing `std::string_view` instead of `std::string`, returning by value so the result is elided, and storing values instead of `unique_ptr` where polymorphism is not needed. **A custom allocator is what you reach for after that**, and it is worth knowing that most \"we need a custom allocator\" situations turn out to be \"we are allocating things we did not need to\".",
      ],
      examples: [
        {
          id: "pmr",
          title: "200,019 allocations reduced to 7",
          lang: "cpp",
          code: `#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <memory_resource>
#include <new>
#include <string>
#include <vector>

using Clock = std::chrono::steady_clock;
template <typename F> double ms(F f) {
    auto t0 = Clock::now(); f();
    return std::chrono::duration<double, std::milli>(Clock::now() - t0).count();
}

// Count every global allocation. Note BOTH the plain and the aligned
// overloads -- pmr uses the aligned one, and missing it reports zero.
static long allocs = 0;
void* operator new(std::size_t n) { ++allocs; return std::malloc(n); }
void* operator new(std::size_t n, std::align_val_t a) {
    ++allocs; return std::aligned_alloc(static_cast<std::size_t>(a), n);
}
void operator delete(void* p) noexcept { std::free(p); }
void operator delete(void* p, std::size_t) noexcept { std::free(p); }
void operator delete(void* p, std::align_val_t) noexcept { std::free(p); }
void operator delete(void* p, std::size_t, std::align_val_t) noexcept { std::free(p); }

constexpr int N = 200000;

int main() {
    // 1. Default: one allocation per string, plus the vector's growth.
    allocs = 0;
    double a = ms([]{
        std::pmr::vector<std::pmr::string> v;      // default resource = new/delete
        for (int i = 0; i < N; ++i)
            v.emplace_back("a string long enough to allocate");
    });
    long aAllocs = allocs;

    // 2. Monotonic arena over a stack buffer: bump a pointer, free nothing.
    allocs = 0;
    double b = ms([]{
        char buffer[1 << 20];
        std::pmr::monotonic_buffer_resource arena{buffer, sizeof(buffer)};
        std::pmr::vector<std::pmr::string> v{&arena};
        for (int i = 0; i < N; ++i)
            v.emplace_back("a string long enough to allocate");
    });
    long bAllocs = allocs;

    // 3. Pool: recycles same-sized blocks, so it CAN free.
    allocs = 0;
    double c = ms([]{
        std::pmr::unsynchronized_pool_resource pool;
        std::pmr::vector<std::pmr::string> v{&pool};
        for (int i = 0; i < N; ++i)
            v.emplace_back("a string long enough to allocate");
    });
    long cAllocs = allocs;

    std::printf("%d strings:\\n", N);
    std::printf("  new/delete        : %7.1f ms  %8ld global allocations\\n", a, aAllocs);
    std::printf("  monotonic arena   : %7.1f ms  %8ld global allocations\\n", b, bAllocs);
    std::printf("  pool resource     : %7.1f ms  %8ld global allocations\\n", c, cAllocs);
}`,
          output: `200000 strings:
  new/delete        :    36.3 ms    200019 global allocations
  monotonic arena   :    22.6 ms         7 global allocations
  pool resource     :    25.3 ms        52 global allocations

# The arena made 7 large requests instead of 200,019 small ones,
# and ran in 62% of the time.`,
          explanation:
            "**200,019 allocations became 7.** The monotonic resource starts with the stack buffer and only calls `new` when it needs another chunk — and it never frees individual objects at all, which is what makes allocation a pointer bump. The pool sits between: it recycles same-sized blocks, so it *can* release memory as you go, at the cost of more bookkeeping. Note the aligned `operator new` overload in the counter — without it, this program reports zero allocations for all three, which is exactly the mistake that made the first run of this benchmark meaningless.",
        },
      ],
      pitfalls: [
        {
          title: "A monotonic arena never frees, and that is the entire trade",
          body: "`monotonic_buffer_resource` reclaims nothing until it is destroyed — `deallocate` is a no-op. That is what makes allocation a pointer increment, and it means memory use is proportional to *total* allocations, not live ones. It is exactly right for a phase with a clear end: one frame of a game, one request in a server, one document parse — allocate freely, then destroy the arena and reclaim everything at once. It is exactly wrong for anything long-lived with churn, where it is simply a memory leak with better performance. Choose it when you can name the moment the arena dies.",
        },
      ],
    },
    {
      id: "pmr",
      heading: "`std::pmr`, and why it exists",
      body: [
        "The classic C++98 allocator model made the allocator a **template parameter**, so `std::vector<T, MyAlloc>` is a different *type* from `std::vector<T>`. You cannot pass one where the other is expected, every function taking a container must become a template, and the allocator infects every signature it touches.",
        "**C++17's `std::pmr` fixes that with runtime polymorphism.** `std::pmr::vector<T>` is `std::vector<T, std::pmr::polymorphic_allocator<T>>` — one type regardless of which memory resource it uses, because the resource is a `memory_resource*` held at runtime.",
        "So you can write `void process(std::pmr::vector<int>&)` and call it with a vector backed by an arena, a pool, or plain `new`, with no templates at all. **The cost is one virtual call per allocation**, which is negligible next to what allocation costs anyway.",
        "**The resources worth knowing.** **`monotonic_buffer_resource`** — bump a pointer, never free, release everything at destruction. Fastest possible allocation. **`unsynchronized_pool_resource`** — pools of same-sized blocks, recycles freed ones, single-threaded. **`synchronized_pool_resource`** — the same, thread-safe. **`new_delete_resource()`** — the default, forwarding to `new`. **`null_memory_resource()`** — throws on any allocation, which is the way to *assert* that a code path does not allocate.",
        "**Resources chain.** Give a `monotonic_buffer_resource` an upstream resource and it requests fresh chunks from that when its buffer runs out — a stack buffer backed by a pool backed by `new` is a perfectly reasonable arrangement.",
      ],
      examples: [
        {
          id: "pmr-usage",
          title: "One function, three memory strategies",
          lang: "cpp",
          code: `#include <array>
#include <cstdio>
#include <memory_resource>
#include <string>
#include <vector>

// ONE type, whatever resource backs it. No templates, no ABI churn.
void summarise(const char* label, const std::pmr::vector<std::pmr::string>& v) {
    std::size_t chars = 0;
    for (const auto& s : v) chars += s.size();
    std::printf("  %-22s %zu strings, %zu chars\\n", label, v.size(), chars);
}

void fill(std::pmr::vector<std::pmr::string>& v) {
    for (int i = 0; i < 5; ++i)
        v.emplace_back("entry number " + std::to_string(i));
}

int main() {
    // 1. Default: plain new/delete.
    {
        std::pmr::vector<std::pmr::string> v;
        fill(v);
        summarise("new_delete_resource", v);
    }

    // 2. A fixed stack buffer with NO fallback: allocating past it throws.
    {
        std::array<std::byte, 4096> buf;
        std::pmr::monotonic_buffer_resource arena{
            buf.data(), buf.size(), std::pmr::null_memory_resource()};
        std::pmr::vector<std::pmr::string> v{&arena};
        fill(v);
        summarise("stack arena, no heap", v);
    }

    // 3. A chain: small stack buffer, falling back to a pool, then to new.
    {
        std::pmr::unsynchronized_pool_resource pool;
        std::array<std::byte, 256> buf;
        std::pmr::monotonic_buffer_resource arena{buf.data(), buf.size(), &pool};
        std::pmr::vector<std::pmr::string> v{&arena};
        fill(v);
        summarise("stack -> pool -> new", v);
    }

    // 4. Proving a section does not allocate at all.
    {
        std::pmr::vector<int> v{std::pmr::null_memory_resource()};
        try {
            v.push_back(1);                      // any allocation throws
            std::printf("  unexpectedly allocated\\n");
        } catch (const std::bad_alloc&) {
            std::printf("  %-22s allocation attempt rejected\\n",
                        "null_memory_resource");
        }
    }
}`,
          output: `  new_delete_resource    5 strings, 65 chars
  stack arena, no heap   5 strings, 65 chars
  stack -> pool -> new   5 strings, 65 chars
  null_memory_resource   allocation attempt rejected`,
          explanation:
            "**`summarise` and `fill` were written once and used with three completely different memory strategies**, because `std::pmr::vector<std::pmr::string>` is a single type. Under the old allocator model each would have had to be a template. The fourth case is the underused one: **`null_memory_resource` turns \"this path must not allocate\" from a comment into an enforced invariant**, which is exactly what you want in a real-time audio callback, an interrupt handler, or any latency-critical section.",
        },
      ],
    },
    {
      id: "sbo",
      heading: "Small-buffer optimisation",
      body: [
        "**SBO stores small values inside the object itself and only allocates when they outgrow it.** You have already met it twice in this track without it being named.",
        "**`std::string`** — module 8 measured `sizeof(std::string)` at 32 bytes on libstdc++, holding up to 15 characters inline with no allocation. That is why `std::string s = \"GET\";` costs nothing and a URL costs an allocation.",
        "**`std::function`** — module 9 measured a capture-less lambda and a function pointer costing zero allocations inside its 32 bytes, while eight captured `int`s allocated.",
        "The trade is always the same: **a larger object in exchange for fewer allocations**. That is usually a good deal, because the object often lives in a container or on the stack where the extra bytes are cheap, and the allocation is not.",
        "**Writing your own is straightforward** — a union of an inline buffer and a heap pointer, plus a size or flag — and the hard part is the special member functions, since copying and moving must handle both states. The move constructor in particular cannot simply steal a pointer when the value is inline; it must copy.",
        "**Know when it hurts.** SBO makes the type larger, which costs when you have millions of them, and it makes moves more expensive than a pointer steal. `std::string`'s move is not free precisely because of this.",
      ],
      examples: [
        {
          id: "sbo-impl",
          title: "A small-vector with an inline buffer",
          lang: "cpp",
          code: `#include <algorithm>
#include <cstdio>
#include <cstdlib>
#include <memory>
#include <new>

static long allocs = 0;
void* operator new(std::size_t n) { ++allocs; return std::malloc(n); }
void operator delete(void* p) noexcept { std::free(p); }
void operator delete(void* p, std::size_t) noexcept { std::free(p); }

// Holds up to N elements inline; spills to the heap beyond that.
template <typename T, std::size_t N>
class SmallVector {
public:
    SmallVector() = default;
    ~SmallVector() {
        clear();
        if (heap_) ::operator delete(heap_);
    }
    SmallVector(const SmallVector&)            = delete;   // kept short
    SmallVector& operator=(const SmallVector&) = delete;

    void push_back(const T& value) {
        if (size_ == cap_) grow();
        std::construct_at(data() + size_, value);
        ++size_;
    }
    void clear() {
        for (std::size_t i = 0; i < size_; ++i) std::destroy_at(data() + i);
        size_ = 0;
    }

    T*          data()       { return heap_ ? heap_ : reinterpret_cast<T*>(inline_); }
    const T*    data() const { return heap_ ? heap_ : reinterpret_cast<const T*>(inline_); }
    std::size_t size()  const { return size_; }
    bool        onHeap() const { return heap_ != nullptr; }

private:
    void grow() {
        std::size_t newCap = cap_ * 2;
        T* fresh = static_cast<T*>(::operator new(newCap * sizeof(T)));
        for (std::size_t i = 0; i < size_; ++i) {
            std::construct_at(fresh + i, std::move(data()[i]));
            std::destroy_at(data() + i);
        }
        if (heap_) ::operator delete(heap_);
        heap_ = fresh;
        cap_  = newCap;
    }

    alignas(T) unsigned char inline_[N * sizeof(T)];
    T*          heap_ = nullptr;
    std::size_t size_ = 0;
    std::size_t cap_  = N;
};

int main() {
    std::printf("sizeof(SmallVector<int,8>) = %zu bytes\\n",
                sizeof(SmallVector<int, 8>));

    allocs = 0;
    { SmallVector<int, 8> v; for (int i = 0; i < 8; ++i) v.push_back(i);
      std::printf("8 elements  : %ld allocations, on heap = %d\\n",
                  allocs, v.onHeap()); }

    allocs = 0;
    { SmallVector<int, 8> v; for (int i = 0; i < 100; ++i) v.push_back(i);
      std::printf("100 elements: %ld allocations, on heap = %d\\n",
                  allocs, v.onHeap()); }
}`,
          output: `sizeof(SmallVector<int,8>) = 56 bytes
8 elements  : 0 allocations, on heap = 0
100 elements: 4 allocations, on heap = 1

# 56 bytes instead of 24 for a std::vector -- that is the trade.
# Under the threshold it never touches the allocator at all.`,
          explanation:
            "**Zero allocations for the common small case, at the cost of a 56-byte object instead of 24.** That is the whole of SBO, and whether it is a good trade depends entirely on how many you have and how often they stay small. Note `grow()` must *move* the inline elements out to the heap and destroy the originals — the state transition is where a hand-written SBO type gets subtle, and it is why the copy operations are deleted here rather than written carelessly. In real code, use `llvm::SmallVector`, `boost::container::small_vector` or `absl::InlinedVector` rather than this.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does `new` actually cost?",
      answer:
        "Far more than the pointer it returns. A general-purpose allocator must find a suitably sized free block, split or coalesce blocks to limit fragmentation, update bookkeeping, and do all of it thread-safely — usually a per-thread cache with a slow path to a shared arena under a lock. That is tens to hundreds of nanoseconds. Beyond the time there are three further costs: the allocator's metadata competes for cache, fragmentation makes a long-running process grow even when live data does not, and consecutively allocated objects need not be adjacent, so traversal suffers exactly as lesson 2 measured. The first fix is always to allocate less rather than faster.",
    },
    {
      question: "What problem does `std::pmr` solve?",
      answer:
        "The classic allocator is a template parameter, so `std::vector<T, MyAlloc>` is a different type from `std::vector<T>` — they do not interconvert, every function taking a container must become a template, and the allocator infects every signature it touches. `std::pmr` makes the allocator a runtime property instead: `std::pmr::vector<T>` holds a `memory_resource*`, so one type works with an arena, a pool or plain `new`. You can write `void process(std::pmr::vector<int>&)` and call it with any of them. The cost is one virtual call per allocation, which is negligible against what allocation costs anyway.",
    },
    {
      question: "When is a monotonic arena the right choice?",
      answer:
        "When you can name the moment it dies. `monotonic_buffer_resource` makes allocation a pointer bump and `deallocate` a no-op, so nothing is reclaimed until the resource is destroyed — memory use is proportional to total allocations, not live ones. That is ideal for a phase with a clear end: one frame of a game, one request in a server, one document parse. Allocate freely, then destroy the arena and reclaim everything at once. Measured on 200,000 strings it turned 200,019 allocations into 7 and ran in 62% of the time. It is exactly wrong for long-lived data with churn, where it is a leak with good performance.",
    },
    {
      question: "What is `null_memory_resource` for?",
      answer:
        "Asserting that a code path does not allocate. It throws `std::bad_alloc` on any allocation request, so wiring it into a container turns \"this must not allocate\" from a comment into an enforced invariant that fails loudly in testing. It is also the right upstream for a fixed stack buffer when you want spilling to the heap to be an error rather than a silent fallback. The natural uses are real-time audio callbacks, interrupt handlers, and any latency-critical section where an unexpected allocation would blow the deadline.",
    },
    {
      question: "What is the small-buffer optimisation and where have you already seen it?",
      answer:
        "Storing small values inside the object itself and only allocating when they outgrow it. `std::string` on libstdc++ is 32 bytes and holds up to 15 characters inline, which is why a short string costs no allocation and a URL costs one. `std::function` is 32 bytes and stores a function pointer or capture-less lambda inline while a large capture allocates. The trade is a bigger object for fewer allocations, usually worth it. The costs are memory when you have millions of them, and more expensive moves — a move cannot simply steal a pointer when the value is inline, it must copy, which is why `std::string`'s move is not free.",
    },
    {
      question: "How would you reduce allocations before writing a custom allocator?",
      answer:
        "`reserve` on any vector whose final size you can estimate, since growth reallocates and copies. `emplace_back` rather than constructing a temporary and pushing it. `std::string_view` for parameters you only read, which module 8 measured turning 100 allocations into 0. Returning by value so the result is elided rather than allocating into an out-parameter. Storing values instead of `unique_ptr` where polymorphism is not needed. And reusing containers across iterations — `clear()` keeps the capacity — rather than constructing a fresh one each time. Most \"we need a custom allocator\" situations turn out to be \"we are allocating things we did not need to\".",
    },
  ],
  takeaways: [
    "`new` costs tens to hundreds of nanoseconds, plus cache pressure, fragmentation and lost locality",
    "The first move is to allocate less, not to allocate faster",
    "The classic allocator is a template parameter, so it changes the container's type",
    "`std::pmr` makes it a runtime property — one type, any resource, one virtual call",
    "`monotonic_buffer_resource`: pointer bump, never frees, reclaims all at destruction",
    "Measured: 200,019 allocations became 7, in 62% of the time",
    "Pool resources recycle same-sized blocks and can free as you go",
    "`null_memory_resource` turns \"must not allocate\" into an enforced invariant",
    "Resources chain: a stack buffer upstream of a pool upstream of `new`",
    "SBO stores small values inline — `std::string` holds 15 chars, `std::function` a small lambda",
    "The trade is a larger object and costlier moves for fewer allocations",
    "When counting allocations, replace the *aligned* `operator new` too or you measure nothing",
    "Prefer `llvm::SmallVector` or `absl::InlinedVector` to writing your own",
  ],
  status: "available",
};
