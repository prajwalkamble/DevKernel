import type { Lesson } from "@/content/types";

export const dataRacesLesson: Lesson = {
  id: "cpp-data-races",
  slug: "data-races-and-what-the-standard-says",
  moduleSlug: "concurrency",
  title: "Data Races & What the Standard Actually Says About Them",
  summary:
    "The precise definition, and why a data race is undefined behaviour rather than a wrong answer. The same racy program losing 178,000 updates at `-O0` and printing a perfect result at `-O2` — because the optimiser turned the loop into one instruction — with ThreadSanitizer catching it either way.",
  estimatedMinutes: 35,
  objectives: [
    "State the standard's definition of a data race",
    "Explain why it is undefined behaviour rather than an unspecified result",
    "Say why testing cannot establish the absence of a race",
    "Read a ThreadSanitizer report",
    "List the ways to make concurrent access well-defined",
  ],
  sections: [
    {
      id: "definition",
      heading: "The definition",
      body: [
        "The standard's definition is precise and worth learning exactly. **A data race occurs when two accesses to the same memory location from different threads are not ordered by a happens-before relationship, and at least one of them is a write.**",
        "Four conditions, all required: **same location**, **different threads**, **at least one write**, and **no happens-before ordering**. Remove any one and there is no race.",
        "That is why **two threads reading the same `const` data is fine** — no write. Why **a thread writing to memory only it can see is fine** — one thread. And why **two threads writing the same variable under the same mutex is fine** — the mutex establishes happens-before.",
        "**\"Memory location\" is defined precisely too**, and the definition matters: separate scalar objects, and separate non-zero-width bit-fields, are separate locations. So concurrent writes to **different elements of the same `std::vector<int>`** are safe, and to **adjacent bit-fields in one struct** are a race. Adjacent `bool` members are separate locations and are safe — though false sharing makes it slow, which lesson 6 returns to.",
        "**A data race is undefined behaviour.** Not \"you get one of the two values\", not \"the result is unspecified\" — the entire program is meaningless, and the optimiser is entitled to assume it never happens. That is a stronger and more dangerous statement than most people realise.",
      ],
      examples: [
        {
          id: "race-demo",
          title: "The same race at two optimisation levels",
          lang: "cpp",
          code: `#include <atomic>
#include <iostream>
#include <thread>
#include <vector>

int              plain = 0;   // UNSYNCHRONISED -- a data race
std::atomic<int> safe  = 0;   // synchronised

constexpr int THREADS    = 4;
constexpr int PER_THREAD = 100000;

int main() {
    {
        std::vector<std::jthread> ts;
        for (int i = 0; i < THREADS; ++i)
            ts.emplace_back([]{ for (int j = 0; j < PER_THREAD; ++j) ++plain; });
    }
    {
        std::vector<std::jthread> ts;
        for (int i = 0; i < THREADS; ++i)
            ts.emplace_back([]{ for (int j = 0; j < PER_THREAD; ++j) ++safe; });
    }

    const int expected = THREADS * PER_THREAD;
    std::cout << "expected           : " << expected << '\\n';
    std::cout << "plain int (racy)   : " << plain << '\\n';
    std::cout << "atomic<int>        : " << safe.load() << '\\n';
    std::cout << "lost updates       : " << (expected - plain) << '\\n';
}`,
          output: `$ g++ -std=c++20 -O0 -pthread && ./a.out
expected           : 400000
plain int (racy)   : 221496
atomic<int>        : 400000
lost updates       : 178504

$ g++ -std=c++20 -O2 -pthread && ./a.out          # three runs
plain int (racy)   : 400000     lost updates : 0
plain int (racy)   : 400000     lost updates : 0
plain int (racy)   : 400000     lost updates : 0

$ g++ -std=c++20 -O2 -S -masm=intel               # why -O2 "worked"
        add     DWORD PTR plain[rip], 100000      # the whole loop, one add`,
          explanation:
            "**At `-O0` the race lost 178,504 of 400,000 updates. At `-O2` it produced a perfect answer three times running — and the code is exactly as broken.** The disassembly explains it: the optimiser proved the loop just adds 100,000 and emitted a single instruction, shrinking the race window to almost nothing. A test suite built with optimisation would have passed. **This is the central fact about data races: the observable symptom depends on the compiler, the optimisation level, the hardware and the timing, so a passing test tells you nothing at all.**",
        },
      ],
    },
    {
      id: "why-ub",
      heading: "Why it is undefined behaviour",
      body: [
        "It would have been possible for the standard to say a racy read yields *some* value written by *some* thread. It deliberately says something much stronger, and the reason is that anything weaker would make optimisation impossible.",
        "**A compiler optimises single-threaded code by assuming nothing else touches its variables.** It hoists loads out of loops, keeps values in registers across statements, reorders independent operations, fuses adjacent writes, and invents speculative reads. Every one of those transformations is invalid if another thread might observe the intermediate states.",
        "So the bargain is: **you promise not to race, and in exchange the compiler optimises your code as if it were single-threaded.** Break the promise and the transformations it already applied become nonsense.",
        "That produces failure modes that surprise people who expect \"just a torn value\":",
        "**A racy loop may never terminate**, because the compiler hoisted the flag read out of the loop and it reads a stale register forever.",
        "**A value may be read twice and differ**, because the compiler re-loaded it rather than caching.",
        "**A write may be invented.** The compiler is allowed to introduce a write to a location it can prove you would write anyway, which can clobber another thread's value.",
        "**The race may corrupt something unrelated**, because undefined behaviour is not confined to the racing variable.",
        "This is why \"it's only an `int`, the worst case is a slightly wrong count\" is wrong reasoning. **There is no worst case.**",
      ],
      examples: [
        {
          id: "hoisted-flag",
          title: "The infinite loop a race can produce",
          lang: "cpp",
          code: `#include <atomic>
#include <chrono>
#include <iostream>
#include <thread>

using namespace std::chrono_literals;

bool             plainFlag  = false;   // racy
std::atomic<bool> atomicFlag = false;  // correct

int main() {
    // CORRECT: the atomic read cannot be hoisted out of the loop.
    {
        std::jthread setter{[]{
            std::this_thread::sleep_for(20ms);
            atomicFlag = true;
        }};
        while (!atomicFlag.load()) { /* spin */ }
        std::cout << "atomic flag observed -- loop exited\\n";
    }

    // The racy version is shown but NOT run, because at -O2 the compiler
    // may hoist the load of plainFlag out of the loop entirely:
    //
    //     while (!plainFlag) { }
    //
    // becomes, legitimately:
    //
    //     if (!plainFlag) { for (;;) { } }
    //
    // The thread never observes the write and the program hangs forever.
    // This is not hypothetical -- it is the single most common way a data
    // race manifests, and it is why 'volatile' is NOT the fix either:
    // volatile prevents the hoist but provides no ordering or atomicity.

    std::cout << "plainFlag is still " << std::boolalpha << plainFlag << '\\n';
    std::cout << "\\nuse std::atomic for flags, never a plain bool,\\n"
                 "and never 'volatile' -- it is for memory-mapped I/O.\\n";
}`,
          output: `atomic flag observed -- loop exited
plainFlag is still false

use std::atomic for flags, never a plain bool,
and never 'volatile' -- it is for memory-mapped I/O.`,
          explanation:
            "**The racy loop is described rather than run, because a program that hangs forever is a poor example to ship.** The transformation shown is entirely legal: with no synchronisation, the compiler may assume `plainFlag` cannot change during the loop, load it once, and turn the loop into an infinite one. **`volatile` is not the fix** — it forces the reload but provides neither atomicity nor ordering with respect to other variables, and using it for threading is a C-era habit the C++ memory model replaced. `std::atomic` is the answer.",
        },
      ],
    },
    {
      id: "tsan",
      heading: "ThreadSanitizer",
      body: [
        "Since testing cannot prove the absence of a race, you need a tool that reasons about *ordering* rather than outcomes. **ThreadSanitizer instruments every memory access and maintains a happens-before graph**, so it reports a race when it sees two unordered conflicting accesses — whether or not the timing happened to produce a wrong answer.",
        "That is the crucial property: **TSan found the race in the `-O2` build that printed the correct answer.** It is not sampling for bad luck; it is checking the definition.",
        "**Build with `-fsanitize=thread -g`.** It costs roughly 5–15× in runtime and 5–10× in memory, so it is a CI and test-suite tool, not a production one. It cannot be combined with AddressSanitizer in the same binary — run separate builds.",
        "**Reading a report**: it gives the two conflicting accesses with stack traces, says which was the read and which the write, names the location — `global 'plain'`, or a heap allocation with its allocating stack — and shows where each thread was created. The first two frames of each stack are almost always the ones you need.",
        "**Its limitation is coverage, not accuracy.** TSan reports races on code paths that actually execute, so a race in a branch your tests never take will not be found. It has essentially no false positives, which means **every report is worth fixing**.",
      ],
      examples: [
        {
          id: "tsan-report",
          title: "The report for the racy counter",
          lang: "bash",
          code: `$ g++ -std=c++20 -fsanitize=thread -g -pthread race.cpp -o race
$ ./race

WARNING: ThreadSanitizer: data race (pid=91964)
  Read of size 4 at 0x56503b418294 by thread T2:
    #0 operator() race.cpp:16
    #1 __invoke_impl<...> /usr/include/c++/14/bits/invoke.h:61
    #2 _M_invoke<0>     /usr/include/c++/14/bits/std_thread.h:301
    ...

  Previous write of size 4 at 0x56503b418294 by thread T1:
    #0 operator() race.cpp:16
    #1 __invoke_impl<...> /usr/include/c++/14/bits/invoke.h:61
    ...

  Location is global 'plain' of size 4 at 0x56503b418294

  Thread T2 (tid=91968, running) created by main thread at:
    #0 pthread_create
    ...

SUMMARY: ThreadSanitizer: data race race.cpp:16 in operator()

# Note: this is the -O2 build, the one that printed the CORRECT answer.`,
          output: `# Read the four facts in order:
#   1. what kind of access   -> "Read of size 4"
#   2. which thread          -> "by thread T2"
#   3. what it conflicts with-> "Previous write ... by thread T1"
#   4. which object          -> "Location is global 'plain'"`,
          explanation:
            "**Both stacks point at `race.cpp:16`, which is the `++plain` inside the lambda** — the same line racing with itself across two threads, which is the commonest shape. The `Location is global 'plain'` line names the object directly; for heap data it instead shows the allocation stack, which is usually more useful. Ignore the `__invoke_impl` and `_M_invoke` frames — those are the standard library's thread-launch machinery and appear in every report.",
        },
      ],
      pitfalls: [
        {
          title: "A clean TSan run does not mean the code is race-free",
          body: "TSan only sees the memory accesses that actually happened in that execution. A race in an error path your test never triggers, in a branch only taken under load, or between threads that never happened to interleave in that run, will not be reported. The mitigations are running your whole test suite under TSan rather than one scenario, adding stress tests that exercise the concurrent paths deliberately, and — most effectively — designing so that shared mutable state is rare enough to review by hand. TSan is excellent at confirming a race exists and cannot confirm one does not.",
        },
      ],
    },
    {
      id: "avoiding",
      heading: "The ways out",
      body: [
        "There are exactly four ways to make concurrent access to data well-defined, and they are worth ranking, because the order is roughly the order you should try them.",
        "**Do not share.** Give each thread its own data and combine the results at the end. No shared mutable state means no possible race, and it is usually faster than any synchronisation because there is no contention or cache-line ping-pong. This is the answer far more often than people assume.",
        "**Share only immutable data.** Concurrent reads are not a race. `const` data, or data written once before any thread starts and never modified after, needs no synchronisation at all.",
        "**Use a mutex.** The general answer for anything more complex than a single scalar — and the only workable answer when an invariant spans several variables. Lesson 3.",
        "**Use atomics.** For a single scalar with no invariant relating it to anything else: counters, flags, sequence numbers. Correct and fast, but they do not compose — two atomic operations are not one atomic operation. Lesson 6.",
        "**And one non-answer: `volatile` is not a threading primitive in C++.** It prevents the compiler from eliding accesses, which was enough on some single-core compilers decades ago. It provides no atomicity and no ordering with respect to other variables, so a `volatile` shared counter is still a data race. Its correct use is memory-mapped hardware registers and signal handlers.",
      ],
      examples: [
        {
          id: "dont-share",
          title: "The best fix is usually not sharing at all",
          lang: "cpp",
          code: `#include <atomic>
#include <chrono>
#include <iostream>
#include <mutex>
#include <numeric>
#include <thread>
#include <vector>

template <typename F>
long long timeMs(F f) {
    auto t0 = std::chrono::steady_clock::now();
    f();
    auto t1 = std::chrono::steady_clock::now();
    return std::chrono::duration_cast<std::chrono::milliseconds>(t1 - t0).count();
}

constexpr int THREADS = 4;
constexpr int PER     = 2000000;

int main() {
    // 1. Mutex: correct, but every increment contends.
    long long mutexTotal = 0;
    std::mutex m;
    auto mutexMs = timeMs([&]{
        std::vector<std::jthread> ts;
        for (int i = 0; i < THREADS; ++i) ts.emplace_back([&]{
            for (int j = 0; j < PER; ++j) {
                std::lock_guard lk{m};
                ++mutexTotal;
            }
        });
    });

    // 2. Atomic: correct, cheaper, but still one contended cache line.
    std::atomic<long long> atomicTotal = 0;
    auto atomicMs = timeMs([&]{
        std::vector<std::jthread> ts;
        for (int i = 0; i < THREADS; ++i) ts.emplace_back([&]{
            for (int j = 0; j < PER; ++j) ++atomicTotal;
        });
    });

    // 3. Do not share: each thread owns its counter, combine at the end.
    std::vector<long long> partials(THREADS, 0);
    auto privateMs = timeMs([&]{
        std::vector<std::jthread> ts;
        for (int i = 0; i < THREADS; ++i) ts.emplace_back([&, i]{
            long long local = 0;                 // a REGISTER, not shared memory
            for (int j = 0; j < PER; ++j) ++local;
            partials[static_cast<std::size_t>(i)] = local;   // one write, at the end
        });
    });
    long long privateTotal = std::accumulate(partials.begin(), partials.end(), 0LL);

    const long long expected = 1LL * THREADS * PER;
    std::cout << "expected      : " << expected << '\\n';
    std::cout << "mutex         : " << mutexTotal  << "  in " << mutexMs  << " ms\\n";
    std::cout << "atomic        : " << atomicTotal << "  in " << atomicMs << " ms\\n";
    std::cout << "thread-private: " << privateTotal<< "  in " << privateMs<< " ms\\n";
}`,
          output: `expected      : 8000000
mutex         : 8000000  in 1668 ms
atomic        : 8000000  in 313 ms
thread-private: 8000000  in 0 ms`,
          explanation:
            "**All three are correct and the un-shared version is effectively free.** The local counter lives in a register with no synchronisation, no contention and no cache-line traffic, and only one write to shared memory happens per thread at the very end. The mutex version is over five times slower than the atomic, and the atomic is immeasurably slower than not sharing at all — and note the thread-private write to `partials[i]` is safe because **different elements of a vector are different memory locations**. Reach for synchronisation only after establishing that sharing is genuinely necessary. (One 4-core machine at `-O2`; the ordering is the point, not the figures.)",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the standard's definition of a data race?",
      answer:
        "Two accesses to the same memory location, from different threads, not ordered by a happens-before relationship, where at least one is a write. All four conditions are required, which is why concurrent reads of `const` data are fine, why single-threaded access is fine, and why two threads writing under the same mutex are fine — the mutex supplies the ordering. \"Memory location\" is itself defined: separate scalar objects and separate non-zero-width bit-fields are separate locations, so concurrent writes to different elements of a `vector<int>` are safe while concurrent writes to adjacent bit-fields are a race.",
    },
    {
      question: "Why is a data race undefined behaviour rather than just an unspecified value?",
      answer:
        "Because anything weaker would prevent optimisation. Compilers transform single-threaded code by assuming nothing else touches its variables — hoisting loads out of loops, keeping values in registers, reordering independent operations, even inventing speculative writes. All of those are invalid if another thread can observe intermediate states. The bargain is that you promise not to race and the compiler optimises as if the code were single-threaded. Break it and the failure modes go well beyond a torn value: a racy loop can become infinite because the flag read was hoisted, a value read twice can differ, and corruption can appear in unrelated data.",
    },
    {
      question: "Why can't you test for the absence of a data race?",
      answer:
        "Because whether a race produces a visible symptom depends on the compiler, optimisation level, hardware and timing. The same racy counter loses 178,504 of 400,000 increments at `-O0` and produces a perfect 400,000 at `-O2` across repeated runs — because the optimiser proved the loop adds 100,000 and emitted a single `add` instruction, collapsing the race window. The code is equally broken in both builds. A test suite compiled with optimisation would have passed. You need a tool that checks the *definition* — unordered conflicting accesses — rather than sampling outcomes, which is what ThreadSanitizer does.",
    },
    {
      question: "How does ThreadSanitizer work and what are its limits?",
      answer:
        "It instruments every memory access and maintains a happens-before graph, reporting a race whenever it observes two conflicting unordered accesses — regardless of whether the timing produced a wrong result. That is why it catches races in builds that print correct answers. It costs roughly 5–15× runtime and 5–10× memory, so it belongs in CI rather than production, and it cannot be combined with AddressSanitizer in one binary. Its limitation is coverage: it only sees accesses that actually executed, so a race on an untaken branch goes unreported. It has essentially no false positives, so every report is real.",
    },
    {
      question: "What are the ways to make concurrent access well-defined?",
      answer:
        "Four, roughly in the order you should try them. Do not share — give each thread its own data and combine at the end, which eliminates the possibility and is usually fastest since there is no contention. Share only immutable data, since concurrent reads are not a race. Use a mutex, which is the general answer and the only workable one when an invariant spans several variables. Use atomics for a single scalar with no invariant tying it to anything else. Measured on four threads incrementing eight million times, a mutex took 1668ms, an atomic 313ms, and thread-private counters combined at the end were effectively instantaneous.",
    },
    {
      question: "Is `volatile` useful for multithreading in C++?",
      answer:
        "No. `volatile` tells the compiler not to elide or cache accesses to an object, which was sometimes sufficient on single-core machines with simple compilers. It provides no atomicity — a `volatile` increment is still a read-modify-write that can interleave — and no ordering with respect to other variables, so it cannot establish happens-before. A shared `volatile` counter is still a data race and still undefined behaviour. Its correct uses are memory-mapped hardware registers, and variables touched by signal handlers via `volatile std::sig_atomic_t`. For threading, use `std::atomic`.",
    },
  ],
  takeaways: [
    "A data race: same location, different threads, at least one write, no happens-before ordering",
    "Remove any one of those four conditions and there is no race",
    "Different elements of a `vector` are different memory locations; adjacent bit-fields are not",
    "A data race is undefined behaviour — not a torn value, not an unspecified result",
    "The bargain is that you promise not to race and the compiler optimises as if single-threaded",
    "A racy flag loop can become infinite, because the load was hoisted out",
    "The same race lost 178,504 updates at `-O0` and lost none at `-O2`",
    "At `-O2` the whole loop became one `add` instruction, collapsing the race window",
    "So a passing test proves nothing — you need a tool that checks ordering, not outcomes",
    "ThreadSanitizer builds a happens-before graph and found the race in the build that printed the right answer",
    "TSan has no false positives but limited coverage — a clean run is not proof",
    "Prefer not sharing, then immutable sharing, then mutexes, then atomics",
    "`volatile` is not a threading primitive — no atomicity, no ordering",
  ],
  status: "available",
};
