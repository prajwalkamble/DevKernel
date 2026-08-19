import type { Lesson } from "@/content/types";

export const mutexesLesson: Lesson = {
  id: "cpp-mutexes",
  slug: "mutexes-lock-guards-and-deadlock",
  moduleSlug: "concurrency",
  title: "Mutexes, lock_guard, unique_lock, scoped_lock & Deadlock",
  summary:
    "The general answer for shared mutable state, and the failure it introduces. Which lock wrapper to reach for, a genuine deadlock demonstrated hanging until it is killed, and the two rules that make deadlock impossible rather than unlikely.",
  estimatedMinutes: 40,
  objectives: [
    "Choose between `lock_guard`, `unique_lock`, `scoped_lock` and `shared_lock`",
    "Protect an invariant spanning several members",
    "Explain the four conditions required for deadlock",
    "Use `scoped_lock` to acquire several mutexes safely",
    "State a lock hierarchy and know why it is a design property, not a code one",
  ],
  sections: [
    {
      id: "the-wrappers",
      heading: "Four wrappers, four jobs",
      body: [
        "**Never call `lock()` and `unlock()` by hand.** An early return, a `break`, or a thrown exception between them leaves the mutex locked forever, and every other thread blocks on it permanently. The RAII wrappers exist so that cannot happen — this is the same argument as `unique_ptr` versus `new`/`delete`.",
        "**`std::lock_guard`** — the default. Locks in the constructor, unlocks in the destructor, and offers nothing else. Prefer it whenever it suffices, precisely because it cannot be misused.",
        "**`std::unique_lock`** — when you need more: unlocking early, deferring the lock (`std::defer_lock`), trying rather than blocking, moving the lock out of the scope, or waiting on a condition variable, which *requires* it. It costs a bool of extra state to track ownership.",
        "**`std::scoped_lock`** (C++17) — locks **several** mutexes at once using a deadlock-avoidance algorithm. With one mutex it behaves like `lock_guard`; with several it is the only correct way. It replaced the older `std::lock(m1, m2)` plus `lock_guard{m, std::adopt_lock}` dance.",
        "**`std::shared_lock`** — with a `std::shared_mutex`, gives *shared* (reader) ownership, so many readers may hold it at once while a writer using `unique_lock` gets exclusive access. Worth using only when reads genuinely dominate, since a shared mutex is substantially more expensive than a plain one.",
        "**All four are class templates with deduction guides**, so write `std::lock_guard lk{m}` rather than `std::lock_guard<std::mutex> lk{m}`.",
      ],
      examples: [
        {
          id: "wrappers",
          title: "A class whose mutex protects an invariant across two members",
          lang: "cpp",
          code: `#include <chrono>
#include <iostream>
#include <mutex>
#include <shared_mutex>
#include <string>
#include <thread>
#include <vector>

using namespace std::chrono_literals;

class Account {
public:
    explicit Account(std::string name, int balance)
        : name_(std::move(name)), balance_(balance) {}

    // lock_guard: the common case.
    void deposit(int amount) {
        std::lock_guard lk{m_};
        balance_ += amount;
        ++transactions_;            // the invariant spans BOTH members
    }

    int balance() const {
        std::lock_guard lk{m_};
        return balance_;
    }

    // unique_lock: needed to unlock early.
    bool withdraw(int amount) {
        std::unique_lock lk{m_};
        if (balance_ < amount) return false;   // unlocks on the early return
        balance_ -= amount;
        ++transactions_;
        lk.unlock();                           // release BEFORE the slow bit
        std::this_thread::sleep_for(1ms);      // pretend: write an audit log
        return true;
    }

    int transactions() const { std::lock_guard lk{m_}; return transactions_; }

private:
    mutable std::mutex m_;     // mutable: lockable from const members
    std::string        name_;
    int                balance_;
    int                transactions_ = 0;
};

int main() {
    Account a{"alice", 1000};
    Account b{"bob", 1000};

    std::cout << "concurrent deposits into one account:\\n";
    {
        std::vector<std::jthread> ts;
        for (int i = 0; i < 4; ++i)
            ts.emplace_back([&]{ for (int j = 0; j < 1000; ++j) a.deposit(1); });
    }
    std::cout << "  alice balance = " << a.balance()
              << " (expected 5000), transactions = " << a.transactions() << '\\n';

    std::cout << "\\nwithdraw releases the lock before the slow work:\\n";
    std::cout << "  withdraw(500) = " << std::boolalpha << b.withdraw(500) << '\\n';
    std::cout << "  withdraw(9999) = " << b.withdraw(9999) << " (insufficient)\\n";
    std::cout << "  bob balance = " << b.balance() << '\\n';

    std::cout << "\\nshared_mutex: many readers OR one writer\\n";
    std::shared_mutex sm;
    int shared = 0;
    {
        std::vector<std::jthread> ts;
        for (int i = 0; i < 3; ++i)
            ts.emplace_back([&]{
                std::shared_lock lk{sm};              // reader
                (void)shared;
            });
        ts.emplace_back([&]{
            std::unique_lock lk{sm};                  // writer
            shared = 42;
        });
    }
    std::cout << "  shared = " << shared << '\\n';
}`,
          output: `concurrent deposits into one account:
  alice balance = 5000 (expected 5000), transactions = 4000

withdraw releases the lock before the slow work:
  withdraw(500) = true
  withdraw(9999) = false (insufficient)
  bob balance = 500

shared_mutex: many readers OR one writer
  shared = 42`,
          explanation:
            "**`balance_` and `transactions_` must change together, which is exactly why an atomic would not do here** — two atomics are two operations and another thread could observe the balance updated but not the count. The mutex covers the invariant, not the variable. Note `mutable std::mutex`, which is required so `balance() const` can lock it, and note `withdraw` unlocking before the simulated audit write: **holding a lock across slow work is the commonest cause of contention**, and `unique_lock` exists so you can avoid it.",
        },
      ],
      pitfalls: [
        {
          title: "`std::lock_guard lk{m};` — do not forget the variable name",
          body: "`std::lock_guard{m};` with no name creates a temporary that is destroyed at the end of the *statement*, so the mutex is locked and immediately unlocked and the code that follows is unprotected. It compiles silently. The same hazard applies to `std::scoped_lock{m1, m2};` and to any RAII type — `std::unique_ptr<T>{p};` leaks by the same mistake in reverse. GCC and Clang warn about some cases with `-Wunused-value`, but not reliably, so the habit of always naming the guard is the real defence.",
        },
      ],
    },
    {
      id: "deadlock",
      heading: "Deadlock",
      body: [
        "**Deadlock needs four conditions simultaneously**, and this is worth knowing because breaking any one of them prevents it:",
        "**Mutual exclusion** — the resource cannot be shared. **Hold and wait** — a thread holding one lock requests another. **No preemption** — a lock cannot be taken away. **Circular wait** — a cycle in the who-waits-for-whom graph.",
        "The first three are inherent to mutexes, so **in practice you prevent deadlock by breaking the circular wait**.",
        "The canonical form is two threads taking the same two mutexes in opposite orders: thread A holds `m1` and wants `m2`, thread B holds `m2` and wants `m1`, and neither can proceed. **Nothing detects this** — the threads simply stop, and the process hangs until it is killed.",
        "**It is timing-dependent, which makes it worse than a crash.** The window is often microseconds, so the code passes tests thousands of times and hangs in production under load. There is no exception, no core dump, and no message.",
        "The example below demonstrates a real one. It is run under `timeout 10` because it never finishes.",
      ],
      examples: [
        {
          id: "real-deadlock",
          title: "A deadlock, killed after ten seconds",
          lang: "cpp",
          code: `#include <chrono>
#include <iostream>
#include <mutex>
#include <thread>

using namespace std::chrono_literals;
std::mutex m1, m2;

// UNSAFE: two threads acquiring the same pair in OPPOSITE order.
void ab() {
    std::lock_guard a{m1};
    std::this_thread::sleep_for(1ms);       // widen the window
    std::lock_guard b{m2};
    std::cout << "  ab() acquired both\\n";
}
void ba() {
    std::lock_guard b{m2};
    std::this_thread::sleep_for(1ms);
    std::lock_guard a{m1};
    std::cout << "  ba() acquired both\\n";
}

int main() {
    std::cout << "starting two threads with opposite lock order...\\n" << std::flush;
    {
        std::jthread t1{ab};
        std::jthread t2{ba};
    }   // the joins here never return
    std::cout << "both threads finished\\n";
}`,
          output: `$ g++ -std=c++20 -Wall -Wextra -pthread deadlock.cpp && timeout 10 ./a.out
starting two threads with opposite lock order...
[exit 124]                       # 124 = killed by timeout

# Neither "acquired both" line ever printed, and "both threads finished"
# never printed. The process sat there until something killed it.`,
          explanation:
            "**No output, no error, no crash — the process simply stopped.** `ab()` took `m1` and waited for `m2`; `ba()` took `m2` and waited for `m1`. The `1ms` sleeps only widen the window to make it reliable; without them the same code deadlocks intermittently, which is far worse. Note that the `jthread` destructors are where the program hangs, since that is where the joins happen — so a deadlock inside a thread shows up as a hang in whatever scope owns it.",
        },
      ],
    },
    {
      id: "prevention",
      heading: "Preventing it",
      body: [
        "**`std::scoped_lock` solves the two-mutex case completely.** Given several mutexes it acquires them with an algorithm that cannot deadlock — typically try-lock-and-back-off — so **callers may pass them in any order**. Two threads using `scoped_lock{m1, m2}` and `scoped_lock{m2, m1}` are safe.",
        "That covers the case where one function needs two locks. It does not cover locks acquired across different functions or call layers, and for that you need a design rule.",
        "**A lock hierarchy** assigns every mutex a level and permits acquiring a lock only if it is strictly lower than every lock the thread already holds. That makes a cycle impossible by construction, because a cycle would require some lock to be both above and below another. It is enforceable at runtime with a wrapper mutex that tracks a thread-local current level and throws on violation.",
        "**The stronger rules, in order of preference:**",
        "**Hold one lock at a time.** If a function never holds two, deadlock is impossible. This is achievable more often than people expect, usually by copying data out under the lock and doing the work outside it.",
        "**Never call unknown code while holding a lock** — no user callbacks, no virtual functions, no `std::function` invocations. That code may take a lock you have never heard of, in an order you cannot see, and it is how deadlocks appear between modules that were each correct alone.",
        "**Keep critical sections short**, and never do I/O, allocation of unbounded size, or sleeping inside one.",
      ],
      examples: [
        {
          id: "scoped-lock",
          title: "Opposite order, 2000 rounds, no deadlock",
          lang: "cpp",
          code: `#include <chrono>
#include <iostream>
#include <mutex>
#include <thread>

using namespace std::chrono_literals;
std::mutex m1, m2;

// scoped_lock acquires BOTH atomically with a deadlock-avoidance algorithm,
// so the ORDER the caller writes them in does not matter.
void safeAB() { std::scoped_lock lk{m1, m2}; std::this_thread::sleep_for(1ms); }
void safeBA() { std::scoped_lock lk{m2, m1}; std::this_thread::sleep_for(1ms); }

int main() {
    std::cout << "opposite acquisition ORDER with scoped_lock, 2000 rounds:\\n";
    for (int i = 0; i < 2000; ++i) {
        std::jthread t1{safeAB};
        std::jthread t2{safeBA};
    }
    std::cout << "  completed -- scoped_lock cannot deadlock\\n";
}`,
          output: `opposite acquisition ORDER with scoped_lock, 2000 rounds:
  completed -- scoped_lock cannot deadlock`,
          explanation:
            "**The identical pattern that hung forever with `lock_guard` ran 2000 times without incident.** `scoped_lock` does not require the caller to agree on an order because it imposes one internally — it will acquire, and if it cannot get all of them, release everything and retry rather than holding one and waiting. That is what breaks the hold-and-wait condition. Use it whenever a function needs more than one mutex, and never take two `lock_guard`s in sequence.",
        },
        {
          id: "hierarchy",
          title: "A lock hierarchy that catches violations at runtime",
          lang: "cpp",
          code: `#include <climits>
#include <iostream>
#include <mutex>
#include <stdexcept>
#include <thread>

// A mutex that enforces a global ordering. Acquiring a lock whose level is
// not strictly lower than everything you already hold is an immediate error
// rather than a deadlock ten thousand requests later.
class HierarchicalMutex {
public:
    explicit HierarchicalMutex(unsigned level) : level_(level) {}

    void lock() {
        check();
        m_.lock();
        previous_ = current_;
        current_  = level_;
    }
    void unlock() {
        current_ = previous_;
        m_.unlock();
    }
    bool try_lock() {
        check();
        if (!m_.try_lock()) return false;
        previous_ = current_;
        current_  = level_;
        return true;
    }

private:
    void check() const {
        if (current_ <= level_)
            throw std::logic_error("lock hierarchy violated: holding level "
                                   + std::to_string(current_)
                                   + ", requested level " + std::to_string(level_));
    }

    std::mutex m_;
    unsigned   level_;
    unsigned   previous_ = 0;
    static thread_local unsigned current_;
};

thread_local unsigned HierarchicalMutex::current_ = UINT_MAX;

HierarchicalMutex high{10000};
HierarchicalMutex low{5000};

int main() {
    std::cout << "high then low (correct order):\\n";
    {
        std::lock_guard a{high};
        std::lock_guard b{low};
        std::cout << "  acquired both\\n";
    }

    std::cout << "\\nlow then high (violates the hierarchy):\\n";
    try {
        std::lock_guard a{low};
        std::lock_guard b{high};      // throws immediately
        std::cout << "  acquired both\\n";
    } catch (const std::logic_error& e) {
        std::cout << "  rejected: " << e.what() << '\\n';
    }

    std::cout << "\\nthe violation is caught the FIRST time it is written,\\n"
                 "not the first time two threads happen to interleave.\\n";
}`,
          output: `high then low (correct order):
  acquired both

low then high (violates the hierarchy):
  rejected: lock hierarchy violated: holding level 5000, requested level 10000

the violation is caught the FIRST time it is written,
not the first time two threads happen to interleave.`,
          explanation:
            "**The wrong order threw on a single thread, with no concurrency involved at all.** That is the property worth paying for: a lock-ordering bug becomes a deterministic, reproducible exception at the moment the code runs, rather than an intermittent hang that needs two threads to interleave badly. `thread_local` holds the current level per thread, and it works with `lock_guard` and `scoped_lock` because those only require `lock()`, `unlock()` and `try_lock()`.",
        },
      ],
      pitfalls: [
        {
          title: "Calling a callback while holding a lock is how modules deadlock each other",
          body: "A class that invokes a user-supplied `std::function` inside its critical section has published an invitation to deadlock: the callback may lock something else, and another thread taking those two in the other order completes the cycle. Neither module is wrong alone. The fix is to copy what you need under the lock, release it, and *then* call out — or to collect the callbacks under the lock and invoke them after the guard's scope. The same applies to virtual functions, operators on user types, and anything that allocates with a custom allocator.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When would you use `unique_lock` instead of `lock_guard`?",
      answer:
        "When you need something `lock_guard` deliberately does not offer: unlocking early so a slow operation happens outside the critical section, deferring acquisition with `std::defer_lock`, trying rather than blocking, moving lock ownership out of the scope, or waiting on a condition variable — which requires `unique_lock` because `wait` must unlock and relock. It carries a bool of extra state to track ownership, so prefer `lock_guard` whenever it suffices, on the principle that the more limited tool cannot be misused.",
    },
    {
      question: "What does `std::scoped_lock` do that taking two `lock_guard`s does not?",
      answer:
        "It acquires several mutexes together using a deadlock-avoidance algorithm — typically locking one and try-locking the rest, releasing everything and retrying on failure — so it never holds one while blocking on another. That breaks the hold-and-wait condition, which means callers do not have to agree on an ordering: `scoped_lock{m1, m2}` in one thread and `scoped_lock{m2, m1}` in another are safe. Two sequential `lock_guard`s in opposite orders deadlock reliably. With a single mutex, `scoped_lock` behaves exactly like `lock_guard`.",
    },
    {
      question: "What four conditions are required for deadlock?",
      answer:
        "Mutual exclusion, hold-and-wait, no preemption, and circular wait — all four simultaneously. The first three are inherent to how mutexes work, so in practice you prevent deadlock by breaking the circular wait: either with `scoped_lock`, which acquires several at once without holding-and-waiting, or with a lock hierarchy that makes a cycle impossible by construction. The reason deadlock is worse than a crash is that nothing detects it: the threads simply stop, with no exception, no core dump and no message, and the process hangs until something kills it.",
    },
    {
      question: "What is a lock hierarchy?",
      answer:
        "A design rule assigning every mutex a numeric level, permitting a thread to acquire a lock only if its level is strictly lower than every lock it already holds. A cycle then becomes impossible, since it would require some lock to be both above and below another. It can be enforced at runtime with a wrapper mutex that tracks the current level in a `thread_local` and throws on violation — which turns a lock-ordering bug into a deterministic exception on a single thread, at the moment the offending code first runs, rather than an intermittent hang requiring two threads to interleave badly.",
    },
    {
      question: "Why should you never call unknown code while holding a lock?",
      answer:
        "Because you cannot know what locks it takes. A class invoking a user-supplied callback, a virtual function, or a `std::function` inside its critical section may end up holding its own mutex while the callee acquires another — and another thread taking those two in the opposite order completes a cycle. Neither module is incorrect in isolation, which makes the bug very hard to attribute. The fix is to copy what you need under the lock, release it, and then call out; or to collect the callbacks under the lock and invoke them after the guard's scope ends.",
    },
    {
      question: "When is `shared_mutex` worth using?",
      answer:
        "Only when reads genuinely dominate writes and the critical sections are long enough to matter. A `shared_mutex` is substantially more expensive to acquire than a plain `mutex` even in the uncontended case, because it maintains reader counts, so for short critical sections a plain mutex is usually faster despite serialising the readers. It also risks writer starvation depending on the implementation's fairness policy. Measure before adopting it; the common mistake is reaching for it on the assumption that allowing concurrent readers must be faster.",
    },
  ],
  takeaways: [
    "Never call `lock()`/`unlock()` by hand — an early return or throw leaves the mutex held forever",
    "`lock_guard` is the default; prefer it because it cannot be misused",
    "`unique_lock` for early unlock, deferred locking, moving, or condition variables",
    "`scoped_lock` for several mutexes at once, and it cannot deadlock",
    "`shared_lock` with `shared_mutex` for many readers — only when reads dominate",
    "`std::lock_guard{m};` with no variable name locks and immediately unlocks",
    "A mutex protects an invariant, not a variable — that is why atomics do not substitute",
    "Declare the mutex `mutable` so `const` member functions can lock it",
    "Deadlock needs mutual exclusion, hold-and-wait, no preemption, and circular wait",
    "The first three are inherent, so break the circular wait",
    "A deadlock produces no output, no exception and no crash — just a hang",
    "`scoped_lock` lets callers pass mutexes in any order safely",
    "A lock hierarchy turns an ordering bug into a deterministic single-threaded exception",
    "Never invoke a callback, virtual function or unknown code while holding a lock",
  ],
  status: "available",
};
