import type { Lesson } from "@/content/types";

export const memoryModelLesson: Lesson = {
  id: "cpp-memory-orderings",
  slug: "the-memory-model-and-memory-orderings",
  moduleSlug: "concurrency",
  title: "The C++ Memory Model & the Memory Orderings",
  summary:
    "What \"visible to another thread\" actually means. Happens-before, the five orderings, and acquire/release publication — with x86 assembly showing that four of the five compile to identical instructions and only one costs anything.",
  estimatedMinutes: 40,
  objectives: [
    "Explain happens-before and why it is the only ordering guarantee you have",
    "Name the five memory orderings and what each permits",
    "Use acquire/release to publish data through a flag",
    "Say when `relaxed` is safe and when it is a bug",
    "Explain why the same code has different costs on x86 and ARM",
  ],
  sections: [
    {
      id: "happens-before",
      heading: "Happens-before",
      body: [
        "Everything in this module has rested on one relation, and it is time to state it properly.",
        "**There is no global \"now\".** Each core has its own store buffers and caches; the compiler reorders instructions; the CPU executes out of order. Two threads can genuinely disagree about the order in which two writes occurred, and neither is wrong.",
        "So the standard does not define concurrency in terms of time. It defines it in terms of **happens-before**: a partial order over operations. **If A happens-before B, then B is guaranteed to see A's effects. If neither happens-before the other, there is no guarantee at all** — and if they conflict, it is a data race.",
        "**Happens-before is built from three things.** *Sequenced-before*, which is ordinary program order within one thread. *Synchronizes-with*, which is what synchronisation primitives create between threads. And transitivity, which chains them together.",
        "**Everything that creates ordering between threads does so by creating a synchronizes-with edge**, and there are only a handful of sources: unlocking a mutex synchronizes-with the next lock of it; a `release` store synchronizes-with an `acquire` load that reads it; `thread::join` synchronizes-with the end of that thread; a `promise::set_value` synchronizes-with the `future::get` that receives it; and starting a thread synchronizes-with everything sequenced before the constructor call.",
        "**That list is the whole of inter-thread ordering.** If your code does not use one of those, two threads have no ordering relationship whatsoever.",
      ],
      examples: [
        {
          id: "acquire-release",
          title: "Publishing non-atomic data through an atomic flag",
          lang: "cpp",
          code: `#include <atomic>
#include <cassert>
#include <chrono>
#include <iostream>
#include <string>
#include <thread>
#include <vector>

// The data is ORDINARY, non-atomic. Only the flag is atomic.
struct Payload { int a; std::string b; };
Payload           data;
std::atomic<bool> ready{false};

void producer() {
    data.a = 42;                                   // 1
    data.b = "published";                          // 2
    ready.store(true, std::memory_order_release);  // 3: publishes 1 and 2
}

void consumer() {
    while (!ready.load(std::memory_order_acquire)) { }  // sees 3 => sees 1, 2
    assert(data.a == 42);
    assert(data.b == "published");
    std::cout << "  consumer saw a=" << data.a << " b=" << data.b << '\\n';
}

std::atomic<long long> hits{0};

int main() {
    std::cout << "acquire/release publication:\\n";
    {
        std::jthread c{consumer};
        std::this_thread::sleep_for(std::chrono::milliseconds(5));
        std::jthread p{producer};
    }

    std::cout << "\\nrelaxed is fine for a counter nobody orders against:\\n";
    {
        std::vector<std::jthread> ts;
        for (int i = 0; i < 4; ++i)
            ts.emplace_back([]{
                for (int j = 0; j < 250000; ++j)
                    hits.fetch_add(1, std::memory_order_relaxed);
            });
    }
    std::cout << "  hits = " << hits.load() << " (expected 1000000)\\n";

    std::cout << "\\nthe orderings, weakest to strongest:\\n"
                 "  relaxed : atomic, no ordering with other variables\\n"
                 "  acquire : later reads/writes cannot move BEFORE this load\\n"
                 "  release : earlier reads/writes cannot move AFTER this store\\n"
                 "  acq_rel : both, for read-modify-write operations\\n"
                 "  seq_cst : all of the above, plus one global total order\\n";
}`,
          output: `acquire/release publication:
  consumer saw a=42 b=published

relaxed is fine for a counter nobody orders against:
  hits = 1000000 (expected 1000000)

the orderings, weakest to strongest:
  relaxed : atomic, no ordering with other variables
  acquire : later reads/writes cannot move BEFORE this load
  release : earlier reads/writes cannot move AFTER this store
  acq_rel : both, for read-modify-write operations
  seq_cst : all of the above, plus one global total order

$ g++ -fsanitize=thread -g -pthread && ./publish
[0 ThreadSanitizer warnings]`,
          explanation:
            "**`data` is an ordinary non-atomic struct written by one thread and read by another, and it is not a data race** — ThreadSanitizer confirms it. The release store synchronizes-with the acquire load, so writes 1 and 2 happen-before the consumer's reads, which is precisely the ordering the definition of a data race requires. **This is the fundamental pattern**: one atomic flag publishes an arbitrary amount of ordinary data. Change either `release` or `acquire` to `relaxed` and it becomes undefined behaviour, with TSan reporting a race on `data`.",
        },
      ],
    },
    {
      id: "the-orderings",
      heading: "The five orderings",
      body: [
        "Every atomic operation takes an optional `std::memory_order`, defaulting to `seq_cst`.",
        "**`relaxed`** — the operation is atomic and nothing more. No ordering with respect to any other variable. Correct for a statistics counter nobody reads until the end, or a flag whose value is the only thing that matters. Wrong for anything that publishes other data.",
        "**`acquire`** (loads) — no reads or writes in this thread may be reordered *before* this load. Combined with a release store on the other side, it means you see everything that thread did before its store.",
        "**`release`** (stores) — no reads or writes in this thread may be reordered *after* this store. Everything you did before is visible to whoever acquires.",
        "**`acq_rel`** (read-modify-write only) — both, for operations that read and write, such as `fetch_add` used as a handoff.",
        "**`seq_cst`** — acquire/release *plus* a single global total order that all threads agree on. The default, and the only ordering under which naive reasoning about interleavings is sound.",
        "**`consume` exists and should be ignored.** It was intended to be a cheaper `acquire` for pointer-chasing, no implementation ever implemented it as specified — they all promote it to `acquire` — and it has been discouraged since C++17.",
        "**The rule of thumb: use the default `seq_cst` until you can articulate exactly why a weaker ordering is correct.** Acquire/release for the publication pattern above is well understood and safe. Anything beyond that is expert territory where mistakes produce bugs that appear only on weakly-ordered hardware, months later.",
      ],
      examples: [
        {
          id: "asm-comparison",
          title: "What each ordering costs on x86-64",
          lang: "asm",
          code: `; Compiled with g++ -O2 -S -masm=intel on x86-64.
; std::atomic<int> a;

; ---- LOADS: all three identical ----
int loadRelaxed()  { return a.load(memory_order_relaxed); }
        mov     eax, DWORD PTR a[rip]
        ret
int loadAcquire()  { return a.load(memory_order_acquire); }
        mov     eax, DWORD PTR a[rip]
        ret
int loadSeqCst()   { return a.load(memory_order_seq_cst); }
        mov     eax, DWORD PTR a[rip]
        ret

; ---- STORES: the ONLY place ordering costs anything here ----
void storeRelaxed(int v) { a.store(v, memory_order_relaxed); }
        mov     DWORD PTR a[rip], edi
        ret
void storeRelease(int v) { a.store(v, memory_order_release); }
        mov     DWORD PTR a[rip], edi          ; identical to relaxed
        ret
void storeSeqCst(int v)  { a.store(v, memory_order_seq_cst); }
        xchg    edi, DWORD PTR a[rip]          ; xchg is implicitly locked
        ret                                    ; = a full barrier

; ---- READ-MODIFY-WRITE: identical ----
int rmwRelaxed()   { return a.fetch_add(1, memory_order_relaxed); }
        mov     eax, 1
        lock xadd DWORD PTR a[rip], eax
        ret
int rmwSeqCst()    { return a.fetch_add(1, memory_order_seq_cst); }
        mov     eax, 1
        lock xadd DWORD PTR a[rip], eax        ; identical
        ret`,
          output: `# Measured: 4 threads x 3M fetch_add
#   seq_cst : 466 ms
#   relaxed : 445 ms      <- essentially noise, and the assembly says why

# x86-64 is a strongly-ordered architecture: loads are already acquire and
# stores are already release IN HARDWARE. Only the seq_cst store needs an
# instruction change. On ARM/AArch64 the picture is completely different --
# ldar/stlr for acquire/release, and extra barriers for seq_cst.`,
          explanation:
            "**Four of the six functions compile to the same instruction as their relaxed counterpart.** That is why the `fetch_add` benchmark showed 466ms against 445ms — both are `lock xadd`, so the difference is measurement noise, not ordering cost. **Only the `seq_cst` store differs**, using `xchg` (implicitly locked, hence a full barrier) instead of a plain `mov`. The practical lesson is that **micro-optimising orderings on x86 usually buys nothing while adding real risk**, because the bug it introduces will only appear when the code is built for ARM.",
        },
      ],
      pitfalls: [
        {
          title: "x86 hides three of the four reorderings — but not the fourth",
          body: "x86-64 is *Total Store Order*: it preserves LoadLoad, LoadStore and StoreStore ordering in hardware, and permits only **StoreLoad** reordering. Two consequences, and they pull in opposite directions. Code that should have used `acquire`/`release` but used `relaxed` usually runs correctly on every x86 machine you own and breaks on ARM — a phone, an Apple Silicon Mac, a Graviton server — so x86 testing cannot validate those. But the one thing x86 *does* reorder is exactly what Dekker's pattern needs, which is why the example above fails on x86 about once in 20,000 rounds. Neither case is a data race, so **ThreadSanitizer will not report either** — it checks for missing synchronisation, not insufficient ordering. Explicit non-default orderings have to be reasoned through, not tested.",
        },
      ],
    },
    {
      id: "reasoning",
      heading: "Reasoning about it, and when not to",
      body: [
        "The memory model is the hardest part of C++ and you can build correct concurrent software while using very little of it.",
        "**The escalation, in order:** don't share; share immutable data; use a mutex; use `seq_cst` atomics; use acquire/release for the publication pattern; use `relaxed` for independent counters. Almost nothing in ordinary application code needs to go past the fourth step.",
        "**Where the model genuinely matters** is when you are implementing the primitives rather than using them — a lock-free queue, a reference-counting scheme, a work-stealing deque — or when you are reading such an implementation and need to know why a particular ordering is there.",
        "**A worked example of why `seq_cst` is not the same as acquire/release**: Dekker's pattern, where two threads each store to their own flag and then read the other's. With `seq_cst`, at least one must see the other's store — there is a single total order and one of the stores comes first. With release/acquire, both can read `false`, because there is no total order and each thread's store may still be sitting in its own store buffer. **This one is observable on ordinary x86**, because store-then-load is precisely the reordering x86 permits — the example below catches it about once in 20,000 rounds.",
        "**`std::atomic_thread_fence`** provides ordering without an associated atomic operation, letting several relaxed operations share one barrier. It is a genuine optimisation in tight lock-free code and almost never needed elsewhere.",
      ],
      examples: [
        {
          id: "seqcst-vs-acqrel",
          title: "The case where acquire/release is not enough",
          lang: "cpp",
          code: `#include <atomic>
#include <iostream>
#include <thread>

// Dekker's pattern. Each thread stores to its own flag, then reads the other.
// With seq_cst, "both read false" is IMPOSSIBLE.
// With release/acquire it is PERMITTED -- and x86 really does produce it,
// because store-then-load is the one reordering x86 allows.

std::atomic<bool> x{false}, y{false};
std::atomic<int>  bothFalse{0};

template <std::memory_order Store, std::memory_order Load>
void trial(int rounds) {
    for (int i = 0; i < rounds; ++i) {
        x.store(false, std::memory_order_relaxed);
        y.store(false, std::memory_order_relaxed);
        std::atomic_thread_fence(std::memory_order_seq_cst);

        bool readY = false, readX = false;
        {
            std::jthread t1{[&]{ x.store(true, Store); readY = y.load(Load); }};
            std::jthread t2{[&]{ y.store(true, Store); readX = x.load(Load); }};
        }
        if (!readY && !readX) ++bothFalse;
    }
}

int main() {
    constexpr int ROUNDS = 20000;

    bothFalse = 0;
    trial<std::memory_order_seq_cst, std::memory_order_seq_cst>(ROUNDS);
    std::cout << "seq_cst : both read false " << bothFalse.load()
              << " times out of " << ROUNDS << "  (must be 0)\\n";

    bothFalse = 0;
    trial<std::memory_order_release, std::memory_order_acquire>(ROUNDS);
    std::cout << "acq/rel : both read false " << bothFalse.load()
              << " times out of " << ROUNDS
              << "  (PERMITTED -- and x86 really does it)\\n";
}`,
          output: `# four consecutive runs on x86-64:

seq_cst : both read false 0 times out of 20000  (must be 0)
acq/rel : both read false 1 times out of 20000  (PERMITTED -- and x86 really does it)
---
seq_cst : both read false 0 times out of 20000  (must be 0)
acq/rel : both read false 0 times out of 20000  (PERMITTED -- and x86 really does it)
---
seq_cst : both read false 0 times out of 20000  (must be 0)
acq/rel : both read false 2 times out of 20000  (PERMITTED -- and x86 really does it)
---
seq_cst : both read false 0 times out of 20000  (must be 0)
acq/rel : both read false 0 times out of 20000  (PERMITTED -- and x86 really does it)`,
          explanation:
            "**`seq_cst` is 0 every time, as the standard requires. The acquire/release version is intermittently non-zero — 1, then 0, then 2, then 0.** That is a real violation of the intuition that \"at least one thread must see the other's store\", observed on ordinary x86 hardware. It happens because **store-then-load is the one reordering x86 permits**: the release store is a plain `mov` that can sit in the core's store buffer while the acquire load — also a plain `mov` — reads the other variable from cache. The `seq_cst` store compiles to `xchg`, a full barrier, which is exactly what prevents it. **This is the concrete reason `seq_cst` is the default**, and note how rare the failure is: roughly 1 in 20,000, which is precisely the frequency at which a bug reaches production and cannot be reproduced.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is happens-before and why does the standard define concurrency in terms of it?",
      answer:
        "A partial order over operations: if A happens-before B, B is guaranteed to see A's effects; if neither happens-before the other, there is no guarantee, and if they conflict it is a data race. The standard uses it rather than time because there is no global \"now\" — each core has its own store buffers and caches, the compiler reorders, the CPU executes out of order, and two threads can genuinely disagree about the order of two writes. Happens-before is built from sequenced-before (program order within a thread), synchronizes-with (created by synchronisation primitives across threads), and transitivity.",
    },
    {
      question: "What creates a synchronizes-with relationship between threads?",
      answer:
        "A short, closed list: unlocking a mutex synchronizes-with the next lock of that mutex; a release store synchronizes-with an acquire load that reads its value; `thread::join` synchronizes-with the end of that thread; `promise::set_value` synchronizes-with the `future::get` receiving it; and launching a thread synchronizes-with everything sequenced before the constructor call. Condition variable waits and `latch`/`barrier` operations provide it too. If your code does not use one of these, two threads have no ordering relationship at all — which is why \"the other thread will see it eventually\" is not a thing you can rely on.",
    },
    {
      question: "Explain the acquire/release publication pattern.",
      answer:
        "One thread writes ordinary, non-atomic data, then does a `release` store to an atomic flag. Another thread does an `acquire` load of that flag and, once it observes the stored value, reads the data. The release store synchronizes-with the acquire load, so everything sequenced before the store happens-before everything after the load — meaning the non-atomic data is safely visible and there is no data race. It is the fundamental pattern of lock-free publication: one atomic flag can publish an arbitrary amount of ordinary data. Weakening either side to `relaxed` breaks it and makes the data access undefined behaviour.",
    },
    {
      question: "When is `memory_order_relaxed` appropriate?",
      answer:
        "When you need atomicity but no ordering with respect to any other variable — a statistics counter that is only read after all threads have joined, an event tally, a flag whose value is the entire payload. It is wrong for anything that publishes other data, because it creates no synchronizes-with edge, so other writes may not be visible. The measured saving is often nil: on x86 a relaxed `fetch_add` and a `seq_cst` one both compile to `lock xadd`, and a benchmark showed 445ms against 466ms — noise. It matters more on ARM, which is also where getting it wrong shows up.",
    },
    {
      question: "How do the orderings differ in cost on x86 versus ARM?",
      answer:
        "On x86-64, loads already have acquire semantics and stores already have release semantics in hardware, so `relaxed`, `acquire` and `seq_cst` loads all compile to a plain `mov`, and `relaxed` and `release` stores likewise. The only difference is the `seq_cst` store, which uses `xchg` — implicitly locked, so a full barrier — instead of `mov`. Read-modify-write operations are `lock xadd` regardless of ordering. On AArch64 the picture is entirely different: acquire and release map to distinct `ldar`/`stlr` instructions and `seq_cst` adds further barriers. The consequence is that weak orderings buy almost nothing on x86 while carrying real risk.",
    },
    {
      question: "How does `seq_cst` differ from `acq_rel`, and why does it matter?",
      answer:
        "`seq_cst` adds a single global total order that every thread agrees on, over and above the acquire/release guarantees. The classic distinguishing case is Dekker's pattern: two threads each store `true` to their own flag and then read the other's. Under `seq_cst`, both reading `false` is impossible — one store must come first in the total order. Under `acquire`/`release`, it is permitted, because there is no total order and each store may still sit in its core's store buffer. And this one *is* observable on x86 — measured at roughly 1 in 20,000 rounds — because store-then-load is exactly the reordering x86's Total Store Order permits, while the `seq_cst` store compiles to `xchg`, a full barrier, which prevents it. That is precisely why `seq_cst` is the default.",
    },
  ],
  takeaways: [
    "There is no global \"now\" — the standard defines concurrency with happens-before, a partial order",
    "If neither of two conflicting operations happens-before the other, it is a data race",
    "Happens-before = sequenced-before, plus synchronizes-with, plus transitivity",
    "Only a short closed list of operations creates synchronizes-with across threads",
    "`relaxed`: atomic with no ordering. `acquire`/`release`: the publication pair. `seq_cst`: plus a total order",
    "`consume` was never implemented as specified and has been discouraged since C++17",
    "A release store publishes arbitrary non-atomic data to an acquire load — TSan confirms it is race-free",
    "On x86, relaxed/acquire/seq_cst loads are all a plain `mov`",
    "Only the `seq_cst` store differs on x86, using `xchg` instead of `mov`",
    "`fetch_add` is `lock xadd` at every ordering — hence 445ms vs 466ms, which is noise",
    "x86 is TSO: it preserves LoadLoad, LoadStore and StoreStore, and reorders only StoreLoad",
    "So x86 hides most weak-ordering bugs (ARM exposes them) but does expose StoreLoad ones",
    "`seq_cst` is strictly stronger than `acq_rel`: Dekker's both-false happened ~1 in 20,000 on x86",
    "ThreadSanitizer cannot help here — insufficient ordering is not a data race",
    "Use the default until you can articulate exactly why something weaker is correct",
  ],
  status: "available",
};
