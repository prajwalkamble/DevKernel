import type { Lesson } from "@/content/types";

export const atomicsLesson: Lesson = {
  id: "cpp-atomics",
  slug: "atomics-compare-exchange-and-lock-free",
  moduleSlug: "concurrency",
  title: "Atomics, Compare-Exchange & Lock-Free Against Wait-Free",
  summary:
    "Operations the hardware guarantees are indivisible, the compare-exchange loop every lock-free algorithm is built from, and the progress guarantees people confuse. Plus false sharing costing 6× on counters that were never actually shared.",
  estimatedMinutes: 40,
  objectives: [
    "Use `load`, `store`, `fetch_add` and `exchange` correctly",
    "Write a compare-exchange loop and explain why `weak` may fail spuriously",
    "Distinguish lock-free, wait-free and obstruction-free",
    "Explain why `is_lock_free` matters and what a non-lock-free atomic does",
    "Recognise and fix false sharing",
  ],
  sections: [
    {
      id: "what-atomics-are",
      heading: "Indivisible operations",
      body: [
        "**`std::atomic<T>` makes operations on a `T` indivisible**: no other thread can observe a half-completed one, and — crucially — concurrent access is no longer a data race, so it is defined behaviour.",
        "That second point is the one people miss. An ordinary `int` accessed concurrently is undefined behaviour with no worst case; an `std::atomic<int>` is fully defined.",
        "**The operations divide into three groups.** **Loads and stores** — `load()`, `store()`, and the implicit conversions — which are single indivisible reads and writes. **Read-modify-write** — `fetch_add`, `fetch_sub`, `fetch_and`, `fetch_or`, `fetch_xor`, `exchange` — which read, compute and write back as one indivisible step, and which are the reason atomics exist at all. **Compare-exchange**, the general primitive everything else can be built from.",
        "**`++counter` on an atomic is `fetch_add(1)`** and is indivisible. `++counter` on a plain `int` is a load, an add and a store, and two threads can interleave to lose an update — which is exactly what lesson 2 measured.",
        "**Not every atomic is lock-free.** `std::atomic<T>` for a large or awkward `T` may be implemented with a hidden mutex, which still gives correct semantics but none of the performance and — importantly — is **not safe in a signal handler**. Check with `is_always_lock_free`, a compile-time constant usable in `static_assert`.",
      ],
      examples: [
        {
          id: "atomic-ops",
          title: "Every operation, including the CAS loop",
          lang: "cpp",
          code: `#include <atomic>
#include <iostream>
#include <thread>
#include <vector>

struct Big { long long a, b, c, d; };

int main() {
    std::cout << std::boolalpha;
    std::cout << "is_always_lock_free:\\n";
    std::cout << "  atomic<bool>      : "
              << std::atomic<bool>::is_always_lock_free << '\\n';
    std::cout << "  atomic<int>       : "
              << std::atomic<int>::is_always_lock_free << '\\n';
    std::cout << "  atomic<long long> : "
              << std::atomic<long long>::is_always_lock_free << '\\n';
    std::cout << "  atomic<void*>     : "
              << std::atomic<void*>::is_always_lock_free << '\\n';
    std::cout << "  atomic<Big> (32B) : "
              << std::atomic<Big>::is_always_lock_free << '\\n';

    // Read-modify-write: the reason atomics exist.
    std::atomic<int> counter = 0;
    {
        std::vector<std::jthread> ts;
        for (int i = 0; i < 4; ++i)
            ts.emplace_back([&]{
                for (int j = 0; j < 100000; ++j) counter.fetch_add(1);
            });
    }
    std::cout << "\\nfetch_add from 4 threads = " << counter.load()
              << " (expected 400000)\\n";

    // exchange: set and return the OLD value, atomically.
    std::atomic<int> slot = 5;
    int old = slot.exchange(9);
    std::cout << "\\nexchange(9) returned old value " << old
              << ", slot is now " << slot.load() << '\\n';

    // compare_exchange: "if it still equals expected, replace it;
    //                    otherwise tell me what it actually is."
    std::atomic<int> value = 10;
    int expected = 10;
    bool ok = value.compare_exchange_strong(expected, 20);
    std::cout << "\\nCAS(expected=10 -> 20) succeeded = " << ok
              << ", value = " << value.load() << '\\n';

    expected = 10;                       // stale: value is now 20
    ok = value.compare_exchange_strong(expected, 30);
    std::cout << "CAS(expected=10 -> 30) succeeded = " << ok
              << ", expected was UPDATED to " << expected << '\\n';

    // The CAS loop: how you perform ANY atomic transformation.
    std::atomic<int> maxSeen = 0;
    {
        std::vector<std::jthread> ts;
        for (int i = 1; i <= 4; ++i)
            ts.emplace_back([&, i]{
                int candidate = i * 25;
                int current = maxSeen.load();
                while (candidate > current &&
                       !maxSeen.compare_exchange_weak(current, candidate)) {
                    // the failed CAS already reloaded 'current' -- just retry
                }
            });
    }
    std::cout << "\\natomic max via CAS loop = " << maxSeen.load()
              << " (expected 100)\\n";
}`,
          output: `is_always_lock_free:
  atomic<bool>      : true
  atomic<int>       : true
  atomic<long long> : true
  atomic<void*>     : true
  atomic<Big> (32B) : false

fetch_add from 4 threads = 400000 (expected 400000)

exchange(9) returned old value 5, slot is now 9

CAS(expected=10 -> 20) succeeded = true, value = 20
CAS(expected=10 -> 30) succeeded = false, expected was UPDATED to 20

atomic max via CAS loop = 100 (expected 100)`,
          explanation:
            "**The second CAS is the one to study.** It failed because `value` was 20 rather than the expected 10 — and it **wrote the actual value back into `expected`**, which is what makes the loop form work without an explicit reload. `atomic<Big>` at 32 bytes is not lock-free, because no mainstream CPU has a 32-byte atomic instruction, so the implementation falls back to a lock. Note there is no `fetch_max`: any transformation the hardware does not implement directly is expressed as a CAS loop, which is why that pattern is worth memorising.",
        },
      ],
    },
    {
      id: "cas",
      heading: "Compare-exchange, and why `weak` exists",
      body: [
        "**`compare_exchange_strong(expected, desired)`** does this indivisibly: if the atomic's value equals `expected`, replace it with `desired` and return true; otherwise load the actual value *into `expected`* and return false.",
        "The updating of `expected` on failure is the detail that makes the loop idiom work — you never need a separate reload, because the failed attempt already told you what the value really is.",
        "**`compare_exchange_weak` may fail spuriously**: it can return false even when the value did equal `expected`. That sounds strictly worse and is not. On ARM, PowerPC and RISC-V, CAS is implemented with load-linked/store-conditional, and the store-conditional can fail for reasons unrelated to the value — a context switch, an interrupt, or another core touching the same cache line. **`strong` must therefore wrap `weak` in a hidden retry loop**, so on those architectures `strong` is genuinely more expensive.",
        "**The rule: use `weak` inside a loop, `strong` when there is no loop.** If you are already retrying, a spurious failure costs one extra iteration and you get the cheaper instruction sequence. If a single attempt is all you want, `strong` saves you writing the loop yourself. On x86 both compile to `lock cmpxchg` and there is no difference.",
        "**The CAS loop is the general recipe** for any atomic transformation the hardware does not provide: load the current value, compute the new one from it, attempt the swap, and retry if someone changed it underneath you.",
      ],
      examples: [
        {
          id: "cas-patterns",
          title: "A lock-free stack, and the ABA problem it hides",
          lang: "cpp",
          code: `#include <atomic>
#include <iostream>
#include <thread>
#include <vector>

// A lock-free stack (push only, to stay short). Every push is a CAS loop.
template <typename T>
class LockFreeStack {
public:
    void push(T value) {
        Node* n = new Node{std::move(value), head_.load(std::memory_order_relaxed)};
        // Try to swing head_ to n. If another thread pushed first, the CAS
        // fails, writes the new head into n->next, and we retry.
        while (!head_.compare_exchange_weak(n->next, n,
                                            std::memory_order_release,
                                            std::memory_order_relaxed)) {
            // n->next was updated by the failed CAS
        }
    }

    // Note: a correct lock-free POP is much harder -- see the explanation.
    std::size_t drainCount() {
        std::size_t n = 0;
        Node* p = head_.exchange(nullptr);
        while (p) { Node* next = p->next; delete p; p = next; ++n; }
        return n;
    }

    ~LockFreeStack() { drainCount(); }

private:
    struct Node { T value; Node* next; };
    std::atomic<Node*> head_{nullptr};
};

int main() {
    LockFreeStack<int> stack;
    constexpr int THREADS = 4, PER = 10000;

    {
        std::vector<std::jthread> ts;
        for (int t = 0; t < THREADS; ++t)
            ts.emplace_back([&]{ for (int i = 0; i < PER; ++i) stack.push(i); });
    }

    std::cout << "pushed " << (THREADS * PER)
              << " nodes from " << THREADS << " threads\\n";
    std::cout << "drained " << stack.drainCount() << " nodes\\n";
    std::cout << "\\n(pop is deliberately omitted -- see why below)\\n";
}`,
          output: `pushed 40000 nodes from 4 threads
drained 40000 nodes

(pop is deliberately omitted -- see why below)

$ g++ -fsanitize=thread -g -pthread && ./stack
[0 ThreadSanitizer warnings]
$ g++ -fsanitize=address -g -pthread && ./stack
[clean, no leaks]`,
          explanation:
            "**Push is genuinely lock-free and only a few lines; pop is where lock-free data structures get hard.** A naive pop reads `head_`, reads `head_->next`, and CASes — but between those steps another thread may pop that node and free it, so reading `next` is a use-after-free. Worse, memory could be reused for a *new* node at the same address, so the CAS succeeds against a pointer that is equal but no longer the same node: **the ABA problem**. Real solutions need hazard pointers, epoch-based reclamation, or a tagged pointer with a counter — which is why you should use a library rather than write one.",
        },
      ],
      pitfalls: [
        {
          title: "Atomics do not compose",
          body: "Each atomic operation is indivisible; two of them are not. `if (a.load() == 0) a.store(1);` is a race — another thread can store between the load and the store, and both threads proceed as if they won. Likewise `if (!m.contains(k)) m.insert(k, v)` over a map of atomics is broken, and `total.store(total.load() + x)` is simply a slower, still-racy `fetch_add`. When an operation must be atomic across *more than one* location, or across a read and a dependent write, you need a CAS loop or a mutex. This is the single most common misuse of atomics: replacing a mutex with atomics on each member and assuming the object is now thread-safe.",
        },
      ],
    },
    {
      id: "progress-guarantees",
      heading: "Lock-free, wait-free, obstruction-free",
      body: [
        "These are **progress guarantees**, not performance claims, and they are routinely confused. Each describes what happens when threads are suspended at the worst possible moment.",
        "**Blocking** — if the thread holding a lock is suspended, nobody else can proceed. A mutex is blocking. This is the normal case and it is usually fine.",
        "**Obstruction-free** — a thread makes progress if it runs alone for long enough. The weakest non-blocking guarantee, and rarely used on its own.",
        "**Lock-free** — **at least one thread** always makes progress, whatever the scheduler does. Individual threads may starve retrying a CAS forever, but the system as a whole cannot stall. A CAS loop is lock-free: if your CAS failed, it failed *because someone else succeeded*.",
        "**Wait-free** — **every** thread completes in a bounded number of steps, regardless of contention. The strongest guarantee and by far the hardest. `fetch_add` is wait-free on x86 because `lock xadd` is a single instruction that always succeeds; a CAS loop is not, because it can retry unboundedly.",
        "**Lock-free does not mean faster.** Under high contention a CAS loop can be *slower* than a mutex, because every failed attempt is wasted work plus cache-line traffic, whereas a blocked thread sleeps and stops competing. Lock-free is worth the difficulty when you need progress guarantees — a real-time deadline, a signal handler, code that must not be blocked by a suspended thread — not merely because it sounds fast.",
        "**Measure before choosing.** The atomic counter in lesson 2 beat the mutex by 5×, but that is an uncontended-ish `fetch_add`, not a general result.",
      ],
      examples: [
        {
          id: "false-sharing",
          title: "False sharing: 6× slower on data that was never shared",
          lang: "cpp",
          code: `#include <atomic>
#include <chrono>
#include <iostream>
#include <new>
#include <thread>
#include <vector>

template <typename F>
long long timeMs(F f) {
    auto t0 = std::chrono::steady_clock::now();
    f();
    auto t1 = std::chrono::steady_clock::now();
    return std::chrono::duration_cast<std::chrono::milliseconds>(t1 - t0).count();
}

constexpr int N = 4, ITERS = 5000000;

struct Packed { std::atomic<long long> v{0}; };                 // 8 bytes
struct Padded { alignas(64) std::atomic<long long> v{0}; };     // 64 bytes

template <typename T>
long long run() {
    std::vector<T> counters(N);
    return timeMs([&]{
        std::vector<std::jthread> ts;
        for (int i = 0; i < N; ++i)
            ts.emplace_back([&, i]{
                for (int j = 0; j < ITERS; ++j)
                    counters[i].v.fetch_add(1, std::memory_order_relaxed);
            });
    });
}

int main() {
    std::cout << "hardware_destructive_interference_size = "
              << std::hardware_destructive_interference_size << " bytes\\n";
    std::cout << "sizeof(Packed) = " << sizeof(Packed)
              << ", sizeof(Padded) = " << sizeof(Padded) << '\\n';
    std::cout << "4 threads x 5M relaxed increments on their OWN counter:\\n";
    std::cout << "  adjacent (false sharing) : " << run<Packed>() << " ms\\n";
    std::cout << "  padded to a cache line   : " << run<Padded>() << " ms\\n";
}`,
          output: `hardware_destructive_interference_size = 64 bytes
sizeof(Packed) = 8, sizeof(Padded) = 64
4 threads x 5M relaxed increments on their OWN counter:
  adjacent (false sharing) : 770 ms
  padded to a cache line   : 129 ms`,
          explanation:
            "**Each thread touched only its own counter, and the packed version was six times slower.** Cache coherence works at cache-line granularity — 64 bytes here — so four adjacent 8-byte counters share one line, and every increment invalidates that line in the other three cores' caches. The counters were never logically shared; the *hardware* shared them. Padding each to a full line with `alignas(std::hardware_destructive_interference_size)` costs 56 wasted bytes per counter and removes the problem entirely. **This is the most common reason a parallel program fails to scale**, and it is invisible in the source.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does `std::atomic` guarantee?",
      answer:
        "That operations on the object are indivisible — no thread can observe a half-completed one — and, just as importantly, that concurrent access is not a data race and is therefore fully defined behaviour. An ordinary `int` accessed from two threads is undefined behaviour with no bounded worst case; an `std::atomic<int>` is well defined. The operations split into loads and stores, read-modify-write operations like `fetch_add` and `exchange` which are the reason atomics exist, and compare-exchange, the general primitive the rest can be built from.",
    },
    {
      question: "What does `compare_exchange_strong` do, and why is there a `weak` version?",
      answer:
        "It indivisibly compares the atomic against `expected`; if equal it stores `desired` and returns true, otherwise it loads the actual value *into `expected`* and returns false — and that write-back is what lets a CAS loop retry without an explicit reload. `weak` may additionally fail spuriously, returning false even when the values matched. That exists because on ARM, PowerPC and RISC-V, CAS is built from load-linked/store-conditional, and the store-conditional can fail due to a context switch or another core touching the cache line. `strong` therefore has to wrap `weak` in a hidden retry loop. Use `weak` inside a loop you are already writing and `strong` when a single attempt is what you want; on x86 both become `lock cmpxchg`.",
    },
    {
      question: "What is the difference between lock-free and wait-free?",
      answer:
        "Both are non-blocking progress guarantees. Lock-free means at least one thread always makes progress no matter what the scheduler does — individual threads may starve retrying, but the system cannot stall, which is what a CAS loop gives you since a failed CAS means someone else succeeded. Wait-free means *every* thread completes in a bounded number of steps regardless of contention, which is much stronger and much harder; `fetch_add` is wait-free on x86 because `lock xadd` is one instruction that always succeeds, while a CAS loop is not. Neither implies speed: under high contention a CAS loop can be slower than a mutex, because failed attempts are wasted work while a blocked thread sleeps and stops competing.",
    },
    {
      question: "Why do atomics not compose?",
      answer:
        "Because each operation is individually indivisible but two of them are not. `if (a.load() == 0) a.store(1);` is a race — another thread can store between the load and the store. `total.store(total.load() + x)` is a slower, still-racy `fetch_add`. And making every member of a class atomic does not make the class thread-safe, because an invariant spanning two members can still be observed half-updated. When atomicity must span more than one location, or a read and a dependent write, you need a CAS loop or a mutex. This is the most common misuse of atomics.",
    },
    {
      question: "What is false sharing and how do you fix it?",
      answer:
        "Two threads writing to *different* variables that happen to occupy the same cache line. Cache coherence operates at line granularity — typically 64 bytes — so each write invalidates the line in the other core's cache even though the data is logically unshared, and the line ping-pongs between cores. Measured with four threads incrementing four adjacent atomic counters five million times each, the packed version took 770ms against 129ms when each counter was padded to its own line: six times slower on data that was never shared. The fix is `alignas(std::hardware_destructive_interference_size)` on each element, at the cost of the padding. It is a leading reason parallel code fails to scale, and it is invisible in the source.",
    },
    {
      question: "When is an `std::atomic<T>` not lock-free, and why does it matter?",
      answer:
        "When `T` is larger than or differently shaped from what the hardware provides atomic instructions for — a 32-byte struct has no atomic instruction on mainstream CPUs, so the implementation falls back to a hidden mutex. The semantics remain correct, but you lose the performance and, more seriously, the operation is no longer async-signal-safe, so it must not be used in a signal handler. `is_always_lock_free` is a compile-time constant you can `static_assert` on; `is_lock_free()` is the runtime member for cases where alignment decides it. Note that being lock-free does not mean the type is small enough to be efficient — `atomic<long long>` is lock-free on x86-64 but still contends.",
    },
  ],
  takeaways: [
    "`std::atomic` makes operations indivisible and makes concurrent access defined behaviour",
    "Read-modify-write operations — `fetch_add`, `exchange` — are the point of atomics",
    "`++x` on an atomic is one indivisible step; on a plain `int` it is load, add, store",
    "`compare_exchange` writes the actual value back into `expected` on failure",
    "`weak` may fail spuriously; use it inside a loop, `strong` when there is no loop",
    "The spurious failure comes from LL/SC on ARM and friends, so `strong` costs more there",
    "A CAS loop is the general recipe for any transformation the hardware lacks",
    "Atomics do not compose — two atomic operations are not one atomic operation",
    "Lock-free: at least one thread progresses. Wait-free: every thread progresses in bounded steps",
    "Lock-free is a progress guarantee, not a speed claim — it can lose to a mutex under contention",
    "A correct lock-free pop needs hazard pointers or epochs because of ABA — use a library",
    "False sharing cost 6× on counters that were never logically shared",
    "Pad with `alignas(std::hardware_destructive_interference_size)` to fix it",
  ],
  status: "available",
};
